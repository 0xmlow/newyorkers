/* ================================================================
   YOUR MOM'S BASEMENT  ·  a MLow virtual architecture build, 2026-10-08
   NEW YORKERS by MLow (120 census paintings) + 20 of MLow's meme sculptures + 35 NEW YORKERS 3D props
   Materials and plates: FLORA (Patina Material, Nano Banana Pro). Art direction: GPT-6 Astra on FLORA.
   Lighting after the Monaverse rules: one or two real lights, everything else baked or faked, one reflection
   probe per area at eye height, 1024 textures, instanced repeats.
   ================================================================ */
const D = window.YMB_DATA, NYP = D.ny, PROPS = D.props || [], SCULPTS = D.sculpts || [];
const nyByN = {}; NYP.forEach(p => nyByN[p.n] = p);
const V3 = THREE.Vector3, PI = Math.PI;
let seed = 1998; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const faceTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
const isMobile = matchMedia('(pointer:coarse)').matches;
const LS = +(new URLSearchParams(location.search).get('ls') || 0.6); // light scale, for metering the exposure headless
const Q = t => '"' + t + '"';

/* ---------------- renderer ---------------- */
const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, powerPreference: 'high-performance', preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070605);
const camera = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, 0.05, 400);
camera.rotation.order = 'YXZ';
scene.fog = new THREE.FogExp2(0x0a0806, 0.012);

