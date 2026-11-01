// ONLY IN NEW YORK, room by room. The museum of everything that could not have happened anywhere else: the memes, the
// viral moments and the civic absurdities, each one real, each one rebuilt at human scale so you can stand in it. Every
// person has an eye flower for a head. The cast are Tripo GLBs from GPT Image 2.5 concepts on FLORA, plus the house
// models (ON LOCATION, THE MARKS, LIVE FROM THE SEWERS) and Poly Haven CC0 props. One trick per room, three or four eggs.
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { W, D, H_IN, PORTAL } from './rooms.js';
import { crowdBody, crowdCast } from './crowd.js';

const PI = Math.PI;
const INK = ['#f5c542', '#ff4fa3', '#22d3ee', '#3b82f6', '#ffffff', '#ff7a1a'];
const DZ1 = 2, DZ2 = 5.6, DH = 3.6;

// who the extras are in each room (crowd.js POOLS, or names): commuters in suits underground, the night crowd in Times Square
const SUITS = ['wiseguy', 'workgirl', 'editor', 'oscar', 'annieh', 'writer'];
const CROWD_CAST = { swipe: SUITS, showtime: 'walkers', nopants: SUITS, frozen: SUITS, rat: 'walkers', line: 'walkers', rent: SUITS, soda: 'walkers',
  fearless: 'walkers', lookalike: 'dressy', duck: 'walkers', pigeon: 'walkers', santas: 'walkers', times: 'night', czar: SUITS, historic: 'walkers', coney: 'walkers' };
export function buildRoom(c, r) {
  const { THREE, scene } = c;
  crowdCast(CROWD_CAST[r.id]);
  const g = r.group = new THREE.Group(); g.position.x = r.x0; scene.add(g);
  const X = (x) => r.x0 + x;
  const mats = matsFor(c, r);
  const HT = r.outdoor ? (r.low ? 4 : 10) : H_IN;

  if (!r.noFloor) g.add(c.slab(W, 0.1, D, mats.floor, W / 2, -0.05, 0));
  if ((r.ceil || r.ceilImg) && !r.outdoor) g.add(c.slab(W, 0.1, D, mats.ceil, W / 2, (r.ceilH || H_IN) + 0.05, 0));
  if (r.outdoor) skyDome(c, g, r);

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
  floorDecals(c, r, g);
  ROOM[r.id] && ROOM[r.id](c, r, g, X, mats);
  (PROPS[r.id] || []).forEach((q) => prop(c, r, g, X, ...q));
  dressing(c, r, g, X);
}


// ---------- surfaces ----------
function matsFor(c, r) {
  const { THREE } = c;
  const m = {};
  m.floor = c.surf(r.floor, r.floor === 'asphalt' ? 3 : r.floor === 'planks' ? 2.2 : 2.2, r.floorTint || (r.outdoor ? 0x6a6c76 : 0x9a9a9a));
  m.ceil = r.ceil ? c.surf(r.ceil, 3, r.ceilTint || 0x8a847a) : null;
  if (r.ceilImg) { const t = c.tex.load(`assets/ceil/${r.ceilImg}.jpg`); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
    m.ceil = new THREE.MeshStandardMaterial({ map: t, color: r.ceilTint || 0xffffff, roughness: 0.8, emissive: r.ceilTint || 0xffffff, emissiveMap: t, emissiveIntensity: r.ceilGlow ?? 0.1 }); m.ceil.userData.rep = r.ceilRep || 3; }
  if ((window.WALLS || []).includes(r.id)) {
    const t = c.tex.load(`assets/walls/${r.id}.jpg`); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8;
    m.wall = new THREE.MeshStandardMaterial({ map: t, roughness: 0.82, color: r.muralTint || 0xffffff });
    m.wall.userData.repX = 10; m.wall.userData.repY = r.outdoor ? (r.low ? 4 : 10) : H_IN;
  }
  else m.wall = c.surf(r.wall || 'brick', 2.4, r.wallTint || 0x6e6660);
  if (r.floor === 'asphalt') { m.floor.roughness = 0.3; m.floor.metalness = 0.3; }
  return m;
}
// the sky over an outdoor room: a gradient dome, lit the way the room says (dawn, overcast, golden, winter, night, summer)
function skyDome(c, g, r) {
  const { THREE } = c;
  const [top, hor] = r.night ? ['#06060e', '#2a1a3a'] : r.dawn ? ['#6a86b8', '#d8ccc0'] : r.overcast ? ['#8a94a4', '#c7d2da'] : r.golden ? ['#5a7fc0', '#dccfb8'] : r.winter ? ['#7aa0d8', '#dde4ee'] : r.summer ? ['#2a6ad0', '#bfe0ff'] : ['#6a90c8', '#d0d6e0'];
  const t = c.canvasTex(16, 256, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(0.55, hor); gr.addColorStop(1, hor); q.fillStyle = gr; q.fillRect(0, 0, w, h); });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(140, 24, 12, 0, PI * 2, 0, PI * 0.52), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false, toneMapped: false, depthWrite: false }));
  dome.position.set(W / 2, -2, 0); dome.renderOrder = -2; g.add(dome);
  // the domes are far bigger than the rooms are apart, so each one shows only while its room is the one you stand in
  c.tick((t, dt, P, ri) => { dome.visible = ri === r.i; });
  if (r.night) { const N = 300, pos = new Float32Array(N * 3); for (let i = 0; i < N; i++) { const a = Math.random() * PI * 2, e = 0.15 + Math.random() * 1.2; pos[i * 3] = W / 2 + Math.cos(a) * Math.cos(e) * 130; pos[i * 3 + 1] = Math.sin(e) * 130; pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * 130; } const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.6, fog: false, toneMapped: false }))); }
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
const here = (r, ri) => ri === r.i;
const local = (r, P) => ({ x: P.x - r.x0, z: P.z });
// does the visitor look at a point (local room coords)? the dot of the view direction with the direction to it
const _f = { v: null };
function looking(c, r, x, z, thr = 0.6) { const { THREE, camera, P } = c; _f.v ||= new THREE.Vector3(); camera.getWorldDirection(_f.v); const dx = r.x0 + x - P.x, dz = z - P.z, d = Math.hypot(dx, dz) || 1; return (dx * _f.v.x + dz * _f.v.z) / (d * (Math.hypot(_f.v.x, _f.v.z) || 1)) > thr; }

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

const HEAD = {};
// a simple New Yorker: a body, legs and an eye flower for a head. The cheapest extra there is.
function extra(c, g, x, z, { seated = false, col = 0x3a4a6a, ry = 0, legs = 0x1a1a22, pool, crowd = true } = {}) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, 0, z); o.rotation.y = ry; g.add(o);
  const h = seated ? 0.45 : 0, body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.72, 12), std(c, col, { roughness: 0.8 })); body.position.y = h + (seated ? 0.36 : 1.0); o.add(body);
  if (!seated) { const lg = c.slab(0.32, 0.64, 0.16, std(c, legs), 0, 0.32, 0); o.add(lg); }
  else { const lg = c.slab(0.34, 0.16, 0.5, std(c, legs), 0, h + 0.08, 0.2); o.add(lg); }
  HEAD.t ||= c.canvasTex(256, 256, (q, w) => eyeFlower(q, w / 2, w / 2, w / 2 * 0.98));
  const head = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshStandardMaterial({ map: HEAD.t, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, roughness: 0.6 }));
  head.position.y = h + (seated ? 0.98 : 1.62); o.add(head); o.userData.head = head;
  // the whole cast character from ON LOCATION, its own flower head and all (crowd.js); the primitives hide once it lands
  if (crowd) crowdBody(o, { seated, col, hide: [body, head, ...o.children.filter((q) => q !== body && q !== head && q.isMesh)], pool });
  return o;
}

