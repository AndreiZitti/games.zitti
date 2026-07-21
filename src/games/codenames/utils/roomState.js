import { getCardType } from '../data/words.js'

export function resetRound() {
  return {
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
  }
}

export function playerIsSpymaster(room, playerId) {
  return room.red_spymaster === playerId || room.blue_spymaster === playerId
}

export function buildLeaveUpdates(room, playerId) {
  if (!room.players.some(player => player.id === playerId)) return null

  const players = room.players.filter(player => player.id !== playerId)
  const departedWasSpymaster = playerIsSpymaster(room, playerId)
  const redCount = players.filter(player => player.team === 'red').length
  const blueCount = players.filter(player => player.team === 'blue').length
  const updates = {
    players,
    red_spymaster: room.red_spymaster === playerId ? null : room.red_spymaster,
    blue_spymaster: room.blue_spymaster === playerId ? null : room.blue_spymaster
  }

  const teamsTooSmall = redCount < 2 || blueCount < 2
  const roundCannotContinue = room.phase === 'playing' && (departedWasSpymaster || teamsTooSmall)
  const setupCannotContinue = room.phase === 'team-setup' && teamsTooSmall

  if (roundCannotContinue || setupCannotContinue) {
    Object.assign(updates, resetRound(), { players })
  }

  return updates
}

export function resolveCardReveal(room, position) {
  const cardType = getCardType(room.key_card, position)
  const guessesRemaining = Math.max(0, room.guesses_remaining - 1)
  const updates = {
    revealed_cards: [...room.revealed_cards, position],
    guesses_remaining: guessesRemaining
  }

  if (cardType === 'assassin') {
    updates.phase = 'ended'
    updates.winner = room.current_team === 'red' ? 'blue' : 'red'
    updates.win_reason = 'assassin'
    updates.current_clue = null
    updates.guesses_remaining = 0
  } else if (cardType === room.current_team) {
    const remainingField = room.current_team === 'red' ? 'red_remaining' : 'blue_remaining'
    const newRemaining = Math.max(0, room[remainingField] - 1)
    updates[remainingField] = newRemaining

    if (newRemaining === 0) {
      updates.phase = 'ended'
      updates.winner = room.current_team
      updates.win_reason = 'cards'
      updates.current_clue = null
      updates.guesses_remaining = 0
    } else if (guessesRemaining === 0) {
      updates.current_team = room.current_team === 'red' ? 'blue' : 'red'
      updates.current_clue = null
    }
  } else if (cardType === 'neutral') {
    updates.current_team = room.current_team === 'red' ? 'blue' : 'red'
    updates.current_clue = null
    updates.guesses_remaining = 0
  } else {
    const otherTeam = room.current_team === 'red' ? 'blue' : 'red'
    const remainingField = otherTeam === 'red' ? 'red_remaining' : 'blue_remaining'
    const newRemaining = Math.max(0, room[remainingField] - 1)
    updates[remainingField] = newRemaining
    updates.current_clue = null
    updates.guesses_remaining = 0

    if (newRemaining === 0) {
      updates.phase = 'ended'
      updates.winner = otherTeam
      updates.win_reason = 'cards'
    } else {
      updates.current_team = otherTeam
    }
  }

  return updates
}
