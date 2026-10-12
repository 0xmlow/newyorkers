/* /api/skelly  ->  SKELLY CUP, the free picks board on top of Bryan Brinkman's Marble Run.
 *
 * POST {tournamentId, raceKey, marbleId, name, seed?}   one pick per ip per race. Free, nothing staked.
 *      The pick is checked against Marble Run's own /api/next: the race must still be announced, the gate
 *      not yet open, and the marble in the roster. A late pick is refused, so nobody picks a known result.
 *      `seed` is the 64 hex chars the page blew into the race (BLOW ON IT). We store it and only credit it
 *      if it later appears in that race's published clientSeeds, so the point is provable, not claimed.
 * GET  ?t=<tournamentId>   that tournament's board, scored here from Marble Run's /api/history.
 *      5 for the winner, 2 for second, 1 for a seed that made it into the race. Cached 30 s at the edge,
 *      which also keeps us far under Marble Run's 30 requests a minute.
 * GET  ?t=<tournamentId>&crowd=<raceKey>   how many people called each marble in that race (counts only).
 *
 * Same posture as score.js: small, no admin surface, the ip is hashed and never stored raw.
 * Marble Run says plainly it is not a betting product; neither is this. No entry fee, no stake, no odds.
 * Binding required on the Pages project: D1 named `DB`. Table: _build/api/schema_skelly.sql.
 */
const MR = "https://marblerun.fun";
const NAME_RE = /^[A-Za-z0-9._]{2,16}$/;
const KEY_RE = /^[a-z]+:\d{1,3}$/;
const SEED_RE = /^[0-9a-f]{64}$/;
const MAX_BODY = 2 * 1024;
const DAILY_CAP = 400;          // picks per ip per day; a tournament is 25 races and there are about 14 a day

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

