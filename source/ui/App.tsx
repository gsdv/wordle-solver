import {useCallback, useEffect, useReducer, useRef} from "react";
import {Box, Text, useApp, useInput} from "ink";
import Spinner from "ink-spinner";

import {loadWordList} from "../engine/util/wordlist/index.js";
import {computeTopAsync} from "../engine/computeAsync.js";
import {Tile, type Tile as TileT, parsePattern} from "../engine/wordle.js";
import {prunePossibleSolutions} from "../engine/state.js";
import type {Scored} from "../engine/util/minheap/index.js";

type Props = {
	wordlistPath: string;
	topN?: number;
};

type Turn = {guess: string; observed: TileT[]};

type Phase = "guess" | "pattern";

type State = {
	allWords: string[];
	possibleSolutions: string[];
	wordLen: number;
	topN: number;
	history: Turn[];
	top: Scored[];
	busy: boolean;
	phase: Phase;
	input: string;
	currentGuess: string;
	error: string | null;
	done: boolean;
};

type Action =
	| {type: "SET_TOP"; top: Scored[]}
	| {type: "SET_INPUT"; input: string}
	| {type: "SET_ERROR"; error: string}
	| {type: "SUBMIT_GUESS"; guess: string}
	| {type: "SUBMIT_PATTERN"; next: State}
	| {type: "COMPUTING"}
	| {type: "SOLVED"; history: Turn[]};

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "SET_TOP": {
			return {...state, top: action.top, busy: false};
		}

		case "SET_INPUT": {
			return {...state, input: action.input, error: null};
		}

		case "SET_ERROR": {
			return {...state, error: action.error};
		}

		case "SUBMIT_GUESS": {
			return {
				...state,
				currentGuess: action.guess,
				phase: "pattern",
				input: "",
				error: null,
			};
		}

		case "COMPUTING": {
			return {...state, busy: true};
		}

		case "SUBMIT_PATTERN": {
			return action.next;
		}

		case "SOLVED": {
			return {...state, history: action.history, done: true};
		}

		default: {
			return state;
		}
	}
}

function tileBg(t: TileT): string {
	if (t === Tile.Correct) return "green";
	if (t === Tile.Present) return "yellow";
	return "gray";
}

function heatColor(t: number): string {
	if (t >= 0.85) return "green";
	if (t >= 0.65) return "yellow";
	if (t >= 0.45) return "magenta";
	return "red";
}

