// MLOW INTERNATIONAL, walkable web build.
// Static architecture carries Cycles-baked irradiance lightmaps (TEXCOORD_1); instanced props
// (flowers, people, trees, cars) are lit in real time by a sun + sky rig matched to the bake.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { MeshBVH } from 'three-mesh-bvh';

const SUN_DIR = new THREE.Vector3(-0.551, 0.276, -0.787).normalize();   // bake sun: elev 16°, az 215°
const EYE = 1.65, RADIUS = 0.35, STEP = 0.5, GRAVITY = 22;
const $ = (id) => document.getElementById(id);
const touch = matchMedia('(pointer: coarse)').matches;

// ------------------------------------------------------------------ renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, touch ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 6000);
camera.rotation.order = 'YXZ';

// sky (visible) + environment (reflections) from the same sun
const sky = new Sky();
sky.scale.setScalar(5000);
const su = sky.material.uniforms;
su.turbidity.value = 6; su.rayleigh.value = 1.6; su.mieCoefficient.value = 0.006; su.mieDirectionalG.value = 0.85;
su.sunPosition.value.copy(SUN_DIR).multiplyScalar(4000);
scene.add(sky);
const pmrem = new THREE.PMREMGenerator(renderer);
const envScene = new THREE.Scene(); const envSky = sky.clone(); envScene.add(envSky);
const envMap = pmrem.fromScene(envScene, 0, 1, 6000).texture;
scene.environment = envMap;

// real-time rig for props only (baked surfaces use unlit-by-lights materials)
const hemi = new THREE.HemisphereLight(0xbcd3ff, 0x6b5a48, 1.1);
const sun = new THREE.DirectionalLight(0xffc89a, 2.6);
sun.position.copy(SUN_DIR).multiplyScalar(100);
scene.add(hemi, sun);

// --------------------------------------------------------------------- load
const manager = new THREE.LoadingManager();
manager.onProgress = (_u, done, total) => { $('prog').style.width = `${Math.round(100 * done / Math.max(total, 1))}%`; };
const meta = await (await fetch('assets/scene.json')).json();
const sanitize = (n) => THREE.PropertyBinding.sanitizeNodeName(n);
const kinds = {}, atlasOf = {};
for (const [k, v] of Object.entries(meta.kinds)) kinds[sanitize(k)] = v;
for (const [k, v] of Object.entries(meta.atlas)) atlasOf[sanitize(k)] = v;
const artByName = {};
for (const a of meta.art) artByName[sanitize(a.object)] = a;

const texLoader = new THREE.TextureLoader(manager);
const lightmaps = {};
for (const [name, info] of Object.entries(meta.lightmaps)) {
  const t = texLoader.load(`assets/lm/${name}.${info.ext || 'jpg'}`);
  t.flipY = false; t.channel = 1; t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.anisotropy = 4;
  lightmaps[name] = { tex: t, scale: info.scale || 1 };
}

const gltf = await new Promise((res, rej) => {
  const l = new GLTFLoader(manager); l.setMeshoptDecoder(MeshoptDecoder);
  // self-hosted: the GLB; the claude.ai Artifact (no .glb serving) sets window.MLOW_MODEL to the
  // glTF-JSON variant (embedded base64 geometry + external .webp textures). ?model= for testing.
  const MODEL = window.MLOW_MODEL || new URLSearchParams(location.search).get('model') || 'assets/airport.glb';
  l.load(MODEL, res, (e) => {
    if (e.total) $('ltext').textContent = `loading the terminal… ${Math.round(100 * e.loaded / e.total)}%`;
  }, rej);
});
scene.add(gltf.scene);

