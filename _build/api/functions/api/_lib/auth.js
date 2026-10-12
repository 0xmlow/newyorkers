/* Shared auth for the collector profile.
 *
 * Privy is the identity provider. The browser gets an access token from Privy; this verifies it
 * server side against Privy's public JWKS (ES256, verified with WebCrypto, no library needed) and
 * then issues our own short signed session cookie so every later request is one HMAC check.
 *
 * Wallets are never taken from the client. They come from Privy's own record of what it verified.
 */
const enc = new TextEncoder();

export const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...extra },
  });

export const b64url = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64url = (s) => {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(s + "=".repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0));
};

/* ---------- our own session cookie ---------- */
async function hmacKey(secret) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
export async function sign(payload, secret) {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const mac = await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(body));
  return `${body}.${b64url(mac)}`;
}
export async function unsign(token, secret) {
  if (!token || token.indexOf(".") < 0) return null;
  const [body, mac] = token.split(".");
  const ok = await crypto.subtle.verify("HMAC", await hmacKey(secret), unb64url(mac), enc.encode(body));
  if (!ok) return null;
  try {
    const p = JSON.parse(new TextDecoder().decode(unb64url(body)));
    if (p.exp && Date.now() / 1000 > p.exp) return null;
    return p;
  } catch { return null; }
}
export function cookie(name, value, maxAge) {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
export function readCookie(request, name) {
  const raw = request.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}
export async function currentProfile(request, env) {
  const s = await unsign(readCookie(request, "ny_session"), env.SESSION_SECRET || "");
  if (!s || !s.pid) return null;
  return await env.DB.prepare("SELECT * FROM profiles WHERE id = ?").bind(s.pid).first();
}

/* ---------- Privy ---------- */
let jwksCache = { at: 0, keys: null };
async function jwks(appId) {
  if (jwksCache.keys && Date.now() - jwksCache.at < 3600e3) return jwksCache.keys;
  const r = await fetch(`https://auth.privy.io/api/v1/apps/${appId}/jwks.json`);
  if (!r.ok) throw new Error("jwks fetch failed");
  const j = await r.json();
  jwksCache = { at: Date.now(), keys: j.keys || [] };
  return jwksCache.keys;
}

/** Verify a Privy access token and return its subject (the DID). Throws on anything suspect. */
export async function verifyPrivyToken(token, appId) {
  const [h, p, s] = String(token || "").split(".");
  if (!h || !p || !s) throw new Error("malformed token");
  const head = JSON.parse(new TextDecoder().decode(unb64url(h)));
  const body = JSON.parse(new TextDecoder().decode(unb64url(p)));
  if (head.alg !== "ES256") throw new Error("unexpected algorithm");
  const key = (await jwks(appId)).find((k) => !head.kid || k.kid === head.kid);
  if (!key) throw new Error("no matching key");
  const pub = await crypto.subtle.importKey("jwk", key, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" }, pub, unb64url(s), enc.encode(`${h}.${p}`));
  if (!ok) throw new Error("bad signature");
  const now = Date.now() / 1000;
  if (body.exp && now > body.exp) throw new Error("expired");
  if (body.aud && body.aud !== appId) throw new Error("wrong audience");
  if (body.iss && body.iss !== "privy.io") throw new Error("wrong issuer");
  if (!body.sub) throw new Error("no subject");
  return body.sub;
}

/** Privy's own record of the user: the email and the wallets IT verified. Never trust the client for these. */
export async function privyUser(did, env) {
  const r = await fetch(`https://auth.privy.io/api/v1/users/${encodeURIComponent(did)}`, {
    headers: {
      "privy-app-id": env.PRIVY_APP_ID,
      authorization: "Basic " + btoa(`${env.PRIVY_APP_ID}:${env.PRIVY_APP_SECRET}`),
    },
  });
  if (!r.ok) return null;
  return await r.json();
}

export const uuid = () => crypto.randomUUID();
export const nowIso = () => new Date().toISOString();

/** A short, readable, unique-enough referral code. */
export function refCodeFrom(seed) {
  const base = String(seed || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 14);
  const salt = Math.random().toString(36).slice(2, 6);
  return (base || "friend") + salt;
}
