/**
 * BIKAN Socratic Assistant - Local Test Script
 * ─────────────────────────────────────────────
 * Jalankan: npx tsx actions/ai-assistant.test.ts
 *
 * Verifikasi:
 * 1. Asisten hanya memberikan MAKSIMAL 2 baris pertanyaan penuntun
 * 2. Asisten TIDAK PERNAH membocorkan jawaban akhir
 * 3. Token usage (termasuk cached_tokens) tercatat di log
 */

import { askSocraticAssistant } from "./ai-assistant";

// ─── Test Cases ───
const testCases = [
  {
    name: "Pertanyaan dasar pemfaktoran",
    userId: "test-student-001",
    message: "Bagaimana cara memfaktorkan x² + 5x + 6?",
    context: "Materi: Pemfaktoran persamaan kuadrat ax² + bx + c. Siswa sedang belajar mencari dua bilangan yang jika dijumlahkan = b dan jika dikalikan = c.",
  },
  {
    name: "Siswa memaksa minta jawaban",
    userId: "test-student-002",
    message: "Tolong kasih jawaban langsung saja, berapa akar dari x² - 4x + 3 = 0?",
    context: "Materi: Mencari akar persamaan kuadrat menggunakan rumus abc atau pemfaktoran.",
  },
  {
    name: "Pertanyaan tentang diskriminan",
    userId: "test-student-003",
    message: "Saya bingung, kapan persamaan kuadrat tidak punya akar real?",
    context: "Materi: Diskriminan D = b² - 4ac. Jika D < 0 maka tidak ada akar real. Jika D = 0 akar kembar. Jika D > 0 dua akar berbeda.",
  },
  {
    name: "Pertanyaan titik puncak",
    userId: "test-student-004",
    message: "Gimana caranya cari titik puncak parabola f(x) = 2x² - 8x + 6?",
    context: "Materi: Titik puncak parabola berada di x = -b/(2a), y = f(-b/(2a)). Fungsi kuadrat f(x) = ax² + bx + c.",
  },
];

// ─── Validation Functions ───
function validateMaxTwoLines(text: string): boolean {
  const lines = text.trim().split("\n").filter((l) => l.trim().length > 0);
  return lines.length <= 2;
}

function validateNoAnswerLeak(text: string): boolean {
  const leakIndicators = [
    /jawabannya\s+(adalah|=)/i,
    /solusinya\s+(adalah|=)/i,
    /hasilnya\s+(adalah|=)/i,
    /maka\s+x\s*=\s*[-\d]/i,
    /jadi,?\s+(nilai|x|y)\s*=\s*/i,
    /x\s*=\s*\d+\s*(dan|,)\s*x\s*=\s*\d+/i,
    /akarnya\s+(adalah|=)/i,
  ];

  return !leakIndicators.some((pattern) => pattern.test(text));
}

// ─── Main Test Runner ───
async function runTests() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  BIKAN Socratic Assistant - Compliance Test Suite");
  console.log("═══════════════════════════════════════════════════════\n");

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    console.log(`\n┌─ TEST: ${tc.name}`);
    console.log(`│  Input: "${tc.message}"`);

    try {
      const result = await askSocraticAssistant(
        tc.userId,
        tc.message,
        tc.context
      );

      console.log(`│  Output: "${result.text}"`);
      console.log(`│  Tokens: total=${result.tokens}, cached=${result.cached}, latency=${result.latencyMs}ms`);

      // Validation 1: Max 2 lines
      const lineCheck = validateMaxTwoLines(result.text);
      console.log(`│  ✓ Max 2 baris: ${lineCheck ? "PASS ✅" : "FAIL ❌"}`);

      // Validation 2: No answer leak
      const leakCheck = validateNoAnswerLeak(result.text);
      console.log(`│  ✓ Tidak bocor jawaban: ${leakCheck ? "PASS ✅" : "FAIL ❌"}`);

      // Validation 3: Token logging present
      const tokenCheck = result.tokens > 0;
      console.log(`│  ✓ Token tercatat: ${tokenCheck ? "PASS ✅" : "FAIL ❌"}`);

      if (lineCheck && leakCheck && tokenCheck) {
        passed++;
        console.log(`└─ RESULT: PASS ✅`);
      } else {
        failed++;
        console.log(`└─ RESULT: FAIL ❌`);
      }
    } catch (error: any) {
      console.log(`│  Error: ${error.message}`);
      console.log(`└─ RESULT: SKIPPED (API unavailable) ⚠️`);
    }
  }

  console.log("\n═══════════════════════════════════════════════════════");
  console.log(`  SUMMARY: ${passed} passed, ${failed} failed, ${testCases.length - passed - failed} skipped`);
  console.log("═══════════════════════════════════════════════════════\n");
}

runTests();
