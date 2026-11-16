// THE LIGHTINGS, room by room. The city switches itself on for December: the tree at Rockefeller Center and the menorahs at
// both Grand Army Plazas, with the rooms in between. Every person has an eye flower for a head. The cast are Tripo GLBs from
// GPT Image 2.6 concepts on Krea, plus the house models (ON LOCATION, THE MARKS, the museum) and Poly Haven CC0 props. One
// trick per room, three or four eggs, and one shared night: the tree you light and the night you choose follow you (LT).
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { W, D, H_IN, PORTAL } from './rooms.js';
import { floorFinish } from './real.js';
import { crowdBody, crowdCast } from './crowd.js';

const PI = Math.PI;
const INK = ['#f5c542', '#ff4fa3', '#22d3ee', '#3b82f6', '#ffffff', '#ff7a1a'];
const DZ1 = 2, DZ2 = 5.6, DH = 3.6;

// who the extras are in each room (crowd.js POOLS): the night crowd in Midtown, walkers in Brooklyn
const CROWD_CAST = { fifth: 'night', channel: 'night', rink: 'walkers', tree: 'night', top: 'dressy', menorah: 'walkers', market: 'walkers', brooklyn: 'walkers', window: 'walkers', dyker: 'walkers' };
export function buildRoom(c, r) {
  const { THREE, scene } = c;
  crowdCast(CROWD_CAST[r.id]);
  const g = r.group = new THREE.Group(); g.position.x = r.x0; scene.add(g);
  const X = (x) => r.x0 + x;
  const mats = matsFor(c, r);
  const HT = r.wallH || (r.outdoor ? (r.low ? 4 : 10) : H_IN);

  if (!r.noFloor) g.add(c.slab(W, 0.1, D, mats.floor, W / 2, -0.05, 0));
  if ((r.ceil || r.ceilImg) && !r.outdoor) g.add(c.slab(W, 0.1, D, mats.ceil, W / 2, (r.ceilH || H_IN) + 0.05, 0));
  if (r.outdoor) skyDome(c, g, r);

  const pw = PORTAL.w, px1 = (W - pw) / 2, px2 = (W + pw) / 2, NH = r.low ? 1.1 : HT;
  g.add(c.slab(W, HT, 0.24, mats.wall, W / 2, HT / 2, D / 2 + 0.12)); c.wall(X(0), D / 2, X(W), D / 2);
  // the tree is wider than any doorway: its room has no north wall at all, only the line you may not cross
  if (!r.openNorth) {
    g.add(c.slab(px1, NH, 0.24, mats.wall, px1 / 2, NH / 2, -D / 2 - 0.12));
    g.add(c.slab(px1, NH, 0.24, mats.wall, px2 + px1 / 2, NH / 2, -D / 2 - 0.12));
  }
  c.wall(X(0), -D / 2, X(W), -D / 2);
  if (!r.outdoor) { const ph = Math.min(PORTAL.h, (r.ceilH || H_IN) - 0.5); g.add(c.slab(pw, H_IN - ph, 0.24, mats.wall, W / 2, ph + (H_IN - ph) / 2, -D / 2 - 0.12)); }
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

  if (!r.noPlate) c.plate(r);   // the window room builds its own street from the plate image instead

  const slots = (SLOTS[r.id] || slotsDefault)(r);
  r.cast.forEach((p, k) => { const s = slots[k]; if (!s) return; c.hang(p, s.x, s.y, s.z, s.ry, s.w || 1.3, s.honor ? 'gilt' : r.frame, g); });

  slate(c, r, g);
  if (!r.noRope) rope(c, r, g, X);
  else if (r.edge) c.wall(X(0), -D / 2 + 1.2, X(W), -D / 2 + 1.2);   // an unmarked edge, so nobody walks into the photograph
  floorDecals(c, r, g);
  if (r.snow) snowfall(c, r, g, c.MOBILE ? Math.round(r.snow * 0.5) : r.snow);
  if (r.rp) { r.treeZ = r.rp.dz + RP.TZ; r.treeY = r.rp.dy || 0; }   // the star lift (v4) is built before the plaza, so it needs to know now
  dressRoom(c, r, g, X);   // v2: facades, canopies, lamps, firs, snowbanks, props (dress.part.js)
  if (r.rp) realPlaza(c, r, g, X, r.rp);   // round six: the real Rockefeller Plaza at 1:1 (plaza.part.js)
  ROOM[r.id] && ROOM[r.id](c, r, g, X, mats);
  (PROPS[r.id] || []).forEach((q) => prop(c, r, g, X, ...q));
  dressing(c, r, g, X);
}
function matsFor(c, r) {
  const { THREE } = c;
  const m = {};
  m.floor = c.surf(r.floor, r.floorRep || (r.floor === 'asphalt' ? 3 : r.floor === 'planks' ? 2.2 : 2.2), r.floorTint || (r.outdoor ? 0x6a6c76 : 0x9a9a9a));
  m.ceil = r.ceil ? c.surf(r.ceil, 3, r.ceilTint || 0x8a847a) : null;
  if (r.ceilImg) { const t = c.tex.load(`assets/ceil/${r.ceilImg}.jpg`); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
    m.ceil = new THREE.MeshStandardMaterial({ map: t, color: r.ceilTint || 0xffffff, roughness: 0.8, emissive: r.ceilTint || 0xffffff, emissiveMap: t, emissiveIntensity: r.ceilGlow ?? 0.1 }); m.ceil.userData.rep = r.ceilRep || 3; }
  if ((window.WALLS || []).includes(r.wallImg || r.id)) {
    const t = c.tex.load(`assets/walls/${r.wallImg || r.id}.jpg`); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8;
    m.wall = new THREE.MeshStandardMaterial({ map: t, roughness: 0.82, color: r.muralTint || 0xffffff });
    m.wall.userData.repX = 10; m.wall.userData.repY = r.outdoor ? (r.low ? 4 : 10) : H_IN;
  }
  else m.wall = c.surf(r.wall || 'brick', 2.4, r.wallTint || 0x6e6660);
  if (r.floor === 'asphalt' || r.floor === 'acg_asphalt033') { m.floor.roughness = 0.62; m.floor.metalness = 0.05; }   // v3: the puddles carry the wet; the asphalt itself was half a mirror
  floorFinish(r, m.floor, c.renderer);   // the photoreal pass: polished indoor floors (real.js)
  if (r.matte) { m.floor.roughness = 0.82; m.floor.metalness = 0; if (m.floor.envMapIntensity !== undefined) m.floor.envMapIntensity = 0.3; }
  return m;
}
// the sky over an outdoor room: a gradient dome, lit the way the room says (dawn, overcast, golden, winter, night, summer)
function skyDome(c, g, r) {
  const { THREE } = c;
  const [top, hor] = (r.night || /night|city/.test(r.hdri || '')) ? ['#04070d', '#1b2a3c'] : r.dawn ? ['#6a86b8', '#d8ccc0'] : r.overcast ? ['#8a94a4', '#c7d2da'] : r.golden ? ['#5a7fc0', '#dccfb8'] : r.winter ? ['#7aa0d8', '#dde4ee'] : r.summer ? ['#2a6ad0', '#bfe0ff'] : ['#6a90c8', '#d0d6e0'];
  const t = c.canvasTex(16, 256, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(0.55, hor); gr.addColorStop(1, hor); q.fillStyle = gr; q.fillRect(0, 0, w, h); });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(140, 24, 12, 0, PI * 2, 0, PI * 0.52), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false, toneMapped: false, depthWrite: false }));
  dome.position.set(W / 2, -2, 0); dome.renderOrder = -2; g.add(dome);
  // the domes are far bigger than the rooms are apart, so each one shows only while its room is the one you stand in
  c.tick((t, dt, P, ri) => { dome.visible = ri === r.i; });
  if (r.night) { const N = 90, pos = new Float32Array(N * 3); for (let i = 0; i < N; i++) { const a = Math.random() * PI * 2, e = 0.15 + Math.random() * 1.2; pos[i * 3] = W / 2 + Math.cos(a) * Math.cos(e) * 130; pos[i * 3 + 1] = Math.sin(e) * 130; pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * 130; } const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.6, fog: false, toneMapped: false }))); }
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
    q.fillStyle = '#f4ead2'; q.font = `800 ${w * 0.038}px ${c.MONO}`; q.fillText('THE LIGHTINGS', w / 2, h * 0.12); q.fillText((r.name || '').toUpperCase().slice(0, 26), w / 2, h * 0.9);
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
  if (r.id === 'window') return;
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
  const m = c.glb(/^(nyb_|ph_|oy_|sw_|lt_)/.test(name) || o.raw ? name : 'ph_' + name, { h: o.h, len: o.len, x, y, z, ry: o.ry || 0, parent: g, shadow: !o.y });
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
  // v3 (Astra: "stop staging a character showroom in the foreground"): New Yorkers walk the sidewalks, up and down along the
  // buildings, facing where they are going, instead of looping through the middle of the view
  c.tick((t) => ws.forEach((o) => { const u = t * o.s * 0.6 + o.ph, left = o.k % 2 === 0, x = left ? 1.75 + (o.k % 3) * 0.3 : W - 2.0 - (o.k % 3) * 0.3;
    const z = -5.8 + (Math.sin(u) * 0.5 + 0.5) * 12.4; o.e.position.set(x, 0, z); o.e.rotation.y = Math.cos(u) > 0 ? 0 : PI; }));
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
    else if (kind === 'snow') { const gr = q.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(255,255,255,.5)'); gr.addColorStop(.5, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); }
    else if (kind === 'splat') { blob(64, 64, 22, 18, 'rgba(250,250,245,.95)'); blob(80, 70, 8, 7, 'rgba(250,250,245,.9)'); blob(50, 76, 6, 5, 'rgba(90,90,80,.7)'); }
  }));
}
const FLOORS = {
  subway: [['gum', 70, 0.09], ['litter', 6, 0.16], ['puddle', 3, 1.2]], car: [['gum', 18, 0.07], ['litter', 4, 0.14]], marble: [['gum', 6, 0.06]],
  street: [['gum', 60, 0.1], ['litter', 12, 0.18]], apartment: [], deli: [['gum', 14, 0.08], ['litter', 6, 0.14]], leaves: [['leaf', 160, 0.12], ['gum', 20, 0.09], ['litter', 6, 0.16]],
  park: [['leaf', 140, 0.13], ['litter', 4, 0.15]], pigeon: [['splat', 60, 0.12], ['gum', 20, 0.08], ['litter', 8, 0.16]],
  snow: [['confetti', 160, 0.05], ['litter', 18, 0.16], ['gum', 40, 0.09]], wet: [['puddle', 9, 1.6], ['gum', 50, 0.09], ['litter', 16, 0.17]],
  snowy: [ ['gum', 30, 0.08], ['litter', 6, 0.15]], deck: [], none: [],
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

// ---------- the one night the whole gallery shares ----------
// LT.tree: the tree is lit (room 4, seen again from room 5). LT.night: the night of Chanukah you chose (room 6), which
// Brooklyn (room 7) and the window (room 8) keep. Kept per browser, so the city remembers what you switched on.
const LT = (() => { let s = {}; try { s = JSON.parse(localStorage.getItem('lightings.v1') || '{}'); } catch (e) {}
  // Chanukah by the real calendar, in New York time: the first candle is lit at sundown (about 4:30 pm in December) on the
  // evening before 25 Kislev, and each night begins at the next sundown. 5786: 14 Dec 2025, 5787: 4 Dec 2026,
  // 5788: 24 Dec 2027, 5789: 12 Dec 2028. During Chanukah the real night wins on arrival; out of it, a countdown.
  const FIRST = [[2025, 11, 14], [2026, 11, 4], [2027, 11, 24], [2028, 11, 12]];
  let ny; try { ny = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })); } catch (e) { ny = new Date(); }
  let real = 0, until = 0;
  for (const [y, m, dd] of FIRST) { const st = new Date(y, m, dd, 16, 30), k = Math.floor((ny - st) / 864e5) + 1;
    if (k >= 1 && k <= 8) { real = k; break; } if (k < 1 && !until) until = Math.ceil((st - ny) / 864e5); }
  return { tree: !!s.tree, night: real || s.night || 8, real, until, lit: s.lit || {}, fans: [] }; })();
function ltSave() { try { localStorage.setItem('lightings.v1', JSON.stringify({ tree: LT.tree, night: LT.night, lit: LT.lit })); } catch (e) {} LT.fans.forEach((f) => f()); }
window.LIGHTINGS = LT;
const snd = (c, k, ...a) => { const s = c.sound; if (s && s[k]) s[k](...a); };
const ease = (u) => u * u * (3 - 2 * u);

// ---------- snow ----------
function snowfall(c, r, g, N, box = { x1: 0, x2: W, y1: 0, y2: 12, z1: -D / 2, z2: D / 2 }) {
  const { THREE } = c, pos = new Float32Array(N * 3), sp = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i * 3] = box.x1 + Math.random() * (box.x2 - box.x1); pos[i * 3 + 1] = box.y1 + Math.random() * (box.y2 - box.y1); pos[i * 3 + 2] = box.z1 + Math.random() * (box.z2 - box.z1); sp[i] = 0.35 + Math.random() * 0.5; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  // world sized points blow up into white blobs right in front of the lens: cap the size and fade a flake out inside a metre
  const sm = new THREE.ShaderMaterial({ uniforms: { map: { value: glowTex(c, 'rgba(255,255,255,.9)') }, uH: { value: 500 } }, transparent: true, depthWrite: false,
    vertexShader: 'uniform float uH; varying float vA; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); float d = -mv.z; gl_PointSize = min(0.09 * uH / max(d, .01), 6.); vA = .85 * smoothstep(.6, 1.6, d); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform sampler2D map; varying float vA; void main(){ vec4 t = texture2D(map, gl_PointCoord); if (vA * t.a < .01) discard; gl_FragColor = vec4(t.rgb, t.a * vA); }' });
  const pts = new THREE.Points(geo, sm); pts.frustumCulled = false; g.add(pts);
  pts.onBeforeRender = (rd) => { sm.uniforms.uH.value = rd.domElement.height * 0.5; };
  r.snowBoost = 1;
  c.tick((t, dt, P, ri) => { if (Math.abs(ri - r.i) > 1) return; const k = r.snowBoost || 1;
    for (let i = 0; i < N; i++) { pos[i * 3 + 1] -= dt * sp[i] * k; pos[i * 3] += Math.sin(t * 0.7 + i) * dt * 0.12 * k; if (pos[i * 3 + 1] < box.y1) pos[i * 3 + 1] = box.y2; }
    geo.attributes.position.needsUpdate = true; });
  return pts;
}

// ---------- the plate, projection mapped ----------
// The plate is a photograph rebuilt as geometry from its depth map, built to read true from one spot: the middle of the room
// at eye height. Anything drawn on it in its own uv space is anamorphic for free. uLit and uBand switch it off and back on
// (Dyker Heights); uShow plays snowflakes, sweeps and one enormous eye flower across the stone (Fifth Avenue).
function plateFX(c, r) {
  const { THREE } = c, U = { uLit: { value: 1 }, uBand: { value: 2 }, uShow: { value: 0 }, uFlower: { value: 0 }, uTime: { value: 0 }, uWarm: { value: 0 } };
  let done = false;
  c.tick((t) => { U.uTime.value = t; if (done || !r.plateMesh) return; done = true; const old = r.plateMesh.material;
    const m = new THREE.ShaderMaterial({ uniforms: { map: { value: old.map }, fade: { value: old.alphaMap }, ...U }, transparent: true, side: THREE.DoubleSide, toneMapped: false, fog: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: `uniform sampler2D map, fade; uniform float uLit, uBand, uShow, uFlower, uTime, uWarm; varying vec2 vUv;
        float flake(vec2 p){ float r = length(p); float a = atan(p.y, p.x); a = mod(a + 0.5236, 1.0472) - 0.5236; vec2 q = r * vec2(cos(a), abs(sin(a)));
          float m = smoothstep(0.045, 0.0, q.y) * step(q.x, 1.0);
          for (int k = 1; k <= 3; k++) { float x0 = 0.22 * float(k); float b = abs(q.y - (q.x - x0) * 0.75) ; m += smoothstep(0.04, 0.0, b) * step(x0, q.x) * step(q.x, x0 + 0.32 - 0.06 * float(k)); }
          m += smoothstep(0.12, 0.08, r); return clamp(m, 0., 1.) * smoothstep(1.02, 0.95, r); }
        vec3 flower(vec2 p){ float r = length(p); float a = atan(p.y, p.x); float pet = 0.62 + 0.38 * pow(abs(cos(a * 4.)), 0.6);
          vec3 c = vec3(0.);
          if (r < pet) c = mix(vec3(1.0, 0.95, 0.98), vec3(1.0, 0.31, 0.64), smoothstep(0.25, 1.0, r / pet));
          if (r < 0.42) c = vec3(0.11, 0.3, 0.85); if (r < 0.32) c = vec3(1.); if (r < 0.22) c = vec3(0.13, 0.83, 0.93); if (r < 0.12) c = vec3(0.04, 0.06, 0.13);
          return c * step(r, pet); }
        void main(){
          vec4 tx = texture2D(map, vUv); vec3 col = tx.rgb; float a = texture2D(fade, vUv).g;
          float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
          float lit = max(uLit, step(vUv.x, uBand));
          vec3 dark = col * mix(0.55, 0.06, smoothstep(0.22, 0.65, lum));
          col = mix(dark, col, lit);
          if (uShow > 0.001) {
            float facade = smoothstep(0.32, 0.42, vUv.y);
            vec2 p = vec2(vUv.x * 2.0, vUv.y); vec2 cell = floor(p * 4.); vec2 f = fract(p * 4.) - 0.5;
            float h = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
            float beat = 0.5 + 0.5 * sin(uTime * 3.3 + h * 6.28);
            float s = flake(f * (2.6 - beat * 0.9) ) * step(0.35, h);
            float sweep = smoothstep(0.06, 0.0, abs(fract(vUv.x * 1.5 - uTime * 0.25) - 0.5) - 0.42);
            float rings = smoothstep(0.03, 0.0, abs(fract(length(vec2((vUv.x - 0.5) * 2., vUv.y - 0.62)) * 3. - uTime * 0.6) - 0.5) - 0.44);
            vec3 tint = mix(vec3(1.0, 0.92, 0.75), vec3(1.0, 0.25, 0.25), step(0.66, fract(uTime * 0.11)));
            vec3 show = tint * (s * 1.4 + sweep * 0.5 + rings * 0.35);
            col += show * facade * uShow * (0.25 + lum * 0.85);   // v2.1: the peak was blowing the facade out to white
            col *= mix(1.0, 0.55 + 0.45 * facade, uShow * 0.5);
          }
          if (uFlower > 0.001) { vec2 p = vec2((vUv.x - 0.5) * 2.0, vUv.y - 0.6) / 0.34; vec3 fl = flower(p); float m = step(0.001, dot(fl, vec3(1.)));
            col = mix(col, fl * (0.7 + lum * 1.2) + fl * 0.4, m * uFlower * 0.9); }
          col *= 1.0 + uWarm * vec3(0.25, 0.12, -0.05);
          gl_FragColor = vec4(col, a);
          #include <colorspace_fragment>
        }` });
    r.plateMesh.material = m; c.warm(r.plateMesh); });
  return U;
}

