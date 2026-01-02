export function Lobby({ room, isHost, onStartGame, onLeave }) {
  const canStart = room.players.length >= 2 && room.players.length <= 4

  return (
    <div className="quirtle-game quirtle-lobby">
      <button className="btn-back" onClick={onLeave}>
        &larr; Leave
      </button>

      <h1>Quirtle Lobby</h1>
      <div className="room-code">{room.code}</div>

      <div className="players-list">
        <h2>Players ({room.players.length}/4)</h2>
        {room.players.map((player, index) => (
          <div key={player.id} className="player-item">
            <div className="player-avatar">
              {player.name.charAt(0).toUpperCase()}
            </div>
            <span className="player-name">{player.name}</span>
            {index === 0 && <span className="host-badge">Host</span>}
          </div>
        ))}
        {room.players.length < 2 && (
          <p className="waiting-text">Waiting for more players...</p>
        )}
      </div>

      {isHost ? (
        <button
          className="btn btn-primary"
          onClick={onStartGame}
          disabled={!canStart}
        >
          {room.players.length < 2
            ? 'Need at least 2 players'
            : 'Start Game'}
        </button>
      ) : (
        <p className="waiting-text">Waiting for host to start...</p>
      )}
    </div>
  )
}
