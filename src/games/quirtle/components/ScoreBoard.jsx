export function ScoreBoard({ players, currentPlayerIndex }) {
  return (
    <div className="quirtle-scoreboard">
      {players.map((player, index) => (
        <div
          key={player.id}
          className={`quirtle-score-item ${index === currentPlayerIndex ? 'active' : ''}`}
        >
          <div className="name">{player.name}</div>
          <div className="score">{player.score}</div>
        </div>
      ))}
    </div>
  )
}
