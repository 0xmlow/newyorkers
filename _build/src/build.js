// CLOUDS AND DIRT, floor by floor. A tower for Gary Vaynerchuk built by NEW YORKERS: the dirt in the basement, the clouds on
// the roof, VaynerMedia on 25, VeeFriends on 268. Every member of the cast has an eye flower for a head: the man himself
// appears only as MLow painted him, and the only faces are his portraits.
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { W, D, H_IN, PORTAL } from './rooms.js';
import { crowdBody, crowdParts, CROWD } from './crowd.js';

const PI = Math.PI;
const INK = ['#f5c542', '#ff4fa3', '#22d3ee', '#3b82f6', '#ffffff', '#ff7a1a'];
const GREEN = '#125740', JETS = 0x125740;
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
  m.ceil = r.ceil ? c.surf(r.ceil, 3, 0x5a5650) : null;
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
// the tower's crowd (crowd.js): office and street New Yorkers, walkers and suits; the guards stay the usher (cast)
const CLOUDS_CROWD = ['workgirl', 'wiseguy', 'cabbie', 'editor', 'annieh', 'rosemary', 'writer', 'tough', 'bartender', 'hustler', 'susan', 'oscar'];

// a seated or standing extra; since 2026-10-28 its body is one of the cast cut for crowds (crowd.js), the cylinder and box
// hidden once it lands; ?crowd=old keeps them
function extra(c, g, x, z, { seated = false, col = 0x3a4a6a, ry = 0, pool, crowd = true } = {}) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, 0, z); o.rotation.y = ry; g.add(o);
  const h = seated ? 0.45 : 0, body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.72, 12), std(c, col, { roughness: 0.8 })); body.position.y = h + (seated ? 0.36 : 1.0); o.add(body);
  let legs = null; if (!seated) { legs = c.slab(0.32, 0.64, 0.16, std(c, 0x1a1a22), 0, 0.32, 0); o.add(legs); }
  HEAD.t ||= c.canvasTex(256, 256, (q, w) => eyeFlower(q, w / 2, w / 2, w / 2 * 0.98));
  const head = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshStandardMaterial({ map: HEAD.t, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, roughness: 0.6 }));
  head.position.y = h + (seated ? 0.98 : 1.62); o.add(head); o.userData.head = head;
  if (crowd) crowdBody(o, { seated, col, hide: legs ? [body, legs, head] : [body, head], pool: pool || (seated ? 'seated' : CLOUDS_CROWD) });   // the whole cast character (crowd.js), its own flower head; the sprite hidden once it lands
  return o;
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
    q.fillStyle = '#f4ead2'; q.font = `800 ${w * 0.038}px ${c.MONO}`; q.fillText('CLOUDS AND DIRT', w / 2, h * 0.12); q.fillText((r.name || '').toUpperCase().slice(0, 26), w / 2, h * 0.9);
  }, 512);
  board.position.set(W / 2 - PORTAL.w / 2 - 1.0, r.low ? 1.1 : 1.8, -D / 2 + 0.03);
  g.add(board);
}
// every floor is being filmed: a phone on a tripod by the far door, and a stack of three wine cases. The house always
// brings its own: the phone is how the man documents, the cases are where he came from.
function dressing(c, r, g, X) {
  const { THREE } = c, black = std(c, 0x151515, { roughness: 0.7 });
  const tri = new THREE.Group(); tri.position.set(W - 1.6, 0, D / 2 - 1.3); tri.rotation.y = -2.5; g.add(tri);
  for (const a of [0, 2.1, 4.2]) { const leg = c.slab(0.03, 1.5, 0.03, black, Math.sin(a) * 0.28, 0.75, Math.cos(a) * 0.28); leg.rotation.z = Math.sin(a) * 0.18; leg.rotation.x = -Math.cos(a) * 0.18; tri.add(leg); }
  tri.add(c.slab(0.12, 0.24, 0.02, black, 0, 1.62, 0));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.2), basic(c, 0x111111)); scr.position.set(0, 1.62, 0.012); tri.add(scr);
  const rec = new THREE.Mesh(new THREE.CircleGeometry(0.012, 8), basic(c, 0xff2020)); rec.position.set(0.03, 1.7, 0.013); tri.add(rec);
  c.tick((t) => { rec.visible = Math.sin(t * 4) > 0; });
  c.clickable(tri, () => c.egg('rolling', 'The phone was rolling the whole time. Document, do not create: the day itself is the content, this walk included.'), 'The phone on the tripod');
  c.post(X(W - 1.6), D / 2 - 1.3, 0.45);
  const crate = new THREE.Group(); crate.position.set(W - 3.0, 0, D / 2 - 0.7); g.add(crate);
  for (let k = 0; k < 3; k++) { const b = c.slab(0.5, 0.33, 0.34, new THREE.MeshStandardMaterial({ map: caseTex(c, r.i * 3 + k), roughness: 0.9 }), (k === 2 ? 0.04 : 0), 0.17 + k * 0.34, 0); b.rotation.y = k * 0.15 - 0.1; crate.add(b); }
  c.post(X(W - 3.0), D / 2 - 0.7, 0.35);
}
// a cardboard wine case, stencilled, never a real label
const CASE_NAMES = ['NEW YORKERS', 'N3W', 'COUNTED', 'MLOW', 'CLOUDS', 'DIRT', 'VEE', 'FIVE', 'EYE FLOWER', 'THE CENSUS', 'HUSTLE', 'PATIENCE'];
const _CASE = {};
function caseTex(c, seed) {
  const k = seed % 12; if (_CASE[k]) return _CASE[k];
  return (_CASE[k] = c.canvasTex(256, 160, (q, w, h) => {
    q.fillStyle = ['#b8905a', '#a8824e', '#c49a66'][k % 3]; q.fillRect(0, 0, w, h); q.strokeStyle = 'rgba(0,0,0,.18)'; q.lineWidth = 3; q.strokeRect(6, 6, w - 12, h - 12);
    q.fillStyle = '#2a1a0a'; q.font = `900 30px ${c.MONO}`; q.textAlign = 'center'; q.fillText(CASE_NAMES[k], w / 2, h / 2 + 10);
    q.font = `700 13px ${c.MONO}`; q.fillText('12 x 750 ML · THIS SIDE UP', w / 2, h - 18); eyeFlower(q, 34, 34, 18);
  }));
}
// a velvet rope a step in front of the photograph: plates are made to be seen from the room
function rope(c, r, g, X) {
  const { THREE } = c, z = -D / 2 + 1.25, x1 = (W - PORTAL.w) / 2 + 0.3, x2 = (W + PORTAL.w) / 2 - 0.3, n = 6;
  const brass = std(c, 0xd6a640, { metalness: 1, roughness: 0.25 }), red = std(c, 0x0f5a2a, { roughness: 0.85 });
  const post = new THREE.CylinderGeometry(0.035, 0.05, 0.95, 12), base = new THREE.CylinderGeometry(0.16, 0.18, 0.04, 20), knob = new THREE.SphereGeometry(0.06, 12, 10);
  for (let i = 0; i <= n; i++) {
    const x = x1 + (x2 - x1) * i / n, p = new THREE.Mesh(post, brass); p.position.set(x, 0.48, z); g.add(p);
    const b = new THREE.Mesh(base, brass); b.position.set(x, 0.02, z); g.add(b); const k = new THREE.Mesh(knob, brass); k.position.set(x, 0.98, z); g.add(k);
    if (i < n) { const seg = (x2 - x1) / n, curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x, 0.9, z), new THREE.Vector3(x + seg / 2, 0.62, z), new THREE.Vector3(x + seg, 0.9, z)); g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.025, 6), red)); }
  }
  c.wall(X(x1), z, X(x2), z); c.wall(X(x1), z, X(x1), -D / 2); c.wall(X(x2), z, X(x2), -D / 2);
  const q = c.sign('THE PICTURE STARTS HERE', { w: 1.9, h: 0.2, bg: '#111', fg: '#f5c542', font: c.MONO, weight: 700 }); q.position.set(W / 2, 0.82, z + 0.04); g.add(q);
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
function plaque(c, g, x, y, z, ry, text, who = 'GARY VAYNERCHUK', w = 1.6) {
  const s = c.sign(`"${text}"\n${who}`, { w, h: w * 0.28, bg: '#f4ead2', fg: '#111', font: c.SERIF, weight: 700, px: 160, pad: 0.1 });
  s.position.set(x, y, z); s.rotation.y = ry; g.add(s); return s;
}

// ---------- the props per floor (Poly Haven CC0 and the house models) ----------
const PROPS = {
  lobby: [
    ['potted_plant_02', 0.9, 6.9, { h: 1.6, r: 0.4 }], ['potted_plant_02', 19.1, 6.9, { h: 1.6, r: 0.4 }], ['potted_plant_04', 1.0, -6.6, { h: 1.3, r: 0.4 }],
    ['modern_ceiling_lamp_01', 5, -2, { h: 0.6, y: 5.3 }], ['modern_ceiling_lamp_01', 15, -2, { h: 0.6, y: 5.3 }],
    ['painted_wooden_bench', 4.2, 4.6, { len: 2.2, ry: 0.5, r: 0.9 }], ['painted_wooden_bench', 15.8, 4.6, { len: 2.2, ry: -0.5, r: 0.9 }],
    ['security_camera_01', 19.6, 7.4, { h: 0.3, y: 5.4, ry: 2.4 }],
  ],
  dirt: [
    ['hand_truck', 2.2, -5.4, { h: 1.2, ry: 0.5, r: 0.45, egg: ['The dolly', 'dolly', 'Forty cases a day up these stairs at fourteen. Nobody called it hustle yet. It was just Saturday.'] }],
    ['cardboard_box_01', 17.8, -6.4, { len: 0.6, r: 0.4 }], ['cardboard_box_01', 17.8, -6.4, { len: 0.55, y: 0.42, ry: 0.4 }], ['cardboard_box_01', 18.6, -5.6, { len: 0.6 }],
    ['wine_barrel_01', 1.4, 0.4, { h: 0.9, r: 0.5 }], ['wooden_crate_01', 1.2, -2.2, { len: 0.8, r: 0.5 }],
    ['mounted_fluorescent_lights', 6, 0, { len: 1.3, y: 5.85 }], ['mounted_fluorescent_lights', 14, 0, { len: 1.3, y: 5.85 }],
    ['metal_office_desk', 16.4, 1.2, { len: 1.5, ry: -PI / 2, r: 0.8 }], ['classic_laptop', 16.4, 1.2, { len: 0.4, y: 0.76, ry: -PI / 2 }],
    ['folding_wooden_stool', 15.4, 1.2, { h: 0.5, r: 0.3 }], ['plastic_crate_01', 3.2, 6.4, { h: 0.32, r: 0.35 }],
    ['wine_bottles_01', 1.0, 3.2, { h: 0.35, y: 1.3 }],
  ],
  library: [
    ['vintage_video_camera', 14.2, 1.6, { h: 0.5, y: 1.32, ry: PI * 0.9, egg: ['The camcorder', 'camcorder', 'One camera, one take, a thousand episodes. Nobody edited the spit out.'] }],
    ['wine_bottles_01', 0.5, -4.0, { h: 0.35, y: 1.6 }], ['wine_bottles_01', 0.5, -2.4, { h: 0.35, y: 1.6 }], ['wine_bottles_01', 0.5, -0.8, { h: 0.35, y: 2.2 }],
    ['wine_barrel_01', 18.6, -5.2, { h: 0.9, r: 0.5 }], ['wine_barrel_01', 18.6, -3.6, { h: 0.9, r: 0.5 }],
    ['desk_lamp_arm_01', 7.6, -3.4, { h: 0.5, y: 0.92, ry: 0.4 }], ['american_football', 12.6, -3.3, { len: 0.3, y: 0.98, ry: 0.6, egg: ['A football on a wine desk', 'desk_ball', 'A football on a wine desk. He said he would own the team one day. He said it on every episode.'] }],
    ['ceiling_fan', 10, 0, { len: 1.3, y: 5.6 }], ['wall_clock', 19.8, -1.0, { h: 0.5, y: 2.6, ry: -PI / 2 }],
  ],
  crush: [
    ['caged_hanging_light', 5, -2, { h: 0.5, y: 5.2 }], ['caged_hanging_light', 15, -2, { h: 0.5, y: 5.2 }],
    ['metal_stool_01', 17.2, -5.6, { h: 0.7, r: 0.3 }], ['plastic_bottle_gallon', 17.2, -5.6, { h: 0.3, y: 0.7 }],
    ['wooden_bookshelf_worn', 0.4, 5.6, { h: 2.2, ry: PI / 2, r: 0.5 }], ['book_encyclopedia_set_01', 0.4, 5.6, { len: 0.6, y: 1.1, ry: PI / 2 }],
    ['dartboard', 19.8, 6.4, { h: 0.5, y: 1.9, ry: -PI / 2, egg: ['A dartboard', 'darts', 'The dartboard is what every post feels like before it lands. Throw a hundred. Count the ones that stick.'] }],
  ],
  hudson: [
    ['modern_arm_chair_01', 3.2, -1.0, { h: 0.9, ry: 0.2, r: 0.45 }], ['modern_arm_chair_01', 6.6, -1.0, { h: 0.9, ry: -0.2, r: 0.45 }], ['modern_arm_chair_01', 3.2, 2.2, { h: 0.9, ry: PI, r: 0.45 }], ['modern_arm_chair_01', 6.6, 2.2, { h: 0.9, ry: PI, r: 0.45 }],
    ['wine_bottles_01', 0.5, -5.6, { h: 0.35, y: 1.3 }], ['wine_bottles_01', 0.5, -4.6, { h: 0.35, y: 1.3 }], ['wine_bottles_01', 0.5, -5.6, { h: 0.35, y: 2.0 }], ['wine_bottles_01', 0.5, -4.6, { h: 0.35, y: 2.0 }], ['wine_bottles_01', 0.5, -3.6, { h: 0.35, y: 1.3 }], ['wine_bottles_01', 0.5, -3.6, { h: 0.35, y: 2.0 }],
    ['potted_plant_01', 1.0, 6.9, { h: 1.6, r: 0.4 }], ['potted_plant_02', 19.0, -6.9, { h: 1.6, r: 0.4 }],
    ['standing_chalkboard_01', 2.4, 5.2, { h: 1.7, ry: 0.5, r: 0.5, egg: ['The whiteboard', 'board', 'The pyramid on the board: one long piece at the top, sixty four short ones underneath. The whole company, drawn in a minute.'] }],
    ['hanging_industrial_lamp', 10, 0, { h: 0.5, y: 5.3 }], ['hanging_industrial_lamp', 5, 3, { h: 0.5, y: 5.3 }],
    ['sofa_02', 10.4, 6.2, { len: 2.2, ry: PI, r: 1.0 }], ['modern_coffee_table_01', 10.4, 4.6, { len: 1.0, r: 0.5 }],
  ],
  studio: [
    ['Camera_01', 6.4, 2.2, { h: 0.25, y: 1.36, ry: 0.5 }], ['vintage_video_camera', 13.8, 2.6, { h: 0.5, y: 1.3, ry: -0.6 }],
    ['filmstrip_projector_8mm', 18.8, -6.2, { len: 0.45, y: 1.0 }], ['side_table_tall_01', 18.8, -6.2, { h: 1.0, r: 0.3 }],
    ['mid_century_lounge_chair', 8.2, -3.6, { h: 0.9, ry: 0.4, r: 0.45 }], ['mid_century_lounge_chair', 11.8, -3.6, { h: 0.9, ry: -0.4, r: 0.45 }],
    ['potted_plant_04', 1.0, -6.9, { h: 1.3, r: 0.4 }], ['potted_plant_04', 19.0, 6.9, { h: 1.3, r: 0.4 }],
    ['alarm_clock_01', 18.2, 1.0, { len: 0.2, y: 1.0, egg: ['An alarm clock', 'alarm', 'It is set for 4:30. The content does not care whether you slept.'] }], ['side_table_01', 18.2, 1.0, { h: 0.6, r: 0.3 }],
  ],
  empathy: [
    ['Chandelier_02', 10, -2, { h: 1.2, y: 5.4 }], ['brass_vase_01', 1.0, -7.2, { h: 0.5, y: 1.0 }], ['ClassicConsole_01', 1.0, -7.2, { len: 1.2, ry: PI / 2, r: 0.5 }],
    ['carved_wooden_elephant', 10, 7.0, { h: 0.9, ry: PI, r: 0.5, egg: ['A wooden elephant', 'elephant', 'Empathy Elephant, carved. It never forgets how the other person felt. Neither should the room.'] }],
    ['planter_box_01', 4.0, 7.0, { len: 1.0, r: 0.5 }], ['planter_box_01', 16.0, 7.0, { len: 1.0, r: 0.5 }],
  ],
  carousel: [
    ['street_lamp_01', 1.4, -5.6, { h: 4.6, r: 0.25 }], ['street_lamp_01', 18.6, -5.6, { h: 4.6, r: 0.25 }],
    ['painted_wooden_bench', 2.4, 6.4, { len: 2.0, ry: 0.4, r: 0.8 }], ['painted_wooden_bench', 17.6, 6.4, { len: 2.0, ry: -0.4, r: 0.8 }],
    ['metal_trash_can', 18.8, 1.6, { h: 0.95, r: 0.35 }], ['shrub_01', 0.8, 3.0, { h: 1.2, r: 0.5 }], ['shrub_02', 19.2, -1.6, { h: 1.2, r: 0.5 }],
  ],
  veecon: [
    ['portable_searchlight', 1.2, 6.4, { h: 1.1, ry: 0.6, r: 0.4 }], ['portable_searchlight', 18.8, 6.4, { h: 1.1, ry: -0.6, r: 0.4 }],
    ['Megaphone_01', 17.4, 5.2, { len: 0.45, y: 1.05, ry: -1.2, egg: ['A megaphone', 'megaphone', 'Seven thousand people from forty seven states and seventy countries, and he still wanted the megaphone.'] }], ['plastic_crate_02', 17.4, 5.2, { h: 0.4, r: 0.3 }],
    ['concrete_road_barrier', 4.0, 1.4, { len: 1.6 }], ['concrete_road_barrier', 16.0, 1.4, { len: 1.6 }],
  ],
  attention: [
    ['nyb_wallst_bull', 3.0, 5.0, { len: 2.2, ry: 0.6, r: 1.0, raw: true, egg: ['The bull', 'bullish', 'Bullish Bull. Real name, real character, hand drawn in marker. It has been bullish on attention since 2021.'] }],
    ['metal_office_desk', 16.6, 5.4, { len: 1.5, ry: PI, r: 0.8 }], ['classic_laptop', 16.6, 5.4, { len: 0.4, y: 0.76, ry: PI }], ['office_notepads', 15.8, 5.4, { len: 0.25, y: 0.76 }],
    ['wall_clock', 0.2, 6.0, { h: 0.5, y: 2.8, ry: PI / 2 }], ['wall_clock', 0.2, 4.0, { h: 0.5, y: 2.8, ry: PI / 2 }], ['wall_clock', 0.2, 2.0, { h: 0.5, y: 2.8, ry: PI / 2 }],
    ['mounted_fluorescent_lights', 6, 0, { len: 1.3, y: 5.85 }], ['mounted_fluorescent_lights', 14, 0, { len: 1.3, y: 5.85 }],
  ],
  jets: [
    ['sofa_02', 3.6, -2.0, { len: 2.2, ry: 0, r: 1.0 }], ['sofa_02', 16.4, -2.0, { len: 2.2, ry: 0, r: 1.0 }], ['modern_coffee_table_02', 3.6, -4.0, { len: 1.0, r: 0.5 }],
    ['american_football', 16.0, 6.4, { len: 0.3, y: 1.06, ry: 0.4 }],
    ['brass_goblets', 17.6, 6.6, { len: 0.3, y: 1.06 }], ['wine_bottles_01', 18.4, 6.6, { h: 0.35, y: 1.06 }],
    ['Television_01', 0.6, 6.0, { len: 0.9, y: 2.2, ry: PI / 2 }],
  ],
  clouds: [
    ['painted_wooden_bench', 4.0, 1.0, { len: 2.2, ry: 0.3, r: 0.9 }], ['painted_wooden_bench', 16.0, 1.0, { len: 2.2, ry: -0.3, r: 0.9 }],
    ['vintage_binocular', 10.0, -5.4, { h: 0.3, y: 1.3, ry: 0 }], ['planter_pot_clay', 1.0, 6.0, { h: 0.8, r: 0.4 }], ['planter_pot_clay', 19.0, 6.0, { h: 0.8, r: 0.4 }],
    ['shrub_01', 1.0, 6.0, { h: 1.0, y: 0.6 }], ['shrub_02', 19.0, 6.0, { h: 1.0, y: 0.6 }],
  ],
};

