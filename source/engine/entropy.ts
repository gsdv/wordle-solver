import {MinHeap, type Scored} from "./util/minheap/index.js";
import {feedback, patternCode} from "./wordle.js";

export function entropyForGuess(g: string, possibleSolutions: string[], wordLen: number): number {
  const n = possibleSolutions.length;
  if (n === 0) return 0;

  const buckets = new Int32Array(3 ** wordLen);
  for (const s of possibleSolutions) {
    buckets[patternCode(feedback(g, s))]++;
  }

  let H = 0;
  for (let i = 0; i < buckets.length; i++) {
    const count = buckets[i];
    if (!count || count === 0) continue;
    const p = count / n;
    H -= p * Math.log2(p);
  }
  return H;
}

export function topKEntropyGuesses(
  allGuesses: string[],
  possibleSolutions: string[],
  wordLen: number,
  k: number
): Scored[] {
  const heap = new MinHeap(k);
  for (const g of allGuesses) {
    const H = entropyForGuess(g, possibleSolutions, wordLen);
    heap.push({guess: g, entropy: H});
  }
  return heap.toSortedDesc();
}
