// Round thirteen batch c6: graphics and a new illusion for each of its sets. See ROUND13_BRIEF.md.
// Sets: crowd producers devils diehard dundee dolly stuart sweetsmell scent splash afterhours crown trading.
// No new lights: practicals are emissive or additive and the finishing pass blooms them. Ticks only run near their set.
const PI = Math.PI, H2 = Math.PI / 2;

// ---------- the kit for this batch ----------
const near = (r, ri) => Math.abs(ri - r.i) <= 1;
const GT = new Map();
const gtex = (K, col) => { if (!GT.has(col)) GT.set(col, K.glowTex(col)); return GT.get(col); };
// an additive glow sprite (a bulb's halo, a candle, haze)
function glow(c, K, g, x, y, z, s, col = 'rgba(255,220,160,.8)', op = 1) {
  const { THREE } = c, m = new THREE.Sprite(new THREE.SpriteMaterial({ map: gtex(K, col), transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  m.position.set(x, y, z); m.scale.set(s, s, 1); g.add(m); return m;
}
// soft gradients for light shafts: V fades top to bottom, P also fades at both side edges
let SHV, SHP, POOL;
const shaftV = (c) => SHV ||= c.canvasTex(16, 256, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); });
const shaftP = (c) => SHP ||= c.canvasTex(128, 256, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); q.globalCompositeOperation = 'destination-in'; const gx = q.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(0.3, 'rgba(0,0,0,1)'); gx.addColorStop(0.7, 'rgba(0,0,0,1)'); gx.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = gx; q.fillRect(0, 0, w, h); });
const poolT = (c) => POOL ||= c.canvasTex(128, 128, (q) => { const gr = q.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(0.4, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, 128, 128); });
const addM = (c, map, color, op) => new c.THREE.MeshBasicMaterial({ map, color, transparent: true, opacity: op, depthWrite: false, blending: c.THREE.AdditiveBlending, side: c.THREE.DoubleSide, toneMapped: false, fog: false });
// a cone of light hanging from (x, y, z) down h metres
function cone(c, g, x, y, z, rTop, rBot, h, col = 0xfff0d0, op = 0.12, up = false) { const m = new c.THREE.Mesh(new c.THREE.CylinderGeometry(rTop, rBot, h, 28, 1, true), addM(c, shaftV(c), col, op)); if (up) m.rotation.x = PI; m.position.set(x, up ? y + h / 2 : y - h / 2, z); g.add(m); return m; }
// a flat beam of light, as from a window: top centre (x, y, z), tipped by rx round its own axis
function beam(c, g, x, y, z, w, h, ry, rx, col = 0xfff0d0, op = 0.1) { const m = new c.THREE.Mesh(new c.THREE.PlaneGeometry(w, h).translate(0, -h / 2, 0), addM(c, shaftP(c), col, op)); m.position.set(x, y, z); m.rotation.set(0, ry, 0, 'YXZ'); m.rotation.x = rx; g.add(m); return m; }
// a pool of light on the floor
function pool(c, g, x, z, s, col = 0xffe0b0, op = 0.35, y = 0.02) { const m = new c.THREE.Mesh(new c.THREE.PlaneGeometry(s, s).rotateX(-H2), addM(c, poolT(c), col, op)); m.position.set(x, y, z); m.renderOrder = 2; g.add(m); return m; }
// a lit sign: c.sign pushed past white so the bloom catches it
function neon(c, text, o, boost = 1.8) { const s = c.sign(text, { glow: 22, ...o }); s.material.color.setScalar(boost); return s; }
// a canvas panel that glows (windows, screens, boards)
function panel(c, w, h, px, draw, boost = 1.4) { const t = c.canvasTex(Math.round(px * w / h), px, draw), m = new c.THREE.Mesh(new c.THREE.PlaneGeometry(w, h), new c.THREE.MeshBasicMaterial({ map: t, toneMapped: false, fog: false })); m.material.color.setScalar(boost); return m; }
// a flat floor decal
function floorDecal(K, g, w, h, x, z, draw, ry = 0, px = 256, y = 0.014) { const d = K.decal(w, h, draw, px); d.rotation.set(-H2, 0, ry); d.position.set(x, y, z); g.add(d); return d; }
// dust or stars: a cloud of points that drifts as one object (no per point work in the tick)
function motes(c, r, g, n, [x1, x2], [y1, y2], [z1, z2], col = 0xfff2d0, size = 0.035, op = 0.55, drift = 0.12) {
  const { THREE } = c, N = c.MOBILE ? n >> 1 : n, p = new Float32Array(N * 3);
  for (let k = 0; k < N; k++) p.set([x1 + Math.random() * (x2 - x1), y1 + Math.random() * (y2 - y1), z1 + Math.random() * (z2 - z1)], k * 3);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const m = new THREE.Points(geo, new THREE.PointsMaterial({ color: col, size, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); g.add(m);
  if (drift) c.tick((t, dt, P, ri) => { if (ri !== r.i) return; m.position.set(Math.sin(t * 0.13) * drift, Math.sin(t * 0.21) * drift, Math.cos(t * 0.17) * drift); });
  return m;
}
// a row of bulbs on a sagging wire, one instanced mesh
function garland(c, g, a, b, sag, n, col = 0xffd890, boost = 2.2, R = 0.05) {
  const { THREE } = c, im = new THREE.InstancedMesh(new THREE.SphereGeometry(R, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(boost), toneMapped: false }), n), m4 = new THREE.Matrix4(), pts = [];
  for (let i = 0; i < n; i++) { const u = i / (n - 1), x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u - Math.sin(u * PI) * sag, z = a[2] + (b[2] - a[2]) * u; m4.makeTranslation(x, y - R * 1.6, z); im.setMatrixAt(i, m4); pts.push(new THREE.Vector3(x, y, z)); }
  g.add(im); const wire = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x111111 })); g.add(wire); return im;
}
// a glossy puddle that picks up the night
function puddle(c, g, x, z, w, d, ry = 0) { const m = new c.THREE.Mesh(new c.THREE.CircleGeometry(0.5, 28).rotateX(-H2), new c.THREE.MeshStandardMaterial({ color: 0x0c0e14, metalness: 0.9, roughness: 0.04, transparent: true, opacity: 0.85, polygonOffset: true, polygonOffsetFactor: -3 })); m.scale.set(w, 1, d); m.rotation.y = ry; m.position.set(x, 0.012, z); g.add(m); return m; }
// the floor slab the set was built with
const floorOf = (g) => g.children.find((m) => m.isMesh && m.geometry.parameters && m.geometry.parameters.width === 20 && m.geometry.parameters.depth === 16 && Math.abs(m.position.y + 0.05) < 1e-3);
// a canvas texture that repeats
function rep(c, w, h, draw, rx, ry) { const t = c.canvasTex(w, h, draw); t.wrapS = t.wrapT = c.THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; }
// the hex pavers of Central Park
function hexTex(c, base, line) {
  return rep(c, 512, 512, (q, w, h) => {
    q.fillStyle = line; q.fillRect(0, 0, w, h); const R = w / 12, dx = R * Math.sqrt(3), dy = R * 1.5;
    for (let j = -1; j < h / dy + 1; j++) for (let i = -1; i < w / dx + 1; i++) { const cx = i * dx + (j % 2 ? dx / 2 : 0), cy = j * dy; const v = (Math.sin(i * 12.9 + j * 78.2) * 43758.5) % 1; q.fillStyle = base; q.globalAlpha = 0.85 + Math.abs(v) * 0.15; q.beginPath(); for (let k = 0; k < 6; k++) { const a = PI / 6 + k * PI / 3; q.lineTo(cx + Math.cos(a) * R * 0.9, cy + Math.sin(a) * R * 0.9); } q.fill(); }
    q.globalAlpha = 0.1; for (let k = 0; k < 2500; k++) { q.fillStyle = Math.random() < 0.5 ? '#000' : '#fff'; q.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  }, 10, 8);
}
// an image laid on the floor so that, from one spot, it stands up: rays from the eye through an upright picture, cut by the floor
function anamorph(c, g, map, [ex, ez], yaw, d, w, h, eyeY = 1.62, nx = 20, ny = 40) {
  const { THREE } = c, fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = -fz, rz = fx, pos = [], uv = [], idx = [];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const u = i / nx, v = j / ny, px = ex + fx * d + rx * (u - 0.5) * w, pz = ez + fz * d + rz * (u - 0.5) * w, py = v * h, t = eyeY / (eyeY - py);
    pos.push(ex + (px - ex) * t, 0.016, ez + (pz - ez) * t); uv.push(u, v);
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, cc = a + nx + 1, dd = cc + 1; idx.push(a, b, cc, b, dd, cc); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map, transparent: true, roughness: 0.75, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, side: THREE.DoubleSide })); g.add(m); return m;
}
// a brass spot on the floor: stand here
function spot(c, K, g, x, z, text, col = '#f5c542') {
  return floorDecal(K, g, 0.9, 0.9, x, z, (q, w, h) => { q.strokeStyle = col; q.lineWidth = w * 0.05; q.beginPath(); q.arc(w / 2, h / 2, w * 0.44, 0, 7); q.stroke(); K.eyeFlower(q, w / 2, h * 0.42, w * 0.2); q.fillStyle = col; q.font = `800 ${w * 0.075}px ${c.MONO}`; q.textAlign = 'center'; q.fillText(text, w / 2, h * 0.8); }, 0, 256, 0.018);
}
// sky things (a sun, a moon, stars) show over the walls into the next set: only draw them in their own
function own(c, r, objs) { let was = null; c.tick((t, dt, P, ri) => { const on = ri === r.i; if (on !== was) { was = on; objs.forEach((o) => { o.visible = on; }); } }); }
// one pigeon's worth of instanced birds, pecking
function pigeons(c, r, g, K, list) {
  const { THREE } = c, n = list.length, body = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 10, 8).scale(1.5, 0.9, 1), K.std(0x7a7c86, { roughness: 0.8 }), n), head = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), K.std(0x4a5a6a, { roughness: 0.6 }), n), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  g.add(body); g.add(head);
  const put = (t) => list.forEach(([x, z, ry], k) => { const peck = Math.max(0, Math.sin(t * 3 + k * 1.7)) ** 6 * 0.08; e.set(0, ry, 0); q.setFromEuler(e); body.setMatrixAt(k, m4.compose(v.set(x, 0.1, z), q, one)); head.setMatrixAt(k, m4.compose(v.set(x + Math.cos(ry) * 0.13, 0.17 - peck, z - Math.sin(ry) * 0.13), q, one)); });
  put(0); c.tick((t, dt, P, ri) => { if (ri !== r.i) return; put(t); head.instanceMatrix.needsUpdate = true; });
}

export const PROPS = {};
export const ROOM = {};
export const SWAP = {};

