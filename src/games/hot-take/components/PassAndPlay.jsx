import { useState } from 'react'

export function PassAndPlay({ players, category, onAllSeen }) {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [showNumber, setShowNumber] = useState(false)
  const [seenPlayers, setSeenPlayers] = useState(new Set())

  const currentPlayer = players[currentPlayerIndex]
  const isLastPlayer = currentPlayerIndex === players.length - 1
  const allHaveSeen = seenPlayers.size === players.length

  const handleReveal = () => {
    setShowNumber(true)
  }

  const handleConfirm = () => {
    // Mark this player as having seen their number
    setSeenPlayers(prev => new Set([...prev, currentPlayerIndex]))
    setShowNumber(false)

    if (isLastPlayer) {
      // All players have seen their numbers
      onAllSeen()
    } else {
      // Move to next player
      setCurrentPlayerIndex(prev => prev + 1)
    }
  }

  // Screen showing the number
  if (showNumber) {
    return (
      <div className="screen pass-play-reveal" onClick={handleConfirm}>
        <div className="category-reminder">{category}</div>

        <div className="reveal-player-name">{currentPlayer.name}</div>

        <div className="number-display">
          <span className="number">{currentPlayer.number}</span>
        </div>

        <p className="hint">Tap anywhere when done</p>
      </div>
    )
  }

  // Screen prompting to pass device
  return (
    <div className="screen pass-play-waiting">
      <div className="category-reminder">{category}</div>

      <div className="pass-content">
        <div className="pass-icon">
          <span>&#128241;</span>
        </div>

        <h2>Pass to</h2>
        <div className="pass-player-name">{currentPlayer.name}</div>

        <p className="pass-instruction">
          {currentPlayerIndex === 0
            ? "Tap the button below when you're ready to see your number"
            : "Make sure no one else is looking!"}
        </p>

        <div className="pass-progress">
          {players.map((_, index) => (
            <span
              key={index}
              className={`progress-dot ${
                seenPlayers.has(index) ? 'seen' :
                index === currentPlayerIndex ? 'current' : ''
              }`}
            />
          ))}
        </div>
      </div>

      <div className="button-group">
        <button className="btn btn-primary" onClick={handleReveal}>
          Reveal My Number
        </button>
      </div>
    </div>
  )
}
