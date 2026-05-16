/**
 * BIKAN Math Expression Parser
 * ─────────────────────────────
 * PRD US-ALG-003: Parser ekspresi matematika berbasis sintaksis LaTeX
 * secara dinamis per baris pengerjaan siswa.
 *
 * Mendukung:
 * - Persamaan kuadrat: ax² + bx + c = 0
 * - Pemfaktoran: (x + p)(x + q) = 0
 * - Langkah diskriminan: D = b² - 4ac
 * - Substitusi dan simplifikasi
 * - Rumus kuadratik: x = (-b ± √D) / 2a
 */

// ─── Token Types ───
export type TokenType =
  | 'NUMBER'
  | 'VARIABLE'
  | 'OPERATOR'
  | 'EQUALS'
  | 'LPAREN'
  | 'RPAREN'
  | 'POWER'
  | 'SQRT'
  | 'PLUS_MINUS'
  | 'FRACTION'
  | 'WHITESPACE'
  | 'UNKNOWN';

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

// ─── AST Node Types ───
export type NodeType =
  | 'Equation'
  | 'BinaryOp'
  | 'UnaryOp'
  | 'Number'
  | 'Variable'
  | 'Power'
  | 'Sqrt'
  | 'Fraction'
  | 'Parenthesized'
  | 'FactoredForm'
  | 'PlusMinus';

export interface ASTNode {
  type: NodeType;
  value?: string | number;
  left?: ASTNode;
  right?: ASTNode;
  children?: ASTNode[];
  operator?: string;
}

// ─── Parsed Line Result ───
export interface ParsedLine {
  raw: string;
  tokens: Token[];
  ast: ASTNode | null;
  parseError: string | null;
}

/**
 * Tokenizer: Converts raw math string to tokens
 * Supports both plain text and simplified LaTeX notation
 */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  // Normalize LaTeX shortcuts
  let normalized = input
    .replace(/\\sqrt\{([^}]*)\}/g, '√($1)')
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)')
    .replace(/\\pm/g, '±')
    .replace(/\\times/g, '*')
    .replace(/\\cdot/g, '*')
    .replace(/\^2/g, '²')
    .replace(/\^{2}/g, '²')
    .replace(/x²/g, 'x^2')
    .replace(/²/g, '^2')
    .trim();

  while (i < normalized.length) {
    const ch = normalized[i];

    // Whitespace
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Numbers (including decimals and negatives at start)
    if (/\d/.test(ch) || (ch === '-' && (tokens.length === 0 || tokens[tokens.length - 1].type === 'OPERATOR' || tokens[tokens.length - 1].type === 'EQUALS' || tokens[tokens.length - 1].type === 'LPAREN'))) {
      let num = '';
      if (ch === '-') { num += '-'; i++; }
      while (i < normalized.length && (/\d/.test(normalized[i]) || normalized[i] === '.')) {
        num += normalized[i];
        i++;
      }
      if (num === '-') {
        tokens.push({ type: 'OPERATOR', value: '-', position: i - 1 });
      } else {
        tokens.push({ type: 'NUMBER', value: num, position: i - num.length });
      }
      continue;
    }

    // Variables (x, y, a, b, c, D)
    if (/[a-zA-Z]/.test(ch)) {
      let varName = '';
      const startPos = i;
      while (i < normalized.length && /[a-zA-Z_]/.test(normalized[i])) {
        varName += normalized[i];
        i++;
      }
      tokens.push({ type: 'VARIABLE', value: varName, position: startPos });
      continue;
    }

    // Operators
    if (['+', '-', '*', '/'].includes(ch)) {
      tokens.push({ type: 'OPERATOR', value: ch, position: i });
      i++;
      continue;
    }

    // Equals
    if (ch === '=') {
      tokens.push({ type: 'EQUALS', value: '=', position: i });
      i++;
      continue;
    }

    // Parentheses
    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(', position: i });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')', position: i });
      i++;
      continue;
    }

    // Power
    if (ch === '^') {
      tokens.push({ type: 'POWER', value: '^', position: i });
      i++;
      continue;
    }

    // Square root
    if (ch === '√') {
      tokens.push({ type: 'SQRT', value: '√', position: i });
      i++;
      continue;
    }

    // Plus-minus
    if (ch === '±') {
      tokens.push({ type: 'PLUS_MINUS', value: '±', position: i });
      i++;
      continue;
    }

    // Unknown
    tokens.push({ type: 'UNKNOWN', value: ch, position: i });
    i++;
  }

  return tokens;
}

