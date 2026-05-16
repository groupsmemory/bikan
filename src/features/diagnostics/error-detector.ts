/**
 * BIKAN Math Error Detector
 * ─────────────────────────
 * PRD US-ALG-003: Deteksi kesalahan langkah matematika secara real-time.
 *
 * Mendukung validasi:
 * 1. Pemfaktoran persamaan kuadrat
 * 2. Perhitungan diskriminan
 * 3. Rumus kuadratik (abc)
 * 4. Konsistensi antar baris (langkah sebelumnya → langkah berikutnya)
 * 5. Kesalahan aritmatika dasar
 */

import { parseLine, ParsedLine, ASTNode } from './math-parser';

// ─── Error Types ───
export type ErrorSeverity = 'error' | 'warning' | 'hint';

export interface DiagnosticError {
  lineIndex: number;
  severity: ErrorSeverity;
  message: string;
  hint: string;
  /** Column range for precise highlighting */
  range?: { start: number; end: number };
}

// ─── Validation Context (tracks state across lines) ───
export interface ValidationContext {
  /** Original equation coefficients (if detected) */
  coefficients: { a: number; b: number; c: number } | null;
  /** Declared discriminant value */
  declaredDiscriminant: number | null;
  /** Declared roots */
  declaredRoots: number[];
  /** Previous line's parsed result */
  previousLine: ParsedLine | null;
}

/**
 * Main entry point: Validate all lines of student work
 */
export function validateStudentWork(lines: string[]): {
  errors: DiagnosticError[];
  context: ValidationContext;
} {
  const errors: DiagnosticError[] = [];
  const context: ValidationContext = {
    coefficients: null,
    declaredDiscriminant: null,
    declaredRoots: [],
    previousLine: null,
  };

  const parsedLines = lines.map(line => parseLine(line));

  for (let i = 0; i < parsedLines.length; i++) {
    const parsed = parsedLines[i];
    if (!parsed.raw.trim()) continue;

    // Parse errors
    if (parsed.parseError) {
      errors.push({
        lineIndex: i,
        severity: 'warning',
        message: 'Ekspresi tidak dapat diparsing',
        hint: 'Periksa penulisan: gunakan format seperti x^2 + 5x + 6 = 0',
      });
      continue;
    }

    // Run all validators
    const lineErrors = [
      ...validateQuadraticEquation(parsed, i, context),
      ...validateFactoring(parsed, i, context),
      ...validateDiscriminant(parsed, i, context),
      ...validateQuadraticFormula(parsed, i, context),
      ...validateArithmetic(parsed, i, context),
      ...validateConsistency(parsed, i, context),
    ];

    errors.push(...lineErrors);
    context.previousLine = parsed;
  }

  return { errors, context };
}

// ─── Validator: Quadratic Equation Detection ───
function validateQuadraticEquation(
  parsed: ParsedLine,
  lineIndex: number,
  context: ValidationContext
): DiagnosticError[] {
  const errors: DiagnosticError[] = [];
  const raw = parsed.raw.trim().toLowerCase();

  // Detect pattern: ax^2 + bx + c = 0
  const quadMatch = raw.match(
    /(-?\d*\.?\d*)\s*x\s*\^\s*2\s*([+-]\s*\d*\.?\d*)\s*x\s*([+-]\s*\d*\.?\d*)\s*=\s*0/
  );

  if (quadMatch) {
    const a = parseFloat(quadMatch[1] || '1') || 1;
    const bStr = quadMatch[2].replace(/\s/g, '');
    const cStr = quadMatch[3].replace(/\s/g, '');
    const b = parseFloat(bStr) || 0;
    const c = parseFloat(cStr) || 0;

    context.coefficients = { a, b, c };
  }

  return errors;
}

// ─── Validator: Factoring ───
function validateFactoring(
  parsed: ParsedLine,
  lineIndex: number,
  context: ValidationContext
): DiagnosticError[] {
  const errors: DiagnosticError[] = [];
  const raw = parsed.raw.trim();

  // Detect factored form: (x + p)(x + q) = 0
  const factorMatch = raw.match(
    /\(\s*x\s*([+-])\s*(\d+\.?\d*)\s*\)\s*\(\s*x\s*([+-])\s*(\d+\.?\d*)\s*\)\s*=\s*0/
  );

  if (factorMatch && context.coefficients) {
    const sign1 = factorMatch[1] === '+' ? 1 : -1;
    const p = sign1 * parseFloat(factorMatch[2]);
    const sign2 = factorMatch[3] === '+' ? 1 : -1;
    const q = sign2 * parseFloat(factorMatch[4]);

    const { a, b, c } = context.coefficients;

    // For monic quadratic (a=1): (x+p)(x+q) = x² + (p+q)x + pq
    if (a === 1) {
      const expectedSum = b;  // p + q should equal b
      const expectedProduct = c;  // p * q should equal c

      if (Math.abs((p + q) - expectedSum) > 0.001) {
        errors.push({
          lineIndex,
          severity: 'error',
          message: `Jumlah faktor salah: ${p} + ${q} = ${p + q}, seharusnya ${expectedSum}`,
          hint: `Cari dua bilangan yang jika dijumlahkan = ${expectedSum} dan dikalikan = ${expectedProduct}`,
        });
      }

      if (Math.abs((p * q) - expectedProduct) > 0.001) {
        errors.push({
          lineIndex,
          severity: 'error',
          message: `Hasil kali faktor salah: ${p} × ${q} = ${p * q}, seharusnya ${expectedProduct}`,
          hint: `Cari dua bilangan yang jika dikalikan = ${expectedProduct} dan dijumlahkan = ${expectedSum}`,
        });
      }
    }

    // Store declared roots
    context.declaredRoots = [-p, -q];
  }

  return errors;
}

