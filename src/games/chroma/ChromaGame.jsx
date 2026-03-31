import { useState, useCallback, useEffect } from "react";
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
import TodayLeaderboardScreen from "./components/TodayLeaderboardScreen";
import "./chroma.css";

function getDailyCode() {
  const today = new Date().toISOString().split("T")[0];
  return `daily-${today}`;
}

export function ChromaGame({ onBack }) {
  const searchParams = useSearchParams();
  const challengeFromUrl = searchParams.get("c");
  const { id: userId, name: userName } = useUser();

  const [challengeCode, setChallengeCode] = useState(challengeFromUrl || null);
  const [mode, setMode] = useState(challengeFromUrl ? "challenge" : null); // null | "solo" | "quick" | "challenge" | "daily"
  const [showChallengeSetup, setShowChallengeSetup] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const game = useChromaGame();
  const { leaderboard, saveScore, fetchLeaderboard } =
    useChromaChallenge(challengeCode);

  const handleSaveScore = useCallback(
    async (displayName) => {
      if (!challengeCode || game.rounds.length !== game.TOTAL_ROUNDS) return;
      const scores = game.rounds.map((r) => r.score);
      const total = scores.reduce((a, b) => a + b, 0);
      await saveScore(userId, displayName, scores, total, "easy");
    },
    [challengeCode, game.rounds, game.TOTAL_ROUNDS, saveScore, userId]
  );

  const startSolo = useCallback(() => {
    setMode("solo");
    game.startGame();
  }, [game]);

  const startQuick = useCallback(() => {
    setMode("quick");
    const color = [
      Math.floor(Math.random() * 360),
      15 + Math.floor(Math.random() * 86),
      15 + Math.floor(Math.random() * 86),
    ];
    game.startGameWithColors([color]);
  }, [game]);

  const startDaily = useCallback(() => {
    const code = getDailyCode();
    setChallengeCode(code);
    setMode("daily");
    const colors = seededGameColors(code);
    game.startGameWithColors(colors);
  }, [game]);

  const createChallenge = useCallback(() => {
    const code = generateChallengeCode();
    setChallengeCode(code);
    setShowChallengeSetup(true);

    const url = new URL(window.location.href);
    url.searchParams.set("c", code);
    window.history.replaceState({}, "", url.toString());
  }, []);

  const startChallenge = useCallback(() => {
    setMode("challenge");
    setShowChallengeSetup(false);
    const colors = seededGameColors(challengeCode);
    game.startGameWithColors(colors);
  }, [challengeCode, game]);

  const handlePlayAgain = useCallback(() => {
    if (mode === "daily") {
      game.resetGame();
      setMode(null);
      setChallengeCode(null);
      return;
    }
    if (mode === "quick") {
      startQuick();
      return;
    }
    if (mode === "challenge") {
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
    if (!challengeFromUrl) {
      const url = new URL(window.location.href);
      url.searchParams.delete("c");
      window.history.replaceState({}, "", url.toString());
    }
    onBack();
  }, [game, challengeFromUrl, onBack]);

  const shareChallenge = useCallback(() => {
    const url = `${window.location.origin}/games/chroma?c=${challengeCode}`;
    navigator.clipboard.writeText(url).catch(() => {});
  }, [challengeCode]);

  const { phase, round, currentTarget, pickerColor, setPickerColor, rounds, onMemorizeComplete, submitGuess, nextRound, TOTAL_ROUNDS } = game;

  // Re-fetch leaderboard when reaching final screen so friends' scores are fresh
  useEffect(() => {
    if (phase === "final" && (mode === "challenge" || mode === "daily")) {
      fetchLeaderboard();
    }
  }, [phase, mode]); // eslint-disable-line react-hooks/exhaustive-deps


  return (
    <div className="chroma-game">
      <div className="chroma-card">
        <AnimatePresence mode="wait">
          {phase === "home" && !showChallengeSetup && !showLeaderboard && (
            <IntroScreen
              key="intro"
              onStart={challengeFromUrl ? startChallenge : startSolo}
              onQuick={startQuick}
              onDaily={startDaily}
              onChallenge={createChallenge}
              onLeaderboard={() => setShowLeaderboard(true)}
              onBack={handleBack}
              challengeCode={challengeFromUrl}
            />
          )}

          {phase === "home" && showLeaderboard && (
            <TodayLeaderboardScreen
              key="today-leaderboard"
              onBack={() => setShowLeaderboard(false)}
              onPlayDaily={startDaily}
            />
          )}

          {phase === "home" && showChallengeSetup && (
            <ChallengeScreen
              key="challenge-setup"
              challengeCode={challengeCode}
              onStart={startChallenge}
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
              round={round}
              totalRounds={TOTAL_ROUNDS}
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

          {phase === "final" && (mode === "challenge" || mode === "daily") && (
            <LeaderboardScreen
              key="leaderboard"
              rounds={rounds}
              totalScore={rounds.reduce((s, r) => s + r.score, 0)}
              leaderboard={leaderboard}
              challengeCode={challengeCode}
              isChallenge={true}
              isDaily={mode === "daily"}
              userName={userName}
              onSaveScore={handleSaveScore}
              onPlayAgain={handlePlayAgain}
              onBack={handleBack}
              onShare={mode === "daily" ? null : shareChallenge}
            />
          )}

          {phase === "final" && (mode === "solo" || mode === "quick") && (
            <FinalResultsScreen
              key="final"
              rounds={rounds}
              onPlayAgain={mode === "quick" ? startQuick : () => game.resetGame()}
              onBack={handleBack}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