Object.assign(ROOM, {
  // ---------- The Crowd, 1928: the 29th floor, built in forced perspective
  crowd(c, r, g, X, K) {
    const { THREE } = c, Z0 = 4.4, Z1 = -6.6, sAt = (z) => 1 - (Z0 - z) / (Z0 - Z1) * 0.62, yc = (z) => 5.98 - (1 - sAt(z)) * 1.6;
    r.post = { ...r.post, bloom: 1.15, vig: 0.5 };
    // ILLUSION: a cafe wall runner down the aisle. Every mortar line is parallel, every one looks like a wedge, and it shrinks with the room
    const cw = c.canvasTex(256, 128, (q, w, h) => { q.fillStyle = '#808080'; q.fillRect(0, 0, w, h); const N = 6, tw = w / N, rh = h / 2; for (let row = 0; row < 2; row++) for (let i = -1; i <= N; i++) { q.fillStyle = i % 2 ? '#f4f4f0' : '#0a0a0a'; q.fillRect(i * tw + row * tw / 2, row * rh + 2, tw, rh - 4); } });
    cw.wrapS = cw.wrapT = THREE.RepeatWrapping;
    const NZ = 60, zA = 5.6, zB = -6.6, pos = [], uv = [], idx = []; let v = 0;
    for (let k = 0; k <= NZ; k++) { const z = zA + (zB - zA) * k / NZ, s = sAt(z), hw = 0.95 * s; if (k) v += ((zA - zB) / NZ) / (0.84 * s); pos.push(10 - hw, 0.017, z, 10 + hw, 0.017, z); uv.push(0, v, 1, v); if (k < NZ) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); rg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); rg.setIndex(idx); rg.computeVertexNormals();
    const runner = new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ map: cw, roughness: 0.28, metalness: 0.05, polygonOffset: true, polygonOffsetFactor: -2 })); g.add(runner);
    // brass edges on the runner, converging with it
    const brass = K.std(0xd8c070, { metalness: 1, roughness: 0.3 });
    [-1, 1].forEach((sd) => { const a = new THREE.Vector3(10 + sd * 1.0 * sAt(zA), 0.02, zA), b = new THREE.Vector3(10 + sd * 1.0 * sAt(zB), 0.02, zB), m = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, a.distanceTo(b)), brass); m.position.copy(a).add(b).multiplyScalar(0.5); m.lookAt(b.x, 0.02, b.z); g.add(m); });
    c.clickable(runner, () => c.egg('crowd_cafewall', 'Every line on this runner is dead straight and dead parallel. Your eye bends them into wedges anyway. MLow counted the tiles: none of them moved.'), 'The tiled runner');
    // the desks' own matrices: a sheet of paper and a ledger on every one, a green lamp on every third
    const desk = g.children.find((m) => m.isInstancedMesh && m.count === 54), m4 = new THREE.Matrix4(), m5 = new THREE.Matrix4(), off = new THREE.Matrix4();
    if (desk) {
      const paper = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.21, 0.29).rotateX(-H2).rotateY(0.2).translate(0.28, 0.775, 0.05), K.std(0xf8f8f2, { roughness: 0.9 }), 54);
      const ledger = new THREE.InstancedMesh(new THREE.BoxGeometry(0.26, 0.05, 0.34).translate(-0.35, 0.795, 0.08), K.std(0x2a2a2a, { roughness: 0.6 }), 54);
      const shade = new THREE.InstancedMesh(new THREE.ConeGeometry(0.09, 0.08, 14, 1, true).translate(0.48, 1.05, -0.2), K.std(0x3a4a3a, { metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide }), 18);
      const bulb = new THREE.InstancedMesh(new THREE.SphereGeometry(0.04, 8, 6).translate(0.48, 1.0, -0.2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff0c8).multiplyScalar(2.4), toneMapped: false }), 18);
      const stem = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.012, 0.28).translate(0.48, 0.91, -0.2), brass, 18);
      for (let k = 0; k < 54; k++) { desk.getMatrixAt(k, m4); paper.setMatrixAt(k, m4); ledger.setMatrixAt(k, m4); if (k % 3 === 1) { const j = (k - 1) / 3; shade.setMatrixAt(j, m4); bulb.setMatrixAt(j, m4); stem.setMatrixAt(j, m4); } }
      [paper, ledger, shade, bulb, stem].forEach((m) => g.add(m));
    }
    // overhead: beams across the ceiling at every row, pendant globes over the aisle, light falling to the runner
    const ROWS = 9, beamI = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.14, 0.22), K.std(0x2a2a2a, { roughness: 0.5 }), ROWS), q4 = new THREE.Quaternion(), vv = new THREE.Vector3(), sc = new THREE.Vector3();
    for (let j = 0; j < ROWS; j++) { const z = Z0 - j * (Z0 - Z1) / (ROWS - 1), s = sAt(z); beamI.setMatrixAt(j, m5.compose(vv.set(10, yc(z) - 0.07, z + 0.69 * s), q4, sc.set(15 * s, s, s))); }
    g.add(beamI);
    const globe = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff6e0).multiplyScalar(2.6), toneMapped: false }), cord = K.std(0x111111);
    [0, 2, 4, 6, 8].forEach((j) => { const z = Z0 - j * (Z0 - Z1) / (ROWS - 1), s = sAt(z), top = yc(z), L = 1.3 * s, gy = top - L;
      g.add(c.slab(0.015 * s, L, 0.015 * s, cord, 10, top - L / 2, z)); const gm = new THREE.Mesh(new THREE.SphereGeometry(0.2 * s, 16, 12), globe); gm.position.set(10, gy, z); g.add(gm);
      glow(c, K, g, 10, gy, z, 1.4 * s, 'rgba(255,245,220,.75)'); cone(c, g, 10, gy - 0.1 * s, z, 0.22 * s, 1.1 * s, gy - 0.1 * s, 0xfff4e0, 0.07); pool(c, g, 10, z, 3.0 * s, 0xfff4e0, 0.28); });
    // window light from the west, slanting across the clerks, with dust in it
    [-4.2, -0.8, 2.4].forEach((z, k) => beam(c, g, 0.3, 5.7, z, 1.5, 7.5, -H2, 0.85 + k * 0.05, 0xf4f0e0, 0.07));
    motes(c, r, g, 260, [0.5, 8], [0.4, 5.6], [-6, 4], 0xfff8e8, 0.03, 0.5);
    // the pneumatic tube along the ceiling, and its capsule shooting up and down the floor
    const ta = new THREE.Vector3(10.9, yc(5.4) - 0.25, 5.4), tb = new THREE.Vector3(10.9 - 0.4, yc(-6.4) - 0.25, -6.4), tube = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, ta.distanceTo(tb), 10, 1, true), K.std(0xc8b070, { metalness: 0.9, roughness: 0.25, transparent: true, opacity: 0.7 }));
    tube.position.copy(ta).add(tb).multiplyScalar(0.5); tube.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tb.clone().sub(ta).normalize()); g.add(tube);
    const cap = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.12, 4, 8), K.std(0x8a6a2a, { metalness: 1, roughness: 0.3 })); cap.quaternion.copy(tube.quaternion); g.add(cap);
    const capGlow = glow(c, K, g, 0, 0, 0, 0.35, 'rgba(255,230,160,.8)');
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const u = (Math.sin(t * 0.7) + 1) / 2; cap.position.lerpVectors(ta, tb, u); capGlow.position.copy(cap.position); });
    c.clickable(cap, () => { c.sound.whoosh(0.3, 1.6); c.egg('crowd_tube', 'A capsule in the pneumatic tube, addressed to desk 137: you have been counted. MLow sent it the length of the 29th floor to say so.'); }, 'A capsule in the tube');
    // signs over the rows, smaller and smaller
    [1, 3, 5, 7].forEach((j) => { const z = Z0 - j * (Z0 - Z1) / (ROWS - 1), s = sAt(z); const sg = c.sign(`ROW ${j + 1}\nCLAIMS DEPT.`, { w: 1.1, h: 0.36, bg: '#f4f4f0', fg: '#111', font: c.SERIF, weight: 800, border: '#111' }); sg.scale.setScalar(s); sg.position.set(10, yc(z) - 0.9 * s, z); g.add(sg); g.add(c.slab(0.01, 0.6 * s, 0.01, cord, 10 - 0.4 * s, yc(z) - 0.42 * s, z)); g.add(c.slab(0.01, 0.6 * s, 0.01, cord, 10 + 0.4 * s, yc(z) - 0.42 * s, z)); });
    // paper drifting down from the ceiling, all day long
    const NP = c.MOBILE ? 10 : 20, fall = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.21, 0.28), new THREE.MeshStandardMaterial({ color: 0xf8f8f2, side: THREE.DoubleSide, roughness: 0.9 }), NP), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1);
    const fp = Array.from({ length: NP }, (_, k) => [2 + Math.random() * 16, -6 + Math.random() * 11, Math.random() * 10]); g.add(fall); fall.frustumCulled = false;
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; fp.forEach(([x, z, o], k) => { const u = ((t * 0.09 + o / 10) % 1), y = 5.4 * (1 - u); e.set(Math.sin(t * 2 + o) * 0.9, t * 0.8 + o, Math.cos(t * 1.7 + o) * 0.6); q4.setFromEuler(e); fall.setMatrixAt(k, m5.compose(vv.set(x + Math.sin(t + o) * 0.5, Math.max(0.03, y), z), q4, one)); }); fall.instanceMatrix.needsUpdate = true; });
  },

  // ---------- The Producers, 1967: the fountain at Lincoln Center, opening night
  producers(c, r, g, X, K) {
    const { THREE } = c, FX = 10, FZ = -1.8;
    r.post = { ...r.post, bloom: 1.0 };
    // ILLUSION: peripheral drift. The paving round the fountain turns, one ring each way, while nothing moves at all
    const SN = ['#060608', '#1d3fb8', '#f8f6f0', '#f5c542'];
    const snakes = c.canvasTex(1024, 1024, (q, w) => { const cx = w / 2, pm = w / 9; [[2.95, 3.4, 1], [3.4, 3.85, -1], [3.85, 4.3, 1]].forEach(([a, b, dir]) => { const N = 64; for (let i = 0; i < N; i++) for (let s = 0; s < 4; s++) { const k = dir > 0 ? s : 3 - s, a0 = (i + s / 4) / N * PI * 2, a1 = (i + (s + 1) / 4) / N * PI * 2 + 0.002; q.fillStyle = SN[k]; q.beginPath(); q.arc(cx, cx, b * pm, a0, a1); q.arc(cx, cx, a * pm, a1, a0, true); q.closePath(); q.fill(); } q.strokeStyle = '#c9a033'; q.lineWidth = 5; q.beginPath(); q.arc(cx, cx, b * pm, 0, 7); q.stroke(); }); q.beginPath(); q.arc(cx, cx, 2.95 * pm, 0, 7); q.stroke(); });
    const ring = new THREE.Mesh(new THREE.PlaneGeometry(9, 9).rotateX(-H2), new THREE.MeshBasicMaterial({ map: snakes, transparent: true, color: new THREE.Color(0.62, 0.62, 0.62), polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false })); ring.position.set(FX, 0.016, FZ); g.add(ring);
    c.clickable(ring, () => c.egg('producers_drift', 'The paving is turning, one ring one way and the next ring the other. It is not. Look straight at it and it stops dead, like a show the critics have seen.'), 'The paving round the fountain');
    // the fountain lit from under the water, its jets lit from below, spray in the air, glints on the surface
    for (let k = 0; k < 18; k++) { const a = k / 18 * PI * 2; glow(c, K, g, FX + Math.cos(a) * 2.3, 0.42, FZ + Math.sin(a) * 2.3, 0.55, 'rgba(255,214,120,.9)'); }
    cone(c, g, FX, 0.4, FZ, 1.4, 0.3, 6.5, 0xffe2a0, 0.04, true);
    const mist = [0, 1, 2, 3, 4].map((k) => glow(c, K, g, FX + Math.cos(k * 1.3) * 1.4, 1.1 + k * 0.5, FZ + Math.sin(k * 1.3) * 1.2, 3.2, 'rgba(255,236,200,.22)', 0.5));
    const gl = motes(c, r, g, 70, [FX - 2.2, FX + 2.2], [0.39, 0.42], [FZ - 2.2, FZ + 2.2], 0xfff4d0, 0.045, 0.9, 0);
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return; mist.forEach((m, k) => { m.material.opacity = 0.35 + Math.sin(t * 0.8 + k) * 0.2; }); gl.material.opacity = 0.5 + Math.sin(t * 7) * 0.4; });
    // strings of bulbs across the plaza, overhead
    [-5.4, -2.4, 0.8, 3.6].forEach((z, k) => garland(c, g, [0.3, 3.7, z], [19.7, 3.7, z + (k % 2 ? 0.6 : -0.6)], 0.7, 28, 0xffd890, 2.4));
    // the moon over Lincoln Center, and the stars the city lets you have
    const moon = new THREE.Mesh(new THREE.CircleGeometry(0.6, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff6e0).multiplyScalar(1.8), toneMapped: false, fog: false })); moon.position.set(15.5, 8.6, -7.2); g.add(moon);
    own(c, r, [moon, glow(c, K, g, 15.5, 8.6, -7.25, 3.6, 'rgba(255,246,220,.55)'), motes(c, r, g, 360, [-2, 22], [7, 16], [-14, 10], 0xffffff, 0.05, 0.8, 0)]);
    c.clickable(moon, () => { c.sound.note(660, 0.2); c.egg('producers_moon', 'A full moon over Lincoln Center on opening night. MLow counts it as the only critic in New York who never walked out.'); }, 'The moon');
    // candles on the cafe tables, rose petals on the red carpet
    [[4.2, -2.8], [15.4, -1.4]].forEach(([x, z]) => { glow(c, K, g, x + 0.15, 0.92, z, 0.35, 'rgba(255,190,90,.8)'); pool(c, g, x, z, 2.2, 0xffb060, 0.3); });
    const NPt = 90, pet = new THREE.InstancedMesh(new THREE.CircleGeometry(0.035, 6).rotateX(-H2), K.std(0xd8102e, { roughness: 0.6, side: THREE.DoubleSide }), NPt), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e = new THREE.Euler(), vv = new THREE.Vector3(), sc = new THREE.Vector3();
    for (let k = 0; k < NPt; k++) { e.set((Math.random() - 0.5) * 0.4, Math.random() * 6, 0); q4.setFromEuler(e); pet.setMatrixAt(k, m4.compose(vv.set(1.6 + Math.random() * 11, 0.02, 3.1 + Math.random() * 1.4), q4, sc.set(1 + Math.random(), 1, 0.6 + Math.random() * 0.6))); } g.add(pet);
    // OPENING NIGHT in lights over the box office, and chasing bulbs round its top
    const bo = new THREE.Group(); bo.position.set(3.4, 0, 0.4); bo.rotation.y = 0.5; g.add(bo);
    const on = neon(c, 'OPENING NIGHT', { w: 1.8, h: 0.34, bg: '#160608', fg: '#ffd27a', font: c.SERIF, weight: 900, border: '#c9a033' }, 1.9); on.position.set(0, 2.25, 0.05); bo.add(on);
    [-0.85, 0.85].forEach((x) => bo.add(c.slab(0.05, 1.2, 0.05, K.std(0xc9a033, { metalness: 1, roughness: 0.3 }), x, 1.6, 0)));
    K.bulbs(bo, -0.72, 0.72, 1.06, 0.46, 12); K.bulbs(bo, -0.72, 0.72, 1.06, -0.46, 12);
    glow(c, K, bo, 0, 2.25, 0.3, 2.6, 'rgba(255,200,110,.35)');
  },

  // ---------- The Devil's Advocate, 1997: the penthouse
  devils(c, r, g, X, K) {
    const { THREE } = c;
    r.post = { ...r.post, bloom: 1.25, vig: 0.55 };
    // ILLUSION: a hollow mask over the fireplace. It is dished in, not out, and so it turns to follow you round the room
    const MW = 1.0, MH = 1.34, NX = 40, NY = 54, mg = new THREE.PlaneGeometry(MW, MH, NX, NY), pa = mg.attributes.position;
    const gs = (x, y, sx, sy) => Math.exp(-(x * x) / sx - (y * y) / sy);
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), e = 1 - (x / 0.5) ** 2 - (y / 0.67) ** 2; let f = e > 0 ? Math.sqrt(e) * 0.3 : 0;
      if (e > 0) { f += 0.13 * gs(x, y + 0.03, 0.004, 0.06) * (y < 0.2 ? 1 : 0.3) + 0.05 * gs(x, y + 0.18, 0.006, 0.004) + 0.05 * gs(Math.abs(x) - 0.17, y - 0.2, 0.02, 0.0015) - 0.08 * gs(Math.abs(x) - 0.17, y - 0.09, 0.006, 0.003) + 0.035 * gs(x, y + 0.36, 0.02, 0.002) - 0.02 * gs(x, y + 0.4, 0.015, 0.0008) + 0.04 * gs(x, y + 0.56, 0.02, 0.006) + 0.03 * gs(Math.abs(x) - 0.22, y + 0.15, 0.01, 0.01); }
      pa.setZ(i, -f * 0.55); }
    mg.computeVertexNormals();
    const alpha = c.canvasTex(64, 86, (q, w, h) => { q.fillStyle = '#000'; q.fillRect(0, 0, w, h); q.fillStyle = '#fff'; q.beginPath(); q.ellipse(w / 2, h / 2, w * 0.49, h * 0.495, 0, 0, 7); q.fill(); });
    const mask = new THREE.Group(); mask.position.set(0.35, 3.15, -1.0); mask.rotation.y = H2; g.add(mask);
    // painted the way a face lit from above would fall, so the hollow reads as a face standing out of the wall
    const shade = c.canvasTex(128, 172, (q, w, h) => { q.fillStyle = '#4a3010'; q.fillRect(0, 0, w, h); const rg2 = q.createRadialGradient(w / 2, h * 0.36, 4, w / 2, h * 0.45, w * 0.6); rg2.addColorStop(0, '#ffe2a0'); rg2.addColorStop(0.5, '#c89040'); rg2.addColorStop(1, '#3a2408'); q.fillStyle = rg2; q.beginPath(); q.ellipse(w / 2, h / 2, w * 0.49, h * 0.49, 0, 0, 7); q.fill();
      q.fillStyle = 'rgba(255,240,200,.75)'; q.fillRect(w / 2 - 5, h * 0.36, 10, h * 0.2); q.beginPath(); q.ellipse(w / 2, h * 0.6, 9, 6, 0, 0, 7); q.fill();
      q.fillStyle = 'rgba(30,12,4,.85)'; [-1, 1].forEach((sd) => { q.beginPath(); q.ellipse(w / 2 + sd * w * 0.17, h * 0.42, 15, 9, 0, 0, 7); q.fill(); }); q.fillRect(w / 2 - 18, h * 0.74, 36, 4);
      q.fillStyle = 'rgba(255,220,150,.45)'; [-1, 1].forEach((sd) => { q.beginPath(); q.ellipse(w / 2 + sd * w * 0.24, h * 0.6, 12, 9, 0, 0, 7); q.fill(); q.beginPath(); q.ellipse(w / 2 + sd * w * 0.17, h * 0.33, 16, 5, 0, 0, 7); q.fill(); }); });
    const face = new THREE.Mesh(mg, new THREE.MeshStandardMaterial({ map: shade, emissiveMap: shade, emissive: 0xffffff, emissiveIntensity: 0.95, metalness: 0.5, roughness: 0.32, alphaMap: alpha, alphaTest: 0.5, side: THREE.DoubleSide })); mask.add(face);
    const hornM = K.std(0x1a0a08, { roughness: 0.3, metalness: 0.4 }); [-1, 1].forEach((s) => { const h = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.32, 10), hornM); h.position.set(s * 0.26, 0.66, -0.12); h.rotation.z = -s * 0.5; mask.add(h); });
    const eyeM = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff3010).multiplyScalar(2.2), toneMapped: false }); [-1, 1].forEach((s) => { const ey = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), eyeM); ey.position.set(s * 0.17, 0.09, 0.02); mask.add(ey); glow(c, K, mask, s * 0.17, 0.09, 0.05, 0.3, 'rgba(255,60,20,.9)'); });
    glow(c, K, mask, 0, 0, -0.3, 2.4, 'rgba(255,170,60,.25)');
    const fr = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.05, 10, 48), K.std(0xc9a033, { metalness: 1, roughness: 0.3 })); fr.scale.y = 1.12; fr.position.set(0.16, 3.15, -1.0); fr.rotation.y = H2; g.add(fr);
    const mx = X(0.35), mz = -1.0;
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const yaw = Math.max(H2 - 1.1, Math.min(H2 + 1.1, Math.atan2(P.x - mx, P.z - mz))), pit = Math.max(-0.25, Math.min(0.15, -0.6 * Math.atan2(3.15 - P.y, Math.hypot(P.x - mx, P.z - mz)))); mask.rotation.y += (yaw - mask.rotation.y) * Math.min(1, dt * 3); mask.rotation.x += (pit - mask.rotation.x) * Math.min(1, dt * 3); });
    c.clickable(face, () => { c.sound.drone(); c.egg('devils_mask', 'The gold face over the fire turns to watch you wherever you walk. It is hollow, dished into the wall. Your eye fills it in, the way MLow fills in a census form.'); }, 'A gold face over the fire');
    // the fire throws its light on the floor, and embers go up the chimney
    glow(c, K, g, 0.9, 0.6, -1.0, 2.6, 'rgba(255,120,40,.55)'); pool(c, g, 2.0, -1.0, 4.0, 0xff7a30, 0.35);
    const NE = c.MOBILE ? 20 : 40, ep = new Float32Array(NE * 3), eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(ep, 3));
    const emb = new THREE.Points(eg, new THREE.PointsMaterial({ color: 0xff9040, size: 0.04, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); emb.frustumCulled = false; g.add(emb);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; for (let k = 0; k < NE; k++) { const u = (t * 0.25 + k / NE) % 1; ep[k * 3] = 0.8 + Math.sin(k * 7.1 + t) * 0.2 * u; ep[k * 3 + 1] = 0.5 + u * 1.3; ep[k * 3 + 2] = -1.0 + Math.sin(k * 3.3) * 0.5; } eg.attributes.position.needsUpdate = true; });
    // a polished black marble floor that holds the reflections
    const fl = floorOf(g); if (fl) { const m = fl.material.clone(); m.color = new THREE.Color(0x3a3436); m.roughnessMap = null; m.roughness = 0.14; m.metalness = 0.25; m.envMapIntensity = 1.4; fl.material = m; }
    // the city at night through the tall windows either side of the view, and the moonlight falling in
    const city = (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#05060e'); gr.addColorStop(0.6, '#141a34'); gr.addColorStop(1, '#2a1a20'); q.fillStyle = gr; q.fillRect(0, 0, w, h);
      for (let b = 0; b < 14; b++) { const bx = Math.random() * w, bw = 20 + Math.random() * 50, bh = h * (0.25 + Math.random() * 0.55); q.fillStyle = '#07080c'; q.fillRect(bx, h - bh, bw, bh); for (let y = h - bh + 6; y < h; y += 9) for (let x = bx + 4; x < bx + bw - 4; x += 7) if (Math.random() < 0.35) { q.fillStyle = Math.random() < 0.8 ? '#ffd88a' : '#bfe0ff'; q.fillRect(x, y, 3, 4); } }
      q.fillStyle = '#0a0806'; for (let x = 0; x <= w; x += w / 3) q.fillRect(x - 5, 0, 10, h); for (let y = 0; y <= h; y += h / 4) q.fillRect(0, y - 5, w, 10); };
    [2.0, 18.0].forEach((x) => { const p = panel(c, 3.4, 4.8, 512, city, 1.0); p.position.set(x, 2.9, -7.97); g.add(p); beam(c, g, x, 5.2, -7.9, 2.6, 6.5, 0, -0.75, 0xa8c0ff, 0.045); });
    // candelabra, chandelier glow, a coffered gold ceiling with a medallion
    const gold = K.std(0xc9a033, { metalness: 1, roughness: 0.3 }), wax = K.std(0xf4ecd8, { roughness: 0.7 }), fl2 = [];
    [[2.6, 6.6], [15.8, 6.8], [4.2, -6.3], [15.8, -6.3]].forEach(([x, z]) => { const cd = new THREE.Group(); cd.position.set(x, 0, z); g.add(cd); c.post(X(x), z, 0.25); cd.add(c.slab(0.05, 1.7, 0.05, gold, 0, 0.85, 0)); cd.add(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.05, 16), gold)); cd.add(c.slab(0.6, 0.04, 0.04, gold, 0, 1.7, 0));
      [-0.28, 0, 0.28].forEach((dx) => { cd.add(c.slab(0.04, 0.22, 0.04, wax, dx, 1.83, 0)); fl2.push(glow(c, K, cd, dx, 2.0, 0, 0.35, 'rgba(255,190,90,.9)')); }); });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; fl2.forEach((f, k) => f.scale.setScalar(0.3 + Math.sin(t * 11 + k * 2.3) * 0.05)); });
    [[6.4, -1.0], [14.2, 0.6]].forEach(([x, z]) => { glow(c, K, g, x, 4.8, z, 2.2, 'rgba(255,210,140,.55)'); cone(c, g, x, 4.4, z, 0.3, 1.8, 4.3, 0xffe0b0, 0.025); });
    const bars = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.06, 0.06), gold, 17), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), vv = new THREE.Vector3(), sc = new THREE.Vector3(), qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), H2);
    for (let k = 0; k < 9; k++) bars.setMatrixAt(k, m4.compose(vv.set(10, 5.95, -7.2 + k * 1.8), q4, sc.set(20, 1, 1))); for (let k = 0; k < 8; k++) bars.setMatrixAt(9 + k, m4.compose(vv.set(1.2 + k * 2.5, 5.95, 0), qy, sc.set(16, 1, 1))); g.add(bars);
    const med = K.decal(2.6, 2.6, (q, w, h) => { q.strokeStyle = '#c9a033'; q.lineWidth = w * 0.03; q.beginPath(); q.arc(w / 2, h / 2, w * 0.47, 0, 7); q.stroke(); K.eyeFlower(q, w / 2, h / 2, w * 0.36, '#3a2a14', '#c9a033'); }, 512); med.rotation.x = H2; med.position.set(10, 5.93, 0); g.add(med);
    // the living wall lit from below, a red haze along its foot
    const strip = new THREE.Mesh(new THREE.BoxGeometry(18.6, 0.04, 0.06), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff5020).multiplyScalar(2), toneMapped: false })); strip.position.set(10, 0.04, 7.4); g.add(strip);
    const haze = new THREE.Mesh(new THREE.PlaneGeometry(18.6, 2.6), addM(c, shaftV(c), 0xff4a20, 0.16)); haze.rotation.z = PI; haze.position.set(10, 1.3, 7.35); g.add(haze);
  },
});