export default function App({wordlistPath, topN = 10}: Props) {
	const {exit} = useApp();

	const loadedRef = useRef<{words: string[]; wordLen: number} | null>(null);
	if (!loadedRef.current) {
		loadedRef.current = loadWordList(wordlistPath);
	}

	const {words: allWords, wordLen} = loadedRef.current;

	const [state, dispatch] = useReducer(reducer, {
		allWords,
		possibleSolutions: allWords,
		wordLen,
		topN,
		history: [],
		top: [],
		busy: true,
		phase: "guess" as Phase,
		input: "",
		currentGuess: "",
		error: null,
		done: false,
	});

	const compute = useCallback(
		async (possibleSolutions: string[]) => {
			dispatch({type: "COMPUTING"});
			const top = await computeTopAsync(
				allWords,
				possibleSolutions,
				wordLen,
				topN,
			);
			dispatch({type: "SET_TOP", top});
		},
		[allWords, wordLen, topN],
	);

	// Initial compute
	useEffect(() => {
		void compute(allWords);
	}, [allWords, compute]);

	useInput((input, key) => {
		if (state.done) return;
		if (state.busy) return;

		if (key.return) {
			if (state.phase === "guess") {
				const g = state.input.trim().toLowerCase();
				if (g.length !== wordLen || !/^[a-z]+$/.test(g)) {
					dispatch({
						type: "SET_ERROR",
						error: `Guess must be ${wordLen} lowercase letters.`,
					});
					return;
				}

				dispatch({type: "SUBMIT_GUESS", guess: g});
			} else {
				const obs = parsePattern(state.input, wordLen);
				if (!obs) {
					dispatch({
						type: "SET_ERROR",
						error: `Pattern must be ${wordLen} chars of 0/1/2.`,
					});
					return;
				}

				if (obs.every((t) => t === Tile.Correct)) {
					dispatch({
						type: "SOLVED",
						history: [
							...state.history,
							{guess: state.currentGuess, observed: obs},
						],
					});
					setTimeout(() => {
						exit();
					}, 100);
					return;
				}

				const nextPS = prunePossibleSolutions(
					state.possibleSolutions,
					state.currentGuess,
					obs,
				);
				const nextHistory = [
					...state.history,
					{guess: state.currentGuess, observed: obs},
				];

				dispatch({
					type: "SUBMIT_PATTERN",
					next: {
						...state,
						possibleSolutions: nextPS,
						history: nextHistory,
						phase: "guess",
						input: "",
						currentGuess: "",
						error: null,
						top: [],
						busy: true,
						done: false,
					},
				});
				void compute(nextPS);
			}
		} else if (key.backspace || key.delete) {
			dispatch({type: "SET_INPUT", input: state.input.slice(0, -1)});
		} else if (key.escape) {
			exit();
		} else if (input && !key.ctrl && !key.meta) {
			if (state.input.length >= wordLen) return;
			if (state.phase === "guess" && !/^[a-z]+$/.test(input)) return;
			if (state.phase === "pattern" && !/^[012]+$/.test(input)) return;
			dispatch({type: "SET_INPUT", input: state.input + input});
		}
	});

	const turn = state.history.length + 1;

	// Entropy range for heat coloring
	let eMin = 0;
	let eMax = 1;
	if (state.top.length > 0) {
		eMin = state.top[state.top.length - 1].entropy;
		eMax = state.top[0].entropy;
		if (eMax === eMin) eMax = eMin + 1e-9;
	}

	return (
		<Box flexDirection="column">
			{/* Header */}
			<Box>
				<Text bold color="green">
					Wordle Solver
				</Text>
				<Text> | Turn {turn}</Text>
				<Text> | Remaining: {state.possibleSolutions.length}</Text>
				{state.busy && (
					<Text>
						{" "}
						| <Spinner type="dots" /> Computing...
					</Text>
				)}
			</Box>

			<Box marginTop={1} flexDirection="row">
				{/* Recommendations */}
				<Box flexDirection="column" width={40}>
					<Text bold underline>
						Top Guesses
					</Text>
					{state.top.length === 0 && !state.busy && (
						<Text dimColor>No data yet</Text>
					)}
					{state.top.map((x, i) => {
						const t =
							(x.entropy - eMin) / (eMax - eMin);
						const c = heatColor(t);
						return (
							<Text key={x.guess}>
								<Text>
									{String(i + 1).padStart(2, " ")}.{" "}
								</Text>
								<Text bold>{x.guess}</Text>
								<Text color={c}>
									{" "}
									{x.entropy.toFixed(4)} bits
								</Text>
							</Text>
						);
					})}
				</Box>

				{/* Potential Solutions */}
				<Box flexDirection="column" width={24} marginLeft={2}>
					<Text bold underline>
						Potential Solutions
					</Text>
					{state.possibleSolutions.length === 0 ? (
						<Text dimColor>None</Text>
					) : (
						<>
							{state.possibleSolutions.slice(0, 10).map((w) => (
								<Text key={w}> {w}</Text>
							))}
							{state.possibleSolutions.length > 10 && (
								<Text dimColor>
									{" "}
									...and {state.possibleSolutions.length - 10} more
								</Text>
							)}
						</>
					)}
				</Box>

				{/* History */}
				<Box flexDirection="column" marginLeft={2}>
					<Text bold underline>
						History
					</Text>
					{state.history.length === 0 ? (
						<Text dimColor>No guesses yet</Text>
					) : (
						state.history.map((h, idx) => (
							<Box key={idx}>
								<Text>{idx + 1}. </Text>
								{h.observed.map((t, i) => (
									<Text
										key={i}
										backgroundColor={tileBg(t)}
										color="white"
										bold
									>
										{" "}
										{h.guess[i].toUpperCase()}{" "}
									</Text>
								))}
							</Box>
						))
					)}
				</Box>
			</Box>

			{/* Input */}
			<Box marginTop={1} flexDirection="column">
				{state.error && <Text color="red">{state.error}</Text>}
				{state.done ? (
					<Text bold color="green">
						Solved in {state.history.length} guesses!
					</Text>
				) : (
					<Box>
						<Text>
							{state.phase === "guess"
								? "Guess: "
								: "Pattern: "}
						</Text>
						{state.phase === "guess" ? (
							<>
								<Text bold color="cyan">
									{state.input}
								</Text>
								<Text dimColor>_</Text>
							</>
						) : (
							<>
								{state.input.split("").map((ch, i) => (
									<Text
										key={i}
										bold
										color="white"
										backgroundColor={
											ch === "2"
												? "green"
												: ch === "1"
													? "yellow"
													: "gray"
										}
									>
										{" "}
										{state.currentGuess[i].toUpperCase()}{" "}
									</Text>
								))}
								{state.input.length < wordLen && (
									<Text dimColor>_</Text>
								)}
							</>
						)}
					</Box>
				)}
				{state.phase === "pattern" && !state.done && (
					<Box marginTop={1}>
					<Text dimColor>
						<Text backgroundColor="green" color="white"> 2 </Text>
						{" correct  "}
						<Text backgroundColor="yellow" color="white"> 1 </Text>
						{" wrong spot  "}
						<Text backgroundColor="gray" color="white"> 0 </Text>
						{" not in word"}
					</Text>
					</Box>
				)}
			</Box>
		</Box>
	);
}
