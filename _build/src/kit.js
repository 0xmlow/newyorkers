// The shared kit, carried over whole from THE EVICTION (some of it, the year of 4F and the notices, SAME DIFFERENCE does not use): the eye flower, decals, extras, CC0 props, the cast,
// the typed paper of an eviction, the painted figures stepped out of their paintings, and the year itself.
export const PI = Math.PI;
export const INK = ['#ff4fa3', '#22d3ee', '#f5c542', '#3b82f6', '#ffffff', '#ff7a1a'];

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
export const basic = (c, color, o = {}) => new c.THREE.MeshBasicMaterial({ color, toneMapped: false, ...o });
export const std = (c, color, o = {}) => new c.THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
export const box = (c, w, h, d, mat, x, y, z) => { const m = new c.THREE.Mesh(new c.THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return m; };
export const cyl = (c, r1, r2, h, mat, x, y, z, seg = 16) => { const m = new c.THREE.Mesh(new c.THREE.CylinderGeometry(r1, r2, h, seg), mat); m.position.set(x, y, z); return m; };

// a light that hangs from the ceiling: bulb, cord and a glow you can see
export function bulb(c, g, x, y, z, col = 0xffd08a, cord = 0.8) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, y, z); g.add(o);
  o.add(cyl(c, 0.006, 0.006, cord, std(c, 0x111111), 0, -cord / 2, 0, 6));
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), basic(c, col)); b.position.y = -cord - 0.05; o.add(b);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(c, 'rgba(255,200,120,.5)'), transparent: true, depthWrite: false, toneMapped: false })); s.scale.setScalar(0.7); s.position.y = -cord - 0.05; o.add(s);
  o.userData.bulb = b; o.userData.glow = s; return o;
}

const HEAD = {};
export function extra(c, g, x, z, { seated = false, col = 0x3a4a6a, ry = 0, s = 1 } = {}) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, 0, z); o.rotation.y = ry; o.scale.setScalar(s); g.add(o);
  const h = seated ? 0.45 : 0, body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.72, 12), std(c, col, { roughness: 0.8 })); body.position.y = h + (seated ? 0.36 : 1.0); o.add(body);
  if (!seated) { const legs = c.slab(0.32, 0.64, 0.16, std(c, 0x1a1a22), 0, 0.32, 0); o.add(legs); }
  else { const lap = c.slab(0.34, 0.12, 0.4, std(c, 0x1a1a22), 0, h + 0.04, 0.16); o.add(lap); const shin = c.slab(0.3, 0.45, 0.12, std(c, 0x1a1a22), 0, 0.22, 0.34); o.add(shin); }
  HEAD.t ||= c.canvasTex(256, 256, (q, w) => eyeFlower(q, w / 2, w / 2, w / 2 * 0.98));
  const head = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshStandardMaterial({ map: HEAD.t, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, roughness: 0.6 }));
  head.position.y = h + (seated ? 0.98 : 1.62); o.add(head); o.userData.head = head; o.userData.body = body; return o;
}
// an eye that watches you: a white disc, and an iris that slides toward the camera
export function watcher(c, g, x, y, z, ry, R = 0.5) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, y, z); o.rotation.y = ry; g.add(o);
  o.add(decal(c, R * 3.2, R * 3.2, (q, w, h) => eyeFlower(q, w / 2, h / 2, w / 2 * 0.98)));
  const white = new THREE.Mesh(new THREE.CircleGeometry(R * 0.62, 32), basic(c, 0xf4f4f4)); white.position.z = 0.01; o.add(white);
  const iris = new THREE.Group(); iris.position.z = 0.02; o.add(iris);
  iris.add(new THREE.Mesh(new THREE.CircleGeometry(R * 0.32, 32), basic(c, 0x1d4ed8)));
  const pu = new THREE.Mesh(new THREE.CircleGeometry(R * 0.15, 24), basic(c, 0x0b1020)); pu.position.z = 0.005; iris.add(pu);
  const v = new THREE.Vector3(), inv = new THREE.Matrix4();
  c.tick(() => { if (!o.visible) return; v.copy(c.camera.position); o.updateMatrixWorld(); inv.copy(o.matrixWorld).invert(); v.applyMatrix4(inv); const L = Math.hypot(v.x, v.y, v.z) || 1; iris.position.x = v.x / L * R * 0.3; iris.position.y = v.y / L * R * 0.3; });
  return o;
}
export function steam(c, g, x, y, z, col = 'rgba(230,230,230,.35)', rise = 2.2) {
  const { THREE } = c, m = new THREE.MeshBasicMaterial({ map: glowTex(c, col), transparent: true, depthWrite: false, toneMapped: false }), puffs = [];
  for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(m.clone()); g.add(s); puffs.push({ s, k: i / 6 }); }
  c.tick((t) => puffs.forEach((p) => { const u = (t * 0.25 + p.k) % 1; p.s.position.set(x + Math.sin(u * 6 + p.k * 9) * 0.2, y + u * rise, z); p.s.scale.setScalar(0.4 + u * 1.4); p.s.material.opacity = (1 - u) * 0.7; }));
}