/* ---------------- loading + textures ---------------- */
const LM = new THREE.LoadingManager();
LM.onProgress = (u, l, t) => { document.querySelector('#bar i').style.width = (100 * l / t) + '%'; };
LM.onLoad = () => { const g = document.getElementById('go'); g.disabled = false; g.textContent = 'Go down >'; g.focus(); };
const TL = new THREE.TextureLoader(LM);
const ANISO = Math.min(8, renderer.capabilities.getMaxAnisotropy());
function tex(url, rep, srgb = true) {
  const t = TL.load(url); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (rep) t.repeat.set(rep, rep); if (srgb) t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO; return t;
}
/* MAT: every shared material, defined before use. wuv = metres per texture tile (world UV density). */
function pbr(name, wuv, o) {
  const m = new THREE.MeshStandardMaterial(Object.assign({ map: tex(`assets/${name}_c.webp`), normalMap: tex(`assets/${name}_n.webp`, 0, false), roughness: 1, metalness: 0 }, o || {}));
  if (o && o.rough !== false) { try { m.roughnessMap = tex(`assets/${name}_r.webp`, 0, false); } catch (e) { } }
  m.userData.wuv = wuv; return m;
}
const MAT = {
  panel: pbr('panel', 2.44, { roughness: 1 }),
  shag: pbr('shag', 1.0, { roughness: 1 }),
  ceil: pbr('ceil', 1.22, { roughness: 1 }),
  cinder: pbr('cinder', 1.2, { roughness: 1 }),
  vinyl: pbr('vinyl', 1.2, { roughness: 1 }),
  conc: pbr('conc', 2.0, { roughness: 1 }),
  plastic: pbr('plastic', 0.6, { roughness: 1 }),
  bagel: pbr('bagel', 0.6, { roughness: 1 }),
  cream: pbr('cream', 1.0, { roughness: 1 }),
  peg: pbr('peg', 0.6, { roughness: 1 }),
  brick: pbr('brick', 1.4, { roughness: 1 }),
  joist: pbr('joist', 1.2, { roughness: 1 }),
  ink: new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.6 }),
  base: new THREE.MeshStandardMaterial({ color: 0x5a3f2a, roughness: 0.7 }),
  frame: new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 0.55 }),
  orange: new THREE.MeshStandardMaterial({ color: 0xFF6B00, roughness: 0.6 }),
  blue: new THREE.MeshStandardMaterial({ color: 0x2962FF, roughness: 0.5, emissive: 0x0a1e66, emissiveIntensity: 0.4 }),
  white: new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.8 }),
  peach: new THREE.MeshStandardMaterial({ color: 0xe8b89a, roughness: 0.9 }),
  iron: new THREE.MeshStandardMaterial({ color: 0x2b2a28, roughness: 0.75, metalness: 0.6 }),
  steel: new THREE.MeshStandardMaterial({ color: 0xb8bcc2, roughness: 0.35, metalness: 0.9 }),
  copper: new THREE.MeshStandardMaterial({ color: 0xb87333, roughness: 0.4, metalness: 0.9 }),
  enamel: new THREE.MeshStandardMaterial({ color: 0xe9e6dc, roughness: 0.3, metalness: 0.1 }),
  pipe: new THREE.MeshStandardMaterial({ color: 0x9b9c94, roughness: 0.55, metalness: 0.3 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 0.8 }),
  beige: new THREE.MeshStandardMaterial({ color: 0xd9cfae, roughness: 0.7 }),
  crystal: new THREE.MeshStandardMaterial({ color: 0x7FD4FF, roughness: 0.15, metalness: 0.1, emissive: 0x1f6f9f, emissiveIntensity: 0.55, transparent: true, opacity: 0.9 }),
  frost: new THREE.MeshStandardMaterial({ color: 0xdfeaf2, roughness: 0.95 }),
  glass: new THREE.MeshStandardMaterial({ color: 0xcfe0ea, roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.22 }),
  cheese: new THREE.MeshStandardMaterial({ color: 0xf2c75c, roughness: 0.6 }),
  crust: new THREE.MeshStandardMaterial({ color: 0xc98a4a, roughness: 0.9 }),
  pepperoni: new THREE.MeshStandardMaterial({ color: 0x9c2b1e, roughness: 0.7 }),
  fur: new THREE.MeshStandardMaterial({ color: 0x4a4038, roughness: 1 }),
  catfur: new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 1 }),
  bulb: new THREE.MeshBasicMaterial({ color: 0xffd9a0 }),
  tube: new THREE.MeshBasicMaterial({ color: 0xe8f4ff }),
  lava: new THREE.MeshStandardMaterial({ color: 0xff3b1f, emissive: 0xff2a10, emissiveIntensity: 1.4, roughness: 0.4 }),
  screen: null, sock: new THREE.MeshStandardMaterial({ color: 0xf0ede4, roughness: 1 })
};
MAT.ceil.roughness = 0.95; MAT.ceil.color.set(0xb9b2a4); MAT.panel.roughness = 0.68; MAT.panel.color.set(0xd6cdc2); MAT.shag.color.set(0xc7b4a4); MAT.conc.roughness = 0.88; MAT.cinder.roughness = 0.82;
MAT.plaster = new THREE.MeshStandardMaterial({ color: 0xCEC8B9, roughness: 0.95, normalMap: MAT.cinder.normalMap, normalScale: new THREE.Vector2(0.25, 0.25) }); MAT.plaster.userData.wuv = 1.2; MAT.plastic.roughness = 0.32; MAT.plastic.envMapIntensity = 1.4; MAT.bagel.color.set(0xd9a060); MAT.cream.color.set(0xe6dfcc); MAT.iron.color.set(0x1c1b1a); MAT.cinder.color.set(0xa8a398); MAT.brick.color.set(0x9e948a); MAT.vinyl.color.set(0xbfb8a8); MAT.conc.color.set(0x8f8c85); MAT.frost.color.set(0xb9c6d0); MAT.joist.color.set(0xb0a79c); MAT.vinyl.envMapIntensity = 0.6;

