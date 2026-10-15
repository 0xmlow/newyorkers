// BREAK GLASS. A NEW YORKERS 1/1 by MLow.
// A blue evil eye emergency cabinet. Hit the glass three times, it shatters,
// and one of the Keystone 111 (163 painted states) is inside. Re-arm and pull again.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import LOGO from './logo_white.png';

const ART = window.KEYSTONE || [];
const WORKS = [...new Set(ART.map(a => a.id))];

// ---------- randomness (crypto by default, ?seed= replays a sequence) ----------
const qs = new URLSearchParams(location.search);
let seed = qs.has('seed') ? (parseInt(qs.get('seed'), 10) >>> 0) || 1 : 0;
function rnd() {
  if (seed) { seed = (seed + 0x6D2B79F5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  const u = new Uint32Array(1); crypto.getRandomValues(u); return u[0] / 4294967296;
}
const R = (a, b) => a + (b - a) * Math.random();
const TIER_W = { 1: 6, 2: 2, 3: 1 };
const TIER_NAME = { 1: 'KEYSTONE STATE', 2: 'ALTERNATE STATE', 3: 'CANAL STREET BOOTLEG' };
let lastId = -1;
function pull() {
  let id; do { id = WORKS[Math.floor(rnd() * WORKS.length)]; } while (WORKS.length > 1 && id === lastId);
  lastId = id;
  const states = ART.filter(a => a.id === id);
  const tot = states.reduce((s, a) => s + TIER_W[a.tier], 0);
  let r = rnd() * tot, pick = states[0];
  for (const a of states) { r -= TIER_W[a.tier]; if (r <= 0) { pick = a; break; } }
  const odds = Math.round(WORKS.length * tot / TIER_W[pick.tier]);
  return { ...pick, odds };
}

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const BG = 0x040817;
scene.background = new THREE.Color(BG);
scene.fog = new THREE.Fog(BG, 7, 17);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.32;

const camera = new THREE.PerspectiveCamera(36, innerWidth / innerHeight, 0.05, 60);
const HOME = new THREE.Vector3(0.35, 0.4, 4.7);
camera.position.copy(HOME);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.15, 0);
controls.enableDamping = true; controls.dampingFactor = 0.07;
controls.minDistance = 2.4; controls.maxDistance = 8;
controls.minPolarAngle = 0.35; controls.maxPolarAngle = Math.PI * 0.56;
controls.enablePan = false;
controls.update();

// ---------- dimensions ----------
const W = 2.3, H = 1.5, D = 0.46, T = 0.06;          // outer box, wall thickness
const BZ = 0.13, BZTOP = 0.26;                        // bezel widths
const GW = W - 2 * BZ, GH = H - BZ - BZTOP;           // glass opening
const GCY = (BZ - BZTOP) / 2;                          // glass centre y (box local)
const GZ = D / 2 - 0.035;                              // glass plane z
const FLOOR = -1.22;
const box = new THREE.Group(); box.position.y = 0.18; scene.add(box);

// ---------- the evil eye enamel ----------
const BLUE = '#2962FF';
const eyeCanvas = document.createElement('canvas'); eyeCanvas.width = eyeCanvas.height = 1024;
const ectx = eyeCanvas.getContext('2d');
const EYES = [];
for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
  EYES.push({ x: (col + (row % 2 ? 0.5 : 0) + 0.25) * 256, y: (row + 0.5) * 256, r: 92, blink: 0, bt: 0, wob: Math.random() * 6 });
}
// wrap the half-offset ones
EYES.push(...EYES.filter(e => e.x > 1024 - 80).map(e => ({ ...e, x: e.x - 1024, twin: e })));
const look = { x: 0, y: 0, tx: 0, ty: 0, wide: 0 };
const grain = document.createElement('canvas'); grain.width = grain.height = 256;
{ const g = grain.getContext('2d'), id = g.createImageData(256, 256);
  for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 14; }
  g.putImageData(id, 0, 0); }

function drawEye(c, x, y, r, lx, ly, blink, wide) {
  c.save(); c.translate(x, y);
  c.beginPath(); c.arc(0, 0, r + 6, 0, 7); c.fillStyle = 'rgba(0,10,60,.35)'; c.fill();
  c.beginPath(); c.arc(0, 0, r, 0, 7); c.fillStyle = '#0a1f8f'; c.fill();
  c.lineWidth = 3; c.strokeStyle = '#e9f1ff'; c.stroke();
  c.save(); c.beginPath(); c.arc(0, 0, r - 2, 0, 7); c.clip();
  const ox = lx * r * 0.2, oy = ly * r * 0.2;
  c.beginPath(); c.arc(ox * 0.5, oy * 0.5, r * 0.76, 0, 7); c.fillStyle = '#f4f8ff'; c.fill();
  c.beginPath(); c.arc(ox, oy, r * 0.52, 0, 7); c.fillStyle = '#5ec2ff'; c.fill();
  const pr = r * (0.3 + wide * 0.08);
  c.beginPath(); c.arc(ox * 1.15, oy * 1.15, pr, 0, 7); c.fillStyle = '#04081c'; c.fill();
  c.beginPath(); c.arc(ox * 1.15 - pr * 0.35, oy * 1.15 - pr * 0.4, pr * 0.28, 0, 7); c.fillStyle = '#fff'; c.fill();
  if (blink > 0.001) {
    const h = blink * r * 2.1;
    c.fillStyle = '#1f49e6'; c.fillRect(-r, -r - 2, 2 * r, h);
    c.fillRect(-r, r + 2 - h * 0.35, 2 * r, h * 0.35);
    c.strokeStyle = '#04081c'; c.lineWidth = 5; c.beginPath(); c.moveTo(-r, -r - 2 + h); c.lineTo(r, -r - 2 + h); c.stroke();
  }
  c.restore(); c.restore();
}
function paintEnamel() {
  const c = ectx;
  const g = c.createLinearGradient(0, 0, 1024, 1024); g.addColorStop(0, '#2457f5'); g.addColorStop(0.5, BLUE); g.addColorStop(1, '#1d47d8');
  c.fillStyle = g; c.fillRect(0, 0, 1024, 1024);
  c.drawImage(grain, 0, 0, 1024, 1024);
  for (const e of EYES) {
    const s = e.twin || e;
    drawEye(c, e.x, e.y, e.r, look.x + Math.sin(s.wob) * 0.04, look.y, s.blink, look.wide);
  }
  for (const t of enamelTex) t.needsUpdate = true;
}
const enamelTex = [new THREE.CanvasTexture(eyeCanvas)];
enamelTex[0].colorSpace = THREE.SRGBColorSpace; enamelTex[0].wrapS = enamelTex[0].wrapT = THREE.RepeatWrapping; enamelTex[0].anisotropy = 8;
const enamelMat = new THREE.MeshPhysicalMaterial({ map: enamelTex[0], roughness: 0.42, metalness: 0.05, clearcoat: 0.8, clearcoatRoughness: 0.12 });
const EYE_SIZE = 0.95; // metres per texture tile
function enamelBox(w, h, d) {
  // one shared texture; the per face tiling lives in the UVs so eyes stay round and the same size everywhere
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
  const rep = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * rep[f][0] / EYE_SIZE, uv.getY(i) * rep[f][1] / EYE_SIZE); }
  const mesh = new THREE.Mesh(g, enamelMat); mesh.castShadow = mesh.receiveShadow = true; return mesh;
}
paintEnamel();