// ----------------------------------------------------------------- materials
function ownerName(o) {               // multi-material nodes become a Group of primitives
  for (let p = o; p; p = p.parent) if (kinds[p.name] || atlasOf[p.name]) return p.name;
  return o.name;
}
const collide = [], artMeshes = [], baked = new Map();
gltf.scene.updateMatrixWorld(true);
gltf.scene.traverse((o) => {
  if (!o.isMesh) return;
  const name = ownerName(o);
  const kind = kinds[name] || 'prop';
  const src = o.material;
  const atlas = atlasOf[name];
  if (atlas && lightmaps[atlas] && o.geometry.attributes.uv1) {
    const key = `${src.uuid}|${atlas}`;
    if (!baked.has(key)) {
      const lm = lightmaps[atlas];
      // combined bake: the lightmap already holds colour x light (terrazzo, pavers, turf included)
      const m = new THREE.MeshBasicMaterial({
        color: meta.combined ? 0xffffff : src.color, map: meta.combined ? null : src.map,
        lightMap: lm.tex, lightMapIntensity: lm.scale * Math.PI,
        side: src.side, transparent: src.transparent, opacity: src.opacity, alphaTest: src.alphaTest,
      });
      // polished floors / metals keep a little sky reflection
      if (src.roughness !== undefined && src.roughness < 0.45) {
        m.envMap = envMap; m.combine = THREE.MixOperation; m.reflectivity = 0.14 * (1 - src.roughness) + (src.metalness || 0) * 0.2;
      }
      m.name = src.name + '_baked';
      baked.set(key, m);
    }
    o.material = baked.get(key);
  } else if (kind === 'glass') {
    o.material = new THREE.MeshPhysicalMaterial({ color: src.color, roughness: 0.04, metalness: 0, transparent: true,
      opacity: 0.22, envMap, envMapIntensity: 1.2, depthWrite: false, side: THREE.DoubleSide });
    o.renderOrder = 2;
  } else if (kind === 'image' || kind === 'emissive') {
    o.material = new THREE.MeshBasicMaterial({ color: kind === 'image' ? 0xffffff : src.emissive?.getHex() || src.color,
      map: src.map || src.emissiveMap, transparent: src.transparent, alphaTest: src.alphaTest || 0, side: src.side });
    if (artByName[name]) { o.userData.art = artByName[name]; artMeshes.push(o); }
  } else {
    if (src.isMeshStandardMaterial) src.envMapIntensity = 0.7;      // props / signs: real-time lit
  }
  if (atlas || kind === 'glass' || kind === 'image') collide.push(o);
});

// --------------------------------------------- merge baked meshes per material
// Baked surfaces carry their light in the lightmap, so they never need to move or be picked:
// merge them in world space per material (1,774 draw calls -> ~100). Attributes are de-quantised.
function floatAttr(a, items) {
  // getX/getY/getZ de-normalise quantised data; getComponent returns the raw int16, which
  // scrambles lightmap UVs (the "swirl" ceilings in arrivals, 2026-10-04)
  const f = new Float32Array(a.count * items), get = [a.getX, a.getY, a.getZ, a.getW];
  for (let i = 0; i < a.count; i++) for (let k = 0; k < items; k++) f[i * items + k] = get[k].call(a, i);
  return new THREE.BufferAttribute(f, items);
}
const groups = new Map();
for (const o of [...collide]) {
  if (!o.material.lightMap) continue;
  const g0 = o.geometry, g = new THREE.BufferGeometry();
  g.setAttribute('position', floatAttr(g0.attributes.position, 3));
  g.setAttribute('normal', g0.attributes.normal ? floatAttr(g0.attributes.normal, 3) : new THREE.BufferAttribute(new Float32Array(g0.attributes.position.count * 3), 3));
  g.setAttribute('uv', g0.attributes.uv ? floatAttr(g0.attributes.uv, 2) : new THREE.BufferAttribute(new Float32Array(g0.attributes.position.count * 2), 2));
  g.setAttribute('uv1', floatAttr(g0.attributes.uv1, 2));
  if (g0.index) g.setIndex(g0.index.clone());
  g.applyMatrix4(o.matrixWorld);
  const k = o.material.uuid;
  if (!groups.has(k)) groups.set(k, { mat: o.material, geos: [] });
  groups.get(k).geos.push(g.index ? g : g.toNonIndexed());
  o.visible = false; o.userData.merged = true;
}
const mergedRoot = new THREE.Group(); mergedRoot.name = 'baked_merged';
for (const { mat, geos } of groups.values()) {
  const indexed = geos.every((g) => g.index), list = indexed ? geos : geos.map((g) => (g.index ? g.toNonIndexed() : g));
  const mg = mergeGeometries(list, false);
  if (mg) mergedRoot.add(new THREE.Mesh(mg, mat)); else console.warn('merge failed for', mat.name);
}
scene.add(mergedRoot);   // originals stay (hidden) as the collision source