/* world-space UVs: texture density in metres, not per face */
function worldUV(geo, scale, axis) {
  const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i)); let u, v;
    if (axis === 'y' || (ay >= ax && ay >= az)) { u = p.getX(i); v = p.getZ(i); } else if (ax >= az) { u = p.getZ(i); v = p.getY(i); } else { u = p.getX(i); v = p.getY(i); }
    uv.setXY(i, u / scale, v / scale);
  }
  uv.needsUpdate = true; return geo;
}
const STATIC = [];
function box(w, h, d, mat, x, y, z, ry = 0, uvs = 0, shadow = true) {
  if (!uvs && mat.userData && mat.userData.wuv) uvs = mat.userData.wuv;
  const g = new THREE.BoxGeometry(w, h, d); if (uvs) { g.translate(x, y, z); worldUV(g, uvs); g.translate(-x, -y, -z); }
  const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = shadow; m.receiveShadow = true; scene.add(m); return m;
}
function cyl(rt, rb, h, mat, x, y, z, seg = 20, rz = 0, rx = 0) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); m.position.set(x, y, z); m.rotation.set(rx, 0, rz); m.castShadow = true; m.receiveShadow = true; scene.add(m); return m;
}
function plane(W, H, mat, x, y, z, ry = 0, rx = 0) { const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat); m.position.set(x, y, z); m.rotation.set(rx, ry, 0, 'YXZ'); m.receiveShadow = true; scene.add(m); return m; }
/* a room: floor, ceiling and four walls with openings. openings: [{side:'n'|'s'|'e'|'w', at, w, h}] */
function room(x0, x1, z0, z1, h, mats, openings = [], o = {}) {
  const fl = mats.floor, wl = mats.wall, cl = mats.ceil, t = 0.25;
  const f = box(x1 - x0, 0.2, z1 - z0, fl, (x0 + x1) / 2, -0.1, (z0 + z1) / 2, 0, 0, false); f.receiveShadow = true;
  if (cl) box(x1 - x0, 0.2, z1 - z0, cl, (x0 + x1) / 2, h + 0.1, (z0 + z1) / 2, 0, 0, false);
  const sides = { n: [x0, x1, z0, 'x'], s: [x0, x1, z1, 'x'], w: [z0, z1, x0, 'z'], e: [z0, z1, x1, 'z'] };
  for (const s in sides) {
    const [a0, a1, c, ax] = sides[s], ops = openings.filter(op => op.side === s).sort((p, q) => p.at - q.at);
    let cur = a0; const segs = [];
    ops.forEach(op => { segs.push([cur, op.at - op.w / 2, 0, h]); if (op.h < h) segs.push([op.at - op.w / 2, op.at + op.w / 2, op.h, h]); if (op.y0) segs.push([op.at - op.w / 2, op.at + op.w / 2, 0, op.y0]); cur = op.at + op.w / 2; });
    segs.push([cur, a1, 0, h]);
    segs.forEach(([b0, b1, y0, y1]) => { if (b1 - b0 < 0.01 || y1 - y0 < 0.01) return; const L = b1 - b0, H = y1 - y0, mid = (b0 + b1) / 2, y = (y0 + y1) / 2;
      if (ax === 'x') box(L, H, t, wl, mid, y, c + (s === 'n' ? -t / 2 : t / 2), 0, 0, false); else box(t, H, L, wl, c + (s === 'w' ? -t / 2 : t / 2), y, mid, 0, 0, false);
      if (y0 === 0 && !o.noBase) { if (ax === 'x') box(L, 0.09, 0.015, MAT.base, mid, 0.045, c + (s === 'n' ? 0.008 : -0.008), 0, 0, false); else box(0.015, 0.09, L, MAT.base, c + (s === 'w' ? 0.008 : -0.008), 0.045, mid, 0, 0, false); }
      if (!o.noCollide && y0 === 0) { if (ax === 'x') wall(b0, c, b1, c); else wall(c, b0, c, b1); } });
  }
  if (o.pad !== false) padRect(x0 - t, x1 + t, z0 - t, z1 + t, 0, -1);
}

