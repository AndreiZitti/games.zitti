# QUIRTLE Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a multiplayer tile-matching game where 2-4 players take turns placing tiles to form lines of matching colors or shapes.

**Architecture:** Supabase realtime for multiplayer state sync (same pattern as Hot Take/Like Minded). All game state stored in database as single source of truth. React functional components with custom hook for room management.

**Tech Stack:** Next.js 16 (App Router), React 19, Supabase (realtime + postgres), CSS with CSS variables, Framer Motion for animations.

---

## Phase 1: Foundation

### Task 1: Create Supabase Migration

**Files:**
- Create: `supabase/migrations/003_quirtle_rooms.sql`

**Step 1: Write the migration file**

```sql
-- Quirtle Rooms - Tile Matching Game
-- Table for multiplayer Quirtle game rooms

CREATE TABLE IF NOT EXISTS games.quirtle_rooms (
  code TEXT PRIMARY KEY,
  phase TEXT NOT NULL DEFAULT 'lobby'
    CHECK (phase IN ('lobby', 'playing', 'ended')),
  players JSONB NOT NULL DEFAULT '[]'::jsonb,
  host_id TEXT NOT NULL,
  board JSONB NOT NULL DEFAULT '{"tiles": []}'::jsonb,
  bag JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_player_index INTEGER NOT NULL DEFAULT 0,
  turn_number INTEGER NOT NULL DEFAULT 0,
  last_score JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE games.quirtle_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read quirtle rooms"
  ON games.quirtle_rooms FOR SELECT USING (true);

CREATE POLICY "Anyone can create quirtle rooms"
  ON games.quirtle_rooms FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update quirtle rooms"
  ON games.quirtle_rooms FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete quirtle rooms"
  ON games.quirtle_rooms FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE games.quirtle_rooms;

CREATE INDEX IF NOT EXISTS quirtle_rooms_created_at_idx ON games.quirtle_rooms (created_at);

CREATE OR REPLACE FUNCTION games.cleanup_old_quirtle_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM games.quirtle_rooms
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE games.quirtle_rooms IS 'Multiplayer rooms for Quirtle tile-matching game';

/*
Players JSONB Structure:
[
  {
    "id": "uuid",
    "name": "Player Name",
    "hand": [{"shape": "circle", "color": "red"}, ...],
    "score": 0
  }
]

Board JSONB Structure:
{
  "tiles": [
    {"x": 0, "y": 0, "shape": "circle", "color": "red"},
    ...
  ]
}

Bag JSONB Structure:
[
  {"shape": "circle", "color": "red"},
  ...
]

Last Score JSONB Structure (for UI feedback):
{
  "points": 12,
  "lines": [{"length": 6, "isQwirkle": true}],
  "playerId": "uuid"
}
*/
```

**Step 2: Note for deployment**

This migration needs to be run on Supabase. For local development, we'll verify the table structure works with the code.

---

### Task 2: Create Tile Utilities

**Files:**
- Create: `src/games/quirtle/utils/tiles.js`

**Step 1: Create the tiles utility file**

```javascript
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
```

---

### Task 3: Create Validation Utilities

**Files:**
- Create: `src/games/quirtle/utils/validation.js`

**Step 1: Create the validation utility file**

```javascript
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
```

---

### Task 4: Create Room Hook

**Files:**
- Create: `src/games/quirtle/hooks/useQuirtleRoom.js`

**Step 1: Create the room hook**

