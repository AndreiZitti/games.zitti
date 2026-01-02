/**
 * Get tile at position on board
 */
export function getTileAt(board, x, y) {
  return board.tiles.find(t => t.x === x && t.y === y) || null
}

/**
 * Get all adjacent positions
 */
export function getAdjacentPositions(x, y) {
  return [
    { x: x - 1, y },
    { x: x + 1, y },
    { x, y: y - 1 },
    { x, y: y + 1 }
  ]
}

/**
 * Check if position has at least one adjacent tile
 */
export function hasAdjacentTile(board, x, y) {
  if (board.tiles.length === 0) return true // First tile can go anywhere
  return getAdjacentPositions(x, y).some(pos => getTileAt(board, pos.x, pos.y))
}

/**
 * Get line of tiles in a direction
 */
export function getLineInDirection(board, x, y, dx, dy) {
  const line = []
  let cx = x + dx
  let cy = y + dy
  let tile = getTileAt(board, cx, cy)
  while (tile) {
    line.push(tile)
    cx += dx
    cy += dy
    tile = getTileAt(board, cx, cy)
  }
  return line
}

/**
 * Get full horizontal line through position (excluding the position itself)
 */
export function getHorizontalLine(board, x, y) {
  const left = getLineInDirection(board, x, y, -1, 0).reverse()
  const right = getLineInDirection(board, x, y, 1, 0)
  return [...left, ...right]
}

/**
 * Get full vertical line through position (excluding the position itself)
 */
export function getVerticalLine(board, x, y) {
  const up = getLineInDirection(board, x, y, 0, -1).reverse()
  const down = getLineInDirection(board, x, y, 0, 1)
  return [...up, ...down]
}

/**
 * Check if a line is valid (all same color OR all same shape, no duplicates)
 */
export function isValidLine(tiles) {
  if (tiles.length <= 1) return true
  if (tiles.length > 6) return false

  // Check for duplicates
  for (let i = 0; i < tiles.length; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      if (tiles[i].shape === tiles[j].shape && tiles[i].color === tiles[j].color) {
        return false
      }
    }
  }

  // Check if all same color
  const allSameColor = tiles.every(t => t.color === tiles[0].color)
  // Check if all same shape
  const allSameShape = tiles.every(t => t.shape === tiles[0].shape)

  return allSameColor || allSameShape
}

/**
 * Validate placing a tile at position
 */
export function isValidPlacement(board, tile, x, y) {
  // Check position is empty
  if (getTileAt(board, x, y)) return false

  // Check has adjacent tile (unless first tile)
  if (!hasAdjacentTile(board, x, y)) return false

  // Check horizontal line would be valid
  const hLine = [...getHorizontalLine(board, x, y), tile]
  if (hLine.length > 1 && !isValidLine(hLine)) return false

  // Check vertical line would be valid
  const vLine = [...getVerticalLine(board, x, y), tile]
  if (vLine.length > 1 && !isValidLine(vLine)) return false

  return true
}

/**
 * Get all valid positions for a tile
 */
export function getValidPositions(board, tile) {
  const positions = []

  if (board.tiles.length === 0) {
    // First tile - center of board
    return [{ x: 0, y: 0 }]
  }

  // Check all positions adjacent to existing tiles
  const checked = new Set()
  for (const existingTile of board.tiles) {
    for (const pos of getAdjacentPositions(existingTile.x, existingTile.y)) {
      const key = `${pos.x},${pos.y}`
      if (checked.has(key)) continue
      checked.add(key)

      if (isValidPlacement(board, tile, pos.x, pos.y)) {
        positions.push(pos)
      }
    }
  }

  return positions
}

/**
 * Calculate score for a placement
 */
export function calculateScore(board, placements) {
  let totalScore = 0
  const scoredLines = []

  // Create temporary board with placements
  const tempBoard = {
    tiles: [...board.tiles, ...placements]
  }

  // For each placed tile, count the lines it's part of
  const countedLines = new Set()

  for (const placed of placements) {
    // Horizontal line
    const hLine = [placed, ...getHorizontalLine(tempBoard, placed.x, placed.y)]
    if (hLine.length > 1) {
      const hKey = hLine.map(t => `${t.x},${t.y}`).sort().join('|')
      if (!countedLines.has(hKey)) {
        countedLines.add(hKey)
        const isQwirkle = hLine.length === 6
        const points = hLine.length + (isQwirkle ? 6 : 0)
        totalScore += points
        scoredLines.push({ length: hLine.length, isQwirkle, points })
      }
    }

    // Vertical line
    const vLine = [placed, ...getVerticalLine(tempBoard, placed.x, placed.y)]
    if (vLine.length > 1) {
      const vKey = vLine.map(t => `${t.x},${t.y}`).sort().join('|')
      if (!countedLines.has(vKey)) {
        countedLines.add(vKey)
        const isQwirkle = vLine.length === 6
        const points = vLine.length + (isQwirkle ? 6 : 0)
        totalScore += points
        scoredLines.push({ length: vLine.length, isQwirkle, points })
      }
    }
  }

  // If only one tile placed and no lines formed, score 1
  if (totalScore === 0 && placements.length === 1) {
    totalScore = 1
    scoredLines.push({ length: 1, isQwirkle: false, points: 1 })
  }

  return { totalScore, scoredLines }
}

/**
 * Validate multiple placements in a turn
 * All tiles must be in a single line (row or column)
 */
export function validateTurnPlacements(board, placements) {
  if (placements.length === 0) return { valid: false, error: 'No tiles placed' }
  if (placements.length === 1) {
    const p = placements[0]
    if (!isValidPlacement(board, p.tile, p.x, p.y)) {
      return { valid: false, error: 'Invalid placement' }
    }
    return { valid: true }
  }

  // Check all in same row or column
  const allSameRow = placements.every(p => p.y === placements[0].y)
  const allSameCol = placements.every(p => p.x === placements[0].x)

  if (!allSameRow && !allSameCol) {
    return { valid: false, error: 'All tiles must be placed in a single line' }
  }

  // Validate each placement individually
  let tempBoard = { tiles: [...board.tiles] }
  for (const p of placements) {
    if (!isValidPlacement(tempBoard, p.tile, p.x, p.y)) {
      return { valid: false, error: 'Invalid placement' }
    }
    tempBoard.tiles.push({ ...p.tile, x: p.x, y: p.y })
  }

  return { valid: true }
}

/**
 * Check if player has any valid moves
 */
export function hasValidMoves(board, hand) {
  for (const tile of hand) {
    if (getValidPositions(board, tile).length > 0) {
      return true
    }
  }
  return false
}
