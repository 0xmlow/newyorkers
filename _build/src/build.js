// LIVE FROM THE SEWERS, room by room. The hidden city under New York, told from the rats' side, at rat scale: every
// human thing is colossal down here. People only ever appear with an eye flower for a head; the residents are rats,
// one alligator, one goldfish and one bodega cat, cast in 3D from FLORA concepts (Nano Banana 2.1, Tripo H3.1).
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { W, D, H_IN, PORTAL } from './rooms.js';

const PI = Math.PI;
const INK = ['#f5c542', '#ff4fa3', '#22d3ee', '#3b82f6', '#ffffff', '#ff7a1a'];
const DZ1 = 2, DZ2 = 5.6, DH = 3.6;

export function buildRoom(c, r) {
  const { THREE, scene } = c;
  const g = r.group = new THREE.Group(); g.position.x = r.x0; scene.add(g);
  const X = (x) => r.x0 + x;
  const mats = matsFor(c, r);
  const HT = r.outdoor ? (r.low ? 4 : 10) : H_IN;

  if (!r.noFloor) g.add(c.slab(W, 0.1, D, mats.floor, W / 2, -0.05, 0));
  if (r.ceil && !r.outdoor && !r.well) g.add(c.slab(W, 0.1, D, mats.ceil, W / 2, H_IN + 0.05, 0));
  if (r.ceil && r.well) {   // a ceiling with a square hole in it, for a stairwell
    const [wx, wz, s] = r.well, a = wx - s / 2, b = wx + s / 2, n = wz - s / 2, so = wz + s / 2, y = H_IN + 0.05;
    g.add(c.slab(a, 0.1, D, mats.ceil, a / 2, y, 0)); g.add(c.slab(W - b, 0.1, D, mats.ceil, b + (W - b) / 2, y, 0));
    g.add(c.slab(s, 0.1, n + D / 2, mats.ceil, wx, y, (-D / 2 + n) / 2)); g.add(c.slab(s, 0.1, D / 2 - so, mats.ceil, wx, y, (so + D / 2) / 2));
  }

  const pw = PORTAL.w, px1 = (W - pw) / 2, px2 = (W + pw) / 2, NH = r.low ? 1.1 : HT;
  g.add(c.slab(W, HT, 0.24, mats.wall, W / 2, HT / 2, D / 2 + 0.12)); c.wall(X(0), D / 2, X(W), D / 2);
  g.add(c.slab(px1, NH, 0.24, mats.wall, px1 / 2, NH / 2, -D / 2 - 0.12));
  g.add(c.slab(px1, NH, 0.24, mats.wall, px2 + px1 / 2, NH / 2, -D / 2 - 0.12));
  c.wall(X(0), -D / 2, X(W), -D / 2);
  if (!r.outdoor) g.add(c.slab(pw, H_IN - PORTAL.h, 0.24, mats.wall, W / 2, PORTAL.h + (H_IN - PORTAL.h) / 2, -D / 2 - 0.12));
  const sideWall = (x, door) => {
    if (!door) { g.add(c.slab(0.24, HT, D, mats.wall, x, HT / 2, 0)); c.wall(X(x), -D / 2, X(x), D / 2); return; }
    const a = DZ1 + D / 2, b = D / 2 - DZ2;
    g.add(c.slab(0.24, HT, a, mats.wall, x, HT / 2, -D / 2 + a / 2));
    g.add(c.slab(0.24, HT, b, mats.wall, x, HT / 2, D / 2 - b / 2));
    g.add(c.slab(0.24, HT - DH, DZ2 - DZ1, mats.wall, x, DH + (HT - DH) / 2, (DZ1 + DZ2) / 2));
    c.wall(X(x), -D / 2, X(x), DZ1); c.wall(X(x), DZ2, X(x), D / 2);
    const fr = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.6, roughness: 0.4 });
    for (const z of [DZ1, DZ2]) g.add(c.slab(0.36, DH, 0.14, fr, x, DH / 2, z));
    g.add(c.slab(0.36, 0.16, DZ2 - DZ1 + 0.14, fr, x, DH + 0.08, (DZ1 + DZ2) / 2));
  };
  sideWall(0, r.i > 0);
  if (r.last) sideWall(W, false);
  else sideWall(W - 0.25, true);   // the room's own face on the shared wall, so the next set's wallpaper does not show through
  const ds = { w: 2.6, h: 0.42, bg: '#0d0d0d', fg: '#f4ead2', border: '#f5c542' };
  if (r.i > 0) { const s = c.sign(`< ${r.prev}`, ds); s.position.set(0.15, DH + 0.45, (DZ1 + DZ2) / 2); s.rotation.y = PI / 2; g.add(s); }
  if (r.next) { const s = c.sign(`${r.next} >`, ds); s.position.set(W - 0.15, DH + 0.45, (DZ1 + DZ2) / 2); s.rotation.y = -PI / 2; g.add(s); }

  c.plate(r);

  const slots = (SLOTS[r.id] || slotsDefault)(r);
  r.cast.forEach((p, k) => { const s = slots[k]; if (!s) return; c.hang(p, s.x, s.y, s.z, s.ry, s.w || 1.3, s.honor ? 'gilt' : r.frame, g); });

  slate(c, r, g);
  if (!r.noRope) rope(c, r, g, X);
  else if (r.edge) c.wall(X(0), -D / 2 + 1.2, X(W), -D / 2 + 1.2);   // an unmarked edge, so nobody walks into the photograph
  ROOM[r.id] && ROOM[r.id](c, r, g, X, mats);
  (PROPS[r.id] || []).forEach((q) => prop(c, r, g, X, ...q));
  dressing(c, r, g, X);
}


// ---------- surfaces ----------
function matsFor(c, r) {
  const { THREE } = c;
  const m = {};
  if (r.floor === 'carpet') { const t = carpetTex(c); t.repeat.set(5, 4); m.floor = new THREE.MeshStandardMaterial({ map: t, roughness: 0.95, color: r.floorTint || 0xffffff }); m.floor.userData.rep = 4; }
  else m.floor = c.surf(r.floor, r.floor === 'asphalt' ? 3 : r.floor === 'planks' ? 2.2 : 2.2, r.floorTint || (r.outdoor ? 0x6a6c76 : 0x9a9a9a));
  m.ceil = r.ceil ? c.surf(r.ceil, 3, r.ceilTint || 0x8a847a) : null;
  if ((window.WALLS || []).includes(r.id)) {
    const t = c.tex.load(`assets/walls/${r.id}.jpg`); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8;
    m.wall = new THREE.MeshStandardMaterial({ map: t, roughness: 0.82, color: r.muralTint || 0xffffff });
    m.wall.userData.repX = 10; m.wall.userData.repY = r.outdoor ? (r.low ? 4 : 10) : H_IN;
  }
  else if (r.outdoor) m.wall = c.surf('brick', 2.4, 0x6e6660);
  else m.wall = c.surf(r.wall, 2.4, r.wallTint);
  if (r.floor === 'asphalt') { m.floor.roughness = 0.3; m.floor.metalness = 0.3; }
  return m;
}
function carpetTex(c) {
  const t = c.canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#6e0b16'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#c9a033'; g.lineWidth = 6;
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
      const cx = x * 256 + 128, cy = y * 256 + 128;
      g.beginPath(); g.moveTo(cx, cy - 90); g.lineTo(cx + 90, cy); g.lineTo(cx, cy + 90); g.lineTo(cx - 90, cy); g.closePath(); g.stroke();
      g.beginPath(); g.arc(cx, cy, 34, 0, 7); g.stroke();
      g.fillStyle = '#1d4ed8'; g.beginPath(); g.arc(cx, cy, 14, 0, 7); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(cx, cy, 7, 0, 7); g.fill();
    }
    g.globalAlpha = 0.08; for (let i = 0; i < 3000; i++) { g.fillStyle = Math.random() < 0.5 ? '#000' : '#fff'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  });
  t.wrapS = t.wrapT = 1000; return t;
}

export function eyeFlower(g, x, y, R, petal = '#fbe6f0', edge = '#ff4fa3') {
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2; g.save(); g.translate(x, y); g.rotate(a);
    const gr = g.createLinearGradient(0, 0, R, 0); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.6, petal); gr.addColorStop(1, edge);
    g.fillStyle = gr; g.beginPath(); g.ellipse(R * 0.55, 0, R * 0.5, R * 0.26, 0, 0, Math.PI * 2); g.fill(); g.restore();
  }
  [[0.42, '#1d4ed8'], [0.32, '#ffffff'], [0.22, '#22d3ee'], [0.12, '#0b1020']].forEach(([k, col]) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, R * k, 0, Math.PI * 2); g.fill(); });
  g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(x - R * 0.06, y - R * 0.06, R * 0.04, 0, Math.PI * 2); g.fill();
}
function decal(c, w, h, draw, px = 256) { const t = c.canvasTex(Math.round(px * w / h), px, draw); return new c.THREE.Mesh(new c.THREE.PlaneGeometry(w, h), new c.THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); }
function glowTex(c, col) { return c.canvasTex(128, 128, (q, w, h) => { const gr = q.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.2, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); }); }
const basic = (c, color, o = {}) => new c.THREE.MeshBasicMaterial({ color, toneMapped: false, ...o });
const std = (c, color, o = {}) => new c.THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });

// a row of bulbs that chase, for marquees
function bulbs(c, g, x1, x2, y, z, n, col = 0xffe0a0) {
  const { THREE } = c, ms = [], on = basic(c, col), off = std(c, 0x3a3020, { roughness: 0.4 });
  const geo = new THREE.SphereGeometry(0.06, 10, 8);
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, on); m.position.set(x1 + (x2 - x1) * i / (n - 1), y, z); g.add(m); ms.push(m); }
  c.tick((t) => { const k = (t * 8) | 0; ms.forEach((m, i) => { m.material = (i + k) % 3 === 0 ? off : on; }); });
}
// an eye that watches you: a white disc, and an iris that slides toward the camera
function watcher(c, g, x, y, z, ry, R = 0.5) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, y, z); o.rotation.y = ry; g.add(o);
  const petals = decal(c, R * 3.2, R * 3.2, (q, w, h) => eyeFlower(q, w / 2, h / 2, w / 2 * 0.98));
  o.add(petals);
  const white = new THREE.Mesh(new THREE.CircleGeometry(R * 0.62, 32), basic(c, 0xf4f4f4)); white.position.z = 0.01; o.add(white);
  const iris = new THREE.Group(); iris.position.z = 0.02; o.add(iris);
  const ir = new THREE.Mesh(new THREE.CircleGeometry(R * 0.32, 32), basic(c, 0x1d4ed8)); iris.add(ir);
  const pu = new THREE.Mesh(new THREE.CircleGeometry(R * 0.15, 24), basic(c, 0x0b1020)); pu.position.z = 0.005; iris.add(pu);
  const v = new THREE.Vector3(), inv = new THREE.Matrix4();
  c.tick(() => { v.copy(c.camera.position); o.updateMatrixWorld(); inv.copy(o.matrixWorld).invert(); v.applyMatrix4(inv); const L = Math.hypot(v.x, v.y, v.z) || 1; iris.position.x = v.x / L * R * 0.3; iris.position.y = v.y / L * R * 0.3; });
  return o;
}
function flyer(c, text, bg = '#f4ead2') { return c.canvasTex(128, 160, (q, w, h) => { q.fillStyle = bg; q.fillRect(0, 0, w, h); eyeFlower(q, w / 2, 56, 40); q.fillStyle = '#111'; q.font = `800 22px ${c.FONT}`; q.textAlign = 'center'; q.fillText(text, w / 2, 130); }); }


const HEAD = {};
function extra(c, g, x, z, { seated = false, col = 0x3a4a6a, ry = 0 } = {}) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, 0, z); o.rotation.y = ry; g.add(o);
  const h = seated ? 0.45 : 0, body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.72, 12), std(c, col, { roughness: 0.8 })); body.position.y = h + (seated ? 0.36 : 1.0); o.add(body);
  if (!seated) { const legs = c.slab(0.32, 0.64, 0.16, std(c, 0x1a1a22), 0, 0.32, 0); o.add(legs); }
  HEAD.t ||= c.canvasTex(256, 256, (q, w) => eyeFlower(q, w / 2, w / 2, w / 2 * 0.98));
  const head = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshStandardMaterial({ map: HEAD.t, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, roughness: 0.6 }));
  head.position.y = h + (seated ? 0.98 : 1.62); o.add(head); o.userData.head = head; return o;
}

function facade(c, g, { x0 = 0, w = 20, h = 16, z = -24, cols = 6, rows = 4, draw }) {
  const { THREE } = c, cw = 128, ch = 128, atlas = c.canvasTex(cw * cols, ch * rows, () => {}), q = atlas.userData.canvas.getContext('2d');
  const f = new THREE.Group(); f.position.set(x0, 0, z); g.add(f); f.add(c.slab(w, h, 0.4, c.surf('brick', 2.4, 0x6a5048), w / 2, h / 2, 0));
  const wins = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const geo = new THREE.PlaneGeometry(1.8, 2.2), uv = geo.attributes.uv; for (let v = 0; v < uv.count; v++) uv.setXY(v, (i + uv.getX(v)) / cols, 1 - (j + 1 - uv.getY(v)) / rows); const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: atlas, toneMapped: false, fog: false })); m.position.set(1.8 + i * (w - 3.6) / (cols - 1), 2.6 + j * (h - 4.4) / (rows - 1), 0.22); f.add(m); wins.push(m); }
  const paint = (t) => { for (let k = 0; k < cols * rows; k++) { const ox = (k % cols) * cw, oy = Math.floor(k / cols) * ch; q.save(); q.beginPath(); q.rect(ox, oy, cw, ch); q.clip(); q.translate(ox, oy); draw(q, k, t, cw, ch); q.strokeStyle = '#2a1a14'; q.lineWidth = 8; q.strokeRect(0, 0, cw, ch); q.restore(); } atlas.needsUpdate = true; };
  return { f, wins, paint };
}
function figure(q, x, y, s, col, t, arms = 0) { q.fillStyle = col; q.fillRect(x - 8 * s, y - 26 * s, 16 * s, 40 * s); q.strokeStyle = col; q.lineWidth = 5 * s; q.beginPath(); q.moveTo(x - 7 * s, y - 22 * s); q.lineTo(x - 20 * s, y - 22 * s - arms * 18 * s + Math.sin(t * 6) * 4 * s); q.moveTo(x + 7 * s, y - 22 * s); q.lineTo(x + 20 * s, y - 22 * s - arms * 18 * s + Math.cos(t * 6) * 4 * s); q.stroke(); eyeFlower(q, x, y - 40 * s, 17 * s); }