// ---------- the shared furniture: a plate by the door, a rope, the house dressing ----------
function slate(c, r, g) {
  const board = decal(c, 1.1, 1.1, (q, w, h) => {
    q.fillStyle = '#1a1a1a'; q.beginPath(); q.arc(w / 2, h / 2, w / 2, 0, 7); q.fill();
    q.strokeStyle = '#c9a033'; q.lineWidth = w * 0.02; q.beginPath(); q.arc(w / 2, h / 2, w * 0.46, 0, 7); q.stroke();
    q.fillStyle = INK[r.i % INK.length]; q.beginPath(); q.arc(w / 2, h / 2, w * 0.3, 0, 7); q.fill();
    q.fillStyle = '#0d0d0d'; q.textAlign = 'center'; q.font = `900 ${w * 0.2}px ${c.SERIF}`; q.fillText(r.lvl, w / 2, h / 2 + w * 0.07);
    q.fillStyle = '#f4ead2'; q.font = `800 ${w * 0.038}px ${c.MONO}`; q.fillText('ONLY IN NEW YORK', w / 2, h * 0.12); q.fillText((r.name || '').toUpperCase().slice(0, 26), w / 2, h * 0.9);
  }, 512);
  board.position.set(W / 2 - PORTAL.w / 2 - 1.0, r.low ? 1.1 : 1.8, -D / 2 + 0.03);
  g.add(board);
}
// every room brings its own: a blue and white paper coffee cup on a pedestal (the city's real monument) and a hydrant
function dressing(c, r, g, X) {
  const { THREE } = c;
  const ped = c.slab(0.5, 0.9, 0.5, std(c, 0x1a1a1a, { roughness: 0.3 }), W - 1.5, 0.45, D / 2 - 1.4); g.add(ped); c.post(X(W - 1.5), D / 2 - 1.4, 0.45);
  const cupT = c.canvasTex(256, 128, (q, w, h) => { q.fillStyle = '#f4f6ff'; q.fillRect(0, 0, w, h); q.fillStyle = '#1d4ed8'; q.fillRect(0, 0, w, 14); q.fillRect(0, h - 14, w, 14); q.font = `900 20px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('WE ARE HAPPY TO COUNT YOU', w / 2, 60); eyeFlower(q, 34, 64, 16); eyeFlower(q, w - 34, 64, 16); q.fillStyle = '#c8a050'; q.font = `700 12px ${c.MONO}`; q.fillText('N3W YORKERS', w / 2, 86); });
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.085, 0.28, 24, 1, true), new THREE.MeshStandardMaterial({ map: cupT, roughness: 0.5, side: THREE.DoubleSide })); cup.position.set(W - 1.5, 1.04, D / 2 - 1.4); g.add(cup);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.03, 24), std(c, 0xffffff, { roughness: 0.3 })); lid.position.set(W - 1.5, 1.19, D / 2 - 1.4); g.add(lid);
  c.clickable(cup, () => c.egg('cup', 'The blue and white cup. Four hundred million a year, once. The city never built it a monument, so every room here has one.'), 'The coffee cup');
  const hyd = c.glb('hydrant', { h: 0.8, x: 1.6, z: D / 2 - 1.4, ry: 0.3, parent: g }); c.post(X(1.6), D / 2 - 1.4, 0.3);
  c.clickable(hyd, () => c.say(hyd, 'Do not park here. Do not sit here. Do not open me. Thank you for visiting.', 3000, 1.1), 'A hydrant');
  if (!r.outdoor) steam(c, g, 3.4, 0.2, D / 2 - 2.6, 0.5);
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
function steam(c, g, x, y, z, s = 1) {
  const { THREE } = c, m = new THREE.MeshBasicMaterial({ map: glowTex(c, 'rgba(230,230,230,.35)'), transparent: true, depthWrite: false, toneMapped: false }), puffs = [];
  for (let i = 0; i < 6; i++) { const sp = new THREE.Sprite(m.clone()); g.add(sp); puffs.push({ s: sp, k: i / 6 }); }
  c.tick((t) => puffs.forEach((p) => { const u = (t * 0.25 + p.k) % 1; p.s.position.set(x + Math.sin(u * 6 + p.k * 9) * 0.2 * s, y + u * 2.2 * s, z); p.s.scale.setScalar((0.4 + u * 1.4) * s); p.s.material.opacity = (1 - u) * 0.5; }));
}

// ---------- the CC0 prop library (Poly Haven, CC0) and the house models ----------
// [name, x, z, { h | len, ry, y, r: collider radius, egg: [hint, id, line], snd }]. Names are Poly Haven ids, files ph_<id>.glb.
function prop(c, r, g, X, name, x, z, o = {}) {
  const y = o.y === 'ceil' ? (r.ceilH || H_IN) - 0.12 : (o.y || 0);
  const m = c.glb(/^(nyb_|ph_|oy_|sw_)/.test(name) || o.raw ? name : 'ph_' + name, { h: o.h, len: o.len, x, y, z, ry: o.ry || 0, parent: g, shadow: !o.y });
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
// a framed notice, a label in the Abloh voice
function notice(c, g, text, x, y, z, ry, w = 1.8, h = 0.5, bg = '#f4ead2', fg = '#111') {
  const s = c.sign(text, { w, h, bg, fg, font: c.MONO, weight: 700, px: 160, pad: 0.1 }); s.position.set(x, y, z); s.rotation.y = ry; g.add(s); return s;
}
// a clickable object with an egg: the plainest way to put a fact on the floor
function eggBox(c, g, X, mesh, x, y, z, id, hint, line, rad = 0) { mesh.position.set(x, y, z); g.add(mesh); if (rad) c.post(X(x), z, rad); c.clickable(mesh, () => c.egg(id, line), hint); return mesh; }
// a live canvas board, redrawn on demand
function board(c, g, w, h, px = 512) {
  const { THREE } = c, t = c.canvasTex(Math.round(px * w / h), px, () => {}), q = t.userData.canvas.getContext('2d');
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); g.add(m);
  return { m, q, W: t.userData.canvas.width, H: t.userData.canvas.height, up: () => { t.needsUpdate = true; } };
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
// rats going about their business on slow loops
function scurry(c, g, n, { x1 = 3, x2 = 17, z1 = -4.5, z2 = 5.5, len = 0.45 } = {}) {
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
// people going somewhere: extras on slow figure of eight loops; the rigged ones walk at the loop's speed (crowd.js)
function walkers(c, g, n, { x1 = 2, x2 = 18, z1 = -5, z2 = 6, pool, cols = [0x3a3a4a, 0x5a2a2a, 0x2a4a3a, 0x4a4a2a, 0x2a3a5a] } = {}) {
  const ws = [];
  for (let k = 0; k < n; k++) { const e = extra(c, g, 0, 0, { col: cols[k % cols.length], pool }); ws.push({ e, k, s: 0.05 + (k % 3) * 0.012, ph: k * 2.39 }); }
  const cx = (x1 + x2) / 2, ax = (x2 - x1) / 2, cz = (z1 + z2) / 2, az = (z2 - z1) / 2;
  c.tick((t) => ws.forEach((o) => { const u = t * o.s + o.ph; o.e.position.set(cx + Math.sin(u) * ax, 0, cz + Math.sin(u * 2 + o.k) * az * 0.8); }));
  return ws.map((o) => o.e);
}
// the floor: what the city leaves on it, instanced, one draw per kind (gum, litter, leaves, puddles, confetti, snow, droppings)
const DECAL = {};
function decalTex(c, kind) {
  return (DECAL[kind] ||= c.canvasTex(128, 128, (q, w, h) => {
    const blob = (x, y, rx, ry, col) => { q.fillStyle = col; q.beginPath(); for (let i = 0; i <= 14; i++) { const a = i / 14 * PI * 2, k = 0.75 + Math.random() * 0.3; q.lineTo(x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k); } q.fill(); };
    if (kind === 'gum') { blob(64, 64, 40, 34, 'rgba(40,40,42,.85)'); blob(58, 58, 24, 20, 'rgba(70,70,72,.5)'); }
    else if (kind === 'litter') { q.fillStyle = '#f2efe6'; q.save(); q.translate(64, 64); q.rotate(0.3); q.fillRect(-26, -50, 52, 100); q.fillStyle = 'rgba(0,0,0,.35)'; for (let i = 0; i < 9; i++) q.fillRect(-20, -42 + i * 10, 20 + Math.random() * 18, 3); q.restore(); }
    else if (kind === 'leaf') { q.fillStyle = '#ffffff'; q.beginPath(); q.moveTo(64, 8); q.quadraticCurveTo(118, 64, 64, 120); q.quadraticCurveTo(10, 64, 64, 8); q.fill(); q.strokeStyle = 'rgba(0,0,0,.35)'; q.lineWidth = 3; q.beginPath(); q.moveTo(64, 12); q.lineTo(64, 118); q.stroke(); }
    else if (kind === 'puddle') { const gr = q.createRadialGradient(64, 64, 10, 64, 64, 62); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.75, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.beginPath(); q.ellipse(64, 64, 62, 44, 0, 0, 7); q.fill(); }
    else if (kind === 'confetti') { q.fillStyle = '#ffffff'; q.fillRect(44, 24, 40, 80); }
    else if (kind === 'snow') { const gr = q.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); }
    else if (kind === 'splat') { blob(64, 64, 22, 18, 'rgba(250,250,245,.95)'); blob(80, 70, 8, 7, 'rgba(250,250,245,.9)'); blob(50, 76, 6, 5, 'rgba(90,90,80,.7)'); }
  }));
}
const FLOORS = {
  subway: [['gum', 70, 0.09], ['litter', 6, 0.16], ['puddle', 3, 1.2]], car: [['gum', 18, 0.07], ['litter', 4, 0.14]], marble: [['gum', 6, 0.06]],
  street: [['gum', 60, 0.1], ['litter', 12, 0.18]], apartment: [], deli: [['gum', 14, 0.08], ['litter', 6, 0.14]], leaves: [['leaf', 160, 0.12], ['gum', 20, 0.09], ['litter', 6, 0.16]],
  park: [['leaf', 140, 0.13], ['litter', 4, 0.15]], pigeon: [['splat', 60, 0.12], ['gum', 20, 0.08], ['litter', 8, 0.16]],
  snow: [['confetti', 160, 0.05], ['litter', 18, 0.16], ['gum', 40, 0.09]], wet: [['puddle', 9, 1.6], ['gum', 50, 0.09], ['litter', 16, 0.17]],
  slush: [['snow', 8, 0.7], ['puddle', 5, 0.9], ['gum', 20, 0.08], ['litter', 6, 0.14]], boardwalk: [['confetti', 200, 0.05], ['litter', 10, 0.17]],
};
const DCOL = { gum: [0xffffff], litter: [0xffffff, 0xf4e8c8, 0xd8e8ff], leaf: [0xc8642a, 0xd89a2a, 0x8a4a1a, 0xb83a1a, 0xa8a03a], puddle: [0x3a4048], confetti: [0xc8102e, 0x1d4ed8, 0xf4f4f4, 0xf5c542, 0xff4fa3], snow: [0xf4f6fa], splat: [0xffffff] };
function floorDecals(c, r, g) {
  const { THREE } = c, list = FLOORS[r.floorKind] || [], m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e3 = new THREE.Euler(), col = new THREE.Color();
  list.forEach(([kind, n, size], li) => {
    const wet = kind === 'puddle', mat = new THREE.MeshStandardMaterial({ map: decalTex(c, kind), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 - li, roughness: wet ? 0.06 : 0.85, metalness: wet ? 0.35 : 0, opacity: wet ? 0.5 : 1 });
    const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat, n); im.renderOrder = 1;
    for (let i = 0; i < n; i++) { const x = 0.5 + Math.random() * (W - 1), z = -D / 2 + 1.5 + Math.random() * (D - 2), k = size * (0.6 + Math.random() * 0.8); e3.set(-PI / 2, 0, Math.random() * 6.28); q4.setFromEuler(e3); m4.compose(new THREE.Vector3(x, 0.006 + li * 0.001, z), q4, new THREE.Vector3(k * (kind === 'puddle' ? 1.6 : 1), k, 1)); im.setMatrixAt(i, m4); const cs = DCOL[kind]; im.setColorAt(i, col.set(cs[(Math.random() * cs.length) | 0])); }
    g.add(im);
  });
}

// a crowd of one model, cloned, standing where the room says, each turned a little differently
function clones(c, g, name, spots, h = 1.75, X) {
  return spots.map(([x, z, ry], k) => { const m = c.glb(name, { h, x, z, ry: ry ?? (k * 1.7) % 6.28 - 3.1, parent: g }); if (X) c.post(X(x), z, 0.35); return m; });
}
// a hand lettered cardboard sign on a stick
function cardboard(c, g, text, x, y, z, ry = 0, w = 0.7) { const s = c.sign(text, { w, h: w * 0.6, bg: '#c8a46a', fg: '#1a1a1a', font: c.SERIF, weight: 900, px: 128, pad: 0.12 }); s.position.set(x, y, z); s.rotation.y = ry; g.add(s); return s; }
// a fireworks burst: points flung out of one spot, falling, fading
function burst(c, g, x, y, z, col = 0xffd060, N = 80) {
  const { THREE } = c, pos = new Float32Array(N * 3), vel = [];
  for (let i = 0; i < N; i++) { pos.set([x, y, z], i * 3); const a = Math.random() * PI * 2, e = Math.random() * PI, s = 3 + Math.random() * 4; vel.push([Math.cos(a) * Math.sin(e) * s, Math.cos(e) * s + 2, Math.sin(a) * Math.sin(e) * s]); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: col, size: 0.12, transparent: true, opacity: 1, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending })); g.add(pts);
  let life = 2.2; c.tick((t, dt) => { if (life <= 0) return; life -= dt; for (let i = 0; i < N; i++) { vel[i][1] -= 4 * dt; pos[i * 3] += vel[i][0] * dt; pos[i * 3 + 1] += vel[i][1] * dt; pos[i * 3 + 2] += vel[i][2] * dt; } geo.attributes.position.needsUpdate = true; pts.material.opacity = Math.max(0, life / 2.2); if (life <= 0) pts.visible = false; });
}

// ---------- the props per room (Poly Haven CC0 and the house models) ----------
const PROPS = {
  swipe: [
    ['korean_public_payphone_01', 1.4, -3.2, { h: 1.6, ry: PI / 2, r: 0.5, egg: ['A payphone', 'payphone', 'It takes quarters. It has not rung since 2009. It is the last thing in this station that works the first time.'] }],
    ['metal_trash_can', 18.4, -4.0, { h: 1.0, r: 0.5 }], ['mounted_fluorescent_lights', 6, 0, { len: 1.6, y: 'ceil' }], ['mounted_fluorescent_lights', 14, 0, { len: 1.6, y: 'ceil' }],
  ],
  showtime: [['mounted_fluorescent_lights', 4, 0, { len: 1.6, y: 'ceil' }], ['mounted_fluorescent_lights', 16, 0, { len: 1.6, y: 'ceil' }]],
  nopants: [['metal_trash_can', 1.4, -4.6, { h: 1.0, r: 0.5 }], ['painted_wooden_bench', 18.2, -3.6, { len: 1.8, ry: PI / 2, r: 0.8 }], ['mounted_fluorescent_lights', 6, 0, { len: 1.6, y: 'ceil' }], ['mounted_fluorescent_lights', 14, 0, { len: 1.6, y: 'ceil' }]],
  frozen: [['Chandelier_03', 5, -1, { h: 1.3, y: 4.5 }], ['Chandelier_03', 15, -1, { h: 1.3, y: 4.5 }], ['vintage_suitcase', 16.8, 2.6, { len: 0.7, ry: 0.4 }]],
  rat: [['metal_trash_can', 18.2, -4.4, { h: 1.0, r: 0.5, egg: ['A trash can', 'trashcan', 'He did not take it from here. He took it from the stairs. A rat with a slice in a trash can is Tuesday. A rat with a slice on the stairs is history.'] }], ['mounted_fluorescent_lights', 6, 0, { len: 1.6, y: 'ceil' }], ['mounted_fluorescent_lights', 14, 0, { len: 1.6, y: 'ceil' }]],
  line: [['street_lamp_02', 2.0, -5.4, { h: 4.4, r: 0.3 }], ['street_lamp_02', 18.0, -5.4, { h: 4.4, r: 0.3 }], ['metal_trash_can', 17.6, -4.2, { h: 1.0, r: 0.5 }], ['fire_hydrant', 1.8, 0.4, { h: 0.8, r: 0.3 }], ['outdoor_table_chair_set_01', 15.0, 3.4, { len: 1.6, r: 0.8 }], ['outdoor_table_chair_set_01', 12.2, 4.6, { len: 1.6, ry: 0.6, r: 0.8 }], ['planter_box_01', 17.8, 0.6, { len: 1.4, ry: PI / 2, r: 0.5 }]],
  rent: [['electric_stove', 9.6, -6.6, { h: 0.9, r: 0.6 }], ['vintage_microwave', 9.6, -6.6, { len: 0.5, y: 0.92 }], ['steel_frame_shelves_01', 8.0, -6.6, { h: 1.9, r: 0.5 }], ['sofa_02', 12.6, -2.4, { len: 1.9, ry: -PI / 2, r: 0.8 }], ['side_table_01', 12.6, -0.9, { h: 0.55, r: 0.3 }], ['desk_lamp_arm_01', 12.6, -0.9, { h: 0.45, y: 0.55 }], ['potted_plant_01', 7.2, 0.6, { h: 0.9, r: 0.3 }], ['Television_01', 7.6, -0.2, { len: 0.6, ry: PI / 2 }], ['WoodenChair_01', 9.0, -4.6, { h: 0.9, ry: 0.4, r: 0.3 }]],
  soda: [['plastic_crate_01', 1.6, -4.6, { len: 0.6, r: 0.4 }], ['plastic_crate_02', 1.6, -4.6, { len: 0.6, y: 0.36 }], ['steel_frame_shelves_03', 18.6, -3.0, { h: 1.9, ry: -PI / 2, r: 0.5 }], ['bananas', 18.2, 1.0, { len: 0.5, y: 0.0, r: 0.3 }], ['mounted_fluorescent_lights', 6, 0, { len: 1.6, y: 'ceil' }], ['mounted_fluorescent_lights', 14, 0, { len: 1.6, y: 'ceil' }]],
  fearless: [['concrete_road_barrier', 2.2, -5.0, { len: 1.8, r: 0.6 }], ['metal_trash_can', 18.2, -4.0, { h: 1.0, r: 0.5 }], ['street_lamp_01', 1.6, 1.0, { h: 4.2, r: 0.3 }]],
  lookalike: [['street_lamp_01', 1.8, -5.2, { h: 4.2, r: 0.3 }], ['street_lamp_01', 18.2, -5.2, { h: 4.2, r: 0.3 }], ['painted_wooden_bench', 18.0, 0.6, { len: 1.8, ry: PI / 2, r: 0.8 }], ['metal_trash_can', 1.6, 0.6, { h: 1.0, r: 0.5 }]],
  duck: [['painted_wooden_bench', 2.2, 2.0, { len: 1.8, ry: PI / 2, r: 0.8 }], ['painted_wooden_bench', 17.8, 2.0, { len: 1.8, ry: -PI / 2, r: 0.8 }], ['street_lamp_01', 18.2, -1.6, { h: 4.2, r: 0.3 }], ['metal_trash_can', 1.6, -1.2, { h: 1.0, r: 0.5 }]],
  pigeon: [['painted_wooden_bench', 2.0, -1.0, { len: 1.8, ry: PI / 2, r: 0.8 }], ['shrub_01', 18.2, -4.6, { h: 1.2, r: 0.6 }], ['shrub_02', 1.6, -5.0, { h: 1.0, r: 0.5 }], ['shrub_01', 18.4, 1.2, { h: 1.1, r: 0.6 }]],
  santas: [['fire_hydrant', 2.2, -4.6, { h: 0.8, r: 0.3 }], ['street_lamp_02', 18.0, -5.4, { h: 4.4, r: 0.3 }], ['metal_trash_can', 17.6, -1.0, { h: 1.0, r: 0.5 }]],
  times: [['CoffeeCart_01', 17.0, -4.4, { len: 2.2, ry: -0.3, r: 1.1, egg: ['A hot dog cart', 'cart', 'A hot dog is three dollars until a tourist asks, and then it is whatever the cart feels like. The cart has feelings. The cart has a lawyer.'] }], ['concrete_road_barrier', 2.4, -5.2, { len: 1.8, r: 0.6 }]],
  czar: [['street_lamp_01', 1.8, -5.2, { h: 4.2, r: 0.3 }], ['street_lamp_01', 18.2, -5.2, { h: 4.2, r: 0.3 }], ['concrete_road_barrier', 18.0, 1.0, { len: 1.8, ry: PI / 2, r: 0.6 }]],
  historic: [['plastic_bottle_gallon', 18.4, 1.0, { h: 0.5, r: 0.3 }], ['plastic_crate_01', 1.6, -4.6, { len: 0.6, r: 0.4 }], ['mounted_fluorescent_lights', 6, 0, { len: 1.6, y: 'ceil' }], ['mounted_fluorescent_lights', 14, 0, { len: 1.6, y: 'ceil' }]],
  coney: [['lifebuoy', 1.0, -2.0, { len: 0.7, y: 1.6, ry: PI / 2 }], ['ocean_buoy', 18.4, 1.4, { h: 1.4, r: 0.5 }], ['metal_trash_can', 1.8, 1.6, { h: 1.0, r: 0.5 }]],
};
// the census New Yorkers hang where the room leaves room for them
function slotsDefault() {
  const S = [], south = D / 2 - 0.14;
  for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 2.1, z: south, ry: PI, w: 1.5 });
  [-6.6, -4.2, -1.8].forEach((z) => S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 }));
  [-4.2, -1.8].forEach((z) => S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 }));
  return S;
}
// bodega stock: boxes and cans with house labels, a few designs each
const STOCK = {};
function stockMat(c, kind, v) {
  const k = kind + v; if (STOCK[k]) return STOCK[k];
  const cols = { cereal: ['#e8b62c', '#c8102e', '#1d4ed8'], bread: ['#f4ead2', '#d8c8a0', '#e8d8b8'], can: ['#c8102e', '#0f7a3a', '#f5c542'] }[kind];
  const t = c.canvasTex(128, 192, (q, w, h) => { q.fillStyle = cols[v]; q.fillRect(0, 0, w, h); q.fillStyle = 'rgba(255,255,255,.85)'; q.fillRect(8, h * 0.3, w - 16, h * 0.32); q.fillStyle = '#111'; q.font = `900 ${kind === 'can' ? 22 : 26}px Arial`; q.textAlign = 'center'; q.fillText(kind === 'bread' ? 'N3W BREAD' : kind === 'can' ? 'N3W SOUP' : 'COUNTED', w / 2, h * 0.5); q.font = '700 13px Arial'; q.fillText(kind === 'cereal' ? 'FROSTED EYES' : 'SINCE 2026', w / 2, h * 0.58); eyeFlower(q, w / 2, h * 0.8, 18); });
  return (STOCK[k] = new c.THREE.MeshStandardMaterial({ map: t, roughness: kind === 'can' ? 0.3 : 0.75, metalness: kind === 'can' ? 0.5 : 0 }));
}
const SLOTS = {
  showtime: () => { const S = []; [2.2, 4.6, 6.9, 13.1, 15.4, 17.8].forEach((x) => S.push({ x, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.4 })); [-5.6, -3.0, -0.4].forEach((z) => { S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 }); S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 }); }); return S; },
  swipe: () => { const S = []; for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.5 }); S.push({ x: 0.14, y: 2.1, z: -1.8, ry: PI / 2, w: 1.4 }); [-6.6, -4.2, -1.8].forEach((z) => S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 })); return S; },
  // the lookalike keeps its east wall for the mirror; times square keeps the east for the big screen
  lookalike: () => { const S = []; for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.5 }); [-6.6, -4.2, -1.8, 0.6].forEach((z) => S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 })); return S; },
  times: () => { const S = []; for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.5 }); [-6.6, -4.2, -1.8, 0.6].forEach((z) => S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 })); return S; },
  rent: () => { const S = []; for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.3 }); [-6.4, -4.2, -2.0].forEach((z) => S.push({ x: 0.14, y: 2.0, z, ry: PI / 2, w: 1.2 })); [-6.4, -4.2].forEach((z) => S.push({ x: W - 0.14, y: 2.0, z, ry: -PI / 2, w: 1.2 })); return S; },
};

// ---------- the rooms ----------
const ROOM = {
  // PLEASE SWIPE AGAIN. The turnstile at the exit lets you through on the fourth swipe only.
  swipe(c, r, g, X) {
    const { THREE } = c;
    const steel = std(c, 0x858c90, { metalness: 0.85, roughness: 0.32 }), dark = std(c, 0x2a2a2e, { roughness: 0.5 });
    // a bank of turnstiles across the middle, for the look of it, with a gap where the floor is
    const bank = (x, z, arm) => { const o = new THREE.Group(); o.position.set(x, 0, z); g.add(o); o.add(c.glb('turnstile', { h: 1.05, x: 0, z: 0, ry: PI / 2, parent: o })); const rd = c.sign('PLEASE\nSWIPE\nAGAIN', { w: 0.3, h: 0.24, bg: '#1a0000', fg: '#ff3030', font: c.MONO, weight: 800, px: 96 }); rd.position.set(0, 1.25, 0.32); o.add(rd); c.post(X(x), z, 0.7); return o; };
    [4.2, 6.4, 8.6, 11.4, 13.6, 15.8].forEach((x) => bank(x, -2.6));
    walkers(c, g, 8, { x1: 2.4, x2: 17.6, z1: 0.6, z2: 6.4, pool: ['wiseguy', 'workgirl', 'editor', 'oscar', 'annieh', 'writer', 'cabbie'] });
    // the booth: scratched glass, a clerk, a microphone
    g.add(c.slab(2.4, 2.4, 1.6, dark, 1.6, 1.2, -5.0)); const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.2), new THREE.MeshPhysicalMaterial({ color: 0xcfe0e8, transparent: true, opacity: 0.35, roughness: 0.3 })); glass.position.set(1.6, 1.6, -4.19); g.add(glass); c.wall(X(0.4), -4.2, X(2.8), -4.2); c.wall(X(2.8), -5.8, X(2.8), -4.2);
    const clerk = extra(c, g, 1.6, -5.0, { col: 0x1d3a6a, ry: 0 }); const mic = c.slab(0.05, 0.3, 0.05, steel, 1.6, 1.75, -4.3); g.add(mic);
    c.clickable(mic, () => { c.say(clerk, 'I can hear you. I could hear you before you leaned in.', 3200, 2.0); c.egg('booth', 'A tiny speaker between you and someone who has already heard this today. Be nice. The booth has heard please swipe again more times than the machine has said it.'); }, 'The booth microphone');
    // the fare card the size of a door
    const card = c.canvasTex(512, 320, (q, w, h) => { q.fillStyle = '#f5c518'; q.fillRect(0, 0, w, h); q.fillStyle = '#1a1a1a'; q.font = `900 46px ${c.MONO}`; q.fillText('N3W FARE CARD', 30, 80); q.font = `700 22px ${c.MONO}`; q.fillText('INSERT THIS WAY · THIS SIDE FACING YOU', 30, 130); q.fillText('1994 TO 2025 · BALANCE: $2.75, THEN $2.90', 30, 170); q.fillRect(0, 240, w, 30); });
    const fc = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.0, 0.05), [0, 0, 0, 0, new THREE.MeshStandardMaterial({ map: card, roughness: 0.4 }), 0].map((m) => m || std(c, 0xf5c518))); fc.position.set(17.4, 1.0, -5.0); fc.rotation.x = -0.14; g.add(fc); c.wall(X(15.8), -5.0, X(19.0), -5.0);
    c.clickable(fc, () => c.egg('farecard', 'Introduced in 1994, sales ended in 2025. A whole era of being told to do the thing you just did. The thumb mark on the stripe is from everyone.'), 'A fare card the size of a door');
    // the gate: THE MARKS turnstile in the doorway to the next room, and it does not like you
    const gate = c.glb('turnstile', { h: 1.0, x: W - 0.9, z: (DZ1 + DZ2) / 2, ry: 0, parent: g });
    const block = c.wall(X(W - 1.3), DZ1, X(W - 1.3), DZ2);
    const reader = board(c, g, 0.9, 0.3, 128); reader.m.position.set(W - 0.9, 1.5, DZ1 - 0.1); reader.m.rotation.y = -PI / 2;
    let swipes = 0, open = false;
    const draw = (txt, col) => { const { q, W: w, H: h } = reader; q.fillStyle = '#100000'; q.fillRect(0, 0, w, h); q.fillStyle = col; q.font = `800 ${h * 0.42}px ${c.MONO}`; q.textAlign = 'center'; q.fillText(txt, w / 2, h * 0.65); reader.up(); };
    draw('SWIPE CARD', '#ffa030');
    const swipe = () => {
      if (open) return; swipes++; c.sound.turnstile && c.sound.turnstile();
      if (swipes < 4) { draw(['PLEASE SWIPE AGAIN', 'PLEASE SWIPE AGAIN AT THIS TURNSTILE', 'SWIPE AGAIN. SLOWER. NO, FASTER.'][swipes - 1], '#ff3030'); c.sound.beep && c.sound.beep(); c.toast(['Please swipe again.', 'Please swipe again at this turnstile.', 'Please swipe again. The machine has one note and a permanent position.'][swipes - 1], 2600); return; }
      open = true; block.off = true; draw('GO', '#40ff80'); c.sound.ding(); c.toast('Go. No apology. It never apologises.', 2800);
      c.egg('fourth', 'Fourth swipe. The stripe was fine. The reader was fine. You were fine. It just needed to say it three times, and now it is yours, and you will never know why.');
    };
    c.clickable(gate, swipe, 'Swipe'); c.clickable(reader.m, swipe, 'Swipe');
    notice(c, g, 'EXIT · SWIPE TO LEAVE · THE MACHINE DECIDES', W - 0.5, 2.6, (DZ1 + DZ2) / 2, -PI / 2, 2.4, 0.3, '#1a1a1a', '#f5c542');
    // commuters stuck at the bank, swiping forever
    [[5.3, -1.6], [9.5, -1.6], [12.5, -1.6], [16.9, -1.6]].forEach(([x, z], k) => { const e = extra(c, g, x, z, { col: [0x3a3a4a, 0x5a2a2a, 0x2a4a3a, 0x4a4a2a][k], ry: PI }); c.post(X(x), z, 0.3); let n = 0; c.clickable(e, () => { n++; c.say(e, ['It says swipe again.', 'I did swipe again.', 'I have been here since 1994.', 'Go ahead. Try. Try.'][n % 4], 2800, 2.0); }, 'A commuter'); c.tick((t) => { e.position.z = z + Math.sin(t * 2.2 + k) * 0.08; }); });
  },

  // SHOWTIME. Clap on the beat with the dancers. Eight in a row and the whole car joins.
  showtime(c, r, g, X, mats) {
    const { THREE } = c;
    const orange = std(c, 0xe0702a, { roughness: 0.55 }), yellow = std(c, 0xe8b830, { roughness: 0.55 }), chrome = std(c, 0xc8ccd0, { metalness: 0.9, roughness: 0.25 });
    // the car: 3.6 m wide down the middle of the room, 2.5 m to its ceiling, open at the far end onto the plate (the rest of the
    // train), doors where the room's doors are; a station platform either side carries the paintings
    const CX1 = 8.2, CX2 = 11.8, CH = 2.5, ZF = -7.6, ZB = 7.8, DA = 2.2, DB = 5.4;
    const shell = c.canvasTex(512, 256, (q, w, h) => { const gr = q.createLinearGradient(0, 0, w, 0); for (let k = 0; k <= 16; k++) gr.addColorStop(k / 16, k % 2 ? '#b8bcc0' : '#d4d8dc'); q.fillStyle = gr; q.fillRect(0, 0, w, h); q.fillStyle = '#16181c'; for (let x = 20; x < w; x += 128) q.fillRect(x, h * 0.22, 96, h * 0.34); q.fillStyle = '#8a1a2a'; q.fillRect(0, h * 0.64, w, 8); q.fillStyle = '#1a1a1a'; q.font = '800 22px Arial'; q.fillText('N3W', 30, h * 0.85); });
    shell.wrapS = THREE.RepeatWrapping; const shellM = new THREE.MeshStandardMaterial({ map: shell, metalness: 0.7, roughness: 0.3 }); shellM.userData.repX = 4; shellM.userData.repY = CH + 0.3;
    const inner = new THREE.MeshStandardMaterial({ map: mats.wall.map, roughness: 0.6 }); inner.userData.repX = 6; inner.userData.repY = CH;
    for (const [x, sgn] of [[CX1, -1], [CX2, 1]]) {
      for (const [a, b] of [[ZF, DA], [DB, ZB]]) {
        g.add(c.slab(0.12, CH + 0.3, b - a, shellM, x + sgn * 0.06, (CH + 0.3) / 2, (a + b) / 2));
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(b - a, CH), inner); pl.position.set(x - sgn * 0.005, CH / 2, (a + b) / 2); pl.rotation.y = sgn > 0 ? -PI / 2 : PI / 2; const uv = pl.geometry.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setX(k, uv.getX(k) * (b - a) / 6); g.add(pl);
        c.wall(X(x), a, X(x), b);
        // the benches along the wall, orange and yellow, and the rail above them
        for (let z = a + 0.4; z < b - 0.9; z += 1.9) { const L = Math.min(1.8, b - 0.4 - z); g.add(c.slab(0.55, 0.08, L, (Math.round(z) % 2) ? orange : yellow, x - sgn * 0.33, 0.46, z + L / 2)); g.add(c.slab(0.08, 0.45, L, (Math.round(z) % 2) ? orange : yellow, x - sgn * 0.08, 0.72, z + L / 2)); g.add(c.slab(0.5, 0.42, L, chrome, x - sgn * 0.33, 0.21, z + L / 2)); }
        c.wall(X(x - sgn * 0.62), a, X(x - sgn * 0.62), b);
        const rl = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, b - a, 8), chrome); rl.rotation.x = PI / 2; rl.position.set(x - sgn * 0.5, 2.0, (a + b) / 2); g.add(rl);
      }
      // the door frames, black rubber, and the door leaves slid open
      for (const z of [DA, DB]) g.add(c.slab(0.2, CH, 0.12, std(c, 0x1a1a1a, { roughness: 0.6 }), x, CH / 2, z));
      g.add(c.slab(0.05, 2.0, 1.5, std(c, 0xb8bcc0, { metalness: 0.8, roughness: 0.3 }), x + sgn * 0.14, 1.0, DA - 0.8));
      // the platform edge outside: a yellow strip and the gap
      g.add(c.slab(0.6, 0.012, ZB - ZF, std(c, 0xe8c030, { roughness: 0.7 }), x + sgn * 0.55, 0.006, (ZF + ZB) / 2));
    }
    const cfloor = c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = '#5a5e66'; q.fillRect(0, 0, w, h); for (let k = 0; k < 2400; k++) { q.fillStyle = ['#7a7e86', '#3a3e46', '#8a7a6a', '#6a6e78'][k % 4]; q.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }); cfloor.wrapS = cfloor.wrapT = THREE.RepeatWrapping;
    const cfM = new THREE.MeshStandardMaterial({ map: cfloor, roughness: 0.6 }); cfM.userData.rep = 1.2; g.add(c.slab(CX2 - CX1, 0.02, ZB - ZF, cfM, 10, 0.01, (ZF + ZB) / 2));
    const ct = c.tex.load('assets/ceil/car.jpg'); ct.colorSpace = THREE.SRGBColorSpace; ct.wrapS = ct.wrapT = THREE.RepeatWrapping;
    const ccM = new THREE.MeshStandardMaterial({ map: ct, emissive: 0xffffff, emissiveMap: ct, emissiveIntensity: 0.55, roughness: 0.6 }); ccM.userData.rep = 3.6; g.add(c.slab(CX2 - CX1 + 0.24, 0.06, ZB - ZF, ccM, 10, CH + 0.03, (ZF + ZB) / 2));
    g.add(c.slab(CX2 - CX1 + 0.24, 0.3, ZB - ZF, shellM, 10, CH + 0.21, (ZF + ZB) / 2));
    // close the far wall either side of the car, so the plate shows only through the car's end, like the next car down
    for (const [a, b] of [[2, CX1], [CX2, 18]]) g.add(c.slab(b - a, 4.6, 0.24, mats.wall, (a + b) / 2, 2.3, -D / 2 + 0.3));
    // the riders: two on the benches, the rest standing at the poles, and one asleep under a coat
    const riders = []; [[CX1 + 0.4, -2.4, 0x3a3a4a, 1, PI / 2], [CX2 - 0.4, 6.8, 0x3a5a3a, 1, -PI / 2], [9.2, -3.0, 0x6a3a2a], [10.8, 1.4, 0x2a4a5a], [9.3, 6.6, 0x4a2a4a], [10.7, -6.2, 0x5a5a2a], [9.0, 0.8, 0x2a2a5a]].forEach(([x, z, col, sat, ry]) => { const e = extra(c, g, x, z, { seated: !!sat, col, ry: ry ?? (x < 10 ? PI / 2 : -PI / 2), pool: sat ? ['folksinger'] : 'walkers' }); riders.push(e); if (!sat) c.post(X(x), z, 0.3); });
    const sleeper = riders[1];
    const poles = [-5.2, -1.2, 3.8, 6.6].map((z) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, CH, 12), chrome); p.position.set(10, CH / 2, z); g.add(p); c.post(X(10), z, 0.12); return p; });
    // the captain mid car, and a dancer who spins round the far pole horizontally
    const cap = cast(c, r, g, X, 'oy_captain', 10, 0.0, { h: 1.78, ry: 0, r: 0.4, line: 'Showtime. What time is it? It is showtime. Clear the pole, clear your knees.', egg: 'captain', hint: 'The captain' });
    const spinner = c.glb('oy_captain', { h: 1.7, x: 10, y: 1.3, z: -5.2, parent: g, shadow: false });
    c.tick((t) => { spinner.rotation.y = t * 2.4; spinner.rotation.z = PI / 2; spinner.position.set(10 + Math.cos(t * 2.4) * 0.45, 1.3 + Math.sin(t * 4.8) * 0.08, -5.2 + Math.sin(t * 2.4) * 0.45); });
    c.clickable(spinner, () => c.say(spinner, 'This is the part where you give us money. Or room. Room is also money.', 3000, 1.2), 'The spinner');
    // the ads, on the car's own card racks above the windows, both sides
    const ad = (x, z, ry, txt, bg, fg, id, line, rainbow) => { const s2 = c.sign(txt, { w: 1.5, h: 0.42, bg, fg, font: c.SERIF, weight: 900, px: 160, pad: 0.1 }); s2.position.set(x, 2.25, z); s2.rotation.y = ry; g.add(s2); if (rainbow) { const rb = decal(c, 0.5, 0.3, (q, w, h) => { ['#ff3030', '#ff9030', '#ffe030', '#30c050', '#3060ff', '#9030c0'].forEach((cc, k) => { q.strokeStyle = cc; q.lineWidth = 9; q.beginPath(); q.arc(w / 2, h, h * 0.9 - k * 9, PI, 0); q.stroke(); }); }); rb.position.set(x + (ry > 0 ? 0.01 : -0.01), 2.25, z - 0.45 * Math.sign(ry)); rb.rotation.y = ry; g.add(rb); } c.clickable(s2, () => c.egg(id, line), txt.split('\n')[0]); };
    ad(CX1 + 0.04, -3.6, PI / 2, 'THANK YOU\nDR. MLOW', '#f4ead2', '#1d4ed8', 'rainbow', 'Every colour of the rainbow, one dermatologist. For thirty years the train was a waiting room that occasionally went somewhere.', true);
    ad(CX2 - 0.04, -1.0, -PI / 2, 'COUNTED AND COUNTED\nHURT? CALL NOW', '#1a1a1a', '#f5c542', 'jingle', 'You forgot why you walked into the kitchen. You remember the entire injury jingle. Both numbers rhyme. That is the whole legal strategy.');
    ad(CX1 + 0.04, 0.6, PI / 2, 'LEARN TO BARTEND\nIN TWO WEEKS', '#c8102e', '#f4ead2', 'bartend', 'Learn a new career during the commute to the one you have. Efficient, if a little pointed.');
    ad(CX2 - 0.04, -5.6, -PI / 2, 'POETRY IN MOTION\nCOUNT YOURSELF', '#f4ead2', '#111', 'poetry', 'The car card with the poem on it. Nobody reads it. Everybody has read it.');
    // the trick: clap on the beat; the score hangs from the car ceiling
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.56, 48), basic(c, 0xff4fa3, { transparent: true, opacity: 0.5, depthWrite: false })); ring.rotation.x = -PI / 2; ring.position.set(10, 0.03, 0.0); g.add(ring);
    const sb = board(c, g, 1.6, 0.32, 256); sb.m.position.set(10, 2.3, -2.4);
    let streak = 0, best = 0, joined = 0;
    const drawSB = () => { const { q, W: w, H: h } = sb; q.fillStyle = '#0a0a0a'; q.fillRect(0, 0, w, h); q.fillStyle = streak >= 8 ? '#5aff8a' : '#ff8a1a'; q.font = `800 ${h * 0.5}px ${c.MONO}`; q.textAlign = 'center'; q.fillText(streak >= 8 ? 'SHOWTIME' : `CLAPS ON THE BEAT ${streak} / 8`, w / 2, h * 0.68); sb.up(); };
    drawSB();
    c.clickable(cap, () => {
      const off = Math.abs(c.music.offBeat()); c.sound.slap ? c.sound.slap() : c.sound.click();
      if (off < 0.16) { streak++; if (streak > best) best = streak; if (streak === 8) { joined = 10; c.sound.applause && c.sound.applause(); c.flash(0.2); c.egg('showtime', 'Eight claps on the beat and the whole car joined in, including the one asleep under a coat, without changing posture. That is the most a New York subway car has ever agreed on.'); } else c.toast(`On the beat. ${streak} in a row.`, 1200); }
      else { if (streak > 0) c.toast(off < 0 ? 'Early. Watch the ring.' : 'Late. Watch the ring.', 1400); streak = 0; }
      drawSB();
    }, 'Clap with the captain, on the beat');
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) return;
      const b = c.music.beat || 0.6, off = c.music.offBeat(), u = 1 - Math.min(1, Math.abs(off) / (b / 2)); ring.scale.setScalar(1 + u * 0.5); ring.material.opacity = 0.15 + u * 0.55;
      if (joined > 0) { joined -= dt; riders.forEach((e, k) => { e.position.y = Math.abs(Math.sin(t * 6 + k)) * 0.12; e.userData.head.rotation.z = Math.sin(t * 6 + k) * 0.2; }); if (joined <= 0) { streak = 0; drawSB(); riders.forEach((e) => { e.position.y = 0; e.userData.head.rotation.z = 0; }); } }
    });
    prop(c, r, g, X, 'boombox', 9.0, -6.4, { len: 0.6, y: 0.0, r: 0.3, egg: ['The box', 'boombox', 'It is turned up. It was always turned up. There is no down.'] });
    // the platform either side: benches and a trash can, the way a platform has them
    prop(c, r, g, X, 'painted_wooden_bench', 4.0, -4.6, { len: 1.8, ry: PI / 2, r: 0.8 }); prop(c, r, g, X, 'metal_trash_can', 16.0, -4.0, { h: 1.0, r: 0.5 });
  },


  // NO PANTS. Twenty three riders forgot their trousers together. Find the one who did not.
  nopants(c, r, g, X) {
    const { THREE } = c;
    const spots = []; for (let i = 0; i < 24; i++) { const col = i % 6, row = Math.floor(i / 6); spots.push([2.6 + col * 2.9 + ((row % 2) ? 1.2 : 0) + Math.sin(i * 3.1) * 0.4, -5.2 + row * 2.6 + Math.cos(i * 2.3) * 0.5, (i * 2.1) % 6.28 - 3.14]); }
    const ONE = 14;   // the one with pants, half behind a shopping bag
    const lines = ['Pants? It is January. Of course I have no pants.', 'It started in 2002. The pants had no idea they were optional.', 'Above the waist, a perfectly ordinary commute.', 'I am going to work. I am dressed for work. From the waist up.', 'Nobody is talking about it. That is the rule. You just broke it.', 'The train is late. My legs are cold. Both are normal.'];
    const riders = spots.map(([x, z, ry], k) => { const m = c.glb(k === ONE ? 'oy_pantsful' : 'oy_pantsless', { h: 1.76, x, z, ry, parent: g }); c.post(X(x), z, 0.34); return m; });
    let wrong = 0, found = false;
    riders.forEach((m, k) => c.clickable(m, () => {
      if (k === ONE) { if (found) return; found = true; c.sound.applause && c.sound.applause(); c.flash(0.2); c.say(m, 'Everybody else missed an email.', 3200, 2.0); c.egg('pants', `Found him after ${wrong} wrong guess${wrong === 1 ? '' : 'es'}. One rider kept his pants. In this car, that is a statement, and the statement is: I did not read the group chat.`); }
      else { wrong++; c.say(m, lines[(k + wrong) % lines.length], 2800, 2.0); }
    }, k === ONE ? 'A commuter' : 'A commuter'));
    prop(c, r, g, X, 'cardboard_box_01', spots[ONE][0] + 0.5, spots[ONE][2] + 0.5, { len: 0.9, ry: 0.3, egg: ['A shopping bag', 'bag', 'A shopping bag held low. Behind it, aggressively ordinary trousers. The bag is doing a lot of work.'] });
    // the hooks: trousers checked at the door
    const hooks = new THREE.Group(); hooks.position.set(0.3, 2.4, 0.2); hooks.rotation.y = PI / 2; g.add(hooks);
    for (let i = 0; i < 6; i++) { const p = c.slab(0.3, 0.9, 0.08, std(c, [0x3a3a44, 0x6a5a40, 0x2a3a5a, 0x4a4a4a][i % 4], { roughness: 0.9 }), -1.4 + i * 0.56, -0.5, 0); hooks.add(p); hooks.add(new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), std(c, 0xc8a050, { metalness: 1, roughness: 0.3 })).translateX(-1.4 + i * 0.56)); }
    c.clickable(hooks, () => c.egg('trousers', 'Checked at the door, tagged, waiting. Since 2002 the ride has ended with a pair of pants looking for its legs on a platform. Most of them find each other.'), 'The checked trousers');
    notice(c, g, 'CHECK YOUR PANTS HERE · NO EXCEPTIONS · NO SHORTS', 0.3, 3.2, 0.2, PI / 2, 2.6, 0.3, '#1a1a1a', '#f4ead2');
    const scarf = c.slab(0.5, 0.06, 0.12, std(c, 0xc8102e, { roughness: 0.9 }), 9.2, 0.03, 6.2); g.add(scarf);
    c.clickable(scarf, () => c.egg('scarf', 'The dress code was winter from the waist up. Nobody said this was a sensible protest against weather. It is not a protest. It is a Sunday.'), 'A dropped scarf');
    // the platform edge: a yellow line and a train that passes in the plate's direction
    g.add(c.slab(W - 1, 0.01, 0.5, std(c, 0xe8c030, { roughness: 0.8 }), W / 2, 0.006, -6.4));
  },

  // FROZEN. Everyone is frozen mid stride. Stand still and the city moves.
  frozen(c, r, g, X) {
    const { THREE } = c;
    // the clock on the booth, four faces of brass opal
    const booth = new THREE.Group(); booth.position.set(10, 0, -2.0); g.add(booth);
    const brassM = std(c, 0xc8a050, { metalness: 1, roughness: 0.28 }), marbleM = c.surf('marble', 1.2, 0xe8dcc4), glassM = new THREE.MeshPhysicalMaterial({ color: 0xdfeff0, transparent: true, opacity: 0.25, roughness: 0.05 });
    booth.add(new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.5, 1.05, 48), marbleM).translateY(0.52));
    booth.add(new THREE.Mesh(new THREE.TorusGeometry(1.46, 0.04, 8, 64), brassM).rotateX(PI / 2).translateZ(-1.06));
    booth.add(new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.42, 1.2, 48, 1, true), glassM).translateY(1.65));
    for (let k = 0; k < 12; k++) { const a = k / 12 * PI * 2; booth.add(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.25, 8), brassM).translateX(Math.cos(a) * 1.43).translateZ(Math.sin(a) * 1.43).translateY(1.65)); }
    booth.add(new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.45, 0.12, 48), brassM).translateY(2.3));
    booth.add(new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.16, 0], [0.12, 0.25], [0.1, 0.55], [0.18, 0.7], [0, 0.72]].map(([a, b]) => new THREE.Vector2(a, b)), 24), brassM).translateY(2.36));
    booth.add(new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 24), brassM).translateY(3.4));
    booth.add(new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.36, 16), brassM).translateY(3.95));
    c.post(X(10), -2.0, 1.6);
    const faceT = c.canvasTex(128, 128, (q, w, h) => { q.fillStyle = '#f4ead2'; q.beginPath(); q.arc(w / 2, h / 2, w / 2, 0, 7); q.fill(); q.strokeStyle = '#1a1a1a'; q.lineWidth = 6; q.beginPath(); q.moveTo(w / 2, h / 2); q.lineTo(w / 2 + 30, h / 2 - 30); q.moveTo(w / 2, h / 2); q.lineTo(w / 2 + 2, h / 2 - 48); q.stroke(); });
    for (let k = 0; k < 4; k++) { const f = new THREE.Mesh(new THREE.CircleGeometry(0.3, 32), new THREE.MeshStandardMaterial({ map: faceT, emissive: 0xffe0a0, emissiveMap: faceT, emissiveIntensity: 0.6 })); f.position.set(Math.sin(k * PI / 2) * 0.43, 3.4, Math.cos(k * PI / 2) * 0.43); f.rotation.y = k * PI / 2; booth.add(f); }
    c.clickable(booth, () => c.egg('clock', 'Two hundred and seven people froze for five minutes in January 2008. The clock declined to participate. It is always 4:20 on this one anyway.'), 'The clock');
    // the frozen: thirty commuters mid stride, each with somewhere to be
    const spots = []; for (let i = 0; i < 30; i++) spots.push([1.8 + (i % 10) * 1.85 + Math.sin(i * 1.3) * 0.5, -5.4 + Math.floor(i / 10) * 3.4 + Math.cos(i * 2.1) * 0.9, (i * 2.4) % 6.28 - 3.14]);
    const frozenOnes = spots.filter(([x, z]) => Math.hypot(x - 10, z + 2) > 2.4).map(([x, z, ry], k) => { const m = c.glb(k % 4 === 3 ? 'oy_pantsful' : 'oy_frozen', { h: 1.78, x, z, ry, parent: g }); const post = c.post(X(x), z, 0.32); return { m, post, x, z, ry, s: 0.5 + (k % 3) * 0.25 }; });
    // the coffee, mid pour, that only lands when you hold still
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.12, 12), std(c, 0xf4f6ff, { roughness: 0.5 })); cup.position.set(7.2, 1.3, 2.2); cup.rotation.z = 0.9; g.add(cup);
    const pour = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.5, 8), std(c, 0x5a3a1a, { roughness: 0.2 })); pour.position.set(7.0, 1.05, 2.2); g.add(pour);
    const puddle = decal(c, 0.5, 0.5, (q, w, h) => { q.fillStyle = 'rgba(70,40,15,.8)'; q.beginPath(); q.ellipse(w / 2, h / 2, w * 0.45, h * 0.3, 0.3, 0, 7); q.fill(); }); puddle.rotation.x = -PI / 2; puddle.position.set(6.95, 0.012, 2.2); puddle.visible = false; g.add(puddle);
    c.clickable(cup, () => c.egg('coffee', 'Usually the person stops and the coffee keeps going. A rare improvement in station design: the coffee stopped too. Hold still and it lands.'), 'A coffee, mid pour');
    // dust in the sunbeams
    const N = 160, pos = new Float32Array(N * 3); for (let i = 0; i < N; i++) { pos[i * 3] = 2 + Math.random() * 16; pos[i * 3 + 1] = Math.random() * H_IN; pos[i * 3 + 2] = -7 + Math.random() * 10; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xfff4dd, size: 0.025, transparent: true, opacity: 0.7, depthWrite: false, toneMapped: false })));
    for (const x of [4, 10, 16]) { const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.4, 9, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff0d0, transparent: true, opacity: 0.012, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, blending: THREE.AdditiveBlending })); beam.position.set(x, 3, -4); beam.rotation.z = 0.2; beam.rotation.x = 0.18; g.add(beam); }
    const dep = board(c, g, 3.6, 1.4, 384); dep.m.position.set(10, 4.6, -7.1);
    const drawDep = (moving) => { const { q, W: w, H: h } = dep; q.fillStyle = '#1a1206'; q.fillRect(0, 0, w, h); q.fillStyle = '#f5d488'; q.font = `700 ${h * 0.11}px ${c.MONO}`; ['NEW HAVEN', 'POUGHKEEPSIE', 'STAMFORD', 'WASSAIC', 'YOU'].forEach((s, i) => { q.textAlign = 'left'; q.fillText(s, 30, h * (0.2 + i * 0.16)); q.textAlign = 'right'; q.fillStyle = moving ? '#5aff8a' : '#f5d488'; q.fillText(moving ? 'ON TIME' : 'FROZEN · 5 MIN', w - 30, h * (0.2 + i * 0.16)); q.fillStyle = '#f5d488'; }); dep.up(); };
    drawDep(false);
    c.clickable(dep.m, () => c.egg('board', 'The performance lasted five minutes. Anyone waiting for someone at Grand Central has rehearsed the longer version.'), 'The departure board');
    // the trick: a weight that eases toward 1 while you hold still, and the terminal moves exactly that much
    let still = 0, wgt = 0, got = false, was = false; const last = { x: 0, z: 0 };
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) { if (was) { was = false; frozenOnes.forEach((o) => { o.m.position.set(o.x, 0, o.z); o.post.x = X(o.x); o.post.z = o.z; }); pour.visible = true; puddle.visible = false; drawDep(false); } return; }
      was = true; const moved = Math.hypot(P.x - last.x, P.z - last.z) > 0.003; last.x = P.x; last.z = P.z; still = moved ? 0 : still + dt;
      const target = still > 1.2 ? 1 : 0; const w0 = wgt; wgt += (target - wgt) * Math.min(1, dt * 2);
      if ((wgt > 0.5) !== (w0 > 0.5)) drawDep(wgt > 0.5);
      frozenOnes.forEach((o) => { o.m.position.x += Math.sin(o.ry) * o.s * wgt * dt; o.m.position.z += Math.cos(o.ry) * o.s * wgt * dt; if (o.m.position.x < 1.2 || o.m.position.x > W - 1.2 || o.m.position.z < -6.6 || o.m.position.z > 6.6) { o.ry += PI; o.m.rotation.y = o.ry; } o.post.x = X(o.m.position.x); o.post.z = o.m.position.z; o.m.position.y = Math.abs(Math.sin(t * 7)) * 0.04 * wgt; });
      pour.scale.y = Math.max(0.01, 1 - wgt); pour.position.y = 1.05 - (1 - pour.scale.y) * 0.25; puddle.visible = wgt > 0.6;
      if (still > 4.5 && !got) { got = true; c.sound.applause && c.sound.applause(); c.egg('frozen', 'You stood still for five seconds and two hundred people started moving again. In 2008 it took five minutes and two hundred and seven volunteers. Stillness is the only thing this terminal has never done on its own.'); }
    });
  },

  // PIZZA RAT. He has dinner handled. Yield the stairway and he resumes; block it and he waits.
  rat(c, r, g, X) {
    const { THREE } = c;
    // the staircase, six steps up toward the mezzanine in the plate
    const conc = c.surf('concrete', 1, 0x9a9a96), green = std(c, 0x2a5a3a, { metalness: 0.5, roughness: 0.5 });
    const steps = 7, sx = 10, z0 = -1.6, rise = 0.24, run = 0.5;
    for (let k = 0; k < steps; k++) { g.add(c.slab(4.0, rise, run, conc, sx, rise * (k + 0.5), z0 - k * run)); g.add(c.slab(4.0, 0.01, 0.1, std(c, 0xe8c030), sx, rise * (k + 1) + 0.005, z0 - k * run + run / 2 - 0.05)); }
    g.add(c.slab(4.0, 0.2, 1.6, conc, sx, rise * steps - 0.1, z0 - steps * run - 0.8));
    for (const dx of [-2.1, 2.1]) { g.add(c.slab(0.08, 1.0, steps * run + 2.6, green, sx + dx, rise * steps / 2 + 0.6, z0 - (steps * run + 2.6) / 2 + 0.3)); }
    r.ground = (x, z) => { if (Math.abs(x - sx) > 2.0) return 0; if (z > z0 + run / 2) return 0; const k = Math.min(steps, Math.floor((z0 + run / 2 - z) / run) + 1); return Math.min(steps, k) * rise; };
    c.wall(X(sx - 2.1), z0 + 0.3, X(sx - 2.1), z0 - steps * run - 2.5); c.wall(X(sx + 2.1), z0 + 0.3, X(sx + 2.1), z0 - steps * run - 2.5);
    // the rat and the slice
    const rat = c.glb('ph_street_rat', { len: 0.42, x: sx, z: z0 + 0.2, ry: 0, parent: g });
    const slice = new THREE.Group(); slice.scale.setScalar(1.5); g.add(slice);
    const sh = new THREE.Shape(); sh.moveTo(-0.11, 0); sh.lineTo(0.11, 0); sh.lineTo(0, -0.3); sh.closePath();
    const top = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.015, bevelEnabled: false }), std(c, 0xf2c14e, { roughness: 0.6 })); top.rotation.x = -PI / 2; top.position.y = 0.02; slice.add(top);
    [[0, -0.1], [-0.04, -0.18], [0.04, -0.2]].forEach(([x, z]) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.006, 12), std(c, 0xa8281e)); p.position.set(x, 0.04, z); slice.add(p); });
    const ratSpot = new THREE.SpotLight(0xffd0a0, 14, 7, 0.32, 0.5, 1.2); ratSpot.position.set(sx + 1.2, 4.2, z0 + 2.0); g.add(ratSpot); g.add(ratSpot.target);
    let prog = 0, hauls = 0, waiting = false;
    c.clickable(slice, () => c.egg('slice', 'Do not help. He has it. A whole slice, downstairs, in September 2015, on camera. He did not finish. Nobody in this city finishes. The attempt is the meal.'), 'The slice');
    c.clickable(rat, () => c.say(rat, waiting ? 'Any time. I have all night. I do not have all night.' : 'Dinner is handled. Please clear the stairs.', 3000, 0.6), 'Pizza Rat');
    // commuters stopped on the stairs, filming
    [[sx - 1.5, z0 - 2.2, 0.4], [sx + 1.5, z0 - 1.2, -0.5], [sx + 3.2, z0 + 1.0, -0.9]].forEach(([x, z, ry], k) => { const e = extra(c, g, x, z, { col: [0x3a3a4a, 0x5a2a2a, 0x2a4a3a][k], ry }); e.position.y = r.ground(x, z); const ph = c.slab(0.08, 0.16, 0.01, std(c, 0x111111), 0.25, 1.4, 0.25); e.add(ph); c.post(X(x), z, 0.3); c.clickable(e, () => c.say(e, ['Do not help him. He is doing it.', 'I am late. I am not leaving.', 'He has more followers than my landlord.'][k], 2800, 2.0), 'A commuter filming'); });
    const plaque = notice(c, g, 'HE HAD DINNER HANDLED · FIRST AVENUE L · SEPTEMBER 2015', sx, 2.2, z0 - steps * run - 2.4, 0, 3.4, 0.36, '#c8a050', '#1a1a1a');
    c.clickable(plaque, () => c.egg('plaque', 'September 21, 2015. One rat, one slice, fourteen seconds of video, the whole internet. The shrine is downstairs at n3wyorkers.com/sewers. This is the staircase. The staircase is the point.'), 'The plaque');
    for (let i = 0; i < 7; i++) candle(c, g, sx - 1.5 + i * 0.5, 0, z0 + 1.1, 0.14);
    const sh2 = notice(c, g, 'THE SHRINE IS DOWNSTAIRS · n3wyorkers.com/sewers', 2.2, 1.0, -7.1, 0, 2.6, 0.26, '#1a1a1a', '#f5c542');
    c.clickable(sh2, () => c.egg('shrine', 'LIVE FROM THE SEWERS has him as a saint with a halo. Up here he is a rat with a job. Both are true.'), 'A sign');
    // the trick: he hauls only while the stairs are clear of you; block them and he waits; at the top, dinner
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) return;
      const L = local(r, P), near = Math.abs(L.x - sx) < 2.6 && L.z < z0 + 1.6 && L.z > z0 - steps * run - 3.0;
      waiting = near;
      if (!near) prog = Math.min(1, prog + dt * 0.06);
      const z = z0 + 0.2 - prog * (steps * run + 1.6), y = r.ground(sx, z);
      rat.position.set(sx + Math.sin(t * 9) * 0.02 * (near ? 0 : 1), y, z); rat.rotation.y = PI + (near ? 0 : Math.sin(t * 9) * 0.1);
      slice.visible = true; ratSpot.target.position.set(sx, y, z);
      slice.position.set(sx + 0.08, y + 0.002, z - 0.1); slice.rotation.y = 0.3 + Math.sin(t * 9) * 0.05;
      if (prog >= 1) { hauls++; prog = 0; c.sound.ding(); c.toast('He made it. Dinner handled. He is coming back down for seconds.', 3000); if (hauls === 1) c.egg('dinner', 'You yielded the stairway and the rat finished the climb he never finished in 2015. For once, progress in this city depended on your subway etiquette, and you had some.'); }
    });
  },

  // THE LINE. Every time you look away, somebody joins in front of you.
  line(c, r, g, X) {
    const { THREE } = c;
    // the bakery window and the line that snakes from it along the room
    const path = []; for (let k = 0; k < 40; k++) path.push([3.0 + (k % 2) * 0.5 + Math.min(k, 39) * 0.0, 0, 0]);
    const spots = []; for (let k = 0; k < 14; k++) { if (k === 10) continue; spots.push([4.0 + Math.sin(k * 1.7) * 0.25, -6.2 + k * 0.82]); }
    const cols = [0x3a3a4a, 0x6a3a2a, 0x2a4a5a, 0x4a2a4a, 0x3a5a3a, 0x5a5a2a, 0x2a2a5a, 0x6a4a3a];
    const liners = spots.map(([x, z], k) => { const e = extra(c, g, x, z, { col: cols[k % cols.length], ry: PI + Math.sin(k) * 0.25 }); c.post(X(x), z, 0.3); return e; });
    const stool = (x, z) => { g.add(c.slab(0.36, 0.04, 0.36, std(c, 0x8a1a1a), x, 0.42, z)); for (const [dx, dz] of [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]]) g.add(c.slab(0.03, 0.42, 0.03, std(c, 0x333333, { metalness: 0.7 }), x + dx, 0.21, z + dz)); };
    stool(12.0, -4.6); stool(7.4, -4.9);
    // your place in the line: a folding stool with your number on it
    stool(4.7, 2.0); const num = board(c, g, 0.7, 0.42, 128); num.m.position.set(4.7, 1.4, 2.0); num.m.rotation.y = PI / 2;
    let ahead = 11, got = false;
    const drawNum = () => { const { q, W: w, H: h } = num; q.fillStyle = '#f4ead2'; q.fillRect(0, 0, w, h); q.fillStyle = '#1a1a1a'; q.font = `900 ${h * 0.32}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('YOU ARE', w / 2, h * 0.36); q.fillText(`No. ${ahead}`, w / 2, h * 0.78); num.up(); };
    drawNum();
    c.clickable(num.m, () => c.egg('stool', 'Spring Street, 2013. Breakfast acquired infrastructure. Your stool, your number, your morning.'), 'Your place in the line');
    for (let k = 0; k < 9; k++) { const z = -6.0 + k * 1.4, brass = std(c, 0xd6a640, { metalness: 1, roughness: 0.25 }); const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.95, 10), brass); p2.position.set(5.5, 0.48, z); g.add(p2); if (k < 8) { const cv = new THREE.QuadraticBezierCurve3(new THREE.Vector3(5.5, 0.9, z), new THREE.Vector3(5.5, 0.65, z + 0.7), new THREE.Vector3(5.5, 0.9, z + 1.4)); g.add(new THREE.Mesh(new THREE.TubeGeometry(cv, 10, 0.02, 6), std(c, 0x8a1a1a))); } }
    c.wall(X(5.5), -6.0, X(5.5), 5.2);
    walkers(c, g, 5, { x1: 7.5, x2: 18, z1: -2, z2: 6.6, pool: 'walkers' });
    // the pastry under glass
    const ped = c.slab(0.6, 1.0, 0.6, std(c, 0x1a1a1a, { roughness: 0.3 }), 17.6, 0.5, -5.9); g.add(ped); c.post(X(17.6), -5.9, 0.5);
    const pastry = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.06, 16, 32), std(c, 0xd8a050, { roughness: 0.7 })); pastry.rotation.x = PI / 2; pastry.position.set(17.6, 1.1, -5.9); g.add(pastry);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 16, 0, PI * 2, 0, PI / 2), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, roughness: 0.05 })); dome.position.set(17.6, 1.02, -5.9); g.add(dome);
    c.tick((t) => { pastry.rotation.z = t * 0.5; });
    c.clickable(dome, () => c.egg('cronut', 'Half croissant, half doughnut, one per person, five dollars. Somehow the waiting time was not cut in half.'), 'The pastry');
    const batt = c.slab(0.16, 0.05, 0.3, std(c, 0x222222, { roughness: 0.4 }), 7.6, 0.03, -4.2); g.add(batt);
    c.clickable(batt, () => c.egg('battery', 'You came with a full battery and an appetite. Only one of those survived the line.'), 'A battery pack');
    notice(c, g, 'ONE PER PERSON · SOLD OUT BY 8 · THE LINE STARTS AT 5', 10, 2.6, -7.1, 0, 3.4, 0.34, '#f4ead2', '#111');
    // the trick: look away from the line and look back, and there is one more cluster in front of you
    let away = 0, seen = true, extraN = 0; const added = [];
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) return;
      const look = looking(c, r, 4.2, -3.0, 0.45);
      if (!look) away += dt; else { if (away > 0.8 && extraN < 40) { extraN++; ahead += [3, 7, 11, 19][extraN % 4]; const x = 4.6 + Math.sin(extraN * 2.3) * 0.25 + (extraN % 2) * 0.45, z = -6.0 + (extraN * 0.37 % 1) * 7.6; const e = extra(c, g, x, z, { col: cols[extraN % cols.length], ry: PI + Math.sin(extraN) * 0.4 }); added.push(e); c.sound.tick && c.sound.tick(); drawNum(); if (extraN % 4 === 1) c.toast(`${['A friend who just got here.', 'A whole family, with a stroller.', 'Somebody who was definitely not here before.', 'Three people holding a place for nine.'][extraN % 4]} You are No. ${ahead}.`, 2600); if (ahead >= 212 && !got) { got = true; c.egg('line', 'You were number eleven. You are number two hundred and twelve. You never left the line. The line left you. Spring Street, every morning in 2013.'); } } away = 0; }
    });
  },

  // THE RENT IS TOO DAMN HIGH. A meter that climbs while you stay, and walls that close in.
  rent(c, r, g, X, mats) {
    const { THREE } = c;
    const cream = mats.wall;
    // the inner walls that come for you
    const wl = c.slab(0.3, r.ceilH, 8.6, cream, 4.6, r.ceilH / 2, -2.8), wr = c.slab(0.3, r.ceilH, 8.6, cream, W - 4.6, r.ceilH / 2, -2.8); g.add(wl); g.add(wr);
    const cl = c.wall(X(4.75), -7.1, X(4.75), 1.5), cr = c.wall(X(W - 4.75), -7.1, X(W - 4.75), 1.5);
    const rug = decal(c, 3.0, 2.0, (q, w, h) => { q.fillStyle = '#7a2a22'; q.fillRect(0, 0, w, h); q.strokeStyle = '#d8b060'; q.lineWidth = 10; q.strokeRect(14, 14, w - 28, h - 28); q.strokeStyle = '#1d3a6a'; q.lineWidth = 6; q.strokeRect(34, 34, w - 68, h - 68); for (let i = 0; i < 400; i++) { q.fillStyle = 'rgba(0,0,0,.08)'; q.fillRect(Math.random() * w, Math.random() * h, 3, 3); } }); rug.rotation.x = -PI / 2; rug.position.set(10, 0.008, -3.6); g.add(rug);
    // the tub in the kitchen, the loft bed over the fridge
    const por = new THREE.MeshPhysicalMaterial({ color: 0xf4f2ee, roughness: 0.15, clearcoat: 1 });
    const tub = new THREE.Group(); tub.position.set(7.4, 0, -2.6); g.add(tub);
    const tb = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.9, 8, 20), por); tb.rotation.z = PI / 2; tb.scale.set(1, 1, 0.7); tb.position.y = 0.45; tub.add(tb);
    const wat = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.6), new THREE.MeshStandardMaterial({ color: 0x8fd4ff, roughness: 0.02, transparent: true, opacity: 0.7 })); wat.rotation.x = -PI / 2; wat.position.y = 0.62; tub.add(wat);
    for (const [dx, dz] of [[-0.6, -0.25], [0.6, -0.25], [-0.6, 0.25], [0.6, 0.25]]) tub.add(new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), std(c, 0xc8a050, { metalness: 1, roughness: 0.3 })).translateX(dx).translateZ(dz).translateY(0.08));
    c.post(X(7.4), -2.6, 0.9);
    c.clickable(tub, () => c.egg('tub', 'You can soak while the pasta soaks. We are not calling that a feature. The listing called it a feature.'), 'The bathtub in the kitchen');
    const fridge = c.slab(0.9, 1.8, 0.8, std(c, 0xd8d8d0, { metalness: 0.4, roughness: 0.3 }), 12.6, 0.9, -5.6); g.add(fridge); c.post(X(12.6), -5.6, 0.7);
    const rentNote = c.sign('RENT DUE\n$4,250\nTHANK YOU', { w: 0.5, h: 0.5, bg: '#f4ead2', fg: '#c8102e', font: c.MONO, weight: 800, px: 128 }); rentNote.position.set(12.6, 1.2, -5.19); g.add(rentNote);
    c.clickable(rentNote, () => c.egg('plan', 'Three hundred square feet. The floor plan includes all of them, even the ones under the tub. The rent includes none of them.'), 'The rent notice');
    g.add(c.slab(2.2, 0.1, 1.4, std(c, 0x8a6a4a), 12.0, 2.3, -5.6)); g.add(c.slab(2.0, 0.3, 1.2, std(c, 0xe8e0d0, { roughness: 0.95 }), 12.0, 2.5, -5.6)); g.add(c.slab(0.05, 2.3, 0.05, std(c, 0x5a4a3a), 11.0, 1.15, -4.95)); for (let y = 0.4; y < 2.3; y += 0.35) g.add(c.slab(0.4, 0.03, 0.03, std(c, 0x5a4a3a), 10.8, y, -4.95));
    // the lectern, from the debate
    const lect = new THREE.Group(); lect.position.set(10, 0, -1.6); g.add(lect); lect.add(c.slab(0.7, 1.2, 0.5, std(c, 0x5a3a1e, { roughness: 0.6 }), 0, 0.6, 0)); lect.add(c.slab(0.8, 0.06, 0.6, std(c, 0x5a3a1e), 0, 1.22, 0.05));
    const ls = c.sign('THE RENT\nIS TOO\nDAMN HIGH', { w: 0.7, h: 0.7, bg: '#1a1a1a', fg: '#f5c542', font: c.SERIF, weight: 900, px: 160 }); ls.position.set(0, 0.7, 0.26); lect.add(ls); c.post(X(10), -1.6, 0.6);
    c.clickable(lect, () => { c.sound.horn && c.sound.horn(); c.egg('lectern', 'October 2010, a gubernatorial debate, one candidate, one sentence, said like a verdict. It did not win the election. It won everything else.'); }, 'The lectern');
    // the meter on the wall
    const mt = board(c, g, 3.0, 1.2, 384); mt.m.position.set(10, 3.6, -7.1);
    let owed = 0, secs = 0, got = false, was = false;
    const drawM = () => { const { q, W: w, H: h } = mt; q.fillStyle = '#0a0a0a'; q.fillRect(0, 0, w, h); q.fillStyle = '#f5c542'; q.font = `700 ${h * 0.13}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('RENT ACCRUED WHILE YOU STOOD HERE', w / 2, h * 0.24); q.fillStyle = '#ff5a5a'; q.font = `900 ${h * 0.42}px ${c.MONO}`; q.fillText('$' + owed.toFixed(2), w / 2, h * 0.72); q.fillStyle = '#8d8676'; q.font = `600 ${h * 0.1}px ${c.MONO}`; q.fillText(`${secs.toFixed(0)} SECONDS · $4,250 A MONTH · 300 SQ FT`, w / 2, h * 0.92); mt.up(); };
    drawM(); let dt0 = 0;
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) { if (was) { was = false; owed = 0; secs = 0; wl.position.x = 4.6; wr.position.x = W - 4.6; cl.x1 = cl.x2 = X(4.75); cr.x1 = cr.x2 = X(W - 4.75); drawM(); } return; }
      was = true; secs += dt; owed += dt * (0.0016 + secs * 0.004); dt0 += dt; if (dt0 > 0.25) { dt0 = 0; drawM(); }
      const k = Math.min(1, secs / 45) * 1.8; wl.position.x = 4.6 + k; wr.position.x = W - 4.6 - k; cl.x1 = cl.x2 = X(4.75 + k); cr.x1 = cr.x2 = X(W - 4.75 - k);
      if (secs > 40 && !got) { got = true; c.sound.thud && c.sound.thud(); c.shake(0.05); c.egg('rent', 'Forty seconds, and the apartment is a hallway and the meter says you owe nine dollars. The tub stayed full size. The apartment protects its most confusing amenity.'); }
    });
    notice(c, g, 'STUDIO · 300 SQ FT · EAT IN BATHTUB · NO FEE · FEE', 10, 1.4, -7.1, 0, 3.0, 0.3, '#f4ead2', '#111');
  },

  // SIXTEEN OUNCES. Drink from the cup and you grow until the room is too small. The cup never changes.
  soda(c, r, g, X) {
    const { THREE } = c;
    g.add(c.slab(8, 1.0, 0.8, std(c, 0x3a3a3a, { roughness: 0.4 }), 10, 0.5, -1.7)); c.wall(X(6), -1.3, X(14), -1.3); c.wall(X(6), -2.1, X(14), -4.6);
    const cashier = extra(c, g, 10, -2.7, { col: 0x2a2a2a, pool: ['oscar'] });
    walkers(c, g, 3, { x1: 3, x2: 17, z1: 1.2, z2: 6.6, pool: 'walkers' }); c.clickable(cashier, () => c.say(cashier, 'Sixteen ounces. The city says. The city is not here. I am here. Large?', 3200, 2.0), 'The cashier');
    const cat = c.glb('cat', { len: 0.6, x: 12.6, y: 1.0, z: -1.7, ry: 0.6, parent: g, shadow: false }); c.clickable(cat, () => { c.sound.meow && c.sound.meow(); c.egg('cat', 'The bodega cat drank what it wanted in 2012 and it drinks what it wants now. The ban never mentioned cats. Nothing mentions cats. That is their whole deal.'); }, 'The bodega cat');
    // the cup: sixteen ounces, nominal
    const cupT = c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = '#c8102e'; q.fillRect(0, 0, w, h); q.fillStyle = '#f4ead2'; q.font = `900 40px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('N3W COLA', w / 2, 100); q.font = `700 22px ${c.MONO}`; q.fillText('16 OZ · NOMINAL', w / 2, 150); eyeFlower(q, w / 2, 200, 26); });
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.2, 0.7, 28, 1, true), new THREE.MeshStandardMaterial({ map: cupT, roughness: 0.5, side: THREE.DoubleSide })); cup.position.set(9.0, 1.36, -1.5); g.add(cup);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 28), std(c, 0xffffff, { roughness: 0.3 })); lid.position.set(9.0, 1.72, -1.5); g.add(lid);
    const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 8), std(c, 0xff4fa3)); straw.position.set(9.05, 1.95, -1.5); straw.rotation.z = 0.15; g.add(straw);
    notice(c, g, '16 OZ MAX · BY ORDER OF THE CITY · 2012 TO 2014 · STRUCK DOWN', 10, 2.4, -7.1, 0, 4.0, 0.36, '#f5c542', '#111');
    const SIZES = [1, 1.3, 1.7, 2.2, 2.8], LINES = ['Sixteen ounces. Technically a small. You feel fine.', 'Twenty ounces. The room got a little cosy.', 'Thirty two ounces. Mind the lights.', 'Forty eight ounces. The ceiling is a hat now.', 'Sixty four ounces. The city tried to stop this. A judge stopped the city.'];
    let sip = 0, got = false;
    c.clickable(cup, () => {
      if (sip >= 4) return; sip++; r.owns = true; c.P.scale = SIZES[sip]; c.P.speed = 1 + sip * 0.2; c.sound.pop && c.sound.pop(); c.flash(0.15); c.toast(LINES[sip], 3000);
      if (sip === 4 && !got) { got = true; c.egg('large', 'Proposed in 2012, blocked before it took effect, struck down in 2014. The city never made you drink the smaller one. The cup stayed sixteen ounces the whole time. You did not.'); }
    }, 'Drink');
    c.tick((t, dt, P, ri) => { if (r.owns && !here(r, ri)) { r.owns = false; sip = 0; P.scale = 1; P.speed = 1; } });
    // the measuring cup and the court folder
    const mc = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.12, 16, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, side: THREE.DoubleSide })); eggBox(c, g, X, mc, 11.4, 1.06, -1.5, 'measure', 'A measuring cup', 'The proposed limit was sixteen ounces for certain sugary drinks at certain businesses. Even the cup needed a footnote.');
    const folder = c.slab(0.32, 0.03, 0.24, std(c, 0xd8c8a0, { roughness: 0.9 }), 0, 0, 0); eggBox(c, g, X, folder, 7.6, 1.02, -1.5, 'court', 'A court folder', 'Board of Health, 2012. Appellate Division, 2013. Court of Appeals, 2014. The argument had a refill option.');
    // the wall of cups: a monument
    for (let i = 0; i < 24; i++) { const k = i % 6, row = Math.floor(i / 6); const cp = new THREE.Mesh(new THREE.CylinderGeometry(0.2 + row * 0.05, 0.15 + row * 0.04, 0.5 + row * 0.12, 20, 1, true), new THREE.MeshStandardMaterial({ color: [0xc8102e, 0x1d4ed8, 0xe8b62c, 0x0f7a3a][k % 4], roughness: 0.5, side: THREE.DoubleSide })); cp.position.set(16.4 + k * 0.5, 0.3 + row * 0.7 + row * 0.06, -7.3); g.add(cp); }
    c.wall(X(16.0), -6.8, X(19.2), -6.8);
  },

  // FEARLESS. The bull, the girl, and a bronze pug that moves when you are not looking.
  fearless(c, r, g, X) {
    const { THREE } = c;
    const plinth = (x, z, w, d, h = 0.4) => { g.add(c.slab(w, h, d, std(c, 0x6a6a68, { roughness: 0.7 }), x, h / 2, z)); };
    plinth(10, -3.2, 4.2, 2.0, 0.5); const bull = c.glb('nyb_wallst_bull', { len: 3.6, x: 10, y: 0.5, z: -3.2, ry: PI / 2, parent: g }); c.post(X(10), -3.2, 2.0);
    c.clickable(bull, () => c.egg('bull', 'The bull arrived in December 1989 under a Christmas tree, without permission, in the middle of the night. A very New York beginning for an established institution.'), 'The bull');
    plinth(10.4, 1.1, 1.2, 1.2, 0.3); const girl = c.glb('oy_girl', { h: 1.4, x: 10.4, y: 0.3, z: 1.1, ry: PI, parent: g }); c.post(X(10.4), 1.1, 0.7);
    c.clickable(girl, () => c.egg('girl', 'She arrived facing the bull in March 2017, for one night that became a year that became permanent. A small statue can take up a remarkable amount of discussion.'), 'The girl');
    // the pug: bronze, a leg up, and a stain that stays where it is while he does not
    const pug = c.glb('oy_pug', { len: 0.7, x: 11.6, y: 0.0, z: 2.2, ry: -0.6, parent: g });
    const stain = decal(c, 0.5, 0.4, (q, w, h) => { q.fillStyle = 'rgba(40,60,30,.55)'; q.beginPath(); q.ellipse(w / 2, h / 2, w * 0.45, h * 0.35, 0.2, 0, 7); q.fill(); }); stain.rotation.x = -PI / 2; stain.position.set(10.8, 0.31, 1.3); g.add(stain);
    c.clickable(pug, () => c.egg('pug', 'May 2017: another sculptor added a pug lifting its leg at the girl, for three hours, before it was removed. Public comment had entered its bronze period. This one never left. It just waits for you to look away.'), 'The pug');
    let marked = false, came = 0;
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) return;
      const L = local(r, P), dx = L.x - pug.position.x, dz = L.z - pug.position.z, d = Math.hypot(dx, dz);
      const seen = looking(c, r, pug.position.x, pug.position.z, 0.55);
      if (!seen && d > 1.1) { pug.position.x += dx / d * dt * 1.4; pug.position.z += dz / d * dt * 1.4; pug.rotation.y = Math.atan2(dx, dz); came += dt; }
      if (!seen && d <= 1.1 && !marked) { marked = true; const pd = decal(c, 0.6, 0.5, (q, w, h) => { q.fillStyle = 'rgba(60,80,30,.5)'; q.beginPath(); q.ellipse(w / 2, h / 2, w * 0.45, h * 0.35, 0.4, 0, 7); q.fill(); }); pd.rotation.x = -PI / 2; pd.position.set(L.x, 0.012, L.z); g.add(pd); c.sound.squeak && c.sound.squeak(); c.toast('Something happened to your shoe.', 2600); c.egg('marked', 'The pug got to you while you were looking at the bull, which is what the pug was for. In 2017 it lasted three hours. Here it lasted until you turned round.'); }
      if (seen && marked && d > 3) marked = false;
    });
    // tourists at the barriers, photographing the argument
    [[3.6, 1.2], [5.0, 2.6], [15.6, 2.8], [16.8, 0.8], [14.0, 4.6]].forEach(([x, z], k) => { const e = c.glb('oy_tourist', { h: 1.76 + (k % 3) * 0.04, x, z, ry: Math.atan2(10 - x, -3.2 - z), parent: g }); c.post(X(x), z, 0.3); c.clickable(e, () => c.say(e, 'Can you get the bull, the girl and the dog in one? No. Nobody can.', 3000, 2.0), 'A tourist'); });
    walkers(c, g, 5, { x1: 2.4, x2: 17.6, z1: 4.4, z2: 7.0, pool: 'walkers' });
    const bar = c.slab(3.0, 0.9, 0.06, std(c, 0x1f3a6a, { roughness: 0.6 }), 6.4, 0.45, -1.4); g.add(bar); c.wall(X(4.9), -1.4, X(7.9), -1.4);
    c.clickable(bar, () => c.egg('barrier', 'Police barriers, always. The bull has had a barrier since the first week, which tells you how it went.'), 'A barrier');
    // autumn leaves, instanced, drifting
    const N = 120, leaf = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.12, 0.12), std(c, 0xc86a20, { side: THREE.DoubleSide, roughness: 0.9 }), N), m4 = new THREE.Matrix4(); for (let i = 0; i < N; i++) { m4.makeRotationX(-PI / 2); m4.setPosition(1 + Math.random() * 18, 0.01, -7 + Math.random() * 14); leaf.setMatrixAt(i, m4); } g.add(leaf);
  },

  // THE LOOKALIKE. Everyone is the same. The mirror shows someone who is not you, and wins.
  lookalike(c, r, g, X) {
    const { THREE } = c;
    // the contestants, all of them the same model, holding numbers
    const spots = []; for (let i = 0; i < 16; i++) spots.push([2.4 + (i % 8) * 2.2 + Math.sin(i * 1.9) * 0.4, -5.6 + Math.floor(i / 8) * 2.2 + Math.cos(i * 1.3) * 0.5, 0.4 - Math.sin(i) * 0.5]);
    const cs = clones(c, g, 'bluesteel', spots, 1.78, X);
    cs.forEach((m, k) => { const n = cardboard(c, g, String([7, 12, 28, 50, 3, 9, 41, 66, 2, 19, 23, 31, 8, 44, 17, 5][k]), spots[k][0], 1.1, spots[k][2] + 0.35, 0, 0.46); c.clickable(m, () => c.say(m, ['I am him.', 'I am also him.', 'We are all him. He is not here.', 'The judges are seeing something. We are not sure what.', 'Fifty dollars. Split sixteen ways.'][k % 5], 2800, 2.0), 'A contestant'); });
    // the judging table, the trophy, the ribbon
    g.add(c.slab(2.0, 0.06, 0.8, std(c, 0xf4ead2, { roughness: 0.8 }), 10, 0.76, -2.4)); for (const dx of [-0.9, 0.9]) g.add(c.slab(0.05, 0.74, 0.05, std(c, 0x444444, { metalness: 0.6 }), 10 + dx, 0.37, -2.4)); c.wall(X(9), -2.0, X(11), -2.0); c.wall(X(9), -2.8, X(11), -2.8);
    const trophy = new THREE.Group(); trophy.position.set(9.5, 0.79, -2.4); g.add(trophy); trophy.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.06, 16), std(c, 0x2a2a2a)).translateY(0.03)); trophy.add(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.04, 0.16, 16), std(c, 0xe0b850, { metalness: 1, roughness: 0.25 })).translateY(0.16));
    c.clickable(trophy, () => c.egg('trophy', 'A folding table is all it takes to turn an opinion into an institution. The prize was fifty dollars. The winner was not him.'), 'The trophy');
    const cash = c.slab(0.16, 0.005, 0.07, std(c, 0x6a9a5a, { roughness: 0.9 }), 10.5, 0.795, -2.3); g.add(cash);
    c.clickable(cash, () => c.egg('fifty', 'Fifty dollars, October 2024, Washington Square Park, several thousand people and a brass band. A resemblance became an appointment.'), 'Fifty dollars');
    const judge = extra(c, g, 10, -3.2, { col: 0x5a3a2a, ry: 0 }); c.clickable(judge, () => c.say(judge, 'You look exactly like someone who almost won.', 3000, 2.0), 'The judge');
    walkers(c, g, 6, { x1: 2.5, x2: 15, z1: 1.4, z2: 6.6, pool: ['actress', 'gown', 'loretta', 'wiseguy', 'editor', 'discoking'] });
    // the mirror on the east wall: you, then not you
    const mir = new Reflector(new THREE.PlaneGeometry(3.2, 2.6), { clipBias: 0.003, textureWidth: 1024, textureHeight: 1024, color: 0x9a9a9a }); mir.position.set(W - 0.4, 1.7, -4.6); mir.rotation.y = -PI / 2; g.add(mir); mir.getReflectionCamera(c.camera).layers.enable(1);   // the reflection sees layer 1: the avatar, and the impostor
    g.add(c.slab(0.1, 2.9, 3.5, std(c, 0xc8a050, { metalness: 1, roughness: 0.3 }), W - 0.46, 1.7, -4.6));
    notice(c, g, 'THE MIRROR · ENTRANTS CHECK THEIR RESEMBLANCE HERE', W - 0.4, 3.4, -4.6, -PI / 2, 2.8, 0.3, '#1a1a1a', '#f5c542');
    // the impostor: a lookalike on layer 1 who takes your place in the mirror after four seconds, with a ribbon
    const imp = c.glb('bluesteel', { h: 1.78, x: 0, z: 0, parent: c.scene }); imp.traverse((o) => o.layers.set(1)); imp.visible = false;
    const ribbon = c.sign('WINNER', { w: 0.5, h: 0.14, bg: '#1d4ed8', fg: '#fff', font: c.MONO, weight: 800, px: 64 }); ribbon.position.set(0.3, 1.3, 0.2); ribbon.layers.set(1); imp.add(ribbon);
    let facing = 0, swapped = false, got = false;
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) { imp.visible = false; c.avatar.visible = true; facing = 0; swapped = false; return; }
      const L = local(r, P), near = L.x > 15 && Math.abs(L.z + 4.6) < 3.0, look = looking(c, r, W - 0.4, -4.6, 0.7);
      if (near && look) facing += dt; else { facing = 0; if (swapped) { swapped = false; imp.visible = false; c.avatar.visible = true; } }
      if (facing > 4 && !swapped) { swapped = true; c.avatar.visible = false; imp.visible = true; c.sound.ding(); c.toast('That is not you. He won.', 2800); if (!got) { got = true; c.egg('mirror', 'Four seconds in the mirror and the reflection changed its jacket, took a ribbon you did not get, and kept posing on its own. Everyone here has the same eye flower head. The judges are seeing something.'); } }
      if (swapped) { imp.position.set(P.x, P.y - c.EYE * P.scale, P.z); imp.rotation.y = P.yaw + Math.sin(t * 1.5) * 0.5; imp.position.y += Math.abs(Math.sin(t * 3)) * 0.05; }
    });
    // the band, and the arch in the plate is enough arch
    [[3.0, 3.6], [4.4, 4.2], [5.8, 3.6]].forEach(([x, z], k) => { const e = extra(c, g, x, z, { col: 0x1a1a2a, ry: -0.6 }); c.post(X(x), z, 0.3); const horn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 14, 1, true), std(c, 0xe0b850, { metalness: 1, roughness: 0.3, side: THREE.DoubleSide })); horn.rotation.x = PI / 2; horn.position.set(0.2, 1.2, 0.3); e.add(horn); c.clickable(e, () => { c.sound.horn && c.sound.horn(); c.egg('band', 'A brass band showed up to a lookalike contest in a park. Nobody hired them. That is how brass bands work here.'); }, 'The band'); });
  },

  // HOT DUCK. The duck swims to wherever you look. The press corps turns to follow.
  duck(c, r, g, X) {
    const { THREE } = c;
    // the pond: a reflecting plane sunk a hair below the lawn, with a stone edge
    const pond = new Reflector(new THREE.PlaneGeometry(14, 6), { clipBias: 0.003, textureWidth: 1024, textureHeight: 1024, color: 0x6a8a7a }); pond.rotation.x = -PI / 2; pond.position.set(10, 0.03, -3.6); g.add(pond);
    const edge = c.surf('ashlar', 1, 0x9a968c); g.add(c.slab(14.6, 0.24, 0.4, edge, 10, 0.06, -0.45)); for (const x of [2.85, 17.15]) g.add(c.slab(0.3, 0.2, 6.4, edge, x, 0.0, -3.6));
    c.wall(X(3), -0.6, X(17), -0.6); c.wall(X(3), -0.6, X(3), -6.6); c.wall(X(17), -0.6, X(17), -6.6);
    const duck = c.glb('oy_duck', { len: 0.6, x: 10, y: 0.03, z: -1.6, ry: 0, parent: g, shadow: false });
    c.clickable(duck, () => c.egg('duck', 'The Mandarin duck appeared in the Pond in October 2018 and the Pond immediately developed a press section. He left in the spring. Nobody established where he came from. New York accepted an interesting arrival without checking the lease.'), 'The Hot Duck');
    // the wake: rings that spawn behind him
    const rings = []; const rg = new THREE.RingGeometry(0.05, 0.07, 24), rm = new THREE.MeshBasicMaterial({ color: 0xdfefff, transparent: true, opacity: 0.6, toneMapped: false, depthWrite: false });
    for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(rg, rm.clone()); m.rotation.x = -PI / 2; m.visible = false; g.add(m); rings.push({ m, t: 0 }); }
    // the press corps along the shore, lenses up
    const press = [[3.4, 0.4], [4.9, 0.9], [6.2, 0.3], [13.6, 0.4], [15.0, 0.9], [16.6, 0.3], [2.6, 2.4], [17.4, 2.2]].map(([x, z], k) => { const m = c.glb('oy_photog', { h: 1.74 + (k % 3) * 0.04, x, z, ry: 0, parent: g }); c.post(X(x), z, 0.34); c.clickable(m, () => c.say(m, ['He is looking at me.', 'Did you get the colours? I got the colours.', 'Six hundred millimetres. For a duck.', 'He is just a duck. He is not just a duck.'][k % 4], 2800, 2.0), 'A photographer'); return m; });
    const sign = cardboard(c, g, 'HOT\nDUCK', 8.2, 1.9, 1.2, 0, 0.6); c.clickable(sign, () => c.egg('sign', 'Hot Duck, on cardboard, in October. The duck did not hire a publicist. The city volunteered.'), 'The sign');
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.6, 16), std(c, 0x222222, { roughness: 0.4 })); lens.rotation.x = PI / 2; eggBox(c, g, X, lens, 2.2, 0.3, 3.2, 'lens', 'A long lens', 'Nobody in this city owned a six hundred millimetre lens until the duck. Then everybody did. The duck did not pose. The duck did not have to.');
    // the owl on the lamppost: the one everybody looked up to
    const owl = decal(c, 0.5, 0.8, (q, w, h) => { q.fillStyle = '#1a1410'; q.beginPath(); q.ellipse(w / 2, h * 0.6, w * 0.3, h * 0.36, 0, 0, 7); q.fill(); q.beginPath(); q.ellipse(w / 2, h * 0.22, w * 0.22, h * 0.16, 0, 0, 7); q.fill(); q.fillStyle = '#ffb020'; q.beginPath(); q.arc(w * 0.42, h * 0.2, w * 0.05, 0, 7); q.arc(w * 0.58, h * 0.2, w * 0.05, 0, 7); q.fill(); }); owl.position.set(18.2, 4.0, -1.6); g.add(owl);
    c.clickable(owl, () => c.egg('owl', 'An eagle owl got out of the zoo in February 2023 and lived free in the park for a year, on water towers, on fire escapes, on every front page. For a while, the neighbourhood had someone everyone looked up to.'), 'An owl');
    c.tick((t) => { owl.rotation.y = Math.atan2(c.P.x - X(18.2), c.P.z + 1.6); });
    // the trick: the duck swims to where you look on the water; the press turns, a little late
    const ray = new THREE.Raycaster(), v = new THREE.Vector3(), tgt = { x: 10, z: -3.6 }, plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.03); let travel = 0, got = false, rk = 0, lastRing = 0;
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) return;
      c.camera.getWorldDirection(v); ray.set(c.camera.position, v);
      const hit = ray.ray.intersectPlane(plane, new THREE.Vector3());
      if (hit) { const lx = hit.x - r.x0; if (lx > 3.3 && lx < 16.7 && hit.z > -6.4 && hit.z < -0.8) { tgt.x = lx; tgt.z = hit.z; } }
      const dx = tgt.x - duck.position.x, dz = tgt.z - duck.position.z, d = Math.hypot(dx, dz);
      if (d > 0.1) { const s = Math.min(d, dt * 1.6); duck.position.x += dx / d * s; duck.position.z += dz / d * s; duck.rotation.y += (Math.atan2(dx, dz) - duck.rotation.y) * Math.min(1, dt * 4); travel += s; if (t - lastRing > 0.3) { lastRing = t; const rr = rings[rk++ % rings.length]; rr.m.visible = true; rr.m.position.set(duck.position.x, 0.04, duck.position.z); rr.t = t; } }
      duck.position.y = 0.03 + Math.sin(t * 2.2) * 0.012;
      rings.forEach((rr) => { if (!rr.m.visible) return; const u = (t - rr.t) / 2.5; if (u > 1) { rr.m.visible = false; return; } rr.m.scale.setScalar(1 + u * 12); rr.m.material.opacity = 0.6 * (1 - u); });
      press.forEach((m, k) => { const a = Math.atan2(duck.position.x - m.position.x, duck.position.z - m.position.z); m.rotation.y += (a - m.rotation.y) * Math.min(1, dt * (1.2 + k * 0.15)); });
      if (travel > 30 && !got) { got = true; c.egg('steer', 'The duck went wherever you looked, thirty metres of it, and eight photographers turned with him in a slightly delayed wave. In 2018 that was every afternoon until April.'); }
    });
  },

  // THE PIGEON. Sixteen feet of pigeon, and four hundred small ones that scatter from your feet.
  pigeon(c, r, g, X) {
    const { THREE } = c;
    // the monument
    g.add(c.slab(3.2, 1.2, 2.0, c.surf('concrete', 1.4, 0xb8b4ac), 10, 0.6, -4.4)); g.add(c.slab(3.4, 0.08, 2.2, std(c, 0x5a5a58, { metalness: 0.6, roughness: 0.4 }), 10, 1.22, -4.4)); notice(c, g, 'DINOSAUR · 2024 · ALUMINIUM, SIXTEEN FEET · DO NOT FEED', 10, 0.6, -3.38, 0, 2.6, 0.24, '#2a2a28', '#e8e4d8'); c.post(X(10), -4.4, 2.0);
    const big = c.glb('pigeon', { h: 4.9, x: 10, y: 1.2, z: -4.4, ry: 0, parent: g });
    c.clickable(big, () => c.egg('monument', 'Sixteen feet tall, on the High Line above Tenth Avenue since October 2024, cast from a real one. At last, a pigeon that can look down on the buildings. It still takes the train.'), 'The pigeon');
    const tape = c.slab(0.3, 0.1, 0.3, std(c, 0xe8c030), 0, 0, 0); eggBox(c, g, X, tape, 8.2, 1.25, -3.6, 'tape', 'A measuring tape', 'Sixteen feet, nine hundred pounds of aluminium, six months of installation. Same bird, different scale. Suddenly everybody respects its personal space.');
    // the subway seat with a pigeon on it, riding
    g.add(c.slab(1.9, 0.08, 0.6, std(c, 0xe0702a), 16.6, 0.46, 2.0)); g.add(c.slab(1.9, 0.5, 0.08, std(c, 0xe0702a), 16.6, 0.75, 2.3)); g.add(c.slab(1.9, 0.4, 0.6, std(c, 0xc8ccd0, { metalness: 0.9, roughness: 0.3 }), 16.6, 0.22, 2.0)); c.post(X(16.6), 2.0, 1.0);
    const rider = c.glb('pigeon', { h: 0.3, x: 16.3, y: 0.5, z: 2.0, ry: -0.6, parent: g, shadow: false });
    c.clickable(rider, () => { c.sound.coo && c.sound.coo(); c.egg('subway', 'Pigeons have been filmed riding the subway between stations. They do not appear to find this worth explaining. They get off at the right stop.'); }, 'A pigeon on the train');
    notice(c, g, 'SEAT RESERVED · PIGEON · 14 ST TO 23 ST', 16.6, 1.4, 2.34, 0, 1.8, 0.22, '#1a1a1a', '#f4ead2');
    // the pigeon lady, feeding them, as she has since the sequel
    const lady = cast(c, r, g, X, 'pigeonlady', 3.6, -2.0, { h: 1.7, ry: 0.8, r: 0.4, line: 'They remember who fed them. They also remember who did not. Mostly the second.', egg: 'lady', hint: 'The pigeon lady' });
    // four hundred pigeons: a body, a head, a tail, instanced, at home on the planks until you come close
    const N = c.MOBILE ? 200 : 400, geo = new THREE.BufferGeometry();
    { const b = new THREE.SphereGeometry(0.09, 8, 6).scale(1, 0.8, 1.4), h = new THREE.SphereGeometry(0.045, 6, 5).translate(0, 0.08, 0.12), tl = new THREE.BoxGeometry(0.06, 0.01, 0.1).translate(0, 0.01, -0.16); const merge = (gs) => { const pos = [], nor = []; for (const q of gs) { pos.push(...q.attributes.position.array); nor.push(...q.attributes.normal.array); } const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return out; }; const gi = [b.toNonIndexed(), h.toNonIndexed(), tl.toNonIndexed()]; const m = merge(gi); geo.copy(m); }
    const flock = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 }), N); g.add(flock);
    const P0 = [], m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e3 = new THREE.Euler(), col = new THREE.Color();
    for (let i = 0; i < N; i++) { const x = 1 + Math.random() * 18, z = -7 + Math.random() * 14; P0.push({ x, z, hx: x, hz: z, y: 0, vy: 0, ry: Math.random() * 6.28, fl: 0 }); flock.setColorAt(i, Math.random() < 0.12 ? col.setHSL(0.07, 0.3, 0.22 + Math.random() * 0.12) : Math.random() < 0.08 ? col.setHSL(0, 0, 0.6) : col.setHSL(0.62, 0.09, 0.2 + Math.random() * 0.12)); }
    const near = []; for (let k = 0; k < 18; k++) { const x = 3 + (k * 4.7) % 14, z = 0.5 + (k * 2.3) % 6; near.push({ m: c.glb('pigeon', { h: 0.3, x, z, ry: k * 1.3, parent: g, shadow: false }), x, z, hx: x, hz: z, fl: 0, y: 0, vy: 0, ry: k * 1.3, ph: k }); }
    walkers(c, g, 5, { x1: 2.5, x2: 17.5, z1: -1.5, z2: 6.5, pool: 'walkers' });
    let scattered = 0, got = false;
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) return;
      const L = local(r, P), spd = Math.hypot(P.x - (big.userData.px ?? P.x), P.z - (big.userData.pz ?? P.z)) / Math.max(dt, 1e-3); big.userData.px = P.x; big.userData.pz = P.z;
      for (let i = 0; i < N; i++) {
        const b = P0[i], dx = b.x - L.x, dz = b.z - L.z, d = Math.hypot(dx, dz);
        if (d < 2.2 + spd * 0.3 && b.fl <= 0) { b.fl = 1.2 + Math.random(); b.vy = 2.5 + Math.random() * 2; scattered++; if (scattered === 1 || scattered % 80 === 0) c.sound.coo && c.sound.coo(); }
        if (b.fl > 0) { b.fl -= dt; b.x += dx / (d || 1) * dt * 3; b.z += dz / (d || 1) * dt * 3; b.vy -= 6 * dt; b.y = Math.max(0, b.y + b.vy * dt); b.ry = Math.atan2(dx, dz); }
        else { b.y = Math.max(0, b.y - dt * 2); b.x += (b.hx - b.x) * dt * 0.3; b.z += (b.hz - b.z) * dt * 0.3; if (Math.random() < 0.01) b.ry += (Math.random() - 0.5); b.x += Math.sin(b.ry) * dt * 0.08; b.z += Math.cos(b.ry) * dt * 0.08; }
        b.x = Math.max(0.5, Math.min(W - 0.5, b.x)); b.z = Math.max(-7.5, Math.min(7.5, b.z));
        e3.set(b.fl > 0 ? -0.4 : 0, b.ry, 0); q4.setFromEuler(e3); m4.compose(new THREE.Vector3(b.x, b.y + 0.06, b.z), q4, new THREE.Vector3(0.78, 0.78, 0.78)); flock.setMatrixAt(i, m4);
      }
      flock.instanceMatrix.needsUpdate = true;
      near.forEach((b) => { const dx = b.x - L.x, dz = b.z - L.z, d = Math.hypot(dx, dz); if (d < 2.4 && b.fl <= 0) { b.fl = 1.4; b.vy = 3; } if (b.fl > 0) { b.fl -= dt; b.x += dx / (d || 1) * dt * 3.2; b.z += dz / (d || 1) * dt * 3.2; b.vy -= 6 * dt; b.y = Math.max(0, b.y + b.vy * dt); b.ry = Math.atan2(dx, dz); } else { b.y = Math.max(0, b.y - dt * 2); b.x += (b.hx - b.x) * dt * 0.25; b.z += (b.hz - b.z) * dt * 0.25; } b.x = Math.max(0.6, Math.min(W - 0.6, b.x)); b.z = Math.max(-7, Math.min(7.4, b.z)); b.m.position.set(b.x, b.y, b.z); b.m.rotation.set(Math.max(0, Math.sin(t * 3 + b.ph)) * 0.5 * (b.fl > 0 ? 0 : 1), b.ry, 0); });
      // the big one counts witnesses: its yaw eases toward you
      const a = Math.atan2(L.x - 10, L.z + 4.4); big.rotation.y += (a - big.rotation.y) * Math.min(1, dt * 0.4);
      if (scattered > 300 && !got) { got = true; c.egg('scatter', 'Three hundred pigeons scattered from your feet and the big one turned to watch you do it. The little birds retreat. The big one quietly counts witnesses.'); }
    });
  },

  // SANTAS. A conga of Santas follows your path, and shows you how badly you would lead a parade.
  santas(c, r, g, X) {
    const { THREE } = c;
    const start = [[4.0, -5.0], [5.2, -4.2], [6.4, -5.2], [7.6, -4.0], [8.8, -5.0], [10.0, -4.2], [11.2, -5.2], [12.4, -4.0], [13.6, -5.0], [14.8, -4.2], [16.0, -5.2], [17.2, -4.2]];
    const santas = start.map(([x, z], k) => ({ m: c.glb('oy_santa', { h: 1.76, x, z, ry: (k * 2.1) % 6.28 - 3.1, parent: g }), post: c.post(X(x), z, 0.32), x, z, on: false, k }));
    const lines = ['Ho. Ho. Where is the bar.', 'I have been Santa since eleven. It is noon.', 'We are not a parade. We are a condition.', 'He knows when you are sleeping. He is outside yelling.', 'There are four thousand of us and one bathroom.', 'The beard is attached. Do not ask how.'];
    santas.forEach((s) => c.clickable(s.m, () => { c.sound.bell && c.sound.bell(); c.say(s.m, lines[s.k % lines.length], 2800, 2.0); if (!s.on) { s.on = true; c.toast('A Santa is following you.', 1800); } }, 'A Santa'));
    const elf = cast(c, r, g, X, 'elf', 2.0, 0.4, { h: 1.7, ry: 0.9, r: 0.4, line: 'I work for him. I work for all of them. I am tired.', egg: 'elf', hint: 'An elf' });
    // the trail: a ring of the visitor's positions, one every 0.35 m; follower k aims at the point k times 1.3 m behind
    const trail = []; let lastX = 0, lastZ = 0, got = false, hatEgg = false;
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.32, 16), std(c, 0xc8102e, { roughness: 0.8 })); hat.rotation.z = 1.2; eggBox(c, g, X, hat, 15.4, 0.1, 2.2, 'hat', 'A lost hat', 'The New York gathering dates to 1998. The city has been finding stray red hats on fire hydrants, in cabs and on the Staten Island ferry ever since.');
    const boot = c.slab(0.14, 0.3, 0.3, std(c, 0x111111, { roughness: 0.6 }), 0, 0, 0); eggBox(c, g, X, boot, 5.2, 0.15, 3.0, 'boot', 'A boot cover', 'Not a boot. A suggestion of a boot, held together by December.');
    const pitcher = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.22, 16, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, side: THREE.DoubleSide })); eggBox(c, g, X, pitcher, 11.0, 0.11, 3.6, 'water', 'A water pitcher', 'A little water between miracles. Even seasonal staff need a break. Most of them do not take it.');
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) { santas.forEach((s) => { if (s.on) { s.on = false; s.m.position.set(s.x, 0, s.z); s.post.x = X(s.x); s.post.z = s.z; } }); trail.length = 0; return; }
      const L = local(r, P);
      if (Math.hypot(L.x - lastX, L.z - lastZ) > 0.35) { lastX = L.x; lastZ = L.z; trail.unshift([L.x, L.z]); if (trail.length > 80) trail.pop(); }
      let n = 0;
      santas.forEach((s) => {
        if (!s.on) { if (Math.hypot(L.x - s.m.position.x, L.z - s.m.position.z) < 2.2) { s.on = true; c.sound.bell && c.sound.bell(); } else return; }
        n++; const idx = Math.min(trail.length - 1, n * 3); if (idx < 0) return; const [tx, tz] = trail[idx]; const dx = tx - s.m.position.x, dz = tz - s.m.position.z, d = Math.hypot(dx, dz);
        if (d > 0.3) { const sp = Math.min(d, dt * 2.6); s.m.position.x += dx / d * sp; s.m.position.z += dz / d * sp; s.m.rotation.y = Math.atan2(dx, dz); s.m.position.y = Math.abs(Math.sin(t * 8 + s.k)) * 0.06; }
        s.post.x = X(s.m.position.x); s.post.z = s.m.position.z;
      });
      if (n === santas.length && !got) { got = true; c.sound.applause && c.sound.applause(); c.egg('conga', 'Twelve Santas in a line behind you, retracing your actual turns with small delays, which revealed how poorly you would lead a parade. Since 1998, New York has had a seasonal surplus of men dressed for a job none of them is doing.'); }
    });
    // snow, lightly, so it reads as December
    const N = 300, pos = new Float32Array(N * 3); for (let i = 0; i < N; i++) { pos[i * 3] = Math.random() * W; pos[i * 3 + 1] = Math.random() * 10; pos[i * 3 + 2] = -8 + Math.random() * 16; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.8, depthWrite: false })));
    c.tick((t, dt) => { for (let i = 0; i < N; i++) { pos[i * 3 + 1] -= dt * 0.5; pos[i * 3] += Math.sin(t + i) * dt * 0.1; if (pos[i * 3 + 1] < 0) pos[i * 3 + 1] = 10; } geo.attributes.position.needsUpdate = true; });
  },

  // THE CHARACTERS. The billboards show you, live, filmed by a camera in the square.
  times(c, r, g, X) {
    const { THREE } = c;
    const chrome = std(c, 0xc8c8cc, { metalness: 0.9, roughness: 0.3 }), dk = std(c, 0x18181c, { roughness: 0.6 });
    // the camera on a pole by the steps, and the big screen on the east wall that shows what it sees
    const cam = new THREE.Group(); cam.position.set(3.2, 0, 3.6); g.add(cam); cam.add(c.slab(0.16, 3.2, 0.16, chrome, 0, 1.6, 0)); const head = new THREE.Group(); head.position.y = 3.3; cam.add(head); head.add(c.slab(0.46, 0.42, 0.8, dk, 0, 0, 0)); const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.36, 20), chrome); lens.rotation.x = PI / 2; lens.position.z = -0.56; head.add(lens);
    const tally = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), basic(c, 0x330000)); tally.position.set(0, 0.26, -0.42); head.add(tally); c.post(X(3.2), 3.6, 0.3);
    const cam2 = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 60); cam2.layers.enable(1); head.add(cam2); cam2.position.z = -0.75;
    const rt2 = new THREE.WebGLRenderTarget(c.MOBILE ? 320 : 512, c.MOBILE ? 180 : 288);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 3.15), new THREE.MeshBasicMaterial({ map: rt2.texture, color: 0xdde6ff, toneMapped: false })); screen.position.set(W - 0.4, 5.6, -2.6); screen.rotation.y = -PI / 2; g.add(screen);
    g.add(c.slab(0.1, 3.4, 5.9, dk, W - 0.46, 5.6, -2.6));
    const live = c.sign('LIVE · NEW YORKERS · 1 OF 7,542', { w: 5.6, h: 0.4, bg: '#1a0000', fg: '#ff4040', font: c.MONO, weight: 800 }); live.position.set(W - 0.4, 3.6, -2.6); live.rotation.y = -PI / 2; g.add(live);
    // the invented billboards around it
    const bb = (x, y, z, ry, w, h, lines, bg, fg) => { const s = c.sign(lines, { w, h, bg, fg, font: c.SERIF, weight: 900, px: 200, glow: 10 }); s.position.set(x, y, z); s.rotation.y = ry; g.add(s); return s; };
    bb(W - 0.4, 8.6, -2.6, -PI / 2, 5.6, 1.6, 'COUNTED\nTHE MUSICAL', '#ff4fa3', '#fff'); bb(18.0, 6.4, -7.9, 0, 3.6, 2.8, 'N3W\nYORKERS', '#1d4ed8', '#fff'); bb(18.0, 2.4, -7.9, 0, 3.6, 1.0, 'NOW OPEN · SINCE 1998', '#111', '#f5c542');
    bb(10, 8.4, -7.0, 0, 11, 2.4, 'EVERY SIGN SAYS NEW YORKERS · EVERY SCREEN SAYS COUNTED', '#111', '#22d3ee');
    // the me on layer 1, the one the camera sees
    const me = extra(c, c.scene, 0, 0, { col: 0xc8102e, crowd: false }); me.traverse((o) => o.layers.set(1)); me.visible = false;
    const v = new THREE.Vector3(); let fc = 0, aired = 0, was = false;
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) { me.visible = false; return; }
      me.visible = true; me.position.set(P.x, P.y - c.EYE * P.scale, P.z); me.rotation.y = P.yaw;
      const dx = P.x - X(3.2), dz = P.z - 3.6; head.rotation.y += (Math.atan2(-dx, -dz) - head.rotation.y) * Math.min(1, dt * 1.5);
      cam2.updateMatrixWorld(); v.set(P.x, P.y - 0.3, P.z).project(cam2); const inFrame = v.z < 1 && Math.abs(v.x) < 0.9 && Math.abs(v.y) < 0.9 && Math.hypot(dx, dz) > 1.5;
      tally.material.color.set(inFrame ? 0xff2020 : 0x330000);
      if (inFrame) { aired += dt; if (aired > 3 && !was) { was = true; c.egg('billboard', 'Three seconds in frame and you are on a billboard in Times Square between two entirely invented advertisements, with an eye flower for a head. You still have to pay rent.'); } }
      if (fc++ % 2) return;
      screen.visible = false; const old = c.renderer.getRenderTarget(); c.renderer.setRenderTarget(rt2); c.renderer.render(c.scene, cam2); c.renderer.setRenderTarget(old); screen.visible = true;
    });
    // the characters: the cowboy, a man in a gorilla suit, a knight, a furry thing
    cast(c, r, g, X, 'oy_cowboy', 8.0, -3.0, { h: 1.85, ry: 0.4, r: 0.45, line: 'Boots, briefs, hat, guitar. Somehow the guitar makes it a work outfit. Tips are not optional. They are a surcharge on existing.', egg: 'briefs', hint: 'The cowboy' });
    const ape = c.glb('ape', { h: 2.2, x: 13.0, z: -2.4, ry: -0.5, parent: g }); c.post(X(13.0), -2.4, 0.6); c.clickable(ape, () => { c.sound.roar && c.sound.roar(0.3); c.say(ape, 'Photos are free. Standing near me is twenty dollars.', 3000, 2.5); c.egg('gloves', 'The photograph takes a second. Discussing the price can take longer. The suit is not licensed. Neither is the price.'); }, 'A man in a gorilla suit');
    [['oy_bear', 5.2, 0.6, 2.0], ['oy_liberty', 15.8, 1.2, 1.95], ['oy_tourist', 11.0, 1.8, 1.78]].forEach(([nm, x, z, h], k) => { const e = c.glb(nm, { h, x, z, ry: PI + (k - 1) * 0.4, parent: g }); c.post(X(x), z, 0.4); c.clickable(e, () => c.say(e, ['The bear is not licensed. The bear is self employed. Tips go in the paw.', 'Give me your tired, your poor, your five dollars for a photo.', 'Can you take one of me with the bear? Can the bear take one of me with you?'][k], 2800, 2.2), ['A pink bear', 'A Statue of Liberty', 'A tourist'][k]); });
    walkers(c, g, 9, { x1: 2.4, x2: 17.6, z1: 2.6, z2: 6.8, pool: 'night' });
    // the menu of questions
    const menu = c.sign('MENU\nIs the entire restaurant a very expensive piece of conceptual art?\nDid somebody really drop the toasted marshmallow in the margarita?\nWhen you saw the watermelon margarita, did you think what we thought?', { w: 2.4, h: 1.4, bg: '#f4ead2', fg: '#111', font: c.SERIF, weight: 700, px: 320, pad: 0.08 }); menu.position.set(2.0, 4.0, -7.9); g.add(menu);
    c.clickable(menu, () => c.egg('menu', 'November 2012: a newspaper reviewed a celebrity chef restaurant in Times Square entirely in questions. Could the punctuation possibly have been doing more work? Has anyone, since, ordered the nachos?'), 'The menu');
    // rain on the asphalt: the floor already reflects; a few puddles that catch the screens
  },

  // THE RAT CZAR. Put out the bin and the rats flee. Catch the groundhog.
  czar(c, r, g, X) {
    const { THREE } = c;
    // the podium, the officials
    const pod = new THREE.Group(); pod.position.set(10, 0, -5.0); g.add(pod); pod.add(c.slab(0.8, 1.25, 0.6, std(c, 0x5a3a1e, { roughness: 0.6 }), 0, 0.62, 0)); pod.add(c.slab(0.9, 0.06, 0.7, std(c, 0x5a3a1e), 0, 1.27, 0.05)); for (const dx of [-0.2, 0, 0.2]) pod.add(c.slab(0.02, 0.4, 0.02, std(c, 0x222222), dx, 1.5, 0.1)); c.post(X(10), -5.0, 0.6);
    const seal = decal(c, 0.5, 0.5, (q, w, h) => { q.fillStyle = '#1d4ed8'; q.beginPath(); q.arc(w / 2, h / 2, w * 0.46, 0, 7); q.fill(); eyeFlower(q, w / 2, h / 2, w * 0.26); q.fillStyle = '#fff'; q.font = `800 ${w * 0.08}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('CITY OF N3W YORK', w / 2, h * 0.92); }); seal.position.set(0, 0.7, 0.31); pod.add(seal);
    c.clickable(pod, () => c.egg('podium', 'A podium, microphones, a seal. In 2024 officials unveiled a wheeled trash bin at a press conference like a new phone. The lid was ready for its close up.'), 'The podium');
    const off = [[8.2, -5.6, 0x1a1a2a], [11.8, -5.6, 0x2a2a3a], [13.2, -5.2, 0x3a2a2a]].map(([x, z, col]) => { const e = extra(c, g, x, z, { col }); c.post(X(x), z, 0.3); return e; });
    for (let row = 0; row < 3; row++) for (let k = 0; k < 6; k++) { if ((row + k) % 4 === 1) continue; const x = 6.4 + k * 1.4, z = 0.6 + row * 1.5; prop(c, r, g, X, 'plastic_monobloc_chair_01', x, z, { h: 0.8, ry: PI, r: 0.3 }); if ((row * 6 + k) % 3 === 0) extra(c, g, x, z - 0.1, { seated: true, col: 0x2a2a3a, ry: PI, pool: ['folksinger', 'robber'] }); }
    for (const [x, z] of [[4.8, -1.0], [15.4, -1.2]]) { prop(c, r, g, X, 'vintage_video_camera', x, z, { h: 0.5, y: 1.3, ry: Math.atan2(10 - x, -5 - z) }); g.add(c.slab(0.05, 1.3, 0.05, std(c, 0x222222, { metalness: 0.6 }), x, 0.65, z)); extra(c, g, x + 0.4, z + 0.5, { col: 0x3a3a4a, ry: Math.atan2(10 - x, -5 - z), pool: SUITS }); c.post(X(x), z, 0.4); }
    const czar = c.glb('tough', { h: 1.78, x: 6.6, z: -4.6, ry: 0.4, parent: g }); c.post(X(6.6), -4.6, 0.4);
    c.clickable(czar, () => { c.say(czar, 'Bloodthirsty. General aura of badassery. I brought a lid.', 3200, 2.1); c.egg('czar', 'The 2022 job ad asked for someone bloodthirsty, with stamina, stagecraft and a general aura of badassery. The city hired its rat czar in April 2023. Subtle applicants had warning.'); }, 'The rat czar');
    const ad = c.sign('WANTED · RAT CZAR\nBLOODTHIRSTY · STAMINA · STAGECRAFT\nGENERAL AURA OF BADASSERY\n$120,000 TO $170,000', { w: 2.2, h: 1.1, bg: '#f4ead2', fg: '#111', font: c.MONO, weight: 800, px: 256, pad: 0.08 }); ad.position.set(18.0, 3.4, -7.9); g.add(ad);
    c.clickable(ad, () => c.egg('notice', 'Real posting, December 2022. Also required: the ability to kill rats. The salary was real too. Applications were many. The rats were not consulted.'), 'The job posting');
    // the bags, the rats, the bin
    const bags = []; for (let i = 0; i < 14; i++) { const x = 13.6 + (i % 5) * 0.9 + Math.sin(i) * 0.3, z = -3.4 + Math.floor(i / 5) * 0.9, b = c.glb('ph_trashbag', { len: 1.1, x, z, ry: i * 1.3, parent: g, shadow: i < 5 }); b.position.y = Math.floor(i / 5) * 0.0 + (i > 9 ? 0.7 : 0); bags.push(b); } c.post(X(15.4), -2.5, 2.2);
    const rats = scurry(c, g, 10, { x1: 12, x2: 18.5, z1: -5.5, z2: 1.5, len: 0.42 });
    const bin = new THREE.Group(); bin.position.set(10, 0, -1.6); g.add(bin); bin.add(c.slab(0.7, 1.0, 0.6, std(c, 0x111111, { roughness: 0.35 }), 0, 0.5, 0)); const lid = c.slab(0.74, 0.08, 0.64, std(c, 0x1a1a1a, { roughness: 0.3 }), 0, 1.04, 0); lid.rotation.x = -1.3; lid.position.z = -0.3; lid.position.y = 1.3; bin.add(lid); for (const dx of [-0.3, 0.3]) bin.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16), std(c, 0x333333)).translateX(dx).translateY(0.05).translateZ(0.25).rotateZ(PI / 2));
    g.add(c.slab(1.2, 0.3, 1.0, std(c, 0xf4ead2, { roughness: 0.8 }), 10, 0.15, -1.6)); bin.position.y = 0.3; c.post(X(10), -1.6, 0.8);
    const spot = new THREE.SpotLight(0xfff0d0, 30, 10, 0.4, 0.6, 1.2); spot.position.set(10, 7, 0); spot.target.position.set(10, 0.6, -1.6); g.add(spot); g.add(spot.target);
    let closed = false, bagsGone = 0;
    c.clickable(bin, () => {
      if (closed) return; closed = true; c.sound.thud && c.sound.thud(); c.flash(0.2); rats.forEach((o) => (o.away = 6)); off.forEach((e) => { e.userData.head.rotation.z = 0.3; }); c.toast('The lid closes. The rats leave. The officials applaud a lid.', 3200); c.sound.applause && c.sound.applause();
      c.egg('lid', 'One lid, one press conference, one city discovering the trash can in 2024. The bags go in the bin. The rats go to the next block. The next block has a press conference next week.');
      setTimeout(() => { closed = false; lid.rotation.x = -1.3; lid.position.y = 1.3; lid.position.z = -0.3; bags.forEach((b) => (b.visible = true)); }, 14000);
    }, 'Put out the bin');
    c.tick((t, dt) => { if (closed) { lid.rotation.x += (0 - lid.rotation.x) * Math.min(1, dt * 4); lid.position.y += (1.04 - lid.position.y) * Math.min(1, dt * 4); lid.position.z += (0 - lid.position.z) * Math.min(1, dt * 4); bags.forEach((b, i) => { if (b.visible && Math.random() < dt * 0.6) b.visible = false; }); } });
    // the groundhog: thrown from the podium every so often; catch it in the air
    const hog = new THREE.Group(); g.add(hog); hog.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.2, 6, 12), std(c, 0x6a4a2a, { roughness: 0.9 })).rotateZ(PI / 2)); hog.add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), std(c, 0x7a5a3a, { roughness: 0.9 })).translateX(0.2)); for (const dz of [-0.05, 0.05]) hog.add(new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), std(c, 0x5a3a1a)).translateX(0.24).translateY(0.07).translateZ(dz));
    const catchZone = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 6), new THREE.MeshBasicMaterial({ visible: false })); hog.add(catchZone);
    let fl = null, next = 5, caught = 0, dropped = 0;
    c.clickable(hog, () => { if (!fl || fl.t > fl.T) return; fl = null; hog.position.set(-99, 0, 0); caught++; c.sound.ding(); c.flash(0.15); c.toast('Caught. He is fine. He is a plush.', 2400); if (caught === 1) c.egg('chuck', 'A mayor dropped a groundhog on February 2, 2014. It did not end well for the groundhog. For this reenactment we hired plush and installed padding, and you caught him anyway.'); }, 'Catch the groundhog');
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) return; next -= dt;
      if (!fl && next <= 0) { const L = local(r, P); const tx = Math.max(3, Math.min(17, L.x + (Math.random() - 0.5) * 2)), tz = Math.max(-6, Math.min(6, L.z + (Math.random() - 0.5) * 2)); fl = { x0: 10, z0: -4.4, x1: tx, z1: tz, t: 0, T: 1.6 }; c.sound.whoosh && c.sound.whoosh(); c.toast('The mayor has dropped the groundhog.', 1800); }
      if (fl) { fl.t += dt; const u = fl.t / fl.T; if (u <= 1) { hog.position.set(fl.x0 + (fl.x1 - fl.x0) * u, 1.4 + Math.sin(u * PI) * 3.2, fl.z0 + (fl.z1 - fl.z0) * u); hog.rotation.z = u * 7; } else if (u <= 1.6) { hog.position.y = 0.11; hog.rotation.z = 0; } else { fl = null; dropped++; next = 6 + Math.random() * 4; hog.position.set(-99, 0, 0); if (dropped === 2) c.toast('Dropped again. The plush is fine. The plush has been through this.', 2600); } }
    });
    notice(c, g, 'THE BIN · PRESS CONFERENCE · PLEASE HOLD YOUR APPLAUSE FOR THE LID', 10, 2.4, -7.1, 0, 4.2, 0.34, '#1a1a1a', '#f5c542');
  },

  // HISTORIC. The shelves empty whenever you look away. The forecast climbs.
  historic(c, r, g, X) {
    const { THREE } = c;
    const steel = std(c, 0xb8bcc0, { metalness: 0.8, roughness: 0.4 });
    // four shelf units, each with its stock; a unit loses stock every time you look away and back
    const units = [[3.0, -3.4], [7.5, -2.4], [12.0, -3.6], [16.5, -2.6]].map(([x, z], u) => {
      const o = new THREE.Group(); o.position.set(x, 0, z); g.add(o); for (let k = 0; k < 3; k++) o.add(c.slab(2.2, 0.03, 0.6, steel, 0, 0.3 + k * 0.5, 0)); for (const dx of [-1.1, 1.1]) o.add(c.slab(0.04, 1.6, 0.6, steel, dx, 0.8, 0)); o.add(c.slab(2.2, 0.16, 0.02, std(c, 0xf5c542, { roughness: 0.5 }), 0, 1.5, 0.3)); c.wall(X(x - 1.1), z - 0.3, X(x + 1.1), z - 0.3); c.wall(X(x - 1.1), z + 0.3, X(x + 1.1), z + 0.3);
      const items = []; for (let k = 0; k < 3; k++) for (let i = 0; i < 9; i++) { const kind = (i + k * 2 + u) % 4, it = kind === 3 ? new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 14), stockMat(c, 'can', (i + k + u) % 3)) : new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.3 + (i % 3) * 0.04, 0.08), stockMat(c, ['cereal', 'bread', 'cereal'][kind], (i + k) % 3)); it.position.set(-0.95 + i * 0.24, 0.32 + k * 0.5 + (kind === 3 ? 0.1 : 0.15 + (i % 3) * 0.02), 0); o.add(it); items.push(it); }
      return { o, x, z, items, left: items.length, away: 0 };
    });
    let emptied = 0, got = false;
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) return;
      units.forEach((un) => {
        const look = looking(c, r, un.x, un.z, 0.5);
        if (!look) un.away += dt;
        else { if (un.away > 0.7 && un.left > 0) { const take = Math.max(1, Math.round(un.left * 0.25)); let n = 0; for (const it of un.items) { if (!it.visible) continue; it.visible = false; un.left--; if (++n >= take) break; } c.sound.tick && c.sound.tick(); if (un.left === 0) { emptied++; if (emptied === units.length && !got) { got = true; c.egg('shelves', 'Every shelf emptied while you were looking at another shelf. January 26, 2015: the forecast said potentially historic and the city bought every loaf of bread in it. The storm turned north. The bread did not.'); } } } un.away = 0; }
      });
    });
    // the last loaf and the last milk, under a spotlight
    const loaf = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.2, 6, 12), std(c, 0xd8a050, { roughness: 0.9 })); loaf.rotation.z = PI / 2; eggBox(c, g, X, loaf, 10, 1.1, 1.6, 'bread', 'The last loaf', 'Central Park got about ten inches. Less than feared is not the same as sandal weather, but it is not the end of the world either, and the bread knew.');
    g.add(c.slab(0.6, 1.0, 0.6, std(c, 0x1a1a1a, { roughness: 0.3 }), 10, 0.5, 1.6)); c.post(X(10), 1.6, 0.5);
    const spot = new THREE.SpotLight(0xffffff, 24, 8, 0.3, 0.6, 1.2); spot.position.set(10, 5.8, 1.6); spot.target.position.set(10, 1.1, 1.6); g.add(spot); g.add(spot.target);
    const milk = c.slab(0.12, 0.26, 0.12, std(c, 0xf4f4f4, { roughness: 0.6 }), 0, 0, 0); eggBox(c, g, X, milk, 10.25, 1.13, 1.6, 'milk', 'The last milk', 'Milk, bread, eggs: the holy trinity of a storm that might come. French toast for the apocalypse. The apocalypse was flurries.');
    // the TV, and the weatherman beside it
    const tv = board(c, g, 2.8, 1.6, 384); tv.m.position.set(15.0, 3.8, -7.1);
    let inches = 24, hist = 0;
    const drawTV = () => { const { q, W: w, H: h } = tv; q.fillStyle = '#0a0a14'; q.fillRect(0, 0, w, h); const gr = q.createRadialGradient(w * 0.55, h * 0.5, 10, w * 0.55, h * 0.5, w * 0.5); gr.addColorStop(0, '#ff2020'); gr.addColorStop(0.5, '#c02080'); gr.addColorStop(1, '#2030a0'); q.fillStyle = gr; q.beginPath(); q.ellipse(w * 0.55, h * 0.5, w * 0.36, h * 0.42, 0.3, 0, 7); q.fill(); q.fillStyle = '#fff'; q.font = `900 ${h * 0.2}px ${c.SERIF}`; q.textAlign = 'center'; q.fillText(hist > 2 ? 'HISTORIC' : 'POTENTIALLY HISTORIC', w / 2, h * 0.3); q.font = `800 ${h * 0.16}px ${c.MONO}`; q.fillText(`${inches} INCHES`, w / 2, h * 0.62); q.font = `600 ${h * 0.07}px ${c.MONO}`; q.fillText('SUBWAY CLOSED · STAY HOME · BUY BREAD', w / 2, h * 0.9); tv.up(); };
    drawTV();
    const anchor = cast(c, r, g, X, 'anchor', 17.6, -5.8, { h: 1.78, ry: -0.6, r: 0.4, line: 'Potentially historic. Potentially. We said potentially.', egg: 'anchor', hint: 'The weatherman' });
    c.clickable(tv.m, () => { inches += 12; hist++; c.sound.beep && c.sound.beep(); drawTV(); c.toast(['Thirty six inches. Historic.', 'Forty eight inches. Biblical.', 'Sixty inches. The subway is closed for the first time ever for snow.', 'Seventy two inches. It snowed nine.'][Math.min(3, hist - 1)], 2800); if (hist === 4) c.egg('forecast', 'The January 2015 storm was forecast as potentially historic. Potentially carried a lot of the sentence. The whole subway was shut in advance, a first, and the forecast got through the turnstile before anyone else.'); }, 'The forecast');
    const gate = c.sign('STATION CLOSED\nBY ORDER OF THE GOVERNOR\nUNTIL FURTHER SNOW', { w: 1.6, h: 0.8, bg: '#1a1a1a', fg: '#f5c542', font: c.MONO, weight: 800, px: 160, pad: 0.1 }); gate.position.set(2.0, 3.6, -7.9); g.add(gate);
    c.clickable(gate, () => c.egg('gate', 'Eleven at night, every line, every station, locked, for weather that mostly did not come. The chains were historic. The snow was not.'), 'A locked station gate');
    // snow falling past the glass door, in the plate's direction
    const N = 200, pos = new Float32Array(N * 3); for (let i = 0; i < N; i++) { pos[i * 3] = 4 + Math.random() * 12; pos[i * 3 + 1] = Math.random() * 4; pos[i * 3 + 2] = -7.4 + Math.random() * 0.6; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.04, transparent: true, opacity: 0.8, depthWrite: false })));
    c.tick((t, dt) => { for (let i = 0; i < N; i++) { pos[i * 3 + 1] -= dt * 0.4; if (pos[i * 3 + 1] < 0) pos[i * 3 + 1] = 4; } geo.attributes.position.needsUpdate = true; });
    [[5.0, 2.6, 0x3a3a4a], [14.0, 3.2, 0x5a2a2a]].forEach(([x, z, col], k) => { const e = extra(c, g, x, z, { col, ry: PI, pool: 'walkers' }); c.post(X(x), z, 0.3); c.clickable(e, () => c.say(e, ['Is there bread? There is no bread.', 'I bought four shovels. I live on the ninth floor.'][k], 2800, 2.0), 'A shopper'); });
  },

  // SEVENTY SIX. Eat on the beat. The counter climbs. Fireworks at seventy six.
  coney(c, r, g, X) {
    const { THREE } = c;
    // the stage and the long table
    const flag = c.canvasTex(512, 64, (q, w, h) => { for (let i = 0; i < 7; i++) { q.fillStyle = i % 2 ? '#f4f4f4' : '#b8202e'; q.fillRect(0, i * h / 7, w, h / 7 + 1); } q.fillStyle = 'rgba(0,0,0,.15)'; for (let x = 0; x < w; x += 64) q.fillRect(x, 0, 2, h); }); flag.wrapS = THREE.RepeatWrapping; flag.repeat.x = 4;
    g.add(c.slab(16, 0.5, 4, new THREE.MeshStandardMaterial({ map: flag, roughness: 0.8 }), 10, 0.25, -2.6)); c.wall(X(2), -0.6, X(18), -0.6);
    g.add(c.slab(14, 0.08, 1.0, std(c, 0xf4ead2, { roughness: 0.8 }), 10, 1.24, -1.4)); const skirt = c.canvasTex(1024, 64, (q, w, h) => { q.fillStyle = '#1d3a7a'; q.fillRect(0, 0, w, h); q.fillStyle = '#f4f4f4'; for (let x = 16; x < w; x += 32) { q.beginPath(); for (let k = 0; k < 10; k++) { const a = -PI / 2 + k * PI / 5, rr = k % 2 ? 6 : 13; q.lineTo(x + Math.cos(a) * rr, 32 + Math.sin(a) * rr); } q.fill(); } }); skirt.wrapS = THREE.RepeatWrapping; skirt.repeat.x = 2;
    g.add(c.slab(14, 0.7, 0.9, new THREE.MeshStandardMaterial({ map: skirt, roughness: 0.85 }), 10, 0.85, -1.4));
    for (let i = 0; i < 24; i++) { const x = 3.6 + (i % 12) * 1.15 + (i >= 12 ? 0.5 : 0), z = -1.6 + Math.floor(i / 12) * 0.25; const bun = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.1, 4, 8), std(c, 0xd8a050, { roughness: 0.9 })); bun.rotation.z = PI / 2; bun.position.set(x, 1.32, z); g.add(bun); const dog = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.12, 4, 8), std(c, 0xb84a2a, { roughness: 0.6 })); dog.rotation.z = PI / 2; dog.position.set(x, 1.36, z); g.add(dog); }
    for (let i = 0; i < 10; i++) { const x = 3.4 + i * 1.45, stack = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.02 + (i % 3) * 0.04, 20), std(c, 0xf4f4f4, { roughness: 0.4 })); stack.position.set(x, 1.3 + (i % 3) * 0.02, -1.15); g.add(stack); const cup2 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.12, 12), std(c, 0xf4f6ff, { roughness: 0.4 })); cup2.position.set(x + 0.3, 1.34, -1.2); g.add(cup2); }
    // the competitors, with their counters
    const comps = [[4.4, 0x1a1a2a], [7.2, 0x3a2a2a], [10.0, 0x2a3a2a], [12.8, 0x2a2a4a], [15.6, 0x4a3a1a]].map(([x, col], k) => { const e = c.glb('oy_eater', { h: 1.8, x, y: 0.5, z: -2.2, ry: (k - 2) * 0.12, parent: g, shadow: false }); const n = board(c, g, 1.1, 0.5, 128); n.m.position.set(x, 3.0, -3.6); return { e, n, x, v: 50 + k * 4, k }; });
    const drawC = (cp) => { const { q, W: w, H: h } = cp.n; q.fillStyle = '#0a0a0a'; q.fillRect(0, 0, w, h); q.fillStyle = '#ff3030'; q.font = `900 ${h * 0.7}px ${c.MONO}`; q.textAlign = 'center'; q.fillText(String(cp.v), w / 2, h * 0.78); cp.n.up(); };
    comps.forEach(drawC);
    comps.forEach((cp) => c.clickable(cp.e, () => c.say(cp.e, ['Water. Dunk. Chew. Repeat. This is a technique.', 'I am at sixty one. I was at sixty one an hour ago.', 'The buns are not a minor detail.', 'Do not look at me. Look at the counter.', 'Fourth of July. Some people watch fireworks. Some people need a statistic first.'][cp.k], 2800, 1.4), 'A competitor'));
    // your seat, your plate, your counter
    const seatX = 10.2; prop(c, r, g, X, 'wooden_crate_01', seatX, 0.1, { h: 0.5, r: 0.45 });
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.02, 32), std(c, 0xf4f4f4, { roughness: 0.3 })); plate.position.set(seatX, 1.3, -0.9); g.add(plate);
    const myDog = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.14, 4, 8), std(c, 0xb84a2a)); myDog.rotation.z = PI / 2; myDog.position.set(seatX, 1.36, -0.9); g.add(myDog);
    const mine = board(c, g, 2.4, 1.0, 256); mine.m.position.set(seatX, 4.2, -3.6);
    let n = 0, got = false, ring;
    const drawMine = (msg) => { const { q, W: w, H: h } = mine; q.fillStyle = '#0a0a0a'; q.fillRect(0, 0, w, h); q.fillStyle = '#f5c542'; q.font = `700 ${h * 0.14}px ${c.MONO}`; q.textAlign = 'center'; q.fillText(msg || 'YOU · ON THE BEAT', w / 2, h * 0.24); q.fillStyle = n >= 76 ? '#5aff8a' : '#ff3030'; q.font = `900 ${h * 0.6}px ${c.MONO}`; q.fillText(String(n), w / 2, h * 0.84); mine.up(); };
    drawMine();
    ring = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.4, 48), basic(c, 0xf5c542, { transparent: true, opacity: 0.8, depthWrite: false })); ring.rotation.x = -PI / 2; ring.position.set(seatX, 1.31, -0.9); g.add(ring);
    c.clickable(plate, () => {
      const off = Math.abs(c.music.offBeat()); c.sound.pop && c.sound.pop();
      if (off < 0.17) { n++; myDog.scale.x = 0.3; if (n % 10 === 0) c.toast(`${n}. Dunk the bun. Keep the rhythm.`, 1400); if (n === 76 && !got) { got = true; drawMine('SEVENTY SIX'); c.sound.applause && c.sound.applause(); c.sound.drumroll && c.sound.drumroll(); for (let k = 0; k < 6; k++) setTimeout(() => burst(c, g, 4 + k * 2.4, 7 + Math.random() * 2, -6, [0xff4040, 0xffffff, 0x4060ff, 0xffd060][k % 4]), k * 350); c.flash(0.3); c.egg('seventysix', 'Seventy six hot dogs and buns in ten minutes, the record, set in 2021 on this boardwalk. You did it on the beat in about two. The buns are not a minor detail. Most lunches do not require an official.'); } }
      else { if (n > 0) { n = Math.max(0, n - 1); c.toast(off < 0 ? 'Early. You choked. Minus one.' : 'Late. The official saw that. Minus one.', 1400); } }
      drawMine();
    }, 'Eat, on the beat');
    c.clickable(mine.m, () => c.egg('counter', 'The official counter. Seventy six and buns, set in 2021. Every number on this board is a person who trained for it.'), 'The counter');
    const water = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.1, 12, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, side: THREE.DoubleSide })); eggBox(c, g, X, water, seatX + 0.4, 1.36, -0.9, 'water', 'A cup of water', 'The buns get dunked. At this level, lunch has a technique, and the technique is wet.');
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) return;
      const b = c.music.beat || 0.5, off = c.music.offBeat(), u = 1 - Math.min(1, Math.abs(off) / (b / 2)); ring.scale.setScalar(1 + u * 0.5); ring.material.opacity = 0.3 + u * 0.7;
      myDog.scale.x += (1 - myDog.scale.x) * Math.min(1, dt * 6);
      if (Math.floor(t * 0.5) !== Math.floor((t - dt) * 0.5)) { const cp = comps[Math.floor(Math.random() * comps.length)]; if (cp.v < 75) { cp.v++; drawC(cp); } }
    });
    // bunting, the crowd, the boardwalk
    for (let i = 0; i < 12; i++) { const f = c.slab(0.4, 0.5, 0.01, std(c, [0xc8102e, 0xf4f4f4, 0x1d4ed8][i % 3], { roughness: 0.9, side: THREE.DoubleSide }), 2.4 + i * 1.4, 5.0, -6.9); g.add(f); }
    const crowd = []; for (let i = 0; i < 14; i++) { const side = i % 2, x = side ? 15.0 + (i % 5) * 0.85 + Math.sin(i) * 0.2 : 1.6 + (i % 5) * 0.85 + Math.sin(i) * 0.2, z = 2.4 + Math.floor(i / 5) * 1.1 + Math.cos(i * 1.7) * 0.25; const e = extra(c, g, x, z, { col: [0x3a3a4a, 0x6a3a2a, 0x2a4a5a, 0x4a2a4a][i % 4], ry: Math.atan2(10 - x, -2 - z) }); c.post(X(x), z, 0.3); crowd.push(e); }
    c.tick((t) => { crowd.forEach((e, k) => { e.position.y = Math.abs(Math.sin(t * 4 + k)) * 0.05; }); comps.forEach((cp, k) => { cp.e.position.y = 0.5 + Math.abs(Math.sin(t * 5.5 + k)) * 0.03; cp.e.rotation.x = Math.sin(t * 5.5 + k) * 0.04; }); });
    for (const x0 of [1.2, 14.6]) { for (let i = 0; i < 2; i++) g.add(c.slab(2.0, 1.0, 0.05, std(c, 0x8a8c90, { metalness: 0.7, roughness: 0.4 }), x0 + 1.1 + i * 2.1, 0.5, 1.6)); c.wall(X(x0), 1.6, X(x0 + 4.2), 1.6); }
    const cal = notice(c, g, 'JULY 4 · CONEY ISLAND · SINCE 1916 · ALLEGEDLY', 10, 2.4, -7.1, 0, 4.0, 0.34, '#f4f4f4', '#c8102e');
    c.clickable(cal, () => c.egg('calendar', 'The Fourth of July at Coney Island, allegedly since 1916, provably since 1972. Some people watch fireworks. Some people require a hot dog statistic first.'), 'The banner');
    const gull = c.glb('gull', { len: 0.5, x: 2.2, y: 4.6, z: -1.0, ry: 0.6, parent: g, shadow: false }); c.tick((t) => { gull.position.set(10 + Math.cos(t * 0.3) * 8, 4.6 + Math.sin(t * 0.7) * 0.5, -1 + Math.sin(t * 0.3) * 5); gull.rotation.y = -t * 0.3 + PI / 2; });
    c.clickable(gull, () => { c.sound.gull && c.sound.gull(); c.egg('gull', 'The gull has eaten more hot dogs on this boardwalk than any champion. Nobody counts the gull. The gull prefers it.'); }, 'A gull');
  },
};
