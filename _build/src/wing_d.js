// wing_d.js: two rooms of THE VEEFRIENDS WING. GAME DAY, the end zone and the last twenty yards of a field at night with a
// route to run and a scoreboard stuck in 1969; and THE FEED, a corridor of nine by sixteen screens scrolled by a giant
// thumb that only stops when you stand still and look. Built on the engine context `c` from main.js; nothing here edits
// build.js, main.js, rooms.js or fx.js. The helpers it needs from build.js are copied below so the file stands alone.
import { W, D, H_IN } from './rooms.js';
import { crowdBody } from './crowd.js';
import { neon } from './fx.js';

const PI = Math.PI;
const GREEN = '#125740', JETS = 0x125740, GOLD = 0xf5c542;

// ---------- helpers copied from build.js (same shapes, same names) ----------
const basic = (c, color, o = {}) => new c.THREE.MeshBasicMaterial({ color, toneMapped: false, ...o });
const std = (c, color, o = {}) => new c.THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function eyeFlower(g, x, y, R, petal = '#fbe6f0', edge = '#ff4fa3') {
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * PI * 2; g.save(); g.translate(x, y); g.rotate(a);
    const gr = g.createLinearGradient(0, 0, R, 0); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.6, petal); gr.addColorStop(1, edge);
    g.fillStyle = gr; g.beginPath(); g.ellipse(R * 0.55, 0, R * 0.5, R * 0.26, 0, 0, PI * 2); g.fill(); g.restore();
  }
  [[0.42, '#1d4ed8'], [0.32, '#ffffff'], [0.22, '#22d3ee'], [0.12, '#0b1020']].forEach(([k, col]) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, R * k, 0, PI * 2); g.fill(); });
  g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(x - R * 0.06, y - R * 0.06, R * 0.04, 0, PI * 2); g.fill();
}
function decal(c, w, h, draw, px = 256) { const t = c.canvasTex(Math.round(px * w / h), px, draw); return new c.THREE.Mesh(new c.THREE.PlaneGeometry(w, h), new c.THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); }
const HEAD = {};
function headTex(c) { return (HEAD.t ||= c.canvasTex(256, 256, (q, w) => eyeFlower(q, w / 2, w / 2, w / 2 * 0.98))); }
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
function cast(c, r, g, X, name, x, z, { h = 1.8, ry = 0, y = 0, r: rad = 0.4, line, egg, hint, fn } = {}) {
  const m = c.glb(name, { h, x, y, z, ry, parent: g });
  if (rad) c.post(X(x), z, rad);
  if (line || fn) c.clickable(m, () => { if (line) c.say(m, line, 3600, h + 0.3); if (egg) c.egg(egg); fn && fn(m); }, hint || 'Say hello');
  return m;
}
function plaque(c, g, x, y, z, ry, text, who = 'GARY VAYNERCHUK', w = 1.6) {
  const s = c.sign(`"${text}"\n${who}`, { w, h: w * 0.28, bg: '#f4ead2', fg: '#111', font: c.SERIF, weight: 700, px: 160, pad: 0.1 });
  s.position.set(x, y, z); s.rotation.y = ry; g.add(s); return s;
}
// a niche built out from the south wall, inside the room, that you can walk into: two sides, a roof, the room wall as its back
function nook(c, r, g, X, { x, w = 2.8, d = 2.0, h = 2.8, mat, roofMat, light = 0xffd9a8, lightI = 5 }) {
  const { THREE } = c, m = mat || c.surf('planks', 2, 0x8a6a48), rm = roofMat || m, z0 = D / 2 - d, zc = D / 2 - d / 2;
  g.add(c.slab(0.12, h, d, m, x - w / 2, h / 2, zc)); g.add(c.slab(0.12, h, d, m, x + w / 2, h / 2, zc)); g.add(c.slab(w + 0.12, 0.12, d, rm, x, h + 0.06, zc));
  c.wall(X(x - w / 2), z0, X(x - w / 2), D / 2); c.wall(X(x + w / 2), z0, X(x + w / 2), D / 2);
  if (light) { const l = new THREE.PointLight(light, lightI, 5, 1.6); l.position.set(x, h - 0.4, zc); g.add(l); }
  return { x, z0, zc, h, w, d };
}
// confetti, the VeeCon way: a field of instanced ribbons that falls when you earn it
function confetti(c, g, { n, cols, x0 = 0, x1 = W, z0 = -7, z1 = 3, y0 = 6, y1 = 12 }) {
  const { THREE } = c, N = c.MOBILE ? Math.round(n * 0.4) : n, geo = new THREE.PlaneGeometry(0.08, 0.14), mesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }), N), P = new Float32Array(N * 4), M = new THREE.Matrix4(), col = new THREE.Color(), Q = new THREE.Quaternion(), S = new THREE.Vector3(1, 1, 1), V = new THREE.Vector3(), E = new THREE.Euler();
  mesh.visible = false; g.add(mesh);
  for (let i = 0; i < N; i++) { P[i * 4] = x0 + Math.random() * (x1 - x0); P[i * 4 + 1] = y0 + Math.random() * (y1 - y0); P[i * 4 + 2] = z0 + Math.random() * (z1 - z0); P[i * 4 + 3] = Math.random() * 6; mesh.setColorAt(i, col.setHex(cols[i % cols.length])); }
  let until = 0;
  return { mesh, start: (t, d = 7) => { mesh.visible = true; until = t + d; for (let i = 0; i < N; i++) P[i * 4 + 1] = y0 + Math.random() * (y1 - y0); },
    tick: (t, dt) => { if (!mesh.visible) return; if (t > until) { mesh.visible = false; return; } for (let i = 0; i < N; i++) { P[i * 4 + 1] -= dt * (1.2 + (i % 5) * 0.3); if (P[i * 4 + 1] < 0.1) P[i * 4 + 1] = y0 + Math.random() * 3; V.set(P[i * 4] + Math.sin(t * 2 + P[i * 4 + 3]) * 0.3, P[i * 4 + 1], P[i * 4 + 2]); E.set(t * 2 + i, P[i * 4 + 3], 0); Q.setFromEuler(E); M.compose(V, Q, S); mesh.setMatrixAt(i, M); } mesh.instanceMatrix.needsUpdate = true; } };
}

