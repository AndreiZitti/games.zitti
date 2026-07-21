import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, supabaseGames } from '@/lib/supabase/client'
import { generateRoomCode } from '@/lib/random'
import { useUser } from '@/contexts/UserContext'
import { getRandomWords, generateKeyCard, getCardType } from '../data/words'
import { validateClue } from '../utils/clues'
import { buildLeaveUpdates, playerIsSpymaster, resetRound, resolveCardReveal } from '../utils/roomState'

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

const MAX_MUTATION_ATTEMPTS = 5

async function fetchCodenamesRoom(code) {
  const { data, error } = await supabaseGames
    .from('codenames_rooms')
    .select()
    .eq('code', code)
    .maybeSingle()

  if (error) throw error
  return data
}

async function mutateCodenamesRoom(code, reducer) {
  for (let attempt = 0; attempt < MAX_MUTATION_ATTEMPTS; attempt += 1) {
    const currentRoom = await fetchCodenamesRoom(code)
    if (!currentRoom) throw new Error('Room no longer exists')

    const updates = reducer(currentRoom)
    if (!updates) return currentRoom

    const expectedRevision = currentRoom.revision ?? 0
    const { data, error } = await supabaseGames
      .from('codenames_rooms')
      .update({ ...updates, revision: expectedRevision + 1 })
      .eq('code', code)
      .eq('revision', expectedRevision)
      .select()
      .maybeSingle()

    if (error) throw error
    if (data) return data
  }

  throw new Error('The room changed too quickly. Please try again.')
}

function playerTeam(room, playerId) {
  return room.players.find(player => player.id === playerId)?.team || null
}

function assertHost(room, playerId) {
  if (room.players[0]?.id !== playerId) {
    throw new Error('Only the host can do that')
  }
}

