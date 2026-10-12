-- First party hits for newyorkers (functions/api/hit.js). Anonymous by construction: no ip, no cookie,
-- no user agent string, no profile. A row is where, what, which drop, which ref code, phone or desktop,
-- and the country Cloudflare attaches to the request. The questions this answers are "which pages pull",
-- "which mint button gets pressed" and "which share link brought people", nothing about a person.
CREATE TABLE IF NOT EXISTS hits (
  id        TEXT PRIMARY KEY,
  at        TEXT NOT NULL,                 -- ISO time of the hit
  path      TEXT,                          -- the page it came from
  kind      TEXT NOT NULL,                 -- view | mint_click | share | egg | room | quiz | save | print_click
  key       TEXT NOT NULL,                 -- the path for a view, the drop (census | keystone) for a mint click
  ref       TEXT,                          -- ?ref= on the url, if any
  ua_class  TEXT,                          -- phone | desktop, and nothing finer
  country   TEXT                           -- two letter code from request.cf, if present
);
CREATE INDEX IF NOT EXISTS idx_hits_kind_at ON hits(kind, at);
CREATE INDEX IF NOT EXISTS idx_hits_ref ON hits(ref);

-- Per minute counters for the rate limit. The key is a salted hash of ip and minute, so a row is useless
-- after sixty seconds. Clear it now and then: DELETE FROM hit_rate WHERE at < datetime('now', '-1 hour');
CREATE TABLE IF NOT EXISTS hit_rate (
  k   TEXT PRIMARY KEY,
  n   INTEGER NOT NULL DEFAULT 0,
  at  TEXT NOT NULL
);
