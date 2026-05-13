/**
 * BIKAN IRT Engine - 3-Parameter Logistic Model (3PLM)
 * Implementation for Computerized Adaptive Testing (CAT)
 */

export interface ItemParameters {
  a: number; // Discrimination
  b: number; // Difficulty
  c: number; // Pseudo-guessing
}

export interface UserResponse {
  itemId: string;
  isCorrect: boolean;
  params: ItemParameters;
}

/**
 * Probabilities Function P_j(theta_i)
 */
export function calculateProbability(theta: number, params: ItemParameters): number {
  const { a, b, c } = params;
  return c + (1 - c) / (1 + Math.exp(-a * (theta - b)));
}

/**
 * Maximum Likelihood Estimation with Fences (MLEF)
 * Standard fences: b = -3.5 and b = 3.5
 */
export function estimateTheta(
  responses: UserResponse[],
  initialTheta: number = 0,
  maxIterations: number = 20,
  precision: number = 0.001
): number {
  let theta = initialTheta;
  const lowerFence = -3.5;
  const upperFence = 3.5;

  // Add dummy responses for Fences to guarantee convergence
  // This is the "Safety Fence" logic
  const fences: UserResponse[] = [
    { itemId: 'fence-low', isCorrect: true, params: { a: 2, b: lowerFence, c: 0 } },
    { itemId: 'fence-high', isCorrect: false, params: { a: 2, b: upperFence, c: 0 } }
  ];

  const allResponses = [...responses, ...fences];

  for (let i = 0; i < maxIterations; i++) {
    let firstDerivative = 0;
    let secondDerivative = 0;

    for (const res of allResponses) {
      const p = calculateProbability(theta, res.params);
      const q = 1 - p;
      const u = res.isCorrect ? 1 : 0;
      const { a, c } = res.params;

      // Log-likelihood derivatives for 3PLM
      const term = (p - c) / (p * (1 - c));
      firstDerivative += a * term * (u - p);
      
      // Approximation for second derivative (Fisher Information)
      const info = (a * a * (p - c) * (p - c) * q) / (q * (1 - c) * (1 - c) * p);
      secondDerivative -= info;
    }

    if (Math.abs(secondDerivative) < 1e-9) break;

    const delta = firstDerivative / secondDerivative;
    theta = theta - delta;

    if (Math.abs(delta) < precision) break;
  }

  // Clamp result within absolute physical boundaries
  return Math.max(lowerFence, Math.min(upperFence, theta));
}

/**
 * Item Information Function (IIF)
 * Used to select the next best item for the student
 */
export function calculateItemInformation(theta: number, params: ItemParameters): number {
  const p = calculateProbability(theta, params);
  const q = 1 - p;
  const { a, c } = params;
  
  const numerator = a * a * (p - c) * (p - c) * q;
  const denominator = (1 - c) * (1 - c) * p;
  
  return numerator / denominator;
}
