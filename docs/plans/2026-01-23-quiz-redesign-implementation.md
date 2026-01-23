# Quiz Game Redesign - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the quiz game with a classic game show aesthetic, full mobile responsiveness, and polished animations.

**Architecture:** Update CSS design system with game show theme colors. Create reusable animation components (Timer, Confetti). Redesign each screen component with new layout and mobile-first responsive approach using CSS Grid/Flexbox and Framer Motion.

**Tech Stack:** React 19, Next.js 16, Framer Motion, CSS custom properties, Playwright (Python) for visual testing

---

## Phase 1: Design System Foundation

### Task 1: Update Quiz CSS Variables

**Files:**
- Modify: `src/games/quiz/quiz.css:1-50`

**Step 1: Replace the CSS variables section with game show theme**

Replace the top of `quiz.css` with:

```css
/* Quiz Game Styles - Game Show Theme */

/* ===== DESIGN SYSTEM ===== */
.quiz-game {
  /* Game Show Color Palette */
  --quiz-primary: #1a237e;          /* Deep royal blue - board bg */
  --quiz-primary-light: #283593;    /* Lighter blue for hover */
  --quiz-primary-dark: #0d1442;     /* Darker for depth */

  --quiz-gold: #ffd700;             /* Gold - points, accents */
  --quiz-gold-dim: #b8960b;         /* Muted gold */
  --quiz-gold-glow: rgba(255, 215, 0, 0.4);

  --quiz-correct: #00c853;          /* Emerald green */
  --quiz-correct-glow: rgba(0, 200, 83, 0.3);
  --quiz-wrong: #ff1744;            /* Ruby red */
  --quiz-wrong-glow: rgba(255, 23, 68, 0.3);

  --quiz-surface: #0d1b2a;          /* Dark navy surface */
  --quiz-surface-light: #1b2838;    /* Elevated surface */
  --quiz-surface-glow: rgba(26, 35, 126, 0.5);

  --quiz-text: #ffffff;
  --quiz-text-dim: #a0aec0;
  --quiz-text-muted: #718096;

  --quiz-border: rgba(255, 255, 255, 0.1);
  --quiz-border-gold: rgba(255, 215, 0, 0.3);

  /* Typography */
  --quiz-font-display: 'Oswald', 'Arial Narrow', sans-serif;
  --quiz-font-body: 'Inter', -apple-system, sans-serif;
  --quiz-font-mono: 'JetBrains Mono', 'Courier New', monospace;

  /* Spacing */
  --quiz-radius-sm: 6px;
  --quiz-radius-md: 10px;
  --quiz-radius-lg: 16px;

  /* Shadows */
  --quiz-shadow-tile: 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  --quiz-shadow-glow: 0 0 20px var(--quiz-gold-glow);

  /* Transitions */
  --quiz-transition-fast: 150ms ease;
  --quiz-transition-normal: 250ms ease;
  --quiz-transition-slow: 400ms ease;
}
```

**Step 2: Add wrapper class to QuizGame.jsx**

In `src/games/quiz/QuizGame.jsx`, wrap the return with a div:

Find the first `return` in the home screen section (~line 87-116) and all other returns - wrap each screen div with:

```jsx
// Change: <div className="screen quiz-home">
// To: <div className="quiz-game"><div className="screen quiz-home">
// And add closing </div> at the end
```

Actually, simpler approach - wrap at component level. At line 87, change:

```jsx
// Before the first return, add a wrapper component approach
// For now, just add the class to the outermost element by using a wrapper
```

Better: Add `.quiz-game` to each screen's class list for now. We'll refactor later.

**Step 3: Verify variables load**

Run: `npm run dev`
Navigate to: `http://localhost:3000/games/quiz`
Expected: Page loads without CSS errors

**Step 4: Commit**

```bash
git add src/games/quiz/quiz.css
git commit -m "feat(quiz): add game show design system variables"
```

---

### Task 2: Create Timer Component

**Files:**
- Create: `src/games/quiz/components/Timer.jsx`
- Create: `src/games/quiz/components/Timer.css`

**Step 1: Create Timer.css**

```css
/* Timer Component - Circular countdown with ring animation */

.quiz-timer {
  position: relative;
  width: 80px;
  height: 80px;
}

.quiz-timer svg {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
}

.quiz-timer__bg {
  fill: none;
  stroke: var(--quiz-surface-light, #1b2838);
  stroke-width: 6;
}

.quiz-timer__ring {
  fill: none;
  stroke: var(--quiz-gold, #ffd700);
  stroke-width: 6;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s linear, stroke 0.3s ease;
}

.quiz-timer__ring--warning {
  stroke: #ff9800;
}

.quiz-timer__ring--critical {
  stroke: var(--quiz-wrong, #ff1744);
  animation: timer-pulse 0.5s ease-in-out infinite;
}

@keyframes timer-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.quiz-timer__text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: var(--quiz-font-mono, monospace);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--quiz-text, white);
}

.quiz-timer--critical .quiz-timer__text {
  color: var(--quiz-wrong, #ff1744);
  animation: timer-pulse 0.5s ease-in-out infinite;
}

/* Size variants */
.quiz-timer--small {
  width: 48px;
  height: 48px;
}

.quiz-timer--small .quiz-timer__text {
  font-size: 1rem;
}

.quiz-timer--large {
  width: 100px;
  height: 100px;
}

.quiz-timer--large .quiz-timer__text {
  font-size: 2rem;
}
```

**Step 2: Create Timer.jsx**

```jsx
import './Timer.css'

export function Timer({
  seconds,
  maxSeconds = 60,
  size = 'medium',
  warningAt = 30,
  criticalAt = 10
}) {
  // Calculate ring progress
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const progress = seconds / maxSeconds
  const offset = circumference * (1 - progress)

  // Determine state
  const isCritical = seconds <= criticalAt
  const isWarning = seconds <= warningAt && !isCritical

  const ringClass = [
    'quiz-timer__ring',
    isWarning && 'quiz-timer__ring--warning',
    isCritical && 'quiz-timer__ring--critical'
  ].filter(Boolean).join(' ')

  const containerClass = [
    'quiz-timer',
    `quiz-timer--${size}`,
    isCritical && 'quiz-timer--critical'
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClass}>
      <svg viewBox="0 0 80 80">
        <circle
          className="quiz-timer__bg"
          cx="40"
          cy="40"
          r={radius}
        />
        <circle
          className={ringClass}
          cx="40"
          cy="40"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="quiz-timer__text">{seconds}</span>
    </div>
  )
}
```

**Step 3: Test Timer in isolation**

Temporarily add to QuizGame.jsx after imports:

```jsx
import { Timer } from './components/Timer'
```

And in the home screen return, add temporarily:

```jsx
<Timer seconds={45} maxSeconds={60} />
<Timer seconds={25} maxSeconds={60} />
<Timer seconds={5} maxSeconds={60} />
```

Run: `npm run dev`
Navigate to: `http://localhost:3000/games/quiz`
Expected: Three timer rings visible - gold, orange, red pulsing

**Step 4: Remove test code and commit**

Remove the test Timer components from QuizGame.jsx.

```bash
git add src/games/quiz/components/Timer.jsx src/games/quiz/components/Timer.css
git commit -m "feat(quiz): add circular Timer component with ring animation"
```

---

### Task 3: Create Confetti Component

**Files:**
- Create: `src/games/quiz/components/Confetti.jsx`
- Create: `src/games/quiz/components/Confetti.css`

**Step 1: Create Confetti.css**

```css
/* Confetti celebration animation */

.quiz-confetti {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 1000;
}

.quiz-confetti__piece {
  position: absolute;
  width: 10px;
  height: 10px;
  top: -20px;
  animation: confetti-fall linear forwards;
}

@keyframes confetti-fall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

/* Different shapes */
.quiz-confetti__piece--square {
  border-radius: 2px;
}

.quiz-confetti__piece--circle {
  border-radius: 50%;
}

.quiz-confetti__piece--rectangle {
  width: 6px;
  height: 14px;
  border-radius: 2px;
}
```

**Step 2: Create Confetti.jsx**

```jsx
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
```

**Step 3: Commit**

```bash
git add src/games/quiz/components/Confetti.jsx src/games/quiz/components/Confetti.css
git commit -m "feat(quiz): add Confetti celebration component"
```

