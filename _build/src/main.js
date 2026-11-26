// THE GARDEN · a walkable gallery by MLow with NEW YORKERS.
// The round arena on Seventh Avenue over Penn Station, at real size: the concourse hang, the pieces, the bowl, the floor that flips.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { STREET, DRUM_IN, BACK, LIFTS, BRIDGE, ENTRY, surfaces, zoneOf, sd, stadiumPoint, UP } from './layout.js';
import { buildBowl } from './bowl.js';
import { buildFlipFloor, drawCourt, drawIce, drawStage, drawRing, drawCircus } from './floor.js';
import { buildWorld, buildModeSets, put } from './world.js';
import * as S from './sound.js';

const $ = (s) => document.querySelector(s);
const Q = new URLSearchParams(location.search);
const PHONE = matchMedia('(pointer:coarse)').matches;
const renderer = new THREE.WebGLRenderer({ antialias: !PHONE, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, PHONE ? 1.25 : 1.5)); renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.outputColorSpace = THREE.SRGBColorSpace;
$('#stage').appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x05060f); scene.fog = new THREE.Fog(0x05060f, 260, 900);
const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.08, 2000); camera.rotation.order = 'YXZ';
const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 0.45, 0.45, 0.93); composer.addPass(bloom); composer.addPass(new OutputPass());
const resize = () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); };
addEventListener('resize', resize);

// ---------- loading
let loaded = 0, toLoad = 1; const bump = () => { loaded++; $('#lp').style.width = Math.min(100, loaded / toLoad * 100) + '%'; };
const TL = new THREE.TextureLoader();
const tx = (url, rep = 1, srgb = true) => { toLoad++; const t = TL.load(url, bump, undefined, bump); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const FF = new Set(window.FF || []);
const ff = (n, fallback) => FF.has(n) ? (() => { const t = tx(`assets/ff/${n}.webp`); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 1); return t; })() : fallback;
const cvTex = (c, rep = 1) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 8; return t; };
const mkCanvas = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); return c; };
const loadImg = (src) => new Promise((res) => { if (!src) return res(null); const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });

function flowerCanvas() { // the eye flower head: eight petals, a blue iris, a black pupil, transparent round it
  return mkCanvas(128, 128, (x) => { x.translate(64, 64);
    for (let i = 0; i < 8; i++) { x.save(); x.rotate(i * Math.PI / 4); x.fillStyle = i % 2 ? '#ffffff' : '#eef2f8'; x.beginPath(); x.ellipse(0, -36, 15, 26, 0, 0, 7); x.fill(); x.strokeStyle = 'rgba(41,98,255,.35)'; x.lineWidth = 2; x.stroke(); x.restore(); }
    x.fillStyle = '#f8fbff'; x.beginPath(); x.arc(0, 0, 24, 0, 7); x.fill(); x.fillStyle = '#2962ff'; x.beginPath(); x.arc(0, 0, 15, 0, 7); x.fill(); x.fillStyle = '#05060f'; x.beginPath(); x.arc(0, 0, 7, 0, 7); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(-4, -5, 3, 0, 7); x.fill(); });
}
function windowsCanvas(lit = 0.55, tint = '#ffe9c2') {
  return mkCanvas(256, 256, (x, w, h) => { x.fillStyle = '#0a0c16'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const on = Math.random() < lit; x.fillStyle = on ? (Math.random() < 0.2 ? '#cfe0ff' : tint) : '#141a2c'; x.globalAlpha = on ? 0.55 + Math.random() * 0.45 : 1; x.fillRect(i * 32 + 6, j * 32 + 5, 20, 22); } x.globalAlpha = 1; });
}
function wordCanvas(w, h, draw) { return mkCanvas(w, h, draw); }

// ---------- state
const U = {}; const eggs = new Set(); const EGG_N = window.EGG_N || 0; $('#eggt').textContent = EGG_N; $('#st-egg').textContent = EGG_N;
const player = { pos: new THREE.Vector3(160, STREET, 74), vy: 0, yaw: 1.12, pitch: 0.2, riding: null };
let mode = 'court', flipping = null, started = false, houseDown = false;
const clickables = [];

function toast(t, k = '') { const el = $('#toast'); el.innerHTML = (k ? `<b>${k}</b>` : '') + t; el.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => el.classList.remove('on'), 5200); }
function egg(id, title, line) { if (eggs.has(id)) return; eggs.add(id); $('#eggn').textContent = eggs.size; const b = $('#eggbox'); b.classList.add('pop'); setTimeout(() => b.classList.remove('pop'), 300); toast(line, 'EGG · ' + title); try { localStorage.setItem('garden-eggs', JSON.stringify([...eggs])); } catch (e) {} }

