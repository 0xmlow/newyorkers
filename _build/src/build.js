// TEN STYLES. ONE CITY., room by room. Ten artists, two rooms each: the real New York moment, then a real part of the
// city wrapped in the art overnight. Every person has an eye flower for a head. Art direction and facts by GPT-6 Astra on
// FLORA (work/runs.json), plates and walls by GPT Image 2.5, the heroes by Tripo H3.1, everything else drawn in code.
// One trick per room, and every one of them needs you to walk, stand or look: a booth that goes on forever, a pumpkin that
// exists from one spot, a crown projected across the room, words that cross themselves out, a fence that animates a dancer.
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { W, D, H_IN, PORTAL } from './rooms.js';
import { crowdBody, crowdCast } from './crowd.js';
import { STORY } from './story.js';

const PI = Math.PI;
const INK = ['#f5c542', '#ff4fa3', '#22d3ee', '#3b82f6', '#ffffff', '#ff7a1a'];
const DZ1 = 2, DZ2 = 5.6, DH = 3.6;
const ART = { kusama: 'Gallery 1 · Yayoi Kusama', basquiat: 'Gallery 2 · Jean-Michel Basquiat', haring: 'Gallery 3 · Keith Haring', hokusai: 'Gallery 4 · Hokusai',
  lichtenstein: 'Gallery 5 · Roy Lichtenstein', dali: 'Gallery 6 · Salvador Dali', warhol: 'Gallery 7 · Andy Warhol', vangogh: 'Gallery 8 · Vincent van Gogh',
  picasso: 'Gallery 9 · Pablo Picasso', banksy: 'Gallery 10 · Banksy' };

// who the extras are in each room (crowd.js POOLS, or names)
const SUITS = ['wiseguy', 'workgirl', 'editor', 'oscar', 'annieh', 'writer'];
const CROWD_CAST = { kusama_a: SUITS, kusama_b: 'walkers', basquiat_a: 'night', basquiat_b: 'walkers', haring_a: SUITS, haring_b: 'walkers', hokusai_a: 'dressy', hokusai_b: 'walkers',
  lichtenstein_a: 'dressy', lichtenstein_b: 'walkers', dali_a: 'night', dali_b: 'dressy', warhol_a: 'night', warhol_b: 'night', vangogh_a: 'walkers', vangogh_b: 'night',
  picasso_a: 'dressy', picasso_b: 'walkers', banksy_a: 'walkers', banksy_b: 'night',
  kusama_c: 'dressy', basquiat_c: 'night', haring_c: 'walkers', hokusai_c: 'dressy', lichtenstein_c: 'dressy', dali_c: 'dressy', warhol_c: 'night', vangogh_c: 'dressy', picasso_c: 'dressy', banksy_c: 'walkers', luna_luna: 'walkers', machine: 'dressy' };
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
  if (r.next) { const s = c.sign(`${r.next} >`, ds); s.position.set(W - 0.4, DH + 0.45, (DZ1 + DZ2) / 2); s.rotation.y = -PI / 2; g.add(s); }

  if (r.plate) c.plate(r);

  const slots = (SLOTS[r.id] || slotsDefault)(r);
  r.cast.forEach((p, k) => { const s = slots[k]; if (!s) return; c.hang(p, s.x, s.y, s.z, s.ry, s.w || 1.3, s.honor ? 'gilt' : r.frame, g, { ...(r.hangOpts || {}), ...(s.o || {}) }); });
  r.hung = r.cast.filter((p) => p.group);

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
  if (!r.noMural && (window.WALLS || []).includes(r.id)) {
    const t = c.tex.load(`assets/walls/${r.id}.jpg`); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8;
    m.wall = new THREE.MeshStandardMaterial({ map: t, roughness: 0.82, color: r.muralTint || 0xffffff });
    m.wall.userData.repX = 10; m.wall.userData.repY = r.outdoor ? (r.low ? 4 : 10) : H_IN;
  }
  else m.wall = c.surf(r.wall || 'brick', 2.4, r.wallTint || 0x6e6660);
  if (r.floor === 'asphalt') { m.floor.roughness = 0.3; m.floor.metalness = 0.3; }
  if ((r.show || (r.impossible && !r.darkRoom)) && m.ceil) { m.ceil = m.ceil.clone(); m.ceil.emissive = new THREE.Color(0x4a4640); }   // a hall's ceiling reads as lit plaster, not a hole
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
    q.fillStyle = '#f4ead2'; q.font = `800 ${w * 0.038}px ${c.MONO}`; q.fillText('TEN STYLES. ONE CITY.', w / 2, h * 0.12); q.fillText((ART[r.g] || '').toUpperCase(), w / 2, h * 0.86); q.font = `700 ${w * 0.03}px ${c.MONO}`; q.fillText((r.name || '').toUpperCase().slice(0, 30), w / 2, h * 0.93);
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
    else if (kind === 'dot') { q.fillStyle = '#ffffff'; q.beginPath(); q.arc(64, 64, 58, 0, 7); q.fill(); }
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
  dots: [['dot', 220, 0.22], ['gum', 20, 0.09]], court: [['gum', 30, 0.09], ['litter', 8, 0.16]], sand: [['leaf', 40, 0.12]], factory: [['litter', 14, 0.18], ['confetti', 60, 0.05]], gallery: [], cobble: [['puddle', 6, 1.2], ['litter', 8, 0.16]],
  slush: [['snow', 8, 0.7], ['puddle', 5, 0.9], ['gum', 20, 0.08], ['litter', 6, 0.14]], boardwalk: [['confetti', 200, 0.05], ['litter', 10, 0.17]],
};
const DCOL = { gum: [0xffffff], litter: [0xffffff, 0xf4e8c8, 0xd8e8ff], leaf: [0xc8642a, 0xd89a2a, 0x8a4a1a, 0xb83a1a, 0xa8a03a], puddle: [0x3a4048], confetti: [0xc8102e, 0x1d4ed8, 0xf4f4f4, 0xf5c542, 0xff4fa3], snow: [0xf4f6fa], splat: [0xffffff], dot: [0xd8102a, 0xf4f4f4, 0x111111, 0xd8102a] };
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
// the census New Yorkers hang where the room leaves room for them
function slotsDefault() {
  const S = [], south = D / 2 - 0.14;
  for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 2.1, z: south, ry: PI, w: 1.5 });
  [-6.6, -4.2, -1.8].forEach((z) => S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 }));
  [-4.2, -1.8].forEach((z) => S.push({ x: W - 0.39, y: 2.1, z, ry: -PI / 2, w: 1.4 }));
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


// ---------- shared pieces for the ten styles ----------
// a polka dot canvas: the Kusama surface, the Lichtenstein print
function dotTex(c, fg, bg, { n = 6, r = 0.32, rep = 1, jitter = 0 } = {}) {
  const t = c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = bg; q.fillRect(0, 0, w, h); q.fillStyle = fg; const s = w / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const k = (j % 2) * 0.5, rr = s * r * (1 + (jitter ? (Math.sin(i * 7.1 + j * 3.3) * jitter) : 0)); q.beginPath(); q.arc((i + k + 0.5) * s % w, (j + 0.5) * s, rr, 0, 7); q.fill(); } });
  t.wrapS = t.wrapT = c.THREE.RepeatWrapping; t.repeat.set(rep, rep); return t;
}
// a footprint on the floor that tells you where a picture lives
function standHere(c, g, x, z, label = 'STAND HERE', col = '#f5c542') {
  const d = decal(c, 0.9, 0.9, (q, w, h) => { q.strokeStyle = col; q.lineWidth = 10; q.beginPath(); q.arc(w / 2, h / 2, w * 0.42, 0, 7); q.stroke(); q.fillStyle = col; q.font = `800 ${w * 0.09}px Arial`; q.textAlign = 'center'; q.fillText(label, w / 2, h / 2 + w * 0.03); });
  d.rotation.x = -PI / 2; d.position.set(x, 0.012, z); g.add(d); return d;
}
const near = (r, P, x, z, rad) => { const L = local(r, P); return Math.hypot(L.x - x, L.z - z) < rad; };
// set a screen mode while the visitor is here, and only undo what this room did (FX belongs to everyone)
function fxWhile(c, r, key, test, ease = 1) {
  let mine = false;
  c.tick((t, dt, P, ri) => { const on = here(r, ri) && test(t, dt, P); if (on) { c.FX[key] = ease; mine = true; } else if (mine) { c.FX[key] = 0; mine = false; } });
}
// a figure drawn as one thick outlined line drawing: the Haring dancer, in poses
function haringFigure(q, x, y, s, pose, fill, line = '#111') {
  const [a1, a2, l1, l2, tilt] = pose; q.save(); q.translate(x, y); q.rotate(tilt || 0); q.lineCap = 'round'; q.lineJoin = 'round';
  const limb = (ax, ay, ang, len) => { q.beginPath(); q.moveTo(ax, ay); q.lineTo(ax + Math.cos(ang) * len, ay + Math.sin(ang) * len); q.stroke(); };
  const draw = (w, col) => { q.strokeStyle = col; q.lineWidth = w; limb(0, -s * 0.35, a1, s * 0.5); limb(0, -s * 0.35, a2, s * 0.5); limb(0, s * 0.15, l1, s * 0.6); limb(0, s * 0.15, l2, s * 0.6); q.beginPath(); q.moveTo(0, -s * 0.45); q.lineTo(0, s * 0.18); q.stroke(); q.beginPath(); q.arc(0, -s * 0.72, s * 0.2, 0, 7); q.stroke(); };
  draw(s * 0.3, line); draw(s * 0.18, fill);
  q.fillStyle = fill; q.beginPath(); q.arc(0, -s * 0.72, s * 0.19, 0, 7); q.fill();
  q.strokeStyle = line; q.lineWidth = s * 0.03; for (const k of [-1, 1]) { q.beginPath(); q.moveTo(k * s * 0.3, -s * 0.95); q.lineTo(k * s * 0.42, -s * 1.08); q.stroke(); }   // the motion lines
  q.restore();
}
const POSES = [[-2.4, -0.7, 1.9, 1.2, 0], [-1.6, -0.2, 2.2, 0.9, 0.1], [-0.9, -2.2, 1.4, 1.7, 0.15], [-0.2, -2.9, 1.1, 2.1, 0], [-2.9, -0.4, 1.6, 0.6, -0.15], [-2.0, -1.2, 2.5, 1.0, -0.1]];
// the pumpkin, the crown, the face: a picture that exists from one standing place only. Each lit pixel of the drawing
// becomes a disc floating somewhere along the ray from the eye through it, sized so it covers its pixel from there.
function anamorph(c, g, V, look, draw, { n = 64, tmin = 4, tmax = 11, fov = 0.5, fill = 1.15, seed = 1 } = {}) {
  const { THREE } = c, cv = document.createElement('canvas'); cv.width = cv.height = n; const q = cv.getContext('2d'); draw(q, n, n);
  const px = q.getImageData(0, 0, n, n).data, f = new THREE.Vector3(...look).normalize(), up = new THREE.Vector3(0, 1, 0), rt = new THREE.Vector3().crossVectors(f, up).normalize(), u2 = new THREE.Vector3().crossVectors(rt, f);
  const pts = []; let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const k = (j * n + i) * 4; if (px[k + 3] < 128) continue; pts.push([i, j, px[k], px[k + 1], px[k + 2]]); }
  const im = new THREE.InstancedMesh(new THREE.CircleGeometry(0.5, 14), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }), pts.length);
  const m4 = new THREE.Matrix4(), o = new THREE.Object3D(), col = new THREE.Color(), vv = new THREE.Vector3(V.x, V.y, V.z), pix = 2 * Math.tan(fov) / n;
  pts.forEach(([i, j, R, G, B], k) => {
    const d = f.clone().addScaledVector(rt, ((i + 0.5) / n * 2 - 1) * Math.tan(fov)).addScaledVector(u2, (1 - (j + 0.5) / n * 2) * Math.tan(fov)), L = d.length(); d.normalize();
    const t = tmin + rnd() * (tmax - tmin); o.position.copy(vv).addScaledVector(d, t); o.lookAt(vv); o.scale.setScalar(t * L * pix * fill); o.updateMatrix(); im.setMatrixAt(k, o.matrix); im.setColorAt(k, col.setRGB(R / 255, G / 255, B / 255, THREE.SRGBColorSpace));
  });
  g.add(im); return im;
}
// a word board, redrawn on demand
function wordBoard(c, g, w, h, x, y, z, ry, paint) { const b = board(c, g, w, h, 256); b.m.position.set(x, y, z); b.m.rotation.y = ry; b.paint = (k) => { paint(b.q, b.W, b.H, k); b.up(); }; b.paint(0); return b; }
// a little screen that shows what a second camera sees, in black and white with a flicker: the Screen Test
function bwScreen(c, g, w, h) {
  const { THREE } = c, rt = new THREE.WebGLRenderTarget(c.MOBILE ? 256 : 400, c.MOBILE ? 320 : 500); rt.isXRRenderTarget = true; rt.texture.colorSpace = THREE.LinearSRGBColorSpace;
  const mat = new THREE.ShaderMaterial({ uniforms: { map: { value: rt.texture }, uT: { value: 0 }, uOn: { value: 0 } }, toneMapped: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform sampler2D map; uniform float uT, uOn; varying vec2 vUv; float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){ vec3 c = texture2D(map, vUv).rgb; float l = dot(c, vec3(.3, .59, .11)); l = pow(l, .8) * (0.92 + 0.08 * sin(uT * 47.)); l += (h(vUv * 300. + uT) - .5) * .12; float v = smoothstep(.75, .3, length(vUv - .5)); l *= v;
        vec3 o = mix(vec3(.04), vec3(l), uOn); gl_FragColor = vec4(o, 1.);
        #include <colorspace_fragment>
      }` });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); g.add(m); return { m, rt, mat };
}

// ---------- the props per room (Poly Haven CC0, the house models, and the FLORA heroes) ----------
const PROPS = {
  kusama_a: [['street_lamp_01', 1.6, -5.2, { h: 4.2, r: 0.3 }], ['street_lamp_01', 18.4, -5.2, { h: 4.2, r: 0.3 }], ['concrete_road_barrier', 2.6, 0.4, { len: 1.8, r: 0.6 }]],
  kusama_b: [['street_lamp_02', 1.8, -5.4, { h: 4.4, r: 0.3 }], ['fire_hydrant', 18.2, 0.4, { h: 0.8, r: 0.3 }], ['planter_box_01', 17.8, -3.6, { len: 1.4, ry: PI / 2, r: 0.5 }]],
  basquiat_a: [['street_lamp_02', 2.0, -5.4, { h: 4.4, r: 0.3 }], ['metal_trash_can', 17.6, -4.2, { h: 1.0, r: 0.5 }], ['nyb_chase_manhole', 6, 1.0, { len: 0.9 }]],
  basquiat_b: [['street_lamp_01', 18.2, -5.2, { h: 4.2, r: 0.3 }], ['metal_trash_can', 1.6, -4.0, { h: 1.0, r: 0.5 }]],
  haring_a: [['metal_trash_can', 18.4, -4.0, { h: 1.0, r: 0.5 }], ['painted_wooden_bench', 1.6, -3.6, { len: 1.8, ry: PI / 2, r: 0.8 }], ['mounted_fluorescent_lights', 6, 0, { len: 1.6, y: 'ceil' }], ['mounted_fluorescent_lights', 14, 0, { len: 1.6, y: 'ceil' }]],
  haring_b: [['nyb_chainlink', 1.2, -5.2, { len: 2.4, ry: PI / 2 }], ['street_lamp_01', 18.4, -5.2, { h: 4.2, r: 0.3 }], ['fire_hydrant', 17.8, 0.6, { h: 0.8, r: 0.3 }]],
  hokusai_a: [['potted_plant_01', 1.4, -6.4, { h: 1.1, r: 0.3 }]],
  hokusai_b: [['street_lamp_01', 1.8, -5.2, { h: 4.2, r: 0.3 }], ['street_lamp_01', 18.2, -5.2, { h: 4.2, r: 0.3 }], ['painted_wooden_bench', 18.0, 0.6, { len: 1.8, ry: -PI / 2, r: 0.8 }]],
  lichtenstein_a: [['WoodenChair_01', 18.2, -5.6, { h: 0.9, ry: -0.6, r: 0.3 }]],
  lichtenstein_b: [['street_lamp_02', 1.8, -5.4, { h: 4.4, r: 0.3 }], ['CoffeeCart_01', 17.2, -4.4, { len: 2.2, ry: -0.3, r: 1.1 }]],
  dali_a: [['street_lamp_02', 18.2, -5.4, { h: 4.4, r: 0.3 }]],
  dali_b: [['street_lamp_01', 1.8, 1.2, { h: 4.2, r: 0.3 }], ['street_lamp_01', 18.2, 1.2, { h: 4.2, r: 0.3 }]],
  warhol_a: [['sofa_02', 3.2, -4.6, { len: 2.1, ry: 0.5, r: 1.0 }]],
  warhol_b: [['street_lamp_02', 1.8, -5.4, { h: 4.4, r: 0.3 }], ['street_lamp_02', 18.2, -5.4, { h: 4.4, r: 0.3 }], ['h_taxi', 16.6, -3.4, { len: 4.6, ry: PI / 2, r: 1.3, raw: true }]],
  vangogh_a: [],
  vangogh_b: [['nyb_dumbo_gaslamp', 2.0, -5.0, { h: 4.0, r: 0.3 }], ['nyb_dumbo_gaslamp', 18.0, -5.0, { h: 4.0, r: 0.3 }], ['painted_wooden_bench', 2.0, 0.6, { len: 1.8, ry: PI / 2, r: 0.8 }]],
  picasso_a: [['Chandelier_03', 5, -1, { h: 1.2, y: 3.6 }], ['Chandelier_03', 15, -1, { h: 1.2, y: 3.6 }], ['WoodenChair_01', 16.6, -3.2, { h: 0.9, ry: -0.5, r: 0.3 }], ['WoodenChair_01', 17.8, -2.4, { h: 0.9, ry: 2.4, r: 0.3 }]],
  picasso_b: [['street_lamp_01', 1.8, -5.2, { h: 4.2, r: 0.3 }], ['street_lamp_01', 18.2, -5.2, { h: 4.2, r: 0.3 }]],
  banksy_a: [['painted_wooden_bench', 17.8, -1.6, { len: 1.8, ry: -PI / 2, r: 0.8 }], ['street_lamp_01', 18.2, -5.2, { h: 4.2, r: 0.3 }], ['metal_trash_can', 18.4, 0.8, { h: 1.0, r: 0.5 }]],
  banksy_b: [['metal_trash_can', 1.6, -4.4, { h: 1.0, r: 0.5 }]],
};
// paintings: the default walls, less where a trick lives
const southOnly = (w = 1.5) => () => { const S = []; for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 2.1, z: D / 2 - 0.14, ry: PI, w }); [-6.6, -4.2, -1.8].forEach((z) => S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 })); [-4.2, -1.8].forEach((z) => S.push({ x: W - 0.39, y: 2.1, z, ry: -PI / 2, w: 1.4 })); return S; };
const SLOTS = {
  haring_a: () => { const S = []; for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.5 }); S.push({ x: 0.14, y: 2.1, z: -6.6, ry: PI / 2, w: 1.3 }); S.push({ x: W - 0.39, y: 2.1, z: -6.6, ry: -PI / 2, w: 1.3 }); S.push({ x: 0.14, y: 2.1, z: 0.6, ry: PI / 2, w: 1.2 }); S.push({ x: W - 0.39, y: 2.1, z: 0.6, ry: -PI / 2, w: 1.2 }); S.push({ x: W - 0.39, y: 2.1, z: -3.0, ry: -PI / 2, w: 1.2 }); return S; },
  basquiat_b: southOnly(1.4),
};

// ---------- the rooms ----------
const ROOM = {
  // GALLERY 1 A. Broad Street, 1968: a happening on the Exchange's doorstep. The trick: a mirrored booth you step into and
  // the dots go on forever. The booth's inner faces write the stencil; a lattice of lights drawn only there, mirrored cell
  // by cell the way facing mirrors repeat, makes a three metre box infinite.
  kusama_a(c, r, g, X) {
    const { THREE } = c;
    const bx = 13.6, bz = -3.0, BW = 3.0, BH = 2.7, BD = 3.0, door = 1.2;
    const dotM = new THREE.MeshStandardMaterial({ map: dotTex(c, '#d8102a', '#f4f0e6', { n: 5, r: 0.3 }), roughness: 0.5 }); dotM.map.repeat.set(2, 2);
    const wallsAt = [[bx, bz - BD / 2, BW, 0], [bx - BW / 2, bz, BD, PI / 2], [bx + BW / 2, bz, BD, PI / 2]];
    for (const [x, z, L, ry] of wallsAt) { const s = c.slab(ry ? 0.12 : L, BH, ry ? L : 0.12, dotM, x, BH / 2, z); g.add(s); }
    const sw = (BW - door) / 2; for (const k of [-1, 1]) g.add(c.slab(sw, BH, 0.12, dotM, bx + k * (door / 2 + sw / 2), BH / 2, bz + BD / 2));
    g.add(c.slab(BW + 0.12, 0.12, BD + 0.12, dotM, bx, BH + 0.06, bz));
    c.wall(X(bx - BW / 2), bz - BD / 2, X(bx + BW / 2), bz - BD / 2); c.wall(X(bx - BW / 2), bz - BD / 2, X(bx - BW / 2), bz + BD / 2); c.wall(X(bx + BW / 2), bz - BD / 2, X(bx + BW / 2), bz + BD / 2);
    c.wall(X(bx - BW / 2), bz + BD / 2, X(bx - door / 2), bz + BD / 2); c.wall(X(bx + door / 2), bz + BD / 2, X(bx + BW / 2), bz + BD / 2);
    // the lining: black, and it marks the stencil wherever you can see it
    const lin = new THREE.MeshBasicMaterial({ color: 0x020203, side: THREE.BackSide, stencilWrite: true, stencilRef: 1, stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp });
    const box = new THREE.Mesh(new THREE.BoxGeometry(BW - 0.14, BH - 0.02, BD - 0.14), lin); box.position.set(bx, BH / 2, bz); box.renderOrder = 5; g.add(box);
    // the lattice: one pattern of lights, repeated in mirrored cells around the booth
    const base = []; let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 46; i++) base.push([(rnd() - 0.5) * BW, rnd() * BH, (rnd() - 0.5) * BD, rnd()]);
    const NC = c.MOBILE ? 2 : 4, cells = []; for (let i = -NC; i <= NC; i++) for (let j = -1; j <= 1; j++) for (let k = -NC; k <= NC; k++) cells.push([i, j, k]);
    const inst = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.035, 0), new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, stencilWrite: true, stencilRef: 1, stencilFunc: THREE.EqualStencilFunc }), base.length * cells.length);
    const o = new THREE.Object3D(), col = new THREE.Color(); let n = 0; const PAL = [0xff2a4a, 0xffffff, 0xff6a2a, 0x40a0ff, 0xffd040];
    for (const [i, j, k] of cells) for (const [x, y, z, h] of base) { const mx = i % 2 ? -x : x, my = j % 2 ? BH - y : y, mz = k % 2 ? -z : z; o.position.set(bx + i * BW + mx, j * BH + my, bz + k * BD + mz); o.scale.setScalar(0.7 + h * 1.2); o.updateMatrix(); inst.setMatrixAt(n, o.matrix); inst.setColorAt(n, col.set(PAL[(h * 5) | 0])); n++; }
    inst.renderOrder = 6; inst.frustumCulled = false; g.add(inst);
    const pulse = inst.material; c.tick((t) => { pulse.color.setScalar(0.75 + Math.sin(t * 1.3) * 0.25); });
    notice(c, g, 'STEP INSIDE · ONE AT A TIME · THE DOTS DO NOT END', bx, BH + 0.4, bz + BD / 2 + 0.08, 0, 3.0, 0.28, '#d8102a', '#ffffff');
    let inside = false; c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; const L = local(r, P), now = Math.abs(L.x - bx) < BW / 2 - 0.2 && Math.abs(L.z - bz) < BD / 2 - 0.2; if (now && !inside) { c.sound.drone(); c.egg('infinity', 'Three metres of booth, as far as the eye can go. Her first mirror room opened in New York in 1965, and she has been making the same three metres endless ever since.'); } inside = now; });
    // the happening: dancers in dotted suits on the Exchange steps, brokers who did not ask for this
    const dancers = []; [[5.0, -4.6], [7.4, -5.2], [9.8, -4.4], [6.2, -2.2], [8.8, -1.8]].forEach(([x, z], k) => { const m = c.glb('ts_dotdancer', { h: 1.78, x, z, ry: 0.4 - k * 0.3, parent: g }); c.post(X(x), z, 0.35); dancers.push(m); c.clickable(m, () => c.say(m, ['We are painting the Exchange. It already had a lot of dots.', 'Obliterate yourself with dots. Then lunch.', 'The police have been notified. The police are dotted.', 'Stocks fell. We stayed.', 'Love forever. Margin calls, also forever.'][k], 3200, 2.0), 'A dancer'); });
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; dancers.forEach((m, k) => { m.rotation.y = 0.4 - k * 0.3 + Math.sin(t * 1.6 + k) * 0.6; m.position.y = Math.abs(Math.sin(t * 2.4 + k)) * 0.08; }); });
    walkers(c, g, 5, { x1: 2.4, x2: 10, z1: 1.2, z2: 6.4, pool: SUITS });
    [[2.6, -5.6], [17.6, 0.8]].forEach(([x, z]) => cardboard(c, g, 'COUNTED', x, 1.3, z, 0, 0.7));
    const tick = c.sign('DJIA 943.75 · DOTS +4,000 · SELF +0', { w: 4.2, h: 0.3, bg: '#0a0a0a', fg: '#40ff70', font: c.MONO, weight: 700, glow: 6 }); tick.position.set(10, 4.6, -7.7); g.add(tick);
    c.clickable(tick, () => c.egg('ticker', 'Her press release for Anatomic Explosion told Wall Street that stock is fake and dots are real. The market closed higher anyway. It usually does.'), 'The ticker');
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12, 0, PI * 2, 0, PI * 0.6), std(c, 0xc8a050, { metalness: 1, roughness: 0.3 })); bell.position.set(1.5, 2.6, 2.0); bell.rotation.x = PI; g.add(bell);
    c.clickable(bell, () => { c.sound.bell(); c.egg('closingbell', 'In 1966 she sold mirror balls from Narcissus Garden for two dollars each at the Venice Biennale until they asked her to stop. Here the bell is free and nobody will ask.'); }, 'The bell');
  },

  // GALLERY 1 B. Chelsea the morning after, every surface dotted. The trick: a cloud of floating dots that is a pumpkin
  // from one spot on the pavement, and nothing from anywhere else.
  kusama_b(c, r, g, X) {
    const { THREE } = c;
    const V = { x: 4.6, y: 1.62, z: 5.6 };
    anamorph(c, g, V, [7.4, -0.5, -8.6], (q, w, h) => {
      q.fillStyle = '#f4c21a'; for (const [dx, rx] of [[-0.24, 0.2], [0.24, 0.2], [-0.1, 0.22], [0.1, 0.22], [0, 0.22]]) { q.beginPath(); q.ellipse(w * (0.5 + dx), h * 0.6, w * rx, h * 0.27, 0, 0, 7); q.fill(); }
      q.fillStyle = '#2a5a1a'; q.fillRect(w * 0.46, h * 0.2, w * 0.08, h * 0.16);
      q.fillStyle = '#0a0a0a'; for (let i = 0; i < 26; i++) { const a = i * 2.4, rr = (i % 5) / 5; q.beginPath(); q.arc(w * (0.5 + Math.cos(a) * 0.33 * rr), h * (0.6 + Math.sin(a) * 0.2 * rr), w * (0.02 + (i % 3) * 0.008), 0, 7); q.fill(); }
    }, { n: 72, tmin: 4.5, tmax: 12, fov: 0.32, seed: 11, fill: 0.92 });
    const pd = decal(c, 0.6, 0.6, (q, w, h) => { q.fillStyle = '#f4c21a'; q.beginPath(); q.ellipse(w / 2, h * 0.58, w * 0.42, h * 0.32, 0, 0, 7); q.fill(); q.fillStyle = '#111'; for (let i = 0; i < 9; i++) { q.beginPath(); q.arc(w * (0.3 + (i % 3) * 0.2), h * (0.45 + Math.floor(i / 3) * 0.12), w * 0.04, 0, 7); q.fill(); } }); pd.rotation.x = -PI / 2; pd.position.set(5.6, 0.014, 4.6); pd.material.opacity = 0.15; g.add(pd);
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; const on = near(r, P, 4.6, 5.6, 0.45) && looking(c, r, 12, -3, 0.93); pd.material.opacity += ((on ? 1 : 0.15) - pd.material.opacity) * Math.min(1, dt * 4); });
    standHere(c, g, V.x, V.z, 'STAND HERE', '#f4c21a');
    let saw = false; c.tick((t, dt, P, ri) => { if (!here(r, ri) || saw) return; if (near(r, P, V.x, V.z, 0.45) && looking(c, r, 12, -3, 0.93)) { saw = true; c.sound.ding(); c.egg('pumpkin', 'From one spot on West 19th Street, two thousand loose dots agree to be a pumpkin. One step and they go back to being nobody in particular. She called it self obliteration.'); } });
    // the queue for the infinity room, around dotted stanchions
    const ropeM = std(c, 0xd8102a, { roughness: 0.6 }), postM = new THREE.MeshStandardMaterial({ map: dotTex(c, '#ffffff', '#d8102a', { n: 3, r: 0.3 }), roughness: 0.4 });
    for (let i = 0; i < 7; i++) { const x = 3.2 + i * 1.1; const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.95, 12), postM); p.position.set(x, 0.48, -1.0); g.add(p); c.post(X(x), -1.0, 0.1); }
    g.add(c.slab(6.6, 0.04, 0.04, ropeM, 6.5, 0.88, -1.0));
    const q = []; for (let i = 0; i < 9; i++) q.push([3.4 + i * 0.95, -1.6 - (i % 2) * 0.2, PI * 0.5]);
    q.forEach(([x, z], k) => { const e = extra(c, g, x, z, { col: [0xd8102a, 0xf4f0e6, 0x1a1a1a][k % 3], ry: -PI / 2, pool: 'walkers' }); c.post(X(x), z, 0.3); c.clickable(e, () => c.say(e, ['Three hours. For forty five seconds.', 'I came for the infinity. I stayed for the line.', 'The line is the artwork. The artwork is also the artwork.', 'Do you think it is still infinite when nobody is inside?'][k % 4], 3000, 2.0), 'Somebody in the line'); });
    const sign = c.sign('INFINITY ROOM · WAIT FROM HERE · 3 HOURS', { w: 3.2, h: 0.36, bg: '#d8102a', fg: '#fff', font: c.MONO, weight: 800 }); sign.position.set(2.8, 1.6, -1.05); g.add(sign);
    // the dotted things of the street: a car, two trees, the pumpkin on the curb
    const carM = new THREE.MeshStandardMaterial({ map: dotTex(c, '#ffffff', '#c8102e', { n: 4, r: 0.32 }), roughness: 0.25, metalness: 0.2 });
    const car = c.glb('h_taxi', { len: 4.4, x: 16.4, z: -3.6, ry: PI / 2, parent: g, onload: (gg) => gg.traverse((m) => { if (m.isMesh) m.material = carM; }) }); c.post(X(16.4), -3.6, 1.3);
    c.clickable(car, () => c.egg('dotcar', 'In 2017 she wrapped a whole room in dots for visitors to stick on themselves; by the end the furniture had disappeared. Parked cars on this block are on notice.'), 'A dotted car');
    for (const [x, z] of [[1.6, -1.8], [18.4, -0.4]]) { const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 4.2, 14), postM); tr.position.set(x, 2.1, z); g.add(tr); c.post(X(x), z, 0.35); const cr = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 12), std(c, 0x8aa040, { roughness: 0.8 })); cr.position.set(x, 4.6, z); g.add(cr); }
    const pk = c.glb('ts_pumpkin', { h: 1.4, x: 15.6, z: 1.2, ry: -0.4, parent: g }); c.post(X(15.6), 1.2, 0.8);
    c.clickable(pk, () => c.egg('pumpkin2', 'She painted pumpkins because they looked humble and generous. One of hers sold for millions. This one is generous.'), 'A pumpkin');
    walkers(c, g, 4, { x1: 9, x2: 18, z1: 2.6, z2: 6.6 });
  },

  // GALLERY 2 A. SoHo, 1979, the year the doors started talking. The trick: a crown painted across the floor, the wall
  // and a shutter in pieces, which only becomes a crown from one spot by the east door.
  basquiat_a(c, r, g, X) {
    const { THREE } = c;
    // project a drawing from V onto the room's own surfaces: floor, west wall, and a freestanding shutter
    const V = new THREE.Vector3(17.2, 1.62, 4.8), look = new THREE.Vector3(-1, -0.25, -0.7).normalize();
    const n = 110, cv = document.createElement('canvas'); cv.width = cv.height = n; const q = cv.getContext('2d');
    q.strokeStyle = '#f4d020'; q.lineWidth = 6.5; q.lineJoin = 'round'; q.beginPath(); q.moveTo(n * 0.12, n * 0.72); q.lineTo(n * 0.2, n * 0.3); q.lineTo(n * 0.36, n * 0.56); q.lineTo(n * 0.5, n * 0.18); q.lineTo(n * 0.64, n * 0.56); q.lineTo(n * 0.8, n * 0.3); q.lineTo(n * 0.88, n * 0.72); q.closePath(); q.stroke();
    q.lineWidth = 5; q.beginPath(); q.moveTo(n * 0.12, n * 0.84); q.lineTo(n * 0.88, n * 0.84); q.stroke();
    q.fillStyle = '#f4f0e6'; q.font = `900 ${n * 0.12}px Arial`; q.fillText('©', n * 0.84, n * 0.2);
    const px = q.getImageData(0, 0, n, n).data, up = new THREE.Vector3(0, 1, 0), rt = new THREE.Vector3().crossVectors(look, up).normalize(), u2 = new THREE.Vector3().crossVectors(rt, look), F = Math.tan(0.36);
    const planes = [{ n: new THREE.Vector3(0, 1, 0), d: 0.004, ok: (p) => p.x > 0.3 && p.x < 19.6 && p.z > -6.5 && p.z < 7.6 }, { n: new THREE.Vector3(1, 0, 0), d: -0.14, ok: (p) => p.y > 0 && p.y < 9.5 && p.z > -7.8 && p.z < 7.8 }, { n: new THREE.Vector3(0, 0, 1), d: 2.0, ok: (p) => p.x > 4 && p.x < 9 && p.y > 0 && p.y < 3.2 }];
    // the shutter the crown lands on: a freestanding roll down gate, tagged
    const shM = new THREE.MeshStandardMaterial({ map: c.canvasTex(256, 256, (qq, w, h) => { qq.fillStyle = '#6a6a66'; qq.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 10) { qq.fillStyle = y % 20 ? '#5a5a56' : '#7a7a74'; qq.fillRect(0, y, w, 5); } }), metalness: 0.6, roughness: 0.6 });
    g.add(c.slab(5.0, 3.2, 0.1, shM, 6.5, 1.6, -2.05)); c.wall(X(4), -2.05, X(9), -2.05);
    const marks = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const k = (j * n + i) * 4; if (px[k + 3] < 100) continue; const d = look.clone().addScaledVector(rt, ((i + 0.5) / n * 2 - 1) * F).addScaledVector(u2, (1 - (j + 0.5) / n * 2) * F).normalize();
      let best = null; for (const P of planes) { const den = d.dot(P.n); if (Math.abs(den) < 1e-3) continue; const t = (P.d - V.dot(P.n)) / den; if (t <= 0.5) continue; const p = V.clone().addScaledVector(d, t); if (!P.ok(p)) continue; if (!best || t < best.t) best = { t, p, P, den }; }
      if (best) marks.push({ ...best, col: [px[k], px[k + 1], px[k + 2]] }); }
    const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ toneMapped: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4 }), marks.length);
    const o = new THREE.Object3D(), col = new THREE.Color(), pix = 2 * F / n;
    marks.forEach((m, k) => { o.position.copy(m.p).addScaledVector(m.P.n, 0.006); o.lookAt(o.position.clone().add(m.P.n)); const sz = m.t * pix * 1.1, stretch = Math.min(1.8, 1 / Math.max(0.25, Math.abs(m.den))); o.scale.set(sz * stretch, sz * stretch, 1); o.updateMatrix(); im.setMatrixAt(k, o.matrix); im.setColorAt(k, col.setRGB(m.col[0] / 255, m.col[1] / 255, m.col[2] / 255, THREE.SRGBColorSpace)); });
    g.add(im);
    standHere(c, g, V.x, V.z, 'THE CORNER', '#f4d020');
    let got = false; c.tick((t, dt, P, ri) => { if (!here(r, ri) || got) return; if (near(r, P, V.x, V.z, 0.45) && looking(c, r, 4, 0, 0.8)) { got = true; c.sound.ding(); c.egg('crown', 'From the corner, the scrawl on the floor, the wall and the gate is one crown with a copyright mark. Anywhere else it is a mess somebody should clean. SAMO was two teenagers, Jean-Michel and Al Diaz, and a can.'); } });
    // the tags, the steam, the walk home
    const tag = (txt, x, y, z, ry, w = 2.2) => { const s = c.sign(txt, { w, h: w * 0.34, bg: null, fg: '#f4f0e6', font: c.MONO, weight: 600, px: 128 }); s.position.set(x, y, z); s.rotation.y = ry; g.add(s); return s; };
    const t1 = tag('SAMO© AS AN ALTERNATIVE\nTO COUNTING SHEEP', 6.5, 2.4, -1.98, 0, 3.0);
    c.clickable(t1, () => c.egg('samo', 'SAMO stood for same old shit. It ran on SoHo doors from 1977 until the two of them fell out and painted SAMO IS DEAD around the neighbourhood in 1980.'), 'A tag');
    steam(c, g, 6, 0.1, 1.0, 0.8);
    const pay = c.glb('ts_payphone', { h: 1.9, x: 1.3, z: 0.4, ry: PI / 2, parent: g }); c.post(X(1.3), 0.4, 0.4);
    c.clickable(pay, () => { c.sound.modem(); c.egg('payphone', 'In 1979 a SoHo payphone took a dime and every flat surface took a tag. SAMO wrote on the phones too; the phones never wrote back.'); }, 'A tagged payphone');
    const voice = cardboard(c, g, 'HE PAINTED POSTCARDS\nAND SOLD THEM FOR A DOLLAR', 15.2, 1.2, -4.8, -0.4, 1.2);
    c.clickable(voice, () => c.egg('postcards', 'He made hand painted postcards and sold them on the street. One buyer at a SoHo restaurant in 1979 was Andy Warhol. Gallery 7 is two rooms on.'), 'A postcard sign');
    walkers(c, g, 3, { x1: 1.5, x2: 8, z1: 5.2, z2: 6.8 });
  },

  // GALLERY 2 B. Great Jones Street, wrapped in crowns overnight. The trick: the words on the walls cross themselves out
  // when you have looked at them long enough to read them, and come back when you look away.
  basquiat_b(c, r, g, X) {
    const { THREE } = c;
    const WORDS = [['COUNTED', 0.14, 2.6, -1.6, PI / 2], ['FAMOUS', 0.14, 2.6, 2.2, PI / 2], ['N3W', W - 0.39, 2.4, -2.0, -PI / 2], ['PRICE', W - 0.39, 2.6, 0.6, -PI / 2], ['MLOW ©', 0.14, 3.6, -5.2, PI / 2], ['ORIGINAL', W - 0.39, 3.6, -5.0, -PI / 2]];
    const boards = WORDS.map(([w, x, y, z, ry]) => {
      const b = wordBoard(c, g, 2.4, 0.9, x + (ry > 0 ? 0.02 : -0.02), y, z, ry, (q, W2, H2, k) => { q.fillStyle = '#f4d020'; q.fillRect(0, 0, W2, H2); q.fillStyle = '#111'; q.font = `900 ${H2 * 0.55}px ${c.MONO}`; q.textAlign = 'center'; q.fillText(w, W2 / 2, H2 * 0.68); if (k > 0) { q.strokeStyle = '#111'; q.lineWidth = H2 * 0.09; q.lineCap = 'round'; q.beginPath(); q.moveTo(W2 * 0.06, H2 * 0.52); q.lineTo(W2 * (0.06 + 0.88 * k), H2 * (0.52 - 0.06 * k)); q.stroke(); } });
      return { b, x, z, dwell: 0, k: 0, drawn: 0 };
    });
    let crossed = 0;
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) return;
      for (const o of boards) {
        const L = local(r, P), dist = Math.hypot(L.x - o.x, L.z - o.z), see = dist < 11 && looking(c, r, o.x, o.z, 0.985);
        if (see) o.dwell += dt; else { o.dwell = 0; if (!looking(c, r, o.x, o.z, 0.5)) o.k = 0; }
        if (o.dwell > 0.7) o.k = Math.min(1, o.k + dt * 2.2);
        if (Math.abs(o.k - o.drawn) > 0.04 || (o.k === 0 && o.drawn !== 0)) { o.b.paint(o.k); o.drawn = o.k; if (o.k === 1 && !o.counted) { o.counted = true; crossed++; c.sound.tick(); if (crossed === 3) c.egg('crossout', 'Read a word here and it crosses itself out. He said he crossed words out so you would see them more. Look away and they come back, which is how fame works too.'); } }
      }
    });
    c.glb('ts_crownbag', { h: 1.5, x: 10, z: -3.4, ry: 0.2, parent: g }); c.post(X(10), -3.4, 0.6);
    const ped = c.slab(1.0, 0.3, 1.0, std(c, 0x1a1a1a, { roughness: 0.4 }), 10, 0.15, -3.4); g.add(ped);
    const bag = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 1.2), new THREE.MeshBasicMaterial({ visible: false })); bag.position.set(10, 1.1, -3.4); g.add(bag);
    c.clickable(bag, () => c.egg('trashking', 'On Great Jones Street the bags go out on Tuesday. In 1983 he moved into number 57, a building owned by Andy Warhol, and lived and painted there until 1988.'), 'The crowned bag');
    const plaque = c.sign('57 · GREAT JONES · 1983 TO 1988', { w: 2.2, h: 0.3, bg: '#1d3a8a', fg: '#fff', font: c.MONO, weight: 700 }); plaque.position.set(18.6, 1.9, 7.8); plaque.rotation.y = PI; g.add(plaque);
    c.clickable(plaque, () => c.egg('gray', 'He named his band Gray, after the anatomy textbook his mother gave him when he was seven and in hospital. The skeletons on every shutter here come from that book.'), 'The plaque');
    walkers(c, g, 7, { x1: 2.4, x2: 17.6, z1: 0.6, z2: 6.6 });
  },

  // GALLERY 3 A. The subway, 1982: chalk on the black paper of empty ad frames. The trick: draw. Click a blank panel and a
  // figure draws itself in chalk; on the third, the transit police come down the platform for you.
  haring_a(c, r, g, X) {
    const { THREE } = c;
    const spots = [[0.14, -4.2, PI / 2], [0.14, -1.8, PI / 2], [W - 0.39, -1.0, -PI / 2], [W - 0.39, -4.8, -PI / 2], [0.14, 3.4, PI / 2]];
    const FIG = [(q, w, h, k) => haringFigure(q, w * 0.5, h * 0.55, h * 0.4, POSES[(Date.now() / 200 | 0) % 6], 'rgba(0,0,0,0)', '#f4f0e6'),
      (q, w, h) => { q.strokeStyle = '#f4f0e6'; q.lineWidth = 6; q.beginPath(); q.ellipse(w * 0.5, h * 0.6, w * 0.22, h * 0.14, 0, 0, 7); q.moveTo(w * 0.36, h * 0.66); q.lineTo(w * 0.3, h * 0.82); q.moveTo(w * 0.64, h * 0.66); q.lineTo(w * 0.7, h * 0.82); q.moveTo(w * 0.42, h * 0.48); q.arc(w * 0.5, h * 0.42, w * 0.08, 0, 7); q.stroke(); for (let i = 0; i < 9; i++) { const a = -PI * 0.95 + i * PI * 0.11; q.beginPath(); q.moveTo(w * 0.5 + Math.cos(a) * w * 0.3, h * 0.55 + Math.sin(a) * h * 0.32); q.lineTo(w * 0.5 + Math.cos(a) * w * 0.4, h * 0.55 + Math.sin(a) * h * 0.42); q.stroke(); } },
      (q, w, h) => { q.strokeStyle = '#f4f0e6'; q.lineWidth = 6; q.beginPath(); q.moveTo(w * 0.2, h * 0.6); q.lineTo(w * 0.75, h * 0.55); q.lineTo(w * 0.85, h * 0.35); q.moveTo(w * 0.3, h * 0.6); q.lineTo(w * 0.28, h * 0.85); q.moveTo(w * 0.7, h * 0.56); q.lineTo(w * 0.72, h * 0.85); q.moveTo(w * 0.85, h * 0.35); q.lineTo(w * 0.92, h * 0.42); q.stroke(); for (let i = 0; i < 3; i++) { q.beginPath(); q.moveTo(w * 0.94, h * (0.28 + i * 0.06)); q.lineTo(w * 0.99, h * (0.25 + i * 0.07)); q.stroke(); } }];
    let drawn = 0, copCalled = false;
    const panels = spots.map(([x, z, ry], k) => {
      const fr = c.slab(0.08, 1.9, 2.9, std(c, 0x7a8288, { metalness: 0.7, roughness: 0.4 }), x + (ry > 0 ? 0.02 : -0.02), 2.0, z); g.add(fr);
      const b = board(c, g, 2.7, 1.7, 384); b.m.position.set(x + (ry > 0 ? 0.08 : -0.08), 2.0, z); b.m.rotation.y = ry;
      const paper = () => { const { q, W: w, H: h } = b; q.fillStyle = '#0e0e10'; q.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { q.fillStyle = 'rgba(255,255,255,0.025)'; q.fillRect(Math.random() * w, Math.random() * h, 30, 2); } b.up(); }; paper();
      let busy = false, done = false;
      c.clickable(b.m, () => {
        if (busy || done) return; busy = true; c.sound.tick();
        // the chalk goes on stroke by stroke: draw the figure into a mask, reveal it left to right over two seconds
        const off = document.createElement('canvas'); off.width = b.W; off.height = b.H; const oq = off.getContext('2d'); oq.lineCap = 'round'; FIG[k % 3](oq, b.W, b.H, k);
        let u = 0; const id = setInterval(() => { u += 0.06; const { q, W: w, H: h } = b; q.save(); q.beginPath(); q.rect(0, 0, w * Math.min(1, u), h); q.clip(); q.drawImage(off, 0, 0); q.restore(); b.up(); if (Math.random() < 0.4) c.sound.tick(); if (u >= 1) { clearInterval(id); busy = false; done = true; drawn++; if (drawn === 3 && !copCalled) { copCalled = true; callCop(); } } }, 60);
      }, 'Draw on the black paper');
      return { b, paper, reset: () => { done = false; paper(); } };
    });
    // the cop: walks up the platform to wherever you are, and says so
    const cop = c.glb('ts_transitcop', { h: 1.82, x: 10, z: -6.2, ry: 0, parent: g }); const copPost = c.post(X(10), -6.2, 0.35);
    let copT = -1;
    function callCop() { copT = 0; c.sound.whistle(); c.toast('Somebody called the transit police.', 2600); }
    c.tick((t, dt, P, ri) => {
      if (copT < 0 || !here(r, ri)) return; copT += dt;
      const L = local(r, P), dx = L.x - cop.position.x, dz = L.z - cop.position.z, d = Math.hypot(dx, dz);
      cop.rotation.y = Math.atan2(dx, dz);
      if (d > 1.6 && copT < 14) { cop.position.x += dx / d * dt * 1.3; cop.position.z += dz / d * dt * 1.3; copPost.x = X(cop.position.x); copPost.z = cop.position.z; }
      else if (copT < 99) { copT = 99; c.say(cop, 'Defacing advertising space. It is empty. That is why it is advertising space.', 4200, 2.2); c.egg('arrest', 'He was arrested for drawing on the black paper more than once. The police knew the drawings by sight. Commuters started taking the panels home before the ads went back up.'); setTimeout(() => panels.forEach((p) => p.reset()), 12000); setTimeout(() => { cop.position.set(10, 0, -6.2); copPost.x = X(10); copPost.z = -6.2; copT = -1; drawn = 0; copCalled = false; }, 14000); }
    });
    c.clickable(cop, () => c.say(cop, 'Keep it moving. Unless you are drawing.', 2600, 2.2), 'A transit cop');
    walkers(c, g, 6, { x1: 3, x2: 17, z1: 0.6, z2: 6.4, pool: SUITS });
    const chalk = c.slab(0.09, 0.02, 0.02, std(c, 0xf4f0e6, { roughness: 0.9 }), 1.0, 0.92, -3.0); g.add(chalk);
    c.clickable(chalk, () => c.egg('chalk', 'He came to New York in 1978 for the School of Visual Arts. The subway was the first gallery that let him in, at about forty drawings a day by his own count.'), 'A stick of chalk');
    const ad = c.sign('THIS SPACE AVAILABLE', { w: 2.4, h: 0.3, bg: '#f4f0e6', fg: '#111', font: c.MONO, weight: 800 }); ad.position.set(10, 3.6, D / 2 - 0.16); ad.rotation.y = PI; g.add(ad);
    c.clickable(ad, () => c.egg('available', 'The drawings lasted until somebody paid for the frame. Every show here closed the day it sold, which is the opposite of how galleries work.'), 'An empty frame');
  },

  // GALLERY 3 B. Harlem River Drive, the handball wall, and the whole block outlined. The trick: a barrier grid. Six poses
  // of one dancer are interlaced in thin stripes behind a slatted fence; walk past and the gaps play them in order. Stop
  // and the dance stops. Nothing moves but you.
  haring_b(c, r, g, X) {
    const { THREE } = c;
    const WW = 8, HH = 2.6, PXM = 512, CW = WW * PXM, CH = Math.round(HH * PXM), S = 8, NF = 6, zW = -4.6, gap = 0.36;
    const frames = POSES.map((p) => { const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH; const q = cv.getContext('2d'); for (let i = 0; i < 4; i++) haringFigure(q, CW * (0.14 + i * 0.24), CH * 0.6, CH * 0.36, POSES[(POSES.indexOf(p) + i) % 6], ['#ff4a2a', '#ffd020', '#22a0ff', '#20c060'][i]); return cv; });
    const tex = c.canvasTex(CW, CH, (q) => { q.fillStyle = '#ff7a1a'; q.fillRect(0, 0, CW, CH); for (let x = 0; x < CW; x += S) { const f = (x / S | 0) % NF; q.drawImage(frames[f], x, 0, S, CH, x, 0, S, CH); } });
    tex.anisotropy = 16; tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter;
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(WW, HH), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); wall.position.set(10, HH / 2 + 0.2, zW); g.add(wall);
    g.add(c.slab(WW + 0.4, HH + 0.6, 0.3, std(c, 0xd8c8a8, { roughness: 0.9 }), 10, (HH + 0.6) / 2, zW - 0.16)); c.wall(X(6 - 0.2), zW, X(14.2), zW);
    // the fence: slats five stripes wide, gaps one stripe wide, a hand's width in front of the wall
    const sw = S / PXM, period = sw * NF, n = Math.floor(WW / period);
    const sl = new THREE.InstancedMesh(new THREE.BoxGeometry(sw * (NF - 1), HH + 0.3, 0.012), std(c, 0x1a1c1e, { metalness: 0.5, roughness: 0.5 }), n); const o = new THREE.Object3D();
    for (let i = 0; i < n; i++) { o.position.set(6 + i * period + sw * (NF - 1) / 2 + sw, HH / 2 + 0.2, zW + gap); o.updateMatrix(); sl.setMatrixAt(i, o.matrix); }
    g.add(sl); for (const x of [5.9, 14.1]) g.add(c.slab(0.08, HH + 0.6, 0.08, std(c, 0x555a5e, { metalness: 0.7 }), x, (HH + 0.6) / 2, zW + gap)); c.wall(X(5.9), zW + gap, X(14.1), zW + gap);
    notice(c, g, 'WALK PAST SLOWLY · THEY DANCE IF YOU DO', 10, HH + 0.75, zW + gap + 0.02, 0, 3.4, 0.28, '#111', '#ff7a1a');
    let lastX = null, walked = 0, got = false;
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) { lastX = null; return; } const L = local(r, P); if (L.z > zW + 1 && L.z < 4 && L.x > 5 && L.x < 15) { if (lastX !== null) walked += Math.abs(L.x - lastX); lastX = L.x; if (walked > 5 && !got) { got = true; c.egg('scanimation', 'Behind the fence there is one still picture. You walked, the gaps moved across six poses, and the dancers danced. Every motion line on a Haring figure is a promise that it moves; this one finally does.'); } } else lastX = null; });
    // the court: a handball, kids, the hydrant spraying
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), std(c, 0x2a60ff, { roughness: 0.4 })); g.add(ball);
    c.tick((t) => { const u = (t * 0.7) % 1; ball.position.set(10 + Math.sin(t * 0.9) * 3, 0.06 + Math.abs(Math.sin(u * PI)) * 1.8, zW + gap + 1.2 + u * 4); });
    c.clickable(ball, () => c.egg('handball', 'He painted Crack is Wack here in 1986 without permission and was arrested. The city painted over half of it, then asked him back to paint a new one. It is still here, on both sides of the wall.'), 'The handball');
    const kids = walkers(c, g, 6, { x1: 3, x2: 17, z1: 0.4, z2: 6.6 });
    const fig = c.glb('ts_haringfig', { h: 2.8, x: 16.6, z: -2.0, ry: -0.5, parent: g }); c.post(X(16.6), -2.0, 0.6);
    c.clickable(fig, () => c.egg('steelfig', 'He made his figures in painted steel and aluminium too, big enough to climb, flat enough to vanish edge on. Walk round this one and it nearly disappears.'), 'A steel dancer');
    const baby = decal(c, 1.2, 1.2, (q, w, h) => { q.fillStyle = '#ffd020'; q.strokeStyle = '#111'; q.lineWidth = 10; q.beginPath(); q.ellipse(w / 2, h * 0.6, w * 0.28, h * 0.2, 0, 0, 7); q.fill(); q.stroke(); q.beginPath(); q.arc(w / 2, h * 0.36, w * 0.12, 0, 7); q.fill(); q.stroke(); for (let i = 0; i < 9; i++) { const a = -PI + i * PI / 8; q.beginPath(); q.moveTo(w / 2 + Math.cos(a) * w * 0.38, h * 0.55 + Math.sin(a) * h * 0.38); q.lineTo(w / 2 + Math.cos(a) * w * 0.47, h * 0.55 + Math.sin(a) * h * 0.47); q.stroke(); } });
    baby.rotation.x = -PI / 2; baby.position.set(15.2, 0.013, 2.2); g.add(baby);
    c.clickable(baby, () => c.egg('radiant', 'The radiant baby was his tag, the first thing he drew and the last. In 1986 he opened the Pop Shop on Lafayette Street so the art cost what a kid could pay.'), 'A radiant baby');
  },

  // GALLERY 4 A. The Japanese galleries, low light. The trick: Pepper's ghost. A glass leaf in the vitrine reflects an eye
  // hidden in a side cabinet, and from the side aisle it sits exactly in the hollow of the wave.
  hokusai_a(c, r, g, X) {
    const { THREE } = c;
    const vx = 10, vz = -3.4;
    // the vitrine: a dark timber case with a print laid in it, and a glass leaf at forty five degrees
    const wood = std(c, 0x6a4628, { roughness: 0.55 });
    g.add(c.slab(4.2, 0.9, 1.4, wood, vx, 0.45, vz)); c.wall(X(vx - 2.1), vz - 0.7, X(vx + 2.1), vz - 0.7); c.wall(X(vx - 2.1), vz + 0.7, X(vx + 2.1), vz + 0.7); c.wall(X(vx - 2.1), vz - 0.7, X(vx - 2.1), vz + 0.7); c.wall(X(vx + 2.1), vz - 0.7, X(vx + 2.1), vz + 0.7);
    const wt = c.tex.load('assets/walls/hokusai_a.jpg'); wt.colorSpace = THREE.SRGBColorSpace;
    const print = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.08), new THREE.MeshStandardMaterial({ map: wt, roughness: 0.9, emissive: 0xffffff, emissiveMap: wt, emissiveIntensity: 0.08, color: 0x9a9080 })); print.position.set(vx, 1.6, vz - 0.2); g.add(print);
    g.add(c.slab(1.8, 1.26, 0.06, wood, vx, 1.6, vz - 0.26));
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.2), new THREE.MeshPhysicalMaterial({ color: 0xcfe0e8, transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0.1 })); glass.position.set(vx, 1.6, vz + 0.3); glass.rotation.y = PI / 4; g.add(glass);
    const cab = c.slab(0.7, 0.7, 0.8, wood, vx - 1.6, 1.25, vz + 0.1); g.add(cab);
    // the ghost: the reflected eye, drawn at its virtual place in the wave's hollow, seen only from the side aisle
    const ghost = decal(c, 0.42, 0.42, (q, w, h) => eyeFlower(q, w / 2, h / 2, w * 0.48)); ghost.material.depthWrite = false; ghost.material.blending = THREE.AdditiveBlending; ghost.material.opacity = 0; ghost.position.set(vx + 0.18, 1.72, vz - 0.16); g.add(ghost);
    const side = new THREE.Vector3(1, 0, 1).normalize(); let got = false;
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; const dx = P.x - (r.x0 + vx), dz = P.z - vz, d = Math.hypot(dx, dz) || 1, k = (dx * side.x + dz * side.z) / d; const a = THREE.MathUtils.smoothstep(k, 0.72, 0.9) * THREE.MathUtils.smoothstep(d, 9, 3); ghost.material.opacity = a; ghost.scale.setScalar(1 + a * 0.15); if (a > 0.7 && !got && looking(c, r, vx, vz, 0.9)) { got = true; c.egg('ghost', 'From the side aisle a blue eye sits in the hollow of the wave, like Fuji in the print. It is a reflection of something in the cabinet, a Victorian stage trick called Pepper\'s ghost. Hokusai never saw New York; the Met has had his wave since a 1929 bequest.'); } });
    standHere(c, g, vx + 3.4, vz + 3.4, 'SIDE AISLE', '#c8a46a');
    c.glb('ts_wave', { h: 1.4, x: 3.2, z: -5.2, ry: 0.5, parent: g }); g.add(c.slab(1.4, 0.6, 1.0, wood, 3.2, 0.3, -5.2)); c.post(X(3.2), -5.2, 0.8);
    const wv = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, 1.0), new THREE.MeshBasicMaterial({ visible: false })); wv.position.set(3.2, 1.2, -5.2); g.add(wv);
    c.clickable(wv, () => c.egg('prussian', 'The blue in the wave is Prussian blue, imported, new and expensive when he used it. Thirty Six Views of Mount Fuji grew to forty six prints, because the series sold.'), 'A carved wave');
    const bench = c.slab(2.4, 0.45, 0.5, wood, 10, 0.22, 2.0); g.add(bench); c.wall(X(8.8), 1.75, X(11.2), 1.75); c.wall(X(8.8), 2.25, X(11.2), 2.25);
    const label = notice(c, g, 'LOW LIGHT · PRINTS REST AFTER A FEW MONTHS ON VIEW', 10, 0.75, vz + 0.72, 0, 2.6, 0.22, '#f4ead2', '#2a1a10');
    c.clickable(label, () => c.egg('rest', 'Woodblock prints fade, so museums show them for a few months and then put them away to rest. The wave you came to see may be asleep. This one has been told to stay up.'), 'The label');
    walkers(c, g, 3, { x1: 2.6, x2: 17, z1: 3.2, z2: 6.4, pool: 'dressy' });
  },

  // GALLERY 4 B. The Battery, October 29, 2012, as a woodblock. The trick: the harbour comes in as you walk toward it,
  // up the legs of the benches and the bottoms of the frames, and goes back when you retreat.
  hokusai_b(c, r, g, X) {
    const { THREE } = c;
    const wgeo = new THREE.PlaneGeometry(W - 0.4, D - 0.4, 60, 48); wgeo.rotateX(-PI / 2);
    const water = new THREE.Mesh(wgeo, new THREE.MeshStandardMaterial({ color: 0x1a3a5a, transparent: true, opacity: 0.72, roughness: 0.08, metalness: 0.4 })); water.position.set(W / 2, -0.05, 0); g.add(water);
    const pos = wgeo.attributes.position, base = Float32Array.from(pos.array);
    // the foam: Hokusai's claws, white flecks riding the surface
    const foam = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.4, 0.12).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ color: 0xf4f0e6, transparent: true, opacity: 0.85, toneMapped: false }), 120); const o = new THREE.Object3D(), fx = [];
    for (let i = 0; i < 120; i++) fx.push([0.6 + Math.random() * 18.8, -7 + Math.random() * 14, Math.random() * 6]);
    g.add(foam);
    // the rain
    const rg = new THREE.BufferGeometry(), N = c.MOBILE ? 300 : 700, rp = new Float32Array(N * 6); for (let i = 0; i < N; i++) { const x = Math.random() * W, y = Math.random() * 9, z = -8 + Math.random() * 16; rp.set([x, y, z, x - 0.05, y - 0.5, z], i * 6); }
    rg.setAttribute('position', new THREE.BufferAttribute(rp, 3)); const rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xc8d4e0, transparent: true, opacity: 0.35 })); g.add(rain);
    const gauge = wordBoard(c, g, 0.5, 2.6, 18.6, 1.3, -5.6, -0.3, (q, w, h, lvl) => { q.fillStyle = '#f4ead2'; q.fillRect(0, 0, w, h); q.fillStyle = '#111'; for (let k = 0; k <= 14; k++) { const y = h - k / 14 * h; q.fillRect(0, y, k % 2 ? w * 0.3 : w * 0.55, 3); if (!(k % 2)) { q.font = `700 ${w * 0.2}px ${c.MONO}`; q.fillText(String(k), w * 0.62, y + 8); } } q.fillStyle = 'rgba(29,78,216,.55)'; q.fillRect(0, h - lvl * h, w, lvl * h); q.fillStyle = '#c8102e'; q.fillRect(0, h - 13.88 / 14 * h, w, 4); });
    let lvl = 0, shown = -1, got = false;
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) return;
      const L = local(r, P), target = THREE.MathUtils.clamp((2.5 - L.z) / 8, 0, 1) * 0.42; lvl += (target - lvl) * Math.min(1, dt * 0.8);
      water.position.y = -0.05 + lvl;
      for (let i = 0; i < pos.count; i++) { const x = base[i * 3], z = base[i * 3 + 2]; pos.setY(i, Math.sin(x * 0.9 + t * 1.6) * 0.03 + Math.sin(z * 1.3 - t * 1.1) * 0.025); } pos.needsUpdate = true;
      fx.forEach(([x, z, ph], k) => { o.position.set(x + Math.sin(t * 0.7 + ph) * 0.3, water.position.y + 0.04, z + Math.sin(t * 0.5 + ph) * 0.4); o.rotation.y = ph; o.scale.setScalar(0.6 + Math.sin(t * 2 + ph) * 0.3); o.updateMatrix(); foam.setMatrixAt(k, o.matrix); }); foam.instanceMatrix.needsUpdate = true;
      const a = rain.geometry.attributes.position; for (let i = 0; i < N; i++) { let y = a.getY(i * 2) - dt * 14; if (y < 0) y += 9; a.setY(i * 2, y); a.setY(i * 2 + 1, y - 0.5); } a.needsUpdate = true;
      const k = Math.round(lvl / 0.42 * 14 * 4) / 4; if (k !== shown) { shown = k; gauge.paint(lvl / 0.42 * 13.88 / 14); }
      if (lvl > 0.36 && !got) { got = true; c.sound.foghorn(); c.egg('surge', 'Walk toward the harbour and it walks toward you. On October 29, 2012, Sandy pushed the water at the Battery to a storm tide near fourteen feet, the highest ever recorded there. The red line on the gauge is that night.'); }
    });
    const liberty = c.glb('liberty_statue_v2', { h: 1.2, x: 16.2, z: -5.6, ry: -0.3, parent: g });
    g.add(c.slab(0.8, 0.9, 0.8, std(c, 0x8a8478, { roughness: 0.8 }), 16.2, 0.45, -5.6)); c.post(X(16.2), -5.6, 0.6);
    c.clickable(liberty, () => c.egg('fuji', 'In the plate she stands where Fuji stands in the print, small and steady behind the wave. After Sandy her island was closed for eight months and reopened on July 4, 2013.'), 'A small Liberty');
    const fort = cardboard(c, g, 'CASTLE CLINTON\nWAS AN ISLAND ONCE', 2.4, 1.2, -5.4, 0.4, 1.0);
    c.clickable(fort, () => c.egg('island', 'The round fort at the Battery was built on rocks two hundred feet offshore. The city filled in the water around it. The water remembers.'), 'A sign');
    walkers(c, g, 5, { x1: 2.4, x2: 17.6, z1: 0.4, z2: 6.6 });
  },

  // GALLERY 5 A. Leo Castelli, 4 East 77th Street, February 1962. The trick: two scrims of Ben-Day dots, hung metres apart,
  // that resolve into one comic face from the doorway and into two half printed messes from anywhere else.
  lichtenstein_a(c, r, g, X) {
    const { THREE } = c;
    const V = new THREE.Vector3(16.4, 1.62, 6.4);
    const N = 46, cv = document.createElement('canvas'); cv.width = cv.height = N; const q = cv.getContext('2d');
    q.fillStyle = '#fff'; q.fillRect(0, 0, N, N); q.fillStyle = '#f4c21a'; q.beginPath(); q.ellipse(N * 0.5, N * 0.38, N * 0.34, N * 0.3, 0, 0, 7); q.fill();
    q.fillStyle = '#f4c8b0'; q.beginPath(); q.ellipse(N * 0.5, N * 0.55, N * 0.22, N * 0.28, 0, 0, 7); q.fill();
    q.fillStyle = '#1d4ed8'; q.beginPath(); q.arc(N * 0.42, N * 0.5, N * 0.05, 0, 7); q.arc(N * 0.58, N * 0.5, N * 0.05, 0, 7); q.fill();
    q.fillStyle = '#d8102a'; q.beginPath(); q.ellipse(N * 0.5, N * 0.7, N * 0.08, N * 0.035, 0, 0, 7); q.fill();
    q.fillStyle = '#fff'; q.beginPath(); q.ellipse(N * 0.78, N * 0.16, N * 0.2, N * 0.1, 0, 0, 7); q.fill();
    const px = q.getImageData(0, 0, N, N).data;
    const look = new THREE.Vector3(-7.4, 0.9, -8.9).normalize(), rt = new THREE.Vector3().crossVectors(look, new THREE.Vector3(0, 1, 0)).normalize(), u2 = new THREE.Vector3().crossVectors(rt, look), F = Math.tan(0.34);
    const scr = [{ z: -0.6, cv: null }, { z: -4.2, cv: null }].map((s) => { const cvs = document.createElement('canvas'); cvs.width = 2048; cvs.height = 1024; const qq = cvs.getContext('2d'); return { ...s, cvs, qq }; });
    const SW = 14, SH = 6, SY = 0.3;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const k = (j * N + i) * 4, R = px[k], G = px[k + 1], B = px[k + 2]; if (R > 240 && G > 240 && B > 240) continue;
      const d = look.clone().addScaledVector(rt, ((i + 0.5) / N * 2 - 1) * F).addScaledVector(u2, (1 - (j + 0.5) / N * 2) * F);
      const s = scr[(i * 7 + j * 3) % 2], t = (s.z - V.z) / d.z, x = V.x + d.x * t, y = V.y + d.y * t;
      const cx = (x - (10 - SW / 2)) / SW * 2048, cy = (1 - (y - SY) / SH) * 1024, rad = Math.abs(t) * 2 * F / N * 2048 / SW * 0.62;
      s.qq.fillStyle = `rgb(${R},${G},${B})`; s.qq.beginPath(); s.qq.arc(cx, cy, rad, 0, 7); s.qq.fill(); s.qq.strokeStyle = '#111'; s.qq.lineWidth = rad * 0.12; s.qq.stroke();
    }
    scr.forEach((s) => { const t = new THREE.CanvasTexture(s.cvs); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; const m = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.DoubleSide, toneMapped: false, depthWrite: false })); m.position.set(10, SY + SH / 2, s.z); g.add(m); const bar = c.slab(SW + 0.2, 0.06, 0.06, std(c, 0x111111, { metalness: 0.6 }), 10, SY + SH + 0.03, s.z); g.add(bar); c.wall(X(3), s.z, X(17), s.z); });
    standHere(c, g, V.x, V.z, 'THE DOORWAY', '#d8102a');
    let got = false; c.tick((t, dt, P, ri) => { if (!here(r, ri) || got) return; if (near(r, P, V.x, V.z, 0.5) && looking(c, r, 9, -2.5, 0.94)) { got = true; c.sound.ding(); c.egg('bendday', 'From the doorway the two screens print one face, the way two plates print one comic. Step aside and it is two half finished jobs. The show opened February 10, 1962, and sold out before the doors did.'); } });
    const price = notice(c, g, 'PRICE LIST · ALL SOLD', 1.2, 1.5, 6.2, PI / 2, 1.4, 0.3, '#f4f0e6', '#d8102a');
    c.clickable(price, () => c.egg('soldout', 'Every painting in the 1962 show sold before the opening. Castelli had started the gallery in his own apartment in 1957, which made the commute short and the critics shorter.'), 'The price list');
    const hearth = c.slab(1.8, 1.2, 0.4, std(c, 0xe8e2d4, { roughness: 0.4 }), 18.0, 0.6, -6.2); g.add(hearth); c.post(X(18), -6.2, 0.9);
    c.clickable(hearth, () => c.egg('ball', 'His Girl with Ball came from a newspaper advertisement for a resort in the Poconos. Pop art borrowed from the ads, and the ads borrowed it back within the year.'), 'The fireplace');
    walkers(c, g, 5, { x1: 1.6, x2: 18.4, z1: 0.8, z2: 5.4, pool: 'dressy' });
  },

  // GALLERY 5 B. Times Square, inked overnight. The trick: stand on the X and the city prints itself: Ben-Day dots, flat
  // inks and a black key line, everything you can see.
  lichtenstein_b(c, r, g, X) {
    const { THREE } = c;
    const xm = decal(c, 1.4, 1.4, (q, w, h) => { q.strokeStyle = '#d8102a'; q.lineWidth = 26; q.lineCap = 'round'; q.beginPath(); q.moveTo(w * 0.15, h * 0.15); q.lineTo(w * 0.85, h * 0.85); q.moveTo(w * 0.85, h * 0.15); q.lineTo(w * 0.15, h * 0.85); q.stroke(); });
    xm.rotation.x = -PI / 2; xm.position.set(10, 0.013, 1.0); g.add(xm);
    let got = false;
    fxWhile(c, r, 'dots', (t, dt, P) => near(r, P, 10, 1.0, 1.1));
    c.tick((t, dt, P, ri) => { if (!got && here(r, ri) && near(r, P, 10, 1.0, 1.1)) { got = true; c.sound.pop(); c.egg('halftone', 'On the X the city prints itself in dots and three inks. His Times Square Mural, enamel on steel, has been in the subway under this spot since 2002, five years after he died; he designed it for free.'); } });
    // speech balloons over the crowd: what people are thinking, as printed
    const LINES = ['I CAN\'T BELIEVE I\nGOT COUNTED!', 'THAT\'S NOT A\nBILLBOARD, DARLING.', 'WHAT A\nTOURIST!', 'IT\'S... A\nNEW YORKER!', 'I DON\'T CARE!\nI\'LL TAKE THE LOCAL!'];
    const crowd = walkers(c, g, 5, { x1: 2.4, x2: 17.6, z1: -1.6, z2: 6.4 });
    crowd.forEach((e, k) => { const b = c.sign(LINES[k], { w: 1.5, h: 0.62, bg: '#ffffff', fg: '#111', font: c.FONT, weight: 900, border: '#111' }); b.position.set(0, 2.5, 0); e.add(b); c.tick(() => { b.quaternion.copy(c.camera.quaternion); }); });
    c.glb('ts_brushstroke', { h: 3.2, x: 4.2, z: -4.4, ry: 0.4, parent: g }); c.post(X(4.2), -4.4, 0.7);
    const bs = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.2, 1.0), new THREE.MeshBasicMaterial({ visible: false })); bs.position.set(4.2, 1.6, -4.4); g.add(bs);
    c.clickable(bs, () => c.egg('brushstroke', 'He made brushstrokes out of painted aluminium, a mark that took a second turned into a sculpture that took a year. Abstract Expressionism, printed and framed.'), 'A brushstroke');
    const burstB = wordBoard(c, g, 2.4, 1.6, 15.6, 3.4, -5.0, -0.4, (q, w, h, k) => { q.clearRect(0, 0, w, h); q.fillStyle = k ? '#f4d020' : 'rgba(0,0,0,0)'; q.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * PI * 2, rr = (i % 2 ? 0.28 : 0.48); q.lineTo(w / 2 + Math.cos(a) * w * rr, h / 2 + Math.sin(a) * h * rr); } q.fill(); if (k) { q.strokeStyle = '#111'; q.lineWidth = 8; q.stroke(); q.fillStyle = '#d8102a'; q.font = `900 ${h * 0.26}px ${c.FONT}`; q.textAlign = 'center'; q.fillText('COUNT!', w / 2, h * 0.58); } });
    burstB.m.material.transparent = true; let popT = 0;
    const tgt = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 0.3), new THREE.MeshBasicMaterial({ visible: false })); tgt.position.set(15.6, 3.4, -5.0); g.add(tgt);
    c.clickable(tgt, () => { burstB.paint(1); c.sound.boom(0.3); c.flash(0.2); popT = 1.2; c.egg('whaam', 'Whaam! is from 1963 and lives in London. New York got the speech balloons. Every one of them over this crowd is thinking about you.'); }, 'Something about to go off');
    c.tick((t, dt) => { if (popT > 0) { popT -= dt; if (popT <= 0) burstB.paint(0); } });
  },

  // GALLERY 6 A. Fifth Avenue, March 1939: inside the window he dressed for a department store. The trick: push the furry tub
  // and the plate glass goes; look away and the window is whole again, as if nothing ever happened, which is what the
  // store would have liked.
  dali_a(c, r, g, X) {
    const { THREE } = c;
    const gz = -5.6, gx1 = 3.5, gx2 = 16.5;
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(gx2 - gx1, 4.2), new THREE.MeshPhysicalMaterial({ color: 0xdfeef0, transparent: true, opacity: 0.16, roughness: 0.04, metalness: 0.3 })); glass.position.set(10, 2.1, gz); g.add(glass);
    const frame = std(c, 0x2a2a2a, { metalness: 0.8, roughness: 0.3 }); for (const x of [gx1, gx2]) g.add(c.slab(0.14, 4.4, 0.14, frame, x, 2.2, gz)); g.add(c.slab(gx2 - gx1 + 0.14, 0.14, 0.14, frame, 10, 4.3, gz)); g.add(c.slab(gx2 - gx1 + 0.14, 0.4, 0.4, frame, 10, 0.2, gz));
    const gwall = c.wall(X(gx1), gz + 0.2, X(gx2), gz + 0.2);
    // the display: red velvet floor, theatrical lamps, the fur tub with a mannequin's arms
    g.add(c.slab(gx2 - gx1, 0.3, 4.0, std(c, 0x6a0a12, { roughness: 0.9 }), 10, 0.15, gz + 2.2)); c.wall(X(gx1), gz + 4.2, X(gx1 + 4), gz + 4.2); c.wall(X(gx2 - 4), gz + 4.2, X(gx2), gz + 4.2);
    const tub = c.glb('ts_furtub', { len: 1.9, x: 10, y: 0.3, z: gz + 1.8, ry: 0, parent: g });
    g.add(c.slab(0.6, 0.8, 0.6, std(c, 0x1a1a1a, { roughness: 0.3 }), 14.2, 0.7, gz + 2.6)); const phone = c.glb('ts_lobsterphone', { len: 0.55, x: 14.2, y: 1.1, z: gz + 2.6, ry: -0.6, parent: g, shadow: false });
    c.clickable(phone, () => { c.sound.bell(); c.egg('lobster', 'Lobster Telephone, 1936, made with the collector Edward James. In this world it rings for you; it only ever rings at 4:20.'); }, 'A lobster telephone');
    const tubHit = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.0, 1.0), new THREE.MeshBasicMaterial({ visible: false })); tubHit.position.set(10, 0.8, gz + 1.8); g.add(tubHit);
    for (const x of [6, 14]) { const lp = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.4, 16, 1, true), std(c, 0x111111, { metalness: 0.8, side: THREE.DoubleSide })); lp.position.set(x, 4.0, gz + 3.0); lp.rotation.x = -0.6; g.add(lp); }
    // the shards: triangles that fly out onto Fifth Avenue and lie there
    const NS = 90, sh = new THREE.InstancedMesh(new THREE.CircleGeometry(0.14, 3), new THREE.MeshPhysicalMaterial({ color: 0xe8f4f8, transparent: true, opacity: 0.5, roughness: 0.05, metalness: 0.4, side: THREE.DoubleSide }), NS); sh.visible = false; g.add(sh);
    const sd = []; for (let i = 0; i < NS; i++) sd.push({ p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), w: new THREE.Vector3() });
    const o = new THREE.Object3D(); let broken = false, away = 0, tubZ = 0, slide = 0;
    const shatter = () => { if (broken) return; broken = true; away = 0; glass.visible = false; gwall.off = true; sh.visible = true; c.sound.crack(); c.flash(0.3); c.shake && c.shake(0.3);
      sd.forEach((s) => { s.p.set(gx1 + Math.random() * (gx2 - gx1), 0.4 + Math.random() * 3.8, gz); s.v.set((Math.random() - 0.5) * 2, Math.random() * 2, -1.5 - Math.random() * 3); s.r.set(Math.random() * 6, Math.random() * 6, Math.random() * 6); s.w.set(Math.random() * 9, Math.random() * 9, Math.random() * 9); }); slide = 1;
      c.egg('tub', 'March 1939: the store changed his window without asking, he tried to put it back, and the fur lined tub went through the glass with him behind it. He was arrested and the judge said an artist has a right to defend his work, then fined him for the window.'); };
    c.clickable(tubHit, shatter, 'Push the tub'); c.clickable(glass, shatter, 'The window');
    c.tick((t, dt, P, ri) => {
      if (!broken) return;
      sd.forEach((s, k) => { if (k === 0) { s.p.set(10.4, 1.6, gz - 0.6); s.r.y += dt * 0.4; s.r.x = 0.3; o.position.copy(s.p); o.rotation.copy(s.r); o.scale.setScalar(2.2); o.updateMatrix(); sh.setMatrixAt(k, o.matrix); o.scale.setScalar(1); return; } if (s.p.y > 0.02) { s.v.y -= 9.8 * dt; s.p.addScaledVector(s.v, dt); s.r.x += s.w.x * dt; s.r.y += s.w.y * dt; } else { s.p.y = 0.02; s.r.x = -PI / 2; } o.position.copy(s.p); o.rotation.copy(s.r); o.updateMatrix(); sh.setMatrixAt(k, o.matrix); }); sh.instanceMatrix.needsUpdate = true;
      if (slide > 0) { tubZ = Math.min(2.2, tubZ + dt * 2.4); tub.position.z = gz + 1.8 - tubZ; tubHit.position.z = tub.position.z; if (tubZ >= 2.2) slide = 0; }
      // look away for two seconds and the window is put back
      if (!here(r, ri) || !looking(c, r, 10, gz, 0.3)) away += dt; else away = 0;
      if (away > 2) { broken = false; glass.visible = true; gwall.off = false; sh.visible = false; tubZ = 0; tub.position.z = gz + 1.8; tubHit.position.z = tub.position.z; if (here(r, ri)) c.toast('The window is intact. The relationship is not.', 2600); }
    });
    const cop = extra(c, g, 13.4, -2.2, { col: 0x1a2440, ry: -0.4 }); c.post(X(13.4), -2.2, 0.3);
    c.clickable(cop, () => c.say(cop, 'Sir, the bathtub is not allowed on Fifth Avenue. Sir. Sir.', 3000, 2.0), 'A policeman');
    const card = notice(c, g, 'DAY · NIGHT · A WINDOW BY SALVADOR DALI', 10, 4.7, gz + 0.1, 0, 4.0, 0.3, '#111', '#c8a050');
    c.clickable(card, () => c.egg('daynight', 'He dressed two windows, Day and Night, with antique mannequins, a bed of coals and that tub. The store swapped in modern mannequins overnight. Surrealism, it turns out, does not take returns.'), 'The window card');
    walkers(c, g, 4, { x1: 2.4, x2: 17.6, z1: 1.0, z2: 6.6, pool: 'night' });
  },

  // GALLERY 6 B. Flushing Meadows, the World's Fair of 1939, melting. The trick: a pond where swans float and elephants are
  // the reflection, the double image from his 1937 painting, built with the floor cut away and the elephants hung
  // upside down beneath the water.
  dali_b(c, r, g, X) {
    const { THREE } = c;
    const px1 = 5, px2 = 15, pz1 = -5.4, pz2 = -1.0, DEEP = 3.6;
    const fl = c.surf(r.floor, 2.2, r.floorTint);
    for (const [x1, x2, z1, z2] of [[0, W, -D / 2, pz1], [0, W, pz2, D / 2], [0, px1, pz1, pz2], [px2, W, pz1, pz2]]) g.add(c.slab(x2 - x1, 0.1, z2 - z1, fl, (x1 + x2) / 2, -0.05, (z1 + z2) / 2));
    const basin = new THREE.MeshBasicMaterial({ color: 0x9cc0d8, side: THREE.BackSide, fog: false }); const bx = new THREE.Mesh(new THREE.BoxGeometry(px2 - px1, DEEP, pz2 - pz1), basin); bx.position.set((px1 + px2) / 2, -DEEP / 2, (pz1 + pz2) / 2); g.add(bx);
    const rim = std(c, 0xd8c8a8, { roughness: 0.7 }); g.add(c.slab(px2 - px1 + 0.4, 0.3, 0.2, rim, (px1 + px2) / 2, 0.15, pz2 + 0.1)); g.add(c.slab(px2 - px1 + 0.4, 0.3, 0.2, rim, (px1 + px2) / 2, 0.15, pz1 - 0.1)); g.add(c.slab(0.2, 0.3, pz2 - pz1, rim, px1 - 0.1, 0.15, (pz1 + pz2) / 2)); g.add(c.slab(0.2, 0.3, pz2 - pz1, rim, px2 + 0.1, 0.15, (pz1 + pz2) / 2));
    c.wall(X(px1 - 0.2), pz2 + 0.2, X(px2 + 0.2), pz2 + 0.2); c.wall(X(px1 - 0.2), pz1 - 0.2, X(px1 - 0.2), pz2 + 0.2); c.wall(X(px2 + 0.2), pz1 - 0.2, X(px2 + 0.2), pz2 + 0.2);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(px2 - px1, pz2 - pz1), new THREE.MeshStandardMaterial({ color: 0xa8c8dc, transparent: true, opacity: 0.22, roughness: 0.02, metalness: 0.3 })); water.rotation.x = -PI / 2; water.position.set((px1 + px2) / 2, -0.02, (pz1 + pz2) / 2); g.add(water);
    const swanM = std(c, 0xf4f0e6, { roughness: 0.5 }), eleM = new THREE.MeshBasicMaterial({ color: 0x3a2a1c, fog: false }), beak = std(c, 0xe08020);
    const swans = [], eles = [];
    [7.2, 10, 12.8].forEach((x, k) => {
      const z = -3.2 + (k - 1) * 0.5, s = new THREE.Group(); s.position.set(x, 0, z); g.add(s); swans.push(s);
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), swanM); body.scale.set(1, 0.6, 1.6); body.position.y = 0.12; s.add(body);
      const neck = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.2, 0.3), new THREE.Vector3(0, 0.6, 0.38), new THREE.Vector3(0, 0.82, 0.2), new THREE.Vector3(0, 0.78, 0.42)]), 16, 0.075, 10), swanM); s.add(neck);
      const bk = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 8), beak); bk.rotation.x = PI / 2; bk.position.set(0, 0.78, 0.5); s.add(bk);
      // its reflection: an elephant, upside down under the water, legs reaching down like the long legs in his paintings
      const e = new THREE.Group(); e.position.set(x, -3.0, z); g.add(e); eles.push(e);   // upright, body just under the swan, legs reaching down: the reflection the painting shows
      const eb = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), eleM); eb.scale.set(1, 0.75, 1.5); eb.position.y = 0.55 + 2.2; e.add(eb);
      for (const [lx, lz] of [[-0.22, -0.4], [0.22, -0.4], [-0.22, 0.4], [0.22, 0.4]]) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 2.6, 6), eleM); lg.position.set(lx, 1.3, lz); e.add(lg); }
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), eleM); head.position.set(0, 2.95, 0.62); e.add(head);
      const trunk = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 2.9, 0.78), new THREE.Vector3(0, 2.4, 0.95), new THREE.Vector3(0, 1.9, 0.8), new THREE.Vector3(0, 1.8, 1.0)]), 12, 0.05, 8), eleM); e.add(trunk);
    });
    c.tick((t) => swans.forEach((s, k) => { s.position.x = [7.2, 10, 12.8][k] + Math.sin(t * 0.3 + k) * 0.4; s.rotation.y = Math.sin(t * 0.2 + k * 2) * 0.6; eles[k].position.x = s.position.x; eles[k].rotation.y = s.rotation.y + PI; s.position.y = Math.sin(t * 1.2 + k) * 0.015; }));
    let got = false; c.tick((t, dt, P, ri) => { if (!here(r, ri) || got) return; const L = local(r, P); if (L.z < 1.8 && L.z > 0 && P.pitch < -0.25 && looking(c, r, 10, -3, 0.6)) { got = true; c.egg('double', 'Three swans on the water, three elephants in it. Swans Reflecting Elephants, 1937: his double image, where one picture is honestly two. Dream of Venus was his pavilion at this fair, with live swimmers in a tank.'); } });
    { const n = notice(c, g, 'LOOK DOWN INTO THE POND', 10, 0.312, pz2 + 0.1, 0, 2.0, 0.16, '#f4ead2', '#6a3a1a'); n.rotation.set(-PI / 2, 0, 0); }
    // the soft watch on the lamppost, at 4:20 as every clock in this world reads
    const wt = c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = '#f4ead2'; q.beginPath(); q.arc(w / 2, h / 2, w * 0.46, 0, 7); q.fill(); q.strokeStyle = '#c8a050'; q.lineWidth = 14; q.stroke(); q.fillStyle = '#111'; q.font = `700 ${w * 0.1}px ${c.SERIF}`; q.textAlign = 'center'; for (let k = 1; k <= 12; k++) { const a = k / 12 * PI * 2 - PI / 2; q.fillText(String(k), w / 2 + Math.cos(a) * w * 0.36, h / 2 + Math.sin(a) * w * 0.36 + 8); } const hand = (a, L, wd) => { q.lineWidth = wd; q.strokeStyle = '#111'; q.beginPath(); q.moveTo(w / 2, h / 2); q.lineTo(w / 2 + Math.cos(a) * L, h / 2 + Math.sin(a) * L); q.stroke(); }; hand((4 + 20 / 60) / 12 * PI * 2 - PI / 2, w * 0.22, 8); hand(20 / 60 * PI * 2 - PI / 2, w * 0.34, 5); });
    const wg = new THREE.PlaneGeometry(1.1, 1.1, 20, 20), wp = wg.attributes.position; for (let i = 0; i < wp.count; i++) { const y = wp.getY(i), x = wp.getX(i); if (y < 0.05) { wp.setZ(i, -Math.pow(-y + 0.05, 1.6) * 1.4); wp.setY(i, y - Math.pow(Math.max(0, -y), 1.3) * 0.6 * (1 - Math.abs(x))); } } wg.computeVertexNormals();
    const watch = new THREE.Mesh(wg, new THREE.MeshStandardMaterial({ map: wt, side: THREE.DoubleSide, roughness: 0.4, metalness: 0.2 })); watch.position.set(1.8, 3.6, 1.45); g.add(watch);
    c.clickable(watch, () => c.egg('softwatch', 'The Persistence of Memory has been at MoMA since 1934, five years before this fair. Here the watch has melted onto a lamppost at 4:20, which is what time it always is.'), 'A soft watch');
    walkers(c, g, 5, { x1: 2.4, x2: 17.6, z1: 1.0, z2: 6.6, pool: 'dressy' });
  },

  // GALLERY 7 A. The Silver Factory, 231 East 47th Street. The trick: the Screen Test. Sit for the Bolex: a second camera
  // films you, on a layer only it can see, and plays you back silent, black and white, slowed down, on the foil wall.
  warhol_a(c, r, g, X) {
    const { THREE } = c;
    const bolex = c.glb('ts_bolex', { h: 1.6, x: 10, z: -1.4, ry: PI, parent: g }); c.post(X(10), -1.4, 0.5);
    const stool = new THREE.Group(); stool.position.set(10, 0, 2.6); g.add(stool); stool.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 20), std(c, 0x1a1a1a)).translateY(0.7)); for (let k = 0; k < 3; k++) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.7, 6), std(c, 0x888888, { metalness: 0.9 })); const a = k / 3 * PI * 2; lg.position.set(Math.cos(a) * 0.14, 0.35, Math.sin(a) * 0.14); stool.add(lg); }
    standHere(c, g, 10, 2.6, 'SIT · DO NOT BLINK', '#e8e8f0');
    const cam2 = new THREE.PerspectiveCamera(32, 4 / 5, 0.1, 40); cam2.layers.enable(1); cam2.position.set(r.x0 + 10, 1.62, -1.0); cam2.lookAt(r.x0 + 10, 1.5, 2.6);
    const scr = bwScreen(c, g, 2.4, 3.0); scr.m.position.set(10, 3.0, -7.4);
    g.add(c.slab(2.6, 3.2, 0.06, std(c, 0x0a0a0a), 10, 3.0, -7.47));
    const me = extra(c, c.scene, 0, 0, { col: 0x111111, crowd: false }); me.traverse((o) => o.layers.set(1)); me.visible = false; c.warm && c.warm(me);
    const cnt = notice(c, g, 'SCREEN TEST · 00:00', 10, 1.25, -7.42, 0, 2.4, 0.26, '#0a0a0a', '#e8e8f0');
    let sit = 0, filming = false, flick = 0, got = false;
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) { filming = false; me.visible = false; scr.mat.uniforms.uOn.value = 0; return; }
      const onMark = near(r, P, 10, 2.6, 0.6); sit = onMark ? sit + dt : 0; filming = sit > 1.2;
      me.visible = filming; if (filming) { me.position.set(P.x, 0, P.z); me.rotation.y = P.yaw + PI; }
      scr.mat.uniforms.uOn.value += ((filming ? 1 : 0) - scr.mat.uniforms.uOn.value) * Math.min(1, dt * 3); scr.mat.uniforms.uT.value = t;
      // shot at 24, shown at 16: the screen updates two frames in three
      flick += dt; if (filming && flick > 1 / 16) { flick = 0; scr.m.visible = false; const old = c.renderer.getRenderTarget(); c.renderer.setRenderTarget(scr.rt); c.renderer.render(c.scene, cam2); c.renderer.setRenderTarget(old); scr.m.visible = true; }
      if (filming && sit > 6 && !got) { got = true; c.egg('screentest', 'You sat for a Screen Test. He shot hundreds of them, about three minutes each, silent, at 24 frames a second, then projected them at 16 so doing nothing lasted longer. Now you are in the collection.'); }
    });
    // silver clouds: helium pillows that drift away from you
    const cloudM = new THREE.MeshStandardMaterial({ color: 0xe8ecf0, metalness: 1, roughness: 0.12 }); const clouds = [];
    for (let k = 0; k < 10; k++) { const pg = new THREE.SphereGeometry(0.5, 20, 14); pg.scale(1, 0.32, 0.72); const p = new THREE.Mesh(pg, cloudM); p.position.set(3 + (k % 5) * 3.2, 2.6 + (k % 3) * 0.7, -5 + Math.floor(k / 5) * 5); g.add(p); clouds.push({ p, v: new THREE.Vector3(), home: p.position.clone() }); }
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; const L = local(r, P); clouds.forEach((cl, k) => { const dx = cl.p.position.x - L.x, dz = cl.p.position.z - L.z, d = Math.hypot(dx, dz); if (d < 2) { cl.v.x += dx / d * dt * 2; cl.v.z += dz / d * dt * 2; } cl.v.addScaledVector(cl.home.clone().sub(cl.p.position), dt * 0.15); cl.v.multiplyScalar(0.98); cl.p.position.addScaledVector(cl.v, dt); cl.p.position.y = cl.home.y + Math.sin(t * 0.8 + k) * 0.15; cl.p.rotation.y += dt * 0.1; cl.p.rotation.z = Math.sin(t * 0.6 + k) * 0.2; }); });
    const sc = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ visible: false })); sc.position.copy(clouds[2].home); g.add(sc);
    c.clickable(clouds[0].p, () => c.egg('clouds', 'Silver Clouds, helium filled metallic pillows, first floated at Leo Castelli\'s gallery in 1966. He said he was retiring from painting and the art could float out of the window.'), 'A silver cloud');
    // the soup on the floor, the payphone, the couch
    const can = c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = '#f4f0e6'; q.fillRect(0, 0, w, h); q.fillStyle = '#c8102e'; q.fillRect(0, 0, w, h * 0.45); q.fillStyle = '#fff'; q.font = `900 ${w * 0.2}px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('N3W', w / 2, h * 0.3); q.fillStyle = '#111'; q.font = `900 ${w * 0.14}px ${c.FONT}`; q.fillText('SOUP', w / 2, h * 0.68); q.fillStyle = '#c8a050'; q.beginPath(); q.arc(w / 2, h * 0.84, w * 0.08, 0, 7); q.fill(); });
    const cm = new THREE.MeshStandardMaterial({ map: can, roughness: 0.4, metalness: 0.3 }); for (let k = 0; k < 8; k++) { const cy = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.34, 20), cm); cy.position.set(15.2 + (k % 4) * 0.28, 0.17 + Math.floor(k / 4) * 0.34, -5.6); g.add(cy); }
    const cans = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.4), new THREE.MeshBasicMaterial({ visible: false })); cans.position.set(15.6, 0.35, -5.6); g.add(cans); c.post(X(15.6), -5.6, 0.6);
    c.clickable(cans, () => c.egg('soup', 'Thirty two soup canvases, one per flavour, first shown in Los Angeles in 1962 for a hundred dollars each. He said he had the same lunch every day for twenty years.'), 'A stack of soup');
    c.clickable(bolex, () => c.egg('billyname', 'Billy Name covered the loft in foil and silver paint in 1964, and the Factory was silver from then on. Name is the right word for him.'), 'The Bolex');
    walkers(c, g, 5, { x1: 2.4, x2: 17.6, z1: 4.0, z2: 6.6, pool: 'night' });
  },

  // GALLERY 7 B. West 34th Street and the building that never moved. The trick: step off the kerb into the crosswalk and the
  // street silkscreens itself four times in four inks; the EMPIRE screen counts the eight hours.
  warhol_b(c, r, g, X) {
    const { THREE } = c;
    const stripes = new THREE.MeshStandardMaterial({ color: 0xf4f0e6, roughness: 0.6 }); for (let k = 0; k < 7; k++) g.add(c.slab(0.5, 0.012, 3.2, stripes, 6.4 + k * 1.2, 0.007, 0.4));
    let got = false;
    fxWhile(c, r, 'quad', (t, dt, P) => { const L = local(r, P); return L.x > 6 && L.x < 14.2 && L.z > -1.2 && L.z < 2.0; });
    c.tick((t, dt, P, ri) => { if (got || !here(r, ri)) return; const L = local(r, P); if (L.x > 6 && L.x < 14.2 && L.z > -1.2 && L.z < 2.0) { got = true; c.sound.ticket(); c.egg('fourup', 'In the crosswalk the street prints four times in four inks. He silkscreened the same image again and again until repetition became the subject. Thirty fourth Street was already doing that with taxis.'); } });
    const scr = wordBoard(c, g, 3.2, 1.0, 10, 4.3, -7.6, 0, (q, w, h, k) => { q.fillStyle = '#0a0a0a'; q.fillRect(0, 0, w, h); q.fillStyle = '#e8e8f0'; q.font = `700 ${h * 0.28}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('EMPIRE', w / 2, h * 0.36); const s = Math.floor(k), hh = String(Math.floor(s / 3600)), mm = String(Math.floor(s / 60) % 60).padStart(2, '0'), ss = String(s % 60).padStart(2, '0'); q.font = `600 ${h * 0.22}px ${c.MONO}`; q.fillText(`${hh}:${mm}:${ss} OF 8:05:00`, w / 2, h * 0.78); });
    let el = 0, shown = -1; c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; el += dt; if ((el | 0) !== shown) { shown = el | 0; scr.paint(el); } });
    c.clickable(scr.m, () => c.egg('empire', 'Empire, 1964: one shot of the Empire State Building, filmed from the Time Life Building overnight on July 25 and 26, about six and a half hours of film shown slowed to eight hours and five minutes. The building did not move. That was the plot.'), 'The EMPIRE counter');
    const cam = c.glb('ts_bolex', { h: 1.6, x: 12.6, z: -2.6, ry: PI * 0.9, parent: g }); c.post(X(12.6), -2.6, 0.5);
    c.clickable(cam, () => c.egg('mekas', 'Jonas Mekas ran the camera for Empire. It is probably the only film in which the lead never misses a mark.'), 'A camera pointed at a building');
    walkers(c, g, 7, { x1: 2.4, x2: 17.6, z1: 2.4, z2: 6.6, pool: 'night' });
  },

  // GALLERY 8 A. MoMA, the fifth floor, the crowd of phones. The trick: hold still for a moment, as nobody here does, and the
  // whole room starts to move the way the brush did.
  vangogh_a(c, r, g, X) {
    const { THREE } = c;
    let still = 0, last = null, got = false;
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) { still = 0; last = null; return; } const k = `${P.x.toFixed(2)},${P.z.toFixed(2)},${P.yaw.toFixed(2)}`; still = k === last ? still + dt : 0; last = k; if (still > 3 && !got) { got = true; c.egg('stillness', 'You held still and the room swirled. Everybody else here is moving: phones up, phones down, next. He painted The Starry Night in 1889 from a room at the asylum in Saint Remy, mostly from memory, in the daytime.'); } });
    fxWhile(c, r, 'swirl', () => still > 2.2);
    // the crowd: visitors with their phones up, each phone showing the picture
    const ph = c.canvasTex(64, 128, (q, w, h) => { q.fillStyle = '#111'; q.fillRect(0, 0, w, h); const gr = q.createLinearGradient(0, 8, 0, h - 8); gr.addColorStop(0, '#1a2a6a'); gr.addColorStop(0.6, '#2a4ab0'); gr.addColorStop(1, '#0a1a3a'); q.fillStyle = gr; q.fillRect(4, 8, w - 8, h - 16); q.fillStyle = '#f4d020'; for (let i = 0; i < 6; i++) { q.beginPath(); q.arc(10 + (i * 17) % 44, 20 + i * 9, 3, 0, 7); q.fill(); } q.fillStyle = '#0a1a0a'; q.beginPath(); q.moveTo(14, h - 10); q.lineTo(20, 40); q.lineTo(26, h - 10); q.fill(); });
    const phM = new THREE.MeshBasicMaterial({ map: ph, toneMapped: false });
    const spots = []; for (let i = 0; i < 14; i++) spots.push([4.2 + (i % 7) * 1.9 + Math.sin(i * 2.1) * 0.3, -4.6 + Math.floor(i / 7) * 1.4 + Math.cos(i * 1.7) * 0.3]);
    spots.forEach(([x, z], k) => { const e = extra(c, g, x, z, { col: [0x3a3a4a, 0x6a4a2a, 0x2a4a6a, 0x5a2a3a][k % 4], ry: PI, pool: 'walkers' }); c.post(X(x), z, 0.3); const p = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.16), phM); p.position.set(0.12, 1.75, -0.32); p.rotation.y = PI; e.add(p); c.clickable(e, () => c.say(e, ['I have it. I have it on my phone.', 'It is smaller than I thought.', 'Can you take one of me with it?', 'I will look at it later.', 'Is this the real one?'][k % 5], 2600, 2.0), 'A visitor'); });
    const guard = extra(c, g, 3.0, -6.2, { seated: true, col: 0x1a1a2a, ry: 0.6 }); c.post(X(3), -6.2, 0.4);
    c.clickable(guard, () => c.say(guard, 'Please do not touch. Please do not lean. Please, at some point, look.', 3200, 1.5), 'The guard');
    const lab = notice(c, g, 'THE STARRY NIGHT · 1889 · 73.7 x 92.1 CM', 1.4, 1.5, -5.6, PI / 2, 1.8, 0.24, '#f4f2ec', '#111');
    c.clickable(lab, () => c.egg('bliss', 'MoMA acquired it in 1941 through the Lillie P. Bliss Bequest. It is about the size of a folding table. Most people see it first through a phone the size of a postcard.'), 'The wall label');
    const ropeM = std(c, 0x2a2a2a); g.add(c.slab(8.0, 0.03, 0.03, ropeM, 10, 0.85, -6.2)); for (const x of [6, 14]) g.add(c.slab(0.05, 0.9, 0.05, ropeM, x, 0.45, -6.2));
  },

  // GALLERY 8 B. DUMBO under his sky. The trick: the sky turns where you look. The vortex in the stars follows your gaze, and
  // the harder you look at one place the faster it goes.
  vangogh_b(c, r, g, X) {
    const { THREE } = c;
    const sky = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false, uniforms: { uT: { value: 0 }, uLook: { value: new THREE.Vector3(0, 0.3, -1) }, uSpin: { value: 0 } },
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: `uniform float uT, uSpin; uniform vec3 uLook; varying vec3 vD;
        float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453); }
        vec3 rot(vec3 v, vec3 k, float a){ return v * cos(a) + cross(k, v) * sin(a) + k * dot(k, v) * (1. - cos(a)); }
        void main(){
          vec3 d = normalize(vD); vec3 L = normalize(uLook); float ang = acos(clamp(dot(d, L), -1., 1.));
          vec3 q = rot(d, L, uSpin * exp(-ang * 3.2) * 2.2 + sin(uT * 0.15 + d.y * 3.) * 0.15);
          float band = sin(q.x * 9. + sin(q.y * 7. + q.z * 5. + uT * 0.25) * 2.2 + q.z * 6.) * 0.5 + 0.5; band = mix(band, h(floor(q * 60.)), 0.12);
          float band2 = sin(q.y * 13. + q.x * 8. - uT * 0.18 + sin(q.z * 11.) * 1.5) * 0.5 + 0.5;
          vec3 col = mix(vec3(0.03, 0.08, 0.32), vec3(0.12, 0.3, 0.72), band) ; col = mix(col, vec3(0.45, 0.62, 0.95), smoothstep(0.82, 1., band2) * 0.6);
          col = mix(col, vec3(0.9, 0.82, 0.35), smoothstep(0.9, 1., band * band2) * 0.5);
          vec3 c3 = floor(q * 7.); vec3 f3 = fract(q * 7.) - .5; float st = step(0.9, h(c3)); float glow = st * smoothstep(0.42, 0.0, length(f3)); float ring = st * smoothstep(0.05, 0., abs(length(f3) - 0.3));
          col += vec3(1., 0.9, 0.45) * (glow * 1.4 + ring * 0.6);
          col *= smoothstep(-0.05, 0.25, d.y) * 0.7 + 0.3;
          gl_FragColor = vec4(col, 1.);
          #include <colorspace_fragment>
        }` });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(120, 48, 24, 0, PI * 2, 0, PI * 0.55), sky); dome.position.set(W / 2, -2, 0); dome.renderOrder = -1; g.add(dome);
    const lv = new THREE.Vector3(); let spin = 0, dwell = 0, prev = new THREE.Vector3(), got = false;
    c.tick((t, dt, P, ri) => { dome.visible = here(r, ri); if (!dome.visible) return; c.camera.getWorldDirection(lv); sky.uniforms.uLook.value.lerp(lv, Math.min(1, dt * 1.5)); dwell = lv.distanceTo(prev) < dt * 0.4 ? dwell + dt : Math.max(0, dwell - dt * 2); prev.copy(lv); spin += ((0.15 + Math.min(dwell, 6) / 6 * 0.85) - spin) * Math.min(1, dt * 0.8); sky.uniforms.uSpin.value = spin; sky.uniforms.uT.value = t; if (dwell > 4 && lv.y > 0.2 && !got) { got = true; c.egg('vortex', 'The sky turns wherever you look, and the longer you stare the faster it goes. He wrote that the sight of the stars always made him dream. Here the stars dream back.'); } });
    c.glb('ts_cypress', { h: 5.6, x: 4.4, z: -4.8, parent: g }); c.post(X(4.4), -4.8, 0.7);
    const cy = new THREE.Mesh(new THREE.BoxGeometry(1.4, 5.6, 1.4), new THREE.MeshBasicMaterial({ visible: false })); cy.position.set(4.4, 2.8, -4.8); g.add(cy);
    c.clickable(cy, () => c.egg('cypress', 'In his letters he wrote that the cypresses were always on his mind, beautiful as an Egyptian obelisk. The Empire State in the plate is doing its best impression.'), 'A painted cypress');
    const lamp = cardboard(c, g, 'DUMBO\nDOWN UNDER THE MANHATTAN\nBRIDGE OVERPASS', 15.4, 1.3, -4.6, -0.4, 1.3);
    c.clickable(lamp, () => c.egg('dumbo', 'The name was coined by residents in the late 1970s, reportedly to sound dull enough to keep developers away. It did not work.'), 'A sign');
    walkers(c, g, 6, { x1: 2.4, x2: 17.6, z1: 0.6, z2: 6.6, pool: 'night' });
  },

  // GALLERY 9 A. The Four Seasons corridor and the curtain that dined there for fifty five years. The trick: step onto the
  // bronze medallion under the curtain and you see the room from several places at once.
  picasso_a(c, r, g, X) {
    const { THREE } = c;
    const ct = c.tex.load('assets/walls/picasso_a.jpg'); ct.colorSpace = THREE.SRGBColorSpace;
    const cg = new THREE.PlaneGeometry(9, 5.2, 40, 10), cp = cg.attributes.position, cb = Float32Array.from(cp.array);
    const curtain = new THREE.Mesh(cg, new THREE.MeshStandardMaterial({ map: ct, roughness: 0.9, side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: ct, emissiveIntensity: 0.18 })); curtain.position.set(10, 2.75, -4.2); g.add(curtain); c.wall(X(5.5), -4.2, X(14.5), -4.2);
    g.add(c.slab(9.4, 0.12, 0.12, std(c, 0xb08840, { metalness: 1, roughness: 0.3 }), 10, 5.4, -4.2));
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; const L = local(r, P); for (let i = 0; i < cp.count; i++) { const x = cb[i * 3], y = cb[i * 3 + 1], dd = Math.hypot(L.x - 10 - x, L.z + 4.2); cp.setZ(i, Math.sin(x * 1.6 + t * 0.7) * 0.06 * (1.3 - y / 5.2) + Math.max(0, 1.6 - dd) * 0.12 * (0.5 - y / 5.2)); } cp.needsUpdate = true; });
    const med = decal(c, 1.4, 1.4, (q, w, h) => { const gr = q.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2); gr.addColorStop(0, '#e8c070'); gr.addColorStop(1, '#8a6020'); q.fillStyle = gr; q.beginPath(); q.arc(w / 2, h / 2, w * 0.48, 0, 7); q.fill(); q.strokeStyle = '#5a3a10'; q.lineWidth = 6; for (let i = 0; i < 6; i++) { q.beginPath(); q.moveTo(w / 2, h / 2); q.lineTo(w / 2 + Math.cos(i * 1.05) * w * 0.46, h / 2 + Math.sin(i * 1.05) * w * 0.46); q.stroke(); } });
    med.rotation.x = -PI / 2; med.position.set(10, 0.013, 1.6); g.add(med);
    let got = false;
    fxWhile(c, r, 'facet', (t, dt, P) => near(r, P, 10, 1.6, 0.75));
    c.tick((t, dt, P, ri) => { if (!got && here(r, ri) && near(r, P, 10, 1.6, 0.75)) { got = true; c.sound.chords(6); c.egg('facets', 'On the medallion you see the corridor from several places at once, which is how he and Braque painted a guitar around 1910. The curtain itself is from a 1919 ballet, Le Tricorne; it hung here from 1959 until 2014, when it was moved out, to some fuss, and went to the New York Historical Society.'); } });
    // the dining room: tables, a waiter, the chain curtains at the windows
    const cloth = std(c, 0xf4f0e6, { roughness: 0.8 }); [[3.2, 1.0], [16.8, 1.0], [3.2, -2.4]].forEach(([x, z]) => { g.add(c.slab(1.1, 0.04, 1.1, cloth, x, 0.76, z)); g.add(c.slab(0.12, 0.74, 0.12, std(c, 0x3a2a1a), x, 0.37, z)); c.post(X(x), z, 0.7); });
    const waiter = extra(c, g, 15.2, -1.4, { col: 0xf4f0e6, ry: -0.8 }); c.post(X(15.2), -1.4, 0.3);
    c.clickable(waiter, () => c.say(waiter, 'Your table is ready. The curtain was here first.', 2600, 2.0), 'The waiter');
    const chains = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.006, 0.006, 5.6, 4), std(c, 0xc8a050, { metalness: 1, roughness: 0.25 }), 160); const o = new THREE.Object3D();
    for (let i = 0; i < 160; i++) { const side = i < 80, k = i % 80; o.position.set(side ? 0.4 : W - 0.4, 2.8, -7.6 + k * 0.11); o.updateMatrix(); chains.setMatrixAt(i, o.matrix); } g.add(chains);
    c.clickable(curtain, () => c.egg('tricorne', 'Picasso painted it in 1919 for Diaghilev\'s ballet. He never went to America. The curtain did, and spent fifty five years watching people eat lunch.'), 'Le Tricorne');
    walkers(c, g, 4, { x1: 2.4, x2: 17.6, z1: 2.0, z2: 6.6, pool: 'dressy' });
  },

  // GALLERY 9 B. Rockefeller Plaza, cubed. The trick: a skyline of sixty prisms; one face of each is a slice of a face seen
  // from the front, the other a slice of it in profile. Walk three metres and the head turns. Nothing turns but you.
  picasso_b(c, r, g, X) {
    const { THREE } = c;
    const drawFace = (q, w, h, profile) => {
      q.fillStyle = profile ? '#c89a5a' : '#d8b878'; q.fillRect(0, 0, w, h);
      for (let i = 0; i < 14; i++) { q.fillStyle = ['#8a6a3a', '#5a6a5a', '#b08850', '#3a3a3a'][i % 4]; q.globalAlpha = 0.35; q.beginPath(); q.moveTo(Math.random() * w, Math.random() * h); q.lineTo(Math.random() * w, Math.random() * h); q.lineTo(Math.random() * w, Math.random() * h); q.fill(); } q.globalAlpha = 1;
      if (!profile) { eyeFlower(q, w * 0.5, h * 0.42, w * 0.28); q.strokeStyle = '#1a1a1a'; q.lineWidth = w * 0.012; q.beginPath(); q.moveTo(w * 0.5, h * 0.62); q.lineTo(w * 0.5, h * 0.95); q.moveTo(w * 0.3, h * 0.8); q.lineTo(w * 0.7, h * 0.8); q.stroke(); }
      else { q.save(); q.translate(w * 0.5, h * 0.42); q.scale(0.32, 1); eyeFlower(q, 0, 0, w * 0.28 / 0.32 * 0.32 * 3); q.restore(); q.fillStyle = '#1d4ed8'; q.beginPath(); q.ellipse(w * 0.62, h * 0.42, w * 0.05, h * 0.06, 0, 0, 7); q.fill(); q.strokeStyle = '#1a1a1a'; q.lineWidth = w * 0.012; q.beginPath(); q.moveTo(w * 0.5, h * 0.62); q.lineTo(w * 0.44, h * 0.95); q.stroke(); }
      q.strokeStyle = '#1a1a1a'; q.lineWidth = w * 0.006; for (let i = 0; i < 9; i++) { q.beginPath(); q.moveTo(Math.random() * w, 0); q.lineTo(Math.random() * w, h); q.stroke(); }
    };
    const A = c.canvasTex(1024, 1024, (q, w, h) => drawFace(q, w, h, false)), B = c.canvasTex(1024, 1024, (q, w, h) => drawFace(q, w, h, true));
    const NP = 60, x1 = 5, x2 = 15, PH = 3.4, dw = (x2 - x1) / NP, zc = -3.2;
    const mA = new THREE.MeshStandardMaterial({ map: A, roughness: 0.7 }), mB = new THREE.MeshStandardMaterial({ map: B, roughness: 0.7 }), mTop = std(c, 0x6a6a6a, { roughness: 0.7 });
    for (let i = 0; i < NP; i++) {
      const cx = x1 + (i + 0.5) * dw, u0 = i / NP, u1 = (i + 1) / NP, sky = PH + Math.abs(Math.sin(i * 1.7)) * 1.6 + (i % 7 === 3 ? 1.8 : 0), top = PH + 0.3;
      // a triangular prism: apex toward the visitor; left face carries the front view, right face the profile
      for (const [mat, sgn] of [[mA, -1], [mB, 1]]) {
        const geo = new THREE.BufferGeometry(), xa = cx + sgn * dw / 2, za = zc, xb = cx, zb = zc + dw * 0.5;
        const p = [xa, 0.3, za, xb, 0.3, zb, xb, top, zb, xa, 0.3, za, xb, top, zb, xa, top, za];
        const uvT = 1, ua = sgn < 0 ? u0 : u1, ub = (u0 + u1) / 2;
        const uv = sgn < 0 ? [ua, 0, ub, 0, ub, uvT, ua, 0, ub, uvT, ua, uvT] : [ua, 0, ub, 0, ub, uvT, ua, 0, ub, uvT, ua, uvT];
        geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.computeVertexNormals();
        const m = new THREE.Mesh(geo, mat); m.material.side = THREE.DoubleSide; g.add(m);
      }
      g.add(c.slab(dw * 0.9, sky - PH, dw * 0.45, mTop, cx, top + (sky - PH) / 2, zc + dw * 0.22));
    }
    g.add(c.slab(x2 - x1 + 0.4, 0.3, 0.8, std(c, 0x3a3a3a, { roughness: 0.5 }), 10, 0.15, zc + 0.1)); c.wall(X(x1 - 0.2), zc + 0.5, X(x2 + 0.2), zc + 0.5); c.wall(X(x1 - 0.2), zc - 0.3, X(x1 - 0.2), zc + 0.5); c.wall(X(x2 + 0.2), zc - 0.3, X(x2 + 0.2), zc + 0.5);
    const seen = { a: false, b: false }; let got = false;
    c.tick((t, dt, P, ri) => { if (!here(r, ri) || got) return; const L = local(r, P); if (L.z > -1 && looking(c, r, 10, zc, 0.85)) { if (L.x < 8) seen.a = true; if (L.x > 12) seen.b = true; if (seen.a && seen.b) { got = true; c.egg('profile', 'You walked past the skyline and the head turned from front to profile. Nothing moved. Cubism put both views on one canvas; this puts them on one building and lets your feet choose.'); } } });
    notice(c, g, 'WALK ACROSS · THE HEAD TURNS', 10, 0.55, zc + 0.52, 0, 2.4, 0.22, '#f4ead2', '#3a2a1a');
    c.glb('ts_guitar', { h: 1.6, x: 16.8, z: -5.4, ry: -0.5, parent: g }); g.add(c.slab(0.9, 0.5, 0.9, std(c, 0xd8d0c0), 16.8, 0.25, -5.4)); c.post(X(16.8), -5.4, 0.6);
    const gt = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), new THREE.MeshBasicMaterial({ visible: false })); gt.position.set(16.8, 1.3, -5.4); g.add(gt);
    c.clickable(gt, () => c.egg('guitar', 'He made a guitar out of cardboard in 1912 and then out of sheet metal in 1914. He gave the metal one to MoMA in 1971. It is ten blocks from here.'), 'A sheet metal guitar');
    const tree = new THREE.Group(); tree.position.set(3.0, 0, -5.0); g.add(tree); for (let k = 0; k < 6; k++) { const cn = new THREE.Mesh(new THREE.ConeGeometry(1.4 - k * 0.2, 1.2, 4), std(c, [0x2a5a3a, 0x3a6a2a, 0x1a4a3a][k % 3], { flatShading: true })); cn.position.y = 0.8 + k * 0.85; cn.rotation.y = k * 0.4; tree.add(cn); } c.post(X(3), -5, 1.0);
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.3), std(c, 0xf4d020, { emissive: 0xf4d020, emissiveIntensity: 0.6, flatShading: true })); star.position.set(3, 6.0, -5); g.add(star);
    c.clickable(star, () => c.egg('guernica', 'Guernica spent over forty years in New York, mostly at MoMA, until it went to Spain in 1981 as he had asked. He never visited the United States.'), 'A cubed star');
    walkers(c, g, 6, { x1: 2.4, x2: 17.6, z1: 0.6, z2: 6.6 });
  },

  // GALLERY 10 A. Central Park, October 12, 2013: a stall of signed canvases at sixty dollars. The trick: the hollow eye.
  // The big eye on the stall is a bowl, not a ball, and so it follows you wherever you walk. Also: buy one.
  banksy_a(c, r, g, X) {
    const { THREE } = c;
    const tbl = std(c, 0x1a1a1a, { roughness: 0.6 }); g.add(c.slab(3.6, 0.05, 0.9, tbl, 6.0, 0.76, -3.0)); for (const dx of [-1.7, 1.7]) g.add(c.slab(0.05, 0.74, 0.05, tbl, 6.0 + dx, 0.37, -3.0)); c.wall(X(4.2), -2.55, X(7.8), -2.55); c.wall(X(4.2), -3.45, X(7.8), -3.45);
    const stamps = ['RAT', 'BALLOON', 'CHILD', 'COP', 'MONKEY', 'FLOWER'];
    const canv = stamps.map((s, k) => { const t = c.canvasTex(128, 128, (q, w, h) => { q.fillStyle = '#f4f0e6'; q.fillRect(0, 0, w, h); q.fillStyle = '#111'; q.font = '900 16px Arial'; q.textAlign = 'center'; if (s === 'BALLOON') { q.fillStyle = '#c8102e'; q.beginPath(); q.moveTo(w * 0.7, h * 0.3); q.bezierCurveTo(w * 0.9, h * 0.1, w * 0.5, h * 0.05, w * 0.7, h * 0.3); q.arc(w * 0.66, h * 0.25, w * 0.1, 0, 7); q.fill(); q.fillStyle = '#111'; q.fillRect(w * 0.3, h * 0.55, w * 0.1, h * 0.35); } else { eyeFlower(q, w / 2, h * 0.45, w * 0.3); } q.fillStyle = '#111'; q.fillText(s, w / 2, h * 0.92); }); const m = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 })); m.position.set(4.6 + k * 0.56, 0.98, -3.0); m.rotation.x = -0.9; g.add(m); return m; });
    const sign = cardboard(c, g, 'SPRAY ART\n$60', 8.4, 1.3, -3.2, -0.3, 0.8);
    let sold = 0;
    canv.forEach((m, k) => c.clickable(m, () => { if (m.userData.sold) return; m.userData.sold = true; sold++; m.visible = false; c.sound.ticket(); c.toast(sold === 1 ? 'Sold. Sixty dollars. You are a collector.' : `Sold. That is ${sold} of the day.`, 2600); if (sold === 1) c.egg('buy', 'On October 12, 2013, an unmarked stall by Central Park sold his signed canvases for sixty dollars. Over the day three buyers took eight and the till came to 420 dollars, one after haggling half off. Most people walked past.'); }, 'Buy a canvas, $60'));
    const vendor = extra(c, g, 6.0, -4.2, { seated: true, col: 0x4a3a2a, ry: 0 }); c.post(X(6), -4.2, 0.4);
    c.clickable(vendor, () => c.say(vendor, 'Sixty each. Cash. No, I do not know who made them.', 2800, 1.5), 'The vendor');
    // the hollow eye: a bowl seen from inside, painted like a ball, with its iris at the deepest point
    const eyeT = c.canvasTex(256, 256, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0b1020'); gr.addColorStop(0.07, '#0b1020'); gr.addColorStop(0.08, '#1d4ed8'); gr.addColorStop(0.2, '#22d3ee'); gr.addColorStop(0.24, '#f4f4f4'); gr.addColorStop(1, '#e8e4dc'); q.fillStyle = gr; q.fillRect(0, 0, w, h); });
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.55, 40, 20, 0, PI * 2, 0, PI / 2), new THREE.MeshStandardMaterial({ map: eyeT, side: THREE.BackSide, roughness: 0.35 })); bowl.rotation.x = -PI / 2; bowl.position.set(11.4, 1.8, -4.6); g.add(bowl);
    const pet = decal(c, 2.4, 2.4, (q, w, h) => { for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; q.save(); q.translate(w / 2, h / 2); q.rotate(a); const gr = q.createLinearGradient(0, 0, w * 0.5, 0); gr.addColorStop(0.45, '#ffffff'); gr.addColorStop(1, '#ff4fa3'); q.fillStyle = gr; q.beginPath(); q.ellipse(w * 0.33, 0, w * 0.17, w * 0.09, 0, 0, 7); q.fill(); q.restore(); } q.globalCompositeOperation = 'destination-out'; q.beginPath(); q.arc(w / 2, h / 2, w * 0.23, 0, 7); q.fill(); });
    pet.position.set(11.4, 1.8, -4.6 + 0.01); g.add(pet); g.add(c.slab(2.6, 2.6, 0.1, std(c, 0xf4f0e6, { roughness: 0.9 }), 11.4, 1.8, -4.66)); c.post(X(11.4), -4.6, 0.6);
    const bl = new THREE.PointLight(0xfff0d8, 2.5, 3); bl.position.set(11.4, 0.9, -3.6); g.add(bl);
    let got = false; c.tick((t, dt, P, ri) => { if (!here(r, ri) || got) return; const L = local(r, P); if (looking(c, r, 11.4, -4.6, 0.95) && Math.abs(L.x - 11.4) > 3) { got = true; c.egg('hollow', 'The eye on the canvas follows you because it is hollow: a bowl painted like a ball. Your brain refuses concave faces and flips it, and a flipped hollow seems to turn as you move. Nobody at the real stall looked twice; this one looks at everyone.'); } });
    walkers(c, g, 8, { x1: 2.4, x2: 17.6, z1: -0.6, z2: 6.6 });
  },

  // GALLERY 10 B. The Meatpacking District, October 2013, after dark. The trick: a torch. The stencils on these walls only
  // exist inside your beam: a shader on every one of them checks whether it is lit by the cone from your eyes.
  banksy_b(c, r, g, X) {
    const { THREE } = c;
    const torch = new THREE.SpotLight(0xfff2d8, 0, 28, 0.34, 0.5, 1.1); torch.position.set(0, -40, 0); c.scene.add(torch); c.scene.add(torch.target); g.add(new THREE.Object3D());
    const camPos = { value: new THREE.Vector3() }, camDir = { value: new THREE.Vector3(0, 0, -1) };
    const stencil = (draw, w, h, x, y, z, ry) => {
      const t = c.canvasTex(256, Math.round(256 * h / w), (q, W2, H2) => { q.clearRect(0, 0, W2, H2); draw(q, W2, H2); });
      const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { map: { value: t }, uCam: camPos, uDir: camDir }, toneMapped: false,
        vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: `uniform sampler2D map; uniform vec3 uCam, uDir; varying vec2 vUv; varying vec3 vW; void main(){ vec4 c = texture2D(map, vUv); vec3 d = normalize(vW - uCam); float k = smoothstep(0.93, 0.975, dot(d, normalize(uDir))) * smoothstep(20., 6., distance(vW, uCam)); gl_FragColor = vec4(c.rgb * (0.4 + 0.8 * k), c.a * k);
          #include <colorspace_fragment>
        }` });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); mesh.position.set(x, y, z); mesh.rotation.y = ry; mesh.renderOrder = 2; g.add(mesh); return mesh;
    };
    const rat = (q, w, h) => { q.fillStyle = '#0a0a0a'; q.beginPath(); q.ellipse(w * 0.45, h * 0.6, w * 0.25, h * 0.15, 0, 0, 7); q.fill(); q.beginPath(); q.arc(w * 0.72, h * 0.52, w * 0.09, 0, 7); q.fill(); q.lineWidth = 6; q.strokeStyle = '#0a0a0a'; q.beginPath(); q.moveTo(w * 0.2, h * 0.62); q.quadraticCurveTo(w * 0.05, h * 0.9, w * 0.25, h * 0.92); q.stroke(); q.fillStyle = '#c8102e'; q.fillRect(w * 0.78, h * 0.2, w * 0.05, h * 0.3); };
    const child = (q, w, h) => { q.fillStyle = '#0a0a0a'; q.beginPath(); q.arc(w * 0.3, h * 0.3, w * 0.08, 0, 7); q.fill(); q.fillRect(w * 0.25, h * 0.38, w * 0.1, h * 0.35); q.fillRect(w * 0.24, h * 0.72, w * 0.05, h * 0.22); q.fillRect(w * 0.32, h * 0.72, w * 0.05, h * 0.22); q.strokeStyle = '#0a0a0a'; q.lineWidth = 3; q.beginPath(); q.moveTo(w * 0.35, h * 0.45); q.lineTo(w * 0.7, h * 0.18); q.stroke(); q.fillStyle = '#c8102e'; q.beginPath(); q.moveTo(w * 0.72, h * 0.22); q.bezierCurveTo(w * 0.9, h * 0.02, w * 0.6, h * 0.0, w * 0.72, h * 0.18); q.arc(w * 0.7, h * 0.12, w * 0.08, 0, 7); q.fill(); };
    const words = (txt) => (q, w, h) => { q.fillStyle = '#f4f0e6'; q.font = `900 ${h * 0.4}px ${c.MONO}`; q.textAlign = 'center'; q.fillText(txt, w / 2, h * 0.62); };
    const STEN = [[rat, 1.4, 1.0, 0.16, 1.2, -3.0, PI / 2], [child, 1.6, 2.0, 0.16, 1.6, 2.0, PI / 2], [rat, 1.2, 0.9, W - 0.41, 0.9, -1.0, -PI / 2], [child, 1.6, 2.0, W - 0.41, 1.8, -5.2, -PI / 2], [words('BETTER OUT THAN IN'), 4.0, 0.7, 10, 4.6, D / 2 - 0.16, PI], [words('COUNTED IN THE DARK'), 3.6, 0.6, 0.16, 4.2, -5.6, PI / 2], [rat, 1.0, 0.7, 6.5, 0.02, 1.5, 0]];
    const meshes = STEN.map(([f, w, h, x, y, z, ry]) => { const m = stencil(f, w, h, x, y, z, ry); if (ry === 0 && y < 0.1) m.rotation.x = -PI / 2; return m; });
    let found = new Set(), got = false;
    c.tick((t, dt, P, ri) => {
      const on = here(r, ri); torch.intensity = on ? 140 : 0; if (!on) { torch.position.set(0, -40, 0); return; }
      c.camera.getWorldPosition(camPos.value); c.camera.getWorldDirection(camDir.value);
      torch.position.copy(camPos.value).add(new THREE.Vector3(0.2, -0.25, 0)); torch.target.position.copy(camPos.value).addScaledVector(camDir.value, 6);
      meshes.forEach((m, k) => { const wp = m.getWorldPosition(new THREE.Vector3()); if (wp.clone().sub(camPos.value).normalize().dot(camDir.value) > 0.96 && wp.distanceTo(camPos.value) < 14) found.add(k); });
      if (found.size >= 4 && !got) { got = true; c.egg('torch', 'The stencils here only exist in your torch. In October 2013 he put one new piece a day on the streets of New York for a month, Better Out Than In, and the city spent every night hunting for them with phones.'); }
    });
    // the truck: slatted sides, plush animals peering out, squeaking when you are near
    const truckM = std(c, 0x8a8478, { roughness: 0.8, metalness: 0.3 }), slatM = std(c, 0x5a544a, { roughness: 0.8 });
    g.add(c.slab(2.4, 0.5, 6.4, std(c, 0x1a1a1a), 13.6, 0.55, -2.6)); g.add(c.slab(2.4, 2.2, 1.6, truckM, 13.6, 1.5, 1.4));
    for (let k = 0; k < 7; k++) { g.add(c.slab(0.06, 0.16, 5.0, slatM, 12.42, 1.0 + k * 0.32, -3.1)); g.add(c.slab(0.06, 0.16, 5.0, slatM, 14.78, 1.0 + k * 0.32, -3.1)); }
    g.add(c.slab(2.4, 0.06, 5.0, truckM, 13.6, 3.2, -3.1)); g.add(c.slab(2.4, 2.4, 0.06, truckM, 13.6, 2.0, -5.6));
    for (const [wx, wz] of [[12.4, 0.6], [14.8, 0.6], [12.4, -4.6], [14.8, -4.6]]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 20), std(c, 0x111111)); wh.rotation.z = PI / 2; wh.position.set(wx, 0.42, wz); g.add(wh); }
    c.wall(X(12.3), -5.7, X(12.3), 2.2); c.wall(X(14.9), -5.7, X(14.9), 2.2); c.wall(X(12.3), 2.2, X(14.9), 2.2); c.wall(X(12.3), -5.7, X(14.9), -5.7);
    const lambs = []; for (let k = 0; k < 10; k++) { const m = c.glb('ts_lamb', { h: 0.55, x: 12.9 + (k % 2) * 1.4, y: 0.8, z: -5.0 + Math.floor(k / 2) * 0.95, ry: (k % 2 ? -PI / 2 : PI / 2), parent: g, shadow: false }); lambs.push(m); }
    const lambHit = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.4, 5.2), new THREE.MeshBasicMaterial({ visible: false })); lambHit.position.set(13.6, 1.8, -3.0); g.add(lambHit);
    c.clickable(lambHit, () => { c.sound.squeak(); c.egg('sirens', 'Sirens of the Lambs, October 11, 2013: a slaughterhouse truck full of squealing stuffed animals, driven through the Meatpacking District and then around the city. The animals were puppets, worked from inside.'); }, 'The truck');
    let sq = 0; c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; lambs.forEach((m, k) => { m.rotation.z = Math.sin(t * 3 + k) * 0.08; m.position.y = 0.8 + Math.abs(Math.sin(t * 2.2 + k * 1.3)) * 0.05; }); sq -= dt; if (sq < 0 && near(r, P, 13.6, -2, 4)) { sq = 1.4 + Math.random(); c.sound.squeak(); } });
    walkers(c, g, 3, { x1: 2.4, x2: 10, z1: 0.6, z2: 6.6, pool: 'night' });
  },
};


// ---------- room C, THE SHOW ----------
// Each gallery's third room is a real New York exhibition of the artist rebuilt as a hall whose only job is the hang:
// twenty eight of MLow's restyled New Yorkers at eye height, each under a picture light with a label, two freestanding
// partitions, a bench, and on the south wall THE VAULT: every piece made in that style (about 220) as one clickable
// mosaic. Then one trick in the architecture that makes the hang better, never hides it.
const EXW = W - 0.39;   // the face of the shared east wall
// each hall's own architecture: freestanding walls as polylines (local x, z). Walls are 0.3 thick and 3.2 high, and the
// hang runs along them, a piece per segment per side. Kept clear: the side doors (z 2 to 5.6), the story aisle (x 2.2 to
// 3.8), the vault, the hero plinth at (10, -5.5) and whatever each hall's exhibit needs.
const oct = (cx, cz, r, from, to, n) => { const P = []; for (let i = 0; i <= n; i++) { const a = (from + (to - from) * i / n) * PI / 180; P.push([cx + r * Math.sin(a), cz + r * Math.cos(a)]); } return P; };
const curve = (x0, x1, n, f) => { const P = []; for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; P.push([x, f(x)]); } return P; };
const PARTS = {
  kusama_c: [{ pts: oct(10, -1.5, 3.6, 205, 335, 3) }, { pts: oct(10, -1.5, 3.6, 25, 155, 3) }],
  basquiat_c: [{ pts: [[5.2, -6.0], [6.7, -3.3], [5.2, -0.6], [6.4, 1.7]] }, { pts: [[14.8, -5.4], [13.3, -2.8], [14.8, -0.2], [13.6, 1.7]] }],
  haring_c: [{ pts: [[6.4, -3.9], [8.2, -0.7], [10.0, -3.9], [11.8, -0.7], [13.6, -3.9]] }],
  hokusai_c: [{ pts: curve(5.8, 14.2, 7, (x) => -2.0 + 1.9 * Math.sin((x - 5.8) / 8.4 * PI * 2)) }],
  lichtenstein_c: [{ pts: oct(10, -1.5, 3.4, 40, 320, 7) }],
  dali_c: [{ pts: curve(-5.6, 1.6, 6, (z) => 5.6 + Math.sin(z * 1.4) * 0.7).map(([z, x]) => [x, z]) }],
  warhol_c: [{ pts: [[6.2, -3.6], [8.8, -3.6]] }, { pts: [[11.2, -3.6], [13.8, -3.6]] }, { pts: [[6.2, -0.4], [8.8, -0.4]] }, { pts: [[11.2, -0.4], [13.8, -0.4]] }],
  picasso_c: [{ pts: [[6.0, -3.2], [7.8, -4.4]] }, { pts: [[12.2, -4.4], [14.0, -3.2]] }, { pts: [[6.2, -1.6], [7.4, 0.2]] }, { pts: [[12.6, 0.2], [13.8, -1.6]] }, { pts: [[8.6, 1.5], [10.0, 0.6]] }, { pts: [[10.0, -2.4], [11.6, -1.4]] }],
  banksy_c: [{ pts: [[7.0, -4.4], [6.8, 0.8]] }, { pts: [[10.0, -4.0], [10.2, 0.6]] }, { pts: [[13.0, -4.4], [13.25, 0.8]] }],
};
function partSlots(id, y) {
  const S = [];
  for (const L of PARTS[id] || []) for (let i = 0; i < L.pts.length - 1; i++) { const [x1, z1] = L.pts[i], [x2, z2] = L.pts[i + 1], len = Math.hypot(x2 - x1, z2 - z1); if (len < 1.3) continue;
    const nx = -(z2 - z1) / len, nz = (x2 - x1) / len, w = Math.min(1.3, len - 0.55), mx = (x1 + x2) / 2, mz = (z1 + z2) / 2;
    for (const sd of [1, -1]) S.push({ x: mx + nx * sd * 0.29, y, z: mz + nz * sd * 0.29, ry: Math.atan2(nx * sd, nz * sd), w }); }
  return S;
}
function partWalls(c, r, g, X, pm) {
  for (const L of PARTS[r.id] || []) for (let i = 0; i < L.pts.length - 1; i++) { const [x1, z1] = L.pts[i], [x2, z2] = L.pts[i + 1], len = Math.hypot(x2 - x1, z2 - z1), a = Math.atan2(z2 - z1, x2 - x1);
    const w = c.slab(len + 0.3, 3.2, 0.3, pm, (x1 + x2) / 2, 1.6, (z1 + z2) / 2); w.rotation.y = -a; g.add(w);
    const cap = c.slab(len + 0.32, 0.06, 0.34, std(c, 0x1a1a1a, { roughness: 0.4 }), (x1 + x2) / 2, 3.23, (z1 + z2) / 2); cap.rotation.y = -a; g.add(cap);
    c.wall(X(x1), z1, X(x2), z2); }
}
function showSlots(o = {}) {
  const S = [], y = o.y || 1.72, south = D / 2 - 0.14;
  for (const x of [1.5, 3.7, 16.3, 18.5]) S.push({ x, y, z: south, ry: PI, w: 1.15 });
  for (const z of [-6.4, -3.9, -1.4]) { S.push({ x: 0.14, y, z, ry: PI / 2, w: 1.45 }); S.push({ x: EXW, y, z, ry: -PI / 2, w: 1.45 }); }
  S.push({ x: 0.14, y, z: 6.85, ry: PI / 2, w: 0.95 }); S.push({ x: EXW, y, z: 6.85, ry: -PI / 2, w: 0.95 });
  S.push({ x: 1.45, y, z: -D / 2 + 0.14, ry: 0, w: 1.0 }); S.push({ x: 18.0, y, z: -D / 2 + 0.14, ry: 0, w: 1.5 });
  if (o.id && PARTS[o.id]) S.push(...partSlots(o.id, y));
  else if (o.partitions !== false) for (const px of (o.parts || [6, 14])) for (const side of [-1, 1]) for (const z of [-3.3, -1.5, 0.3]) S.push({ x: px + side * 0.29, y, z, ry: side * PI / 2, w: 1.2 });
  return S;
}
function showHall(c, r, g, X, mats, { partitions = true, parts = [6, 14], vaultW = 9.6, bench = true, title = true } = {}) {
  const { THREE } = c;
  if (partitions && PARTS[r.id]) partWalls(c, r, g, X, mats.part || std(c, 0xf4f2ee, { roughness: 0.85 }));
  else if (partitions) {
    const pm = mats.part || std(c, 0xf4f2ee, { roughness: 0.85 });
    r.parts = parts;
    for (const px of parts) {
      g.add(c.slab(0.3, 3.4, 6.2, pm, px, 1.7, -1.5)); c.wall(X(px - 0.15), -4.6, X(px - 0.15), 1.6); c.wall(X(px + 0.15), -4.6, X(px + 0.15), 1.6);
      g.add(c.slab(0.34, 0.06, 6.24, std(c, 0x1a1a1a, { roughness: 0.4 }), px, 3.43, -1.5));
    }
  }
  if (bench) { const lea = std(c, 0x1c1814, { roughness: 0.45 }); g.add(c.slab(2.4, 0.12, 0.6, lea, 10, 0.46, 2.6)); for (const k of [-1, 1]) g.add(c.slab(0.08, 0.42, 0.5, std(c, 0x8a8a8a, { metalness: 1, roughness: 0.3 }), 10 + k * 1.05, 0.21, 2.6)); c.post(X(10), 2.6, 1.0); }
  if (title && r.plate) {
    const t = c.sign(`${(ARTIST_C[r.g] || '').toUpperCase()}  ·  ${r.name.toUpperCase()}`, { w: 9, h: 0.5, bg: null, fg: r.titleCol || '#1a1a1a', font: c.SERIF, weight: 900, px: 128 });
    t.position.set(W / 2, PORTAL.h + 0.6, -D / 2 + 0.02); g.add(t);
    const s = c.sign(r.film.toUpperCase() + '  ·  NEW YORKERS BY MLOW', { w: 6, h: 0.16, bg: null, fg: r.titleCol || '#3a3a3a', font: c.MONO, weight: 700, px: 96 });
    s.position.set(W / 2, PORTAL.h + 0.22, -D / 2 + 0.02); g.add(s);
  }
  vaultWall(c, r, g, W / 2, D / 2 - 0.13, PI, vaultW);
  if (STORY[r.g]) storyLine(c, r, g, X, STORY[r.g]);
  downlights(c, r, g, { nx: 5, nz: 3 });
  visitors(c, r, g, X);
  if (SCULPT[r.id]) { const [name, x, z, o] = SCULPT[r.id]; plinthHero(c, r, g, X, name, { x, z, ...o }); }
}
const ARTIST_C = { kusama: 'Yayoi Kusama', basquiat: 'Jean-Michel Basquiat', haring: 'Keith Haring', hokusai: 'Hokusai', lichtenstein: 'Roy Lichtenstein', dali: 'Salvador Dali', warhol: 'Andy Warhol', vangogh: 'Vincent van Gogh', picasso: 'Pablo Picasso', banksy: 'Banksy' };
// THE VAULT: one atlas of every restyled piece in the style; the cell under the click opens that New Yorker
function vaultWall(c, r, g, x, z, ry, w) {
  const { THREE } = c, V = (window.VAULT || {})[r.g]; if (!V) return;
  const h = w * V.rows * 90 / (V.cols * 160), y0 = r.ceilH && r.ceilH < 5 ? 0.35 : 0.55;
  const t = c.tex.load(`assets/vault/atlas_${r.g}.jpg`); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, toneMapped: false, color: 0xe8e8e8 }));
  m.position.set(x, y0 + h / 2, z + 0.05 * Math.cos(ry)); m.rotation.y = ry; g.add(m);
  const fr = c.slab(w + 0.16, h + 0.16, 0.05, std(c, 0x111111, { metalness: 0.6, roughness: 0.35 }), x, y0 + h / 2, z); fr.rotation.y = ry; g.add(fr);
  const lab = c.sign(`THE VAULT  ·  ALL ${V.items.length} ${(ARTIST_C[r.g] || '').toUpperCase()} NEW YORKERS  ·  TOUCH ANY ONE`, { w: Math.min(w, 7), h: 0.2, bg: '#111', fg: '#f5c542', font: c.MONO, weight: 700, px: 96 });
  lab.position.set(x, y0 - 0.2, z + 0.06 * Math.cos(ry)); lab.rotation.y = ry; g.add(lab);
  const items = V.items.map(([n, tt, hh, f, i]) => ({ n, t: tt, h: hh, f, i, g: r.g, vault: true, ll: LABEL_C[r.g] || '' }));
  c.clickable(m, () => { const hit = c.lastHit; if (!hit || !hit.uv) return; const col = Math.min(V.cols - 1, Math.floor(hit.uv.x * V.cols)), row = Math.min(V.rows - 1, Math.floor((1 - hit.uv.y) * V.rows)), k = row * V.cols + col; if (items[k]) c.openPiece(items[k], items, k); }, 'The vault: open any New Yorker');
  r.vaultAt = [x, z - 3.6 * Math.cos(ry), ry === PI ? PI : 0];
  return m;
}
const LABEL_C = { kusama: "Portrait by MLow, restyled in Kusama's dots", basquiat: "Portrait by MLow, restyled in Basquiat's hand", haring: "Portrait by MLow, restyled in Haring's line", hokusai: 'Portrait by MLow, restyled as a Hokusai print', lichtenstein: "Portrait by MLow, restyled in Lichtenstein's dots", dali: 'Portrait by MLow, restyled through Dali', warhol: 'Portrait by MLow, restyled as a Warhol screen', vangogh: "Portrait by MLow, restyled in Van Gogh's colour", picasso: 'Portrait by MLow, restyled through Picasso', banksy: 'Portrait by MLow, restyled in stencil' };
// a plinth with a hero on it, front and centre before the plate
function plinthHero(c, r, g, X, name, { x = 10, z = -5.5, h = 1.0, ph = 0.8, pw = 1.3, ry = 0, egg, hint, len } = {}) {
  g.add(c.slab(pw, ph, pw * 0.7, std(c, 0xf2f0ea, { roughness: 0.7 }), x, ph / 2, z)); c.post(X(x), z, pw * 0.6);
  const m = c.glb(name, len ? { len, x, y: ph, z, ry, parent: g } : { h, x, y: ph, z, ry, parent: g });
  if (egg) c.clickable(m, () => c.egg(egg[0], egg[1]), hint);
  return m;
}
const ink = (c, w = 0.05) => std(c, 0x0d0d0d, { roughness: 0.5 });

Object.assign(SLOTS, {
  kusama_c: () => showSlots({ id: 'kusama_c' }), haring_c: () => showSlots({ id: 'haring_c' }), hokusai_c: () => showSlots({ id: 'hokusai_c' }), lichtenstein_c: () => showSlots({ id: 'lichtenstein_c' }).filter((q) => !(q.x === 18.0 && q.z < -7)),
  basquiat_c: () => showSlots({ id: 'basquiat_c' }).map((q) => (q.x === 18.0 && q.z < -7 ? { ...q, w: 3.0, y: 2.6 } : q)),
  dali_c: () => showSlots({ id: 'dali_c' }).map((q) => (q.x === EXW && (q.z === -3.9 || q.z === -1.4) ? { ...q, y: 2.6, z: q.z === -3.9 ? -4.05 : -1.25, w: 1.55 } : q)), warhol_c: () => showSlots({ id: 'warhol_c' }), picasso_c: () => showSlots({ id: 'picasso_c' }),
  banksy_c: () => showSlots({ y: 1.62, id: 'banksy_c' }).map((s, k) => ({ ...s, o: { frame: THRIFT[k % THRIFT.length] } })),
  // the Ames room hangs its own (see vangogh_c); the rest of the hall keeps the walls the room leaves free
  vangogh_c: () => { const S = [], y = 1.72; for (const x of [1.5, 3.7, 16.3, 18.5]) S.push({ x, y, z: D / 2 - 0.14, ry: PI, w: 1.15 }); for (const z of [-6.4, -3.9, -1.4]) S.push({ x: 0.14, y, z, ry: PI / 2, w: 1.45 }); S.push({ x: 0.14, y, z: 6.85, ry: PI / 2, w: 0.95 }); S.push({ x: EXW, y, z: 6.85, ry: -PI / 2, w: 0.95 }); S.push({ x: EXW, y, z: 0.4, ry: -PI / 2, w: 1.2 }); return S; },
});
// the thrift shop's frames: nothing matches, which is the point
const THRIFT = [{ c: 0xb8902e, m: 1, r: 0.35, d: 0.09, b: 0.1 }, { c: 0x6b4423, m: 0, r: 0.6, d: 0.06, b: 0.07 }, { c: 0xf0ece0, m: 0, r: 0.5, d: 0.05, b: 0.05 }, { c: 0x2a2a2a, m: 0.3, r: 0.4, d: 0.04, b: 0.03 },
  { c: 0x8a1a1a, m: 0, r: 0.5, d: 0.07, b: 0.09 }, { c: 0x9a9ea2, m: 1, r: 0.3, d: 0.04, b: 0.04 }, { c: 0x3a5a3a, m: 0, r: 0.6, d: 0.08, b: 0.12 }, { c: 0xd8b878, m: 0.2, r: 0.5, d: 0.1, b: 0.14 }];

Object.assign(ROOM, {
  // GALLERY 1 C. Aggregation: One Thousand Boats Show, Gertrude Stein Gallery, 1963: one rowboat sewn over with soft forms,
  // in a room papered with 999 photographs of it. Here the paper is the boat, the boat is in the middle, and the floor is a
  // mirror with red dots on it, so the hang goes down as far as it goes up. The plate is the bays repeating forever.
  kusama_c(c, r, g, X, mats) {
    const { THREE } = c;
    showHall(c, r, g, X, mats, { bench: false });
    if (!c.MOBILE) {
      const mir = new Reflector(new THREE.PlaneGeometry(W - 0.4, D - 0.4), { textureWidth: 1024, textureHeight: 820, color: 0x8a8a8a, clipBias: 0.003 });
      mir.rotation.x = -PI / 2; mir.position.set(W / 2, 0.004, 0); g.add(mir);
    } else g.add(c.slab(W - 0.4, 0.01, D - 0.4, std(c, 0x202020, { metalness: 0.9, roughness: 0.08 }), W / 2, 0.006, 0));
    // red dots on the mirror, so you can tell it is a floor
    const dm = new THREE.MeshBasicMaterial({ color: 0xd8102a, toneMapped: false }), dg = new THREE.CircleGeometry(1, 24), N = 140, dots = new THREE.InstancedMesh(dg, dm, N), o = new THREE.Object3D();
    let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < N; i++) { o.position.set(0.6 + rnd() * (W - 1.2), 0.012, -7.4 + rnd() * 14.8); o.rotation.set(-PI / 2, 0, 0); o.scale.setScalar(0.06 + rnd() * 0.22); o.updateMatrix(); dots.setMatrixAt(i, o.matrix); }
    g.add(dots);
    const boat = plinthHero(c, r, g, X, 'ts_softboat', { x: 10, z: -1.5, len: 3.4, ph: 0.55, pw: 3.6, ry: 0.3, hint: 'The soft boat',
      egg: ['thousandboats', 'Aggregation: One Thousand Boats Show, Gertrude Stein Gallery, 1963: one rowboat sewn over with soft white forms, in a room papered with 999 photographs of the same boat. One boat, no departures.'] });
    c.post(X(10), -1.5, 1.7);
    const wp = notice(c, g, '999 PHOTOGRAPHS OF ONE BOAT', 1.45, 3.2, -D / 2 + 0.03, 0, 1.6, 0.22);
    c.clickable(wp, () => c.egg('boatpaper', 'The 1963 room was papered with photographs of the boat in the middle of it. Repetition was the subject, not a printing accident.'), 'The wallpaper');
    // the Obliteration Room, in the east aisle: a white living room, and you are handed the dots
    const wh = std(c, 0xf6f6f2, { roughness: 0.55 }), ob = [];
    const add = (m) => { g.add(m); ob.push(m); return m; };
    add(c.slab(5.0, 0.02, 6.0, std(c, 0xffffff, { roughness: 0.9 }), 17.1, 0.012, -3.4));
    add(c.slab(1.6, 0.06, 0.9, wh, 16.6, 0.74, -3.4)); for (const [dx, dz] of [[-0.7, -0.38], [0.7, -0.38], [-0.7, 0.38], [0.7, 0.38]]) add(c.slab(0.06, 0.72, 0.06, wh, 16.6 + dx, 0.36, -3.4 + dz));
    for (const [x, z, ry] of [[15.5, -3.4, PI / 2], [17.7, -3.4, -PI / 2], [16.6, -4.3, 0]]) { const ch = new THREE.Group(); ch.position.set(x, 0, z); ch.rotation.y = ry; ch.add(c.slab(0.46, 0.05, 0.46, wh, 0, 0.46, 0)); ch.add(c.slab(0.46, 0.5, 0.05, wh, 0, 0.72, -0.21)); for (const [a2, b2] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) ch.add(c.slab(0.04, 0.46, 0.04, wh, a2, 0.23, b2)); g.add(ch); ch.traverse((o) => o.isMesh && ob.push(o)); }
    const sofa = new THREE.Group(); sofa.position.set(18.9, 0, -3.4); sofa.add(c.slab(0.9, 0.42, 2.2, wh, 0, 0.21, 0)); sofa.add(c.slab(0.25, 0.75, 2.2, wh, 0.33, 0.55, 0)); for (const s2 of [-1, 1]) sofa.add(c.slab(0.9, 0.58, 0.22, wh, 0, 0.29, s2 * 1.0)); g.add(sofa); sofa.traverse((o) => o.isMesh && ob.push(o)); c.post(X(18.9), -3.4, 1.0);
    const piano = new THREE.Group(); piano.position.set(15.0, 0, -6.6); piano.add(c.slab(1.5, 1.2, 0.6, wh, 0, 0.6, 0)); piano.add(c.slab(1.5, 0.06, 0.3, wh, 0, 0.74, 0.42)); g.add(piano); piano.traverse((o) => o.isMesh && ob.push(o)); c.post(X(15.0), -6.6, 0.8);
    const lamp = new THREE.Group(); lamp.position.set(18.9, 0, -5.4); lamp.add(c.slab(0.04, 1.5, 0.04, wh, 0, 0.75, 0)); const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 0.32, 20, 1, true), std(c, 0xffffff, { side: THREE.DoubleSide, emissive: 0xfff4e0, emissiveIntensity: 0.4 })); shade.position.y = 1.6; lamp.add(shade); g.add(lamp); lamp.traverse((o) => o.isMesh && ob.push(o));
    c.post(X(16.6), -3.4, 1.0);
    stickerRoom(c, r, g, X, ob);
    const hand = notice(c, g, 'TAKE A SHEET OF DOTS · STICK THEM ON ANYTHING WHITE', 17.1, 0.03, 0.2, -PI / 2, 2.4, 0.2, '#ffffff', '#d8102a');
    hand.rotation.set(-PI / 2, 0, -PI / 2); hand.position.set(14.6, 0.02, -3.4);
    const sc = notice(c, g, 'SOFT FORMS, SEWN BY HAND', 18.0, 3.2, -D / 2 + 0.03, 0, 1.6, 0.22);
    c.clickable(sc, () => c.egg('accumulation', 'She started sewing the soft forms onto furniture in 1962 and called the series Accumulation. A chair, a couch, a ladder, then a whole boat.'), 'A card');
  },

  // GALLERY 2 C. Annina Nosei Gallery, Prince Street, March 1982: his first solo show in America, upstairs, while the
  // basement below was where he worked. The trick: a glass trench in the floor between the partitions, and under it the
  // basement keeps going, canvases leaning three deep. Walk over it. And every label crosses itself out as you come close,
  // which, as he said of his crossed out words, makes you read them more.
  basquiat_c(c, r, g, X, mats) {
    r.noBench = true;
    const { THREE } = c;
    const tx1 = 7, tx2 = 13, tz1 = -1.4, tz2 = 0.8, DEP = 3.4;
    // the floor, in four pieces round the hole
    g.add(c.slab(W, 0.1, tz1 + D / 2, mats.floor, W / 2, -0.05, (-D / 2 + tz1) / 2));
    g.add(c.slab(W, 0.1, D / 2 - tz2, mats.floor, W / 2, -0.05, (tz2 + D / 2) / 2));
    g.add(c.slab(tx1, 0.1, tz2 - tz1, mats.floor, tx1 / 2, -0.05, (tz1 + tz2) / 2));
    g.add(c.slab(W - tx2, 0.1, tz2 - tz1, mats.floor, (tx2 + W) / 2, -0.05, (tz1 + tz2) / 2));
    // the basement: walls, a floor, stretchers, the canvases leaning, a bulb
    const bw = std(c, 0xd8d0c0, { roughness: 0.95 }), bf = std(c, 0x4a4038, { roughness: 0.9 });
    g.add(c.slab(tx2 - tx1 + 4, 0.1, tz2 - tz1 + 3, bf, W / 2, -DEP, (tz1 + tz2) / 2));
    for (const [x, z, w, d] of [[W / 2, tz1 - 1.5, tx2 - tx1 + 4, 0.1], [W / 2, tz2 + 1.5, tx2 - tx1 + 4, 0.1], [tx1 - 2, (tz1 + tz2) / 2, 0.1, tz2 - tz1 + 3], [tx2 + 2, (tz1 + tz2) / 2, 0.1, tz2 - tz1 + 3]]) g.add(c.slab(w, DEP, d, bw, x, -DEP / 2, z));
    const V = (window.VAULT || {}).basquiat;
    if (V) for (let k = 0; k < 9; k++) { const it = V.items[(k * 23) % V.items.length], t = c.tex.load(`assets/vault/basquiat/${it[3]}`); t.colorSpace = THREE.SRGBColorSpace;
      const cw = 1.3 + (k % 3) * 0.3, cv = new THREE.Mesh(new THREE.PlaneGeometry(cw, cw * 0.5625), new THREE.MeshBasicMaterial({ map: t, color: 0xb8a890, toneMapped: false }));
      const side = k % 2 ? 1 : -1; cv.position.set(tx1 - 1.2 + (k * 1.05) % (tx2 - tx1 + 2.4), -DEP + cw * 0.3, side > 0 ? tz2 + 1.35 - (k % 3) * 0.12 : tz1 - 1.35 + (k % 3) * 0.12); cv.rotation.set(side > 0 ? -0.18 : 0.18, side > 0 ? PI : 0, 0); g.add(cv); }
    for (let k = 0; k < 5; k++) g.add(c.slab(0.05, 1.6, 0.05, std(c, 0xc8a878), tx1 + 0.8 + k * 1.1, -DEP + 0.8, tz1 - 1.2 + (k % 2) * 0.2));
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), basic(c, 0xffe0a0)); bulb.position.set(W / 2, -0.6, (tz1 + tz2) / 2); g.add(bulb);
    const glowS = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,200,120,.5)'), transparent: true, depthWrite: false, toneMapped: false })); glowS.scale.setScalar(2.4); glowS.position.copy(bulb.position); g.add(glowS);
    const cord = c.slab(0.01, 0.6, 0.01, ink(c), W / 2, -0.3, (tz1 + tz2) / 2); g.add(cord);
    // the glass you walk on
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(tx2 - tx1, tz2 - tz1), new THREE.MeshStandardMaterial({ color: 0xbfd8e0, transparent: true, opacity: 0.07, roughness: 0.05, metalness: 0.3, depthWrite: false }));
    glass.rotation.x = -PI / 2; glass.position.set(W / 2, 0.01, (tz1 + tz2) / 2); g.add(glass);
    for (const [x, z, w, d] of [[W / 2, tz1, tx2 - tx1 + 0.08, 0.06], [W / 2, tz2, tx2 - tx1 + 0.08, 0.06], [tx1, (tz1 + tz2) / 2, 0.06, tz2 - tz1], [tx2, (tz1 + tz2) / 2, 0.06, tz2 - tz1]]) g.add(c.slab(w, 0.03, d, std(c, 0x2a2a2a, { metalness: 0.8, roughness: 0.3 }), x, 0.015, z));
    c.clickable(glass, () => c.egg('basement', 'Annina Nosei gave him the basement under her Prince Street gallery as a studio in late 1981. His first solo show in America opened upstairs in March 1982. Visitors could, in effect, stand on the next show.'), 'The glass');
    showHall(c, r, g, X, mats, { bench: false });
    plinthHero(c, r, g, X, 'ts_floormodel', { x: 10, z: -5.5, h: 0.7, hint: 'A model of the floor', egg: ['floormodel', 'A section through the building: the show on top, the studio underneath. The gallery got the credit and the basement got the paint.'] });
    // the labels: each one crosses itself out as you come close, in his three stroke way, and stays readable
    const labs = [];
    (r.hung || []).forEach((p) => {
      const b = board(c, g, 0.95, 0.22, 192); const gw = new THREE.Vector3(); p.group.updateWorldMatrix(true, false);
      b.m.position.set(0, -0.62, 0.035); p.group.add(b.m); g.remove(b.m);
      const draw = (u) => { const { q, W: w, H: h } = b; q.fillStyle = '#f4ecdc'; q.fillRect(0, 0, w, h); q.fillStyle = '#111'; q.textAlign = 'left'; q.font = `700 ${h * 0.34}px ${c.SERIF}`; q.fillText(p.t.toUpperCase(), w * 0.05, h * 0.42); q.font = `600 ${h * 0.2}px ${c.MONO}`; q.fillText(`No. ${p.n}  ·  ${p.h || ''}  ·  BY MLOW`, w * 0.05, h * 0.8);
        if (u > 0) { q.strokeStyle = '#111'; q.lineWidth = h * 0.07; q.lineCap = 'round'; const tw = Math.min(w * 0.9, q.measureText ? w * 0.05 + p.t.length * h * 0.22 : w * 0.8); for (let k = 0; k < 3; k++) { const e = Math.max(0, Math.min(1, u * 3 - k)); if (!e) break; q.beginPath(); q.moveTo(w * 0.04, h * (0.3 + k * 0.06)); q.lineTo(w * 0.04 + (tw - w * 0.02) * e, h * (0.33 + k * 0.05)); q.stroke(); } if (u >= 1) { q.fillStyle = '#c8102e'; q.font = `900 ${h * 0.24}px ${c.SERIF}`; q.fillText('©', w * 0.9, h * 0.45); } }
        b.up(); };
      draw(0); labs.push({ p, draw, u: 0, last: -1, gw: p.group.getWorldPosition(gw) });
    });
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; for (const L of labs) { const d = Math.hypot(L.gw.x - P.x, L.gw.z - P.z), want = d < 2.6 ? 1 : 0; L.u = Math.max(0, Math.min(1, L.u + (want ? dt * 0.9 : -dt * 0.6))); const k = Math.round(L.u * 24); if (k !== L.last) { L.last = k; L.draw(L.u); } } });
  },

  // GALLERY 3 C. The Pop Shop, 292 Lafayette Street, opened April 1986: his line on every wall, art at a price a kid could
  // pay. The trick: the line is alive. One black stroke runs round the whole room above the frames and flows, so the eye is
  // carried from piece to piece; it speeds up over the piece nearest you. The counter sells a button for a dollar.
  haring_c(c, r, g, X, mats) {
    const { THREE } = c;
    showHall(c, r, g, X, mats, { bench: false });
    const yL = 3.05, hi = 5.6, EX = W - 0.45, N = -7.75, S = 7.75;
    const pts = [[0.2, yL, 7.6], [0.2, yL, N], [4, yL, N], [4, 5.0, N], [16, 5.0, N], [16, yL, N], [EX, yL, N], [EX, yL, S], [15.2, yL, S], [15.2, hi, S], [4.8, hi, S], [4.8, yL, S], [0.2, yL, 7.6]];
    const path = new THREE.CurvePath(); for (let k = 0; k < pts.length - 1; k++) path.add(new THREE.LineCurve3(new THREE.Vector3(...pts[k]), new THREE.Vector3(...pts[k + 1])));
    const tube = new THREE.TubeGeometry(path, 600, 0.075, 6, false);
    const flow = { value: 0 }, near = { value: 0.5 };
    const lm = new THREE.ShaderMaterial({ uniforms: { uT: flow, uN: near }, transparent: true,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: 'uniform float uT, uN; varying vec2 vUv; void main(){ float u = vUv.x * 160. - uT; float d = fract(u); float a = step(d, 0.62); float boost = smoothstep(0.06, 0.0, abs(vUv.x - uN)); if (a < 0.5 && boost < 0.5) discard; gl_FragColor = vec4(mix(vec3(1., .16, .3), vec3(1., .82, .1), boost), 1.); }' });
    g.add(new THREE.Mesh(tube, lm));
    // where along the line is the nearest point to you
    const L = path.getSpacedPoints(200);
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; const lx = P.x - r.x0; let best = 0, bd = 1e9; for (let k = 0; k < L.length; k++) { const d = Math.hypot(L[k].x - lx, L[k].z - P.z); if (d < bd) { bd = d; best = k; } } near.value = best / (L.length - 1); flow.value += dt * 2.2; });
    // the counter
    const ctr = c.glb('ts_popcounter', { len: 1.9, x: 10, z: -5.5, ry: 0, parent: g }); c.post(X(10), -5.5, 1.0);
    const pc = c.sign('BUTTONS $1', { w: 1.3, h: 0.36, bg: '#ffffff', fg: '#111', font: c.SERIF, weight: 900, px: 128, border: '#111' }); pc.position.set(10, 2.1, -5.5); g.add(pc);
    let sold = 0;
    c.clickable(ctr, () => { sold++; c.sound.ticket(); c.toast(sold === 1 ? 'One button. One dollar. You are a collector.' : `${sold} buttons. The shop thanks you.`, 2400); if (sold === 1) c.egg('popshop', 'He opened the Pop Shop on Lafayette Street in April 1986 so his art cost what a kid could pay: buttons, shirts, posters. A second one opened in Tokyo in 1988.'); }, 'Buy a button, $1');
    const tag = notice(c, g, 'EVERYTHING HERE ONCE COST LESS THAN LUNCH', 18.0, 3.25, -D / 2 + 0.03, 0, 2.2, 0.22, '#fff', '#111');
    c.clickable(tag, () => c.egg('lunchprice', 'He painted the whole shop himself, floor to ceiling, in black on white, so the room was a work before anything in it was sold.'), 'A sign');
    const baby = decal(c, 0.9, 0.9, (q, w, h) => { haringFigure(q, w / 2, h * 0.62, h * 0.42, POSES[2], '#ff4a2a'); });
    baby.position.set(10, 0.012, 5.2); baby.rotation.x = -PI / 2; g.add(baby);
  },

  // GALLERY 4 C. Thirty six views, unrolled. The series was single sheets, never a scroll; this hall makes it one. Paper bands
  // run the length of both long walls behind the hang and unroll ahead of you as you walk north, and a piece is only hung
  // once its paper reaches it. From the brass mark by the bench a wave of floating marks closes round the Empire State in the
  // plate, the way Fuji sits in the hollow of the print.
  hokusai_c(c, r, g, X, mats) {
    const { THREE } = c;
    showHall(c, r, g, X, mats, { bench: false });
    const paper = new THREE.MeshStandardMaterial({ color: 0xf2e8d0, roughness: 0.92, side: THREE.DoubleSide }), wood = std(c, 0x3a2414, { roughness: 0.5 });
    const Z0 = 1.8, Z1 = -7.7, bands = [];
    for (const [x, ry] of [[0.16, PI / 2], [EXW - 0.02, -PI / 2]]) {
      const b = new THREE.Mesh(new THREE.PlaneGeometry(1, 2.3), paper); b.position.set(x + (ry > 0 ? 0.004 : -0.004), 1.72, Z0); b.rotation.y = ry; g.add(b);
      const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.5, 16), wood); roll.position.set(x + (ry > 0 ? 0.08 : -0.08), 1.72, Z0); g.add(roll);
      const fixed = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.5, 16), wood); fixed.position.set(x + (ry > 0 ? 0.08 : -0.08), 1.72, Z0 + 0.05); g.add(fixed);
      bands.push({ b, roll, x });
    }
    const side = (r.hung || []).filter((p) => { const q = p.group.position; return (Math.abs(q.x - 0.14) < 0.1 || Math.abs(q.x - EXW) < 0.1) && q.z < Z0; });
    side.forEach((p) => { p.group.scale.setScalar(0.001); p.shown = 0; });
    let zEnd = Z0;
    const setBand = () => bands.forEach(({ b, roll }) => { const len = Math.max(0.01, Z0 - zEnd); b.scale.x = len; b.position.z = Z0 - len / 2; roll.position.z = zEnd; });
    setBand();
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) { if (zEnd !== Z0 && Math.abs(ri - r.i) > 1) { zEnd = Z0; setBand(); side.forEach((p) => { p.group.scale.setScalar(0.001); p.shown = 0; }); } return; }
      const want = Math.max(Z1, Math.min(Z0, P.z - 3.2)); if (want < zEnd) { zEnd += (want - zEnd) * Math.min(1, dt * 2.5); setBand(); }
      side.forEach((p) => { const on = p.group.position.z > zEnd + 0.4; if (on && p.shown < 1) { p.shown = Math.min(1, p.shown + dt * 2.4); const e = 1 - Math.pow(1 - p.shown, 3); p.group.scale.setScalar(Math.max(0.001, e)); } });
    });
    window.__unroll = () => { zEnd = Z1; setBand(); side.forEach((p) => { p.shown = 1; p.group.scale.setScalar(1); }); };
    // the wave: marks floating along rays from the brass mark, closing round the tower in the plate
    const V = { x: 10, y: 1.62, z: 4.4 };
    standHere(c, g, V.x, V.z, 'THE VIEW', '#c9a033');
    anamorph(c, g, V, [0, 0.06, -1], (q, w, h) => {
      q.fillStyle = '#1d3a78'; q.beginPath(); q.moveTo(0, h); q.bezierCurveTo(w * 0.05, h * 0.3, w * 0.35, h * 0.02, w * 0.62, h * 0.18); q.bezierCurveTo(w * 0.45, h * 0.2, w * 0.36, h * 0.42, w * 0.42, h * 0.62); q.bezierCurveTo(w * 0.3, h * 0.5, w * 0.2, h * 0.75, w * 0.3, h); q.closePath(); q.fill();
      q.fillStyle = '#f4f0e6'; for (let k = 0; k < 9; k++) { q.beginPath(); q.arc(w * (0.36 + k * 0.03), h * (0.16 + Math.sin(k) * 0.03), w * 0.02, 0, 7); q.fill(); }
      q.strokeStyle = '#8ab0d8'; q.lineWidth = w * 0.02; q.beginPath(); q.moveTo(w * 0.08, h * 0.85); q.bezierCurveTo(w * 0.2, h * 0.4, w * 0.4, h * 0.2, w * 0.58, h * 0.2); q.stroke();
    }, { n: 64, tmin: 2.0, tmax: 3.8, fov: 0.42, fill: 1.25, seed: 4 });
    const card = notice(c, g, 'FORTY SIX VIEWS. THE TITLE SAYS THIRTY SIX.', 1.45, 3.2, -D / 2 + 0.03, 0, 1.6, 0.22, '#f2e8d0', '#1a1a1a');
    c.clickable(card, () => c.egg('fortysix', 'Thirty six Views of Mount Fuji sold well enough that ten more were added, so the series is forty six prints. He was about seventy when it came out.'), 'A card');
    const seal = notice(c, g, 'ABOUT THIRTY NAMES IN ONE LIFETIME', 18.0, 3.2, -D / 2 + 0.03, 0, 1.6, 0.22, '#f2e8d0', '#1a1a1a');
    c.clickable(seal, () => c.egg('thirtynames', 'He signed his work under about thirty different names over his career. Mount Fuji kept one.'), 'A seal');
  },

  // GALLERY 5 C. One of his Interiors, walked into. In the 1990s he painted rooms out of furniture ads with art on their
  // walls; the Guggenheim held his retrospective in 1993. The hall is drawn: black outline on every edge, dotted walls, a
  // flat sofa. MLow's pieces are the only things in full colour. Stand on the dot and the whole hall lines up inside one
  // comic panel, balloon and caption, and the room prints itself in dots.
  lichtenstein_c(c, r, g, X, mats) {
    const { THREE } = c;
    showHall(c, r, g, X, mats, { bench: false });
    const k = ink(c), HT = H_IN;
    // the outline: every edge of the room, drawn
    const E = (w, h, d, x, y, z) => g.add(c.slab(w, h, d, k, x, y, z));
    E(W, 0.1, 0.06, W / 2, 0.05, D / 2 - 0.03); E(W, 0.1, 0.06, W / 2, HT - 0.05, D / 2 - 0.03); E(W, 0.1, 0.06, W / 2, HT - 0.05, -D / 2 + 0.03);
    for (const x of [0.15, EXW + 0.02]) { E(0.06, 0.1, D, x, 0.05, 0); E(0.06, 0.1, D, x, HT - 0.05, 0); E(0.06, HT, 0.08, x, HT / 2, D / 2 - 0.04); E(0.06, HT, 0.08, x, HT / 2, -D / 2 + 0.04); }
    E(0.06, 0.1, 0.06, 4, 0.05, -D / 2 + 0.03); E(PORTAL.w, 0.08, 0.08, W / 2, PORTAL.h, -D / 2 + 0.03); for (const x of [4, 16]) E(0.08, PORTAL.h, 0.08, x, PORTAL.h / 2, -D / 2 + 0.03);
    const sofa = c.glb('ts_comicsofa', { len: 2.4, x: 10, z: 2.7, ry: PI, parent: g }); c.post(X(10), 2.7, 1.1);
    c.clickable(sofa, () => c.egg('sofa', 'His Interiors came from furniture advertisements in catalogues and the phone book. Showroom salesmanship, enlarged and hung in museums.'), 'The sofa');
    // the spiral, small, on a plinth
    const sp = new THREE.Group(); for (let i = 0; i < 6; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.22 + i * 0.045, 0.03, 8, 40), std(c, 0xf4f0e6, { roughness: 0.6 })); t.rotation.x = PI / 2; t.position.y = 0.06 + i * 0.075; sp.add(t); }
    sp.position.set(10, 0.9, -1.5); g.add(sp); g.add(c.slab(1.0, 0.9, 0.8, std(c, 0xf2f0ea), 10, 0.45, -1.5)); c.post(X(10), -1.5, 0.6);
    c.clickable(sp, () => c.egg('spiral', 'Frank Lloyd Wright\'s Guggenheim opened in 1959 and held his retrospective in 1993. The building already knew how to steal a show.'), 'The spiral');
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), new THREE.MeshBasicMaterial({ color: 0x1d4ed8, toneMapped: false })); dot.rotation.x = -PI / 2; dot.position.set(1.2, 0.02, 7.0); g.add(dot);
    c.clickable(dot, () => c.egg('bendaydot', 'Ben-Day dots are named after Benjamin Day, a printer, in 1879. The look of fine art started as a way to save ink.'), 'A very big dot');
    // the panel, from one spot
    const V = { x: 10, y: 1.62, z: 7.0 };
    standHere(c, g, V.x, V.z, 'ENTER FRAME', '#1d4ed8');
    anamorph(c, g, V, [0, 0.0, -1], (q, w, h) => {
      q.fillStyle = '#0d0d0d'; const b = w * 0.035; q.fillRect(0, 0, w, b); q.fillRect(0, h - b, w, b); q.fillRect(0, 0, b, h); q.fillRect(w - b, 0, b, h);
      q.fillStyle = '#ffffff'; q.beginPath(); q.ellipse(w * 0.27, h * 0.16, w * 0.2, h * 0.09, 0, 0, 7); q.fill(); q.beginPath(); q.moveTo(w * 0.3, h * 0.22); q.lineTo(w * 0.36, h * 0.33); q.lineTo(w * 0.36, h * 0.22); q.fill();
      q.strokeStyle = '#0d0d0d'; q.lineWidth = w * 0.012; q.beginPath(); q.ellipse(w * 0.27, h * 0.16, w * 0.2, h * 0.09, 0, 0, 7); q.stroke();
      q.fillStyle = '#0d0d0d'; q.font = `900 ${w * 0.05}px Arial`; q.textAlign = 'center'; q.fillText('WHAT A HANG!', w * 0.27, h * 0.18);
      q.fillStyle = '#f5d000'; q.fillRect(w * 0.06, h * 0.82, w * 0.5, h * 0.11); q.fillStyle = '#0d0d0d'; q.font = `800 ${w * 0.03}px Arial`; q.textAlign = 'left'; q.fillText('MEANWHILE, INSIDE THE PICTURE...', w * 0.08, h * 0.89);
    }, { n: 96, tmin: 1.5, tmax: 3.0, fov: 0.45, fill: 1.3, seed: 9 });   // all in the clear air between the spot and the sofa: nothing can hide a dot
    fxWhile(c, r, 'dots', (t, dt, P) => near(r, P, V.x, V.z, 0.32) && looking(c, r, V.x, -8, 0.97), 0.5);
  },

  // GALLERY 6 C. MoMA, November 1941, his retrospective (Miro had the other one, the same season). The trick: stare at a
  // piece and its gilt frame gives up, dripping down the wall in slow drops, while the picture inside stays perfectly still.
  // Look away and the frame sets back into shape. The portrait is stable. Its support system is not.
  dali_c(c, r, g, X, mats) {
    const { THREE } = c;
    showHall(c, r, g, X, mats, { parts: [6] });
    const melts = [];
    (r.hung || []).forEach((p) => {
      const fm = p.frameMesh.material, u = { value: 0 }; fm.userData.u = u;
      fm.onBeforeCompile = (sh) => { sh.uniforms.uMelt = fm.userData.u; sh.vertexShader = 'uniform float uMelt;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        float lw = clamp(0.5 - position.y, 0., 1.); float drip = pow(0.5 + 0.5 * sin(position.x * 23. + 1.7), 6.) + 0.5 * pow(0.5 + 0.5 * sin(position.x * 41. + 4.1), 9.);
        transformed.y -= uMelt * lw * (0.06 + drip * 0.9); transformed.x *= 1. + uMelt * lw * 0.05; transformed.z -= uMelt * lw * 0.02;`); };
      fm.customProgramCacheKey = () => 'melt';
      const q = new THREE.Vector3(); p.group.getWorldPosition(q); melts.push({ p, u, q, gaze: 0 });
    });
    const fwd = new THREE.Vector3(); let told = false;
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) { for (const m of melts) { m.gaze = 0; m.u.value *= 0.9; } return; }
      c.camera.getWorldDirection(fwd);
      for (const m of melts) { const dx = m.q.x - P.x, dy = m.q.y - 1.6, dz = m.q.z - P.z, d = Math.hypot(dx, dy, dz) || 1, dot = (dx * fwd.x + dy * fwd.y + dz * fwd.z) / d;
        m.gaze = dot > 0.95 && d < 7 ? Math.min(6, m.gaze + dt) : Math.max(0, m.gaze - dt * 1.6);
        const want = Math.max(0, Math.min(1, (m.gaze - 1.2) / 3)); m.u.value += (want - m.u.value) * Math.min(1, dt * (want > m.u.value ? 0.9 : 2.2));
        if (!told && m.u.value > 0.85) { told = true; c.egg('meltdown', 'You stared a frame off the wall. The Persistence of Memory came to New York in January 1932, in the Surrealism show at the Julien Levy Gallery, and has hung at MoMA since 1934. Nothing in it has ever set.'); } } });
    window.__melt = (v) => melts.forEach((m) => { m.u.value = v; });
    plinthHero(c, r, g, X, 'ts_meltframe', { x: 10, z: -5.5, h: 1.2, hint: 'A frame', egg: ['softframe', 'MoMA gave him a retrospective in November 1941 and gave Joan Miro one the same season. The unconscious had a choice of neighbours.'] });
    // a soft watch, draped over the bench, at 4:20
    const wt = c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = '#e8d8a8'; q.beginPath(); q.arc(w / 2, h / 2, w * 0.48, 0, 7); q.fill(); q.strokeStyle = '#8a6a2a'; q.lineWidth = 10; q.stroke(); q.fillStyle = '#2a1a0a'; for (let k = 0; k < 12; k++) { const a = k / 12 * PI * 2; q.fillRect(w / 2 + Math.sin(a) * w * 0.38 - 3, h / 2 - Math.cos(a) * h * 0.38 - 3, 6, 6); } q.strokeStyle = '#2a1a0a'; q.lineWidth = 7; q.lineCap = 'round'; const hh = (4 + 20 / 60) / 12 * PI * 2, mm = 20 / 60 * PI * 2; q.beginPath(); q.moveTo(w / 2, h / 2); q.lineTo(w / 2 + Math.sin(hh) * w * 0.22, h / 2 - Math.cos(hh) * h * 0.22); q.stroke(); q.beginPath(); q.moveTo(w / 2, h / 2); q.lineTo(w / 2 + Math.sin(mm) * w * 0.34, h / 2 - Math.cos(mm) * h * 0.34); q.stroke(); });
    const wg = new THREE.PlaneGeometry(0.62, 0.62, 16, 16), pa = wg.attributes.position; for (let i = 0; i < pa.count; i++) { const y = pa.getY(i); if (y < 0.0) pa.setZ(i, -Math.pow(-y, 1.4) * 1.6); } wg.computeVertexNormals();
    const watch = new THREE.Mesh(wg, new THREE.MeshStandardMaterial({ map: wt, roughness: 0.4, metalness: 0.3, side: THREE.DoubleSide })); watch.rotation.x = -PI / 2; watch.position.set(10.6, 0.53, 2.42); g.add(watch);
    c.clickable(watch, () => c.egg('benchwatch', 'His first New York solo show was at the Julien Levy Gallery in November 1933. In this room it is always 4:20, which is a house rule, not his.'), 'A soft watch');
  },

  // GALLERY 7 C. Leo Castelli, April 1966: Cow Wallpaper in one room, Silver Clouds in the other, the show after he said he
  // had retired from painting. Every piece here is screened four times in one frame; the lower left is MLow's original and
  // the other three change ink as you walk past, a lenticular edition. The pillows float above your head and get out of your way.
  warhol_c(c, r, g, X, mats) {
    const { THREE } = c;
    showHall(c, r, g, X, mats);
    const scr = [];
    (r.hung || []).forEach((p) => {
      const m = p.mesh.material, u = { value: 0 }; m.userData.ink = u; const tx = m.map; tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(2, 2); tx.needsUpdate = true;
      m.onBeforeCompile = (sh) => { sh.uniforms.uInk = m.userData.ink; sh.fragmentShader = 'uniform float uInk;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', `
        vec2 qd = step(vec2(1.), vMapUv); float qi = qd.x + (qd.y) * 2.;
        if (qi > 0.5) { float id = mod(floor(uInk) + qi * 2., 5.); vec3 a = id < 1. ? vec3(1., .3, .62) : id < 2. ? vec3(.2, .85, 1.) : id < 3. ? vec3(1., .86, .12) : id < 4. ? vec3(.45, 1., .35) : vec3(1., .5, .15);
          vec3 b = id < 1. ? vec3(.12, .1, .5) : id < 2. ? vec3(.5, .05, .3) : id < 3. ? vec3(.05, .25, .6) : id < 4. ? vec3(.6, .1, .5) : vec3(.1, .3, .25);
          float l = dot(outgoingLight, vec3(.3, .59, .11)); outgoingLight = mix(b, a, smoothstep(.34, .44, l)) * 1.15; }
        #include <opaque_fragment>`); };
      m.customProgramCacheKey = () => 'screen4';
      const q = new THREE.Vector3(); p.group.getWorldPosition(q); const n = new THREE.Vector3(0, 0, 1).applyQuaternion(p.group.getWorldQuaternion(new THREE.Quaternion()));
      scr.push({ u, q, n });
    });
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; for (const s of scr) { const dx = P.x - s.q.x, dz = P.z - s.q.z; const a = Math.atan2(dx * s.n.z - dz * s.n.x, dx * s.n.x + dz * s.n.z); s.u.value = a * 4 + 10; } });
    // the clouds, up above the hang
    const cm = new THREE.MeshStandardMaterial({ color: 0xeef2f6, metalness: 1, roughness: 0.1 }), clouds = [];
    for (let k = 0; k < 14; k++) { const pg = new THREE.SphereGeometry(0.55, 20, 14); pg.scale(1, 0.34, 0.74); const p = new THREE.Mesh(pg, cm); p.position.set(2 + (k % 7) * 2.7, 3.9 + (k % 3) * 0.55, -6 + Math.floor(k / 7) * 7 + (k % 2)); g.add(p); clouds.push({ p, v: new THREE.Vector3(), home: p.position.clone() }); }
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; const L = local(r, P); clouds.forEach((cl, k) => { const dx = cl.p.position.x - L.x, dz = cl.p.position.z - L.z, d = Math.hypot(dx, dz) || 1; if (d < 2.4) { cl.v.x += dx / d * dt * 2.2; cl.v.z += dz / d * dt * 2.2; } cl.v.addScaledVector(cl.home.clone().sub(cl.p.position), dt * 0.12); cl.v.multiplyScalar(0.98); cl.p.position.addScaledVector(cl.v, dt); cl.p.position.y = cl.home.y + Math.sin(t * 0.7 + k) * 0.18; cl.p.rotation.y += dt * 0.08; }); });
    c.clickable(clouds[3].p, () => c.egg('kluver', 'Silver Clouds were made with Billy Kluver, an engineer from Bell Labs. The floating sculpture had technical support.'), 'A silver pillow');
    const ret = notice(c, g, 'I AM RETIRING FROM PAINTING · PARIS, 1965', 1.45, 3.2, -D / 2 + 0.03, 0, 1.7, 0.22, '#fff', '#111');
    c.clickable(ret, () => c.egg('retired', 'He announced he was retiring from painting in Paris in 1965. The April 1966 show at Castelli was wallpaper and balloons, which is a very busy retirement.'), 'A notice');
    const cow = notice(c, g, 'FOUR INKS · ONE NEW YORKER', 18.0, 3.2, -D / 2 + 0.03, 0, 1.6, 0.22, '#f5e030', '#c8106a');
    c.clickable(cow, () => c.egg('cowpaper', 'The 1966 Cow Wallpaper was pink cows on yellow. Here the cows have eye flowers, and every portrait comes in four inks, three of which move.'), 'A card');
  },

  // GALLERY 8 C. MoMA, November 4, 1935, at its townhouse on West 53rd Street: the Van Gogh show that made lines round the
  // block. The trick is an Ames room built inside the hall. From the brass scope by the door the far gallery is a plain
  // rectangle with eight pieces the same size and two visitors in its corners, one a giant. Walk along the rope and the
  // room comes apart: the back wall runs away, the pieces are four sizes, and the giant is just closer. Scaling everything
  // along rays from one eye keeps it identical from that eye, which is the whole trick.
  vangogh_c(c, r, g, X, mats) {
    const { THREE } = c;
    showHall(c, r, g, X, mats, { partitions: false, bench: false, title: false });
    g.add(c.slab(PORTAL.w, PORTAL.h, 0.24, mats.wall, W / 2, PORTAL.h / 2, -D / 2 - 0.12));   // no plate: the north wall closes
    const V = new THREE.Vector3(10, 1.6, 6.8), kx = (x) => 0.62 + 0.52 * (x - 3) / 14, T = (x, y, z) => new THREE.Vector3(x, y, z).sub(V).multiplyScalar(kx(x)).add(V);
    // a warped box: the back wall (z -6), floor, ceiling and the two sides, each vertex moved along its ray
    const warp = (geo, f) => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const v = f(p.getX(i), p.getY(i), p.getZ(i)); p.setXYZ(i, v.x, v.y, v.z); } geo.computeVertexNormals(); return geo; };
    const ochre = new THREE.MeshStandardMaterial({ color: 0xe8d8a8, roughness: 0.9, side: THREE.DoubleSide }), checks = c.canvasTex(256, 256, (q, w, h) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { q.fillStyle = (i + j) % 2 ? '#3a2a1a' : '#d8c8a0'; q.fillRect(i * 32, j * 32, 32, 32); } });
    checks.repeat.set(3.5, 1.25); checks.wrapS = checks.wrapT = THREE.RepeatWrapping;
    const HB = 4.4, aw = mats.wall.clone(); aw.side = THREE.DoubleSide; if (aw.map) { aw.map = mats.wall.map.clone(); aw.map.repeat.set(3.5, 1.1); aw.map.needsUpdate = true; }
    const back = warp(new THREE.PlaneGeometry(14, HB, 28, 8), (x, y) => T(10 + x, HB / 2 + y, -6)); g.add(new THREE.Mesh(back, aw));
    const floor = warp(new THREE.PlaneGeometry(14, 5, 28, 10), (x, y) => T(10 + x, 0, -3.5 - y)); g.add(new THREE.Mesh(floor, new THREE.MeshStandardMaterial({ map: checks, roughness: 0.7, side: THREE.DoubleSide })));
    const ceil = warp(new THREE.PlaneGeometry(14, 5, 28, 10), (x, y) => T(10 + x, HB, -3.5 - y)); g.add(new THREE.Mesh(ceil, ochre));
    for (const sx of [3, 17]) { const sw = warp(new THREE.PlaneGeometry(5, HB, 10, 8), (x, y) => T(sx, HB / 2 + y, -3.5 + x)); g.add(new THREE.Mesh(sw, aw)); }
    // the front edge: a skirt down to the real floor, a cornice up to the ceiling, and a rope so nobody walks in
    const fl = T(3, 0, -1), fr = T(17, 0, -1);
    const skirt = warp(new THREE.PlaneGeometry(14, 1, 28, 1), (x, y) => { const v = T(10 + x, 0, -1); return new THREE.Vector3(v.x, y > 0 ? v.y : 0, v.z); }); g.add(new THREE.Mesh(skirt, std(c, 0x3a2a1a, { side: THREE.DoubleSide })));
    c.wall(X(fl.x), fl.z + 0.3, X(fr.x), fr.z + 0.3);
    for (let i = 0; i <= 8; i++) { const v = T(3 + i * 14 / 8, 0, -1); const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.95, 10), std(c, 0xd6a640, { metalness: 1, roughness: 0.25 })); post.position.set(v.x, 0.48, v.z + 0.3); g.add(post); }
    // the hang on the warped walls: each piece scaled about the eye, so from the scope they are all one size
    const extra = r.cast.filter((p) => !p.group).slice(0, 10);
    const spots = []; for (let i = 0; i < 6; i++) spots.push([4.3 + i * 2.28, 2.2, -5.99, 0]);
    spots.push([3.01, 2.2, -2.6, PI / 2]); spots.push([16.99, 2.2, -2.6, -PI / 2]);
    extra.slice(0, spots.length).forEach((p, k) => { const [x, y, z, ry] = spots[k]; const v = T(x, y, z), s = kx(x); const grp = c.hang(p, v.x, v.y, v.z, ry, 1.5, 'gilt', g); grp.scale.setScalar(s); });
    r.hung = r.cast.filter((p) => p.group);
    // the two visitors in the corners: the same height, unscaled, so one of them is a giant from the scope
    const a = T(4.2, 0, -5.2), b = T(15.8, 0, -5.2);
    for (const [pt, col] of [[a, 0x6a2a2a], [b, 0x2a3a6a]]) { const e = extraNY(c, g, pt.x, pt.z, col); e.position.y = pt.y; }
    // the scope you look through
    const sc = c.glb('ts_amesscope', { h: 1.5, x: 10, z: 7.45, ry: PI, parent: g }); c.post(X(10), 7.45, 0.35);
    standHere(c, g, V.x, V.z, 'LOOK FROM HERE', '#c9a033');
    c.clickable(sc, () => { c.egg('ames', 'An Ames room: a lopsided room that looks square from one spot, so people in its corners seem to change size. Adelbert Ames built the first in 1946. MoMA opened its Van Gogh show on November 4, 1935, at its townhouse on West 53rd Street, and the lines went round the block.'); }, 'The scope');
    const tl = notice(c, g, 'VINCENT VAN GOGH · PERSPECTIVE IS RELATIVE · MOMA, NOVEMBER 1935', W / 2, 5.3, -D / 2 + 0.02, 0, 9, 0.4, null, '#2a1a0a');
    const br = notice(c, g, 'THREE BEDROOMS', 1.45, 3.4, -D / 2 + 0.03, 0, 1.4, 0.22, '#f2e8d0', '#2a1a0a');
    c.clickable(br, () => c.egg('bedrooms', 'He painted three versions of The Bedroom, whose walls do not meet at right angles. The room you are looking at has the same problem on purpose.'), 'A card');
    const th = notice(c, g, 'HIS BROTHER WAS A DEALER', 1.45, 3.05, -D / 2 + 0.03, 0, 1.4, 0.2, '#f2e8d0', '#2a1a0a');
    c.clickable(th, () => c.egg('theo', 'His brother Theo was an art dealer, so the family already had a sales department. It sold almost nothing.'), 'A card');
  },

  // GALLERY 9 C. MoMA, November 15, 1939: Picasso, Forty Years of His Art (Guernica had been at the Valentine Gallery that
  // May). Every piece hangs as a triptych: the portrait in the middle and two hinged wings that show it again, mirrored, so
  // there are three witnesses to each face. Far away the wings fold forward into a cubist zigzag; come close and they open
  // flat so the piece is all there is.
  picasso_c(c, r, g, X, mats) {
    const { THREE } = c;
    showHall(c, r, g, X, mats);
    const wings = [];
    (r.hung || []).forEach((p) => {
      const w = p.mesh.scale.x, h = p.mesh.scale.y, ww = w * 0.48, map = p.mesh.material.map;
      for (const s of [-1, 1]) {
        const piv = new THREE.Group(); piv.position.set(s * (w / 2 + 0.07), 0, 0.03); p.group.add(piv);
        const geo = new THREE.PlaneGeometry(ww, h); const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, s < 0 ? 0.5 - uv.getX(i) * 0.5 : 1 - uv.getX(i) * 0.5);
        const pane = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map, color: 0xe8e8e8, roughness: 0.3, metalness: 0, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.55, side: THREE.DoubleSide }));
        pane.position.x = s * ww / 2; piv.add(pane);
        const edge = new THREE.Mesh(new THREE.BoxGeometry(ww + 0.04, h + 0.06, 0.02), std(c, 0x2a2a2a, { metalness: 0.6 })); edge.position.set(s * ww / 2, 0, -0.012); piv.add(edge);
        const q = new THREE.Vector3(); p.group.getWorldPosition(q); wings.push({ piv, s, q, a: 0.6 });
      }
    });
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; for (const w of wings) { const d = Math.hypot(w.q.x - P.x, w.q.z - P.z), want = 0.12 + 0.5 * Math.max(0, Math.min(1, (d - 2.2) / 5)); w.a += (want - w.a) * Math.min(1, dt * 2.5); w.piv.rotation.y = -w.s * w.a; } });
    const val = notice(c, g, 'GUERNICA WAS HERE FIRST · MAY 1939', 1.45, 3.2, -D / 2 + 0.03, 0, 1.6, 0.22, '#f4f0e8', '#1a1a1a');
    c.clickable(val, () => c.egg('valentine', 'Guernica was first shown in New York at the Valentine Gallery in May 1939, before MoMA\'s Forty Years of His Art opened that November. It first hung in the Spanish Pavilion in Paris in 1937.'), 'A card');
    const big = notice(c, g, 'IN 1980 HE TOOK THE WHOLE MUSEUM', 18.0, 3.2, -D / 2 + 0.03, 0, 1.6, 0.22, '#f4f0e8', '#1a1a1a');
    c.clickable(big, () => c.egg('wholemuseum', 'MoMA\'s 1980 Picasso retrospective filled nearly the entire building. Very confident space booking.'), 'A card');
    const crate = c.slab(1.2, 0.8, 0.8, std(c, 0xa8865a, { roughness: 0.9 }), 13.4, 0.4, -6.1); g.add(crate); c.post(X(13.4), -6.1, 0.7);
    const st = c.sign('FRAGILE · MADRID · 1981', { w: 1.0, h: 0.18, bg: null, fg: '#2a1a0a', font: c.MONO, weight: 800, px: 96 }); st.position.set(13.4, 0.5, -5.69); g.add(st);
    c.clickable(crate, () => c.egg('crate', 'Guernica stayed in MoMA\'s care for over forty years and went to Spain in 1981, as he had asked. A loan with staying power.'), 'A crate');
  },

  // GALLERY 10 C. A Housing Works thrift shop, October 2013: he left a thrift store landscape with a Nazi officer painted
  // into it, The Banality of the Banality of Evil, and it sold online for a reported 615,000 dollars. Here every frame is
  // secondhand and every tag is handwritten, and a tag changes whenever you are not looking at it.
  banksy_c(c, r, g, X, mats) {
    const { THREE } = c;
    showHall(c, r, g, X, mats, { vaultW: 8 });
    const PR = ['$4.99', '$7', '$12', '$20', '$40', '$60', '$99', '$3.50', '2 FOR $5', '$1', 'FREE', '$420', '$615,000', 'ASK', '$9.99', 'PRICELESS'];
    const tags = [];
    (r.hung || []).forEach((p, k) => {
      const b = board(c, g, 0.34, 0.17, 128); g.remove(b.m); const hw = p.mesh.scale.x / 2, hh = p.mesh.scale.y / 2;
      b.m.position.set(hw - 0.05, -hh - 0.1, 0.09); b.m.rotation.z = -0.15; p.group.add(b.m);
      const str = c.slab(0.004, 0.14, 0.004, ink(c), hw - 0.12, -hh - 0.02, 0.09); str.rotation.z = 0.5; p.group.add(str);
      const T = { b, k: (k * 5) % PR.length, q: p.group.getWorldPosition(new THREE.Vector3()), seen: true, paint() { const { q, W: w, H: h } = b; q.fillStyle = '#f8f2dc'; q.fillRect(0, 0, w, h); q.fillStyle = '#c8102e'; q.font = `700 ${h * 0.5}px "Marker Felt", "Comic Sans MS", cursive`; q.textAlign = 'center'; q.fillText(PR[this.k], w / 2, h * 0.66); q.strokeStyle = '#111'; q.lineWidth = 3; q.beginPath(); q.arc(w * 0.08, h / 2, h * 0.08, 0, 7); q.stroke(); b.up(); } };
      T.paint(); tags.push(T);
    });
    (r.hung || []).forEach((p, k) => { p.group.rotation.z = Math.sin(k * 12.9898) * 0.05; });
    const fr = new THREE.Frustum(), pm = new THREE.Matrix4(); let caught = false;
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; c.camera.updateMatrixWorld(); pm.multiplyMatrices(c.camera.projectionMatrix, c.camera.matrixWorldInverse); fr.setFromProjectionMatrix(pm);
      for (const T of tags) { const vis = fr.containsPoint(T.q); if (!vis && T.seen) { T.k = (T.k + 1 + Math.floor(Math.random() * 5)) % PR.length; T.paint(); } T.seen = vis; if (vis && PR[T.k] === '$615,000' && !caught && Math.hypot(T.q.x - P.x, T.q.z - P.z) < 4) { caught = true; c.egg('banality', 'The Banality of the Banality of Evil: a thrift store landscape he bought, painted a Nazi officer into and gave back to Housing Works in October 2013. The online auction drew a reported winning bid of 615,000 dollars. Tags here change when you are not looking. So did that one.'); } } });
    // the shop: two racks of clothes, a chair, a lamp, and the pricing station front and centre
    const chrome = std(c, 0xb8bcc0, { metalness: 1, roughness: 0.25 }), cols = [0x8a2a2a, 0x2a4a6a, 0x6a6a3a, 0x3a3a3a, 0xb08a5a, 0x5a3a6a, 0xd8d0c0, 0x2a5a4a];
    for (const [x, z] of [[17.6, 3.4]]) { if (true) { g.add(c.slab(1.8, 0.03, 0.03, chrome, x, 1.55, z - 2.6)); for (const s of [-0.9, 0.9]) g.add(c.slab(0.03, 1.55, 0.03, chrome, x + s, 0.78, z - 2.6)); for (let i = 0; i < 9; i++) { const cl = c.slab(0.05, 0.9 + (i % 3) * 0.12, 0.5, std(c, cols[(i + x | 0) % cols.length], { roughness: 0.95 }), x - 0.8 + i * 0.2, 1.05 - (i % 3) * 0.06, z - 2.6); g.add(cl); } c.post(X(x - 0.6), z - 2.6, 0.5); c.post(X(x + 0.6), z - 2.6, 0.5); } }
    prop(c, r, g, X, 'WoodenChair_01', 4.2, -5.0, { h: 0.9, ry: 0.6, r: 0.3 });
    prop(c, r, g, X, 'sofa_02', 16.0, -5.4, { len: 2.0, ry: -0.3, r: 1.0 });
    plinthHero(c, r, g, X, 'ts_pricestation', { x: 10, z: -5.6, len: 1.6, ph: 0.02, pw: 1.8, hint: 'The pricing station', egg: ['housingworks', 'Housing Works runs its thrift shops for people living with and affected by HIV/AIDS and homelessness. This till has a better purpose than most art world furniture.'] });
    const stall = notice(c, g, 'SIXTY DOLLARS WAS LAST WEEK', 1.45, 3.0, -D / 2 + 0.03, 0, 1.5, 0.22, '#f8f2dc', '#c8102e');
    c.clickable(stall, () => c.egg('lastweek', 'Earlier the same month his canvases sold for sixty dollars at an unmarked stall by Central Park. Gallery 10 room A has the stall. This room has the markup.'), 'A sign');
  },
});
// a New Yorker for the Ames room: the cheap extra, on whatever floor it stands on
function extraNY(c, g, x, z, col) { const e = extra(c, g, x, z, { col, ry: PI, pool: 'dressy' }); return e; }


// ---------- the story line: the artist's New York in brass, inlaid in the floor of the west aisle ----------
// Six dated plaques from the door to the far wall. Step on one and it is read out (with the guide on) and shown; walk
// the aisle and you have walked the years. The plaques are drawn in code; the dates come from story.js (checked facts).
function storyLine(c, r, g, X, items, { x = 3.0, z0 = 6.2, dz = -2.4 } = {}) {
  const { THREE } = c, plates = [];
  items.slice(0, 6).forEach(([yr, line], k) => {
    const z = z0 + dz * k;
    const d = decal(c, 2.3, 0.78, (q, w, h) => {
      q.fillStyle = 'rgba(20,16,10,.82)'; q.fillRect(0, 0, w, h); q.strokeStyle = '#c9a033'; q.lineWidth = h * 0.05; q.strokeRect(h * 0.05, h * 0.05, w - h * 0.1, h - h * 0.1);
      q.fillStyle = '#e8c060'; q.font = `900 ${h * 0.44}px ${c.SERIF}`; q.textAlign = 'left'; q.fillText(String(yr), h * 0.18, h * 0.56);
      q.fillStyle = '#f4ead2'; q.font = `600 ${h * 0.13}px ${c.MONO}`; const words = line.split(' '); let ln = '', y = h * 0.3; const x0 = h * 1.45, mw = w - x0 - h * 0.15;
      for (const wd of words) { const t = ln ? ln + ' ' + wd : wd; if (q.measureText(t).width > mw) { q.fillText(ln, x0, y); ln = wd; y += h * 0.17; } else ln = t; } q.fillText(ln, x0, y);
    }, 384);
    d.rotation.x = -PI / 2; d.rotation.z = PI / 2; d.position.set(x, 0.014, z); g.add(d); plates.push({ z, yr, line, said: false });
  });
  const arrow = c.sign('THE STORY · WALK IT', { w: 1.4, h: 0.22, bg: '#14100a', fg: '#e8c060', font: c.MONO, weight: 800, px: 96 }); arrow.rotation.x = -PI / 2; arrow.rotation.z = PI / 2; arrow.position.set(x + 0.95, 0.015, z0); g.add(arrow);
  c.tick((t, dt, P, ri) => { if (!here(r, ri)) { if (Math.abs(ri - r.i) > 1) plates.forEach((p) => { p.said = false; }); return; } const L = local(r, P);
    for (const p of plates) if (!p.said && Math.abs(L.x - x) < 0.8 && Math.abs(L.z - p.z) < 1.0) { p.said = true; c.toast(`${p.yr}. ${p.line}`, 4200); c.speak(`${p.yr}. ${p.line}`); } });
}

// ---------- stickers: Kusama's Obliteration Room, where every visitor is handed dots ----------
// Click any white surface in the room and a dot sticks there, facing out of the surface. They are kept in this browser,
// so the room fills up the more you come back, the way the real one does over the weeks of a show.
function stickerRoom(c, r, g, X, targets, key = 'tsoc.obliterate') {
  const { THREE } = c, N = 900, im = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 20), new THREE.MeshBasicMaterial({ toneMapped: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4 }), N);
  im.count = 0; g.add(im); const COLS = [0xd8102a, 0xffd400, 0x1d4ed8, 0x22c55e, 0xff4fa3, 0xff7a1a, 0x111111], o = new THREE.Object3D(), col = new THREE.Color(), inv = new THREE.Matrix4();
  let saved = []; try { saved = JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) {}
  const put = (p, n, s, ci) => { if (im.count >= N) return; o.position.set(p[0], p[1], p[2]); o.lookAt(p[0] + n[0], p[1] + n[1], p[2] + n[2]); o.scale.setScalar(s); o.updateMatrix(); im.setMatrixAt(im.count, o.matrix); im.setColorAt(im.count, col.setHex(COLS[ci % COLS.length])); im.count++; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; };
  saved.forEach((q) => put(q.p, q.n, q.s, q.c));
  let n0 = saved.length;
  const stick = () => { const h = c.lastHit; if (!h || !h.face) return; g.updateMatrixWorld(); inv.copy(g.matrixWorld).invert();
    const p = h.point.clone().applyMatrix4(inv), nm = h.face.normal.clone().transformDirection(h.object.matrixWorld).transformDirection(inv).normalize(); p.addScaledVector(nm, 0.004);
    const q = { p: [+p.x.toFixed(3), +p.y.toFixed(3), +p.z.toFixed(3)], n: [+nm.x.toFixed(2), +nm.y.toFixed(2), +nm.z.toFixed(2)], s: +(0.03 + Math.random() * 0.09).toFixed(3), c: Math.floor(Math.random() * 7) };
    put(q.p, q.n, q.s, q.c); saved.push(q); if (saved.length > N) saved.shift(); try { localStorage.setItem(key, JSON.stringify(saved)); } catch (e) {}
    c.sound.click && c.sound.click(); if (saved.length - n0 === 1) c.egg('obliteration', 'The Obliteration Room began as a white living room at the Queensland Art Gallery in 2002, and every visitor was handed a sheet of dot stickers. By the end of a show you cannot find the furniture. Your dots stay here, in this browser.'); };
  targets.forEach((m) => c.clickable(m, stick, 'Stick a dot'));
  return im;
}


// ---------- a picture that builds itself up, stage by stage ----------
// One shader, two stories. uMode 0, a woodblock print pulled block by block: blank paper, the key block (black line),
// then the blue, then the rest, then the full impression. uMode 1, a canvas worked up the way Dora Maar photographed
// Guernica in 1937: charcoal lines, grey masses, a cubist break, then colour. uStage runs 0 to 4 and eases between.
function stagedArt(c, url, w, h, mode) {
  const { THREE } = c, t = c.tex.load(url); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const u = { map: { value: t }, uStage: { value: 0 }, uMode: { value: mode }, uTex: { value: new THREE.Vector2(1024, 576) } };
  const m = new THREE.ShaderMaterial({ uniforms: u, toneMapped: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform sampler2D map; uniform float uStage, uMode; uniform vec2 uTex; varying vec2 vUv;
      float lum(vec3 c){ return dot(c, vec3(.3, .59, .11)); }
      void main(){
        vec2 px = 1.5 / uTex; vec3 c0 = texture2D(map, vUv).rgb;
        float gx = lum(texture2D(map, vUv + vec2(px.x, 0.)).rgb) - lum(texture2D(map, vUv - vec2(px.x, 0.)).rgb);
        float gy = lum(texture2D(map, vUv + vec2(0., px.y)).rgb) - lum(texture2D(map, vUv - vec2(0., px.y)).rgb);
        float edge = smoothstep(.06, .2, length(vec2(gx, gy))); float L = lum(c0);
        vec3 paper = uMode < .5 ? vec3(.95, .91, .82) : vec3(.93, .92, .9);
        vec3 s1 = mix(paper, vec3(.08), edge);
        vec3 s2, s3;
        if (uMode < .5) { float b = smoothstep(.35, .7, c0.b - .5 * (c0.r + c0.g) + .4); s2 = mix(s1, mix(paper, vec3(.12, .25, .55), .85) * (1. - edge * .9), b * (1. - edge));
          vec3 post = floor(c0 * 4. + .5) / 4.; s3 = mix(s2, post * (1. - edge * .8), .75); }
        else { s2 = mix(s1, vec3(floor(L * 4. + .5) / 4.) * (1. - edge * .7), .85);
          vec2 cell = floor(vUv * vec2(18., 10.)); float h = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453); vec3 cc = texture2D(map, (cell + .5) / vec2(18., 10.)).rgb;
          s3 = mix(s2, mix(vec3(floor(L * 5. + .5) / 5.), cc, .6 + .3 * h) * (1. - edge * .6), .85); }
        float k = uStage; vec3 o = paper;
        o = mix(o, s1, clamp(k, 0., 1.)); o = mix(o, s2, clamp(k - 1., 0., 1.)); o = mix(o, s3, clamp(k - 2., 0., 1.)); o = mix(o, c0, clamp(k - 3., 0., 1.));
        gl_FragColor = vec4(o, 1.);
        #include <colorspace_fragment>
      }` });
  const mesh = new c.THREE.Mesh(new THREE.PlaneGeometry(w, h), m); mesh.userData.u = u; return mesh;
}

// ---------- a loupe: walk up to the lens and see how the picture is made of dots ----------
function loupe(c, r, g, X, p, { R = 0.42, zoom = 5 } = {}) {
  const { THREE } = c; if (!p || !p.group) return;
  const map = p.mesh.material.map, u = { map: { value: map }, uC: { value: new THREE.Vector2(0.5, 0.5) }, uZ: { value: zoom }, uAsp: { value: p.mesh.scale.x / p.mesh.scale.y } };
  const m = new THREE.ShaderMaterial({ uniforms: u, transparent: true, toneMapped: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform sampler2D map; uniform vec2 uC; uniform float uZ, uAsp; varying vec2 vUv;
      void main(){ vec2 d = vUv - .5; float r = length(d); if (r > .5) discard;
        vec2 uv = uC + vec2(d.x, d.y * 1.) / uZ * vec2(1., uAsp); vec3 c = texture2D(map, uv).rgb;
        float n = 60.; vec2 g = fract(vUv * n) - .5; vec3 ink = 1. - c; vec3 dots = vec3(1.);
        for (int i = 0; i < 3; i++) { float a = float(i) * 0.5236 + .26; mat2 R = mat2(cos(a), -sin(a), sin(a), cos(a)); vec2 q = fract(R * vUv * n) - .5; float rad = sqrt(ink[i]) * .62; float s = smoothstep(rad, rad - .08, length(q)); dots[i] = 1. - s; }
        float rim = smoothstep(.47, .5, r); vec3 o = mix(dots, vec3(.75, .62, .3), rim);
        gl_FragColor = vec4(o, 1.);
        #include <colorspace_fragment>
      }` });
  const lens = new THREE.Mesh(new THREE.CircleGeometry(R, 48), m); lens.position.set(0, 0, 0.42); p.group.add(lens);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.025, 10, 48), std(c, 0xc9a033, { metalness: 1, roughness: 0.3 })); ring.position.copy(lens.position); p.group.add(ring);
  const arm = c.slab(0.03, 0.03, 0.4, std(c, 0xc9a033, { metalness: 1 }), R * 0.7, -R * 0.7, 0.22); p.group.add(arm);
  const cam = new THREE.Vector3(); p.group.updateWorldMatrix(true, false); const inv = new THREE.Matrix4();
  c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; inv.copy(p.group.matrixWorld).invert(); cam.copy(c.camera.position).applyMatrix4(inv);
    // the lens magnifies the bit of the picture behind it as seen from where you stand: walk sideways and it pans
    const f = cam.z / Math.max(0.5, cam.z - 0.42), hx = cam.x + (0 - cam.x) * f, hy = cam.y + (0 - cam.y) * f;
    u.uC.value.set(Math.max(0.05, Math.min(0.95, 0.5 + hx / p.mesh.scale.x)), Math.max(0.05, Math.min(0.95, 0.5 + hy / p.mesh.scale.y))); });
  return lens;
}

// ---------- a mirror ball, and its specks thrown onto every surface of the hall ----------
function mirrorBall(c, r, g, X, { x = 10, y = 5.0, z = 0, N = 90 } = {}) {
  const { THREE } = c, ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 2), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.05, flatShading: true }));
  ball.position.set(x, y, z); g.add(ball); g.add(c.slab(0.01, H_IN - y, 0.01, std(c, 0x111111), x, y + (H_IN - y) / 2, z));
  const im = new THREE.InstancedMesh(new THREE.CircleGeometry(0.07, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), N); g.add(im);
  const dirs = []; for (let i = 0; i < N; i++) { const a = Math.random() * PI * 2, e = Math.acos(1 - 2 * Math.random()); dirs.push(new THREE.Vector3(Math.sin(e) * Math.cos(a), Math.cos(e), Math.sin(e) * Math.sin(a))); }
  const o = new THREE.Object3D(), d = new THREE.Vector3(), B = { x0: 0.2, x1: W - 0.45, z0: -D / 2 + 0.1, z1: D / 2 - 0.2, y0: 0.02, y1: H_IN - 0.05 };
  const state = { on: 1, spin: 0.35 };
  c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; ball.rotation.y += dt * state.spin; im.visible = state.on > 0.01; if (!im.visible) return;
    for (let i = 0; i < N; i++) { d.copy(dirs[i]).applyAxisAngle(new THREE.Vector3(0, 1, 0), t * state.spin); let tm = 1e9, n = [0, 0, 0];
      const tryP = (tt, nn) => { if (tt > 0 && tt < tm) { tm = tt; n = nn; } };
      if (d.x) { tryP((B.x0 - x) / d.x, [1, 0, 0]); tryP((B.x1 - x) / d.x, [-1, 0, 0]); } if (d.z) { tryP((B.z0 - z) / d.z, [0, 0, 1]); tryP((B.z1 - z) / d.z, [0, 0, -1]); } if (d.y) { tryP((B.y0 - y) / d.y, [0, 1, 0]); tryP((B.y1 - y) / d.y, [0, -1, 0]); }
      o.position.set(x + d.x * tm, y + d.y * tm, z + d.z * tm); o.lookAt(o.position.x + n[0], o.position.y + n[1], o.position.z + n[2]); o.scale.setScalar((0.6 + tm * 0.12) * state.on); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }
    im.instanceMatrix.needsUpdate = true; });
  return { ball, state };
}

// ---------- the shredder: the frame that eats its own picture the moment it sells ----------
function shredder(c, r, g, X, p) {
  const { THREE } = c; if (!p || !p.group) return;
  const w = p.mesh.scale.x, h = p.mesh.scale.y, map = p.mesh.material.map, S = 16, strips = [];
  const box = c.slab(w + 0.3, 0.16, 0.16, std(c, 0x8a6a2a, { metalness: 0.8, roughness: 0.35 }), 0, -h / 2 - 0.16, 0.08); p.group.add(box);
  for (let i = 0; i < S; i++) { const geo = new THREE.PlaneGeometry(w / S * 0.96, h, 1, 1), uv = geo.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setX(k, (i + uv.getX(k)) / S);
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.6, side: THREE.DoubleSide })); m.position.set(-w / 2 + (i + 0.5) * w / S, 0, 0.08); m.visible = false; p.group.add(m); strips.push(m); }
  let run = -1;
  c.tick((t, dt) => { if (run < 0) return; run += dt; const drop = Math.min(h * 0.55, run * 0.18); strips.forEach((m, i) => { m.position.y = -drop; m.rotation.z = drop > h * 0.12 ? Math.sin(i * 7.3) * 0.04 * (drop / h) : 0; m.position.x = -w / 2 + (i + 0.5) * w / S + (drop > h * 0.2 ? Math.sin(i * 3.1) * 0.01 : 0); });
    if (run > 1 && !p.shredDone) { p.shredDone = true; } });
  return () => { if (run >= 0) return; run = 0; p.mesh.visible = false; strips.forEach((m) => { m.visible = true; }); };
}


// ---------- third pass: what real exhibitions did with these artists, rebuilt in the halls ----------
// (work/astra/research.md has the sources.) Each wraps its hall: the hall builds, then the exhibit goes in.
function button(c, g, text, x, y, z, ry, fn, hint, { w = 1.7, h = 0.3, bg = '#111', fg = '#f5c542' } = {}) {
  const s = c.sign(text, { w, h, bg, fg, font: c.MONO, weight: 800, px: 128, border: fg }); s.position.set(x, y, z); s.rotation.y = ry; g.add(s); c.clickable(s, fn, hint); return s;
}
const restoreLights = (c, r) => (r.lights || []).forEach((L, k) => { if (c.lights[k]) { c.lights[k].color.set(L[3]); c.lights[k].userData.i = L[4]; } });
const EX = {
  // Narcissus Garden: mirror balls on the floor in front of the endless bays (Venice 1966, Fort Tilden, Rockaway, 2018)
  kusama_c(c, r, g, X) {
    const { THREE } = c, N = 70, im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.15, 20, 14), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.04 }), N), o = new THREE.Object3D();
    let s = 3; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < N; i++) { o.position.set(4.5 + rnd() * 11, 0.15, -7.75 + rnd() * 0.85); o.updateMatrix(); im.setMatrixAt(i, o.matrix); } g.add(im);
    const sign = button(c, g, 'NARCISSUS GARDEN · $2 EACH', 10, 0.55, -6.6, 0, () => { c.sound.ticket(); c.egg('narcissus', 'Narcissus Garden, Venice, 1966: about 1,500 mirror balls on the lawn, uninvited, sold for 1,200 lire each, about two dollars, until officials stopped her. In 2018 it went to Fort Tilden in the Rockaways, in an old train garage.'); }, 'Buy a mirror ball', { w: 2.2, h: 0.26, bg: '#ffffff', fg: '#d8102a' });
    sign.rotation.x = -0.5;
  },
  // King Pleasure (2022) rebuilt the Palladium's Michael Todd Room around his two 1985 paintings: a booth under the mural
  basquiat_c(c, r, g, X) {
    const { THREE } = c, vel = std(c, 0x5a0a1a, { roughness: 0.9 }), brass = std(c, 0xc9a033, { metalness: 1, roughness: 0.3 });
    g.add(c.slab(3.4, 0.45, 0.8, vel, 18.0, 0.22, -7.2)); g.add(c.slab(3.4, 0.9, 0.2, vel, 18.0, 0.7, -7.65)); g.add(c.slab(1.2, 0.05, 0.7, brass, 18.0, 0.72, -6.3)); g.add(c.slab(0.08, 0.7, 0.08, brass, 18.0, 0.36, -6.3)); c.post(X(18.0), -6.9, 1.4);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,60,120,.35)'), transparent: true, depthWrite: false, toneMapped: false })); glow.scale.set(5, 3, 1); glow.position.set(18, 3.6, -7.5); g.add(glow);
    c.tick((t, dt, P, ri) => { if (here(r, ri)) glow.material.opacity = 0.7 + Math.sin(t * 2.2) * 0.3; });
    const plate = button(c, g, 'THE MICHAEL TODD ROOM · PALLADIUM · 1985', 18.0, 4.55, -D / 2 + 0.04, 0, () => c.egg('michaeltodd', 'The Palladium opened on 14th Street in 1985 with two of his paintings in the VIP room, the Michael Todd Room. In 2022 his family\'s show King Pleasure, in Chelsea, rebuilt the room and hung them again.'), 'A brass plate', { w: 3.0, h: 0.24, bg: '#140a0c', fg: '#e8c060' });
  },
  // The Broad, 2023: a black lit club room playing his own tapes off the reel. Press play: black light, the line goes
  // every colour, dancers on the walls take a new pose on every beat, the floor lights up.
  haring_c(c, r, g, X, mats) {
    const { THREE } = c, booth = new THREE.Group(); booth.position.set(17.4, 0, 6.2); booth.rotation.y = -PI / 2; g.add(booth);
    booth.add(c.slab(1.8, 1.0, 0.7, std(c, 0x111111, { roughness: 0.4 }), 0, 0.5, 0)); c.post(X(17.4), 6.2, 1.0);
    const reels = []; for (const dx of [-0.45, 0.45]) { const rl = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 24), std(c, 0x9a9a9a, { metalness: 0.9, roughness: 0.3 })); rl.rotation.x = PI / 2; rl.position.set(dx, 1.32, -0.1); booth.add(rl); reels.push(rl); booth.add(c.slab(0.02, 0.32, 0.02, std(c, 0x333333), dx, 1.16, -0.1)); }
    const DN = 6, dancers = []; const spots = [[0.16, 4.3, -4.5, PI / 2], [0.16, 4.3, 0.2, PI / 2], [EXW - 0.03, 4.3, -4.5, -PI / 2], [EXW - 0.03, 4.3, 0.2, -PI / 2], [6.5, 4.3, -D / 2 + 0.05, 0], [13.5, 4.3, -D / 2 + 0.05, 0]];
    spots.forEach(([x, y, z, ry], k) => { const b = board(c, g, 1.4, 1.4, 256); b.m.material.transparent = true; b.m.position.set(x, y, z); b.m.rotation.y = ry; dancers.push(b); });
    const pose = (k, j) => { const b = dancers[k], { q, W: w, H: h } = b; q.clearRect(0, 0, w, h); haringFigure(q, w / 2, h * 0.62, h * 0.4, POSES[(j + k) % 6], ['#ff2a5a', '#ffd400', '#22a0ff', '#20c060', '#ff7a1a', '#c040ff'][k]); b.up(); };
    dancers.forEach((b, k) => pose(k, 0));
    const tiles = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }), 60), o = new THREE.Object3D(), col = new THREE.Color();
    for (let i = 0; i < 60; i++) { o.position.set(6.85 + (i % 10) * 0.7, 0.016, 0.6 + Math.floor(i / 10) * 0.7); o.rotation.set(-PI / 2, 0, 0); o.updateMatrix(); tiles.setMatrixAt(i, o.matrix); tiles.setColorAt(i, col.setHex(0x000000)); } tiles.visible = false; g.add(tiles);
    let on = false, beat = -1; const wallM = mats.wall, keepE = wallM.emissive.clone();
    const set = (v) => { on = v; tiles.visible = v; if (v) { wallM.emissive = new THREE.Color(0x7a6aff); wallM.emissiveMap = wallM.map; wallM.emissiveIntensity = 0.55; c.FX.dots = 0; } else { wallM.emissive.copy(keepE); wallM.emissiveMap = null; restoreLights(c, r); } wallM.needsUpdate = true; };
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) { if (on) set(false); return; } reels.forEach((rl) => { rl.rotation.y += dt * (on ? 4 : 0); }); if (!on) return;
      c.lights[0].color.set(0x5a2aff); c.lights[1].color.set(0x8a2aff); c.lights[0].userData.i = 8; c.lights[1].userData.i = 8;
      const b = Math.floor(t * 2.1); if (b !== beat) { beat = b; dancers.forEach((d, k) => pose(k, b)); for (let i = 0; i < 60; i++) tiles.setColorAt(i, col.setHSL(((i * 7 + b * 13) % 60) / 60, 1, Math.random() < 0.45 ? 0.5 : 0)); tiles.instanceColor.needsUpdate = true; } });
    button(c, booth, 'PRESS PLAY', 0, 1.05, 0.36, 0, () => { set(!on); if (on) c.egg('blacklight', 'The Broad\'s 2023 show Art Is for Everybody had a black lit room that played his own mixtapes off the reel. He danced at the Paradise Garage on King Street most weekends. This booth plays what it can.'); else c.toast('Lights up.', 1600); }, 'Press play', { w: 1.1, h: 0.24, bg: '#000', fg: '#ff2a5a' }).rotation.x = -0.6;
  },
  // Sumida Hokusai Museum shows the print made block by block: pull the baren, one block per pull
  hokusai_c(c, r, g, X) {
    const { THREE } = c, V = (window.VAULT || {}).hokusai; if (!V) return;
    const it = V.items[17 % V.items.length], wood = std(c, 0x5a3a20, { roughness: 0.6 });
    g.add(c.slab(2.4, 0.08, 1.2, wood, 10, 0.86, -5.5)); for (const [dx, dz] of [[-1.1, -0.5], [1.1, -0.5], [-1.1, 0.5], [1.1, 0.5]]) g.add(c.slab(0.08, 0.84, 0.08, wood, 10 + dx, 0.42, -5.5 + dz)); c.post(X(10), -5.5, 1.3);
    const sheet = stagedArt(c, `assets/vault/hokusai/${it[3]}`, 1.9, 1.07, 0); sheet.rotation.x = -PI / 2 + 0.55; sheet.position.set(10, 1.25, -5.55); g.add(sheet);
    const bd = c.slab(2.0, 1.15, 0.03, wood, 10, 1.235, -5.57); bd.rotation.x = -PI / 2 + 0.55; g.add(bd);
    const baren = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 24), std(c, 0x2a1a0a, { roughness: 0.8 })); baren.position.set(11.5, 0.94, -5.1); g.add(baren);
    const STEPS = ['Pull one: the key block. Only the black line, cut by a carver from the artist\'s drawing.', 'Pull two: the blue. Prussian blue, imported and new in the 1830s, is what made the Wave look the way it does.', 'Pull three: the other colours, one block each, every one lined up by a notch in the corner.', 'Pull four: the full impression. Thousands were pulled; about two hundred of the first printing of the Wave survive.'];
    let k = 0, want = 0; c.tick((t, dt) => { const u = sheet.userData.u.uStage; u.value += (want - u.value) * Math.min(1, dt * 2.5); });
    const pull = () => { if (k >= 4) { k = 0; want = 0; c.toast('A fresh sheet.', 1500); return; } want = ++k; c.sound.click && c.sound.click(); c.toast(STEPS[k - 1], 4200); c.speak(STEPS[k - 1]); if (k === 4) c.egg('woodblock', 'You pulled a print the way his printers did: a key block for the line, then one block per colour. The Sumida Hokusai Museum in Tokyo shows the Wave made exactly this way. ' + 'Here the picture is one of MLow\'s New Yorkers, ' + it[1] + '.'); };
    c.clickable(baren, pull, 'Pull the next block'); c.clickable(sheet, pull, 'Pull the next block');
    notice(c, g, 'THE PRESS · PULL THE BAREN', 10, 1.7, -6.18, 0, 1.8, 0.2, '#f2e8d0', '#1a1a1a');
  },
  // the loupe on one portrait, and one of his Mirrors: a painted mirror that reflects nothing
  lichtenstein_c(c, r, g, X) {
    const { THREE } = c, p = (r.hung || []).find((q) => Math.abs(q.group.position.x - 0.14) < 0.05 && Math.abs(q.group.position.z + 3.9) < 0.05);
    loupe(c, r, g, X, p);
    if (p) { const tag = notice(c, g, 'HOLD STILL · THE LENS SHOWS THE DOTS', 0.2, 0.82, -3.9, PI / 2, 1.3, 0.16, '#fff', '#1d4ed8'); c.clickable(tag, () => c.egg('loupe', 'Under the lens every colour is three sizes of dot and the white of the paper. His paintings took the cheap printing of comics and blew it up to the size of a wall.'), 'A label'); }
    const mt = c.canvasTex(256, 384, (q, w, h) => { const gr = q.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#e8f0f8'); gr.addColorStop(0.5, '#9ab0c8'); gr.addColorStop(1, '#dce8f4'); q.fillStyle = gr; q.beginPath(); q.ellipse(w / 2, h / 2, w * 0.46, h * 0.46, 0, 0, 7); q.fill(); q.fillStyle = '#5a7aa0'; for (let y = 0; y < h; y += 12) for (let x = (y / 12) % 2 ? 6 : 0; x < w; x += 12) { const d = Math.hypot(x - w * 0.3, y - h * 0.35) / w; const rr = Math.max(0, 4 - d * 6); if (rr > 0.4) { q.beginPath(); q.arc(x, y, rr, 0, 7); q.fill(); } } q.strokeStyle = '#111'; q.lineWidth = 10; q.beginPath(); q.ellipse(w / 2, h / 2, w * 0.46, h * 0.46, 0, 0, 7); q.stroke(); });
    const mir = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.65), new THREE.MeshStandardMaterial({ map: mt, transparent: true, roughness: 0.2, metalness: 0.2 })); mir.position.set(18.0, 2.0, -D / 2 + 0.06); g.add(mir);
    let seen = 0; c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; if (Math.abs(P.x - r.x0 - 18) < 0.9 && P.z < -5.6) { seen += dt; if (seen > 2 && seen < 2.1) c.egg('mirrors', 'One of his Mirrors, 1969 to 1972: a mirror painted the way comics draw a mirror. You stood in front of it and it showed you nothing at all. That was the work.'); } });
  },
  // the Mae West Room (Figueres, from 1974): from one spot, through one lens, the furniture is a face. Here the face is
  // a New Yorker's, and its eyes are two of MLow's portraits.
  dali_c(c, r, g, X) {
    const { THREE } = c, fz = -2.65, wx = EXW - 0.02;
    const brick = std(c, 0xd8c8b0, { roughness: 0.85 }), dark = std(c, 0x1a1210, { roughness: 0.9 });
    g.add(c.slab(0.55, 2.1, 0.95, brick, wx - 0.27, 1.05, fz)); g.add(c.slab(0.6, 0.5, 0.5, dark, wx - 0.3, 0.3, fz)); g.add(c.slab(0.7, 0.08, 1.15, std(c, 0xf4ece0), wx - 0.36, 1.12, fz));
    for (const s2 of [-1, 1]) g.add(c.slab(0.3, 0.25, 0.25, brick, wx - 0.55, 0.14, fz + s2 * 0.32));
    const red = new THREE.MeshStandardMaterial({ color: 0xd0102a, roughness: 0.25, metalness: 0.1 });
    const lip = (sx, sy, sz, x, y, z) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.5, 28, 18), red); m.scale.set(sx, sy, sz); m.position.set(x, y, z); g.add(m); return m; };
    const lx = wx - 1.6; lip(0.9, 0.42, 1.3, lx, 0.32, fz); lip(0.8, 0.46, 0.85, lx + 0.05, 0.62, fz - 0.42); lip(0.8, 0.46, 0.85, lx + 0.05, 0.62, fz + 0.42); c.post(X(lx), fz, 1.0);
    const hairM = new THREE.MeshStandardMaterial({ color: 0xd8b060, roughness: 0.7, side: THREE.DoubleSide });
    for (const zc of [fz - 2.55, fz + 2.55]) { const geo = new THREE.PlaneGeometry(1.5, 5.4, 18, 1), pa = geo.attributes.position; for (let i = 0; i < pa.count; i++) pa.setZ(i, Math.sin(pa.getX(i) * 9) * 0.12); geo.computeVertexNormals(); const cu = new THREE.Mesh(geo, hairM); cu.rotation.y = -PI / 2; cu.position.set(wx - 0.25, 2.75, zc); g.add(cu); }
    const val = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.0, 30, 1), hairM); { const pa = val.geometry.attributes.position; for (let i = 0; i < pa.count; i++) pa.setZ(i, Math.sin(pa.getX(i) * 4) * 0.1 + (pa.getY(i) < 0 ? 0.08 : 0)); val.geometry.computeVertexNormals(); } val.rotation.y = -PI / 2; val.position.set(wx - 0.3, 5.4, fz); g.add(val);
    // the viewing step and the lens, where he would have made you stand
    const V = { x: 9.6, z: fz }; g.add(c.slab(1.2, 0.18, 1.2, std(c, 0x8a6a4a), V.x, 0.09, V.z));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 10, 40), std(c, 0xc9a033, { metalness: 1, roughness: 0.3 })); ring.rotation.y = PI / 2; ring.position.set(V.x + 0.7, 1.62, V.z); g.add(ring);
    g.add(c.slab(0.04, 1.2, 0.04, std(c, 0xc9a033, { metalness: 1 }), V.x + 0.7, 0.6, V.z - 0.45));
    standHere(c, g, V.x - 0.1, V.z + 0.9, 'THE FACE', '#d0102a');
    let told = false; c.tick((t, dt, P, ri) => { if (told || !here(r, ri)) return; if (near(r, P, V.x, V.z, 0.6) && looking(c, r, wx, fz, 0.96)) { told = true; c.egg('maewest', 'The Mae West Room in Figueres, begun in 1974 with Oscar Tusquets: you climb to one spot and look through a lens, and a sofa becomes lips, a fireplace a nose, two paintings the eyes and the curtains her hair. Here the eyes are two of MLow\'s New Yorkers.'); c.speak('There. A sofa for lips, a fireplace for a nose, two portraits for eyes.'); } });
    // the host, who takes a selfie with you (the Dali Museum's Dali Lives, 2019, did it with an AI Dali)
    const host = extra(c, g, 1.3, 6.6, { col: 0x1a1a2a, ry: -PI / 2, pool: 'dressy' }); c.post(X(1.3), 6.6, 0.3);
    c.clickable(host, () => { c.flash(0.5); c.sound.ticket && c.sound.ticket(); c.say(host, 'Hold still. One for the museum.', 2600, 2.0); c.egg('dalilives', 'Dali Lives, at the Dali Museum in Florida in 2019: an AI Dali greeted visitors in 125 videos and ended by taking a selfie with them. This host has an eye flower and no AI, and still took one.'); }, 'The host');
  },
  // the Exploding Plastic Inevitable (the Dom, 23 St Marks Place, April 1966): a mirror ball, coloured light, the screens
  // cycling inks to the beat; and the Time Capsules: open a box and a New Yorker from the vault is inside
  warhol_c(c, r, g, X) {
    const { THREE } = c, mb = mirrorBall(c, r, g, X, { x: 10, y: 5.2, z: -1.5 }); mb.state.on = 0;
    let on = false; const inks = (r.hung || []).map((p) => p.mesh.material.userData.ink).filter(Boolean);
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) { if (on) { on = false; mb.state.on = 0; restoreLights(c, r); } return; } mb.state.on += ((on ? 1 : 0) - mb.state.on) * Math.min(1, dt * 3); mb.state.spin = on ? 0.6 : 0.15; if (!on) return;
      const b = Math.floor(t * 2.3); c.lights[0].color.setHSL((b * 0.17) % 1, 1, 0.55); c.lights[1].color.setHSL((b * 0.17 + 0.5) % 1, 1, 0.55); inks.forEach((u, k) => { u.value += (b % 2 ? 0.06 : 0.02); }); });
    button(c, g, 'PLAY THE INEVITABLE', 1.45, 3.6, -D / 2 + 0.04, 0, () => { on = !on; if (on) c.egg('inevitable', 'April 1966, the Dom, 23 St Marks Place: the Exploding Plastic Inevitable. The Velvet Underground and Nico played under his films, coloured lights and a mirror ball, in a hall he rented for the month. The same month, uptown, Castelli had the cows and the clouds.'); else restoreLights(c, r); }, 'Play the Inevitable', { w: 1.8, h: 0.26, bg: '#000', fg: '#ff4fa3' });
    const V = (window.VAULT || {}).warhol, card = new THREE.MeshStandardMaterial({ color: 0xb08a5a, roughness: 0.9 }), lidM = new THREE.MeshStandardMaterial({ color: 0xa07a4a, roughness: 0.9 });
    let opened = 0;
    for (let i = 0; i < 12; i++) { const x = 15.8 + (i % 4) * 0.62, y = 0.22 + Math.floor(i / 4) * 0.44, z = 6.9 + (Math.floor(i / 4) % 2) * 0.05;
      const bx = c.slab(0.58, 0.42, 0.5, card, x, y, z); g.add(bx); const lid = c.slab(0.6, 0.03, 0.52, lidM, x, y + 0.225, z); g.add(lid);
      const tc = c.sign(`TC ${37 + i * 41}`, { w: 0.3, h: 0.08, bg: '#f4ead2', fg: '#111', font: c.MONO, weight: 800, px: 64 }); tc.position.set(x, y, z + 0.252); g.add(tc);
      c.clickable(bx, () => { if (!V) return; const k = (i * 37 + opened * 11) % V.items.length, it = V.items[k]; opened++; lid.rotation.x = -1.2; lid.position.z = z - 0.2; lid.position.y = y + 0.35;
        const items = V.items.map(([n, tt, hh, f, im]) => ({ n, t: tt, h: hh, f, i: im, g: 'warhol', vault: true, ll: LABEL_C.warhol }));
        c.openPiece(items[k], items, k); if (opened === 1) c.egg('timecapsule', 'From 1974 to 1987 he swept his days into cardboard boxes, sealed them and called them Time Capsules, about six hundred of them. Some have been opened live in front of an audience. These hold New Yorkers.'); }, 'Open a time capsule'); }
    c.post(X(16.7), 6.9, 1.4);
  },
  // the immersive shows (Pier 36, 2021): lights down and the hall floods with moving pictures, and the originals vanish
  // under them. Plus the letters, in his own words, on a desk.
  vangogh_c(c, r, g, X) {
    const { THREE } = c, at = c.tex.load('assets/vault/atlas_vangogh.jpg'); at.colorSpace = THREE.SRGBColorSpace; at.wrapS = at.wrapT = THREE.MirroredRepeatWrapping;
    const u = { map: { value: at }, uT: { value: 0 }, uA: { value: 0 } };
    const m = new THREE.ShaderMaterial({ uniforms: u, side: THREE.BackSide, transparent: true, depthWrite: false, toneMapped: false,
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: `uniform sampler2D map; uniform float uT, uA; varying vec3 vP;
        void main(){ vec2 p = abs(vP.y) > 2.9 ? vP.xz : (abs(vP.x) > 9.5 ? vP.zy : vP.xy); p *= .06;
          for (int i = 0; i < 3; i++) { p += .04 * vec2(sin(p.y * 6. + uT * .6 + float(i)), cos(p.x * 6. - uT * .5)); }
          vec3 c = texture2D(map, p + vec2(uT * .01, uT * .004)).rgb * 1.25; gl_FragColor = vec4(c, uA);
          #include <colorspace_fragment>
        }` });
    const box = new THREE.Mesh(new THREE.BoxGeometry(19.3, 5.9, 15.6), m); box.position.set(W / 2 - 0.15, 2.96, 0); box.renderOrder = 10; box.visible = false; g.add(box);
    let on = false; c.tick((t, dt, P, ri) => { if (!here(r, ri)) { if (on) { on = false; box.visible = false; u.uA.value = 0; restoreLights(c, r); } return; } u.uT.value = t; u.uA.value += ((on ? 0.86 : 0) - u.uA.value) * Math.min(1, dt * 1.5); box.visible = u.uA.value > 0.01; if (on) { c.lights.forEach((l) => { l.userData.i = 1; }); } });
    button(c, g, 'LIGHTS DOWN · THE IMMERSIVE VERSION', 15.0, 0.75, 7.86, PI, () => { on = !on; if (on) { c.speak('This is how the immersive shows did it. Every picture moves, and none of them is real. Turn the lights back up to see the portraits.'); c.egg('immersive', 'Immersive Van Gogh opened at Pier 36 on South Street in June 2021 and drew about 800,000 people that summer, walking through projections with no paintings in the room. The Starry Night was a mile and a half away at MoMA the whole time.'); } else restoreLights(c, r); }, 'Lights down', { w: 2.6, h: 0.26, bg: '#0a1030', fg: '#ffd040' });
    const desk = new THREE.Group(); desk.position.set(17.4, 0, 6.9); desk.rotation.y = PI; g.add(desk); const oak = std(c, 0x6a4628, { roughness: 0.6 });
    desk.add(c.slab(1.4, 0.06, 0.7, oak, 0, 0.76, 0)); for (const [dx, dz] of [[-0.62, -0.28], [0.62, -0.28], [-0.62, 0.28], [0.62, 0.28]]) desk.add(c.slab(0.05, 0.74, 0.05, oak, dx, 0.37, dz)); c.post(X(17.4), 6.9, 0.8);
    const LET = [['Letter 155, to Theo, June 1880', 'Someone has a great fire in his soul and nobody ever comes to warm themselves at it, and passers-by see nothing but a little smoke at the top of the chimney.'], ['Letter 638, to Theo, Arles, July 1888', 'The sight of the stars always makes me dream.'], ['Letter 902, to Theo, Auvers, July 23, 1890, the last he sent', 'I risk my life for it, and my reason has half foundered.']];
    LET.forEach(([who, line], k) => { const sh = c.sign(who.toUpperCase(), { w: 0.36, h: 0.48, bg: '#f2e8d0', fg: '#3a2a1a', font: c.SERIF, weight: 600, px: 96 }); sh.rotation.x = -PI / 2; sh.rotation.z = (k - 1) * 0.2; sh.position.set((k - 1) * 0.42, 0.8, 0); desk.add(sh);
      c.clickable(sh, () => { c.toast(`${who}: ${line}`, 6000); c.speak(line, true); if (k === 2) c.egg('lastletter', '903 of his letters survive, 820 of them written by him, most to his brother Theo. The last one he sent was dated July 23, 1890. Four days later he shot himself, and died on the 29th.'); }, 'Read a letter'); });
    notice(c, g, 'IN HIS OWN WORDS · THE LETTERS', 17.4, 1.15, 7.3, PI, 1.4, 0.16, '#f2e8d0', '#3a2a1a');
  },
  // Dora Maar photographed Guernica 28 times as it was made, May to June 1937: walk toward the easel and it is made
  picasso_c(c, r, g, X) {
    const { THREE } = c, V = (window.VAULT || {}).picasso; if (!V) return; const it = V.items[44 % V.items.length];
    const art = stagedArt(c, `assets/vault/picasso/${it[3]}`, 2.6, 1.46, 1); art.position.set(10, 1.75, -5.35); g.add(art);
    const wood = std(c, 0x6a4a2a, { roughness: 0.6 }); g.add(c.slab(2.75, 0.06, 0.08, wood, 10, 1.0, -5.4)); for (const s2 of [-1, 1]) { const leg = c.slab(0.07, 2.9, 0.07, wood, 10 + s2 * 1.1, 1.45, -5.55); leg.rotation.x = 0.1; g.add(leg); }
    let done = false; c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; const d = Math.hypot(P.x - r.x0 - 10, P.z + 5.35), want = Math.max(0, Math.min(4, (9.5 - d) / 1.5)); const u = art.userData.u.uStage; u.value += (want - u.value) * Math.min(1, dt * 1.2); if (!done && u.value > 3.9) { done = true; c.egg('doramaar', 'Dora Maar photographed Guernica as he worked on it, May to June 1937, twenty eight photographs of a picture changing its mind. Guernica was the last thing in MoMA\'s 1939 show. This canvas is one of MLow\'s New Yorkers, ' + it[1] + ', worked up the same way.'); } });
    const cap = notice(c, g, 'WALK CLOSER · IT IS MADE AS YOU COME', 10, 0.75, -5.32, 0, 1.6, 0.16, '#f4f0e8', '#1a1a1a');
  },
  // Better Out Than In had a phone number for the audio guide (2013); Sotheby's had a frame with a shredder (2018); and
  // Bristol (2009) had works hidden among the collection. The rats are hidden in every gallery.
  banksy_c(c, r, g, X) {
    const { THREE } = c, ph = c.glb('ts_payphone', { h: 1.9, x: 0.45, z: 0.6, ry: PI / 2, parent: g }); c.post(X(0.45), 0.6, 0.4);
    const LINES = ['Welcome to the audio guide. You are standing in a thrift shop. The shop is the artwork. So are you, for now. Press one for more information. There is no more information.', 'In this room, frames have been hung on walls. Experts believe this is to stop them falling on the floor. The prices change when you are not looking, much like the art market.', 'Thank you for calling. Please do not touch the artwork, unless you are buying it, in which case please touch it a lot.'];
    let call = 0; c.clickable(ph, () => { c.sound.bell && c.sound.bell(); c.speak(LINES[call % LINES.length], true); c.toast('On the line: the audio guide.', 2400); if (call++ === 0) c.egg('hotline', 'In October 2013 every piece of Better Out Than In came with a phone number, 1-800-656-4271, for an audio guide that sounded like a museum and said very little. Pick up again for the next stop.'); }, 'Call the audio guide');
    const p = (r.hung || []).find((q) => Math.abs(q.group.position.x - 3.7) < 0.05);
    const go = shredder(c, r, g, X, p);
    if (go) { const gv = button(c, g, 'SOLD · TAP TO CONFIRM', 3.7, 0.55, D / 2 - 0.4, PI, () => { go(); c.sound.ticket && c.sound.ticket(); c.egg('shredded', 'Sotheby\'s, London, October 2018: Girl with Balloon sold for over a million pounds and, as the hammer fell, a shredder hidden in the frame cut half of it into strips. Renamed Love is in the Bin, it sold again in 2021 for eighteen and a half million.'); }, 'Confirm the sale', { w: 1.5, h: 0.24, bg: '#c8102e', fg: '#ffffff' }); gv.rotation.x = -0.5; }
    const RN = c.sign('TEN RATS HIDE IN THESE GALLERIES', { w: 2.0, h: 0.2, bg: '#111', fg: '#f4ead2', font: c.MONO, weight: 800, px: 96 }); RN.position.set(18.0, 3.3, -D / 2 + 0.04); g.add(RN);
  },
};
for (const [id, fn] of Object.entries(EX)) { const base = ROOM[id]; ROOM[id] = (c, r, g, X, mats) => { base(c, r, g, X, mats); fn(c, r, g, X, mats); }; }

// Banksy versus Bristol Museum (2009) hid more than a hundred works among the collection. Here a small stencilled rat
// is hidden in every gallery; find them all. One per gallery, in a place you would not hang anything.
const RATS = { kusama_b: [19.6, 0.3, 7.2, -PI / 2], basquiat_a: [0.14, 0.4, -7.6, PI / 2], haring_a: [10.5, 0.35, 7.86, PI], hokusai_c: [0.14, 0.3, 7.6, PI / 2], lichtenstein_b: [19.6, 0.4, -7.0, -PI / 2], dali_c: [12.0, 0.3, 7.86, PI], warhol_a: [0.14, 0.3, 6.9, PI / 2], vangogh_b: [19.6, 0.35, 6.5, -PI / 2], picasso_c: [0.14, 0.3, -7.5, PI / 2], banksy_a: [19.6, 0.3, -7.2, -PI / 2] };
const RATTEX = {};
for (const [id, [x, y, z, ry]] of Object.entries(RATS)) { const base = ROOM[id]; ROOM[id] = (c, r, g, X, mats) => { base(c, r, g, X, mats);
  RATTEX.t ||= c.canvasTex(256, 128, (q, w, h) => { q.fillStyle = '#111'; q.beginPath(); q.ellipse(w * 0.45, h * 0.62, w * 0.22, h * 0.2, 0, 0, 7); q.fill(); q.beginPath(); q.ellipse(w * 0.7, h * 0.55, w * 0.09, h * 0.12, 0.3, 0, 7); q.fill(); q.beginPath(); q.arc(w * 0.74, h * 0.4, w * 0.035, 0, 7); q.fill(); q.lineWidth = 6; q.strokeStyle = '#111'; q.beginPath(); q.moveTo(w * 0.25, h * 0.66); q.bezierCurveTo(w * 0.05, h * 0.7, w * 0.08, h * 0.95, w * 0.2, h * 0.9); q.stroke(); q.fillStyle = 'rgba(17,17,17,.6)'; q.fillRect(w * 0.42, h * 0.8, 4, h * 0.15); q.fillRect(w * 0.55, h * 0.82, 3, h * 0.12); });
  const m = new c.THREE.Mesh(new c.THREE.PlaneGeometry(0.42, 0.21), new c.THREE.MeshStandardMaterial({ map: RATTEX.t, transparent: true, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2 })); m.position.set(x, y, z); m.rotation.y = ry; g.add(m);
  c.clickable(m, () => { let f = []; try { f = JSON.parse(localStorage.getItem('tsoc.rats') || '[]'); } catch (e) {} if (!f.includes(id)) f.push(id); try { localStorage.setItem('tsoc.rats', JSON.stringify(f)); } catch (e) {} c.sound.squeak && c.sound.squeak(); c.toast(`A rat. ${f.length} of ${Object.keys(RATS).length} found.`, 2600); if (f.length === 1) c.egg('firstrat', 'In 2009 Banksy versus Bristol Museum hid more than a hundred works among the permanent collection, so visitors went round looking for them. There are ten rats hidden in these galleries.'); if (f.length === Object.keys(RATS).length) c.egg('allrats', 'All ten. The Bristol show drew more than 300,000 people in under three months, most of them looking for exactly this.'); }, 'Something on the wall'); }; }


// ---------- THE FINALE: Luna Luna ----------
// In 1987 Andre Heller opened Luna Luna in Hamburg, an amusement park whose rides were made by artists. It sat in
// shipping containers for decades and came back at The Shed in Hudson Yards, November 2024 to March 2025. Basquiat
// made the Ferris wheel, Haring the carousel, Lichtenstein a glass labyrinth, Dali a mirrored dome. Here they turn, and
// MLow's New Yorkers ride them: the gondolas and the carousel figures open their own cards.
ROOM.luna_luna = (c, r, g, X, mats) => {
  const { THREE } = c, VA = window.VAULT || {}, items = (st) => (VA[st]?.items || []).map(([n, t, h, f, i]) => ({ n, t, h, f, i, g: st, vault: true, ll: LABEL_C[st] || '' }));
  const bulbs = []; const bulbM = new THREE.MeshBasicMaterial({ color: 0xffd890, toneMapped: false }), bg = new THREE.SphereGeometry(0.045, 8, 6);
  const bulb = (parent, x, y, z) => { const b = new THREE.Mesh(bg, bulbM); b.position.set(x, y, z); parent.add(b); bulbs.push(b); };
  // Basquiat's Ferris wheel
  const B = items('basquiat'), wheel = new THREE.Group(); wheel.position.set(4.6, 3.05, -3.6); g.add(wheel);
  const steel = std(c, 0xd8d0c0, { metalness: 0.6, roughness: 0.4 }), red = std(c, 0xc8102e, { roughness: 0.5 });
  wheel.add(new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.06, 8, 64), red)); wheel.add(new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.04, 8, 64), steel));
  for (let k = 0; k < 16; k++) { const a = k / 16 * PI * 2; const sp = c.slab(0.04, 2.55, 0.04, steel, Math.cos(a) * 1.27, Math.sin(a) * 1.27, 0); sp.rotation.z = a - PI / 2; wheel.add(sp); bulb(wheel, Math.cos(a) * 2.55, Math.sin(a) * 2.55, 0.08); }
  for (const s2 of [-1, 1]) { const leg = c.slab(0.12, 3.3, 0.12, red, 4.6 + s2 * 0.9, 1.5, -3.6 - 0.3); leg.rotation.z = s2 * 0.28; g.add(leg); const leg2 = leg.clone(); leg2.position.z = -3.6 + 0.3; g.add(leg2); }
  c.post(X(4.6), -3.6, 1.6);
  const gond = []; for (let k = 0; k < 8; k++) { const it = B[(k * 27) % Math.max(1, B.length)]; if (!it) break; const t = c.tex.load(`assets/vault/basquiat/${it.f}`); t.colorSpace = THREE.SRGBColorSpace;
    const gp = new THREE.Group(); wheel.add(gp); const cab = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.5, 0.45), [std(c, 0xf5c542), std(c, 0xf5c542), std(c, 0x111111), std(c, 0x111111), new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.5 }), new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.5 })]); cab.position.y = -0.35; gp.add(cab);
    gp.add(c.slab(0.02, 0.3, 0.02, steel, 0, -0.05, 0)); const idx = (k * 27) % B.length; c.clickable(cab, () => c.openPiece(B[idx], B, idx), 'A gondola'); gond.push({ gp, a: k / 8 * PI * 2 }); }
  // Haring's carousel
  const H = items('haring'), car = new THREE.Group(); car.position.set(15.4, 0, -3.4); g.add(car);
  car.add(c.slab(4.6, 0.25, 4.6, std(c, 0xffffff, { roughness: 0.6 }), 0, 0.12, 0)); const disc = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.28, 40), std(c, 0xffd400, { roughness: 0.5 })); disc.position.y = 0.14; car.add(disc);
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.2, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0xff2a5a, side: THREE.DoubleSide, roughness: 0.6 })); canopy.position.y = 4.1; car.add(canopy); car.add(c.slab(0.16, 4.0, 0.16, std(c, 0xffffff), 0, 2.0, 0));
  c.post(X(15.4), -3.4, 2.5);
  const spin = new THREE.Group(); car.add(spin); const riders = [];
  for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; const cv = c.canvasTex(256, 320, (q, w, h) => { haringFigure(q, w / 2, h * 0.62, h * 0.33, POSES[k % 6], ['#ff2a5a', '#22a0ff', '#20c060', '#ff7a1a', '#c040ff', '#ffd400', '#ff4fa3', '#22d3ee'][k]); });
    const fig = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.15), new THREE.MeshStandardMaterial({ map: cv, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: cv, emissiveIntensity: 0.3 }));
    const pole = c.slab(0.03, 3.6, 0.03, std(c, 0xd6a640, { metalness: 1, roughness: 0.25 }), Math.cos(a) * 1.8, 2.0, Math.sin(a) * 1.8); spin.add(pole); fig.position.set(Math.cos(a) * 1.8, 1.1, Math.sin(a) * 1.8); fig.rotation.y = -a; spin.add(fig);
    bulb(car, Math.cos(a) * 2.6, 3.5, Math.sin(a) * 2.6); const idx = (k * 23) % Math.max(1, H.length); if (H.length) c.clickable(fig, () => c.openPiece(H[idx], H, idx), 'A rider'); riders.push({ fig, k }); }
  // Lichtenstein's glass labyrinth: dotted glass you can walk between
  const dots = dotTex(c, '#1d4ed8', 'rgba(255,255,255,0)', { n: 10, r: 0.3, rep: 2 }), glassM = new THREE.MeshStandardMaterial({ color: 0xe8f4ff, map: dots, transparent: true, opacity: 0.55, roughness: 0.05, metalness: 0.2, side: THREE.DoubleSide, depthWrite: false });
  const LAB = [[2.0, 1.2, 3.0, 0], [2.0, 3.6, 3.0, 0], [3.5, 2.4, 2.4, PI / 2], [0.5, 4.8, 2.4, PI / 2], [5.0, 4.0, 1.6, PI / 2], [3.0, 6.0, 2.0, 0]];
  LAB.forEach(([x, z, len, ry]) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(len, 2.4), glassM); p.position.set(x + 0.4, 1.2, z); p.rotation.y = ry; g.add(p); const dx = Math.cos(ry) * len / 2, dz = -Math.sin(ry) * len / 2; c.wall(X(x + 0.4 - dx), z - dz, X(x + 0.4 + dx), z + dz); g.add(c.slab(ry ? 0.05 : len, 0.06, ry ? len : 0.05, std(c, 0xffd400), x + 0.4, 2.43, z)); });
  const lsign = button(c, g, 'GLASS LABYRINTH', 2.4, 2.7, 1.2, 0, () => c.egg('glasslab', 'Lichtenstein\'s Glass Labyrinth was built for Luna Luna in 1987 and came back at The Shed in 2024, with music by Philip Glass. Glass by Glass. The puns are free.'), 'The labyrinth', { w: 1.8, h: 0.28, bg: '#ffffff', fg: '#1d4ed8' });
  // Dali's mirrored dome
  const dome = new THREE.Mesh(new THREE.IcosahedronGeometry(1.9, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.03, flatShading: true })); dome.scale.set(1, 0.75, 1); dome.position.set(15.6, 0.9, 3.6); g.add(dome); c.post(X(15.6), 3.6, 2.0);
  c.clickable(dome, () => c.egg('dalidom', 'Dalidom: for Luna Luna Dali made a dome lined with mirrors, so walking in you met yourself from every side. It came back with the rest of the park at The Shed in 2024.'), 'The dome');
  const tix = button(c, g, 'LUNA LUNA · ADMIT ONE', 10, 1.2, 7.86, PI, () => c.egg('lunaluna', 'Luna Luna opened in Hamburg in 1987, an amusement park made by artists, then spent about thirty five years in shipping containers in Texas. It reopened at The Shed in November 2024. Four of the ten artists in these galleries made rides for it.'), 'A ticket', { w: 2.2, h: 0.3, bg: '#c8102e', fg: '#ffd400' });
  const wf = button(c, g, 'BASQUIAT\'S FERRIS WHEEL', 4.6, 0.5, -1.1, 0, () => c.egg('ferris', 'His Ferris wheel for Luna Luna was a 1933 wheel he painted. At The Shed it was for looking at, not riding. Here MLow\'s New Yorkers ride in it: touch a gondola.'), 'The wheel', { w: 1.8, h: 0.24, bg: '#111', fg: '#f5c542' }); wf.rotation.x = -0.5;
  const cf = button(c, g, 'HARING\'S CAROUSEL', 15.4, 0.5, -0.6, 0, () => c.egg('carousel', 'Haring made the carousel for Luna Luna in 1987, his figures standing in for the horses. Here it turns, and MLow\'s New Yorkers ride on the poles: touch one.'), 'The carousel', { w: 1.6, h: 0.24, bg: '#111', fg: '#ff2a5a' }); cf.rotation.x = -0.5;
  c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; wheel.rotation.z = t * 0.12; gond.forEach(({ gp, a }) => { const aa = a + t * 0.12; gp.position.set(Math.cos(a) * 2.4, Math.sin(a) * 2.4, 0.3); gp.rotation.z = -t * 0.12; });
    spin.rotation.y = t * 0.45; riders.forEach(({ fig, k }) => { fig.position.y = 1.1 + Math.sin(t * 2 + k) * 0.25; });
    bulbs.forEach((b, k) => { b.visible = ((k + Math.floor(t * 4)) % 3) !== 0; }); dome.rotation.y = t * 0.05; });
};


// ---------- THE STYLE MACHINE ----------
// The thesis of the whole show in one room. 219 of MLow's New Yorkers were restyled by all ten artists. The big screen
// holds one of them; the console has a button per artist, and the picture dissolves from one hand into the next along a
// noise edge in that artist's colour. The south wall shows the same New Yorker ten times at once. NEXT NEW YORKER pulls
// another. And YOUR WALL: touch an empty frame and it keeps whatever is on the screen, in this browser, until you change it.
const MSTY = ['kusama', 'basquiat', 'haring', 'hokusai', 'lichtenstein', 'dali', 'warhol', 'vangogh', 'picasso', 'banksy'];
const MCOL = { kusama: '#d8102a', basquiat: '#f5c542', haring: '#ff2a5a', hokusai: '#1d4ed8', lichtenstein: '#ffd400', dali: '#c9a033', warhol: '#ff4fa3', vangogh: '#22a0ff', picasso: '#8a8a7a', banksy: '#f4f4f4' };
ROOM.machine = (c, r, g, X, mats) => {
  downlights(c, r, g, { nx: 4, nz: 2, col: 0xe8f0ff });
  const { THREE } = c, VA = window.VAULT || {}, by = {};
  for (const st of MSTY) for (const [n, t, h, f, i] of (VA[st]?.items || [])) { (by[n] ||= { n, t, h, i, f: {} }).f[st] = f; }
  const list = Object.values(by).filter((p) => MSTY.every((st) => p.f[st])); if (!list.length) return;
  g.add(c.slab(PORTAL.w, H_IN, 0.24, mats.wall, W / 2, H_IN / 2, -D / 2 - 0.12));   // a closed north wall: the screen lives here
  const T = {}; const tex = (st, f) => { const k = st + '/' + f; if (!T[k]) { T[k] = c.tex.load(`assets/vault/${st}/${f}`); T[k].colorSpace = THREE.SRGBColorSpace; T[k].anisotropy = 8; } return T[k]; };
  let cur = { p: list[Math.floor(Math.random() * list.length)], st: 'kusama' };
  const u = { uA: { value: tex(cur.st, cur.p.f[cur.st]) }, uB: { value: tex(cur.st, cur.p.f[cur.st]) }, uM: { value: 1 }, uC: { value: new THREE.Color(MCOL.kusama) }, uT: { value: 0 } };
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 4.05), new THREE.ShaderMaterial({ uniforms: u, toneMapped: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform sampler2D uA, uB; uniform float uM, uT; uniform vec3 uC; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      void main(){ float k = .55 * n(vUv * 6.) + .3 * n(vUv * 17.) + .15 * n(vUv * 41.); float e = uM * 1.25 - .12;
        vec3 a = texture2D(uA, vUv).rgb, b = texture2D(uB, vUv).rgb; float t = smoothstep(e - .03, e + .03, k); vec3 o = mix(b, a, t);
        float edge = 1. - smoothstep(0., .05, abs(k - e)); o += uC * edge * 1.6 * step(.001, uM) * step(uM, .999);
        gl_FragColor = vec4(o, 1.);
        #include <colorspace_fragment>
      }` }));
  scr.position.set(W / 2, 3.4, -D / 2 + 0.16); g.add(scr);
  g.add(c.slab(7.6, 4.45, 0.12, std(c, 0x0a0a0a, { metalness: 0.7, roughness: 0.3 }), W / 2, 3.4, -D / 2 + 0.07));
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,255,255,.18)'), transparent: true, depthWrite: false, toneMapped: false })); halo.scale.set(13, 8, 1); halo.position.set(W / 2, 3.4, -D / 2 + 0.05); g.add(halo);
  const cap = board(c, g, 8.0, 0.42, 128); cap.m.position.set(W / 2, 0.98, -D / 2 + 0.16);
  const capDraw = () => { const { q, W: w, H: hh } = cap; q.fillStyle = '#0a0a0a'; q.fillRect(0, 0, w, hh); q.fillStyle = MCOL[cur.st]; q.font = `800 ${hh * 0.5}px ${c.MONO}`; q.textAlign = 'left'; q.fillText((ARTIST_C[cur.st] || '').toUpperCase(), hh * 0.4, hh * 0.65); q.fillStyle = '#f4ead2'; q.textAlign = 'right'; q.font = `700 ${hh * 0.42}px ${c.SERIF}`; q.fillText(`${cur.p.t}  ·  No. ${cur.p.n}${cur.p.h ? '  ·  ' + cur.p.h : ''}`, w - hh * 0.4, hh * 0.64); cap.up(); };
  capDraw();
  const title = c.sign('THE STYLE MACHINE · ONE NEW YORKER, TEN HANDS', { w: 9, h: 0.5, bg: null, fg: '#f4ead2', font: c.SERIF, weight: 900, px: 128 }); title.position.set(W / 2, 5.74, -D / 2 + 0.16); g.add(title);
  const go = (st, p = cur.p) => { if (st === cur.st && p === cur.p) return; u.uA.value = tex(cur.st, cur.p.f[cur.st]); cur = { p, st }; u.uB.value = tex(st, p.f[st]); u.uC.value.set(MCOL[st]); u.uM.value = 0.0001; anim = 1; capDraw(); tiles.forEach((tl) => tl.set()); c.sound.click && c.sound.click(); };
  let anim = 0; c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; u.uT.value = t; if (anim) { u.uM.value = Math.min(1, u.uM.value + dt * 0.75); if (u.uM.value >= 1) { anim = 0; u.uA.value = u.uB.value; } } });
  // the console: ten buttons, a lever
  const desk = new THREE.Group(); desk.position.set(W / 2, 0, -3.4); g.add(desk);
  const dm = std(c, 0x15151a, { metalness: 0.5, roughness: 0.35 }); const top = c.slab(7.4, 0.12, 1.0, dm, 0, 0.92, 0); top.rotation.x = -0.28; desk.add(top); desk.add(c.slab(7.4, 0.86, 0.7, dm, 0, 0.43, 0.1)); c.wall(X(W / 2 - 3.7), -3.0, X(W / 2 + 3.7), -3.0); c.wall(X(W / 2 - 3.7), -3.0, X(W / 2 - 3.7), -3.9); c.wall(X(W / 2 + 3.7), -3.0, X(W / 2 + 3.7), -3.9);
  MSTY.forEach((st, k) => { const x = -3.3 + k * 0.73, btn = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.12, 28), new THREE.MeshStandardMaterial({ color: MCOL[st], emissive: MCOL[st], emissiveIntensity: 0.55, roughness: 0.3 })); btn.position.set(x, 1.02, 0.02); btn.rotation.x = -0.28; desk.add(btn);
    const lb = c.sign(ARTIST_C[st].split(' ').pop().toUpperCase(), { w: 0.66, h: 0.12, bg: null, fg: '#f4ead2', font: c.MONO, weight: 800, px: 64 }); lb.position.set(x, 0.99, 0.36); lb.rotation.x = -PI / 2 + 0.6; desk.add(lb);
    c.clickable(btn, () => { go(st); btn.position.y = 0.98; setTimeout(() => { btn.position.y = 1.02; }, 160); if (!r.pressed) { r.pressed = 1; c.egg('stylemachine', 'One New Yorker, ten hands. MLow made his census portraits, then had them restyled through each of these ten artists: 219 New Yorkers exist in all ten. Every version is in a vault in that artist\'s show hall.'); } }, `Restyle: ${ARTIST_C[st]}`); });
  const lever = new THREE.Group(); lever.position.set(4.2, 0.95, -0.1); desk.add(lever); lever.add(c.slab(0.06, 0.7, 0.06, std(c, 0xc9a033, { metalness: 1, roughness: 0.3 }), 0, 0.35, 0)); const knob = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), new THREE.MeshStandardMaterial({ color: 0xd8102a, roughness: 0.3 })); knob.position.y = 0.72; lever.add(knob);
  desk.add(c.slab(0.5, 0.86, 0.5, dm, 4.2, 0.43, 0.0));
  c.clickable(lever, () => { lever.rotation.x = 0.7; setTimeout(() => { lever.rotation.x = 0; }, 400); const p = list[Math.floor(Math.random() * list.length)]; go(cur.st, p); c.toast(`${p.t}, No. ${p.n}. Now press an artist.`, 2400); }, 'Next New Yorker');
  const ll = c.sign('NEXT NEW YORKER', { w: 0.9, h: 0.14, bg: '#111', fg: '#d8102a', font: c.MONO, weight: 800, px: 64 }); ll.position.set(4.2, 0.92, 0.3); ll.rotation.x = -PI / 2 + 0.6; desk.add(ll);
  // the south wall: the same New Yorker in all ten hands at once
  const tiles = MSTY.map((st, k) => { const x = 2.2 + (k % 5) * 3.9, y = k < 5 ? 3.55 : 1.55, m = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.91), new THREE.MeshBasicMaterial({ toneMapped: false })); m.position.set(x, y, D / 2 - 0.14); m.rotation.y = PI; g.add(m);
    const fr = c.slab(3.56, 2.07, 0.06, std(c, 0x0a0a0a), x, y, D / 2 - 0.1); g.add(fr);
    const lb = c.sign(ARTIST_C[st].toUpperCase(), { w: 2.0, h: 0.16, bg: '#0a0a0a', fg: MCOL[st], font: c.MONO, weight: 800, px: 64 }); lb.position.set(x, y - 1.1, D / 2 - 0.15); lb.rotation.y = PI; g.add(lb);
    const tl = { set() { m.material.map = tex(st, cur.p.f[st]); m.material.needsUpdate = true; } }; tl.set(); c.clickable(m, () => go(st), `Restyle: ${ARTIST_C[st]}`); return tl; });
  // YOUR WALL: eight frames each side, kept in this browser
  let mine = {}; try { mine = JSON.parse(localStorage.getItem('tsoc.yourwall') || '{}'); } catch (e) {}
  const slots = []; for (const [x, ry] of [[0.16, PI / 2], [EXW, -PI / 2]]) for (const z of [-6.6, -4.4, -2.2, 0.0]) slots.push([x, z, ry]);
  slots.forEach(([x, z, ry], k) => { const grp = new THREE.Group(); grp.position.set(x, 2.1, z); grp.rotation.y = ry; g.add(grp);
    const fr = c.slab(1.72, 1.02, 0.06, std(c, 0xc9a033, { metalness: 0.9, roughness: 0.3 }), 0, 0, 0.03); grp.add(fr);
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.9), new THREE.MeshBasicMaterial({ color: 0x1a1a1e, toneMapped: false })); pic.position.z = 0.065; grp.add(pic);
    const lab = board(c, g, 1.4, 0.16, 96); g.remove(lab.m); lab.m.position.set(0, -0.62, 0.05); grp.add(lab.m);
    const show = () => { const m2 = mine[k]; const { q, W: w, H: hh } = lab; q.fillStyle = '#f2ead8'; q.fillRect(0, 0, w, hh); q.fillStyle = '#1b1b1b'; q.font = `600 ${hh * 0.5}px ${c.MONO}`; q.textAlign = 'center'; q.fillText(m2 ? `${m2.t} · ${ARTIST_C[m2.st]}` : 'EMPTY · TOUCH TO HANG THE SCREEN', w / 2, hh * 0.66); lab.up();
      if (m2) { pic.material.map = tex(m2.st, m2.f); pic.material.color.set(0xffffff); } else { pic.material.map = null; pic.material.color.set(0x1a1a1e); } pic.material.needsUpdate = true; };
    show(); c.clickable(pic, () => { mine[k] = { st: cur.st, f: cur.p.f[cur.st], t: cur.p.t, n: cur.p.n }; try { localStorage.setItem('tsoc.yourwall', JSON.stringify(mine)); } catch (e) {} show(); c.sound.ticket && c.sound.ticket(); if (Object.keys(mine).length === 1) c.egg('yourwall', 'You hung one. Every MLow gallery hangs art the visitor chooses somewhere; this wall is yours and stays in this browser. Fill all eight and you have curated a show in ten hands.'); }, 'Hang the screen here');
    const sign = c.sign('YOUR WALL', { w: 1.2, h: 0.2, bg: null, fg: '#c9a033', font: c.MONO, weight: 800, px: 64 }); if (k % 4 === 0) { sign.position.set(0, 0.75, 0.05); grp.add(sign); } });
  // the floor: a ring of ten colours under the console, the artists in order
  MSTY.forEach((st, k) => { const a = k / 10 * PI * 2, d = decal(c, 1.1, 1.1, (q, w, hh) => { q.fillStyle = MCOL[st]; q.beginPath(); q.arc(w / 2, hh / 2, w * 0.45, 0, 7); q.fill(); q.fillStyle = '#0a0a0a'; q.font = `900 ${w * 0.22}px ${c.SERIF}`; q.textAlign = 'center'; q.fillText(String(k + 1), w / 2, hh * 0.58); }); d.rotation.x = -PI / 2; d.position.set(W / 2 + Math.sin(a) * 2.6, 0.013, 2.0 + Math.cos(a) * 2.6); g.add(d); });
  const intro = notice(c, g, 'PRESS AN ARTIST · PULL THE LEVER FOR ANOTHER NEW YORKER · HANG IT ON YOUR WALL', W / 2, 1.42, -2.93, 0, 5.4, 0.22, '#0a0a0a', '#f4ead2');
};


// ---------- people looking at the art, and a sculpture in every hall ----------
// Four visitors stand in front of pieces on the west and south walls, the way people stand in museums: a metre and a
// half back, still. And every hall gets a sculpture in its east aisle, the FLORA heroes of all three passes.
function visitors(c, r, g, X, n = 4) {
  const pick = (r.hung || []).filter((p) => p.group.position.x < 0.5 || p.group.position.z > 7.5);
  for (let k = 0; k < Math.min(n, pick.length); k++) { const p = pick[Math.floor(k * pick.length / n)], q = p.group.position, ry = p.group.rotation.y, nx = Math.sin(ry), nz = Math.cos(ry);
    const x = q.x + nx * (1.5 + (k % 2) * 0.3) + (k % 3 - 1) * 0.25, z = q.z + nz * 1.6; if (x < 0.6 || x > W - 0.8 || z > D / 2 - 0.6 || z < -D / 2 + 0.6) continue;
    extra(c, g, x, z, { col: [0x2a2a3a, 0x5a2a2a, 0x2a4a3a, 0x4a3a2a][k % 4], ry: Math.atan2(-nx, -nz), pool: 'dressy' }); }
}
const SCULPT = {
  kusama_c: ['ts_tentacle', 16.9, 6.5, { h: 2.4, ph: 0.3, pw: 1.4, hint: 'Soft tentacles', egg: ['tentacles', 'She sewed and stuffed her soft sculptures by hand from 1962 on, and later blew them up to the size of rooms in vinyl. The dots came first and stayed.'] }],
  basquiat_c: ['ts_crownskull', 17.0, 0.4, { h: 1.0, ph: 1.0, pw: 0.9, hint: 'A crowned head', egg: ['skull', 'His untitled skull of 1982 sold for 110.5 million dollars at Sotheby\'s in May 2017, then a record for an American artist at auction. This one is wood and paint and came from FLORA.'] }],
  haring_c: ['ts_haringfig', 16.8, -2.6, { h: 2.0, ph: 0.2, pw: 1.4 }],
  hokusai_c: ['ts_wave', 17.0, -3.0, { len: 1.8, ph: 0.9, pw: 1.4 }],
  lichtenstein_c: ['ts_brushstroke', 17.0, -3.0, { h: 2.2, ph: 0.3, pw: 1.2 }],
  dali_c: ['ts_spaceelephant', 16.6, 6.3, { h: 3.4, ph: 0.25, pw: 1.4, hint: 'The space elephant', egg: ['spaceelephant', 'His elephants walk on legs as thin as a mosquito\'s and carry obelisks, first painted in The Temptation of Saint Anthony in 1946. Weight, he suggested, is optional.'] }],
  warhol_c: ['ts_bolex', 17.0, -3.0, { h: 0.9, ph: 1.0, pw: 0.9 }],
  vangogh_c: ['ts_sunflowers', 16.4, 1.0, { h: 1.3, ph: 0.9, pw: 1.0, hint: 'Sunflowers', egg: ['sunflowers', 'He painted sunflowers in Arles in August 1888 to decorate the room where Gauguin would stay. There are five large versions in vases. This one you can walk round.'] }],
  picasso_c: ['ts_guitar', 17.0, -3.0, { h: 1.2, ph: 1.0, pw: 0.9 }],
  banksy_c: ['ts_lamb', 17.2, -2.6, { h: 1.0, ph: 0.6, pw: 1.0 }],
};


// ---------- THE IMPOSSIBLE ROOMS (D): one per artist, things that can only happen in a virtual gallery ----------
// Each closes its north wall, hangs one New Yorker as a depth relief (Depth Anything V2 run locally on the restyle:
// the picture comes off the wall as you walk up, real parallax, not a trick of the texture), and does one thing to the
// visitor that a building cannot.
function relief(c, r, g, st, { x = 10, y = 3.0, z = -D / 2 + 0.2, ry = 0, w = 6.4, amp = 0.9, xray = false } = {}) {
  const { THREE } = c, h = w * 575 / 1024, map = c.tex.load(`assets/plates/rel_${st}.jpg`), dep = c.tex.load(`assets/depth/rel_${st}.png`);
  map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
  const u = { map: { value: map }, dep: { value: dep }, uAmp: { value: 0.05 }, uX: { value: xray ? 1 : 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uT: { value: 0 } };
  const m = new THREE.ShaderMaterial({ uniforms: u, toneMapped: false,
    vertexShader: `uniform sampler2D dep; uniform float uAmp; varying vec2 vUv; varying float vD;
      void main(){ vUv = uv; float d = texture2D(dep, uv).r; vD = d; vec3 p = position; p.z += d * uAmp; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }`,
    fragmentShader: `uniform sampler2D map, dep; uniform float uX, uT; uniform vec2 uRes; varying vec2 vUv; varying float vD;
      void main(){ vec3 c = texture2D(map, vUv).rgb;
        float e = 1. / 512.; float dx = texture2D(dep, vUv + vec2(e, 0.)).r - texture2D(dep, vUv - vec2(e, 0.)).r, dy = texture2D(dep, vUv + vec2(0., e)).r - texture2D(dep, vUv - vec2(0., e)).r;
        vec3 n = normalize(vec3(-dx * 18., -dy * 18., 1.)); float sh = .72 + .38 * max(0., dot(n, normalize(vec3(-.4, .6, .7))));
        c *= sh;
        if (uX > .5) { vec2 q = gl_FragCoord.xy / uRes - .5; q.x *= uRes.x / uRes.y; float lens = 1. - smoothstep(.17, .19, length(q));
          float L = dot(c, vec3(.3, .59, .11)); float edge = smoothstep(.02, .09, length(vec2(dx, dy)));
          vec3 xr = vec3(.55, .8, 1.) * (pow(1. - L, 1.6) * .55 + edge * 1.3 + vD * .25);
          float rim = smoothstep(.17, .18, length(q)) - smoothstep(.185, .195, length(q));
          c = mix(c, xr, lens) + vec3(.6, .85, 1.) * rim * 1.5; }
        gl_FragColor = vec4(c, 1.);
        #include <colorspace_fragment>
      }` });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h, 192, 108), m); mesh.position.set(x, y, z); mesh.rotation.y = ry; g.add(mesh);
  const fr = new THREE.Mesh(new THREE.BoxGeometry(w + 0.24, h + 0.24, 0.08), std(c, 0x111111, { roughness: 0.4 })); fr.position.copy(mesh.position); fr.rotation.y = ry; fr.translateZ(-0.06); g.add(fr);
  const wp = new THREE.Vector3(); mesh.getWorldPosition(wp);
  c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; const d = Math.hypot(P.x - r.x0 - x, P.z - z); u.uAmp.value += ((0.08 + amp * Math.max(0, Math.min(1, (9 - d) / 6))) - u.uAmp.value) * Math.min(1, dt * 2); u.uT.value = t; c.renderer.getDrawingBufferSize(u.uRes.value); });
  return { mesh, u };
}
function dRoom(c, r, g, X, mats, st, line) {
  const { THREE } = c;
  g.add(c.slab(PORTAL.w, H_IN, 0.24, mats.wall, W / 2, H_IN / 2, -D / 2 - 0.12));
  const t = c.sign(`${(ARTIST_C[st] || '').toUpperCase()} · ${r.name.toUpperCase()}`, { w: 9, h: 0.42, bg: null, fg: r.titleCol || '#111', font: c.SERIF, weight: 900, px: 128 }); t.position.set(W / 2, 5.55, -D / 2 + 0.12); g.add(t);
  const s = c.sign(line.toUpperCase(), { w: 7, h: 0.2, bg: null, fg: r.titleCol || '#111', font: c.MONO, weight: 700, px: 96 }); s.position.set(W / 2, 5.18, -D / 2 + 0.12); g.add(s);
  const tag = c.sign('THE IMPOSSIBLE ROOM · ONLY HERE', { w: 2.6, h: 0.2, bg: '#111', fg: '#f5c542', font: c.MONO, weight: 800, px: 96, border: '#f5c542' }); tag.position.set(1.6, 2.9, 7.86); tag.rotation.y = PI; g.add(tag);
}
const ARTIST_C2 = (st) => ARTIST_C[st] || st;
const IMP = {
  // 1D. In 1967 Jud Yalkut filmed Kusama's Self-Obliteration. Stand still and the dots cover the room, then you.
  kusama_d(c, r, g, X, mats) {
    const { THREE } = c; dRoom(c, r, g, X, mats, 'kusama', 'Stand still and let the dots take you');
    relief(c, r, g, 'kusama', { x: 10, y: 3.0, w: 6.0 });
    plinthHero(c, r, g, X, 'ts_pumpkin', { x: 10, z: 1.5, h: 1.3, ph: 0.4, pw: 1.6 });
    const N = 1400, im = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 18), new THREE.MeshBasicMaterial({ color: 0xd8102a, side: THREE.DoubleSide, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -4 }), N), o = new THREE.Object3D();
    let s = 11; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const spots = [];
    for (let i = 0; i < N; i++) { const k = rnd(); let p, n;
      if (k < 0.3) { p = [0.5 + rnd() * 19, 0.012, -7.6 + rnd() * 15.2]; n = [0, 1, 0]; } else if (k < 0.5) { p = [0.13, 0.3 + rnd() * 5.5, -7.6 + rnd() * 15.2]; n = [1, 0, 0]; } else if (k < 0.7) { p = [EXW + 0.01, 0.3 + rnd() * 5.5, -7.6 + rnd() * 15.2]; n = [-1, 0, 0]; } else if (k < 0.85) { p = [0.5 + rnd() * 19, H_IN - 0.02, -7.6 + rnd() * 15.2]; n = [0, -1, 0]; } else { p = [0.5 + rnd() * 19, 0.3 + rnd() * 5.5, 7.86]; n = [0, 0, -1]; }
      spots.push({ p, n, s: 0.05 + rnd() * 0.22, at: rnd() }); }
    im.count = 0; g.add(im);
    const ov = document.createElement('canvas'); ov.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:4;opacity:0;transition:opacity .4s'; document.body.appendChild(ov); const q = ov.getContext('2d'); const sd = [];
    let still = 0, lx = 0, lz = 0, lyaw = 0, drawn = -1, told = false;
    c.tick((t, dt, P, ri, rdt) => { if (!here(r, ri)) { if (ov.style.opacity !== '0') ov.style.opacity = '0'; still = 0; return; }
      const mv = Math.hypot(P.x - lx, P.z - lz) + Math.abs(P.yaw - lyaw) * 0.6; lx = P.x; lz = P.z; lyaw = P.yaw;
      still = mv > 0.004 ? Math.max(0, still - rdt * 6) : still + rdt; const f = Math.min(1, still / 14);
      const n = Math.floor(f * N); if (n !== im.count) { for (let i = 0; i < n; i++) { const sp = spots[i]; o.position.set(...sp.p); o.lookAt(sp.p[0] + sp.n[0], sp.p[1] + sp.n[1], sp.p[2] + sp.n[2]); o.scale.setScalar(sp.s); o.updateMatrix(); im.setMatrixAt(i, o.matrix); } im.count = n; im.instanceMatrix.needsUpdate = true; }
      const sf = Math.max(0, (still - 9) / 8); ov.style.opacity = String(Math.min(1, sf));
      if (ov.width !== innerWidth) { ov.width = innerWidth; ov.height = innerHeight; drawn = -1; }
      const want = Math.floor(Math.min(1, sf) * 260); if (want < sd.length || drawn < 0) { q.clearRect(0, 0, ov.width, ov.height); sd.length = 0; }
      while (sd.length < want) { const d = { x: Math.random() * ov.width, y: Math.random() * ov.height, r: 6 + Math.random() * Math.random() * 70 }; sd.push(d); q.fillStyle = '#d8102a'; q.beginPath(); q.arc(d.x, d.y, d.r, 0, 7); q.fill(); } drawn = sd.length;
      if (!told && sf > 0.9) { told = true; c.egg('selfobliteration', 'In 1967 Jud Yalkut filmed Kusama\'s Self-Obliteration: she painted dots on horses, on water, on people, until the person disappeared into the pattern. She called it obliterating yourself. You held still long enough. Move and you come back.'); } });
  },
  // 2D. Hit by a car at seven (1968), in hospital, his mother gave him Gray's Anatomy; his band was called Gray.
  basquiat_d(c, r, g, X, mats) {
    const { THREE } = c; r.titleCol = '#f5c542'; dRoom(c, r, g, X, mats, 'basquiat', 'Look through the x-ray at the middle of your eye');
    const rel = relief(c, r, g, 'basquiat', { x: 10, y: 3.0, w: 7.0, xray: true, amp: 1.1 });
    const plate = (x, z, ry, title, draw) => { const b = board(c, g, 2.0, 2.6, 512); b.m.position.set(x, 2.5, z); b.m.rotation.y = ry; const { q, W: w, H: h } = b; q.fillStyle = '#efe6d2'; q.fillRect(0, 0, w, h); q.strokeStyle = '#1a1a1a'; q.lineWidth = 7; q.lineCap = 'round'; draw(q, w, h); q.fillStyle = '#1a1a1a'; q.font = `900 ${h * 0.07}px ${c.MONO}`; q.textAlign = 'center'; q.fillText(title, w / 2, h * 0.93); q.fillStyle = '#d8102a'; q.fillText('©', w * 0.9, h * 0.08); b.up(); return b.m; };
    plate(0.16, -3.5, PI / 2, 'SKULL', (q, w, h) => { q.beginPath(); q.ellipse(w / 2, h * 0.38, w * 0.3, h * 0.25, 0, 0, 7); q.stroke(); q.beginPath(); q.arc(w * 0.38, h * 0.38, w * 0.07, 0, 7); q.arc(w * 0.62, h * 0.38, w * 0.07, 0, 7); q.stroke(); for (let i = 0; i < 7; i++) { q.beginPath(); q.moveTo(w * (0.33 + i * 0.056), h * 0.58); q.lineTo(w * (0.33 + i * 0.056), h * 0.66); q.stroke(); } q.beginPath(); q.moveTo(w * 0.2, h * 0.8); q.lineTo(w * 0.8, h * 0.74); q.stroke(); });
    plate(0.16, 0.5, PI / 2, 'RIB CAGE', (q, w, h) => { q.beginPath(); q.moveTo(w / 2, h * 0.1); q.lineTo(w / 2, h * 0.8); q.stroke(); for (let i = 0; i < 7; i++) { q.beginPath(); q.ellipse(w / 2, h * (0.2 + i * 0.075), w * (0.28 - i * 0.012), h * 0.05, 0, 0.2, PI - 0.2); q.stroke(); } q.beginPath(); q.moveTo(w * 0.15, h * 0.5); q.lineTo(w * 0.45, h * 0.45); q.stroke(); });
    plate(EXW, -3.5, -PI / 2, 'TEETH', (q, w, h) => { for (let i = 0; i < 9; i++) { q.strokeRect(w * (0.12 + i * 0.085), h * 0.35, w * 0.07, h * 0.18); q.strokeRect(w * (0.12 + i * 0.085), h * 0.56, w * 0.07, h * 0.12); } q.beginPath(); q.moveTo(w * 0.1, h * 0.2); q.lineTo(w * 0.9, h * 0.26); q.stroke(); });
    plate(EXW, 0.5, -PI / 2, 'CROWN', (q, w, h) => { q.beginPath(); q.moveTo(w * 0.2, h * 0.6); q.lineTo(w * 0.25, h * 0.3); q.lineTo(w * 0.4, h * 0.5); q.lineTo(w * 0.5, h * 0.22); q.lineTo(w * 0.6, h * 0.5); q.lineTo(w * 0.75, h * 0.3); q.lineTo(w * 0.8, h * 0.6); q.closePath(); q.stroke(); q.strokeStyle = '#f5c542'; q.lineWidth = 14; q.stroke(); });
    let seen = 0; c.tick((t, dt, P, ri) => { if (!here(r, ri) || seen > 3) return; if (looking(c, r, 10, -D / 2, 0.97) && Math.abs(P.z) < 5) { seen += dt; if (seen > 3) c.egg('graysanatomy', 'In 1968, when he was seven, a car hit him while he played in the street. In hospital his mother gave him a copy of Gray\'s Anatomy. The bones never left the work, and in 1979 his band was called Gray.'); } });
  },
  // 3D. The black paper is the floor, and you are the chalk.
  haring_d(c, r, g, X, mats) {
    const { THREE } = c; r.titleCol = '#ffffff'; dRoom(c, r, g, X, mats, 'haring', 'Walk to draw, stop to make it radiate');
    relief(c, r, g, 'haring', { x: 10, y: 3.2, w: 6.4 });
    const CW = 2048, CH = 1600, cv = document.createElement('canvas'); cv.width = CW; cv.height = CH; const q = cv.getContext('2d'); q.fillStyle = '#0c0c0e'; q.fillRect(0, 0, CW, CH);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(19.2, 15.2), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 })); fl.rotation.x = -PI / 2; fl.position.set(9.85, 0.011, 0); g.add(fl);
    const toC = (x, z) => [(x - 0.25) / 19.2 * CW, (z + 7.6) / 15.2 * CH];
    plinthHero(c, r, g, X, 'ts_radiantbaby', { x: 16.6, z: -4.8, h: 1.1, ph: 0.5, pw: 1.3, hint: 'The radiant baby', egg: ['radiantbaby', 'The crawling baby with lines coming off it was his tag from the subway years on, the first thing he drew and, he said, the purest. Here it radiates as long as you look at it.'] });
    let lx = null, lz = null, dist = 0, still = 0, told = false, upd = 0;
    const COL = ['#ffffff', '#ffffff', '#ffffff', '#ff2a5a', '#ffd400', '#22a0ff'];
    c.tick((t, dt, P, ri, rdt) => { if (!here(r, ri)) { lx = null; return; } const L = local(r, P); if (L.x < 0.3 || L.x > 19.4) { lx = null; return; }
      if (lx === null) { lx = L.x; lz = L.z; return; } const d = Math.hypot(L.x - lx, L.z - lz);
      if (d > 0.04) { const [a, b] = toC(lx, lz), [e, f] = toC(L.x, L.z); q.strokeStyle = COL[Math.floor(dist / 12) % COL.length]; q.lineWidth = 16; q.lineCap = 'round'; q.beginPath(); q.moveTo(a, b); q.lineTo(e, f); q.stroke(); dist += d; lx = L.x; lz = L.z; still = 0; upd = 1;
        if (!told && dist > 25) { told = true; c.egg('drawwalk', 'From 1980 he drew in chalk on the black paper that covered empty subway ads, hundreds of drawings, maybe thousands, fast, before the police came. You just drew twenty five metres of line with your feet.'); } }
      else { still += rdt; if (still > 1.2 && still < 1.2 + rdt * 1.5) { const [a, b] = toC(L.x, L.z); q.strokeStyle = '#ffd400'; q.lineWidth = 10; for (let k = 0; k < 10; k++) { const an = k / 10 * PI * 2; q.beginPath(); q.moveTo(a + Math.cos(an) * 60, b + Math.sin(an) * 60); q.lineTo(a + Math.cos(an) * 110, b + Math.sin(an) * 110); q.stroke(); } upd = 1; } }
      if (upd) { tex.needsUpdate = true; upd = 0; } });
    button(c, g, 'WIPE THE PAPER', 18.6, 1.2, 7.86, PI, () => { q.fillStyle = '#0c0c0e'; q.fillRect(0, 0, CW, CH); tex.needsUpdate = true; dist = 0; }, 'Wipe the floor', { w: 1.6, h: 0.26, bg: '#000', fg: '#fff' });
  },
  // 4D. Stand inside the curl of the Great Wave, with Fuji tiny between its claws.
  hokusai_d(c, r, g, X, mats) {
    const { THREE } = c; r.titleCol = '#1a2a5a'; dRoom(c, r, g, X, mats, 'hokusai', 'Walk under the curl and look for the mountain');
    relief(c, r, g, 'hokusai', { x: 0.2, y: 2.4, z: 3.0, ry: PI / 2, w: 4.4 });
    // the wave is one surface: a grid swept along the room, each slice a curl that rises on the south and claws north
    const NX = 120, NA = 48, geo = new THREE.PlaneGeometry(1, 1, NX - 1, NA - 1), pa = geo.attributes.position, cl = new Float32Array(pa.count * 3);
    for (let k = 0; k < NA; k++) for (let i = 0; i < NX; i++) { const v = k / (NA - 1), j = k * NX + i, band = (v * 22) % 1 < 0.2 && v > 0.25 && v < 0.85; const c3 = new THREE.Color(v > 0.88 ? 0xfbf7ee : band ? 0xc8d8ee : v > 0.72 ? 0x8eaad8 : v > 0.45 ? 0x3a62b0 : v > 0.18 ? 0x23448c : 0x15295c); cl.set([c3.r, c3.g, c3.b], j * 3); }
    geo.setAttribute('color', new THREE.BufferAttribute(cl, 3));
    const wave = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.45, metalness: 0.0, emissive: 0x1a2440 })); wave.frustumCulled = false; g.add(wave);
    const FN = 900, foam = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }), FN), o = new THREE.Object3D(); foam.frustumCulled = false; g.add(foam);
    // side on, as the print has it: it rises from the floor on the west, towers, and curls east over the boats; u runs
    // north to south along the room, v from the foot of the wave to the tip of the lip
    const curl = (u, v, ph, out) => { const grow = 0.62 + 0.38 * Math.sin(u * PI), R = 4.1 * grow, cx = 7.4 + Math.sin(u * 3 + ph * 0.4) * 0.3, cy = 1.85 * grow, th = 3.6 - v * 3.8 + Math.sin(ph + u * 5) * 0.05, rr = R * (1 - 0.56 * Math.pow(v, 1.4));
      out.set(cx + rr * Math.cos(th), Math.max(0.02, cy + rr * Math.sin(th)), -7.3 + u * 8.6); return out; };
    const fuji = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.42, 32), std(c, 0x2a3a6a)); fuji.position.set(11.6, 0.21, -6.9); g.add(fuji); const cap = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.15, 32), std(c, 0xffffff)); cap.position.set(11.6, 0.35, -6.9); g.add(cap);
    for (const [x, z, ry] of [[8.4, -3.4, PI / 2 + 0.2], [10.4, -1.2, PI / 2 - 0.15], [9.0, 0.8, PI / 2 + 0.05]]) { const b = c.slab(3.4, 0.16, 0.4, std(c, 0x6a4a2a), x, 0.08, z); b.rotation.y = ry; g.add(b); for (let k = 0; k < 6; k++) { const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.12, 3, 6), std(c, 0x1a1a2a)); m.position.set(x + Math.cos(ry) * (-1.2 + k * 0.45), 0.26, z - Math.sin(ry) * (-1.2 + k * 0.45)); g.add(m); } }
    const tv = new THREE.Vector3();
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; const ph = t * 0.35;
      for (let k = 0; k < NA; k++) for (let i = 0; i < NX; i++) { curl(i / (NX - 1), k / (NA - 1), ph, tv); pa.setXYZ(k * NX + i, tv.x, tv.y, tv.z); }
      pa.needsUpdate = true; geo.computeVertexNormals();
      for (let f = 0; f < FN; f++) { const u = (f * 0.618034) % 1, v = 0.84 + ((f * 0.37) % 1) * 0.2 + Math.sin(t * 2 + f) * 0.01; curl(u, v, ph, tv); o.position.set(tv.x + Math.sin(f * 3.7) * 0.15, tv.y + Math.sin(f * 1.3 + t * 3) * 0.05, tv.z + Math.cos(f * 2.1) * 0.15); o.scale.setScalar(0.04 + ((f * 0.7) % 1) * 0.08); o.updateMatrix(); foam.setMatrixAt(f, o.matrix); }
      foam.instanceMatrix.needsUpdate = true; });
    standHere(c, g, 11.0, 5.6, 'THE MOUNTAIN', '#1a2a5a');
    let told = false; c.tick((t, dt, P, ri) => { if (told || !here(r, ri)) return; if (near(r, P, 11.0, 5.6, 0.7) && looking(c, r, 11.6, -6.9, 0.98)) { told = true; c.egg('fuji', 'In the Great Wave, about 1831, Fuji is the smallest thing in the picture, a little cone between the claws of the water, and the three long boats are fast boats taking fish to the markets of Edo. From here the wave frames it the same way.'); } });
  },
  // 5D. A comic has sound you can see. Click anything and it makes one.
  lichtenstein_d(c, r, g, X, mats) {
    const { THREE } = c; dRoom(c, r, g, X, mats, 'lichtenstein', 'Click anything, anywhere');
    relief(c, r, g, 'lichtenstein', { x: 10, y: 3.0, w: 6.0 });
    const dw = (col, x, z, ry, w) => { const t2 = dotTex(c, col, '#ffffff', { n: 14, r: 0.32, rep: 1 }); t2.wrapS = t2.wrapT = THREE.RepeatWrapping; t2.repeat.set(w / 2, 5.6 / 2); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 5.6), new THREE.MeshStandardMaterial({ map: t2, roughness: 0.8 })); m.position.set(x, 2.95, z); m.rotation.y = ry; g.add(m);
      const ln = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.12), basic(c, 0x111111)); ln.position.set(x, 0.3, z); ln.rotation.y = ry; ln.translateZ(0.01); g.add(ln); const l2 = ln.clone(); l2.position.y = 5.65; g.add(l2); };

    for (const [x, y, z, ry, s] of [[5, 3.6, -2, 0.5, 2.6], [15, 4.2, 1, -0.6, 3.0], [10, 4.8, 4, 1.4, 2.2]]) c.glb('ts_brushstroke', { h: s, x, y, z, ry, parent: g });
    const WORDS = ['POW!', 'ZAP!', 'KRAK!', 'BOOM!', 'SPLAT!', 'WHOOSH!', 'BZZT!', 'THWACK!'], FILL = ['#ffd400', '#ff2a3a', '#ffffff', '#22a0ff'];
    const burstTex = (word, k) => c.canvasTex(512, 384, (q, w, h) => { q.translate(w / 2, h / 2); q.beginPath(); for (let i = 0; i < 28; i++) { const a = i / 28 * PI * 2, rr = (i % 2 ? 0.62 : 1) * (0.9 + 0.1 * Math.sin(i * 3.3)); q.lineTo(Math.cos(a) * w * 0.46 * rr, Math.sin(a) * h * 0.46 * rr); } q.closePath(); q.fillStyle = FILL[k % 4]; q.fill(); q.lineWidth = 14; q.strokeStyle = '#111'; q.stroke();
      q.fillStyle = 'rgba(17,17,17,.18)'; for (let y = -h / 2; y < h / 2; y += 14) for (let x = -w / 2 + (y / 14 % 2) * 7; x < w / 2; x += 14) { q.beginPath(); q.arc(x, y, 3, 0, 7); q.fill(); }
      q.rotate(-0.12); q.font = `900 ${h * 0.24}px Impact, Arial Black, sans-serif`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.lineWidth = 16; q.strokeStyle = '#111'; q.strokeText(word, 0, 0); q.fillStyle = k % 4 === 1 ? '#ffd400' : '#ff2a3a'; q.fillText(word, 0, 0); });
    const TEX = WORDS.map((w, k) => burstTex(w, k)); const live = []; let n = 0;
    const pop = () => { const h = c.lastHit; if (!h) return; g.updateMatrixWorld(); const p = g.worldToLocal(h.point.clone()); const nm = h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld) : new THREE.Vector3(0, 1, 0);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), new THREE.MeshBasicMaterial({ map: TEX[n % TEX.length], transparent: true, toneMapped: false, side: THREE.DoubleSide, depthWrite: false })); m.position.copy(p).addScaledVector(nm, 0.3); m.lookAt(c.camera.position.x - r.x0, c.camera.position.y, c.camera.position.z); g.add(m); live.push({ m, t: 0 }); n++;
      c.sound.click && c.sound.click(); c.shake && c.shake(0.15); if (n === 1) c.egg('pow', 'In a comic the sound is drawn: the word, the star around it, the dots. He painted those words five feet wide in the early sixties, and a printed noise became a picture on a museum wall.'); if (live.length > 24) { const o = live.shift(); g.remove(o.m); } };
    const hit = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    for (const [w, h, x, y, z, rx, ry] of [[19, 15, 9.85, 0.02, 0, -PI / 2, 0], [15, 5.8, 0.15, 3, 0, 0, PI / 2], [15, 5.8, EXW - 0.01, 3, 0, 0, -PI / 2], [19, 5.8, 9.85, 3, 7.85, 0, PI]]) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), hit); pl.position.set(x, y, z); pl.rotation.set(rx, ry, 0); g.add(pl); c.clickable(pl, pop, 'Make a noise'); }
    c.tick((t, dt) => { for (const o of live) { o.t += dt; const s = o.t < 0.25 ? o.t / 0.25 * 1.2 : 1.2 - Math.min(0.2, (o.t - 0.25)); o.m.scale.setScalar(s); } });
  },
  // 6D. A dolly zoom: walk toward the portrait and the room stretches while the portrait stays the same size. Time slows.
  dali_d(c, r, g, X, mats) {
    const { THREE } = c; dRoom(c, r, g, X, mats, 'dali', 'Walk toward the portrait. It will not get closer.');
    relief(c, r, g, 'dali', { x: 10, y: 2.8, w: 4.2, amp: 0.7 });
    r.fov = (P) => { const L = local(r, P), dist = Math.max(1.5, L.z + D / 2); return Math.max(34, Math.min(112, 2 * Math.atan(1.6 / dist * 4.2) * 180 / PI)); };
    const clockTex = c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = '#e8d8a8'; q.beginPath(); q.arc(w / 2, h / 2, w * 0.46, 0, 7); q.fill(); q.lineWidth = 8; q.strokeStyle = '#6a5020'; q.stroke(); q.fillStyle = '#3a2a10'; for (let k = 0; k < 12; k++) { const a = k / 12 * PI * 2; q.fillRect(w / 2 + Math.cos(a) * w * 0.38 - 4, h / 2 + Math.sin(a) * h * 0.38 - 4, 8, 8); } q.lineWidth = 6; q.beginPath(); q.moveTo(w / 2, h / 2); q.lineTo(w / 2 + w * 0.1, h / 2 - h * 0.2); q.moveTo(w / 2, h / 2); q.lineTo(w / 2 - w * 0.25, h / 2 + h * 0.05); q.stroke(); });
    const cm = new THREE.MeshStandardMaterial({ map: clockTex, side: THREE.DoubleSide, roughness: 0.5 }), branch = std(c, 0x4a3420, { roughness: 0.9 });
    const clocks = [];
    for (const [x, y, z, ry] of [[3.0, 2.6, -3.5, 0.4], [16.8, 2.2, -1.0, -0.6], [4.5, 1.6, 3.5, 0.2], [15.5, 3.2, 4.0, -0.3]]) { const br = c.slab(2.2, 0.08, 0.08, branch, x, y, z); br.rotation.y = ry; g.add(br);
      const geo = new THREE.PlaneGeometry(1.0, 1.0, 24, 24), base = geo.attributes.position.array.slice(); const m = new THREE.Mesh(geo, cm); m.position.set(x, y + 0.02, z); m.rotation.y = ry; g.add(m); clocks.push({ m, geo, base, ph: Math.random() * 6 }); }
    let wasHere = false;
    c.tick((t, dt, P, ri) => { const h2 = here(r, ri); if (h2) c.TIME.target = 0.4; else if (wasHere) c.TIME.target = 1; wasHere = h2; if (!h2) return;
      for (const k of clocks) { const a = k.geo.attributes.position; for (let i = 0; i < a.count; i++) { const x = k.base[i * 3], y = k.base[i * 3 + 1]; const over = Math.max(0, Math.abs(x) - 0.08); a.setXYZ(i, x * (1 - over * 0.15), y - over * over * (1.6 + Math.sin(t * 0.6 + k.ph) * 0.3) + 0.3, Math.sign(x) * over * 0.35); } a.needsUpdate = true; } });
    let told = false; c.tick((t, dt, P, ri) => { if (told || !here(r, ri)) return; if (local(r, P).z < -3.5) { told = true; c.egg('persistence', 'The Persistence of Memory, 1931, is about 24 by 33 centimetres, smaller than a sheet of office paper, and it hangs at MoMA. You walked the whole room toward a portrait that never got bigger. Scale was never the point; time is.'); } });
  },
  // 7D. Screen Tests (1964 to 1966): sitters held still for a reel while the camera ran. This camera films you, in four inks.
  warhol_d(c, r, g, X, mats) {
    const { THREE } = c; dRoom(c, r, g, X, mats, 'warhol', 'Stand in front of the camera. Hold still.');
    const RT = new THREE.WebGLRenderTarget(640, 360), cam = new THREE.PerspectiveCamera(30, 16 / 9, 0.1, 60); cam.layers.enable(1);
    const u = { map: { value: RT.texture }, uT: { value: 0 } };
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 5.4), new THREE.ShaderMaterial({ uniforms: u, toneMapped: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: `uniform sampler2D map; uniform float uT; varying vec2 vUv;
        vec3 pal(float k, float i){ k = mod(k, 4.); return i < .5 ? (k < 1. ? vec3(1., .3, .65) : k < 2. ? vec3(1., .85, .1) : k < 3. ? vec3(.2, .8, .9) : vec3(1., .5, .1)) : (k < 1. ? vec3(.15, .1, .5) : k < 2. ? vec3(.9, .1, .2) : k < 3. ? vec3(.1, .2, .1) : vec3(.4, .1, .5)); }
        void main(){ vec2 q = floor(vUv * 2.); vec2 uv = fract(vUv * 2.); float k = q.x + q.y * 2. + floor(uT * .4);
          vec3 c = texture2D(map, uv).rgb; float L = dot(c, vec3(.3, .59, .11)); float b = smoothstep(.36, .44, L);
          vec3 o = mix(pal(k, 1.), pal(k + 1., 0.), b); o = mix(o, vec3(.05), smoothstep(.12, .06, L));
          float grid = step(.004, uv.x) * step(uv.x, .996) * step(.004, uv.y) * step(uv.y, .996); gl_FragColor = vec4(o * grid, 1.);
          #include <colorspace_fragment>
        }` }));
    scr.position.set(W / 2, 2.85, -D / 2 + 0.16); g.add(scr);
    const bolex = c.glb('ts_bolex', { h: 0.6, x: 10, y: 1.3, z: -6.4, ry: 0, parent: g }); g.add(c.slab(0.05, 1.3, 0.05, std(c, 0x111111), 10, 0.65, -6.4)); c.post(X(10), -6.4, 0.4);
    const clk = board(c, g, 5.6, 0.36, 128); clk.m.position.set(W / 2, 0.42, -D / 2 + 0.17);
    plinthHero(c, r, g, X, 'ts_soupcan', { x: 16.6, z: 4.6, h: 1.6, ph: 0.3, pw: 1.3, hint: 'Soup', egg: ['soup', 'In 1962 he showed thirty two soup canvases in Los Angeles, one per flavour, hung in a row like a shelf. This can is a FLORA sculpture and has no flavour at all.'] });
    let fame = 15 * 60, fr = 0, told = false; const tgt = new THREE.Vector3();
    c.tick((t, dt, P, ri, rdt) => { if (!here(r, ri)) return; u.uT.value = t; const L = local(r, P), inFrame = L.z < 6 && Math.abs(L.x - 10) < 6;
      if (inFrame) fame = Math.max(0, fame - rdt); const mm = Math.floor(fame / 60), ss = Math.floor(fame % 60);
      { const { q, W: w, H: h } = clk; q.fillStyle = '#111'; q.fillRect(0, 0, w, h); q.fillStyle = fame > 0 ? '#ff4fa3' : '#ffd400'; q.font = `800 ${h * 0.46}px ${c.MONO}`; q.textAlign = 'center'; q.fillText(fame > 0 ? `YOUR FIFTEEN MINUTES ${mm}:${String(ss).padStart(2, '0')}` : 'FAMOUS. NEXT.', w / 2, h * 0.68); clk.up(); }
      if ((fr++ & 1) === 0) { const dx = r.x0 + 10 - P.x, dz = -6 - P.z, dl = Math.hypot(dx, dz) || 1, k = Math.min(dl - 0.5, 2.6); cam.position.set(P.x + dx / dl * k, 1.6, P.z + dz / dl * k); tgt.set(P.x, 1.35, P.z); cam.lookAt(tgt); const rr = c.renderer, prev = rr.getRenderTarget(); scr.visible = false; rr.setRenderTarget(RT); rr.render(c.scene, cam); rr.setRenderTarget(prev); scr.visible = true; }
      if (!told && inFrame && fame < 15 * 60 - 20) { told = true; c.egg('screentest', 'From 1964 to 1966 he filmed about 470 Screen Tests: a sitter, a camera, one reel of film, and the instruction to hold still. Here the camera has been running on you for twenty seconds. He said everybody would be famous for fifteen minutes; or somebody said he said it.'); } });
  },
  // 8D. The night sky of Saint-Remy as weather you walk through: the stars flow in swirls, and swirl round you.
  vangogh_d(c, r, g, X, mats) {
    const { THREE } = c; r.titleCol = '#ffd040'; dRoom(c, r, g, X, mats, 'vangogh', 'Walk, and the sky moves round you');
    relief(c, r, g, 'vangogh', { x: 0.2, y: 2.6, z: 3.0, ry: PI / 2, w: 4.4 });
    plinthHero(c, r, g, X, 'ts_cypress', { x: 3.4, z: -5.2, h: 4.4, ph: 0.2, pw: 1.2 });
    const N = 7000, pos = new Float32Array(N * 3), colA = new Float32Array(N * 3), vel = new Float32Array(N * 2), PAL = [[1, .85, .3], [1, 1, .8], [.5, .7, 1], [.3, .5, 1], [1, .95, .55]];
    for (let i = 0; i < N; i++) { pos[i * 3] = 0.4 + Math.random() * 19; pos[i * 3 + 1] = 1.2 + Math.random() * 4.7; pos[i * 3 + 2] = -7.6 + Math.random() * 15.2; const p = PAL[i % 5]; colA.set(p, i * 3); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(colA, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.14, map: glowTex(c, 'rgba(255,255,255,.9)'), vertexColors: true, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); g.add(pts);
    const VORT = [[6, -3, 1.0], [14, -1, -0.8], [10, 4, 0.7], [4, 3, -0.6]];
    for (const [x, z] of [[15.5, -5.5]]) { const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,220,90,.8)'), transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending })); moon.scale.set(2.6, 2.6, 1); moon.position.set(x, 4.7, z); g.add(moon); }
    let told = false, stir = 0;
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; const L = local(r, P); const pv = Math.min(3, Math.hypot(P.vx || 0, P.vz || 0) + 0.8);
      for (let i = 0; i < N; i++) { const x = pos[i * 3], z = pos[i * 3 + 2]; let vx = 0, vz = 0;
        for (const [cx, cz, s] of VORT) { const dx = x - cx, dz = z - cz, d2 = dx * dx + dz * dz + 0.6, f = s * 2.2 / d2; vx += -dz * f; vz += dx * f; }
        { const dx = x - L.x, dz = z - L.z, d2 = dx * dx + dz * dz + 0.3; if (d2 < 16) { const f = 3.2 * pv / d2; vx += -dz * f; vz += dx * f; stir += f * 0.0001; } }
        vx += Math.sin(z * 0.5 + t * 0.3) * 0.15; vz += Math.cos(x * 0.4 - t * 0.2) * 0.15;
        let nx = x + vx * dt * 0.5, nz = z + vz * dt * 0.5; if (nx < 0.3) nx = 19.4; if (nx > 19.5) nx = 0.4; if (nz < -7.7) nz = 7.6; if (nz > 7.7) nz = -7.6; pos[i * 3] = nx; pos[i * 3 + 2] = nz; }
      geo.attributes.position.needsUpdate = true;
      if (!told && stir > 4) { told = true; c.egg('starrynight', 'He painted The Starry Night in June 1889 at the asylum in Saint-Remy, from the window of his room, partly from memory; the village in it was not in the view. Here the sky swirls round whoever walks under it.'); } });
  },
  // 9D. Cubism, done by machine: four cameras circle a marble bust and one canvas shows all their views at once.
  picasso_d(c, r, g, X, mats) {
    const { THREE } = c; dRoom(c, r, g, X, mats, 'picasso', 'Walk round the bust. The canvas sees every side at once.');
    const BX = 10, BZ = 0.5; g.add(c.slab(1.0, 1.1, 1.0, std(c, 0xeae4da, { roughness: 0.7 }), BX, 0.55, BZ)); c.post(X(BX), BZ, 0.8);
    const turn = new THREE.Group(); turn.position.set(BX, 1.1, BZ); g.add(turn); c.glb('ts_bust', { h: 1.0, parent: turn });
    const RT = [0, 1, 2, 3].map(() => new THREE.WebGLRenderTarget(384, 384)), cams = RT.map(() => new THREE.PerspectiveCamera(22, 1, 0.1, 30));
    const u = { a: { value: RT[0].texture }, b: { value: RT[1].texture }, c2: { value: RT[2].texture }, d: { value: RT[3].texture }, uT: { value: 0 } };
    const can = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 4.0), new THREE.ShaderMaterial({ uniforms: u, toneMapped: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: `uniform sampler2D a, b, c2, d; uniform float uT; varying vec2 vUv;
        vec2 h2(float n){ return fract(sin(vec2(n * 12.9898, n * 78.233)) * 43758.5453); }
        void main(){ float best = 9., second = 9.; float id = 0.;
          for (int i = 0; i < 16; i++) { vec2 s = h2(float(i) + 1.) ; s = .1 + .8 * s + .04 * vec2(sin(uT * .2 + float(i)), cos(uT * .17 + float(i))); float dd = length((vUv - s) * vec2(1.35, 1.)); if (dd < best) { second = best; best = dd; id = float(i); } else if (dd < second) second = dd; }
          vec2 off = (h2(id + 40.) - .5) * .14; float rot = (h2(id + 70.).x - .5) * .5; vec2 p = vUv - .5; p = mat2(cos(rot), -sin(rot), sin(rot), cos(rot)) * p * (.85 + h2(id + 90.).y * .3) + .5 + off;
          float k = mod(id, 4.); vec3 col = k < 1. ? texture2D(a, p).rgb : k < 2. ? texture2D(b, p).rgb : k < 3. ? texture2D(c2, p).rgb : texture2D(d, p).rgb;
          float L = dot(col, vec3(.3, .59, .11)); vec3 ochre = mix(vec3(.18, .14, .1), vec3(.86, .74, .52), L); vec3 grey = mix(vec3(.12), vec3(.8, .78, .72), L);
          col = mix(col, mix(ochre, grey, step(.5, h2(id + 5.).x)), .7) * (.8 + .4 * h2(id + 9.).y);
          col *= smoothstep(.0, .012, second - best); gl_FragColor = vec4(col, 1.);
          #include <colorspace_fragment>
        }` }));
    can.position.set(W / 2, 3.0, -D / 2 + 0.2); g.add(can); g.add(c.slab(5.7, 4.3, 0.1, std(c, 0x5a4026, { roughness: 0.5 }), W / 2, 3.0, -D / 2 + 0.12));
    let spin = 0, fr = 0, told = false, walked = 0, la = null;
    c.clickable(turn, () => { spin = 3; c.sound.click && c.sound.click(); }, 'Spin the bust');
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; u.uT.value = t; spin *= 0.97; turn.rotation.y += spin * dt + dt * 0.05;
      const L = local(r, P), base = Math.atan2(L.x - BX, L.z - BZ); if (la !== null) walked += Math.abs(Math.atan2(Math.sin(base - la), Math.cos(base - la))); la = base;
      if ((fr++ % 3) === 0) { const rr = c.renderer, prev = rr.getRenderTarget(); can.visible = false;
        cams.forEach((cm, k) => { const a = base + [0, PI / 2, -PI / 2, PI][k] + (k === 3 ? 0 : 0.0), rad = 2.6; cm.position.set(r.x0 + BX + Math.sin(a) * rad, 1.65 + (k === 1 ? 0.6 : k === 2 ? -0.3 : 0), BZ + Math.cos(a) * rad); cm.lookAt(r.x0 + BX, 1.6, BZ); rr.setRenderTarget(RT[k]); rr.render(c.scene, cm); });
        rr.setRenderTarget(prev); can.visible = true; }
      if (!told && walked > PI) { told = true; c.egg('cubism', 'From about 1909 to 1912 he and Georges Braque took things apart and painted several sides of them at once, in browns and greys. Four cameras just did the same to a marble head as you walked half way round it. Les Demoiselles d\'Avignon, 1907, has been at MoMA since 1939.'); } });
  },
  // 10D. The stencils exist only in the corner of your eye, and the wall writes itself while your back is turned.
  banksy_d(c, r, g, X, mats) {
    const { THREE } = c; r.titleCol = '#f4ead2'; dRoom(c, r, g, X, mats, 'banksy', 'Look straight at it and it is gone');
    relief(c, r, g, 'banksy', { x: 10, y: 3.0, w: 5.6 });
    const sten = (draw) => c.canvasTex(512, 512, (q, w, h) => { q.fillStyle = '#111'; draw(q, w, h); });
    const RAT = sten((q, w, h) => { q.beginPath(); q.ellipse(w * 0.45, h * 0.6, w * 0.22, h * 0.14, 0, 0, 7); q.fill(); q.beginPath(); q.ellipse(w * 0.7, h * 0.52, w * 0.1, h * 0.09, 0.3, 0, 7); q.fill(); q.beginPath(); q.arc(w * 0.74, h * 0.42, w * 0.04, 0, 7); q.fill(); q.lineWidth = 10; q.strokeStyle = '#111'; q.beginPath(); q.moveTo(w * 0.25, h * 0.62); q.bezierCurveTo(w * 0.05, h * 0.66, w * 0.08, h * 0.9, w * 0.2, h * 0.88); q.stroke(); q.fillRect(w * 0.58, h * 0.25, w * 0.05, h * 0.3); q.fillStyle = '#c8102e'; q.fillRect(w * 0.56, h * 0.18, w * 0.09, h * 0.08); });
    const KID = sten((q, w, h) => { q.beginPath(); q.arc(w * 0.45, h * 0.22, w * 0.08, 0, 7); q.fill(); q.fillRect(w * 0.38, h * 0.3, w * 0.14, h * 0.32); q.fillRect(w * 0.38, h * 0.62, w * 0.05, h * 0.26); q.fillRect(w * 0.47, h * 0.62, w * 0.05, h * 0.26); q.save(); q.translate(w * 0.52, h * 0.34); q.rotate(-0.9); q.fillRect(0, 0, w * 0.2, h * 0.04); q.restore(); q.lineWidth = 6; q.strokeStyle = '#111'; q.beginPath(); q.moveTo(w * 0.7, h * 0.18); q.lineTo(w * 0.72, h * 0.08); q.stroke(); q.fillStyle = '#c8102e'; q.beginPath(); q.arc(w * 0.75, h * 0.06, w * 0.05, 0, 7); q.fill(); });
    const FLOW = sten((q, w, h) => { q.fillRect(w * 0.3, h * 0.3, w * 0.12, h * 0.4); q.beginPath(); q.arc(w * 0.36, h * 0.22, w * 0.08, 0, 7); q.fill(); q.save(); q.translate(w * 0.42, h * 0.38); q.rotate(-0.4); q.fillRect(0, 0, w * 0.3, h * 0.05); q.restore(); const cols = ['#ff2a5a', '#ffd400', '#22a0ff', '#ffffff']; for (let k = 0; k < 9; k++) { q.fillStyle = cols[k % 4]; q.beginPath(); q.arc(w * (0.75 + Math.cos(k) * 0.08), h * (0.2 + Math.sin(k * 1.3) * 0.08), w * 0.035, 0, 7); q.fill(); } });
    const fwd = new THREE.Vector3(), mats2 = [];
    const ghost = (t2, x, y, z, ry, s) => { const m = new THREE.ShaderMaterial({ uniforms: { map: { value: t2 }, uF: { value: fwd } }, transparent: true, depthWrite: false,
      vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `uniform sampler2D map; uniform vec3 uF; varying vec2 vUv; varying vec3 vW;
        void main(){ vec4 c = texture2D(map, vUv); float f = dot(normalize(vW - cameraPosition), uF); float a = 1. - smoothstep(.80, .95, f); gl_FragColor = vec4(c.rgb, c.a * a * .95); }` });
      const me = new THREE.Mesh(new THREE.PlaneGeometry(s, s), m); me.position.set(x, y, z); me.rotation.y = ry; g.add(me); mats2.push(m); return me; };
    [[RAT, 0.14, 1.0, -5.0, PI / 2, 1.4], [KID, 0.14, 2.0, -1.0, PI / 2, 2.6], [RAT, 0.14, 0.6, 2.4, PI / 2, 1.0], [FLOW, EXW - 0.01, 2.2, -4.0, -PI / 2, 2.8], [RAT, EXW - 0.01, 0.8, 0.0, -PI / 2, 1.2], [KID, EXW - 0.01, 2.0, 3.4, -PI / 2, 2.4], [RAT, 4.0, 4.8, -D / 2 + 0.2, 0, 1.3], [RAT, 16.5, 0.7, -D / 2 + 0.2, 0, 1.1], [FLOW, 15.5, 2.4, 7.84, PI, 2.6], [RAT, 6.0, 0.6, 7.84, PI, 1.0]].forEach((a) => ghost(...a));
    const MSG = 'NOBODY SAW ME DO THIS', wb = board(c, g, 7.0, 0.9, 256); wb.m.position.set(10, 4.6, 7.84); wb.m.rotation.y = PI; wb.m.material.transparent = true; let letters = 0, acc = 0;
    const drawMsg = () => { const { q, W: w, H: h } = wb; q.clearRect(0, 0, w, h); q.fillStyle = '#f4f4f4'; q.font = `900 ${h * 0.6}px Impact, Arial Black, sans-serif`; q.textAlign = 'left'; q.fillText(MSG.slice(0, letters), h * 0.2, h * 0.72); wb.up(); }; drawMsg();
    const fr = new THREE.Frustum(), pm = new THREE.Matrix4(), wp = new THREE.Vector3(); let told = false, seenGhost = 0;
    c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; c.camera.getWorldDirection(fwd);
      pm.multiplyMatrices(c.camera.projectionMatrix, c.camera.matrixWorldInverse); fr.setFromProjectionMatrix(pm); wb.m.getWorldPosition(wp);
      if (!fr.containsPoint(wp) && letters < MSG.length) { acc += dt; if (acc > 0.6) { acc = 0; letters++; drawMsg(); c.sound.spray && c.sound.spray(); } }
      if (!told && letters >= MSG.length) { told = true; c.egg('nobodysaw', 'Most of his work goes up when nobody is looking, and is found in the morning. This wall only works while your back is turned, and every stencil in this room is there only in the corner of your eye. Look straight at one and it is gone.'); } });
  },
};
for (const [id, fn] of Object.entries(IMP)) ROOM[id] = fn;


// ---------- the Impossible Rooms, dressed (sixth pass) ----------
// MLow: "some of the rooms still look kind of boring". They were empty boxes. What the movie sets taught: a room is a
// place before it is a trick. So each now gets a FLORA mural for its walls, a lit ceiling with a downlight grid, a hang of
// New Yorkers from the vault under picture lights, props from the ON LOCATION Poly Haven kit (CC0, already Draco packed),
// and people in it.
function downlights(c, r, g, { nx = 4, nz = 3, col = 0xfff4e0 } = {}) {
  const { THREE } = c, N = nx * nz, disc = new THREE.InstancedMesh(new THREE.CircleGeometry(0.16, 20), new THREE.MeshBasicMaterial({ color: col, toneMapped: false }), N), trim = new THREE.InstancedMesh(new THREE.RingGeometry(0.16, 0.22, 20), std(c, 0xd8d4cc, { metalness: 0.6, roughness: 0.3 }), N), o = new THREE.Object3D();
  let k = 0; for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { o.position.set(2.5 + i * (15 / (nx - 1)), H_IN - 0.015, -5.5 + j * (11 / (nz - 1))); o.rotation.set(PI / 2, 0, 0); o.updateMatrix(); disc.setMatrixAt(k, o.matrix); trim.setMatrixAt(k, o.matrix); k++; }
  g.add(disc); g.add(trim);
}
function vaultHang(c, r, g, st, spots, { frame = 'black', y = 2.3, w = 1.3, tilt = 0, glow } = {}) {
  const VA = (window.VAULT || {})[st]; if (!VA) return [];
  const pool = VA.items, start = (r.i * 37) % pool.length, list = spots.map((s, k) => { const [n, t, h, f, i] = pool[(start + k * 17) % pool.length]; return { n, t, h, f: `../vault/${st}/${f}`, i, g: st, vault: true, ll: LABEL_C[st] || '', ri: r.i }; });
  list.forEach((p, k) => { const [x, z, ry, yy, ww] = spots[k]; c.hang(p, x, yy ?? y, z, ry, ww ?? w, frame, g, glow != null ? { glow } : {}); if (tilt && p.group) p.group.rotation.z = Math.sin(k * 9.7) * tilt; if (p.mesh) c.clickable(p.mesh, () => c.openPiece(p, list, k), p.t); });
  return list;
}
const WESTH = (zs, y, w) => zs.map((z) => [0.14, z, PI / 2, y, w]), EASTH = (zs, y, w) => zs.map((z) => [EXW, z, -PI / 2, y, w]);
const DRESS = {
  kusama_d: { hang: [...WESTH([-5.6, 4.6]), ...EASTH([-5.6, 4.6])], lights: true,
    props: [['mid_century_lounge_chair', 4.2, 4.2, { h: 0.9, ry: 0.6, r: 0.5 }], ['side_table_01', 5.2, 4.9, { h: 0.6, r: 0.3 }], ['potted_plant_02', 15.6, 4.8, { h: 1.3, r: 0.3 }], ['Ottoman_01', 15.0, 3.6, { h: 0.45, r: 0.4 }]],
    people: [[6.5, 2.6, 0.4], [13.8, 0.4, -0.6], [8.5, 5.5, PI]] },
  basquiat_d: { hang: [...WESTH([-6.4, 3.4]), ...EASTH([-6.4, 3.4])], frame: 'raw', tilt: 0.04,
    props: [['book_encyclopedia_set_01', 10, 4.6, { h: 0.35, egg: ['The book', 'graysbook', 'An anatomy book on a stand: the one thing in this room that is not a drawing. He kept anatomy books in his studio all his life.'] }], ['boombox', 16.4, 5.6, { h: 0.45 }], ['spray_paint_bottles_02', 3.2, 5.8, { h: 0.3 }], ['wooden_crate_01', 3.6, -6.2, { h: 0.6, r: 0.5 }], ['old_bed_frame', 16.4, -6.0, { len: 2.0, ry: PI / 2, r: 1.0 }], ['metal_stool_01', 12.4, 5.2, { h: 0.7, r: 0.3 }], ['cardboard_box_01', 4.4, -5.4, { h: 0.5 }]],
    people: [[7.2, 1.2, 0.2], [13.2, -2.5, -0.3]] },
  haring_d: { hang: [...WESTH([-5.2, -2.2, 0.8]), ...EASTH([-5.2, -2.2, 0.8])], frame: 'white',
    props: [['modular_street_seating', 0.9, 4.4, { len: 2.0, ry: PI / 2, r: 0.5 }], ['metal_trash_can', 18.7, 6.6, { h: 0.95, r: 0.35 }], ['boombox', 1.2, 6.4, { h: 0.45, egg: ['A boombox', 'boombox', 'Saturday nights he was at the Paradise Garage on King Street, where Larry Levan played until the morning. The drawings and the dancing were the same line.'] }], ['WetFloorSign_01', 18.4, 3.2, { h: 0.6 }], ['fire_alarm', 0.15, -6.8, { h: 0.3, ry: PI / 2, y: 1.4, raw: false }]],
    people: [[4.0, -6.2, 0.3], [16.0, 6.0, PI - 0.4]] },
  hokusai_d: { hang: EASTH([-5.6, -2.6, 0.4, 3.4]), frame: 'wood', lights: true,
    props: [['coast_rocks_01', 3.6, -4.4, { len: 2.0, r: 0.8 }], ['coast_rocks_02', 4.2, -1.0, { len: 1.6, r: 0.6 }], ['ocean_buoy', 13.8, 1.5, { h: 0.9, bob: 1.3 }], ['wooden_lantern_01', 16.8, 6.2, { h: 0.9 }], ['wooden_bucket_01', 15.8, 6.6, { h: 0.4 }], ['folding_wooden_stool', 14.6, 6.0, { h: 0.5 }], ['ceramic_vase_01', 17.6, -6.6, { h: 0.7 }]],
    people: [[14.0, 4.6, -2.6], [16.0, -1.0, -PI / 2]] },
  lichtenstein_d: { hang: [...WESTH([-5.6, -3.2, 3.6, 6.0], 2.5, 1.1), ...EASTH([-5.6, -3.2, 3.6, 6.0], 2.5, 1.1)], frame: 'black', lights: true,
    props: [['modern_arm_chair_01', 4.6, 5.0, { h: 0.9, ry: 2.6, r: 0.5 }], ['Television_01', 3.4, 6.4, { h: 0.6, ry: 2.8 }], ['desk_lamp_arm_01', 15.6, 5.6, { h: 0.7 }], ['modern_coffee_table_01', 5.8, 4.0, { h: 0.45, r: 0.5 }], ['classic_laptop', 5.8, 4.0, { h: 0.12, y: 0.45 }], ['potted_plant_04', 16.6, 6.4, { h: 1.2 }]],
    people: [[8.0, 2.4, 0.2], [12.6, -1.0, -0.4]] },
  dali_d: { hang: [...WESTH([-1.0, 5.6]), ...EASTH([-3.5, 5.6])], frame: 'gilt', lights: true,
    props: [['vintage_grandfather_clock_01', 1.0, -6.6, { h: 2.3, ry: PI / 2, r: 0.4, egg: ['A long case clock', 'grandfatherclock', 'Every clock in this room runs at the pace of the room, which is slower than yours. Stand here long enough and the gallery outside will have aged more than you.'] }], ['mantel_clock_01', 17.8, -6.4, { h: 0.4, y: 1.1 }], ['GothicCommode_01', 17.8, -6.4, { h: 1.1, ry: -PI / 2, r: 0.5 }], ['ornate_mirror_01', 0.2, 2.0, { h: 1.6, ry: PI / 2, y: 0.9 }], ['lambis_shell', 9.2, 6.6, { h: 0.25 }], ['boulder_01', 12.4, 5.8, { len: 1.2, r: 0.6 }], ['dead_tree_trunk', 18.4, 2.4, { h: 3.0, r: 0.5 }]],
    people: [[5.6, 1.6, -0.2], [14.6, 3.0, 0.5]] },
  warhol_d: { hang: [...WESTH([-5.6, -2.6, 0.4, 3.4]), ...EASTH([-5.6, -2.6, 0.4])], frame: 'silver', lights: true,
    props: [['Sofa_01', 3.4, 5.4, { len: 2.4, ry: PI / 2 + 0.2, r: 1.0, egg: ['The couch', 'factorycouch', 'The Factory couch was found on a street in Manhattan and carried up to East 47th Street, and half of New York sat on it in front of his camera. This one has been sat on by nobody yet.'] }], ['filmstrip_projector_8mm', 16.6, -6.0, { h: 0.5, y: 0.9, ry: -0.4 }], ['metal_stool_01', 16.6, -6.0, { h: 0.9, r: 0.3 }], ['mounted_fluorescent_lights', 10, -2, { len: 1.6, y: 'ceil' }], ['vintage_video_camera', 13.2, 5.4, { h: 0.4 }], ['cardboard_box_01', 17.6, 6.4, { h: 0.5 }], ['cardboard_box_01', 17.0, 6.6, { h: 0.45, ry: 0.4 }], ['bar_chair_round_01', 6.6, -6.2, { h: 0.9 }]],
    people: [[6.0, 6.2, PI], [14.0, 6.4, PI + 0.3]] },
  vangogh_d: { hang: EASTH([-5.6, -2.6, 0.4, 3.4]), frame: 'gilt', glow: 0.9,
    props: [['painted_wooden_chair_01', 6.8, 5.6, { h: 0.95, ry: 0.4, r: 0.4, egg: ['A chair', 'vincentschair', 'In Arles in late 1888 he painted his own rush seated chair with his pipe on it, and Gauguin\'s armchair with a candle, as portraits of the two of them. Here a New Yorker could sit down, if New Yorkers ever sat down.'] }], ['vintage_oil_lamp', 9.0, 6.2, { h: 0.4, y: 0.75 }], ['WoodenTable_01', 9.0, 6.2, { h: 0.75, r: 0.6 }], ['ceramic_pot', 8.6, 6.0, { h: 0.3, y: 0.75 }], ['wooden_stool_01', 10.4, 5.4, { h: 0.5 }]],
    people: [[15.0, 4.8, -0.6], [15.4, -1.0, -PI / 2]] },
  picasso_d: { hang: [...WESTH([-5.6, -2.6, 3.4]), ...EASTH([-5.6, -2.6, 3.4])], frame: 'wood', lights: true,
    props: [['WoodenTable_02', 4.2, 5.4, { h: 0.78, r: 0.7 }], ['Ukulele_01', 4.0, 5.3, { h: 0.6, y: 0.78, ry: 0.6, egg: ['A guitar on the table', 'stilllife', 'The guitar, the bottle, the jug and the newspaper are the furniture of every cubist still life. He made his first sheet metal guitar in 1912 and gave it to MoMA in 1971.'] }], ['wine_bottles_01', 4.6, 5.6, { h: 0.35, y: 0.78 }], ['jug_01', 3.8, 5.6, { h: 0.3, y: 0.78 }], ['marble_bust_01', 16.4, 5.6, { h: 0.8, y: 1.0 }], ['ClassicConsole_01', 16.4, 5.6, { h: 1.0, ry: PI, r: 0.5 }], ['ceramic_vase_03', 15.4, -6.6, { h: 0.6 }]],
    people: [[7.6, 3.0, -0.8], [12.6, 3.4, 0.9]] },
  banksy_d: { hang: [...WESTH([-6.6, 5.6], 3.7, 1.1), ...EASTH([-6.6, 5.6], 3.7, 1.1)], frame: 'thrift', tilt: 0.06,
    props: [['spray_paint_bottles_02', 9.4, 6.8, { h: 0.3 }], ['trashbag', 1.2, 6.4, { h: 0.7 }], ['trashbag', 1.8, 6.8, { h: 0.6, ry: 1.2 }], ['metal_trash_can', 18.6, 6.4, { h: 0.95, r: 0.35 }], ['street_rat', 6.4, 6.9, { h: 0.12 }], ['concrete_road_barrier', 18.0, -2.0, { len: 1.8, ry: PI / 2, r: 0.6 }], ['security_light', 10, 4.9, { h: 0.5, y: 4.9 }], ['plastic_crate_01', 17.4, 6.8, { h: 0.4 }], ['old_tyre', 2.4, -6.6, { h: 0.6 }], ['power_box_01', 0.2, 6.0, { h: 0.9, ry: PI / 2, y: 0.8 }], ['sedan', 15.6, -4.6, { len: 4.4, ry: 0.15, raw: true, r: 1.2 }], ['rollershutter_door', 0.15, -3.8, { h: 3.0, ry: PI / 2 }], ['caged_hanging_light', 6, -2, { h: 0.5, y: 4.9 }], ['caged_hanging_light', 14, 2, { h: 0.5, y: 4.9 }], ['hanging_industrial_lamp', 10, -5.5, { h: 0.7, y: 4.6 }]],
    people: [[5.0, 3.0, 0.4], [15.4, 1.0, -0.4]] },
};
for (const [id, d] of Object.entries(DRESS)) { const base = ROOM[id]; ROOM[id] = (c, r, g, X, mats) => { base(c, r, g, X, mats);
  if (d.lights) downlights(c, r, g);
  vaultHang(c, r, g, r.g, d.hang, { frame: d.frame || 'black', tilt: d.tilt || 0, glow: d.glow });
  d.props.forEach((q) => prop(c, r, g, X, q[0], q[1], q[2], q[3]));
  (d.people || []).forEach(([x, z, ry], k) => { extra(c, g, x, z, { col: [0x2a2a3a, 0x5a2a2a, 0x2a4a3a][k % 3], ry, pool: 'dressy' }); c.post(X(x), z, 0.3); }); }; }

// Kusama's infinity room, the movie set way (ON LOCATION, Manhattan Murder Mystery): two facing mirrors and a field of
// lanterns between them, so the lanterns go on forever. Desktop only: each mirror is one more render of the room.
{ const base = ROOM.kusama_d; ROOM.kusama_d = (c, r, g, X, mats) => { base(c, r, g, X, mats); const { THREE } = c;
  if (!c.MOBILE) for (const [x, ry] of [[0.2, PI / 2], [EXW - 0.02, -PI / 2]]) { const m = new Reflector(new THREE.PlaneGeometry(6.6, 5.2), { textureWidth: 768, textureHeight: 620, color: 0xb8b8b8, clipBias: 0.003 }); m.position.set(x, 2.8, -1.3); m.rotation.y = ry; g.add(m);
    const fr = c.slab(0.06, 5.4, 6.8, std(c, 0x111111, { metalness: 0.8, roughness: 0.3 }), x + (ry > 0 ? -0.03 : 0.03), 2.8, -1.3); g.add(fr); }
  const N = 140, im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 12, 8), new THREE.MeshBasicMaterial({ toneMapped: false }), N), o = new THREE.Object3D(), col = new THREE.Color(), C = [0xff4060, 0xffd040, 0x40c0ff, 0x60ff90, 0xff80e0, 0xffffff];
  const L = []; for (let i = 0; i < N; i++) { L.push([1.2 + Math.random() * 17.6, 2.2 + Math.random() * 3.4, -4.4 + Math.random() * 6.2, Math.random() * 6]); im.setColorAt(i, col.set(C[i % 6])); }
  g.add(im); for (const [x, y, z] of L.slice(0, 40)) g.add(c.slab(0.004, H_IN - y, 0.004, basic(c, 0x333333), x, y + (H_IN - y) / 2, z));
  c.tick((t, dt, P, ri) => { if (!here(r, ri)) return; L.forEach(([x, y, z, ph], i) => { o.position.set(x, y + Math.sin(t * 0.8 + ph) * 0.04, z); o.scale.setScalar(0.8 + 0.4 * Math.sin(t * 2.2 + ph)); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); im.instanceMatrix.needsUpdate = true; });
  const lb = c.sign('BETWEEN TWO MIRRORS THE LANTERNS DO NOT END', { w: 3.4, h: 0.18, bg: null, fg: '#d8102a', font: c.MONO, weight: 800, px: 96 }); lb.position.set(10, 0.6, -D / 2 + 0.2); g.add(lb); }; }
