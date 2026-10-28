// wing_a.js: four rooms of THE VEEFRIENDS WING of CLOUDS AND DIRT V2. The Doodle Room (walls that draw themselves while
// you are not looking), The Spectacular Vault (a door that opens for patience, six one of ones, lasers), The TCG Arena
// (Compete and Collect, playable, first to seven in one attribute), The VeeDome (the parade of friends, keep pace and
// you are in it). Built on fx.js and the room context `c` from main.js. Helpers that live in build.js are copied here.
import { W, D, H_IN, PORTAL } from './rooms.js';
import { crowdBody } from './crowd.js';
import { hologram, lava, bubblegum, diamond, gold, emerald, recolor, alcove, column, coffer, neon, cardTex } from './fx.js';

const PI = Math.PI, PURPLE = 0x5a2fa0, GOLD = 0xf5c542;
const basic = (c, color, o = {}) => new c.THREE.MeshBasicMaterial({ color, toneMapped: false, ...o });
const std = (c, color, o = {}) => new c.THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function decal(c, w, h, draw, px = 256) { const t = c.canvasTex(Math.round(px * w / h), px, draw); return new c.THREE.Mesh(new c.THREE.PlaneGeometry(w, h), new c.THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); }
function eyeFlower(g, x, y, R, petal = '#fbe6f0', edge = '#ff4fa3') {
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * PI * 2; g.save(); g.translate(x, y); g.rotate(a);
    const gr = g.createLinearGradient(0, 0, R, 0); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.6, petal); gr.addColorStop(1, edge);
    g.fillStyle = gr; g.beginPath(); g.ellipse(R * 0.55, 0, R * 0.5, R * 0.26, 0, 0, PI * 2); g.fill(); g.restore();
  }
  [[0.42, '#1d4ed8'], [0.32, '#ffffff'], [0.22, '#22d3ee'], [0.12, '#0b1020']].forEach(([k, col]) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, R * k, 0, PI * 2); g.fill(); });
  g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(x - R * 0.06, y - R * 0.06, R * 0.04, 0, PI * 2); g.fill();
}
const HEAD = {};
const headTex = (c) => (HEAD.t ||= c.canvasTex(256, 256, (q, w) => eyeFlower(q, w / 2, w / 2, w / 2 * 0.98)));
// the tower's crowd (crowd.js): office and street New Yorkers, walkers and suits; the guards stay the usher (cast)
const CLOUDS_CROWD = ['workgirl', 'wiseguy', 'cabbie', 'editor', 'annieh', 'rosemary', 'writer', 'tough', 'bartender', 'hustler', 'susan', 'oscar'];

// a seated or standing extra; since 2026-10-28 its body is one of the cast cut for crowds (crowd.js), the cylinder and box
// hidden once it lands; ?crowd=old keeps them
function extra(c, g, x, z, { seated = false, col = 0x3a4a6a, ry = 0, pool, crowd = true } = {}) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, 0, z); o.rotation.y = ry; g.add(o);
  const h = seated ? 0.45 : 0, body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.72, 12), std(c, col, { roughness: 0.8 })); body.position.y = h + (seated ? 0.36 : 1.0); o.add(body);
  let legs = null; if (!seated) { legs = c.slab(0.32, 0.64, 0.16, std(c, 0x1a1a22), 0, 0.32, 0); o.add(legs); }
  const head = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshStandardMaterial({ map: headTex(c), transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, roughness: 0.6 }));
  head.position.y = h + (seated ? 0.98 : 1.62); o.add(head); o.userData.head = head;
  if (crowd) crowdBody(o, { seated, col, hide: legs ? [body, legs, head] : [body, head], pool: pool || (seated ? 'seated' : CLOUDS_CROWD) });   // the whole cast character (crowd.js), its own flower head; the sprite hidden once it lands
  return o;
}
function cast(c, r, g, X, name, x, z, { h = 1.8, ry = 0, y = 0, r: rad = 0.4, line, egg, hint } = {}) {
  const m = c.glb(name, { h, x, y, z, ry, parent: g });
  if (rad) c.post(X(x), z, rad);
  if (line) c.clickable(m, () => { c.say(m, line, 3600, h + 0.3); if (egg) c.egg(egg); }, hint || 'Say hello');
  return m;
}
function plaque(c, g, x, y, z, ry, text, who = 'GARY VAYNERCHUK', w = 1.6) {
  const s = c.sign(`"${text}"\n${who}`, { w, h: w * 0.28, bg: '#f4ead2', fg: '#111', font: c.SERIF, weight: 700, px: 160, pad: 0.1 });
  s.position.set(x, y, z); s.rotation.y = ry; g.add(s); return s;
}
// a brass plate with several lines, for the facts
function plate(c, g, x, y, z, ry, text, w = 1.2, h = 0.5) {
  const s = c.sign(text, { w, h, bg: '#2a1e0a', fg: '#f5c542', font: c.MONO, weight: 700, px: 200, pad: 0.08, border: '#c9a033' });
  s.position.set(x, y, z); s.rotation.y = ry; g.add(s); return s;
}
function bulbs(c, g, x1, x2, y, z, n, col = 0xffe0a0) {
  const { THREE } = c, ms = [], on = basic(c, col), off = std(c, 0x3a3020, { roughness: 0.4 }), geo = new THREE.SphereGeometry(0.06, 10, 8);
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, on); m.position.set(x1 + (x2 - x1) * i / (n - 1), y, z); g.add(m); ms.push(m); }
  c.tick((t) => { const k = (t * 8) | 0; ms.forEach((m, i) => { m.material = (i + k) % 3 === 0 ? off : on; }); });
}
// a VeeFriends figure, MLow's 3D take, painted in one material if asked (the ink outline stays black)
function vf(c, g, name, { h = 1.6, x = 0, y = 0, z = 0, ry = 0, mat, onload } = {}) {
  return c.glb('vf_' + name, { h, x, y, z, ry, parent: g, onload: (gg, inner) => { if (mat) recolor(inner, mat); onload && onload(gg, inner); } });
}
// a niche you can actually walk into. fx.alcove cuts its box into the wall at x < 0 (or x > W, z > D/2), behind the
// room's own wall slab, so from the room it would be invisible. This shifts the alcove inward and builds a thick false
// wall (a partition) around its opening, with colliders in room space. span: the stretch of wall the partition covers.
function niche(c, r, g, X, { side = 'w', at = 0, w = 2.4, d = 1.8, h = 2.8, mat, floorMat, light = 0xffd9a8, span }) {
  const m = mat || c.surf('plaster', 2.4, 0x8a8070);
  // the niche is built in room coordinates between the room wall and a partition at p, the room wall is its back
  const { THREE } = c, fm = floorMat || m, grp = new THREE.Group(); g.add(grp);
  let p; if (side === 'w') p = d + 0.2; else if (side === 'e') p = W - d - 0.4; else p = D / 2 - d - 0.2;
  const e0 = side === 'w' ? 0.12 : side === 'e' ? W - 0.25 : D / 2, mid = (e0 + p) / 2, dep = Math.abs(p - e0), b1 = at - w / 2 - 0.1, b2 = at + w / 2 + 0.1;
  if (side !== 's') {
    grp.add(c.slab(dep, 0.03, w + 0.2, fm, mid, 0.015, at)); grp.add(c.slab(dep, 0.12, w + 0.2, m, mid, h + 0.06, at));
    for (const z of [b1, b2]) grp.add(c.slab(dep, h, 0.12, m, mid, h / 2, z));
  } else {
    grp.add(c.slab(w + 0.2, 0.03, dep, fm, at, 0.015, mid)); grp.add(c.slab(w + 0.2, 0.12, dep, m, at, h + 0.06, mid));
    for (const x of [b1, b2]) grp.add(c.slab(0.12, h, dep, m, x, h / 2, mid));
  }
  if (light) { const l = new THREE.PointLight(light, 6, 6, 1.5); if (side !== 's') l.position.set(mid, h - 0.4, at); else l.position.set(at, h - 0.4, mid); grp.add(l); }
  const [s1, s2] = span || (side === 's' ? [0, W] : [-D / 2, 2]), a1 = at - w / 2 - 0.1, a2 = at + w / 2 + 0.1, lh = H_IN - h - 0.1;
  if (side !== 's') {
    for (const [z1, z2] of [[s1, a1], [a2, s2]]) if (z2 - z1 > 0.05) { g.add(c.slab(0.2, H_IN, z2 - z1, m, p, H_IN / 2, (z1 + z2) / 2)); c.wall(X(p), z1, X(p), z2); }
    const x0 = side === 'w' ? 0 : W; for (const z of [a1, a2]) c.wall(X(x0), z, X(p), z);
    if (lh > 0.05) g.add(c.slab(0.2, lh, a2 - a1, m, p, h + 0.1 + lh / 2, at));
  } else {
    for (const [x1, x2] of [[s1, a1], [a2, s2]]) if (x2 - x1 > 0.05) { g.add(c.slab(x2 - x1, H_IN, 0.2, m, (x1 + x2) / 2, H_IN / 2, p)); c.wall(X(x1), p, X(x2), p); }
    for (const x of [a1, a2]) c.wall(X(x), p, X(x), D / 2);
    if (lh > 0.05) g.add(c.slab(a2 - a1, lh, 0.2, m, at, h + 0.1 + lh / 2, p));
  }
  grp.userData.face = p; return grp;
}
// a confetti burst: one instanced mesh, two hundred bits of paper in the house colours, gravity and a floor
function confetti(c, g, n = 220) {
  const { THREE } = c, m = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 0.015, 0.05), new THREE.MeshBasicMaterial({ toneMapped: false }), n);
  m.visible = false; m.frustumCulled = false; g.add(m);
  const p = new Float32Array(n * 3), v = new Float32Array(n * 3), rot = new Float32Array(n * 3), M = new THREE.Matrix4(), E = new THREE.Euler(), Q = new THREE.Quaternion(), S = new THREE.Vector3(1, 1, 1), V = new THREE.Vector3(), col = new THREE.Color();
  [0x5a2fa0, 0xf5c542, 0xff4fa3, 0x22d3ee, 0xffffff].forEach((cc, k) => { for (let i = k; i < n; i += 5) m.setColorAt(i, col.set(cc)); });
  let life = 0;
  return {
    burst(x, y, z) { life = 3.4; m.visible = true; for (let i = 0; i < n; i++) { p[i * 3] = x + (Math.random() - 0.5) * 0.6; p[i * 3 + 1] = y; p[i * 3 + 2] = z + (Math.random() - 0.5) * 0.6; const a = Math.random() * PI * 2, s = 0.8 + Math.random() * 2.2; v[i * 3] = Math.cos(a) * s; v[i * 3 + 1] = 3 + Math.random() * 4.5; v[i * 3 + 2] = Math.sin(a) * s; for (let k = 0; k < 3; k++) rot[i * 3 + k] = Math.random() * 6; } },
    tick(dt) {
      if (life <= 0) return; life -= dt; if (life <= 0) { m.visible = false; return; }
      for (let i = 0; i < n; i++) { const k = i * 3; v[k + 1] -= 7 * dt; v[k] *= 1 - dt * 1.5; v[k + 2] *= 1 - dt * 1.5; v[k + 1] *= 1 - dt * 1.2; p[k] += v[k] * dt; p[k + 1] += v[k + 1] * dt; p[k + 2] += v[k + 2] * dt; if (p[k + 1] < 0.02) { p[k + 1] = 0.02; v[k + 1] = 0; } else { rot[k] += dt * 5; rot[k + 2] += dt * 3; } E.set(rot[k], rot[k + 1], rot[k + 2]); Q.setFromEuler(E); V.set(p[k], p[k + 1], p[k + 2]); M.compose(V, Q, S); m.setMatrixAt(i, M); }
      m.instanceMatrix.needsUpdate = true;
    },
  };
}

