import { useState } from 'react'

export function CreateRoom({ onBack, onCreateRoom, loading, error, savedName }) {
  const [name, setName] = useState(savedName || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim()) {
      onCreateRoom(name.trim())
    }
  }

  return (
    <div className="screen codenames-create">
      <button className="btn-back" onClick={onBack}>
        &larr; Back
      </button>

      <h2>Create Room</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Your Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            autoFocus
            maxLength={20}
          />
        </div>

        {error && <p className="error">{error}</p>}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !name.trim()}
        >
          {loading ? 'Creating...' : 'Create Room'}
        </button>
      </form>
    </div>
  )
}