export function useCodenamesRoom() {
  const { profile, updateName, incrementGamesPlayed, incrementGamesHosted } = useUser()
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const countedEndedPhase = useRef(false)

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

    countedEndedPhase.current = room.phase === 'ended'

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
            if (payload.new.phase === 'ended' && !countedEndedPhase.current) {
              incrementGamesPlayed()
            }
            countedEndedPhase.current = payload.new.phase === 'ended'
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
      const normalizedName = hostName.trim()
      const newRoom = {
        code,
        revision: 0,
        phase: 'lobby',
        language: 'en',
        players: [{ id: playerId, name: normalizedName, team: null }],
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

      updateName(normalizedName)
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
      const normalizedCode = code.toUpperCase()
      const normalizedName = playerName.trim()
      const data = await mutateCodenamesRoom(normalizedCode, currentRoom => {
        if (currentRoom.phase !== 'lobby') throw new Error('Game already in progress')

        const existingPlayer = currentRoom.players.find(player => player.id === playerId)
        const players = existingPlayer
          ? currentRoom.players.map(player =>
              player.id === playerId ? { ...player, name: normalizedName } : player
            )
          : [...currentRoom.players, { id: playerId, name: normalizedName, team: null }]

        return { players }
      })

      updateName(normalizedName)
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
    if (!room || !['red', 'blue'].includes(team)) return false

    try {
      setError(null)
      const data = await mutateCodenamesRoom(room.code, currentRoom => {
        if (currentRoom.phase !== 'lobby') throw new Error('Team selection has ended')
        if (!currentRoom.players.some(player => player.id === playerId)) {
          throw new Error('You are no longer in this room')
        }

        return {
          players: currentRoom.players.map(player =>
            player.id === playerId ? { ...player, team } : player
          )
        }
      })
      setRoom(data)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [room, playerId])

  // Leave team (back to unassigned)
  const leaveTeam = useCallback(async () => {
    if (!room) return false

    try {
      setError(null)
      const data = await mutateCodenamesRoom(room.code, currentRoom => {
        if (currentRoom.phase !== 'lobby') throw new Error('Team selection has ended')
        return {
          players: currentRoom.players.map(player =>
            player.id === playerId ? { ...player, team: null } : player
          )
        }
      })
      setRoom(data)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [room, playerId])

  // Set language (host only)
  const setLanguage = useCallback(async (language) => {
    if (!room || !['en', 'ro'].includes(language)) return false

    try {
      setError(null)
      const data = await mutateCodenamesRoom(room.code, currentRoom => {
        assertHost(currentRoom, playerId)
        if (currentRoom.phase !== 'lobby') throw new Error('Language can only change in the lobby')
        return { language }
      })
      setRoom(data)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [room, playerId])

  // Start team setup phase (host only)
  const startTeamSetup = useCallback(async () => {
    if (!room) return false

    try {
      setError(null)
      const data = await mutateCodenamesRoom(room.code, currentRoom => {
        assertHost(currentRoom, playerId)
        if (currentRoom.phase !== 'lobby') throw new Error('Team setup has already started')

        const redCount = currentRoom.players.filter(player => player.team === 'red').length
        const blueCount = currentRoom.players.filter(player => player.team === 'blue').length
        if (redCount < 2 || blueCount < 2) {
          throw new Error('Each team needs at least 2 players')
        }

        return { phase: 'team-setup' }
      })
      setRoom(data)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [room, playerId])

  // Become spymaster for your team
  const becomeSpymaster = useCallback(async () => {
    if (!room) return false

    try {
      setError(null)
      const data = await mutateCodenamesRoom(room.code, currentRoom => {
        if (currentRoom.phase !== 'team-setup') throw new Error('Spymaster selection has ended')

        const team = playerTeam(currentRoom, playerId)
        if (!team) throw new Error('Join a team before becoming Spymaster')

        const field = team === 'red' ? 'red_spymaster' : 'blue_spymaster'
        if (currentRoom[field] && currentRoom[field] !== playerId) {
          throw new Error('Your team already has a Spymaster')
        }

        return { [field]: playerId }
      })
      setRoom(data)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [room, playerId])

  // Remove spymaster (host only, or self-remove)
  const removeSpymaster = useCallback(async (team) => {
    if (!room || !['red', 'blue'].includes(team)) return false

    try {
      setError(null)
      const data = await mutateCodenamesRoom(room.code, currentRoom => {
        if (currentRoom.phase !== 'team-setup') throw new Error('Spymaster selection has ended')

        const field = team === 'red' ? 'red_spymaster' : 'blue_spymaster'
        const spymasterId = currentRoom[field]
        const currentIsHost = currentRoom.players[0]?.id === playerId
        if (!currentIsHost && spymasterId !== playerId) {
          throw new Error('Only the host or that Spymaster can remove the role')
        }

        return { [field]: null }
      })
      setRoom(data)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [room, playerId])

  // Start game (host only)
  const startGame = useCallback(async () => {
    if (!room) return false

    try {
      setError(null)
      const data = await mutateCodenamesRoom(room.code, currentRoom => {
        assertHost(currentRoom, playerId)
        if (currentRoom.phase !== 'team-setup') throw new Error('Game cannot start from this phase')
        if (!currentRoom.red_spymaster || !currentRoom.blue_spymaster) {
          throw new Error('Both teams need a Spymaster')
        }

        const redCount = currentRoom.players.filter(player => player.team === 'red').length
        const blueCount = currentRoom.players.filter(player => player.team === 'blue').length
        if (redCount < 2 || blueCount < 2) {
          throw new Error('Each team needs at least 2 players')
        }

        const board = getRandomWords(currentRoom.language, 25)
        const keyCard = generateKeyCard()

        return {
          phase: 'playing',
          board,
          key_card: keyCard,
          current_team: keyCard.firstTeam,
          current_clue: null,
          guesses_remaining: 0,
          revealed_cards: [],
          red_remaining: keyCard.firstTeam === 'red' ? 9 : 8,
          blue_remaining: keyCard.firstTeam === 'blue' ? 9 : 8,
          winner: null,
          win_reason: null
        }
      })
      setRoom(data)
      incrementGamesHosted()
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [room, playerId, incrementGamesHosted])

  // Give clue (spymaster only, on their turn)
  const giveClue = useCallback(async (word, number) => {
    if (!room) return false

    try {
      setError(null)
      const clueNumber = Number(number)
      if (!Number.isInteger(clueNumber) || clueNumber < 0 || clueNumber > 9) {
        throw new Error('Choose a clue number from 0 to 9')
      }

      const data = await mutateCodenamesRoom(room.code, currentRoom => {
        if (currentRoom.phase !== 'playing') throw new Error('The game is not active')

        const team = playerTeam(currentRoom, playerId)
        const spymasterId = team === 'red' ? currentRoom.red_spymaster : currentRoom.blue_spymaster
        if (!team || spymasterId !== playerId || currentRoom.current_team !== team) {
          throw new Error('It is not your turn to give a clue')
        }
        if (currentRoom.current_clue) throw new Error('A clue has already been given')

        const validation = validateClue(word, currentRoom.board, currentRoom.revealed_cards)
        if (!validation.valid) throw new Error(validation.error)

        return {
          current_clue: {
            word: word.trim().toLocaleUpperCase(currentRoom.language === 'ro' ? 'ro-RO' : 'en-US'),
            number: clueNumber,
            givenBy: playerId
          },
          guesses_remaining: clueNumber === 0 ? 25 : clueNumber + 1
        }
      })
      setRoom(data)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [room, playerId])

  // Reveal a card (operative only, on their turn, after clue given)
  const revealCard = useCallback(async (position) => {
    if (!room || !Number.isInteger(position) || position < 0 || position > 24) return false

    try {
      setError(null)
      const data = await mutateCodenamesRoom(room.code, currentRoom => {
        if (currentRoom.phase !== 'playing' || !currentRoom.current_clue) {
          throw new Error('There is no active guessing turn')
        }

        const team = playerTeam(currentRoom, playerId)
        if (!team || currentRoom.current_team !== team || playerIsSpymaster(currentRoom, playerId)) {
          throw new Error('It is not your turn to guess')
        }
        if (currentRoom.revealed_cards.includes(position)) {
          throw new Error('That card has already been revealed')
        }

        return resolveCardReveal(currentRoom, position)
      })
      setRoom(data)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [room, playerId])

  // End guessing early (operative only)
  const endGuessing = useCallback(async () => {
    if (!room) return false

    try {
      setError(null)
      const data = await mutateCodenamesRoom(room.code, currentRoom => {
        if (currentRoom.phase !== 'playing' || !currentRoom.current_clue) {
          throw new Error('There is no active guessing turn')
        }

        const team = playerTeam(currentRoom, playerId)
        if (!team || currentRoom.current_team !== team || playerIsSpymaster(currentRoom, playerId)) {
          throw new Error('It is not your turn to end guessing')
        }

        return {
          current_team: currentRoom.current_team === 'red' ? 'blue' : 'red',
          current_clue: null,
          guesses_remaining: 0
        }
      })
      setRoom(data)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [room, playerId])

  // Play again (host only)
  const playAgain = useCallback(async () => {
    if (!room) return false

    try {
      setError(null)
      const data = await mutateCodenamesRoom(room.code, currentRoom => {
        assertHost(currentRoom, playerId)
        if (currentRoom.phase !== 'ended') throw new Error('The game has not ended')
        return resetRound()
      })
      setRoom(data)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [room, playerId])

  // Leave room
  const leaveRoom = useCallback(async () => {
    if (!room) {
      saveRoomCode(null)
      updateURLWithRoomCode(null)
      return true
    }

    try {
      setError(null)
      const data = await mutateCodenamesRoom(room.code, currentRoom => {
        return buildLeaveUpdates(currentRoom, playerId)
      })

      if (data.players.length === 0) {
        const { error: deleteError } = await supabaseGames
          .from('codenames_rooms')
          .delete()
          .eq('code', data.code)
          .eq('revision', data.revision)

        if (deleteError) throw deleteError
      }

      saveRoomCode(null)
      updateURLWithRoomCode(null)
      setRoom(null)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [room, playerId])

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