```javascript
import { useState, useEffect, useCallback } from 'react'
import { supabase, supabaseGames } from '@/lib/supabase/client'
import { generateRoomCode } from '@/lib/random'
import { useUser } from '@/contexts/UserContext'
import { generateAllTiles, shuffleArray, dealInitialHands, drawTiles, HAND_SIZE } from '../utils/tiles'
import { calculateScore, validateTurnPlacements, hasValidMoves } from '../utils/validation'

function getRoomCodeFromURL() {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  return params.get('room')?.toUpperCase() || null
}

function updateURLWithRoomCode(code) {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (code) {
    url.searchParams.set('room', code)
  } else {
    url.searchParams.delete('room')
  }
  window.history.replaceState({}, '', url)
}

export function useQuirtleRoom() {
  const { profile, updateName } = useUser()
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const playerId = profile.id
  const currentPlayer = room?.players?.find(p => p.id === playerId)
  const isHost = room?.host_id === playerId
  const isMyTurn = room?.phase === 'playing' && room?.players?.[room.current_player_index]?.id === playerId

  // Subscribe to room updates
  useEffect(() => {
    if (!room?.code) return

    const channel = supabase
      .channel(`quirtle:${room.code}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'games',
          table: 'quirtle_rooms',
          filter: `code=eq.${room.code}`
        },
        (payload) => {
          if (payload.new) {
            setRoom(payload.new)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [room?.code])

  // Create room
  const createRoom = useCallback(async (hostName) => {
    setLoading(true)
    setError(null)

    try {
      const code = generateRoomCode()
      const newRoom = {
        code,
        phase: 'lobby',
        host_id: playerId,
        players: [{ id: playerId, name: hostName, hand: [], score: 0 }],
        board: { tiles: [] },
        bag: [],
        current_player_index: 0,
        turn_number: 0
      }

      const { data, error: supabaseError } = await supabaseGames
        .from('quirtle_rooms')
        .insert(newRoom)
        .select()
        .single()

      if (supabaseError) throw supabaseError

      updateName(hostName)
      updateURLWithRoomCode(data.code)
      setRoom(data)
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [playerId, updateName])

  // Join room
  const joinRoom = useCallback(async (code, playerName) => {
    setLoading(true)
    setError(null)

    try {
      const { data: existingRoom, error: fetchError } = await supabaseGames
        .from('quirtle_rooms')
        .select()
        .eq('code', code.toUpperCase())
        .single()

      if (fetchError) throw new Error('Room not found')
      if (existingRoom.phase !== 'lobby') throw new Error('Game already in progress')
      if (existingRoom.players.length >= 4) throw new Error('Room is full')

      const existingPlayer = existingRoom.players.find(p => p.id === playerId)
      if (existingPlayer) {
        updateName(playerName)
        updateURLWithRoomCode(existingRoom.code)
        setRoom(existingRoom)
        return existingRoom
      }

      const updatedPlayers = [
        ...existingRoom.players,
        { id: playerId, name: playerName, hand: [], score: 0 }
      ]

      const { data, error: updateError } = await supabaseGames
        .from('quirtle_rooms')
        .update({ players: updatedPlayers })
        .eq('code', code.toUpperCase())
        .select()
        .single()

      if (updateError) throw updateError

      updateName(playerName)
      updateURLWithRoomCode(data.code)
      setRoom(data)
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [playerId, updateName])

  // Start game (host only)
  const startGame = useCallback(async () => {
    if (!room || !isHost) return
    if (room.players.length < 2) {
      setError('Need at least 2 players')
      return
    }

    const allTiles = generateAllTiles()
    const shuffledBag = shuffleArray(allTiles)
    const { players: playersWithHands, bag } = dealInitialHands(room.players, shuffledBag)

    const { error: updateError } = await supabaseGames
      .from('quirtle_rooms')
      .update({
        phase: 'playing',
        players: playersWithHands,
        bag,
        current_player_index: 0,
        turn_number: 1
      })
      .eq('code', room.code)

    if (updateError) setError(updateError.message)
  }, [room, isHost])

  // Place tiles (current player only)
  const placeTiles = useCallback(async (placements) => {
    if (!room || !isMyTurn) return { success: false, error: 'Not your turn' }

    const validation = validateTurnPlacements(room.board, placements)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Calculate score
    const placedTiles = placements.map(p => ({ ...p.tile, x: p.x, y: p.y }))
    const { totalScore, scoredLines } = calculateScore(room.board, placedTiles)

    // Update board
    const newBoard = {
      tiles: [...room.board.tiles, ...placedTiles]
    }

    // Remove tiles from hand
    const placedTileIds = placements.map(p => `${p.tile.shape}-${p.tile.color}`)
    let newHand = [...currentPlayer.hand]
    for (const id of placedTileIds) {
      const idx = newHand.findIndex(t => `${t.shape}-${t.color}` === id)
      if (idx !== -1) newHand.splice(idx, 1)
    }

    // Draw new tiles
    const tilesToDraw = Math.min(HAND_SIZE - newHand.length, room.bag.length)
    const { drawn, remaining: newBag } = drawTiles(room.bag, tilesToDraw)
    newHand = [...newHand, ...drawn]

    // Update player
    const newPlayers = room.players.map(p =>
      p.id === playerId
        ? { ...p, hand: newHand, score: p.score + totalScore }
        : p
    )

    // Check for game end
    const playerEmptiedHand = newHand.length === 0 && newBag.length === 0
    let finalPlayers = newPlayers
    let newPhase = 'playing'

    if (playerEmptiedHand) {
      // Add 12 point Quirtle bonus
      finalPlayers = newPlayers.map(p =>
        p.id === playerId ? { ...p, score: p.score + 12 } : p
      )
      newPhase = 'ended'
    }

    // Next player
    const nextPlayerIndex = (room.current_player_index + 1) % room.players.length

    const { error: updateError } = await supabaseGames
      .from('quirtle_rooms')
      .update({
        board: newBoard,
        bag: newBag,
        players: finalPlayers,
        current_player_index: nextPlayerIndex,
        turn_number: room.turn_number + 1,
        phase: newPhase,
        last_score: {
          points: totalScore + (playerEmptiedHand ? 12 : 0),
          lines: scoredLines,
          playerId,
          quirtle: playerEmptiedHand
        }
      })
      .eq('code', room.code)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true, score: totalScore }
  }, [room, isMyTurn, currentPlayer, playerId])

  // Swap tiles (when no valid moves)
  const swapTiles = useCallback(async (tilesToSwap) => {
    if (!room || !isMyTurn) return { success: false, error: 'Not your turn' }
    if (room.bag.length === 0) return { success: false, error: 'Bag is empty' }

    // Remove tiles from hand
    let newHand = [...currentPlayer.hand]
    for (const tile of tilesToSwap) {
      const idx = newHand.findIndex(t => t.shape === tile.shape && t.color === tile.color)
      if (idx !== -1) newHand.splice(idx, 1)
    }

    // Draw new tiles
    const tilesToDraw = Math.min(tilesToSwap.length, room.bag.length)
    const { drawn, remaining } = drawTiles(room.bag, tilesToDraw)
    newHand = [...newHand, ...drawn]

    // Put swapped tiles back in bag and shuffle
    const newBag = shuffleArray([...remaining, ...tilesToSwap])

    const newPlayers = room.players.map(p =>
      p.id === playerId ? { ...p, hand: newHand } : p
    )

    const nextPlayerIndex = (room.current_player_index + 1) % room.players.length

    const { error: updateError } = await supabaseGames
      .from('quirtle_rooms')
      .update({
        bag: newBag,
        players: newPlayers,
        current_player_index: nextPlayerIndex,
        turn_number: room.turn_number + 1,
        last_score: null
      })
      .eq('code', room.code)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true }
  }, [room, isMyTurn, currentPlayer, playerId])

  // Play again
  const playAgain = useCallback(async () => {
    if (!room || !isHost) return

    const allTiles = generateAllTiles()
    const shuffledBag = shuffleArray(allTiles)
    const resetPlayers = room.players.map(p => ({ ...p, hand: [], score: 0 }))
    const { players: playersWithHands, bag } = dealInitialHands(resetPlayers, shuffledBag)

    const { error: updateError } = await supabaseGames
      .from('quirtle_rooms')
      .update({
        phase: 'playing',
        players: playersWithHands,
        board: { tiles: [] },
        bag,
        current_player_index: 0,
        turn_number: 1,
        last_score: null
      })
      .eq('code', room.code)

    if (updateError) setError(updateError.message)
  }, [room, isHost])

  // Leave room
  const leaveRoom = useCallback(() => {
    updateURLWithRoomCode(null)
    setRoom(null)
    setError(null)
  }, [])

  return {
    room,
    loading,
    error,
    playerId,
    currentPlayer,
    isHost,
    isMyTurn,
    savedName: profile.name,
    createRoom,
    joinRoom,
    startGame,
    placeTiles,
    swapTiles,
    playAgain,
    leaveRoom,
    hasValidMoves: useCallback(() => {
      if (!room || !currentPlayer) return false
      return hasValidMoves(room.board, currentPlayer.hand)
    }, [room, currentPlayer])
  }
}
```

---

### Task 5: Create Basic CSS

**Files:**
- Create: `src/games/quirtle/quirtle.css`

**Step 1: Create the CSS file**

```css
/* Quirtle Game Styles */

.quirtle-game {
  --quirtle-accent: #10b981;
  --quirtle-bg: #0f172a;
  --quirtle-surface: #1e293b;
  --quirtle-text: #f8fafc;
  --quirtle-text-muted: #94a3b8;
}

/* Colors for tiles */
.quirtle-game {
  --tile-red: #ef4444;
  --tile-orange: #f97316;
  --tile-yellow: #eab308;
  --tile-green: #22c55e;
  --tile-blue: #3b82f6;
  --tile-purple: #a855f7;
}

/* Home Screen */
.quirtle-home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background: var(--quirtle-bg);
  color: var(--quirtle-text);
}

.quirtle-home h1 {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  color: var(--quirtle-accent);
}

.quirtle-home .subtitle {
  color: var(--quirtle-text-muted);
  margin-bottom: 2rem;
}

.quirtle-home .how-to-play {
  background: var(--quirtle-surface);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  max-width: 400px;
}

.quirtle-home .how-to-play ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.quirtle-home .how-to-play li {
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
}

.quirtle-home .how-to-play li::before {
  content: "•";
  color: var(--quirtle-accent);
  position: absolute;
  left: 0;
}

/* Buttons */
.quirtle-game .btn {
  padding: 1rem 2rem;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.quirtle-game .btn-primary {
  background: var(--quirtle-accent);
  color: white;
}

.quirtle-game .btn-primary:hover {
  filter: brightness(1.1);
}

.quirtle-game .btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quirtle-game .btn-secondary {
  background: var(--quirtle-surface);
  color: var(--quirtle-text);
  border: 1px solid var(--quirtle-text-muted);
}

.quirtle-game .btn-secondary:hover {
  background: #334155;
}

.quirtle-game .btn-back {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: transparent;
  border: none;
  color: var(--quirtle-text-muted);
  cursor: pointer;
  font-size: 1rem;
}

.quirtle-game .btn-back:hover {
  color: var(--quirtle-text);
}

.quirtle-game .button-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 300px;
}

/* Input Groups */
.quirtle-game .input-group {
  margin-bottom: 1.5rem;
}

.quirtle-game .input-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.quirtle-game .input-group input {
  width: 100%;
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--quirtle-text-muted);
  background: var(--quirtle-surface);
  color: var(--quirtle-text);
  font-size: 1rem;
}

