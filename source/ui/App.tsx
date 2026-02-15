import {useEffect, useMemo, useState} from "react";
import {Box, Text, useApp} from "ink";
import Spinner from "ink-spinner";
import {TextInput} from "@inkjs/ui";

import {loadWordList} from "../engine/util/wordlist/index.js";
import {Tile, type Tile as TileT, parsePattern} from "../engine/wordle.js";
import type {SolverState} from "../engine/state.js";
import {applyTurn, computeTop} from "../engine/state.js";

type Props = {
  wordlistPath: string;
  wordLen: number;
  topN?: number;
};

function tileBg(t: TileT): {backgroundColor: string; color: string} {
  // Wordle-ish palette; adjust as desired
  if (t === Tile.Correct) return {backgroundColor: "green", color: "black"};
  if (t === Tile.Present) return {backgroundColor: "yellow", color: "black"};
  return {backgroundColor: "gray", color: "black"};
}

function heatColor(t: number): string {
  // t in [0,1]; simple discrete ramp (readable in most terminals)
  if (t >= 0.85) return "green";
  if (t >= 0.65) return "yellow";
  if (t >= 0.45) return "magenta";
  return "red";
}

export default function App({wordlistPath, wordLen, topN = 10}: Props) {
  const {exit} = useApp();

  const [busy, setBusy] = useState(true);
  const [phase, setPhase] = useState<"guess" | "pattern">("guess");
  const [guess, setGuess] = useState("");
  const [_, setPattern] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [state, setState] = useState<SolverState>(() => {
    const allWords = loadWordList(wordlistPath, wordLen);
    const base = {
      wordLen,
      allWords,
      possibleSolutions: [...allWords],
      history: [],
    };
    return {
      ...base,
      top: [], // computed below
    };
  });

  // initial compute
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBusy(true);
      // yield a tick so the spinner can render
      await new Promise((r) => setTimeout(r, 0));
      const base = {...state, top: []};
      const top = computeTop(base, topN);
      if (!cancelled) {
        setState((s) => ({...s, top}));
        setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const turn = state.history.length + 1;

  const entropyRange = useMemo(() => {
    if (state.top.length === 0) return {min: 0, max: 1};
    let min = state.top[0].entropy;
    let max = state.top[0].entropy;
    for (const x of state.top) {
      if (x.entropy < min) min = x.entropy;
      if (x.entropy > max) max = x.entropy;
    }
    return {min, max: max === min ? min + 1e-9 : max};
  }, [state.top]);

  async function recomputeAndSet(next: SolverState) {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 0));
    // const top = computeTop({...next, top: []}, topN);
    const { top: _discard, ...base } = next;
    const top = computeTop(base, topN);

    setState({...next, top});
    setBusy(false);
  }

  function onSubmitGuess(value: string) {
    const g = value.trim().toLowerCase();
    if (g.length !== wordLen || !/^[a-z]+$/.test(g)) {
      setError(`Guess must be ${wordLen} lowercase letters.`);
      return;
    }
    setError(null);
    setGuess(g);
    setPhase("pattern");
  }

  async function onSubmitPattern(value: string) {
    const obs = parsePattern(value, wordLen);
    if (!obs) {
      setError(`Pattern must be ${wordLen} chars of C/P/N.`);
      return;
    }
    setError(null);

    // solved?
    if (obs.every((t) => t === Tile.Correct)) {
      // record it then exit
      const next = applyTurn(state, guess, obs, topN);
      setState(next);
      exit();
      return;
    }

    const next = applyTurn(state, guess, obs, topN);
    setPattern("");
    setGuess("");
    setPhase("guess");
    await recomputeAndSet(next);
  }

  return (
    <Box flexDirection="column" height={process.stdout.rows}>
      {/* Header */}
      <Box justifyContent="space-between">
        <Text bold>Wordle Solver</Text>
        <Box>
          <Text>Turn {turn}  </Text>
          <Text>Remaining: {state.possibleSolutions.length}  </Text>
          {busy && (
            <Text>
              <Spinner type="dots" /> Scoring…
            </Text>
          )}
        </Box>
      </Box>

      {/* Body */}
      <Box flexDirection="row" flexGrow={1} marginTop={1}>
        {/* Left: recommendations */}
        <Box flexDirection="column" flexGrow={1} paddingRight={2}>
          <Text bold>Top recommendations</Text>
          {state.top.length === 0 ? (
            <Text dimColor>(none yet)</Text>
          ) : (
            state.top.map((x, i) => {
              const t = (x.entropy - entropyRange.min) / (entropyRange.max - entropyRange.min);
              const c = heatColor(t);
              return (
                <Box key={x.guess} justifyContent="space-between">
                  <Text>
                    {String(i + 1).padStart(2, " ")}. {x.guess}
                  </Text>
                  <Text color={c}>H={x.entropy.toFixed(4)} bits</Text>
                </Box>
              );
            })
          )}
          <Box marginTop={1}>
            <Text dimColor>
              Tip: You can later add a sidebar tab for candidates, settings, etc.
            </Text>
          </Box>
        </Box>

        {/* Right: history */}
        <Box flexDirection="column" width={36} borderStyle="round" paddingX={1}>
          <Text bold>History</Text>
          {state.history.length === 0 ? (
            <Text dimColor>(none)</Text>
          ) : (
            state.history.map((h, idx) => (
              <Box key={idx} flexDirection="column" marginTop={1}>
                <Text>
                  {idx + 1}. {h.guess}
                </Text>
                <Box>
                  {h.observed.map((t, i) => {
                    const st = tileBg(t);
                    return (
                      <Box key={i} paddingX={1} marginRight={1}>
                        <Text {...st}>{h.guess[i].toUpperCase()}</Text>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Box>

      {/* Footer input */}
      <Box flexDirection="column" marginTop={1}>
        {error && <Text color="red">{error}</Text>}
        {phase === "guess" ? (
          <Box>
            <Text>Guess: </Text>
            <TextInput
  placeholder="press Enter to submit"
  onSubmit={onSubmitGuess}
            />
            <Text dimColor>  (blank not supported yet; easy to add)</Text>
          </Box>
        ) : (
          <Box>
            <Text>Pattern for “{guess}” (C/P/N): </Text>
            <TextInput
              placeholder="e.g. CPNN"
              onSubmit={onSubmitPattern}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