// ---------- the cabinet ----------
const chrome = new THREE.MeshStandardMaterial({ color: 0xdfe6f2, metalness: 1, roughness: 0.18 });
const navyFelt = new THREE.MeshStandardMaterial({ color: 0x0a1446, roughness: 0.95 });
function add(mesh, x, y, z, parent = box) { mesh.position.set(x, y, z); parent.add(mesh); return mesh; }
// shell
add(enamelBox(W, H, T), 0, 0, -D / 2 + T / 2);                       // back
add(enamelBox(T, H, D), -W / 2 + T / 2, 0, 0);                       // sides
add(enamelBox(T, H, D), W / 2 - T / 2, 0, 0);
add(enamelBox(W, T, D), 0, H / 2 - T / 2, 0);                        // top, bottom
add(enamelBox(W, T, D), 0, -H / 2 + T / 2, 0);
// front bezel
const BD = 0.07, bzz = D / 2 - BD / 2 + 0.012;
add(enamelBox(W, BZTOP, BD), 0, H / 2 - BZTOP / 2, bzz);
add(enamelBox(W, BZ, BD), 0, -H / 2 + BZ / 2, bzz);
add(enamelBox(BZ, H, BD), -W / 2 + BZ / 2, 0, bzz);
add(enamelBox(BZ, H, BD), W / 2 - BZ / 2, 0, bzz);
// chrome lip round the glass
for (const [w, h, x, y] of [[GW + 0.03, 0.015, 0, GCY + GH / 2], [GW + 0.03, 0.015, 0, GCY - GH / 2], [0.015, GH, -GW / 2, GCY], [0.015, GH, GW / 2, GCY]]) {
  add(new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.03), chrome), x, y, GZ + 0.01);
}
// felt lining
add(new THREE.Mesh(new THREE.PlaneGeometry(W - 2 * T, H - 2 * T), navyFelt), 0, 0, -D / 2 + T + 0.001).receiveShadow = true;
const feltFloor = add(new THREE.Mesh(new THREE.PlaneGeometry(W - 2 * T, D - T), navyFelt), 0, -H / 2 + T + 0.001, 0.0);
feltFloor.rotation.x = -Math.PI / 2; feltFloor.receiveShadow = true;
const CASE_FLOOR = box.position.y - H / 2 + T + 0.004;

// sign plate on the top bezel
function fitText(c, txt, x, y, maxW, px, font) { let s = px; c.font = font.replace('#', s); while (c.measureText(txt).width > maxW && s > 8) { s -= 2; c.font = font.replace('#', s); } c.fillText(txt, x, y); }
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const signTex = canvasTex(2048, 220, (c, w, h) => {
  c.fillStyle = '#f2f6ff'; c.fillRect(0, 0, w, h);
  c.strokeStyle = '#0a1f8f'; c.lineWidth = 10; c.strokeRect(14, 14, w - 28, h - 28);
  c.fillStyle = '#0a1f8f'; c.textAlign = 'center'; c.textBaseline = 'middle';
  fitText(c, 'ART EMERGENCY  \u25C9  NEW YORKERS', w / 2, h / 2 + 6, w - 120, 118, '900 #px "Arial Black", Impact, Arial, sans-serif');
});
const sign = add(new THREE.Mesh(new THREE.PlaneGeometry(W * 0.78, W * 0.78 * 220 / 2048), new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.35, metalness: 0.1 })), 0, H / 2 - BZTOP / 2, D / 2 + 0.05);
for (const sx of [-1, 1]) add(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.01, 16), chrome), sx * W * 0.4, H / 2 - BZTOP / 2, D / 2 + 0.052).rotation.x = Math.PI / 2;
// bottom brass-free plate (chrome) with the house line
const plateTex = canvasTex(1400, 120, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#e8eef8'); g.addColorStop(1, '#9aa6ba'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = '#1a2340'; c.textAlign = 'center'; c.textBaseline = 'middle';
  fitText(c, 'KEYSTONE 111  .  163 STATES  .  ONE PULL AT A TIME', w / 2, h / 2 + 3, w - 60, 54, '700 #px Consolas, "Courier New", monospace');
});
add(new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3 * 120 / 1400), new THREE.MeshStandardMaterial({ map: plateTex, metalness: 0.6, roughness: 0.3 })), 0, -H / 2 + BZ / 2, D / 2 + 0.048);