/* ---------------- collision: segments, posts, pads ---------------- */
const SEGS = [], CIRCS = [], PADS = [];
function wall(x1, z1, x2, z2, y0 = -10, y1 = 80) { const s = { x1, z1, x2, z2, y0, y1, on: true }; SEGS.push(s); return s; }
function boxWalls(cx, cz, w, d, ry = 0, y0, y1) {
  const c = Math.cos(ry), s = Math.sin(ry), pts = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([x, z]) => [cx + x * c + z * s, cz - x * s + z * c]);
  return [0, 1, 2, 3].map(i => wall(pts[i][0], pts[i][1], pts[(i + 1) % 4][0], pts[(i + 1) % 4][1], y0, y1));
}
function post(x, z, r, y0 = -10, y1 = 80) { const c = { x, z, r, y0, y1, on: true }; CIRCS.push(c); return c; }
function padRect(x0, x1, z0, z1, y, y0) { const p = { t: 'r', x0, x1, z0, z1, y, y0: y0 === undefined ? -10 : y0, on: true }; PADS.push(p); return p; }
function padCirc(x, z, r, y, y0) { const p = { t: 'c', x, z, r, y, y0: y0 === undefined ? -10 : y0, on: true }; PADS.push(p); return p; }
/* a ramp pad: y varies linearly between (a0 -> ya) and (a1 -> yb) along axis */
function padRamp(x0, x1, z0, z1, axis, a0, a1, ya, yb) { const p = { t: 'ramp', x0, x1, z0, z1, axis, a0, a1, ya, yb, y0: -10, on: true }; PADS.push(p); return p; }
const STEP = 0.5;
function floorAt(x, z, curY) {
  let f = -Infinity, block = false;
  const reach = curY + STEP, head = curY + 1.7;
  const consider = (top, bottom) => { if (top <= reach) { if (top > f) f = top; } else if (bottom < head) block = true; };
  for (const p of PADS) {
    if (!p.on) continue;
    if (p.t === 'c') { if ((x - p.x) ** 2 + (z - p.z) ** 2 <= p.r * p.r) consider(p.y, p.y0); continue; }
    if (x < p.x0 || x > p.x1 || z < p.z0 || z > p.z1) continue;
    if (p.t === 'ramp') { const a = p.axis === 'x' ? x : z, u = clamp((a - p.a0) / (p.a1 - p.a0), 0, 1); consider(p.ya + (p.yb - p.ya) * u, p.y0); } else consider(p.y, p.y0);
  }
  return { f: f === -Infinity ? null : f, block };
}
const RAD = 0.34;
function collide(p, feet) {
  for (let it = 0; it < 2; it++) {
    for (const s of SEGS) {
      if (!s.on || feet + 1.7 < s.y0 || feet > s.y1 - 0.2) continue;
      const dx = s.x2 - s.x1, dz = s.z2 - s.z1, L2 = dx * dx + dz * dz || 1;
      const t = clamp(((p.x - s.x1) * dx + (p.z - s.z1) * dz) / L2, 0, 1);
      const cx = s.x1 + dx * t, cz = s.z1 + dz * t, ex = p.x - cx, ez = p.z - cz, d = Math.hypot(ex, ez);
      if (d < RAD) { if (d < 1e-5) { p.x += -dz / Math.sqrt(L2) * RAD; p.z += dx / Math.sqrt(L2) * RAD; } else { p.x = cx + ex / d * RAD; p.z = cz + ez / d * RAD; } }
    }
    for (const c of CIRCS) {
      if (!c.on || feet + 1.7 < c.y0 || feet > c.y1 - 0.2) continue;
      const ex = p.x - c.x, ez = p.z - c.z, d = Math.hypot(ex, ez), R = c.r + RAD;
      if (d < R && d > 1e-5) { p.x = c.x + ex / d * R; p.z = c.z + ez / d * R; }
    }
  }
}