// =====================================================================================================================
// GAME DAY. The end zone and the last twenty yards. One yard is half a metre here; the goal line is at z = -2 and the
// end zone runs to the rope, where the picture of the field at night takes over. Run the route the quarterback calls.
// =====================================================================================================================
function gameday(c, r, g, X) {
  const { THREE } = c;
  const metal = c.surf('metal', 1.5, 0x9a9ca0), planks = c.surf('planks', 2, 0x8a6a48), dark = std(c, 0x1a1a1a, { roughness: 0.6 }), white = std(c, 0xf0f0f0, { roughness: 0.7 }), orange = std(c, 0xff6a00, { roughness: 0.5 });
  const GL = -2.0, YD = 0.5;   // the goal line and a yard

  // ---- the field paint: one decal for the whole floor, so every line is one draw call ----
  const paint = decal(c, W, 14.75, (q, w, h) => {
    const sx = w / W, sz = h / 14.75, zpx = (z) => (z + 6.75) * sz, xp = (x) => x * sx;   // a canvas column and row for a room x and z
    q.clearRect(0, 0, w, h);
    q.fillStyle = 'rgba(8,52,30,.62)'; q.fillRect(0, 0, w, zpx(GL));                       // the end zone, darker
    q.strokeStyle = '#ffffff'; q.lineCap = 'butt';
    q.lineWidth = 12; for (const x of [0.6, 19.4]) { q.beginPath(); q.moveTo(xp(x), 0); q.lineTo(xp(x), h); q.stroke(); }   // sidelines
    q.beginPath(); q.moveTo(xp(0.6), zpx(-6.6)); q.lineTo(xp(19.4), zpx(-6.6)); q.stroke();                           // the back line
    q.lineWidth = 16; q.beginPath(); q.moveTo(xp(0.6), zpx(GL)); q.lineTo(xp(19.4), zpx(GL)); q.stroke();              // the goal line
    q.lineWidth = 10; for (const yd of [5, 10, 15]) { const z = GL + yd * YD; q.beginPath(); q.moveTo(xp(0.6), zpx(z)); q.lineTo(xp(19.4), zpx(z)); q.stroke(); }
    q.lineWidth = 8; for (let yd = 1; yd < 20; yd++) { const z = GL + yd * YD; for (const x of [7.6, 12.4]) { q.beginPath(); q.moveTo(xp(x - 0.3), zpx(z)); q.lineTo(xp(x + 0.3), zpx(z)); q.stroke(); } }   // hashes
    q.fillStyle = '#ffffff'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.font = `900 150px ${c.FONT}`;
    for (const x of [2.6, 17.4]) { q.fillText('10', xp(x), zpx(GL + 10 * YD) - 100); q.fillText('5', xp(x), zpx(GL + 5 * YD) - 100); q.fillText('G', xp(x), zpx(GL) + 120); }
    q.font = `900 380px ${c.SERIF}`; q.fillText('N3W YORK', w / 2, zpx(-4.3));                                                 // the end zone letters
    q.font = `800 56px ${c.MONO}`; q.fillStyle = 'rgba(255,255,255,.85)'; q.fillText('THE DREAM SINCE AGE ELEVEN', w / 2, zpx(-6.2));
  }, c.MOBILE ? 900 : 1510);
  paint.rotation.x = -PI / 2; paint.position.set(W / 2, 0.015, (-6.75 + 8) / 2); g.add(paint);
  // pylons at the four corners of the end zone
  for (const [x, z] of [[0.6, GL], [19.4, GL], [0.6, -6.6], [19.4, -6.6]]) g.add(c.slab(0.1, 0.45, 0.1, orange, x, 0.225, z));
  // the uprights at the back, behind the rope, in front of the picture
  const yellow = std(c, 0xf5d020, { roughness: 0.4 }), UX = 10, UZ = -7.4;
  for (const dx of [-1.4, 1.4]) g.add(c.slab(0.1, 4.0, 0.1, yellow, UX + dx, 4.8, UZ)); g.add(c.slab(2.9, 0.1, 0.1, yellow, UX, 2.8, UZ)); g.add(c.slab(0.12, 2.8, 0.12, yellow, UX, 1.4, UZ + 0.5)); g.add(c.slab(0.12, 0.12, 0.6, yellow, UX, 2.8, UZ + 0.25));

  // ---- the floodlight towers, three corners, the fourth is where the house tripod stands ----
  for (const [x, z] of [[0.9, -7.2], [19.1, -7.2], [0.9, 7.2]]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 9.2, 12), metal); pole.position.set(x, 4.6, z); g.add(pole);
    g.add(c.slab(1.6, 0.12, 0.12, metal, x, 8.9, z)); g.add(c.slab(1.6, 0.12, 0.12, metal, x, 9.4, z));
    for (let k = 0; k < 4; k++) for (const yy of [8.65, 9.15]) { const lamp = c.slab(0.3, 0.22, 0.16, basic(c, 0xfff6e0), x - 0.6 + k * 0.4, yy, z + (z < 0 ? 0.12 : -0.12)); lamp.rotation.x = z < 0 ? 0.5 : -0.5; g.add(lamp); }
    const l = new THREE.PointLight(0xfff0d8, 14, 22, 1.4); l.position.set(x, 8.6, z + (z < 0 ? 1.2 : -1.2)); g.add(l);
    c.post(X(x), z, 0.3);
  }

  // ---- the west: a low stand of bleachers with a crowd of flower heads in green and white ----
  const tiers = [[2.0, 0.42], [1.4, 0.82], [0.8, 1.22]];
  tiers.forEach(([x, y]) => { g.add(c.slab(0.6, 0.08, 7.6, metal, x, y, -2.4)); g.add(c.slab(0.6, 0.08, 7.6, metal, x + 0.02, y - 0.4, -2.4)); g.add(c.slab(0.04, y, 0.04, dark, x + 0.3, y / 2, -6.2)); g.add(c.slab(0.04, y, 0.04, dark, x + 0.3, y / 2, 1.4)); });
  g.add(c.slab(0.05, 1.0, 7.6, dark, 2.32, 0.5, -2.4)); g.add(c.slab(2.0, 0.05, 0.05, dark, 1.4, 1.75, -6.2)); g.add(c.slab(2.0, 0.05, 0.05, dark, 1.4, 1.75, 1.4));
  c.wall(X(2.4), -6.4, X(2.4), 1.6); c.wall(X(0), -6.4, X(2.4), -6.4); c.wall(X(0), 1.6, X(2.4), 1.6);
  const NF = 45, bodyG = new THREE.CylinderGeometry(0.2, 0.24, 0.7, 10), headG = new THREE.PlaneGeometry(0.6, 0.6);
  const bodies = new THREE.InstancedMesh(bodyG, std(c, 0xffffff, { roughness: 0.9 }), NF), heads = new THREE.InstancedMesh(headG, new THREE.MeshStandardMaterial({ map: headTex(c), transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, roughness: 0.6 }), NF);
  g.add(bodies); g.add(heads);
  const fans = [], M = new THREE.Matrix4(), col = new THREE.Color(), Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, PI / 2, 0)), S = new THREE.Vector3(1, 1, 1), V = new THREE.Vector3();
  for (let i = 0; i < NF; i++) { const tier = i % 3, k = Math.floor(i / 3); const [tx, ty] = tiers[tier]; fans.push([tx - 0.02, ty, -5.8 + k * 0.5 + (tier % 2) * 0.2, Math.random() * 6]); bodies.setColorAt(i, col.setHex(i % 2 ? JETS : 0xf0f0f0)); }
  let cheer = 0;
  const placeFans = (t) => { for (let i = 0; i < NF; i++) { const [x, y, z, ph] = fans[i], up = cheer > 0 ? Math.abs(Math.sin(t * 7 + ph)) * 0.35 : Math.sin(t * 1.3 + ph) * 0.02; V.set(x, y + 0.4 + up, z); M.compose(V, Q, S); bodies.setMatrixAt(i, M); V.set(x + 0.06, y + 1.02 + up, z); M.compose(V, Q, S); heads.setMatrixAt(i, M); } bodies.instanceMatrix.needsUpdate = true; heads.instanceMatrix.needsUpdate = true; };
  placeFans(0);
  const stand = c.sign('THE WEST STAND', { w: 1.6, h: 0.22, bg: '#0d0d0d', fg: '#f5c542', font: c.MONO, weight: 700 }); stand.position.set(0.16, 2.4, -2.4); stand.rotation.y = PI / 2; g.add(stand);
  // the tackling sled and a ball bag by the stand
  const sled = new THREE.Group(); sled.position.set(3.4, 0, -5.4); sled.rotation.y = 0.3; g.add(sled);
  sled.add(c.slab(1.6, 0.08, 0.6, metal, 0, 0.1, 0)); for (const dx of [-0.5, 0.5]) { sled.add(c.slab(0.08, 1.0, 0.08, metal, dx, 0.6, 0.2)); sled.add(c.slab(0.5, 0.7, 0.3, std(c, 0x7a1a1a, { roughness: 0.9 }), dx, 0.85, -0.05)); }
  c.post(X(3.4), -5.4, 0.9);
  const bag = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.5, 14), std(c, 0x2a2a2a, { roughness: 0.9 })); bag.position.set(3.2, 0.25, -3.6); g.add(bag); c.post(X(3.2), -3.6, 0.4);

  // ---- the east: the sideline bench, a cooler, towels, the chain gang, the camera cart ----
  g.add(c.slab(0.5, 0.08, 2.8, planks, 19.1, 0.5, -4.4)); for (const dz of [-1.2, 1.2]) g.add(c.slab(0.4, 0.46, 0.08, metal, 19.1, 0.23, -4.4 + dz)); g.add(c.slab(0.12, 0.5, 2.8, planks, 19.3, 0.85, -4.4));
  c.wall(X(18.8), -5.9, X(18.8), -2.9); c.wall(X(18.8), -5.9, X(20), -5.9); c.wall(X(18.8), -2.9, X(20), -2.9);
  for (const [z, ry] of [[-5.4, 0.2], [-4.6, -0.3], [-3.6, 0.1]]) { const tw = c.slab(0.36, 0.06, 0.3, white, 19.1, 0.57, z); tw.rotation.y = ry; g.add(tw); }
  const cooler = c.slab(0.6, 0.7, 0.5, orange, 19.1, 0.35, -2.2); g.add(cooler); g.add(c.slab(0.62, 0.08, 0.52, white, 19.1, 0.74, -2.2)); g.add(c.slab(0.08, 0.1, 0.08, white, 19.1, 0.83, -2.2)); c.post(X(19.1), -2.2, 0.4);
  const cups = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.12, 10), white); cups.position.set(19.1, 0.84, -1.6); g.add(cups); g.add(c.slab(0.5, 0.78, 0.4, metal, 19.1, 0.39, -1.6)); c.post(X(19.1), -1.6, 0.35);
  extra(c, g, 19.1, -5.0, { seated: true, col: JETS, ry: -PI / 2 }); extra(c, g, 19.1, -3.9, { seated: true, col: 0xf0f0f0, ry: -PI / 2 });
  // the chain gang: two orange poles ten yards apart and the down box
  for (const z of [1.0, -4.0]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.0, 8), orange); p.position.set(17.4, 1.0, z); g.add(p); g.add(c.slab(0.3, 0.3, 0.06, dark, 17.4, 2.1, z)); c.post(X(17.4), z, 0.12); }
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 5.0, 6), dark); chain.position.set(17.4, 0.55, -1.5); chain.rotation.x = PI / 2; g.add(chain);
  const down = c.sign('1', { w: 0.34, h: 0.34, bg: '#111', fg: '#ff6a00', font: c.MONO, weight: 900, px: 96 }); down.position.set(17.4, 2.1, 1.04); g.add(down);
  // the camera cart: a deck on four wheels, a mast, the camera, the operator
  const cart = new THREE.Group(); cart.position.set(17.6, 0, -0.6); cart.rotation.y = 0.6; g.add(cart);
  cart.add(c.slab(1.2, 0.08, 0.8, metal, 0, 0.5, 0)); for (const [dx, dz] of [[-0.45, -0.3], [0.45, -0.3], [-0.45, 0.3], [0.45, 0.3]]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 14), dark); wh.position.set(dx, 0.16, dz); wh.rotation.z = PI / 2; cart.add(wh); }
  cart.add(c.slab(0.06, 1.1, 0.06, metal, 0, 1.05, -0.1)); cart.add(c.slab(0.36, 0.04, 0.26, dark, 0, 1.6, -0.1)); cart.add(c.slab(0.04, 0.5, 0.04, metal, 0.5, 0.75, 0.3));
  c.glb('ph_vintage_video_camera', { h: 0.5, x: 0, y: 1.62, z: -0.1, ry: PI, parent: cart, shadow: false });
  extra(c, g, 18.2, -1.4, { col: 0x1a1a22, ry: 2.6 }); c.post(X(17.6), -0.6, 0.8); c.post(X(18.2), -1.4, 0.3);

  // ---- the scoreboard on the south wall: HOME 5, VISITORS 5, a clock, and the problem it has had since 1969 ----
  const BW = 1024, BH = 400, bt = c.canvasTex(BW, BH, () => {}), bq = bt.userData.canvas.getContext('2d');
  const score = { home: 5, vis: 5 }; let clock = 11 * 60 + 11, playClock = -1, glitchUntil = -1;
  const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const drawBoard = () => {
    bq.fillStyle = '#071a10'; bq.fillRect(0, 0, BW, BH); bq.strokeStyle = '#1f6b4a'; bq.lineWidth = 6; bq.strokeRect(10, 10, BW - 20, BH - 20);
    bq.textAlign = 'center'; bq.textBaseline = 'middle'; bq.fillStyle = '#f4ead2'; bq.font = `800 40px ${c.MONO}`; bq.fillText('HOME', 200, 70); bq.fillText('VISITORS', 824, 70);
    bq.fillStyle = '#f5c542'; bq.font = `900 170px ${c.MONO}`; bq.fillText(String(score.home), 200, 200); bq.fillText(String(score.vis), 824, 200);
    bq.fillStyle = '#ff4fa3'; bq.font = `900 92px ${c.MONO}`; bq.fillText(playClock >= 0 ? String(Math.ceil(playClock)) : mmss(clock), 512, 180);
    bq.fillStyle = '#22d3ee'; bq.font = `700 30px ${c.MONO}`; bq.fillText(playClock >= 0 ? 'PLAY CLOCK' : 'QTR 4', 512, 90); bq.fillStyle = '#f4ead2'; bq.font = `700 30px ${c.MONO}`; bq.fillText('1ST AND 20 · BALL ON THE 20', 512, 330);
    bt.needsUpdate = true;
  };
  const drawGlitch = () => {
    bq.fillStyle = '#071a10'; bq.fillRect(0, 0, BW, BH); bq.textAlign = 'center'; bq.textBaseline = 'middle';
    bq.fillStyle = '#f4ead2'; bq.font = `900 230px ${c.MONO}`; bq.fillText('JETS  0', 512 + (Math.random() - 0.5) * 16, 190);
    bq.fillStyle = '#ff4fa3'; bq.globalAlpha = 0.5; bq.fillText('JETS  0', 512 + (Math.random() - 0.5) * 30, 190 + (Math.random() - 0.5) * 8); bq.globalAlpha = 1;
    for (let k = 0; k < 7; k++) { const y = Math.random() * BH, h = 6 + Math.random() * 30, dx = (Math.random() - 0.5) * 120; bq.drawImage(bt.userData.canvas, 0, y, BW, h, dx, y, BW, h); }
    bq.fillStyle = 'rgba(0,0,0,.42)'; for (let y = 0; y < BH; y += 3) bq.fillRect(0, y, BW, 1);
    bq.fillStyle = 'rgba(255,255,255,.08)'; for (let k = 0; k < 40; k++) bq.fillRect(Math.random() * BW, Math.random() * BH, Math.random() * 60, 2);
    bq.fillStyle = '#22d3ee'; bq.font = `700 26px ${c.MONO}`; bq.fillText('SUPER BOWL III · JANUARY 12 1969 · 16 TO 7', 512, 356); bt.needsUpdate = true;
  };
  drawBoard();
  const board = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 2.8), new THREE.MeshBasicMaterial({ map: bt, toneMapped: false })); board.position.set(10, 7.0, D / 2 - 0.16); board.rotation.y = PI; g.add(board);
  g.add(c.slab(7.6, 3.2, 0.14, dark, 10, 7.0, D / 2 - 0.08)); for (const dx of [-2.35, 2.65]) { g.add(c.slab(0.14, 5.4, 0.14, metal, 10 + dx, 2.7, D / 2 - 0.12)); c.post(X(10 + dx), D / 2 - 0.12, 0.16); }
  c.clickable(board, () => c.egg('gameday_1969', 'Super Bowl III, January 12 1969, sixteen to seven over Baltimore. The last one. The board has been waiting for a redraw longer than he has been alive.'), 'The scoreboard');

  // ---- the locker nook: a shed against the south wall with the knitted five and a helmet ----
  const nk = nook(c, r, g, X, { x: 3.7, w: 3.0, d: 2.1, h: 2.9, mat: c.surf('concrete', 2, 0x7a7a78), roofMat: metal });
  for (const dx of [-0.95, 0.95]) { g.add(c.slab(0.5, 2.2, 0.45, metal, nk.x + dx, 1.1, D / 2 - 0.3)); const vent = decal(c, 0.4, 0.5, (q, w, h) => { q.fillStyle = 'rgba(0,0,0,.6)'; for (let k = 0; k < 7; k++) q.fillRect(w * 0.1, h * 0.1 + k * h * 0.12, w * 0.8, h * 0.04); }, 128); vent.position.set(nk.x + dx, 1.8, D / 2 - 0.52); vent.rotation.y = PI; g.add(vent); }
  const jersey = c.sign('5', { w: 0.9, h: 1.1, bg: GREEN, fg: '#ffffff', font: c.SERIF, weight: 900, px: 256, pad: 0.2, border: '#ffffff' }); jersey.position.set(nk.x, 1.7, D / 2 - 0.14); jersey.rotation.y = PI; g.add(jersey);
  const hanger = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 6), metal); hanger.position.set(nk.x, 2.32, D / 2 - 0.2); hanger.rotation.z = PI / 2; g.add(hanger);
  c.clickable(jersey, () => c.egg('gameday_five', 'Number five. The first jersey he had in America had a five on it, knitted by his mother. He has never changed the number, only the stadium he wants to wear it in.'), 'The knitted five');
  g.add(c.slab(1.4, 0.06, 0.5, planks, nk.x + 0.75, 0.46, D / 2 - 1.5)); for (const dx of [0.1, 1.4]) g.add(c.slab(0.06, 0.44, 0.4, metal, nk.x + dx, 0.22, D / 2 - 1.5)); c.wall(X(nk.x + 0.05), D / 2 - 1.76, X(nk.x + 1.45), D / 2 - 1.76); c.wall(X(nk.x + 0.05), D / 2 - 1.76, X(nk.x + 0.05), D / 2 - 1.24);
  const helmet = new THREE.Group(); helmet.position.set(nk.x + 1.1, 0.49, D / 2 - 1.5); g.add(helmet);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 14, 0, PI * 2, 0, PI * 0.62), std(c, JETS, { roughness: 0.3, metalness: 0.2 })); shell.position.y = 0.17; helmet.add(shell);
  for (const [y, rad] of [[0.12, 0.16], [0.07, 0.15]]) { const bar = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.012, 6, 20, PI), std(c, 0xe8e8e8, { metalness: 0.6, roughness: 0.3 })); bar.position.set(0, y, 0.04); bar.rotation.x = PI / 2; bar.rotation.z = PI / 2; helmet.add(bar); }
  for (const dx of [-0.7, -0.45]) { const cleat = c.slab(0.12, 0.08, 0.3, dark, nk.x + dx, 0.04, D / 2 - 0.9); cleat.rotation.y = 0.2; g.add(cleat); }
  const towel2 = c.slab(0.4, 0.05, 0.3, white, nk.x + 0.4, 0.52, D / 2 - 1.5); g.add(towel2);
  const ls = c.sign('THE LOCKER · NUMBER 5 · KNITTED, NOT ISSUED', { w: 2.8, h: 0.22, bg: '#0d0d0d', fg: '#f5c542', font: c.MONO, weight: 700 }); ls.position.set(nk.x, nk.h + 0.3, nk.z0 - 0.02); g.add(ls);
  plaque(c, g, nk.x + nk.w / 2 + 0.07, 1.5, nk.zc, PI / 2, 'I want to be the operator.', 'FRONT OFFICE SPORTS, FEBRUARY 2026', 1.8);
  const tl = c.sign('THE DREAM SINCE AGE ELEVEN\n2021: TWENTY TWO TO TWENTY THREE YEARS\nTHE CLOCK IS RUNNING', { w: 1.9, h: 0.6, bg: GREEN, fg: '#ffffff', font: c.MONO, weight: 800, px: 192 }); tl.position.set(nk.x + nk.w / 2 + 0.07, 2.3, nk.zc); tl.rotation.y = PI / 2; g.add(tl);

  // ---- RUN THE ROUTE ----
  // the quarterback at the twenty, the four marks of the route, the dotted line between them, the ball, the catch
  const QX = 15.0, QZ = 6.9, marks = [[13.6, 3.0], [16.2, 0.6], [14.0, -1.6], [10.0, -4.6]];
  const ringT = c.canvasTex(256, 256, (q, w, h) => { q.strokeStyle = '#ffffff'; q.lineWidth = 18; q.beginPath(); q.arc(w / 2, h / 2, w * 0.42, 0, 7); q.stroke(); });
  const rings = marks.map(([x, z], k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), new THREE.MeshBasicMaterial({ map: ringT, transparent: true, toneMapped: false, depthWrite: false, color: GOLD })); m.rotation.x = -PI / 2; m.position.set(x, 0.03, z); m.visible = false; g.add(m);
    const n = c.sign(String(k + 1), { w: 0.5, h: 0.5, bg: null, fg: '#f5c542', font: c.MONO, weight: 900, px: 96 }); n.rotation.x = -PI / 2; n.position.set(x, 0.035, z); n.visible = false; g.add(n); return { m, n, x, z }; });
  const ND = 140, dotG = new THREE.CircleGeometry(0.09, 10), dots = new THREE.InstancedMesh(dotG, new THREE.MeshBasicMaterial({ color: GOLD, toneMapped: false, transparent: true, opacity: 0.9, depthWrite: false }), ND); dots.visible = false; g.add(dots);
  const layRoute = () => { let i = 0; const pts = [[QX, QZ], ...marks], Qd = new THREE.Quaternion().setFromEuler(new THREE.Euler(-PI / 2, 0, 0)); for (let s = 0; s < pts.length - 1 && i < ND; s++) { const [ax, az] = pts[s], [bx, bz] = pts[s + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(2, Math.round(L / 0.5)); for (let k = 1; k < n && i < ND; k++) { V.set(ax + (bx - ax) * k / n, 0.025, az + (bz - az) * k / n); M.compose(V, Qd, S); dots.setMatrixAt(i++, M); } } dots.count = i; dots.instanceMatrix.needsUpdate = true; dots.visible = true; };
  const ballG = new THREE.SphereGeometry(0.14, 14, 10); ballG.scale(1, 0.7, 0.7);
  const play = { state: 'idle', idx: 0, t0: 0, ball: null, tds: 0 };
  const cf = confetti(c, g, { n: 420, cols: [JETS, 0xf0f0f0, GOLD, 0x7fff9a], z0: -7, z1: 2 });
  const resetPlay = () => { play.state = 'idle'; playClock = -1; dots.visible = false; rings.forEach((rg) => { rg.m.visible = false; rg.n.visible = false; rg.m.material.color.setHex(GOLD); }); drawBoard(); };
  let qb;
  const callPlay = () => {
    if (play.state !== 'idle') return; play.state = 'run'; play.idx = 0; play.t0 = c.TIME.t; playClock = 12;
    c.say(qb, 'Five, five. Set. Hut. Go, go, go.', 3200, 2.1); c.sound.horn(0.15);
    c.toast('RUN THE ROUTE. Four marks in order, twelve seconds. Catch it in the end zone.', 4600);
    layRoute(); rings.forEach((rg) => { rg.m.visible = true; rg.n.visible = true; }); drawBoard();
  };
  qb = cast(c, r, g, X, 'famer', QX, QZ, { h: 1.85, ry: -2.3, r: 0.45, fn: callPlay, hint: 'The quarterback. Click to run the route.' });
  cast(c, r, g, X, 'boxer', 4.8, 6.6, { h: 1.9, ry: 0.9, line: 'Two hundred and sixty pounds of patience. Nobody gets to him. That is the whole job.', hint: 'The left tackle' });
  const throwBall = () => {
    const P = c.P, tx = P.x - r.x0, tz = P.z, T = 1.35, b = new THREE.Mesh(ballG, std(c, 0x7a4a2a, { roughness: 0.6 })); b.position.set(QX, 1.75, QZ); g.add(b);
    play.ball = { b, land: [tx, tz], v: new THREE.Vector3((tx - QX) / T, (0.9 - 1.75 + 0.5 * 9.8 * T * T) / T, (tz - QZ) / T), t: 0, T };
    play.state = 'throw'; c.sound.whoosh(0.15, 0.6); c.toast('Ball is in the air. Hold your spot.', 1400);
  };
  const touchdown = (t) => {
    play.tds++; score.vis += 6; cheer = 4.5; cf.start(t, 7); c.flash(0.5); c.sound.applause(4.5); c.sound.roar(0.4); c.sound.horn(0.3); drawBoard();
    c.egg('gameday_touchdown', 'Touchdown, visitors. Caught in the end zone of a stadium he does not own yet. Run it again, the board is about to do its thing.');
    if (play.tds === 3) c.egg('gameday_three', 'Three touchdowns. Hat trick, wrong sport. The board still says 1969, and it will until somebody with a five on his back changes it.');
    setTimeout(() => { glitchUntil = c.TIME.t + 3.4; c.sound.crack(); c.toast('The scoreboard has been like this since 1969.', 3400); }, 1800);
  };
  let frame = 0;
  c.tick((t, dt, P, ri) => {
    if (ri !== r.i) return; frame++;
    if (cheer > 0) cheer -= dt; if (frame % 2 === 0) placeFans(t); cf.tick(t, dt);
    if (frame % 30 === 0 && play.state === 'idle' && glitchUntil < t) { clock = clock > 0 ? clock - 1 : 11 * 60 + 11; drawBoard(); }
    if (glitchUntil > t) { if (frame % 3 === 0) drawGlitch(); } else if (glitchUntil > 0 && glitchUntil > t - dt) { glitchUntil = -1; drawBoard(); }
    if (play.state === 'run') {
      playClock = Math.max(0, 12 - (t - play.t0)); if (frame % 6 === 0) drawBoard();
      const mk = marks[play.idx], d = Math.hypot(P.x - r.x0 - mk[0], P.z - mk[1]);
      rings[play.idx].m.scale.setScalar(1 + Math.sin(t * 6) * 0.08);
      if (d < 0.9) { rings[play.idx].m.material.color.setHex(0x7fff9a); rings[play.idx].m.scale.setScalar(1); c.sound.click(); play.idx++; if (play.idx === marks.length) throwBall(); else c.toast(`Mark ${play.idx} of 4.`, 900); }
      else if (playClock <= 0) { c.toast('Play clock. Dead ball. Click the quarterback and run it again.', 3200); c.sound.thud(0.3); resetPlay(); }
    }
    if (play.state === 'throw' && play.ball) {
      const o = play.ball; o.t += dt; o.v.y -= 9.8 * dt; o.b.position.addScaledVector(o.v, dt); o.b.rotation.x += dt * 12;
      if (o.t >= o.T || o.b.position.y < 0.2) {
        const near = Math.hypot(P.x - r.x0 - o.land[0], P.z - o.land[1]) < 1.2, inEZ = P.z < GL;
        if (near && inEZ) touchdown(t); else c.toast(near ? 'Caught short of the line. Finish in the end zone.' : ['Dropped. Stay on your mark next time.', 'Overthrown. Where did you go?', 'Incomplete. The route is the route.'][(Math.random() * 3) | 0], 3000);
        const bm = o.b; setTimeout(() => g.remove(bm), 1500); play.ball = null; resetPlay();
      }
    }
  });
  // the walk in
  const gate = c.sign('GAME DAY · THE LAST TWENTY YARDS · CLICK THE QUARTERBACK', { w: 5.2, h: 0.3, bg: null, fg: '#f5c542', font: c.MONO, weight: 700, glow: 8 }); gate.position.set(10, 5.2, -7.86); g.add(gate);
  const sl = c.sign('5', { w: 0.6, h: 0.6, bg: '#ffffff', fg: GREEN, font: c.SERIF, weight: 900, px: 128, border: GREEN }); sl.rotation.x = -PI / 2; sl.position.set(QX, 0.03, QZ - 0.9); g.add(sl);
}

