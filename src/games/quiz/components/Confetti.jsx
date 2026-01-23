import { useEffect, useState } from 'react'
import './Confetti.css'

const COLORS = [
  '#ffd700', // Gold
  '#1a237e', // Blue
  '#ffffff', // White
  '#00c853', // Green
  '#ff9800', // Orange
]

const SHAPES = ['square', 'circle', 'rectangle']

function createPiece(index) {
  return {
    id: index,
    left: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    delay: Math.random() * 3,
    duration: 2 + Math.random() * 2,
    size: 6 + Math.random() * 8,
  }
}

export function Confetti({
  active = true,
  pieceCount = 50,
  duration = 4000
}) {
  const [pieces, setPieces] = useState([])
  const [visible, setVisible] = useState(active)

  useEffect(() => {
    if (active) {
      setVisible(true)
      setPieces(Array.from({ length: pieceCount }, (_, i) => createPiece(i)))

      const timeout = setTimeout(() => {
        setVisible(false)
      }, duration)

      return () => clearTimeout(timeout)
    }
  }, [active, pieceCount, duration])

  if (!visible) return null

  return (
    <div className="quiz-confetti">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className={`quiz-confetti__piece quiz-confetti__piece--${piece.shape}`}
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            width: piece.size,
            height: piece.shape === 'rectangle' ? piece.size * 1.5 : piece.size,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