---

## Phase 2: Core Game Screens

### Task 4: Redesign Board - Desktop Layout

**Files:**
- Modify: `src/games/quiz/components/Board.jsx`
- Modify: `src/games/quiz/quiz.css` (board section)

**Step 1: Update Board CSS with game show styling**

Replace the `/* ===== BOARD ===== */` section in `quiz.css` with:

```css
/* ===== BOARD ===== */
.quiz-board {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 100vh;
  min-height: 100dvh;
  background: linear-gradient(180deg, var(--quiz-primary-dark, #0d1442) 0%, var(--quiz-surface, #0d1b2a) 100%);
}

.board-header {
  text-align: center;
  padding: 0.5rem 0;
}

.board-header h2 {
  font-family: var(--quiz-font-display, 'Oswald', sans-serif);
  font-size: 1.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--quiz-gold, #ffd700);
  text-shadow: 0 2px 8px var(--quiz-gold-glow, rgba(255, 215, 0, 0.4));
  margin-bottom: 0.25rem;
}

.picker-status {
  font-size: 1rem;
  font-weight: 500;
}

.picker-status--you {
  color: var(--quiz-gold, #ffd700);
  animation: pulse-glow 2s ease-in-out infinite;
}

.picker-status--other {
  color: var(--quiz-text-dim, #a0aec0);
}

@keyframes pulse-glow {
  0%, 100% { text-shadow: 0 0 8px var(--quiz-gold-glow); }
  50% { text-shadow: 0 0 16px var(--quiz-gold-glow), 0 0 24px var(--quiz-gold-glow); }
}

/* Mini Scoreboard */
.scoreboard-mini {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.75rem 1rem;
  background: var(--quiz-surface, #0d1b2a);
  border-radius: var(--quiz-radius-lg, 16px);
  border: 1px solid var(--quiz-border, rgba(255, 255, 255, 0.1));
}

.mini-score {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: var(--quiz-radius-md, 10px);
  background: var(--quiz-surface-light, #1b2838);
}

.mini-score--leader {
  border: 1px solid var(--quiz-gold, #ffd700);
  box-shadow: 0 0 8px var(--quiz-gold-glow);
}

.mini-score__crown {
  font-size: 0.9rem;
}

.mini-score__rank {
  color: var(--quiz-text-muted, #718096);
  font-size: 0.8rem;
  min-width: 1.25rem;
}

.mini-score__name {
  font-weight: 600;
  color: var(--quiz-text, white);
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mini-score__score {
  font-family: var(--quiz-font-mono, monospace);
  font-weight: 700;
  color: var(--quiz-gold, #ffd700);
}

/* Board Grid */
.board-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.board-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.5rem;
}

.board-row--categories {
  margin-bottom: 0.25rem;
}

/* Category Headers */
.category-header {
  background: linear-gradient(180deg, var(--quiz-primary, #1a237e) 0%, var(--quiz-primary-dark, #0d1442) 100%);
  color: var(--quiz-text, white);
  padding: 0.75rem 0.25rem;
  border-radius: var(--quiz-radius-md, 10px);
  text-align: center;
  font-family: var(--quiz-font-display, 'Oswald', sans-serif);
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border: 1px solid var(--quiz-border, rgba(255, 255, 255, 0.1));
  box-shadow: var(--quiz-shadow-tile);
}

/* Board Tiles */
.board-tile {
  aspect-ratio: 1.4;
  background: linear-gradient(180deg, var(--quiz-primary, #1a237e) 0%, var(--quiz-primary-dark, #0d1442) 100%);
  border: 2px solid var(--quiz-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--quiz-radius-md, 10px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--quiz-font-display, 'Oswald', sans-serif);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--quiz-gold, #ffd700);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  cursor: default;
  transition: all var(--quiz-transition-fast, 150ms);
  box-shadow: var(--quiz-shadow-tile);
  position: relative;
  overflow: hidden;
}

/* Inner glow effect */
.board-tile::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(255, 215, 0, 0.1) 0%, transparent 70%);
  opacity: 0;
  transition: opacity var(--quiz-transition-fast);
}

.board-tile--selectable {
  cursor: pointer;
}

.board-tile--selectable:hover {
  transform: scale(1.05);
  border-color: var(--quiz-gold, #ffd700);
  box-shadow: var(--quiz-shadow-tile), var(--quiz-shadow-glow);
}

.board-tile--selectable:hover::before {
  opacity: 1;
}

.board-tile--selectable:active {
  transform: scale(0.98);
}

.board-tile--used {
  background: var(--quiz-surface, #0d1b2a);
  border-color: transparent;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.5);
}

.board-tile--used .board-tile__value {
  display: none;
}

/* Board Actions */
.board-actions {
  display: flex;
  justify-content: center;
  padding-top: 1rem;
}
```

**Step 2: Update Board.jsx component**

```jsx
export function Board({
  room,
  categories,
  isPicker,
  onSelectQuestion,
  isHost,
  onEndGame
}) {
  const values = [100, 200, 300, 400, 500]

  const getQuestion = (catIndex, valueIndex) => {
    const index = catIndex * 5 + valueIndex
    return room.board[index]
  }

  const pickerPlayer = room.players.find(p => p.id === room.picker_id)
  const pickerName = pickerPlayer?.name || 'Someone'

  // Sort players by score for mini scoreboard
  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score)

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
            <span className="mini-score__name">{player.name}</span>
            <span className="mini-score__score">{player.score}</span>
          </div>
        ))}
      </div>

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
            {categories.map((_, catIndex) => {
              const question = getQuestion(catIndex, valueIndex)
              const isUsed = question?.used

              return (
                <button
                  key={`${catIndex}-${valueIndex}`}
                  className={`board-tile ${isUsed ? 'board-tile--used' : ''} ${isPicker && !isUsed ? 'board-tile--selectable' : ''}`}
                  onClick={() => {
                    if (isPicker && !isUsed) {
                      onSelectQuestion(question.index)
                    }
                  }}
                  disabled={isUsed || !isPicker}
                >
                  <span className="board-tile__value">{value}</span>
                </button>
              )
            })}
          </div>
        ))}
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
```

**Step 3: Test board appearance**

Run: `npm run dev`
Create a room, select a pack, start game
Expected: Board shows with blue gradient, gold values, hover effects work

**Step 4: Commit**

```bash
git add src/games/quiz/components/Board.jsx src/games/quiz/quiz.css
git commit -m "feat(quiz): redesign Board with game show theme"
```

---

### Task 5: Add Board Mobile Carousel

**Files:**
- Modify: `src/games/quiz/components/Board.jsx`
- Modify: `src/games/quiz/quiz.css`

**Step 1: Add mobile CSS for board carousel**

Add to the bottom of the board section in `quiz.css`:

```css
/* ===== BOARD MOBILE ===== */
@media (max-width: 640px) {
  .quiz-board {
    padding: 0.75rem;
    gap: 0.75rem;
  }

  .board-header h2 {
    font-size: 1.25rem;
  }

  .scoreboard-mini {
    padding: 0.5rem;
    gap: 0.5rem;
  }

  .mini-score {
    padding: 0.25rem 0.5rem;
    font-size: 0.85rem;
  }

  .mini-score__name {
    max-width: 60px;
  }

  /* Carousel container */
  .board-carousel {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    overflow: hidden;
  }

  .board-carousel__track {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    gap: 0.75rem;
    padding: 0 0.5rem;
  }

  .board-carousel__track::-webkit-scrollbar {
    display: none;
  }

  .board-carousel__column {
    flex: 0 0 calc(50% - 0.375rem);
    scroll-snap-align: start;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .board-carousel__column .category-header {
    font-size: 0.8rem;
    padding: 0.6rem 0.25rem;
  }

  .board-carousel__column .board-tile {
    aspect-ratio: 1.2;
    font-size: 1.25rem;
  }

  /* Carousel indicators */
  .board-carousel__indicators {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem 0;
  }

  .board-carousel__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--quiz-surface-light, #1b2838);
    border: none;
    padding: 0;
    cursor: pointer;
    transition: all var(--quiz-transition-fast);
  }

  .board-carousel__dot--active {
    background: var(--quiz-gold, #ffd700);
    transform: scale(1.25);
  }

  /* Hide desktop grid on mobile */
  .board-grid {
    display: none;
  }

  .board-carousel {
    display: flex;
  }
}

/* Desktop: show grid, hide carousel */
@media (min-width: 641px) {
  .board-carousel {
    display: none;
  }
}
```

