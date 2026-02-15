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