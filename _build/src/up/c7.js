// Round thirteen batch c7: graphics and a new illusion for each of its sets. See ROUND13_BRIEF.md.
// Sets: miracle, treebrooklyn, gatsby, bigdaddy, serendipity, bigbusiness, hudsucker, bobbyfischer, eternal, mmmystery,
// angrymen, deskset, lostweekend. Everything lives in the set's group g; no lights, only emissive, glow and additive.
const PI = Math.PI, H = PI / 2;
const near = (r, ri) => Math.abs(ri - r.i) <= 1;

// ---------- small kit ----------
const GLOW = new Map();
function gtex(K, col) { if (!GLOW.has(col)) GLOW.set(col, K.glowTex(col)); return GLOW.get(col); }
// a soft glow sprite, additive
function glow(c, K, g, x, y, z, s, col = 'rgba(255,220,160,.6)', op = 1) {
  const m = new c.THREE.Sprite(new c.THREE.SpriteMaterial({ map: gtex(K, col), transparent: true, depthWrite: false, blending: c.THREE.AdditiveBlending, opacity: op }));
  m.scale.set(s, s, 1); m.position.set(x, y, z); g.add(m); return m;
}
// a colour hot enough to bloom
const hot = (c, hex, k = 2.4, o = {}) => new c.THREE.MeshBasicMaterial({ color: new c.THREE.Color(hex).multiplyScalar(k), toneMapped: false, ...o });
// a canvas texture, half size on a phone
function ctex(c, w, h, draw) { const k = c.MOBILE ? 0.5 : 1; return c.canvasTex(Math.max(8, Math.round(w * k)), Math.max(8, Math.round(h * k)), draw); }
// a vertical fade, for light cones and shafts (opaque at the top)
let FADE;
function fade(c) { return FADE ||= c.canvasTex(8, 128, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); }); }
let SOFT;
function soft(c) { return SOFT ||= c.canvasTex(128, 128, (q, w, h) => { const gr = q.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); const g2 = q.createLinearGradient(0, 0, 0, h); g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(0.15, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,1)'); q.globalCompositeOperation = 'destination-out'; q.fillStyle = g2; q.fillRect(0, 0, w, h); }); }
const addv = (c, col, op, map, o = {}) => new c.THREE.MeshBasicMaterial({ color: col, map, transparent: true, opacity: op, depthWrite: false, blending: c.THREE.AdditiveBlending, side: c.THREE.DoubleSide, toneMapped: false, fog: true, ...o });
// a cone of light hanging from (x, y, z), open, additive
function cone(c, g, x, y, z, r0, r1, h, col = 0xffe2b0, op = 0.12) {
  const m = new c.THREE.Mesh(new c.THREE.CylinderGeometry(r0, r1, h, 20, 1, true), addv(c, col, op, fade(c)));
  m.position.set(x, y - h / 2, z); g.add(m); return m;
}
// a shaft of light: a soft edged plane, top at (x, y, z), leaning by tilt, turned by ry
function shaft(c, g, x, y, z, w, h, ry, tilt, col = 0xfff0d0, op = 0.1) {
  const T = c.THREE, p = new T.Group(); p.position.set(x, y, z); p.rotation.set(0, ry, 0); g.add(p);
  const a = new T.Group(); a.rotation.x = tilt; p.add(a);
  const geo = new T.PlaneGeometry(w, h); geo.translate(0, -h / 2, 0); const mat = addv(c, col, op * 0.6, soft(c));
  a.add(new T.Mesh(geo, mat)); const m2 = new T.Mesh(geo, mat); m2.rotation.y = H; a.add(m2); return p;
}
// a plane with a texture
function plane(c, w, h, map, o = {}, basic = false) { const T = c.THREE; return new T.Mesh(new T.PlaneGeometry(w, h), basic ? new T.MeshBasicMaterial({ map, transparent: true, side: T.DoubleSide, ...o }) : new T.MeshStandardMaterial({ map, transparent: true, roughness: 0.85, side: T.DoubleSide, ...o })); }
// a decal flat on the floor
function floorDecal(c, g, w, d, map, x, z, o = {}, ry = 0, y = 0.012) { const m = plane(c, w, d, map, { depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, ...o }); m.rotation.set(-H, 0, ry); m.position.set(x, y, z); m.renderOrder = 2; g.add(m); return m; }
// dust in a box, drifting while its set is near
function motes(c, K, r, g, n, x1, x2, y1, y2, z1, z2, col = 'rgba(255,240,210,.9)', size = 0.05, op = 0.7) {
  const T = c.THREE, N = c.MOBILE ? (n >> 1) : n, p = new Float32Array(N * 3);
  for (let k = 0; k < N; k++) { p[k * 3] = x1 + Math.random() * (x2 - x1); p[k * 3 + 1] = y1 + Math.random() * (y2 - y1); p[k * 3 + 2] = z1 + Math.random() * (z2 - z1); }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(p, 3));
  const pts = new T.Points(geo, new T.PointsMaterial({ map: gtex(K, col), size, transparent: true, opacity: op, depthWrite: false, blending: T.AdditiveBlending })); pts.frustumCulled = false; g.add(pts);
  c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; pts.position.y = Math.sin(t * 0.21) * 0.25; pts.position.x = Math.sin(t * 0.13) * 0.3; pts.rotation.y = Math.sin(t * 0.05) * 0.02; });
  return pts;
}
// a hanging pendant: cord, a shade or a globe, a hot bulb, a glow and a cone of light
function pendant(c, K, g, x, z, y, { col = 0xffd9a0, glowCol = 'rgba(255,210,150,.55)', shade = 0x1a2a1a, globe = false, drop = 0.9, coneH = 0, coneOp = 0.08, s = 1 } = {}) {
  const T = c.THREE, o = new T.Group(); o.position.set(x, y, z); g.add(o);
  o.add(c.slab(0.015, drop, 0.015, K.std(0x111111), 0, -drop / 2, 0));
  if (globe) { const b = new T.Mesh(new T.SphereGeometry(0.2 * s, 16, 12), hot(c, col, 1.6)); b.position.y = -drop - 0.18 * s; o.add(b); }
  else { const sh = new T.Mesh(new T.ConeGeometry(0.3 * s, 0.24 * s, 20, 1, true), K.std(shade, { side: T.DoubleSide, metalness: 0.4, roughness: 0.4 })); sh.position.y = -drop - 0.1 * s; o.add(sh); const b = new T.Mesh(new T.SphereGeometry(0.07 * s, 10, 8), hot(c, col, 3)); b.position.y = -drop - 0.2 * s; o.add(b); }
  glow(c, K, o, 0, -drop - 0.22 * s, 0, 1.3 * s, glowCol);
  if (coneH) cone(c, o, 0, -drop - 0.22 * s, 0, 0.25 * s, 1.4 * s, coneH, col, coneOp);
  return o;
}
// a wall sconce on a side wall: ry = H on the west wall, -H on the east wall
function sconce(c, K, g, x, y, z, ry, col = 0xffd9a0, glowCol = 'rgba(255,214,150,.6)') {
  const T = c.THREE, o = new T.Group(); o.position.set(x, y, z); o.rotation.y = ry; g.add(o);
  const brass = K.std(0xc8a050, { metalness: 1, roughness: 0.3 });
  o.add(c.slab(0.12, 0.26, 0.03, brass, 0, 0, 0.015)); const arm = c.slab(0.025, 0.025, 0.18, brass, 0, -0.02, 0.1); o.add(arm);
  const shade = new T.Mesh(new T.CylinderGeometry(0.06, 0.1, 0.16, 14, 1, true), hot(c, col, 1.3, { side: T.DoubleSide })); shade.position.set(0, 0.08, 0.2); o.add(shade);
  glow(c, K, o, 0, 0.1, 0.22, 0.9, glowCol);
  shaft(c, o, 0, 0.0, 0.08, 0.5, 1.2, 0, 0, col, 0.06).rotation.x = -0.1;
  return o;
}
// a marked spot on the floor: brass disc, an eye flower, STAND HERE
function mark(c, K, g, x, z, text = 'STAND HERE', ry = 0) {
  const t = ctex(c, 256, 256, (q, w, h) => { q.fillStyle = '#c8a050'; q.beginPath(); q.arc(w / 2, h / 2, w / 2 - 2, 0, 7); q.fill(); q.strokeStyle = '#6a4a18'; q.lineWidth = w * 0.03; q.beginPath(); q.arc(w / 2, h / 2, w / 2 - w * 0.05, 0, 7); q.stroke(); K.eyeFlower(q, w / 2, h * 0.42, w * 0.24); q.fillStyle = '#2a1a08'; q.font = `800 ${w * 0.09}px ${c.MONO}`; q.textAlign = 'center'; q.fillText(text, w / 2, h * 0.84); });
  const m = floorDecal(c, g, 0.7, 0.7, t, x, z, { metalness: 0.6, roughness: 0.35 }, ry, 0.015); return m;
}
// paper texture helpers
function grain(q, w, h, n = 1400, a = 0.06) { q.save(); q.globalAlpha = a; for (let k = 0; k < n; k++) { q.fillStyle = Math.random() < 0.5 ? '#000' : '#fff'; q.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); } q.restore(); }
// find the meshes an earlier pass made, by test
function find(g, test) { const out = []; g.traverse((o) => { if (o.isMesh && test(o)) out.push(o); }); return out; }
// move every vertex of a geometry along the ray from the eye E onto the floor (y = fy) when it is below the eye line
function toFloor(geo, E, fy, keep) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); if (keep && keep(x, y, z)) continue; const t = (E.y - fy) / (E.y - y); p.setXYZ(i, E.x + (x - E.x) * t, fy, E.z + (z - E.z) * t); }
  p.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere();
}

export const PROPS = {};
export const ROOM = {};
export const SWAP = {};

// ======================================================================= miracle
ROOM.miracle = (c, r, g, X, K) => {
  const T = c.THREE;
  r.post = { ...r.post, bloom: 1.1, vig: 0.55 };
  // ILLUSION: an anamorphic postmark. Half of it is painted on the front of the bench, half is smeared down the floor of the well.
  // From the brass mark at the gate in the bar the two halves close into one round N3W POST cancellation.
  const E = new T.Vector3(10, 1.62, 3.6), BZ = -4.89, R0 = 1.32;
  const stampT = ctex(c, 1024, 706, (q, w, h) => {
    const cx = w / 2, cy = h / 2, R = h * 0.47; q.clearRect(0, 0, w, h);
    q.strokeStyle = '#f4ead2'; q.fillStyle = '#f4ead2'; q.lineWidth = w * 0.022;
    q.beginPath(); q.arc(cx, cy, R, 0, 7); q.stroke(); q.lineWidth = w * 0.01; q.beginPath(); q.arc(cx, cy, R * 0.8, 0, 7); q.stroke();
    q.font = `900 ${w * 0.075}px ${c.SERIF}`; q.textAlign = 'center'; q.textBaseline = 'middle';
    const ring = (s, a0, a1, rr, flip) => { const n = s.length; for (let k = 0; k < n; k++) { const a = a0 + (a1 - a0) * (k + 0.5) / n; q.save(); q.translate(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); q.rotate(a + (flip ? -H : H)); q.fillText(s[k], 0, 0); q.restore(); } };
    ring('N3W POST OFFICE', PI * 1.12, PI * 1.88, R * 0.9, false); ring('TO SANTA CLAUS', PI * 0.88, PI * 0.12, R * 0.9, true);
    K.eyeFlower(q, cx, cy - R * 0.2, R * 0.32);
    q.font = `900 ${w * 0.1}px ${c.SERIF}`; q.fillText('DEC 24', cx, cy + R * 0.28); q.font = `700 ${w * 0.05}px ${c.MONO}`; q.fillText('DELIVERED BY MLow', cx, cy + R * 0.5);
    q.lineWidth = w * 0.016; for (let k = 0; k < 5; k++) { const y = cy - R * 0.5 + k * R * 0.25; q.beginPath(); for (let x = cx + R * 1.02; x < w; x += 8) q.lineTo(x, y + Math.sin(x * 0.03) * 14); q.stroke(); q.beginPath(); for (let x = 0; x < cx - R * 1.02; x += 8) q.lineTo(x, y + Math.sin(x * 0.03) * 14); q.stroke(); }
    q.globalCompositeOperation = 'destination-out'; grain(q, w, h, 9000, 0.5);
  });
  const geo = new T.PlaneGeometry(R0 * 2 * 1.45, R0 * 2, 72, 48); geo.translate(10, 0, BZ);
  toFloor(geo, E, 0.013, (x, y) => y >= -0.0001);
  const paint = new T.Mesh(geo, new T.MeshBasicMaterial({ map: stampT, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 })); paint.renderOrder = 2; g.add(paint);
  const m = mark(c, K, g, E.x, E.z, 'STAND HERE');
  c.clickable(m, () => { c.sound.thud(0.4); c.egg('miracle_cancelled', 'Stand on the brass and the smear on the floor climbs the bench and closes into one postmark. The Post Office says it is real. So does MLow, from this spot only.'); }, 'A brass mark in the floor');
  // the ceiling: coffered oak beams with gilt rosettes, and schoolhouse globes hanging between them
  const oak = K.std(0x3a2414, { roughness: 0.55 }), gilt = K.std(0xd8b048, { metalness: 1, roughness: 0.3 });
  [-5.4, -2.0, 1.4, 4.8].forEach((z) => g.add(c.slab(19.6, 0.32, 0.26, oak, 10, 5.82, z)));
  [3.4, 6.8, 10.2, 13.6, 17].forEach((x) => g.add(c.slab(0.26, 0.3, 15.6, oak, x, 5.8, 0)));
  const ros = new T.InstancedMesh(new T.CylinderGeometry(0.16, 0.2, 0.06, 16), gilt, 20); let ri0 = 0; const m4 = new T.Matrix4();
  [3.4, 6.8, 10.2, 13.6, 17].forEach((x) => [-5.4, -2.0, 1.4, 4.8].forEach((z) => { m4.makeTranslation(x, 5.64, z); ros.setMatrixAt(ri0++, m4); })); g.add(ros);
  [[5.1, -3.7], [8.5, -3.7], [11.9, -3.7], [15.3, -3.7], [5.1, 3.1], [15.3, 3.1], [8.5, 0.0], [11.9, 0.0]].forEach(([x, z]) => pendant(c, K, g, x, z, 5.95, { globe: true, drop: 1.5, coneH: 3.0, coneOp: 0.025, col: 0xfff0d8, glowCol: 'rgba(255,245,225,.55)' }));
  // daylight leaning in through the tall windows on the west wall, with dust turning in it
  [[-4.0], [-0.6], [6.4]].forEach(([z]) => shaft(c, g, 0.4, 4.6, z, 1.5, 6.2, -H, 0.85, 0xfff4e0, 0.09));
  motes(c, K, r, g, 220, 0.6, 8, 0.3, 4.6, -6, 7, 'rgba(255,250,235,.9)', 0.035, 0.6);
  // the brass rail on the bar, the runner up the aisle of the public seats
  const rail = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 12, 10), gilt); rail.rotation.z = H; rail.position.set(10, 0.84, 2.2); g.add(rail);
  [4.2, 15.8].forEach((x) => { const p = new T.Mesh(new T.SphereGeometry(0.07, 12, 10), gilt); p.position.set(x, 0.86, 2.2); g.add(p); });
  const runT = ctex(c, 256, 1024, (q, w, h) => { q.fillStyle = '#2a1a14'; q.fillRect(0, 0, w, h); q.strokeStyle = '#c8a878'; q.lineWidth = 8; q.strokeRect(14, 6, w - 28, h - 12); q.lineWidth = 3; q.strokeRect(30, 20, w - 60, h - 40); for (let y = 80; y < h - 40; y += 120) { q.save(); q.translate(w / 2, y); q.rotate(PI / 4); q.strokeRect(-30, -30, 60, 60); q.restore(); q.beginPath(); q.arc(w / 2, y, 10, 0, 7); q.stroke(); } grain(q, w, h, 3000, 0.08); });
  floorDecal(c, g, 1.4, 5.2, runT, 10, 5.0, { roughness: 1, transparent: false });
  // cast iron radiators under the windows, warm, on both side walls
  const ribG = new T.BoxGeometry(0.05, 0.62, 0.18), rib = new T.InstancedMesh(ribG, K.std(0x2a2a2a, { metalness: 0.7, roughness: 0.5 }), 64); let ni = 0;
  [[0.36, -0.5], [0.36, 6.4], [19.4, -0.5], [19.4, 6.6]].forEach(([x, z]) => { for (let k = 0; k < 16; k++) { m4.makeTranslation(x, 0.36, z - 0.6 + k * 0.08); rib.setMatrixAt(ni++, m4); } }); g.add(rib);
  // the motto over the photograph, gilt on oak
  const motto = c.sign('IN SANTA WE TRUST', { w: 6.4, h: 0.5, bg: '#2a1a0e', fg: '#e8c870', font: c.SERIF, weight: 900, border: '#c8a050' }); motto.position.set(10, 5.2, -7.86); g.add(motto);
  // banker's lamps on the four counsel tables, green glass glowing
  [[4.0, 0.0], [6.4, 0.0], [13.6, 0.0], [16.0, 0.0]].forEach(([x, z], k) => {
    const o = new T.Group(); o.position.set(x + 0.35, 0.78, z - 0.2); g.add(o);
    o.add(c.slab(0.2, 0.03, 0.12, gilt, 0, 0.015, 0)); o.add(c.slab(0.02, 0.3, 0.02, gilt, 0, 0.16, 0));
    const sh = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.3, 14, 1, true, 0, PI), hot(c, 0x4a9a5a, 1.4, { side: T.DoubleSide })); sh.rotation.z = H; sh.position.y = 0.33; o.add(sh);
    glow(c, K, o, 0, 0.22, 0.02, 0.9, 'rgba(200,255,210,.45)');
  });
  // envelopes adrift, all the time, in the light over the well
  const NE = c.MOBILE ? 14 : 30, envT = ctex(c, 64, 40, (q, w, h) => { q.fillStyle = '#f4f0e0'; q.fillRect(0, 0, w, h); q.strokeStyle = '#8a7a5a'; q.lineWidth = 2; q.beginPath(); q.moveTo(0, 0); q.lineTo(w / 2, h * 0.55); q.lineTo(w, 0); q.stroke(); q.fillStyle = '#c03030'; q.fillRect(w - 14, 4, 10, 10); });
  const env = new T.InstancedMesh(new T.PlaneGeometry(0.2, 0.12), new T.MeshStandardMaterial({ map: envT, side: T.DoubleSide, roughness: 0.9 }), NE); env.frustumCulled = false; g.add(env);
  const es = Array.from({ length: NE }, (_, k) => ({ x: 4 + Math.random() * 12, y: Math.random() * 5.5, z: -4 + Math.random() * 10, s: 0.2 + Math.random() * 0.3, p: Math.random() * 7 })), q4 = new T.Quaternion(), e4 = new T.Euler(), v4 = new T.Vector3(), one = new T.Vector3(1, 1, 1);
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; es.forEach((o, k) => { o.y -= dt * o.s; if (o.y < 0.05) o.y = 5.6; v4.set(o.x + Math.sin(t * 0.7 + o.p) * 0.6, o.y, o.z + Math.cos(t * 0.5 + o.p) * 0.4); e4.set(Math.sin(t * 1.3 + o.p) * 1.2, t * 0.6 + o.p, Math.cos(t * 1.1 + o.p) * 0.8); q4.setFromEuler(e4); m4.compose(v4, q4, one); env.setMatrixAt(k, m4); }); env.instanceMatrix.needsUpdate = true; });
};