// ---------- build
async function build() {
  await Promise.all(['72px "N3W Skyline"', '40px Anton', '20px Archivo', '14px "JetBrains Mono"'].map((f) => document.fonts.load(f).catch(() => {})));
  const tex = {};
  tex.concrete = tx('assets/tex/concrete_c.jpg', 6); tex.concreteN = tx('assets/tex/concrete_n.jpg', 6, false); tex.concreteR = tx('assets/tex/concrete_r.jpg', 6, false);
  tex.concrete2 = tx('assets/tex/concrete_c.jpg', 1); tex.terrazzo = tx('assets/tex/terrazzo_c.jpg', 1); tex.pavers = tx('assets/tex/pavers_c.jpg', 1); tex.asphalt = tx('assets/tex/asphalt_c.jpg', 1); tex.asphalt.repeat.set(6, 90);
  tex.steelC = tx('assets/tex/steel_c.jpg', 1); tex.steelC.repeat.set(20, 2);
  const fallbackBand = cvTex(mkCanvas(512, 128, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#0d1a5a'); g.addColorStop(0.5, '#2962ff'); g.addColorStop(1, '#0d1a5a'); x.fillStyle = g; x.fillRect(0, 0, w, h); }));
  tex.murals = ['concourse_1', 'concourse_2', 'concourse_3', 'concourse_4'].map((n) => ff(n, fallbackBand));
  tex.fascia = ff('fascia', fallbackBand); tex.drum = ff('drum', tex.concrete2); tex.drum.repeat.set(1, 1);
  tex.stageLed = ff('stage_led', fallbackBand); tex.ringCanvas = ff('ring_canvas', fallbackBand);
  tex.banners = ['banner_1', 'banner_2', 'banner_3', 'banner_4'].filter((n) => FF.has(n)).map((n) => ff(n));
  tex.flower = cvTex(flowerCanvas()); tex.flower.wrapS = tex.flower.wrapT = THREE.ClampToEdgeWrapping;
  tex.windows = cvTex(windowsCanvas(0.26, '#dfe9ff'), 1); tex.windows.repeat.set(4, 30);
  tex.windowsCity = cvTex(windowsCanvas(0.3), 1);
  tex.steps = cvTex(mkCanvas(64, 64, (x) => { x.fillStyle = '#c8cedc'; x.fillRect(0, 0, 64, 64); x.fillStyle = '#5a6074'; for (let i = 0; i < 64; i += 4) x.fillRect(0, i, 64, 2); }), 1); tex.steps.repeat.set(40, 2);
  tex.canopy = cvTex(wordCanvas(2048, 164, (x, w, h) => { x.fillStyle = '#eef2f8'; x.font = '118px "N3W Skyline", Anton'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = '#2962ff'; x.shadowBlur = 24; x.fillText('THE GARDEN', w / 2, h / 2 + 6); x.font = '34px "JetBrains Mono"'; x.fillStyle = '#22d3ee'; x.shadowBlur = 0; x.fillText('N3W YORKERS', 190, h / 2 + 4); x.fillText('BY MLOW', w - 160, h / 2 + 4); }));
  tex.canopy.wrapS = THREE.ClampToEdgeWrapping; tex.canopy.repeat.set(1, 1);
  tex.penn = cvTex(mkCanvas(128, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffe2b0'); g.addColorStop(1, '#2a2010'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(0,0,0,.35)'; for (let i = 0; i < h; i += 14) x.fillRect(0, i, w, 4); }));
  tex.pennSign = cvTex(wordCanvas(512, 144, (x, w, h) => { x.fillStyle = '#0d0d0d'; x.fillRect(0, 0, w, h); x.fillStyle = '#eef2f8'; x.font = '64px Archivo'; x.textBaseline = 'middle'; x.fillText('Penn Station', 104, h / 2); [['#ee352e', 40], ['#0039a6', 104]].forEach(([c, y]) => { x.fillStyle = c; x.beginPath(); x.arc(44, y, 26, 0, 7); x.fill(); }); x.fillStyle = '#fff'; x.font = 'bold 32px Archivo'; x.textAlign = 'center'; x.fillText('1', 44, 41); x.fillText('A', 44, 105); }));
  tex.ball = cvTex(mkCanvas(128, 64, (x, w, h) => { x.fillStyle = '#d4602c'; x.fillRect(0, 0, w, h); x.strokeStyle = '#1a0e08'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, h / 2); x.lineTo(w, h / 2); x.moveTo(w / 4, 0); x.lineTo(w / 4, h); x.moveTo(w * 3 / 4, 0); x.lineTo(w * 3 / 4, h); x.stroke(); }));
  tex.boards = cvTex(mkCanvas(1024, 64, (x, w, h) => { x.fillStyle = '#f4f6fa'; x.fillRect(0, 0, w, h); x.fillStyle = '#2962ff'; x.fillRect(0, h - 10, w, 10); x.font = '34px "N3W Skyline", Anton'; x.textBaseline = 'middle'; ['N3W YORKERS', 'THE GARDEN', 'BY MLOW', 'OPEN EYE'].forEach((t, i) => { x.fillStyle = i % 2 ? '#ff4fa3' : '#0d0d0d'; x.fillText(t, 20 + i * 256, 28); }); }), 1); tex.boards.repeat.set(24, 1);
  tex.skirt = cvTex(mkCanvas(512, 128, (x, w, h) => { x.fillStyle = '#2962ff'; x.fillRect(0, 0, w, h); x.fillStyle = '#eef2f8'; x.font = '70px "N3W Skyline", Anton'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('N3W YORKERS', w / 2, h / 2 + 4); }));
  const penn = ff('penn_wall', null); if (penn) tex.pennWall = penn;
  // the floors, drawn on canvases with the Firefly centre art
  const [cc, ic, cr] = await Promise.all(['court_center', 'ice_center', 'circus_ring'].map((n) => loadImg(FF.has(n) ? `assets/ff/${n}.webp` : null)));
  U.floors = { court: cvTex(drawCourt(cc)), ice: cvTex(drawIce(ic)), stage: cvTex(drawStage()), ring: cvTex(drawRing()), circus: cvTex(drawCircus(cr)) };
  for (const k in U.floors) { U.floors[k].wrapS = U.floors[k].wrapT = THREE.ClampToEdgeWrapping; U.floors[k].repeat.set(1, 1); }
  U.rough = { court: 0.28, ice: 0.12, stage: 0.55, ring: 0.8, circus: 0.95 };
  // the environment: the night sky over Midtown for reflections
  { const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); scene.environmentIntensity = 0.45; }
  // lights: one hemisphere, a house light, a cone from the scoreboard, a moon outside
  U.hemi = new THREE.HemisphereLight(0xb8c8ff, 0x141626, 0.9); scene.add(U.hemi);
  U.house = new THREE.DirectionalLight(0xfff4e6, 0.9); U.house.position.set(10, 40, 6); scene.add(U.house);
  U.spot = new THREE.SpotLight(0xfff6ea, 1100, 0, 0.62, 0.6, 2); U.spot.position.set(0, 30, 0); U.spot.target.position.set(0, 0, 0); scene.add(U.spot, U.spot.target);
  for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * Math.PI * 2, l = new THREE.PointLight(0xffe6c8, 40, 30, 1.6); l.position.set(Math.cos(a) * 57, 6.2, Math.sin(a) * 57); scene.add(l); }
  U.moon = new THREE.DirectionalLight(0x8fa6ff, 0.35); U.moon.position.set(200, 120, -80); scene.add(U.moon);
  // sky: a dome with a band of city glow and a few stars
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1400, 32, 16), new THREE.MeshBasicMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, map: cvTex(mkCanvas(2048, 1024, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#02030a'); g.addColorStop(0.4, '#0a1030'); g.addColorStop(0.49, '#2a2350'); g.addColorStop(0.52, '#0b0d18'); g.addColorStop(1, '#05060c'); x.fillStyle = g; x.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.6})`; const y = Math.random() * h * 0.36, r = Math.random() < 0.1 ? 1.6 : 0.9; x.beginPath(); x.arc(Math.random() * w, y, r, 0, 7); x.fill(); } })) }));
  sky.material.map.wrapS = THREE.ClampToEdgeWrapping; sky.material.map.repeat.set(1, 1); scene.add(sky);
  buildWorld(scene, tex, U);
  if (tex.pennWall) scene.traverse((o) => { if (o.isMesh && o.geometry.type === 'BoxGeometry' && o.geometry.parameters.width === 30 && o.geometry.parameters.height === 22) { tex.pennWall.repeat.set(2, 1); o.material = new THREE.MeshStandardMaterial({ map: tex.pennWall, color: 0xb8bcc8, roughness: 0.75 }); } });
  buildBowl(scene, tex, U); $('#st-ny').textContent = (window.HANG || []).length;
  // the event floor's base, the flip panels on it
  const base = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ color: 0x0b0e20, roughness: 0.6 }));
  const bshape = new THREE.Shape(); for (let i = 0; i <= 160; i++) { const P = stadiumPoint(i / 160, 1.9); i ? bshape.lineTo(P[0], -P[1]) : bshape.moveTo(P[0], -P[1]); }
  base.geometry = new THREE.ShapeGeometry(bshape, 40).rotateX(-Math.PI / 2); base.position.y = -0.01; scene.add(base);
  U.flip = buildFlipFloor(scene); U.flip.mat.map = U.floors.court; U.flip.U.map2.value = U.floors.ice; U.flip.mat.roughness = U.rough.court;
  await loadModels(tex);
  hangAndPieces(tex);
  standingCrowd(tex);
  bump();
}