// ---------- the CC0 prop library (Poly Haven) and the cast (ON LOCATION's Tripo eye flower GLBs) ----------
// [name, x, z, { h | len, ry, y, r: collider radius, egg: [hint, id, line], snd }]. Names are Poly Haven ids, files ph_<id>.glb.
export function prop(c, r, g, X, name, x, z, o = {}) {
  const m = c.glb(/^(nyb_|ph_)/.test(name) || o.raw ? name : 'ph_' + name, { h: o.h, len: o.len, x, y: o.y || 0, z, ry: o.ry || 0, parent: g, shadow: !o.y });
  if (o.r) c.post(X(x), z, o.r);
  if (o.egg) c.clickable(m, () => { if (o.snd) c.sound[o.snd](); c.egg(o.egg[1], o.egg[2]); o.fn && o.fn(c); }, o.egg[0]);
  if (o.spin) c.tick((t) => { m.rotation.y = (o.ry || 0) + Math.sin(t * o.spin) * 0.3; });
  return m;
}
export function cast(c, r, g, X, name, x, z, { h = 1.8, ry = 0, y = 0, r: rad = 0.4, line, egg, hint } = {}) {
  const m = c.glb(name, { h, x, y, z, ry, parent: g });
  if (rad) c.post(X(x), z, rad);
  if (line) c.clickable(m, () => { c.say(m, line, 3800, h + 0.3); if (egg) c.egg(egg); }, hint || 'Say hello');
  return m;
}