// ---------- LEDs: tens of thousands of bulbs as one draw ----------
// lc colour, ord the order they come on in (0 first, 1 last). uOn sweeps past ord to light them; uMaster is the main switch.
function ledMat(c, size, gain = 2.4) {
  const { THREE } = c;
  return new THREE.ShaderMaterial({
    uniforms: { uOn: { value: 0 }, uMaster: { value: 1 }, uTime: { value: 0 }, uSize: { value: size }, uPR: { value: c.renderer.getPixelRatio() * Math.max(1, innerHeight) / 900 }, uGain: { value: gain }, uChase: { value: 0 }, uMinPx: { value: 0 } },
    vertexShader: `attribute vec3 lc; attribute float ord; uniform float uOn, uMaster, uTime, uSize, uPR, uChase, uMinPx; varying vec3 vC; varying float vA;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv;
        float on = smoothstep(ord - 0.012, ord, uOn) * uMaster;
        float tw = 0.78 + 0.22 * sin(uTime * (1.7 + fract(ord * 91.7) * 3.1) + ord * 517.);
        if (uChase > 0.) tw *= 0.35 + 0.65 * step(0.5, fract(ord * 40. - uTime * uChase));
        vA = on * tw; vC = lc;
        gl_PointSize = max(uSize * uPR * (0.45 + 0.55 * on) * 300. / max(0.5, -mv.z), uMinPx * uPR); }`,
    fragmentShader: `uniform float uGain, uMaster; varying vec3 vC; varying float vA;
      void main(){ vec2 d = gl_PointCoord - .5; float r = length(d); float k = 1. - smoothstep(0., .5, r); float core = 1. - smoothstep(0., .16, r);   /* reversed smoothstep edges are undefined in GLSL: close bulbs drew black pupils */
        vec3 col = mix(vC * 0.05 * uMaster, vC * uGain * k + core * 1.4 * vA, vA); gl_FragColor = vec4(col * k, 1.); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false });
}
const BULB = [[1, 0.24, 0.2], [0.2, 1, 0.42], [0.25, 0.45, 1], [1, 0.7, 0.18], [1, 0.9, 0.72], [1, 0.9, 0.72], [1, 0.4, 0.75]];
function ledPoints(c, g, pts, { size = 0.18, gain, palette = BULB, chase = 0 } = {}) {
  const { THREE } = c, n = pts.length, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), ord = new Float32Array(n);
  pts.forEach((p, i) => { pos.set([p[0], p[1], p[2]], i * 3); const k = p[4] ?? palette[(Math.random() * palette.length) | 0]; col.set(k, i * 3); ord[i] = p[3] ?? 0; });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('lc', new THREE.BufferAttribute(col, 3)); geo.setAttribute('ord', new THREE.BufferAttribute(ord, 1));
  const m = ledMat(c, size, gain); m.uniforms.uChase.value = chase; const o = new THREE.Points(geo, m); o.renderOrder = 3; g.add(o);
  c.tick((t) => { m.uniforms.uTime.value = t; });
  return o;
}
// lights along a polyline, evenly spaced
function strand(path, step, ord0 = 0, ord1 = 1) {
  const out = []; let L = 0; const seg = [];
  for (let i = 1; i < path.length; i++) { const l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1], path[i][2] - path[i - 1][2]); seg.push(l); L += l; }
  const n = Math.max(2, Math.round(L / step));
  for (let k = 0; k <= n; k++) { let d = k / n * L, i = 0; while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; } const u = seg[i] ? d / seg[i] : 0, a = path[i], b = path[i + 1] || a;
    out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u, ord0 + (ord1 - ord0) * k / n]); }
  return out;
}
function flameSprite(c, parent, x, y, z, s = 0.2) {
  const { THREE } = c, f = new THREE.Sprite(new THREE.SpriteMaterial({ map: FLAME.t ||= glowTex(c, 'rgba(255,160,50,.95)'), transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending, color: 0xffd8a0 }));
  f.position.set(x, y, z); f.scale.set(s * 0.6, s, 1); f.visible = false; parent.add(f);
  const ph = Math.random() * 9; c.tick((t) => { if (f.visible) f.scale.set(s * (0.55 + Math.sin(t * 17 + ph) * 0.05), s * (0.95 + Math.sin(t * 23 + ph) * 0.12), 1); });
  return f;
}
const FLAME = {};

// ---------- the tree ----------
// A Norway spruce of H metres: branch cards in whorls round a dark core (instanced, two draws), strands of LEDs on eight
// helices from the base to the top (one draw, they come on in a spiral), and a crystal star of seventy spikes.
const NEEDLES = {};
function needleTex(c) {
  return NEEDLES.t ||= c.canvasTex(256, 128, (q, w, h) => {
    q.clearRect(0, 0, w, h); q.strokeStyle = '#3a2a1a'; q.lineWidth = 4; q.beginPath(); q.moveTo(0, h / 2); q.quadraticCurveTo(w * 0.5, h * 0.52, w, h * 0.46); q.stroke();
    for (let i = 0; i < 520; i++) { const u = Math.random(), x = u * w, y = h / 2 + (Math.random() - 0.5) * h * (0.25 + 0.7 * (1 - u)) * (1 - u * 0.3);
      const g2 = 18 + Math.random() * 40 | 0; q.strokeStyle = `rgb(${g2 * 0.35 | 0},${g2 + 40},${g2 * 0.5 | 0})`; q.lineWidth = 1.6; q.beginPath(); q.moveTo(x, h / 2 + (y - h / 2) * 0.2); q.lineTo(x + 6 + Math.random() * 8, y); q.stroke(); }
    for (let i = 0; i < 70; i++) { q.fillStyle = 'rgba(190,230,200,.35)'; q.fillRect(Math.random() * w, h * 0.2 + Math.random() * h * 0.6, 3, 1); }
  });
}
function buildTree(c, parent, { H = 24, R = 6.2, x = 0, y = 0, z = 0, lights = 18000, size = 0.2, cards = 1, star = true } = {}) {
  const { THREE } = c, T = new THREE.Group(); T.position.set(x, y, z); parent.add(T);
  const rad = (yy) => R * Math.pow(Math.max(0, 1 - (yy - H * 0.05) / (H * 0.95)), 0.92) + R * 0.03;
  T.add(new THREE.Mesh(new THREE.CylinderGeometry(R * 0.05, R * 0.08, H * 0.98, 10), std(c, 0x3a2818, { roughness: 1 })).translateY(H * 0.49));
  const core = new THREE.Mesh(new THREE.ConeGeometry(R * 0.86, H * 0.93, 28, 1, true), std(c, 0x0a1f12, { roughness: 1, side: THREE.DoubleSide })); core.position.y = H * 0.05 + H * 0.465; T.add(core);
  const geo = new THREE.PlaneGeometry(1, 1).translate(0.5, 0, 0);
  const mat = new THREE.MeshStandardMaterial({ map: needleTex(c), alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.92, color: 0xb8d8b8, emissive: 0xffb070, emissiveMap: needleTex(c), emissiveIntensity: 0 });
  const list = [], tiers = Math.round(H / 0.42 * cards);
  for (let k = 0; k < tiers; k++) { const yy = H * 0.05 + (k / tiers) * H * 0.93, r0 = rad(yy), n = Math.max(5, Math.round(2 * PI * r0 / 0.62 * cards));
    for (let j = 0; j < n; j++) { const th = (j / n) * 2 * PI + k * 0.71 + Math.random() * 0.2; list.push([yy, th, r0 * (0.95 + Math.random() * 0.15), 0.28 + Math.random() * 0.2]); } }
  const im = new THREE.InstancedMesh(geo, mat, list.length * 2), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3();
  list.forEach(([yy, th, L, droop], i) => {
    const w = Math.max(0.45, L * 0.5);
    for (let v = 0; v < 2; v++) { e.set(v ? 0 : -PI / 2, -th, -droop, 'YZX'); q.setFromEuler(e); s3.set(L, w, 1); p3.set(0, yy, 0); m4.compose(p3, q, s3); im.setMatrixAt(i * 2 + v, m4); }
  });
  im.frustumCulled = false; T.add(im);
  if (H > 20) { const nt = needleTex(c); nt.generateMipmaps = false; nt.minFilter = THREE.LinearFilter; nt.needsUpdate = true; mat.alphaTest = 0.25; }
  // the strands: eight helices, twenty six turns, base to top; ord is the distance along the helix, so they light in a spiral
  const pts = [], S = 8, N = c.MOBILE ? Math.round(lights * 0.4) : lights;
  for (let i = 0; i < N; i++) { const s = i % S, u = Math.floor(i / S) / (N / S), yy = H * 0.04 + u * H * 0.92, th = u * 26 * 2 * PI + s * 2 * PI / S + (Math.random() - 0.5) * 0.25, rr = rad(yy) * (0.86 + Math.random() * 0.2);
    pts.push([Math.cos(th) * rr, yy, Math.sin(th) * rr, u]); }
  const leds = ledPoints(c, T, pts, { size }); if (H > 20) leds.material.uniforms.uMinPx.value = 2.1;
  const out = { group: T, leds, mat, rad, H, R };
  if (star) {
    const parts = [], up = new THREE.Vector3(0, 1, 0), d = new THREE.Vector3(), SR = H * 0.06;
    for (let i = 0; i < 70; i++) { const yy = 1 - (i + 0.5) / 70 * 2, rr = Math.sqrt(1 - yy * yy), th = i * 2.39996; d.set(Math.cos(th) * rr, yy, Math.sin(th) * rr * 0.42).normalize();
      const L = SR * (0.62 + Math.random() * 0.38), cg = new THREE.ConeGeometry(SR * 0.075, L, 5).translate(0, L / 2, 0); cg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, d)); parts.push(cg); }
    parts.push(new THREE.IcosahedronGeometry(SR * 0.28, 1));
    const sg = mergeGeometries(parts.map((p) => p.toNonIndexed())); sg.computeVertexNormals();
    const sm = new THREE.MeshPhysicalMaterial({ color: 0xfff4dc, emissive: 0xfff0c8, emissiveIntensity: 0.04, metalness: 0.15, roughness: 0.06, iridescence: 1, iridescenceIOR: 1.6, envMapIntensity: 2.5 });
    const st = new THREE.Mesh(sg, sm); st.position.y = H + SR * 0.55; T.add(st);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,236,190,.85)'), transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    glow.scale.setScalar(SR * 5); glow.position.y = st.position.y; T.add(glow);
    const sp = []; for (let i = 0; i < 260; i++) { const th = Math.random() * 2 * PI, yy = (Math.random() - 0.5) * 2, rr = Math.sqrt(1 - yy * yy), L = SR * (0.2 + Math.random() * 0.8); sp.push([Math.cos(th) * rr * L, st.position.y + yy * L, Math.sin(th) * rr * L * 0.42, 0.999, [1, 0.97, 0.9]]); }
    const sparks = ledPoints(c, T, sp, { size: size * 0.9, gain: 3 });
    out.star = { st, sm, glow, sparks };
    c.tick((t) => { st.rotation.y = Math.sin(t * 0.25) * 0.25; });
  }
  // how lit the tree is, 0 to 1.04: the spiral passes the top at 1, the star takes the last few hundredths
  out.set = (v) => { leds.material.uniforms.uOn.value = v; mat.emissiveIntensity = Math.min(1, v) * 0.32; if (out.star) { const k = Math.max(0, Math.min(1, (v - 0.99) / 0.05)); out.star.sm.emissiveIntensity = 0.04 + k * 3.2; out.star.glow.material.opacity = k * 0.95; out.star.sparks.material.uniforms.uOn.value = k > 0.5 ? 1.01 : 0; } };
  out.set(0);
  return out;
}

// ---------- menorahs ----------
// lamps are numbered from the visitor's left. On night n the n rightmost carry oil; they are lit newest first, left to right,
// after the shamash. lit(n) returns that order.
const lightOrder = (n) => Array.from({ length: n }, (_, k) => 8 - n + k);
function lamp(c, g, x, y, z, { chimney = true, s = 1, metal } = {}) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, y, z); g.add(o);
  o.add(new THREE.Mesh(new THREE.CylinderGeometry(0.15 * s, 0.1 * s, 0.14 * s, 16), metal).translateY(0.07 * s));
  if (chimney) { const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.13 * s, 0.46 * s, 18, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, roughness: 0.04, metalness: 0, side: THREE.DoubleSide, depthWrite: false })); gl.position.y = 0.37 * s; o.add(gl); }
  const f = flameSprite(c, o, 0, 0.3 * s, 0, 0.3 * s);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.5 * s, 0.8 * s, 0.5 * s), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 0.35 * s; o.add(hit);
  // v2.1: a soft halo around each lit chimney, so the night's count reads from across the plaza (a bare 30 cm flame did not)
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: FLAME.h ||= glowTex(c, 'rgba(255,190,110,.9)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0.75 }));
  halo.position.y = 0.36 * s; halo.scale.set(1.3 * s, 1.5 * s, 1); halo.visible = false; o.add(halo);
  const ph = Math.random() * 9; c.tick((t) => { if (halo.visible) halo.material.opacity = 0.62 + Math.sin(t * 7 + ph) * 0.06 + Math.sin(t * 13 + ph) * 0.04; });
  return { o, f, hit, set: (on) => { f.visible = on; halo.visible = on; } };
}
// Fifth Avenue's: a square stem, straight diagonal arms after the old drawing, lamps under glass chimneys
function menorahFifth(c, g, x, z, gold) {
  const { THREE } = c, M = new THREE.Group(); M.position.set(x, 0, z); g.add(M);
  const LY = 6.7, SP = 0.98;
  M.add(c.slab(8.8, 0.7, 2.4, std(c, 0x22242a, { roughness: 0.7 }), 0, 0.35, 0));
  M.add(c.slab(1.2, 0.5, 1.2, gold, 0, 0.95, 0)); M.add(c.slab(0.34, LY + 0.9 - 1.2, 0.34, gold, 0, 1.2 + (LY + 0.9 - 1.2) / 2, 0));
  for (const sx of [-1, 1]) for (let k = 1; k <= 4; k++) { const ax = sx * k * SP, y0 = LY - k * SP, L = Math.hypot(ax, LY - y0);
    const arm = c.slab(0.2, L, 0.2, gold, ax / 2, (y0 + LY) / 2, 0); arm.rotation.z = -Math.atan2(ax, LY - y0); M.add(arm); M.add(c.slab(0.24, 0.12, 0.24, gold, ax, LY - 0.05, 0)); }
  for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 8), std(c, 0x888888, { metalness: 0.8 })); r.position.set(-4.2 + i * 1.68, 1.25, 1.1); M.add(r); }
  M.add(c.slab(8.6, 0.06, 0.06, std(c, 0x888888, { metalness: 0.8 }), 0, 1.8, 1.1));
  const lamps = []; for (let i = 0; i < 8; i++) { const lx = (i < 4 ? -(4 - i) : i - 3) * SP; lamps.push(lamp(c, M, lx, LY, 0, { metal: gold })); }
  const sham = lamp(c, M, 0, LY + 0.9, 0, { metal: gold });
  // v5: the modelled menorah (Krea concept, Tripo H3.1) replaces the boxes; the code keeps only the flames, halos and hit boxes,
  // set into its chimneys. Its outer lamps span 94% of its width, so a 8.33 m model puts them on the old 0.98 m spacing.
  const glbM = c.glb('lt_menorah_m', { len: 8.33, parent: M, shadow: true, onload: (gg, sc) => {
    const b = new THREE.Box3().setFromObject(sc), top = b.max.y - M.position.y;
    M.children.forEach((ch) => { if (ch !== gg && ch.isMesh) ch.visible = false; });
    // the eight lamps sit 13% of the height below the top, the shamash 3% below it
    const ly = top * 0.835 - 0.3, sy = top * 0.955 - 0.3; [...lamps, sham].forEach((L, i) => { L.o.children.forEach((ch) => { if (ch.isMesh && ch !== L.hit) ch.visible = false; }); L.o.position.y = i < 8 ? ly : sy; });
    out.LY = ly; } });
  const out = { M, lamps, sham, LY, z, glb: glbM };
  return out;
}
// Brooklyn's: the other largest, round arms, lamps under glass
function menorahBrooklyn(c, g, x, z, gold) {
  const { THREE } = c, M = new THREE.Group(); M.position.set(x, 0, z); g.add(M);
  const LY = 6.9, SP = 0.95;
  M.add(c.slab(8.6, 0.6, 2.2, std(c, 0x2a2420, { roughness: 0.7 }), 0, 0.3, 0));
  M.add(new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.3, 0.8, 24), gold).translateY(1.0));
  M.add(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, LY + 0.8 - 1.4, 16), gold).translateY(1.4 + (LY + 0.8 - 1.4) / 2));
  for (let k = 1; k <= 4; k++) { const rr = k * SP, tor = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.11, 10, 48, PI), gold); tor.rotation.z = PI; tor.position.y = LY; M.add(tor); }
  const lamps = []; for (let i = 0; i < 8; i++) { const lx = (i < 4 ? -(4 - i) : i - 3) * SP; lamps.push(lamp(c, M, lx, LY, 0, { metal: gold })); }
  const sham = lamp(c, M, 0, LY + 0.8, 0, { metal: gold });
  // v5: the modelled curved menorah (Krea concept, Tripo H3.1); outer lamps span 92% of it, so 8.25 m keeps the 0.95 m spacing
  c.glb('lt_menorah_b', { len: 8.25, parent: M, shadow: true, onload: (gg, sc) => {
    const top = new THREE.Box3().setFromObject(sc).max.y - M.position.y;
    M.children.forEach((ch) => { if (ch !== gg && ch.isMesh) ch.visible = false; });
    [...lamps, sham].forEach((L, i) => { L.o.children.forEach((ch) => { if (ch.isMesh && ch !== L.hit) ch.visible = false; }); L.o.position.y = top * (i < 8 ? 0.8 : 0.93) - 0.3; /* the flame sits 0.3 m above its lamp group */ }); } });
  return { M, lamps, sham, LY, z };
}
// a night picker: TONIGHT, NIGHT n OF 8, with arrows either side
function nightPicker(c, g, X, x, y, z, ry, onPick) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, y, z); o.rotation.y = ry; g.add(o);
  const b = board(c, o, 1.9, 0.9, 256);
  const draw = () => { const { q, W: w, H: h } = b; q.fillStyle = '#10131c'; q.fillRect(0, 0, w, h); q.strokeStyle = '#d6a640'; q.lineWidth = 6; q.strokeRect(6, 6, w - 12, h - 12);
    q.fillStyle = '#f4ead2'; q.textAlign = 'center'; q.font = `700 ${h * (LT.real ? 0.13 : 0.085)}px ${c.MONO}`; q.fillText(LT.real ? (LT.night === LT.real ? 'TONIGHT, BY THE CALENDAR' : 'TONIGHT IS NIGHT ' + LT.real) : LT.until ? `CHANUKAH IN ${LT.until} DAY${LT.until === 1 ? '' : 'S'} · PICK A NIGHT` : 'PICK TONIGHT', w / 2, h * 0.24);
    q.font = `900 ${h * 0.36}px ${c.SERIF}`; q.fillStyle = '#ffd27a'; q.fillText(`NIGHT ${LT.night}`, w / 2, h * 0.62);
    q.font = `700 ${h * 0.12}px ${c.MONO}`; q.fillStyle = '#9aa4c0'; q.fillText('<  CLICK THE ARROWS  >', w / 2, h * 0.86); b.up(); };
  draw(); LT.fans.push(draw);
  for (const sx of [-1, 1]) { const a = c.sign(sx < 0 ? '<' : '>', { w: 0.32, h: 0.5, bg: '#d6a640', fg: '#10131c', font: c.SERIF, weight: 900 }); a.position.set(sx * 1.2, 0, 0.01); o.add(a);
    c.clickable(a, () => { LT.night = Math.max(1, Math.min(8, LT.night + sx)); snd(c, 'click'); ltSave(); onPick && onPick(); }, sx < 0 ? 'One night earlier' : 'One night later'); }
  o.add(c.slab(0.08, y, 0.08, std(c, 0x222222), 0, -y / 2, -0.05)); c.post(X(x), z, 0.3);
  return o;
}

// ---------- the props per room (Poly Haven CC0 and the house models) ----------
const PROPS = {
  fifth: [['street_lamp_02', 1.4, -5.6, { h: 4.6, r: 0.3 }], ['street_lamp_02', 18.6, -5.6, { h: 4.6, r: 0.3 }], ['mailbox', 17.8, 2.2, { h: 1.25, r: 0.4, raw: true, ry: -PI / 2 }],
    ['nyb_barrier', 4.0, -6.6, { len: 1.55 }], ['nyb_barrier', 5.8, -6.6, { len: 1.55 }], ['nyb_barrier', 14.2, -6.6, { len: 1.55 }], ['nyb_barrier', 16.0, -6.6, { len: 1.55 }]],
  channel: [],
  rink: [['nyb_rink_gift_a', 1.4, -6.4, { h: 1.3, r: 0.7 }], ['nyb_rink_gift_b', 18.6, -6.4, { h: 1.5, r: 0.7 }]],
  tree: [['street_lamp_02', 1.4, 1.0, { h: 4.6, r: 0.3 }], ['street_lamp_02', 18.6, 1.0, { h: 4.6, r: 0.3 }]],
  top: [],
  menorah: [['street_lamp_01', 1.4, -5.6, { h: 4.4, r: 0.3 }], ['street_lamp_01', 18.6, 0.6, { h: 4.4, r: 0.3 }], ['painted_wooden_bench', 2.0, -1.4, { len: 1.8, ry: PI / 2, r: 0.8 }]],
  brooklyn: [['street_lamp_01', 1.4, -5.6, { h: 4.4, r: 0.3 }], ['street_lamp_01', 18.6, -5.6, { h: 4.4, r: 0.3 }], ['CoffeeCart_01', 17.2, -1.0, { len: 2.2, ry: -PI / 2, r: 1.1, egg: ['The latke cart', 'latkes', 'Latkes and jelly doughnuts at a menorah lighting: the miracle was oil, so the menu is fried. A rare holiday where the food is also the footnote.'] }]],
  window: [['wooden_bookshelf_worn', 19.2, -6.8, { h: 2.2, ry: -PI / 2, r: 0.6 }], ['sofa_02', 13.0, 2.2, { len: 2.1, ry: PI, r: 0.9 }], ['potted_plant_02', 18.8, -1.0, { h: 1.2, r: 0.3 }], ['electric_stove', 1.2, -7.0, { h: 0.95, ry: PI / 2, r: 0.6 }], ['WoodenTable_01', 6.0, -2.2, { len: 1.6, r: 0.9 }], ['WoodenChair_01', 5.2, -1.2, { h: 0.9, ry: PI * 0.9 }], ['WoodenChair_01', 6.8, -1.2, { h: 0.9, ry: PI * 1.1 }]],
  dyker: [['nutcracker', 2.2, -5.8, { h: 3.6, raw: true, ry: PI / 2, r: 0.6 }], ['nutcracker', 17.8, -5.8, { h: 3.6, raw: true, ry: -PI / 2, r: 0.6 }], ['nyb_big_soldier', 2.4, -1.4, { h: 2.4, ry: PI / 2, r: 0.5 }],
    ['garden_gnome', 17.6, -5.0, { h: 0.7, ry: -PI / 2 }], ['wooden_ladder', 18.4, -1.2, { h: 3.2, ry: -PI / 2, r: 0.4, egg: ['A ladder', 'ladder', 'Some households hire professional decorators. Holiday spirit has subcontractors, and the subcontractors have a waiting list.'] }]],
};
// the census New Yorkers hang where the room leaves room for them
function slotsDefault() {
  const S = [], south = D / 2 - 0.14;
  for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 2.1, z: south, ry: PI, w: 1.5 });
  [-6.6, -4.2, -1.8].forEach((z) => S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 }));
  [-4.2, -1.8].forEach((z) => S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 }));
  return S;
}
const south7 = (y = 2.1, w = 1.5) => Array.from({ length: 7 }, (_, i) => ({ x: 2.2 + i * 2.6, y, z: D / 2 - 0.14, ry: PI, w }));
const SLOTS = {
  channel: () => [...south7(), { x: 0.14, y: 2.4, z: 6.6, ry: PI / 2, w: 1.2 }, { x: W - 0.4, y: 2.4, z: 6.6, ry: -PI / 2, w: 1.2 }],
  rink: () => [...south7(2.6), ...[-6.4, -3.8, -1.2].map((z) => ({ x: 0.14, y: 2.8, z, ry: PI / 2, w: 1.4 })), ...[-3.8, -1.2].map((z) => ({ x: W - 0.4, y: 2.8, z, ry: -PI / 2, w: 1.4 }))],
  menorah: () => [...south7(), ...[-4.4, -2.0].map((z) => ({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 }))],
  window: () => [...south7(1.8, 1.3), ...[-4.2, -1.8].map((z) => ({ x: 0.14, y: 1.8, z, ry: PI / 2, w: 1.2 })), ...[-4.2, -1.8].map((z) => ({ x: W - 0.4, y: 1.8, z, ry: -PI / 2, w: 1.2 }))],
  dyker: () => [...south7(2.4)],
  top: () => [...south7(2.0, 1.4), ...[-4.2, -1.8].map((z) => ({ x: 0.14, y: 2.0, z, ry: PI / 2, w: 1.3 })), ...[-4.2, -1.8].map((z) => ({ x: W - 0.4, y: 2.0, z, ry: -PI / 2, w: 1.3 }))],
};
const GOLD = (c) => std(c, 0xd8a83e, { metalness: 1, roughness: 0.22 });

// ---------- the rooms ----------
const ROOM = {
  // THE SHOW ACROSS THE STREET. Stand on the X and the facade plays; it resolves into one enormous eye flower only from there.
  fifth(c, r, g, X) {
    const { THREE } = c, U = plateFX(c, r);
    const xm = decal(c, 1.3, 1.3, (q, w, h) => { q.strokeStyle = '#ff6b00'; q.lineWidth = w * 0.13; q.lineCap = 'round'; q.beginPath(); q.moveTo(w * 0.18, h * 0.18); q.lineTo(w * 0.82, h * 0.82); q.moveTo(w * 0.82, h * 0.18); q.lineTo(w * 0.18, h * 0.82); q.stroke(); });
    xm.rotation.x = -PI / 2; xm.position.set(W / 2, 0.012, 0); g.add(xm);
    const lbl = decal(c, 1.6, 0.34, (q, w, h) => { q.fillStyle = '#ff6b00'; q.font = `700 ${h * 0.5}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('"X"   STAND HERE', w / 2, h * 0.68); });
    lbl.rotation.x = -PI / 2; lbl.position.set(W / 2, 0.012, 1.0); g.add(lbl);
    const sign = notice(c, g, '"THE SHOW"\nEVERY TEN MINUTES, OR WHENEVER YOU STAND ON THE X', 18.6, 2.6, -4.4, -PI / 2, 2.0, 0.6); c.clickable(sign, () => c.egg('compass', 'The store is on the east side of the avenue and faces the gardens. Manhattan still expects you to know which way east is, at night, in December.'), 'A sign');
    let on = -1, told = false;
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) { if (on >= 0) { on = -1; } U.uShow.value = Math.max(0, U.uShow.value - dt); U.uFlower.value = 0; return; }
      const L = local(r, P), onX = Math.hypot(L.x - W / 2, L.z) < 0.7;
      if (onX && on < 0) { on = 0; snd(c, 'whoosh', 0.6, 3); c.music.level && c.music.level(1.3); if (!told) { told = true; c.toast('Do not move. The building is doing something.', 2600); } }
      if (on >= 0) { on += dt; U.uShow.value = Math.min(1, U.uShow.value + dt * 0.8);
        const fl = on > 14 && on < 24 ? Math.min(1, (on - 14) / 2) * Math.min(1, (24 - on) / 1.5) : 0; U.uFlower.value = fl * (onX ? 1 : 0.35);
        if (on > 16 && onX && !r.flowered) { r.flowered = true; c.flash(0.25); c.egg('show', 'From the X, and only from the X, the whole facade becomes one eye flower. The light show here has run most Decembers since 2004, and skipped 2024. Even electricity declined an invitation once.'); }
        if (on > 30) { on = -1; c.music.level && c.music.level(1); }
      } else U.uShow.value = Math.max(0, U.uShow.value - dt * 0.5);
    });
    // the shoppers, the barricades, the hot nut cart
    walkers(c, g, 10, { x1: 2.2, x2: 17.8, z1: 2.4, z2: 6.6, pool: 'night' });
    const cart = c.glb('ph_CoffeeCart_01', { len: 2.2, x: 2.6, z: 3.2, ry: 0.4, parent: g }); c.post(X(2.6), 3.2, 1.1);
    cardboard(c, g, 'NUTS 4 NUTS\nHOT', 2.6, 2.3, 3.2, 0.4, 0.8);
    c.clickable(cart, () => c.egg('nuts', 'Honey roasted nuts, smelt from a block away, eaten by nobody who intended to. The cart is the most successful light show on the avenue: it works by smell.'), 'A nut cart');
    const key = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.018, 8, 20), GOLD(c)); eggBox(c, g, X, key, 4.9, 0.95, -6.55, 'key', 'A brass key', 'The store opened here in 1924. The key predates your appointment window.');
    const mini = c.slab(0.4, 0.3, 0.12, std(c, 0x111114), 0, 0, 0); eggBox(c, g, X, mini, 15.1, 0.98, -6.55, 'dark', 'A small dark facade', 'A model of the facade with the show switched off: there was none in 2024. The building took a December off. The crowd came anyway.');
  },

  // THE CHANNEL GARDENS. Twelve wire angels. Each lifts its trumpet as you pass; the twelfth plays once all twelve have.
  channel(c, r, g, X) {
    const { THREE } = c;
    const granite = std(c, 0x8a8478, { roughness: 0.6 }), soil = std(c, 0x1e1812, { roughness: 1 }), water = std(c, 0x0a1830, { roughness: 0.04, metalness: 0.6 });
    const beds = [[-7.0, -3.6], [-2.8, 1.2]];
    const shrubG = new THREE.IcosahedronGeometry(0.34, 1).scale(1, 0.75, 1), shrubM = std(c, 0x163a22, { roughness: 0.9 }), poinG = new THREE.SphereGeometry(0.075, 8, 5).scale(1.4, 0.55, 1.4), poinW = std(c, 0xf4f0ea, { roughness: 0.8 }), poinR = std(c, 0xb0102a, { roughness: 0.8 });
    const shrubs = [], poins = [], twinkle = [];
    for (const [x1, x2] of [[7.0, 13.0]]) for (const [z1, z2] of beds) {   // round six: the beds run down the middle, as they do; you walk the sides
      const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2, w = x2 - x1, d = z2 - z1;
      g.add(c.slab(w, 0.72, d, granite, cx, 0.36, cz)); g.add(c.slab(w - 0.3, 0.06, d - 0.3, soil, cx, 0.72, cz));
      c.wall(X(x1), z1, X(x2), z1); c.wall(X(x1), z2, X(x2), z2); c.wall(X(x1), z1, X(x1), z2); c.wall(X(x2), z1, X(x2), z2);
      const px = (x1 + x2) / 2; g.add(c.slab(1.6, 0.05, d - 1.0, water, px, 0.76, cz));
      for (let i = 0; i < 26; i++) { const sx = x1 + 0.3 + Math.random() * (w - 0.6), sz = z1 + 0.3 + Math.random() * (d - 0.6); if (Math.abs(sx - px) < 0.8) continue; shrubs.push([sx, sz, 0.45 + Math.random() * 0.4]); for (let k = 0; k < 6; k++) twinkle.push([sx + (Math.random() - 0.5) * 0.5, 0.9 + Math.random() * 0.7, sz + (Math.random() - 0.5) * 0.5, Math.random() * 0.2, [1, 0.88, 0.6]]); }
      for (let i = 0; i < 40; i++) poins.push([x1 + 0.2 + Math.random() * (w - 0.4), z1 + 0.2 + Math.random() * (d - 0.4), Math.random() < 0.7]);
    }
    const m4 = new THREE.Matrix4(), sIm = new THREE.InstancedMesh(shrubG, shrubM, shrubs.length);
    shrubs.forEach(([x, z, h], i) => { m4.makeScale(1, h, 1).setPosition(x, 0.75 + h * 0.4, z); sIm.setMatrixAt(i, m4); }); g.add(sIm);
    for (const [col, want] of [[poinW, true], [poinR, false]]) { const list = poins.filter((p) => p[2] === want), im = new THREE.InstancedMesh(poinG, col, list.length); list.forEach(([x, z], i) => { m4.makeTranslation(x, 0.82, z); im.setMatrixAt(i, m4); }); g.add(im); }
    ledPoints(c, g, twinkle, { size: 0.07, gain: 1.6 }).material.uniforms.uOn.value = 1.1;
    // the angels: six a side on the inner edge of the beds, facing up the promenade to the tree
    const spots = [0.8, -0.6, -2.1, -4.1, -5.3, -6.5];
    const angels = [];
    for (const side of [-1, 1]) spots.forEach((z) => { const x = side < 0 ? 7.3 : 12.7;
      const o = new THREE.Group(); o.position.set(x, 0.74, z); g.add(o);
      const WA = wireAngel(c), m = WA.mesh; m.rotation.y = side < 0 ? 0.35 : -0.35; o.add(m);   // v4: a wire sculpture, not a Tripo blob
      const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: HEAD.t ||= c.canvasTex(256, 256, (q, w) => eyeFlower(q, w / 2, w / 2, w / 2 * 0.98)), transparent: true })); head.scale.setScalar(0.42); head.position.set(0, 2.05, 0.02); o.add(head);
      const a = { o, m, x, z, on: false, side, leds: null }; angels.push(a);
      { const q = new THREE.Group(); q.rotation.y = m.rotation.y; o.add(q); a.leds = ledPoints(c, q, WA.pts, { size: 0.045, gain: 2.3 }); a.leds.material.uniforms.uOn.value = 0.08; }
      c.clickable(m, () => c.egg('feather', 'Twelve wire herald angels, each about eight feet tall, have lined these gardens since 1954. Their attendance record is difficult to challenge.'), 'A herald angel');
    });
    let n = 0, done = false; const scale = [523, 587, 659, 698, 784, 880, 988, 1047, 1175, 1319, 1397, 1568];
    const stream = []; for (let i = 0; i < 600; i++) stream.push([0, 0, 0, i / 600, [1, 0.9, 0.6]]);
    const st = ledPoints(c, g, stream, { size: 0.09, gain: 2.6 }); st.visible = false; const sp = st.geometry.attributes.position;
    let fly = -1;
    c.tick((t, dt, P, ri) => {
      if (!here(r, ri)) return;
      const L = local(r, P);
      angels.forEach((a) => {
        if (!a.on && L.z < a.z + 0.4 && L.z > a.z - 3) { a.on = true; n++; snd(c, 'note', scale[Math.min(11, n - 1)] / 2, 0.2); }
        const k = a.on ? 1 : 0; a.o.rotation.x += ((a.on ? -0.1 : 0.08) - a.o.rotation.x) * Math.min(1, dt * 3); a.o.position.y += ((a.on ? 0.84 : 0.74) - a.o.position.y) * Math.min(1, dt * 3);
        if (a.leds) { const u = a.leds.material.uniforms.uOn; u.value += ((k ? 1.1 : 0.08) - u.value) * Math.min(1, dt * 2); }
      });
      if (n === 12 && !done) { done = true; fly = 0; st.visible = true; snd(c, 'horn', 0.3); setTimeout(() => snd(c, 'horn', 0.3), 420); snd(c, 'chords', 8); c.flash(0.15);
        c.egg('herald', 'All twelve acknowledged you, so the twelfth plays. The angels have pointed their trumpets at the tree since 1954. Eleven introductions. One musician.'); }
      if (fly >= 0) { fly += dt; for (let i = 0; i < 600; i++) { const a = angels[i % 12], u = Math.min(1, Math.max(0, (fly * 0.35 - (i / 600) * 0.6))), wob = Math.sin(i * 7.1 + t * 3) * 0.4;
          sp.setXYZ(i, a.x + (10 - a.x) * u + wob * (1 - u), 3.1 + u * 19 + Math.sin(i) * 0.3, a.z + ((r.treeZ ?? -60) - a.z) * u + wob); }
        sp.needsUpdate = true; if (fly > 6) { fly = -1; st.visible = false; } }
    });
    walkers(c, g, 8, { x1: 7.4, x2: 12.6, z1: -6.2, z2: 6.4, pool: 'night' });
    const twin = c.slab(0.5, 0.4, 0.4, std(c, 0xc8c0b0, { roughness: 0.7 }), 0, 0, 0); eggBox(c, g, X, twin, 6.9, 0.2, 6.6, 'buildings', 'Two little buildings', 'The British and French buildings either side give the Channel Gardens their name: the channel between them. The crossing requires no passport.', 0.4);
    const tile = c.slab(0.5, 0.04, 0.5, std(c, 0x2a5a80, { roughness: 0.2, metalness: 0.4 }), 0, 0, 0); eggBox(c, g, X, tile, 13.1, 0.02, 6.6, 'pools', 'A pool tile', 'The gardens hold six pools. Midtown lets water sit down. Nobody else gets to.');
  },

  // THE RINK. The ice is a mirror, the walk becomes a glide, and the ice keeps your line until the resurfacer comes.
  rink(c, r, g, X) {
    const { THREE } = c;
    if (!c.MOBILE) { const ice = new Reflector(new THREE.PlaneGeometry(W - 0.3, D - 0.3), { clipBias: 0.003, textureWidth: 1024, textureHeight: 1024, color: 0x343a44 }); ice.rotation.x = -PI / 2; ice.position.set(W / 2, -0.002, 0); g.add(ice); }
    const iceT = c.canvasTex(1024, 1024, (q, w, h) => { q.fillStyle = 'rgba(235,242,250,.38)'; q.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { q.strokeStyle = `rgba(255,255,255,${0.04 + Math.random() * 0.12})`; q.lineWidth = 0.6 + Math.random() * 1.6; q.beginPath(); const x = Math.random() * w, y = Math.random() * h, a = Math.random() * 6.28, L = 40 + Math.random() * 260; q.arc(x, y, L, a, a + 0.4 + Math.random() * 0.8); q.stroke(); } });
    const frost = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: iceT, transparent: true, roughness: c.MOBILE ? 0.1 : 0.35, metalness: c.MOBILE ? 0.4 : 0, color: c.MOBILE ? 0xd8e4f0 : 0xffffff, opacity: c.MOBILE ? 1 : 0.85, depthWrite: false }));
    frost.rotation.x = -PI / 2; frost.position.set(W / 2, 0.003, 0); frost.renderOrder = 1; g.add(frost);
    // the boards, white with a brass cap, west and east
    const board_ = std(c, 0xf2f2f0, { roughness: 0.5 }), cap = GOLD(c);
    for (const x of [0.55, W - 0.55]) for (const [z1, z2] of [[-7.6, 1.6], [6.0, 7.6]]) { g.add(c.slab(0.12, 1.05, z2 - z1, board_, x, 0.52, (z1 + z2) / 2)); g.add(c.slab(0.18, 0.06, z2 - z1, cap, x, 1.07, (z1 + z2) / 2)); c.wall(X(x), z1, X(x), z2); }
    // Prometheus over his fountain, at the head of the rink
    // the trail
    const N = 700, disc = new THREE.InstancedMesh(new THREE.CircleGeometry(0.11, 10).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }), N);
    disc.frustumCulled = false; g.add(disc); const tr = [], m4 = new THREE.Matrix4(), col = new THREE.Color(); let head = 0, lx = 0, lz = 0, dist = 0, fig = false, gold = 0;
    for (let i = 0; i < N; i++) { tr.push({ x: 0, z: 0, age: 99, d: 0 }); m4.makeTranslation(0, -5, 0); disc.setMatrixAt(i, m4); disc.setColorAt(i, col.setRGB(0, 0, 0)); }
    // the cast on the ice: three who can, two who cannot, and the resurfacer
    const sk = [];
    [['lt_skater', 7.2, 4.4, 0.32, 0], ['lt_skater', 5.8, 3.2, 0.41, 2.1], ['lt_skater', 4.4, 2.2, 0.5, 4.0], ['lt_wobbler', 3.4, 1.6, 0.14, 1.0], ['lt_wobbler', 6.4, 3.8, 0.11, 3.6]].forEach(([nm, ax, az, w, ph], k) => {
      const o = new THREE.Group(); g.add(o); const m = c.glb(nm, { h: 1.75, parent: o }); const p = c.post(0, 0, 0.45); sk.push({ o, m, ax, az, w, ph, p, wob: nm === 'lt_wobbler', k });
      c.clickable(m, () => c.say(m, nm === 'lt_wobbler' ? ['First time. Also last time. Also, can you hold this.', 'I paid for ninety minutes. I have used eleven.', 'The wall is my friend. Where is the wall.'][k % 3] : ['Edges, not toes. Toes are for the sidewalk.', 'The rink opened as a temporary attraction. That was 1936.', 'Lean in. The ice can smell fear.'][k % 3], 3000, 2.1), 'A skater'); });
    const zam = new THREE.Group(); g.add(zam); const zm = c.glb('lt_zamboni', { len: 3.6, parent: zam }); const zp = c.post(0, 0, 1.3);
    c.clickable(zm, () => c.egg('zamboni', 'The resurfacer shaves the ice, washes it and lays down a film of warm water that freezes flat. It erases everything. Even you. Especially you.'), 'The resurfacer');
    const sk36 = new THREE.Group(); sk36.add(c.slab(0.12, 0.2, 0.32, std(c, 0x5a3a22, { roughness: 0.7 }), 0, 0.14, 0)); sk36.add(c.slab(0.02, 0.03, 0.38, std(c, 0xcccccc, { metalness: 1, roughness: 0.2 }), 0, 0.02, 0));
    eggBox(c, g, X, sk36, 18.2, 1.1, 4.0, 'skate', 'A rental skate', 'Stamped 1936: the rink opened that Christmas Day as a temporary attraction. New York has several definitions of temporary.');
    c.tick((t, dt, P, ri) => {
      sk.forEach((s) => { if (!s.go && s.m.userData.play) { s.m.userData.play('walk', s.wob ? 0.55 : 1.15); s.go = 1; } const a = t * s.w + s.ph, x = W / 2 + Math.cos(a) * s.ax, z = -0.5 + Math.sin(a) * s.az; s.o.position.set(x, 0, z); s.o.rotation.y = Math.atan2(-Math.sin(a) * s.ax, Math.cos(a) * s.az) + (s.wob ? 0 : (Math.sin(t * 0.4 + s.k) > 0.93 ? t * 9 : 0)); s.o.rotation.z = s.wob ? Math.sin(t * 5 + s.k) * 0.18 : 0; s.p.x = X(x); s.p.z = z; });
      const za = t * 0.08, zx = W / 2 + Math.cos(za) * 7.6, zz = -0.6 + Math.sin(za) * 5.6; zam.position.set(zx, 0, zz); zam.rotation.y = Math.atan2(-Math.sin(za) * 7.6, Math.cos(za) * 5.6); zp.x = X(zx); zp.z = zz;
      if (!here(r, ri)) return;
      const L = local(r, P), mv = Math.hypot(L.x - lx, L.z - lz);
      if (mv > 0.16) { dist += mv; lx = L.x; lz = L.z; head = (head + 1) % N; Object.assign(tr[head], { x: L.x, z: L.z, age: 0, d: dist });
        for (const q of tr) if (q.age < 30 && dist - q.d > 6 && Math.hypot(q.x - L.x, q.z - L.z) < 0.45) { if (!fig) { fig = true; c.egg('figure', 'You closed a loop. The ice keeps the figure in gold until the resurfacer comes. Finally, a paper trail worth keeping.'); snd(c, 'ding'); } gold = 2.5; break; } }
      if (gold > 0) gold -= dt;
      for (let i = 0; i < N; i++) { const q = tr[i]; q.age += dt; if (Math.hypot(q.x - zx, q.z - zz) < 1.5) q.age = 99; const k = Math.max(0, 1 - q.age / 28);
        m4.makeTranslation(q.x, k > 0 ? 0.008 : -5, q.z); disc.setMatrixAt(i, m4); disc.setColorAt(i, gold > 0 ? col.setRGB(1.6 * k, 1.1 * k, 0.3 * k) : col.setRGB(0.5 * k, 0.9 * k, 1.4 * k)); }
      disc.instanceMatrix.needsUpdate = true; disc.instanceColor.needsUpdate = true;
      if (dist > 160 && !r.long) { r.long = true; c.egg('laps', `A hundred and sixty metres of skating. The ice surface is about 122 by 59 feet; you have used most of it twice.`); }
    });
    c.tick((t, dt, P, ri) => { if (here(r, ri) && !r.toldIce) { r.toldIce = true; setTimeout(() => c.toast('Ice. You glide now. Let go to coast; it takes a while to stop.', 3200), 600); } });
  },

  // THE LIGHTING. Press the switch; the crowd counts with you; the strands come on in a spiral from the base; then the star.
  tree(c, r, g, X) {
    const { THREE } = c;
    const T = buildTree(c, g, { H: RP.TH, R: RP.TR, x: W / 2, y: r.treeY || 0, z: r.treeZ ?? -16.5, lights: 26000, size: 0.3 });   // round six: real size, real place
    // v2.1 (Astra round two): the lit tree read as a white cone; less gain per bulb keeps dark branches between the bands
    T.group.traverse((o) => { const u = o.material && o.material.uniforms; if (u && u.uGain && o.isPoints && o.geometry.attributes.position.count > 5000) u.uGain.value *= 0.75; });
    r.treeObj = T;
    // the ornaments: this year the real tree wears only lights; ours also wears New Yorkers
    const orn = new THREE.Group(); T.group.add(orn); const cast = r.cast.length ? r.cast : [];
    for (let i = 0; i < Math.min(24, cast.length * 2); i++) { const p = cast[i % cast.length], yy = 2.4 + (i / 24) * 18 + Math.random(), th = i * 2.39996 + 1.2, rr = T.rad(yy) + 0.08;
      const o = new THREE.Group(); o.position.set(Math.cos(th) * rr, yy, Math.sin(th) * rr); o.rotation.y = Math.atan2(Math.cos(th), Math.sin(th)); orn.add(o);
      const tx = c.tex.load(`assets/art/${p.f}`, (tt) => { const a = tt.image.width / tt.image.height; if (a > 1) { tt.repeat.set(1 / a, 1); tt.offset.set((1 - 1 / a) / 2, 0); } }); tx.colorSpace = THREE.SRGBColorSpace;
      const dm = new THREE.MeshStandardMaterial({ map: tx, emissiveMap: tx, emissive: 0xffffff, emissiveIntensity: 0.18, roughness: 0.35 });
      const d = new THREE.Mesh(new THREE.CircleGeometry(0.95, 32), dm); o.add(d); const rim = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.08, 8, 40), GOLD(c)); o.add(rim);
      o.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 12), GOLD(c)).translateY(0.7));
      c.clickable(d, () => c.openPiece ? c.openPiece(p) : null, `${p.t}, an ornament`); o.userData.m = dm; }
    // the plaza dressing: barricades along the line, the switch on its podium, the countdown screen
    for (const i of [0, 1, 10, 11]) prop(c, r, g, X, 'nyb_barrier', 1.2 + i * 1.6, -6.85, { len: 1.55 });   // v4: four, not twelve
    { const brass = std(c, 0xc8a040, { metalness: 1, roughness: 0.3 }), rope = std(c, 0x6a0f14, { roughness: 0.7 }); for (let i = 0; i < 9; i++) { const x = 4.4 + i * 1.4; g.add(c.slab(0.07, 0.95, 0.07, brass, x, 0.47, -6.85)); g.add(c.slab(0.16, 0.05, 0.16, brass, x, 0.97, -6.85)); if (i < 8) { const cv = new THREE.CatmullRomCurve3([new THREE.Vector3(x, 0.9, -6.85), new THREE.Vector3(x + 0.7, 0.72, -6.85), new THREE.Vector3(x + 1.4, 0.9, -6.85)]); g.add(new THREE.Mesh(new THREE.TubeGeometry(cv, 12, 0.025, 6), rope)); } } c.wall(X(4.4), -6.85, X(15.6), -6.85); }
    const pod = new THREE.Group(); pod.position.set(15.6, 0, -5.2); g.add(pod); pod.add(c.slab(1.0, 1.1, 0.7, std(c, 0x15161c, { roughness: 0.5 }), 0, 0.55, 0)); c.post(X(15.6), -5.2, 0.6);
    const sw = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.12, 24), std(c, 0xc8102e, { roughness: 0.35, emissive: 0x400000 })); sw.position.y = 1.17; pod.add(sw);
    const plq = c.sign('"THE SWITCH"', { w: 0.9, h: 0.2, bg: '#15161c', fg: '#f5c542', font: c.MONO, weight: 700 }); plq.position.set(0, 0.85, 0.36); pod.add(plq);
    const scr = board(c, g, 4.8, 2.7, 512); scr.m.position.set(0.3, 6.4, -3.6); scr.m.rotation.y = PI / 2; g.add(c.slab(0.12, 2.9, 5.0, std(c, 0x111111), 0.2, 6.4, -3.6));
    const show = (big, small) => { const { q, W: w, H: h } = scr; q.fillStyle = '#06070c'; q.fillRect(0, 0, w, h); q.textAlign = 'center'; q.fillStyle = '#f5c542'; q.font = `900 ${h * (big.length > 3 ? 0.24 : 0.6)}px ${c.SERIF}`; q.fillText(big, w / 2, h * (big.length > 3 ? 0.52 : 0.66)); q.fillStyle = '#f4ead2'; q.font = `600 ${h * 0.075}px ${c.MONO}`; q.fillText(small, w / 2, h * 0.88); scr.up(); };
    show('THE LIGHTING', 'PRESS THE SWITCH ON THE PODIUM');
    const crowd = [];
    for (let i = 0; i < 16; i++) { const side = i % 2, x = side ? 16.2 + (i % 4) * 0.8 : 1.4 + (i % 4) * 0.8, z = -6.0 + Math.floor(i / 4) * 0.9 + Math.sin(i) * 0.2; if (side && x > 15 && z < -4.4) continue; const e = extra(c, g, x, z, { col: [0x3a3a4a, 0x6a2a2a, 0x2a3a5a, 0x4a4a2a][i % 4], ry: Math.atan2(W / 2 - x, -16 - z) + PI }); c.post(X(x), z, 0.3); crowd.push(e); }
    walkers(c, g, 8, { x1: 3, x2: 17, z1: 2.4, z2: 6.8, pool: 'night' });
    let st = LT.tree ? 'lit' : 'dark', k = 0, v = LT.tree ? 1.04 : 0;
    const go = () => {
      if (st === 'dark') { st = 'count'; k = 0; c.toast('The crowd counts with you.', 2000); sw.position.y = 1.13; }
      else if (st === 'lit') { st = 'off'; c.toast('Lights out. It goes dark every year at the end. You may light it again.', 3200); show('GOOD NIGHT', 'PRESS THE SWITCH TO LIGHT IT AGAIN'); }
    };
    c.clickable(sw, go, 'The switch'); c.clickable(pod, go, 'The switch');
    // v2.1 effect: a vertigo push as the star ignites. r.fov is the engine's dolly zoom hook (it pulls the camera back as the lens
    // widens), so the tree holds its size while the plaza rushes away behind it, then settles
    r.vert = -1; const F0 = c.MOBILE ? 72 : 66, vfov = () => F0 + Math.sin(Math.min(1, r.vert / 3.2) * PI) * 12;
    c.tick((t, dt) => { if (r.vert >= 0) { r.fov = vfov; r.vert += dt; if (r.vert > 3.2) { r.vert = -1; r.fov = null; } } });
    c.tick((t, dt, P, ri) => {
      if (st === 'count') { const n0 = Math.ceil(5 - k); k += dt; const n1 = Math.ceil(5 - k);
        if (n1 !== n0 || k === dt) { if (n1 > 0) { show(String(n1), 'EVERYBODY'); snd(c, 'beep', 660, 0.12, 0.25, 'sine'); crowd.forEach((e, j) => { if ((j + n1) % 3 === 0) c.say(e, String(n1), 900, 2.2); }); } }
        if (k >= 5) { st = 'up'; k = 0; show('LIT', 'FIFTY THOUSAND BULBS, FIVE MILES OF WIRE'); snd(c, 'whoosh', 0.9, 6); sw.position.y = 1.17; } }
      else if (st === 'up') { k += dt; v = Math.min(1.04, ease(Math.min(1, k / 7)) * 1.04); if (k > 6.6 && !r.starred) { r.starred = true; c.flash(0.35); r.vert = 0; [[0, 20, 6, 0xffd060], [16, 22, 4, 0x2962ff], [10, 27, -2, 0xffffff], [3, 24, 2, 0xff4fa3], [18, 19, 7, 0xffd060], [10, 31, -4, 0x7ad8ff]].forEach(([fx, fy, fz, fc], j) => setTimeout(() => { burst(c, g, fx, fy, (r.treeZ ?? -16.5) + fz, fc, 160); snd(c, 'thud', 0.5); }, 2200 + j * 420)); snd(c, 'applause', 6); snd(c, 'chords', 10); r.snowBoost = 2.2; setTimeout(() => { r.snowBoost = 1; }, 9000); }
        if (k >= 7.2) { st = 'lit'; r.starred = false; LT.tree = true; ltSave(); c.egg('lit', 'Construction workers pooled their money for a tree here in 1931; the first official lighting followed in 1933. You held, it happened. Upstairs, seventy floors up, it is lit now too.'); } }
      else if (st === 'off') { v = Math.max(0, v - dt * 0.7); if (v <= 0) { st = 'dark'; LT.tree = false; ltSave(); } }
      T.set(v); orn.children.forEach((o) => { if (o.userData.m) o.userData.m.emissiveIntensity = 0.18 + Math.min(1, v) * 0.4; });
      // v2: the plaza answers the tree. The countdown takes the storefronts, bulbs and lamps down nearly to dark (safety
      // light stays), then everything warms up with the spiral and ends brighter than it began
      const want = st === 'count' ? 0.12 : 0.4 + Math.min(1, v) * 0.75; r._dl = r._dl ?? want; r._dl += (want - r._dl) * Math.min(1, dt * (st === 'count' ? 1.6 : 0.9)); r.dressLevel && r.dressLevel(r._dl);
    });
    const env = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.18), std(c, 0xd8c8a0, { roughness: 0.9 })); env.rotation.x = -0.4; eggBox(c, g, X, env, 7.6, 1.0, -6.8, 'envelope', 'A pay envelope', 'In 1931 the workers on the Rockefeller Center site pooled their wages for a twenty foot tree. The original crowdfunding had colder hands.');
    const spool = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.5, 24), std(c, 0x2a5a2a, { roughness: 0.6 })); spool.rotation.z = PI / 2; eggBox(c, g, X, spool, 18.4, 0.4, -2.4, 'spool', 'A spool of wire', 'More than fifty thousand LEDs on about five miles of wire. Someone still has to find the end.', 0.5);
    const plank = c.slab(1.2, 0.08, 0.3, std(c, 0xc8a070, { roughness: 0.8 }), 0, 0, 0); eggBox(c, g, X, plank, 2.2, 0.06, 6.6, 'lumber', 'A plank of spruce', 'Since 2007 the tree has been milled into lumber for homes. Its next room has better insulation.');
    const starInfo = notice(c, g, 'THE STAR · 2018\n70 SPIKES · ABOUT 3 MILLION CRYSTALS · ABOUT 900 LB', 1.8, 2.4, -6.75, 0, 2.6, 0.5); c.clickable(starInfo, () => c.egg('star', 'The star since 2018: seventy spikes, about three million crystals, nine feet four inches across, about nine hundred pounds. It is lifted up by crane. The crane gets no credit.'), 'A plaque');
  },

  // SEVENTY FLOORS UP. A model of the plaza, the tree you lit downstairs in it, and coin binoculars that make it life size.
  top(c, r, g, X) {
    const { THREE } = c;
    g.add(c.slab(PORTAL.w, 1.1, 0.3, std(c, 0x6a6a70, { roughness: 0.8 }), W / 2, 0.55, -D / 2 + 0.1));
    const glass = new THREE.MeshStandardMaterial({ color: 0xbfd8ff, transparent: true, opacity: 0.1, roughness: 0.03, metalness: 0.9, depthWrite: false });
    for (let i = 0; i < 10; i++) g.add(c.slab(1.96, 1.5, 0.03, glass, 1 + i * 2, 1.85, -D / 2 + 0.12));
    // the model, at about 1 to 60
    const tbl = new THREE.Group(); tbl.position.set(W / 2, 0, -2.6); g.add(tbl);
    tbl.add(c.slab(4.6, 0.95, 3.0, std(c, 0x2a1e16, { roughness: 0.5 }), 0, 0.475, 0)); c.wall(X(W / 2 - 2.3), -4.1, X(W / 2 + 2.3), -4.1); c.wall(X(W / 2 - 2.3), -1.1, X(W / 2 + 2.3), -1.1); c.wall(X(W / 2 - 2.3), -4.1, X(W / 2 - 2.3), -1.1); c.wall(X(W / 2 + 2.3), -4.1, X(W / 2 + 2.3), -1.1);
    { const pv = c.surf('acg_pavingstones128', 0.06, 0x4e4a46).clone(); pv.roughness = 1; pv.metalness = 0; pv.envMapIntensity = 0.12; tbl.add(c.slab(4.4, 0.02, 2.8, pv, 0, 0.96, 0, 0.06)); }   // matte: at a tiny eye height the paving is seen at a grazing angle, where it mirrored the sky   // v4: paved at 1:40, so the tiny visitor stands on a street
    const win = c.canvasTex(64, 256, (q, w, h) => { q.fillStyle = '#c8bca8'; q.fillRect(0, 0, w, h); for (let y = 2; y < h; y += 4) for (let x = 2; x < w; x += 4) { q.fillStyle = Math.random() < 0.6 ? '#ffe2a0' : '#2a2a30'; q.fillRect(x, y, 2, 2); } });
    const twr = new THREE.MeshStandardMaterial({ map: win, emissiveMap: win, emissive: 0xffffff, emissiveIntensity: 0.6, roughness: 0.8 });
    // v2.1: the towers wear the generated upper storeys (their windows glow), stepped back like the real setbacks, under glass
    const twr2 = (window.WALLS || []).includes('upper_stone') ? facadeMat(c, 'assets/walls/upper_stone.jpg', [0.6, 2.2], [0, 0], 0.55) : twr; if (twr2.userData) { twr2.emissiveIntensity = 0.6; twr2.userData.e0 = 0.6; } twr2.map && (twr2.map.wrapS = twr2.map.wrapT = THREE.RepeatWrapping);
    [[1.4, 4.3, 0.42], [1.7, 3.6, 0.6], [2.0, 2.4, 0.8], [1.1, 4.7, 0.3]].forEach(([w, h, d]) => tbl.add(c.slab(w, h, d, twr2, -0.4, 0.96 + h / 2, -1.0)));
    [[-1.7, 1.2, 0.9, 1.6], [1.45, 1.4, 0.8, 1.9]].forEach(([x, w, d, h]) => tbl.add(c.slab(w, h, d, twr2, x, 0.96 + h / 2, -0.9)));
    // v4 (Astra: "prove the miniature scale"): a quarter on its edge and a paper coffee cup, real size, on the table;
    // at one fortieth they are a metre wide and three storeys tall
    { const q = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.0018, 32), std(c, 0xc8c8cc, { metalness: 1, roughness: 0.28 })); q.rotation.set(PI / 2, 0, 0.5); q.position.set(0.62, 0.972, 0.2); tbl.add(q);
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.034, 0.12, 28), std(c, 0xf2ece0, { roughness: 0.7 })); cup.position.set(-0.85, 1.03, -0.25); tbl.add(cup);
      const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.0462, 0.0405, 0.05, 28, 1, true), std(c, 0x7a5232, { roughness: 0.9 })); sl.position.set(-0.85, 1.03, -0.25); tbl.add(sl);
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.01, 28), std(c, 0x111111, { roughness: 0.5 })); lid.position.set(-0.85, 1.095, -0.25); tbl.add(lid);
      const lb = c.sign('N3W', { w: 0.05, h: 0.02, bg: '#0d1b4a', fg: '#f2ebdd', font: c.SERIF, weight: 900 }); lb.position.set(-0.85, 1.03, -0.205); tbl.add(lb); }
    const vit = new THREE.Mesh(new THREE.BoxGeometry(4.5, 5.1, 2.9), new THREE.MeshStandardMaterial({ color: 0xdfeaff, roughness: 0.04, metalness: 0.6, transparent: true, opacity: 0.1, depthWrite: false }));   // plain glass: a transmission box hid the towers
    vit.position.set(0, 0.9 + 2.55, 0); tbl.add(vit);   // its bottom face sat on the table and glared white from a tiny visitor's eye
    const here_ = c.sign('YOU ARE HERE  v', { w: 1.2, h: 0.24, bg: '#2962ff', fg: '#ffffff', font: c.MONO, weight: 800 }); here_.position.set(-0.4, 0.96 + 4.3 + 0.3, -0.75); tbl.add(here_);
    tbl.add(c.slab(0.9, 0.012, 0.5, std(c, 0xeef4ff, { roughness: 0.1, metalness: 0.3 }), 0.2, 0.97, 0.75));
    tbl.add(c.slab(0.12, 0.08, 0.06, GOLD(c), 0.2, 1.01, 0.48));
    const mini = buildTree(c, tbl, { H: 0.42, R: 0.11, x: 0.2, y: 0.96, z: 0.12, lights: 1600, size: 0.012, cards: 0.6 });
    const tiny = []; for (let i = 0; i < 60; i++) { const a = Math.random() * 6.28, rr = 0.35 + Math.random() * 0.5; tiny.push([0.2 + Math.cos(a) * rr * 1.6, 0.975, 0.3 + Math.sin(a) * rr * 0.6, 1, [1, 0.6, 0.8]]); }
    ledPoints(c, tbl, tiny, { size: 0.01, gain: 0.8 }).material.uniforms.uOn.value = 1.1;
    let mv = 0; LT.fans.push(() => {});
    r.replay = -1;   // v3 (Astra's "the snow globe remembers the city"): a shake replays the model tree's spiral, then it returns to the real tree's state
    c.tick((t, dt) => { if (r.replay >= 0) { r.replay += dt; mv = r.replay < 1 ? Math.max(0, 1 - r.replay) * mv : Math.min(1.04, (r.replay - 1) / 4 * 1.04); if (r.replay > 6) r.replay = -1; } else mv += ((LT.tree ? 1.04 : 0) - mv) * Math.min(1, dt * 1.5); mini.set(mv); });
    const lbl = notice(c, g, 'THE PLAZA · 1 TO 60\nTHE TREE IS LIT WHEN YOU LIT IT', W / 2, 1.2, -1.08, 0, 2.2, 0.36); c.clickable(lbl, () => c.egg('model', 'A model of the plaza seventy floors below. The tree in it follows the real one downstairs: switch it on there and it is on here.'), 'The model');
    // the coin binoculars
    const vw = new THREE.Group(); vw.position.set(W / 2 + 0.2, 0, 0.4); g.add(vw); c.post(X(W / 2 + 0.2), 0.4, 0.35);
    vw.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 1.15, 16), std(c, 0x2c5a3a, { metalness: 0.6, roughness: 0.4 })).translateY(0.58));
    const hd = new THREE.Group(); hd.position.y = 1.32; hd.rotation.x = -0.35; vw.add(hd);
    hd.add(c.slab(0.5, 0.32, 0.42, std(c, 0x2c5a3a, { metalness: 0.6, roughness: 0.35 }), 0, 0, 0));
    for (const sx of [-0.11, 0.11]) { const e = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.16, 16), std(c, 0x111111)); e.rotation.x = PI / 2; e.position.set(sx, 0.02, 0.26); hd.add(e); const lz = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 16), std(c, 0x111111)); lz.rotation.x = PI / 2; lz.position.set(sx, 0.02, -0.24); hd.add(lz); }
    const coin = c.sign('25¢', { w: 0.16, h: 0.1, bg: '#c8a040', fg: '#111', font: c.MONO }); coin.position.set(0.18, 0.05, 0.215); hd.add(coin);
    const look = () => { const P = c.P; P.x = X(W / 2 + 0.2); P.z = 1.05; const dx = X(W / 2 + 0.2) - P.x, tz = -2.48 - P.z, ty = 0.96 + 0.24 - (1.62);
      P.yaw = Math.atan2(-(X(W / 2 + 0.2) - P.x), -tz); P.pitch = Math.atan2(ty, Math.hypot(dx, tz)); c.zoom(true);
      if (LT.tree) c.egg('viewer', 'The tree you lit downstairs, life size through a quarter. Same tree. Different rent.'); else c.toast('It is dark down there. Somebody downstairs has not pressed the switch. That somebody is you.', 3600); };
    c.clickable(hd, look, 'Coin binoculars'); c.clickable(vw, look, 'Coin binoculars');
    const tk = c.slab(0.24, 0.01, 0.12, std(c, 0xf4ead2), 0, 0, 0); eggBox(c, g, X, tk, 3.0, 1.12, -D / 2 + 0.2, 'ticket', 'A ticket', 'Dated 1933, the year the deck first opened. The view has acquired neighbours.');
    const tabs = notice(c, g, '67 · 69 · 70', 18.0, 1.6, -D / 2 + 0.3, 0, 1.2, 0.3, '#111', '#f5c542'); c.clickable(tabs, () => c.egg('floors', 'Three observation levels, on the 67th, 69th and 70th floors, about 850 feet up. Apparently one upstairs was insufficient.'), 'Floor tabs');
    const cal = notice(c, g, 'CLOSED 1986\nREOPENED 2005', 1.9, 1.7, 3.2, PI / 2, 1.0, 0.5); c.clickable(cal, () => c.egg('reopened', 'The deck closed in 1986 and reopened in 2005. A substantial coffee break.'), 'A calendar');
    walkers(c, g, 5, { x1: 2.5, x2: 17.5, z1: 2.4, z2: 6.6, pool: 'dressy' });
  },

  // FIFTH AND FIFTY NINTH. Pick tonight, step into the bucket, ride up, light the shamash, then the lamps, newest first.
  menorah(c, r, g, X) {
    const { THREE } = c, gold = GOLD(c);
    const M = menorahFifth(c, g, W / 2, -7.7, gold);
    const show = () => { const n = LT.night, done = LT.lit[n]; M.sham.set(!!done); M.lamps.forEach((l, i) => l.set(!!done && i >= 8 - n)); };
    show(); LT.fans.push(() => { if (!r.up) show(); });
    nightPicker(c, g, X, 4.0, 1.6, -5.6, 0.25, () => { if (!r.up) show(); });
    // the lift: a utility bucket on a boom; it carries you along the lamps
    const base = new THREE.Group(); base.position.set(W / 2, 0, -5.8); g.add(base);
    base.add(c.slab(1.6, 0.7, 1.2, std(c, 0x2a2c30, { roughness: 0.5, metalness: 0.4 }), 0, 0.35, 0)); { const tur = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.3, 24), std(c, 0xe8e2d0, { roughness: 0.4 })); tur.position.y = 0.85; base.add(tur); } base.add(c.slab(1.62, 0.06, 1.22, std(c, 0xff6b00), 0, 0.7, 0));
    const boom = c.slab(0.3, 1, 0.3, std(c, 0xf2f2f0, { roughness: 0.4 }), 0, 0, 0); base.add(boom);
    // v4 (Astra round four: "unfinished primitives"): a fibreglass utility bucket, rounded, with a rim, a rail and a door
    const bucket = new THREE.Group(); base.add(bucket); const fib = std(c, 0xe8e2d0, { roughness: 0.35, metalness: 0.05 }), blk = std(c, 0x1a1a1a, { roughness: 0.6 });
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.44, 1.05, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0xe8e2d0, roughness: 0.35, side: THREE.DoubleSide })); shell.position.y = -0.52; bucket.add(shell);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(0.44, 28), blk); floor.rotation.x = -PI / 2; floor.position.y = -1.04; bucket.add(floor);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.035, 8, 32), blk); rim.rotation.x = PI / 2; bucket.add(rim);
    const rail = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.018, 6, 32), std(c, 0xc8c8c8, { metalness: 0.9, roughness: 0.3 })); rail.rotation.x = PI / 2; rail.position.y = 0.32; bucket.add(rail);
    for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2; bucket.add(c.slab(0.025, 0.32, 0.025, std(c, 0xc8c8c8, { metalness: 0.9 }), Math.cos(a) * 0.5, 0.16, Math.sin(a) * 0.5)); }
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.525, 0.505, 0.1, 28, 1, true), std(c, 0xff6b00, { roughness: 0.5 })); stripe.position.y = -0.25; bucket.add(stripe);
    const lbl = c.sign('N3W YORKERS · LIGHTING CREW', { w: 0.7, h: 0.11, bg: '#0d1b4a', fg: '#f2ebdd', font: c.MONO, weight: 800 }); lbl.position.set(0, -0.55, 0.53); bucket.add(lbl);
    c.post(X(W / 2), -5.8, 0.9);
    let UPY = M.LY - 0.75;   // bucket floor, so the lamps are at chest height (follows the model's lamps once it loads)
    c.tick(() => { UPY = M.LY - 0.75; });
    const B = { y: 1.8, x: W / 2 }; const layout = () => { bucket.position.set(B.x - W / 2, B.y, 0.4); const hh = Math.max(0.2, B.y - 1.8); boom.scale.y = Math.max(0.05, hh + 0.1); boom.position.set((B.x - W / 2) / 2, 0.8 + hh / 2, 0.2); boom.rotation.z = -Math.atan2(B.x - W / 2, Math.max(0.3, hh)); boom.scale.y = Math.max(0.05, Math.hypot(B.x - W / 2, hh)); }; layout();
    let order = [], step = 0, n = LT.night;
    const up = () => {
      if (r.up) return; n = LT.night; r.up = true; order = ['s', ...lightOrder(n)]; step = 0; M.sham.set(false); M.lamps.forEach((l) => l.set(false));
      const P = c.P, cur = new THREE.CatmullRomCurve3([new THREE.Vector3(P.x, c.EYE, P.z), new THREE.Vector3(X(W / 2), c.EYE + 1.2, -5.4), new THREE.Vector3(X(W / 2), UPY + c.EYE, -5.4)]);
      c.toast(`Night ${n}. Up you go. The shamash first, the one in the middle, on top.`, 3600);
      c.ride(cur, 4, () => { r.holdLift = true; c.P.lift = UPY; c.P.speed = 0; B.target = W / 2; });
    };
    const down = (why) => { if (!r.up) return; r.holdLift = false; c.P.speed = 1; const P = c.P;
      const cur = new THREE.CatmullRomCurve3([new THREE.Vector3(P.x, P.y, P.z), new THREE.Vector3(X(W / 2), c.EYE + 2, -4.4), new THREE.Vector3(X(W / 2), c.EYE, -3.4)]);
      c.ride(cur, 3.4, () => { r.up = false; show(); }); if (why) c.toast(why, 3600); };
    c.clickable(bucket, () => (r.up ? down('Down you come.') : up()), 'Ride the bucket'); c.clickable(base, () => (r.up ? null : up()), 'Ride the bucket');
    const touch = (i) => {
      if (!r.up) { if (i === 's') c.egg('shamash', 'The shamash, the helper: it serves the other eight lights and sits apart. Management, but useful.'); else c.toast('Too high to reach from here. The bucket is behind you.', 2400); return; }
      const want = order[step];
      if (i === want) { (i === 's' ? M.sham : M.lamps[i]).set(true); snd(c, 'clink', 2200); B.target = i === 's' ? W / 2 : W / 2 + M.lamps[i].o.position.x; step++;
        if (step === order.length) { LT.lit[n] = true; LT.night = n; ltSave(); c.flash(0.2); snd(c, 'chords', 6); c.music.level && c.music.level(1.35); setTimeout(() => c.music.level && c.music.level(1), 8000);
          c.egg('menorah', `Night ${n}, lit from the bucket: shamash first, then newest first. Thirty two feet, about four thousand pounds, oil under glass chimneys against the Fifth Avenue wind. Lit here since 1977.`); setTimeout(() => down(), 3800); }
        else if (step === 1) c.toast(`Now the lamps, newest first: start with the leftmost of tonight's ${n}.`, 3000); }
      else if (i !== 's' && i < 8 - n) c.toast('Not tonight. That one is for later in the week.', 2200);
      else c.toast(step === 0 ? 'The shamash first. It lights the others.' : 'Newest first: the leftmost of tonight’s lamps that is still dark.', 2600);
    };
    c.clickable(M.sham.hit, () => touch('s'), 'The shamash'); M.lamps.forEach((l, i) => c.clickable(l.hit, () => touch(i), `Lamp ${i + 1}`));
    c.tick((t, dt, P, ri) => {
      if (r.up && !P.ride) { P.lift = UPY; P.speed = 0; if (B.target != null) { const tx = X(B.target); P.x += (tx - P.x) * Math.min(1, dt * 1.6); } P.z += (-5.4 - P.z) * Math.min(1, dt * 2); B.x = P.x - r.x0; B.y = P.y - c.EYE * P.scale + 1.0; }
      else if (P.ride && here(r, ri)) { B.x = P.x - r.x0; B.y = Math.max(1.8, P.y - c.EYE + 1.0); }
      else { B.x += (W / 2 - B.x) * Math.min(1, dt * 2); B.y += (1.8 - B.y) * Math.min(1, dt * 2); }
      if (r.up && !here(r, ri)) { r.up = false; r.holdLift = false; P.speed = 1; P.lift = 0; }
      layout();
    });
    // the truck, its crew, and the eggs
    const truck = c.glb('lt_truck', { len: 7.4, x: 17.0, z: -3.2, ry: 0, parent: g }); c.post(X(17.0), -4.6, 1.6); c.post(X(17.0), -1.8, 1.6);
    c.clickable(truck, () => c.egg('truck', 'The lamps are lit each night from a utility bucket. On Friday the lighting comes before sunset; on Saturday it waits until Shabbat is out.'), 'The utility truck');
    cast(c, r, g, X, 'lt_lineman', 14.6, -5.0, { h: 1.8, ry: -0.6, r: 0.4, line: 'Lamps, not candles. The glass is for the wind off the park. Shamash first, then newest first. I will be down here holding the clipboard.', egg: 'lineman', hint: 'The lineman' });
    const chim = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.46, 18, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, roughness: 0.04, side: THREE.DoubleSide }));
    g.add(c.slab(0.6, 0.5, 0.5, std(c, 0x6a4a2a, { roughness: 0.8 }), 6.0, 0.25, -5.2)); eggBox(c, g, X, chim, 6.0, 0.73, -5.2, 'chimney', 'A spare chimney', 'Glass shields the flame from wind. Fifth Avenue still gets a vote.', 0.4);
    const card = notice(c, g, '25 KISLEV', 1.6, 1.8, 3.2, PI / 2, 0.9, 0.3); c.clickable(card, () => c.egg('kislev', 'Chanukah begins on the 25th of Kislev; the Gregorian date moves. This year the first light is the evening of December 4th. December does not own the booking.'), 'A calendar card');
    walkers(c, g, 8, { x1: 2.4, x2: 13.6, z1: 1.8, z2: 6.8, pool: 'walkers' });
  },

  // THE OTHER LARGEST. Brooklyn lit the same night you did. Measure either menorah and they always tie. Spin the dreidel.
  brooklyn(c, r, g, X) {
    const { THREE } = c, gold = std(c, 0xcaa23a, { metalness: 1, roughness: 0.3 });
    const M = menorahBrooklyn(c, g, W / 2, -7.6, gold);
    const show = () => { const n = LT.night; M.sham.set(true); M.lamps.forEach((l, i) => l.set(i >= 8 - n)); }; show(); LT.fans.push(show);
    nightPicker(c, g, X, 15.8, 1.6, -5.6, -0.25, show);
    // the tape
    const tapeH = new THREE.Group(); tapeH.position.set(4.4, 0, -5.4); g.add(tapeH); c.post(X(4.4), -5.4, 0.5);
    tapeH.add(c.slab(0.8, 0.8, 0.36, std(c, 0xf5c518, { roughness: 0.4 }), 0, 0.4, 0)); tapeH.add(c.slab(0.5, 0.5, 0.38, std(c, 0x111111), 0, 0.42, 0));
    const ticks = c.canvasTex(64, 2048, (q, w, h) => { q.fillStyle = '#f5d000'; q.fillRect(0, 0, w, h); q.fillStyle = '#111'; for (let i = 0; i <= 40; i++) { const y = h - i / 40 * h; q.fillRect(0, y - 2, i % 4 ? 18 : 40, 4); if (i % 4 === 0) { q.font = '700 22px monospace'; q.fillText(String(i), 34, y - 6); } } });
    const blade = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 1), new THREE.MeshStandardMaterial({ map: ticks, roughness: 0.4, metalness: 0.3, side: THREE.DoubleSide })); blade.geometry.translate(0, 0.5, 0); blade.position.set(0, 0.8, 0.2); tapeH.add(blade);
    const read = board(c, g, 3.4, 0.9, 256); read.m.position.set(4.4, 3.2, -5.2); read.m.visible = false;
    const say = (a, b, red) => { const { q, W: w, H: h } = read; q.fillStyle = '#0d0d0d'; q.fillRect(0, 0, w, h); q.textAlign = 'center'; q.fillStyle = red ? '#ff4040' : '#f5d000'; q.font = `900 ${h * 0.38}px ${c.SERIF}`; q.fillText(a, w / 2, h * 0.48); q.fillStyle = '#f4ead2'; q.font = `600 ${h * 0.14}px ${c.MONO}`; q.fillText(b, w / 2, h * 0.82); read.up(); read.m.visible = true; };
    let tape = { v: 0, to: 0, k: 0 };
    c.clickable(tapeH, () => { snd(c, 'tick'); tape.k = (tape.k % 3) + 1;
      if (tape.k === 1) { tape.to = M.LY + 1.4; tapeH.rotation.y = 0; setTimeout(() => { say('32 FT', 'BROOKLYN. COMMONLY REPORTED. ABOUT 5,000 LB, LESS SURELY.'); c.egg('tape', 'Brooklyn’s menorah has stood here since 1985 and is commonly reported at thirty two feet. Measure it and that is what you get.'); }, 1500); }
      else if (tape.k === 2) { tape.to = M.LY + 1.4; setTimeout(() => { say('TIE', 'MANHATTAN 32 FT · BROOKLYN 32 FT · MEASUREMENT DISPUTED', true); c.egg('tie', 'Both have claimed the title of world’s largest menorah. Two boroughs, one number, several opinions. The tape is staying out of it.'); }, 600); }
      else { tape.to = 24.4; setTimeout(() => { say('80 FT', 'THE ARCH. NOT A MENORAH. FOR THE UNION DEAD, 1892'); c.egg('arch', 'The arch behind it honours the Union soldiers and sailors of the Civil War, dedicated 1892, about eighty feet. It was not built as a menorah canopy, though it does frame one nicely.'); }, 2600); } }, 'A giant tape measure');
    // the dreidel: nun, gimel, hei, shin
    const LET = ['נ', 'ג', 'ה', 'ש'], SAY = ['Nun. Nothing happens. A very New York result.', 'Gimel. You take the whole pot.', 'Hei. You take half. Round down, this is Brooklyn.', 'Shin. Put one in.'];
    const dr = new THREE.Group(); dr.position.set(15.8, 0, 3.4); g.add(dr); c.post(X(15.8), 3.4, 0.7); const body = new THREE.Group(); dr.add(body);
    const faces = LET.map((L) => new THREE.MeshStandardMaterial({ map: c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = '#1d4ed8'; q.fillRect(0, 0, w, h); q.strokeStyle = '#f5c542'; q.lineWidth = 14; q.strokeRect(10, 10, w - 20, h - 20); q.fillStyle = '#f5c542'; q.font = `900 ${h * 0.62}px serif`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(L, w / 2, h / 2 + 8); }), roughness: 0.4 }));
    const blue = std(c, 0x1d4ed8, { roughness: 0.4 });
    body.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), [faces[0], faces[2], blue, blue, faces[1], faces[3]]).translateY(1.15));
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.64, 0.7, 4), blue); tip.rotation.y = PI / 4; tip.rotation.x = PI; tip.position.y = 0.35; body.add(tip);
    body.add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 12), std(c, 0xf5c542, { metalness: 0.8, roughness: 0.3 })).translateY(1.85));
    let spin = 0, ang = 0, landed = -1, spins = 0;
    c.clickable(body, () => { if (spin > 0.5) return; spin = 22 + Math.random() * 10; landed = -1; snd(c, 'whoosh', 0.3, 1.2); }, 'Spin the dreidel');
    c.tick((t, dt) => { if (spin > 0.01) { ang += spin * dt; spin *= Math.pow(0.55, dt); body.rotation.y = ang; body.rotation.z = Math.sin(ang * 0.5) * Math.min(0.3, 0.6 / (spin + 1));
        if (spin < 0.6) { spin = 0; const k = Math.round(ang / (PI / 2)); body.rotation.y = k * PI / 2; body.rotation.z = 0; const order = [0, 1, 3, 2], face = order[((-k % 4) + 4) % 4]; landed = face; spins++;
          c.toast(SAY[face], 3000); c.egg('dreidel', 'Nun, gimel, hei, shin: a great miracle happened there. Nothing, everything, half, put one in. A compact financial district.'); if (spins === 4) c.egg('spins', 'Four spins. In the old game you would be either up a pile of gelt or explaining to a cousin why you are not.'); } } });
    const small = new THREE.Group(); small.add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), std(c, 0xf4f4f4, { roughness: 0.4 })).translateY(0.2)); const st2 = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.12, 4), std(c, 0xf4f4f4)); st2.rotation.x = PI; st2.position.y = 0.06; small.add(st2);
    eggBox(c, g, X, small, 16.6, 1.0, -1.0, 'pe', 'A small white dreidel', 'In Israel the fourth letter is pe, not shin: a great miracle happened here. Location remains everything.');
    const arch = c.slab(0.5, 0.5, 0.2, std(c, 0xa89880, { roughness: 0.8 }), 0, 0, 0); eggBox(c, g, X, arch, 2.0, 1.25, 3.0, 'archmodel', 'A model of the arch', 'The Soldiers’ and Sailors’ Arch at Grand Army Plaza, finished 1892. It frames the menorah. It was not consulted.');
    g.add(c.slab(0.7, 1.0, 0.5, std(c, 0x3a3a40), 2.0, 0.5, 3.0)); c.post(X(2.0), 3.0, 0.4);
    let tv = 0; c.tick((t, dt) => { tv += (tape.to - tv) * Math.min(1, dt * 1.6); blade.scale.y = Math.max(0.01, tv - 0.8); blade.visible = tv > 0.85; tapeH.rotation.y = tape.k === 3 ? -0.0 : 0; blade.rotation.x = tape.k === 3 ? -0.5 : 0; });
    walkers(c, g, 9, { x1: 2.4, x2: 17.6, z1: 2.4, z2: 6.8, pool: 'walkers' });
  },

  // THE ANSWERING WINDOWS. Light your menorah in the window; the windows across the street answer, one by one, in their own time.
  window(c, r, g, X) {
    const { THREE } = c, CH = r.ceilH, WY = 2.9;
    const wallM = c.surf('plaster', 2.4, 0xe6dcc8), trim = std(c, 0xf4f2ec, { roughness: 0.5 });
    const pw = PORTAL.w, x1 = (W - pw) / 2;
    g.add(c.slab(pw, 0.85, 0.24, wallM, W / 2, 0.425, -D / 2 - 0.12));
    for (const [a, b] of [[x1, x1 + 0.2], [7.2, 8.4], [11.6, 12.8], [W - x1 - 0.2, W - x1]]) g.add(c.slab(b - a, WY - 0.85, 0.24, wallM, (a + b) / 2, 0.85 + (WY - 0.85) / 2, -D / 2 - 0.12));
    const glassM = new THREE.MeshStandardMaterial({ color: 0xaac4e0, transparent: true, opacity: 0.08, roughness: 0.02, metalness: 0.9, depthWrite: false });
    for (const [a, b] of [[x1 + 0.2, 7.2], [8.4, 11.6], [12.8, W - x1 - 0.2]]) { const cx = (a + b) / 2, w = b - a;
      g.add(c.slab(w, 0.08, 0.1, trim, cx, 1.9, -D / 2 + 0.02)); g.add(c.slab(0.07, WY - 0.85, 0.08, trim, cx, 0.85 + (WY - 0.85) / 2, -D / 2 + 0.02));
      g.add(c.slab(w, 0.1, 0.12, trim, cx, WY - 0.05, -D / 2 + 0.02)); g.add(c.slab(w, WY - 0.85, 0.02, glassM, cx, 0.85 + (WY - 0.85) / 2, -D / 2 - 0.05));
      // a radiator under each window, painted over too many times
      const rad = new THREE.Group(); rad.position.set(cx, 0, -D / 2 + 0.35); g.add(rad); for (let i = 0; i < 14; i++) rad.add(c.slab(0.07, 0.62, 0.18, std(c, 0xd8d0c0, { metalness: 0.4, roughness: 0.5 }), -0.65 + i * 0.1, 0.36, 0)); }
    g.add(c.slab(pw, 0.05, 0.36, trim, W / 2, 0.88, -D / 2 + 0.06));
    // the street, one floor down, and the building across it
    const st = new THREE.Group(); g.add(st); const SY = -4.5, FZ = -23;
    st.add(c.slab(44, 0.1, 15, c.surf('asphalt', 3, 0x3a3c44), W / 2, SY - 0.05, -15.5)); st.add(c.slab(44, 0.2, 2.2, c.surf('pavers', 2, 0x6a6870), W / 2, SY + 0.1, FZ + 1.1)); st.add(c.slab(44, 0.2, 2.2, c.surf('pavers', 2, 0x6a6870), W / 2, SY + 0.1, -9.1));
    // v2: the building across the street is the Krea plate (work/v2/plate_window.jpg), flat, as a facade 15 m off is; the
    // fourteen windows that answer are measured off that photograph (u, v of its 1600 x 903 proof, work/v2_marks.jpg)
    const FW = 40, FH = FW * 1536 / 2720, FY = SY - 0.6 + FH / 2, fx0 = W / 2 - FW / 2, ftop = FY + FH / 2;
    const ptx = c.tex.load('assets/walls/window_street.jpg'); ptx.colorSpace = THREE.SRGBColorSpace; ptx.anisotropy = 8;
    const facM = new THREE.MeshBasicMaterial({ map: ptx, fog: false }); facM.color.setScalar(0.9);
    st.add(new THREE.Mesh(new THREE.PlaneGeometry(FW, FH), facM).translateX(W / 2).translateY(FY).translateZ(FZ));
    const SPOTS = [[520, 145], [690, 145], [920, 145], [1115, 145], [1250, 145], [690, 333], [920, 333], [1370, 320], [520, 503], [690, 503], [920, 503], [1115, 503], [1250, 503], [388, 715]];
    const wins = r.wins = SPOTS.map(([u, v]) => ({ x: fx0 + u / 1600 * FW, y: ftop - v / 903 * FH, men: true, base: 0, at: -1, glow: 0 }));
    // a lit room seen from outside: warm, darker at the sill, curtains drawn to the sides, a lamp somewhere
    const RT = c.canvasTex(64, 128, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffd394'); gr.addColorStop(0.7, '#e08a3c'); gr.addColorStop(1, '#7a3a14'); q.fillStyle = gr; q.fillRect(0, 0, w, h);
      q.fillStyle = 'rgba(70,28,10,.6)'; q.fillRect(0, 0, w * 0.2, h); q.fillRect(w * 0.8, 0, w * 0.2, h); q.fillStyle = 'rgba(255,244,214,.45)'; q.beginPath(); q.arc(w * 0.62, h * 0.38, w * 0.16, 0, 7); q.fill(); });
    const glowIm = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.45, 2.4), new THREE.MeshBasicMaterial({ map: RT, toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), wins.length); glowIm.position.z = FZ + 0.03; st.add(glowIm);
    const m4 = new THREE.Matrix4(), col = new THREE.Color();
    const flames = []; wins.forEach((w, k) => { for (let s = 0; s < 9; s++) flames.push([w.x - 0.5 + s * 0.125, w.y - 0.98 + (s === 4 ? 0.12 : 0), FZ + 0.06, s === 4 ? -1 : (s < 4 ? s : s - 1), k]); });
    const fl = ledPoints(c, st, flames.map((f) => [f[0], f[1], f[2], 2, [1, 0.62, 0.22]]), { size: 0.09, gain: 2.8 }); const fo = fl.geometry.attributes.ord;
    fl.material.uniforms.uOn.value = 1.0;
    // someone comes to the window when theirs is lit: an eye flower silhouette against the warm room
    const SIL = c.canvasTex(64, 128, (q, w, h) => { q.fillStyle = 'rgba(0,0,0,.78)'; q.beginPath(); q.ellipse(w / 2, h * 0.92, w * 0.34, h * 0.32, 0, 0, 7); q.fill(); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; q.beginPath(); q.ellipse(w / 2 + Math.cos(a) * w * 0.2, h * 0.42 + Math.sin(a) * w * 0.2, w * 0.13, w * 0.09, a, 0, 7); q.fill(); } q.beginPath(); q.arc(w / 2, h * 0.42, w * 0.16, 0, 7); q.fill(); q.fillStyle = 'rgba(41,98,255,.9)'; q.beginPath(); q.arc(w / 2, h * 0.42, w * 0.07, 0, 7); q.fill(); });
    const sils = wins.map((w, k) => { const sp = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.8), new THREE.MeshBasicMaterial({ map: SIL, transparent: true, depthWrite: false, fog: false, opacity: 0 })); sp.position.set(w.x + (k % 2 ? 0.25 : -0.25), w.y - 0.25, FZ + 0.045); st.add(sp); w.sil = sp; w.silAt = 2 + Math.random() * 5; return sp; });
    // v3 (Astra's "fourteen households, one passing light"): each answer arrives along a thin cobalt thread drawn across the
    // brick from the window that answered before it; when all fourteen have answered, an Open Eye Flower blooms over the building
    const threads = []; let lastW = null, bloom = -1;
    const thread = (w) => { const a = lastW || { x: w.x, y: SY + 1.2 }, N = 28, pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) { const u = i / (N - 1); pos.set([a.x + (w.x - a.x) * u + Math.sin(u * PI * 3) * 0.35, a.y + (w.y - a.y) * u + Math.sin(u * PI) * 1.2, FZ + 0.07], i * 3); }
      const gq = new THREE.BufferGeometry(); gq.setAttribute('position', new THREE.BufferAttribute(pos, 3)); gq.setDrawRange(0, 0);
      const ln = new THREE.Line(gq, new THREE.LineBasicMaterial({ color: 0x4a7dff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); st.add(ln); threads.push({ ln, t: 0, N }); lastW = w; };
    const bigF = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({ map: c.canvasTex(512, 512, (q, w, h) => { q.clearRect(0, 0, w, h); eyeFlower(q, w / 2, h / 2, w / 2 * 0.95); }), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false }));
    bigF.position.set(W / 2, ftop - FH * 0.42, FZ + 0.08); st.add(bigF);
    c.tick((t, dt) => { for (let i = threads.length - 1; i >= 0; i--) { const q = threads[i]; q.t += dt; q.ln.geometry.setDrawRange(0, Math.min(q.N, Math.floor(q.t / 0.8 * q.N)));
        q.ln.material.opacity = 0.95 * Math.max(0, Math.min(1, (3.6 - q.t) / 1.5)); if (q.t > 3.6) { st.remove(q.ln); q.ln.geometry.dispose(); threads.splice(i, 1); } }
      if (bloom >= 0) { bloom += dt; bigF.material.opacity = 0.28 * Math.sin(Math.min(1, bloom / 4.5) * PI); bigF.rotation.z = bloom * 0.05; if (bloom > 4.5) { bloom = -1; bigF.material.opacity = 0; } } });
    const paint = () => { wins.forEach((w, k) => { m4.makeTranslation(w.x, w.y, 0); glowIm.setMatrixAt(k, m4); const v = Math.max(w.base, w.glow); glowIm.setColorAt(k, col.setRGB(v, v, v)); }); glowIm.instanceMatrix.needsUpdate = true; glowIm.instanceColor.needsUpdate = true; };
    paint();
    // the flames across the street: ord 2 is dark; a window's slots come on as it answers (0 lit)
    const answer = (n) => { flames.forEach((f, i) => fo.setX(i, 2)); fo.needsUpdate = true; wins.forEach((w) => { if (w.men) { w.at = 0.8 + Math.random() * 8 + Math.random() * Math.random() * 6; w.on = false; lastW = null; w.glow = 0; if (w.sil) { w.sil.material.opacity = 0; w.silAt = 2 + Math.random() * 5; } w.n = n; w.lit = 0; } }); r.answering = 0; };
    snowfall(c, r, g, c.MOBILE ? 250 : 600, { x1: -6, x2: 26, y1: SY, y2: 16, z1: FZ + 0.5, z2: -8.6 });
    // your menorah on the sill, silver, candles in blue and white
    const MZ = -D / 2 + 0.12, MX = W / 2, MY = 0.905, silver = std(c, 0xd0d4dc, { metalness: 1, roughness: 0.18 });
    g.add(c.slab(1.3, 0.04, 0.16, silver, MX, MY + 0.02, MZ)); g.add(c.slab(0.05, 0.22, 0.05, silver, MX, MY + 0.13, MZ));
    const cand = []; for (let i = 0; i < 9; i++) { const lx = MX - 0.56 + i * 0.14, top = i === 4 ? MY + 0.3 : MY + 0.06, o = new THREE.Group(); o.position.set(lx, top, MZ); g.add(o);
      o.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.04, 12), silver).translateY(0.02));
      const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.13, 8), std(c, i === 4 ? 0xf4ead2 : (i % 2 ? 0x2a5ad8 : 0xf4f6ff), { roughness: 0.7 })); wax.position.y = 0.105; o.add(wax);
      const f = flameSprite(c, o, 0, 0.2, 0, 0.06); const hit = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.32, 0.25), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 0.12; o.add(hit);
      cand.push({ o, wax, f, hit, i: i === 4 ? 's' : (i < 4 ? i : i - 1) }); }
    const glowIn = new THREE.PointLight(0xffa040, 0, 3.5, 1.6); glowIn.position.set(MX, MY + 0.35, MZ + 0.3); g.add(glowIn);
    let order = [], step = 0, nn = LT.night;
    const set = () => { nn = LT.night; order = ['s', ...lightOrder(nn)]; step = 0; cand.forEach((k) => { k.f.visible = false; k.wax.visible = k.i === 's' || k.i >= 8 - nn; }); glowIn.intensity = 0; };
    set(); LT.fans.push(() => { if (step === 0 || step >= order.length) set(); });
    nightPicker(c, g, X, 15.2, 1.4, -6.4, -0.2, set);
    cand.forEach((k) => c.clickable(k.hit, () => {
      if (step >= order.length) { c.toast('Lit. Now watch the street.', 2000); return; }
      if (k.i === order[step]) { k.f.visible = true; snd(c, 'clink', 2600); step++; glowIn.intensity = 0.25 + step * 0.12; if (step === order.length) { c.toast('Watch the windows across the street.', 3000); answer(nn); } }
      else if (k.i !== 's' && k.i < 8 - nn) c.toast('No candle there tonight.', 1800);
      else c.toast(step === 0 ? 'The shamash first, the tall one in the middle.' : 'Newest first: the leftmost unlit candle.', 2400);
    }, 'A candle'));
    let ans = 0;
    c.tick((t, dt, P, ri) => {
      if (r.plateMesh && r.plateMesh.scale.x > 0.001) r.plateMesh.scale.setScalar(0.0001);   // v2: the street is our own plane now; the depth plate behind it only smeared (the room manager owns .visible, so collapse it)
      if (!here(r, ri) && Math.abs(ri - r.i) > 1) return; let dirty = false;
      wins.forEach((w, k) => { if (!w.on) { if (w.at < 0) return; w.at -= dt; if (w.at > 0) return; w.on = true; thread(w); }   // the countdown used to run past zero into 'not answering' after one frame
        w.glow = Math.min(1.25, w.glow + dt * 0.5 * (0.6 + Math.random())); dirty = true; if (w.sil) { w.silAt -= dt; if (w.silAt < 0) w.sil.material.opacity = Math.min(1, w.sil.material.opacity + dt * 0.4); } if (w.lit < w.n + 1) { w.tick = (w.tick || 0) - dt; if (w.tick <= 0) { w.tick = 0.35 + Math.random() * 0.6; w.lit++; let s0 = 0; flames.forEach((f, i) => { if (f[4] !== k) return; const slot = f[3]; const on = slot === -1 ? w.lit >= 1 : slot >= 8 - w.n && (slot - (8 - w.n)) < w.lit - 1; fo.setX(i, on ? 0 : 2); s0++; }); fo.needsUpdate = true; if (w.lit === w.n + 1) { ans++; if (ans === 14) bloom = 0; if (ans === 14) c.egg('answer', 'Fourteen windows answered, each in its own time. A street facing window publicises the miracle: that is the whole point of putting it there. Someone across the street noticed.'); } } } else w.at = -1; });
      if (dirty) paint();
    });
    // the kitchen and the table
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.05, 20), std(c, 0x222222, { metalness: 0.6, roughness: 0.4 })); pan.position.set(1.2, 0.98, -6.8); g.add(pan);
    for (let i = 0; i < 5; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.015, 12), std(c, 0xc88a3a, { roughness: 0.8 })); l.position.set(1.12 + (i % 3) * 0.08, 1.01, -6.86 + Math.floor(i / 3) * 0.1); g.add(l); }
    steam(c, g, 1.2, 1.0, -6.8, 0.3);
    const grater = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.24, 4, 1, true), std(c, 0xb8bcc4, { metalness: 0.9, roughness: 0.3, side: THREE.DoubleSide })); eggBox(c, g, X, grater, 1.5, 1.07, -6.4, 'grater', 'A box grater', 'Potato latkes are the Ashkenazi kind, not the only kind. Everybody at the table brought an opinion, and one of them brought applesauce.');
    const plate_ = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.02, 24), std(c, 0xf4f4f4, { roughness: 0.3 })); plate_.position.set(6.0, 0.78, -2.3); g.add(plate_);
    const dough = new THREE.Group(); for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), std(c, 0xd89a52, { roughness: 0.8 })); s.scale.y = 0.75; s.position.set((i % 2) * 0.12 - 0.06, 0.05, Math.floor(i / 2) * 0.12 - 0.06); dough.add(s); const sug = new THREE.Mesh(new THREE.SphereGeometry(0.061, 14, 10, 0, PI * 2, 0, 0.9), std(c, 0xfafafa, { roughness: 1 })); sug.scale.y = 0.75; sug.position.copy(s.position); dough.add(sug); }
    eggBox(c, g, X, dough, 6.0, 0.78, -2.3, 'sufganiyot', 'Jelly doughnuts', 'Sufganiyot: fried, filled, sugared, for the oil that lasted. The napkin has accepted its assignment.');
    const rack = new THREE.Group(); for (let i = 0; i < 7; i++) rack.add(c.slab(0.02, 0.01, 0.3, std(c, 0x999999, { metalness: 0.8 }), -0.15 + i * 0.05, 0, 0)); eggBox(c, g, X, rack, 6.6, 0.79, -1.9, 'rack', 'A cooling rack', 'The festival lights are not for reading or cooking by. The kitchen keeps its own bulb, and its own opinions.');
    for (let i = 0; i < 6; i++) { const co = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.005, 16), GOLD(c)); co.position.set(5.5 + Math.random() * 0.3, 0.775, -2.6 + Math.random() * 0.3); g.add(co); }
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(5, 3.4), new THREE.MeshStandardMaterial({ map: c.canvasTex(256, 192, (q, w, h) => { q.fillStyle = '#7a2a2a'; q.fillRect(0, 0, w, h); q.strokeStyle = '#d8b878'; q.lineWidth = 6; q.strokeRect(10, 10, w - 20, h - 20); q.strokeRect(26, 26, w - 52, h - 52); for (let i = 0; i < 8; i++) { q.fillStyle = '#1d3a6a'; q.beginPath(); q.arc(48 + i * 22, h / 2, 6, 0, 7); q.fill(); } }), roughness: 1 }));
    rug.rotation.x = -PI / 2; rug.position.set(12.0, 0.008, 0.4); g.add(rug);
    const lampW = new THREE.PointLight(0xffc080, 0, 6, 1.4); lampW.position.set(16.8, 1.7, 2.6); g.add(lampW); lampW.intensity = 2.5;
  },

  // DYKER HEIGHTS. Throw the main: the block goes dark, then comes back house by house, each outdoing the last, ending with one porch bulb.
  dyker(c, r, g, X) {
    const { THREE } = c, U = plateFX(c, r);
    const groups = [];   // [ledPoints, wave]
    const add = (pts, wave, o = {}) => { const p = ledPoints(c, g, pts, o); p.material.uniforms.uOn.value = 1.1; groups.push([p, wave]); return p; };
    // the two houses either side: eaves, gables, windows outlined, porch columns wrapped
    for (const side of [0, 1]) { const x = side ? W - 0.45 : 0.45, s = side ? -1 : 1, pal = side ? [[1, 0.2, 0.2], [0.2, 1, 0.4], [1, 0.8, 0.2], [0.3, 0.5, 1]] : [[1, 0.88, 0.62]];
      const pts = [];
      for (const z0 of [-7.4, -2.6]) { const z1 = z0 + 4.2; pts.push(...strand([[x, 6.6, z0], [x, 8.6, (z0 + z1) / 2], [x, 6.6, z1]], 0.14)); pts.push(...strand([[x, 6.6, z0], [x, 6.6, z1]], 0.14));
        for (const zz of [z0 + 0.9, z1 - 0.9]) pts.push(...strand([[x, 3.2, zz - 0.5], [x, 3.2, zz + 0.5], [x, 4.8, zz + 0.5], [x, 4.8, zz - 0.5], [x, 3.2, zz - 0.5]], 0.12)); }
      for (const zz of [-6.6, -3.0, 0.6]) { for (let k = 0; k < 90; k++) { const u = k / 90, a = u * 18; pts.push([x + s * (0.7 + Math.cos(a) * 0.14), u * 3.2, zz + Math.sin(a) * 0.14]); } g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.2, 10), std(c, 0xf2f0ea)).translateX(x + s * 0.7).translateY(1.6).translateZ(zz)); c.post(X(x + s * 0.7), zz, 0.25); }
      add(pts.map((p) => [...p.slice(0, 3), 0, pal[(Math.random() * pal.length) | 0]]), side ? 3 : 1, { size: 0.09, gain: 2.4 });
      g.add(c.slab(2.6, 0.03, 9.2, c.surf('grass', 2, 0x4a6a3a), side ? W - 1.5 : 1.5, 0.015, -3.0)); }
    // the light tunnel over the walk, chasing
    const tun = []; for (let a = 0; a < 6; a++) { const z = -6.2 + a * 1.4; for (let k = 0; k <= 70; k++) { const u = k / 70 * PI; tun.push([W / 2 + Math.cos(u) * 3.2, Math.sin(u) * 3.6, z, k / 70, [[1, 0.2, 0.3], [1, 1, 1], [0.2, 1, 0.4]][a % 3]]); } }
    add(tun, 2, { size: 0.1, gain: 2.6, chase: 0.6 });
    // candy canes along the walk
    const cane = c.canvasTex(64, 256, (q, w, h) => { q.fillStyle = '#ffffff'; q.fillRect(0, 0, w, h); q.fillStyle = '#d01020'; for (let y = -64; y < h; y += 48) { q.beginPath(); q.moveTo(0, y); q.lineTo(w, y + 32); q.lineTo(w, y + 52); q.lineTo(0, y + 20); q.fill(); } });
    const cm = new THREE.MeshStandardMaterial({ map: cane, roughness: 0.3, emissive: 0x401010, emissiveMap: cane });
    for (const x of [6.4, 13.6]) for (let k = 0; k < 4; k++) { const z = -6.6 + k * 2.4; prop(c, r, g, X, 'lt_candycane', x, z, { h: 1.5, ry: x < 10 ? PI / 2 : -PI / 2 }); }   // v5: modelled canes (Krea, Tripo), not sticks
    // the meter and the main switch
    const box = new THREE.Group(); box.position.set(18.8, 0, -4.8); box.rotation.y = -PI / 2; g.add(box); c.post(X(18.8), -4.8, 0.5);
    box.add(c.slab(0.9, 1.4, 0.3, std(c, 0x6a7a6a, { metalness: 0.5, roughness: 0.5 }), 0, 1.4, 0));
    const dial = new THREE.Mesh(new THREE.CircleGeometry(0.2, 32), new THREE.MeshBasicMaterial({ map: c.canvasTex(128, 128, (q, w) => { q.fillStyle = '#f4f2ea'; q.beginPath(); q.arc(64, 64, 62, 0, 7); q.fill(); q.fillStyle = '#111'; q.font = '700 14px monospace'; q.textAlign = 'center'; q.fillText('KWH', 64, 40); q.fillRect(62, 64, 4, 50); }), toneMapped: false })); dial.position.set(0, 1.62, 0.16); box.add(dial);
    const knife = new THREE.Group(); knife.position.set(0, 1.05, 0.2); box.add(knife); knife.add(c.slab(0.06, 0.5, 0.06, std(c, 0xc8a040, { metalness: 1, roughness: 0.3 }), 0, 0.25, 0)); knife.add(c.slab(0.2, 0.08, 0.08, std(c, 0x111111), 0, 0.5, 0));
    const tag = c.sign('"BLOCK FANTASY"\nMAIN', { w: 0.8, h: 0.3, bg: '#ff6b00', fg: '#111', font: c.MONO, weight: 800 }); tag.position.set(0, 2.25, 0.16); box.add(tag);
    const bill = board(c, box, 0.8, 0.3, 128); bill.m.position.set(0, 0.62, 0.16); let kwh = 48211;
    const drawBill = () => { const { q, W: w, H: h } = bill; q.fillStyle = '#0a1a0a'; q.fillRect(0, 0, w, h); q.fillStyle = '#40ff60'; q.font = `700 ${h * 0.5}px monospace`; q.textAlign = 'center'; q.fillText(String(Math.floor(kwh)).padStart(7, '0'), w / 2, h * 0.7); bill.up(); };
    // the quiet house: one porch bulb by the south wall
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffe0a0, toneMapped: false })); bulb.position.set(16.4, 2.6, D / 2 - 0.3); g.add(bulb);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,220,150,.6)'), transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending })); halo.scale.setScalar(1.2); halo.position.copy(bulb.position); g.add(halo);
    const qt = notice(c, g, 'THE QUIET HOUSE', 16.4, 3.1, D / 2 - 0.16, PI, 1.1, 0.22); c.clickable(qt, () => c.egg('quiet', 'One porch bulb. Restraint, on this block, is a provocation. The quiet house has entered the competition.'), 'The quiet house');
    let mode = 'on', k = 0, spin = 1;
    c.clickable(knife, () => { if (mode !== 'on') return; mode = 'dark'; k = 0; knife.rotation.x = 1.2; snd(c, 'thud', 0.8); c.music.mute && c.music.mute(true); c.toast('The block goes dark. Give it a moment. It has its pride.', 3000); }, 'Throw the main');
    c.clickable(box, () => c.egg('meter', 'The meter. Participation, attendance and bulb counts vary year to year, so nobody here will give you a number. The meter will. It is not happy about it.'), 'The meter');
    c.tick((t, dt, P, ri) => {
      let lit = 1;
      if (mode === 'dark') { k += dt; lit = 0; if (k > 2.6) { mode = 'waves'; k = 0; c.music.mute && c.music.mute(false); } }
      else if (mode === 'waves') { k += dt; const w = Math.floor(k / 1.5) + 1; lit = Math.min(1, k / 7.5);
        if (w !== r.wave) { r.wave = w; snd(c, 'thud', 0.4); if (w <= 4) c.flash(0.08 * w); }
        if (k > 9.5) { mode = 'bulb'; k = 0; } }
      else if (mode === 'bulb') { k += dt; if (k > 1.2 && !r.bulbed) { r.bulbed = true; snd(c, 'click'); c.egg('block', 'Back, house by house, each outdoing the last, and then one modest porch bulb. The modern spectacle here is usually traced to one household’s display in 1986. The neighbours took it personally.'); }
        if (k > 2) { mode = 'on'; r.bulbed = false; knife.rotation.x = 0; } }
      const wave = mode === 'waves' ? Math.floor(k / 1.5) + 1 : mode === 'dark' ? 0 : 9;
      groups.forEach(([p, wv]) => { const u = p.material.uniforms.uMaster; u.value += ((wave >= wv ? 1 : 0) - u.value) * Math.min(1, dt * 6); });
      // v2: the blackout takes the facades, canopies, lamps and their puddles with it, then they come back with the waves
      r._dl = r._dl ?? 1; r._dl += ((mode === 'dark' ? 0.04 : lit) - r._dl) * Math.min(1, dt * 5); r.dressLevel && r.dressLevel(r._dl);
      U.uLit.value = mode === 'on' || mode === 'bulb' ? 1 : 0; U.uBand.value = mode === 'waves' ? Math.min(1.01, Math.floor(k / 1.5) * 0.25) : mode === 'dark' ? -1 : 2;
      const b = mode === 'dark' || (mode === 'waves' && k < 8) ? 0 : 1; bulb.visible = b > 0; halo.visible = b > 0;
      if (here(r, ri)) { spin += (((mode === 'dark' ? 0.05 : 1) + (mode === 'waves' ? 3 : 0)) - spin) * Math.min(1, dt * 2); dial.rotation.z -= dt * spin * 3; kwh += dt * spin * 7; if (Math.floor(t * 4) !== Math.floor((t - dt) * 4)) drawBill(); }
    });
    drawBill();
    const timer = c.slab(0.16, 0.1, 0.08, std(c, 0xf4f4f4), 0, 0, 0); eggBox(c, g, X, timer, 18.62, 0.9, -4.0, 'timer', 'A plug in timer', 'Timers run the displays on a schedule. Even spectacle needs a bedtime, and this one argues about it.');
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff0c8, emissiveIntensity: 1.2, transparent: true, opacity: 0.9 })); eggBox(c, g, X, led, 1.6, 0.2, 3.0, 'led', 'A giant LED bulb', 'LEDs generally draw far less than the old incandescent strings. Restraint found a technicality, and the block spent it on more lights.');
    const santa = c.glb('lt_santa', { h: 2.8, x: 17.2, z: -3.0, ry: -PI / 2, parent: g }); c.post(X(17.2), -3.0, 0.8); c.clickable(santa, () => c.say(santa, 'I am mostly air. So is the competition.', 2600, 3.0), 'An inflatable Santa');
    walkers(c, g, 10, { x1: 7.4, x2: 12.6, z1: -6.0, z2: 6.6, pool: 'walkers' });
  },
};
// ---------- v2 dressing (2026-11-15, after Astra's critique on Krea: "nine versions of the same exhibition box") ----------
// Every room gets inhabited edges: street level facades on both side walls (GPT Image 2.6 on Krea, work/v2/wall_<id>_l/r,
// their shop windows glow by brightness), warm spill from those windows on the paving, bulb canopies on cables overhead,
// lamps that actually light the ground under them, fir trees wrapped in bulbs, snowbanks where snow would sit, steam at
// the carts, and props from ON LOCATION's passed CC0 library. Everything that glows registers in r.dress, so a blackout
// (Dyker Heights) can take the whole block down and bring it back: r.dressLevel(k), k from 0 to 1.
const WARM = [[1, 0.74, 0.38], [1, 0.8, 0.52], [1, 0.66, 0.3], [1, 0.86, 0.62]];
const WARM_BLUE = [...WARM, ...WARM, [0.22, 0.42, 1]];
function dressRoom(c, r, g, X) {
  const { THREE } = c, D2 = D / 2, cfg = DRESS[r.id] || {};
  r.dress = { mats: [], leds: [], glows: [], level: 1 };
  r.dressLevel = (k) => { r.dress.level = k;
    r.dress.mats.forEach((m) => { m.emissiveIntensity = m.userData.e0 * k; if (m.userData.op0 !== undefined) m.opacity = m.userData.op0 * k; });
    r.dress.leds.forEach((o) => { o.material.uniforms.uMaster.value = k; });
    r.dress.glows.forEach((s) => { s.material.opacity = s.userData.op0 * k; });
    if (r.wet) r.wet.material.uniforms.uK.value = (r.wetK || 0.4) * Math.min(1, k); };
  r.arch = buildArch(c, r, g, X);   // v3: real buildings where the room has an ARCH entry
  if (!r.arch && !r.noFacade) facades(c, r, g);
  if (r.outdoor && !r.noFloor && !c.MOBILE && r.wet !== false) wetFloor(c, r, g);
  if (cfg.canopy !== false && (r.outdoor || cfg.canopy)) canopy(c, r, g, cfg.canopy || {});
  if (r.outdoor && !r.low && r.floorKind !== 'none') snowbanks(c, r, g, cfg);
  (cfg.lamps || []).forEach(([x, z, k]) => streetLamp(c, r, g, X, x, z, k));
  (cfg.firs || []).forEach(([x, z, h]) => litFir(c, r, g, X, x, z, h));
  (cfg.props || []).forEach((q) => prop(c, r, g, X, ...q));
  (cfg.steam || []).forEach(([x, y, z, s]) => steam(c, g, x, y, z, s || 1));
  if (cfg.radio) holidayRadio(c, r, g, X, ...cfg.radio);
  (cfg.ads || []).forEach(([x, z, ry, ad]) => adKiosk(c, r, g, X, x, z, ry, ad));
  (cfg.boards || []).forEach(([side, z, ad]) => billboard(c, r, g, side, z, ad));
  if (cfg.stand) treeStand(c, r, g, X, ...cfg.stand);
  if (cfg.orns) ornaments(c, r, g, X, cfg.orns);
  if (cfg.anamorph) anamorphFlower(c, r, g, X, ...cfg.anamorph);
  if (cfg.globe) snowGlobe(c, r, g, X, ...cfg.globe);
  if (cfg.gelt) gelt(c, r, g, ...cfg.gelt);
  if (cfg.iv) ivShow(c, r, g, X, cfg.iv);
  if (r.outdoor && !r.low) southMural(c, r, g);
  if (r.id === 'top') deckViews(c, r, g);
  v4Room(c, r, g, X);
  v5Room(c, r, g, X);
  beatLights(c, r);
  if (cfg.sleigh) flyingSleigh(c, r, g, X);
  (cfg.deer || []).forEach((q) => litReindeer(c, r, g, X, ...q));
  (cfg.snowmen || []).forEach(([x, z, ry]) => { const sm = prop(c, r, g, X, 'lt_snowman', x, z, { h: 1.8, ry, r: 0.5 }); c.clickable(sm, () => c.egg('snowman', 'A snowman with an eye flower for a head. Every New Yorker here has one. The snowman insisted.'), 'A snowman'); });
  (cfg.watch || []).forEach(([x, y, z, ry, R]) => { const w = watcher(c, g, x, y, z, ry, R); w.traverse((m) => { if (m.material && m.material.color) m.material.color.multiplyScalar(0.62); }); c.clickable(w, () => c.egg('watched', 'An eye flower that follows you round the room. It is a flat disc; the pupil slides toward wherever you stand. The oldest trick in portraiture, without the portrait.'), 'An eye flower'); });
}
// a wall image: map plus an emissive that only lets the bright parts (lit windows, bulbs, neon) glow
function facadeMat(c, url, rep = [1, 1], off = [0, 0], night = 0.62) {
  const { THREE } = c, t = c.tex.load(url); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.repeat.set(...rep); t.offset.set(...off);
  const m = new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 1.5, roughness: 0.78, metalness: 0.05, color: new THREE.Color(night, night, night * 1.06) });
  m.userData.e0 = 1.5;
  m.onBeforeCompile = (s) => { s.fragmentShader = s.fragmentShader.replace('#include <emissivemap_fragment>',
    `#ifdef USE_EMISSIVEMAP
      vec4 eT = texture2D( emissiveMap, vEmissiveMapUv ); float eL = dot( eT.rgb, vec3( .299, .587, .114 ) );
      totalEmissiveRadiance *= eT.rgb * smoothstep( .52, .9, eL ) * ( .55 + .45 * eT.r );
    #endif`); };
  return m;
}
function facades(c, r, g) {
  if ((DRESS[r.id] || {}).facades === false) return;
  const { THREE } = c, L = (window.WALLS || []).includes(`${r.id}_l`), R = (window.WALLS || []).includes(`${r.id}_r`);
  if (!L && !R) return;
  const H = r.outdoor ? (r.low ? 3.9 : 5) : (r.ceilH || H_IN) - 0.02, Wd = H * 2, z0 = -D / 2, z1 = Math.min(DZ1 - 0.08, z0 + Wd);
  const w = z1 - z0, frac = w / Wd;   // the image is 2:1; where the doorway cuts it short, crop rather than squash
  const side = (id, x, ry) => {
    const m = facadeMat(c, `assets/walls/${id}.jpg`, [frac, 1], [ry > 0 ? 0 : 1 - frac, 0], r.outdoor ? 0.62 : 1.0); r.dress.mats.push(m);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, H), m); p.position.set(x, H / 2, (z0 + z1) / 2); p.rotation.y = ry; g.add(p);
    // the short run of wall between the doorway and the south wall wears the other end of the same picture
    const w2 = D / 2 - DZ2 - 0.08; if (w2 > 0.5) { const m2 = facadeMat(c, `assets/walls/${id}.jpg`, [w2 / Wd, 1], [ry > 0 ? 1 - w2 / Wd : 0, 0], r.outdoor ? 0.62 : 0.85); r.dress.mats.push(m2);
      const p2 = new THREE.Mesh(new THREE.PlaneGeometry(w2, Math.min(H, DH - 0.1)), m2); p2.position.set(x, Math.min(H, DH - 0.1) / 2, D / 2 - w2 / 2); p2.rotation.y = ry; g.add(p2); }
    if (r.outdoor) {   // a cornice where the shopfront ends and the building goes on up
      const corn = c.slab(0.32, 0.28, w + 0.3, std(c, 0x8c8478, { roughness: 0.7 }), x + (ry > 0 ? 0.16 : -0.16), H + 0.14, (z0 + z1) / 2); g.add(corn);
      const sill = c.slab(0.12, 0.22, w, std(c, 0x4a463f, { roughness: 0.6 }), x + (ry > 0 ? 0.06 : -0.06), 0.11, (z0 + z1) / 2); g.add(sill); }
    // the building goes on up: generated upper storeys, stone in Midtown, brick in Brooklyn, their windows glowing too
    const HT = r.outdoor ? (r.low ? 4 : 10) : H_IN, up = r.upper || (['brooklyn', 'dyker'].includes(r.id) ? 'upper_brick' : 'upper_stone');
    if (r.outdoor && !r.low && (window.WALLS || []).includes(up)) { const UH = HT - H - 0.28, UW = D;
      const mu = facadeMat(c, `assets/walls/${up}.jpg`, [UW / (UH * 2), 1], [ry > 0 ? 0 : 0.37, 0], 0.5); mu.map.wrapS = THREE.RepeatWrapping; mu.userData.e0 = mu.emissiveIntensity = 1.2; r.dress.mats.push(mu);
      const pu = new THREE.Mesh(new THREE.PlaneGeometry(UW, UH), mu); pu.position.set(x + (ry > 0 ? 0.01 : -0.01), H + 0.28 + UH / 2, 0); pu.rotation.y = ry; g.add(pu); }
    // the windows spill warm light across the paving in front of them
    const sp = spill(c, Math.min(3.2, W * 0.16), w, ry > 0); sp.position.set(x + (ry > 0 ? 1 : -1) * Math.min(3.2, W * 0.16) / 2, 0.015, (z0 + z1) / 2); g.add(sp); r.dress.mats.push(sp.material);
  };
  // the north wall stubs either side of the plate were the blank pillars Astra flagged: they wear the corner of each facade
  // and the upper storeys, so the street runs on into the photograph
  if (r.outdoor && !r.openNorth) { const pw = (W - PORTAL.w) / 2, HT = r.low ? 4 : 10, up = r.upper || (['brooklyn', 'dyker'].includes(r.id) ? 'upper_brick' : 'upper_stone');
    const stub = (id, cx, left) => { const m = facadeMat(c, `assets/walls/${id}.jpg`, [pw / (H * 2), 1], [left ? 1 - pw / (H * 2) : 0, 0], 0.62); r.dress.mats.push(m);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(pw, H), m); p.position.set(cx, H / 2, -D / 2 + 0.012); g.add(p);
      if (!r.low && (window.WALLS || []).includes(up)) { const UH = HT - H - 0.28, mu = facadeMat(c, `assets/walls/${up}.jpg`, [pw / (UH * 2), 1], [left ? 0.1 : 0.6, 0], 0.5); mu.userData.e0 = mu.emissiveIntensity = 1.2; r.dress.mats.push(mu);
        const pu = new THREE.Mesh(new THREE.PlaneGeometry(pw, UH), mu); pu.position.set(cx, H + 0.28 + UH / 2, -D / 2 + 0.012); g.add(pu);
        g.add(c.slab(pw, 0.28, 0.32, std(c, 0x8c8478, { roughness: 0.7 }), cx, H + 0.14, -D / 2 + 0.16)); } };
    if (L) stub(`${r.id}_l`, pw / 2, true); if (R) stub(`${r.id}_r`, W - pw / 2, false); }
  if (L) side(`${r.id}_l`, 0.13, PI / 2);
  if (R) side(`${r.id}_r`, W - 0.25 - 0.13, -PI / 2);
}
const SPILL = {};
function spill(c, depth, len, fromLeft) {
  const { THREE } = c;
  const t = SPILL[fromLeft] ||= c.canvasTex(256, 32, (q, w, h) => { const gr = q.createLinearGradient(fromLeft ? 0 : w, 0, fromLeft ? w : 0, 0);
    gr.addColorStop(0, 'rgba(255,190,110,.55)'); gr.addColorStop(0.35, 'rgba(255,170,90,.2)'); gr.addColorStop(1, 'rgba(255,160,80,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); });
  const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0.55, polygonOffset: true, polygonOffsetFactor: -6 });
  m.userData.op0 = 0.55; m.userData.e0 = 0; m.emissiveIntensity = 0;
  const p = new THREE.Mesh(new THREE.PlaneGeometry(depth, len), m); p.rotation.x = -PI / 2; p.renderOrder = 2; return p;
}
// bulbs on sagging cables from wall to wall, the way a block strings them
function canopy(c, r, g, { zs, y = r.low ? 3.5 : 6.2, sag = 0.9, step = 0.32, palette = WARM_BLUE, xa: XA = 0.3, xb: XB = W - 0.55 } = {}) {
  const { THREE } = c, rows = zs || [-5.6, -2.6, 0.4, 3.4, 6.2], pts = [], wire = [];
  for (const z of rows) { const xa = XA, xb = XB, path = [];
    for (let i = 0; i <= 24; i++) { const u = i / 24, x = xa + (xb - xa) * u; path.push([x, y - sag * 4 * u * (1 - u) + Math.sin(u * 9 + z) * 0.03, z + Math.sin(u * PI) * 0.25]); }
    strand(path, step).forEach((p) => pts.push([p[0], p[1] - 0.05, p[2], Math.random(), palette[(Math.random() * palette.length) | 0]]));
    for (let i = 1; i < path.length; i++) wire.push(...path[i - 1], ...path[i]); }
  const o = ledPoints(c, g, pts, { size: 0.06, gain: 1.6 }); o.material.uniforms.uOn.value = 2; r.dress.leds.push(o); c9Strand(c, g, pts, { r });
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wire, 3));
  g.add(new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: 0x15140f })));
}
// snow where snow sits: against the wall bases and along the curb at the far edge
function snowbanks(c, r, g, cfg) {
  const { THREE } = c, spots = [];
  const sx = r.arch ? 0.95 : 0.3; for (let z = -D / 2 + 0.2; z < D / 2 - 0.2; z += 0.34) { if (z > DZ1 - 0.2 && z < DZ2 + 0.2) continue; spots.push([sx, z]); spots.push([W - 0.25 - sx, z]); }
  if (cfg.curb !== false) for (let x = 0.4; x < W - 0.5; x += 0.38) { if (cfg.gap && x > cfg.gap[0] && x < cfg.gap[1]) continue; spots.push([x, -D / 2 + 1.25]); }
  const m = c.surf('acg_snow014', 0.8, 0xe8eef8); m.roughness = 0.9;
  const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 3), m, spots.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  spots.forEach(([x, z], i) => { const s = 0.18 + Math.random() * 0.22; e.set(0, Math.random() * 6, 0); q.setFromEuler(e);
    m4.compose(new THREE.Vector3(x + (Math.random() - 0.5) * 0.15, -s * 0.35, z), q, new THREE.Vector3(s * 1.5, s * 0.75, s * 1.3)); im.setMatrixAt(i, m4); });
  g.add(im);
}
// a street lamp with a glowing head and the pool of light it puts on the ground
const POOL = {};
function streetLamp(c, r, g, X, x, z, kind = 1) {
  const { THREE } = c, h = kind === 2 ? 4.4 : 3.9;
  prop(c, r, g, X, kind === 2 ? 'ph_street_lamp_02' : 'ph_street_lamp_01', x, z, { h, r: 0.22 });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: POOL.glow ||= glowTex(c, 'rgba(255,200,130,.95)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, color: 0xffd6a0, opacity: 0.9 }));
  s.position.set(x, h * 0.93, z); s.scale.set(1.3, 1.3, 1); s.userData.op0 = 0.9; g.add(s); r.dress.glows.push(s);
  wreath(c, g, x, 1.9, z + 0.13, 0, 0.32); lampBanners(c, r, g, x, z, (r.lampK = (r.lampK || 0) + 2));
  const t = POOL.t ||= c.canvasTex(128, 128, (q) => { const gr = q.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,200,130,.6)'); gr.addColorStop(0.5, 'rgba(255,180,110,.2)'); gr.addColorStop(1, 'rgba(255,170,100,0)'); q.fillStyle = gr; q.fillRect(0, 0, 128, 128); });
  const pm = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0.45, polygonOffset: true, polygonOffsetFactor: -6 });
  pm.userData.op0 = 0.45; pm.userData.e0 = 0; const p = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), pm); p.rotation.x = -PI / 2; p.position.set(x, 0.016, z); p.renderOrder = 2; g.add(p); r.dress.mats.push(pm);
}
// a CC0 fir wrapped in a spiral of bulbs, base in a planter
function litFir(c, r, g, X, x, z, h = 2.6) {
  prop(c, r, g, X, 'ph_fir_tree_01', x, z, { h, r: 0.5 });
  const pts = [], turns = 7, n = Math.round(h * 46);
  for (let i = 0; i < n; i++) { const u = i / n, y = 0.35 + u * (h - 0.5), rad = (1 - u) * h * 0.3 + 0.05, a = u * turns * PI * 2;
    pts.push([x + Math.cos(a) * rad, y, z + Math.sin(a) * rad, Math.random(), WARM_BLUE[(Math.random() * WARM_BLUE.length) | 0]]); }
  const o = ledPoints(c, g, pts, { size: 0.07, gain: 2.4 }); o.material.uniforms.uOn.value = 2; r.dress.leds.push(o);
}
// what each room adds. props: [name, x, z, { h, len, ry, r }]. Collisions with the room's own pieces were walked in shots.
const DRESS = {
  fifth: { iv: { side: 1, proj: [15.6, 2.8, 0, -1.3] }, gelt: [18.6, 1.32, 1.0], deer: [[17.4, -2.6, -2.0, 1.8]], snowmen: [[2.6, -4.6, 0.9]], ads: [[3.2, 2.6, PI / 2, 'ad_n3wyorkers']], boards: [[1, -3.2, 'ad_mlowxyz']], orns: [[16.2, -4.9, 0.5], [17.3, -5.4, 0.32]], watch: [[2.0, 7.6, -7.86, 0, 0.9]], radio: [1.3, 4.6, { model: 'ph_boombox', h: 0.42, y: 0.48, ry: PI / 2 }], lamps: [[1.4, -5.6], [18.4, -5.6]], firs: [[1.3, -1.2, 2.4], [18.5, -1.2, 2.4]],
    props: [['ph_CoffeeCart_01', 16.8, 4.6, { h: 1.9, ry: -PI / 2, r: 0.8 }], ['ph_painted_wooden_bench', 1.3, 4.6, { len: 1.8, ry: PI / 2, r: 0.6 }], ['ph_utility_box_01', 18.6, 1.0, { h: 1.2, ry: -PI / 2, r: 0.4 }], ['nyb_walking_newsbox', 1.2, 0.6, { h: 1.1, ry: PI / 2, r: 0.35 }]],
    steam: [[16.8, 1.9, 4.6, 0.8]] },
  channel: { iv: { side: -1, proj: [3.2, 4.6, 0, 1.3] }, gelt: [1.4, 0.55, 2.9], anamorph: [[3.7, 1.6, 6.8], [3.7, 2.4, -1.5], [3.7, -1.0, 4.4, 9], 'From here the paint on the paving stands up into one eye flower. Walk two steps and it smears back into the stones. Surface anamorphosis: the floor is painted as the eye at this spot would see it.'], lamps: [[1.3, 5.2, 2], [18.6, 5.2, 2]], props: [['ph_painted_wooden_bench', 1.3, 2.9, { len: 1.6, ry: PI / 2, r: 0.5 }], ['ph_painted_wooden_bench', 18.6, 2.9, { len: 1.6, ry: -PI / 2, r: 0.5 }]], curb: false },
  rink: { iv: { side: -1, proj: [3.0, 4.8, 0, 1.2] }, gelt: [17.9, 1.85, 5.2], ads: [[1.6, 2.2, PI / 2, 'ad_mlownyc']], radio: [17.9, 4.2, { model: 'ph_vintage_radio_transceiver', h: 0.3, y: 1.0, ry: -PI / 2 }], canopy: { zs: [2.2, 5.0], y: 5.4 }, props: [['nyb_heat_ices', 17.9, 5.2, { h: 1.7, ry: -PI / 2, r: 0.7 }], ['ph_painted_wooden_bench', 1.3, 5.6, { len: 1.6, ry: PI / 2, r: 0.5 }]], steam: [[17.9, 1.7, 5.2, 0.6]] },
  tree: { iv: { side: 1, proj: [14.2, 4.4, 0, -1.2] }, gelt: [2.4, 1.12, -4.6], ads: [[16.9, 2.4, -PI / 2, 'ad_mlownyc']], boards: [[-1, -2.6, 'ad_count']], orns: [[3.6, -5.5, 0.45], [4.5, -5.7, 0.3], [13.4, -5.7, 0.42], [12.6, -5.9, 0.26]], canopy: { zs: [1.0, 4.0, 6.6] }, lamps: [[1.3, -0.6, 2], [18.6, 1.4, 2]], firs: [[1.4, 4.2, 2.6], [18.5, 4.6, 2.6]], gap: [4, 16],
    props: [['ph_tool_cart', 2.4, -4.6, { h: 1.0, ry: 0.4, r: 0.5 }], ['nyb_rink_gift_a', 3.2, -5.6, { h: 0.6, r: 0.4 }], ['nyb_rink_gift_b', 16.9, -6.0, { h: 0.7 }]] },
  top: { facades: false, gelt: [2.0, 0.58, 3.0], globe: [16.4, 2.4], canopy: { zs: [-1, 3], y: 3.6, sag: 0.5 }, firs: [[1.4, 5.4, 1.8], [18.5, 5.4, 1.8]], props: [['ph_painted_wooden_bench', 2.0, 3.0, { len: 1.8, ry: PI / 2, r: 0.6 }]] },
  menorah: { iv: { side: 1, proj: [16.2, 4.6, 0, -1.3] }, gelt: [1.3, 0.58, 2.4], ads: [[16.6, 1.6, -PI / 2, 'ad_n3wyorkers']], boards: [[-1, -2.4, 'ad_mlowxyz']], canopy: { zs: [2.4, 5.6] }, lamps: [[1.4, -4.6], [1.4, 4.8]], firs: [[18.5, 5.4, 2.4]], props: [['ph_painted_wooden_bench', 1.3, 2.4, { len: 1.8, ry: PI / 2, r: 0.6 }], ['ph_CoffeeCart_01', 6.0, 5.6, { h: 1.9, r: 0.8 }]], steam: [[6.0, 1.9, 5.6, 0.7]], gap: [6, 14] },
  brooklyn: { iv: { side: 1, proj: [15.2, 3.0, 0, -1.3] }, gelt: [3.7, 0.12, 0.6], snowmen: [[16.2, -4.2, -0.8]], stand: [2.3, 1.6, PI / 2], ads: [[17.3, 1.4, -PI / 2, 'ad_mlownyc']], radio: [16.4, 4.2, { model: 'ph_boombox', h: 0.45, y: 1.02, ry: -2.2 }], canopy: { zs: [0.4, 3.4, 6.2], palette: WARM_BLUE }, lamps: [[1.3, -4.8, 2]], firs: [[1.4, 5.4, 2.2]],
    props: [['ph_CoffeeCart_01', 17.4, 5.0, { h: 1.9, ry: -PI / 2, r: 0.8 }], ['ph_plastic_monobloc_chair_01', 13.6, 4.6, { h: 0.85, ry: 2.4 }], ['ph_plastic_monobloc_chair_01', 14.5, 5.6, { h: 0.85, ry: 3.4 }], ['ph_plastic_monobloc_chair_01', 12.9, 5.8, { h: 0.85, ry: 1.2 }]],
    steam: [[17.4, 1.9, 5.0, 0.7]], gap: [6, 14] },
  window: { gelt: [10.1, 0.48, -5.3], canopy: { xa: 4.65, xb: 15.35, zs: [-6.6, -3.6, -0.8], y: 3.2, sag: 0.38, step: 0.24, palette: [[0.25, 0.45, 1], [1, 1, 1], [1, 0.86, 0.6], [0.25, 0.45, 1]] }, radio: [6.8, -6.6, { y: 0.62, h: 0.3, ry: 2.6 }], props: [['ph_side_table_01', 6.8, -6.6, { h: 0.6, r: 0.3 }], ['ph_dining_table', 10, 3.6, { len: 1.8, r: 1.0 }], ['ph_dining_chair_02', 9.2, 3.0, { h: 0.95, ry: 0.2 }], ['ph_dining_chair_02', 10.8, 3.0, { h: 0.95, ry: -0.2 }], ['ph_brass_candleholders', 10, 3.6, { h: 0.3, y: 0.76 }], ['ph_vintage_grandfather_clock_01', 5.0, -0.1, { h: 2.1, r: 0.4 }], ['ph_potted_plant_02', 14.9, -7.3, { h: 1.3, r: 0.35 }]] },
  dyker: { sleigh: true, iv: { side: -1, proj: [3.6, 2.6, 0, 1.3] }, gelt: [2.2, 0.62, 5.2], deer: [[16.4, 1.2, -2.2], [17.6, 3.4, -2.6, 1.5]], snowmen: [[3.0, -4.4, 1.2]], orns: [[17.8, -3.0, 0.55], [16.8, -3.7, 0.34]], watch: [[W - 0.5, 7.4, -1.8, -PI / 2, 1.0]], radio: [2.2, 5.2, { model: 'ph_boombox', h: 0.5, ry: 2.2 }], canopy: { zs: [-4.6, -1.6, 1.4, 4.4, 7.0], palette: [...WARM, [1, 0.2, 0.2], [0.2, 0.9, 0.35], [0.22, 0.42, 1]] }, lamps: [[1.4, 2.0, 2]], firs: [[18.5, 6.4, 2.6]],
    props: [['nyb_big_soldier', 1.2, -2.6, { h: 2.4, ry: PI / 2, r: 0.4 }], ['nyb_big_soldier', 1.2, 0.6, { h: 2.4, ry: PI / 2, r: 0.4 }], ['ph_CoffeeCart_01', 15.0, 6.4, { h: 1.9, ry: PI, r: 0.8 }]], steam: [[15.0, 1.9, 6.4, 0.6]] },
};
// wet paving: a Reflector a few millimetres over the floor that only shows through in puddles (a blob mask), so the lights
// break up in the wet the way Astra asked ("wet pavement is not a mirror"). Desktop only; the rink keeps its own ice.
const WETMASK = {};
function wetFloor(c, r, g) {
  const { THREE } = c;
  const mask = WETMASK.t ||= (() => { const t = c.canvasTex(512, 512, (q, w, h) => { q.fillStyle = '#000'; q.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { const x = Math.random() * w, y = Math.random() * h, rr = 14 + Math.random() * 70, gr = q.createRadialGradient(x, y, 0, x, y, rr);
      gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(0.6, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr;
      for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) { q.save(); q.translate(dx, dy); q.beginPath(); q.ellipse(x, y, rr, rr * (0.4 + Math.random() * 0.5), Math.random() * 3, 0, 7); q.fill(); q.restore(); } } });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; return t; })();
  const shader = { name: 'WetShader', uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, tMask: { value: mask }, uK: { value: r.wetK || 0.4 } },
    vertexShader: ['uniform mat4 textureMatrix;', 'varying vec4 vUv;', 'varying vec2 vP;', '#include <common>', '#include <logdepthbuf_pars_vertex>',
      'void main() {', ' vUv = textureMatrix * vec4( position, 1.0 ); vP = position.xy;', ' gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );', ' #include <logdepthbuf_vertex>', '}'].join('\n'),
    fragmentShader: ['uniform vec3 color;', 'uniform sampler2D tDiffuse, tMask;', 'uniform float uK;', 'varying vec4 vUv;', 'varying vec2 vP;', '#include <logdepthbuf_pars_fragment>',
      'void main() {', ' #include <logdepthbuf_fragment>', ' vec4 base = texture2DProj( tDiffuse, vUv );', ' float m = texture2D( tMask, vP * 0.085 ).r * 0.75 + texture2D( tMask, vP * 0.031 + 0.37 ).r * 0.45;',
      ' m = smoothstep( 0.7, 1.1, m );', ' gl_FragColor = vec4( base.rgb * color, m * uK );', ' #include <tonemapping_fragment>', ' #include <colorspace_fragment>', '}'].join('\n') };
  const res = Math.min(1024, Math.round(innerWidth * 0.5));
  const wet = new Reflector(new THREE.PlaneGeometry(W - 0.3, D - 0.3), { clipBias: 0.003, textureWidth: res, textureHeight: Math.round(res * innerHeight / innerWidth), color: 0x9aa4b4, shader });
  wet.material.transparent = true; wet.material.depthWrite = false; wet.renderOrder = 1;
  wet.rotation.x = -PI / 2; wet.position.set(W / 2, 0.004, 0); g.add(wet); r.wet = wet;
}
// the holiday radio (v2.1): one dial, eight traditions (music.js r_*). Each click tunes to the next station; hearing them all is an egg.
const RADIO = { k: -1, heard: new Set() };
const STATIONS = ['r_chanukah', 'r_christmas', 'r_shchedryk', 'r_posadas', 'r_parranda', 'r_kwanzaa', 'r_yalda', 'r_diwali'];
function holidayRadio(c, r, g, X, x, z, { model = 'ph_vintage_radio_transceiver', h = 0.35, y = 0, ry = 0, start } = {}) {
  const m = prop(c, r, g, X, model, x, z, { h, y, ry, r: y ? 0 : 0.3 });
  const tune = () => { RADIO.k = (RADIO.k + 1) % STATIONS.length; const st = STATIONS[RADIO.k]; c.music.play(st); snd(c, 'click'); RADIO.heard.add(st);
    const lab = (c.music.STYLES[st] || {}).label || st; c.toast(`WNYL HOLIDAY RADIO · ${lab}`, 3200);
    if (RADIO.heard.size === STATIONS.length) c.egg('radio', 'All eight stations: Chanukah, Christmas, the Ukrainian Shchedryk, Las Posadas, a Puerto Rican parranda, Kwanzaa, Yalda and Diwali. One city, one dial, the same long nights.'); };
  c.clickable(m, tune, 'The holiday radio');
  return m;
}