Object.assign(ROOM, {
  // ---------- Die Hard with a Vengeance, 1995: the park fountain, a hot morning
  diehard(c, r, g, X, K) {
    const { THREE } = c, FX = 10, FZ = -2.4;
    r.post = { ...r.post, bloom: 0.9 };
    // Central Park hex pavers under everything
    const fl = floorOf(g); if (fl) { const t = hexTex(c, '#5e5c56', '#22211e'); t.repeat.set(0.6, 0.6); fl.material = new THREE.MeshStandardMaterial({ map: t, roughness: 0.92, color: 0xd0d0d0 }); }
    // ILLUSION: an anamorphic jug painted flat on the paving. From the eye flower spot it stands up, four gallons exactly
    const jug = c.canvasTex(416, 336, (q, w, h) => {
      q.fillStyle = 'rgba(0,0,0,.45)'; q.beginPath(); q.ellipse(w * 0.56, h * 0.95, w * 0.36, h * 0.05, 0, 0, 7); q.fill();
      const bx = w * 0.2, bw = w * 0.6, by = h * 0.24, bh = h * 0.7, gr = q.createLinearGradient(bx, 0, bx + bw, 0); gr.addColorStop(0, '#0e4e8a'); gr.addColorStop(0.3, '#5ab8ff'); gr.addColorStop(0.45, '#d8f2ff'); gr.addColorStop(0.6, '#3a9ae8'); gr.addColorStop(1, '#0a3a6a');
      q.fillStyle = gr; q.beginPath(); q.roundRect(bx, by, bw, bh, 34); q.fill(); q.beginPath(); q.moveTo(bx + 30, by + 4); q.quadraticCurveTo(w / 2, by - 50, bx + bw - 30, by + 4); q.fill();
      q.fillStyle = '#2a7ac8'; q.fillRect(w / 2 - 28, h * 0.06, 56, h * 0.12); q.fillStyle = '#1050a0'; q.fillRect(w / 2 - 34, h * 0.03, 68, h * 0.05);
      q.strokeStyle = 'rgba(255,255,255,.35)'; q.lineWidth = 3; for (let k = 1; k < 5; k++) { q.beginPath(); q.moveTo(bx + 6, by + bh * k / 5); q.lineTo(bx + bw - 6, by + bh * k / 5); q.stroke(); }
      q.fillStyle = '#c8102e'; q.fillRect(bx, by + bh * 0.4, bw, bh * 0.24); q.fillStyle = '#fff'; q.font = `900 ${h * 0.13}px ${c.FONT}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('4 GAL', w / 2, by + bh * 0.52);
      q.fillStyle = 'rgba(255,255,255,.55)'; q.fillRect(bx + bw * 0.16, by + 16, 10, bh * 0.3); q.fillStyle = '#111'; q.font = `800 ${h * 0.06}px ${c.MONO}`; q.fillText('SIMON SAYS', w / 2, h * 0.86); });
    const ana = anamorph(c, g, jug, [4.0, 4.9], 0, 2.4, 1.45, 1.12);
    const sp = spot(c, K, g, 4.0, 4.9, 'SIMON SAYS, STAND HERE');
    const say = () => { c.sound.ding(); c.egg('diehard_jug', 'Simon says stand on the eye flower. From there the jug on the paving stands up, four gallons to the ounce. From anywhere else it is a smear of paint. MLow left the smear for the tourists.'); };
    c.clickable(ana, say, 'A painting on the paving'); c.clickable(sp, say, 'An eye flower in the paving');
    // the fountain running: a jet, rings on the water, spray
    const NJ = c.MOBILE ? 120 : 260, jp = new Float32Array(NJ * 3), jv = new Float32Array(NJ * 3), jl = new Float32Array(NJ), jg = new THREE.BufferGeometry(); jg.setAttribute('position', new THREE.BufferAttribute(jp, 3));
    const jet = new THREE.Points(jg, new THREE.PointsMaterial({ color: 0xe8f6ff, size: 0.06, transparent: true, opacity: 0.85, depthWrite: false })); jet.frustumCulled = false; g.add(jet);
    const rings = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.0, 40).rotateX(-H2), new THREE.MeshBasicMaterial({ color: 0xe8f8ff, transparent: true, opacity: 0.3, depthWrite: false })); m.position.set(FX, 0.6, FZ); g.add(m); return m; });
    glow(c, K, g, FX, 1.4, FZ, 3.0, 'rgba(230,245,255,.35)');
    c.tick((t, dt, P, ri) => { if (!near(r, ri)) return;
      for (let k = 0; k < NJ; k++) { jl[k] -= dt; if (jl[k] <= 0) { const a = Math.random() * PI * 2, sp2 = 0.4 + Math.random() * 0.5; jp[k * 3] = FX; jp[k * 3 + 1] = 0.6; jp[k * 3 + 2] = FZ; jv[k * 3] = Math.cos(a) * sp2; jv[k * 3 + 1] = 5 + Math.random() * 1.2; jv[k * 3 + 2] = Math.sin(a) * sp2; jl[k] = 1.1 + Math.random() * 0.2; } jv[k * 3 + 1] -= 9.8 * dt; jp[k * 3] += jv[k * 3] * dt; jp[k * 3 + 1] = Math.max(0.6, jp[k * 3 + 1] + jv[k * 3 + 1] * dt); jp[k * 3 + 2] += jv[k * 3 + 2] * dt; }
      jg.attributes.position.needsUpdate = true; rings.forEach((m, k) => { const u = (t * 0.35 + k / 3) % 1; m.scale.setScalar(0.2 + u * 1.8); m.material.opacity = 0.35 * (1 - u); }); });
    // a hot sun, its light through the trees, and the leaf shadows it throws
    own(c, r, [glow(c, K, g, 15, 10, -11, 5, 'rgba(255,240,200,.6)'), ...[[4, -0.5], [9, -0.3], [14, -0.6]].map(([x, rx]) => beam(c, g, x, 7, -6, 2.4, 9, 0.35, rx, 0xfff0c8, 0.05))]);
    const leaves = (q, w, h) => { for (let k = 0; k < 140; k++) { q.fillStyle = `rgba(10,20,8,${0.12 + Math.random() * 0.2})`; q.beginPath(); q.ellipse(Math.random() * w, Math.random() * h, 8 + Math.random() * 26, 6 + Math.random() * 16, Math.random() * 3, 0, 7); q.fill(); } };
    const sh1 = floorDecal(K, g, 7, 5, 15.5, 4.2, leaves, 0, 256), sh2 = floorDecal(K, g, 6, 4, 2.6, -4.2, leaves, 1, 256);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; sh1.position.x = 15.5 + Math.sin(t * 0.7) * 0.08; sh2.position.z = -4.2 + Math.sin(t * 0.6 + 1) * 0.08; });
    // leaves coming down from the park trees
    const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), vv = new THREE.Vector3(), sc = new THREE.Vector3();
    motes(c, r, g, 70, [0, 20], [0.2, 3.6], [-6, 7], 0xc8a040, 0.07, 0.8, 0.25);
    // flower beds along the south wall, pigeons on the paving
    const fcol = [0xff4fa3, 0xf5c542, 0xffffff, 0xc8102e, 0x8a5aff], fb = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 8, 6), K.std(0xffffff, { roughness: 0.6 }), 64), col = new THREE.Color();
    [[7.6, 7.2], [12.4, 7.2]].forEach(([x, z], j) => { g.add(c.slab(2.4, 0.32, 0.7, K.std(0x5a3a20, { roughness: 0.8 }), x, 0.16, z)); g.add(c.slab(2.3, 0.04, 0.62, K.std(0x2a1a10, { roughness: 1 }), x, 0.33, z)); c.post(X(x - 0.8), z, 0.4); c.post(X(x + 0.8), z, 0.4);
      for (let k = 0; k < 32; k++) { const i = j * 32 + k; fb.setMatrixAt(i, m4.compose(vv.set(x - 1.05 + (k % 16) * 0.14, 0.42 + (k % 3) * 0.05, z - 0.16 + (k >> 4) * 0.3), q4, sc.setScalar(1))); fb.setColorAt(i, col.setHex(fcol[(k * 7 + j) % 5])); } });
    g.add(fb); pigeons(c, r, g, K, [[3.2, 1.6, 0.3], [3.7, 2.2, 2.0], [2.6, 2.6, 4.0], [14.2, 4.6, 1.2], [14.8, 5.2, 3.1], [15.6, 4.4, 5.0], [8.4, 4.6, 2.4], [11.8, 5.6, 0.8], [6.8, 3.0, 5.6], [17.2, 3.2, 1.9]]);
    // a parks sign by the fountain
    const ps = c.sign('N3W YORK PARKS\nSIMON SAYS NO SWIMMING', { w: 1.2, h: 0.5, bg: '#1f4a34', fg: '#f4ead2', font: c.SERIF, weight: 800, border: '#f4ead2' }); ps.position.set(13.4, 1.5, -5.0); ps.rotation.y = -0.4; g.add(ps); g.add(c.slab(0.06, 1.5, 0.06, K.std(0x1f4a34, { metalness: 0.5 }), 13.4, 0.75, -5.02)); c.post(X(13.4), -5.0, 0.15);
  },

  // ---------- Crocodile Dundee, 1986: a street off Fifth, late
  dundee(c, r, g, X, K) {
    const { THREE } = c;
    r.post = { ...r.post, bloom: 1.2 };
    // ILLUSION: a painted open shaft in the street. Walk right over it; it goes down forever, and something down there is looking up
    const PX = 10, PZ = 1.0, PR = 1.15;
    // painted for a walker three metres south: each ring of the shaft is where a ray to it cuts the street, so they slide toward you and shrink
    const pit = floorDecal(K, g, PR * 2.3, PR * 2.3, PX, PZ, (q, w, h) => {
      const cx = w / 2, cy = h / 2, R0 = w * 0.42, pm = w / (PR * 2.3), L = 3.0 * pm, ey = cy + L, EYE = 1.62;
      q.save(); q.beginPath(); q.arc(cx, cy, R0, 0, 7); q.clip(); q.fillStyle = '#000'; q.fillRect(0, 0, w, h);
      for (let d = 0; d <= 2.6; d += 0.05) { const k = EYE / (EYE + d), rr = R0 * k, yy = ey + (cy - ey) * k, l = Math.max(0, 1 - d / 2.0) ** 1.6; const br = ((d / 0.24) | 0) % 2;
        q.fillStyle = `rgb(${(110 + br * 18) * l + 4 | 0},${(70 + br * 10) * l + 3 | 0},${(52 + br * 8) * l + 3 | 0})`; q.beginPath(); q.arc(cx, yy, rr, 0, 7); q.fill(); }
      for (let d = 0.24; d < 2.0; d += 0.24) { const k = EYE / (EYE + d); q.strokeStyle = `rgba(0,0,0,${0.5})`; q.lineWidth = 2; q.beginPath(); q.arc(cx, ey + (cy - ey) * k, R0 * k, PI * 1.05, PI * 1.95); q.stroke(); }
      for (let d = 0.15; d < 1.8; d += 0.3) { const k = EYE / (EYE + d), yy = ey + (cy - ey) * k - R0 * k * 0.97, l = 1 - d / 2; q.strokeStyle = `rgba(${200 * l | 0},${190 * l | 0},${170 * l | 0},1)`; q.lineWidth = 5 * k; q.beginPath(); q.moveTo(cx - 40 * k, yy + 8 * k); q.lineTo(cx + 40 * k, yy + 8 * k); q.stroke(); }
      const ke = EYE / (EYE + 1.5), ye = ey + (cy - ey) * ke - R0 * ke * 0.7; q.fillStyle = '#c8ff40'; [-1, 1].forEach((sd) => { q.beginPath(); q.ellipse(cx + sd * 12, ye, 5, 3, 0, 0, 7); q.fill(); });
      q.restore(); q.lineWidth = w * 0.04; q.strokeStyle = '#3a3a3e'; q.beginPath(); q.arc(cx, cy, R0 + w * 0.02, 0, 7); q.stroke(); q.fillStyle = '#8a8a90'; for (let b = 0; b < 24; b++) { const a = b / 24 * PI * 2; q.beginPath(); q.arc(cx + Math.cos(a) * (R0 + w * 0.02), cy + Math.sin(a) * (R0 + w * 0.02), 3, 0, 7); q.fill(); } }, 0, 512, 0.017);
    const ke = 1.62 / 3.12, eyeZ = PZ + ((3.0 + PR * 0.84 * 0) - (3.0 + PR) * ke) * 1 + PR * ke * 0.3;
    const eyeM = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xc8ff40).multiplyScalar(2.2), toneMapped: false }), eyes = new THREE.Group(); eyes.position.set(PX, 0.022, eyeZ); g.add(eyes);
    [-1, 1].forEach((s) => { const e = new THREE.Mesh(new THREE.CircleGeometry(0.014, 10).rotateX(-H2), eyeM); e.position.x = s * 0.06; eyes.add(e); glow(c, K, eyes, s * 0.06, 0.02, 0, 0.1, 'rgba(200,255,80,.9)'); });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; eyes.visible = (t % 4.2) > 0.18; });
    const collar = new THREE.Mesh(new THREE.TorusGeometry(PR * 0.98, 0.04, 6, 40).rotateX(H2), K.std(0x2a2a2c, { metalness: 0.9, roughness: 0.4 })); collar.position.set(PX, 0.02, PZ); g.add(collar);
    const cover = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.05, 32), K.std(0x3a3a3e, { metalness: 0.8, roughness: 0.5 })); cover.position.set(PX + 1.75, 0.03, PZ + 0.9); g.add(cover);
    const cd = K.decal(1.1, 1.1, (q, w, h) => { q.strokeStyle = '#9a9aa0'; q.lineWidth = 6; for (let k = 1; k < 5; k++) { q.beginPath(); q.arc(w / 2, h / 2, w * k / 10, 0, 7); q.stroke(); } q.fillStyle = '#c8c8cc'; q.font = `800 ${w * 0.1}px ${c.MONO}`; q.textAlign = 'center'; q.fillText('MLOW SEWER', w / 2, h * 0.53); }, 256); cd.rotation.x = -H2; cd.position.set(PX + 1.75, 0.056, PZ + 0.9); g.add(cd);
    K.steam(g, PX, 0.05, PZ - 0.5);
    c.clickable(pit, () => { c.sound.drip(); c.egg('dundee_pit', 'An open shaft, painted flat on Fifth. You are standing on it. Down at the bottom a pair of eyes blinks: the croc from the bush, counted, and in no hurry to come up.'); }, 'An open sewer shaft');
    // the wet street holds every light
    [[5.0, -3.2, 1.6, 0.9], [14.6, 0.4, 2.0, 1.0], [7.4, 4.4, 1.4, 0.7], [16.6, 4.8, 1.0, 0.6], [3.2, 1.2, 1.2, 0.8]].forEach(([x, z, w, d], k) => puddle(c, g, x, z, w, d, k));
    // a blade sign over the west pavement, and the lamp's cone of light
    const blade = new THREE.Group(); blade.position.set(0.75, 2.7, 0.6); g.add(blade); blade.add(c.slab(0.9, 0.04, 0.04, K.std(0x1a1a1a, { metalness: 0.8 }), -0.3, 0.75, 0));
    [0, PI].forEach((ry) => { const s = neon(c, 'N3W\nBAR', { w: 0.6, h: 1.2, bg: '#0a0410', fg: '#ff4fa3', font: c.SERIF, weight: 900, border: '#22d3ee' }, 2.0); s.position.z = ry ? -0.03 : 0.03; s.rotation.y = ry; blade.add(s); });
    glow(c, K, blade, 0, 0, 0, 2.6, 'rgba(255,80,170,.4)'); pool(c, g, 1.8, 0.6, 3.2, 0xff4fa3, 0.25);
    cone(c, g, 1.7, 4.15, -1.0, 0.2, 1.8, 4.1, 0xffd8a0, 0.08); pool(c, g, 1.9, -1.0, 4.0, 0xffd8a0, 0.3);
    // a traffic light on the corner, working through its colours
    const tl = new THREE.Group(); tl.position.set(18.5, 0, -5.3); g.add(tl); c.post(X(18.5), -5.3, 0.15); tl.add(c.slab(0.1, 3.4, 0.1, K.std(0x2a3a2a, { metalness: 0.6 }), 0, 1.7, 0)); tl.add(c.slab(0.32, 0.9, 0.3, K.std(0x2a3a2a, { metalness: 0.6 }), 0, 3.0, 0));
    const lampsT = [0xff2a2a, 0xffb020, 0x30ff70].map((col2, k) => { const m = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), new THREE.MeshBasicMaterial({ color: 0x111111, toneMapped: false })); m.position.set(0, 3.28 - k * 0.28, 0.16); tl.add(m); const gw = glow(c, K, tl, 0, 3.28 - k * 0.28, 0.2, 0.8, ['rgba(255,40,40,.9)', 'rgba(255,170,30,.9)', 'rgba(60,255,120,.9)'][k]); return { m, gw, col: new THREE.Color(col2).multiplyScalar(2.2) }; });
    const off = new THREE.Color(0x111111);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const ph = (t % 12) < 5 ? 2 : (t % 12) < 6.5 ? 1 : 0; lampsT.forEach((L, k) => { L.m.material.color.copy(k === ph ? L.col : off); L.gw.visible = k === ph; }); });
    // headlights sweeping past beyond the rope
    const hl = new THREE.Group(); g.add(hl); [-0.6, 0.6].forEach((dz) => glow(c, K, hl, 0, 0.6, dz * 0.4, 1.4, 'rgba(255,250,220,.9)')); const streak = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.5), addM(c, shaftP(c), 0xfff2d0, 0.12)); streak.position.set(-3, 0.6, 0); hl.add(streak);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const u = (t / 7) % 1; hl.position.set(-4 + u * 28, 0, -7.3); });
    // sneakers slung over the wire across the street
    const wire = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.2, 3.9, -3.2), new THREE.Vector3(10, 3.3, -3.2), new THREE.Vector3(19.8, 3.9, -3.2)]), new THREE.LineBasicMaterial({ color: 0x0a0a0a })); g.add(wire);
    const kicks = new THREE.Group(); kicks.position.set(10, 3.3, -3.2); g.add(kicks); [-1, 1].forEach((s) => { const sh = new THREE.Group(); sh.position.set(s * 0.08, -0.45, 0); kicks.add(sh); sh.add(c.slab(0.1, 0.1, 0.28, K.std(0xf4f4f0, { roughness: 0.6 }), 0, 0, 0)); sh.add(c.slab(0.11, 0.03, 0.3, K.std(0xff4fa3, { roughness: 0.6 }), 0, -0.05, 0)); kicks.add(c.slab(0.008, 0.42, 0.008, K.std(0xffffff), s * 0.04, -0.2, 0)); });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; kicks.rotation.x = Math.sin(t * 1.3) * 0.18; kicks.rotation.y = Math.sin(t * 0.7) * 0.4; });
    // fire escapes over the south pavement
    const iron = K.std(0x1a1c20, { metalness: 0.7, roughness: 0.5 }), rail = new THREE.InstancedMesh(new THREE.BoxGeometry(0.025, 0.9, 0.025), iron, 48), m4 = new THREE.Matrix4(); let n = 0;
    [[1.6, 7.4], [12.6, 18.4]].forEach(([a, b]) => { g.add(c.slab(b - a, 0.05, 0.9, iron, (a + b) / 2, 3.25, 7.45)); g.add(c.slab(b - a, 0.04, 0.04, iron, (a + b) / 2, 3.72, 7.0)); for (let x = a; x <= b + 0.01 && n < 48; x += 0.25) rail.setMatrixAt(n++, m4.makeTranslation(x, 3.72 - 0.45, 7.0)); const ld = c.slab(0.5, 0.03, 2.4, iron, b - 0.6, 2.4, 7.3); ld.rotation.x = 0.9; g.add(ld); });
    rail.count = n; g.add(rail);
    // newspapers skittering along the gutter, a low glow over the wet street
    const NN = 10, news = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.4, 0.3).rotateX(-H2), K.std(0xe8e4d8, { roughness: 0.9, side: THREE.DoubleSide }), NN), q4 = new THREE.Quaternion(), e = new THREE.Euler(), vv = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1); news.frustumCulled = false; g.add(news);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; for (let k = 0; k < NN; k++) { const u = (t * 0.05 + k / NN) % 1; e.set(Math.sin(t * 3 + k) * 0.3, t * 0.5 + k, 0); q4.setFromEuler(e); news.setMatrixAt(k, m4.compose(vv.set(u * 20, 0.02 + Math.max(0, Math.sin(t * 2 + k * 3)) * 0.25, 5.8 + Math.sin(k * 2.3) * 1.4), q4, one)); } news.instanceMatrix.needsUpdate = true; });
    const fog = new THREE.Mesh(new THREE.PlaneGeometry(20, 1.4), addM(c, shaftV(c), 0x6a50a0, 0.1)); fog.rotation.z = PI; fog.position.set(10, 0.7, -6.4); g.add(fog);
  },

  // ---------- Hello, Dolly!, 1969 (1890): 14th Street, parade day
  dolly(c, r, g, X, K) {
    const { THREE } = c;
    r.post = { ...r.post, bloom: 0.95 };
    // ILLUSION: Ponzo. Horsecar rails that close in toward the photograph, and two drum majors exactly the same size. The far one is a giant
    const RX = 4.6, Z1 = 5.6, Z2 = -6.4, gap = (z) => 0.3 + (z - Z2) / (Z1 - Z2) * 1.14, steel = K.std(0x4a4a50, { metalness: 0.9, roughness: 0.35 });
    [-1, 1].forEach((s) => { const a = new THREE.Vector3(RX + s * gap(Z1) / 2, 0.03, Z1), b = new THREE.Vector3(RX + s * gap(Z2) / 2, 0.03, Z2), m = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.03, a.distanceTo(b)), steel); m.position.copy(a).add(b).multiplyScalar(0.5); m.lookAt(b); g.add(m); });
    const ties = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.025, 0.16), K.std(0x4a3420, { roughness: 0.9 }), 22), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), vv = new THREE.Vector3(), sc = new THREE.Vector3(); let z = Z1, n = 0;
    while (z > Z2 && n < 22) { const gp = gap(z); ties.setMatrixAt(n++, m4.compose(vv.set(RX, 0.014, z), q4, sc.set(gp + 0.35, 1, gp / 1.44))); z -= 0.75 * gp / 1.44 + 0.12; }
    ties.count = n; g.add(ties);
    const major = (xx, zz) => { const e = K.extra(g, xx, zz, { col: 0xc8102e, ry: 0 }); const shako = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.42, 16), K.std(0xf4f0e0, { roughness: 0.6 })); shako.position.y = 2.12; e.add(shako); const plume = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 10), K.std(0xf5c542, { roughness: 0.5 })); plume.position.y = 2.48; e.add(plume); const baton = c.slab(0.03, 0.9, 0.03, K.std(0xd8b048, { metalness: 1, roughness: 0.3 }), 0.32, 1.25, 0.1); baton.rotation.z = -0.4; e.add(baton); c.post(X(xx), zz, 0.3); return e; };
    const near1 = major(RX - 0.32, 2.2), far1 = major(RX + 0.12, -4.4);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; [near1, far1].forEach((e) => { e.children[e.children.length - 1].rotation.z = -0.4 + Math.sin(t * 5.8) * 0.5; }); });
    [near1, far1].forEach((e) => c.clickable(e, () => { c.sound.whistle(); c.egg('dolly_ponzo', 'Two drum majors, the same man twice, the same height to the inch. The rails close in behind him, so your eye makes the far one a giant. MLow measured them both with a tape.'); }, 'A drum major on the rails'));
    // streamers hanging from the bunting, waving
    const NS = 52, stM = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.06, 0.7).translate(0, -0.35, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: 0.8 }), NS), sCol = [0xc8102e, 0xf4f4f4, 0x1a3a8a, 0xf5c542], cc = new THREE.Color(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1), sp = [];
    for (let k = 0; k < NS; k++) { const row = k % 4, i = (k / 4) | 0, x = 0.8 + i * 1.45, zz = -6 + row * 3.6; sp.push([x, 3.6 - Math.sin(x / 19.6 * PI) * 0.6 - 0.05, zz]); stM.setColorAt(k, cc.setHex(sCol[k % 4])); }
    stM.frustumCulled = false; g.add(stM);
    const putS = (t) => { sp.forEach(([x, y, zz], k) => { e.set(Math.sin(t * 2.2 + k) * 0.35, 0, Math.sin(t * 1.7 + k * 0.7) * 0.2); q4.setFromEuler(e); stM.setMatrixAt(k, m4.compose(vv.set(x, y, zz), q4, one)); }); stM.instanceMatrix.needsUpdate = true; };
    putS(0); c.tick((t, dt, P, ri) => { if (ri === r.i) putS(t); });
    // balloons over the crowd on the curb
    const bal = new THREE.InstancedMesh(new THREE.SphereGeometry(0.17, 14, 10).scale(1, 1.2, 1), K.std(0xffffff, { roughness: 0.25, metalness: 0.05 }), 21), bc = [0xff4fa3, 0x22d3ee, 0xf5c542, 0xc8102e, 0x3b82f6, 0xffffff, 0x2ee88a], bun = [[9.2, -4.6], [9.0, 0.0], [17.6, -3.2]];
    const bpos = bun.flatMap(([x, zz]) => Array.from({ length: 7 }, (_, k) => [x + Math.cos(k * 0.9) * 0.28 * (k ? 1 : 0), 3.0 + (k % 3) * 0.22, zz + Math.sin(k * 0.9) * 0.28 * (k ? 1 : 0)])); bpos.forEach((_, k) => bal.setColorAt(k, cc.setHex(bc[k % 7]))); g.add(bal);
    bun.forEach(([x, zz]) => { const sl = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 7 }, (_, k) => [new THREE.Vector3(x, 1.5, zz), new THREE.Vector3(x + Math.cos(k * 0.9) * 0.28 * (k ? 1 : 0), 2.85 + (k % 3) * 0.22, zz + Math.sin(k * 0.9) * 0.28 * (k ? 1 : 0))]).flat()), new THREE.LineBasicMaterial({ color: 0xdddddd })); g.add(sl); });
    const putB = (t) => { bpos.forEach(([x, y, zz], k) => bal.setMatrixAt(k, m4.makeTranslation(x + Math.sin(t * 0.9 + k) * 0.03, y + Math.sin(t * 1.3 + k) * 0.06, zz))); bal.instanceMatrix.needsUpdate = true; };
    putB(0); c.tick((t, dt, P, ri) => { if (ri === r.i) putB(t); });
    // two flagpoles with the city's colours, waving
    const flagT = c.canvasTex(320, 200, (q, w, h) => { ['#1d3fb8', '#f4f4f0', '#ff7a1a'].forEach((col, k) => { q.fillStyle = col; q.fillRect(k * w / 3, 0, w / 3, h); }); K.eyeFlower(q, w / 2, h / 2, h * 0.3); q.fillStyle = '#1d3fb8'; q.font = `800 ${h * 0.09}px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('N3W YORKERS 1890', w / 2, h * 0.93); });
    const flags = [[1.1, -0.6], [18.9, -0.6]].map(([x, zz]) => { g.add(c.slab(0.07, 6.2, 0.07, K.std(0xe8e0c8, { metalness: 0.4 }), x, 3.1, zz)); const ball = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), K.std(0xd8b048, { metalness: 1, roughness: 0.3 })); ball.position.set(x, 6.25, zz); g.add(ball); c.post(X(x), zz, 0.12);
      const fg = new THREE.PlaneGeometry(1.6, 1.0, 16, 4).translate(0.8, 0, 0), m = new THREE.Mesh(fg, new THREE.MeshStandardMaterial({ map: flagT, side: THREE.DoubleSide, roughness: 0.8 })); m.position.set(x + 0.04, 5.6, zz); m.rotation.y = x > 10 ? PI : 0; g.add(m); return { fg, base: Float32Array.from(fg.attributes.position.array) }; });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; flags.forEach(({ fg, base }, j) => { const pa = fg.attributes.position; for (let i = 0; i < pa.count; i++) { const x = base[i * 3]; pa.setZ(i, Math.sin(x * 3.2 - t * 5 + j) * 0.09 * x); } pa.needsUpdate = true; }); });
    // striped awnings over the west shops, above the pictures
    const awn = c.canvasTex(256, 128, (q, w, h) => { for (let k = 0; k < 8; k++) { q.fillStyle = k % 2 ? '#f4ead2' : '#c8102e'; q.fillRect(k * w / 8, 0, w / 8, h * 0.82); } q.fillStyle = '#c8102e'; for (let k = 0; k < 8; k++) { q.beginPath(); q.arc(k * w / 8 + w / 16, h * 0.82, w / 16, 0, PI); q.fill(); } });
    [-6.6, -4.2, -1.8].forEach((zz) => { const a = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.9), new THREE.MeshStandardMaterial({ map: awn, side: THREE.DoubleSide, roughness: 0.8, transparent: true, alphaTest: 0.1 })); a.position.set(0.5, 3.35, zz); a.rotation.set(0, H2, 0, 'YXZ'); a.rotation.x = -0.95; g.add(a); });
    // a warm sun, confetti hanging in the air, pigeons wheeling overhead
    own(c, r, [glow(c, K, g, 5, 11, -13, 7, 'rgba(255,236,190,.7)'), ...[[6, -0.4], [12, -0.5]].map(([x, rx]) => beam(c, g, x, 8, -7, 3, 10, -0.2, rx, 0xfff0c8, 0.05))]);
    const conf = motes(c, r, g, 260, [0.5, 19.5], [0.6, 4.2], [-7, 7.5], 0xffffff, 0.06, 0.95, 0.3); const cf = new Float32Array(conf.geometry.attributes.position.count * 3); for (let k = 0; k < cf.length / 3; k++) { cc.setHSL(Math.random(), 0.85, 0.6); cf.set([cc.r, cc.g, cc.b], k * 3); } conf.geometry.setAttribute('color', new THREE.BufferAttribute(cf, 3)); conf.material.vertexColors = true; conf.material.blending = THREE.NormalBlending;
    const NB = 12, birds = new THREE.InstancedMesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.22, 0.06, 0), new THREE.Vector3(0, 0, 0.06), new THREE.Vector3(0, 0, -0.06), new THREE.Vector3(0.22, 0.06, 0), new THREE.Vector3(0, 0, 0.06), new THREE.Vector3(0, 0, -0.06)]), new THREE.MeshBasicMaterial({ color: 0x2a2a30, side: THREE.DoubleSide }), NB); birds.frustumCulled = false; g.add(birds);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; for (let k = 0; k < NB; k++) { const a = t * 0.35 + k * 0.52; e.set(0, -a, Math.sin(t * 9 + k) * 0.3); q4.setFromEuler(e); birds.setMatrixAt(k, m4.compose(vv.set(9 + Math.cos(a) * (5 + (k % 3)), 6.2 + Math.sin(t + k) * 0.4, -1 + Math.sin(a) * (3.5 + (k % 2))), q4, one)); } birds.instanceMatrix.needsUpdate = true; });
  },
});