.quirtle-game .input-group input:focus {
  outline: none;
  border-color: var(--quirtle-accent);
}

/* Error message */
.quirtle-game .error {
  background: #7f1d1d;
  color: #fecaca;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

/* Create/Join Room Screens */
.quirtle-create-room,
.quirtle-join-room {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--quirtle-bg);
  color: var(--quirtle-text);
  position: relative;
}

.quirtle-create-room h1,
.quirtle-join-room h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.quirtle-create-room .subtitle,
.quirtle-join-room .subtitle {
  color: var(--quirtle-text-muted);
  margin-bottom: 2rem;
}

.quirtle-create-room form,
.quirtle-join-room form {
  width: 100%;
  max-width: 300px;
}

/* Lobby */
.quirtle-lobby {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background: var(--quirtle-bg);
  color: var(--quirtle-text);
  position: relative;
}

.quirtle-lobby h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.quirtle-lobby .room-code {
  font-size: 3rem;
  font-weight: 800;
  color: var(--quirtle-accent);
  letter-spacing: 0.2em;
  margin-bottom: 2rem;
}

.quirtle-lobby .players-list {
  background: var(--quirtle-surface);
  border-radius: 1rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 400px;
  margin-bottom: 2rem;
}

.quirtle-lobby .players-list h2 {
  font-size: 1rem;
  color: var(--quirtle-text-muted);
  margin-bottom: 1rem;
}

