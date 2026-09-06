/* NEW YORKERS · THE MUSEUM. Twenty one walkable New York rooms hung with the census. */
import * as T from 'three';
import { Kit } from './kit';
import { P, C, ERAS, FAMILIES, SETS, thumb, fmt, era, hangList, hangLabel, atlasLoader, perAtlas, wallStart, placeCount, indexOf, DAY, CLOCK, HOUR, MINT } from './data';
import type { Hang, Piece } from './data';
import { ROOMS } from './rooms';
import type { RoomBuild } from './rooms/types';

const $ = <E extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as E;
const esc = (s: string) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
const touch = matchMedia('(pointer: coarse)').matches;
const params = new URLSearchParams(location.search);
const quality: 'high' | 'low' = params.get('q') === 'low' || (touch && innerWidth < 900) || (navigator.hardwareConcurrency || 8) <= 4 ? 'low' : 'high';
const reduced = () => reducedQuery.matches || params.get('motion') === 'off';

type State = { room: number; hang: Hang; page: number; active: number; tour: boolean };
const state: State = { room: 0, hang: { mode: 'place' }, page: 0, active: -1, tour: false };
let renderer: T.WebGLRenderer | null = null;
let kit: Kit | null = null;
let scene: T.Scene | null = null;
let camera: T.PerspectiveCamera;
let build: RoomBuild | null = null;
let list: Piece[] = [];
let shown: Piece[] = [];
let mountsFilled: T.Group[] = [];
let frame = 0;
const atlas = atlasLoader(quality);

