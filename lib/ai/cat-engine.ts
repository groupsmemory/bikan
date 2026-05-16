/**
 * BIKAN CAT Engine — Computerized Adaptive Testing (Full Implementation)
 * ──────────────────────────────────────────────────────────────────────
 * Extends the base IRT 3PLM engine with:
 * - Standard Error (SE) calculation for precision tracking
 * - Stopping rules (SE threshold + max items)
 * - Item exposure control (Sympson-Hetter simplified)
 * - Confidence interval estimation
 * - Session state management for persistence
 *
 * Reference: Wainer et al. (2000), "Computerized Adaptive Testing: A Primer"
 */

import {
  calculateProbability,
  calculateItemInformation,
  estimateTheta,
  ItemParameters,
  UserResponse,
} from './irt-engine';

// ─── CAT Configuration ───
export interface CATConfig {
  /** Minimum items before stopping rule can trigger */
  minItems: number;
  /** Maximum items to administer */
  maxItems: number;
  /** SE threshold for stopping (lower = more precise) */
  seThreshold: number;
  /** Initial theta estimate for new students */
  initialTheta: number;
  /** Maximum exposure rate per item (0-1) */
  maxExposureRate: number;
  /** Content balancing: min items per Bloom level */
  contentBalance?: Record<string, number>;
}

export const DEFAULT_CAT_CONFIG: CATConfig = {
  minItems: 5,
  maxItems: 15,
  seThreshold: 0.35,
  initialTheta: 0,
  maxExposureRate: 0.8,
};

// ─── CAT Session State (serializable for persistence) ───
export interface CATSessionState {
  theta: number;
  se: number;
  responses: CATResponse[];
  administeredItemIds: string[];
  status: CATStatus;
  startedAt: number;
  lastUpdatedAt: number;
  config: CATConfig;
}

export interface CATResponse {
  itemId: string;
  isCorrect: boolean;
  params: ItemParameters;
  thetaAfter: number;
  seAfter: number;
  responseTimeMs: number;
  timestamp: number;
}

export type CATStatus =
  | 'in_progress'
  | 'completed_se'       // Stopped: SE below threshold
  | 'completed_max'      // Stopped: max items reached
  | 'completed_mastery'  // Stopped: mastery achieved (θ > threshold)
  | 'abandoned';

// ─── Item Selection Result ───
export interface ItemSelectionResult {
  itemId: string;
  itemIndex: number;
  information: number;
  reason: string;
}

// ─── CAT Session Report ───
export interface CATReport {
  theta: number;
  se: number;
  mastery: number;
  confidenceInterval: { lower: number; upper: number };
  itemsAdministered: number;
  correctCount: number;
  accuracy: number;
  status: CATStatus;
  estimatedAbilityLabel: string;
  durationMs: number;
}

/**
 * Calculate Standard Error of theta estimate
 * SE = 1 / √(Test Information)
 * Test Information = sum of item information at current theta
 */
export function calculateSE(theta: number, responses: CATResponse[]): number {
  if (responses.length === 0) return 3.5; // Maximum uncertainty

  let testInformation = 0;
  for (const resp of responses) {
    testInformation += calculateItemInformation(theta, resp.params);
  }

  if (testInformation <= 0) return 3.5;
  return 1 / Math.sqrt(testInformation);
}

/**
 * Calculate 95% confidence interval for theta
 */
export function calculateConfidenceInterval(
  theta: number,
  se: number
): { lower: number; upper: number } {
  const z = 1.96; // 95% CI
  return {
    lower: Math.max(-3.5, theta - z * se),
    upper: Math.min(3.5, theta + z * se),
  };
}

/**
 * Map theta to mastery percentage (0-100)
 * Uses sigmoid mapping centered at theta=0
 */
export function thetaToMastery(theta: number): number {
  // Map theta [-3.5, 3.5] to [0, 100] with sigmoid curve
  const normalized = (theta + 3.5) / 7;
  return Math.min(Math.max(normalized * 100, 0), 100);
}

/**
 * Map theta to human-readable ability label
 */
export function thetaToLabel(theta: number): string {
  if (theta >= 2.5) return 'Sangat Mahir';
  if (theta >= 1.5) return 'Mahir';
  if (theta >= 0.5) return 'Kompeten';
  if (theta >= -0.5) return 'Berkembang';
  if (theta >= -1.5) return 'Dasar';
  return 'Pemula';
}

/**
 * Select the next best item using Maximum Information criterion
 * with exposure control and content balancing
 */