// =====================================================================================================================
// THE FEED. A nave of screens between two dark aisles. Every screen is a nine by sixteen post drawn by code; three of
// them are live cameras in this room, and the biggest thumb you have ever seen keeps scrolling the lot until you stop.
// =====================================================================================================================
const HOOKS = ['POV: you walked into a museum about yourself', 'nobody is coming to save your content', 'day one or one day', 'post it ugly. fix it in the comments.', 'you are one video from the whole thing changing', 'your drafts folder is where ideas go to die', 'stop making content for your friends', 'the algorithm is a mirror. smile.', 'sixty four pieces. one day. go.', 'patience is not waiting. it is posting.', 'if it is not on the feed it did not happen', 'two cents a comment. ninety comments. go.', 'read the comments. that is the market talking.', 'nobody owes you a scroll stop', 'the clip you are scared of is the clip', 'attention first. everything else second.'];
const HANDLES = ['bodega_cat_5', 'sixtrainsally', 'queens_forever', 'n3w_in_town', 'hotdog_dan', 'patient_panda_fan', 'two_cents_tina', 'day_one_dev', 'the_counted', 'jets_since_78', 'macro_mike', 'micro_mo', 'uptown_uma', 'rooftop_ray'];
const COMMENTS = ['this is the one', 'ok but the bodega part', 'day one', 'he said it again', 'saving this', 'who is here from the census', 'W', 'the thumb stopped', 'sending this to my mom', 'two cents', 'first', 'we are so back', 'the feed knows', 'clouds and dirt', 'posting mine tonight', 'macro patience', 'micro speed', 'run it back', 'this is a museum???', 'counted'];
const fmtN = (n) => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(n | 0);
// one post, drawn into a tile of the atlas: a phone screen with a flower headed New Yorker, a hook and the rail
function drawPost(c, q, x0, y0, tw, th, k) {
  const hue = (k * 47) % 360;
  q.save(); q.translate(x0, y0); q.fillStyle = '#000'; q.fillRect(0, 0, tw, th);
  q.beginPath(); if (q.roundRect) q.roundRect(8, 8, tw - 16, th - 16, 22); else q.rect(8, 8, tw - 16, th - 16); q.clip();
  const gr = q.createLinearGradient(0, 0, 0, th); gr.addColorStop(0, `hsl(${hue},45%,22%)`); gr.addColorStop(1, `hsl(${(hue + 40) % 360},55%,8%)`); q.fillStyle = gr; q.fillRect(0, 0, tw, th);
  q.fillStyle = `hsla(${(hue + 180) % 360},70%,60%,.25)`; q.beginPath(); q.arc(tw * 0.5, th * 0.42, tw * 0.5, 0, 7); q.fill();
  q.fillStyle = ['#1b1d26', '#5a2fa0', '#125740', '#7a1a1a', '#1a2a4a'][k % 5]; q.fillRect(tw * 0.34, th * 0.42, tw * 0.32, th * 0.36);
  eyeFlower(q, tw * 0.5, th * 0.36, tw * 0.17);
  q.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 4; i++) { q.beginPath(); q.arc(tw - 34, th * 0.42 + i * 64, 16, 0, 7); q.fill(); }
  q.font = `700 15px ${c.MONO}`; q.textAlign = 'center'; q.fillStyle = '#fff'; [fmtN(2000 + k * 17311), fmtN(100 + k * 913), fmtN(40 + k * 211), 'share'].forEach((s, i) => q.fillText(s, tw - 34, th * 0.42 + i * 64 + 34));
  q.textAlign = 'left'; q.font = `900 26px ${c.FONT}`; q.lineWidth = 6; q.strokeStyle = '#000'; q.lineJoin = 'round'; q.fillStyle = '#fff';
  const hook = HOOKS[k % HOOKS.length]; let y = th * 0.8; const words = hook.split(' '); let line = ''; const lines = []; for (const w of words) { const t2 = line ? line + ' ' + w : w; if (q.measureText(t2).width > tw - 70 && line) { lines.push(line); line = w; } else line = t2; } lines.push(line);
  lines.forEach((l, i) => { q.strokeText(l, 18, y + i * 30); q.fillText(l, 18, y + i * 30); });
  q.font = `700 14px ${c.MONO}`; q.fillStyle = '#ddd'; q.fillText('@' + HANDLES[k % HANDLES.length], 18, th * 0.8 - 22);
  if (k % 4 === 1) { q.fillStyle = '#ff2a55'; q.fillRect(18, 22, 54, 24); q.fillStyle = '#fff'; q.font = `800 14px ${c.MONO}`; q.fillText('LIVE', 27, 39); }
  q.fillStyle = 'rgba(255,255,255,.25)'; q.fillRect(0, th - 12, tw, 4); q.fillStyle = '#fff'; q.fillRect(0, th - 12, tw * ((k * 0.37) % 1), 4);
  q.restore();
}
// hundreds of screens as one mesh: each plane gets the UVs of one tile of the atlas, so one offset scrolls them all
function screenGrid(c, list, atlas, cols, rows) {
  const { THREE } = c, n = list.length, pos = new Float32Array(n * 12), uv = new Float32Array(n * 8), idx = new Uint16Array(n * 6);
  const Mx = new THREE.Matrix4(), v = new THREE.Vector3(), rt = new THREE.Vector3(), up = new THREE.Vector3(), nm = new THREE.Vector3(), corners = [[-0.225, 0.4], [0.225, 0.4], [-0.225, -0.4], [0.225, -0.4]];
  list.forEach((p, i) => {
    nm.fromArray(p.n).normalize(); up.fromArray(p.u).normalize(); rt.crossVectors(up, nm).normalize(); Mx.makeBasis(rt, up, nm); Mx.setPosition(p.x, p.y, p.z);
    corners.forEach(([cx, cy], k) => { v.set(cx, cy, 0).applyMatrix4(Mx); pos[i * 12 + k * 3] = v.x; pos[i * 12 + k * 3 + 1] = v.y; pos[i * 12 + k * 3 + 2] = v.z; });
    const col = (p.col ?? (i * 7)) % cols, row = (p.row ?? (i * 3)) % rows, u0 = col / cols, v0 = row / rows, du = 1 / cols, dv = 1 / rows;
    uv.set([u0, v0 + dv, u0 + du, v0 + dv, u0, v0, u0 + du, v0], i * 8); idx.set([i * 4, i * 4 + 2, i * 4 + 1, i * 4 + 2, i * 4 + 3, i * 4 + 1], i * 6);
  });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.computeBoundingSphere();
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: atlas, toneMapped: false, fog: false }));
}
function feed(c, r, g, X) {
  const { THREE } = c;
  const dark = std(c, 0x0e0e12, { roughness: 0.5, metalness: 0.3 }), wallM = c.surf('metal', 1.5, 0x2a2a30), deckM = c.surf('rubber', 2, 0x1a1a1e), planks = c.surf('planks', 2, 0x5a4a3a);
  // ---- the nave: two inner walls of screens, a dropped ceiling of screens, two dark aisles beyond ----
  const NX1 = 5, NX2 = 15, NZ0 = -6.4, NZ1 = 1.6, NH = 4.6;
  for (const x of [NX1, NX2]) { g.add(c.slab(0.3, NH, NZ1 - NZ0, wallM, x, NH / 2, (NZ0 + NZ1) / 2)); c.wall(X(x - 0.15), NZ0, X(x - 0.15), NZ1); c.wall(X(x + 0.15), NZ0, X(x + 0.15), NZ1); c.wall(X(x - 0.15), NZ0, X(x + 0.15), NZ0); c.wall(X(x - 0.15), NZ1, X(x + 0.15), NZ1); }
  g.add(c.slab(NX2 - NX1 + 0.3, 0.2, NZ1 - NZ0, wallM, W / 2, NH + 0.1, (NZ0 + NZ1) / 2));
  for (const x of [NX1, NX2]) g.add(c.slab(0.3, H_IN - NH, 0.3, wallM, x, NH + (H_IN - NH) / 2, NZ1));   // the piers up to the real ceiling
  // ---- the atlas of posts and the grid of screens ----
  const COLS = 4, ROWS = 4, TW = 256, TH = 512, atlas = c.canvasTex(COLS * TW, ROWS * TH, (q, w, h) => { q.fillStyle = '#000'; q.fillRect(0, 0, w, h); for (let k = 0; k < COLS * ROWS; k++) drawPost(c, q, (k % COLS) * TW, Math.floor(k / COLS) * TH, TW, TH, k); });
  atlas.wrapS = atlas.wrapT = THREE.RepeatWrapping; atlas.anisotropy = 4;
  const list = [], SX = 0.5, SY = 0.85, rnd = (n) => (Math.random() * n) | 0;
  const wallRun = (x, nx, z0, z1, y0, y1) => { for (let z = z0 + SX / 2; z < z1; z += SX) for (let y = y0; y < y1; y += SY) list.push({ x, y, z, n: [nx, 0, 0], u: [0, 1, 0], col: rnd(COLS), row: rnd(ROWS) }); };
  wallRun(NX1 + 0.17, 1, NZ0, NZ1, 0.55, NH - 0.3); wallRun(NX2 - 0.17, -1, NZ0, NZ1, 0.55, NH - 0.3);        // the nave faces
  wallRun(NX1 - 0.17, -1, NZ0, NZ1, 0.55, NH - 0.3); wallRun(NX2 + 0.17, 1, NZ0, NZ1, 0.55, NH - 0.3);        // the aisle faces
  wallRun(W - 0.14, -1, -7.6, 1.6, 3.3, H_IN - 0.4);                                                              // above the pictures in the east aisle
  for (let x = NX1 + 0.4; x < NX2 - 0.2; x += SX) for (let z = NZ0 + 0.5; z < NZ1 - 0.3; z += SY) list.push({ x, y: NH - 0.02, z, n: [0, -1, 0], u: [0, 0, 1], col: rnd(COLS), row: rnd(ROWS) });   // the nave ceiling, tops south: that is up when you face north and look up
  for (let x = 0.4; x < W - 0.2; x += SX) for (let z = NZ1 + 0.6; z < D / 2 - 0.3; z += SY) list.push({ x, y: H_IN - 0.02, z, n: [0, -1, 0], u: [0, 0, 1], col: rnd(COLS), row: rnd(ROWS) });   // the lobby ceiling
  for (const [x, nx] of [[NX1 + 0.45, -1], [NX2 - 0.45, 1], [0.45, -1], [W - 0.45, 1]]) for (let z = NZ0 + 0.5; z < NZ1 - 0.3; z += SY) list.push({ x, y: 0.02, z, n: [0, 1, 0], u: [nx, 0, 0], col: rnd(COLS), row: rnd(ROWS) });   // the floor edges
  for (let x = 0.6; x < 14.2; x += SX) list.push({ x, y: 0.02, z: D / 2 - 0.55, n: [0, 1, 0], u: [0, 0, -1], col: rnd(COLS), row: rnd(ROWS) });   // along the south wall
  const grid = screenGrid(c, list, atlas, COLS, ROWS); g.add(grid);
  // ---- the live cameras: three of them, in this room, into three small targets, one per frame in turn ----
  const RW = c.MOBILE ? 144 : 252, RH = Math.round(RW * 16 / 9), rts = [], cams = [];
  const camAt = (x, y, z, tx, ty, tz) => { const rt = new THREE.WebGLRenderTarget(RW, RH, { depthBuffer: true }); rt.texture.colorSpace = THREE.SRGBColorSpace; const cam = new THREE.PerspectiveCamera(58, 9 / 16, 0.1, 40); cam.position.set(x, y, z); g.add(cam); cam.lookAt(X(tx), ty, tz); cam.layers.enable(1); rts.push(rt); cams.push(cam); const body = c.slab(0.14, 0.14, 0.22, dark, x, y, z); body.lookAt(X(tx), ty, tz); g.add(body); const red = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), basic(c, 0xff2020)); red.position.set(x, y + 0.1, z); g.add(red); return red; };
  const recs = [camAt(NX1 + 0.3, 2.6, -4.2, 10.5, 1.2, 0.8), camAt(NX2 - 0.3, 2.6, 0.8, 9.5, 1.2, -3.6), camAt(10, 4.3, -6.0, 10, 1.4, 3.5)];
  // the biggest screens: two angled panels flanking the thumb, and one on the south wall you only see when you turn round
  const live = new THREE.Group(); g.add(live);
  const SCR = [{ x: 7.3, z: -5.7, ry: 0.42, rt: 1, hook: 'POV: you walked into a museum about yourself' }, { x: 12.7, z: -5.7, ry: -0.42, rt: 0, hook: 'nobody is coming to save your content' }, { x: 10, z: D / 2 - 0.16, ry: PI, rt: 2, hook: 'day one or one day', y: 4.2, w: 2.0, h: 3.3, wall: true }];
  const shows = SCR.map((s, i) => {
    const w = s.w || 1.8, h = s.h || 3.2, y = s.y || 2.3, m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: rts[s.rt].texture, toneMapped: false, fog: false })); m.position.set(s.x, y, s.z); m.rotation.y = s.ry; live.add(m);
    const bz = c.slab(w + 0.16, h + 0.16, 0.1, dark, 0, 0, -0.06); bz.position.set(s.x, y, s.z); bz.rotation.y = s.ry; bz.translateZ(-0.06); g.add(bz);
    if (!s.wall) { const st = c.slab(0.12, y - h / 2, 0.12, dark, s.x, (y - h / 2) / 2, s.z); g.add(st); g.add(c.slab(0.8, 0.06, 0.5, dark, s.x, 0.03, s.z)); c.post(X(s.x), s.z, 0.95); }
    const CW = 512, CH = 160, ct = c.canvasTex(CW, CH, () => {}), cq = ct.userData.canvas.getContext('2d');
    const cap = new THREE.Mesh(new THREE.PlaneGeometry(w, w * CH / CW), new THREE.MeshBasicMaterial({ map: ct, transparent: true, toneMapped: false, fog: false, depthWrite: false })); cap.position.set(s.x, y - h / 2 + w * CH / CW / 2 + 0.05, s.z); cap.rotation.y = s.ry; cap.translateZ(0.012); g.add(cap);
    const show = { ...s, m, cap, ct, cq, views: 11400 + i * 7310, held: 0, hot: false, done: false, lastDraw: -1, centre: new THREE.Vector3(s.x, y, s.z) };
    show.draw = () => { cq.clearRect(0, 0, CW, CH); cq.fillStyle = 'rgba(0,0,0,.55)'; cq.fillRect(0, 0, CW, CH); cq.textAlign = 'left'; cq.textBaseline = 'alphabetic'; cq.fillStyle = '#fff'; cq.font = `900 30px ${c.FONT}`; cq.lineWidth = 6; cq.strokeStyle = '#000'; cq.lineJoin = 'round';
      const words = show.hook.split(' '); let line = '', yy = 44; for (const wd of words) { const t2 = line ? line + ' ' + wd : wd; if (cq.measureText(t2).width > CW - 40 && line) { cq.strokeText(line, 20, yy); cq.fillText(line, 20, yy); line = wd; yy += 34; } else line = t2; } cq.strokeText(line, 20, yy); cq.fillText(line, 20, yy);
      cq.font = `800 24px ${c.MONO}`; cq.fillStyle = show.hot ? '#7fff9a' : '#22d3ee'; cq.fillText('VIEWS ' + Math.floor(show.views).toLocaleString('en-US'), 20, CH - 26); cq.fillStyle = '#ff4fa3'; cq.textAlign = 'right'; cq.fillText(show.hot ? 'THE THUMB STOPPED' : 'LIVE · THIS ROOM', CW - 20, CH - 26); ct.needsUpdate = true; };
    show.draw(); return show;
  });
  // ---- the thumb: three metres of it, hanging from the dark above the nave, flicking the feed up ----
  const skin = std(c, 0xd9a683, { roughness: 0.55 }), thumb = new THREE.Group(), TY = 4.35; thumb.position.set(10, TY, -5.0); g.add(thumb);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8), dark); rod.position.set(0, 2.0, 0); thumb.add(rod);
  thumb.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 2.0, 8, 18), skin));
  const nail = c.slab(0.62, 0.92, 0.07, std(c, 0xf0c8b8, { roughness: 0.25 }), 0, -0.95, 0.47); nail.rotation.x = -0.18; thumb.add(nail);
  const lun = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16), std(c, 0xfff0ea, { roughness: 0.3 })); lun.position.set(0, -1.32, 0.515); lun.rotation.x = -0.18; thumb.add(lun);
  const crease = new THREE.Mesh(new THREE.TorusGeometry(0.505, 0.03, 8, 32), std(c, 0xb8835f, { roughness: 0.7 })); crease.rotation.x = PI / 2; crease.position.y = 0.3; thumb.add(crease);
  const tl = new THREE.PointLight(0xffd0c0, 4, 7, 1.6); tl.position.set(0, -1.6, 0.6); thumb.add(tl);
  c.clickable(thumb, () => c.toast('It does not stop for clicks. Stand still and look at a live screen.', 2800), 'The thumb');
  // ---- the comment columns: two dark pillars in the aisles, a screen of scrolling comments on each face ----
  const cols2 = [];
  for (const [x, z] of [[2.5, -4.2], [17.5, -4.2]]) {
    g.add(c.slab(0.5, 3.2, 0.5, dark, x, 1.6, z)); c.post(X(x), z, 0.5);
    for (const [dz, ry] of [[0.27, 0], [-0.27, PI]]) {
      const CW = 360, CH = 640, ct = c.canvasTex(CW, CH, () => {}), cq = ct.userData.canvas.getContext('2d'), m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.6), new THREE.MeshBasicMaterial({ map: ct, toneMapped: false, fog: false })); m.position.set(x, 1.9, z + dz); m.rotation.y = ry; g.add(m);
      const col = { ct, cq, m, rows: [], views: 40000 + Math.random() * 900000, off: 0, seed: cols2.length };
      for (let k = 0; k < 11; k++) col.rows.push([HANDLES[(k * 5 + col.seed) % HANDLES.length], COMMENTS[(k * 3 + col.seed * 7) % COMMENTS.length]]);
      col.draw = () => { cq.fillStyle = '#07070c'; cq.fillRect(0, 0, CW, CH); cq.fillStyle = '#12121a'; cq.fillRect(0, 0, CW, 96); cq.textAlign = 'left'; cq.textBaseline = 'alphabetic'; cq.fillStyle = '#f4ead2'; cq.font = `800 22px ${c.MONO}`; cq.fillText('COMMENTS', 20, 40); cq.fillStyle = '#7fff9a'; cq.font = `800 30px ${c.MONO}`; cq.fillText(Math.floor(col.views).toLocaleString('en-US'), 20, 80); cq.fillStyle = '#22d3ee'; cq.font = `700 16px ${c.MONO}`; cq.textAlign = 'right'; cq.fillText('VIEWS', CW - 20, 80); cq.textAlign = 'left';
        col.rows.forEach(([h, t2], k) => { const y = 130 + k * 56 - col.off; if (y < 100 || y > CH + 20) return; eyeFlower(cq, 36, y - 8, 16); cq.fillStyle = '#9aa'; cq.font = `700 15px ${c.MONO}`; cq.fillText('@' + h, 64, y - 14); cq.fillStyle = '#fff'; cq.font = `600 19px ${c.FONT}`; cq.fillText(t2, 64, y + 10); });
        cq.fillStyle = 'rgba(255,79,163,.9)'; cq.fillRect(0, CH - 6, CW * ((col.views / 1e6) % 1), 6); ct.needsUpdate = true; };
      col.draw(); cols2.push(col);
      c.clickable(m, () => c.egg('feed_twocents', 'The $1.80 strategy: find the nine top posts under ten hashtags, leave your two cents on all ninety. A dollar eighty of opinion a day. The comments are where the room is.'), 'The comments');
    }
  }
  // ---- the wall of principles: the west aisle, seven plaques with their status ----
  const PR = [['I day trade attention and build businesses.', 'VERBATIM · LINE ONE OF HIS BIO'], ['Document, don\'t create.', 'VERBATIM · THE 2016 PIECE'], ['Macro patience, micro speed.', 'VERBATIM · HIS LINE'], ['Sixty four pieces of content in a day.', 'FACT · THE DECK, NOVEMBER 14 2019'], ['Ninety comments at two cents. The $1.80 strategy.', 'FACT · NINE POSTS, TEN HASHTAGS'], ['TikTok, Instagram, YouTube, LinkedIn, X and Facebook.', 'FACT · WHERE HE POSTS'], ['TikTok 15.4 million. Instagram 11.9 million. YouTube 4.9 million.', 'COUNT · LATE 2026, PER CREATORDB']];
  PR.forEach(([t2, st], k) => { const z = -6.0 + (k % 4) * 2.0 - (k > 3 ? 1.0 : 0), y = k < 4 ? 2.5 : 1.3; const p = plaque(c, g, 0.16, y, z, PI / 2, t2, st, 1.7); if (k === 0) c.clickable(p, () => c.egg('feed_bio', 'Line one of the bio. Attention is bought in the morning and sold by the afternoon, and the businesses are what the profit builds. Everything else on this wall is how.'), 'The bio'); });
  const pw = c.sign('THE PRINCIPLES · READ THEM, THEN POST', { w: 2.6, h: 0.22, bg: '#0d0d0d', fg: '#f5c542', font: c.MONO, weight: 700 }); pw.position.set(0.16, 3.6, -3.2); pw.rotation.y = PI / 2; g.add(pw);
  // ---- the editing bay: a booth against the south wall, two monitors on the live targets, and the only rule ----
  const nk = nook(c, r, g, X, { x: 3.4, w: 3.2, d: 2.1, h: 2.7, mat: wallM, roofMat: wallM, light: 0x22d3ee, lightI: 4 });
  g.add(c.slab(2.8, 0.06, 0.8, planks, nk.x, 0.76, D / 2 - 0.55)); for (const dx of [-1.2, 1.2]) g.add(c.slab(0.06, 0.74, 0.7, dark, nk.x + dx, 0.37, D / 2 - 0.55)); c.wall(X(nk.x - 1.4), D / 2 - 0.95, X(nk.x + 1.4), D / 2 - 0.95);
  const mons = [0, 1].map((k) => { const x = nk.x + (k ? 0.75 : -0.75); g.add(c.slab(0.96, 0.6, 0.04, dark, x, 1.15, D / 2 - 0.3)); g.add(c.slab(0.08, 0.3, 0.08, dark, x, 0.9, D / 2 - 0.3)); const m = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.53), new THREE.MeshBasicMaterial({ map: rts[k].texture, toneMapped: false, fog: false })); m.position.set(x, 1.15, D / 2 - 0.325); m.rotation.y = PI; live.add(m); const ui = c.sign(k ? 'CAM B · CUT 00:03' : 'CAM A · CUT 00:03', { w: 0.5, h: 0.08, bg: '#0d0d0d', fg: '#7fff9a', font: c.MONO, weight: 700, px: 40 }); ui.position.set(x, 0.9, D / 2 - 0.325); ui.rotation.y = PI; g.add(ui); return m; });
  g.add(c.slab(0.7, 0.03, 0.22, dark, nk.x, 0.8, D / 2 - 0.85)); const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.1, 12), std(c, 0xf4ead2)); mug.position.set(nk.x + 1.1, 0.84, D / 2 - 0.8); g.add(mug);
  for (let k = 0; k < 3; k++) g.add(c.slab(0.3, 0.05, 0.2, dark, nk.x - 1.1, 0.82 + k * 0.06, D / 2 - 0.5));
  const es = c.sign('EDIT LESS\nPOST MORE', { w: 1.8, h: 0.7, bg: null, fg: '#ff4fa3', font: c.SERIF, weight: 900, glow: 18, px: 192 }); es.position.set(nk.x, 2.1, D / 2 - 0.15); es.rotation.y = PI; g.add(es);
  neon(c, g, nk.x - 0.9, 1.68, D / 2 - 0.18, nk.x + 0.9, 1.68, D / 2 - 0.18, 0xff4fa3);
  c.clickable(es, () => c.egg('feed_editbay', 'Edit less, post more. The cut is three seconds because the thumb gives you three seconds. Everything after that is for the people who already stopped.'), 'The rule');
  const bs = c.sign('THE EDITING BAY', { w: 1.6, h: 0.2, bg: '#0d0d0d', fg: '#f5c542', font: c.MONO, weight: 700 }); bs.position.set(nk.x, nk.h + 0.28, nk.z0 - 0.02); g.add(bs);
  // ---- the people: three in the aisles, lit by their phones ----
  for (const [x, z, ry, col] of [[3.0, 0.4, 2.4, 0x1b1d26], [17.2, 0.9, -2.2, 0x5a2fa0], [1.6, -1.6, 1.2, 0x125740]]) { const o = extra(c, g, x, z, { col, ry }); const ph = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.16), basic(c, 0x9ad8ff)); ph.position.set(0, 1.25, 0.28); ph.rotation.x = -0.6; o.add(ph); const pl = new THREE.PointLight(0x9ad8ff, 1.2, 1.6, 2); pl.position.set(0, 1.3, 0.3); o.add(pl); c.post(X(x), z, 0.3); }
  // ---- floor neon along the nave, and the words at the gate ----
  neon(c, g, NX1 + 0.2, 0.05, NZ0, NX1 + 0.2, 0.05, NZ1, 0x22d3ee); neon(c, g, NX2 - 0.2, 0.05, NZ0, NX2 - 0.2, 0.05, NZ1, 0xff4fa3);
  const gate = c.sign('THE FEED · EVERY WALL IS A SCROLL · STAND STILL TO STOP THE THUMB', { w: 6.0, h: 0.3, bg: null, fg: '#f5c542', font: c.MONO, weight: 700, glow: 8 }); gate.position.set(10, NH + 0.7, NZ1 + 0.1); g.add(gate);
  plaque(c, g, 16.2, 3.6, D / 2 - 0.14, PI, 'Day Trading Attention.', 'THE 2024 BOOK THIS FLOOR IS NAMED FOR', 1.6);
  const cf = confetti(c, g, { n: 360, cols: [0xff4fa3, 0x22d3ee, GOLD, 0xffffff], x0: NX1, x1: NX2, z0: NZ0, z1: NZ1, y0: NH - 0.3, y1: NH + 1.5 });
  // ---- the scroll, the stare, the stop ----
  let frame = 0, scrollT = 0, stopped = false, lastP = [0, 0], toldStop = false; const fw = new THREE.Vector3(), to = new THREE.Vector3(), cw = new THREE.Vector3();
  const ease = (u) => 1 - Math.pow(1 - u, 3);
  c.tick((t, dt, P, ri) => {
    if (ri !== r.i) return; frame++;
    // the cameras, one target a frame in turn; the live group hides itself so a screen never films a screen
    const k = frame % 3; if (!c.MOBILE || frame % 2 === 0) { live.visible = false; c.renderer.setRenderTarget(rts[k]); c.renderer.render(c.scene, cams[k]); c.renderer.setRenderTarget(null); live.visible = true; }
    recs.forEach((rd, i) => { rd.visible = (frame % 3) === i || Math.sin(t * 5 + i) > 0; });
    // did you move
    const mv = Math.hypot(P.x - lastP[0], P.z - lastP[1]); lastP = [P.x, P.z]; const still = mv < 0.004;
    // are you looking at a live screen
    c.camera.getWorldDirection(fw); cw.copy(c.camera.position); let hot = null;
    for (const s of shows) { to.set(s.centre.x + r.x0, s.centre.y, s.centre.z).sub(cw); const dist = to.length(); to.normalize(); const look = fw.dot(to) > 0.975 && dist < 11 && still; s.held = look ? s.held + dt : 0; if (s.held > 3) hot = s; }
    if (hot && !stopped) { stopped = true; hot.hot = true; c.sound.pop(); c.toast('The thumb stopped.', 1600); }
    if (stopped && !hot) { stopped = false; shows.forEach((s) => { s.hot = false; s.draw(); }); if (!toldStop) { toldStop = true; c.toast('You moved. It scrolls again.', 1600); } }
    // the scroll: a flick every 1.5 seconds, the whole corridor moves up one post, the thumb flicks with it
    if (!stopped) scrollT += dt;
    const kk = scrollT / 1.5, ph = kk - Math.floor(kk), tile = Math.floor(kk) + ease(Math.min(1, ph / 0.42));
    atlas.offset.y = -((tile % ROWS) / ROWS);
    thumb.position.y = TY + (stopped ? Math.sin(t * 9) * 0.012 : (ph < 0.42 ? Math.sin(ph / 0.42 * PI) * 0.55 : 0)); thumb.rotation.z = stopped ? 0 : Math.sin(t * 1.3) * 0.03;
    // the counters: a slow drift on every screen, an explosion on the one you stopped the thumb for
    for (const s of shows) { s.views = Math.min(9.9e9, s.views + dt * (s.hot ? 400000 + s.views * 0.9 : 2.5)); if (s.hot && !s.done && frame % 4 === 0) c.sound.beep(600 + Math.min(3000, (s.views / 1e4)), 0.03, 0.03, 'square'); if (s.hot && !s.done && s.views > 8e6) { s.done = true; cf.start(t, 6); c.flash(0.45); c.sound.ding(); c.egg('feed_thumbstop', 'You made the thumb stop. Three seconds of somebody standing still is the whole business, and you just gave it to yourself.'); } if (t - s.lastDraw > (s.hot ? 0.08 : 0.5)) { s.lastDraw = t; s.draw(); } }
    cols2.forEach((col, i) => { col.views += dt * (30 + i * 11); if (frame % 6 === i % 6) { col.off = (col.off + 1.4) % (11 * 56); col.draw(); } });
    cf.tick(t, dt);
  });
}

