/* POST /api/submit  ->  one row in D1.
 *
 * Deliberately small. It validates, rate limits, hashes the ip, and stores. It does not email,
 * does not read anything back, and has no admin surface, because every one of those is a way in.
 *
 * Binding required on the Pages project: D1 named `DB`.
 */
const KINDS = new Set(["allowlist", "census", "nomination", "survey"]);
const MAX_BODY = 24 * 1024;

const json = (obj, status = 200, origin = "*") =>
  new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": origin,
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

    const ct = request.headers.get("content-type") || "";
    const raw = await request.text();
    if (raw.length > MAX_BODY) return json({ ok: false, error: "too large" }, 413);

    let data = {};
    if (ct.includes("application/json")) {
      data = JSON.parse(raw || "{}");
    } else {
      for (const [k, v] of new URLSearchParams(raw)) data[k] = v;
    }

    const kind = String(data.kind || "").toLowerCase();
    if (!KINDS.has(kind)) return json({ ok: false, error: "unknown form" }, 400);

    // A person, not a script. Honeypot field that a real form never fills.
    if (data._trap) return json({ ok: true });

    const email = String(data.email || "").trim().slice(0, 200);
    // Census registrations need an email. Allowlist filings from THE ROLL do not: the checker page
    // tells you where you stand, so email is optional there, but if one is given it must be real.
    const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    if (kind === "census" && !emailOk) return json({ ok: false, error: "email looks wrong" }, 400);
    if (kind === "allowlist" && email && !emailOk) return json({ ok: false, error: "email looks wrong" }, 400);

    const wallet = String(data.wallet || "").trim().toLowerCase();
    if (kind === "allowlist" && !/^0x[a-f0-9]{40}$/.test(wallet))
      return json({ ok: false, error: "wallet looks wrong" }, 400);

    const ip = request.headers.get("cf-connecting-ip") || "";
    const ipHash = ip ? (await sha256(ip + "|newyorkers")).slice(0, 32) : null;

    // Rate limit: at most 5 of a kind from one ip in 10 minutes.
    if (ipHash) {
      const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const r = await env.DB.prepare(
        "SELECT COUNT(*) AS n FROM submissions WHERE ip_hash = ? AND kind = ? AND submitted_at > ?"
      ).bind(ipHash, kind, since).first();
      if (r && r.n >= 5) return json({ ok: false, error: "too many, slow down" }, 429);
    }

    // One allowlist entry per wallet. A second submission updates rather than duplicates.
    if (kind === "allowlist") {
      const dupe = await env.DB.prepare(
        "SELECT id FROM submissions WHERE kind = 'allowlist' AND wallet = ?"
      ).bind(wallet).first();
      if (dupe) {
        await env.DB.prepare(
          "UPDATE submissions SET submitted_at=?, name=?, email=?, mint_count=?, ref=?, source=?, payload=? WHERE id=?"
        ).bind(
          new Date().toISOString(), String(data.name || "").slice(0, 200), email,
          Math.min(10, Math.max(1, parseInt(data.mint_count || "1", 10) || 1)),
          String(data.ref || "").slice(0, 80), String(data.source || "").slice(0, 300),
          JSON.stringify(data), dupe.id
        ).run();
        return json({ ok: true, updated: true });
      }
    }

    await env.DB.prepare(
      `INSERT INTO submissions (id, kind, submitted_at, name, email, wallet, mint_count, ref, source, ip_hash, payload)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(
      crypto.randomUUID(), kind, new Date().toISOString(),
      String(data.name || data.alias || "").slice(0, 200),
      email, wallet || null,
      data.mint_count ? Math.min(10, Math.max(1, parseInt(data.mint_count, 10) || 1)) : null,
      String(data.ref || "").slice(0, 80), String(data.source || "").slice(0, 300),
      ipHash, JSON.stringify(data)
    ).run();

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: "server error" }, 500);
  }
}