// ─── Validator: Discriminant ───
function validateDiscriminant(
  parsed: ParsedLine,
  lineIndex: number,
  context: ValidationContext
): DiagnosticError[] {
  const errors: DiagnosticError[] = [];
  const raw = parsed.raw.trim();

  // Detect: D = <number> or D = b^2 - 4ac = <number>
  const dMatch = raw.match(/[Dd]\s*=\s*(.+)/);

  if (dMatch && context.coefficients) {
    const { a, b, c } = context.coefficients;
    const correctD = b * b - 4 * a * c;

    // Try to extract the final numeric value
    const parts = dMatch[1].split('=');
    const lastPart = parts[parts.length - 1].trim();
    const declaredD = parseFloat(lastPart);

    if (!isNaN(declaredD)) {
      context.declaredDiscriminant = declaredD;

      if (Math.abs(declaredD - correctD) > 0.001) {
        errors.push({
          lineIndex,
          severity: 'error',
          message: `Diskriminan salah: D = ${declaredD}, seharusnya D = ${b}² - 4(${a})(${c}) = ${correctD}`,
          hint: `Ingat rumus: D = b² - 4ac. Hitung ${b}² = ${b * b}, lalu 4×${a}×${c} = ${4 * a * c}`,
        });
      }
    }

    // Check intermediate calculation: b^2 - 4ac pattern
    const calcMatch = dMatch[1].match(
      /(-?\d+\.?\d*)\s*\^\s*2\s*-\s*4\s*\*?\s*\(?(-?\d+\.?\d*)\)?\s*\*?\s*\(?(-?\d+\.?\d*)\)?/
    );

    if (calcMatch) {
      const bUsed = parseFloat(calcMatch[1]);
      const aUsed = parseFloat(calcMatch[2]);
      const cUsed = parseFloat(calcMatch[3]);

      if (Math.abs(bUsed - b) > 0.001) {
        errors.push({
          lineIndex,
          severity: 'error',
          message: `Nilai b yang digunakan salah: ${bUsed}, seharusnya ${b}`,
          hint: 'Periksa kembali koefisien b dari persamaan awal',
        });
      }
      if (Math.abs(aUsed - a) > 0.001) {
        errors.push({
          lineIndex,
          severity: 'warning',
          message: `Nilai a yang digunakan: ${aUsed}, dari persamaan: ${a}`,
          hint: 'Pastikan koefisien a benar dari persamaan kuadrat',
        });
      }
    }
  }

  return errors;
}

// ─── Validator: Quadratic Formula ───
function validateQuadraticFormula(
  parsed: ParsedLine,
  lineIndex: number,
  context: ValidationContext
): DiagnosticError[] {
  const errors: DiagnosticError[] = [];
  const raw = parsed.raw.trim();

  if (!context.coefficients) return errors;
  const { a, b, c } = context.coefficients;

  // Detect: x = <number> (root declaration)
  const rootMatch = raw.match(/x\s*=\s*(-?\d+\.?\d*)/g);

  if (rootMatch) {
    const D = b * b - 4 * a * c;

    for (const match of rootMatch) {
      const val = parseFloat(match.replace(/x\s*=\s*/, ''));
      if (isNaN(val)) continue;

      // Verify: plug root back into equation
      const result = a * val * val + b * val + c;

      if (Math.abs(result) > 0.01) {
        errors.push({
          lineIndex,
          severity: 'error',
          message: `x = ${val} bukan akar yang benar: f(${val}) = ${a}(${val})² + ${b}(${val}) + ${c} = ${result.toFixed(2)} ≠ 0`,
          hint: `Substitusi x = ${val} ke persamaan awal. Hasilnya harus = 0.`,
        });
      }
    }

    // Check if student claims wrong number of roots
    if (D < 0 && rootMatch.length > 0) {
      errors.push({
        lineIndex,
        severity: 'error',
        message: 'Persamaan ini tidak memiliki akar real (D < 0), tetapi Anda menuliskan akar',
        hint: `D = ${D.toFixed(2)} < 0, artinya tidak ada nilai x real yang memenuhi persamaan`,
      });
    }
  }

  // Detect wrong formula application: x = (-b ± √D) / 2a
  const formulaMatch = raw.match(/x\s*=\s*\(?(-?\d+\.?\d*)\s*[±]\s*√?\(?(\d+\.?\d*)\)?\)?\s*\/\s*\(?(\d+\.?\d*)\)?/);

  if (formulaMatch && context.coefficients) {
    const numB = parseFloat(formulaMatch[1]);
    const sqrtVal = parseFloat(formulaMatch[2]);
    const denom = parseFloat(formulaMatch[3]);

    // Check -b
    if (Math.abs(numB - (-b)) > 0.001 && Math.abs(numB - b) < 0.001) {
      errors.push({
        lineIndex,
        severity: 'error',
        message: `Lupa tanda negatif: seharusnya -b = ${-b}, bukan ${numB}`,
        hint: 'Dalam rumus kuadratik, pembilang dimulai dengan -b (negatif dari b)',
      });
    }

    // Check 2a
    if (Math.abs(denom - (2 * a)) > 0.001) {
      errors.push({
        lineIndex,
        severity: 'error',
        message: `Penyebut salah: seharusnya 2a = 2×${a} = ${2 * a}, bukan ${denom}`,
        hint: 'Penyebut rumus kuadratik adalah 2a, bukan 2 saja atau a saja',
      });
    }
  }

  return errors;
}

