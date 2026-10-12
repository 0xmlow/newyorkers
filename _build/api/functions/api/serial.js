/* POST /api/serial  ->  the number on a MLOWTAR receipt, out of ten thousand, none repeating.
 *
 * Body: { seed: <uint32 of the reading> }. Reply: { ok, n, index, of }.
 * The run is a fixed shuffle of 1..10000 (a seeded permutation computed once per isolate), handed out in
 * order of arrival: the first receipt ever printed gets PERM[0], the second PERM[1], and so on, so the numbers
 * look random and never repeat. A replayed link (same seed) gets the number it already has, so a shared
 * receipt stays itself. After ten thousand the booth keeps counting past the run and says so (of = null).
 *
 * Binding required on the Pages project: D1 named `DB`, table from _build/api/schema_mlowtar.sql. No key,
 * no model: this is a counter, nothing more. Without D1 the page prints an unnumbered receipt.
 */
const RUN = 10000;
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type", "cache-control": "no-store" } });
export async function onRequestOptions() { return json({ ok: true }); }

let PERM = null;
function perm() {
  if (PERM) return PERM;
  let a = 0x4e3779b1 >>> 0; const r = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const p = new Uint16Array(RUN); for (let i = 0; i < RUN; i++) p[i] = i + 1;
  for (let i = RUN - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = p[i]; p[i] = p[j]; p[j] = t; }
  PERM = p; return p;
}
export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) return json({ ok: false, error: "no counter" }, 503);
    let body = {}; try { body = JSON.parse((await request.text()) || "{}"); } catch { return json({ ok: false, error: "bad json" }, 400); }
    const seed = String(body.seed || "").replace(/[^0-9]/g, "").slice(0, 12); if (!seed) return json({ ok: false, error: "no seed" }, 400);
    let row = await env.DB.prepare("SELECT id FROM mlowtar_serials WHERE seed = ?").bind(seed).first();
    if (!row) {
      await env.DB.prepare("INSERT OR IGNORE INTO mlowtar_serials (seed) VALUES (?)").bind(seed).run();
      row = await env.DB.prepare("SELECT id FROM mlowtar_serials WHERE seed = ?").bind(seed).first();
    }
    const index = Number(row.id), n = index <= RUN ? perm()[index - 1] : index;
    return json({ ok: true, n, index, of: index <= RUN ? RUN : null });
  } catch (e) { return json({ ok: false, error: "counter down" }, 500); }
}
