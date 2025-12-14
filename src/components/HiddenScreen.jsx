export function HiddenScreen({ category, playerName, confirmed, onPeek, onConfirm, playersConfirmed, totalPlayers }) {
  return (
    <div className="screen hidden-screen">
      {playerName && <h2 className="player-name-header">{playerName}</h2>}
      <div className="category-reminder">{category}</div>

      <div className="hidden-display" onClick={onPeek}>
        <div className="pattern"></div>
        <p className="peek-hint">Tap to peek</p>
      </div>

      {confirmed ? (
        <div className="confirmed-status">
          <p>Position locked!</p>
          <p className="waiting">Waiting for others... ({playersConfirmed}/{totalPlayers})</p>
        </div>
      ) : (
        <button className="btn btn-primary" onClick={onConfirm}>
          Lock In Position
        </button>
      )}
    </div>
  )
}
