import { useState } from 'react'

export function SingleDeviceBoard({ players, category, onReveal, onNextRound, onLeave, isRevealed }) {
  const [boardPlayers, setBoardPlayers] = useState(
    players.map(p => ({ ...p, slot: null }))
  )
  const [draggingCard, setDraggingCard] = useState(null)

  const numSlots = players.length

  // Get player in a specific slot
  const getPlayerInSlot = (slotIndex) => {
    return boardPlayers.find(p => p.slot === slotIndex)
  }

  // Handle drag start
  const handleDragStart = (e, player) => {
    setDraggingCard(player.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  // Handle drop on slot
  const handleDrop = (e, slotIndex) => {
    e.preventDefault()
    if (draggingCard) {
      moveCardToSlot(draggingCard, slotIndex)
    }
    setDraggingCard(null)
  }

  // Move a card to a slot (handles swapping)
  const moveCardToSlot = (playerId, newSlot) => {
    setBoardPlayers(prev => {
      const playerToMove = prev.find(p => p.id === playerId)
      const playerInSlot = prev.find(p => p.slot === newSlot)

      return prev.map(p => {
        if (p.id === playerId) {
          return { ...p, slot: newSlot }
        }
        if (playerInSlot && p.id === playerInSlot.id) {
          return { ...p, slot: playerToMove?.slot ?? null }
        }
        return p
      })
    })
  }

  // Handle click on slot (mobile-friendly)
  const handleSlotClick = (slotIndex) => {
    // Find first unplaced player and put them in this slot
    const unplacedPlayer = boardPlayers.find(p => p.slot === null)
    if (unplacedPlayer) {
      moveCardToSlot(unplacedPlayer.id, slotIndex)
    }
  }

  // Handle card click in unplaced area - select for placement
  const handleUnplacedCardClick = (player) => {
    // Find first empty slot
    const emptySlotIndex = Array.from({ length: numSlots })
      .findIndex((_, i) => !getPlayerInSlot(i))

    if (emptySlotIndex !== -1) {
      moveCardToSlot(player.id, emptySlotIndex)
    }
  }

  // Handle card click on board - send back to unplaced
  const handlePlacedCardClick = (player) => {
    if (!isRevealed) {
      setBoardPlayers(prev =>
        prev.map(p => p.id === player.id ? { ...p, slot: null } : p)
      )
    }
  }

  const playersPlaced = boardPlayers.filter(p => p.slot !== null).length
  const allPlaced = playersPlaced === players.length

  // Sort players by slot for revealed view
  const sortedBySlot = [...boardPlayers]
    .filter(p => p.slot !== null)
    .sort((a, b) => a.slot - b.slot)

  return (
    <div className="game-board-screen">
      <div className="category-reminder">{category}</div>

      <div className="board-labels">
        <span>Low</span>
        <span>High</span>
      </div>

      <div className="game-board">
        <div className="board-track">
          {Array.from({ length: numSlots }).map((_, slotIndex) => {
            const playerInSlot = getPlayerInSlot(slotIndex)
            const isEmpty = !playerInSlot

            return (
              <div
                key={slotIndex}
                className={`board-slot ${isEmpty ? 'empty' : ''}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, slotIndex)}
                onClick={() => isEmpty && handleSlotClick(slotIndex)}
              >
                {playerInSlot && (
                  <div
                    className={`player-card single-device ${draggingCard === playerInSlot.id ? 'dragging' : ''}`}
                    draggable={!isRevealed}
                    onDragStart={(e) => handleDragStart(e, playerInSlot)}
                    onClick={() => handlePlacedCardClick(playerInSlot)}
                  >
                    <div className="card-inner">
                      {isRevealed ? (
                        <>
                          <span className="card-number revealed">{playerInSlot.number}</span>
                          <span className="card-name">{playerInSlot.name}</span>
                        </>
                      ) : (
                        <>
                          <span className="card-hidden">?</span>
                          <span className="card-name">{playerInSlot.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
                {isEmpty && (
                  <div className="slot-placeholder">
                    <span>{slotIndex + 1}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Unplaced players area */}
      {!isRevealed && (
        <div className="unplaced-area">
          {boardPlayers.filter(p => p.slot === null).map(player => (
            <div
              key={player.id}
              className="player-card unplaced single-device"
              draggable
              onDragStart={(e) => handleDragStart(e, player)}
              onClick={() => handleUnplacedCardClick(player)}
            >
              <div className="card-inner">
                <span className="card-hidden">?</span>
                <span className="card-name">{player.name}</span>
                <span className="card-hint">Tap to place</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status and actions */}
      {!isRevealed && (
        <div className="board-actions">
          <p className="board-hint" style={{ marginBottom: '12px' }}>
            {playersPlaced}/{players.length} players placed
          </p>
          {!allPlaced ? (
            <p className="board-hint">Arrange all cards based on everyone's descriptions</p>
          ) : (
            <button className="btn btn-primary" onClick={onReveal}>
              Reveal Numbers
            </button>
          )}
        </div>
      )}

      {/* Revealed phase */}
      {isRevealed && (
        <div className="board-actions revealed-actions">
          <h2>Results!</h2>
          <div className="button-group">
            <button className="btn btn-primary" onClick={onNextRound}>
              Play Again
            </button>
            <button className="btn btn-secondary" onClick={onLeave}>
              Back to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
