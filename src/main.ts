import * as T from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { manifest, loading, hdr, setAniso, type Piece } from './core/assets';
import { shared, focusThresholds } from './core/mlow';
import { interiorTime } from './core/interior';
import { clickables } from './core/hang';
import { walkable, batchStatic } from './core/kit';
import { Portal, type PortalOpts } from './core/portal';
import type { Room, Ctx } from './core/room';
import { buildBlock } from './rooms/block';
import { ROOM_BUILDERS, LINKS } from './rooms/index';

// BIGGER ON THE INSIDE: the world. Rooms 1 km apart in one scene, one visible at a time; doorways are live portals.

const $ = <E extends HTMLElement>(s: string) => document.querySelector(s) as E;
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
const params = new URLSearchParams(location.search);

let renderer: T.WebGLRenderer;
try {
  renderer = new T.WebGLRenderer({ antialias: !mobile, powerPreference: 'high-performance', stencil: false });
} catch { document.body.classList.add('nogl'); throw new Error('no webgl'); }

// POWER policy (NEW YORKERS SITE/HANDOFF_POWER_2026-10-12.md): pixel ratio 1.5, 60 fps active, 30 idle, 6 blurred.
const DPR = Math.min(devicePixelRatio, mobile ? 1.25 : 1.5);
renderer.setPixelRatio(DPR);
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
setAniso(Math.min(8, renderer.capabilities.getMaxAnisotropy()));
renderer.info.autoReset = false; // the stats below count the whole frame: portals, mirror, AO, bloom
$('#scene').appendChild(renderer.domElement);

const scene = new T.Scene();
const camera = new T.PerspectiveCamera(62, 1, 0.05, 900);
const rooms = new Map<string, Room>();
const portals: Portal[] = [];
let here: Room;