/**
 * Parser: Builds a simplified AST from tokens
 * Handles: equations, binary ops, parenthesized expressions, powers
 */
export function parse(tokens: Token[]): { ast: ASTNode | null; error: string | null } {
  let pos = 0;

  function peek(): Token | null {
    return pos < tokens.length ? tokens[pos] : null;
  }

  function consume(expectedType?: TokenType): Token | null {
    const token = peek();
    if (!token) return null;
    if (expectedType && token.type !== expectedType) return null;
    pos++;
    return token;
  }

  function parseExpression(): ASTNode | null {
    let left = parseTerm();
    if (!left) return null;

    while (peek()?.type === 'OPERATOR' && (peek()?.value === '+' || peek()?.value === '-')) {
      const op = consume()!;
      const right = parseTerm();
      if (!right) return left;
      left = { type: 'BinaryOp', operator: op.value, left, right };
    }

    // Check for equation (=)
    if (peek()?.type === 'EQUALS') {
      consume();
      const right = parseExpression();
      if (right) {
        return { type: 'Equation', left, right };
      }
    }

    return left;
  }

  function parseTerm(): ASTNode | null {
    let left = parseFactor();
    if (!left) return null;

    while (peek()?.type === 'OPERATOR' && (peek()?.value === '*' || peek()?.value === '/')) {
      const op = consume()!;
      const right = parseFactor();
      if (!right) return left;
      left = { type: 'BinaryOp', operator: op.value, left, right };
    }

    // Implicit multiplication: number followed by variable, or variable followed by paren
    while (
      peek() &&
      ((left.type === 'Number' && peek()?.type === 'VARIABLE') ||
       (left.type === 'Number' && peek()?.type === 'LPAREN') ||
       (left.type === 'Variable' && peek()?.type === 'LPAREN'))
    ) {
      const right = parseFactor();
      if (!right) break;
      left = { type: 'BinaryOp', operator: '*', left, right };
    }

    return left;
  }

  function parseFactor(): ASTNode | null {
    const token = peek();
    if (!token) return null;

    // Unary minus
    if (token.type === 'OPERATOR' && token.value === '-') {
      consume();
      const operand = parseFactor();
      if (!operand) return null;
      return { type: 'UnaryOp', operator: '-', right: operand };
    }

    // Square root
    if (token.type === 'SQRT') {
      consume();
      const operand = parseFactor();
      return { type: 'Sqrt', right: operand ?? undefined };
    }

    // Plus-minus
    if (token.type === 'PLUS_MINUS') {
      consume();
      const operand = parseFactor();
      return { type: 'PlusMinus', right: operand ?? undefined };
    }

    // Parenthesized expression
    if (token.type === 'LPAREN') {
      consume();
      const expr = parseExpression();
      consume('RPAREN'); // consume closing paren
      const node: ASTNode = { type: 'Parenthesized', children: expr ? [expr] : [] };

      // Check for power after parenthesized
      if (peek()?.type === 'POWER') {
        consume();
        const exp = parseFactor();
        return { type: 'Power', left: node, right: exp ?? undefined };
      }

      // Check for another parenthesized (factored form)
      if (peek()?.type === 'LPAREN') {
        const right = parseFactor();
        if (right) {
          return { type: 'FactoredForm', left: node, right };
        }
      }

      return node;
    }

    // Number
    if (token.type === 'NUMBER') {
      consume();
      const numNode: ASTNode = { type: 'Number', value: parseFloat(token.value) };

      // Check for power
      if (peek()?.type === 'POWER') {
        consume();
        const exp = parseFactor();
        return { type: 'Power', left: numNode, right: exp ?? undefined };
      }

      return numNode;
    }

    // Variable
    if (token.type === 'VARIABLE') {
      consume();
      const varNode: ASTNode = { type: 'Variable', value: token.value };

      // Check for power
      if (peek()?.type === 'POWER') {
        consume();
        const exp = parseFactor();
        return { type: 'Power', left: varNode, right: exp ?? undefined };
      }

      return varNode;
    }

    // Skip unknown tokens
    consume();
    return null;
  }

  try {
    const ast = parseExpression();
    return { ast, error: null };
  } catch (e: any) {
    return { ast: null, error: e.message || 'Parse error' };
  }
}

/**
 * Parse a single line of student work
 */
export function parseLine(raw: string): ParsedLine {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { raw, tokens: [], ast: null, parseError: null };
  }

  const tokens = tokenize(trimmed);
  const { ast, error } = parse(tokens);

  return { raw, tokens, ast, parseError: error };
}
