// MLOW GARDENS, walkable web build. Forked from the MLOW INTERNATIONAL walk (controls, collision,
// power policy). The park is lit in real time: a golden hour sky, a low sun whose shadow map follows
// the walker, and tileable PBR maps chosen by material name and projected in world space.
// NEW YORKERS hang in 179 framed slots, filled from assets/art.json and streamed by distance.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MeshBVH } from 'three-mesh-bvh';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import './assets/rig/rigcast.js?v=face1028';   // FACE table: five rig files turned to +Z

const SUN_DIR = new THREE.Vector3(-0.8, 0.16, 0.58).normalize();    // low golden sun (about 9 degrees) from the west south west
const EYE = 1.65, RADIUS = 0.35, STEP = 0.5, GRAVITY = 22;
const $ = (id) => document.getElementById(id);
const touch = matchMedia('(pointer: coarse)').matches;
const PIECE = /\/assets\/gardens\//.test(location.pathname) ? '/n/' : 'https://n3wyorkers.com/n/';

// ------------------------------------------------------------------ renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;           // redrawn a few times a second, not every frame
document.body.prepend(renderer.domElement);
const ANISO = Math.min(8, renderer.capabilities.getMaxAnisotropy());

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xe4c4a0, 600, 3200);
const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.1, 6000);
camera.rotation.order = 'YXZ';