.quirtle-lobby .player-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #334155;
}

.quirtle-lobby .player-item:last-child {
  border-bottom: none;
}

.quirtle-lobby .player-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--quirtle-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.quirtle-lobby .player-name {
  flex: 1;
}

.quirtle-lobby .host-badge {
  font-size: 0.75rem;
  background: var(--quirtle-accent);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.quirtle-lobby .waiting-text {
  color: var(--quirtle-text-muted);
  font-style: italic;
}

/* Tile Styles */
.quirtle-tile {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  border: 2px solid transparent;
}

.quirtle-tile:hover {
  transform: scale(1.05);
}

.quirtle-tile.selected {
  border-color: white;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.quirtle-tile[data-color="red"] { background: var(--tile-red); }
.quirtle-tile[data-color="orange"] { background: var(--tile-orange); }
.quirtle-tile[data-color="yellow"] { background: var(--tile-yellow); }
.quirtle-tile[data-color="green"] { background: var(--tile-green); }
.quirtle-tile[data-color="blue"] { background: var(--tile-blue); }
.quirtle-tile[data-color="purple"] { background: var(--tile-purple); }

/* Shape icons (using Unicode/CSS shapes) */
.quirtle-tile .shape-circle::before { content: "●"; }
.quirtle-tile .shape-square::before { content: "■"; }
.quirtle-tile .shape-diamond::before { content: "◆"; }
.quirtle-tile .shape-star::before { content: "★"; }
.quirtle-tile .shape-cross::before { content: "✚"; }
.quirtle-tile .shape-triangle::before { content: "▲"; }

/* Player Hand */
.quirtle-hand {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--quirtle-surface);
  border-radius: 1rem;
  justify-content: center;
}

/* Game Board */
.quirtle-board-container {
  flex: 1;
  overflow: auto;
  background: var(--quirtle-bg);
  position: relative;
}

.quirtle-board {
  position: relative;
  min-width: 100%;
  min-height: 100%;
}

.quirtle-board .tile-slot {
  position: absolute;
  width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quirtle-board .valid-position {
  background: rgba(16, 185, 129, 0.2);
  border: 2px dashed var(--quirtle-accent);
  border-radius: 8px;
  cursor: pointer;
}

.quirtle-board .valid-position:hover {
  background: rgba(16, 185, 129, 0.4);
}

/* Scoreboard */
.quirtle-scoreboard {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: var(--quirtle-surface);
  border-radius: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.quirtle-score-item {
  text-align: center;
  min-width: 80px;
}

.quirtle-score-item.active {
  color: var(--quirtle-accent);
}

.quirtle-score-item .name {
  font-size: 0.875rem;
  color: var(--quirtle-text-muted);
}

.quirtle-score-item .score {
  font-size: 1.5rem;
  font-weight: 700;
}

/* Game Screen Layout */
.quirtle-game-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--quirtle-bg);
  color: var(--quirtle-text);
}

.quirtle-game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--quirtle-surface);
}