// ---------- the exports the integrator reads ----------
export const ROOMS_D = { gameday, feed };
export const PROPS_D = {
  gameday: [
    ['american_football', 19.1, -4.9, { len: 0.3, y: 0.56, ry: 0.4 }],
    ['american_football', 3.2, -3.4, { len: 0.3, y: 0.5, ry: 1.2 }], ['american_football', 3.0, -3.8, { len: 0.3, y: 0.5, ry: 2.4 }],
    ['plastic_crate_01', 19.1, -0.9, { h: 0.32, r: 0.3 }], ['plastic_bottle_gallon', 19.1, -0.9, { h: 0.3, y: 0.32 }],
    ['metal_trash_can', 3.6, 1.8, { h: 0.95, r: 0.35 }], ['metal_trash_can', 16.6, 7.2, { h: 0.95, r: 0.35 }],
  ],
  feed: [
    ['metal_stool_01', 3.4, 6.6, { h: 0.7, r: 0.3 }], ['desk_lamp_arm_01', 4.5, 7.5, { h: 0.5, y: 0.78, ry: 2.4 }], ['classic_laptop', 2.4, 7.5, { len: 0.4, y: 0.78, ry: PI + 0.3 }],
    ['potted_plant_01', 19.0, 7.0, { h: 1.6, r: 0.4 }], ['metal_trash_can', 0.8, 7.2, { h: 0.95, r: 0.35 }], ['cardboard_box_01', 18.6, -7.2, { len: 0.6, r: 0.4 }],
  ],
};
export const SLOTS_D = {
  // the south wall from x 6 east of the locker, the bleacher wall high up, the bench wall; the scoreboard sits above them all
  gameday: () => { const S = []; [6.4, 8.9, 11.4, 13.9, 16.4].forEach((x) => S.push({ x, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.5 })); [-5.4, -2.6, 0.2].forEach((z) => S.push({ x: 0.14, y: 3.2, z, ry: PI / 2, w: 1.4 })); [-6.4, -4.2, -1.8, 0.4].forEach((z) => S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.4 })); return S; },
  // the south wall either side of the big screen, and the east aisle under the scrolling rows; the west aisle is the principles
  feed: () => { const S = []; [6.0, 8.0, 12.0, 14.0, 16.0, 18.0].forEach((x) => S.push({ x, y: 2.1, z: D / 2 - 0.14, ry: PI, w: 1.4 })); [-6.4, -4.8, -3.2, -1.6, 0.0, 1.4].forEach((z) => S.push({ x: W - 0.14, y: 2.1, z, ry: -PI / 2, w: 1.2 })); return S; },
};