// golden hour sky: a gradient dome whose horizon colour IS the fog colour (the physical Sky shader went
// grey white at a 9 degree sun under ACES, and never matched the fog), plus a soft sun glow and disk
const HORIZON = new THREE.Color(0xf1c79c);
scene.fog.color.copy(HORIZON);
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: {
    zenith: { value: new THREE.Color(0x3d6cb3) }, mid: { value: new THREE.Color(0x9fbde0) },
    horizon: { value: HORIZON }, ground: { value: new THREE.Color(0xc9a27c) },
    sunDir: { value: SUN_DIR }, sunCol: { value: new THREE.Color(0xffd29a) },
  },
  vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; gl_Position.z = gl_Position.w; }',
  fragmentShader: `uniform vec3 zenith, mid, horizon, ground, sunCol; uniform vec3 sunDir; varying vec3 vDir;
    void main(){
      vec3 d = normalize(vDir); float h = d.y;
      vec3 c = h > 0.0 ? mix(horizon, mid, smoothstep(0.0, 0.18, h)) : mix(horizon, ground, smoothstep(0.0, -0.08, h));
      c = h > 0.18 ? mix(mid, zenith, smoothstep(0.18, 0.75, h)) : c;
      float s = max(dot(d, normalize(sunDir)), 0.0);
      c += sunCol * (pow(s, 6.0) * 0.45 + pow(s, 60.0) * 0.6) + vec3(1.0, 0.95, 0.85) * smoothstep(0.9994, 0.9998, s) * 4.0;
      gl_FragColor = vec4(c, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
});
const skyDome = new THREE.Mesh(new THREE.SphereGeometry(4500, 48, 24), skyMat);
scene.add(skyDome);
const pmrem = new THREE.PMREMGenerator(renderer);
const envScene = new THREE.Scene(); envScene.add(new THREE.Mesh(new THREE.SphereGeometry(100, 48, 24), skyMat));
const envMap = pmrem.fromScene(envScene, 0, 1, 1000).texture;
scene.environment = envMap;

const hemi = new THREE.HemisphereLight(0xc4d6f7, 0x7a6a4c, 1.25);
const sun = new THREE.DirectionalLight(0xffc387, 3.5);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const SH = 80;
Object.assign(sun.shadow.camera, { left: -SH, right: SH, top: SH, bottom: -SH, near: 1, far: 900 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.5;
scene.add(hemi, sun, sun.target);

// --------------------------------------------------------------------- load
const manager = new THREE.LoadingManager();
manager.onProgress = (_u, done, total) => { $('prog').style.width = `${Math.round(100 * done / Math.max(total, 1))}%`; };
const [meta, art] = await Promise.all([fetch('assets/scene.json').then((r) => r.json()), fetch('assets/art.json').then((r) => r.json())]);
const texLoader = new THREE.TextureLoader(manager);

// tileable maps, metres per repeat, and whether the map carries full colour (else it tints the brand colour)
const SETS = {
  turf: ['turf_a', 'turf_n', 6, true, 0.9], pavers: ['pavers_a', 'pavers_n', 3, false, 0.8],
  planks: ['planks_a', 'planks_n', 2.4, true, 0.85], asphalt: ['asphalt_a', 'asphalt_n', 4, true, 0.8],
  concrete: ['concrete_d', 'concrete_n', 3, false, 0.6], metal: ['metal_d', 'metal_n', 2, false, 0.35],
  foliage: ['foliage_d', 'foliage_n', 2.5, false, 1.0], wood: ['wood_d', 'wood_n', 1.5, false, 0.6],
  terrazzo: ['terrazzo_a', 'terrazzo_n', 2, false, 0.4], sand: ['sand_a', 'sand_n', 2, true, 0.8],
  mulch: ['mulch_a', 'mulch_n', 1.5, true, 1.0],
};
const texCache = {};
function tex(name, color) {
  if (texCache[name]) return texCache[name];
  const t = texLoader.load(`assets/tex/${name}.jpg`);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = ANISO;
  t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  return (texCache[name] = t);
}
const waterN = tex('water_n', false);

const gltf = await new Promise((res, rej) => {
  const l = new GLTFLoader(manager); l.setMeshoptDecoder(MeshoptDecoder);
  l.load('assets/gardens.glb', res, (e) => {
    if (e.total) $('ltext').textContent = `opening the gates… ${Math.round(100 * e.loaded / e.total)}%`;
  }, rej);
});
scene.add(gltf.scene);
gltf.scene.updateMatrixWorld(true);

// ----------------------------------------------------------- classification
function classify(name) {
  const n = name.toLowerCase();
  if (/^nyart_slot/.test(n)) return 'art';
  if (/^img_/.test(n)) return 'image';
  if (/glass/.test(n)) return 'glass';
  if (/water/.test(n)) return 'water';
  if (/astroturf|^lawn/.test(n)) return 'turf';
  if (/^can_|hedge|lily/.test(n)) return 'foliage';
  if (/petal|flw_ctr|^stem|^bal_|^cr_|crowd|skin|head/.test(n)) return 'plain';
  if (/path_slate|plaza|court|pitwall|chk_/.test(n)) return 'pavers';
  if (/boardwalk/.test(n)) return 'planks';
  if (/asphalt/.test(n)) return 'asphalt';
  if (/hall_floor/.test(n)) return 'terrazzo';
  if (/shore|sand/.test(n)) return 'sand';
  if (/soil|mulch/.test(n)) return 'mulch';
  if (/trunk|timber|bench|pic_|horse/.test(n)) return 'wood';
  if (/^rail_|^sup_|track_dark|^car_|wheel|^hub|tower_slate|lamp_ink|fence|chain|^f1|pcar|station_post|gantry|^rod_|blimp_ink|^frame_|steel|sw_|seat|tire|kerb|catch/.test(n)) return 'metal';
  return 'concrete';
}
const NO_SHADOW = new Set(['plain', 'glass', 'water', 'image', 'art']);
const NO_COLLIDE = /petal|flw_ctr|^stem|lily|water|glass|^bal_|^can_|lamp_glow|bulb|picture_light|^cr_|crowd|sign_|txt|^img_/i;

const matCache = new Map();
function upgrade(src) {
  if (matCache.has(src)) return matCache.get(src);
  const kind = classify(src.name || '');
  let m = src;
  const emissiveStrong = src.emissive && (src.emissive.r + src.emissive.g + src.emissive.b) > 0.05 && (src.emissiveIntensity || 1) >= 1.4;
  if (kind === 'glass') {
    m = new THREE.MeshPhysicalMaterial({ color: 0xcfefff, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.2,
      envMap, envMapIntensity: 1.3, depthWrite: false, side: THREE.DoubleSide });
  } else if (kind === 'water') {
    m = new THREE.MeshStandardMaterial({ color: src.color.clone().multiplyScalar(0.55), roughness: 0.06, metalness: 0.2,
      normalMap: waterN, normalScale: new THREE.Vector2(0.6, 0.6), envMapIntensity: 1.4 });
    m.userData.water = true;
  } else if (kind === 'image' || emissiveStrong) {
    m = src;                                     // logos, icons, lamps, signs keep their own look
  } else if (SETS[kind]) {
    const [a, nrm, scale, full, ns] = SETS[kind];
    m = new THREE.MeshStandardMaterial({
      color: full ? 0xffffff : src.color, map: tex(a, true), normalMap: tex(nrm, false),
      normalScale: new THREE.Vector2(ns, ns),
      roughness: Math.max(src.roughness ?? 0.7, kind === 'metal' ? 0.28 : 0.55), metalness: src.metalness ?? 0,
      emissive: src.emissive || new THREE.Color(0), emissiveIntensity: src.emissiveIntensity || 0, envMapIntensity: 0.9,
    });
    m.userData.uvScale = scale;
    if (kind === 'turf') turfShader(m);
  } else {
    m = src; if (m.isMeshStandardMaterial) m.envMapIntensity = 0.8;
  }
  m.userData.kind = kind;
  m.name = src.name;
  matCache.set(src, m);
  return m;
}
// turf: diagonal mow stripes plus a large scale tone so the 6 m tile never reads as a grid
function turfShader(m) {
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        float stripe = smoothstep(0.46, 0.54, abs(fract((vWP.x + vWP.z) / 18.0) - 0.5) * 2.0);
        float broad = texture2D(map, vWP.xz / 140.0).g;
        diffuseColor.rgb *= mix(0.86, 1.05, stripe) * (0.82 + 0.4 * broad);`);
  };
}

