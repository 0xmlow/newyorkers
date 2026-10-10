// ON LOCATION: New York at the movies, recast with New Yorkers. Walkable.
// Ten sets in a row, forked from THE MARKS engine. Each opens onto a photo plate rebuilt as geometry
// from its depth map (the MONA pass). The cast are Tripo GLBs with eye flowers for heads. Every room
// carries one trick: a mirror that answers back, a floor that plays, a grate that lifts you, a skeleton
// that moves when you look away, a staircase with no top, a deck that falls away under you.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { ROOMS, W, D, H_IN, PORTAL } from './rooms.js';
import { Sound } from './sound.js';

const $ = (s) => document.querySelector(s);
await Promise.race([Promise.all(['900 40px Fraunces', '700 40px "Space Grotesk"', '600 40px "IBM Plex Mono"'].map((f) => document.fonts.load(f))), new Promise((r) => setTimeout(r, 2500))]).catch(() => {});
const Q = new URLSearchParams(location.search);
const MOBILE = matchMedia('(pointer:coarse)').matches;
const CAST = window.CAST || {};

// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: !MOBILE, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = +(Q.get('ex') || 0.9);
renderer.outputColorSpace = THREE.SRGBColorSpace;
$('#stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05060a);
scene.fog = new THREE.FogExp2(0x07080d, 0.018);
const FOV = MOBILE ? 72 : 66;
const camera = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, 0.05, 900);
camera.rotation.order = 'YXZ';

