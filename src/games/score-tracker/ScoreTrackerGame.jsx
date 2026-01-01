"use client";

import { useRouter } from "next/navigation";
import { useScoreTracker } from "./hooks/useScoreTracker";
import { GameSelect } from "./components/GameSelect";
import { PlayerSetup } from "./components/PlayerSetup";
import { ScoreTable } from "./components/ScoreTable";
import "./score-tracker.css";

export function ScoreTrackerGame() {
  const router = useRouter();
  const {
    gameType,
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
    selectGame,
    startGame,
    startTeamGame,
    addRound,
    updateRound,
    deleteRound,
    updateWhistBids,
    updateWhistTricks,
    revertWhistToBidding,
    newGame,
    goBack,
    GAME_CONFIG,
  } = useScoreTracker();

  if (!isLoaded) {
    return (
      <div className="screen score-tracker">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`screen score-tracker ${phase === 'playing' ? 'score-tracker-playing' : ''}`}>
      {phase === "select" && (
        <>
          <button className="btn-back" onClick={() => router.push("/")}>
            &larr; Home
          </button>
          <h1 className="score-tracker-title">Score Tracker</h1>
          <p className="subtitle">Track scores for card games</p>
          <GameSelect onSelect={selectGame} GAME_CONFIG={GAME_CONFIG} />
        </>
      )}

      {phase === "setup" && config && (
        <PlayerSetup
          config={config}
          onStart={startGame}
          onStartTeamGame={startTeamGame}
          onBack={goBack}
        />
      )}

      {phase === "playing" && config && (
        <>
          <button className="btn-back" onClick={() => router.push("/")}>
            &larr; Home
          </button>
          <ScoreTable
            gameType={gameType}
            players={players}
            teams={teams}
            rounds={rounds}
            totals={totals}
            leaderIndex={leaderIndex}
            config={config}
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
            onNewGame={newGame}
          />
        </>
      )}
    </div>
  );
}