// ----------------------------------------------------------------- collision
const geos = [];
for (const m of collide) {
  // positions arrive int16-quantised (KHR_mesh_quantization); de-quantise to float before applying
  // the world matrix, or setXYZ re-normalises and clamps everything into ±1
  const src = m.geometry.attributes.position, f = new Float32Array(src.count * 3);
  for (let i = 0; i < src.count; i++) { f[3 * i] = src.getX(i); f[3 * i + 1] = src.getY(i); f[3 * i + 2] = src.getZ(i); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(f, 3));
  if (m.geometry.index) g.setIndex(m.geometry.index.clone());
  g.applyMatrix4(m.matrixWorld);
  geos.push(g.index ? g.toNonIndexed() : g);
}
const colGeo = mergeGeometries(geos, false);
const bvh = new MeshBVH(colGeo);
const ray = new THREE.Ray();
function cast(origin, dir, far) {
  ray.origin.copy(origin); ray.direction.copy(dir);
  const hit = bvh.raycastFirst(ray, THREE.DoubleSide);
  return hit && hit.distance <= far ? hit : null;
}

// --------------------------------------------------------------------- player
const P = { pos: new THREE.Vector3(), velY: 0, yaw: 0, pitch: 0, fly: false, grounded: false, safe: new THREE.Vector3() };
const keys = {};
const spotLabels = {
  EXT_dropoff: 'Drop-off', INT_checkin: 'Check-in rotunda', INT_gallery: 'Gallery concourse', INT_gatehub: 'Blossom gate hub',
  INT_arrivals: 'Arrivals', EXT_apron: 'Apron', EXT_tower: 'Control tower', EXT_hero: 'Fly-over', EXT_aerial: 'Aerial: the eye',
};
const order = ['EXT_dropoff', 'INT_checkin', 'INT_gallery', 'INT_gatehub', 'INT_arrivals', 'EXT_apron', 'EXT_tower', 'EXT_hero', 'EXT_aerial'];
const spots = order.map((n) => meta.spots.find((s) => s.name === n)).filter(Boolean);

function goTo(s) {
  P.yaw = s.yaw; P.pitch = THREE.MathUtils.clamp(s.pitch, -1.2, 1.2); P.velY = 0;
  const p = new THREE.Vector3(...s.pos);
  P.fly = !s.walk;
  if (!P.fly) {
    const hit = cast(p.clone().add(new THREE.Vector3(0, 0.5, 0)), new THREE.Vector3(0, -1, 0), 30);
    if (hit) p.y = hit.point.y; else P.fly = true;
  }
  P.pos.copy(p); if (!P.fly) P.safe.copy(p);
  if (P.fly) P.pos.y -= EYE;                     // camera sits at pos + EYE
  document.querySelectorAll('#spots button').forEach((b) => b.classList.toggle('on', b.dataset.n === s.name));
}
spots.forEach((s, i) => {
  const b = document.createElement('button');
  b.dataset.n = s.name;
  b.innerHTML = `${spotLabels[s.name] || s.name}<small>${i + 1}</small>`;
  b.onclick = (e) => { e.stopPropagation(); goTo(s); };
  $('spots').appendChild(b);
});

