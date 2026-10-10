// THE MARKS: one night in the city, walkable.
// Seven rooms in a row. Each opens onto a photo plate rebuilt as geometry from its depth map
// (the MONA pass: the image supplies light and lens, the depth supplies the space).
// Hero objects are Tripo GLBs. The 159 Marks hang on the walls and wake up as you get close.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { ROOMS, W, D, H_IN, PORTAL } from './rooms.js';
import { Sound } from './sound.js';

const $ = (s) => document.querySelector(s);
// canvas signs are drawn once at build time, so the house fonts must be in before the rooms are made
await Promise.race([Promise.all(['900 40px Fraunces', '700 40px "Space Grotesk"', '600 40px "IBM Plex Mono"'].map((f) => document.fonts.load(f))), new Promise((r) => setTimeout(r, 2500))]).catch(() => {});
const Q = new URLSearchParams(location.search);
const MOBILE = matchMedia('(pointer:coarse)').matches;
const DATA = window.MARKS;

// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: !MOBILE, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = +(Q.get('ex') || 0.85);
renderer.outputColorSpace = THREE.SRGBColorSpace;
$('#stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05060a);
scene.fog = new THREE.FogExp2(0x07080d, 0.018);
const camera = new THREE.PerspectiveCamera(MOBILE ? 72 : 66, innerWidth / innerHeight, 0.05, 400);
camera.rotation.order = 'YXZ';
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

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
// box with world scale UVs so a surface texture tiles at the same size everywhere
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
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: !bg, toneMapped: false, fog: false }));
  return m;
}

// ---------- world helpers ----------
const colliders = [];   // {x1,z1,x2,z2} wall segments, {x,z,r} circles
const clickables = [];  // meshes with userData.click
const tickers = [];     // fn(t, dt)
const wall = (x1, z1, x2, z2) => colliders.push({ x1, z1, x2, z2 });
const post = (x, z, r) => colliders.push({ x, z, r });
const tick = (f) => tickers.push(f);
const clickable = (obj, fn, hint) => { obj.traverse((o) => { if (o.isMesh) { o.userData.click = fn; o.userData.hint = hint; clickables.push(o); } }); };

const GLB = {};
// Tripo hands models back facing any which way; these turn each one so its front is three.js +Z.
// Read off front and top renders (_build/front_sheet.py into work/sheet).
const YAW = { cat: -Math.PI / 2, dispenser: -Math.PI / 2, hydrant: Math.PI, monte: Math.PI, newsstand: -Math.PI / 2, pigeon: Math.PI, rat: -Math.PI / 2, seal: -Math.PI / 2, taker: -Math.PI / 2 };
function glb(name, { h, len, x = 0, y = 0, z = 0, ry = 0, parent = scene, onload } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  (GLB[name] ||= new Promise((res, rej) => gltf.load(`assets/glb/${name}.glb`, (r) => res(r.scene), undefined, rej))).then((src) => {
    const o = src.clone(true), pv = new THREE.Group(); pv.add(o); pv.rotation.y = YAW[name] || 0; pv.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(pv), s = new THREE.Vector3(); b.getSize(s);
    const k = h ? h / s.y : len ? len / Math.max(s.x, s.z) : 1;
    const c = new THREE.Vector3(); b.getCenter(c);
    const sc = new THREE.Group(); sc.add(pv); sc.scale.setScalar(k); sc.position.set(-c.x * k, -b.min.y * k, -c.z * k);
    o.traverse((m) => { if (m.isMesh && m.material) m.material.envMapIntensity = 1.2; });
    g.add(sc); onload && onload(g, sc);
  }).catch(() => { const ph = slab(0.5, h || 1, 0.5, new THREE.MeshStandardMaterial({ color: 0x333333 }), 0, (h || 1) / 2, 0); g.add(ph); });
  return g;
}

