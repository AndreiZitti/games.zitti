import { useState } from 'react'

export function JoinRoom({ onBack, onJoinRoom, loading, error, savedName, initialCode }) {
  const [code, setCode] = useState(initialCode || '')
  const [name, setName] = useState(savedName || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (code.trim() && name.trim()) {
      onJoinRoom(code.trim().toUpperCase(), name.trim())
    }
  }

  return (
    <div className="screen codenames-join">
      <button className="btn-back" onClick={onBack}>
        &larr; Back
      </button>

      <h2>Join Room</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="code">Room Code</label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter room code"
            autoFocus
            maxLength={5}
            style={{ textTransform: 'uppercase' }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="name">Your Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
          />
        </div>

        {error && <p className="error">{error}</p>}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !code.trim() || !name.trim()}
        >
          {loading ? 'Joining...' : 'Join Room'}
        </button>
      </form>
    </div>
  )
}