// ---------- models: the CC0 pieces and the dressing
const gltf = new GLTFLoader(); const draco = new DRACOLoader(); draco.setDecoderPath('assets/draco/'); gltf.setDRACOLoader(draco);
function fit(o, size, axis = 'max') { const b = new THREE.Box3().setFromObject(o), s = b.getSize(new THREE.Vector3()); const k = size / (axis === 'max' ? Math.max(s.x, s.y, s.z) : s[axis]); o.scale.multiplyScalar(k); const b2 = new THREE.Box3().setFromObject(o); o.position.y -= b2.min.y; const c = b2.getCenter(new THREE.Vector3()); o.position.x -= c.x; o.position.z -= c.z; const g = new THREE.Group(); g.add(o); return g; }
const loadGLB = (f) => new Promise((res) => { toLoad++; gltf.load('assets/glb/' + f, (g) => { bump(); res(g.scene); }, undefined, () => { bump(); res(null); }); });
async function loadModels(tex) {
  const names = { glovesA: 'pp_gloves_a.glb', glovesB: 'pp_gloves_b.glb', hockey: 'pp_hockey.glb', horse: 'ph_horse_statue_01.glb', bull: 'ph_bull_head.glb', elephant: 'ph_carved_wooden_elephant.glb', camera: 'ph_vintage_video_camera.glb', megaphone: 'ph_Megaphone_01.glb', boombox: 'ph_boombox.glb', binoc: 'ph_binoculars.glb', flood: 'ph_flood_lights.glb', desk: 'ph_metal_office_desk.glb', chair: 'ph_folding_chair_01.glb', taxi: 'h_taxi.glb', lamp: 'lamppost.glb', hydrant: 'hydrant.glb', searchlight: 'ph_portable_searchlight.glb' };
  const M = {}; await Promise.all(Object.entries(names).map(async ([k, f]) => { M[k] = await loadGLB(f); }));
  M.bellCode = makeBell(); M.ballCode = makeBall(tex); M.bell = M.bellCode;
  U.M = M;
  const sets = { chair: M.chair && fit(M.chair.clone(), 0.86, 'y'), flood: M.flood && fit(M.flood.clone(), 3.2), desk: M.desk && fit(M.desk.clone(), 1.6), bell: M.bell && fit(M.bell.clone(), 0.34),
    elephant: M.elephant && fit(M.elephant.clone(), 3.0, 'y'), horse: M.horse && fit(M.horse.clone(), 2.3, 'y') };
  U.sets = buildModeSets(scene, tex, U, sets); U.sets.court.visible = true;
  // the street: taxis down Seventh Avenue, lampposts, a hydrant
  if (M.taxi) for (let i = 0; i < 9; i++) { const t = fit(M.taxi.clone(), 4.7); t.position.set(132.8 + (i % 4) * 4.4, STREET - 0.1, -180 + i * 45); scene.add(t); U.taxis.push(t); }
  if (M.lamp) for (let i = 0; i < 8; i++) { const l = fit(M.lamp.clone(), 7.5, 'y'); l.position.set(126.5, STREET, -84 + i * 24); scene.add(l); }
  if (M.hydrant) { const h = fit(M.hydrant.clone(), 0.8, 'y'); h.position.set(126, STREET, 14); scene.add(h); }
  // the upper deck binoculars on the back rail, south side
  if (M.binoc) { const b = fit(M.binoc.clone(), 0.3); const P = stadiumPoint(0.75, BACK - 0.5); const y = UP.y0 + UP.rows * UP.rise; b.position.set(P[0] + 1.5, y + 1.0, P[1]); b.traverse((o) => (o.userData.act = 'binoc')); scene.add(b); clickables.push(b);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.0), new THREE.MeshStandardMaterial({ color: 0x8a93a8, metalness: 0.8, roughness: 0.3 })); post.position.set(b.position.x, y + 0.5, b.position.z); scene.add(post); }
  if (U.ringBell) clickables.push(U.ringBell);
  clickables.push(U.sets.court, U.sets.stage, U.canopy, U.pennSign, U.esb, ...LIFTS.map((L) => L.btn));
  U.canopy.userData.act = 'sign'; U.pennSign.userData.act = 'penn'; U.esb.traverse((o) => (o.userData.act = 'esb')); LIFTS.forEach((L) => (L.btn.userData.act = 'lift'));
}

// the two pieces drawn in code: a ringside bell on its board, and a game ball on a little stand
function makeBell() {
  const g = new THREE.Group(), brass = new THREE.MeshStandardMaterial({ color: 0xc9a25a, metalness: 1, roughness: 0.22 }), wood = new THREE.MeshStandardMaterial({ color: 0x4a2c18, roughness: 0.6 });
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.42, 0.04), wood); board.position.set(0, 0.21, -0.06); g.add(board);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.13, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), brass); dome.rotation.x = Math.PI / 2; dome.position.set(0, 0.24, -0.04); g.add(dome);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 8), brass); knob.position.set(0, 0.24, 0.095); g.add(knob);
  const hammer = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.2), wood); hammer.rotation.z = 0.8; hammer.position.set(0.12, 0.07, 0.03); g.add(hammer);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.06, 12), brass); head.rotation.z = Math.PI / 2 + 0.8; head.position.set(0.19, 0.14, 0.03); g.add(head);
  return g;
}
function makeBall(tex) {
  const g = new THREE.Group(); const ball = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 20), new THREE.MeshStandardMaterial({ map: tex.ball, roughness: 0.75 })); ball.position.y = 0.16; g.add(ball);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.05, 24), new THREE.MeshStandardMaterial({ color: 0x2962ff, metalness: 0.6, roughness: 0.3 })); cup.position.y = 0.025; g.add(cup);
  return g;
}

