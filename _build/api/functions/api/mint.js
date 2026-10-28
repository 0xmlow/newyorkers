/* GET /api/mint  ->  the live count for the mint bar, read off the chain, held at the edge for 60 s.
 *
 * MLow 2026-10-26: "needs to update automatically when pieces are minted". api/mint.json is written at
 * build time (build_mint.py), so between deploys the bar sat still while people minted (1,011 on the site,
 * 1,023 on chain the day this was written). This reads the chain on request instead:
 *   census.minted     totalSupply() of the census contract, from the first public RPC that answers
 *   keystone.onChain  totalSupply() of the Keystone contract
 *   recent            the latest census mints from Blockscout, newest first, each named by ENS or a short
 *                     address and mapped to its New Yorker through api/census_tokmap.json (build_mint.py);
 *                     wallets the collectors board tags Team or Artist are left out
 * assets/mint.js loads the static file first, then this, and polls it once a minute while the tab is
 * visible. Any failure answers ok:false and the bar keeps the static numbers. No key, no D1, no writes.
 */
const CENSUS = "0x3386e98e3835d25f20e9a4e2c0bbb9859fedc9c4";
const KEYSTONE = "0x2dbfcca230979a91863be63ebce55dd5aae2b5c9";
const RPCS = ["https://ethereum-rpc.publicnode.com", "https://eth.drpc.org", "https://rpc.mevblocker.io"];
const TTL = 60;

const json = (obj, ttl) =>
  new Response(JSON.stringify(obj), { headers: { "content-type": "application/json", "access-control-allow-origin": "*",
    "cache-control": ttl ? `public, max-age=${ttl}` : "no-store" } });

async function supply(addr) {
  for (const u of RPCS) {
    try {
      const r = await fetch(u, { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to: addr, data: "0x18160ddd" }, "latest"] }) });
      const j = await r.json();
      if (j && typeof j.result === "string" && j.result.length > 2) return parseInt(j.result, 16);
    } catch (e) {}
  }
  return null;
}

async function recent() {
  try {
    const r = await fetch(`https://eth.blockscout.com/api/v2/tokens/${CENSUS}/transfers`, { headers: { accept: "application/json" } });
    if (!r.ok) return [];
    const j = await r.json();
    return (j.items || []).filter((x) => x.type === "token_minting" && x.to && x.total).slice(0, 30).map((x) => {
      const a = String(x.to.hash || "").toLowerCase();
      return { t: Number(x.total.token_id), a, o: x.to.ens_domain_name || (a.slice(0, 6) + "…" + a.slice(-4)),
               at: Math.floor(Date.parse(x.timestamp) / 1000) || 0 };
    });
  } catch (e) { return []; }
}

export async function onRequestGet({ request, env, waitUntil }) {
  const cache = caches.default, key = new Request(new URL("/api/mint", request.url).toString());
  try { const hit = await cache.match(key); if (hit) return hit; } catch (e) {}

  const [minted, onChain, rec] = await Promise.all([supply(CENSUS), supply(KEYSTONE), recent()]);
  if (minted == null) return json({ ok: false, error: "chain unreachable" });

  /* name each mint, and never show a Team or Artist wallet off as a collector (tags from the collectors board) */
  let tok = {}, team = new Set();
  try {
    const m = await env.ASSETS.fetch(new URL("/api/census_tokmap.json", request.url));
    if (m.ok) { const j = await m.json(); tok = j.tok || {}; team = new Set(j.team || []); }
  } catch (e) {}
  const shown = rec.filter((r) => !team.has(r.a)).map((r) => ({ t: r.t, n: tok[r.t] || null, o: r.o, at: r.at }));

  const res = json({ ok: true, asOf: new Date().toISOString(), census: { minted }, keystone: { onChain }, recent: shown }, TTL);
  try { waitUntil(cache.put(key, res.clone())); } catch (e) {}
  return res;
}
