/* The architecture kit: everything the rooms are built from. */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SU from 'three/examples/jsm/utils/SkeletonUtils.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import * as X from './textures';
import type { Piece } from './data';

export const v = (x: number, y: number, z: number) => new T.Vector3(x, y, z);
export type Mount = {
  position: T.Vector3;
  rotation: number;
  target: T.Vector3;
  width: number;
  height: number;
  style?: FrameStyle;
  wash?: boolean;
  lookAt?: T.Vector3;
  tilt?: number;
};
export type FrameStyle = 'gilt' | 'steel' | 'oak' | 'white' | 'black' | 'neon' | 'none' | 'enamel';
export type KitOpts = {
  renderer: T.WebGLRenderer;
  quality: 'high' | 'low';
  reduced: boolean;
  atlas: (a: number) => Promise<T.Texture>;
  atlasGrid: number;
  perAtlas: number;
  hour: number;
  dynamic: boolean;
  /* the date (YYYY-MM-DD) for the sun, and whether to follow the clock while the room is open */
  day?: string;
  live?: boolean;
};

/* Set ?audit=1 on the museum URL and every hang reports its own overflow to the console.
   Turns a 111 room walk into a twenty minute pass. */
const AUDIT = typeof location !== 'undefined' && /[?&]audit=1/.test(location.search);

const gltf = new GLTFLoader();
/* meshopt compressed sets (room 182 loads a whole baked terminal) need the decoder; plain GLBs are unaffected */
gltf.setMeshoptDecoder(MeshoptDecoder);
const propCache = new Map<string, Promise<T.Group>>();
/* The tree kit (2026-10-09): twelve New York species as branching skeletons with photo leaf cards,
   built by blender/build_tree_kit.py into assets/museum/trees/tree_<species>.glb (two variants, a near
   and a far version of each). k.tree queues trees; plantSpecies instances them per species. ?trees=old
   brings back the blob trees. */
export const TREE_SPECIES = ['plane', 'elm', 'locust', 'oak', 'linden', 'ginkgo', 'maple', 'cherry', 'pear', 'willow', 'pine', 'palm'] as const;
export type TreeSpecies = (typeof TREE_SPECIES)[number];
/* a room that names no species gets a New York street mix, chosen by seed so a row stays one kind */
const STREET_MIX: TreeSpecies[] = ['plane', 'linden', 'plane', 'locust', 'oak', 'plane'];
const OLD_TREES = typeof location !== 'undefined' && /[?&]trees=old/.test(location.search);
const treeCache = new Map<string, Promise<T.Group>>();
/* Photo surfaces (2026-10-09): Poly Haven CC0 sets in assets/museum/surfaces, their colour normalised to
   a neutral mean so the room's own tint still colours them. k.pbr swaps them in for the procedural
   painter of the same kind; repeat matches a photo tile to one procedural tile (12 brick courses, 6
   boards...). ?surfaces=old shows the painted canvases. */
const PHOTO: Record<string, { repeat: number; rot: number; normal: number; mean: number }> = {"brick": {repeat: 0.7, rot: 0, normal: 1.0, mean: 0.4}, "ashlar": {repeat: 1.0, rot: 0, normal: 1.6, mean: 0.4}, "planks": {repeat: 0.5, rot: 0, normal: 0.7, mean: 0.4}, "plaster": {repeat: 1.0, rot: 0, normal: 0.6, mean: 0.4}, "pavers": {repeat: 1.2, rot: 0, normal: 0.8, mean: 0.4}, "steel": {repeat: 1.0, rot: 0, normal: 0.5, mean: 0.4}, "concrete": {repeat: 1.0, rot: 0, normal: 0.7, mean: 0.4}, "grass": {repeat: 1.5, rot: 0, normal: 0.8, mean: 0.4}, "marble": {repeat: 1.0, rot: 0, normal: 0.4, mean: 0.4}, "asphalt": {repeat: 1.0, rot: 0, normal: 0.8, mean: 0.4}, "cobble": {repeat: 0.62, rot: 0, normal: 1.0, mean: 0.4}, "patina": {repeat: 1.0, rot: 0, normal: 0.6, mean: 0.4}, "terrazzo": {repeat: 1.0, rot: 0, normal: 0.7, mean: 0.4}, "boardwalk": {repeat: 0.5, rot: 1, normal: 0.8, mean: 0.4}};
/* ---------- New York time (2026-10-09): the real sun over Manhattan, every room ---------- */
const NYC = { lat: 40.7128, lon: -74.006 };
/* daylight saving in New York: second Sunday of March to first Sunday of November */
function nyOffset(y: number, m: number, d: number) {
  const sunday = (month: number, nth: number) => { const first = new Date(Date.UTC(y, month, 1)).getUTCDay(); return 1 + ((7 - first) % 7) + (nth - 1) * 7; };
  const t = m * 100 + d, start = 2 * 100 + sunday(2, 2), end = 10 * 100 + sunday(10, 1);
  return t >= start && t < end ? -4 : -5;
}
/* solar elevation and azimuth (degrees, azimuth from north clockwise) for a New York date and local hour (NOAA) */
export function nycSun(day: string, hour: number) {
  const [y, mo, d] = day.split('-').map(Number);
  const m = mo - 1, doy = Math.round((Date.UTC(y, m, d) - Date.UTC(y, 0, 0)) / 864e5);
  const g = ((2 * Math.PI) / 365) * (doy - 1 + (hour - 12) / 24);
  const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const tst = hour * 60 + eq + 4 * NYC.lon - 60 * nyOffset(y, m, d);
  const ha = ((tst / 4 - 180) * Math.PI) / 180, lat = (NYC.lat * Math.PI) / 180;
  const cz = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(ha);
  const zen = Math.acos(Math.max(-1, Math.min(1, cz)));
  let az = Math.acos(Math.max(-1, Math.min(1, (Math.sin(lat) * Math.cos(zen) - Math.sin(decl)) / (Math.cos(lat) * Math.sin(zen))))) * 180 / Math.PI;
  az = ha > 0 ? (az + 180) % 360 : (540 - az) % 360;
  return { el: 90 - (zen * 180) / Math.PI, az };
}
/* the New York wall clock now, as a fractional hour */
export function nyHourNow() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hourCycle: 'h23', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date());
  const v = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return v('hour') + v('minute') / 60;
}
const sstep = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const hdrLoader = new HDRLoader();
const hdrCache = new Map<string, Promise<T.DataTexture>>();
function loadHdr(name: string) {
  let p = hdrCache.get(name);
  if (!p) { p = hdrLoader.loadAsync(`assets/museum/hdri/${name}.hdr`) as Promise<T.DataTexture>; hdrCache.set(name, p); }
  return p;
}
/* ---------- MLow cabs (2026-10-09): every yellow cab becomes a real NYC taxi with the MLOW topper ---------- */
const OLD_CABS = typeof location !== 'undefined' && /[?&]cabs=old/.test(location.search);
/* private cars (2026-10-28): a box a room tags userData.car that is not cab yellow becomes a Camry or an Escape body,
   no topper, its paint the box's colour; ?cars=old keeps the boxes */
const OLD_CARS = typeof location !== 'undefined' && /[?&]cars=old/.test(location.search);
/* the crowd's cast (2026-10-28): every k.crowd walker becomes one of MLow's ON LOCATION characters, the whole model
   with its own sculpted eye flower head (the museum's npc_ files, decimated to 3k triangles near and 500 far, front
   baked to +z). One InstancedMesh per character and distance per room; ?crowd=old keeps the capsules. */
const OLD_CROWD = typeof location !== 'undefined' && /[?&]crowd=old/.test(location.search);
const CAST = ['actress', 'annieh', 'gown', 'cabbie', 'clerk', 'editor', 'felix', 'maitre', 'oscar', 'loretta', 'wiseguy', 'workgirl', 'tough', 'discoking'];
const CROWD_N = 12;   // crowds draw from the first twelve; tough and discoking only where a room names them   // broker and sonny stop above the knee: replaced by gown and loretta (whole, from assets/movies)
const SEATS = ['seat_robber', 'seat_folksinger'];   // whole seated cast (ON LOCATION), front to +z
const castFile = (v: number) => (v < CAST.length ? 'cast_' + CAST[v] : SEATS[v - CAST.length]);
/* Rooms tag their own primitive people so the kit can cast them (batch five, 2026-10-28): 'auto' decides standing or
   seated by height, 'seat' forces seated, 'part' is a head or hat to hide; `hs` turns the tagged geometry's height into
   the person's (a body capsule alone is about 0.8 of a person). */
export function personTag<O extends { userData: Record<string, unknown> }>(o: O, kind: 'auto' | 'seat' | 'part' = 'auto', hs = 1.06, cast?: string): O {
  o.userData.person = kind; o.userData.personH = hs; if (cast) o.userData.personCast = cast; return o;
}
/* the rigged cast (2026-10-28, UPGRADE ALL ROOMS 2026-10-28/rig, free Blender rigs with walk and idle clips and a bone
   named head): the nearest people become skinned clones that walk at their path's speed with planted feet, or stand
   and breathe and turn their head toward the visitor. Walk speeds and heights from rig_manifest.json; only figures whose
   result was good or acceptable. clerk and felix are idle only; the seated ones have no walk. ?rig=off keeps them all static. */
const OLD_RIG = typeof location !== 'undefined' && /[?&]rig=off/.test(location.search);
const RIG: Record<string, { walk: number; h: number }> = {
  actress: { walk: 0.55, h: 1.88 }, gown: { walk: 0.55, h: 1.88 }, loretta: { walk: 0.457, h: 1.88 }, maitre: { walk: 0.485, h: 1.88 },
  oscar: { walk: 0.869, h: 1.88 }, annieh: { walk: 0.457, h: 1.88 }, editor: { walk: 0.457, h: 1.88 }, wiseguy: { walk: 0.756, h: 1.88 },
  workgirl: { walk: 0.778, h: 1.88 }, cabbie: { walk: 0.711, h: 1.88 }, tough: { walk: 0.756, h: 1.88 }, discoking: { walk: 0.733, h: 1.88 }, clerk: { walk: 0, h: 1.88 }, felix: { walk: 0, h: 1.88 },
  robber: { walk: 0, h: 1.0 }, folksinger: { walk: 0, h: 1.5 },
};
/* rig files that face 90 degrees off +z (2026-10-28, UPGRADE ALL ROOMS 2026-10-28/shots/rig_facing; rig_pass.py turned every
   cast file the same -90 degrees). Of the museum's rigs only the tough (the Paradise Garage DJ); the rest are here so a room
   that names one later gets it right. The static cast_tough (near and far) faces the same way as its rig file, so it takes
   the same turn (CAST_FACE) and the static and skinned tiers agree; the other fifteen cast_ and seat_ files face +z. */
const CAST_FACE: Record<string, number> = { cast_tough: Math.PI / 2 };
const RIG_FACE: Record<string, number> = { blindwoman: -Math.PI / 2, hustler: -Math.PI / 2, lensman: Math.PI / 2, tough: Math.PI / 2, sally: Math.PI / 2 };
const rigName = (v: number) => (v < CAST.length ? CAST[v] : SEATS[v - CAST.length].replace('seat_', ''));
type RigT = { scene: T.Object3D; walk?: T.AnimationClip; idle?: T.AnimationClip };
const rigCache = new Map<string, Promise<RigT | null>>();
function loadRig(name: string) {
  let p = rigCache.get(name);
  if (!p) {
    p = new Promise<RigT | null>((res) => gltf.load(`assets/museum/rig/rig_${name}.glb`, (g) => {
      g.scene.traverse((c) => { if (c instanceof T.Mesh) for (const m of [c.material].flat() as T.MeshStandardMaterial[]) for (const v of Object.values(m)) if (v instanceof T.Texture) markShared(v); });
      res({ scene: g.scene, walk: g.animations.find((a) => a.name === 'walk'), idle: g.animations.find((a) => a.name === 'idle') });
    }, undefined, () => res(null)));
    rigCache.set(name, p);
  }
  return p;
}
/* a cast person: its matrix each frame, its cast index, drawn by the rig layer, in the near band last frame, and for a
   box crowd kept far (stadiums, Delacorte) the box instance it stands in for, hidden only while the cast draws it */
const ZERO4 = new T.Matrix4().makeScale(0, 0, 0), WHITE = new T.Color(1, 1, 1);
type CastFig = { m: T.Matrix4; v: number; skinned?: boolean; near?: boolean; tint?: T.Color; box?: { im: T.InstancedMesh; i: number; orig: T.Matrix4; off: boolean } };
/* a box crowd (stadium sections, theatre seats): the nearest become seated cast (the robber, the one seated pose that
   sits on a seat without bringing its own furniture), the far keep their boxes. `yaw` turns the cast to the box's front. */
export function boxCrowdTag<O extends { userData: Record<string, unknown> }>(o: O, yaw = 0, hs = 1.25, cast = 'seat_robber'): O {
  o.userData.person = 'seat'; o.userData.personH = hs; o.userData.personCast = cast; o.userData.personKeepFar = true; o.userData.personYaw = yaw; return o;
}
const CAST_H = 1.62;      // metres to the top of the flower at a.h 1, scale 1: the old capsule and head stood 1.5
const CAST_NEAR = 30;     // beyond this the 500 triangle body; on the low path (phones) 9
const CARS: { name: string; len: number }[] = [{ name: 'h_car_camry_lo', len: 4.88 }, { name: 'h_car_escape_lo', len: 4.6 }]; // the cab bodies at 4k triangles, 512 textures
/* The cab bodies carry MLow's cab yellow in their texture. A private car repaints only the yellow texels (in linear
   space red well above blue and real green), scaled by their brightness, so glass, tyres, lamps and trim keep their
   own colour. The paint is the instance colour on a fleet, a uniform on a single car. */
