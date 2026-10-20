// 4F. The diorama. A railroad apartment, four rooms in a line (kitchen with the tub in it, the parlour, the bedroom,
// the back room on the J), seen through its own front door from the landing. It is built in forced perspective: every
// room is narrower, lower and smaller than the one before, the floor rises a little, the wallpaper shrinks, so from
// the mark on the landing nine metres of flat read as twenty. Walk in and the trick breaks: by the back window you
// are a giant in your own grandmother's room.
// The year runs on the wall calendar. On the first of every month something leaves: the movers carry it out and it
// turns up on the curb on Broadway. Tear the calendar to see ahead; pin a month and the flat stays there for you.
// One frame comes off the wall every month too, and leaves its pale rectangle behind.
import { W, D } from './rooms.js';
import { PI, std, basic, box, cyl, decal, prop, bulb, glowTex, eyeFlower, relief, stamp, tinTex, texMat, sheet, CH, MONTHS, LEAVES, FURN, liveTex, art, artTex, artPlane } from './kit.js';

const Z0 = 2.0, Z1 = -7.6, CXM = 10;                        // the flat runs from its front door (z 2) to the back window
const HW0 = 2.3, HW1 = 1.32, HC0 = 3.3, HC1 = 2.2, RISE = 0.28;
const tAt = (z) => Math.max(0, Math.min(1, (Z0 - z) / (Z0 - Z1)));
const hw = (z) => HW0 + (HW1 - HW0) * tAt(z);
const hc = (z) => HC0 + (HC1 - HC0) * tAt(z);
const fl = (z) => RISE * tAt(z);
const sc = (z) => hc(z) / HC0;                               // how small the world is at this depth
const PARTS = [-0.8, -3.6, -5.8];                            // kitchen | parlour | bedroom | back room
const DOORX = (z) => CXM + 0.5 * sc(z);                      // the doorways line up, a little right of centre
const ST = [CXM, 5.0];                                // the mark on the landing

// the census pieces hung inside the flat: two to a wall in every room, on the slanted walls
export function apartmentSlots() {
  const S = [], a = Math.atan2(HW0 - HW1, Z0 - Z1);
  const at = (z, side) => { const s = sc(z); return { x: CXM + side * (hw(z) - 0.06), y: fl(z) + 1.75 * s, z, ry: side < 0 ? PI / 2 - a : -(PI / 2 - a), w: 0.62 * s }; };
  [1.1, -0.2, -1.6, -2.9, -4.3, -5.2, -6.5].forEach((z, k) => S.push(at(z, k % 2 ? 1 : -1)));
  [0.5, -2.2, -4.9, -7.0].forEach((z, k) => S.push(at(z, k % 2 ? -1 : 1)));
  return S.slice(0, 11);
}

