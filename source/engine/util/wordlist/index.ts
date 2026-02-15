import * as fs from "node:fs";

export type WordList = {words: string[]; wordLen: number};

export function loadWordList(path: string): WordList {
  const raw = fs.readFileSync(path, "utf8");
  const lines = raw
    .split(/\r?\n/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0 && /^[a-z]+$/.test(s));

  if (lines.length === 0) {
    throw new Error(`Word list at ${path} contains no valid words.`);
  }

  const wordLen = lines[0].length;
  for (const w of lines) {
    if (w.length !== wordLen) {
      throw new Error(
        `Inconsistent word length: expected ${wordLen} but found "${w}" (${w.length} chars).`,
      );
    }
  }

  return {words: lines, wordLen};
}
