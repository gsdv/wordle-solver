# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Build:** `npm run build` (runs `tsc`)
- **Dev:** `npm run dev` (runs `tsc --watch`)
- **Test:** `npm test` (runs `prettier --check . && xo && ava`)
- **Lint only:** `npx xo` (ESLint via xo with xo-react config, prettier integration)
- **Format check:** `npx prettier --check .`
- **Run the TUI app:** `node dist/index.js wordlist.txt --len 5`

## Architecture

**`source/index.tsx`** — Ink (React-based terminal UI) app. This is the main application, compiled to `dist/` and exposed as the package bin. It renders `source/ui/App.tsx` which provides an interactive TUI with recommendations, history display, and pattern input.


### Engine (`source/engine/`)

Pure logic, no UI dependencies:

- **`wordle.ts`** — Core Wordle types (`Tile` enum: C/P/N), `feedback()` (two-pass green-then-yellow), `parsePattern()`, `patternKey()`, `patternCode()` (base-3 encoding)
- **`entropy.ts`** — Information-theoretic scoring: `entropyForGuess()` buckets all possible feedbacks into a `Int32Array(3^wordLen)` and computes Shannon entropy. `topKEntropyGuesses()` uses a min-heap to find the top-K guesses efficiently.
- **`state.ts`** — `SolverState` type and state transitions: `computeTop()`, `prunePossibleSolutions()` (pattern-consistency filtering), `applyTurn()`
- **`util/minheap/`** — Bounded min-heap (capacity K) for top-K selection
- **`util/wordlist/`** — `loadWordList()` reads a file and filters to words matching expected length

### UI (`source/ui/`)

- **`App.tsx`** — Ink component with two-phase input (guess → pattern), recommendation display with entropy heat coloring, and a history sidebar with colored tiles

## Conventions

- ESM (`"type": "module"` in package.json); all internal imports use `.js` extensions
- TypeScript strict mode via `@sindresorhus/tsconfig`
- Linting: xo with xo-react preset, prettier enabled, `react/prop-types` off
- Formatting: `@vdemedes/prettier-config`
- Tests: ava with ts-node/esm loader
- Pattern notation: C = correct/green, P = present/yellow, N = not present/gray