// ---------- hanging plans ----------
// the honoraries hang first (the pieces marked honor), big, where the room says; the census New Yorkers take the rest
function slotsDefault() {
  const S = [], south = D / 2 - 0.14;
  for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 2.1, z: south, ry: PI, w: 1.5 });
  [-6.6, -4.2, -1.8].forEach((z) => S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 }));
  [-4.2, -1.8].forEach((z) => S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 }));
  return S;
}
const SLOTS = {
  // the two portraits of the man, large, on the west wall, where Park Avenue light reaches them
  empathy: () => { const S = [{ x: 0.14, y: 2.4, z: -4.6, ry: PI / 2, w: 3.2, honor: true }, { x: 0.14, y: 2.4, z: 0.4, ry: PI / 2, w: 2.2, honor: true }]; for (let i = 0; i < 6; i++) S.push({ x: 2.4 + i * 3.04, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.5 }); [-4.2, -1.8, 0.6].forEach((z) => S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 })); return S; },
  // the carousel portrait on the east wall, big
  carousel: () => { const S = [{ x: W - 0.14, y: 2.6, z: -2.4, ry: -PI / 2, w: 3.4, honor: true }]; for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.5 }); [-6.6, -4.2].forEach((z) => S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 })); return S; },
  // the VaynerMedia alumna by the wine wall
  hudson: () => { const S = [{ x: 0.14, y: 2.2, z: 1.6, ry: PI / 2, w: 1.8, honor: true }]; for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.5 }); [-4.2, -1.8].forEach((z) => S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 })); return S; },
  // the studio hangs on the south wall only; the west wall is the two cent wall
  studio: () => { const S = []; for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.5 }); [-4.2, -1.8, 0.6].forEach((z) => S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 })); return S; },
  // the exchange keeps its west wall for the clocks and the board
  attention: () => { const S = []; for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.5 }); [-4.2, -1.8, 0.6].forEach((z) => S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 })); return S; },
  // the clouds have no walls worth the name: the railing posts carry the New Yorkers like a street show
  clouds: () => { const S = []; for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 1.9, z: D / 2 - 0.14, ry: PI, w: 1.4 }); [-4.2, -1.8].forEach((z) => S.push({ x: 0.14, y: 1.9, z, ry: PI / 2, w: 1.3 })); return S; },
};