// ---------- the concourse: New Yorkers on the drum wall, the Garden's past on plinths
const PIECES = [
  { k: 'bellCode', size: 0.62, title: 'The ringside bell', year: '1971', egg: 'fight', text: 'A ringside bell: a brass gong on a board, a hammer on a cord. On March 8, 1971 Muhammad Ali and Joe Frazier, both unbeaten, met here in what was billed as the Fight of the Century, and Frazier won on points after fifteen rounds. The same bell rings at ringside when you flip the floor to the ring.', src: ['Built in code for this gallery', 'https://n3wyorkers.com'] },
  { k: 'glovesA', size: 0.67, title: 'A pair of gloves', year: '1879', egg: 'gloves', text: 'Boxing has been part of the Garden since the first one opened on Madison Square in 1879. Joe Louis, Sugar Ray Robinson and Roberto Dur\u00e1n all fought under its lights, and the arena is still called the Mecca of boxing.', src: ['Quaternius on Poly Pizza, CC0', 'https://poly.pizza/m/39uv7ux42v'] },
  { k: 'hockey', size: 2.4, title: 'A stick from the Rangers’ ice', year: '1926', egg: 'rangers', text: 'The Rangers were founded by the Garden itself in 1926 to fill the third building at Eighth Avenue and 50th Street, and have played in every Garden since. The ice stays in all season under the court; the crew lays the hardwood over it in a few hours on a game night.', src: ['Quaternius on Poly Pizza, CC0', 'https://poly.pizza/m/0YAR0Lg58p'] },
  { k: 'ballCode', size: 0.5, title: 'The game ball', year: '1946', egg: 'sneakers', text: 'The Knicks played their first game in 1946, one of only two founding teams of the league still in the city they started in. The Garden is the oldest arena in the league, and the floor you can walk out onto has been here since 1968.', src: ['Built in code for this gallery', 'https://n3wyorkers.com'] },
  { k: 'horse', size: 1.76, title: 'The horse show', year: '1883', egg: 'horses', text: 'The National Horse Show opened in the first Garden in 1883 and stayed for more than a century, a week of jumpers and hackneys on a dirt floor laid over everything else.', src: ['Poly Haven, CC0', 'https://polyhaven.com'] },
  { k: 'elephant', size: 1.12, title: 'The elephant walk', year: '1919', egg: 'elephants', text: 'For close to a century the circus came to the Garden every spring, and the elephants arrived the night before by walking through the Queens Midtown Tunnel and across 34th Street after midnight, trunk to tail.', src: ['Poly Haven, CC0', 'https://polyhaven.com'] },
  { k: 'bull', size: 1.44, title: 'The rodeo', year: '1922', egg: 'rodeo', text: 'From the 1920s to the 1950s the Garden held a championship rodeo every autumn, with dirt trucked in and cowboys put up in Midtown hotels. The bulls came back in this century.', src: ['Poly Haven, CC0', 'https://polyhaven.com'] },
  { k: 'camera', size: 0.8, title: 'The first game on television', year: '1940', egg: 'tv', text: 'On February 28, 1940 an experimental station broadcast a college double header from the third Garden, the first basketball game ever shown on television. Hardly anyone had a set to watch it on.', src: ['Poly Haven, CC0', 'https://polyhaven.com'] },
  { k: 'megaphone', size: 0.96, title: 'One hundred and three ballots', year: '1924', egg: 'ballots', text: 'The Democratic National Convention of 1924 was held in the second Garden and ran for sixteen days and 103 ballots, the longest in American history, before it settled on a candidate.', src: ['Poly Haven, CC0', 'https://polyhaven.com'] },
  { k: 'boombox', size: 1.28, title: 'The house that played everybody', year: '1971', egg: 'concert', text: 'The Concert for Bangladesh, the first great benefit concert, was played here on August 1, 1971. Billy Joel holds the arena record for appearances, 150 shows as of July 2024.', src: ['Poly Haven, CC0', 'https://polyhaven.com'] },
  { k: 'glovesB', size: 0.67, title: 'The other corner', year: '1971', egg: 'corner', text: 'For the Fight of the Century every seat was sold, Frank Sinatra worked ringside as a photographer for Life magazine, and both fighters were guaranteed two and a half million dollars, a record at the time.', src: ['Polygonal Mind on Poly Pizza, CC0', 'https://poly.pizza/m/3ghMF4tnfq'] },
];
function plinthSpots(n) {
  const out = []; const angs = [-62, -76, -104, -118, -134, 62, 76, 104, 118, 134, -148];
  for (let i = 0; i < n; i++) { const a = angs[i] * Math.PI / 180; let r0 = 0; for (let r = 30; r < DRUM_IN; r += 0.25) { if (sd(Math.cos(a) * r, Math.sin(a) * r) > BACK) { r0 = r; break; } } const r = (r0 + DRUM_IN) / 2; out.push([Math.cos(a) * r, Math.sin(a) * r, a]); }
  return out;
}
function plate(text, sub, w = 1024, h = 300) {
  return cvTex(mkCanvas(w, h, (x) => { x.fillStyle = '#0a0d22'; x.fillRect(0, 0, w, h); x.fillStyle = '#2962ff'; x.fillRect(0, 0, 10, h); x.fillStyle = '#22d3ee'; x.font = '30px "JetBrains Mono"'; x.fillText(sub, 40, 70); x.fillStyle = '#eef2f8'; x.font = '74px Anton'; let t = text; while (x.measureText(t).width > w - 80) t = t.slice(0, -2); x.fillText(t, 40, 170); x.fillStyle = '#8a93b0'; x.font = '26px "JetBrains Mono"'; x.fillText('CLICK TO READ', 40, 245); }));
}
function hangAndPieces(tex) {
  const M = U.M, stone = new THREE.MeshStandardMaterial({ color: 0x1a2040, roughness: 0.35, metalness: 0.1 }), glass = new THREE.MeshPhysicalMaterial({ color: 0xe6f0ff, transparent: true, opacity: 0.12, roughness: 0.02, depthWrite: false });
  let n = 0;
  plinthSpots(PIECES.length).forEach(([x, z, a], i) => {
    const P = PIECES[i]; if (!M[P.k]) return; n++;
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = -a - Math.PI / 2; scene.add(g);
    const pl = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.05, 1.5), stone); pl.position.y = 0.525; g.add(pl);
    const ring = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.04, 1.32), new THREE.MeshBasicMaterial({ color: 0x2962ff, toneMapped: false })); ring.position.y = 1.03; g.add(ring);
    const obj = fit(M[P.k].clone(), P.size); obj.position.y = 1.07; g.add(obj); U.spin = U.spin || []; U.spin.push(obj);
    const vit = new THREE.Mesh(new THREE.BoxGeometry(1.4, Math.max(0.9, P.size + 0.35), 1.4), glass); vit.position.y = 1.07 + vit.geometry.parameters.height / 2; g.add(vit);
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.32), new THREE.MeshBasicMaterial({ map: plate(P.title.toUpperCase(), P.year + ' · THE GARDEN'), toneMapped: false })); lab.position.set(0, 0.7, 0.76); lab.rotation.x = -0.25; g.add(lab);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(1.6, 40), new THREE.MeshBasicMaterial({ color: 0x2962ff, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false })); pool.rotation.x = -Math.PI / 2; pool.position.y = 0.02; g.add(pool);
    g.traverse((o) => { o.userData.act = 'piece'; o.userData.piece = P; }); clickables.push(g);
  });
  $('#st-pc').textContent = n;
  // the organ console by the south lift
  const org = new THREE.Group(); org.position.set(-12, 0, 50); org.rotation.y = Math.PI; scene.add(org);
  org.add(put(new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 1.0), new THREE.MeshStandardMaterial({ color: 0x14172a, roughness: 0.4, metalness: 0.3 })), { position: new THREE.Vector3(0, 0.55, 0) }));
  const keys = cvTex(mkCanvas(512, 64, (x) => { x.fillStyle = '#f4f2ea'; x.fillRect(0, 0, 512, 64); x.fillStyle = '#111'; for (let i = 0; i < 61; i++) { x.fillRect(i * 8.4, 0, 1, 64); if ([1, 3, 6, 8, 10].includes(i % 12)) x.fillRect(i * 8.4 - 2.5, 0, 5, 38); } }));
  for (let k = 0; k < 3; k++) { const kb = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.05, 0.22), new THREE.MeshStandardMaterial({ map: keys, roughness: 0.4 })); kb.position.set(0, 1.12 + k * 0.12, 0.3 - k * 0.2); org.add(kb); }
  org.add(put(new THREE.Mesh(new THREE.PlaneGeometry(2, 0.6), new THREE.MeshBasicMaterial({ map: plate('THE ORGAN', 'PLAY IT'), toneMapped: false })), { position: new THREE.Vector3(0, 1.9, -0.3) }));
  org.traverse((o) => (o.userData.act = 'organ')); clickables.push(org);
  // the hang: New Yorkers from Midtown, Chelsea, Hell's Kitchen and Murray Hill round the drum wall, loaded as you come near
  const H = window.HANG || []; U.frames = [];
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x0b0d18, roughness: 0.5, metalness: 0.3 });
  const free = []; for (let i = 0; i < 360; i++) { const a = i * Math.PI / 180; if (Math.cos(a) > 0 && Math.abs(Math.sin(a) * DRUM_IN) < ENTRY.w + 3) continue; if (Math.abs(Math.cos(a) * DRUM_IN) < 4) continue; free.push(a); }
  const step = free.length / H.length;
  H.forEach((p, i) => {
    const a = free[Math.floor(i * step + step / 2)], r = DRUM_IN - 0.12, g = new THREE.Group(); g.position.set(Math.cos(a) * r, 2.35, Math.sin(a) * r); g.rotation.y = -a - Math.PI / 2; scene.add(g);
    const fr = new THREE.Mesh(new THREE.BoxGeometry(1.62, 2.02, 0.08), frameMat); g.add(fr);
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.9), new THREE.MeshBasicMaterial({ color: 0x1a1f38 })); pic.position.z = 0.045; g.add(pic);
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.26), new THREE.MeshBasicMaterial({ map: plate(p.t.toUpperCase(), 'No. ' + p.n + ' · ' + p.h.toUpperCase(), 1024, 300), toneMapped: false })); lab.position.set(0, -1.28, 0.05); g.add(lab);
    const light = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.25), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); light.position.set(0, 1.25, 0.2); g.add(light);
    g.traverse((o) => { o.userData.act = 'art'; o.userData.art = p; }); clickables.push(g);
    U.frames.push({ g, pic, p, loaded: false });
  });
}
function standingCrowd(tex) { // the general admission floor for the concert: 700 standing in front of the stage
  const n = 700, body = new THREE.BoxGeometry(0.44, 1.2, 0.28).translate(0, 0.62, 0), head = new THREE.PlaneGeometry(0.48, 0.48).translate(0, 1.5, 0.02);
  const mb = new THREE.InstancedMesh(body, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 }), n), mh = new THREE.InstancedMesh(head, new THREE.MeshStandardMaterial({ map: tex.flower, alphaTest: 0.5, side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: tex.flower, emissiveIntensity: 0.1 }), n);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color(), PAL = [0x2962ff, 0xff4fa3, 0x22d3ee, 0xeef2f8, 0x0d0d0d, 0x7a4fd0, 0x3a3f58];
  let k = 0; while (k < n) { const x = -14 + Math.random() * 28, z = -12 + Math.random() * 24; if (Math.abs(z) < 2.2 && x < 0) continue; if (sd(x, z) > -1) continue;
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2 + (Math.random() - 0.5) * 0.8); m4.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(1, 0.9 + Math.random() * 0.2, 1)); mb.setMatrixAt(k, m4); mh.setMatrixAt(k, m4); mb.setColorAt(k, c.set(PAL[k % PAL.length])); k++; }
  U.sets.stage.add(mb, mh); U.gaBodies = mb;
}

