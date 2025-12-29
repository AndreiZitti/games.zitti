# CLAUDE.md - games.zitti

## Project Overview

A collection of 3 party games built with Next.js 16 (App Router) and Supabase:

1. **Hot Take** (`/games/hot-take`) - Players get secret numbers 1-100 and must describe where they stand on a spectrum
2. **Like Minded** (`/games/like-minded`) - Wavelength-style psychic guessing game with spectrums
3. **Secret Hitler** (`/games/secret-hitler`) - Social deduction game (uses external WebSocket server)

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Database**: Supabase (Hot Take & Like Minded), External WebSocket server (Secret Hitler)
- **Styling**: CSS with CSS variables, Framer Motion for animations
- **Language**: TypeScript for core files, JavaScript for game logic

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with UserProvider
│   ├── page.tsx            # Home page (GameHub)
│   ├── globals.css         # Shared styles (~900 lines)
│   └── games/
│       ├── hot-take/page.tsx
│       ├── like-minded/page.tsx
│       └── secret-hitler/page.tsx
├── components/             # Shared components
│   ├── GameHub.tsx         # Main game selection hub
│   └── Profile.tsx         # User profile modal
├── contexts/
│   └── UserContext.tsx     # Global user state, auth, localStorage
├── lib/
│   ├── random.js           # Seeded RNG, room code generation
│   └── supabase/
│       └── client.ts       # Supabase browser client (singleton + factory)
└── games/
    ├── hot-take/
    │   ├── hot-take.css    # Hot Take styles (~1000 lines)
    │   └── ...
    ├── like-minded/
    │   ├── like-minded.css # Like Minded styles (~1150 lines)
    │   └── ...
    └── secret-hitler/      # Secret Hitler game
```

## Game Architectures

### Hot Take
- **Location**: `src/games/hot-take/`
- **Entry**: `HotTakeGame.jsx`
- **State Management**: `hooks/useRoom.js` - Supabase realtime subscriptions
- **Modes**: Multiplayer (table mode, remote mode), Single Device (pass-and-play)
- **Database**: `games.rooms` table with realtime

### Like Minded
- **Location**: `src/games/like-minded/`
- **Entry**: `LikeMindedGame.jsx`
- **State Management**:
  - `hooks/useWavelengthRoom.js` - Multiplayer via Supabase realtime
  - `hooks/useGameState.js` - Single device mode with localStorage persistence
- **Database**: `games.wavelength_rooms` table with realtime
- **Data**: `data/spectrums.js` - Spectrum definitions

### Secret Hitler
- **Location**: `src/games/secret-hitler/`
- **Entry**: `SecretHitlerGame.tsx` → dynamically imports `App.tsx`
- **Architecture**: Class component (`App.tsx`) with WebSocket connection
- **Server**: External WebSocket server at `game-api.zitti.ro`
- **State**: Component state + WebSocket messages
- **Notable**: Uses `js-cookie` for session, has bot support (`BotManager.ts`)
- **Art Themes**: Original, Voldemort (WIP)

## Supabase Schema

Games use the `games` schema:
- `games.rooms` - Hot Take rooms
- `games.wavelength_rooms` - Like Minded rooms
- `games.game_stats` - Player statistics (games played/hosted)

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://supabase.zitti.ro
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
```

Secret Hitler also uses (hardcoded in constants):
- `SERVER_ADDRESS`: `game-api.zitti.ro`

## Known Issues & Technical Debt

### Remaining Issues

1. **Duplicate Room Code Generators** (minor)
   - `src/lib/random.js`: 5 chars (4 letters + 1 digit) - used by Hot Take
   - `like-minded/hooks/useWavelengthRoom.js`: 4 letters - used by Like Minded
   - Different formats intentional? Could unify if desired.

2. **Secret Hitler `App.tsx` login page**
   - Has full login UI but `SecretHitlerGame.tsx` bypasses it by passing `initialName` and `initialLobby` props directly.

3. **Mixed TypeScript/JavaScript**
   - Core: TypeScript
   - Hot Take: All JavaScript
   - Like Minded: All JavaScript
   - Secret Hitler: Mixed
   - **Consider**: Full TypeScript migration

4. **Secret Hitler Class Component**
   - `App.tsx` is a large class component (~1700 lines)
   - Uses animation queue pattern that could be React state
   - **Consider**: Refactor to functional component with hooks

### Recently Fixed (Dec 2024)

- **Unified Supabase Client**: All games now use `@/lib/supabase/client`
- **Unified localStorage**: Game hooks now use `UserContext` instead of duplicate localStorage code
- **CSS Split**: `globals.css` split into per-game CSS files (was 3000+ lines, now ~900 shared)
- **Dead Code Removed**: `proxy.ts`, `supabase.js`, `supabase/server.ts`, `supabase/middleware.ts`

## Patterns to Follow

### Creating New Games

1. Create game folder: `src/games/<game-name>/`
2. Main component: `<GameName>Game.jsx`
3. Create game CSS: `<game-name>.css` and import in main component
4. Add page: `src/app/games/<game-name>/page.tsx`
5. Add to `GameHub.tsx` games array
6. Use `useUser()` from `@/contexts/UserContext` for player identity (id, name, stats)
7. Use `supabase` from `@/lib/supabase/client` for database access

### Supabase Realtime Pattern

```javascript
import { supabase } from '@/lib/supabase/client'

// Subscribe to room changes
const channel = supabase
  .channel(`room:${roomCode}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'games',
      table: 'rooms',
      filter: `code=eq.${roomCode}`
    },
    (payload) => {
      if (payload.new) setRoom(payload.new)
    }
  )
  .subscribe()

// Cleanup
return () => supabase.removeChannel(channel)
```

### Room State Pattern

Both Hot Take and Like Minded follow similar patterns:
- Room has `phase` field (lobby → playing → revealed/end)
- `players` array stored in room row
- Host is first player in array
- All state updates go through Supabase (single source of truth)

## Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

## URLs

- Production: `https://games.zitti.ro`
- Supabase: `https://supabase.zitti.ro`
- Secret Hitler API: `wss://game-api.zitti.ro`

## Game Completion Status (Estimated)

| Game | Status | Notes |
|------|--------|-------|
| Hot Take | ~85% | Working, needs polish/testing |
| Like Minded | ~80% | Working, multiplayer needs testing |
| Secret Hitler | ~75% | External server dependency, "Coming Soon" in UI |
