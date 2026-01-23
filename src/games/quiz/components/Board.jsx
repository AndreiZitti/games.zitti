import { useState, useRef, useEffect } from 'react'

export function Board({
  room,
  categories,
  isPicker,
  onSelectQuestion,
  isHost,
  onEndGame
}) {
  const values = [100, 200, 300, 400, 500]
  const [activeColumn, setActiveColumn] = useState(0)
  const trackRef = useRef(null)

  const getQuestion = (catIndex, valueIndex) => {
    const index = catIndex * 5 + valueIndex
    return room.board[index]
  }

  const pickerPlayer = room.players.find(p => p.id === room.picker_id)
  const pickerName = pickerPlayer?.name || 'Someone'

  // Sort players by score for mini scoreboard
  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score)

  // Handle scroll to update active column indicator
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const handleScroll = () => {
      const scrollLeft = track.scrollLeft
      const columnWidth = track.offsetWidth / 2
      const newActive = Math.round(scrollLeft / columnWidth)
      setActiveColumn(Math.min(newActive, categories.length - 1))
    }
    track.addEventListener('scroll', handleScroll, { passive: true })
    return () => track.removeEventListener('scroll', handleScroll)
  }, [categories.length])

  // Scroll to a specific column when dot is clicked
  const scrollToColumn = (index) => {
    const track = trackRef.current
    if (!track) return
    const columnWidth = track.offsetWidth / 2
    track.scrollTo({ left: index * columnWidth, behavior: 'smooth' })
  }

  // Shared tile renderer for both desktop and mobile layouts
  const renderTile = (catIndex, valueIndex, value) => {
    const question = getQuestion(catIndex, valueIndex)
    const isUsed = question?.used
    return (
      <button
        key={`${catIndex}-${valueIndex}`}
        className={`board-tile ${isUsed ? 'board-tile--used' : ''} ${isPicker && !isUsed ? 'board-tile--selectable' : ''}`}
        onClick={() => { if (isPicker && !isUsed) onSelectQuestion(question.index) }}
        disabled={isUsed || !isPicker}
      >
        <span className="board-tile__value">{value}</span>
      </button>
    )
  }

  return (
    <div className="screen quiz-board quiz-game">
      <div className="board-header">
        <h2>Quiz</h2>
        <p className={`picker-status ${isPicker ? 'picker-status--you' : 'picker-status--other'}`}>
          {isPicker ? '✨ Your turn to pick!' : `${pickerName} is picking...`}
        </p>
      </div>

      <div className="scoreboard-mini">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            className={`mini-score ${index === 0 ? 'mini-score--leader' : ''}`}
          >
            {index === 0 && <span className="mini-score__crown">👑</span>}
            <span className="mini-score__rank">{index + 1}.</span>
            <span className="mini-score__name" title={player.name}>{player.name}</span>
            <span className="mini-score__score">{player.score}</span>
          </div>
        ))}
      </div>

      {/* Desktop Grid */}
      <div className="board-grid">
        {/* Category headers */}
        <div className="board-row board-row--categories">
          {categories.map((cat, i) => (
            <div key={i} className="category-header">
              {cat}
            </div>
          ))}
        </div>

        {/* Value rows */}
        {values.map((value, valueIndex) => (
          <div key={value} className="board-row">
            {categories.map((_, catIndex) => renderTile(catIndex, valueIndex, value))}
          </div>
        ))}
      </div>

      {/* Mobile Carousel */}
      <div className="board-carousel">
        <div className="board-carousel__track" ref={trackRef}>
          {categories.map((cat, catIndex) => (
            <div key={catIndex} className="board-carousel__column">
              <div className="category-header">{cat}</div>
              {values.map((value, valueIndex) => renderTile(catIndex, valueIndex, value))}
            </div>
          ))}
        </div>
        <div className="board-carousel__indicators">
          {categories.map((_, index) => (
            <button
              key={index}
              className={`board-carousel__dot ${index === activeColumn ? 'board-carousel__dot--active' : ''}`}
              onClick={() => scrollToColumn(index)}
              aria-label={`Go to category ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {isHost && (
        <div className="board-actions">
          <button className="btn btn-danger" onClick={onEndGame}>
            End Game
          </button>
        </div>
      )}
    </div>
  )
}