function steam(c, g, x, y, z) {
  const { THREE } = c, m = new THREE.MeshBasicMaterial({ map: glowTex(c, 'rgba(230,230,230,.35)'), transparent: true, depthWrite: false, toneMapped: false }), puffs = [];
  for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(m.clone()); g.add(s); puffs.push({ s, k: i / 6 }); }
  c.tick((t) => puffs.forEach((p) => { const u = (t * 0.25 + p.k) % 1; p.s.position.set(x + Math.sin(u * 6 + p.k * 9) * 0.2, y + u * 2.2, z); p.s.scale.setScalar(0.4 + u * 1.4); p.s.material.opacity = (1 - u) * 0.7; }));
}

// ---------- the shared furniture: a floor plate by the lift, the house dressing, a rope ----------
// The plate: every floor carries a brass disc by the door with its level, like a lift lobby.
function slate(c, r, g) {
  const board = decal(c, 1.1, 1.1, (q, w, h) => {
    q.fillStyle = '#1a1a1a'; q.beginPath(); q.arc(w / 2, h / 2, w / 2, 0, 7); q.fill();
    q.strokeStyle = '#c9a033'; q.lineWidth = w * 0.02; q.beginPath(); q.arc(w / 2, h / 2, w * 0.46, 0, 7); q.stroke();
    q.fillStyle = INK[r.i % INK.length]; q.beginPath(); q.arc(w / 2, h / 2, w * 0.3, 0, 7); q.fill();
    q.fillStyle = '#0d0d0d'; q.textAlign = 'center'; q.font = `900 ${w * 0.2}px ${c.SERIF}`; q.fillText(r.lvl, w / 2, h / 2 + w * 0.07);
    q.fillStyle = '#f4ead2'; q.font = `800 ${w * 0.038}px ${c.MONO}`; q.fillText('LIVE FROM THE SEWERS', w / 2, h * 0.12); q.fillText((r.name || '').toUpperCase().slice(0, 26), w / 2, h * 0.9);
  }, 512);
  board.position.set(W / 2 - PORTAL.w / 2 - 1.0, r.low ? 1.1 : 1.8, -D / 2 + 0.03);
  g.add(board);
}
// every room brings its own: a bottle cap the size of a table (the rats' furniture of choice) and a drip from the
// ceiling into a puddle that keeps perfect time with the room's song
function dressing(c, r, g, X) {
  const { THREE } = c;
  const cap = new THREE.Group(); cap.position.set(W - 1.7, 0, D / 2 - 1.5); g.add(cap);
  const capTex = c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = ['#c8102e', '#1d4ed8', '#e8b62c', '#0f7a3a'][r.i % 4]; q.fillRect(0, 0, w, h); q.fillStyle = '#f4ead2'; q.textAlign = 'center'; q.font = `900 46px ${c.SERIF}`; q.fillText('N3W', w / 2, h / 2 + 16); q.strokeStyle = '#f4ead2'; q.lineWidth = 6; q.beginPath(); q.arc(w / 2, h / 2, w * 0.4, 0, 7); q.stroke(); });
  const capM = new THREE.MeshStandardMaterial({ color: 0xb8b8b8, metalness: 0.9, roughness: 0.3 });
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.66, 0.34, 21, 1, true), capM); rim.position.y = 0.17; cap.add(rim);
  const top = new THREE.Mesh(new THREE.CircleGeometry(0.62, 32), new THREE.MeshStandardMaterial({ map: capTex, metalness: 0.5, roughness: 0.35 })); top.rotation.x = -PI / 2; top.position.y = 0.341; cap.add(top);
  c.post(X(W - 1.7), D / 2 - 1.5, 0.7);
  c.clickable(cap, () => c.egg('bottlecap', 'A bottle cap. Up there it is litter. Down here it is a dining table, a crown, a currency and a pew, depending on the room.'), 'A bottle cap the size of a table');
  // the drip: one drop, a ring on the puddle, forever
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.7, 32), new THREE.MeshStandardMaterial({ color: 0x0a0c0e, metalness: 0.9, roughness: 0.05, transparent: true, opacity: 0.85 }));
  puddle.rotation.x = -PI / 2; puddle.position.set(2.2, 0.012, 0.4); g.add(puddle);
  const drop = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshStandardMaterial({ color: 0xaaccdd, metalness: 0.6, roughness: 0.05, transparent: true, opacity: 0.8 })); g.add(drop);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.07, 24), new THREE.MeshBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.6, toneMapped: false })); ring.rotation.x = -PI / 2; ring.position.set(2.2, 0.016, 0.4); g.add(ring);
  c.tick((t) => { const u = (t * 0.7) % 1; drop.position.set(2.2, (r.outdoor ? 8 : H_IN) * (1 - u * u), 0.4); drop.visible = u < 0.98; const v = (t * 0.7 + 0.02) % 1; ring.scale.setScalar(1 + v * 7); ring.material.opacity = 0.6 * (1 - v); });
}
// a cardboard wine case, stencilled, never a real label
const CASE_NAMES = ['NEW YORKERS', 'N3W', 'COUNTED', 'MLOW', 'SEWER', 'CRUMBS', 'CHEESE', 'SLICE', 'EYE FLOWER', 'THE CENSUS', 'DRIP', 'UPSTATE'];
const _CASE = {};
function caseTex(c, seed) {
  const k = seed % 12; if (_CASE[k]) return _CASE[k];
  return (_CASE[k] = c.canvasTex(256, 160, (q, w, h) => {
    q.fillStyle = ['#b8905a', '#a8824e', '#c49a66'][k % 3]; q.fillRect(0, 0, w, h); q.strokeStyle = 'rgba(0,0,0,.18)'; q.lineWidth = 3; q.strokeRect(6, 6, w - 12, h - 12);
    q.fillStyle = '#2a1a0a'; q.font = `900 30px ${c.MONO}`; q.textAlign = 'center'; q.fillText(CASE_NAMES[k], w / 2, h / 2 + 10);
    q.font = `700 13px ${c.MONO}`; q.fillText('FRAGILE · THIS SIDE UP', w / 2, h - 18); eyeFlower(q, 34, 34, 18);
  }));
}
// a velvet rope a step in front of the photograph: plates are made to be seen from the room
function rope(c, r, g, X) {
  const { THREE } = c, z = -D / 2 + 1.25, x1 = (W - PORTAL.w) / 2 + 0.3, x2 = (W + PORTAL.w) / 2 - 0.3, n = 6;
  const brass = std(c, 0xd6a640, { metalness: 1, roughness: 0.25 }), red = std(c, 0x8a1a1a, { roughness: 0.85 });
  const post = new THREE.CylinderGeometry(0.035, 0.05, 0.95, 12), base = new THREE.CylinderGeometry(0.16, 0.18, 0.04, 20), knob = new THREE.SphereGeometry(0.06, 12, 10);
  for (let i = 0; i <= n; i++) {
    const x = x1 + (x2 - x1) * i / n, p = new THREE.Mesh(post, brass); p.position.set(x, 0.48, z); g.add(p);
    const b = new THREE.Mesh(base, brass); b.position.set(x, 0.02, z); g.add(b); const k = new THREE.Mesh(knob, brass); k.position.set(x, 0.98, z); g.add(k);
    if (i < n) { const seg = (x2 - x1) / n, curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x, 0.9, z), new THREE.Vector3(x + seg / 2, 0.62, z), new THREE.Vector3(x + seg, 0.9, z)); g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.025, 6), red)); }
  }
  c.wall(X(x1), z, X(x2), z); c.wall(X(x1), z, X(x1), -D / 2); c.wall(X(x2), z, X(x2), -D / 2);
  const q = c.sign('MIND THE GAP · THE PICTURE STARTS HERE', { w: 1.9, h: 0.2, bg: '#111', fg: '#f5c542', font: c.MONO, weight: 700 }); q.position.set(W / 2, 0.82, z + 0.04); g.add(q);
}

// ---------- the CC0 prop library (Poly Haven, CC0) ----------
// [name, x, z, { h | len, ry, y, r: collider radius, egg: [hint, id, line], snd }]. Names are Poly Haven ids, files ph_<id>.glb.
function prop(c, r, g, X, name, x, z, o = {}) {
  const m = c.glb(/^(nyb_|ph_)/.test(name) || o.raw ? name : 'ph_' + name, { h: o.h, len: o.len, x, y: o.y || 0, z, ry: o.ry || 0, parent: g, shadow: !o.y });
  if (o.r) c.post(X(x), z, o.r);
  if (o.egg) c.clickable(m, () => { if (o.snd) c.sound[o.snd](); c.egg(o.egg[1], o.egg[2]); o.fn && o.fn(c); }, o.egg[0]);
  if (o.spin) c.tick((t) => { m.rotation.y = (o.ry || 0) + Math.sin(t * o.spin) * 0.3; });
  if (o.bob) c.tick((t) => { m.position.y = (o.y || 0) + Math.sin(t * o.bob) * 0.06; });
  return m;
}
// a cast member: a GLB with an eye flower head, a contact shadow, a collider and a line when clicked
function cast(c, r, g, X, name, x, z, { h = 1.8, ry = 0, y = 0, r: rad = 0.4, line, egg, hint } = {}) {
  const m = c.glb(name, { h, x, y, z, ry, parent: g });
  if (rad) c.post(X(x), z, rad);
  if (line) c.clickable(m, () => { c.say(m, line, 3600, h + 0.3); if (egg) c.egg(egg); }, hint || 'Say hello');
  return m;
}
// a plaque: a line of his, on the wall, in quotation marks. The house rule says Abloh owns the text.
function plaque(c, g, x, y, z, ry, text, who = 'THE MANAGEMENT', w = 1.6) {
  const s = c.sign(`"${text}"\n${who}`, { w, h: w * 0.28, bg: '#f4ead2', fg: '#111', font: c.SERIF, weight: 700, px: 160, pad: 0.1 });
  s.position.set(x, y, z); s.rotation.y = ry; g.add(s); return s;
}