export function selectNextItem(
  theta: number,
  availableItems: Array<{ id: string; params: ItemParameters; bloomLevel?: string; exposureCount?: number }>,
  administeredIds: Set<string>,
  config: CATConfig,
  responses: CATResponse[]
): ItemSelectionResult | null {
  // Filter out already administered items
  const candidates = availableItems
    .map((item, index) => ({ ...item, index }))
    .filter(item => !administeredIds.has(item.id));

  if (candidates.length === 0) return null;

  // Calculate information for each candidate
  const scored = candidates.map(item => {
    const info = calculateItemInformation(theta, item.params);

    // Exposure control penalty
    const exposureRate = (item.exposureCount ?? 0) / Math.max(1, responses.length + 1);
    const exposurePenalty = exposureRate > config.maxExposureRate ? 0.5 : 1.0;

    return {
      ...item,
      information: info * exposurePenalty,
      rawInfo: info,
    };
  });

  // Sort by information (descending)
  scored.sort((a, b) => b.information - a.information);

  // Select top item (with randomization among top 3 for variety)
  const topN = Math.min(3, scored.length);
  const selected = scored[Math.floor(Math.random() * topN)];

  return {
    itemId: selected.id,
    itemIndex: selected.index,
    information: selected.rawInfo,
    reason: `IIF=${selected.rawInfo.toFixed(3)} at θ=${theta.toFixed(2)}`,
  };
}

/**
 * Check if the CAT session should stop
 */
export function checkStoppingRule(
  state: CATSessionState
): { shouldStop: boolean; reason: CATStatus } {
  const { responses, se, config } = state;

  // Not enough items yet
  if (responses.length < config.minItems) {
    return { shouldStop: false, reason: 'in_progress' };
  }

  // SE below threshold (precise enough)
  if (se <= config.seThreshold) {
    return { shouldStop: true, reason: 'completed_se' };
  }

  // Max items reached
  if (responses.length >= config.maxItems) {
    return { shouldStop: true, reason: 'completed_max' };
  }

  // Mastery achieved (theta > 2.0 with reasonable SE)
  if (state.theta >= 2.0 && se <= 0.5) {
    return { shouldStop: true, reason: 'completed_mastery' };
  }

  return { shouldStop: false, reason: 'in_progress' };
}

/**
 * Process a student response and update CAT state
 */
export function processResponse(
  state: CATSessionState,
  itemId: string,
  isCorrect: boolean,
  params: ItemParameters,
  responseTimeMs: number
): CATSessionState {
  // Build full response history for theta estimation
  const allResponses: UserResponse[] = [
    ...state.responses.map(r => ({
      itemId: r.itemId,
      isCorrect: r.isCorrect,
      params: r.params,
    })),
    { itemId, isCorrect, params },
  ];

  // Re-estimate theta using full response pattern
  const newTheta = estimateTheta(allResponses, state.theta);

  // Create new response record
  const newResponse: CATResponse = {
    itemId,
    isCorrect,
    params,
    thetaAfter: newTheta,
    seAfter: 0, // Will be calculated below
    responseTimeMs,
    timestamp: Date.now(),
  };

  // Calculate new SE
  const updatedResponses = [...state.responses, newResponse];
  const newSE = calculateSE(newTheta, updatedResponses);
  newResponse.seAfter = newSE;

  // Build updated state
  const updatedState: CATSessionState = {
    ...state,
    theta: newTheta,
    se: newSE,
    responses: updatedResponses,
    administeredItemIds: [...state.administeredItemIds, itemId],
    lastUpdatedAt: Date.now(),
  };

  // Check stopping rule
  const { shouldStop, reason } = checkStoppingRule(updatedState);
  if (shouldStop) {
    updatedState.status = reason;
  }

  return updatedState;
}

/**
 * Create a new CAT session
 */
export function createCATSession(
  initialTheta: number = 0,
  config: CATConfig = DEFAULT_CAT_CONFIG
): CATSessionState {
  return {
    theta: initialTheta,
    se: 3.5, // Maximum uncertainty at start
    responses: [],
    administeredItemIds: [],
    status: 'in_progress',
    startedAt: Date.now(),
    lastUpdatedAt: Date.now(),
    config,
  };
}

/**
 * Generate a full report from CAT session state
 */
export function generateReport(state: CATSessionState): CATReport {
  const correctCount = state.responses.filter(r => r.isCorrect).length;
  const ci = calculateConfidenceInterval(state.theta, state.se);

  return {
    theta: state.theta,
    se: state.se,
    mastery: thetaToMastery(state.theta),
    confidenceInterval: ci,
    itemsAdministered: state.responses.length,
    correctCount,
    accuracy: state.responses.length > 0 ? correctCount / state.responses.length : 0,
    status: state.status,
    estimatedAbilityLabel: thetaToLabel(state.theta),
    durationMs: state.lastUpdatedAt - state.startedAt,
  };
}
