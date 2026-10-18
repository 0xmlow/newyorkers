import * as T from 'three';
import { buildUnreal, constrainUnreal, prepareUnrealReflections } from './unreal';
import { constrainSoho } from './soho';

// DEPARTMENT OF UNREAL ESTATE: the ChatGPT venue (fictional SoHo loft) as its own page on n3wyorkers.com.
// Walk, look, click art, jump to the four installation viewpoints, page through four sets of twelve New Yorkers.

type Art = { number: number; title: string; story: string; aspect: number; file: string; set: string; place: string };
const $ = <E extends HTMLElement>(s: string) => document.querySelector(s) as E;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const v = (x: number, y: number, z: number) => new T.Vector3(x, y, z);

// Twelve bays, the same mounts as the ChatGPT route (soho/unreal in next-rooms.ts).
const MOUNTS = Array.from({ length: 12 }, (_, i) => {
  const right = i % 2 === 1, z = 6 - Math.floor(i / 2) * 4.65;
  return { pos: v(right ? 6.86 : -3.6, 1.87, z), rot: right ? -Math.PI / 2 : Math.PI / 2, target: v(right ? 3.05 : -0.5, 1.65, z), w: 2.45, h: 2.55 };
});
const SPAWN = v(1, 1.65, 6.9), SPAWN_LOOK = v(0, 1.95, -15);
// The four installations. 04 now stands in the aisle, where the bands slide as you walk, not jammed against a painting.
const VIEWS: { name: string; note: string; at: T.Vector3; look: T.Vector3 }[] = [
  { name: 'Everything bagel', note: 'Includes your security deposit.', at: v(1.25, 1.65, 0.9), look: v(1.25, 1.8, -2.9) },
  { name: 'Infinite studio', note: 'Seven metres of tunnel. It reads as forty.', at: v(0, 1.65, -17.5), look: v(0, 1.5, -25) },
  { name: 'Circle back', note: 'Stand on the yellow ring. Look up. Step off and it breaks.', at: v(1, 1.65, -7), look: v(1, 2.7, -13) },
  { name: 'The commute', note: 'Walk left and right. The bands move, the slats do not.', at: v(2.2, 1.65, -16.6), look: v(4.6, 1.85, -21.8) },
];

const canvasHost = $('#scene');
let arts: Art[] = [];
let set = 0;

const renderer = (() => {
  try { return new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); }
  catch { return null; }
})();

if (!renderer) {
  document.body.classList.add('nogl');
} else start(renderer);

