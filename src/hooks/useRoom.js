import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { generateRoomCode, assignNumbers } from '../lib/random'

// Get or create player ID from localStorage
function getPlayerId() {
  let id = localStorage.getItem('playerId')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('playerId', id)
  }
  return id
}

export function useRoom() {
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [playerId] = useState(getPlayerId)

  // Get current player from room
  const currentPlayer = room?.players?.find(p => p.id === playerId)
  const isHost = room?.players?.[0]?.id === playerId

  // Subscribe to room updates
  useEffect(() => {
    if (!room?.code) return

    const channel = supabase
      .channel(`room:${room.code}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
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

  // Create a new room
  const createRoom = useCallback(async (hostName) => {
    setLoading(true)
    setError(null)

    try {
      const code = generateRoomCode()
      const newRoom = {
        code,
        phase: 'lobby',
        round: 1,
        category: null,
        players: [{ id: playerId, name: hostName, number: null, hidden: true, confirmed: false }]
      }

      const { data, error: supabaseError } = await supabase
        .from('rooms')
        .insert(newRoom)
        .select()
        .single()

      if (supabaseError) throw supabaseError
      setRoom(data)
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [playerId])

  // Join an existing room
  const joinRoom = useCallback(async (code, playerName) => {
    setLoading(true)
    setError(null)

    try {
      // First fetch the room
      const { data: existingRoom, error: fetchError } = await supabase
        .from('rooms')
        .select()
        .eq('code', code.toUpperCase())
        .single()

      if (fetchError) throw new Error('Room not found')
      if (existingRoom.phase !== 'lobby') throw new Error('Game already in progress')

      // Check if player already in room
      const existingPlayer = existingRoom.players.find(p => p.id === playerId)
      if (existingPlayer) {
        setRoom(existingRoom)
        return existingRoom
      }

      // Add player to room
      const updatedPlayers = [
        ...existingRoom.players,
        { id: playerId, name: playerName, number: null, hidden: true, confirmed: false }
      ]

      const { data, error: updateError } = await supabase
        .from('rooms')
        .update({ players: updatedPlayers })
        .eq('code', code.toUpperCase())
        .select()
        .single()

      if (updateError) throw updateError
      setRoom(data)
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [playerId])

  // Set category (host only)
  const setCategory = useCallback(async (category) => {
    if (!room || !isHost) return

    const { error: updateError } = await supabase
      .from('rooms')
      .update({ category })
      .eq('code', room.code)

    if (updateError) setError(updateError.message)
  }, [room, isHost])

  // Start round (host only)
  const startRound = useCallback(async () => {
    if (!room || !isHost) return

    const playersWithNumbers = assignNumbers(room.players, room.code, room.round)

    const { error: updateError } = await supabase
      .from('rooms')
      .update({
        players: playersWithNumbers,
        phase: 'playing'
      })
      .eq('code', room.code)

    if (updateError) setError(updateError.message)
  }, [room, isHost])

  // Toggle number visibility
  const toggleHidden = useCallback(async () => {
    if (!room || !currentPlayer) return

    const updatedPlayers = room.players.map(p =>
      p.id === playerId ? { ...p, hidden: !p.hidden } : p
    )

    const { error: updateError } = await supabase
      .from('rooms')
      .update({ players: updatedPlayers })
      .eq('code', room.code)

    if (updateError) setError(updateError.message)
  }, [room, currentPlayer, playerId])

  // Confirm position
  const confirmPosition = useCallback(async () => {
    if (!room || !currentPlayer) return

    const updatedPlayers = room.players.map(p =>
      p.id === playerId ? { ...p, confirmed: true, hidden: true } : p
    )

    // Check if all players confirmed
    const allConfirmed = updatedPlayers.every(p => p.confirmed)
    const newPhase = allConfirmed ? 'revealed' : 'confirming'

    const { error: updateError } = await supabase
      .from('rooms')
      .update({
        players: updatedPlayers,
        phase: newPhase
      })
      .eq('code', room.code)

    if (updateError) setError(updateError.message)
  }, [room, currentPlayer, playerId])

  // Next round (host only)
  const nextRound = useCallback(async () => {
    if (!room || !isHost) return

    const resetPlayers = room.players.map(p => ({
      ...p,
      number: null,
      hidden: true,
      confirmed: false
    }))

    const { error: updateError } = await supabase
      .from('rooms')
      .update({
        players: resetPlayers,
        round: room.round + 1,
        phase: 'lobby',
        category: null
      })
      .eq('code', room.code)

    if (updateError) setError(updateError.message)
  }, [room, isHost])

  // Leave room
  const leaveRoom = useCallback(() => {
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
    createRoom,
    joinRoom,
    setCategory,
    startRound,
    toggleHidden,
    confirmPosition,
    nextRound,
    leaveRoom
  }
}
