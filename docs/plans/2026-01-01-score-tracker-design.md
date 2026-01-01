# Score Tracker Design

**Date:** 2026-01-01
**Status:** Ready for implementation

## Overview

A score tracking page for physical card games: Septica, Whist, and Rentz. Accessible from the main GameHub menu. Uses localStorage for persistence (no Supabase).

## Games & Player Counts

| Game | Players | Scoring Notes |
|------|---------|---------------|
| Septica | 4 (fixed) | Points per round, highest total wins |
| Whist | 3-5 (choose) | Points per round, highest total wins |
| Rentz | 3-5 (choose) | Points per round (can be negative), highest total wins |

## User Flow

1. **Game Selection** - Pick Septica, Whist, or Rentz
2. **Player Setup** - Enter player names (4 fixed for Septica, choose 3-5 for others)
3. **Score Table** - Main view with rounds, running totals, add/edit/delete rounds
4. **New Game** - Reset and start fresh

## Score Table UI

```
┌─────────────────────────────────────┐
│ ← Back          Septica       ⟳ New │
├─────────────────────────────────────┤
│   Player1  Player2  Player3  Player4│
├─────────────────────────────────────┤
│ 1    30       20       10       20  │
│ 2    40       30       50       10  │
│ 3   -10       20       30       40  │
├─────────────────────────────────────┤
│ Σ    60       70       90       70  │  ← Sticky totals row
├─────────────────────────────────────┤
│         [ + Add Round ]             │
└─────────────────────────────────────┘
```

**Interactions:**
- Add Round: Modal with input per player
- Tap cell: Edit that score
- Delete round: Swipe or long-press
- Running totals: Always visible (sticky)
- Leader highlight: Subtle glow on winning column

**Visual:**
- Positive scores: Default text
- Negative scores: Red tint
- Leader: Highlighted column

## Data Model (localStorage)

**Key:** `scoreTracker`

```javascript
{
  currentGame: {
    type: "septica" | "whist" | "rentz",
    players: ["Alice", "Bob", "Charlie", "Dan"],
    rounds: [
      { id: 1, scores: [30, 20, 10, 20] },
      { id: 2, scores: [40, 30, 50, 10] }
    ],
    createdAt: "2026-01-01T12:00:00Z"
  }
}
```

**Computed on render:**
- Running totals per player
- Current leader
- Round count

## File Structure

```
src/
├── app/games/score-tracker/
│   └── page.tsx              # Next.js page entry
├── games/score-tracker/
│   ├── ScoreTrackerGame.jsx  # Main component
│   ├── score-tracker.css     # Styles
│   ├── components/
│   │   ├── GameSelect.jsx    # Pick game type
│   │   ├── PlayerSetup.jsx   # Enter names + count
│   │   ├── ScoreTable.jsx    # Main scoring grid
│   │   └── AddRoundModal.jsx # Input round scores
│   └── hooks/
│       └── useScoreTracker.js # State + localStorage
```

## GameHub Integration

- New card with amber accent (`#f59e0b`)
- Name: "Score Tracker"
- Description: "Track scores for Septica, Whist, and Rentz"
- href: `/games/score-tracker`

## Implementation Notes

- Mobile-first (440px max-width like other games)
- Match existing dark purple theme from globals.css
- No external dependencies beyond React
- Auto-save on every change
