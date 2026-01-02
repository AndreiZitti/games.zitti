import { useState, useEffect } from 'react'
import './quirtle.css'
import { useQuirtleRoom } from './hooks/useQuirtleRoom'
import { CreateRoom } from './components/CreateRoom'
import { JoinRoom } from './components/JoinRoom'
import { Lobby } from './components/Lobby'
import { GameScreen } from './components/GameScreen'
import { EndScreen } from './components/EndScreen'

export function QuirtleGame({ onBack }) {
  const [screen, setScreen] = useState('home')
  const [pendingRoomCode, setPendingRoomCode] = useState(null)

  const {
    room,
    loading,
    error,
    playerId,
    currentPlayer,
    isHost,
    isMyTurn,
    savedName,
    tryRejoin,
    createRoom,
    joinRoom,
    startGame,
    placeTiles,
    swapTiles,
    playAgain,
    leaveRoom,
    hasValidMoves
  } = useQuirtleRoom()

  // Try to rejoin on mount
  useEffect(() => {
    const attemptRejoin = async () => {
      const result = await tryRejoin()
      if (result) {
        if (result.needsJoin) {
          setPendingRoomCode(result.code)
          setScreen('join')
        } else {
          setScreen('game')
        }
      }
    }
    attemptRejoin()
  }, [tryRejoin])

  const handleCreateRoom = async (name) => {
    const newRoom = await createRoom(name)
    if (newRoom) setScreen('game')
  }

  const handleJoinRoom = async (code, name) => {
    const joined = await joinRoom(code, name)
    if (joined) setScreen('game')
  }

  const handleLeave = () => {
    leaveRoom()
    setScreen('home')
  }

  const handleBackToHub = () => {
    leaveRoom()
    onBack()
  }

  // Home screen
  if (screen === 'home') {
    return (
      <div className="quirtle-game quirtle-home">
        <button className="btn-back" onClick={onBack}>
          &larr; Back to Games
        </button>

        <h1>QUIRTLE</h1>
        <p className="subtitle">Match colors and shapes to score points!</p>

        <div className="how-to-play">
          <ul>
            <li>Place tiles to form lines of matching colors OR shapes</li>
            <li>Score points equal to the length of lines you create</li>
            <li>Complete a line of 6 for bonus points (Qwirkle!)</li>
            <li>First to empty their hand when the bag is empty wins!</li>
          </ul>
        </div>

        <div className="button-group">
          <button className="btn btn-primary" onClick={() => setScreen('create')}>
            Create Room
          </button>
          <button className="btn btn-secondary" onClick={() => setScreen('join')}>
            Join Room
          </button>
        </div>
      </div>
    )
  }

  // Create room screen
  if (screen === 'create') {
    return (
      <CreateRoom
        onBack={() => setScreen('home')}
        onCreateRoom={handleCreateRoom}
        loading={loading}
        error={error}
        savedName={savedName}
      />
    )
  }

  // Join room screen
  if (screen === 'join') {
    return (
      <JoinRoom
        onBack={() => setScreen('home')}
        onJoinRoom={handleJoinRoom}
        loading={loading}
        error={error}
        savedName={savedName}
        initialRoomCode={pendingRoomCode}
      />
    )
  }

  // Game screens
  if (screen === 'game' && room) {
    if (room.phase === 'lobby') {
      return (
        <Lobby
          room={room}
          isHost={isHost}
          onStartGame={startGame}
          onLeave={handleLeave}
        />
      )
    }

    if (room.phase === 'playing') {
      return (
        <GameScreen
          room={room}
          playerId={playerId}
          currentPlayer={currentPlayer}
          isMyTurn={isMyTurn}
          onPlaceTiles={placeTiles}
          onSwapTiles={swapTiles}
          onLeave={handleLeave}
          hasValidMoves={hasValidMoves}
        />
      )
    }

    if (room.phase === 'ended') {
      return (
        <EndScreen
          room={room}
          isHost={isHost}
          onPlayAgain={playAgain}
          onLeave={handleBackToHub}
        />
      )
    }
  }

  return (
    <div className="quirtle-game quirtle-loading">
      <p>Loading...</p>
    </div>
  )
}
