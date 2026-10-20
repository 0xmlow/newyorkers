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
const PROPS = {
  lobby: [
    ['CashRegister_01', 17.2, -6.3, { h: 0.4, y: 1.05, ry: 0.3, egg: ['The till', 'till', 'Cash only. The till has one button and it says COUNTED.'], snd: 'ticket' }],
    ['portable_cassette_player', 2.4, -6.2, { len: 0.35, y: 0.9, ry: 0.4 }], ['potted_plant_02', 0.9, 6.9, { h: 1.4, r: 0.4 }], ['potted_plant_02', 19.1, 6.9, { h: 1.4, r: 0.4 }],
    ['modern_ceiling_lamp_01', 5, -2, { h: 0.6, y: 5.3 }], ['modern_ceiling_lamp_01', 15, -2, { h: 0.6, y: 5.3 }],
  ],
  jones: [
    ['street_lamp_01', 1.4, -5.6, { h: 4.6, r: 0.25 }], ['street_lamp_01', 18.6, -5.6, { h: 4.6, r: 0.25 }], ['fire_hydrant', 16.4, -3.6, { h: 0.85, r: 0.3 }],
    ['metal_trash_can', 3.2, -6.4, { h: 0.95, r: 0.35, egg: ['A frozen can', 'snowcan', 'Even the trash is cold. It is February on Jones Street and it always will be.'] }],
    ['vintage_suitcase', 15.6, -6.6, { len: 0.7, ry: 0.4 }],
  ],
  stmarks: [
    ['metal_trash_can', 1.4, -5.2, { h: 0.95, r: 0.35 }], ['metal_trash_can', 2.1, -5.6, { h: 0.95, r: 0.35 }], ['fire_hydrant', 18.4, -6.2, { h: 0.85, r: 0.3 }],
    ['plastic_crate_01', 17.8, -1.2, { h: 0.32, r: 0.35, egg: ['A crate of sleeves', 'cutout', 'Die cut sleeves. Every window a hole, every hole a tenant. Somebody had a long night with a scalpel.'] }],
  ],
  ludlow: [
    ['fire_hydrant', 2.2, -5.2, { h: 0.85, r: 0.3 }], ['metal_trash_can', 18.6, -5.8, { h: 0.95, r: 0.35 }], ['street_lamp_02', 18.8, 0.8, { h: 4.4, r: 0.25 }],
    ['plastic_crate_01', 1.4, -1.0, { h: 0.32, r: 0.35 }], ['plastic_crate_01', 1.4, -1.0, { h: 0.32, y: 0.33, ry: 0.4 }], ['bananas', 1.4, -1.0, { len: 0.3, y: 0.66 }],
  ],
  factory: [
    ['Sofa_01', 6.0, -3.8, { len: 2.2, ry: 0.2, r: 0.9, egg: ['The red couch', 'couch', 'The couch everybody sat on. It has seen more screen tests than any person alive.'] }],
    ['vintage_video_camera', 15.2, -1.0, { h: 0.6, y: 1.25, ry: Math.PI * 0.85 }], ['ladder_sectioned_01', 19.3, -6.6, { h: 3.2, ry: -Math.PI / 2 }],
    ['spray_paint_bottles', 2.2, -6.6, { len: 0.35 }], ['WoodenTable_02', 2.6, -6.2, { len: 1.4, r: 0.6 }],
  ],
  cbgb: [
    ['bar_chair_round_01', 17.2, -3.6, { h: 0.8, r: 0.25 }], ['bar_chair_round_01', 17.2, -1.8, { h: 0.8, r: 0.25 }], ['bar_chair_round_01', 17.2, 0.0, { h: 0.8, r: 0.25 }],
    ['wine_bottles_01', 18.9, -2.4, { h: 0.35, y: 1.1 }], ['caged_hanging_light', 6, 0, { h: 0.5, y: 5.0 }], ['caged_hanging_light', 14, 0, { h: 0.5, y: 5.0 }],
  ],
  sedgwick: [
    ['plastic_monobloc_chair_01', 1.0, -5.5, { h: 0.8, ry: Math.PI / 2, r: 0.3 }], ['plastic_monobloc_chair_01', 1.0, -3.8, { h: 0.8, ry: Math.PI / 2, r: 0.3 }],
    ['plastic_monobloc_chair_01', 19.0, -5.5, { h: 0.8, ry: -Math.PI / 2, r: 0.3 }], ['plastic_monobloc_chair_01', 19.0, -3.8, { h: 0.8, ry: -Math.PI / 2, r: 0.3 }],
    ['plastic_crate_02', 13.6, -6.4, { h: 0.4, r: 0.35, egg: ['A crate of breaks', 'breaks', 'Every record in here has the same thing in common: a few seconds where only the drums play. That is the whole idea.'] }],
    ['mounted_fluorescent_lights', 6, 0, { len: 1.3, y: 5.85 }], ['mounted_fluorescent_lights', 14, 0, { len: 1.3, y: 5.85 }],
  ],
  harlem: [
    ['street_lamp_01', 1.2, -1.0, { h: 4.6, r: 0.25 }], ['street_lamp_01', 18.8, -1.0, { h: 4.6, r: 0.25 }], ['fire_hydrant', 17.4, 1.0, { h: 0.85, r: 0.3 }],
    ['Camera_01', 11.4, 5.4, { h: 0.25, y: 1.32, ry: Math.PI * 0.95, egg: ['The camera', 'kane', 'A borrowed camera, a magazine assignment, a Tuesday morning. Nobody thought this many would come.'] }],
  ],
  vanguard: [
    ['wine_bottles_01', 3.6, 6.6, { h: 0.35, y: 1.1 }], ['vintage_telephone_wall_clock', 0.2, 6.6, { h: 0.6, y: 2.2, ry: Math.PI / 2 }],
  ],
  apollo: [
    ['Megaphone_01', 18.2, -2.4, { len: 0.45, y: 1.0, ry: -1.2 }], ['WoodenChair_01', 17.8, 1.0, { h: 0.95, ry: -2.0, r: 0.35 }],
  ],
  chelsea: [
    ['GreenChair_01', 3.4, -3.2, { h: 0.9, ry: 0.8, r: 0.45 }], ['GreenChair_01', 5.0, -4.4, { h: 0.9, ry: 0.2, r: 0.45 }], ['vintage_suitcase', 4.4, 0.4, { len: 0.7, ry: 0.3 }],
    ['vintage_telephone_wall_clock', 19.8, -2.4, { h: 0.6, y: 2.4, ry: -Math.PI / 2 }],
    ['vintage_suitcase', 18.4, -6.2, { len: 0.7, ry: 1.0, egg: ['A suitcase full of manuscripts', 'manuscript', 'A novel, three plays and a song, left as a deposit in 1966. The hotel kept them. The hotel keeps everything.'] }],
  ],
};

// ---------- hanging plans ----------
function slotsDefault() {
  const S = [], south = D / 2 - 0.14;
  for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 2.1, z: south, ry: PI, w: 1.5 });
  [-6.6, -4.2, -1.8].forEach((z) => S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 }));
  [-4.2, -1.8].forEach((z) => S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 }));
  return S;
}
const SLOTS = {
  // the Vanguard's side walls are behind the wedge: everything hangs on the back wall and the wedge itself
  vanguard: () => { const S = [], south = D / 2 - 0.14; for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 2.4, z: south, ry: PI, w: 1.4 });
    for (const k of [0.25, 0.5, 0.75]) { const [ax, az, bx, bz] = WEDGE.L, x = ax + (bx - ax) * k, z = az + (bz - az) * k, a = Math.atan2(bx - ax, bz - az); S.push({ x: x + 0.12, y: 2.2, z, ry: a + PI / 2, w: 1.1 }); }
    for (const k of [0.3, 0.6]) { const [ax, az, bx, bz] = WEDGE.R, x = ax + (bx - ax) * k, z = az + (bz - az) * k, a = Math.atan2(bx - ax, bz - az); S.push({ x: x - 0.12, y: 2.2, z, ry: a - PI / 2, w: 1.1 }); }
    return S; },
  // the hotel took paintings for rent: a salon hang, two rows on every wall
  chelsea: () => { const S = [], south = D / 2 - 0.14; for (let i = 0; i < 6; i++) S.push({ x: 2.4 + i * 3.04, y: 1.9, z: south, ry: PI, w: 1.5 }); for (let i = 0; i < 6; i++) S.push({ x: 2.4 + i * 3.04 + 1.0, y: 3.8, z: south, ry: PI, w: 1.2 }); return S; },
};
const WEDGE = { L: [1.2, 1.2, 5.6, -7.6], R: [18.8, 1.2, 14.4, -7.6] };

