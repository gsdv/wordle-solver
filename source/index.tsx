
import {render} from "ink";
import App from "./ui/App.js";

function usage(): never {
  // keep it minimal; Ink app is the UI
  // args: wordlist path and optional --len
  // example: node dist/index.js words.txt --len 5
  // or with ts-node/tsx depending on the scaffold
  process.stderr.write("Usage: wordle-ink <wordlist.txt> [--len 5]\n");
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length < 1) usage();

const wordlistPath = args[0];
const lenIdx = args.indexOf("--len");
const wordLen = lenIdx >= 0 ? Number(args[lenIdx + 1]) : 5;
if (!Number.isFinite(wordLen) || wordLen <= 0) usage();

render(<App wordlistPath={wordlistPath} wordLen={wordLen} topN={10} />);
