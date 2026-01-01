// Mini-game grid layout (3x3)
const GRID_LAYOUT = [
  ["whistPlus", "whistMinus", "diamonds"],
  ["queens", "kingHearts", "tenClubs"],
  ["rentz", "totalsPlus", "totalsMinus"],
];

export function RentzGameGrid({
  players,
  currentDealerIndex,
  dealerGames,
  activeRoundIndex,
  rentzData,
  miniGameConfig,
  onSelectGame,
}) {
  const activeRound = rentzData[activeRoundIndex];
  const isSelectingPhase = activeRound?.phase === "selecting";

  const handleGameClick = (dealerIndex, gameId) => {
    const playedGames = dealerGames[dealerIndex] || {};
    // Only allow selection if current dealer, selecting phase, and game not played
    if (dealerIndex === currentDealerIndex && isSelectingPhase && !playedGames[gameId]) {
      onSelectGame(activeRoundIndex, gameId);
    }
  };

  return (
    <div className="rentz-compact-grid">
      {players.map((player, dealerIndex) => {
        const playedGames = dealerGames[dealerIndex] || {};
        const gamesPlayed = Object.keys(playedGames).length;
        const isCurrent = dealerIndex === currentDealerIndex;
        const isInteractive = isCurrent && isSelectingPhase;

        return (
          <div
            key={dealerIndex}
            className={`rentz-player-grid ${isCurrent ? "current" : ""} ${gamesPlayed === 9 ? "complete" : ""}`}
          >
            {/* Player header */}
            <div className="player-grid-header">
              <span className="player-grid-name" title={player}>
                {player}
              </span>
              <span className="player-grid-count">{gamesPlayed}/9</span>
            </div>

            {/* Mini 3x3 grid */}
            <div className={`player-mini-grid ${isInteractive ? "interactive" : ""}`}>
              {GRID_LAYOUT.flat().map((gameId) => {
                const game = miniGameConfig[gameId];
                const isPlayed = playedGames[gameId];
                const canSelect = isInteractive && !isPlayed;

                return (
                  <button
                    key={gameId}
                    className={`mini-cell ${isPlayed ? "played" : ""} ${canSelect ? "available" : ""} ${game.positive ? "pos" : "neg"}`}
                    onClick={() => canSelect && handleGameClick(dealerIndex, gameId)}
                    disabled={!canSelect}
                    title={game.name}
                  >
                    <span className="mini-icon">{game.icon}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