// ---------- the marker drawings: naive, code drawn, never a copy. Strokes in a unit square, y down. ----------
const circ = (cx, cy, r, rx = r, n = 28, a0 = 0, a1 = PI * 2) => { const p = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * r]); } return p; };
const dot = (cx, cy, r) => Object.assign(circ(cx, cy, r, r, 12), { fill: true });
const scribble = (cx, cy, r, rx = r, n = 7) => { const p = []; for (let i = 0; i <= n; i++) { const y = cy - r * 0.8 + r * 1.6 * i / n, hw = rx * Math.sqrt(Math.max(0, 1 - ((y - cy) / r) ** 2)) * 0.85; p.push(i % 2 ? [cx + hw, y] : [cx - hw, y]); } return p; };
const smile = (cx, cy, r) => circ(cx, cy, r, r * 1.3, 10, 0.3, PI - 0.3);
const legs = (cx, cy, s, n = 2) => { const out = []; for (let i = 0; i < n; i++) { const x = cx + (i - (n - 1) / 2) * s; out.push([[x, cy], [x, cy + s * 1.4]]); } return out; };
const ANIMALS = {
  panda: [circ(0.5, 0.42, 0.21), circ(0.33, 0.26, 0.07), circ(0.67, 0.26, 0.07), dot(0.42, 0.4, 0.055), dot(0.58, 0.4, 0.055), dot(0.5, 0.49, 0.02), smile(0.5, 0.52, 0.04), circ(0.5, 0.78, 0.18, 0.24, 28, PI, PI * 2.6), [[0.3, 0.7], [0.18, 0.84]], [[0.7, 0.7], [0.82, 0.84]]],
  elephant: [circ(0.5, 0.4, 0.2), circ(0.27, 0.42, 0.13), circ(0.73, 0.42, 0.13), [[0.5, 0.5], [0.51, 0.62], [0.53, 0.74], [0.5, 0.84], [0.42, 0.86]], dot(0.43, 0.37, 0.018), dot(0.57, 0.37, 0.018), [[0.3, 0.6], [0.3, 0.92]], [[0.7, 0.6], [0.7, 0.92]], [[0.3, 0.92], [0.44, 0.92]], [[0.56, 0.92], [0.7, 0.92]]],
  gorilla: [circ(0.5, 0.34, 0.17), circ(0.5, 0.4, 0.1, 0.11), dot(0.46, 0.36, 0.016), dot(0.54, 0.36, 0.016), dot(0.47, 0.43, 0.012), dot(0.53, 0.43, 0.012), [[0.38, 0.27], [0.62, 0.27]], circ(0.5, 0.7, 0.24, 0.3, 28, PI, PI * 2.5), [[0.22, 0.6], [0.14, 0.9]], [[0.78, 0.6], [0.86, 0.9]], circ(0.14, 0.92, 0.04), circ(0.86, 0.92, 0.04)],
  goat: [circ(0.5, 0.48, 0.15, 0.13), [[0.42, 0.35], [0.36, 0.2], [0.3, 0.14]], [[0.58, 0.35], [0.64, 0.2], [0.7, 0.14]], [[0.46, 0.62], [0.48, 0.72], [0.5, 0.62], [0.52, 0.72], [0.54, 0.62]], dot(0.45, 0.46, 0.016), dot(0.55, 0.46, 0.016), circ(0.44, 0.3, 0.05), circ(0.56, 0.3, 0.05), circ(0.62, 0.8, 0.11, 0.2, 28, PI * 0.6, PI * 2.4), ...legs(0.62, 0.86, 0.14, 2)],
  blackcat: [circ(0.5, 0.42, 0.17), [[0.37, 0.32], [0.33, 0.16], [0.46, 0.26]], [[0.63, 0.32], [0.67, 0.16], [0.54, 0.26]], scribble(0.5, 0.42, 0.16, 0.16, 9), circ(0.44, 0.4, 0.028, 0.022), circ(0.56, 0.4, 0.028, 0.022), [[0.34, 0.46], [0.18, 0.44]], [[0.34, 0.5], [0.18, 0.52]], [[0.66, 0.46], [0.82, 0.44]], [[0.66, 0.5], [0.82, 0.52]], circ(0.5, 0.76, 0.17, 0.15), scribble(0.5, 0.76, 0.15, 0.14, 7), [[0.64, 0.84], [0.78, 0.82], [0.86, 0.68], [0.8, 0.58]]],
  bee: [circ(0.5, 0.52, 0.15, 0.24), [[0.42, 0.38], [0.42, 0.66]], [[0.52, 0.37], [0.52, 0.67]], [[0.62, 0.4], [0.62, 0.64]], circ(0.42, 0.3, 0.09, 0.07), circ(0.58, 0.3, 0.09, 0.07), [[0.74, 0.52], [0.86, 0.5]], [[0.3, 0.4], [0.24, 0.26]], dot(0.24, 0.25, 0.02), dot(0.33, 0.48, 0.016), smile(0.33, 0.54, 0.03)],
  ant: [circ(0.28, 0.56, 0.08), circ(0.48, 0.52, 0.1), circ(0.72, 0.5, 0.13), [[0.3, 0.64], [0.22, 0.8]], [[0.46, 0.62], [0.42, 0.8]], [[0.52, 0.62], [0.56, 0.8]], [[0.68, 0.62], [0.64, 0.8]], [[0.76, 0.62], [0.8, 0.8]], [[0.36, 0.52], [0.4, 0.6]], [[0.26, 0.48], [0.2, 0.34]], [[0.3, 0.48], [0.34, 0.34]], dot(0.25, 0.55, 0.014), smile(0.26, 0.6, 0.02)],
  alien: [circ(0.5, 0.4, 0.22, 0.17), Object.assign(circ(0.42, 0.4, 0.07, 0.045), { fill: true }), Object.assign(circ(0.58, 0.4, 0.07, 0.045), { fill: true }), [[0.47, 0.54], [0.53, 0.54]], [[0.5, 0.62], [0.5, 0.7]], circ(0.5, 0.82, 0.12, 0.14, 28, PI, PI * 2.4), [[0.5, 0.18], [0.5, 0.08]], dot(0.5, 0.07, 0.02), [[0.36, 0.76], [0.26, 0.86]], [[0.64, 0.76], [0.74, 0.86]]],
  ape: [circ(0.5, 0.38, 0.17), circ(0.31, 0.38, 0.06), circ(0.69, 0.38, 0.06), circ(0.5, 0.44, 0.1, 0.11), circ(0.45, 0.37, 0.03), circ(0.55, 0.37, 0.03), dot(0.45, 0.37, 0.012), dot(0.55, 0.37, 0.012), smile(0.5, 0.49, 0.03), circ(0.5, 0.74, 0.2, 0.22, 28, PI, PI * 2.5), [[0.3, 0.64], [0.2, 0.4], [0.18, 0.26]], [[0.7, 0.64], [0.8, 0.4], [0.82, 0.26]]],
  pig: [circ(0.5, 0.44, 0.2), circ(0.5, 0.5, 0.06, 0.09), dot(0.47, 0.5, 0.012), dot(0.53, 0.5, 0.012), dot(0.43, 0.38, 0.016), dot(0.57, 0.38, 0.016), [[0.34, 0.3], [0.32, 0.16], [0.44, 0.26]], [[0.66, 0.3], [0.68, 0.16], [0.56, 0.26]], circ(0.5, 0.78, 0.16, 0.26, 28, PI, PI * 2.6), ...legs(0.5, 0.86, 0.22, 2), [[0.76, 0.74], [0.82, 0.7], [0.8, 0.78], [0.86, 0.74]]],
  eagle: [circ(0.5, 0.3, 0.1), [[0.58, 0.3], [0.7, 0.33], [0.6, 0.37]], dot(0.53, 0.28, 0.014), circ(0.5, 0.56, 0.17, 0.12), [[0.4, 0.5], [0.26, 0.4], [0.12, 0.42], [0.08, 0.5], [0.16, 0.5], [0.1, 0.58], [0.2, 0.57], [0.16, 0.64], [0.38, 0.6]], [[0.6, 0.5], [0.74, 0.4], [0.88, 0.42], [0.92, 0.5], [0.84, 0.5], [0.9, 0.58], [0.8, 0.57], [0.84, 0.64], [0.62, 0.6]], [[0.44, 0.72], [0.4, 0.86], [0.5, 0.8], [0.6, 0.86], [0.56, 0.72]], ...legs(0.5, 0.72, 0.08, 2)],
  panther: [circ(0.5, 0.4, 0.16, 0.18), [[0.38, 0.28], [0.36, 0.14], [0.46, 0.24]], [[0.62, 0.28], [0.64, 0.14], [0.54, 0.24]], circ(0.5, 0.36, 0.2, 0.22, 16, PI * 1.05, PI * 1.95), circ(0.3, 0.42, 0.05), circ(0.7, 0.42, 0.05), dot(0.45, 0.38, 0.018), dot(0.55, 0.38, 0.018), dot(0.5, 0.46, 0.014), circ(0.5, 0.74, 0.13, 0.26, 28, PI * 0.9, PI * 2.1), ...legs(0.5, 0.84, 0.3, 2), [[0.74, 0.74], [0.86, 0.66], [0.9, 0.52]]],
  worm: [[[0.1, 0.72], [0.18, 0.56], [0.26, 0.72], [0.34, 0.56], [0.42, 0.72], [0.5, 0.56], [0.58, 0.72], [0.66, 0.56], [0.74, 0.62], [0.8, 0.5], [0.82, 0.4]], circ(0.82, 0.34, 0.08), dot(0.8, 0.32, 0.014), dot(0.86, 0.32, 0.014), smile(0.83, 0.38, 0.02), circ(0.42, 0.9, 0.14, 0.4, 20, PI, PI * 2), dot(0.3, 0.84, 0.01), dot(0.5, 0.86, 0.01), dot(0.62, 0.82, 0.01)],
};
const FRIENDS = [
  ['panda', 'Patient Panda', 'Macro patience, micro speed. The drawing took six seconds. The habit takes ten years.'],
  ['elephant', 'Empathy Elephant', 'Remember how the other person felt. The elephant never forgets, and neither does the internet.'],
  ['gorilla', 'Gratitude Gorilla', 'Grateful for the room, the marker, and the time you spent not looking.'],
  ['goat', 'Gift Goat', 'Give more than you take. Then give again. Nobody keeps score but the universe.'],
  ['blackcat', 'Very Very Very Very Lucky Black Cat', 'Luck is a number you can raise. Show up again tomorrow and it goes up.'],
  ['bee', 'Gary Bee', 'Be the bee. Pollinate everything, sting nobody.'],
  ['ant', 'Accountable Ant', 'Nobody is coming to fix it. The ant carries fifty times its weight and never posts about it.'],
  ['alien', 'Adaptable Alien', 'The platform changed again. Good. Change with it.'],
  ['ape', 'Alert Ape', 'Eyes open. Attention goes where attention is paid.'],
  ['pig', 'Patient Pig', 'Patience is the whole game. Even the pig knows it.'],
  ['eagle', 'Eager Eagle', 'Eager beats ready. Ready never shows up.'],
  ['panther', 'Podcast Panther', 'Press record. Nobody is listening yet, which is the best time to start.'],
  ['worm', 'Tough To Beat A Worm From The Dirt', 'Start in the dirt. Everything that grows does.'],
];
// draw an animal with a marker into a box, up to progress u (0 to 1 of the total stroke length)
function marker(q, strokes, x, y, s, u = 1, lw = 18) {
  q.save(); q.translate(x, y); q.lineCap = 'round'; q.lineJoin = 'round'; q.strokeStyle = '#141414'; q.fillStyle = '#141414'; q.lineWidth = lw;
  const lens = strokes.map((st) => { let L = 0; for (let i = 1; i < st.length; i++) L += Math.hypot(st[i][0] - st[i - 1][0], st[i][1] - st[i - 1][1]); return Math.max(L, 0.02); });
  const total = lens.reduce((a, b) => a + b, 0); let budget = u * total;
  for (let k = 0; k < strokes.length && budget > 0; k++) {
    const st = strokes[k], frac = Math.min(1, budget / lens[k]); budget -= lens[k];
    q.beginPath(); q.moveTo(st[0][0] * s, st[0][1] * s); let run = 0; const want = frac * lens[k];
    for (let i = 1; i < st.length; i++) { const seg = Math.hypot(st[i][0] - st[i - 1][0], st[i][1] - st[i - 1][1]); if (run + seg <= want) { q.lineTo(st[i][0] * s, st[i][1] * s); run += seg; } else { const f = (want - run) / seg; q.lineTo((st[i - 1][0] + (st[i][0] - st[i - 1][0]) * f) * s, (st[i - 1][1] + (st[i][1] - st[i - 1][1]) * f) * s); break; } }
    if (st.fill && frac >= 1) q.fill(); q.stroke();
  }
  q.restore();
}
// wrap a sentence into lines that fit
function wrap(q, text, maxW) { const words = text.split(' '), lines = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (q.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); return lines; }

