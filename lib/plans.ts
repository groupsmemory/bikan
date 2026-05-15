/**
 * BIKAN Subscription Plans
 */

export const PLANS = {
  basic: {
    id: 'basic',
    name: 'BIKAN Basic',
    price: 99000,
    description: 'Akses semua video materi + assessment adaptif',
    features: ['Video micro-learning', 'Assessment IRT adaptif', 'Mastery tracking', 'Offline mode'],
  },
  premium: {
    id: 'premium',
    name: 'BIKAN Premium',
    price: 199000,
    description: 'Semua fitur Basic + AI Tutor unlimited + sertifikat',
    features: ['Semua fitur Basic', 'AI Socratic Tutor unlimited', 'Post-live automation', 'Sertifikat digital', 'Priority support'],
  },
} as const;

export type PlanId = keyof typeof PLANS;
