export function EndScreen({ room, isHost, onPlayAgain, onLeave }) {
  // Sort players by score
  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score)
  const winner = sortedPlayers[0]

  return (
    <div className="quirtle-game quirtle-end-screen">
      <h1>Game Over!</h1>
      <p className="winner">{winner.name} wins!</p>

      <div className="quirtle-final-scores">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            className={`score-row ${index === 0 ? 'winner' : ''}`}
          >
            <span>{index + 1}. {player.name}</span>
            <span>{player.score} pts</span>
          </div>
        ))}
      </div>

      <div className="button-group">
        {isHost && (
          <button className="btn btn-primary" onClick={onPlayAgain}>
            Play Again
          </button>
        )}
        <button className="btn btn-secondary" onClick={onLeave}>
          Back to Games
        </button>
      </div>
    </div>
  )
}
