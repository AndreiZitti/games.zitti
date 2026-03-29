import { useState, useCallback } from "react";
import { generateGameColors, initialPickerHsb } from "../utils/colorGen";
import { calculateScore } from "../utils/color";

const TOTAL_ROUNDS = 3;

export default function useChromaGame() {
  const [phase, setPhase] = useState("home");
  const [difficulty, setDifficulty] = useState("easy");
  const [round, setRound] = useState(1);
  const [targetColors, setTargetColors] = useState([]);
  const [pickerColor, setPickerColor] = useState([180, 50, 50]);
  const [rounds, setRounds] = useState([]);

  const currentTarget = targetColors[round - 1] || [0, 50, 50];

  const startGame = useCallback((diff) => {
    const colors = generateGameColors();
    setDifficulty(diff);
    setTargetColors(colors);
    setRound(1);
    setRounds([]);
    setPickerColor(initialPickerHsb(colors[0]));
    setPhase("memorize");
  }, []);

  // Start with pre-generated colors (for challenge mode)
  const startGameWithColors = useCallback((diff, colors) => {
    setDifficulty(diff);
    setTargetColors(colors);
    setRound(1);
    setRounds([]);
    setPickerColor(initialPickerHsb(colors[0]));
    setPhase("memorize");
  }, []);

  const onMemorizeComplete = useCallback(() => {
    setPhase("pick");
  }, []);

  const submitGuess = useCallback(() => {
    const score = calculateScore(currentTarget, pickerColor);
    setRounds((prev) => [
      ...prev,
      { target: currentTarget, guess: [...pickerColor], score },
    ]);
    setPhase("result");
  }, [currentTarget, pickerColor]);

  const nextRound = useCallback(() => {
    if (round >= TOTAL_ROUNDS) {
      setPhase("final");
    } else {
      const nextRoundNum = round + 1;
      setRound(nextRoundNum);
      setPickerColor(initialPickerHsb(targetColors[nextRoundNum - 1]));
      setPhase("memorize");
    }
  }, [round, targetColors]);

  const resetGame = useCallback(() => {
    setPhase("home");
    setRound(1);
    setTargetColors([]);
    setRounds([]);
    setPickerColor([180, 50, 50]);
  }, []);

  return {
    phase,
    difficulty,
    round,
    currentTarget,
    pickerColor,
    setPickerColor,
    rounds,
    startGame,
    startGameWithColors,
    onMemorizeComplete,
    submitGuess,
    nextRound,
    resetGame,
    TOTAL_ROUNDS,
  };
}