// world space box projection: every vertex picks the axis its normal faces most
function boxUV(geo, scale) {
  const p = geo.attributes.position, n = geo.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i));
    let u, v;
    if (ny >= nx && ny >= nz) { u = p.getX(i); v = p.getZ(i); }
    else if (nx >= nz) { u = p.getZ(i); v = p.getY(i); }
    else { u = p.getX(i); v = p.getY(i); }
    uv[2 * i] = u / scale; uv[2 * i + 1] = v / scale;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}
function floatAttr(a, items) {
  // getX..getW de-normalise quantised data; getComponent would return raw int16 (meshopt quantisation)
  const f = new Float32Array(a.count * items), get = [a.getX, a.getY, a.getZ, a.getW];
  for (let i = 0; i < a.count; i++) for (let k = 0; k < items; k++) f[i * items + k] = get[k].call(a, i);
  return new THREE.BufferAttribute(f, items);
}

// ----------------------------------------------------------- scene walk
const animated = new Set(meta.anim.map((n) => THREE.PropertyBinding.sanitizeNodeName(n)));
const dynamic = new Set();
gltf.scene.traverse((o) => { if (animated.has(o.name)) o.traverse((c) => dynamic.add(c)); });

const slots = [], statics = [], crowdSpots = [];
const crowdNode = (o) => (/^crowd_/.test(o.name) ? o : /^crowd_/.test(o.parent?.name || '') ? o.parent : null);
gltf.scene.traverse((o) => {
  if (!o.isMesh) return;
  const nm = o.name.startsWith('NYA_') ? o.name : o.parent?.name?.startsWith('NYA_') ? o.parent.name : null;
  if (nm && art[nm]) {
    // gltf-transform prune drops TEXCOORD_0 from meshes whose material has no texture (every empty slot),
    // so rebuild it from the plane's own bounds: u along local X, v down local Z (glTF plane, Blender XY)
    const g = o.geometry.clone(), pa = g.attributes.position;
    g.computeBoundingBox(); const bb = g.boundingBox, sx = bb.max.x - bb.min.x || 1, sz = bb.max.z - bb.min.z || 1;
    const uv = new Float32Array(pa.count * 2);
    for (let i = 0; i < pa.count; i++) { uv[2 * i] = (pa.getX(i) - bb.min.x) / sx; uv[2 * i + 1] = (pa.getZ(i) - bb.min.z) / sz; }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); o.geometry = g;
    o.material = new THREE.MeshBasicMaterial({ color: 0x23262d });
    o.userData.art = art[nm]; o.userData.slot = nm; slots.push(o);
    return;
  }
  const m = upgrade(o.material);
  if (dynamic.has(o)) {
    if (m.userData.uvScale && !o.geometry.userData.boxed) {
      const g = o.geometry.clone();
      g.setAttribute('position', floatAttr(g.attributes.position, 3));
      if (g.attributes.normal) { g.setAttribute('normal', floatAttr(g.attributes.normal, 3)); boxUV(g, m.userData.uvScale); }
      g.userData.boxed = true; o.geometry = g;
    }
    o.material = m; o.castShadow = !NO_SHADOW.has(m.userData.kind); return;
  }
  o.material = m;
  const cn = crowdNode(o);
  if (cn) {                                      // a grandstand spectator: merged on its own, so the rigged cast can hide it
    o.userData.crowd = true;
    if (!cn.userData.spot) {
      const p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
      cn.matrixWorld.decompose(p, q, sc);
      p.y -= sc.y;                               // a unit cube scaled to half extents: its foot is the centre less the half height
      cn.userData.spot = { pos: p, ry: new THREE.Euler().setFromQuaternion(q, 'YXZ').y + Math.PI };
      crowdSpots.push(cn.userData.spot);
    }
  }
  statics.push(o);
});

