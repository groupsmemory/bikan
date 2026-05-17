# BIKAN Developer Guide — Steering Rules

## Arsitektur Berbasis Fitur

- Setiap fitur baru WAJIB dibuat di folder `src/features/[nama-fitur]/`.
- Jangan menumpuk kode di komponen global (`src/App.tsx`) atau di `lib/`.
- Setiap feature folder harus punya barrel export (`index.ts`) jika memiliki lebih dari 1 file.
- Komponen UI di `src/features/`, logika bisnis murni di `lib/`.

### Import Boundaries (Satu Arah)

```
app/ → src/features/ → lib/
       src/hooks/    → lib/
       src/data/     → (standalone, no imports from features)
```

- `lib/` DILARANG mengimport dari `src/features/` atau `app/`.
- `src/data/` DILARANG mengimport dari `src/features/`.
- Server Actions (`app/actions/`) boleh mengimport dari `lib/` dan `src/data/`.

## Modifikasi Database

1. Edit schema di `lib/db/schema.ts`
2. Generate migration: `npm run db:generate`
3. Push ke NeonDB: `npm run db:push`
4. JANGAN hapus atau rename kolom yang sudah ada di production tanpa migrasi data terlebih dahulu.
5. Partisi `ims_analytics.ai_interaction_logs` harus dibuat manual per bulan (lihat `scripts/setup-db.sql`).

## Testing

- Jalankan `npm run test` sebelum setiap push ke GitHub.
- File test ditempatkan di samping file yang diuji (`*.test.ts`) atau di folder `tests/`.
- Setiap perubahan pada `lib/ai/irt-engine.ts` atau `lib/ai/cat-engine.ts` WAJIB divalidasi dengan test.
- Target: semua test pass, zero regressions.

## Git Workflow

- Selalu buat branch baru dari `main`: `feat/nama-fitur`, `fix/nama-bug`, `security/nama-patch`.
- Jangan push langsung ke `main`.
- Commit message format: `feat:`, `fix:`, `security:`, `docs:`, `refactor:`.
- Satu PR per fitur/fix.

## Konvensi Kode

- TypeScript strict mode — hindari `any` kecuali untuk Drizzle ORM typing workaround.
- Tailwind CSS untuk styling — jangan buat CSS custom kecuali untuk animasi (`src/index.css`).
- Gunakan `'use client'` hanya pada komponen yang membutuhkan interaktivitas browser.
- Server Actions di `app/actions/` — selalu awali dengan `'use server'`.
- Palet warna: 60% neutral, 30% muted-blue/green, 10% tactical-orange/red (Cognitive UI Architecture).

## AI & IRT Engine

- Model AI: Gemini 2.5 Flash via `@google/genai` — Free Tier (15 RPM, 1500 RPD).
- Context AI diambil dari `src/data/lessons.ts` (Git-CMS) — BUKAN dari database.
- Socratic Assistant: MAKSIMAL 2 baris pertanyaan penuntun, DILARANG memberi jawaban.
- IRT 3PLM: Safety Fences di [-3.5, 3.5], MLEF convergence, max 20 iterasi Newton-Raphson.
- CAT stopping rules: SE ≤ 0.35 ATAU max 15 items ATAU mastery θ ≥ 2.0.

## Video & Media

- Video disimpan di `public/videos/[lesson-slug]/` dalam format HLS (.m3u8 + .ts segments).
- Encode via `scripts/encode-hls.bat` (Windows) atau `scripts/encode-hls.sh` (Unix).
- Toggle source: `NEXT_PUBLIC_USE_LOCAL_VIDEOS` env var (false = test streams, true = lokal).
- Vercel Edge CDN mendistribusikan `public/` secara gratis.

## Keamanan

- Auth: httpOnly JWT cookies (`lib/auth/session.ts`) — BUKAN localStorage.
- Password: bcrypt cost factor 12.
- Middleware: session verification + sliding window refresh + security headers.
- Protected routes: `/instructor`, `/mentor` — redirect jika tidak authenticated.
- Webhook Xendit: tanpa auth check (ada di PUBLIC_PATHS middleware).

## Offline & PWA

- Service Worker: `public/sw.js` — Cache First (static), Network First (API), Stale While Revalidate (media).
- Offline Queue: `src/lib/offline-queue.ts` — IndexedDB dengan Background Sync.
- Auto-flush saat reconnect via `useOfflineSync` hook.
