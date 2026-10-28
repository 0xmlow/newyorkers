// SAME DIFFERENCE, room by room. The shell of every room is built here; what makes a room itself (its frame for
// a diptych that moves) lives in its own file (r_*.js), one trick each.
import { W, D, H_IN, PORTAL, ROOMS } from './rooms.js';
import { PI, INK, std, decal, eyeFlower, prop, paperTex, hexTex, linoTex, tarTex, texMat } from './kit.js';
import { platform } from './r_platform.js';
import { departures } from './r_departures.js';
import { deli } from './r_deli.js';
import { interrogation } from './r_interrogation.js';
import { whisper } from './r_whisper.js';
import { henge } from './r_henge.js';
import { subway } from './r_subway.js';
import { doors } from './r_doors.js';
import { shop } from './r_shop.js';
export { eyeFlower };

const DZ1 = 2, DZ2 = 5.6, DH = 3.6;
const ROOM = { platform, departures, deli, interrogation, whisper, henge, subway, doors, shop };
const southOnly = (r, HT) => { const S = [], y = Math.min(2.1, HT - 1.1); for (let i = 0; i < 6; i++) S.push({ x: 8.4 + i * 1.9, y, z: D / 2 - 0.14, ry: PI, w: 1.2 }); return S; };
const SLOTS = {};   // the census pieces live in the tricks here, not in rows of frames

