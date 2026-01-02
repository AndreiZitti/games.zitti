import { useState, useEffect, useCallback } from 'react'
import { supabase, supabaseGames } from '@/lib/supabase/client'
import { generateRoomCode } from '@/lib/random'
import { useUser } from '@/contexts/UserContext'
import { generateAllTiles, shuffleArray, dealInitialHands, drawTiles, HAND_SIZE } from '../utils/tiles'
import { calculateScore, validateTurnPlacements, hasValidMoves } from '../utils/validation'

const STORAGE_KEY = 'quirtle_room_code'

function getRoomCodeFromURL() {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  return params.get('room')?.toUpperCase() || null
}

function getSavedRoomCode() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEY) || null
}

function saveRoomCode(code) {
  if (typeof window === 'undefined') return
  if (code) {
    localStorage.setItem(STORAGE_KEY, code)
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
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

  // Try to rejoin a room (from URL or localStorage)
  const tryRejoin = useCallback(async () => {
    const urlCode = getRoomCodeFromURL()
    const savedCode = getSavedRoomCode()
    const code = urlCode || savedCode

    if (!code) return null

    setLoading(true)
    try {
      const { data: existingRoom, error: fetchError } = await supabaseGames
        .from('quirtle_rooms')
        .select()
        .eq('code', code)
        .single()

      if (fetchError || !existingRoom) {
        // Room doesn't exist anymore, clear saved data
        saveRoomCode(null)
        updateURLWithRoomCode(null)
        return null
      }

      // Check if we're in this room
      const existingPlayer = existingRoom.players.find(p => p.id === playerId)
      if (existingPlayer) {
        saveRoomCode(existingRoom.code)
        updateURLWithRoomCode(existingRoom.code)
        setRoom(existingRoom)
        return existingRoom
      }

      // We're not in the room - if there's a URL code, return it for joining
      // Otherwise clear saved data
      if (urlCode) {
        return { code: urlCode, needsJoin: true }
      }

      saveRoomCode(null)
      return null
    } catch (err) {
      saveRoomCode(null)
      updateURLWithRoomCode(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [playerId])

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
      saveRoomCode(data.code)
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
      saveRoomCode(data.code)
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
    saveRoomCode(null)
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
    tryRejoin,
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