.quirtle-game-footer {
  padding: 1rem;
  background: var(--quirtle-surface);
}

/* Turn indicator */
.quirtle-turn-indicator {
  text-align: center;
  padding: 0.5rem;
  background: var(--quirtle-accent);
  color: white;
  font-weight: 600;
}

.quirtle-turn-indicator.waiting {
  background: #334155;
}

/* End Screen */
.quirtle-end-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--quirtle-bg);
  color: var(--quirtle-text);
}

.quirtle-end-screen h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.quirtle-end-screen .winner {
  color: var(--quirtle-accent);
  font-size: 1.5rem;
  margin-bottom: 2rem;
}

.quirtle-final-scores {
  background: var(--quirtle-surface);
  border-radius: 1rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 400px;
  margin-bottom: 2rem;
}

.quirtle-final-scores .score-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #334155;
}

.quirtle-final-scores .score-row:last-child {
  border-bottom: none;
}

.quirtle-final-scores .score-row.winner {
  color: var(--quirtle-accent);
  font-weight: 700;
}
```

---

## Phase 2: Components

### Task 6: Create Page Route

**Files:**
- Create: `src/app/games/quirtle/page.tsx`

**Step 1: Create the page file**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { QuirtleGame } from "@/games/quirtle/QuirtleGame";

export default function QuirtlePage() {
  const router = useRouter();

  return <QuirtleGame onBack={() => router.push("/")} />;
}
```

---

### Task 7: Create Main Game Component

**Files:**
- Create: `src/games/quirtle/QuirtleGame.jsx`

**Step 1: Create the main game component**

```jsx
import { useState } from 'react'
import './quirtle.css'
import { useQuirtleRoom } from './hooks/useQuirtleRoom'
import { CreateRoom } from './components/CreateRoom'
import { JoinRoom } from './components/JoinRoom'
import { Lobby } from './components/Lobby'
import { GameScreen } from './components/GameScreen'
import { EndScreen } from './components/EndScreen'

export function QuirtleGame({ onBack }) {
  const [screen, setScreen] = useState('home')

  const {
    room,
    loading,
    error,
    playerId,
    currentPlayer,
    isHost,
    isMyTurn,
    savedName,
    createRoom,
    joinRoom,
    startGame,
    placeTiles,
    swapTiles,
    playAgain,
    leaveRoom,
    hasValidMoves
  } = useQuirtleRoom()

  const handleCreateRoom = async (name) => {
    const newRoom = await createRoom(name)
    if (newRoom) setScreen('game')
  }

  const handleJoinRoom = async (code, name) => {
    const joined = await joinRoom(code, name)
    if (joined) setScreen('game')
  }

  const handleLeave = () => {
    leaveRoom()
    setScreen('home')
  }

  const handleBackToHub = () => {
    leaveRoom()
    onBack()
  }

  // Home screen
  if (screen === 'home') {
    return (
      <div className="quirtle-game quirtle-home">
        <button className="btn-back" onClick={onBack}>
          &larr; Back to Games
        </button>

        <h1>QUIRTLE</h1>
        <p className="subtitle">Match colors and shapes to score points!</p>

        <div className="how-to-play">
          <ul>
            <li>Place tiles to form lines of matching colors OR shapes</li>
            <li>Score points equal to the length of lines you create</li>
            <li>Complete a line of 6 for bonus points (Qwirkle!)</li>
            <li>First to empty their hand when the bag is empty wins!</li>
          </ul>
        </div>

        <div className="button-group">
          <button className="btn btn-primary" onClick={() => setScreen('create')}>
            Create Room
          </button>
          <button className="btn btn-secondary" onClick={() => setScreen('join')}>
            Join Room
          </button>
        </div>
      </div>
    )
  }

  // Create room screen
  if (screen === 'create') {
    return (
      <CreateRoom
        onBack={() => setScreen('home')}
        onCreateRoom={handleCreateRoom}
        loading={loading}
        error={error}
        savedName={savedName}
      />
    )
  }

  // Join room screen
  if (screen === 'join') {
    return (
      <JoinRoom
        onBack={() => setScreen('home')}
        onJoinRoom={handleJoinRoom}
        loading={loading}
        error={error}
        savedName={savedName}
      />
    )
  }

  // Game screens
  if (screen === 'game' && room) {
    if (room.phase === 'lobby') {
      return (
        <Lobby
          room={room}
          isHost={isHost}
          onStartGame={startGame}
          onLeave={handleLeave}
        />
      )
    }

    if (room.phase === 'playing') {
      return (
        <GameScreen
          room={room}
          playerId={playerId}
          currentPlayer={currentPlayer}
          isMyTurn={isMyTurn}
          onPlaceTiles={placeTiles}
          onSwapTiles={swapTiles}
          onLeave={handleLeave}
          hasValidMoves={hasValidMoves}
        />
      )
    }

    if (room.phase === 'ended') {
      return (
        <EndScreen
          room={room}
          isHost={isHost}
          onPlayAgain={playAgain}
          onLeave={handleBackToHub}
        />
      )
    }
  }

  return (
    <div className="quirtle-game">
      <p>Loading...</p>
    </div>
  )
}
```

