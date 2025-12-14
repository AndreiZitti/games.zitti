export function RevealScreen({ room, isHost, onNextRound, onLeave }) {
  // Sort players by number to see correct order
  const sortedPlayers = [...room.players].sort((a, b) => a.number - b.number)

  return (
    <div className="screen reveal-screen">
      <h1>Results!</h1>
      <div className="category-display">{room.category}</div>

      <div className="results-list">
        <h3>Correct Order (Low to High)</h3>
        <ol>
          {sortedPlayers.map((player, index) => (
            <li key={player.id} className="result-item">
              <span className="position">{index + 1}.</span>
              <span className="name">{player.name}</span>
              <span className="number">{player.number}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="button-group">
        {isHost ? (
          <button className="btn btn-primary" onClick={onNextRound}>
            Next Round
          </button>
        ) : (
          <p className="waiting">Waiting for host to start next round...</p>
        )}
        <button className="btn btn-secondary" onClick={onLeave}>
          Leave Game
        </button>
      </div>
    </div>
  )
}
