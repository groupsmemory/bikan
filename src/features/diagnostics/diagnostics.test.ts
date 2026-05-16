/**
 * BIKAN Diagnostics Engine - Unit Tests
 * ──────────────────────────────────────
 * Tests for math-parser.ts and error-detector.ts
 */

import { describe, it, expect } from 'vitest';
import { tokenize, parseLine } from './math-parser';
import { validateStudentWork } from './error-detector';

describe('Math Parser - Tokenizer', () => {
  it('tokenizes a simple quadratic equation', () => {
    const tokens = tokenize('x^2 + 5x + 6 = 0');
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens[0]).toMatchObject({ type: 'VARIABLE', value: 'x' });
    expect(tokens.some(t => t.type === 'POWER')).toBe(true);
    expect(tokens.some(t => t.type === 'EQUALS')).toBe(true);
  });

  it('tokenizes factored form', () => {
    const tokens = tokenize('(x + 2)(x + 3) = 0');
    expect(tokens.filter(t => t.type === 'LPAREN').length).toBe(2);
    expect(tokens.filter(t => t.type === 'RPAREN').length).toBe(2);
  });

  it('tokenizes discriminant calculation', () => {
    const tokens = tokenize('D = 5^2 - 4*1*6 = 1');
    expect(tokens[0]).toMatchObject({ type: 'VARIABLE', value: 'D' });
    expect(tokens[1]).toMatchObject({ type: 'EQUALS' });
  });

  it('handles negative numbers', () => {
    const tokens = tokenize('-3x + 5 = 0');
    expect(tokens[0]).toMatchObject({ type: 'NUMBER', value: '-3' });
  });
});

describe('Math Parser - Parse Line', () => {
  it('parses a quadratic equation without error', () => {
    const result = parseLine('x^2 + 5x + 6 = 0');
    expect(result.parseError).toBeNull();
    expect(result.ast).not.toBeNull();
  });

  it('parses factored form', () => {
    const result = parseLine('(x + 2)(x + 3) = 0');
    expect(result.parseError).toBeNull();
    expect(result.ast).not.toBeNull();
  });

  it('returns empty result for blank line', () => {
    const result = parseLine('');
    expect(result.tokens).toHaveLength(0);
    expect(result.ast).toBeNull();
    expect(result.parseError).toBeNull();
  });
});

describe('Error Detector - Factoring Validation', () => {
  it('detects correct factoring', () => {
    const lines = [
      'x^2 + 5x + 6 = 0',
      '(x + 2)(x + 3) = 0',
    ];
    const { errors } = validateStudentWork(lines);
    const factorErrors = errors.filter(e => e.severity === 'error');
    expect(factorErrors).toHaveLength(0);
  });

  it('detects wrong factoring (sum error)', () => {
    const lines = [
      'x^2 + 5x + 6 = 0',
      '(x + 1)(x + 3) = 0', // 1+3=4, should be 5
    ];
    const { errors } = validateStudentWork(lines);
    const factorErrors = errors.filter(e => e.severity === 'error');
    expect(factorErrors.length).toBeGreaterThan(0);
    expect(factorErrors[0].message).toContain('Jumlah faktor salah');
  });

  it('detects wrong factoring (product error)', () => {
    const lines = [
      'x^2 + 5x + 6 = 0',
      '(x + 1)(x + 4) = 0', // 1*4=4, should be 6; 1+4=5 OK
    ];
    const { errors } = validateStudentWork(lines);
    const factorErrors = errors.filter(e => e.severity === 'error');
    expect(factorErrors.length).toBeGreaterThan(0);
    expect(factorErrors[0].message).toContain('Hasil kali faktor salah');
  });
});

describe('Error Detector - Discriminant Validation', () => {
  it('detects correct discriminant', () => {
    const lines = [
      'x^2 + 5x + 6 = 0',
      'D = 25 - 24 = 1',
    ];
    const { errors } = validateStudentWork(lines);
    const discErrors = errors.filter(e => e.message.includes('Diskriminan'));
    expect(discErrors).toHaveLength(0);
  });

  it('detects wrong discriminant value', () => {
    const lines = [
      'x^2 + 5x + 6 = 0',
      'D = 25 - 24 = 5', // Should be 1
    ];
    const { errors } = validateStudentWork(lines);
    const discErrors = errors.filter(e => e.message.includes('Diskriminan salah'));
    expect(discErrors.length).toBeGreaterThan(0);
  });
});

describe('Error Detector - Root Validation', () => {
  it('accepts correct roots', () => {
    const lines = [
      'x^2 + 5x + 6 = 0',
      'x = -2',
      'x = -3',
    ];
    const { errors } = validateStudentWork(lines);
    const rootErrors = errors.filter(e => e.message.includes('bukan akar'));
    expect(rootErrors).toHaveLength(0);
  });

  it('detects wrong roots', () => {
    const lines = [
      'x^2 + 5x + 6 = 0',
      'x = 2', // Wrong: f(2) = 4+10+6 = 20 ≠ 0
    ];
    const { errors } = validateStudentWork(lines);
    const rootErrors = errors.filter(e => e.message.includes('bukan akar'));
    expect(rootErrors.length).toBeGreaterThan(0);
  });
});

describe('Error Detector - Arithmetic Validation', () => {
  it('detects arithmetic errors', () => {
    const lines = [
      '5 + 3 = 9', // Should be 8
    ];
    const { errors } = validateStudentWork(lines);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain('Kesalahan hitung');
  });

  it('accepts correct arithmetic', () => {
    const lines = [
      '25 - 24 = 1',
    ];
    const { errors } = validateStudentWork(lines);
    const arithmeticErrors = errors.filter(e => e.message.includes('Kesalahan hitung'));
    expect(arithmeticErrors).toHaveLength(0);
  });
});
