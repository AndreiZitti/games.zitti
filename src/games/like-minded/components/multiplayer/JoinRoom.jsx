import { useState } from 'react'
import { motion } from 'framer-motion'

export function JoinRoom({
  onJoinRoom,
  onBack,
  loading,
  error,
  savedName,
  initialCode
}) {
  const [name, setName] = useState(savedName || '')
  const [code, setCode] = useState(initialCode || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim() && code.trim()) {
      onJoinRoom(code.trim().toUpperCase(), name.trim())
    }
  }

  return (
    <motion.div
      className="screen join-room-mp"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button className="btn-back" onClick={onBack}>
        &larr; Back
      </button>

      <motion.h1
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        Join Room
      </motion.h1>
      <motion.p
        className="subtitle"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Enter the room code to join
      </motion.p>

      {error && (
        <motion.div
          className="error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.div>
      )}

      <motion.form
        onSubmit={handleSubmit}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="input-group">
          <label>Room Code</label>
          <input
            type="text"
            className="code-input"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="XXXX"
            maxLength={4}
            autoFocus={!initialCode}
            disabled={loading}
          />
        </div>

        <div className="input-group">
          <label>Your Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            autoFocus={!!initialCode}
            disabled={loading}
          />
        </div>

        <div className="button-group">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!name.trim() || !code.trim() || loading}
          >
            {loading ? 'Joining...' : 'Join Room'}
          </button>
        </div>
      </motion.form>
    </motion.div>
  )
}
