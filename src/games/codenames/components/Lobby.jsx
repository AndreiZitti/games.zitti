export function Lobby({
  room,
  playerId,
  isHost,
  myTeam,
  redTeam,
  blueTeam,
  unassigned,
  onJoinTeam,
  onLeaveTeam,
  onSetLanguage,
  onStartTeamSetup,
  onLeave,
  error
}) {
  const canStart = redTeam.length >= 2 && blueTeam.length >= 2

  return (
    <div className="screen codenames-lobby">
      <div className="room-header">
        <div className="room-code">
          <span className="label">Room Code</span>
          <span className="code">{room.code}</span>
        </div>

        {isHost && (
          <div className="language-toggle">
            <button
              className={`lang-btn ${room.language === 'en' ? 'active' : ''}`}
              onClick={() => onSetLanguage('en')}
            >
              EN
            </button>
            <button
              className={`lang-btn ${room.language === 'ro' ? 'active' : ''}`}
              onClick={() => onSetLanguage('ro')}
            >
              RO
            </button>
          </div>
        )}
        {!isHost && (
          <div className="language-display">
            Language: {room.language === 'ro' ? 'Romanian' : 'English'}
          </div>
        )}
      </div>

      <h2>Choose Your Team</h2>

      <div className="teams-container">
        {/* Red Team */}
        <div className="team-column team-red">
          <h3>Red Team</h3>
          <div className="team-players">
            {redTeam.map(player => (
              <div key={player.id} className="player-chip">
                {player.name}
                {player.id === playerId && (
                  <button className="leave-team-btn" onClick={onLeaveTeam}>×</button>
                )}
              </div>
            ))}
            {myTeam !== 'red' && (
              <button className="join-team-btn" onClick={() => onJoinTeam('red')}>
                + Join Red
              </button>
            )}
          </div>
          <div className="team-count">{redTeam.length} players</div>
        </div>

        {/* Blue Team */}
        <div className="team-column team-blue">
          <h3>Blue Team</h3>
          <div className="team-players">
            {blueTeam.map(player => (
              <div key={player.id} className="player-chip">
                {player.name}
                {player.id === playerId && (
                  <button className="leave-team-btn" onClick={onLeaveTeam}>×</button>
                )}
              </div>
            ))}
            {myTeam !== 'blue' && (
              <button className="join-team-btn" onClick={() => onJoinTeam('blue')}>
                + Join Blue
              </button>
            )}
          </div>
          <div className="team-count">{blueTeam.length} players</div>
        </div>
      </div>

      {/* Unassigned players */}
      {unassigned.length > 0 && (
        <div className="unassigned-section">
          <span className="label">Not on a team:</span>
          <div className="unassigned-players">
            {unassigned.map(player => (
              <span key={player.id} className="player-name">
                {player.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {!canStart && (
        <p className="hint">Each team needs at least 2 players to start</p>
      )}

      <div className="button-group">
        {isHost ? (
          <button
            className="btn btn-primary"
            onClick={onStartTeamSetup}
            disabled={!canStart}
          >
            Continue
          </button>
        ) : (
          <p className="waiting">Waiting for host to continue...</p>
        )}
        <button className="btn btn-secondary" onClick={onLeave}>
          Leave Room
        </button>
      </div>
    </div>
  )
}
