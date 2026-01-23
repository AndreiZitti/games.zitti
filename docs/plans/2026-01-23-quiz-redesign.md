# Quiz Game Redesign

## Overview

Complete UI/UX redesign of the quiz game with:
- Classic game show aesthetic (Jeopardy-inspired)
- Full mobile responsiveness
- Visual pack selection with category browsing
- Polished animations (no audio)

---

## Visual Design System

### Color Palette
| Role | Color | Hex |
|------|-------|-----|
| Primary | Deep royal blue | `#1a237e` |
| Accent | Gold/amber | `#ffd700` |
| Correct | Emerald green | `#00c853` |
| Wrong | Ruby red | `#ff1744` |
| Surface | Dark navy | `#0d1b2a` |
| Text | White | `#ffffff` |

### Typography
- **Board categories**: Bold condensed sans-serif (Oswald/Bebas Neue), ALL CAPS
- **Point values**: Large, bold with subtle glow
- **Questions**: Clean readable (Inter/system), generous sizing
- **Timer**: Monospace, dramatic size

### Visual Effects
- Inner glow on tiles (backlit TV panel effect)
- Gold shimmer/pulse on interactive elements
- Gradient borders for studio lighting feel
- Drop shadows for 3D depth

### Animations
- **Tile selection**: Scale up + glow → flip to reveal question
- **Timer**: Pulse when critical (<10s), smooth countdown ring
- **Score updates**: Numbers roll up with gold particle burst
- **Answer reveal**: Slide in with pause, correct glows green
- **Winner**: Confetti + trophy + pulsing gold border

---

## Screen Designs

### 1. Game Board

#### Desktop (768px+)
- Full 6-column grid with generous spacing
- Category headers: Bold white on blue gradient, subtle bevel
- Tiles: Rounded corners, inner glow, gold centered point values
- Used tiles: Fade dark with dim state
- Picker indicator: Gold border + "YOUR PICK" badge

#### Mobile (<768px)
- Horizontal scroll carousel for categories
- Show 2-3 categories with peek of next
- Dot indicators at bottom
- Large tap targets (min 48px)
- Sticky header: Current picker + mini scoreboard

#### Scoreboard
- Desktop: Horizontal bar above board, all players ranked
- Mobile: Collapsible, top 3 default, tap to expand
- Player display: Avatar circle, name, gold score
- Leader gets crown icon
- Checkmark when answered during rounds

#### Interactions
- Hover (desktop): Scale 1.05x, glow intensifies
- Tap/click: Ripple → 180° flip → question screen

---

### 2. Question Round

#### Header
- Left: Category badge (blue pill) + point value (gold, large)
- Right: Circular timer with depleting ring, pulses red <10s

#### Question Display
- Centered card, dark surface, subtle border glow
- Large readable text (1.25-1.5rem mobile, 1.5-2rem desktop)
- Max-width ~600px for readability

#### Multiple Choice Options
- 2x2 grid desktop, single column mobile
- Letter badges (A, B, C, D) in gold circles
- Hover: Gold border glow
- Selected: Blue fill, white text, gold border
- Disabled after selection

#### True/False
- Two large buttons side by side (stacked on mobile)
- Icons: ✓ True, ✗ False

#### Answer Status
- "X of Y answered" with progress bar
- Player avatars: Gray waiting, green checkmark answered
- Mobile: Count + mini dots

---

### 3. Reveal Screen

#### Animation Sequence
1. Question visible at top (smaller)
2. "The correct answer is..." fades in
3. Answer card slides up with green glow + gold border
4. 500ms dramatic pause

#### Player Results
- Sorted by speed (fastest correct first)
- Row: Rank medal (🥇🥈🥉), name, answer, points earned
- Correct: Green text, "+300" gold
- Wrong: Red strikethrough, "+0" gray
- Fastest correct: "⚡ Speed Bonus" indicator

#### Score Animation
- Counting animation on score update
- Crown transfers on leader change
- Scores pulse when updated

#### Continue
- Large gold "Continue" button
- Auto-continue after 8-10s with countdown
- Only picker can continue, others wait

---

### 4. Lobby & Pack Selection

#### Layout
- Desktop: Two-column (players left, packs right)
- Mobile: Single column (players, then packs)

#### Room Code
- Prominent banner with large monospace code
- Tap to copy with "Copied!" feedback

#### Player List
- Cards with avatars (colored circle + initial)
- Host: Gold crown
- Bot: Orange robot icon
- "+Add Bot" for host

#### Pack Selection Cards
- Large visual cards with:
  - Pack icon/illustration
  - Pack name (bold)
  - Question count + category count
  - Source indicator
- Selected: Gold border + checkmark

#### Category Browser (expanded in pack)
- Chip/pill toggles per category
- Horizontal scroll on mobile
- "Select All" / "Deselect All"
- Difficulty toggles: Easy/Medium/Hard
- Min 6 categories warning

#### Start Button
- Large gold, disabled until pack + 2 players
- Non-hosts see "Waiting for host..."

---

### 5. End Screen

#### Winner Reveal
- Screen dims, spotlight centers
- Trophy (🏆) bounces in
- Winner name: Large gold text with shimmer
- Score counts up from 0

#### Podium
- Visual podium: 2nd | 1st | 3rd layout
- 1st: Elevated, gold border + crown
- 2nd: Silver border
- 3rd: Bronze border
- Staggered animation entry

#### Full Leaderboard
- Scrollable ranked list
- Your position highlighted (blue border)
- Shows: Rank, name, score, questions correct

#### Celebration Effects
- Confetti (CSS/canvas, gold + blue)
- Winner card pulsing glow

#### Actions
- Host: "Play Again" (gold) + "New Pack" + "Leave"
- Others: Wait or follow host action
- Play Again: Same pack, new board
- New Pack: Return to lobby

---

## Mobile Considerations

- All tap targets minimum 48px
- Horizontal scroll for board categories (carousel)
- Collapsible scoreboards
- Single-column layouts
- Sticky headers for context
- Large buttons for quick answering
- Scrollable lists with sticky elements

---

## Technical Notes

### CSS
- Use CSS custom properties for theme colors
- Framer Motion for animations
- CSS Grid for board layout
- Flexbox for responsive stacking

### Components to Update
1. `quiz.css` - Complete rewrite with new design system
2. `Board.jsx` - Carousel layout for mobile, new tile design
3. `QuestionRound.jsx` - Timer ring, new option buttons
4. `RevealScreen.jsx` - Animation sequence, results list
5. `Lobby.jsx` - Pack cards, category browser
6. `EndScreen.jsx` - Podium, confetti, winner celebration
7. `Scoreboard.jsx` - Collapsible mini scoreboard

### New Components Needed
- `Timer.jsx` - Circular countdown with ring animation
- `PackCard.jsx` - Visual pack selection card
- `CategoryPicker.jsx` - Chip-based category browser
- `Confetti.jsx` - Celebration animation
- `Podium.jsx` - Winner display component
