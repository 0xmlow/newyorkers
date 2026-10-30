// The room kit shared by the three 2026-10-30 galleries (THE WRAPPED WING, N3W YORKERS SPACE PROGRAM, TAKE A NUMBER).
// Lifted from LIVE FROM THE SEWERS' build.js and made generic: a set = plate + walls + cast + props + one trick.
// Every room is W by D metres, its north side opens onto a photograph rebuilt from its depth map, the New Yorkers of
// the census hang on the south and side walls, and the room's own function (ROOM[id]) adds the trick.
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { W, D, H_IN, PORTAL } from './rooms.js';

export const PI = Math.PI;
export const INK = ['#f5c542', '#ff4fa3', '#22d3ee', '#3b82f6', '#ffffff', '#ff7a1a'];
export const DZ1 = 2, DZ2 = 5.6, DH = 3.6;
export { Reflector };

export const basic = (c, color, o = {}) => new c.THREE.MeshBasicMaterial({ color, toneMapped: false, ...o });
export const std = (c, color, o = {}) => new c.THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
export const here = (r, ri) => ri === r.i;
export const local = (r, P) => ({ x: P.x - r.x0, z: P.z });

// the shell: floor, ceiling, walls with the side doors, the signs over the doors, the plate, the hang, the rope
export function shell(c, r, { SLOTS = {}, PROPS = {}, ROOM = {}, dressing } = {}) {
  const { THREE, scene } = c;
  const g = r.group = new THREE.Group(); g.position.x = r.x0; scene.add(g);
  const X = (x) => r.x0 + x;
  const mats = matsFor(c, r);
  const HT = r.outdoor ? (r.low ? 4 : 10) : (r.tall || H_IN);

  if (!r.noFloor) g.add(c.slab(W, 0.1, D, mats.floor, W / 2, -0.05, 0));
  if (r.ceil && !r.outdoor && !r.well) g.add(c.slab(W, 0.1, D, mats.ceil, W / 2, HT + 0.05, 0));
  if (r.ceil && r.well) {
    const [wx, wz, s] = r.well, a = wx - s / 2, b = wx + s / 2, n = wz - s / 2, so = wz + s / 2, y = HT + 0.05;
    g.add(c.slab(a, 0.1, D, mats.ceil, a / 2, y, 0)); g.add(c.slab(W - b, 0.1, D, mats.ceil, b + (W - b) / 2, y, 0));
    g.add(c.slab(s, 0.1, n + D / 2, mats.ceil, wx, y, (-D / 2 + n) / 2)); g.add(c.slab(s, 0.1, D / 2 - so, mats.ceil, wx, y, (so + D / 2) / 2));
  }
  const pw = PORTAL.w, px1 = (W - pw) / 2, px2 = (W + pw) / 2, NH = r.low ? 1.1 : HT;
  g.add(c.slab(W, HT, 0.24, mats.wall, W / 2, HT / 2, D / 2 + 0.12)); c.wall(X(0), D / 2, X(W), D / 2);
  g.add(c.slab(px1, NH, 0.24, mats.wall, px1 / 2, NH / 2, -D / 2 - 0.12));
  g.add(c.slab(px1, NH, 0.24, mats.wall, px2 + px1 / 2, NH / 2, -D / 2 - 0.12));
  c.wall(X(0), -D / 2, X(W), -D / 2);
  if (!r.outdoor) g.add(c.slab(pw, HT - PORTAL.h, 0.24, mats.wall, W / 2, PORTAL.h + (HT - PORTAL.h) / 2, -D / 2 - 0.12));
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
  if (r.last) sideWall(W, false); else sideWall(W - 0.25, true);
  const ds = { w: 2.6, h: 0.42, bg: '#0d0d0d', fg: '#f4ead2', border: '#f5c542' };
  if (r.i > 0) { const s = c.sign(`< ${r.prev}`, ds); s.position.set(0.15, DH + 0.45, (DZ1 + DZ2) / 2); s.rotation.y = PI / 2; g.add(s); }
  if (r.next) { const s = c.sign(`${r.next} >`, ds); s.position.set(W - 0.15, DH + 0.45, (DZ1 + DZ2) / 2); s.rotation.y = -PI / 2; g.add(s); }

  c.plate(r);
  const slots = (SLOTS[r.id] || slotsDefault)(r);
  r.cast.forEach((p, k) => { const s = slots[k]; if (!s) return; c.hang(p, s.x, s.y, s.z, s.ry, s.w || 1.3, s.honor ? 'gilt' : r.frame, g); });
  slate(c, r, g);
  if (!r.noRope) rope(c, r, g, X);
  else if (r.edge) c.wall(X(0), -D / 2 + 1.2, X(W), -D / 2 + 1.2);
  ROOM[r.id] && ROOM[r.id](c, r, g, X, mats);
  (PROPS[r.id] || []).forEach((q) => prop(c, r, g, X, ...q));
  dressing && dressing(c, r, g, X);
  return g;
}

