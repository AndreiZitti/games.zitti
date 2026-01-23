import { useUser } from '@/contexts/UserContext'

export function RevealScreen({
  room,
  currentQuestion,
  onContinue
}) {
  const { id: myId } = useUser()
  const submissions = room.current_question?.submissions || []
  const pointsAwarded = room.current_question?.points_awarded || []

  // Sort submissions by time (fastest first)
  const sortedSubmissions = [...submissions].sort(
    (a, b) => new Date(a.submitted_at) - new Date(b.submitted_at)
  )

  // Find first correct answer for speed bonus display
  const firstCorrect = sortedSubmissions.find(s => s.correct)

  // Get player name by ID
  const getPlayerName = (playerId) => {
    return room.players.find(p => p.id === playerId)?.name || 'Unknown'
  }

  // Get points for player
  const getPoints = (playerId) => {
    const awarded = pointsAwarded.find(p => p.player_id === playerId)
    return awarded?.points || 0
  }

  // Get medal for correct answers (top 3 correct get medals)
  const getMedal = (submission, index) => {
    if (!submission.correct) return null
    // Count how many correct answers came before this one
    const correctIndex = sortedSubmissions
      .filter(s => s.correct)
      .findIndex(s => s.player_id === submission.player_id)

    if (correctIndex === 0) return '🥇'
    if (correctIndex === 1) return '🥈'
    if (correctIndex === 2) return '🥉'
    return null
  }

  // Is current user the host?
  const isHost = room.players[0]?.id === myId

  return (
    <div className="screen quiz-reveal quiz-game">
      {/* Header with Time's Up */}
      <div className="reveal-header">
        <h1 className="reveal-header__title">Time's Up!</h1>
        <div className="reveal-header__meta">
          <span className="reveal-header__category">{currentQuestion.category}</span>
          <span className="reveal-header__value">{currentQuestion.value} pts</span>
        </div>
      </div>

      {/* Question (dimmed) */}
      <div className="reveal-question">
        <p className="reveal-question__text">{currentQuestion.question}</p>
      </div>

      {/* Correct Answer with glow animation */}
      <div className="correct-answer">
        <span className="correct-answer__label">Correct Answer</span>
        <span className="correct-answer__text">{currentQuestion.answer}</span>
      </div>

      {/* Submissions List */}
      <div className="submissions-list">
        <h3 className="submissions-list__title">Results</h3>
        {sortedSubmissions.length === 0 ? (
          <p className="submissions-list__empty">No one answered in time!</p>
        ) : (
          <ul className="submissions-list__items">
            {sortedSubmissions.map((submission, index) => {
              const points = getPoints(submission.player_id)
              const medal = getMedal(submission, index)
              const isSpeedBonus = firstCorrect && submission.player_id === firstCorrect.player_id

              return (
                <li
                  key={submission.player_id}
                  className={`submission ${submission.correct ? 'submission--correct' : 'submission--incorrect'}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <span className="submission__rank">
                    {medal || `${index + 1}.`}
                  </span>
                  <span className="submission__name">{getPlayerName(submission.player_id)}</span>
                  <span className="submission__answer">"{submission.answer}"</span>
                  {isSpeedBonus && submission.correct && (
                    <span className="submission__speed-bonus" title="Fastest correct answer!">⚡</span>
                  )}
                  <span className={`submission__points ${submission.correct ? 'submission__points--correct' : 'submission__points--wrong'}`}>
                    {submission.correct ? `+${points}` : '+0'}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Actions */}
      <div className="reveal-actions">
        {isHost ? (
          <button className="btn btn-gold" onClick={onContinue}>
            Continue
          </button>
        ) : (
          <p className="reveal-actions__waiting">Waiting for host to continue...</p>
        )}
      </div>
    </div>
  )
}
