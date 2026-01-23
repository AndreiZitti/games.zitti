import { Confetti } from './Confetti'
import { Podium } from './Podium'

export function EndScreen({
  room,
  isHost,
  onPlayAgain,
  onLeave
}) {
  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score)
  const winner = sortedPlayers[0]

  return (
    <div className="screen quiz-end quiz-game">
      <Confetti active={true} pieceCount={60} duration={5000} />

      <div className="end-header">
        <h1>Game Over!</h1>
      </div>

      <div className="winner-announcement">
        <span className="winner-trophy" aria-label="Trophy">🏆</span>
        <span className="winner-name">{winner?.name}</span>
        <span className="winner-score">{winner?.score?.toLocaleString()} points</span>
      </div>

      <Podium players={sortedPlayers} />

      {sortedPlayers.length > 3 && (
        <div className="final-scores">
          <h3>Full Results</h3>
          <ul className="final-scores__list" role="list">
            {sortedPlayers.slice(3).map((player, index) => (
              <li key={player.id} className="final-score-item" role="listitem">
                <span className="final-score-item__rank">{index + 4}.</span>
                <div className="final-score-item__avatar" aria-hidden="true">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <span className="final-score-item__name">{player.name}</span>
                <span className="final-score-item__score">{player.score?.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="end-actions">
        {isHost ? (
          <>
            <button className="btn btn-primary" onClick={onPlayAgain}>
              Play Again
            </button>
            <button className="btn btn-secondary" onClick={onLeave}>
              Leave
            </button>
          </>
        ) : (
          <button className="btn btn-secondary" onClick={onLeave}>
            Leave Room
          </button>
        )}
      </div>
    </div>
  )
}