function paintable(src: T.Material, instanced: boolean, paint?: T.Color) {
  const m = src.clone() as T.MeshStandardMaterial;
  if (!m.map) { if (paint && !instanced) m.color.multiply(new T.Color(0.6, 0.6, 0.6)); return m; }
  const u = { value: paint ? paint.clone() : new T.Color(1, 1, 1) };
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uPaint = u;
    sh.fragmentShader = 'uniform vec3 uPaint;\n' + sh.fragmentShader
      .replace('#include <color_fragment>', '')
      .replace('#include <map_fragment>', `
#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D( map, vMapUv );
  float yel = smoothstep( 0.08, 0.22, sampledDiffuseColor.r - sampledDiffuseColor.b ) * smoothstep( 0.06, 0.14, sampledDiffuseColor.g ) * step( sampledDiffuseColor.g, sampledDiffuseColor.r * 1.1 );
  float lum = dot( sampledDiffuseColor.rgb, vec3( 0.2126, 0.7152, 0.0722 ) );
  vec3 paintC = ${instanced ? 'vColor.rgb' : 'uPaint'} * clamp( lum / 0.55, 0.35, 1.3 );
  diffuseColor.rgb *= mix( sampledDiffuseColor.rgb, paintC, yel );
  diffuseColor.a *= sampledDiffuseColor.a;
#endif`);
  };
  m.customProgramCacheKey = () => 'carpaint' + (instanced ? 'I' : 'U');
  return m;
}
const TAXI_LEN = 4.6;
/* the five cab types MLow photographed on the street, real lengths in metres (2026-10-09) */
const TAXIS: { name: string; len: number }[] = [
  { name: 'h_taxi', len: 4.6 },          // Toyota RAV4 hybrid
  { name: 'h_taxi_escape', len: 4.6 },   // Ford Escape hybrid
  { name: 'h_taxi_nv200', len: 4.4 },    // Nissan NV200
  { name: 'h_taxi_sienna', len: 5.17 },  // Toyota Sienna hybrid
  { name: 'h_taxi_camry', len: 4.88 },   // Toyota Camry hybrid
];
/* topper screens: 12 slots in a 2 x 6 atlas; slot 0 the MLOW mark, the rest MLow's paintings */
const SCREEN_SLOTS = 12;
function screenSlot(i: number): [number, number] { return [(i % 2) * 0.5, 1 - (Math.floor(i / 2) + 1) / 6]; }
function pickScreen(seed: number) { return seed % 5 < 2 ? 0 : 1 + (seed % (SCREEN_SLOTS - 1)); }
let screenMat: T.MeshBasicMaterial | null = null;
function topperScreenMaterial() {
  if (screenMat) return screenMat;
  const tex = new T.TextureLoader().load('assets/museum/taxi/screens.jpg');
  tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 8; markShared(tex);
  const m = new T.MeshBasicMaterial({ map: tex, toneMapped: false });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = 'attribute vec2 aSlot;\n' + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n  vMapUv = vec2(uv.x * 0.5 + aSlot.x, uv.y / 6.0 + aSlot.y);');
  };
  m.customProgramCacheKey = () => 'topperscreen';
  m.userData.screen = true;
  screenMat = m;
  return m;
}
/* a screen mesh with its slot as a plain vertex attribute (single cabs) */
function slotGeometry(g: T.BufferGeometry, slot: number) {
  const c = g.clone(), n = c.attributes.position.count, a = new Float32Array(n * 2), [u, v] = screenSlot(slot);
  for (let i = 0; i < n; i++) { a[i * 2] = u; a[i * 2 + 1] = v; }
  c.setAttribute('aSlot', new T.BufferAttribute(a, 2));
  return c;
}
function isCabYellow(c: T.Color) {
  const s = c.clone().convertLinearToSRGB(), hsl = { h: 0, s: 0, l: 0 };
  s.getHSL(hsl);
  return hsl.h > 0.1 && hsl.h < 0.17 && hsl.s > 0.55 && hsl.l > 0.3 && hsl.l < 0.7;
}
/* a cab sized box in the world: one long horizontal side of 3 to 6.5 m, a short one of 1.3 to 2.6, under 2.4 high */
function carLike(size: T.Vector3) {
  const L = Math.max(size.x, size.z), W = Math.min(size.x, size.z);
  return L > 3 && L < 6.5 && W > 1.2 && W < 2.7 && size.y > 0.4 && size.y < 2.5;
}
/* the shader flag that hides one instance of a fleet wherever its room moves it */
function hideable(im: T.InstancedMesh, hidden: Set<number>) {
  const n = im.instanceMatrix.count, a = new Float32Array(n);
  hidden.forEach((i) => (a[i] = 1));
  im.geometry = im.geometry.clone();
  im.geometry.setAttribute('aHide', new T.InstancedBufferAttribute(a, 1));
  const one = (m: T.Material) => {
    const c = m.clone();
    c.onBeforeCompile = (sh) => {
      sh.vertexShader = 'attribute float aHide;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  if (aHide > 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);');
    };
    c.customProgramCacheKey = () => 'cabhide';
    return c;
  };
  im.material = Array.isArray(im.material) ? im.material.map(one) : one(im.material);
  /* the shadow pass draws without the flag, so a hidden box would still throw its shadow */
  im.castShadow = false;
}
type SkyP = { top: number; horizon: number; ground: number; fog?: number; sun?: { az: number; el: number; color: number; size: number }; stars?: number; haze?: number; env?: number };
/* the room checks build rooms in node with a stub document: they keep the painted canvases */
const OLD_SURF = typeof document === 'undefined' || typeof document.createElementNS !== 'function' || (typeof location !== 'undefined' && /[?&]surfaces=old/.test(location.search));
const photoTex = new Map<string, T.Texture>();
function photoTexture(file: string, srgb: boolean, rep: number, rot: number, stretch = 1) {
  const key = `${file}:${rep}:${rot}:${stretch}`;
  let t = photoTex.get(key);
  if (!t) {
    t = texLoader.load(`assets/museum/surfaces/${file}`);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.repeat.set(rep, rep * stretch);
    t.rotation = (rot * Math.PI) / 2;
    t.anisotropy = 8;
    if (srgb) t.colorSpace = T.SRGBColorSpace;
    markShared(t);
    photoTex.set(key, t);
  }
  return t;
}
type TreeJob = { x: number; y: number; z: number; h: number; r: number; seed: number; leaf: number; bare: boolean; kind: string };
const treeWind = { value: 0 };
/* leaf colours in the rooms were picked for flat blobs; the photo leaves are tinted relative to this green */
const LEAF_REF = new T.Color(0x3f6b3e);
const leafRefU = { value: LEAF_REF };
const thumbCache = new Map<string, Promise<T.Texture>>();
const texLoader = new T.TextureLoader();

export function loadThumb(url: string) {
  let p = thumbCache.get(url);
  if (!p) {
    p = new Promise((res, rej) => texLoader.load(url, (t) => {
      t.colorSpace = T.SRGBColorSpace;
      t.anisotropy = 8;
      res(t);
    }, undefined, rej));
    thumbCache.set(url, p);
  }
  return p;
}

/* A landmark easter egg: a real feature of the real place, hidden in plain sight. Tap it and the
   museum tells you what it is. `id` is a slug unique within the room; `room` optionally names
   another museum room the card can walk you to. Every fact carries the source it was checked on. */
export type EggData = { id: string; title: string; text: string; clue: string; year?: string; source: { name: string; url: string }; room?: string };
export type Egg = { data: EggData; hit: T.Mesh; glint: T.Sprite | null; found: boolean; target: T.Object3D | null; center: T.Vector3; r?: number };
let glintTex: T.Texture | null = null;
function glintTexture() {
  if (glintTex) return glintTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const rad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  rad.addColorStop(0, 'rgba(255,255,255,1)');
  rad.addColorStop(0.18, 'rgba(190,250,255,.85)');
  rad.addColorStop(0.5, 'rgba(0,229,255,.18)');
  rad.addColorStop(1, 'rgba(0,229,255,0)');
  g.fillStyle = rad;
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = 'rgba(255,255,255,.9)';
  for (const [w, h] of [[3, 120], [120, 3]]) g.fillRect(64 - w / 2, 64 - h / 2, w, h);
  glintTex = markShared(new T.CanvasTexture(c));
  glintTex.colorSpace = T.SRGBColorSpace;
  return glintTex;
}

export class Kit {
  objects: T.Mesh[] = [];
  eggs: Egg[] = [];
  dynamic = new Set<T.Object3D>();
  clickables: T.Object3D[] = [];
  ticks: ((t: number, dt: number) => void)[] = [];
  live = true;
  private mats = new Map<string, T.Material>();
  private extras: T.Object3D[] = [];
  private rt: T.WebGLRenderTarget | null = null;
  private pmrem: T.PMREMGenerator | null = null;
  keepOut: { x: number; z: number; r: number }[] = [];
  blocks: { x0: number; x1: number; z0: number; z1: number }[] = [];
  pending: Promise<unknown>[] = [];
  /* 0 by day, 1 deep in the night, from the New York hour when the room is daylit */
  night = 0;
  /* every external asset a room touched, so a mint kit can copy exactly what it needs */
  used = { atlases: new Set<number>(), thumbs: new Set<string>(), props: new Set<string>(), images: new Set<string>() };
  dusk = 0;
  block(x0: number, x1: number, z0: number, z1: number) {
    this.blocks.push({ x0, x1, z0, z1 });
  }
  /* New York time: the sun's elevation now, whether this room was authored at night, and what to re-time */
  sunEl = 45;
  sunAz = 180;
  authoredNight = false;
  private timeHour = 12;
  private skyBase: SkyP | null = null;
  private skyDome: T.Mesh | null = null;
  private envName = '';
  private hemis: { l: T.HemisphereLight; i: number }[] = [];
  private suns: { l: T.DirectionalLight; color: number; i: number; pos: T.Vector3; auto: boolean }[] = [];
  private lamps: { l: T.PointLight; i: number }[] = [];
  private lampMats = new Map<number, T.MeshBasicMaterial>();
  constructor(public scene: T.Scene, public o: KitOpts) {
    this.setPhase(o.hour);
  }
  /* night 1 under about 9 degrees below the horizon, dusk is the golden band either side of sunrise and sunset */
  private setPhase(hour: number) {
    this.timeHour = hour;
    if (!this.o.dynamic) return;
    const sun = nycSun(this.o.day ?? new Date().toISOString().slice(0, 10), hour);
    this.sunEl = sun.el; this.sunAz = sun.az;
    this.night = 1 - sstep(-9, 1, sun.el);
    this.dusk = sstep(-7, -1, sun.el) * (1 - sstep(7, 15, sun.el));
  }
  private lampOn() { return Math.min(1, this.night * 1.3 + this.dusk * 0.6); }

  /* ---------- materials ---------- */
  flat(color: number, metalness = 0, roughness = 0.7, extra: Partial<T.MeshStandardMaterialParameters> = {}) {
    const key = ['f', color, metalness, roughness, JSON.stringify(extra)].join(':');
    let m = this.mats.get(key) as T.MeshStandardMaterial;
    if (!m) {
      m = new T.MeshStandardMaterial({ color, metalness, roughness, ...extra });
      this.mats.set(key, m);
    }
    return m;
  }
  /* A textured surface with world-space UVs: density is tiles per scene unit. */
  pbr(
    name: string,
    s: X.Surface,
    density: number,
    p: Partial<T.MeshStandardMaterialParameters> & { normal?: number; stretch?: number } = {},
  ) {
    const key = ['p', name, density, JSON.stringify({ ...p })].join(':');
    let m = this.mats.get(key) as T.MeshStandardMaterial;
    if (!m) {
      const { normal = 1, stretch = 1, ...rest } = p;
      const params: T.MeshStandardMaterialParameters = {
        map: s.map,
        normalMap: s.normalMap,
        roughnessMap: s.roughnessMap,
        normalScale: new T.Vector2(normal, normal),
        roughness: 1,
        metalness: 0,
        ...rest,
      };
      if (s.emissiveMap) params.emissiveMap = s.emissiveMap;
      const ph = !OLD_SURF && s.kind && !s.emissiveMap ? PHOTO[s.kind] : undefined;
      if (ph) {
        const q = this.o.quality === 'high' ? '' : '_s';
        params.map = photoTexture(`${s.kind}_c${q}.jpg`, true, ph.repeat, ph.rot, stretch);
        params.normalMap = photoTexture(`${s.kind}_n${q}.jpg`, false, ph.repeat, ph.rot, stretch);
        params.roughnessMap = photoTexture(`${s.kind}_r${q}.jpg`, false, ph.repeat, ph.rot, stretch);
        params.normalScale = new T.Vector2(normal * ph.normal, normal * ph.normal);
        /* the photo's mean is neutral grey at ph.mean (linear): the tint scaled back up gives the room's colour */
        const tint = new T.Color(s.tint ?? 0x888888).multiplyScalar(1 / ph.mean);
        if (rest.color !== undefined) tint.multiply(new T.Color(rest.color as T.ColorRepresentation));
        params.color = tint;
      }
      m = new T.MeshStandardMaterial(params);
      if (stretch !== 1 && !ph) {
        for (const t of [s.map, s.normalMap, s.roughnessMap, s.emissiveMap])
          if (t) {
            const c = t.clone();
            c.repeat.set(1, stretch);
            c.needsUpdate = true;
            if (t === s.map) m.map = c;
            else if (t === s.normalMap) m.normalMap = c;
            else if (t === s.roughnessMap) m.roughnessMap = c;
            else m.emissiveMap = c;
          }
      }
      m.userData.density = density;
      this.mats.set(key, m);
    }
    return m;
  }
  glow(color: number, opacity = 1) {
    const key = ['g', color, opacity].join(':');
    let m = this.mats.get(key) as T.MeshBasicMaterial;
    if (!m) {
      m = new T.MeshBasicMaterial({ color, transparent: opacity < 1, opacity });
      this.mats.set(key, m);
    }
    return m;
  }
  glass(color = 0xb9dde8, opacity = 0.22, roughness = 0.12) {
    const key = ['gl', color, opacity, roughness].join(':');
    let m = this.mats.get(key) as T.MeshPhysicalMaterial;
    if (!m) {
      m = new T.MeshPhysicalMaterial({
        color,
        transparent: true,
        opacity,
        roughness,
        metalness: 0.1,
        side: T.DoubleSide,
        depthWrite: false,
      });
      this.mats.set(key, m);
    }
    return m;
  }