// ---------- the photo plates, rebuilt as space ----------
// S is the plate's camera: eye height, 6 m in front of the portal, looking north (-z).
// 1/z = a*d + b with d the relative inverse depth from Depth Anything; calibrated on the
// bottom row (ground at eye height below the camera) and a far distance per room.
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
      if (Math.max(...zs) / Math.min(...zs) > (room.tear || 2.6)) continue;  // drop the rubber sheet across depth breaks
      idx.push(p, q, p + 1, p + 1, q, q + 1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2)); geo.setIndex(idx);
    const map = tex.load(`assets/plates/${room.plate}.jpg`); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
    const fade = canvasTex(256, 128, (q, w, h) => {   // soft edges so the plate dissolves into the night at its borders
      const gx = q.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, '#000'); gx.addColorStop(0.035, '#fff'); gx.addColorStop(0.965, '#fff'); gx.addColorStop(1, '#000');
      q.fillStyle = gx; q.fillRect(0, 0, w, h); q.globalCompositeOperation = 'multiply';
      const gy = q.createLinearGradient(0, 0, 0, h); gy.addColorStop(0, '#000'); gy.addColorStop(0.06, '#fff'); gy.addColorStop(1, '#fff'); q.fillStyle = gy; q.fillRect(0, 0, w, h);
    });
    const mat = new THREE.MeshBasicMaterial({ map, alphaMap: fade, transparent: true, fog: false, toneMapped: false, side: THREE.DoubleSide, color: new THREE.Color(room.plateTint || 0xffffff) });
    const mesh = new THREE.Mesh(geo, mat); mesh.renderOrder = -1; g.add(mesh);
    g.position.set(room.x0 + W / 2, 0, -D / 2 + PORTAL.dist);
    room.plateMesh = mesh;
    loading.done++;
  };
  return g;
}

// ---------- rooms ----------
const ART_GEO = new THREE.PlaneGeometry(1, 9 / 16);
const FRAMES = {
  black: { c: 0x111111, m: 0.2, r: 0.5, d: 0.06, b: 0.06 },
  gilt: { c: 0xb8902e, m: 1, r: 0.32, d: 0.1, b: 0.12 },
  steel: { c: 0x8c9196, m: 1, r: 0.38, d: 0.05, b: 0.04 },
  oak: { c: 0x6b4423, m: 0, r: 0.6, d: 0.06, b: 0.07 },
  paste: null, line: null,
};
const marksMeshes = [];
function hang(m, x, y, z, ry, w, style, parent = scene) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  const f = FRAMES[style];
  if (f) {
    const fm = new THREE.MeshStandardMaterial({ color: f.c, metalness: f.m, roughness: f.r });
    const fr = new THREE.Mesh(new THREE.BoxGeometry(w + f.b * 2, w * 9 / 16 + f.b * 2, f.d), fm); fr.position.z = f.d / 2; g.add(fr);
  }
  const t = tex.load(`assets/art/th/${m.c}.jpg`); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const mat = new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.55, roughness: style === 'paste' ? 0.95 : 0.4, side: style === 'line' ? THREE.DoubleSide : THREE.FrontSide });
  const art = new THREE.Mesh(ART_GEO, mat); art.scale.set(w, w, 1); art.position.z = (f ? f.d : 0.005) + 0.002;
  if (style === 'paste') { art.rotation.z = (Math.random() - 0.5) * 0.04; }
  g.add(art);
  if (style !== 'line') {
    const pl = sign(`${m.t}\n${m.c ? 'No. ' + m.c : ''}`, { w: Math.min(0.9, w * 0.7), h: 0.16, bg: '#f2ead8', fg: '#1b1b1b', font: MONO, weight: 600, px: 96 });
    pl.position.set(0, -w * 9 / 32 - 0.2, 0.03); g.add(pl);
  }
  art.userData.mark = m; art.userData.base = t; m.mesh = art; m.group = g;
  clickable(art, () => openMark(m), m.t);
  marksMeshes.push(art);
  return g;
}

const lights = [];
for (let i = 0; i < 4; i++) { const l = new THREE.PointLight(0xffffff, 0, 26, 1.6); scene.add(l); lights.push(l); }
const hemi = new THREE.HemisphereLight(0x8899bb, 0x221a12, 0.4); scene.add(hemi);

import { buildRoom } from './build.js';
const ctx = { THREE, scene, surf, slab, sign, canvasTex, glb, wall, post, tick, clickable, hang, plate, tex, egg, toast, say, sound: null, MOBILE, camera, openMark, shake, FONT, SERIF, MONO };
ROOMS.forEach((r, i) => { r.i = i; r.x0 = i * W; r.prev = ROOMS[i - 1]?.name; r.next = ROOMS[i + 1]?.name; r.last = i === ROOMS.length - 1; });
window.__clickables = clickables;
// deal the uncounted to rooms in census order, closers to the theater
let ui = 0; const U = DATA.u.slice().sort((a, b) => a.c - b.c);
ROOMS.forEach((r) => { r.marks = r.closers ? DATA.c : U.slice(ui, ui += r.count); });
ROOMS.forEach((r) => buildRoom(ctx, r));