// headlights going by beyond the rope, every few seconds
function headlights(c, K, r, g, z, period = 7, col = 'rgba(255,250,220,.9)') {
  const { THREE } = c, hl = new THREE.Group(); g.add(hl); [-0.25, 0.25].forEach((dz) => glow(c, K, hl, 0, 0.6, dz, 1.3, col)); const st = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.5), addM(c, shaftP(c), 0xfff2d0, 0.1)); st.position.set(-3, 0.6, 0); hl.add(st);
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; hl.position.set(-4 + ((t / period) % 1) * 28, 0, z); });
}
// a string of pennants on a sagging line
function pennants(c, g, a, b, sag, n, cols) {
  const { THREE } = c, tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.Float32BufferAttribute([-0.14, 0, 0, 0.14, 0, 0, 0, -0.3, 0], 3)); tri.computeVertexNormals();
  const im = new THREE.InstancedMesh(tri, new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.8 }), n), m4 = new THREE.Matrix4(), col = new THREE.Color(), pts = [];
  for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u - Math.sin(u * PI) * sag, z = a[2] + (b[2] - a[2]) * u; m4.makeRotationY(Math.atan2(b[2] - a[2], -(b[0] - a[0])) + PI).setPosition(x, y, z); im.setMatrixAt(i, m4); im.setColorAt(i, col.setHex(cols[i % cols.length])); }
  for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push(new THREE.Vector3(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - Math.sin(u * PI) * sag, a[2] + (b[2] - a[2]) * u)); }
  g.add(im); g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x222222 }))); return im;
}

