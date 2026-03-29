-- Chroma Challenges - Color Memory Game
-- Simple scores table for challenge mode (authenticated users)

CREATE TABLE IF NOT EXISTS games.chroma_challenges (
  id SERIAL PRIMARY KEY,
  challenge_code TEXT NOT NULL,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  scores JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Array of 5 round scores
  total_score NUMERIC NOT NULL DEFAULT 0,
  difficulty TEXT NOT NULL DEFAULT 'easy',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_code, player_id)           -- One entry per player per challenge
);

ALTER TABLE games.chroma_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read chroma challenges"
  ON games.chroma_challenges FOR SELECT USING (true);

CREATE POLICY "Anyone can insert chroma challenges"
  ON games.chroma_challenges FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update chroma challenges"
  ON games.chroma_challenges FOR UPDATE USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS chroma_challenges_code_idx
  ON games.chroma_challenges (challenge_code);

CREATE INDEX IF NOT EXISTS chroma_challenges_created_at_idx
  ON games.chroma_challenges (created_at);

-- Cleanup old challenges (7 days)
CREATE OR REPLACE FUNCTION games.cleanup_old_chroma_challenges()
RETURNS void AS $$
BEGIN
  DELETE FROM games.chroma_challenges
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;
