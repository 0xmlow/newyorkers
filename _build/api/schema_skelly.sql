-- SKELLY CUP free picks. One table, written and read by functions/api/skelly.js, read by skelly.html.
-- A pick is one marble for one Marble Run race, made before the gate. Nothing is staked.
-- Apply once from GO LIVE PACKAGE/ (beside wrangler.toml, which binds the database as DB):
--   npx wrangler d1 execute new-yorkers --remote --file "../NEW YORKERS SITE/_build/api/schema_skelly.sql"
CREATE TABLE IF NOT EXISTS skelly_picks (
  id             TEXT PRIMARY KEY,     -- sha256(tournament | race | ip hash), so one pick per ip per race
  at             TEXT NOT NULL,        -- ISO timestamp, UTC
  day            TEXT NOT NULL,        -- YYYY-MM-DD, America/New_York, for the rate limit
  tournament_id  INTEGER NOT NULL,
  race_key       TEXT NOT NULL,        -- heats:7, semis:1, final:0
  marble_id      INTEGER NOT NULL,
  name           TEXT NOT NULL,        -- 2 to 16 chars, [A-Za-z0-9._]
  seed           TEXT,                 -- the 64 hex BLOW ON IT seed, credited only if Marble Run published it
  ip_hash        TEXT
);
CREATE INDEX IF NOT EXISTS idx_skelly_t ON skelly_picks(tournament_id);
CREATE INDEX IF NOT EXISTS idx_skelly_ip ON skelly_picks(ip_hash, day);
