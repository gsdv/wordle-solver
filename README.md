# wordle-solver

An interactive terminal UI for solving [Wordle](https://www.nytimes.com/games/wordle/index.html) puzzles. It recommends optimal guesses using information theory (Shannon entropy), narrowing down the solution space as you play.

## Features

- Ranked guess recommendations scored by entropy
- Live list of remaining potential solutions
- Color-coded Wordle tiles in the input and guess history
- Works with any word length — just provide a matching word list
- Computation runs in a background worker thread so the UI stays responsive

## Getting started

### Install dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

### Run

```bash
node dist/index.js <wordlist>
```

Word length is determined automatically from the first word in the list. All words must be the same length.

#### Provided word lists

```bash
node dist/index.js ./word-lists/5-letters.txt   # Standard 5-letter Wordle
node dist/index.js ./word-lists/4-letters.txt   # 4-letter version
node dist/index.js ./word-lists/3-letters.txt   # 3-letter version
```

#### Custom word lists

You can pass any text file with one word per line:

```bash
node dist/index.js ./path/to/your-list.txt
```

Words are normalized to lowercase on load. If any word doesn't match the length of the first word, the program will exit with error.

## Playing

The solver alternates between two input phases:

### 1. Enter your guess

Type the word you guessed in Wordle and press Enter. Only lowercase `a-z` characters are accepted.

### 2. Enter the pattern

After submitting a guess, enter the feedback pattern Wordle gave you using digits:

| Key | Meaning        | Color  |
|-----|----------------|--------|
| `2` | Correct        | Green  |
| `1` | Wrong position | Yellow |
| `0` | Not in word    | Gray   |

The input renders as color-coded tiles as you type, so you can visually confirm it matches what Wordle showed you.

Once submitted, the solver prunes the solution space, recomputes recommendations, and you're ready for the next turn.

### Controls

- **Enter** — Submit guess or pattern
- **Backspace** — Delete last character
- **Ctrl+R** — Reset and start a new game
- **Escape** — Quit

## How it works

The solver uses **Shannon entropy** to rank guesses by how much information they're expected to reveal.

For each candidate guess, it simulates the feedback pattern (green/yellow/gray) that would result against every remaining possible solution. These outcomes are bucketed by their pattern, and the entropy is computed as:

```
H(guess) = - sum( p(pattern) * log2(p(pattern)) )
```

where `p(pattern)` is the fraction of remaining solutions that produce a given feedback pattern. A higher entropy means the guess splits the solution space more evenly, which on average eliminates more candidates regardless of what the answer turns out to be.