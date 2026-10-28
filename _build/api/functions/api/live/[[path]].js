/* GET /api/live/collectors        the collectors board, the shape of api/collectors.json, kept current
 * GET /api/live/c/<wallet|ens>    one collector, the shape of api/c/<wallet>.json (404 when they hold none)
 * GET /api/live/c/index           wallet -> ENS for every collector, the shape of api/c/index.json
 *
 * MLow 2026-10-27: "can we make these updates happen automatically". The build writes the board from a
 * chain snapshot and it sat still until the next build. This starts from that same snapshot
 * (api/collectors_snap.json, with api/collectors_kit.json: every table build_collectors.py scores with),
 * reads only the transfers since from public Ethereum nodes (Blockscout as a fallback: its free API
 * limits by IP, and Cloudflare's IPs are shared, so from here it mostly answers 429), names new wallets by ENS and new Keystone tokens by
 * their own tokenURI, and scores with _lib/collectors_core.js, the port collectors/parity.mjs holds to
 * the Python. The transfers since the snapshot live in D1 (table live_state), read again at most every
 * READ_EVERY seconds, in the background, so a visitor never waits on Blockscout. A new deploy brings a
 * newer snapshot and the stored transfers are dropped as covered by it.
 *
 * What it does not do: honorary links for new wallets (that is MLow's call, homes.json, at the nightly
 * build), Keystone thumbnails for tokens the build has not fetched (they show as titles), and the
 * honorary cards and h/ pages, which are images drawn on the Mac every night.
 * Any failure serves the snapshot, which is what the static files already say.
 */
import { score } from "../_lib/collectors_core.js";

const READ_EVERY = 15 * 60;
const TRANSFER = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const CONTRACTS = { keystone: "0x2dbfcca230979a91863be63ebce55dd5aae2b5c9", census: "0x3386e98e3835d25f20e9a4e2c0bbb9859fedc9c4" };
const RPCS = ["https://ethereum-rpc.publicnode.com", "https://rpc.mevblocker.io", "https://eth.drpc.org"];
const RANGE = 5000, MAX_RANGES = 12;   // public nodes cap a log query by blocks; a nightly snapshot is about 7,200 blocks old
const REVERSE_RECORDS = "0x3671aE578E63FdF66ad4F3E12CC0c0d71Ac7510C";
const GATEWAYS = ["https://gateway.pinata.cloud/ipfs/", "https://ipfs.io/ipfs/"];
const KMETA_PER_READ = 8;    // a Keystone token costs two subrequests to name; the rest wait for the next read
const ZERO = "0x" + "0".repeat(40);

const json = (obj, status = 200, ttl = 60) => new Response(JSON.stringify(obj), { status, headers: {
  "content-type": "application/json", "access-control-allow-origin": "*", "cache-control": `public, max-age=${ttl}` } });

let KIT = null, SNAP = null, MEMO = null;   // per isolate: a deploy starts fresh isolates

async function asset(env, req, p) {
  const r = await env.ASSETS.fetch(new URL("/" + p, req.url));
  if (!r.ok) throw new Error(p + " " + r.status);
  return r.json();
}

