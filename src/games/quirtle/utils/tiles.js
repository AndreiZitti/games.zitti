// Tile definitions
export const SHAPES = ['circle', 'square', 'diamond', 'star', 'cross', 'triangle']
export const COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple']
export const COPIES_PER_TILE = 3
export const HAND_SIZE = 6

/**
 * Generate all 108 tiles (6 shapes x 6 colors x 3 copies)
 */
export function generateAllTiles() {
  const tiles = []
  for (const shape of SHAPES) {
    for (const color of COLORS) {
      for (let i = 0; i < COPIES_PER_TILE; i++) {
        tiles.push({ shape, color })
      }
    }
  }
  return tiles
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export function shuffleArray(array, rng = Math.random) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Draw tiles from bag
 * @returns {{ drawn: Tile[], remaining: Tile[] }}
 */
export function drawTiles(bag, count) {
  const drawn = bag.slice(0, count)
  const remaining = bag.slice(count)
  return { drawn, remaining }
}

/**
 * Deal initial hands to players
 * @returns {{ players: Player[], bag: Tile[] }}
 */
export function dealInitialHands(players, shuffledBag) {
  let bag = [...shuffledBag]
  const updatedPlayers = players.map(player => {
    const { drawn, remaining } = drawTiles(bag, HAND_SIZE)
    bag = remaining
    return { ...player, hand: drawn, score: 0 }
  })
  return { players: updatedPlayers, bag }
}

/**
 * Check if two tiles match (same shape OR same color, but not identical)
 */
export function tilesMatch(tile1, tile2) {
  const sameShape = tile1.shape === tile2.shape
  const sameColor = tile1.color === tile2.color
  // Must share exactly one attribute
  return (sameShape || sameColor) && !(sameShape && sameColor)
}

/**
 * Check if two tiles are identical
 */
export function tilesIdentical(tile1, tile2) {
  return tile1.shape === tile2.shape && tile1.color === tile2.color
}