Object.assign(ROOM, {
  // ---------- Stuart Little, 1999: Conservatory Water
  stuart(c, r, g, X, K) {
    const { THREE } = c, PX = 10, PZ = -1.4, RX = 7.6, RZ = 4.2;
    r.post = { ...r.post, bloom: 0.9 };
    const fl = floorOf(g); if (fl) { const t = hexTex(c, '#6e6c66', '#2e2d2a'); t.repeat.set(0.6, 0.6); fl.material = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, color: 0xd8d8d8 }); }
    // the pond was reflecting the night: give it the day's sky instead
    const pond = g.children.find((m) => m.isMesh && m.geometry.type === 'ShapeGeometry'); if (pond) { const sk = c.canvasTex(256, 256, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#a8c8e0'); gr.addColorStop(1, '#3a6a7a'); q.fillStyle = gr; q.fillRect(0, 0, w, h); q.strokeStyle = 'rgba(255,255,255,.18)'; q.lineWidth = 2; for (let k = 0; k < 40; k++) { q.beginPath(); const y = Math.random() * h, x = Math.random() * w; q.moveTo(x, y); q.quadraticCurveTo(x + 12, y - 3, x + 26, y); q.stroke(); } }); pond.material = new THREE.MeshStandardMaterial({ color: 0x5a8a9a, map: sk, emissiveMap: sk, emissive: 0x4a6a7a, metalness: 0.15, roughness: 0.18, envMapIntensity: 0.25 }); }
    // ILLUSION: an Ames room, the Little house in miniature. From the brass spot two identical New Yorkers stand in its far corners: one is a giant, one is mouse sized
    const E = [4.6, 4.2], tgt = [1.8, 0.4], yaw = Math.atan2(-(tgt[0] - E[0]), -(tgt[1] - E[1])), EY = 1.62, D0 = 2.2, DD = 1.0, HW = 0.75, Y0 = 1.05, Y1 = 1.95;
    const A = new THREE.Group(); A.position.set(E[0], 0, E[1]); A.rotation.y = yaw; g.add(A);
    const warp = (x, y, z) => { const u = (x + HW) / (2 * HW), f = Math.max(0, Math.min(1, (-z - D0) / DD)), s = 1 + f * (0.6 - u * 0.82); return [x * s, EY + (y - EY) * s, z * s]; };
    const face = (corner, ux, uy, nx, ny, map) => { const geo = new THREE.PlaneGeometry(1, 1, nx, ny), pa = geo.attributes.position;
      for (let i = 0; i < pa.count; i++) { const a = pa.getX(i) + 0.5, b = pa.getY(i) + 0.5, p = [corner[0] + ux[0] * a + uy[0] * b, corner[1] + ux[1] * a + uy[1] * b, corner[2] + ux[2] * a + uy[2] * b], w = warp(...p); pa.setXYZ(i, w[0], w[1], w[2]); }
      geo.computeVertexNormals(); const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map, side: THREE.DoubleSide, roughness: 0.75 })); A.add(m); return m; };
    const zf = -D0, zb = -D0 - DD;
    const checker = c.canvasTex(256, 256, (q, w) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { q.fillStyle = (i + j) % 2 ? '#f4f0e6' : '#1a1a1a'; q.fillRect(i * w / 8, j * w / 8, w / 8, w / 8); } });
    const backT = c.canvasTex(512, 320, (q, w, h) => { q.fillStyle = '#2f6a5a'; q.fillRect(0, 0, w, h); q.fillStyle = 'rgba(255,255,255,.06)'; for (let x = 0; x < w; x += 24) q.fillRect(x, 0, 10, h); [[0.12, 0.38], [0.6, 0.38]].forEach(([x]) => { const gr = q.createLinearGradient(0, h * 0.18, 0, h * 0.7); gr.addColorStop(0, '#9ad0ff'); gr.addColorStop(1, '#f4e8c8'); q.fillStyle = '#f4ead2'; q.fillRect(w * x - 8, h * 0.16, w * 0.28 + 16, h * 0.56); q.fillStyle = gr; q.fillRect(w * x, h * 0.2, w * 0.28, h * 0.48); q.fillStyle = '#f4ead2'; q.fillRect(w * x + w * 0.135, h * 0.2, 6, h * 0.48); q.fillRect(w * x, h * 0.43, w * 0.28, 6); }); q.fillStyle = '#c8a050'; q.fillRect(0, h * 0.86, w, h * 0.04); });
    const sideT = c.canvasTex(256, 256, (q, w, h) => { q.fillStyle = '#d8c8a0'; q.fillRect(0, 0, w, h); q.fillStyle = 'rgba(160,60,60,.35)'; for (let y = 16; y < h; y += 36) for (let x = 16; x < w; x += 36) { q.beginPath(); q.arc(x + (y % 72 ? 18 : 0), y, 6, 0, 7); q.fill(); } q.fillStyle = '#c8a050'; q.fillRect(0, h * 0.86, w, h * 0.04); });
    const ceilT = c.canvasTex(64, 64, (q, w) => { q.fillStyle = '#f4ead2'; q.fillRect(0, 0, w, w); });
    face([-HW, Y0, zf], [2 * HW, 0, 0], [0, 0, -DD], 16, 10, checker);
    face([-HW, Y1, zb], [2 * HW, 0, 0], [0, 0, DD], 16, 10, ceilT);
    face([-HW, Y0, zb], [2 * HW, 0, 0], [0, Y1 - Y0, 0], 16, 8, backT);
    face([-HW, Y0, zf], [0, 0, -DD], [0, Y1 - Y0, 0], 10, 8, sideT);
    face([HW, Y0, zb], [0, 0, DD], [0, Y1 - Y0, 0], 10, 8, sideT);
    // the posts it stands on, under the four real corners of its floor
    const blk = K.std(0x1a1a1a, { roughness: 0.5 }); [[-HW, zf], [HW, zf], [-HW, zb], [HW, zb]].forEach(([x, z]) => { const w = warp(x, Y0, z); A.add(c.slab(0.06, w[1], 0.06, blk, w[0], w[1] / 2, w[2])); });
    const tw = (x, z) => { const w = warp(x, Y0, z); return w; };
    const twins = [-0.52, 0.52].map((x) => { const w = tw(x, zb + 0.22), e = K.extra(A, w[0], w[2], { col: 0xc8102e }); e.position.y = w[1]; e.scale.setScalar(0.33); const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.12, 14), K.std(0x1a3a8a)); hat.position.y = 2.0; e.add(hat); return e; });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; twins.forEach((e, k) => { e.rotation.y = Math.sin(t * 1.2 + k * 3) * 0.3; }); });
    const sp = spot(c, K, g, E[0], E[1], 'LOOK IN FROM HERE');
    const sg = c.sign('THE LITTLE HOUSE\nTWO NEW YORKERS, ONE SIZE', { w: 1.3, h: 0.36, bg: '#f4ead2', fg: '#1f4a34', font: c.SERIF, weight: 800, border: '#1f4a34' }); sg.position.set(2.3, 1.15, 3.7); sg.rotation.y = yaw; g.add(sg); g.add(c.slab(0.05, 0.95, 0.05, K.std(0x1f4a34), 2.3, 0.48, 3.69)); c.post(X(2.3), 3.7, 0.12);
    const ames = () => { c.sound.note(523, 0.15); c.egg('stuart_ames', 'Two New Yorkers the very same size, one in each far corner of the Little house. From the brass spot one is a giant and one could sail number seven. The room is crooked; you are not. MLow counted them both at full height.'); };
    twins.forEach((e) => c.clickable(e, ames, 'A New Yorker in the little house')); c.clickable(sp, ames, 'A brass spot');
    // the water: rings spreading, glints, autumn leaves afloat
    const rings = [0, 1, 2, 3, 4].map((k) => { const m = new THREE.Mesh(new THREE.RingGeometry(0.46, 0.5, 32).rotateX(-H2), new THREE.MeshBasicMaterial({ color: 0xe8f4ff, transparent: true, opacity: 0.3, depthWrite: false })); m.position.set(PX + Math.cos(k * 2.3) * 4.5, 0.06, PZ + Math.sin(k * 2.3) * 2.2); g.add(m); return m; });
    const gl = motes(c, r, g, 60, [PX - 6, PX + 6], [0.07, 0.08], [PZ - 3, PZ + 3], 0xffffff, 0.035, 0.9, 0);
    const NL = 46, lf = new THREE.InstancedMesh(new THREE.CircleGeometry(0.07, 6).scale(1.6, 1, 1).rotateX(-H2), K.std(0xffffff, { roughness: 0.8, side: THREE.DoubleSide }), NL), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e = new THREE.Euler(), vv = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), col = new THREE.Color(), LC = [0xd86a1a, 0xc8a020, 0xa02a1a, 0xe8902a];
    const lpos = Array.from({ length: NL }, () => { const a = Math.random() * PI * 2, rr = Math.sqrt(Math.random()) * 0.9; return [PX + Math.cos(a) * rr * (RX - 0.6), PZ + Math.sin(a) * rr * (RZ - 0.6), Math.random() * 6]; });
    lpos.forEach(([x, z, a], k) => { lf.setColorAt(k, col.setHex(LC[k % 4])); }); g.add(lf);
    const putL = (t) => { lpos.forEach(([x, z, a], k) => { e.set(0, a + t * 0.05, 0); q4.setFromEuler(e); lf.setMatrixAt(k, m4.compose(vv.set(x + Math.sin(t * 0.1 + k) * 0.3, 0.065, z + Math.cos(t * 0.08 + k) * 0.2), q4, one)); }); lf.instanceMatrix.needsUpdate = true; };
    putL(0);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; putL(t); gl.material.opacity = 0.55 + Math.sin(t * 6) * 0.35; rings.forEach((m, k) => { const u = (t * 0.25 + k / 5) % 1; m.scale.setScalar(0.3 + u * 2.6); m.material.opacity = 0.35 * (1 - u); }); });
    motes(c, r, g, 60, [0, 20], [0.3, 4], [-6, 7], 0xd87a2a, 0.08, 0.9, 0.3);
    // kites over the park, a balloon seller, pennants across the pond
    const kites = [[6, 8.2, -5, 0xff4fa3], [15, 9.0, -4, 0x22d3ee]].map(([x, y, z, k]) => { const kt = new THREE.Group(); kt.position.set(x, y, z); g.add(kt); const dm = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.5, 0), new THREE.Vector3(0.35, 0, 0), new THREE.Vector3(0, -0.6, 0), new THREE.Vector3(0, 0.5, 0), new THREE.Vector3(0, -0.6, 0), new THREE.Vector3(-0.35, 0, 0)]), new THREE.MeshBasicMaterial({ color: k, side: THREE.DoubleSide })); kt.add(dm); const tail = new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 8 }, (_, i) => new THREE.Vector3(Math.sin(i) * 0.1, -0.6 - i * 0.18, 0))), new THREE.LineBasicMaterial({ color: 0xffffff })); kt.add(tail); return kt; });
    own(c, r, kites); c.tick((t, dt, P, ri) => { if (ri !== r.i) return; kites.forEach((k, i) => { k.rotation.z = Math.sin(t * 1.1 + i) * 0.3; k.position.y = 8.4 + i * 0.6 + Math.sin(t * 0.7 + i) * 0.3; }); });
    const vend = K.extra(g, 13.2, 4.4, { col: 0x2a5a8a, ry: PI }); c.post(X(13.2), 4.4, 0.3);
    const bal = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 12, 10).scale(1, 1.2, 1), K.std(0xffffff, { roughness: 0.25 }), 9), bc = [0xff4fa3, 0x22d3ee, 0xf5c542, 0xc8102e, 0x3b82f6, 0x2ee88a]; for (let k = 0; k < 9; k++) { bal.setMatrixAt(k, m4.makeTranslation(13.2 + Math.cos(k * 0.7) * 0.3 * (k % 3 ? 1 : 0.4), 2.8 + (k % 3) * 0.24, 4.4 + Math.sin(k * 0.7) * 0.3)); bal.setColorAt(k, col.setHex(bc[k % 6])); } g.add(bal);
    g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 9 }, (_, k) => [new THREE.Vector3(13.45, 1.3, 4.45), new THREE.Vector3(13.2 + Math.cos(k * 0.7) * 0.3 * (k % 3 ? 1 : 0.4), 2.65 + (k % 3) * 0.24, 4.4 + Math.sin(k * 0.7) * 0.3)]).flat()), new THREE.LineBasicMaterial({ color: 0xdddddd })));
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; bal.position.y = Math.sin(t * 1.3) * 0.05; });
    pennants(c, g, [0.3, 3.8, -6.2], [19.7, 3.8, -6.2], 0.7, 34, [0xc8102e, 0xffffff, 0x1d3fb8, 0xf5c542, 0x2e8a4a]);
    pennants(c, g, [0.3, 3.8, 5.6], [19.7, 3.8, 6.4], 0.6, 34, [0xff4fa3, 0xffffff, 0x22d3ee, 0xf5c542]);
    own(c, r, [glow(c, K, g, 4, 10, -12, 5, 'rgba(255,244,214,.6)'), beam(c, g, 8, 8, -7, 3, 10, -0.15, -0.45, 0xfff4d8, 0.05), beam(c, g, 14, 8, -7, 2.4, 10, 0.2, -0.5, 0xfff4d8, 0.04)]);
  },

  // ---------- Sweet Smell of Success, 1957: Times Square at night, in the rain
  sweetsmell(c, r, g, X, K) {
    const { THREE } = c;
    r.post = { ...r.post, bloom: 1.3 };
    // ILLUSION: moire. A tower of two bar screens, one behind the other; walk past it and bright bands sweep up its face though nothing moves
    const T = new THREE.Group(); T.position.set(16.2, 0, -3.4); T.rotation.y = 0.55; g.add(T); c.post(X(16.2), -3.4, 0.95);
    const iron = K.std(0x141414, { metalness: 0.6, roughness: 0.4 }), TW = 1.5, TH = 2.6, Y0 = 0.7;
    T.add(c.slab(TW + 0.1, Y0, TW + 0.1, iron, 0, Y0 / 2, 0));
    const lit = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffffff).multiplyScalar(1.7), toneMapped: false });
    const barG = new THREE.BoxGeometry(0.022, TH, 0.012), back = new THREE.InstancedMesh(barG, iron, 160), front = new THREE.InstancedMesh(barG, iron, 160), m4 = new THREE.Matrix4(); let nb = 0, nf = 0;
    [0, -H2].forEach((ry) => { const fc = new THREE.Group(); fc.rotation.y = ry; T.add(fc); const pn = new THREE.Mesh(new THREE.PlaneGeometry(TW, TH), lit); pn.position.set(0, Y0 + TH / 2, TW / 2 - 0.3); fc.add(pn);
      const fm = new THREE.Matrix4().makeRotationY(ry); for (let x = -TW / 2 + 0.02; x < TW / 2; x += 0.045) back.setMatrixAt(nb++, m4.makeTranslation(x, Y0 + TH / 2, TW / 2 - 0.29).premultiply(fm)); for (let x = -TW / 2 + 0.02; x < TW / 2; x += 0.049) front.setMatrixAt(nf++, m4.makeTranslation(x, Y0 + TH / 2, TW / 2 + 0.02).premultiply(fm)); });
    back.count = nb; front.count = nf; T.add(back); T.add(front);
    [[-TW / 2, TW / 2], [TW / 2, TW / 2], [-TW / 2, -TW / 2], [TW / 2, -TW / 2]].forEach(([x, z]) => T.add(c.slab(0.08, TH + 0.2, 0.08, iron, x, Y0 + TH / 2, z))); T.add(c.slab(TW + 0.1, 0.12, TW + 0.1, iron, 0, Y0 + TH + 0.06, 0));
    glow(c, K, T, 0, Y0 + TH / 2, 0, 4.2, 'rgba(255,255,255,.3)');
    // the zipper round its top, news running in lights
    const zt = c.canvasTex(1024, 64, (q, w, h) => { q.fillStyle = '#050505'; q.fillRect(0, 0, w, h); q.fillStyle = '#ffffff'; q.font = `700 40px ${c.MONO}`; q.textBaseline = 'middle'; q.fillText('  N3W YORKERS COUNTED TONIGHT  .  THE COLUMN GOES TO PRESS AT MIDNIGHT  .  MLOW SAYS EVERYBODY GETS IN  .', 0, h / 2); for (let y = 0; y < h; y += 4) { q.fillStyle = 'rgba(0,0,0,.45)'; q.fillRect(0, y, w, 1); } });
    zt.wrapS = THREE.RepeatWrapping; zt.repeat.set(0.35, 1);
    const zm = new THREE.MeshBasicMaterial({ map: zt, toneMapped: false }); zm.color.setScalar(1.6); const zip = new THREE.Mesh(new THREE.BoxGeometry(TW + 0.2, 0.36, TW + 0.2), zm); zip.position.y = Y0 + TH + 0.32; T.add(zip);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; zt.offset.x = (t * 0.06) % 1; });
    const hd = neon(c, 'N3W', { w: 1.0, h: 0.5, bg: '#050505', fg: '#ffffff', font: c.SERIF, weight: 900, border: '#ffffff' }, 2.2); hd.position.set(0, Y0 + TH + 0.85, 0); hd.rotation.y = -H2 / 2; T.add(hd);
    c.clickable(zip, () => { c.sound.ticket(); c.egg('sweetsmell_moire', 'Bright bands climbing the tower as you walk past it. Nothing on it moves: two screens of bars, one behind the other, and your feet do the rest. Times Square has run on that since before the column.'); }, 'The news zipper');
    c.clickable(front, () => c.egg('sweetsmell_moire', 'Bright bands climbing the tower as you walk past it. Nothing on it moves: two screens of bars, one behind the other, and your feet do the rest. Times Square has run on that since before the column.'), 'A tower of bars');
    // the wet square: puddles, rain hitting them, steam, the lamp's cone, cars going by
    [[4.4, 1.6, 1.8, 1.0], [9.8, -3.6, 2.4, 1.2], [12.2, 1.2, 1.4, 0.8], [7.0, 5.4, 1.6, 0.9], [17.6, 2.0, 1.2, 0.7], [2.6, -4.4, 1.4, 0.8]].forEach(([x, z, w, d], k) => puddle(c, g, x, z, w, d, k * 0.7));
    const NS = c.MOBILE ? 60 : 140, spP = new Float32Array(NS * 3), spG = new THREE.BufferGeometry(); spG.setAttribute('position', new THREE.BufferAttribute(spP, 3));
    const spl = new THREE.Points(spG, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.7, depthWrite: false })); spl.frustumCulled = false; g.add(spl);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; for (let k = 0; k < NS; k++) if (Math.random() < dt * 8) spP.set([Math.random() * 20, 0.03 + Math.random() * 0.06, -7 + Math.random() * 14.5], k * 3); spG.attributes.position.needsUpdate = true; });
    K.steam(g, 11.8, 0.05, 2.2); K.steam(g, 3.0, 0.05, -2.6);
    cone(c, g, 1.6, 4.1, 5.8, 0.2, 1.7, 4.1, 0xffffff, 0.09); pool(c, g, 1.8, 5.6, 3.6, 0xffffff, 0.25);
    headlights(c, K, r, g, -7.3, 6);
    // the glow of the square over everything, and New Yorkers under umbrellas
    own(c, r, [glow(c, K, g, 10, 7, -9, 14, 'rgba(255,255,255,.18)'), glow(c, K, g, 3, 5.5, -6, 6, 'rgba(255,255,255,.14)')]);
    [[5.4, 0.6, 0.3], [12.4, -0.6, -0.5], [2.6, 2.0, 0.8]].forEach(([x, z, ry]) => { const e = K.extra(g, x, z, { col: 0x2a2a2a, ry }); c.post(X(x), z, 0.35); const um = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.28, 10, 1, true), K.std(0x0a0a0a, { roughness: 0.25, side: THREE.DoubleSide })); um.position.y = 2.35; e.add(um); e.add(c.slab(0.02, 0.8, 0.02, K.std(0x333333), 0, 1.9, 0)); });
    // a second marquee over the east pavement, chasing bulbs
    const mq = new THREE.Group(); mq.position.set(19.3, 3.3, 6.2); mq.rotation.y = -H2; g.add(mq); mq.add(c.slab(2.6, 0.7, 0.3, K.std(0x111111), 0, 0, 0));
    const mt = neon(c, 'THE PALACE  .  N3W YORKERS', { w: 2.4, h: 0.36, bg: '#f4f4f4', fg: '#111', font: c.SERIF, weight: 900 }, 1.3); mt.position.z = 0.16; mq.add(mt);
    K.bulbs(mq, -1.2, 1.2, 0.3, 0.17, 18); K.bulbs(mq, -1.2, 1.2, -0.3, 0.17, 18);
  },

  // ---------- Scent of a Woman, 1992: the ballroom
  scent(c, r, g, X, K) {
    const { THREE } = c;
    r.post = { ...r.post, bloom: 1.15 };
    // ILLUSION: Pepper's ghost. A tilted pane of glass by the floor; at an angle a couple dances inside it, walk up close and there is only glass
    const GR = 1.31, G = new THREE.Group(); G.position.set(6.0, 0, -2.6); G.rotation.y = GR; g.add(G); c.post(X(6.0), -2.6, 0.75);
    const gold = K.std(0xc9a033, { metalness: 1, roughness: 0.3 });
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.1), new THREE.MeshPhysicalMaterial({ color: 0xd8f0ff, transparent: true, opacity: 0.12, roughness: 0.02, metalness: 0.2, side: THREE.DoubleSide, depthWrite: false })); pane.position.y = 1.25; G.add(pane);
    [[0, 2.33, 1.6, 0.06], [0, 0.17, 1.6, 0.06]].forEach(([x, y, w, h]) => G.add(c.slab(w, h, 0.06, gold, x, y, 0))); [-0.78, 0.78].forEach((x) => G.add(c.slab(0.06, 2.22, 0.06, gold, x, 1.25, 0)));
    G.add(c.slab(1.0, 0.08, 0.5, gold, 0, 0.04, 0));
    const ghostT = c.canvasTex(256, 320, (q, w, h) => { const dancer = (x, lean, col) => { q.save(); q.translate(x, h * 0.95); q.rotate(lean); q.fillStyle = col; q.beginPath(); q.moveTo(-26, 0); q.lineTo(-14, -h * 0.5); q.lineTo(14, -h * 0.5); q.lineTo(30, 0); q.fill(); q.fillRect(-18, -h * 0.72, 36, h * 0.24); q.restore(); };
      dancer(w * 0.38, -0.08, 'rgba(190,230,255,.75)'); dancer(w * 0.62, 0.08, 'rgba(220,240,255,.6)'); q.strokeStyle = 'rgba(200,235,255,.8)'; q.lineWidth = 8; q.beginPath(); q.moveTo(w * 0.42, h * 0.32); q.quadraticCurveTo(w / 2, h * 0.22, w * 0.58, h * 0.32); q.stroke();
      K.eyeFlower(q, w * 0.36, h * 0.17, 30, '#d8f0ff', '#8ad8ff'); K.eyeFlower(q, w * 0.64, h * 0.19, 28, '#e8f4ff', '#a8e0ff'); });
    const ghost = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.0), new THREE.MeshBasicMaterial({ map: ghostT, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide })); ghost.material.color.setScalar(1.6); ghost.position.set(0, 1.22, -0.05); G.add(ghost);
    const gwp = new THREE.Vector3(X(6.0), 1.2, -2.6), nrm = new THREE.Vector3(Math.sin(GR), 0, Math.cos(GR)), dv = new THREE.Vector3(); let seen = false;
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; dv.set(P.x - gwp.x, 0, P.z - gwp.z); const d = dv.length(); dv.normalize(); const graze = 1 - Math.abs(dv.dot(nrm)), k = Math.max(0, Math.min(1, (graze - 0.1) / 0.35)) * Math.max(0, Math.min(1, (d - 1.4) / 1.6));
      ghost.material.opacity += (k * 0.9 - ghost.material.opacity) * Math.min(1, dt * 4); ghost.scale.x = Math.cos(t * 1.4) * 0.9 + (Math.cos(t * 1.4) >= 0 ? 0.1 : -0.1); ghost.position.y = 1.2 + Math.abs(Math.sin(t * 2.8)) * 0.03; if (k > 0.8 && !seen) { seen = true; c.sound.note(392, 0.3); } });
    c.clickable(pane, () => { c.sound.note(330, 0.3); c.egg('scent_ghost', 'A couple dancing inside the glass, and nobody on the floor behind it. Walk up and they are gone: a Victorian stage trick, a pane of glass and a light. He danced the tango blind. MLow counted the ghosts anyway.'); }, 'A pane of glass');
    // a glossy herringbone parquet
    const fl = floorOf(g); if (fl) { const t = rep(c, 1024, 1024, (q, w, h) => { const C = 128, PH = 44, sl = 0.6; for (let col = 0; col < w / C; col++) { const dir = col % 2 ? 1 : -1; for (let y = -C; y < h + C; y += PH) { const v = 0.85 + Math.random() * 0.3; q.fillStyle = `rgb(${190 * v | 0},${122 * v | 0},${66 * v | 0})`; const x0 = col * C, y0 = y, y1 = y + dir * C * sl; q.beginPath(); q.moveTo(x0, y0); q.lineTo(x0 + C, y1); q.lineTo(x0 + C, y1 + PH); q.lineTo(x0, y0 + PH); q.closePath(); q.fill(); q.strokeStyle = 'rgba(40,20,8,.55)'; q.lineWidth = 2; q.stroke(); q.strokeStyle = 'rgba(90,50,20,.12)'; q.lineWidth = 1; for (let k = 1; k < 5; k++) { q.beginPath(); q.moveTo(x0, y0 + k * 8); q.lineTo(x0 + C, y1 + k * 8); q.stroke(); } } } }, 1, 1);
      fl.material = new THREE.MeshStandardMaterial({ map: t, roughness: 0.2, metalness: 0.05, envMapIntensity: 1.3 }); }
    // chandeliers glowing, light falling, rosettes over them
    [[10, 5.0, -1.0], [10, 5.0, 4.6], [4, 5.2, 2], [16, 5.2, 2]].forEach(([x, y, z]) => { glow(c, K, g, x, y, z, 2.6, 'rgba(255,214,150,.6)'); cone(c, g, x, y - 0.4, z, 0.4, 2.2, y - 0.4, 0xffe2b0, 0.035); pool(c, g, x, z, 4.4, 0xffd8a0, 0.22);
      const ro = K.decal(1.8, 1.8, (q, w) => { q.strokeStyle = '#c9a033'; q.lineWidth = 8; q.beginPath(); q.arc(w / 2, w / 2, w * 0.45, 0, 7); q.stroke(); for (let k = 0; k < 16; k++) { const a = k / 16 * PI * 2; q.fillStyle = '#c9a033'; q.beginPath(); q.ellipse(w / 2 + Math.cos(a) * w * 0.32, w / 2 + Math.sin(a) * w * 0.32, w * 0.07, w * 0.025, a, 0, 7); q.fill(); } }, 256); ro.rotation.x = H2; ro.position.set(x, 5.93, z); g.add(ro); });
    motes(c, r, g, 220, [2, 18], [0.5, 5], [-5, 6], 0xffe8c0, 0.03, 0.5);
    // red velvet drapes either side of the view
    const vel = K.std(0x6a0a14, { roughness: 0.85, side: THREE.DoubleSide });
    [[1.9, 3.6], [18.1, 3.6]].forEach(([x, w]) => { const geo = new THREE.PlaneGeometry(w, 5.9, 48, 1), pa = geo.attributes.position; for (let i = 0; i < pa.count; i++) pa.setZ(i, Math.sin(pa.getX(i) * 9) * 0.08); geo.computeVertexNormals(); const m = new THREE.Mesh(geo, vel); m.position.set(x, 2.95, -7.8); g.add(m); g.add(c.slab(w + 0.2, 0.3, 0.2, gold, x, 5.85, -7.75)); });
    // a champagne tower on the far table, roses on every table
    const tw = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.02, 0.07, 10), new THREE.MeshPhysicalMaterial({ color: 0xffe8a0, transparent: true, opacity: 0.75, roughness: 0.05, emissive: 0x6a4a10 }), 30), m4 = new THREE.Matrix4(); let n = 0;
    [4, 3, 2, 1].forEach((sz, lv) => { for (let i = 0; i < sz; i++) for (let j = 0; j < sz; j++) if (n < 30) tw.setMatrixAt(n++, m4.makeTranslation(16.6 + (i - (sz - 1) / 2) * 0.12, 0.8 + lv * 0.075, 6.6 + (j - (sz - 1) / 2) * 0.12)); }); tw.count = n; g.add(tw); glow(c, K, g, 16.6, 1.0, 6.6, 0.9, 'rgba(255,220,140,.5)');
    const rose = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.05, 0), K.std(0xb0102a, { roughness: 0.6 }), 63), col = new THREE.Color(); n = 0;
    [[2.6, -4.4], [2.6, -0.6], [3.4, 6.6], [17.4, -0.6], [6.4, 6.6], [13.6, 6.6], [5.4, 2.0], [15.4, 1.4]].forEach(([x, z]) => { for (let k = 0; k < 7; k++) rose.setMatrixAt(n++, m4.makeTranslation(x + 0.18 + Math.cos(k) * 0.07, 0.82 + (k % 2) * 0.04, z + Math.sin(k) * 0.07)); }); rose.count = n; g.add(rose);
    // a follow spot on the colonel and his partner, lamps on the band's stands
    cone(c, g, 14.4, 5.9, -3.0, 0.15, 1.1, 5.9, 0xfff4e0, 0.06); pool(c, g, 14.4, -3.0, 2.6, 0xfff0d0, 0.4);
    [8.8, 9.6, 10.4, 11.2].forEach((x) => { glow(c, K, g, x, 1.35, -5.7, 0.3, 'rgba(255,220,150,.9)'); g.add(c.slab(0.03, 1.0, 0.03, K.std(0x111111, { metalness: 0.6 }), x, 0.8, -5.75)); g.add(c.slab(0.36, 0.26, 0.02, K.std(0x111111), x, 1.25, -5.75)); });
  },
});