// ---------- the floor changes
const MODE_INFO = {
  court: ['COURT', 'Hardwood over the ice. The free throw line is fifteen feet from the rim; F or a ball from the rack to shoot.'],
  ice: ['ICE', 'Two hundred by eighty five feet, under the boards and glass. The ice stays in all winter under the court.'],
  stage: ['STAGE', 'House lights down, phones up. Stand on the floor or climb to the top row.'],
  ring: ['RING', 'Twenty feet square, four feet up. Ring the bell at ringside.'],
  circus: ['CIRCUS', 'A forty two foot ring of sawdust. The elephant and the horse are carved, and they never stop.'],
};
const seen = new Set(['court']);
function setMode(m, origin) {
  if (m === mode || flipping || !U.flip) return;
  const o = origin || new THREE.Vector2(THREE.MathUtils.clamp(player.pos.x, -31, 31), THREE.MathUtils.clamp(player.pos.z, -15, 15));
  U.flip.U.map2.value = U.floors[m]; U.flip.U.uOrigin.value.copy(o); U.flip.U.uProg.value = 0;
  flipping = { to: m, from: mode, t: 0, swapped: false }; S.flipClack(28);
  document.querySelectorAll('#console [data-mode]').forEach((b) => b.classList.toggle('on', b.dataset.mode === m));
}
function endFlip() {
  const m = flipping.to; U.flip.mat.map = U.floors[m]; U.flip.mat.roughness = U.rough[m]; U.flip.U.uProg.value = 0; mode = m; flipping = null; seen.add(m);
  if (m === 'stage') setHouse(true); else if (houseDown) setHouse(false);
  drawScore(); S.cheer(0.6); if (seen.size === 5) egg('allfloors', 'All five floors', 'Court, ice, stage, ring and circus in one night. The real changeover crew does one of these in about an hour.');
  if (zoneOf(player.pos) === 'floor' || zoneOf(player.pos) === 'bowl') toast(MODE_INFO[m][1], 'THE FLOOR · ' + MODE_INFO[m][0]);
}
function setHouse(down) { houseDown = down; $('#b-lights').classList.toggle('on', down); }

// ---------- the scoreboard and the eye cam
let score = 0, shots = 0;
function drawScore() {
  const c = U.scoreCanvas, x = c.getContext('2d'), w = c.width, h = c.height; x.fillStyle = '#04050c'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#2962ff'; x.fillRect(0, 0, w, 86); x.fillStyle = '#eef2f8'; x.font = '62px "N3W Skyline", Anton'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('THE GARDEN', w / 2, 46);
  x.font = '40px "JetBrains Mono"'; x.fillStyle = '#22d3ee'; x.fillText('TONIGHT · ' + MODE_INFO[flipping ? flipping.to : mode][0], w / 2, 140);
  x.font = '150px Anton'; x.fillStyle = '#eef2f8'; x.fillText(String(score), w / 2 - 230, 300); x.fillStyle = '#ff4fa3'; x.fillText(String(shots - Math.round(score / 2.4) >= 0 ? shots : 0), w / 2 + 230, 300);
  x.font = '30px "JetBrains Mono"'; x.fillStyle = '#8a93b0'; x.fillText('YOU', w / 2 - 230, 400); x.fillText('SHOTS', w / 2 + 230, 400);
  const t = new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' }); x.fillStyle = '#eef2f8'; x.font = '44px "JetBrains Mono"'; x.fillText(t + ' NEW YORK', w / 2, 470);
  U.scoreTex.needsUpdate = true;
}
function drawCamFrame(on) {
  const c = U.camFrame, x = c.getContext('2d'), w = c.width, h = c.height; x.clearRect(0, 0, w, h);
  x.strokeStyle = '#ff4fa3'; x.lineWidth = 10; x.strokeRect(8, 8, w - 16, h - 16);
  x.fillStyle = 'rgba(4,5,12,.75)'; x.fillRect(0, h - 64, w, 64); x.fillStyle = '#eef2f8'; x.font = '44px "N3W Skyline", Anton'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(on ? 'EYE CAM · WAVE AT YOURSELF' : 'EYE CAM', w / 2, h - 30);
  x.fillStyle = '#2962ff'; x.beginPath(); x.ellipse(60, 52, 34, 20, 0, 0, 7); x.fill(); x.fillStyle = '#05060f'; x.beginPath(); x.arc(60, 52, 9, 0, 7); x.fill();
  U.camFrameTex.needsUpdate = true;
}
const camCam = new THREE.PerspectiveCamera(30, 2, 0.5, 220);

// ---------- hoops
const balls = []; const G = -9.8;
function shoot() {
  if (mode !== 'court' || flipping || !U.rims) return toast('Flip the floor to COURT first: press 1, or the console.', 'THE FLOOR');
  if (player.pos.y > 1 || sd(player.pos.x, player.pos.z) > 1.8) return toast('Walk down a tunnel onto the court to shoot.', 'HOOPS');
  const head = camera.position.clone(), fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  const rim = U.rims.reduce((a, b) => (b.distanceTo(head) < a.distanceTo(head) ? b : a));
  const start = head.clone().add(fwd.clone().multiplyScalar(0.5)).add(new THREE.Vector3(0, -0.25, 0));
  const D = Math.hypot(rim.x - start.x, rim.z - start.z), make = Math.random() < THREE.MathUtils.clamp(1.02 - D / 15, 0.12, 0.92);
  const target = rim.clone(); if (!make) { const a = Math.random() * 6.28; target.x += Math.cos(a) * (0.26 + Math.random() * 0.2); target.z += Math.sin(a) * (0.26 + Math.random() * 0.2); }
  target.y += 0.12; const T = 0.85 + D * 0.055; const v = target.clone().sub(start).sub(new THREE.Vector3(0, 0.5 * G * T * T, 0)).divideScalar(T);
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 14), new THREE.MeshStandardMaterial({ map: U.sets.court.children.find((o) => o.userData.act === 'ball')?.material.map, roughness: 0.7 }));
  m.position.copy(start); scene.add(m); shots++;
  balls.push({ m, v, t: 0, T, make, D, rim, done: false, life: 6 });
}
function stepBalls(dt) {
  for (const b of balls) {
    b.t += dt; b.life -= dt; b.v.y += G * dt; b.m.position.addScaledVector(b.v, dt); b.m.rotation.x += dt * 6;
    if (!b.done && b.t >= b.T) { b.done = true;
      if (b.make) { S.swish(); const pts = b.D > 7.24 ? 3 : 2; score += pts; b.v.set(0, -1, 0); S.cheer(pts === 3 ? 1.2 : 0.8); egg('swish', 'Nothing but net', pts === 3 ? 'From downtown. On December 14, 2021, on this floor, Stephen Curry passed Ray Allen for the most three pointers ever made.' : 'Two points. The Garden is the oldest arena in the league, and the floor has been here since 1968.'); }
      else { S.clank(); b.v.set((Math.random() - 0.5) * 3, 2.5, (Math.random() - 0.5) * 3); }
      drawScore(); }
    if (b.m.position.y < 0.12) { b.m.position.y = 0.12; if (b.v.y < -0.5) S.thud(Math.min(0.4, -b.v.y * 0.06)); b.v.y = -b.v.y * 0.62; b.v.x *= 0.85; b.v.z *= 0.85; }
  }
  for (let i = balls.length - 1; i >= 0; i--) if (balls[i].life < 0) { scene.remove(balls[i].m); balls.splice(i, 1); }
}

