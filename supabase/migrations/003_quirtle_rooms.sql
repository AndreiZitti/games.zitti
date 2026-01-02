-- Quirtle Rooms - Tile Matching Game
-- Table for multiplayer Quirtle game rooms

CREATE TABLE IF NOT EXISTS games.quirtle_rooms (
  code TEXT PRIMARY KEY,
  phase TEXT NOT NULL DEFAULT 'lobby'
    CHECK (phase IN ('lobby', 'playing', 'ended')),
  players JSONB NOT NULL DEFAULT '[]'::jsonb,
  host_id TEXT NOT NULL,
  board JSONB NOT NULL DEFAULT '{"tiles": []}'::jsonb,
  bag JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_player_index INTEGER NOT NULL DEFAULT 0,
  turn_number INTEGER NOT NULL DEFAULT 0,
  last_score JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE games.quirtle_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read quirtle rooms"
  ON games.quirtle_rooms FOR SELECT USING (true);

CREATE POLICY "Anyone can create quirtle rooms"
  ON games.quirtle_rooms FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update quirtle rooms"
  ON games.quirtle_rooms FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete quirtle rooms"
  ON games.quirtle_rooms FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE games.quirtle_rooms;

CREATE INDEX IF NOT EXISTS quirtle_rooms_created_at_idx ON games.quirtle_rooms (created_at);

CREATE OR REPLACE FUNCTION games.cleanup_old_quirtle_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM games.quirtle_rooms
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE games.quirtle_rooms IS 'Multiplayer rooms for Quirtle tile-matching game';

/*
Players JSONB Structure:
[
  {
    "id": "uuid",
    "name": "Player Name",
    "hand": [{"shape": "circle", "color": "red"}, ...],
    "score": 0
  }
]

Board JSONB Structure:
{
  "tiles": [
    {"x": 0, "y": 0, "shape": "circle", "color": "red"},
    ...
  ]
}

Bag JSONB Structure:
[
  {"shape": "circle", "color": "red"},
  ...
]

Last Score JSONB Structure (for UI feedback):
{
  "points": 12,
  "lines": [{"length": 6, "isQwirkle": true}],
  "playerId": "uuid"
}
*/