// paper coming down from the ceiling, fluttering
function paperFall(c, r, g, n, [x1, x2], [z1, z2], top, col = 0xf8f8f2) {
  const { THREE } = c, N = c.MOBILE ? n >> 1 : n, im = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.2, 0.26), new THREE.MeshStandardMaterial({ color: col, side: THREE.DoubleSide, roughness: 0.9 }), N), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  const fp = Array.from({ length: N }, () => [x1 + Math.random() * (x2 - x1), z1 + Math.random() * (z2 - z1), Math.random() * 10]); im.frustumCulled = false; g.add(im);
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; fp.forEach(([x, z, o], k) => { const u = (t * 0.09 + o / 10) % 1; e.set(Math.sin(t * 2 + o) * 0.9, t * 0.8 + o, Math.cos(t * 1.7 + o) * 0.6); q4.setFromEuler(e); im.setMatrixAt(k, m4.compose(v.set(x + Math.sin(t + o) * 0.5, Math.max(0.03, top * (1 - u)), z), q4, one)); }); im.instanceMatrix.needsUpdate = true; });
  return im;
}
// an iron fire escape along the south wall, above the pictures
function fireEscape(c, K, g, spans) {
  const { THREE } = c, iron = K.std(0x1a1c20, { metalness: 0.7, roughness: 0.5 }), rail = new THREE.InstancedMesh(new THREE.BoxGeometry(0.025, 0.9, 0.025), iron, 60), m4 = new THREE.Matrix4(); let n = 0;
  spans.forEach(([a, b]) => { g.add(c.slab(b - a, 0.05, 0.9, iron, (a + b) / 2, 3.25, 7.45)); g.add(c.slab(b - a, 0.04, 0.04, iron, (a + b) / 2, 3.72, 7.0)); for (let x = a; x <= b + 0.01 && n < 60; x += 0.25) rail.setMatrixAt(n++, m4.makeTranslation(x, 3.27, 7.0)); const ld = c.slab(0.5, 0.03, 2.4, iron, b - 0.6, 2.4, 7.3); ld.rotation.x = 0.9; g.add(ld); });
  rail.count = n; g.add(rail);
}

