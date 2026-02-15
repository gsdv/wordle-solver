# wordle-solver
Solve wordle in the terminal!



## Usage

### Make a build
```bash
npm run build
```

### Run
You can use the provided word lists, or pass in your own.
A word list must have one word per line, and all words need to be the same length
```bash
# Provided word lists
node dist/index.js ./word-lists/5-letters.txt # Standard 5-letter wordle
node dist/index.js ./word-lists/5-letters.txt # 4-letter version
node dist/index.js ./word-lists/5-letters.txt # 3-letter version

# Custom word list
node dist/index.js ./path/to/list.txt
```