async function mr(path, ttl) {
  const r = await fetch(MR + path, { cf: { cacheTtl: ttl, cacheEverything: true }, headers: { "user-agent": "n3wyorkers-skelly/1" } });
  if (!r.ok) throw new Error("marblerun " + r.status);
  return r.json();
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  try {
    if (!env.DB) return json({ ok: false, error: "storage not configured" }, 503);
    const q = new URL(request.url).searchParams;
    const t = parseInt(q.get("t") || "", 10);
    if (!Number.isInteger(t) || t < 1) return json({ ok: false, error: "tournament looks wrong" }, 400);

    // ?crowd=<raceKey>: how many people called each marble in the race at the gate. Counts only, no names.
    const crowdKey = q.get("crowd");
    if (crowdKey) {
      if (!KEY_RE.test(crowdKey)) return json({ ok: false, error: "race looks wrong" }, 400);
      const rows = (await env.DB.prepare(
        "SELECT marble_id, COUNT(*) AS n, SUM(CASE WHEN seed IS NOT NULL THEN 1 ELSE 0 END) AS blown FROM skelly_picks WHERE tournament_id = ? AND race_key = ? GROUP BY marble_id"
      ).bind(t, crowdKey).all()).results || [];
      const crowd = {}; let total = 0, blown = 0;
      for (const r of rows) { crowd[r.marble_id] = r.n; total += r.n; blown += r.blown || 0; }
      return json({ ok: true, tournamentId: t, raceKey: crowdKey, total, blown, crowd }, 200, "public, max-age=5");
    }

    const picks = (await env.DB.prepare(
      "SELECT name, race_key, marble_id, seed FROM skelly_picks WHERE tournament_id = ?"
    ).bind(t).all()).results || [];

    const hist = await mr("/api/history?limit=200", 30);
    const races = {};
    for (const r of hist.races || []) if (r.tournamentId === t) races[r.raceKey] = r;

    const board = {};
    for (const p of picks) {
      const r = races[p.race_key];
      const row = (board[p.name] ||= { name: p.name, points: 0, winners: 0, picks: 0, seeds: 0 });
      row.picks++;
      if (!r) continue;                                   // not raced yet, or older than the history window
      const rank = (r.results || []).find((x) => x.marbleId === p.marble_id)?.rank;
      if (rank === 1) { row.points += 5; row.winners++; }
      else if (rank === 2) row.points += 2;
      if (p.seed && (r.clientSeeds || []).map((s) => s.toLowerCase()).includes(p.seed)) { row.points += 1; row.seeds++; }
    }
    const top = Object.values(board).sort((a, b) => b.points - a.points || b.winners - a.winners).slice(0, 50);
    return json({ ok: true, tournamentId: t, players: Object.keys(board).length, top }, 200, "public, max-age=30");
  } catch (err) {
    return json({ ok: false, error: "server error" }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) return json({ ok: false, error: "storage not configured" }, 503);
    const raw = await request.text();
    if (raw.length > MAX_BODY) return json({ ok: false, error: "too large" }, 413);
    let d = {};
    try { d = JSON.parse(raw || "{}"); } catch { return json({ ok: false, error: "bad json" }, 400); }
    if (!d || typeof d !== "object") return json({ ok: false, error: "bad json" }, 400);
    if (d._trap) return json({ ok: true });

    const tournamentId = Number(d.tournamentId), marbleId = Number(d.marbleId);
    const raceKey = String(d.raceKey || ""), name = String(d.name || "").trim();
    const seed = d.seed ? String(d.seed).toLowerCase() : null;
    if (!Number.isInteger(tournamentId) || !Number.isInteger(marbleId) || !KEY_RE.test(raceKey)) return json({ ok: false, error: "pick looks wrong" }, 400);
    if (!NAME_RE.test(name)) return json({ ok: false, error: "name: 2 to 16 letters, numbers, dot or underscore" }, 400);
    if (seed && !SEED_RE.test(seed)) return json({ ok: false, error: "seed looks wrong" }, 400);

    // The gate rule. Ask Marble Run, never the browser, whether this race is still open.
    const next = await mr("/api/next", 2);
    const race = next.race;
    if (!race || next.tournamentId !== tournamentId || race.key !== raceKey) return json({ ok: false, error: "that race is not at the gate" }, 409);
    if (race.status !== "announced" || (race.scheduledStart && next.serverNow >= race.scheduledStart)) return json({ ok: false, error: "the gate is open, picks are closed" }, 409);
    if (!(race.roster || []).some((m) => m.marbleId === marbleId)) return json({ ok: false, error: "that marble is not in this race" }, 400);

    const ip = request.headers.get("cf-connecting-ip") || "";
    const ipHash = ip ? (await sha256(ip + "|newyorkers-skelly")).slice(0, 32) : null;
    const day = nyDay();
    if (ipHash) {
      const c = await env.DB.prepare("SELECT COUNT(*) AS n FROM skelly_picks WHERE ip_hash = ? AND day = ?").bind(ipHash, day).first();
      if (c && c.n >= DAILY_CAP) return json({ ok: false, error: "that is enough for today" }, 429);
    }

    // One pick per ip per race; a second pick for the same race replaces the first while the gate is shut.
    const id = (await sha256(`${tournamentId}|${raceKey}|${ipHash || name}`)).slice(0, 32);
    await env.DB.prepare(
      "INSERT INTO skelly_picks (id, at, day, tournament_id, race_key, marble_id, name, seed, ip_hash) VALUES (?,?,?,?,?,?,?,?,?) " +
      "ON CONFLICT(id) DO UPDATE SET marble_id = excluded.marble_id, name = excluded.name, seed = COALESCE(excluded.seed, skelly_picks.seed), at = excluded.at"
    ).bind(id, new Date().toISOString(), day, tournamentId, raceKey, marbleId, name, seed, ipHash).run();

    return json({ ok: true, closesAt: race.scheduledStart });
  } catch (err) {
    return json({ ok: false, error: "server error" }, 500);
  }
}