Object.assign(ROOM, {
  // ---------- Splash, 1984: the tank in the lab
  splash(c, r, g, X, K) {
    const { THREE } = c, tx1 = 5.4, tx2 = 14.6, tz1 = -5.6, tz2 = -0.8, TH = 3.2;
    r.post = { ...r.post, bloom: 1.2 };
    // ILLUSION: an infinity porthole in the east wall. The box behind it is seventy centimetres deep; the tunnel of lights inside goes down forever, and she swims in it
    const PH = new THREE.Group(); PH.position.set(19.62, 1.6, 0.4); PH.rotation.y = -H2; g.add(PH); c.post(X(19.2), 0.4, 0.8);
    const steel = K.std(0x7a8a90, { metalness: 0.85, roughness: 0.3 }), brass = K.std(0xc8a050, { metalness: 1, roughness: 0.25 }), BD = 0.7, BS = 1.5, PR = 0.55;
    const sh = new THREE.Shape(); sh.moveTo(-BS / 2, -BS / 2); sh.lineTo(BS / 2, -BS / 2); sh.lineTo(BS / 2, BS / 2); sh.lineTo(-BS / 2, BS / 2); sh.closePath(); const hole = new THREE.Path(); hole.absarc(0, 0, PR, 0, PI * 2, true); sh.holes.push(hole);
    const front = new THREE.Mesh(new THREE.ShapeGeometry(sh, 48), steel); front.position.z = BD; PH.add(front);
    [[0, BS / 2, BS, 0.02], [0, -BS / 2, BS, 0.02]].forEach(([x, y, w, h]) => PH.add(c.slab(w, h, BD, steel, x, y, BD / 2))); [-BS / 2, BS / 2].forEach((x) => PH.add(c.slab(0.02, BS, BD, steel, x, 0, BD / 2)));
    const ringB = new THREE.Mesh(new THREE.TorusGeometry(PR + 0.04, 0.06, 12, 48), brass); ringB.position.z = BD + 0.02; PH.add(ringB);
    const rv = new THREE.InstancedMesh(new THREE.SphereGeometry(0.022, 8, 6), brass, 16), m4 = new THREE.Matrix4(); for (let k = 0; k < 16; k++) { const a = k / 16 * PI * 2; rv.setMatrixAt(k, m4.makeTranslation(Math.cos(a) * (PR + 0.13), Math.sin(a) * (PR + 0.13), BD + 0.03)); } PH.add(rv);
    const well = new THREE.Mesh(new THREE.CylinderGeometry(PR, 0.06, BD - 0.02, 32, 1, true).rotateX(H2), new THREE.MeshBasicMaterial({ color: 0x021820, side: THREE.BackSide })); well.position.z = BD / 2; PH.add(well);
    const NR = 20, tun = []; for (let k = 0; k < NR; k++) { const f = 1 / (1 + k * 0.32), m = new THREE.Mesh(new THREE.TorusGeometry(PR * 0.93 * f, 0.014 * f + 0.003, 6, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x30e8ff).multiplyScalar(2.4 * Math.pow(0.86, k)), toneMapped: false })); m.position.z = BD - 0.04 - k * (BD - 0.08) / NR * (1 - k / (NR * 2.2)); PH.add(m); tun.push(m); }
    glow(c, K, PH, 0, 0, 0.05, 0.4, 'rgba(120,240,255,.9)');
    const swim = K.decal(0.5, 0.5, (q, w) => { q.fillStyle = '#1a8a6a'; q.beginPath(); q.ellipse(w * 0.5, w * 0.62, w * 0.09, w * 0.3, 0.3, 0, 7); q.fill(); q.beginPath(); q.moveTo(w * 0.62, w * 0.9); q.lineTo(w * 0.42, w * 0.98); q.lineTo(w * 0.5, w * 0.82); q.fill(); K.eyeFlower(q, w * 0.44, w * 0.26, w * 0.13); }, 128); PH.add(swim);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const u = (Math.sin(t * 0.5) + 1) / 2, k = u * (NR - 2), f = 1 / (1 + k * 0.32); swim.position.set(Math.sin(t * 1.3) * PR * 0.5 * f, Math.cos(t * 0.9) * PR * 0.4 * f, BD - 0.06 - k * (BD - 0.08) / NR); swim.scale.setScalar(f); swim.rotation.z = Math.sin(t * 2) * 0.3; tun.forEach((m, i) => { m.material.color.setHex(0x30e8ff).multiplyScalar(2.4 * Math.pow(0.86, i) * (0.75 + 0.25 * Math.sin(t * 3 - i * 0.6))); }); });
    const pl = c.sign('PORTHOLE 3\nDO NOT LEAN ON THE OCEAN', { w: 1.0, h: 0.26, bg: '#0b1020', fg: '#22d3ee', font: c.MONO, weight: 700 }); pl.position.set(19.6, 2.65, 0.4); pl.rotation.y = -H2; g.add(pl);
    c.clickable(front, () => { c.sound.note(660, 0.2); c.egg('splash_porthole', 'A porthole in a lab wall, and a tunnel of light that runs down further than Madison Avenue is long. The box behind it is seventy centimetres deep. She is still in there somewhere, and MLow has her counted.'); }, 'A porthole');
    // caustics: light through moving water, dancing on the floor of the tank and around it
    const caT = rep(c, 256, 256, (q, w, h) => { q.fillStyle = '#000'; q.fillRect(0, 0, w, h); q.strokeStyle = 'rgba(160,240,255,.85)'; for (let k = 0; k < 70; k++) { q.lineWidth = 1 + Math.random() * 2.5; q.beginPath(); const x = Math.random() * w, y = Math.random() * h, rr = 10 + Math.random() * 26; for (let a = 0; a <= 6.3; a += 0.5) { const rx = rr * (0.7 + Math.sin(a * 3 + k) * 0.3); q.lineTo(x + Math.cos(a) * rx, y + Math.sin(a) * rx * 0.8); } q.stroke(); } }, 3, 2);
    const caM = [0, 1].map((k) => { const t = caT.clone(); t.needsUpdate = true; t.repeat.set(3 + k, 2 + k); const m = new THREE.Mesh(new THREE.PlaneGeometry(tx2 - tx1 + 3, tz2 - tz1 + 3).rotateX(-H2), new THREE.MeshBasicMaterial({ map: t, color: 0x60d0ff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); m.position.set(10, 0.02 + k * 0.004, (tz1 + tz2) / 2 + 0.6); g.add(m); return t; });
    // light falling through the water from the surface, swaying
    const rays = [6.8, 8.6, 10.6, 12.6].map((x, k) => beam(c, g, x, TH - 0.35, -3.2 + (k % 2) * 0.8, 0.9, TH - 0.4, 0, 0.12 * (k % 2 ? 1 : -1), 0x80e0ff, 0.09));
    glow(c, K, g, 10, 1.4, -3.2, 7, 'rgba(60,180,220,.28)');
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; caM[0].offset.set(t * 0.02, t * 0.013); caM[1].offset.set(-t * 0.017, t * 0.021); rays.forEach((b, k) => { b.rotation.z = Math.sin(t * 0.6 + k) * 0.08; }); });
    // bubble streams from three air stones
    const NB = 3 * 24, bp = new Float32Array(NB * 3), bgeo = new THREE.BufferGeometry(); bgeo.setAttribute('position', new THREE.BufferAttribute(bp, 3)); const SX = [6.4, 10.2, 13.6];
    const bub = new THREE.Points(bgeo, new THREE.PointsMaterial({ color: 0xe0ffff, size: 0.06, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); bub.frustumCulled = false; g.add(bub);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; for (let k = 0; k < NB; k++) { const s = (k / 24) | 0, u = (t * 0.35 + (k % 24) / 24) % 1; bp[k * 3] = SX[s] + Math.sin(u * 20 + k) * 0.05; bp[k * 3 + 1] = 0.1 + u * (TH - 0.45); bp[k * 3 + 2] = -5.0 + Math.cos(u * 17 + k) * 0.05; } bgeo.attributes.position.needsUpdate = true; });
    // the fluorescent tubes lit, a warning beacon on the tank, pipes along the ceiling
    [[4.0, 3.0], [16.0, 3.0], [10.0, 4.6], [2.6, -3.4]].forEach(([x, z]) => { const s = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.14).rotateX(H2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xe8fbff).multiplyScalar(2.2), toneMapped: false })); s.position.set(x, 5.83, z); g.add(s); cone(c, g, x, 5.8, z, 0.5, 2.0, 5.7, 0xd8f8ff, 0.03); pool(c, g, x, z, 3.6, 0xd8f8ff, 0.18); });
    const bc = new THREE.Group(); bc.position.set(10, TH + 0.12, tz2); g.add(bc); bc.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.18, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffa020).multiplyScalar(1.6), toneMapped: false })));
    const bb = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.5).translate(1.2, 0, 0), addM(c, shaftP(c), 0xffa020, 0.22)); const bbG = new THREE.Group(); bbG.add(bb); bc.add(bbG); glow(c, K, bc, 0, 0, 0, 0.8, 'rgba(255,160,40,.8)');
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; bbG.rotation.y = t * 3; });
    const pipeM = K.std(0x5a6a70, { metalness: 0.8, roughness: 0.35 }); [[5.55, 6.6, 0.09], [5.4, 6.9, 0.06], [5.62, -7.3, 0.11]].forEach(([y, z, rr]) => { const pp = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, 19.4, 12).rotateZ(H2), pipeM); pp.position.set(10, y, z); g.add(pp); });
    [4, 9, 15].forEach((x) => { const v = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 6, 16), K.std(0xc8102e, { roughness: 0.4 })); v.position.set(x, 5.55, 6.4); g.add(v); });
    // the sonar screen on the desk, sweeping, with one blip that is not a fish
    const son = c.canvasTex(256, 256, () => {}), sq = son.userData.canvas.getContext('2d'); const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: son, toneMapped: false })); scr.material.color.setScalar(1.5); scr.position.set(1.62, 1.12, -4.0); scr.rotation.y = H2; g.add(scr); g.add(c.slab(0.12, 0.6, 0.6, K.std(0x2a2e30, { metalness: 0.5 }), 1.52, 1.06, -4.0));
    let st = 0; c.tick((t, dt, P, ri) => { if (ri !== r.i) return; st += dt; if (st < 0.08) return; st = 0; const a = t * 2; sq.fillStyle = 'rgba(0,20,10,.25)'; sq.fillRect(0, 0, 256, 256); sq.strokeStyle = '#30ff90'; sq.lineWidth = 2; [40, 80, 120].forEach((rr) => { sq.beginPath(); sq.arc(128, 128, rr, 0, 7); sq.stroke(); }); sq.beginPath(); sq.moveTo(128, 128); sq.lineTo(128 + Math.cos(a) * 120, 128 + Math.sin(a) * 120); sq.stroke(); const ba = 1.1 + Math.sin(t * 0.3); if (Math.abs(((a - ba) % 6.283 + 6.283) % 6.283) < 0.3) { sq.fillStyle = '#ffffff'; sq.beginPath(); sq.arc(128 + Math.cos(ba) * 70, 128 + Math.sin(ba) * 70, 6, 0, 7); sq.fill(); } son.needsUpdate = true; });
    // wet floor round the tank
    [[4.4, 0.2, 1.4, 0.8], [15.6, -0.2, 1.2, 0.7], [9.0, 0.6, 1.6, 0.5]].forEach(([x, z, w, d], k) => puddle(c, g, x, z, w, d, k));
  },

  // ---------- After Hours, 1985: Spring Street, 3 A.M.
  afterhours(c, r, g, X, K) {
    const { THREE } = c;
    r.post = { ...r.post, bloom: 1.3 };
    // ILLUSION: a neon Penrose triangle hung over Spring Street. Three straight bars that only meet from one spot: the night that loops back on itself
    const C = new THREE.Vector3(9.4, 3.15, -1.8), E = new THREE.Vector3(9.4, 1.62, 4.4), L = 1.5, T = 0.14;
    const toEye = E.clone().sub(C).normalize(), dl = new THREE.Vector3(1, 1, -1).normalize(), q1 = new THREE.Quaternion().setFromUnitVectors(dl, toEye);
    let best = 0, bq = new THREE.Quaternion(); for (let k = 0; k < 72; k++) { const qr = new THREE.Quaternion().setFromAxisAngle(toEye, k / 72 * PI * 2).multiply(q1), xv = new THREE.Vector3(1, 0, 0).applyQuaternion(qr); const sc2 = -Math.abs(xv.y); if (k === 0 || sc2 > best) { best = sc2; bq.copy(qr); } }
    const pen = new THREE.Group(); pen.position.copy(C); pen.quaternion.copy(bq); g.add(pen);
    const tone = (k) => new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff3fa0).multiplyScalar(k), toneMapped: false }), mats = [tone(2.2), tone(2.2), tone(1.1), tone(1.1), tone(0.45), tone(0.45)];
    const off = new THREE.Vector3(-L / 3, -L / 3, -L / 3), bar = (a, b) => { const A = new THREE.Vector3(...a).add(off), B = new THREE.Vector3(...b).add(off), d = B.clone().sub(A), len = d.length() + T, ax = Math.abs(d.x) > 0.01 ? 0 : Math.abs(d.y) > 0.01 ? 1 : 2, size = [T, T, T]; size[ax] = len; const m = new THREE.Mesh(new THREE.BoxGeometry(...size), mats); m.position.copy(A).add(B).multiplyScalar(0.5); pen.add(m); return m; };
    const bars = [bar([0, 0, L], [0, 0, 0]), bar([0, 0, 0], [L, 0, 0]), bar([L, 0, 0], [L, L, 0])];
    glow(c, K, g, C.x, C.y, C.z, 3.4, 'rgba(255,60,160,.35)');
    [-0.7, 0.7].forEach((dx) => g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(C.x + dx, 4.0, C.z), new THREE.Vector3(C.x + dx * 0.6, C.y + 0.5, C.z)]), new THREE.LineBasicMaterial({ color: 0x222222 }))));
    const sp = spot(c, K, g, E.x, E.z, 'TRY TO LEAVE. LOOK UP.', '#ff4fa3');
    const pz = () => { c.sound.note(440, 0.25); c.egg('afterhours_penrose', 'Three straight bars of neon that close into a triangle from one spot on Spring Street and never anywhere else. Like the night: every way out leads back to the start. MLow walked round it twice, then went home.'); };
    bars.forEach((b) => c.clickable(b, pz, 'A neon triangle')); c.clickable(sp, pz, 'A pink spot on the street');
    // the wet street, the lamp, more steam
    [[5.2, 3.6, 1.6, 0.9], [12.8, 0.8, 1.8, 1.0], [3.6, -2.2, 1.2, 0.7], [16.6, 4.6, 1.4, 0.8], [9.6, 5.8, 1.2, 0.6]].forEach(([x, z, w, d], k) => puddle(c, g, x, z, w, d, k * 0.9));
    cone(c, g, 1.7, 4.15, -1.2, 0.2, 1.8, 4.1, 0xffc890, 0.08); pool(c, g, 1.9, -1.2, 4.0, 0xffc890, 0.3);
    K.steam(g, 13.2, 0.05, 4.8); K.steam(g, 4.8, 0.05, 1.2);
    // a flickering OPEN sign, lit loft windows up on the south side, a fire escape below them
    const op = neon(c, 'OPEN 24 HRS', { w: 1.5, h: 0.36, bg: '#06040a', fg: '#40e8ff', font: c.FONT, weight: 900, border: '#ff4fa3' }, 2.0); op.position.set(0.15, 2.7, 0.8); op.rotation.y = H2; g.add(op); const opg = glow(c, K, g, 0.4, 2.7, 0.8, 2.2, 'rgba(60,220,255,.35)');
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const on = Math.sin(t * 23) > -0.85 || (t % 5) > 0.4; op.visible = opg.visible = on; });
    for (let k = 0; k < 6; k++) { const w = panel(c, 1.0, 0.7, 128, (q, w2, h2) => { const gr = q.createLinearGradient(0, 0, 0, h2); gr.addColorStop(0, k % 3 ? '#ffb860' : '#a0c8ff'); gr.addColorStop(1, k % 3 ? '#a05020' : '#304a80'); q.fillStyle = gr; q.fillRect(0, 0, w2, h2); q.fillStyle = '#100a08'; q.fillRect(w2 / 2 - 3, 0, 6, h2); q.fillRect(0, h2 / 2 - 3, w2, 6); if (k % 2) { q.fillStyle = 'rgba(20,10,10,.85)'; q.beginPath(); q.ellipse(w2 * 0.7, h2 * 0.6, 14, 30, 0, 0, 7); q.fill(); q.beginPath(); q.arc(w2 * 0.7, h2 * 0.25, 12, 0, 7); q.fill(); } q.strokeStyle = '#1a1210'; q.lineWidth = 8; q.strokeRect(0, 0, w2, h2); }, k % 3 ? 1.3 : 0.9); w.position.set(2.2 + k * 3.1, 3.55, 7.86); w.rotation.y = PI; g.add(w); }
    fireEscape(c, K, g, [[1.6, 7.0], [12.8, 18.6]]);
    // the ice cream truck dressed in bulbs, its window lit
    const tk = new THREE.Group(); tk.position.set(15.8, 0, -3.2); tk.rotation.y = 0.15; g.add(tk); const ed = new THREE.Group(); ed.rotation.y = H2; tk.add(ed);
    K.bulbs(ed, -2.0, 2.0, 2.45, -1.02, 20, 0xfff0c0); K.bulbs(ed, -2.0, 2.0, 2.45, 1.02, 20, 0xffc0e0);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff0d0).multiplyScalar(1.8), toneMapped: false })); win.position.set(-1.03, 1.55, -1.0); win.rotation.y = -H2; tk.add(win); glow(c, K, tk, -1.3, 1.5, -1.0, 1.8, 'rgba(255,230,190,.45)');
    // an amber signal blinking on the corner, the way they do at three
    const sg2 = new THREE.Group(); sg2.position.set(18.7, 0, 6.7); g.add(sg2); c.post(X(18.7), 6.7, 0.15); sg2.add(c.slab(0.1, 3.2, 0.1, K.std(0x2a2a2a, { metalness: 0.6 }), 0, 1.6, 0)); sg2.add(c.slab(0.3, 0.6, 0.3, K.std(0x2a2a2a, { metalness: 0.6 }), 0, 3.0, 0));
    const amb = glow(c, K, sg2, 0, 3.05, -0.2, 0.9, 'rgba(255,170,30,.95)'), ambD = new THREE.Mesh(new THREE.CircleGeometry(0.09, 14), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffa020).multiplyScalar(2.2), toneMapped: false })); ambD.position.set(0, 3.05, -0.16); ambD.rotation.y = PI; sg2.add(ambD);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; amb.visible = ambD.visible = (t % 1.2) < 0.6; });
    // papers along the gutter, cars going by, a low haze
    const NN = 10, news = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.4, 0.3).rotateX(-H2), K.std(0xe8e4d8, { roughness: 0.9, side: THREE.DoubleSide }), NN), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e = new THREE.Euler(), vv = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1); news.frustumCulled = false; g.add(news);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; for (let k = 0; k < NN; k++) { const u = (t * 0.04 + k / NN) % 1; e.set(Math.sin(t * 3 + k) * 0.3, t * 0.5 + k, 0); q4.setFromEuler(e); news.setMatrixAt(k, m4.compose(vv.set(19.5 - u * 19, 0.02 + Math.max(0, Math.sin(t * 2 + k * 3)) * 0.2, -6.0 + Math.sin(k * 2.3) * 0.6), q4, one)); } news.instanceMatrix.needsUpdate = true; });
    headlights(c, K, r, g, -7.3, 9, 'rgba(255,240,200,.9)');
    const fog = new THREE.Mesh(new THREE.PlaneGeometry(20, 1.4), addM(c, shaftV(c), 0x3a4a8a, 0.12)); fog.rotation.z = PI; fog.position.set(10, 0.7, -6.4); g.add(fog);
  },
});

