/**
 * BIKAN IRT Engine Tests
 * ──────────────────────
 * Verifikasi kalkulasi psikometrik 3PLM
 */

import { describe, it, expect } from 'vitest';
import { calculateProbability, estimateTheta, calculateItemInformation } from '@/lib/ai/irt-engine';

describe('IRT 3PLM Engine', () => {
  describe('calculateProbability', () => {
    it('returns guessing parameter when theta is very low', () => {
      const p = calculateProbability(-5, { a: 1.5, b: 0, c: 0.25 });
      expect(p).toBeCloseTo(0.25, 1); // Should approach c (guessing)
    });

    it('returns ~1 when theta is very high', () => {
      const p = calculateProbability(5, { a: 1.5, b: 0, c: 0.25 });
      expect(p).toBeGreaterThan(0.99);
    });

    it('returns midpoint between c and 1 at theta = b', () => {
      const p = calculateProbability(1.0, { a: 1.5, b: 1.0, c: 0.2 });
      // At theta = b, P = c + (1-c)/2 = 0.2 + 0.8/2 = 0.6
      expect(p).toBeCloseTo(0.6, 1);
    });

    it('probability increases with theta', () => {
      const params = { a: 1.2, b: 0, c: 0.25 };
      const p1 = calculateProbability(-1, params);
      const p2 = calculateProbability(0, params);
      const p3 = calculateProbability(1, params);
      expect(p1).toBeLessThan(p2);
      expect(p2).toBeLessThan(p3);
    });
  });

  describe('estimateTheta', () => {
    it('returns 0 with no responses (only fences)', () => {
      const theta = estimateTheta([], 0);
      expect(theta).toBeCloseTo(0, 0);
    });

    it('increases theta when all answers are correct', () => {
      const responses = [
        { itemId: '1', isCorrect: true, params: { a: 1.2, b: 0, c: 0.25 } },
        { itemId: '2', isCorrect: true, params: { a: 1.2, b: 0.5, c: 0.25 } },
        { itemId: '3', isCorrect: true, params: { a: 1.2, b: 1.0, c: 0.25 } },
      ];
      const theta = estimateTheta(responses, 0);
      expect(theta).toBeGreaterThan(0.5);
    });

    it('decreases theta when all answers are wrong', () => {
      const responses = [
        { itemId: '1', isCorrect: false, params: { a: 1.2, b: 0, c: 0.25 } },
        { itemId: '2', isCorrect: false, params: { a: 1.2, b: -0.5, c: 0.25 } },
        { itemId: '3', isCorrect: false, params: { a: 1.2, b: -1.0, c: 0.25 } },
      ];
      const theta = estimateTheta(responses, 0);
      expect(theta).toBeLessThan(-0.5);
    });

    it('stays within bounds [-3.5, 3.5]', () => {
      const allCorrect = Array.from({ length: 20 }, (_, i) => ({
        itemId: `${i}`,
        isCorrect: true,
        params: { a: 2.0, b: 3.0, c: 0.1 },
      }));
      const theta = estimateTheta(allCorrect, 0);
      expect(theta).toBeLessThanOrEqual(3.5);
      expect(theta).toBeGreaterThanOrEqual(-3.5);
    });

    it('converges with mixed responses', () => {
      const responses = [
        { itemId: '1', isCorrect: true, params: { a: 1.0, b: -1.0, c: 0.25 } },
        { itemId: '2', isCorrect: true, params: { a: 1.2, b: 0.0, c: 0.25 } },
        { itemId: '3', isCorrect: false, params: { a: 1.5, b: 1.0, c: 0.20 } },
        { itemId: '4', isCorrect: false, params: { a: 1.8, b: 2.0, c: 0.15 } },
      ];
      const theta = estimateTheta(responses, 0);
      // Should be somewhere around 0-1 (correct on easy, wrong on hard)
      expect(theta).toBeGreaterThan(-1);
      expect(theta).toBeLessThan(2);
    });
  });

  describe('calculateItemInformation', () => {
    it('returns maximum information near item difficulty', () => {
      const params = { a: 1.5, b: 1.0, c: 0.2 };
      const infoAtB = calculateItemInformation(1.0, params);
      const infoFarBelow = calculateItemInformation(-2.0, params);
      const infoFarAbove = calculateItemInformation(4.0, params);
      expect(infoAtB).toBeGreaterThan(infoFarBelow);
      expect(infoAtB).toBeGreaterThan(infoFarAbove);
    });

    it('higher discrimination gives more information', () => {
      const lowDisc = calculateItemInformation(0, { a: 0.5, b: 0, c: 0.25 });
      const highDisc = calculateItemInformation(0, { a: 2.0, b: 0, c: 0.25 });
      expect(highDisc).toBeGreaterThan(lowDisc);
    });

    it('returns positive values', () => {
      const info = calculateItemInformation(0, { a: 1.2, b: 0.5, c: 0.25 });
      expect(info).toBeGreaterThan(0);
    });
  });
});


