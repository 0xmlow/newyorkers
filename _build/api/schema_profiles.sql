-- Collector profiles. Phase 1 of COLLECTOR PLATFORM 2026-09-07.
-- The stable key is the Privy DID. Wallets are stored only once Privy has verified ownership.

CREATE TABLE IF NOT EXISTS profiles (
  id              TEXT PRIMARY KEY,
  privy_did       TEXT NOT NULL UNIQUE,
  email           TEXT,
  display_name    TEXT,
  handle_x         TEXT,
  handle_discord   TEXT,
  handle_telegram  TEXT,
  ref_code        TEXT NOT NULL UNIQUE,
  referred_by     TEXT,             -- a ref_code, set once and never updated
  referred_at     TEXT,
  created_at      TEXT NOT NULL,
  last_seen_at    TEXT
);
CREATE INDEX IF NOT EXISTS idx_profiles_ref ON profiles(ref_code);

-- One row per wallet Privy has verified. Globally unique, so two profiles cannot claim the same one.
CREATE TABLE IF NOT EXISTS wallets (
  address     TEXT PRIMARY KEY,     -- lowercased, always
  profile_id  TEXT NOT NULL,
  proved_at   TEXT NOT NULL,
  is_primary  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_wallets_profile ON wallets(profile_id);

-- What a person did on the site. One row per distinct thing, upserted, so a room visited
-- twice does not become two rows.
CREATE TABLE IF NOT EXISTS events (
  profile_id  TEXT NOT NULL,
  kind        TEXT NOT NULL,        -- room | egg | quiz | article
  key         TEXT NOT NULL,        -- room id, egg name, piece id, article slug
  payload     TEXT NOT NULL DEFAULT '{}',
  first_at    TEXT NOT NULL,
  last_at     TEXT NOT NULL,
  count       INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (profile_id, kind, key)
);
CREATE INDEX IF NOT EXISTS idx_events_kind ON events(profile_id, kind);
