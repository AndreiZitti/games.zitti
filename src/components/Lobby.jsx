import { useState } from 'react'

const SAMPLE_CATEGORIES = [
  "How spicy do you like your food?",
  "How much do you enjoy mornings?",
  "How adventurous are you?",
  "How much do you like small talk?",
  "How organized is your desk?",
  "How likely are you to cry at movies?",
  "How comfortable are you with public speaking?",
  "How much do you enjoy cooking?",
  "How patient are you in traffic?",
  "How often do you exercise?"
]

export function Lobby({ room, isHost, onSetCategory, onStartRound, onLeave }) {
  const [category, setCategory] = useState(room.category || '')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleCategoryChange = (value) => {
    setCategory(value)
    onSetCategory(value)
  }

  const handleSuggestionClick = (suggestion) => {
    handleCategoryChange(suggestion)
    setShowSuggestions(false)
  }

  const canStart = room.players.length >= 2 && category.trim()

  return (
    <div className="screen lobby">
      <button className="btn-back" onClick={onLeave}>&larr; Leave</button>

      <div className="room-code-display">
        <span className="label">Room Code</span>
        <span className="code">{room.code}</span>
      </div>

      <div className="players-list">
        <h3>Players ({room.players.length})</h3>
        <ul>
          {room.players.map((player, index) => (
            <li key={player.id}>
              {player.name}
              {index === 0 && <span className="host-badge">Host</span>}
            </li>
          ))}
        </ul>
      </div>

      {isHost ? (
        <div className="host-controls">
          <div className="input-group">
            <label htmlFor="category">Category</label>
            <input
              id="category"
              type="text"
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              placeholder="Enter a category..."
              autoComplete="off"
            />
            <button
              type="button"
              className="btn btn-small"
              onClick={() => setShowSuggestions(!showSuggestions)}
            >
              {showSuggestions ? 'Hide' : 'Suggestions'}
            </button>
          </div>

          {showSuggestions && (
            <div className="suggestions">
              {SAMPLE_CATEGORIES.map((cat, i) => (
                <button
                  key={i}
                  className="suggestion-chip"
                  onClick={() => handleSuggestionClick(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={onStartRound}
            disabled={!canStart}
          >
            {room.players.length < 2
              ? 'Waiting for players...'
              : !category.trim()
              ? 'Enter a category to start'
              : 'Start Round'}
          </button>
        </div>
      ) : (
        <div className="waiting-state">
          {room.category ? (
            <div className="category-preview">
              <span className="label">Category</span>
              <span className="value">{room.category}</span>
            </div>
          ) : (
            <p>Waiting for host to set a category...</p>
          )}
        </div>
      )}
    </div>
  )
}