// ---------- paper ----------
// The notice. A typed sheet, never a real form: the court, the marshal and the docket are all ours.
const _PAPER = {};
export function paperTex(c, kind = 'notice', seed = 0) {
  const k = kind + (seed % 6); if (_PAPER[k]) return _PAPER[k];
  let s = seed * 9301 + 49297; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  return (_PAPER[k] = c.canvasTex(256, 330, (q, w, h) => {
    q.fillStyle = kind === 'pink' ? '#f6d6e4' : kind === 'yellow' ? '#f4e6a8' : '#f2ede0'; q.fillRect(0, 0, w, h);
    q.fillStyle = 'rgba(0,0,0,.05)'; for (let i = 0; i < 40; i++) q.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 30, 1);
    q.fillStyle = '#141414'; q.textAlign = 'center';
    const head = kind === 'notice' ? ['NOTICE OF EVICTION', 'SEVENTY TWO HOURS'] : kind === 'pink' ? ['FINAL NOTICE', 'RENT IN ARREARS'] : kind === 'yellow' ? ['NOTICE OF PETITION', 'HOUSING PART'] : ['LEASE', 'NOT RENEWED'];
    q.font = `800 19px ${c.MONO}`; q.fillText(head[0], w / 2, 34); q.font = `600 12px ${c.MONO}`; q.fillText(head[1], w / 2, 54);
    q.fillRect(22, 64, w - 44, 2);
    for (let y = 82; y < h - 60; y += 11) { const L = 40 + rnd() * (w - 90); q.fillStyle = 'rgba(20,20,20,.55)'; q.fillRect(24, y, L, 4); }
    q.font = `700 11px ${c.MONO}`; q.fillStyle = '#141414'; q.fillText('APT 4F · N3W YORKERS · COUNTED', w / 2, h - 40);
    q.strokeStyle = '#ff7a1a'; q.lineWidth = 4; q.beginPath(); q.arc(w - 58, h - 70, 30, 0, 7); q.stroke();
    q.fillStyle = '#ff7a1a'; q.font = `900 10px ${c.MONO}`; q.fillText('EVICTION', w - 58, h - 66);
  }));
}
// sheets of paper on the wind, instanced, blowing along a box: [x0, x1] [y0, y1] [z0, z1], toward +z by default
export function paperWind(c, g, { x0, x1, y0 = 0.1, y1 = 3, z0, z1, n = 60, speed = 1.4, dir = 1, kinds = ['notice', 'pink', 'yellow'] }) {
  const { THREE } = c, N = c.MOBILE ? Math.ceil(n / 2) : n, groups = [];
  kinds.forEach((kd, ki) => {
    const m = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.21, 0.27), new THREE.MeshStandardMaterial({ map: paperTex(c, kd, ki), side: THREE.DoubleSide, roughness: 0.9 }), Math.ceil(N / kinds.length));
    m.frustumCulled = false; g.add(m); groups.push(m);
  });
  const P = [];
  groups.forEach((m) => { for (let i = 0; i < m.count; i++) P.push({ m, i, u: Math.random(), x: x0 + Math.random() * (x1 - x0), y: y0 + Math.random() * (y1 - y0), ph: Math.random() * 9, sp: 0.6 + Math.random() * 0.8 }); });
  const o = new THREE.Object3D(), st = { gust: 1, still: false };
  c.tick((t, dt, Pl, ri, rdt) => {
    if (!g.visible) return;
    for (const p of P) {
      if (!st.still) p.u = (p.u + dt * speed * p.sp * st.gust / Math.abs(z1 - z0)) % 1;
      const z = dir > 0 ? z0 + (z1 - z0) * p.u : z1 - (z1 - z0) * p.u;
      const y = p.y + Math.sin(t * 1.3 + p.ph) * 0.4 * st.gust - (1 - st.gust) * 0.0;
      o.position.set(p.x + Math.sin(t * 0.9 + p.ph) * 0.5, Math.max(0.03, Math.min(y1, y)), z);
      o.rotation.set(t * p.sp * 2 + p.ph, t * 0.7 + p.ph, Math.sin(t + p.ph)); o.updateMatrix(); p.m.setMatrixAt(p.i, o.matrix);
    }
    groups.forEach((m) => { m.instanceMatrix.needsUpdate = true; });
  });
  return st;
}
// a sheet lying flat on the floor
export function sheet(c, g, x, z, ry = 0, kind = 'notice', seed = 0) {
  const { THREE } = c, m = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.27), new THREE.MeshStandardMaterial({ map: paperTex(c, kind, seed), roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -3 }));
  m.rotation.set(-PI / 2, 0, ry); m.position.set(x, 0.012, z); g.add(m); return m;
}

