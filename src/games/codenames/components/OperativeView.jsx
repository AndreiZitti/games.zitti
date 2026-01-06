import { useState } from 'react'
import { GameBoard } from './GameBoard'

export function OperativeView({
  room,
  playerId,
  isMyTurn,
  myTeam,
  redTeam,
  blueTeam,
  onRevealCard,
  onEndGuessing,
  onLeave,
  getCardType
}) {
  const [selectedCard, setSelectedCard] = useState(null)

  const redSpymaster = redTeam.find(p => p.id === room.red_spymaster)
  const blueSpymaster = blueTeam.find(p => p.id === room.blue_spymaster)

  const canGuess = isMyTurn && room.current_clue
  const isWaitingForClue = isMyTurn && !room.current_clue

  const handleSelectCard = (index) => {
    if (!canGuess) return
    setSelectedCard(selectedCard === index ? null : index)
  }

  const handleReveal = () => {
    if (selectedCard !== null) {
      onRevealCard(selectedCard)
      setSelectedCard(null)
    }
  }

  const selectedWord = selectedCard !== null ? room.board[selectedCard] : null

  return (
    <div className="screen codenames-operative">
      <div className="game-header">
        <div className="room-info">
          <span className="room-code">{room.code}</span>
          <span className={`role-badge operative ${myTeam}`}>
            {myTeam === 'red' ? 'Red' : 'Blue'} Operative
          </span>
        </div>

        <div className="scores">
          <div className={`score red ${room.current_team === 'red' ? 'active' : ''}`}>
            <span className="team-name">Red</span>
            <span className="remaining">{room.red_remaining}</span>
          </div>
          <span className="vs">vs</span>
          <div className={`score blue ${room.current_team === 'blue' ? 'active' : ''}`}>
            <span className="team-name">Blue</span>
            <span className="remaining">{room.blue_remaining}</span>
          </div>
        </div>
      </div>

      <div className="turn-indicator">
        {room.current_team === myTeam ? (
          <span className={`turn-badge ${myTeam}`}>Your Team&apos;s Turn</span>
        ) : (
          <span className="turn-badge waiting">
            {room.current_team === 'red' ? 'Red' : 'Blue'} Team&apos;s Turn
          </span>
        )}
      </div>

      {/* Show current clue */}
      {room.current_clue ? (
        <div className="current-clue">
          <span className="clue-label">Clue:</span>
          <span className="clue-word">&quot;{room.current_clue.word}&quot;</span>
          <span className="clue-number">
            {room.current_clue.number === 0 ? '∞' : room.current_clue.number}
          </span>
          {isMyTurn && (
            <span className="guesses-left">
              ({room.guesses_remaining} guesses left)
            </span>
          )}
        </div>
      ) : isWaitingForClue ? (
        <div className="waiting-clue">
          Waiting for your Spymaster to give a clue...
        </div>
      ) : (
        <div className="waiting-clue">
          {room.current_team === 'red' ? 'Red' : 'Blue'} Spymaster is thinking...
        </div>
      )}

      <GameBoard
        board={room.board}
        revealedCards={room.revealed_cards}
        keyCard={room.key_card}
        showKey={false}
        selectedCard={selectedCard}
        onSelectCard={handleSelectCard}
        isInteractive={canGuess}
        getCardType={getCardType}
      />

      {/* Action buttons for guessing */}
      {canGuess && (
        <div className="guess-actions">
          <button
            className="btn btn-primary btn-reveal"
            onClick={handleReveal}
            disabled={selectedCard === null}
          >
            {selectedCard !== null
              ? `Reveal "${selectedWord}"`
              : 'Select a card to reveal'
            }
          </button>
          <button
            className="btn btn-secondary"
            onClick={onEndGuessing}
          >
            End Turn
          </button>
        </div>
      )}

      {/* Not my turn message */}
      {!isMyTurn && (
        <div className="waiting-section">
          <p>
            {room.current_clue
              ? `${room.current_team === 'red' ? 'Red' : 'Blue'} team is guessing...`
              : `Waiting for ${room.current_team === 'red' ? 'Red' : 'Blue'} spymaster...`
            }
          </p>
        </div>
      )}

      <div className="team-panels">
        <div className="team-panel red">
          <h4>Red Team</h4>
          <div className="spymaster-name">
            Spymaster: {redSpymaster?.name}
          </div>
          <div className="operatives">
            {redTeam.filter(p => p.id !== room.red_spymaster).map(p => (
              <span key={p.id} className="operative-name">{p.name}</span>
            ))}
          </div>
        </div>

        <div className="team-panel blue">
          <h4>Blue Team</h4>
          <div className="spymaster-name">
            Spymaster: {blueSpymaster?.name}
          </div>
          <div className="operatives">
            {blueTeam.filter(p => p.id !== room.blue_spymaster).map(p => (
              <span key={p.id} className="operative-name">{p.name}</span>
            ))}
          </div>
        </div>
      </div>

      <button className="btn btn-secondary btn-leave" onClick={onLeave}>
        Leave Game
      </button>
    </div>
  )
}
