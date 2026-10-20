// ON RECORD, room by room. Every sign, sleeve and label is a NEW YORKERS brand, and every member of the cast has an
// eye flower for a head: the places are New York's, the records are their makers', the people are ours.
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { W, D, H_IN, PORTAL } from './rooms.js';

const PI = Math.PI;
const INK = ['#ff4fa3', '#22d3ee', '#f5c542', '#3b82f6', '#ffffff', '#ff7a1a'];
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
  r.cast.forEach((p, k) => { const s = slots[k]; if (!s) return; c.hang(p, s.x, s.y, s.z, s.ry, s.w || 1.3, r.frame, g); });

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
  m.ceil = r.ceil ? c.surf(r.ceil, 3, 0x5a5650) : null;
  if ((window.WALLS || []).includes(r.id)) {
    const t = c.tex.load(`assets/walls/${r.id}.jpg`); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8;
    m.wall = new THREE.MeshStandardMaterial({ map: t, roughness: 0.82, color: r.muralTint || 0xffffff });
    m.wall.userData.repX = 10; m.wall.userData.repY = r.outdoor ? (r.low ? 4 : 10) : H_IN;
  }
  else if (r.outdoor) m.wall = c.surf('brick', 2.4, 0x6e6660);
  else m.wall = c.surf(r.wall, 2.4, r.wallTint);
  if (r.id === 'factory') { m.wall = foil(c); m.ceil = foil(c); }
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

// ---------- the shared furniture: a record label for a slate, a crate and a monitor, a rope ----------
// The slate: every room carries the label of a record, its side and track, and what it is.
function slate(c, r, g) {
  const board = decal(c, 1.3, 1.3, (q, w, h) => {
    q.fillStyle = '#0d0d0d'; q.beginPath(); q.arc(w / 2, h / 2, w / 2, 0, 7); q.fill();
    q.strokeStyle = 'rgba(255,255,255,.06)'; q.lineWidth = 1.2; for (let k = w * 0.2; k < w / 2; k += 3) { q.beginPath(); q.arc(w / 2, h / 2, k, 0, 7); q.stroke(); }
    q.fillStyle = INK[r.i % INK.length]; q.beginPath(); q.arc(w / 2, h / 2, w * 0.19, 0, 7); q.fill();
    q.fillStyle = '#0d0d0d'; q.textAlign = 'center'; q.font = `800 ${w * 0.03}px ${c.MONO}`;
    q.fillText(`ON RECORD · SIDE ${r.i < 6 ? 'A' : 'B'} · TRACK ${r.i + 1}`, w / 2, h / 2 - w * 0.1);
    q.font = `900 ${w * 0.034}px ${c.SERIF}`; const lines = (r.film || '').split(', ');
    q.fillText(lines[0].slice(0, 30), w / 2, h / 2 + w * 0.085); q.font = `700 ${w * 0.03}px ${c.MONO}`; q.fillText(lines[1] || 'MLow', w / 2, h / 2 + w * 0.125);
    q.fillStyle = '#f4ead2'; q.beginPath(); q.arc(w / 2, h / 2, w * 0.018, 0, 7); q.fill();
  }, 512);
  board.position.set(W / 2 - PORTAL.w / 2 - 1.0, r.low ? 1.1 : 1.8, -D / 2 + 0.03);
  g.add(board);
  c.tick((t, dt, P, ri) => { if (ri === r.i) board.rotation.z -= dt * 0.35; });
}

// every room has a wedge monitor and a crate of records by the far door: the house always brings its own
function dressing(c, r, g, X) {
  const { THREE } = c, black = std(c, 0x151515, { roughness: 0.7 }), grill = std(c, 0x2a2a2a, { roughness: 0.9, metalness: 0.3 });
  const mon = new THREE.Group(); mon.position.set(W - 1.6, 0, D / 2 - 1.3); mon.rotation.y = -2.5; g.add(mon);
  const box = c.slab(0.9, 0.5, 0.6, black, 0, 0.25, 0); box.rotation.x = -0.35; mon.add(box);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), grill); face.position.set(0, 0.31, 0.27); face.rotation.x = -0.35; mon.add(face);
  const eye = decal(c, 0.22, 0.22, (q, w, h) => eyeFlower(q, w / 2, h / 2, w / 2 * 0.95)); eye.position.set(0.28, 0.4, 0.3); eye.rotation.x = -0.35; mon.add(eye);
  c.post(X(W - 1.6), D / 2 - 1.3, 0.5);
  const crate = new THREE.Group(); crate.position.set(W - 3.0, 0, D / 2 - 0.7); g.add(crate);
  crate.add(c.slab(0.5, 0.36, 0.38, std(c, 0x1c4fd8, { roughness: 0.5 }), 0, 0.18, 0));
  for (let k = 0; k < 9; k++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.31), new THREE.MeshStandardMaterial({ map: sleeveTex(c, r.i * 13 + k), roughness: 0.6 })); s.position.set(-0.2 + k * 0.05, 0.42, 0); s.rotation.set(-0.12, Math.PI / 2, 0); crate.add(s); }
  c.post(X(W - 3.0), D / 2 - 0.7, 0.35);
}