// ---------- procedural surfaces the house kit lacks ----------
const _TX = {};
function tile(c, key, w, h, draw, rep) { if (_TX[key]) return _TX[key]; const t = c.canvasTex(w, h, draw); t.wrapS = t.wrapT = c.THREE.RepeatWrapping; t.anisotropy = 8; return (_TX[key] = t); }
// the vestibule floor: small white hexagons, a black flower border every few, grout gone grey
export function hexTex(c) {
  return tile(c, 'hex', 512, 512, (q, w, h) => {
    q.fillStyle = '#7a756c'; q.fillRect(0, 0, w, h); const R = 18, dx = R * Math.sqrt(3), dy = R * 1.5;
    for (let j = -1; j < h / dy + 1; j++) for (let i = -1; i < w / dx + 1; i++) {
      const x = i * dx + (j % 2 ? dx / 2 : 0), y = j * dy, dark = (i * 7 + j * 3) % 23 === 0;
      q.fillStyle = dark ? '#1a1a1c' : `hsl(40,12%,${84 + Math.random() * 8}%)`; q.beginPath();
      for (let k = 0; k < 6; k++) { const a = PI / 6 + k * PI / 3; q.lineTo(x + Math.cos(a) * (R - 1.4), y + Math.sin(a) * (R - 1.4)); } q.fill();
    }
    q.globalAlpha = 0.18; for (let i = 0; i < 60; i++) { q.fillStyle = Math.random() < 0.5 ? '#3a2a18' : '#000'; q.beginPath(); q.arc(Math.random() * w, Math.random() * h, 4 + Math.random() * 30, 0, 7); q.fill(); }
  });
}
// the court floor: speckled institutional tile in squares
export function linoTex(c) {
  return tile(c, 'lino', 512, 512, (q, w, h) => {
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { q.fillStyle = (i + j) % 2 ? '#c8c6b4' : '#b4b8a4'; q.fillRect(i * 128, j * 128, 128, 128); }
    for (let i = 0; i < 9000; i++) { q.fillStyle = ['#6a6a5a', '#e8e8dc', '#8a7a68', '#4a5a4a'][i % 4]; q.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    q.strokeStyle = 'rgba(0,0,0,.25)'; q.lineWidth = 2; for (let k = 0; k <= 4; k++) { q.beginPath(); q.moveTo(k * 128, 0); q.lineTo(k * 128, h); q.moveTo(0, k * 128); q.lineTo(w, k * 128); q.stroke(); }
  });
}
// tar beach: silver paint over tar, cracked, patched
export function tarTex(c) {
  return tile(c, 'tar', 512, 512, (q, w, h) => {
    q.fillStyle = '#9a9ca4'; q.fillRect(0, 0, w, h);
    for (let i = 0; i < 4000; i++) { const v = 120 + Math.random() * 80 | 0; q.fillStyle = `rgba(${v},${v},${v + 8},.5)`; q.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
    q.strokeStyle = 'rgba(20,20,24,.55)'; q.lineWidth = 1.5; for (let i = 0; i < 40; i++) { let x = Math.random() * w, y = Math.random() * h; q.beginPath(); q.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (Math.random() - 0.5) * 60; y += (Math.random() - 0.5) * 60; q.lineTo(x, y); } q.stroke(); }
    for (let i = 0; i < 8; i++) { q.fillStyle = 'rgba(30,30,34,.6)'; q.fillRect(Math.random() * w, Math.random() * h, 40 + Math.random() * 90, 30 + Math.random() * 60); }
  });
}
// the pressed tin ceiling every tenement has under nine coats of paint: a raised flower in a square, again and again
export function tinTex(c, base = '#e8e2d2') {
  return tile(c, 'tin' + base, 512, 512, (q, w, h) => {
    q.fillStyle = base; q.fillRect(0, 0, w, h);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
      const x = i * 128 + 64, y = j * 128 + 64;
      q.strokeStyle = 'rgba(0,0,0,.22)'; q.lineWidth = 3; q.strokeRect(x - 60, y - 60, 120, 120);
      q.strokeStyle = 'rgba(255,255,255,.5)'; q.lineWidth = 2; q.strokeRect(x - 57, y - 57, 114, 114);
      for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; q.fillStyle = 'rgba(0,0,0,.16)'; q.beginPath(); q.ellipse(x + Math.cos(a) * 24, y + Math.sin(a) * 24, 18, 8, a, 0, 7); q.fill(); q.fillStyle = 'rgba(255,255,255,.35)'; q.beginPath(); q.ellipse(x + Math.cos(a) * 22, y + Math.sin(a) * 22, 15, 5, a, 0, 7); q.fill(); }
      q.fillStyle = 'rgba(0,0,0,.2)'; q.beginPath(); q.arc(x, y, 12, 0, 7); q.fill(); q.fillStyle = 'rgba(255,255,255,.4)'; q.beginPath(); q.arc(x - 2, y - 2, 9, 0, 7); q.fill();
    }
    q.globalAlpha = 0.2; for (let i = 0; i < 30; i++) { q.fillStyle = '#6a5a3a'; q.beginPath(); q.arc(Math.random() * w, Math.random() * h, 10 + Math.random() * 50, 0, 7); q.fill(); }
  });
}
export function texMat(c, t, rep, o = {}) { const m = new c.THREE.MeshStandardMaterial({ map: t, roughness: 0.8, ...o }); m.userData.rep = rep; return m; }

