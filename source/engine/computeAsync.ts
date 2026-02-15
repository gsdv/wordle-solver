import {Worker} from "node:worker_threads";
import * as path from "node:path";
import * as url from "node:url";
import type {Scored} from "./util/minheap/index.js";

const dirname = path.dirname(url.fileURLToPath(import.meta.url));
const workerPath = path.join(dirname, "worker.js");

export function computeTopAsync(
	allWords: string[],
	possibleSolutions: string[],
	wordLen: number,
	topN: number,
): Promise<Scored[]> {
	return new Promise((resolve, reject) => {
		const worker = new Worker(workerPath, {
			workerData: {allWords, possibleSolutions, wordLen, topN},
		});
		worker.on("message", (result: Scored[]) => {
			resolve(result);
		});
		worker.on("error", reject);
	});
}