async function rpc(method, params) {
  for (const u of RPCS) {
    try {
      const r = await fetch(u, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
      const j = await r.json();
      if (j && typeof j.result === "string") return j.result;
    } catch (e) {}
  }
  return null;
}

async function rpcObj(method, params) {
  for (const u of RPCS) {
    try {
      const r = await fetch(u, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
      const j = await r.json();
      if (j && j.result != null && typeof j.result === "object") return j.result;
    } catch (e) {}
  }
  return null;
}
async function rpcLogs(from, to) {
  const got = await rpcObj("eth_getLogs", [{ fromBlock: "0x" + from.toString(16), toBlock: "0x" + to.toString(16),
    address: Object.values(CONTRACTS), topics: [TRANSFER] }]);
  if (!Array.isArray(got)) throw new Error("no node answered eth_getLogs " + from + " to " + to);
  return got;
}

const hexBytes = h => { const s = h.slice(2), b = new Uint8Array(s.length / 2); for (let k = 0; k < b.length; k++) b[k] = parseInt(s.substr(k * 2, 2), 16); return b; };
const word = (b, o) => { let n = 0; for (let k = o; k < o + 32; k++) n = n * 256 + b[k]; return n; };

// ReverseRecords.getNames(address[]): '' where the reverse record does not resolve forward (fetch_chain.ens_names)
async function ensNames(addrs) {
  const out = {};
  for (let s = 0; s < addrs.length; s += 200) {
    const chunk = addrs.slice(s, s + 200);
    const data = "0xcbf8b66c" + (32).toString(16).padStart(64, "0") + chunk.length.toString(16).padStart(64, "0") + chunk.map(a => a.slice(2).toLowerCase().padStart(64, "0")).join("");
    const res = await rpc("eth_call", [{ to: REVERSE_RECORDS, data }, "latest"]);
    if (!res) continue;
    const raw = hexBytes(res), base = word(raw, 0), heads = base + 32;
    chunk.forEach((a, k) => {
      const off = heads + word(raw, heads + 32 * k), ln = word(raw, off);
      const name = new TextDecoder().decode(raw.slice(off + 32, off + 32 + ln));
      out[a] = name && name.length < 64 && !/[\x00-\x1f]/.test(name) ? name : "";
    });
  }
  return out;
}

// tokenURI(i) then the JSON it points at (fetch_chain.keystone_meta)
async function keystoneMeta(i) {
  const res = await rpc("eth_call", [{ to: CONTRACTS.keystone, data: "0xc87b56dd" + i.toString(16).padStart(64, "0") }, "latest"]);
  if (!res) return null;
  const raw = hexBytes(res), ln = word(raw, 32), uri = new TextDecoder().decode(raw.slice(64, 64 + ln));
  for (const g of GATEWAYS) {
    try {
      const r = await fetch(uri.startsWith("ipfs://") ? g + uri.slice(7) : uri);
      if (r.ok) { const d = await r.json(); return { name: d.name || "", image: d.image || "" }; }
    } catch (e) {}
    if (!uri.startsWith("ipfs://")) break;
  }
  return null;
}

async function scout(addr, from) {
  const r = await fetch(`https://eth.blockscout.com/api?module=logs&action=getLogs&address=${addr}&topic0=${TRANSFER}&fromBlock=${from}&toBlock=latest`);
  if (!r.ok) throw new Error("blockscout " + r.status);
  const j = await r.json();
  if (j.status === "1" || String(j.message || "").startsWith("No")) return j.result || [];
  throw new Error("blockscout " + (j.message || "error"));
}

function baseState(snap) { return { snapTo: snap.to, to: snap.to, fetched: snap.fetched, checked: 0, logs: [], ens: {}, kmeta: {} }; }

async function load(env) {
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS live_state (k TEXT PRIMARY KEY, v TEXT, at INTEGER)").run();
  const row = await env.DB.prepare("SELECT v FROM live_state WHERE k = 'collectors'").first();
  const st = row ? JSON.parse(row.v) : null;
  return st && st.snapTo === SNAP.to ? st : baseState(SNAP);
}

async function read(env, st) {
  const now = Math.floor(Date.now() / 1000);
  // one reader at a time: claim the read for two minutes, and give up if another isolate holds it
  const claim = await env.DB.prepare("INSERT INTO live_state (k, v, at) VALUES ('lock', '', ?1) ON CONFLICT(k) DO UPDATE SET at = ?1 WHERE live_state.at < ?2")
    .bind(now, now - 120).run();
  if (!claim.meta || !claim.meta.changes) return;
  const seen = new Set(SNAP.logs.map(l => l[7] + ":" + l[5]).concat(st.logs.map(l => l.tx + ":" + l.i)));
  const fresh = [];
  const add = (lg, ts) => {
    if (lg.topics.length < 4 || lg.topics[3] == null) return;   // ERC-20 shaped Transfer, not ours
    const i = parseInt(lg.logIndex, 16), key = lg.transactionHash + ":" + i;
    if (seen.has(key)) return;
    seen.add(key);
    const addr = String(lg.address || "").toLowerCase();
    const c = addr === CONTRACTS.keystone ? "keystone" : addr === CONTRACTS.census ? "census" : null;
    if (!c) return;
    fresh.push({ c, id: parseInt(lg.topics[3], 16), from: "0x" + lg.topics[1].slice(-40), to: "0x" + lg.topics[2].slice(-40),
      b: parseInt(lg.blockNumber, 16), i, t: ts, tx: lg.transactionHash });
  };
  let head = null;
  try {
    const hx = await rpc("eth_blockNumber", []);
    if (!hx) throw new Error("no node answered eth_blockNumber");
    head = parseInt(hx, 16);
    if (head - st.to > RANGE * MAX_RANGES) throw new Error("snapshot too old for the nodes: " + (head - st.to) + " blocks");
    const stamps = {};
    for (let from = st.to + 1, n = 0; from <= head; from += RANGE, n++) {
      const got = await rpcLogs(from, Math.min(head, from + RANGE - 1));
      for (const lg of got) {
        let ts = lg.blockTimestamp ? parseInt(lg.blockTimestamp, 16) : stamps[lg.blockNumber];
        if (ts == null) {
          const blk = await rpcObj("eth_getBlockByNumber", [lg.blockNumber, false]);
          ts = stamps[lg.blockNumber] = blk ? parseInt(blk.timestamp, 16) : Math.floor(Date.now() / 1000);
        }
        add(lg, ts);
      }
    }
  } catch (e) {
    head = null;
    for (const [c, addr] of Object.entries(CONTRACTS)) {   // the fallback; throws on a 429 and the read is tried again in two minutes
      let from = st.to + 1;
      for (let page = 0; page < 4; page++) {
        const got = await scout(addr, from);
        for (const lg of got) add({ ...lg, address: addr }, parseInt(lg.timeStamp, 16));
        if (got.length < 1000) break;
        from = parseInt(got[got.length - 1].blockNumber, 16);
      }
    }
  }
  st.logs = st.logs.concat(fresh).sort((x, y) => x.b - y.b || x.i - y.i);
  // a node answers to its head, so the next read starts there (one block of overlap, dropped by the seen set);
  // Blockscout indexes behind, so after it only the newest transfer read is trusted, as fetch_chain does
  if (head != null) st.to = Math.max(st.to, head - 1);
  else if (fresh.length) st.to = Math.max(st.to, Math.max(...fresh.map(l => l.b)) - 1);
  const known = new Set(Object.keys(SNAP.ens).concat(Object.keys(st.ens)));
  const who = [...new Set(fresh.flatMap(l => [l.from, l.to]))].filter(a => a !== ZERO && !known.has(a));
  if (who.length) Object.assign(st.ens, await ensNames(who));
  const ks = [...new Set(st.logs.filter(l => l.c === "keystone").map(l => l.id))].filter(i => !KIT.keystone[String(i)] && !st.kmeta[String(i)]);
  for (const i of ks.slice(0, KMETA_PER_READ)) { const m = await keystoneMeta(i); if (m) st.kmeta[String(i)] = m; }
  st.fetched = now; st.checked = now;
  await env.DB.prepare("INSERT INTO live_state (k, v, at) VALUES ('collectors', ?1, ?2) ON CONFLICT(k) DO UPDATE SET v = ?1, at = ?2").bind(JSON.stringify(st), now).run();
  await env.DB.prepare("DELETE FROM live_state WHERE k = 'lock'").run();
}

function scored(st) {
  const key = SNAP.to + ":" + st.to + ":" + st.fetched + ":" + st.logs.length + ":" + Object.keys(st.kmeta).length;
  if (MEMO && MEMO.key === key) return MEMO.out;
  const logs = SNAP.logs.map(([c, id, from, to, b, i, t, tx]) => ({ c, id, from, to, b, i, t, tx })).concat(st.logs);
  const ens = { ...SNAP.ens };
  for (const [a, n] of Object.entries(st.ens)) if (n) ens[a] = n;
  const out = score(KIT, logs, ens, st.kmeta, st.fetched, st.to);
  out.board.meta.live = true;
  out.board.meta.since = st.logs.length;   // transfers read since the build
  out.index = Object.fromEntries(out.board.collectors.map(r => [r.a, r.ens]));
  MEMO = { key, out };
  return out;
}

export async function onRequestGet({ request, env, params, waitUntil }) {
  const path = (params.path || []).map(s => decodeURIComponent(s).toLowerCase());
  try {
    if (!KIT) [KIT, SNAP] = await Promise.all([asset(env, request, "api/collectors_kit.json"), asset(env, request, "api/collectors_snap.json")]);
  } catch (e) { return json({ ok: false, error: "kit unavailable" }, 503, 0); }
  let st;
  try { st = await load(env); } catch (e) { st = baseState(SNAP); }
  const now = Math.floor(Date.now() / 1000);
  // a failed read leaves its two minute lock in place, so Blockscout is asked again in two minutes, not on every visit
  if (now - (st.checked || 0) > READ_EVERY) waitUntil(read(env, st).catch(e =>
    env.DB.prepare("INSERT INTO live_state (k, v, at) VALUES ('error', ?1, ?2) ON CONFLICT(k) DO UPDATE SET v = ?1, at = ?2")
      .bind(String(e && e.stack || e).slice(0, 500), now).run().catch(() => {})));
  const out = scored(st);

  if (path[0] === "collectors" && path.length === 1) return json(out.board);
  if (path[0] === "c" && path.length === 2) {
    if (path[1] === "index" || path[1] === "index.json") return json(out.index);
    let k = path[1].replace(/\.json$/, "");
    if (!k.startsWith("0x")) {
      const name = k.endsWith(".eth") ? k : k + ".eth";
      k = Object.keys(out.index).find(a => (out.index[a] || "").toLowerCase() === name) || "";
    }
    const w = out.wallets[k];
    return w ? json(w) : json({ ok: false, error: "holds no NEW YORKERS" }, 404);
  }
  return json({ ok: false, error: "not found" }, 404, 0);
}
