// Round thirteen, batch c4: richer graphics and one new optical illusion in each of its sets. See ROUND13_BRIEF.md.
// Sets: batteries, susan, dumbo, bronx, kramer, zoolander, wildstyle, ragingbull, ferry, tenenbaums, meanstreets, barefoot, crooklyn.
// No new lights: practicals are hot MeshBasic (toneMapped off, so the finishing pass blooms them), sprites and additive cones.
const PI = Math.PI, H = PI / 2;

// ---------- shared helpers ----------
const TEX = {};
function ctex(c, key, w, h, draw) { return TEX[key] ||= c.canvasTex(w, h, draw); }
function rep(t, x, y) { t.wrapS = t.wrapT = 1000; t.repeat.set(x, y); return t; }
// a colour that glows: above 1 after tone mapping is skipped, so bloom picks it up
function hot(c, col, k = 1.6, o = {}) { const m = new c.THREE.MeshBasicMaterial({ toneMapped: false, ...o }); m.color.set(col).multiplyScalar(k); return m; }
function std(c, col, o = {}) { return new c.THREE.MeshStandardMaterial({ color: col, roughness: 0.6, ...o }); }
function glow(c, K, g, col, x, y, z, s = 0.8, op = 1) {
  const { THREE } = c, sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glowTex(col), transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  sp.scale.set(s, s, 1); sp.position.set(x, y, z); g.add(sp); return sp;
}
const gradTex = (c) => ctex(c, 'grad', 8, 128, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, w, h); });
const dotTex = (c) => ctex(c, 'dot', 32, 32, (q) => { const gr = q.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, 32, 32); });
// a shaft of light under a practical: an open additive cone, bright at the top, gone at the floor
function beam(c, g, x, y, z, h, r1, r2, col, op = 0.16, tx = 0, tz = 0) {
  const { THREE } = c, m = new THREE.MeshBasicMaterial({ map: gradTex(c), color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false });
  const o = new THREE.Group(); o.position.set(x, y, z); o.rotation.set(tx, 0, tz); g.add(o);
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 28, 1, true), m); cone.position.y = -h / 2; cone.renderOrder = 2; o.add(cone); return o;
}
// a beam from a practical to a target point
function beamTo(c, g, [x, y, z], [tx, ty, tz], r1, r2, col, op = 0.14) {
  const { THREE } = c, d = new THREE.Vector3(tx - x, ty - y, tz - z), h = d.length(), o = beam(c, g, x, y, z, h, r1, r2, col, op);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), d.normalize()); return o;
}
// many of one small thing, at fixed spots
function many(c, g, geo, mat, pts, s = 1) { const { THREE } = c, m = new THREE.InstancedMesh(geo, mat, pts.length), m4 = new THREE.Matrix4(); pts.forEach(([x, y, z, ry = 0, sc = s], k) => { m4.makeRotationY(ry).scale(new THREE.Vector3(sc, sc, sc)).setPosition(x, y, z); m.setMatrixAt(k, m4); }); m.computeBoundingSphere(); g.add(m); return m; }
// dust in the air, drifting only while you are in the set
function motes(c, r, g, n, [x1, x2, y1, y2, z1, z2], col = 0xfff0d0, size = 0.04, op = 0.7) {
  const { THREE } = c; n = c.MOBILE ? n >> 1 : n;
  const base = new Float32Array(n * 3), p = new Float32Array(n * 3);
  for (let k = 0; k < n; k++) { base[k * 3] = x1 + Math.random() * (x2 - x1); base[k * 3 + 1] = y1 + Math.random() * (y2 - y1); base[k * 3 + 2] = z1 + Math.random() * (z2 - z1); }
  p.set(base); const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: col, size, map: dotTex(c), transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  pts.frustumCulled = false; g.add(pts);
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; for (let k = 0; k < n; k++) { const i = k * 3; p[i] = base[i] + Math.sin(t * 0.21 + k) * 0.25; p[i + 1] = base[i + 1] + Math.sin(t * 0.13 + k * 1.7) * 0.2; p[i + 2] = base[i + 2] + Math.cos(t * 0.17 + k * 0.7) * 0.25; } geo.attributes.position.needsUpdate = true; });
  return pts;
}
// rising steam or smoke from a point, gated
function puff(c, r, K, g, x, y, z, col = 'rgba(235,235,235,.35)', n = 6, rise = 1.6, s0 = 0.3, s1 = 1.2) {
  const { THREE } = c, ps = [];
  for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glowTex(col), transparent: true, depthWrite: false, toneMapped: false })); g.add(s); ps.push(s); }
  c.tick((t, dt, P, ri) => { if (ri !== r.i) return; ps.forEach((s, i) => { const u = (t * 0.22 + i / n) % 1; s.position.set(x + Math.sin(u * 6 + i * 9) * 0.15, y + u * rise, z + Math.cos(u * 5 + i) * 0.08); s.scale.setScalar(s0 + u * (s1 - s0)); s.material.opacity = (1 - u) * 0.75; }); });
  return ps;
}
// a flat picture: on the floor (flat) or on a wall (panel)
function flat(c, g, w, d, mat, x, z, y = 0.014, ry = 0) { const m = new c.THREE.Mesh(new c.THREE.PlaneGeometry(w, d), mat); m.rotation.set(-H, ry, 0, 'YXZ'); m.position.set(x, y, z); g.add(m); return m; }
function panel(c, g, w, h, mat, x, y, z, ry = 0) { const m = new c.THREE.Mesh(new c.THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.y = ry; g.add(m); return m; }
const decalMat = (c, map, o = {}) => new c.THREE.MeshStandardMaterial({ map, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, roughness: 0.8, ...o });
const near = (r, ri) => Math.abs(ri - r.i) <= 1;
// the meshes an earlier pass made, found by where they stand
function findAt(g, x, y, z, e = 0.02) { const out = []; g.children.forEach((o) => { if (o.isMesh && Math.abs(o.position.x - x) < e && Math.abs(o.position.y - y) < e && Math.abs(o.position.z - z) < e) out.push(o); }); return out; }
// a neon word: the glow is baked in the canvas, the colour runs hot
function neonWord(c, text, { w = 2, h = 0.6, fg = '#ff4fa3', font, k = 1.5 } = {}) {
  const s = c.sign(text, { w, h, bg: null, fg, glow: 22, font: font || c.SERIF, weight: 900 }); s.material.color.setScalar(k); return s;
}
// a sheet of light falling at a slant (a sun shaft through a gap), additive, bright at the top
function shaft(c, g, x, y, z, w, h, rx, ry, rz, col, op = 0.12) {
  const { THREE } = c, m = new THREE.MeshBasicMaterial({ map: gradTex(c), color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false });
  const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h).translate(0, -h / 2, 0), m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz, 'YXZ'); o.renderOrder = 2; g.add(o); return o;
}
// a painted wooden sign on an iron bracket, standing out from a side wall (side -1 west wall, +1 east wall)
function blade(c, g, text, x, y, z, side, { bg = '#1a2a20', fg = '#f4ead2', border = '#c8a050', font, w = 1.6, h = 0.7 } = {}) {
  const s = c.sign(text, { w, h, bg, fg, border, font: font || c.SERIF, weight: 800 }); s.material.side = c.THREE.DoubleSide; s.rotation.y = 0; s.position.set(x - side * (w / 2 + 0.15), y, z); g.add(s);
  const iron = std(c, 0x1a1a1a, { metalness: 0.6, roughness: 0.5 }); g.add(c.slab(w + 0.3, 0.04, 0.04, iron, x - side * (w / 2 + 0.15), y + h / 2 + 0.06, z)); return s;
}
// a bilinear quad, so lines across it stay straight on a trapezoid (uv s along the first edge, d toward the second)
function quadMesh(c, P00, P10, P01, P11, mat, n = 8) { const { THREE } = c; const pos = [], uv = [], idx = [], A = new THREE.Vector3(), B = new THREE.Vector3(), Pt = new THREE.Vector3();
      for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) { const s = i / n, d = j / n; A.lerpVectors(P00, P10, s); B.lerpVectors(P01, P11, s); Pt.lerpVectors(A, B, d); pos.push(Pt.x, Pt.y, Pt.z); uv.push(s, d); }
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = j * (n + 1) + i, b = a + 1, c2 = a + n + 1, d2 = c2 + 1; idx.push(a, b, d2, a, d2, c2); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals(); return new THREE.Mesh(geo, mat); }
// a smooth painted ceiling, so the gritty plaster scan does not read as concrete overhead
const ceilMat = (c, col) => new c.THREE.MeshStandardMaterial({ map: ctex(c, 'ceil', 128, 128, (q) => { q.fillStyle = '#ffffff'; q.fillRect(0, 0, 128, 128); for (let k = 0; k < 600; k++) { q.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`; q.fillRect(Math.random() * 128, Math.random() * 128, 3, 3); } }), color: col, roughness: 0.9 });
// pressed tin, for the diner and the bar
const tinTex = (c) => ctex(c, 'tin', 256, 256, (q, w) => { q.fillStyle = '#cfd6c8'; q.fillRect(0, 0, w, w); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const x = i * 128 + 64, y = j * 128 + 64; q.strokeStyle = 'rgba(0,0,0,.25)'; q.lineWidth = 4; q.strokeRect(x - 60, y - 60, 120, 120); q.strokeStyle = 'rgba(255,255,255,.6)'; q.strokeRect(x - 56, y - 56, 112, 112); const gr = q.createRadialGradient(x - 8, y - 8, 4, x, y, 40); gr.addColorStop(0, '#fff'); gr.addColorStop(1, 'rgba(120,130,110,.5)'); q.fillStyle = gr; q.beginPath(); for (let k = 0; k < 16; k++) { const a = k / 16 * PI * 2, R = k % 2 ? 22 : 40; q.lineTo(x + Math.cos(a) * R, y + Math.sin(a) * R); } q.fill(); } });
// a mark on the floor where an illusion reads from
function spot(c, g, x, z, label, col = '#f5c542') {
  const t = c.canvasTex(256, 256, (q) => { q.strokeStyle = col; q.lineWidth = 10; q.beginPath(); q.arc(128, 128, 100, 0, 7); q.stroke(); q.beginPath(); q.moveTo(128, 50); q.lineTo(128, 206); q.moveTo(50, 128); q.lineTo(206, 128); q.stroke(); q.fillStyle = col; q.font = `800 26px ${c.MONO}`; q.textAlign = 'center'; q.fillText(label, 128, 246); });
  return flat(c, g, 0.7, 0.7, decalMat(c, t, { roughness: 0.5 }), x, z, 0.016);
}

// ---------- the sets ----------
export const PROPS = {};
export const ROOM = {
  // THE DINER. Illusion: an infinity well in the middle of the floor, the saucers' landing pad, a diner below a diner forever.
  batteries(c, r, g, X, K, mats) {
    const { THREE } = c;
    // the counter becomes marble on top and ribbed steel with a red stripe on the front
    findAt(g, 10, 0.52, -4.6).forEach((o) => { o.material = c.surf('marble', 1.2, 0xe8e4dc); });
    const front = ctex(c, 'bat_front', 1024, 128, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#e8ecef'); gr.addColorStop(0.5, '#9aa4ac'); gr.addColorStop(1, '#d8dde0'); q.fillStyle = gr; q.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 8) { q.fillStyle = 'rgba(255,255,255,.35)'; q.fillRect(x, 0, 2, h); q.fillStyle = 'rgba(0,0,0,.18)'; q.fillRect(x + 4, 0, 2, h); } q.fillStyle = '#c8102e'; q.fillRect(0, h * 0.28, w, h * 0.16); q.fillStyle = '#111'; q.fillRect(0, h * 0.44, w, h * 0.03); });
    panel(c, g, 10, 1.05, new THREE.MeshStandardMaterial({ map: front, metalness: 0.7, roughness: 0.3 }), 10, 0.52, -4.19);
    // pressed tin overhead
    const tin = rep(tinTex(c).clone(), 10, 8); tin.needsUpdate = true;
    const ceil = panel(c, g, 20, 16, new THREE.MeshStandardMaterial({ map: tin, metalness: 0.55, roughness: 0.35, color: 0x9aa89a }), 10, 5.93, 0); ceil.rotation.x = H;
    // red tufted vinyl on the four booths, and their backs
    const vinyl = ctex(c, 'bat_vinyl', 256, 256, (q, w) => { q.fillStyle = '#9a1020'; q.fillRect(0, 0, w, w); for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) { const x = i * 64 + (j % 2) * 32, y = j * 64; const gr = q.createRadialGradient(x, y, 2, x, y, 34); gr.addColorStop(0, '#5a0a12'); gr.addColorStop(0.12, '#c8203a'); gr.addColorStop(1, '#9a1424'); q.fillStyle = gr; q.beginPath(); q.arc(x, y, 34, 0, 7); q.fill(); } q.fillStyle = 'rgba(255,255,255,.12)'; q.fillRect(0, 0, w, 30); });
    const vm = new THREE.MeshStandardMaterial({ map: vinyl, roughness: 0.35 }), chrome = std(c, 0xd8dde2, { metalness: 1, roughness: 0.18 });
    [[2, 4], [18, 4], [2, -1], [18, -1]].forEach(([x, z]) => { findAt(g, x, 0.38, z).forEach((o) => { o.material = vm; }); g.add(c.slab(1.6, 0.7, 0.16, vm, x, 1.1, z - 0.42)); g.add(c.slab(1.64, 0.04, 0.2, chrome, x, 1.46, z - 0.42)); g.add(c.slab(1.64, 0.04, 0.94, chrome, x, 0.77, z)); });
    // the neon over the counter: EAT flickers, PIE holds
    const eat = neonWord(c, 'EAT', { w: 1.5, h: 0.6, fg: '#ff2a4a' }); eat.position.set(8.2, 4.45, -4.55); g.add(eat);
    const pie = neonWord(c, 'PIE', { w: 1.5, h: 0.6, fg: '#5af0c8' }); pie.position.set(11.8, 4.45, -4.55); g.add(pie);
    [8.2, 11.8].forEach((x) => [-0.5, 0.5].forEach((dx) => g.add(c.slab(0.012, 1.2, 0.012, std(c, 0x222222), x + dx, 5.35, -4.55))));
    // light under the three pendants, and the dust in it
    [7, 10, 13].forEach((x) => beam(c, g, x, 4.55, -4.6, 3.5, 0.18, 1.3, 0xd8fff0, 0.12));
    motes(c, r, g, 90, [5, 15, 1.2, 4.5, -5.4, -2.6], 0xe8fff0, 0.035, 0.6);
    // a black and white run under the stools, glass sugar jars down the counter, the urn steaming
    const chk = rep(ctex(c, 'checker', 64, 64, (q) => { q.fillStyle = '#f2f0ea'; q.fillRect(0, 0, 64, 64); q.fillStyle = '#141414'; q.fillRect(0, 0, 32, 32); q.fillRect(32, 32, 32, 32); }), 34, 4);
    flat(c, g, 10.4, 1.2, new THREE.MeshStandardMaterial({ map: chk, roughness: 0.25, polygonOffset: true, polygonOffsetFactor: -2 }), 10, -3.55);
    const jars = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, roughness: 0.05 }), 9), caps = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.052, 0.04, 0.05, 12), chrome, 9), m4 = new THREE.Matrix4();
    for (let k = 0; k < 9; k++) { m4.makeTranslation(5.6 + k * 1.1, 1.12, -4.45); jars.setMatrixAt(k, m4); m4.makeTranslation(5.6 + k * 1.1, 1.215, -4.45); caps.setMatrixAt(k, m4); } jars.computeBoundingSphere(); caps.computeBoundingSphere(); g.add(jars, caps);
    puff(c, r, K, g, 11.4, 1.35, -4.7, 'rgba(240,250,245,.3)', 5, 1.2, 0.2, 0.8);
    // a lit OPEN in the south window band and a wall clock glow over the pie case
    const open = neonWord(c, 'OPEN 24 HRS', { w: 2.2, h: 0.5, fg: '#22d3ee', font: c.MONO }); open.position.set(19.6, 4.4, 0.3); open.rotation.y = -H; g.add(open);
    glow(c, K, g, 'rgba(255,240,200,.6)', 18.0, 3.0, -7.6, 1.2, 0.7);

    // THE ILLUSION: the infinity well. A low chrome drum, 0.14 deep, with rings that shrink and dim toward one point.
    const wx = 5.2, wz = -1.4, R = 0.95, DH = 0.3, well = new THREE.Group(); well.position.set(wx, 0, wz); g.add(well); c.post(X(wx), wz, R + 0.1);
    well.add(new THREE.Mesh(new THREE.CylinderGeometry(R + 0.08, R + 0.14, DH, 48, 1, true), chrome).translateY(DH / 2)); const rim = new THREE.Mesh(new THREE.TorusGeometry(R + 0.04, 0.05, 10, 48), chrome); rim.rotation.x = -H; rim.position.y = DH; well.add(rim);
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(R, R, DH, 48, 1, true), new THREE.MeshBasicMaterial({ color: 0x010403, side: THREE.BackSide })); inner.position.y = DH / 2; well.add(inner);
    const bot = new THREE.Mesh(new THREE.CircleGeometry(R, 48), new THREE.MeshBasicMaterial({ color: 0x000000 })); bot.rotation.x = -H; bot.position.y = 0.004; well.add(bot);
    // every level is a ring of LEDs and a thin tube, each one smaller, lower and dimmer, like a real infinity mirror
    const NR = 18, ND = 36, rings = [], cols = [0x5af0c8, 0xff4fa3], led = new THREE.InstancedMesh(new THREE.SphereGeometry(0.016, 6, 4), new THREE.MeshBasicMaterial({ toneMapped: false }), NR * ND), cc = new THREE.Color();
    for (let k = 0; k < NR; k++) { const f = Math.pow(0.82, k), rr = R * 0.96 * f, y = DH - 0.012 - (DH - 0.02) * (1 - f);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.006 + 0.006 * f, 4, 48), hot(c, cols[k % 2], 1.9 * Math.pow(0.85, k))); ring.rotation.x = -H; ring.position.y = y; well.add(ring); rings.push(ring);
      for (let j = 0; j < ND; j++) { const a = (j + (k % 2) * 0.5) / ND * PI * 2; m4.makeScale(f + 0.2, f + 0.2, f + 0.2).setPosition(Math.cos(a) * rr * 0.93, y, Math.sin(a) * rr * 0.93); led.setMatrixAt(k * ND + j, m4); led.setColorAt(k * ND + j, cc.set(0xfff4d8).multiplyScalar(2.2 * Math.pow(0.84, k))); } }
    well.add(led);
    // a tiny saucer at the bottom of forever
    const tiny = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), hot(c, 0x80ffd0, 2)); tiny.position.y = 0.012; tiny.scale.y = 0.4; well.add(tiny);
    // landing lights round the rim
    const lamps = new THREE.InstancedMesh(new THREE.SphereGeometry(0.025, 8, 6), hot(c, 0xfff0c0, 2.2), 24); for (let k = 0; k < 24; k++) { const a = k / 24 * PI * 2; m4.makeTranslation(Math.cos(a) * (R + 0.04), DH + 0.05, Math.sin(a) * (R + 0.04)); lamps.setMatrixAt(k, m4); } well.add(lamps);
    const sign = c.sign('SAUCER PAD  MIND THE DROP', { w: 1.6, h: 0.16, bg: '#0b1020', fg: '#5af0c8', font: c.MONO, weight: 700 }); sign.rotation.x = -H; sign.position.set(0, 0.016, R + 0.32); well.add(sign);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const k0 = (t * 9) | 0; rings.forEach((m, k) => { m.visible = (k + k0) % 6 !== 0; }); tiny.position.x = Math.sin(t * 1.3) * 0.05; tiny.position.z = Math.cos(t * 1.1) * 0.05; eat.visible = Math.sin(t * 13) + Math.sin(t * 3.1) > -1.4; });
    c.clickable(well, () => { c.sound.beep(2200, 0.05, 0.1, 'sine'); c.egg('batteries_well', 'Look down. A diner under the diner under the diner, all the way to the saucer that started it. MLow ordered pie from the bottom one.'); }, 'The saucer pad');
  },

  // THE MAGIC CLUB. Illusion: Pepper's ghost. A sheet of glass at 45 degrees on the stage shows a glowing New Yorker who is
  // not there; the real one stands lit in a wing box beside it, and from the side of the stage you can catch them.
  susan(c, r, g, X, K) {
    const { THREE } = c;
    findAt(g, 10, 0.3, -5.3).forEach((o) => { o.material = c.surf('planks', 1.4, 0x6a3438); });
    // footlights along the lip of the stage
    const fl = []; for (let k = 0; k < 26; k++) fl.push([4.25 + k * 0.46, 0.64, -3.96]);
    many(c, g, new THREE.SphereGeometry(0.045, 8, 6), hot(c, 0xffe2a0, 2.2), fl);
    [5, 8, 12, 15].forEach((x) => glow(c, K, g, 'rgba(255,200,140,.55)', x, 0.75, -3.9, 1.6, 0.6));
    // a velvet valance with a gold fringe over the stage, and two gathered curtains
    const val = ctex(c, 'sus_val', 1024, 96, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3a0610'); gr.addColorStop(1, '#8a1028'); q.fillStyle = gr; q.beginPath(); q.moveTo(0, 0); q.lineTo(w, 0); q.lineTo(w, h * 0.6); for (let k = 16; k >= 0; k--) q.quadraticCurveTo(k * w / 16 + w / 32, h * 0.98, k * w / 16, h * 0.6); q.fill(); q.fillStyle = '#d8a840'; for (let x = 0; x < w; x += 5) q.fillRect(x, h * 0.6 + Math.abs(Math.sin(x / w * 16 * PI)) * h * 0.3, 2, 8); for (let x = 0; x < w; x += 9) { q.fillStyle = 'rgba(0,0,0,.25)'; q.fillRect(x, 0, 3, h * 0.6); } });
    panel(c, g, 12.4, 1.1, new THREE.MeshStandardMaterial({ map: val, transparent: true, alphaTest: 0.3, roughness: 0.9, side: THREE.DoubleSide }), 10, 4.95, -6.5);
    const velvet = ctex(c, 'sus_velvet', 128, 256, (q, w, h) => { for (let x = 0; x < w; x++) { const v = 0.5 + 0.5 * Math.sin(x / w * PI * 6); q.fillStyle = `rgb(${90 + v * 90 | 0},${8 + v * 14 | 0},${24 + v * 20 | 0})`; q.fillRect(x, 0, 1, h); } });
    [4.25, 15.75].forEach((x) => { const cu = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 4.4, 14, 1, true), new THREE.MeshStandardMaterial({ map: velvet, roughness: 0.85, side: THREE.DoubleSide })); cu.position.set(x, 0.6 + 2.2, -6.35); g.add(cu); const tie = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.03, 6, 20), std(c, 0xd8a840, { metalness: 1, roughness: 0.3 })); tie.rotation.x = H; tie.position.set(x, 1.9, -6.35); g.add(tie); });
    // two spots from the balcony onto the cabinet, and dust in them
    beamTo(c, g, [7, 5.9, -2.6], [9.6, 0.6, -5.3], 0.06, 0.7, 0xff70d0, 0.09); beamTo(c, g, [13, 5.9, -2.6], [10.4, 0.6, -5.3], 0.06, 0.7, 0x60d8ff, 0.09); beamTo(c, g, [10, 5.9, 0.6], [10, 0, 0.6], 0.05, 0.5, 0xffffff, 0.06);
    motes(c, r, g, 110, [4, 16, 0.8, 5, -5, 4], 0xffd8f0, 0.04, 0.55);
    // a mirror ball over the floor and its flecks travelling round the walls
    const facets = ctex(c, 'sus_facet', 256, 128, (q, w, h) => { for (let x = 0; x < w; x += 8) for (let y = 0; y < h; y += 8) { const v = 120 + Math.random() * 135 | 0; q.fillStyle = `rgb(${v},${v},${v + 10})`; q.fillRect(x, y, 7, 7); } });
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 16), new THREE.MeshStandardMaterial({ map: facets, metalness: 1, roughness: 0.12, emissive: 0x303040, emissiveMap: facets })); ball.position.set(10, 5.2, 0.6); g.add(ball); g.add(c.slab(0.015, 0.6, 0.015, std(c, 0x222222), 10, 5.7, 0.6));
    const flecks = []; const NF = c.MOBILE ? 20 : 40; for (let k = 0; k < NF; k++) flecks.push(glow(c, K, g, k % 3 ? 'rgba(255,255,255,.9)' : 'rgba(255,120,220,.9)', 0, 0, 0, 0.22));
    // a lit dance floor in the middle, twelve squares that change on the beat
    const tiles = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.76, 0.76).rotateX(-H), new THREE.MeshBasicMaterial({ toneMapped: false }), 12), m4 = new THREE.Matrix4(), cc = new THREE.Color(), TC = [0xff4fa3, 0x22d3ee, 0xf5c542, 0x9b5cff];
    for (let k = 0; k < 12; k++) { m4.makeTranslation(8.8 + (k % 4) * 0.8, 0.022, -2.2 + Math.floor(k / 4) * 0.8); tiles.setMatrixAt(k, m4); tiles.setColorAt(k, cc.set(TC[k % 4]).multiplyScalar(0.9)); } tiles.computeBoundingSphere(); g.add(tiles);
    g.add(c.slab(3.3, 0.02, 2.5, std(c, 0x111111, { metalness: 0.6, roughness: 0.2 }), 10, 0.006, -1.4));
    // a red lamp on every table
    const lamps = [[4, -1.6], [7.5, 0.6], [12.5, 0.6], [16, 2.6], [5, 3]];
    many(c, g, new THREE.CylinderGeometry(0.07, 0.11, 0.13, 14, 1, true), hot(c, 0xff4060, 1.5, { side: THREE.DoubleSide }), lamps.map(([x, z]) => [x + 0.15, 0.86, z]));
    many(c, g, new THREE.CylinderGeometry(0.012, 0.03, 0.2, 8), std(c, 0xd8a840, { metalness: 1, roughness: 0.3 }), lamps.map(([x, z]) => [x + 0.15, 0.74, z]));
    lamps.forEach(([x, z]) => glow(c, K, g, 'rgba(255,90,120,.6)', x + 0.15, 0.86, z, 0.7));
    // bulbs along the balcony rail
    const bb = []; for (let k = 0; k < 34; k++) bb.push([1.6 + k * 0.51, 4.02, 5.14]);
    const bulbs = many(c, g, new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ toneMapped: false }), bb);
    for (let k = 0; k < 34; k++) bulbs.setColorAt(k, cc.set(0xffd890).multiplyScalar(2));

    // THE ILLUSION. Glass on the diagonal at G, the actor at A in the wing box, the ghost where the reflection falls.
    const G = new THREE.Vector3(12.6, 1.7, -4.9), d = 1.3, A = [G.x + d, 0.6, G.z], B = [G.x, 0.6, G.z - d];
    const glass = panel(c, g, 1.98, 2.2, new THREE.MeshStandardMaterial({ color: 0xddeeff, transparent: true, opacity: 0.14, metalness: 1, roughness: 0.03, side: THREE.DoubleSide, depthWrite: false }), G.x, G.y, G.z, PI / 4);
    const gilt = std(c, 0xd8a840, { metalness: 1, roughness: 0.3 });
    [-0.99, 0.99].forEach((u) => { const p = c.slab(0.05, 2.3, 0.05, gilt, G.x + u * 0.707, G.y, G.z - u * 0.707); g.add(p); }); const top = c.slab(2.0, 0.05, 0.05, gilt, G.x, G.y + 1.12, G.z); top.rotation.y = PI / 4; g.add(top);
    c.post(X(G.x), G.z, 0.9);
    // the wing box, black, open only toward the glass, with the real one inside under a hot little lamp
    const blk = std(c, 0x0a0608, { roughness: 1 }); g.add(c.slab(0.06, 2.3, 1.3, blk, 14.5, 0.6 + 1.15, G.z)); g.add(c.slab(1.15, 2.3, 0.06, blk, 13.95, 0.6 + 1.15, G.z + 0.62)); g.add(c.slab(1.15, 2.3, 0.06, blk, 13.95, 0.6 + 1.15, G.z - 0.62)); g.add(c.slab(1.2, 0.06, 1.3, blk, 13.95, 2.92, G.z));
    const actor = K.extra(g, A[0], A[2], { col: 0xc8a050, ry: -H }); actor.position.y = 0.6;
    g.add(c.slab(0.16, 0.1, 0.1, hot(c, 0xfff0d0, 2.4), 13.5, 2.8, G.z)); glow(c, K, g, 'rgba(255,240,210,.8)', 13.6, 2.7, G.z, 0.9, 0.8);
    const ghost = K.extra(g, B[0], B[2], { col: 0xc8a050 }); ghost.position.y = 0.6; const gm = [];
    ghost.traverse((o) => { if (o.isMesh) { const m = new THREE.MeshBasicMaterial({ map: o.material.map || null, color: o.material.map ? 0xd8f4ff : 0x3a78b8, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }); m.color.multiplyScalar(1.4); o.material = m; gm.push(m); } });
    const sg = glow(c, K, g, 'rgba(120,200,255,.5)', B[0], 1.6, B[2], 2.4, 0.4);
    const na = new THREE.Vector3(1, 0, 1).normalize(), v = new THREE.Vector3();
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return;
      v.set(P.x - r.x0 - G.x, 0, P.z - G.z).normalize(); const a = Math.max(0, Math.min(1, (v.dot(na) - 0.15) / 0.4)) * (0.75 + 0.25 * Math.sin(t * 2.3));
      gm.forEach((m) => { m.opacity = a; }); sg.material.opacity = a * 0.5; ghost.position.y = 0.6 + Math.sin(t * 1.2) * 0.06; ghost.rotation.y = Math.sin(t * 0.7) * 0.25;
      ball.rotation.y += dt * 0.5;
      flecks.forEach((s, k) => { const an = k / NF * PI * 2 + t * 0.35; s.position.set(10 + Math.cos(an) * 9.6, 1.0 + (k % 5) * 0.9, 0.6 + Math.sin(an) * 7.3); });
      const bt = (t * 2) | 0; for (let k = 0; k < 12; k++) tiles.setColorAt(k, cc.set(TC[(k + bt + (k >> 2)) % 4]).multiplyScalar(0.55 + 0.5 * ((k + bt) % 3 === 0))); tiles.instanceColor.needsUpdate = true;
      const ch = (t * 6) | 0; for (let k = 0; k < 34; k++) bulbs.setColorAt(k, cc.set((k + ch) % 4 ? 0xffd890 : 0x553a20).multiplyScalar((k + ch) % 4 ? 2 : 1)); bulbs.instanceColor.needsUpdate = true;
    });
    c.clickable(glass, () => { c.sound.whoosh(0.3, 0.6); c.egg('susan_ghost', "Pepper's ghost. The one on the stage is a reflection in a sheet of glass; the real one stands in the wing box, lit like a saint. MLow never tells which one is seeking you."); }, 'The glass on the stage');
  },

  // WASHINGTON STREET. Illusion: anamorphic chalk on the cobbles. From the one cobble with the X it stands up as a
  // poster board in front of the bridge; one step off and it is a long smear of chalk running to the rope.
  dumbo(c, r, g, X, K) {
    const { THREE } = c;
    // sun through the gap between the warehouses, and the dust in it
    [[4.5, -0.25], [9, -0.15], [14, -0.3]].forEach(([x, rz], k) => shaft(c, g, x, 10, -2 + k * 1.5, 2.4 + k * 0.6, 11, 0.35, 0.1, rz, 0xffd8a0, 0.08));
    motes(c, r, g, 140, [2, 18, 0.5, 6, -6, 6], 0xffe0b0, 0.05, 0.6);
    // the gas lamps lit, even in the day
    [3.4, 13.3].forEach((x) => { glow(c, K, g, 'rgba(255,210,140,.8)', x, 3.75, -0.6, 1.0, 0.8); });
    // painted wood signs on iron brackets, high on both walls
    blade(c, g, 'MLOW & SONS\nCOAL  ICE  WOOD', 0.12, 5.2, -3.2, -1, { bg: '#2a1a10', fg: '#f0d8a0' });
    blade(c, g, 'N3W DRY GOODS\nEST. 1922', 19.6, 5.6, -4.6, 1, { bg: '#10202a', fg: '#f4ead2' });
    blade(c, g, 'ROOMS\nBY THE WEEK', 19.6, 4.2, -0.4, 1, { bg: '#3a1010', fg: '#f4ead2', w: 1.2, h: 0.6 });
    // two iron fire escapes, two landings each, high on the walls
    const iron = std(c, 0x222222, { metalness: 0.7, roughness: 0.5 }), bars = [];
    [[0.12, 1], [19.62, -1]].forEach(([x, s]) => [5.0, 7.6].forEach((y) => { g.add(c.slab(1.0, 0.06, 4.0, iron, x + s * 0.5, y, -3.5)); g.add(c.slab(0.04, 0.04, 4.0, iron, x + s * 0.98, y + 0.9, -3.5)); for (let k = 0; k <= 16; k++) bars.push([x + s * 0.98, y + 0.45, -5.5 + k * 0.25]); }));
    many(c, g, new THREE.BoxGeometry(0.025, 0.9, 0.025), iron, bars);
    [[0.12, 1], [19.62, -1]].forEach(([x, s]) => { const l = c.slab(0.05, 2.9, 0.05, iron, x + s * 0.75, 6.3, -1.6); l.rotation.x = 0.35; g.add(l); const l2 = c.slab(0.05, 2.9, 0.05, iron, x + s * 0.35, 6.3, -1.6); l2.rotation.x = 0.35; g.add(l2); });
    // telegraph wires across the street, high
    [8.2, 8.6, 9.0].forEach((y, k) => g.add(c.slab(19.4, 0.015, 0.015, std(c, 0x111111), 9.9, y, -5.2 + k * 0.3)));
    // a fruit cart with a striped awning and a heap of apples, in the middle of the street
    const cart = new THREE.Group(); cart.position.set(15.4, 0, -4.4); cart.rotation.y = 0.35; g.add(cart); c.post(X(15.4), -4.4, 0.9);
    const wood = std(c, 0x5a3a20, { roughness: 0.8 }); cart.add(c.slab(1.6, 0.12, 0.9, wood, 0, 0.8, 0)); cart.add(c.slab(1.6, 0.3, 0.05, wood, 0, 0.95, 0.43)); cart.add(c.slab(1.6, 0.3, 0.05, wood, 0, 0.95, -0.43));
    [-0.8, 0.8].forEach((x) => { const w = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.04, 6, 16), wood); w.position.set(x, 0.38, 0); w.rotation.y = H; cart.add(w); });
    [[-0.75, -0.4], [0.75, -0.4], [-0.75, 0.4], [0.75, 0.4]].forEach(([x, z]) => cart.add(c.slab(0.04, 1.2, 0.04, wood, x, 1.5, z)));
    const awn = ctex(c, 'dum_awn', 256, 64, (q, w, h) => { for (let x = 0; x < w; x += 32) { q.fillStyle = (x / 32) % 2 ? '#e8dcc0' : '#8a2a1a'; q.fillRect(x, 0, 32, h); } q.fillStyle = 'rgba(0,0,0,.2)'; q.fillRect(0, h - 8, w, 8); });
    const aw = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1), new THREE.MeshStandardMaterial({ map: awn, side: THREE.DoubleSide, roughness: 0.9 })); aw.rotation.x = -H + 0.25; aw.position.set(0, 2.15, 0); cart.add(aw);
    const ap = []; for (let k = 0; k < 40; k++) ap.push([-0.65 + (k % 10) * 0.14 + (Math.random() - 0.5) * 0.04, 0.92 + Math.floor(k / 20) * 0.07, -0.25 + (Math.floor(k / 10) % 2) * 0.22 + (Math.random() - 0.5) * 0.08]);
    many(c, cart, new THREE.SphereGeometry(0.055, 10, 8), std(c, 0x8a1a10, { roughness: 0.4 }), ap);
    const tag = c.sign('APPLES 2 CENTS\nMLOW FRUIT', { w: 0.7, h: 0.3, bg: '#f4ead2', fg: '#3a1a10', font: c.SERIF, weight: 800 }); tag.position.set(0, 1.12, 0.47); cart.add(tag);
    // milk cans by the barrel, a manhole that steams, newspapers that will not lie still
    many(c, g, new THREE.CylinderGeometry(0.16, 0.18, 0.62, 14), std(c, 0xa8a8a0, { metalness: 0.8, roughness: 0.35 }), [[3.4, 0.31, -3.4], [3.75, 0.31, -3.2], [3.55, 0.31, -2.85]]);
    const mh = ctex(c, 'dum_mh', 256, 256, (q) => { q.fillStyle = '#2a2622'; q.beginPath(); q.arc(128, 128, 124, 0, 7); q.fill(); q.strokeStyle = '#5a524a'; q.lineWidth = 6; for (let k = 1; k < 6; k++) { q.beginPath(); q.arc(128, 128, k * 20, 0, 7); q.stroke(); } q.fillStyle = '#8a7a68'; q.font = `800 22px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('N3W YORK CITY', 128, 64); q.fillText('SEWER 1922', 128, 206); });
    flat(c, g, 0.9, 0.9, decalMat(c, mh, { roughness: 0.4, metalness: 0.5 }), 12.6, 4.4);
    puff(c, r, K, g, 12.6, 0.1, 4.4, 'rgba(240,230,210,.35)', 7, 2.6, 0.4, 1.8);
    const news = ctex(c, 'dum_news', 128, 160, (q, w, h) => { q.fillStyle = '#e8e0cc'; q.fillRect(0, 0, w, h); q.fillStyle = '#222'; q.font = `900 18px ${c.SERIF}`; q.fillText('N3W YORK', 10, 22); q.fillText('COUNTED', 10, 42); for (let y = 52; y < h - 6; y += 7) q.fillRect(8 + (y % 3) * 2, y, w - 20 - (y % 5) * 6, 3); });
    const papers = [[6.4, 2.2], [9.2, -2.6], [17.2, 2.8], [3.0, 4.6]].map(([x, z], k) => { const p = flat(c, g, 0.42, 0.52, new THREE.MeshStandardMaterial({ map: news, side: THREE.DoubleSide, roughness: 0.9 }), x, z, 0.03, k * 1.3); return p; });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; papers.forEach((p, k) => { p.rotation.x = -H + Math.max(0, Math.sin(t * 1.7 + k * 2)) * 0.5; p.position.y = 0.03 + Math.max(0, Math.sin(t * 1.7 + k * 2)) * 0.08; }); });

    // THE ILLUSION. A vertical board that is not there, 2.4 m in front of the X, projected from the eye at the X onto the cobbles.
    const E = new THREE.Vector3(10.6, 1.62, 1.4), zc = -1.0, cw = 2.4, chh = 1.12;
    const chalk = ctex(c, 'dum_chalk', 1024, 480, (q, w, h) => {
      q.clearRect(0, 0, w, h); const sc = (col, a) => { q.strokeStyle = col; q.globalAlpha = a; };
      q.fillStyle = 'rgba(240,226,190,.88)'; q.fillRect(30, 20, w - 60, h - 70); q.fillStyle = 'rgba(60,40,30,.9)'; q.fillRect(54, 44, w - 108, h - 118);
      q.fillStyle = '#f0d890'; q.font = `900 64px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('ONCE UPON A TIME', w / 2, 120); q.fillStyle = '#f4ead2'; q.font = `900 86px ${c.SERIF}`; q.fillText('IN N3W YORK', w / 2, 212);
      K.eyeFlower(q, w / 2, 300, 62, '#f4e0e8', '#d84a7a'); q.fillStyle = '#f0d890'; q.font = `700 30px ${c.MONO}`; q.fillText('A PICTURE BY MLOW, 1922', w / 2, 392);
      for (const [x0, x1] of [[60, 120], [w - 120, w - 60]]) { q.fillStyle = 'rgba(120,80,40,.9)'; q.fillRect(x0, h - 50, x1 - x0, 50); }
      q.globalCompositeOperation = 'destination-out'; for (let k = 0; k < 9000; k++) { q.globalAlpha = Math.random() * 0.5; q.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 1 + Math.random() * 2); } q.globalCompositeOperation = 'source-over'; q.globalAlpha = 1; void sc;
    });
    const geo = new THREE.PlaneGeometry(cw, chh, 32, 24), pos = geo.attributes.position, V = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) { V.set(E.x + pos.getX(i), pos.getY(i) + chh / 2, zc); const t = (E.y - 0.02) / (E.y - V.y); pos.setXYZ(i, E.x + (V.x - E.x) * t, 0.02, E.z + (V.z - E.z) * t); }
    geo.computeVertexNormals(); geo.computeBoundingSphere();
    const art = new THREE.Mesh(geo, decalMat(c, chalk, { roughness: 1, side: THREE.DoubleSide })); g.add(art);
    // the board's painted shadow, so it seems to stand in the same sun as everything else
    const sh = ctex(c, 'dum_sh', 64, 64, (q) => { const gr = q.createLinearGradient(0, 64, 0, 0); gr.addColorStop(0, 'rgba(20,12,6,.55)'); gr.addColorStop(1, 'rgba(20,12,6,0)'); q.fillStyle = gr; q.fillRect(0, 0, 64, 64); });
    const shg = new THREE.BufferGeometry(); shg.setAttribute('position', new THREE.Float32BufferAttribute([E.x - cw / 2, 0.016, zc, E.x + cw / 2, 0.016, zc, E.x + cw / 2 + 0.9, 0.016, zc - 1.0, E.x - cw / 2, 0.016, zc, E.x + cw / 2 + 0.9, 0.016, zc - 1.0, E.x - cw / 2 + 0.9, 0.016, zc - 1.0], 3)); shg.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2)); shg.computeVertexNormals();
    g.add(new THREE.Mesh(shg, decalMat(c, sh, { roughness: 1, side: THREE.DoubleSide })));
    c.clickable(art, () => { c.sound.tick(); c.egg('dumbo_chalk', 'Chalk on the cobbles, twelve metres long. From the X it stands up like a poster board; from anywhere else it is a mess the rain will fix. MLow drew it lying on his stomach.'); }, 'The chalk drawing');
  },

  // BELMONT AVENUE. Illusion: an open manhole that is only paint. A shader traces your own eye down a brick shaft four
  // metres deep, so it holds from anywhere you stand, and you can walk straight across it.
  bronx(c, r, g, X, K) {
    const { THREE } = c, cc = new THREE.Color();
    // the feast arch: an arc of bulbs over the avenue with a second arc inside and spokes between
    const pts = [], add = (x, y) => pts.push([x, y, -1.2]);
    for (let k = 0; k <= 64; k++) { const a = k / 64 * PI; add(10 + Math.cos(a) * 9.4, 3.3 + Math.sin(a) * 3.1); }
    for (let k = 0; k <= 50; k++) { const a = k / 50 * PI; add(10 + Math.cos(a) * 8.0, 3.3 + Math.sin(a) * 2.5); }
    for (let k = 1; k < 14; k++) { const a = k / 14 * PI; for (let j = 0; j < 3; j++) { const f = 2.5 + (j + 0.5) * 0.15; add(10 + Math.cos(a) * (8.0 + (j + 0.5) * 0.35), 3.3 + Math.sin(a) * f); } }
    for (let k = 0; k < 18; k++) { const a = k / 18 * PI * 2; add(10 + Math.cos(a) * 0.7, 5.0 + Math.sin(a) * 0.7); add(10 + Math.cos(a) * 0.4, 5.0 + Math.sin(a) * 0.4); }
    const arch = many(c, g, new THREE.SphereGeometry(0.055, 8, 6), new THREE.MeshBasicMaterial({ toneMapped: false }), pts), AC = [0xfff0c0, 0xff5a5a, 0x7affa0, 0xffd060];
    pts.forEach((p, k) => arch.setColorAt(k, cc.set(AC[k % 4]).multiplyScalar(2)));
    glow(c, K, g, 'rgba(255,220,150,.6)', 10, 5.0, -1.2, 2.2, 0.7);
    // painted neon blades out from both walls
    [['N3W PORK STORE', 0.12, 4.7, -4.0, -1, '#ff5a5a'], ['BELMONT SOCIAL', 19.62, 4.9, -2.4, 1, '#7affa0'], ['PASTICCERIA MLOW', 0.12, 4.7, 0.9, -1, '#ffd060']].forEach(([t, x, y, z, s, col]) => { const n = c.sign(t, { w: 2.2, h: 0.5, bg: '#0b0b0b', fg: col, glow: 16, border: col, font: c.SERIF, weight: 900 }); n.material.color.setScalar(1.5); n.material.side = THREE.DoubleSide; n.rotation.y = 0; n.position.set(x - s * 1.25, y, z); g.add(n); g.add(c.slab(2.5, 0.04, 0.04, std(c, 0x111111, { metalness: 0.7 }), x - s * 1.25, y + 0.3, z)); });
    // the street lamp lit with a cone of light under it, and moths in it
    glow(c, K, g, 'rgba(255,220,160,.9)', 1.2, 4.35, 3.4, 1.3); beam(c, g, 1.2, 4.3, 3.4, 4.3, 0.12, 1.3, 0xffe0b0, 0.12);
    motes(c, r, g, 30, [0.6, 1.8, 3.4, 4.6, 2.8, 4.0], 0xfff0d0, 0.03, 0.9);
    // puddles that hold the lights, and a zebra crossing
    const pud = ctex(c, 'bx_pud', 128, 128, (q) => { const gr = q.createRadialGradient(64, 64, 10, 64, 64, 64); gr.addColorStop(0, 'rgba(10,10,14,.7)'); gr.addColorStop(0.7, 'rgba(10,10,14,.55)'); gr.addColorStop(1, 'rgba(10,10,14,0)'); q.fillStyle = gr; q.beginPath(); q.ellipse(64, 64, 62, 44, 0.3, 0, 7); q.fill(); });
    [[11.0, 3.2, 2.2], [4.2, -0.6, 1.6], [16.8, -3.6, 1.8], [9.4, -0.9, 1.4]].forEach(([x, z, s], k) => flat(c, g, s, s * 0.7, decalMat(c, pud, { metalness: 1, roughness: 0.02, color: 0x888888 }), x, z, 0.017, k));
    const zeb = rep(ctex(c, 'bx_zeb', 64, 64, (q) => { q.fillStyle = 'rgba(240,236,224,.85)'; q.fillRect(0, 0, 36, 64); }), 18, 1);
    flat(c, g, 14, 1.6, decalMat(c, zeb, { roughness: 0.7 }), 9.5, 3.4, 0.015);
    // the hydrant is open: an arc of water that falls back to the asphalt
    const NW = c.MOBILE ? 40 : 80, wp = new Float32Array(NW * 3), wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.BufferAttribute(wp, 3));
    const water = new THREE.Points(wg, new THREE.PointsMaterial({ color: 0xd8f0ff, size: 0.06, map: dotTex(c), transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); water.frustumCulled = false; g.add(water);
    // wires across the avenue, a pair of sneakers thrown over them
    [7.6, 7.9].forEach((y, k) => g.add(c.slab(19.4, 0.015, 0.015, std(c, 0x111111), 9.9, y, -3.0 + k * 0.4)));
    const shoes = new THREE.Group(); shoes.position.set(12.5, 7.6, -3.0); g.add(shoes); [-0.12, 0.12].forEach((x, k) => { shoes.add(c.slab(0.004, 0.5 + k * 0.1, 0.004, std(c, 0xeeeeee), x, -0.25 - k * 0.05, 0)); shoes.add(c.slab(0.1, 0.1, 0.28, std(c, k ? 0xf4f4f0 : 0xd83a3a), x, -0.55 - k * 0.1, 0)); });
    // a newspaper box by the stoop
    const nb = ctex(c, 'bx_nb', 128, 160, (q, w, h) => { q.fillStyle = '#b81818'; q.fillRect(0, 0, w, h); q.fillStyle = '#f4ead2'; q.font = `900 20px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('N3W DAILY', w / 2, 30); q.fillStyle = '#e8e0cc'; q.fillRect(14, 44, w - 28, 70); q.fillStyle = '#222'; q.font = `900 14px ${c.SERIF}`; q.fillText('COUNTED', w / 2, 66); q.fillText('ON BELMONT', w / 2, 84); q.fillStyle = '#ddd'; q.fillRect(30, 130, w - 60, 8); });
    const red = std(c, 0xb81818), box = c.slab(0.5, 1.0, 0.45, red, 4.0, 0.5, -4.4); box.material = [red, red, red, red, new THREE.MeshStandardMaterial({ map: nb }), red]; g.add(box); c.post(X(4.0), -4.4, 0.35);

    // THE ILLUSION. The painted shaft.
    const PX = 6.8, PZ = -2.2, PR = 0.75;
    const U = { uC: { value: new THREE.Vector3(r.x0 + PX, 0, PZ) }, uR: { value: PR }, uD: { value: 2.6 }, uT: { value: 0 } };
    const pit = new THREE.Mesh(new THREE.PlaneGeometry(PR * 2, PR * 2).rotateX(-H), new THREE.ShaderMaterial({ uniforms: U,
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `uniform vec3 uC; uniform float uR, uD, uT; varying vec3 vW;
        float h1(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        void main(){
          vec2 q = vW.xz - uC.xz; float rr = length(q); if (rr > uR) discard;
          vec3 dir = normalize(vW - cameraPosition); if (dir.y > -0.0005) discard;
          vec2 d2 = dir.xz; float a = dot(d2, d2), b = 2.0 * dot(q, d2), cq = dot(q, q) - uR * uR;
          float tw = a < 1e-7 ? 1e6 : (-b + sqrt(max(b * b - 4.0 * a * cq, 0.0))) / (2.0 * a);
          float tb = (-uD - vW.y) / dir.y; vec3 col;
          if (tw < tb) {
            vec3 p = vW + dir * tw; float dp = -p.y; vec2 rq = p.xz - uC.xz; float ang = atan(rq.y, rq.x);
            float row = floor(dp / 0.1); float u = ang * uR / 0.22 + mod(row, 2.0) * 0.5;
            float mortar = max(step(0.86, fract(dp / 0.1)), step(0.9, fract(u)));
            vec3 brick = mix(vec3(0.34, 0.15, 0.09), vec3(0.2, 0.1, 0.07), h1(vec2(floor(u), row)));
            col = mix(brick, vec3(0.12, 0.11, 0.1), mortar);
            float la = abs(mod(ang - 1.3 + 3.14159, 6.28318) - 3.14159);
            if (la < 0.24 && fract(dp / 0.32) < 0.13) col = vec3(0.3, 0.27, 0.24);
            if (abs(la - 0.24) < 0.035) col = vec3(0.3, 0.28, 0.26);
            col *= exp(-dp * 1.1);
            col += vec3(1.0, 0.45, 0.12) * pow(clamp(dp / uD, 0.0, 1.0), 2.0) * 0.9;
          } else {
            vec3 p = vW + dir * tb; vec2 bq = p.xz - uC.xz;
            float w = 0.5 + 0.5 * sin(bq.x * 22.0 + uT * 2.0) * sin(bq.y * 19.0 - uT * 1.4);
            col = vec3(0.5, 0.22, 0.06) + vec3(1.0, 0.6, 0.25) * 0.35 * w;
            float tr = smoothstep(0.35, 0.0, abs(mod(uT * 1.6, 8.0) - 4.0 - bq.x)); col += vec3(1.0, 0.85, 0.5) * tr * 0.9;
          }
          col *= smoothstep(uR, uR - 0.05, rr) * 0.6 + 0.4;
          gl_FragColor = vec4(col, 1.0);
        }` }));
    pit.position.set(PX, 0.013, PZ); g.add(pit);
    const collar = new THREE.Mesh(new THREE.RingGeometry(PR, PR + 0.1, 40).rotateX(-H), std(c, 0x2a2826, { metalness: 0.8, roughness: 0.45 })); collar.position.set(PX, 0.018, PZ); g.add(collar);
    const cov = ctex(c, 'bx_cov', 256, 256, (q) => { q.fillStyle = '#2e2a26'; q.beginPath(); q.arc(128, 128, 126, 0, 7); q.fill(); q.strokeStyle = '#4a443e'; q.lineWidth = 7; for (let x = -120; x < 130; x += 18) { q.beginPath(); q.moveTo(128 + x, 0); q.lineTo(128 + x + 60, 256); q.stroke(); } q.fillStyle = '#6a625a'; q.font = `900 24px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('DEPT OF THE COUNTED', 128, 134); });
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(PR + 0.05, PR + 0.05, 0.05, 32), [std(c, 0x2a2622, { metalness: 0.8 }), new THREE.MeshStandardMaterial({ map: cov, metalness: 0.7, roughness: 0.5 }), std(c, 0x2a2622)]); lid.position.set(PX + 1.75, 0.03, PZ + 0.6); lid.rotation.y = 0.4; g.add(lid);
    puff(c, r, K, g, PX, 0.1, PZ, 'rgba(240,235,230,.32)', 8, 3.0, 0.5, 2.0);
    const cones = []; for (let k = 0; k < 4; k++) { const a = k / 4 * PI * 2 + 0.6; cones.push([PX + Math.cos(a) * (PR + 0.5), 0.3, PZ + Math.sin(a) * (PR + 0.5)]); }
    many(c, g, new THREE.ConeGeometry(0.16, 0.6, 14), std(c, 0xff6a10, { roughness: 0.5 }), cones);
    const saw = c.sign('MEN WORKING\nDEPT OF THE COUNTED', { w: 1.3, h: 0.36, bg: '#f4d020', fg: '#111', font: c.MONO, weight: 800 }); saw.material.side = THREE.DoubleSide; saw.position.set(PX - 1.45, 0.85, PZ + 0.2); saw.rotation.y = 1.1; g.add(saw);
    [-0.55, 0.55].forEach((dx) => g.add(c.slab(0.05, 0.9, 0.05, std(c, 0xd8d8d0), PX - 1.45 + dx * Math.cos(1.1), 0.45, PZ + 0.2 - dx * Math.sin(1.1))));
    c.clickable(pit, () => { c.sound.drip(); c.egg('bronx_manhole', 'Go on, step in. It is paint, four metres of it, and it follows your eye. On Belmont Avenue even the holes in the street are a show. MLow signed the bottom.'); }, 'The open manhole');
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return; U.uT.value = t;
      const tw = (t * 3) | 0; if (tw !== arch.userData.tw) { arch.userData.tw = tw; pts.forEach((p, k) => arch.setColorAt(k, cc.set(AC[(k + tw) % 4]).multiplyScalar((k + tw) % 7 ? 2 : 0.4))); arch.instanceColor.needsUpdate = true; }
      for (let k = 0; k < NW; k++) { const u = ((t * 0.9 + k / NW) % 1), i = k * 3; wp[i] = 9.2 + 0.25 + u * 2.4 + Math.sin(k) * 0.05; wp[i + 1] = 0.55 + u * 2.2 - u * u * 2.7; wp[i + 2] = -1.4 + Math.sin(k * 7) * 0.12 * u; if (wp[i + 1] < 0.02) wp[i + 1] = 0.02; } wg.attributes.position.needsUpdate = true;
    });
  },

  // THE KITCHEN. Illusion: the cafe wall. Black and white tiles in dead straight rows, each row slid a quarter tile;
  // the grey grout lines between them look like wedges, every row tilting. Island front, side counter, backsplash.
  kramer(c, r, g, X, K) {
    const { THREE } = c;
    const cafe = (key, wm, hm, rows) => { const hp = 64 * rows, wp = Math.min(2048, Math.round(hp * wm / hm)), th = hp / rows, tw = th * (wm / hm) / (wp / hp) ; return ctex(c, key, wp, hp, (q, w, h) => {
      q.fillStyle = '#8a8a86'; q.fillRect(0, 0, w, h); const tws = w / Math.round(wm / (hm / rows)); const off = [0, 0.25, 0.5, 0.25];
      for (let j = 0; j < rows; j++) { const o = off[j % 4] * tws * 2; for (let k = -2; k * tws < w + tws; k++) { q.fillStyle = k % 2 ? '#f4f2ec' : '#141414'; q.fillRect(k * tws + o, j * th + 2, tws, th - 4); } }
      q.fillStyle = 'rgba(255,255,255,.07)'; for (let j = 0; j < rows; j++) q.fillRect(0, j * th + 4, w, 3); void tw; }); };
    const tileM = (t) => new THREE.MeshStandardMaterial({ map: t, roughness: 0.18, metalness: 0.05 });
    // the island: butcher block on top, the cafe wall on the front
    findAt(g, 10, 0.46, -1.4).forEach((o) => { o.material = c.surf('planks', 1.2, 0xc89a68); });
    const isl = panel(c, g, 8, 0.92, tileM(cafe('kr_isl', 8, 0.92, 4)), 10, 0.46, -0.69);
    panel(c, g, 2.4, 0.92, tileM(cafe('kr_side', 2.4, 0.92, 4)), 2.6, 0.46, -6.84);
    [2.03, 17.97].forEach((x) => panel(c, g, 3.86, 1.28, tileM(cafe('kr_back', 3.86, 1.28, 6)), x, 1.56, -7.985));
    // a cream plaster ceiling with a round medallion, and light under the two pendants
    const ceil = panel(c, g, 20, 16, ceilMat(c, 0xf4ead8), 10, 5.94, 0); ceil.rotation.x = H;
    const med = ctex(c, 'kr_med', 256, 256, (q) => { q.strokeStyle = 'rgba(120,100,80,.6)'; q.lineWidth = 6; for (let k = 0; k < 5; k++) { q.beginPath(); q.arc(128, 128, 120 - k * 18, 0, 7); q.stroke(); } for (let k = 0; k < 24; k++) { const a = k / 24 * PI * 2; q.beginPath(); q.arc(128 + Math.cos(a) * 92, 128 + Math.sin(a) * 92, 8, 0, 7); q.stroke(); } });
    [[8, -1.4], [12, -1.4]].forEach(([x, z]) => { const m = panel(c, g, 1.6, 1.6, decalMat(c, med), x, 5.92, z); m.rotation.x = H; beam(c, g, x, 4.72, z, 3.8, 0.16, 1.0, 0xfff0d8, 0.1); });
    // two windows high on the side walls, morning coming in, the light falling across the island
    const win = ctex(c, 'kr_win', 256, 256, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#fff6dc'); gr.addColorStop(1, '#ffd890'); q.fillStyle = gr; q.fillRect(0, 0, w, h); q.fillStyle = 'rgba(120,90,50,.45)'; for (let y = 6; y < h; y += 14) q.fillRect(0, y, w, 5); q.fillStyle = '#f4ead2'; q.fillRect(0, 0, w, 10); q.fillRect(0, h - 10, w, 10); q.fillRect(0, 0, 10, h); q.fillRect(w - 10, 0, 10, h); q.fillRect(w / 2 - 5, 0, 10, h); });
    [[19.62, -H], [0.13, H]].forEach(([x, ry]) => { const p = panel(c, g, 1.8, 1.6, new THREE.MeshBasicMaterial({ map: win, toneMapped: false, color: new THREE.Color(1.35, 1.3, 1.2) }), x, 4.3, -4.2, ry); void p; });
    [-5.2, -4.2, -3.2].forEach((z, k) => shaft(c, g, 19.4, 4.9, z, 1.2, 9, 0, 0, 0.95 - k * 0.05, 0xfff0c8, 0.07));
    motes(c, r, g, 100, [7, 19, 0.9, 4.6, -5.6, -0.8], 0xfff4dc, 0.04, 0.65);
    // a copper pot rack over the side counter
    const iron = std(c, 0x222222, { metalness: 0.7, roughness: 0.4 }), copper = std(c, 0xc8703a, { metalness: 1, roughness: 0.28 });
    g.add(c.slab(2.4, 0.04, 0.04, iron, 2.6, 2.9, -7.3)); [1.5, 3.7].forEach((x) => g.add(c.slab(0.02, 0.5, 0.02, iron, x, 3.15, -7.3)));
    [[1.7, 0.2], [2.3, 0.15], [2.9, 0.24], [3.5, 0.17]].forEach(([x, rr], k) => { const pot = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr * 0.9, rr * 0.9, 18), copper); pot.position.set(x, 2.55 - rr * 0.5, -7.3 + (k % 2) * 0.05); g.add(pot); g.add(c.slab(0.012, 0.25, 0.012, iron, x, 2.78, -7.3)); });
    // a braided oval rug in the living corner
    const rug = ctex(c, 'kr_rug', 256, 192, (q, w, h) => { const cols = ['#8a4a2a', '#c89a50', '#4a6a3a', '#a85a3a', '#e8d0a0', '#6a3a2a']; for (let k = 0; k < 14; k++) { q.fillStyle = cols[k % 6]; q.beginPath(); q.ellipse(w / 2, h / 2, w / 2 - k * 8.5, h / 2 - k * 6.5, 0, 0, 7); q.fill(); } });
    flat(c, g, 3.2, 2.4, new THREE.MeshStandardMaterial({ map: rug, transparent: true, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 }), 15.2, 0.9, 0.012, H);
    // breakfast laid for two: plates, juice, a box of N3W FLAKES
    const plate = std(c, 0xf4f2ec, { roughness: 0.3 }), oj = new THREE.MeshStandardMaterial({ color: 0xffa020, emissive: 0x803000, transparent: true, opacity: 0.85, roughness: 0.1 });
    many(c, g, new THREE.CylinderGeometry(0.13, 0.1, 0.02, 20), plate, [[3.75, 0.77, -3.4], [4.25, 0.77, -3.4]]);
    many(c, g, new THREE.CylinderGeometry(0.035, 0.03, 0.12, 12), oj, [[3.7, 0.82, -3.15], [4.3, 0.82, -3.65]]);
    const fl = ctex(c, 'kr_flakes', 128, 192, (q, w, h) => { q.fillStyle = '#f5c542'; q.fillRect(0, 0, w, h); q.fillStyle = '#c81818'; q.font = `900 30px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('N3W', w / 2, 40); q.fillText('FLAKES', w / 2, 72); K.eyeFlower(q, w / 2, 130, 40); });
    const box = c.slab(0.2, 0.3, 0.07, std(c, 0xf5c542), 4.0, 0.91, -3.75); box.material = [std(c, 0xf5c542), std(c, 0xf5c542), std(c, 0xf5c542), std(c, 0xf5c542), new THREE.MeshStandardMaterial({ map: fl }), std(c, 0xf5c542)]; g.add(box);
    c.clickable(isl, () => { c.sound.tick(); c.egg('kramer_tiles', 'Every row of tiles on this island is dead level. Your eyes say they slope like a bad kitchen floor. Billy says the same about the eggs. MLow laid them himself, with a ruler.'); }, 'The tiles');
  },

  // THE MODEL. Illusion: the Beuchet chair. From the mark by the east wall a New Yorker sits on a chair three storeys
  // high, small as an ant. Step off the mark: the legs are here, the seat floats eight metres further on, and he is normal size.
  zoolander(c, r, g, X, K) {
    const { THREE } = c, cc = new THREE.Color();
    // runway lights, both edges
    const rl = []; for (let k = 0; k < 24; k++) { const x = 4.7 + k * 0.46; rl.push([x, 0.04, 0.74], [x, 0.04, 2.26]); }
    const run = many(c, g, new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ toneMapped: false }), rl);
    rl.forEach((p, k) => run.setColorAt(k, cc.set(0xffffff).multiplyScalar(2)));
    // a truss over the runway with four cans, and their light
    const truss = std(c, 0xb8bcc0, { metalness: 0.9, roughness: 0.3 });
    [1.1, 1.9].forEach((z) => [5.15, 5.55].forEach((y) => g.add(c.slab(11, 0.05, 0.05, truss, 10, y, z))));
    for (let x = 4.6; x <= 15.4; x += 0.6) { const d = c.slab(0.03, 0.56, 0.03, truss, x, 5.35, 1.1); d.rotation.z = 0.6; g.add(d); const d2 = c.slab(0.03, 0.56, 0.03, truss, x, 5.35, 1.9); d2.rotation.z = -0.6; g.add(d2); }
    [6, 8.7, 11.3, 14].forEach((x) => { g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.35, 14), std(c, 0x111111, { metalness: 0.6 })).translateX(x).translateY(4.95).translateZ(1.5)); const lens = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), hot(c, 0xffffff, 2.5)); lens.rotation.x = H; lens.position.set(x, 4.77, 1.5); g.add(lens); beam(c, g, x, 4.76, 1.5, 4.75, 0.1, 0.7, 0xffffff, 0.09); });
    // backlit fashion boxes high on both walls
    const lb = (t1, t2, col) => c.canvasTex(512, 320, (q, w, h) => { const gr = q.createLinearGradient(0, 0, w, h); gr.addColorStop(0, col); gr.addColorStop(1, '#0b1020'); q.fillStyle = gr; q.fillRect(0, 0, w, h); K.eyeFlower(q, 120, h / 2, 90); q.fillStyle = '#fff'; q.font = `900 54px ${c.SERIF}`; q.fillText(t1, 230, h / 2 - 6); q.font = `600 26px ${c.MONO}`; q.fillText(t2, 234, h / 2 + 40); });
    [[0.14, -2.6, H, 'BLUE STEEL', 'A LOOK BY MLOW', '#22d3ee'], [0.14, 1.0, H, 'LE MLOW', 'N3W FASHION WEEK', '#ff4fa3'], [19.6, -2.6, -H, 'N3W STEEL', 'COUNTED, NOT SEEN', '#f5c542'], [19.6, 1.0, -H, 'N3W LOOK', 'WALK OFF TONIGHT', '#9b5cff']].forEach(([x, z, ry, a, b, col]) => {
      const p = panel(c, g, 2.4, 1.5, new THREE.MeshBasicMaterial({ map: lb(a, b, col), toneMapped: false }), x, 4.4, z, ry); p.material.color.setScalar(1.25); g.add(c.slab(0.06, 1.6, 2.5, std(c, 0x111111, { metalness: 0.8 }), x + (ry > 0 ? -0.04 : 0.04), 4.4, z)); });
    // front row ottomans along the north edge of the runway
    const ot = []; for (let k = 0; k < 8; k++) ot.push([5.4 + k * 1.3, 0.22, 0.2]);
    many(c, g, new THREE.BoxGeometry(0.5, 0.44, 0.5), std(c, 0xf4f4f0, { roughness: 0.35 }), ot);
    // photographers' flashes, and confetti coming down over the runway
    const flashes = [[15.9, 1.3, 0.6], [15.9, 1.3, 2.4]].map(([x, y, z]) => glow(c, K, g, 'rgba(255,255,255,1)', x, y, z, 1.6, 0));
    motes(c, r, g, 120, [4.6, 15.4, 0.3, 5, 0.6, 2.4], 0xff9ad8, 0.06, 0.8);
    const neon = neonWord(c, 'N3W LOOK', { w: 3.4, h: 0.8, fg: '#ff4fa3' }); neon.position.set(10, 4.6, 7.86); neon.rotation.y = PI; g.add(neon);

    // THE ILLUSION. Everything is built at its place for the eye at E, then the seat half is pushed back along the
    // rays from E by k and scaled by k, so from E it still lines up exactly with the legs.
    const E = new THREE.Vector3(18.4, 1.62, -6.0), k = 2.6, C1 = new THREE.Vector3(13.4, 0, -6.0);
    const legsG = new THREE.Group(), farG = new THREE.Group(); g.add(legsG, farG);
    const gold = std(c, 0xd8b048, { metalness: 1, roughness: 0.25 }), lac = std(c, 0xf4f2ee, { roughness: 0.2 }), pink = std(c, 0xff4fa3, { roughness: 0.5 });
    [[0.45, 0.45], [0.45, -0.45], [-0.45, 0.45], [-0.45, -0.45]].forEach(([x, z]) => legsG.add(c.slab(0.09, 1.9, 0.09, gold, C1.x + x, 0.95, C1.z + z)));
    [[0, 0.45], [0, -0.45]].forEach(([x, z]) => legsG.add(c.slab(0.9, 0.05, 0.05, gold, C1.x + x, 0.55, C1.z + z)));
    farG.add(c.slab(1.0, 0.1, 1.0, lac, C1.x, 1.92, C1.z)); farG.add(c.slab(0.9, 0.08, 0.9, pink, C1.x + 0.02, 2.0, C1.z));
    [0.45, -0.45].forEach((z) => farG.add(c.slab(0.08, 1.1, 0.08, gold, C1.x - 0.45, 2.5, C1.z + z))); farG.add(c.slab(0.1, 0.35, 1.0, lac, C1.x - 0.45, 2.95, C1.z));
    const tagT = c.sign('MLOW', { w: 0.5, h: 0.14, bg: null, fg: '#f5c542', font: c.SERIF, weight: 900 }); tagT.rotation.y = H; tagT.position.set(C1.x - 0.39, 2.95, C1.z); farG.add(tagT);
    farG.children.forEach((o) => { o.position.sub(E).multiplyScalar(k).add(E); o.scale.multiplyScalar(k); });
    const sit = new THREE.Vector3(C1.x + 0.05, 2.04, C1.z).sub(E).multiplyScalar(k).add(E);
    const ant = K.extra(g, sit.x, sit.z, { seated: true, col: 0xff4fa3, ry: H }); ant.position.y = sit.y - 0.45; beamTo(c, g, [sit.x + 0.5, 5.95, sit.z], [sit.x, sit.y, sit.z], 0.05, 0.9, 0xffffff, 0.1); glow(c, K, g, 'rgba(255,150,220,.5)', sit.x, sit.y + 0.6, sit.z, 1.6, 0.6);
    c.post(X(C1.x), C1.z, 0.75);
    spot(c, g, E.x, E.z, 'STAND HERE. LOOK WEST.', '#ff4fa3');
    c.clickable(farG, () => { c.sound.whoosh(0.3, 1); c.egg('zoolander_ants', 'From the mark he is the size of an ant on a chair three storeys high. Step off it: the legs are here, the seat floats eight metres away, and he is a normal New Yorker. MLow made the chair three times bigger.'); }, 'The giant chair');
    c.clickable(legsG, () => c.toast('Stand on the pink mark by the east wall and look west at the chair.', 2600), 'The giant chair');
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; flashes.forEach((f, j) => { const u = (t * 0.7 + j * 0.43) % 1; f.material.opacity = u < 0.06 ? 1 - u / 0.06 : 0; }); const ch = (t * 10) | 0; for (let j = 0; j < 24; j++) { const on = (j - ch % 24 + 24) % 24 < 3 ? 3 : 1.3; run.setColorAt(j * 2, cc.set(0xffffff).multiplyScalar(on)); run.setColorAt(j * 2 + 1, cc.set(0xffffff).multiplyScalar(on)); } run.instanceColor.needsUpdate = true; });
  },

  // THE YARD. Illusion: peripheral drift. A burner high on the west wall with eight rotating snakes in it; look
  // anywhere near it and the wheels turn by themselves. Nothing moves. The paint is still wet in your eye.
  wildstyle(c, r, g, X, K) {
    const { THREE } = c;
    const MW = c.MOBILE ? 1024 : 2048, MH = Math.round(MW * 4.6 / 8.6);
    const mural = ctex(c, 'ws_mural' + MW, MW, MH, (q, w, h) => {
      const s = w / 2048;
      const bg = q.createLinearGradient(0, 0, w, h); bg.addColorStop(0, '#2a1240'); bg.addColorStop(0.5, '#401850'); bg.addColorStop(1, '#10203a'); q.fillStyle = '#111'; q.beginPath(); q.roundRect(60 * s, 60 * s, w - 120 * s, h - 120 * s, 120 * s); q.fill(); for (let k = 0; k < 70; k++) { const a = k / 70 * PI * 2; q.beginPath(); q.arc(w / 2 + Math.cos(a) * (w / 2 - 110 * s), h / 2 + Math.sin(a) * (h / 2 - 100 * s), (70 + Math.random() * 40) * s, 0, 7); q.fill(); } q.globalCompositeOperation = 'source-atop'; q.fillStyle = bg; q.fillRect(0, 0, w, h); q.globalCompositeOperation = 'source-over'; q.strokeStyle = '#22d3ee'; q.lineWidth = 14 * s; q.beginPath(); q.roundRect(80 * s, 80 * s, w - 160 * s, h - 160 * s, 110 * s); q.stroke();
      
      // the burner letters
      q.save(); q.translate(w / 2, h * 0.5); q.rotate(-0.05); q.font = `900 ${420 * s}px ${c.SERIF}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.lineJoin = 'round';
      q.lineWidth = 60 * s; q.strokeStyle = '#111'; q.strokeText('WILD', -40 * s, -30 * s); q.lineWidth = 26 * s; q.strokeStyle = '#f4ead2'; q.strokeText('WILD', -40 * s, -30 * s);
      const lg = q.createLinearGradient(0, -260 * s, 0, 200 * s); lg.addColorStop(0, '#ff4fa3'); lg.addColorStop(0.5, '#ff7a1a'); lg.addColorStop(1, '#f5c542'); q.fillStyle = lg; q.fillText('WILD', -40 * s, -30 * s);
      q.font = `900 ${200 * s}px ${c.SERIF}`; q.lineWidth = 34 * s; q.strokeStyle = '#111'; q.strokeText('STYLE', 160 * s, 300 * s); q.fillStyle = '#22d3ee'; q.fillText('STYLE', 160 * s, 300 * s); q.restore();
      q.fillStyle = '#ff4fa3'; for (let k = 0; k < 40; k++) q.fillRect(Math.random() * w, h * 0.72 + Math.random() * h * 0.1, 5 * s, (20 + Math.random() * 90) * s);
      q.font = `900 ${80 * s}px ${c.SERIF}`; q.fillStyle = '#f5c542'; q.fillText('MLow', 80 * s, 140 * s); q.fillStyle = '#fff'; q.fillText('N3W', w - 330 * s, h - 60 * s);
      // eight rotating snakes: rings of black, blue, white, yellow steps; neighbours turn opposite ways
      const disc = (cx, cy, R, dir, mid) => { const N = 6, S = 30, fr = [0, 0.18, 0.5, 0.68, 1], cols = ['#000000', mid, '#ffffff', '#f5c542'];
        q.fillStyle = '#000'; q.beginPath(); q.arc(cx, cy, R * 1.04, 0, 7); q.fill();
        for (let i = 0; i < N; i++) { const r1 = R * (1 - i / N), r0 = R * (1 - (i + 1) / N) + 1; for (let j = 0; j < S; j++) for (let f = 0; f < 4; f++) {
          const a0 = ((j + (i % 2) * 0.5 + fr[f]) / S) * PI * 2 * dir, a1 = ((j + (i % 2) * 0.5 + fr[f + 1]) / S) * PI * 2 * dir;
          q.fillStyle = cols[f]; q.beginPath(); q.arc(cx, cy, r1, a0, a1, dir < 0); q.arc(cx, cy, r0, a1, a0, dir > 0); q.closePath(); q.fill(); } }
        q.fillStyle = '#1d4ed8'; q.beginPath(); q.arc(cx, cy, R / N * 0.9, 0, 7); q.fill(); q.fillStyle = '#fff'; q.beginPath(); q.arc(cx, cy, R / N * 0.4, 0, 7); q.fill(); };
      [[230, 300, 1, '#1d4ed8'], [560, 820, -1, '#ff4fa3'], [880, 260, -1, '#1d4ed8'], [1210, 760, 1, '#ff4fa3'], [1540, 250, 1, '#1d4ed8'], [1840, 700, -1, '#ff4fa3'], [420, 560, -1, '#9b5cff'], [1660, 470, -1, '#9b5cff']].forEach(([x, y, d, m], k) => disc(x * s, y * s, (k > 5 ? 120 : 170) * s, d, m));
    });
    const wall = panel(c, g, 8.6, 4.6, new THREE.MeshBasicMaterial({ map: mural, transparent: true, alphaTest: 0.4, color: 0xd8d8d8 }), 0.14, 6.1, -2.5, H);
    // the floods on both walls throw light on the train
    beamTo(c, g, [0.6, 5.1, -0.2], [9, 1.2, -3.7], 0.12, 1.3, 0xc8d8ff, 0.08); beamTo(c, g, [19.2, 5.1, -0.2], [11, 1.2, -3.7], 0.12, 1.3, 0xffd8a8, 0.08);
    // a yard light mast in the corner, three heads, and their cones
    const mast = std(c, 0x3a3a3a, { metalness: 0.7, roughness: 0.5 }); g.add(c.slab(0.18, 9, 0.18, mast, 0.9, 4.5, 7.1)); g.add(c.slab(1.6, 0.1, 0.1, mast, 1.4, 8.9, 7.1));
    [0.8, 1.4, 2.0].forEach((x) => { g.add(c.slab(0.36, 0.22, 0.3, mast, x, 8.75, 7.1)); const l = panel(c, g, 0.3, 0.24, hot(c, 0xfff0d0, 2.4), x, 8.63, 7.1); l.rotation.x = H; glow(c, K, g, 'rgba(255,240,210,.9)', x, 8.6, 7.1, 1.2); beamTo(c, g, [x, 8.6, 7.1], [x + 2.5, 0, 3.5], 0.15, 1.6, 0xfff0d0, 0.06); });
    c.post(X(0.9), 7.1, 0.3);
    // bare bulbs strung across the yard, sagging
    const sag = []; for (let k = 0; k <= 30; k++) { const u = k / 30; sag.push([0.4 + u * 19.2, 6.0 - Math.sin(u * PI) * 1.2, 0.2]); }
    many(c, g, new THREE.SphereGeometry(0.06, 8, 6), hot(c, 0xffe0a0, 2.2), sag);
    for (let k = 0; k < 30; k++) { const a = sag[k], b = sag[k + 1], wire = c.slab(Math.hypot(b[0] - a[0], b[1] - a[1]), 0.012, 0.012, std(c, 0x111111), (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 0.06, 0.2); wire.rotation.z = Math.atan2(b[1] - a[1], b[0] - a[0]); g.add(wire); }
    // sparks off the third rail under the train
    const sparks = [0, 1, 2, 3].map(() => glow(c, K, g, 'rgba(160,210,255,1)', 0, 0.12, -2.95, 0.5, 0));
    // spray mist at the writer's hand, tags thrown up on the ground, puddles, a moon
    puff(c, r, K, g, 4.4, 1.3, -1.6, 'rgba(255,90,170,.5)', 5, 0.6, 0.15, 0.7);
    const tags = (t, col) => c.canvasTex(256, 128, (q) => { q.font = `900 64px ${c.SERIF}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.lineWidth = 12; q.strokeStyle = '#111'; q.strokeText(t, 128, 64); q.fillStyle = col; q.fillText(t, 128, 64); });
    [['N3W', '#22d3ee', 10.6, 1.0, 0.25], ['MLow', '#f5c542', 15.4, 2.2, -0.35], ['EYE', '#ff4fa3', 5.6, 2.4, 0.5]].forEach(([t, col, x, z, ry]) => flat(c, g, 2.4, 1.2, new THREE.MeshBasicMaterial({ map: tags(t, col), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, color: new THREE.Color(1.2, 1.2, 1.2), toneMapped: false }), x, z, 0.016, ry));
    // pools of coloured light on the ground under the floods and the bulbs
    const pool = (col) => c.canvasTex(128, 128, (q) => { const gr = q.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = gr; q.fillRect(0, 0, 128, 128); });
    [[8.4, -0.6, 5, 'rgba(120,160,255,.55)'], [12.6, -0.4, 5, 'rgba(255,170,90,.55)'], [10, 1.6, 7, 'rgba(255,220,150,.35)'], [17.0, -0.2, 3, 'rgba(255,120,40,.6)']].forEach(([x, z, sz, col]) => flat(c, g, sz, sz * 0.7, new THREE.MeshBasicMaterial({ map: pool(col), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), x, z, 0.018));
    const pud = ctex(c, 'ws_pud', 128, 128, (q) => { const gr = q.createRadialGradient(64, 64, 8, 64, 64, 64); gr.addColorStop(0, 'rgba(6,6,12,.75)'); gr.addColorStop(1, 'rgba(6,6,12,0)'); q.fillStyle = gr; q.fillRect(0, 0, 128, 128); });
    [[11.6, 1.4, 2.4], [3.4, 2.8, 1.8]].forEach(([x, z, s2]) => flat(c, g, s2, s2 * 0.6, decalMat(c, pud, { metalness: 1, roughness: 0.03 }), x, z, 0.015));
    glow(c, K, g, 'rgba(255,250,230,1)', 15, 16, -14, 3.2, 0.9);
    const NS = c.MOBILE ? 60 : 140, sp = []; for (let k = 0; k < NS; k++) sp.push([Math.random() * 20, 11 + Math.random() * 6, -8 + Math.random() * 14]);
    many(c, g, new THREE.SphereGeometry(0.03, 4, 3), hot(c, 0xffffff, 1.8), sp);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; sparks.forEach((s, k) => { const u = (t * 1.3 + k * 0.37) % 1; if (u < 0.02) s.position.x = 2 + ((Math.sin(t * 13 + k * 7) + 1) / 2) * 16; s.material.opacity = u < 0.1 ? (1 - u * 10) : 0; s.scale.setScalar(0.3 + Math.random() * 0.4); }); });
    c.clickable(wall, () => { c.sound.whoosh(0.2, 0.8); c.egg('wildstyle_snakes', 'Nothing on this wall is moving. Look at one wheel and it stops; look away and all eight turn. A burner so wild it spins in your head. MLow painted it in one night.'); }, 'The burner');
  },

  // THE RING. Illusion: moire. The ring skirt is two layers of stripes a hand apart, a little out of step; dark bands
  // the width of a fist sweep along it as you walk round. Over the ring two striped scrims, one turned five degrees, swirl.
  ragingbull(c, r, g, X, K) {
    const { THREE } = c;
    const x1 = 6.5, x2 = 13.5, z1 = -4.5, z2 = 2.5, RH = 0.9;
    const stripe = (key, alpha, ink = '#0a0a0a') => { const t = ctex(c, key, 64, 4, (q) => { if (!alpha) { q.fillStyle = '#f2f2ee'; q.fillRect(0, 0, 64, 4); } q.fillStyle = ink; q.fillRect(0, 0, 32, 4); }); t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.wrapS = t.wrapT = 1000; return t; };
    const back = (len) => { const t = stripe('rb_back', false).clone(); t.repeat.set(len / 0.025, 1); t.needsUpdate = true; return new THREE.MeshBasicMaterial({ map: t, color: 0xb0b0b0 }); };
    const front = (len, p = 0.0275) => { const t = stripe('rb_front', true).clone(); t.repeat.set(len / p, 1); t.needsUpdate = true; return new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }); };
    const skirt = [];
    // south face, split round the steps; east and west faces; the north face too
    skirt.push(panel(c, g, x2 - x1, RH, back(x2 - x1), 10, RH / 2, z2 + 0.006));
    [[x1, 9.35], [10.65, x2]].forEach(([a, b]) => skirt.push(panel(c, g, b - a, RH, front(b - a), (a + b) / 2, RH / 2, z2 + 0.16)));
    [[x1 - 0.006, -H, x1 - 0.16], [x2 + 0.006, H, x2 + 0.16]].forEach(([xb, ry, xf]) => { skirt.push(panel(c, g, z2 - z1, RH, back(z2 - z1), xb, RH / 2, (z1 + z2) / 2, ry)); skirt.push(panel(c, g, z2 - z1, RH, front(z2 - z1), xf, RH / 2, (z1 + z2) / 2, ry)); });
    skirt.push(panel(c, g, x2 - x1, RH, back(x2 - x1), 10, RH / 2, z1 - 0.006, PI)); skirt.push(panel(c, g, x2 - x1, RH, front(x2 - x1), 10, RH / 2, z1 - 0.16, PI));
    // a rail along the outer layer, so it reads as a skirt on a frame
    const blackM = std(c, 0x111111, { metalness: 0.5, roughness: 0.4 });
    g.add(c.slab(x2 - x1 + 0.34, 0.05, 0.05, blackM, 10, RH, z2 + 0.16)); g.add(c.slab(x2 - x1 + 0.34, 0.05, 0.05, blackM, 10, RH, z1 - 0.16)); [x1 - 0.16, x2 + 0.16].forEach((x) => g.add(c.slab(0.05, 0.05, z2 - z1 + 0.34, blackM, x, RH, (z1 + z2) / 2)));
    // the overhead scrims, the second one turned a little
    const sc = (y, rot) => { const t = stripe('rb_white', true, '#ffffff').clone(); t.repeat.set(6.4 / 0.05, 1); t.needsUpdate = true; const m = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 6.4), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, color: 0x9a9a9a })); m.rotation.set(-H, 0, rot, 'XYZ'); m.position.set(10, y, -1); g.add(m); return m; };
    sc(5.55, 0); const sc2 = sc(5.8, 0.09);
    [[6.8, -4.2], [13.2, -4.2], [6.8, 2.2], [13.2, 2.2]].forEach(([x, z]) => g.add(c.slab(0.02, 0.5, 0.02, blackM, x, 5.75, z)));
    // the canvas: worn, with the house mark in the middle
    const cv = ctex(c, 'rb_canvas', 512, 512, (q, w, h) => { q.fillStyle = '#e8e6e0'; q.fillRect(0, 0, w, h); for (let k = 0; k < 900; k++) { q.fillStyle = `rgba(0,0,0,${Math.random() * 0.06})`; q.beginPath(); q.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 14, 0, 7); q.fill(); } q.strokeStyle = 'rgba(0,0,0,.5)'; q.lineWidth = 8; q.beginPath(); q.arc(w / 2, h / 2, 120, 0, 7); q.stroke(); q.fillStyle = 'rgba(0,0,0,.65)'; q.font = `900 64px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('N3W GARDEN', w / 2, h / 2 + 20); q.font = `700 22px ${c.MONO}`; q.fillText('A FIGHT BY MLOW', w / 2, h / 2 + 60); });
    flat(c, g, x2 - x1, z2 - z1, new THREE.MeshStandardMaterial({ map: cv, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2 }), 10, (z1 + z2) / 2, RH + 0.004);
    // padded turnbuckles on the four posts
    const pads = []; for (const [x, z] of [[x1, z1], [x2, z1], [x1, z2], [x2, z2]]) for (const h of [0.45, 0.9, 1.35]) pads.push([x, RH + h, z]);
    many(c, g, new THREE.CylinderGeometry(0.11, 0.11, 0.24, 12), std(c, 0xf0f0f0, { roughness: 0.5 }), pads);
    // light under the four lamps, smoke hanging in it, dust
    [[8, -3], [12, -3], [8, 1], [12, 1]].forEach(([x, z]) => beam(c, g, x, 4.45, z, 3.5, 0.2, 1.4, 0xffffff, 0.1));
    const smoke = []; for (let k = 0; k < (c.MOBILE ? 4 : 8); k++) smoke.push(glow(c, K, g, 'rgba(200,200,200,.18)', 7 + (k % 4) * 2, 3.2 + (k % 3) * 0.5, -3 + Math.floor(k / 4) * 3.5, 4.5, 0.5));
    motes(c, r, g, 90, [6.5, 13.5, 1.2, 4.4, -4.5, 2.5], 0xffffff, 0.035, 0.55);
    // the crowd in the dark corners, and their flashbulbs
    const seats = []; for (const [xa, xb] of [[0.7, 3.5], [16.5, 19.3]]) for (let row = 0; row < 3; row++) for (let k = 0; k < 6; k++) seats.push([xa + (k + (row % 2) * 0.5) * ((xb - xa) / 6), 0, -7.5 + row * 0.75]);
    many(c, g, new THREE.CylinderGeometry(0.2, 0.24, 0.9, 10).translate(0, 0.45, 0), std(c, 0x1a1a1a, { roughness: 0.9 }), seats);
    many(c, g, new THREE.SphereGeometry(0.15, 10, 8).translate(0, 1.08, 0), std(c, 0x2a2a2a, { roughness: 0.8 }), seats);
    many(c, g, new THREE.CylinderGeometry(0.2, 0.2, 0.04, 12).translate(0, 1.2, 0), std(c, 0x0a0a0a), seats.filter((p, k) => k % 3 === 0));
    const bulbs = [0, 1, 2, 3, 4, 5].map((k) => glow(c, K, g, 'rgba(255,255,255,1)', 0, 1.4, 0, 1.0, 0));
    // the press table by the east ropes, typewriters on it, and a round card on an easel
    g.add(c.slab(0.7, 0.05, 4.2, std(c, 0x3a3a3a), 14.4, 0.78, -1.8)); [-3.7, 0.1].forEach((z) => g.add(c.slab(0.6, 0.76, 0.05, std(c, 0x222222), 14.4, 0.38, z)));
    many(c, g, new THREE.BoxGeometry(0.34, 0.12, 0.3), std(c, 0x1a1a1a, { metalness: 0.4, roughness: 0.4 }), [[14.4, 0.87, -3.4], [14.4, 0.87, -2.2], [14.4, 0.87, -1.0], [14.4, 0.87, 0.0]]);
    const card = c.sign('ROUND\n13', { w: 0.6, h: 0.8, bg: '#f4f4f0', fg: '#111', font: c.SERIF, weight: 900, border: '#111' }); card.position.set(14.3, 1.45, 3.0); card.rotation.y = -0.5; g.add(card); g.add(c.slab(0.04, 1.1, 0.04, blackM, 14.3, 0.55, 2.98));
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return;
      sc2.rotation.z = 0.09 + Math.sin(t * 0.2) * 0.03;
      smoke.forEach((s, k) => { s.position.x = 7 + (k % 4) * 2 + Math.sin(t * 0.1 + k) * 0.8; s.material.opacity = 0.35 + Math.sin(t * 0.3 + k) * 0.15; });
      bulbs.forEach((b, k) => { const u = (t * 0.45 + k * 0.29) % 1; if (u < 0.02) { const p = seats[(k * 7 + ((t * 3) | 0)) % seats.length]; b.position.set(p[0], 1.4, p[2]); } b.material.opacity = u < 0.08 ? 1 - u / 0.08 : 0; });
    });
    skirt.forEach((m) => c.clickable(m, () => { c.sound.thud(0.3); c.egg('ragingbull_moire', 'Two layers of stripes a hand apart, a little out of step. Walk round the ring and dark bands chase you like a fighter. Every stripe is dead still. MLow hung them himself.'); }, 'The ring skirt'));
  },

  // THE FERRY. Illusion: shadows that do not match. Every commuter on the deck throws the same long shadow,
  // and it is the Lady in the harbour, torch up. The benches and the buoys cast their own; the people cast hers.
  ferry(c, r, g, X, K) {
    const { THREE } = c;
    // the bulwark goes Staten Island orange, with a teak rail on top
    findAt(g, 10, 0.55, -7.4).forEach((o) => { o.material = std(c, 0xf0661a, { roughness: 0.45, metalness: 0.2 }); });
    g.add(c.slab(12.2, 0.08, 0.3, c.surf('planks', 1, 0x8a5a30), 10, 1.14, -7.4));
    // yellow safety lines and a stencil on the deck
    const yl = std(c, 0xf5c542, { roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 });
    [[10, -6.7, 11.6, 0.1], [0.55, 0, 0.1, 13.4], [19.4, 0, 0.1, 13.4]].forEach(([x, z, w, d]) => flat(c, g, w, d, yl, x, z, 0.012));
    const st = c.canvasTex(1024, 256, (q, w, h) => { q.fillStyle = 'rgba(240,236,224,.85)'; q.font = `900 120px ${c.MONO}`; q.textAlign = 'center'; q.fillText('N3W FERRY', w / 2, 120); q.font = `700 48px ${c.MONO}`; q.fillText('ST GEORGE  TO  WHITEHALL', w / 2, 200); });
    flat(c, g, 6, 1.5, decalMat(c, st, { roughness: 0.9 }), 10, -3.2, 0.014, 0);
    // a canopy over the stern with globe lamps and a destination board
    const fasc = std(c, 0xf0661a, { roughness: 0.5 }); g.add(c.slab(19.5, 0.12, 2.3, std(c, 0xe8e4dc, { roughness: 0.7 }), 9.9, 3.75, 7.0)); g.add(c.slab(19.5, 0.35, 0.08, fasc, 9.9, 3.6, 5.85));
    const globes = []; for (let k = 0; k < 6; k++) globes.push([2 + k * 3.2, 3.42, 6.6]);
    many(c, g, new THREE.SphereGeometry(0.16, 16, 10), hot(c, 0xfff0d0, 1.8), globes); globes.forEach(([x, y, z]) => glow(c, K, g, 'rgba(255,240,210,.5)', x, y, z, 1.0, 0.6));
    const led = c.canvasTex(1024, 128, (q, w, h) => { q.fillStyle = '#100800'; q.fillRect(0, 0, w, h); q.fillStyle = '#ffb020'; q.font = `700 64px ${c.MONO}`; q.textAlign = 'center'; q.fillText('MANHATTAN  25 MIN  FREE', w / 2, 86); q.fillStyle = 'rgba(0,0,0,.45)'; for (let x = 0; x < w; x += 6) q.fillRect(x, 0, 2, h); for (let y = 0; y < h; y += 6) q.fillRect(0, y, w, 2); });
    const board = panel(c, g, 3.6, 0.45, new THREE.MeshBasicMaterial({ map: led, toneMapped: false, color: new THREE.Color(1.6, 1.4, 1.2) }), 10, 3.25, 5.82, PI); board.material.side = THREE.DoubleSide;
    // bollards and coiled lines at the bow
    const iron = std(c, 0x2a2a2a, { metalness: 0.7, roughness: 0.4 }), rope = std(c, 0xc8b888, { roughness: 0.9 });
    [[3.4, -6.8], [16.6, -6.8]].forEach(([x, z]) => { g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.5, 14), iron).translateX(x).translateY(0.25).translateZ(z)); for (let k = 0; k < 4; k++) { const coil = new THREE.Mesh(new THREE.TorusGeometry(0.32 - k * 0.04, 0.035, 6, 24), rope); coil.rotation.x = H; coil.position.set(x + 0.7, 0.04 + k * 0.06, z + 0.2); g.add(coil); } c.post(X(x), z, 0.3); });
    // spray over the bow, and the morning on the water
    const NSP = c.MOBILE ? 30 : 60, sp = new Float32Array(NSP * 3), sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    const spray = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.07, map: dotTex(c), transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); spray.frustumCulled = false; g.add(spray);
    glow(c, K, g, 'rgba(255,240,200,1)', 4, 9, -16, 7, 0.6);
    [[3, -0.2], [9, -0.1], [15, 0.05]].forEach(([x, rz]) => shaft(c, g, x, 9, -6, 2.6, 10, -0.5, 0, rz, 0xfff0c8, 0.06));
    // papers and coffee on the benches
    const news = ctex(c, 'fe_news', 128, 160, (q, w, h) => { q.fillStyle = '#ece6d6'; q.fillRect(0, 0, w, h); q.fillStyle = '#222'; q.font = `900 18px ${c.SERIF}`; q.fillText('N3W YORK', 10, 22); q.fillText('TIMES OF', 10, 42); q.fillText('THE COUNT', 10, 62); for (let y = 72; y < h - 6; y += 7) q.fillRect(8, y, w - 18 - (y % 5) * 5, 3); });
    void news;
    many(c, g, new THREE.CylinderGeometry(0.04, 0.032, 0.12, 12), std(c, 0xf4f0e8), [[4.6, 0.52, 1.8], [9.6, 0.52, 2.1], [16.0, 0.52, 2.0]]);

    // THE ILLUSION. One silhouette, cast long toward the stern from each commuter's feet.
    const lady = ctex(c, 'fe_lady', 256, 512, (q, w, h) => {
      q.fillStyle = 'rgba(10,14,24,1)';
      q.beginPath(); q.moveTo(92, 500); q.lineTo(164, 500); q.lineTo(158, 330); q.lineTo(150, 230); q.lineTo(160, 180); q.lineTo(150, 150); q.lineTo(106, 150); q.lineTo(96, 180); q.lineTo(70, 200); q.lineTo(64, 250); q.lineTo(96, 260); q.lineTo(100, 330); q.closePath(); q.fill();
      q.beginPath(); q.arc(128, 128, 24, 0, 7); q.fill();
      for (let k = 0; k < 7; k++) { const a = -PI / 2 + (k - 3) * 0.32; q.beginPath(); q.moveTo(128 + Math.cos(a - 0.08) * 22, 128 + Math.sin(a - 0.08) * 22); q.lineTo(128 + Math.cos(a) * 52, 128 + Math.sin(a) * 52); q.lineTo(128 + Math.cos(a + 0.08) * 22, 128 + Math.sin(a + 0.08) * 22); q.fill(); }
      q.save(); q.translate(150, 160); q.rotate(-0.25); q.fillRect(-9, -130, 20, 140); q.restore();
      q.beginPath(); q.moveTo(176, 22); q.lineTo(196, 22); q.lineTo(190, 42); q.lineTo(182, 42); q.fill(); q.beginPath(); q.ellipse(186, 12, 9, 15, 0, 0, 7); q.fill();
      q.save(); q.translate(80, 215); q.rotate(0.3); q.fillRect(-22, -32, 40, 64); q.restore();
      const gr = q.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,.6)'); q.globalCompositeOperation = 'destination-in'; q.fillStyle = gr; q.fillRect(0, 0, w, h); q.globalCompositeOperation = 'source-over';
    });
    const shM = new THREE.MeshBasicMaterial({ map: lady, transparent: true, opacity: 0.85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, color: 0x606878 });
    const cast = (x, z, L) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(L * 0.5, L).translate(0, L / 2, 0), shM); m.rotation.set(-H, PI - 0.3, 0, 'YXZ'); m.position.set(x, 0.016, z); g.add(m); return m; };
    const fresh = [[8.0, -5.8, 0x6a3a5a], [10.6, -6.1, 0x2a4a6a]].map(([x, z, col]) => { K.extra(g, x, z, { col, ry: PI }); c.post(X(x), z, 0.35); return [x, z]; });
    const who = [[13.4, -5.8, 5.2], [3.7, 2.35, 4.0], [16.3, 2.35, 4.0], ...fresh.map(([x, z]) => [x, z, 5.6])];
    const shadows = who.map(([x, z, L]) => cast(x, z + 0.1, L));
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return;
      shadows.forEach((m, k) => { m.rotation.y = PI - 0.3 + Math.sin(t * 0.55) * 0.05; });
      for (let k = 0; k < NSP; k++) { const u = (t * 0.6 + k / NSP) % 1, i = k * 3; sp[i] = 4 + ((k * 37) % 120) / 10; sp[i + 1] = 1.1 + u * 1.6 - u * u * 1.4; sp[i + 2] = -7.6 + u * 0.8; } sg.attributes.position.needsUpdate = true;
    });
    shadows.forEach((m) => c.clickable(m, () => { c.sound.foghorn(); c.egg('ferry_liberty', 'Look down. The benches cast benches and the buoys cast buoys, but every New Yorker on this deck casts the Lady, torch up, all the way to the stern. MLow rode the morning boat to check.'); }, 'A long shadow'));
  },

  // THE HOUSE ON ARCHER AVENUE. Illusion: reverspective, a matched pair. Each relief is two pyramids that stick out at
  // you, painted as two long hallways that go away from you. Walk past and the hallways turn to follow; the house is watching.
  tenenbaums(c, r, g, X, K) {
    const { THREE } = c;
    // bilinear quad, so lines across it stay straight on a trapezoid
    const quad = (...a) => quadMesh(c, ...a);
    const vk = (k) => 1 - Math.pow(0.78, k);
    const T = {
      floor: ctex(c, 'tn_floor', 256, 256, (q, w, h) => { q.fillStyle = '#7a2a30'; q.fillRect(0, 0, w, h); q.fillStyle = '#c8a050'; q.fillRect(w * 0.3, 0, w * 0.04, h); q.fillRect(w * 0.66, 0, w * 0.04, h); q.fillStyle = '#5a1a20'; for (let k = 1; k < 10; k++) q.fillRect(0, h - vk(k) * h, w, 2 + 4 * (1 - vk(k))); }),
      ceil: ctex(c, 'tn_ceil', 256, 256, (q, w, h) => { q.fillStyle = '#f0dcc8'; q.fillRect(0, 0, w, h); q.fillStyle = '#c8b098'; q.fillRect(w * 0.1, 0, 4, h); q.fillRect(w * 0.9 - 4, 0, 4, h); [2, 4, 6].forEach((k) => { const y = h - vk(k) * h; q.fillStyle = '#fff6c0'; q.beginPath(); q.ellipse(w / 2, y, 16 * (1 - vk(k)) + 4, 6 * (1 - vk(k)) + 2, 0, 0, 7); q.fill(); }); }),
      wall: (side) => ctex(c, 'tn_wall' + side, 256, 256, (q, w, h) => { q.fillStyle = side ? '#e89aa0' : '#d8848c'; q.fillRect(0, 0, w, h); q.fillStyle = 'rgba(255,255,255,.18)'; for (let k = 0; k < 14; k++) { const y = h - vk(k * 0.7) * h; q.fillRect(0, y, w, 2); }
        q.fillStyle = '#6a3a28'; q.fillRect(0, 0, w * 0.1, h); q.fillStyle = '#f4ead2'; q.fillRect(w * 0.82, 0, w * 0.05, h);
        [[1, 2.2], [3.2, 4.4], [5.2, 6.2]].forEach(([a, b]) => { const y0 = h - vk(b) * h, y1 = h - vk(a) * h; q.fillStyle = '#f4ead2'; q.fillRect(w * 0.08, y0 - 3, w * 0.66, y1 - y0 + 6); q.fillStyle = side ? '#3a6a8a' : '#c83a30'; q.fillRect(w * 0.1, y0, w * 0.62, y1 - y0); q.fillStyle = '#f5c542'; q.beginPath(); q.arc(w * 0.42, y0 + (y1 - y0) * 0.15, 3 + 3 * (1 - vk(a)), 0, 7); q.fill(); }); }),
      end: ctex(c, 'tn_end', 128, 160, (q, w, h) => { q.fillStyle = '#e89aa0'; q.fillRect(0, 0, w, h); q.fillStyle = '#f4ead2'; q.fillRect(30, 30, 68, 130); q.fillStyle = '#c83a30'; q.fillRect(36, 36, 56, 124); q.fillStyle = '#f5c542'; q.font = `800 20px ${c.SERIF}`; q.textAlign = 'center'; q.fillText('111', 64, 24); q.beginPath(); q.arc(80, 100, 4, 0, 7); q.fill(); }),
    };
    const M = (t, k = 1) => new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(k, k, k), side: THREE.DoubleSide });
    const mats = { floor: M(T.floor, 0.8), ceil: M(T.ceil, 1.05), left: M(T.wall(0), 0.9), right: M(T.wall(1), 1.0), end: M(T.end, 0.95) };
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const pyr = (o, cx, cy, w, h, aw, ah, dz) => { const bl = V(cx - w / 2, cy - h / 2, 0), br = V(cx + w / 2, cy - h / 2, 0), tl = V(cx - w / 2, cy + h / 2, 0), tr = V(cx + w / 2, cy + h / 2, 0), al = V(cx - aw / 2, cy - ah / 2, dz), ar = V(cx + aw / 2, cy - ah / 2, dz), atl = V(cx - aw / 2, cy + ah / 2, dz), atr = V(cx + aw / 2, cy + ah / 2, dz);
      o.add(quad(bl, br, al, ar, mats.floor)); o.add(quad(tl, tr, atl, atr, mats.ceil)); o.add(quad(bl, tl, al, atl, mats.left)); o.add(quad(br, tr, ar, atr, mats.right));
      const e = new THREE.Mesh(new THREE.PlaneGeometry(aw, ah), mats.end); e.position.set(cx, cy, dz); o.add(e); };
    const gilt = std(c, 0xc8a050, { metalness: 1, roughness: 0.3 }), reliefs = [];
    [3.2, 16.8].forEach((x) => { const o = new THREE.Group(); o.position.set(x, 0, 0.25); g.add(o); reliefs.push(o);
      o.add(c.slab(2.5, 0.9, 0.62, std(c, 0x5a2a2a, { roughness: 0.6 }), 0, 0.45, 0.2)); o.add(c.slab(2.5, 1.85, 0.06, std(c, 0x2a1418), 0, 1.85, -0.04));
      [[0, 2.8, 2.6, 0.08], [0, 0.92, 2.6, 0.08]].forEach(([px, py, w, h]) => o.add(c.slab(w, h, 0.1, gilt, px, py, 0))); [-1.27, 1.27].forEach((px) => o.add(c.slab(0.08, 1.95, 0.1, gilt, px, 1.86, 0)));
      pyr(o, -0.58, 1.86, 1.1, 1.8, 0.34, 0.52, 0.5); pyr(o, 0.58, 1.86, 1.1, 1.8, 0.34, 0.52, 0.5);
      const pl = c.sign('THE HALLS OF 111, AFTER MLOW', { w: 1.4, h: 0.12, bg: '#1a0a0c', fg: '#f5c542', font: c.SERIF, weight: 700 }); pl.position.set(0, 0.7, 0.52); o.add(pl);
      c.post(X(x), 0.45, 1.25); });
    // red zebra wallpaper on both sides of the picture, behind the portraits
    const zeb = ctex(c, 'tn_zebra', 512, 512, (q, w, h) => { q.fillStyle = '#c8303a'; q.fillRect(0, 0, w, h); q.fillStyle = '#f4e4d8'; for (let k = 0; k < 26; k++) { const y = k * 22 + Math.sin(k) * 6; q.beginPath(); q.moveTo(0, y); for (let x = 0; x <= w; x += 16) q.lineTo(x, y + Math.sin(x / 40 + k) * 10 + Math.sin(x / 13 + k * 3) * 4); for (let x = w; x >= 0; x -= 16) q.lineTo(x, y + 8 + Math.sin(x / 40 + k) * 10 + Math.cos(x / 17 + k) * 3); q.fill(); } });
    [2.03, 17.97].forEach((x) => { const t = zeb.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = 1000; t.repeat.set(1.6, 2.4); panel(c, g, 3.86, 6, new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }), x, 3, -7.985); });
    // a coffered pink ceiling, light under each chandelier, a long runner down the centre line
    const cof = rep(ctex(c, 'tn_cof', 256, 256, (q, w, h) => { q.fillStyle = '#e8b8b0'; q.fillRect(0, 0, w, h); q.fillStyle = '#d09890'; q.fillRect(24, 24, w - 48, h - 48); q.fillStyle = '#f4d8d0'; q.fillRect(40, 40, w - 80, h - 80); q.strokeStyle = '#c8a050'; q.lineWidth = 4; q.strokeRect(22, 22, w - 44, h - 44); }), 10, 8);
    const ce = panel(c, g, 20, 16, new THREE.MeshStandardMaterial({ map: cof, roughness: 0.7 }), 10, 5.94, 0); ce.rotation.x = H;
    [5, 10, 15].forEach((x) => beam(c, g, x, 4.9, 1.0, 4.85, 0.25, 1.6, 0xffe8d0, 0.09));
    motes(c, r, g, 90, [3, 17, 0.8, 4.8, -5, 5], 0xffe8d8, 0.04, 0.55);
    const run = ctex(c, 'tn_run', 128, 512, (q, w, h) => { q.fillStyle = '#6a1a24'; q.fillRect(0, 0, w, h); q.strokeStyle = '#c8a050'; q.lineWidth = 6; q.strokeRect(8, 8, w - 16, h - 16); q.fillStyle = 'rgba(200,160,80,.4)'; for (let y = 40; y < h; y += 60) { q.beginPath(); q.moveTo(w / 2, y); q.lineTo(w / 2 + 24, y + 20); q.lineTo(w / 2, y + 40); q.lineTo(w / 2 - 24, y + 20); q.fill(); } });
    flat(c, g, 1.4, 14.4, new THREE.MeshStandardMaterial({ map: run, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -1 }), 10, 0, 0.006);
    // six sconces on the south wall between the paintings, perfectly mirrored
    [3.5, 6.1, 8.7, 11.3, 13.9, 16.5].forEach((x) => { g.add(c.slab(0.06, 0.3, 0.06, gilt, x, 2.95, 7.84)); [-0.1, 0.1].forEach((dx) => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6).scale(1, 1.6, 1), hot(c, 0xffe0b0, 2.2)); b.position.set(x + dx, 3.18, 7.8); g.add(b); }); glow(c, K, g, 'rgba(255,220,170,.7)', x, 3.2, 7.7, 0.8, 0.8); });
    // tennis balls round the tent, a headband on the floor
    const tb = []; for (let k = 0; k < 14; k++) { const a = k * 2.4, d = 1.6 + (k % 4) * 0.25; tb.push([10 + Math.cos(a) * d, 0.035, -3.4 + Math.sin(a) * d * 0.7]); }
    many(c, g, new THREE.SphereGeometry(0.035, 10, 8), std(c, 0xd8e830, { roughness: 0.9 }), tb);
    const hb = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 6, 20), std(c, 0xf4f4f0, { roughness: 0.9 })); hb.rotation.x = H; hb.position.set(11.4, 0.025, -1.9); g.add(hb);
    // a matched pair of tasselled floor lamps by the picture, under the portraits
    [3.0, 17.0].forEach((x) => { g.add(c.slab(0.04, 1.5, 0.04, gilt, x, 0.75, -5.8)); g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.04, 16), gilt).translateX(x).translateY(0.02).translateZ(-5.8));
      const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.32, 0.34, 18, 1, true), hot(c, 0xffb8a0, 1.3, { side: THREE.DoubleSide })); sh.position.set(x, 1.62, -5.8); g.add(sh); glow(c, K, g, 'rgba(255,190,160,.7)', x, 1.6, -5.8, 1.3, 0.8);
      const fr = []; for (let k = 0; k < 18; k++) { const a = k / 18 * PI * 2; fr.push([x + Math.cos(a) * 0.31, 1.42, -5.8 + Math.sin(a) * 0.31]); } many(c, g, new THREE.CylinderGeometry(0.008, 0.008, 0.08, 4), std(c, 0xc8a050), fr); c.post(X(x), -5.8, 0.3); });
    reliefs.forEach((o) => c.clickable(o, () => { c.sound.chords(2); c.egg('tenenbaums_reverse', 'Two hallways that go away from you, painted on two pyramids that come right at you. Walk past and the doors turn to watch. Every Tenenbaum feels that way at home. MLow hung a matched pair, of course.'); }, 'The hallway relief'));
  },

  // THE BAR. Illusion: an ambiguous figure. A stained glass window high on the east wall: a gold chalice, or two men
  // face to face, nose to nose, the way Charlie and Johnny Boy always were. You cannot see both at once.
  meanstreets(c, r, g, X, K) {
    const { THREE } = c, cc = new THREE.Color();
    const rubin = ctex(c, 'ms_rubin', 512, 640, (q, w, h) => {
      q.fillStyle = '#1a0204'; q.fillRect(0, 0, w, h);
      const P = [[0, 0.36], [0.06, 0.31], [0.16, 0.29], [0.24, 0.255], [0.3, 0.25], [0.4, 0.105], [0.45, 0.13], [0.48, 0.19], [0.52, 0.15], [0.555, 0.185], [0.6, 0.15], [0.66, 0.2], [0.72, 0.16], [0.8, 0.24], [0.9, 0.27], [1, 0.27]];
      const path = () => { q.beginPath(); q.moveTo(w / 2 + P[0][1] * w, 0); for (let k = 1; k < P.length; k++) { const [y0, a0] = P[k - 1], [y1, a1] = P[k]; q.quadraticCurveTo(w / 2 + a0 * w, y0 * h, w / 2 + (a0 + a1) / 2 * w, (y0 + y1) / 2 * h); } q.lineTo(w / 2 + P[P.length - 1][1] * w, h);
        q.lineTo(w / 2 - P[P.length - 1][1] * w, h); for (let k = P.length - 1; k > 0; k--) { const [y0, a0] = P[k], [y1, a1] = P[k - 1]; q.quadraticCurveTo(w / 2 - a0 * w, y0 * h, w / 2 - (a0 + a1) / 2 * w, (y0 + y1) / 2 * h); } q.lineTo(w / 2 - P[0][1] * w, 0); q.closePath(); };
      // the faces: deep red glass, darker toward the edges
      const fg = q.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w * 0.7); fg.addColorStop(0, '#a01018'); fg.addColorStop(1, '#3a0408'); q.fillStyle = fg; q.fillRect(0, 0, w, h);
      // the chalice: gold glass in leaded cells
      q.save(); path(); q.clip(); const gg = q.createLinearGradient(0, 0, 0, h); gg.addColorStop(0, '#fff0b0'); gg.addColorStop(0.5, '#f5c542'); gg.addColorStop(1, '#c87a18'); q.fillStyle = gg; q.fillRect(0, 0, w, h);
      for (let k = 0; k < 60; k++) { q.fillStyle = `rgba(${200 + Math.random() * 55 | 0},${120 + Math.random() * 100 | 0},${20 + Math.random() * 60 | 0},.35)`; q.beginPath(); const x = w * 0.2 + Math.random() * w * 0.6, y = Math.random() * h; q.moveTo(x, y); for (let j = 0; j < 4; j++) q.lineTo(x + (Math.random() - 0.5) * 120, y + (Math.random() - 0.5) * 120); q.fill(); }
      q.strokeStyle = 'rgba(40,12,4,.75)'; q.lineWidth = 4; for (let y = 40; y < h; y += 64) { q.beginPath(); q.moveTo(0, y); q.quadraticCurveTo(w / 2, y + 26, w, y); q.stroke(); } for (let k = 0; k < 12; k++) { const y = (k + 0.5) * h / 12; q.beginPath(); q.moveTo(w / 2, y - 22); q.lineTo(w / 2, y + 22); q.stroke(); } q.restore();
      q.strokeStyle = '#140204'; q.lineWidth = 10; path(); q.stroke();
      // leading across the faces too, and the frame
      q.strokeStyle = 'rgba(10,0,2,.7)'; q.lineWidth = 5; for (let y = 60; y < h; y += 90) { q.beginPath(); q.moveTo(0, y); q.lineTo(w * 0.16, y + 10); q.stroke(); q.beginPath(); q.moveTo(w, y); q.lineTo(w * 0.84, y + 10); q.stroke(); }
      q.strokeStyle = '#c8a050'; q.lineWidth = 14; q.strokeRect(7, 7, w - 14, h - 14);
    });
    const win = panel(c, g, 2.0, 2.6, new THREE.MeshBasicMaterial({ map: rubin, toneMapped: false, color: new THREE.Color(1.5, 1.4, 1.3) }), 19.6, 4.5, -6.15, -H);
    g.add(c.slab(0.12, 2.8, 2.2, std(c, 0x2a1008, { roughness: 0.5 }), 19.7, 4.5, -6.15));
    const plq = c.sign('SAN GENNARO OR THE TWO OF THEM', { w: 2.0, h: 0.14, bg: '#1a0404', fg: '#f5c542', font: c.SERIF, weight: 700 }); plq.position.set(19.56, 5.98 - 0.08, -6.15); plq.scale.setScalar(0.9); plq.rotation.y = -H; g.add(plq);
    shaft(c, g, 19.4, 5.6, -6.15, 2.0, 6, 0, H, -0.75, 0xffb070, 0.07);
    // a red neon tube along the lip of the bar, bottles lit from behind on the bar top
    g.add(c.slab(0.04, 0.04, 10, hot(c, 0xff2020, 2.4), 2.12, 1.06, -2)); [-6, -2, 2].forEach((z) => glow(c, K, g, 'rgba(255,40,40,.6)', 2.2, 1.06, z, 1.6, 0.5));
    const bt = []; for (let k = 0; k < 18; k++) bt.push([1.3 + (k % 2) * 0.12, 1.1, -6.6 + k * 0.52]);
    const bottles = many(c, g, new THREE.CylinderGeometry(0.04, 0.045, 0.3, 10).translate(0, 0.15, 0), new THREE.MeshBasicMaterial({ toneMapped: false }), bt);
    bt.forEach((p, k) => bottles.setColorAt(k, cc.set([0x5a2008, 0x1a4a14, 0x8a5a10, 0x3a0a0a][k % 4]).multiplyScalar(1.6)));
    // pressed tin overhead in oxblood, Christmas lights swagged under it
    const tin = rep(tinTex(c).clone(), 10, 8); tin.needsUpdate = true;
    const ce = panel(c, g, 20, 16, new THREE.MeshStandardMaterial({ map: tin, metalness: 0.6, roughness: 0.35, color: 0x5a1a14 }), 10, 5.93, 0); ce.rotation.x = H;
    const xl = []; [-4, 0, 4].forEach((z) => { for (let k = 0; k <= 32; k++) { const u = k / 32; xl.push([0.5 + u * 19, 5.75 - Math.sin(u * PI * 3) ** 2 * 0.5, z]); } });
    const xmas = many(c, g, new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshBasicMaterial({ toneMapped: false }), xl), XC = [0xff2a2a, 0x2aff6a, 0xffd040, 0x3a7aff, 0xffffff];
    xl.forEach((p, k) => xmas.setColorAt(k, cc.set(XC[k % 5]).multiplyScalar(2)));
    // a green shaded lamp over the pool table
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.55, 0.3, 20, 1, true), std(c, 0x1a5a2a, { side: THREE.DoubleSide, roughness: 0.4 })); shade.position.set(13, 2.3, 1.4); g.add(shade);
    const under = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), hot(c, 0xfff0c8, 1.8)); under.rotation.x = H; under.position.set(13, 2.16, 1.4); g.add(under); g.add(c.slab(0.015, 3.6, 0.015, std(c, 0x111111), 13, 4.1, 1.4));
    beam(c, g, 13, 2.16, 1.4, 1.3, 0.5, 1.1, 0xfff0c8, 0.12);
    // the jukebox lit up in bands
    const jbT = ctex(c, 'ms_jb', 128, 192, (q, w, h) => { q.fillStyle = '#200404'; q.fillRect(0, 0, w, h); ['#ff3020', '#ffb020', '#30c0ff', '#ff40c0'].forEach((col, k) => { q.strokeStyle = col; q.lineWidth = 10; q.beginPath(); q.arc(w / 2, 70, 56 - k * 13, PI, 0); q.stroke(); }); q.fillStyle = '#f5c542'; q.font = `800 16px ${c.MONO}`; q.textAlign = 'center'; q.fillText('MLOW 45s', w / 2, 120); for (let k = 0; k < 5; k++) { q.fillStyle = k % 2 ? '#ff3020' : '#ffb020'; q.fillRect(16, 136 + k * 10, w - 32, 5); } });
    const jbF = panel(c, g, 0.6, 1.4, new THREE.MeshBasicMaterial({ map: jbT, toneMapped: false }), 18.29, 0.76, -4, -H);
    // a string of flags across the room, smoke in the light, the dust
    const fl = []; for (let k = 0; k < 24; k++) { const u = k / 23; fl.push([1 + u * 18, 4.7 - Math.sin(u * PI) * 0.5, 6.2, 0, 1]); }
    const flags = many(c, g, new THREE.ConeGeometry(0.14, 0.32, 3).rotateZ(PI).translate(0, -0.16, 0), new THREE.MeshStandardMaterial({ roughness: 0.8 }), fl);
    fl.forEach((p, k) => flags.setColorAt(k, cc.set([0x1a8a3a, 0xf4f4f0, 0xc81818][k % 3])));
    const smoke = []; for (let k = 0; k < (c.MOBILE ? 3 : 6); k++) smoke.push(glow(c, K, g, 'rgba(255,120,110,.16)', 4 + k * 2.4, 3.6, -1 + (k % 2) * 3, 4, 0.5));
    motes(c, r, g, 80, [3, 18, 0.8, 4.6, -6, 6], 0xff9a8a, 0.04, 0.6);
    c.tick((t, dt, P, ri) => {
      if (ri !== r.i) return; const tw = (t * 2.5) | 0;
      if (tw !== xmas.userData.tw) { xmas.userData.tw = tw; xl.forEach((p, k) => xmas.setColorAt(k, cc.set(XC[(k + tw) % 5]).multiplyScalar((k * 7 + tw) % 5 ? 2 : 0.3))); xmas.instanceColor.needsUpdate = true; }
      jbF.material.color.setHSL((t * 0.05) % 1, 0.4, 0.75); smoke.forEach((s, k) => { s.position.x = 4 + k * 2.4 + Math.sin(t * 0.13 + k) * 0.9; s.position.y = 3.6 + Math.sin(t * 0.2 + k * 2) * 0.3; });
    });
    c.clickable(win, () => { c.sound.bell(); c.egg('meanstreets_vase', 'A gold chalice, or two men nose to nose. You never see both at once, the same as church and the street. MLow leaded every pane by hand.'); }, 'The window');
  },

  // FIVE FLIGHTS. Illusion: a Penrose triangle, the sixth flight. Three straight beams that cannot close, hung in the
  // stairwell; from the mark at the foot of the stairs they close into a triangle. Climb one step and it falls open.
  barefoot(c, r, g, X, K) {
    const { THREE } = c;
    const sx1 = 6, sx2 = 14, z0 = 6.4, zt = -2.0, TOP = 4.5, N = 30, run = (z0 - zt) / N;
    // the stair in real wood with a red runner, the stair walls plastered, the house above in brick
    g.children.forEach((o) => { if (!o.isMesh || !o.geometry.parameters) return; const p = o.geometry.parameters, q = o.position;
      if (Math.abs(p.width - (sx2 - sx1)) < 0.01 && Math.abs(p.depth - run) < 0.01) o.material = c.surf('planks', 1.4, 0x8a6040);
      else if (Math.abs(p.width - 0.3) < 0.01 && Math.abs(p.height - (TOP + 1)) < 0.01) o.material = c.surf('plaster', 2, 0xb8c8b0);
      else if (Math.abs(p.width - 20) < 0.01 && Math.abs(p.height - TOP) < 0.01 && Math.abs(q.z + 5) < 0.01) o.material = c.surf('brick', 2.2, 0x9a6050); });
    const rr = []; for (let k = 0; k < N; k++) rr.push([10, TOP * (k + 1) / N + 0.004, z0 - k * run - run / 2]);
    many(c, g, new THREE.BoxGeometry(1.6, 0.012, run * 0.98), std(c, 0x8a1a20, { roughness: 0.95 }), rr);
    // handrails and balusters up both sides
    const rail = std(c, 0x3a2414, { roughness: 0.5 }), bal = [];
    [sx1 + 0.12, sx2 - 0.12].forEach((x) => { const len = Math.hypot(z0 - zt, TOP), hr = c.slab(0.07, 0.07, len, rail, x, TOP / 2 + 0.95, (z0 + zt) / 2); hr.rotation.x = Math.atan2(TOP, z0 - zt); g.add(hr); for (let k = 0; k < N; k += 1) bal.push([x, TOP * (k + 1) / N + 0.47, z0 - k * run - run / 2]); });
    many(c, g, new THREE.CylinderGeometry(0.018, 0.018, 0.94, 6), rail, bal);
    // lit windows in the brick face of the house on either side of the stair
    const wt = ctex(c, 'bf_win', 128, 192, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffd890'); gr.addColorStop(1, '#ff9a40'); q.fillStyle = gr; q.fillRect(0, 0, w, h); q.fillStyle = 'rgba(60,30,10,.85)'; q.beginPath(); q.arc(76, 110, 16, 0, 7); q.fill(); q.fillRect(60, 124, 32, 70); q.fillStyle = '#e8e0d0'; q.fillRect(0, 0, w, 8); q.fillRect(0, h / 2 - 3, w, 6); q.fillRect(w / 2 - 3, 0, 6, h); q.fillStyle = 'rgba(120,20,30,.6)'; q.fillRect(0, 0, 18, h); q.fillRect(w - 18, 0, 18, h); });
    const wm = new THREE.MeshBasicMaterial({ map: wt, toneMapped: false, color: new THREE.Color(1.3, 1.2, 1.1) });
    [1.6, 4.3, 15.7, 18.4].forEach((x) => { panel(c, g, 1.0, 1.5, wm, x, 2.5, -1.985); g.add(c.slab(1.2, 0.1, 0.18, std(c, 0xd8d0c0), x, 1.7, -1.92)); glow(c, K, g, 'rgba(255,190,110,.5)', x, 2.5, -1.7, 1.8, 0.5); });
    // brass mailboxes at the foot of the stair
    const mb = ctex(c, 'bf_mail', 256, 192, (q, w, h) => { q.fillStyle = '#6a4a20'; q.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { q.fillStyle = '#c89a40'; q.fillRect(12 + i * 60, 12 + j * 58, 52, 50); q.fillStyle = '#3a2a10'; q.fillRect(20 + i * 60, 22 + j * 58, 36, 6); q.fillStyle = '#f4ead2'; q.font = `700 12px ${c.MONO}`; q.fillText(`${j + 2}${'ABCD'[i]}`, 22 + i * 60, 52 + j * 58); } });
    panel(c, g, 0.9, 0.68, new THREE.MeshStandardMaterial({ map: mb, metalness: 0.7, roughness: 0.35 }), sx1 + 0.02, 1.4, 6.0, H);
    // a bare bulb at the foot, light under each landing sconce
    g.add(c.slab(0.01, 1.2, 0.01, std(c, 0x111111), 10, 5.4, 6.0)); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), hot(c, 0xffe0b0, 2.4)); bulb.position.set(10, 4.75, 6.0); g.add(bulb); glow(c, K, g, 'rgba(255,220,160,.8)', 10, 4.75, 6.0, 1.2);
    for (let k = 0; k < 4; k++) { const z = z0 - (k + 1) * (z0 - zt) / 5, y = TOP * (k + 1) / 5 + 1.9; beamTo(c, g, [13.75, y, z], [12.6, TOP * (k + 1) / 5, z], 0.08, 0.9, 0xffd8a0, 0.08); }
    // the skylight frame overhead, one pane missing, and the moon past it
    const sky = new THREE.Group(); sky.position.set(10, TOP + 3.4, -5); g.add(sky); const fr = std(c, 0x2a2a2a, { metalness: 0.6 });
    for (let k = -2; k <= 2; k++) { sky.add(c.slab(0.06, 0.06, 2.4, fr, k * 0.6, 0, 0)); sky.add(c.slab(2.4, 0.06, 0.06, fr, 0, 0, k * 0.6)); }
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { if (i === 1 && j === 2) continue; const p = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.56), new THREE.MeshBasicMaterial({ color: 0x8aa8d8, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false })); p.rotation.x = H; p.position.set(-0.9 + i * 0.6, 0, -0.9 + j * 0.6); sky.add(p); }
    glow(c, K, g, 'rgba(230,240,255,1)', 3, 14, -12, 3.5, 0.9);
    // snow over the whole street, not only the skylight
    const NS = c.MOBILE ? 150 : 400, sp = new Float32Array(NS * 3); for (let k = 0; k < NS; k++) { sp[k * 3] = Math.random() * 20; sp[k * 3 + 1] = Math.random() * 10; sp[k * 3 + 2] = -1.8 + Math.random() * 9.6; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); const snow = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, map: dotTex(c), transparent: true, depthWrite: false, opacity: 0.9 })); snow.frustumCulled = false; g.add(snow);
    // the skylight snow the set already had: round flakes instead of square ones
    g.children.forEach((o) => { if (o.isPoints && o !== snow) { o.material.map = dotTex(c); o.material.transparent = true; o.material.depthWrite = false; o.material.size = 0.07; o.material.needsUpdate = true; } });

    // THE ILLUSION. Three beams along x, then y, then z: the two loose ends lie on one ray from the eye at E.
    const E = new THREE.Vector3(10, 1.62, 7.0), T = new THREE.Vector3(10, 7.6, -0.6), d = T.clone().sub(E).normalize(), L = 1.9, wB = 0.3, dO = 5.4;
    const O = E.clone().addScaledVector(d, dO), pen = new THREE.Group(); pen.position.copy(O); g.add(pen);
    pen.quaternion.setFromUnitVectors(new THREE.Vector3(1, 1, 1).normalize(), d); pen.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(d, 0.42)); pen.updateMatrix();
    const tone = [0xc8903a, 0xf4e4c8, 0x5a3a26].map((col) => new THREE.MeshBasicMaterial({ color: col })), ink = new THREE.LineBasicMaterial({ color: 0x140c08 });
    const beamAlong = (S, ax) => { const geo = new THREE.BoxGeometry(1, 1, 1), p = geo.attributes.position, W0 = new THREE.Vector3(), Wl = new THREE.Vector3(), other = [0, 1, 2].filter((i) => i !== ax);
      const ends = [S.clone(), S.clone()]; ends[1].setComponent(ax, S.getComponent(ax) + L); const f = ends.map((e) => W0.copy(e).applyMatrix4(pen.matrix).distanceTo(E) / dO);
      for (let i = 0; i < p.count; i++) { const end = p.getComponent(i, ax) > 0 ? 1 : 0; Wl.copy(S); Wl.setComponent(ax, S.getComponent(ax) + (end ? L + wB / 2 : -wB / 2)); other.forEach((o) => Wl.setComponent(o, S.getComponent(o) + p.getComponent(i, o) * wB * f[end])); p.setXYZ(i, Wl.x, Wl.y, Wl.z); }
      geo.computeVertexNormals(); const m = new THREE.Mesh(geo, [tone[0], tone[0], tone[1], tone[1], tone[2], tone[2]]); pen.add(m); pen.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), ink)); return m; };
    beamAlong(new THREE.Vector3(0, 0, 0), 0); beamAlong(new THREE.Vector3(L, 0, 0), 1); beamAlong(new THREE.Vector3(L, L, 0), 2);
    spot(c, g, E.x, E.z, 'THE SIXTH FLIGHT. STAND HERE, LOOK UP.', '#f5c542');
    c.clickable(pen, () => { c.sound.pant(); c.egg('barefoot_penrose', 'From the foot of the stairs it is a triangle that closes. Climb one step and it falls open: a flight that goes up forever and lands where it started. MLow counts it as the sixth.'); }, 'The sixth flight');
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; for (let k = 0; k < NS; k++) { const i = k * 3; sp[i + 1] -= dt * 0.7; sp[i] += Math.sin(t + k) * dt * 0.1; if (sp[i + 1] < 0) sp[i + 1] = 10; } sg.attributes.position.needsUpdate = true; });
  },

  // THE BROWNSTONE. Illusion: a forced perspective hall. A second door in the partition opens on a long hallway with
  // three doors and a lit room at the end; it is two metres deep, the floor climbs, the ceiling drops, the doors shrink.
  crooklyn(c, r, g, X, K) {
    const { THREE } = c;
    const DX = 14.2, DW = 0.9, DH = 2.1, Z = -1.1, DEP = 2.0;
    // cut a door into the east half of the partition
    const part = findAt(g, 14.4, 1.4, -1)[0], pm = part ? part.material : std(c, 0xd8c8a0); if (part) part.visible = false;
    [[10.9, DX - DW / 2], [DX + DW / 2, 17.9]].forEach(([a, b]) => g.add(c.slab(b - a, 2.8, 0.2, pm, (a + b) / 2, 1.4, -1))); g.add(c.slab(DW, 2.8 - DH, 0.2, pm, DX, DH + (2.8 - DH) / 2, -1));
    // 70s wallpaper on the room side of the partition
    const wp = ctex(c, 'cr_wall', 256, 256, (q, w, h) => { q.fillStyle = '#e8c890'; q.fillRect(0, 0, w, h); const fl = (x, y, R, col) => { for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2; q.fillStyle = col; q.beginPath(); q.ellipse(x + Math.cos(a) * R * 0.6, y + Math.sin(a) * R * 0.6, R * 0.5, R * 0.3, a, 0, 7); q.fill(); } q.fillStyle = '#5a2a10'; q.beginPath(); q.arc(x, y, R * 0.3, 0, 7); q.fill(); };
      [[64, 64, 50, '#d86a1a'], [192, 192, 50, '#c8901a'], [192, 64, 26, '#8a4a1a'], [64, 192, 26, '#a85a1a'], [0, 128, 22, '#6a7a2a'], [256, 128, 22, '#6a7a2a'], [128, 0, 22, '#6a7a2a'], [128, 256, 22, '#6a7a2a']].forEach((f) => fl(...f)); });
    const wm = (w, h) => { const t = wp.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = 1000; t.repeat.set(w / 0.9, h / 0.9); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 }); };
    [[2.1, 9.12, 0, 2.8], [10.88, DX - DW / 2, 0, 2.8], [DX + DW / 2, 17.9, 0, 2.8], [DX - DW / 2, DX + DW / 2, DH, 2.8]].forEach(([a, b, y0, y1]) => panel(c, g, b - a, y1 - y0, wm(b - a, y1 - y0), (a + b) / 2, (y0 + y1) / 2, -0.888));
    // the hall: four converging quads, painted, then the lit room at the end
    const far = { w: 0.36, h: 0.92, y: 0.36 }, zf = Z - DEP, V = (x, y, z) => new THREE.Vector3(x, y, z);
    const nbl = V(DX - DW / 2, 0, Z), nbr = V(DX + DW / 2, 0, Z), ntl = V(DX - DW / 2, DH, Z), ntr = V(DX + DW / 2, DH, Z);
    const fbl = V(DX - far.w / 2, far.y, zf), fbr = V(DX + far.w / 2, far.y, zf), ftl = V(DX - far.w / 2, far.y + far.h, zf), ftr = V(DX + far.w / 2, far.y + far.h, zf);
    const vk = (k) => 1 - Math.pow(0.72, k);
    const hall = {
      floor: ctex(c, 'cr_hf', 256, 256, (q, w, h) => { q.fillStyle = '#8a5a30'; q.fillRect(0, 0, w, h); q.fillStyle = 'rgba(40,20,8,.6)'; for (let k = 1; k < 7; k++) q.fillRect(k * w / 7 - 1, 0, 3, h); q.fillStyle = '#b8402a'; q.fillRect(w * 0.3, 0, w * 0.4, h); q.fillStyle = '#e8b040'; q.fillRect(w * 0.3, 0, 4, h); q.fillRect(w * 0.7 - 4, 0, 4, h); }),
      ceil: ctex(c, 'cr_hc', 256, 256, (q, w, h) => { q.fillStyle = '#f0e4cc'; q.fillRect(0, 0, w, h); [1, 3].forEach((k) => { const y = h - vk(k) * h; q.fillStyle = '#fff4c0'; q.beginPath(); q.ellipse(w / 2, y, 30 * (1 - vk(k)) + 6, 12 * (1 - vk(k)) + 3, 0, 0, 7); q.fill(); }); }),
      wall: (side) => ctex(c, 'cr_hw' + side, 256, 256, (q, w, h) => { q.fillStyle = side ? '#d8a868' : '#c89858'; q.fillRect(0, 0, w, h); q.fillStyle = 'rgba(120,60,20,.35)'; for (let k = 0; k < 12; k++) q.fillRect(0, h - vk(k * 0.6) * h, w, 3); q.fillStyle = '#5a3418'; q.fillRect(0, 0, w * 0.08, h);
        [[0.6, 1.6], [2.6, 3.4]].forEach(([a, b], i) => { if (side && i) return; const y0 = h - vk(b) * h, y1 = h - vk(a) * h; q.fillStyle = '#f0e4cc'; q.fillRect(w * 0.06, y0 - 3, w * 0.74, y1 - y0 + 6); q.fillStyle = ['#6a3a1a', '#3a5a3a'][i]; q.fillRect(w * 0.08, y0, w * 0.7, y1 - y0); q.fillStyle = '#e8b040'; q.beginPath(); q.arc(w * 0.42, y0 + (y1 - y0) * (side ? 0.85 : 0.15), 3 + 3 * (1 - vk(a)), 0, 7); q.fill(); }); }),
    };
    const HM = (t, k) => new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(k, k * 0.96, k * 0.9) });
    // order the corners so each quad faces into the hall
    g.add(quadMesh(c, nbr, nbl, fbr, fbl, HM(hall.floor, 0.85))); g.add(quadMesh(c, ntl, ntr, ftl, ftr, HM(hall.ceil, 1.0)));
    g.add(quadMesh(c, nbl, ntl, fbl, ftl, HM(hall.wall(0), 0.9))); g.add(quadMesh(c, ntr, nbr, ftr, fbr, HM(hall.wall(1), 1.0)));
    [...g.children].slice(-4).forEach((m) => { m.material.side = THREE.DoubleSide; });
    const endT = ctex(c, 'cr_end', 128, 256, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#fff2c8'); gr.addColorStop(1, '#ffc070'); q.fillStyle = gr; q.fillRect(0, 0, w, h); q.fillStyle = 'rgba(80,40,10,.9)'; q.fillRect(0, 0, 10, h); q.fillRect(w - 10, 0, 10, h); q.fillRect(0, 0, w, 10); K.eyeFlower(q, w / 2, 120, 26); q.fillStyle = '#ff7a1a'; q.fillRect(w / 2 - 14, 140, 28, 60); q.fillStyle = '#3a2a1a'; q.fillRect(w / 2 - 12, 200, 9, 40); q.fillRect(w / 2 + 3, 200, 9, 40); });
    const end = panel(c, g, far.w, far.h, new THREE.MeshBasicMaterial({ map: endT, toneMapped: false, color: new THREE.Color(1.5, 1.4, 1.25) }), DX, far.y + far.h / 2, zf); void end;
    glow(c, K, g, 'rgba(255,220,150,.6)', DX, far.y + far.h * 0.6, zf + 0.15, 0.9, 0.7);
    // its outside, so the back room sees a closet and not the trick
    const shell = std(c, 0xd8c8a0, { roughness: 0.9 }); g.add(c.slab(0.06, DH + 0.05, DEP + 0.1, shell, DX - DW / 2 - 0.04, (DH + 0.05) / 2, Z - DEP / 2)); g.add(c.slab(0.06, DH + 0.05, DEP + 0.1, shell, DX + DW / 2 + 0.04, (DH + 0.05) / 2, Z - DEP / 2));
    g.add(c.slab(DW + 0.14, 0.06, DEP + 0.1, shell, DX, DH + 0.06, Z - DEP / 2)); g.add(c.slab(DW + 0.14, DH + 0.1, 0.06, shell, DX, (DH + 0.1) / 2, zf - 0.06)); c.post(X(DX), Z - DEP / 2, 0.6);
    // the door's frame on the room side, with the kids' heights pencilled on it
    const trim = std(c, 0xf4ecd8, { roughness: 0.5 }); [[DX - DW / 2 - 0.06, 0.12], [DX + DW / 2 + 0.06, 0.12]].forEach(([x, w]) => g.add(c.slab(w, DH + 0.1, 0.06, trim, x, (DH + 0.1) / 2, -0.87))); g.add(c.slab(DW + 0.24, 0.12, 0.06, trim, DX, DH + 0.08, -0.87));
    const marks = c.canvasTex(32, 256, (q) => { q.fillStyle = '#2a1a10'; q.font = `700 9px ${c.MONO}`; [[60, 'TROY'], [92, 'JOE'], [110, 'CLINT'], [140, 'WENDELL'], [170, 'NATE']].forEach(([y, n]) => { q.fillRect(2, y, 26, 2); q.fillText(n, 2, y - 2); }); });
    panel(c, g, 0.11, 0.9, decalMat(c, marks), DX + DW / 2 + 0.06, 0.95, -0.836);
    // a bead curtain in the middle door, that swings when you pass
    const beadG = new THREE.SphereGeometry(0.022, 6, 4), strings = [], bcol = [0xff7a1a, 0xf5c542, 0xc83a1a, 0x8a4a1a, 0x22aa66];
    for (let k = 0; k < 14; k++) { const s = new THREE.Group(); s.position.set(9.32 + k * 0.104, 2.5, -1); g.add(s); const pts = []; for (let j = 0; j < 30; j++) pts.push([0, -j * 0.08, 0]); const m = many(c, s, beadG, std(c, bcol[k % 5], { roughness: 0.3 }), pts); m.computeBoundingSphere(); strings.push(s); }
    // a cream ceiling, a sunburst clock, a lamp by the sofa, an orange shag rug, a high window and its light
    const ce = panel(c, g, 20, 16, ceilMat(c, 0xf0e2c8), 10, 5.94, 0); ce.rotation.x = H;
    const clk = c.canvasTex(256, 256, (q) => { q.strokeStyle = '#c8901a'; q.lineWidth = 5; for (let k = 0; k < 24; k++) { const a = k / 24 * PI * 2, R = k % 2 ? 100 : 124; q.beginPath(); q.moveTo(128 + Math.cos(a) * 46, 128 + Math.sin(a) * 46); q.lineTo(128 + Math.cos(a) * R, 128 + Math.sin(a) * R); q.stroke(); } q.fillStyle = '#f4e8d0'; q.beginPath(); q.arc(128, 128, 44, 0, 7); q.fill(); q.strokeStyle = '#2a1a10'; q.lineWidth = 4; q.beginPath(); q.moveTo(128, 128); q.lineTo(128, 96); q.moveTo(128, 128); q.lineTo(150, 136); q.stroke(); });
    panel(c, g, 1.0, 1.0, decalMat(c, clk), 6.6, 2.2, -0.87);
    g.add(c.slab(0.03, 1.5, 0.03, std(c, 0xc8901a, { metalness: 1, roughness: 0.3 }), 2.9, 0.75, 6.4)); const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.36, 18, 1, true), hot(c, 0xffb860, 1.4, { side: THREE.DoubleSide })); sh.position.set(2.9, 1.6, 6.4); g.add(sh); glow(c, K, g, 'rgba(255,190,110,.7)', 2.9, 1.55, 6.4, 1.4, 0.8);
    const shag = c.canvasTex(256, 192, (q, w, h) => { q.fillStyle = '#c86a1a'; q.beginPath(); q.ellipse(w / 2, h / 2, w / 2 - 2, h / 2 - 2, 0, 0, 7); q.fill(); for (let k = 0; k < 3000; k++) { const a = Math.random() * 7, rr = Math.sqrt(Math.random()), x = w / 2 + Math.cos(a) * rr * (w / 2 - 6), y = h / 2 + Math.sin(a) * rr * (h / 2 - 6); q.fillStyle = Math.random() < 0.5 ? '#e8902a' : '#8a3a10'; q.fillRect(x, y, 2, 3); } });
    flat(c, g, 2.6, 1.9, new THREE.MeshStandardMaterial({ map: shag, transparent: true, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 }), 5.9, 4.6, 0.012);
    const winT = ctex(c, 'cr_win', 128, 160, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#fff4d0'); gr.addColorStop(1, '#ffc880'); q.fillStyle = gr; q.fillRect(0, 0, w, h); q.fillStyle = '#f4ead2'; q.fillRect(0, 0, w, 8); q.fillRect(0, h - 8, w, 8); q.fillRect(0, 0, 8, h); q.fillRect(w - 8, 0, 8, h); q.fillRect(0, h / 2 - 3, w, 6); });
    panel(c, g, 1.3, 1.7, new THREE.MeshBasicMaterial({ map: winT, toneMapped: false, color: new THREE.Color(1.4, 1.3, 1.15) }), 19.62, 4.1, 6.8, -H);
    [6.2, 6.8, 7.4].forEach((z, k) => shaft(c, g, 19.4, 4.9, z, 1.0, 8, 0, 0, 1.0 - k * 0.04, 0xffe0b0, 0.06));
    motes(c, r, g, 90, [8, 19, 0.6, 4.5, 2.5, 7.5], 0xffe8c8, 0.04, 0.6);
    // macrame planters overhead, a crate of records by the player
    [[3, 1.5], [17, 1.5]].forEach(([x, z]) => { g.add(c.slab(0.01, 2.0, 0.01, std(c, 0xe8d8b0), x, 4.95, z)); const pot = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8, 0, PI * 2, PI / 2, PI / 2), std(c, 0xb86a3a)); pot.position.set(x, 4.0, z); g.add(pot); many(c, g, new THREE.SphereGeometry(0.12, 8, 6), std(c, 0x3a7a2a, { roughness: 0.8 }), [[x, 4.05, z], [x + 0.14, 3.95, z + 0.08], [x - 0.12, 3.9, z - 0.06], [x + 0.05, 3.8, z - 0.12]]); });
    g.add(c.slab(0.5, 0.35, 0.36, std(c, 0x6a4a2a), 17.0, 0.175, 5.6)); ['#ff4fa3', '#f5c542', '#22d3ee', '#ff7a1a', '#2aa860'].forEach((col, k) => { const sl = c.slab(0.3, 0.31, 0.01, std(c, new THREE.Color(col).getHex()), 16.85 + k * 0.07, 0.45, 5.6); sl.rotation.y = H; g.add(sl); });
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const lx = P.x - r.x0, near2 = Math.hypot(lx - 10, P.z + 1) < 1.3 ? 1 : 0; strings.forEach((s, k) => { s.userData.v = (s.userData.v || 0) + near2 * dt * 3; s.rotation.x = Math.sin(t * 1.2 + k * 0.5) * 0.03 + Math.sin(s.userData.v * 4 + k) * 0.25 * Math.min(1, s.userData.v) * Math.exp(-0.2 * s.userData.v); }); });
    c.clickable(end, () => { c.sound.ding(); c.egg('crooklyn_hall', 'The longest hallway in Bed-Stuy, three doors and a light on at the end. It is two metres deep. The floor climbs and the ceiling ducks, so you cannot get in. MLow ran out of brownstone.'); }, 'The hallway');
  },
};
export const SWAP = {};