// a velvet rope a step in front of the photograph: plates are made to be seen from the room
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
  const q = c.sign('THE PHOTOGRAPH STARTS HERE', { w: 1.9, h: 0.2, bg: '#111', fg: '#f5c542', font: c.MONO, weight: 700 }); q.position.set(W / 2, 0.82, z + 0.04); g.add(q);
}

// a record sleeve: never a real cover, always a NEW YORKERS one. Seeded, so every crate is different and stable.
const SLEEVE_NAMES = ['COUNTED LIVE', 'SIDE A', 'THE STOOP TAPES', 'N3W WAVE', 'BODEGA SESSIONS', 'EYE FLOWER', 'LAST TRAIN', 'THE CENSUS', 'NAZAR', 'MLOW', 'FIVE BOROUGHS', 'THE BREAK', 'UPTOWN', 'DOWNTOWN', 'NIGHT SHIFT', 'STEAM', 'DELI', 'SECOND AVE', 'THE COUNT', 'ROOFTOP'];
const _SLV = {};
function sleeveTex(c, seed) {
  const k = seed % 24; if (_SLV[k]) return _SLV[k];
  let s = k * 9301 + 49297; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  return (_SLV[k] = c.canvasTex(128, 128, (q, w, h) => {
    q.fillStyle = INK[k % INK.length]; q.fillRect(0, 0, w, h);
    const st = k % 4;
    if (st === 0) eyeFlower(q, w / 2, h / 2 - 6, 40);
    if (st === 1) { for (let i = 0; i < 6; i++) { q.fillStyle = i % 2 ? '#0d0d0d' : '#f4ead2'; q.fillRect(0, i * 22, w, 11); } eyeFlower(q, w * 0.7, h * 0.35, 22); }
    if (st === 2) { q.fillStyle = '#0d0d0d'; for (let i = 0; i < 5; i++) { const x = rnd() * w, y = rnd() * h; q.beginPath(); q.arc(x, y, 8 + rnd() * 24, 0, 7); q.fill(); } }
    if (st === 3) { q.fillStyle = '#0d0d0d'; q.fillRect(10, 10, w - 20, h - 20); eyeFlower(q, w / 2, h / 2, 30, '#fbe6f0', INK[(k + 2) % 6]); }
    q.fillStyle = '#0d0d0d'; q.font = `900 13px ${c.MONO}`; q.textAlign = 'left'; q.fillText(SLEEVE_NAMES[k % SLEEVE_NAMES.length], 8, h - 10);
  }));
}
// the silver loft's foil: a crumpled bump on chrome
let _FOIL;
function foil(c) {
  if (_FOIL) return _FOIL;
  const b = c.canvasTex(512, 512, (q, w, h) => { q.fillStyle = '#808080'; q.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { const x = Math.random() * w, y = Math.random() * h, s = 6 + Math.random() * 40; q.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '0,0,0'},${0.05 + Math.random() * 0.12})`; q.beginPath(); q.moveTo(x, y); q.lineTo(x + s, y + Math.random() * s); q.lineTo(x + Math.random() * s, y + s); q.fill(); } });
  b.wrapS = b.wrapT = c.THREE.RepeatWrapping; b.repeat.set(4, 2); b.colorSpace = c.THREE.NoColorSpace;
  _FOIL = new c.THREE.MeshStandardMaterial({ color: 0xdfe3ea, metalness: 1, roughness: 0.22, bumpMap: b, bumpScale: 2.2 }); _FOIL.userData.rep = 4;
  return _FOIL;
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