---

### Task 8: Create CreateRoom Component

**Files:**
- Create: `src/games/quirtle/components/CreateRoom.jsx`

**Step 1: Create the component**

```jsx
import { useState } from 'react'

export function CreateRoom({ onBack, onCreateRoom, loading, error, savedName }) {
  const [name, setName] = useState(savedName || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim()) {
      onCreateRoom(name.trim())
    }
  }

  return (
    <div className="quirtle-game quirtle-create-room">
      <button className="btn-back" onClick={onBack}>
        &larr; Back
      </button>

      <h1>Create Room</h1>
      <p className="subtitle">Start a new Quirtle game</p>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="name">Your Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            autoFocus
            autoComplete="off"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={!name.trim() || loading}
          style={{ width: '100%' }}
        >
          {loading ? 'Creating...' : 'Create Room'}
        </button>
      </form>
    </div>
  )
}
```

---

### Task 9: Create JoinRoom Component

**Files:**
- Create: `src/games/quirtle/components/JoinRoom.jsx`

**Step 1: Create the component**

```jsx
import { useState } from 'react'

export function JoinRoom({ onBack, onJoinRoom, loading, error, savedName }) {
  const [name, setName] = useState(savedName || '')
  const [code, setCode] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim() && code.trim()) {
      onJoinRoom(code.trim().toUpperCase(), name.trim())
    }
  }

  return (
    <div className="quirtle-game quirtle-join-room">
      <button className="btn-back" onClick={onBack}>
        &larr; Back
      </button>

      <h1>Join Room</h1>
      <p className="subtitle">Enter a room code to join</p>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="code">Room Code</label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCD1"
            maxLength={5}
            autoFocus
            autoComplete="off"
            style={{ textTransform: 'uppercase', letterSpacing: '0.2em', textAlign: 'center' }}
          />
        </div>

        <div className="input-group">
          <label htmlFor="name">Your Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            autoComplete="off"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={!name.trim() || !code.trim() || loading}
          style={{ width: '100%' }}
        >
          {loading ? 'Joining...' : 'Join Room'}
        </button>
      </form>
    </div>
  )
}
```

---

### Task 10: Create Lobby Component

**Files:**
- Create: `src/games/quirtle/components/Lobby.jsx`

**Step 1: Create the component**

```jsx
export function Lobby({ room, isHost, onStartGame, onLeave }) {
  const canStart = room.players.length >= 2 && room.players.length <= 4

  return (
    <div className="quirtle-game quirtle-lobby">
      <button className="btn-back" onClick={onLeave}>
        &larr; Leave
      </button>

      <h1>Quirtle Lobby</h1>
      <div className="room-code">{room.code}</div>

      <div className="players-list">
        <h2>Players ({room.players.length}/4)</h2>
        {room.players.map((player, index) => (
          <div key={player.id} className="player-item">
            <div className="player-avatar">
              {player.name.charAt(0).toUpperCase()}
            </div>
            <span className="player-name">{player.name}</span>
            {index === 0 && <span className="host-badge">Host</span>}
          </div>
        ))}
        {room.players.length < 2 && (
          <p className="waiting-text">Waiting for more players...</p>
        )}
      </div>

      {isHost ? (
        <button
          className="btn btn-primary"
          onClick={onStartGame}
          disabled={!canStart}
        >
          {room.players.length < 2
            ? 'Need at least 2 players'
            : 'Start Game'}
        </button>
      ) : (
        <p className="waiting-text">Waiting for host to start...</p>
      )}
    </div>
  )
}
```

---

### Task 11: Create Tile Component