// ---------- the painted figures ----------
// The Eviction and The Landlord step out of MLow's own paintings: a cutout of the figure (Firefly, from the painting,
// on white, the white keyed out) pushed into relief by its own depth map, turning to face you like a cardboard saint.
export function relief(c, g, name, { h = 1.9, x = 0, z = 0, y = 0, depth = 0.22, face = true } = {}) {
  const { THREE } = c, o = new THREE.Group(); o.position.set(x, y, z); g.add(o);
  const img = new Image(), dimg = new Image(); let n = 0;
  const go = () => {
    if (++n < 2) return;
    const w = img.width, hh = img.height, cv = document.createElement('canvas'); cv.width = 128; cv.height = Math.round(128 * hh / w);
    const q = cv.getContext('2d'); q.drawImage(dimg, 0, 0, cv.width, cv.height); const px = q.getImageData(0, 0, cv.width, cv.height).data;
    const NX = 96, NY = Math.round(NX * hh / w), geo = new THREE.PlaneGeometry(h * w / hh, h, NX, NY), p = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) { const u = uv.getX(i), v = 1 - uv.getY(i), px0 = Math.min(cv.width - 1, u * cv.width | 0), py0 = Math.min(cv.height - 1, v * cv.height | 0); p.setZ(i, (px[(py0 * cv.width + px0) * 4] / 255) * depth); }
    geo.computeVertexNormals(); geo.translate(0, h / 2, 0);
    const t = new THREE.Texture(img); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; t.anisotropy = 4;
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.35, roughness: 0.7, side: THREE.FrontSide }));
    const back = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x050505, alphaMap: t, transparent: true, alphaTest: 0.35, side: THREE.BackSide })); back.position.z = -0.01;
    o.add(m); o.userData.mesh = m; if (o.userData.click) c.clickable(o, o.userData.click, o.userData.hint);
  };
  img.onload = go; dimg.onload = go; img.src = `assets/figs/${name}.png`; dimg.src = `assets/figs/${name}_d.png`;
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ map: glowTex(c, 'rgba(0,0,0,.6)'), transparent: true, depthWrite: false, color: 0x000000 })); sh.scale.set(h * 0.5, 1, h * 0.3); sh.position.y = 0.01; o.add(sh);
  if (face) { const v = new THREE.Vector3(); c.tick(() => { if (!o.visible) return; o.getWorldPosition(v); o.rotation.y = Math.atan2(c.camera.position.x - v.x, c.camera.position.z - v.z) - (o.parent?.rotation.y || 0); }); }
  return o;
}

// the orange stamp from the painting, slammed across the screen
let _stamp;
export function stamp(c, text = 'EVICTION', ms = 1600) {
  if (!_stamp) { _stamp = document.createElement('div'); _stamp.style.cssText = 'position:fixed;left:50%;top:46%;z-index:40;pointer-events:none;font:900 clamp(40px,11vw,150px)/1 var(--mono,monospace);letter-spacing:.06em;color:#ff7a1a;border:.08em solid #ff7a1a;border-radius:.3em;padding:.1em .3em;transform:translate(-50%,-50%) rotate(-12deg) scale(2.4);opacity:0;transition:transform .14s cubic-bezier(.2,1.6,.4,1),opacity .14s;mix-blend-mode:screen;text-shadow:0 0 30px rgba(255,122,26,.6)'; document.body.appendChild(_stamp); }
  _stamp.textContent = text; _stamp.style.transition = 'none'; _stamp.style.opacity = 0; _stamp.style.transform = 'translate(-50%,-50%) rotate(-12deg) scale(2.4)'; void _stamp.offsetWidth;
  _stamp.style.transition = 'transform .14s cubic-bezier(.2,1.6,.4,1),opacity .14s'; _stamp.style.opacity = 0.92; _stamp.style.transform = 'translate(-50%,-50%) rotate(-12deg) scale(1)';
  c.sound.thud(0.9); c.shake(0.08);
  clearTimeout(_stamp._t); _stamp._t = setTimeout(() => { _stamp.style.transition = 'opacity .8s'; _stamp.style.opacity = 0; }, ms);
}