/* ---------- hash ---------- */
function readHash() {
  const h = new URLSearchParams(location.hash.replace(/^#/, ''));
  const r = ROOMS.findIndex((x) => x.id === (MINT.room || h.get('room')));
  if (r >= 0) state.room = r;
  const hang = h.get('hang');
  if (hang) {
    const [mode, ...rest] = hang.split(':');
    state.hang = { mode: mode as Hang['mode'], key: rest.join(':') || undefined };
  }
  state.page = Math.max(0, Number(h.get('page') || 0) - 1 || 0);
  return h.get('n');
}
function writeHash() {
  const h = new URLSearchParams();
  h.set('room', ROOMS[state.room].id);
  if (state.hang.mode !== 'place') h.set('hang', state.hang.mode + (state.hang.key ? ':' + state.hang.key : ''));
  if (state.page) h.set('page', String(state.page + 1));
  history.replaceState(null, '', '#' + h.toString());
}

/* ---------- renderer ---------- */
function makeRenderer() {
  const host = $('#world');
  const r = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(devicePixelRatio, quality === 'high' ? 1.75 : 1.2));
  r.setSize(host.clientWidth, host.clientHeight);
  r.outputColorSpace = T.SRGBColorSpace;
  r.toneMapping = T.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.05;
  if (quality === 'high') {
    r.shadowMap.enabled = true;
    r.shadowMap.type = T.PCFSoftShadowMap;
  }
  host.appendChild(r.domElement);
  camera = new T.PerspectiveCamera(62, host.clientWidth / host.clientHeight, 0.1, 1200);
  addEventListener('resize', () => {
    camera.aspect = host.clientWidth / host.clientHeight;
    camera.updateProjectionMatrix();
    r.setSize(host.clientWidth, host.clientHeight);
  });
  return r;
}

/* ---------- camera + movement ---------- */
let yaw = 0,
  pitch = 0,
  pathIndex = 0,
  targetPath = 0,
  goal: T.Vector3 | null = null,
  lookGoal: T.Vector3 | null = null;
const keys = new Set<string>();
const touchDir = { f: 0, s: 0 };
function constrain() {
  if (!build) return;
  const [minX, maxX, minZ, maxZ] = build.bounds;
  camera.position.x = T.MathUtils.clamp(camera.position.x, minX, maxX);
  camera.position.z = T.MathUtils.clamp(camera.position.z, minZ, maxZ);
  for (const k of kit!.keepOut) {
    const dx = camera.position.x - k.x,
      dz = camera.position.z - k.z,
      d = Math.hypot(dx, dz);
    if (d < k.r && d > 0.0001) {
      camera.position.x = k.x + (dx / d) * k.r;
      camera.position.z = k.z + (dz / d) * k.r;
    }
  }
  for (const b of kit!.blocks) {
    const { x, z } = camera.position;
    if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1) {
      const dx0 = x - b.x0, dx1 = b.x1 - x, dz0 = z - b.z0, dz1 = b.z1 - z;
      const m = Math.min(dx0, dx1, dz0, dz1);
      if (m === dx0) camera.position.x = b.x0;
      else if (m === dx1) camera.position.x = b.x1;
      else if (m === dz0) camera.position.z = b.z0;
      else camera.position.z = b.z1;
    }
  }
  camera.position.y = (build.floorY ? build.floorY(camera.position.x, camera.position.z) : 0) + build.eye;
}
function placeOnPath() {
  const p = build!.path!;
  const lo = Math.floor(pathIndex),
    hi = Math.min(lo + 1, p.length - 1);
  camera.position.lerpVectors(p[lo], p[hi], pathIndex - lo);
}
function focus(n: number) {
  if (!build || !build.mounts[n]) return;
  const m = build.mounts[n];
  goal = m.target.clone();
  lookGoal = (m.lookAt || m.position).clone();
  if (build.path) targetPath = nearestPath(goal);
  state.active = n;
  paintStrip();
}
function nearestPath(p: T.Vector3) {
  const path = build!.path!;
  let best = 0,
    bd = Infinity;
  path.forEach((q, i) => {
    const d = q.distanceToSquared(p);
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  return best;
}
function home() {
  if (!build) return;
  goal = build.spawn.clone();
  lookGoal = build.look.clone();
  targetPath = 0;
  state.active = -1;
  paintStrip();
}
function step(dir: number) {
  if (!build) return;
  goal = null;
  if (build.path) {
    pathIndex = T.MathUtils.clamp(pathIndex + dir * 4, 0, build.path.length - 1);
    placeOnPath();
  } else {
    camera.translateZ(-dir * 3);
    constrain();
  }
}

function bindControls(canvas: HTMLCanvasElement) {
  let drag = false,
    lastX = 0,
    lastY = 0,
    moved = 0;
  canvas.addEventListener('pointerdown', (e) => {
    drag = true;
    lastX = e.clientX;
    lastY = e.clientY;
    moved = 0;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - lastX,
      dy = e.clientY - lastY;
    moved += Math.abs(dx) + Math.abs(dy);
    yaw -= dx * 0.0042;
    pitch = T.MathUtils.clamp(pitch - dy * 0.0032, -0.9, 0.9);
    lastX = e.clientX;
    lastY = e.clientY;
    goal = null;
  });
  canvas.addEventListener('pointerup', (e) => {
    drag = false;
    if (moved > 7 || !kit) return;
    const rect = canvas.getBoundingClientRect(),
      ray = new T.Raycaster();
    ray.setFromCamera(new T.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, (-(e.clientY - rect.top) / rect.height) * 2 + 1), camera);
    const hit = ray.intersectObjects(kit.clickables, false)[0];
    if (!hit) return;
    const u = hit.object.userData;
    if (u.piece) {
      if (u.mountIndex != null) state.active = u.mountIndex;
      openDetail(u.piece as Piece);
    } else if (u.tiles && hit.faceIndex != null) {
      const gi = u.tiles[Math.floor(hit.faceIndex / 2)];
      if (P[gi]) openDetail(P[gi]);
    }
  });
  canvas.addEventListener('wheel', (e) => {
    if (!build) return;
    e.preventDefault();
    step(e.deltaY < 0 ? 0.5 : -0.5);
  }, { passive: false });
  addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('input,textarea,[contenteditable]')) return;
    if (e.key === 'Escape') {
      closePanels();
      return;
    }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D', 'Shift'].includes(e.key)) {
      e.preventDefault();
      keys.add(e.key.toLowerCase());
      goal = null;
    }
    if (e.key === 'Tab' && build) {
      e.preventDefault();
      focus((state.active + (e.shiftKey ? -1 : 1) + build.mounts.length) % build.mounts.length);
    }
    if (e.key === 'Enter' && state.active >= 0 && shown[state.active] && !$('#detail').classList.contains('open')) openDetail(shown[state.active]);
    if (e.key === 'h' || e.key === 'H') home();
  });
  addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  addEventListener('blur', () => keys.clear());
  for (const [id, f, s] of [['#padF', 1, 0], ['#padB', -1, 0], ['#padL', 0, -1], ['#padR', 0, 1]] as const) {
    const el = $(id);
    const on = () => { touchDir.f = f; touchDir.s = s; goal = null; };
    const off = () => { touchDir.f = 0; touchDir.s = 0; };
    el.addEventListener('pointerdown', on);
    el.addEventListener('pointerup', off);
    el.addEventListener('pointercancel', off);
    el.addEventListener('pointerleave', off);
  }
}