// =====================================================================================================================
// THE DOODLE ROOM. A white paper room whose walls are sheets. The sheets draw a friend in marker, stroke by stroke,
// only while you are not looking at them: the weeping angel in reverse. Look away, come back, somebody new is there.
// =====================================================================================================================
function doodle(c, r, g, X) {
  const { THREE } = c, paper = c.surf('plaster', 2, 0xffffff), paperF = c.surf('plaster', 2.4, 0xf6f3ec), ink = std(c, 0x141414, { roughness: 0.5 });
  // rooms.js asks for a 'paper' texture that is not in assets/tex, so the room covers its own floor, walls and ceiling in white
  g.add(c.slab(W, 0.02, D, paperF, W / 2, 0.0, 0)); g.add(c.slab(W, 0.02, D, paper, W / 2, H_IN - 0.02, 0));
  g.add(c.slab(W - 0.3, H_IN - 0.04, 0.02, paper, W / 2, H_IN / 2, D / 2 - 0.14));
  g.add(c.slab(0.02, H_IN - 0.04, D - 0.3, paper, 0.13, H_IN / 2, 0)); g.add(c.slab(0.02, H_IN - 0.04, D - 0.3, paper, W - 0.38, H_IN / 2, 0));
  g.add(c.slab(4, H_IN - 0.04, 0.02, paper, 2, H_IN / 2, -D / 2 + 0.13)); g.add(c.slab(4, H_IN - 0.04, 0.02, paper, 18, H_IN / 2, -D / 2 + 0.13)); g.add(c.slab(PORTAL.w, H_IN - PORTAL.h, 0.02, paper, 10, PORTAL.h + (H_IN - PORTAL.h) / 2, -D / 2 + 0.13));
  // the faint grid on the floor, like graph paper, and a coffee ring where the pen was put down
  const grid = decal(c, 19.4, 15.4, (q, w, h) => { q.strokeStyle = 'rgba(90,120,200,.28)'; q.lineWidth = 2; for (let x = 0; x < w; x += w / 48) { q.beginPath(); q.moveTo(x, 0); q.lineTo(x, h); q.stroke(); } for (let y = 0; y < h; y += h / 38) { q.beginPath(); q.moveTo(0, y); q.lineTo(w, y); q.stroke(); } q.strokeStyle = 'rgba(120,80,30,.35)'; q.lineWidth = 9; q.beginPath(); q.arc(w * 0.78, h * 0.3, 60, 0, 7); q.stroke(); }, 768);
  grid.rotation.x = -PI / 2; grid.position.set(W / 2, 0.015, 0); g.add(grid);
  // the sketchbook: a nook on the west wall with a desk, a lamp and the first ugly drafts
  const nook = niche(c, r, g, X, { side: 'w', at: -5.0, w: 2.8, d: 2.0, h: 3.0, mat: paper, floorMat: c.surf('planks', 2, 0xd8c8a8), light: 0xfff0d0 });
  const desk = c.surf('oldwood', 1.5, 0xc8b090); g.add(c.slab(1.3, 0.05, 1.7, desk, 0.9, 0.76, -5.0)); for (const [x, z] of [[0.35, -5.75], [1.45, -5.75], [0.35, -4.25], [1.45, -4.25]]) g.add(c.slab(0.05, 0.74, 0.05, ink, x, 0.37, z));
  c.wall(X(0.25), -5.9, X(1.55), -5.9); c.wall(X(1.55), -5.9, X(1.55), -4.1); c.wall(X(0.25), -4.1, X(1.55), -4.1);
  const book = c.slab(0.5, 0.04, 0.7, std(c, 0xf4ead2, { roughness: 0.95 }), 0.9, 0.8, -4.9); book.rotation.y = 0.2; g.add(book);
  const page = decal(c, 0.46, 0.66, (q, w, h) => { q.fillStyle = '#fbf8f0'; q.fillRect(0, 0, w, h); marker(q, ANIMALS.worm, 10, 30, w - 20, 1, 9); q.fillStyle = '#141414'; q.font = `800 22px ${c.FONT}`; q.fillText('DRAFT ONE. UGLY. KEEP.', 14, h - 18); }, 256); page.rotation.x = -PI / 2; page.rotation.z = 0.2; page.position.set(0.9, 0.825, -4.9); g.add(page);
  c.clickable(book, () => { c.sound.click(); c.egg('doodle_notepad', 'The sketchbook. The first draft of everything is ugly on purpose. Ship the ugly one, then draw it again.'); }, 'The sketchbook');
  for (let k = 0; k < 6; k++) { const sb = c.slab(0.42, 0.035, 0.6, std(c, [0xf4ead2, 0xeae0cc, 0x5a2fa0][k % 3], { roughness: 0.9 }), 0.5, 0.0175 + k * 0.036, -3.9); sb.rotation.y = k * 0.12; g.add(sb); }   // a stack of old sketchbooks on the floor
  const pins = new THREE.Group(); g.add(pins); [[0.22, 2.4, -5.6], [0.22, 2.0, -4.6], [0.22, 2.7, -4.4]].forEach(([x, y, z], k) => { const dr = decal(c, 0.42, 0.42, (q, w) => { q.fillStyle = '#fbf8f0'; q.fillRect(0, 0, w, w); marker(q, ANIMALS[['ant', 'bee', 'pig'][k]], 10, 10, w - 20, 1, 9); }, 200); dr.rotation.y = PI / 2; dr.position.set(x, y, z); pins.add(dr); const pin = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), basic(c, [0xff4fa3, 0x22d3ee, 0xf5c542][k])); pin.position.set(x + 0.01, y + 0.18, z); pins.add(pin); });
  const nsign = c.sign('THE SKETCHBOOK\nWHERE THE 268 STARTED, ONE UGLY PAGE AT A TIME', { w: 2.4, h: 0.34, bg: '#141414', fg: '#f4ead2', font: c.MONO, weight: 700, px: 128 }); nsign.position.set(2.31, 3.5, -5.0); nsign.rotation.y = PI / 2; g.add(nsign);

  // the sheets: four live canvases pinned to the walls. Each is a page; a page holds one friend.
  const SW = c.MOBILE ? 640 : 1024, SH = Math.round(SW * 0.72), sheets = [];
  const mkSheet = (x, y, z, ry, w, seed) => {
    const t = c.canvasTex(SW, SH, (q) => { q.fillStyle = '#fbf8f0'; q.fillRect(0, 0, SW, SH); }), q = t.userData.canvas.getContext('2d');
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.72), new THREE.MeshStandardMaterial({ map: t, roughness: 0.92 })); mesh.position.set(x, y, z); mesh.rotation.y = ry; g.add(mesh);
    const frame = c.slab(w + 0.12, w * 0.72 + 0.12, 0.03, std(c, 0xeae4d8, { roughness: 0.9 }), 0, 0, -0.02); mesh.add(frame);
    for (const [sx, sy] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const tape = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.12), new THREE.MeshStandardMaterial({ color: 0xf2e2a0, transparent: true, opacity: 0.8, roughness: 0.6 })); tape.position.set(sx * (w / 2 - 0.05), sy * (w * 0.36 - 0.02), 0.012); tape.rotation.z = sx * sy * 0.7; mesh.add(tape); }
    // the drawing lives on the left two thirds, the speech bubble on the right
    const S = { mesh, t, q, k: seed % FRIENDS.length, u: 0, seen: 0, away: 0, page: 1, hx: x, hz: z, hw: w, ry, frame: 0, dirty: true };
    S.ends = [[x - Math.cos(ry) * w / 2, z + Math.sin(ry) * w / 2], [x + Math.cos(ry) * w / 2, z - Math.sin(ry) * w / 2]];
    S.draw = () => {
      const [id, name, lesson] = FRIENDS[S.k], box = SH * 0.84;
      q.fillStyle = '#fbf8f0'; q.fillRect(0, 0, SW, SH);
      q.fillStyle = 'rgba(0,0,0,.08)'; q.font = `700 ${SH * 0.035}px ${c.MONO}`; q.textAlign = 'right'; q.fillText('PAGE ' + S.page, SW - 20, SH - 16); q.textAlign = 'left';
      marker(q, ANIMALS[id], SW * 0.04, SH * 0.08, box, Math.min(1, S.u / 0.8), SW * 0.018);
      if (S.u > 0.8) {
        const v = Math.min(1, (S.u - 0.8) / 0.2), bx = SW * 0.62, by = SH * 0.1, bw = SW * 0.35, bh = SH * 0.52;
        q.strokeStyle = '#141414'; q.lineWidth = SW * 0.008; q.lineJoin = 'round'; q.beginPath(); q.moveTo(bx + 30, by); q.lineTo(bx + bw - 30, by); q.quadraticCurveTo(bx + bw, by, bx + bw, by + 30); q.lineTo(bx + bw, by + bh - 30); q.quadraticCurveTo(bx + bw, by + bh, bx + bw - 30, by + bh); q.lineTo(bx + 90, by + bh); q.lineTo(bx + 30, by + bh + 40); q.lineTo(bx + 50, by + bh); q.lineTo(bx + 30, by + bh); q.quadraticCurveTo(bx, by + bh, bx, by + bh - 30); q.lineTo(bx, by + 30); q.quadraticCurveTo(bx, by, bx + 30, by); q.stroke();
        q.fillStyle = '#141414'; q.font = `900 ${SH * 0.052}px ${c.FONT}`; const nl = wrap(q, name.toUpperCase(), bw - 40); nl.forEach((l, i) => q.fillText(l, bx + 20, by + 50 + i * SH * 0.06));
        q.font = `600 ${SH * 0.04}px ${c.FONT}`; const full = wrap(q, lesson, bw - 40), shown = Math.floor(lesson.length * v); let left = shown; full.forEach((l, i) => { const seg = l.slice(0, Math.max(0, left)); left -= l.length + 1; q.fillText(seg, bx + 20, by + 60 + nl.length * SH * 0.06 + i * SH * 0.05); });
      }
      t.needsUpdate = true;
    };
    S.draw(); sheets.push(S); return S;
  };
  mkSheet(3.7, 3.0, D / 2 - 0.16, PI, 5.0, 0); mkSheet(16.3, 3.0, D / 2 - 0.16, PI, 5.0, 3); mkSheet(W - 0.4, 3.0, -4.2, -PI / 2, 5.6, 6); mkSheet(2.31, 3.0, -0.8, PI / 2, 5.0, 9);
  // the weeping angel, reversed: a sheet only draws while nobody is looking at it
  let caught = false;
  const looking = (S, P) => { if (P.pitch < -0.7) return false; const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw); const [a, b] = S.ends; const ex = b[0] - a[0], ez = b[1] - a[1], L2 = ex * ex + ez * ez; let tt = ((P.x - X(a[0])) * ex + (P.z - a[1]) * ez) / L2; tt = Math.max(0, Math.min(1, tt)); const px = X(a[0] + ex * tt), pz = a[1] + ez * tt; const dx = px - P.x, dz = pz - P.z, L = Math.hypot(dx, dz) || 1; const cx = X(S.hx) - P.x, cz = S.hz - P.z, Lc = Math.hypot(cx, cz) || 1; return (dx * fx + dz * fz) / L > 0.72 || (cx * fx + cz * fz) / Lc > 0.72; };
  c.tick((t, dt, P, ri) => {
    if (ri !== r.i) return;
    sheets.forEach((S) => {
      const look = looking(S, P);
      if (look) {
        if (!S.look && S.u > 0.06 && S.u < 0.94 && !caught) { caught = true; c.sound.squeak(); c.egg('doodle_caught', 'Caught one mid stroke. The walls only work when nobody is watching, like most of the work that matters.'); }
        S.seen += dt; S.away = 0;
      } else {
        S.away += dt;
        if (S.u >= 1) { if (S.seen > 0.8 && S.away > 0.6) { S.k = (S.k + 1 + ((Math.random() * 3) | 0)) % FRIENDS.length; S.u = 0; S.seen = 0; S.page++; S.dirty = true; } }
        else { S.u = Math.min(1, S.u + dt / 7); S.dirty = true; }
      }
      S.look = look;
      if (S.dirty && (S.frame++ % 2 === 0)) { S.draw(); S.dirty = S.u < 1; }
    });
  });

  // the giant marker, leaning in the north east corner. Click the cap.
  const mk = new THREE.Group(); mk.position.set(18.6, 0, -6.6); mk.rotation.z = 0.22; mk.rotation.y = -0.6; g.add(mk);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 3.0, 24), ink); body.position.y = 1.5; mk.add(body);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.5, 24), std(c, 0x5a2fa0, { roughness: 0.5 })); band.position.y = 2.0; mk.add(band);
  const lab = c.sign('PERMANENT\nBROAD TIP', { w: 0.6, h: 0.3, bg: '#f4ead2', fg: '#141414', font: c.MONO, weight: 800, px: 96 }); lab.position.set(0, 1.1, 0.205); mk.add(lab);
  const nib = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.5, 20), std(c, 0x222222, { roughness: 0.95 })); nib.position.y = 3.25; mk.add(nib);
  const cap = new THREE.Group(); cap.position.y = 3.0; mk.add(cap); const capM = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.22, 0.9, 24), std(c, 0x1a1a1a, { roughness: 0.4 })); capM.position.y = 0.45; cap.add(capM); const clip = c.slab(0.05, 0.6, 0.03, std(c, 0x1a1a1a, { roughness: 0.4 }), 0.0, 0.5, 0.25); cap.add(clip);
  c.post(X(18.6), -6.6, 0.45); let capU = -1;
  c.clickable(cap, () => { if (capU >= 0) return; capU = 0; c.sound.squeak(); c.egg('doodle_marker', 'Uncapped. Every one of the two hundred and sixty eight started with a marker like this and a man who says he cannot draw.'); }, 'Uncap the marker');
  c.tick((t, dt, P, ri) => { if (ri !== r.i || capU < 0 || capU > 1) return; capU = Math.min(1, capU + dt / 1.2); const e = capU < 0.5 ? capU * 2 : 1; cap.position.y = 3.0 + e * 1.2; cap.position.x = e * 0.9; cap.rotation.z = -e * 1.4; if (capU >= 1) { c.sound.thud(0.3); cap.position.set(1.4, 0.12, 0.6); cap.rotation.set(0, 0, PI / 2); } });

  // the paper friends: drawings that climbed off the wall, white as the page, one in colour
  const white = std(c, 0xf4f0e8, { roughness: 0.9 }), lines = { panda: 'I came off the wall at page four. Patience.', elephant: 'I remember every drawing of me, even the bad ones.', gorilla: 'Thank you for not looking. It helps.', goat: 'Take one. There are plenty.', blackcat: 'Four verys. Count them.', ant: 'I carry the sheet, nobody claps.', alien: 'New wall? Fine. Draw me again.', ape: 'I saw you turn. The wall did not.' };
  const stand = [['panda', 3.4, 6.5, 1.8, PI + 0.3], ['elephant', 6.3, 6.6, 1.7, PI - 0.3], ['gorilla', 13.6, 6.6, 1.9, PI + 0.2], ['goat', 16.6, 6.5, 1.5, PI - 0.2], ['blackcat', W - 1.0, -5.6, 1.2, -PI / 2 + 0.3], ['ant', W - 1.0, -2.4, 0.9, -PI / 2 - 0.3], ['alien', 3.0, -1.9, 1.6, PI / 2 + 0.3], ['ape', 3.0, 0.9, 1.6, PI / 2 - 0.3]];
  stand.forEach(([nm, x, z, h, ry]) => { const m = vf(c, g, nm, { h, x, z, ry, mat: white }); c.post(X(x), z, 0.35); c.clickable(m, () => c.say(m, lines[nm], 3200, h + 0.2), 'A paper friend'); });
  const bee = vf(c, g, 'bee', { h: 1.3, x: 14.6, z: -3.4, ry: 0.8 }); c.post(X(14.6), -3.4, 0.4);
  c.clickable(bee, () => { c.sound.ding(); c.egg('doodle_colour', 'The only one in colour. Gary Bee, one in a room of paper. That is a brand.'); }, 'The one in colour');
  const bz = decal(c, 1.2, 1.2, (q, w) => { q.strokeStyle = '#f5c542'; q.lineWidth = 10; q.setLineDash([24, 18]); q.beginPath(); q.arc(w / 2, w / 2, w / 2 - 10, 0, 7); q.stroke(); }); bz.rotation.x = -PI / 2; bz.position.set(14.6, 0.02, -3.4); g.add(bz);

  // the clutter of a studio: crumpled pages, pencils, an eraser, a ruler, paper planes on strings, lanterns
  const crumple = new THREE.IcosahedronGeometry(0.14, 0); for (let k = 0; k < 10; k++) { const m = new THREE.Mesh(crumple, std(c, 0xf7f3ea, { roughness: 1, flatShading: true })); const a = k * 1.7; m.position.set(5 + Math.sin(a) * 1.1 + (k % 3) * 0.3, 0.12, -6.2 + Math.cos(a) * 0.8); m.rotation.set(a, a * 2, 0); m.scale.setScalar(0.7 + (k % 3) * 0.25); g.add(m); }
  const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.6, 16, 1, true), std(c, 0xdedad0, { roughness: 0.7, side: THREE.DoubleSide })); bin.position.set(5.0, 0.3, -6.4); g.add(bin); c.post(X(5.0), -6.4, 0.4);
  const pencil = new THREE.Group(); pencil.position.set(7.2, 0.1, -7.0); pencil.rotation.y = 0.4; g.add(pencil); const pb = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.6, 6), std(c, 0xf5c542, { roughness: 0.6 })); pb.rotation.z = PI / 2; pencil.add(pb); const pt = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.4, 6), std(c, 0xe0c8a0, { roughness: 0.8 })); pt.rotation.z = -PI / 2; pt.position.x = 1.5; pencil.add(pt); const pl = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 6), ink); pl.rotation.z = -PI / 2; pl.position.x = 1.76; pencil.add(pl); const fer = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.2, 8), std(c, 0xc0c0c8, { metalness: 0.8, roughness: 0.3 })); fer.rotation.z = PI / 2; fer.position.x = -1.3; pencil.add(fer); const rub = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.2, 8), std(c, 0xff9bb0, { roughness: 0.9 })); rub.rotation.z = PI / 2; rub.position.x = -1.5; pencil.add(rub);
  const eraser = c.slab(0.9, 0.3, 0.45, std(c, 0xff9bb0, { roughness: 0.95 }), 17.4, 0.15, -2.6); eraser.rotation.y = 0.5; g.add(eraser); const erb = c.slab(0.3, 0.31, 0.46, std(c, 0x7fa8ff, { roughness: 0.95 }), 0.3, 0, 0); eraser.add(erb); c.post(X(17.4), -2.6, 0.5);
  const ruler = decal(c, 3.0, 0.3, (q, w, h) => { q.fillStyle = '#e8d8a8'; q.fillRect(0, 0, w, h); q.fillStyle = '#141414'; for (let i = 0; i <= 60; i++) q.fillRect(i * w / 60, 0, 2, i % 10 === 0 ? h * 0.5 : i % 5 === 0 ? h * 0.3 : h * 0.18); }, 96); ruler.rotation.x = -PI / 2; ruler.rotation.z = 0.2; ruler.position.set(16.4, 0.02, 0.4); g.add(ruler);
  const planeG = new THREE.Group(); g.add(planeG); const planes = [];
  for (let k = 0; k < 6; k++) { const o = new THREE.Group(); const x = 4 + k * 2.6 + (k % 2) * 0.8, z = -3.5 + (k % 3) * 1.4, y = 4.2 + (k % 2) * 0.7; o.position.set(x, y, z); planeG.add(o); const wing = new THREE.Shape(); wing.moveTo(0, 0); wing.lineTo(-0.5, 0.18); wing.lineTo(-0.42, 0); wing.lineTo(-0.5, -0.18); wing.closePath(); const pm = new THREE.Mesh(new THREE.ShapeGeometry(wing), std(c, 0xffffff, { roughness: 0.8, side: THREE.DoubleSide })); pm.rotation.x = -PI / 2; o.add(pm); const keel = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(-0.46, 0), new THREE.Vector2(-0.4, -0.12)])), std(c, 0xf0ece4, { roughness: 0.8, side: THREE.DoubleSide })); o.add(keel); const str = c.slab(0.004, H_IN - y, 0.004, std(c, 0x999999), 0, (H_IN - y) / 2, 0); o.add(str); planes.push({ o, k }); }
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; planes.forEach(({ o, k }) => { o.rotation.y = t * 0.3 + k; o.rotation.z = Math.sin(t * 0.8 + k) * 0.15; }); });
  for (const [x, z] of [[4, -1], [10, -2], [16, -1]]) { const lan = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), std(c, 0xffffff, { roughness: 1, emissive: 0xfff4e0, emissiveIntensity: 0.35 })); lan.position.set(x, 5.1, z); g.add(lan); g.add(c.slab(0.004, 0.5, 0.004, std(c, 0x999999), x, 5.75, z)); }
  const cups = [[7.4, 1.2, -6.9], [2.6, 2.3, 1.9]]; cups.forEach(([x, hgt, z]) => { for (let k = 0; k < 7; k++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, hgt, 6), std(c, [0xf5c542, 0xff4fa3, 0x22d3ee, 0x141414, 0x5a2fa0, 0xff7a1a, 0x3b82f6][k], { roughness: 0.6 })); p.position.set(x + Math.cos(k) * 0.14, hgt / 2 + 0.02, z + Math.sin(k) * 0.14); p.rotation.z = Math.cos(k * 2) * 0.1; p.rotation.x = Math.sin(k * 2) * 0.1; g.add(p); } const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.5, 16, 1, true), std(c, 0xeae4d8, { roughness: 0.8, side: THREE.DoubleSide })); cup.position.set(x, 0.25, z); g.add(cup); c.post(X(x), z, 0.35); });
  const title = c.sign('THE DOODLE ROOM', { w: 6, h: 0.9, bg: null, fg: '#141414', font: c.SERIF, weight: 900 }); title.position.set(W / 2, PORTAL.h + 0.8, -D / 2 + 0.16); g.add(title);
  const sub = c.sign('DRAWN IN MARKER WHILE YOU WERE NOT LOOKING. TURN ROUND. TURN BACK.', { w: 6.4, h: 0.26, bg: null, fg: '#5a2fa0', font: c.MONO, weight: 700 }); sub.position.set(W / 2, PORTAL.h + 0.2, -D / 2 + 0.16); g.add(sub);
  plaque(c, g, 10, 4.9, D / 2 - 0.17, PI, 'I cannot draw. I drew two hundred and sixty eight of them anyway.', 'THE DOODLE ROOM', 2.4);
  cast(c, r, g, X, 'editor', 16.2, 2.0, { h: 1.75, ry: -2.4, line: 'The sheets only move when you stop watching them. Most of the good work is like that.', egg: null, hint: 'The art director' });
}

