-- Chroma scoring v2 and global daily leaderboard support.
ALTER TABLE games.chroma_challenges
  ADD COLUMN IF NOT EXISTS guesses JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS scoring_version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

COMMENT ON COLUMN games.chroma_challenges.scores IS 'Three per-round scores from 0 to 100';
COMMENT ON COLUMN games.chroma_challenges.guesses IS 'Three submitted HSB guesses for audit/debugging';
COMMENT ON COLUMN games.chroma_challenges.scoring_version IS 'Scoring algorithm version used for this result';

CREATE INDEX IF NOT EXISTS chroma_challenges_leaderboard_idx
  ON games.chroma_challenges (challenge_code, scoring_version, total_score DESC, updated_at ASC);

-- Scores must go through the validation function instead of arbitrary row writes.
DROP POLICY IF EXISTS "Anyone can insert chroma challenges" ON games.chroma_challenges;
DROP POLICY IF EXISTS "Anyone can update chroma challenges" ON games.chroma_challenges;

CREATE OR REPLACE FUNCTION games.submit_chroma_score(
  p_challenge_code TEXT,
  p_player_id TEXT,
  p_player_name TEXT,
  p_scores JSONB,
  p_guesses JSONB,
  p_difficulty TEXT,
  p_scoring_version INTEGER
)
RETURNS games.chroma_challenges
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = games, pg_temp
AS $$
DECLARE
  calculated_total NUMERIC;
  saved_score games.chroma_challenges;
BEGIN
  IF p_challenge_code IS NULL OR LENGTH(p_challenge_code) < 5 OR LENGTH(p_challenge_code) > 64 THEN
    RAISE EXCEPTION 'invalid challenge code';
  END IF;

  IF p_player_id IS NULL OR LENGTH(p_player_id) < 8 OR LENGTH(p_player_id) > 128 THEN
    RAISE EXCEPTION 'invalid player id';
  END IF;

  p_player_name := BTRIM(p_player_name);
  IF p_player_name IS NULL OR LENGTH(p_player_name) < 1 OR LENGTH(p_player_name) > 32 THEN
    RAISE EXCEPTION 'invalid player name';
  END IF;

  IF p_scores IS NULL OR JSONB_TYPEOF(p_scores) <> 'array' THEN
    RAISE EXCEPTION 'scores must be an array';
  END IF;

  IF JSONB_ARRAY_LENGTH(p_scores) <> 3 THEN
    RAISE EXCEPTION 'exactly three round scores are required';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM JSONB_ARRAY_ELEMENTS(p_scores) AS entries(score)
    WHERE CASE
      WHEN JSONB_TYPEOF(score) <> 'number' THEN TRUE
      ELSE (score #>> '{}')::NUMERIC < 0 OR (score #>> '{}')::NUMERIC > 100
    END
  ) THEN
    RAISE EXCEPTION 'round scores must be numbers from 0 to 100';
  END IF;

  IF p_guesses IS NULL OR JSONB_TYPEOF(p_guesses) <> 'array' THEN
    RAISE EXCEPTION 'guesses must be an array';
  END IF;

  IF JSONB_ARRAY_LENGTH(p_guesses) <> 3 THEN
    RAISE EXCEPTION 'exactly three guesses are required';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM JSONB_ARRAY_ELEMENTS(p_guesses) AS entries(guess)
    WHERE CASE
      WHEN JSONB_TYPEOF(guess) <> 'array' THEN TRUE
      ELSE JSONB_ARRAY_LENGTH(guess) <> 3
    END
  ) THEN
    RAISE EXCEPTION 'each guess must contain hue, saturation, and brightness';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM JSONB_ARRAY_ELEMENTS(p_guesses) AS entries(guess)
    CROSS JOIN LATERAL JSONB_ARRAY_ELEMENTS(guess) WITH ORDINALITY AS channels(channel, position)
    WHERE CASE
      WHEN JSONB_TYPEOF(channel) <> 'number' THEN TRUE
      WHEN position = 1 THEN (channel #>> '{}')::NUMERIC < 0 OR (channel #>> '{}')::NUMERIC > 360
      ELSE (channel #>> '{}')::NUMERIC < 0 OR (channel #>> '{}')::NUMERIC > 100
    END
  ) THEN
    RAISE EXCEPTION 'guess channels are outside the HSB range';
  END IF;

  IF p_scoring_version <> 2 THEN
    RAISE EXCEPTION 'unsupported scoring version';
  END IF;

  SELECT ROUND(SUM((score #>> '{}')::NUMERIC), 1)
    INTO calculated_total
  FROM JSONB_ARRAY_ELEMENTS(p_scores) AS entries(score);

  INSERT INTO games.chroma_challenges (
    challenge_code,
    player_id,
    player_name,
    scores,
    guesses,
    total_score,
    difficulty,
    scoring_version,
    updated_at
  ) VALUES (
    p_challenge_code,
    p_player_id,
    p_player_name,
    p_scores,
    p_guesses,
    calculated_total,
    COALESCE(NULLIF(BTRIM(p_difficulty), ''), 'standard'),
    p_scoring_version,
    NOW()
  )
  ON CONFLICT (challenge_code, player_id) DO UPDATE
  SET
    player_name = EXCLUDED.player_name,
    scores = EXCLUDED.scores,
    guesses = EXCLUDED.guesses,
    total_score = EXCLUDED.total_score,
    difficulty = EXCLUDED.difficulty,
    scoring_version = EXCLUDED.scoring_version,
    updated_at = NOW()
  WHERE games.chroma_challenges.scoring_version <> EXCLUDED.scoring_version
     OR EXCLUDED.total_score > games.chroma_challenges.total_score;

  SELECT *
    INTO saved_score
  FROM games.chroma_challenges
  WHERE challenge_code = p_challenge_code
    AND player_id = p_player_id;

  RETURN saved_score;
END;
$$;

REVOKE ALL ON FUNCTION games.submit_chroma_score(TEXT, TEXT, TEXT, JSONB, JSONB, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION games.submit_chroma_score(TEXT, TEXT, TEXT, JSONB, JSONB, TEXT, INTEGER)
  TO anon, authenticated;