/* ---------- the loop ---------- */
let prev = performance.now();
function animate(now: number) {
  frame = requestAnimationFrame(animate);
  if (!renderer || !scene || !build || !kit) return;
  const dt = Math.min((now - prev) / 1000, 0.05);
  prev = now;
  if (goal && lookGoal) {
    if (build.path) {
      pathIndex += (targetPath - pathIndex) * (1 - Math.exp(-dt * 2.2));
      if (Math.abs(pathIndex - targetPath) < 0.02) pathIndex = targetPath;
      placeOnPath();
    } else camera.position.lerp(goal, 1 - Math.exp(-dt * 3));
    const m = new T.Matrix4().lookAt(camera.position, lookGoal, new T.Vector3(0, 1, 0));
    camera.quaternion.slerp(new T.Quaternion().setFromRotationMatrix(m), 1 - Math.exp(-dt * 4));
    const e = new T.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    yaw = e.y;
    pitch = e.x;
    if (build.path ? Math.abs(pathIndex - targetPath) < 0.02 : camera.position.distanceTo(goal) < 0.03) goal = null;
    if (!build.path) constrain();
  } else {
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
    const run = keys.has('shift') ? 1.8 : 1;
    const f = (keys.has('w') || keys.has('arrowup') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') ? 1 : 0) + touchDir.f;
    const s = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0) + touchDir.s;
    if (build.path) {
      if (f) {
        pathIndex = T.MathUtils.clamp(pathIndex + f * dt * 18 * run, 0, build.path.length - 1);
        placeOnPath();
      }
    } else if (f || s) {
      const speed = dt * 7 * run;
      const dir = new T.Vector3(s, 0, -f).normalize().applyAxisAngle(new T.Vector3(0, 1, 0), yaw);
      camera.position.addScaledVector(dir, speed);
      constrain();
    }
  }
  if (!reduced()) kit.tick(now / 1000, dt);
  renderer.render(scene, camera);
  if (params.has('debug')) $('#debug').textContent = `calls ${renderer.info.render.calls} · tris ${(renderer.info.render.triangles / 1000).toFixed(0)}k · tex ${renderer.info.memory.textures} · geo ${renderer.info.memory.geometries}`;
}