// merge static meshes in world space per material (5,000 objects become a few hundred draw calls)
const groups = new Map(), colGeos = [];
for (const o of statics) {
  const g0 = o.geometry, g = new THREE.BufferGeometry();
  g.setAttribute('position', floatAttr(g0.attributes.position, 3));
  g.setAttribute('normal', g0.attributes.normal ? floatAttr(g0.attributes.normal, 3) : new THREE.BufferAttribute(new Float32Array(g0.attributes.position.count * 3), 3));
  if (g0.attributes.uv) g.setAttribute('uv', floatAttr(g0.attributes.uv, 2));
  else g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g0.attributes.position.count * 2), 2));
  if (g0.index) g.setIndex(g0.index.clone());
  g.applyMatrix4(o.matrixWorld);
  if (o.material.userData.uvScale) boxUV(g, o.material.userData.uvScale);
  const flat = g.index ? g.toNonIndexed() : g;
  const key = (o.userData.crowd ? 'crowd|' : '') + o.material.uuid;
  if (!groups.has(key)) groups.set(key, { mat: o.material, geos: [], crowd: !!o.userData.crowd });
  groups.get(key).geos.push(flat);
  if (!NO_COLLIDE.test(o.material.name || '')) {
    const c = new THREE.BufferGeometry(); c.setAttribute('position', flat.attributes.position); colGeos.push(c);
  }
  o.visible = false;
}
const merged = new THREE.Group(); merged.name = 'merged';
const crowdMeshes = [];
for (const { mat, geos, crowd } of groups.values()) {
  const mg = mergeGeometries(geos, false);
  if (!mg) continue;
  const mesh = new THREE.Mesh(mg, mat);
  if (crowd) crowdMeshes.push(mesh);
  mesh.castShadow = !NO_SHADOW.has(mat.userData.kind);
  mesh.receiveShadow = mat.userData.kind !== 'glass';
  if (mat.transparent) mesh.renderOrder = 2;
  merged.add(mesh);
}
scene.add(merged);
for (const o of statics) o.parent?.remove(o);

// the park sits on a 770 x 620 m plane; from the air the world must not end at its edge, so a wide
// turf apron (subdivided, or it is culled whole) runs out to the fog under the plane
{
  const turf = [...groups.values()].find((g) => g.mat.userData.kind === 'turf')?.mat;
  if (turf) {
    const ag = new THREE.PlaneGeometry(9000, 9000, 24, 24); ag.rotateX(-Math.PI / 2);
    boxUV(ag, turf.userData.uvScale);
    const apron = new THREE.Mesh(ag, turf); apron.position.set(95, -0.15, 0); apron.receiveShadow = true;
    scene.add(apron);
  }
}

const bvh = new MeshBVH(mergeGeometries(colGeos, false));
const ray = new THREE.Ray();
function cast(origin, dir, far) {
  ray.origin.copy(origin); ray.direction.copy(dir);
  const hit = bvh.raycastFirst(ray, THREE.DoubleSide);
  return hit && hit.distance <= far ? hit : null;
}