  /* ---------- geometry ---------- */
  mesh(g: T.BufferGeometry, m: T.Material, x = 0, y = 0, z = 0, dynamic = false) {
    const o = new T.Mesh(g, m);
    o.position.set(x, y, z);
    this.scene.add(o);
    if (dynamic) this.dynamic.add(o);
    else this.objects.push(o);
    return o;
  }
  box(w: number, h: number, d: number, x: number, y: number, z: number, m: T.Material) {
    return this.mesh(new T.BoxGeometry(w, h, d), m, x, y, z);
  }
  cyl(r: number, h: number, x: number, y: number, z: number, m: T.Material, r2 = r, seg = 18) {
    return this.mesh(new T.CylinderGeometry(r2, r, h, seg), m, x, y, z);
  }
  sphere(r: number, x: number, y: number, z: number, m: T.Material, seg = 14) {
    return this.mesh(new T.SphereGeometry(r, seg, Math.max(6, seg * 0.7)), m, x, y, z);
  }
  plane(w: number, h: number, x: number, y: number, z: number, m: T.Material, rotY = 0, rotX = 0) {
    const o = this.mesh(new T.PlaneGeometry(w, h), m, x, y, z);
    o.rotation.set(rotX, rotY, 0);
    return o;
  }
  rounded(w: number, h: number, d: number, x: number, y: number, z: number, m: T.Material, r = 0.06) {
    const s = new T.Shape();
    const a = w / 2,
      b = h / 2;
    r = Math.min(r, a * 0.4, b * 0.4);
    s.moveTo(-a + r, -b);
    s.lineTo(a - r, -b);
    s.quadraticCurveTo(a, -b, a, -b + r);
    s.lineTo(a, b - r);
    s.quadraticCurveTo(a, b, a - r, b);
    s.lineTo(-a + r, b);
    s.quadraticCurveTo(-a, b, -a, b - r);
    s.lineTo(-a, -b + r);
    s.quadraticCurveTo(-a, -b, -a + r, -b);
    const g = new T.ExtrudeGeometry(s, {
      depth: d,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: r * 0.2,
      bevelThickness: r * 0.2,
      curveSegments: 5,
    });
    g.translate(0, 0, -d / 2);
    return this.mesh(g, m, x, y, z);
  }
  lathe(profile: number[][], x: number, y: number, z: number, m: T.Material, segments = 24) {
    return this.mesh(new T.LatheGeometry(profile.map((p) => new T.Vector2(p[0], p[1])), segments), m, x, y, z);
  }
  beam(a: T.Vector3, b: T.Vector3, r: number, m: T.Material, seg = 7) {
    const o = this.mesh(new T.CylinderGeometry(r, r, a.distanceTo(b), seg), m);
    o.position.copy(a).add(b).multiplyScalar(0.5);
    o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    return o;
  }
  bar(a: T.Vector3, b: T.Vector3, w: number, h: number, m: T.Material) {
    const o = this.mesh(new T.BoxGeometry(w, a.distanceTo(b), h), m);
    o.position.copy(a).add(b).multiplyScalar(0.5);
    o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    return o;
  }
  curve(points: T.Vector3[], r: number, m: T.Material, segments = 48, closed = false) {
    return this.mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points, closed), segments, r, 7, closed), m);
  }
  torus(r: number, tube: number, x: number, y: number, z: number, m: T.Material, seg = 48) {
    return this.mesh(new T.TorusGeometry(r, tube, 8, seg), m, x, y, z);
  }
  /* A genuine opening cut from an extruded solid. */
  arch(w: number, h: number, depth: number, x: number, y: number, z: number, m: T.Material, pointed = false, margin = 0.65) {
    const s = new T.Shape();
    s.moveTo(-w * margin, 0);
    s.lineTo(w * margin, 0);
    s.lineTo(w * margin, h * 1.13);
    s.lineTo(-w * margin, h * 1.13);
    s.closePath();
    const hole = new T.Path();
    hole.moveTo(-w / 2, 0.05);
    hole.lineTo(-w / 2, h * 0.65);
    if (pointed) {
      hole.quadraticCurveTo(-w * 0.4, h * 0.91, 0, h);
      hole.quadraticCurveTo(w * 0.4, h * 0.91, w / 2, h * 0.65);
    } else hole.absellipse(0, h * 0.65, w / 2, h * 0.35, Math.PI, 0, true);
    hole.lineTo(w / 2, 0.05);
    hole.closePath();
    s.holes.push(hole);
    const g = new T.ExtrudeGeometry(s, {
      depth,
      bevelEnabled: true,
      bevelSize: 0.035,
      bevelThickness: 0.035,
      bevelSegments: 2,
      curveSegments: 24,
    });
    g.translate(0, 0, -depth / 2);
    return this.mesh(g, m, x, y, z);
  }
  /* A wall pierced by a row of arches, one extrusion. */
  arcade(len: number, h: number, depth: number, bays: number, bayW: number, bayH: number, x: number, y: number, z: number, m: T.Material, rotY = 0, pointed = false) {
    const s = new T.Shape();
    s.moveTo(-len / 2, 0);
    s.lineTo(len / 2, 0);
    s.lineTo(len / 2, h);
    s.lineTo(-len / 2, h);
    s.closePath();
    const pitch = len / bays;
    for (let i = 0; i < bays; i++) {
      const cx = -len / 2 + pitch * (i + 0.5);
      const hole = new T.Path();
      hole.moveTo(cx - bayW / 2, 0.02);
      hole.lineTo(cx - bayW / 2, bayH - bayW / 2);
      if (pointed) {
        hole.quadraticCurveTo(cx - bayW * 0.4, bayH - bayW * 0.1, cx, bayH);
        hole.quadraticCurveTo(cx + bayW * 0.4, bayH - bayW * 0.1, cx + bayW / 2, bayH - bayW / 2);
      } else hole.absarc(cx, bayH - bayW / 2, bayW / 2, Math.PI, 0, true);
      hole.lineTo(cx + bayW / 2, 0.02);
      hole.closePath();
      s.holes.push(hole);
    }
    const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 20 });
    g.translate(0, 0, -depth / 2);
    const o = this.mesh(g, m, x, y, z);
    o.rotation.y = rotY;
    return o;
  }
  /* Profiled cornice or moulding swept along a straight run. */
  moulding(profile: [number, number][], len: number, x: number, y: number, z: number, m: T.Material, rotY = 0) {
    const s = new T.Shape();
    s.moveTo(profile[0][0], profile[0][1]);
    for (const p of profile.slice(1)) s.lineTo(p[0], p[1]);
    s.closePath();
    const g = new T.ExtrudeGeometry(s, { depth: len, bevelEnabled: false });
    g.translate(0, 0, -len / 2);
    const o = this.mesh(g, m, x, y, z);
    o.rotation.y = rotY;
    return o;
  }
  column(x: number, y: number, z: number, h: number, r: number, m: T.Material, fluted = false, cap: T.Material = m) {
    const shaft = this.lathe(
      [[r * 1.45, 0], [r * 1.45, 0.1], [r * 1.1, 0.2], [r * 0.92, 0.35], [r * 0.82, h - 0.4], [r * 0.9, h - 0.3]],
      x, y, z, m, 20,
    );
    this.lathe([[r * 0.9, 0], [r * 1.35, 0.14], [r * 1.5, 0.3], [r * 1.5, 0.42]], x, y + h - 0.42, z, cap, 20);
    if (fluted)
      for (let k = 0; k < 14; k++) {
        const t = (k / 14) * Math.PI * 2;
        this.beam(v(x + Math.cos(t) * r * 0.85, y + 0.45, z + Math.sin(t) * r * 0.85), v(x + Math.cos(t) * r * 0.79, y + h - 0.5, z + Math.sin(t) * r * 0.79), r * 0.09, cap, 5);
      }
    return shaft;
  }
  sign(text: string, w: number, h: number, x: number, y: number, z: number, bg: string, fg: string, size: number, rotY = 0, opts: { border?: boolean; font?: string; double?: boolean } = {}) {
    const t = X.signText(text, 1024, Math.max(64, Math.round((1024 * h) / w)), bg, fg, size, opts);
    const o = this.mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: t, side: opts.double ? T.DoubleSide : T.FrontSide, transparent: bg === 'transparent' }), x, y, z, true);
    o.rotation.y = rotY;
    this.extras.push(o);
    return o;
  }
  /* ---------- the house marks ---------- */
  /* Every room carries the identity, and it is placed from the room's own
     spawn and look so no room has to position anything by hand: a plaque
     standing beside the visitor where they arrive, carrying the MLOW mark, the
     room name and a Blossom icon, and the eye set into the ground a few paces
     ahead so it reads in the first frame. Both are clamped inside the room's
     walkable bounds, so a room with tight geometry cannot push them into a
     wall. */
  brand(b: { spawn: T.Vector3; look: T.Vector3; bounds: [number, number, number, number]; floorY?: (x: number, z: number) => number }, roomName: string) {
    const B = 'assets/brand/';
    const at = (x: number, z: number) => (b.floorY ? b.floorY(x, z) : 0);
    const cl = (v: number, lo: number, hi: number) => (lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v)));
    const [x0, x1, z0, z1] = b.bounds;
    const f = new T.Vector3().subVectors(b.look, b.spawn).setY(0);
    if (f.lengthSq() < 1e-6) f.set(0, 0, -1);
    f.normalize();
    const right = new T.Vector3(-f.z, 0, f.x);
    const facing = Math.atan2(-f.x, -f.z);
    const out = new T.Vector3(-f.x, 0, -f.z);

    /* the arrival plaque */
    const px = cl(b.spawn.x + right.x * 1.85 + f.x * 1.15, x0 + 0.7, x1 - 0.7),
      pz = cl(b.spawn.z + right.z * 1.85 + f.z * 1.15, z0 + 0.7, z1 - 0.7),
      py = at(px, pz);
    const ink = this.flat(0x0d0d0d, 0.15, 0.5),
      post = this.flat(0x2a3040, 0.65, 0.4);
    this.cyl(0.04, 1.08, px, py + 0.54, pz, post);
    this.cyl(0.17, 0.05, px, py + 0.03, pz, post);
    const plate = this.box(1.24, 0.78, 0.05, px, py + 1.46, pz, ink);
    plate.rotation.y = facing;
    const face = (d: number) => ({ x: px + out.x * d, z: pz + out.z * d });
    const lw = 0.86,
      l1 = face(0.035);
    const logo = this.mesh(new T.PlaneGeometry(lw, lw / 4.03), this.image(B + 'logo_white.png', { emissive: 0xdfe8f5 }), l1.x, py + 1.66, l1.z);
    logo.rotation.y = facing;
    this.extras.push(logo);
    this.sign(roomName.toUpperCase(), 1.02, 0.115, l1.x, py + 1.45, l1.z, 'transparent', '#8899AA', 72, facing, { double: true });
    this.sign('NEW YORKERS  ·  A CENSUS BY MLOW  ·  WITH BLOSSOM', 1.06, 0.072, l1.x, py + 1.28, l1.z, 'transparent', '#2962FF', 54, facing, { double: true });
    const bl = face(0.032);
    const bloss = this.mesh(new T.PlaneGeometry(0.2, 0.2), this.image(B + 'blossom_03_white.png'), bl.x + right.x * 0.5, py + 1.13, bl.z + right.z * 0.5);
    bloss.rotation.y = facing;
    this.extras.push(bloss);
    this.keepOut.push({ x: px, z: pz, r: 0.5 });

    /* the eye, set into the ground a few paces along the walk */
    const ex = cl(b.spawn.x + f.x * 3.6, x0 + 1.0, x1 - 1.0),
      ez = cl(b.spawn.z + f.z * 3.6, z0 + 1.0, z1 - 1.0);
    const ey = at(ex, ez);
    const ring = this.mesh(new T.RingGeometry(1.34, 1.5, 64), this.flat(0x2962ff, 0.2, 0.45), ex, ey + 0.014, ez);
    ring.rotation.x = -Math.PI / 2;
    const eye = this.mesh(new T.PlaneGeometry(2.3, 2.3), this.image(B + 'eye_truecolor.png', { emissive: 0x2962ff }), ex, ey + 0.02, ez);
    eye.rotation.set(-Math.PI / 2, 0, -Math.atan2(f.x, f.z));
    this.extras.push(eye);
    this.extras.push(ring);

    /* the house banner on the wall behind the visitor, so the mark is in the room and not only underfoot.
       It sits along the reverse of the opening look vector, which is by construction outside the opening shot,
       and is dropped whenever that point falls outside the room or the room is too small to carry it. */
    const wide = x1 - x0, deep = z1 - z0;
    if (wide > 11 && deep > 11) {
      const bx = b.spawn.x + out.x * 7.4, bz = b.spawn.z + out.z * 7.4;
      if (bx > x0 + 0.6 && bx < x1 - 0.6 && bz > z0 + 0.6 && bz < z1 - 0.6) {
        const by = at(bx, bz) + 3.15;
        const bLogo = this.mesh(new T.PlaneGeometry(3.2, 3.2 / 4.03), this.image(B + 'logo_white.png', { emissive: 0xdfe8f5 }), bx, by, bz);
        bLogo.rotation.y = facing + Math.PI;
        this.extras.push(bLogo);
        for (const sgn of [-1, 1]) {
          const fx = bx + right.x * sgn * 2.55, fz = bz + right.z * sgn * 2.55;
          const fl = this.mesh(new T.PlaneGeometry(0.66, 0.66), this.image(B + (sgn < 0 ? 'blossom_01_white.png' : 'blossom_05_white.png')), fx, by - 0.04, fz);
          fl.rotation.y = facing + Math.PI;
          this.extras.push(fl);
        }
        this.sign('EVERY NEW YORKER GETS A PORTRAIT  ·  EVEN THE VILLAINS', 4.2, 0.24, bx, by - 0.72, bz, 'transparent', '#8899aa', 46, facing + Math.PI, { double: true });
      }
    }
  }

  /* ---------- landmark eggs ---------- */
  /* Hide a landmark egg on an object, or at a point. An object is pulled out of the static merge so
     it keeps its own identity; a point gets an invisible tap target of radius r. Either way the egg
     is a hidden sphere the tap ray can find (and walls in front of it block), plus a slow glint so a
     visitor on a phone knows there is something to tap. Place the object before calling this. */
  egg(target: T.Object3D | T.Vector3, data: EggData, p: { r?: number; glint?: boolean } = {}) {
    let obj: T.Object3D | null = null;
    if (target instanceof T.Object3D) {
      obj = target;
      const i = this.objects.indexOf(target as T.Mesh);
      if (i >= 0) { this.objects.splice(i, 1); this.dynamic.add(target); }
    }
    const hit = new T.Mesh(new T.SphereGeometry(1, 10, 8), new T.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true }));
    hit.visible = false;               // the ray still finds it; the renderer and the GLB export do not
    hit.userData.egg = data;
    this.scene.add(hit);
    this.clickables.push(hit);
    let glint: T.Sprite | null = null;
    if (p.glint !== false) {
      glint = new T.Sprite(new T.SpriteMaterial({ map: glintTexture(), transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.8 }));
      glint.renderOrder = 3;
      this.scene.add(glint);
    }
    const e: Egg = { data, hit, glint, found: false, target: obj, center: target instanceof T.Vector3 ? target.clone() : new T.Vector3(), r: p.r };
    this.eggs.push(e);
    this.placeEgg(e);
    return e;
  }
  private placeEgg(e: Egg) {
    let r = e.r ?? 0.8;
    if (e.target) {
      e.target.updateMatrixWorld(true);
      const bb = new T.Box3().setFromObject(e.target);
      if (!bb.isEmpty()) {
        bb.getCenter(e.center);
        r = e.r ?? T.MathUtils.clamp(bb.getSize(new T.Vector3()).length() / 2, 0.5, 3);
      }
    }
    e.hit.position.copy(e.center);
    e.hit.scale.setScalar(r);
    e.hit.updateMatrixWorld(true);   // tappable before the first frame renders
    if (e.glint) {
      e.glint.position.set(e.center.x, e.center.y + Math.min(r, 1.6) * 0.55 + 0.3, e.center.z);
      e.glint.scale.setScalar(0.55);
    }
  }
  /* Mark which eggs this visitor has already found; found eggs stop glinting. */
  markEggs(found: (id: string) => boolean) {
    for (const e of this.eggs) { e.found = found(e.data.id); if (e.glint) e.glint.visible = !e.found; }
  }
  showGlints(on: boolean) {
    for (const e of this.eggs) if (e.glint) e.glint.visible = on && !e.found;
  }

  instances(g: T.BufferGeometry, m: T.Material, transforms: T.Matrix4[]) {
    const o = new T.InstancedMesh(g, m, transforms.length);
    transforms.forEach((t, i) => o.setMatrixAt(i, t));
    o.instanceMatrix.needsUpdate = true;
    o.computeBoundingSphere();
    o.castShadow = o.receiveShadow = this.o.quality === 'high';
    this.scene.add(o);
    this.dynamic.add(o);
    return o;
  }
  add(o: T.Object3D) {
    this.scene.add(o);
    this.dynamic.add(o);
    return o;
  }

  /* A material carrying an image file (logos, marks, posters). Loads through pending so exports wait for it. */
  image(url: string, p: { emissive?: number; color?: number; opaque?: boolean; roughness?: number } = {}) {
    const m = new T.MeshStandardMaterial({ color: p.color ?? 0xffffff, roughness: p.roughness ?? 0.6, metalness: 0, transparent: !p.opaque, alphaTest: p.opaque ? 0 : 0.05, side: T.DoubleSide });
    const load = new Promise<void>((res) => new T.TextureLoader().load(url, (t) => {
      t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
      m.map = t;
      if (p.emissive) { m.emissive = new T.Color(p.emissive); m.emissiveMap = t; m.emissiveIntensity = 1.2; }
      m.needsUpdate = true; res();
    }, undefined, () => res()));
    this.pending.push(load);
    this.used.images.add(url);
    return m;
  }

  /* ---------- motion helpers (v3) ---------- */
  /* A smooth curve through points: rides, boats, trains, crowds. */
  spline(points: T.Vector3[], closed = false, tension = 0.5) {
    return new T.CatmullRomCurve3(points, closed, 'catmullrom', tension);
  }
  /* Keep an object moving along a curve forever, nose along the tangent. speed in metres per second, or a function of height for coasters. */
  rider(obj: T.Object3D, curve: T.Curve<T.Vector3>, speed: number | ((y: number) => number), offset = 0) {
    const len = curve.getLength();
    let s = ((offset % len) + len) % len;
    const tan = new T.Vector3();
    const step = (_t: number, dt: number) => {
      const v = typeof speed === 'function' ? speed(obj.position.y) : speed;
      s = (s + v * Math.min(dt, 0.1) + len) % len;
      const u = s / len;
      curve.getPointAt(u, obj.position);
      curve.getTangentAt(u, tan);
      obj.lookAt(tan.add(obj.position));
    };
    step(0, 0);
    this.ticks.push(step);
    return obj;
  }
  /* People: instanced capsule figures walking a route in both directions, each with a colour, a height and a stride bob. */
  crowd(route: T.Vector3[], n: number, p: { seed?: number; speed?: number; spread?: number; scale?: number; colors?: number[]; animate?: boolean; closed?: boolean } = {}) {
    const { seed = 1, speed = 1.1, spread = 1.2, scale = 1, animate = true, closed = false, colors = [0x24262c, 0x8a3a3a, 0x33477f, 0xd8d0c0, 0x4a6a3a, 0x151517, 0xc9a25a, 0x6a4a8a, 0xe6e2da, 0x2b5f6e] } = p;
    const rnd = X.mulberry(seed);
    const curve = new T.CatmullRomCurve3(route, closed, 'catmullrom', 0.5);
    const len = curve.getLength();
    const body = new T.InstancedMesh(new T.CapsuleGeometry(0.2 * scale, 0.82 * scale, 3, 8), new T.MeshStandardMaterial({ roughness: 0.85 }), n);
    const head = new T.InstancedMesh(new T.SphereGeometry(0.125 * scale, 10, 8), new T.MeshStandardMaterial({ roughness: 0.7 }), n);
    const skins = [0xf1d3b5, 0xc8a284, 0x8d5a3b, 0x5a3a26, 0xe9c2a0, 0xa77653];
    const st = Array.from({ length: n }, () => ({ s: rnd() * len, v: speed * (0.7 + rnd() * 0.6) * (rnd() > 0.5 ? 1 : -1), off: (rnd() - 0.5) * spread, h: 0.88 + rnd() * 0.24 }));
    const c = new T.Color();
    for (let i = 0; i < n; i++) { body.setColorAt(i, c.set(colors[Math.floor(rnd() * colors.length)])); head.setColorAt(i, c.set(skins[Math.floor(rnd() * skins.length)])); }
    body.castShadow = head.castShadow = this.o.quality === 'high';
    this.add(body); this.add(head);
    /* the cast: a separate seeded draw so the capsules' own randomness is unchanged */
    const crnd = X.mulberry(seed * 31 + 7), figs = OLD_CROWD ? [] : Array.from({ length: n }, () => ({ m: new T.Matrix4(), v: Math.floor(crnd() * CROWD_N) }));
    this.castFigs.push(...figs); if (figs.length) this.castOld.push(body, head);
    const fsc = new T.Vector3();
    const m = new T.Matrix4(), q = new T.Quaternion(), pos = new T.Vector3(), tan = new T.Vector3(), side = new T.Vector3(), sc = new T.Vector3(), up = new T.Vector3(0, 1, 0), lift = new T.Vector3();
    const place = (t: number, dt: number) => {
      for (let i = 0; i < n; i++) {
        const a = st[i];
        a.s = (((a.s + a.v * Math.min(dt, 0.1)) % len) + len) % len;
        const u = a.s / len;
        curve.getPointAt(u, pos); curve.getTangentAt(u, tan);
        side.set(-tan.z, 0, tan.x).normalize();
        pos.addScaledVector(side, a.off);
        const dir = Math.sign(a.v) || 1;
        q.setFromAxisAngle(up, Math.atan2(tan.x * dir, tan.z * dir));
        const bob = 1 + 0.025 * Math.sin(t * 7 + i * 1.3);
        sc.set(1, a.h * bob, 1);
        lift.set(0, 0.61 * a.h * scale * bob, 0);
        m.compose(pos.clone().add(lift), q, sc); body.setMatrixAt(i, m);
        lift.set(0, (1.22 * a.h * bob + 0.13) * scale, 0);
        sc.set(1, 1, 1);
        m.compose(pos.clone().add(lift), q, sc); head.setMatrixAt(i, m);
        if (figs.length) { const H = CAST_H * a.h * scale; lift.set(0, 0.02 * Math.max(0, Math.sin(t * 7 + i * 1.3)) * scale, 0); fsc.set(H, H * (1 + 0.012 * Math.sin(t * 7 + i * 1.3)), H); figs[i].m.compose(pos.clone().add(lift), q, fsc); }
      }
      body.instanceMatrix.needsUpdate = head.instanceMatrix.needsUpdate = true;
    };
    place(0, 0);
    if (animate) this.ticks.push(place);
    return { body, head };
  }

  /* ---------- world ---------- */
  sky(p: SkyP) {
    this.skyBase = { ...p };
    /* a sky painted for night (Dyker Heights, the Vanguard) gets a real day when New York has one */
    this.authoredNight = this.o.dynamic && new T.Color(p.top).getHSL({ h: 0, s: 0, l: 0 }).l < 0.12;
    const q = this.skyParams();
    const tex = X.skyCanvas(q.top, q.horizon, q.ground, { sun: q.sun, stars: q.stars, haze: q.haze });
    this.scene.background = new T.Color(q.horizon);
    this.scene.fog = new T.FogExp2(q.horizon, q.fog ?? 0.004);
    const dome = new T.Mesh(new T.SphereGeometry(700, 48, 24), new T.MeshBasicMaterial({ map: tex, side: T.BackSide, fog: false, depthWrite: false }));
    dome.renderOrder = -10;
    this.add(dome);
    this.skyDome = dome;
    this.pmrem = new T.PMREMGenerator(this.o.renderer);
    this.rt = this.pmrem.fromEquirectangular(tex);
    this.scene.environment = this.rt.texture;
    this.scene.environmentIntensity = q.env ?? 0.55;
    if (this.authoredNight && !this.suns.some((s) => s.auto)) this.sun(0xfff1dc, 2.6, 60, 80, 40, true, 90, true);
    this.useHdri(q.env ?? 0.55);
    if (this.o.dynamic && this.o.live && !this.o.reduced) {
      let last = 0;
      this.ticks.push((t) => { if (t - last < 120) return; last = t; this.retime(nyHourNow()); });
    }
    return tex;
  }
  /* the room's sky at the current New York hour */
  private skyParams(): SkyP {
    const p = this.skyBase!;
    if (!this.o.dynamic) return p;
    const n = this.night, d = this.dusk;
    const mixc = (a: number, b: number, t: number) => new T.Color(a).lerp(new T.Color(b), t).getHex();
    const day: SkyP = this.authoredNight
      ? { ...p, top: 0x5b8fd6, horizon: 0xcbd9e6, ground: mixc(p.ground, 0x6e7a66, 0.7), stars: 0, env: 0.55, fog: Math.min(p.fog ?? 0.004, 0.005), sun: { az: p.sun?.az ?? 2.3, el: 0.8, color: 0xfff2dc, size: 5 } }
      : { ...p };
    const q: SkyP = { ...day };
    const el = Math.max(0.03, (this.sunEl * Math.PI) / 180);
    q.top = mixc(mixc(day.top, 0x9a6f8a, d * 0.5), 0x05070f, n);
    q.horizon = mixc(mixc(day.horizon, 0xf0a06a, d * 0.65), 0x121a2c, n * 0.9);
    q.ground = mixc(day.ground, 0x07090e, n * 0.8);
    q.stars = Math.max(day.stars || 0, Math.round(900 * Math.max(0, n - 0.2)));
    if (n > 0.55) q.sun = { az: 2.4, el: 0.6, color: 0xdfe8ff, size: 6 };
    else if (q.sun) q.sun = { ...q.sun, el: Math.min(q.sun.el, el), color: mixc(q.sun.color, 0xff9a55, d), size: q.sun.size * (1 + d * 0.6) };
    q.env = (day.env ?? 0.55) * (1 - 0.6 * n);
    q.fog = (day.fog ?? 0.004) * (1 + 0.6 * n);
    if (this.authoredNight && n > 0) {
      /* deep in the night the room looks the way it was painted */
      q.top = mixc(q.top, p.top, n); q.horizon = mixc(q.horizon, p.horizon, n); q.ground = mixc(q.ground, p.ground, n);
      q.stars = Math.max(q.stars ?? 0, Math.round((p.stars ?? 0) * n));
      q.fog = (q.fog ?? 0.004) * (1 - n) + (p.fog ?? 0.004) * n;
      q.env = (q.env ?? 0.55) * (1 - n) + (p.env ?? 0.55) * n;
      if (p.sun && n > 0.55) q.sun = p.sun;
    }
    return q;
  }
  /* real photographed sky light for reflections: a city by day, a sunset, a city at night (Poly Haven, CC0) */
  private useHdri(env: number) {
    const name = this.night > 0.6 ? 'night' : this.dusk > 0.35 ? 'golden' : 'day';
    const mult = (n: string) => (n === 'night' ? 0.3 : n === 'golden' ? 0.55 : 0.9);
    if (name === this.envName || typeof window === 'undefined') { if (this.envName) this.scene.environmentIntensity = env * mult(name); return; }
    this.envName = name;
    void loadHdr(name).then((hdr) => {
      if (!this.live || this.envName !== name) return;
      hdr.mapping = T.EquirectangularReflectionMapping;
      const rt = this.pmrem!.fromEquirectangular(hdr);
      this.rt?.dispose();
      this.rt = rt;
      this.scene.environment = rt.texture;
      this.scene.environmentIntensity = env * mult(name);
    }).catch(() => undefined);
  }
  /* follow the clock: lights, sky and reflections move with New York while the room is open */
  retime(hour: number) {
    const before = this.night + this.dusk * 2;
    this.setPhase(hour);
    this.applyTime();
    if (this.skyBase && this.skyDome && Math.abs(this.night + this.dusk * 2 - before) > 0.03) {
      const q = this.skyParams();
      const m = this.skyDome.material as T.MeshBasicMaterial;
      m.map?.dispose();
      m.map = X.skyCanvas(q.top, q.horizon, q.ground, { sun: q.sun, stars: q.stars, haze: q.haze });
      m.needsUpdate = true;
      (this.scene.background as T.Color).set(q.horizon);
      if (this.scene.fog instanceof T.FogExp2) { this.scene.fog.color.set(q.horizon); this.scene.fog.density = q.fog ?? 0.004; }
      this.useHdri(q.env ?? 0.55);
    }
  }
  /* every light the kit made, set for the current hour */
  applyTime() {
    const n = this.night, d = this.dusk;
    for (const h of this.hemis) h.l.intensity = this.authoredNight ? Math.max(h.i, 1.0) * (1 - n) + h.i * n : h.i * (1 - 0.65 * n);
    const el = (Math.min(70, Math.max(6, this.sunEl)) * Math.PI) / 180;
    for (const s of this.suns) {
      let color = s.color, i = s.i;
      if (n > 0.55) { color = 0xb8c6ff; i = s.auto ? 0 : i * 0.28; }
      else if (d > 0) { color = new T.Color(color).lerp(new T.Color(0xff9a55), d).getHex(); i *= 1 - 0.35 * d; }
      if (this.authoredNight && n <= 0.55) i = Math.max(i, s.auto ? 2.6 : i) * (1 - n);
      s.l.color.set(color);
      s.l.intensity = i * (1 - 0.5 * n);
      if (this.o.dynamic && n <= 0.55) {
        /* keep the room's compass bearing for the sun, take the height from the real one */
        const r = s.pos.length(), az = Math.atan2(s.pos.x, s.pos.z);
        s.l.position.set(Math.sin(az) * Math.cos(el) * r, Math.sin(el) * r, Math.cos(az) * Math.cos(el) * r);
      } else s.l.position.copy(s.pos);
    }
    const on = this.lampOn();
    for (const lp of this.lamps) lp.l.intensity = lp.i * (0.04 + 0.96 * on);
    for (const [c, m] of this.lampMats) m.color.set(c).multiplyScalar(0.28 + 0.72 * on);
  }
  hemi(skyColor: number, ground: number, intensity: number) {
    const l = new T.HemisphereLight(skyColor, ground, intensity * (1 - 0.65 * this.night));
    this.add(l);
    this.hemis.push({ l, i: intensity });
    return l;
  }
  sun(color: number, intensity: number, x: number, y: number, z: number, shadow = true, span = 60, auto = false) {
    const l = new T.DirectionalLight(color, intensity);
    l.position.set(x, y, z);
    this.suns.push({ l, color, i: intensity, pos: new T.Vector3(x, y, z), auto });
    l.target.position.set(0, 0, -20);
    this.add(l);
    this.add(l.target);
    if (shadow && this.o.quality === 'high') {
      l.castShadow = true;
      l.shadow.mapSize.set(2048, 2048);
      l.shadow.camera.near = 1;
      l.shadow.camera.far = 260;
      l.shadow.camera.left = l.shadow.camera.bottom = -span;
      l.shadow.camera.right = l.shadow.camera.top = span;
      l.shadow.bias = -0.0008;
      l.shadow.normalBias = 0.04;
      l.shadow.radius = 3;
    }
    return l;
  }
  point(x: number, y: number, z: number, color = 0xffd9a0, intensity = 30, distance = 20, decay = 2) {
    const l = new T.PointLight(color, intensity, distance, decay);
    l.position.set(x, y, z);
    this.add(l);
    return l;
  }
  spot(x: number, y: number, z: number, tx: number, ty: number, tz: number, color = 0xfff1d6, intensity = 120, angle = 0.5, penumbra = 0.5, distance = 30) {
    const l = new T.SpotLight(color, intensity, distance, angle, penumbra, 1.6);
    l.position.set(x, y, z);
    l.target.position.set(tx, ty, tz);
    this.add(l);
    this.add(l.target);
    return l;
  }
  /* Additive light pool painted on a wall behind a work. */
  wash(x: number, y: number, z: number, rotY: number, w: number, h: number, color = 0xffffff, opacity = 0.9) {
    const m = new T.MeshBasicMaterial({ map: X.pool(), color, transparent: true, opacity, blending: T.AdditiveBlending, depthWrite: false });
    const o = this.mesh(new T.PlaneGeometry(w, h), m, x, y, z, true);
    o.rotation.y = rotY;
    o.renderOrder = 2;
    this.extras.push(o);
    return o;
  }

  /* Distant towers with lit windows, merged into one mesh. */
  skyline(p: { z: number; count?: number; spacing?: number; scale?: number; base?: number; seed?: number; lit?: number; warm?: boolean; tint?: number; glow?: number; spires?: boolean; x?: number; rows?: number }) {
    let { z, count = 28, spacing = 4.6, scale = 1, base = -4, seed = 1, lit = 0.35, warm = true, tint = 0x26313d, glow = 1.3, spires = true, x: x0 = 0, rows = 2 } = p;
    glow = glow * (1 + 2.2 * this.night);
    if (this.night > 0.3) lit = Math.min(0.6, lit + 0.2 * this.night);
    const r = X.mulberry(seed * 31 + 7);
    const facade = this.pbr('win' + seed + tint + lit, X.windows(seed, lit, tint, warm), 0.11, { emissive: 0xffffff, emissiveIntensity: glow, roughness: 0.6, stretch: 0.42 });
    const roof = this.flat(0x161b22, 0.2, 0.8);
    for (let row = 0; row < rows; row++)
      for (let i = 0; i < count; i++) {
        const w = (2.6 + r() * 2.4) * scale,
          h = (8 + r() * 26 + (Math.abs(i - count / 2) < 4 ? 10 : 0)) * scale,
          x = x0 + (i - count / 2) * spacing * scale + (r() - 0.5) * 2,
          zz = z - row * 14 * scale - r() * 6,
          d = (2.5 + r() * 3) * scale;
        this.box(w, h, d, x, base + h / 2, zz, facade);
        this.box(w + 0.1, 0.25, d + 0.1, x, base + h, zz, roof);
        if (spires && r() > 0.72) {
          for (let k = 1; k <= 3; k++) this.box(w - k * w * 0.22, 1.6 * scale, d - k * d * 0.22, x, base + h + k * 1.6 * scale, zz, facade);
          this.cyl(0.05 * scale, 6 * scale, x, base + h + 3 * 1.6 * scale + 3 * scale, zz, roof, 0.03, 6);
        }
      }
  }
  water(p: { y: number; color?: number; w?: number; d?: number; x?: number; z?: number; amp?: number }) {
    const { y, color = 0x2a4d63, w = 320, d = 260, x = 0, z = -70, amp = 1 } = p;
    const g = new T.PlaneGeometry(w, d, 64, 52);
    g.rotateX(-Math.PI / 2);
    const m = new T.MeshStandardMaterial({ color, metalness: 0.55, roughness: 0.3, envMapIntensity: 1.0 });
    const o = this.mesh(g, m, x, y, z, true);
    o.receiveShadow = true;
    if (!this.o.reduced) {
      const a = g.attributes.position as T.BufferAttribute,
        start = Float32Array.from(a.array as Float32Array);
      this.ticks.push((t) => {
        for (let i = 0; i < a.count; i++) {
          const px = start[i * 3],
            pz = start[i * 3 + 2];
          a.setY(i, start[i * 3 + 1] + Math.sin(px * 0.25 + t * 0.7) * 0.11 * amp + Math.cos(pz * 0.19 + t * 0.5) * 0.09 * amp + Math.sin((px + pz) * 0.12 + t * 0.35) * 0.06 * amp);
        }
        a.needsUpdate = true;
        g.computeVertexNormals();
      });
    }
    return o;
  }
  private treeJobs = new Map<TreeSpecies, TreeJob[]>();
  tree(x: number, y: number, z: number, p: { h?: number; r?: number; kind?: 'round' | 'palm' | 'bare' | 'column'; seed?: number; leaf?: number; species?: TreeSpecies } = {}) {
    const { h = 4, r = 1.6, kind = 'round', seed = 1, leaf = 0x3f6b3e } = p;
    if (OLD_TREES) return this.treeLegacy(x, y, z, p);
    const sp: TreeSpecies = p.species ?? (kind === 'palm' ? 'palm' : kind === 'column' ? 'linden' : STREET_MIX[Math.abs(Math.round(seed)) % STREET_MIX.length]);
    let jobs = this.treeJobs.get(sp);
    if (!jobs) {
      jobs = [];
      this.treeJobs.set(sp, jobs);
      this.pending.push(this.plantSpecies(sp, jobs));
    }
    jobs.push({ x, y, z, h, r, seed, leaf, bare: kind === 'bare', kind });
  }
  /* Instance one species: every tree of it in the room in a handful of draws. Runs after the build has
     queued them all (the build is synchronous, the load is not). */
  private async plantSpecies(sp: TreeSpecies, jobs: TreeJob[]) {
    let load = treeCache.get(sp);
    if (!load) {
      load = new Promise((res, rej) => gltf.load(`assets/museum/trees/tree_${sp}.glb`, (g) => res(g.scene), undefined, rej));
      treeCache.set(sp, load);
    }
    let src: T.Group;
    try { src = await load; } catch { if (this.live) for (const j of jobs) this.treeLegacy(j.x, j.y, j.z, { h: j.h, r: j.r, kind: j.kind as 'round', seed: j.seed, leaf: j.leaf }); return; }
    if (!this.live) return;
    const parts = new Map<string, T.Mesh>();
    src.traverse((c) => { if (c instanceof T.Mesh) parts.set(c.name, c); });
    const high = this.o.quality === 'high';
    const lods = high ? ['hi', 'lo'] : ['lo'];
    const mats = new Map<T.Material, T.Material>();
    const matFor = (m: T.Material, leafy: boolean) => {
      let out = mats.get(m);
      if (out) return out;
      const sm = (m as T.MeshStandardMaterial).clone();
      for (const t of [sm.map, sm.normalMap]) if (t) markShared(t);
      if (sm.map) sm.map.colorSpace = T.SRGBColorSpace;
      sm.envMapIntensity = 0.8;
      if (leafy) {
        sm.alphaTest = 0.5; sm.transparent = false; sm.side = T.DoubleSide; sm.roughness = 0.75; sm.metalness = 0;
        sm.onBeforeCompile = (sh) => {
          sh.uniforms.uWind = treeWind;
          sh.vertexShader = 'uniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
            float hh = max(position.y, 0.0);
            vec3 ip = vec3(instanceMatrix[3][0], 0.0, instanceMatrix[3][2]);
            float ph = ip.x * 0.37 + ip.z * 0.21;
            transformed.x += sin(uWind * 1.3 + ph + hh * 0.3) * 0.008 * hh + sin(uWind * 4.1 + position.x * 2.3 + position.z) * 0.035;
            transformed.z += cos(uWind * 1.1 + ph) * 0.006 * hh + cos(uWind * 3.7 + position.z * 2.1) * 0.03;`);
        };
        /* instance colour carries the room's leaf colour: greens nudge the photo, other colours (autumn,
           red, yellow) recolour it by brightness so the leaf detail survives */
        const prev = sm.onBeforeCompile;
        sm.onBeforeCompile = (sh, r) => {
          prev.call(sm, sh, r);
          sh.uniforms.uLeafRef = leafRefU;
          sh.fragmentShader = 'uniform vec3 uLeafRef;\n' + sh.fragmentShader.replace('#include <color_fragment>', `
            #if defined( USE_INSTANCING_COLOR ) || defined( USE_COLOR )
              vec3 vc = vColor.rgb;
              float lum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
              float tl = max(dot(vc, vec3(0.299, 0.587, 0.114)), 0.02);
              float rl = max(dot(uLeafRef, vec3(0.299, 0.587, 0.114)), 0.02);
              vec3 recol = vc * (lum / tl) * 1.3;
              vec3 nudged = diffuseColor.rgb * clamp(mix(vec3(1.0), (vc / tl) / (uLeafRef / rl), 0.5), 0.6, 1.5) * clamp(tl / rl, 0.7, 1.4);
              float green = clamp((vc.g - max(vc.r, vc.b)) / max(vc.g, 0.02) * 4.0, 0.0, 1.0);
              diffuseColor.rgb = mix(recol, nudged, green);
            #endif`);
        };
        sm.customProgramCacheKey = () => 'treeleaf';
      }
      mats.set(m, sm);
      return sm;
    };
    const rnd = X.mulberry(7 + sp.length);
    const groups: { near: T.InstancedMesh[]; far: T.InstancedMesh[]; at: T.Matrix4[]; pos: T.Vector3[]; leafy: boolean[] }[] = [];
    for (let v = 0; v < 2; v++) {
      const mine = jobs.filter((j, i) => (Math.abs(j.seed * 31 + i * 7 + Math.round(j.x * 3 + j.z * 5)) % 2) === v);
      if (!mine.length) continue;
      const hb = parts.get(`v${v}_hi_bark`), hl = parts.get(`v${v}_hi_leaf`);
      if (!hb) continue;
      const bb = new T.Box3().setFromBufferAttribute(hb.geometry.attributes.position as T.BufferAttribute);
      if (hl) bb.union(new T.Box3().setFromBufferAttribute(hl.geometry.attributes.position as T.BufferAttribute));
      const size = bb.getSize(new T.Vector3()), cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2;
      const W = Math.max(size.x, size.z);
      const at: T.Matrix4[] = [], pos: T.Vector3[] = [], leafy: boolean[] = [];
      for (const j of mine) {
        const target = sp === 'palm' ? j.h + j.r * 0.4 : j.h + j.r * 1.3;
        const sy = target / size.y;
        const sxz = Math.min(1.3 * sy, Math.max(0.75 * sy, (2.6 * j.r) / W));
        const m = new T.Matrix4().compose(new T.Vector3(j.x, j.y, j.z), new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), rnd() * Math.PI * 2), new T.Vector3(sxz, sy, sxz))
          .multiply(new T.Matrix4().makeTranslation(-cx, -bb.min.y, -cz));
        at.push(m); pos.push(new T.Vector3(j.x, j.y + target * 0.5, j.z)); leafy.push(!j.bare);
      }
      const g = { near: [] as T.InstancedMesh[], far: [] as T.InstancedMesh[], at, pos, leafy };
      for (const lod of lods) {
        for (const part of ['bark', 'leaf']) {
          const src = parts.get(`v${v}_${lod}_${part}`);
          if (!src) continue;
          const im = new T.InstancedMesh(src.geometry, matFor(src.material as T.Material, part === 'leaf'), mine.length);
          im.castShadow = high && lod === 'hi'; im.receiveShadow = high; im.frustumCulled = false;   // far trees cast no shadow: it doubled their triangles
          im.userData.leaf = part === 'leaf';
          if (part === 'leaf') {
            const c = new T.Color();
            /* cherry and palm keep their own colour; every other species takes the room's */
            mine.forEach((j, i) => im.setColorAt(i, sp === 'cherry' || sp === 'palm' ? LEAF_REF : c.set(j.leaf)));
          }
          this.scene.add(im); this.dynamic.add(im);
          (lod === 'hi' ? g.near : g.far).push(im);
        }
      }
      groups.push(g);
    }
    /* near trees get the full version, the rest the far one; re-sorted twice a second as the visitor walks */
    const NEAR = 26, eye = new T.Vector3();
    let last = -1;
    const sort = (t: number) => {
      if (t - last < 0.5 && last >= 0) return;
      last = t;
      const cam = typeof window !== 'undefined' ? (window as unknown as { __museum?: { camera?: T.Camera } }).__museum?.camera : undefined;
      if (cam) eye.copy(cam.position); else eye.set(0, 1.6, 0);
      for (const g of groups) {
        const fill = (ims: T.InstancedMesh[], pick: (i: number) => boolean) => {
          for (const im of ims) {
            let n = 0;
            const cols = im.instanceColor ? im.userData.cols ?? (im.userData.cols = Float32Array.from(im.instanceColor.array)) : null;
            for (let i = 0; i < g.at.length; i++) {
              if (!pick(i) || (im.userData.leaf && !g.leafy[i])) continue;
              im.setMatrixAt(n, g.at[i]);
              if (cols && im.instanceColor) (im.instanceColor.array as Float32Array).set(cols.subarray(i * 3, i * 3 + 3), n * 3);
              n++;
            }
            im.count = n; im.visible = n > 0; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
          }
        };
        const near = (i: number) => g.pos[i].distanceTo(eye) < NEAR;
        if (g.near.length) { fill(g.near, near); fill(g.far, (i) => !near(i)); } else fill(g.far, () => true);
      }
    };
    sort(0);
    this.ticks.push((t) => { treeWind.value = t; if (high) sort(t); });
  }
  treeLegacy(x: number, y: number, z: number, p: { h?: number; r?: number; kind?: 'round' | 'palm' | 'bare' | 'column'; seed?: number; leaf?: number } = {}) {
    const { h = 4, r = 1.6, kind = 'round', seed = 1, leaf = 0x3f6b3e } = p;
    const rnd = X.mulberry(seed + Math.round(x * 13 + z * 7));
    const bark = this.pbr('bark', X.bark(), 0.7, { roughness: 1 });
    const leaves = this.flat(leaf, 0, 0.95);
    const trunkR = r * 0.09 + 0.06;
    this.lathe([[trunkR * 1.6, 0], [trunkR, h * 0.12], [trunkR * 0.75, h * 0.7], [trunkR * 0.45, h]], x, y, z, bark, 9);
    if (kind === 'palm') {
      for (let k = 0; k < 9; k++) {
        const t = (k / 9) * Math.PI * 2 + rnd(),
          dip = 0.4 + rnd() * 0.5;
        const pts = [v(x, y + h, z), v(x + Math.cos(t) * r * 0.6, y + h + r * 0.35, z + Math.sin(t) * r * 0.6), v(x + Math.cos(t) * r * 1.3, y + h - r * dip, z + Math.sin(t) * r * 1.3)];
        const frond = this.mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 10, 0.05, 5), leaves);
        void frond;
        for (let j = 1; j < 7; j++) {
          const u = j / 7,
            p0 = new T.CatmullRomCurve3(pts).getPoint(u);
          for (const s of [-1, 1]) {
            const b = this.mesh(new T.PlaneGeometry(0.16, r * 0.55), leaves);
            b.position.copy(p0);
            b.rotation.set(-0.9 * s, -t, s * 1.3);
            b.material = this.flat(leaf, 0, 0.95, { side: T.DoubleSide });
          }
        }
      }
      return;
    }
    if (kind === 'bare') {
      for (let k = 0; k < 6; k++) {
        const t = rnd() * Math.PI * 2;
        this.beam(v(x, y + h * 0.8, z), v(x + Math.cos(t) * r, y + h + rnd() * r, z + Math.sin(t) * r), trunkR * 0.35, bark, 5);
      }
      return;
    }
    const blobs = kind === 'column' ? 5 : 4;
    for (let k = 0; k < blobs; k++) {
      const g = new T.IcosahedronGeometry(r * (kind === 'column' ? 0.55 : 0.75 + rnd() * 0.3), 1);
      const pa = g.attributes.position;
      for (let i = 0; i < pa.count; i++) {
        const s = 0.82 + rnd() * 0.36;
        pa.setXYZ(i, pa.getX(i) * s, pa.getY(i) * s * (kind === 'column' ? 1.6 : 0.85), pa.getZ(i) * s);
      }
      g.computeVertexNormals();
      const ox = kind === 'column' ? 0 : (rnd() - 0.5) * r * 1.1,
        oz = kind === 'column' ? 0 : (rnd() - 0.5) * r * 1.1,
        oy = kind === 'column' ? h * 0.35 + k * r * 0.8 : h + rnd() * r * 0.6;
      this.mesh(g, leaves, x + ox, y + oy, z + oz);
    }
  }
  bench(x: number, z: number, rotY: number, slats: T.Material, frame: T.Material, len = 2.2) {
    const g = new T.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    const mk = (w: number, h: number, d: number, px: number, py: number, pz: number, m: T.Material) => {
      const o = new T.Mesh(new T.BoxGeometry(w, h, d), m);
      o.position.set(px, py, pz);
      g.add(o);
    };
    for (let j = 0; j < 4; j++) mk(0.12, 0.05, len, j * 0.15 - 0.22, 0.62, 0, slats);
    for (let j = 0; j < 3; j++) mk(0.05, 0.13, len, 0.42 + j * 0.02, 0.85 + j * 0.15, 0, slats);
    for (const dz of [-len / 2 + 0.2, len / 2 - 0.2]) {
      mk(0.72, 0.06, 0.07, 0.05, 0.6, dz, frame);
      mk(0.06, 0.6, 0.07, -0.28, 0.3, dz, frame);
      mk(0.06, 0.6, 0.07, 0.38, 0.3, dz, frame);
      mk(0.06, 0.65, 0.07, 0.46, 0.95, dz, frame);
    }
    this.scene.add(g);
    this.dynamic.add(g);
    this.keepOut.push({ x, z, r: 0.9 });
    return g;
  }
  rail(x: number, z: number, len: number, m: T.Material, y = 1.1, along: 'z' | 'x' = 'z', posts = 1.5) {
    for (let p = -len / 2; p <= len / 2; p += posts)
      along === 'z' ? this.box(0.05, y, 0.05, x, y / 2, z + p, m) : this.box(0.05, y, 0.05, x + p, y / 2, z, m);
    for (const yy of [y, y * 0.55])
      along === 'z' ? this.box(0.07, 0.07, len, x, yy, z, m) : this.box(len, 0.07, 0.07, x, yy, z, m);
  }
  lamp(x: number, z: number, h: number, post: T.Material, color = 0xffd7a0, intensity = 28) {
    this.lathe([[0.2, 0], [0.2, 0.08], [0.1, 0.16], [0.06, h - 0.3], [0.09, h - 0.2], [0.04, h]], x, 0, z, post, 10);
    let gm = this.lampMats.get(color);
    if (!gm) { gm = new T.MeshBasicMaterial({ color }); this.lampMats.set(color, gm); }
    this.sphere(0.24, x, h + 0.15, z, gm, 12);
    const l = this.point(x, h + 0.1, z, color, intensity, 16);
    this.lamps.push({ l, i: intensity });
    this.keepOut.push({ x, z, r: 0.4 });
  }
  plinth(x: number, z: number, w: number, h: number, d: number, m: T.Material) {
    this.box(w, h, d, x, h / 2, z, m);
    this.box(w + 0.16, 0.08, d + 0.16, x, h + 0.04, z, m);
    this.keepOut.push({ x, z, r: Math.max(w, d) * 0.7 });
  }

  /* ---------- props from the enamel kit ---------- */
  prop(name: string, x: number, y: number, z: number, p: { height?: number; rotY?: number; scale?: number; keepOut?: number } = {}) {
    let load = propCache.get(name);
    if (!load) {
      load = new Promise((res, rej) => gltf.load(`assets/museum/props/${name}.glb`, (g) => res(g.scene), undefined, rej));
      propCache.set(name, load);
    }
    if (p.keepOut) this.keepOut.push({ x, z, r: p.keepOut });
    this.used.props.add(name);
    this.pending.push(load);
    return load.then((src) => {
      if (!this.live) return null;
      const o = src.clone(true);
      const bb = new T.Box3().setFromObject(o),
        size = bb.getSize(new T.Vector3());
      const s = p.height ? p.height / size.y : p.scale ?? 1.7;
      o.scale.setScalar(s);
      o.position.set(x, y - bb.min.y * s, z);
      o.rotation.y = p.rotY ?? 0;
      o.traverse((c) => {
        if (c instanceof T.Mesh) {
          // The cache owns source resources; each room disposes its own copies.
          c.geometry = c.geometry.clone();
          c.material = Array.isArray(c.material) ? c.material.map(m => m.clone()) : c.material.clone();
          for (const material of (Array.isArray(c.material) ? c.material : [c.material])) {
            for (const value of Object.values(material)) if (value instanceof T.Texture) markShared(value);
          }
          c.castShadow = c.receiveShadow = this.o.quality === 'high';
          const m = c.material as T.MeshStandardMaterial;
          if (m && 'envMapIntensity' in m) m.envMapIntensity = 1.2;
        }
      });
      this.scene.add(o);
      this.dynamic.add(o);
      return o;
    }).catch(() => null);
  }

  /* ---------- the census wall: hundreds of New Yorkers from one atlas ---------- */
  /* `indices`, when given, is an explicit list of positions in the whole census (P) to hang in
     order, from any atlas, instead of a run from `start`; one draw call per atlas touched.
     `centerLast` centres a short last row, so a count that does not fill the grid reads as
     set that way rather than as a missing tile. */
  censusWall(p: { x: number; y: number; z: number; rotY: number; cols: number; rows: number; tile: number; gap?: number; start: number; pieces: Piece[]; backing?: T.Material; tilt?: number; indices?: number[]; centerLast?: boolean }) {
    const { x, y, z, rotY, cols, rows, tile, gap = tile * 0.08, start, pieces, backing, tilt = 0, indices, centerLast = false } = p;
    const N = this.o.perAtlas,
      G = this.o.atlasGrid;
    const groups = new Map<number, { pos: number[]; uv: number[]; idx: number[] }>();
    const W = cols * (tile + gap) - gap,
      H = rows * (tile + gap) - gap;
    const total = Math.min(cols * rows, indices ? indices.length : pieces.length - start);
    const lastRow = Math.floor((total - 1) / cols), lastCount = total - lastRow * cols;
    for (let k = 0; k < total; k++) {
      const shift = centerLast && Math.floor(k / cols) === lastRow ? ((cols - lastCount) * (tile + gap)) / 2 : 0;
      const gi = indices ? indices[k] : start + k,
        a = Math.floor(gi / N),
        local = gi % N,
        col = local % G,
        row = Math.floor(local / G);
      const grp = groups.get(a) || { pos: [], uv: [], idx: [] };
      groups.set(a, grp);
      const cx = -W / 2 + shift + (k % cols) * (tile + gap) + tile / 2,
        cy = H / 2 - Math.floor(k / cols) * (tile + gap) - tile / 2,
        h2 = tile / 2;
      const u0 = col / G,
        u1 = (col + 1) / G,
        v1 = 1 - row / G,
        v0 = 1 - (row + 1) / G;
      const quad = [[-h2, h2, u0, v1], [-h2, -h2, u0, v0], [h2, -h2, u1, v0], [-h2, h2, u0, v1], [h2, -h2, u1, v0], [h2, h2, u1, v1]];
      for (const q of quad) {
        grp.pos.push(cx + q[0], cy + q[1], 0);
        grp.uv.push(q[2], q[3]);
      }
      grp.idx.push(gi);
    }
    const group = new T.Group();
    group.position.set(x, y, z);
    group.rotation.set(tilt, rotY, 0);
    if (backing) {
      const b = new T.Mesh(new T.BoxGeometry(W + gap * 4, H + gap * 4, 0.12), backing);
      b.position.z = -0.08;
      group.add(b);
    }
    for (const [a, grp] of groups) {
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(grp.pos, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(grp.uv, 2));
      g.computeVertexNormals();
      const m = new T.MeshBasicMaterial({ color: 0x1a1d24 });
      const mesh = new T.Mesh(g, m);
      mesh.userData.tiles = grp.idx;
      group.add(mesh);
      this.clickables.push(mesh);
      this.used.atlases.add(a);
      this.pending.push(this.o.atlas(a).then((t) => {
        if (!this.live) return;
        m.map = t;
        m.color.set(0xffffff);
        m.needsUpdate = true;
      }));
    }
    this.scene.add(group);
    this.dynamic.add(group);
    return group;
  }

  /* ---------- hang one work ---------- */
  hang(m: Mount, piece: Piece, style: FrameStyle, index: number, thumbUrl: string, caption: string[]) {
    const ratio = piece.ar || 1.777;
    // Fit the whole assembly to the mount, not just the picture. The frame lip, the mat and the
    // caption plate all live outside the art rectangle, so fitting the art alone pushed frames
    // past corners and door jambs and pushed caption plates through the floor.
    const depth = style === 'gilt' ? 0.22 : 0.12;
    const fullLip = style === 'none' ? 0 : style === 'gilt' ? 0.34 : style === 'oak' ? 0.22 : style === 'neon' ? 0.15 : 0.14;
    const capDrop = 0.30;                       // gap between the art and the plate
    // Solve the fit for a given lip and whether the caption is hung. Returns the art size
    // and the padding it consumed, so the frame and the plate below use the same numbers.
    const solve = (lp: number, withCap: boolean) => {
      const pw = lp * 2 + 0.04, ph = lp * 2 + 0.04;
      const aw = Math.max(0, m.width - pw), ah0 = Math.max(0, m.height - ph);
      const provW = Math.min(aw, ah0 * ratio);
      const ch = withCap ? Math.min(2.6, provW * 0.55) * 0.195 + capDrop : 0;
      const ww = Math.min(aw, Math.max(0, m.height - ph - ch) * ratio);
      return { w: ww, h: ww / ratio, padW: pw, padH: ph, capH: ch };
    };
    // Degrade in order rather than refusing to hang: full assembly, then no caption,
    // then a thinner frame. A small mount gets a smaller picture, never no picture.
    let fit = solve(fullLip, true);
    let hangPlate = true;
    if (fit.w < 0.45) { fit = solve(fullLip, false); hangPlate = false; }
    if (fit.w < 0.45) { fit = solve(Math.min(fullLip, 0.05), false); hangPlate = false; }
    const lip = (fit.padW - 0.04) / 2;
    const { w, h, padW, padH, capH } = fit;
    if (!(w > 0.15)) {
      if (AUDIT) console.warn('[audit] mount too small for any work, skipped', { index, style, mount: [m.width, m.height] });
      return null;
    }
    if (AUDIT && !hangPlate) console.warn('[audit] caption dropped to fit the mount', { index, mount: [m.width, m.height] });
    if (AUDIT) {
      const fw = w + padW, fh = h + padH + capH;
      if (fw > m.width + 1e-3 || fh > m.height + 1e-3)
        console.warn('[audit] footprint overflows mount', { index, style, mount: [m.width, m.height], footprint: [+fw.toFixed(3), +fh.toFixed(3)] });
      if (m.position.y - fh / 2 < 0)
        console.warn('[audit] assembly reaches below the floor', { index, y: m.position.y, height: +fh.toFixed(3) });
    }
    const g = new T.Group();
    g.position.copy(m.position);
    // face the viewing point: the art plane sits on local +z, so flip any mount whose normal points away from its target
    let rotY = m.rotation;
    const tdx = m.target.x - m.position.x, tdz = m.target.z - m.position.z;
    if (Math.sin(rotY) * tdx + Math.cos(rotY) * tdz < 0) rotY += Math.PI;
    g.rotation.y = rotY;
    let artZ = 0.06;
    const frameMat =
      style === 'gilt' ? this.pbr('gilt', X.gilt(), 2, { metalness: 0.85, roughness: 0.3 })
      : style === 'steel' ? this.flat(0x8c98a4, 0.9, 0.3)
      : style === 'oak' ? this.pbr('oakframe', X.planks(0x6d4b30, 3, 9), 1.5, { roughness: 0.6 })
      : style === 'white' ? this.flat(0xe9e6df, 0.05, 0.6)
      : style === 'black' ? this.flat(0x14161a, 0.3, 0.45)
      : style === 'enamel' ? this.flat(0x1b3fb3, 0.4, 0.25)
      : style === 'neon' ? this.glow(0x00e5ff)
      : null;
    if (frameMat && style !== 'neon') {
      const frame = new T.Mesh(new T.BoxGeometry(w + lip * 2, h + lip * 2, depth), frameMat);
      frame.castShadow = this.o.quality === 'high';
      g.add(frame);
      if (style === 'gilt') {
        const inner = new T.Mesh(new T.BoxGeometry(w + lip * 1.1, h + lip * 1.1, depth + 0.01), this.flat(0x2a2620, 0.2, 0.8));
        g.add(inner);
      }
      const mat = new T.Mesh(new T.BoxGeometry(w + 0.04, h + 0.04, depth + 0.02), this.flat(0x0b0c10, 0, 0.9));
      g.add(mat);
      artZ = depth / 2 + 0.03;
    } else if (style === 'neon') {
      const tube = 0.03;
      for (const [px, py, bw, bh] of [[0, h / 2 + 0.12, w + 0.3, tube], [0, -h / 2 - 0.12, w + 0.3, tube], [-w / 2 - 0.12, 0, tube, h + 0.3], [w / 2 + 0.12, 0, tube, h + 0.3]]) {
        const bar = new T.Mesh(new T.BoxGeometry(bw, bh, tube), frameMat!);
        bar.position.set(px, py, 0.05);
        g.add(bar);
      }
    }
    const artMat = new T.MeshBasicMaterial({ color: 0x0f1218, toneMapped: false });
    const art = new T.Mesh(new T.PlaneGeometry(w, h), artMat);
    art.position.z = artZ;
    art.userData.piece = piece;
    art.userData.mountIndex = index;
    g.add(art);
    this.clickables.push(art);
    this.used.thumbs.add(thumbUrl);
    const load = loadThumb(thumbUrl).then((t) => {
      if (!this.live) return;
      artMat.map = t;
      artMat.color.set(0xffffff);
      artMat.needsUpdate = true;
    }).catch(() => artMat.color.set(0x1d2430));
    this.pending.push(load);
    // caption plate under the work, in the site's plate style
    const cap = X.plate([
      { text: caption[0], color: '#00E5FF', size: 30 },
      { text: caption[1], color: '#F0F4F8', size: 34, font: '700' },
      { text: caption[2], color: '#8899AA', size: 24 },
      { text: caption[3] || 'NEW YORKERS  ·  BY MLOW', color: '#2962FF', size: 21 },
    ], 1024, 200);
    const plateW = Math.min(2.6, w * 0.55), plateH = plateW * 0.195;
    const plateY = -h / 2 - capDrop - plateH / 2;
    const plate = new T.Mesh(new T.PlaneGeometry(plateW, plateH), new T.MeshBasicMaterial({ map: cap }));
    plate.position.set(-w / 2 + plateW / 2, plateY, artZ + 0.01);
    // a plate that would sink into the floor is not hung at all
    if (hangPlate && m.position.y + plateY - plateH / 2 > 0.10) g.add(plate);
    else if (AUDIT && hangPlate) console.warn('[audit] caption plate would hit the floor, dropped', { index, y: m.position.y });
    if (m.wash !== false) {
      // clamped to the mount so the glow cannot bleed onto a neighbour or through a wall,
      // and centred on the art so the lit area reads where the picture actually is
      const washW = Math.min(w * 1.9, m.width), washH = Math.min(h * 2.4, m.height);
      const wm = new T.Mesh(new T.PlaneGeometry(washW, washH), new T.MeshBasicMaterial({ map: X.pool(), transparent: true, opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false }));
      wm.position.set(0, 0, -0.02);
      wm.renderOrder = 1;
      g.add(wm);
    }
    this.scene.add(g);
    this.dynamic.add(g);
    return g;
  }

  /* ---------- merge and finish ---------- */
  /* Find every yellow cab the room drew (instanced fleets, single meshes, little groups) once it has
     moved them into place, hide each, and run a real taxi on the same path. */
  private cabsLater() {
    if (OLD_CABS || typeof window === 'undefined') return;
    let done = false;
    /* with reduced motion the kit's ticks never run, so the swap waits on a timer instead (2026-10-28) */
    if (this.o.reduced) { setTimeout(() => { if (this.live) void this.swapCabs(); }, 500); return; }
    this.ticks.push((t) => { if (done || t < 0.5) return; done = true; void this.swapCabs(); });
  }
  private async swapCabs() {
    this.scene.updateMatrixWorld(true);
    const m = new T.Matrix4(), c = new T.Color(), box = new T.Box3(), size = new T.Vector3();
    const fleets: { im: T.InstancedMesh; idx: number[]; paint: (T.Color | null)[] }[] = [];
    const singles: T.Object3D[] = [], singlePaint: (T.Color | null)[] = [];
    const ims: T.InstancedMesh[] = [];
    this.scene.traverse((o) => {
      if (o instanceof T.InstancedMesh) { if (o.userData.leaf === undefined && !o.userData.cab) ims.push(o); return; }
      if (!(o instanceof T.Mesh) || o.userData.cab) return;
      const mat = o.material as T.MeshStandardMaterial;
      if (!mat || !mat.color) return;
      const yellow = isCabYellow(mat.color);
      if (!yellow && (OLD_CARS || !o.userData.car)) return;
      const target = o.parent && o.parent !== this.scene && o.parent.type === 'Group' ? o.parent : o;
      box.setFromObject(target).getSize(size);
      if (carLike(size) && !singles.includes(target)) { singles.push(target); singlePaint.push(yellow ? null : mat.color.clone()); }
    });
    for (const im of ims) {
      const mat = im.material as T.MeshStandardMaterial;
      if (!mat || Array.isArray(mat) || !mat.color) continue;
      if (!im.geometry.boundingBox) im.geometry.computeBoundingBox();
      const idx: number[] = [], paint: (T.Color | null)[] = [];
      const cars = !OLD_CARS && !!im.userData.car;
      for (let i = 0; i < im.count; i++) {
        c.copy(mat.color);
        if (im.instanceColor) { const ic = new T.Color(); im.getColorAt(i, ic); c.multiply(ic); }
        const yellow = isCabYellow(c);
        if (!yellow && !cars) continue;
        im.getMatrixAt(i, m);
        box.copy(im.geometry.boundingBox!).applyMatrix4(m).applyMatrix4(im.matrixWorld).getSize(size);
        if (carLike(size)) { idx.push(i); paint.push(yellow ? null : c.clone()); }
      }
      if (idx.length) fleets.push({ im, idx, paint });
    }
    if (!fleets.length && !singles.length) return;
    const kinds = (await Promise.all(TAXIS.map((k) => this.taxiTemplate(k)))).filter((g): g is T.Group => !!g);
    if (!kinds.length || !this.live) return;
    const needCars = singlePaint.some((p) => p) || fleets.some((f) => f.paint.some((p) => p));
    const carKinds = needCars ? (await Promise.all(CARS.map((n) => this.taxiTemplate(n)))).filter((g): g is T.Group => !!g).map((g) => this.carBody(g)) : [];
    if (!this.live) return;
    const tmpl = kinds[0];
    let nth = 0;
    /* single cabs: the taxi rides inside the cab's own group, the boxes go dark */
    for (const o of singles) {
      const lb = new T.Box3();
      o.updateMatrixWorld(true);
      const inv = new T.Matrix4().copy(o.matrixWorld).invert();
      o.traverse((ch) => { if (ch instanceof T.Mesh) { lb.union(new T.Box3().setFromObject(ch).applyMatrix4(inv)); } });
      const ls = lb.getSize(new T.Vector3()), along = ls.x > ls.z;
      const pick = nth++;
      const paintC = singlePaint[singles.indexOf(o)];
      if (paintC && !carKinds.length) continue;
      const t = paintC ? carKinds[pick % carKinds.length].clone() : kinds[(pick * 7 + 3) % kinds.length].clone();
      if (paintC) t.traverse((ch) => { if (ch instanceof T.Mesh) ch.material = paintable(ch.material as T.Material, false, paintC); });
      const slot = pickScreen(pick * 13 + 5);
      t.traverse((ch) => { if (ch instanceof T.Mesh && ch.userData.screen) ch.geometry = slotGeometry(ch.geometry, slot); });
      t.userData.cab = true;
      t.traverse((ch) => { ch.userData.cab = true; });
      t.scale.setScalar(Math.min(1.1, Math.max(0.85, Math.max(ls.x, ls.z) / TAXI_LEN)));
      t.rotation.y = along ? Math.PI / 2 : 0;
      t.position.set((lb.min.x + lb.max.x) / 2, lb.min.y, (lb.min.z + lb.max.z) / 2);
      if (o instanceof T.Mesh) {
        /* the box keeps moving, so the car rides inside it: the box's own material goes invisible, its children
           (lamps) hide, and the car is its child (lb is in the box's frame) */
        o.children.forEach((ch) => { ch.visible = false; });
        const ghost = (o.material as T.Material).clone(); ghost.visible = false; o.material = ghost;
        o.add(t);
      } else { o.traverse((ch) => { if (ch instanceof T.Mesh) ch.visible = false; }); o.add(t); }
    }
    /* fleets: hide the yellow instances (and the cabins and wheels that ride with them), run instanced taxis */
    for (const f of fleets) {
      const hidden = new Set(f.idx);
      const pos0 = new T.Vector3(), pos1 = new T.Vector3();
      const ridersOf = (other: T.InstancedMesh) => {
        if (other === f.im || other.count !== f.im.count || other.parent !== f.im.parent) return false;
        f.im.getMatrixAt(f.idx[0], m); pos0.setFromMatrixPosition(m);
        other.getMatrixAt(f.idx[0], m); pos1.setFromMatrixPosition(m);
        return pos0.distanceTo(pos1) < 2.5;
      };
      /* the hidden boxes are collapsed every frame after their room places them (a shader flag alone
         leaves them in the occlusion and shadow passes); parked ones keep their last real place */
      const riders = [f.im, ...ims.filter(ridersOf)];
      const zero = new T.Matrix4().makeScale(0, 0, 0), last = new Map<string, T.Matrix4>();
      const real = (im: T.InstancedMesh, i: number, into: T.Matrix4) => {
        im.getMatrixAt(i, into);
        const key = im.uuid + ':' + i;
        if (Math.abs(into.determinant()) < 1e-12) { const c = last.get(key); if (c) into.copy(c); }
        else last.set(key, into.clone());
        return into;
      };
      const collapse = () => { for (const im of riders) { for (const i of hidden) im.setMatrixAt(i, zero); im.instanceMatrix.needsUpdate = true; } };
      void hideable;
      /* every cab its own type and its own screen: the five types MLow photographed, the mark or a painting;
         private cars a Camry or an Escape body in their box's own colour */
      const all = [...kinds, ...carKinds], nT = kinds.length;
      const kindOf = f.idx.map((i, j) => (f.paint[j] && carKinds.length ? nT + ((i * 5 + j) % carKinds.length) : (i * 7 + j * 3 + f.idx.length) % nT));
      const runs = all.map((g, ki) => {
        const mine = kindOf.map((k, j) => (k === ki ? j : -1)).filter((j) => j >= 0);
        const r = heroLikeInstances(this, g, Math.max(1, mine.length), mine.map((j) => pickScreen(f.idx[j] * 13 + j * 5 + 1)), ki >= nT);
        if (ki >= nT) mine.forEach((j, n) => r.setColor(n, f.paint[j]!));
        if (!mine.length) r.setAt(0, new T.Matrix4().makeScale(0, 0, 0));
        return { r, slotOf: new Map(mine.map((j, n) => [j, n])) };
      });
      const run = { setAt: (j: number, mm: T.Matrix4) => { const k = runs[kindOf[j]]; k.r.setAt(k.slotOf.get(j)!, mm); }, commit: () => runs.forEach((k) => k.r.commit()) };
      const g = f.im.geometry.boundingBox!, lc = g.getCenter(new T.Vector3()), ls = g.getSize(new T.Vector3());
      const axis = ls.x > ls.z ? new T.Vector3(1, 0, 0) : new T.Vector3(0, 0, 1);
      const prev = f.idx.map(() => new T.Vector3()), sign = f.idx.map(() => 1), seen = f.idx.map(() => false);
      const world = new T.Matrix4(), base = new T.Vector3(), dir = new T.Vector3(), out = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(), up = new T.Vector3(0, 1, 0);
      const step = () => {
        f.idx.forEach((i, j) => {
          real(f.im, i, m);
          world.multiplyMatrices(f.im.matrixWorld, m);
          base.set(lc.x, g.min.y, lc.z).applyMatrix4(world);
          dir.copy(axis).transformDirection(world); dir.y = 0; dir.normalize();
          const L = axis.x ? new T.Vector3().setFromMatrixColumn(world, 0).length() * ls.x : new T.Vector3().setFromMatrixColumn(world, 2).length() * ls.z;
          if (seen[j]) { const v = base.clone().sub(prev[j]); if (v.lengthSq() > 1e-6) sign[j] = v.dot(dir) >= 0 ? 1 : -1; }
          prev[j].copy(base); seen[j] = true;
          q.setFromAxisAngle(up, Math.atan2(dir.x * sign[j], dir.z * sign[j]));
          const s = Math.min(1.1, Math.max(0.85, L / TAXI_LEN)); sc.set(s, s, s);
          out.compose(base, q, sc);
          run.setAt(j, out);
        });
        run.commit();
        for (const im of riders) if (im !== f.im) for (const i of hidden) real(im, i, m);
        collapse();
      };
      step();
      this.ticks.push(step);
    }
  }
  /* the taxi: an NYC hybrid cab (Tripo from MLow's own cab photo) with the MLOW topper on its rails;
     the topper's two screens show the MLOW mark, then a painting, like the real digital toppers */
  private taxiTemplates = new Map<string, Promise<T.Group | null>>();
  private castFigs: CastFig[] = [];
  /* the nearest people as skinned clones: assigned by distance with hysteresis (in at rIn, out past 1.25 rIn), capped,
     clones pooled per figure. Walk clip time is scaled to the measured path speed over the clip's own speed at that
     figure's scale, so feet stay planted; under 0.08 m/s they idle and turn their head (up to 60 degrees, eased) toward
     the visitor. Returns the per frame update; reports mixer time in window.__rigStats. */
  private rigLayer(figs: CastFig[], phone: boolean) {
    const CAP = phone ? 8 : 20, rIn = phone ? 8 : 16, rOut2 = (rIn * 1.25) ** 2, rIn2 = rIn * rIn;
    type Slot = { mats: T.MeshStandardMaterial[]; name: string; root: T.Object3D; mixer: T.AnimationMixer; walk?: T.AnimationAction; idle?: T.AnimationAction; head?: T.Object3D; rest?: T.Quaternion; fig: number; yaw: number; walking: boolean };
    const free = new Map<string, Slot[]>(), slots: Slot[] = [], loaded = new Map<string, RigT | null>();
    const prev = figs.map((f) => new T.Vector3().setFromMatrixPosition(f.m)), spd = figs.map(() => 0), vel = figs.map(() => new T.Vector3()), sc = new T.Vector3(), fp = new T.Vector3(), lc = new T.Vector3(), inv = new T.Matrix4(), qy = new T.Quaternion(), hq = new T.Quaternion(), hax = new T.Vector3(), UPV = new T.Vector3(0, 1, 0), d = new T.Vector3();
    const stats: { ms: number; skinned: number; walking: number; frames: number; detail?: unknown } = { ms: 0, skinned: 0, walking: 0, frames: 0 };
    (window as unknown as { __rigStats?: unknown }).__rigStats = stats;
    const make = (name: string, r: RigT): Slot => {
      /* the yaw goes inside the figure's root (RIG_FACE): the root takes the stand in's matrix, front +z, and the look reads that frame */
      const body = SU.clone(r.scene); body.rotation.y = RIG_FACE[name] ?? 0;
      const root = new T.Group(); root.add(body); root.matrixAutoUpdate = false; const mats: T.MeshStandardMaterial[] = [];
      let head: T.Object3D | undefined; body.traverse((c) => { if (c.name === 'head') head = c; if (c instanceof T.Mesh) { c.frustumCulled = false; c.castShadow = false; c.receiveShadow = this.o.quality === 'high'; c.material = (c.material as T.Material).clone(); mats.push(c.material as T.MeshStandardMaterial); } });
      this.add(root);
      const mixer = new T.AnimationMixer(body);
      const walk = r.walk ? mixer.clipAction(r.walk) : undefined, idle = r.idle ? mixer.clipAction(r.idle) : undefined;
      walk?.play(); idle?.play();
      return { mats, name, root, mixer, walk, idle, head, rest: (head as T.Object3D | undefined)?.quaternion.clone(), fig: -1, yaw: 0, walking: false };
    };
    /* a walker the clip cannot match without sliding (needs under 0.5 or over 2 times the clip's cadence) stays a static body */
    const fits = (i: number) => { const R = RIG[rigName(figs[i].v)]; if (!R) return false; if (spd[i] < 0.2) return true; if (!R.walk) return false; sc.setFromMatrixScale(figs[i].m); const ts = spd[i] / (R.walk * (sc.y / R.h)); return ts >= 0.5 && ts <= 2.0; };
    let age = 0;
    return (cp: T.Vector3, _cam: T.Camera, dt: number) => {
      const t0 = performance.now(), ddt = Math.max(1e-3, Math.min(dt, 0.1));
      for (let i = 0; i < figs.length; i++) { fp.setFromMatrixPosition(figs[i].m); d.subVectors(fp, prev[i]); d.y = 0; vel[i].lerp(d.divideScalar(ddt), Math.min(1, ddt * 2.5)); spd[i] = vel[i].length(); prev[i].copy(fp); }   // velocity averaged as a vector: a dancer's sway or a bob cancels out, a walk does not
      /* release slots whose person left, hid, or is past the outer radius */
      for (let s = slots.length - 1; s >= 0; s--) {
        const sl = slots[s], m = figs[sl.fig].m; fp.setFromMatrixPosition(m);
        if (Math.abs(m.determinant()) < 1e-12 || fp.distanceToSquared(cp) > rOut2 || !fits(sl.fig)) { figs[sl.fig].skinned = false; sl.root.visible = false; sl.fig = -1; (free.get(sl.name) ?? free.set(sl.name, []).get(sl.name)!).push(sl); slots.splice(s, 1); }
      }
      /* take the nearest unassigned people inside rIn, up to the cap */
      if (++age > 8 && slots.length < CAP) {   // eight frames first, so the measured speeds have settled
        const cand: [number, number][] = [];
        for (let i = 0; i < figs.length; i++) { if (figs[i].skinned) continue; const m = figs[i].m; if (Math.abs(m.determinant()) < 1e-12) continue; fp.setFromMatrixPosition(m); const d2 = fp.distanceToSquared(cp); if (d2 < rIn2 && fits(i)) cand.push([d2, i]); }
        cand.sort((a, b) => a[0] - b[0]);
        for (const [, i] of cand) {
          if (slots.length >= CAP) break;
          const name = rigName(figs[i].v); if (!RIG[name]) continue;
          if (!loaded.has(name)) { loaded.set(name, null); void loadRig(name).then((r) => loaded.set(name, r)); continue; }
          const r = loaded.get(name); if (!r) continue;
          const sl = free.get(name)?.pop() ?? make(name, r);
          sl.fig = i; sl.root.visible = true; sl.yaw = 0; figs[i].skinned = true; slots.push(sl);
          for (const mt of sl.mats) mt.color.copy(figs[i].tint ?? WHITE);   // a box crowd's seat colour on the rigged body too
          if (sl.walk) sl.walk.time = Math.random() * r.walk!.duration; if (sl.idle) sl.idle.time = Math.random() * r.idle!.duration;
        }
      }
      /* drive them */
      for (const sl of slots) {
        const m = figs[sl.fig].m, R = RIG[sl.name]; sc.setFromMatrixScale(m);
        sl.root.matrix.copy(m).scale(lc.set(1 / R.h, 1 / R.h, 1 / R.h)); sl.root.matrixWorldNeedsUpdate = true;
        const v = spd[sl.fig], s = sc.y / R.h, walking = !!sl.walk && R.walk > 0 && v > 0.2;
        if (walking !== sl.walking || !sl.walk) { sl.walking = walking; sl.walk?.setEffectiveWeight(walking ? 1 : 0); sl.idle?.setEffectiveWeight(walking || !sl.idle ? 0 : 1); if (!sl.walk) sl.idle?.setEffectiveWeight(1); }
        if (walking && sl.walk) sl.walk.timeScale = v / (R.walk * s);   // within 0.5 to 2 by fits(): planted feet
        if (sl.head && sl.rest) sl.head.quaternion.copy(sl.rest);   // the clips may not key the head: never let the look accumulate
        sl.mixer.update(ddt);
        if (sl.head) {
          let want = 0;
          if (!walking) { sl.root.updateMatrixWorld(true); inv.copy(sl.root.matrixWorld).invert(); lc.copy(cp).applyMatrix4(inv); if (lc.lengthSq() < (10 / s) ** 2) want = Math.max(-1.05, Math.min(1.05, Math.atan2(lc.x, lc.z))); }
          sl.yaw += (want - sl.yaw) * Math.min(1, ddt * 3);
          /* turn about world up, taken into the head's own frame: the bone's rest is tilted, so its local Y is not up */
          if (Math.abs(sl.yaw) > 1e-3) { sl.root.updateMatrixWorld(true); sl.head.getWorldQuaternion(hq).invert(); hax.copy(UPV).applyQuaternion(hq).normalize(); sl.head.quaternion.multiply(qy.setFromAxisAngle(hax, sl.yaw)); }
        }
      }
      stats.ms = stats.ms * 0.9 + (performance.now() - t0) * 0.1; stats.skinned = slots.length; stats.frames++;
      stats.walking = slots.filter((sl) => sl.walking).length;
      stats.detail = slots.slice(0, 6).map((sl) => [sl.name, Math.round(spd[sl.fig] * 100) / 100, sl.walking ? Math.round((sl.walk?.timeScale ?? 0) * 100) / 100 : 0, Math.round(prev[sl.fig].x * 10) / 10, Math.round(prev[sl.fig].z * 10) / 10]);
    };
  }
  private peopleUpd: (() => void)[] = [];
  /* before the static merge: every tagged person (rooms' figure(), figureGeo, seatedGeo, personGroup) becomes a walker
     of the cast with its matrix read from the stand in each frame; the stand ins and their heads hide when it lands */
  private peopleCollect() {
    if (OLD_CROWD || typeof window === 'undefined') return;
    const tagged = (o: T.Object3D) => (o.userData.person as string | undefined) ?? ((o as T.Mesh).geometry?.userData?.person as string | undefined);
    const keep: T.Mesh[] = [];
    for (const o of this.objects) { if (tagged(o)) this.dynamic.add(o); else keep.push(o); }
    this.objects.length = 0; this.objects.push(...keep);
    const srcs: T.Object3D[] = [];
    this.scene.traverse((o) => { const t = tagged(o); if (!t) return; if (t === 'part') { this.castOld.push(o); return; } if (o instanceof T.Mesh || o instanceof T.Group) srcs.push(o); });
    this.personSources(srcs, tagged);
  }
  /* each stand in becomes a cast person: its matrix (per instance for an InstancedMesh) is read every frame */
  private personSources(srcs: T.Object3D[], tagged: (o: T.Object3D) => string | undefined) {
    const box = new T.Box3(), sz = new T.Vector3(), hash = (x: number, z: number, i: number) => Math.abs(Math.floor(Math.sin(x * 12.9898 + z * 78.233 + i * 37.719) * 43758.5453));
    for (const o of srcs) {
      const hs = ((o.userData.personH ?? (o as T.Mesh).geometry?.userData?.personH) as number | undefined) ?? 1.06;
      if (o.userData.personBox) box.copy(o.userData.personBox as T.Box3);
      else if (o instanceof T.Mesh) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); box.copy(o.geometry.boundingBox!); }
      else { const p = o.position.clone(), r = o.rotation.clone(), sc = o.scale.clone(), par = o.parent; o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); if (par) par.remove(o); o.updateMatrixWorld(true); box.setFromObject(o); if (par) par.add(o); o.position.copy(p); o.rotation.copy(r); o.scale.copy(sc); }
      box.getSize(sz);
      const H = sz.y * hs, seat = tagged(o) === 'seat' || H < 1.25;
      const L = new T.Matrix4().makeTranslation((box.min.x + box.max.x) / 2, box.min.y, (box.min.z + box.max.z) / 2).multiply(new T.Matrix4().makeRotationY((o.userData.personYaw as number | undefined) ?? 0)).multiply(new T.Matrix4().makeScale(H, H, H));
      const keepFar = !!o.userData.personKeepFar && o instanceof T.InstancedMesh;
      const n = o instanceof T.InstancedMesh ? o.count : 1, start = this.castFigs.length;
      for (let i = 0; i < n; i++) {
        const w = new T.Vector3(); o.getWorldPosition(w);
        const hh = hash(w.x, w.z, i);
        const pc = o.userData.personCast as string | undefined, named = pc && pc.startsWith('seat_') ? (SEATS.indexOf(pc) >= 0 ? CAST.length + SEATS.indexOf(pc) : -1) : CAST.indexOf(pc as string);
        const f: CastFig = { m: new T.Matrix4(), v: named >= 0 ? named : seat ? CAST.length + (hh % SEATS.length) : hh % CROWD_N };
        if (keepFar) {
          const bim = o as T.InstancedMesh, om = new T.Matrix4(); bim.getMatrixAt(i, om); f.box = { im: bim, i, orig: om, off: false };
          /* variety: the shirt colour of the box this person replaces, 60 percent over the cast texture */
          if (bim.instanceColor) { const bc = new T.Color(); bim.getColorAt(i, bc); f.tint = new T.Color(1, 1, 1).lerp(bc, 0.6); }
        }
        this.castFigs.push(f);
      }
      const roomHidden = !o.visible;   // hidden by its room before the cast arrived (castLater hides the rest later)
      /* a seat by seat jitter for box crowds, so a house is not a field of clones: up to 8 degrees of turn, 4 percent of size */
      const jit = keepFar ? Array.from({ length: n }, (_, i) => { const r1 = (hash(i, 3.1, 7) % 1000) / 1000, r2 = (hash(i, 9.7, 11) % 1000) / 1000; const sj = 0.96 + r2 * 0.08; return L.clone().multiply(new T.Matrix4().makeRotationY((r1 - 0.5) * 0.28)).multiply(new T.Matrix4().makeScale(sj, sj, sj)); }) : null;
      if (!keepFar) this.castOld.push(o);   // a box crowd kept far stays drawn; the cast hides its instances one by one
      const im = o instanceof T.InstancedMesh ? o : null, tmp = new T.Matrix4(), figs = this.castFigs, minY = o.userData.personMinY as number | undefined;
      this.peopleUpd.push(() => {
        o.updateWorldMatrix(true, false);
        /* a stand in its room hides (an empty boat at the dock, a figure switched off) has no cast either */
        let shown = !roomHidden; for (let p: T.Object3D | null = o.parent; shown && p; p = p.parent) if (!p.visible && !this.castOld.includes(p)) shown = false;
        if (!shown) { for (let i = 0; i < n; i++) figs[start + i].m.makeScale(0, 0, 0); return; }
        for (let i = 0; i < n; i++) {
          if (im) {
            im.getMatrixAt(i, tmp);
            const bx = figs[start + i].box;
            if (bx) { if (bx.off && Math.abs(tmp.determinant()) < 1e-12) tmp.copy(bx.orig); else bx.orig.copy(tmp); }   // the instance the cast hid reads back as its own place
            tmp.premultiply(im.matrixWorld);
          } else tmp.copy(o.matrixWorld);
          if (minY !== undefined && tmp.elements[13] < minY) { figs[start + i].m.makeScale(0, 0, 0); continue; }   // templates parked under the ground
          figs[start + i].m.multiplyMatrices(tmp, jit ? jit[i] : L);
        }
      });
    }
  }
  private castOld: T.Object3D[] = [];
  /* people a room only knows after its own async load (room 182's travellers live in the terminal GLB): their own
     cast set, rig layer included; `hides` go when it lands. ?crowd=old keeps the room's own figures. */
  castLate(srcs: T.Object3D[], hides: T.Object3D[]) {
    if (OLD_CROWD || typeof window === 'undefined' || !this.live || !srcs.length) return;
    const keepF = this.castFigs, keepU = this.peopleUpd, keepO = this.castOld, keepS = this.castStarted;
    this.castFigs = []; this.peopleUpd = []; this.castOld = [];
    this.personSources(srcs, (o) => (o.userData.person as string | undefined) ?? 'auto');
    this.castOld.push(...hides);
    this.castStarted = false; this.castLater();
    const late = this.castOld;
    this.castFigs = keepF; this.peopleUpd = keepU; this.castOld = keepO.concat(late); this.castStarted = keepS;
  }
  private castStarted = false;
  /* once per room, after the build has registered every walker: load the cast, make the instanced bodies, hide the
     capsules, and hand each walker to its near or far body by distance every frame */
  private castLater() {
    if (OLD_CROWD || this.castStarted || !this.castFigs.length || typeof window === 'undefined') return;
    this.castStarted = true;
    const figs = this.castFigs, upd = this.peopleUpd, old = this.castOld, high = this.o.quality === 'high', phone = matchMedia('(pointer: coarse)').matches, nearMax = high && !phone ? CAST_NEAR : 9;
    let near2 = nearMax ** 2, nearR = nearMax;
    const tmpl = (name: string) => Promise.resolve(this.prop(name, 0, -500, 0, { scale: 1 })).then((o) => {
      if (!o) return null;
      this.scene.remove(o); this.dynamic.delete(o);
      o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.setScalar(1); o.updateMatrixWorld(true);
      let mesh: T.Mesh | null = null; o.traverse((c) => { if (!mesh && c instanceof T.Mesh) mesh = c; });
      if (!mesh) return null;
      const mm = mesh as T.Mesh;
      const bb = new T.Box3().setFromObject(mm), sz = bb.getSize(new T.Vector3()), k = 1 / sz.y;
      const local = new T.Matrix4().makeScale(k, k, k).multiply(new T.Matrix4().makeTranslation(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2)).multiply(mm.matrixWorld);
      const face = CAST_FACE[name.replace(/_far$/, '')]; if (face) local.premultiply(new T.Matrix4().makeRotationY(face));   // about the feet, after the fit
      return { geo: mm.geometry, mat: mm.material as T.Material, local };
    });
    const used = [...new Set(figs.map((f) => f.v))];
    void Promise.all(used.map((v) => Promise.all([tmpl(castFile(v)), tmpl(castFile(v) + '_far')]))).then((pairs) => {
      if (!this.live) return;
      const runs: { near: T.InstancedMesh; far: T.InstancedMesh; local: [T.Matrix4, T.Matrix4]; mine: number[] }[] = [];
      const runOf = new Map<number, number>();
      pairs.forEach(([n, f], j) => {
        if (!n || !f) return;
        const mine = figs.map((g, i) => (g.v === used[j] ? i : -1)).filter((i) => i >= 0);
        const mk = (t: { geo: T.BufferGeometry; mat: T.Material }, shadow: boolean) => { const im = new T.InstancedMesh(t.geo, t.mat, mine.length); im.frustumCulled = false; im.castShadow = shadow; im.receiveShadow = high; im.userData.cast = true; this.add(im); return im; };
        runOf.set(used[j], runs.length);
        const farIm = mk(f, false); farIm.userData.noAO = true;   // the mid and far bodies skip the occlusion pass, which drew the whole cast a second time
        runs.push({ near: mk(n, false), far: farIm, local: [n.local, f.local], mine }); // no shadow pass: at crowd counts it costs more than the whole room
      });
      if (!runs.length) return;
      for (const o of old) o.visible = false;
      const tmp = new T.Matrix4(), cp = new T.Vector3(), fp = new T.Vector3();
      const cam = () => (window as unknown as { __museum?: { camera?: T.Camera } }).__museum?.camera;
      const rig = OLD_RIG ? null : this.rigLayer(figs, phone);
      const step = (_t = 0, dt = 1 / 30) => {
        for (const u of upd) u();
        const c = cam(); if (c) cp.setFromMatrixPosition(c.matrixWorld);
        if (rig && c) rig(cp, c, dt);
        let nearN = 0, midN = 0;
        /* packed: the near and far bodies draw only as many instances as are in their band (a zero scaled instance
           still costs its vertices, and three counts its triangles) */
        for (const r of runs) {
          let a = 0, b = 0;
          for (const i of r.mine) {
            const f = figs[i], m = f.m; fp.setFromMatrixPosition(m);
            if (Math.abs(m.determinant()) < 1e-12) continue;   // hidden by its room
            const d2 = c ? fp.distanceToSquared(cp) : 0;
            let near = !c || d2 < near2 * (f.near ? 1.3 : 1);   // hysteresis: in at nearR, out past 1.14 nearR
            f.near = near;
            if (f.box) {
              const want = near || !!f.skinned;
              if (want !== f.box.off) { f.box.off = want; f.box.im.setMatrixAt(f.box.i, want ? ZERO4 : f.box.orig); f.box.im.instanceMatrix.needsUpdate = true; }
              if (!want) continue;   // far: the room's own box stands there
              near = d2 < 64 * (f.near ? 1.3 : 1);   // a packed house: full bodies within 8 m, the 500 triangle body to the band's edge
              if (!near) midN++;
            }
            if (f.skinned) continue;   // drawn by the rig layer
            if (near) { r.near.setColorAt(a, f.tint ?? WHITE); r.near.setMatrixAt(a++, tmp.multiplyMatrices(m, r.local[0])); }
            else { r.far.setColorAt(b, f.tint ?? WHITE); r.far.setMatrixAt(b++, tmp.multiplyMatrices(m, r.local[1])); }
          }
          r.near.count = a; r.far.count = b; nearN += a;
          r.near.instanceMatrix.needsUpdate = r.far.instanceMatrix.needsUpdate = true;
          if (r.near.instanceColor) r.near.instanceColor.needsUpdate = true; if (r.far.instanceColor) r.far.instanceColor.needsUpdate = true;
        }
        /* a budget of about 120 full bodies (40 on a phone): the near radius shrinks in a packed hall and grows back */
        const budget = phone ? 40 : 120;
        nearN += midN / 6;   // six 500 triangle bodies cost about one full one
        if (nearN > budget) nearR = Math.max(4, nearR * (nearN > budget * 2 ? 0.6 : 0.85)); else if (nearN < budget * 0.6) nearR = Math.min(nearMax, nearR * 1.05);
        near2 = nearR * nearR;
      };
      step();
      if (this.o.reduced) { let k = 0; const id = setInterval(() => { if (!this.live || ++k > 40) { clearInterval(id); return; } step(0, 0.5); }, 500); }
      else this.ticks.push(step);
      void runOf;
    });
  }
  /* a cab template without its topper (frame, screens, legs), for a private car */
  private carBody(g: T.Group) {
    const c = g.clone();
    const drop: T.Object3D[] = [];
    c.children.forEach((ch) => { if (ch.userData.topper) drop.push(ch); });
    drop.forEach((ch) => c.remove(ch));
    c.userData.cab = true;
    return c;
  }
  /* one cab type (Tripo from MLow's own cab photos, his real yellow and NYC markings baked in) with the
     roof ad on its rails. The topper sits centred on the roof itself, found from the model's top
     vertices (an SUV's middle is over the dashboard). Its two screens read their picture from the
     screens atlas by slot, so each cab carries its own: the MLOW mark or one of his paintings. */
  private taxiTemplate(kind: { name: string; len: number }): Promise<T.Group | null> {
    let got = this.taxiTemplates.get(kind.name);
    if (got) return got;
    got = Promise.resolve(this.prop(kind.name, 0, -500, 0, { scale: 1 })).then((o) => {
      if (!o) return null;
      this.scene.remove(o); this.dynamic.delete(o);
      o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.setScalar(1); o.updateMatrixWorld(true);
      const bb = new T.Box3().setFromObject(o), sz = bb.getSize(new T.Vector3());
      const s = kind.len / sz.z;
      o.scale.setScalar(s);
      o.position.set(-((bb.min.x + bb.max.x) / 2) * s, -bb.min.y * s, -((bb.min.z + bb.max.z) / 2) * s);
      const g = new T.Group(); g.add(o); g.updateMatrixWorld(true);
      let top = -1e9;
      const v = new T.Vector3(), pts: T.Vector3[] = [];
      g.traverse((c) => {
        if (!(c instanceof T.Mesh)) return;
        const pa = c.geometry.attributes.position as T.BufferAttribute;
        for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(c.matrixWorld); pts.push(v.clone()); if (v.y > top) top = v.y; }
      });
      const roof = new T.Box3();
      for (const p of pts) if (p.y > top - 0.14) roof.expandByPoint(p);
      const rx = (roof.min.x + roof.max.x) / 2, rz = (roof.min.z + roof.max.z) / 2, len = roof.max.z - roof.min.z;
      const frame = new T.MeshStandardMaterial({ color: 0x2a2d30, metalness: 0.6, roughness: 0.4 });
      /* a real topper is about 1.2 m long; never longer than 70 percent of this roof */
      const TL = Math.min(1.2, Math.max(0.8, len * 0.7)), TH = 0.38, TT = 0.18, ty = top + 0.07 + TH / 2;
      const body = new T.Mesh(new T.BoxGeometry(TT, TH, TL), frame); body.position.set(rx, ty, rz); body.userData.topper = true; g.add(body);
      for (const side of [-1, 1]) {
        const p = new T.Mesh(new T.PlaneGeometry(TL * 0.95, TH * 0.86), topperScreenMaterial());
        p.position.set(rx + side * (TT / 2 + 0.003), ty, rz); p.rotation.y = side * Math.PI / 2; p.userData.screen = true; p.userData.topper = true; g.add(p);
      }
      const legs = new T.Mesh(new T.BoxGeometry(0.07, 0.09, TL * 0.8), frame); legs.position.set(rx, top + 0.035, rz); legs.userData.topper = true; g.add(legs);
      g.userData.cab = true;
      g.userData.len = kind.len;
      return g;
    });
    this.taxiTemplates.set(kind.name, got);
    return got;
  }
  batch() {
    this.applyTime();
    this.cabsLater();
    this.peopleCollect();
    this.castLater();
    const groups = new Map<T.Material, T.Mesh[]>();
    for (const o of this.objects) {
      if (Array.isArray(o.material)) continue;
      const a = groups.get(o.material) || [];
      a.push(o);
      groups.set(o.material, a);
    }
    const high = this.o.quality === 'high';
    for (const [m, ms] of groups) {
      const density = (m as T.MeshStandardMaterial).userData?.density as number | undefined;
      const gs = ms.map((o) => {
        o.updateMatrixWorld();
        const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
        if (!g.attributes.uv) g.setAttribute('uv', new T.Float32BufferAttribute(new Array(g.attributes.position.count * 2).fill(0), 2));
        if (!g.attributes.normal) g.computeVertexNormals();
        g.applyMatrix4(o.matrixWorld);
        if (density) projectUV(g, density);
        return g;
      });
      const merged = gs.length > 1 ? mergeGeometries(gs) : gs[0];
      ms.forEach((o) => {
        this.scene.remove(o);
        o.geometry.dispose();
      });
      if (merged) {
        const mesh = new T.Mesh(merged, m);
        const transparent = (m as T.Material).transparent;
        mesh.castShadow = high && !transparent;
        mesh.receiveShadow = high;
        this.scene.add(mesh);
        this.extras.push(mesh);
      }
      if (gs.length > 1) gs.forEach((g) => g.dispose());
    }
    this.objects = [];
    for (const o of this.dynamic)
      o.traverse((c) => {
        if (c instanceof T.Mesh && !(c.material as T.Material).transparent) {
          c.castShadow = high;
          c.receiveShadow = high;
        }
      });
  }
  tick(t: number, dt: number) {
    for (const f of this.ticks) f(t, dt);
    for (let i = 0; i < this.eggs.length; i++) {
      const g = this.eggs[i].glint;
      if (!g || !g.visible) continue;
      const beat = 0.5 + 0.5 * Math.sin(t * 2.1 + i * 1.7);
      (g.material as T.SpriteMaterial).opacity = 0.35 + 0.6 * beat;
      (g.material as T.SpriteMaterial).rotation = t * 0.4 + i;
      g.scale.setScalar(0.42 + 0.22 * beat);
    }
  }
  /* Everything that finished loading: thumbs, props, atlases. */
  async settled() {
    let n = -1;
    while (n !== this.pending.length) {
      n = this.pending.length;
      await Promise.allSettled(this.pending);
    }
  }
  /* The whole room as one binary glTF: geometry, canvas painted materials, lights, hung works. */
  exportGLB(maxTextureSize = 1024): Promise<Blob> {
    // textures that arrived as WebP (the enamel props) would make EXT_texture_webp a required extension; re encode them as PNG
    this.scene.traverse((o) => {
      const mats = (o as T.Mesh).material;
      for (const m of Array.isArray(mats) ? mats : mats ? [mats] : []) {
        for (const v of Object.values(m as unknown as Record<string, unknown>)) {
          if (v instanceof T.Texture && v.userData && v.userData.mimeType === 'image/webp') v.userData.mimeType = 'image/png';
        }
      }
    });
    const exporter = new GLTFExporter();
    return new Promise((res, rej) => {
      exporter.parse(
        this.scene,
        (out) => (out ? res(new Blob([out as ArrayBuffer], { type: 'model/gltf-binary' })) : rej(new Error('GLTFExporter returned nothing (renderer memory)'))),
        (err) => rej(err),
        { binary: true, onlyVisible: true, maxTextureSize, includeCustomExtensions: false },
      );
    });
  }
  /* The current frame as a PNG. Render, then read back in the same tick. */
  /* Render a poster. A hidden pane can leave the canvas at zero size, so render at 1600 by 900 when the canvas is too small. */
  async poster(camera: T.Camera): Promise<Blob> {
    const r = this.o.renderer, el = r.domElement;
    const w0 = el.width, h0 = el.height, pr = r.getPixelRatio();
    const cam = camera as T.PerspectiveCamera;
    const small = w0 < 640 || h0 < 360;
    if (small) {
      r.setPixelRatio(1);
      r.setSize(1600, 900, false);
      if (cam.isPerspectiveCamera) { cam.aspect = 16 / 9; cam.updateProjectionMatrix(); }
    }
    r.render(this.scene, camera);
    try {
      return await new Promise<Blob>((res, rej) => el.toBlob((bl) => (bl ? res(bl) : rej(new Error('poster: toBlob returned null'))), 'image/png'));
    } finally {
      if (small) {
        r.setPixelRatio(pr);
        r.setSize(Math.max(1, w0 / pr), Math.max(1, h0 / pr), false);
        if (cam.isPerspectiveCamera && h0 > 0) { cam.aspect = w0 / h0; cam.updateProjectionMatrix(); }
      }
    }
  }
  dispose() {
    this.live = false;
    /* Free every texture slot, not only the colour map. The procedural surfaces keep their canvases
       in a cache and upload again if the next room reuses them, so this only returns GPU memory;
       leaving the normal and roughness maps behind stacked up a room's worth per visit on phones. */
    const free = (m: T.Material) => {
      for (const val of Object.values(m as unknown as Record<string, unknown>)) if (val instanceof T.Texture && !thumbIsShared(val)) val.dispose();
      m.dispose();
    };
    this.scene.traverse((o) => {
      if (o instanceof T.Mesh) {
        o.geometry.dispose();
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) free(m);
      } else if (o instanceof T.Sprite) free(o.material);
    });
    this.eggs = [];
    this.rt?.dispose();
    this.pmrem?.dispose();
    this.scene.environment = null;
    this.scene.clear();
  }
}