// ---------- the floors ----------
const V3 = (c, x, y, z) => new c.THREE.Vector3(x, y, z);
import { ROOMS } from './rooms.js';
const ROOM = {
  // THE LOBBY. A directory, a lift with twelve buttons, a guard, MLOWTAR, and a suitcase from 1978 turned to stone.
  lobby(c, r, g, X) {
    const { THREE } = c;
    const neon = c.sign('CLOUDS AND DIRT', { w: 7, h: 1.1, bg: null, fg: '#f5c542', font: c.SERIF, weight: 900, glow: 22 });
    neon.position.set(W / 2, PORTAL.h + 0.75, -D / 2 + 0.06); g.add(neon);
    const sub = c.sign('A TOWER FOR GARY VAYNERCHUK · BUILT BY NEW YORKERS · THE DIRT IS DOWNSTAIRS', { w: 7.2, h: 0.3, bg: null, fg: '#22d3ee', font: c.MONO, weight: 700, glow: 10 }); sub.position.set(W / 2, PORTAL.h + 0.12, -D / 2 + 0.06); g.add(sub);
    // the directory on the west wall: every floor, clickable
    const lines = ROOMS.map((q) => `${q.lvl.padStart(4, ' ')}   ${q.name.toUpperCase()}`).reverse();
    const dir = c.sign('DIRECTORY\n' + lines.join('\n'), { w: 3.6, h: 4.2, bg: '#0d0d0d', fg: '#f4ead2', font: c.MONO, weight: 600, px: 640, pad: 0.08, border: '#c9a033' });
    dir.position.set(0.16, 2.6, -2.0); dir.rotation.y = PI / 2; g.add(dir);
    c.clickable(dir, () => { const p = c.lastHit?.point; if (!p) return; const u = (p.y - 0.5) / 4.2, n = ROOMS.length; const k = Math.max(0, Math.min(n - 1, Math.floor(u * (n + 1)) - 1)); const q = ROOMS[Math.max(0, Math.min(n - 1, k))]; c.toast(`${q.lvl}: ${q.name}. ${q.kicker}`, 3600); c.sound.click(); }, 'The directory');
    // the lift: a car in the south east corner with twelve brass buttons. Press one and you are there.
    const steel = std(c, 0x9a9ca0, { metalness: 0.9, roughness: 0.3 }), brass = std(c, 0xc9a033, { metalness: 1, roughness: 0.3 });
    const LX = 16.5, LZ = 6.6;
    g.add(c.slab(0.2, 3.2, 2.4, steel, LX - 1.6, 1.6, LZ)); g.add(c.slab(0.2, 3.2, 2.4, steel, LX + 1.6, 1.6, LZ)); g.add(c.slab(3.4, 0.3, 2.4, steel, LX, 3.35, LZ));
    g.add(c.slab(3.4, 3.2, 0.2, std(c, 0x2a2a30, { metalness: 0.6, roughness: 0.4 }), LX, 1.6, LZ + 1.2));
    c.wall(X(LX - 1.6), LZ - 1.2, X(LX - 1.6), LZ + 1.2); c.wall(X(LX + 1.6), LZ - 1.2, X(LX + 1.6), LZ + 1.2);
    const dL = c.slab(1.5, 3.1, 0.08, steel, LX - 0.78, 1.55, LZ - 1.2), dR = c.slab(1.5, 3.1, 0.08, steel, LX + 0.78, 1.55, LZ - 1.2); g.add(dL); g.add(dR);
    const lamp = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.2), basic(c, 0xf5c542)); lamp.position.set(LX, 3.6, LZ - 1.25); g.add(lamp);
    let open = 1, want = 1, going = -1, t0 = 0;
    const panel = c.slab(0.9, 1.6, 0.06, std(c, 0x1a1a1a), LX + 1.47, 1.5, LZ + 0.2); panel.rotation.y = -PI / 2; g.add(panel);
    ROOMS.forEach((q, k) => {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 16), brass); b.rotation.z = PI / 2; b.position.set(LX + 1.43, 0.85 + (k % 6) * 0.24, LZ - 0.35 + Math.floor(k / 6) * 0.3); g.add(b);
      const lb = c.sign(q.lvl, { w: 0.14, h: 0.1, bg: null, fg: '#f4ead2', font: c.MONO, weight: 700, px: 48 }); lb.position.set(LX + 1.42, 0.85 + (k % 6) * 0.24 + 0.1, LZ - 0.35 + Math.floor(k / 6) * 0.3); lb.rotation.y = -PI / 2; g.add(lb);
      c.clickable(b, () => { if (going >= 0) return; going = k; t0 = c.TIME.t; want = 0; c.sound.lift(); c.toast(`Going to ${q.lvl}: ${q.name}.`, 2200); if (q.lvl === '5') c.egg('five', 'Five. The first number his mother knitted on a jersey in Queens, and still his number. The pickleball team is called the 5s.'); c.egg('lift'); }, `Floor ${q.lvl}: ${q.name}`);
    });
    c.tick((t, dt, P, ri) => {
      open += (want - open) * Math.min(1, dt * 3); dL.position.x = LX - 0.78 - open * 0.0 - (1 - open) * 0 + (open - 1) * 0.72 * -1 * 0 ; dL.position.x = LX - 0.78 - (1 - open) * 0 + 0; dL.scale.x = Math.max(0.02, open); dR.scale.x = Math.max(0.02, open);
      dL.position.x = LX - 0.78 - (1 - open) * 0.75 * 0; dR.position.x = LX + 0.78;
      if (going >= 0 && t - t0 > 1.3) { const k = going; going = -1; want = 1; window.__go && window.__go(k); }
      lamp.material.color.set(going >= 0 ? 0xff4fa3 : 0xf5c542);
    });
    // the guard at the desk, and MLOWTAR, who picks your floor
    g.add(c.slab(3.6, 1.05, 0.9, std(c, 0x111111, { roughness: 0.5 }), 3.4, 0.52, -6.2)); c.wall(X(1.6), -5.7, X(5.2), -5.7);
    cast(c, r, g, X, 'maitre', 3.4, -7.0, { h: 1.8, ry: 0, rad: 0, line: 'Sign in. Everybody signs in. He signed in on his first day in 1978 with a suitcase and a number five.', egg: 'guard', hint: 'The desk' });
    const ml = cast(c, r, g, X, 'mlowtar', 17.6, -6.4, { h: 2.2, ry: -0.5, rad: 0.55 });
    const picks = ['The dirt. Start in the basement, everybody does.', 'Floor 25. Stand in the ring light and watch yourself multiply.', 'The carousel. Wait on the panda. Eleven seconds.', 'The clouds. The words only line up from the stars.', 'The box. Throw one through the uprights for a kid from Queens.', 'The exchange. Buy the attention nobody wants yet.'];
    c.clickable(ml, () => { c.say(ml, 'MLOWTAR SAYS: ' + picks[(Math.random() * picks.length) | 0], 4200, 2.5); c.egg('mlowtar'); c.sound.ding(); }, 'MLOWTAR picks your floor');
    // the relic: a suitcase from Babruysk, by way of Queens, excavated. One Arsham moment per gallery.
    const plinth = c.slab(1.4, 0.7, 1.0, std(c, 0xe8e4dc, { roughness: 0.9 }), 10, 0.35, -1.2); g.add(plinth); c.post(X(10), -1.2, 0.9);
    const sc = c.glb('ph_vintage_suitcase', { len: 0.9, x: 10, y: 0.7, z: -1.2, ry: 0.3, parent: g, onload: (gg, inner) => { inner.traverse((m) => { if (m.isMesh) m.material = std(c, 0xd8d4cc, { roughness: 0.95 }); }); } });
    const crystal = new THREE.MeshStandardMaterial({ color: 0x7fd4ff, emissive: 0x7fd4ff, emissiveIntensity: 0.6, roughness: 0.2 });
    for (let k = 0; k < 9; k++) { const o = new THREE.Mesh(new THREE.OctahedronGeometry(0.05 + Math.random() * 0.06), crystal); o.position.set(10 + (Math.random() - 0.5) * 0.7, 0.78 + Math.random() * 0.22, -1.2 + (Math.random() - 0.5) * 0.4); o.rotation.set(Math.random() * 3, Math.random() * 3, 0); g.add(o); }
    plaque(c, g, 10, 0.5, -0.68, 0, '1978. One suitcase, Babruysk to Queens. The number on the jersey was five.', 'THE ARRIVAL', 1.3);
    c.clickable(sc, () => c.egg('suitcase', 'The suitcase, excavated. It has been a thousand years and the number five is still in it.'), 'The suitcase');
    // the doodle on the back wall is on the plate; a second cloud and dirt doodle hangs by the lift as a sign
    const dd = decal(c, 1.6, 1.0, (q, w, h) => { q.fillStyle = '#f4ead2'; q.fillRect(0, 0, w, h); q.strokeStyle = '#111'; q.lineWidth = 7; q.lineCap = 'round'; q.beginPath(); for (let i = 0; i < 7; i++) q.arc(w * (0.25 + i * 0.085), h * 0.3 + Math.sin(i) * 8, 24, 0, 7); q.stroke(); q.beginPath(); q.moveTo(w * 0.15, h * 0.85); for (let i = 0; i <= 10; i++) q.lineTo(w * (0.15 + i * 0.07), h * 0.85 - Math.abs(Math.sin(i * 1.7)) * 30); q.stroke(); q.font = `900 ${h * 0.14}px ${c.FONT}`; q.fillStyle = '#111'; q.textAlign = 'center'; q.fillText('CLOUDS', w / 2, h * 0.17); q.fillText('DIRT', w / 2, h * 0.98 - 4); }, 256);
    dd.position.set(13.2, 2.0, D / 2 - 0.13); dd.rotation.y = PI; g.add(dd);
    c.clickable(dd, () => c.egg('doodle', 'Clouds and dirt. The big beliefs up top, the daily work down here, and nothing in the middle worth your time. Chapter one, 2016.'), 'The doodle');
    c.tick((t, dt, P, ri) => { neon.material.opacity = ri === r.i && Math.sin(t * 13) > 0.97 ? 0.4 : 1; neon.material.transparent = true; });
  },

  // THE DIRT, 1994. A stockroom, a folding table of finds, a dial up tone. Trash Talk: buy low, sell on the internet.
  dirt(c, r, g, X) {
    const { THREE } = c;
    const tbl = c.slab(3.4, 0.06, 1.0, std(c, 0x8a8a8a, { metalness: 0.4, roughness: 0.5 }), 10, 0.76, -2.4); g.add(tbl);
    const tlegs = [[8.5, -2.8], [11.5, -2.8], [8.5, -2.0], [11.5, -2.0]].map(([x, z]) => { const l = c.slab(0.04, 0.76, 0.04, std(c, 0x333333), x, 0.38, z); g.add(l); return l; });
    // 2026-10-28: two Poly Haven steel desks (metal_office_desk, CC0, already shipped by ON LOCATION) at their own 2 m and 0.79 m,
    // so the finds sit on their tops as on the slab; the slab and its legs hide once both land
    let desks = 0; [9.0, 11.0].forEach((x) => c.glb('ph_metal_office_desk', { len: 2.0, x, z: -2.4, parent: g, onload: () => { if (++desks === 2) [tbl, ...tlegs].forEach((m) => { m.visible = false; }); } }));
    c.wall(X(8.2), -2.95, X(11.8), -2.95); c.wall(X(8.2), -1.85, X(11.8), -1.85); c.wall(X(8.2), -2.95, X(8.2), -1.85); c.wall(X(11.8), -2.95, X(11.8), -1.85);
    const lbl = c.sign('TRASH TALK · GARAGE SALE FINDS · BUY LOW, SELL ON THE INTERNET', { w: 3.2, h: 0.24, bg: '#f4ead2', fg: '#111', font: c.MONO, weight: 800 }); lbl.position.set(10, 1.3, -2.95); g.add(lbl);
    // the finds: Poly Haven props, each with a sticker price and what the internet pays
    const FINDS = [['baseball_01', 'A baseball', 0.25, 2, 28], ['rubber_duck_toy', 'A rubber duck', 0.22, 1, 9], ['alarm_clock_01', 'An alarm clock', 0.22, 3, 24], ['cassette_player', 'A cassette player', 0.3, 5, 41], ['pocket_watch', 'A pocket watch', 0.16, 4, 60], ['vintage_lighter', 'A lighter', 0.1, 1, 15], ['Ukulele_01', 'A ukulele', 0.5, 8, 55], ['chess_set', 'A chess set', 0.4, 6, 35]];
    const ledger = c.canvasTex(512, 256, () => {}), lq = ledger.userData.canvas.getContext('2d');
    const lm = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), new THREE.MeshBasicMaterial({ map: ledger, toneMapped: false })); lm.position.set(13.6, 1.9, -2.95); g.add(lm);
    let profit = 0, sold = 0, held = 0;
    const draw = () => { lq.fillStyle = '#111'; lq.fillRect(0, 0, 512, 256); lq.fillStyle = '#7fff9a'; lq.font = `700 28px ${c.MONO}`; lq.fillText('THE LEDGER', 20, 44); lq.font = `700 60px ${c.MONO}`; lq.fillText('$' + profit, 20, 130); lq.font = `600 22px ${c.MONO}`; lq.fillStyle = '#f4ead2'; lq.fillText(`${sold} SOLD · ${held} IN HAND`, 20, 190); lq.fillText('A DOLLAR IN, A DOLLAR BACK, THAT IS THE GAME', 20, 230); ledger.needsUpdate = true; };
    draw();
    FINDS.forEach(([nm, label, len, buy, sell], k) => {
      const x = 8.6 + (k % 4) * 0.9, z = -2.7 + Math.floor(k / 4) * 0.6;
      const m = c.glb('ph_' + nm, { len, x, y: 0.79, z, ry: Math.random() * 6, parent: g, shadow: false });
      let state = 0;
      c.clickable(m, () => {
        if (state === 0) { state = 1; held++; c.sound.ticket(); c.toast(`${label}, sticker says $${buy}. Bought.`, 2200); }
        else if (state === 1) { state = 2; held--; sold++; profit += sell - buy; c.sound.ding(); m.visible = false; c.toast(`${label} sold online for $${sell}. Profit $${sell - buy}.`, 2600); if (sold === 1) c.egg('flip'); if (sold >= 5) c.egg('trashtalk', 'Five flips. A hundred bucks a week out of other people\'s garages. That was the whole show, and the whole point: anybody can.'); }
        draw();
      }, state === 0 ? `${label}: buy it` : label);
    });
    // the 1997 computer: a beige box, a monitor and a modem that sings when you click it
    const beige = std(c, 0xd8d0b8, { roughness: 0.7 });
    g.add(c.slab(0.5, 0.42, 0.5, beige, 16.9, 0.98, 1.2)); const mon = c.slab(0.44, 0.34, 0.4, beige, 16.9, 1.37, 1.2); g.add(mon);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.26), new THREE.MeshBasicMaterial({ map: c.canvasTex(256, 192, (q, w, h) => { q.fillStyle = '#0a1a0a'; q.fillRect(0, 0, w, h); q.fillStyle = '#7fff9a'; q.font = `700 22px ${c.MONO}`; q.fillText('winelibrary.com', 14, 40); q.fillText('_', 14, 80); q.font = `600 14px ${c.MONO}`; q.fillText('1997 · ONE PAGE · SHIPS ANYWHERE', 14, 150); }), toneMapped: false })); scr.position.set(16.69, 1.37, 1.2); scr.rotation.y = -PI / 2; g.add(scr);
    c.clickable(mon, () => { c.sound.modem(); c.egg('dialup', 'That sound is 1997. A liquor store put itself on the internet and nobody in the business understood why. Three million to sixty.'), 'The computer'; }, 'The computer');
    // the lemonade sign, the stencil on a case, the father
    const lem = c.sign('LEMONADE · 25 CENTS · AGE 7', { w: 1.2, h: 0.36, bg: '#f5c542', fg: '#111', font: c.SERIF, weight: 900, border: '#111' }); lem.position.set(4.2, 1.5, -7.86); g.add(lem);
    c.clickable(lem, () => c.egg('lemonade', 'Lemonade at seven, baseball cards at twelve, the store at fourteen. The resume was done before high school.'), 'The lemonade sign');
    const sten = c.sign('$3M IN · $60M OUT', { w: 1.4, h: 0.36, bg: '#b8905a', fg: '#2a1a0a', font: c.MONO, weight: 900 }); sten.position.set(14.0, 0.9, -7.86); g.add(sten);
    c.clickable(sten, () => c.egg('sixty', 'Three million a year to sixty, in the family store, with email and a camcorder. His own number, never audited, repeated on every stage since.'), 'A stencil');
    cast(c, r, g, X, 'dad', 3.4, -4.4, { h: 1.8, ry: 0.8, line: 'My son wants to put the store on the computer. I do not know what that means. I said yes.', egg: 'sasha', hint: 'The father' });
    cast(c, r, g, X, 'hustler', 6.2, 2.6, { h: 1.75, ry: 0.4, line: 'Fourteen. I restock, I run the register, I read the labels. One day I will know every wine in here.', egg: 'kid', hint: 'The kid' });
    const hum = c.sign('CLOUDS UP THERE. DIRT DOWN HERE. THIS IS THE DIRT.', { w: 3.6, h: 0.26, bg: null, fg: '#7fff9a', font: c.MONO, weight: 700, glow: 8 }); hum.position.set(10, 5.5, -7.86); g.add(hum);
  },

  // WINE LIBRARY TV. The desk, four wines, one bucket, the camcorder, and a wall of a thousand tapes.
  library(c, r, g, X) {
    const { THREE } = c;
    const desk = c.slab(3.6, 0.9, 1.3, std(c, 0x4a2a14, { roughness: 0.7 }), 10, 0.45, -3.4); g.add(desk);
    c.wall(X(8.1), -4.1, X(11.9), -4.1); c.wall(X(8.1), -2.7, X(11.9), -2.7); c.wall(X(8.1), -4.1, X(8.1), -2.7); c.wall(X(11.9), -4.1, X(11.9), -2.7);
    const chair = c.glb('ph_ArmChair_01', { h: 1.1, x: 10, z: -5.0, ry: PI, parent: g }); c.post(X(10), -5.0, 0.5);
    // the bucket
    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.32, 24, 1, true), std(c, 0xd0d0d0, { metalness: 1, roughness: 0.25, side: THREE.DoubleSide })); bucket.position.set(10.9, 1.06, -3.1); g.add(bucket);
    c.clickable(bucket, () => { c.sound.clink(900); c.egg('bucket', 'The bucket. He tasted, he spat, he told you the truth about a twelve dollar bottle. The most honest sound on the internet in 2007.'); }, 'The spit bucket');
    // four glasses, four wines: click one and the whole room tastes like it
    const WINES = [['CABERNET', 0x6a0a1e, 'Black cherry, cedar, a glove. Big. The kind of wine that gets a show started.'], ['CHARDONNAY', 0xe8c860, 'Butter, apple, oak you can taste from the parking lot. Not his favourite, and he will say so.'], ['ROSÉ', 0xff9ab0, 'Strawberry and a sunny afternoon. He drank it before it was allowed.'], ['RIESLING', 0xc8f080, 'Lime, petrol, a wet stone. The grape he spent a thousand episodes defending.']];
    const glassM = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.9, roughness: 0.05, thickness: 0.02, transparent: true, opacity: 0.5 });
    let tasted = new Set();
    WINES.forEach(([nm, col, note], k) => {
      const x = 8.9 + k * 0.5, z = -3.6, gl = new THREE.Group(); gl.position.set(x, 0.9, z); g.add(gl);
      gl.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.1, 10), glassM)).position.y = 0.05; gl.add(new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 6), glassM)).position.y = 0.14;
      const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12, 0, PI * 2, 0, PI * 0.55), glassM); bowl.position.y = 0.26; bowl.rotation.x = PI; gl.add(bowl);
      const wine = new THREE.Mesh(new THREE.SphereGeometry(0.052, 16, 10, 0, PI * 2, PI * 0.5, PI * 0.45), std(c, col, { roughness: 0.3 })); wine.position.y = 0.255; gl.add(wine);
      const tag = c.sign(nm, { w: 0.3, h: 0.07, bg: '#f4ead2', fg: '#111', font: c.MONO, weight: 700, px: 40 }); tag.position.set(0, 0.36, 0.05); gl.add(tag);
      c.clickable(gl, () => { c.FX.tint = col; r.owns = true; setTimeout(() => { if (r.owns) { c.FX.tint = null; r.owns = false; } }, 5000); c.sound.clink(1400 + k * 200); c.toast(`${nm}: ${note}`, 4200); tasted.add(k); c.egg('taste'); if (tasted.size === 4) c.egg('fourwines', 'Four wines, no notes, no filter. That was the format. A thousand episodes of it made a liquor store famous and a man a brand.'); }, `Taste the ${nm.toLowerCase()}`);
    });
    // the helmet: green, on the desk, where it always was
    const helm = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 14, 0, PI * 2, 0, PI * 0.62), std(c, JETS, { roughness: 0.3, metalness: 0.2 })); helm.position.set(11.4, 1.0, -3.8); helm.rotation.y = 0.6; g.add(helm);
    const mask = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 8, 16, PI), std(c, 0xeeeeee, { metalness: 0.8 })); mask.position.set(11.4, 0.98, -3.65); mask.rotation.x = PI / 2; g.add(mask);
    c.clickable(helm, () => c.egg('helmet', 'The helmet lived on the desk. A wine show with a football helmet on it. Ask him about the team and the show stops.'), 'The helmet');
    // the wall of tapes: a thousand VHS boxes on the east wall, and the counter under them
    const N = 1000, box = new THREE.BoxGeometry(0.025, 0.19, 0.11), tapes = new THREE.InstancedMesh(box, std(c, 0x111111, { roughness: 0.8 }), N);
    const M = new THREE.Matrix4(), col = new THREE.Color();
    for (let i = 0; i < N; i++) { const row = Math.floor(i / 50), k = i % 50; M.makeTranslation(W - 0.2 - (row % 2) * 0.0, 0.5 + row * 0.24, -7.4 + k * 0.148 - (row > 19 ? 0 : 0)); tapes.setMatrixAt(i, M); tapes.setColorAt(i, col.setHex([0x111111, 0x1a1a22, 0x22201a, 0x101418][i % 4])); }
    tapes.instanceMatrix.needsUpdate = true; g.add(tapes);
    for (let row = 0; row < 20; row++) g.add(c.slab(0.3, 0.02, 7.6, std(c, 0x3a2a1a), W - 0.2, 0.39 + row * 0.24, -3.6));
    const counter = c.sign('EPISODE 1000', { w: 2.2, h: 0.5, bg: '#f4ead2', fg: '#111', font: c.SERIF, weight: 900, px: 160 }); counter.position.set(W - 0.4, 5.4, -3.6); counter.rotation.y = -PI / 2; g.add(counter);
    const ct = counter.material.map, cq = ct.userData.canvas.getContext('2d'), cw = ct.userData.canvas.width, ch = ct.userData.canvas.height;
    let ep = 0, still = 0, last = [0, 0], done = false;
    const drawEp = (n) => { cq.fillStyle = '#f4ead2'; cq.fillRect(0, 0, cw, ch); cq.fillStyle = '#111'; cq.font = `900 ${ch * 0.6}px ${c.SERIF}`; cq.textAlign = 'center'; cq.textBaseline = 'middle'; cq.fillText('EPISODE ' + n, cw / 2, ch / 2); ct.needsUpdate = true; };
    drawEp(0);
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) { if (r.owns) { c.FX.tint = null; r.owns = false; } return; }
      // the tapes count up as you walk toward the desk; sit at it and hold still and the thousandth lights
      const d = Math.hypot(P.x - r.x0 - 10, P.z + 5.0), target = Math.round(Math.max(0, Math.min(999, (1 - Math.min(1, d / 9)) * 999)));
      if (target !== ep && Math.abs(target - ep) > 3) { ep += Math.sign(target - ep) * Math.ceil(Math.abs(target - ep) * 0.2); drawEp(ep); }
      const mv = Math.hypot(P.x - last[0], P.z - last[1]); last = [P.x, P.z];
      still = d < 1.4 && mv < 0.004 ? still + dt : 0;
      if (still > 4 && !done) { done = true; ep = 1000; drawEp(1000); c.flash(0.6); c.sound.ding(); tapes.setColorAt(N - 1, col.setHex(0xf5c542)); tapes.instanceColor.needsUpdate = true; c.egg('ep1000', 'Episode one thousand, March 14, 2011. The last one. He walked out of the wine business that summer to build the agency. The tape is the gold one, top right.'); }
    });
    plaque(c, g, 10, 2.2, -7.86, 0, 'Four wines a day, five days a week, from a store in New Jersey.', 'WINE LIBRARY TV, 2006 TO 2011', 2.4);
    cast(c, r, g, X, 'bookseller', 2.6, 2.2, { h: 1.75, ry: 0.6, line: 'The Thunder Show, they called it. He would slap the desk and the glasses would jump. The glasses still jump.', egg: 'thunder', hint: 'A regular' });
  },

  // CRUSH IT. Seven books the size of doors, a heavy bag, and a microphone from 2008 turned to stone.
  crush(c, r, g, X) {
    const { THREE } = c;
    const BOOKS = [['CRUSH IT!', 2009, '#ff4fa3', 'Cash in on your passion. Or at least stop pretending you do not have one.'], ['THE THANK YOU ECONOMY', 2011, '#22d3ee', 'The businesses that care more will win. Written before caring was a strategy.'], ['JAB, JAB, JAB, RIGHT HOOK', 2013, '#f5c542', 'Give, give, give. Then ask. Most people lead with the hook and wonder why nobody answers.'], ['#ASKGARYVEE', 2016, '#3b82f6', 'Chapter one is Clouds and Dirt. This building is chapter one.'], ['CRUSHING IT!', 2018, '#ff7a1a', 'The sequel, with the receipts: people who did it after reading the first one.'], ['TWELVE AND A HALF', 2021, '#f4ead2', 'Twelve emotional ingredients and the half he admits he is worst at. The floor on 12 is this book.'], ['DAY TRADING ATTENTION', 2024, '#7fff9a', 'Attention is the asset. Find it where it is underpriced, every day, like a trader.']];
    const read = new Set();
    BOOKS.forEach(([title, year, col, note], k) => {
      const west = k < 4, x = west ? 1.1 : W - 1.1, z = west ? -5.6 + k * 2.4 : -4.4 + (k - 4) * 2.6, bk = new THREE.Group(); bk.position.set(x, 0, z); bk.rotation.y = (west ? PI / 2 : -PI / 2) + 0.1 * (k % 2 ? 1 : -1); g.add(bk);
      const body = c.slab(1.6, 2.4, 0.42, std(c, 0xf4ead2, { roughness: 0.9 }), 0, 1.2, 0); bk.add(body);
      const cover = c.sign(`${title}\n${year}`, { w: 1.6, h: 2.4, bg: col, fg: col === '#f4ead2' ? '#111' : '#0d0d0d', font: c.SERIF, weight: 900, px: 320, pad: 0.16 }); cover.position.set(0, 1.2, 0.215); bk.add(cover);
      const spine = c.sign(title, { w: 2.4, h: 0.42, bg: '#111', fg: col, font: c.MONO, weight: 800, px: 96 }); spine.position.set(0.81, 1.2, 0); spine.rotation.y = PI / 2; spine.rotation.z = PI / 2; bk.add(spine);
      bk.rotation.x = -0.1; c.post(X(x), z, 0.9);
      c.clickable(body, () => { c.toast(`${title} (${year}): ${note}`, 4600); c.sound.click(); read.add(k); c.egg('book'); if (read.size === 7) c.egg('shelf', 'Seven books, one idea each, fifteen years. He will tell you he never read a book until he wrote one.'); }, title);
      c.clickable(cover, () => cover.parent && body.userData.click(), title);
    });
    const kid = c.sign('MEET ME IN THE MIDDLE · A VEEFRIENDS PICTURE BOOK · 2024 · FLIP IT OVER', { w: 2.6, h: 0.3, bg: '#f5c542', fg: '#111', font: c.MONO, weight: 800 }); kid.position.set(10, 3.3, -7.86); g.add(kid);
    c.clickable(kid, () => c.egg('middle', 'Patient Pig and Eager Eagle watch the same game from opposite ends of a flip book. Meet in the middle. A children\'s book about not being a jerk.'), 'The picture book');
    // the heavy bag. Three jabs inside two and a half seconds, then the hook. The hook alone just swings.
    const chain = c.slab(0.04, 1.3, 0.04, std(c, 0x666666, { metalness: 0.9 }), 14.4, 5.3, 0.6); g.add(chain);
    const bag = new THREE.Group(); bag.position.set(14.4, 4.65, 0.6); g.add(bag);
    const bagM = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 1.6, 20), std(c, 0x3a1a1a, { roughness: 0.6 })); bagM.position.y = -0.8 - 0.65; bag.add(bagM);
    const tape = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.2, 20), std(c, 0xf5c542)); tape.position.y = -0.65 - 0.3; bag.add(tape);
    c.post(X(14.4), 0.6, 0.5);
    const jabs = []; let swing = 0, hooked = false, vel = 0;
    c.clickable(bagM, () => {
      const now = c.TIME.t; while (jabs.length && now - jabs[0] > 2.5) jabs.shift();
      if (jabs.length >= 3) { jabs.length = 0; vel = 2.4; c.sound.boom(0.6); c.shake(0.08); c.flash(0.3); c.toast('RIGHT HOOK. Three jabs of value, then the ask. That is the whole book.', 3200); if (!hooked) { hooked = true; c.egg('righthook', 'Jab, jab, jab, right hook. Give three times before you ask once. The bag only moves if you did the work first.'); } }
      else { jabs.push(now); vel = Math.max(vel, 0.5); c.sound.thud(0.3); c.toast(['Jab. Give something.', 'Jab. Give again.', 'Jab. One more, then the hook.'][jabs.length - 1], 1400); }
    }, 'The heavy bag');
    c.tick((t, dt) => { swing += vel * dt; vel -= swing * 6 * dt; vel *= 1 - dt * 1.2; bag.rotation.x = swing * 0.3; bag.rotation.z = swing * 0.1; });
    const jl = c.sign('JAB · JAB · JAB · RIGHT HOOK', { w: 2.0, h: 0.24, bg: '#0d0d0d', fg: '#f5c542', font: c.MONO, weight: 800 }); jl.position.set(14.4, 2.6, 1.2); jl.rotation.y = PI; g.add(jl);
    cast(c, r, g, X, 'boxer', 16.8, 0.2, { h: 1.85, ry: -1.1, line: 'Three jabs, then the hook. In the ring, on the feed, at the dinner table. Same rule.', egg: 'sparring', hint: 'The sparring partner' });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const sp = g.children.find((o) => o.userData && o.userData.hint === 'The sparring partner'); });
    // the relic: the microphone from the 2008 expo, calcified. "Just stop watching Lost."
    const stone = std(c, 0xd8d4cc, { roughness: 0.95 }), crystal = new THREE.MeshStandardMaterial({ color: 0x7fd4ff, emissive: 0x7fd4ff, emissiveIntensity: 0.6, roughness: 0.2 });
    const mic = new THREE.Group(); mic.position.set(4.0, 0, 2.4); g.add(mic);
    mic.add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.06, 20), stone)).position.y = 0.03; mic.add(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5, 8), stone)).position.y = 0.78;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), stone); head.position.set(0, 1.56, 0.04); mic.add(head);
    for (let k = 0; k < 7; k++) { const o = new THREE.Mesh(new THREE.OctahedronGeometry(0.03 + Math.random() * 0.04), crystal); o.position.set((Math.random() - 0.5) * 0.14, 1.5 + Math.random() * 0.14, (Math.random() - 0.5) * 0.14); mic.add(o); }
    c.post(X(4.0), 2.4, 0.4);
    c.clickable(mic, () => c.egg('lost', 'Web 2.0 Expo, New York, September 2008. What are you doing between seven at night and two in the morning. Just stop watching Lost. The microphone has not recovered.'), 'The microphone, 2008');
    plaque(c, g, 4.0, 1.9, 3.1, PI, 'Just stop watching Lost.', 'WEB 2.0 EXPO, SEPTEMBER 2008', 1.4);
  },

  // VAYNERMEDIA, FLOOR 25. Desks, the wine wall, the boxing glove booth, and the content machine: one of you in, sixty four out.
  hudson(c, r, g, X) {
    const { THREE } = c;
    // the desks: two long white runs with monitors, the way Spector packed five hundred and sixty of them on a floor and a half
    const white = std(c, 0xf0efea, { roughness: 0.6 }), dark = std(c, 0x1a1a1a, { roughness: 0.5 });
    for (const z of [-3.8, -1.2]) { g.add(c.slab(7.6, 0.05, 1.4, white, 6.2, 0.74, z)); for (const dx of [-3.6, 3.6]) g.add(c.slab(0.06, 0.74, 1.3, dark, 6.2 + dx, 0.37, z));
      for (let k = 0; k < 5; k++) { const m = c.slab(0.5, 0.32, 0.03, dark, 3.0 + k * 1.6, 1.0, z); g.add(m); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.28), new THREE.MeshBasicMaterial({ map: screenTex(c, k + z), toneMapped: false })); s.position.set(3.0 + k * 1.6, 1.0, z + 0.02); g.add(s); }
      c.wall(X(2.4), z - 0.7, X(10), z - 0.7); c.wall(X(2.4), z + 0.7, X(10), z + 0.7); c.wall(X(2.4), z - 0.7, X(2.4), z + 0.7); c.wall(X(10), z - 0.7, X(10), z + 0.7); }
    // the concrete column kept as a feature, and the boxing glove booth
    g.add(c.slab(0.6, H_IN, 0.6, c.surf('concrete', 2, 0x9a9890), 11.6, H_IN / 2, -2.5)); c.post(X(11.6), -2.5, 0.5);
    const gloves = c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = '#7a1a1a'; q.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const x = 32 + i * 64 + (j % 2) * 16, y = 32 + j * 64; q.fillStyle = '#e8c8a0'; q.beginPath(); q.ellipse(x, y, 22, 26, 0.4, 0, 7); q.fill(); q.fillStyle = '#d8b890'; q.beginPath(); q.ellipse(x - 12, y + 12, 9, 12, 0.6, 0, 7); q.fill(); } });
    gloves.wrapS = gloves.wrapT = THREE.RepeatWrapping; gloves.repeat.set(3, 3);
    const booth = new THREE.Group(); booth.position.set(17.6, 0, -5.2); g.add(booth);
    booth.add(c.slab(2.4, 2.6, 0.1, new THREE.MeshStandardMaterial({ map: gloves, roughness: 0.9 }), 0, 1.3, -1.2)); booth.add(c.slab(0.1, 2.6, 2.4, new THREE.MeshStandardMaterial({ map: gloves, roughness: 0.9 }), 1.2, 1.3, 0)); booth.add(c.slab(2.4, 0.1, 2.4, dark, 0, 2.6, 0));
    booth.add(c.slab(1.8, 0.45, 0.6, std(c, 0x2a4a8a), 0, 0.5, -0.8)); c.wall(X(16.4), -6.4, X(18.8), -6.4); c.wall(X(18.8), -6.4, X(18.8), -4.0);
    const bl = c.sign('THE BOOTH · BOXING GLOVE WALLPAPER · FOR THE HARD CONVERSATIONS', { w: 2.2, h: 0.22, bg: '#0d0d0d', fg: '#f5c542', font: c.MONO, weight: 700 }); bl.position.set(17.6, 2.85, -3.98); g.add(bl);
    c.clickable(bl, () => c.egg('gloves', 'A meeting booth papered in boxing gloves, the one odd room on a floor of concrete and reclaimed wood. Jab, jab, jab, in wallpaper.'), 'The booth');
    // the wine wall is on the west (props), labelled
    const wl = c.sign('THE WINE WALL · WHERE IT ALL STARTED', { w: 1.9, h: 0.2, bg: '#0d0d0d', fg: '#f5c542', font: c.MONO, weight: 700 }); wl.position.set(0.16, 2.5, -4.6); wl.rotation.y = PI / 2; g.add(wl);
    // the content machine: a glass box with a ring light. A camera inside films you, and sixty four screens cut you up.
    const GX = 14.4, GZ = 3.2, glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.92, roughness: 0.03, thickness: 0.05, transparent: true, opacity: 0.35 });
    for (const [x, z, w, d] of [[GX - 1.6, GZ, 0.04, 3.2], [GX + 1.6, GZ, 0.04, 3.2], [GX, GZ - 1.6, 3.2, 0.04]]) g.add(c.slab(w, 3.0, d, glass, x, 1.5, z));
    g.add(c.slab(3.3, 0.06, 3.3, dark, GX, 3.02, GZ));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 10, 48), new THREE.MeshBasicMaterial({ color: 0xfff4e0, toneMapped: false })); ring.position.set(GX, 1.9, GZ - 1.3); ring.rotation.y = 0; g.add(ring);
    g.add(c.slab(0.04, 1.6, 0.04, dark, GX, 0.8, GZ - 1.3));
    const phone = c.slab(0.09, 0.18, 0.02, dark, GX, 1.9, GZ - 1.3); g.add(phone);
    c.wall(X(GX - 1.6), GZ - 1.6, X(GX - 1.6), GZ + 1.6); c.wall(X(GX + 1.6), GZ - 1.6, X(GX + 1.6), GZ + 1.6); c.wall(X(GX - 1.6), GZ - 1.6, X(GX + 1.6), GZ - 1.6);
    const mark = decal(c, 0.8, 0.8, (q, w, h) => { q.strokeStyle = '#f5c542'; q.lineWidth = 8; q.strokeRect(10, 10, w - 20, h - 20); q.fillStyle = '#f5c542'; q.font = `800 ${w * 0.1}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('STAND HERE', w / 2, h / 2 + 6); });
    mark.rotation.x = -PI / 2; mark.position.set(GX, 0.02, GZ + 0.3); g.add(mark);
    // the camera, the target and the wall of sixty four
    const rt = new THREE.WebGLRenderTarget(512, 512, { depthBuffer: true }); rt.texture.colorSpace = THREE.SRGBColorSpace;
    const cam2 = new THREE.PerspectiveCamera(50, 1, 0.1, 30); cam2.position.set(GX, 1.9, GZ - 1.3); g.add(cam2); cam2.lookAt(X(GX), 1.5, GZ + 0.4); cam2.layers.enable(1);
    const PLAT = ['SHORT VIDEO', 'PODCAST', 'NEWSLETTER', 'LIVE', 'STORY', 'CAROUSEL', 'THREAD', 'KEYNOTE'];
    const screens = new THREE.Group(); screens.position.set(10.0, 0, D / 2 - 0.16); screens.rotation.y = PI; g.add(screens);
    const SW = 0.86, SH = 0.5, crops = [];
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
      const geo = new THREE.PlaneGeometry(SW - 0.06, SH - 0.06), uv = geo.attributes.uv;
      const cx = 0.5 + (Math.random() - 0.5) * 0.3, cy = 0.5 + (Math.random() - 0.5) * 0.3, sx = 0.35 + Math.random() * 0.5, sy = sx * (j % 3 === 0 ? 1.5 : 0.7);
      for (let v = 0; v < uv.count; v++) uv.setXY(v, Math.max(0, Math.min(1, cx + (uv.getX(v) - 0.5) * sx)), Math.max(0, Math.min(1, cy + (uv.getY(v) - 0.5) * sy)));
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: rt.texture, toneMapped: false })); m.position.set((i - 3.5) * SW, 1.2 + j * SH, 0); screens.add(m); crops.push(m);
    }
    screens.add(c.slab(SW * 8 + 0.2, SH * 8 + 0.2, 0.06, dark, 0, 1.2 + 3.5 * SH, -0.04));
    PLAT.forEach((p, i) => { const s = c.sign(p, { w: SW - 0.1, h: 0.14, bg: '#0d0d0d', fg: '#f5c542', font: c.MONO, weight: 700, px: 48 }); s.position.set((i - 3.5) * SW, 0.84, 0.01); screens.add(s); });
    const big = c.sign('ONE IN · SIXTY FOUR OUT', { w: 4.0, h: 0.4, bg: null, fg: '#f5c542', font: c.SERIF, weight: 900, glow: 16 }); big.position.set(0, 5.5, 0.02); screens.add(big);
    const tally = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), basic(c, 0x330000)); tally.position.set(GX + 0.1, 2.1, GZ - 1.3); g.add(tally);
    const cnt = c.sign('PIECES TODAY: 0', { w: 1.6, h: 0.22, bg: '#0d0d0d', fg: '#7fff9a', font: c.MONO, weight: 800 }); cnt.position.set(GX, 3.2, GZ - 1.62); cnt.rotation.y = PI; g.add(cnt);
    let inBox = 0, pieces = 0, frame = 0, egged = false;
    const ct = cnt.material.map, cq = ct.userData.canvas.getContext('2d');
    const drawCnt = (n) => { const w = ct.userData.canvas.width, h = ct.userData.canvas.height; cq.fillStyle = '#0d0d0d'; cq.fillRect(0, 0, w, h); cq.fillStyle = '#7fff9a'; cq.font = `800 ${h * 0.6}px ${c.MONO}`; cq.textAlign = 'center'; cq.textBaseline = 'middle'; cq.fillText('PIECES TODAY: ' + n, w / 2, h / 2); ct.needsUpdate = true; };
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return; frame++;
      const inside = Math.abs(P.x - X(GX)) < 1.5 && P.z > GZ - 1.5 && P.z < GZ + 1.5;
      tally.material.color.set(inside ? 0xff2020 : 0x330000);
      if (inside) { inBox += dt; const n = Math.min(64, Math.floor(inBox * 8)); if (n !== pieces) { pieces = n; drawCnt(n); if (n === 64 && !egged) { egged = true; c.flash(0.5); c.sound.ding(); c.egg('sixtyfour', 'Sixty four pieces from one. Nine minutes in a ring light became a week of posts. Document, do not create: you just did.'); } } if (pieces === 1) c.egg('onepiece'); }
      if (frame % 2 === 0) { screens.visible = false; c.renderer.setRenderTarget(rt); c.renderer.render(c.scene, cam2); c.renderer.setRenderTarget(null); screens.visible = true; }
    });
    plaque(c, g, 10, 5.0, D / 2 - 0.2, PI, 'Document, don\'t create.', 'THE CONTENT MODEL, 2016', 2.0);
    const fl = c.sign('25 · VAYNERMEDIA · 10 HUDSON YARDS · THE WHOLE FLOOR AND HALF OF 24', { w: 5.6, h: 0.3, bg: null, fg: '#f5c542', font: c.MONO, weight: 700, glow: 8 }); fl.position.set(10, 5.5, -7.86); g.add(fl);
    cast(c, r, g, X, 'wiseguy', 12.6, -1.2, { h: 1.85,   // was agent, whose model stops above the knee and read sunk (2026-10-28)
      ry: 0.4, line: 'Media and creative under one roof. He says it in London, he says it in Singapore, he says it in the lift.', egg: 'oneroof', hint: 'A strategist' });
    cast(c, r, g, X, 'workgirl', 5.0, 0.6, { h: 1.75, ry: PI, line: 'Five hundred and sixty desks on a floor and a half. Pack them in, he said. We packed them in.', egg: 'desks', hint: 'Somebody at a desk' });
    cast(c, r, g, X, 'assistant', 9.0, 3.6, { h: 1.75, ry: -0.6, line: 'The town hall is the pantry. Every all hands happens next to the coffee. That is not an accident.', egg: 'townhall', hint: 'At the pantry' });
  },

  // THE STUDIO. Three mics, two cameras, a wall of two cent comments, and a clip of you that loops forever.
  studio(c, r, g, X) {
    const { THREE } = c, dark = std(c, 0x1a1a1a, { roughness: 0.5 }), wood = std(c, 0x3a2414, { roughness: 0.6 });
    g.add(c.slab(4.0, 0.08, 1.2, wood, 10, 0.78, -2.6)); for (const [x, z] of [[8.2, -3.1], [11.8, -3.1], [8.2, -2.1], [11.8, -2.1]]) g.add(c.slab(0.08, 0.78, 0.08, dark, x, 0.39, z));
    c.wall(X(7.9), -3.3, X(12.1), -3.3); c.wall(X(7.9), -1.9, X(12.1), -1.9); c.wall(X(7.9), -3.3, X(7.9), -1.9); c.wall(X(12.1), -3.3, X(12.1), -1.9);
    for (const x of [8.8, 10, 11.2]) { const arm = c.slab(0.03, 0.03, 0.6, dark, x, 1.1, -2.9); arm.rotation.x = -0.6; g.add(arm); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.2, 14), std(c, 0x2a2a2a, { metalness: 0.8, roughness: 0.3 })); m.position.set(x, 1.3, -2.5); m.rotation.x = 0.9; g.add(m); const foam = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), std(c, 0x111111, { roughness: 1 })); foam.position.set(x, 1.37, -2.44); g.add(foam); }
    const air = c.sign('ON AIR', { w: 0.9, h: 0.3, bg: '#300000', fg: '#ff3030', font: c.MONO, weight: 900, glow: 14 }); air.position.set(10, 5.0, -7.86); g.add(air);
    const ep = c.sign('DAILYVEE · EPISODE 575 · DOCUMENT, DON\'T CREATE', { w: 3.6, h: 0.3, bg: null, fg: '#ff4fa3', font: c.MONO, weight: 700, glow: 10 }); ep.position.set(10, 4.5, -7.86); g.add(ep);
    // the two cent wall: ninety sticky notes, the $1.80 strategy
    const notes = c.canvasTex(1024, 512, (q, w, h) => { q.fillStyle = '#1e1e24'; q.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { const x = 20 + (i % 15) * 66 + (Math.random() - 0.5) * 6, y = 20 + Math.floor(i / 15) * 80 + (Math.random() - 0.5) * 6; q.save(); q.translate(x, y); q.rotate((Math.random() - 0.5) * 0.2); q.fillStyle = ['#f5c542', '#ff9ab0', '#7fff9a', '#22d3ee'][i % 4]; q.fillRect(0, 0, 56, 56); q.fillStyle = '#111'; q.font = `800 20px ${c.FONT}`; q.fillText('2¢', 12, 36); q.restore(); } });
    const nw = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), new THREE.MeshStandardMaterial({ map: notes, roughness: 0.9 })); nw.position.set(0.16, 2.6, -1.4); nw.rotation.y = PI / 2; g.add(nw);
    const nl = c.sign('$1.80 · NINETY COMMENTS A DAY · TWO CENTS EACH', { w: 3.0, h: 0.24, bg: '#0d0d0d', fg: '#f5c542', font: c.MONO, weight: 800 }); nl.position.set(0.18, 4.9, -1.4); nl.rotation.y = PI / 2; g.add(nl);
    c.clickable(nw, () => c.egg('twocents', 'A dollar eighty: your two cents on ninety posts a day, every day, until people know who you are. The cheapest attention there ever was.'), 'The two cent wall');
    // the clip: click the big mic, the room records six seconds of you, and a ghost of you plays them on loop by the desk
    const rec = document.createElement('div'); rec.style.cssText = 'position:fixed;left:18px;top:50%;transform:translateY(-50%);font:700 13px "IBM Plex Mono",monospace;letter-spacing:.14em;color:#ff3030;pointer-events:none;z-index:8;opacity:0;transition:opacity .3s;text-shadow:0 0 8px #000'; document.body.appendChild(rec);
    let recording = false, t0 = 0; const path = []; let ghost = null, ghostT = 0, clips = 0;
    const btn = c.slab(0.3, 0.3, 0.3, std(c, 0xff2020, { emissive: 0x300000 }), 10, 0.95, -1.4); g.add(btn);
    const bl = c.sign('RECORD', { w: 0.6, h: 0.14, bg: null, fg: '#f4ead2', font: c.MONO, weight: 800, px: 48 }); bl.position.set(10, 1.2, -1.4); g.add(bl);
    c.clickable(btn, () => { if (recording) return; recording = true; t0 = c.TIME.t; path.length = 0; rec.style.opacity = 1; c.sound.tick(); c.toast('Rolling. Six seconds. Do something.', 2400); if (ghost) { g.remove(ghost); ghost = null; } }, 'Record six seconds of yourself');
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) { if (recording) { recording = false; rec.style.opacity = 0; } return; }
      if (recording) { const u = t - t0; rec.textContent = `● REC  00:0${Math.min(6, Math.floor(u))}`; path.push([P.x - r.x0, P.z, P.yaw]); if (u >= 6) { recording = false; rec.style.opacity = 0; c.sound.tick(); clips++;
          ghost = extra(c, g, path[0][0], path[0][1], { col: 0xff4fa3, crowd: false }); ghost.traverse((o) => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.55; } }); ghostT = 0;
          c.egg('clip', 'That is you, on loop, forever, next to the desk. Six seconds of nothing special is a clip. Document, do not create.'); if (clips >= 3) c.egg('reclips', 'Three takes. He would have posted the first one.'); } }
      if (ghost && path.length) { ghostT += dt * 60; const k = Math.floor(ghostT) % path.length, [x, z, yaw] = path[k]; ghost.position.set(x, Math.abs(Math.sin(ghostT * 0.2)) * 0.02, z); ghost.rotation.y = yaw; }
    });
    cast(c, r, g, X, 'lensman', 15.2, 1.4, { h: 1.8, ry: -0.9, line: 'I have filmed him every day since 2014. The short that got me the job was called Between the Clouds and the Dirt. True story.', egg: 'drock', hint: 'The videographer' });
    cast(c, r, g, X, 'anchor', 4.6, 2.6, { h: 1.8, ry: 0.7, line: 'The podcast is the keynote, cut up. The keynote is the podcast, stretched out. It is all one conversation that never stops.', egg: 'guest', hint: 'The guest' });
    plaque(c, g, 19.84, 2.2, -4.0, -PI / 2, 'Doing always beats thinking, the end.', 'GARY VAYNERCHUK', 1.6);
  },

  // EMPATHY OVER PARK AVENUE. The two portraits, twelve ingredients on the floor, the half one in the mirror.
  empathy(c, r, g, X) {
    const { THREE } = c;
    const ING = [['GRATITUDE', 'Gratitude is the cure.'], ['SELF-AWARENESS', 'Know what you are bad at. Then stop doing it.'], ['ACCOUNTABILITY', 'Nobody owes you anything. That is the good news.'], ['OPTIMISM', 'The glass is not half full. The glass is a glass.'], ['EMPATHY', 'Stand where the other person is standing. Then speak.'], ['KINDNESS', 'Kindness is karma.'], ['TENACITY', 'Keep going. It is not complicated, it is just long.'], ['CURIOSITY', 'Every new platform was once a joke.'], ['PATIENCE', 'Macro patience, micro speed.'], ['CONVICTION', 'Believe your own thing. People can tell.'], ['HUMILITY', 'The floor is where the work is.'], ['AMBITION', 'Your dreams do not have to be big. They have to be yours.']];
    const seen = new Set(), tiles = [];
    ING.forEach(([nm, line], k) => {
      const i = k % 4, j = Math.floor(k / 4), x = 4.6 + i * 2.6, z = -4.2 + j * 2.6;
      const t = decal(c, 2.2, 2.2, (q, w, h) => { q.fillStyle = '#e8e0d0'; q.fillRect(0, 0, w, h); q.strokeStyle = '#c9a033'; q.lineWidth = 10; q.strokeRect(8, 8, w - 16, h - 16); q.fillStyle = '#111'; q.font = `900 ${w * 0.11}px ${c.SERIF}`; q.textAlign = 'center'; q.fillText(nm, w / 2, h / 2 + 12); q.font = `700 ${w * 0.07}px ${c.MONO}`; q.fillText(String(k + 1), w / 2, h * 0.2); }, 256);
      t.rotation.x = -PI / 2; t.position.set(x, 0.015, z); g.add(t); t.material.emissive = new THREE.Color(0xf5c542); t.material.emissiveIntensity = 0; tiles.push({ t, x, z, nm, line, k });
    });
    const half = decal(c, 2.2, 1.1, (q, w, h) => { q.fillStyle = '#e8e0d0'; q.fillRect(0, 0, w, h); q.strokeStyle = '#c9a033'; q.lineWidth = 10; q.strokeRect(8, 8, w - 16, h - 16); q.fillStyle = '#111'; q.font = `900 ${w * 0.1}px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('KIND CANDOR', w / 2, h / 2 + 10); q.font = `700 ${w * 0.07}px ${c.MONO}`; q.fillText('12 1/2', w / 2, h * 0.3); }, 128);
    half.rotation.x = -PI / 2; half.position.set(15.0, 0.015, 4.2); g.add(half); half.material.emissive = new THREE.Color(0xf5c542); half.material.emissiveIntensity = 0;
    tiles.push({ t: half, x: 15.0, z: 4.2, nm: 'KIND CANDOR', line: 'The half he admits he is worst at: the truth, said kindly, in time. Look in the mirror.', k: 12, half: true });
    // the mirror of kind candor, on the south wall, and the candid line that appears when you face it long enough
    const mir = new Reflector(new THREE.PlaneGeometry(2.6, 2.4), { clipBias: 0.003, textureWidth: 1024, textureHeight: 1024, color: 0x9aa0a8 }); mir.position.set(15.0, 1.6, D / 2 - 0.2); mir.rotation.y = PI; g.add(mir);
    g.add(c.slab(2.8, 2.6, 0.08, std(c, 0xc9a033, { metalness: 1, roughness: 0.3 }), 15.0, 1.6, D / 2 - 0.14));
    const ml = c.sign('KIND CANDOR', { w: 1.4, h: 0.24, bg: '#0d0d0d', fg: '#f5c542', font: c.MONO, weight: 800 }); ml.position.set(15.0, 3.1, D / 2 - 0.26); ml.rotation.y = PI; g.add(ml);
    const CANDID = ['You have been looking at yourself for four seconds. The dirt is behind you.', 'Nice flower. Now go do the thing you said you would do in January.', 'You are not behind. You are early. Those are different.', 'Say the hard thing to the person, not to the group chat.'];
    const line = c.sign(CANDID[0], { w: 2.4, h: 0.4, bg: null, fg: '#f4ead2', font: c.SERIF, weight: 700, px: 128, glow: 10 }); line.position.set(15.0, 2.4, D / 2 - 0.3); line.rotation.y = PI; line.visible = false; g.add(line);
    const fw = new THREE.Vector3(); let faced = 0, said = 0;
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) { line.visible = false; faced = 0; return; }
      const px = P.x - r.x0;
      for (const tl of tiles) { const on = Math.abs(px - tl.x) < 1.0 && Math.abs(P.z - tl.z) < (tl.half ? 0.5 : 1.0); tl.t.material.emissiveIntensity += ((on ? 0.5 : 0) - tl.t.material.emissiveIntensity) * Math.min(1, dt * 4); if (on && !seen.has(tl.k)) { seen.add(tl.k); c.sound.note ? c.sound.note(330 + tl.k * 40) : c.sound.click(); c.toast(`${tl.k + 1}${tl.half ? '/2' : ''}. ${tl.nm}: ${tl.line}`, 3400); if (seen.size === 13) c.egg('twelveandahalf', 'Twelve and a half. Gratitude to ambition, and the half he is still working on. You walked every one.'); } }
      c.camera.getWorldDirection(fw); const near = Math.abs(px - 15.0) < 1.6 && P.z > 4.6 && fw.z > 0.85;
      faced = near ? faced + dt : 0; if (faced > 4 && !line.visible) { line.visible = true; line.material.map = c.sign(CANDID[said++ % CANDID.length], { w: 2.4, h: 0.4, bg: null, fg: '#f4ead2', font: c.SERIF, weight: 700, px: 128, glow: 10 }).material.map; c.sound.ding(); c.egg('candor', 'Kind candor. The mirror said the true thing, nicely, after it let you look for a while. That is the half.'); } if (!near) line.visible = false;
    });
    plaque(c, g, 0.16, 4.1, -4.6, PI / 2, 'Empathy Over Park Avenue, and The Man Who Bet on Attention. Portraits by MLow, Honorary New Yorker No. 41.', 'NEW YORKERS · HONORARIES', 3.0);
    cast(c, r, g, X, 'maitre', 2.4, -7.0, { h: 1.85, ry: 0.3, line: 'Doorman, Park Avenue, thirty one years. Everybody who walks in here is somebody. He tips in advice.', egg: 'doorman', hint: 'The doorman' });
    const dog = c.glb('dog', { h: 0.55, x: 7.0, z: 5.8, ry: 1.0, parent: g }); c.tick((t, dt, P, ri) => { if (ri === r.i) { dog.position.x = 7.0 + Math.sin(t * 0.5) * 2.5; dog.rotation.y = Math.cos(t * 0.5) > 0 ? PI / 2 : -PI / 2; } });
    c.clickable(dog, () => { c.sound.bark(); c.egg('parkdog', 'A Park Avenue dog. It has empathy for nobody and is loved by everybody. Study it.'); }, 'The dog');
  },

  // THE CAROUSEL OF FRIENDS. A ride that turns you with it, eight horses with real names, a black cat, and a wall of 268.
  carousel(c, r, g, X) {
    const { THREE } = c, PX = 10, PZ = -1.6, R = 4.4, purple = 0x6a3fb8;
    const plat = new THREE.Group(); plat.position.set(PX, 0, PZ); g.add(plat);
    plat.add(new THREE.Mesh(new THREE.CylinderGeometry(R + 0.3, R + 0.4, 0.22, 64), std(c, 0x2a1a3a, { roughness: 0.6 }))).position.y = 0.11;
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.04, 64), new THREE.MeshStandardMaterial({ map: c.canvasTex(1024, 1024, (q, w, h) => { q.fillStyle = '#5a2fa0'; q.fillRect(0, 0, w, h); for (let k = 0; k < 24; k++) { q.fillStyle = k % 2 ? '#7a4fd0' : '#f5c542'; q.beginPath(); q.moveTo(w / 2, h / 2); q.arc(w / 2, h / 2, w / 2, k / 24 * PI * 2, (k + 1) / 24 * PI * 2); q.fill(); } q.fillStyle = '#111'; q.beginPath(); q.arc(w / 2, h / 2, w * 0.1, 0, 7); q.fill(); q.fillStyle = '#f4ead2'; q.font = `900 ${w * 0.03}px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('VEEFRIENDS', w / 2, h / 2 - 8); q.fillText('MAY 11, 2021', w / 2, h / 2 + 24); }), roughness: 0.4 })); deck.position.y = 0.24; plat.add(deck);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 4.4, 20), std(c, 0xc9a033, { metalness: 1, roughness: 0.3 })); pole.position.y = 2.2; plat.add(pole);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(R + 0.8, 1.6, 24, 1, true), std(c, purple, { roughness: 0.7, side: THREE.DoubleSide })); roof.position.y = 4.9; plat.add(roof);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.8, R + 0.8, 0.5, 24, 1, true), std(c, 0xf5c542, { roughness: 0.6, side: THREE.DoubleSide })); brim.position.y = 3.95; plat.add(brim);
    bulbs(c, plat, -R - 0.7, R + 0.7, 3.72, 0, 20, 0xfff0c0);
    const FRIENDS = ['Patient Panda', 'Empathy Elephant', 'Gratitude Gorilla', 'Accountable Ant', 'Adaptable Alien', 'Alert Ape', 'Gary Bee', 'Very Very Very Very Lucky Black Cat'];
    const horses = [];
    FRIENDS.forEach((nm, k) => {
      const a = k / 8 * PI * 2, hx = Math.cos(a) * (R - 1.1), hz = Math.sin(a) * (R - 1.1), hp = new THREE.Group(); hp.position.set(hx, 0, hz); hp.rotation.y = -a + PI; plat.add(hp);
      hp.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3.8, 8), std(c, 0xc9a033, { metalness: 1, roughness: 0.3 }))).position.y = 2.1;
      const h = c.glb('ph_horse_statue_01', { h: 1.4, x: 0, y: 1.0, z: 0, ry: PI / 2, parent: hp, shadow: false, onload: (gg, inner) => { inner.traverse((m) => { if (m.isMesh) m.material = std(c, [0xf4ead2, 0x7a4fd0, 0xf5c542, 0x22d3ee][k % 4], { roughness: 0.5 }); }); } });
      const tag = c.sign(nm, { w: 1.2, h: 0.16, bg: '#f4ead2', fg: '#111', font: c.MONO, weight: 800, px: 56 }); tag.position.set(0, 0.5, 0.5); hp.add(tag);
      horses.push({ hp, h, k, nm });
      if (k === 7) { const cat = c.glb('cat', { h: 0.4, x: 0, y: 2.0, z: 0.1, ry: PI / 2, parent: hp, shadow: false, onload: (gg, inner) => inner.traverse((m) => { if (m.isMesh) m.material = std(c, 0x111111, { roughness: 0.8 }); }) }); c.clickable(cat, () => { c.sound.meow(); c.egg('luckycat', 'The Very, Very, Very, Very Lucky Black Cat, the mascot since the purple rebrand. MLow painted VeeFriends as this cat on this carousel. Lucky you.'); }, 'The black cat'); }
    });
    // the platform turns, and you with it, like the record store floor
    let rode = 0, onP = false, still = 0, last = [0, 0], patient = false;
    r.move = (P, nx, nz, dt) => { const lx = nx - r.x0 - PX, lz = nz - PZ; if (Math.hypot(lx, lz) < R - 0.1) { const w = 0.28 * dt, cs = Math.cos(w), sn = Math.sin(w); P.yaw += w; return [r.x0 + PX + lx * cs + lz * sn, PZ - lx * sn + lz * cs]; } return [nx, nz]; };
    r.ground = (x, z) => (Math.hypot(x - PX, z - PZ) < R + 0.3 ? 0.26 : 0);
    c.tick((t, dt, P, ri) => {
      plat.rotation.y += dt * 0.28; horses.forEach((o) => { o.h.position.y = 1.0 + Math.sin(t * 1.6 + o.k * 0.8) * 0.18; });
      if (ri !== r.i) { still = 0; return; }
      onP = Math.hypot(P.x - r.x0 - PX, P.z - PZ) < R - 0.1;
      const mv = Math.hypot(P.x - last[0], P.z - last[1]); last = [P.x, P.z];
      // the ride moves you, so stillness is measured against the ride: no keys, no joystick
      const touching = !!(c.keys && (c.keys.KeyW || c.keys.KeyA || c.keys.KeyS || c.keys.KeyD || c.keys.ArrowUp || c.keys.ArrowDown));
      still = onP && !touching ? still + dt : 0;
      if (onP) { rode += dt; if (rode > 6) { rode = -1e9; c.egg('ride', 'A ride on the carousel of friends. Two hundred and sixty eight of them, all drawn in marker, all here somewhere.'); } }
      if (still > 11 && !patient) { patient = true; c.sound.ding(); c.flash(0.4); c.egg('patience', 'Patient Panda. Eleven seconds without touching anything, which is longer than most people last on the internet. Macro patience.'); }
    });
    // the wall of 268: every verified name on the west wall, in marker, purple on white
    const NAMES = ['Accountable Ant', 'Adaptable Alien', 'Adventurous Astronaut', 'Alert Ape', 'Ambitious Angel', 'Authentic Anaconda', 'Balanced Beetle', 'Be The Bigger Person', 'Brave Bison', 'Bullish Bull', 'Gary Bee', 'Charismatic Chameleon', 'Common Sense Cow', 'Confident Cobra', 'Considerate Cowboy', 'Courtside Cat', 'Creative Crab', 'Curious Crane', 'Cynical Cat', 'Dapper Dachshund', 'Decisive Duck', 'Dialed In Dog', 'Dynamic Dinosaur', 'Eager Eagle', 'Empathy Elephant', 'Entrepreneur Elf', '5555 Fan', 'Focused Falcon', 'Garage Sale Yale', 'Genuine Giraffe', 'Gift Goat', 'Gratitude Gorilla', 'Helpful Hippo', 'Hodl Hyena', 'Honest Honey Bee', 'Humble Hedgehog', 'Hustling Hamster', 'Jolly Jack-O', 'Karma Kiwi', 'Keynote Koala', 'Kind Kudu', 'Last Glass Standing', 'Legit Llama', 'Logical Lion', 'Macro Micro', 'Mentor Meeting Mongoose', 'O.G. Ox', 'Patient Panda', 'Patient Pig', 'Perspective Pigeon', 'Podcast Panther', 'Practical Peacock', 'Radical Rabbit', 'Reliable Rat', 'Self-Aware Hare', 'Sensible Sommelier', 'Sharing Squirrel', 'Shrewd Shark', 'Skilled Skeleton', 'Tennis Elbow', 'To The Moon Meerkat', 'Tremendous Tiger', 'Uno Unicorn', 'Willful Wizard', 'Zealous Zombie', 'Zestful Zebra'];
    const wallT = c.canvasTex(2048, 1024, (q, w, h) => { q.fillStyle = '#f4ead2'; q.fillRect(0, 0, w, h); q.fillStyle = '#5a2fa0'; q.font = `900 64px ${c.SERIF}`; q.fillText('MEET THE 268', 40, 90); q.font = `700 22px ${c.MONO}`; q.fillText('10,255 TOKENS · 268 CHARACTERS · EVERY ONE DRAWN BY HAND IN MARKER · HERE ARE SIXTY SIX OF THEM', 40, 130); q.font = `600 26px ${c.FONT}`; NAMES.forEach((n, i) => { q.fillStyle = ['#111', '#5a2fa0'][i % 2]; q.fillText(n, 40 + (i % 4) * 500, 190 + Math.floor(i / 4) * 46); }); for (let i = 0; i < 6; i++) eyeFlower(q, 1700 + (i % 3) * 110, 820 + Math.floor(i / 3) * 110, 44, '#fbe6f0', '#5a2fa0'); });
    const wm = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 4.8), new THREE.MeshStandardMaterial({ map: wallT, roughness: 0.9 })); wm.position.set(0.16, 3.0, -1.2); wm.rotation.y = PI / 2; g.add(wm);
    c.clickable(wm, () => c.egg('meet268', 'Sixty six of the two hundred and sixty eight, every one a trait and an animal, every one drawn by a man who says he cannot draw. Patient Panda sold out first.'), 'The wall of friends');
    const ticket = c.sign('ADMISSION 9,400 · GIFT GOAT 555 · ACCESS 300 · THE RIDE IS FREE', { w: 4.6, h: 0.3, bg: '#5a2fa0', fg: '#f4ead2', font: c.MONO, weight: 800 }); ticket.position.set(10, 4.8, -7.86); g.add(ticket);
    cast(c, r, g, X, 'elf', 17.0, 4.6, { h: 1.6, ry: -0.8, line: 'Entrepreneur Elf. Real character, number one hundred and something. The elves run the ticket booth, the panda runs the ride.', egg: 'elf', hint: 'The ticket elf' });
  },

  // VEECON. You are on the stage. One is greater than zero: the room fills as long as you keep moving.
  veecon(c, r, g, X) {
    const { THREE } = c;
    // the stage, raised, across the south of the floor; a catwalk out into the pit
    const black = std(c, 0x111116, { roughness: 0.5 });
    g.add(c.slab(W, 0.6, 5.0, black, W / 2, 0.3, 5.5)); g.add(c.slab(2.6, 0.6, 9.0, black, W / 2, 0.3, -1.5));
    for (const x of [0.5, 19.5]) g.add(c.slab(0.5, 0.1, 5.0, std(c, 0xf5c542), x, 0.62, 5.5));
    r.ground = (x, z) => (z > 3.0 || (Math.abs(x - W / 2) < 1.3 && z > -6.0) ? 0.6 : 0);
    // the truss and the moving heads
    const truss = std(c, 0x444444, { metalness: 0.8, roughness: 0.4 }); g.add(c.slab(W, 0.2, 0.2, truss, W / 2, 5.4, 2.8)); g.add(c.slab(W, 0.2, 0.2, truss, W / 2, 5.4, -5.0));
    const beams = []; for (let k = 0; k < 6; k++) { const b = new THREE.Group(); b.position.set(2 + k * 3.2, 5.2, 2.8); g.add(b); b.add(c.slab(0.24, 0.3, 0.24, std(c, 0x222222), 0, 0, 0)); const lens = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), basic(c, [0xff4fa3, 0x22d3ee, 0xf5c542][k % 3])); lens.position.set(0, -0.16, 0); lens.rotation.x = PI / 2; b.add(lens); beams.push({ b, k }); }
    // the counter on the screens
    const cnt = c.canvasTex(512, 256, () => {}), cq = cnt.userData.canvas.getContext('2d');
    const draw = (n) => { cq.fillStyle = '#0a0a12'; cq.fillRect(0, 0, 512, 256); cq.fillStyle = '#ff4fa3'; cq.font = `700 24px ${c.MONO}`; cq.textAlign = 'center'; cq.fillText('IN THE ROOM', 256, 50); cq.fillStyle = '#f4ead2'; cq.font = `900 120px ${c.SERIF}`; cq.fillText(n.toLocaleString('en-US'), 256, 170); cq.fillStyle = '#22d3ee'; cq.font = `700 20px ${c.MONO}`; cq.fillText(n <= 1 ? 'ONE IS GREATER THAN ZERO' : 'KEEP MOVING', 256, 225); cnt.needsUpdate = true; };
    draw(1);
    for (const x of [2.8, 17.2]) { const s = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.1), new THREE.MeshBasicMaterial({ map: cnt, toneMapped: false })); s.position.set(x, 3.6, -7.8); g.add(s); g.add(c.slab(4.4, 2.3, 0.12, black, x, 3.6, -7.86)); }
    // the crowd: instanced bodies and flower heads that appear one by one as you move
    const MAXN = c.MOBILE ? 180 : 420, bodyG = new THREE.CylinderGeometry(0.2, 0.24, 1.0, 10), headG = new THREE.PlaneGeometry(0.6, 0.6);
    HEAD.t ||= c.canvasTex(256, 256, (q, w) => eyeFlower(q, w / 2, w / 2, w / 2 * 0.98));
    const bodies = new THREE.InstancedMesh(bodyG, std(c, 0x1a1a22, { roughness: 0.9 }), MAXN), heads = new THREE.InstancedMesh(headG, new THREE.MeshStandardMaterial({ map: HEAD.t, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, roughness: 0.6 }), MAXN);
    bodies.count = 1; heads.count = 1; g.add(bodies); g.add(heads);
    const spots = []; for (let i = 0; i < MAXN; i++) { const ring = Math.floor(i / 18) + 1; let x, z; if (i === 0) { x = 10; z = -2.6; } else { const a = (i % 18) / 18 * PI * 1.2 - PI * 0.1 + Math.random() * 0.1, rr = 1.8 + ring * 0.75 + Math.random() * 0.3; x = 10 + Math.cos(a) * rr * 1.6; z = -1.2 - Math.sin(a) * rr; } spots.push([Math.max(1, Math.min(19, x)), Math.max(-7.4, Math.min(2.8, z)), Math.random() * 6, 0.9 + Math.random() * 0.15]); }
    const M = new THREE.Matrix4(), col = new THREE.Color(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), Pv = new THREE.Vector3();
    let walked = 0, shown = 1, last = [0, 0], confetti = null, big = false;
    // the visitors (2026-10-28): eight whole characters of the cast, their own flower heads included, at 300 triangles (crowd.js,
    // the lite part), one InstancedMesh each holding every eighth visitor; the cylinders and sprite heads stay until they land
    // and come back with ?crowd=old
    const VEECON = ['editor', 'workgirl', 'golfer', 'assistant', 'cabbie', 'wiseguy', 'rosemary', 'tough'], VCOL = [0x1a1a22, 0x2a2a3a, 0x5a1030, 0x1a2a4a, 0x3a2a1a];
    let vb = null; const BS = 1.6 / 1.88, Qb = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0);
    const place = (i, t) => { const [x, z, ph, sc] = spots[i], bob = Math.abs(Math.sin(t * 5 + ph)) * 0.18; Q.identity(); S.set(sc, sc, sc);
      if (vb) { const n = vb.length, m = vb[i % n]; Pv.set(x, bob, z); Qb.setFromAxisAngle(UP, Math.sin(ph * 3.1) * 0.35); S.setScalar(sc * BS); M.compose(Pv, Qb, S); m.setMatrixAt((i / n) | 0, M); S.set(sc, sc, sc); }
      else { Pv.set(x, 0.5 * sc + bob, z); M.compose(Pv, Q, S); bodies.setMatrixAt(i, M); }
      Pv.set(x, 1.3 * sc + bob, z); M.compose(Pv, Q, S); heads.setMatrixAt(i, M); };
    for (let i = 0; i < MAXN; i++) { place(i, 0); bodies.setColorAt(i, col.setHex(VCOL[i % 5])); }
    bodies.instanceMatrix.needsUpdate = true; heads.instanceMatrix.needsUpdate = true;
    const counts = () => { if (vb) vb.forEach((m, k) => { m.count = Math.max(0, Math.ceil((shown - k) / vb.length)); m.instanceMatrix.needsUpdate = true; }); };
    if (CROWD.on) crowdParts(VEECON, 'lite').then((parts) => {
      if (!parts.length) return;
      const n = parts.length, wh = new THREE.Color();
      vb = parts.map((p, k) => { const m = new THREE.InstancedMesh(p.geo, p.mat.clone(), Math.ceil(MAXN / n)); m.material.envMapIntensity = 1.0; m.frustumCulled = false;
        for (let j = 0; j * n + k < MAXN; j++) m.setColorAt(j, wh.setHex(0xffffff).lerp(col.setHex(VCOL[(j * n + k) % 5]), 0.3));
        g.add(m); c.clickable(m, front, 'The front row'); return m; });
      bodies.visible = false; heads.visible = false; for (let i = 0; i < MAXN; i++) place(i, 0); counts();
    });
    const cf = c.MOBILE ? 200 : 500, cfG = new THREE.PlaneGeometry(0.08, 0.14), cfM = new THREE.InstancedMesh(cfG, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }), cf), cfP = new Float32Array(cf * 4); cfM.visible = false; g.add(cfM);
    for (let i = 0; i < cf; i++) { cfP[i * 4] = Math.random() * W; cfP[i * 4 + 1] = 6 + Math.random() * 6; cfP[i * 4 + 2] = -7 + Math.random() * 10; cfP[i * 4 + 3] = Math.random() * 6; cfM.setColorAt(i, col.setHex([0xff4fa3, 0x22d3ee, 0xf5c542, 0xffffff][i % 4])); }
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return;
      const mv = Math.hypot(P.x - last[0], P.z - last[1]); last = [P.x, P.z];
      if (mv < 0.5) walked += mv;
      const want = Math.min(MAXN, 1 + Math.floor(walked * 9)); const count = 1 + Math.floor(walked * 120);
      if (want !== shown) { shown = want; bodies.count = shown; heads.count = shown; }
      for (let i = 0; i < shown; i++) place(i, t); bodies.instanceMatrix.needsUpdate = true; heads.instanceMatrix.needsUpdate = true; counts();
      if ((t * 6 | 0) !== ((t - dt) * 6 | 0)) draw(Math.min(count, 7000));
      beams.forEach(({ b, k }) => { b.rotation.x = Math.sin(t * 0.7 + k) * 0.5; b.rotation.z = Math.sin(t * 0.5 + k * 1.3) * 0.4; });
      if (count >= 7000 && !big) { big = true; cfM.visible = true; c.flash(0.7); c.sound.applause(5); c.egg('seventhousand', 'Seven thousand, from forty seven states and seventy countries, in a football stadium in Minneapolis, because one guy kept moving. One was greater than zero.'); }
      if (cfM.visible) { for (let i = 0; i < cf; i++) { cfP[i * 4 + 1] -= dt * (1.2 + (i % 5) * 0.3); if (cfP[i * 4 + 1] < 0.7) cfP[i * 4 + 1] = 8 + Math.random() * 3; Pv.set(cfP[i * 4] + Math.sin(t * 2 + cfP[i * 4 + 3]) * 0.3, cfP[i * 4 + 1], cfP[i * 4 + 2]); Q.setFromEuler(new THREE.Euler(t * 2 + i, cfP[i * 4 + 3], 0)); S.set(1, 1, 1); M.compose(Pv, Q, S); cfM.setMatrixAt(i, M); } cfM.instanceMatrix.needsUpdate = true; }
    });
    function front() { c.sound.applause(1.5); c.egg('onegreater', 'The first one. One person in the room is greater than zero, and he would do the whole keynote for them. Keep moving and the rest show up.'); }
    c.clickable(bodies, front, 'The front row');
    const mc = cast(c, r, g, X, 'tracksuit', 3.6, 5.6, { h: 1.8, ry: 0.9, line: 'VeeCon, 2022. No tickets, only the tokens. Every single holder got in. The coolest business conference, he said. He was not wrong about the coolest.', egg: 'mc', hint: 'The MC' });
    cast(c, r, g, X, 'dancer', 16.4, 5.6, { h: 1.8, ry: -0.9, line: 'Minneapolis, then Indianapolis, then Los Angeles. Then a year off. The next one is coming, they keep saying.', egg: 'veecons', hint: 'A dancer' });
    plaque(c, g, 10, 2.0, 7.86, PI, 'We want to be the coolest business conference.', 'GARY VAYNERCHUK, ON VEECON', 2.2);
  },

  // THE ATTENTION EXCHANGE. Eight platforms, eight prices, one rule: buy it while it is underpriced.
  attention(c, r, g, X) {
    const { THREE } = c;
    const PLAT = ['SHORT VIDEO', 'PODCAST', 'NEWSLETTER', 'LIVE', 'THE STREET', 'LONG VIDEO', 'THE GROUP CHAT', 'A NEW APP'];
    const rows = PLAT.map((n, k) => ({ n, p: 40 + Math.random() * 60, hist: [], avg: 0, pos: 0, k }));
    const T = c.canvasTex(1024, 1024, () => {}), q = T.userData.canvas.getContext('2d');
    const board = new THREE.Mesh(new THREE.PlaneGeometry(7.0, 7.0), new THREE.MeshBasicMaterial({ map: T, toneMapped: false })); board.position.set(0.18, 3.2, -1.6); board.rotation.y = PI / 2; g.add(board);
    let profit = 0, wins = 0, trades = 0;
    const draw = () => {
      q.fillStyle = '#06080c'; q.fillRect(0, 0, 1024, 1024); q.fillStyle = '#f5c542'; q.font = `900 56px ${c.SERIF}`; q.fillText('ATTENTION', 40, 80); q.fillStyle = '#7fff9a'; q.font = `700 24px ${c.MONO}`; q.fillText(`P/L $${profit.toFixed(0)} · ${wins} WINNING TRADES · CLICK A ROW TO BUY, AGAIN TO SELL`, 40, 118);
      rows.forEach((r2, i) => { const y = 170 + i * 104, under = r2.p < r2.avg * 0.85, over = r2.p > r2.avg * 1.15;
        q.fillStyle = r2.pos ? '#1a2a40' : '#0d1018'; q.fillRect(30, y, 964, 92); q.fillStyle = '#f4ead2'; q.font = `800 30px ${c.MONO}`; q.fillText(r2.n, 48, y + 40);
        q.fillStyle = under ? '#7fff9a' : over ? '#ff4060' : '#f4ead2'; q.font = `900 40px ${c.MONO}`; q.textAlign = 'right'; q.fillText('$' + r2.p.toFixed(2), 980, y + 44); q.textAlign = 'left';
        q.font = `700 20px ${c.MONO}`; q.fillStyle = under ? '#7fff9a' : over ? '#ff4060' : '#8d8676'; q.fillText(under ? 'UNDERPRICED' : over ? 'EVERYBODY IS HERE' : 'FAIR', 48, y + 76); if (r2.pos) { q.fillStyle = '#22d3ee'; q.fillText(`HOLDING FROM $${r2.pos.toFixed(2)}`, 300, y + 76); }
        q.strokeStyle = under ? '#7fff9a' : '#ff4060'; q.lineWidth = 3; q.beginPath(); r2.hist.forEach((v, j) => { const x = 560 + j * 6, yy = y + 86 - (v - 20) * 0.6; j ? q.lineTo(x, yy) : q.moveTo(x, yy); }); q.stroke(); });
      T.needsUpdate = true; };
    let acc = 0;
    c.tick((t, dt, P, ri) => { acc += dt; if (acc < 0.5) return; acc = 0; rows.forEach((r2) => { r2.p = Math.max(12, Math.min(120, r2.p + (Math.random() - 0.5) * 9 + (r2.p < 30 ? 1.5 : r2.p > 100 ? -1.5 : 0))); r2.hist.push(r2.p); if (r2.hist.length > 60) r2.hist.shift(); r2.avg = r2.hist.reduce((a, b) => a + b, 0) / r2.hist.length; }); if (ri === r.i) draw(); });
    c.clickable(board, () => {
      const p = c.lastHit?.point; if (!p) return; const i = Math.floor((3.2 + 3.5 - p.y) / 7.0 * 1024 - 170) / 104 | 0; const r2 = rows[Math.max(0, Math.min(7, i))];
      if (!r2.pos) { r2.pos = r2.p; trades++; c.sound.ticket(); c.toast(`Bought ${r2.n} at $${r2.p.toFixed(2)}.${r2.p < r2.avg * 0.85 ? ' Underpriced. Good.' : ' Everybody can see this one.'}`, 2600); c.egg('buy'); }
      else { const pl = r2.p - r2.pos; profit += pl; if (pl > 0) wins++; r2.pos = 0; c.sound.ding(); c.toast(pl > 0 ? `Sold ${r2.n} for $${pl.toFixed(2)} profit. You bought it before the marketers.` : `Sold ${r2.n} for a $${(-pl).toFixed(2)} loss. The marketers got there first and ruined it, as he says they do.`, 3400); if (wins >= 3) c.egg('underpriced', 'Three winning trades. Underpriced attention is not the cheapest medium, it is the one that gives the most back for what it costs. He day trades it. So did you.'); }
      draw();
    }, 'The board');
    // the ticker over the pit and the pit itself
    const tk = c.sign('   ATTENTION IS THE ASSET  ·  SPEED IS THE VARIABLE  ·  MARKETERS RUIN EVERYTHING  ·  DAY TRADE IT  ·  ', { w: 12, h: 0.4, bg: '#0d0d0d', fg: '#f5c542', font: c.MONO, weight: 800, px: 96 }); tk.position.set(10, 5.0, -7.86); g.add(tk); tk.material.map.wrapS = THREE.RepeatWrapping;
    c.tick((t, dt, P, ri) => { if (ri === r.i) tk.material.map.offset.x += dt * 0.06; });
    const rail = std(c, 0xc9a033, { metalness: 1, roughness: 0.3 }); for (const [x, z, w, d] of [[10, -4.8, 8, 0.05], [6, -2.4, 0.05, 4.8], [14, -2.4, 0.05, 4.8]]) { g.add(c.slab(w, 0.05, d, rail, x, 1.0, z)); }
    for (const [x, z] of [[6, -4.8], [14, -4.8], [6, 0], [14, 0]]) g.add(c.slab(0.05, 1.0, 0.05, rail, x, 0.5, z));
    c.wall(X(6), -4.8, X(14), -4.8); c.wall(X(6), -4.8, X(6), 0); c.wall(X(14), -4.8, X(14), 0);
    const pit = []; for (let i = 0; i < 12; i++) { const e = extra(c, g, 6.8 + (i % 4) * 2.1, -4.2 + Math.floor(i / 4) * 1.6, { col: [0xff4060, 0x7fff9a, 0x22d3ee, 0xf5c542][i % 4], ry: PI / 2 }); pit.push({ e, s: Math.random() * 6 }); }
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; pit.forEach((p) => { p.e.position.y = Math.abs(Math.sin(t * 4 + p.s)) * 0.2; p.e.rotation.y = PI / 2 + Math.sin(t * 2 + p.s) * 0.7; }); });
    // the penny jar and the brokers
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.42, 20, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.9, roughness: 0.05, thickness: 0.02, transparent: true, opacity: 0.4, side: THREE.DoubleSide })); jar.position.set(16.6, 1.0, 5.4); g.add(jar);
    const pennies = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.18, 0.3, 20), std(c, 0xb87333, { metalness: 0.9, roughness: 0.35 })); pennies.position.set(16.6, 0.94, 5.4); g.add(pennies);
    const jl = c.sign('$1.80', { w: 0.5, h: 0.14, bg: '#f4ead2', fg: '#111', font: c.MONO, weight: 900, px: 48 }); jl.position.set(16.6, 1.28, 5.62); g.add(jl);
    c.clickable(jar, () => { c.sound.clink(2200); c.egg('pennies', 'A dollar eighty in pennies. Ninety comments at two cents each, which is how a nobody becomes a somebody on any platform that has a comment box.'); }, 'The penny jar');
    cast(c, r, g, X, 'annieh', 3.2, -4.6, { h: 1.85,   // was broker, whose model stops above the knee and read sunk (2026-10-28)
      ry: 0.6, line: 'Short video is at a hundred and twelve. Sell. Everybody and their aunt is on it now.', egg: 'broker1', hint: 'A trader' });
    cast(c, r, g, X, 'editor', 17.2, -3.4, { h: 1.8, ry: -1.4, line: 'The new app is at nineteen and nobody wants it. That is the one. That is always the one.', egg: 'broker2', hint: 'A trader' });
    plaque(c, g, 10, 2.2, 7.86, PI, 'I day trade attention and build businesses.', 'GARYVAYNERCHUK.COM, LINE ONE', 2.2);
  },

  // THE OWNER'S BOX. Green carpet, the knitted five, and a football you throw through the uprights.
  jets(c, r, g, X) {
    const { THREE } = c, marble = c.surf('marble', 2, 0xd8d0c0), dark = std(c, 0x1a2a20, { roughness: 0.5 });
    g.add(c.slab(4.6, 1.05, 0.9, marble, 16.6, 0.52, 6.6)); c.wall(X(14.3), 6.15, X(18.9), 6.15); c.wall(X(14.3), 6.15, X(14.3), 7.05);
    // the uprights, in the room, in front of the picture of the field
    const yellow = std(c, 0xf5d020, { roughness: 0.4 }), UX = 10, UZ = -6.9;
    for (const dx of [-1.4, 1.4]) g.add(c.slab(0.1, 4.0, 0.1, yellow, UX + dx, 4.8, UZ)); g.add(c.slab(2.9, 0.1, 0.1, yellow, UX, 2.8, UZ)); g.add(c.slab(0.12, 2.8, 0.12, yellow, UX, 1.4, UZ + 0.5)); g.add(c.slab(0.12, 0.12, 0.6, yellow, UX, 2.8, UZ + 0.25));
    // the ball: click it and it leaves your hand along your line of sight; through the posts above the bar and you scored
    const ballG = new THREE.SphereGeometry(0.14, 14, 10); ballG.scale(1, 0.7, 0.7);
    const balls = []; let scored = 0, thrown = 0;
    const fw = new THREE.Vector3();
    const throwBall = () => {
      const P = c.P, b = new THREE.Mesh(ballG, std(c, 0x7a4a2a, { roughness: 0.6 })); c.camera.getWorldDirection(fw); b.position.set(P.x - r.x0 + fw.x * 0.6, c.camera.position.y + fw.y * 0.6 - 0.1, P.z + fw.z * 0.6); g.add(b);
      const sp = 13; balls.push({ b, v: new THREE.Vector3(fw.x * sp, fw.y * sp + 3.5, fw.z * sp), t: 0, done: false }); thrown++; c.sound.whoosh(0.15, 0.5); c.egg('throw');
    };
    const ballOnBar = c.slab(0.3, 0.2, 0.2, new THREE.MeshBasicMaterial({ visible: false }), 16.0, 1.1, 6.4); g.add(ballOnBar);
    c.clickable(ballOnBar, throwBall, 'Throw the football where you are looking');
    const big = c.slab(W, 4, 1.4, new THREE.MeshBasicMaterial({ visible: false }), W / 2, 2.5, -7.0); g.add(big); c.clickable(big, throwBall, 'Throw at the uprights');
    c.tick((t, dt, P, ri) => {
      for (const o of balls) { if (o.done) continue; o.t += dt; o.v.y -= 9.8 * dt; const pz = o.b.position.z; o.b.position.addScaledVector(o.v, dt); o.b.rotation.x += dt * 12;
        if (pz > UZ && o.b.position.z <= UZ) { const good = Math.abs(o.b.position.x - UX) < 1.35 && o.b.position.y > 2.85 && o.b.position.y < 6.8; if (good) { scored++; c.flash(0.5); c.sound.applause(2.5); c.toast('GOOD. Right through them.', 2600); c.egg('uprights', 'Through the uprights, from the owner\'s box. The dream since age eleven. Twenty two to twenty three years, he said in 2021. The clock is running.'); if (scored >= 3) c.egg('hattrick', 'Three through. Nobody in that box has ever done that, including the man who wants the keys.'); } else c.toast(['Wide left.', 'Wide right.', 'Short.', 'Off the bar.'][(Math.random() * 4) | 0], 1600); }
        if (o.b.position.y < 0.15 || o.b.position.z < -8.5 || o.t > 6) { o.done = true; setTimeout(() => g.remove(o.b), 2000); } }
    });
    // the knitted five in a case, and the jersey story
    const caseG = new THREE.Group(); caseG.position.set(2.6, 0, 1.8); g.add(caseG);
    caseG.add(c.slab(1.4, 0.9, 0.6, dark, 0, 0.45, 0)); caseG.add(c.slab(1.3, 1.5, 0.5, new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.9, roughness: 0.03, thickness: 0.03, transparent: true, opacity: 0.3 }), 0, 1.65, 0));
    const jersey = c.sign('5', { w: 0.9, h: 1.1, bg: GREEN, fg: '#ffffff', font: c.SERIF, weight: 900, px: 256, pad: 0.2, border: '#ffffff' }); jersey.position.set(0, 1.6, 0.1); caseG.add(jersey); c.post(X(2.6), 1.8, 0.9);
    c.clickable(jersey, () => c.egg('knitted', 'The first jersey in America had a five on it, knitted by his mother in Queens. It is still his number. It is on the pickleball team.'), 'The knitted five');
    plaque(c, g, 2.6, 2.6, 2.15, 0, 'I want to be the operator.', 'FRONT OFFICE SPORTS, FEBRUARY 2026', 1.5);
    const jt = c.sign('N3W YORK · 22 TO 23 YEARS · THE CLOCK IS RUNNING', { w: 5.0, h: 0.34, bg: GREEN, fg: '#ffffff', font: c.MONO, weight: 800 }); jt.position.set(10, 5.5, -7.86); g.add(jt);
    cast(c, r, g, X, 'famer', 17.0, 2.0, { h: 1.8, ry: -1.0, line: 'Season tickets since 1979. He says he will buy the team. I say get in line behind me.', egg: 'seasonticket', hint: 'A season ticket holder' });
    cast(c, r, g, X, 'dad', 5.6, -3.6, { h: 1.8, ry: 0.5, line: 'He was eleven. He said, I am going to own them one day. We did not have a car.', egg: 'eleven', hint: 'The father' });
  },

  // THE CLOUDS. A deck above the weather. The words are in the air and only line up from the stars on the floor.
  clouds(c, r, g, X) {
    const { THREE } = c;
    // the railing at the edge, glass, and the deck
    const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.9, roughness: 0.02, thickness: 0.02, transparent: true, opacity: 0.25 }), steel = std(c, 0xd0d0d0, { metalness: 1, roughness: 0.3 });
    g.add(c.slab(W, 1.1, 0.04, glass, W / 2, 0.6, -D / 2 + 1.25)); for (let k = 0; k <= 10; k++) g.add(c.slab(0.05, 1.15, 0.05, steel, k * 2, 0.58, -D / 2 + 1.25)); g.add(c.slab(W, 0.05, 0.08, steel, W / 2, 1.16, -D / 2 + 1.25));
    // the quotes in the sky: each cut into tiles thrown along rays from a star; stand on the star and they line up
    const QUOTES = [['Macro patience, micro speed.', 'his line, in his books and on his stages'], ['Document, don\'t create.', 'the title of his 2016 piece'], ['Kindness is karma.', 'garyvaynerchuk.com'], ['Gratitude is the cure.', 'garyvaynerchuk.com'], ['Your dreams don\'t have to be big. They have to be yours.', 'garyvaynerchuk.com'], ['Clouds and dirt.', 'chapter one, #AskGaryVee, 2016'], ['Jab, jab, jab, right hook.', 'the 2013 book'], ['I day trade attention and build businesses.', 'line one of his bio']];
    const stars = [];
    QUOTES.forEach(([text, src], k) => {
      const sx = 2.6 + (k % 4) * 4.9, sz = 5.6 - Math.floor(k / 4) * 4.6, yaw = (k % 4 - 1.5) * 0.35, pitch = 0.32 + (k % 2) * 0.14;
      const star = decal(c, 0.9, 0.9, (q, w, h) => { q.fillStyle = '#f5c542'; q.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2 - PI / 2, rr = i % 2 ? w * 0.2 : w * 0.48; q.lineTo(w / 2 + Math.cos(a) * rr, h / 2 + Math.sin(a) * rr); } q.fill(); q.fillStyle = '#0d0d0d'; q.font = `800 ${w * 0.14}px ${c.MONO}`; q.textAlign = 'center'; q.fillText(String(k + 1), w / 2, h / 2 + 8); });
      star.rotation.x = -PI / 2; star.position.set(sx, 0.02, sz); g.add(star);
      const dir = new THREE.Vector3(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)), right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize(), up = new THREE.Vector3().crossVectors(right, dir).normalize();
      const eye = new THREE.Vector3(sx, c.EYE, sz), D0 = 16, WQ = 10, N = 28, cw = 2048, chh = 256;
      const tex = c.canvasTex(cw, chh, (q, w, h) => { q.fillStyle = '#1a1612'; q.font = `900 ${h * 0.5}px ${c.SERIF}`; q.textAlign = 'center'; q.textBaseline = 'middle'; let fs = h * 0.5; while (q.measureText(text).width > w * 0.96 && fs > 20) { fs -= 4; q.font = `900 ${fs}px ${c.SERIF}`; } q.shadowColor = 'rgba(255,240,220,.9)'; q.shadowBlur = 14; q.fillText(text, w / 2, h / 2); });
      const HQ = WQ * chh / cw;
      for (let i = 0; i < N; i++) {
        const geo = new THREE.PlaneGeometry(WQ / N, HQ), uv = geo.attributes.uv; for (let v = 0; v < uv.count; v++) uv.setX(v, (i + uv.getX(v)) / N);
        const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, fog: false, side: THREE.DoubleSide, depthWrite: false }));
        const d = D0 * (0.45 + Math.random() * 1.3), pOnPlane = eye.clone().addScaledVector(dir, D0).addScaledVector(right, (i + 0.5) / N * WQ - WQ / 2);
        const p = eye.clone().add(pOnPlane.sub(eye).multiplyScalar(d / D0)); m.position.copy(p); m.lookAt(eye); m.scale.setScalar(d / D0); g.add(m);
      }
      stars.push({ sx, sz, dir, text, src, k, got: false, held: 0 });
    });
    // written out so the build can count them
    const QEGG = [() => c.egg('q0'), () => c.egg('q1'), () => c.egg('q2'), () => c.egg('q3'), () => c.egg('q4'), () => c.egg('q5'), () => c.egg('q6'), () => c.egg('q7')];
    const fw = new THREE.Vector3(); let found = 0;
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return; c.camera.getWorldDirection(fw);
      for (const s of stars) { const on = Math.hypot(P.x - r.x0 - s.sx, P.z - s.sz) < 0.55 && fw.dot(s.dir) > 0.96; s.held = on ? s.held + dt : 0; if (s.held > 1.2 && !s.got) { s.got = true; found++; c.sound.ding(); c.toast(`${s.k + 1}. "${s.text}"  (${s.src})`, 4200); QEGG[s.k](); if (found === QUOTES.length) c.egg('allquotes', 'Every line in the sky, read from its star. That is the whole philosophy: it only makes sense from exactly where you are standing.'); } }
    });
    // macro patience, micro speed: a clock on the deck with two hands. Years move while you stand still. Days move while you walk.
    const CX = 10, CZ = 2.0;
    const face = decal(c, 2.6, 2.6, (q, w, h) => { q.fillStyle = '#f4ead2'; q.beginPath(); q.arc(w / 2, h / 2, w * 0.49, 0, 7); q.fill(); q.strokeStyle = '#111'; q.lineWidth = 6; q.beginPath(); q.arc(w / 2, h / 2, w * 0.46, 0, 7); q.stroke(); for (let k = 0; k < 12; k++) { const a = k / 12 * PI * 2; q.beginPath(); q.moveTo(w / 2 + Math.cos(a) * w * 0.38, h / 2 + Math.sin(a) * h * 0.38); q.lineTo(w / 2 + Math.cos(a) * w * 0.44, h / 2 + Math.sin(a) * h * 0.44); q.stroke(); } q.fillStyle = '#111'; q.font = `800 ${w * 0.05}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('MACRO PATIENCE', w / 2, h * 0.3); q.fillText('MICRO SPEED', w / 2, h * 0.74); }, 512);
    face.rotation.x = -PI / 2; face.position.set(CX, 0.02, CZ); g.add(face);
    const hand = (len, wdt, col) => { const m = c.slab(wdt, 0.01, len, std(c, col), 0, 0.03, -len / 2); const piv = new THREE.Group(); piv.position.set(CX, 0.02, CZ); piv.add(m); g.add(piv); return piv; };
    const years = hand(1.0, 0.06, 0x111111), days = hand(0.7, 0.04, 0xff4fa3);
    let yr = 0, dy = 0, lastP = [0, 0], clockDone = false;
    const yl = c.sign('YEARS', { w: 0.5, h: 0.12, bg: null, fg: '#111', font: c.MONO, weight: 800, px: 40 }); yl.rotation.x = -PI / 2; yl.position.set(CX, 0.03, CZ - 1.5); g.add(yl);
    const dl = c.sign('DAYS', { w: 0.5, h: 0.12, bg: null, fg: '#ff4fa3', font: c.MONO, weight: 800, px: 40 }); dl.rotation.x = -PI / 2; dl.position.set(CX, 0.03, CZ + 1.5); g.add(dl);
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return; const mv = Math.hypot(P.x - lastP[0], P.z - lastP[1]); lastP = [P.x, P.z];
      const near = Math.hypot(P.x - r.x0 - CX, P.z - CZ) < 6;
      if (near) { if (mv < 0.003) yr += dt / 20; else dy += mv / 50; }
      years.rotation.y = -Math.min(1, yr) * PI * 2; days.rotation.y = -Math.min(1, dy) * PI * 2;
      if (yr >= 1 && dy >= 1 && !clockDone) { clockDone = true; c.sound.ding(); c.flash(0.4); c.egg('macromicro', 'Macro patience, micro speed. Twenty seconds of standing still for the years, fifty metres of walking for the days. Both hands went round. Most people only move one.'); }
    });
    // the birds, the vane, the bench plaque
    const gulls = []; for (let k = 0; k < 4; k++) { const b = c.glb('gull', { len: 0.6, x: 10, y: 5 + k, z: -4, parent: g, shadow: false }); gulls.push({ b, k }); }
    c.tick((t) => gulls.forEach(({ b, k }) => { const a = t * 0.25 + k * 1.6; b.position.set(10 + Math.cos(a) * (5 + k), 4.5 + k * 0.6 + Math.sin(t + k) * 0.3, -3 + Math.sin(a) * 3); b.rotation.y = -a + PI / 2; }));
    const vane = new THREE.Group(); vane.position.set(18.6, 0, -5.4); g.add(vane); vane.add(c.slab(0.04, 3.2, 0.04, steel, 0, 1.6, 0)); const arrow = c.slab(0.8, 0.04, 0.04, std(c, 0xf5c542), 0, 3.25, 0); vane.add(arrow); c.tick((t) => { arrow.rotation.y = Math.sin(t * 0.3) * 0.8; }); c.post(X(18.6), -5.4, 0.2);
    plaque(c, g, 10, 0.95, 1.0 - 0.0 + 0.0, 0, 'Happiness over money.', 'GARY VAYNERCHUK', 1.4).position.set(4.0, 0.95, 1.6);
    const rail = c.sign('THE CLOUDS · THE BIG BELIEFS · EVERYTHING ELSE IS NOISE', { w: 4.6, h: 0.3, bg: null, fg: '#111', font: c.MONO, weight: 800, glow: 0 }); rail.position.set(10, 1.5, -D / 2 + 1.2); g.add(rail);
    cast(c, r, g, X, 'golfer', 15.8, 4.0, { h: 1.8, ry: -1.6, line: 'Up here it is just family first and the long game. Down there it is the next post. Nothing in between is worth a minute.', egg: 'noise', hint: 'Somebody on the deck' });
    c.clickable(rail, () => { c.egg('finale'); window.__finale && window.__finale(); }, 'The edge');
  },
};

// the screens on the desks of floor 25: little charts and feeds, never a real logo
const _SCR = {};
function screenTex(c, seed) { const k = Math.abs(Math.round(seed * 7)) % 6; if (_SCR[k]) return _SCR[k]; return (_SCR[k] = c.canvasTex(256, 160, (q, w, h) => { q.fillStyle = '#0d1018'; q.fillRect(0, 0, w, h); q.strokeStyle = ['#7fff9a', '#22d3ee', '#f5c542', '#ff4fa3'][k % 4]; q.lineWidth = 3; q.beginPath(); for (let i = 0; i < 20; i++) { const x = 10 + i * 12, y = 120 - Math.abs(Math.sin(i * 0.7 + k)) * 80; i ? q.lineTo(x, y) : q.moveTo(x, y); } q.stroke(); q.fillStyle = '#f4ead2'; q.font = `700 14px ${c.MONO}`; q.fillText(['REACH', 'VIEWS', 'SAVES', 'SHARES', 'COMMENTS', 'ATTENTION'][k], 12, 24); })); }