// =====================================================================================================================
// THE SPECTACULAR VAULT. A bank vault with a round door that opens for the patient, six one of ones on pedestals, walls
// of safe deposit boxes, lasers you must not cross, and the key in a side vault.
// =====================================================================================================================
function vault(c, r, g, X) {
  const { THREE } = c, steel = c.surf('metal', 2, 0x9a9ca0), steelD = c.surf('metal', 1.2, 0x5a5c62), brass = std(c, 0xc9a033, { metalness: 1, roughness: 0.28 }), dark = std(c, 0x1a1a1e, { roughness: 0.5 });
  coffer(c, r, g, { nx: 5, nz: 4, y: H_IN, mat: steelD, bulb: 0xfff0d0 });
  // the vault wall across the north, a corridor behind it to the picture
  const VZ = -4.6; g.add(c.slab(8.3, H_IN, 0.6, steel, 4.15, H_IN / 2, VZ)); g.add(c.slab(8.3, H_IN, 0.6, steel, 15.85, H_IN / 2, VZ)); g.add(c.slab(3.4, 2.4, 0.6, steel, 10, 4.8, VZ));
  c.wall(X(0), VZ + 0.3, X(8.3), VZ + 0.3); c.wall(X(11.7), VZ + 0.3, X(20), VZ + 0.3); c.wall(X(0), VZ - 0.3, X(8.3), VZ - 0.3); c.wall(X(11.7), VZ - 0.3, X(20), VZ - 0.3);
  const doorCol = c.wall(X(8.3), VZ + 0.3, X(11.7), VZ + 0.3), openCol = c.wall(X(11.9), VZ + 0.55, X(11.4), 0.3); openCol.off = true;
  g.add(c.slab(0.3, 3.6, 1.9, steel, 8.15, 1.8, -5.85)); g.add(c.slab(0.3, 3.6, 1.9, steel, 11.85, 1.8, -5.85)); g.add(c.slab(4.0, 0.3, 1.9, steelD, 10, 3.75, -5.85));
  c.wall(X(8.3), VZ - 0.3, X(8.3), -6.8); c.wall(X(11.7), VZ - 0.3, X(11.7), -6.8);
  const cl = new THREE.PointLight(0xfff0d0, 10, 7, 1.6); cl.position.set(10, 3.3, -5.8); g.add(cl);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.3, 12, 48), brass); ring.position.set(10, 1.8, VZ + 0.3); g.add(ring);
  // the door: a steel disc on a hinge, a wheel, twelve bolts. Hold still in front of it and it opens.
  const hinge = new THREE.Group(); hinge.position.set(11.9, 1.8, VZ + 0.56); g.add(hinge); const door = new THREE.Group(); door.position.x = -1.9; hinge.add(door);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(2.42, 2.42, 0.5, 48), std(c, 0xb0b4ba, { metalness: 0.95, roughness: 0.32 })); disc.rotation.x = PI / 2; door.add(disc);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.07, 8, 48), brass); rim.position.z = 0.26; door.add(rim);
  const wheel = new THREE.Group(); wheel.position.z = 0.48; door.add(wheel); wheel.add(new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.06, 10, 32), brass)); for (let k = 0; k < 3; k++) { const sp = c.slab(0.07, 1.44, 0.07, brass, 0, 0, 0); sp.rotation.z = k * PI / 3; wheel.add(sp); } const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 16), brass); hub.rotation.x = PI / 2; hub.position.z = -0.1; wheel.add(hub);
  const bolts = []; for (let k = 0; k < 12; k++) { const a = k / 12 * PI * 2, b = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.5, 10), std(c, 0xd8dadd, { metalness: 1, roughness: 0.3 })); b.rotation.z = a - PI / 2; door.add(b); bolts.push({ b, a }); }
  const setBolts = (out) => bolts.forEach(({ b, a }) => b.position.set(Math.cos(a) * (2.2 + out * 0.4), Math.sin(a) * (2.2 + out * 0.4), 0)); setBolts(1);
  const lamp = c.sign('LOCKED', { w: 1.6, h: 0.3, bg: '#1a0a0a', fg: '#ff3030', font: c.MONO, weight: 800, px: 96, border: '#c9a033' }); lamp.position.set(10, 4.75, VZ + 0.31); g.add(lamp);
  const lq = lamp.material.map.userData.canvas.getContext('2d'), lt = lamp.material.map, lw = lt.userData.canvas.width, lh = lt.userData.canvas.height;
  const lampText = (s, col) => { lq.fillStyle = '#1a0a0a'; lq.fillRect(0, 0, lw, lh); lq.strokeStyle = '#c9a033'; lq.lineWidth = lh * 0.05; lq.strokeRect(lh * 0.05, lh * 0.05, lw - lh * 0.1, lh - lh * 0.1); lq.fillStyle = col; lq.font = `800 ${lh * 0.55}px ${c.MONO}`; lq.textAlign = 'center'; lq.textBaseline = 'middle'; lq.fillText(s, lw / 2, lh / 2); lt.needsUpdate = true; };
  const hs = c.sign('HOLD STILL WITHIN THREE METRES FOR FIVE SECONDS. THE DOOR REWARDS PATIENCE.', { w: 4.6, h: 0.22, bg: '#0d0d0d', fg: '#f5c542', font: c.MONO, weight: 700 }); hs.position.set(10, 5.3, VZ + 0.31); g.add(hs);
  const mark = decal(c, 2.0, 2.0, (q, w) => { q.strokeStyle = '#f5c542'; q.lineWidth = 10; q.setLineDash([30, 20]); q.beginPath(); q.arc(w / 2, w / 2, w / 2 - 12, 0, 7); q.stroke(); q.fillStyle = '#f5c542'; q.font = `800 ${w * 0.09}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('STAND', w / 2, w / 2 - 10); q.fillText('STILL', w / 2, w / 2 + w * 0.09); }); mark.rotation.x = -PI / 2; mark.position.set(10, 0.02, -2.4); g.add(mark);
  let still = 0, phase = 0, t0 = 0, last = [0, 0], lastN = -1;
  c.tick((t, dt, P, ri) => {
    if (ri !== r.i) return;
    if (phase === 0) {
      const mv = Math.hypot(P.x - last[0], P.z - last[1]); last = [P.x, P.z];
      const near = Math.hypot(P.x - X(10), P.z - (VZ + 0.8)) < 3.2;
      still = near && mv < 0.004 ? still + dt : 0;
      const n = near ? Math.max(0, Math.ceil(5 - still)) : -1; if (n !== lastN) { lastN = n; lampText(n < 0 ? 'LOCKED' : n === 0 ? 'OPEN' : 'HOLD STILL ' + n, n < 0 ? '#ff3030' : '#f5c542'); }
      if (still >= 5) { phase = 1; t0 = t; c.sound.crack(); c.toast('The lock heard you stop.', 2200); }
    } else if (phase === 1) {
      const u = Math.min(1, (t - t0) / 1.4); wheel.rotation.z = u * PI * 6; setBolts(1 - u);
      if (u >= 1) { phase = 2; t0 = t; c.sound.boom(0.6); doorCol.off = true; openCol.off = false; }
    } else if (phase === 2) {
      const u = Math.min(1, (t - t0) / 3.2), e = 1 - Math.pow(1 - u, 3); hinge.rotation.y = e * 1.45;
      if (u >= 1) { phase = 3; c.sound.thud(0.8); c.shake(0.03); lampText('OPEN', '#7fff9a'); c.egg('vault_door', 'The door opened because you stopped. Five seconds of standing still. Patience is the whole heist.'); }
    }
  });

  // six one of ones on six pedestals, in a ring round the room. Click one to touch it.
  const SPEC = [['hologram', hologram, 'HOLOGRAM', 'Series 1, 2021'], ['lava', lava, 'LAVA', 'Series 1, 2021'], ['bubblegum', bubblegum, 'BUBBLE GUM', 'Series 1, 2021'], ['diamond', diamond, 'DIAMOND', 'Series 1, 2021'], ['gold', gold, 'GOLD', 'Series 1, 2021'], ['emerald', emerald, 'EMERALD', 'Series 2, 2022']];
  const FIG = ['panda', 'elephant', 'gorilla', 'goat', 'blackcat', 'eagle'], ANG = [0, 40, 140, 180, 220, 320], touched = new Set(), figs = [], marb = c.surf('marble2', 1, 0x3a3a44);
  SPEC.forEach(([id, mk, label, series], k) => {
    const a = ANG[k] / 180 * PI, x = 10 + Math.cos(a) * 5.0, z = 1.0 + Math.sin(a) * 5.0, mat = mk(c);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.56, 1.0, 24), marb); ped.position.set(x, 0.5, z); g.add(ped); c.post(X(x), z, 0.65);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.06, 24), brass); top.position.set(x, 1.03, z); g.add(top);
    const f = vf(c, g, FIG[k], { h: 1.3, x, y: 1.06, z, ry: Math.atan2(10 - x, 1.0 - z), mat }); figs.push(f);
    const toward = Math.atan2(10 - x, 1.0 - z); plate(c, g, x + Math.sin(toward) * 0.58, 0.62, z + Math.cos(toward) * 0.58, toward, `${label}\nSPECTACULAR, ${series.toUpperCase()}\nONE OF ONE`, 0.9, 0.4);
    c.clickable(f, () => { c.sound.clink(900 + k * 150); c.say(f, `${label}. A Spectacular from ${series}. One token, one owner, no copies.`, 3400, 1.7); if (!touched.has(k)) { touched.add(k); c.egg('vault_touch', 'You touched a Spectacular. One of one, and it noticed.'); if (touched.size === 6) setTimeout(() => c.egg('vault_six', 'All six. Hologram, Lava, Bubble Gum, Diamond, Gold, and the Emerald that came with Series 2. Six one of ones, one visitor.'), 1800); } }, 'Touch the ' + label.toLowerCase());
  });
  const ladder = plate(c, g, 15.85, 2.6, VZ + 0.31, 0, 'THE LADDER\nCORE\nRARE, BROWN, 500\nVERY RARE, ORANGE, 100\nEPIC, GREEN, 25\nSPECTACULAR, ONE OF ONES', 2.4, 1.6);
  plate(c, g, 4.15, 2.6, VZ + 0.31, 0, 'THE SPECTACULARS\nHOLOGRAM, LAVA, BUBBLE GUM\nDIAMOND, GOLD: SERIES 1, 2021\nEMERALD JOINED IN SERIES 2, 2022\nSERIES 1: 10,255 TOKENS, 268 CHARACTERS\nSERIES 2: 55,555 TOKENS', 2.4, 1.6);
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; figs.forEach((f, k) => { f.rotation.y += dt * 0.35; f.position.y = 1.06 + Math.sin(t * 1.2 + k) * 0.02; }); });

  // the walls of safe deposit boxes: instanced, hundreds, each with a brass plate
  const boxG = new THREE.BoxGeometry(0.32, 0.22, 0.06), plG = new THREE.BoxGeometry(0.1, 0.05, 0.012), runs = [];
  const run = (x1, z1, x2, z2, nx) => runs.push([x1, z1, x2, z2, nx]);
  run(0.6, D / 2 - 0.2, 19.4, D / 2 - 0.2, 56); run(W - 0.44, VZ + 0.9, W - 0.44, 1.8, 17); run(W - 0.44, 5.9, W - 0.44, 7.6, 5); run(8.32, VZ - 0.5, 8.32, -6.6, 5); run(11.68, -6.6, 11.68, VZ - 0.5, 5); run(2.32, 1.9, 2.32, -0.1, 6);
  let total = 0; runs.forEach((q) => total += q[4] * 6);
  const boxes = new THREE.InstancedMesh(boxG, c.surf('metal', 0.5, 0xb8bcc2), total), plates = new THREE.InstancedMesh(plG, brass, total), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1), col = new THREE.Color();
  let i = 0; runs.forEach(([x1, z1, x2, z2, nx]) => { const L = Math.hypot(x2 - x1, z2 - z1), ry = Math.atan2(x2 - x1, z2 - z1) - PI / 2 + (z1 === z2 ? PI : 0); const fx = Math.sin(ry), fz = Math.cos(ry); for (let a = 0; a < nx; a++) for (let b = 0; b < 6; b++) { const u = (a + 0.5) / nx, x = x1 + (x2 - x1) * u, z = z1 + (z2 - z1) * u, y = 0.3 + b * 0.25; E.set(0, ry, 0); Q.setFromEuler(E); V.set(x, y, z); M.compose(V, Q, S); boxes.setMatrixAt(i, M); boxes.setColorAt(i, col.setHSL(0.6, 0.02, 0.5 + ((a * 7 + b * 3) % 5) * 0.04)); V.set(x + fx * 0.035, y - 0.06, z + fz * 0.035); M.compose(V, Q, S); plates.setMatrixAt(i, M); i++; } });
  boxes.count = plates.count = i; g.add(boxes); g.add(plates);
  const bl = c.sign('SAFE DEPOSIT · ' + i + ' BOXES · NOTHING IN THEM BUT PATIENCE', { w: 3.2, h: 0.2, bg: '#0d0d0d', fg: '#f5c542', font: c.MONO, weight: 700 }); bl.position.set(10, 2.0, D / 2 - 0.24); bl.rotation.y = PI; g.add(bl);
  column(c, r, g, X, 4.0, -3.4, { h: H_IN, rad: 0.32, mat: steelD }); column(c, r, g, X, 16.0, -3.4, { h: H_IN, rad: 0.32, mat: steelD });

  // the lasers. Cross one and the room goes red for three seconds.
  const red = basic(c, 0xff2020), lasers = [], emit = std(c, 0x222226, { metalness: 0.8, roughness: 0.3 });
  const laser = (x1, z1, x2, z2, y, ph) => { const L = Math.hypot(x2 - x1, z2 - z1), m = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, L, 6), red); m.position.set((x1 + x2) / 2, y, (z1 + z2) / 2); m.rotation.z = PI / 2; m.rotation.y = -Math.atan2(z2 - z1, x2 - x1); g.add(m); for (const [x, z] of [[x1, z1], [x2, z2]]) g.add(c.slab(0.12, 0.12, 0.12, emit, x, y, z)); lasers.push({ m, x1, z1, x2, z2, y, ph, on: true }); };
  laser(2.2, -2.9, 7.4, -2.9, 0.5, 0); laser(12.6, -2.9, 17.8, -2.9, 0.5, 1.1); laser(1.0, -1.6, 4.0, 3.4, 0.9, 2.2); laser(19.0, -1.6, 16.0, 3.4, 0.9, 0.6); laser(1.0, 4.6, 6.6, 6.4, 0.4, 1.7); laser(19.0, 4.6, 13.4, 6.4, 0.4, 2.9);
  const hatch = decal(c, 5.4, 0.5, (q, w, h) => { q.fillStyle = '#f5c542'; q.fillRect(0, 0, w, h); q.fillStyle = '#141414'; for (let x = -h; x < w; x += h) { q.beginPath(); q.moveTo(x, 0); q.lineTo(x + h * 0.5, 0); q.lineTo(x + h, h); q.lineTo(x + h * 0.5, h); q.closePath(); q.fill(); } }, 64); hatch.rotation.x = -PI / 2; hatch.position.set(4.8, 0.02, -2.4); g.add(hatch); const hatch2 = hatch.clone(); hatch2.position.x = 15.2; g.add(hatch2);
  const alarmL = new THREE.PointLight(0xff2020, 0, 22, 1.2); alarmL.position.set(10, 4.5, 1); g.add(alarmL);
  let alarm = 0, lp = [0, 0], tripped = 0;
  const cross = (ax, az, bx, bz, L) => { const ex = L.x2 - L.x1, ez = L.z2 - L.z1, dx = bx - ax, dz = bz - az, den = dx * ez - dz * ex; if (Math.abs(den) < 1e-9) return false; const t = ((L.x1 - ax) * ez - (L.z1 - az) * ex) / den, u = ((L.x1 - ax) * dz - (L.z1 - az) * dx) / den; return t >= 0 && t <= 1 && u >= 0 && u <= 1; };
  c.tick((t, dt, P, ri) => {
    if (ri !== r.i) { if (r.owns) { c.FX.tint = null; r.owns = false; } return; }
    lasers.forEach((L) => { L.on = Math.sin(t * 1.3 + L.ph) > -0.35; L.m.visible = L.on; });
    const lx = P.x - r.x0, lz = P.z;
    if (alarm <= 0 && lp[0]) for (const L of lasers) if (L.on && cross(lp[0], lp[1], lx, lz, L)) { alarm = 3; tripped++; c.sound.horn(0.3); c.sound.bell(); c.flash(0.6); c.shake(0.04); c.FX.tint = 0xff7070; r.owns = true; (r.lights || []).forEach((q, k) => c.lights[k] && c.lights[k].color.set(0xff2020)); c.toast('ALARM. You crossed the beam. Nobody is coming, which is worse.', 3000); c.egg('vault_alarm', 'You crossed the beam. The lights went red and nobody came. That is the internet: alarms everywhere, consequences nowhere.'); break; }
    lp = [lx, lz];
    if (alarm > 0) { alarm -= dt; alarmL.intensity = Math.sin(t * 14) > 0 ? 40 : 6; if (alarm <= 0) { alarmL.intensity = 0; c.FX.tint = null; r.owns = false; (r.lights || []).forEach((q, k) => c.lights[k] && c.lights[k].color.set(q[3])); } }
  });

  // the side vault: a niche on the west wall with the key on a cushion behind a brass gate that stands open
  niche(c, r, g, X, { side: 'w', at: -1.5, w: 2.4, d: 2.0, h: 2.6, mat: steel, floorMat: marb, light: 0xffe0a0, span: [VZ + 0.3, 2] });
  g.add(c.slab(0.8, 0.9, 0.8, marb, 1.2, 0.45, -1.5)); c.post(X(1.2), -1.5, 0.6); g.add(c.slab(0.7, 0.14, 0.7, c.surf('velvet', 1, 0x5a2fa0), 1.2, 0.97, -1.5));
  const key = new THREE.Group(); key.position.set(1.2, 1.12, -1.5); key.rotation.z = PI / 2; key.rotation.y = 0.4; g.add(key);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 10), brass); key.add(shaft); const bow = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.025, 8, 24), brass); bow.position.y = 0.32; key.add(bow); key.add(c.slab(0.09, 0.06, 0.03, brass, 0.06, -0.2, 0)); key.add(c.slab(0.07, 0.05, 0.03, brass, 0.05, -0.1, 0));
  c.clickable(key, () => { c.sound.clink(2200); key.rotation.y += 0.6; c.egg('vault_key', 'The key to the one of ones. A Spectacular is a single token, one owner, no copies. The key is patience, obviously.'); }, 'The key');
  for (let k = 0; k < 7; k++) { const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.4, 8), brass); bar.position.set(2.2 - Math.cos(1.1) * k * 0.17, 1.2, -0.3 - Math.sin(1.1) * k * 0.17); g.add(bar); }
  plate(c, g, 2.31, 3.2, -1.5, PI / 2, 'THE SIDE VAULT\nTHE KEY TO THE ONE OF ONES', 1.6, 0.4);
  const guard = cast(c, r, g, X, 'usher', 3.6, 3.6, { h: 1.8, ry: -0.8, line: 'Do not cross the beams. Do not touch the one of ones. Everybody touches the one of ones.', hint: 'The guard' });
  const vt = c.sign('THE SPECTACULAR VAULT', { w: 6, h: 0.8, bg: null, fg: '#f5c542', font: c.SERIF, weight: 900, glow: 18 }); vt.position.set(W / 2, 5.3, D / 2 - 0.2); vt.rotation.y = PI; g.add(vt);
  const cam = c.glb('ph_security_camera_01', { h: 0.3, x: 7.9, y: 5.4, z: VZ + 0.5, ry: 2.6, parent: g, shadow: false }); const cam2 = c.glb('ph_security_camera_01', { h: 0.3, x: 12.1, y: 5.4, z: VZ + 0.5, ry: 3.8, parent: g, shadow: false });
  void guard; void cam; void cam2; void ladder;
}

// =====================================================================================================================
// THE TCG ARENA. Compete and Collect, playable. Five cards each, Aura, Stamina, Skill. Pick the fight or let the card
// decide. First to seven in one attribute wins. The house sits across the table with an eye flower for a head.
// =====================================================================================================================
const POOL = [['Patient Panda', 'panda'], ['Empathy Elephant', 'elephant'], ['Gratitude Gorilla', 'gorilla'], ['Gift Goat', 'goat'], ['Gary Bee', 'bee'], ['Accountable Ant', 'ant'], ['Adaptable Alien', 'alien'], ['Alert Ape', 'ape'], ['Patient Pig', 'pig'], ['Eager Eagle', 'eagle'], ['Podcast Panther', 'panther']];
const ATTR = ['aura', 'stamina', 'skill'], ATTR_COL = { aura: 0x22d3ee, stamina: 0xff4fa3, skill: 0xf5c542 };
function tcg(c, r, g, X) {
  const { THREE } = c, wood = c.surf('oldwood', 1.6, 0x6a4a30), dark = std(c, 0x1a1a22, { roughness: 0.5 }), brassM = std(c, 0xc9a033, { metalness: 1, roughness: 0.3 }), velvet = c.surf('velvet', 1, 0x3a1e6a);
  coffer(c, r, g, { nx: 5, nz: 4, y: H_IN, mat: c.surf('planks', 2, 0x3a2a4a), bulb: 0xf5c542 });
  // the table, the playmat, the stools, the house
  const TX = 10, TZ = -1.6; g.add(c.slab(3.8, 0.08, 2.2, wood, TX, 0.92, TZ)); for (const [dx, dz] of [[-1.7, -0.9], [1.7, -0.9], [-1.7, 0.9], [1.7, 0.9]]) g.add(c.slab(0.1, 0.9, 0.1, dark, TX + dx, 0.45, TZ + dz));
  c.wall(X(TX - 1.9), TZ - 1.1, X(TX + 1.9), TZ - 1.1); c.wall(X(TX - 1.9), TZ + 1.1, X(TX + 1.9), TZ + 1.1); c.wall(X(TX - 1.9), TZ - 1.1, X(TX - 1.9), TZ + 1.1); c.wall(X(TX + 1.9), TZ - 1.1, X(TX + 1.9), TZ + 1.1);
  const mat = decal(c, 3.5, 1.9, (q, w, h) => { q.fillStyle = '#3a1e6a'; q.fillRect(0, 0, w, h); q.strokeStyle = '#f5c542'; q.lineWidth = 8; q.strokeRect(12, 12, w - 24, h - 24); q.setLineDash([10, 8]); q.lineWidth = 3; for (let k = 0; k < 5; k++) { q.strokeRect(w * 0.1 + k * w * 0.165, h * 0.06, w * 0.13, h * 0.3); q.strokeRect(w * 0.1 + k * w * 0.165, h * 0.64, w * 0.13, h * 0.3); } q.setLineDash([]); q.fillStyle = '#f5c542'; q.font = `900 ${h * 0.09}px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('COMPETE AND COLLECT', w / 2, h * 0.5); q.font = `700 ${h * 0.05}px ${c.MONO}`; q.fillText('AURA · STAMINA · SKILL · FIRST TO SEVEN', w / 2, h * 0.58); }, 384);
  mat.rotation.x = -PI / 2; mat.position.set(TX, 0.965, TZ); g.add(mat);
  g.add(c.slab(0.5, 0.45, 0.5, dark, TX, 0.225, TZ - 1.7)); const house = extra(c, g, TX, TZ - 1.7, { seated: true, col: 0x5a2fa0, ry: 0 });
  const tag = c.sign('THE HOUSE', { w: 0.8, h: 0.14, bg: '#f4ead2', fg: '#111', font: c.MONO, weight: 800, px: 48 }); tag.position.set(TX, 1.75, TZ - 1.5); g.add(tag);
  c.post(X(TX), TZ - 1.7, 0.4);
  // the scoreboard over the table
  const SB = c.canvasTex(768, 384, () => {}), sq = SB.userData.canvas.getContext('2d'), board = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshBasicMaterial({ map: SB, toneMapped: false })); board.position.set(TX, 3.6, TZ - 2.4); g.add(board);
  g.add(c.slab(3.4, 1.8, 0.06, dark, TX, 3.6, TZ - 2.44)); for (const dx of [-1.4, 1.4]) g.add(c.slab(0.03, H_IN - 4.5, 0.03, dark, TX + dx, H_IN - (H_IN - 4.5) / 2, TZ - 2.4));
  const score = { you: { aura: 0, stamina: 0, skill: 0 }, house: { aura: 0, stamina: 0, skill: 0 } };
  let sel = null, note = 'PICK A FIGHT, OR CLICK A CARD';
  const drawBoard = () => { const w = 768, h = 384; sq.fillStyle = '#0d0a14'; sq.fillRect(0, 0, w, h); sq.textAlign = 'center'; sq.textBaseline = 'middle'; sq.fillStyle = '#f4ead2'; sq.font = `800 34px ${c.MONO}`; sq.fillText('YOU', w * 0.3, 44); sq.fillText('THE HOUSE', w * 0.72, 44); ATTR.forEach((a, i) => { const y = 120 + i * 78, col = '#' + ATTR_COL[a].toString(16).padStart(6, '0'); sq.fillStyle = sel === a ? col : '#2a2436'; sq.fillRect(20, y - 30, w - 40, 60); sq.fillStyle = sel === a ? '#111' : col; sq.font = `800 30px ${c.MONO}`; sq.textAlign = 'left'; sq.fillText(a.toUpperCase(), 40, y); sq.textAlign = 'center'; sq.font = `900 44px ${c.MONO}`; sq.fillStyle = sel === a ? '#111' : '#f4ead2'; sq.fillText(String(score.you[a]), w * 0.3 + 60, y); sq.fillText(String(score.house[a]), w * 0.72 + 30, y); }); sq.fillStyle = '#f5c542'; sq.font = `700 22px ${c.MONO}`; sq.textAlign = 'center'; sq.fillText(note, w / 2, h - 30); SB.needsUpdate = true; };
  drawBoard();
  // the attribute buttons, on the table edge
  const btns = {}; ATTR.forEach((a, i) => { const b = c.slab(0.5, 0.06, 0.26, std(c, ATTR_COL[a], { roughness: 0.4, emissive: ATTR_COL[a], emissiveIntensity: 0 }), TX + (i - 1) * 0.62, 0.99, TZ + 0.78); g.add(b); const l = c.sign(a.toUpperCase(), { w: 0.46, h: 0.12, bg: null, fg: '#111', font: c.MONO, weight: 900, px: 48 }); l.rotation.x = -PI / 2; l.position.set(TX + (i - 1) * 0.62, 1.025, TZ + 0.78); g.add(l); btns[a] = b; c.clickable(b, () => { sel = sel === a ? null : a; c.sound.click(); ATTR.forEach((q) => { btns[q].material.emissiveIntensity = q === sel ? 0.6 : 0; }); note = sel ? 'THE FIGHT IS ' + sel.toUpperCase() : 'THE CARD DECIDES'; drawBoard(); }, 'Fight on ' + a); });
  // cards: a group with a face and a foil back
  const backT = c.canvasTex(256, 358, (q, w, h) => { q.fillStyle = '#5a2fa0'; q.fillRect(0, 0, w, h); q.strokeStyle = '#f5c542'; q.lineWidth = 8; q.strokeRect(12, 12, w - 24, h - 24); eyeFlower(q, w / 2, h / 2, 70, '#fbe6f0', '#f5c542'); q.fillStyle = '#f4ead2'; q.font = `800 18px ${c.MONO}`; q.textAlign = 'center'; q.fillText('COMPETE AND COLLECT', w / 2, h - 36); });
  const foil = hologram(c); foil.map = backT; const cardGeo = new THREE.PlaneGeometry(0.5, 0.7);
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const RAR = ['Core', 'Core', 'Core', 'Core', 'Core', 'Rare', 'Rare', 'Very Rare', 'Epic'];
  const mkCard = () => { const [name, id] = POOL[rnd(0, POOL.length - 1)], d = { name, id, aura: rnd(2, 6), stamina: rnd(2, 6), skill: rnd(2, 6), rarity: RAR[rnd(0, RAR.length - 1)] }; const o = new THREE.Group(); const f = new THREE.Mesh(cardGeo, new THREE.MeshStandardMaterial({ map: cardTex(c, { ...d, col: ['#5a2fa0', '#1d4ed8', '#7a1a3a', '#125740'][rnd(0, 3)], draw: (q, x, y, w, h) => marker(q, ANIMALS[id], x + (w - h) / 2, y, h, 1, 7) }), roughness: 0.5 })); o.add(f); const b = new THREE.Mesh(cardGeo, foil); b.rotation.y = PI; b.position.z = -0.002; o.add(b); o.userData.d = d; g.add(o); return o; };
  const hands = { you: [], house: [] }, pile = []; let busy = false, dealt = 0; const ev = []; const after = (dt, fn) => ev.push({ at: c.TIME.t + dt, fn });
  const home = (who, i, n) => ({ x: TX + (i - (n - 1) / 2) * 0.58, y: 1.26, z: who === 'you' ? TZ + 1.02 : TZ - 1.02, rx: who === 'you' ? -0.4 : 0.4, ry: who === 'you' ? (i - (n - 1) / 2) * -0.1 : PI });
  const place = (o, p) => { o.position.set(p.x, p.y, p.z); o.rotation.set(p.rx, p.ry, 0); };
  const kill = (o) => { o.traverse((m) => { m.visible = false; }); g.remove(o); };
  const deal = () => { for (const who of ['you', 'house']) { hands[who].forEach(kill); hands[who] = []; for (let i = 0; i < 5; i++) { const o = mkCard(); o.userData.who = who; hands[who].push(o); const p = home(who, i, 5); place(o, { ...p, y: 2.6 }); o.userData.to = p; } } dealt++; c.sound.tick(); };
  const relay = () => { for (const who of ['you', 'house']) hands[who].forEach((o, i) => { o.userData.to = home(who, i, hands[who].length); }); };
  const best = (d) => ATTR.reduce((a, b) => (d[b] > d[a] ? b : a));
  const conf = confetti(c, g);
  const trophy = new THREE.Group(); trophy.position.set(TX - 3.2, 0, TZ - 2.6); g.add(trophy); trophy.add(c.slab(0.7, 0.9, 0.7, c.surf('marble2', 1, 0x2a2a34), 0, 0.45, 0)); const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.12, 0.4, 20, 1, true), std(c, 0xf5c542, { metalness: 1, roughness: 0.25, side: THREE.DoubleSide })); cup.position.y = 1.3; trophy.add(cup); trophy.add(c.slab(0.3, 0.06, 0.3, brassM, 0, 0.93, 0)); const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.2, 10), brassM); stem.position.y = 1.05; trophy.add(stem); c.post(X(TX - 3.2), TZ - 2.6, 0.5);
  c.clickable(trophy, () => c.egg('tcg_trophy', 'The trophy is for whoever got to seven first. Not the biggest hand, the fastest count.'), 'The trophy');
  const lose = ['Seven. The house counts faster. Shuffle up.', 'That is seven. The cards were fine. The count was not.', 'Seven for the house. Patience, then speed. You had neither.'];
  const finish = (winner) => {
    busy = true;
    if (winner === 'you') { conf.burst(TX, 1.6, TZ); c.sound.applause(3); c.flash(0.3); c.egg('tcg_win', 'Seven gems in one attribute. Compete and Collect, the real rule: every battle you win is one gem, and seven of a colour takes the game.'); note = 'YOU WIN. FIRST TO SEVEN.'; }
    else { c.say(house, lose[dealt % lose.length], 4200, 1.6); c.sound.thud(0.5); note = 'THE HOUSE WINS. CLICK THE DECK.'; }
    drawBoard();
    after(4, () => { for (const a of ATTR) score.you[a] = score.house[a] = 0; pile.forEach(kill); pile.length = 0; deal(); note = 'NEW GAME. PICK A FIGHT.'; drawBoard(); busy = false; });
  };
  const play = (card) => {
    if (busy || card.userData.who !== 'you' || !hands.you.includes(card)) return; busy = true;
    const d = card.userData.d, a = sel || best(d), hc = hands.house[rnd(0, hands.house.length - 1)], hd = hc.userData.d;
    hands.you.splice(hands.you.indexOf(card), 1); hands.house.splice(hands.house.indexOf(hc), 1); relay();
    card.userData.to = { x: TX - 0.4, y: 1.0, z: TZ, rx: -PI / 2 + 0.3, ry: 0 }; hc.userData.to = { x: TX + 0.4, y: 1.0, z: TZ, rx: -PI / 2 + 0.3, ry: 0 };
    c.sound.whoosh(0.2, 0.5); note = a.toUpperCase() + ': ' + d.name.toUpperCase() + ' ' + d[a] + ' VS ' + hd.name.toUpperCase() + ' ' + hd[a]; drawBoard();
    after(1.1, () => {
      if (d[a] > hd[a]) { score.you[a] += 1; c.sound.ding(); note = 'YOU TAKE A ' + a.toUpperCase() + ' GEM, ' + d[a] + ' TO ' + hd[a]; }
      else if (hd[a] > d[a]) { score.house[a] += 1; c.sound.thud(0.3); note = 'THE HOUSE TAKES A ' + a.toUpperCase() + ' GEM, ' + hd[a] + ' TO ' + d[a]; }
      else { c.sound.click(); note = 'A TIE. NOBODY SCORES.'; }
      drawBoard();
    });
    after(2.4, () => {
      for (const o of [card, hc]) { pile.push(o); o.userData.to = { x: TX + 1.55, y: 0.97 + pile.length * 0.004, z: TZ - 0.5, rx: -PI / 2, ry: (Math.random() - 0.5) * 0.4 }; }
      const yw = ATTR.some((q) => score.you[q] >= 7), hw = ATTR.some((q) => score.house[q] >= 7);
      if (yw) return finish('you'); if (hw) return finish('house');
      if (!hands.you.length) { pile.forEach(kill); pile.length = 0; deal(); note = 'NEW HAND. SAME COUNT.'; drawBoard(); }
      busy = false;
    });
  };
  const deck = new THREE.Group(); deck.position.set(TX - 1.55, 0.96, TZ - 0.5); g.add(deck); for (let k = 0; k < 24; k++) { const s = c.slab(0.5, 0.004, 0.7, k === 23 ? foil : std(c, 0xf4ead2, { roughness: 0.8 }), 0, k * 0.004, 0); s.rotation.y = (k % 3) * 0.02; deck.add(s); }
  c.clickable(deck, () => { if (busy) return; c.sound.tick(); for (const a of ATTR) score.you[a] = score.house[a] = 0; pile.forEach(kill); pile.length = 0; deal(); note = 'FRESH DECK. PICK A FIGHT.'; drawBoard(); }, 'Shuffle and deal');
  const hint = c.sign('CLICK A CARD TO PLAY IT. THE BUTTONS PICK THE FIGHT.', { w: 2.4, h: 0.16, bg: '#0d0d0d', fg: '#f5c542', font: c.MONO, weight: 700, px: 64 }); hint.position.set(TX, 0.78, TZ + 1.11); g.add(hint);
  deal();
  c.tick((t, dt, P, ri) => {
    if (ri !== r.i) return; conf.tick(dt);
    for (let k = ev.length - 1; k >= 0; k--) if (t >= ev[k].at) { const e = ev[k]; ev.splice(k, 1); e.fn(); }
    const all = [...hands.you, ...hands.house, ...pile]; const kk = Math.min(1, dt * 6);
    for (const o of all) { const to = o.userData.to; if (!to) continue; o.position.x += (to.x - o.position.x) * kk; o.position.y += (to.y - o.position.y) * kk; o.position.z += (to.z - o.position.z) * kk; o.rotation.x += (to.rx - o.rotation.x) * kk; o.rotation.y += (to.ry - o.rotation.y) * kk; if (!o.userData.clk && o.userData.who === 'you') { o.userData.clk = true; c.clickable(o, () => play(o), 'Play ' + o.userData.d.name); } }
    house.userData.head.rotation.z = Math.sin(t * 1.5) * 0.08;
  });

  // the booster wall: sixty foil packs on a rack on the east wall
  const packs = new THREE.InstancedMesh(new THREE.BoxGeometry(0.24, 0.34, 0.04), hologram(c), 60), PM = new THREE.Matrix4(), PQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -PI / 2, 0)), PV = new THREE.Vector3(), PS = new THREE.Vector3(1, 1, 1);
  for (let k = 0; k < 60; k++) { PV.set(W - 0.46, 1.0 + Math.floor(k / 10) * 0.5, -7.0 + (k % 10) * 0.46); PM.compose(PV, PQ, PS); packs.setMatrixAt(k, PM); } g.add(packs);
  for (let j = 0; j < 7; j++) g.add(c.slab(0.3, 0.03, 4.8, dark, W - 0.5, 0.78 + j * 0.5, -4.93));
  const bw = c.sign('BOOSTER PACKS · FOIL · DO NOT OPEN THEM ALL AT ONCE', { w: 3.6, h: 0.22, bg: '#0d0d0d', fg: '#f5c542', font: c.MONO, weight: 700 }); bw.position.set(W - 0.42, 4.4, -4.93); bw.rotation.y = -PI / 2; g.add(bw);
  c.wall(X(W - 0.8), -7.4, X(W - 0.8), -2.4);
  // the glass case: the Spectacular card, in hologram, floating
  const CX = 17.2, CZ = -6.0; g.add(c.slab(0.9, 1.1, 0.9, c.surf('marble2', 1, 0x2a2a34), CX, 0.55, CZ)); c.post(X(CX), CZ, 0.7);
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.92, roughness: 0.03, thickness: 0.05, transparent: true, opacity: 0.35 });
  for (const [dx, dz, w, d] of [[-0.44, 0, 0.02, 0.9], [0.44, 0, 0.02, 0.9], [0, -0.44, 0.9, 0.02], [0, 0.44, 0.9, 0.02]]) g.add(c.slab(w, 1.0, d, glass, CX + dx, 1.6, CZ + dz)); g.add(c.slab(0.9, 0.02, 0.9, glass, CX, 2.1, CZ));
  const specM = hologram(c); specM.map = cardTex(c, { name: 'Patient Panda', aura: 6, stamina: 6, skill: 6, rarity: 'Spectacular', col: '#5a2fa0', draw: (q, x, y, w, h) => marker(q, ANIMALS.panda, x + (w - h) / 2, y, h, 1, 7) });
  const spec = new THREE.Group(); spec.position.set(CX, 1.6, CZ); g.add(spec); const sf = new THREE.Mesh(cardGeo, specM); spec.add(sf); const sb = new THREE.Mesh(cardGeo, foil); sb.rotation.y = PI; sb.position.z = -0.002; spec.add(sb);
  const spot = new THREE.PointLight(0xf5c542, 4, 3, 1.5); spot.position.set(CX, 2.3, CZ); g.add(spot);
  c.clickable(spec, () => { c.sound.clink(3000); c.egg('tcg_spectacular', 'The Spectacular card, in hologram, behind glass. Look, do not touch. The glass is the point.'); }, 'The Spectacular');
  plate(c, g, CX, 0.9, CZ + 0.46, 0, 'SPECTACULAR\nONE OF ONE, IN HOLOGRAM', 0.8, 0.26);
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; spec.rotation.y = t * 0.7; spec.position.y = 1.6 + Math.sin(t * 1.4) * 0.05; });

  // the grading booth: a niche on the west wall with a counter and a magnifier over a card
  niche(c, r, g, X, { side: 'w', at: -5.0, w: 2.4, d: 2.0, h: 2.6, mat: c.surf('plaster', 2.4, 0x2a1a44), floorMat: c.surf('checker', 1, 0xd8d0c8), light: 0xffffff });
  g.add(c.slab(1.6, 0.9, 0.7, wood, 1.3, 0.45, -5.0)); c.wall(X(0.5), -5.35, X(2.1), -5.35); c.wall(X(0.5), -4.65, X(2.1), -4.65); c.wall(X(2.1), -5.35, X(2.1), -4.65);
  const gcard = mkCard(); gcard.position.set(1.3, 0.92, -5.0); gcard.rotation.x = -PI / 2; gcard.userData.to = null;
  const mag = new THREE.Group(); mag.position.set(1.3, 1.25, -5.0); g.add(mag); mag.add(new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 10, 32), dark)).rotation.x = PI / 2; const lens = new THREE.Mesh(new THREE.CircleGeometry(0.21, 32), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.9, roughness: 0.02, thickness: 0.3, ior: 1.6, transparent: true, side: THREE.DoubleSide })); lens.rotation.x = -PI / 2; mag.add(lens); const hdl = c.slab(0.05, 0.05, 0.5, dark, 0, 0, 0.45); mag.add(hdl);
  c.clickable(mag, () => { c.sound.click(); c.egg('tcg_grade', 'The grading booth. Everybody wants a ten. Put the card under the glass and it is a seven, like most of us.'); }, 'The magnifier');
  const gr = c.sign('GRADING\nMINT 10 · NEAR MINT 9 · HONEST 7', { w: 1.6, h: 0.4, bg: '#0d0d0d', fg: '#f5c542', font: c.MONO, weight: 800, px: 128 }); gr.position.set(0.22, 2.0, -5.0); gr.rotation.y = PI / 2; g.add(gr);
  for (let k = 0; k < 8; k++) { const sl = c.slab(0.06, 0.09, 0.012, new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.8, roughness: 0.05, transparent: true }), 0.6 + k * 0.09, 0.97, -5.3); g.add(sl); }
  c.glb('ph_desk_lamp_arm_01', { h: 0.5, x: 1.9, y: 0.9, z: -4.75, ry: 2.4, parent: g, shadow: false }); c.glb('ph_folding_wooden_stool', { h: 0.5, x: 1.0, z: -4.2, parent: g }); c.post(X(1.0), -4.2, 0.3);
  // the card facts, on plaques by the door and the picture
  const facts = [['SERIES 1 PREMIUM CARD BOXES\nWITH ZEROCOOL, 2022.\nTHE FIRST VEEFRIENDS CARDS YOU COULD HOLD.', 2.0, -7.84, 0], ['SERIES 2 BROUGHT THE GAME.\nCOMPETE AND COLLECT: AURA, STAMINA, SKILL.\nFIRST TO SEVEN IN ONE ATTRIBUTE WINS.', 18.0, -7.84, 0], ['TOPPS CHROME VEEFRIENDS, 2025.\nONE HUNDRED CHARACTERS,\nWITH REFRACTORS.', 4.0, D / 2 - 0.2, PI], ['TOPPS CHROME VEEFRIENDS, 2026.\nA TWO HUNDRED CARD BASE SET.', 16.0, D / 2 - 0.2, PI]];
  facts.forEach(([txt, x, z, ry]) => plate(c, g, x, 4.4, z, ry, txt, 2.6, 0.7));
  const arena = c.sign('THE TCG ARENA', { w: 6, h: 0.8, bg: null, fg: '#f5c542', font: c.SERIF, weight: 900, glow: 18 }); arena.position.set(W / 2, PORTAL.h + 0.9, -D / 2 + 0.16); g.add(arena);
  neon(c, g, 4.2, PORTAL.h + 0.2, -D / 2 + 0.2, 15.8, PORTAL.h + 0.2, -D / 2 + 0.2, 0x9a6cff);
  // the crowd: two rows of seated extras along the south, a pennant line, a column pair
  for (let k = 0; k < 6; k++) { const x = 2.2 + k * 1.2 + (k > 2 ? 8.4 : 0); if (x > 7.6 && x < 12.4) continue; g.add(c.slab(0.5, 0.45, 0.5, dark, x, 0.225, 6.4)); extra(c, g, x, 6.4, { seated: true, col: [0x5a2fa0, 0xf5c542, 0x22d3ee][k % 3], ry: PI + (k % 2 ? 0.3 : -0.3) }); c.post(X(x), 6.4, 0.35); }
  column(c, r, g, X, 3.6, -6.6, { h: H_IN, rad: 0.3, mat: c.surf('marble2', 1, 0xd8d0c8) }); column(c, r, g, X, 16.4, -6.6, { h: H_IN, rad: 0.3, mat: c.surf('marble2', 1, 0xd8d0c8) });
  for (let k = 0; k < 14; k++) { const pen = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-0.18, 0), new THREE.Vector2(0.18, 0), new THREE.Vector2(0, -0.4)])), std(c, [0x5a2fa0, 0xf5c542, 0xff4fa3][k % 3], { side: THREE.DoubleSide })); pen.position.set(1.5 + k * 1.3, 5.3 - Math.sin(k / 13 * PI) * 0.4, 4.0); g.add(pen); }
  g.add(c.slab(18, 0.015, 0.015, dark, 10, 5.3, 4.0));
  cast(c, r, g, X, 'clerk', 16.6, 1.2, { h: 1.75, ry: -2.2, line: 'The rule is first to seven in one attribute. People play all three and wonder why they lose.', hint: 'The judge' });
  void gcard; void velvet;
}

