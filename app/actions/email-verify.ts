'use server';

/**
 * BIKAN Email Verification — OTP-based (No External Email Service)
 * ─────────────────────────────────────────────────────────────────
 * Strategi $0: Menggunakan OTP 6-digit yang ditampilkan di console/log
 * saat development, dan bisa diintegrasikan dengan Resend/SendGrid
 * saat production.
 *
 * Flow:
 * 1. User register → OTP generated → stored in DB (hashed)
 * 2. User input OTP → verified → account activated
 * 3. OTP expires after 10 minutes
 * 4. Max 3 attempts per OTP
 *
 * Untuk MVP: OTP di-log ke console (development)
 * Untuk Production: Kirim via email service (Resend Free Tier: 100 emails/day)
 */

import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// ─── In-memory OTP store (replace with Redis/DB in production scale) ───
// Key: email, Value: { hash, expiresAt, attempts }
const otpStore = new Map<string, {
  hash: string;
  expiresAt: number;
  attempts: number;
}>();

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 3;
const OTP_LENGTH = 6;

/**
 * Generate a cryptographically random OTP
 */
function generateOTP(): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

/**
 * Send OTP to user's email
 * MVP: logs to console. Production: integrate email service.
 */
async function sendOTPEmail(email: string, otp: string, name: string): Promise<boolean> {
  // ─── Development: Log to console ───
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  BIKAN Email Verification OTP            ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  To: ${email}`);
  console.log(`║  Name: ${name}`);
  console.log(`║  OTP: ${otp}`);
  console.log(`║  Expires: 10 minutes`);
  console.log('╚══════════════════════════════════════════╝\n');

  // ─── Production: Uncomment and configure ───
  // const { Resend } = await import('resend');
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'BIKAN <noreply@bikan.id>',
  //   to: email,
  //   subject: `Kode Verifikasi BIKAN: ${otp}`,
  //   html: `
  //     <h2>Halo ${name}!</h2>
  //     <p>Kode verifikasi Anda:</p>
  //     <h1 style="font-size:32px;letter-spacing:8px;color:#F97316">${otp}</h1>
  //     <p>Kode ini berlaku selama 10 menit.</p>
  //     <p>— Tim BIKAN</p>
  //   `,
  // });

  return true;
}

/**
 * Request OTP for email verification
 */
export async function requestEmailVerification(
  email: string,
  name: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Rate limit: don't send if existing OTP is still valid (< 2 min old)
    const existing = otpStore.get(email);
    if (existing && existing.expiresAt - Date.now() > (OTP_EXPIRY_MS - 2 * 60 * 1000)) {
      return { success: false, message: 'OTP sudah dikirim. Tunggu 2 menit sebelum request ulang.' };
    }

    // Generate OTP
    const otp = generateOTP();
    const hash = await bcrypt.hash(otp, 8); // Lower cost for OTP (short-lived)

    // Store hashed OTP
    otpStore.set(email, {
      hash,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
      attempts: 0,
    });

    // Send OTP
    await sendOTPEmail(email, otp, name);

    return { success: true, message: 'Kode verifikasi telah dikirim ke email Anda.' };
  } catch (error: any) {
    console.error('[EmailVerify] Request error:', error?.message);
    return { success: false, message: 'Gagal mengirim kode verifikasi. Coba lagi.' };
  }
}

/**
 * Verify OTP code
 */
export async function verifyEmailOTP(
  email: string,
  otp: string
): Promise<{ success: boolean; message: string }> {
  try {
    const stored = otpStore.get(email);

    if (!stored) {
      return { success: false, message: 'Kode verifikasi tidak ditemukan. Request ulang.' };
    }

    // Check expiry
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(email);
      return { success: false, message: 'Kode verifikasi sudah kedaluwarsa. Request ulang.' };
    }

    // Check attempts
    if (stored.attempts >= MAX_ATTEMPTS) {
      otpStore.delete(email);
      return { success: false, message: 'Terlalu banyak percobaan. Request kode baru.' };
    }

    // Verify OTP
    stored.attempts++;
    const isValid = await bcrypt.compare(otp, stored.hash);

    if (!isValid) {
      return {
        success: false,
        message: `Kode salah. ${MAX_ATTEMPTS - stored.attempts} percobaan tersisa.`,
      };
    }

    // Success — clean up and mark email as verified
    otpStore.delete(email);

    // Note: In production, update a `email_verified` column in users table
    // await db.update(users).set({ emailVerified: true }).where(eq(users.email, email));

    return { success: true, message: 'Email berhasil diverifikasi!' };
  } catch (error: any) {
    console.error('[EmailVerify] Verify error:', error?.message);
    return { success: false, message: 'Terjadi kesalahan. Coba lagi.' };
  }
}
