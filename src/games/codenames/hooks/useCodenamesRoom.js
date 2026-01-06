import { useState, useEffect, useCallback } from 'react'
import { supabase, supabaseGames } from '@/lib/supabase/client'
import { generateRoomCode } from '@/lib/random'
import { useUser } from '@/contexts/UserContext'
import { getRandomWords, generateKeyCard, getCardType } from '../data/words'

// LocalStorage key for this game
const STORAGE_KEY = 'codenamesRoomCode'

// Get saved room code from localStorage
function getSavedRoomCode() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEY) || null
}

// Save room code to localStorage
function saveRoomCode(code) {
  if (typeof window === 'undefined') return
  if (code) {
    localStorage.setItem(STORAGE_KEY, code)
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

// Get room code from URL params
function getRoomCodeFromURL() {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  return params.get('room')?.toUpperCase() || null
}

// Update URL with room code
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

export function useCodenamesRoom() {
  const { profile, updateName, incrementGamesPlayed, incrementGamesHosted } = useUser()
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Player ID from UserContext
  const playerId = profile.id

  // Derived state
  const currentPlayer = room?.players?.find(p => p.id === playerId)
  const isHost = room?.players?.[0]?.id === playerId
  const myTeam = currentPlayer?.team

  // Check if player is spymaster
  const isSpymaster = (myTeam === 'red' && room?.red_spymaster === playerId) ||
                      (myTeam === 'blue' && room?.blue_spymaster === playerId)

  // Check if it's my team's turn
  const isMyTurn = room?.current_team === myTeam

  // Team helpers
  const redTeam = room?.players?.filter(p => p.team === 'red') || []
  const blueTeam = room?.players?.filter(p => p.team === 'blue') || []
  const unassigned = room?.players?.filter(p => !p.team) || []

  // Subscribe to room updates
  useEffect(() => {
    if (!room?.code) return

    const channel = supabase
      .channel(`codenames:${room.code}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'games',
          table: 'codenames_rooms',
          filter: `code=eq.${room.code}`
        },
        (payload) => {
          if (payload.new) {
            // Check if game ended - count as game played
            if (payload.old?.phase !== 'ended' && payload.new.phase === 'ended') {
              incrementGamesPlayed()
            }
            setRoom(payload.new)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [room?.code, incrementGamesPlayed])

  // Try to rejoin a room (from URL or localStorage)
  const tryRejoin = useCallback(async () => {
    const urlCode = getRoomCodeFromURL()
    const savedCode = getSavedRoomCode()
    const code = urlCode || savedCode

    if (!code) return null

    setLoading(true)
    try {
      const { data: existingRoom, error: fetchError } = await supabaseGames
        .from('codenames_rooms')
        .select()
        .eq('code', code)
        .single()

      if (fetchError || !existingRoom) {
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

  // Create a new room
  const createRoom = useCallback(async (hostName) => {
    setLoading(true)
    setError(null)

    try {
      const code = generateRoomCode()
      const newRoom = {
        code,
        phase: 'lobby',
        language: 'en',
        players: [{ id: playerId, name: hostName, team: null }],
        board: null,
        key_card: null,
        current_team: null,
        current_clue: null,
        guesses_remaining: 0,
        revealed_cards: [],
        red_spymaster: null,
        blue_spymaster: null,
        red_remaining: 0,
        blue_remaining: 0,
        winner: null,
        win_reason: null
      }

      const { data, error: supabaseError } = await supabaseGames
        .from('codenames_rooms')
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

  // Join an existing room
  const joinRoom = useCallback(async (code, playerName) => {
    setLoading(true)
    setError(null)

    try {
      const { data: existingRoom, error: fetchError } = await supabaseGames
        .from('codenames_rooms')
        .select()
        .eq('code', code.toUpperCase())
        .single()

      if (fetchError) throw new Error('Room not found')
      if (existingRoom.phase !== 'lobby') throw new Error('Game already in progress')

      // Check if player already in room
      const existingPlayer = existingRoom.players.find(p => p.id === playerId)
      if (existingPlayer) {
        updateName(playerName)
        saveRoomCode(existingRoom.code)
        updateURLWithRoomCode(existingRoom.code)
        setRoom(existingRoom)
        return existingRoom
      }

      // Add player to room
      const updatedPlayers = [
        ...existingRoom.players,
        { id: playerId, name: playerName, team: null }
      ]

      const { data, error: updateError } = await supabaseGames
        .from('codenames_rooms')
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

  // Join a team (lobby phase)
  const joinTeam = useCallback(async (team) => {
    if (!room || room.phase !== 'lobby') return

    const updatedPlayers = room.players.map(p =>
      p.id === playerId ? { ...p, team } : p
    )

    const { error: updateError } = await supabaseGames
      .from('codenames_rooms')
      .update({ players: updatedPlayers })
      .eq('code', room.code)

    if (updateError) setError(updateError.message)
  }, [room, playerId])

  // Leave team (back to unassigned)
  const leaveTeam = useCallback(async () => {
    if (!room || room.phase !== 'lobby') return

    const updatedPlayers = room.players.map(p =>
      p.id === playerId ? { ...p, team: null } : p
    )

    const { error: updateError } = await supabaseGames
      .from('codenames_rooms')
      .update({ players: updatedPlayers })
      .eq('code', room.code)

    if (updateError) setError(updateError.message)
  }, [room, playerId])

  // Set language (host only)
  const setLanguage = useCallback(async (language) => {
    if (!room || !isHost) return

    const { error: updateError } = await supabaseGames
      .from('codenames_rooms')
      .update({ language })
      .eq('code', room.code)

    if (updateError) setError(updateError.message)
  }, [room, isHost])

  // Start team setup phase (host only)
  const startTeamSetup = useCallback(async () => {
    if (!room || !isHost) return

    // Validate: need at least 2 players per team
    const redCount = room.players.filter(p => p.team === 'red').length
    const blueCount = room.players.filter(p => p.team === 'blue').length

    if (redCount < 2 || blueCount < 2) {
      setError('Each team needs at least 2 players')
      return
    }

    const { error: updateError } = await supabaseGames
      .from('codenames_rooms')
      .update({ phase: 'team-setup' })
      .eq('code', room.code)

    if (updateError) setError(updateError.message)
  }, [room, isHost])

  // Become spymaster for your team
  const becomeSpymaster = useCallback(async () => {
    if (!room || !myTeam || room.phase !== 'team-setup') return

    const field = myTeam === 'red' ? 'red_spymaster' : 'blue_spymaster'

    const { error: updateError } = await supabaseGames
      .from('codenames_rooms')
      .update({ [field]: playerId })
      .eq('code', room.code)

    if (updateError) setError(updateError.message)
  }, [room, myTeam, playerId])

  // Remove spymaster (host only, or self-remove)
  const removeSpymaster = useCallback(async (team) => {
    if (!room || room.phase !== 'team-setup') return

    // Can only remove if host or removing yourself
    const spymasterId = team === 'red' ? room.red_spymaster : room.blue_spymaster
    if (!isHost && spymasterId !== playerId) return

    const field = team === 'red' ? 'red_spymaster' : 'blue_spymaster'

    const { error: updateError } = await supabaseGames
      .from('codenames_rooms')
      .update({ [field]: null })
      .eq('code', room.code)

    if (updateError) setError(updateError.message)
  }, [room, isHost, playerId])

  // Start game (host only)
  const startGame = useCallback(async () => {
    if (!room || !isHost || room.phase !== 'team-setup') return

    // Validate: both teams need spymasters
    if (!room.red_spymaster || !room.blue_spymaster) {
      setError('Both teams need a spymaster')
      return
    }

    // Generate board and key card
    const board = getRandomWords(room.language, 25)
    const keyCard = generateKeyCard()

    const { error: updateError } = await supabaseGames
      .from('codenames_rooms')
      .update({
        phase: 'playing',
        board,
        key_card: keyCard,
        current_team: keyCard.firstTeam,
        current_clue: null,
        guesses_remaining: 0,
        revealed_cards: [],
        red_remaining: keyCard.firstTeam === 'red' ? 9 : 8,
        blue_remaining: keyCard.firstTeam === 'blue' ? 9 : 8
      })
      .eq('code', room.code)

    if (!updateError) {
      incrementGamesHosted()
    } else {
      setError(updateError.message)
    }
  }, [room, isHost, incrementGamesHosted])

  // Give clue (spymaster only, on their turn)
  const giveClue = useCallback(async (word, number) => {
    if (!room || !isSpymaster || !isMyTurn || room.current_clue) return

    const clue = {
      word: word.toUpperCase(),
      number: parseInt(number, 10),
      givenBy: playerId
    }

    // guesses = number + 1 (bonus guess), or 25 if unlimited (0)
    const guessesRemaining = number === 0 ? 25 : parseInt(number, 10) + 1

    const { error: updateError } = await supabaseGames
      .from('codenames_rooms')
      .update({
        current_clue: clue,
        guesses_remaining: guessesRemaining
      })
      .eq('code', room.code)

    if (updateError) setError(updateError.message)
  }, [room, isSpymaster, isMyTurn, playerId])

  // Reveal a card (operative only, on their turn, after clue given)
  const revealCard = useCallback(async (position) => {
    if (!room || isSpymaster || !isMyTurn || !room.current_clue) return
    if (room.revealed_cards.includes(position)) return // Already revealed

    const cardType = getCardType(room.key_card, position)
    const newRevealedCards = [...room.revealed_cards, position]

    let updates = {
      revealed_cards: newRevealedCards,
      guesses_remaining: room.guesses_remaining - 1
    }

    // Handle different card types
    if (cardType === 'assassin') {
      // Game over - other team wins
      const winner = room.current_team === 'red' ? 'blue' : 'red'
      updates.phase = 'ended'
      updates.winner = winner
      updates.win_reason = 'assassin'
      updates.current_clue = null
    } else if (cardType === room.current_team) {
      // Correct guess - decrement remaining
      const remainingField = room.current_team === 'red' ? 'red_remaining' : 'blue_remaining'
      const newRemaining = room[remainingField] - 1
      updates[remainingField] = newRemaining

      // Check for win
      if (newRemaining === 0) {
        updates.phase = 'ended'
        updates.winner = room.current_team
        updates.win_reason = 'cards'
        updates.current_clue = null
      } else if (updates.guesses_remaining === 0) {
        // Out of guesses, switch turns
        updates.current_team = room.current_team === 'red' ? 'blue' : 'red'
        updates.current_clue = null
      }
      // Otherwise, can continue guessing
    } else if (cardType === 'neutral') {
      // Neutral - turn ends
      updates.current_team = room.current_team === 'red' ? 'blue' : 'red'
      updates.current_clue = null
    } else {
      // Other team's card - decrement their remaining, turn ends
      const otherTeam = room.current_team === 'red' ? 'blue' : 'red'
      const remainingField = otherTeam === 'red' ? 'red_remaining' : 'blue_remaining'
      const newRemaining = room[remainingField] - 1
      updates[remainingField] = newRemaining

      // Check if other team wins (we revealed their last card)
      if (newRemaining === 0) {
        updates.phase = 'ended'
        updates.winner = otherTeam
        updates.win_reason = 'cards'
        updates.current_clue = null
      } else {
        updates.current_team = otherTeam
        updates.current_clue = null
      }
    }

    const { error: updateError } = await supabaseGames
      .from('codenames_rooms')
      .update(updates)
      .eq('code', room.code)

    if (updateError) setError(updateError.message)
  }, [room, isSpymaster, isMyTurn])

  // End guessing early (operative only)
  const endGuessing = useCallback(async () => {
    if (!room || isSpymaster || !isMyTurn || !room.current_clue) return

    const { error: updateError } = await supabaseGames
      .from('codenames_rooms')
      .update({
        current_team: room.current_team === 'red' ? 'blue' : 'red',
        current_clue: null,
        guesses_remaining: 0
      })
      .eq('code', room.code)

    if (updateError) setError(updateError.message)
  }, [room, isSpymaster, isMyTurn])

  // Play again (host only)
  const playAgain = useCallback(async () => {
    if (!room || !isHost) return

    // Reset players (keep teams)
    const { error: updateError } = await supabaseGames
      .from('codenames_rooms')
      .update({
        phase: 'lobby',
        board: null,
        key_card: null,
        current_team: null,
        current_clue: null,
        guesses_remaining: 0,
        revealed_cards: [],
        red_spymaster: null,
        blue_spymaster: null,
        red_remaining: 0,
        blue_remaining: 0,
        winner: null,
        win_reason: null
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
    // State
    room,
    loading,
    error,
    playerId,

    // Derived
    currentPlayer,
    isHost,
    myTeam,
    isSpymaster,
    isMyTurn,
    redTeam,
    blueTeam,
    unassigned,

    // User profile
    savedName: profile.name,
    profile,

    // Room actions
    createRoom,
    joinRoom,
    tryRejoin,
    leaveRoom,

    // Lobby actions
    joinTeam,
    leaveTeam,
    setLanguage,
    startTeamSetup,

    // Team setup actions
    becomeSpymaster,
    removeSpymaster,
    startGame,

    // Playing actions
    giveClue,
    revealCard,
    endGuessing,

    // End actions
    playAgain,

    // Helpers
    getCardType: (position) => room?.key_card ? getCardType(room.key_card, position) : null
  }
}