// ---------- the sewer kit: things every room can ask for ----------
const here = (r, ri) => ri === r.i;
const local = (r, P) => ({ x: P.x - r.x0, z: P.z });
// rats going about their business on slow loops, Poly Haven's street rat and THE MARKS rat, at our scale (a rat is as
// long as you are tall down here)
function scurry(c, g, n, { x1 = 3, x2 = 17, z1 = -4.5, z2 = 5.5, len = 1.6 } = {}) {
  const rs = [];
  for (let k = 0; k < n; k++) {
    const m = c.glb(k % 2 ? 'ph_street_rat' : 'rat', { len: len * (0.8 + (k % 3) * 0.15), x: 0, z: 0, parent: g });
    rs.push({ m, k, s: 0.12 + (k % 4) * 0.05, ph: k * 1.9, away: 0 });
  }
  const cx = (x1 + x2) / 2, ax = (x2 - x1) / 2 * 0.9, cz = (z1 + z2) / 2, az = (z2 - z1) / 2 * 0.9;
  c.tick((t, dt) => rs.forEach((o) => {
    if (o.away > 0) { o.away -= dt; o.m.position.x += dt * 6; o.m.rotation.y = PI / 2; o.m.visible = o.m.position.x < W - 0.6; return; }
    o.m.visible = true;
    const u = t * o.s + o.ph, x = cx + Math.sin(u) * ax, z = cz + Math.sin(u * 1.7 + o.k) * az;
    const dx = Math.cos(u) * ax, dz = Math.cos(u * 1.7 + o.k) * 1.7 * az;
    o.m.position.set(x, 0, z); o.m.rotation.y = Math.atan2(dx, dz);
  }));
  return rs;
}
// a porcelain toilet built in code: a lathed bowl, a tank, a seat. There is no CC0 toilet worth the name.
function toilet(c, g, x, z, s = 1, ry = 0) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, 0, z); o.rotation.y = ry; o.scale.setScalar(s); g.add(o);
  const por = new THREE.MeshPhysicalMaterial({ color: 0xf4f2ee, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 });
  const prof = [[0.0, 0], [0.16, 0], [0.18, 0.05], [0.17, 0.2], [0.2, 0.3], [0.3, 0.38], [0.36, 0.42], [0.37, 0.44], [0.33, 0.45], [0.3, 0.42]].map(([a, b]) => new THREE.Vector2(a, b));
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(prof, 40), por); bowl.scale.set(1, 1, 1.25); bowl.position.z = 0.08; o.add(bowl);
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.27, 32), new THREE.MeshStandardMaterial({ color: 0x8fd4ff, metalness: 0.2, roughness: 0.02, transparent: true, opacity: 0.8 })); water.rotation.x = -PI / 2; water.scale.y = 1.25; water.position.set(0, 0.36, 0.08); o.add(water);
  const seat = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.045, 12, 40), por); seat.rotation.x = PI / 2; seat.scale.set(1, 1.25, 1); seat.position.set(0, 0.46, 0.08); o.add(seat);
  const tank = c.slab(0.62, 0.5, 0.22, por, 0, 0.72, -0.34); o.add(tank); o.add(c.slab(0.66, 0.05, 0.26, por, 0, 0.99, -0.34));
  const lever = c.slab(0.12, 0.025, 0.025, new THREE.MeshStandardMaterial({ color: 0xd8d8d8, metalness: 1, roughness: 0.2 }), -0.26, 0.9, -0.22); o.add(lever);
  return o;
}
// a fishbowl on a stand, with a goldfish that knows where it is
function bowl(c, g, X, x, z, h = 1.1, R = 0.55) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, 0, z); g.add(o);
  o.add(c.slab(0.5, h, 0.5, std(c, 0x2a2a2a, { roughness: 0.4, metalness: 0.4 }), 0, h / 2, 0));
  const glass = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 24, 0, PI * 2, 0.35, PI - 0.35), new THREE.MeshStandardMaterial({ color: 0xcfefff, transparent: true, opacity: 0.22, roughness: 0.02, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false }));
  glass.position.y = h + R * 0.94; o.add(glass);
  const water = new THREE.Mesh(new THREE.SphereGeometry(R * 0.93, 24, 16, 0, PI * 2, PI * 0.42, PI * 0.58), new THREE.MeshStandardMaterial({ color: 0x5fc8e8, transparent: true, opacity: 0.35, roughness: 0.05, depthWrite: false }));
  water.position.y = h + R * 0.94; o.add(water);
  const fish = new THREE.Sprite(new THREE.SpriteMaterial({ map: fishTex(c), transparent: true })); fish.scale.set(R * 0.7, R * 0.42, 1); o.add(fish);
  c.tick((t) => { const a = t * 0.9 + x; fish.position.set(Math.cos(a) * R * 0.4, h + R * 0.9 + Math.sin(t * 1.3) * 0.05, Math.sin(a) * R * 0.4); fish.material.rotation = Math.sin(a) * 0.15; fish.scale.x = (Math.sin(a) > 0 ? 1 : -1) * R * 0.7; });
  c.post(X(x), z, 0.4);
  return o;
}
const _FISH = {};
function fishTex(c) {
  return (_FISH.t ||= c.canvasTex(128, 80, (q) => {
    const gr = q.createLinearGradient(20, 0, 110, 0); gr.addColorStop(0, '#ff6a10'); gr.addColorStop(1, '#ffb040');
    q.fillStyle = gr; q.beginPath(); q.ellipse(70, 40, 36, 20, 0, 0, 7); q.fill();
    q.beginPath(); q.moveTo(36, 40); q.lineTo(6, 18); q.lineTo(14, 40); q.lineTo(6, 62); q.closePath(); q.fill();
    q.fillStyle = '#fff'; q.beginPath(); q.arc(92, 34, 6, 0, 7); q.fill(); q.fillStyle = '#111'; q.beginPath(); q.arc(94, 34, 3, 0, 7); q.fill();
  }));
}
// a shaft up to the street through a hole in the ceiling: a lit tube, iron rungs and daylight at the top
function shaft(c, g, x, z, R = 0.9, top = 26) {
  const { THREE } = c;
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(R, R, top - H_IN, 28, 1, true), new THREE.MeshStandardMaterial({ map: c.surf('brick', 1).map, color: 0x8a7a6a, side: THREE.BackSide, roughness: 0.9 }));
  tube.position.set(x, H_IN + (top - H_IN) / 2, z); g.add(tube);
  const sky = new THREE.Mesh(new THREE.CircleGeometry(R, 32), new THREE.MeshBasicMaterial({ color: 0xfff8e8, toneMapped: false, fog: false })); sky.rotation.x = PI / 2; sky.position.set(x, top - 0.01, z); g.add(sky);
  const grate = new THREE.Mesh(new THREE.RingGeometry(R * 0.96, R * 1.12, 32), std(c, 0x2a2622, { metalness: 0.8, roughness: 0.5 })); grate.rotation.x = PI / 2; grate.position.set(x, H_IN - 0.02, z); g.add(grate);
  const iron = std(c, 0x5a3a2a, { metalness: 0.7, roughness: 0.6 });
  for (let y = H_IN + 0.4; y < top - 0.5; y += 0.45) g.add(c.slab(0.5, 0.04, 0.04, iron, x, y, z - R + 0.12));
  // the beam of daylight down to the floor, and the dust in it
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.9, R * 1.6, H_IN, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff0d0, transparent: true, opacity: 0.03, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, blending: THREE.AdditiveBlending }));
  beam.position.set(x, H_IN / 2, z); g.add(beam);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(R * 1.5, 32), new THREE.MeshBasicMaterial({ color: 0xfff0d0, transparent: true, opacity: 0.12, depthWrite: false, toneMapped: false })); disc.rotation.x = -PI / 2; disc.position.set(x, 0.015, z); g.add(disc);
  const N = 60, pos = new Float32Array(N * 3); for (let i = 0; i < N; i++) { pos[i * 3] = x + (Math.random() - 0.5) * R * 2.4; pos[i * 3 + 1] = Math.random() * H_IN; pos[i * 3 + 2] = z + (Math.random() - 0.5) * R * 2.4; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xfff4dd, size: 0.03, transparent: true, opacity: 0.7, depthWrite: false, toneMapped: false })); g.add(dust);
  c.tick((t, dt) => { for (let i = 0; i < N; i++) { pos[i * 3 + 1] -= dt * 0.12; if (pos[i * 3 + 1] < 0) pos[i * 3 + 1] = H_IN; } geo.attributes.position.needsUpdate = true; });
  return { beam };
}
// a little candle, lit or not, with a flame that flickers
function candle(c, g, x, y, z, h = 0.3, lit = true) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, y, z); g.add(o);
  o.add(new THREE.Mesh(new THREE.CylinderGeometry(h * 0.22, h * 0.24, h, 14), std(c, 0xf2ead8, { roughness: 0.7 })).translateY(h / 2));
  const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,170,60,.9)'), transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }));
  f.position.y = h + h * 0.25; f.scale.set(h * 0.5, h * 0.8, 1); f.visible = lit; o.add(f);
  c.tick((t) => { if (f.visible) f.scale.set(h * (0.45 + Math.sin(t * 17 + x * 9) * 0.05), h * (0.8 + Math.sin(t * 23 + z * 7) * 0.12), 1); });
  o.userData.flame = f; return o;
}
// a framed notice, a label in the Abloh voice
function notice(c, g, text, x, y, z, ry, w = 1.8, h = 0.5, bg = '#f4ead2', fg = '#111') {
  const s = c.sign(text, { w, h, bg, fg, font: c.MONO, weight: 700, px: 160, pad: 0.1 }); s.position.set(x, y, z); s.rotation.y = ry; g.add(s); return s;
}
// a live canvas board, redrawn on demand
function board(c, g, w, h, px = 512) {
  const { THREE } = c, t = c.canvasTex(Math.round(px * w / h), px, () => {}), q = t.userData.canvas.getContext('2d');
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); g.add(m);
  return { m, q, W: t.userData.canvas.width, H: t.userData.canvas.height, up: () => { t.needsUpdate = true; } };
}

// ---------- the props per room (Poly Haven CC0 and the house models, at rat scale) ----------
// [name, x, z, { h | len, ry, y, r: collider radius, egg: [hint, id, line], snd }]
const PROPS = {
  arrivals: [
    ['vintage_suitcase', 15.6, -3.6, { len: 4.6, ry: -0.3, r: 2.0, egg: ['A suitcase the size of a building', 'luggage', 'Somebody dropped this down the manhole in 1987. It is the baggage carousel now. Nobody has claimed it. Nobody will.'] }],
    ['can_rusted', 2.6, -4.6, { h: 2.6, r: 0.9 }], ['can_rusted', 2.6, -1.6, { h: 2.2, ry: 1, r: 0.8 }],
    ['lightbulb_01', 6, 0, { h: 0.9, y: 5.0 }], ['lightbulb_01', 14, 0, { h: 0.9, y: 5.0 }],
    ['vintage_lighter', 18.2, 5.6, { h: 1.3, ry: 0.4, r: 0.5, egg: ['A lighter', 'lighter', 'Declared at customs: one lighter. Confiscated: one lighter. Returned: never. That is the whole job.'] }],
    ['postcard_set_01', 12.4, 6.6, { len: 2.4, ry: 0.2 }],
  ],
  slice: [
    ['brass_candleholders', 6.4, -4.8, { h: 2.0, r: 0.5 }], ['brass_candleholders', 13.6, -4.8, { h: 2.0, r: 0.5 }],
    ['wooden_candlestick', 3.0, -5.6, { h: 2.6, r: 0.4 }], ['wooden_candlestick', 17.0, -5.6, { h: 2.6, r: 0.4 }],
    ['cardboard_box_01', 1.8, 5.0, { len: 2.6, ry: 0.3, r: 1.2 }],
    ['hanging_industrial_lamp', 6, 0, { h: 0.8, y: 4.9 }], ['hanging_industrial_lamp', 14, 0, { h: 0.8, y: 4.9 }],
  ],
  flushed: [
    ['plunger', 18.4, 6.4, { h: 3.4, ry: 0.4, r: 0.6, egg: ['A plunger as tall as a lamppost', 'plunger1', 'The last thing every goldfish down here saw from above. It is a monument now. Nobody mentions it at dinner.'] }],
    ['rubber_duck_toy', 2.4, -4.8, { h: 2.4, ry: 0.6, r: 1.1, egg: ['A rubber duck', 'duck', 'The duck came through in 2004. It floats, it squeaks, and it has never once been asked where it came from. The fish respect that.'] }],
    ['caged_hanging_light', 6, 0, { h: 0.7, y: 5.1 }], ['caged_hanging_light', 14, 0, { h: 0.7, y: 5.1 }],
  ],
  gator: [
    ['ArmChair_01', 15.4, 1.2, { len: 2.8, ry: -0.6, r: 1.3, egg: ['The big chair', 'armchair', 'This chair was flushed in 1962 and has been reserved ever since. The reservation is under a name nobody can pronounce with that many teeth.'] }],
    ['vintage_oil_lamp', 3.2, -5.2, { h: 1.6, r: 0.4 }], ['vintage_oil_lamp', 16.8, -5.2, { h: 1.6, r: 0.4 }],
    ['vintage_lighter', 5.6, 4.4, { h: 0.9, ry: 1.2, r: 0.4 }],
  ],
  fatberg: [
    ['wooden_spoon', 2.0, 5.2, { len: 4.2, ry: 0.8, y: 0.05 }],
    ['brass_vase_01', 16.6, -5.2, { h: 1.6, r: 0.5 }], ['brass_vase_01', 3.4, -5.2, { h: 1.6, r: 0.5 }],
    ['cleaner_tin_01', 18.0, 5.4, { h: 1.6, ry: -0.4, r: 0.7, egg: ['A tin of degreaser', 'degreaser', 'The congregation keeps a tin of degreaser by the door. Nobody has opened it. It would be like bringing a bulldozer to Mass.'] }],
  ],
  exchange: [
    ['pocket_watch', 2.4, -4.6, { len: 2.0, y: 0.05, ry: 0.6, egg: ['A pocket watch', 'opening', 'It is always 4:59 here. At 5:00 the bakery opens, the crumbs fall, and the market does what it does.'] }],
    ['carrot_cake', 17.6, 5.4, { len: 2.4, r: 1.0 }], ['hamburger_buns', 2.0, 5.4, { len: 2.4, r: 1.0 }],
    ['mounted_fluorescent_lights', 6, 0, { len: 1.6, y: 5.85 }], ['mounted_fluorescent_lights', 14, 0, { len: 1.6, y: 5.85 }],
  ],
  grate: [
    ['round_spectacles', 15.8, -3.4, { len: 3.4, y: 0.05, ry: 0.8 }],
    ['digital_wrist_watch', 4.0, -4.4, { len: 2.8, y: 0.05, ry: -0.5, egg: ['A wristwatch', 'watch', 'Still running. Eleven thousand steps a day, every day, since it fell in. The rats have no idea how it is doing that.'] }],
    ['vintage_lighter', 13.0, 5.4, { h: 1.4, ry: 0.4, r: 0.5 }], ['magnifying_glass_01', 18.2, 1.0, { len: 2.4, y: 0.05, ry: 1.2 }],
  ],
  pneumatic: [
    ['street_lamp_02', 2.0, -5.4, { h: 4.4, r: 0.3 }], ['street_lamp_02', 18.0, -5.4, { h: 4.4, r: 0.3 }],
    ['Chandelier_02', 10, 1.5, { h: 1.2, y: 4.6 }], ['mantel_clock_01', 3.2, 5.6, { h: 1.6, ry: 0.5, r: 0.6 }],
    ['vintage_suitcase', 17.4, 5.4, { len: 2.0, ry: -0.4, r: 0.9 }],
  ],
  steam: [
    ['tea_set_01', 3.2, 5.4, { len: 2.4, ry: 0.3, r: 1.0, egg: ['A tea set', 'eucalyptus', 'Eucalyptus, in a teacup the size of a hot tub. It costs nine dollars. Down here that is three hundred rats.'] }],
    ['wicker_basket_01', 17.0, 5.6, { h: 1.2, r: 0.6 }],
  ],
  cityhall: [
    ['Chandelier_03', 6, -1, { h: 1.3, y: 4.5 }], ['Chandelier_03', 14, -1, { h: 1.3, y: 4.5 }],
    ['vintage_stapler', 17.4, 5.4, { len: 2.2, ry: -0.5, r: 0.8, egg: ['A stapler', 'stapler', 'Every motion since 1945 has been stapled to the one before it. The stack is now taller than the station.'] }],
    ['binder_notebook', 2.6, 5.4, { len: 1.8, ry: 0.4, y: 0.05 }],
  ],
  border: [
    ['nyb_milkcrate_cyan', 3.0, -4.4, { h: 1.6, r: 0.9 }], ['nyb_milkcrate_pink', 3.0, -4.4, { h: 1.6, y: 1.6, ry: 0.3 }],
    ['nyb_milkcrate_pink', 17.0, -4.6, { h: 1.6, r: 0.9 }],
    ['plastic_bottle_gallon', 16.4, 5.2, { h: 2.6, r: 0.8 }], ['bananas', 3.4, 5.4, { len: 2.4, ry: 0.4, r: 0.9, egg: ['A bunch of bananas', 'bananas', 'Three bananas, one dollar, since 2003. The bodega has never changed a price on purpose. Inflation happens to other people.'] }],
  ],
  throne: [
    ['plunger', 14.2, -3.6, { h: 4.6, ry: -0.3, r: 0.6 }],
    ['treasure_chest', 3.6, -4.4, { len: 2.4, ry: 0.5, r: 1.1 }], ['brass_goblets', 6.0, -4.8, { len: 1.6, y: 0.05 }],
  ],
};
// the census New Yorkers hang where the room leaves room for them
function slotsDefault() {
  const S = [], south = D / 2 - 0.14;
  for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 2.1, z: south, ry: PI, w: 1.5 });
  [-6.6, -4.2, -1.8].forEach((z) => S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 }));
  [-4.2, -1.8].forEach((z) => S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 }));
  return S;
}
const SLOTS = {
  // the exchange keeps its east wall for the board
  exchange: () => { const S = []; for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.5 }); [-6.6, -4.2, -1.8, 0.6].forEach((z) => S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 })); return S; },
  // city hall keeps its west wall for the agenda
  cityhall: () => { const S = []; for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.5 }); [-6.6, -4.2, -1.8, 0.6].forEach((z) => S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 })); return S; },
};