/* ---------- rooms ---------- */
function loadRoom(openN?: string | null): Promise<void> {
  const def = ROOMS[state.room];
  $('#loading').textContent = 'BUILDING ' + def.area;
  $('#loading').classList.add('show');
  return new Promise((done) => setTimeout(() => {
    if (kit) kit.dispose();
    kit = null;
    scene = new T.Scene();
    const dynamic = def.daylit !== false && !params.has('fixed');
    kit = new Kit(scene, { renderer: renderer!, quality, reduced: reduced(), atlas, atlasGrid: C.atlasGrid, perAtlas, hour: HOUR, dynamic });
    list = hangList(state.hang, def.id);
    const ctx = { pieces: list, all: P, thumb, reduced: reduced(), quality, wallStart };
    build = def.build(kit, ctx);
    const n = build.mounts.length;
    const pages = Math.max(1, Math.ceil(list.length / n));
    state.page = Math.min(state.page, pages - 1);
    shown = list.slice(state.page * n, state.page * n + n);
    mountsFilled = [];
    shown.forEach((p, i) => {
      const m = build!.mounts[i];
      const er = era(p);
      const cap = [fmt(p), p.t.length > 44 ? p.t.slice(0, 43) + '…' : p.t, `ERA ${er?.roman || p.e} · ${p.f.toUpperCase()} · ${(p.nb || p.b || '').toUpperCase()}`];
      mountsFilled.push(kit!.hang(m, p, m.style || build!.style, i, thumb(p), cap));
    });
    kit.batch();
    camera.position.copy(build.spawn);
    camera.lookAt(build.look);
    const e = new T.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    yaw = e.y;
    pitch = e.x;
    pathIndex = targetPath = 0;
    goal = null;
    state.active = -1;
    paintHud(pages);
    writeHash();
    $('#loading').classList.remove('show');
    if (openN) {
      const p = P[indexOf.get(openN) ?? -1];
      if (p) openDetail(p);
    }
    done();
  }, 30));
}
function setRoom(i: number) {
  state.room = i;
  state.page = 0;
  state.tour = false;
  return loadRoom();
}
function setHang(h: Hang) {
  state.hang = h;
  state.page = 0;
  loadRoom();
}
function setPage(p: number) {
  state.page = p;
  loadRoom();
}

/* ---------- HUD ---------- */
function paintHud(pages: number) {
  const def = ROOMS[state.room];
  $('#roomArea').textContent = def.area;
  $('#roomName').textContent = def.name;
  $('#roomMood').textContent = def.mood.toUpperCase() + ' · NYC ' + String(state.room + 1).padStart(2, '0') + ' / ' + ROOMS.length;
  $('#hangLabel').textContent = hangLabel(state.hang, def.area);
  $('#dyn').textContent = `${DAY} · ${CLOCK} NEW YORK · ${def.daylit === false ? 'FIXED HOUR' : kit && kit.night > 0.5 ? 'NIGHT LIGHT' : kit && kit.dusk > 0.3 ? 'DUSK LIGHT' : 'DAYLIGHT'} · HANG OF THE DAY`;
  $('#pageLabel').innerHTML = `${String(state.page + 1).padStart(2, '0')}<small> / ${String(pages).padStart(2, '0')}</small>`;
  ($('#pagePrev') as HTMLButtonElement).disabled = state.page === 0;
  ($('#pageNext') as HTMLButtonElement).disabled = state.page >= pages - 1;
  $('#hint').textContent = touch
    ? (build?.path ? 'DRAG TO LOOK · PAD FOLLOWS THE ROUTE · TAP A WORK' : 'DRAG TO LOOK · PAD TO WALK · TAP A WORK')
    : (build?.path ? 'DRAG TO LOOK · W/S FOLLOW THE ROUTE · CLICK A WORK' : 'DRAG TO LOOK · WASD TO WALK · CLICK A WORK');
  $('#count').textContent = `${list.length.toLocaleString('en-US')} WORKS IN THIS HANG · ${C.pieces.toLocaleString('en-US')} IN THE CENSUS`;
  paintStrip();
  document.title = `NEW YORKERS · The Museum · ${def.area}`;
}
function paintStrip() {
  const el = $('#strip');
  el.innerHTML = shown.map((p, i) => `<button class="${state.active === i ? 'on' : ''}" data-i="${i}" aria-label="Go to ${esc(p.t)}"><img loading="lazy" src="${thumb(p)}" alt=""><span>${String(p.n).padStart(4, '0')}</span></button>`).join('');
  el.querySelectorAll('button').forEach((b) => (b.onclick = () => focus(Number(b.dataset.i))));
  const on = el.querySelector('button.on') as HTMLElement | null;
  on?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
}