// ---------------------------------------------------------- the rigged cast (2026-10-28)
// The three grandstands round the eye circuit held 368 spectators built as a box with a ball on top. They become
// rigged NEW YORKERS on the same steps, facing the track, standing at 0.88 of the 1.88 m rig, as a race crowd
// stands. (The seated robber was tried on the steps: from the track only his flower showed over each step's edge,
// a row of loose heads, so the stands are all standing figures.) The nearest
// 20 (8 on a phone) breathe and glance on their own mixer and turn their heads to a visitor who comes close; the
// rest are the same figures, one instanced draw call per character. The primitives hide only once every file has
// loaded; ?rig=off keeps them.
let rig = null;
if (new URLSearchParams(location.search).get('rig') !== 'off' && window.RigCast && crowdSpots.length) {
  const STAND = ['cabbie', 'susan', 'annieh', 'hustler', 'oscar', 'writer', 'tough', 'workgirl', 'wiseguy', 'discoking'];
  let seed = 103; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (const s of crowdSpots) {
    s.cast = STAND[Math.floor(rnd() * STAND.length)];
    s.s = 0.88 * (0.96 + rnd() * 0.08);
    s.ry += (rnd() - 0.5) * 0.3;
  }
  rig = window.RigCast({ THREE, loader: new GLTFLoader(), clone: cloneSkinned, base: 'assets/rig/', spots: crowdSpots, parent: scene,
    camera, phone: touch, cap: 20, capPhone: 8, near: 40, nearPhone: 22, shadow: true,
    onReady: () => { for (const m of crowdMeshes) m.visible = false; renderer.shadowMap.needsUpdate = true; } });
}

// ------------------------------------------------------------- animation
// the v4 timeline is 30 s of 24 fps: F1 cars ran six laps (about 440 km/h) and the wheel turned at
// 6 rpm. Each clip is slowed to a believable pace; clips still loop on their own length.
const mixer = new THREE.AnimationMixer(gltf.scene);
for (const clip of gltf.animations) {
  const a = mixer.clipAction(clip);
  const tn = clip.tracks[0]?.name || '';
  a.setEffectiveTimeScale(/^GPCar/.test(tn) ? 0.5 : /^WheelSpin/.test(tn) ? 0.12 : /_acar|_ahead/.test(tn) ? 0.62 : 1.0);
  a.play();
}

// ------------------------------------------------------------- the art
const artTex = new Map();
let loading = 0;
const LOAD_R = 75, DROP_R = 135;
function streamArt() {
  const cam = camera.position;
  const want = [];
  for (const s of slots) {
    const d = s.getWorldPosition(tmpV).distanceTo(cam);
    s.userData.d = d;
    if (d < LOAD_R && !s.userData.tex && !s.userData.pending) want.push(s);
    else if (d > DROP_R && s.userData.tex) {
      s.material.map = null; s.material.color.set(0x23262d); s.material.needsUpdate = true;
      s.userData.tex.dispose(); s.userData.tex = null;
    }
  }
  want.sort((a, b) => a.userData.d - b.userData.d);
  for (const s of want) {
    if (loading >= 4) break;
    loading++; s.userData.pending = true;
    new THREE.TextureLoader().load(s.userData.art.img, (t) => {
      t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = ANISO;
      s.material.map = t; s.material.color.set(0xf2f2f2); s.material.needsUpdate = true;
      s.userData.tex = t; s.userData.pending = false; loading--;
    }, undefined, () => { s.userData.pending = false; loading--; });
  }
}
const tmpV = new THREE.Vector3();