export function apartment(c, r, g, X, mats) {
  const { THREE } = c, MOB = c.MOBILE;
  // ---------- the shell ----------
  const paper = c.tex.load('assets/walls/apartment.jpg'); paper.colorSpace = THREE.SRGBColorSpace; paper.wrapS = THREE.RepeatWrapping; paper.anisotropy = 8;
  const wallM = new THREE.MeshStandardMaterial({ map: paper, roughness: 0.85, side: THREE.DoubleSide });
  const tin = tinTex(c, '#d8cfb6'), ceilM = new THREE.MeshStandardMaterial({ map: tin, roughness: 0.6, metalness: 0.15, side: THREE.DoubleSide });
  const planks = c.surf('planks', 1, 0x8a6040), floorM = new THREE.MeshStandardMaterial({ map: planks.map, normalMap: planks.normalMap, roughnessMap: planks.roughnessMap, color: 0x9a6a44 });
  const N = 24, zs = []; for (let i = 0; i <= N; i++) zs.push(Z0 + (Z1 - Z0) * i / N);
  // u along the run grows by dz / (height * 16 / 9): the wallpaper repeat shrinks with the room
  const uAt = []; let u = 0; zs.forEach((z, i) => { if (i) u += Math.abs(zs[i] - zs[i - 1]) / (hc((z + zs[i - 1]) / 2) * 16 / 9); uAt.push(u); });
  const side = (s) => {   // a slanted side wall, a grid of N by 1 quads
    const pos = [], uv = [], idx = [];
    zs.forEach((z, i) => { const x = CXM + s * hw(z); pos.push(x, fl(z), z, x, fl(z) + hc(z), z); uv.push(uAt[i] * (s < 0 ? 1 : -1), 0, uAt[i] * (s < 0 ? 1 : -1), 1); if (i) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, wallM));
    for (let i = 1; i < zs.length; i++) c.wall(X(CXM + s * (hw(zs[i - 1]) - 0.12)), zs[i - 1], X(CXM + s * (hw(zs[i]) - 0.12)), zs[i]);
  };
  side(-1); side(1);
  const lid = (top) => {   // the floor and the pressed tin ceiling, both shrinking
    const pos = [], uv = [], idx = [], M = 8;
    zs.forEach((z, i) => { for (let j = 0; j <= M; j++) { const x = CXM - hw(z) + 2 * hw(z) * j / M; pos.push(x, top ? fl(z) + hc(z) : fl(z), z); uv.push((x - CXM) / (sc(z) * (top ? 1.6 : 1.4)), uAt[i] * (top ? 3.3 : 2.6)); if (i && j) { const a = (i - 1) * (M + 1) + j - 1, b = a + M + 1; if (top) idx.push(a, a + 1, b, a + 1, b + 1, b); else idx.push(a, b, a + 1, a + 1, b, b + 1); } } });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, top ? ceilM : floorM); g.add(m); return m;
  };
  lid(false); lid(true);
  r.ground = (x, z) => (z < Z0 && z > Z1 && Math.abs(x - CXM) < hw(z) ? fl(z) : 0);
  // baseboards and a picture rail, dark brown, following the slant
  const brown = std(c, 0x3a2414, { roughness: 0.5 });
  for (const s of [-1, 1]) for (const [y0, hh] of [[0, 0.16], [2.55, 0.05]]) {
    const len = Math.hypot(Z0 - Z1, HW0 - HW1), m = box(c, 0.03, hh, len, brown, 0, 0, 0);
    m.position.set(CXM + s * ((HW0 + HW1) / 2 - 0.02), fl((Z0 + Z1) / 2) + y0 * sc((Z0 + Z1) / 2) + hh / 2, (Z0 + Z1) / 2); m.rotation.y = -s * Math.atan2(HW0 - HW1, Z0 - Z1); m.rotation.x = -Math.atan2(RISE + (HC1 - HC0) * (y0 / HC0), Z0 - Z1) * 0; g.add(m);
  }
  // the partitions: a wall across the flat with a doorway that lines up with the next, and a transom over it
  const part = (z, last) => {
    const s = sc(z), w = hw(z), y0 = fl(z), H = hc(z), t = 0.12 * s, dw = 0.86 * s, dh = 2.05 * s, dx = last ? CXM : DOORX(z);
    const pm = new THREE.MeshStandardMaterial({ map: paper, roughness: 0.85 }); pm.userData.repX = H * 16 / 9; pm.userData.repY = H;
    const L = dx - dw / 2 - (CXM - w), R = CXM + w - (dx + dw / 2);
    if (!last) {
      g.add(c.slab(L, H, t, pm, CXM - w + L / 2, y0 + H / 2, z)); g.add(c.slab(R, H, t, pm, dx + dw / 2 + R / 2, y0 + H / 2, z));
      g.add(c.slab(dw, H - dh, t, pm, dx, y0 + dh + (H - dh) / 2, z));
      for (const sx of [-1, 1]) g.add(box(c, 0.07 * s, dh, t + 0.04, brown, dx + sx * (dw / 2 + 0.03 * s), y0 + dh / 2, z));
      g.add(box(c, dw + 0.14 * s, 0.08 * s, t + 0.04, brown, dx, y0 + dh + 0.04 * s, z));
      const tr = new THREE.Mesh(new THREE.PlaneGeometry(dw * 0.9, 0.34 * s), new THREE.MeshStandardMaterial({ color: 0xbfd0e0, transparent: true, opacity: 0.25, roughness: 0.1 })); tr.position.set(dx, y0 + dh + 0.3 * s, z); g.add(tr);
      c.wall(X(CXM - w), z, X(dx - dw / 2), z); c.wall(X(dx + dw / 2), z, X(CXM + w), z);
    }
    return { s, w, y0, H, dx };
  };
  PARTS.forEach((z) => part(z));
  // the back wall and its window onto the J; the view is the 4F window plate, flat, a little way off
  { const z = Z1, s = sc(z), w = hw(z), y0 = fl(z), H = hc(z), ww = 1.3 * s, wy0 = y0 + 0.85 * s, wy1 = y0 + 2.05 * s;
    const pm = new THREE.MeshStandardMaterial({ map: paper, roughness: 0.85 }); pm.userData.repX = H * 16 / 9; pm.userData.repY = H;
    g.add(c.slab(w - ww / 2, H, 0.14, pm, CXM - w / 2 - ww / 4, y0 + H / 2, z)); g.add(c.slab(w - ww / 2, H, 0.14, pm, CXM + w / 2 + ww / 4, y0 + H / 2, z));
    g.add(c.slab(ww, wy0 - y0, 0.14, pm, CXM, (y0 + wy0) / 2, z)); g.add(c.slab(ww, y0 + H - wy1, 0.14, pm, CXM, (wy1 + y0 + H) / 2, z));
    c.wall(X(CXM - w), z + 0.1, X(CXM + w), z + 0.1);
    const frame = std(c, 0xe8e2d4, { roughness: 0.5 });
    for (const sx of [-1, 0, 1]) g.add(box(c, 0.05 * s, wy1 - wy0, 0.08, frame, CXM + sx * ww / 2, (wy0 + wy1) / 2, z + 0.06));
    for (const y of [wy0, (wy0 + wy1) / 2, wy1]) g.add(box(c, ww, 0.05 * s, 0.08, frame, CXM, y, z + 0.06));
    g.add(box(c, ww + 0.2 * s, 0.05, 0.22 * s, frame, CXM, wy0 - 0.02, z + 0.12));
    const view = (window.VIDEOS || []).includes('window') ? liveTex(c, 'window', r) : c.tex.load('assets/plates/window.jpg'); view.colorSpace = THREE.SRGBColorSpace; view.offset.set(0.14, 0.22); view.repeat.set(0.72, 0.78);
    const out = new THREE.Mesh(new THREE.PlaneGeometry(9, 5.6), new THREE.MeshBasicMaterial({ map: view, toneMapped: false, fog: false })); out.position.set(CXM, wy0 + 1.0, z - 2.6); g.add(out);
    const gate = std(c, 0x1a1a1a, { metalness: 0.6 }); for (let k = 0; k < 7; k++) g.add(box(c, 0.012, wy1 - wy0, 0.012, gate, CXM - ww / 2 + 0.06 + k * (ww - 0.12) / 6, (wy0 + wy1) / 2, z - 0.06));
    r.win = { y: (wy0 + wy1) / 2, z };
  }
  // the front of the flat is open, like the front of a shadowbox: a heavy black frame the full width of the kitchen, the
  // door itself off its hinges and leaning on the landing wall with the marshal's new padlock on it
  { const z = Z0, x0 = CXM - HW0, x1 = CXM + HW0, top = HC0, lm = mats.wall;
    g.add(c.slab(x0, r.h, 0.22, lm, x0 / 2, r.h / 2, z + 0.11)); g.add(c.slab(W - x1, r.h, 0.22, lm, x1 + (W - x1) / 2, r.h / 2, z + 0.11));
    g.add(c.slab(x1 - x0, r.h - top, 0.22, lm, CXM, top + (r.h - top) / 2, z + 0.11));
    c.wall(X(0), z + 0.2, X(x0), z + 0.2); c.wall(X(x1), z + 0.2, X(W), z + 0.2);
    const blk = std(c, 0x0b0b0d, { roughness: 0.35, metalness: 0.2 }), T = 0.22, P = 0.32;
    for (const sx of [x0 - T / 2, x1 + T / 2]) g.add(box(c, T, top + T, P, blk, sx, (top + T) / 2, z + P / 2));
    g.add(box(c, x1 - x0 + 2 * T, T, P, blk, CXM, top + T / 2, z + P / 2));
    g.add(box(c, x1 - x0 + 2 * T, 0.12, P + 0.1, blk, CXM, 0.06, z + P / 2 + 0.05));
    const plate = c.sign('4F · THE EVICTION · NEW YORKER No. 47 · A YEAR IN THIRTEEN CHAPTERS', { w: 3.4, h: 0.16, bg: '#b08a3a', fg: '#141414', font: c.MONO, weight: 700 }); plate.position.set(CXM, top + 0.42, z + 0.24); g.add(plate);
    // the door, off its hinges
    const leaf = new THREE.Group(); leaf.position.set(x0 - 1.0, 0, z + 0.36); leaf.rotation.set(-0.06, 0.12, 0); g.add(leaf);
    leaf.add(box(c, 0.92, 2.14, 0.05, std(c, 0x3a2016, { roughness: 0.4 }), 0, 1.07, 0));
    for (const y of [0.55, 1.55]) leaf.add(box(c, 0.7, 0.7, 0.012, std(c, 0x4a2a1c, { roughness: 0.5 }), 0, y, 0.03));
    leaf.add(box(c, 0.05, 0.22, 0.03, std(c, 0xc0c0c8, { metalness: 1, roughness: 0.3 }), 0.36, 1.05, 0.04));
    const lock = box(c, 0.1, 0.12, 0.05, std(c, 0xc8a040, { metalness: 1, roughness: 0.25 }), 0.36, 0.86, 0.06); leaf.add(lock);
    const num = c.sign('4F', { w: 0.26, h: 0.17, bg: '#b08a3a', fg: '#141414', font: c.SERIF, weight: 900 }); num.position.set(0, 1.72, 0.04); leaf.add(num);
    const nt = sheet(c, leaf, 0, 0, 0); nt.rotation.set(0, 0, 0.05); nt.scale.setScalar(1.5); nt.position.set(0, 1.3, 0.04);
    c.post(X(x0 - 1.0), z + 0.4, 0.55);
    c.clickable(leaf, () => c.egg('offhinges', 'The door of 4F, off its hinges and leaning on the landing wall, with the marshal\'s padlock still on it. They took the door so you could see in. Now everybody can.'), 'The door of 4F');
  }
  // ---------- the furniture of 4F ----------
  const items = {}; const add = (k, o) => { (items[k] ||= []).push(o); return o; };
  const S = (z) => sc(z);
  // what stays (the landlord's: the stove, the sink, the radiators, the tub) and what goes (everything that was theirs)
  const pp = (name, x, z, o = {}) => { const s = S(z); const oo = { ...o, h: o.h && o.h * s, len: o.len && o.len * s, y: (o.y || 0) * s + fl(z) }; const m = prop(c, r, g, X, name, x, z, oo); if (o.r) c.post(X(x), z, o.r * s); return m; };
  // kitchen (z 2 to -0.8)
  // the tub in the kitchen: a clawfoot tub, built, with a board across it, and the wash barrel beside it
  const tub = new THREE.Group(); tub.position.set(CXM - 1.75, 0, 0.5); g.add(tub);
  { const en = std(c, 0xf2eee4, { roughness: 0.2 }); tub.add(box(c, 0.7, 0.42, 1.5, en, 0, 0.42, 0)); tub.add(box(c, 0.76, 0.05, 1.56, en, 0, 0.64, 0)); tub.add(box(c, 0.72, 0.04, 1.56, std(c, 0x7a5434, { roughness: 0.8 }), 0, 0.685, 0)); for (const zz of [-0.6, 0.6]) for (const xx of [-0.24, 0.24]) tub.add(cyl(c, 0.05, 0.03, 0.22, std(c, 0xb08a3a, { metalness: 1, roughness: 0.3 }), xx, 0.11, zz, 8)); }
  c.post(X(CXM - 1.75), 0.5, 0.6); const board = tub;
  pp('nyb_treebrooklyn_tub', CXM - 1.6, 1.55, { h: 0.7, ry: 0.4 });
  c.clickable(board, () => c.egg('tubboard', 'The bathtub is in the kitchen, with a board across it: the counter by day, the bath by night. The toilet is out in the hall. This is how half of New York lived for a hundred years.'), 'The tub in the kitchen');
  pp('nyb_kramer_stove', CXM + 1.85, 0.7, { h: 0.95, ry: -PI / 2, r: 0.45 });
  // the kitchen table, where every birthday was
  add(4, pp('WoodenTable_02', CXM + 0.1, -0.15, { len: 1.0, ry: PI / 2 })); add(4, pp('WoodenChair_01', CXM - 0.55, -0.15, { h: 0.95, ry: PI / 2 })); add(4, pp('WoodenChair_01', CXM + 0.75, -0.15, { h: 0.95, ry: -PI / 2 }));
  // the sink and its drainboard, built
  { const z = -0.2, s = S(z); g.add(box(c, 0.55 * s, 0.85 * s, 0.9 * s, std(c, 0xe8e4dc, { roughness: 0.3 }), CXM + hw(z) - 0.32 * s, fl(z) + 0.42 * s, z)); g.add(box(c, 0.4 * s, 0.05, 0.6 * s, std(c, 0x9aa0a8, { metalness: 0.8, roughness: 0.25 }), CXM + hw(z) - 0.32 * s, fl(z) + 0.86 * s, z)); c.post(X(CXM + hw(z) - 0.32), z, 0.45); }
  // the fridge: a round shouldered old one, covered in magnets and one child's drawing of an eye flower
  { const z = 1.55, s = S(z), x = CXM + hw(z) - 0.42; const fr = new THREE.Group(); fr.position.set(x, fl(z), z); g.add(fr);
    fr.add(box(c, 0.7, 1.55, 0.66, std(c, 0xf0ece0, { roughness: 0.3 }), 0, 0.78, 0)); { const sh = cyl(c, 0.33, 0.33, 0.7, std(c, 0xf0ece0, { roughness: 0.3 }), 0, 1.55, 0, 20); sh.rotation.z = PI / 2; fr.add(sh); }
    fr.add(box(c, 0.05, 0.36, 0.04, std(c, 0xc0c0c8, { metalness: 1 }), -0.36, 1.15, 0.22));
    const art = decal(c, 0.3, 0.4, (q, w, h) => { q.fillStyle = '#fff'; q.fillRect(0, 0, w, h); eyeFlower(q, w / 2, h * 0.42, w * 0.38, '#ffe8a0', '#ff7a1a'); q.fillStyle = '#1d4ed8'; q.font = `800 ${w * 0.11}px ${c.FONT}`; q.textAlign = 'center'; q.fillText('ABUELA', w / 2, h * 0.9); });
    art.position.set(-0.36, 0.9, -0.05); art.rotation.y = -PI / 2; fr.add(art); fr.rotation.y = 0; c.post(X(x), z, 0.5);
    c.clickable(fr, () => c.egg('fridge', 'Forty one years of magnets: a pizza place that closed in 1998, a dentist, a Mets schedule, and a drawing of an eye flower signed ABUELA in a six year old\'s capitals.'), 'The fridge'); }
  // the calendar on the kitchen wall: the clock of the whole room
  const calTex = c.canvasTex(256, 340, () => {}), calCv = calTex.userData.canvas.getContext('2d');
  const drawCal = (n) => { const q = calCv, w = 256, h = 340; q.fillStyle = '#f2ede0'; q.fillRect(0, 0, w, h); q.fillStyle = '#c8281e'; q.fillRect(0, 0, w, 64); q.fillStyle = '#fff'; q.font = `900 30px ${c.SERIF}`; q.textAlign = 'center'; q.fillText(MONTHS[n].split(' ')[0].toUpperCase(), w / 2, 42); q.font = `700 13px ${c.MONO}`; q.fillText(MONTHS[n].split(' ')[1], w / 2, 58);
    q.fillStyle = '#141414'; q.font = `600 15px ${c.MONO}`; for (let d = 0; d < 30; d++) { const x = 22 + (d % 7) * 35, y = 96 + ((d / 7) | 0) * 34; q.fillText(String(d + 1), x + 6, y); if (d === 0) { q.strokeStyle = '#c8281e'; q.lineWidth = 3; q.beginPath(); q.arc(x + 6, y - 5, 14, 0, 7); q.stroke(); } }
    q.font = `800 12px ${c.FONT}`; q.fillStyle = '#c8281e'; q.fillText(n === 0 ? 'RENT DUE THE 1ST' : n < 12 ? `${LEAVES[n - 1].what.toUpperCase()} WENT` : 'KEYS UNDER THE WINDOW', w / 2, 300); q.fillStyle = '#1d4ed8'; q.font = `700 11px ${c.MONO}`; q.fillText('N3W YORKERS · COUNTED', w / 2, 322); calTex.needsUpdate = true; };
  const cal = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.56), new THREE.MeshStandardMaterial({ map: calTex, roughness: 0.9 }));
  { const z = 0.25, a = Math.atan2(HW0 - HW1, Z0 - Z1); cal.position.set(CXM + hw(z) - 0.03, 1.7, z); cal.rotation.y = -(PI / 2 - a); g.add(cal); }
  c.clickable(cal, () => tear(1), 'Tear a month off the calendar');
  // parlour (z -0.8 to -3.6)
  // the television: a wooden console CRT, and on it the channels are New Yorkers from the block
  { const z = -1.6, k = S(z), x = CXM + hw(z) - 0.42 * k, tv = new THREE.Group(); tv.position.set(x, fl(z), z); tv.rotation.y = -PI / 2; tv.scale.setScalar(k); g.add(tv); add(1, tv);
    const wood = std(c, 0x4a2c18, { roughness: 0.45 });
    tv.add(box(c, 0.95, 0.5, 0.5, wood, 0, 0.25, 0)); for (const sx of [-0.4, 0.4]) tv.add(cyl(c, 0.02, 0.015, 0.18, wood, sx, -0.04, 0.15, 6));
    tv.add(box(c, 0.72, 0.58, 0.52, std(c, 0x1a1a1c, { roughness: 0.4 }), 0, 0.79, -0.02));
    const ch = { k: 0, n: 0, noise: 0 }, scr = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.42), new THREE.MeshBasicMaterial({ toneMapped: false })); scr.position.set(0, 0.8, 0.245); tv.add(scr);
    const snow = c.canvasTex(128, 96, () => {}), sq = snow.userData.canvas.getContext('2d');
    const tune = (d) => { ch.k += d; ch.noise = 0.35; c.sound.tick(); };
    tv.add(box(c, 0.06, 0.06, 0.04, std(c, 0xc8a040, { metalness: 1 }), 0.28, 0.6, 0.25)); tv.add(box(c, 0.06, 0.06, 0.04, std(c, 0xc8a040, { metalness: 1 }), 0.28, 0.5, 0.25));
    const rabbit = new THREE.Group(); rabbit.position.set(0, 1.08, -0.05); tv.add(rabbit); for (const s2 of [-1, 1]) { const ant = cyl(c, 0.006, 0.006, 0.55, std(c, 0xc0c0c8, { metalness: 1 }), s2 * 0.12, 0.24, 0, 6); ant.rotation.z = -s2 * 0.45; rabbit.add(ant); }
    c.clickable(tv, () => { tune(1); if (++ch.n === 6) c.egg('channels', 'Six channels and every one of them is a New Yorker from this block. The set came with the flat in 1985. The rabbit ears still get Brooklyn.'); }, 'Change the channel');
    c.tick((t, dt, P, ri) => { if (ri !== r.i || !tv.visible) return; ch.auto = (ch.auto || 0) + dt; if (ch.auto > 6) { ch.auto = 0; tune(1); }
      if (ch.noise > 0) { ch.noise -= dt; const im = sq.createImageData(128, 96); for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } sq.putImageData(im, 0, 0); snow.needsUpdate = true; scr.material.map = snow; }
      else { const p = art(r, 12 + (ch.k % 8)); scr.material.map = artTex(c, p); }
      scr.material.color.setScalar(0.85 + Math.sin(t * 40) * 0.04 + (Math.sin(t * 3.1) > 0.98 ? -0.3 : 0)); });
  }
  add(2, pp('ArmChair_01', CXM - 0.9, -1.4, { h: 0.95, ry: PI * 0.75 }));
  add(3, pp('boombox', CXM - hw(-3.3) + 0.4, -3.3, { len: 0.5, y: 0.62, ry: PI / 2 })); add(3, pp('side_table_01', CXM - hw(-3.3) + 0.4, -3.3, { h: 0.6 }));
  add(8, pp('sofa_03', CXM - hw(-2.3) + 0.5 * S(-2.3), -2.3, { len: 2.0, ry: PI / 2 }));
  add(6, pp('wooden_bookshelf_worn', CXM + hw(-3.1) - 0.25 * S(-3.1), -3.1, { h: 1.8, ry: -PI / 2 }));
  // the rug, and under it a floor the sun never reached
  { const z = -2.2, s = S(z), rugT = c.canvasTex(256, 384, (q, w, h) => { q.fillStyle = '#7a1e22'; q.fillRect(0, 0, w, h); q.strokeStyle = '#d8b060'; q.lineWidth = 8; q.strokeRect(14, 14, w - 28, h - 28); q.strokeStyle = '#1d3a6a'; q.lineWidth = 5; q.strokeRect(32, 32, w - 64, h - 64); eyeFlower(q, w / 2, h / 2, 70, '#e8c890', '#d8b060'); for (let i = 0; i < 2500; i++) { q.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`; q.fillRect(Math.random() * w, Math.random() * h, 2, 2); } });
    const ghost = new THREE.Mesh(new THREE.PlaneGeometry(1.9 * s, 2.6 * s), std(c, 0xb08050, { roughness: 0.7, transparent: true, opacity: 0.55, polygonOffset: true, polygonOffsetFactor: -2 })); ghost.rotation.x = -PI / 2; ghost.position.set(CXM + 0.1, fl(z) + 0.004, z); g.add(ghost);
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(1.9 * s, 2.6 * s), new THREE.MeshStandardMaterial({ map: rugT, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -4 })); rug.rotation.x = -PI / 2; rug.position.set(CXM + 0.1, fl(z) + 0.008, z); g.add(rug); add(5, rug);
    c.clickable(ghost, () => c.egg('rugshadow', 'Where the rug was, the floor is a different colour: forty years of sun went round it. The shape of a rug, kept by the floor.'), 'The floor where the rug was'); }
  // bedroom (z -3.6 to -5.8)
  add(10, pp('old_bed_frame', CXM - hw(-4.7) + 0.6 * S(-4.7), -4.7, { len: 2.0, ry: 0 }));
  add(9, pp('drawer_cabinet', CXM + hw(-4.4) - 0.3 * S(-4.4), -4.4, { h: 1.0, ry: -PI / 2 }));
  { const z = -4.4, s = S(z), a = Math.atan2(HW0 - HW1, Z0 - Z1); const mir = new THREE.Group(); mir.position.set(CXM + hw(z) - 0.05, fl(z) + 1.5 * s, z); mir.rotation.y = -(PI / 2 - a); g.add(mir); add(9, mir);
    mir.add(box(c, 0.7 * s, 0.9 * s, 0.04, std(c, 0x6a4a20, { metalness: 0.4, roughness: 0.4 }), 0, 0, 0)); { const gl = new THREE.Mesh(new THREE.PlaneGeometry(0.6 * s, 0.8 * s), std(c, 0xc8d4e0, { metalness: 1, roughness: 0.05 })); gl.position.z = 0.025; mir.add(gl); } }
  // back room (z -5.8 to -7.6)
  add(7, pp('potted_plant_02', CXM - 0.45, -7.2, { h: 0.9 })); add(7, pp('potted_plant_04', CXM + 0.45, -7.2, { h: 0.7 }));
  add(11, pp('Rockingchair_01', CXM + 0.2, -6.4, { h: 1.0, ry: PI }));
  add(12, pp('nyb_bronx_lamp', CXM - hw(-6.1) + 0.3, -6.1, { h: 1.55 }));
  // the frames on the walls: one comes down every month and leaves its ghost on the wallpaper
  const frames = (r.hung || []).slice(0, 11);
  frames.forEach((f, k) => { const sl = f.userData.slot; const gh = new THREE.Mesh(new THREE.PlaneGeometry(sl.w + 0.08, sl.w * 1.25), basic(c, 0xfff6e0, { transparent: true, opacity: 0.16, depthWrite: false })); gh.position.copy(f.position); gh.rotation.copy(f.rotation); gh.translateZ(0.005); g.add(gh); add(k + 1, f);
    // the afterimage: touch the pale rectangle and the painting that hung there comes back for a moment, like a burn on the eye
    const p = r.cast[k], ai = new THREE.Mesh(new THREE.PlaneGeometry(sl.w, sl.w * 9 / 16), new THREE.MeshBasicMaterial({ map: artTex(c, p), transparent: true, opacity: 0, depthWrite: false, toneMapped: false })); ai.position.copy(f.position); ai.rotation.copy(f.rotation); ai.translateZ(0.012); g.add(ai);
    let fade = 0; c.clickable(gh, () => { if (f.visible) return; fade = 2.6; c.egg('afterimage', `The pale rectangle remembers: ${p.t}, No. ${p.n}. It hung here until they took it down. The wallpaper kept its shape, and for a second, its picture.`); }, 'Where a frame used to hang');
    c.tick((t, dt) => { if (fade > 0) { fade -= dt; ai.material.opacity = Math.min(1, fade) * 0.85 * (0.9 + Math.sin(t * 30) * 0.1); } else if (ai.material.opacity) ai.material.opacity = 0; }); });
  // the shrine in the back room: a little shelf of photographs, a candle, and the family that lived here, in New Yorkers
  { const z = -6.5, k = S(z), x = CXM + hw(z) - 0.12, sh = new THREE.Group(); sh.position.set(x, fl(z) + 1.15 * k, z); sh.rotation.y = -(PI / 2 - Math.atan2(HW0 - HW1, Z0 - Z1)); sh.scale.setScalar(k); g.add(sh); add(11, sh);
    sh.add(box(c, 0.9, 0.04, 0.2, std(c, 0x3a2414), 0, 0, 0.1));
    for (let i = 0; i < 4; i++) { const p = art(r, 16 + i), fr = new THREE.Group(); fr.position.set(-0.32 + i * 0.21, 0.13 + (i % 2) * 0.03, 0.1); fr.rotation.x = -0.12; sh.add(fr); fr.add(box(c, 0.19, 0.13, 0.015, std(c, 0xc8a040, { metalness: 0.8 }), 0, 0, 0)); const ph = artPlane(c, fr, p, 0.16, 0.09, { hint: 'A photograph on the shrine', egg: ['shrine', 'The shrine in the back room: four photographs in gold frames, a candle that never went out. Every family in New York has one of these, and every one of them is a New Yorker.'] }); ph.position.z = 0.009; }
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), basic(c, 0xffb040)); flame.position.set(0.42, 0.12, 0.12); sh.add(flame); sh.add(cyl(c, 0.025, 0.025, 0.08, std(c, 0xc8281e), 0.42, 0.06, 0.12, 10));
    const fg = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,170,60,.6)'), transparent: true, depthWrite: false, toneMapped: false })); fg.scale.setScalar(0.18); fg.position.copy(flame.position); sh.add(fg);
    c.tick((t) => { flame.scale.y = 1.3 + Math.sin(t * 17) * 0.25; fg.material.opacity = 0.7 + Math.sin(t * 23) * 0.2; }); }
  // the radiators, which stay
  for (const z of [0.0, -2.0, -6.9]) { const s = S(z), x = CXM - hw(z) + 0.14 * s, R = new THREE.Group(); R.position.set(x, fl(z), z); R.scale.setScalar(s); g.add(R); const iron = std(c, 0xb0a890, { metalness: 0.6, roughness: 0.5 }); for (let k = 0; k < 10; k++) R.add(box(c, 0.14, 0.75, 0.06, iron, 0, 0.45, -0.4 + k * 0.09)); }
  // a bulb in every room, smaller every room
  const bulbs = [];
  [[0.6], [-2.2], [-4.7], [-6.7]].forEach(([z], k) => { const b = bulb(c, g, CXM + 0.1, fl(z) + hc(z), z, 0xffc888, 0.5 * sc(z)); b.scale.setScalar(sc(z)); bulbs.push(b); if (k === 3) add(12, b); });
  const lamps = MOB ? [] : [new THREE.PointLight(0xffc080, 6, 5, 1.6), new THREE.PointLight(0xffb070, 4, 4, 1.6)];
  lamps.forEach((L, k) => { L.position.set(CXM, [2.4, 1.9][k], [-2.2, -6.4][k]); g.add(L); });

  // ---------- the key, which appears in the last chapter ----------
  const key = new THREE.Group(); key.position.set(CXM + 0.3, fl(-7.2) + 0.012, -7.2); key.rotation.y = 0.6; g.add(key);
  const brass = std(c, 0xd0a040, { metalness: 1, roughness: 0.25 });
  { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 8, 20), brass); ring.rotation.x = PI / 2; key.add(ring); key.add(box(c, 0.012, 0.012, 0.14, brass, 0, 0, 0.1)); key.add(box(c, 0.012, 0.03, 0.012, brass, 0, -0.015, 0.15)); key.add(box(c, 0.012, 0.02, 0.012, brass, 0, -0.01, 0.13));
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,210,120,.5)'), transparent: true, depthWrite: false, toneMapped: false })); gl.scale.setScalar(0.4); gl.position.y = 0.04; key.add(gl); }
  const keyHit = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshBasicMaterial({ visible: false })); key.add(keyHit);
  c.clickable(keyHit, () => { c.egg('key', 'The key to 4F, on the floor under the window, where she left it. The marshal changed the lock in March. It opens nothing now. It is the only thing in the flat that is still hers.'); stamp(c, 'OCTOBER 2027', 1400); }, 'The key');

  // ---------- the year ----------
  // a piece of furniture, carried out by two movers: it slides up the flat to the door and onto the landing
  const movers = [c.glb('tough', { h: 1.8, parent: g }), c.glb('tracksuit', { h: 1.78, parent: g })]; movers.forEach((m) => { m.visible = false; });
  const moving = [];
  const home = (o) => { if (!o.userData.home) o.userData.home = o.position.clone(); return o.userData.home; };
  const show = (n, was) => {
    for (const k in items) for (const o of items[k]) {
      const gone = n >= +k; home(o);
      if (gone && was === n - 1 && +k === n && o.visible) { moving.push({ o, t: 0 }); continue; }
      o.visible = !gone; o.position.copy(o.userData.home); if (o.material && o.material.opacity !== undefined && o.userData.fade) o.material.opacity = 1;
    }
    key.visible = n >= 12; drawCal(n); panel(n);
    lamps.forEach((L) => { L.intensity = n >= 12 ? 0 : L === lamps[1] ? 4 : 6; });
  };
  let anim = 0;
  c.tick((t, dt, P, ri) => {
    if (!moving.length) { movers.forEach((m) => { m.visible = false; }); return; }
    const mv = moving[0]; mv.t += dt / 3.6; const o = mv.o, h = o.userData.home, u = Math.min(1, mv.t);
    const path = [[h.x, h.z], [DOORX(h.z), Math.min(Z0 - 0.3, h.z + 0.6)], [ST[0], Z0 - 0.4], [ST[0], Z0 + 1.2], [ST[0] + 3, Z0 + 3.5]];
    const seg = Math.min(path.length - 2, Math.floor(u * (path.length - 1))), k = u * (path.length - 1) - seg, [ax, az] = path[seg], [bx, bz] = path[seg + 1];
    const x = ax + (bx - ax) * k, z = az + (bz - az) * k; o.position.set(x, fl(z) + 0.12 + Math.abs(Math.sin(u * 18)) * 0.03, z);
    movers.forEach((m, j) => { m.visible = true; m.scale.setScalar(Math.max(sc(z), 0.7)); m.position.set(x + (j ? 0.45 : -0.45) * sc(z), fl(z), z + (j ? 0.25 : -0.25)); m.rotation.y = Math.atan2(bx - ax, bz - az) + PI; });
    if (u >= 1) { o.visible = false; o.position.copy(h); moving.shift(); }
  });
  function tear(d) {
    const n = Math.max(0, Math.min(12, CH.n + d)); if (n === CH.n) { c.toast(n >= 12 ? 'That was the last page. October again, and the flat is empty.' : 'That is as far back as the story goes: October 2026, everything in its place.', 3000); return; }
    c.sound.tick(); if (d > 0) setTimeout(() => c.sound.thud(0.3), 300);
    CH.set(n, 'preview');
    if (d > 0 && n >= 1) { const L = LEAVES[n - 1]; c.toast(`${MONTHS[n]}. ${L.what[0].toUpperCase() + L.what.slice(1)} went. ${L.why}`, 5200); }
    if (n === 12) { setTimeout(() => stamp(c, 'EVICTED', 1800), 3800); c.egg('wholeyear', 'You tore the whole year off the wall. Twelve first of the months, twelve things carried down four floors, eleven frames, and a key on the floor. The flat is bare. Downstairs, the curb is full.'); }
  }
  // ---------- the chapter panel: the dynamic token, as a room ----------
  const el = document.createElement('div'); el.id = 'evpanel';
  el.innerHTML = `<style>#evpanel{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:12;display:none;pointer-events:auto;background:rgba(11,12,16,.84);border:1px solid #ff7a1a;border-radius:16px;padding:10px 14px;max-width:min(680px,94vw);font:500 12px/1.45 var(--sans,system-ui);color:#f4ead2;backdrop-filter:blur(8px)}#evpanel.on{display:block}#evpanel .k{font:700 10px var(--mono,monospace);letter-spacing:.2em;color:#ff7a1a}#evpanel b{font:900 18px/1.1 var(--serif,Georgia);display:block;margin:2px 0 3px}#evpanel .w{color:#cfc6b0}#evpanel .row{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}#evpanel button{border:1px solid rgba(244,234,210,.3);background:#14161e;color:#f4ead2;border-radius:999px;padding:6px 11px;font:700 10px var(--mono,monospace);letter-spacing:.1em}#evpanel button.hot{background:#ff7a1a;color:#0b0c10;border-color:#ff7a1a}#evpanel .bar{display:flex;gap:2px;margin-top:6px}#evpanel .bar i{flex:1;height:4px;border-radius:2px;background:#2a2c36}#evpanel .bar i.on{background:#ff7a1a}#evpanel .bar i.live{outline:1px solid #22d3ee}@media (max-width:700px){#evpanel{bottom:70px;font-size:11px}#evpanel b{font-size:15px}}</style>
  <div class="k" id="evk"></div><b id="evm"></b><div class="w" id="evw"></div><div class="bar" id="evbar"></div>
  <div class="row"><button id="evback">&lt; A MONTH BACK</button><button id="evtear" class="hot">TEAR A MONTH &gt;</button><button id="evpin">PIN THIS MONTH</button><button id="evlive">FOLLOW THE CALENDAR</button></div>`;
  document.body.appendChild(el);
  const $ = (s) => el.querySelector(s); el.addEventListener('pointerdown', (e) => e.stopPropagation()); el.addEventListener('click', (e) => e.stopPropagation());
  for (let i = 0; i <= 12; i++) $('#evbar').appendChild(document.createElement('i'));
  $('#evback').onclick = () => tear(-1); $('#evtear').onclick = () => tear(1);
  $('#evpin').onclick = () => { CH.set(CH.n, 'pin'); c.sound.ding(); c.egg('pinned', `Pinned. The flat stays at ${MONTHS[CH.n]} for you, whatever the date. That is the holder's right on a dynamic token: the artist adds a chapter every month, you choose which one is on the wall.`); };
  $('#evlive').onclick = () => { CH.set(CH.live, 'unpin'); c.toast(`Following the New York calendar: ${MONTHS[CH.live]}. On the first of every month, something else leaves.`, 3600); };
  function panel(n) {
    $('#evk').textContent = `4F · CHAPTER ${n + 1} OF 13 · ${CH.pinned !== null && CH.preview === null ? 'PINNED' : CH.preview !== null ? 'LOOKING AHEAD' : 'LIVE, THE NEW YORK CALENDAR'}`;
    $('#evm').textContent = MONTHS[n];
    $('#evw').textContent = n === 0 ? 'Everything in its place. Forty one years of it. Rent is due on the first.' : n >= 12 ? 'Bare. The key is on the floor under the window.' : `Gone so far: ${LEAVES.filter((l) => l.k <= n).map((l) => l.what).join(', ')}.`;
    [...$('#evbar').children].forEach((b, i) => { b.className = (i <= n ? 'on' : '') + (i === CH.live ? ' live' : ''); });
    $('#evpin').classList.toggle('hot', CH.pinned === n && CH.preview === null);
  }

  // ---------- the mark: the view from the door ----------
  const mark = decal(c, 1.0, 0.7, (q, w, h) => { q.fillStyle = 'rgba(0,0,0,0)'; q.fillRect(0, 0, w, h); q.fillStyle = '#ff7a1a'; for (const sx of [-1, 1]) { q.beginPath(); q.ellipse(w / 2 + sx * w * 0.12, h * 0.42, w * 0.07, h * 0.2, 0, 0, 7); q.fill(); } q.fillStyle = '#f4ead2'; q.font = `800 ${h * 0.11}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('STAND HERE · THE VIEW FROM THE DOOR', w / 2, h * 0.92); }, 512);
  mark.rotation.x = -PI / 2; mark.position.set(ST[0], 0.012, ST[1]); g.add(mark);
  let still = 0, box_ = false, lx = 0, lz = 0; const fw = new THREE.Vector3();
  r.fov = () => (box_ ? 48 : 66);
  c.tick((t, dt, P, ri) => {
    const here = ri === r.i; el.classList.toggle('on', here && !document.getElementById('intro')?.classList.contains('on') && !box_);
    if (!here) { box_ = false; still = 0; return; }
    c.camera.getWorldDirection(fw); const mv = Math.hypot(P.x - lx, P.z - lz); lx = P.x; lz = P.z;
    const on = Math.hypot(P.x - r.x0 - ST[0], P.z - ST[1]) < 0.5 && fw.z < -0.92;
    still = on && mv < 0.004 ? still + dt : 0;
    const want = still > 1.4; if (want !== box_) { box_ = want; if (want) { c.sound.tick(); c.egg('shadowbox', 'The view from the door. Nine metres of flat read as twenty from here: every room smaller than the last, the floor rising, the ceiling coming down, the wallpaper shrinking. Walk in and see how small it really was.'); } }
    if (c.lights[2]) c.lights[2].userData.i = box_ ? 1.5 : 10;
    // the J goes past the back window every forty seconds or so: a bar of cold light runs through the flat
    const ph = (t % 41) / 41; if (c.lights[1]) c.lights[1].userData.i = ph > 0.9 ? 8 + (Math.sin(t * 50) > 0 ? 16 : 4) : 8;
    if (Math.abs(ph - 0.9) < dt / 41) c.sound.roar(0.25);
  });
  // giant by the window: walking all the way in is its own egg
  c.tick((t, dt, P, ri) => { if (ri === r.i && P.z < -6.9 && !r._giant) { r._giant = true; c.egg('giant', 'All the way in. The ceiling is at your ear, the chair would not hold you, the window comes to your waist. From the door it looked like a whole life. It was four small rooms.'); } });

  // The Eviction waits on the landing, beside the door, with the paperwork
  const him = relief(c, g, 'eviction', { h: 1.9, x: CXM + HW0 + 1.1, z: 2.9, depth: 0.24 });
  him.userData.click = () => { c.say(him, CH.n >= 12 ? 'That is the lot. Twelve months, twelve trips. I will be on the next floor down in November.' : `${MONTHS[CH.n]}. I come on the first. ${CH.n < 12 ? 'Next month: ' + LEAVES[CH.n].what + '.' : ''}`, 4200, 2.2); c.egg('onthefirst'); };
  him.userData.hint = 'The Eviction, with the paperwork';
  c.post(X(CXM + HW0 + 1.1), 2.9, 0.4);
  CH.on(show);   // last: show() draws the calendar and the panel, which are all defined by now
}
