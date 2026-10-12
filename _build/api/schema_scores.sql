-- THE ARCADE's daily board. One table, written by functions/api/score.js, read by arcade.html.
-- `day` is the New York calendar day the score was played on; the board is per game per day.
-- Apply once from GO LIVE PACKAGE/ (beside wrangler.toml, which binds the database as DB):
--   npx wrangler d1 execute new-yorkers --remote --file "../NEW YORKERS SITE/_build/api/schema_scores.sql"
CREATE TABLE IF NOT EXISTS scores (
  id       TEXT PRIMARY KEY,
  at       TEXT NOT NULL,              -- ISO timestamp, UTC
  day      TEXT NOT NULL,              -- YYYY-MM-DD, America/New_York
  game     TEXT NOT NULL,              -- door | lasttrain | bodega
  name     TEXT NOT NULL,              -- 2 to 16 chars, [A-Za-z0-9._]
  score    INTEGER NOT NULL,           -- 0 to 10,000,000; bodega stores the receipt total in cents
  ip_hash  TEXT                        -- hashed, never the raw address
);
CREATE INDEX IF NOT EXISTS idx_scores_board ON scores(game, day, score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_ip ON scores(ip_hash, day);