// ======================================================================= treebrooklyn
ROOM.treebrooklyn = (c, r, g, X, K) => {
  const T = c.THREE;
  r.post = { ...r.post, bloom: 0.7, vig: 0.45 };
  // the Monday wash, painted: shirts, gingham, ticking, union suits, towels, in place of the grey cards
  const kinds = [
    (q, w, h) => { q.fillStyle = '#f4f2ea'; q.beginPath(); q.moveTo(w * 0.3, 0); q.lineTo(w * 0.7, 0); q.lineTo(w, h * 0.16); q.lineTo(w * 0.92, h * 0.36); q.lineTo(w * 0.8, h * 0.3); q.lineTo(w * 0.8, h); q.lineTo(w * 0.2, h); q.lineTo(w * 0.2, h * 0.3); q.lineTo(w * 0.08, h * 0.36); q.lineTo(0, h * 0.16); q.closePath(); q.fill(); q.fillStyle = '#9a9a92'; for (let y = h * 0.12; y < h * 0.9; y += h * 0.1) { q.beginPath(); q.arc(w / 2, y, 3, 0, 7); q.fill(); } q.fillRect(w / 2 - 1, 0, 2, h); },
    (q, w, h) => { for (let y = 0; y < h; y += 12) for (let x = 0; x < w; x += 12) { q.fillStyle = ((x + y) / 12) % 2 ? '#e8e8e0' : '#5a5a58'; q.fillRect(x, y, 12, 12); } q.globalAlpha = 0.4; for (let y = 0; y < h; y += 12) { q.fillStyle = '#8a8a86'; q.fillRect(0, y + 4, w, 4); } q.globalAlpha = 1; },
    (q, w, h) => { q.fillStyle = '#f0eee4'; q.fillRect(0, 0, w, h); q.fillStyle = '#3a3a40'; for (let x = 4; x < w; x += 14) q.fillRect(x, 0, 3, h); q.fillRect(0, h * 0.85, w, 6); },
    (q, w, h) => { q.fillStyle = '#d8d0c4'; q.beginPath(); q.moveTo(w * 0.2, 0); q.lineTo(w * 0.8, 0); q.lineTo(w * 0.85, h * 0.55); q.lineTo(w * 0.62, h); q.lineTo(w * 0.52, h * 0.6); q.lineTo(w * 0.48, h * 0.6); q.lineTo(w * 0.38, h); q.lineTo(w * 0.15, h * 0.55); q.closePath(); q.fill(); q.fillStyle = '#8a8478'; for (let y = h * 0.06; y < h * 0.5; y += h * 0.08) { q.beginPath(); q.arc(w / 2, y, 2.5, 0, 7); q.fill(); } },
    (q, w, h) => { q.fillStyle = '#ecece6'; q.fillRect(0, 0, w, h); q.fillStyle = '#6a6a6a'; q.fillRect(0, h * 0.1, w, h * 0.06); q.fillRect(0, h * 0.82, w, h * 0.06); q.globalAlpha = 0.25; for (let y = 0; y < h; y += 4) { q.fillStyle = '#000'; q.fillRect(0, y, w, 1); } q.globalAlpha = 1; },
  ];
  const washT = kinds.map((f) => ctex(c, 128, 192, (q, w, h) => { q.clearRect(0, 0, w, h); f(q, w, h); grain(q, w, h, 400, 0.08); }));
  const wash = find(g, (o) => o.geometry?.type === 'PlaneGeometry' && Math.abs((o.geometry.parameters?.width || 0) - 0.5) < 1e-4 && Math.abs(o.position.y - 3.4) < 0.01);
  wash.forEach((m, k) => { m.material = new T.MeshStandardMaterial({ map: washT[k % 5], transparent: true, alphaTest: 0.4, side: T.DoubleSide, roughness: 0.95 }); });
  // pulleys on the yard walls where the lines tie off
  const iron = K.std(0x2a2a2a, { metalness: 0.7, roughness: 0.4 });
  [-0.6, 2.6].forEach((z) => [0.3, 19.6].forEach((x) => { const w = new T.Mesh(new T.TorusGeometry(0.1, 0.025, 8, 18), iron); w.position.set(x, 3.4, z); g.add(w); g.add(c.slab(0.3, 0.04, 0.04, iron, x + (x < 10 ? -0.14 : 0.14), 3.4, z)); }));
  // ILLUSION: Monday's lace, two curtains of rings hung one behind the other. Walk past and the rings swim.
  const MX = 14.6, MZ = 1.0, MW = 5.0, MH = 1.75, ringT = (cx) => ctex(c, 1024, 360, (q, w, h) => { q.clearRect(0, 0, w, h); q.strokeStyle = '#141414'; q.lineWidth = 4.5 * w / 1024; const px = w / MW; for (let rr = 6; rr < w * 1.2; rr += 0.06 * px) { q.beginPath(); q.arc(cx * w, h / 2, rr, 0, 7); q.stroke(); } q.strokeStyle = '#d8d0c0'; q.lineWidth = 10 * w / 1024; q.strokeRect(0, 0, w, h); });
  const lace = [[MZ, 0.38], [MZ - 0.32, 0.62]].map(([z, cx]) => { const m = plane(c, MW, MH, ringT(cx), { alphaTest: 0.35, transparent: false, roughness: 1 }); m.position.set(MX, 2.55 - MH / 2, z); g.add(m); g.add(c.slab(MW + 0.6, 0.012, 0.012, K.std(0x555555), MX, 2.57, z)); return m; });
  const wood = c.surf ? c.surf('planks', 1, 0x6a5040) : K.std(0x6a5040);
  [MX - MW / 2 - 0.35, MX + MW / 2 + 0.35].forEach((x) => { g.add(c.slab(0.12, 2.7, 0.12, wood, x, 1.35, MZ - 0.16)); g.add(c.slab(0.12, 0.12, 0.6, wood, x, 2.62, MZ - 0.16)); c.post(X(x), MZ - 0.16, 0.15); });
  const pegM = K.std(0xc8b088); for (let k = 0; k < 12; k++) { const z = k % 2 ? MZ - 0.32 : MZ; g.add(c.slab(0.025, 0.09, 0.025, pegM, MX - MW / 2 + 0.2 + (k >> 1) * 0.92, 2.55, z)); }
  lace.forEach((m) => c.clickable(m, () => { c.sound.whoosh?.(0.05, 0.4); c.egg('treebrooklyn_lace', 'Monday\'s lace, two curtains of rings hung to dry. Walk past and the rings swim. Mama says it is the cotton. MLow says it is you.'); }, 'Lace on the line'));
  // a flagstone path from the gate to the tree, and a hopscotch chalked on it
  const flagT = ctex(c, 256, 1024, (q, w, h) => { q.fillStyle = '#4a4a46'; q.fillRect(0, 0, w, h); let y = 0; while (y < h) { const hh = 90 + Math.random() * 70; let x = 0; while (x < w) { const ww = 80 + Math.random() * 90; const v = 150 + Math.random() * 50 | 0; q.fillStyle = `rgb(${v},${v},${v - 6})`; q.fillRect(x + 4, y + 4, Math.min(ww, w - x) - 8, hh - 8); x += ww; } y += hh; } grain(q, w, h, 4000, 0.12); });
  floorDecal(c, g, 1.5, 8.6, flagT, 11.2, 0.4, { transparent: false, roughness: 0.9, color: 0x8a8a84 }, 0.32);
  const hopT = ctex(c, 256, 640, (q, w, h) => { q.clearRect(0, 0, w, h); q.strokeStyle = 'rgba(250,250,240,.85)'; q.lineWidth = 6; const s = 90; const rows = [[1], [2], [1], [2], [1], [2]]; let y = h - 20; rows.forEach((row, k) => { const n = row[0], x0 = w / 2 - n * s / 2; for (let i = 0; i < n; i++) q.strokeRect(x0 + i * s, y - s, s, s); q.font = `700 40px ${c.SERIF}`; q.fillStyle = 'rgba(250,250,240,.85)'; q.textAlign = 'center'; for (let i = 0; i < n; i++) q.fillText(String(k * 1.5 + i + 1 | 0), x0 + i * s + s / 2, y - s / 2 + 14); y -= s; }); q.beginPath(); q.arc(w / 2, y - 40, 50, PI, 0); q.stroke(); q.font = `700 30px ${c.MONO}`; q.fillText('FRANCIE', w / 2, y - 50); });
  floorDecal(c, g, 0.9, 2.25, hopT, 6.4, 1.2, {}, 0.1);
  // puddles from the wash water: dark mirrors on the cobbles
  [[7.6, 2.0, 1.4, 0.8], [9.8, -0.4, 0.9, 0.6], [4.6, -2.8, 1.6, 0.9]].forEach(([x, z, w, d]) => { const pT = ctex(c, 128, 128, (q, W2, H2) => { const gr = q.createRadialGradient(W2 / 2, H2 / 2, 2, W2 / 2, H2 / 2, W2 / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.7, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.beginPath(); q.ellipse(W2 / 2, H2 / 2, W2 / 2, H2 / 2.4, 0, 0, 7); q.fill(); }); floorDecal(c, g, w, d, null, x, z, { alphaMap: pT, color: 0x1a1a1c, metalness: 0.6, roughness: 0.12, transparent: true, opacity: 0.85 }, Math.random()); });
  // weeds in the cracks, instanced
  const weedT = ctex(c, 64, 64, (q, w, h) => { q.clearRect(0, 0, w, h); q.strokeStyle = '#5a6a44'; q.lineWidth = 3; for (let k = 0; k < 9; k++) { q.beginPath(); q.moveTo(w / 2, h); q.quadraticCurveTo(w / 2 + (k - 4) * 4, h / 2, w / 2 + (k - 4) * 7, 4 + Math.random() * 20); q.stroke(); } });
  const NW = c.MOBILE ? 40 : 80, weeds = new T.InstancedMesh(new T.PlaneGeometry(0.35, 0.35).translate(0, 0.17, 0), new T.MeshStandardMaterial({ map: weedT, alphaTest: 0.4, side: T.DoubleSide, roughness: 1 }), NW); const m4 = new T.Matrix4(), q4 = new T.Quaternion(), e4 = new T.Euler(), v4 = new T.Vector3(), s4 = new T.Vector3();
  for (let k = 0; k < NW; k++) { const edge = k % 3; const x = edge === 0 ? 0.4 + Math.random() * 0.4 : edge === 1 ? 19.2 + Math.random() * 0.4 : 1 + Math.random() * 18, z = edge === 2 ? 7.5 + Math.random() * 0.3 : -7.4 + Math.random() * 15; if (x < 1.5 && z > 1.8 && z < 5.8) continue; v4.set(x, 0, z); e4.set(0, Math.random() * PI, 0); q4.setFromEuler(e4); s4.setScalar(0.6 + Math.random()); m4.compose(v4, q4, s4); weeds.setMatrixAt(k, m4); }
  g.add(weeds);
  // sun leaning into the yard over the roofs
  [[3.5, -2.0], [8.0, -1.0], [12.5, 0.2]].forEach(([x, z], k) => shaft(c, g, x, 9, z, 2.2, 11, 0.3, 0.55, 0xfff8e8, 0.08));
  // ailanthus seeds, the papery samaras, spinning down out of the tree all day
  const NS = c.MOBILE ? 20 : 44, samT = ctex(c, 32, 64, (q, w, h) => { q.clearRect(0, 0, w, h); q.fillStyle = '#c8c0a0'; q.beginPath(); q.ellipse(w / 2, h / 2, w * 0.3, h * 0.46, 0.2, 0, 7); q.fill(); q.fillStyle = '#6a604a'; q.beginPath(); q.arc(w / 2, h / 2, 4, 0, 7); q.fill(); });
  const sam = new T.InstancedMesh(new T.PlaneGeometry(0.05, 0.11), new T.MeshStandardMaterial({ map: samT, alphaTest: 0.4, side: T.DoubleSide }), NS); sam.frustumCulled = false; g.add(sam);
  const ss = Array.from({ length: NS }, () => ({ x: 11 + Math.random() * 5, y: Math.random() * 6, z: -6 + Math.random() * 6, v: 0.25 + Math.random() * 0.3, p: Math.random() * 7 })), one = new T.Vector3(1, 1, 1);
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; ss.forEach((o, k) => { o.y -= dt * o.v; if (o.y < 0.02) { o.y = 6; o.x = 11 + Math.random() * 5; } v4.set(o.x + Math.sin(t + o.p) * 0.4, o.y, o.z + Math.cos(t * 0.8 + o.p) * 0.3); e4.set(0.4, t * 9 + o.p, 0.3); q4.setFromEuler(e4); m4.compose(v4, q4, one); sam.setMatrixAt(k, m4); }); sam.instanceMatrix.needsUpdate = true; });
  // the cellar doors, a milk crate of empties, a chalk heart on the wall
  const cellar = new T.Group(); cellar.position.set(5.0, 0, 7.35); g.add(cellar); const dw = K.std(0x4a4038, { roughness: 0.9 });
  [-0.5, 0.5].forEach((x) => { const d = c.slab(0.96, 0.05, 1.1, dw, x, 0.35, 0); d.rotation.x = 0.55; cellar.add(d); }); cellar.add(c.slab(2.1, 0.5, 0.12, K.std(0x5a5a56), 0, 0.25, 0.55));
  const chalk = K.decal(1.4, 0.9, (q, w, h) => { q.strokeStyle = 'rgba(250,250,240,.8)'; q.lineWidth = 5; q.beginPath(); q.moveTo(w * 0.5, h * 0.85); q.bezierCurveTo(w * 0.05, h * 0.5, w * 0.2, h * 0.05, w * 0.5, h * 0.3); q.bezierCurveTo(w * 0.8, h * 0.05, w * 0.95, h * 0.5, w * 0.5, h * 0.85); q.stroke(); q.fillStyle = 'rgba(250,250,240,.85)'; q.font = `700 ${h * 0.14}px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('F.N. + N3W YORK', w / 2, h * 0.55); });
  chalk.position.set(19.73, 1.1, 6.6); chalk.rotation.y = -H; g.add(chalk);
};

// ======================================================================= gatsby
ROOM.gatsby = (c, r, g, X, K) => {
  const T = c.THREE;
  r.post = { ...r.post, bloom: 1.0, vig: 0.5 };
  // ILLUSION: a spur of the railroad through the ash, built in forced perspective. It shrinks from full gauge to a quarter
  // in six metres, so the ash man at its far end, the same man as the one at its near end, looks like a giant.
  const A = new T.Vector2(14.6, -0.8), B = new T.Vector2(11.6, -6.4), G0 = 1.44, G1 = 0.36, lerp = (a, b, u) => a + (b - a) * u, gAt = (u) => lerp(G0, G1, u);
  const dir = B.clone().sub(A), LEN = dir.length(); dir.normalize(); const side = new T.Vector2(-dir.y, dir.x), RY = Math.atan2(dir.x, dir.y);
  const at = (u, s = 0) => new T.Vector2(lerp(A.x, B.x, u) + side.x * s, lerp(A.y, B.y, u) + side.y * s);
  const ballT = ctex(c, 256, 512, (q, w, h) => { q.fillStyle = '#6a665c'; q.fillRect(0, 0, w, h); for (let k = 0; k < 6000; k++) { const v = 90 + Math.random() * 100 | 0; q.fillStyle = `rgb(${v},${v - 4},${v - 10})`; q.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 4, 2 + Math.random() * 3); } });
  { const p0 = at(-0.06, -G0 * 0.95), p1 = at(-0.06, G0 * 0.95), p2 = at(1.03, G1 * 0.95), p3 = at(1.03, -G1 * 0.95), gb = new T.BufferGeometry(); gb.setAttribute('position', new T.Float32BufferAttribute([p0.x, 0.02, p0.y, p1.x, 0.02, p1.y, p2.x, 0.02, p2.y, p3.x, 0.02, p3.y], 3)); gb.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2)); gb.setIndex([0, 2, 1, 0, 3, 2]); gb.computeVertexNormals(); const bm = new T.Mesh(gb, new T.MeshStandardMaterial({ map: ballT, roughness: 1, side: T.DoubleSide })); g.add(bm); }
  const tie = K.std(0x3a2a1e, { roughness: 0.95 }), steel = K.std(0x9a9088, { metalness: 0.9, roughness: 0.3 });
  const NT = 16; for (let k = 0; k < NT; k++) { const u = Math.pow(k / (NT - 1), 0.85), p = at(u), s = gAt(u) / G0, t = c.slab(G0 * 1.75 * s, 0.07 * s + 0.02, 0.22 * s, tie, p.x, 0.05, p.y); t.rotation.y = RY; g.add(t); }
  [-1, 1].forEach((sd) => { const p0 = at(0, sd * G0 / 2), p1 = at(1, sd * G1 / 2), L = p0.distanceTo(p1), rl = c.slab(0.07, 0.12, L, steel, (p0.x + p1.x) / 2, 0.12, (p0.y + p1.y) / 2); rl.rotation.y = Math.atan2(p1.x - p0.x, p1.y - p0.y); const pa = rl.geometry.attributes.position; for (let i = 0; i < pa.count; i++) { if (pa.getZ(i) > 0) { pa.setY(i, pa.getY(i) * 0.3); pa.setX(i, pa.getX(i) * 0.3); } } g.add(rl); });
  // a signal at the far end, a quarter size, lit red, and telegraph poles shrinking down the line
  const sp = at(1.0, -G1 * 1.1), sig = new T.Group(); sig.position.set(sp.x, 0, sp.y); g.add(sig); sig.add(c.slab(0.05, 1.3, 0.05, K.std(0x2a2a2a), 0, 0.65, 0)); sig.add(c.slab(0.16, 0.3, 0.06, K.std(0x1a1a1a), 0, 1.3, 0));
  const red = new T.Mesh(new T.SphereGeometry(0.035, 10, 8), hot(c, 0xff2a1a, 3)); red.position.set(0, 1.36, 0.04); sig.add(red); glow(c, K, sig, 0, 1.36, 0.06, 0.4, 'rgba(255,60,40,.8)');
  for (let k = 0; k < 5; k++) { const u = k / 4, s = gAt(u) / G0, p = at(u, gAt(u) * 1.5), ph = 4.6 * s, pole = c.slab(0.14 * s + 0.02, ph, 0.14 * s + 0.02, K.std(0x4a3a2a), p.x, ph / 2, p.y); g.add(pole); const arm = c.slab(0.9 * s, 0.06 * s + 0.01, 0.06 * s + 0.01, K.std(0x4a3a2a), p.x, ph * 0.92, p.y); arm.rotation.y = RY; g.add(arm); }
  const man = (u, s) => { const p = at(u); const e = K.extra(g, p.x, p.y, { col: 0x6a645a, ry: -0.5 }); e.scale.setScalar(s); c.post(X(p.x), p.y, 0.3); return e; };
  man(0.1, 1); const giant = man(0.94, 1);
  const pp = at(-0.02, -G0 * 1.25), plate = c.sign('N3W ASH LINE\nSPUR No. 1  BY MLow', { w: 1.0, h: 0.34, bg: '#e8dcc0', fg: '#3a2a1a', font: c.SERIF, weight: 900, border: '#3a2a1a' }); plate.position.set(pp.x, 0.95, pp.y); plate.rotation.y = -0.5; g.add(plate); g.add(c.slab(0.05, 0.8, 0.05, K.std(0x3a2a1e), pp.x, 0.4, pp.y - 0.02));
  c.clickable(giant, () => { c.sound.horn?.(0.1); c.egg('gatsby_spur', 'Same ash man, same shovel, twice. The track does the lying: it shrinks to a quarter in sixteen ties, so the far one turns into a giant. MLow laid every tie himself, in the ash.'); }, 'An ash man at the end of the line');
  mark(c, K, g, 10, 4.2, 'STAND HERE');
  // the ash heaps get ash: streaked grey, cinders
  const ashT = ctex(c, 512, 512, (q, w, h) => { q.fillStyle = '#86807a'; q.fillRect(0, 0, w, h); for (let k = 0; k < 9000; k++) { const v = 90 + Math.random() * 80 | 0; q.fillStyle = `rgba(${v},${v - 4},${v - 8},.6)`; q.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1 + Math.random() * 5); } q.strokeStyle = 'rgba(40,36,32,.35)'; q.lineWidth = 3; for (let k = 0; k < 60; k++) { const x = Math.random() * w; q.beginPath(); q.moveTo(x, 0); q.lineTo(x + (Math.random() - 0.5) * 40, h); q.stroke(); } });
  find(g, (o) => o.geometry?.type === 'ConeGeometry' && o.material?.color?.getHex() === 0x7a746a).forEach((m) => { m.material = new T.MeshStandardMaterial({ map: ashT, roughness: 1, color: 0xc8c0b4 }); });
  // the fire in the ash men's barrel: flicker, glow, and the smoke going up
  const fire = [0, 1, 2, 3].map((k) => glow(c, K, g, 6.4 + (k - 1.5) * 0.08, 0.95, -0.2, 0.5, 'rgba(255,130,40,.9)'));
  const coals = new T.Mesh(new T.CircleGeometry(0.26, 16), hot(c, 0xff6a20, 2)); coals.rotation.x = -H; coals.position.set(6.4, 0.84, -0.2); g.add(coals);
  K.steam(g, 6.4, 1.0, -0.2);
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; fire.forEach((f, k) => { const u = (t * 1.4 + k * 0.25) % 1; f.position.y = 0.9 + u * 0.6; f.scale.setScalar(0.6 * (1 - u) + 0.15); f.material.opacity = (1 - u) * (0.7 + Math.sin(t * 17 + k) * 0.3); }); });
  // the billboard gets its lamps: four goosenecks over the top, throwing light down the oculist's face
  const bb = find(g, (o) => o.geometry?.type === 'BoxGeometry' && Math.abs(o.geometry.parameters.width - 9) < 0.01 && Math.abs(o.geometry.parameters.height - 3) < 0.01)[0];
  [-3.3, -1.1, 1.1, 3.3].forEach((x) => { const o = new T.Group(); o.position.set(10 + x, 6.35, -5.25); g.add(o); o.add(c.slab(0.04, 0.04, 0.5, K.std(0x2a2a2a, { metalness: 0.8 }), 0, 0, 0.22)); const hd = new T.Mesh(new T.ConeGeometry(0.16, 0.22, 14, 1, true), K.std(0x1a3a2a, { side: T.DoubleSide, metalness: 0.5 })); hd.position.set(0, -0.05, 0.48); hd.rotation.x = -0.6; o.add(hd); const b = new T.Mesh(new T.SphereGeometry(0.06, 10, 8), hot(c, 0xfff0c8, 3)); b.position.set(0, -0.1, 0.5); o.add(b); glow(c, K, o, 0, -0.12, 0.52, 0.9, 'rgba(255,240,200,.6)'); const cn = cone(c, o, 0, -0.1, 0.5, 0.06, 1.1, 2.6, 0xfff0d0, 0.07); cn.rotation.x = 0.35; });
  // the hot globe on the gas pump
  find(g, (o) => o.geometry?.type === 'SphereGeometry' && Math.abs((o.geometry.parameters.radius || 0) - 0.22) < 0.001).forEach((m) => { m.material = hot(c, 0xfff0d0, 1.8); glow(c, K, m, 0, 0, 0, 1.2, 'rgba(255,236,190,.6)'); });
  // ground haze in bands over the ash, warm grey, and a pale sun low over the dumps
  [[-2.0, 0.6], [1.5, 0.9], [-5.5, 1.2]].forEach(([z, y], k) => { const m = new T.Mesh(new T.PlaneGeometry(20, 1.6), addv(c, 0xb8b0a0, 0.16, soft(c))); m.position.set(10, y, z); m.rotation.z = 0; g.add(m); c.tick((t, dt, P, ri) => { if (ri === r.i) m.position.x = 10 + Math.sin(t * 0.1 + k) * 1.2; }); });
  const sun = glow(c, K, g, 15.5, 7.6, -7.9, 5, 'rgba(255,236,200,.55)'); sun.material.fog = false;
  // tyre tracks in the ash along the road, oil stains by the garage
  const trackT = ctex(c, 128, 1024, (q, w, h) => { q.clearRect(0, 0, w, h); q.fillStyle = 'rgba(40,36,30,.45)'; [w * 0.18, w * 0.7].forEach((x) => { for (let y = 0; y < h; y += 10) q.fillRect(x + Math.sin(y * 0.01) * 3, y, w * 0.12, 6); }); });
  floorDecal(c, g, 2.0, 15.6, trackT, 16.4, 0);
  const oilT = ctex(c, 256, 256, (q, w, h) => { q.clearRect(0, 0, w, h); for (let k = 0; k < 7; k++) { const gr = q.createRadialGradient(60 + Math.random() * 140, 60 + Math.random() * 140, 2, 128, 128, 60 + Math.random() * 50); gr.addColorStop(0, 'rgba(10,8,6,.7)'); gr.addColorStop(1, 'rgba(10,8,6,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); } });
  floorDecal(c, g, 2.6, 2.6, oilT, 2.2, 0.8, { metalness: 0.6, roughness: 0.2 });
  // ash drifting thicker near the ground, in the light
  motes(c, K, r, g, 160, 2, 18, 0.1, 2.2, -6.5, 6.5, 'rgba(200,190,175,.9)', 0.06, 0.55);
};

// ======================================================================= bigdaddy
ROOM.bigdaddy = (c, r, g, X, K) => {
  const T = c.THREE;
  r.post = { ...r.post, bloom: 0.75, vig: 0.35 };
  // ILLUSION: rotating snakes, chalked on the Mall. Nothing in it moves; look beside it and every wheel turns.
  const snakes = ctex(c, 1024, 1024, (q, w, h) => {
    q.fillStyle = '#2a8a3a'; q.fillRect(0, 0, w, h);
    const disc = (cx, cy, R, dir) => { const rings = 4; for (let ring = rings; ring >= 1; ring--) { const r1 = R * ring / rings, r0 = R * (ring - 1) / rings, n = 10 + ring * 6; for (let k = 0; k < n; k++) { const a0 = k / n * PI * 2, da = PI * 2 / n; ['#101010', '#2a4ad8', '#f8f8f0', '#f5c542'].forEach((col, j) => { const s0 = a0 + (dir > 0 ? j : 3 - j) * da / 4; q.fillStyle = col; q.beginPath(); q.arc(cx, cy, r1, s0, s0 + da / 4 + 0.004); q.arc(cx, cy, r0, s0 + da / 4 + 0.004, s0, true); q.closePath(); q.fill(); }); } } q.fillStyle = '#d83a2a'; q.beginPath(); q.arc(cx, cy, R * 0.12, 0, 7); q.fill(); };
    const S = w / 3; for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) disc(S * i + S / 2, S * j + S / 2, S * 0.47, (i + j) % 2 ? 1 : -1);
    q.globalCompositeOperation = 'destination-out'; grain(q, w, h, 12000, 0.35); q.globalCompositeOperation = 'source-over';
    q.strokeStyle = 'rgba(255,255,255,.85)'; q.lineWidth = 10; q.strokeRect(6, 6, w - 12, h - 12);
  });
  const CX = 13.0, CZ = 3.4, CS = 2.4;
  const chalk = floorDecal(c, g, CS, CS, snakes, CX, CZ, { roughness: 1 });
  const lbl = K.decal(2.2, 0.32, (q, w, h) => { q.fillStyle = 'rgba(255,250,240,.9)'; q.font = `700 ${h * 0.55}px ${c.MONO}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('DO NOT STARE. IT MOVES.  BY MLow', w / 2, h / 2); }, 128);
  lbl.rotation.x = -H; lbl.position.set(CX, 0.016, CZ + CS / 2 + 0.25); g.add(lbl);
  const artist = K.extra(g, CX + 1.65, CZ - 0.2, { seated: true, col: 0xc85a8a, ry: -H }); artist.position.y = -0.3; c.post(X(CX + 1.65), CZ - 0.2, 0.3);
  const box = new T.Group(); box.position.set(CX + 1.45, 0, CZ + 0.6); g.add(box); box.add(c.slab(0.36, 0.08, 0.22, K.std(0x8a6a3a), 0, 0.04, 0)); ['#f5c542', '#2a4ad8', '#ff4fa3', '#f8f8f0', '#22d3ee'].forEach((col, k) => box.add(c.slab(0.06, 0.03, 0.03, K.std(col), -0.12 + k * 0.06, 0.1, 0)));
  c.clickable(chalk, () => { c.sound.note?.(520, 0.1); c.egg('bigdaddy_chalk', 'Sidewalk chalk on the Mall, four colours, and not one line moves. Your eyes do the rollerblading. The artist takes tips in ketchup packets and signs everything MLow.'); }, 'Chalk on the path');
  // the elms: four trunks in the corners and a canopy meeting overhead, the Mall's cathedral
  const barkT = ctex(c, 256, 512, (q, w, h) => { q.fillStyle = '#4a3e34'; q.fillRect(0, 0, w, h); for (let k = 0; k < 140; k++) { const x = Math.random() * w; q.strokeStyle = `rgba(${20 + Math.random() * 30 | 0},${16 + Math.random() * 20 | 0},12,.6)`; q.lineWidth = 2 + Math.random() * 6; q.beginPath(); q.moveTo(x, 0); for (let y = 0; y < h; y += 30) q.lineTo(x + Math.sin(y * 0.02 + k) * 8, y); q.stroke(); } grain(q, w, h, 3000, 0.1); });
  const bark = new T.MeshStandardMaterial({ map: barkT, roughness: 1 }), tall = new T.Group(); g.add(tall);
  c.tick((t, dt, P, ri) => { tall.visible = ri === r.i; });
  [[3.0, -7.5], [0.9, 7.2], [17.0, -7.5], [19.1, 7.2]].forEach(([x, z]) => { const tr = new T.Mesh(new T.CylinderGeometry(0.28, 0.42, 6.5, 14), bark); tr.position.set(x, 3.25, z); tr.rotation.z = x < 10 ? -0.08 : 0.08; tall.add(tr); c.post(X(x), z, 0.45); [-0.6, 0.6].forEach((a) => { const br = new T.Mesh(new T.CylinderGeometry(0.1, 0.18, 3.4, 8), bark); br.position.set(x + (x < 10 ? 0.9 : -0.9), 6.4, z + a * 0.8); br.rotation.set(a * 0.4, 0, x < 10 ? -0.9 : 0.9); tall.add(br); }); });
  const leafT = ctex(c, 512, 512, (q, w, h) => { q.clearRect(0, 0, w, h); for (let k = 0; k < 1500; k++) { const x = Math.random() * w, y = Math.random() * h, s = 6 + Math.random() * 12, v = Math.random(); q.fillStyle = `rgb(${60 + v * 70 | 0},${120 + v * 90 | 0},${40 + v * 30 | 0})`; q.beginPath(); q.ellipse(x, y, s, s * 0.55, Math.random() * PI, 0, 7); q.fill(); } });
  const leafM = new T.MeshStandardMaterial({ map: leafT, alphaTest: 0.45, side: T.DoubleSide, roughness: 0.9 });
  const canopy = new T.Group(); tall.add(canopy);
  [[3.4, -5.5, 0.5], [3.4, 0, 0.6], [3.4, 5.5, 0.5], [16.6, -5.5, -0.5], [16.6, 0, -0.6], [16.6, 5.5, -0.5], [7.5, -3, 0.25], [12.5, 3, -0.25], [7.5, 3.5, 0.2], [12.5, -3.5, -0.2]].forEach(([x, z, tilt]) => { const m = new T.Mesh(new T.PlaneGeometry(6, 5.8), leafM); m.rotation.set(-H + tilt * 0.4, 0, tilt); m.position.set(x, 6.4 + Math.abs(tilt) * 1.2, z); canopy.add(m); });
  c.tick((t, dt, P, ri) => { if (ri === r.i) canopy.rotation.z = Math.sin(t * 0.6) * 0.006; });
  // dappled shade under the elms, drifting in the breeze
  const dapT = ctex(c, 512, 512, (q, w, h) => { q.fillStyle = 'rgba(0,0,0,1)'; q.fillRect(0, 0, w, h); q.globalCompositeOperation = 'destination-out'; for (let k = 0; k < 110; k++) { const x = Math.random() * w, y = Math.random() * h, s = 14 + Math.random() * 40, gr = q.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = gr; q.fillRect(x - s, y - s, s * 2, s * 2); } });
  dapT.wrapS = dapT.wrapT = T.RepeatWrapping; dapT.repeat.set(2, 2);
  const dap = floorDecal(c, g, 19.5, 15.6, dapT, 10, 0, { color: 0x0a1a08, opacity: 0.45, roughness: 1 }, 0, 0.008); dap.material.transparent = true;
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; dapT.offset.set(Math.sin(t * 0.15) * 0.02, Math.cos(t * 0.11) * 0.02); });
  // the sun coming through the canopy
  [[5, -2.5, 0.4], [9.5, 1.5, 0.35], [14, -4, 0.45], [12, 5, 0.3]].forEach(([x, z, tl]) => shaft(c, g, x, 6.2, z, 1.6, 7, 0.6, tl, 0xfff4d0, 0.11));
  motes(c, K, r, g, 140, 3, 17, 0.4, 5, -6, 6, 'rgba(255,250,210,.9)', 0.04, 0.5);
  // the lawns along both sides, deep green
  const grassT = ctex(c, 512, 128, (q, w, h) => { q.fillStyle = '#3a7a2a'; q.fillRect(0, 0, w, h); for (let k = 0; k < 5000; k++) { const v = Math.random(); q.fillStyle = `rgba(${30 + v * 70 | 0},${100 + v * 90 | 0},${20 + v * 30 | 0},.8)`; q.fillRect(Math.random() * w, Math.random() * h, 1, 3 + Math.random() * 5); } });
  [[0.85, -2.95, 9.9], [19.15, -2.95, 9.9], [0.85, 6.8, 2.4], [19.15, 6.8, 2.4]].forEach(([x, z, d]) => floorDecal(c, g, 1.2, d, grassT, x, z, { transparent: false, roughness: 1 }, 0));
  // a balloon man by the rope, his bunch bobbing over him
  const bman = K.extra(g, 16.4, -6.0, { col: 0x3a5a9a, ry: 0.6 }); c.post(X(16.4), -6.0, 0.3);
  const NB = 9, bal = [], cols = [0xff4fa3, 0x22d3ee, 0xf5c542, 0x3b82f6, 0xff7a1a, 0x7ad83a, 0xff4040, 0xffffff, 0xc84ad8], strM = new T.LineBasicMaterial({ color: 0xdddddd });
  for (let k = 0; k < NB; k++) { const b = new T.Mesh(new T.SphereGeometry(0.2, 16, 12), new T.MeshPhysicalMaterial({ color: cols[k], roughness: 0.15, clearcoat: 1, sheen: 0.3 })); b.scale.y = 1.18; g.add(b); const sg = new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3()]); const sl = new T.Line(sg, strM); sl.frustumCulled = false; g.add(sl); bal.push({ b, sg, a: k / NB * PI * 2, h: 2.5 + (k % 3) * 0.35 }); }
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; bal.forEach((o) => { const x = 16.55 + Math.cos(o.a + Math.sin(t * 0.7 + o.a) * 0.2) * 0.42, z = -5.85 + Math.sin(o.a) * 0.42, y = o.h + Math.sin(t * 1.3 + o.a * 3) * 0.06; o.b.position.set(x, y, z); const pa = o.sg.attributes.position; pa.setXYZ(0, 16.62, 1.25, -5.9); pa.setXYZ(1, x, y - 0.22, z); pa.needsUpdate = true; }); });
  // soap bubbles drifting up from the kid by the cart
  const NBB = c.MOBILE ? 12 : 26, bubT = ctex(c, 128, 128, (q, w, h) => { const gr = q.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.7, 'rgba(160,220,255,.25)'); gr.addColorStop(0.86, 'rgba(255,160,230,.7)'); gr.addColorStop(0.95, 'rgba(255,255,200,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); q.fillStyle = 'rgba(255,255,255,.9)'; q.beginPath(); q.ellipse(w * 0.34, h * 0.32, 8, 5, -0.6, 0, 7); q.fill(); });
  const bm = new T.SpriteMaterial({ map: bubT, transparent: true, depthWrite: false, blending: T.AdditiveBlending }), bubs = [];
  for (let k = 0; k < NBB; k++) { const s = new T.Sprite(bm); g.add(s); bubs.push({ s, u: Math.random(), p: Math.random() * 7, sz: 0.12 + Math.random() * 0.18 }); }
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; bubs.forEach((o) => { o.u += dt * 0.07; if (o.u > 1) o.u -= 1; o.s.position.set(4.6 + o.u * 3 + Math.sin(t * 0.9 + o.p) * 0.5, 1.1 + o.u * 4, 2.2 - o.u * 4 + Math.cos(t * 0.7 + o.p) * 0.4); o.s.scale.setScalar(o.sz * (o.u < 0.05 ? o.u * 20 : 1)); }); });
  // ROLLERBLADE LANE stencils on the path
  const stT = ctex(c, 512, 128, (q, w, h) => { q.clearRect(0, 0, w, h); q.fillStyle = 'rgba(255,255,255,.75)'; q.font = `900 ${h * 0.5}px ${c.FONT}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('BLADE LANE  N3W PARKS', w / 2, h / 2); });
  [-4.6, 4.2].forEach((z, k) => floorDecal(c, g, 3.2, 0.8, stT, 10, z, {}, k ? 0 : PI));
};

// cut a rectangular hole in the set's floor slab: four slabs around it, tiles kept in register
function holeFloor(c, g, x1, x2, z1, z2) {
  const fl = find(g, (o) => o.geometry?.type === 'BoxGeometry' && o.geometry.parameters.width === 20 && o.geometry.parameters.depth === 16 && Math.abs(o.position.y + 0.05) < 1e-3)[0];
  if (!fl) return false;
  const mat = fl.material, rep = mat.userData.rep || 2.2; fl.visible = false;
  [[0, 20, -8, z1], [0, 20, z2, 8], [0, x1, z1, z2], [x2, 20, z1, z2]].forEach(([a, b, c1, d1]) => {
    const m = c.slab(b - a, 0.1, d1 - c1, mat, (a + b) / 2, -0.05, (c1 + d1) / 2), uv = m.geometry.attributes.uv, p = m.geometry.attributes.position, n = m.geometry.attributes.normal;
    for (let i = 0; i < uv.count; i++) if (Math.abs(n.getY(i)) > 0.5) uv.setXY(i, (p.getX(i) + m.position.x) / rep, (8 - (p.getZ(i) + m.position.z)) / rep);
    g.add(m);
  });
  return true;
}

// ======================================================================= serendipity
ROOM.serendipity = (c, r, g, X, K) => {
  const T = c.THREE;
  r.post = { ...r.post, bloom: 1.0, vig: 0.45 };
  // ILLUSION: a glass panel in the lobby floor over the lift shaft. Look down: every floor of the hotel at once, all the way down.
  const SH = 0.6, sz = (y) => SH * y, HX1 = 8.8, HX2 = 11.2, HZ1 = 0.4, HZ2 = 2.6, HW = HX2 - HX1, HD = HZ2 - HZ1, DEEP = 42, SX = (HX1 + HX2) / 2, SZ = (HZ1 + HZ2) / 2;
  if (holeFloor(c, g, HX1, HX2, HZ1, HZ2)) {
    const wallT = ctex(c, 256, 512, (q, w, h) => { q.fillStyle = '#3a3028'; q.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 16) for (let x = (y / 16) % 2 * 16; x < w; x += 32) { const v = 46 + Math.random() * 22 | 0; q.fillStyle = `rgb(${v + 8},${v},${v - 8})`; q.fillRect(x + 1, y + 1, 30, 14); } q.fillStyle = '#1a1612'; q.fillRect(0, h - 40, w, 40); q.fillStyle = '#c8a050'; q.fillRect(0, h - 44, w, 4); q.fillStyle = '#6a6a70'; q.fillRect(30, 0, 10, h); q.fillRect(w - 40, 0, 10, h); grain(q, w, h, 2000, 0.1); });
    wallT.wrapS = wallT.wrapT = T.RepeatWrapping; wallT.repeat.set(1, DEEP / 3);
    const sgeo = new T.BoxGeometry(HW, DEEP, HD); sgeo.translate(0, -DEEP / 2, 0); { const pa = sgeo.attributes.position; for (let i = 0; i < pa.count; i++) pa.setZ(i, pa.getZ(i) + sz(pa.getY(i))); sgeo.computeVertexNormals(); }
    const shaftM = new T.Mesh(sgeo, new T.MeshStandardMaterial({ map: wallT, side: T.BackSide, roughness: 0.9 })); shaftM.position.set(SX, 0, SZ); g.add(shaftM);
    // a landing every three metres: a lit floor number and the light under the doors, then a veil of dark, so it goes on and on
    const NL = c.MOBILE ? 9 : 13, veil = new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.13, depthWrite: false });
    const ringX = new T.InstancedMesh(new T.BoxGeometry(HW, 0.05, 0.05), hot(c, 0xffb860, 1.8), NL * 2), ringZ = new T.InstancedMesh(new T.BoxGeometry(0.05, 0.05, HD), hot(c, 0xffb860, 1.8), NL * 2), rm4 = new T.Matrix4(); g.add(ringX); g.add(ringZ);
    for (let k = 0; k < NL; k++) {
      [0, 1].forEach((j) => { rm4.makeTranslation(SX, -0.6 - k * 3, (j ? HZ1 + 0.03 : HZ2 - 0.03) + sz(-0.6 - k * 3)); ringX.setMatrixAt(k * 2 + j, rm4); rm4.makeTranslation(j ? HX1 + 0.03 : HX2 - 0.03, -0.6 - k * 3, SZ + sz(-0.6 - k * 3)); ringZ.setMatrixAt(k * 2 + j, rm4); });
      const y = -1.6 - k * 3, f = 22 - k;
      const n = c.sign(String(f), { w: 0.36, h: 0.3, bg: '#1a0e06', fg: '#ffcc66', font: c.SERIF, weight: 900, glow: 12 }); n.position.set(SX, y + 0.5, HZ1 + 0.01 + sz(y + 0.5)); n.material.fog = true; g.add(n);
      const gap = new T.Mesh(new T.PlaneGeometry(HW * 0.6, 0.05), hot(c, 0xffd090, 2)); gap.position.set(SX, y - 0.98, HZ1 + 0.01 + sz(y - 0.98)); g.add(gap);
      const v = new T.Mesh(new T.PlaneGeometry(HW, HD), veil); v.rotation.x = -H; v.position.set(SX, y - 1.6, SZ + sz(y - 1.6)); g.add(v);
    }
    // a car running up and down the shaft with its lamp on top, and its cables
    const car = new T.Group(); g.add(car); car.add(c.slab(HW * 0.8, 2.4, HD * 0.8, K.std(0x2a1a10, { metalness: 0.5, roughness: 0.4 }), 0, -1.2, 0));
    const lamp = new T.Mesh(new T.PlaneGeometry(HW * 0.5, HD * 0.4), hot(c, 0xffe2b0, 2.2)); lamp.rotation.x = -H; lamp.position.y = 0.02; car.add(lamp); glow(c, K, car, 0, 0.3, 0, 1.6, 'rgba(255,220,170,.6)');
    [-0.2, 0.2].forEach((dx) => { const cb = c.slab(0.02, DEEP * Math.hypot(1, SH), 0.02, K.std(0x111111), SX + dx, -DEEP / 2, SZ + sz(-DEEP / 2)); cb.rotation.x = -Math.atan(SH); g.add(cb); });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const cy = -27 + Math.sin(t * 0.18) * 13; car.position.set(SX, cy, SZ + sz(cy)); });
    // the glass and its brass frame
    const glass = new T.Mesh(new T.PlaneGeometry(HW, HD), addv(c, 0x8aa0b8, 0.35, ctex(c, 256, 256, (q, w, h) => { q.fillStyle = '#000'; q.fillRect(0, 0, w, h); q.strokeStyle = 'rgba(255,255,255,.5)'; [[30, 18], [70, 8], [150, 26], [190, 10]].forEach(([x, lw]) => { q.lineWidth = lw; q.beginPath(); q.moveTo(x, 0); q.lineTo(x + 120, h); q.stroke(); }); }))); glass.rotation.x = -H; glass.position.set(SX, 0.004, SZ); g.add(glass);
    const brass = K.std(0xd8b048, { metalness: 1, roughness: 0.25 });
    g.add(c.slab(HW + 0.24, 0.03, 0.12, brass, SX, 0.015, HZ1 - 0.06)); g.add(c.slab(HW + 0.24, 0.03, 0.12, brass, SX, 0.015, HZ2 + 0.06)); g.add(c.slab(0.12, 0.03, HD, brass, HX1 - 0.06, 0.015, SZ)); g.add(c.slab(0.12, 0.03, HD, brass, HX2 + 0.06, 0.015, SZ));
    c.clickable(glass, () => { c.sound.lift?.(); c.egg('serendipity_shaft', 'Every floor of the hotel at once, all the way down, and one car that never stops on yours. If you both look into the shaft at the same time, MLow says that counts as meeting.'); }, 'Glass in the floor');
  }
  // the ceiling: gilt coffers, cream panels, a warm cove of light all round
  const gilt = K.std(0xd8b048, { metalness: 1, roughness: 0.3 }), panT = ctex(c, 256, 256, (q, w, h) => { q.fillStyle = '#e8dcc0'; q.fillRect(0, 0, w, h); q.strokeStyle = '#b8903a'; q.lineWidth = 6; q.strokeRect(14, 14, w - 28, h - 28); q.lineWidth = 3; q.beginPath(); q.arc(w / 2, h / 2, 60, 0, 7); q.stroke(); for (let k = 0; k < 16; k++) { const a = k / 16 * PI * 2; q.beginPath(); q.moveTo(w / 2 + Math.cos(a) * 66, h / 2 + Math.sin(a) * 66); q.lineTo(w / 2 + Math.cos(a) * 96, h / 2 + Math.sin(a) * 96); q.stroke(); } K.eyeFlower(q, w / 2, h / 2, 40, '#f8eed8', '#c8a050'); grain(q, w, h, 1200, 0.06); });
  const pan = new T.InstancedMesh(new T.PlaneGeometry(3.1, 3.1), new T.MeshBasicMaterial({ map: panT, color: 0x9a9080 }), 20); const m4 = new T.Matrix4(), rx = new T.Matrix4().makeRotationX(H); let pi = 0;
  for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) { m4.makeTranslation(2 + i * 4, 5.97, -6 + j * 4).multiply(rx); pan.setMatrixAt(pi++, m4); } g.add(pan);
  for (let i = 0; i <= 5; i++) g.add(c.slab(0.22, 0.26, 16, gilt, i * 4, 5.86, 0)); for (let j = 0; j <= 4; j++) g.add(c.slab(20, 0.26, 0.22, gilt, 10, 5.86, -8 + j * 4));
  [[10, 7.7, 19.4, 0.12], [0.3, 0, 0.12, 15.4], [19.7, 0, 0.12, 15.4]].forEach(([x, z, w, d]) => { const s = c.slab(w, 0.06, d, hot(c, 0xffa850, 1.05), x, 5.55, z); g.add(s); });
  // a warm pool under each chandelier
  [[10, 1.0], [5.0, -2.4], [15.0, -2.4]].forEach(([x, z]) => { glow(c, K, g, x, 4.3, z, 3.2, 'rgba(255,214,150,.35)'); cone(c, g, x, 4.2, z, 0.5, 2.6, 4.2, 0xffd8a0, 0.035); });
  // the compass rose inlaid round the clock
  const roseT = ctex(c, 1024, 1024, (q, w, h) => { const cx = w / 2, R = w / 2 - 4; q.clearRect(0, 0, w, h); q.fillStyle = '#2a1a10'; q.beginPath(); q.arc(cx, cx, R, 0, 7); q.fill(); q.strokeStyle = '#d8b048'; q.lineWidth = 14; q.beginPath(); q.arc(cx, cx, R - 10, 0, 7); q.stroke(); q.lineWidth = 4; q.beginPath(); q.arc(cx, cx, R * 0.7, 0, 7); q.stroke(); for (let k = 0; k < 16; k++) { const a = k / 16 * PI * 2, L = k % 4 === 0 ? R * 0.92 : k % 2 ? R * 0.5 : R * 0.7; q.fillStyle = k % 2 ? '#c8b89a' : '#d8b048'; q.beginPath(); q.moveTo(cx + Math.cos(a) * L, cx + Math.sin(a) * L); q.lineTo(cx + Math.cos(a + 0.18) * R * 0.18, cx + Math.sin(a + 0.18) * R * 0.18); q.lineTo(cx + Math.cos(a - 0.18) * R * 0.18, cx + Math.sin(a - 0.18) * R * 0.18); q.closePath(); q.fill(); } K.eyeFlower(q, cx, cx, R * 0.16); q.fillStyle = '#d8b048'; q.font = `900 ${R * 0.09}px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('MEET ME HERE', cx, cx + R * 0.83); q.fillText('PARK AVE.', cx, cx - R * 0.77); });
  floorDecal(c, g, 3.4, 3.4, roseT, 10, -1.3, { metalness: 0.5, roughness: 0.3 });
  // the red runner along the walk from door to door
  const runT = ctex(c, 1024, 128, (q, w, h) => { q.fillStyle = '#7a0f1e'; q.fillRect(0, 0, w, h); q.fillStyle = '#d8b048'; q.fillRect(0, 10, w, 6); q.fillRect(0, h - 16, w, 6); for (let x = 30; x < w; x += 60) { q.save(); q.translate(x, h / 2); q.rotate(PI / 4); q.fillRect(-10, -10, 20, 20); q.restore(); } grain(q, w, h, 3000, 0.08); });
  floorDecal(c, g, 16.8, 1.3, runT, 10, 3.9, { roughness: 1, transparent: false });
  // hall lanterns over the lifts, and they light when a car is near
  const lant = [7.8, 12.2].map((x) => { const m = new T.Mesh(new T.CircleGeometry(0.16, 24), hot(c, 0xffb040, 2.2)); m.position.set(x, 3.68, -5.56); g.add(m); const ring = new T.Mesh(new T.TorusGeometry(0.17, 0.03, 8, 24), gilt); ring.position.copy(m.position); g.add(ring); return { m, s: glow(c, K, g, x, 3.68, -5.5, 0.9, 'rgba(255,190,90,.7)') }; });
  const LON = new T.Color(0xffb040).multiplyScalar(2.2), LOFF = new T.Color(0xffb040).multiplyScalar(0.25);
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; lant.forEach((o, k) => { const on = Math.sin(t * 0.5 + k * 2) > 0.4; o.s.visible = on; o.m.material.color.copy(on ? LON : LOFF); }); });
  // warm dust turning under the chandeliers
  motes(c, K, r, g, 160, 2, 18, 0.5, 5, -6, 6, 'rgba(255,230,180,.9)', 0.035, 0.55);
  // a tall arrangement of white roses on a gilt stand by the sofa
  const stand = new T.Group(); stand.position.set(6.6, 0, -4.9); g.add(stand); stand.add(new T.Mesh(new T.CylinderGeometry(0.22, 0.3, 1.0, 20), gilt).translateY(0.5)); stand.add(new T.Mesh(new T.CylinderGeometry(0.2, 0.14, 0.4, 20), K.std(0xf8f4ec, { roughness: 0.2 })).translateY(1.2));
  const rose = new T.InstancedMesh(new T.IcosahedronGeometry(0.08, 0), K.std(0xfff4f4, { roughness: 0.7 }), 40); for (let k = 0; k < 40; k++) { const a = k * 2.4, rr = 0.1 + (k % 7) * 0.05; m4.makeTranslation(Math.cos(a) * rr, 1.45 + (k % 5) * 0.09 + Math.random() * 0.1, Math.sin(a) * rr); rose.setMatrixAt(k, m4); } stand.add(rose); c.post(X(6.6), -4.9, 0.35);
};