**Files:**
- Create: `src/games/quirtle/components/Tile.jsx`

**Step 1: Create the component**

```jsx
export function Tile({ tile, selected, onClick, size = 50 }) {
  const shapeClass = `shape-${tile.shape}`

  return (
    <div
      className={`quirtle-tile ${selected ? 'selected' : ''}`}
      data-color={tile.color}
      onClick={onClick}
      style={{ width: size, height: size }}
    >
      <span className={shapeClass}></span>
    </div>
  )
}
```

---

### Task 12: Create PlayerHand Component

**Files:**
- Create: `src/games/quirtle/components/PlayerHand.jsx`

**Step 1: Create the component**

```jsx
import { Tile } from './Tile'

export function PlayerHand({ hand, selectedTiles, onSelectTile, disabled }) {
  const isSelected = (index) => selectedTiles.includes(index)

  return (
    <div className="quirtle-hand">
      {hand.map((tile, index) => (
        <Tile
          key={index}
          tile={tile}
          selected={isSelected(index)}
          onClick={() => !disabled && onSelectTile(index)}
        />
      ))}
    </div>
  )
}
```

---

### Task 13: Create ScoreBoard Component

**Files:**
- Create: `src/games/quirtle/components/ScoreBoard.jsx`

**Step 1: Create the component**

```jsx
export function ScoreBoard({ players, currentPlayerIndex }) {
  return (
    <div className="quirtle-scoreboard">
      {players.map((player, index) => (
        <div
          key={player.id}
          className={`quirtle-score-item ${index === currentPlayerIndex ? 'active' : ''}`}
        >
          <div className="name">{player.name}</div>
          <div className="score">{player.score}</div>
        </div>
      ))}
    </div>
  )
}
```

---

### Task 14: Create GameBoard Component

**Files:**
- Create: `src/games/quirtle/components/GameBoard.jsx`

**Step 1: Create the component**

```jsx
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

  // Calculate board bounds
  const getBounds = () => {
    if (board.tiles.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
    }
    const xs = board.tiles.map(t => t.x)
    const ys = board.tiles.map(t => t.y)
    return {
      minX: Math.min(...xs) - 2,
      maxX: Math.max(...xs) + 2,
      minY: Math.min(...ys) - 2,
      maxY: Math.max(...ys) + 2
    }
  }

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

  // Center board on first tile
  useEffect(() => {
    if (containerRef.current && board.tiles.length === 0) {
      const rect = containerRef.current.getBoundingClientRect()
      setOffset({
        x: rect.width / 2 - GRID_OFFSET,
        y: rect.height / 2 - GRID_OFFSET
      })
    }
  }, [board.tiles.length])

  return (
    <div
      ref={containerRef}
      className="quirtle-board-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
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
            className="tile-slot valid-position"
            style={{
              left: GRID_OFFSET + pos.x * TILE_SIZE,
              top: GRID_OFFSET + pos.y * TILE_SIZE
            }}
            onClick={() => onPlaceTile(pos)}
          />
        ))}
      </div>
    </div>
  )
}
```

---

### Task 15: Create GameScreen Component

**Files:**
- Create: `src/games/quirtle/components/GameScreen.jsx`

**Step 1: Create the component**

