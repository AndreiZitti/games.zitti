import { motion } from 'framer-motion'

export function RoomLobby({
  roomCode,
  players,
  isHost,
  onStartGame,
  onLeave
}) {
  const canStart = players.length >= 2

  return (
    <motion.div
      className="screen room-lobby"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button className="btn-back" onClick={onLeave}>
        &larr; Leave Room
      </button>

      {/* Room Code Display */}
      <motion.div
        className="room-code-display"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <span className="label">Room Code</span>
        <span className="code wavelength-code">{roomCode}</span>
        <p className="share-hint">Share this code with friends!</p>
      </motion.div>

      {/* Players List */}
      <motion.div
        className="players-list wavelength-players"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h3>Players ({players.length})</h3>
        <ul>
          {players.map((player, index) => (
            <motion.li
              key={player.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <span className="player-avatar">
                {player.name.charAt(0).toUpperCase()}
              </span>
              <span className="player-name">{player.name}</span>
              {index === 0 && <span className="host-badge">Host</span>}
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Waiting message or Start button */}
      <motion.div
        className="lobby-actions"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {isHost ? (
          <>
            {!canStart && (
              <p className="waiting-message">
                Waiting for more players... (minimum 2)
              </p>
            )}
            <button
              className="btn btn-primary"
              onClick={onStartGame}
              disabled={!canStart}
            >
              Start Game
            </button>
          </>
        ) : (
          <p className="waiting-message">
            Waiting for host to start the game...
          </p>
        )}
      </motion.div>
    </motion.div>
  )
}
