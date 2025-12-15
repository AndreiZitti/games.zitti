import { useState } from 'react'
import { motion } from 'framer-motion'
import { Spectrum } from '../Spectrum'

export function GuesserView({
  spectrum,
  clue,
  psychicName,
  roundNumber,
  totalRounds,
  teamScore,
  gameScore,
  isPsychic,
  onLockIn
}) {
  const [guessPosition, setGuessPosition] = useState(50)
  const [isLocking, setIsLocking] = useState(false)

  const handleLockIn = () => {
    setIsLocking(true)
    onLockIn(guessPosition)
  }

  return (
    <motion.div
      className="screen guesser-view-mp"
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

      {/* Clue display */}
      <motion.div
        className="clue-display mp-clue"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
      >
        <span className="clue-label">{psychicName}&apos;s clue:</span>
        <span className="clue-text">&ldquo;{clue}&rdquo;</span>
      </motion.div>

      {/* Spectrum with guess slider */}
      <motion.div
        className="spectrum-section"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Spectrum
          spectrum={spectrum}
          showGuess={!isPsychic}
          guessPosition={guessPosition}
          onGuessChange={!isPsychic ? setGuessPosition : undefined}
          interactive={!isPsychic}
        />
      </motion.div>

      {/* Instructions */}
      <motion.div
        className="guess-instructions"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {isPsychic ? (
          <>
            <p>Your team is guessing...</p>
            <p className="guess-tip">You submitted the clue, now watch and hope!</p>
          </>
        ) : (
          <>
            <p>Where does the clue point on the spectrum?</p>
            <p className="guess-tip">Drag the slider and lock in your team&apos;s guess!</p>
          </>
        )}
      </motion.div>

      {/* Lock in button (non-psychic only) */}
      {!isPsychic && (
        <motion.div
          className="button-group"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            className="btn btn-primary btn-lock"
            onClick={handleLockIn}
            disabled={isLocking}
          >
            {isLocking ? 'Locking in...' : 'Lock In Guess'}
          </button>
        </motion.div>
      )}

      {/* Psychic waiting message */}
      {isPsychic && (
        <motion.div
          className="psychic-waiting"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="waiting-animation">
            <span>&#128064;</span>
          </div>
          <p>Waiting for team to lock in their guess...</p>
        </motion.div>
      )}
    </motion.div>
  )
}