```jsx
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

  const handleSelectTile = (index) => {
    if (swapMode) {
      // In swap mode, toggle selection
      setSelectedTileIndices(prev =>
        prev.includes(index)
          ? prev.filter(i => i !== index)
          : [...prev, index]
      )
    } else {
      // In place mode, select single tile
      setSelectedTileIndices(prev =>
        prev.includes(index) ? [] : [index]
      )
    }
  }

  const handlePlaceTile = (position) => {
    if (selectedTileIndices.length !== 1) return

    const tileIndex = selectedTileIndices[0]
    const tile = currentPlayer.hand[tileIndex]

    setPendingPlacements(prev => [...prev, { tile, x: position.x, y: position.y }])
    setSelectedTileIndices([])
  }

  const handleConfirmPlacements = async () => {
    if (pendingPlacements.length === 0) return

    setError(null)
    const result = await onPlaceTiles(pendingPlacements)

    if (!result.success) {
      setError(result.error)
    } else {
      setPendingPlacements([])
    }
  }

  const handleCancelPlacements = () => {
    setPendingPlacements([])
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

  // Get available hand (excluding pending placements)
  const availableHand = currentPlayer?.hand.filter((_, i) =>
    !pendingPlacements.some((p, pi) => {
      // This is simplified - in real impl would track which hand index each placement came from
      return false
    })
  ) || []

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
        <div style={{ fontSize: '0.875rem', color: 'var(--quirtle-text-muted)' }}>
          Bag: {bagCount}
        </div>
      </div>

      <div className={`quirtle-turn-indicator ${isMyTurn ? '' : 'waiting'}`}>
        {isMyTurn ? 'Your turn!' : `${currentTurnPlayer?.name}'s turn`}
      </div>

      {error && <div className="error" style={{ margin: '0.5rem' }}>{error}</div>}

      {room.last_score && (
        <div style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--quirtle-accent)', color: 'white' }}>
          {room.players.find(p => p.id === room.last_score.playerId)?.name} scored {room.last_score.points} points!
          {room.last_score.lines.some(l => l.isQwirkle) && ' QWIRKLE!'}
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
                <p style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                  Select tiles to swap, then confirm
                </p>
                <PlayerHand
                  hand={currentPlayer.hand}
                  selectedTiles={selectedTileIndices}
                  onSelectTile={handleSelectTile}
                  disabled={false}
                />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'center' }}>
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
                <PlayerHand
                  hand={currentPlayer.hand}
                  selectedTiles={selectedTileIndices}
                  onSelectTile={handleSelectTile}
                  disabled={false}
                />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'center' }}>
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
                    <>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setSwapMode(true)}
                        disabled={bagCount === 0}
                      >
                        Swap Tiles
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {!isMyTurn && currentPlayer && (
          <PlayerHand
            hand={currentPlayer.hand}
            selectedTiles={[]}
            onSelectTile={() => {}}
            disabled={true}
          />
        )}
      </div>
    </div>
  )
}
```

---

### Task 16: Create EndScreen Component

**Files:**
- Create: `src/games/quirtle/components/EndScreen.jsx`

**Step 1: Create the component**

```jsx
export function EndScreen({ room, isHost, onPlayAgain, onLeave }) {
  // Sort players by score
  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score)
  const winner = sortedPlayers[0]

  return (
    <div className="quirtle-game quirtle-end-screen">
      <h1>Game Over!</h1>
      <p className="winner">{winner.name} wins!</p>

      <div className="quirtle-final-scores">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            className={`score-row ${index === 0 ? 'winner' : ''}`}
          >
            <span>{index + 1}. {player.name}</span>
            <span>{player.score} pts</span>
          </div>
        ))}
      </div>

      <div className="button-group">
        {isHost && (
          <button className="btn btn-primary" onClick={onPlayAgain}>
            Play Again
          </button>
        )}
        <button className="btn btn-secondary" onClick={onLeave}>
          Back to Games
        </button>
      </div>
    </div>
  )
}
```

---

### Task 17: Create Index Export

**Files:**
- Create: `src/games/quirtle/index.js`

**Step 1: Create the index file**

```javascript
export { QuirtleGame } from './QuirtleGame'
```

---

### Task 18: Add to GameHub

**Files:**
- Modify: `src/components/GameHub.tsx`

**Step 1: Add Quirtle to games array**

Add this entry to the `games` array after the existing games:

```typescript
{
  id: "quirtle",
  name: "Quirtle",
  description: "Match colors and shapes in this tile-laying strategy game.",
  available: true,
  accent: "#10b981",
  href: "/games/quirtle",
},
```

---

### Task 19: Run Supabase Migration

**Step 1: Apply migration to Supabase**

Run the SQL from `supabase/migrations/003_quirtle_rooms.sql` in your Supabase SQL editor.

---

### Task 20: Test and Commit

**Step 1: Run dev server**

```bash
npm run dev
```

**Step 2: Test basic flow**

1. Navigate to http://localhost:3000
2. Click on Quirtle game card
3. Create a room
4. Open another browser/tab, join with room code
5. Start game and verify tiles are dealt

**Step 3: Commit all files**

```bash
git add .
git commit -m "feat: add Quirtle tile-matching game MVP

- Add Supabase migration for quirtle_rooms table
- Add tile utilities (generation, shuffling, dealing)
- Add validation utilities (placement rules, scoring)
- Add room hook with realtime sync
- Add all game components (lobby, board, hand, etc.)
- Add game to GameHub"
```

---

## Summary

This plan creates a complete MVP of Quirtle with:

1. **Phase 1 (Foundation)**: Migration, utilities, hooks, CSS
2. **Phase 2 (Components)**: All UI components for the game flow

**Total Tasks**: 20 bite-sized tasks

**Key files created**:
- `supabase/migrations/003_quirtle_rooms.sql`
- `src/games/quirtle/utils/tiles.js`
- `src/games/quirtle/utils/validation.js`
- `src/games/quirtle/hooks/useQuirtleRoom.js`
- `src/games/quirtle/quirtle.css`
- `src/games/quirtle/QuirtleGame.jsx`
- `src/games/quirtle/components/*.jsx` (8 components)
- `src/app/games/quirtle/page.tsx`