const sharedTextures = new WeakSet<T.Texture>();
/* one template group as instanced parts (same idea as rooms/heroes.ts heroInstances, kept here so the kit owns it) */
function heroLikeInstances(k: Kit, g: T.Group, n: number, slots?: number[], painted = false) {
  g.updateMatrixWorld(true);
  const parts: { im: T.InstancedMesh; local: T.Matrix4 }[] = [];
  g.traverse((c) => {
    if (c instanceof T.Mesh) {
      let geo = c.geometry;
      if (c.userData.screen) {
        /* each instance reads its own topper screen from the atlas */
        geo = c.geometry.clone();
        const a = new Float32Array(n * 2);
        for (let i = 0; i < n; i++) { const [u, v] = screenSlot(slots?.[i] ?? 0); a[i * 2] = u; a[i * 2 + 1] = v; }
        geo.setAttribute('aSlot', new T.InstancedBufferAttribute(a, 2));
      }
      const im = new T.InstancedMesh(geo, painted ? paintable(c.material as T.Material, true) : c.material, n);
      if (painted) for (let i = 0; i < n; i++) im.setColorAt(i, new T.Color(1, 1, 1));
      im.castShadow = k.o.quality === 'high'; im.receiveShadow = true; im.frustumCulled = false;
      im.userData.cab = true;
      k.scene.add(im); k.dynamic.add(im);
      parts.push({ im, local: c.matrixWorld.clone() });
    }
  });
  const tmp = new T.Matrix4();
  return {
    setAt(i: number, m: T.Matrix4) { for (const p of parts) p.im.setMatrixAt(i, tmp.multiplyMatrices(m, p.local)); },
    setColor(i: number, c: T.Color) { for (const p of parts) { p.im.setColorAt(i, c); if (p.im.instanceColor) p.im.instanceColor.needsUpdate = true; } },
    commit() { for (const p of parts) p.im.instanceMatrix.needsUpdate = true; },
  };
}
export function markShared(t: T.Texture) {
  sharedTextures.add(t);
  return t;
}
function thumbIsShared(t: T.Texture) {
  return sharedTextures.has(t);
}

/* Planar projection by dominant normal axis, so every merged surface reads
   the same brick or stone at the same real scale regardless of mesh size. */
function projectUV(g: T.BufferGeometry, density: number) {
  const p = g.attributes.position,
    n = g.attributes.normal,
    uv = g.attributes.uv as T.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const nx = Math.abs(n.getX(i)),
      ny = Math.abs(n.getY(i)),
      nz = Math.abs(n.getZ(i)),
      x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i);
    if (ny >= nx && ny >= nz) uv.setXY(i, x * density, z * density);
    else if (nx >= nz) uv.setXY(i, z * density, y * density);
    else uv.setXY(i, x * density, y * density);
  }
  uv.needsUpdate = true;
}