// ---------- the wave
let wave = null;
function startWave() { if (wave) return; wave = { t: 0 }; S.organVamp(); S.cheer(1, 3.5); const id = setInterval(() => S.cheer(0.7, 2), 2600); setTimeout(() => clearInterval(id), 9500); egg('wave', 'The wave', 'Fourteen thousand eye flowers stood up for you. Twice round, then they sat back down.'); }

// ---------- interaction
const ray = new THREE.Raycaster(); ray.far = 900;
function pick(nx = 0, ny = 0) { ray.setFromCamera({ x: nx, y: ny }, camera); const h = ray.intersectObjects(clickables, true)[0]; if (!h) return null; let o = h.object; while (o && !o.userData.act) o = o.parent; return o ? { o, d: h.distance } : null; }
function act(hit) {
  if (!hit) return; const { o, d } = hit, a = o.userData.act;
  if (a === 'art' && d < 14) return openArt(o.userData.art);
  if (a === 'piece' && d < 12) { const P = o.userData.piece; openPiece(P); egg(P.egg, P.title, 'You read the plinth. ' + P.year + '.'); return; }
  if (a === 'ball' && d < 8) return shoot();
  if (a === 'bell' && d < 10) { S.bell(3); S.cheer(0.9); egg('bell', 'Ding ding', 'The ringside bell from the 5th St. Gym, rung three times. Round one.'); return; }
  if (a === 'mic' && d < 12) { S.beat(true); toast('Testing, one two. The house is yours.', 'STAGE'); return; }
  if (a === 'organ' && d < 6) { S.organCharge(); egg('organ', 'Charge', 'The arena organ: four notes up, a held fifth, then everybody yells.'); return; }
  if (a === 'lift' && d < 6) return ride(LIFTS.reduce((A, B) => (Math.hypot(B.x - player.pos.x, B.z - player.pos.z) < Math.hypot(A.x - player.pos.x, A.z - player.pos.z) ? B : A)));
  if (a === 'penn' && d < 12) { S.rumble(4); egg('penn', 'The station under it', 'The Garden sits on the platforms of Penn Station. The old station’s grand building was torn down for it in 1963, and the outcry led to New York’s Landmarks Preservation Commission.'); return; }
  if (a === 'sign') { egg('fourth', 'The fourth Garden', 'This is the fourth arena with the name. The first two stood on Madison Square, the third on Eighth Avenue at 50th Street. This one opened on February 11, 1968, and the name came along each time.'); return; }
  if (a === 'esb') { egg('esb', 'Two blocks east', 'The Empire State Building, at 34th and Fifth. From the street the Garden’s drum hides everything but the top.'); return; }
  if (a === 'binoc' && d < 5) { zoomTo(new THREE.Vector3(0, 1, 0), 6); egg('binoc', 'The cheap seats', 'Top row, upper bowl. The binoculars show you the centre circle, a hundred and fifty feet away and fifty feet down.'); return; }
}
function openArt(p) { $('#c-img').src = 'assets/art/' + p.f; $('#c-k').textContent = 'NEW YORKER No. ' + p.n + ' · ' + p.h.toUpperCase(); $('#c-t').textContent = p.t; $('#c-p').textContent = p.s || ''; $('#c-src').textContent = 'From the census, hung here because it was made on these blocks.'; const a = $('#c-a'); a.style.display = p.u ? '' : 'none'; a.href = p.u ? (p.u.startsWith('http') ? p.u : 'https://n3wyorkers.com' + p.u) : '#'; a.textContent = 'See the record'; openCard(); }
function openPiece(P) { $('#c-img').src = U.pieceShots?.[P.k] || ''; $('#c-k').textContent = P.year + ' · THE GARDEN’S PAST'; $('#c-t').textContent = P.title; $('#c-p').textContent = P.text; $('#c-src').innerHTML = 'The object: <a href="' + P.src[1] + '" target="_blank" rel="noopener">' + P.src[0] + '</a>'; $('#c-a').style.display = 'none'; openCard(); }
function openCard() { $('#card').classList.add('on'); if (document.pointerLockElement) document.exitPointerLock(); }
$('#c-x').addEventListener('click', () => $('#card').classList.remove('on'));
$('#card').addEventListener('click', (e) => { if (e.target.id === 'card') $('#card').classList.remove('on'); });
let zoom = null; function zoomTo(target, sec) { zoom = { target, t: sec, fov: camera.fov }; }

// ---------- the lifts
function ride(L) {
  if (player.riding) return; const up = player.pos.y < 12; const from = player.pos.y, to = up ? BRIDGE.y : 0;
  player.pos.x = L.x; player.pos.z = L.z; player.riding = { L, from, to, t: 0, dur: 6 }; S.clank();
}