export function buildRoom(c, r) {
  const { THREE, scene } = c;
  const g = r.group = new THREE.Group(); g.position.x = r.x0; scene.add(g);
  const X = (x) => r.x0 + x;
  const mats = r.mats = matsFor(c, r);
  const HI = r.h || H_IN, HT = r.outdoor ? (r.low ? 4 : 10) : HI, dh = Math.min(DH, HT - 0.45), PH = Math.min(PORTAL.h, HI - 0.35);

  if (!r.noFloor) g.add(c.slab(W, 0.1, D, mats.floor, W / 2, -0.05, 0));
  if (r.ceil && !r.outdoor && !r.noCeil) {
    g.add(c.slab(W, 0.1, D, mats.ceil, W / 2, HI + 0.05, 0));
    // a lit ceiling: two runs of fixtures, so a dark ceiling never reads as a void over the room
    const fx = new c.THREE.MeshBasicMaterial({ color: r.fixture || 0xfff2dc, toneMapped: false }), fb = std(c, 0x2a2a2a, { roughness: 0.6 });
    for (const z of r.fixZ || [-3.2, 3.2]) for (let x = 2.5; x < W; x += 5) { g.add(c.slab(1.9, 0.06, 0.42, fb, x, HI - 0.03, z)); const p = new c.THREE.Mesh(new c.THREE.BoxGeometry(1.7, 0.02, 0.26), fx); p.position.set(x, HI - 0.07, z); g.add(p); }
  }

  const pw = PORTAL.w, px1 = (W - pw) / 2, px2 = (W + pw) / 2, NH = r.low ? 1.1 : HT;
  g.add(c.slab(W, HT, 0.24, mats.wall, W / 2, HT / 2, D / 2 + 0.12)); c.wall(X(0), D / 2, X(W), D / 2);
  if (!r.noNorth) {
    g.add(c.slab(px1, NH, 0.24, mats.wall, px1 / 2, NH / 2, -D / 2 - 0.12));
    g.add(c.slab(px1, NH, 0.24, mats.wall, px2 + px1 / 2, NH / 2, -D / 2 - 0.12));
    if (!r.outdoor) g.add(c.slab(pw, HI - PH, 0.24, mats.wall, W / 2, PH + (HI - PH) / 2, -D / 2 - 0.12));
    if (r.closed) g.add(c.slab(pw, r.outdoor ? NH : PH, 0.24, mats.wall, W / 2, (r.outdoor ? NH : PH) / 2, -D / 2 - 0.12));   // no plate: the opening is wall
  }
  c.wall(X(0), -D / 2, X(W), -D / 2);
  const sideWall = (x, door) => {
    if (!door) { g.add(c.slab(0.24, HT, D, mats.wall, x, HT / 2, 0)); c.wall(X(x), -D / 2, X(x), D / 2); return; }
    const a = DZ1 + D / 2, b = D / 2 - DZ2;
    g.add(c.slab(0.24, HT, a, mats.wall, x, HT / 2, -D / 2 + a / 2));
    g.add(c.slab(0.24, HT, b, mats.wall, x, HT / 2, D / 2 - b / 2));
    g.add(c.slab(0.24, HT - dh, DZ2 - DZ1, mats.wall, x, dh + (HT - dh) / 2, (DZ1 + DZ2) / 2));
    c.wall(X(x), -D / 2, X(x), DZ1); c.wall(X(x), DZ2, X(x), D / 2);
    // a door frame: nine coats of brown paint
    const fr = std(c, 0x3a2416, { roughness: 0.45 });
    for (const z of [DZ1, DZ2]) g.add(c.slab(0.36, dh, 0.16, fr, x, dh / 2, z));
    g.add(c.slab(0.36, 0.2, DZ2 - DZ1 + 0.16, fr, x, dh + 0.1, (DZ1 + DZ2) / 2));
  };
  sideWall(0, r.i > 0);
  if (r.last) sideWall(W, false);
  else sideWall(W - 0.25, true);   // the room's own face on the shared wall, so the next room's wallpaper does not show through
  const ds = { w: 2.6, h: 0.42, bg: '#0d0d0d', fg: '#f4ead2', border: '#ff7a1a' };
  if (r.i > 0) { const s = c.sign(`< ${r.prev}`, ds); s.position.set(0.15, dh + 0.45 < HT - 0.25 ? dh + 0.45 : dh - 0.3, (DZ1 + DZ2) / 2); s.rotation.y = PI / 2; g.add(s); }
  if (r.next) { const s = c.sign(`${r.next} >`, ds); s.position.set(W - 0.15, dh + 0.45 < HT - 0.25 ? dh + 0.45 : dh - 0.3, (DZ1 + DZ2) / 2); s.rotation.y = -PI / 2; g.add(s); }

  if (!r.noPlate) c.plate(r);

  const slots = SLOTS[r.id] ? SLOTS[r.id](r, HT) : [];
  r.cast.forEach((p, k) => { const s = slots[k]; if (!s) return; const f = c.hang(p, s.x, s.y, s.z, s.ry, s.w || 1.3, r.frame, g); f.userData.slot = s; (r.hung ||= []).push(f); });

  notice(c, r, g, HT);
  if (!r.noRope) rope(c, r, g, X);
  else if (r.edge) c.wall(X(0), -D / 2 + 1.2, X(W), -D / 2 + 1.2);
  ROOM[r.id] && ROOM[r.id](c, r, g, X, mats);
  boxes(c, r, g, X);
}

// ---------- surfaces ----------
function matsFor(c, r) {
  const { THREE } = c;
  const m = {};
  if (r.floor === 'tile') m.floor = texMat(c, hexTex(c), 1.6, { color: r.floorTint || 0xffffff, roughness: 0.35 });
  else if (r.floor === 'linoleum') m.floor = texMat(c, linoTex(c), 2.4, { color: r.floorTint || 0xffffff, roughness: 0.3 });
  else if (r.floor === 'tar') m.floor = texMat(c, tarTex(c), 4, { color: r.floorTint || 0xffffff, roughness: 0.75, metalness: 0.2 });
  else m.floor = c.surf(r.floor, r.floor === 'asphalt' ? 3 : 2.2, r.floorTint || (r.outdoor ? 0x6a6c76 : 0x9a9a9a));
  m.ceil = r.ceil ? c.surf(r.ceil, 3, 0x5a5650) : null;
  if ((window.WALLS || []).includes(r.wallFrom || r.id)) {
    const t = c.tex.load(`assets/walls/${r.wallFrom || r.id}.jpg`); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8;
    m.wall = new THREE.MeshStandardMaterial({ map: t, roughness: 0.82, color: r.muralTint || 0xffffff });
    const HT = r.outdoor ? (r.low ? 4 : 10) : (r.h || H_IN);
    m.wall.userData.repX = HT * 16 / 9 * (r.wallScale || 1); m.wall.userData.repY = HT;
  }
  else if (r.outdoor) m.wall = c.surf('brick', 2.4, 0x6e6660);
  else m.wall = c.surf(r.wall, 2.4, r.wallTint);
  if (r.floor === 'asphalt') { m.floor.roughness = 0.22; m.floor.metalness = 0.35; }
  return m;
}

