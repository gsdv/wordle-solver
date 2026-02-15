import {parentPort, workerData} from "node:worker_threads";
import {topKEntropyGuesses} from "./entropy.js";

type WorkerInput = {
	allWords: string[];
	possibleSolutions: string[];
	wordLen: number;
	topN: number;
};

const {allWords, possibleSolutions, wordLen, topN} = workerData as WorkerInput;
const result = topKEntropyGuesses(allWords, possibleSolutions, wordLen, topN);
parentPort!.postMessage(result);