// ======================================================================= bigbusiness
ROOM.bigbusiness = (c, r, g, X, K) => {
  const T = c.THREE, MZ = -0.8;
  r.post = { ...r.post, bloom: 1.05, vig: 0.4 };
  // everything new is made twice, once each side of the glassless mirror, so the reflection keeps its secret
  const both = (f) => [1, -1].forEach((s) => f(s, (z) => MZ + s * z));
  // ILLUSION: a cafe wall of pink and black tiles on the partition. Every row is dead level; every other row looks like a wedge.
  const cafe = ctex(c, 1024, 586, (q, w, h) => {
    const cols = 20, tw = w / cols, rows = 11, th = h / rows, shift = [0, 0.25, 0.5, 0.25];
    q.fillStyle = '#8a8088'; q.fillRect(0, 0, w, h);
    for (let j = 0; j < rows; j++) { const sx = shift[j % 4] * tw * 2; for (let i = -2; i < cols + 2; i++) { q.fillStyle = i % 2 ? '#16101a' : '#f6c8d6'; q.fillRect(i * tw + sx, j * th + 1.6, tw, th - 3.2); } }
    q.globalAlpha = 0.07; grain(q, w, h, 2000, 1); q.globalAlpha = 1;
  });
  const tileM = new T.MeshStandardMaterial({ map: cafe, roughness: 0.25, metalness: 0.05 });
  [[2.8], [17.2]].forEach(([x]) => both((s, Z) => { const m = new T.Mesh(new T.PlaneGeometry(5.6, 3.2), tileM); m.position.set(x, 1.6, Z(0.103)); m.rotation.y = s > 0 ? 0 : PI; g.add(m); if (s > 0) c.clickable(m, () => { c.sound.tick(); c.egg('bigbusiness_tiles', 'Every row of tiles in Suite 1111 is dead level. Every other row looks like a wedge, like two sisters who look nothing alike and are the same. MLow tiled it twice and used a spirit level both times.'); }, 'Pink and black tiles'); }));
  // Hollywood bulbs round the vanity mirrors, hot enough to bloom
  const bulbG = new T.SphereGeometry(0.045, 10, 8), bulbM = hot(c, 0xfff0d8, 2.6);
  both((s, Z) => { for (let k = 0; k < 11; k++) { const a = PI * (0.0 + k / 10), b = new T.Mesh(bulbG, bulbM); b.position.set(3.0 + Math.cos(a) * 0.62, 1.55 + Math.sin(a) * 0.82, Z(0.2)); g.add(b); } glow(c, K, g, 3.0, 2.1, Z(0.3), 2.0, 'rgba(255,236,210,.45)'); });
  // perfume bottles on each vanity, pink, amber, violet glass
  const glassM = [0xff6aa8, 0xffb040, 0x9a6aff, 0x6ad8ff].map((col) => new T.MeshPhysicalMaterial({ color: col, transparent: true, opacity: 0.6, roughness: 0.05, clearcoat: 1 }));
  const bottle = new T.LatheGeometry([[0, 0], [0.05, 0], [0.055, 0.02], [0.05, 0.1], [0.02, 0.12], [0.015, 0.16], [0.03, 0.17], [0, 0.19]].map(([x, y]) => new T.Vector2(x, y)), 14);
  both((s, Z) => [2.55, 2.75, 3.25, 3.45].forEach((x, k) => { const b = new T.Mesh(bottle, glassM[k]); b.position.set(x, 0.95, Z(0.42 + (k % 2) * 0.1)); b.scale.setScalar(0.9 + (k % 3) * 0.2); g.add(b); }));
  // the neon over the frame, and a pink cove of light round the ceiling
  const neon = c.sign('N3W LADIES LOUNGE', { w: 3.6, h: 0.36, bg: '#2a0a1c', fg: '#ff8ac0', font: c.SERIF, weight: 900, glow: 24, border: '#d8b048' }); neon.material.color.setScalar(1.7); neon.position.set(10, 3.0, MZ + 0.112); g.add(neon);
  [[10, 7.7, 19.4, 0.1], [0.3, 0, 0.1, 15.4], [19.7, 0, 0.1, 15.4], [10, -7.7, 19.4, 0.1]].forEach(([x, z, w, d]) => g.add(c.slab(w, 0.06, d, hot(c, 0xff7ab0, 1.5), x, 5.6, z)));
  const gilt = K.std(0xd8b048, { metalness: 1, roughness: 0.3 });
  [3.4, 6.8, 10.2, 13.6, 17].forEach((x) => g.add(c.slab(0.16, 0.12, 15.6, gilt, x, 5.92, 0)));
  // a round pink rug under each set of ottomans, a fringed lamp glowing on a side table
  const rugT = ctex(c, 512, 512, (q, w, h) => { const cx = w / 2; q.clearRect(0, 0, w, h); q.fillStyle = '#e88aa8'; q.beginPath(); q.arc(cx, cx, cx - 4, 0, 7); q.fill(); q.strokeStyle = '#f8e0e8'; q.lineWidth = 10; for (let k = 1; k < 5; k++) { q.beginPath(); q.arc(cx, cx, cx * k / 5, 0, 7); q.stroke(); } q.strokeStyle = '#d8b048'; q.lineWidth = 6; q.beginPath(); q.arc(cx, cx, cx - 12, 0, 7); q.stroke(); K.eyeFlower(q, cx, cx, cx * 0.18); grain(q, w, h, 3000, 0.07); });
  both((s, Z) => floorDecal(c, g, 4.4, 4.4, rugT, 10, Z(2.0), { roughness: 1 }));
  both((s, Z) => [6.4, 13.6].forEach((x) => { const o = new T.Group(); o.position.set(x, 0, Z(3.4)); g.add(o); o.add(new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 0.04, 20), gilt).translateY(0.62)); o.add(new T.Mesh(new T.CylinderGeometry(0.03, 0.05, 0.62, 10), gilt).translateY(0.31)); o.add(new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.4, 8), gilt).translateY(0.84)); const sh = new T.Mesh(new T.CylinderGeometry(0.12, 0.22, 0.26, 18, 1, true), hot(c, 0xff8ab8, 1.2, { side: T.DoubleSide })); sh.position.y = 1.12; o.add(sh); glow(c, K, o, 0, 1.1, 0, 1.4, 'rgba(255,150,200,.5)'); c.post(X(x), Z(3.4), 0.3); }));
  // warm pools under the chandeliers, and a sparkle of powder in the air
  both((s, Z) => [10, 4].forEach((x) => glow(c, K, g, x, 4.2, Z(3.0), 2.6, 'rgba(255,220,200,.35)')));
  motes(c, K, r, g, 140, 1, 19, 0.5, 4.5, MZ + 0.4, 7.5, 'rgba(255,210,230,.9)', 0.03, 0.6);
};