// ---------- the shared furniture: a notice on every wall, a rope, the boxes ----------
// Every room carries a typed notice beside the picture, the way every door in the building did that year.
function notice(c, r, g, HT) {
  const board = decal(c, 0.9, 1.16, (q, w, h) => {
    q.fillStyle = '#f2ede0'; q.fillRect(0, 0, w, h); q.fillStyle = 'rgba(0,0,0,.05)'; for (let i = 0; i < 80; i++) q.fillRect(Math.random() * w, Math.random() * h, 40, 1);
    q.fillStyle = '#141414'; q.textAlign = 'center'; q.font = `800 ${w * 0.06}px ${c.MONO}`; q.fillText('NOTICE', w / 2, h * 0.09);
    q.font = `600 ${w * 0.032}px ${c.MONO}`; q.fillText(`ROOM ${r.i + 1} OF ${ROOMS.length} · SAME DIFFERENCE`, w / 2, h * 0.14);
    q.fillRect(w * 0.08, h * 0.17, w * 0.84, 2);
    q.font = `900 ${w * 0.07}px ${c.SERIF}`; const words = r.name.split(' '); let line = '', y = h * 0.28;
    for (const wd of words) { if (q.measureText(line + wd).width > w * 0.84) { q.fillText(line.trim(), w / 2, y); line = ''; y += w * 0.085; } line += wd + ' '; } q.fillText(line.trim(), w / 2, y);
    q.font = `500 ${w * 0.034}px ${c.MONO}`; y += w * 0.08; const f = r.film; let l2 = '';
    for (const wd of f.split(' ')) { if (q.measureText(l2 + wd).width > w * 0.84) { q.fillText(l2.trim(), w / 2, y); l2 = ''; y += w * 0.05; } l2 += wd + ' '; } q.fillText(l2.trim(), w / 2, y);
    q.fillStyle = 'rgba(20,20,20,.5)'; for (let yy = h * 0.6; yy < h * 0.84; yy += h * 0.03) q.fillRect(w * 0.1, yy, w * (0.5 + Math.random() * 0.3), 3);
    q.strokeStyle = '#ff7a1a'; q.lineWidth = w * 0.012; q.beginPath(); q.arc(w * 0.76, h * 0.86, w * 0.1, 0, 7); q.stroke(); q.fillStyle = '#ff7a1a'; q.font = `900 ${w * 0.035}px ${c.MONO}`; q.fillText('SAME', w * 0.76, h * 0.87);
    q.fillStyle = 'rgba(200,200,190,.7)'; q.fillRect(w * 0.38, 0, w * 0.24, h * 0.03);   // tape
  }, 512);
  board.position.set(W / 2 - PORTAL.w / 2 - 0.9, Math.min(1.9, HT - 0.9), -D / 2 + 0.03); g.add(board);
  c.clickable(board, () => c.toast(`${r.name}. ${r.kicker}`, 4200), 'Read the notice');
}