**Step 2: Update Board.jsx with mobile carousel**

```jsx
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
  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score)

  // Handle scroll to update active indicator
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

  const scrollToColumn = (index) => {
    const track = trackRef.current
    if (!track) return
    const columnWidth = track.offsetWidth / 2
    track.scrollTo({ left: index * columnWidth, behavior: 'smooth' })
  }

  // Render tile for both layouts
  const renderTile = (catIndex, valueIndex, value) => {
    const question = getQuestion(catIndex, valueIndex)
    const isUsed = question?.used

    return (
      <button
        key={`${catIndex}-${valueIndex}`}
        className={`board-tile ${isUsed ? 'board-tile--used' : ''} ${isPicker && !isUsed ? 'board-tile--selectable' : ''}`}
        onClick={() => {
          if (isPicker && !isUsed) {
            onSelectQuestion(question.index)
          }
        }}
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
            <span className="mini-score__name">{player.name}</span>
            <span className="mini-score__score">{player.score}</span>
          </div>
        ))}
      </div>

      {/* Desktop Grid */}
      <div className="board-grid">
        <div className="board-row board-row--categories">
          {categories.map((cat, i) => (
            <div key={i} className="category-header">{cat}</div>
          ))}
        </div>
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
```

**Step 3: Test mobile carousel**

Run: `npm run dev`
Open DevTools, toggle mobile view (iPhone/Android size)
Expected: Categories in horizontal scroll carousel, 2 visible at a time, swipe to see more, dots indicate position

**Step 4: Commit**

```bash
git add src/games/quiz/components/Board.jsx src/games/quiz/quiz.css
git commit -m "feat(quiz): add mobile carousel layout for Board"
```

---

### Task 6: Redesign QuestionRound

**Files:**
- Modify: `src/games/quiz/components/QuestionRound.jsx`
- Modify: `src/games/quiz/quiz.css`

**Step 1: Update QuestionRound CSS**

Replace the `/* ===== QUESTION ROUND ===== */` and `/* ===== MULTIPLE CHOICE OPTIONS ===== */` sections:

```css
/* ===== QUESTION ROUND ===== */
.quiz-question {
  min-height: 100vh;
  min-height: 100dvh;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: linear-gradient(180deg, var(--quiz-primary-dark, #0d1442) 0%, var(--quiz-surface, #0d1b2a) 100%);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.question-meta {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.question-meta__category {
  background: var(--quiz-primary, #1a237e);
  color: var(--quiz-text, white);
  padding: 0.4rem 0.75rem;
  border-radius: var(--quiz-radius-sm, 6px);
  font-family: var(--quiz-font-display, 'Oswald', sans-serif);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid var(--quiz-border, rgba(255, 255, 255, 0.1));
}

.question-meta__value {
  font-family: var(--quiz-font-display, 'Oswald', sans-serif);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--quiz-gold, #ffd700);
  text-shadow: 0 2px 8px var(--quiz-gold-glow);
}

.question-content {
  background: var(--quiz-surface, #0d1b2a);
  border: 1px solid var(--quiz-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--quiz-radius-lg, 16px);
  padding: 1.5rem;
  text-align: center;
  box-shadow: var(--quiz-shadow-tile);
}

.question-text {
  font-size: 1.25rem;
  line-height: 1.6;
  color: var(--quiz-text, white);
  margin: 0;
}

/* ===== ANSWER OPTIONS ===== */
.options-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.options-grid--boolean {
  grid-template-columns: repeat(2, 1fr);
  max-width: 400px;
  margin: 0 auto;
}

.option-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--quiz-surface, #0d1b2a);
  border: 2px solid var(--quiz-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--quiz-radius-md, 10px);
  cursor: pointer;
  transition: all var(--quiz-transition-fast);
  text-align: left;
  font-size: 1rem;
  color: var(--quiz-text, white);
  box-shadow: var(--quiz-shadow-tile);
}

.option-btn:hover:not(:disabled) {
  border-color: var(--quiz-gold, #ffd700);
  box-shadow: var(--quiz-shadow-tile), 0 0 12px var(--quiz-gold-glow);
  transform: translateY(-2px);
}

.option-btn--selected {
  background: var(--quiz-primary, #1a237e);
  border-color: var(--quiz-gold, #ffd700);
  box-shadow: var(--quiz-shadow-glow);
}

.option-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.option-letter {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--quiz-gold, #ffd700);
  color: var(--quiz-primary-dark, #0d1442);
  border-radius: var(--quiz-radius-sm, 6px);
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.option-btn--selected .option-letter {
  background: var(--quiz-gold, #ffd700);
}

.options-grid--boolean .option-letter {
  display: none;
}

.option-text {
  flex: 1;
  line-height: 1.4;
}

.options-grid--boolean .option-btn {
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 600;
  padding: 1.25rem;
}

/* Answer submitted state */
.answer-submitted {
  text-align: center;
  padding: 1.5rem;
  background: var(--quiz-surface, #0d1b2a);
  border: 2px solid var(--quiz-correct, #00c853);
  border-radius: var(--quiz-radius-lg, 16px);
  box-shadow: 0 0 16px var(--quiz-correct-glow);
}

.answer-submitted p {
  color: var(--quiz-correct, #00c853);
  font-weight: 500;
}

.answer-submitted__your-answer {
  margin-top: 0.5rem;
  color: var(--quiz-text-dim, #a0aec0);
  font-size: 0.9rem;
}

/* Answer status footer */
.answer-status {
  margin-top: auto;
  text-align: center;
  padding: 1rem;
  background: var(--quiz-surface, #0d1b2a);
  border-radius: var(--quiz-radius-lg, 16px);
  border: 1px solid var(--quiz-border);
}

.answer-status__text {
  color: var(--quiz-text-dim, #a0aec0);
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.answer-status__progress {
  height: 4px;
  background: var(--quiz-surface-light, #1b2838);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.answer-status__progress-bar {
  height: 100%;
  background: var(--quiz-correct, #00c853);
  transition: width 0.3s ease;
}

.answer-indicators {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.indicator {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--quiz-surface-light, #1b2838);
  border: 2px solid var(--quiz-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--quiz-text-dim, #a0aec0);
  transition: all 0.3s ease;
}

.indicator--answered {
  background: var(--quiz-correct, #00c853);
  border-color: var(--quiz-correct, #00c853);
  color: white;
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .quiz-question {
    padding: 0.75rem;
    gap: 1rem;
  }

  .question-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .question-meta {
    justify-content: center;
  }

  .question-content {
    padding: 1.25rem;
  }

  .question-text {
    font-size: 1.1rem;
  }

  .options-grid {
    grid-template-columns: 1fr;
  }

  .option-btn {
    padding: 1rem;
  }

  .indicator {
    width: 28px;
    height: 28px;
    font-size: 0.75rem;
  }
}
```

**Step 2: Update QuestionRound.jsx**

