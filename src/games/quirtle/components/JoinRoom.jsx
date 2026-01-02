import { useState } from 'react'

export function JoinRoom({ onBack, onJoinRoom, loading, error, savedName }) {
  const [name, setName] = useState(savedName || '')
  const [code, setCode] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim() && code.trim()) {
      onJoinRoom(code.trim().toUpperCase(), name.trim())
    }
  }

  return (
    <div className="quirtle-game quirtle-join-room">
      <button className="btn-back" onClick={onBack}>
        &larr; Back
      </button>

      <h1>Join Room</h1>
      <p className="subtitle">Enter a room code to join</p>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="code">Room Code</label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCD1"
            maxLength={5}
            autoFocus
            autoComplete="off"
            style={{ textTransform: 'uppercase', letterSpacing: '0.2em', textAlign: 'center' }}
          />
        </div>

        <div className="input-group">
          <label htmlFor="name">Your Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            autoComplete="off"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={!name.trim() || !code.trim() || loading}
          style={{ width: '100%' }}
        >
          {loading ? 'Joining...' : 'Join Room'}
        </button>
      </form>
    </div>
  )
}
