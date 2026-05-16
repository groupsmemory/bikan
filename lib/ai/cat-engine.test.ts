/**
 * BIKAN CAT Engine - Unit Tests
 * ─────────────────────────────
 * Tests for the Computerized Adaptive Testing engine
 */

import { describe, it, expect } from 'vitest';
import {
  createCATSession,
  processResponse,
  selectNextItem,
  checkStoppingRule,
  generateReport,
  calculateSE,
  calculateConfidenceInterval,
  thetaToMastery,
  thetaToLabel,
  DEFAULT_CAT_CONFIG,
  CATSessionState,
} from './cat-engine';
import { ItemParameters } from './irt-engine';

// ─── Test Item Bank ───
const testItems: Array<{ id: string; params: ItemParameters; bloomLevel?: string }> = [
  { id: 'item-1', params: { a: 1.0, b: -1.5, c: 0.25 }, bloomLevel: 'C2' },
  { id: 'item-2', params: { a: 1.2, b: -0.5, c: 0.20 }, bloomLevel: 'C3' },
  { id: 'item-3', params: { a: 1.5, b: 0.0, c: 0.20 }, bloomLevel: 'C3' },
  { id: 'item-4', params: { a: 1.4, b: 0.5, c: 0.15 }, bloomLevel: 'C3' },
  { id: 'item-5', params: { a: 1.8, b: 1.0, c: 0.15 }, bloomLevel: 'C4' },
  { id: 'item-6', params: { a: 1.6, b: 1.5, c: 0.20 }, bloomLevel: 'C4' },
  { id: 'item-7', params: { a: 2.0, b: 2.0, c: 0.15 }, bloomLevel: 'C4' },
  { id: 'item-8', params: { a: 1.3, b: 2.5, c: 0.15 }, bloomLevel: 'C5' },
  { id: 'item-9', params: { a: 0.9, b: -1.0, c: 0.25 }, bloomLevel: 'C2' },
  { id: 'item-10', params: { a: 1.1, b: 3.0, c: 0.15 }, bloomLevel: 'C5' },
];

describe('CAT Engine - Session Creation', () => {
  it('creates a new session with default config', () => {
    const session = createCATSession(0);
    expect(session.theta).toBe(0);
    expect(session.se).toBe(3.5);
    expect(session.responses).toHaveLength(0);
    expect(session.status).toBe('in_progress');
  });

  it('creates a session with custom initial theta', () => {
    const session = createCATSession(1.5);
    expect(session.theta).toBe(1.5);
  });
});

describe('CAT Engine - Item Selection', () => {
  it('selects an item from available pool', () => {
    const administered = new Set<string>();
    const result = selectNextItem(0, testItems, administered, DEFAULT_CAT_CONFIG, []);
    expect(result).not.toBeNull();
    expect(result!.itemId).toBeDefined();
    expect(result!.information).toBeGreaterThan(0);
  });

  it('does not select already administered items', () => {
    const administered = new Set(['item-1', 'item-2', 'item-3']);
    const result = selectNextItem(0, testItems, administered, DEFAULT_CAT_CONFIG, []);
    expect(result).not.toBeNull();
    expect(administered.has(result!.itemId)).toBe(false);
  });

  it('returns null when all items are administered', () => {
    const administered = new Set(testItems.map(i => i.id));
    const result = selectNextItem(0, testItems, administered, DEFAULT_CAT_CONFIG, []);
    expect(result).toBeNull();
  });

  it('selects items near current theta for maximum information', () => {
    // At theta=0, items with b near 0 should have highest information
    const administered = new Set<string>();
    const result = selectNextItem(0, testItems, administered, DEFAULT_CAT_CONFIG, []);
    expect(result).not.toBeNull();
    // The selected item should have difficulty near theta=0
    const selectedItem = testItems.find(i => i.id === result!.itemId);
    expect(Math.abs(selectedItem!.params.b)).toBeLessThanOrEqual(1.5);
  });
});

