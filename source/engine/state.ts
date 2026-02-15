import type {Scored} from "./util/minheap/index.js";
import type {Tile} from "./wordle.js";
import {patternKey, feedback} from "./wordle.js";
import {topKEntropyGuesses} from "./entropy.js";

export type Turn = { guess: string; observed: Tile[] };

export type SolverState = {
  wordLen: number;
  allWords: string[];
  possibleSolutions: string[];
  history: Turn[];
  top: Scored[];
};

export function computeTop(state: Omit<SolverState, "top">, topN: number): Scored[] {
  // early game: recommend from all words, finishing: can switch to state.possibleSolutions
  return topKEntropyGuesses(state.allWords, state.possibleSolutions, state.wordLen, topN);
}

export function prunePossibleSolutions(
  possibleSolutions: string[],
  guess: string,
  observed: Tile[]
): string[] {
  const obsKey = patternKey(observed);
  return possibleSolutions.filter((s) => patternKey(feedback(guess, s)) === obsKey);
}

export function applyTurn(state: SolverState, guess: string, observed: Tile[], topN: number): SolverState {
  const nextPS = prunePossibleSolutions(state.possibleSolutions, guess, observed);
  const base = {
    ...state,
    possibleSolutions: nextPS,
    history: [...state.history, {guess, observed}],
  };
  return { ...base, top: computeTop(base, topN) };
}