/* ---------------- signs: Abloh owns all text ---------------- */
const TYPE = { title: '"Archivo Narrow","Helvetica Neue",Arial,sans-serif', mono: '"IBM Plex Mono",Menlo,monospace', serif: '"Instrument Serif",Georgia,serif' };
const TXT = { blue: '#2962FF', ink: '#0D0D0D', white: '#FFFFFF' };
const lum = hex => { const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex || ''); if (!m) return 0; let h = m[1]; if (h.length === 3) h = h.split('').map(x => x + x).join(''); const v = [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16) / 255); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
function textColor(c, bg, accent) {
  const dark = bg ? lum(bg) < 0.45 : true, blueBg = bg && /2962ff/i.test(bg);
  if (!c) return dark ? TXT.white : TXT.ink; const k = c.toLowerCase();
  if (k === '#2962ff') return blueBg ? TXT.white : TXT.blue; if (k === '#0d0d0d' || k === '#000' || k === '#000000') return TXT.ink;
  if (k === '#ffffff' || k === '#fff' || k === '#f0f4f8') return dark ? TXT.white : TXT.ink;
  if (k === '#ff6b00' || accent) return blueBg ? TXT.white : (bg && /ff6b00|ff7a1a|ffd400/i.test(bg)) ? TXT.ink : TXT.blue;
  return dark ? TXT.white : TXT.ink;
}
const SIGNS = [];
function signCanvas(lines, w, h, bg, fg, cv) {
  cv = cv || document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d');
  c.clearRect(0, 0, w, h); if (bg) { c.fillStyle = bg; c.fillRect(0, 0, w, h); }
  const plate = !!bg && h >= 160 && lines.length > 1 && !/2962ff|ff6b00|ffd400|ffffff/i.test(bg);
  if (plate) { const m = Math.round(h * 0.045); c.strokeStyle = lum(bg) < 0.45 ? 'rgba(255,255,255,0.9)' : TXT.ink; c.lineWidth = Math.max(2, h * 0.006); c.strokeRect(m, m, w - 2 * m, h - 2 * m); }
  const style = (l, i) => { const serif = /georgia|serif/i.test(l.f || '') && !/courier|mono/i.test(l.f || ''), mono = /courier|mono/i.test(l.f || '') || (l.b === false && !serif) || (i > 0 && !serif && !l.f);
    return serif ? { fam: TYPE.serif, wt: '400', sp: 0, up: false } : mono ? { fam: TYPE.mono, wt: i > 0 && l.b !== false ? '600' : '400', sp: 0.08, up: true } : { fam: TYPE.title, wt: '700', sp: 0.02, up: true }; };
  const sized = lines.map((l, i) => { const st = style(l, i); let sz = (l.s || 0.3) * h * (st.fam === TYPE.mono ? 0.86 : st.fam === TYPE.serif ? 1.12 : 1.06); const t = st.up ? l.t.toUpperCase() : l.t;
    const font = f => `${st.wt} ${f}px ${st.fam}`; c.font = font(sz); if ('letterSpacing' in c) c.letterSpacing = (st.sp * sz) + 'px';
    while (c.measureText(t).width > w * (plate ? 0.84 : 0.9) && sz > 8) { sz *= 0.94; c.font = font(sz); if ('letterSpacing' in c) c.letterSpacing = (st.sp * sz) + 'px'; }
    return { l, i, st, t, sz, font: font(sz), lead: st.fam === TYPE.mono ? 1.5 : 1.1 }; });
  const rule = plate && sized.length > 1 ? h * 0.05 : 0, total = sized.reduce((a, x) => a + x.sz * x.lead, 0) + rule; let y = (h - total) / 2;
  sized.forEach((x, k) => { c.font = x.font; if ('letterSpacing' in c) c.letterSpacing = (x.st.sp * x.sz) + 'px'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = textColor(x.l.c || (k === 0 ? fg : null), bg, x.l.c === '#FF6B00'); c.fillText(x.t, w / 2, y + x.sz * x.lead / 2); y += x.sz * x.lead;
    if (k === 0 && rule) { c.fillStyle = TXT.blue; const rw = Math.min(w * 0.18, 220); c.fillRect((w - rw) / 2, y + rule * 0.25, rw, Math.max(3, h * 0.012)); y += rule; } });
  return cv;
}
function signTex(lines, w = 1024, h = 512, bg = '#0D0D0D', fg) {
  const cv = signCanvas(lines, w, h, bg, fg), t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO;
  SIGNS.push({ cv, t, lines, w, h, bg, fg }); return t;
}
if (document.fonts && document.fonts.load) Promise.all(['700 40px "Archivo Narrow"', '400 40px "IBM Plex Mono"', '600 40px "IBM Plex Mono"', '400 40px "Instrument Serif"'].map(f => document.fonts.load(f))).then(() => {
  SIGNS.forEach(s => { signCanvas(s.lines, s.w, s.h, s.bg, s.fg, s.cv); s.t.needsUpdate = true; }); window.__fontsReady = true;
}).catch(() => { window.__fontsReady = true; });
/* a plaque on a wall: position is the wall point, ry faces into the room, the plate sits 2 cm proud of the wall */
function plaque(lines, x, y, z, ry, W = 0.9, H = 0.3, opt = {}) {
  const mat = new THREE.MeshBasicMaterial({ map: signTex(lines, 1024, Math.round(1024 * H / W), opt.bg || '#1a1612', opt.fg), toneMapped: false });
  const m = plane(W, H, mat, x + Math.sin(ry) * 0.03, y, z + Math.cos(ry) * 0.03, ry);
  if (opt.back !== false) box(W + 0.04, H + 0.04, 0.025, MAT.ink, x + Math.sin(ry) * 0.012, y, z + Math.cos(ry) * 0.012, ry, 0, false);
  return m;
}

