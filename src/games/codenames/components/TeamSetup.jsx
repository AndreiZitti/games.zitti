export function TeamSetup({
  room,
  playerId,
  isHost,
  myTeam,
  redTeam,
  blueTeam,
  onBecomeSpymaster,
  onRemoveSpymaster,
  onStartGame,
  onLeave,
  error
}) {
  const redSpymaster = redTeam.find(p => p.id === room.red_spymaster)
  const blueSpymaster = blueTeam.find(p => p.id === room.blue_spymaster)

  const isRedSpymaster = room.red_spymaster === playerId
  const isBlueSpymaster = room.blue_spymaster === playerId

  const canBeSpymaster = myTeam && (
    (myTeam === 'red' && !room.red_spymaster) ||
    (myTeam === 'blue' && !room.blue_spymaster)
  )

  const canStart = room.red_spymaster && room.blue_spymaster

  return (
    <div className="screen codenames-team-setup">
      <div className="room-header">
        <div className="room-code">
          <span className="label">Room Code</span>
          <span className="code">{room.code}</span>
        </div>
      </div>

      <h2>Pick Your Spymasters</h2>
      <p className="subtitle">Each team needs one Spymaster who will give clues</p>

      <div className="teams-container">
        {/* Red Team */}
        <div className="team-column team-red">
          <h3>Red Team</h3>

          <div className="spymaster-section">
            <span className="role-label">Spymaster</span>
            {redSpymaster ? (
              <div className="spymaster-chip">
                {redSpymaster.name}
                {(isHost || isRedSpymaster) && (
                  <button
                    className="remove-btn"
                    onClick={() => onRemoveSpymaster('red')}
                  >
                    ×
                  </button>
                )}
              </div>
            ) : (
              <div className="spymaster-empty">?</div>
            )}
          </div>

          <div className="operatives-section">
            <span className="role-label">Operatives</span>
            <div className="operative-list">
              {redTeam.filter(p => p.id !== room.red_spymaster).map(player => (
                <div key={player.id} className="operative-chip">
                  {player.name}
                </div>
              ))}
            </div>
          </div>

          {myTeam === 'red' && canBeSpymaster && (
            <button className="btn btn-volunteer" onClick={onBecomeSpymaster}>
              Volunteer as Spymaster
            </button>
          )}
        </div>

        {/* Blue Team */}
        <div className="team-column team-blue">
          <h3>Blue Team</h3>

          <div className="spymaster-section">
            <span className="role-label">Spymaster</span>
            {blueSpymaster ? (
              <div className="spymaster-chip">
                {blueSpymaster.name}
                {(isHost || isBlueSpymaster) && (
                  <button
                    className="remove-btn"
                    onClick={() => onRemoveSpymaster('blue')}
                  >
                    ×
                  </button>
                )}
              </div>
            ) : (
              <div className="spymaster-empty">?</div>
            )}
          </div>

          <div className="operatives-section">
            <span className="role-label">Operatives</span>
            <div className="operative-list">
              {blueTeam.filter(p => p.id !== room.blue_spymaster).map(player => (
                <div key={player.id} className="operative-chip">
                  {player.name}
                </div>
              ))}
            </div>
          </div>

          {myTeam === 'blue' && canBeSpymaster && (
            <button className="btn btn-volunteer" onClick={onBecomeSpymaster}>
              Volunteer as Spymaster
            </button>
          )}
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {!canStart && (
        <p className="hint">Both teams need a Spymaster to start</p>
      )}

      <div className="button-group">
        {isHost ? (
          <button
            className="btn btn-primary"
            onClick={onStartGame}
            disabled={!canStart}
          >
            Start Game
          </button>
        ) : (
          <p className="waiting">Waiting for host to start...</p>
        )}
        <button className="btn btn-secondary" onClick={onLeave}>
          Leave Room
        </button>
      </div>
    </div>
  )
}