// a rope a step in front of the photograph: plates are made to be seen from the room
function rope(c, r, g, X) {
  const { THREE } = c, z = -D / 2 + 1.25, x1 = (W - PORTAL.w) / 2 + 0.3, x2 = (W + PORTAL.w) / 2 - 0.3, n = 6;
  const brass = std(c, 0xd6a640, { metalness: 1, roughness: 0.25 }), red = std(c, 0x8a0f1e, { roughness: 0.85 });
  const post = new THREE.CylinderGeometry(0.035, 0.05, 0.95, 12), base = new THREE.CylinderGeometry(0.16, 0.18, 0.04, 20), knob = new THREE.SphereGeometry(0.06, 12, 10);
  for (let i = 0; i <= n; i++) {
    const x = x1 + (x2 - x1) * i / n, p = new THREE.Mesh(post, brass); p.position.set(x, 0.48, z); g.add(p);
    const b = new THREE.Mesh(base, brass); b.position.set(x, 0.02, z); g.add(b); const k = new THREE.Mesh(knob, brass); k.position.set(x, 0.98, z); g.add(k);
    if (i < n) { const seg = (x2 - x1) / n, curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x, 0.9, z), new THREE.Vector3(x + seg / 2, 0.62, z), new THREE.Vector3(x + seg, 0.9, z)); g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.025, 6), red)); }
  }
  c.wall(X(x1), z, X(x2), z); c.wall(X(x1), z, X(x1), -D / 2); c.wall(X(x2), z, X(x2), -D / 2);
  const q = c.sign('THE PICTURE STARTS HERE', { w: 1.9, h: 0.2, bg: '#111', fg: '#ff7a1a', font: c.MONO, weight: 700 }); q.position.set(W / 2, 0.82, z + 0.04); g.add(q);
}

// every room has a stack of moving boxes by the far door, marked 4F in marker: the building is leaving with you
const BOXWORDS = ['4F KITCHEN', '4F BOOKS', '4F FRAGILE', '4F WINTER', '4F PHOTOS', '4F MISC', '4F DISHES', '4F MAMA'];
function boxes(c, r, g, X) {
  if (r.noBoxes) return;
  const { THREE } = c, x0 = W - 1.3, z0 = D / 2 - 1.0;
  const card = (seed) => c.canvasTex(128, 96, (q, w, h) => { q.fillStyle = '#b08850'; q.fillRect(0, 0, w, h); q.fillStyle = 'rgba(0,0,0,.12)'; q.fillRect(0, h * 0.45, w, 6); q.fillStyle = '#1a1a1a'; q.font = `800 15px ${c.FONT}`; q.textAlign = 'center'; q.save(); q.translate(w / 2, h * 0.32); q.rotate(-0.06); q.fillText(BOXWORDS[seed % BOXWORDS.length], 0, 0); q.restore(); });
  const stack = [[0, 0, 0, 0.6, 0.45, 0.45, 0.1], [0.05, 0.45, 0.02, 0.55, 0.4, 0.42, -0.15], [-0.6, 0, 0.1, 0.5, 0.36, 0.4, 0.3]];
  stack.forEach(([dx, y, dz, w, h, d, ry], k) => {
    const t = card(r.i * 3 + k), side = new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 }), top = std(c, 0xa07a46, { roughness: 0.95 });
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, top, top, side, side]); m.position.set(x0 + dx, y + h / 2, z0 + dz); m.rotation.y = ry; g.add(m);
  });
  c.post(X(x0 - 0.3), z0, 0.65);
}

// ---------- hanging plans ----------
function slotsDefault(r, HT) {
  const S = [], south = D / 2 - 0.14, y = Math.min(2.1, HT - 1.1);
  for (let i = 0; i < 6; i++) S.push({ x: 2.2 + i * 2.6, y, z: south, ry: PI, w: 1.4 });
  [-6.6, -4.2, -1.8].forEach((z) => S.push({ x: 0.14, y, z, ry: PI / 2, w: 1.3 }));
  [-4.2, -1.8].forEach((z) => S.push({ x: W - 0.4, y, z, ry: -PI / 2, w: 1.3 }));
  return S;
}
export { prop, paperTex, INK };
