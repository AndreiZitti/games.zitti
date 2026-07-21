import { useState, useCallback } from "react";
import { generateGameColors, initialPickerHsb } from "../utils/colorGen";
import { calculateScoreDetails } from "../utils/color";

export default function useChromaGame() {
  const [phase, setPhase] = useState("home");
  const [round, setRound] = useState(1);
  const [targetColors, setTargetColors] = useState([]);
  const [pickerColor, setPickerColor] = useState([180, 50, 50]);
  const [rounds, setRounds] = useState([]);
  const [totalRounds, setTotalRounds] = useState(3);

  const TOTAL_ROUNDS = totalRounds;

  const currentTarget = targetColors[round - 1] || [0, 50, 50];

  const startGame = useCallback(() => {
    const colors = generateGameColors();
    setTargetColors(colors);
    setTotalRounds(colors.length);
    setRound(1);
    setRounds([]);
    setPickerColor(initialPickerHsb(colors[0]));
    setPhase("memorize");
  }, []);

  const startGameWithColors = useCallback((colors) => {
    setTargetColors(colors);
    setTotalRounds(colors.length);
    setRound(1);
    setRounds([]);
    setPickerColor(initialPickerHsb(colors[0]));
    setPhase("memorize");
  }, []);

  const onMemorizeComplete = useCallback(() => {
    setPhase("pick");
  }, []);

  const submitGuess = useCallback(() => {
    const { score, distance } = calculateScoreDetails(currentTarget, pickerColor);
    setRounds((prev) => [
      ...prev,
      { target: currentTarget, guess: [...pickerColor], score, distance },
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
    setTotalRounds(3);
    setTargetColors([]);
    setRounds([]);
    setPickerColor([180, 50, 50]);
  }, []);

  return {
    phase,
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
