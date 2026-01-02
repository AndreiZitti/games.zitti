import { useState, useRef, useEffect } from 'react'
import { Tile } from './Tile'
import { getValidPositions } from '../utils/validation'

const TILE_SIZE = 54
const GRID_OFFSET = 500 // Center offset for infinite grid

export function GameBoard({ board, selectedTile, onPlaceTile }) {
  const containerRef = useRef(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Calculate valid positions for selected tile
  const validPositions = selectedTile ? getValidPositions(board, selectedTile) : []

  // Handle mouse drag for panning
  const handleMouseDown = (e) => {
    if (e.target.closest('.quirtle-tile') || e.target.closest('.valid-position')) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Touch support
  const handleTouchStart = (e) => {
    if (e.target.closest('.quirtle-tile') || e.target.closest('.valid-position')) return
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y })
  }

  const handleTouchMove = (e) => {
    if (!isDragging) return
    const touch = e.touches[0]
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // Center board on mount
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setOffset({
        x: rect.width / 2 - GRID_OFFSET,
        y: rect.height / 2 - GRID_OFFSET
      })
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="quirtle-board-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div
        className="quirtle-board"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          width: GRID_OFFSET * 2,
          height: GRID_OFFSET * 2
        }}
      >
        {/* Placed tiles */}
        {board.tiles.map((tile, index) => (
          <div
            key={index}
            className="tile-slot"
            style={{
              left: GRID_OFFSET + tile.x * TILE_SIZE,
              top: GRID_OFFSET + tile.y * TILE_SIZE
            }}
          >
            <Tile tile={tile} />
          </div>
        ))}

        {/* Valid placement positions */}
        {validPositions.map((pos, index) => (
          <div
            key={`valid-${index}`}
            className="tile-slot"
            style={{
              left: GRID_OFFSET + pos.x * TILE_SIZE,
              top: GRID_OFFSET + pos.y * TILE_SIZE
            }}
          >
            <div
              className="valid-position"
              onClick={() => onPlaceTile(pos)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