// ---------- the screen pass: colour, shimmer, wobble, grain ----------
// The scene renders into a target; one full screen triangle puts it on the glass with the room's look.
const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: MOBILE ? 0 : 4 });
const postMat = new THREE.ShaderMaterial({
  uniforms: { tScene: { value: rt.texture }, uSat: { value: 1 }, uHeat: { value: 0 }, uWarp: { value: 0 }, uGrain: { value: 0 }, uTime: { value: 0 }, uFlash: { value: 0 }, uTint: { value: new THREE.Color(1, 1, 1) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
  fragmentShader: `
    uniform sampler2D tScene; uniform float uSat, uHeat, uWarp, uGrain, uTime, uFlash; uniform vec3 uTint; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec2 uv = vUv;
      // heat: the air above the asphalt bends, strongest low in the frame
      uv.x += uHeat * 0.0045 * sin(uv.y * 90. + uTime * 7.) * smoothstep(0.75, 0.0, uv.y);
      uv.y += uHeat * 0.0025 * sin(uv.x * 70. - uTime * 5.) * smoothstep(0.75, 0.0, uv.y);
      // warp: the world breathes, for the motion after effect and the wish
      vec2 c = uv - 0.5; float r = length(c);
      uv = 0.5 + c * (1. + uWarp * 0.06 * sin(uTime * 2.2 - r * 9.));
      uv += uWarp * 0.004 * vec2(sin(uTime * 1.7 + uv.y * 6.), cos(uTime * 1.3 + uv.x * 6.));
      vec4 col = texture2D(tScene, uv);
      float l = dot(col.rgb, vec3(0.2126, 0.7152, 0.0722));
      col.rgb = mix(vec3(l), col.rgb, uSat) * uTint;
      col.rgb += (h(vUv * 800. + uTime) - 0.5) * uGrain * 0.09;
      col.rgb *= 1. - uGrain * 0.35 * r * r * 2.;
      col.rgb = mix(col.rgb, vec3(1.), uFlash);
      gl_FragColor = col;
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
  depthTest: false, depthWrite: false,
});
const postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3)); tri.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
const postQuad = new THREE.Mesh(tri, postMat); postQuad.frustumCulled = false; postScene.add(postQuad);
const POST = { sat: 1, heat: 0, warp: 0, grain: 0, flash: 0 };   // eased toward the room's targets
const FX = { warp: 0, sat: null, flash: 0 };                      // one off pushes from the rooms
function resize() { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); const pr = renderer.getPixelRatio(); rt.setSize(Math.round(innerWidth * pr), Math.round(innerHeight * pr)); }
addEventListener('resize', resize); resize();

const loading = { total: 0, done: 0 };
const mgr = new THREE.LoadingManager();
mgr.onProgress = (_u, d, t) => { loading.done = d; loading.total = t; const p = $('#lp'); if (p) p.style.width = (100 * d / Math.max(1, t)).toFixed(0) + '%'; };
const tex = new THREE.TextureLoader(mgr);
const gltf = new GLTFLoader(mgr);
new HDRLoader(mgr).load('assets/env/night.hdr', (h) => {
  h.mapping = THREE.EquirectangularReflectionMapping;
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromEquirectangular(h).texture; h.dispose(); pm.dispose();
});
scene.environmentIntensity = 0.35;

// ---------- materials ----------
const SURF = {};
function surf(name, rep = 1, tint) {
  const k = name + rep + (tint || '');
  if (SURF[k]) return SURF[k];
  const ld = (s, srgb) => { const t = tex.load(`assets/tex/${name}_${s}.jpg`); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const m = new THREE.MeshStandardMaterial({ map: ld('c', true), normalMap: ld('n'), roughnessMap: ld('r'), color: tint ? new THREE.Color(tint) : 0xffffff });
  m.userData.rep = rep;
  return (SURF[k] = m);
}
function slab(w, h, d, mat, x, y, z, rep) {
  const g = new THREE.BoxGeometry(w, h, d);
  const r = rep || mat.userData.rep || 2, rx = mat.userData.repX || r, ry = mat.userData.repY || r, uv = g.attributes.uv, n = g.attributes.normal;
  for (let i = 0; i < uv.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
    const [a, b] = ax > 0.5 ? [d, h] : ay > 0.5 ? [w, d] : [w, h];
    uv.setXY(i, uv.getX(i) * a / rx, uv.getY(i) * b / ry);
  }
  const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); return m;
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.userData.canvas = c; return t;
}
const FONT = '"Space Grotesk", "Helvetica Neue", Arial, sans-serif';
const SERIF = 'Fraunces, Georgia, serif';
const MONO = '"IBM Plex Mono", Menlo, monospace';
function sign(text, { w = 4, h = 0.8, bg = '#111', fg = '#f4ead2', font = FONT, weight = 800, glow = 0, px = 256, pad = 0.12, border } = {}) {
  const cw = Math.round(px * w / h), t = canvasTex(cw, px, (g, W2, H2) => {
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, W2, H2); }
    if (border) { g.strokeStyle = border; g.lineWidth = H2 * 0.05; g.strokeRect(H2 * .05, H2 * .05, W2 - H2 * .1, H2 - H2 * .1); }
    const lines = text.split('\n'); let fs = H2 * (1 - pad * 2) / lines.length * 0.86;
    g.font = `${weight} ${fs}px ${font}`; const mw = Math.max(...lines.map((l) => g.measureText(l).width));
    if (mw > W2 * (1 - pad)) { fs *= W2 * (1 - pad) / mw; g.font = `${weight} ${fs}px ${font}`; }
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (glow) { g.shadowColor = fg; g.shadowBlur = glow; }
    lines.forEach((l, i) => g.fillText(l, W2 / 2, H2 / 2 + (i - (lines.length - 1) / 2) * fs * 1.1));
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: !bg, toneMapped: false, fog: false }));
}

// ---------- world helpers ----------
const colliders = [];
const clickables = [];
const tickers = [];
const wall = (x1, z1, x2, z2) => { const c = { x1, z1, x2, z2 }; colliders.push(c); return c; };
const post = (x, z, r) => { const c = { x, z, r }; colliders.push(c); return c; };
const tick = (f) => tickers.push(f);
// a GLB group is empty until it loads, so the group remembers its click and glb() hands it on to the meshes
const clickable = (obj, fn, hint) => { obj.userData.click = fn; obj.userData.hint = hint; obj.traverse((o) => { if (o.isMesh && !clickables.includes(o)) { o.userData.click = fn; o.userData.hint = hint; clickables.push(o); } }); };

const GLB = {};
// Tripo hands models back facing any which way; these turn each one so its front is three.js +Z.
// Read off the front and top renders (_build/front_sheet.py into work/sheet).
const H = Math.PI / 2;
const YAW = { bluesteel: -H, writer: H, boxer: Math.PI, workgirl: -H, tracksuit: -H, golfer: -H, wiseguy: -H, dog: Math.PI, cat: -H, deer: 0, folksinger: Math.PI, flyer: -H, anchor: -H, jeweler: -H, auggie: -H, bookseller: -H, susan: 0, dad: Math.PI, libhead: -H, sedan: -H, prince: -H, agent: -H, famer: -H, annieh: -H, rosemary: -H, sonny: -H, clerk: -H, sally: 0, pigeonlady: -H, elf: -H, broker: -H, maria: -H, loretta: -H, hijacker: -H, bench: H, checker: -H, gown: -H, lensman: 0, discoking: -H, maitre: -H, hustler: Math.PI, ambulance: -H, ape: -H, boombox: -H, cabbie: H, dancer: -H, dress: -H, hotdog: -H, mlowtar: -H, moai: -H, popcorn: -H, puft: -H, usher: -H, trex: Math.PI, hydrant: Math.PI, pigeon: Math.PI, rat: -H, blindwoman: Math.PI, killer: -H, actress: -H, robber: -H, odette: Math.PI, bartender: -H, waltzers: -H, butcher: -H, felix: -H, oscar: -H, sailors: -H, editor: -H, assistant: -H, odile: 0 };
// a soft contact shadow under everything that stands on the floor: the cheapest realism there is
const BLOB = canvasTex(128, 128, (q) => { const g = q.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,.62)'); g.addColorStop(0.55, 'rgba(0,0,0,.28)'); g.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = g; q.fillRect(0, 0, 128, 128); });
const BLOB_M = new THREE.MeshBasicMaterial({ map: BLOB, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -4 });
const BLOB_G = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
function glb(name, { h, len, x = 0, y = 0, z = 0, ry = 0, parent = scene, onload, shadow = true } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  // models load when their set, or the one next door, is where you are: fifteen sets of props up front is too much for a phone
  PENDING.push({ room: BUILDING.i, run: () => load(name, g, { h, len, y, onload, shadow }) });
  return g;
}
const PENDING = [], BUILDING = { i: 0 };
function wake(ri) { for (let k = PENDING.length - 1; k >= 0; k--) if (Math.abs(PENDING[k].room - ri) <= 1) { PENDING[k].run(); PENDING.splice(k, 1); } }
function load(name, g, { h, len, y, onload, shadow }) {
  (GLB[name] ||= new Promise((res, rej) => gltf.load(`assets/glb/${name}.glb`, (r) => res(r.scene), undefined, rej))).then((src) => {
    const o = src.clone(true), pv = new THREE.Group(); pv.add(o); pv.rotation.y = YAW[name] || 0; pv.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(pv), s = new THREE.Vector3(); b.getSize(s);
    const k = h ? h / s.y : len ? len / Math.max(s.x, s.z) : 1;
    const c = new THREE.Vector3(); b.getCenter(c);
    const sc = new THREE.Group(); sc.add(pv); sc.scale.setScalar(k); sc.position.set(-c.x * k, -b.min.y * k, -c.z * k);
    o.traverse((m) => { if (m.isMesh && m.material) { m.material.envMapIntensity = 1.2; m.castShadow = false; } });
    if (shadow && y < 0.4) { const sh = new THREE.Mesh(BLOB_G, BLOB_M); sh.scale.set(Math.max(0.3, s.x * k * 1.25), 1, Math.max(0.3, s.z * k * 1.25)); sh.position.y = 0.012; sh.renderOrder = 1; g.add(sh); }
    g.add(sc); g.userData.ready = true; if (g.userData.click) clickable(g, g.userData.click, g.userData.hint); onload && onload(g, sc);
  }).catch(() => { if (name.startsWith('ph_')) return; const ph = slab(0.5, h || 1, 0.5, new THREE.MeshStandardMaterial({ color: 0x333333 }), 0, (h || 1) / 2, 0); g.add(ph); });
  return g;
}

// ---------- the photo plates, rebuilt as space ----------
const TAN_H = 0.75;
function plate(room) {
  const g = new THREE.Group(); scene.add(g);
  const img = new Image(); img.src = `assets/depth/${room.plate}.png`;
  loading.total++;
  img.onload = () => {
    const cw = img.width, ch = img.height, c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const cx = c.getContext('2d'); cx.drawImage(img, 0, 0); const px = cx.getImageData(0, 0, cw, ch).data;
    const dAt = (u, v) => px[(Math.min(ch - 1, Math.round(v * (ch - 1))) * cw + Math.min(cw - 1, Math.round(u * (cw - 1)))) * 4] / 255;
    const tanV = TAN_H * ch / cw;
    const EYE = 1.6, near = EYE / (0.96 * tanV), far = room.far || 60;
    let dn = 0; for (let i = 0; i < 9; i++) dn += dAt(0.3 + i * 0.05, 0.98); dn /= 9;
    let dmin = 1; for (let i = 0; i < 400; i++) dmin = Math.min(dmin, dAt(Math.random(), Math.random() * 0.8));
    const a = (1 / near - 1 / far) / Math.max(0.05, dn - dmin), b = 1 / far - a * dmin;
    const NX = MOBILE ? 160 : 260, NY = Math.round(NX * ch / cw) + 1, pos = new Float32Array((NX + 1) * NY * 3), uvs = new Float32Array((NX + 1) * NY * 2), zz = new Float32Array((NX + 1) * NY);
    const zMin = PORTAL.dist + 0.03;
    let k = 0;
    for (let j = 0; j < NY; j++) for (let i = 0; i <= NX; i++, k++) {
      const u = i / NX, v = j / (NY - 1), x = u * 2 - 1, y = 1 - v * 2;
      let z = 1 / Math.max(1e-4, a * dAt(u, v) + b); z = Math.min(far * 1.4, Math.max(zMin, z * (room.zscale || 1)));
      pos[k * 3] = x * TAN_H * z; pos[k * 3 + 1] = EYE + y * tanV * z; pos[k * 3 + 2] = -z; zz[k] = z;
      uvs[k * 2] = u; uvs[k * 2 + 1] = 1 - v;
    }
    const idx = [];
    for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NX; i++) {
      const p = j * (NX + 1) + i, q = p + NX + 1, zs = [zz[p], zz[p + 1], zz[q], zz[q + 1]];
      if (Math.max(...zs) / Math.min(...zs) > (room.tear || 2.6)) continue;
      idx.push(p, q, p + 1, p + 1, q, q + 1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2)); geo.setIndex(idx);
    const map = tex.load(`assets/plates/${room.plate}.jpg`); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
    const fade = canvasTex(256, 128, (q, w, h) => {
      const gx = q.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, '#000'); gx.addColorStop(0.035, '#fff'); gx.addColorStop(0.965, '#fff'); gx.addColorStop(1, '#000');
      q.fillStyle = gx; q.fillRect(0, 0, w, h); q.globalCompositeOperation = 'multiply';
      const gy = q.createLinearGradient(0, 0, 0, h); gy.addColorStop(0, '#000'); gy.addColorStop(0.06, '#fff'); gy.addColorStop(1, '#fff'); q.fillStyle = gy; q.fillRect(0, 0, w, h);
    });
    const mat = new THREE.MeshBasicMaterial({ map, alphaMap: fade, transparent: true, fog: false, toneMapped: false, side: THREE.DoubleSide, color: new THREE.Color(room.plateTint || 0xffffff) });
    const mesh = new THREE.Mesh(geo, mat); mesh.renderOrder = -1; g.add(mesh);
    g.position.set(room.x0 + W / 2, room.plateY || 0, -D / 2 + PORTAL.dist);
    room.plateMesh = mesh;
    loading.done++;
  };
  return g;
}

// ---------- the New Yorkers on the walls ----------
const FRAMES = {
  black: { c: 0x111111, m: 0.2, r: 0.5, d: 0.06, b: 0.06 },
  gilt: { c: 0xb8902e, m: 1, r: 0.32, d: 0.1, b: 0.12 },
  steel: { c: 0x8c9196, m: 1, r: 0.38, d: 0.05, b: 0.04 },
  oak: { c: 0x6b4423, m: 0, r: 0.6, d: 0.06, b: 0.07 },
};
const artMeshes = [];
function hang(p, x, y, z, ry, w, style, parent = scene) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  const f = FRAMES[style] || FRAMES.black;
  const fm = new THREE.MeshStandardMaterial({ color: f.c, metalness: f.m, roughness: f.r });
  const fr = new THREE.Mesh(new THREE.BoxGeometry(1, 1, f.d), fm); fr.position.z = f.d / 2; g.add(fr);
  const mat = new THREE.MeshStandardMaterial({ emissive: 0xffffff, emissiveIntensity: 0.5, roughness: 0.4 });
  const art = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat); art.position.z = f.d + 0.002; g.add(art);
  const fit = (asp) => { const h = w / asp; art.scale.set(w, h, 1); fr.scale.set(w + f.b * 2, h + f.b * 2, 1); pl.position.y = -h / 2 - 0.2; };
  const t = tex.load(`assets/art/${p.f}`, (tt) => fit(tt.image.width / tt.image.height)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  mat.map = mat.emissiveMap = t;
  const pl = sign(`${p.t}\nNo. ${p.n}`, { w: Math.min(0.95, w * 0.72), h: 0.16, bg: '#f2ead8', fg: '#1b1b1b', font: MONO, weight: 600, px: 96 });
  pl.position.set(0, -w * 9 / 32 - 0.2, 0.03); g.add(pl);
  fit(16 / 9);
  art.userData.piece = p; p.mesh = art; p.group = g;
  clickable(art, () => openPiece(p), p.t);
  artMeshes.push(art);
  return g;
}

const lights = [];
for (let i = 0; i < 4; i++) { const l = new THREE.PointLight(0xffffff, 0, 26, 1.6); scene.add(l); lights.push(l); }
const hemi = new THREE.HemisphereLight(0x8899bb, 0x221a12, 0.4); scene.add(hemi);

// ---------- player ----------
const EYE = 1.62;
const P = { x: W / 2, z: D / 2 - 2.2, yaw: 0, pitch: -0.02, y: EYE, bob: 0, scale: 1, lift: 0, speed: 1, fov: FOV, back: 0, zoom: false, ride: null };
// the clock the sets run on: bullet time slows it, the strobe and the rides read it
const TIME = { scale: 1, target: 1, t: 0 };

import { buildRoom } from './build.js';
const ctx = { keys: null, wake: (i) => wake(i), THREE, scene, camera, renderer, surf, slab, sign, canvasTex, glb, wall, post, tick, clickable, hang, plate, tex, egg, toast, say, sound: null, MOBILE, shake, FONT, SERIF, MONO, P, FX, EYE, flash, TIME, zoom, ride, ray, hemi, lights };
ROOMS.forEach((r, i) => { r.i = i; r.x0 = i * W; r.prev = ROOMS[i - 1]?.name; r.next = ROOMS[i + 1]?.name; r.last = i === ROOMS.length - 1; r.cast = CAST[r.id] || []; });
window.__clickables = clickables;
ROOMS.forEach((r) => { BUILDING.i = r.i; buildRoom(ctx, r); });

if (Q.get('room')) { const r = ROOMS.find((q) => q.id === Q.get('room')); if (r) P.x = r.x0 + W / 2; }
if (Q.get('cam')) { const [x, z, yaw, pitch] = Q.get('cam').split(',').map(Number); P.x = x; P.z = z; P.yaw = yaw || 0; P.pitch = pitch || 0; }
const keys = {}; ctx.keys = keys;
addEventListener('keydown', (e) => { keys[e.code] = true; if (e.code === 'KeyE' || e.code === 'Space') interact(); if (/^Digit[0-9]$/.test(e.code)) { const n = +e.code.slice(5); go((n === 0 ? 9 : n - 1) + (e.shiftKey ? 10 : 0)); } if (e.code === 'KeyM') sound.toggle(); if (e.code === 'Escape') closePiece(); });
addEventListener('keyup', (e) => { keys[e.code] = false; });
let locked = false;
const lock = () => { try { const p = cnv.requestPointerLock?.(); p && p.catch && p.catch(() => {}); } catch (e) {} };
const cnv = renderer.domElement;
cnv.addEventListener('click', (e) => {
  if (!started) return;
  if (!MOBILE && !locked && !Q.has('nolock')) { lock(); return; }
  interact(locked ? null : e);
});
document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === cnv; $('#hud').classList.toggle('locked', locked); });
addEventListener('mousemove', (e) => { if (!locked || P.ride) return; const k = P.zoom ? 0.0005 : 0.0022; P.yaw -= e.movementX * k; P.pitch = Math.max(-1.3, Math.min(1.3, P.pitch - e.movementY * k)); });
const stick = { id: null, x: 0, y: 0, dx: 0, dy: 0 }, look = { id: null, x: 0, y: 0, t: 0, moved: 0 };
cnv.addEventListener('touchstart', (e) => { for (const t of e.changedTouches) { if (t.clientX < innerWidth * 0.42 && stick.id === null) { Object.assign(stick, { id: t.identifier, x: t.clientX, y: t.clientY, dx: 0, dy: 0 }); $('#stick').style.cssText = `display:block;left:${t.clientX - 50}px;top:${t.clientY - 50}px`; } else if (look.id === null) Object.assign(look, { id: t.identifier, x: t.clientX, y: t.clientY, t: performance.now(), moved: 0 }); } e.preventDefault(); }, { passive: false });
cnv.addEventListener('touchmove', (e) => { for (const t of e.changedTouches) { if (t.identifier === stick.id) { stick.dx = Math.max(-1, Math.min(1, (t.clientX - stick.x) / 50)); stick.dy = Math.max(-1, Math.min(1, (t.clientY - stick.y) / 50)); $('#knob').style.transform = `translate(${stick.dx * 30}px,${stick.dy * 30}px)`; } if (t.identifier === look.id) { const dx = t.clientX - look.x, dy = t.clientY - look.y; look.moved += Math.abs(dx) + Math.abs(dy); P.yaw -= dx * 0.005; P.pitch = Math.max(-1.2, Math.min(1.2, P.pitch - dy * 0.004)); look.x = t.clientX; look.y = t.clientY; } } e.preventDefault(); }, { passive: false });
cnv.addEventListener('touchend', (e) => { for (const t of e.changedTouches) { if (t.identifier === stick.id) { stick.id = null; stick.dx = stick.dy = 0; $('#stick').style.display = 'none'; $('#knob').style.transform = ''; } if (t.identifier === look.id) { if (look.moved < 12 && performance.now() - look.t < 350) interact({ clientX: t.clientX, clientY: t.clientY }); look.id = null; } } });

function collide(nx, nz) {
  const R = 0.32 * P.scale;
  for (const c of colliders) {
    if (c.off) continue;
    if (c.r !== undefined) { const dx = nx - c.x, dz = nz - c.z, d = Math.hypot(dx, dz), m = c.r + R; if (d < m && d > 1e-6) { nx = c.x + dx / d * m; nz = c.z + dz / d * m; } continue; }
    const ex = c.x2 - c.x1, ez = c.z2 - c.z1, L2 = ex * ex + ez * ez; let t = ((nx - c.x1) * ex + (nz - c.z1) * ez) / L2; t = Math.max(0, Math.min(1, t));
    const px = c.x1 + ex * t, pz = c.z1 + ez * t, dx = nx - px, dz = nz - pz, d = Math.hypot(dx, dz);
    if (d < R && d > 1e-6) { nx = px + dx / d * R; nz = pz + dz / d * R; }
  }
  return [nx, nz];
}
function go(i) { const r = ROOMS[i]; if (!r) return; P.x = r.x0 + W / 2; P.z = D / 2 - 2.2; P.yaw = 0; P.pitch = -0.02; }
window.__go = go;

// ---------- interaction ----------
const ray = new THREE.Raycaster(); ray.far = 14;
function pick(e) {
  const v = e ? new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1) : new THREE.Vector2(0, 0);
  ray.setFromCamera(v, camera);
  const hit = ray.intersectObjects(clickables.filter((o) => o.visible && near(o)), false)[0];
  ctx.lastHit = hit || null;
  return hit && hit.object;
}
const _w = new THREE.Vector3();
const near = (o) => { o.getWorldPosition(_w); return Math.abs(_w.x - P.x) < 16; };
function interact(e) { if ($('#card').classList.contains('on')) return; const o = pick(e); if (o && o.userData.click) { sound.click(); o.userData.click(o); } }

// ---------- binoculars, the long take ----------
// Z (or any pair of binoculars on a set) narrows the lens to 14 degrees behind a binocular mask.
function zoom(on = !P.zoom) { P.zoom = on; $('#binoc').classList.toggle('on', on); ray.far = on ? 90 : 14; if (on) egg('binocs', 'Binoculars. Everybody in this city is watching somebody. Press Z again to put them down.'); }
// a ride: the camera follows a curve for dur seconds, looking a little ahead, with letterbox bars; input waits
function ride(curve, dur, onEnd) { P.ride = { curve, dur, t0: clock.elapsedTime, onEnd }; $('#bars').classList.add('on'); }
addEventListener('keydown', (e) => { if (e.code === 'KeyZ' && started) zoom(); });

// ---------- HUD ----------
let tt; function toast(s, ms = 2800) { const el = $('#toast'); el.textContent = s; el.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('on'), ms); }
const EGGS = new Set(), EGG_N = window.EGG_N || 30;
$('#eggs').textContent = `0 / ${EGG_N}`;
function egg(id, line) {
  if (!EGGS.has(id)) {
    EGGS.add(id); $('#eggs').textContent = `${EGGS.size} / ${EGG_N}`; $('#eggbox').classList.add('pop'); setTimeout(() => $('#eggbox').classList.remove('pop'), 600); sound.ding();
    if (EGGS.size === EGG_N) setTimeout(() => toast('Every scene found. That is a wrap. You have been counted.', 5000), 3000);
  }
  if (line) toast(line, 3600);
}
const bubbles = [];
function say(anchor, text, ms = 3200, dy = 2.1) { const el = document.createElement('div'); el.className = 'bubble'; el.textContent = text; $('#bubbles').appendChild(el); const b = { anchor, el, until: performance.now() + ms, dy }; bubbles.push(b); return b; }
let shakeAmt = 0; function shake(a) { shakeAmt = Math.max(shakeAmt, a); }
function flash(v = 1) { FX.flash = Math.max(FX.flash, v); }

function openPiece(p) {
  const c = $('#card'); c.classList.add('on'); if (locked) document.exitPointerLock();
  $('#c-t').textContent = p.t; $('#c-no').textContent = `No. ${p.n}`;
  $('#c-p').textContent = [[p.h, p.b].filter(Boolean).join(', '), p.s].filter(Boolean).join('  ·  ');
  $('#c-k').textContent = `CAST AS A NEW YORKER · ${(ROOMS[cur]?.film || '').toUpperCase()}`;
  $('#c-a').href = `https://n3wyorkers.com/n/${p.n}`;
  $('#c-img').src = `assets/art/${p.f}`;
}
function closePiece() { $('#card').classList.remove('on'); }
$('#c-x').onclick = closePiece; $('#card').addEventListener('click', (e) => { if (e.target.id === 'card') closePiece(); });

// the piece you face, named at the top of the screen
const fwd = new THREE.Vector3(); let peekP = null;
function peek() {
  camera.getWorldDirection(fwd); let best = null, bs = 1e9;
  for (const a of artMeshes) {
    a.getWorldPosition(_w); const dx = _w.x - P.x, dz = _w.z - P.z, d = Math.hypot(dx, dz); if (d > 4.5) continue;
    const dot = (dx * fwd.x + dz * fwd.z) / (d * Math.hypot(fwd.x, fwd.z) + 1e-6); if (dot < 0.8) continue;
    const s = d * (1.6 - dot); if (s < bs) { bs = s; best = a; }
  }
  if (best === peekP) return; peekP = best;
  if (best) { const p = best.userData.piece; $('#peek').textContent = `${p.t}  ·  No. ${p.n}  ·  ${p.h}`; $('#peek').classList.add('on'); } else $('#peek').classList.remove('on');
}
window.__peekNear = () => peekP;

// ---------- rooms ui ----------
const nav = $('#rooms');
ROOMS.forEach((r, i) => { const b = document.createElement('button'); b.innerHTML = `<i>${(i + 1) % 10}</i><span>${r.name}</span>`; b.onclick = (e) => { e.stopPropagation(); go(i); }; nav.appendChild(b); });
let cur = -1;
function enter(i) {
  cur = i; const r = ROOMS[i]; wake(i);
  [...nav.children].forEach((b, j) => b.classList.toggle('on', j === i));
  $('#rname').textContent = r.name; $('#rk').textContent = r.kicker; $('#rf').textContent = r.film;
  scene.fog.color.set(r.fog || 0x07080d); scene.fog.density = r.fogD || 0.018; scene.background.set(r.sky || 0x05060a);
  hemi.color.set(r.hemi?.[0] ?? 0x8899bb); hemi.groundColor.set(r.hemi?.[1] ?? 0x221a12); hemi.intensity = r.hemi?.[2] ?? 0.4;
  scene.environmentIntensity = r.env ?? 0.35;
  (r.lights || []).forEach((L, k) => { const l = lights[k]; l.position.set(r.x0 + L[0], L[1], L[2]); l.color.set(L[3]); l.userData.i = L[4]; l.distance = L[5] || 26; });
  for (let k = (r.lights || []).length; k < lights.length; k++) lights[k].userData.i = 0;
  sound.room(r.sound);
  r.onEnter && r.onEnter();
}

// ---------- loop ----------
const clock = new THREE.Clock(); let started = false;
function frame() {
  const rdt = Math.min(0.05, clock.getDelta()), t = clock.elapsedTime;
  TIME.scale += (TIME.target - TIME.scale) * Math.min(1, rdt * 6);
  const dt = rdt * TIME.scale; TIME.t += dt;
  let f = 0, s = 0; if (keys.KeyW || keys.ArrowUp) f += 1; if (keys.KeyS || keys.ArrowDown) f -= 1; if (keys.KeyA) s -= 1; if (keys.KeyD) s += 1;
  if (keys.ArrowLeft) P.yaw += dt * 1.8; if (keys.ArrowRight) P.yaw -= dt * 1.8;
  f -= stick.dy; s += stick.dx;
  const sp = (keys.ShiftLeft || keys.ShiftRight ? 6.2 : 3.4) * dt * P.speed, len = Math.hypot(f, s);
  const ri0 = Math.max(0, Math.min(ROOMS.length - 1, Math.floor(P.x / W))), R0 = ROOMS[ri0];
  if (P.ride) {
    const u = Math.min(1, (t - P.ride.t0) / P.ride.dur), e2 = u * u * (3 - 2 * u), c = P.ride.curve, p = c.getPointAt(e2), q = c.getPointAt(Math.min(1, e2 + 0.03));
    P.x = p.x; P.z = p.z; P.lift = p.y - EYE; P.yaw += (Math.atan2(-(q.x - p.x), -(q.z - p.z)) - P.yaw) * Math.min(1, rdt * 3) * (u < 0.97 ? 1 : 0); P.pitch *= 0.95;
    if (u >= 1) { const f3 = P.ride.onEnd; P.ride = null; P.lift = 0; $('#bars').classList.remove('on'); f3 && f3(); }
  } else if (len > 0.01 && started) {
    const k = Math.min(1, len) / len; f *= k; s *= k;
    let nx = P.x + (-Math.sin(P.yaw) * f + Math.cos(P.yaw) * s) * sp, nz = P.z + (-Math.cos(P.yaw) * f - Math.sin(P.yaw) * s) * sp;
    if (R0.move) [nx, nz] = R0.move(P, nx, nz, dt);   // a room may bend the walk (the staircase)
    [P.x, P.z] = collide(nx, nz); P.bob += sp * 2.4;
  }
  const ri = Math.max(0, Math.min(ROOMS.length - 1, Math.floor(P.x / W))); if (ri !== cur) enter(ri);
  const R = ROOMS[ri];
  const gy = R.ground ? R.ground(P.x - R.x0, P.z) : 0;
  P.y += ((gy + EYE * P.scale + P.lift) - P.y) * Math.min(1, dt * (R.ground ? 14 : 4));
  if (!R.holdLift && !P.ride) P.lift += (0 - P.lift) * Math.min(1, rdt * 1.4);
  for (const f2 of tickers) f2(TIME.t, dt, P, ri, rdt);
  // the camera: dolly back along the view for the vertigo, with the field of view the room asks for
  const fovT = P.zoom ? 14 : R.fov ? R.fov(P) : FOV; P.fov += (fovT - P.fov) * Math.min(1, dt * 3);
  if (Math.abs(camera.fov - P.fov) > 0.01 || P.squeeze || P.squeezed) { camera.fov = P.fov; camera.updateProjectionMatrix(); if (P.squeeze) { camera.projectionMatrix.elements[5] *= P.squeeze; camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert(); } P.squeezed = !!P.squeeze; }
  const back = R.fov ? (Math.tan(FOV * Math.PI / 360) / Math.tan(P.fov * Math.PI / 360) - 1) * 3.2 : 0; P.back += (back - P.back) * Math.min(1, dt * 3);
  camera.rotation.set(P.pitch, P.yaw, P.roll || 0); P.roll = (P.roll || 0) * 0.9;
  camera.position.set(P.x + (Math.random() - 0.5) * shakeAmt + Math.sin(P.yaw) * P.back, P.y + Math.sin(P.bob) * 0.035 * P.scale + (Math.random() - 0.5) * shakeAmt, P.z + (Math.random() - 0.5) * shakeAmt + Math.cos(P.yaw) * P.back);
  shakeAmt *= 0.9;
  for (const l of lights) l.intensity += ((l.userData.i || 0) - l.intensity) * Math.min(1, dt * 3);
  for (const r of ROOMS) { const vis = Math.abs(r.i - ri) <= 1; if (r.plateMesh) r.plateMesh.visible = vis; if (r.group) r.group.visible = vis; }
  if ((t * 4 | 0) !== ((t - dt) * 4 | 0)) peek();
  if (locked || MOBILE) { const o = pick(null); $('#cross').classList.toggle('hot', !!o); $('#hint').textContent = o ? (o.userData.hint || '') : ''; }
  const now = performance.now();
  for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; if (now > b.until) { b.el.remove(); bubbles.splice(i, 1); continue; } b.anchor.getWorldPosition(_w); _w.y += b.dy; _w.project(camera); const on = _w.z < 1 && Math.abs(_w.x) < 1.1; b.el.style.display = on ? 'block' : 'none'; b.el.style.transform = `translate(${(_w.x * 0.5 + 0.5) * innerWidth}px,${(-_w.y * 0.5 + 0.5) * innerHeight}px) translate(-50%,-100%)`; }
  // the screen pass eases to the room's look
  const pp = R.post || {}, e = Math.min(1, dt * 2);
  POST.sat += ((FX.sat ?? pp.sat ?? 1) - POST.sat) * e; POST.heat += ((pp.heat || 0) - POST.heat) * e; POST.grain += ((pp.grain || 0) - POST.grain) * e;
  POST.warp += (FX.warp - POST.warp) * e; FX.flash *= 0.86;
  const U = postMat.uniforms; U.uSat.value = POST.sat; U.uHeat.value = POST.heat; U.uWarp.value = POST.warp; U.uGrain.value = POST.grain; U.uTime.value = t; U.uFlash.value = 0;
  $('#flash').style.opacity = FX.flash > 0.02 ? FX.flash.toFixed(2) : 0;
  // the pass only runs when a room asks for it: going through the target would tone map the plates twice over
  const usePost = POST.heat > 0.005 || POST.warp > 0.005 || Math.abs(POST.sat - 1) > 0.01 || POST.grain > 0.01;
  if (usePost) { renderer.setRenderTarget(rt); renderer.render(scene, camera); renderer.setRenderTarget(null); renderer.render(postScene, postCam); }
  else renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// ---------- start ----------
const sound = new Sound(); ctx.sound = sound;
mgr.onLoad = () => { $('#go').disabled = false; $('#go').textContent = 'Take your seat'; };
setTimeout(() => { $('#go').disabled = false; $('#go').textContent = 'Take your seat'; }, 15000);
$('#go').onclick = () => { started = true; $('#intro').classList.add('off'); sound.start(); if (!MOBILE && !Q.has('nolock')) lock(); toast(MOBILE ? 'Left thumb walks. Right thumb looks. Tap anything.' : 'WASD to walk. Shift to hurry. Click anything. 1 to 0 jumps sets.', 4200); };
if (Q.has('auto')) { started = true; $('#intro').classList.add('off'); }
$('#snd').onclick = (e) => { e.stopPropagation(); sound.toggle(); $('#snd').textContent = sound.on ? 'SOUND ON' : 'SOUND OFF'; };
window.__P = P; window.__scene = scene; window.__ready = () => loading.done >= loading.total; window.__ROOMS = ROOMS;
window.__finale = () => $('#finale').classList.add('on');
enter(Math.max(0, Math.min(ROOMS.length - 1, Math.floor(P.x / W))));
requestAnimationFrame(frame);