// ---------- controls
const keys = {}; let locked = false;
const cnv = renderer.domElement;
addEventListener('keydown', (e) => {
  keys[e.code] = true; if (!started) return;
  if (e.code === 'KeyF') shoot(); if (e.code === 'KeyG') startWave(); if (e.code === 'KeyL') setHouse(!houseDown);
  if (e.code === 'KeyM') { const on = S.toggleSound(); $('#b-snd').textContent = on ? 'M SOUND OFF' : 'M SOUND ON'; }
  const mi = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].indexOf(e.code); if (mi >= 0) setMode(['court', 'ice', 'stage', 'ring', 'circus'][mi]);
  if (e.code === 'KeyE') act(pick());
});
addEventListener('keyup', (e) => (keys[e.code] = false));
const lock = () => { if (PHONE) return; try { const p = cnv.requestPointerLock?.(); p && p.catch && p.catch(() => {}); } catch (e) {} };
document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === cnv; $('#hud').classList.toggle('locked', locked); });
cnv.addEventListener('mousedown', (e) => { if (!started || PHONE) return; if (!locked) { lock(); return; } act(pick()); });
addEventListener('mousemove', (e) => { if (!locked) return; player.yaw -= e.movementX * 0.0022; player.pitch = THREE.MathUtils.clamp(player.pitch - e.movementY * 0.0022, -1.45, 1.45); });
document.querySelectorAll('#console [data-mode]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); setMode(b.dataset.mode); }));
$('#b-wave').addEventListener('click', () => startWave()); $('#b-lights').addEventListener('click', () => setHouse(!houseDown));
$('#b-snd').addEventListener('click', () => { const on = S.toggleSound(); $('#b-snd').textContent = on ? 'M SOUND OFF' : 'M SOUND ON'; });
// phone: left thumb walks, right thumb looks, a tap uses
const stick = { id: null, x: 0, y: 0, dx: 0, dy: 0 }, look = { id: null, x: 0, y: 0, t: 0, moved: 0 };
cnv.addEventListener('touchstart', (e) => { for (const t of e.changedTouches) { if (t.clientX < innerWidth * 0.42 && stick.id === null) { Object.assign(stick, { id: t.identifier, x: t.clientX, y: t.clientY, dx: 0, dy: 0 }); $('#stick').style.cssText = `display:block;left:${t.clientX - 50}px;top:${t.clientY - 50}px`; } else if (look.id === null) Object.assign(look, { id: t.identifier, x: t.clientX, y: t.clientY, t: performance.now(), moved: 0 }); } e.preventDefault(); }, { passive: false });
cnv.addEventListener('touchmove', (e) => { for (const t of e.changedTouches) { if (t.identifier === stick.id) { stick.dx = THREE.MathUtils.clamp((t.clientX - stick.x) / 50, -1, 1); stick.dy = THREE.MathUtils.clamp((t.clientY - stick.y) / 50, -1, 1); $('#knob').style.transform = `translate(${stick.dx * 30}px,${stick.dy * 30}px)`; } else if (t.identifier === look.id) { const dx = t.clientX - look.x, dy = t.clientY - look.y; look.moved += Math.abs(dx) + Math.abs(dy); player.yaw -= dx * 0.005; player.pitch = THREE.MathUtils.clamp(player.pitch - dy * 0.005, -1.45, 1.45); look.x = t.clientX; look.y = t.clientY; } } e.preventDefault(); }, { passive: false });
cnv.addEventListener('touchend', (e) => { for (const t of e.changedTouches) { if (t.identifier === stick.id) { stick.id = null; stick.dx = stick.dy = 0; $('#stick').style.display = 'none'; $('#knob').style.transform = ''; } else if (t.identifier === look.id) { if (look.moved < 12 && performance.now() - look.t < 400) act(pick(t.clientX / innerWidth * 2 - 1, -(t.clientY / innerHeight) * 2 + 1)); look.id = null; } } }, { passive: false });

// ---------- movement on the walk map
const sbuf = [];
function groundAt(x, z, y) { surfaces(x, z, sbuf); let best = null; for (const s of sbuf) if (s <= y + 0.75 && (best === null || s > best)) best = s; return best; }
function move(dt) {
  if (player.riding) { const R = player.riding; R.t += dt; const k = THREE.MathUtils.smoothstep(R.t / R.dur, 0, 1); player.pos.y = R.from + (R.to - R.from) * k; R.L.car.position.y = player.pos.y + 0.1; if (R.t >= R.dur) { player.riding = null; player.liftCool = R.L;
    if (R.to > 1) { egg('bridges', 'The bridges', 'Two walkways hung from the roof on steel rods, 233 feet long, added in the renovation finished in 2013. The floor is twenty four metres down.'); toast('Walk out along the catwalk onto the bridge.', 'THE BRIDGES'); } } return; }
  let f = 0, s = 0; if (keys.KeyW || keys.ArrowUp) f += 1; if (keys.KeyS || keys.ArrowDown) f -= 1; if (keys.KeyA || keys.ArrowLeft) s -= 1; if (keys.KeyD || keys.ArrowRight) s += 1;
  f -= stick.dy; s += stick.dx; const len = Math.hypot(f, s); if (len > 1) { f /= len; s /= len; }
  const sp = (keys.ShiftLeft || keys.ShiftRight ? 10 : 5) * dt, sy = Math.sin(player.yaw), cy = Math.cos(player.yaw);
  let dx = (-sy * f + cy * s) * sp, dz = (-cy * f - sy * s) * sp;
  // the escalators carry you up
  if (Math.abs(player.pos.z) < ENTRY.w && player.pos.x > 68 && player.pos.x < 90 && Math.abs(Math.abs(player.pos.z) - 4.4 * Math.round(Math.abs(player.pos.z) / 4.4)) < 0.9 && Math.round(Math.abs(player.pos.z) / 4.4) <= 1) dx -= 1.1 * dt;
  const p = player.pos;
  for (const [mx, mz] of [[dx, dz], [dx, 0], [0, dz]]) { const g = groundAt(p.x + mx, p.z + mz, p.y); if (g !== null) { p.x += mx; p.z += mz; break; } }
  const g = groundAt(p.x, p.z, p.y); if (g === null) return;
  if (g > p.y) { p.y += Math.min(g - p.y, dt * 6); player.vy = 0; } else { player.vy += G * dt; p.y = Math.max(g, p.y + player.vy * dt); if (p.y === g) player.vy = 0; }
  // a lift underfoot
  for (const L of LIFTS) { const on = Math.hypot(p.x - L.x, p.z - L.z) < 1.9; if (!on && player.liftCool === L) player.liftCool = null; if (on && player.liftCool !== L) { L.stand = (L.stand || 0) + dt; if (L.stand > 1.0) { L.stand = 0; ride(L); } } else L.stand = 0; }
}

// ---------- zones and the HUD
const ZONES = {
  avenue: ['SEVENTH AVENUE', 'Seventh Avenue', 'The floor is forty five feet over your head, and the trains of Penn Station run under your feet. Go in under the name.'],
  escalators: ['THE ESCALATORS', 'Four storeys up', 'The arena was built on top of a working railroad. Keep climbing.'],
  concourse: ['THE CONCOURSE', 'The concourse', 'New Yorkers from these blocks on the wall, a century of the Garden on the plinths. The tunnels lead to the bowl.'],
  bowl: ['THE BOWL', 'The bowl', 'Every seat aimed at the floor. Look up at the forty eight cables meeting over centre court.'],
  floor: ['THE FLOOR', 'The floor', 'Change it from the console: court, ice, stage, ring, circus.'],
  bridges: ['THE BRIDGES', 'The bridges', 'Hung from the roof, twenty four metres over the floor. The lift takes you down.'],
};
let zone = '';
function zoneTick() {
  const z = zoneOf(player.pos); if (z !== zone) { zone = z; const Z = ZONES[z]; $('#zlvl').textContent = Z[0]; $('#zname').textContent = Z[1]; $('#zk').textContent = z === 'floor' ? MODE_INFO[mode][1] : Z[2]; if (z === 'concourse' && player.pos.x > 50) egg('climb', 'Forty five feet', 'You just climbed four storeys. The arena floor sits forty five feet over Seventh Avenue, on top of Penn Station.'); }
  S.crowdLevel(z === 'avenue' ? 0.1 : z === 'escalators' ? 0.35 : z === 'concourse' ? 0.5 : 1);
  if ((z === 'floor' || z === 'bowl') && Math.hypot(player.pos.x, player.pos.z) < 3 && player.pitch > 1.1) egg('hub', 'A bicycle wheel', 'The roof is a 404 foot cable suspension roof, likened when it opened to a bicycle wheel on its side: 48 cables from the rim to a ring over your head, rigid only because they are in tension.');
}

// ---------- the loop
const clock = new THREE.Clock(); let frame = 0, camSeen = 0;
function loop() {
  requestAnimationFrame(loop); if (document.hidden) return;
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime; frame++;
  if (!U.ready) return;
  if (started && !Q.get('view')) move(dt);
  camera.position.set(player.pos.x, player.pos.y + 1.65, player.pos.z); camera.rotation.set(player.pitch, player.yaw, 0);
  if (zoom) { zoom.t -= dt; camera.lookAt(zoom.target); camera.fov = THREE.MathUtils.lerp(camera.fov, zoom.t > 0.6 ? 14 : 68, 0.08); camera.updateProjectionMatrix(); if (zoom.t <= 0) { zoom = null; camera.fov = 68; camera.updateProjectionMatrix(); } }
  // the flip
  if (flipping) { flipping.t += dt; const k = flipping.t / 3.4; U.flip.U.uProg.value = Math.min(1, k);
    if (!flipping.swapped && k > 0.55) { flipping.swapped = true; U.sets[flipping.from].visible = false; const ns = U.sets[flipping.to]; ns.visible = true; ns.scale.setScalar(0.001); ns.userData.grow = 0; }
    if (k >= 1) endFlip(); }
  for (const k in U.sets || {}) { const s = U.sets[k]; if (s.visible && s.userData.grow !== undefined) { s.userData.grow = Math.min(1, s.userData.grow + dt * 1.6); const e = 1 - Math.pow(1 - s.userData.grow, 3); s.scale.setScalar(Math.max(0.001, e)); if (s.userData.grow >= 1) delete s.userData.grow; } }
  // the house: lights down for the concert
  const down = houseDown ? 1 : 0, zz = zoneOf(player.pos), amb = zz === 'concourse' ? 1.35 : zz === 'escalators' ? 0.7 : zz === 'avenue' ? 0.45 : 0.8; U.hemi.intensity = THREE.MathUtils.lerp(U.hemi.intensity, down && amb < 1 ? 0.12 : amb, 0.05); U.house.intensity = THREE.MathUtils.lerp(U.house.intensity, down ? 0.05 : 0.9, 0.04); U.spot.intensity = THREE.MathUtils.lerp(U.spot.intensity, down ? 380 : 1100, 0.04);
  U.phones.uOn.value = THREE.MathUtils.lerp(U.phones.uOn.value, down ? 1 : 0, 0.03); U.phones.uPx.value = renderer.getPixelRatio() * innerHeight / 900; U.wave.uT.value = t; U.phones.uT.value = t;
  scene.environmentIntensity = THREE.MathUtils.lerp(scene.environmentIntensity || 0.45, down ? 0.1 : amb > 1 ? 0.7 : 0.45, 0.04);
  if (U.beams) { const on = mode === 'stage'; U.beams.forEach((b, i) => { b.rotation.x = Math.sin(t * 0.7 + i) * 0.5; b.rotation.z = Math.cos(t * 0.5 + i * 1.3) * 0.45; b.visible = on; }); if (on && houseDown && frame % 48 === 0) S.beat(frame % 192 === 0); }
  if (U.parade) U.parade.forEach((P) => { const a = t * P.sp * 2 + P.ph; P.o.position.set(Math.cos(a) * P.r, 0, Math.sin(a) * P.r); P.o.rotation.y = -a; });
  if (U.swings) U.swings.forEach((s, i) => (s.rotation.z = Math.sin(t * 1.4 + i * Math.PI) * 0.55));
  if (U.spin) U.spin.forEach((o) => (o.rotation.y += dt * 0.25));
  if (U.escMat) U.escMat.map.offset.y = (t * 0.6) % 1;
  if (wave) { wave.t += dt; U.wave.uWaveOn.value = Math.min(1, wave.t * 2, Math.max(0, (11 - wave.t) * 2)); U.wave.uWave.value = -wave.t * 1.25; if (wave.t > 11.5) { wave = null; U.wave.uWaveOn.value = 0; } }
  if (U.taxis) U.taxis.forEach((c, i) => { c.position.z += dt * (9 + (i % 3) * 2); if (c.position.z > 200) c.position.z = -200; });
  stepBalls(dt);
  // the hang loads as you come near
  if (U.frames && frame % 20 === 0) for (const F of U.frames) if (!F.loaded && F.g.position.distanceTo(camera.position) < 30) { F.loaded = true; TL.load('assets/art/' + F.p.f, (tt) => { tt.colorSpace = THREE.SRGBColorSpace; tt.anisotropy = 4; F.pic.material = new THREE.MeshBasicMaterial({ map: tt, toneMapped: true }); const a = tt.image.width / tt.image.height; if (a > 0) { const h = 1.9, w = Math.min(1.5, h * a); F.pic.scale.set(w / 1.5, (w / a) / 1.9, 1); } }); }
  // the scoreboard clock and the eye cam
  if (frame % 300 === 1 && U.scoreCanvas) drawScore();
  const z = zoneOf(player.pos), inBowl = z === 'bowl' || z === 'floor' || z === 'bridges';
  if (U.camRT && inBowl && frame % 3 === 0) { const s = Math.sign(player.pos.z) || 1; camCam.position.set(0, 19, s * 4.8); camCam.lookAt(player.pos.x, player.pos.y + 1.5, player.pos.z); camCam.fov = THREE.MathUtils.clamp(2400 / camCam.position.distanceTo(camera.position) / 10, 4, 30); camCam.updateProjectionMatrix();
    U.scoreboard.visible = false; renderer.setRenderTarget(U.camRT); renderer.render(scene, camCam); renderer.setRenderTarget(null); U.scoreboard.visible = true;
    camSeen += dt * 3; if (camSeen > 4 && !eggs.has('eyecam')) { drawCamFrame(true); egg('eyecam', 'On the eye cam', 'Look up at the scoreboard. That is you, from the eye cam, on a screen forty feet wide.'); } }
  // hover hint
  if (started && locked && frame % 6 === 0) { const h = pick(); const a = h && h.o.userData.act; $('#cross').classList.toggle('hot', !!a); $('#hint').textContent = !a ? '' : { art: 'SEE THE NEW YORKER', piece: 'READ THE PLINTH', ball: 'SHOOT', bell: 'RING THE BELL', mic: 'TAP THE MIC', organ: 'PLAY THE ORGAN', lift: 'CALL THE LIFT', penn: 'LISTEN', sign: 'READ THE NAME', esb: 'LOOK', binoc: 'LOOK THROUGH' }[a] || ''; }
  if (frame % 15 === 0) zoneTick();
  composer.render();
}

// ---------- start
const go = $('#go');
build().then(() => { U.ready = true; drawScore(); drawCamFrame(false); go.disabled = false; go.textContent = 'Walk in'; $('#lp').style.width = '100%'; renderer.compile(scene, camera);
  try { JSON.parse(localStorage.getItem('garden-eggs') || '[]').forEach((e) => eggs.add(e)); $('#eggn').textContent = eggs.size; } catch (e) {}
  const view = Q.get('view'); if (view) { begin(true); teleport(view); const m = Q.get('mode'); if (m && m !== 'court') window.__garden.flipNow(m); }
}).catch((e) => { console.error(e); go.textContent = 'Something broke'; window.__err = String(e && e.stack || e); });
function begin(quiet) { if (started) return; started = true; $('#intro').classList.add('off'); if (!quiet) { S.startSound(); lock(); toast('Go in under the name. Escalators up to the concourse, then a tunnel into the bowl.', 'SEVENTH AVENUE'); } }
go.addEventListener('click', () => begin(false));
loop();

// ---------- hooks for the headless shots
const VIEWS = {
  avenue: [150, STREET, 30, 1.25, 0.18], hall: [86, STREET * 0.85, 0, 1.5708, 0.25], concourse: [0, 0, -56, -0.25, 0.05], pieces: [20, 0, -50, 0.9, -0.12],
  bowl: [0, 24, 47, 0, -0.42], court: [-21, 0.4, 9, -1.15, 0.0], ring: [6, 0, 9.5, 0.55, 0.02], circus: [9, 0, 10.5, 0.7, 0.0], stage: [24, 3.2, 9, 1.25, 0.02], ice: [36, 4.2, 6, 1.4, -0.16], floor: [-24, 0, 6, -1.35, 0.02], roof: [0, 0.2, 0, 0, 1.45], bridge: [-30, BRIDGE.y, -BRIDGE.z, -1.5708, -0.38], top: [44, 17, 0, 1.5708, -0.38],
};
function teleport(v) { const V = VIEWS[v]; if (!V) return; player.pos.set(V[0], V[1], V[2]); player.yaw = V[3]; player.pitch = V[4]; zone = ''; }
window.__garden = { teleport, setMode: (m) => { setMode(m, new THREE.Vector2()); }, flipNow: (m) => { setMode(m, new THREE.Vector2()); if (flipping) { flipping.t = 3.39; } }, wave: startWave, house: setHouse, shoot, U, scene, camera, renderer, player, eggs, VIEWS };
