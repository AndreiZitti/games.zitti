import { motion } from 'framer-motion'

export function WaitingScreen({
  psychicName,
  roundNumber,
  totalRounds,
  teamScore,
  gameScore,
  spectrum
}) {
  return (
    <motion.div
      className="screen waiting-screen-mp"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Score display */}
      <div className="score-display">
        <div className="score-item you">
          <span className="score-label">Team</span>
          <span className="score-value">{teamScore}</span>
        </div>
        <div className="score-divider">vs</div>
        <div className="score-item game">
          <span className="score-label">Game</span>
          <span className="score-value">{gameScore}</span>
        </div>
      </div>

      {/* Round indicator */}
      <div className="round-indicator">
        Round {roundNumber} of {totalRounds}
      </div>

      {/* Waiting content */}
      <motion.div
        className="waiting-content"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="waiting-icon">
          <motion.span
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            &#129504;
          </motion.span>
        </div>

        <h2 className="waiting-title">
          {psychicName} is the Psychic
        </h2>

        <p className="waiting-subtitle">
          They&apos;re thinking of a clue...
        </p>

        {/* Show spectrum preview */}
        {spectrum && (
          <div className="spectrum-preview">
            <div className="spectrum-endpoints">
              <span className="endpoint left">{spectrum.left}</span>
              <span className="endpoint-arrow">&harr;</span>
              <span className="endpoint right">{spectrum.right}</span>
            </div>
          </div>
        )}

        <motion.div
          className="waiting-dots"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
          >
            .
          </motion.span>
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          >
            .
          </motion.span>
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
          >
            .
          </motion.span>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
