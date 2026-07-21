export function normalizeClue(value) {
  return String(value || '')
    .trim()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleUpperCase('en-US')
}

export function validateClue(word, board = [], revealedCards = []) {
  const trimmedWord = String(word || '').trim()

  if (!trimmedWord) {
    return { valid: false, error: 'Enter a clue word.' }
  }

  if (!/^\p{L}+(?:[-’']\p{L}+)*$/u.test(trimmedWord)) {
    return { valid: false, error: 'Use one word with letters only.' }
  }

  const clue = normalizeClue(trimmedWord)
  const revealed = new Set(revealedCards)

  for (let index = 0; index < board.length; index += 1) {
    if (revealed.has(index)) continue

    const boardWord = normalizeClue(board[index])
    const parts = boardWord.split(/[^A-Z]+/).filter(Boolean)

    if (clue === boardWord || parts.includes(clue)) {
      return { valid: false, error: `“${trimmedWord}” is on the board.` }
    }

    const overlapsPart = clue.length >= 3 && parts.some(part =>
      part.length >= 3 && (part.includes(clue) || clue.includes(part))
    )

    if (overlapsPart) {
      return { valid: false, error: `“${trimmedWord}” contains part of a board word.` }
    }
  }

  return { valid: true, error: null }
}