function closePanels() {
  document.querySelectorAll('.panel.open').forEach((p) => p.classList.remove('open'));
  $('#detail').classList.remove('open');
}
function openPanel(id: string) {
  const was = $(id).classList.contains('open');
  closePanels();
  if (!was) $(id).classList.add('open');
}

/* ---------- detail ---------- */
function openDetail(p: Piece) {
  const er = era(p);
  const d = $('#detail');
  d.querySelector('img')!.setAttribute('src', thumb(p));
  $('#dNum').textContent = fmt(p);
  $('#dTitle').textContent = p.t;
  $('#dMeta').innerHTML = `ERA ${er?.roman || p.e} · ${esc(er?.title || '')}<br>${esc(p.f.toUpperCase())} · ${esc((p.b || '').toUpperCase())}${p.nb ? ' · ' + esc(p.nb.toUpperCase()) : ''}${p.inf ? ' <i>(place inferred from the scene)</i>' : ''}${p.set ? '<br>SET · ' + esc(p.set.toUpperCase()) : ''}`;
  $('#dStory').textContent = p.story || '';
  ($('#dRecord') as HTMLAnchorElement).href = `census.html#n=${p.id}`;
  ($('#dAtlas') as HTMLAnchorElement).href = `map.html#p=${p.id}`;
  const i = shown.indexOf(p);
  const go = $('#dGo') as HTMLButtonElement;
  go.hidden = i < 0;
  go.onclick = () => {
    focus(i);
    d.classList.remove('open');
  };
  const hangHere = $('#dHang') as HTMLButtonElement;
  hangHere.hidden = i >= 0;
  hangHere.onclick = () => {
    const gi = list.indexOf(p);
    if (gi >= 0) {
      d.classList.remove('open');
      setPage(Math.floor(gi / build!.mounts.length));
      setTimeout(() => focus(gi % build!.mounts.length), 400);
    } else {
      setHang({ mode: 'search', key: String(p.n) });
      d.classList.remove('open');
    }
  };
  d.classList.add('open');
}

