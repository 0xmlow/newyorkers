-- Form intake for newyorkers. One table, every form, so a new form needs no migration.
-- The payload is JSON so the shape can change without the schema changing; the columns that are
-- pulled out are the ones you will actually filter and sort on.
CREATE TABLE IF NOT EXISTS submissions (
  id           TEXT PRIMARY KEY,
  kind         TEXT NOT NULL,              -- allowlist | census | nomination
  submitted_at TEXT NOT NULL,
  name         TEXT,
  email        TEXT,
  wallet       TEXT,
  mint_count   INTEGER,
  ref          TEXT,
  source       TEXT,
  ip_hash      TEXT,                       -- hashed, never the raw address
  payload      TEXT NOT NULL DEFAULT '{}'  -- everything else, verbatim
);
CREATE INDEX IF NOT EXISTS idx_sub_kind ON submissions(kind, submitted_at);
CREATE INDEX IF NOT EXISTS idx_sub_email ON submissions(email);
CREATE INDEX IF NOT EXISTS idx_sub_wallet ON submissions(wallet);
CREATE INDEX IF NOT EXISTS idx_sub_ref ON submissions(ref);
