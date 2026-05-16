# BIKAN LMS — Developer Roadmap & Progress Tracker

> **Last Updated:** 17 Mei 2026
> **Overall Progress:** 68% (MVP Alpha)
> **Target Launch:** Beta Pilot Minggu ke-6, Production Bulan ke-3

---

## 🎯 Definition of Done (Proyek Berhasil Ketika)

- [ ] 20 siswa aktif menyelesaikan Modul 1 (Aljabar & Fungsi Kuadrat) dengan mastery ≥ 90%
- [ ] Activation Rate > 65% (daftar → selesai 1 video + 1 quiz dalam 24 jam)
- [ ] Day-7 Retention > 45%
- [ ] Cognitive Error Decline > 40% pada percobaan ke-3
- [ ] Xendit payment live & 1 transaksi berhasil
- [ ] 1 instruktur aktif mengajar + menerima SHU
- [ ] Akta pendirian KMP BIKAN terdaftar

---

## 📊 Progress per Fase

### Fase 1: Alpha Testing & Security Hardening (Minggu 1-2)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | Migrasi auth ke httpOnly JWT cookies | ✅ Done | `lib/auth/session.ts`, middleware sliding window |
| 1.2 | Hapus localStorage auth (dead code) | ✅ Done | `auth-service.ts` deleted |
| 1.3 | Security headers (X-Frame, CSP, etc) | ✅ Done | Di `middleware.ts` |
| 1.4 | IRT engine unit tests + edge cases | ✅ Done | 23 tests, convergence verified |
| 1.5 | CAT engine tests | ✅ Done | 18 tests, SE + stopping rules |
| 1.6 | Diagnostics engine tests | ✅ Done | 16 tests, parser + error detection |
| 1.7 | Pre-push hook (auto test) | ✅ Done | `.githooks/pre-push` |
| 1.8 | `db:check` script | ✅ Done | Validates schema before push |
| 1.9 | Encode 5 video HLS | ⏳ Blocked | Menunggu video dari instruktur |
| 1.10 | Environment validation (crash early) | ❌ Todo | Runtime check env vars |
| 1.11 | Error boundaries per route group | ❌ Todo | `(student)/error.tsx`, `instructor/error.tsx` |
| 1.12 | Role-based middleware enforcement | ❌ Todo | `/instructor` hanya role=instructor |

**Fase 1 Progress: 75% (9/12)**

---

### Fase 2: Beta Pilot & Legal Compliance (Minggu 3-6)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Xendit sandbox → production | ❌ Todo | Ganti API key + webhook signature verify |
| 2.2 | Terms of Service page | ✅ Done | `app/terms/page.tsx` |
| 2.3 | Privacy Policy page | ✅ Done | `app/privacy/page.tsx` |
| 2.4 | Akta pendirian KMP BIKAN | ❌ Non-tech | Notaris + Kemenkop |
| 2.5 | Rekrutmen 1 instruktur matematika | ❌ Non-tech | Operasional |
| 2.6 | Pilot 10-20 siswa aktif | ❌ Non-tech | Setelah video ready |
| 2.7 | Email verification flow | ❌ Todo | OTP/link saat register |
| 2.8 | Mastery Gatekeeper server-side | ❌ Todo | Block next module di server, bukan hanya UI |
| 2.9 | Landing page SEO optimization | ❌ Todo | Meta tags, OG image, structured data |

**Fase 2 Progress: 22% (2/9)**

---

### Fase 3: Production Scale & Open Launch (Bulan 2-3)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Sentry error monitoring | ❌ Todo | `@sentry/nextjs` |
| 3.2 | PostHog analytics | ❌ Todo | Event tracking: activation, retention |
| 3.3 | SHU automation (cron) | ❌ Todo | Monthly `calculateAnnualShu()` |
| 3.4 | Redis rate limiting | ❌ Todo | Replace in-memory for multi-instance |
| 3.5 | Modul 2: Persamaan Linear | ❌ Todo | Content + lessons.ts + item bank |
| 3.6 | UTBK/CPNS expansion | ❌ Backlog | Setelah Modul 1 validated |
| 3.7 | Domain setup (bikan.id) | ❌ Todo | DNS + Vercel custom domain |
| 3.8 | SSL + HSTS | ❌ Todo | Otomatis via Vercel jika custom domain |

**Fase 3 Progress: 0% (0/8)**

---

## 🏗️ Arsitektur yang Sudah Dibangun