function start(renderer: T.WebGLRenderer) {
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(55, 1, 0.1, 180);
  // POWER policy (HANDOFF_POWER_2026-10-12.md): pixel ratio 1.5, 60 fps active, 30 idle, 6 when not in front.
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  canvasHost.appendChild(renderer.domElement);

  const world = buildUnreal(scene);
  prepareUnrealReflections(scene, renderer);

  // the hang
  const loader = new T.TextureLoader();
  const frameMat = new T.MeshStandardMaterial({ color: 0x292824, metalness: 0.9, roughness: 0.28 });
  const panels: { mesh: T.Mesh; mat: T.MeshBasicMaterial; group: T.Group; frame: T.Mesh }[] = MOUNTS.map((m, i) => {
    const group = new T.Group();
    group.position.copy(m.pos); group.rotation.y = m.rot; scene.add(group);
    const frame = new T.Mesh(new T.BoxGeometry(1, 1, 0.13), frameMat); frame.castShadow = true; group.add(frame);
    const mat = new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
    const mesh = new T.Mesh(new T.PlaneGeometry(1, 1), mat); mesh.position.z = 0.08; mesh.userData.slot = i; group.add(mesh);
    return { mesh, mat, group, frame };
  });
  const textures = new Map<string, T.Texture>();
  function hang() {
    const shown = arts.slice(set * 12, set * 12 + 12);
    shown.forEach((a, i) => {
      const m = MOUNTS[i], w = Math.min(m.w, m.h * a.aspect), h = w / a.aspect, p = panels[i];
      p.mesh.scale.set(w, h, 1); p.frame.scale.set(w + 0.25, h + 0.25, 1);
      const have = textures.get(a.file);
      if (have) { p.mat.map = have; p.mat.needsUpdate = true; return; }
      p.mat.map = null; p.mat.color.set(0xe9e4d8); p.mat.needsUpdate = true;
      loader.load(a.file, (t) => {
        t.colorSpace = T.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy();
        textures.set(a.file, t);
        if (arts[set * 12 + i] === a) { p.mat.map = t; p.mat.color.set(0xffffff); p.mat.needsUpdate = true; }
      });
    });
    $('#setname').textContent = `${String(set + 1).padStart(2, '0')} / ${shown[0]?.set ?? ''}`;
    strip();
    wake();
  }

  // movement
  camera.position.copy(SPAWN); camera.lookAt(SPAWN_LOOK);
  const e0 = new T.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
  let yaw = e0.y, pitch = e0.x;
  let fly: { from: T.Vector3; to: T.Vector3; via: T.Vector3; y0: number; y1: number; p0: number; p1: number; t: number; d: number } | null = null;
  const keys = new Set<string>();
  const hold = { fwd: 0 };
  function look(at: T.Vector3, target: T.Vector3) {
    const d = target.clone().sub(at);
    return { y: Math.atan2(-d.x, -d.z), p: Math.atan2(d.y, Math.hypot(d.x, d.z)) };
  }
  function go(at: T.Vector3, target: T.Vector3) {
    const l = look(at, target);
    if (reduced) { camera.position.copy(at); yaw = l.y; pitch = l.p; fly = null; wake(); return; }
    let dy = l.y - yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    // a flight never passes through the bagel: if the straight line crosses its plinth, bend round the nearer aisle
    const from = camera.position.clone(), via = from.clone().lerp(at, 0.5);
    for (let i = 0; i <= 20; i++) {
      const q = from.clone().lerp(at, i / 20);
      if (q.x > -0.4 && q.x < 2.9 && q.z > -4.4 && q.z < -1.4) { via.x = via.x < 1.25 ? -1.6 : 4.2; via.z = -2.9; break; }
    }
    fly = { from, to: at.clone(), via, y0: yaw, y1: yaw + dy, p0: pitch, p1: l.p, t: 0,
            d: Math.min(2.4, 0.7 + camera.position.distanceTo(at) * 0.09) };
    wake();
  }
  function constrain(p: T.Vector3) { constrainSoho(p); constrainUnreal(p); }

  addEventListener('keydown', (e) => {
    if ((e.target as HTMLElement).closest('input,textarea')) return;
    if (e.key === 'Escape') closeCard();
    keys.add(e.key.toLowerCase()); wake();
  });
  addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  addEventListener('blur', () => keys.clear());

  // drag to look, tap to pick (a painting opens its card, the floor walks you there)
  const el = renderer.domElement;
  let down: { x: number; y: number; moved: number } | null = null;
  el.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, moved: 0 }; el.setPointerCapture(e.pointerId); wake(); });
  el.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    down.moved += Math.abs(dx) + Math.abs(dy); down.x = e.clientX; down.y = e.clientY;
    const k = e.pointerType === 'touch' ? 0.006 : 0.0042;
    yaw += dx * k; pitch = T.MathUtils.clamp(pitch + dy * k, -1.2, 1.2); fly = null; wake();
  });
  el.addEventListener('pointerup', (e) => { if (down && down.moved < 6) pick(e); down = null; });
  const ray = new T.Raycaster(), ndc = new T.Vector2();
  function pick(e: PointerEvent) {
    const r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(scene.children, true)[0];
    if (!hit) return;
    const slot = panels.findIndex((p) => p.mesh === hit.object);
    if (slot >= 0) { focus(slot); openCard(slot); return; }
    if (hit.point.y < 0.12) { // the floor: walk there
      const to = v(hit.point.x, 1.65, hit.point.z); constrain(to);
      const l = look(camera.position, v(to.x, 1.65, to.z));
      go(to, v(to.x - Math.sin(l.y), 1.65 + Math.sin(pitch), to.z - Math.cos(l.y)));
    }
  }
  function focus(slot: number) { go(MOUNTS[slot].target, MOUNTS[slot].pos); }

  // on screen walk buttons for touch
  for (const [id, dir] of [['#fwd', 1], ['#back', -1]] as const) {
    const b = $(id);
    const on = (e: Event) => { e.preventDefault(); hold.fwd = dir; wake(); };
    const off = () => { hold.fwd = 0; };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
  }

  // UI: viewpoints, sets, strip, card
  const vlist = $('#views');
  VIEWS.forEach((view, i) => {
    const b = document.createElement('button');
    b.innerHTML = `<b>0${i + 1}</b> ${view.name}`;
    b.onclick = () => { go(view.at, view.look); vlist.querySelectorAll('button').forEach((x, j) => x.classList.toggle('on', i === j)); note(view.note); };
    vlist.appendChild(b);
  });
  $('#home').onclick = () => { go(SPAWN, SPAWN_LOOK); vlist.querySelectorAll('button').forEach((x) => x.classList.remove('on')); };
  $('#prev').onclick = () => { set = (set + 3) % 4; hang(); };
  $('#next').onclick = () => { set = (set + 1) % 4; hang(); };
  function strip() {
    const s = $('#strip'); s.innerHTML = '';
    arts.slice(set * 12, set * 12 + 12).forEach((a, i) => {
      const b = document.createElement('button');
      b.innerHTML = `<img src="${a.file}" alt="" loading="lazy"><span>${String(i + 1).padStart(2, '0')}</span>`;
      b.title = a.title; b.setAttribute('aria-label', `Walk to ${a.title}`);
      b.onclick = () => { focus(i); openCard(i); };
      s.appendChild(b);
    });
  }
  let noteTimer = 0;
  function note(t: string) { const n = $('#note'); n.textContent = t; n.classList.add('on'); clearTimeout(noteTimer); noteTimer = setTimeout(() => n.classList.remove('on'), 4200); }

  // main loop with the POWER throttle
  let last = performance.now(), lastDraw = 0, lastInput = performance.now(), front = document.hasFocus();
  function wake() { lastInput = performance.now(); }
  addEventListener('focus', () => { front = true; wake(); });
  addEventListener('blur', () => { front = false; });
  function resize() {
    const w = canvasHost.clientWidth, h = canvasHost.clientHeight;
    renderer.setSize(w, h); camera.aspect = w / h;
    camera.fov = w < h ? 68 : 55; camera.updateProjectionMatrix(); wake();
  }
  addEventListener('resize', resize); resize();
  const fwd = new T.Vector3(), side = new T.Vector3();
  function frame(now: number) {
    requestAnimationFrame(frame);
    const idle = now - lastInput > 20000 && !fly;
    const budget = !front ? 160 : idle ? 32 : 15.5;
    if (now - lastDraw < budget) return;
    lastDraw = now;
    const dt = Math.min(0.25, (now - last) / 1000); last = now;
    // keys
    const k = keys, turn = (k.has('arrowleft') || k.has('q') ? 1 : 0) - (k.has('arrowright') || k.has('e') ? 1 : 0);
    yaw += turn * dt * 1.6;
    const ahead = (k.has('w') || k.has('arrowup') ? 1 : 0) - (k.has('s') || k.has('arrowdown') ? 1 : 0) + hold.fwd;
    const strafe = (k.has('d') ? 1 : 0) - (k.has('a') ? 1 : 0);
    if (ahead || strafe) {
      fly = null;
      const speed = (k.has('shift') ? 4.2 : 2.4) * dt;
      fwd.set(-Math.sin(yaw), 0, -Math.cos(yaw)); side.set(Math.cos(yaw), 0, -Math.sin(yaw));
      camera.position.addScaledVector(fwd, ahead * speed).addScaledVector(side, strafe * speed);
      constrain(camera.position); camera.position.y = 1.65; wake();
    }
    if (fly) {
      fly.t = Math.min(1, fly.t + dt / fly.d);
      const s = fly.t < 0.5 ? 4 * fly.t ** 3 : 1 - (-2 * fly.t + 2) ** 3 / 2;
      camera.position.set(0, 0, 0)
        .addScaledVector(fly.from, (1 - s) * (1 - s)).addScaledVector(fly.via, 2 * s * (1 - s)).addScaledVector(fly.to, s * s);
      yaw = fly.y0 + (fly.y1 - fly.y0) * s; pitch = fly.p0 + (fly.p1 - fly.p0) * s;
      if (fly.t >= 1) fly = null;
    }
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
    world.tick(now / 1000);
    renderer.render(scene, camera);
    const info = renderer.info.render;
    renderer.domElement.dataset.renderStats = JSON.stringify({ calls: info.calls, triangles: info.triangles });
  }
  requestAnimationFrame(frame);
  (window as unknown as Record<string, unknown>).unreal = { go: (i: number) => go(VIEWS[i].at, VIEWS[i].look),
    // jump(i): no flight, for headless review (a hidden pane starves requestAnimationFrame)
    jump: (i: number) => { const l = look(VIEWS[i].at, VIEWS[i].look); camera.position.copy(VIEWS[i].at); yaw = l.y; pitch = l.p; fly = null; camera.rotation.set(pitch, yaw, 0, 'YXZ'); renderer.render(scene, camera); }, focus, camera, set: (n: number) => { set = n; hang(); } };

  fetch('art.json').then((r) => r.json()).then((a: Art[]) => { arts = a; hang(); index(); });
  // ?shot=N : no interface, standing at viewpoint N (or the entrance for -1), for stills (tools/shots.sh)
  const shot = new URLSearchParams(location.search).get('shot');
  if (shot !== null) {
    document.body.classList.add('shot');
    const n = +shot;
    if (n >= 0) { const l = look(VIEWS[n].at, VIEWS[n].look); camera.position.copy(VIEWS[n].at); yaw = l.y; pitch = l.p; }
  }
}