// --------------------------------------------------------------------- player
const P = { pos: new THREE.Vector3(), velY: 0, yaw: 0, pitch: 0, fly: false, grounded: false, safe: new THREE.Vector3(), ride: null, ry: 0, rp: 0 };
const keys = {};
const spots = meta.spots;
function goTo(s) {
  endRide();
  P.yaw = s.yaw; P.pitch = THREE.MathUtils.clamp(s.pitch, -1.35, 1.2); P.velY = 0;
  const p = new THREE.Vector3(...s.pos);
  P.fly = !s.walk;
  if (!P.fly) {
    const hit = cast(p.clone().add(new THREE.Vector3(0, 2, 0)), new THREE.Vector3(0, -1, 0), 40);
    if (hit) p.y = hit.point.y; else P.fly = true;
  }
  P.pos.copy(p); if (!P.fly) P.safe.copy(p);
  if (P.fly) P.pos.y -= EYE;
  document.querySelectorAll('#spots button').forEach((b) => b.classList.toggle('on', b.dataset.n === s.name));
  shadowDirty = true;
}
spots.forEach((s, i) => {
  const b = document.createElement('button');
  b.dataset.n = s.name; b.innerHTML = `${s.label}<small>${i + 1}</small>`;
  b.onclick = (e) => { e.stopPropagation(); goTo(s); };
  $('spots').appendChild(b);
});

// rides: sit in the lead car of a coaster train, or ride along in car 20 on the circuit
const BASE_ROT = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);   // camera -Z to car +X
const rideNames = Object.keys(meta.rides);
rideNames.forEach((label) => {
  const b = document.createElement('button');
  b.dataset.r = label; b.textContent = `RIDE ${label}`;
  b.onclick = (e) => { e.stopPropagation(); startRide(label); };
  $('rides').appendChild(b);
});
function startRide(label) {
  const node = gltf.scene.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(meta.rides[label]));
  if (!node) return;
  P.ride = { label, node }; P.ry = 0; P.rp = -0.08;
  document.querySelectorAll('#rides button').forEach((b) => b.classList.toggle('on', b.dataset.r === label));
}
function endRide() {
  if (!P.ride) return;
  const hit = cast(camera.position.clone(), new THREE.Vector3(0, -1, 0), 300);
  P.pos.copy(camera.position); P.pos.y -= EYE; P.fly = !hit;
  if (hit) { P.pos.y = hit.point.y; P.safe.copy(P.pos); }
  P.yaw = camera.rotation.y; P.pitch = 0;
  P.ride = null;
  document.querySelectorAll('#rides button').forEach((b) => b.classList.remove('on'));
}
const rq = new THREE.Quaternion(), rpv = new THREE.Vector3(), rsv = new THREE.Vector3(), lookQ = new THREE.Quaternion(), lookE = new THREE.Euler(0, 0, 0, 'YXZ');
function rideCamera() {
  const n = P.ride.node; n.updateWorldMatrix(true, false);
  n.matrixWorld.decompose(rpv, rq, rsv);
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(rq);
  camera.position.copy(rpv).addScaledVector(up, P.ride.label === 'BLOSSOM GP' ? 1.15 : 1.35);
  lookE.set(P.rp, P.ry, 0); lookQ.setFromEuler(lookE);
  camera.quaternion.copy(rq).multiply(BASE_ROT).multiply(lookQ);
}

const DOWN = new THREE.Vector3(0, -1, 0), UP = new THREE.Vector3(0, 1, 0);
const tmp = new THREE.Vector3(), mv = new THREE.Vector3();
function moveWalk(dt, wish) {
  const speed = keys.ShiftLeft || keys.ShiftRight ? 11 : 4.6;
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
      const n = blocked.face.normal.clone().setY(0);
      if (n.lengthSq() < 1e-6) { mv.set(0, 0, 0); break; }
      n.normalize(); if (n.dot(dir) > 0) n.negate();
      mv.addScaledVector(n, -mv.dot(n));
    }
    P.pos.add(mv);
  }
  const hit = cast(P.pos.clone().add(new THREE.Vector3(0, STEP, 0)), DOWN, STEP + Math.max(0.05, -P.velY * dt) + 0.05);
  if (hit && P.velY <= 0) { P.pos.y = hit.point.y; P.velY = 0; P.grounded = true; P.safe.copy(P.pos); }
  else { P.velY -= GRAVITY * dt; P.pos.y += P.velY * dt; P.grounded = false; }
  if (P.pos.y < -40) { P.pos.copy(P.safe); P.velY = 0; }
}
function moveFly(dt, wish) {
  const speed = keys.ShiftLeft || keys.ShiftRight ? 110 : 28;
  const fwd = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(P.pitch, P.yaw, 0, 'YXZ'));
  const right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, P.yaw, 0, 'YXZ'));
  const v = new THREE.Vector3().addScaledVector(fwd, -wish.z0).addScaledVector(right, wish.x0);
  if (keys.KeyE) v.y += 1; if (keys.KeyQ) v.y -= 1;
  if (v.lengthSq()) P.pos.addScaledVector(v.normalize(), speed * dt);
}
function toggleFly() {
  if (P.ride) endRide();
  P.fly = !P.fly; P.velY = 0;
  if (!P.fly) { const hit = cast(P.pos.clone().add(new THREE.Vector3(0, EYE, 0)), DOWN, 600); if (hit) P.pos.y = hit.point.y; }
}
function openPiece() {
  if (lastPlaque) window.open(PIECE + encodeURIComponent(lastPlaque.id), '_top');
}

