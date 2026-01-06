import { useState } from 'react'

export function ClueInput({ onSubmit, disabled }) {
  const [word, setWord] = useState('')
  const [number, setNumber] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (word.trim() && number !== '') {
      onSubmit(word.trim(), parseInt(number, 10))
      setWord('')
      setNumber('')
    }
  }

  const isValid = word.trim().length > 0 &&
                  !word.includes(' ') &&
                  number !== '' &&
                  parseInt(number, 10) >= 0

  return (
    <form className="clue-input" onSubmit={handleSubmit}>
      <div className="clue-fields">
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value.toUpperCase())}
          placeholder="ONE WORD CLUE"
          className="clue-word-input"
          disabled={disabled}
          autoFocus
        />
        <select
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          className="clue-number-input"
          disabled={disabled}
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
        disabled={disabled || !isValid}
      >
        Give Clue
      </button>

      <p className="clue-hint">
        One word only, no numbers or parts of board words
      </p>
    </form>
  )
}
