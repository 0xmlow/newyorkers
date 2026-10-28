/* The collectors board, scored: a port of build_collectors.py's scoring for the live board.
 *
 * score(kit, logs, ens, kmeta, fetched, to) returns { board, wallets }:
 *   board    the shape of api/collectors.json (meta, badges, boroughWars, collectors)
 *   wallets  address -> the shape of api/c/<address>.json
 * kit is api/collectors_kit.json, written by build_collectors.py from the very tables it scores with.
 * logs are Transfer events {c, id, from, to, b, i, t} in block order. ens maps address -> name;
 * kmeta maps a Keystone token the kit has not seen -> {name, image} read off the chain.
 *
 * Python is the reference. collectors/parity.mjs runs this over the build's own snapshot and the build
 * stops if any row differs, so change the two together. Comments name the Python they mirror.
 */
const ZERO = "0x" + "0".repeat(40);
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// datetime.fromtimestamp(ts, ET).strftime("%B %-d, %Y at %-I:%M %p ET"), ET a fixed offset
function fmt(ts, tz, sep) {
  const d = new Date((ts + tz * 3600) * 1000);
  const h = d.getUTCHours(), m = d.getUTCMinutes();
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}${sep}${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"} ET`;
}

// collections.Counter.most_common(): by count, ties in first seen order
function mostCommon(m) {
  return [...m.entries()].map((e, k) => [e[0], e[1], k]).sort((a, b) => b[1] - a[1] || a[2] - b[2]).map(e => [e[0], e[1]]);
}
function count(arr) {
  const m = new Map();
  for (const x of arr) m.set(x, (m.get(x) || 0) + 1);
  return m;
}

// build_collectors.unescrow: a piece in a marketplace's custody (kit.escrow) is still its lister's
function unescrow(logs, escrow) {
  const E = new Set(escrow || []), lister = new Map(), out = [];
  for (const lg of logs) {
    const k = lg.c + ":" + lg.id;
    if (E.has(lg.to) && !E.has(lg.from)) { lister.set(k, lg.from); continue; }
    if (E.has(lg.from)) {
      if (lister.get(k) === lg.to) { lister.delete(k); continue; }
      const from = lister.has(k) ? lister.get(k) : lg.from;
      lister.delete(k);
      out.push({ ...lg, from });
      continue;
    }
    out.push(lg);
  }
  return out;
}