// --------------------------------------------------------------------- input
let locked = false, started = false;
addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'KeyF') toggleFly();
  if (e.code === 'KeyR') {
    const i = P.ride ? rideNames.indexOf(P.ride.label) + 1 : 0;
    if (i >= rideNames.length) endRide(); else startRide(rideNames[i]);
  }
  if (e.code === 'KeyX') endRide();
  if (e.code === 'KeyE' && !P.fly) openPiece();
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
  if (P.ride) { P.ry -= e.movementX * 0.0022; P.rp = THREE.MathUtils.clamp(P.rp - e.movementY * 0.0022, -1.2, 1.2); return; }
  P.yaw -= e.movementX * 0.0022; P.pitch = THREE.MathUtils.clamp(P.pitch - e.movementY * 0.0022, -1.45, 1.45);
});
const lock = () => { try { canvas.requestPointerLock()?.catch?.(() => {}); } catch (e) { /* embedded frames may refuse */ } };
$('go').onclick = () => { started = true; $('start').style.display = 'none'; if (!touch) lock(); };
canvas.addEventListener('click', () => { if (!started) return; if (!touch && !locked) lock(); else if (lastPlaque) openPiece(); });
$('plaque').addEventListener('click', (e) => { e.stopPropagation(); openPiece(); });