// post: bloom on emissive paint and signs, a grade with a vignette and fine grain
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
// ground contact: ambient occlusion on desktop (?lite turns it and bloom off)
const lite = mobile || params.has('lite');
if (!lite) {
  const ao = new GTAOPass(scene, camera, innerWidth, innerHeight);
  ao.updateGtaoMaterial({ radius: 0.55, distanceExponent: 1.6, thickness: 1.2, scale: 1.1, samples: 12 });
  ao.blendIntensity = 0.85;
  composer.addPass(ao);
  // the AO pass draws the scene again with a normal material: anything see through (steam, light pools, stickers)
  // would turn into a solid dark card. Hide those for that pass only; the beauty pass has already drawn them.
  const aoRender = ao.render.bind(ao);
  ao.render = (...a: Parameters<typeof ao.render>) => {
    const hid: T.Object3D[] = [];
    here?.group.traverse((o) => {
      const m = (o as T.Mesh).material as T.Material | undefined;
      if (o.visible && m && !Array.isArray(m) && (m.transparent || (o as T.Sprite).isSprite)) { o.visible = false; hid.push(o); }
    });
    aoRender(...a);
    hid.forEach((o) => (o.visible = true));
  };
}
const bloom = new UnrealBloomPass(new T.Vector2(512, 512), 0.42, 0.45, 0.95);
if (!lite) composer.addPass(bloom);
composer.addPass(new OutputPass());
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uTime: shared.time },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + uTime) * 43758.5453); }
    void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = vUv - 0.5;
      c.rgb *= 1.0 - dot(d, d) * 0.9;
      c.rgb += (h(vUv * 800.0) - 0.5) * 0.025;
      gl_FragColor = c; }`,
});
composer.addPass(grade);

async function boot() {
  const m = await manifest();
  const ctx: Ctx = { scene, m, still, mobile, renderer };
  hdr('hdri/night.hdr', renderer, (env) => { scene.environment = env; scene.environmentIntensity = here?.env ?? 0.08; });
  const all = [buildBlock(ctx), ...ROOM_BUILDERS.map((b) => b(ctx))];
  const keep = new Set(clickables.map((c) => c.mesh));
  for (const r of all) { rooms.set(r.id, r); r.group.visible = false; r.group.userData.batched = batchStatic(r.group, keep); }
  for (const l of LINKS) {
    const A = rooms.get(l.a)!, B = rooms.get(l.b)!;
    const fa = A.doors[l.da], fb = B.doors[l.db];
    if (!fa || !fb) { console.warn('missing door', l); continue; }
    const p = new Portal(l.a, fa, l.b, fb, l.opts as PortalOpts);
    A.group.add(p.mesh); p.origin.copy(A.origin); p.mesh.position.sub(A.origin); // the quad lives in its room's group
    portals.push(p);
    if (l.both !== false) {
      const q = new Portal(l.b, fb, l.a, fa, { ...(l.opts as PortalOpts), ...(l.backOpts || {}) });
      B.group.add(q.mesh); q.origin.copy(B.origin); q.mesh.position.sub(B.origin);
      portals.push(q);
    }
  }
  ui();
  const start = params.get('room') && rooms.has(params.get('room')!) ? params.get('room')! : 'block';
  enter(rooms.get(start)!, true);
  const v = params.get('view');
  if (v !== null && here.views[+v]) jump(here.views[+v].at, here.views[+v].look);
  if (params.has('shot')) document.body.classList.add('shot');
  requestAnimationFrame(frame);
}

// ---------- rooms and visibility ----------
function show(id: string) {
  const prevVis = [...rooms.values()].map((r) => r.group.visible);
  const prevBg = scene.background, prevFog = scene.fog, prevEnv = scene.environmentIntensity;
  const r = rooms.get(id)!;
  scene.environmentIntensity = r.env ?? 0.08;
  for (const x of rooms.values()) x.group.visible = x === r;
  scene.background = r.bg; scene.fog = r.fog;
  focusThresholds(r.origin);
  mainOnly.forEach((o) => (o.visible = false));
  return () => {
    [...rooms.values()].forEach((x, i) => (x.group.visible = prevVis[i]));
    scene.background = prevBg; scene.fog = prevFog; scene.environmentIntensity = prevEnv;
    focusThresholds(here.origin);
    mainOnly.forEach((o) => (o.visible = true));
  };
}
const mainOnly: T.Object3D[] = [];
function enter(r: Room, first = false) {
  here = r;
  for (const x of rooms.values()) x.group.visible = x === r;
  scene.background = r.bg; scene.fog = r.fog;
  renderer.toneMappingExposure = r.exposure ?? 1;
  scene.environmentIntensity = r.env ?? 0.08;
  focusThresholds(r.origin);
  mainOnly.length = 0;
  r.group.traverse((o) => { if ((o as unknown as { isReflector?: boolean }).isReflector) mainOnly.push(o); });
  if (first) jump(r.spawn.at, r.spawn.look);
  $('#where').textContent = r.name;
  note(r.line);
  renderViews();
  document.querySelectorAll<HTMLButtonElement>('#rooms button').forEach((b) => b.classList.toggle('on', b.dataset.room === r.id));
}

// ---------- movement ----------
let yaw = 0, pitch = 0;
let fly: { from: T.Vector3; to: T.Vector3; y0: number; y1: number; p0: number; p1: number; t: number; d: number } | null = null;
const keys = new Set<string>(); const hold = { fwd: 0 };
function aim(at: T.Vector3, target: T.Vector3) { const d = target.clone().sub(at); return { y: Math.atan2(-d.x, -d.z), p: Math.atan2(d.y, Math.hypot(d.x, d.z)) }; }
function jump(at: T.Vector3, look: T.Vector3) { const l = aim(at, look); camera.position.copy(at); yaw = l.y; pitch = l.p; fly = null; camera.rotation.set(pitch, yaw, 0, 'YXZ'); wake(); }
function go(at: T.Vector3, look: T.Vector3) {
  if (still || at.distanceTo(camera.position) > 60) return jump(at, look);
  const l = aim(at, look); let dy = l.y - yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
  fly = { from: camera.position.clone(), to: at.clone(), y0: yaw, y1: yaw + dy, p0: pitch, p1: l.p, t: 0, d: Math.min(2.4, 0.8 + camera.position.distanceTo(at) * 0.08) };
  wake();
}
function canStand(r: Room, x: number, z: number) { return r.stand ? r.stand(x - r.origin.x, z - r.origin.z) : walkable(r.walk, r.block, x - r.origin.x, z - r.origin.z); }

addEventListener('keydown', (e) => {
  if ((e.target as HTMLElement).closest('input,textarea')) return;
  if (e.key === 'Escape') { $('#card').hidden = true; $('#all').hidden = true; }
  keys.add(e.key.toLowerCase()); wake();
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());
const el = renderer.domElement;
let down: { x: number; y: number; moved: number } | null = null;
el.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, moved: 0 }; el.setPointerCapture(e.pointerId); wake(); });
el.addEventListener('pointermove', (e) => {
  if (!down) return;
  const dx = e.clientX - down.x, dy = e.clientY - down.y;
  down.moved += Math.abs(dx) + Math.abs(dy); down.x = e.clientX; down.y = e.clientY;
  const k = e.pointerType === 'touch' ? 0.006 : 0.0042;
  yaw += dx * k; pitch = T.MathUtils.clamp(pitch + dy * k, -1.35, 1.35); fly = null; wake();
});
el.addEventListener('pointerup', (e) => { if (down && down.moved < 6) pick(e); down = null; });
const ray = new T.Raycaster(), ndc = new T.Vector2();
function pick(e: PointerEvent) {
  const r = el.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObject(here.group, true).filter((h) => (h.object as T.Mesh).isMesh && !(h.object as unknown as { isReflector?: boolean }).isReflector);
  const hit = hits[0]; if (!hit) return;
  const c = clickables.find((x) => x.mesh === hit.object);
  if (c) { const v = c.view(); go(v.at, v.look); card(c.piece); return; }
  const said = here.interact?.(hit.object); if (said) { note(said); return; }
  const portal = hit.object.userData.portal as Portal | undefined;
  if (portal && portal.o.walk) { // click a doorway: walk up to it and through
    const f = portal.a, ahead = new T.Vector3(0, 0, 1.2).applyAxisAngle(new T.Vector3(0, 1, 0), f.rotY).add(f.pos).setY(camera.position.y);
    go(ahead, f.pos.clone().setY(camera.position.y)); return;
  }
  // the floor: walk there
  const up = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : new T.Vector3(0, 1, 0);
  if (up.y > 0.7 && canStand(here, hit.point.x, hit.point.z)) {
    const to = new T.Vector3(hit.point.x, here.floorY(hit.point.x, hit.point.z, camera.position.y) + 1.65, hit.point.z);
    const l = aim(camera.position, to);
    go(to, to.clone().add(new T.Vector3(-Math.sin(l.y), Math.sin(pitch), -Math.cos(l.y))));
  }
}
for (const [id, dir] of [['#fwd', 1], ['#back', -1]] as const) {
  const b = $(id);
  const on = (e: Event) => { e.preventDefault(); hold.fwd = dir; wake(); }, off = () => { hold.fwd = 0; };
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
}

// ---------- UI ----------
let noteTimer = 0;
function note(t: string) { const n = $('#note'); n.textContent = t; n.classList.add('on'); clearTimeout(noteTimer); noteTimer = window.setTimeout(() => n.classList.remove('on'), 5200); }
addEventListener('inside-note', (e) => note((e as CustomEvent<string>).detail));
function renderViews() {
  const v = $('#views'); v.innerHTML = '';
  here.views.forEach((view, i) => {
    const b = document.createElement('button'); b.innerHTML = `<b>${String(i + 1).padStart(2, '0')}</b> ${view.name}`;
    b.onclick = () => { go(view.at, view.look); note(view.note); };
    v.appendChild(b);
  });
}
function ui() {
  const list = $('#rooms');
  for (const r of rooms.values()) {
    const b = document.createElement('button'); b.dataset.room = r.id; b.textContent = r.name;
    b.onclick = () => { enter(r, true); $('#map').hidden = true; };
    list.appendChild(b);
  }
  $('#mapbtn').onclick = () => { $('#map').hidden = !$('#map').hidden; };
  $('#map .x').onclick = () => { $('#map').hidden = true; };
  $('#allbtn').onclick = () => { index(); $('#all').hidden = false; };
  $('#all .x').onclick = () => { $('#all').hidden = true; };
  $('#card .x').onclick = () => { $('#card').hidden = true; };
}
function card(p: Piece) {
  const c = $('#card');
  c.querySelector('img')!.src = p.f;
  c.querySelector('h2')!.textContent = p.t;
  c.querySelector('.num')!.textContent = `NEW YORKERS No. ${p.n}${p.place ? ' . ' + p.place : ''}`;
  c.querySelector('p')!.textContent = p.story;
  (c.querySelector('a') as HTMLAnchorElement).href = `/n/${p.n}`;
  c.hidden = false;
}
function index() {
  const g = $('#all .grid'); if (g.childElementCount) return;
  const seen = new Set<number>();
  for (const c of clickables) {
    if (seen.has(c.piece.n)) continue; seen.add(c.piece.n);
    const a = document.createElement('a'); a.href = `/n/${c.piece.n}`; a.target = '_top';
    a.innerHTML = `<img src="${c.piece.f}" alt="" loading="lazy"><span>No. ${c.piece.n}</span><b></b>`;
    a.querySelector('b')!.textContent = c.piece.t; g.appendChild(a);
  }
}
loading.onChange = () => {
  const k = loading.total ? loading.done / loading.total : 0;
  ($('#bar i') as HTMLElement).style.width = `${Math.round(k * 100)}%`;
  if (k >= 0.999 || loading.done > 40) $('#curtain').classList.add('up');
};

// ---------- the frame ----------
let last = performance.now(), lastDraw = 0, lastInput = performance.now(), front = document.hasFocus(), frameNo = 0;
function wake() { lastInput = performance.now(); }
addEventListener('focus', () => { front = true; wake(); });
addEventListener('blur', () => { front = false; });
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h); composer.setSize(w, h); camera.aspect = w / h;
  camera.fov = w < h ? 74 : 62; camera.updateProjectionMatrix(); wake();
}
addEventListener('resize', resize); resize();
const fwd = new T.Vector3(), side = new T.Vector3(), prev = new T.Vector3(), frustum = new T.Frustum(), pv = new T.Matrix4();

function frame(now: number) {
  requestAnimationFrame(frame);
  const idle = now - lastInput > 20000 && !fly;
  const budget = !front && !params.has('shot') ? 160 : idle ? 32 : 15.5;
  if (now - lastDraw < budget) return;
  step(now);
}
function step(now: number) {
  lastDraw = now;
  renderer.info.reset();
  const dt = Math.min(0.25, (now - last) / 1000); last = now;
  const t = now / 1000;
  if (!still) { shared.time.value = t; interiorTime.value = t; }
  prev.copy(camera.position);
  // walking
  const k = keys, turn = (k.has('arrowleft') || k.has('q') ? 1 : 0) - (k.has('arrowright') || k.has('e') ? 1 : 0);
  yaw += turn * dt * 1.7;
  const ahead = (k.has('w') || k.has('arrowup') ? 1 : 0) - (k.has('s') || k.has('arrowdown') ? 1 : 0) + hold.fwd;
  const strafe = (k.has('d') ? 1 : 0) - (k.has('a') ? 1 : 0);
  if (ahead || strafe) {
    fly = null;
    const sp = (k.has('shift') ? 5.2 : 2.8) * dt;
    fwd.set(-Math.sin(yaw), 0, -Math.cos(yaw)); side.set(Math.cos(yaw), 0, -Math.sin(yaw));
    const nx = camera.position.x + fwd.x * ahead * sp + side.x * strafe * sp, nz = camera.position.z + fwd.z * ahead * sp + side.z * strafe * sp;
    if (canStand(here, nx, nz)) { camera.position.x = nx; camera.position.z = nz; }
    else if (canStand(here, nx, camera.position.z)) camera.position.x = nx;
    else if (canStand(here, camera.position.x, nz)) camera.position.z = nz;
    wake();
  }
  if (fly) {
    fly.t = Math.min(1, fly.t + dt / fly.d);
    const s = fly.t < 0.5 ? 4 * fly.t ** 3 : 1 - (-2 * fly.t + 2) ** 3 / 2;
    camera.position.lerpVectors(fly.from, fly.to, s);
    yaw = fly.y0 + (fly.y1 - fly.y0) * s; pitch = fly.p0 + (fly.p1 - fly.p0) * s;
    if (fly.t >= 1) fly = null;
  }
  // stand on the floor (stairs, the stoop, the roll)
  if (!fly) {
    const fy = here.floorY(camera.position.x, camera.position.z, camera.position.y) + 1.65;
    camera.position.y += (fy - camera.position.y) * Math.min(1, dt * 14);
  }
  // portals: did we step through one?
  for (const p of portals) {
    if (p.fromRoom !== here.id) continue;
    const now3 = camera.position.clone();
    if (p.cross(prev, now3)) {
      camera.position.copy(now3); yaw += p.dYaw;
      if (fly) { fly = null; }
      enter(rooms.get(p.toRoom)!);
      break;
    }
  }
  const carried = here.carry?.(camera); if (carried) note(carried);
  camera.rotation.set(pitch, yaw, 0, 'YXZ');
  camera.updateMatrixWorld();
  // rooms tick (the one you are in, and any a portal will draw)
  for (const r of rooms.values()) r.tick(t, dt, camera, r === here);
  // portal passes: the nearest two that are in view, plus every portal within reach every other frame
  pv.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); frustum.setFromProjectionMatrix(pv);
  const want = portals.filter((p) => p.fromRoom === here.id).map((p) => ({ p, w: p.wants(camera, frustum) })).filter((x) => x.w > 0).sort((a, b) => b.w - a.w);
  frameNo++;
  const budgetPasses = mobile ? 1 : 2;
  want.slice(0, budgetPasses).forEach(({ p }) => p.render(renderer, scene, camera, show));
  want.slice(budgetPasses).forEach(({ p }, i) => { if ((frameNo + i) % 6 === 0) p.render(renderer, scene, camera, show); });
  composer.render(dt);
  const info = renderer.info.render;
  el.dataset.renderStats = JSON.stringify({ room: here.id, calls: info.calls, triangles: info.triangles, portals: want.length, textures: renderer.info.memory.textures, geometries: renderer.info.memory.geometries });
  const hud = here.hud?.(); $('#hud').textContent = hud || '';
}

(window as unknown as Record<string, unknown>).inside = {
  // advance(ms, key): run the world without requestAnimationFrame (headless review; a hidden tab gets no frames)
  advance(ms: number, key?: string) { if (key) keys.add(key); const t0 = last; for (let t = 16; t <= ms; t += 16) step(t0 + t); if (key) keys.delete(key); return { at: camera.position.toArray(), room: here.id }; },
  rooms, portals, camera, go, jump, enter: (id: string) => enter(rooms.get(id)!, true), loading, THREE: T, scene,
  view: (i: number) => { const v = here.views[i]; if (v) jump(v.at, v.look); },
};
boot();