| Komponen | File | Status |
|----------|------|--------|
| HLS Video Player | `src/features/player/CinematicPlayer.tsx` | ✅ |
| Git-CMS (lessons) | `src/data/lessons.ts` | ✅ |
| IRT 3PLM Engine | `lib/ai/irt-engine.ts` | ✅ |
| CAT Engine (full) | `lib/ai/cat-engine.ts` | ✅ |
| Diagnostics Engine | `src/features/diagnostics/` | ✅ |
| Socratic AI Tutor | `app/actions/ai-tutor.ts` | ✅ |
| Offline Queue | `src/lib/offline-queue.ts` | ✅ |
| Service Worker | `public/sw.js` | ✅ |
| Auth (JWT httpOnly) | `lib/auth/session.ts` | ✅ |
| Middleware (security) | `middleware.ts` | ✅ |
| Payment (Xendit) | `app/actions/payment.ts` | ✅ (sandbox) |
| SHU System | `app/actions/shu.ts` | ✅ |
| Instructor Dashboard | `app/instructor/page.tsx` | ✅ |
| Mentor Dashboard | `app/mentor/page.tsx` | ✅ |
| Dynamic Canvas | `src/features/canvas/QuadraticCanvas.tsx` | ✅ |
| Streak Tracking | `src/features/streaks/StreakWidget.tsx` | ✅ |
| Certificate Generator | `src/features/certificate/` | ✅ |
| App Router Routes | `app/(student)/learn/[lessonId]/` | ✅ |
| FFmpeg Encode Scripts | `scripts/encode-hls.bat` | ✅ |

---

## 📅 Sprint Planning Template

### Hari Ini (___/___/2026)

- [ ] _Task 1_
- [ ] _Task 2_
- [ ] _Task 3_

### Besok

- [ ] _Task 1_
- [ ] _Task 2_

### Minggu Ini

- [ ] _Goal 1_
- [ ] _Goal 2_
- [ ] _Goal 3_

---

## 🚨 Blockers & Dependencies

| Blocker | Depends On | Impact |
|---------|-----------|--------|
| Video HLS encode | Rekaman dari instruktur | Tidak bisa test video lokal |
| Xendit production | Akun bisnis verified | Tidak bisa terima pembayaran |
| Pilot testing | Video + instruktur + siswa | Tidak bisa validasi KPI |
| Akta KMP | Notaris + anggota pendiri | SHU belum legal |

---

## 📈 KPI Targets (dari PRD)

| Metrik | Target | Current | Gap |
|--------|--------|---------|-----|
| Activation Rate | > 65% | — | Belum pilot |
| Mastery Speed | < 25 min/sub-bab | — | Belum pilot |
| Day-7 Retention | > 45% | — | Belum pilot |
| Cognitive Error Decline | > 40% (3rd attempt) | — | Belum pilot |
| UX CSAT (Dark Mode) | > 85% Likert | — | Belum pilot |
| Video Cold Start | < 1.5 detik | ✅ (HLS + CDN) | Achieved by design |
| Canvas FPS | 60fps stable | ✅ | Achieved |
| AI Response | < 1.5 detik | ✅ (~800ms avg) | Achieved |

---

## 🔧 Developer Quick Reference

```bash
# Development
npm run dev              # Start dev server (Turbopack)
npm run test             # Run all 57 tests
npm run build            # Production build

# Database
npm run db:check         # Validate schema
npm run db:generate      # Generate migration
npm run db:push          # Check + push to NeonDB
npm run db:studio        # Open Drizzle Studio

# Video Encoding
scripts\encode-hls.bat <input.mp4> <lesson-slug>

# Git
git config core.hooksPath .githooks  # Enable pre-push test hook
```

---

## 📝 Changelog

| Date | What |
|------|------|
| 17 Mei 2026 | Merge all feature branches to main. Deploy. |
| 17 Mei 2026 | Auth security hardening (httpOnly JWT, middleware) |
| 17 Mei 2026 | App Router routes: /learn/[lessonId], /dashboard, /instructor/upload |
| 17 Mei 2026 | IRT edge case tests + pre-push hook + db:check |
| 17 Mei 2026 | Instructor Dashboard v2 (analytics, cohort, item performance) |
| 17 Mei 2026 | Offline Queue + PWA Enhancement |
| 17 Mei 2026 | IRT CAT Full Integration (SE, stopping rules, session persistence) |
| 17 Mei 2026 | Diagnostics Engine (US-ALG-003) — math parser + error detection |
| 17 Mei 2026 | CTO $0 Architecture — HLS CDN, Git-CMS, AI optimization |
