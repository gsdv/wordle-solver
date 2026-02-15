import * as fs from "node:fs";

export function loadWordList(path: string, expectedLen: number): string[] {
  const raw = fs.readFileSync(path, "utf8");
  return raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length === expectedLen && /^[a-z]+$/.test(s));
}
