/* POST /api/session   { token, ref? }   -> sets our session cookie, returns the profile
 * DELETE /api/session                    -> logs out
 *
 * The client sends a Privy access token. We verify it, ask Privy who that is, and upsert a profile.
 * Wallets come from Privy's verified record, never from the request body.
 */
import { json, sign, cookie, verifyPrivyToken, privyUser, uuid, nowIso, refCodeFrom, currentProfile } from "./_lib/auth.js";

const SESSION_DAYS = 30;

export async function onRequestDelete() {
  return json({ ok: true }, 200, { "set-cookie": cookie("ny_session", "", 0) });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok: false, error: "storage not configured" }, 503);
  if (!env.PRIVY_APP_ID || !env.PRIVY_APP_SECRET || !env.SESSION_SECRET)
    return json({ ok: false, error: "login is not configured yet" }, 503);

  let body = {};
  try { body = await request.json(); } catch { return json({ ok: false, error: "bad request" }, 400); }

  let did;
  try { did = await verifyPrivyToken(body.token, env.PRIVY_APP_ID); }
  catch (e) { return json({ ok: false, error: "could not verify that login" }, 401); }

  const pu = await privyUser(did, env);
  const accounts = (pu && pu.linked_accounts) || [];
  const email = (accounts.find((a) => a.type === "email") || {}).address || null;
  const wallets = accounts
    .filter((a) => a.type === "wallet" && a.address && a.chain_type === "ethereum")
    .map((a) => String(a.address).toLowerCase());

  const now = nowIso();
  let profile = await env.DB.prepare("SELECT * FROM profiles WHERE privy_did = ?").bind(did).first();

  if (!profile) {
    const id = uuid();
    // a referral is recorded once, at the moment a person first exists, and never rewritten
    let referredBy = null;
    const ref = String(body.ref || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
    if (ref) {
      const owner = await env.DB.prepare("SELECT id FROM profiles WHERE ref_code = ?").bind(ref).first();
      if (owner) referredBy = ref;
    }
    let code = refCodeFrom(email ? email.split("@")[0] : did.slice(-8));
    for (let i = 0; i < 5; i++) {
      const taken = await env.DB.prepare("SELECT 1 FROM profiles WHERE ref_code = ?").bind(code).first();
      if (!taken) break;
      code = refCodeFrom(email ? email.split("@")[0] : did.slice(-8));
    }
    await env.DB.prepare(
      `INSERT INTO profiles (id, privy_did, email, ref_code, referred_by, referred_at, created_at, last_seen_at)
       VALUES (?,?,?,?,?,?,?,?)`
    ).bind(id, did, email, code, referredBy, referredBy ? now : null, now, now).run();
    profile = await env.DB.prepare("SELECT * FROM profiles WHERE id = ?").bind(id).first();
  } else {
    await env.DB.prepare("UPDATE profiles SET last_seen_at = ?, email = COALESCE(?, email) WHERE id = ?")
      .bind(now, email, profile.id).run();
  }

  // record the wallets Privy verified. A wallet already claimed by someone else is skipped, not stolen.
  for (const w of wallets) {
    const held = await env.DB.prepare("SELECT profile_id FROM wallets WHERE address = ?").bind(w).first();
    if (held && held.profile_id !== profile.id) continue;
    if (!held) {
      await env.DB.prepare("INSERT INTO wallets (address, profile_id, proved_at, is_primary) VALUES (?,?,?,?)")
        .bind(w, profile.id, now, wallets.indexOf(w) === 0 ? 1 : 0).run();
    }
  }

  const token = await sign(
    { pid: profile.id, exp: Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400 },
    env.SESSION_SECRET
  );
  return json({ ok: true, profile: { id: profile.id, email: profile.email, ref_code: profile.ref_code } },
    200, { "set-cookie": cookie("ny_session", token, SESSION_DAYS * 86400) });
}

export async function onRequestGet({ request, env }) {
  const p = await currentProfile(request, env);
  return json({ ok: true, signedIn: !!p });
}