// =====================================================================================================================
// THE VEEDOME. The arena from the animated series: a sand floor with a battle circle, a purple and gold dome, tiers of
// flower headed fans on three sides, and the parade of friends walking the ring at eight sizes. Keep pace with them for
// five seconds and the dome counts you as one of them.
// =====================================================================================================================
function veedome(c, r, g, X) {
  const { THREE } = c, conc = c.surf('concrete', 2, 0x6a5a8a), concD = c.surf('concrete', 1.4, 0x4a3a66), sand = c.surf('sand', 2.2, 0xc8b088), dark = std(c, 0x1a1a22, { roughness: 0.5 }), brassM = std(c, 0xc9a033, { metalness: 1, roughness: 0.3 });
  const CX = 10, CZ = -2.6, R = 3.8;
  // the dome: a squashed half sphere seen from inside, purple to gold, with three rings of bulbs
  const domeT = c.canvasTex(1024, 512, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f5c542'); gr.addColorStop(0.25, '#8a5fd0'); gr.addColorStop(0.7, '#3a1e6a'); gr.addColorStop(1, '#1a0a30'); q.fillStyle = gr; q.fillRect(0, 0, w, h); q.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 400; i++) { const x = Math.random() * w, y = Math.random() * h * 0.6; q.fillRect(x, y, 2, 2); } q.strokeStyle = 'rgba(245,197,66,.5)'; q.lineWidth = 6; for (let k = 0; k < 16; k++) { q.beginPath(); q.moveTo(k * w / 16, h); q.lineTo(k * w / 16 + w / 32, 0); q.stroke(); } });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(9.6, 48, 20, 5.585, 4.54, 0, PI / 2), new THREE.MeshBasicMaterial({ map: domeT, side: THREE.BackSide, toneMapped: false })); dome.position.set(CX, 2.2, 0); dome.scale.y = 0.4; g.add(dome);   // open toward the picture, like a proscenium
  const bulbG = new THREE.SphereGeometry(0.07, 8, 6), bulbM = new THREE.InstancedMesh(bulbG, basic(c, 0xfff0c0), 96), BM = new THREE.Matrix4(); let bi = 0;
  for (const [rr, yy] of [[9.0, 3.5], [7.35, 4.67], [4.5, 5.59]]) for (let k = 0; k < 32; k++) { const a = k / 32 * PI * 2, dx = Math.cos(a) * rr, dz = Math.sin(a) * rr; if (dz < 0 && Math.abs(dx) < -dz * 1.19) continue; BM.makeTranslation(CX + dx, yy, dz); bulbM.setMatrixAt(bi++, BM); } bulbM.count = bi; g.add(bulbM);
  // the battle circle on the sand
  const ring = decal(c, 2 * R + 1.6, 2 * R + 1.6, (q, w) => { const cx = w / 2; q.lineWidth = w * 0.02; q.strokeStyle = '#f5c542'; q.beginPath(); q.arc(cx, cx, w * 0.47, 0, 7); q.stroke(); q.strokeStyle = '#5a2fa0'; q.lineWidth = w * 0.012; q.beginPath(); q.arc(cx, cx, w * 0.36, 0, 7); q.stroke(); q.setLineDash([w * 0.03, w * 0.02]); q.strokeStyle = '#f5c542'; q.beginPath(); q.arc(cx, cx, w * 0.18, 0, 7); q.stroke(); q.setLineDash([]); for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; q.beginPath(); q.moveTo(cx + Math.cos(a) * w * 0.36, cx + Math.sin(a) * w * 0.36); q.lineTo(cx + Math.cos(a) * w * 0.47, cx + Math.sin(a) * w * 0.47); q.stroke(); } q.fillStyle = '#5a2fa0'; q.font = `900 ${w * 0.05}px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('THE VEEDOME', cx, cx + w * 0.015); }, 1024);
  ring.rotation.x = -PI / 2; ring.position.set(CX, 0.02, CZ); g.add(ring);
  c.clickable(ring, () => c.egg('veedome_circle', 'The battle circle. In the animated series the friends settle it in the VeeDome. Here you settle it by walking in step.'), 'The battle circle');
  const rimM = new THREE.Mesh(new THREE.TorusGeometry(R + 0.9, 0.08, 8, 64), brassM); rimM.rotation.x = PI / 2; rimM.position.set(CX, 0.08, CZ); g.add(rimM);
  // the tiers: four steps on three sides, a tunnel in the south where you arrive, a locker room under the east seats
  const STEP = 0.55, DEEP = 0.72, tiers = [];
  const tier = (x1, z1, x2, z2, side) => { for (let k = 0; k < 4; k++) { const d = DEEP * (4 - k); let sx, sz, cx, cz; if (side === 'w') { sx = d; sz = z2 - z1; cx = x1 + d / 2; cz = (z1 + z2) / 2; } else if (side === 'e') { sx = d; sz = z2 - z1; cx = x2 - d / 2; cz = (z1 + z2) / 2; } else { sx = x2 - x1; sz = d; cx = (x1 + x2) / 2; cz = z2 - d / 2; } g.add(c.slab(sx, STEP, sz, k % 2 ? concD : conc, cx, STEP * k + STEP / 2, cz)); } tiers.push([x1, z1, x2, z2, side]); };
  tier(0.3, -7.5, 3.2, 1.8, 'w'); tier(16.8, -7.5, 19.7, -5.6, 'e'); tier(16.8, -2.4, 19.7, 1.8, 'e'); tier(0.3, 5.0, 7.4, 7.8, 's'); tier(12.6, 5.0, 16.2, 7.8, 's');
  const stepAt = (x, z) => { let h = 0; for (const [x1, z1, x2, z2, side] of tiers) { if (x < x1 || x > x2 || z < z1 || z > z2) continue; const into = side === 'w' ? x - x1 : side === 'e' ? x2 - x : z2 - z; const k = Math.max(0, Math.min(4, Math.ceil((DEEP * 4 - into) / DEEP))); h = Math.max(h, k * STEP); } return h; };
  r.ground = (x, z) => stepAt(x, z);
  // the locker room, under the east seats: a roof slab, two jambs, lockers, a bench, five jerseys numbered five
  g.add(c.slab(2.9, 0.2, 3.2, concD, 18.25, 2.1, -4.0)); g.add(c.slab(2.9, STEP, 3.2, conc, 18.25, 2.2 + STEP / 2, -4.0)); for (const z of [-5.6, -2.4]) { g.add(c.slab(2.9, 2.0, 0.2, concD, 18.25, 1.0, z)); c.wall(X(16.8), z, X(19.7), z); }
  const ll = new THREE.PointLight(0xfff0d0, 6, 5, 1.6); ll.position.set(18.2, 1.8, -4.0); g.add(ll);
  g.add(c.slab(0.4, 0.06, 2.4, c.surf('planks', 1, 0xa88860), 17.3, 0.46, -4.0)); for (const z of [-5.0, -3.0]) g.add(c.slab(0.06, 0.44, 0.06, dark, 17.3, 0.22, z)); c.wall(X(17.1), -5.2, X(17.1), -2.8);
  for (let k = 0; k < 5; k++) { const z = -5.2 + k * 0.6; g.add(c.slab(0.3, 1.9, 0.5, c.surf('metal', 1, 0x8a8c90), 19.35, 0.95, z)); const vent = decal(c, 0.2, 0.3, (q, w, h) => { q.fillStyle = '#333'; for (let i = 0; i < 6; i++) q.fillRect(0, i * h / 6 + 2, w, 3); }, 64); vent.rotation.y = -PI / 2; vent.position.set(19.19, 1.5, z); g.add(vent); const jersey = c.sign('5', { w: 0.36, h: 0.44, bg: '#5a2fa0', fg: '#f5c542', font: c.SERIF, weight: 900, px: 128, border: '#f5c542' }); jersey.position.set(19.18, 0.95, z); jersey.rotation.y = -PI / 2; g.add(jersey); const hook = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), brassM); hook.position.set(19.17, 1.22, z); g.add(hook); c.clickable(jersey, () => { c.sound.click(); c.egg('veedome_locker', 'Number five on every jersey. His number since Queens, and the only number in the building.'); }, 'Jersey number five'); }
  const lsign = c.sign('LOCKER ROOM · HOME · NUMBER 5', { w: 1.8, h: 0.2, bg: '#0d0d0d', fg: '#f5c542', font: c.MONO, weight: 700 }); lsign.position.set(16.78, 2.5, -4.0); lsign.rotation.y = -PI / 2; g.add(lsign);
  const board = decal(c, 1.2, 0.8, (q, w, h) => { q.fillStyle = '#f4ead2'; q.fillRect(0, 0, w, h); q.strokeStyle = '#5a2fa0'; q.lineWidth = 6; q.beginPath(); q.arc(w / 2, h / 2, h * 0.32, 0, 7); q.stroke(); q.setLineDash([8, 8]); q.beginPath(); q.arc(w / 2, h / 2, h * 0.42, 0, 7); q.stroke(); q.setLineDash([]); q.fillStyle = '#141414'; q.font = `800 ${h * 0.11}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('WALK THE RING. KEEP PACE.', w / 2, h * 0.92); q.fillText('THE PLAN', w / 2, h * 0.12); }, 256); board.rotation.y = PI / 2; board.position.set(16.9, 1.3, -2.4); g.add(board);
  // the fans: instanced bodies and flower heads on the steps, facing the ring
  const seats = []; tiers.forEach(([x1, z1, x2, z2, side]) => { for (let k = 0; k < 4; k++) { const into = DEEP * (4 - k) - DEEP * 0.5, y = STEP * (k + 1); const L = side === 's' ? x2 - x1 : z2 - z1; for (let u = 0.4; u < L - 0.3; u += 0.8) { if (Math.random() < 0.25) continue; let x, z; if (side === 'w') { x = x1 + into; z = z1 + u; } else if (side === 'e') { x = x2 - into; z = z1 + u; } else { x = x1 + u; z = z2 - into; } if (side === 'e' && z > -5.7 && z < -2.3 && k < 4) continue; seats.push([x, y, z]); } } });
  const n = seats.length, bodies = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.24, 0.72, 10), std(c, 0xffffff, { roughness: 0.8 }), n), heads = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshStandardMaterial({ map: headTex(c), transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, roughness: 0.6 }), n);
  const SM = new THREE.Matrix4(), SQ = new THREE.Quaternion(), SE = new THREE.Euler(), SV = new THREE.Vector3(), SS = new THREE.Vector3(1, 1, 1), SC = new THREE.Color(), cols = [0x5a2fa0, 0xf5c542, 0xffffff, 0xff4fa3, 0x22d3ee];
  seats.forEach(([x, y, z], i) => { const ry = Math.atan2(CX - x, CZ - z); SE.set(0, ry, 0); SQ.setFromEuler(SE); SV.set(x, y + 0.36 + 0.45, z); SM.compose(SV, SQ, SS); bodies.setMatrixAt(i, SM); bodies.setColorAt(i, SC.set(cols[i % 5])); SV.set(x, y + 0.98 + 0.45, z); SM.compose(SV, SQ, SS); heads.setMatrixAt(i, SM); });
  g.add(bodies); g.add(heads);
  // the parade: eight friends at eight sizes, walking the ring, each with a collider that walks with it
  const PAR = [['panda', 3.2], ['ant', 0.5], ['elephant', 2.6], ['bee', 0.7], ['gorilla', 2.0], ['goat', 1.4], ['blackcat', 0.9], ['alien', 1.6]], OMEGA = 0.6, figs = [];
  PAR.forEach(([nm, h], k) => { const ph = k / PAR.length * PI * 2, m = vf(c, g, nm, { h, x: CX + Math.cos(ph) * R, z: CZ + Math.sin(ph) * R }); const post = c.post(X(CX), CZ, 0.2 + h * 0.12); figs.push({ m, h, ph, post, k }); c.clickable(m, () => c.say(m, ['Keep up.', 'Left, right, left. It is not hard.', 'Walk with us. Five seconds.', 'The small ones set the pace.'][k % 4], 2600, h + 0.2), 'The parade'); });
  const conf = confetti(c, g);
  // the big screen above the picture: friends in the dome, growing with the time you spend
  const scr = c.canvasTex(1024, 192, () => {}), sq2 = scr.userData.canvas.getContext('2d'), screen = new THREE.Mesh(new THREE.PlaneGeometry(11, 1.5), new THREE.MeshBasicMaterial({ map: scr, toneMapped: false })); screen.position.set(W / 2, PORTAL.h + 0.85, -D / 2 + 0.16); g.add(screen);
  let friends = n + PAR.length, shown = -1, spent = 0, full = false;
  const drawScreen = () => { sq2.fillStyle = '#0a0614'; sq2.fillRect(0, 0, 1024, 192); sq2.fillStyle = '#f5c542'; sq2.font = `900 92px ${c.MONO}`; sq2.textAlign = 'center'; sq2.textBaseline = 'middle'; sq2.fillText('FRIENDS IN THE DOME: ' + friends, 512, 96); for (let k = 0; k < 24; k++) { sq2.fillStyle = (k + (friends | 0)) % 2 ? '#5a2fa0' : '#f5c542'; sq2.fillRect(k * 1024 / 24, 0, 1024 / 24, 12); sq2.fillRect(k * 1024 / 24, 180, 1024 / 24, 12); } scr.needsUpdate = true; };
  drawScreen();
  // keeping pace: your angle round the ring, your angular speed against the parade's, five seconds in step
  let phi0 = null, wsm = 0, pace = 0, joined = false, lp = null, spd = 0;
  c.tick((t, dt, P, ri) => {
    if (ri !== r.i) { phi0 = null; lp = null; return; }
    conf.tick(dt);
    figs.forEach((f) => { const a = f.ph + t * OMEGA, x = CX + Math.cos(a) * R, z = CZ + Math.sin(a) * R; f.m.position.set(x, Math.abs(Math.sin(t * 4.5 + f.k)) * 0.05 * f.h, z); f.m.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a)); f.post.x = X(x); f.post.z = z; });
    spent += dt; const want = n + PAR.length + Math.floor(spent * 1.5); if (want !== friends) { friends = want; if (((friends - shown) | 0) !== 0) { shown = friends; drawScreen(); } if (friends >= 268 && !full) { full = true; c.sound.applause(3); c.egg('veedome_full', 'Two hundred and sixty eight in the dome. The whole Series 1 cast, by headcount. You were the last one in.'); } }
    const dx = P.x - X(CX), dz = P.z - CZ, rad = Math.hypot(dx, dz), phi = Math.atan2(dz, dx);
    if (lp) { const s = Math.hypot(P.x - lp[0], P.z - lp[1]) / Math.max(dt, 1e-3); spd += (s - spd) * Math.min(1, dt * 5); } lp = [P.x, P.z];
    if (phi0 !== null) { let d = phi - phi0; if (d > PI) d -= PI * 2; if (d < -PI) d += PI * 2; wsm += (d / Math.max(dt, 1e-3) - wsm) * Math.min(1, dt * 4); } phi0 = phi;
    const near = figs.some((f) => Math.hypot(f.m.position.x - (P.x - r.x0), f.m.position.z - P.z) < 2.6);
    const inStep = rad > 2.6 && rad < 7.5 && spd > 0.3 && Math.abs(wsm - OMEGA) < 0.2 && near;
    pace = inStep ? pace + dt : Math.max(0, pace - dt * 1.5);
    if (pace > 5 && !joined) { joined = true; conf.burst(P.x - r.x0, 2.2, P.z); c.sound.applause(3.5); c.sound.chant(); c.flash(0.3); c.egg('veedome_parade', 'You joined the parade. Five seconds in step with the friends and the dome counts you as one of them.'); friends += 1; drawScreen(); }
  });
  // the tunnel you arrive through, flags round the ring, a title
  g.add(c.slab(5.2, 0.4, 2.4, concD, 10, 3.4, 6.8)); for (const x of [7.6, 12.4]) g.add(c.slab(0.3, 3.2, 2.4, concD, x, 1.6, 6.8)); c.wall(X(7.6), 5.6, X(7.6), 8); c.wall(X(12.4), 5.6, X(12.4), 8);
  const tun = c.sign('PLAYERS TUNNEL · HOME', { w: 2.6, h: 0.26, bg: '#0d0d0d', fg: '#f5c542', font: c.MONO, weight: 700 }); tun.position.set(10, 3.05, 5.58); g.add(tun);
  for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2 + 0.3, x = CX + Math.cos(a) * (R + 1.5), z = CZ + Math.sin(a) * (R + 1.5) * 0.9; if (z > 0.6) continue; const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 3.2, 8), brassM); pole.position.set(x, 1.6, z); g.add(pole); const flag = c.slab(0.02, 0.5, 0.8, std(c, k % 2 ? 0x5a2fa0 : 0xf5c542, { roughness: 0.8, side: THREE.DoubleSide }), 0, 1.3, 0.4); pole.add(flag); flag.rotation.y = a; c.post(X(x), z, 0.15); }
  const title = c.sign('THE VEEDOME', { w: 5, h: 0.7, bg: null, fg: '#f5c542', font: c.SERIF, weight: 900, glow: 18 }); title.position.set(10, 5.2, D / 2 - 0.2); title.rotation.y = PI; g.add(title);
  const kick = c.sign('KEEP PACE WITH THE PARADE FOR FIVE SECONDS. SAME SPEED, SAME WAY ROUND.', { w: 5.2, h: 0.22, bg: '#0d0d0d', fg: '#f4ead2', font: c.MONO, weight: 700 }); kick.position.set(10, 4.6, D / 2 - 0.2); kick.rotation.y = PI; g.add(kick);
  cast(c, r, g, X, 'usher', 5.2, 3.6, { h: 1.8, ry: 0.8, line: 'The parade goes round all day. Nobody walks with it. Walk with it.', hint: 'The usher' });
  const gong = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 32), brassM); gong.rotation.x = PI / 2; gong.position.set(14.6, 1.5, 4.0); g.add(gong); for (const dx of [-0.6, 0.6]) g.add(c.slab(0.05, 2.0, 0.05, dark, 14.6 + dx, 1.0, 4.0)); g.add(c.slab(1.3, 0.05, 0.05, dark, 14.6, 2.0, 4.0)); c.post(X(14.6), 4.0, 0.5);
  c.clickable(gong, () => { c.sound.bell(); c.sound.boom(0.3); c.toast('The gong. The parade does not stop for it.', 2200); }, 'The gong');
}