```jsx
import { useState } from 'react'
import { Timer } from './Timer'

export function QuestionRound({
  room,
  currentQuestion,
  timeRemaining,
  hasAnswered,
  onSubmitAnswer
}) {
  const [textAnswer, setTextAnswer] = useState('')
  const [selectedOption, setSelectedOption] = useState(null)

  const handleTextSubmit = (e) => {
    e.preventDefault()
    if (textAnswer.trim() && !hasAnswered) {
      onSubmitAnswer(textAnswer.trim())
      setTextAnswer('')
    }
  }

  const handleOptionSelect = (option) => {
    if (hasAnswered) return
    setSelectedOption(option)
    onSubmitAnswer(option)
  }

  const answeredCount = room.players.filter(p => p.hasAnswered).length
  const totalPlayers = room.players.length
  const progressPercent = (answeredCount / totalPlayers) * 100

  const questionType = currentQuestion.type || 'text'
  const isMultipleChoice = questionType === 'multiple' || questionType === 'boolean'

  return (
    <div className="screen quiz-question quiz-game">
      <div className="question-header">
        <div className="question-meta">
          <span className="question-meta__category">{currentQuestion.category}</span>
          <span className="question-meta__value">{currentQuestion.value}</span>
        </div>
        <Timer
          seconds={timeRemaining}
          maxSeconds={60}
          warningAt={30}
          criticalAt={10}
        />
      </div>

      <div className="question-content">
        <p className="question-text">{currentQuestion.question}</p>
      </div>

      {!hasAnswered ? (
        isMultipleChoice ? (
          <div className={`options-grid ${questionType === 'boolean' ? 'options-grid--boolean' : ''}`}>
            {currentQuestion.options?.map((option, index) => (
              <button
                key={index}
                className={`option-btn ${selectedOption === option ? 'option-btn--selected' : ''}`}
                onClick={() => handleOptionSelect(option)}
                disabled={hasAnswered}
              >
                <span className="option-letter">
                  {questionType === 'boolean' ? '' : String.fromCharCode(65 + index)}
                </span>
                <span className="option-text">{option}</span>
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleTextSubmit} className="answer-form">
            <input
              type="text"
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="Type your answer..."
              autoFocus
              maxLength={100}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!textAnswer.trim()}
            >
              Submit
            </button>
          </form>
        )
      ) : (
        <div className="answer-submitted">
          <p>Answer submitted!</p>
          {selectedOption && (
            <p className="answer-submitted__your-answer">
              Your answer: <strong>{selectedOption}</strong>
            </p>
          )}
        </div>
      )}

      <div className="answer-status">
        <p className="answer-status__text">
          {answeredCount} of {totalPlayers} players answered
        </p>
        <div className="answer-status__progress">
          <div
            className="answer-status__progress-bar"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="answer-indicators">
          {room.players.map(player => (
            <div
              key={player.id}
              className={`indicator ${player.hasAnswered ? 'indicator--answered' : ''}`}
              title={player.name}
            >
              {player.name.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

**Step 3: Test question round**

Run: `npm run dev`
Start a game and select a question
Expected: Timer ring in header, styled options, progress bar for answers

**Step 4: Commit**

```bash
git add src/games/quiz/components/QuestionRound.jsx src/games/quiz/quiz.css
git commit -m "feat(quiz): redesign QuestionRound with Timer and new styling"
```

---

### Task 7: Redesign RevealScreen

**Files:**
- Modify: `src/games/quiz/components/RevealScreen.jsx`
- Modify: `src/games/quiz/quiz.css`

**Step 1: Update RevealScreen CSS**

Replace the `/* ===== REVEAL SCREEN ===== */` section:

```css
/* ===== REVEAL SCREEN ===== */
.quiz-reveal {
  min-height: 100vh;
  min-height: 100dvh;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: linear-gradient(180deg, var(--quiz-primary-dark, #0d1442) 0%, var(--quiz-surface, #0d1b2a) 100%);
}

.reveal-header {
  text-align: center;
}

.reveal-header h2 {
  font-family: var(--quiz-font-display, 'Oswald', sans-serif);
  font-size: 1.5rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--quiz-gold, #ffd700);
  margin-bottom: 0.25rem;
}

.reveal-question {
  background: var(--quiz-surface, #0d1b2a);
  padding: 1rem;
  border-radius: var(--quiz-radius-md, 10px);
  text-align: center;
  border: 1px solid var(--quiz-border);
}

.reveal-question__text {
  font-size: 1rem;
  color: var(--quiz-text-dim, #a0aec0);
  margin: 0;
}

.correct-answer {
  background: var(--quiz-surface, #0d1b2a);
  border: 2px solid var(--quiz-correct, #00c853);
  padding: 1.25rem;
  border-radius: var(--quiz-radius-lg, 16px);
  text-align: center;
  box-shadow: 0 0 20px var(--quiz-correct-glow);
  animation: reveal-glow 0.5s ease-out;
}

@keyframes reveal-glow {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.correct-answer__label {
  color: var(--quiz-text-dim, #a0aec0);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.correct-answer__text {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--quiz-correct, #00c853);
  margin: 0;
}

/* Submissions list */
.submissions-list {
  flex: 1;
  overflow-y: auto;
}

.submissions-list h3 {
  font-size: 0.9rem;
  color: var(--quiz-text-dim, #a0aec0);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

.submissions-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.submission {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--quiz-surface, #0d1b2a);
  border-radius: var(--quiz-radius-md, 10px);
  border: 1px solid var(--quiz-border);
  animation: submission-slide 0.3s ease-out backwards;
}

.submission:nth-child(1) { animation-delay: 0.1s; }
.submission:nth-child(2) { animation-delay: 0.2s; }
.submission:nth-child(3) { animation-delay: 0.3s; }
.submission:nth-child(4) { animation-delay: 0.4s; }
.submission:nth-child(5) { animation-delay: 0.5s; }

@keyframes submission-slide {
  0% {
    opacity: 0;
    transform: translateX(-20px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

.submission__medal {
  font-size: 1.25rem;
  min-width: 28px;
  text-align: center;
}

.submission__rank {
  color: var(--quiz-text-muted, #718096);
  font-size: 0.9rem;
  min-width: 28px;
  text-align: center;
}

.submission__name {
  font-weight: 600;
  color: var(--quiz-text, white);
  min-width: 80px;
}

.submission__answer {
  flex: 1;
  color: var(--quiz-text-dim, #a0aec0);
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.submission__points {
  font-family: var(--quiz-font-mono, monospace);
  font-weight: 700;
  font-size: 0.9rem;
}

.submission__points--correct {
  color: var(--quiz-gold, #ffd700);
}

.submission__points--wrong {
  color: var(--quiz-text-muted, #718096);
}

.submission__speed-bonus {
  color: var(--quiz-gold, #ffd700);
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.no-submissions {
  text-align: center;
  color: var(--quiz-text-muted, #718096);
  padding: 2rem;
}

/* Continue button */
.reveal-actions {
  padding-top: 0.5rem;
}

.reveal-actions .btn {
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
  background: var(--quiz-gold, #ffd700);
  color: var(--quiz-primary-dark, #0d1442);
  border: none;
  font-weight: 700;
}

.reveal-actions .btn:hover {
  background: #ffed4a;
}

.reveal-waiting {
  text-align: center;
  color: var(--quiz-text-dim, #a0aec0);
  padding: 1rem;
}

/* Mobile */
@media (max-width: 640px) {
  .quiz-reveal {
    padding: 0.75rem;
    gap: 1rem;
  }

  .correct-answer__text {
    font-size: 1.5rem;
  }

  .submission {
    padding: 0.6rem 0.75rem;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .submission__answer {
    flex-basis: 100%;
    order: 10;
    margin-left: 36px;
  }
}
```

**Step 2: Update RevealScreen.jsx**

```jsx
export function RevealScreen({
  room,
  currentQuestion,
  onContinue
}) {
  // Get submissions sorted by time (fastest first)
  const submissions = room.players
    .filter(p => p.lastAnswer !== undefined)
    .sort((a, b) => (a.lastAnswerTime || Infinity) - (b.lastAnswerTime || Infinity))

  const correctAnswer = currentQuestion.answer
  const isHost = room.players[0]?.id === room.picker_id || room.players.findIndex(p => p.id === room.picker_id) === 0

  // Find who can continue (the question picker or host)
  const canContinue = isHost

  const getMedal = (index) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return null
  }

  return (
    <div className="screen quiz-reveal quiz-game">
      <div className="reveal-header">
        <h2>Time's Up!</h2>
      </div>

      <div className="reveal-question">
        <p className="reveal-question__text">{currentQuestion.question}</p>
      </div>

      <div className="correct-answer">
        <p className="correct-answer__label">Correct Answer</p>
        <p className="correct-answer__text">{correctAnswer}</p>
      </div>

      <div className="submissions-list">
        <h3>Results</h3>
        {submissions.length > 0 ? (
          <ul>
            {submissions.map((player, index) => {
              const isCorrect = player.lastAnswerCorrect
              const points = player.lastPoints || 0
              const medal = isCorrect ? getMedal(submissions.filter((p, i) => i < index && p.lastAnswerCorrect).length) : null
              const isFirst = index === 0 && isCorrect

              return (
                <li key={player.id} className="submission">
                  {medal ? (
                    <span className="submission__medal">{medal}</span>
                  ) : (
                    <span className="submission__rank">{index + 1}</span>
                  )}
                  <span className="submission__name">{player.name}</span>
                  <span className="submission__answer">
                    {player.lastAnswer || 'No answer'}
                  </span>
                  <span className={`submission__points ${isCorrect ? 'submission__points--correct' : 'submission__points--wrong'}`}>
                    {isCorrect ? `+${points}` : '+0'}
                  </span>
                  {isFirst && (
                    <span className="submission__speed-bonus">⚡</span>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="no-submissions">No one answered!</p>
        )}
      </div>

      <div className="reveal-actions">
        {canContinue ? (
          <button className="btn" onClick={onContinue}>
            Continue
          </button>
        ) : (
          <p className="reveal-waiting">Waiting for host to continue...</p>
        )}
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/games/quiz/components/RevealScreen.jsx src/games/quiz/quiz.css
git commit -m "feat(quiz): redesign RevealScreen with animations"
```

---

## Phase 3: Lobby & End Screens

### Task 8: Create PackCard Component

**Files:**
- Create: `src/games/quiz/components/PackCard.jsx`
- Create: `src/games/quiz/components/PackCard.css`

**Step 1: Create PackCard.css**

```css
/* Pack Selection Card */

.pack-card {
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  background: var(--quiz-surface, #0d1b2a);
  border: 2px solid var(--quiz-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--quiz-radius-lg, 16px);
  cursor: pointer;
  transition: all var(--quiz-transition-fast);
  position: relative;
  overflow: hidden;
}

.pack-card:hover {
  border-color: var(--quiz-gold, #ffd700);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.pack-card--selected {
  border-color: var(--quiz-gold, #ffd700);
  background: var(--quiz-primary-dark, #0d1442);
  box-shadow: 0 0 16px var(--quiz-gold-glow);
}

.pack-card--loading {
  pointer-events: none;
  opacity: 0.7;
}

.pack-card__check {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 24px;
  height: 24px;
  background: var(--quiz-gold, #ffd700);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--quiz-primary-dark, #0d1442);
  font-weight: bold;
  font-size: 0.9rem;
}

.pack-card__icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

.pack-card__name {
  font-family: var(--quiz-font-display, 'Oswald', sans-serif);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--quiz-text, white);
  margin-bottom: 0.25rem;
}

.pack-card__description {
  font-size: 0.9rem;
  color: var(--quiz-text-dim, #a0aec0);
  margin-bottom: 0.75rem;
}

.pack-card__stats {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: var(--quiz-text-muted, #718096);
}

.pack-card__stat {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.pack-card__loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  color: var(--quiz-gold, #ffd700);
  font-size: 0.9rem;
}

.pack-card__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--quiz-gold, #ffd700);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Step 2: Create PackCard.jsx**

```jsx
import './PackCard.css'

const PACK_ICONS = {
  'opentdb-db': '🧠',
  'opentdb': '🌐',
  'test-pack': '🧪',
  'default': '📦'
}

export function PackCard({
  id,
  name,
  description,
  questionCount,
  categoryCount,
  selected,
  loading,
  onClick
}) {
  const icon = PACK_ICONS[id] || PACK_ICONS.default

  return (
    <button
      className={`pack-card ${selected ? 'pack-card--selected' : ''} ${loading ? 'pack-card--loading' : ''}`}
      onClick={onClick}
      disabled={loading}
    >
      {selected && <span className="pack-card__check">✓</span>}
      <span className="pack-card__icon">{icon}</span>
      <span className="pack-card__name">{name}</span>
      <span className="pack-card__description">{description}</span>
      <div className="pack-card__stats">
        <span className="pack-card__stat">📝 {questionCount} questions</span>
        <span className="pack-card__stat">📁 {categoryCount} categories</span>
      </div>
      {loading && (
        <div className="pack-card__loading">
          <span className="pack-card__spinner" />
          Loading questions...
        </div>
      )}
    </button>
  )
}
```

**Step 3: Commit**

```bash
git add src/games/quiz/components/PackCard.jsx src/games/quiz/components/PackCard.css
git commit -m "feat(quiz): add PackCard component for pack selection"
```

---

### Task 9: Redesign Lobby

**Files:**
- Modify: `src/games/quiz/components/Lobby.jsx`
- Modify: `src/games/quiz/quiz.css`

**Step 1: Update Lobby CSS**

Replace the `/* ===== LOBBY ===== */` section:

```css
/* ===== LOBBY ===== */
.quiz-lobby {
  min-height: 100vh;
  min-height: 100dvh;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: linear-gradient(180deg, var(--quiz-primary-dark, #0d1442) 0%, var(--quiz-surface, #0d1b2a) 100%);
}

.lobby-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.lobby-header h2 {
  font-family: var(--quiz-font-display, 'Oswald', sans-serif);
  font-size: 1.5rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--quiz-gold, #ffd700);
}

.room-code-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--quiz-surface, #0d1b2a);
  padding: 0.5rem 1rem;
  border-radius: var(--quiz-radius-md, 10px);
  border: 1px solid var(--quiz-border);
  cursor: pointer;
  transition: all var(--quiz-transition-fast);
}

.room-code-display:hover {
  border-color: var(--quiz-gold, #ffd700);
}

.room-code-display:active {
  transform: scale(0.98);
}

.room-code__label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--quiz-text-muted, #718096);
}

.room-code__code {
  font-family: var(--quiz-font-mono, monospace);
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: var(--quiz-gold, #ffd700);
}

.room-code__copied {
  font-size: 0.8rem;
  color: var(--quiz-correct, #00c853);
}

/* Lobby content - two columns on desktop */
.lobby-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  flex: 1;
}

@media (max-width: 768px) {
  .lobby-content {
    grid-template-columns: 1fr;
  }
}

/* Players section */
.players-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.players-section h3 {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--quiz-text-dim, #a0aec0);
}

.player-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.player-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--quiz-surface, #0d1b2a);
  border-radius: var(--quiz-radius-md, 10px);
  border: 1px solid var(--quiz-border);
}

.player-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--quiz-primary, #1a237e);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--quiz-text, white);
  font-size: 0.9rem;
}

.player-name {
  flex: 1;
  font-weight: 500;
}

.host-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: var(--quiz-gold, #ffd700);
  color: var(--quiz-primary-dark, #0d1442);
  padding: 0.2rem 0.5rem;
  border-radius: var(--quiz-radius-sm, 6px);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}

.bot-badge {
  background: #ff9800;
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: var(--quiz-radius-sm, 6px);
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.btn-remove-bot {
  background: none;
  border: none;
  color: var(--quiz-text-muted, #718096);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0.6;
  transition: all var(--quiz-transition-fast);
}

.btn-remove-bot:hover {
  color: var(--quiz-wrong, #ff1744);
  opacity: 1;
}

.btn-add-bot {
  background: var(--quiz-surface-light, #1b2838);
  border: 1px dashed var(--quiz-border);
  padding: 0.5rem 1rem;
  border-radius: var(--quiz-radius-md, 10px);
  color: var(--quiz-text-dim, #a0aec0);
  cursor: pointer;
  font-size: 0.9rem;
  transition: all var(--quiz-transition-fast);
}

.btn-add-bot:hover {
  border-color: var(--quiz-gold, #ffd700);
  color: var(--quiz-gold, #ffd700);
}

/* Pack section */
.pack-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.pack-section h3 {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--quiz-text-dim, #a0aec0);
}

.pack-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.pack-ready {
  background: var(--quiz-surface, #0d1b2a);
  border: 2px solid var(--quiz-correct, #00c853);
  border-radius: var(--quiz-radius-lg, 16px);
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 0 16px var(--quiz-correct-glow);
}

.pack-ready__icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.pack-ready__text {
  color: var(--quiz-correct, #00c853);
  font-weight: 600;
}

/* Waiting section (for non-hosts) */
.waiting-section {
  text-align: center;
  padding: 2rem;
  background: var(--quiz-surface, #0d1b2a);
  border-radius: var(--quiz-radius-lg, 16px);
  border: 1px solid var(--quiz-border);
}

.waiting-section p {
  color: var(--quiz-text-dim, #a0aec0);
}

/* Category browser */
.category-browser {
  background: var(--quiz-surface, #0d1b2a);
  border-radius: var(--quiz-radius-lg, 16px);
  padding: 1rem;
  border: 1px solid var(--quiz-border);
}

.category-browser__back {
  background: none;
  border: none;
  color: var(--quiz-gold, #ffd700);
  cursor: pointer;
  padding: 0;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.category-browser__back:hover {
  text-decoration: underline;
}

.category-browser h4 {
  font-size: 0.85rem;
  color: var(--quiz-text-dim, #a0aec0);
  margin: 1rem 0 0.5rem;
}

.category-browser h4:first-of-type {
  margin-top: 0;
}

.filter-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.btn-text {
  background: none;
  border: none;
  color: var(--quiz-gold, #ffd700);
  cursor: pointer;
  padding: 0;
  font-size: 0.85rem;
}

.btn-text:hover {
  text-decoration: underline;
}

.filter-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.categories-grid {
  max-height: 180px;
  overflow-y: auto;
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  background: var(--quiz-surface-light, #1b2838);
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all var(--quiz-transition-fast);
  user-select: none;
  border: 1px solid transparent;
}

.filter-chip:hover {
  border-color: var(--quiz-gold, #ffd700);
}

.filter-chip input[type="checkbox"] {
  width: 14px;
  height: 14px;
  accent-color: var(--quiz-gold, #ffd700);
  cursor: pointer;
}

.filter-chip input[type="checkbox"]:checked + span {
  color: var(--quiz-gold, #ffd700);
  font-weight: 500;
}

.category-browser__submit {
  width: 100%;
  margin-top: 1.25rem;
  padding: 0.875rem;
  background: var(--quiz-gold, #ffd700);
  color: var(--quiz-primary-dark, #0d1442);
  border: none;
  border-radius: var(--quiz-radius-md, 10px);
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all var(--quiz-transition-fast);
}

.category-browser__submit:hover:not(:disabled) {
  background: #ffed4a;
}

.category-browser__submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.category-browser__hint {
  text-align: center;
  font-size: 0.85rem;
  color: var(--quiz-text-muted, #718096);
  margin-top: 0.5rem;
}

/* Lobby actions */
.lobby-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  padding-top: 0.5rem;
}

.lobby-actions .btn-primary {
  flex: 1;
  max-width: 200px;
  padding: 1rem;
  background: var(--quiz-gold, #ffd700);
  color: var(--quiz-primary-dark, #0d1442);
  border: none;
  font-weight: 700;
}

.lobby-actions .btn-primary:hover:not(:disabled) {
  background: #ffed4a;
}

.lobby-actions .btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.lobby-actions .btn-secondary {
  padding: 1rem 1.5rem;
  background: var(--quiz-surface, #0d1b2a);
  border: 1px solid var(--quiz-border);
  color: var(--quiz-text, white);
}

.lobby-hint {
  text-align: center;
  color: var(--quiz-text-muted, #718096);
  font-size: 0.9rem;
}
```

**Step 2: Update Lobby.jsx to use PackCard**

```jsx
import { useState } from 'react'
import { PackCard } from './PackCard'
import { ALL_CATEGORIES } from '../data/questions-db'

const SOURCES = [
  {
    id: 'opentdb-db',
    name: 'Trivia Database',
    description: '1,200+ curated questions with community voting',
    questionCount: 1200,
    categoryCount: 24,
    hasFilters: true
  },
  {
    id: 'opentdb',
    name: 'Live Trivia API',
    description: 'Fresh questions fetched in real-time',
    questionCount: 5000,
    categoryCount: 24,
    hasFilters: false
  }
]

const DIFFICULTIES = [
  { id: 'easy', name: 'Easy' },
  { id: 'medium', name: 'Medium' },
  { id: 'hard', name: 'Hard' }
]

const TYPES = [
  { id: 'multiple', name: 'Multiple Choice' },
  { id: 'boolean', name: 'True / False' }
]

export function Lobby({
  room,
  isHost,
  onSelectPack,
  onStartGame,
  onLeave,
  onAddBot,
  onRemoveBot,
  error,
  loading
}) {
  const [selectedSource, setSelectedSource] = useState(null)
  const [copied, setCopied] = useState(false)
  const [filters, setFilters] = useState({
    categories: ALL_CATEGORIES.map(c => c.id),
    difficulties: ['easy', 'medium', 'hard'],
    types: ['multiple', 'boolean']
  })

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('Failed to copy:', e)
    }
  }

  const handleSourceSelect = (sourceId) => {
    setSelectedSource(sourceId)
    const source = SOURCES.find(s => s.id === sourceId)
    if (!source?.hasFilters) {
      onSelectPack(sourceId)
    }
  }

  const handleApplyFilters = () => {
    onSelectPack(selectedSource, filters)
  }

  const toggleCategory = (catId) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(catId)
        ? prev.categories.filter(id => id !== catId)
        : [...prev.categories, catId]
    }))
  }

  const toggleDifficulty = (diffId) => {
    setFilters(prev => ({
      ...prev,
      difficulties: prev.difficulties.includes(diffId)
        ? prev.difficulties.filter(id => id !== diffId)
        : [...prev.difficulties, diffId]
    }))
  }

  const toggleType = (typeId) => {
    setFilters(prev => ({
      ...prev,
      types: prev.types.includes(typeId)
        ? prev.types.filter(id => id !== typeId)
        : [...prev.types, typeId]
    }))
  }

  const source = SOURCES.find(s => s.id === selectedSource)
  const showFilters = source?.hasFilters && !room.board

  return (
    <div className="screen quiz-lobby quiz-game">
      <div className="lobby-header">
        <h2>Quiz Lobby</h2>
        <button className="room-code-display" onClick={handleCopyCode}>
          <span className="room-code__label">Room</span>
          <span className="room-code__code">{room.code}</span>
          {copied && <span className="room-code__copied">Copied!</span>}
        </button>
      </div>

      <div className="lobby-content">
        <div className="players-section">
          <h3>Players ({room.players.length})</h3>
          <ul className="player-list">
            {room.players.map((player, index) => (
              <li key={player.id} className="player-item">
                <div className="player-avatar">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <span className="player-name">{player.name}</span>
                {index === 0 && <span className="host-badge">👑 Host</span>}
                {player.isBot && <span className="bot-badge">Bot</span>}
                {isHost && player.isBot && (
                  <button
                    className="btn-remove-bot"
                    onClick={() => onRemoveBot(player.id)}
                    title="Remove bot"
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>
          {isHost && (
            <button className="btn-add-bot" onClick={onAddBot} disabled={loading}>
              + Add Bot
            </button>
          )}
        </div>

        {isHost && !room.board && (
          <div className="pack-section">
            <h3>Select Questions</h3>

            {!showFilters ? (
              <div className="pack-grid">
                {SOURCES.map(src => (
                  <PackCard
                    key={src.id}
                    id={src.id}
                    name={src.name}
                    description={src.description}
                    questionCount={src.questionCount}
                    categoryCount={src.categoryCount}
                    selected={selectedSource === src.id}
                    loading={loading && selectedSource === src.id}
                    onClick={() => handleSourceSelect(src.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="category-browser">
                <button className="category-browser__back" onClick={() => setSelectedSource(null)}>
                  ← Back to sources
                </button>

                <h4>Categories ({filters.categories.length}/{ALL_CATEGORIES.length})</h4>
                <div className="filter-actions">
                  <button className="btn-text" onClick={() => setFilters(f => ({ ...f, categories: ALL_CATEGORIES.map(c => c.id) }))}>
                    Select All
                  </button>
                  <button className="btn-text" onClick={() => setFilters(f => ({ ...f, categories: [] }))}>
                    Deselect All
                  </button>
                </div>
                <div className="filter-grid categories-grid">
                  {ALL_CATEGORIES.map(cat => (
                    <label key={cat.id} className="filter-chip">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(cat.id)}
                        onChange={() => toggleCategory(cat.id)}
                      />
                      <span>{cat.short}</span>
                    </label>
                  ))}
                </div>

                <h4>Difficulty</h4>
                <div className="filter-grid">
                  {DIFFICULTIES.map(diff => (
                    <label key={diff.id} className="filter-chip">
                      <input
                        type="checkbox"
                        checked={filters.difficulties.includes(diff.id)}
                        onChange={() => toggleDifficulty(diff.id)}
                      />
                      <span>{diff.name}</span>
                    </label>
                  ))}
                </div>

                <h4>Question Type</h4>
                <div className="filter-grid">
                  {TYPES.map(type => (
                    <label key={type.id} className="filter-chip">
                      <input
                        type="checkbox"
                        checked={filters.types.includes(type.id)}
                        onChange={() => toggleType(type.id)}
                      />
                      <span>{type.name}</span>
                    </label>
                  ))}
                </div>

                <button
                  className="category-browser__submit"
                  onClick={handleApplyFilters}
                  disabled={loading || filters.categories.length < 6}
                >
                  {loading ? 'Loading...' : 'Load Questions'}
                </button>
                {filters.categories.length < 6 && (
                  <p className="category-browser__hint">Select at least 6 categories</p>
                )}
              </div>
            )}
          </div>
        )}

        {isHost && room.board && (
          <div className="pack-section">
            <h3>Questions</h3>
            <div className="pack-ready">
              <div className="pack-ready__icon">✅</div>
              <p className="pack-ready__text">Ready to play!</p>
            </div>
          </div>
        )}

        {!isHost && (
          <div className="waiting-section">
            <p>Waiting for host to select questions...</p>
            {room.board && <p className="pack-ready__text">Questions loaded!</p>}
          </div>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      <div className="lobby-actions">
        {isHost && (
          <button
            className="btn btn-primary"
            onClick={onStartGame}
            disabled={!room.board || room.players.length < 2 || loading}
          >
            {loading ? 'Loading...' : 'Start Game'}
          </button>
        )}
        <button className="btn btn-secondary" onClick={onLeave} disabled={loading}>
          Leave
        </button>
      </div>

      {isHost && room.players.length < 2 && (
        <p className="lobby-hint">Need at least 2 players to start</p>
      )}
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/games/quiz/components/Lobby.jsx src/games/quiz/quiz.css
git commit -m "feat(quiz): redesign Lobby with PackCard and category browser"
```

---

### Task 10: Create Podium Component

**Files:**
- Create: `src/games/quiz/components/Podium.jsx`
- Create: `src/games/quiz/components/Podium.css`

**Step 1: Create Podium.css**

```css
/* Winner Podium Display */

.quiz-podium {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 0.75rem;
  padding: 1rem 0;
}

.podium-place {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: var(--quiz-surface, #0d1b2a);
  border-radius: var(--quiz-radius-lg, 16px);
  border: 2px solid var(--quiz-border);
  min-width: 100px;
  animation: podium-rise 0.5s ease-out backwards;
}

.podium-place--1 {
  order: 2;
  border-color: var(--quiz-gold, #ffd700);
  box-shadow: 0 0 24px var(--quiz-gold-glow);
  transform: scale(1.1);
  z-index: 2;
  animation-delay: 0.2s;
}

.podium-place--2 {
  order: 1;
  border-color: #c0c0c0;
  box-shadow: 0 0 12px rgba(192, 192, 192, 0.3);
  animation-delay: 0.4s;
}

.podium-place--3 {
  order: 3;
  border-color: #cd7f32;
  box-shadow: 0 0 12px rgba(205, 127, 50, 0.3);
  animation-delay: 0.6s;
}

@keyframes podium-rise {
  0% {
    opacity: 0;
    transform: translateY(40px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.podium-place--1.podium-rise {
  animation: podium-rise 0.5s ease-out backwards, podium-pulse 2s ease-in-out infinite 0.7s;
}

@keyframes podium-pulse {
  0%, 100% { box-shadow: 0 0 24px var(--quiz-gold-glow); }
  50% { box-shadow: 0 0 32px var(--quiz-gold-glow), 0 0 48px var(--quiz-gold-glow); }
}

.podium-rank {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.podium-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--quiz-primary, #1a237e);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--quiz-text, white);
  margin-bottom: 0.5rem;
}

.podium-place--1 .podium-avatar {
  border: 2px solid var(--quiz-gold, #ffd700);
}

.podium-name {
  font-weight: 600;
  color: var(--quiz-text, white);
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
  text-align: center;
  max-width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.podium-score {
  font-family: var(--quiz-font-mono, monospace);
  font-weight: 700;
  color: var(--quiz-gold, #ffd700);
  font-size: 1.1rem;
}

/* Mobile stacked layout */
@media (max-width: 400px) {
  .quiz-podium {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .podium-place {
    flex-direction: row;
    justify-content: flex-start;
    gap: 1rem;
    min-width: auto;
    padding: 0.75rem 1rem;
    order: unset !important;
    transform: none !important;
  }

  .podium-place--1 {
    order: -1 !important;
  }

  .podium-rank {
    font-size: 1.5rem;
    margin-bottom: 0;
  }

  .podium-avatar {
    margin-bottom: 0;
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }

  .podium-info {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .podium-name {
    max-width: none;
  }

  .podium-score {
    margin-left: auto;
  }
}
```

**Step 2: Create Podium.jsx**

```jsx
import './Podium.css'

export function Podium({ players }) {
  // Take top 3 players sorted by score
  const top3 = [...players]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  const getRankEmoji = (index) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return ''
  }

  if (top3.length === 0) return null

  return (
    <div className="quiz-podium">
      {top3.map((player, index) => (
        <div
          key={player.id}
          className={`podium-place podium-place--${index + 1}`}
        >
          <span className="podium-rank">{getRankEmoji(index)}</span>
          <div className="podium-avatar">
            {player.name.charAt(0).toUpperCase()}
          </div>
          <div className="podium-info">
            <span className="podium-name">{player.name}</span>
            <span className="podium-score">{player.score}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/games/quiz/components/Podium.jsx src/games/quiz/components/Podium.css
git commit -m "feat(quiz): add Podium component for winner display"
```

---

### Task 11: Redesign EndScreen

**Files:**
- Modify: `src/games/quiz/components/EndScreen.jsx`
- Modify: `src/games/quiz/quiz.css`

**Step 1: Update EndScreen CSS**

Replace `/* ===== END SCREEN ===== */` section:

```css
/* ===== END SCREEN ===== */
.quiz-end {
  min-height: 100vh;
  min-height: 100dvh;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  background: linear-gradient(180deg, var(--quiz-primary-dark, #0d1442) 0%, var(--quiz-surface, #0d1b2a) 100%);
  text-align: center;
}

.end-header h1 {
  font-family: var(--quiz-font-display, 'Oswald', sans-serif);
  font-size: 2rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--quiz-gold, #ffd700);
  text-shadow: 0 4px 16px var(--quiz-gold-glow);
  animation: title-glow 2s ease-in-out infinite;
}

@keyframes title-glow {
  0%, 100% { text-shadow: 0 4px 16px var(--quiz-gold-glow); }
  50% { text-shadow: 0 4px 24px var(--quiz-gold-glow), 0 0 48px var(--quiz-gold-glow); }
}

.winner-announcement {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.winner-trophy {
  font-size: 4rem;
  animation: trophy-bounce 0.6s ease-out;
}

@keyframes trophy-bounce {
  0% { transform: scale(0) rotate(-10deg); }
  50% { transform: scale(1.2) rotate(5deg); }
  100% { transform: scale(1) rotate(0deg); }
}

.winner-name {
  font-family: var(--quiz-font-display, 'Oswald', sans-serif);
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--quiz-gold, #ffd700);
  text-shadow: 0 2px 8px var(--quiz-gold-glow);
}

.winner-score {
  font-family: var(--quiz-font-mono, monospace);
  font-size: 1.25rem;
  color: var(--quiz-text-dim, #a0aec0);
}

/* Full leaderboard */
.final-scores {
  width: 100%;
  max-width: 400px;
}

.final-scores h3 {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--quiz-text-dim, #a0aec0);
  margin-bottom: 0.75rem;
}

.final-scores__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.final-score-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--quiz-surface, #0d1b2a);
  border-radius: var(--quiz-radius-md, 10px);
  border: 1px solid var(--quiz-border);
}

.final-score-item--top3 {
  border-color: var(--quiz-gold-dim, #b8960b);
}

.final-score-item__rank {
  color: var(--quiz-text-muted, #718096);
  font-size: 0.9rem;
  min-width: 24px;
}

.final-score-item__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--quiz-primary, #1a237e);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--quiz-text, white);
}

.final-score-item__name {
  flex: 1;
  font-weight: 500;
  color: var(--quiz-text, white);
}

.final-score-item__score {
  font-family: var(--quiz-font-mono, monospace);
  font-weight: 700;
  color: var(--quiz-gold, #ffd700);
}

/* End actions */
.end-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
  width: 100%;
  max-width: 400px;
}

.end-actions .btn-primary {
  flex: 1;
  min-width: 120px;
  padding: 1rem;
  background: var(--quiz-gold, #ffd700);
  color: var(--quiz-primary-dark, #0d1442);
  border: none;
  font-weight: 700;
  border-radius: var(--quiz-radius-md, 10px);
}

.end-actions .btn-primary:hover {
  background: #ffed4a;
}

.end-actions .btn-secondary {
  padding: 1rem 1.5rem;
  background: var(--quiz-surface, #0d1b2a);
  border: 1px solid var(--quiz-border);
  color: var(--quiz-text, white);
  border-radius: var(--quiz-radius-md, 10px);
}

.end-actions .btn-secondary:hover {
  border-color: var(--quiz-gold, #ffd700);
}

@media (max-width: 400px) {
  .end-header h1 {
    font-size: 1.5rem;
  }

  .winner-trophy {
    font-size: 3rem;
  }

  .winner-name {
    font-size: 1.5rem;
  }

  .end-actions {
    flex-direction: column;
  }

  .end-actions .btn {
    width: 100%;
  }
}
```

**Step 2: Update EndScreen.jsx**

```jsx
import { Confetti } from './Confetti'
import { Podium } from './Podium'

export function EndScreen({
  room,
  isHost,
  onPlayAgain,
  onLeave
}) {
  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score)
  const winner = sortedPlayers[0]

  return (
    <div className="screen quiz-end quiz-game">
      <Confetti active={true} pieceCount={60} duration={5000} />

      <div className="end-header">
        <h1>Game Over!</h1>
      </div>

      <div className="winner-announcement">
        <span className="winner-trophy">🏆</span>
        <span className="winner-name">{winner?.name}</span>
        <span className="winner-score">{winner?.score} points</span>
      </div>

      <Podium players={sortedPlayers} />

      {sortedPlayers.length > 3 && (
        <div className="final-scores">
          <h3>Full Results</h3>
          <ul className="final-scores__list">
            {sortedPlayers.slice(3).map((player, index) => (
              <li key={player.id} className="final-score-item">
                <span className="final-score-item__rank">{index + 4}.</span>
                <div className="final-score-item__avatar">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <span className="final-score-item__name">{player.name}</span>
                <span className="final-score-item__score">{player.score}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="end-actions">
        {isHost ? (
          <>
            <button className="btn btn-primary" onClick={onPlayAgain}>
              Play Again
            </button>
            <button className="btn btn-secondary" onClick={onLeave}>
              Leave
            </button>
          </>
        ) : (
          <button className="btn btn-secondary" onClick={onLeave}>
            Leave Room
          </button>
        )}
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/games/quiz/components/EndScreen.jsx src/games/quiz/quiz.css
git commit -m "feat(quiz): redesign EndScreen with Podium and Confetti"
```

---

## Phase 4: Testing & Polish

### Task 12: Add Google Font for Display Typography

**Files:**
- Modify: `src/app/layout.tsx`

**Step 1: Add Oswald font import**

In `src/app/layout.tsx`, add Google Fonts import. Find the existing font imports and add:

```tsx
import { Oswald, JetBrains_Mono } from 'next/font/google'

const oswald = Oswald({
  subsets: ['latin'],
  variable: '--font-oswald',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})
```

Add to the body className:

```tsx
<body className={`${existingClasses} ${oswald.variable} ${jetbrainsMono.variable}`}>
```

**Step 2: Update CSS to use font variables**

In `quiz.css`, update the font declarations:

```css
--quiz-font-display: var(--font-oswald, 'Oswald', 'Arial Narrow', sans-serif);
--quiz-font-mono: var(--font-jetbrains, 'JetBrains Mono', 'Courier New', monospace);
```

**Step 3: Commit**

```bash
git add src/app/layout.tsx src/games/quiz/quiz.css
git commit -m "feat(quiz): add Oswald and JetBrains Mono fonts"
```

---

### Task 13: Visual Testing with Playwright

**Files:**
- Create: `tests/quiz-visual.py`

**Step 1: Create Playwright test script**

```python
#!/usr/bin/env python3
"""Visual testing for Quiz game redesign using Playwright."""

import asyncio
from playwright.async_api import async_playwright
import os

SCREENSHOTS_DIR = "tests/screenshots/quiz"
BASE_URL = "http://localhost:3000"

async def setup():
    """Ensure screenshots directory exists."""
    os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

async def test_quiz_home(page):
    """Test quiz home screen."""
    await page.goto(f"{BASE_URL}/games/quiz")
    await page.wait_for_selector(".quiz-home")
    await page.screenshot(path=f"{SCREENSHOTS_DIR}/01-home.png", full_page=True)
    print("✓ Home screen captured")

async def test_quiz_lobby_desktop(page):
    """Test lobby on desktop."""
    await page.set_viewport_size({"width": 1280, "height": 800})
    await page.goto(f"{BASE_URL}/games/quiz")

    # Click Create Room
    await page.click("text=Create Room")
    await page.fill('input[placeholder*="name" i]', "TestPlayer")
    await page.click("text=Create")

    await page.wait_for_selector(".quiz-lobby")
    await page.screenshot(path=f"{SCREENSHOTS_DIR}/02-lobby-desktop.png", full_page=True)
    print("✓ Lobby (desktop) captured")

async def test_quiz_lobby_mobile(page):
    """Test lobby on mobile."""
    await page.set_viewport_size({"width": 375, "height": 667})
    await page.goto(f"{BASE_URL}/games/quiz")

    await page.click("text=Create Room")
    await page.fill('input[placeholder*="name" i]', "MobilePlayer")
    await page.click("text=Create")

    await page.wait_for_selector(".quiz-lobby")
    await page.screenshot(path=f"{SCREENSHOTS_DIR}/03-lobby-mobile.png", full_page=True)
    print("✓ Lobby (mobile) captured")

async def main():
    """Run all visual tests."""
    await setup()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # Desktop tests
        context = await browser.new_context()
        page = await context.new_page()

        try:
            await test_quiz_home(page)
            await test_quiz_lobby_desktop(page)
        except Exception as e:
            print(f"✗ Desktop test failed: {e}")
            await page.screenshot(path=f"{SCREENSHOTS_DIR}/error-desktop.png")

        await context.close()

        # Mobile tests
        context = await browser.new_context(
            viewport={"width": 375, "height": 667},
            device_scale_factor=2,
        )
        page = await context.new_page()

        try:
            await test_quiz_lobby_mobile(page)
        except Exception as e:
            print(f"✗ Mobile test failed: {e}")
            await page.screenshot(path=f"{SCREENSHOTS_DIR}/error-mobile.png")

        await context.close()
        await browser.close()

    print(f"\nScreenshots saved to {SCREENSHOTS_DIR}/")

if __name__ == "__main__":
    asyncio.run(main())
```

**Step 2: Run visual tests**

```bash
# Ensure dev server is running
npm run dev &

# Run Playwright tests
python3 tests/quiz-visual.py
```

Expected: Screenshots captured in `tests/screenshots/quiz/`

**Step 3: Commit**

```bash
git add tests/quiz-visual.py
git commit -m "test(quiz): add Playwright visual testing script"
```

---

## Summary

**Total Tasks:** 13
**Estimated Implementation:** ~3-4 hours

**Key Components Created:**
1. Timer - Circular countdown with ring animation
2. Confetti - Celebration particles
3. PackCard - Visual pack selection
4. Podium - Winner display

**Screens Redesigned:**
1. Board (desktop + mobile carousel)
2. QuestionRound
3. RevealScreen
4. Lobby
5. EndScreen

**Testing:**
- Playwright visual tests for all screens
- Desktop and mobile viewports
