import { useState } from 'react'
import { useRoom } from './hooks/useRoom'
import { Home } from './components/Home'
import { CreateRoom } from './components/CreateRoom'
import { JoinRoom } from './components/JoinRoom'
import { Lobby } from './components/Lobby'
import { NumberReveal } from './components/NumberReveal'
import { HiddenScreen } from './components/HiddenScreen'
import { RevealScreen } from './components/RevealScreen'
import { GameBoard } from './components/GameBoard'

// Screen states: 'home' | 'create' | 'join' | 'game'
function App() {
  const [screen, setScreen] = useState('home')
  const {
    room,
    loading,
    error,
    playerId,
    currentPlayer,
    isHost,
    createRoom,
    joinRoom,
    setCategory,
    setMode,
    startRound,
    toggleHidden,
    updateSlot,
    confirmPosition,
    nextRound,
    leaveRoom
  } = useRoom()

  // Handle room creation
  const handleCreateRoom = async (name) => {
    const newRoom = await createRoom(name)
    if (newRoom) {
      setScreen('game')
    }
  }

  // Handle joining room
  const handleJoinRoom = async (code, name) => {
    const joinedRoom = await joinRoom(code, name)
    if (joinedRoom) {
      setScreen('game')
    }
  }

  // Handle leaving
  const handleLeave = () => {
    leaveRoom()
    setScreen('home')
  }

  // Render home screen
  if (screen === 'home') {
    return (
      <Home
        onCreateRoom={() => setScreen('create')}
        onJoinRoom={() => setScreen('join')}
      />
    )
  }

  // Render create room screen
  if (screen === 'create') {
    return (
      <CreateRoom
        onBack={() => setScreen('home')}
        onCreateRoom={handleCreateRoom}
        loading={loading}
        error={error}
      />
    )
  }

  // Render join room screen
  if (screen === 'join') {
    return (
      <JoinRoom
        onBack={() => setScreen('home')}
        onJoinRoom={handleJoinRoom}
        loading={loading}
        error={error}
      />
    )
  }

  // Game screens (based on room phase)
  if (screen === 'game' && room) {
    // Lobby phase
    if (room.phase === 'lobby') {
      return (
        <Lobby
          room={room}
          isHost={isHost}
          onSetCategory={setCategory}
          onSetMode={setMode}
          onStartRound={startRound}
          onLeave={handleLeave}
        />
      )
    }

    // Playing/Confirming phases
    if (room.phase === 'playing' || room.phase === 'confirming') {
      const isRemoteMode = room.mode === 'remote'

      // Remote mode - show the game board
      if (isRemoteMode) {
        return (
          <GameBoard
            players={room.players}
            currentPlayer={currentPlayer}
            playerId={playerId}
            category={room.category}
            phase={room.phase}
            isHost={isHost}
            onUpdateSlot={updateSlot}
            onToggleHidden={toggleHidden}
            onConfirm={confirmPosition}
            onNextRound={nextRound}
            onLeave={handleLeave}
          />
        )
      }

      // Table mode - show number or hidden screen based on player's hidden state
      const playersConfirmed = room.players.filter(p => p.confirmed).length

      if (currentPlayer && !currentPlayer.hidden) {
        return (
          <NumberReveal
            number={currentPlayer.number}
            category={room.category}
            onHide={toggleHidden}
          />
        )
      }

      return (
        <HiddenScreen
          category={room.category}
          confirmed={currentPlayer?.confirmed}
          onPeek={toggleHidden}
          onConfirm={confirmPosition}
          playersConfirmed={playersConfirmed}
          totalPlayers={room.players.length}
        />
      )
    }

    // Revealed phase
    if (room.phase === 'revealed') {
      // In remote mode, show the board with revealed numbers
      if (room.mode === 'remote') {
        return (
          <GameBoard
            players={room.players}
            currentPlayer={currentPlayer}
            playerId={playerId}
            category={room.category}
            phase={room.phase}
            isHost={isHost}
            onUpdateSlot={updateSlot}
            onToggleHidden={toggleHidden}
            onConfirm={confirmPosition}
            onNextRound={nextRound}
            onLeave={handleLeave}
          />
        )
      }

      return (
        <RevealScreen
          room={room}
          isHost={isHost}
          onNextRound={nextRound}
          onLeave={handleLeave}
        />
      )
    }
  }

  // Fallback
  return (
    <div className="screen">
      <p>Loading...</p>
    </div>
  )
}

export default App