// ---------- the painting inside ----------
const PMAX_W = GW - 0.3, PMAX_H = GH - 0.2, PZ = -D / 2 + T + 0.09;
const artMat = new THREE.MeshBasicMaterial({ toneMapped: false, color: 0xffffff });
const artGroup = new THREE.Group(); artGroup.position.set(0, GCY, PZ); box.add(artGroup);
const artPlane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), artMat); artGroup.add(artPlane);
const frameParts = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), chrome); m.castShadow = true; artGroup.add(m); return m; });
const backer = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.03), new THREE.MeshStandardMaterial({ color: 0x050a20 })); backer.position.z = -0.02; artGroup.add(backer);
// extinguisher style clamps
const clamps = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.05), chrome); m.castShadow = true; artGroup.add(m); return m; });
function fitArt(w, h) {
  const a = w / h; let pw = PMAX_W, ph = pw / a; if (ph > PMAX_H) { ph = PMAX_H; pw = ph * a; }
  artPlane.scale.set(pw, ph, 1); backer.scale.set(pw + 0.08, ph + 0.08, 1);
  const f = 0.035;
  frameParts[0].scale.set(pw + 2 * f, f, 0.05); frameParts[0].position.set(0, ph / 2 + f / 2, 0);
  frameParts[1].scale.set(pw + 2 * f, f, 0.05); frameParts[1].position.set(0, -ph / 2 - f / 2, 0);
  frameParts[2].scale.set(f, ph, 0.05); frameParts[2].position.set(-pw / 2 - f / 2, 0, 0);
  frameParts[3].scale.set(f, ph, 0.05); frameParts[3].position.set(pw / 2 + f / 2, 0, 0);
  clamps.forEach((c, i) => c.position.set((i % 2 ? 1 : -1) * pw * 0.3, (i < 2 ? 1 : -1) * (ph / 2 + 0.01), 0.035));
}
const sealedTex = canvasTex(1600, 900, (c, w, h) => {
  const g = c.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.6); g.addColorStop(0, '#163aa8'); g.addColorStop(1, '#030718');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.globalAlpha = 0.55; drawEye(c, w / 2, h / 2, 260, 0, 0, 0, 0.4); c.globalAlpha = 1;
});
artMat.map = sealedTex; fitArt(16, 9);
const caseLight = new THREE.PointLight(0x9fc4ff, 1.2, 3, 1.6); caseLight.position.set(0, GCY + GH / 2 - 0.1, 0.05); box.add(caseLight);

