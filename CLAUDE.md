# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Build:** `npm run build` (runs `tsc`)
- **Dev:** `npm run dev` (runs `tsc --watch`)
- **Test:** `npm test` (runs `prettier --check . && xo && ava`)
- **Lint only:** `npx xo` (ESLint via xo with xo-react config, prettier integration)
- **Format check:** `npx prettier --check .`
- **Run the TUI app:** `node dist/index.js wordlist.txt`

## Architecture

**`source/index.tsx`** — Ink (React-based terminal UI) app. This is the main application, compiled to `dist/` and exposed as the package bin. It renders `source/ui/App.tsx` which provides an interactive TUI with recommendations, history display, and pattern input.


### Engine (`source/engine/`)

Pure logic, no UI dependencies:

- **`wordle.ts`** — Core Wordle types (`Tile` enum: C/P/N), `feedback()` (two-pass green-then-yellow), `parsePattern()`, `patternKey()`, `patternCode()` (base-3 encoding), `feedbackCode()` (fused feedback+patternCode returning base-3 int directly, zero-alloc hot path)
- **`entropy.ts`** — Information-theoretic scoring: `topKEntropyGuesses()` pre-encodes words into flat `Uint8Array` buffers, inlines feedback code computation, and uses a min-heap for top-K selection
- **`worker.ts`** — Worker thread that runs `topKEntropyGuesses` off the main thread
- **`computeAsync.ts`** — Spawns `worker.ts` via `worker_threads` and returns `Promise<Scored[]>`
- **`state.ts`** — `SolverState` type, `computeTop()` (sync), `prunePossibleSolutions()` (pattern-consistency filtering), `applyTurn()`
- **`util/minheap/`** — Bounded min-heap (capacity K) for top-K selection
- **`util/wordlist/`** — `loadWordList()` reads a file and filters to words matching expected length

### UI (`source/ui/`)

- **`App.tsx`** — Ink component using `useReducer` + raw `useInput` (no `TextInput`). Two-phase input (guess → pattern), top guesses with entropy heat coloring, potential solutions list, and history with colored tiles. Computation runs in a worker thread via `computeTopAsync`.

## Conventions

- ESM (`"type": "module"` in package.json); all internal imports use `.js` extensions
- TypeScript strict mode via `@sindresorhus/tsconfig`
- Linting: xo with xo-react preset, prettier enabled, `react/prop-types` off
- Formatting: `@vdemedes/prettier-config`
- Tests: ava with ts-node/esm loader
- Pattern notation: 2 = correct/green, 1 = present/yellow, 0 = not present/gray
