// the engine's helpers from ONLY IN NEW YORK (matsFor to burst), between head.part.js and body.part.js; build.py joins the three into build.js
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