// ---------- player ----------
const P = { x: ROOMS[0].x0 + W / 2, z: D / 2 - 2.2, yaw: 0, pitch: -0.02, vy: 0, y: 1.62, bob: 0 };
if (Q.get('room')) { const r = ROOMS.find((q) => q.id === Q.get('room')); if (r) P.x = r.x0 + W / 2; }
if (Q.get('cam')) { const [x, z, yaw, pitch] = Q.get('cam').split(',').map(Number); P.x = x; P.z = z; P.yaw = yaw || 0; P.pitch = pitch || 0; }
const keys = {};
addEventListener('keydown', (e) => { keys[e.code] = true; if (e.code === 'KeyE' || e.code === 'Space') interact(); if (/^Digit[1-7]$/.test(e.code)) go(+e.code.slice(5) - 1); if (e.code === 'KeyM') sound.toggle(); if (e.code === 'Escape') closeMark(); });
addEventListener('keyup', (e) => { keys[e.code] = false; });
let locked = false;
// pointer lock can be refused (inside an iframe, or before a gesture); walking still works with the mouse unlocked
const lock = () => { try { const p = cnv.requestPointerLock?.(); p && p.catch && p.catch(() => {}); } catch (e) {} };
const cnv = renderer.domElement;
cnv.addEventListener('click', (e) => {
  if (!started) return;
  if (!MOBILE && !locked && !Q.has('nolock')) { lock(); return; }
  interact(locked ? null : e);
});
document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === cnv; $('#hud').classList.toggle('locked', locked); });
addEventListener('mousemove', (e) => { if (!locked) return; P.yaw -= e.movementX * 0.0022; P.pitch = Math.max(-1.3, Math.min(1.3, P.pitch - e.movementY * 0.0022)); });
// touch: left half is a stick, right half looks, a short tap interacts
const stick = { id: null, x: 0, y: 0, dx: 0, dy: 0 }, look = { id: null, x: 0, y: 0, t: 0, moved: 0 };
cnv.addEventListener('touchstart', (e) => { for (const t of e.changedTouches) { if (t.clientX < innerWidth * 0.42 && stick.id === null) { Object.assign(stick, { id: t.identifier, x: t.clientX, y: t.clientY, dx: 0, dy: 0 }); $('#stick').style.cssText = `display:block;left:${t.clientX - 50}px;top:${t.clientY - 50}px`; } else if (look.id === null) Object.assign(look, { id: t.identifier, x: t.clientX, y: t.clientY, t: performance.now(), moved: 0 }); } e.preventDefault(); }, { passive: false });
cnv.addEventListener('touchmove', (e) => { for (const t of e.changedTouches) { if (t.identifier === stick.id) { stick.dx = Math.max(-1, Math.min(1, (t.clientX - stick.x) / 50)); stick.dy = Math.max(-1, Math.min(1, (t.clientY - stick.y) / 50)); $('#knob').style.transform = `translate(${stick.dx * 30}px,${stick.dy * 30}px)`; } if (t.identifier === look.id) { const dx = t.clientX - look.x, dy = t.clientY - look.y; look.moved += Math.abs(dx) + Math.abs(dy); P.yaw -= dx * 0.005; P.pitch = Math.max(-1.2, Math.min(1.2, P.pitch - dy * 0.004)); look.x = t.clientX; look.y = t.clientY; } } e.preventDefault(); }, { passive: false });
cnv.addEventListener('touchend', (e) => { for (const t of e.changedTouches) { if (t.identifier === stick.id) { stick.id = null; stick.dx = stick.dy = 0; $('#stick').style.display = 'none'; $('#knob').style.transform = ''; } if (t.identifier === look.id) { if (look.moved < 12 && performance.now() - look.t < 350) interact({ clientX: t.clientX, clientY: t.clientY }); look.id = null; } } });

function collide(nx, nz) {
  const R = 0.32;
  for (const c of colliders) {
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
const ray = new THREE.Raycaster(); ray.far = 9;
function pick(e) {
  const v = e ? new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1) : new THREE.Vector2(0, 0);
  ray.setFromCamera(v, camera);
  const hit = ray.intersectObjects(clickables.filter((o) => o.visible && near(o)), false)[0];
  return hit && hit.object;
}
const _w = new THREE.Vector3();
const near = (o) => { o.getWorldPosition(_w); return Math.abs(_w.x - P.x) < 14; };
function interact(e) { if ($('#card').classList.contains('on')) return; const o = pick(e); if (o && o.userData.click) { sound.click(); o.userData.click(o); } }

// ---------- HUD ----------
let tt; function toast(s, ms = 2600) { const el = $('#toast'); el.textContent = s; el.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('on'), ms); }
const EGGS = new Set(), EGG_N = 15;
function egg(id, line) { if (!EGGS.has(id)) { EGGS.add(id); $('#eggs').textContent = `${EGGS.size} / ${EGG_N}`; $('#eggbox').classList.add('pop'); setTimeout(() => $('#eggbox').classList.remove('pop'), 600); sound.ding(); if (EGGS.size === EGG_N) setTimeout(() => toast('You found all twelve. You have been counted. Twice.', 5000), 2800); } if (line) toast(line); }
// speech bubbles that follow a 3D anchor
const bubbles = [];
function say(anchor, text, ms = 3200, dy = 2.1) { const el = document.createElement('div'); el.className = 'bubble'; el.textContent = text; $('#bubbles').appendChild(el); const b = { anchor, el, until: performance.now() + ms, dy }; bubbles.push(b); return b; }
let shakeAmt = 0; function shake(a) { shakeAmt = Math.max(shakeAmt, a); }