describe('CAT Engine - Response Processing', () => {
  it('updates theta after correct response', () => {
    const session = createCATSession(0);
    const updated = processResponse(session, 'item-3', true, testItems[2].params, 5000);
    expect(updated.theta).toBeGreaterThan(0); // Correct answer → theta increases
    expect(updated.responses).toHaveLength(1);
    expect(updated.administeredItemIds).toContain('item-3');
  });

  it('updates theta after incorrect response', () => {
    const session = createCATSession(0);
    const updated = processResponse(session, 'item-3', false, testItems[2].params, 5000);
    expect(updated.theta).toBeLessThan(0); // Wrong answer → theta decreases
  });

  it('reduces SE with more responses', () => {
    let session = createCATSession(0);

    // After several responses, SE should be lower than initial
    session = processResponse(session, 'item-1', true, testItems[0].params, 3000);
    session = processResponse(session, 'item-2', true, testItems[1].params, 3000);
    session = processResponse(session, 'item-3', false, testItems[2].params, 3000);
    session = processResponse(session, 'item-4', true, testItems[3].params, 3000);

    // After 4 items, SE should be significantly lower than initial 3.5
    expect(session.se).toBeLessThan(2.0);
    expect(session.responses).toHaveLength(4);
  });

  it('records response time', () => {
    const session = createCATSession(0);
    const updated = processResponse(session, 'item-1', true, testItems[0].params, 7500);
    expect(updated.responses[0].responseTimeMs).toBe(7500);
  });
});

describe('CAT Engine - Stopping Rules', () => {
  it('does not stop before minimum items', () => {
    let session = createCATSession(0);
    session = processResponse(session, 'item-1', true, testItems[0].params, 3000);
    session = processResponse(session, 'item-2', true, testItems[1].params, 3000);

    const { shouldStop } = checkStoppingRule(session);
    expect(shouldStop).toBe(false);
  });

  it('stops when max items reached', () => {
    let session = createCATSession(0, { ...DEFAULT_CAT_CONFIG, maxItems: 3, minItems: 2 });

    session = processResponse(session, 'item-1', true, testItems[0].params, 3000);
    session = processResponse(session, 'item-2', true, testItems[1].params, 3000);
    session = processResponse(session, 'item-3', true, testItems[2].params, 3000);

    const { shouldStop, reason } = checkStoppingRule(session);
    expect(shouldStop).toBe(true);
    expect(reason).toBe('completed_max');
  });
});

describe('CAT Engine - SE Calculation', () => {
  it('returns maximum SE for empty responses', () => {
    const se = calculateSE(0, []);
    expect(se).toBe(3.5);
  });

  it('SE decreases with more responses', () => {
    const responses = [
      { itemId: 'i1', isCorrect: true, params: testItems[0].params, thetaAfter: 0.5, seAfter: 1, responseTimeMs: 3000, timestamp: 0 },
      { itemId: 'i2', isCorrect: true, params: testItems[1].params, thetaAfter: 0.8, seAfter: 0.8, responseTimeMs: 3000, timestamp: 0 },
    ];

    const se1 = calculateSE(0.5, responses.slice(0, 1));
    const se2 = calculateSE(0.8, responses);
    expect(se2).toBeLessThan(se1);
  });
});

describe('CAT Engine - Utility Functions', () => {
  it('calculates confidence interval', () => {
    const ci = calculateConfidenceInterval(1.0, 0.5);
    expect(ci.lower).toBeLessThan(1.0);
    expect(ci.upper).toBeGreaterThan(1.0);
    expect(ci.upper - ci.lower).toBeCloseTo(2 * 1.96 * 0.5, 1);
  });

  it('maps theta to mastery percentage', () => {
    expect(thetaToMastery(-3.5)).toBe(0);
    expect(thetaToMastery(3.5)).toBe(100);
    expect(thetaToMastery(0)).toBeCloseTo(50, 0);
  });

  it('maps theta to ability labels', () => {
    expect(thetaToLabel(-2.0)).toBe('Pemula');
    expect(thetaToLabel(-1.0)).toBe('Dasar');
    expect(thetaToLabel(0)).toBe('Berkembang');
    expect(thetaToLabel(1.0)).toBe('Kompeten');
    expect(thetaToLabel(2.0)).toBe('Mahir');
    expect(thetaToLabel(3.0)).toBe('Sangat Mahir');
  });
});

describe('CAT Engine - Report Generation', () => {
  it('generates a complete report', () => {
    let session = createCATSession(0);
    session = processResponse(session, 'item-1', true, testItems[0].params, 5000);
    session = processResponse(session, 'item-2', false, testItems[1].params, 4000);
    session = processResponse(session, 'item-3', true, testItems[2].params, 6000);

    const report = generateReport(session);
    expect(report.itemsAdministered).toBe(3);
    expect(report.correctCount).toBe(2);
    expect(report.accuracy).toBeCloseTo(2 / 3, 2);
    expect(report.status).toBe('in_progress');
    expect(report.estimatedAbilityLabel).toBeDefined();
    expect(report.confidenceInterval.lower).toBeLessThan(report.theta);
    expect(report.confidenceInterval.upper).toBeGreaterThan(report.theta);
    expect(report.durationMs).toBeGreaterThan(0);
  });
});
