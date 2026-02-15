export const Tile = {
  Correct: "C",
  Present: "P",
  NotPresent: "N"
} as const;

export type Tile = typeof Tile[keyof typeof Tile];



export function feedback(guess: string, answer: string): Tile[] {
  const n = guess.length;
  const result: Tile[] = Array(n).fill(Tile.NotPresent);
  const remaining = new Map<string, number>();

  for (let i = 0; i < n; i++) {
    const g = guess[i]!;
    const a = answer[i]!;
    if (g === a) result[i] = Tile.Correct;
    else remaining.set(a, (remaining.get(a) ?? 0) + 1);
  }

  for (let i = 0; i < n; i++) {
    if (result[i] !== Tile.NotPresent) continue;
    const g = guess[i]!;
    const count = remaining.get(g) ?? 0;
    if (count > 0) {
      result[i] = Tile.Present;
      if (count === 1) remaining.delete(g);
      else remaining.set(g, count - 1);
    }
  }

  return result;
}

export function parsePattern(s: string, expectedLen: number): Tile[] | null {
  const t = s.trim().toUpperCase();
  if (t.length !== expectedLen) return null;

  const out: Tile[] = [];
  for (const ch of t) {
    if (ch === Tile.Correct) out.push(Tile.Correct);
    else if (ch === Tile.Present) out.push(Tile.Present);
    else if (ch === Tile.NotPresent) out.push(Tile.NotPresent);
    else return null;
  }
  return out;
}

export function patternKey(p: Tile[]): string {
  return p.join("");
}

export function patternCode(p: Tile[]): number {
  let code = 0;
  for (const t of p) {
    const d = t === Tile.NotPresent ? 0 : t === Tile.Present ? 1 : 2;
    code = code * 3 + d;
  }
  return code;
}

const aCode = 97; // 'a'.charCodeAt(0)
const remaining = new Uint8Array(26);

/**
 * Combined feedback + patternCode in one pass.
 * Returns the base-3 pattern code directly — no intermediate array/Map allocation.
 */
export function feedbackCode(guess: string, answer: string): number {
  const n = guess.length;

  // result[i]: 0=N, 1=P, 2=C
  // We'll build the base-3 code at the end using a powers array.
  // First pass: greens
  remaining.fill(0);

  // Use a small stack-allocated-style approach with local vars
  // We need per-position results, use a number encoding (pack into bits)
  let greenMask = 0; // bitmask of green positions

  for (let i = 0; i < n; i++) {
    if (guess.charCodeAt(i) === answer.charCodeAt(i)) {
      greenMask |= 1 << i;
    } else {
      remaining[answer.charCodeAt(i) - aCode]++;
    }
  }

  // Second pass: yellows, and compute code
  let code = 0;
  for (let i = 0; i < n; i++) {
    code *= 3;
    if (greenMask & (1 << i)) {
      code += 2; // Correct
    } else {
      const idx = guess.charCodeAt(i) - aCode;
      if (remaining[idx] > 0) {
        remaining[idx]--;
        code += 1; // Present
      }
      // else 0 (NotPresent), nothing to add
    }
  }

  return code;
}