// eggs that are named at run time, listed here so the egg count sees them: egg: 'ads_n3wyorkers' egg: 'ads_mlownyc' egg: 'ads_mlowxyz' egg: 'ads_count'
// ---------- v2.1 (MLow: "more dynamic, more illusions, my art everywhere, fake ads, more 3D, more decorations") ----------
const ADTEX = {};
function adTex(c, src) { const { THREE } = c; const t = ADTEX[src] ||= c.tex.load(src); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
// a backlit street kiosk: an ad for one of MLow's sites on the street face, his census art turning over on the other
function adKiosk(c, r, g, X, x, z, ry, ad) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, 0, z); o.rotation.y = ry; g.add(o); c.post(X(x), z, 0.7);
  const frame = std(c, 0x16181d, { metalness: 0.7, roughness: 0.35 });
  o.add(c.slab(1.36, 2.36, 0.34, frame, 0, 1.18 + 0.12, 0)); o.add(c.slab(1.5, 0.12, 0.42, frame, 0, 0.06, 0)); o.add(c.slab(1.46, 0.1, 0.4, frame, 0, 2.47, 0));
  const face = (src, zz, flip) => { const m = new THREE.MeshBasicMaterial({ map: adTex(c, src), toneMapped: false }); m.color.setScalar(0.62); m.userData.e0 = 0;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.8 * 1.2 / 1.2 * 1.5 / 1.5 * 1.8 / 1.8), m); p.scale.set(1, 1, 1); p.position.set(0, 1.32, zz); if (flip) p.rotation.y = PI; o.add(p); return p; };
  const front = face(`assets/ads/${ad}.jpg`, 0.175, false); front.geometry = new THREE.PlaneGeometry(1.2, 1.8);
  c.clickable(front, () => c.egg('ads_' + ad.split('_')[1], { ad_n3wyorkers: 'N3WYORKERS.COM: every New Yorker, counted. The ad is fake. The census is not.', ad_mlownyc: 'MLOW.NYC: framed prints, made in New York. You are standing in the advertisement.', ad_mlowxyz: 'MLOW.XYZ: the artist, the whole story. Billboards are the oldest walkable gallery in the city.', ad_count: 'COUNT ME IN, NEW YORK. N3WYORKERS.COM. The crowd on the billboard has more eyes than faces.' }[ad] || 'An advertisement.'), 'An advertisement');
  // the art side turns over every nine seconds, through the room's own New Yorkers
  const cast = (r.cast || []).filter((p) => p.f); if (!cast.length) return o;
  const am = new THREE.MeshBasicMaterial({ toneMapped: false }); am.color.setScalar(0.66);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.8), am); back.position.set(0, 1.32, -0.175); back.rotation.y = PI; o.add(back);
  let k = (Math.random() * cast.length) | 0, cur = null;
  const show = () => { const p = cast[k % cast.length]; cur = p; const t = c.tex.load(`assets/art/${p.f}`, (tt) => { const a = tt.image.width / tt.image.height, b = 1.2 / 1.8; if (a > b) { tt.repeat.set(b / a, 1); tt.offset.set((1 - b / a) / 2, 0); } else { tt.repeat.set(1, a / b); tt.offset.set(0, (1 - a / b) / 2); } }); t.colorSpace = THREE.SRGBColorSpace; am.map = t; am.needsUpdate = true; };
  show(); let tt = Math.random() * 9; c.tick((t, dt, P, ri) => { if (ri !== r.i) return; tt += dt; if (tt > 9) { tt = 0; k++; show(); } });
  c.clickable(back, () => cur && c.openPiece && c.openPiece(cur), 'A New Yorker in a lightbox');
  const pool = spill(c, 1.6, 1.4, true); pool.rotation.z = PI / 2; pool.position.set(0, 0.016, 0.9); o.add(pool); r.dress.mats.push(pool.material);
  return o;
}
// a lit billboard on the upper storeys, with its own lamps
const AD_ASPECT = { ad_mlowxyz: 2.51 };
function billboard(c, r, g, side, z, ad, y = 7.4, w = 6.4) {
  const hh = w / (AD_ASPECT[ad] || 2);
  const { THREE } = c, x = side < 0 ? (r.arch ? 0.5 : 0.2) : W - (r.arch ? 0.75 : 0.45), ry = side < 0 ? PI / 2 : -PI / 2, o = new THREE.Group(); o.position.set(x, y, z); o.rotation.y = ry; g.add(o);
  const m = new THREE.MeshStandardMaterial({ map: adTex(c, `assets/ads/${ad}.jpg`), emissiveMap: adTex(c, `assets/ads/${ad}.jpg`), emissive: 0xffffff, emissiveIntensity: 0.85, roughness: 0.6 }); m.userData.e0 = 0.85; r.dress.mats.push(m);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), m); face.position.z = 0.1; o.add(face);   // (o.add() returns o: setting .position on it moved the whole board behind its own frame)
  o.add(c.slab(w + 0.3, hh + 0.3, 0.12, std(c, 0x1a1a1a, { metalness: 0.6, roughness: 0.4 }), 0, 0, 0.02));
  for (let i = 0; i < 4; i++) { const lx = -w / 2 + w * (i + 0.5) / 4; o.add(c.slab(0.06, 0.06, 0.9, std(c, 0x222222), lx, -hh / 2 - 0.25, 0.45));
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: POOL.glow ||= glowTex(c, 'rgba(255,200,130,.95)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0.9 })); s.position.set(lx, -hh / 2 - 0.2, 0.9); s.scale.set(0.6, 0.6, 1); s.userData.op0 = 0.9; o.add(s); r.dress.glows.push(s); }
  return o;
}
// banners of the room's New Yorkers on a lamp post, both sides, clickable to the piece
function lampBanners(c, r, g, x, z, k0 = 0) {
  const { THREE } = c, cast = (r.cast || []).filter((p) => p.f); if (!cast.length) return;
  [-1, 1].forEach((sx, j) => { const p = cast[(k0 + j) % cast.length];
    const t = c.tex.load(`assets/art/${p.f}`, (tt) => { const a = tt.image.width / tt.image.height, b = 0.55 / 1.1; if (a > b) { tt.repeat.set(b / a, 1); tt.offset.set((1 - b / a) / 2, 0); } }); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.75, side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.12 });
    const b = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 1.1), m); b.position.set(x + sx * 0.36, 2.55, z); b.rotation.y = PI / 2; g.add(b);
    g.add(c.slab(0.7, 0.03, 0.03, std(c, 0x1a1a1a, { metalness: 0.8 }), x, 3.12, z));
    let ph = Math.random() * 6; c.tick((tm) => { b.rotation.y = PI / 2 + Math.sin(tm * 0.9 + ph) * 0.06; });
    c.clickable(b, () => c.openPiece && c.openPiece(p), `${p.t}, on a banner`); });
}
// a sidewalk tree seller: firs leaned in a frame, a string of bulbs, a hand painted sign, a barrel fire
function treeStand(c, r, g, X, x, z, ry = 0) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, 0, z); o.rotation.y = ry; g.add(o); c.post(X(x), z, 1.2);
  const wood = std(c, 0x6a4a2a, { roughness: 0.85 });
  o.add(c.slab(3.2, 0.08, 0.08, wood, 0, 2.2, -0.35)); for (const sx of [-1.55, 1.55]) o.add(c.slab(0.08, 2.2, 0.08, wood, sx, 1.1, -0.35));
  for (let i = 0; i < 6; i++) { const t = c.glb('ph_fir_tree_01', { h: 1.9 + (i % 3) * 0.25, x: -1.3 + i * 0.52, z: -0.5, parent: o, shadow: false }); t.rotation.x = -0.14; t.rotation.z = (Math.random() - 0.5) * 0.1; }
  const pts = strand(Array.from({ length: 13 }, (_, i) => [-1.55 + i * 3.1 / 12, 2.17 - Math.sin(i / 12 * PI) * 0.18, -0.3]), 0.15).map((p) => [p[0], p[1], p[2], Math.random(), WARM[(Math.random() * 4) | 0]]);
  const led = ledPoints(c, o, pts, { size: 0.08, gain: 2.4 }); led.material.uniforms.uOn.value = 2; r.dress.leds.push(led);
  const sg = c.sign('FRESH TREES\nN3W YORKERS · ASK INSIDE', { w: 1.5, h: 0.6, bg: '#efe4c8', fg: '#7a1a1a', font: c.SERIF, weight: 900, px: 128, pad: 0.1 }); sg.position.set(0, 2.55, -0.3); o.add(sg);
  c.clickable(sg, () => c.egg('trees', 'Every December the sidewalk sellers arrive with trucks of firs and live beside them for a month. The tree is for you. The sign is the whole business plan.'), 'A tree seller');
  const barrel = new THREE.Group(); barrel.position.set(1.9, 0, 0.4); o.add(barrel); c.glb('ph_barrel_stove', { h: 0.9, parent: barrel });
  flameSprite(c, barrel, 0, 1.0, 0, 0.45).visible = true; steam(c, o, 1.9, 1.3, 0.4, 0.6);
}
// giant clearcoat ornaments set down on the street, and wreaths with bows on the lamp posts
const ORN = {};
function ornaments(c, r, g, X, spots) {
  const { THREE } = c, cols = [0xb4161e, 0xd8a640, 0x2962ff, 0xe8e8ee, 0x1f6a3a];
  spots.forEach(([x, z, s = 0.5], i) => { const m = new THREE.MeshPhysicalMaterial({ color: cols[i % cols.length], metalness: 0.85, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.6 });
    const b = new THREE.Mesh(new THREE.SphereGeometry(s, 40, 24), m); b.position.set(x, s * 0.98, z); g.add(b);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.18, s * 0.2, s * 0.22, 20), std(c, 0xc8a040, { metalness: 1, roughness: 0.25 })); cap.position.set(x, s * 1.98, z); g.add(cap); c.post(X(x), z, s + 0.1); });
}
function wreath(c, g, x, y, z, ry = 0, s = 0.42) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, y, z); o.rotation.y = ry; g.add(o);
  const nm = ORN.n ||= new THREE.MeshStandardMaterial({ color: 0x1d4a2a, roughness: 0.9 });
  const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(s * 0.17, 0), nm, 46), m4 = new THREE.Matrix4();
  for (let i = 0; i < 46; i++) { const a = i / 46 * PI * 2, rr = s * (0.82 + Math.random() * 0.12); m4.makeTranslation(Math.cos(a) * rr, Math.sin(a) * rr, (Math.random() - 0.5) * s * 0.2); im.setMatrixAt(i, m4); } o.add(im);
  const bow = new THREE.Mesh(new THREE.TorusGeometry(s * 0.16, s * 0.06, 8, 16), ORN.b ||= std(c, 0xb4161e, { roughness: 0.45 })); bow.position.set(0, -s * 0.85, 0.05); bow.scale.set(1.6, 1, 1); o.add(bow);
}
// ILLUSION: a picture painted flat across the paving that stands up as an eye flower from one spot only (surface anamorphosis:
// the floor samples the image through a virtual camera at the sweet spot, so from there it lines up into a figure in the air)
function anamorphFlower(c, r, g, X, eye, aim, area, line) {
  const { THREE } = c, cam = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  cam.position.set(X(eye[0]), eye[1], eye[2]); cam.lookAt(X(aim[0]), aim[1], aim[2]); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const VP = new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
  const tex = c.canvasTex(1024, 1024, (q, w, h) => { q.clearRect(0, 0, w, h); eyeFlower(q, w / 2, h / 2, w / 2 * 0.96); });
  const m = new THREE.ShaderMaterial({ uniforms: { uVP: { value: VP }, uMap: { value: tex }, uT: { value: 0 }, uNear: { value: 0 } }, transparent: true, depthWrite: false, toneMapped: false,
    polygonOffset: true, polygonOffsetFactor: -8,
    vertexShader: 'uniform mat4 uVP; varying vec4 vC; void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vC = uVP * wp; gl_Position = projectionMatrix * viewMatrix * wp; }',
    fragmentShader: 'uniform sampler2D uMap; uniform float uT, uNear; varying vec4 vC; void main(){ vec2 uv = vC.xy / vC.w * .5 + .5; if (vC.w < 0. || uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) discard; vec4 t = texture2D(uMap, uv); if (t.a < .02) discard; gl_FragColor = vec4(t.rgb * (0.9 + 0.1 * sin(uT * 2.)), t.a * 0.92 * uNear * uNear); }' });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(area[2], area[3]).rotateX(-PI / 2), m); p.position.set(area[0], 0.02, area[1]); p.renderOrder = 3; g.add(p);
  const mark = c.sign('LOOK FROM HERE', { w: 0.9, h: 0.22, bg: '#2962ff', fg: '#ffffff', font: c.MONO, weight: 700 }); mark.rotation.x = -PI / 2; mark.position.set(eye[0], 0.025, eye[2] + 0.35); g.add(mark);
  let got = false; const f = new THREE.Vector3(), d = new THREE.Vector3();
  c.tick((t, dt, P, ri) => { m.uniforms.uT.value = t; m.uniforms.uNear.value = Math.max(0, 1 - Math.hypot(P.x - X(eye[0]), P.z - eye[2]) / 3); if (got || ri !== r.i) return; if (Math.hypot(P.x - X(eye[0]), P.z - eye[2]) > 0.45) return;
    c.camera.getWorldDirection(f); d.set(X(aim[0]) - c.camera.position.x, aim[1] - c.camera.position.y, aim[2] - c.camera.position.z).normalize(); if (f.dot(d) > 0.96) { got = true; c.egg('anamorph', line); } });
}
// ILLUSION: a snow globe on a plinth. Real glass (transmission), a tiny tree and menorah inside; click and the snow goes up
function snowGlobe(c, r, g, X, x, z) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, 0, z); g.add(o); c.post(X(x), z, 0.75);
  o.add(new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, 0.95, 40), std(c, 0x2a1c14, { roughness: 0.4 })).translateY(0.475));
  o.add(new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.07, 40), std(c, 0xc8a040, { metalness: 1, roughness: 0.25 })).translateY(0.95));
  const R = 0.62, cy = 0.98 + R * 0.92;
  const inner = new THREE.Group(); inner.position.y = 0.99; o.add(inner);
  inner.add(new THREE.Mesh(new THREE.CylinderGeometry(R * 0.86, R * 0.86, 0.06, 40), std(c, 0xf2f4f8, { roughness: 0.9 })));
  const tree = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.62, 18), std(c, 0x1d4a2a, { roughness: 0.8 })); tree.position.set(-0.16, 0.34, 0); inner.add(tree);
  const tp = []; for (let i = 0; i < 70; i++) { const u = i / 70, a = u * 6 * PI * 2; tp.push([-0.16 + Math.cos(a) * (1 - u) * 0.17, 0.06 + u * 0.6, Math.sin(a) * (1 - u) * 0.17, Math.random(), WARM_BLUE[(Math.random() * 7) | 0]]); }
  const tl = ledPoints(c, inner, tp, { size: 0.02, gain: 2.6 }); tl.material.uniforms.uOn.value = 2;
  const gold = std(c, 0xd8a640, { metalness: 1, roughness: 0.25 }); const men = new THREE.Group(); men.position.set(0.2, 0.04, 0.05); inner.add(men);
  men.add(c.slab(0.02, 0.24, 0.02, gold, 0, 0.12, 0)); for (let i = -4; i <= 4; i++) { if (!i) continue; const h = 0.07 + Math.abs(i) * 0.012; men.add(c.slab(0.012, h, 0.012, gold, i * 0.024, 0.2 - h / 2 + 0.02, 0)); }
  const fl = ledPoints(c, men, [...Array(9)].map((_, i) => [(i - 4) * 0.024, i === 4 ? 0.27 : 0.235, 0, Math.random(), [1, 0.62, 0.22]]), { size: 0.018, gain: 3 }); fl.material.uniforms.uOn.value = 2;
  const N = 260, pos = new Float32Array(N * 3), vel = new Float32Array(N * 3);
  const reset = (i, up) => { const a = Math.random() * 6.283, rr = Math.random() * R * 0.8, y = up ? Math.random() * R * 1.4 : 0.05; pos.set([Math.cos(a) * rr, y, Math.sin(a) * rr], i * 3); };
  for (let i = 0; i < N; i++) reset(i, true);
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const sn = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.012, transparent: true, opacity: 0.9, depthWrite: false })); inner.add(sn);
  let shake = 0; c.tick((t, dt, P, ri) => { if (Math.abs(ri - r.i) > 0) return; shake = Math.max(0, shake - dt * 0.25);
    for (let i = 0; i < N; i++) { const k = i * 3; if (shake > 0.3) { vel[k] += (Math.random() - 0.5) * dt * 4 * shake; vel[k + 1] += (Math.random() - 0.35) * dt * 6 * shake; vel[k + 2] += (Math.random() - 0.5) * dt * 4 * shake; }
      vel[k] *= 0.96; vel[k + 1] = vel[k + 1] * 0.96 - dt * 0.04; vel[k + 2] *= 0.96; pos[k] += vel[k] * dt; pos[k + 1] += vel[k + 1] * dt - dt * 0.05; pos[k + 2] += vel[k + 2] * dt;
      const rr = Math.hypot(pos[k], pos[k + 1] - R * 0.92, pos[k + 2]); if (rr > R * 0.94 || pos[k + 1] < 0.04) { if (pos[k + 1] < 0.04) { pos[k + 1] = 0.04; vel[k + 1] = 0; } else { pos[k] *= 0.93; pos[k + 1] = R * 0.92 + (pos[k + 1] - R * 0.92) * 0.93; pos[k + 2] *= 0.93; } } }
    sg.attributes.position.needsUpdate = true; });
  const glass = new THREE.Mesh(new THREE.SphereGeometry(R, 56, 36), new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.02, transmission: 1, thickness: 0.35, ior: 1.32, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.4, transparent: true }));
  glass.position.y = cy; o.add(glass);
  const plq = c.sign('SHAKE', { w: 0.5, h: 0.14, bg: '#c8a040', fg: '#1a1208', font: c.SERIF, weight: 900 }); plq.position.set(0, 0.6, 0.73); o.add(plq);
  const go = () => { shake = 1.6; r.replay = 0; for (let i = 0; i < N; i++) { vel[i * 3 + 1] = Math.random() * 1.2; } snd(c, 'whoosh', 0.4, 1); c.egg('globe', 'The whole plaza in a glass ball: the tree, a menorah, the snow you just stirred up. Seventy floors up, the city is a souvenir of itself.'); };
  c.clickable(glass, go, 'A snow globe'); c.clickable(plq, go, 'A snow globe');
  // the real glass needs to see the room behind it; without a background the transmission pass reads black, so keep it lit
  return o;
}

