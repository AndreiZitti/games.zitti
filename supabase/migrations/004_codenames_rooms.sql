-- Codenames (Nume de Cod) Rooms - Party Game
-- Table for multiplayer Codenames game rooms

CREATE TABLE IF NOT EXISTS games.codenames_rooms (
  code TEXT PRIMARY KEY,                    -- 5 chars: 4 letters + 1 digit (e.g., "DUCK7")
  phase TEXT NOT NULL DEFAULT 'lobby'
    CHECK (phase IN ('lobby', 'team-setup', 'playing', 'ended')),
  language TEXT NOT NULL DEFAULT 'en'
    CHECK (language IN ('en', 'ro')),

  -- Players with team assignments
  players JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Game board (set when game starts)
  board JSONB DEFAULT NULL,                 -- 25 words array
  key_card JSONB DEFAULT NULL,              -- Position assignments for each team

  -- Turn state
  current_team TEXT CHECK (current_team IN ('red', 'blue', NULL)),
  current_clue JSONB DEFAULT NULL,          -- { word, number, givenBy }
  guesses_remaining INTEGER DEFAULT 0,
  revealed_cards JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Array of revealed positions [0-24]

  -- Team spymasters (player IDs)
  red_spymaster TEXT DEFAULT NULL,
  blue_spymaster TEXT DEFAULT NULL,

  -- Score tracking (cards remaining to find)
  red_remaining INTEGER DEFAULT 0,
  blue_remaining INTEGER DEFAULT 0,

  -- Game result
  winner TEXT CHECK (winner IN ('red', 'blue', NULL)),
  win_reason TEXT CHECK (win_reason IN ('cards', 'assassin', NULL)),

  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE games.codenames_rooms ENABLE ROW LEVEL SECURITY;

-- Policies: Open access (rooms are protected by code knowledge)
CREATE POLICY "Anyone can read codenames rooms"
  ON games.codenames_rooms FOR SELECT USING (true);

CREATE POLICY "Anyone can create codenames rooms"
  ON games.codenames_rooms FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update codenames rooms"
  ON games.codenames_rooms FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete codenames rooms"
  ON games.codenames_rooms FOR DELETE USING (true);

-- Enable realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE games.codenames_rooms;

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS codenames_rooms_created_at_idx ON games.codenames_rooms (created_at);

-- Cleanup function for old rooms (24 hours)
CREATE OR REPLACE FUNCTION games.cleanup_old_codenames_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM games.codenames_rooms
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE games.codenames_rooms IS 'Multiplayer rooms for Codenames (Nume de Cod) party game';

/*
Players JSONB Structure:
[
  {
    "id": "uuid",                    -- Player unique ID (from UserContext)
    "name": "Player Name",           -- Display name
    "team": "red" | "blue" | null    -- Team assignment (null = unassigned in lobby)
  }
]

Board JSONB Structure:
[
  "WORD1", "WORD2", "WORD3", ... (25 words total)
]

Key Card JSONB Structure:
{
  "red": [0, 3, 5, ...],        -- Positions (9 or 8 cards)
  "blue": [1, 2, 6, ...],       -- Positions (8 or 9 cards)
  "neutral": [4, 8, 11, ...],   -- Positions (7 cards)
  "assassin": 24,               -- Single position
  "firstTeam": "red" | "blue"   -- Team that goes first (has 9 cards)
}

Current Clue JSONB Structure:
{
  "word": "ANIMAL",             -- The clue word
  "number": 3,                  -- Number of related cards (0 = unlimited)
  "givenBy": "uuid"             -- Spymaster who gave the clue
}

Revealed Cards JSONB Structure:
[0, 5, 12, ...]                 -- Array of board positions that have been revealed
*/