const UP = new THREE.Vector3(0, 1, 0), DOWN = new THREE.Vector3(0, -1, 0);
const tmp = new THREE.Vector3(), mv = new THREE.Vector3();
function moveWalk(dt, wish) {
  const speed = keys.ShiftLeft || keys.ShiftRight ? 9 : 4.2;
  mv.copy(wish).multiplyScalar(speed * dt);
  const steps = Math.max(1, Math.ceil(mv.length() / 0.25));
  mv.divideScalar(steps);
  for (let s = 0; s < steps; s++) {
    for (let pass = 0; pass < 2 && mv.lengthSq() > 1e-10; pass++) {
      const len = mv.length(); const dir = tmp.copy(mv).divideScalar(len);
      let blocked = null;
      for (const h of [STEP + 0.05, 1.0, 1.6]) {
        const hit = cast(P.pos.clone().add(new THREE.Vector3(0, h, 0)), dir, RADIUS + len);
        if (hit && (!blocked || hit.distance < blocked.distance)) blocked = hit;
      }
      if (!blocked) break;
      const n = blocked.face.normal.clone().transformDirection(new THREE.Matrix4()).setY(0);
      if (n.lengthSq() < 1e-6) { mv.set(0, 0, 0); break; }
      n.normalize(); if (n.dot(dir) > 0) n.negate();
      mv.addScaledVector(n, -mv.dot(n));                       // slide along the wall
    }
    P.pos.add(mv);
  }
  // ground
  const hit = cast(P.pos.clone().add(new THREE.Vector3(0, STEP, 0)), DOWN, STEP + Math.max(0.05, -P.velY * dt) + 0.05);
  if (hit && P.velY <= 0) { P.pos.y = hit.point.y; P.velY = 0; P.grounded = true; P.safe.copy(P.pos); }
  else { P.velY -= GRAVITY * dt; P.pos.y += P.velY * dt; P.grounded = false; }
  if (P.pos.y < -60) { P.pos.copy(P.safe); P.velY = 0; }
}
function moveFly(dt, wish) {
  const speed = keys.ShiftLeft || keys.ShiftRight ? 90 : 24;
  const fwd = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(P.pitch, P.yaw, 0, 'YXZ'));
  const right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, P.yaw, 0, 'YXZ'));
  const v = new THREE.Vector3().addScaledVector(fwd, -wish.z0).addScaledVector(right, wish.x0);
  if (keys.KeyE) v.y += 1; if (keys.KeyQ) v.y -= 1;
  if (v.lengthSq()) P.pos.addScaledVector(v.normalize(), speed * dt);
}
function toggleFly() {
  P.fly = !P.fly; P.velY = 0;
  if (!P.fly) {                                   // land: drop to the floor below
    const hit = cast(P.pos.clone().add(new THREE.Vector3(0, EYE, 0)), DOWN, 500);
    if (hit) P.pos.y = hit.point.y;
  }
}

// --------------------------------------------------------------------- input
let locked = false, started = false;
addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'KeyF') toggleFly();
  const d = parseInt(e.key, 10); if (d >= 1 && d <= spots.length) goTo(spots[d - 1]);
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
const canvas = renderer.domElement;
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === canvas;
  $('cross').style.display = locked ? 'block' : 'none';
  if (!locked && started && !touch) $('start').style.display = 'flex';
});
document.addEventListener('mousemove', (e) => {
  if (!locked) return;
  P.yaw -= e.movementX * 0.0022; P.pitch = THREE.MathUtils.clamp(P.pitch - e.movementY * 0.0022, -1.45, 1.45);
});
const lock = () => { try { canvas.requestPointerLock()?.catch?.(() => {}); } catch (e) { /* embedded frames may refuse */ } };
$('go').onclick = () => {
  started = true; $('start').style.display = 'none';
  if (!touch) lock();
};
canvas.addEventListener('click', () => { if (started && !touch && !locked) lock(); });

