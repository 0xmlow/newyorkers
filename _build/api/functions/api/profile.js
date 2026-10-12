/* GET  /api/profile  -> the whole profile: identity, wallets, stats, referrals
 * POST /api/profile  -> update the handles a person can set themselves
 */
import { json, currentProfile, nowIso } from "./_lib/auth.js";

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ ok: false, error: "storage not configured" }, 503);
  // Whether sign in can work at all is a server fact, not something the browser should infer
  // from an App ID in config.js: the App SECRET lives only here. The page reads this and shows
  // an honest message rather than enabling buttons that would 503 after someone types a code.
  const loginReady = !!(env.PRIVY_APP_ID && env.PRIVY_APP_SECRET && env.SESSION_SECRET);

  // ?check=privy asks Privy whether the App Secret actually authenticates. Presence is not
  // correctness: a doubled paste stores a plausible looking secret that never works, and the
  // failure would otherwise only show up as a broken login for a real visitor. Returns a
  // status word and nothing else, so it leaks no credential.
  if (new URL(request.url).searchParams.get("check") === "privy") {
    if (!loginReady) return json({ ok: true, check: "privy", status: "not configured" });
    let status = "unknown";
    try {
      const r = await fetch(`https://auth.privy.io/api/v1/apps/${env.PRIVY_APP_ID}`, {
        headers: {
          "privy-app-id": env.PRIVY_APP_ID,
          authorization: "Basic " + btoa(`${env.PRIVY_APP_ID}:${env.PRIVY_APP_SECRET}`),
        },
      });
      status = r.ok ? "ok" : (r.status === 401 || r.status === 403 ? "rejected" : "http " + r.status);
      // Which login methods the app actually has switched on. A wallet sign in fails with a
      // shapeless error when SIWE is off in the dashboard, and that is invisible from the client.
      if (r.ok) {
        const app = await r.json().catch(() => null);
        if (app) {
          const pick = (k) => (app[k] === undefined ? "absent" : app[k]);
          return json({ ok: true, check: "privy", status, app: {
            wallet_auth: pick("wallet_auth"),
            email_auth: pick("email_auth"),
            external_wallets_for_signup_enabled: pick("external_wallets_for_signup_enabled"),
            allowlist_enabled: pick("allowlist_enabled"),
            captcha_enabled: pick("captcha_enabled"),
            require_users_accept_terms: pick("require_users_accept_terms"),
            max_linked_wallets_per_user: pick("max_linked_wallets_per_user"),
            allowed_domains: pick("allowed_domains"),
          }});
        }
      }
    } catch { status = "unreachable"; }
    // Length is the tell for a doubled paste, so it is worth reporting while something is
    // wrong. Once the secret authenticates there is no reason to publish its length.
    const out = { ok: true, check: "privy", status };
    if (status !== "ok") out.secretLength = String(env.PRIVY_APP_SECRET).length;
    return json(out);
  }

  const p = await currentProfile(request, env);
  if (!p) return json({ ok: false, signedIn: false, loginReady }, 200);

  const wallets = (await env.DB.prepare(
    "SELECT address, proved_at, is_primary FROM wallets WHERE profile_id = ? ORDER BY is_primary DESC, proved_at"
  ).bind(p.id).all()).results || [];

  const rows = (await env.DB.prepare(
    "SELECT kind, key, payload, count, first_at FROM events WHERE profile_id = ?"
  ).bind(p.id).all()).results || [];

  const stats = { rooms: [], eggs: [], articles: [], quiz: null };
  for (const r of rows) {
    if (r.kind === "room") stats.rooms.push(r.key);
    else if (r.kind === "egg") stats.eggs.push(r.key);
    else if (r.kind === "article") stats.articles.push(r.key);
    else if (r.kind === "quiz") { try { stats.quiz = JSON.parse(r.payload); } catch { stats.quiz = null; } }
  }

  const referred = await env.DB.prepare("SELECT COUNT(*) AS n FROM profiles WHERE referred_by = ?")
    .bind(p.ref_code).first();
  const allow = await env.DB.prepare(
    "SELECT submitted_at, mint_count, wallet FROM submissions WHERE kind='allowlist' AND lower(email)=lower(?) ORDER BY submitted_at DESC"
  ).bind(p.email || "").first();

  return json({
    ok: true, signedIn: true,
    profile: {
      id: p.id, email: p.email, display_name: p.display_name,
      handle_x: p.handle_x, handle_discord: p.handle_discord, handle_telegram: p.handle_telegram,
      ref_code: p.ref_code, referred_by: p.referred_by, created_at: p.created_at,
    },
    wallets, stats,
    referrals: { code: p.ref_code, signups: (referred && referred.n) || 0 },
    allowlist: allow || null,
  });
}

export async function onRequestPost({ request, env }) {
  const p = await currentProfile(request, env);
  if (!p) return json({ ok: false, error: "not signed in" }, 401);
  let b = {};
  try { b = await request.json(); } catch { return json({ ok: false, error: "bad request" }, 400); }
  const clean = (v, n) => (v == null ? null : String(v).trim().slice(0, n) || null);
  await env.DB.prepare(
    "UPDATE profiles SET display_name=?, handle_x=?, handle_discord=?, handle_telegram=?, last_seen_at=? WHERE id=?"
  ).bind(clean(b.display_name, 60), clean(b.handle_x, 40), clean(b.handle_discord, 40),
         clean(b.handle_telegram, 40), nowIso(), p.id).run();
  return json({ ok: true });
}