// ─── Validator: Basic Arithmetic ───
function validateArithmetic(
  parsed: ParsedLine,
  lineIndex: number,
  context: ValidationContext
): DiagnosticError[] {
  const errors: DiagnosticError[] = [];
  const raw = parsed.raw.trim();

  // Detect simple arithmetic: <expr> = <number>
  // Pattern: a + b = c, a - b = c, a * b = c, a^2 = c
  const simpleCalcMatch = raw.match(/(-?\d+\.?\d*)\s*([+\-*/^])\s*(-?\d+\.?\d*)\s*=\s*(-?\d+\.?\d*)/);

  if (simpleCalcMatch) {
    const left = parseFloat(simpleCalcMatch[1]);
    const op = simpleCalcMatch[2];
    const right = parseFloat(simpleCalcMatch[3]);
    const declared = parseFloat(simpleCalcMatch[4]);

    let correct: number | null = null;
    switch (op) {
      case '+': correct = left + right; break;
      case '-': correct = left - right; break;
      case '*': correct = left * right; break;
      case '/': correct = right !== 0 ? left / right : null; break;
      case '^': correct = Math.pow(left, right); break;
    }

    if (correct !== null && Math.abs(declared - correct) > 0.001) {
      errors.push({
        lineIndex,
        severity: 'error',
        message: `Kesalahan hitung: ${left} ${op} ${right} = ${correct}, bukan ${declared}`,
        hint: `Periksa kembali operasi ${left} ${op} ${right}`,
      });
    }
  }

  return errors;
}

// ─── Validator: Consistency Between Lines ───
function validateConsistency(
  parsed: ParsedLine,
  lineIndex: number,
  context: ValidationContext
): DiagnosticError[] {
  const errors: DiagnosticError[] = [];

  // Skip if no previous line or current line is empty
  if (!context.previousLine || !parsed.raw.trim()) return errors;

  // Check: if previous line declared D and current line uses √D with wrong value
  if (context.declaredDiscriminant !== null) {
    const raw = parsed.raw.trim();
    const sqrtDMatch = raw.match(/√\(?(\d+\.?\d*)\)?/);

    if (sqrtDMatch) {
      const sqrtArg = parseFloat(sqrtDMatch[1]);
      const D = context.declaredDiscriminant;

      if (D < 0 && sqrtArg === Math.abs(D)) {
        // Student might be taking √|D| when D is negative
        errors.push({
          lineIndex,
          severity: 'warning',
          message: `D = ${D} (negatif). √D tidak terdefinisi di bilangan real.`,
          hint: 'Jika D < 0, persamaan tidak memiliki akar real. Tidak bisa mengambil akar kuadrat dari bilangan negatif.',
        });
      } else if (Math.abs(sqrtArg - D) > 0.001 && D >= 0) {
        errors.push({
          lineIndex,
          severity: 'warning',
          message: `Nilai dalam √ tidak konsisten: √${sqrtArg}, tetapi D = ${D}`,
          hint: 'Pastikan nilai di dalam akar kuadrat sama dengan diskriminan yang sudah dihitung',
        });
      }
    }
  }

  return errors;
}

/**
 * Quick validation for a single line (used for real-time feedback)
 */
export function validateSingleLine(
  line: string,
  allLines: string[],
  lineIndex: number
): DiagnosticError[] {
  const { errors } = validateStudentWork(allLines);
  return errors.filter(e => e.lineIndex === lineIndex);
}