/* ---------------- the hang: 120 NEW YORKERS in one instanced atlas ---------------- */
const ATL = [tex('assets/ny0.jpg')]; ATL.forEach(t => { t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; });
const cardBuf = ATL.map(() => ({ uvr: [], mats: [], ids: [], dirty: false, mesh: null }));
const frameMats = []; let frameMesh = null, frameDirty = false;
const cardMats = [], cardMeshes = [], HUNG = [];
const QY = ry => new THREE.Quaternion().setFromAxisAngle(new V3(0, 1, 0), ry);
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
function hangQ(n, pos, quat, h, frame = true) {
  const I = nyByN[n]; if (!I) return null;
  const u = I.uv, w = h * u[5], b = cardBuf[0];
  b.uvr.push(u[1], 1 - u[4], u[3], 1 - u[2]); b.mats.push(new THREE.Matrix4()); b.ids.push({ kind: 'ny', n });
  const H = { a: 0, i: b.ids.length - 1, f: -1, w, h, n, hidden: false };
  if (frame) { frameMats.push(new THREE.Matrix4()); H.f = frameMats.length - 1; }
  setHang(H, pos, quat); HUNG.push(H); return H;
}
/* hang on a wall: (x,z) is the wall point, ry faces into the room; the art sits 5 cm proud, the frame 2 cm */
const hang = (n, x, y, z, ry, h, frame = true) => hangQ(n, new V3(x + Math.sin(ry) * 0.052, y, z + Math.cos(ry) * 0.052), QY(ry), h, frame);
const _n = new V3(), _s = new V3(), _fp = new V3();
function setHang(H, pos, quat) {
  H.pos = pos.clone(); H.quat = quat.clone();
  const b = cardBuf[H.a]; b.mats[H.i].compose(pos, quat, _s.set(H.w, H.h, 1));
  if (H.f >= 0) { _n.set(0, 0, 1).applyQuaternion(quat); _fp.copy(pos).addScaledVector(_n, -0.03); frameMats[H.f].compose(_fp, quat, _s.set(H.w + 0.12, H.h + 0.12, 0.05)); }
  if (b.mesh) { b.mesh.setMatrixAt(H.i, H.hidden ? ZERO : b.mats[H.i]); b.dirty = true; if (H.f >= 0) { frameMesh.setMatrixAt(H.f, H.hidden ? ZERO : frameMats[H.f]); frameDirty = true; } }
}
function buildCards() {
  const pg = new THREE.PlaneGeometry(1, 1);
  cardBuf.forEach((b, a) => {
    if (!b.mats.length) return;
    const g = pg.clone(); g.setAttribute('uvr', new THREE.InstancedBufferAttribute(new Float32Array(b.uvr), 4));
    const mat = new THREE.MeshBasicMaterial({ map: ATL[a], toneMapped: false });
    mat.onBeforeCompile = sh => { sh.vertexShader = 'attribute vec4 uvr;\n' + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n\tvUv = vec2(mix(uvr.x,uvr.z,uv.x), mix(uvr.y,uvr.w,uv.y));'); };
    const im = new THREE.InstancedMesh(g, mat, b.mats.length); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    b.mats.forEach((m, i) => im.setMatrixAt(i, m)); im.frustumCulled = false; im.userData.atlas = a; scene.add(im); b.mesh = im; cardMats.push(mat); cardMeshes.push(im);
  });
  frameMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), MAT.frame, Math.max(1, frameMats.length));
  frameMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); frameMats.forEach((m, i) => frameMesh.setMatrixAt(i, m)); frameMesh.count = frameMats.length;
  frameMesh.castShadow = true; frameMesh.receiveShadow = true; frameMesh.frustumCulled = false; scene.add(frameMesh);
}
function flushCards() { cardBuf.forEach(b => { if (b.dirty && b.mesh) { b.mesh.instanceMatrix.needsUpdate = true; b.dirty = false; } }); if (frameDirty) { frameMesh.instanceMatrix.needsUpdate = true; frameDirty = false; } }
function cropCanvas(n, maxW = 420) {
  const I = nyByN[n], img = ATL[0].image, u = I.uv, cv = document.createElement('canvas'); if (!img || !img.width) { cv.width = cv.height = 8; return cv; }
  const sx = u[1] * img.width, sy = u[2] * img.height, sw = (u[3] - u[1]) * img.width, sh = (u[4] - u[2]) * img.height;
  const sc = Math.min(1.6, maxW / sw); cv.width = Math.round(sw * sc); cv.height = Math.round(sh * sc); cv.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, cv.width, cv.height); return cv;
}
/* a run of paintings along a wall, salon style: from (x0,z0) to (x1,z1), ry facing the room, rows at the given heights */
let nyCursor = 0;
function salon(x0, z0, x1, z1, ry, count, o = {}) {
  const rows = o.rows || [1.55], h = o.h || 0.62, gap = o.gap || 0.22, L = Math.hypot(x1 - x0, z1 - z0), per = Math.ceil(count / rows.length);
  const dx = (x1 - x0) / L, dz = (z1 - z0) / L; let k = 0;
  for (let r = 0; r < rows.length && k < count; r++) {
    const n = Math.min(per, count - k), slots = []; let tot = 0;
    for (let i = 0; i < n; i++) { const p = NYP[(nyCursor + k + i) % NYP.length]; const w = h * p.uv[5]; slots.push([p.n, w]); tot += w; }
    tot += gap * (n - 1); let s = (L - tot) / 2; if (s < 0.15) { const k = (L - 0.3 - gap * (n - 1)) / (tot - gap * (n - 1)); slots.forEach(sl => sl[1] *= k); slots.hh = h * k; tot = L - 0.3; s = 0.15; }
    const hh = rows[r] + (o.jitter ? (rnd() - 0.5) * 0.12 : 0);
    slots.forEach(([n2, w]) => { const c = s + w / 2; hang(n2, x0 + dx * c, hh, z0 + dz * c, ry, slots.hh || h); s += w + gap; });
    k += n;
  }
  nyCursor += count;
}

