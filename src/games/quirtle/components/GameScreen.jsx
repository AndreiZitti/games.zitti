import { useState } from 'react'
import { GameBoard } from './GameBoard'
import { PlayerHand } from './PlayerHand'
import { ScoreBoard } from './ScoreBoard'

export function GameScreen({
  room,
  playerId,
  currentPlayer,
  isMyTurn,
  onPlaceTiles,
  onSwapTiles,
  onLeave,
  hasValidMoves
}) {
  const [selectedTileIndices, setSelectedTileIndices] = useState([])
  const [pendingPlacements, setPendingPlacements] = useState([])
  const [swapMode, setSwapMode] = useState(false)
  const [error, setError] = useState(null)

  const currentTurnPlayer = room.players[room.current_player_index]
  const bagCount = room.bag.length

  // Track which hand indices have been used in pending placements
  const [usedHandIndices, setUsedHandIndices] = useState([])

  const handleSelectTile = (index) => {
    if (swapMode) {
      // In swap mode, toggle selection
      setSelectedTileIndices(prev =>
        prev.includes(index)
          ? prev.filter(i => i !== index)
          : [...prev, index]
      )
    } else {
      // In place mode, can't select tiles already placed
      if (usedHandIndices.includes(index)) return

      // Select single tile for placement
      setSelectedTileIndices(prev =>
        prev.includes(index) ? [] : [index]
      )
    }
  }

  const handlePlaceTile = (position) => {
    if (selectedTileIndices.length !== 1) return

    const tileIndex = selectedTileIndices[0]
    const tile = currentPlayer.hand[tileIndex]

    setPendingPlacements(prev => [...prev, { tile, x: position.x, y: position.y, handIndex: tileIndex }])
    setUsedHandIndices(prev => [...prev, tileIndex])
    setSelectedTileIndices([])
  }

  const handleConfirmPlacements = async () => {
    if (pendingPlacements.length === 0) return

    setError(null)
    const result = await onPlaceTiles(pendingPlacements.map(p => ({ tile: p.tile, x: p.x, y: p.y })))

    if (!result.success) {
      setError(result.error)
    } else {
      setPendingPlacements([])
      setUsedHandIndices([])
    }
  }

  const handleCancelPlacements = () => {
    setPendingPlacements([])
    setUsedHandIndices([])
    setSelectedTileIndices([])
  }

  const handleSwapConfirm = async () => {
    if (selectedTileIndices.length === 0) return

    setError(null)
    const tilesToSwap = selectedTileIndices.map(i => currentPlayer.hand[i])
    const result = await onSwapTiles(tilesToSwap)

    if (!result.success) {
      setError(result.error)
    } else {
      setSwapMode(false)
      setSelectedTileIndices([])
    }
  }

  const handleSwapCancel = () => {
    setSwapMode(false)
    setSelectedTileIndices([])
  }

  // Get currently selected tile for board highlighting
  const selectedTile = selectedTileIndices.length === 1 && !swapMode
    ? currentPlayer.hand[selectedTileIndices[0]]
    : null

  // Create virtual board with pending placements
  const virtualBoard = {
    tiles: [...room.board.tiles, ...pendingPlacements.map(p => ({ ...p.tile, x: p.x, y: p.y }))]
  }

  // Get hand with visual indication of used tiles
  const getHandWithUsed = () => {
    if (!currentPlayer) return []
    return currentPlayer.hand.map((tile, idx) => ({
      ...tile,
      used: usedHandIndices.includes(idx)
    }))
  }

  return (
    <div className="quirtle-game quirtle-game-screen">
      <div className="quirtle-game-header">
        <button className="btn-back" onClick={onLeave}>
          &larr; Leave
        </button>
        <ScoreBoard
          players={room.players}
          currentPlayerIndex={room.current_player_index}
        />
        <div className="quirtle-bag-count">
          Bag: {bagCount}
        </div>
      </div>

      <div className={`quirtle-turn-indicator ${isMyTurn ? '' : 'waiting'}`}>
        {isMyTurn ? 'Your turn!' : `${currentTurnPlayer?.name}'s turn`}
      </div>

      {error && <div className="error" style={{ margin: '0.5rem' }}>{error}</div>}

      {room.last_score && (
        <div className={`quirtle-score-popup ${room.last_score.lines?.some(l => l.isQwirkle) ? 'qwirkle' : ''}`}>
          {room.players.find(p => p.id === room.last_score.playerId)?.name} scored {room.last_score.points} points!
          {room.last_score.lines?.some(l => l.isQwirkle) && ' QWIRKLE!'}
          {room.last_score.quirtle && ' +12 QUIRTLE BONUS!'}
        </div>
      )}

      <GameBoard
        board={virtualBoard}
        selectedTile={selectedTile}
        onPlaceTile={handlePlaceTile}
      />

      <div className="quirtle-game-footer">
        {isMyTurn && currentPlayer && (
          <>
            {swapMode ? (
              <>
                <p className="quirtle-hint">
                  Select tiles to swap, then confirm
                </p>
                <PlayerHand
                  hand={currentPlayer.hand}
                  selectedTiles={selectedTileIndices}
                  onSelectTile={handleSelectTile}
                  disabled={false}
                />
                <div className="quirtle-actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleSwapConfirm}
                    disabled={selectedTileIndices.length === 0}
                  >
                    Swap {selectedTileIndices.length} tile(s)
                  </button>
                  <button className="btn btn-secondary" onClick={handleSwapCancel}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                {pendingPlacements.length === 0 && (
                  <p className="quirtle-hint">
                    Select a tile, then tap a valid position to place it
                  </p>
                )}
                {pendingPlacements.length > 0 && (
                  <p className="quirtle-hint">
                    Place more tiles in the same line, or confirm your turn
                  </p>
                )}
                <PlayerHand
                  hand={currentPlayer.hand}
                  selectedTiles={selectedTileIndices}
                  onSelectTile={handleSelectTile}
                  disabled={false}
                />
                <div className="quirtle-actions">
                  {pendingPlacements.length > 0 ? (
                    <>
                      <button className="btn btn-primary" onClick={handleConfirmPlacements}>
                        Confirm ({pendingPlacements.length} tile{pendingPlacements.length > 1 ? 's' : ''})
                      </button>
                      <button className="btn btn-secondary" onClick={handleCancelPlacements}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn btn-secondary"
                      onClick={() => setSwapMode(true)}
                      disabled={bagCount === 0}
                    >
                      Swap Tiles
                    </button>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {!isMyTurn && currentPlayer && (
          <>
            <p className="quirtle-hint">Wait for your turn</p>
            <PlayerHand
              hand={currentPlayer.hand}
              selectedTiles={[]}
              onSelectTile={() => {}}
              disabled={true}
            />
          </>
        )}
      </div>
    </div>
  )
}