/* ---------- panels ---------- */
function buildPanels() {
  $('#destGrid').innerHTML = ROOMS.map((r, i) => `<button data-i="${i}" style="--c:${r.color}"><div class="top"><span>${String(i + 1).padStart(2, '0')}</span><span>↗</span></div><small>${esc(r.area)}</small><strong>${esc(r.name)}</strong><p>${esc(r.description)}</p><em>${esc(r.mood)} · ${placeCount(r.id).toLocaleString('en-US')} New Yorkers recorded here</em></button>`).join('');
  $('#destGrid').querySelectorAll('button').forEach((b) => (b.onclick = () => { closePanels(); setRoom(Number(b.dataset.i)); }));
  const chip = (h: Hang, label: string, sub = '') => `<button class="chip" data-h="${h.mode}${h.key ? ':' + h.key : ''}"><b>${esc(label)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}</button>`;
  $('#hangTop').innerHTML = chip({ mode: 'place' }, 'This place', 'the New Yorkers recorded at this location') + chip({ mode: 'all' }, 'The whole census', `${C.pieces.toLocaleString('en-US')} works by number`) + chip({ mode: 'heroes' }, 'The heroes', 'the hundred marks and closers');
  $('#hangEras').innerHTML = ERAS.map((e) => chip({ mode: 'era', key: String(e.i) }, `ERA ${e.roman}`, e.title)).join('');
  $('#hangFamilies').innerHTML = FAMILIES.map((f) => chip({ mode: 'family', key: f }, f, `${P.filter((p) => p.f === f).length}`)).join('');
  $('#hangSets').innerHTML = SETS.map((s) => chip({ mode: 'set', key: s }, s, `${P.filter((p) => p.set === s).length}`)).join('');
  document.querySelectorAll<HTMLButtonElement>('#hang .chip').forEach((b) => (b.onclick = () => {
    const [mode, ...rest] = b.dataset.h!.split(':');
    closePanels();
    setHang({ mode: mode as Hang['mode'], key: rest.join(':') || undefined });
  }));
  const search = $('#search') as HTMLInputElement;
  $('#searchGo').onclick = () => { closePanels(); setHang({ mode: 'search', key: search.value }); };
  search.addEventListener('keydown', (e) => { if (e.key === 'Enter') { closePanels(); setHang({ mode: 'search', key: search.value }); } });
}
let indexShown = 0;
function paintIndex(reset = false) {
  const grid = $('#indexGrid');
  if (reset) {
    grid.innerHTML = '';
    indexShown = 0;
    $('#indexTitle').textContent = hangLabel(state.hang, ROOMS[state.room].area);
    $('#indexCount').textContent = list.length.toLocaleString('en-US') + ' WORKS';
  }
  const slice = list.slice(indexShown, indexShown + 240);
  const frag = document.createDocumentFragment();
  slice.forEach((p, k) => {
    const gi = indexShown + k;
    const b = document.createElement('button');
    b.innerHTML = `<img loading="lazy" src="${thumb(p)}" alt=""><span class="n">${fmt(p)}</span><span class="t">${esc(p.t)}</span>`;
    b.onclick = () => {
      closePanels();
      const n = build!.mounts.length;
      const pg = Math.floor(gi / n);
      if (pg !== state.page) {
        setPage(pg);
        setTimeout(() => { focus(gi % n); openDetail(p); }, 500);
      } else {
        focus(gi % n);
        openDetail(p);
      }
    };
    frag.appendChild(b);
  });
  grid.appendChild(frag);
  indexShown += slice.length;
  ($('#indexMore') as HTMLButtonElement).hidden = indexShown >= list.length;
}

/* ---------- export: the room as a GLB, the view as a poster ---------- */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function send(post: string, name: string, body: Blob | string) {
  const res = await fetch(post, { method: 'POST', headers: { 'X-Name': name }, body });
  if (!res.ok) throw new Error('export receiver refused ' + name);
}
function download(name: string, blob: Blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 8000);
}
async function exportRoom(post?: string | null) {
  if (!kit || !build || !renderer) return null;
  const def = ROOMS[state.room];
  const name = `new-yorkers-museum-${String(state.room + 1).padStart(2, '0')}-${def.id}`;
  $('#loading').textContent = 'WAITING FOR TEXTURES';
  $('#loading').classList.add('show');
  await kit.settled();
  await wait(600);
  $('#loading').textContent = 'EXPORTING ' + def.area;
  const poster = await kit.poster(camera);
  const glb = await kit.exportGLB(Number(params.get('tex') || 1024));
  const info = { id: def.id, index: state.room + 1, assets: { atlases: [...kit.used.atlases], thumbs: [...kit.used.thumbs], props: [...kit.used.props] }, name: def.name, area: def.area, mood: def.mood, description: def.description, signatures: def.signatures, daylit: def.daylit !== false, day: DAY, hour: HOUR, hang: shown.map((p) => ({ n: p.n, id: p.id, t: p.t })), mounts: build.mounts.length, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, glbBytes: glb.size };
  if (post) {
    await send(post, name + '.png', poster);
    await send(post, name + '.glb', glb);
    await send(post, name + '.json', JSON.stringify(info, null, 1));
  } else {
    download(name + '.glb', glb);
  }
  $('#loading').classList.remove('show');
  return info;
}
async function exportAll(post: string) {
  const manifest: unknown[] = [];
  for (let i = 0; i < ROOMS.length; i++) {
    await setRoom(i);
    manifest.push(await exportRoom(post));
    await wait(300);
  }
  await send(post, 'manifest.json', JSON.stringify({ day: DAY, hour: HOUR, rooms: manifest }, null, 1));
  $('#loading').textContent = 'EXPORTED ' + ROOMS.length + ' ROOMS';
  $('#loading').classList.add('show');
}