// ---------- exports: the builders, the Poly Haven props per room, and where the twelve New Yorkers hang ----------
export const ROOMS_A = { doodle, vault, tcg, veedome };
export const PROPS_A = {
  doodle: [
    ['desk_lamp_arm_01', 1.3, -5.5, { h: 0.5, y: 0.79, ry: 2.2 }], ['office_notepads', 0.6, -4.5, { len: 0.25, y: 0.79 }], ['office_notepads', 1.2, -5.4, { len: 0.22, y: 0.79, ry: 0.6 }],
    ['folding_wooden_stool', 1.9, -4.6, { h: 0.5, ry: 0.4, r: 0.3 }], ['cardboard_box_01', 17.6, 5.2, { len: 0.6, r: 0.4 }], ['cardboard_box_01', 17.6, 5.2, { len: 0.55, y: 0.42, ry: 0.4 }], ['cardboard_box_01', 18.4, 4.4, { len: 0.6, r: 0.4 }],
    ['potted_plant_02', 0.9, 6.9, { h: 1.5, r: 0.4 }], ['metal_office_desk', 16.6, -0.4, { len: 1.5, ry: -PI / 2, r: 0.8 }], ['office_notepads', 16.6, -0.6, { len: 0.25, y: 0.76 }], ['classic_laptop', 16.6, 0.0, { len: 0.4, y: 0.76, ry: -PI / 2 }],
    ['wall_clock', 19.6, 6.8, { h: 0.5, y: 2.8, ry: -PI / 2 }], ['modern_ceiling_lamp_01', 7, 1, { h: 0.6, y: 5.3 }], ['modern_ceiling_lamp_01', 13, 1, { h: 0.6, y: 5.3 }],
  ],
  vault: [
    ['hand_truck', 14.2, 6.6, { h: 1.2, ry: 2.6, r: 0.45 }], ['cardboard_box_01', 14.9, 6.2, { len: 0.55, r: 0.35 }], ['cardboard_box_01', 14.9, 6.2, { len: 0.5, y: 0.42, ry: 0.5 }],
    ['metal_stool_01', 2.8, 4.6, { h: 0.7, r: 0.3 }], ['wall_clock', 0.2, 6.8, { h: 0.5, y: 2.8, ry: PI / 2 }], ['metal_trash_can', 19.0, 7.0, { h: 0.9, r: 0.35 }],
    ['caged_hanging_light', 9.0, -5.8, { h: 0.5, y: 3.3 }], ['caged_hanging_light', 11.0, -5.8, { h: 0.5, y: 3.3 }], ['plastic_crate_01', 6.0, 6.8, { h: 0.32, r: 0.35 }],
    ['hanging_industrial_lamp', 5, 1, { h: 0.5, y: 5.3 }], ['hanging_industrial_lamp', 15, 1, { h: 0.5, y: 5.3 }],
  ],
  tcg: [
    ['classic_laptop', 1.0, -5.2, { len: 0.4, y: 0.9, ry: PI / 2 }], ['cardboard_box_01', 18.6, -1.2, { len: 0.6, r: 0.4 }], ['cardboard_box_01', 18.6, -1.2, { len: 0.55, y: 0.42, ry: 0.3 }], ['cardboard_box_01', 18.0, -0.5, { len: 0.6, r: 0.4 }],
    ['wall_clock', 19.6, 6.8, { h: 0.5, y: 2.8, ry: -PI / 2 }], ['security_camera_01', 0.4, -7.6, { h: 0.3, y: 5.4, ry: 0.8 }], ['potted_plant_01', 0.9, 6.9, { h: 1.6, r: 0.4 }],
    ['hanging_industrial_lamp', 8.6, -1.6, { h: 0.5, y: 5.3 }], ['hanging_industrial_lamp', 11.4, -1.6, { h: 0.5, y: 5.3 }], ['painted_wooden_bench', 4.0, 7.2, { len: 2.2, ry: PI, r: 0.9 }], ['painted_wooden_bench', 16.0, 7.2, { len: 2.2, ry: PI, r: 0.9 }],
    ['chess_set', 6.2, -5.4, { len: 0.5, y: 0.6 }], ['side_table_01', 6.2, -5.4, { h: 0.6, r: 0.35 }], ['metal_stool_01', 7.0, -5.4, { h: 0.7, r: 0.3 }],
  ],
  veedome: [
    ['portable_searchlight', 4.2, -6.6, { h: 1.1, ry: 0.6, r: 0.4 }], ['portable_searchlight', 15.8, -6.6, { h: 1.1, ry: -0.6, r: 0.4 }],
    ['Megaphone_01', 6.0, 2.0, { len: 0.45, y: 0.42, ry: 1.2 }], ['plastic_crate_02', 6.0, 2.0, { h: 0.4, r: 0.3 }], ['metal_trash_can', 13.4, 4.6, { h: 0.9, r: 0.35 }],
    ['concrete_road_barrier', 6.4, 5.2, { len: 1.6, ry: 0.2 }], ['concrete_road_barrier', 13.6, 5.2, { len: 1.6, ry: -0.2 }],
    ['american_football', 17.6, -3.4, { len: 0.3, y: 0.5, ry: 0.4 }], ['plastic_bottle_gallon', 17.3, -4.8, { h: 0.3, y: 0.49 }],
  ],
};
const S = (x, y, z, ry, w) => ({ x, y, z, ry, w });
export const SLOTS_A = {
  doodle: () => [S(7.1, 2.1, D / 2 - 0.14, PI, 1.3), S(8.7, 2.1, D / 2 - 0.14, PI, 1.3), S(10.3, 2.1, D / 2 - 0.14, PI, 1.3), S(11.9, 2.1, D / 2 - 0.14, PI, 1.3), S(W - 0.4, 2.1, 0.4, -PI / 2, 1.3), S(W - 0.4, 2.1, 6.8, -PI / 2, 1.3), S(0.14, 2.1, 6.8, PI / 2, 1.3), S(1.2, 2.1, -D / 2 + 0.14, 0, 1.4), S(17.0, 2.1, -D / 2 + 0.14, 0, 1.4), S(18.7, 2.1, -D / 2 + 0.14, 0, 1.4), S(2.31, 2.1, -7.2, PI / 2, 1.2), S(0.22, 2.0, -5.0, PI / 2, 1.2)],
  vault: () => { const o = []; for (let i = 0; i < 7; i++) o.push(S(2.2 + i * 2.6, 2.8, D / 2 - 0.14, PI, 1.5)); o.push(S(W - 0.5, 2.8, -2.6, -PI / 2, 1.3), S(W - 0.5, 2.8, -1.0, -PI / 2, 1.3), S(2.31, 2.8, -3.5, PI / 2, 1.3), S(2.31, 2.8, 0.9, PI / 2, 1.3), S(8.32, 2.6, -5.8, PI / 2, 1.2)); return o; },
  tcg: () => { const o = []; for (let i = 0; i < 7; i++) o.push(S(2.2 + i * 2.6, 2.1, D / 2 - 0.14, PI, 1.5)); o.push(S(2.31, 2.1, -2.6, PI / 2, 1.3), S(2.31, 2.1, -1.0, PI / 2, 1.3), S(2.31, 2.1, 0.6, PI / 2, 1.3), S(1.2, 2.1, -D / 2 + 0.14, 0, 1.4), S(18.6, 2.1, -D / 2 + 0.14, 0, 1.4)); return o; },
  veedome: () => [S(1.8, 3.6, D / 2 - 0.14, PI, 1.3), S(3.6, 3.6, D / 2 - 0.14, PI, 1.3), S(5.4, 3.6, D / 2 - 0.14, PI, 1.3), S(14.0, 3.6, D / 2 - 0.14, PI, 1.3), S(15.8, 3.6, D / 2 - 0.14, PI, 1.3), S(17.6, 3.6, D / 2 - 0.14, PI, 1.3), S(0.14, 3.6, -6.4, PI / 2, 1.3), S(0.14, 3.6, -4.6, PI / 2, 1.3), S(0.14, 3.6, -2.8, PI / 2, 1.3), S(0.14, 3.6, -1.0, PI / 2, 1.3), S(W - 0.4, 3.6, -6.6, -PI / 2, 1.3), S(W - 0.4, 3.6, 0.4, -PI / 2, 1.3)],
};
