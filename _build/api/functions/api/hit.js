/* POST /api/hit  ->  one anonymous row in D1.
 *
 * First party analytics with nothing to opt out of: no cookie, no ip, no user agent string, no fingerprint.
 * A row is a kind (view, mint_click, ...), a key (the path or the drop taken), the path it came from, a
 * ?ref= code if the link carried one, phone or desktop, and the country Cloudflare already knows. The ip
 * is hashed with a salt only to rate limit, and the hash is thrown away with the request; it is never stored.
 * Same shape as submit.js on purpose: validate, rate limit, insert, say nothing back.
 *
 * Binding required on the Pages project: D1 named `DB`, table from _build/api/schema_hits.sql.
 */
const KINDS = new Set(["view", "mint_click", "share", "egg", "room", "quiz", "save", "print_click", "stop", "arcade", "score", "card", "skelly", "oracle", "ticket"]);
const MAX_BODY = 2 * 1024;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "cache-control": "no-store",
    },
  });

async function sha256(s) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) return json({ ok: false, error: "storage not configured" }, 503);
    const raw = await request.text();
    if (raw.length > MAX_BODY) return json({ ok: false, error: "too large" }, 413);
    let data = {};
    try { data = JSON.parse(raw || "{}"); } catch { return json({ ok: false, error: "bad json" }, 400); }

    const kind = String(data.kind || "").toLowerCase().slice(0, 24);
    if (!KINDS.has(kind)) return json({ ok: false, error: "unknown kind" }, 400);
    const key = String(data.key || "").slice(0, 120);
    const path = String(data.path || "").slice(0, 160);
    const ref = String(data.ref || "").replace(/[^A-Za-z0-9_.:-]/g, "").slice(0, 80) || null;
    if (!key) return json({ ok: false, error: "no key" }, 400);

    // Phone or desktop is all that is kept of the user agent; the string itself is a fingerprint.
    const ua = request.headers.get("user-agent") || "";
    const uaClass = /Mobi|Android|iPhone|iPad/i.test(ua) ? "phone" : "desktop";
    const country = (request.cf && request.cf.country) ? String(request.cf.country).slice(0, 2) : null;

    // Light rate limit: at most 120 hits a minute from one ip hash. The hash lives only in this request.
    const ip = request.headers.get("cf-connecting-ip") || "";
    if (ip) {
      const ipHash = (await sha256(ip + "|newyorkers-hit|" + new Date().toISOString().slice(0, 16))).slice(0, 24);
      const r = await env.DB.prepare("SELECT n FROM hit_rate WHERE k = ?").bind(ipHash).first();
      if (r && r.n >= 120) return json({ ok: true, dropped: true });
      await env.DB.prepare(
        "INSERT INTO hit_rate (k, n, at) VALUES (?, 1, ?) ON CONFLICT(k) DO UPDATE SET n = n + 1"
      ).bind(ipHash, new Date().toISOString()).run();
    }

    await env.DB.prepare(
      "INSERT INTO hits (id, at, path, kind, key, ref, ua_class, country) VALUES (?,?,?,?,?,?,?,?)"
    ).bind(crypto.randomUUID(), new Date().toISOString(), path, kind, key, ref, uaClass, country).run();

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: "server error" }, 500);
  }
}
