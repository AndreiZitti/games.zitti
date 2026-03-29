import { useState, useCallback, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import useChromaGame from "./hooks/useChromaGame";
import useChromaChallenge, {
  seededGameColors,
  generateChallengeCode,
} from "./hooks/useChromaRoom";
import IntroScreen from "./components/IntroScreen";
import ChallengeScreen from "./components/ChallengeScreen";
import MemorizeScreen from "./components/MemorizeScreen";
import PickerScreen from "./components/PickerScreen";
import RoundResultScreen from "./components/RoundResultScreen";
import FinalResultsScreen from "./components/FinalResultsScreen";
import LeaderboardScreen from "./components/LeaderboardScreen";
import "./chroma.css";

export function ChromaGame({ onBack }) {
  const searchParams = useSearchParams();
  const challengeFromUrl = searchParams.get("c");
  const { id: userId, name: userName, isAuthenticated } = useUser();

  const [challengeCode, setChallengeCode] = useState(challengeFromUrl || null);
  const [mode, setMode] = useState(challengeFromUrl ? "challenge" : null); // null | "solo" | "challenge"
  const [showChallengeSetup, setShowChallengeSetup] = useState(false);
  const [challengeDifficulty, setChallengeDifficulty] = useState("easy");

  const game = useChromaGame();
  const { leaderboard, saveScore, fetchLeaderboard } =
    useChromaChallenge(challengeCode);

  const startSolo = useCallback(
    (difficulty) => {
      setMode("solo");
      game.startGame(difficulty);
    },
    [game]
  );

  // Step 1: Create challenge code and show setup screen
  const createChallenge = useCallback(
    (difficulty) => {
      const code = generateChallengeCode();
      setChallengeCode(code);
      setChallengeDifficulty(difficulty);
      setShowChallengeSetup(true);

      // Update URL so they can copy it
      const url = new URL(window.location.href);
      url.searchParams.set("c", code);
      window.history.replaceState({}, "", url.toString());
    },
    []
  );

  // Step 2: Actually start the challenge game
  const startChallenge = useCallback(
    (difficulty) => {
      const code = challengeCode;
      setMode("challenge");
      setShowChallengeSetup(false);

      const colors = seededGameColors(code);
      game.startGameWithColors(difficulty || challengeDifficulty, colors);
    },
    [challengeCode, challengeDifficulty, game]
  );

  const handlePlayAgain = useCallback(() => {
    if (mode === "challenge") {
      // New challenge
      const code = generateChallengeCode();
      setChallengeCode(code);
      const url = new URL(window.location.href);
      url.searchParams.set("c", code);
      window.history.replaceState({}, "", url.toString());
    }
    game.resetGame();
  }, [mode, game]);

  const handleBack = useCallback(() => {
    game.resetGame();
    setMode(null);
    setShowChallengeSetup(false);
    setChallengeCode(challengeFromUrl || null);
    // Clean URL if we created a challenge
    if (!challengeFromUrl) {
      const url = new URL(window.location.href);
      url.searchParams.delete("c");
      window.history.replaceState({}, "", url.toString());
    }
    onBack();
  }, [game, challengeFromUrl, onBack]);

  // Save score when game ends in challenge mode
  const handleFinalScreen = useMemo(() => {
    if (
      game.phase === "final" &&
      mode === "challenge" &&
      challengeCode &&
      isAuthenticated &&
      game.rounds.length === game.TOTAL_ROUNDS
    ) {
      const scores = game.rounds.map((r) => r.score);
      const total = scores.reduce((a, b) => a + b, 0);
      saveScore(userId, userName, scores, total, game.difficulty);
    }
  }, [
    game.phase,
    game.rounds,
    mode,
    challengeCode,
    isAuthenticated,
    userId,
    userName,
    saveScore,
    game.difficulty,
    game.TOTAL_ROUNDS,
  ]);

  const shareChallenge = useCallback(() => {
    const url = `${window.location.origin}/games/chroma?c=${challengeCode}`;
    navigator.clipboard.writeText(url).catch(() => {});
  }, [challengeCode]);

  const { phase, difficulty, round, currentTarget, pickerColor, setPickerColor, rounds, onMemorizeComplete, submitGuess, nextRound, TOTAL_ROUNDS } = game;

  return (
    <div className="chroma-game">
      <div className="chroma-card">
        <AnimatePresence mode="wait">
          {phase === "home" && !showChallengeSetup && (
            <IntroScreen
              key="intro"
              onStart={challengeFromUrl ? () => startChallenge() : startSolo}
              onChallenge={createChallenge}
              onBack={handleBack}
              challengeCode={challengeFromUrl}
            />
          )}

          {phase === "home" && showChallengeSetup && (
            <ChallengeScreen
              key="challenge-setup"
              challengeCode={challengeCode}
              onStart={() => startChallenge()}
              onBack={() => {
                setShowChallengeSetup(false);
                setChallengeCode(null);
                const url = new URL(window.location.href);
                url.searchParams.delete("c");
                window.history.replaceState({}, "", url.toString());
              }}
            />
          )}

          {phase === "memorize" && (
            <MemorizeScreen
              key={`memorize-${round}`}
              targetColor={currentTarget}
              difficulty={difficulty}
              round={round}
              onComplete={onMemorizeComplete}
            />
          )}

          {phase === "pick" && (
            <PickerScreen
              key={`pick-${round}`}
              pickerColor={pickerColor}
              onPickerChange={setPickerColor}
              round={round}
              onSubmit={submitGuess}
            />
          )}

          {phase === "result" && (
            <RoundResultScreen
              key={`result-${round}`}
              target={rounds[rounds.length - 1]?.target}
              guess={rounds[rounds.length - 1]?.guess}
              score={rounds[rounds.length - 1]?.score || 0}
              round={round}
              isLastRound={round >= TOTAL_ROUNDS}
              onNext={nextRound}
            />
          )}

          {phase === "final" && mode === "challenge" && (
            <LeaderboardScreen
              key="leaderboard"
              rounds={rounds}
              totalScore={rounds.reduce((s, r) => s + r.score, 0)}
              leaderboard={leaderboard}
              challengeCode={challengeCode}
              isChallenge={true}
              onPlayAgain={handlePlayAgain}
              onBack={handleBack}
              onShare={shareChallenge}
            />
          )}

          {phase === "final" && mode !== "challenge" && (
            <FinalResultsScreen
              key="final"
              rounds={rounds}
              onPlayAgain={() => {
                game.resetGame();
              }}
              onBack={handleBack}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
