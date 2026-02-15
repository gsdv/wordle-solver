import {MinHeap, type Scored} from "./util/minheap/index.js";

const aCode = 97;

function encodeWords(words: string[], wordLen: number): Uint8Array {
  const buf = new Uint8Array(words.length * wordLen);
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const off = i * wordLen;
    for (let j = 0; j < wordLen; j++) {
      buf[off + j] = w.charCodeAt(j) - aCode;
    }
  }

  return buf;
}

export function topKEntropyGuesses(
  allGuesses: string[],
  possibleSolutions: string[],
  wordLen: number,
  k: number,
): Scored[] {
  const nSolutions = possibleSolutions.length;
  if (nSolutions === 0) return [];

  const guessBuf = encodeWords(allGuesses, wordLen);
  const solBuf = encodeWords(possibleSolutions, wordLen);

  const numBuckets = 3 ** wordLen;
  const buckets = new Int32Array(numBuckets);
  const remaining = new Uint8Array(26);
  const heap = new MinHeap(k);
  const invN = 1 / nSolutions;
  const invLn2 = 1 / Math.LN2;

  for (let gi = 0; gi < allGuesses.length; gi++) {
    const gOff = gi * wordLen;

    // Clear buckets
    buckets.fill(0);

    for (let si = 0; si < nSolutions; si++) {
      const sOff = si * wordLen;

      // Inline feedbackCode — no function call overhead
      remaining.fill(0);
      let greenMask = 0;

      for (let j = 0; j < wordLen; j++) {
        if (guessBuf[gOff + j] === solBuf[sOff + j]) {
          greenMask |= 1 << j;
        } else {
          remaining[solBuf[sOff + j]]++;
        }
      }

      let code = 0;
      for (let j = 0; j < wordLen; j++) {
        code *= 3;
        if (greenMask & (1 << j)) {
          code += 2;
        } else {
          const idx = guessBuf[gOff + j];
          if (remaining[idx] > 0) {
            remaining[idx]--;
            code += 1;
          }
        }
      }

      buckets[code]++;
    }

    // Compute entropy
    let H = 0;
    for (let b = 0; b < numBuckets; b++) {
      const count = buckets[b];
      if (count > 0) {
        const p = count * invN;
        H -= p * Math.log(p) * invLn2;
      }
    }

    heap.push({guess: allGuesses[gi], entropy: H});
  }

  return heap.toSortedDesc();
}