// ---------- the year ----------
// The year 4F is emptied: October 2026, everything in its place, to October 2027, the key on the floor.
// Unpinned, the apartment follows the New York calendar (one chapter on the first of every month). Tear the calendar to
// see ahead; pin a chapter and the room stays there for you, whatever the date. That is the whole of a dynamic token,
// played out in a room: the artist adds a chapter every month, the holder chooses which one is on the wall.
export const MONTHS = ['October 2026', 'November 2026', 'December 2026', 'January 2027', 'February 2027', 'March 2027', 'April 2027', 'May 2027', 'June 2027', 'July 2027', 'August 2027', 'September 2027', 'October 2027'];
// what leaves, in the order it leaves: k is the chapter it is gone in; where is the room of 4F it lives in
export const LEAVES = [
  { k: 1, what: 'the television', why: 'Sold on the stoop for forty dollars the week the first notice came.' },
  { k: 2, what: 'the armchair', why: 'His chair. Nobody else sat in it, and nobody else would carry it.' },
  { k: 3, what: 'the radio', why: 'It played one station for thirty one years. The station is still on.' },
  { k: 4, what: 'the kitchen table', why: 'Every birthday in this family was on that table. It went to a cousin in Bushwick.' },
  { k: 5, what: 'the rug', why: 'Under it, the floor is a different colour: the shape of a rug, kept by the sun for forty years.' },
  { k: 6, what: 'the bookshelf', why: 'Encyclopedias, A to Z, minus Q. Nobody ever found Q.' },
  { k: 7, what: 'the plants', why: 'The window got the morning. The plants knew it. A neighbour on the third floor has them now.' },
  { k: 8, what: 'the sofa', why: 'Too big for the stairs, so it went out the window on a rope, the way it came in.' },
  { k: 9, what: 'the dresser and the mirror', why: 'The mirror stayed behind for a week. It had seen enough.' },
  { k: 10, what: 'the bed', why: 'The last night, the mattress on the floor. The frame was already on the curb.' },
  { k: 11, what: 'the rocking chair', why: 'Grandma\'s. It rocked once on the curb, on its own, when the J went by.' },
  { k: 12, what: 'the lamp', why: 'The last light out. What is left is a key on the floor.' },
];
const NY = () => { try { const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'numeric' }).formatToParts(new Date()); const y = +p.find((x) => x.type === 'year').value, m = +p.find((x) => x.type === 'month').value; return { y, m }; } catch (e) { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() + 1 }; } };
export const liveChapter = () => { const { y, m } = NY(); return Math.max(0, Math.min(12, (y - 2026) * 12 + (m - 10))); };
const Q = new URLSearchParams(location.search);
const readPin = () => { try { const v = localStorage.getItem('evict.pin'); return v === null ? null : +v; } catch (e) { return null; } };
export const CH = {
  live: liveChapter(), pinned: Q.has('chapter') ? Math.max(0, Math.min(12, +Q.get('chapter') || 0)) : readPin(), preview: null, subs: [],
  get n() { return this.preview ?? this.pinned ?? this.live; },
  set(n, how = 'preview') { n = Math.max(0, Math.min(12, n)); const was = this.n; if (how === 'pin') { this.pinned = n; this.preview = null; try { localStorage.setItem('evict.pin', String(n)); } catch (e) {} } else if (how === 'unpin') { this.pinned = null; this.preview = null; try { localStorage.removeItem('evict.pin'); } catch (e) {} } else this.preview = n; this.subs.forEach((f) => f(this.n, was)); },
  on(f) { this.subs.push(f); f(this.n, this.n); },
};
window.__CH = CH;

// the furniture of 4F, by the chapter it leaves in: [model, size] (the apartment places them, the curb outside catches them)
export const FURN = {
  1: [['nyb_crooklyn_tv', { h: 0.62 }]],
  2: [['ArmChair_01', { h: 0.95 }]],
  3: [['boombox', { len: 0.5 }]],
  4: [['WoodenTable_02', { len: 1.2 }], ['WoodenChair_01', { h: 0.95 }], ['WoodenChair_01', { h: 0.95 }]],
  6: [['wooden_bookshelf_worn', { h: 1.8 }]],
  7: [['potted_plant_02', { h: 0.9 }], ['potted_plant_04', { h: 0.7 }]],
  8: [['sofa_03', { len: 2.0 }]],
  9: [['drawer_cabinet', { h: 1.0 }]],
  10: [['old_bed_frame', { len: 2.0 }]],
  11: [['Rockingchair_01', { h: 1.0 }]],
  12: [['nyb_bronx_lamp', { h: 1.55 }]],
};