// touch: left joystick moves, drag elsewhere looks
const joy = { id: null, x: 0, y: 0 }, look = { id: null, x: 0, y: 0 };
if (touch) {
  $('joy').style.display = 'block'; $('flybtn').style.display = 'block';
  $('keys').innerHTML = '<b>left pad</b><span>walk</span><b>drag</b><span>look</span><b>fly</b><span>button, bottom right</span>';
  $('flybtn').onclick = (e) => { e.stopPropagation(); toggleFly(); };
  const jr = $('joy').getBoundingClientRect.bind($('joy')), knob = $('joy').firstElementChild;
  $('joy').addEventListener('touchstart', (e) => { joy.id = e.changedTouches[0].identifier; e.preventDefault(); }, { passive: false });
  addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joy.id) {
        const r = jr(); let dx = (t.clientX - r.left - 60) / 50, dy = (t.clientY - r.top - 60) / 50;
        const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
        joy.x = dx; joy.y = dy; knob.style.transform = `translate(${dx * 40}px, ${dy * 40}px)`;
      } else if (t.identifier === look.id) {
        P.yaw -= (t.clientX - look.x) * 0.005; P.pitch = THREE.MathUtils.clamp(P.pitch - (t.clientY - look.y) * 0.005, -1.45, 1.45);
        look.x = t.clientX; look.y = t.clientY;
      }
    }
  }, { passive: true });
  canvas.addEventListener('touchstart', (e) => { const t = e.changedTouches[0]; look.id = t.identifier; look.x = t.clientX; look.y = t.clientY; }, { passive: true });
  addEventListener('touchend', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joy.id) { joy.id = null; joy.x = joy.y = 0; knob.style.transform = ''; }
      if (t.identifier === look.id) look.id = null;
    }
  });
}

// --------------------------------------------------------------------- loop
const raycaster = new THREE.Raycaster(); raycaster.far = 12;
let exposure = 1, lastPlaque = null, zoneT = 0;
const clock = new THREE.Clock();
function tick(dt) {
  const fwd = new THREE.Vector3(-Math.sin(P.yaw), 0, -Math.cos(P.yaw));
  const right = new THREE.Vector3(Math.cos(P.yaw), 0, -Math.sin(P.yaw));
  let x0 = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) + joy.x;
  let z0 = (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0) + joy.y;
  const wish = new THREE.Vector3().addScaledVector(right, x0).addScaledVector(fwd, -z0);
  if (wish.lengthSq() > 1) wish.normalize();
  wish.x0 = x0; wish.z0 = z0;
  if (started) (P.fly ? moveFly : moveWalk)(dt, wish);
  camera.position.copy(P.pos).add(new THREE.Vector3(0, EYE, 0));
  camera.rotation.set(P.pitch, P.yaw, 0);

  // exposure: v2 stills used +0.3 EV outside, 0 inside; a roof overhead means inside
  zoneT -= dt;
  if (zoneT <= 0) {
    zoneT = 0.25;
    // 5 roof rays (centre + 4 at 3 m): a skylight slot overhead must not read as "outside"
    let roofs = 0;
    for (const [dx, dz] of [[0, 0], [3, 0], [-3, 0], [0, 3], [0, -3]])
      if (cast(camera.position.clone().add(new THREE.Vector3(dx, 0, dz)), UP, 40)) roofs++;
    const inside = roofs >= 2 && !P.fly;
    exposure = inside ? 1.0 : 1.23;
    $('zone').textContent = P.fly ? 'FLYING' : inside ? 'INSIDE · TERMINAL B' : 'OUTSIDE';
    $('mode').textContent = P.fly ? 'fly mode · F to land' : 'walk mode · F to fly';
  }
  renderer.toneMappingExposure += (exposure - renderer.toneMappingExposure) * Math.min(1, dt * 3);

  // art plaque: whatever artwork is under the crosshair
  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  const hit = artMeshes.length ? raycaster.intersectObjects(artMeshes, false)[0] : null;
  const art = hit?.object.userData.art || null;
  if (art !== lastPlaque) {
    lastPlaque = art;
    $('plaque').style.display = art ? 'block' : 'none';
    if (art) {
      $('ptitle').textContent = art.title || (art.image || 'Untitled').replace(/\.(png|jpe?g)$/i, '');
      $('pmeta').textContent = 'MLow · fLOWers';
    }
  }
  renderer.render(scene, camera);
}
function frame() { tick(Math.min(clock.getDelta(), 0.05)); requestAnimationFrame(frame); }

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight);
});
goTo(spots[0]);
$('loading').style.display = 'none';
$('start').style.display = 'flex';
// harness hook: tick() renders a frame on demand (rAF pauses while the tab is hidden, so
// screenshots of a hidden pane are stale unless the harness ticks first)
window.__walk = { P, scene, camera, renderer, spots, goTo, cast, meta, tick: (dt = 1 / 60, n = 1) => { for (let i = 0; i < n; i++) tick(dt); } };
frame();
