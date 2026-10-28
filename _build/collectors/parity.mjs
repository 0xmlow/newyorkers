// The live board must score exactly as the build does. Replays the build's snapshot (api/collectors_snap.json)
// through the port the Cloudflare function runs (api/functions/api/_lib/collectors_core.js) and compares every
// value with what build_collectors.py just wrote: api/collectors.json and every api/c/<wallet>.json.
// Exits non zero on the first difference, naming where. Run by build_all.sh right after build_collectors.py.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { score } from "../api/functions/api/_lib/collectors_core.js";

const HERE = dirname(fileURLToPath(import.meta.url)), SITE = join(HERE, "..", "..");
const rd = p => JSON.parse(readFileSync(join(SITE, p), "utf8"));
const kit = rd("api/collectors_kit.json"), snap = rd("api/collectors_snap.json");
const logs = snap.logs.map(([c, id, from, to, b, i, t, tx]) => ({ c, id, from, to, b, i, t, tx }));
const { board, wallets } = score(kit, logs, snap.ens, {}, snap.fetched, snap.to);

function diff(a, b, path) {
  if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) < 1e-9 ? null : path;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return a === b ? null : path;
  if (Array.isArray(a) !== Array.isArray(b)) return path;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) { const d = diff(a[k], b[k], path + "." + k); if (d) return d; }
  return null;
}
const show = (o, p) => p.split(".").slice(1).reduce((x, k) => (x == null ? x : x[k]), o);
let bad = 0;
const want = rd("api/collectors.json");
const d = diff(board, want, "collectors.json");
if (d) { bad++; console.error(`parity: ${d}\n  live:  ${JSON.stringify(show(board, d.replace(/^collectors\.json/, "x")))}\n  build: ${JSON.stringify(show(want, d.replace(/^collectors\.json/, "x")))}`); }
const files = readdirSync(join(SITE, "api", "c")).filter(f => f.startsWith("0x") && f.endsWith(".json"));
for (const f of files) {
  const a = f.slice(0, -5), w = rd("api/c/" + f), dd = diff(wallets[a], w, "c/" + a);
  if (dd) { if (bad++ < 5) console.error(`parity: ${dd}`); }
}
if (Object.keys(wallets).length !== files.length) { bad++; console.error(`parity: ${Object.keys(wallets).length} live wallets, ${files.length} built`); }
if (bad) { console.error(`parity: ${bad} difference(s); the live board would disagree with the build`); process.exit(1); }
console.log(`parity: live scorer matches the build, ${board.meta.collectors} collectors, ${files.length} wallet files`);
