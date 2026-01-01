-- Hot Take Rooms - Party Game
-- Table for multiplayer Hot Take game rooms

-- Ensure games schema exists
CREATE SCHEMA IF NOT EXISTS games;

-- Drop old table if migrating (uncomment if needed)
-- DROP TABLE IF EXISTS games.rooms;

CREATE TABLE IF NOT EXISTS games.hottake_rooms (
  code TEXT PRIMARY KEY,                    -- 5 chars: 4 letters + 1 digit (e.g., "A3XK1")
  phase TEXT NOT NULL DEFAULT 'lobby'
    CHECK (phase IN ('lobby', 'playing', 'confirming', 'revealed')),
  round INTEGER NOT NULL DEFAULT 1,
  category TEXT,                            -- Selected category for the round
  mode TEXT NOT NULL DEFAULT 'table'
    CHECK (mode IN ('table', 'remote')),    -- 'table' = physical, 'remote' = virtual board
  players JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,       -- Game-specific settings and data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE games.hottake_rooms ENABLE ROW LEVEL SECURITY;

-- Policies: Open access (rooms are protected by code knowledge)
CREATE POLICY "Anyone can read hottake rooms"
  ON games.hottake_rooms FOR SELECT USING (true);

CREATE POLICY "Anyone can create hottake rooms"
  ON games.hottake_rooms FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update hottake rooms"
  ON games.hottake_rooms FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete hottake rooms"
  ON games.hottake_rooms FOR DELETE USING (true);

-- Enable realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE games.hottake_rooms;

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS hottake_rooms_created_at_idx ON games.hottake_rooms (created_at);

-- Cleanup function for old rooms (24 hours)
CREATE OR REPLACE FUNCTION games.cleanup_old_hottake_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM games.hottake_rooms
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE games.hottake_rooms IS 'Multiplayer rooms for Hot Take party game';

/*
Players JSONB Structure:
[
  {
    "id": "uuid",           -- Player unique ID (from UserContext)
    "name": "Player Name",  -- Display name
    "number": null | 1-100, -- Secret number (null in lobby, assigned at round start)
    "hidden": true | false, -- Whether number is currently hidden
    "confirmed": false,     -- Whether player has locked in their position
    "slot": null | 0-N      -- Position on game board (remote mode only)
  }
]

Metadata JSONB Structure (extensible):
{
  "custom_categories": [],  -- User-defined categories
  "settings": {}            -- Game settings
}
*/