// a lit wire reindeer: the Tripo deer becomes a faint white wireframe, and warm bulbs are sampled across its surface
function litReindeer(c, r, g, X, x, z, ry = 0, h = 1.9) {
  const { THREE } = c; c.post(X(x), z, 0.7);
  const m = c.glb('lt_reindeer', { h, x, z, ry, parent: g, shadow: true, onload: (grp, sc) => {
    const pts = [], v = new THREE.Vector3(); grp.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(grp.matrixWorld).invert();
    sc.traverse((o) => { if (!o.isMesh) return; o.material = new THREE.MeshBasicMaterial({ color: 0xf4f0e6, wireframe: true, transparent: true, opacity: 0.22, depthWrite: false });
      const smp = new MeshSurfaceSampler(o).build(); for (let i = 0; i < 1400; i++) { smp.sample(v); v.applyMatrix4(o.matrixWorld).applyMatrix4(inv); pts.push([v.x, v.y, v.z, Math.random(), WARM[(Math.random() * 4) | 0]]); } });
    const led = ledPoints(c, grp, pts, { size: 0.045, gain: 2.2 }); led.material.uniforms.uOn.value = 2; r.dress.leds.push(led); } });
  c.clickable(m, () => c.egg('reindeer', 'A wire reindeer wrapped in fourteen hundred bulbs. On this block they come in herds, and the herds compete.'), 'A wire reindeer');
  let ph = Math.random() * 6; c.tick((t) => { m.rotation.y = ry + Math.sin(t * 0.4 + ph) * 0.05; });
  return m;
}