// the card: a Mark up close, its loop playing
let cardVid = null;
function openMark(m) {
  const c = $('#card'); c.classList.add('on'); if (locked) document.exitPointerLock();
  $('#c-t').textContent = m.t; $('#c-no').textContent = `No. ${m.c}`;
  $('#c-p').textContent = [[m.h, m.b].filter(Boolean).join(', '), m.e && `Era ${m.e}`].filter(Boolean).join('  ·  ');
  $('#c-k').textContent = m.closer ? 'ERA CLOSER · sold by auction' : `MARK ${String(m.n).padStart(3, '0')} OF THE UNCOUNTED`;
  $('#c-a').href = `https://n3wyorkers.com/n/${m.c}`;
  const img = $('#c-img'), v = $('#c-vid'); img.src = `assets/art/th/${m.c}.jpg`;
  if (m.lp) { v.src = `assets/loops/${m.c}.mp4`; v.hidden = false; v.play().catch(() => {}); cardVid = v; } else { v.hidden = true; v.removeAttribute('src'); }
}
function closeMark() { $('#card').classList.remove('on'); if (cardVid) { cardVid.pause(); cardVid = null; } }
$('#c-x').onclick = closeMark; $('#card').addEventListener('click', (e) => { if (e.target.id === 'card') closeMark(); });

// the nearest Mark you are facing wakes up: its loop plays on the wall
const live = { m: null, v: document.createElement('video'), t: null };
live.v.muted = true; live.v.loop = true; live.v.playsInline = true; live.v.crossOrigin = 'anonymous';
live.t = new THREE.VideoTexture(live.v); live.t.colorSpace = THREE.SRGBColorSpace;
const fwd = new THREE.Vector3();
function wake() {
  camera.getWorldDirection(fwd); let best = null, bs = 1e9;
  for (const a of marksMeshes) {
    const m = a.userData.mark; if (!m.lp) continue;
    a.getWorldPosition(_w); const dx = _w.x - P.x, dz = _w.z - P.z, d = Math.hypot(dx, dz); if (d > 4.2) continue;
    const dot = (dx * fwd.x + dz * fwd.z) / (d * Math.hypot(fwd.x, fwd.z) + 1e-6); if (dot < 0.75) continue;
    const s = d * (1.6 - dot); if (s < bs) { bs = s; best = a; }
  }
  if (best === live.m) return;
  if (live.m) { const mt = live.m.material; mt.map = mt.emissiveMap = live.m.userData.base; mt.needsUpdate = true; }
  live.m = best;
  if (best) { live.v.src = `assets/loops/${best.userData.mark.c}.mp4`; live.v.play().then(() => { if (live.m === best) { const mt = best.material; mt.map = mt.emissiveMap = live.t; mt.needsUpdate = true; } }).catch(() => {}); $('#peek').textContent = `${best.userData.mark.t}  ·  No. ${best.userData.mark.c}`; $('#peek').classList.add('on'); }
  else { live.v.pause(); $('#peek').classList.remove('on'); }
}

// ---------- rooms ui ----------
const nav = $('#rooms');
ROOMS.forEach((r, i) => { const b = document.createElement('button'); b.innerHTML = `<i>${i + 1}</i><span>${r.name}</span>`; b.onclick = (e) => { e.stopPropagation(); go(i); }; nav.appendChild(b); });
let cur = -1;
function enter(i) {
  cur = i; const r = ROOMS[i];
  [...nav.children].forEach((b, j) => b.classList.toggle('on', j === i));
  $('#rname').textContent = r.name; $('#rk').textContent = r.kicker;
  scene.fog.color.set(r.fog || 0x07080d); scene.fog.density = r.fogD || 0.018; scene.background.set(r.sky || 0x05060a);
  hemi.color.set(r.hemi?.[0] ?? 0x8899bb); hemi.groundColor.set(r.hemi?.[1] ?? 0x221a12); hemi.intensity = r.hemi?.[2] ?? 0.4;
  scene.environmentIntensity = r.env ?? 0.35;
  (r.lights || []).forEach((L, k) => { const l = lights[k]; l.position.set(r.x0 + L[0], L[1], L[2]); l.color.set(L[3]); l.userData.i = L[4]; l.distance = L[5] || 26; });
  for (let k = (r.lights || []).length; k < lights.length; k++) lights[k].userData.i = 0;
  sound.room(r.sound);
  r.onEnter && r.onEnter();
}

