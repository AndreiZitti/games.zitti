-- Number Arrangement Party Game - Supabase Schema
-- Run this in your Supabase SQL editor to set up the database

-- Create the rooms table
CREATE TABLE IF NOT EXISTS rooms (
  code TEXT PRIMARY KEY,
  phase TEXT NOT NULL DEFAULT 'lobby',
  round INT NOT NULL DEFAULT 1,
  category TEXT,
  mode TEXT NOT NULL DEFAULT 'table',  -- 'table' or 'remote'
  players JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can create a room
CREATE POLICY "Anyone can create rooms"
  ON rooms FOR INSERT
  WITH CHECK (true);

-- Policy: Anyone can read a room (they need the code anyway)
CREATE POLICY "Anyone can read rooms"
  ON rooms FOR SELECT
  USING (true);

-- Policy: Anyone can update a room (game state changes)
CREATE POLICY "Anyone can update rooms"
  ON rooms FOR UPDATE
  USING (true);

-- Policy: Anyone can delete a room (for cleanup)
CREATE POLICY "Anyone can delete rooms"
  ON rooms FOR DELETE
  USING (true);

-- Enable realtime for the rooms table
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;

-- If you already have the table and need to add the mode column:
-- ALTER TABLE rooms ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'table';

-- Optional: Create a function to clean up old rooms (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM rooms WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to run cleanup daily
-- Note: This requires pg_cron extension to be enabled in Supabase
-- SELECT cron.schedule('cleanup-old-rooms', '0 0 * * *', 'SELECT cleanup_old_rooms()');

/*
Players JSONB Structure:
[
  {
    "id": "uuid",           -- Player's unique ID (stored in localStorage)
    "name": "Player Name",  -- Display name
    "number": null | 1-100, -- Secret number (null in lobby, assigned when round starts)
    "hidden": true | false, -- Whether number is currently hidden
    "confirmed": false,     -- Whether player has locked in their position
    "slot": null | 0-N      -- Position on the game board (remote mode only)
  }
]

Game Modes:
- "table"  : Physical mode - arrange phones on a table
- "remote" : Virtual mode - drag cards on a shared game board

Game Phases:
- "lobby"      : Waiting for players, host sets category and mode
- "playing"    : Players have numbers, arranging themselves
- "confirming" : At least one player has confirmed position
- "revealed"   : All players confirmed, numbers shown
*/
