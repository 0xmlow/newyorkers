/* /api/score  ->  THE ARCADE's daily board, one D1 table.
 *
 * POST {game, score, name}   one row. Validates, rate limits by hashed ip, stores. Nothing else.
 * GET  ?game=door&day=YYYY-MM-DD   the day's top ten for that game (day defaults to today in New York).
 *
 * Same posture as submit.js: deliberately small, no admin surface, the ip is hashed and never stored raw.
 * The board is public by design (the page reads it), so GET is cached for thirty seconds at the edge.
 * The day is the New York calendar day, the same rule the page and the games use, so a score at 11:59 PM
 * in New York lands on the day it was played.
 *
 * Binding required on the Pages project: D1 named `DB`. Table: _build/api/schema_scores.sql.
 */
// bodega is playable but has no board: its receipt total is deterministic from the typed name, so a board would be brute forceable
// ringer, drop, dash and skee are THE SPIRAL's marble games (spiral.html), played with Bryan Brinkman's Marble Run marbles
const GAMES = new Set(["door", "lasttrain", "ringer", "drop", "dash", "skee"]);
const NAME_RE = /^[A-Za-z0-9._]{2,16}$/;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_BODY = 2 * 1024;
const MAX_SCORE = 10000000;
const DAILY_CAP = 30;            // submissions per ip per New York day, across the three games

const json = (obj, status = 200, cache = "no-store") =>
  new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "cache-control": cache,
    },
  });

const nyDay = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(d);

async function sha256(s) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  try {
    if (!env.DB) return json({ ok: false, error: "storage not configured" }, 503);
    const u = new URL(request.url);
    const game = String(u.searchParams.get("game") || "").toLowerCase();
    if (!GAMES.has(game)) return json({ ok: false, error: "unknown game" }, 400);
    const day = u.searchParams.get("day") || nyDay();
    if (!DAY_RE.test(day)) return json({ ok: false, error: "day looks wrong" }, 400);
    const r = await env.DB.prepare(
      "SELECT name, score, at FROM scores WHERE game = ? AND day = ? ORDER BY score DESC, at ASC LIMIT 10"
    ).bind(game, day).all();
    const top = (r.results || []).map((x) => ({ name: x.name, score: x.score, at: x.at }));
    return json({ ok: true, game, day, top }, 200, "public, max-age=30");
  } catch (err) {
    return json({ ok: false, error: "server error" }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) return json({ ok: false, error: "storage not configured" }, 503);

    const raw = await request.text();
    if (raw.length > MAX_BODY) return json({ ok: false, error: "too large" }, 413);
    let data = {};
    try { data = JSON.parse(raw || "{}"); } catch { return json({ ok: false, error: "bad json" }, 400); }
    if (!data || typeof data !== "object") return json({ ok: false, error: "bad json" }, 400);

    // A person, not a script. A real game never fills this.
    if (data._trap) return json({ ok: true });

    const game = String(data.game || "").toLowerCase();
    if (!GAMES.has(game)) return json({ ok: false, error: "unknown game" }, 400);

    const score = Number(data.score);
    if (!Number.isInteger(score) || score < 0 || score > MAX_SCORE) return json({ ok: false, error: "score looks wrong" }, 400);

    const name = String(data.name || "").trim();
    if (!NAME_RE.test(name)) return json({ ok: false, error: "name: 2 to 16 letters, numbers, dot or underscore" }, 400);

    const ip = request.headers.get("cf-connecting-ip") || "";
    const ipHash = ip ? (await sha256(ip + "|newyorkers-arcade")).slice(0, 32) : null;
    const day = nyDay();

    // Rate limit: thirty a day from one ip, over every game. Enough to play, not enough to flood.
    if (ipHash) {
      const r = await env.DB.prepare(
        "SELECT COUNT(*) AS n FROM scores WHERE ip_hash = ? AND day = ?"
      ).bind(ipHash, day).first();
      if (r && r.n >= DAILY_CAP) return json({ ok: false, error: "that is enough for today, come back tomorrow" }, 429);
    }

    await env.DB.prepare(
      "INSERT INTO scores (id, at, day, game, name, score, ip_hash) VALUES (?,?,?,?,?,?,?)"
    ).bind(crypto.randomUUID(), new Date().toISOString(), day, game, name, score, ipHash).run();

    // Where it landed today, so the game can say so. One count, nothing read back about anyone else.
    const above = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM scores WHERE game = ? AND day = ? AND score > ?"
    ).bind(game, day, score).first();

    return json({ ok: true, day, rank: (above && above.n ? above.n : 0) + 1 });
  } catch (err) {
    return json({ ok: false, error: "server error" }, 500);
  }
}