const joy = { id: null, x: 0, y: 0 }, look = { id: null, x: 0, y: 0 };
if (touch) {
  $('joy').style.display = 'block'; $('flybtn').style.display = 'block';
  $('keys').innerHTML = '<b>left pad</b><span>walk</span><b>drag</b><span>look</span><b>fly</b><span>button, bottom right</span><b>tap a plaque</b><span>see the piece</span>';
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
        const ddx = (t.clientX - look.x) * 0.005, ddy = (t.clientY - look.y) * 0.005;
        if (P.ride) { P.ry -= ddx; P.rp = THREE.MathUtils.clamp(P.rp - ddy, -1.2, 1.2); }
        else { P.yaw -= ddx; P.pitch = THREE.MathUtils.clamp(P.pitch - ddy, -1.45, 1.45); }
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
const HALL = { x: -158, z: -232 };
function zoneOf(p) {
  if (P.ride) return `RIDING ${P.ride.label}`;
  if (P.fly) return 'FLYING';
  if (Math.abs(p.x - HALL.x) < 37 && Math.abs(p.z - HALL.z) < 15) return 'LUNA HALL · the parks of New York';
  if (Math.abs(p.x) < 14 && p.z > 54 && p.z < 240) return 'THE BOARDWALK · Coney Island';
  if (Math.hypot(p.x, p.z) < 62) return 'THE PLAZA';
  if (p.x > 170) return 'BLOSSOM GP';
  return 'MLOW GARDENS';
}
const raycaster = new THREE.Raycaster(); raycaster.far = 16;
let lastPlaque = null, zoneT = 0, streamT = 0, shadowT = 0, shadowDirty = true, exposure = 1.2;
const lastShadowPos = new THREE.Vector3(1e9, 0, 0);
const clock = new THREE.Clock();
function tick(dt) {
  mixer.update(dt);
  waterN.offset.x += dt * 0.012; waterN.offset.y += dt * 0.007;
  if (P.ride) rideCamera();
  else {
    const fwd = new THREE.Vector3(-Math.sin(P.yaw), 0, -Math.cos(P.yaw));
    const right = new THREE.Vector3(Math.cos(P.yaw), 0, -Math.sin(P.yaw));
    const x0 = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) + joy.x;
    const z0 = (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0) + joy.y;
    const wish = new THREE.Vector3().addScaledVector(right, x0).addScaledVector(fwd, -z0);
    if (wish.lengthSq() > 1) wish.normalize();
    wish.x0 = x0; wish.z0 = z0;
    if (started) (P.fly ? moveFly : moveWalk)(dt, wish);
    camera.position.copy(P.pos).add(new THREE.Vector3(0, EYE, 0));
    camera.rotation.set(P.pitch, P.yaw, 0);
  }

  // the shadow map follows the visitor; redrawn about five times a second, or at once after a jump
  shadowT -= dt;
  const focus = tmpV.copy(camera.position); focus.y = 0;
  if (shadowDirty || shadowT <= 0 || focus.distanceTo(lastShadowPos) > 20) {
    shadowT = 0.2; shadowDirty = false; lastShadowPos.copy(focus);
    sun.target.position.copy(focus); sun.position.copy(focus).addScaledVector(SUN_DIR, 400);
    sun.target.updateMatrixWorld(); renderer.shadowMap.needsUpdate = true;
  }
  streamT -= dt; if (streamT <= 0) { streamT = 0.4; streamArt(); }

  zoneT -= dt;
  if (zoneT <= 0) {
    zoneT = 0.25;
    const inside = !P.fly && !P.ride && Math.abs(camera.position.x - HALL.x) < 36 && Math.abs(camera.position.z - HALL.z) < 14;
    exposure = inside ? 1.25 : 1.2;
    $('zone').textContent = zoneOf(camera.position);
    $('mode').textContent = P.ride ? 'R next ride · X get off' : P.fly ? 'fly mode · F to land' : 'walk mode · F to fly · R to ride';
  }
  renderer.toneMappingExposure += (exposure - renderer.toneMappingExposure) * Math.min(1, dt * 3);

  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  const hit = slots.length ? raycaster.intersectObjects(slots, false)[0] : null;
  const a = hit?.object.userData.art || null;
  if (a !== lastPlaque) {
    lastPlaque = a;
    $('plaque').style.display = a ? 'block' : 'none';
    if (a) {
      $('ptitle').textContent = a.t;
      $('pmeta').textContent = `NO. ${String(a.n).padStart(4, '0')} · ${a.nb} · Era ${a.era} · ${touch ? 'tap' : 'E'} to see the piece`;
    }
  }
  rig?.update(dt);
  renderer.render(scene, camera);
}

// ---------- power ----------
// The loop draws at most 60 a second, 30 once nothing has been touched for twenty seconds, and about
// six while the window is not the one in front. Everything moves on dt (see HANDOFF_POWER_2026-10-12).
const POWER = { last: performance.now(), drawn: 0, blurred: !document.hasFocus(), frames: 0 };
const touched = () => { POWER.last = performance.now(); };
for (const ev of ['keydown', 'mousemove', 'mousedown', 'touchstart', 'touchmove', 'wheel']) addEventListener(ev, touched, { passive: true });
addEventListener('blur', () => { POWER.blurred = true; }); addEventListener('focus', () => { POWER.blurred = false; touched(); });
function powerBudget() { return POWER.blurred ? 160 : (performance.now() - POWER.last < 20000 || P.ride) ? 15.5 : 32; }
window.__POWER = POWER; window.__powerBudget = powerBudget;
function frame() {
  const nowMs = performance.now();
  if (nowMs - POWER.drawn < powerBudget()) { requestAnimationFrame(frame); return; }
  POWER.drawn = nowMs; POWER.frames++; tick(Math.min(clock.getDelta(), 0.05)); requestAnimationFrame(frame);
}
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

goTo(spots[0]);
$('loading').style.display = 'none';
$('start').style.display = 'flex';
window.__walk = { rig: () => rig, P, scene, camera, renderer, spots, goTo, cast, meta, slots, startRide, endRide, mixer, merged,
  tick: (dt = 1 / 60, n = 1) => { for (let i = 0; i < n; i++) tick(dt); } };
frame();