// the gelt hunt: one foil coin hidden in every room, stamped with an eye flower; all nine is an egg
const GELT = { got: new Set() };
function gelt(c, r, g, x, y, z) {
  const { THREE } = c, face = c.canvasTex(128, 128, (q, w, h) => { const gr = q.createRadialGradient(w * 0.4, h * 0.35, 4, w / 2, h / 2, w / 2); gr.addColorStop(0, '#fff3b0'); gr.addColorStop(0.6, '#d8a640'); gr.addColorStop(1, '#8a6420'); q.fillStyle = gr; q.beginPath(); q.arc(w / 2, h / 2, w / 2, 0, 7); q.fill(); eyeFlower(q, w / 2, h / 2, w * 0.3); });
  const m = new THREE.MeshStandardMaterial({ map: face, metalness: 0.9, roughness: 0.25, emissive: 0x332200, emissiveMap: face });
  const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.012, 32), [new THREE.MeshStandardMaterial({ color: 0xc8a040, metalness: 1, roughness: 0.3 }), m, m]);
  coin.rotation.x = PI / 2; const o = new THREE.Group(); o.position.set(x, y, z); o.add(coin); g.add(o);
  const glint = new THREE.Sprite(new THREE.SpriteMaterial({ map: POOL.glow ||= glowTex(c, 'rgba(255,200,130,.95)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 })); glint.scale.set(0.3, 0.3, 1); o.add(glint);
  c.tick((t) => { o.rotation.y = t * 1.6; o.position.y = y + Math.sin(t * 2) * 0.015; glint.material.opacity = Math.max(0, Math.sin(t * 1.3 + x) ** 16) * 0.9; });
  c.clickable(coin, () => { if (GELT.got.has(r.id)) return; GELT.got.add(r.id); o.visible = false; snd(c, 'clink', 3200); c.toast(`Chocolate gelt, ${GELT.got.size} of 9.`, 2200);
    if (GELT.got.size === 9) c.egg('gelt', 'All nine pieces of gelt: one in every room. Coins at Chanukah are an old custom; the chocolate kind is the delicious modern one. The foil is the best part, and you know it.'); }, 'Something shiny');
}

// ---------- v3 motion ----------
// The Impermanent Vision show: one building's upper storeys become MLow's living surface. Contour rivers in world space bend
// toward the windows (the thresholds), paint drips fall from the sills, and one sovereign Open Eye Flower opens over the
// street and blinks. A projector on the pavement switches the intensity: Whisper, Bloom, Melt; it also runs by itself.
const IV_MODE = ['OFF', 'WHISPER', 'BLOOM', 'MELT'];
function ivShow(c, r, g, X, { side = -1, z0 = -8, z1 = 1.9, y0 = 5.05, y1 = 9.9, proj } = {}) {
  const { THREE } = c, x = side < 0 ? 0.32 : W - 0.57, L = z1 - z0, Hh = y1 - y0;
  const flower = c.canvasTex(512, 512, (q, w, h) => { q.clearRect(0, 0, w, h); eyeFlower(q, w / 2, h / 2, w / 2 * 0.95); });
  const U = { uT: { value: 0 }, uAmt: { value: 0 }, uMode: { value: 0 }, uOpen: { value: 0 }, uFlower: { value: flower }, uAsp: { value: L / Hh } };
  const m = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform float uT, uAmt, uMode, uOpen, uAsp; uniform sampler2D uFlower; varying vec2 vUv;
      float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + 1.), f.x), f.y); }
      float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++) { s += a * n2(p); p *= 2.03; a *= .5; } return s; }
      void main(){
        vec2 p = vec2(vUv.x * uAsp, vUv.y) * 3.;
        // the windows are the attractors: the field crowds and bends toward each one, as paint pouring out of a threshold
        float att = 0.; for (int i = 0; i < 6; i++) { vec2 w = vec2((float(i) + .5) / 6. * uAsp * 3., (mod(float(i), 2.) < .5 ? .25 : .72) * 3.); att += exp(-length(p - w) / .55); }
        float field = fbm(p * .8 + vec2(0., uT * .05 * uMode)) * 3. + att * 1.3 + uT * .04 * uMode;
        float k = 6. + uMode * 2.; float ln = abs(fract(field * k) - .5); float heavy = mod(floor(field * k), 5.) < .5 ? 1.5 : .8;
        float line = smoothstep(.025, .0, ln - .47) * heavy;
        vec3 cob = vec3(.16, .38, 1.), cy = vec3(0., .9, 1.), pk = vec3(1., .18, .39), vi = vec3(.44, .14, .66);
        vec3 col = mix(cob, cy, smoothstep(.3, .9, fbm(p * .5 + 7.))) * line;
        col += pk * line * smoothstep(.72, .95, fbm(p * .35 + uT * .03)) * step(1.5, uMode);
        // drips from the sills: thin vertical runs that grow down in Bloom and Melt
        float dx = floor(vUv.x * 46.); float rnd = h21(vec2(dx, 3.)); float len = fract(rnd * 7. + uT * .03 * (.5 + rnd)) * (.2 + .3 * uMode);
        float top = rnd > .55 ? .72 : .25; float drip = step(abs(fract(vUv.x * 46.) - .5), .07) * step(top - len, vUv.y) * step(vUv.y, top) * step(1.5, uMode);
        col += mix(cob, pk, rnd) * drip * .9;
        // the sovereign Eye Flower, over the middle of the building, opening with uOpen (Melt), blinking now and then
        vec2 fc = (vUv - vec2(.5, .55)) * vec2(uAsp, 1.) / max(.01, .42 * uOpen); float blink = smoothstep(.0, .06, abs(fract(uT * .11) - .5) - .44);
        if (abs(fc.x) < .5 && abs(fc.y) < .5 && uOpen > .01) { vec4 f = texture2D(uFlower, fc + .5); col = mix(col, f.rgb * 1.9, f.a * uOpen * (fc.y > -.08 && fc.y < .08 ? blink : 1.)); }
        float edge = smoothstep(0., .04, vUv.x) * smoothstep(1., .96, vUv.x) * smoothstep(0., .05, vUv.y) * smoothstep(1., .95, vUv.y);
        gl_FragColor = vec4(col * uAmt * edge * .3, 1.); }` });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(L, Hh), m); p.position.set(x, (y0 + y1) / 2, (z0 + z1) / 2); p.rotation.y = side < 0 ? PI / 2 : -PI / 2; p.renderOrder = 4; g.add(p);
  let mode = 0, want = 0, auto = 18 + Math.random() * 20, autoT = 0;
  const set = (k) => { mode = k; want = [0, 0.55, 1, 1.25][k]; U.uMode.value = k; c.toast(`IMPERMANENT VISION · ${IV_MODE[k]}`, 1800); snd(c, 'whoosh', 0.3 + k * 0.2, 1); if (k === 3) c.egg('melt', 'MELT: the building gives up being a building for a moment. Contour rivers pour out of every window toward the one eye that is watching the street. Impermanent Vision, by MLow.'); };
  if (proj) { const pr = prop(c, r, g, X, 'ph_filmstrip_projector_8mm', proj[0], proj[1], { h: 0.5, y: proj[2] || 0, ry: proj[3] || 0, r: 0.3 });
    c.clickable(pr, () => { auto = 9999; set((mode + 1) % 4); }, 'A projector'); }
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; U.uT.value = t;
    if (auto < 9999) { auto -= dt; if (auto <= 0 && mode === 0) { set(2); autoT = 14; auto = 40 + Math.random() * 20; } if (autoT > 0) { autoT -= dt; if (autoT <= 0) set(0); } }
    U.uAmt.value += (want * (r.dress ? Math.min(1, r.dress.level + 0.3) : 1) - U.uAmt.value) * Math.min(1, dt * 1.5);
    U.uOpen.value += ((mode >= 2 ? (mode === 3 ? 1 : 0.55) : 0) - U.uOpen.value) * Math.min(1, dt * 0.8); });
}
// the lights keep time with the radio: canopies and outlines swell on every beat of whatever station is on
function beatLights(c, r) {
  c.tick((t, dt, P, ri) => { if (ri !== r.i || !r.dress) return; const st = c.music.style || '', on = st.startsWith('r_') || st === r.music;
    const b = c.music.beat || 0.5, ph = (t % b) / b, pulse = on ? 0.95 + 0.1 * Math.pow(1 - ph, 6) : 1;   // Astra: decorative pulse about 10% around rest; fill and navigation never pulse
    r.dress.leds.forEach((o) => { const u = o.material.uniforms; if (u.uGainBase === undefined) u.uGainBase = u.uGain.value; u.uGain.value = u.uGainBase * pulse; }); });
}
// a lit sleigh and two wire reindeer flying a loop over Dyker Heights, bells on the way past
function flyingSleigh(c, r, g, X) {
  const { THREE } = c, o = new THREE.Group(); g.add(o);
  const sl = new THREE.Group(); o.add(sl); o.scale.setScalar(1.5); const red = std(c, 0x8a1010, { roughness: 0.4, metalness: 0.3 }), gold = std(c, 0xd8a640, { metalness: 1, roughness: 0.3 });
  sl.add(c.slab(1.2, 0.5, 0.7, red, 0, 0.45, 0)); sl.add(c.slab(0.3, 0.7, 0.7, red, -0.55, 0.65, 0)); for (const s of [-0.32, 0.32]) sl.add(c.slab(1.6, 0.05, 0.05, gold, 0.1, 0.12, s));
  const pts = []; for (let i = 0; i < 60; i++) { const a = i / 60; pts.push([-0.6 + a * 1.2, 0.72, (i % 2 ? 0.36 : -0.36), Math.random(), WARM[(i * 3) % 4]]); }
  const led = ledPoints(c, sl, pts, { size: 0.06, gain: 2.6 }); led.material.uniforms.uOn.value = 2;
  [1.6, 2.9].forEach((dx, i) => { const d = c.glb('lt_reindeer', { h: 1.3, x: dx, z: 0, ry: PI / 2, parent: o, shadow: false, onload: (grp, sc) => { const v = new THREE.Vector3(), q = [], inv = new THREE.Matrix4().copy(grp.matrixWorld).invert(); grp.updateMatrixWorld(true);
      sc.traverse((mm) => { if (!mm.isMesh) return; mm.material = new THREE.MeshBasicMaterial({ color: 0xf4f0e6, wireframe: true, transparent: true, opacity: 0.2, depthWrite: false }); const smp = new MeshSurfaceSampler(mm).build(); for (let k = 0; k < 700; k++) { smp.sample(v); v.applyMatrix4(mm.matrixWorld).applyMatrix4(inv); q.push([v.x, v.y, v.z, Math.random(), WARM[(k * 7) % 4]]); } });
      const l2 = ledPoints(c, grp, q, { size: 0.04, gain: 2.2 }); l2.material.uniforms.uOn.value = 2; } }); });
  let rang = false; c.tick((t, dt, P, ri) => { if (Math.abs(ri - r.i) > 0) { o.visible = false; return; } o.visible = true;
    const a = t * 0.1, x = W / 2 + Math.cos(a) * 11, z = -8 + Math.sin(a) * 7, y = 7.6 + Math.sin(a * 2) * 0.6;
    o.position.set(x, y, z); o.rotation.y = -a + PI; o.rotation.z = Math.sin(a * 2) * 0.08;
    const near = Math.hypot(x - c.camera.position.x, z - c.camera.position.z) < 9; if (near && !rang) { rang = true; snd(c, 'ding'); } if (!near) rang = false; });
  const hit = new THREE.Mesh(new THREE.BoxGeometry(5, 2, 2), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(1.4, 0.6, 0); o.add(hit);
  c.clickable(hit, () => c.egg('sleigh', 'A sleigh over Dyker Heights, pulled by two reindeer made of bulbs. On this block, even the sky has entered the competition.'), 'A flying sleigh');
}
// the south wall, behind you as you walk in, carries one of MLow's Impermanent Vision murals painted on the stone (generated
// in his language from the skill's references; edges feathered into the wall, lit faintly as street paint is)
const MURAL = { fifth: 'mural_city', channel: 'mural_city', rink: 'mural_city', tree: 'mural_city', menorah: 'mural_city', market: 'mural_brooklyn', brooklyn: 'mural_brooklyn', dyker: 'mural_brooklyn' };
function southMural(c, r, g) {
  const id = MURAL[r.id]; if (!id || !(window.WALLS || []).includes(id)) return;
  const { THREE } = c, t = c.tex.load(`assets/walls/${id}.jpg`); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const fade = c.canvasTex(256, 128, (q, w, h) => { const gx = q.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, '#000'); gx.addColorStop(0.05, '#fff'); gx.addColorStop(0.95, '#fff'); gx.addColorStop(1, '#000'); q.fillStyle = gx; q.fillRect(0, 0, w, h);
    q.globalCompositeOperation = 'multiply'; const gy = q.createLinearGradient(0, 0, 0, h); gy.addColorStop(0, '#000'); gy.addColorStop(0.08, '#fff'); gy.addColorStop(0.92, '#fff'); gy.addColorStop(1, '#000'); q.fillStyle = gy; q.fillRect(0, 0, w, h); });
  const m = new THREE.MeshStandardMaterial({ map: t, alphaMap: fade, transparent: true, roughness: 0.8, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.28 }); m.userData.e0 = 0.28; r.dress.mats.push(m);
  const w = W - 3.0, h = w / 2, p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(W / 2 - 0.12, 0.7 + h / 2, D / 2 - 0.02); p.rotation.y = PI; g.add(p);
  c.clickable(p, () => c.egg('mural', 'A mural by MLow on the wall behind you: the tree and the menorah through one threshold, contour rivers pouring out into the street, one eye watching. Impermanent Vision.'), 'A mural');
}

// seventy floors up: above the parapet the side walls show the city (the deck's own skyline, cropped from its edges), so the
// terrace reads as high and open instead of a courtyard between two slabs (Astra round three)
function deckViews(c, r, g) {
  const { THREE } = c, t = c.tex.load('assets/plates/top.jpg'); t.colorSpace = THREE.SRGBColorSpace;
  [[0.13, PI / 2, 0], [W - 0.38, -PI / 2, 0.62]].forEach(([x, ry, off]) => { const tt = t.clone(); tt.repeat.set(0.38, 0.62); tt.offset.set(off, 0.12); tt.needsUpdate = true;
    const m = new THREE.MeshBasicMaterial({ map: tt, fog: false, toneMapped: true }); m.color.setScalar(0.85);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(D, 2.9), m); p.position.set(x, 1.15 + 1.45, 0); p.rotation.y = ry; g.add(p);
    g.add(c.slab(0.3, 0.12, D, std(c, 0x8a8478, { roughness: 0.7 }), x + (ry > 0 ? 0.05 : -0.05), 1.15, 0)); });
}
// ---------- v3 architecture (2026-11-15, MLow: "the architecture should be built in a way that makes more sense") ----------
// The v2 facades were photographs pasted on the walls: their windows could never line up with anything, and they had no depth.
// v3 builds the street as buildings: a granite plinth, pilasters, recessed shop windows in bronze frames, lit fascia signs,
// striped awnings and blade signs that stand out into the street, a profiled cornice with dentils, and two upper floors of
// recessed windows with sills, lintels and (in Brooklyn) fire escapes. Every window, shop or flat, is one quad of a single
// merged mesh per room whose shader ray traces a room behind the glass (interior mapping) from an atlas of generated
// interiors (work/v2/grid_*.jpg): back wall, side walls, floor and ceiling, with parallax as you walk, glass fresnel,
// curtains, and a lit level the blackout can take down. Geometry is merged per material: a handful of draw calls a room.
const ARCH = {
  fifth:    { style: 'stone', shops: [0, 1, 6, 4], signs: ['N3W YORKERS', 'MLow', 'BLOOM & EYE', 'NAZAR & SON'], awn: ['#7a1a1a', '#0d1b4a'] },
  channel:  { style: 'stone', shops: [2, 1, 6, 0], signs: ['THE GARDEN SHOP', 'N3W YORKERS', 'EYE CRUNCH', 'MLow'], awn: ['#0d3a24', '#6a1a1a'] },
  rink:     { style: 'stone', shops: [5, 3, 4, 2], signs: ['RINK CAFE', 'SKATES', 'N3W YORKERS', 'MLow'], awn: ['#0d1b4a', '#7a1a1a'] },
  tree:     { style: 'stone', shops: [0, 2, 3, 1], signs: ['N3W YORKERS', 'MLow', 'THE PLAZA SHOP', 'TALLY CHIPS'], awn: ['#7a1a1a', '#0d3a24'] },
  menorah:  { style: 'stone', shops: [4, 6, 1, 5], signs: ['BLUE & WHITE BAKERY', 'N3W YORKERS', 'MLow', 'NAZAR COLA'], awn: ['#0d1b4a', '#e8e4da'] },
  market:   { style: 'brick', shops: [6, 5, 4, 7], signs: ['N3W YORKERS', 'UNION SQUARE CAFE OF EYES', 'MLow', 'THE GREENMARKET'], awn: ['#0d3a24', '#7a1a1a'] },
  brooklyn: { style: 'brick', shops: [4, 7, 5, 3], signs: ['BLOOM BAKERY', 'GRAND ARMY TOYS', 'N3W YORKERS', 'MLow'], awn: ['#0d1b4a', '#e8e4da'], escapes: true },
  dyker:    { style: 'brick', resi: true, shops: [3, 2, 6, 5], signs: ['N3W YORKERS', 'MLow', 'THE BLOCK', 'EYE CRUNCH'], awn: ['#7a1a1a', '#0d3a24'], escapes: true, outline: true },
};
const IMAT = {};
function interiorMat(c) {
  const { THREE } = c;
  if (IMAT.m) return IMAT.m;
  const atlas = c.tex.load('assets/arch/interiors.jpg'); atlas.colorSpace = THREE.SRGBColorSpace; atlas.anisotropy = 8;
  const m = new THREE.ShaderMaterial({ uniforms: { uAtlas: { value: atlas }, uLevel: { value: 1 }, uTime: { value: 0 } }, toneMapped: true,
    vertexShader: `attribute vec3 aC, aN; attribute vec2 aS; attribute vec4 aK; varying vec3 vW, vC, vN; varying vec2 vS; varying vec4 vK;
      void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vC = (modelMatrix * vec4(aC, 1.)).xyz; vN = normalize(mat3(modelMatrix) * aN); vS = aS; vK = aK; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform sampler2D uAtlas; uniform float uLevel, uTime; varying vec3 vW, vC, vN; varying vec2 vS; varying vec4 vK;
      // vK: x = atlas cell, y = lit (0 dark .. 1 bright), z = curtains, w = room depth in metres
      vec3 cellTex(vec2 uv){ float cx = mod(vK.x, 4.), cy = floor(vK.x / 4.); uv = clamp(uv, 0., 1.) * 0.88 + 0.06; return texture2D(uAtlas, vec2((cx + uv.x) / 4., (3. - cy + uv.y) / 4.)).rgb; }
      void main(){
        vec3 U = vec3(0., 1., 0.), T = normalize(cross(U, vN)), p = vW - vC, cam = cameraPosition - vC;
        vec3 P = vec3(dot(p, T), p.y, dot(p, vN)), Cm = vec3(dot(cam, T), cam.y, dot(cam, vN)), d = normalize(P - Cm);
        float w = vS.x * .5, h = vS.y * .5, dep = vK.w;
        float tb = (-dep - P.z) / min(d.z, -1e-4);
        float tx = ((d.x > 0. ? w : -w) - P.x) / (abs(d.x) < 1e-4 ? 1e-4 : d.x);
        float ty = ((d.y > 0. ? h : -h) - P.y) / (abs(d.y) < 1e-4 ? 1e-4 : d.y);
        float t = min(tb, min(tx, ty)); vec3 H = P + d * t; float z01 = clamp(-H.z / dep, 0., 1.);
        vec3 col; float shade;
        if (t == tb) { col = cellTex(vec2(H.x / vS.x + .5, H.y / vS.y + .5)); shade = 1.; }
        else if (t == tx) { col = cellTex(vec2(d.x > 0. ? 1. - z01 * .1 : z01 * .1, H.y / vS.y + .5)); shade = .62 - z01 * .1; }
        else { col = cellTex(vec2(H.x / vS.x + .5, d.y > 0. ? .62 - z01 * .12 : .3 + z01 * .12)); shade = d.y > 0. ? .72 : .8; }   // ceilings and floors from the lit middle of the room, not its dark edge
        vec2 uv = vec2(P.x / vS.x + .5, P.y / vS.y + .5);
        if (vK.z > .5) { float cu = smoothstep(.2, .14, uv.x) + smoothstep(.8, .86, uv.x); col = mix(col, vec3(.55, .28, .15) * (0.6 + 0.4 * sin(uv.y * 90.)), cu * .85); }
        // MLow's Impermanent Vision displays (cells 0 to 2) breathe: contour rivers drift across the back wall, every fifth line heavier
        if (vK.x < 2.5 && t == tb) { vec2 q = vec2(H.x / vS.x, H.y / vS.y) * 3.2; float f = sin(q.x * 1.7 + sin(q.y * 1.3 + uTime * .35) * 1.6) + sin(q.y * 2.1 - uTime * .22 + sin(q.x * .9) * 1.4);
          float ln = fract(f * 2.2 + uTime * .08); float line = smoothstep(.035, .0, abs(ln - .5) - .45) * (mod(floor(f * 2.2 + uTime * .08), 5.) < .5 ? 1.6 : .7);
          col += vec3(.16, .38, 1.) * line * .32 + vec3(0., .9, 1.) * line * .1; }
        float lit = vK.y * uLevel;
        vec3 inside = col * shade * (0.05 + (vK.x < 2.5 ? 0.82 : 1.05) * lit);
        // glass: a cool sky fresnel and a soft streak, stronger when the room is dark
        float fr = pow(1. - abs(d.z), 3.) * .55 + .06;
        vec3 sky = vec3(.05, .08, .15) + vec3(.25, .22, .18) * smoothstep(.97, 1., sin(uv.x * 3. + uv.y * 7. + 1.3));
        vec3 outc = mix(inside, sky, fr * (1. - lit * .55));
        // the frame's shadow inside the reveal
        float edge = smoothstep(0., .05, uv.x) * smoothstep(1., .95, uv.x) * smoothstep(0., .05, uv.y) * smoothstep(1., .95, uv.y);
        gl_FragColor = vec4(outc * (.55 + .45 * edge), 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` });
  return (IMAT.m = m);
}
// a facade builder: boxes collected per material in world space (UVs metric, like slab), merged once; window quads collected
// with their interior attributes, merged once
function Builder(c) {
  const { THREE } = c, B = { boxes: {}, mats: {}, win: [] };
  B.mat = (k, m) => { B.mats[k] = m; B.boxes[k] = B.boxes[k] || []; };
  // a box in facade space: O origin on the wall, T along the wall, N out into the room; u along T, y up, n along N
  B.box = (F, k, u, y, n, w, h, d, rep = 2) => {
    const alongZ = Math.abs(F.T.z) > 0.5, g = new THREE.BoxGeometry(alongZ ? d : w, h, alongZ ? w : d);
    const uv = g.attributes.uv, nr = g.attributes.normal;
    for (let i = 0; i < uv.count; i++) { const ax = Math.abs(nr.getX(i)), ay = Math.abs(nr.getY(i)); const sx = alongZ ? d : w, sz = alongZ ? w : d;
      const [a, b] = ax > 0.5 ? [sz, h] : ay > 0.5 ? [sx, sz] : [sx, h]; uv.setXY(i, uv.getX(i) * a / rep, uv.getY(i) * b / rep); }
    const x = F.O.x + F.T.x * u + F.N.x * n, z = F.O.z + F.T.z * u + F.N.z * n; g.translate(x, y, z); B.boxes[k].push(g); return g;
  };
  // a window quad: centre at (u, y), on the plane n, width w, height h; cell, lit, curtains, depth
  B.window = (F, u, y, n, w, h, cell, lit, cur, dep) => { const cx = F.O.x + F.T.x * u + F.N.x * n, cz = F.O.z + F.T.z * u + F.N.z * n;
    const U = new THREE.Vector3(0, 1, 0), N = F.N.clone(), Tn = new THREE.Vector3().crossVectors(U, N).normalize();
    const pts = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([a, b]) => [cx + Tn.x * a, y + b, cz + Tn.z * a]);
    B.win.push({ pts, c: [cx, y, cz], n: [N.x, N.y, N.z], s: [w, h], k: [cell, lit, cur, dep] }); };
  B.finish = (parent) => {
    const out = [];
    for (const k in B.boxes) { if (!B.boxes[k].length) continue; const geo = mergeGeometries(B.boxes[k], false); const m = new THREE.Mesh(geo, B.mats[k]); parent.add(m); out.push(m); }
    if (B.win.length) { const n = B.win.length, pos = new Float32Array(n * 12), aC = new Float32Array(n * 12), aN = new Float32Array(n * 12), aS = new Float32Array(n * 8), aK = new Float32Array(n * 16), idx = [];
      B.win.forEach((q, i) => { q.pts.forEach((p, j) => { pos.set(p, (i * 4 + j) * 3); aC.set(q.c, (i * 4 + j) * 3); aN.set(q.n, (i * 4 + j) * 3); aS.set(q.s, (i * 4 + j) * 2); aK.set(q.k, (i * 4 + j) * 4); }); const b = i * 4; idx.push(b, b + 1, b + 2, b, b + 2, b + 3); });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aC', new THREE.BufferAttribute(aC, 3)); g.setAttribute('aN', new THREE.BufferAttribute(aN, 3));
      g.setAttribute('aS', new THREE.BufferAttribute(aS, 2)); g.setAttribute('aK', new THREE.BufferAttribute(aK, 4)); g.setIndex(idx); g.computeBoundingSphere();
      const m = new THREE.Mesh(g, interiorMat(c)); m.frustumCulled = false; parent.add(m); out.push(m); }
    return out;
  };
  return B;
}
const SIGNTEX = {};
function shopSign(c, text, bg, fg) {
  return SIGNTEX[text + bg] ||= c.canvasTex(1024, 160, (q, w, h) => { q.fillStyle = bg; q.fillRect(0, 0, w, h); q.strokeStyle = '#c8a040'; q.lineWidth = 6; q.strokeRect(10, 10, w - 20, h - 20);
    q.fillStyle = fg; q.textAlign = 'center'; q.textBaseline = 'middle'; q.font = `700 ${text.length > 14 ? 74 : 92}px Georgia, serif`; q.fillText(text, w / 2, h / 2 + 4);
    if (text === 'MLow' || text === 'N3W YORKERS') { eyeFlower(q, 90, h / 2, 54); eyeFlower(q, w - 90, h / 2, 54); } });
}
const AWN = {};
function awningTex(c, col) {
  return AWN[col] ||= c.canvasTex(256, 64, (q, w, h) => { for (let i = 0; i < 8; i++) { q.fillStyle = i % 2 ? '#efe8da' : col; q.fillRect(i * w / 8, 0, w / 8, h); } const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); });
}
function buildArch(c, r, g, X) {
  const cfg = ARCH[r.id]; if (!cfg || !r.outdoor || r.low || r.noArch) return false;
  const { THREE } = c, B = Builder(c), brick = cfg.style === 'brick';
  B.mat('wall', c.surf(brick ? (r.i % 2 ? 'acg_bricks097' : 'acg_bricks059') : 'acg_bricks066', brick ? 1.4 : 2.6, brick ? 0xb08878 : 0xd8cfc0));   // v4: ambientCG CC0 brick and stone
  B.mat('trim', c.surf('ashlar', 1.2, brick ? 0xc8bca8 : 0xd8cfbe));
  B.mat('plinth', c.surf('acg_granite005a', 1.2, 0x6a6670));
  B.mat('bronze', new THREE.MeshStandardMaterial({ color: 0x5a4220, metalness: 0.9, roughness: 0.32 }));
  B.mat('paint', new THREE.MeshStandardMaterial({ color: brick ? 0x14301f : 0x111827, roughness: 0.55, metalness: 0.1 }));
  B.mat('walk', c.surf('acg_pavingstones128', 2.2, 0xa8a49c)); B.mat('curb', c.surf('acg_granite005a', 0.8, 0x8a8890));
  B.mat('iron', new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.5, metalness: 0.7 }));
  const HT = 10, GF = 4.5, COR = 5.0, rng = ((s) => () => (s = (s * 16807) % 2147483647) / 2147483647)(r.i * 7919 + 13);
  const facades = [
    { O: new THREE.Vector3(0.12, 0, -D / 2), T: new THREE.Vector3(0, 0, 1), N: new THREE.Vector3(1, 0, 0), L: DZ1 + D / 2 - 0.1, shops: true, side: 'L' },
    { O: new THREE.Vector3(W - 0.37, 0, -D / 2), T: new THREE.Vector3(0, 0, 1), N: new THREE.Vector3(-1, 0, 0), L: DZ1 + D / 2 - 0.1, shops: true, side: 'R' },
    { O: new THREE.Vector3(0.12, 0, DZ2 + 0.1), T: new THREE.Vector3(0, 0, 1), N: new THREE.Vector3(1, 0, 0), L: D / 2 - DZ2 - 0.1, shops: false, side: 'L2' },
    { O: new THREE.Vector3(W - 0.37, 0, DZ2 + 0.1), T: new THREE.Vector3(0, 0, 1), N: new THREE.Vector3(-1, 0, 0), L: D / 2 - DZ2 - 0.1, shops: false, side: 'R2' },
  ];
  if (!r.openNorth) { const pw = (W - PORTAL.w) / 2;
    facades.push({ O: new THREE.Vector3(0, 0, -D / 2 + 0.01), T: new THREE.Vector3(1, 0, 0), N: new THREE.Vector3(0, 0, 1), L: pw, shops: true, side: 'NL', one: true });
    facades.push({ O: new THREE.Vector3(W - pw, 0, -D / 2 + 0.01), T: new THREE.Vector3(1, 0, 0), N: new THREE.Vector3(0, 0, 1), L: pw, shops: true, side: 'NR', one: true }); }
  let shopK = 0; const signs = [], awnings = [], blades = [], spots = [], swags = [], wreaths = [];
  for (const F of facades) {
    if (cfg.park && (F.side === 'L' || F.side === 'L2' || F.side === 'NL')) continue;   // the park edge, built below
    const L = F.L; if (L < 0.8) continue;
    // the face of the building, full height, and its plinth
    B.box(F, 'wall', L / 2, HT / 2, 0.03, L, HT, 0.06, brick ? 1.6 : 2.4);
    // v4 (Astra: "close the building shells"): north stubs get a full mass behind them (open ground); side faces sit on the
    // shared wall with the next room, so they get a parapet return and a roof edge only, never depth into the neighbour
    if (F.one) { B.box(F, 'wall', L / 2, HT / 2, -4.0, L, HT, 8.0, brick ? 1.6 : 2.4); B.box(F, 'trim', L / 2, HT + 0.12, -4.0, L + 0.1, 0.24, 8.1, 1.2); }
    else B.box(F, 'trim', L / 2, HT + 0.1, 0.0, L, 0.2, 0.3, 1.2);
    B.box(F, 'plinth', L / 2, 0.25, 0.32, L, 0.5, 0.64);
    // ground floor: pilasters and bays
    const P = 0.46, nb = F.one ? 1 : Math.max(1, Math.round((L - P) / 3.3)), bw = (L - P * (nb + 1)) / nb;
    for (let b = 0; b <= nb; b++) { const u = P / 2 + b * (bw + P); B.box(F, 'trim', u, GF / 2, 0.3, P, GF, 0.6, 1.2); B.box(F, 'trim', u, GF - 0.18, 0.36, P + 0.08, 0.36, 0.72, 1.2); }
    for (let b = 0; b < nb; b++) {
      const u0 = P + b * (bw + P), uc = u0 + bw / 2;
      if (!F.shops) { B.box(F, 'wall', uc, 2.2, 0.08, bw, 4.4, 0.16); continue; }
      if (cfg.resi && !F.one) { B.box(F, 'wall', uc, 0.6, 0.08, bw, 1.2, 0.16); B.box(F, 'trim', uc, 1.22, 0.18, bw * 0.8, 0.1, 0.36, 1.2); B.box(F, 'trim', uc, 3.35, 0.14, bw * 0.84, 0.24, 0.28, 1.2);
        B.box(F, 'wall', uc, 3.95, 0.08, bw, 1.0, 0.16); B.box(F, 'paint', uc, 2.25, 0.2, 0.06, 1.95, 0.05);
        B.window(F, uc, 2.25, 0.12, bw * 0.72, 1.95, 8 + Math.floor(rng() * 8), 0.65 + rng() * 0.45, rng() < 0.5 ? 1 : 0, 1.2);
        for (let k = 0; k <= 8; k++) B.box(F, 'iron', uc - bw / 2 + 0.1 + k * (bw - 0.2) / 8, 0.5, 1.05, 0.03, 1.0, 0.03, 1); B.box(F, 'iron', uc, 1.0, 1.05, bw - 0.1, 0.05, 0.05, 1);
        wreaths.push({ F, u: uc, y: 3.62 }); continue; }
      const cell = cfg.shops[shopK % cfg.shops.length], name = cfg.signs[shopK % cfg.signs.length], col = cfg.awn[shopK % cfg.awn.length]; shopK++;
      // kickplate, frame, mullion, glass with the shop behind it
      B.box(F, 'paint', uc, 0.38, 0.5, bw, 0.76, 0.2);
      B.box(F, 'bronze', uc, 0.8, 0.56, bw, 0.08, 0.16); B.box(F, 'bronze', uc, 3.5, 0.56, bw, 0.1, 0.16);
      B.box(F, 'bronze', u0 + 0.05, 2.15, 0.56, 0.1, 2.8, 0.16); B.box(F, 'bronze', u0 + bw - 0.05, 2.15, 0.56, 0.1, 2.8, 0.16);
      if (bw > 2.2) B.box(F, 'bronze', uc, 2.15, 0.58, 0.06, 2.7, 0.08);
      B.window(F, uc, 2.15, 0.5, bw - 0.1, 2.7, cell, 0.55 + rng() * 0.3, 0, 1.9);
      // the fascia sign over the window, lit by little lamps, and the transom
      B.box(F, 'paint', uc, 3.98, 0.52, bw, 0.62, 0.16);
      signs.push({ F, u: uc, y: 3.98, n: 0.615, w: bw - 0.24, h: 0.42, text: name, bg: col === '#e8e4da' ? '#0d1b4a' : '#0a0a0c', fg: '#f2e6c8' });
      for (const s of [-1, 1]) spots.push({ F, u: uc + s * bw * 0.3, y: 4.36, n: 0.85 });
      // an awning on every other shop, a blade sign on the pilaster beside the others
      if (shopK % 2 === 1 || F.one) awnings.push({ F, u: uc, w: bw + 0.1, col }); else blades.push({ F, u: u0 - P / 2, text: name });
      swags.push({ F, u0: u0, u1: u0 + bw });
    }
    // the cornice: a band, dentils, a crown
    B.box(F, 'trim', L / 2, GF + 0.1, 0.42, L, 0.2, 0.84, 1.2);
    for (let u = 0.12; u < L - 0.1; u += 0.26) B.box(F, 'trim', u, GF + 0.29, 0.5, 0.12, 0.16, 0.2, 0.5);
    B.box(F, 'trim', L / 2, GF + 0.46, 0.46, L, 0.18, 0.92, 1.2);
    // upper floors: recessed windows with sills, lintels, jambs; quoins at the ends
    const floors = [[COR + 1.2, 1.75], [COR + 3.75, 1.75]], nw = Math.max(1, Math.floor(L / 1.7)), sp = L / nw;
    for (const [yc, wh] of floors) for (let i = 0; i < nw; i++) {
      const u = sp * (i + 0.5), ww = Math.min(1.05, sp * 0.62);
      B.box(F, 'trim', u, yc - wh / 2 - 0.06, 0.12, ww + 0.3, 0.12, 0.24, 1.2);             // sill
      B.box(F, 'trim', u, yc + wh / 2 + 0.14, 0.1, ww + 0.36, 0.28, 0.2, 1.2);              // lintel
      B.box(F, brick ? 'trim' : 'wall', u - ww / 2 - 0.07, yc, 0.08, 0.14, wh, 0.16); B.box(F, brick ? 'trim' : 'wall', u + ww / 2 + 0.07, yc, 0.08, 0.14, wh, 0.16);
      B.box(F, 'paint', u, yc, 0.11, 0.04, wh, 0.03);                                       // the sash bar, in front of the glass
      const apt = 8 + Math.floor(rng() * 8), lit = rng() < 0.6 ? 0.45 + rng() * 0.6 : rng() * 0.08;
      B.window(F, u, yc, 0.08, ww, wh, apt, lit, rng() < 0.45 ? 1 : 0, 0.85);   // just in front of the wall face (n 0.06): at 0.06 the wall hid it
      if (cfg.escapes && i % 2 === 0 && i + 1 < nw) { const ue = u + sp / 2, ew = sp + ww;      // a fire escape across two windows
        B.box(F, 'iron', ue, yc - wh / 2 - 0.12, 0.55, ew, 0.05, 1.0, 1); B.box(F, 'iron', ue, yc - wh / 2 + 0.85, 1.03, ew, 0.04, 0.04, 1);
        for (let k = 0; k <= 6; k++) B.box(F, 'iron', ue - ew / 2 + k * ew / 6, yc - wh / 2 + 0.38, 1.03, 0.025, 0.95, 0.025, 1); }
    }
    for (const u of [0.2, L - 0.2]) B.box(F, 'trim', u, (COR + HT) / 2, 0.08, 0.4, HT - COR, 0.16, 1.2);
    B.box(F, 'trim', L / 2, HT - 0.2, 0.3, L, 0.4, 0.6, 1.2);                               // parapet coping
    if (F.shops || F.side.length === 2) { B.box(F, 'walk', L / 2, 0.03, 1.55, L, 0.06, 2.5, 1.5); B.box(F, 'curb', L / 2, 0.05, 2.86, L, 0.1, 0.18, 0.8); }
    // a collider along the face, so nobody walks into a pilaster
    const a = F.O.clone(), e = F.O.clone().addScaledVector(F.T, L); a.addScaledVector(F.N, 0.7); e.addScaledVector(F.N, 0.7); c.wall(X(a.x), a.z, X(e.x), e.z);
  }
  const ms = B.finish(g);
  // the windows go down with the block (Dyker) and up with the tree: one level for every interior
  const im = interiorMat(c); r.dress.mats.push({ userData: { e0: 1 }, set emissiveIntensity(v) { im.uniforms.uLevel.value = v; } });
  c.tick((t, dt, P, ri) => { if (ri === r.i) im.uniforms.uTime.value = t; });
  // signs: canvas text on the fascia, glowing a little
  const place = (o, F, u, y, n) => { o.position.set(F.O.x + F.T.x * u + F.N.x * n, y, F.O.z + F.T.z * u + F.N.z * n); o.rotation.y = Math.atan2(F.N.x, F.N.z); };
  for (const s of signs) { const m = new THREE.MeshStandardMaterial({ map: shopSign(c, s.text, s.bg, s.fg), emissive: 0xffffff, emissiveMap: shopSign(c, s.text, s.bg, s.fg), emissiveIntensity: 0.32, roughness: 0.5 }); m.userData.e0 = 0.32; r.dress.mats.push(m);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(s.w, s.h), m); place(p, s.F, s.u, s.y, s.n); g.add(p); }
  // each lit shop throws a warm pool across the pavement in front of it
  for (const s of signs) { const pm = new THREE.MeshBasicMaterial({ map: POOL.t ||= c.canvasTex(128, 128, (q) => { const gr = q.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,200,130,.6)'); gr.addColorStop(0.5, 'rgba(255,180,110,.2)'); gr.addColorStop(1, 'rgba(255,170,100,0)'); q.fillStyle = gr; q.fillRect(0, 0, 128, 128); }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0.5, polygonOffset: true, polygonOffsetFactor: -6 });
    pm.userData.op0 = 0.5; pm.userData.e0 = 0; r.dress.mats.push(pm); const pl = new THREE.Mesh(new THREE.PlaneGeometry(s.w + 0.8, 3.2), pm); pl.rotation.x = -PI / 2; pl.rotation.z = Math.atan2(s.F.N.x, s.F.N.z); place(pl, s.F, s.u, 0.017, 1.9); pl.rotation.set(-PI / 2, 0, Math.atan2(s.F.N.x, s.F.N.z)); g.add(pl); }
  // little gooseneck lamps over the signs: a glow and a pool of light on the sign and the pavement
  for (const s of spots) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: POOL.glow ||= glowTex(c, 'rgba(255,200,130,.95)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0.8 }));
    sp.scale.set(0.42, 0.42, 1); sp.userData.op0 = 0.8; place(sp, s.F, s.u, s.y, s.n); g.add(sp); r.dress.glows.push(sp); }
  // awnings: a sloped striped canvas with a valance and two iron arms
  for (const a of awnings) { const tx = awningTex(c, a.col); const m = new THREE.MeshStandardMaterial({ map: tx, roughness: 0.85, side: THREE.DoubleSide });
    const o = new THREE.Group(); place(o, a.F, a.u, 3.62, 0.6); g.add(o); const slope = new THREE.Mesh(new THREE.PlaneGeometry(a.w, 1.25), m); slope.rotation.x = -1.05; slope.position.set(0, -0.3, 0.55); o.add(slope);
    const val = new THREE.Mesh(new THREE.PlaneGeometry(a.w, 0.22), m); val.position.set(0, -0.68, 1.1); o.add(val);
    for (const s of [-1, 1]) { const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.2, 6), B.mats.iron); arm.rotation.x = 1.05; arm.position.set(s * a.w * 0.45, -0.35, 0.52); o.add(arm); }
    const snow = new THREE.Mesh(new THREE.PlaneGeometry(a.w * 0.96, 1.1), new THREE.MeshStandardMaterial({ color: 0xeef2f8, roughness: 0.9, transparent: true, opacity: 0.55 })); snow.rotation.x = -1.05; snow.position.set(0, -0.28, 0.56); o.add(snow); }
  // blade signs: a lit double sided box on a bracket, standing out over the pavement
  for (const b of blades) { const o = new THREE.Group(); place(o, b.F, b.u, 3.9, 0.62); g.add(o); o.rotation.y += PI / 2;
    const tx = shopSign(c, b.text.length > 10 ? b.text.split(' ')[0] : b.text, '#0d1b4a', '#f2e6c8'); const m = new THREE.MeshStandardMaterial({ map: tx, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: 0.5, roughness: 0.4 }); m.userData.e0 = 0.5; r.dress.mats.push(m);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.34, 0.07), [B.mats.bronze, B.mats.bronze, B.mats.bronze, B.mats.bronze, m, m]); box.position.set(-0.62, 0, 0); box.rotation.z = PI / 2; o.add(box);
    o.add(new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.04, 0.04), B.mats.iron)).position.set(-0.4, 0.5, 0); }
  for (const w of wreaths) { const x = w.F.O.x + w.F.T.x * w.u + w.F.N.x * 0.3, z = w.F.O.z + w.F.T.z * w.u + w.F.N.z * 0.3; wreath(c, g, x, w.y, z, Math.atan2(w.F.N.x, w.F.N.z), 0.36); }
  // the park edge (Grand Army Plaza Manhattan meets the park): a low stone wall, lamps, and trees wrapped in lights
  if (cfg.park) { const pw = std(c, 0x6a665e, { roughness: 0.85 }); g.add(c.slab(0.6, 0.9, D - 0.4, pw, 0.5, 0.45, 0)); g.add(c.slab(0.75, 0.1, D - 0.4, pw, 0.5, 0.95, 0)); c.wall(X(0.9), -D / 2, X(0.9), D / 2);
    for (const z of [-6.2, -2.4, 1.4, 6.4]) { const t = c.glb('tree_plane', { h: 7.5, x: -1.2, z, parent: g, shadow: false }); const pts = []; for (let i = 0; i < 260; i++) { const a = Math.random() * 6.28, rr = Math.random() * 2.4, y = 3 + Math.random() * 4.2; pts.push([-1.2 + Math.cos(a) * rr, y, z + Math.sin(a) * rr, Math.random(), WARM[(Math.random() * 4) | 0]]); }
      const led = ledPoints(c, g, pts, { size: 0.06, gain: 2.3 }); led.material.uniforms.uOn.value = 2; r.dress.leds.push(led); } }
  // swags of greenery and bulbs between the pilasters, over each shop
  const gpts = [], bulbs = [];
  for (const s of swags) { for (let i = 0; i <= 18; i++) { const t = i / 18, u = s.u0 + (s.u1 - s.u0) * t, y = 4.32 - Math.sin(t * PI) * 0.38, n = 0.66;
      const x = s.F.O.x + s.F.T.x * u + s.F.N.x * n, z = s.F.O.z + s.F.T.z * u + s.F.N.z * n; gpts.push([x, y, z]); if (i % 2 === 0) bulbs.push([x + s.F.N.x * 0.08, y - 0.05, z + s.F.N.z * 0.08, Math.random(), WARM_BLUE[(Math.random() * 7) | 0]]); } }
  if (gpts.length) { const im2 = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.11, 0), ORN.n ||= new THREE.MeshStandardMaterial({ color: 0x1d4a2a, roughness: 0.9 }), gpts.length * 2), m4 = new THREE.Matrix4();
    gpts.forEach((p, i) => { for (let k = 0; k < 2; k++) { m4.makeTranslation(p[0] + (Math.random() - 0.5) * 0.12, p[1] + (Math.random() - 0.5) * 0.1, p[2] + (Math.random() - 0.5) * 0.12); im2.setMatrixAt(i * 2 + k, m4); } }); g.add(im2);
    const led = ledPoints(c, g, bulbs, { size: 0.06, gain: 2.4 }); led.material.uniforms.uOn.value = 2; r.dress.leds.push(led); c9Strand(c, g, bulbs, { scale: 0.7, r });
    // tinsel: silver foil strips wound through the swags, catching every light in the street
    const tin = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.008, 0.1), new THREE.MeshStandardMaterial({ color: 0xe8ecf4, metalness: 1, roughness: 0.12, side: THREE.DoubleSide, envMapIntensity: 2.2 }), gpts.length * 6), m5 = new THREE.Matrix4(), q5 = new THREE.Quaternion(), e5 = new THREE.Euler();
    gpts.forEach((p, i) => { for (let k = 0; k < 6; k++) { e5.set(Math.random() * 0.6, Math.random() * 6.28, Math.random() * 0.6); q5.setFromEuler(e5); m5.compose(new THREE.Vector3(p[0] + (Math.random() - 0.5) * 0.25, p[1] - 0.06 - Math.random() * 0.08, p[2] + (Math.random() - 0.5) * 0.25), q5, new THREE.Vector3(1, 0.7 + Math.random() * 0.8, 1)); tin.setMatrixAt(i * 6 + k, m5); } });
    g.add(tin); c.tick((t, dt, P, ri) => { if (ri === r.i) tin.rotation.y = 0, tin.material.roughness = 0.1 + 0.06 * Math.sin(t * 3); }); }
  // Dyker: every edge outlined in bulbs, the way the block does it
  if (cfg.outline) { const ol = []; for (const F of facades) { const L = F.L; if (L < 0.8) continue;
      for (const y of [GF + 0.56, HT - 0.02]) for (let u = 0; u <= L; u += 0.16) { const n = 0.95; ol.push([F.O.x + F.T.x * u + F.N.x * n, y, F.O.z + F.T.z * u + F.N.z * n, Math.random(), [[1, 0.25, 0.2], [0.2, 0.9, 0.35], [1, 0.8, 0.5], [0.25, 0.45, 1]][(u * 6.25 | 0) % 4]]); } }
    const led = ledPoints(c, g, ol, { size: 0.075, gain: 2.6, chase: 0.6 }); led.material.uniforms.uOn.value = 2; r.dress.leds.push(led); }
  return true;
}
// ---------- v4 (MLow: "4/10, I need 11/10... INSANE, something you could only do online... photo-ops, funny eggs") ----------

// THE WIRE HERALD ANGELS, built: the Tripo angels read as white blobs. These are what the real ones are, wire sculptures:
// a bell robe of ribs and hoops, a torso, two arched wings with inner feathers, an arm and a long raised trumpet, every wire
// a tube, studded with bulbs along its length. One geometry for all twelve.
const WANG = {};
function wireAngel(c) {
  const { THREE } = c;
  if (!WANG.geo) {
    const curves = [], V = (x, y, z) => new THREE.Vector3(x, y, z), cr = (pts, closed = false) => curves.push(new THREE.CatmullRomCurve3(pts, closed));
    const ring = (y, r, n = 18) => cr([...Array(n)].map((_, i) => { const a = i / n * PI * 2; return V(Math.cos(a) * r, y, Math.sin(a) * r * 0.85); }), true);
    for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2, s = Math.sin(a * 3) * 0.04; cr([V(Math.cos(a) * 0.58, 0.04, Math.sin(a) * 0.5), V(Math.cos(a) * (0.44 + s), 0.6, Math.sin(a) * 0.38), V(Math.cos(a) * 0.24, 1.25, Math.sin(a) * 0.2), V(Math.cos(a) * 0.16, 1.5, Math.sin(a) * 0.14)]); }
    [[0.04, 0.58], [0.35, 0.5], [0.72, 0.4], [1.1, 0.28], [1.48, 0.16]].forEach(([y, r]) => ring(y, r));
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; cr([V(Math.cos(a) * 0.16, 1.5, Math.sin(a) * 0.14), V(Math.cos(a) * 0.22, 1.66, Math.sin(a) * 0.16), V(Math.cos(a) * 0.12, 1.86, Math.sin(a) * 0.1)]); }
    ring(1.86, 0.12, 10);
    for (const s of [-1, 1]) {
      cr([V(s * 0.12, 1.78, -0.08), V(s * 0.5, 2.1, -0.28), V(s * 0.95, 2.62, -0.42), V(s * 1.05, 2.4, -0.4), V(s * 0.85, 1.75, -0.34), V(s * 0.55, 1.15, -0.26), V(s * 0.2, 1.4, -0.12)]);
      for (let k = 1; k <= 4; k++) { const t = k / 5; cr([V(s * 0.16, 1.62 - t * 0.2, -0.1), V(s * (0.35 + t * 0.4), 2.05 - t * 0.35, -0.24), V(s * (0.6 + t * 0.32), 2.4 - t * 0.75, -0.36)]); }
    }
    cr([V(0.16, 1.78, 0), V(0.3, 1.86, 0.18), V(0.12, 2.0, 0.34)]); cr([V(-0.16, 1.78, 0), V(-0.24, 1.9, 0.2), V(-0.08, 2.02, 0.34)]);
    const tr = new THREE.CatmullRomCurve3([V(0, 2.02, 0.2), V(0.02, 2.2, 0.55), V(0.04, 2.42, 0.95)]); curves.push(tr);
    const geos = curves.map((cv) => new THREE.TubeGeometry(cv, Math.max(8, Math.round(cv.getLength() * 26)), 0.011, 5, cv.closed));
    const bell = new THREE.TorusGeometry(0.11, 0.012, 6, 18); bell.rotateX(-0.5); bell.translate(0.04, 2.44, 0.97); geos.push(bell);
    const cone = new THREE.ConeGeometry(0.11, 0.2, 14, 1, true); cone.rotateX(-PI / 2 - 0.5); cone.translate(0.04, 2.4, 0.9); geos.push(cone);
    WANG.geo = mergeGeometries(geos.map((g) => g.toNonIndexed()), false);
    WANG.mat = new THREE.MeshStandardMaterial({ color: 0xece6da, metalness: 0.55, roughness: 0.32, emissive: 0x3a3226, side: THREE.DoubleSide });
    const pts = []; curves.forEach((cv) => { const n = Math.max(3, Math.round(cv.getLength() / 0.055)); for (let i = 0; i < n; i++) { const p = cv.getPointAt(i / n); pts.push([p.x, p.y, p.z, Math.random() * 0.5, [1, 0.86, 0.6]]); } });
    WANG.pts = pts;
  }
  const m = new THREE.Mesh(WANG.geo, WANG.mat); return { mesh: m, pts: WANG.pts };
}

// INTO THE TREE (only online): after the lighting, the STAR LIFT flies you across the plaza, into the middle of the 22,000
// lights, and up the trunk to the star, then sets you back down on the plaza
function starLift(c, r, g, X, onTreeLit) {
  const { THREE } = c, sg = c.sign('THE STAR LIFT\nAFTER THE LIGHTING', { w: 1.1, h: 0.42, bg: '#0d1b4a', fg: '#f5c542', font: c.SERIF, weight: 900 });
  sg.position.set(12.6, 1.35, -6.5); g.add(sg); g.add(c.slab(0.08, 1.15, 0.08, std(c, 0x222222), 12.6, 0.57, -6.52));
  c.clickable(sg, () => {
    if (!LT.tree) { c.toast('The lift runs only when the tree is lit. Press the switch first.', 2600); return; }
    const P = c.P, TZ = r.treeZ ?? -16.5, TH = RP.TH, pts = [[P.x, 1.7, P.z], [X(10), 2.6, -7], [X(10), 4.5, TZ + 22], [X(10), 3.4, TZ + 0.2], [X(10), 9, TZ], [X(10), 16, TZ + 0.05], [X(10), TH - 2.5, TZ + 0.1], [X(10), TH - 0.6, TZ - 0.1]].map(([x, y, z]) => new THREE.Vector3(x, y, z));
    snd(c, 'whoosh', 0.6, 3); c.toast('Hold on. Twenty two thousand lights, from the inside.', 3000);
    r.lifting = true;
    c.ride(new THREE.CatmullRomCurve3(pts), 19, () => { r.lifting = false; P.x = X(10); P.z = 2.5; P.yaw = 0; c.egg('inside', 'You went into the tree. Twenty two thousand lights in a spiral, the star at the top, and you in the middle of it. The real one does not take passengers. This one does.'); });
  }, 'The star lift');
  { const bark = std(c, 0x3a2a1c, { roughness: 0.95 }), TZ = r.treeZ ?? -16.5, tr = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.6, RP.TH - 1, 14), bark); tr.position.set(10, (RP.TH - 1) / 2, TZ); tr.userData.keep = true; g.add(tr);
    const N = 420, im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03, 0.09, 1, 6), bark, N), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    for (let i = 0; i < N; i++) { const y = 1.5 + Math.random() * (RP.TH - 3.5), len = (1 - y / RP.TH) * RP.TR * 0.92 * (0.6 + Math.random() * 0.4), a = Math.random() * PI * 2;
      e.set(0, -a, PI / 2 - 0.35); q.setFromEuler(e); m4.compose(new THREE.Vector3(10 + Math.cos(a) * len / 2, y, TZ + Math.sin(a) * len / 2), q, new THREE.Vector3(1, len, 1)); im.setMatrixAt(i, m4); }
    im.userData.keep = true; im.visible = false; g.add(im); r.limbs = im; }
  // inside the tree the needles would hide every bulb: they melt away as you enter, and you rise through the lights alone
  c.tick((t, dt, P, ri) => { const T = r.treeObj; if (!T || ri !== r.i) return; if (T.star && !T.star.k) { T.star.k = 1; [T.star.st, T.star.sm, T.star.glow, T.star.sparks].forEach((o) => o && o.traverse && o.traverse((q) => { q.userData.keep = true; })); } const d = Math.hypot(P.x - X(10), P.z - (r.treeZ ?? -16.5)), inside = r.lifting && d < 7.5; if (r.lifting && d < 3) { P.yaw = 0; P.pitch = 0.75; }
    T.group.traverse((o) => { if (o.isMesh && !o.isPoints && o.material && !o.userData.keep) { if (o.userData.op0 === undefined) { o.userData.op0 = o.material.opacity; o.material.transparent = true; }
      const want = inside ? 0.04 : o.userData.op0; if (r.limbs) r.limbs.visible = r.lifting; o.material.opacity += (want - o.material.opacity) * Math.min(1, dt * 3); o.visible = o.material.opacity > 0.05; } }); });
}

// STEP INSIDE THE SNOW GLOBE (only online): seventy floors up you shrink to one fortieth and stand on the plaza model under
// glass. Its towers become skyscrapers, the tree you lit becomes the real one, and the snow comes down in flakes the size of cars.
function shrinkModel(c, r, g, X) {
  const { THREE } = c, sg = c.sign('STEP INSIDE  >', { w: 0.9, h: 0.2, bg: '#2962ff', fg: '#ffffff', font: c.MONO, weight: 800 });
  sg.position.set(W / 2 + 1.6, 1.06, -1.12); g.add(sg);
  let inside = false, t0 = 0;
  const enter = () => { const P = c.P; if (inside) return; inside = true; t0 = 0; r.shrunk = { x: P.x, z: P.z };
    c.FX.warp = 0.9; snd(c, 'whoosh', 0.2, 2); r.near0 = c.camera.near; c.camera.near = 0.002; c.camera.updateProjectionMatrix(); P.scale = 1 / 40; P.lift = 0.965; P.x = X(W / 2 - 0.25); P.z = -2.05; P.yaw = -0.45; P.pitch = 0.2;   // on the paved plaza, not on the model's mirror rink
    c.toast('You are one fortieth of a New Yorker. Walk the plaza. Click again to come back.', 4200); c.egg('tiny', 'Seventy floors up, standing on the model of the plaza seventy floors down. The towers are skyscrapers again and the snow is the size of cars. Only online.'); };
  const leave = () => { const P = c.P; if (!inside) return; inside = false; c.camera.near = r.near0 || 0.05; c.camera.updateProjectionMatrix(); c.FX.warp = 0.6; P.scale = 1; P.lift = 0; P.x = r.shrunk.x; P.z = r.shrunk.z; snd(c, 'whoosh', 0.8, 1); };
  c.clickable(sg, () => (inside ? leave() : enter()), 'Step inside the model');
  c.tick((t, dt, P, ri) => { if (!inside) return; t0 += dt; c.FX.warp = Math.max(0, c.FX.warp - dt * 0.6);
    if (ri !== r.i || t0 > 90) leave();
    // keep the tiny visitor on the model's table top
    P.lift = 0.965; P.x = Math.max(X(W / 2 - 2.1), Math.min(X(W / 2 + 2.1), P.x)); P.z = Math.max(-3.95, Math.min(-1.25, P.z)); });
  addEventListener('keydown', (e) => { if (inside && (e.code === 'Escape' || e.code === 'KeyQ')) leave(); });
}

// PHOTO SPOTS (only online, and the share loop): a camera on a tripod in every room; click it and you are walked onto the
// spot, framed the way MLow would frame it, and the picture is taken, branded and saved to your computer
const SNAP = { want: null, hooked: false };
function hookSnap(c) {
  if (SNAP.hooked) return; SNAP.hooked = true; const R = c.renderer, orig = R.render.bind(R);
  R.render = (s, cam) => { orig(s, cam); if (SNAP.want && R.getRenderTarget() === null) { const f = SNAP.want; SNAP.want = null; try { f(R.domElement.toDataURL('image/jpeg', 0.93)); } catch (e) {} } };
}
function brandAndSave(c, url, r, line) {
  const img = new Image(); img.onload = () => {
    const w = img.width, h = img.height, band = Math.round(h * 0.11), cv = document.createElement('canvas'); cv.width = w; cv.height = h + band; const q = cv.getContext('2d');
    q.drawImage(img, 0, 0); q.fillStyle = '#05070c'; q.fillRect(0, h, w, band); q.fillStyle = '#c8a040'; q.fillRect(0, h, w, Math.max(2, band * 0.03));
    eyeFlower(q, band * 0.62, h + band / 2, band * 0.36);
    q.fillStyle = '#f2ebdd'; q.font = `700 ${Math.round(band * 0.34)}px Georgia, serif`; q.textBaseline = 'middle'; q.fillText('THE LIGHTINGS', band * 1.2, h + band * 0.36);
    q.fillStyle = '#9aa8c8'; q.font = `${Math.round(band * 0.2)}px Georgia, serif`; q.fillText(`${r.name} · ${line}`, band * 1.2, h + band * 0.7);
    q.fillStyle = '#2962ff'; q.font = `700 ${Math.round(band * 0.24)}px Georgia, serif`; q.textAlign = 'right'; q.fillText('N3WYORKERS.COM', w - band * 0.4, h + band / 2);
    cv.toBlob((b) => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `the-lightings-${r.id}.jpg`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); }, 'image/jpeg', 0.92);
  }; img.src = url;
}
function photoSpot(c, r, g, X, { at, look, cam, line }) {
  const { THREE } = c; hookSnap(c);
  const m = prop(c, r, g, X, 'ph_Camera_01', cam[0], cam[1], { h: 0.3, y: 1.35, ry: cam[2] || 0 });
  for (const a of [0, 2.1, 4.2]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.42, 5), std(c, 0x111111)); leg.position.set(cam[0] + Math.sin(a) * 0.18, 0.68, cam[1] + Math.cos(a) * 0.18); leg.rotation.set(Math.cos(a) * 0.13, 0, -Math.sin(a) * 0.13); g.add(leg); }
  c.post(X(cam[0]), cam[1], 0.3);
  const mark = c.sign('PHOTO SPOT', { w: 0.7, h: 0.18, bg: '#c8a040', fg: '#0a0a0c', font: c.MONO, weight: 800 }); mark.rotation.x = -PI / 2; mark.position.set(at[0], 0.03, at[1]); g.add(mark);
  c.clickable(m, () => { const P = c.P; P.x = X(at[0]); P.z = at[1]; P.yaw = look[0]; P.pitch = look[1]; snd(c, 'click');
    c.toast('Hold still. Three, two, one.', 1600);
    setTimeout(() => { SNAP.want = (url) => { c.flash && c.flash(0.5); snd(c, 'clink', 2800); brandAndSave(c, url, r, line); c.toast('Saved to your downloads. Post it, tag @n3wyorkers.', 3400); c.egg('photo', 'A picture from inside THE LIGHTINGS, branded and saved. The only souvenir shop in New York with no line.'); }; }, 1700); }, 'A photo spot');
}

// FUNNY THINGS, for the people who look closely
function jokes(c, r, g, X) {
  const { THREE } = c, J = JOKES[r.id] || {};
  if (J.asp) { const s = c.sign('ALTERNATE SIDE PARKING\nSUSPENDED\nCHRISTMAS DAY · NOT THE TREE', { w: 0.62, h: 0.62, bg: '#f4f4f0', fg: '#b4161e', font: c.MONO, weight: 800 }); s.position.set(J.asp[0], 2.3, J.asp[1]); s.rotation.y = J.asp[2] || 0; g.add(s);
    g.add(c.slab(0.05, 2.0, 0.05, std(c, 0x2a5a3a, { metalness: 0.6 }), J.asp[0], 1.0, J.asp[1] - 0.04)); c.clickable(s, () => c.egg('asp', 'Alternate side parking is suspended on Christmas Day, and on so many other holidays that New Yorkers know the calendar better than their own birthdays. The tree does not get a day off from the street sweeper.'), 'A parking sign'); }
  if (J.pigeon) { const p = c.glb('pigeon', { h: 0.3, x: J.pigeon[0], y: J.pigeon[2], z: J.pigeon[1], parent: g, shadow: false });
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 12), std(c, 0xb4161e, { roughness: 0.7 })); hat.position.set(J.pigeon[0] + 0.04, J.pigeon[2] + 0.33, J.pigeon[1]); hat.rotation.z = -0.4; g.add(hat);
    const pom = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), std(c, 0xffffff)); pom.position.set(J.pigeon[0] + 0.08, J.pigeon[2] + 0.38, J.pigeon[1]); g.add(pom);
    c.clickable(p, () => { snd(c, 'coo'); c.egg('pigeon', 'A pigeon in a Santa hat, on the lamp, judging the decorations. He has seen ninety holiday seasons on this block, and he does not tip.'); }, 'A pigeon in a hat'); }
  if (J.rat) { const o = new THREE.Group(); g.add(o); const rt = c.glb('rat', { h: 0.18, parent: o, shadow: true });
    const lk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.03, 18), std(c, 0xb87a30, { roughness: 0.8 })); lk.position.set(0, 0.06, 0.2); o.add(lk);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const u = (t * 0.07) % 1, x = J.rat[0] + (J.rat[2] - J.rat[0]) * u; o.position.set(x, 0.06, J.rat[1]); o.rotation.y = Math.atan2(J.rat[2] - J.rat[0], 0) - PI / 2 + PI; });
    c.clickable(rt, () => c.egg('ratlatke', 'A rat hauling a latke the size of himself across the plaza. In 2015 it was a slice. Traditions evolve.'), 'A rat with a latke'); }
  if (J.feed) { const s = c.sign('PLEASE DO NOT\nFEED THE ANGELS', { w: 0.7, h: 0.32, bg: '#0d3a24', fg: '#f2ebdd', font: c.SERIF, weight: 900 }); s.position.set(J.feed[0], 1.05, J.feed[1]); s.rotation.y = J.feed[2] || 0; g.add(s);
    c.clickable(s, () => c.egg('feed', 'Please do not feed the angels. They are wire, and they are on a strict diet of electricity.'), 'A sign'); }
  if (J.line) { const s = c.sign('LINE STARTS HERE\nEST. WAIT SINCE 1931', { w: 0.8, h: 0.34, bg: '#f5c542', fg: '#0a0a0c', font: c.MONO, weight: 800 }); s.position.set(J.line[0], 1.1, J.line[1]); s.rotation.y = J.line[2] || 0; g.add(s);
    g.add(c.slab(0.04, 0.95, 0.04, std(c, 0x111111), J.line[0], 0.48, J.line[1] - 0.03)); c.clickable(s, () => c.egg('line', 'The line to see the tree starts here, and has since 1931. The record wait is unconfirmed, because everyone who knows is still in it.'), 'A line sign'); }
}
const JOKES = {
  fifth: { asp: [18.4, 3.4, -PI / 2], pigeon: [18.4, -5.6, 3.85] },
  channel: { feed: [6.4, 1.5, 0.35], pigeon: [1.3, 5.2, 4.25] },
  tree: { line: [4.2, 3.0, 0.4], pigeon: [1.3, -0.6, 4.25] },
  menorah: { asp: [18.4, 3.2, -PI / 2], pigeon: [1.4, -4.6, 3.85] },
  brooklyn: { rat: [3.5, 6.2, 16.5], pigeon: [1.3, -4.8, 4.25] },
  dyker: { asp: [1.25, -4.2, PI / 2], rat: [4, 7, 16] },
};
const PHOTO = {
  fifth: { at: [10, 0.3], look: [0, 0.05], cam: [16.0, 1.2, 0.9], line: 'Fifth Avenue, the show across the street' },
  channel: { at: [10, 3.6], look: [0, 0.14], cam: [12.4, 7.2, 0.5], line: 'the Channel Gardens, twelve angels' },
  tree: { at: [10, 3.2], look: [0, 0.28], cam: [3.4, 4.4, -0.9], line: 'the tree, the night it was lit' },
  top: { at: [10, 4.6], look: [0, 0.02], cam: [4.0, 6.0, -0.8], line: 'seventy floors up' },
  menorah: { at: [9, 1.0], look: [-0.15, 0.22], cam: [3.6, 2.8, -0.9], line: 'Fifth and Fifty Ninth' },
  brooklyn: { at: [10, 2.2], look: [0, 0.16], cam: [16.2, 3.0, 0.9], line: 'Grand Army Plaza, Brooklyn' },
  window: { at: [10, -5.9], look: [0, 0.15], cam: [5.0, -4.2, -0.6], line: 'the answering windows' },
  dyker: { at: [10, 4.6], look: [0, 0.08], cam: [16.4, 5.6, 0.9], line: 'Dyker Heights' },
  rink: { at: [10, 5.4], look: [0, 0.05], cam: [3.6, 6.6, -0.8], line: 'the rink' },
};
function v4Room(c, r, g, X) {
  jokes(c, r, g, X);
  if (PHOTO[r.id]) photoSpot(c, r, g, X, PHOTO[r.id]);
  if (r.id === 'tree') starLift(c, r, g, X);
  if (r.id === 'top') shrinkModel(c, r, g, X);
}
// ---------- v5 (MLow: "still not impressing me": festive Rock Center, better lights, lines like clubs, NYC trash, a market) ----------

// REAL BULBS: a C9 teardrop and its dark socket at every canopy point, instanced; the glow points stay for bloom
const C9 = {};
function c9Strand(c, g, pts, { scale = 1, r } = {}) {
  const { THREE } = c; if (!pts.length) return;
  C9.bulb ||= (() => { const b = new THREE.SphereGeometry(0.028, 10, 8); b.scale(1, 1.55, 1); b.translate(0, -0.05, 0); return b; })();
  C9.sock ||= new THREE.CylinderGeometry(0.016, 0.018, 0.05, 8).translate(0, -0.01, 0);
  const bm = new THREE.MeshBasicMaterial({ toneMapped: false }), sm = new THREE.MeshStandardMaterial({ color: 0x0e1a10, roughness: 0.6 });
  const B = new THREE.InstancedMesh(C9.bulb, bm, pts.length), S = new THREE.InstancedMesh(C9.sock, sm, pts.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color();
  pts.forEach((p, i) => { e.set((Math.random() - 0.5) * 0.4, 0, (Math.random() - 0.5) * 0.4); q.setFromEuler(e); m4.compose(new THREE.Vector3(p[0], p[1], p[2]), q, new THREE.Vector3(scale, scale, scale)); B.setMatrixAt(i, m4); S.setMatrixAt(i, m4);
    const k = p[4] || [1, 0.8, 0.5], dead = Math.random() < 0.025; col.setRGB(k[0] * 1.6, k[1] * 1.6, k[2] * 1.6); if (dead) col.setRGB(0.06, 0.05, 0.04); B.setColorAt(i, col); });   // a few dead bulbs: every real string has them
  g.add(B, S); if (r && r.dress) { bm.userData.e0 = 0; r.dress.mats.push({ userData: { e0: 1 }, set emissiveIntensity(v) { bm.color.setScalar(Math.max(0.08, v)); } }); }
  return B;
}

// NYC STREET LITTER (Astra's list): gum, napkins, cups, lids, receipts, foil, wrapping scraps, ribbon, bags, chestnut shells,
// fir needles, collected where wind and feet push them: curbs, building bases, bins, queue edges
const LIT = {};
function litter(c, r, g, { zones, n = 140 } = {}) {
  const { THREE } = c, m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  const pick = () => { const z = zones[(Math.random() * zones.length) | 0]; return [z[0] + (Math.random() - 0.5) * z[2] * 2, z[1] + (Math.random() - 0.5) * z[3] * 2]; };
  const lay = (geo, mat, count, s0, s1, flat = true, y = 0.01) => { const im = new THREE.InstancedMesh(geo, mat, count);
    for (let i = 0; i < count; i++) { const [x, z] = pick(), s = s0 + Math.random() * (s1 - s0); e.set(flat ? -PI / 2 : (Math.random() - 0.5) * 1.2, Math.random() * 6.28, flat ? 0 : (Math.random() - 0.5) * 1.2); q.setFromEuler(e); sc.set(s, s, s); m4.compose(v.set(x, y + (flat ? 0 : s * 0.4), z), q, sc); im.setMatrixAt(i, m4); }
    g.add(im); return im; };
  LIT.gum ||= new THREE.MeshBasicMaterial({ color: 0x15171a, transparent: true, opacity: 0.75, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
  LIT.white ||= new THREE.MeshStandardMaterial({ color: 0x9e978a, roughness: 0.95 });   // street grime, not snow white
  LIT.cup ||= new THREE.MeshStandardMaterial({ color: 0xe8dcc8, roughness: 0.8 });
  LIT.foil ||= new THREE.MeshStandardMaterial({ color: 0xc8c8cc, metalness: 1, roughness: 0.35 });
  LIT.wrap ||= [0xb4161e, 0x2962ff, 0x1f6a3a, 0xd8a640].map((cc) => new THREE.MeshStandardMaterial({ color: cc, roughness: 0.6, side: THREE.DoubleSide }));
  LIT.needle ||= new THREE.MeshStandardMaterial({ color: 0x2e3a1c, roughness: 1 });
  LIT.bag ||= new THREE.MeshStandardMaterial({ color: 0xf4f4f0, roughness: 0.4, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
  LIT.shell ||= new THREE.MeshStandardMaterial({ color: 0x4a2a16, roughness: 0.7 });
  const N = n;
  lay(new THREE.CircleGeometry(0.02, 8), LIT.gum, N, 0.6, 1.6, true, 0.012);                                   // flattened gum
  lay(new THREE.IcosahedronGeometry(0.035, 0), LIT.white, N * 0.1 | 0, 0.6, 1.1, false);                        // crumpled napkins
  { const cg = new THREE.CylinderGeometry(0.04, 0.03, 0.11, 10, 1, true); cg.rotateZ(PI / 2); cg.scale(1, 0.6, 1); lay(cg, LIT.cup, N * 0.08 | 0, 0.9, 1.1, false, 0.02); }   // crushed cups on their side
  lay(new THREE.CircleGeometry(0.045, 14), LIT.white, N * 0.05 | 0, 1, 1, true, 0.013);                         // lids
  lay(new THREE.PlaneGeometry(0.06, 0.24), LIT.white, N * 0.06 | 0, 0.8, 1.2, true, 0.014);                    // receipts
  lay(new THREE.IcosahedronGeometry(0.035, 0), LIT.foil, N * 0.08 | 0, 0.6, 1.3, false);                        // foil balls
  LIT.wrap.forEach((m) => { m.color.multiplyScalar(0.7); lay(new THREE.PlaneGeometry(0.12, 0.08), m, N * 0.02 | 0, 0.6, 1.3, true, 0.015); });   // wrapping paper scraps
  { const rg = new THREE.TorusGeometry(0.06, 0.006, 4, 20, PI * 3); lay(rg, LIT.wrap[1], N * 0.03 | 0, 0.8, 1.4, true, 0.02); }    // curled ribbon
  { const bg = new THREE.SphereGeometry(0.14, 7, 5); bg.scale(1, 0.45, 0.8); lay(bg, LIT.bag, N * 0.03 | 0, 0.8, 1.3, false, 0.03); }   // a plastic bag
  lay(new THREE.SphereGeometry(0.018, 6, 4), LIT.shell, N * 0.1 | 0, 0.7, 1.2, false);                          // chestnut shells
  lay(new THREE.BoxGeometry(0.03, 0.002, 0.002), LIT.needle, N * 1.2 | 0, 0.7, 1.3, true, 0.012);               // fir needles
}

// THE LINE (like a club): brass stanchions folding three lanes, extras waiting in them, a bouncer with the list, an elf on the
// door, warm light spilling out each time it opens, breath steam, and the funny ones
function storeLine(c, r, g, X, { x0, z0, len = 6, lanes = 3, dir = 1, door = [0, 0], name = 'THE SHOP' } = {}) {
  const { THREE } = c, brass = std(c, 0xc8a040, { metalness: 1, roughness: 0.28 }), rope = std(c, 0x6a0f14, { roughness: 0.7 });
  const post = (x, z) => { g.add(c.slab(0.055, 0.92, 0.055, brass, x, 0.46, z)); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.04, 20), brass); b.position.set(x, 0.02, z); g.add(b); const t = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), brass); t.position.set(x, 0.95, z); g.add(t); };
  const ropeAt = (a, b) => { const cv = new THREE.CatmullRomCurve3([new THREE.Vector3(a[0], 0.88, a[1]), new THREE.Vector3((a[0] + b[0]) / 2, 0.7, (a[1] + b[1]) / 2), new THREE.Vector3(b[0], 0.88, b[1])]); g.add(new THREE.Mesh(new THREE.TubeGeometry(cv, 10, 0.022, 6), rope)); };
  const W1 = 1.1; let prev = null;
  for (let l = 0; l <= lanes; l++) { const xl = x0 + dir * l * W1; for (let k = 0; k <= len; k += 1.5) { const z = z0 + k; post(xl, z); if (k > 0 && !(l > 0 && l < lanes && ((l % 2 === 1 && k === len) || (l % 2 === 0 && k === 0)))) ropeAt([xl, z - 1.5], [xl, z]); }
    c.wall(X(xl), z0, X(xl), z0 + len); }
  // people waiting, each lane alternating direction; the crowd pool characters, still, a little sway
  const ppl = []; for (let l = 0; l < lanes; l++) for (let k = 0; k < len / 0.75; k++) { const xx = x0 + dir * (l + 0.5) * W1 + (Math.random() - 0.5) * 0.2, zz = z0 + 0.4 + k * 0.75; if (Math.random() < 0.12) continue;
    const e = extra(c, g, xx, zz, { col: [0x3a3a4a, 0x6a2a2a, 0x2a3a5a, 0x4a4a2a, 0x2a4a3a][(l + k) % 5], ry: l % 2 ? PI : 0, crowd: true }); ppl.push(e); }
  // the bouncer, the list, the door
  const lst = c.sign(`THE LIST\n${name}\nEST. WAIT 2 HRS`, { w: 0.55, h: 0.5, bg: '#0a0a0c', fg: '#f2ebdd', font: c.MONO, weight: 800 }); lst.position.set(door[0] - dir * 0.6, 1.25, door[1] + 0.6); lst.rotation.y = dir > 0 ? -PI / 2 : PI / 2; g.add(lst);
  g.add(c.slab(0.05, 1.05, 0.05, std(c, 0x111111), door[0] - dir * 0.6, 0.52, door[1] + 0.6));
  const bouncer = extra(c, g, door[0] - dir * 0.9, door[1] + 0.2, { col: 0x111114, ry: dir > 0 ? -PI / 2 : PI / 2, crowd: true });
  c.clickable(lst, () => c.egg('list', `You are not on the list for ${name}. Nobody is. The line is the product.`), 'The list');
  const spill = new THREE.PointLight(0xffc890, 0, 5, 1.8); spill.position.set(door[0] + dir * 0.4, 2.2, door[1]); g.add(spill); let tt = Math.random() * 8;
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; tt += dt; const open = (tt % 11) < 2.4; spill.intensity += ((open ? 6 : 0.6) - spill.intensity) * Math.min(1, dt * 4); ppl.forEach((e, i) => { e.rotation.z = Math.sin(t * 0.8 + i) * 0.02; }); });
  // the funny ones: a pigeon holding a place, a present too wide for the rope, a man with three cocoa cups
  c.glb('pigeon', { h: 0.28, x: x0 + dir * 0.55, z: z0 + len - 0.3, parent: g, shadow: false });
  { const gift = c.slab(1.4, 0.7, 0.6, std(c, 0x2962ff, { roughness: 0.5 }), x0 + dir * (lanes - 0.5) * W1, 1.05, z0 + 1.2); g.add(gift); g.add(c.slab(1.42, 0.08, 0.62, std(c, 0xd8a640, { metalness: 0.6 }), x0 + dir * (lanes - 0.5) * W1, 1.05, z0 + 1.2));
    c.clickable(gift, () => c.egg('wide', 'A present too wide for the rope. He will be in this line until Valentine\'s Day.'), 'A very wide present'); }
  return { ppl };
}

// THE HOLIDAY MARKET (Union Square, Bryant Park): chalets on three sides, a 3 m aisle, bulbs on poles, a chestnut cart,
// steam, stock, vendors' coats; the online trick: click an ornament and the stall unfolds into an impossible deep workshop
const STALLS = [
  ['CERAMICS', 'cobalt mugs, eye flower dishes, menorahs'], ['ORNAMENTS', 'tiny New Yorkers, pigeons, pretzels'], ['LATKES', 'applesauce or sour cream, no debate'],
  ['CHESTNUTS & COCOA', 'hot, hotter, too hot'], ['KNITWEAR', 'contour river scarves, petal earmuffs'], ['PRINTS', 'MLow prints, folded stars'],
  ['LIGHTS', 'eye flower lamps, repairable strings'], ['GIFT WRAP', 'ribbon, tags, unfinished orders'],
];
function market(c, r, g, X) {
  const { THREE } = c, spots = [[4.6, -4.4, PI / 2], [4.6, -0.6, PI / 2], [4.6, 3.2, PI / 2], [15.4, -4.4, -PI / 2], [15.4, -0.6, -PI / 2], [15.4, 3.2, -PI / 2], [7.6, -6.2, 0], [12.4, -6.2, 0]];
  spots.forEach(([x, z, ry], i) => {
    const o = new THREE.Group(); o.position.set(x, 0, z); o.rotation.y = ry; g.add(o); c.post(X(x), z, 1.5);
    const m = c.glb('lt_chalet', { h: 3.1, parent: o, shadow: true });
    const [name, line] = STALLS[i]; const sg = c.sign(name, { w: 1.8, h: 0.3, bg: '#f2ebdd', fg: '#0d3a24', font: c.SERIF, weight: 900 }); sg.position.set(0, 2.25, 1.32); o.add(sg);
    const warm = new THREE.PointLight(0xffb870, 3.5, 4.2, 1.8); warm.position.set(0, 1.9, 0.7); o.add(warm);
    // the goods on the counter: a row of small coloured things that read as stock
    const cols = [[0x2962ff, 0xf2ebdd], [0xb4161e, 0xd8a640, 0x2962ff], [0xc89048], [0x4a2a16, 0xf2ebdd], [0x2962ff, 0xb4161e, 0x1f6a3a], [0xf2ebdd, 0x2962ff], [0xffd890, 0xf2ebdd], [0xb4161e, 0x2962ff, 0xd8a640]][i];
    for (let k = 0; k < 14; k++) { const b = new THREE.Mesh(i === 1 ? new THREE.SphereGeometry(0.05, 10, 8) : new THREE.BoxGeometry(0.1, 0.1 + Math.random() * 0.08, 0.1), std(c, cols[k % cols.length], { roughness: 0.4, metalness: i === 1 ? 0.6 : 0.05 })); b.position.set(-0.8 + (k % 7) * 0.26, 1.12 + (k > 6 ? 0.0 : 0), 0.75 + (k > 6 ? -0.18 : 0)); o.add(b); }
    if (i === 2 || i === 3) steam(c, o, 0, 1.4, 0.6, 0.7);
    let open = 0, want = 0; const deep = new THREE.Group(); deep.position.set(0, 0, -1.0); o.add(deep); deep.visible = false;
    for (let k = 0; k < 9; k++) { const fr = new THREE.Mesh(new THREE.TorusGeometry(1.2 - k * 0.02, 0.03, 6, 4), new THREE.MeshBasicMaterial({ color: k % 2 ? 0x2962ff : 0x00e5ff, toneMapped: false, transparent: true, opacity: 0.8 - k * 0.07 })); fr.rotation.z = PI / 4; fr.position.set(0, 1.6, -k * 1.4); deep.add(fr); }
    c.clickable(m, () => { want = want ? 0 : 1; deep.visible = true; snd(c, 'whoosh', 0.5, 1.4); c.toast(`${name} · ${line}`, 2600); if (want) c.egg('workshop', 'The stall goes on forever: the workshop behind every market chalet, contour rivers and all. You can only see it from here, and only online.'); }, `${name} stall`);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; open += (want - open) * Math.min(1, dt * 2); deep.scale.set(1, 1, Math.max(0.001, open)); deep.visible = open > 0.01; deep.children.forEach((f, k) => { f.rotation.z = PI / 4 + t * 0.2 * (k % 2 ? 1 : -1); }); });
  });
  // overhead bulb runs on real poles
  const poleM = std(c, 0x1a1a1a, { metalness: 0.7, roughness: 0.4 }), runs = [-4.8, -1.2, 2.4, 5.6], all = [];
  for (const z of runs) { for (const x of [6.2, 13.8]) { g.add(c.slab(0.1, 4.5, 0.1, poleM, x, 2.25, z)); c.post(X(x), z, 0.15); }
    const pts = strand([...Array(17)].map((_, i) => { const u = i / 16; return [3.6 + 12.8 * u, 4.4 - Math.sin(u * PI) * 0.55, z]; }), 0.3).map((p) => [p[0], p[1] - 0.04, p[2], Math.random(), WARM[(Math.random() * 4) | 0]]);
    all.push(...pts); }
  const led = ledPoints(c, g, all, { size: 0.07, gain: 2.0 }); led.material.uniforms.uOn.value = 2; r.dress.leds.push(led); c9Strand(c, g, all, { r });
  prop(c, r, g, X, 'lt_chestnut', 7.4, 5.2, { h: 2.0, ry: 0.4, r: 0.9 }); steam(c, g, 7.4, 1.6, 5.2, 0.8);
  [[7.8, 1.4], [12.2, 1.4], [7.8, -2.8], [12.2, -2.8]].forEach(([x, z]) => { g.add(c.slab(0.7, 0.04, 0.7, std(c, 0x5a3a20, { roughness: 0.6 }), x, 1.08, z)); g.add(c.slab(0.07, 1.08, 0.07, poleM, x, 0.54, z)); c.post(X(x), z, 0.4); });
  litter(c, r, g, { zones: [[7.4, 5.2, 1.0, 0.8], [5.95, 0, 0.35, 6], [14.05, 0, 0.35, 6], [10, -5.6, 2.5, 0.4], [7.8, 1.4, 0.5, 0.5], [12.2, -2.8, 0.5, 0.5]], n: 220 });   // edges, carts and tables, not the middle of the aisle
  c.glb('lt_elf', { h: 1.45, x: 9.0, z: -5.2, parent: g, shadow: true }); c.glb('lt_santa', { h: 1.95, x: 11.4, z: -5.0, ry: -0.3, parent: g, shadow: true });
}

// FESTIVE DRESSING per room: tinsel columns at the shopfronts, mistletoe over doors, wreaths, present stacks, Santas and elves
const FEST = {
  fifth: { gifts: [[16.6, -5.0], [3.4, -5.2]], santa: [[3.0, 2.0, 1.2]], elf: [[16.8, 2.4, -1.4]], line: { x0: 1.9, z0: -3.6, len: 4.5, lanes: 2, dir: 1, door: [1.0, -4.2], name: 'BLOOM & EYE' }, litter: 170 },
  tree: { gifts: [[5.2, -6.0], [14.8, -6.2], [7.0, -6.3]], santa: [[16.4, 2.2, -1.3]], elf: [[3.6, 2.6, 1.3], [12.8, -5.6, 0.2]], line: { x0: 18.1, z0: -1.0, len: 4.5, lanes: 2, dir: -1, door: [19.0, -1.6], name: 'THE PLAZA SHOP' }, litter: 200 },
  channel: { gifts: [[4.4, -6.6]], elf: [[15.8, -6.4, -0.3]], litter: 120 },
  rink: { elf: [[17.2, 5.6, -1.2]], litter: 90 },
  menorah: { gifts: [[17.0, -5.6]], litter: 140 },
  brooklyn: { litter: 160, santa: [[17.6, -2.0, -1.3]] },
  dyker: { gifts: [[4.0, 6.4], [16.6, 6.4]], santa: [[3.0, -1.0, 1.4]], elf: [[16.8, 1.0, -1.4], [3.2, 3.2, 1.4]], litter: 150 },
};
function v5Room(c, r, g, X) {
  const F = FEST[r.id] || {}, { THREE } = c;
  (F.gifts || []).forEach(([x, z]) => prop(c, r, g, X, 'lt_gifts', x, z, { h: 2.3, ry: Math.random() * 6, r: 0.8 }));
  (F.santa || []).forEach(([x, z, ry]) => { const s = c.glb('lt_santa_ef', { h: 1.95, x, z, ry, parent: g }); c.post(X(x), z, 0.4); c.clickable(s, () => c.egg('santas', 'One of many Santas in the city tonight. Statistically, at least one of them is in the wrong line.'), 'A Santa'); });
  (F.elf || []).forEach(([x, z, ry]) => { const s = c.glb('lt_elf', { h: 1.45, x, z, ry, parent: g }); c.post(X(x), z, 0.3); c.clickable(s, () => c.egg('elves', 'An elf on a cigarette break that is actually a cocoa break. The union negotiated it in 1987.'), 'An elf'); });
  if (F.line) storeLine(c, r, g, X, F.line);
  if (F.litter && r.outdoor) litter(c, r, g, { zones: [[2.9, 0, 0.45, 7.5], [W - 3.1, 0, 0.45, 7.5], [1.0, 0, 0.35, 7.5], [W - 1.2, 0, 0.35, 7.5], [10, -6.4, 4, 0.6]], n: F.litter });
  if (r.id === 'market') market(c, r, g, X);
  if (r.id === 'window') apartment(c, r, g, X);
  // mistletoe over every shop door (ARCH sides): the bunch, a ribbon and a small sign
  if (r.arch && !['dyker'].includes(r.id)) [[0.9, -1.2, PI / 2], [W - 1.1, -1.2, -PI / 2]].forEach(([x, z, ry]) => { const m = c.glb('lt_mistletoe', { h: 0.5, x, y: 3.45, z, ry, parent: g, shadow: false }); c.clickable(m, () => c.egg('mistletoe', 'Mistletoe over a shop door on a sidewalk eleven people wide. New Yorkers will kiss a stranger before they will stop walking.'), 'Mistletoe'); });
}

// THE APARTMENT, rebuilt (Astra's brief): a pre war Brooklyn living room carved out of the hall around the window, 11 m by 8.4 m:
// partition walls with a cased opening, picture rail and crown, a mantel with stockings and a wreath, a lit tree by the
// bookcase, an olive sofa and a burgundy chair angled at the window, practical lamps as the light, and twenty small things
function apartment(c, r, g, X) {
  const { THREE } = c, CH = r.ceilH || 3.4, x0 = 4.5, x1 = 15.5, zb = 0.4;
  const plaster = c.surf('acg_plaster001', 1.6, 0xe8dcc4), trim = std(c, 0xf2ece0, { roughness: 0.45 }), walnut = std(c, 0x3a2416, { roughness: 0.5 });
  const wl = (window.WALLS || []).includes('window_l') ? facadeMat(c, 'assets/walls/window_l.jpg', [0.5, 1], [0, 0], 1.0) : plaster;
  const wr = (window.WALLS || []).includes('window_r') ? facadeMat(c, 'assets/walls/window_r.jpg', [0.5, 1], [0.5, 0], 1.0) : plaster;
  if (wl.emissiveIntensity !== undefined) { wl.emissiveIntensity = wr.emissiveIntensity = 0.25; }
  // side partitions from the window wall to the back, and a back wall with a cased opening 2.4 m wide
  g.add(c.slab(0.16, CH, zb + D / 2, wl, x0, CH / 2, (zb - D / 2) / 2)); c.wall(X(x0), -D / 2, X(x0), zb);
  g.add(c.slab(0.16, CH, zb + D / 2, wr, x1, CH / 2, (zb - D / 2) / 2)); c.wall(X(x1), -D / 2, X(x1), zb);
  const ow = 2.4, lw = (x1 - x0 - ow) / 2;
  g.add(c.slab(lw, CH, 0.16, plaster, x0 + lw / 2, CH / 2, zb)); g.add(c.slab(lw, CH, 0.16, plaster, x1 - lw / 2, CH / 2, zb)); g.add(c.slab(ow, CH - 2.3, 0.16, plaster, 10, 2.3 + (CH - 2.3) / 2, zb));
  c.wall(X(x0), zb, X(10 - ow / 2), zb); c.wall(X(10 + ow / 2), zb, X(x1), zb);
  for (const s of [-1, 1]) g.add(c.slab(0.14, 2.36, 0.24, walnut, 10 + s * (ow / 2 + 0.05), 1.18, zb)); g.add(c.slab(ow + 0.3, 0.16, 0.24, walnut, 10, 2.36, zb));
  { const wp = facadeMat(c, 'assets/walls/window_r.jpg', [0.6, 1], [0.2, 0], 1.0); wp.emissiveIntensity = 0.2;
    for (const [xa, xb] of [[x0, 10 - ow / 2], [10 + ow / 2, x1]]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(xb - xa, CH), wp); p.position.set((xa + xb) / 2, CH / 2, zb + 0.09); p.rotation.y = 0; g.add(p); }
    const cast = (r.cast || []).filter((q) => q.f); [[6.0, 1.6], [7.8, 1.75], [12.2, 1.75], [14.0, 1.6]].forEach(([x, y], i) => { if (cast[i]) c.hang(cast[i], X(0) - r.x0 + x, y, zb + 0.14, 0, i % 2 ? 0.95 : 0.75, 'oak', g); });
    prop(c, r, g, X, 'ph_vintage_cabinet_01', 5.6, zb + 0.5, { h: 0.95, r: 0.4 }); prop(c, r, g, X, 'ph_potted_plant_01', 14.8, zb + 0.5, { h: 1.1, r: 0.3 });
    const run = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 4.0), new THREE.MeshStandardMaterial({ color: 0x3a1a20, roughness: 0.95 })); run.rotation.x = -PI / 2; run.position.set(10, 0.011, zb + 2.2); g.add(run); }
  // picture rail, crown and baseboard on the three new walls
  const runs = [[x0 + 0.09, -D / 2, x0 + 0.09, zb, PI / 2], [x1 - 0.09, -D / 2, x1 - 0.09, zb, -PI / 2]];
  for (const [xa, za, xb, zb2] of runs) { const L = zb2 - za, cz = (za + zb2) / 2; for (const [y, h, d] of [[0.08, 0.16, 0.03], [2.55, 0.04, 0.03], [CH - 0.07, 0.14, 0.09]]) g.add(c.slab(0.06 + d, h, L, trim, xa, y, cz)); }
  for (const [y, h, d] of [[0.08, 0.16, 0.06], [2.55, 0.04, 0.06], [CH - 0.07, 0.14, 0.12]]) { g.add(c.slab(lw, h, d, trim, x0 + lw / 2, y, zb - 0.1)); g.add(c.slab(lw, h, d, trim, x1 - lw / 2, y, zb - 0.1)); }
  // the mantel on the left partition: firebox, shelf, stockings, wreath, two candlesticks
  const mx = x0 + 0.1, mz = -2.6, mantel = new THREE.Group(); mantel.position.set(mx, 0, mz); mantel.rotation.y = PI / 2; g.add(mantel);
  mantel.add(c.slab(1.9, 1.15, 0.32, std(c, 0xece4d4, { roughness: 0.5 }), 0, 0.575, 0.16)); mantel.add(c.slab(0.9, 0.75, 0.05, std(c, 0x0e0c0a, { roughness: 1 }), 0, 0.38, 0.33)); mantel.add(c.slab(2.1, 0.07, 0.42, walnut, 0, 1.18, 0.2));
  ['#b4161e', '#2962ff', '#1f6a3a', '#f2ebdd'].forEach((col, i) => { const st = c.sign(['MLOW', 'N3W', 'ELF', 'PIGEON'][i], { w: 0.22, h: 0.36, bg: col, fg: col === '#f2ebdd' ? '#0d1b4a' : '#f2ebdd', font: c.SERIF, weight: 900 }); st.position.set(-0.6 + i * 0.4, 0.95, 0.43); mantel.add(st); });
  wreath(c, mantel, 0, 1.85, 0.08, 0, 0.36); for (const s of [-0.85, 0.85]) { mantel.add(c.slab(0.05, 0.28, 0.05, std(c, 0xc8a040, { metalness: 1, roughness: 0.3 }), s, 1.35, 0.2)); flameSprite(c, mantel, s, 1.56, 0.2, 0.07).visible = true; }
  c.post(X(mx + 0.3), mz, 1.0);
  // the tree by the bookcase, right partition
  const tx = x1 - 1.0, tz = -2.2; prop(c, r, g, X, 'ph_fir_tree_01', tx, tz, { h: 2.4, r: 0.6 });
  { const pts = []; for (let i = 0; i < 300; i++) { const u = i / 300, a = u * 9 * PI * 2, rr = (1 - u) * 0.62 + 0.04; pts.push([tx + Math.cos(a) * rr, 0.25 + u * 2.05, tz + Math.sin(a) * rr, Math.random(), [1, 0.78, 0.45]]); }
    const led = ledPoints(c, g, pts, { size: 0.05, gain: 2.2 }); led.material.uniforms.uOn.value = 2; r.dress.leds.push(led); }
  prop(c, r, g, X, 'ph_wooden_bookshelf_worn', x1 - 0.3, -4.4, { h: 2.2, ry: -PI / 2, r: 0.5 });
  // seating angled at the window, a coffee table, a rug, lamps that are the light
  prop(c, r, g, X, 'ph_sofa_02', 8.2, -4.2, { len: 2.1, ry: PI - 0.35, r: 0.9 }); prop(c, r, g, X, 'ph_ArmChair_01', 12.6, -4.6, { h: 1.0, ry: PI + 0.5, r: 0.6 });
  prop(c, r, g, X, 'ph_coffee_table_round_01', 10.2, -4.9, { len: 1.0, r: 0.6 });
  { const rug = c.canvasTex(512, 384, (q, w, h) => { q.fillStyle = '#5a1a1e'; q.fillRect(0, 0, w, h); q.strokeStyle = '#c8a040'; q.lineWidth = 10; q.strokeRect(18, 18, w - 36, h - 36); q.strokeStyle = '#1d2a4a'; q.lineWidth = 22; q.strokeRect(46, 46, w - 92, h - 92); for (let i = 0; i < 9; i++) eyeFlower(q, 110 + (i % 3) * 146, 110 + Math.floor(i / 3) * 82, 22); });
    const rm = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.0), new THREE.MeshStandardMaterial({ map: rug, roughness: 0.95 })); rm.rotation.x = -PI / 2; rm.position.set(10.2, 0.012, -4.6); g.add(rm); }
  [[7.0, -4.0, 0xffb060], [13.6, -5.6, 0xffc070]].forEach(([x, z, col]) => { prop(c, r, g, X, 'nyb_loft_lamp', x, z, { h: 1.6, r: 0.25 }); const L = new THREE.PointLight(col, 4.5, 6, 1.8); L.position.set(x, 1.5, z); g.add(L); });
  // twenty small things (Astra's list), each a little mesh on the coffee table, sill and mantel
  const small = [[10.0, 0.47, -4.9, 'mug', 0xb4161e], [10.35, 0.47, -4.75, 'mug', 0x2962ff], [10.2, 0.46, -5.15, 'bowl', 0xf08a20], [9.85, 0.45, -5.05, 'book', 0x1d2a4a], [10.55, 0.45, -5.0, 'plate', 0xf2ece0],
    [10.45, 0.48, -4.6, 'dreidel', 0x2962ff], [9.95, 0.45, -4.65, 'gelt', 0xd8a640], [10.6, 0.45, -5.25, 'keys', 0x2962ff], [9.75, 0.45, -4.85, 'glasses', 0x111111], [10.3, 0.45, -4.5, 'card', 0xf2ebdd]];
  small.forEach(([x, y, z, k, col]) => { let m;
    if (k === 'mug') m = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.1, 16), std(c, col, { roughness: 0.4 }));
    else if (k === 'bowl') { m = new THREE.Group(); m.add(new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 8, 0, PI * 2, PI / 2, PI / 2), std(c, 0xf2ece0, { roughness: 0.3, side: THREE.DoubleSide }))); for (let i = 0; i < 5; i++) m.add(new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), std(c, col, { roughness: 0.6 })).translateX((i - 2) * 0.04).translateY(-0.03)); }
    else if (k === 'book') m = c.slab(0.2, 0.04, 0.14, std(c, col, { roughness: 0.8 }), 0, 0, 0);
    else if (k === 'plate') m = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.015, 20), std(c, col, { roughness: 0.3 }));
    else if (k === 'dreidel') m = new THREE.Mesh(new THREE.OctahedronGeometry(0.04, 0), std(c, col, { roughness: 0.5 }));
    else if (k === 'gelt') m = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.008, 16), std(c, col, { metalness: 1, roughness: 0.3 }));
    else if (k === 'card') m = c.slab(0.12, 0.002, 0.16, std(c, col), 0, 0, 0);
    else m = c.slab(0.08, 0.02, 0.04, std(c, col, { metalness: 0.6 }), 0, 0, 0);
    m.position.set(x, y, z); g.add(m); });
  // latkes on the plate, a ceramic menorah on the radiator shelf, a ribbon spool
  for (let i = 0; i < 2; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.014, 12), std(c, 0xc88a3a, { roughness: 0.8 })); l.position.set(10.53 + i * 0.05, 0.47, -5.0 + i * 0.03); g.add(l); }
  // the city is cool outside the window; warm inside; the old ceiling floodlights are gone (rooms.js)
  r.apartmentBuilt = true;
}
// ---------- the real Rockefeller Plaza, at 1:1 (round six, 2026-11-16) ----------
// MLow: "this still doesn't look like Rockefeller Plaza or the tree there, because that is way more massive, and the layout
// of the plaza and ice skating rink and buildings are different." Until v5 the tree stood 8 m past the rope between two
// shopfronts, with a photograph behind it. Now one model of the real place, in metres, is shared by the three rooms that
// stand in it, each at its own spot in the plan: the Channel Gardens (you among the beds, the tree seventy metres off at the
// end of them), the rink (you on the ice, Prometheus and the tree over the far end), and the lighting (you at the rail where
// the gardens drop into the sunken plaza). It is drawn only from the room you are in (the neighbours stand where it would be).
// Plaza frame: px across (0 on the axis of the gardens), pz along it (0 at the east lip of the sunken plaza, negative toward
// 30 Rock), py up from street level. From the plans: the gardens 60 ft wide between La Maison Francaise and the British
// Empire Building, six storeys; the sunken plaza a storey down, the rink about 59 by 122 ft; Prometheus, about 18 ft, gilded,
// on the west wall over his pool inside the zodiac ring; the tree on the upper plaza behind him (82 ft this year); flags on
// poles round the rim; Rockefeller Plaza, the private street; then 30 Rockefeller Plaza, 850 ft, its narrow east face toward
// the gardens, stepping in as it climbs, floodlit at the crown.
const RP = { PW: 19.0, PL: 37.2, PD: 4.6, TZ: -44.6, TH: 25, TR: 6.9, ST: [-50.5, -58.5], ROCK: -60, RIM: 6.4 };
const RPU = { t: { value: 0 } };
const FMAT = {};
// a facade in light, not texture: limestone piers and window strips computed from world position, so a 260 m tower is crisp
// at any distance and costs one draw; floors lit at random, a warm ground floor of shops, floodlight at the foot and crown;
// uLevel follows the room's dress level, so the countdown takes the city down with the plaza
function plazaFacade(c, r, key, o) {
  const id = r.id + key; if (FMAT[id]) return FMAT[id];
  const { THREE } = c, p = Object.assign({ tone: [0.8, 0.75, 0.66], bay: 1.8, pier: 0.5, floor: 3.8, lit: 0.42, flood: 0.12, top: 300, topGlow: 0, ground: 0, base: 0, warm: [1, 0.74, 0.46], seed: 1 }, o);
  const m = new THREE.ShaderMaterial({ fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTone: { value: new THREE.Color(...p.tone) }, uWarm: { value: new THREE.Color(...p.warm) }, uBay: { value: p.bay }, uPier: { value: p.pier }, uFloor: { value: p.floor },
      uLit: { value: p.lit }, uFlood: { value: p.flood }, uTop: { value: p.top }, uTopGlow: { value: p.topGlow }, uGround: { value: p.ground }, uBase: { value: p.base }, uLevel: { value: 1 }, uSeed: { value: p.seed } }]),
    vertexShader: `varying vec3 vW, vN;
      #include <fog_pars_vertex>
      void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
      }`,
    fragmentShader: `uniform vec3 uTone, uWarm; uniform float uBay, uPier, uFloor, uLit, uFlood, uTop, uTopGlow, uGround, uBase, uLevel, uSeed; varying vec3 vW, vN;
      #include <fog_pars_fragment>
      float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed * 17.13) * 43758.5453); }
      void main(){
        vec3 n = normalize(vN), col; float yy = vW.y - uBase;
        if (abs(n.y) > 0.5) col = uTone * 0.04 * (0.4 + 0.6 * uLevel);
        else {
          float u = abs(n.z) > abs(n.x) ? vW.x : vW.z;
          float fu = u / uBay, xu = fract(fu), cu = floor(fu), fy = yy / uFloor, xy = fract(fy), cy = floor(fy), pw = uPier / uBay * 0.5;
          float win = smoothstep(pw - 0.02, pw + 0.02, xu) * smoothstep(1. - pw + 0.02, 1. - pw - 0.02, xu) * smoothstep(0.24, 0.28, xy) * smoothstep(0.86, 0.82, xy);
          float on = step(1. - uLit, h21(vec2(cu, cy) + n.xz * 31.));
          float flood = uFlood * (0.3 + 0.7 * exp(-max(yy, 0.) / 16.)) + uTopGlow * smoothstep(uTop - 75., uTop - 4., yy);
          vec3 stone = uTone * (0.05 + flood) * (0.35 + 0.65 * uLevel);
          float fr = pow(1. - abs(dot(normalize(cameraPosition - vW), n)), 3.);
          vec3 glass = vec3(0.01, 0.014, 0.024) + vec3(0.05, 0.06, 0.09) * fr;
          vec3 lamp = uWarm * (0.42 + 0.7 * h21(vec2(cy, cu) + 7.)) * uLevel;
          float strip = smoothstep(pw - 0.02, pw + 0.02, xu) * smoothstep(1. - pw + 0.02, 1. - pw - 0.02, xu);   // the Rockefeller signature: piers run unbroken to the top, dark spandrels between the windows
          vec3 span = uTone * (0.03 + flood * 0.35) * (0.35 + 0.65 * uLevel) + vec3(0.012, 0.012, 0.016);
          col = mix(stone, mix(span, mix(glass, lamp, on), win), strip);
          // far off, the facade becomes its own average, so the stripes never shimmer
          float fade = smoothstep(uBay * 40., uBay * 150., length(cameraPosition - vW));
          col = mix(col, stone * 0.55 + mix(glass, uWarm * 0.75 * uLevel, uLit) * 0.32, fade);
          if (uGround > 0. && yy > 0. && yy < uGround) {   // the ground floor: lit shop windows between granite piers
            float s = fract(u / 4.2), sh = smoothstep(0.07, 0.1, s) * smoothstep(0.93, 0.9, s) * smoothstep(0.35, 0.45, yy) * smoothstep(uGround - 1.0, uGround - 1.2, yy);
            col = mix(uTone * 0.2 * (0.4 + 0.6 * uLevel), uWarm * 1.1 * uLevel * (0.75 + 0.5 * h21(vec2(floor(u / 4.2), 3.))), sh);
          }
        }
        gl_FragColor = vec4(col, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }` });
  r.dress.mats.push({ userData: { e0: 1 }, set emissiveIntensity(v) { m.uniforms.uLevel.value = v; } });
  return (FMAT[id] = m);
}
const FLAGTEX = [];
function flagTex(c, i) {
  const D8 = [
    (q, w, h) => { ['#0d3a8a', '#f4f0e6', '#c8102e'].forEach((k, j) => { q.fillStyle = k; q.fillRect(j * w / 3, 0, w / 3, h); }); },
    (q, w, h) => { ['#111111', '#d6a640', '#b0102a'].forEach((k, j) => { q.fillStyle = k; q.fillRect(0, j * h / 3, w, h / 3); }); },
    (q, w, h) => { q.fillStyle = '#2962ff'; q.fillRect(0, 0, w, h); eyeFlower(q, w / 2, h / 2, h * 0.42); },
    (q, w, h) => { q.fillStyle = '#0d5a2a'; q.fillRect(0, 0, w, h); q.fillStyle = '#f4f0e6'; q.fillRect(0, h * 0.4, w, h * 0.2); q.fillRect(w * 0.3, 0, w * 0.12, h); },
    (q, w, h) => { for (let j = 0; j < 7; j++) { q.fillStyle = j % 2 ? '#f4f0e6' : '#c8102e'; q.fillRect(0, j * h / 7, w, h / 7 + 1); } q.fillStyle = '#0d1b4a'; q.fillRect(0, 0, w * 0.4, h * 0.57); },
    (q, w, h) => { q.fillStyle = '#f4f0e6'; q.fillRect(0, 0, w, h); q.fillStyle = '#c8102e'; q.beginPath(); q.arc(w / 2, h / 2, h * 0.28, 0, PI * 2); q.fill(); },
    (q, w, h) => { ['#ff7a1a', '#f4f0e6', '#0d8a4a'].forEach((k, j) => { q.fillStyle = k; q.fillRect(j * w / 3, 0, w / 3, h); }); },
    (q, w, h) => { q.fillStyle = '#0d0d0d'; q.fillRect(0, 0, w, h); q.fillStyle = '#f5c542'; q.font = `900 ${h * 0.3}px Georgia, serif`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('N3W', w / 2, h * 0.36); q.fillText('YORKERS', w / 2, h * 0.7); },
    (q, w, h) => { ['#5aa0e8', '#f4f0e6', '#5aa0e8'].forEach((k, j) => { q.fillStyle = k; q.fillRect(0, j * h / 3, w, h / 3); }); q.fillStyle = '#d6a640'; q.beginPath(); q.arc(w / 2, h / 2, h * 0.12, 0, PI * 2); q.fill(); },
    (q, w, h) => { q.fillStyle = '#b0102a'; q.fillRect(0, 0, w, h); q.fillStyle = '#f4f0e6'; q.fillRect(w * 0.42, 0, w * 0.16, h); q.fillRect(0, h * 0.38, w, h * 0.24); },
  ];
  return FLAGTEX[i] ||= c.canvasTex(192, 128, D8[i % D8.length]);
}

function realPlaza(c, r, g, X, o) {
  const { THREE } = c, { PW, PL, PD, RIM } = RP, dz = o.dz, dy = o.dy || 0;
  const G = new THREE.Group(); g.add(G); r.plaza = G;
  c.tick((t, dt, P, ri) => { const on = ri === r.i; if (G.visible !== on) G.visible = on; if (on) RPU.t.value = t; });
  // the plaza frame to the room's: x across, z along, y up
  const RX = (px) => W / 2 + px, RZ = (pz) => pz + dz, RY = (py) => py + dy;
  // the room's own walkable band (and the neighbours' beside it): below 10.2 m nothing of the plaza may stand there
  const bz0 = -D / 2 - 0.6 - dz, bz1 = D / 2 + 0.6 - dz, inBand = (a, b) => Math.max(a, b) > bz0 && Math.min(a, b) < bz1;
  const BOX = {}, add = (key, px0, px1, pz0, pz1, py0, py1) => { if (px1 - px0 < 0.01 || Math.abs(pz1 - pz0) < 0.01 || py1 - py0 < 0.01) return;
    const gg = new THREE.BoxGeometry(px1 - px0, py1 - py0, Math.abs(pz1 - pz0)); gg.translate(RX((px0 + px1) / 2), RY((py0 + py1) / 2), RZ((pz0 + pz1) / 2)); (BOX[key] ||= []).push(gg); };
  // a mass that respects the band: inside it only the part above the room's 10 m facades
  const mass = (key, px0, px1, pzA, pzB, py0, py1) => { const a = Math.min(pzA, pzB), b = Math.max(pzA, pzB);
    if (!inBand(a, b)) { add(key, px0, px1, a, b, py0, py1); return; }
    if (a < bz0) add(key, px0, px1, a, bz0, py0, py1);
    if (b > bz1) add(key, px0, px1, bz1, b, py0, py1);
    const lo = Math.max(py0, 10.2 - dy); add(key, px0, px1, Math.max(a, bz0), Math.min(b, bz1), lo, py1); };
  const mats = {
    rock: plazaFacade(c, r, 'rock', { tone: [0.82, 0.77, 0.67], bay: 1.6, pier: 1.02, floor: 3.9, lit: 0.2, flood: 0.16, top: 259, topGlow: 0.85, base: dy, seed: 3 }),
    mid: plazaFacade(c, r, 'mid', { tone: [0.76, 0.72, 0.64], bay: 1.9, pier: 0.95, floor: 3.7, lit: 0.26, flood: 0.12, ground: 5.0, base: dy, seed: 5 }),
    chan: plazaFacade(c, r, 'chan', { tone: [0.84, 0.79, 0.68], bay: 2.5, pier: 1.2, floor: 4.0, lit: 0.34, flood: 0.11, ground: 5.4, base: dy, seed: 7 }),
    far: plazaFacade(c, r, 'far', { tone: [0.5, 0.52, 0.58], bay: 2.2, pier: 0.9, floor: 3.6, lit: 0.22, flood: 0.04, base: dy, seed: 9 }),
  };
  const gran = c.surf('acg_granite005a', 1.4, 0x7a7680), pave = c.surf('acg_pavingstones128', 2.6, 0x8a867e), asph = c.surf('acg_asphalt033', 4, 0x45454c);
  const bronze = std(c, 0xb08a40, { metalness: 1, roughness: 0.3 }), gold = std(c, 0xe0b048, { metalness: 1, roughness: 0.18, emissive: 0x3a2400, emissiveIntensity: 0.6 });
  const slabP = (mat, px0, px1, pz0, pz1, py0, py1) => { const m = c.slab(px1 - px0, py1 - py0, Math.abs(pz1 - pz0), mat, RX((px0 + px1) / 2), RY((py0 + py1) / 2), RZ((pz0 + pz1) / 2)); G.add(m); return m; };
  // and its paving, which must also keep out of the band
  const ground = (mat, px0, px1, pzA, pzB, py0, py1) => { const a = Math.min(pzA, pzB), b = Math.max(pzA, pzB);
    if (!inBand(a, b)) return slabP(mat, px0, px1, a, b, py0, py1); if (a < bz0) slabP(mat, px0, px1, a, bz0, py0, py1); if (b > bz1) slabP(mat, px0, px1, bz1, b, py0, py1); };

  // ---- the sunken plaza: walls, ice, the rink-level restaurant windows, the parapet, the flags ----
  const e = PW / 2, rim = e + RIM;
  const iceFrom = o.iceFrom ?? 0;
  if (iceFrom > -PL) { const T = c.canvasTex(512, 1024, (q, w, h) => { q.fillStyle = '#c4ccd6'; q.fillRect(0, 0, w, h); for (let i = 0; i < 700; i++) { q.strokeStyle = `rgba(255,255,255,${0.05 + Math.random() * 0.2})`; q.lineWidth = 0.6 + Math.random() * 1.4; q.beginPath(); const x = Math.random() * w, y = Math.random() * h, a = Math.random() * 6.28, L = 30 + Math.random() * 160; q.moveTo(x, y); q.quadraticCurveTo(x + Math.cos(a + 1) * L * 0.5, y + Math.sin(a + 1) * L * 0.5, x + Math.cos(a) * L, y + Math.sin(a) * L); q.stroke(); } });
    const ice = new THREE.Mesh(new THREE.PlaneGeometry(PW, PL + iceFrom), new THREE.MeshStandardMaterial({ map: T, color: 0xdfe8f2, roughness: 0.14, metalness: 0.35, envMapIntensity: 1.6 }));
    ice.rotation.x = -PI / 2; ice.position.set(RX(0), RY(-PD + 0.01), RZ((iceFrom - PL) / 2)); G.add(ice);
    // the boards: white with a brass cap, round the ice
    const bd = std(c, 0xf0f0ee, { roughness: 0.45 });
    for (const s of [-1, 1]) ground(bd, s * (e - 0.6) - 0.06, s * (e - 0.6) + 0.06, Math.min(iceFrom, -0.4), -PL + 0.4, -PD, -PD + 1.05);
    slabP(bd, -e + 0.6, e - 0.6, -PL + 0.46, -PL + 0.34, -PD, -PD + 1.05); }
  for (const s of [-1, 1]) {   // north and south walls of the pit, granite, a storey deep, with the rink restaurants in them
    ground(gran, s > 0 ? e : -e - 0.6, s > 0 ? e + 0.6 : -e, 0, -PL, -PD, 0);
    ground(gran, s > 0 ? e : -e - 0.6, s > 0 ? e + 0.6 : -e, 0.3, -PL, 0, 0.92);   // the parapet you lean on
    ground(bronze, s > 0 ? e + 0.24 : -e - 0.36, s > 0 ? e + 0.36 : -e - 0.24, 0.3, -PL, 0.92, 1.0);
  }
  slabP(gran, -e - 0.6, e + 0.6, -PL, -PL - 0.8, -PD, 0);                                     // the west wall, under the tree
  slabP(gran, -e - 0.6, e + 0.6, -PL - 0.2, -PL - 0.8, 0, 0.92); slabP(bronze, -e, e, -PL - 0.44, -PL - 0.56, 0.92, 1.0);
  if (o.eastLip) { slabP(gran, -e - 0.6, e + 0.6, 0.6, 0, -PD, 0); slabP(gran, -e - 0.6, e + 0.6, 0.6, 0.2, 0, 0.92); }
  { const B = Builder(c);   // the restaurants at rink level, ray traced rooms behind the glass (arch.part.js)
    for (const s of [-1, 1]) { const x = RX(s * e), F = { O: new THREE.Vector3(x, 0, RZ(0)), T: new THREE.Vector3(0, 0, -1), N: new THREE.Vector3(-s, 0, 0) };
      for (let u = 2.4; u < PL - 1.5; u += 3.9) { if (inBand(-u - 1.6, -u + 1.6)) continue; B.window(F, u, RY(-PD + 1.75), 0.02, 3.1, 2.5, [3, 5, 2, 4][Math.round(u) % 4], 0.85, 0, 3.2); } }
    if (o.rinkWalls) for (const x of [0.13, W - 0.38]) { const s = x < 1 ? -1 : 1, F = { O: new THREE.Vector3(x, 0, -D / 2), T: new THREE.Vector3(0, 0, 1), N: new THREE.Vector3(-s, 0, 0) };
      for (const [u, w] of [[2.0, 3.0], [5.6, 3.0], [8.6, 2.6], [14.6, 1.8]]) B.window(F, u, 1.75, 0.02, w, 2.4, [5, 3, 4, 2][Math.round(u) % 4], 0.85, 0, 3.2); }
    B.finish(G); }
  // the flags: a ring of poles round the rim, each flag waving on its own phase (one draw per design)
  { const poles = [], fl = {}, plane = new THREE.PlaneGeometry(1.5, 0.98, 10, 4).translate(0.75, 0, 0);
    const aU = new Float32Array(plane.attributes.position.count); for (let i = 0; i < aU.length; i++) aU[i] = plane.attributes.position.getX(i) / 1.5; plane.setAttribute('aU', new THREE.BufferAttribute(aU, 1));
    let k = 0; const pole = (px, pz, ry) => { poles.push([px, pz]); const q = plane.clone(); q.rotateY(ry); q.translate(RX(px), RY(6.4), RZ(pz)); (fl[k % 10] ||= []).push(q); k++; };
    for (const s of [-1, 1]) for (let pz = -1.2; pz > -PL; pz -= 2.3) pole(s * (e + 1.1), pz, s > 0 ? -0.6 : PI + 0.6);
    const pm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.05, 7.1, 6), std(c, 0xd8d8dc, { metalness: 0.8, roughness: 0.3 }), poles.length);
    const fin = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 8, 6), gold, poles.length), m4 = new THREE.Matrix4();
    poles.forEach(([px, pz], i) => { m4.makeTranslation(RX(px), RY(3.55), RZ(pz)); pm.setMatrixAt(i, m4); m4.makeTranslation(RX(px), RY(7.15), RZ(pz)); fin.setMatrixAt(i, m4); }); G.add(pm, fin);
    for (const j in fl) { const fm = new THREE.MeshStandardMaterial({ map: flagTex(c, +j), side: THREE.DoubleSide, roughness: 0.85, emissive: 0xffffff, emissiveMap: flagTex(c, +j), emissiveIntensity: 0.08 });
      fm.onBeforeCompile = (s) => { s.uniforms.uT = RPU.t; s.vertexShader = 'uniform float uT; attribute float aU;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed += normal * sin(aU * 7.0 - uT * 3.1 + position.x * 0.41 + position.z * 0.29) * 0.12 * aU; transformed.y -= aU * aU * 0.12;'); };
      const mm = new THREE.Mesh(mergeGeometries(fl[j]), fm); G.add(mm); } }

  // ---- the street level round the pit: promenade, the terrace under the tree, the private street, the sidewalk ----
  for (const s of [-1, 1]) ground(pave, s > 0 ? e + 0.6 : -rim, s > 0 ? rim : -e - 0.6, 0.6, -PL - 0.8, -PD, 0);
  slabP(pave, -rim - 12, rim + 12, -PL - 0.8, RP.ST[0], -PD, 0);
  slabP(asph, -rim - 60, rim + 60, RP.ST[0], RP.ST[1], -0.6, -0.12);
  for (const z of RP.ST) slabP(gran, -rim - 60, rim + 60, z + 0.15, z - 0.15, -0.6, 0.02);
  slabP(pave, -rim - 60, rim + 60, RP.ST[1], RP.ROCK - 0.2, -0.6, 0);
  if (o.terrace) ground(pave, -rim, rim, o.terrace[0], o.terrace[1], -PD, 0);   // the lip where the gardens meet the pit

  // ---- the buildings ----
  // the Channel Gardens pair: six storeys and a roof garden storey set back, either side of the gardens, 200 ft long
  for (const s of [-1, 1]) { const a = s > 0 ? 9.9 : -32, b = s > 0 ? 32 : -9.9; mass('chan', a, b, 2, 62, 0, 26.5); mass('chan', s > 0 ? 12.5 : -29.5, s > 0 ? 29.5 : -12.5, 4.5, 59.5, 26.5, 31.5); }
  // round the sunken plaza: the low wings at the rim, the taller blocks behind them
  for (const s of [-1, 1]) { mass('mid', s > 0 ? rim : -38, s > 0 ? 38 : -rim, 2, -49, 0, 22); mass('mid', s > 0 ? 30 : -78, s > 0 ? 78 : -30, -6, -52, 0, 64); }
  // 30 Rockefeller Plaza: the podium, then the slab, its narrow east face toward the gardens, stepping in as it climbs
  const RK = RP.ROCK; mass('rock', -46, 46, RK, RK - 40, 0, 24);
  [[29, 72], [25, 118], [21.5, 168], [18.5, 214], [15.5, 259]].forEach(([hw, h], i) => mass('rock', -hw, hw, RK - 2 - i * 0.6, RK - 104 + i * 6, 0, h));
  // the city behind and either side
  { let s = 41; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 46; i++) { const a = -PI * 0.92 + rnd() * PI * 0.84, d = 170 + rnd() * 260, px = Math.sin(a) * d * 1.3, pz = -60 - Math.cos(a) * d * 0.25 - d * 0.55, w = 18 + rnd() * 34, h = 50 + rnd() * rnd() * 230;
      if (Math.abs(px) < 60 && pz > -200) continue; mass('far', px - w / 2, px + w / 2, pz + w / 2, pz - w / 2, 0, h); } }
  for (const k in BOX) { const m = new THREE.Mesh(mergeGeometries(BOX[k]), mats[k]); m.frustumCulled = false; G.add(m); }
  // 30 Rock's front door: three tall lit doorways, a limestone frame, and over it a gilded relief (an eye flower, here)
  { const fz = RZ(RK) + 0.06, dm = new THREE.MeshBasicMaterial({ color: 0xffe2b0, toneMapped: false }); dm.userData.e0 = 0;
    for (const px of [-3.1, 0, 3.1]) { const d = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 6.2), dm); d.position.set(RX(px), RY(3.1), fz); G.add(d); }
    G.add(c.slab(10.4, 0.6, 0.5, std(c, 0xcfc6b4, { roughness: 0.7 }), RX(0), RY(6.6), fz + 0.2));
    const rel = c.canvasTex(512, 256, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7a5a1a'); gr.addColorStop(1, '#3a2a0a'); q.fillStyle = gr; q.fillRect(0, 0, w, h); q.strokeStyle = '#f0c860'; q.lineWidth = 5;
      for (let i = 0; i < 9; i++) { q.beginPath(); q.moveTo(w / 2, h * 0.55); q.lineTo(w / 2 + Math.cos(-PI * i / 8) * w * 0.48, h * 0.55 + Math.sin(-PI * i / 8) * h * 0.5); q.stroke(); } eyeFlower(q, w / 2, h * 0.55, h * 0.3, '#f6dc8a', '#c8902a'); });
    const rm = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshStandardMaterial({ map: rel, metalness: 0.7, roughness: 0.35, emissive: 0xffc860, emissiveMap: rel, emissiveIntensity: 0.35 })); rm.position.set(RX(0), RY(10.2), fz); G.add(rm);
    // the crown: the observation decks' glass, lit, and the aviation light
    const deck = new THREE.MeshBasicMaterial({ color: 0xfff0d8, toneMapped: false, transparent: true, opacity: 0.8 });
    for (const y of [246, 252.5, 258.6]) { const b = new THREE.Mesh(new THREE.BoxGeometry(31.4, 0.35, 0.2), deck); b.position.set(RX(0), RY(y), RZ(RK - 2 - 4 * 0.6) + 0.2); G.add(b); }
    const av = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,40,30,.95)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); av.scale.setScalar(5); av.position.set(RX(0), RY(266), RZ(RK - 40)); G.add(av);
    G.add(c.slab(0.5, 7, 0.5, std(c, 0x333338), RX(0), RY(262.5), RZ(RK - 40)));
    c.tick((t) => { av.material.opacity = Math.sin(t * 2.6) > 0.2 ? 1 : 0.08; }); }

  // ---- Prometheus over his pool, in the zodiac ring, floodlit gold ----
  { const pz = -PL + 0.9;
    slabP(gran, -7.5, 7.5, -PL + 3.4, -PL, -PD, -PD + 0.55); slabP(std(c, 0x0a1622, { roughness: 0.05, metalness: 0.7 }), -7.2, 7.2, -PL + 3.1, -PL + 0.2, -PD + 0.5, -PD + 0.52);
    slabP(gran, -2.4, 2.4, -PL + 2.0, -PL, -PD, -PD + 1.7);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.7, 0.15, 10, 72), gold); ring.position.set(RX(0), RY(-PD + 4.7), RZ(-PL + 0.5)); G.add(ring);
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2, d = new THREE.Mesh(new THREE.CircleGeometry(0.34, 18), gold); d.position.set(RX(Math.cos(a) * 3.7), RY(-PD + 4.7 + Math.sin(a) * 3.7), RZ(-PL + 0.68)); G.add(d); }
    const prom = c.glb('nyb_rink_prometheus', { h: 5.4, x: RX(0), y: RY(-PD + 1.7), z: RZ(pz), parent: G, shadow: false, onload: (gg) => gg.traverse((q) => { if (q.isMesh && q.material) { q.material = q.material.clone(); q.material.emissive = new THREE.Color(0xffb040); q.material.emissiveIntensity = 0.22; } }) });
    c.clickable(prom, () => c.egg('prometheus', 'Prometheus, gilded bronze, about eighteen feet, by Paul Manship, 1934, in his ring of the zodiac over the rink. He brought fire to humanity. The ice department has concerns.'), 'Prometheus');
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,190,90,.55)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0.55 })); glow.scale.set(11, 9, 1); glow.position.set(RX(0), RY(-PD + 4.4), RZ(-PL + 1.6)); G.add(glow); }

  // ---- the tree on the upper plaza, guyed, with its own lights following the one you lit ----
  r.treeZ = RZ(RP.TZ); r.treeY = RY(0);
  if (o.tree) { const T = buildTree(c, G, { H: RP.TH, R: RP.TR, x: RX(0), y: RY(0), z: r.treeZ, lights: o.lights || 18000, size: 0.26 });
    T.group.traverse((q) => { const u = q.material && q.material.uniforms; if (u && u.uGain && q.isPoints && q.geometry.attributes.position.count > 5000) u.uGain.value *= 0.8; });
    let v = LT.tree ? 1.04 : 0; T.set(v); c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const want = LT.tree ? 1.04 : 0; if (Math.abs(want - v) > 0.001) { v += Math.sign(want - v) * Math.min(Math.abs(want - v), dt * 0.35); T.set(v); } }); r.plazaTree = T; }
  { const wire = []; for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2 + 0.3; wire.push(RX(Math.cos(a) * 1.2), RY(RP.TH * 0.62), r.treeZ + Math.sin(a) * 1.2, RX(Math.cos(a) * 11), RY(0), r.treeZ + Math.sin(a) * 11 * 0.55); }
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wire, 3)); G.add(new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: 0x3a3a40, transparent: true, opacity: 0.6 }))); }

  // ---- the Channel Gardens beyond the room: beds down the middle, a pool in each, lit evergreens ----
  if (o.gardens) { const [g0, g1] = o.gardens, soil = std(c, 0x1e1812, { roughness: 1 }), water = std(c, 0x0a1830, { roughness: 0.04, metalness: 0.6 }), tw = [], sh = [];
    for (let pz = g0; pz < g1 - 6; pz += 8.6) { if (inBand(pz, pz + 7.2)) continue;
      slabP(gran, -3, 3, pz, pz + 7.2, 0, 0.72); slabP(soil, -2.85, 2.85, pz + 0.15, pz + 7.05, 0.72, 0.76); slabP(water, -0.8, 0.8, pz + 1, pz + 6.2, 0.74, 0.78);
      for (let i = 0; i < 14; i++) { const px = (i % 2 ? 1 : -1) * (1.3 + Math.random() * 1.3), z = pz + 0.6 + Math.random() * 6; sh.push([px, z, 0.7 + Math.random() * 0.8]); for (let k = 0; k < 6; k++) tw.push([RX(px + (Math.random() - 0.5) * 0.6), RY(0.9 + Math.random() * 1.0), RZ(z + (Math.random() - 0.5) * 0.6), Math.random(), WARM[(Math.random() * 4) | 0]]); } }
    if (sh.length) { const im = new THREE.InstancedMesh(new THREE.ConeGeometry(0.34, 1, 8), std(c, 0x163a22, { roughness: 0.9 }), sh.length), m4 = new THREE.Matrix4(); sh.forEach(([px, z, h], i) => { m4.makeScale(1, h, 1).setPosition(RX(px), RY(0.76 + h / 2), RZ(z)); im.setMatrixAt(i, m4); }); G.add(im);
      ledPoints(c, G, tw, { size: 0.08, gain: 1.8 }).material.uniforms.uOn.value = 1.1; } }

  // ---- people: skaters on the far ice, New Yorkers along the rails ----
  const sk = [];
  for (let i = 0; i < (o.skaters || 0); i++) { const s = new THREE.Group(); G.add(s); const m = c.glb(i % 3 === 2 ? 'lt_wobbler' : 'lt_skater', { h: 1.75, parent: s }); sk.push({ s, m, ph: i / (o.skaters) * PI * 2, w: 0.16 + (i % 3) * 0.035, ax: e - 2.6 - (i % 2) * 1.4, az: (o.ska ?? PL / 2 - 4) - (i % 3) * 1.2 }); }
  const rail = [];
  for (let i = 0; i < (o.railers || 0); i++) { const side = i % 2 ? 1 : -1, pz = -3 - (i * 7.3) % (PL - 6); if (inBand(pz - 1, pz + 1)) continue;
    const ex = extra(c, G, RX(side * (e + 0.75)), RZ(pz), { col: [0x3a3a4a, 0x6a2a2a, 0x2a3a5a, 0x4a4a2a][i % 4], ry: side > 0 ? -PI / 2 : PI / 2, pool: 'night' }); ex.position.y = RY(0); rail.push(ex); }
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; sk.forEach((q) => { if (!q.go && q.m.userData.play) { q.m.userData.play('walk', 1.1); q.go = 1; } const a = t * q.w + q.ph;
    q.s.position.set(RX(Math.cos(a) * q.ax), RY(-PD), RZ((o.skc ?? -PL / 2) + Math.sin(a) * q.az)); q.s.rotation.y = Math.atan2(-Math.sin(a) * q.ax, Math.cos(a) * q.az); }); });
  return G;
}