// ---------- living pictures ----------
// A Seedance loop (first frame and last frame the same plate, so it closes on itself) as a texture. It plays only while
// you are in its room or within three metres of its doorway; anywhere else it pauses, so rooms never decode at once.
export function liveTex(c, name, r) {
  const { THREE } = c, v = document.createElement('video');
  v.src = `assets/video/${name}.mp4`; v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'auto'; v.crossOrigin = 'anonymous';
  const t = new THREE.VideoTexture(v); t.colorSpace = THREE.SRGBColorSpace; (window.__VIDS ||= []).push(v);
  let on = false;
  c.tick((tt, dt, P, ri) => { const out = Math.max(r.x0 - P.x, P.x - (r.x0 + 20), 0), want = out < 3 && !document.hidden; if (want !== on) { on = want; if (on) v.play().catch(() => {}); else v.pause(); } });
  return t;
}

// ---------- the art, shown off ----------
// every room's census New Yorkers (build.py deals 24 per room from the block it stands on): r.cast[0..11] hang on the
// walls, the rest live in the room's tricks. art(r, k) wraps round; artTex caches one texture per file.
export const art = (r, k) => { const L = r.cast && r.cast.length ? r.cast : Object.values(window.CAST || {}).flat(); return L[((k % L.length) + L.length) % L.length]; };
const _ART = {};
export function artTex(c, p) { if (!p) return null; if (_ART[p.f]) return _ART[p.f]; const t = c.tex.load(`assets/art/${p.f}`); t.colorSpace = c.THREE.SRGBColorSpace; t.anisotropy = 4; return (_ART[p.f] = t); }
// a painting as a plain lit plane, clickable to its card
export function artPlane(c, g, p, w, h, o = {}) { const m = new c.THREE.Mesh(new c.THREE.PlaneGeometry(w, h), new c.THREE.MeshBasicMaterial({ map: artTex(c, p), toneMapped: false, transparent: !!o.opacity, opacity: o.opacity ?? 1, side: o.side ?? c.THREE.FrontSide })); g.add(m); if (o.click !== false) c.clickable(m, () => { c.openPiece(p); o.egg && c.egg(o.egg[0], o.egg[1]); }, o.hint || p.t); return m; }

// The chalk painting illusion (street anamorphosis): a picture painted flat across the floor, stretched so that from
// one mark it stands up out of the ground, upright and the right shape. Every floor vertex gets the texture coordinate
// of the point where the ray from the eye through it crosses an upright picture plane at zp.
export function anamorph(c, g, tex, { ex, ez, ey = 1.62, zp, cx, w, h, x0, x1, z0, z1, n = 48, y = 0.014, alpha = 1 }) {
  const { THREE } = c, pos = [], uv = [], idx = [];
  for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
    const x = x0 + (x1 - x0) * i / n, z = z0 + (z1 - z0) * j / n, t = (zp - ez) / (z - ez), X = ex + (x - ex) * t, Y = ey + (y - ey) * t;
    pos.push(x, y, z); uv.push((X - (cx - w / 2)) / w, Y / h);
    if (i && j) { const a = (j - 1) * (n + 1) + i - 1, b = a + n + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
  const mat = new THREE.ShaderMaterial({ uniforms: { t: { value: tex }, a: { value: alpha } }, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: 'uniform sampler2D t; uniform float a; varying vec2 vUv; void main(){ if (vUv.x < 0. || vUv.x > 1. || vUv.y < 0. || vUv.y > 1.) discard; vec4 c = texture2D(t, vUv); float e = min(min(vUv.x, 1. - vUv.x), min(vUv.y, 1. - vUv.y)); gl_FragColor = vec4(c.rgb * .92, c.a * a * smoothstep(0., .015, e));\n#include <colorspace_fragment>\n}' });
  const m = new THREE.Mesh(geo, mat); g.add(m); return m;
}