/* ---------- boot ---------- */
function boot() {
  const openN = readHash();
  buildPanels();
  $('#enterCount').innerHTML = `<b>${C.pieces.toLocaleString('en-US')}</b> NEW YORKERS · <b>${ROOMS.length}</b> ROOMS · <b>${C.eras}</b> ERAS`;
  $('#enterRoom').textContent = 'FIRST STOP · ' + ROOMS[state.room].area;
  if (touch) document.body.classList.add('touch');
  $('#enterBtn').onclick = () => {
    $('#enter').classList.add('gone');
    if (!renderer) {
      try {
        renderer = makeRenderer();
      } catch {
        $('#noGl').hidden = false;
        return;
      }
      bindControls(renderer.domElement);
      frame = requestAnimationFrame(animate);
    }
    loadRoom(openN).then(() => {
      const post = params.get('post') || 'http://127.0.0.1:4181/';
      if (params.get('export') === 'all') exportAll(post);
      else if (params.get('export') === 'one') exportRoom(post);
    });
  };
  $('#btnGlb').onclick = () => exportRoom(params.get('post'));
  $('#btnDest').onclick = () => openPanel('#dest');
  $('#btnHang').onclick = () => openPanel('#hang');
  $('#btnIndex').onclick = () => { openPanel('#index'); paintIndex(true); };
  $('#indexMore').onclick = () => paintIndex();
  $('#btnFull').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.().catch(() => {}); };
  $('#btnHome').onclick = () => { home(); state.tour = false; paintTour(); };
  $('#btnTour').onclick = () => { state.tour = !state.tour; paintTour(); if (state.tour) focus((state.active + 1) % Math.max(1, shown.length)); };
  $('#pagePrev').onclick = () => setPage(state.page - 1);
  $('#pageNext').onclick = () => setPage(state.page + 1);
  $('#stepF').onclick = () => step(1);
  $('#stepB').onclick = () => step(-1);
  $('#changeRoom').onclick = () => openPanel('#dest');
  document.querySelectorAll<HTMLElement>('[data-close]').forEach((b) => (b.onclick = closePanels));
  setInterval(() => {
    if (state.tour && shown.length && !$('#detail').classList.contains('open')) focus((state.active + 1) % shown.length);
  }, 6500);
  addEventListener('hashchange', () => {
    const before = state.room + '|' + state.hang.mode + ':' + state.hang.key + '|' + state.page;
    const n = readHash();
    const after = state.room + '|' + state.hang.mode + ':' + state.hang.key + '|' + state.page;
    if (before !== after && renderer) loadRoom(n);
  });
  if (MINT.room) { $('#btnDest').hidden = true; $('#changeRoom').hidden = true; document.body.classList.add('minted'); }
  if (params.has('debug')) $('#debug').hidden = false;
  if (params.has('auto')) $('#enterBtn').click();
}
function paintTour() {
  $('#btnTour').textContent = state.tour ? '❚❚ Pause tour' : '▶ Guided tour';
}
void frame;
(window as unknown as { __museum: unknown }).__museum = { state, get camera() { return camera; }, get kit() { return kit; }, get build() { return build; }, get renderer() { return renderer; }, focus, setRoom, setHang, setPage, exportRoom, exportAll, ROOMS, DAY, HOUR };
boot();
