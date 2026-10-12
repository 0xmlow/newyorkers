-- MLOWTAR receipt numbers: one row per reading seed, in order of arrival. The number printed on the receipt
-- is a fixed shuffle of 1..10000 indexed by id (functions/api/serial.js), so numbers never repeat and a
-- replayed link keeps its number. Create before deploying serial.js:
--   npx wrangler d1 execute new-yorkers --remote --file "../NEW YORKERS SITE/_build/api/schema_mlowtar.sql"
CREATE TABLE IF NOT EXISTS mlowtar_serials (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  seed TEXT NOT NULL UNIQUE,
  at   TEXT NOT NULL DEFAULT (datetime('now'))
);