Object.assign(ROOM, {
  // ---------- The Thomas Crown Affair, 1999: the Impressionist galleries
  crown(c, r, g, X, K) {
    const { THREE } = c;
    r.post = { ...r.post, bloom: 1.05 };
    // ILLUSION: a reverspective on the west wall. A gallery corridor painted on a pyramid that sticks OUT of the wall, so it turns to follow you as you walk past
    const W0 = 2.5, H0 = 1.6, W1 = 0.8, H1 = 0.52, DP = 0.62;
    const pic = c.canvasTex(1024, 656, (q, w, h) => {
      const ix0 = w * (0.5 - W1 / W0 / 2), ix1 = w * (0.5 + W1 / W0 / 2), iy0 = h * (0.5 - H1 / H0 / 2), iy1 = h * (0.5 + H1 / H0 / 2), quad = (pts, fill) => { q.fillStyle = fill; q.beginPath(); pts.forEach(([x, y], i) => (i ? q.lineTo(x, y) : q.moveTo(x, y))); q.closePath(); q.fill(); };
      const lerp = (a, b, u) => a + (b - a) * u;
      quad([[0, h], [w, h], [ix1, iy1], [ix0, iy1]], '#8a5a30'); q.strokeStyle = 'rgba(40,20,8,.6)'; q.lineWidth = 2; for (let k = 0; k <= 16; k++) { const u = k / 16; q.beginPath(); q.moveTo(w * u, h); q.lineTo(lerp(ix0, ix1, u), iy1); q.stroke(); }
      quad([[0, 0], [w, 0], [ix1, iy0], [ix0, iy0]], '#f4f0e6'); q.strokeStyle = '#b8b0a0'; q.lineWidth = 3; for (let k = 1; k < 4; k++) { const u = k / 4; q.beginPath(); q.moveTo(w * u, 0); q.lineTo(lerp(ix0, ix1, u), iy0); q.stroke(); }
      quad([[0, 0], [ix0, iy0], [ix0, iy1], [0, h]], '#e2d8c4'); quad([[w, 0], [ix1, iy0], [ix1, iy1], [w, h]], '#d6ccb6');
      [[0.12, 0.42], [0.55, 0.82]].forEach(([u0, u1]) => [0, 1].forEach((side) => { const xo = (u) => side ? lerp(w, ix1, u) : lerp(0, ix0, u), yt = (u, f) => lerp(lerp(0, iy0, u), lerp(h, iy1, u), f); const pts = [[xo(u0), yt(u0, 0.28)], [xo(u1), yt(u1, 0.28)], [xo(u1), yt(u1, 0.62)], [xo(u0), yt(u0, 0.62)]]; quad(pts, '#c9a033'); const inset = pts.map(([x, y], i) => [x + (side ? -1 : 1) * 4 * (i % 3 ? -1 : 1) * 0, y + (i < 2 ? 6 : -6)]); const gr = q.createLinearGradient(0, pts[0][1], 0, pts[2][1]); gr.addColorStop(0, '#f0a050'); gr.addColorStop(0.5, '#e86a30'); gr.addColorStop(0.51, '#3a5a8a'); gr.addColorStop(1, '#1a2a4a'); quad(inset, gr); }));
      q.fillStyle = '#efe8d8'; q.fillRect(ix0, iy0, ix1 - ix0, iy1 - iy0); q.fillStyle = '#c9a033'; q.fillRect(ix0 + (ix1 - ix0) * 0.3, iy0 + (iy1 - iy0) * 0.18, (ix1 - ix0) * 0.4, (iy1 - iy0) * 0.5); const gr2 = q.createLinearGradient(0, iy0, 0, iy1); gr2.addColorStop(0, '#f0a050'); gr2.addColorStop(0.5, '#3a5a8a'); q.fillStyle = gr2; q.fillRect(ix0 + (ix1 - ix0) * 0.33, iy0 + (iy1 - iy0) * 0.22, (ix1 - ix0) * 0.34, (iy1 - iy0) * 0.42);
      q.fillStyle = '#16161c'; q.beginPath(); q.ellipse(w / 2 + 40, iy1 - 30, 9, 26, 0, 0, 7); q.fill(); q.beginPath(); q.ellipse(w / 2 + 40, iy1 - 60, 13, 4, 0, 0, 7); q.fill(); q.beginPath(); q.arc(w / 2 + 40, iy1 - 63, 8, PI, 0); q.fill();
      q.strokeStyle = 'rgba(0,0,0,.25)'; q.lineWidth = 3; [[0, 0, ix0, iy0], [w, 0, ix1, iy0], [0, h, ix0, iy1], [w, h, ix1, iy1]].forEach(([a, b, cc, d]) => { q.beginPath(); q.moveTo(a, b); q.lineTo(cc, d); q.stroke(); }); });
    const pos = [], uv = [], v = (x, y, z) => { pos.push(x, y, z); uv.push(x / W0 + 0.5, y / H0 + 0.5); };
    const o = [[-W0 / 2, -H0 / 2, 0], [W0 / 2, -H0 / 2, 0], [W0 / 2, H0 / 2, 0], [-W0 / 2, H0 / 2, 0]], i = [[-W1 / 2, -H1 / 2, DP], [W1 / 2, -H1 / 2, DP], [W1 / 2, H1 / 2, DP], [-W1 / 2, H1 / 2, DP]];
    const tri = (a, b, cc) => { v(...a); v(...b); v(...cc); };
    for (let k = 0; k < 4; k++) { const k2 = (k + 1) % 4; tri(o[k], o[k2], i[k2]); tri(o[k], i[k2], i[k]); } tri(i[0], i[1], i[2]); tri(i[0], i[2], i[3]);
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); rg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); rg.computeVertexNormals();
    const RV = new THREE.Group(); RV.position.set(0.13, 2.05, 0.4); RV.rotation.y = H2; g.add(RV);
    const relief = new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ map: pic, emissiveMap: pic, emissive: 0xffffff, emissiveIntensity: 0.35, roughness: 0.8, side: THREE.DoubleSide })); RV.add(relief);
    const gilt = K.std(0xc9a033, { metalness: 1, roughness: 0.3 }); [[0, H0 / 2 + 0.06, W0 + 0.24, 0.12], [0, -H0 / 2 - 0.06, W0 + 0.24, 0.12]].forEach(([x, y, w2, h2]) => RV.add(c.slab(w2, h2, 0.08, gilt, x, y, 0.04))); [-W0 / 2 - 0.06, W0 / 2 + 0.06].forEach((x) => RV.add(c.slab(0.12, H0, 0.08, gilt, x, 0, 0.04)));
    const lb = c.sign('REVERSE PERSPECTIVE, AFTER P. HUGHES\nWALK PAST IT SLOWLY', { w: 1.6, h: 0.22, bg: '#f2ead8', fg: '#1b1b1b', font: c.MONO, weight: 600 }); lb.position.set(0, -H0 / 2 - 0.3, 0.02); RV.add(lb);
    c.clickable(relief, () => { c.sound.ding(); c.egg('crown_reverse', 'A whole gallery painted inside out: the far wall is the part nearest your nose, so the corridor swings round to follow you. The best thieves work the same way. MLow hung it at eye height and counted the turns.'); }, 'A painting that sticks out of the wall');
    // a glossier floor, picture lights over every frame, skylight shafts with dust in them
    const fl = floorOf(g); if (fl) { const m = fl.material.clone(); m.roughnessMap = null; m.roughness = 0.3; m.envMapIntensity = 1.25; fl.material = m; }
    const S = []; for (let k = 0; k < 7; k++) S.push([2.2 + k * 2.6, 7.86, PI]); [-6.6, -4.2, -1.8].forEach((z) => S.push([0.14, z, H2])); [-4.2, -1.8].forEach((z) => S.push([19.86, z, -H2]));
    const lampI = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 0.05, 0.12).translate(0, 0, 0.14), gilt, S.length), lit = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.85, 0.03).rotateX(H2).translate(0, -0.03, 0.17), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff0c8).multiplyScalar(2.2), toneMapped: false }), S.length), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), vv = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
    S.forEach(([x, z, ry], k) => { q4.setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry); m4.compose(vv.set(x, 3.15, z), q4, one); lampI.setMatrixAt(k, m4); lit.setMatrixAt(k, m4); const wash = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.6), addM(c, shaftP(c), 0xffe8c0, 0.14)); wash.position.set(x + Math.sin(ry) * 0.04, 2.35, z + Math.cos(ry) * 0.04); wash.rotation.y = ry; g.add(wash); });
    g.add(lampI); g.add(lit);
    for (let i2 = 0; i2 < 4; i2++) [0, 1, 2].forEach((j) => { if ((i2 + j) % 2) return; beam(c, g, 5.0 + i2 * 3.3, 5.9, -4.0 + j * 3.0, 1.8, 5.9, 0.2, -0.12, 0xf8f4ff, 0.05); });
    motes(c, r, g, 200, [3, 17], [0.5, 5.6], [-5, 3], 0xfff8e8, 0.03, 0.5);
    // red laser beams guarding the painting, drifting up and down
    const lz = -4.65, lasM = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff1a1a).multiplyScalar(2.4), toneMapped: false }), lasers = [];
    [8.3, 11.7].forEach((x) => { g.add(c.slab(0.08, 2.4, 0.08, K.std(0x111111, { metalness: 0.6 }), x, 1.2, lz)); c.post(X(x), lz, 0.12); });
    for (let k = 0; k < 6; k++) { const m = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.008, 0.008), lasM); m.position.set(10, 0.4 + k * 0.36, lz); g.add(m); lasers.push(m); }
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; lasers.forEach((m, k) => { m.position.y = 0.4 + k * 0.36 + Math.sin(t * 0.8 + k) * 0.14; m.rotation.z = Math.sin(t * 0.5 + k * 2) * 0.05; }); });
    // spotlights on the plinths, a hat stand of bowler hats by the door
    [[6.2, -0.4], [13.8, -0.4], [17.6, -6.3]].forEach(([x, z]) => { cone(c, g, x, 5.9, z, 0.12, 0.7, 4.6, 0xfff4e0, 0.07); pool(c, g, x, z, 1.8, 0xfff0d0, 0.3); });
    const hs = new THREE.Group(); hs.position.set(18.7, 0, 0.9); g.add(hs); c.post(X(18.7), 0.9, 0.3); const blk = K.std(0x141414, { roughness: 0.45 });
    hs.add(c.slab(0.06, 1.9, 0.06, K.std(0x3a2414, { roughness: 0.5 }), 0, 0.95, 0)); hs.add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.04, 16), K.std(0x3a2414)));
    for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2, hat = new THREE.Group(); hat.position.set(Math.cos(a) * 0.24, 1.55 + (k % 2) * 0.28, Math.sin(a) * 0.24); hat.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4); hs.add(hat); const cr = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 8, 0, PI * 2, 0, PI / 2), blk); hat.add(cr); const br = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.012, 18), blk); hat.add(br); }
    // the sprinklers in the ceiling: set one off and it rains in the gallery, as it did on the thief's last night
    const spr = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03, 0.05, 0.06, 10), gilt, 12); for (let k = 0; k < 12; k++) spr.setMatrixAt(k, m4.makeTranslation(3 + (k % 4) * 4.6, 5.95, -5 + ((k / 4) | 0) * 4.6)); g.add(spr);
    const NR = c.MOBILE ? 400 : 900, rp = new Float32Array(NR * 6); for (let k = 0; k < NR; k++) { const x = 1 + Math.random() * 18, y = Math.random() * 5.8, z = -6.5 + Math.random() * 14; rp.set([x, y, z, x, y - 0.22, z], k * 6); }
    const rgeo = new THREE.BufferGeometry(); rgeo.setAttribute('position', new THREE.BufferAttribute(rp, 3)); const rain = new THREE.LineSegments(rgeo, new THREE.LineBasicMaterial({ color: 0xc8e0ff, transparent: true, opacity: 0.5 })); rain.visible = false; rain.frustumCulled = false; g.add(rain);
    let wet = 0; c.tick((t, dt, P, ri) => { if (ri !== r.i || wet <= 0) { if (rain.visible && ri !== r.i) rain.visible = false; return; } wet -= dt; rain.visible = wet > 0; for (let k = 0; k < NR; k++) { let y = rp[k * 6 + 1] - dt * 8; if (y < 0) y += 5.8; rp[k * 6 + 1] = y; rp[k * 6 + 4] = y - 0.22; } rgeo.attributes.position.needsUpdate = true; });
    c.clickable(spr, () => { wet = 7; c.sound.whoosh(0.5, 0.6); c.toast('The sprinklers. Every painting in the room starts to run.', 2600); c.egg('crown_sprinkler', 'You set off the sprinklers, the way the thief did on his last night in the museum. The paint runs, the forgery comes off, the real one is underneath. MLow counted the drops.'); }, 'A sprinkler head');
  },

  // ---------- Trading Places, 1983: the orange juice pit
  trading(c, r, g, X, K) {
    const { THREE } = c, PXc = 10, PZc = -1.6;
    r.post = { ...r.post, bloom: 1.15 };
    // ILLUSION: a hybrid board on the east wall. From the pit it says SELL. Walk up to it and it says BUY. Same board, same paint: your distance trades it
    const hy = c.canvasTex(1024, 512, (q, w, h) => {
      q.fillStyle = '#bcbcbc'; q.fillRect(0, 0, w, h);   // the mean of black and white stripes once the GPU averages them in linear light
      q.save(); q.filter = 'blur(30px)'; q.fillStyle = '#a80616'; q.font = `900 ${h * 0.62}px ${c.FONT}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('SELL', w / 2, h * 0.54); q.restore();
      const pc = document.createElement('canvas'); pc.width = pc.height = 4; const pq = pc.getContext('2d'); pq.fillStyle = 'rgba(0,0,0,.6)'; pq.fillRect(0, 0, 4, 2); pq.fillStyle = 'rgba(255,255,255,.6)'; pq.fillRect(0, 2, 4, 2);   // stripes that lighten and darken what is under them by the same amount
      q.fillStyle = q.createPattern(pc, 'repeat'); q.font = `900 ${h * 0.5}px ${c.FONT}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('BUY', w / 2, h * 0.52);
    });
    hy.anisotropy = 1;
    const board = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3), new THREE.MeshBasicMaterial({ map: hy, toneMapped: false })); board.material.color.setScalar(0.62); board.position.set(19.6, 2.3, 0.4); board.rotation.y = -H2; g.add(board);
    const gold = K.std(0xc9a033, { metalness: 1, roughness: 0.3 }); [[2.3 + 0.7, 2.8], [2.3 - 0.7, 2.8]].forEach(([y, w2]) => g.add(c.slab(0.06, 0.08, w2, gold, 19.58, y, 0.4))); [0.4 - 1.36, 0.4 + 1.36].forEach((z) => g.add(c.slab(0.06, 1.48, 0.08, gold, 19.58, 2.3, z)));
    const cap = c.sign('FCOJ. YOUR CALL.', { w: 1.2, h: 0.18, bg: '#111', fg: '#f5c542', font: c.MONO, weight: 800 }); cap.position.set(19.58, 1.42, 0.4); cap.rotation.y = -H2; g.add(cap);
    c.clickable(board, () => { c.sound.bell(); c.egg('trading_hybrid', 'From the pit the board says SELL. Up close it says BUY. One board, two prices, and the only thing that moved was you. MLow bought at the wall and sold from the floor.'); }, 'The board on the east wall');
    // the pit rings in polished wood with brass edges, the exchange seal on the top step
    const wood = c.surf('planks', 1.2, 0x9a6a40).clone(); wood.roughnessMap = null; wood.roughness = 0.35;
    g.children.filter((m) => m.isMesh && m.geometry.type === 'CylinderGeometry' && m.geometry.parameters.radialSegments === 8 && Math.abs(m.position.x - PXc) < 0.01).forEach((m) => { m.material = wood; const p2 = m.geometry.parameters, trim = new THREE.Mesh(new THREE.CylinderGeometry(p2.radiusTop + 0.012, p2.radiusTop + 0.012, 0.05, 8, 1, true), gold); trim.position.set(PXc, p2.height - 0.025, PZc); trim.rotation.y = PI / 8; g.add(trim); });
    const seal = K.decal(3.6, 3.6, (q, w) => { q.strokeStyle = '#c9a033'; q.lineWidth = 10; q.beginPath(); q.arc(w / 2, w / 2, w * 0.44, 0, 7); q.stroke(); K.eyeFlower(q, w / 2, w / 2, w * 0.2, '#ffe8b0', '#ff7a1a'); q.fillStyle = '#c9a033'; q.font = `800 ${w * 0.07}px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('N3W YORKERS EXCHANGE', w / 2, w * 0.2); q.fillText('FCOJ PIT', w / 2, w * 0.86); }, 512); seal.rotation.x = -H2; seal.position.set(PXc, 0.607, PZc); g.add(seal);
    // the tape round the top of the north wall, prices running
    const tt = c.canvasTex(2048, 64, (q, w, h) => { q.fillStyle = '#080604'; q.fillRect(0, 0, w, h); q.font = `700 40px ${c.MONO}`; q.textBaseline = 'middle'; let x = 10; ['FCOJ 142.00 +2.10', 'PORK BELLIES 61.20 -0.40', 'GOLD 412.50 +3.00', 'N3W YORKERS 1.00 COUNTED', 'COFFEE 128.75 -1.25', 'MLOW 100.00 HOLD', 'WHEAT 3.62 +0.04'].forEach((s2, k) => { q.fillStyle = s2.includes('-') ? '#ff5040' : s2.includes('+') ? '#50ff70' : '#f5c542'; q.fillText(s2 + '   .   ', x, h / 2); x += q.measureText(s2 + '   .   ').width; }); });
    tt.wrapS = THREE.RepeatWrapping; tt.repeat.set(0.6, 1); const tape = new THREE.Mesh(new THREE.PlaneGeometry(12, 0.38), new THREE.MeshBasicMaterial({ map: tt, toneMapped: false })); tape.material.color.setScalar(1.7); tape.position.set(10, 4.85, -7.86); g.add(tape); g.add(c.slab(12.2, 0.5, 0.1, K.std(0x111111), 10, 4.85, -7.93));
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; tt.offset.x = (t * 0.05) % 1; });
    // the fluorescents lit, smoke hanging under the ceiling, slips coming down
    [[4.0, 3.6], [16.0, 3.6], [4.0, -4.0], [16.0, -4.0]].forEach(([x, z]) => { const s = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.14).rotateX(H2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff8e8).multiplyScalar(2.2), toneMapped: false })); s.position.set(x, 5.83, z); g.add(s); cone(c, g, x, 5.8, z, 0.5, 2.2, 5.7, 0xfff4e0, 0.03); });
    const smokeT = poolT(c); [[6, 1.0], [13, -3.0], [9, -5.0], [14, 3.0]].forEach(([x, z], k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(9, 6).rotateX(H2), new THREE.MeshBasicMaterial({ map: smokeT, color: 0xb8b0a0, transparent: true, opacity: 0.12, depthWrite: false })); m.position.set(x, 5.0 + k * 0.15, z); g.add(m); });
    paperFall(c, r, g, 22, [5, 15], [-6, 3], 5.6);
    // a pile of oranges by the crates, a wall of phone lamps blinking
    const ora = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 10, 8), K.std(0xff8a1a, { roughness: 0.55 }), 46), m4 = new THREE.Matrix4(); for (let k = 0; k < 46; k++) { const a = k * 2.4, rr = Math.sqrt(k / 46) * 0.9, lay = k < 30 ? 0 : 1; ora.setMatrixAt(k, m4.makeTranslation(14.4 + Math.cos(a) * rr * (lay ? 0.5 : 1), 0.06 + lay * 0.1, 5.6 + Math.sin(a) * rr * 0.7 * (lay ? 0.5 : 1))); } g.add(ora);
    const NL = 24, lamps = new THREE.InstancedMesh(new THREE.CircleGeometry(0.05, 10), new THREE.MeshBasicMaterial({ toneMapped: false }), NL), lc = new THREE.Color(), q4 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), H2), vv = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
    for (let k = 0; k < NL; k++) { lamps.setMatrixAt(k, m4.compose(vv.set(0.15, 3.15 + (k % 2) * 0.18, -7.0 + ((k / 2) | 0) * 0.5), q4, one)); lamps.setColorAt(k, lc.setRGB(0.2, 0.05, 0.02)); } g.add(lamps); g.add(c.slab(0.06, 0.5, 6.2, K.std(0x1a1a1a), 0.15, 3.24, -4.25));
    let lt = 0; c.tick((t, dt, P, ri) => { if (ri !== r.i) return; lt += dt; if (lt < 0.2) return; lt = 0; for (let k = 0; k < NL; k++) lamps.setColorAt(k, Math.random() < 0.35 ? lc.setRGB(2.4, 0.5, 0.1) : Math.random() < 0.15 ? lc.setRGB(0.3, 2.2, 0.4) : lc.setRGB(0.2, 0.05, 0.02)); lamps.instanceColor.needsUpdate = true; });
  },
});