// ---------- the glass ----------
const glassCanvas = document.createElement('canvas'); glassCanvas.width = 2048; glassCanvas.height = Math.round(2048 * GH / GW);
const gctx = glassCanvas.getContext('2d');
const glassTex = new THREE.CanvasTexture(glassCanvas); glassTex.colorSpace = THREE.SRGBColorSpace; glassTex.anisotropy = 8;
const glassMat = new THREE.MeshPhysicalMaterial({ map: glassTex, transparent: true, roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.6 });
function paintGlass() {
  const c = gctx, w = glassCanvas.width, h = glassCanvas.height;
  c.clearRect(0, 0, w, h);
  // frost: soft noise, heavier at the edges, a wiped band where somebody tried to peek
  const fg = c.createRadialGradient(w / 2, h / 2, h * 0.1, w / 2, h / 2, w * 0.62);
  fg.addColorStop(0, 'rgba(170,200,255,0.42)'); fg.addColorStop(1, 'rgba(205,222,255,0.7)');
  c.fillStyle = fg; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`; c.beginPath(); c.arc(Math.random() * w, Math.random() * h, Math.random() * 18 + 2, 0, 7); c.fill(); }
  // stencil copy
  c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.shadowColor = 'rgba(0,20,90,0.45)'; c.shadowBlur = 8;
  c.font = `900 ${Math.round(h * 0.105)}px "Arial Black", Impact, Arial, sans-serif`;
  c.fillText('IN CASE OF EMERGENCY', w / 2, h * 0.25);
  c.font = `900 ${Math.round(h * 0.2)}px "Arial Black", Impact, Arial, sans-serif`;
  c.fillText('BREAK GLASS', w / 2, h * 0.5);
  c.font = `700 ${Math.round(h * 0.046)}px Consolas, "Courier New", monospace`;
  c.fillText('HIT THREE TIMES  .  A NEW YORKER IS WAITING  .  NO REFUNDS', w / 2, h * 0.75);
  c.shadowBlur = 0;
  // small eye decals in the corners
  for (const [x, y] of [[0.06, 0.12], [0.94, 0.12], [0.06, 0.88], [0.94, 0.88]]) drawEye(c, w * x, h * y, h * 0.045, 0, 0, 0, 0);
  glassTex.needsUpdate = true;
}
paintGlass();
const glass = add(new THREE.Mesh(new THREE.PlaneGeometry(GW, GH), glassMat), 0, GCY, GZ);
glass.renderOrder = 2;

// crack lines drawn on the glass texture
function toCanvas(p) { return [(p.x / GW + 0.5) * glassCanvas.width, (0.5 - p.y / GH) * glassCanvas.height]; }
function drawCracks(p, power) {
  const c = gctx, [cx, cy] = toCanvas(p), scale = glassCanvas.width / GW;
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  const n = 9 + Math.floor(power * 7), rays = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + R(-0.25, 0.25), len = R(0.25, 0.55) * power * scale;
    let x = cx, y = cy; const pts = [[x, y]];
    for (let s = 1; s <= 8; s++) { const aa = a + R(-0.25, 0.25); x = cx + Math.cos(aa) * len * s / 8; y = cy + Math.sin(aa) * len * s / 8; pts.push([x, y]); }
    rays.push(pts);
    for (const [lw, col] of [[5, 'rgba(10,30,90,0.35)'], [2.2, 'rgba(255,255,255,0.95)']]) {
      c.lineWidth = lw; c.strokeStyle = col; c.beginPath(); pts.forEach(([px, py], k) => k ? c.lineTo(px, py) : c.moveTo(px, py)); c.stroke();
    }
    if (Math.random() < 0.5) { // branch
      const k = 3 + Math.floor(Math.random() * 4), [bx, by] = pts[k], ba = a + R(-0.9, 0.9), bl = len * R(0.15, 0.35);
      c.lineWidth = 1.6; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + Math.cos(ba) * bl, by + Math.sin(ba) * bl); c.stroke();
    }
  }
  // concentric rings between rays
  for (let ring = 1; ring <= 1 + Math.floor(power * 2); ring++) {
    const s = Math.min(8, ring * 2 + 1);
    c.lineWidth = 1.8; c.strokeStyle = 'rgba(255,255,255,0.85)'; c.beginPath();
    rays.forEach((pts, i) => { const [x, y] = pts[s]; i ? c.lineTo(x + R(-6, 6), y + R(-6, 6)) : c.moveTo(x, y); });
    c.closePath(); c.stroke();
  }
  // crushed centre
  const cg = c.createRadialGradient(cx, cy, 0, cx, cy, 40 + power * 30); cg.addColorStop(0, 'rgba(255,255,255,0.95)'); cg.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = cg; c.beginPath(); c.arc(cx, cy, 40 + power * 30, 0, 7); c.fill();
  c.restore(); glassTex.needsUpdate = true;
}

// ---------- shards ----------
let shards = [];
const shardEdgeMat = new THREE.LineBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.55 });
function clipRect(poly, hw, hh) {
  const edges = [[p => p.x >= -hw, (a, b) => { const t = (-hw - a.x) / (b.x - a.x); return { x: -hw, y: a.y + t * (b.y - a.y) }; }],
    [p => p.x <= hw, (a, b) => { const t = (hw - a.x) / (b.x - a.x); return { x: hw, y: a.y + t * (b.y - a.y) }; }],
    [p => p.y >= -hh, (a, b) => { const t = (-hh - a.y) / (b.y - a.y); return { x: a.x + t * (b.x - a.x), y: -hh }; }],
    [p => p.y <= hh, (a, b) => { const t = (hh - a.y) / (b.y - a.y); return { x: a.x + t * (b.x - a.x), y: hh }; }]];
  for (const [inside, cut] of edges) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], ia = inside(a), ib = inside(b);
      if (ia) out.push(a);
      if (ia !== ib) out.push(cut(a, b));
    }
    poly = out; if (!poly.length) break;
  }
  return poly;
}
function area(p) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a.x * b.y - b.x * a.y; } return s / 2; }
function shatter(imp) {
  const hw = GW / 2, hh = GH / 2, n = 16 + Math.floor(Math.random() * 6);
  const angs = []; for (let i = 0; i < n; i++) angs.push((i / n) * Math.PI * 2 + R(-0.12, 0.12));
  const radii = [0, 0.06, 0.16, 0.3, 0.5, 0.78, 1.15, 3];
  const jit = angs.map(() => radii.map((r, j) => j === 0 || j === radii.length - 1 ? r : r * R(0.8, 1.2)));
  const P = (i, j) => { const ii = i % n, r = jit[ii][j]; return { x: imp.x + Math.cos(angs[ii]) * r, y: imp.y + Math.sin(angs[ii]) * r }; };
  for (let i = 0; i < n; i++) for (let j = 0; j < radii.length - 1; j++) {
    const poly = j === 0 ? [{ x: imp.x, y: imp.y }, P(i, 1), P(i + 1, 1)] : [P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)];
    let cp = clipRect(poly, hw, hh); if (cp.length < 3) continue;
    if (area(cp) < 0) cp.reverse();
    const ar = area(cp); if (ar < 2e-4) continue;
    const cx = cp.reduce((s, p) => s + p.x, 0) / cp.length, cy = cp.reduce((s, p) => s + p.y, 0) / cp.length;
    const shape = new THREE.Shape(cp.map(p => new THREE.Vector2(p.x - cx, p.y - cy)));
    const geo = new THREE.ShapeGeometry(shape);
    const pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let k = 0; k < pos.count; k++) uv.setXY(k, (pos.getX(k) + cx) / GW + 0.5, (pos.getY(k) + cy) / GH + 0.5);
    const m = new THREE.Mesh(geo, glassMat); m.renderOrder = 3; m.castShadow = true;
    m.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(cp.map(p => new THREE.Vector3(p.x - cx, p.y - cy, 0.001))), shardEdgeMat));
    m.position.set(cx, GCY + cy, GZ); box.add(m);
    const touchesEdge = cp.some(p => Math.abs(Math.abs(p.x) - hw) < 1e-4 || Math.abs(Math.abs(p.y) - hh) < 1e-4);
    const dist = Math.hypot(cx - imp.x, cy - imp.y);
    const stuck = touchesEdge && dist > 0.45 && ar < 0.035 && Math.random() < 0.5;
    const dir = new THREE.Vector2(cx - imp.x, cy - imp.y).normalize();
    const kick = Math.max(0.3, 2.2 - dist * 1.6);
    const inward = !stuck && Math.random() < 0.14;
    shards.push({
      m, stuck, home: m.position.clone(), homeQ: m.quaternion.clone(), delay: dist * 0.06, landed: false, rest: false, tink: false,
      v: new THREE.Vector3(dir.x * kick * R(0.4, 1.1), dir.y * kick * R(0.3, 0.9) + R(0, 0.8), inward ? -R(0.1, 0.35) : R(0.8, 2.6) * Math.min(1.6, kick)),
      w: new THREE.Vector3(R(-12, 12), R(-12, 12), R(-6, 6)), yaw: R(0, 6.28),
    });
    if (stuck) { m.rotation.set(R(-0.08, 0.08), R(-0.08, 0.08), 0); }
  }
  glass.visible = false;
}
const _q = new THREE.Quaternion(), _e = new THREE.Euler();
function stepShards(dt) {
  let moving = false;
  for (const s of shards) {
    if (s.stuck || s.rest) continue;
    if (s.delay > 0) { s.delay -= dt; moving = true; continue; }
    moving = true;
    const p = s.m.position;
    s.v.y -= 9.8 * dt;
    p.addScaledVector(s.v, dt);
    // world-ish floor: inside the cabinet the felt, outside the tiled floor
    const inside = Math.abs(p.x) < W / 2 - T && p.z < GZ - 0.01;
    if (inside) { p.z = Math.max(p.z, -D / 2 + T + 0.12); }
    const floorY = (inside ? CASE_FLOOR : FLOOR) - box.position.y + 0.004;
    if (p.y <= floorY) {
      p.y = floorY;
      if (!s.landed) { s.landed = true; s.targetQ = new THREE.Quaternion().setFromEuler(_e.set(-Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1), 0, s.yaw)); if (!s.tink) { s.tink = true; tinkle(0.3 + Math.random() * 0.4); } }
      s.v.y = Math.abs(s.v.y) > 0.6 ? -s.v.y * 0.22 : 0; s.v.x *= 0.55; s.v.z *= 0.55; s.w.multiplyScalar(0.4);
      if (Math.abs(s.v.y) < 0.01 && s.v.lengthSq() < 0.004) s.rest = true;
    }
    if (s.landed) s.m.quaternion.slerp(s.targetQ, Math.min(1, dt * 9));
    else { _q.setFromEuler(_e.set(s.w.x * dt, s.w.y * dt, s.w.z * dt)); s.m.quaternion.multiply(_q); }
  }
  return moving;
}
function clearShards() { for (const s of shards) { box.remove(s.m); s.m.geometry.dispose(); s.m.children[0].geometry.dispose(); } shards = []; }

// ---------- the hammer on its chain ----------
const hammer = new THREE.Group();
const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.42, 16), new THREE.MeshPhysicalMaterial({ color: 0x0a1f8f, roughness: 0.4, clearcoat: 1 }));
handle.position.y = -0.21; hammer.add(handle);
const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.16, 16), new THREE.MeshStandardMaterial({ color: 0x05070f, roughness: 0.9 })); grip.position.y = -0.33; hammer.add(grip);
const head = new THREE.Group(); head.position.y = 0.0; hammer.add(head);
const headBody = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.06, 0.06), chrome); head.add(headBody);
const spike = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.09, 4), chrome); spike.rotation.z = -Math.PI / 2; spike.position.x = 0.125; head.add(spike);
const pein = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.04, 20), chrome); pein.rotation.z = Math.PI / 2; pein.position.x = -0.1; head.add(pein);
hammer.traverse(o => { if (o.isMesh) o.castShadow = true; });
scene.add(hammer);
const HOOK = new THREE.Vector3(W / 2 + 0.06, box.position.y + H / 2 - 0.15, D / 2 - 0.08);
add(new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 8, 20, Math.PI * 1.3), chrome), HOOK.x - 0.02, HOOK.y - box.position.y, HOOK.z).rotation.y = Math.PI / 2;
const HREST = new THREE.Vector3(W / 2 + 0.12, box.position.y - 0.05, D / 2 - 0.05);
hammer.position.copy(HREST); hammer.rotation.set(0, Math.PI / 2, 0.06);
// a little label for it
const hamLabel = canvasTex(512, 128, (c, w, h) => { c.fillStyle = '#f2f6ff'; c.fillRect(0, 0, w, h); c.fillStyle = '#0a1f8f'; c.font = '900 46px "Arial Black", Impact, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('USE HAMMER', w / 2, h / 2 + 3); });
const hl = add(new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.075), new THREE.MeshStandardMaterial({ map: hamLabel, roughness: 0.4 })), W / 2 + 0.001, -H / 2 + 0.22, 0.05);
hl.rotation.y = Math.PI / 2;
const LINKS = 22, linkGeo = new THREE.TorusGeometry(0.014, 0.004, 6, 12);
const links = new THREE.InstancedMesh(linkGeo, chrome, LINKS); links.castShadow = true; scene.add(links);
const _m = new THREE.Matrix4(), _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
function updateChain() {
  const end = _v.set(0, -0.42, 0).applyMatrix4(hammer.matrixWorld);
  const mid = HOOK.clone().lerp(end, 0.5); mid.y -= 0.25 + 0.1 * Math.max(0, 1.2 - HOOK.distanceTo(end));
  const curve = new THREE.QuadraticBezierCurve3(HOOK, mid, end.clone());
  for (let i = 0; i < LINKS; i++) {
    const t = i / (LINKS - 1), p = curve.getPoint(t), tan = curve.getTangent(t);
    _q.setFromUnitVectors(_up, tan.normalize());
    const twist = new THREE.Quaternion().setFromAxisAngle(_up, i % 2 ? Math.PI / 2 : 0);
    _q.multiply(twist).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2));
    _m.compose(p, _q, _v2.set(1, 1.6, 1)); links.setMatrixAt(i, _m);
  }
  links.instanceMatrix.needsUpdate = true;
}

// ---------- the beacon on top ----------
const beacon = new THREE.Group(); beacon.position.set(0, H / 2, 0.02); box.add(beacon);
beacon.add(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.05, 32), chrome)).position.y = 0.025;
const domeMat = new THREE.MeshPhysicalMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 0.15, transparent: true, opacity: 0.75, roughness: 0.1, clearcoat: 1 });
const dome = new THREE.Mesh(new THREE.SphereGeometry(0.1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), domeMat); dome.position.y = 0.05; beacon.add(dome);
const spinner = new THREE.Group(); spinner.position.y = 0.09; beacon.add(spinner);
const beams = [0, Math.PI].map(a => {
  const s = new THREE.SpotLight(0x00e5ff, 0, 9, 0.4, 0.6, 1.2);
  s.position.set(0, 0, 0); const tgt = new THREE.Object3D(); tgt.position.set(Math.cos(a) * 3, -0.9, Math.sin(a) * 3); spinner.add(s, tgt); s.target = tgt; return s;
});
let alarm = 0;

// ---------- the back: MLow ----------
const logoImg = new Image(); logoImg.src = LOGO;
const backTex = canvasTex(2048, 1340, () => {});
function paintBack() {
  const c = backTex.image.getContext('2d'), w = 2048, h = 1340;
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#071a5c'); g.addColorStop(1, '#030a2a'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.globalAlpha = 0.16; for (let y = 0; y < 6; y++) for (let x = 0; x < 9; x++) drawEye(c, x * 250 + (y % 2) * 125 + 60, y * 250 + 40, 60, 0, 0, 0, 0); c.globalAlpha = 1;
  c.strokeStyle = '#dfe9ff'; c.lineWidth = 6; c.strokeRect(40, 40, w - 80, h - 80); c.lineWidth = 2; c.strokeRect(60, 60, w - 120, h - 120);
  if (logoImg.complete && logoImg.naturalWidth) { const lw = 1240, lh = lw * logoImg.naturalHeight / logoImg.naturalWidth; c.drawImage(logoImg, (w - lw) / 2, 170, lw, lh); }
  c.fillStyle = '#ffffff'; c.textAlign = 'center';
  c.font = '700 120px Georgia, "Times New Roman", serif'; c.fillText('NEW YORKERS', w / 2, 660);
  c.font = '700 44px Consolas, "Courier New", monospace'; c.fillStyle = '#9fc4ff';
  c.fillText('EMERGENCY ART SUPPLY  .  CASE 1 OF 1', w / 2, 750);
  c.fillText('111 KEYSTONE WORKS  .  163 PAINTED STATES INSIDE', w / 2, 815);
  c.font = 'italic 52px Georgia, serif'; c.fillStyle = '#ffffff';
  c.fillText('Break the glass. Meet a New Yorker. Put it back. Do it again.', w / 2, 930);
  // inspection tag, the one every extinguisher has
  c.save(); c.translate(1660, 1110); c.rotate(-0.07);
  c.fillStyle = '#D7FF1F'; c.fillRect(-220, -150, 440, 300);
  c.fillStyle = '#071a5c'; c.beginPath(); c.arc(0, -118, 16, 0, 7); c.fill();
  c.fillStyle = '#0d0d0d'; c.textAlign = 'left'; c.font = '900 40px "Arial Black", Impact, sans-serif'; c.fillText('INSPECTION', -190, -62);
  c.font = '700 28px Consolas, monospace';
  ['INSPECTED BY: MLow', 'LAST CHECKED: NEVER', 'NEXT CHECK: WHEN IT', 'BREAKS. AGAIN.', 'PRESSURE: NYC'].forEach((t, i) => c.fillText(t, -190, -18 + i * 36));
  c.restore();
  c.textAlign = 'left'; c.font = '700 32px Consolas, monospace'; c.fillStyle = '#9fc4ff';
  c.fillText('n3wyorkers.com', 120, 1220);
  backTex.needsUpdate = true;
}
logoImg.onload = paintBack; paintBack();
const backPlate = add(new THREE.Mesh(new THREE.PlaneGeometry(W * 0.86, W * 0.86 * 1340 / 2048), new THREE.MeshStandardMaterial({ map: backTex, metalness: 0.35, roughness: 0.38 })), 0, 0, -D / 2 - 0.006);
backPlate.rotation.y = Math.PI;
for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
  const r = add(new THREE.Mesh(new THREE.SphereGeometry(0.02, 16, 8), chrome), x * W * 0.41, y * W * 0.86 * 1340 / 2048 * 0.46, -D / 2 - 0.01); r.scale.z = 0.4;
}

// ---------- floor, lights ----------
const floorTex = canvasTex(1024, 1024, (c, w, h) => {
  c.fillStyle = '#0b1230'; c.fillRect(0, 0, w, h);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    const l = 10 + Math.random() * 6; c.fillStyle = `hsl(226,45%,${l}%)`; c.fillRect(x * 128 + 3, y * 128 + 3, 122, 122);
  }
});
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(10, 10);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.62, metalness: 0 }));
floor.rotation.x = -Math.PI / 2; floor.position.y = FLOOR; floor.receiveShadow = true; scene.add(floor);
scene.add(new THREE.HemisphereLight(0x9fb8ff, 0x050818, 0.5));
const key = new THREE.SpotLight(0xffffff, 38, 20, 0.5, 0.5, 1.6);
key.position.set(2.2, 4.2, 4.2); key.target.position.set(0, 0, 0); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0005;
scene.add(key, key.target);
const rim = new THREE.DirectionalLight(0x4d7dff, 1.6); rim.position.set(-4, 2, -3); scene.add(rim);
const fill = new THREE.DirectionalLight(0xbfd4ff, 0.5); fill.position.set(-3, 1, 4); scene.add(fill);

// ---------- sound (WebAudio, synthesised, nothing loaded) ----------
let AC = null, master = null, muted = false;
function audio() {
  if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = 0.7; master.connect(AC.destination); }
  if (AC.state === 'suspended') AC.resume(); return AC;
}
function noise(dur, t0, gain, f, q, type = 'bandpass') {
  const ac = audio(), len = Math.ceil(ac.sampleRate * dur), b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const s = ac.createBufferSource(); s.buffer = b; const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  const g = ac.createGain(); g.gain.value = gain; s.connect(fl).connect(g).connect(master); s.start(t0);
}
function ping(t0, f, dur, gain) {
  const ac = audio(), o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = f;
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(gain, t0 + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(master); o.start(t0); o.stop(t0 + dur + 0.02);
}
function sfxStrike(power) { if (muted) return; const t = audio().currentTime; noise(0.08, t, 1.2, 1800, 0.8); noise(0.25, t, 0.5 + power * 0.4, 5200, 1.2, 'highpass'); ping(t, 120, 0.12, 0.5); for (let i = 0; i < 4 + power * 6; i++) ping(t + Math.random() * 0.15, R(3000, 7000), 0.12, 0.06); }
function sfxShatter() {
  if (muted) return; const t = audio().currentTime;
  noise(0.9, t, 1.4, 3000, 0.5); noise(0.4, t, 1.0, 7000, 0.7, 'highpass'); ping(t, 70, 0.3, 0.8);
  for (let i = 0; i < 46; i++) ping(t + Math.pow(Math.random(), 1.6) * 1.3, R(2500, 9000), R(0.05, 0.25), R(0.03, 0.09));
}
let lastTink = 0;
function tinkle(g) { if (muted || !AC) return; const t = AC.currentTime; if (t - lastTink < 0.025) return; lastTink = t; for (let i = 0; i < 3; i++) ping(t + i * 0.02, R(3500, 9500), 0.08, 0.04 * g); }
function sfxBell() {
  if (muted) return; const ac = audio(), t = ac.currentTime, dur = 1.8;
  const out = ac.createGain(); out.gain.value = 0; out.connect(master);
  for (let i = 0; i < Math.floor(dur * 17); i++) { const tt = t + i / 17; out.gain.setValueAtTime(0.22, tt); out.gain.exponentialRampToValueAtTime(0.02, tt + 0.055); }
  out.gain.setValueAtTime(0.0001, t + dur);
  for (const [f, a] of [[880, 1], [2430, 0.5], [4750, 0.25], [1320, 0.3]]) { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; g.gain.value = a; o.connect(g).connect(out); o.start(t); o.stop(t + dur); }
}
function sfxRewind() { if (muted) return; const ac = audio(), t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(200, t); o.frequency.exponentialRampToValueAtTime(1800, t + 0.9); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.15, t + 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + 1); o.connect(g).connect(master); o.start(t); o.stop(t + 1.05); for (let i = 0; i < 20; i++) ping(t + 0.9 - Math.pow(Math.random(), 2) * 0.8, R(3000, 8000), 0.08, 0.04); }

// ---------- state machine ----------
const ui = {
  hint: document.getElementById('hint'), card: document.getElementById('card'), flash: document.getElementById('flash'),
  no: document.getElementById('c-no'), title: document.getElementById('c-title'), meta: document.getElementById('c-meta'),
  tier: document.getElementById('c-tier'), odds: document.getElementById('c-odds'), pulls: document.getElementById('pulls'),
  rearm: document.getElementById('rearm'), turn: document.getElementById('turn'), snd: document.getElementById('snd'),
};
let met = new Set(); try { met = new Set(JSON.parse(localStorage.getItem('breakglass.met') || '[]')); } catch (e) {}
let state = 'armed', hits = 0, current = null, nextTex = null, pulls = 0, shake = 0, rewindT = -1;
const HINTS = ['CLICK THE GLASS', 'HARDER', 'ONE MORE', ''];
function setHint(s) { ui.hint.textContent = s; ui.hint.classList.toggle('on', !!s); }
setHint(ART.length ? HINTS[0] : 'NO ART LOADED');

function prepareNext() {
  current = pull(); nextTex = null;
  const img = new Image(); img.decoding = 'async'; img.src = current.src;
  const want = current;
  img.decode().catch(() => {}).then(() => { if (current !== want) return; const t = new THREE.Texture(img); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; nextTex = t; });
}

// hammer swing animation
let swing = null, queued = [];
function strike(local) {
  if (state !== 'armed') return;
  if (swing) { if (hits + (swing.hit ? 0 : 1) + queued.length < 3) queued.push(local); return; }
  if (hits === 0) prepareNext();
  const target = box.localToWorld(new THREE.Vector3(local.x, local.y, GZ));
  swing = { t: 0, target, local, from: hammer.position.clone() };
}
function impact(local) {
  hits++;
  shake = 0.03 + hits * 0.02;
  if (hits < 3) { drawCracks(local, 0.5 + hits * 0.35); sfxStrike(hits); setHint(HINTS[hits]); for (const e of EYES) if (Math.random() < 0.5) e.bt = 0.001; }
  else breakNow(local);
}
function breakNow(local) {
  state = 'broken'; setHint('');
  drawCracks(local, 1.4);
  shatter(local); sfxShatter(); shake = 0.14;
  ui.flash.classList.remove('go'); void ui.flash.offsetWidth; ui.flash.classList.add('go');
  const reveal = () => {
    const tex = nextTex; if (!tex) { setTimeout(reveal, 30); return; }
    if (artMat.map && artMat.map !== sealedTex) artMat.map.dispose();
    artMat.map = tex; artMat.needsUpdate = true; fitArt(current.w, current.h);
    artGroup.position.z = PZ - 0.1; revealT = 0;
    pulls++; met.add(current.id); try { localStorage.setItem('breakglass.met', JSON.stringify([...met])); } catch (e) {}
    ui.pulls.textContent = `PULL ${String(pulls).padStart(3, '0')}  .  MET ${met.size} OF ${WORKS.length}`;
    ui.no.textContent = `NO. ${String(current.no).padStart(4, '0')}`;
    ui.title.textContent = current.t;
    ui.meta.textContent = [current.g, current.ch].filter(Boolean).join('  .  ');
    ui.tier.textContent = `${TIER_NAME[current.tier]}  .  ${current.lab}`;
    ui.tier.dataset.tier = current.tier;
    ui.odds.textContent = `THIS PULL: 1 IN ${current.odds}`;
    setTimeout(() => { ui.card.classList.add('on'); ui.rearm.classList.add('on'); }, 650);
    alarm = current.tier === 3 ? 5 : 2.6; setTimeout(sfxBell, 180);
    look.wide = 1; for (const e of EYES) e.bt = -Math.random() * 0.8;
  };
  reveal();
}
let revealT = -1;
function rearm() {
  if (state !== 'broken' || rewindT >= 0) return;
  ui.card.classList.remove('on'); ui.rearm.classList.remove('on');
  for (const s of shards) { s.from = s.m.position.clone(); s.fromQ = s.m.quaternion.clone(); s.order = Math.random() * 0.25; }
  rewindT = 0; sfxRewind(); alarm = 0;
}
function finishRearm() {
  clearShards(); rewindT = -1; hits = 0; queued = []; paintGlass(); glass.visible = true;
  if (artMat.map !== sealedTex) { artMat.map.dispose(); artMat.map = sealedTex; artMat.needsUpdate = true; fitArt(16, 9); }
  state = 'armed'; look.wide = 0; setHint(HINTS[0]);
}

// ---------- input ----------
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let taps = 0, down = null, lastInput = performance.now();
renderer.domElement.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; lastInput = performance.now(); audio(); });
renderer.domElement.addEventListener('pointermove', e => {
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  look.tx = THREE.MathUtils.clamp(ndc.x * 1.2, -1, 1); look.ty = THREE.MathUtils.clamp(-ndc.y * 1.2, -1, 1);
  lastInput = performance.now();
  if (state === 'armed') { ray.setFromCamera(ndc, camera); renderer.domElement.style.cursor = ray.intersectObject(glass).length ? 'crosshair' : 'grab'; }
  else renderer.domElement.style.cursor = 'grab';
});
renderer.domElement.addEventListener('pointerup', e => {
  taps++;
  if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 7) { down = null; return; } down = null;
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  if (state === 'armed') {
    const hit = ray.intersectObject(glass)[0];
    if (hit) { const l = box.worldToLocal(hit.point.clone()); strike({ x: l.x, y: l.y - GCY }); }
  } else if (state === 'broken' && ray.intersectObject(artPlane).length) rearm();
});
addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); if (state === 'armed') strike({ x: R(-0.3, 0.3), y: R(-0.15, 0.15) }); else rearm(); }
  if (e.key === 'r' || e.key === 'R') rearm();
  if (e.key === 'b' || e.key === 'B') turnAround();
  if (e.key === 'm' || e.key === 'M') toggleSound();
});
ui.rearm.addEventListener('click', rearm);
let camTween = null;
function turnAround() {
  const behind = camera.position.z < 0;
  const to = behind ? HOME.clone() : new THREE.Vector3(-HOME.x, HOME.y, -HOME.z);
  camTween = { t: 0, from: camera.position.clone(), to }; ui.turn.textContent = behind ? 'TURN IT AROUND' : 'BACK TO THE GLASS';
}
ui.turn.addEventListener('click', turnAround);
function toggleSound() { muted = !muted; ui.snd.textContent = muted ? 'SOUND OFF' : 'SOUND ON'; }
ui.snd.addEventListener('click', toggleSound);
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); fitCam(); });
function fitCam() { const asp = innerWidth / innerHeight, tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)); const dist = Math.max(4.7, 1.62 / (tanH * asp), 1.25 / tanH); HOME.set(asp < 1 ? 0.15 : 0.35, 0.4, dist); controls.maxDistance = dist * 1.7; scene.fog.near = dist + 2; scene.fog.far = dist + 12; if (!camTween && camera.position.z > 0 && state === 'armed' && hits === 0) camera.position.copy(HOME); }
fitCam();

// ---------- loop ----------
let lastT = performance.now(), cost = 0;
let eyeAcc = 0, frame = 0;
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutBack = t => { const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
renderer.setAnimationLoop(() => {
  frame++; const now = performance.now();
  const busy = swing || shards.length || camTween || alarm > 0 || revealT >= 0 || now - lastInput < 4000;
  if (!busy && frame % 2) return;               // idle: half rate, keeps fans quiet
  const dt = Math.min((now - lastT) / 1000, 1 / 20); lastT = now;

  // eyes follow the pointer and blink on their own
  look.x += (look.tx - look.x) * Math.min(1, dt * 6); look.y += (look.ty - look.y) * Math.min(1, dt * 6);
  if (look.wide > 0 && state === 'armed') look.wide = Math.max(0, look.wide - dt);
  let blinking = false;
  for (const e of EYES) {
    if (e.twin) continue;
    if (e.bt === 0 && Math.random() < dt * 0.08) e.bt = 0.001;
    if (e.bt !== 0) { e.bt += dt; if (e.bt > 0) { e.blink = Math.sin(Math.min(1, e.bt / 0.22) * Math.PI); blinking = true; if (e.bt > 0.22) { e.bt = 0; e.blink = 0; } } }
    e.wob += dt * 0.4;
  }
  eyeAcc += dt;
  if (eyeAcc > 1 / 20 && (blinking || Math.abs(look.tx - look.x) + Math.abs(look.ty - look.y) > 0.004 || frame % 30 === 0)) { eyeAcc = 0; paintEnamel(); }

  // hammer
  if (swing) {
    swing.t += dt;
    if (swing.t >= 0.38 && !swing.hit) { swing.hit = true; impact(swing.local); }
    const back = box.localToWorld(new THREE.Vector3(swing.local.x + 0.25, swing.local.y + GCY + 0.35, GZ + 0.55));
    const hitPos = swing.target.clone().add(new THREE.Vector3(0, 0, 0.1));
    if (swing.t < 0.28) { const k = ease(swing.t / 0.28); hammer.position.lerpVectors(swing.from, back, k); hammer.rotation.set(0, -Math.PI / 2, 0.9 * k); }
    else if (swing.t < 0.38) { const k = (swing.t - 0.28) / 0.1; hammer.position.lerpVectors(back, hitPos, k * k); hammer.rotation.set(0, -Math.PI / 2, 0.9 - 2.4 * k * k); }
    else if (swing.t < 0.42) { hammer.position.copy(hitPos); }
    else if (swing.t < 0.95) { const k = ease((swing.t - 0.42) / 0.53); hammer.position.lerpVectors(hitPos, HREST, k); hammer.rotation.set(0, -Math.PI / 2 + k * Math.PI, -1.5 * (1 - k) + 0.06 * k); }
    else { hammer.position.copy(HREST); hammer.rotation.set(0, Math.PI / 2, 0.06); swing = null; if (queued.length) strike(queued.shift()); }
  } else { hammer.rotation.z = 0.06 + Math.sin(now / 900) * 0.03; }
  hammer.updateMatrixWorld(); updateChain();

  // shards
  if (rewindT >= 0) {
    rewindT += dt; let done = true;
    for (const s of shards) {
      const k = THREE.MathUtils.clamp((rewindT - s.order) / 0.9, 0, 1); if (k < 1) done = false;
      const e = ease(k); s.m.position.lerpVectors(s.from, s.home, e); s.m.position.z += Math.sin(e * Math.PI) * 0.4;
      s.m.quaternion.slerpQuaternions(s.fromQ, s.homeQ, e);
    }
    if (done) finishRearm();
  } else if (shards.length) stepShards(dt);

  // painting slides forward into place
  if (revealT >= 0) { revealT += dt; const k = Math.min(1, revealT / 0.9); artGroup.position.z = PZ - 0.1 + 0.1 * easeOutBack(k); caseLight.intensity = 1.2 + 3 * (1 - k) + 0.8; if (k >= 1) revealT = -1; }

  // beacon
  if (alarm > 0) { alarm -= dt; spinner.rotation.y += dt * 9; const on = Math.min(1, alarm); beams.forEach(b => b.intensity = 40 * on); domeMat.emissiveIntensity = 0.4 + 2.6 * on * (0.6 + 0.4 * Math.sin(now / 60)); }
  else { beams.forEach(b => b.intensity = 0); domeMat.emissiveIntensity = 0.15 + 0.1 * Math.sin(now / 700); }

  // camera
  if (camTween) {
    camTween.t += dt / 1.4; const k = ease(Math.min(1, camTween.t));
    const a0 = Math.atan2(camTween.from.x, camTween.from.z), a1 = Math.atan2(camTween.to.x, camTween.to.z);
    let da = a1 - a0; if (Math.abs(da) > Math.PI) da -= Math.sign(da) * Math.PI * 2;
    const r = THREE.MathUtils.lerp(Math.hypot(camTween.from.x, camTween.from.z), Math.hypot(camTween.to.x, camTween.to.z), k), a = a0 + (da || Math.PI) * k;
    camera.position.set(Math.sin(a) * r, THREE.MathUtils.lerp(camTween.from.y, camTween.to.y, k), Math.cos(a) * r);
    if (camTween.t >= 1) camTween = null;
  }
  controls.update();
  if (shake > 0.0005) { shake *= Math.pow(0.002, dt); camera.position.x += R(-shake, shake); camera.position.y += R(-shake, shake); }
  renderer.render(scene, camera);
  cost = cost * 0.9 + (performance.now() - now) * 0.1;
});
document.addEventListener('visibilitychange', () => { if (document.hidden && AC) AC.suspend(); });
window.__breakglass = { strike: () => strike({ x: 0.1, y: 0 }), rearm, turnAround, get state() { return state; }, get debug() { return { hits, swing: !!swing, queued: queued.length, taps, ms: +cost.toFixed(2) }; }, get current() { return current; }, art: ART.length };
