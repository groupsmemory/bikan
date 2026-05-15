/**
 * BIKAN Auth Validation Tests
 * ────────────────────────────
 * Test input validation logic (tanpa DB connection)
 */

import { describe, it, expect } from 'vitest';

// Extract validation functions for testing
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

function validatePassword(password: string): string | null {
  if (password.length < 6) return 'Password minimal 6 karakter';
  if (password.length > 128) return 'Password terlalu panjang';
  return null;
}

function validateName(name: string): string | null {
  if (name.trim().length < 2) return 'Nama minimal 2 karakter';
  if (name.length > 255) return 'Nama terlalu panjang';
  return null;
}

describe('Auth Input Validation', () => {
  describe('validateEmail', () => {
    it('accepts valid emails', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.name@domain.co.id')).toBe(true);
      expect(validateEmail('a@b.c')).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('notanemail')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('user @domain.com')).toBe(false);
    });

    it('rejects emails over 255 chars', () => {
      const longEmail = 'a'.repeat(250) + '@b.com';
      expect(validateEmail(longEmail)).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('accepts valid passwords', () => {
      expect(validatePassword('123456')).toBeNull();
      expect(validatePassword('strongP@ssw0rd!')).toBeNull();
    });

    it('rejects short passwords', () => {
      expect(validatePassword('')).toBe('Password minimal 6 karakter');
      expect(validatePassword('12345')).toBe('Password minimal 6 karakter');
    });

    it('rejects passwords over 128 chars', () => {
      const longPass = 'a'.repeat(129);
      expect(validatePassword(longPass)).toBe('Password terlalu panjang');
    });
  });

  describe('validateName', () => {
    it('accepts valid names', () => {
      expect(validateName('Ahmad')).toBeNull();
      expect(validateName('Sabrun Jamil')).toBeNull();
    });

    it('rejects short names', () => {
      expect(validateName('')).toBe('Nama minimal 2 karakter');
      expect(validateName('A')).toBe('Nama minimal 2 karakter');
      expect(validateName('  ')).toBe('Nama minimal 2 karakter');
    });

    it('rejects names over 255 chars', () => {
      const longName = 'A'.repeat(256);
      expect(validateName(longName)).toBe('Nama terlalu panjang');
    });
  });
});
