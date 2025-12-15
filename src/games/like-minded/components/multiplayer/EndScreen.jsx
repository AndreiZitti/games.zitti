import { motion } from 'framer-motion'

export function EndScreen({
  teamScore,
  gameScore,
  isHost,
  onPlayAgain,
  onLeave
}) {
  const teamWon = teamScore > gameScore
  const tied = teamScore === gameScore

  const getResultTitle = () => {
    if (tied) return "It's a Tie!"
    return teamWon ? 'Team Wins!' : 'Game Wins!'
  }

  const getResultEmoji = () => {
    if (tied) return '&#129309;'
    return teamWon ? '&#127881;' : '&#128546;'
  }

  return (
    <motion.div
      className="screen end-screen-mp"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Result header */}
      <motion.div
        className={`results-header ${teamWon ? 'win' : tied ? 'tie' : 'lose'}`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
      >
        <span
          className="results-emoji"
          dangerouslySetInnerHTML={{ __html: getResultEmoji() }}
        />
        <h1>{getResultTitle()}</h1>
      </motion.div>

      {/* Final score */}
      <motion.div
        className="final-score"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="final-score-item you">
          <span className="final-score-label">Your Team</span>
          <span className="final-score-value">{teamScore}</span>
        </div>
        <div className="final-score-vs">vs</div>
        <div className="final-score-item game">
          <span className="final-score-label">The Game</span>
          <span className="final-score-value">{gameScore}</span>
        </div>
      </motion.div>

      {/* Victory message */}
      <motion.div
        className="victory-message"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {teamWon ? (
          <p>Great teamwork! You and your friends are truly like-minded!</p>
        ) : tied ? (
          <p>So close! Try again to break the tie!</p>
        ) : (
          <p>The game got you this time. Try again!</p>
        )}
      </motion.div>

      {/* Action buttons */}
      <motion.div
        className="button-group"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {isHost ? (
          <>
            <button className="btn btn-primary" onClick={onPlayAgain}>
              Play Again
            </button>
            <button className="btn btn-secondary" onClick={onLeave}>
              Leave Room
            </button>
          </>
        ) : (
          <>
            <p className="waiting-message">
              Waiting for host to start a new game...
            </p>
            <button className="btn btn-secondary" onClick={onLeave}>
              Leave Room
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
