import './Podium.css'

export function Podium({ players }) {
  // Take top 3 players sorted by score
  const top3 = [...players]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  const getRankEmoji = (index) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return ''
  }

  if (top3.length === 0) return null

  return (
    <div className="quiz-podium" role="list" aria-label="Winner podium">
      {top3.map((player, index) => (
        <div
          key={player.id}
          className={`podium-place podium-place--${index + 1}`}
          role="listitem"
          aria-label={`${index === 0 ? 'First' : index === 1 ? 'Second' : 'Third'} place: ${player.name} with ${player.score} points`}
        >
          <span className="podium-rank" aria-hidden="true">{getRankEmoji(index)}</span>
          <div className="podium-avatar" aria-hidden="true">
            {player.name.charAt(0).toUpperCase()}
          </div>
          <div className="podium-info">
            <span className="podium-name" title={player.name}>{player.name}</span>
            <span className="podium-score">{player.score.toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