// a beam whose thickness grows with distance from the eye E, so it keeps one width on screen from E
function eyeBeam(T, E, p0, p1, half, dRef, bAx, cAx) {
  const v = [], f0 = p0.distanceTo(E) / dRef, f1 = p1.distanceTo(E) / dRef;
  [[p0, f0], [p1, f1]].forEach(([p, f]) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sb, sc]) => v.push(p.clone().addScaledVector(bAx, sb * half * f).addScaledVector(cAx, sc * half * f))));
  const F = [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]], pos = [];
  F.forEach(([a, b, c2, d]) => [a, b, c2, a, c2, d].forEach((i) => pos.push(v[i].x, v[i].y, v[i].z)));
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals(); return geo;
}

// ======================================================================= hudsucker
ROOM.hudsucker = (c, r, g, X, K) => {
  const T = c.THREE;
  r.post = { ...r.post, bloom: 1.15, vig: 0.5 };
  // ILLUSION: a Penrose triangle in gold over the president's desk. Three straight bars, open at one corner;
  // from the brass mark in the walk the open corner closes and the triangle is impossible.
  const E = new T.Vector3(14, 1.62, 3.8), A = new T.Vector3(16.5, 4.12, 1.3), k = 0.55, dlt = E.clone().sub(A).multiplyScalar(k);
  const B = A.clone().add(new T.Vector3(dlt.x, 0, 0)), C = B.clone().add(new T.Vector3(0, dlt.y, 0)), D = C.clone().add(new T.Vector3(0, 0, dlt.z));
  const dRef = A.distanceTo(E), hw = 0.11, ax = new T.Vector3(1, 0, 0), ay = new T.Vector3(0, 1, 0), az = new T.Vector3(0, 0, 1);
  const goldM = new T.MeshStandardMaterial({ color: 0xe0b850, metalness: 1, roughness: 0.22, emissive: 0x2a1a04, side: T.DoubleSide });
  const ext = (p, q, s) => p.clone().addScaledVector(q.clone().sub(p).normalize(), -s);
  const tri = new T.Group(); g.add(tri);
  const fB = B.distanceTo(E) / dRef * hw, fC = C.distanceTo(E) / dRef * hw;
  tri.add(new T.Mesh(eyeBeam(T, E, A, ext(B, A, fB), hw, dRef, ay, az), goldM));
  tri.add(new T.Mesh(eyeBeam(T, E, ext(B, C, fB), ext(C, B, fC), hw, dRef, ax, az), goldM));
  tri.add(new T.Mesh(eyeBeam(T, E, ext(C, D, fC), D, hw, dRef, ax, ay), goldM));
  [A, B].forEach((p) => g.add(c.slab(0.01, 6 - p.y, 0.01, K.std(0x111111), p.x, (6 + p.y) / 2, p.z)));
  const plq = c.sign('A CIRCLE, A TRIANGLE\nFOR KIDS.  MLow', { w: 0.9, h: 0.28, bg: '#14141a', fg: '#e0b850', font: c.SERIF, weight: 800, border: '#c8a050' }); plq.position.set(17.7, 1.25, 0.0); plq.rotation.y = -0.9; g.add(plq);
  const m = mark(c, K, g, E.x, E.z, 'STAND HERE');
  [m, ...tri.children].forEach((o) => c.clickable(o, () => { c.sound.ding?.(); c.egg('hudsucker_penrose', 'Three gold bars and a gap. Stand on the brass and the gap closes into a triangle that cannot exist. The board approved it in one meeting. MLow drew it on the back of an envelope.'); }, 'A gold sculpture'));
  // the ceiling: a deco sunburst in gold leaf, glowing faintly over the long table
  const sunT = ctex(c, 1024, 768, (q, w, h) => { q.fillStyle = '#0c0c10'; q.fillRect(0, 0, w, h); const cx = w / 2, cy = h / 2; q.strokeStyle = '#d8b048'; for (let k = 0; k < 72; k++) { const a = k / 72 * PI * 2; q.lineWidth = k % 3 ? 2 : 5; q.beginPath(); q.moveTo(cx + Math.cos(a) * 70, cy + Math.sin(a) * 70); q.lineTo(cx + Math.cos(a) * 900, cy + Math.sin(a) * 900); q.stroke(); } [70, 140, 220, 320].forEach((rr, k) => { q.lineWidth = 6 - k; q.beginPath(); q.arc(cx, cy, rr, 0, 7); q.stroke(); }); q.lineWidth = 8; q.strokeRect(10, 10, w - 20, h - 20); K.eyeFlower(q, cx, cy, 60, '#f8e8b8', '#d8b048'); });
  const sun = plane(c, 15, 11, sunT, { transparent: false, color: new T.Color(1.25, 1.25, 1.25), toneMapped: false }, true); sun.rotation.x = H; sun.position.set(10, 5.97, -1.6); g.add(sun);
  // a runner under the boardroom table
  const runT = ctex(c, 256, 1024, (q, w, h) => { q.fillStyle = '#16161c'; q.fillRect(0, 0, w, h); q.strokeStyle = '#c8a050'; q.lineWidth = 6; q.strokeRect(12, 12, w - 24, h - 24); for (let y = 60; y < h; y += 110) { q.beginPath(); q.moveTo(w / 2, y - 40); q.lineTo(w / 2 + 50, y); q.lineTo(w / 2, y + 40); q.lineTo(w / 2 - 50, y); q.closePath(); q.stroke(); q.beginPath(); q.moveTo(30, y); q.lineTo(w - 30, y); q.stroke(); } grain(q, w, h, 2000, 0.06); });
  floorDecal(c, g, 3.6, 11, runT, 10, -1.6, { roughness: 0.9, transparent: false });
  // the big clock gets a halo; deco torchères throw light up the walls
  glow(c, K, g, 0.3, 4.3, -3.2, 4.2, 'rgba(255,220,150,.4)');
  [[0.9, 7.1], [19.1, 7.1], [3.2, -7.3], [16.8, -7.3]].forEach(([x, z]) => { const o = new T.Group(); o.position.set(x, 0, z); g.add(o); o.add(new T.Mesh(new T.CylinderGeometry(0.03, 0.05, 1.8, 10), K.std(0xc8a050, { metalness: 1, roughness: 0.3 })).translateY(0.9)); const bowl = new T.Mesh(new T.CylinderGeometry(0.32, 0.08, 0.22, 20, 1, true), K.std(0xc8a050, { metalness: 1, roughness: 0.3, side: T.DoubleSide })); bowl.position.y = 1.9; o.add(bowl); const lit = new T.Mesh(new T.CircleGeometry(0.3, 20), hot(c, 0xffe0b0, 2.4)); lit.rotation.x = -H; lit.position.y = 1.99; o.add(lit); const up = cone(c, o, 0, 6.0, 0, 1.4, 0.3, 4.0, 0xffe0b0, 0.07); up.position.y = 4.0; glow(c, K, o, 0, 2.05, 0, 1.4, 'rgba(255,224,170,.5)'); c.post(X(x), z, 0.3); });
  // the mail goes up by tube: a glass pneumatic pipe along the south wall, capsules shooting through it
  const tube = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 19.2, 14, 1, true), new T.MeshPhysicalMaterial({ color: 0xd8e8f0, transparent: true, opacity: 0.25, roughness: 0.05, side: T.DoubleSide, depthWrite: false })); tube.rotation.z = H; tube.position.set(10, 4.2, 7.7); g.add(tube);
  for (let x = 1; x < 20; x += 3) g.add(c.slab(0.06, 0.24, 0.12, K.std(0xc8a050, { metalness: 1 }), x, 4.2, 7.8));
  const caps = [0, 1].map(() => { const m2 = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 0.3, 12), K.std(0xd8b048, { metalness: 1, roughness: 0.2 })); m2.rotation.z = H; m2.position.set(-5, 4.2, 7.7); g.add(m2); return m2; });
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; caps.forEach((m2, k) => { const u = (t * 0.35 + k * 0.5) % 1.6; m2.visible = u < 1; m2.position.x = 0.5 + u * 19; }); });
  // New Year's Eve: confetti, all evening
  const NC = c.MOBILE ? 60 : 140, conf = new T.InstancedMesh(new T.PlaneGeometry(0.05, 0.03), new T.MeshBasicMaterial({ side: T.DoubleSide }), NC); conf.frustumCulled = false; g.add(conf);
  const CC = ['#ff4fa3', '#22d3ee', '#f5c542', '#ffffff', '#ff7a1a', '#3b82f6'].map((h) => new T.Color(h)), cs = [];
  for (let i = 0; i < NC; i++) { conf.setColorAt(i, CC[i % CC.length]); cs.push({ x: 1 + Math.random() * 18, y: Math.random() * 6, z: -6 + Math.random() * 13, v: 0.3 + Math.random() * 0.4, p: Math.random() * 7 }); }
  const m4 = new T.Matrix4(), q4 = new T.Quaternion(), e4 = new T.Euler(), v4 = new T.Vector3(), one = new T.Vector3(1, 1, 1);
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const sp = c.TIME?.target === 0.0005 ? 0 : 1; cs.forEach((o, i) => { o.y -= dt * o.v * sp; if (o.y < 0.02) o.y = 6; v4.set(o.x + Math.sin(t * 1.1 + o.p) * 0.3, o.y, o.z + Math.cos(t * 0.9 + o.p) * 0.3); e4.set(t * 3 + o.p, t * 2 + o.p, 0); q4.setFromEuler(e4); m4.compose(v4, q4, one); conf.setMatrixAt(i, m4); }); conf.instanceMatrix.needsUpdate = true; });
  motes(c, K, r, g, 120, 2, 18, 0.5, 5, -6, 6, 'rgba(255,230,190,.9)', 0.03, 0.45);
};