// ---------- loop ----------
const clock = new THREE.Clock(); let started = false, t0 = 0;
function frame() {
  const dt = Math.min(0.05, clock.getDelta()), t = clock.elapsedTime;
  // move
  let f = 0, s = 0; if (keys.KeyW || keys.ArrowUp) f += 1; if (keys.KeyS || keys.ArrowDown) f -= 1; if (keys.KeyA) s -= 1; if (keys.KeyD) s += 1;
  if (keys.ArrowLeft) P.yaw += dt * 1.8; if (keys.ArrowRight) P.yaw -= dt * 1.8;
  f -= stick.dy; s += stick.dx;
  const sp = (keys.ShiftLeft || keys.ShiftRight ? 6.2 : 3.4) * dt, len = Math.hypot(f, s);
  if (len > 0.01 && started) {
    const k = Math.min(1, len) / len; f *= k; s *= k;
    const nx = P.x + (-Math.sin(P.yaw) * f + Math.cos(P.yaw) * s) * sp, nz = P.z + (-Math.cos(P.yaw) * f - Math.sin(P.yaw) * s) * sp;
    [P.x, P.z] = collide(nx, nz); P.bob += sp * 2.4;
  }
  const ri = Math.max(0, Math.min(ROOMS.length - 1, Math.floor(P.x / W))); if (ri !== cur) enter(ri);
  camera.position.set(P.x + (Math.random() - 0.5) * shakeAmt, P.y + Math.sin(P.bob) * 0.035 + (Math.random() - 0.5) * shakeAmt, P.z);
  camera.rotation.set(P.pitch, P.yaw, 0); shakeAmt *= 0.9;
  // lights ease to the room
  for (const l of lights) l.intensity += ((l.userData.i || 0) - l.intensity) * Math.min(1, dt * 3);
  // plates and rooms near you only
  for (const r of ROOMS) { const vis = Math.abs(r.i - ri) <= 1; if (r.plateMesh) r.plateMesh.visible = vis; if (r.group) r.group.visible = Math.abs(r.i - ri) <= 1; }
  for (const f2 of tickers) f2(t, dt, P, ri);
  if ((t * 4 | 0) !== ((t - dt) * 4 | 0)) wake();
  // hover hint
  if (locked || MOBILE) { const o = pick(null); $('#cross').classList.toggle('hot', !!o); $('#hint').textContent = o ? (o.userData.hint || '') : ''; }
  // bubbles
  const now = performance.now();
  for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; if (now > b.until) { b.el.remove(); bubbles.splice(i, 1); continue; } b.anchor.getWorldPosition(_w); _w.y += b.dy; _w.project(camera); const on = _w.z < 1 && Math.abs(_w.x) < 1.1; b.el.style.display = on ? 'block' : 'none'; b.el.style.transform = `translate(${(_w.x * 0.5 + 0.5) * innerWidth}px,${(-_w.y * 0.5 + 0.5) * innerHeight}px) translate(-50%,-100%)`; }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// ---------- start ----------
const sound = new Sound(); ctx.sound = sound;
mgr.onLoad = () => { $('#go').disabled = false; $('#go').textContent = 'Walk in'; };
setTimeout(() => { $('#go').disabled = false; $('#go').textContent = 'Walk in'; }, 15000);
$('#go').onclick = () => { started = true; $('#intro').classList.add('off'); sound.start(); if (!MOBILE && !Q.has('nolock')) lock(); toast(MOBILE ? 'Left thumb walks. Right thumb looks. Tap anything.' : 'WASD to walk. Shift to hurry. Click anything. 1 to 7 jumps rooms.', 4200); };
if (Q.has('auto')) { started = true; $('#intro').classList.add('off'); }
$('#snd').onclick = (e) => { e.stopPropagation(); sound.toggle(); $('#snd').textContent = sound.on ? 'SOUND ON' : 'SOUND OFF'; };
window.__P = P; window.__scene = scene; window.__ready = () => loading.done >= loading.total;
enter(Math.max(0, Math.floor(P.x / W)));
requestAnimationFrame(frame);
