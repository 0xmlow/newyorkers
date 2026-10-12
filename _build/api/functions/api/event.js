/* POST /api/event  { kind, key, payload? }
 * Records that a signed in person walked a room, found an egg, read an article or took the quiz.
 * Upserted, so visiting a room twice bumps a counter rather than making a second row.
 * Silently succeeds when nobody is signed in, because the site must work logged out.
 */
import { json, currentProfile, nowIso } from "./_lib/auth.js";

const KINDS = new Set(["room", "egg", "article", "quiz"]);

export async function onRequestPost({ request, env }) {
  const p = await currentProfile(request, env);
  if (!p) return json({ ok: true, recorded: false });
  let b = {};
  try { b = await request.json(); } catch { return json({ ok: false }, 400); }
  const kind = String(b.kind || "");
  const key = String(b.key || "").slice(0, 80);
  if (!KINDS.has(kind) || !key) return json({ ok: false, error: "bad event" }, 400);
  const now = nowIso();
  await env.DB.prepare(
    `INSERT INTO events (profile_id, kind, key, payload, first_at, last_at, count)
     VALUES (?,?,?,?,?,?,1)
     ON CONFLICT(profile_id, kind, key) DO UPDATE SET last_at = excluded.last_at, count = count + 1,
       payload = CASE WHEN excluded.payload != '{}' THEN excluded.payload ELSE events.payload END`
  ).bind(p.id, kind, key, JSON.stringify(b.payload || {}), now, now).run();
  return json({ ok: true, recorded: true });
}