// ======================================================================= bobbyfischer
ROOM.bobbyfischer = (c, r, g, X, K) => {
  const T = c.THREE;
  r.post = { ...r.post, bloom: 0.7, vig: 0.35 };
  // ILLUSION: Adelson's checker shadow, painted on the paving. Square A and square B are exactly the same grey.
  const BX = 7.3, BZ = -0.2, BS = 2.4, N = 5;
  const boardT = ctex(c, 1024, 1024, (q, w, h) => {
    const s = w / N; for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { q.fillStyle = (i + j) % 2 ? '#7a7a7a' : '#d8d8d8'; q.fillRect(i * s, j * s, s, s); }
    q.save(); q.globalCompositeOperation = 'multiply'; q.filter = `blur(${w * 0.018}px)`; q.fillStyle = 'rgb(144,144,144)';
    q.beginPath(); q.moveTo(w * 0.86, h * 0.02); q.lineTo(w * 0.98, h * 0.2); q.lineTo(w * 0.34, h * 0.98); q.lineTo(w * 0.02, h * 0.98); q.lineTo(w * 0.02, h * 0.74); q.closePath(); q.fill(); q.restore();
    q.fillStyle = '#141414'; q.font = `900 ${s * 0.42}px ${c.FONT}`; q.textAlign = 'center'; q.textBaseline = 'middle';
    q.fillText('A', 0.5 * s, 1.5 * s); q.fillText('B', 2.5 * s, 2.5 * s);
    q.strokeStyle = '#f4f4f0'; q.lineWidth = w * 0.012; q.strokeRect(2, 2, w - 4, h - 4);
  });
  const board = floorDecal(c, g, BS, BS, boardT, BX, BZ, { transparent: false }, 0, 0.014); board.material = new T.MeshBasicMaterial({ map: boardT, polygonOffset: true, polygonOffsetFactor: -3 });
  // the pawn that throws the painted shadow, pink, ours
  const pawnG = new T.LatheGeometry([[0, 0], [0.42, 0], [0.42, 0.08], [0.3, 0.16], [0.2, 0.5], [0.15, 0.78], [0.26, 0.84], [0.14, 0.9], [0.24, 1.1], [0.2, 1.28], [0.08, 1.34], [0, 1.35]].map(([x, y]) => new T.Vector2(x, y)), 32);
  const pawn = new T.Mesh(pawnG, K.std(0xff6aa8, { roughness: 0.35 })); const ps = BS / N; pawn.position.set(BX + BS / 2 - ps * 0.6, 0, BZ - BS / 2 + ps * 0.6); g.add(pawn); c.post(X(pawn.position.x), pawn.position.z, 0.45);
  const proofT = ctex(c, 512, 512, (q, w, h) => { const s = w / N; q.fillStyle = '#5a5a5a'; q.fillRect(0, 0, w, h); q.clearRect(0 * s + 4, 1 * s + 4, s - 8, s - 8); q.clearRect(2 * s + 4, 2 * s + 4, s - 8, s - 8); });
  const proof = floorDecal(c, g, BS, BS, proofT, BX, BZ, { transparent: true }, 0, 0.02); proof.material = new T.MeshBasicMaterial({ map: proofT, transparent: true, depthWrite: false }); proof.visible = false; let pt = 0;
  const lbl = K.decal(2.4, 0.3, (q, w, h) => { q.fillStyle = 'rgba(250,250,240,.9)'; q.font = `700 ${h * 0.5}px ${c.MONO}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('A AND B ARE THE SAME GREY.  MLow', w / 2, h / 2); }, 128);
  lbl.rotation.x = -H; lbl.position.set(BX, 0.016, BZ + BS / 2 + 0.22); g.add(lbl);
  c.clickable(board, () => { proof.visible = true; pt = 4; c.sound.slap?.(); c.egg('bobbyfischer_squares', 'Square A and square B are the same grey, to the last drop of paint. The shadow makes one light and the board makes one dark. The hustler says that is how he plays: let your eyes lose first. MLow agrees.'); }, 'A chessboard on the paving');
  c.tick((t, dt, P, ri) => { if (pt > 0) { pt -= dt; if (pt <= 0) proof.visible = false; } });
  // granite on every stone table and stool
  const granT = ctex(c, 256, 256, (q, w, h) => { q.fillStyle = '#8a867e'; q.fillRect(0, 0, w, h); for (let k = 0; k < 7000; k++) { const v = Math.random(); q.fillStyle = v < 0.3 ? 'rgba(30,28,26,.6)' : v < 0.6 ? 'rgba(230,226,218,.6)' : 'rgba(150,120,110,.5)'; q.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2.5, 1 + Math.random() * 2.5); } });
  granT.wrapS = granT.wrapT = T.RepeatWrapping;
  const seen = new Set(); find(g, (o) => o.material?.color?.getHex?.() === 0x9a948a).forEach((o) => { if (seen.has(o.material)) return; seen.add(o.material); o.material.map = granT; o.material.color.set(0xe8e4dc); o.material.roughness = 0.45; o.material.needsUpdate = true; });
  // the park's hex pavers, laid over the whole square
  const hexT = ctex(c, 256, 222, (q, w, h) => { q.clearRect(0, 0, w, h); q.strokeStyle = 'rgba(40,36,30,.55)'; q.lineWidth = 3; const R = w / 6, hh = R * Math.sqrt(3) / 2; for (let j = -1; j < 5; j++) for (let i = -1; i < 5; i++) { const cx = i * R * 1.5, cy = j * hh * 2 + (i % 2 ? hh : 0); q.beginPath(); for (let k = 0; k < 6; k++) q.lineTo(cx + Math.cos(k * PI / 3) * R, cy + Math.sin(k * PI / 3) * R); q.closePath(); q.stroke(); } });
  hexT.wrapS = hexT.wrapT = T.RepeatWrapping; hexT.repeat.set(14, 12);
  floorDecal(c, g, 19.6, 15.6, hexT, 10, 0, { opacity: 0.8, roughness: 1 }, 0, 0.006);
  // autumn: plane trees in the corners, leaves falling all afternoon, leaves drifted against the benches
  const tall = new T.Group(); g.add(tall); c.tick((t, dt, P, ri) => { tall.visible = ri === r.i; });
  const bark = new T.MeshStandardMaterial({ color: 0x8a8070, roughness: 1 }), leafT = ctex(c, 512, 512, (q, w, h) => { q.clearRect(0, 0, w, h); for (let k = 0; k < 1400; k++) { const v = Math.random(); q.fillStyle = v < 0.4 ? '#e8902a' : v < 0.7 ? '#f5c542' : v < 0.85 ? '#c8502a' : '#8a6a2a'; q.beginPath(); q.ellipse(Math.random() * w, Math.random() * h, 6 + Math.random() * 9, 4 + Math.random() * 5, Math.random() * PI, 0, 7); q.fill(); } });
  const leafM = new T.MeshStandardMaterial({ map: leafT, alphaTest: 0.45, side: T.DoubleSide, roughness: 0.9 });
  [[0.9, 7.2], [19.1, 7.2], [3.1, -7.5], [16.9, -7.5]].forEach(([x, z]) => { const tr = new T.Mesh(new T.CylinderGeometry(0.22, 0.34, 6.2, 12), bark); tr.position.set(x, 3.1, z); tall.add(tr); c.post(X(x), z, 0.4); for (let k = 0; k < 6; k++) { const m2 = new T.Mesh(new T.PlaneGeometry(3.4 + (k % 3) * 0.6, 3.2), leafM); m2.rotation.set(-H + Math.sin(k * 2.1) * 0.6, k * 1.05, Math.cos(k * 1.7) * 0.4); m2.position.set(x + (x < 10 ? 1 : -1) * (0.6 + (k % 3) * 0.5), 5.2 + k * 0.3, z + (z < 0 ? 1 : -1) * (0.5 + (k % 2) * 0.8)); tall.add(m2); } });
  const NL = c.MOBILE ? 30 : 70, lfT = ctex(c, 32, 32, (q, w, h) => { q.clearRect(0, 0, w, h); q.fillStyle = '#ffffff'; q.beginPath(); q.ellipse(w / 2, h / 2, w * 0.45, h * 0.3, 0.5, 0, 7); q.fill(); });
  const lf = new T.InstancedMesh(new T.PlaneGeometry(0.12, 0.12), new T.MeshStandardMaterial({ map: lfT, alphaTest: 0.4, side: T.DoubleSide }), NL); lf.frustumCulled = false; g.add(lf);
  const LC = ['#e8902a', '#f5c542', '#c8502a', '#a87a2a'].map((h) => new T.Color(h)), ls = [];
  for (let i = 0; i < NL; i++) { lf.setColorAt(i, LC[i % 4]); ls.push({ x: Math.random() * 20, y: Math.random() * 6, z: -7 + Math.random() * 14, v: 0.3 + Math.random() * 0.3, p: Math.random() * 7 }); }
  const m4 = new T.Matrix4(), q4 = new T.Quaternion(), e4 = new T.Euler(), v4 = new T.Vector3(), one = new T.Vector3(1, 1, 1);
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; ls.forEach((o, i) => { o.y -= dt * o.v; if (o.y < 0.02) o.y = 6.2; v4.set(o.x + Math.sin(t * 0.8 + o.p) * 0.8, o.y, o.z + Math.cos(t * 0.6 + o.p) * 0.4); e4.set(t * 1.5 + o.p, t + o.p, Math.sin(t + o.p)); q4.setFromEuler(e4); m4.compose(v4, q4, one); lf.setMatrixAt(i, m4); }); lf.instanceMatrix.needsUpdate = true; });
  const litT = ctex(c, 512, 256, (q, w, h) => { q.clearRect(0, 0, w, h); for (let k = 0; k < 500; k++) { const v = Math.random(); q.fillStyle = v < 0.4 ? '#d8802a' : v < 0.7 ? '#e8b842' : '#a8502a'; q.beginPath(); const x = Math.random() * w, y = h * (0.5 + (Math.random() - 0.5) * Math.random()); q.ellipse(x, y, 5 + Math.random() * 6, 3 + Math.random() * 3, Math.random() * PI, 0, 7); q.fill(); } });
  [[10, -6.0, 8], [3.0, 6.6, 4], [17.0, 6.6, 4], [0.9, -3.0, 3]].forEach(([x, z, w], k) => floorDecal(c, g, w, 1.6, litT, x, z, { alphaTest: 0.4 }, k === 3 ? H : 0, 0.01));
  // the sun, low through the trees
  [[4.5, -2.0], [9.5, 1.0], [14.5, -3.5]].forEach(([x, z]) => shaft(c, g, x, 7, z, 1.8, 8.5, -0.7, 0.5, 0xfff0c8, 0.09));
  // a chess clock on every stone table, ticking, and a stencil for the hustlers
  [[4, -4.0], [10, -4.0], [16, -4.0], [4, 0.0], [16, 0.0]].forEach(([x, z]) => { const o = new T.Group(); o.position.set(x + 0.42, 0.8, z); g.add(o); o.add(c.slab(0.12, 0.1, 0.24, K.std(0x5a3a1e, { roughness: 0.4 }), 0, 0.05, 0)); [-0.06, 0.06].forEach((dz) => { const f = new T.Mesh(new T.CircleGeometry(0.04, 16), K.basic(0xf4f0e0)); f.position.set(-0.061, 0.06, dz); f.rotation.y = -H; o.add(f); }); });
  const stT = ctex(c, 512, 128, (q, w, h) => { q.clearRect(0, 0, w, h); q.fillStyle = 'rgba(255,255,250,.7)'; q.font = `900 ${h * 0.45}px ${c.FONT}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('HUSTLERS ONLY  N3W PARKS', w / 2, h / 2); });
  floorDecal(c, g, 3.0, 0.75, stT, 10, 3.6, {}, 0);
};