export function matsFor(c, r) {
  const { THREE } = c, m = {};
  m.floor = c.surf(r.floor || 'terrazzo', r.floorRep || (r.floor === 'asphalt' ? 3 : 2.2), r.floorTint || (r.outdoor ? 0x6a6c76 : 0x9a9a9a));
  m.ceil = r.ceil ? c.surf(r.ceil, 3, r.ceilTint || 0x8a847a) : null;
  if ((window.WALLS || []).includes(r.id)) {
    const t = c.tex.load(`assets/walls/${r.id}.jpg`); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8;
    m.wall = new THREE.MeshStandardMaterial({ map: t, roughness: 0.82, color: r.muralTint || 0xffffff });
    m.wall.userData.repX = 10; m.wall.userData.repY = r.outdoor ? (r.low ? 4 : 10) : H_IN;
  } else if (r.outdoor) m.wall = c.surf(r.wall || 'brick', 2.4, r.wallTint || 0x6e6660);
  else m.wall = c.surf(r.wall || 'plaster', 2.4, r.wallTint);
  if (r.floor === 'asphalt') { m.floor.roughness = 0.3; m.floor.metalness = 0.3; }
  if (r.floor === 'marble' || r.floor === 'terrazzo') { m.floor.roughness = 0.35; }
  return m;
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
export function decal(c, w, h, draw, px = 256) { const t = c.canvasTex(Math.round(px * w / h), px, draw); return new c.THREE.Mesh(new c.THREE.PlaneGeometry(w, h), new c.THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); }
export function glowTex(c, col) { return c.canvasTex(128, 128, (q, w, h) => { const gr = q.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.2, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); }); }
export function glow(c, g, x, y, z, col = 'rgba(255,200,120,.9)', s = 0.6) {
  const f = new c.THREE.Sprite(new c.THREE.SpriteMaterial({ map: glowTex(c, col), transparent: true, depthWrite: false, toneMapped: false, blending: c.THREE.AdditiveBlending })); f.position.set(x, y, z); f.scale.set(s, s, 1); g.add(f); return f;
}
export function bulbs(c, g, x1, x2, y, z, n, col = 0xffe0a0) {
  const { THREE } = c, ms = [], on = basic(c, col), off = std(c, 0x3a3020, { roughness: 0.4 });
  const geo = new THREE.SphereGeometry(0.06, 10, 8);
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, on); m.position.set(x1 + (x2 - x1) * i / (n - 1), y, z); g.add(m); ms.push(m); }
  c.tick((t) => { const k = (t * 8) | 0; ms.forEach((m, i) => { m.material = (i + k) % 3 === 0 ? off : on; }); });
}
// an eye that watches you: petals, a white, an iris that slides toward the camera
export function watcher(c, g, x, y, z, ry, R = 0.5) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, y, z); o.rotation.y = ry; g.add(o);
  o.add(decal(c, R * 3.2, R * 3.2, (q, w, h) => eyeFlower(q, w / 2, h / 2, w / 2 * 0.98)));
  const white = new THREE.Mesh(new THREE.CircleGeometry(R * 0.62, 32), basic(c, 0xf4f4f4)); white.position.z = 0.01; o.add(white);
  const iris = new THREE.Group(); iris.position.z = 0.02; o.add(iris);
  iris.add(new THREE.Mesh(new THREE.CircleGeometry(R * 0.32, 32), basic(c, 0x1d4ed8)));
  const pu = new THREE.Mesh(new THREE.CircleGeometry(R * 0.15, 24), basic(c, 0x0b1020)); pu.position.z = 0.005; iris.add(pu);
  const v = new THREE.Vector3(), inv = new THREE.Matrix4();
  c.tick(() => { v.copy(c.camera.position); o.updateMatrixWorld(); inv.copy(o.matrixWorld).invert(); v.applyMatrix4(inv); const L = Math.hypot(v.x, v.y, v.z) || 1; iris.position.x = v.x / L * R * 0.3; iris.position.y = v.y / L * R * 0.3; });
  return o;
}
const HEAD = {};
// a simple New Yorker: a body, legs and an eye flower for a head. For crowds and lines.
export function extra(c, g, x, z, { seated = false, col = 0x3a4a6a, ry = 0, h = 1 } = {}) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, 0, z); o.rotation.y = ry; o.scale.setScalar(h); g.add(o);
  const hh = seated ? 0.45 : 0, body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.72, 12), std(c, col, { roughness: 0.8 })); body.position.y = hh + (seated ? 0.36 : 1.0); o.add(body);
  if (!seated) { const legs = c.slab(0.32, 0.64, 0.16, std(c, 0x1a1a22), 0, 0.32, 0); o.add(legs); }
  HEAD.t ||= c.canvasTex(256, 256, (q, w) => eyeFlower(q, w / 2, w / 2, w / 2 * 0.98));
  const head = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshStandardMaterial({ map: HEAD.t, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, roughness: 0.6 }));
  head.position.y = hh + (seated ? 0.98 : 1.62); o.add(head); o.userData.head = head; o.userData.body = body; return o;
}
export function headTex(c) { return (HEAD.t ||= c.canvasTex(256, 256, (q, w) => eyeFlower(q, w / 2, w / 2, w / 2 * 0.98))); }
// the plate's name on a slate by the rope, and the kicker under it
export function slate(c, r, g) {
  const s = c.sign(`${r.name}\n${r.film || ''}`, { w: 2.4, h: 0.62, bg: '#0d0d0d', fg: '#f4ead2', font: c.SERIF, weight: 700, px: 160, border: '#f5c542' });
  s.position.set(W / 2 - PORTAL.w / 2 - 1.2, 1.9, -D / 2 + 0.14); g.add(s);
}
// a velvet rope a step in front of the photograph: plates are made to be seen from the room
export function rope(c, r, g, X) {
  const { THREE } = c, z = -D / 2 + 1.25, x1 = (W - PORTAL.w) / 2 + 0.3, x2 = (W + PORTAL.w) / 2 - 0.3, n = 6;
  const brass = std(c, 0xd6a640, { metalness: 1, roughness: 0.25 }), red = std(c, r.ropeColor || 0x8a1a1a, { roughness: 0.85 });
  const post = new THREE.CylinderGeometry(0.035, 0.05, 0.95, 12), base = new THREE.CylinderGeometry(0.16, 0.18, 0.04, 20), knob = new THREE.SphereGeometry(0.06, 12, 10);
  for (let i = 0; i <= n; i++) {
    const x = x1 + (x2 - x1) * i / n, p = new THREE.Mesh(post, brass); p.position.set(x, 0.48, z); g.add(p);
    const b = new THREE.Mesh(base, brass); b.position.set(x, 0.02, z); g.add(b); const k = new THREE.Mesh(knob, brass); k.position.set(x, 0.98, z); g.add(k);
    if (i < n) { const seg = (x2 - x1) / n, curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x, 0.9, z), new THREE.Vector3(x + seg / 2, 0.62, z), new THREE.Vector3(x + seg, 0.9, z)); g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.025, 6), red)); }
  }
  c.wall(X(x1), z, X(x2), z); c.wall(X(x1), z, X(x1), -D / 2); c.wall(X(x2), z, X(x2), -D / 2);
  const q = c.sign(r.ropeSign || '"THE PICTURE" STARTS HERE', { w: 1.9, h: 0.2, bg: '#111', fg: '#f5c542', font: c.MONO, weight: 700 }); q.position.set(W / 2, 0.82, z + 0.04); g.add(q);
}
// a prop: [name, x, z, { h | len, ry, y, r: collider radius, egg: [hint, id, line], snd, rx }]. Poly Haven ids load as ph_<id>.
export function prop(c, r, g, X, name, x, z, o = {}) {
  const m = c.glb(/^(nyb_|ph_|mk_|sw_|tds_|si_|nasa_|w_)/.test(name) || o.raw ? name : 'ph_' + name, { h: o.h, len: o.len, x, y: o.y || 0, z, ry: o.ry || 0, parent: g, shadow: !o.y, rx: o.rx });
  if (o.r) c.post(X(x), z, o.r);
  if (o.egg) c.clickable(m, () => { if (o.snd) c.sound[o.snd] && c.sound[o.snd](); c.egg(o.egg[1], o.egg[2]); o.fn && o.fn(c, m); }, o.egg[0]);
  else if (o.hint) c.clickable(m, () => { o.fn && o.fn(c, m); }, o.hint);
  if (o.spin) c.tick((t) => { m.rotation.y = (o.ry || 0) + t * o.spin; });
  if (o.sway) c.tick((t) => { m.rotation.y = (o.ry || 0) + Math.sin(t * o.sway) * 0.3; });
  if (o.bob) c.tick((t) => { m.position.y = (o.y || 0) + Math.sin(t * o.bob + x) * 0.08; });
  m.userData.label = o.label; return m;
}
// a cast member: a GLB with an eye flower head, a contact shadow, a collider and a line when clicked
export function cast(c, r, g, X, name, x, z, { h = 1.8, ry = 0, y = 0, r: rad = 0.4, line, egg, hint } = {}) {
  const m = c.glb(name, { h, x, y, z, ry, parent: g });
  if (rad) c.post(X(x), z, rad);
  if (line) c.clickable(m, () => { c.say(m, typeof line === 'function' ? line() : line, 3600, h + 0.3); if (egg) c.egg(egg); }, hint || 'Say hello');
  return m;
}
// a plaque: a line of his, on the wall, in quotation marks. The house rule says Abloh owns the text.
export function plaque(c, g, x, y, z, ry, text, who = 'THE MANAGEMENT', w = 1.6) {
  const s = c.sign(`"${text}"\n${who}`, { w, h: w * 0.28, bg: '#f4ead2', fg: '#111', font: c.SERIF, weight: 700, px: 160, pad: 0.1 });
  s.position.set(x, y, z); s.rotation.y = ry; g.add(s); return s;
}
export function notice(c, g, text, x, y, z, ry, w = 1.8, h = 0.5, bg = '#f4ead2', fg = '#111') {
  const s = c.sign(text, { w, h, bg, fg, font: c.MONO, weight: 700, px: 160, pad: 0.1 }); s.position.set(x, y, z); s.rotation.y = ry; g.add(s); return s;
}
// a live canvas board, redrawn on demand
export function board(c, g, w, h, px = 512) {
  const { THREE } = c, t = c.canvasTex(Math.round(px * w / h), px, () => {}), q = t.userData.canvas.getContext('2d');
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); g.add(m);
  return { m, q, W: t.userData.canvas.width, H: t.userData.canvas.height, up: () => { t.needsUpdate = true; } };
}
// a museum label: title, maker, date, the lie
export function label(c, g, x, y, z, ry, lines, w = 0.9) {
  const s = c.sign(lines.join('\n'), { w, h: w * 0.42, bg: '#f7f3ea', fg: '#1b1b1b', font: c.MONO, weight: 600, px: 180, pad: 0.1 });
  s.position.set(x, y, z); s.rotation.y = ry; g.add(s); return s;
}
// a plinth with a collider
export function plinth(c, g, X, x, z, w = 1.2, h = 0.9, d = w, col = 0xe8e4dc) {
  const m = c.slab(w, h, d, std(c, col, { roughness: 0.5 }), x, h / 2, z); g.add(m); c.post(X(x), z, Math.max(w, d) * 0.62); return m;
}
// a crowd of simple New Yorkers that stand in a line and shuffle
export function queue(c, g, pts, n, { col = () => 0x3a4a6a, ry = 0 } = {}) {
  const Q = [];
  for (let k = 0; k < n; k++) { const u = k / Math.max(1, n - 1), p = pts(u); Q.push({ o: extra(c, g, p[0], p[1], { col: col(k), ry: p[2] ?? ry }), k, u }); }
  return Q;
}
// a column: a lathe with a capital
export function column(c, g, x, z, h = 5.6, R = 0.32, col = 0xe6e0d4) {
  const { THREE } = c, prof = [[0, 0], [R * 1.5, 0], [R * 1.5, 0.12], [R * 1.1, 0.2], [R, 0.4], [R * 0.9, h - 0.6], [R * 1.1, h - 0.4], [R * 1.5, h - 0.15], [R * 1.5, h], [0, h]].map(([a, b]) => new THREE.Vector2(a, b));
  const m = new THREE.Mesh(new THREE.LatheGeometry(prof, 24), std(c, col, { roughness: 0.55 })); m.position.set(x, 0, z); g.add(m); return m;
}
// instanced confetti, for parades and finales: call burst() to throw it
export function confetti(c, g, n = 400) {
  const { THREE } = c, geo = new THREE.PlaneGeometry(0.08, 0.05), mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false, vertexColors: false });
  const m = new THREE.InstancedMesh(geo, mat, n); m.frustumCulled = false; m.visible = false; g.add(m);
  const P = new Float32Array(n * 3), V = new Float32Array(n * 3), R = new Float32Array(n), col = new THREE.Color(), M = new THREE.Matrix4(), E = new THREE.Euler();
  for (let i = 0; i < n; i++) { col.set(INK[i % INK.length]); m.setColorAt(i, col); }
  let life = 0;
  const burst = (x, y, z, spread = 6) => { life = 6; m.visible = true; for (let i = 0; i < n; i++) { P[i * 3] = x + (Math.random() - 0.5) * spread; P[i * 3 + 1] = y + Math.random() * 2; P[i * 3 + 2] = z + (Math.random() - 0.5) * spread; V[i * 3] = (Math.random() - 0.5) * 2; V[i * 3 + 1] = 1 + Math.random() * 3; V[i * 3 + 2] = (Math.random() - 0.5) * 2; R[i] = Math.random() * 6; } };
  c.tick((t, dt) => { if (life <= 0) return; life -= dt; if (life <= 0) { m.visible = false; return; }
    for (let i = 0; i < n; i++) { V[i * 3 + 1] -= dt * 2.2; V[i * 3] += Math.sin(t * 3 + i) * dt * 0.6; for (let a = 0; a < 3; a++) P[i * 3 + a] += V[i * 3 + a] * dt; if (P[i * 3 + 1] < 0.02) { P[i * 3 + 1] = 0.02; V[i * 3 + 1] = 0; }
      R[i] += dt * 4; E.set(R[i], R[i] * 0.7, R[i] * 0.3); M.makeRotationFromEuler(E); M.setPosition(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); m.setMatrixAt(i, M); }
    m.instanceMatrix.needsUpdate = true; });
  return { burst, mesh: m };
}
// the census New Yorkers hang where the room leaves room for them
export function slotsDefault() {
  const S = [], south = D / 2 - 0.14;
  for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 2.1, z: south, ry: PI, w: 1.5 });
  [-6.6, -4.2, -1.8].forEach((z) => S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 }));
  [-4.2, -1.8].forEach((z) => S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 }));
  return S;
}
export const slotsSouthOnly = () => { const S = []; for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.5 }); [-6.6, -4.2, -1.8, 0.6].forEach((z) => S.push({ x: 0.14, y: 2.1, z, ry: PI / 2, w: 1.4 })); return S; };
export const slotsWestFree = () => { const S = []; for (let i = 0; i < 7; i++) S.push({ x: 2.2 + i * 2.6, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.5 }); [-6.6, -4.2, -1.8, 0.6].forEach((z) => S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 })); return S; };
// a dotted strip of light on the floor: velvet ropes, lanes, a runway
export function lane(c, g, x1, z1, x2, z2, col = 0xf5c542, step = 0.5) {
  const { THREE } = c, n = Math.max(2, Math.round(Math.hypot(x2 - x1, z2 - z1) / step)), geo = new THREE.CircleGeometry(0.06, 10).rotateX(-PI / 2), m = new THREE.InstancedMesh(geo, basic(c, col, { transparent: true, opacity: 0.85, depthWrite: false }), n), M = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { M.makeTranslation(x1 + (x2 - x1) * i / (n - 1), 0.02, z1 + (z2 - z1) * i / (n - 1)); m.setMatrixAt(i, M); } m.renderOrder = 1; g.add(m); return m;
}
// stanchions and a tape between points, as a path; colliders along it
export function stanchions(c, g, X, pts, { col = 0x8a1a1a, tape = false } = {}) {
  const { THREE } = c, brass = std(c, 0xd6a640, { metalness: 1, roughness: 0.25 }), red = std(c, col, { roughness: 0.85 });
  const post = new THREE.CylinderGeometry(0.035, 0.05, 0.95, 12), base = new THREE.CylinderGeometry(0.16, 0.18, 0.04, 20), knob = new THREE.SphereGeometry(0.06, 12, 10);
  pts.forEach(([x, z], i) => {
    const p = new THREE.Mesh(post, brass); p.position.set(x, 0.48, z); g.add(p); const b = new THREE.Mesh(base, brass); b.position.set(x, 0.02, z); g.add(b); const k = new THREE.Mesh(knob, brass); k.position.set(x, 0.98, z); g.add(k);
    if (i) { const [px, pz] = pts[i - 1]; if (tape) { const L = Math.hypot(x - px, z - pz), m = c.slab(L, 0.08, 0.01, red, (x + px) / 2, 0.86, (z + pz) / 2); m.rotation.y = -Math.atan2(z - pz, x - px); g.add(m); }
      else { const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(px, 0.9, pz), new THREE.Vector3((x + px) / 2, 0.62, (z + pz) / 2), new THREE.Vector3(x, 0.9, z)); g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.025, 6), red)); }
      c.wall(X(px), pz, X(x), z); }
  });
}