/* ---------------- models: the 20 meme sculptures and 35 NEW YORKERS 3D props, streamed by distance ---------------- */
const gltfLoader = THREE.GLTFLoader ? new THREE.GLTFLoader() : null;
if (gltfLoader && window.MeshoptDecoder) gltfLoader.setMeshoptDecoder(window.MeshoptDecoder);
const MODELS = [], PICK_EXTRA = []; const SCL = { loading: 0, t: 0, done: 0, range: 46 };
/* place a model by key: size = the metre size of its tallest (mode 'h') or largest (mode 'm') dimension */
function model(key, x, y, z, ry, size, o = {}) {
  const m = Object.assign({ key, x, y, z, ry, size, mode: 'h', dir: o.sculpt ? 'sculpt' : 'props', state: null, pop: 0, label: o.label || key, kind: o.sculpt ? 'sculpt' : 'prop', i: MODELS.length }, o); MODELS.push(m); return m;
}
function updateModels(dt) {
  MODELS.forEach(s => { if (!s.root) return; if (s.pop < 1) { s.pop = Math.min(1, s.pop + dt * 2.2); const e = 1 - Math.pow(1 - s.pop, 3); s.root.scale.setScalar(0.001 + e); } if (s.tick) s.tick(s, dt); });
  SCL.t -= dt; if (SCL.t > 0 || !gltfLoader) return; SCL.t = 0.3;
  const near = MODELS.filter(s => !s.state).sort((a, b) => Math.hypot(P.x - a.x, P.z - a.z) - Math.hypot(P.x - b.x, P.z - b.z));
  for (const s of near) { if (SCL.loading >= 3) break; if (Math.hypot(P.x - s.x, P.z - s.z) > SCL.range) break; s.state = 'loading'; SCL.loading++;
    gltfLoader.load('assets/' + s.dir + '/' + s.key + '.gltf.json', g => { SCL.loading--; s.state = 'ready'; SCL.done++; placeModel(s, g.scene); }, undefined, () => { SCL.loading--; s.state = 'error'; }); }
}
function placeModel(s, obj) {
  obj.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(obj), sz = bb.getSize(new V3()), c = bb.getCenter(new V3());
  const k = s.mode === 'm' ? s.size / Math.max(sz.x, sz.y, sz.z) : s.size / Math.max(0.001, sz.y);
  const inner = new THREE.Group(); inner.add(obj); obj.position.set(-c.x, -bb.min.y, -c.z); inner.scale.setScalar(k); if (s.rx) inner.rotation.x = s.rx;
  const root = new THREE.Group(); root.add(inner); root.position.set(s.x, s.y, s.z); root.rotation.y = s.ry; root.scale.setScalar(0.001); scene.add(root); s.root = root; s.inner = inner; s.pop = 0;
  obj.traverse(o => { if (!o.isMesh) return; o.castShadow = true; o.receiveShadow = true; o.userData.model = s.i; PICK_EXTRA.push(o);
    const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach(mt => { if (mt) { mt.envMapIntensity = s.kind === 'sculpt' ? 0.8 : 0.5; if (mt.map) mt.map.anisotropy = ANISO; } }); });
  if (s.placed) s.placed(s);
}

