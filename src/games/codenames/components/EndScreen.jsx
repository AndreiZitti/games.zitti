import { GameBoard } from './GameBoard'

export function EndScreen({
  room,
  isHost,
  myTeam,
  redTeam,
  blueTeam,
  onPlayAgain,
  onLeave,
  getCardType
}) {
  const didWin = room.winner === myTeam
  const winnerName = room.winner === 'red' ? 'Red Team' : 'Blue Team'

  const winReasonText = room.win_reason === 'assassin'
    ? 'The other team found the Assassin!'
    : 'All their agents have been found!'

  return (
    <div className="screen codenames-end">
      <div className={`winner-banner ${room.winner}`}>
        <h1>{winnerName} Wins!</h1>
        <p className="win-reason">{winReasonText}</p>
        {didWin ? (
          <p className="result-emoji">🎉</p>
        ) : (
          <p className="result-emoji">😔</p>
        )}
      </div>

      <div className="final-scores">
        <div className={`final-score red ${room.winner === 'red' ? 'winner' : ''}`}>
          <span className="team-name">Red</span>
          <span className="cards-left">{room.red_remaining} left</span>
        </div>
        <div className={`final-score blue ${room.winner === 'blue' ? 'winner' : ''}`}>
          <span className="team-name">Blue</span>
          <span className="cards-left">{room.blue_remaining} left</span>
        </div>
      </div>

      <h3>Final Board</h3>
      <GameBoard
        board={room.board}
        revealedCards={[...Array(25).keys()]} // Show all cards revealed
        keyCard={room.key_card}
        showKey={true}
        selectedCard={null}
        onSelectCard={() => {}}
        isInteractive={false}
        getCardType={getCardType}
      />

      <div className="button-group">
        {isHost ? (
          <button className="btn btn-primary" onClick={onPlayAgain}>
            Play Again
          </button>
        ) : (
          <p className="waiting">Waiting for host...</p>
        )}
        <button className="btn btn-secondary" onClick={onLeave}>
          Leave Room
        </button>
      </div>
    </div>
  )
}
