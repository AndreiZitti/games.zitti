-- Create wavelength_rooms table for Like Minded multiplayer game
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS wavelength_rooms (
  code TEXT PRIMARY KEY,
  phase TEXT DEFAULT 'lobby' CHECK (phase IN ('lobby', 'psychic', 'guessing', 'reveal', 'end')),
  round INTEGER DEFAULT 1,
  current_psychic TEXT,
  spectrum JSONB, -- { left: "Hot", right: "Cold", id: 1 }
  target INTEGER CHECK (target >= 0 AND target <= 100),
  clue TEXT,
  guess INTEGER CHECK (guess >= 0 AND guess <= 100),
  team_score INTEGER DEFAULT 0,
  game_score INTEGER DEFAULT 0,
  players JSONB DEFAULT '[]'::jsonb, -- ["Andrei", "Max", "Lisa"]
  used_cards JSONB DEFAULT '[]'::jsonb, -- [1, 5, 12] - spectrum IDs already used
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE wavelength_rooms ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read rooms
CREATE POLICY "Anyone can read wavelength rooms"
  ON wavelength_rooms
  FOR SELECT
  USING (true);

-- Allow anyone to insert rooms
CREATE POLICY "Anyone can create wavelength rooms"
  ON wavelength_rooms
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update rooms
CREATE POLICY "Anyone can update wavelength rooms"
  ON wavelength_rooms
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow anyone to delete rooms
CREATE POLICY "Anyone can delete wavelength rooms"
  ON wavelength_rooms
  FOR DELETE
  USING (true);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE wavelength_rooms;

-- Create index on created_at for cleanup queries
CREATE INDEX IF NOT EXISTS wavelength_rooms_created_at_idx ON wavelength_rooms (created_at);

-- Optional: Function to cleanup old rooms (rooms older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_wavelength_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM wavelength_rooms
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Optional: Comment on table
COMMENT ON TABLE wavelength_rooms IS 'Multiplayer rooms for Like Minded (Wavelength clone) game';