/* ---------------- light: the Monaverse way. Two real lights with shadows, everything else is a practical or a bake ---------------- */
const hemi = new THREE.HemisphereLight(0x5a4a3a, 0x1a1410, 0.17 * LS); scene.add(hemi);
const KEY = new THREE.SpotLight(0xffd3a0, 0, 16, 1.25, 0.6, 1.6); KEY.castShadow = true; KEY.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048); KEY.shadow.bias = -0.0008; KEY.shadow.normalBias = 0.03; KEY.shadow.camera.near = 0.3; KEY.shadow.camera.far = 18; scene.add(KEY); scene.add(KEY.target);
const practicals = []; const BULBS = [];
function practical(x, y, z, color, base = 6, dist = 7, decay = 2) { base *= 0.5 * LS; const l = new THREE.PointLight(color, base, dist, decay); l.position.set(x, y, z); l.userData.base = base; scene.add(l); practicals.push(l); return l; }
/* a bare bulb on a cord: the key light follows the nearest bulb to the visitor, so one shadow map lights the whole house */
function bulb(x, y, z, color = 0xffd3a0, base = 7, dist = 9) { cyl(0.004, 0.004, 2.6 - y + 0.2, MAT.ink, x, y + (2.6 - y + 0.2) / 2 + 0.03, z, 6); const b = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), MAT.bulb); b.position.set(x, y, z); scene.add(b); const l = practical(x, y - 0.1, z, color, base, dist); BULBS.push({ x, y, z, l, color }); return l; }
/* a fluorescent tube: cool, flat, cheap */
function tube(x, y, z, L, ry = 0, color = 0xdfeeff, base = 5, dist = 8) { const m = cyl(0.02, 0.02, L, MAT.tube, x, y, z, 8, PI / 2); m.rotation.set(0, ry, PI / 2); box(0.16, 0.05, L + 0.1, MAT.enamel, x, y + 0.05, z, ry, 0, false); const l = practical(x, y - 0.1, z, color, base, dist); l.userData.flicker = 0.08; return l; }
/* baked look without a bake: a dark gradient strip along the base and top of every wall (ambient occlusion in the corners) */
const AOC = document.createElement('canvas'); AOC.width = 4; AOC.height = 64; { const c = AOC.getContext('2d'); const g = c.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 4, 64); }
const AOT = new THREE.CanvasTexture(AOC); const AOM = new THREE.MeshBasicMaterial({ map: AOT, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
function ao(x0, z0, x1, z1, ry, h = 0.35, y = 0) { const L = Math.hypot(x1 - x0, z1 - z0); const m = plane(L, h, AOM, (x0 + x1) / 2 + Math.sin(ry) * 0.004, y + h / 2, (z0 + z1) / 2 + Math.cos(ry) * 0.004, ry); m.rotation.z = PI; m.receiveShadow = false; return m; }
function aoRoom(x0, x1, z0, z1, h = 0.35) { ao(x0, z0, x1, z0, 0, h); ao(x1, z1, x0, z1, PI, h); ao(x0, z1, x0, z0, PI / 2, h); ao(x1, z0, x1, z1, -PI / 2, h); }
/* a contact shadow under a piece of furniture */
const CSC = document.createElement('canvas'); CSC.width = CSC.height = 128; { const c = CSC.getContext('2d'); const g = c.createRadialGradient(64, 64, 10, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); }
const CSM = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(CSC), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
function contact(x, y, z, w, d, ry = 0) { const m = plane(w, d, CSM, x, y + 0.006, z, ry, -PI / 2); m.rotation.set(-PI / 2, 0, ry); m.receiveShadow = false; return m; }

/* ---------------- interactables and zones ---------------- */
const INTER = [], ZONES = [];
const interact = (x, z, r, label, fn, y) => { const it = { x, z, r, label, fn, y }; INTER.push(it); return it; };
const zone = (x0, x1, z0, z1, name) => ZONES.push({ x0, x1, z0, z1, name });
