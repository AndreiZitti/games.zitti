import test from 'node:test'
import assert from 'node:assert/strict'

import { generateKeyCard, getCardType, getRandomWords } from '../src/games/codenames/data/words.js'
import { normalizeClue, validateClue } from '../src/games/codenames/utils/clues.js'
import { buildLeaveUpdates, resolveCardReveal } from '../src/games/codenames/utils/roomState.js'

function playingRoom(overrides = {}) {
  return {
    phase: 'playing',
    players: [
      { id: 'host', team: 'red' },
      { id: 'red-operative', team: 'red' },
      { id: 'blue-spymaster', team: 'blue' },
      { id: 'blue-operative', team: 'blue' }
    ],
    key_card: {
      red: [0],
      blue: [1],
      neutral: [2],
      assassin: 3,
      firstTeam: 'red'
    },
    current_team: 'red',
    current_clue: { word: 'TEST', number: 1 },
    guesses_remaining: 2,
    revealed_cards: [],
    red_spymaster: 'host',
    blue_spymaster: 'blue-spymaster',
    red_remaining: 1,
    blue_remaining: 1,
    ...overrides
  }
}

test('generated boards contain 25 unique words in both languages', () => {
  for (const language of ['en', 'ro']) {
    for (let run = 0; run < 500; run += 1) {
      const board = getRandomWords(language, 25)
      assert.equal(board.length, 25)
      assert.equal(new Set(board).size, 25)
    }
  }
})

test('key cards contain every position exactly once with the correct counts', () => {
  for (let run = 0; run < 1000; run += 1) {
    const keyCard = generateKeyCard()
    const allPositions = [...keyCard.red, ...keyCard.blue, ...keyCard.neutral, keyCard.assassin]

    assert.equal(keyCard[keyCard.firstTeam].length, 9)
    assert.equal(keyCard[keyCard.firstTeam === 'red' ? 'blue' : 'red'].length, 8)
    assert.equal(keyCard.neutral.length, 7)
    assert.deepEqual([...new Set(allPositions)].sort((a, b) => a - b), [...Array(25).keys()])

    for (const position of allPositions) {
      assert.ok(['red', 'blue', 'neutral', 'assassin'].includes(getCardType(keyCard, position)))
    }
  }
})

test('clue validation handles accents, board words, word parts, and revealed cards', () => {
  const board = ['PĂDURE', 'ICE CREAM', 'CROWN']

  assert.equal(normalizeClue(' pădure '), 'PADURE')
  assert.equal(validateClue('pădure', board, []).valid, false)
  assert.equal(validateClue('ice', board, []).valid, false)
  assert.equal(validateClue('crowning', board, []).valid, false)
  assert.equal(validateClue('two words', board, []).valid, false)
  assert.equal(validateClue('forest', board, []).valid, true)
  assert.equal(validateClue('pădure', board, [0]).valid, true)
})

test('card reveals resolve wins and turn changes correctly', () => {
  assert.deepEqual(resolveCardReveal(playingRoom(), 0), {
    revealed_cards: [0],
    guesses_remaining: 0,
    red_remaining: 0,
    phase: 'ended',
    winner: 'red',
    win_reason: 'cards',
    current_clue: null
  })

  assert.equal(resolveCardReveal(playingRoom(), 1).winner, 'blue')
  assert.equal(resolveCardReveal(playingRoom(), 3).winner, 'blue')

  const neutral = resolveCardReveal(playingRoom(), 2)
  assert.equal(neutral.current_team, 'blue')
  assert.equal(neutral.guesses_remaining, 0)

  const finalAllowedGuess = resolveCardReveal(playingRoom({ red_remaining: 2, guesses_remaining: 1 }), 0)
  assert.equal(finalAllowedGuess.current_team, 'blue')
  assert.equal(finalAllowedGuess.red_remaining, 1)
})

test('leaving transfers host and resets an unplayable round', () => {
  const hostLeaves = buildLeaveUpdates(playingRoom({ red_spymaster: 'someone-else' }), 'host')
  assert.equal(hostLeaves.players[0].id, 'red-operative')
  assert.equal(hostLeaves.phase, 'lobby')

  const operativeLeavesHealthyTeam = buildLeaveUpdates(playingRoom({
    players: [
      { id: 'host', team: 'red' },
      { id: 'red-one', team: 'red' },
      { id: 'red-two', team: 'red' },
      { id: 'blue-spymaster', team: 'blue' },
      { id: 'blue-operative', team: 'blue' }
    ]
  }), 'red-two')

  assert.equal(operativeLeavesHealthyTeam.phase, undefined)
  assert.equal(operativeLeavesHealthyTeam.players.length, 4)
})
