"use client";

import { useRouter } from "next/navigation";
import { useScoreTracker } from "../hooks/useScoreTracker";
import { PlayerSetup } from "./PlayerSetup";
import { ScoreTable } from "./ScoreTable";
import "../score-tracker.css";

export function GamePage({ gameType }) {
  const router = useRouter();
  const {
    players,
    teams,
    rounds,
    whistData,
    phase,
    isLoaded,
    config,
    totals,
    leaderIndex,
    isTeamGame,
    whistTotals,
    whistActiveRoundIndex,
    whistIsComplete,
    startGame,
    startTeamGame,
    addRound,
    updateRound,
    deleteRound,
    updateWhistBids,
    updateWhistTricks,
    revertWhistToBidding,
    newGame,
    GAME_CONFIG,
  } = useScoreTracker(gameType);

  const gameConfig = GAME_CONFIG[gameType];

  if (!isLoaded) {
    return (
      <div className="screen score-tracker">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  // Reset clears storage and goes back to setup for this game
  const handleReset = () => {
    newGame();
  };

  // Show setup if no players/teams yet
  const needsSetup = phase === "setup" || (phase === "select") ||
    (gameConfig?.isTeamGame ? teams.length === 0 : players.length === 0);

  return (
    <div className={`screen score-tracker ${!needsSetup ? 'score-tracker-playing' : ''}`}>
      {needsSetup ? (
        <>
          <button className="btn-back" onClick={() => router.push("/score-tracker")}>
            &larr; Score Tracker
          </button>
          <PlayerSetup
            config={gameConfig}
            onStart={(playerNames) => startGame(playerNames, gameType)}
            onStartTeamGame={startTeamGame}
          />
        </>
      ) : (
        <ScoreTable
          gameType={gameType}
          players={players}
          teams={teams}
          rounds={rounds}
          totals={totals}
          leaderIndex={leaderIndex}
          config={gameConfig}
          isTeamGame={isTeamGame}
          whistData={whistData}
          whistTotals={whistTotals}
          whistActiveRoundIndex={whistActiveRoundIndex}
          whistIsComplete={whistIsComplete}
          onAddRound={addRound}
          onUpdateRound={updateRound}
          onDeleteRound={deleteRound}
          onUpdateWhistBids={updateWhistBids}
          onUpdateWhistTricks={updateWhistTricks}
          onRevertWhistToBidding={revertWhistToBidding}
          onReset={handleReset}
          onBackToMenu={() => router.push("/score-tracker")}
        />
      )}
    </div>
  );
}