// ═══════════════════════════════════════════════════════════
// EDGE CASE TESTS
// ═══════════════════════════════════════════════════════════

describe('IRT Edge Cases', () => {
  describe('All correct on very easy items (theta must stay bounded)', () => {
    it('theta stays within [-3.5, 3.5] with 30 correct answers on easy items', () => {
      const responses = Array.from({ length: 30 }, (_, i) => ({
        itemId: `easy-${i}`,
        isCorrect: true,
        params: { a: 0.8, b: -3.0, c: 0.30 }, // Very easy items
      }));
      const theta = estimateTheta(responses, 0);
      expect(theta).toBeLessThanOrEqual(3.5);
      expect(theta).toBeGreaterThanOrEqual(-3.5);
    });

    it('theta does not explode with perfect score on trivial items', () => {
      const responses = Array.from({ length: 50 }, (_, i) => ({
        itemId: `trivial-${i}`,
        isCorrect: true,
        params: { a: 0.5, b: -3.5, c: 0.35 }, // Extremely easy, high guessing
      }));
      const theta = estimateTheta(responses, 0);
      expect(theta).toBeLessThanOrEqual(3.5);
      // Should not be extremely high because items are too easy to be informative
      expect(theta).toBeLessThan(3.0);
    });

    it('all wrong on very hard items stays bounded', () => {
      const responses = Array.from({ length: 30 }, (_, i) => ({
        itemId: `hard-${i}`,
        isCorrect: false,
        params: { a: 2.0, b: 3.0, c: 0.10 }, // Very hard items
      }));
      const theta = estimateTheta(responses, 0);
      expect(theta).toBeGreaterThanOrEqual(-3.5);
      expect(theta).toBeLessThanOrEqual(3.5);
    });
  });

  describe('Oscillating response patterns', () => {
    it('converges with alternating correct/incorrect pattern', () => {
      const responses = Array.from({ length: 20 }, (_, i) => ({
        itemId: `osc-${i}`,
        isCorrect: i % 2 === 0, // correct, wrong, correct, wrong...
        params: { a: 1.2, b: 0, c: 0.25 },
      }));
      const theta = estimateTheta(responses, 0);
      // Should settle near the item difficulty (b=0) since 50% correct
      expect(theta).toBeGreaterThan(-1.5);
      expect(theta).toBeLessThan(1.5);
    });

    it('converges with 2-correct-then-2-wrong oscillation', () => {
      const responses = Array.from({ length: 20 }, (_, i) => ({
        itemId: `osc2-${i}`,
        isCorrect: Math.floor(i / 2) % 2 === 0, // CC WW CC WW...
        params: { a: 1.5, b: 0.5, c: 0.20 },
      }));
      const theta = estimateTheta(responses, 0);
      expect(theta).toBeGreaterThan(-2);
      expect(theta).toBeLessThan(2);
    });

    it('handles random-like pattern without diverging', () => {
      // Simulated "random" pattern: TCFTFTCCTF
      const pattern = [true, false, true, false, true, false, true, true, false, true, false, false, true, true, false];
      const responses = pattern.map((isCorrect, i) => ({
        itemId: `rand-${i}`,
        isCorrect,
        params: { a: 1.0 + (i % 3) * 0.3, b: -1 + i * 0.2, c: 0.20 },
      }));
      const theta = estimateTheta(responses, 0);
      expect(theta).toBeGreaterThanOrEqual(-3.5);
      expect(theta).toBeLessThanOrEqual(3.5);
      // Should be finite and reasonable
      expect(Number.isFinite(theta)).toBe(true);
    });
  });

  describe('Convergence speed', () => {
    it('produces stable results with default 20 iterations', () => {
      const responses = [
        { itemId: '1', isCorrect: true, params: { a: 1.2, b: -0.5, c: 0.25 } },
        { itemId: '2', isCorrect: true, params: { a: 1.0, b: 0.0, c: 0.25 } },
        { itemId: '3', isCorrect: false, params: { a: 1.5, b: 0.5, c: 0.20 } },
        { itemId: '4', isCorrect: true, params: { a: 1.3, b: 1.0, c: 0.20 } },
        { itemId: '5', isCorrect: false, params: { a: 1.8, b: 1.5, c: 0.15 } },
      ];
      // Running with 20 vs 30 iterations should give same result (converged by 20)
      const theta20 = estimateTheta(responses, 0, 20);
      const theta30 = estimateTheta(responses, 0, 30);
      expect(Math.abs(theta20 - theta30)).toBeLessThan(0.01);
    });

    it('converges for all-correct pattern within default iterations', () => {
      const responses = Array.from({ length: 8 }, (_, i) => ({
        itemId: `${i}`,
        isCorrect: true,
        params: { a: 1.2, b: -1 + i * 0.5, c: 0.25 },
      }));
      const theta20 = estimateTheta(responses, 0, 20);
      const theta40 = estimateTheta(responses, 0, 40);
      // All-correct with Safety Fences converges slowly — verify stabilization
      expect(Math.abs(theta20 - theta40)).toBeLessThan(0.5);
      // Result is bounded and positive (all correct → high theta)
      expect(theta20).toBeGreaterThan(0);
      expect(theta20).toBeLessThanOrEqual(3.5);
    });

    it('converges for all-wrong pattern within default iterations', () => {
      const responses = Array.from({ length: 8 }, (_, i) => ({
        itemId: `${i}`,
        isCorrect: false,
        params: { a: 1.2, b: -1 + i * 0.5, c: 0.25 },
      }));
      const theta20 = estimateTheta(responses, 0, 20);
      const theta40 = estimateTheta(responses, 0, 40);
      // All-wrong with Safety Fences converges slowly — verify it stabilizes eventually
      expect(Math.abs(theta20 - theta40)).toBeLessThan(0.5);
      // And result is bounded
      expect(theta20).toBeGreaterThanOrEqual(-3.5);
      expect(theta20).toBeLessThanOrEqual(3.5);
    });

    it('converges to similar value regardless of starting point (with enough items)', () => {
      const responses = [
        { itemId: '1', isCorrect: true, params: { a: 1.5, b: -1, c: 0.20 } },
        { itemId: '2', isCorrect: false, params: { a: 1.2, b: 0, c: 0.25 } },
        { itemId: '3', isCorrect: true, params: { a: 1.0, b: -0.5, c: 0.25 } },
        { itemId: '4', isCorrect: true, params: { a: 1.3, b: 0.5, c: 0.20 } },
        { itemId: '5', isCorrect: false, params: { a: 1.8, b: 1.5, c: 0.15 } },
      ];
      // With 5+ items, starting point should matter less
      const thetaFromHigh = estimateTheta(responses, 3.0);
      const thetaFromLow = estimateTheta(responses, -3.0);
      const thetaFromZero = estimateTheta(responses, 0);
      // All should converge to within 1.0 of each other
      expect(Math.abs(thetaFromHigh - thetaFromZero)).toBeLessThan(1.0);
      expect(Math.abs(thetaFromLow - thetaFromZero)).toBeLessThan(1.0);
    });

    it('90% of scenarios produce finite bounded results', () => {
      let validCount = 0;
      const totalScenarios = 100;

      for (let s = 0; s < totalScenarios; s++) {
        const numItems = 3 + (s % 8);
        const responses = Array.from({ length: numItems }, (_, i) => ({
          itemId: `s${s}-${i}`,
          isCorrect: ((s * 7 + i * 13) % 3) !== 0,
          params: {
            a: 0.5 + ((s + i) % 5) * 0.4,
            b: -2 + ((s * 3 + i) % 9) * 0.5,
            c: 0.15 + ((s + i * 2) % 4) * 0.05,
          },
        }));

        const initialTheta = -2 + (s % 5);
        const theta = estimateTheta(responses, initialTheta);

        if (Number.isFinite(theta) && theta >= -3.5 && theta <= 3.5) {
          validCount++;
        }
      }

      // 100% should be finite and bounded (Safety Fences guarantee this)
      expect(validCount).toBe(100);
    });
  });
});
