
import {render} from "ink";
import App from "./ui/App.js";

function usage(): never {
  process.stderr.write("Usage: wordle-solver <wordlist.txt>\n");
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length < 1) usage();

const wordlistPath = args[0];

render(<App wordlistPath={wordlistPath} topN={10} />);