export function score(kit, rawLogs, ens, kmeta, fetched, to) {
  const logs = unescrow([...rawLogs].sort((x, y) => x.b - y.b || x.i - y.i), kit.escrow);
  const FIVE = kit.five, NERAS = kit.eras.length, NFAMS = kit.fams.length, SETSIZE = kit.setsize, P = kit.points;
  const DEF = Object.fromEntries(kit.badges.map(b => [b.id, b]));
  const T = id => {
    const v = kit.census[String(id)];
    return v ? { n: v[0], t: v[1], era: v[2], b: v[3], f: v[4], set: v[5], nb: v[6], anim: v[7], gl: v[8], img: v[9] } : null;
  };
  const thumb = n => { const v = n == null ? null : kit.byn[String(n)]; return v ? [v[0], v[1]] : [null, null]; };
  const media = n => { const v = n == null ? null : kit.byn[String(n)]; return v ? [v[2], v[3]] : [null, 1.0]; };

  // ---------- replay the transfers ----------
  const owner = new Map(), mintedBy = new Map(), mintT = new Map(), sent = new Map();
  for (const lg of logs) {
    const k = lg.c + ":" + lg.id;
    if (lg.from === ZERO) { mintedBy.set(k, lg.to); mintT.set(k, lg.t); }
    else sent.set(lg.from, (sent.get(lg.from) || 0) + 1);
    owner.set(k, lg.to);
  }
  const held = new Map();
  for (const [k, a] of owner) {
    if (a === ZERO) continue;
    if (!held.has(a)) held.set(a, { census: [], keystone: [] });
    const [c, i] = k.split(":");
    held.get(a)[c].push(+i);
  }
  const minted = new Map();
  for (const [k, a] of mintedBy) { if (!minted.has(a)) minted.set(a, []); minted.get(a).push(k); }
  let soldOut = 0, kOn = 0;
  for (const k of owner.keys()) { if (k.startsWith("census:")) soldOut++; else kOn++; }

  const keystonePiece = i => {   // keystone_piece + thumb + keystone_thumb + media, prebuilt by the kit when it can be
    const v = kit.keystone[String(i)];
    if (v) return { t: v[0], n: v[1], th: v[2], id: v[3], mv: v[4], ar: v[5] };
    const name = (kmeta[String(i)] || {}).name;
    if (!name) return { t: "Keystone", n: null, th: null, id: null, mv: null, ar: 1.0 };   // not named yet: the token id is not a census number
    const tail = name.includes("#") ? name.slice(name.lastIndexOf("#") + 1) : "";
    const n = /^\d+$/.test(tail) ? +tail : null;
    const t = name.includes(" #") ? name.slice(0, name.lastIndexOf(" #")) : name;
    const [th, id] = n != null ? thumb(n) : [null, null];
    const [mv, ar] = n != null && id ? media(n) : [null, 1.0];
    return { t, n, th, id, mv, ar };
  };

  // ---------- badges ----------
  const earned = new Map();
  const rows = [];
  for (const [a, h] of held) {
    const cen = [...h.census].sort((x, y) => x - y), key = [...h.keystone].sort((x, y) => x - y);
    if (!cen.length && !key.length) continue;
    const tr = cen.map(T);
    const boros = new Set(tr.map(t => t.b)), fams = new Set(tr.filter(t => t.f).map(t => t.f)), eras = new Set(tr.map(t => t.era));
    const sets = count(tr.filter(t => t.set).map(t => t.set)), nbs = count(tr.filter(t => t.nb).map(t => t.nb));
    const total = cen.length + key.length;
    const got = [];
    for (const [tid, need] of [["borough_president", 50], ["landlord", 25], ["block_captain", 11], ["regular", 5], ["counted", 1]])
      if (total >= need) { got.push(tid); break; }
    if (FIVE.every(x => boros.has(x))) got.push("five_boroughs");
    else if (FIVE.filter(x => boros.has(x)).length >= 3) got.push("bridge_and_tunnel");
    if (fams.size === NFAMS) got.push("whole_family");
    if (eras.size === NERAS) got.push("whole_timeline");
    else if (eras.size >= 5) got.push("time_traveler");
    const full = [...sets].filter(([st, n]) => n >= SETSIZE[st]).map(([st]) => st);
    if (full.length) got.push("set_complete");
    if ([...sets].some(([st, n]) => !full.includes(st) && n >= 3)) got.push("set_started");
    const nbTop = mostCommon(nbs)[0];
    if (nbTop && nbTop[1] >= 3) got.push("local");
    if (key.length) got.push("keystone");
    if (key.length && cen.length) got.push("founder");
    const mine = minted.get(a) || [];
    if (mine.some(k => k.startsWith("census:") && mintT.get(k) < kit.dayOneEnd)) got.push("day_one");
    if (mine.some(k => k.startsWith("census:") && +k.split(":")[1] <= 111)) got.push("first_111");
    if (mine.length && !sent.get(a)) got.push("lifer");
    if (tr.some(t => t.anim)) got.push("moving_picture");
    if (tr.some(t => t.gl)) got.push("glitched");
    const pts = cen.length * P.census + key.length * P.keystone + got.reduce((s, g) => s + DEF[g].points, 0)
      + full.reduce((s, st) => s + SETSIZE[st] * P.per_piece_in_complete_set, 0);
    let best = null;   // max(sets.items(), key=(have/of, have)): the first of equals wins
    for (const [st, n] of sets) {
      if (!best || n / SETSIZE[st] > best[1] / SETSIZE[best[0]] || (n / SETSIZE[st] === best[1] / SETSIZE[best[0]] && n > best[1])) best = [st, n];
    }
    const pieces = [];
    for (const i of cen) {
      const t = T(i), [th, id] = thumb(t.n), [mv, ar] = media(t.n);
      pieces.push({ c: "census", tok: i, n: t.n, t: t.t, th, id, big: t.img ? kit.ipfs + t.img : null, mv, ar });
    }
    for (const i of key) {
      const k = keystonePiece(i);
      pieces.push({ c: "keystone", tok: i, n: k.n, t: k.t, th: k.th, id: k.id, big: null, mv: k.mv, ar: k.ar });
    }
    for (const g of got) earned.set(g, (earned.get(g) || 0) + 1);
    const where = count(pieces.filter(p => p.id).map(p => p.n).filter(n => kit.roomOf[String(n)]).map(n => kit.roomOf[String(n)]));
    const whereMc = mostCommon(where);
    const home = kit.homes[a] || (whereMc.length ? whereMc[0][0] : "metgreathall");
    const idn = kit.ident[a] || {};
    const nmEns = ens[a] || "";
    rows.push({ a, ens: nmEns, nm: nmEns || idn.user || (idn.x ? "@" + idn.x : ""), x: idn.x || "",
      also: (idn.wallets || []).filter(w => w !== a), tag: kit.tags[a] || "", pts, census: cen.length, keystone: key.length, badges: got,
      boros: FIVE.filter(x => boros.has(x)), fams: fams.size, eras: eras.size,
      set: best ? { name: best[0], have: best[1], of: SETSIZE[best[0]] } : null,
      local: nbTop ? { name: nbTop[0], have: nbTop[1] } : null,
      honor: kit.honor[a] || null, home, where: whereMc.filter(([r]) => kit.rooms[r]).map(([r, c]) => ({ room: r, name: kit.rooms[r], n: c })),
      pieces });
  }
  rows.sort((x, y) => y.pts - x.pts || (y.census + y.keystone) - (x.census + x.keystone) || (x.a < y.a ? -1 : x.a > y.a ? 1 : 0));
  rows.forEach((r, k) => { r.rank = k + 1; });
  if (rows.length) { rows[0].badges.unshift("mayor"); rows[0].pts += DEF.mayor.points; earned.set("mayor", 1); }

  const meta = { asOf: fmt(fetched, kit.tz, " at "), block: to, collectors: rows.length, census: soldOut, keystone: kOn, eras: NERAS, families: NFAMS };
  const badgesOut = kit.badges.map(b => ({ ...b, holders: earned.get(b.id) || 0 }));

  // ---------- BOROUGH WARS ----------
  const LABEL = { Manhattan: "Manhattan", Brooklyn: "Brooklyn", Queens: "Queens", Bronx: "The Bronx", "Staten Island": "Staten Island" };
  const hold = new Map(), firstFive = new Map(), firstFam = new Map();
  const ordered = logs.map((l, k) => [l, k]).sort((x, y) => x[0].b - y[0].b || x[0].i - y[0].i || x[1] - y[1]).map(e => e[0]);
  for (const lg of ordered) {
    if (lg.c !== "census") continue;
    if (lg.from !== ZERO && hold.has(lg.from)) hold.get(lg.from).delete(lg.id);
    if (!hold.has(lg.to)) hold.set(lg.to, new Set());
    hold.get(lg.to).add(lg.id);
    const a = lg.to, tr = [...hold.get(a)].map(T);
    if (!firstFive.has(a)) { const bs = new Set(tr.map(t => t.b)); if (FIVE.every(b => bs.has(b))) firstFive.set(a, lg.t); }
    if (!firstFam.has(a) && new Set(tr.filter(t => t.f).map(t => t.f)).size === NFAMS) firstFam.set(a, lg.t);
  }
  const when = ts => fmt(ts, kit.tz, ", ");
  const short = a => a.slice(0, 6) + "…" + a.slice(-4);
  const bwRow = r => {
    const have = r.boros;
    return { a: r.a, nm: r.nm || short(r.a), ens: r.ens, tag: r.tag, rank: r.rank, census: r.census, boros: have, have: have.length,
      needs: FIVE.filter(b => !have.includes(b)).map(b => LABEL[b]), fams: r.fams, eligible: !r.tag,
      fiveAt: have.length === 5 && firstFive.has(r.a) ? when(firstFive.get(r.a)) : null,
      familyAt: r.fams === NFAMS && firstFam.has(r.a) ? when(firstFam.get(r.a)) : null };
  };
  const ff = a => firstFive.has(a) ? firstFive.get(a) : 1e12;
  const bwAll = rows.filter(r => r.census).map(bwRow).sort((x, y) =>
    y.have - x.have || (x.have === 5 ? ff(x.a) : 0) - (y.have === 5 ? ff(y.a) : 0) || y.fams - x.fams || y.census - x.census || x.rank - y.rank);
  const elig = bwAll.filter(x => x.eligible);
  const fam = a => firstFam.has(a) ? firstFam.get(a) : 1e12;
  const already = elig.filter(x => x.have === 5 && (firstFive.get(x.a) || 0) < kit.bwStart).sort((x, y) => ff(x.a) - ff(y.a));
  const five = elig.filter(x => x.have === 5 && (firstFive.get(x.a) || 0) >= kit.bwStart).sort((x, y) => ff(x.a) - ff(y.a));
  const famW = elig.filter(x => x.fams === NFAMS && (firstFam.get(x.a) || 0) >= kit.bwStart).sort((x, y) => fam(x.a) - fam(y.a));
  const alreadySet = new Set(already.map(x => x.a));
  const race = elig.filter(x => !alreadySet.has(x.a));
  let closest = null;
  for (const x of race) if (!closest || x.fams > closest.fams || (x.fams === closest.fams && -x.rank > -closest.rank)) closest = x;
  const BW = { name: "BOROUGH WARS", rules: kit.bwRules.replace("{n}", String(already.length)),
    start: "2026-10-07T00:00:00-04:00", closes: "2026-11-07T11:11:00-05:00", boroughs: FIVE.map(b => LABEL[b]), families: NFAMS,
    top: race.slice(0, 12), already, fiveWinner: five[0] || null, familyWinner: famW[0] || null,
    oneAway: race.filter(x => x.have === 4).length, closestFamily: closest, excluded: bwAll.filter(x => !x.eligible) };

  const wallets = {};
  for (const r of rows) {
    const defs = {};
    for (const b of kit.badges) if (r.badges.includes(b.id)) defs[b.id] = Object.fromEntries(["id", "name", "icon", "color", "rule", "img"].map(k => [k, b[k] === undefined ? null : b[k]]));
    wallets[r.a] = { ...r, homeName: kit.rooms[r.home] || "", of: rows.length, asOf: meta.asOf, badgeDefs: defs };
  }
  const collectors = rows.map(r => {
    const { pieces, ...rest } = r;
    return { ...rest, tokens: { census: pieces.filter(p => p.c === "census").map(p => p.tok), keystone: pieces.filter(p => p.c === "keystone").map(p => p.tok) } };
  });
  return { board: { meta, badges: badgesOut, boroughWars: BW, collectors }, wallets };
}