// the card and the plain index: every work reachable without WebGL
function openCard(slot: number) {
  const a = arts[set * 12 + slot]; if (!a) return;
  const c = $('#card');
  c.querySelector('img')!.src = a.file;
  c.querySelector('h2')!.textContent = a.title;
  c.querySelector('.num')!.textContent = `NEW YORKERS No. ${a.number}${a.place ? ' . ' + a.place : ''}`;
  c.querySelector('p')!.textContent = a.story;
  (c.querySelector('a') as HTMLAnchorElement).href = `/n/${a.number}`;
  c.hidden = false;
}
function closeCard() { $('#card').hidden = true; }
$('#card .x').addEventListener('click', closeCard);
$('#allbtn').addEventListener('click', () => { $('#all').hidden = false; });
$('#all .x').addEventListener('click', () => { $('#all').hidden = true; });
function index() {
  const g = $('#all .grid'); g.innerHTML = '';
  let cur = '';
  for (const a of arts) {
    if (a.set !== cur) { cur = a.set; const h = document.createElement('h3'); h.textContent = cur; g.appendChild(h); }
    const el = document.createElement('a');
    el.href = `/n/${a.number}`; el.target = '_top';
    el.innerHTML = `<img src="${a.file}" alt="" loading="lazy"><span>No. ${a.number}</span><b></b>`;
    el.querySelector('b')!.textContent = a.title;
    g.appendChild(el);
  }
}
if (!renderer) fetch('art.json').then((r) => r.json()).then((a: Art[]) => { arts = a; index(); $('#all').hidden = false; });