// a quad from four corners with its own uv square (0,0) (1,0) (1,1) (0,1)
function quad(T, a, b, c2, d) { const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute([...a, ...b, ...c2, ...d], 3)); geo.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2)); geo.setIndex([0, 1, 2, 0, 2, 3]); geo.computeVertexNormals(); return geo; }

// ======================================================================= eternal
ROOM.eternal = (c, r, g, X, K) => {
  const T = c.THREE;
  r.post = { ...r.post, bloom: 0.9, vig: 0.45 };
  // ILLUSION: a reverspective on the east wall, after Patrick Hughes. Two aisles of books that turn to follow you as you walk,
  // because they are painted backwards: the far end of each aisle, the window to the beach, is the part nearest your nose.
  const WX = 19.6, Dp = 0.95, Bh = 1.22, Th = 0.38, BY = 4.45;
  const shelfT = ctex(c, 512, 512, (q, w, h) => {
    q.fillStyle = '#2a1a10'; q.fillRect(0, 0, w, h);
    const rows = 5, cols = ['#7a1a1a', '#1a3a6a', '#c8a050', '#2a5a3a', '#e8dcc0', '#5a2a5a', '#d86a2a', '#1a1a1a', '#8ab0c8'];
    for (let rr = 0; rr < rows; rr++) { const u0 = (rr + 0.12) / rows * w, u1 = (rr + 0.92) / rows * w; let v = h; while (v > 4) { const bw = Math.max(2, 26 * Math.pow(v / h, 1.6)); q.fillStyle = cols[(Math.random() * cols.length) | 0]; q.fillRect(u0 + Math.random() * (u1 - u0) * 0.12, v - bw, (u1 - u0) * (0.75 + Math.random() * 0.2), bw - 1); v -= bw; } q.fillStyle = '#5a3a1e'; q.fillRect(rr / rows * w, 0, w * 0.035, h); }
    const gr = q.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(255,240,220,.25)'); q.fillStyle = gr; q.fillRect(0, 0, w, h);
  });
  const floorT = ctex(c, 256, 256, (q, w, h) => { q.fillStyle = '#8a5a34'; q.fillRect(0, 0, w, h); q.strokeStyle = '#4a2a14'; q.lineWidth = 3; for (let k = 1; k < 7; k++) { q.beginPath(); q.moveTo(k / 7 * w, 0); q.lineTo(k / 7 * w, h); q.stroke(); } for (let k = 1; k < 9; k++) { const y = h - h * (1 - 1 / (1 + k * 0.5)) * 1.3; q.beginPath(); q.moveTo(0, y); q.lineTo(w, y); q.stroke(); } const gr = q.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, 'rgba(0,0,0,.25)'); gr.addColorStop(1, 'rgba(255,240,220,.2)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); });
  const ceilT = ctex(c, 256, 256, (q, w, h) => { q.fillStyle = '#d8ccb8'; q.fillRect(0, 0, w, h); q.fillStyle = '#fff4c8'; for (let k = 1; k < 5; k++) { const y = h - h * (1 - 1 / (1 + k * 0.6)) * 1.25; q.fillRect(w * 0.42, y - 6, w * 0.16, 8); } });
  const winT = ctex(c, 256, 256, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9ab8d8'); gr.addColorStop(0.55, '#e8eef4'); gr.addColorStop(0.56, '#5a7a9a'); gr.addColorStop(0.7, '#8aa0b0'); gr.addColorStop(0.71, '#f4f4f0'); gr.addColorStop(1, '#e0e0dc'); q.fillStyle = gr; q.fillRect(0, 0, w, h); q.fillStyle = '#6a4a3a'; q.fillRect(w * 0.42, h * 0.78, w * 0.2, h * 0.06); q.fillStyle = '#f8f8f8'; q.fillRect(w * 0.43, h * 0.75, w * 0.18, h * 0.04); q.strokeStyle = '#3a2a1a'; q.lineWidth = 10; q.strokeRect(5, 5, w - 10, h - 10); q.fillStyle = '#3a2a1a'; q.font = `700 ${h * 0.08}px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('MONTAUK', w / 2, h * 0.2); for (let k = 0; k < 60; k++) { q.fillStyle = 'rgba(255,255,255,.8)'; q.beginPath(); q.arc(Math.random() * w, Math.random() * h, 1.5, 0, 7); q.fill(); } });
  const MB = (map) => new T.MeshBasicMaterial({ map, side: T.DoubleSide });
  const shelfM = MB(shelfT), floorM = MB(floorT), ceilM = MB(ceilT), winM = MB(winT), relief = new T.Group(); g.add(relief);
  [-4.6, -2.0].forEach((bz) => {
    const b = (y, z) => [WX, BY + y * Bh, bz + z * Bh], t = (y, z) => [WX - Dp, BY + y * Th, bz + z * Th];
    relief.add(new T.Mesh(quad(T, b(-1, -1), b(1, -1), t(1, -1), t(-1, -1)), shelfM));
    relief.add(new T.Mesh(quad(T, b(-1, 1), b(1, 1), t(1, 1), t(-1, 1)), shelfM));
    relief.add(new T.Mesh(quad(T, b(-1, -1), b(-1, 1), t(-1, 1), t(-1, -1)), floorM));
    relief.add(new T.Mesh(quad(T, b(1, -1), b(1, 1), t(1, 1), t(1, -1)), ceilM));
    relief.add(new T.Mesh(quad(T, t(-1, -1), t(-1, 1), t(1, 1), t(1, -1)), winM));
  });
  const frameM = K.std(0x3a2414, { roughness: 0.6 }); g.add(c.slab(0.08, 0.1, 5.4, frameM, WX - 0.02, BY - Bh - 0.05, -3.3)); g.add(c.slab(0.08, 0.1, 5.4, frameM, WX - 0.02, BY + Bh + 0.05, -3.3));
  relief.children.forEach((o) => c.clickable(o, () => { c.sound.whoosh?.(0.08, 0.6); c.egg('eternal_reverse', 'The aisles turn to follow you, the wrong way round. They are painted backwards: the far end, the window on the beach, is the bit nearest your nose. MLow says memory works the same way.'); }, 'Shelves on the wall'));
  // a Persian rug, piles of books on the floor, a string of bulbs along the south wall
  const rugT = ctex(c, 512, 384, (q, w, h) => { q.fillStyle = '#6a1a1a'; q.fillRect(0, 0, w, h); q.strokeStyle = '#d8b878'; q.lineWidth = 10; q.strokeRect(14, 14, w - 28, h - 28); q.strokeStyle = '#1a2a4a'; q.lineWidth = 16; q.strokeRect(36, 36, w - 72, h - 72); q.fillStyle = '#d8b878'; q.beginPath(); q.ellipse(w / 2, h / 2, w * 0.22, h * 0.24, 0, 0, 7); q.fill(); q.fillStyle = '#1a2a4a'; q.beginPath(); q.ellipse(w / 2, h / 2, w * 0.14, h * 0.15, 0, 0, 7); q.fill(); for (let k = 0; k < 40; k++) { q.fillStyle = k % 2 ? '#d8b878' : '#2a4a3a'; q.fillRect(60 + Math.random() * (w - 120), 60 + Math.random() * (h - 120), 8, 8); } grain(q, w, h, 4000, 0.1); });
  floorDecal(c, g, 3.2, 2.4, rugT, 5.8, -0.9, { roughness: 1, transparent: false });
  const bookC = [0x7a1a1a, 0x1a3a6a, 0xc8a050, 0x2a5a3a, 0xe8dcc0, 0x5a2a5a, 0xd86a2a], NB = 70, books = new T.InstancedMesh(new T.BoxGeometry(0.24, 0.05, 0.17), K.std(0xffffff, { roughness: 0.8 }), NB), m4 = new T.Matrix4(), q4 = new T.Quaternion(), e4 = new T.Euler(), v4 = new T.Vector3(), one = new T.Vector3(1, 1, 1), col = new T.Color();
  const piles = [[12.8, 5.9], [7.2, 6.6], [16.4, 6.0], [2.4, -6.6], [13.6, -6.4], [8.6, 3.0], [17.6, -0.6]];
  for (let k = 0; k < NB; k++) { const [px, pz] = piles[k % piles.length], lv = (k / piles.length) | 0; v4.set(px + Math.sin(k) * 0.03, 0.025 + lv * 0.05, pz + Math.cos(k * 3) * 0.03); e4.set(0, k * 0.7, 0); q4.setFromEuler(e4); m4.compose(v4, q4, one); books.setMatrixAt(k, m4); books.setColorAt(k, col.set(bookC[k % bookC.length])); }
  g.add(books);
  const bulbs = new T.InstancedMesh(new T.SphereGeometry(0.05, 8, 6), hot(c, 0xffd8a0, 2.6), 30), sag = (u) => 3.55 - Math.sin(((u * 5) % 1) * PI) * 0.25;
  for (let k = 0; k < 30; k++) { const u = k / 29; m4.makeTranslation(0.6 + u * 18.8, sag(u), 7.8); bulbs.setMatrixAt(k, m4); } g.add(bulbs);
  { const pts = []; for (let k = 0; k <= 100; k++) { const u = k / 100; pts.push(new T.Vector3(0.6 + u * 18.8, sag(u) + 0.04, 7.82)); } g.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x222222 }))); }
  // the lamps over the shop throw warm cones; the memory goes up from the bed in pages
  [[6.0, -1.0], [14.0, 1.0]].forEach(([x, z]) => { glow(c, K, g, x, 3.45, z, 1.6, 'rgba(255,214,150,.55)'); cone(c, g, x, 3.4, z, 0.25, 1.8, 3.4, 0xffd8a0, 0.05); });
  const NP = c.MOBILE ? 14 : 30, pageT = ctex(c, 64, 80, (q, w, h) => { q.fillStyle = '#f4f0e4'; q.fillRect(0, 0, w, h); q.fillStyle = '#8a8478'; for (let y = 10; y < h - 6; y += 6) q.fillRect(6, y, w - 12 - Math.random() * 14, 2); });
  const pages = new T.InstancedMesh(new T.PlaneGeometry(0.18, 0.23), new T.MeshBasicMaterial({ map: pageT, side: T.DoubleSide, transparent: true }), NP); pages.frustumCulled = false; g.add(pages);
  const ps = Array.from({ length: NP }, () => ({ u: Math.random(), p: Math.random() * 7 })), sc = new T.Vector3();
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; ps.forEach((o, k) => { o.u += dt * 0.06; if (o.u > 1) o.u -= 1; const s = o.u < 0.1 ? o.u * 10 : o.u > 0.8 ? (1 - o.u) * 5 : 1; v4.set(11.8 + Math.sin(t * 0.5 + o.p) * (0.4 + o.u * 1.5), 0.7 + o.u * 5, -1.0 + Math.cos(t * 0.4 + o.p) * (0.4 + o.u * 1.2)); e4.set(t + o.p, t * 0.7 + o.p, 0.3); q4.setFromEuler(e4); sc.setScalar(Math.max(0.001, s)); m4.compose(v4, q4, sc); pages.setMatrixAt(k, m4); }); pages.instanceMatrix.needsUpdate = true; });
  // a chalkboard of staff picks, and Clementine's hair, in order
  const board = c.sign('STAFF PICKS\nON FORGETTING\n\nBLUE RUIN\nRED MENACE\nAGENT ORANGE\nYELLOW FEVER\n\nCOUNTED BY MLow', { w: 0.8, h: 1.2, bg: '#1a2420', fg: '#f4f0e0', font: c.MONO, weight: 600, border: '#6a4a2a' });
  const af = new T.Group(); af.position.set(16.8, 0, 3.0); af.rotation.y = -0.6; g.add(af); board.position.set(0, 0.85, 0.12); board.rotation.x = -0.15; af.add(board); const b2 = board.clone(); b2.position.z = -0.12; b2.rotation.set(0.15, PI, 0); af.add(b2); c.post(X(16.8), 3.0, 0.4);
  // cold winter light at the windows, warm dust over the counter
  [[3.0, -3.0], [9.0, 0.0], [15.0, -3.0]].forEach(([x, z]) => shaft(c, g, x, 6, z, 1.6, 7, 0.5, 0.45, 0xd8e8ff, 0.07));
  motes(c, K, r, g, 160, 1, 19, 0.5, 5, -6, 6, 'rgba(255,240,220,.9)', 0.03, 0.5);
};

// ======================================================================= mmmystery
ROOM.mmmystery = (c, r, g, X, K) => {
  const T = c.THREE;
  r.post = { ...r.post, bloom: 1.15, vig: 0.6 };
  // ILLUSION: Pepper's ghost, the old theatre trick. A sheet of glass at forty five degrees and an actress lit in a cupboard in the
  // wings. From the seats she floats behind the glass; from the side she is a woman in a cupboard.
  const G = new T.Vector3(10, 1.25, -3.2), RY = -PI / 4, nrm = new T.Vector3(Math.sin(RY), 0, Math.cos(RY)), tan = new T.Vector3(Math.cos(RY), 0, -Math.sin(RY));
  const pane = new T.Mesh(new T.PlaneGeometry(2.0, 2.4), addv(c, 0x8aa0b8, 0.18, ctex(c, 128, 128, (q, w, h) => { q.fillStyle = '#000'; q.fillRect(0, 0, w, h); q.strokeStyle = 'rgba(255,255,255,.6)'; q.lineWidth = 6; q.beginPath(); q.moveTo(20, 0); q.lineTo(80, h); q.stroke(); q.lineWidth = 2; q.beginPath(); q.moveTo(50, 0); q.lineTo(110, h); q.stroke(); }))); pane.position.copy(G); pane.rotation.y = RY; g.add(pane);
  const frm = K.std(0x111111, { metalness: 0.6, roughness: 0.4 }); [-1.02, 1.02].forEach((s) => { const p = c.slab(0.05, 2.5, 0.05, frm, G.x + tan.x * s, 1.25, G.z + tan.z * s); g.add(p); }); { const tp = c.slab(2.1, 0.05, 0.05, frm, G.x, 2.48, G.z); tp.rotation.y = RY; g.add(tp); }
  c.post(X(G.x), G.z, 0.75);
  // the cupboard in the wings, open toward the glass, with the actress lit inside
  const cb = new T.Group(); cb.position.set(8.5, 0, -3.2); g.add(cb); const blk = K.std(0x0c0a0a, { roughness: 0.9 });
  cb.add(c.slab(0.06, 2.3, 1.1, blk, -0.45, 1.15, 0)); cb.add(c.slab(0.9, 0.06, 1.1, blk, 0, 2.3, 0)); cb.add(c.slab(0.9, 2.3, 0.06, blk, 0, 1.15, -0.55)); cb.add(c.slab(0.9, 2.3, 0.06, blk, 0, 1.15, 0.55));
  const act = K.extra(cb, -0.1, 0, { col: 0xe8e8f0, ry: H }); const strip = c.slab(0.04, 1.8, 0.04, hot(c, 0xd8f0ff, 2.4), 0.38, 1.2, -0.48); cb.add(strip); glow(c, K, cb, 0.1, 1.3, 0, 1.6, 'rgba(200,230,255,.4)'); c.post(X(8.5), -3.2, 0.6);
  // the ghost, where the glass puts her: the cupboard reflected through the pane
  const S = new T.Vector3(8.5, 0.95, -3.2), dd = S.clone().sub(G).dot(nrm), GH = S.clone().addScaledVector(nrm, -2 * dd);
  const ghostT = ctex(c, 256, 448, (q, w, h) => { q.clearRect(0, 0, w, h); const gr = q.createRadialGradient(w / 2, h * 0.55, 10, w / 2, h * 0.55, w * 0.6); gr.addColorStop(0, 'rgba(160,220,255,.35)'); gr.addColorStop(1, 'rgba(160,220,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); q.fillStyle = 'rgba(210,235,255,.85)'; q.beginPath(); q.moveTo(w * 0.36, h * 0.3); q.lineTo(w * 0.64, h * 0.3); q.lineTo(w * 0.74, h * 0.98); q.lineTo(w * 0.26, h * 0.98); q.closePath(); q.fill(); K.eyeFlower(q, w / 2, h * 0.17, w * 0.24, '#e8f4ff', '#8ad8ff'); });
  const ghost = new T.Mesh(new T.PlaneGeometry(1.0, 1.75), new T.MeshBasicMaterial({ map: ghostT, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide })); ghost.position.set(GH.x, 0.95, GH.z); g.add(ghost);
  const cam = new T.Vector3(), Q = new T.Vector3(), dir = new T.Vector3(); let op = 0;
  c.tick((t, dt, P, ri) => {
    if (ri !== r.i) { ghost.visible = false; return; } ghost.visible = true;
    cam.set(P.x - r.x0, P.y, P.z); dir.copy(ghost.position).sub(cam); const den = nrm.dot(dir); let want = 0;
    if (Math.abs(den) > 1e-4) { const tt = nrm.dot(Q.copy(G).sub(cam)) / den; if (tt > 0 && tt < 1) { Q.copy(cam).addScaledVector(dir, tt).sub(G); if (Math.abs(Q.y) < 1.15 && Math.abs(Q.dot(tan)) < 0.95) want = 0.9; } }
    op += (want - op) * Math.min(1, dt * 4); ghost.material.opacity = op * (0.8 + Math.sin(t * 7) * 0.1 + Math.sin(t * 23) * 0.05);
    ghost.rotation.y = Math.atan2(cam.x - ghost.position.x, cam.z - ghost.position.z); ghost.position.y = 0.95 + Math.sin(t * 0.9) * 0.04;
  });
  const seat = mark(c, K, g, 10, 3.0, 'THE SEATS');
  [pane, seat, ghost].forEach((o) => c.clickable(o, () => { c.sound.whoosh?.(0.1, 0.8); c.egg('mmmystery_ghost', 'Pepper\'s ghost: a sheet of glass and an actress lit in a cupboard. From the seats she floats behind the glass; from the wings she is just standing in a cupboard. MLow keeps her on the payroll.'); }, 'A sheet of glass'));
  // dust turning in the projector beam
  { const N = c.MOBILE ? 120 : 260, p = new Float32Array(N * 3); for (let k = 0; k < N; k++) { const z = -7 + Math.random() * 13, rr = 2.2 * (6.4 - z) / 14 * Math.sqrt(Math.random()), a = Math.random() * PI * 2; p[k * 3] = 10 + Math.cos(a) * rr; p[k * 3 + 1] = 4.6 + Math.sin(a) * rr; p[k * 3 + 2] = z; }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(p, 3)); const pts = new T.Points(geo, new T.PointsMaterial({ map: gtex(K, 'rgba(255,245,220,.9)'), size: 0.05, transparent: true, opacity: 0.8, depthWrite: false, blending: T.AdditiveBlending })); pts.frustumCulled = false; g.add(pts);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; pts.position.z = Math.sin(t * 0.1) * 0.4; pts.material.opacity = 0.6 + Math.abs(Math.sin(t * 24)) * 0.3; }); }
  // the fly system: three battens, stage lanterns with red, blue and amber gels, the hemp ropes tied off at the rail
  const pipe = K.std(0x1a1a1a, { metalness: 0.7, roughness: 0.4 }); [-4.0, -0.6, 3.0].forEach((z) => { const b = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 18, 8), pipe); b.rotation.z = H; b.position.set(10, 5.3, z); g.add(b); [0.4, 9.6].forEach((x) => g.add(c.slab(0.01, 0.7, 0.01, pipe, 1 + x * 1.9, 5.65, z))); });
  [[4, -4.0, 0xff3030], [8, -4.0, 0x3060ff], [12, -4.0, 0xffb040], [16, -4.0, 0x3060ff], [5, 3.0, 0xffb040], [10, 3.0, 0xff3030], [15, 3.0, 0xffb040]].forEach(([x, z, col]) => {
    const o = new T.Group(); o.position.set(x, 5.1, z); o.rotation.x = z < 0 ? 0.5 : -0.5; g.add(o);
    const can = new T.Mesh(new T.CylinderGeometry(0.16, 0.2, 0.4, 14), K.std(0x111111, { metalness: 0.5 })); o.add(can);
    const lens = new T.Mesh(new T.CircleGeometry(0.15, 16), hot(c, col, 2.2)); lens.rotation.x = H; lens.position.y = -0.21; o.add(lens);
    cone(c, o, 0, -0.2, 0, 0.15, 0.85, 4.2, col, 0.03);
  });
  [6.3, 6.7, 7.1, 7.5].forEach((z, k) => [0.32, 19.42].forEach((x) => { g.add(c.slab(0.02, 4.8, 0.02, K.std(0x8a7a5a, { roughness: 1 }), x + (x < 10 ? 0.1 : -0.1), 3.6, z)); if (k === 0) g.add(c.slab(0.12, 0.08, 1.6, K.std(0x3a2a1a), x + (x < 10 ? 0.1 : -0.1), 1.2, 6.9)); }));
  // the ghost light, left burning on the stage all night as every theatre does
  { const o = new T.Group(); o.position.set(4.9, 0, -1.6); g.add(o); o.add(c.slab(0.04, 1.6, 0.04, pipe, 0, 0.8, 0)); o.add(new T.Mesh(new T.CylinderGeometry(0.22, 0.26, 0.05, 16), pipe)); const b = new T.Mesh(new T.SphereGeometry(0.08, 12, 10), hot(c, 0xfff0d0, 3)); b.position.y = 1.72; o.add(b); const cage = new T.Mesh(new T.SphereGeometry(0.14, 8, 6), new T.MeshBasicMaterial({ color: 0x222222, wireframe: true })); cage.position.y = 1.72; o.add(cage); glow(c, K, o, 0, 1.72, 0, 2.2, 'rgba(255,240,210,.6)'); c.post(X(4.9), -1.6, 0.3);
    c.clickable(o, () => c.toast('The ghost light. Nobody switches it off, in case someone walks the stage in the dark.', 2600), 'A bare bulb on a stand'); }
  // spike marks glowing on the boards, cables snaking to the lanterns
  const tapeM = [0xff4fa3, 0x22d3ee, 0xf5c542].map((h) => hot(c, h, 1.2)); [[6.2, 0.4], [13.4, -1.0], [9.0, 4.2], [11.4, -5.6], [15.6, 2.6], [3.6, 4.8]].forEach(([x, z], k) => [0, H].forEach((a) => { const m = new T.Mesh(new T.PlaneGeometry(0.3, 0.05), tapeM[k % 3]); m.rotation.set(-H, 0, a + 0.3); m.position.set(x, 0.008, z); g.add(m); }));
  const cableM = K.std(0x0a0a0a, { roughness: 0.6 }); [[[2, 0.02, 6.6], [4, 0.02, 4.5], [7, 0.02, 4.9], [9.6, 0.02, 3.6], [12, 0.02, 4.4]], [[18, 0.02, 6.6], [16.4, 0.02, 4.0], [14.2, 0.02, 0.6], [15.2, 0.02, -2.0]]].forEach((pts) => g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map((p) => new T.Vector3(...p))), 40, 0.025, 6), cableM)));
  // WAY OUT, in red, over both doors
  [[0.2, H], [19.55, -H]].forEach(([x, ry]) => { const s = c.sign('WAY OUT', { w: 1.2, h: 0.3, bg: '#1a0000', fg: '#ff3030', font: c.MONO, weight: 900, glow: 18 }); s.material.color.setScalar(1.6); s.position.set(x, 4.65, 3.8); s.rotation.y = ry; g.add(s); });
  // the picture bleeding through the back of the screen
  const bleed = glow(c, K, g, 15.4, 1.8, -3.0, 3.6, 'rgba(200,220,255,.35)'); c.tick((t, dt, P, ri) => { if (ri === r.i) bleed.material.opacity = 0.6 + Math.sin(t * 3.1) * 0.2 + Math.sin(t * 17) * 0.15; });
};

