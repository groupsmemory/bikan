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
