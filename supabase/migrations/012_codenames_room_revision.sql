-- Prevent concurrent Codenames clients from silently overwriting room state.
ALTER TABLE games.codenames_rooms
  ADD COLUMN IF NOT EXISTS revision BIGINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN games.codenames_rooms.revision IS
  'Incremented by clients using compare-and-swap room mutations';