// ======================================================================= angrymen
ROOM.angrymen = (c, r, g, X, K) => {
  const T = c.THREE;
  r.post = { ...r.post, bloom: 0.95, vig: 0.55 };
  // ILLUSION: a wire cube turning over the jury table. No shading, one width of line: watch it and it turns one way, then
  // flips and turns the other, though nothing touches it. Reasonable doubt, hung from the ceiling.
  const cubeG = new T.EdgesGeometry(new T.BoxGeometry(1.15, 1.15, 1.15)), wire = new T.LineSegments(cubeG, new T.LineBasicMaterial({ color: new T.Color(2.2, 2.2, 2.1), toneMapped: false, fog: false }));
  const cube = new T.Group(); cube.position.set(10, 3.35, -3.0); cube.add(wire); wire.rotation.set(0.42, 0, 0.32); g.add(cube);
  g.add(c.slab(0.008, 1.95, 0.008, K.std(0x222222), 10, 5.0, -3.0));
  const hit = new T.Mesh(new T.BoxGeometry(1.3, 1.3, 1.3), new T.MeshBasicMaterial({ visible: false })); cube.add(hit);
  c.clickable(hit, () => { c.sound.tick(); c.egg('angrymen_cube', 'A wire cube over the jury table. Watch it turn one way, then the other, with nobody touching it. That is reasonable doubt. MLow hung it there for juror eight.'); }, 'A wire cube');
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; cube.rotation.y += dt * 0.45; });
  // the blackboard by the window: a Necker cube and Schroder's stairs, in chalk
  const bb = K.decal(1.6, 1.1, (q, w, h) => { q.fillStyle = '#1e2420'; q.fillRect(0, 0, w, h); q.strokeStyle = '#6a5a3a'; q.lineWidth = 14; q.strokeRect(0, 0, w, h); q.strokeStyle = 'rgba(240,240,232,.9)'; q.lineWidth = 3;
    const cx = w * 0.26, cy = h * 0.5, s = h * 0.32, o = s * 0.45; q.strokeRect(cx - s / 2, cy - s / 2 + o / 2, s, s); q.strokeRect(cx - s / 2 + o, cy - s / 2 - o / 2, s, s); [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b]) => { q.beginPath(); q.moveTo(cx + a * s / 2, cy + b * s / 2 + o / 2); q.lineTo(cx + a * s / 2 + o, cy + b * s / 2 - o / 2); q.stroke(); });
    const sx = w * 0.58, sy = h * 0.78, st = h * 0.08; q.beginPath(); q.moveTo(sx, sy); for (let k = 0; k < 5; k++) { q.lineTo(sx + k * st * 1.2, sy - (k + 1) * st); q.lineTo(sx + (k + 1) * st * 1.2, sy - (k + 1) * st); } q.lineTo(sx + 6 * st * 1.2, sy - 5 * st); q.lineTo(sx + 6 * st * 1.2, sy); q.closePath(); q.stroke(); for (let k = 0; k < 5; k++) { q.beginPath(); q.moveTo(sx + (k + 1) * st * 1.2, sy - (k + 1) * st); q.lineTo(sx + (k + 1) * st * 1.2 + st, sy - (k + 1) * st - st * 0.6); q.stroke(); }
    q.fillStyle = 'rgba(240,240,232,.9)'; q.font = `700 ${h * 0.08}px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('REASONABLE DOUBT', w / 2, h * 0.14); q.font = `600 ${h * 0.05}px ${c.MONO}`; q.fillText('WHICH FACE IS IN FRONT?  MLow', w / 2, h * 0.94); }, 384);
  bb.position.set(19.6, 1.95, -6.5); bb.rotation.y = -H; g.add(bb);
  // August sun through the west windows: shafts, and the panes laid out bright on the boards
  [[-6.0], [-3.2], [-0.4]].forEach(([z]) => shaft(c, g, 0.4, 4.4, z, 1.3, 6.5, -H, 0.95, 0xffffff, 0.1));
  const paneT = ctex(c, 256, 256, (q, w, h) => { q.clearRect(0, 0, w, h); q.fillStyle = 'rgba(255,255,250,1)'; const m = 10; for (let j = 0; j < 3; j++) for (let i = 0; i < 2; i++) q.fillRect(i * w / 2 + m, j * h / 3 + m, w / 2 - m * 2, h / 3 - m * 2); });
  [-6.0, -3.2, -0.4].forEach((z) => { const m = new T.Mesh(new T.PlaneGeometry(1.2, 1.8), addv(c, 0xfff8e8, 0.22, paneT)); m.rotation.set(-H, 0, 0.35); m.position.set(4.6, 0.01, z + 0.5); g.add(m); });
  motes(c, K, r, g, 200, 0.5, 8, 0.3, 4.4, -7, 1, 'rgba(255,255,250,.9)', 0.035, 0.6);
  // pressed tin overhead
  const tinT = ctex(c, 256, 256, (q, w, h) => { q.fillStyle = '#8a8a84'; q.fillRect(0, 0, w, h); q.strokeStyle = '#b8b8b0'; q.lineWidth = 4; q.strokeRect(8, 8, w - 16, h - 16); q.beginPath(); q.arc(w / 2, h / 2, w * 0.3, 0, 7); q.stroke(); q.strokeStyle = '#5a5a56'; q.beginPath(); q.arc(w / 2 + 3, h / 2 + 3, w * 0.3, 0, 7); q.stroke(); for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; q.beginPath(); q.moveTo(w / 2, h / 2); q.lineTo(w / 2 + Math.cos(a) * w * 0.28, h / 2 + Math.sin(a) * h * 0.28); q.stroke(); } });
  tinT.wrapS = tinT.wrapT = T.RepeatWrapping; tinT.repeat.set(16, 13);
  const tin = new T.Mesh(new T.PlaneGeometry(19.8, 15.8), new T.MeshBasicMaterial({ map: tinT, color: 0x8a8a86 })); tin.rotation.x = H; tin.position.set(10, 5.98, 0); g.add(tin);
  // the two lamps over the table burn; the smoke over the ashtrays; the water cooler gets its bottle
  [-4.6, 1.0].forEach((z) => { glow(c, K, g, 10, 4.2, z, 1.6, 'rgba(255,255,245,.5)'); cone(c, g, 10, 4.15, z, 0.3, 1.8, 3.3, 0xffffff, 0.05); });
  const tray = K.std(0x3a3a3a, { metalness: 0.6, roughness: 0.4 }); [[9.6, -4.0], [10.4, -1.4], [9.7, 0.4]].forEach(([x, z], k) => { const a = new T.Mesh(new T.CylinderGeometry(0.08, 0.07, 0.03, 14), tray); a.position.set(x, 0.805, z); g.add(a); if (k < 2) K.steam(g, x, 0.85, z); });
  const jug = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 0.42, 16), new T.MeshPhysicalMaterial({ color: 0xd8e4e8, transparent: true, opacity: 0.45, roughness: 0.05 })); jug.position.set(1.0, 1.42, 6.6); g.add(jug);
  // crumpled ballots round the wastebasket
  const NBL = 14, balls = new T.InstancedMesh(new T.IcosahedronGeometry(0.05, 0), K.std(0xf0f0e8, { roughness: 1, flatShading: true }), NBL), m4 = new T.Matrix4();
  for (let k = 0; k < NBL; k++) { m4.makeTranslation(13.0 + Math.cos(k * 2.3) * (0.35 + (k % 4) * 0.12), 0.045, -6.1 + Math.sin(k * 2.3) * (0.3 + (k % 3) * 0.15)); balls.setMatrixAt(k, m4); } g.add(balls);
};

// ======================================================================= deskset
ROOM.deskset = (c, r, g, X, K) => {
  const T = c.THREE;
  r.post = { ...r.post, bloom: 1.0, vig: 0.45 };
  // ILLUSION: the hollow face of EMERAC over its cabinets. It is a bowl, pressed in, but your eye insists it is a face pushing out,
  // so as you walk past it turns to keep watching you.
  const R0 = 0.82, faceT = ctex(c, 512, 512, (q, w, h) => {
    q.fillStyle = '#2a2a2a'; q.fillRect(0, 0, w, h); const cx = w / 2, cy = h / 2;
    const sk = q.createRadialGradient(cx - w * 0.1, cy - h * 0.15, w * 0.05, cx, cy, w * 0.5); sk.addColorStop(0, '#f4ece0'); sk.addColorStop(0.55, '#c8bca8'); sk.addColorStop(1, '#5a5048'); q.fillStyle = sk; q.beginPath(); q.ellipse(cx, cy, w * 0.4, h * 0.47, 0, 0, 7); q.fill();
    q.fillStyle = 'rgba(60,50,40,.35)'; [-1, 1].forEach((s) => { q.beginPath(); q.ellipse(cx + s * w * 0.16, cy - h * 0.06, w * 0.11, h * 0.07, 0, 0, 7); q.fill(); });
    [-1, 1].forEach((s) => { q.fillStyle = '#fbfbf6'; q.beginPath(); q.ellipse(cx + s * w * 0.16, cy - h * 0.06, w * 0.085, h * 0.045, 0, 0, 7); q.fill(); K.eyeFlower(q, cx + s * w * 0.16, cy - h * 0.06, w * 0.05); q.strokeStyle = '#3a3028'; q.lineWidth = 7; q.beginPath(); q.arc(cx + s * w * 0.16, cy - h * 0.1, w * 0.1, PI * 1.15, PI * 1.85); q.stroke(); });
    const ns = q.createLinearGradient(cx - w * 0.05, 0, cx + w * 0.05, 0); ns.addColorStop(0, '#fff8ec'); ns.addColorStop(1, '#7a6a5a'); q.fillStyle = ns; q.beginPath(); q.moveTo(cx - w * 0.02, cy - h * 0.04); q.lineTo(cx + w * 0.05, cy + h * 0.12); q.lineTo(cx - w * 0.05, cy + h * 0.13); q.closePath(); q.fill();
    q.fillStyle = 'rgba(60,50,40,.5)'; q.beginPath(); q.ellipse(cx, cy + h * 0.15, w * 0.06, h * 0.015, 0, 0, 7); q.fill();
    q.fillStyle = '#c84a5a'; q.beginPath(); q.moveTo(cx - w * 0.12, cy + h * 0.24); q.quadraticCurveTo(cx, cy + h * 0.2, cx + w * 0.12, cy + h * 0.24); q.quadraticCurveTo(cx, cy + h * 0.31, cx - w * 0.12, cy + h * 0.24); q.fill();
  });
  const fg = new T.SphereGeometry(R0, 48, 24, 0, PI * 2, 0, PI / 2); fg.rotateX(-H); { const pa = fg.attributes.position, uv = fg.attributes.uv; for (let i = 0; i < pa.count; i++) { pa.setZ(i, pa.getZ(i) * 1.25); uv.setXY(i, 0.5 - pa.getX(i) / (2 * R0) * 0.98 * -1, 0.5 + pa.getY(i) / (2 * R0) * 0.98); } }
  const face = new T.Mesh(fg, new T.MeshBasicMaterial({ map: faceT, side: T.BackSide })); face.position.set(6.8, 3.4, -4.36); g.add(face);
  const rim = new T.Mesh(new T.TorusGeometry(R0 + 0.03, 0.05, 10, 48), K.std(0xc8a050, { metalness: 1, roughness: 0.3 })); rim.position.copy(face.position); g.add(rim);
  const plq = c.sign('THE FACE OF EMERAC  BY MLow', { w: 1.6, h: 0.16, bg: '#1a1a1a', fg: '#e8c870', font: c.MONO, weight: 700 }); plq.position.set(6.8, 2.5, -4.37); g.add(plq);
  c.clickable(face, () => { c.sound.beep?.(660, 0.08, 0.2); c.egg('deskset_mask', 'EMERAC\'s face is a bowl pressed into the wall, hollow, but walk past and it turns to keep watching you. Bunny says it is the only thing in the building that never forgets a face. MLow taught it yours.'); }, 'A face over the machine');
  // lamps along the cabinet tops, blinking in their own time
  const NL = 24, lamps = new T.InstancedMesh(new T.SphereGeometry(0.04, 8, 6), new T.MeshBasicMaterial({ toneMapped: false }), NL), m4 = new T.Matrix4(), LC = [new T.Color(3, 2.2, 0.4), new T.Color(0.4, 3, 0.8), new T.Color(3, 0.6, 0.4), new T.Color(0.15, 0.15, 0.15)];
  for (let k = 0; k < NL; k++) { m4.makeTranslation(4.4 + k * 0.215, 2.44, -4.38); lamps.setMatrixAt(k, m4); lamps.setColorAt(k, LC[k % 3]); } g.add(lamps); let lt = 0;
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; lt += dt; if (lt < 0.18) return; lt = 0; for (let k = 0; k < NL; k++) lamps.setColorAt(k, Math.sin(t * (2 + k % 5) + k * 1.3) > 0.2 ? LC[k % 3] : LC[3]); lamps.instanceColor.needsUpdate = true; });
  // the fluorescent tubes burn, cool white, with a wash under each
  [[6, -1.6], [14, -1.6], [6, 3.6], [14, 3.6]].forEach(([x, z]) => { [-0.12, 0.12].forEach((dz) => { const tb = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 1.2, 8), hot(c, 0xe8fff4, 2.4)); tb.rotation.z = H; tb.position.set(x, 5.83, z + dz); g.add(tb); }); glow(c, K, g, x, 5.75, z, 2.2, 'rgba(220,255,240,.4)'); cone(c, g, x, 5.8, z, 0.5, 2.4, 4.6, 0xe0fff0, 0.035); });
  // acoustic tile overhead
  const tileT = ctex(c, 256, 256, (q, w, h) => { q.fillStyle = '#d8d4c8'; q.fillRect(0, 0, w, h); q.fillStyle = 'rgba(60,60,50,.35)'; for (let k = 0; k < 600; k++) q.fillRect(Math.random() * w, Math.random() * h, 2, 2); q.fillStyle = '#9a968a'; q.fillRect(0, 0, w, 4); q.fillRect(0, 0, 4, h); });
  tileT.wrapS = tileT.wrapT = T.RepeatWrapping; tileT.repeat.set(16, 13);
  const ceil = new T.Mesh(new T.PlaneGeometry(19.8, 15.8), new T.MeshBasicMaterial({ map: tileT, color: 0x8a867c })); ceil.rotation.x = H; ceil.position.set(10, 5.97, 0); g.add(ceil);
  // the teleprinter by the machine, its paper tape climbing out and away
  const tp = new T.Group(); tp.position.set(10.9, 0, -4.2); g.add(tp); tp.add(c.slab(0.6, 0.75, 0.5, K.std(0x5a6a6a, { metalness: 0.4 }), 0, 0.375, 0)); tp.add(c.slab(0.5, 0.2, 0.42, K.std(0x7a8a8a, { metalness: 0.4 }), 0, 0.85, 0)); c.post(X(10.9), -4.2, 0.4);
  const tapeT = ctex(c, 64, 512, (q, w, h) => { q.fillStyle = '#f4ecd0'; q.fillRect(0, 0, w, h); q.fillStyle = '#2a2a2a'; for (let y = 4; y < h; y += 9) for (let x = 0; x < 5; x++) if (Math.random() < 0.45) { q.beginPath(); q.arc(10 + x * 11, y, 3, 0, 7); q.fill(); } });
  tapeT.wrapT = T.RepeatWrapping; const tape = new T.Mesh(new T.PlaneGeometry(0.08, 2.4), new T.MeshStandardMaterial({ map: tapeT, side: T.DoubleSide, roughness: 0.9 })); tape.position.set(0.05, 2.15, 0.1); tape.rotation.set(0.3, 0, 0.12); tp.add(tape);
  c.tick((t, dt, P, ri) => { if (ri === r.i) tapeT.offset.y = (tapeT.offset.y + dt * 0.25) % 1; });
  // the office party: a tree in the corner by the rope, bulbs twinkling, and a garland over the paintings
  const tree = new T.Group(); tree.position.set(12.9, 0, -5.9); g.add(tree); const fir = K.std(0x1a4a2a, { roughness: 0.9 });
  [[1.0, 1.1, 0.75], [0.8, 0.9, 1.35], [0.55, 0.75, 1.9]].forEach(([rr, hh, y]) => { const cn = new T.Mesh(new T.ConeGeometry(rr, hh, 14), fir); cn.position.y = y; tree.add(cn); }); tree.add(c.slab(0.12, 0.3, 0.12, K.std(0x4a2a1a), 0, 0.15, 0)); c.post(X(12.9), -5.9, 0.7);
  const NT = 36, tb2 = new T.InstancedMesh(new T.SphereGeometry(0.04, 8, 6), new T.MeshBasicMaterial({ toneMapped: false }), NT), TC = [new T.Color(3, 0.4, 0.4), new T.Color(0.4, 2.4, 0.6), new T.Color(3, 2.4, 0.5), new T.Color(0.5, 0.9, 3)];
  for (let k = 0; k < NT; k++) { const y = 0.4 + (k / NT) * 1.9, rr = 0.98 * (1 - (y - 0.3) / 2.2) + 0.05, a = k * 2.4; m4.makeTranslation(Math.cos(a) * rr, y, Math.sin(a) * rr); tb2.setMatrixAt(k, m4); tb2.setColorAt(k, TC[k % 4]); } tree.add(tb2);
  const star = glow(c, K, tree, 0, 2.4, 0, 0.8, 'rgba(255,230,150,.9)'); c.tick((t, dt, P, ri) => { if (ri === r.i) star.material.opacity = 0.7 + Math.sin(t * 3) * 0.3; });
  const gpts = []; for (let k = 0; k <= 60; k++) { const u = k / 60; gpts.push(new T.Vector3(0.6 + u * 18.8, 3.5 - Math.abs(Math.sin(u * PI * 4)) * 0.35, 7.78)); }
  g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(gpts), 120, 0.05, 6), K.std(0xc8d0d8, { metalness: 1, roughness: 0.35 })));
  // Bunny's desk fan, turning its head, and the lamps on the desks lit
  const fan = new T.Group(); fan.position.set(15.15, 0.79, -1.45); g.add(fan); fan.add(c.slab(0.16, 0.03, 0.12, K.std(0x2a3a3a, { metalness: 0.5 }), 0, 0.015, 0)); fan.add(c.slab(0.025, 0.22, 0.025, K.std(0x2a3a3a, { metalness: 0.5 }), 0, 0.12, 0));
  const head = new T.Group(); head.position.y = 0.28; fan.add(head); head.add(new T.Mesh(new T.TorusGeometry(0.12, 0.006, 6, 24), K.std(0x8a9a9a, { metalness: 0.8 }))); const blades = new T.Group(); head.add(blades); for (let k = 0; k < 3; k++) { const b = c.slab(0.05, 0.1, 0.005, K.std(0x6a7a7a, { metalness: 0.6 }), 0, 0.055, 0); const pv = new T.Group(); pv.rotation.z = k * PI * 2 / 3; pv.add(b); blades.add(pv); }
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; blades.rotation.z += dt * 20; fan.rotation.y = 0.6 + Math.sin(t * 0.6) * 0.8; });
  [[10.5, -0.6], [14.1, -1.0]].forEach(([x, z]) => glow(c, K, g, x, 1.2, z, 1.0, 'rgba(255,230,180,.5)'));
  motes(c, K, r, g, 140, 1, 19, 0.5, 5, -6, 6, 'rgba(240,255,250,.9)', 0.03, 0.45);
};

// a set of quads, built in plain space, then pushed along the rays from E so the room is an Ames room from E only
function amesQuad(T, E, a, b, c2, d, seg, push) {
  const geo = new T.PlaneGeometry(1, 1, seg, seg), pa = geo.attributes.position, A = new T.Vector3(...a), B = new T.Vector3(...b), C = new T.Vector3(...c2), D = new T.Vector3(...d), p = new T.Vector3(), q = new T.Vector3();
  for (let i = 0; i < pa.count; i++) { const u = pa.getX(i) + 0.5, v = pa.getY(i) + 0.5; p.copy(A).lerp(B, u); q.copy(D).lerp(C, u); p.lerp(q, v); const s = push(p); p.sub(E).multiplyScalar(s).add(E); pa.setXYZ(i, p.x, p.y, p.z); }
  geo.computeVertexNormals(); geo.computeBoundingSphere(); return geo;
}

// ======================================================================= lostweekend
ROOM.lostweekend = (c, r, g, X, K) => {
  const T = c.THREE;
  r.post = { ...r.post, bloom: 1.0, vig: 0.65 };
  // ILLUSION: an Ames room in a peep show cabinet. From the mark it is a square little room with a bottle in each back corner,
  // one bottle tiny and one huge. They are the same bottle. The left corner is twice as far away as it looks.
  const CX = 12.3, ZO = -1.0, DEP = 0.9, HW = 0.8, Y0 = 1.1, Y1 = 2.1, E = new T.Vector3(CX, 1.62, 0.9), KF = 1.4;
  const push = (p) => 1 + KF * Math.min(1, Math.max(0, (HW - (p.x - CX)) / (2 * HW))) * Math.min(1, Math.max(0, (ZO - p.z) / DEP));
  const tex = {
    floor: ctex(c, 512, 512, (q, w, h) => { const n = 8; for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { q.fillStyle = (i + j) % 2 ? '#141414' : '#e8e4dc'; q.fillRect(i * w / n, j * h / n, w / n, h / n); } }),
    wall: ctex(c, 512, 512, (q, w, h) => { q.fillStyle = '#b8b0a0'; q.fillRect(0, 0, w, h); q.fillStyle = 'rgba(90,80,70,.35)'; for (let x = 0; x < w; x += 64) for (let y = 0; y < h; y += 64) { q.beginPath(); q.arc(x + 32, y + 32, 10, 0, 7); q.fill(); } q.fillStyle = '#3a3028'; q.fillRect(0, h - 40, w, 40); }),
    back: ctex(c, 512, 512, (q, w, h) => { q.fillStyle = '#b8b0a0'; q.fillRect(0, 0, w, h); q.fillStyle = 'rgba(90,80,70,.35)'; for (let x = 0; x < w; x += 64) for (let y = 0; y < h; y += 64) { q.beginPath(); q.arc(x + 32, y + 32, 10, 0, 7); q.fill(); } [[0.18, 0.2], [0.62, 0.2]].forEach(([x, y]) => { q.fillStyle = '#d8dce4'; q.fillRect(x * w, y * h, w * 0.2, h * 0.42); q.strokeStyle = '#2a2420'; q.lineWidth = 10; q.strokeRect(x * w, y * h, w * 0.2, h * 0.42); q.beginPath(); q.moveTo(x * w + w * 0.1, y * h); q.lineTo(x * w + w * 0.1, y * h + h * 0.42); q.moveTo(x * w, y * h + h * 0.21); q.lineTo(x * w + w * 0.2, y * h + h * 0.21); q.stroke(); }); q.fillStyle = '#3a3028'; q.fillRect(0, h - 40, w, 40); }),
    ceil: ctex(c, 256, 256, (q, w, h) => { q.fillStyle = '#d0c8b8'; q.fillRect(0, 0, w, h); }),
  };
  const M = (t) => new T.MeshBasicMaterial({ map: t }), shellM = new T.MeshStandardMaterial({ color: 0x1a120c, roughness: 0.7, side: T.BackSide });
  const L = CX - HW, Rr = CX + HW, ZB = ZO - DEP, room = new T.Group(); g.add(room);
  const faces = [
    [[L, Y0, ZO], [Rr, Y0, ZO], [Rr, Y0, ZB], [L, Y0, ZB], tex.floor],
    [[L, Y1, ZB], [Rr, Y1, ZB], [Rr, Y1, ZO], [L, Y1, ZO], tex.ceil],
    [[L, Y0, ZB], [Rr, Y0, ZB], [Rr, Y1, ZB], [L, Y1, ZB], tex.back],
    [[L, Y0, ZO], [L, Y0, ZB], [L, Y1, ZB], [L, Y1, ZO], tex.wall],
    [[Rr, Y0, ZB], [Rr, Y0, ZO], [Rr, Y1, ZO], [Rr, Y1, ZB], tex.wall],
  ];
  faces.forEach(([a, b, c2, d, t]) => { const geo = amesQuad(T, E, a, b, c2, d, 10, push); room.add(new T.Mesh(geo, M(t))); room.add(new T.Mesh(geo, shellM)); });
  // two identical bottles of rye, one in each back corner
  const bottleG = new T.LatheGeometry([[0, 0], [0.07, 0], [0.075, 0.02], [0.07, 0.2], [0.03, 0.26], [0.022, 0.34], [0.026, 0.36], [0, 0.37]].map(([x, y]) => new T.Vector2(x, y)), 18), glassM = new T.MeshStandardMaterial({ color: 0x2a3a26, roughness: 0.12, metalness: 0.2 });
  const labelT = ctex(c, 128, 64, (q, w, h) => { q.fillStyle = '#e8e0c8'; q.fillRect(0, 0, w, h); q.fillStyle = '#1a1a1a'; q.font = `900 ${h * 0.42}px ${c.SERIF}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('RYE', w / 2, h / 2); });
  [[L + 0.25, ZB + 0.22], [Rr - 0.25, ZB + 0.22]].forEach(([x, z]) => { const p = new T.Vector3(x, Y0, z), s = push(p); p.sub(E).multiplyScalar(s).add(E); const b = new T.Mesh(bottleG, glassM); b.position.copy(p); b.scale.setScalar(1.35); room.add(b); const lb = new T.Mesh(new T.CylinderGeometry(0.073, 0.073, 0.09, 18, 1, true), new T.MeshBasicMaterial({ map: labelT })); lb.position.y = 0.11; b.add(lb); });
  // the cabinet: a frame round the opening, a stand under it, a card on top
  const wood = K.std(0x2a1a10, { roughness: 0.6 });
  g.add(c.slab(2.0, 0.12, 0.12, wood, CX, Y1 + 0.06, ZO + 0.02)); g.add(c.slab(2.0, 0.12, 0.12, wood, CX, Y0 - 0.06, ZO + 0.02)); [L - 0.06, Rr + 0.06].forEach((x) => g.add(c.slab(0.12, Y1 - Y0 + 0.24, 0.12, wood, x, (Y0 + Y1) / 2, ZO + 0.02)));
  g.add(c.slab(2.95, 0.55, 5.1, wood, CX - 0.52, 0.275, ZO - 2.4)); c.wall(X(CX - 2.0), ZO, X(CX + 0.95), ZO); c.wall(X(CX - 2.0), ZO, X(CX - 2.0), ZO - 4.95); c.wall(X(CX + 0.95), ZO, X(CX + 0.95), ZO - 4.95);
  const card = c.sign('PEEP SHOW\nTHE FAR CORNER  BY MLow', { w: 1.5, h: 0.32, bg: '#f0e8d4', fg: '#1a1a1a', font: c.SERIF, weight: 900, border: '#1a1a1a' }); card.position.set(CX, Y1 + 0.32, ZO + 0.03); g.add(card);
  const mk = mark(c, K, g, E.x, E.z, 'LOOK FROM HERE');
  [mk, ...room.children].forEach((o) => c.clickable(o, () => { c.sound.clink?.(900); c.egg('lostweekend_ames', 'Two bottles of rye, one tiny, one enormous, in a square little room. Same bottle, same size. The room is not square: the left corner is twice as far away. He would drink the far one first. MLow measured.'); }, 'A peep show cabinet'));
  // a window on the east wall: venetian blinds, rain on the glass, the neon of the bar across the street blinking through
  const WZ = 6.7, WY = 2.0, win = new T.Group(); win.position.set(19.58, WY, WZ); win.rotation.y = -H; g.add(win);
  const neonT = ctex(c, 256, 256, (q, w, h) => { q.fillStyle = '#05070a'; q.fillRect(0, 0, w, h); q.fillStyle = '#ffffff'; q.font = `900 ${h * 0.22}px ${c.SERIF}`; q.textAlign = 'center'; q.shadowColor = '#fff'; q.shadowBlur = 20; q.fillText('BAR', w / 2, h * 0.45); q.font = `700 ${h * 0.08}px ${c.MONO}`; q.fillText('N3W GRILL', w / 2, h * 0.62); });
  const nm = new T.MeshBasicMaterial({ map: neonT, toneMapped: false }); const outside = new T.Mesh(new T.PlaneGeometry(1.4, 1.9), nm); outside.position.z = -0.02; win.add(outside);
  const slat = new T.InstancedMesh(new T.BoxGeometry(1.4, 0.055, 0.01), K.std(0xd8d0c0, { roughness: 0.7 }), 16), m4 = new T.Matrix4(), rx = new T.Matrix4().makeRotationX(0.6);
  for (let k = 0; k < 16; k++) { m4.makeTranslation(0, -0.9 + k * 0.12, 0.03).multiply(rx); slat.setMatrixAt(k, m4); } win.add(slat);
  [[0, 1.0, 1.55, 0.08], [0, -1.0, 1.55, 0.08], [-0.74, 0, 0.08, 2.0], [0.74, 0, 0.08, 2.0]].forEach(([x, y, w, h]) => win.add(c.slab(w, h, 0.08, wood, x, y, 0.02)));
  const rainT = ctex(c, 128, 256, (q, w, h) => { q.clearRect(0, 0, w, h); q.strokeStyle = 'rgba(220,230,240,.5)'; q.lineWidth = 1.5; for (let k = 0; k < 40; k++) { const x = Math.random() * w, y = Math.random() * h; q.beginPath(); q.moveTo(x, y); q.lineTo(x + 2, y + 10 + Math.random() * 20); q.stroke(); } }); rainT.wrapT = T.RepeatWrapping;
  const rain = new T.Mesh(new T.PlaneGeometry(1.4, 1.9), new T.MeshBasicMaterial({ map: rainT, transparent: true, depthWrite: false })); rain.position.z = 0.0; win.add(rain);
  const stripeT = ctex(c, 128, 256, (q, w, h) => { q.clearRect(0, 0, w, h); q.fillStyle = 'rgba(255,255,255,1)'; for (let y = 0; y < h; y += 32) q.fillRect(0, y, w, 18); });
  const stripes = new T.Mesh(new T.PlaneGeometry(2.2, 5.2), addv(c, 0xe8f0ff, 0.2, stripeT)); stripes.rotation.set(-H, 0, 0.5); stripes.position.set(16.4, 0.012, 5.6); g.add(stripes);
  const wallStripes = new T.Mesh(new T.PlaneGeometry(2.6, 1.8), addv(c, 0xe8f0ff, 0.14, stripeT)); wallStripes.position.set(13.0, 2.2, 7.84); wallStripes.rotation.y = PI; g.add(wallStripes);
  let el = 9, nOn = 1;
  const sweep = new T.Mesh(new T.PlaneGeometry(1.0, 6), addv(c, 0xf0f4ff, 0, soft(c))); sweep.position.set(0, 3, 7.8); sweep.rotation.y = PI; g.add(sweep);
  c.tick((t, dt, P, ri) => {
    if (ri !== r.i) return; rainT.offset.y = (rainT.offset.y - dt * 0.6) % 1;
    const on = Math.sin(t * 2.3) + Math.sin(t * 7.1) * 0.6 > -0.9 ? 1 : 0.15; nOn += (on - nOn) * Math.min(1, dt * 20); nm.color.setScalar(1.6 * nOn); stripes.material.opacity = 0.2 * nOn; wallStripes.material.opacity = 0.14 * nOn;
    // the Third Avenue El going by: a bar of light runs along the south wall every so often
    el -= dt; if (el < 0) { const u = -el / 2.2; sweep.position.x = 19.5 - u * 19; sweep.material.opacity = 0.18 * Math.sin(Math.min(1, u) * PI); if (u > 1) { el = 14 + Math.random() * 8; sweep.material.opacity = 0; } }
  });
  // the bowl light glows; smoke off the ashtray by the chair; stains on the ceiling; empties on the floor
  glow(c, K, g, 10, 4.45, -1.0, 2.2, 'rgba(255,250,240,.5)'); cone(c, g, 10, 4.4, -1.0, 0.35, 2.6, 4.4, 0xfffaf0, 0.045);
  const ash = new T.Mesh(new T.CylinderGeometry(0.07, 0.06, 0.025, 14), K.std(0x3a3a3a, { metalness: 0.5 })); ash.position.set(8.5, 0.77, 1.2); g.add(ash); K.steam(g, 8.5, 0.8, 1.2);
  const stainT = ctex(c, 256, 256, (q, w, h) => { q.clearRect(0, 0, w, h); for (let k = 0; k < 4; k++) { q.strokeStyle = `rgba(40,30,20,${0.25 + k * 0.1})`; q.lineWidth = 6 - k; q.beginPath(); q.ellipse(w / 2 + k * 6, h / 2 + k * 4, w * (0.42 - k * 0.08), h * (0.32 - k * 0.06), 0.3, 0, 7); q.stroke(); } q.fillStyle = 'rgba(60,45,30,.25)'; q.beginPath(); q.ellipse(w / 2, h / 2, w * 0.3, h * 0.22, 0.3, 0, 7); q.fill(); });
  [[6, 2, 3.0], [14.5, -4, 2.2], [3, -5, 1.8]].forEach(([x, z, s]) => { const m = plane(c, s, s * 0.8, stainT, { depthWrite: false }); m.rotation.x = H; m.position.set(x, 5.97, z); g.add(m); });
  const emp = new T.InstancedMesh(bottleG, glassM, 6); [[9.8, 1.6, 0.3], [10.2, 1.2, 1.9], [7.6, 0.4, 2.8], [3.8, 4.4, 0.8], [4.4, 4.0, 2.2], [15.0, 3.6, 1.1]].forEach(([x, z, a], k) => { const q4 = new T.Quaternion().setFromEuler(new T.Euler(0, a, H)); m4.compose(new T.Vector3(x, 0.07, z), q4, new T.Vector3(1, 1, 1)); emp.setMatrixAt(k, m4); }); g.add(emp);
  motes(c, K, r, g, 120, 12, 19.5, 0.3, 3.5, 3, 7.8, 'rgba(230,240,255,.9)', 0.03, 0.5);
};
