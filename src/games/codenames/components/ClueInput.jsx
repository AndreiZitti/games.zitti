import { useState } from 'react'
import { validateClue } from '../utils/clues'

export function ClueInput({ onSubmit, disabled, board, revealedCards }) {
  const [word, setWord] = useState('')
  const [number, setNumber] = useState('')
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const clueValidation = validateClue(word, board, revealedCards)
  const parsedNumber = Number(number)
  const isNumberValid = number !== '' && Number.isInteger(parsedNumber) && parsedNumber >= 0 && parsedNumber <= 9
  const isValid = clueValidation.valid && isNumberValid

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid || submitting) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const submitted = await onSubmit(word.trim(), parsedNumber)
      if (submitted !== false) {
        setWord('')
        setNumber('')
      }
    } catch (error) {
      setSubmitError(error.message || 'Could not submit that clue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="clue-input" onSubmit={handleSubmit}>
      <div className="clue-fields">
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value.toUpperCase())}
          placeholder="ONE WORD CLUE"
          className="clue-word-input"
          disabled={disabled || submitting}
          autoFocus
        />
        <select
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          className="clue-number-input"
          disabled={disabled || submitting}
        >
          <option value="">##</option>
          <option value="0">∞</option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={disabled || submitting || !isValid}
      >
        {submitting ? 'Sending…' : 'Give Clue'}
      </button>

      {word && !clueValidation.valid && (
        <p className="clue-error" role="alert">{clueValidation.error}</p>
      )}
      {submitError && <p className="clue-error" role="alert">{submitError}</p>}

      <p className="clue-hint">
        One word only; it cannot be a visible board word or part of one
      </p>
    </form>
  )
}