// ---------- the rooms ----------
import { ROOMS } from './rooms.js';
const ROOM = {
  // ARRIVALS. You fall through the manhole into customs. Your shadow passes inspection; you do not.
  arrivals(c, r, g, X) {
    const { THREE } = c;
    shaft(c, g, 10, 1.0, 0.95, 24);
    // the drop: the first time you arrive, you arrive from the ceiling
    let dropped = false;
    r.onEnter = () => { if (dropped) return; dropped = true; c.P.lift = 4.1; c.flash(0.5); c.sound.whoosh && c.sound.whoosh(); setTimeout(() => { c.sound.thud && c.sound.thud(); c.shake(0.08); c.toast('You fell in. Everybody falls in. Welcome to the city under the city.', 3600); }, 1300); };
    // customs: three tin can booths, a counter, and an officer who has heard every story
    const counter = std(c, 0x5a3a24, { roughness: 0.7 });
    for (const x of [4, 7, 10]) { g.add(c.slab(2.2, 1.1, 0.5, counter, x, 0.55, -3.0)); c.wall(X(x - 1.1), -3.25, X(x + 1.1), -3.25); c.wall(X(x - 1.1), -2.75, X(x + 1.1), -2.75); }
    const lamp = (x) => { const l = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), basic(c, 0xffd890)); l.position.set(x, 2.4, -3.2); g.add(l); g.add(c.slab(0.02, 1.3, 0.02, std(c, 0x222222), x, 1.75, -3.2)); };
    [4, 7, 10].forEach(lamp);
    notice(c, g, 'CUSTOMS · ALL ARRIVALS · NOTHING TO DECLARE IS ALSO A DECLARATION', 7, 3.2, -3.3, 0, 5.4, 0.36, '#14304a', '#f4ead2');
    cast(c, r, g, X, 'sw_customs', 7, -3.9, { h: 1.75, ry: 0, line: 'Purpose of visit? Incorrect. Nobody comes down here on purpose.', egg: 'purpose', hint: 'The customs officer' });
    // the stamp: brass, the size of a barrel
    const stamp = new THREE.Group(); stamp.position.set(12.4, 0, -1.8); g.add(stamp);
    stamp.add(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.35, 28), std(c, 0xb8862e, { metalness: 1, roughness: 0.3 })).translateY(0.18));
    stamp.add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.2, 18), std(c, 0x6a3a1a, { roughness: 0.6 })).translateY(0.95));
    stamp.add(new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), std(c, 0x6a3a1a, { roughness: 0.6 })).translateY(1.7));
    c.post(X(12.4), -1.8, 0.65);
    let stamps = 0;
    c.clickable(stamp, () => {
      stamps++; c.sound.thud && c.sound.thud(); c.shake(0.05);
      const d = decal(c, 1.3, 1.3, (q, w, h) => { q.strokeStyle = 'rgba(200,30,40,.85)'; q.lineWidth = 14; q.strokeRect(14, 40, w - 28, h - 80); q.fillStyle = 'rgba(200,30,40,.85)'; q.font = `900 ${w * 0.15}px ${c.MONO}`; q.textAlign = 'center'; q.fillText(stamps % 2 ? 'COUNTED' : 'DENIED', w / 2, h / 2 + w * 0.05); });
      d.rotation.x = -PI / 2; d.rotation.z = Math.random() - 0.5; d.position.set(11 + Math.random() * 3, 0.02 + stamps * 0.001, 0.2 + Math.random() * 2); g.add(d);
      if (stamps === 3) c.egg('stamped', 'Three stamps. COUNTED, DENIED, COUNTED. The stamp does not know which one is the good one either. It just likes the noise.');
    }, 'A customs stamp the size of a barrel');
    // the shadow lane: an arch you walk through. Your shadow is approved. You are not.
    const arch = std(c, 0x2a2a2e, { metalness: 0.6, roughness: 0.4 });
    g.add(c.slab(0.24, 2.6, 0.24, arch, 14.6, 1.3, 2.4)); g.add(c.slab(0.24, 2.6, 0.24, arch, 16.6, 1.3, 2.4)); g.add(c.slab(2.24, 0.3, 0.3, arch, 15.6, 2.7, 2.4));
    c.post(X(14.6), 2.4, 0.2); c.post(X(16.6), 2.4, 0.2);
    const sb = board(c, g, 2.0, 0.6, 256); sb.m.position.set(15.6, 3.2, 2.4);
    const drawSB = (a, b) => { const { q, W: w, H: h } = sb; q.fillStyle = '#0a0a0a'; q.fillRect(0, 0, w, h); q.font = `800 ${h * 0.3}px ${c.MONO}`; q.textAlign = 'left'; q.fillStyle = a ? '#5aff8a' : '#888'; q.fillText('SHADOW: ' + (a ? 'APPROVED' : '...'), 20, h * 0.42); q.fillStyle = b ? '#ff4a4a' : '#888'; q.fillText('YOU: ' + (b ? 'DENIED' : '...'), 20, h * 0.85); sb.up(); };
    drawSB(false, false);
    // a shadow on the floor that follows you through the lane
    const sh = new THREE.Mesh(new THREE.CircleGeometry(0.5, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false })); sh.rotation.x = -PI / 2; sh.scale.set(0.8, 2.2, 1); g.add(sh);
    let inLane = 0, judged = false;
    c.tick((t, dt, P, ri) => {
      sh.visible = here(r, ri); if (!sh.visible) return;
      const L = local(r, P); sh.position.set(L.x + 0.4, 0.015, L.z + 1.0);
      const inside = Math.abs(L.x - 15.6) < 0.9 && Math.abs(L.z - 2.4) < 0.6;
      if (inside) { inLane += dt; if (inLane > 0.4 && !judged) { judged = true; drawSB(true, false); c.sound.beep && c.sound.beep(); setTimeout(() => { drawSB(true, true); c.sound.horn && c.sound.horn(); c.egg('shadow', 'Your shadow passes inspection. You do not. It is free to go up the ladder and live your life. You are free to stay.'); }, 700); } }
      else { inLane = 0; if (judged && Math.abs(L.z - 2.4) > 2) { judged = false; drawSB(false, false); } }
    });
    // the arrivals board: everything that came down the manhole today
    const ab = board(c, g, 3.6, 1.6, 512); ab.m.position.set(10, 4.3, -3.3);
    const ARR = [['A SLICE, 2015', 'LANDED'], ['ONE ALLIGATOR, 1935', 'LANDED'], ['YOUR LEFT AIRPOD', 'LANDED'], ['A WEDDING RING', 'LANDED'], ['A GOLDFISH NAMED BUBBLES', 'UPSTATE'], ['YOU', 'FELL IN']];
    let ak = 0;
    const drawAB = () => { const { q, W: w, H: h } = ab; q.fillStyle = '#101010'; q.fillRect(0, 0, w, h); q.fillStyle = '#f5c542'; q.font = `800 ${h * 0.12}px ${c.MONO}`; q.fillText('ARRIVALS · FROM THE STREET', 24, h * 0.16); q.font = `600 ${h * 0.085}px ${c.MONO}`; for (let i = 0; i < 5; i++) { const [a, b] = ARR[(ak + i) % ARR.length]; q.fillStyle = '#f4ead2'; q.fillText(a, 24, h * (0.32 + i * 0.14)); q.fillStyle = b === 'FELL IN' ? '#ff6a4a' : '#7fff9a'; q.textAlign = 'right'; q.fillText(b, w - 24, h * (0.32 + i * 0.14)); q.textAlign = 'left'; } ab.up(); };
    drawAB(); let at = 0; c.tick((t) => { if (t - at > 3) { at = t; ak++; drawAB(); } });
    scurry(c, g, 4, { x1: 4, x2: 16, z1: -1.4, z2: 1.2 });
  },

  // THE SLICE. A shrine to Pizza Rat. Push the slice toward him; the stairs get longer every time.
  slice(c, r, g, X) {
    const { THREE } = c;
    // the shrine: a plinth, the saint, a halo that turns, bottle cap votives
    g.add(c.slab(3.2, 0.8, 2.0, std(c, 0xe8e4dc, { roughness: 0.35 }), 10, 0.4, -4.4)); c.post(X(10), -4.4, 1.6);
    const saint = cast(c, r, g, X, 'sw_pizzarat', 10, -4.4, { h: 2.2, y: 0.8, r: 0, line: 'He carried dinner once. I have three jobs.', egg: 'saint', hint: 'Pizza Rat' });
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 10, 48), basic(c, 0xffd060)); halo.position.set(10.1, 3.35, -4.75); g.add(halo);
    c.tick((t) => { halo.rotation.z = t * 0.3; halo.material.color.setHSL(0.12, 1, 0.55 + Math.sin(t * 2) * 0.08); });
    for (let i = 0; i < 9; i++) candle(c, g, 8.6 + i * 0.35, 0.8, -3.5, 0.18);
    notice(c, g, 'PIZZA RAT · FIRST AVENUE L STATION · SEPTEMBER 2015\nHE NEVER FINISHED THE STAIRS. NEITHER WILL YOU.', 10, 0.45, -3.38, 0, 3.0, 0.42, '#f4ead2', '#111');
    for (let k = 0; k < 6; k++) { const m = c.glb('rat', { len: 1.5, x: 6.6 + k * 1.35, z: -1.6, ry: PI, parent: g }); c.post(X(6.6 + k * 1.35), -1.6, 0.35); }
    // the slice: a triangle of crust, cheese and pepperoni, as long as a car
    const slice = new THREE.Group(); slice.position.set(7.4, 0, 2.2); slice.rotation.y = 0.45; g.add(slice);
    const sh = new THREE.Shape(); sh.moveTo(-1.2, 0); sh.lineTo(1.2, 0); sh.lineTo(0, -3.0); sh.closePath();
    const cheese = c.canvasTex(512, 512, (q, w, h) => { q.fillStyle = '#f2c14e'; q.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { q.fillStyle = 'rgba(150,80,20,.5)'; q.beginPath(); q.ellipse(Math.random() * w, Math.random() * h, 8 + Math.random() * 16, 5 + Math.random() * 8, Math.random() * 3, 0, 7); q.fill(); } for (let i = 0; i < 400; i++) { q.fillStyle = `rgba(${200 + Math.random() * 40},${120 + Math.random() * 40},30,.35)`; q.beginPath(); q.arc(Math.random() * w, Math.random() * h, 4 + Math.random() * 14, 0, 7); q.fill(); } });
    const top = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.03, bevelSegments: 2 }), [new THREE.MeshStandardMaterial({ map: cheese, roughness: 0.65 }), new THREE.MeshStandardMaterial({ color: 0xe8b860, roughness: 0.7 })]);
    top.rotation.x = -PI / 2; top.position.y = 0.06; slice.add(top);
    const crust = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 2.5, 14), std(c, 0xb87830, { roughness: 0.8 })); crust.rotation.z = PI / 2; crust.position.set(0, 0.18, 0.02); slice.add(crust);
    const pep = std(c, 0xa8281e, { roughness: 0.5 });
    [[0, -0.7], [-0.45, -0.3], [0.5, -0.35], [0.1, -1.5], [-0.2, -2.2], [0.25, -1.0]].forEach(([x, z]) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 20), pep); p.position.set(x, 0.22, z); slice.add(p); });
    let pushes = 0, sCol = c.post(X(7.4), 1.2, 1.1);
    const mesh0 = { s: 1 };
    c.clickable(slice, () => {
      if (pushes >= 5) return;
      pushes++; slice.position.z -= 0.55; sCol.z = slice.position.z - 1.0; c.sound.thud && c.sound.thud();
      // the stairs disagree: the plate stretches away from you every push
      if (r.plateMesh) { mesh0.s *= 1.22; r.plateMesh.scale.z = mesh0.s; r.plateMesh.scale.y = 1 + (mesh0.s - 1) * 0.25; }
      c.toast(['Push. The stairs get one step longer.', 'Push. Two steps longer. This is how it felt for him.', 'Push. The mezzanine is further away than it was a minute ago.', 'Push. You are now carrying dinner for the whole station.', 'Push. That is the top of the stairs. It is not getting closer.'][pushes - 1], 2600);
      if (pushes === 5) { c.egg('stairs', 'Five pushes and the stairs are twice as long. He did it once, in 2015, on camera, and the whole internet watched him not finish. That is what a saint is: somebody who quits on camera with dignity.'); setTimeout(() => { pushes = 0; slice.position.z = 2.2; sCol.z = 1.2; mesh0.s = 1; if (r.plateMesh) r.plateMesh.scale.set(1, 1, 1); }, 9000); }
    }, 'Push the slice up the stairs');
  },

  // FLUSHED. The Upstate Farm. Pull the chain and you are flushed into the visitor tank.
  flushed(c, r, g, X) {
    const { THREE } = c;
    // the gate: a toilet the size of a house, half sunk in the floor at the back
    toilet(c, g, 10, -5.6, 3.2, 0); c.post(X(10), -5.0, 1.5);
    notice(c, g, 'UPSTATE REALTY · RELOCATIONS SINCE THE FIRST GOLDFISH · NO VIEWINGS', 15.4, 2.6, -2.9, 0, 3.6, 0.4, '#0e3a44', '#bff4ff');
    g.add(c.slab(2.6, 0.9, 1.0, std(c, 0x3a2a1e, { roughness: 0.6 }), 15.4, 0.45, -2.4)); c.wall(X(14.1), -2.9, X(16.7), -2.9); c.wall(X(14.1), -1.9, X(16.7), -1.9);
    cast(c, r, g, X, 'sw_goldfish', 15.4, -3.4, { h: 1.6, y: 0, r: 0, line: 'Your parents said upstate. Technically we are north of something. Sign here, here, and here.', egg: 'broker', hint: 'The goldfish broker' });
    const NAMES = [['Bubbles', '1998', 'says the farm has a pool. It is a toilet tank. She knows.'], ['Mr. Fins', '2007', 'was told he was going to live with a nice family in Connecticut. He has questions.'], ['Gold Rush', '2013', 'won at a street fair, flushed by Sunday, still not over it.'], ['Doris', '1979', 'is the oldest resident. She remembers when the water was clean. It was never clean.']];
    NAMES.forEach(([n, y, s], k) => { const b = bowl(c, g, X, 3 + k * 2.1 + (k > 1 ? 7.4 : 0), 1.2, 1.0, 0.55); c.clickable(b, () => c.say(b, `${n}, flushed ${y}, ${s}`, 4200, 2.4), n); });
    // the chain: pull it and the room fills to the ceiling for a while
    const chain = new THREE.Group(); chain.position.set(5.2, 0, 4.0); g.add(chain);
    const steel = std(c, 0xcfcfcf, { metalness: 1, roughness: 0.25 });
    for (let k = 0; k < 18; k++) { const l = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.014, 6, 12), steel); l.position.y = H_IN - 0.1 - k * 0.12; l.rotation.y = k % 2 ? PI / 2 : 0; chain.add(l); }
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.36, 12), std(c, 0xf2f0ea, { roughness: 0.2 })); handle.rotation.z = PI / 2; handle.position.y = H_IN - 2.3; chain.add(handle);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.6, 0.7), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = H_IN - 1.3; chain.add(hit);
    const water = new THREE.Mesh(new THREE.BoxGeometry(W - 0.4, 1, D - 0.4), new THREE.MeshStandardMaterial({ color: 0x2aa8c8, transparent: true, opacity: 0.32, roughness: 0.05, depthWrite: false, side: THREE.DoubleSide }));
    water.position.set(W / 2, 0, 0); water.scale.y = 0.001; water.visible = false; g.add(water);
    const fish = []; for (let k = 0; k < 26; k++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: fishTex(c), transparent: true })); s.scale.set(0.5, 0.3, 1); s.visible = false; g.add(s); fish.push({ s, k, r: 1.5 + (k % 5) * 1.2, y: 0.4 + (k % 6) * 0.35 }); }
    let flood = 0, level = 0, tinted = false;
    c.clickable(hit, () => { if (flood > 0) return; flood = 9; c.sound.whoosh && c.sound.whoosh(); c.flash(0.3); c.egg('flushed', 'You have been flushed. Welcome upstate. The farm is lovely this time of year. There is no farm.'); }, 'Pull the chain');
    c.tick((t, dt, P, ri) => {
      if (flood > 0) flood = Math.max(0, flood - dt);
      const target = flood > 1.5 ? 2.5 : 0; level += (target - level) * Math.min(1, dt * (target ? 1.2 : 0.8));
      water.visible = level > 0.02; water.scale.y = Math.max(0.001, level); water.position.y = level / 2;
      const under = here(r, ri) && P.y < level;
      if (under && !tinted) { tinted = true; c.FX.tint = 0x9fe6ff; c.FX.warp = 0.6; } else if (!under && tinted) { tinted = false; c.FX.tint = null; c.FX.warp = 0; }
      fish.forEach((f) => { f.s.visible = level > 0.8; if (!f.s.visible) return; const a = t * (0.4 + f.k * 0.02) + f.k; const L = local(r, P); f.s.position.set(L.x + Math.cos(a) * f.r, Math.min(level - 0.2, f.y + Math.sin(t + f.k) * 0.2), P.z + Math.sin(a) * f.r); f.s.scale.x = (Math.cos(a + PI / 2) > 0 ? 0.5 : -0.5); });
    });
    for (let k = 0; k < 8; k++) { const sq = c.slab(0.7, 0.012, 0.7, std(c, 0xf6f4ee, { roughness: 0.95 }), 6.5 + k * 0.9 + Math.sin(k) * 0.6, 0.006, 2.6 - k * 0.7, 2); sq.rotation.y = k * 0.7; g.add(sq); }
    scurry(c, g, 2, { x1: 6, x2: 14, z1: 0, z2: 5 });
  },

  // THE GATOR ROOM. A lounge whose only credential is February 1935. Pull the clipping; its subject wakes.
  gator(c, r, g, X) {
    const { THREE } = c;
    // the stage, the curtain, the spotlight
    g.add(c.slab(6.4, 0.5, 2.6, std(c, 0x3a1e12, { roughness: 0.6 }), 10, 0.25, -4.8)); c.wall(X(6.8), -3.5, X(13.2), -3.5);
    const fold = c.canvasTex(256, 64, (q, w, h) => { for (let x = 0; x < w; x++) { const v = 0.55 + 0.45 * Math.sin(x / w * PI * 16); q.fillStyle = `rgb(${Math.round(150 * v)},${Math.round(14 * v)},${Math.round(22 * v)})`; q.fillRect(x, 0, 1, h); } });
    const curtain = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 4.6), new THREE.MeshStandardMaterial({ map: fold, roughness: 0.85 })); curtain.position.set(10, 2.8, -6.1); g.add(curtain);
    const gator = cast(c, r, g, X, 'sw_gator', 10, -4.8, { h: 2.6, y: 0.5, r: 0 });
    const spot = new THREE.SpotLight(0xffd8a0, 26, 12, 0.35, 0.7, 1.4); spot.position.set(10, 5.6, -1.6); spot.target.position.set(10, 2.2, -4.8); g.add(spot); g.add(spot.target);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.6, 5.4, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.05, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false })); cone.position.set(10, 3.2, -4.8); cone.visible = false; g.add(cone);
    // his eyes, closed until somebody brings up 1935
    const eyeM = basic(c, 0xffe060); const eyes = [];
    for (const dx of [-0.13, 0.13]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), eyeM); e.position.set(10 + dx, 3.0, -4.45); e.visible = false; g.add(e); eyes.push(e); }
    // the clipping, on an easel, in a frame
    const easel = new THREE.Group(); easel.position.set(4.2, 0, -1.2); easel.rotation.y = 0.5; g.add(easel);
    const wood = std(c, 0x5a3a1e, { roughness: 0.7 });
    for (const dx of [-0.5, 0.5]) { const l = c.slab(0.06, 2.4, 0.06, wood, dx, 1.2, 0); l.rotation.z = -dx * 0.1; easel.add(l); }
    const clip = c.canvasTex(512, 640, (q, w, h) => {
      q.fillStyle = '#e8dcb8'; q.fillRect(0, 0, w, h); q.fillStyle = 'rgba(120,90,40,.25)'; for (let i = 0; i < 30; i++) q.fillRect(Math.random() * w, Math.random() * h, 40, 2);
      q.fillStyle = '#1a1612'; q.textAlign = 'center'; q.font = `900 46px ${c.SERIF}`; q.fillText('ALLIGATOR', w / 2, 90); q.fillText('IN THE SEWER', w / 2, 142);
      q.font = `700 22px ${c.SERIF}`; q.fillText('EAST 123RD STREET · FEBRUARY 1935', w / 2, 190);
      q.textAlign = 'left'; q.font = `400 17px ${c.SERIF}`;
      ['Boys shovelling snow into an open manhole', 'near the Harlem River saw something move', 'in the ice below. They lassoed it with a', 'clothesline and pulled up an alligator,', 'nearly eight feet long by their account.', 'It did not survive the afternoon.', '', 'CORRECTION: the alligator would like it', 'known that it was "seven and a half feet,', 'and modest about it."', '', 'CORRECTION: the alligator did not', 'say that. It was the lounge.'].forEach((l, i) => q.fillText(l, 40, 240 + i * 28));
    });
    const frame = c.slab(1.1, 1.36, 0.06, std(c, 0xb8902e, { metalness: 1, roughness: 0.3 }), 0, 1.75, 0.06); easel.add(frame);
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.25), new THREE.MeshStandardMaterial({ map: clip, roughness: 0.9 })); paper.position.set(0, 1.75, 0.1); easel.add(paper);
    c.post(X(4.2), -1.2, 0.6);
    let awake = 0;
    c.clickable(easel, () => {
      awake = 8; eyes.forEach((e) => (e.visible = true)); cone.visible = true; cone.material.opacity = 0.08; c.sound.drone && c.sound.drone();
      c.say(gator, 'One sighting. Ninety years of appearances. I do two sets a night.', 4200, 3.4); c.egg('clipping', 'February 1935, East 123rd Street: boys shovelling snow pulled an alligator out of a sewer with a clothesline. The New York Times ran it. Every alligator story since is a cover version.');
    }, 'Pull the clipping');
    c.tick((t, dt, P) => { if (awake > 0) { awake -= dt; if (awake <= 0) { eyes.forEach((e) => (e.visible = false)); cone.visible = false; } else { gator.rotation.y = Math.atan2(P.x - X(10), P.z + 4.8) * 0.4; } } });
    // the water channel in front of the stage: hold still and something surfaces
    const chan = new THREE.Mesh(new THREE.PlaneGeometry(14, 1.1), new THREE.MeshStandardMaterial({ color: 0x04100c, metalness: 0.9, roughness: 0.06 })); chan.rotation.x = -PI / 2; chan.position.set(10, 0.02, -2.8); g.add(chan);
    const pair = new THREE.Group(); g.add(pair);
    for (const dx of [-0.16, 0.16]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8, 0, PI * 2, 0, PI / 2), std(c, 0x2a3a1a, { roughness: 0.5 })); e.position.x = dx; pair.add(e); const p = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), basic(c, 0xe8d040)); p.position.set(dx, 0.04, 0.05); pair.add(p); }
    let still = 0, seen = false; const last = { x: 0, z: 0 };
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) { pair.visible = false; return; }
      const moved = Math.hypot(P.x - last.x, P.z - last.z) > 0.002; last.x = P.x; last.z = P.z; still = moved ? 0 : still + dt;
      const u = Math.min(1, Math.max(0, (still - 3) / 1.2)); pair.visible = u > 0; pair.position.set(Math.min(16, Math.max(4, local(r, P).x)), -0.06 + u * 0.08, -2.8);
      if (u >= 1 && !seen) { seen = true; c.egg('eyes', 'Stand still long enough in a New York sewer and something stands still back. That is not a metaphor. That is the lounge policy.'); }
    });
    // bottle cap cocktail tables with candle stubs
    [[6, 1.4], [8.6, 3.2], [12.4, 2.8], [14.6, 4.8], [5.4, 4.8]].forEach(([x, z], k) => { const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.52, 0.7, 21), std(c, [0xc8102e, 0xe8b62c, 0x1d4ed8][k % 3], { metalness: 0.8, roughness: 0.3 })); cap.position.set(x, 0.35, z); g.add(cap); c.post(X(x), z, 0.55); candle(c, g, x, 0.7, z, 0.16); });
    const neon = c.sign('THE GATOR ROOM · TWO SETS NIGHTLY · SINCE 1935', { w: 4.4, h: 0.36, bg: null, fg: '#40ff80', font: c.MONO, weight: 800, glow: 14 }); neon.position.set(10, 5.4, -6.0); g.add(neon);
  },

  // THE FATBERG. A cathedral of everything poured down the drain. Light a votive; the altar grows.
  fatberg(c, r, g, X) {
    const { THREE } = c;
    // pillars of congealed fat, lit from inside like alabaster
    const fat = c.canvasTex(256, 512, (q, w, h) => { q.fillStyle = '#e8c890'; q.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { q.fillStyle = `rgba(${180 + Math.random() * 60},${130 + Math.random() * 60},${60 + Math.random() * 40},${0.15 + Math.random() * 0.25})`; q.beginPath(); q.ellipse(Math.random() * w, Math.random() * h, 6 + Math.random() * 30, 20 + Math.random() * 60, 0, 0, 7); q.fill(); } q.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 20; i++) q.fillRect(Math.random() * w, Math.random() * h, 22, 3); });
    const fatM = new THREE.MeshStandardMaterial({ map: fat, emissive: 0xffa040, emissiveIntensity: 0.25, emissiveMap: fat, roughness: 0.35, transparent: true, opacity: 0.94 });
    [[3.2, -4.8], [16.8, -4.8], [3.2, 0.6], [16.8, 0.6]].forEach(([x, z]) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.8, H_IN, 18, 6), fatM); const pos = p.geometry.attributes.position; for (let i = 0; i < pos.count; i++) { const k = 1 + Math.sin(pos.getY(i) * 3 + x) * 0.08; pos.setX(i, pos.getX(i) * k); pos.setZ(i, pos.getZ(i) * k); } p.geometry.computeVertexNormals(); p.position.set(x, H_IN / 2, z); g.add(p); c.post(X(x), z, 0.85); });
    const tileM = new THREE.MeshStandardMaterial({ map: c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = '#d8ccb0'; q.fillRect(0, 0, w, h); q.strokeStyle = 'rgba(90,70,40,.5)'; q.lineWidth = 3; for (let i = 0; i <= 4; i++) { q.beginPath(); q.moveTo(i * 64, 0); q.lineTo(i * 64, h); q.stroke(); q.beginPath(); q.moveTo(0, i * 64); q.lineTo(w, i * 64); q.stroke(); } for (let i = 0; i < 60; i++) { q.fillStyle = 'rgba(160,110,40,.12)'; q.beginPath(); q.arc(Math.random() * w, Math.random() * h, 6 + Math.random() * 20, 0, 7); q.fill(); } }), roughness: 0.8 });
    tileM.map.wrapS = tileM.map.wrapT = THREE.RepeatWrapping; tileM.map.repeat.set(8, 1);
    g.add(c.slab(W - 0.5, 1.3, 0.02, tileM, W / 2, 0.65, D / 2 - 0.01, 1));
    for (const x of [0.13, W - 0.38]) { g.add(c.slab(0.02, 1.3, 9.8, tileM, x, 0.65, -3.1, 1)); g.add(c.slab(0.02, 1.3, 2.2, tileM, x, 0.65, 6.8, 1)); }
    // the altar: one candle the size of a house, and it grows
    const altar = new THREE.Group(); altar.position.set(10, 0, -5.4); g.add(altar);
    const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 1, 24), fatM); wax.position.y = 0.5; altar.add(wax);
    const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,170,60,.95)'), transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending })); flame.scale.set(0.8, 1.4, 1); altar.add(flame);
    let H = 1.6; c.post(X(10), -5.4, 1.0);
    c.tick((t) => { wax.scale.y = H; wax.position.y = H / 2; flame.position.y = H + 0.6; flame.scale.set(0.8 + Math.sin(t * 13) * 0.06, 1.4 + Math.sin(t * 19) * 0.12, 1); });
    cast(c, r, g, X, 'sw_cantor', 7.4, -4.0, { h: 2.0, ry: 0.5, line: 'Every contribution is tax indigestible. The collection plate is also a contribution. We are not sure whose.', egg: 'cantor', hint: 'The cantor' });
    // the votives: light one, and the altar takes it personally
    let lit = 0;
    for (let i = 0; i < 6; i++) {
      const v = candle(c, g, 7.2 + i * 1.1, 0.9, -1.2, 0.26, false); g.add(c.slab(0.5, 0.9, 0.5, fatM, 7.2 + i * 1.1, 0.45, -1.2)); c.post(X(7.2 + i * 1.1), -1.2, 0.3);
      c.clickable(v, () => { if (v.userData.flame.visible) return; v.userData.flame.visible = true; lit++; H += 0.55; c.sound.ding(); c.toast(['Lit. The altar grew a foot.', 'Lit. The altar grew again. Nobody asked it to.', 'Lit. The altar now owns the room.', 'Lit. The congregation applauds by not cleaning it.', 'Lit. You have contributed. Indigestibly.', 'Lit. The altar is taller than the cathedral that holds it.'][lit - 1], 2600); if (lit === 6) c.egg('tithe', 'Six votives and the altar doubled. That is how a fatberg works: everybody adds a little, nobody adds a lot, and one day it is a cathedral and the city spends a month taking it apart with shovels.'); }, 'Light a votive');
    }
    // pews of bottle caps, the faithful (rats) in them
    for (let row = 0; row < 3; row++) for (const x of [6, 14]) { const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.52, 0.45, 21), std(c, 0xb8b8b8, { metalness: 0.9, roughness: 0.3 })); cap.position.set(x, 0.22, 1.6 + row * 1.6); g.add(cap); c.post(X(x), 1.6 + row * 1.6, 0.55); if ((row + x) % 2) c.glb('rat', { len: 1.4, x, y: 0.45, z: 1.6 + row * 1.6, ry: PI, parent: g, shadow: false }); }
    // a fork crozier, fossil wrappers in the floor
    ['BUTTER', 'WIPES', 'NOODLES', 'GRAVY', 'MAYO'].forEach((w, k) => { const d = decal(c, 1.1, 0.5, (q, ww, hh) => { q.fillStyle = 'rgba(240,230,200,.55)'; q.fillRect(0, 0, ww, hh); q.fillStyle = 'rgba(80,50,20,.7)'; q.font = `900 ${hh * 0.45}px ${c.MONO}`; q.textAlign = 'center'; q.fillText(w, ww / 2, hh * 0.66); }); d.rotation.x = -PI / 2; d.rotation.z = k * 1.3; d.position.set(4 + k * 3, 0.012, 4.6 - (k % 2) * 2); g.add(d); });
  },

  // THE CRUMB EXCHANGE. Breakfast futures under a bakery. Drop one sesame seed and watch the market.
  exchange(c, r, g, X) {
    const { THREE } = c;
    // the board on the east wall, a random walk every half second
    const bd = board(c, g, 5.6, 3.2, 512); bd.m.position.set(W - 0.4, 2.8, -1.4); bd.m.rotation.y = -PI / 2;
    const T = [['CRUMB', 105], ['SESAME', 98], ['RYE', 112], ['SCHMEAR', 87], ['EVERYTHING', 140], ['POPPY', 64], ['LOX', 220]].map(([n, p]) => ({ n, p, o: p, a: p }));
    let crash = 0;
    const draw = () => { const { q, W: w, H: h } = bd; q.fillStyle = crash > 0 ? '#2a0606' : '#0a0e0a'; q.fillRect(0, 0, w, h); q.font = `800 ${h * 0.075}px ${c.MONO}`; q.fillStyle = '#f5c542'; q.fillText(crash > 0 ? 'MARKET CLOSED · ONE SEED' : 'THE CRUMB EXCHANGE · 4:59 AM', 24, h * 0.1);
      T.forEach((s, i) => { const y = h * (0.22 + i * 0.11), ch = (s.p - s.o) / s.o * 100; q.fillStyle = '#f4ead2'; q.textAlign = 'left'; q.fillText(s.n, 24, y); q.textAlign = 'right'; q.fillStyle = ch >= 0 ? '#5aff8a' : '#ff5a5a'; q.fillText(s.p.toFixed(1), w * 0.72, y); q.fillText((ch >= 0 ? '+' : '') + ch.toFixed(1) + '%', w - 24, y); q.textAlign = 'left'; }); bd.up(); };
    draw(); let bt = 0;
    c.tick((t, dt) => { if (crash > 0) crash -= dt; if (t - bt < 0.5) return; bt = t; T.forEach((s) => { s.p = crash > 0 ? Math.max(0.1, s.p * (0.8 + Math.random() * 0.1)) : Math.max(1, s.p + (s.a - s.p) * 0.05 + (Math.random() - 0.5) * s.a * 0.02); }); draw(); });
    // the conveyor, carrying a bagel and a croissant the size of cars, round and round
    g.add(c.slab(17, 0.9, 1.6, std(c, 0x2a2a2a, { metalness: 0.6, roughness: 0.4 }), 10, 0.45, -5.0)); c.wall(X(1.5), -4.2, X(18.5), -4.2);
    const beltT = c.canvasTex(256, 64, (q, w, h) => { q.fillStyle = '#1a1a1a'; q.fillRect(0, 0, w, h); q.fillStyle = '#333'; for (let x = 0; x < w; x += 16) q.fillRect(x, 0, 6, h); }); beltT.wrapS = THREE.RepeatWrapping; beltT.repeat.x = 10;
    const belt = new THREE.Mesh(new THREE.PlaneGeometry(17, 1.5), new THREE.MeshStandardMaterial({ map: beltT, roughness: 0.8 })); belt.rotation.x = -PI / 2; belt.position.set(10, 0.91, -5.0); g.add(belt);
    const seeds = c.canvasTex(256, 128, (q, w, h) => { q.fillStyle = '#b8742e'; q.fillRect(0, 0, w, h); for (let i = 0; i < 500; i++) { q.fillStyle = ['#f4ead2', '#1a1a1a', '#e0c070', '#6a3a1a'][i % 4]; q.save(); q.translate(Math.random() * w, Math.random() * h); q.rotate(Math.random() * 6); q.fillRect(-3, -1, 6, 2); q.restore(); } });
    const bagel = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.42, 20, 40), new THREE.MeshStandardMaterial({ map: seeds, roughness: 0.6 })); bagel.rotation.x = PI / 2; bagel.position.y = 1.32; g.add(bagel);
    const crois = c.glb('ph_croissant', { len: 2.4, x: 0, y: 0.92, z: -5.0, parent: g, shadow: false });
    c.tick((t, dt) => { beltT.offset.x -= dt * 0.25; const u = (t * 0.05) % 1, v = (t * 0.05 + 0.5) % 1; bagel.position.set(2 + u * 16, 1.32, -5.0); bagel.rotation.z = -t * 0.6; crois.position.set(2 + v * 16, 0.92, -5.0); });
    c.clickable(bagel, () => c.egg('everything', 'We are bullish on everything bagels. Except everything. Mostly the onion. The poppy seeds failed a drug test in 2009 and the market never forgot.'), 'An everything bagel the size of a car');
    // the traders
    cast(c, r, g, X, 'sw_trader', 6.2, -2.4, { h: 1.8, ry: 0.4, line: 'Sesame is up four percent on rumours of a sesame. Buy the rumour, eat the news.', egg: 'trader', hint: 'The crumb trader' });
    const floorRats = scurry(c, g, 5, { x1: 3, x2: 15, z1: -1.5, z2: 4.5 });
    // the seed: one sesame seed on a pedestal, as long as your arm. Drop it.
    g.add(c.slab(0.8, 1.1, 0.8, std(c, 0x111111, { roughness: 0.3 }), 13.6, 0.55, 1.4)); c.post(X(13.6), 1.4, 0.5);
    const seed = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 14), std(c, 0xf2e6c4, { roughness: 0.5 })); seed.scale.set(1, 0.45, 2.1); seed.position.set(13.6, 1.25, 1.4); g.add(seed);
    notice(c, g, 'DO NOT DROP THE SEED', 13.6, 0.75, 1.82, 0, 0.75, 0.14, '#ff3a3a', '#fff');
    let fall = -1;
    c.clickable(seed, () => { if (fall >= 0 || crash > 0) return; fall = 0; }, 'A sesame seed. Do not drop it');
    c.tick((t, dt) => {
      if (fall < 0) return; fall += dt; seed.position.y = Math.max(0.05, 1.25 - fall * fall * 4.9); seed.rotation.z = fall * 6;
      if (seed.position.y <= 0.05 && crash <= 0) { crash = 7; c.sound.crack && c.sound.crack(); c.sound.horn && c.sound.horn(); c.shake(0.12); c.flash(0.3); floorRats.forEach((o) => (o.away = 2.5)); c.toast('One sesame seed hit the floor. The market has lost ninety percent of its value. Everybody is fine. Nobody is fine.', 4200); c.egg('crash', 'Market crash triggered by one sesame seed. The Crumb Exchange regrets nothing and reopens in seven seconds. That is longer than most.'); setTimeout(() => { fall = -1; seed.position.y = 1.25; seed.rotation.z = 0; T.forEach((s) => { s.p = s.a; }); }, 7500); }
    });
  },

  // LOST THROUGH THE GRATE. Lost property, at the scale it was lost at. Ring the left ear.
  grate(c, r, g, X) {
    const { THREE } = c;
    // the grate in the ceiling: daylight in bars, and shoes going past above
    const gt = c.canvasTex(512, 256, () => {}), gq = gt.userData.canvas.getContext('2d');
    const grate = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), new THREE.MeshBasicMaterial({ map: gt, toneMapped: false })); grate.rotation.x = PI / 2; grate.position.set(10, H_IN - 0.04, 0); g.add(grate);
    const shoes = [0, 0.33, 0.66].map((p, k) => ({ p, s: 0.07 + k * 0.03, y: 60 + k * 70 }));
    let gtT = 0;
    c.tick((t, dt, P, ri) => { if (!here(r, ri) || t - gtT < 0.08) return; gtT = t; gq.fillStyle = '#fffaf0'; gq.fillRect(0, 0, 512, 256); gq.fillStyle = 'rgba(40,40,50,.55)'; shoes.forEach((s) => { const x = ((t * s.s + s.p) % 1.2) * 600 - 60; gq.beginPath(); gq.ellipse(x, s.y, 46, 18, 0, 0, 7); gq.fill(); gq.beginPath(); gq.ellipse(x + 30, s.y + 40, 46, 18, 0, 0, 7); gq.fill(); }); gq.fillStyle = '#1a1a1e'; for (let x = 0; x < 512; x += 32) gq.fillRect(x, 0, 12, 256); gt.needsUpdate = true; });
    // the earbuds: white, glossy, as big as a car
    const gloss = new THREE.MeshPhysicalMaterial({ color: 0xf6f6f6, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08 });
    const bud = (x, z, ry) => { const o = new THREE.Group(); o.position.set(x, 0, z); o.rotation.y = ry; g.add(o); const head = new THREE.Mesh(new THREE.SphereGeometry(0.75, 28, 20), gloss); head.position.set(0, 0.75, 0); o.add(head); const stem = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 2.2, 8, 16), gloss); stem.rotation.z = PI / 2; stem.position.set(1.5, 0.3, 0); o.add(stem); const grill = new THREE.Mesh(new THREE.CircleGeometry(0.3, 20), std(c, 0x222222, { roughness: 0.6 })); grill.position.set(0, 0.95, 0.72); o.add(grill); c.post(X(x), z, 0.9); c.post(X(x + Math.cos(ry) * 1.5), z - Math.sin(ry) * 1.5, 0.4); return o; };
    bud(4.2, -1.6, 0.4); const left = bud(13.4, -2.4, 2.6);
    const clerk = c.glb('rat', { len: 0.9, x: 4.2, y: 1.42, z: -1.6, ry: 0.4, parent: g, shadow: false });
    c.clickable(clerk, () => c.say(clerk, 'Claims. Take a number. The number is also lost.', 3400, 1.2), 'The claims clerk');
    const tag = (txt, x, y, z, ry) => { const s = c.sign(txt, { w: 0.9, h: 0.5, bg: '#f2ead8', fg: '#111', font: c.MONO, weight: 700, px: 128 }); s.position.set(x, y, z); s.rotation.y = ry; g.add(s); g.add(c.slab(0.01, 0.6, 0.01, std(c, 0xffffff), x, y + 0.55, z)); };
    tag('RIGHT EAR\nCLAIM 0001', 4.2, 1.9, -0.85, 0); tag('LEFT EAR\nCLAIM 0002', 13.4, 1.9, -1.65, 0);
    let ringing = 0; const rats = scurry(c, g, 6, { x1: 3, x2: 17, z1: 0, z2: 5.5 });
    c.clickable(left, () => { if (ringing > 0) return; ringing = 6; rats.forEach((o) => (o.away = 4)); c.toast('Ping. Ping. Ping. Find My is ringing the left ear. Every rat in the depot has left the building.', 3800); c.egg('leftear', 'Left ear. Excellent condition. Emotionally unavailable. Its owner has been ringing it every night since March. It is not coming back. It likes it here.'); }, 'Ring the left ear');
    c.tick((t, dt) => { if (ringing <= 0) { left.position.y = 0; return; } ringing -= dt; left.position.y = Math.abs(Math.sin(t * 22)) * 0.06; left.rotation.x = Math.sin(t * 31) * 0.03; if (Math.floor(t * 3) !== Math.floor((t - dt) * 3)) c.sound.beep && c.sound.beep(); });
    // a fare card leaning like a door, a ring like a monument
    const card = c.canvasTex(512, 320, (q, w, h) => { q.fillStyle = '#f5c518'; q.fillRect(0, 0, w, h); q.fillStyle = '#1a1a1a'; q.font = `900 46px ${c.MONO}`; q.fillText('N3W FARE CARD', 30, 80); q.font = `700 22px ${c.MONO}`; q.fillText('INSERT THIS WAY · THIS SIDE FACING YOU', 30, 130); q.fillText('BALANCE: $0.25 · NOT ENOUGH, NEVER ENOUGH', 30, 170); q.fillRect(0, 240, w, 30); });
    const fc = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.0, 0.05), [0, 0, 0, 0, new THREE.MeshStandardMaterial({ map: card, roughness: 0.4 }), 0].map((m) => m || std(c, 0xf5c518))); fc.position.set(8.0, 1.0, -4.6); fc.rotation.x = -0.14; g.add(fc); c.wall(X(6.4), -4.6, X(9.6), -4.6);
    c.clickable(fc, () => c.egg('farecard', 'A fare card with twenty five cents on it. Not enough for a ride, too much to throw away. Every New Yorker owns four. Down here they are load bearing.'), 'A fare card the size of a door');
    const ring = new THREE.Group(); ring.position.set(16.6, 0, 3.8); g.add(ring);
    g.add(c.slab(1.4, 0.6, 1.4, std(c, 0x1a1a1a, { roughness: 0.3 }), 16.6, 0.3, 3.8)); c.post(X(16.6), 3.8, 0.9);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.12, 20, 48), std(c, 0xe0b850, { metalness: 1, roughness: 0.18 })); band.position.y = 1.32; ring.add(band);
    const rock = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 1), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0, transmission: 0.9, thickness: 0.4, ior: 2.4 })); rock.position.y = 2.02; ring.add(rock);
    c.tick((t) => { ring.rotation.y = t * 0.4; });
    c.clickable(ring, () => c.egg('ring', 'Unclaimed since 1997, Lexington and 59th. The engagement was also unclaimed. Storage on the ring is now more than the ring.'), 'A wedding ring like a monument');
    // and now and then something else falls through
    const coins = []; let next = 4;
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) return; next -= dt;
      if (next <= 0 && coins.length < 14) { next = 6 + Math.random() * 4; const m = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 24), std(c, 0xc8a050, { metalness: 1, roughness: 0.3 })); m.position.set(8 + Math.random() * 4, H_IN - 0.1, -1 + Math.random() * 2); m.userData.v = 0; g.add(m); coins.push(m); }
      coins.forEach((m) => { if (m.position.y <= 0.03) return; m.userData.v += dt * 9.8; m.position.y = Math.max(0.03, m.position.y - m.userData.v * dt); m.rotation.x += dt * 9; if (m.position.y <= 0.03) { m.rotation.set(0, Math.random() * 6, 0); c.sound.clink && c.sound.clink(); } });
    });
  },

  // BEACH PNEUMATIC. Alfred Beach's one block air subway, 1870. Pump the bellows; your train is cancelled.
  pneumatic(c, r, g, X) {
    const { THREE } = c;
    // the car: a velvet cylinder with brass bands on a short track
    const car = new THREE.Group(); car.position.set(10, 0, -3.6); g.add(car);
    const velvet = c.surf('velvet', 1, 0x8a1a1a), brass = std(c, 0xc8a050, { metalness: 1, roughness: 0.25 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 6.4, 32), velvet); body.rotation.z = PI / 2; body.position.y = 1.5; car.add(body);
    for (const x of [-3, -1.5, 0, 1.5, 3]) { const b = new THREE.Mesh(new THREE.TorusGeometry(1.27, 0.05, 10, 40), brass); b.rotation.y = PI / 2; b.position.set(x, 1.5, 0); car.add(b); }
    for (const x of [-2.2, -0.75, 0.75, 2.2]) { const w = new THREE.Mesh(new THREE.CircleGeometry(0.32, 24), basic(c, 0xffd890)); w.position.set(x, 1.7, 1.24); car.add(w); }
    for (const z of [-0.6, 0.6]) g.add(c.slab(17, 0.08, 0.12, brass, 10, 0.04, -3.6 + z));
    c.wall(X(6.6), -2.3, X(13.4), -2.3); c.wall(X(6.6), -4.9, X(13.4), -4.9); c.wall(X(6.6), -4.9, X(6.6), -2.3); c.wall(X(13.4), -4.9, X(13.4), -2.3);
    // the fan, the whole point: one big fan blew the car down the tube and sucked it back
    const fan = new THREE.Group(); fan.position.set(18.2, 2.6, -5.2); fan.rotation.y = -PI / 2; g.add(fan);
    fan.add(new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.18, 12, 48), brass));
    for (let k = 0; k < 6; k++) { const b = c.slab(0.5, 1.5, 0.04, std(c, 0x3a2a1a, { roughness: 0.5 }), 0, 0.8, 0); const p = new THREE.Group(); p.rotation.z = k / 6 * PI * 2; p.add(b); b.rotation.y = 0.4; fan.add(p); }
    let fanV = 0.6; c.tick((t, dt) => { fan.rotation.z += dt * fanV; });
    // the departure board, which inflates
    const db = board(c, g, 3.4, 1.4, 384); db.m.position.set(10, 4.2, -3.6);
    let pumps = 0, cancelled = 0;
    const drawDB = () => { const { q, W: w, H: h } = db; q.fillStyle = '#1a0e06'; q.fillRect(0, 0, w, h); q.strokeStyle = '#c8a050'; q.lineWidth = 8; q.strokeRect(8, 8, w - 16, h - 16); q.textAlign = 'center'; q.fillStyle = '#f5d488'; q.font = `700 ${h * 0.16}px ${c.SERIF}`; q.fillText('WARREN STREET TO MURRAY STREET', w / 2, h * 0.3); q.font = `900 ${h * 0.24}px ${c.SERIF}`; q.fillStyle = cancelled > 0 ? '#ff5a4a' : '#f5d488'; q.fillText(cancelled > 0 ? 'CANCELLED · ATMOSPHERE' : `PRESSURE ${pumps} OF 5`, w / 2, h * 0.68); db.up(); };
    drawDB();
    const bellows = new THREE.Group(); bellows.position.set(4.6, 0, 1.6); g.add(bellows);
    const leather = std(c, 0x5a3418, { roughness: 0.8 });
    const bag = c.slab(1.6, 0.6, 1.0, leather, 0, 0.6, 0); bellows.add(bag); bellows.add(c.slab(1.8, 0.08, 1.2, std(c, 0x6a4422), 0, 0.28, 0)); const lid = c.slab(1.8, 0.08, 1.2, std(c, 0x6a4422), 0, 0.92, 0); bellows.add(lid);
    c.post(X(4.6), 1.6, 0.9); let squeeze = 0;
    c.clickable(bellows, () => {
      if (cancelled > 0) return; squeeze = 0.5; pumps++; c.sound.whoosh && c.sound.whoosh(); fanV = 0.6 + pumps * 1.4; db.m.scale.setScalar(1 + pumps * 0.12); drawDB();
      if (pumps >= 5) { cancelled = 6; c.sound.crack && c.sound.crack(); c.flash(0.35); db.m.scale.setScalar(1); drawDB(); c.toast('Service suspended due to atmosphere. Please use the other secret Victorian subway.', 3800); c.egg('atmosphere', 'Alfred Ely Beach built it in secret in 58 days and opened it in February 1870: one car, one block, one fan, under Broadway. The city never let it go any farther. The board has been saying CANCELLED ever since.'); }
    }, 'Pump the bellows');
    c.tick((t, dt) => { if (squeeze > 0) { squeeze -= dt; } bag.scale.y = squeeze > 0 ? 0.5 : 1; lid.position.y = squeeze > 0 ? 0.76 : 0.92; car.position.x = 10 + Math.min(1.5, pumps * 0.3) * (cancelled > 0 ? 0 : 1); if (cancelled > 0) { cancelled -= dt; if (cancelled <= 0) { pumps = 0; fanV = 0.6; drawDB(); } } });
    bowl(c, g, X, 15.6, 3.4, 1.1, 0.5);
    notice(c, g, 'BEACH PNEUMATIC TRANSIT · 1870 · ONE BLOCK · ONE FAN · ONE CAR\nTHE FIRST SUBWAY IN NEW YORK WAS A SECRET AND A SINGLE STOP.', 10, 0.9, -6.6, 0, 5.2, 0.5, '#1a0e06', '#f5d488');
    const piano = c.glb('rat', { len: 1.1, x: 15.6, z: 1.8, ry: -PI / 2, parent: g });
    c.clickable(piano, () => c.say(piano, 'Next train in one hundred and fifty six years. Make yourself comfortable.', 3800, 1.4), 'The conductor');
  },

  // THE STEAM BATHS. A spa that runs on utility leaks. Turn the aromatherapy dial.
  steam(c, r, g, X) {
    const { THREE } = c;
    const brass = std(c, 0xc8a050, { metalness: 1, roughness: 0.3 }), pipeM = std(c, 0x8a6a4a, { metalness: 0.7, roughness: 0.45 });
    // the mains: pipes the size of tunnels along the ceiling, valve wheels like Ferris wheels
    for (const z of [-5.6, -2.2, 1.8]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, W, 24), pipeM); p.rotation.z = PI / 2; p.position.set(W / 2, H_IN - 0.6, z); g.add(p); }
    const wheel = (x, y, z, R, ry = 0) => { const o = new THREE.Group(); o.position.set(x, y, z); o.rotation.y = ry; g.add(o); o.add(new THREE.Mesh(new THREE.TorusGeometry(R, R * 0.07, 12, 48), brass)); for (let k = 0; k < 5; k++) { const s = c.slab(R * 2, R * 0.08, R * 0.08, brass, 0, 0, 0); s.rotation.z = k / 5 * PI; o.add(s); } return o; };
    const w1 = wheel(2.4, 3.2, -5.0, 1.5, 0.4), w2 = wheel(17.6, 3.0, -4.6, 1.3, -0.4);
    c.tick((t) => { w1.rotation.z = t * 0.1; w2.rotation.z = -t * 0.08; });
    [[3.6, -2.4], [16.4, -2.2], [10, -5.6], [6.4, 3.2], [13.6, 3.6]].forEach(([x, z]) => steam(c, g, x, 0.4, z));
    [[4, -5.6], [12, -5.6], [7, -2.2], [15, -2.2], [5, 1.8], [16, 1.8]].forEach(([x, z]) => steam(c, g, x, H_IN - 1.2, z));
    // plunge pools: a sardine tin and two soup cans, steaming
    const tin = std(c, 0xe0dcd4, { metalness: 0.55, roughness: 0.35 });
    const pool = (x, z, w, d) => { g.add(c.slab(w, 0.6, d, tin, x, 0.3, z)); const wt = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.2, d - 0.2), new THREE.MeshStandardMaterial({ color: 0x7fd8e0, roughness: 0.02, metalness: 0.3, transparent: true, opacity: 0.85 })); wt.rotation.x = -PI / 2; wt.position.set(x, 0.58, z); g.add(wt); c.wall(X(x - w / 2), z - d / 2, X(x + w / 2), z - d / 2); c.wall(X(x - w / 2), z + d / 2, X(x + w / 2), z + d / 2); c.wall(X(x - w / 2), z - d / 2, X(x - w / 2), z + d / 2); c.wall(X(x + w / 2), z - d / 2, X(x + w / 2), z + d / 2); };
    pool(6.0, -1.6, 3.6, 2.2); pool(14.0, -1.4, 3.0, 2.0);
    notice(c, g, 'SARDINES · IN OLIVE OIL · NOW A PLUNGE POOL', 6.0, 0.7, -0.48, 0, 2.6, 0.22, '#e8d8a8', '#1a1a1a');
    for (const [x, z] of [[5.2, -1.6], [7.0, -1.8], [14.0, -1.4]]) { const m = c.glb('rat', { len: 1.4, x, y: 0.35, z, ry: Math.random() * 6, parent: g, shadow: false }); const towel = c.slab(0.6, 0.12, 0.4, std(c, 0xffffff, { roughness: 0.95 }), x, 0.82, z); g.add(towel); }
    // the dial: seven scents, from breakfast to litigation
    const SC = [['FRESH BAGEL', 0xfff0d8, 'Notes of sesame, toasted, and a man saying you want it toasted? at a volume.'], ['WET PAVEMENT', 0xd8e4f0, 'After the rain on Second Avenue. Petrichor, plus something that was a pretzel.'], ['HALAL CART', 0xffe0b0, 'White sauce, red sauce, a cloud you can see from Sixth Avenue.'], ['THE 6 TRAIN IN AUGUST', 0xe8d0b0, 'Warm, close, intimate. Too intimate. Nobody asked for this level of wellness.'], ['HOT GARBAGE, LIGHTLY', 0xd8e0a0, 'A gentle top note of Tuesday night, set out on the curb in July.'], ['CON ED STEAM', 0xffffff, 'The house signature. Mineral, metallic, one hundred and five miles long.'], ['LAWSUIT', 0xffb0a8, 'Bold, litigious, notes of a settlement. That is not exfoliation. You are molting.']];
    const dial = new THREE.Group(); dial.position.set(10, 0, 2.2); g.add(dial);
    dial.add(c.slab(0.7, 1.2, 0.7, std(c, 0x2a2a30, { roughness: 0.3 }), 0, 0.6, 0)); c.post(X(10), 2.2, 0.5);
    const face = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32), new THREE.MeshStandardMaterial({ map: c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = '#f4ead2'; q.beginPath(); q.arc(w / 2, h / 2, w / 2, 0, 7); q.fill(); q.fillStyle = '#1a1a1a'; q.font = `800 13px ${c.MONO}`; q.textAlign = 'center'; SC.forEach(([n], i) => { const a = -PI * 0.75 + i / (SC.length - 1) * PI * 1.5; q.save(); q.translate(w / 2 + Math.sin(a) * 92, h / 2 - Math.cos(a) * 92); q.rotate(a); q.fillText(n.split(' ')[0], 0, 0); q.restore(); }); }), roughness: 0.4 }));
    face.position.y = 1.26; dial.add(face);
    const needle = c.slab(0.04, 0.03, 0.42, std(c, 0xc8102e), 0, 1.33, -0.2); const nd = new THREE.Group(); nd.position.y = 0; nd.add(needle); dial.add(nd);
    let sk = -1, mine = false;
    c.clickable(dial, () => { sk = (sk + 1) % SC.length; const [n, col, line] = SC[sk]; nd.rotation.y = -(-PI * 0.75 + sk / (SC.length - 1) * PI * 1.5); c.FX.tint = col; mine = true; c.sound.ding(); c.toast(`${n}. ${line}`, 4200); if (sk === SC.length - 1) c.egg('lawsuit', 'Seven scents, bagel to lawsuit. The spa calls it a journey. The city calls it an easement.'); }, 'The aromatherapy dial');
    c.tick((t, dt, P, ri) => { if (mine && !here(r, ri)) { mine = false; c.FX.tint = null; } });
  },

  // CITY HALL LOOP. The council debates reopening the 1904 station. Vote; the agenda returns to item one.
  cityhall(c, r, g, X) {
    const { THREE } = c;
    // Guastavino vault ribs in cream and green tile across the ceiling
    const tile = c.canvasTex(256, 64, (q, w, h) => { for (let x = 0; x < w; x += 16) for (let y = 0; y < h; y += 8) { q.fillStyle = ((x / 16 + y / 8) % 2) ? '#e8e0c8' : '#d8d0b4'; q.fillRect(x, y, 15, 7); } q.fillStyle = '#2a6a4a'; q.fillRect(0, 0, w, 6); q.fillRect(0, h - 6, w, 6); });
    for (const x of [3, 7, 10, 13, 17]) { const a = new THREE.Mesh(new THREE.TorusGeometry(D / 2 - 0.3, 0.22, 8, 48, PI), new THREE.MeshStandardMaterial({ map: tile, roughness: 0.4 })); a.rotation.y = PI / 2; a.position.set(x, H_IN - (D / 2 - 0.3) * 0.32, 0); a.scale.y = 0.32; g.add(a); }
    // the council: a matchbox podium, bottle cap seats in rows, rats in the seats
    const box = c.canvasTex(256, 128, (q, w, h) => { q.fillStyle = '#c8102e'; q.fillRect(0, 0, w, h); q.fillStyle = '#f4ead2'; q.font = `900 30px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('N3W MATCHES', w / 2, 56); q.font = `700 15px ${c.MONO}`; q.fillText('STRIKE ON BOX · SINCE 1904', w / 2, 90); q.fillStyle = '#4a2a1a'; q.fillRect(0, h - 16, w, 16); });
    const pod = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.3, 1.1), new THREE.MeshStandardMaterial({ map: box, roughness: 0.7 })); pod.position.set(10, 0.65, -4.4); g.add(pod); c.post(X(10), -4.4, 1.2);
    const chair = cast(c, r, g, X, 'sw_customs', 10, -5.4, { h: 1.7, y: 0, r: 0, line: 'Public comment is welcome after the public leaves.', egg: 'publiccomment', hint: 'The chair of the council' });
    for (let row = 0; row < 3; row++) for (let k = 0; k < 5; k++) { const x = 6 + k * 2, z = -1.6 + row * 1.6; const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 0.4, 21), std(c, [0xc8102e, 0xe8b62c, 0x1d4ed8, 0x0f7a3a][(row + k) % 4], { metalness: 0.8, roughness: 0.3 })); cap.position.set(x, 0.2, z); g.add(cap); if ((row * 5 + k) % 3 !== 1) c.glb('rat', { len: 1.4, x, y: 0.4, z, ry: PI, parent: g, shadow: false }); c.post(X(x), z, 0.45); }
    // the agenda, on the west wall
    const ag = board(c, g, 4.6, 2.8, 512); ag.m.position.set(0.4, 2.6, 1.2); ag.m.rotation.y = PI / 2;
    const ITEMS = ['Item 1: Reopen City Hall station (open 1904, closed 1945)', 'Item 2: Approve the minutes of item 1', 'Item 3: Discuss whether to discuss item 1', 'Item 4: Recess for crumbs', 'Item 5: New business (see item 1)'];
    let item = 0, votes = 0;
    const drawAG = () => { const { q, W: w, H: h } = ag; q.fillStyle = '#f4ead2'; q.fillRect(0, 0, w, h); q.fillStyle = '#2a6a4a'; q.fillRect(0, 0, w, h * 0.16); q.fillStyle = '#f4ead2'; q.font = `800 ${h * 0.08}px ${c.MONO}`; q.fillText('RAT COUNCIL · AGENDA · SESSION 29,104', 24, h * 0.11); q.font = `600 ${h * 0.06}px ${c.MONO}`; ITEMS.forEach((s, i) => { q.fillStyle = i === item ? '#c8102e' : '#1a1a1a'; q.fillText((i === item ? '> ' : '  ') + s, 24, h * (0.3 + i * 0.13)); }); q.fillStyle = '#1a1a1a'; q.fillText(`VOTES CAST TODAY: ${votes}`, 24, h * 0.95); ag.up(); };
    drawAG();
    const btn = new THREE.Group(); btn.position.set(4.6, 0, 3.6); g.add(btn);
    btn.add(c.slab(0.6, 1.0, 0.6, std(c, 0x2a2a2a, { roughness: 0.4 }), 0, 0.5, 0)); const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.12, 24), std(c, 0xc8a050, { metalness: 1, roughness: 0.25 })); cap.position.y = 1.06; btn.add(cap);
    notice(c, g, 'VOTE', 4.6, 1.35, 3.92, 0, 0.6, 0.2, '#1a1a1a', '#f5c542'); c.post(X(4.6), 3.6, 0.45);
    c.clickable(btn, () => {
      votes++; item++; cap.position.y = 1.02; setTimeout(() => (cap.position.y = 1.06), 180); c.sound.ding();
      if (item >= ITEMS.length) { item = 0; c.sound.thud && c.sound.thud(); c.shake(0.05); c.toast('Motion carried. The council returns to item one.', 3200); c.egg('agenda', 'Every vote passes and every agenda returns to item one. City Hall station closed in 1945 because its curve was too tight for longer trains. The council has been debating that curve ever since.'); }
      drawAG();
    }, 'Vote');
  },

  // THE BORDER. The bodega cat runs immigration and only sees you when you move.
  border(c, r, g, X) {
    const { THREE } = c;
    // the checkpoint: the cat on a tower of crates, a boom of coffee stirrers
    for (let k = 0; k < 6; k++) c.glb(k % 2 ? 'nyb_milkcrate_pink' : 'nyb_milkcrate_cyan', { h: 0.9, x: 9.0 + (k % 3) * 1.0, y: Math.floor(k / 3) * 0.9, z: -5.2, ry: k * 0.1, parent: g, shadow: k < 3 }); c.post(X(10), -5.2, 1.9);
    const cat = cast(c, r, g, X, 'sw_bodegacat', 10, -5.2, { h: 2.0, y: 1.8, r: 0, line: 'You are not banned. You are locally discouraged.', egg: 'discouraged', hint: 'The bodega cat' });
    const stir = (x1, x2, z) => { for (let x = x1; x < x2; x += 0.6) g.add(c.slab(0.6, 0.08, 0.08, std(c, (Math.round(x / 0.6) % 2) ? 0xc8102e : 0xf4ead2, { roughness: 0.5 }), x + 0.3, 1.0, z)); for (let x = x1; x <= x2; x += 2.4) g.add(c.slab(0.08, 1.0, 0.08, std(c, 0x8a6a4a), x, 0.5, z)); };
    stir(1.0, 8.6, -1.2); stir(11.4, 19.0, -1.2); c.wall(X(1.0), -1.2, X(8.6), -1.2); c.wall(X(11.4), -1.2, X(19.0), -1.2);
    notice(c, g, 'BORDER · DECLARE ALL CHEESE · MOVE AND YOU WILL BE SEEN', 10, 0.55, -1.18, 0, 3.2, 0.26, '#f5c542', '#111');
    // the eye: a lamp over the cat that wakes when you move
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), basic(c, 0x333333)); lamp.position.set(10, 4.6, -5.0); g.add(lamp);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,60,40,.9)'), transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending })); glow.position.copy(lamp.position); glow.scale.setScalar(1.6); glow.visible = false; g.add(glow);
    const meter = board(c, g, 2.4, 0.3, 128); meter.m.position.set(10, 5.0, -5.0);
    let seen = 0, last = { x: 0, z: 0 }, passed = false, caught = 0;
    const drawM = () => { const { q, W: w, H: h } = meter; q.fillStyle = '#111'; q.fillRect(0, 0, w, h); q.fillStyle = seen > 0.05 ? '#ff4a3a' : '#3a3a3a'; q.fillRect(4, 4, (w - 8) * Math.min(1, seen / 0.9), h - 8); q.fillStyle = '#f4ead2'; q.font = `700 ${h * 0.5}px ${c.MONO}`; q.fillText(seen > 0.05 ? 'SEEN' : 'NOT SEEN', 10, h * 0.68); meter.up(); };
    drawM();
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) return;
      const L = local(r, P), moved = Math.hypot(P.x - last.x, P.z - last.z) > 0.004; last.x = P.x; last.z = P.z;
      const inZone = L.z < 3.5 && L.z > -1.6;
      if (inZone && moved) { seen += dt; c.sound.meow && Math.random() < 0.004 && c.sound.meow(); } else seen = Math.max(0, seen - dt * 0.6);
      glow.visible = seen > 0.05; lamp.material.color.set(seen > 0.05 ? 0xff3a2a : 0x333333); drawM();
      if (seen > 0.9) { seen = 0; caught++; c.P.z = 5.4; c.P.x = r.x0 + 10; c.sound.meow && c.sound.meow(); c.shake(0.06); c.say(cat, caught > 2 ? 'Again? You are now internationally discouraged.' : 'You are not banned. You are locally discouraged.', 3000, 4.2); }
      if (L.z < -2.2 && !passed) { passed = true; c.egg('border', 'You crossed the bodega border by moving only when the cat was not looking, which is how every New Yorker gets through every bodega. Declared: one human at rat scale. Confiscated: your confidence.'); }
    });
    // the receipt road, unspooled across the floor
    const rc = c.canvasTex(128, 1024, (q, w, h) => { q.fillStyle = '#f8f6f0'; q.fillRect(0, 0, w, h); q.fillStyle = '#333'; q.font = `600 11px ${c.MONO}`; ['BACON EGG CHEESE 5.50', 'ROLL BUTTER 1.75', 'COFFEE LIGHT SWEET 1.50', 'CAT FOOD (FOR CAT) 0.00', 'CAT FOOD (FOR ME) 2.25', 'LOTTO 2.00', 'CREDIT MIN $10', 'THANK YOU PAPI', 'BACON EGG CHEESE 5.50', 'AGAIN TOMORROW'].forEach((s, i) => q.fillText(s, 8, 40 + i * 96)); });
    const rec = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 9), new THREE.MeshStandardMaterial({ map: rc, roughness: 0.9 })); rec.rotation.x = -PI / 2; rec.rotation.z = 0.25; rec.position.set(13.2, 0.012, 3.0); g.add(rec);
    c.clickable(rec, () => c.egg('receipt', 'Credit card minimum ten dollars. For a rat, ten cents. For the cat, everything is free and always has been.'), 'A receipt as long as a street');
    scurry(c, g, 3, { x1: 3, x2: 17, z1: 3, z2: 6 });
  },

  // THE THRONE. The sewer king rents his throne by the minute. Use the plunger; you go up one problem.
  throne(c, r, g, X) {
    const { THREE } = c;
    shaft(c, g, 10, -1, 1.1, 28);
    // the dais: gold coins, instanced, in a heap
    const N = 420, coin = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.16, 0.035, 18), std(c, 0xd8b050, { metalness: 1, roughness: 0.25 }), N), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e = new THREE.Euler();
    for (let i = 0; i < N; i++) { const a = Math.random() * PI * 2, d = Math.sqrt(Math.random()) * 3.0, y = Math.max(0, (1 - d / 3.0) * 0.9) * Math.random() + 0.02; e.set((Math.random() - 0.5) * 1.2, Math.random() * 6, (Math.random() - 0.5) * 1.2); q4.setFromEuler(e); m4.compose(new THREE.Vector3(10 + Math.cos(a) * d * 1.3, y, -5.0 + Math.sin(a) * d * 0.6), q4, new THREE.Vector3(1, 1, 1)); coin.setMatrixAt(i, m4); }
    g.add(coin);
    toilet(c, g, 10, -5.2, 2.6, 0); c.post(X(10), -5.0, 1.4);
    const king = cast(c, r, g, X, 'sw_king', 10, -4.9, { h: 1.7, y: 1.12, r: 0, line: 'I do not own the sewer. I own the minute you are sitting in it. That will be three dollars.', egg: 'king', hint: 'The sewer king' });
    const crown = c.sign('THE THRONE · $3 A MINUTE · NO REFUNDS · NO EXCEPTIONS · NO CHANGE', { w: 6.4, h: 0.4, bg: null, fg: '#f5c542', font: c.SERIF, weight: 900, glow: 10 }); crown.position.set(10, 5.4, -6.4); g.add(crown);
    // the plunger lever: pull it and you go up the shaft, one problem higher
    const lever = new THREE.Group(); lever.position.set(14.6, 0, 1.2); g.add(lever);
    lever.add(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.2, 14), std(c, 0x8a5a2a, { roughness: 0.6 })).translateY(1.1));
    const cup = new THREE.Mesh(new THREE.SphereGeometry(0.6, 24, 16, 0, PI * 2, 0, PI / 2), std(c, 0xb81e1e, { roughness: 0.35 })); cup.rotation.x = PI; cup.position.y = 0.02; lever.add(cup);
    c.post(X(14.6), 1.2, 0.6);
    let up = false;
    c.clickable(lever, () => {
      if (up) return; up = true; c.sound.whoosh && c.sound.whoosh(); c.flash(0.3);
      const P = c.P, a = new c.THREE.Vector3(P.x, P.y, P.z), b = new c.THREE.Vector3(X(10), 9, -1), d = new c.THREE.Vector3(X(10), 25, -1);
      c.ride(new c.THREE.CatmullRomCurve3([a, new c.THREE.Vector3(X(12), 2.2, 0.4), b, d]), 5.2, () => { c.flash(1); c.toast('Congratulations. You have moved up one problem. Rent is due on the next one.', 4600); c.egg('upandout', 'Flushed upward and out of the manhole on First Avenue, at human size again, with a story nobody will believe. That is the whole tour. Walk back down any time; the king charges by the minute.'); P.x = X(10); P.z = 3.4; P.y = c.EYE; P.yaw = 0; up = false; });
    }, 'Pull the plunger');
    notice(c, g, 'UP AND OUT · ONE PULL · ONE PROBLEM HIGHER', 14.6, 2.6, 1.2, 0, 2.8, 0.28, '#1a1a1a', '#f5c542');
    // lease notices and the rats queuing to sit for a minute
    for (let k = 0; k < 5; k++) { c.glb('rat', { len: 1.5, x: 3.4 + k * 1.2, z: -1.4 - k * 0.35, ry: -0.6, parent: g }); }
  },
};