// ---------- the rooms ----------
const V3 = (c, x, y, z) => new c.THREE.Vector3(x, y, z);
const ROOM = {
  // THE RECORD STORE. The floor in the middle is a turntable the size of a bedroom: step on and the store turns.
  lobby(c, r, g, X) {
    const { THREE } = c;
    const neon = c.sign('ON RECORD', { w: 6, h: 1.1, bg: null, fg: '#ff4fa3', font: c.SERIF, weight: 900, glow: 26 });
    neon.position.set(W / 2, PORTAL.h + 0.75, -D / 2 + 0.06); g.add(neon);
    const sub = c.sign('NEW YORK ON WAX · RECORDS · TAPES · NO REFUNDS', { w: 6.4, h: 0.3, bg: null, fg: '#22d3ee', font: c.MONO, weight: 700, glow: 12 }); sub.position.set(W / 2, PORTAL.h + 0.12, -D / 2 + 0.06); g.add(sub);
    // the bins: two islands of crates, sleeves leaning back, every one a NEW YORKERS record
    const wood = std(c, 0x5a3a1e, { roughness: 0.7 });
    const bin = (x0, z0, n) => { for (let k = 0; k < n; k++) { const bx = x0 + k * 1.05; g.add(c.slab(1.0, 0.8, 0.7, wood, bx, 0.4, z0));
      for (let s = 0; s < 7; s++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.31), new THREE.MeshStandardMaterial({ map: sleeveTex(c, k * 7 + s + n), roughness: 0.6 })); m.position.set(bx - 0.36 + s * 0.12, 0.95, z0); m.rotation.set(0, PI / 2, 0.25); m.rotation.order = 'YXZ'; g.add(m); }
      c.post(X(bx), z0, 0.55); } };
    bin(2.6, -3.0, 3); bin(14.3, -3.0, 3);
    const dig = c.slab(3.2, 0.9, 0.8, new THREE.MeshBasicMaterial({ visible: false }), 2.6 + 1.05, 0.45, -3.0); g.add(dig);
    c.clickable(dig, () => { c.sound.tick(); c.egg('dig', 'Crate digging. Somewhere in this bin is the record that changes your life, filed under the wrong letter.'); }, 'Dig the crates');
    // the counter and the clerk who has heard of everything
    g.add(c.slab(4.4, 1.05, 0.9, std(c, 0x1a1a1a), 17.0, 0.52, -6.4)); c.wall(X(14.8), -5.9, X(19.9), -5.9);
    cast(c, r, g, X, 'prince', 18.2, -7.2, { h: 1.75, ry: 0.2, rad: 0, line: 'We do not have it. We never had it. Try the bin by the door, it is filed under the wrong letter.', egg: 'clerk', hint: 'The clerk' });
    // MLOWTAR picks your next record
    const ml = cast(c, r, g, X, 'mlowtar', 1.6, -6.4, { h: 2.2, ry: 0.5, rad: 0.55 });
    const picks = ['Jones Street, side A. Bring a coat.', 'The Bowery. Earplugs are for tourists.', 'The rec room on Sedgwick. Keep the break going.', 'East 126th. Hold still for the picture.', 'The Vanguard. Walk to the point of the room.', 'The Apollo. Rub the tree first. Trust me.'];
    c.clickable(ml, () => { c.say(ml, 'MLOWTAR SAYS: ' + picks[(Math.random() * picks.length) | 0], 4200, 2.5); c.egg('mlowtar'); c.sound.ding(); }, 'MLOWTAR picks your record');
    // the platter: a turntable you stand on. Inside its circle you turn with it, at a gentle 3 rpm.
    const PX = 10, PZ = 1.2, R = 2.7;
    const plat = new THREE.Group(); plat.position.set(PX, 0, PZ); g.add(plat);
    plat.add(new THREE.Mesh(new THREE.CylinderGeometry(R + 0.25, R + 0.3, 0.1, 64), std(c, 0x9aa0a8, { metalness: 0.9, roughness: 0.35 }))).position.y = 0.05;
    const vinyl = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.04, 96), new THREE.MeshStandardMaterial({ map: c.canvasTex(1024, 1024, (q, w, h) => {
      q.fillStyle = '#0b0b0d'; q.fillRect(0, 0, w, h); for (let k = w * 0.16; k < w / 2; k += 2.2) { q.strokeStyle = `rgba(255,255,255,${0.025 + Math.random() * 0.03})`; q.beginPath(); q.arc(w / 2, h / 2, k, 0, 7); q.stroke(); }
      q.fillStyle = '#ff4fa3'; q.beginPath(); q.arc(w / 2, h / 2, w * 0.15, 0, 7); q.fill(); eyeFlower(q, w / 2, h / 2, w * 0.1);
      q.fillStyle = '#0d0d0d'; q.font = `900 ${w * 0.026}px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('N3W YORKERS · 33 1/3', w / 2, h / 2 + w * 0.125); }), roughness: 0.25, metalness: 0.2 }));
    vinyl.position.y = 0.12; plat.add(vinyl);
    // the tone arm, which swings in when somebody steps on
    const arm = new THREE.Group(); arm.position.set(PX + R + 0.9, 0, PZ - R + 0.2); g.add(arm);
    arm.add(c.slab(0.5, 0.5, 0.5, std(c, 0x222222, { metalness: 0.8 }), 0, 0.25, 0));
    const tube = c.slab(0.08, 0.08, 3.1, std(c, 0xd8d8d8, { metalness: 1, roughness: 0.2 }), 0, 0.55, -1.5); const pivot = new THREE.Group(); pivot.position.y = 0; arm.add(pivot); pivot.add(tube);
    const head = c.slab(0.18, 0.12, 0.3, std(c, 0x111111), 0, 0.5, -3.05); pivot.add(head); c.post(X(PX + R + 0.9), PZ - R + 0.2, 0.4);
    let rode = 0, onP = false, swing = 0.9;
    r.move = (P, nx, nz, dt) => {
      const lx = nx - r.x0 - PX, lz = nz - PZ;
      if (Math.hypot(lx, lz) < R - 0.1) { const w = 0.32 * dt, cs = Math.cos(w), sn = Math.sin(w); P.yaw += w; return [r.x0 + PX + lx * cs + lz * sn, PZ - lx * sn + lz * cs]; }
      return [nx, nz];
    };
    c.tick((t, dt, P, ri) => {
      vinyl.rotation.y += dt * 0.32;
      if (ri !== r.i) return;
      onP = Math.hypot(P.x - r.x0 - PX, P.z - PZ) < R - 0.1;
      swing += ((onP ? 0.35 : 0.9) - swing) * Math.min(1, dt * 1.5); pivot.rotation.y = swing;
      if (onP) { rode += dt; if (rode > 9) { rode = -1e9; c.egg('platter', 'You did a full turn on the record. The whole store went round you at 33 and a third, divided by ten. Drop the needle anywhere.'); } }
    });
    // listening booth on the west wall: a pair of headphones on a hook
    const hp = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 8, 24, PI), std(c, 0x111111)); hp.position.set(0.25, 1.7, -3.6); hp.rotation.y = PI / 2; g.add(hp);
    for (const s of [-1, 1]) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 16), std(c, 0xff4fa3)); cup.rotation.z = PI / 2; cup.position.set(0.25, 1.56, -3.6 + s * 0.16); cup.rotation.y = PI / 2; g.add(cup); }
    const booth = c.sign('LISTENING BOOTH', { w: 1.4, h: 0.22, bg: '#0d0d0d', fg: '#22d3ee', font: c.MONO, weight: 700 }); booth.position.set(0.15, 2.3, -3.6); booth.rotation.y = PI / 2; g.add(booth);
    c.clickable(hp, () => { c.music.level(1.6); setTimeout(() => c.music.level(1), 5000); c.egg('booth', 'Headphones on. The store goes quiet and the record gets loud. Every room in here has its own song, and none of them was ever recorded.'); }, 'Put the headphones on');
    c.tick((t, dt, P, ri) => { neon.material.opacity = ri === r.i && Math.sin(t * 13) > 0.97 ? 0.4 : 1; neon.material.transparent = true; });
  },

  // JONES STREET, 1963. Snow, a couple arm in arm, and a photographer's mark. Stand on it, face the street, hold still.
  jones(c, r, g, X) {
    const { THREE } = c;
    // snow: a few thousand flakes falling through the room, frozen while the picture is taken
    const N = c.MOBILE ? 700 : 1800, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { pos[i * 3] = Math.random() * W; pos[i * 3 + 1] = Math.random() * 9; pos[i * 3 + 2] = -D / 2 + Math.random() * D; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const flakes = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.06, map: glowTex(c, 'rgba(255,255,255,.9)'), transparent: true, depthWrite: false, color: 0xffffff }));
    g.add(flakes);
    // snow banks along the curbs
    const snow = std(c, 0xf2f4f8, { roughness: 0.9 });
    for (const [x, z, w, d] of [[1.2, -2, 1.6, 9], [18.8, -2, 1.6, 9]]) { const b = c.slab(w, 0.22, d, snow, x, 0.11, z); b.scale.y = 1; g.add(b); }
    // parked cars of the day, a coat of snow on each roof
    c.glb('checker', { len: 4.8, x: 2.0, z: -3.2, ry: PI / 2, parent: g }); c.wall(X(1.1), -5.6, X(2.9), -5.6); c.wall(X(1.1), -0.8, X(2.9), -0.8); c.wall(X(2.9), -5.6, X(2.9), -0.8);
    c.glb('sedan', { len: 4.8, x: 18.0, z: -3.0, ry: -PI / 2, parent: g }); c.wall(X(17.1), -5.4, X(18.9), -5.4); c.wall(X(17.1), -0.6, X(18.9), -0.6); c.wall(X(17.1), -5.4, X(17.1), -0.6);
    // the couple, walking toward you forever and never arriving
    const cp = cast(c, r, g, X, 'waltzers', 10, -5.2, { h: 1.8, ry: 0, rad: 0.6, line: 'It was so cold. She held on to his arm and the photographer said keep walking. We are still walking.', egg: 'couple', hint: 'The couple' });
    c.tick((t, dt, P, ri) => { if (ri === r.i && !frozen) cp.position.y = Math.abs(Math.sin(t * 3.2)) * 0.04; });
    cast(c, r, g, X, 'folksinger', 16.4, 6.6, { h: 1.35, ry: -2.6, rad: 0.5, line: 'Four songs about the snow and one about the man who owns the snow. He is not going to like that one.', egg: 'busker', hint: 'The busker' });
    // the photographer's mark
    const mk = decal(c, 0.9, 0.9, (q, w, h) => { q.fillStyle = '#f5c542'; q.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2 - PI / 2, rr = i % 2 ? w * 0.2 : w * 0.48; q.lineTo(w / 2 + Math.cos(a) * rr, h / 2 + Math.sin(a) * rr); } q.fill(); q.fillStyle = '#0d0d0d'; q.font = `800 ${w * 0.08}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('CAMERA', w / 2, h / 2 + 4); });
    mk.rotation.x = -PI / 2; mk.position.set(10, 0.02, 3.6); g.add(mk);
    // the square: a sleeve shaped window over the screen, black all round
    const sq = document.createElement('div'); sq.style.cssText = 'position:fixed;left:50%;top:50%;width:min(82vw,82vh);height:min(82vw,82vh);transform:translate(-50%,-50%);box-shadow:0 0 0 200vmax rgba(0,0,0,.92);pointer-events:none;z-index:8;opacity:0;transition:opacity .5s;outline:2px solid rgba(255,255,255,.2)';
    document.body.appendChild(sq);
    let still = 0, frozen = false, last = [0, 0], took = false;
    const fw = new THREE.Vector3();
    // the companion: once you have walked a little on Jones Street, a girl in a green coat falls into step at your right
    const her = extra(c, g, 11, 6, { col: 0x2e5a3c }); her.visible = false; let walked = 0, armT = 0;
    c.tick((t, dt, P, ri) => {
      const here = ri === r.i;
      if (!here) { sq.style.opacity = 0; still = 0; frozen = false; her.visible = false; walked = 0; return; }
      const mv = Math.hypot(P.x - last[0], P.z - last[1]); last = [P.x, P.z];
      c.camera.getWorldDirection(fw);
      const onMark = Math.hypot(P.x - r.x0 - 10, P.z - 3.6) < 0.55 && fw.z < -0.9;
      still = onMark && mv < 0.004 ? still + dt : 0;
      const want = still > 1.2; if (want !== frozen) { frozen = want; sq.style.opacity = want ? 1 : 0; if (want) { c.sound.tick(); setTimeout(() => { c.sound.tick(); c.flash(0.8); }, 140); if (!took) { took = true; c.egg('cover', 'Click. A square, a street, two people and a lot of snow. That is the whole record sleeve. You just took it.'); } } }
      if (!frozen) { const p = geo.attributes.position.array; for (let i = 0; i < N; i++) { p[i * 3 + 1] -= dt * (0.6 + (i % 7) * 0.08); p[i * 3] += Math.sin(t + i) * dt * 0.1; if (p[i * 3 + 1] < 0) p[i * 3 + 1] = 9; } geo.attributes.position.needsUpdate = true; }
      walked += mv; if (walked > 6 && !frozen) {
        her.visible = true; const rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
        her.position.x += (P.x - r.x0 + rx * 0.62 - her.position.x) * Math.min(1, dt * 5); her.position.z += (P.z + rz * 0.62 - her.position.z) * Math.min(1, dt * 5);
        her.rotation.y = P.yaw; her.position.y = Math.abs(Math.sin(t * 6)) * 0.03 * (mv > 0.003 ? 1 : 0);
        if (mv > 0.003) { armT += dt; if (armT > 8) { armT = -1e9; c.egg('arm', 'She took your arm somewhere around West 4th Street and has not let go. In this city that counts as a relationship.'); } }
      }
    });
  },

  // 96 AND 98 ST. MARKS PLACE, 1975. A die cut facade with an inner sleeve behind it: walk sideways and the tenants change.
  stmarks(c, r, g, X) {
    const { THREE } = c, FW = 8, FH = 5.2, FX0 = 6, FZ = -2.4, COLS = 5, ROWS = 3;
    // the sleeve: a brick face with real holes, a sheet behind it that slides with you
    const brick = c.surf('brick', 2.4, 0x8a5a48), shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(FW, 0); shape.lineTo(FW, FH); shape.lineTo(0, FH); shape.lineTo(0, 0);
    const WW = 0.9, WH = 1.15, holes = [];
    for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) { const x = 0.75 + i * (FW - 1.5 - WW) / (COLS - 1), y = 0.9 + j * 1.45, h = new THREE.Path(); h.moveTo(x, y); h.lineTo(x, y + WH); h.lineTo(x + WW, y + WH); h.lineTo(x + WW, y); h.lineTo(x, y); shape.holes.push(h); holes.push([x, y]); }
    const fgeo = new THREE.ExtrudeGeometry(shape, { depth: 0.18, bevelEnabled: false }), uv = fgeo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2.4, uv.getY(i) / 2.4);
    const face = new THREE.Mesh(fgeo, brick); face.position.set(FX0, 0, FZ); g.add(face);
    // white sills and lintels, and a stoop
    const stone = std(c, 0xd8d0c0, { roughness: 0.8 });
    for (const [x, y] of holes) { g.add(c.slab(WW + 0.16, 0.08, 0.28, stone, FX0 + x + WW / 2, y - 0.04, FZ + 0.18)); g.add(c.slab(WW + 0.12, 0.12, 0.22, stone, FX0 + x + WW / 2, y + WH + 0.06, FZ + 0.16)); }
    for (let s = 0; s < 4; s++) g.add(c.slab(1.6, 0.18, 0.32, stone, FX0 + FW / 2, 0.09 + s * 0.18, FZ + 1.3 - s * 0.32));
    g.add(c.slab(FW + 0.3, 0.3, 0.3, stone, FX0 + FW / 2, FH + 0.15, FZ + 0.1));
    c.wall(X(FX0), FZ, X(FX0 + FW), FZ); c.wall(X(FX0), FZ - 0.5, X(FX0 + FW), FZ - 0.5); c.wall(X(FX0), FZ - 0.5, X(FX0), FZ); c.wall(X(FX0 + FW), FZ - 0.5, X(FX0 + FW), FZ); c.wall(X(FX0 + FW / 2 - 0.8), FZ + 1.5, X(FX0 + FW / 2 + 0.8), FZ + 1.5);
    // the inner sleeve: one long canvas of rooms, three times wider than the facade, sliding with the visitor
    const TEN = ['the band, all four', 'a bather in a bowl of foam', 'a cat on the sill', 'a man ironing a flag', 'a painter, eye flowers', 'a lady with a parrot', 'a wedding, very small', 'a boxer, shadow boxing', 'a ballerina at the barre', 'two lovers, shade half down', 'a man reading the census', 'a ghost, polite', 'a pigeon coop indoors', 'a chef flipping a pie', 'a sax player, practising', 'nobody, for rent', 'a moon landing on TV', 'a laundry line indoors', 'a fish tank, one fish', 'a lady counting money', 'a guru on a rug', 'a cop asleep', 'a DJ with two lamps', 'MLow, painting this'];
    const CW = 96 * COLS * 3, CH = 96 * ROWS, sheet = c.canvasTex(CW, CH, (q, w, h) => {
      for (let k = 0; k < COLS * 3 * ROWS; k++) { const i = k % (COLS * 3), j = (k / (COLS * 3)) | 0, x = i * 96, y = j * 96, col = ['#f5c542', '#ff7a1a', '#22d3ee', '#ff4fa3', '#9ad', '#e8d8b0'][k % 6];
        q.fillStyle = col; q.fillRect(x, y, 96, 96); q.fillStyle = 'rgba(0,0,0,.25)'; q.fillRect(x, y + 70, 96, 26);
        const who = k % TEN.length;
        if (who === 0) { for (let b = 0; b < 4; b++) figure(q, x + 18 + b * 20, y + 80, 0.55, '#111', b, b % 2); }
        else if (who === 23) { eyeFlower(q, x + 48, y + 44, 30); }
        else { figure(q, x + 48, y + 84, 0.8, '#1a1a1a', k * 0.7, k % 3 === 0 ? 1 : 0); }
      } });
    sheet.wrapS = THREE.RepeatWrapping;
    const back = new THREE.Mesh(new THREE.PlaneGeometry(FW, FH), new THREE.MeshBasicMaterial({ map: sheet, toneMapped: false })); back.position.set(FX0 + FW / 2, FH / 2, FZ - 0.35); g.add(back);
    sheet.repeat.set(1 / 3, 1);
    // the sliding: your x across the room picks which third of the sleeve shows through the holes
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const u = Math.max(0, Math.min(1, (P.x - r.x0 - 2) / 16)); sheet.offset.x += (u * (2 / 3) - sheet.offset.x) * Math.min(1, dt * 4); });
    // a click on a window names its tenant at the current pull; find the band
    const hit = new THREE.Mesh(new THREE.PlaneGeometry(FW, FH), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(FX0 + FW / 2, FH / 2, FZ + 0.22); g.add(hit);
    let seen = new Set();
    c.clickable(hit, () => {
      const p = c.lastHit?.point || null; let i = 2, j = 1;
      if (p) { const lx = p.x - r.x0 - FX0, ly = p.y; i = Math.max(0, Math.min(COLS - 1, Math.floor(lx / FW * COLS))); j = Math.max(0, Math.min(ROWS - 1, ROWS - 1 - Math.floor(ly / FH * ROWS))); }
      const col = Math.round(sheet.offset.x * COLS * 3) + i, k = j * COLS * 3 + Math.min(COLS * 3 - 1, col), who = TEN[k % TEN.length];
      seen.add(who); c.toast(`Window ${j * COLS + i + 1}: ${who}.`, 2600); c.sound.click();
      if (who === 'the band, all four') c.egg('band', 'The band is home. All four of them, in one room, at the same time. Do not tell the landlord, and do not tell the manager.');
      if (who === 'MLow, painting this') c.egg('mlowwin', 'Top floor, far window: MLow, painting the building you are looking at. Pull the sleeve and he moves out.');
      if (seen.size >= 10) c.egg('tenants', 'Ten tenants met. Nobody in this building has ever paid the same rent as anybody else.');
    }, 'A window');
    const lbl = c.sign('PULL THE SLEEVE: WALK LEFT AND RIGHT', { w: 3.2, h: 0.3, bg: '#0d0d0d', fg: '#f5c542', font: c.MONO, weight: 700 }); lbl.position.set(FX0 + FW / 2, FH + 0.55, FZ + 0.1); g.add(lbl);
    cast(c, r, g, X, 'tough', 4.2, 0.4, { h: 1.85, ry: 0.6, line: 'Physical? I moved four amps up five flights. That is physical.', egg: 'roadie', hint: 'A roadie' });
    c.glb('cat', { h: 0.35, x: FX0 + FW / 2 + 0.5, y: 0.72, z: FZ + 0.6, ry: 0.4, parent: g });
  },

  // LUDLOW AND RIVINGTON, 1989. A sampler on a card table: every pad chops the photograph and the beat with it.
  ludlow(c, r, g, X) {
    const { THREE } = c;
    g.add(c.slab(1.6, 0.06, 0.9, std(c, 0x2a5a3a), 10, 0.78, 1.2)); for (const [x, z] of [[9.3, 0.85], [10.7, 0.85], [9.3, 1.55], [10.7, 1.55]]) g.add(c.slab(0.04, 0.78, 0.04, std(c, 0x222222), x, 0.39, z)); c.post(X(10), 1.2, 0.8);
    const mpc = c.slab(0.7, 0.1, 0.55, std(c, 0xb8b4a8), 10, 0.86, 1.15); g.add(mpc);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.1), basic(c, 0x7fff9a)); scr.rotation.x = -PI / 2; scr.position.set(9.85, 0.915, 0.95); g.add(scr);
    const pads = [], ORDER = [];
    for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) {
      const k = j * 4 + i, p = c.slab(0.11, 0.03, 0.11, std(c, 0x3a3a3a, { emissive: new THREE.Color(INK[k % 6]), emissiveIntensity: 0.05 }), 9.86 + i * 0.13, 0.925, 1.12 + j * 0.15); g.add(p); pads.push(p);
      c.clickable(p, () => chop(k), `Pad ${k + 1}`);
    }
    let until = 0, want = [0, 0];
    const plateMap = () => r.plateMesh?.material?.map;
    function chop(k) {
      const m = plateMap(); if (m) { m.wrapS = THREE.RepeatWrapping; want = [((k * 37) % 100) / 100 - 0.5, 0]; m.offset.x = want[0] * 0.35; m.needsUpdate = true; }
      pads[k].material.emissiveIntensity = 2.2; setTimeout(() => (pads[k].material.emissiveIntensity = 0.05), 220);
      c.sound.beep(220 * Math.pow(2, [0, 3, 5, 7, 10, 12, 15, 17][k] / 12), 0.14, 0.18, 'sawtooth'); c.music.mute(true); until = performance.now() + 380; c.shake(0.03);
      ORDER.push(k); if (ORDER.length > 8) ORDER.shift();
      if (ORDER.length === 8 && new Set(ORDER).size === 8) c.egg('chop', 'Eight pads, eight slices of Ludlow Street, all in one bar. A whole record made of other records, made of one corner.');
      c.egg('sampler');
    }
    c.tick((t, dt, P, ri) => { const m = plateMap(); if (m && performance.now() > until) { m.offset.x *= 0.82; if (ri === r.i && r.owns !== false) c.music.mute(false); } });
    r.owns = true;
    const lbl = c.sign('SAMPLER · CHOP THE CORNER', { w: 1.6, h: 0.18, bg: '#0d0d0d', fg: '#7fff9a', font: c.MONO, weight: 700 }); lbl.position.set(10, 1.15, 1.62); lbl.rotation.y = PI; g.add(lbl);
    // the corner shop's racks of shirts on the sidewalk, a boombox, the hot dog cart, a writer tagging the shutter
    const rail = std(c, 0xbbbbbb, { metalness: 1, roughness: 0.3 });
    for (const x of [3.0, 16.4]) { g.add(c.slab(1.8, 0.04, 0.04, rail, x, 1.7, -5.4)); for (const dx of [-0.88, 0.88]) g.add(c.slab(0.04, 1.7, 0.04, rail, x + dx, 0.85, -5.4)); for (let k = 0; k < 9; k++) { const sh = c.slab(0.04, 0.8, 0.5, std(c, new THREE.Color(INK[(k + x) % 6]).multiplyScalar(0.8).getHex(), { roughness: 0.9 }), x - 0.8 + k * 0.2, 1.25, -5.4); g.add(sh); } c.post(X(x), -5.4, 1.0); }
    const bb = c.glb('boombox', { len: 0.8, x: 5.6, y: 0, z: -0.4, ry: 0.5, parent: g }); c.post(X(5.6), -0.4, 0.4);
    c.clickable(bb, () => { c.music.level(1.5); setTimeout(() => c.music.level(1), 6000); c.egg('boombox', 'Louder. The whole corner was a record once. Every sound on this street was somebody else\'s first.'); }, 'Turn it up');
    cast(c, r, g, X, 'hotdog', 15.6, 0.6, { h: 1.8, ry: -0.8, rad: 0.7 });
    cast(c, r, g, X, 'writer', 3.4, 0.8, { h: 1.75, ry: 1.2, line: 'Tagging the shutter of the shop on the corner. In a hundred years they will put this on the cover of something.', egg: 'writer', hint: 'The writer' });
    // the fold out: the sleeve opened flat, as a banner over the room
    const pano = c.sign('THE CORNER · OPEN THE GATEFOLD · SAMPLE EVERYTHING', { w: 9, h: 0.5, bg: '#f4ead2', fg: '#0d0d0d', font: c.SERIF, weight: 900 }); pano.position.set(10, 5.4, -7.6); g.add(pano);
  },

  // THE SILVER LOFT. Foil everywhere, silver pillows you can push, a banana you can peel and a camera that wants three minutes of you.
  factory(c, r, g, X) {
    const { THREE } = c;
    const cloudGeo = new THREE.SphereGeometry(1, 24, 14), chrome = new THREE.MeshStandardMaterial({ color: 0xe8ecf2, metalness: 1, roughness: 0.12 });
    const clouds = []; for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(cloudGeo, chrome); m.scale.set(0.75, 0.24, 0.55); m.position.set(3 + Math.random() * 14, 1.6 + Math.random() * 3, -5 + Math.random() * 10); g.add(m); clouds.push({ m, v: new THREE.Vector3((Math.random() - 0.5) * 0.3, 0, (Math.random() - 0.5) * 0.3), s: Math.random() * 6 }); }
    let pushes = 0, lastPush = 0;
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return;
      const px = P.x - r.x0, pz = P.z;
      for (const cl of clouds) {
        const m = cl.m, dx = m.position.x - px, dz = m.position.z - pz, dy = m.position.y - 1.6, d = Math.hypot(dx, dz, dy * 0.6);
        if (d < 1.15) { const k = (1.15 - d) * 6; cl.v.x += dx / d * k * dt * 3; cl.v.z += dz / d * k * dt * 3; cl.v.y += 0.6 * dt; if (t - lastPush > 0.5) { lastPush = t; pushes++; c.sound.beep(600 + Math.random() * 300, 0.03, 0.15, 'sine'); if (pushes === 8) c.egg('clouds', 'Silver clouds. Helium and aluminium, and they never stop drifting. You just rearranged an art show by walking through it.'); } }
        cl.v.y += (2.4 + Math.sin(t * 0.4 + cl.s) * 0.8 - m.position.y) * dt * 0.4; cl.v.multiplyScalar(1 - dt * 0.35);
        m.position.addScaledVector(cl.v, dt); m.rotation.y += cl.v.x * dt; m.rotation.z = Math.sin(t * 0.5 + cl.s) * 0.15;
        if (m.position.x < 1 || m.position.x > W - 1) cl.v.x *= -1; if (m.position.z < -D / 2 + 1 || m.position.z > D / 2 - 1) cl.v.z *= -1;
        m.position.x = Math.max(1, Math.min(W - 1, m.position.x)); m.position.z = Math.max(-D / 2 + 1, Math.min(D / 2 - 1, m.position.z)); m.position.y = Math.max(0.5, Math.min(5.4, m.position.y));
      }
    });
    // the banana: yellow, three clicks, pink
    const curve = new THREE.CatmullRomCurve3([V3(c, -0.9, 0.2, 0), V3(c, -0.4, -0.15, 0), V3(c, 0.3, -0.18, 0), V3(c, 0.9, 0.25, 0)]);
    const banana = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.24, 16), new THREE.MeshStandardMaterial({ color: 0xf2d22a, roughness: 0.45 }));
    const bg = new THREE.Group(); bg.position.set(13.2, 1.6, -5.6); bg.rotation.set(0.2, -0.3, 0); bg.add(banana); g.add(bg);
    g.add(c.slab(1.0, 1.1, 1.0, std(c, 0xf4f4f4), 13.2, 0.55, -5.6)); c.post(X(13.2), -5.6, 0.7);
    let peel = 0; const pink = new THREE.Color(0xff8fb8), yel = new THREE.Color(0xf2d22a);
    c.clickable(banana, () => { peel = Math.min(3, peel + 1); banana.material.color.copy(yel).lerp(pink, peel / 3); c.sound.whoosh(0.2, 0.4); if (peel === 3) c.egg('peel', 'Peel slowly and see. Under the yellow, pink. Under the pink, a New Yorker, waiting to be counted.'); else c.toast(['Slowly.', 'Slower.'][peel - 1]); }, 'Peel slowly');
    c.tick((t) => { bg.rotation.y = -0.3 + Math.sin(t * 0.3) * 0.2; });
    // the screen test: a stool, a camera, a mark. Hold still and the picture goes black and white and starts counting.
    const stool = c.slab(0.4, 0.62, 0.4, std(c, 0x111111), 16.8, 0.31, -4.2); g.add(stool);
    const mk = decal(c, 0.8, 0.8, (q, w, h) => { q.strokeStyle = '#ff3b3b'; q.lineWidth = 8; q.strokeRect(10, 10, w - 20, h - 20); q.fillStyle = '#ff3b3b'; q.font = `800 ${w * 0.1}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('SCREEN TEST', w / 2, h / 2 + 6); });
    mk.rotation.x = -PI / 2; mk.position.set(15.6, 0.02, -2.8); g.add(mk);
    g.add(c.slab(0.04, 1.2, 0.04, std(c, 0x222222), 15.2, 0.6, -1.0));
    let st = 0, last = [0, 0], shot = false;
    const fw = new THREE.Vector3();
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) { if (r.owns) { c.FX.sat = null; r.owns = false; } st = 0; return; }
      const mv = Math.hypot(P.x - last[0], P.z - last[1]); last = [P.x, P.z];
      const on = Math.hypot(P.x - r.x0 - 15.6, P.z + 2.8) < 0.6; st = on && mv < 0.004 ? st + dt : on ? st * 0.9 : 0;
      if (st > 1) { c.FX.sat = Math.max(0, 1 - (st - 1)); r.owns = true; if (st > 4 && !shot) { shot = true; c.sound.tick(); c.egg('screentest', 'Three minutes, no blinking, no talking. A silent portrait, sixteen frames a second. Everybody who sat here became somebody, at least for three minutes.'); } }
      else if (r.owns) { c.FX.sat = null; r.owns = false; }
    });
    cast(c, r, g, X, 'bluesteel', 4.2, 0.6, { h: 1.85, ry: 0.8, line: 'I am silver because the walls are silver. If the walls were gold I would be a different person entirely.', egg: 'silver', hint: 'The silver one' });
    cast(c, r, g, X, 'gown', 8.4, -0.6, { h: 1.8, ry: 0.3, line: 'I sang one song on that record. In a voice like a cello in a fridge. People still ask.', egg: 'singer', hint: 'The singer' });
    cast(c, r, g, X, 'agent', 11.2, -4.4, { h: 1.85, ry: -0.4, line: 'Sunglasses, indoors, at night. It is not a look. It is a policy.', egg: 'shades', hint: 'Sunglasses' });
    // silkscreens leaning on the wall: eye flowers repeated in four colours, the way the loft did soup
    for (let k = 0; k < 4; k++) { const s = decal(c, 1.2, 1.2, (q, w, h) => { q.fillStyle = INK[k]; q.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) eyeFlower(q, w * (0.25 + (i % 2) * 0.5), h * (0.25 + ((i / 2) | 0) * 0.5), w * 0.2, '#fbe6f0', INK[(k + i + 1) % 6]); }); s.position.set(0.2, 0.75, -6.2 + k * 1.3); s.rotation.set(0, PI / 2, 0); s.rotation.order = 'YXZ'; s.rotation.x = -0.12; g.add(s); }
  },

  // 315 BOWERY, 1977. A pit that shoves, and walls of flyers that rewrite themselves when you are not looking.
  cbgb(c, r, g, X) {
    const { THREE } = c;
    // the bar on the east wall
    g.add(c.slab(1.0, 1.1, 7.2, std(c, 0x2a1810, { roughness: 0.6 }), 18.6, 0.55, -2.0)); c.wall(X(18.1), -5.6, X(18.1), 1.6);
    cast(c, r, g, X, 'bartender', 19.4, -2.4, { h: 1.8, ry: -PI / 2, rad: 0, line: 'One beer, one band, three chords. We take cash and we take earplugs, but not yours.', egg: 'cbgbbar', hint: 'The bartender' });
    // the awning sign over the portal: N3W BG, the letters a club once used for music it never ended up booking
    const aw = c.sign('N3W · BG · OMFUG', { w: 6, h: 0.9, bg: '#f4f4f4', fg: '#b01020', font: c.SERIF, weight: 900, border: '#111' }); aw.position.set(W / 2, PORTAL.h + 0.75, -D / 2 + 0.06); g.add(aw);
    c.clickable(aw, () => c.egg('omfug', 'The letters stood for the music the club meant to book. It booked the other kind instead, loudly, for thirty three years.'), 'The awning');
    // the walls: flyers on canvas atlases, one per side wall. Every time you turn your back on a wall it rewrites itself.
    const BANDS = ['THE COUNTED', 'NAZAR', 'EYE FLOWER', 'THE STOOPS', 'BODEGA CATS', 'SECOND AVE', 'RENT STRIKE', 'TOKEN BOOTH', 'THE DELI', 'STEAM PIPE', 'LAST TRAIN', 'THE PIGEONS', 'N3W WAVE', 'FIVE BOROUGHS', 'MLOW TONIGHT'];
    const mkWall = (x, ry) => {
      const t = c.canvasTex(1024, 512, () => {}), q = t.userData.canvas.getContext('2d');
      const paint = (n) => { q.fillStyle = '#2a2420'; q.fillRect(0, 0, 1024, 512);
        for (let i = 0; i < 70; i++) { const x0 = Math.random() * 1000 - 20, y0 = Math.random() * 480 - 20, w = 70 + Math.random() * 70, h = 90 + Math.random() * 60, rot = (Math.random() - 0.5) * 0.3;
          q.save(); q.translate(x0, y0); q.rotate(rot); q.fillStyle = Math.random() < 0.5 ? '#f4ead2' : INK[(Math.random() * 6) | 0]; q.fillRect(0, 0, w, h); q.fillStyle = '#111';
          const b = n >= 6 && i === 69 ? 'MLOW TONIGHT' : BANDS[(Math.random() * (BANDS.length - 1)) | 0]; q.font = `900 ${w * 0.13}px ${c.MONO}`; q.fillText(b.slice(0, 11), 5, h * 0.45); q.font = `600 ${w * 0.09}px ${c.MONO}`; q.fillText('$3 · 9PM', 5, h * 0.75);
          if (Math.random() < 0.3) eyeFlower(q, w * 0.75, h * 0.2, w * 0.15); q.restore(); }
        t.needsUpdate = true; };
      paint(0);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.5), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 })); m.position.set(x, 2.8, -2.4); m.rotation.y = ry; g.add(m);
      return { m, paint, n: 0, seen: true };
    };
    const walls = [mkWall(0.16, PI / 2)];
    const fw = new THREE.Vector3();
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return; c.camera.getWorldDirection(fw);
      for (const w of walls) { const sees = fw.x < -0.2; if (w.seen && !sees) { w.n++; w.paint(w.n); } w.seen = sees; }
    });
    c.clickable(walls[0].m, () => { if (walls[0].n >= 6) c.egg('mlowtonight', 'There it is, bottom right, fresh glue: MLOW TONIGHT. Look away again and it will be gone. That is how you know it was real.'); else c.toast('The flyers keep changing. Look away a few more times.'); }, 'The flyer wall');
    // the pit: eighteen New Yorkers bouncing; walk into it and it walks into you
    const pit = []; for (let i = 0; i < 18; i++) { const e = extra(c, g, 5.5 + (i % 6) * 1.6 + Math.random() * 0.4, -5.6 + ((i / 6) | 0) * 1.5, { col: [0x111111, 0x2a2a2a, 0x5a1010, 0x1a2a4a][i % 4], ry: PI }); pit.push({ e, x: e.position.x, z: e.position.z, s: Math.random() * 6 }); }
    let inPit = 0, shove = [0, 0];
    r.move = (P, nx, nz, dt) => [nx + shove[0] * dt, nz + shove[1] * dt];
    c.tick((t, dt, P, ri) => {
      const px = P.x - r.x0, pz = P.z, here = ri === r.i, near = here && px > 4.5 && px < 15.5 && pz > -6.4 && pz < -1.2;
      for (const p of pit) { p.e.position.y = Math.abs(Math.sin(t * (near ? 9 : 5) + p.s)) * (near ? 0.35 : 0.15); p.e.position.x = p.x + Math.sin(t * 2.3 + p.s) * 0.3; p.e.rotation.y = PI + Math.sin(t * 3 + p.s) * 0.6; }
      if (near) { inPit += dt; if (Math.random() < dt * 2.5) { const a = Math.random() * PI * 2; shove = [Math.cos(a) * 3.5, Math.sin(a) * 3.5]; c.shake(0.08); c.sound.thud(0.25); } if (inPit > 9) { inPit = -1e9; c.egg('pit', 'Nine seconds in the pit. Nobody fell, everybody was shoved, and you will hear it in your left ear until Thursday.'); } }
      shove = [shove[0] * (1 - dt * 6), shove[1] * (1 - dt * 6)];
    });
    // the bathroom door, which nobody should open
    const dr = c.slab(1.0, 2.2, 0.08, std(c, 0x3a2a1a), 15.0, 1.1, D / 2 - 0.08); g.add(dr);
    const ds = c.sign('THE BATHROOM', { w: 0.9, h: 0.18, bg: '#111', fg: '#ff3b3b', font: c.MONO, weight: 700 }); ds.position.set(15.0, 2.35, D / 2 - 0.13); ds.rotation.y = PI; g.add(ds);
    c.clickable(dr, () => { c.sound.thud(0.4); c.egg('bathroom', 'You opened it. You closed it. You will not be telling anybody what you saw, and neither will the city.'); }, 'Do not open');
  },

  // 1520 SEDGWICK AVENUE, AUGUST 1973. Two turntables, one break. Click one deck, then the other, before the break runs out.
  sedgwick(c, r, g, X) {
    const { THREE } = c;
    const table = c.slab(3.4, 0.9, 1.0, std(c, 0x3a2a1a), 10, 0.45, -5.6); g.add(table); c.wall(X(8.3), -5.1, X(11.7), -5.1);
    const decks = [-1, 1].map((s) => { const d = new THREE.Group(); d.position.set(10 + s * 1.0, 0.92, -5.6); g.add(d);
      d.add(c.slab(0.9, 0.08, 0.7, std(c, 0xc0c0c0, { metalness: 0.8, roughness: 0.3 }), 0, 0, 0));
      const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.02, 40), new THREE.MeshStandardMaterial({ map: sleeveTex(c, s > 0 ? 11 : 5), roughness: 0.3 })); pl.position.y = 0.05; d.add(pl);
      return { d, pl, s }; });
    g.add(c.slab(0.5, 0.1, 0.4, std(c, 0x222222), 10, 0.95, -5.6));
    // two speaker towers that breathe with the bass
    const spk = []; for (const x of [6.4, 13.6]) { const s = new THREE.Group(); s.position.set(x, 0, -6.4); g.add(s); s.add(c.slab(1.3, 2.6, 0.9, std(c, 0x161616), 0, 1.3, 0));
      for (const [y, rr] of [[0.7, 0.45], [1.75, 0.45], [2.4, 0.18]]) { const cone = new THREE.Mesh(new THREE.CircleGeometry(rr, 32), std(c, 0x080808, { roughness: 0.4 })); cone.position.set(0, y, 0.46); s.add(cone); const ring = new THREE.Mesh(new THREE.RingGeometry(rr * 0.25, rr * 0.32, 24), basic(c, 0xf5c542)); ring.position.set(0, y, 0.47); s.add(ring); }
      spk.push(s); c.post(X(x), -6.4, 0.8); }
    const flyer = c.sign('BACK TO SCHOOL JAM · AUG 11 · 1520 SEDGWICK AVE · 25 CENTS LADIES · 50 CENTS FELLAS', { w: 4.6, h: 0.4, bg: '#f4ead2', fg: '#111', font: c.MONO, weight: 800 }); flyer.position.set(W / 2, 3.4, -D / 2 + 0.06); g.add(flyer);
    // the break: clicking a deck plays two bars. The other deck must be next, before the two bars are up.
    let until = 0, lastDeck = 0, chain = 0, wentOff = false;
    const BAR = 60 / 104 * 4;
    decks.forEach((dk) => c.clickable(dk.d, () => {
      const now = performance.now() / 1000;
      if (dk.s === lastDeck && now < until) { c.toast('Other deck. Same record, the other copy. That is the trick.'); return; }
      chain = now < until ? chain + 1 : 1; lastDeck = dk.s; until = now + BAR * 2; c.sound.tick(); c.egg('decks');
      if (chain === 2) c.toast('The merry go round: back and forth between two copies, and the break never ends.', 3200);
      if (chain >= 8 && !wentOff) { wentOff = true; c.egg('merrygoround', 'Eight times round the merry go round. The break did not end, the room did not stop, and a whole new kind of music walked out of a rec room in the Bronx.'); }
    }, 'Drop the needle on the break'));
    // the dancers: they only move on the break
    const crowd = []; for (let i = 0; i < 14; i++) { const a = i / 14 * PI * 2, e = extra(c, g, 10 + Math.cos(a) * 3.4, -0.6 + Math.sin(a) * 2.4, { col: INK.map((h) => parseInt(h.slice(1), 16))[i % 6], ry: -a - PI / 2 }); crowd.push({ e, a, s: Math.random() * 6 }); }
    const bboy = c.glb('tracksuit', { h: 1.75, x: 10, z: -0.6, parent: g }); c.post(X(10), -0.6, 0.6);
    const dancer = c.glb('dancer', { h: 1.8, x: 13.2, z: 2.0, ry: -0.6, parent: g }); c.post(X(13.2), 2.0, 0.4);
    c.tick((t, dt, P, ri) => {
      const here = ri === r.i, on = here && performance.now() / 1000 < until;
      if (here) { c.music.mute(!on); r.owns = true; } else if (r.owns) { c.music.mute(false); r.owns = false; chain = 0; }
      for (const dk of decks) if (on && dk.s === lastDeck) dk.pl.rotation.y -= dt * 3.5;
      for (const p of crowd) { p.e.position.y = on ? Math.abs(Math.sin(t * 5.4 + p.s)) * 0.25 : 0; p.e.rotation.z = on ? Math.sin(t * 2.7 + p.s) * 0.15 : 0; }
      bboy.rotation.y = on ? bboy.rotation.y + dt * 9 : bboy.rotation.y; bboy.position.y = on ? Math.abs(Math.sin(t * 2.7)) * 0.1 : 0;
      dancer.rotation.y = -0.6 + (on ? Math.sin(t * 5.4) * 0.5 : 0);
      for (const s of spk) s.scale.setScalar(on ? 1 + Math.max(0, Math.sin(t * 2 * PI * 104 / 60)) * 0.03 : 1);
      c.lights[0] && on && (c.lights[0].userData.i = 16 + Math.sin(t * 11) * 10);
    });
    cast(c, r, g, X, 'famer', 4.2, 1.0, { h: 1.75, ry: 0.6, line: 'Twenty five cents to get in. Best quarter anybody ever spent in this building.', egg: 'quarter', hint: 'A guest' });
  },

  // EAST 126TH STREET, 1958. A stoop, a crowd of musicians, a camera across the street. Stand on the mark and hold still.
  harlem(c, r, g, X) {
    const { THREE } = c;
    const stone = c.surf('brick', 2.4, 0x7a5040), step = std(c, 0x8a6a58, { roughness: 0.85 });
    // the stoop: eight steps up to a door, iron rails
    for (let s = 0; s < 8; s++) g.add(c.slab(3.6, 0.2 * (s + 1), 0.36, step, 10, 0.1 * (s + 1), -4.6 - s * 0.36));
    // the stoop climbs straight into the photograph: the brownstone is the plate's
    const iron = std(c, 0x111111, { metalness: 0.7, roughness: 0.4 });
    for (const sx of [-1, 1]) { const x = 10 + sx * 1.9; for (let s = 0; s < 9; s++) g.add(c.slab(0.03, 0.9, 0.03, iron, x, 0.2 * s + 0.45, -4.6 - s * 0.36)); const rail = c.slab(0.05, 0.05, 3.4, iron, x, 1.6, -6.0); rail.rotation.x = Math.atan2(1.6, 3.0); g.add(rail); }
    c.wall(X(8.1), -4.4, X(11.9), -4.4); c.wall(X(8.1), -4.4, X(8.1), -7.4); c.wall(X(11.9), -4.4, X(11.9), -7.4);
    // the crowd: forty New Yorkers, milling. Each has a home in the photograph: rows on the steps and the sidewalk, children on the curb.
    const home = [];
    for (let s = 0; s < 6; s++) for (let k = 0; k < 4; k++) home.push([8.7 + k * 0.85, 0.2 * (s + 1) + 0.02, -4.6 - s * 0.36 - 0.05]);
    for (let k = 0; k < 10; k++) home.push([4.6 + k * 1.2 + (k > 4 ? 2.6 : 0), 0, -3.4 - (k % 2) * 0.6]);
    const kids = 8; for (let k = 0; k < kids; k++) home.push([6.4 + k * 1.0, -0.55, -1.6]);
    const people = home.map(([x, y, z], i) => { const kid = i >= home.length - kids, e = extra(c, g, 2 + Math.random() * 16, z + 2 + Math.random() * 3, { col: kid ? INK.map((h) => parseInt(h.slice(1), 16))[i % 6] : [0x1a1a22, 0x3a3020, 0x2a2a3a, 0x4a3a2a][i % 4], seated: kid, ry: Math.random() * 6 }); return { e, home: [x, y, z], wx: e.position.x, wz: e.position.z, s: Math.random() * 9, kid }; });
    [{ nm: 'wiseguy', egg: 'trumpet', line: 'Trumpet. I came because somebody said there would be breakfast. There was no breakfast.' },
      { nm: 'annieh', egg: 'pianohat', line: 'Piano. I wore my best hat. Everybody wore their best hat. It is a hat picture, really.' },
      { nm: 'hijacker', egg: 'tenmorning', line: 'Saxophone. Ten in the morning. Most of us had never seen ten in the morning from this side.' },
      { nm: 'broker', egg: 'bassback', line: 'Bass. I stood at the back so the bass could be in it. The bass did not fit.' }]
      .forEach((m, i) => cast(c, r, g, X, m.nm, 3.0 + i * 4.4 + (i > 1 ? 1.4 : 0), -2.4, { h: 1.8, ry: 0, rad: 0.4, line: m.line, egg: m.egg, hint: 'A musician' }));
    // the mark across the street
    const mk = decal(c, 1, 1, (q, w, h) => { q.fillStyle = '#f5c542'; q.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2 - PI / 2, rr = i % 2 ? w * 0.2 : w * 0.48; q.lineTo(w / 2 + Math.cos(a) * rr, h / 2 + Math.sin(a) * rr); } q.fill(); q.fillStyle = '#0d0d0d'; q.font = `800 ${w * 0.08}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('HOLD STILL', w / 2, h / 2 + 4); });
    mk.rotation.x = -PI / 2; mk.position.set(10, 0.02, 4.0); g.add(mk);
    g.add(c.slab(0.04, 1.3, 0.04, std(c, 0x222222), 11.4, 0.65, 5.4)); c.post(X(11.4), 5.4, 0.25);
    let pose = 0, still = 0, last = [0, 0], shot = false, held = 0;
    const fw = new THREE.Vector3();
    c.tick((t, dt, P, ri) => {
      const here = ri === r.i;
      if (!here) { if (r.owns) { c.FX.tint = null; c.FX.sat = null; r.owns = false; } pose = 0; still = 0; return; }
      const mv = Math.hypot(P.x - last[0], P.z - last[1]); last = [P.x, P.z]; c.camera.getWorldDirection(fw);
      const on = Math.hypot(P.x - r.x0 - 10, P.z - 4.0) < 0.6 && fw.z < -0.85;
      still = on && mv < 0.004 ? still + dt : 0;
      pose += ((still > 0.6 ? 1 : 0) - pose) * Math.min(1, dt * (still > 0.6 ? 0.9 : 2.5));
      for (const p of people) {
        const wx = p.wx + Math.sin(t * 0.3 + p.s) * 1.4, wz = p.wz + Math.cos(t * 0.23 + p.s) * 0.8;
        p.e.position.x = wx + (p.home[0] - wx) * pose; p.e.position.z = wz + (p.home[2] - wz) * pose; p.e.position.y = p.home[1] * pose + (p.kid ? 0 : 0);
        p.e.rotation.y = (1 - pose) * (Math.atan2(wx - p.wx, wz - p.wz) + p.s) + pose * 0;
      }
      if (pose > 0.97) { held += dt; if (held > 0.8 && !shot) { shot = true; c.flash(1); c.sound.tick(); setTimeout(() => c.sound.tick(), 120); c.FX.tint = 0xe8c898; c.FX.sat = 0.25; r.owns = true; c.egg('greatday', 'Click. Fifty seven musicians, a dozen kids on the curb, one stoop on East 126th Street, a little after ten in the morning. The only time they were all in one place.'); setTimeout(() => { if (r.owns) { c.FX.tint = null; c.FX.sat = null; r.owns = false; } shot = false; held = 0; }, 6000); } }
      else held = 0;
    });
    const lbl = c.sign('ESQUIRE WANTS A PICTURE · HOLD STILL ON THE MARK', { w: 4.2, h: 0.3, bg: '#0d0d0d', fg: '#f5c542', font: c.MONO, weight: 700 }); lbl.position.set(10, 0.95, 5.3); lbl.rotation.y = PI; g.add(lbl);
  },

  // 178 SEVENTH AVENUE SOUTH. The room is a wedge and the point is the bandstand. Walk to the point: the trio swells and so do you.
  vanguard(c, r, g, X, mats) {
    const { THREE } = c, red = std(c, 0x7a1414, { roughness: 0.85 });
    const wedge = (ax, az, bx, bz) => { const L = Math.hypot(bx - ax, bz - az), m = c.slab(0.2, 4.2, L, red, (ax + bx) / 2, 2.1, (az + bz) / 2); m.rotation.y = Math.atan2(bx - ax, bz - az); g.add(m); c.wall(X(ax), az, X(bx), bz); };
    wedge(...WEDGE.L); wedge(...WEDGE.R);
    // the steep red stairs you came down, against the back wall
    for (let s = 0; s < 9; s++) g.add(c.slab(1.4, 0.22 * (s + 1), 0.3, std(c, 0x5a1010), 2.2, 0.11 * (s + 1), 7.7 - s * 0.01 - 0.15));
    // the tables: they shrink toward the point, so the room reads twice as deep as it is
    const candleTex = glowTex(c, 'rgba(255,180,90,.8)');
    let k = 0; for (let row = 0; row < 6; row++) { const z = -0.2 - row * 1.2, f = 1 - row * 0.09, half = (WEDGE.R[0] - WEDGE.L[0]) / 2 * (1 - (1.2 - z) / 8.8) - 1.4;
      for (let x = 10 - half; x <= 10 + half + 0.01; x += 1.6 * f) { const tg = new THREE.Group(); tg.position.set(x, 0, z); tg.scale.setScalar(f); g.add(tg);
        tg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.04, 20), std(c, 0x1a1a1a))).position.y = 0.72; tg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.08, 0.72, 8), std(c, 0x111111))).position.y = 0.36;
        const cd = new THREE.Sprite(new THREE.SpriteMaterial({ map: candleTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); cd.scale.setScalar(0.35); cd.position.y = 0.85; tg.add(cd);
        if ((k++ % 3) === 0) tg.add(extra(c, tg, 0.45, 0.1, { seated: true, col: 0x2a1a1a, ry: PI }));
        c.post(X(x), z, 0.3 * f); } }
    // photographs of the players who stood here, every one an eye flower in black and white
    for (const side of [WEDGE.L, WEDGE.R]) for (let i = 1; i < 6; i++) { const u = i / 6, x = side[0] + (side[2] - side[0]) * u, z = side[1] + (side[3] - side[1]) * u, s = side === WEDGE.L ? 1 : -1;
      const ph = decal(c, 0.45, 0.55, (q, w, h) => { q.fillStyle = '#111'; q.fillRect(0, 0, w, h); q.fillStyle = '#ddd'; q.fillRect(6, 6, w - 12, h - 12); q.filter = 'grayscale(1)'; eyeFlower(q, w / 2, h * 0.4, w * 0.28, '#eee', '#888'); q.fillStyle = '#333'; q.fillRect(w * 0.3, h * 0.6, w * 0.4, h * 0.3); });
      ph.position.set(x + s * 0.12, 3.4, z); ph.rotation.y = Math.atan2(side[2] - side[0], side[3] - side[1]) + s * PI / 2; g.add(ph); }
    cast(c, r, g, X, 'sally', 6.6, 2.6, { h: 1.3, ry: -0.4, line: 'Two drink minimum and the music goes on till it stops. I have been at this table since the second set of 1961.', egg: 'regular', hint: 'A regular' });
    cast(c, r, g, X, 'maitre', 16.6, 4.4, { h: 1.85, ry: -2.2, line: 'Please. No talking during the ballads. The room can hear you think.', egg: 'hush', hint: 'The doorman' });
    // the horn: the closer to the point, the louder the trio and the bigger you are
    const fw = new THREE.Vector3();
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) { if (r.owns) { P.scale = 1; c.music.level(1); r.owns = false; } return; }
      const u = Math.max(0, Math.min(1, (1.2 - P.z) / 8.2));
      P.scale += (1 + u * u * 0.7 - P.scale) * Math.min(1, dt * 2); c.music.level(0.5 + u * 1.3); r.owns = true;
      if (u > 0.93) { c.camera.getWorldDirection(fw); if (fw.z < -0.8) c.egg('bandstand', 'The point of the wedge. Every note in the room arrives here at once. Some people say the walls are the best instrument in the building.'); }
    });
    const lbl = c.sign('WALK TO THE POINT', { w: 1.6, h: 0.22, bg: '#0d0d0d', fg: '#ffb060', font: c.MONO, weight: 700 }); lbl.position.set(10, 3.6, -7.5); g.add(lbl);
  },

  // 253 WEST 125TH STREET. You are on the stage. Rub the stump, step into the light, and the house decides.
  apollo(c, r, g, X) {
    const { THREE } = c, gold = std(c, 0xc9a033, { metalness: 1, roughness: 0.3 }), velvet = std(c, 0x7a0a14, { roughness: 0.9 });
    // proscenium and curtains framing the house
    g.add(c.slab(0.8, 5.4, 0.5, gold, (W - PORTAL.w) / 2 - 0.4, 2.7, -7.6)); g.add(c.slab(0.8, 5.4, 0.5, gold, (W + PORTAL.w) / 2 + 0.4, 2.7, -7.6)); g.add(c.slab(PORTAL.w + 1.6, 0.6, 0.5, gold, W / 2, 5.6, -7.6));
    for (const s of [-1, 1]) { const cu = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 4.4, 24, 1), velvet); const p = cu.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 9) * 0.12); cu.geometry.computeVertexNormals(); cu.position.set(W / 2 + s * (PORTAL.w / 2 - 0.6), 2.2, -7.3); g.add(cu); }
    // footlights
    bulbs(c, g, 4.4, 15.6, 0.12, -7.0, 30, 0xfff0c0);
    // the spotlight circle
    const SX = 10, SZ = -3.2, spot = new THREE.Mesh(new THREE.CircleGeometry(1.2, 48), new THREE.MeshBasicMaterial({ color: 0xfff6d8, transparent: true, opacity: 0.32, depthWrite: false, toneMapped: false })); spot.rotation.x = -PI / 2; spot.position.set(SX, 0.02, SZ); g.add(spot);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(1.2, 9, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff6d8, transparent: true, opacity: 0.06, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false })); beam.position.set(SX, 4.5, SZ - 2.0); beam.rotation.x = -0.45; g.add(beam);
    // the Tree of Hope: a stump on a plinth, rubbed smooth by a century of hands
    const bark = c.surf('planks', 1, 0x6a4a30), stump = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.9, 20), bark); stump.position.set(3.2, 1.0, -5.0); g.add(stump);
    const top = new THREE.Mesh(new THREE.CircleGeometry(0.45, 32), new THREE.MeshStandardMaterial({ map: c.canvasTex(128, 128, (q, w, h) => { q.fillStyle = '#c8a070'; q.fillRect(0, 0, w, h); q.strokeStyle = '#8a6040'; for (let k = 6; k < 64; k += 5) { q.beginPath(); q.arc(64, 64, k, 0, 7); q.stroke(); } }), roughness: 0.3, metalness: 0.2 })); top.rotation.x = -PI / 2; top.position.set(3.2, 1.46, -5.0); g.add(top);
    g.add(c.slab(1.4, 0.55, 1.4, gold, 3.2, 0.28, -5.0)); c.post(X(3.2), -5.0, 0.8);
    let hope = false;
    c.clickable(stump, () => { hope = true; c.sound.ding(); c.egg('tree', 'You rubbed the Tree of Hope. A piece of an elm that stood on Seventh Avenue, now a stump on a stage, and still the luckiest wood in New York.'); }, 'Rub the stump for luck');
    // the meter, stage left, and the house band's reaction
    const meter = c.canvasTex(256, 64, () => {}), mq = meter.userData.canvas.getContext('2d');
    const mm = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshBasicMaterial({ map: meter, toneMapped: false })); mm.position.set(17.2, 3.4, -5.4); mm.rotation.y = -0.6; g.add(mm);
    const drawMeter = (v) => { mq.fillStyle = '#111'; mq.fillRect(0, 0, 256, 64); const gr = mq.createLinearGradient(10, 0, 246, 0); gr.addColorStop(0, '#ff3b3b'); gr.addColorStop(0.5, '#f5c542'); gr.addColorStop(1, '#22ff88'); mq.fillStyle = gr; mq.fillRect(10, 18, 236 * v, 28); mq.fillStyle = '#fff'; mq.font = '700 12px monospace'; mq.fillText('BOO', 12, 14); mq.fillText('THE HOUSE', 100, 14); mq.fillText('WIN', 222, 14); meter.needsUpdate = true; };
    drawMeter(0.5);
    // the Sandman, in the wings with his broom
    const sand = c.glb('prince', { h: 1.8, x: 1.6, z: 0.4, ry: PI / 2, parent: g });
    const singer = cast(c, r, g, X, 'actress', 15.4, -1.4, { h: 1.85, ry: -0.6, line: 'I won on a Wednesday in 1952. Second song, the balcony stood up. You never forget the balcony.', egg: 'winner', hint: 'Last week\'s winner' });
    cast(c, r, g, X, 'usher', 18.6, 4.8, { h: 1.85, ry: -2.0, line: 'Amateur Night, every Wednesday since 1934. This crowd will make you or break you, sometimes both.', egg: 'apollousher', hint: 'The usher' });
    let inSpot = 0, v = 0.5, state = 0, sweep = 0;
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) { inSpot = 0; state = 0; sand.position.set(1.6, 0, 0.4); return; }
      const on = Math.hypot(P.x - r.x0 - SX, P.z - SZ) < 1.2 && !P.ride;
      spot.material.opacity = on ? 0.5 : 0.32;
      if (on) inSpot += dt; else { inSpot = 0; if (state === 1 || state === 2) state = 0; }
      if (state === 0 && inSpot > 1.2) { state = hope ? 1 : 2; c.toast(hope ? 'The house leans in.' : 'The house is not sure about you.', 2200); }
      if (state === 1) { v = Math.min(1, v + dt * 0.12); if (Math.random() < dt * 2) c.sound.applause(1.2); if (v >= 1) { state = 3; c.flash(0.6); c.egg('amateurnight', 'The balcony stood up. You won Amateur Night at the Apollo. Somewhere a talent scout is writing your name on a napkin.'); } }
      if (state === 2) { v = Math.max(0, v - dt * 0.18); if (Math.random() < dt * 2.5) c.sound.beep(90 + Math.random() * 40, 0.08, 0.5, 'sawtooth'); if (v <= 0.02) { state = 4; sweep = 0; c.toast('Here comes the Sandman.', 2200); } }
      if (state === 4) {
        sweep += dt; const px = P.x - r.x0, pz = P.z; sand.position.x += (px - 0.6 - sand.position.x) * Math.min(1, dt * 2.5); sand.position.z += (pz - sand.position.z) * Math.min(1, dt * 2.5); sand.rotation.y = Math.atan2(px - sand.position.x, pz - sand.position.z);
        if (sweep > 1.6 && !P.ride) { state = 5; const cv = new THREE.CatmullRomCurve3([V3(c, P.x, c.EYE, P.z), V3(c, r.x0 + 6, c.EYE, P.z + 1.5), V3(c, r.x0 + 3, c.EYE, 4.2)]); c.sound.whoosh(0.5, 1.2); c.ride(cv, 1.8, () => { c.egg('swept', 'Swept off the stage by the Sandman, broom and all. Rub the tree next time. Everybody rubs the tree.'); state = 0; v = 0.5; drawMeter(v); sand.position.set(1.6, 0, 0.4); }); }
      }
      if (state === 3 && !on) state = 0;
      if (state === 1 || state === 2) drawMeter(v);
    });
  },

  // 222 WEST 23RD STREET. A lobby hung to the ceiling with art paid as rent, and a stairwell twelve storeys up. Look straight up.
  chelsea(c, r, g, X) {
    const { THREE } = c, iron = std(c, 0x1a1a1a, { metalness: 0.6, roughness: 0.4 }), plaster = c.surf('plaster', 2.4, 0xc8b898);
    // the well: an open square in the ceiling over the stair, twelve floors of landings, art on every one
    const [WX, WZ, S] = r.well, FLOORS = 12, FH = 3.4;
    const shaft = new THREE.Group(); shaft.position.set(WX, H_IN, WZ); g.add(shaft);
    for (let f = 0; f < FLOORS; f++) { const y = f * FH;
      for (const [dx, dz, w, d] of [[0, -S / 2, S, 0.12], [0, S / 2, S, 0.12], [-S / 2, 0, 0.12, S], [S / 2, 0, 0.12, S]]) shaft.add(c.slab(w + 0.12, FH, d + 0.12, plaster, dx * 1.04, y + FH / 2, dz * 1.04));
      // a landing rail and a little balcony on each floor
      for (const [dx, dz, w, d] of [[0, -S / 2 + 0.5, S - 0.3, 0.04], [-S / 2 + 0.5, 0, 0.04, S - 0.3]]) shaft.add(c.slab(w, 0.05, d, iron, dx, y + 0.95, dz));
      shaft.add(c.slab(S - 0.3, 0.08, 0.5, std(c, 0x6a5a48), 0, y + 0.02, -S / 2 + 0.3));
      const art = decal(c, 0.8, 0.6, (q, w, h) => { q.fillStyle = INK[f % 6]; q.fillRect(0, 0, w, h); eyeFlower(q, w / 2, h / 2, h * 0.36); q.strokeStyle = '#c9a033'; q.lineWidth = 8; q.strokeRect(0, 0, w, h); });
      art.position.set(S / 2 - 0.08, y + 1.8, 0.4 * ((f % 2) ? 1 : -1)); art.rotation.y = -PI / 2; shaft.add(art);
    }
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(S, S), basic(c, 0xbfe0ff)); sky.rotation.x = PI / 2; sky.position.y = FLOORS * FH; shaft.add(sky);
    // the spiral stair rising into the well
    const stair = new THREE.Group(); stair.position.set(WX, 0, WZ); g.add(stair);
    for (let s = 0; s < 34; s++) { const a = s * 0.42, st = c.slab(1.2, 0.06, 0.38, std(c, 0x2a2a2a, { metalness: 0.5 }), Math.cos(a) * 0.8, s * 0.19, Math.sin(a) * 0.8); st.rotation.y = -a; stair.add(st); }
    stair.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 6.6, 10), iron)).position.y = 3.3;
    c.post(X(WX), WZ, 1.45);
    // the front desk, the bell and the clerk
    g.add(c.slab(3.2, 1.1, 0.8, std(c, 0x3a2414), 4.4, 0.55, -6.6)); c.wall(X(2.8), -6.2, X(6.0), -6.2);
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 8, 0, PI * 2, 0, PI / 2), std(c, 0xd6a640, { metalness: 1, roughness: 0.2 })); bell.position.set(3.4, 1.12, -6.3); g.add(bell);
    c.clickable(bell, () => { c.sound.ding(); c.egg('rent', 'Ding. Rent? The manager will take a painting. Or a song, or a chapter, or a promise. It is that kind of hotel.'); }, 'Ring for the manager');
    cast(c, r, g, X, 'bookseller', 4.6, -7.4, { h: 1.75, ry: 0, rad: 0, line: 'Room 100 is taken. Room 211 is taken. Everything is taken. Leave a painting and come back in ten years.', egg: 'desk', hint: 'The desk' });
    // the fireplace
    g.add(c.slab(2.0, 1.6, 0.5, std(c, 0x4a3a30), 0.5, 0.8, -1.0)); const fire = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,140,60,.9)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); fire.position.set(0.8, 0.5, -1.0); g.add(fire);
    c.tick((t) => fire.scale.setScalar(0.9 + Math.sin(t * 9) * 0.1 + Math.sin(t * 23) * 0.05));
    cast(c, r, g, X, 'pigeonlady', 6.2, -2.4, { h: 1.75, ry: 0.9, line: 'I have lived on the seventh floor since the Johnson administration. Andrew Johnson.', egg: 'resident', hint: 'A resident' });
    cast(c, r, g, X, 'loretta', 9.4, -4.6, { h: 1.75, ry: 0.4, line: 'Songs get written in the rooms upstairs. Some of them get written about the rooms upstairs.', egg: 'songwriter', hint: 'A songwriter' });
    // look straight up: the well stretches away and pulls you in
    const fw = new THREE.Vector3(); let up = 0;
    r.fov = (P) => { const under = Math.hypot(P.x - r.x0 - WX, P.z - WZ) < 2.6; return under ? 66 - up * 30 : 66; };
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) { up = 0; shaft.scale.y = 1; return; }
      c.camera.getWorldDirection(fw); const under = Math.hypot(P.x - r.x0 - WX, P.z - WZ) < 2.6;
      up += ((under && fw.y > 0.8 ? 1 : 0) - up) * Math.min(1, dt * 0.8); shaft.scale.y = 1 + up * 1.6;
      if (up > 0.9) c.egg('vertigo', 'Twelve floors of artists, straight up. Look long enough and the stairwell keeps going. People have been looking up this well for a hundred and forty years.');
    });
    const lbl = c.sign('LOOK STRAIGHT UP', { w: 1.6, h: 0.22, bg: '#0d0d0d', fg: '#f5c542', font: c.MONO, weight: 700 }); lbl.position.set(WX, 2.2, WZ + S / 2 + 0.3); g.add(lbl);
  },
};
