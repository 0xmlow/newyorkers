/* 181: THE GLASS HOUSE. The New York Crystal Palace of 1853 by Georg Carstensen and Charles
   Gildemeister, the iron and glass hall of the Exhibition of the Industry of All Nations in Reservoir
   Square (now Bryant Park), which burned to the ground on October 5, 1858. Built again as a gallery.
   Concepts by GPT Image 2.5 on FLORA; textures by Nano Banana Pro; props by Tripo H3.1, through
   blender/prop_pass.py; the painted people are GPT figure sheets keyed into one atlas.

   Frame: +z is west (Sixth Avenue, where a visitor arrives), -z east (the Croton Distributing
   Reservoir, where the library stands today), +x north (42nd Street and the Latting Observatory),
   -x south (40th Street). A Greek cross of four glass arms, each 24 m wide and 50 m from the centre,
   under a 100 foot stained glass dome.
     West arm, the entrance: red damask screens down the nave, vitrines and palms in the aisles.
     South arm, the salon: the iron fountain and a great work on the end wall.
     East arm, the industry hall: a beam engine with a turning flywheel, a press, a globe.
     North arm, 1858: the half nearest the dome is calm; past the rope the hall is burning, the glass
       melting into signal, embers and smoke going up through a roof that is no longer there.
     The crossing: the dome throws its colours on the floor where the real New York sun puts them.
       Under it the Otis platform: stand on it and it carries you up into the dome, the rope is cut,
       and the pawls hold.
   A second interaction everywhere: stand still before any work and the dome's colours find it.
   Outside: Sixth Avenue with carriages, the Latting Observatory, the battered granite wall of the
   reservoir with people on its promenade. Real New York time: sun, coloured light, grid shadows,
   gaslight and the palace glowing like a lantern after dark. No likeness of anyone; the works are
   only ever called works. Helpers copied from v23 (not exported there). */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as X from '../textures';
import { v, type Mount, type FrameStyle } from '../kit';
import type { RoomDef } from './types';
const PI = Math.PI;
type K = Parameters<RoomDef['build']>[0];
type C = Parameters<RoomDef['build']>[1];
const UP = new T.Vector3(0, 1, 0);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const smooth = (t: number) => { t = clamp01(t); return t * t * (3 - 2 * t); };
type Museum = { camera?: T.Camera; kit?: unknown; focus?: (n: number) => void };
const museum = (): Museum | undefined => (typeof window === 'undefined' ? undefined : (window as unknown as { __museum?: Museum }).__museum);
const cam = () => museum()?.camera;
const HAS_DOM = typeof window !== 'undefined' && typeof document !== 'undefined';

/* ---------------- helpers ---------------- */
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat = false) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) t.wrapS = t.wrapT = T.RepeatWrapping;
  return t;
}
/* the audit and the checks run in node: hand them an empty texture instead of a canvas */
const tex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat = false) => (HAS_DOM ? canvasTex(w, h, draw, repeat) : new T.Texture());
function hang(ms: Mount[], x: number, y: number, z: number, r: number, w: number, h: number, style: FrameStyle, d = 4) {
  ms.push({ position: v(x, y, z), rotation: r, target: v(x + Math.sin(r) * d, y, z + Math.cos(r) * d), width: w, height: h, style, wash: true });
}
function propMany(k: K, name: string, at: { x: number; y: number; z: number; ry?: number }[], height: number, onReady?: (ims: T.InstancedMesh[]) => void) {
  void Promise.resolve(k.prop(name, 0, -500, 0, { height })).then((o: T.Object3D | null) => {
    if (!o || !(o as T.Object3D).isObject3D) return;
    o.updateMatrixWorld(true);
    const lift = new T.Matrix4().makeTranslation(0, 500, 0), ims: T.InstancedMesh[] = [];
    const parts: { g: T.BufferGeometry; m: T.Material; local: T.Matrix4 }[] = [];
    o.traverse((c) => { if (c instanceof T.Mesh) parts.push({ g: c.geometry, m: c.material as T.Material, local: c.matrixWorld.clone().premultiply(lift) }); });
    k.scene.remove(o); k.dynamic.delete(o);
    for (const p of parts) ims.push(k.instances(p.g, p.m, at.map((a) => new T.Matrix4().compose(v(a.x, a.y, a.z), new T.Quaternion().setFromAxisAngle(UP, a.ry ?? 0), v(1, 1, 1)).multiply(p.local))));
    onReady?.(ims);
  });
}
/* boxes between two points, all in one instanced draw: the iron and timber lattices */
function bars(k: K, list: [T.Vector3, T.Vector3, number][], m: T.Material) {
  const q = new T.Quaternion(), d = new T.Vector3();
  return k.instances(new T.BoxGeometry(1, 1, 1), m, list.map(([a, b, w]) => {
    d.subVectors(b, a); const L = d.length(); q.setFromUnitVectors(UP, d.normalize());
    return new T.Matrix4().compose(a.clone().lerp(b, 0.5), q, v(w, L, w));
  }));
}
function houses(k: K, x0: number, x1: number, z: number, facing: number, seed: number, p: { hMin?: number; hMax?: number; depth?: number; y?: number } = {}) {
  const { hMin = 11, hMax = 17, depth = 12, y = 0 } = p, rnd = X.mulberry(seed);
  const mats = [k.pbr('cpHsBrick' + seed, X.brick(0x7a4032, seed + 2), 0.9), k.pbr('cpHsBrown' + seed, X.ashlar(0x8a6a50, seed + 3, 5), 0.35, { normal: 0.4 }), k.pbr('cpHsBrick2' + seed, X.brick(0x8a5040, seed + 4), 0.9)];
  const win = k.flat(0x1a2128, 0.6, 0.18), trim = k.flat(0xe8e2d4, 0, 0.6), corn = k.flat(0x4a4038, 0.2, 0.6);
  const lit = k.flat(0x3a2a18, 0, 0.6, { emissive: 0xffc070, emissiveIntensity: 0.2 + 1.4 * k.night });
  let x = x0;
  while (x < x1 - 3) {
    const w = Math.min(x1 - x, 7 + Math.floor(rnd() * 5)), h = hMin + rnd() * (hMax - hMin), m = mats[Math.floor(rnd() * mats.length)], cx = x + w / 2;
    k.box(w, h, depth, cx, y + h / 2, z - facing * depth / 2, m);
    const floors = Math.floor((h - 1.5) / 3.3), cols = Math.floor(w / 2.4);
    for (let f = 1; f < floors; f++) for (let c = 0; c < cols; c++) {
      const wx = x + ((c + 0.5) / cols) * w, wy = y + 2.4 + f * 3.3;
      k.box(1.0, 1.9, 0.08, wx, wy, z + facing * 0.03, rnd() < 0.3 ? lit : win);
      k.box(1.2, 0.14, 0.2, wx, wy + 1.02, z + facing * 0.08, trim);
    }
    k.box(w, 0.6, 0.8, cx, y + h - 0.3, z + facing * 0.3, corn);
    x += w;
  }
}
/* a half barrel along x or z, open, radius r, springing at y 0 */
function barrelX(r: number, len: number, seg = 40) { const g = new T.CylinderGeometry(r, r, len, seg, 1, true, PI / 2, PI); g.rotateX(PI / 2); g.rotateY(PI / 2); return g; }
function barrelZ(r: number, len: number, seg = 40) { const g = new T.CylinderGeometry(r, r, len, seg, 1, true, PI / 2, PI); g.rotateX(PI / 2); return g; }
/* the FLORA photographs in assets/museum/photos/crystalpalace, tiled in world space by the kit's batch */
const PHOTOS = 'assets/museum/photos/crystalpalace/';
function photoMat(k: K, file: string, density: number, p: Partial<T.MeshStandardMaterialParameters> = {}, onTex?: (t: T.Texture) => void) {
  const m = new T.MeshStandardMaterial({ roughness: 0.8, metalness: 0, ...p });
  if (density) m.userData.density = density;
  if (!HAS_DOM) return m;
  const url = PHOTOS + file;
  k.used.images.add(url);
  k.pending.push(new Promise<void>((res) => new T.TextureLoader().load(url, (t) => {
    t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8;
    m.map = t; m.needsUpdate = true; onTex?.(t); res();
  }, undefined, () => res())));
  return m;
}
function photoTex(k: K, file: string, onTex: (t: T.Texture) => void) {
  if (!HAS_DOM) return;
  const url = PHOTOS + file;
  k.used.images.add(url);
  k.pending.push(new Promise<void>((res) => new T.TextureLoader().load(url, (t) => { t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; onTex(t); res(); }, undefined, () => res())));
}

/* ---------------- painted cutout people (v23's cutouts, this room's atlas) ---------------- */
const FIG = [
  { id: 'crinoline', u0: 0.0010, u1: 0.1250, ar: 0.557, h: 1.62 },
  { id: 'tophat', u0: 0.1270, u1: 0.2090, ar: 0.368, h: 1.86 },
  { id: 'boy', u0: 0.2109, u1: 0.2944, ar: 0.375, h: 1.32 },
  { id: 'parasol', u0: 0.2964, u1: 0.3936, ar: 0.436, h: 1.66 },
  { id: 'worker', u0: 0.3955, u1: 0.4751, ar: 0.357, h: 1.78 },
  { id: 'elder1853', u0: 0.4771, u1: 0.5562, ar: 0.355, h: 1.84 },
  { id: 'puffer', u0: 0.5581, u1: 0.6382, ar: 0.360, h: 1.66 },
  { id: 'hoodie', u0: 0.6401, u1: 0.7324, ar: 0.414, h: 1.8 },
  { id: 'grandma', u0: 0.7344, u1: 0.8218, ar: 0.393, h: 1.58 },
  { id: 'teen', u0: 0.8237, u1: 0.8999, ar: 0.342, h: 1.7 },
  { id: 'camel', u0: 0.9019, u1: 0.9863, ar: 0.379, h: 1.84 },
] as const;
type Fig = { f: number; x: number; y: number; z: number; route?: T.Vector3[]; speed?: number; s?: number };
function cutouts(k: K, ctx: C, list: Fig[]) {
  const n = list.length, V0 = 0.0039, V1 = 0.8926;
  const pos = new Float32Array(n * 12), cen = new Float32Array(n * 12), cor = new Float32Array(n * 8), uv = new Float32Array(n * 8), idx: number[] = [];
  list.forEach((p, i) => {
    const F = FIG[p.f], h = F.h * (p.s ?? 1), w = h * F.ar;
    const corners = [[-w / 2, 0, F.u0, V0], [w / 2, 0, F.u1, V0], [w / 2, h, F.u1, V1], [-w / 2, h, F.u0, V1]];
    corners.forEach((c, j) => {
      const o = i * 4 + j;
      pos.set([p.x, p.y + h / 2, p.z], o * 3); cen.set([p.x, p.y, p.z], o * 3);
      cor.set([c[0], c[1]], o * 2); uv.set([c[2], c[3]], o * 2);
    });
    idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
  });
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.BufferAttribute(pos, 3));
  const aCen = new T.BufferAttribute(cen, 3); aCen.setUsage(T.DynamicDrawUsage); g.setAttribute('aCenter', aCen);
  g.setAttribute('aCorner', new T.BufferAttribute(cor, 2)); g.setAttribute('uv', new T.BufferAttribute(uv, 2));
  g.setIndex(idx);
  const m = new T.MeshBasicMaterial({ color: new T.Color(0xf4eee2).lerp(new T.Color(0x8a7a6a), k.night * 0.5), alphaTest: 0.5, transparent: true, side: T.DoubleSide });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('void main() {', 'attribute vec3 aCenter;\nattribute vec2 aCorner;\nvoid main() {').replace('#include <project_vertex>', `
      vec3 toCam = cameraPosition - aCenter; toCam.y = 0.0;
      vec3 side = normalize(vec3(toCam.z, 0.0, -toCam.x) + vec3(1e-5, 0.0, 0.0));
      transformed = aCenter + side * aCorner.x + vec3(0.0, aCorner.y, 0.0);
      vec4 mvPosition = viewMatrix * vec4(transformed, 1.0);
      gl_Position = projectionMatrix * mvPosition;`);
  };
  m.customProgramCacheKey = () => 'cpCutouts';
  const o = new T.Mesh(g, m); o.frustumCulled = false; o.castShadow = o.receiveShadow = false; o.renderOrder = 2; k.add(o);
  if (HAS_DOM) {
    k.used.images.add(PHOTOS + 'figures.webp');
    k.pending.push(new Promise<void>((res) => new T.TextureLoader().load(PHOTOS + 'figures.webp', (t) => { t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; m.map = t; m.needsUpdate = true; res(); }, undefined, () => res())));
  }
  const walkers = list.map((p, i) => ({ p, i, d: 0, len: 0 })).filter((w) => w.p.route && w.p.route.length > 1);
  for (const w of walkers) { let L = 0; for (let j = 1; j < w.p.route!.length; j++) L += w.p.route![j].distanceTo(w.p.route![j - 1]); w.len = L; w.d = (w.i * 7.31) % L; }
  if (!ctx.reduced && walkers.length) k.ticks.push((_t, dt) => {
    for (const w of walkers) {
      w.d = (w.d + (w.p.speed ?? 1.1) * Math.min(dt, 0.1)) % (w.len * 2);
      let d = w.d > w.len ? w.len * 2 - w.d : w.d; const r = w.p.route!;
      let x = r[0].x, z = r[0].z, y = r[0].y;
      for (let j = 1; j < r.length; j++) { const L = r[j].distanceTo(r[j - 1]); if (d <= L) { const t = d / L; x = r[j - 1].x + (r[j].x - r[j - 1].x) * t; y = r[j - 1].y + (r[j].y - r[j - 1].y) * t; z = r[j - 1].z + (r[j].z - r[j - 1].z) * t; break; } d -= L; }
      for (let j = 0; j < 4; j++) aCen.setXYZ(w.i * 4 + j, x, y, z);
    }
    aCen.needsUpdate = true;
  });
}

const noise = (x: number, s: number) => { const n = Math.sin(x * 12.9898 + s * 78.233) * 43758.5453; return n - Math.floor(n); };
const vnoise = (x: number, s: number) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return noise(i, s) * (1 - u) + noise(i + 1, s) * u; };
/* the direction to the sun over New York for a fractional hour, in this room's frame:
   the sun rises in the east (-z), stands in the south (-x) at noon and sets in the west (+z) */
function sunDir(h: number) {
  const s = (h - 6.6) / 11.4;
  if (s <= 0 || s >= 1) return { d: v(0.4, 0.8, 0.45).normalize(), day: 0 };
  const el = Math.sin(PI * s) * 0.72 + 0.04, a = PI * s;
  return { d: v(-Math.sin(a) * Math.cos(el), Math.sin(el), -Math.cos(a) * Math.cos(el)).normalize(), day: smooth(Math.sin(PI * s) * 4) };
}
const GLITCH = [0x00e5ff, 0xff2e63, 0xffe600, 0xffffff, 0x101014, 0x2962ff, 0x39ff88, 0xff8a00];

/* ================================================================== */
/* ---------------- 181 THE GLASS HOUSE ---------------- */
export const crystalpalace: RoomDef = {
  id: 'crystalpalace',
  name: 'The glass house',
  area: 'NEW YORK CRYSTAL PALACE, 1853 / RESERVOIR SQUARE',
  mood: 'Iron, glass and coloured light, and the arm that is burning',
  color: '#7fb3d9',
  daylit: true,
  description: 'The New York Crystal Palace of 1853, the iron and glass hall of the first world\'s fair in America, which stood where Bryant Park is and burned to the ground in 1858, raised again as a gallery. You come off Sixth Avenue into a Greek cross of glass under a stained glass dome that throws its colours across the floor wherever the real New York sun puts them. Red damask screens down the nave, an iron fountain, a beam engine with its flywheel turning, and in the north arm the evening it burned, the glass melting into signal. Step onto the open platform under the dome and it carries you up into the colour, the rope is cut, and the pawls hold. Stand still before any work and the dome finds it.',
  signatures: 'Sixth Avenue with gas lamps and carriages, the 315 foot timber Latting Observatory, the battered granite wall of the Croton Distributing Reservoir with people on its promenade, a Greek cross of four glass barrel vaulted arms on cream and blue cast iron columns, upper galleries hung with red drapery, octagonal corner towers with flags, the 100 foot stained glass dome with its lantern, coloured light on the pine floor, the Otis safety platform on its toothed guides, red damask screens, mahogany vitrines, palms in iron urns, a veiled marble figure, the three tier iron fountain, a beam engine and flywheel, a Columbian press, a library globe, and the burning north arm with embers, smoke, falling glass and melting signal.',
  build(k, ctx) {
    const hour0 = typeof k.o.hour === 'number' && Number.isFinite(k.o.hour) ? k.o.hour : 15;
    const sun0 = sunDir(hour0);
    k.sky({ top: 0x6e9fd6, horizon: 0xeadfcc, ground: 0x6a6458, fog: 0.0015, sun: { az: 2.4, el: 0.55, color: 0xfff0d8, size: 8 }, haze: 0.3, env: 0.6 });
    k.hemi(0xe8e0d0, 0x5a5044, 0.72);
    const sunL = k.sun(0xfff0d8, 2.1, sun0.d.x * 140, sun0.d.y * 140 + 2, sun0.d.z * 140, true, 80);
    sunL.target?.position?.set(0, 0, 0);

    const st: FrameStyle = 'gilt';
    const mounts: Mount[] = [];
    const EYE = 2.6;
    const A = 12, L = 50, N = 6.25, VS = 13, D0 = 21, DR = 15.25;   /* arm half width, arm end, nave half width, vault springing, dome springing and radius */

    /* ---- materials ---- */
    const pine = photoMat(k, 'floor.jpg', 0.32, { roughness: 0.62 });
    const damask = photoMat(k, 'damask.jpg', 0.42, { roughness: 0.85 });
    const granite = photoMat(k, 'granite.jpg', 0.1, { roughness: 0.9 });
    const timber = photoMat(k, 'timber.jpg', 0.35, { roughness: 0.85 });
    const ironC = k.flat(0xe9dfc6, 0.25, 0.5), ironB = k.flat(0x34588a, 0.35, 0.45), gold = k.flat(0xcaa050, 1, 0.3), ironD = k.flat(0x23272d, 0.6, 0.5);
    const boards = k.pbr('cpBoards', X.planks(0x2c4434, 5, 1811), 0.8, { roughness: 0.6 });
    const walkM = k.pbr('cpWalk', X.pavers(0x9a958a, 1812), 0.5), cobM = k.pbr('cpCobble', X.cobble(0x6f6c68, 1813), 0.6), curb = k.flat(0x8a8680, 0, 0.8);
    const lawn = k.pbr('cpLawn', X.grass(), 0.25, { roughness: 1 });
    const mahog = k.flat(0x5a2a1a, 0, 0.45);
    /* the glass: a pane grid with cream glazing bars, tiled in world space. After dark the bars go to
       iron silhouettes and the panes take the gaslight, so the house reads as a lantern, not a cage */
    const nt = k.night;
    const mixc = (a: number[], b: number[]) => a.map((x, i) => Math.round(x + (b[i] - x) * nt));
    const pane = mixc([190, 214, 232], [255, 196, 120]), bar = mixc([196, 188, 168], [44, 38, 32]);
    const glassT = tex(128, 128, (g) => {
      g.clearRect(0, 0, 128, 128); g.fillStyle = `rgba(${pane.join(',')},${0.1 + 0.12 * nt})`; g.fillRect(0, 0, 128, 128);
      g.fillStyle = `rgba(${bar.join(',')},0.95)`; g.fillRect(0, 0, 128, 6); g.fillRect(0, 0, 6, 128); g.fillRect(0, 62, 128, 3); g.fillRect(62, 0, 3, 128);
    }, true);
    const glassM = new T.MeshBasicMaterial({ map: glassT, transparent: true, depthWrite: false, side: T.DoubleSide, opacity: 1 });
    glassM.userData.density = 0.8;

    /* ================= THE SQUARE: lawn, Sixth Avenue, the houses across it ================= */
    k.box(260, 0.2, 260, 0, -0.12, 0, lawn);
    k.box(24, 0.2, 2 * L, 0, -0.1, 0, pine); k.box(2 * L, 0.2, 24, 0, -0.1, 0, pine);   /* the cross */
    k.box(150, 0.2, 12, 0, -0.1, 56, walkM);                                         /* the pavement */
    k.box(150, 0.2, 12, 0, -0.1, 68, cobM);                                          /* Sixth Avenue */
    for (const z of [62, 74]) k.box(150, 0.24, 0.3, 0, 0.02, z, curb);
    k.box(150, 0.2, 5, 0, -0.1, 76.5, walkM);
    houses(k, -84, 84, 79, -1, 1814);
    k.skyline({ z: 150, count: 24, spacing: 9, seed: 1815, base: 0, lit: 0.2, x: 0, scale: 0.7 });
    k.skyline({ z: -170, count: 24, spacing: 9, seed: 1816, base: 0, lit: 0.2, x: 0, scale: 0.7 });
    for (const [x, z] of [[-24, 30], [24, 30], [-34, 22], [34, 22], [-26, -30], [26, -30], [-38, -22], [38, -22], [-20, 44], [20, 44], [-44, 40], [44, 40]]) k.tree(x, 0, z, { h: 6 + (x * z % 3), r: 3, seed: 1817 });
    /* gas lamps along the pavement, lit from dusk */
    const lampAt: { x: number; y: number; z: number }[] = [];
    for (let x = -42; x <= 42; x += 12) if (Math.abs(x) > 5) lampAt.push({ x, y: 0, z: 61.2 });
    for (const z of [53, 57]) for (const s of [-1, 1]) lampAt.push({ x: s * 6.5, y: 0, z });
    propMany(k, 'cp_gaslamp', lampAt, 4.2);
    for (const p of lampAt) { k.keepOut.push({ x: p.x, z: p.z, r: 0.4 }); }
    k.instances(new T.SphereGeometry(0.2, 10, 8), k.glow(k.night > 0.3 ? 0xffd890 : 0xfff2d8), lampAt.map((p) => new T.Matrix4().makeTranslation(p.x, 3.75, p.z)));
    if (k.night > 0.3) for (const p of lampAt.filter((_, i) => i % 2 === 0)) k.point(p.x, 3.6, p.z, 0xffcf88, 26, 14);
    /* carriages on Sixth Avenue, and one waiting at the door */
    const rigs: { o: T.Object3D | null; x: number; z: number; dir: number; v: number }[] = [{ o: null, x: -50, z: 65.5, dir: -1, v: 3.2 }, { o: null, x: 30, z: 70.5, dir: 1, v: 2.6 }, { o: null, x: -70, z: 70.5, dir: 1, v: 2.9 }];
    for (const r of rigs) void k.prop('cp_carriage', r.x, 0, r.z, { height: 2.7, rotY: r.dir > 0 ? PI / 2 : -PI / 2 }).then((o) => { r.o = o; });
    k.prop('cp_carriage', 17, 0, 57.5, { height: 2.7, rotY: -PI / 2, keepOut: 2.6 });
    if (!ctx.reduced) k.ticks.push((_t, dt) => { for (const r of rigs) { if (!r.o) continue; r.x += r.dir * r.v * Math.min(dt, 0.1); if (r.x > 80) r.x -= 160; if (r.x < -80) r.x += 160; r.o.position.x = r.x; } });

    /* ================= THE LATTING OBSERVATORY, north of 42nd Street ================= */
    {
      const LX = 86, LZ = 4, LH = 96, R0 = 11.5, R1 = 1.6;
      const rAt = (y: number) => R0 + (R1 - R0) * (y / LH);
      const P = (i: number, y: number) => { const a = (i / 8) * PI * 2 + PI / 8, r = rAt(y); return v(LX + Math.cos(a) * r, y, LZ + Math.sin(a) * r); };
      const list: [T.Vector3, T.Vector3, number][] = [];
      const levels = [0, 12, 24, 38.1, 50, 60, 68.6, 76, 84, 91.4, LH];
      for (let i = 0; i < 8; i++) for (let j = 0; j < levels.length - 1; j++) {
        const y0 = levels[j], y1 = levels[j + 1];
        list.push([P(i, y0), P(i, y1), 0.55 - 0.3 * (y0 / LH)]);
        list.push([P(i, y1), P(i + 1, y1), 0.3]);
        list.push([P(i, y0), P(i + 1, y1), 0.16]); list.push([P(i + 1, y0), P(i, y1), 0.16]);
      }
      bars(k, list, k.flat(0x9a8462, 0, 0.85));
      for (const y of [38.1, 68.6, 91.4]) { k.cyl(rAt(y) + 1.1, 0.3, LX, y, LZ, timber, rAt(y) + 1.1, 8); }
      k.cyl(rAt(LH) + 0.6, 3.2, LX, LH + 1.6, LZ, k.flat(0xd8ccb0, 0, 0.7), rAt(LH) + 0.2, 8);
      k.cyl(0.1, 0.1, LX, LH + 3.4, LZ, ironD); k.lathe([[2.1, 0], [1.4, 0.8], [0.4, 2], [0, 2.4]], LX, LH + 3.2, LZ, k.flat(0x8a7050, 0.4, 0.5), 8);
      k.cyl(0.08, 6, LX, LH + 8.4, LZ, ironD);
      /* lanterns spiralling up it, lit after dark */
      const lights: T.Matrix4[] = [];
      for (let i = 0; i < 140; i++) { const y = 2 + (i / 140) * (LH - 4), a = i * 0.55, r = rAt(y) + 0.3; lights.push(new T.Matrix4().makeTranslation(LX + Math.cos(a) * r, y, LZ + Math.sin(a) * r)); }
      k.instances(new T.SphereGeometry(0.35, 8, 6), k.glow(k.night > 0.3 ? 0xffd27a : 0xd8c8a8), lights);
    }

    /* ================= THE CROTON DISTRIBUTING RESERVOIR, on the east ================= */
    {
      const sh = new T.Shape(); sh.moveTo(-60, 0); sh.lineTo(-63, 15); sh.lineTo(-73, 15); sh.lineTo(-76, 0); sh.closePath();
      const g = new T.ExtrudeGeometry(sh, { depth: 160, bevelEnabled: false }); g.rotateY(-PI / 2); g.translate(80, 0, 0);
      k.mesh(g, granite, 0, 0, 0);
      k.box(160, 1.3, 1.6, 0, 15.4, -63.2, granite);                                 /* the cornice */
      /* the Egyptian gate in the middle, a little proud of the wall */
      const pyl = new T.Shape(); pyl.moveTo(-8, 0); pyl.lineTo(8, 0); pyl.lineTo(6.6, 19); pyl.lineTo(-6.6, 19); pyl.closePath();
      const pg = new T.ExtrudeGeometry(pyl, { depth: 6, bevelEnabled: false }); pg.translate(0, 0, -64);
      k.mesh(pg, granite, 0, 0, 0);
      k.box(15, 1.4, 6.8, 0, 19.6, -61, granite);
      k.box(3.6, 7, 0.4, 0, 3.5, -57.95, k.flat(0x14161a, 0, 1));
      /* the promenade railing on top */
      const rl: [T.Vector3, T.Vector3, number][] = [];
      for (let x = -78; x <= 78; x += 2) rl.push([v(x, 15, -63.4), v(x, 16.1, -63.4), 0.07]);
      rl.push([v(-80, 16.1, -63.4), v(80, 16.1, -63.4), 0.09]);
      bars(k, rl, ironD);
    }

    /* ================= THE FOUR ARMS ================= */
    type Arm = { ax: 'x' | 'z'; s: number; burn?: number };
    /* a point in an arm's frame: `s` along it from the centre, `c` across it */
    const P = (a: Arm, s: number, c: number, y: number) => (a.ax === 'z' ? v(c, y, a.s * s) : v(a.s * s, y, c));
    const aBox = (a: Arm, sLen: number, cW: number, h: number, sMid: number, cMid: number, y: number, m: T.Material) => { const p = P(a, sMid, cMid, y); return a.ax === 'z' ? k.box(cW, h, sLen, p.x, p.y, p.z, m) : k.box(sLen, h, cW, p.x, p.y, p.z, m); };
    const colPts: T.Vector3[] = [], posts: [T.Vector3, T.Vector3, number][] = [], balusters: T.Matrix4[] = [];
    const ribs: T.BufferGeometry[] = [], hotRibs: T.BufferGeometry[] = [];
    const arc = (a: Arm, s: number, r: number, cy: number, n = 20) => {
      const pts: T.Vector3[] = [];
      for (let i = 0; i <= n; i++) { const t = (i / n) * PI; pts.push(P(a, s, Math.cos(t) * r, cy + Math.sin(t) * r)); }
      return new T.TubeGeometry(new T.CatmullRomCurve3(pts), n * 2, 0.13, 5);
    };
    const arms: Arm[] = [{ ax: 'z', s: 1 }, { ax: 'z', s: -1 }, { ax: 'x', s: -1 }, { ax: 'x', s: 1, burn: 33 }];
    for (const a of arms) {
      const end = a.burn ?? L, s0 = 12;
      /* the nave columns and the outer wall posts every five metres */
      for (let s = 14; s <= 49.01; s += 5) for (const c of [-N, N]) colPts.push(P(a, s, c, 0));
      for (let s = 12; s <= end; s += 5) for (const c of [-A, A]) posts.push([P(a, s, c, 0), P(a, s, c, 9.6), 0.22]);
      /* the outer glass walls, and the sloping aisle roofs up to the clerestory */
      for (const c of [-A, A]) aBox(a, end - s0, 0.05, 9.6, (end + s0) / 2, c, 4.8, glassM);
      for (const sg of [-1, 1]) {
        const p = P(a, (s0 + end) / 2, sg * (N + A) / 2, 11.3);
        const len = Math.hypot(A - N, 3.4), o = a.ax === 'z' ? k.box(len, 0.05, end - s0, p.x, p.y, p.z, glassM) : k.box(end - s0, 0.05, len, p.x, p.y, p.z, glassM);
        const tilt = Math.atan2(3.4, A - N) * -sg;
        if (a.ax === 'z') o.rotation.z = tilt; else o.rotation.x = -tilt;
        aBox(a, end - s0, 0.05, VS - 9.6, (s0 + end) / 2, sg * N, (VS + 9.6) / 2, glassM);   /* clerestory */
      }
      /* the nave barrel vault in glass, iron arches on every column pair */
      const vp = P(a, (s0 + end) / 2, 0, VS);
      k.mesh(a.ax === 'z' ? barrelZ(N, end - s0, 36) : barrelX(N, end - s0, 36), glassM, vp.x, vp.y, vp.z);
      for (let s = 14; s <= 49.01; s += 5) (s <= end ? ribs : hotRibs).push(arc(a, s, N, VS));
      /* the upper galleries over the aisles: deck, balustrade, red drapery over the rail */
      for (const sg of [-1, 1]) {
        aBox(a, end - s0, A - N - 0.3, 0.3, (s0 + end) / 2, sg * (N + A) / 2, 6.5, timber);
        aBox(a, end - s0, 0.12, 0.12, (s0 + end) / 2, sg * (N + 0.3), 7.65, gold);
        for (let s = s0 + 0.25; s < end; s += 0.5) balusters.push(new T.Matrix4().makeTranslation(P(a, s, sg * (N + 0.3), 7.15).x, 7.15, P(a, s, sg * (N + 0.3), 7.15).z));
        aBox(a, end - s0, 0.04, 1.5, (s0 + end) / 2, sg * (N + 0.2), 6.0, damask);
      }
      /* the end wall: glass under the vault's semicircle, with a fan of iron bars */
      if (!a.burn) {
        const sh = new T.Shape(); sh.moveTo(-A, 0); sh.lineTo(A, 0); sh.lineTo(A, 9.6); sh.lineTo(N, 9.6); sh.lineTo(N, VS); sh.absarc(0, VS, N, 0, PI, false); sh.lineTo(-N, 9.6); sh.lineTo(-A, 9.6); sh.closePath();
        if (a.ax === 'z' && a.s > 0) { const d = new T.Path(); d.moveTo(-3.6, 0); d.lineTo(3.6, 0); d.lineTo(3.6, 4.4); d.absarc(0, 4.4, 3.6, 0, PI, false); d.closePath(); sh.holes.push(d); }
        const g = new T.ShapeGeometry(sh, 24);
        if (a.ax === 'x') g.rotateY(PI / 2);
        const p = P(a, L, 0, 0); k.mesh(g, glassM, p.x, 0, p.z);
        const fan: [T.Vector3, T.Vector3, number][] = [];
        for (let i = 0; i <= 12; i++) { const t = (i / 12) * PI; fan.push([P(a, L - 0.05, 0, VS), P(a, L - 0.05, Math.cos(t) * N, VS + Math.sin(t) * N), 0.12]); }
        fan.push([P(a, L - 0.05, -A, 9.6), P(a, L - 0.05, A, 9.6), 0.3]);
        bars(k, fan, ironC);
        ribs.push(arc(a, L - 0.05, N, VS));
      }
      /* octagonal corner towers with flags */
      for (const c of [-A, A]) {
        const p = P(a, L, c, 0);
        k.cyl(1.9, 21, p.x, 10.5, p.z, ironC, 1.9, 8);
        for (const y of [7, 14, 20.6]) k.cyl(2.05, 0.5, p.x, y, p.z, ironB, 2.05, 8);
        k.lathe([[2.0, 0], [1.6, 1.4], [0.6, 2.6], [0, 3]], p.x, 21, p.z, ironB, 8);
        k.cyl(0.06, 6, p.x, 27, p.z, ironD);
        k.keepOut.push({ x: p.x, z: p.z, r: 2.2 });
      }
    }
    /* the courtyards between the arms are lawn seen through glass, and the west end has the one door */
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.block(sx > 0 ? A : -L - 10, sx > 0 ? L + 10 : -A, sz > 0 ? A : -L - 10, sz > 0 ? L + 0.4 : -A);
    k.block(-A - 0.1, -3.4, L - 0.4, L + 0.4); k.block(3.4, A + 0.1, L - 0.4, L + 0.4);
    k.instances(new T.CylinderGeometry(0.2, 0.26, VS, 12).translate(0, VS / 2, 0), ironC, colPts.map((p) => new T.Matrix4().makeTranslation(p.x, 0, p.z)));
    k.instances(new T.CylinderGeometry(0.42, 0.3, 0.6, 12), ironB, colPts.flatMap((p) => [new T.Matrix4().makeTranslation(p.x, VS - 0.3, p.z), new T.Matrix4().makeTranslation(p.x, 6.2, p.z)]));
    k.instances(new T.CylinderGeometry(0.36, 0.42, 0.5, 12), gold, colPts.map((p) => new T.Matrix4().makeTranslation(p.x, 0.25, p.z)));
    for (const p of colPts) k.keepOut.push({ x: p.x, z: p.z, r: 0.45 });
    bars(k, posts, ironC);
    k.instances(new T.BoxGeometry(0.07, 0.9, 0.07), ironC, balusters);
    /* the flags on the towers, turning in the wind */
    const flags: T.Mesh[] = [];
    {
      const flagM = new T.MeshStandardMaterial({ color: 0xf2ede0, side: T.DoubleSide, roughness: 0.8 });
      const flagM2 = new T.MeshStandardMaterial({ color: 0x34588a, side: T.DoubleSide, roughness: 0.8 });
      let i = 0;
      for (const a of arms) for (const c of [-A, A]) {
        const p = P(a, L, c, 29);
        const g = new T.PlaneGeometry(2.6, 1.5, 8, 1); g.translate(1.3, 0, 0);
        const o = new T.Mesh(g, i++ % 2 ? flagM : flagM2); o.position.copy(p); k.add(o); flags.push(o);
      }
      if (!ctx.reduced) k.ticks.push((t) => flags.forEach((f, j) => {
        f.rotation.y = 0.9 + 0.25 * Math.sin(t * 0.7 + j);
        const pa = f.geometry.attributes.position as T.BufferAttribute;
        for (let q = 0; q < pa.count; q++) { const x = pa.getX(q); pa.setZ(q, Math.sin(x * 2.2 - t * 4 + j) * 0.12 * (x / 2.6)); }
        pa.needsUpdate = true;
      }));
    }

    /* ================= THE CROSSING AND THE DOME ================= */
    const domeCols: T.Vector3[] = [];
    for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2 + PI / 16; domeCols.push(v(Math.cos(a) * DR, 0, Math.sin(a) * DR)); }
    k.instances(new T.CylinderGeometry(0.26, 0.34, D0, 12).translate(0, D0 / 2, 0), ironC, domeCols.map((p) => new T.Matrix4().makeTranslation(p.x, 0, p.z)));
    k.instances(new T.CylinderGeometry(0.5, 0.36, 0.7, 12), ironB, domeCols.flatMap((p) => [new T.Matrix4().makeTranslation(p.x, D0 - 0.4, p.z), new T.Matrix4().makeTranslation(p.x, VS - 0.3, p.z)]));
    for (const p of domeCols) k.keepOut.push({ x: p.x, z: p.z, r: 0.5 });
    k.torus(DR, 0.42, 0, D0, 0, ironB, 64).rotation.x = PI / 2;
    k.torus(DR, 0.22, 0, D0 - 1.2, 0, gold, 64).rotation.x = PI / 2;
    /* arched brackets between the dome columns */
    for (let i = 0; i < 16; i++) {
      const a0 = domeCols[i], a1 = domeCols[(i + 1) % 16], pts: T.Vector3[] = [];
      for (let j = 0; j <= 8; j++) { const t = j / 8; const p = a0.clone().lerp(a1, t); p.y = D0 - 1.5 - (1 - Math.sin(t * PI)) * 2.6; pts.push(p); }
      ribs.push(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 12, 0.12, 5));
    }
    /* the dome itself: a hemisphere of stained glass, the rosette projected straight down onto it */
    const domeM = new T.MeshBasicMaterial({ color: new T.Color(0xffffff).lerp(new T.Color(0x4a4058), k.night * 0.8), side: T.DoubleSide, transparent: true, opacity: 0.97, depthWrite: false });
    domeM.toneMapped = false;
    const domeTexUsers: ((t: T.Texture) => void)[] = [];
    photoTex(k, 'dome.jpg', (t) => { domeM.map = t; domeM.needsUpdate = true; domeTexUsers.forEach((f) => f(t)); });
    {
      const g = new T.SphereGeometry(DR, 64, 20, 0, PI * 2, 0, PI / 2), pa = g.attributes.position, uv = g.attributes.uv;
      for (let i = 0; i < pa.count; i++) uv.setXY(i, 0.5 + (pa.getX(i) / DR) * 0.49, 0.5 - (pa.getZ(i) / DR) * 0.49);
      const o = k.mesh(g, domeM, 0, D0, 0, true); o.renderOrder = 1;
      /* iron ribs on the meridians and three rings */
      for (let i = 0; i < 32; i++) {
        const a = (i / 32) * PI * 2, pts: T.Vector3[] = [];
        for (let j = 0; j <= 12; j++) { const e = (j / 12) * (PI / 2) * 0.97; pts.push(v(Math.cos(a) * Math.cos(e) * (DR + 0.06), D0 + Math.sin(e) * (DR + 0.06), Math.sin(a) * Math.cos(e) * (DR + 0.06))); }
        ribs.push(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 16, 0.1, 4));
      }
      for (const e of [0.35, 0.75, 1.15]) { const r = Math.cos(e) * (DR + 0.06), g2 = new T.TorusGeometry(r, 0.1, 4, 64); g2.rotateX(PI / 2); g2.translate(0, D0 + Math.sin(e) * (DR + 0.06), 0); ribs.push(g2); }
      /* the lantern, its gilt finial and a flag */
      k.cyl(2.4, 3.4, 0, D0 + DR + 1.2, 0, glassM, 2.4, 16);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; k.cyl(0.1, 3.4, Math.cos(a) * 2.4, D0 + DR + 1.2, Math.sin(a) * 2.4, ironC, 0.1, 6); }
      k.lathe([[2.7, 0], [2.2, 0.6], [0.6, 1.6], [0, 1.9]], 0, D0 + DR + 2.9, 0, ironB, 16);
      k.sphere(0.4, 0, D0 + DR + 5.2, 0, gold, 12);
    }
    k.mesh(mergeGeometries(ribs)!, ironC, 0, 0, 0);
    /* gasoliers: one hanging in each arm and a ring of gas jets under the dome */
    const jets: T.Matrix4[] = [];
    for (const a of arms) for (const s of [24, 40]) {
      if (a.burn && s > a.burn) continue;
      const p = P(a, s, 0, 0);
      k.cyl(0.03, VS + N - 10.4, p.x, 10.4 + (VS + N - 10.4) / 2, p.z, ironD, 0.03, 4);
      k.lathe([[0.1, 0], [0.9, 0.3], [1.1, 0.5], [0.3, 0.9], [0.05, 1.6]], p.x, 9.4, p.z, gold, 14);
      for (let i = 0; i < 10; i++) { const t = (i / 10) * PI * 2; jets.push(new T.Matrix4().makeTranslation(p.x + Math.cos(t) * 1.15, 10.05, p.z + Math.sin(t) * 1.15)); }
      if (s === 24) k.point(p.x, 9.2, p.z, 0xffd8a0, 30 + 60 * k.night, 26, 1.6);
    }
    for (let i = 0; i < 48; i++) { const t = (i / 48) * PI * 2; jets.push(new T.Matrix4().makeTranslation(Math.cos(t) * (DR - 0.6), D0 - 1.5, Math.sin(t) * (DR - 0.6))); }
    k.instances(new T.SphereGeometry(0.11, 8, 6), k.glow(0xffe0a0), jets);
    k.point(0, 12, 0, 0xffe4b8, 40 + 80 * k.night, 34, 1.5);

    /* the coloured light the dome throws, where the sun puts it; a faint shaft down to it */
    const poolM = new T.MeshBasicMaterial({ color: new T.Color(1.15, 1.1, 1.05), transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false });
    const pool = new T.Mesh(new T.PlaneGeometry(2 * DR, 2 * DR).rotateX(-PI / 2), poolM); pool.position.y = 0.04; pool.renderOrder = 2; k.add(pool);
    const shaftM = new T.MeshBasicMaterial({ color: 0xfff0d0, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false });
    const shaft = new T.Mesh(new T.CylinderGeometry(DR * 0.7, DR * 0.8, 1, 32, 1, true).translate(0, 0.5, 0), shaftM); shaft.renderOrder = 3; k.add(shaft);
    domeTexUsers.push((t) => { poolM.map = t; poolM.needsUpdate = true; });
    /* the shadow of the glazing bars on the arm floors, moved with the sun */
    const gridT = tex(64, 64, (g) => { g.clearRect(0, 0, 64, 64); g.fillStyle = 'rgba(30,26,20,1)'; g.fillRect(0, 0, 64, 4); g.fillRect(0, 0, 4, 64); g.fillRect(0, 31, 64, 2); g.fillRect(31, 0, 2, 64); }, true);
    const gridM = new T.MeshBasicMaterial({ map: gridT, transparent: true, opacity: 0, depthWrite: false });
    const gridPlanes: [T.Mesh, number, number][] = [];
    for (const [w, d, x, z] of [[2 * L - 2, 2 * A - 1, 0, 0], [2 * A - 1, L - A - 1, 0, (L + A) / 2], [2 * A - 1, L - A - 1, 0, -(L + A) / 2]]) {
      const t = gridT.clone(); t.repeat.set(w / 2.5, d / 2.5); t.needsUpdate = true;
      const m = gridM.clone(); m.map = t;
      const o = new T.Mesh(new T.PlaneGeometry(w, d).rotateX(-PI / 2), m); o.position.set(x, 0.025, z); o.renderOrder = 1; k.add(o); gridPlanes.push([o, w, d]);
    }
    const placeSun = (h: number, t: number) => {
      const { d, day } = sunDir(h);
      const lit = day * (1 - k.night);
      let ox = -d.x / Math.max(d.y, 0.15) * 26, oz = -d.z / Math.max(d.y, 0.15) * 26; const m = Math.hypot(ox, oz); if (m > 13) { ox *= 13 / m; oz *= 13 / m; }
      pool.position.x = ox; pool.position.z = oz;
      poolM.opacity = (0.08 + 0.5 * lit) * (0.92 + 0.08 * Math.sin(t * 0.7));
      const top = v(0, D0 + DR * 0.6, 0), bot = v(ox, 0.05, oz), dd = top.clone().sub(bot);
      shaft.position.copy(bot); shaft.quaternion.setFromUnitVectors(UP, dd.clone().normalize()); shaft.scale.set(1, dd.length(), 1);
      shaftM.opacity = 0.03 * lit;
      for (const [o] of gridPlanes) {
        const mm = o.material as T.MeshBasicMaterial; mm.opacity = 0.22 * lit;
        mm.map!.offset.set(-(-d.x / Math.max(d.y, 0.2) * 12) / 2.5, (-d.z / Math.max(d.y, 0.2) * 12) / 2.5);
      }
      sunL.position?.set(d.x * 140, d.y * 140 + 2, d.z * 140);
    };
    placeSun(hour0, 0);
    if (!ctx.reduced) { let acc = 10; k.ticks.push((t, dt) => { acc += dt; if (acc < 0.25) return; acc = 0; placeSun((hour0 + t / 3600) % 24, t); }); }

    /* ================= THE OTIS PLATFORM under the dome ================= */
    const PL = 1.55, TOP = 22.5;
    let platY = 0;
    {
      const wood = k.flat(0x6a4426, 0, 0.6), teeth = k.flat(0x3a3a3e, 0.8, 0.4);
      for (const s of [-1, 1]) {
        k.box(0.36, TOP + 4.5, 0.5, s * (PL + 0.32), (TOP + 4.5) / 2, 0, wood);
        const tl: T.Matrix4[] = [];
        for (let y = 0.4; y < TOP + 3; y += 0.32) tl.push(new T.Matrix4().compose(v(s * (PL + 0.12), y, 0), new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 0, 1), s * 0.5), v(0.12, 0.14, 0.42)));
        k.instances(new T.BoxGeometry(1, 1, 1), teeth, tl);
        k.keepOut.push({ x: s * (PL + 0.32), z: 0, r: 0.42 });
      }
      k.box(2 * PL + 1.4, 0.5, 0.6, 0, TOP + 4.6, 0, wood);
      k.torus(0.55, 0.08, 0, TOP + 4.0, 0.0, ironD, 20);
    }
    const plat = new T.Group(); k.add(plat);
    {
      const deck = new T.Mesh(new T.BoxGeometry(2 * PL, 0.22, 2 * PL), k.flat(0x7a5232, 0, 0.6)); deck.position.y = 0.11; plat.add(deck);
      for (const z of [-PL, PL]) { const r = new T.Mesh(new T.BoxGeometry(2 * PL, 0.06, 0.06), gold); r.position.set(0, 1.05, z); plat.add(r); for (const x of [-PL, 0, PL]) { const p = new T.Mesh(new T.BoxGeometry(0.06, 1.05, 0.06), gold); p.position.set(x, 0.55, z); plat.add(p); } }
      const head = new T.Mesh(new T.BoxGeometry(2 * PL + 0.4, 0.2, 0.3), k.flat(0x6a4426, 0, 0.6)); head.position.y = 2.5; plat.add(head);
      for (const s of [-1, 1]) { const st2 = new T.Mesh(new T.BoxGeometry(0.12, 2.5, 0.12), k.flat(0x6a4426, 0, 0.6)); st2.position.set(s * PL, 1.25, 0); plat.add(st2); }
    }
    /* the pawls, swung out against the teeth when the rope goes */
    const pawls: T.Mesh[] = [];
    for (const s of [-1, 1]) { const p = new T.Mesh(new T.BoxGeometry(0.34, 0.08, 0.16), gold); p.position.set(s * (PL - 0.05), 2.45, 0); plat.add(p); pawls.push(p); }
    const ropeM = new T.MeshStandardMaterial({ color: 0xb8a070, roughness: 0.9 });
    const rope = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 1, 6).translate(0, 0.5, 0), ropeM); k.add(rope);
    const loose = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 3, 6).translate(0, -1.5, 0), ropeM); loose.visible = false; k.add(loose);
    let phase: 'idle' | 'up' | 'hold' | 'cut' | 'safe' | 'down' = 'idle', pt = 0, onFor = 0, caption: HTMLDivElement | null = null;
    const say = (s: string | null) => {
      if (!HAS_DOM || !document.body) return;
      if (!caption) {
        caption = document.createElement('div');
        caption.style.cssText = 'position:fixed;left:50%;top:18%;transform:translateX(-50%);z-index:40;pointer-events:none;padding:10px 16px;background:rgba(10,12,18,.82);border:1px solid #c9a86a;color:#f0e8d6;font:13px/1.4 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.12em;text-align:center;opacity:0;transition:opacity .5s';
        document.body.appendChild(caption);
        const watch = setInterval(() => { if (museum()?.kit !== k) { caption?.remove(); caption = null; clearInterval(watch); } }, 800);
      }
      if (s) caption.innerHTML = s;
      caption.style.opacity = s ? '1' : '0';
    };
    const onDeck = (x: number, z: number) => Math.abs(x) < PL - 0.15 && Math.abs(z) < PL - 0.15;
    const placePlat = () => {
      plat.position.y = platY;
      const ropeTop = TOP + 3.95, ropeBot = platY + 2.6;
      rope.position.set(0, ropeBot, 0); rope.scale.y = Math.max(0.01, ropeTop - ropeBot);
    };
    placePlat();
    k.ticks.push((_t, dt) => {
      dt = Math.min(dt, 0.1);
      const c = cam(); const on = !!c && onDeck(c.position.x, c.position.z);
      pt += dt;
      if (phase === 'idle') {
        onFor = on ? onFor + dt : 0;
        if (on && onFor > 0.4 && onFor - dt <= 0.4) say('THE OTIS PLATFORM · STAND STILL TO GO UP');
        if (!on && onFor === 0 && caption && caption.style.opacity === '1' && pt > 0.1) say(null);
        if (onFor > 1.6) { phase = 'up'; pt = 0; say(null); }
      } else if (phase === 'up') {
        platY = TOP * smooth(pt / 13);
        if (pt > 13) { phase = 'hold'; pt = 0; say('THE ROPE IS CUT'); }
      } else if (phase === 'hold') {
        if (pt > 2.2) { phase = 'cut'; pt = 0; rope.visible = false; loose.visible = true; loose.position.set(0, TOP + 3.95, 0); }
      } else if (phase === 'cut') {
        platY = TOP - Math.min(0.75, 4.9 * pt * pt);
        loose.position.y -= dt * (6 + pt * 30); if (loose.position.y < 1) loose.visible = false;
        pawls.forEach((p, i) => { p.rotation.z = (i ? -1 : 1) * Math.min(0.9, pt * 5); p.position.x = (i ? 1 : -1) * (PL - 0.05 + Math.min(0.25, pt * 1.4)); });
        if (pt > 0.4) { phase = 'safe'; pt = 0; say('ALL SAFE<br><span style="font-size:11px;letter-spacing:.08em;color:#a89c84">THE PAWLS CATCH THE TEETH. NEW YORK CRYSTAL PALACE, 1854</span>'); }
      } else if (phase === 'safe') {
        platY = TOP - 0.75 + Math.sin(pt * 30) * 0.03 * Math.max(0, 1 - pt * 3);
        if (pt > 4.5) { phase = 'down'; pt = 0; say(null); rope.visible = true; pawls.forEach((p, i) => { p.rotation.z = 0; p.position.x = (i ? 1 : -1) * (PL - 0.05); }); }
      } else if (phase === 'down') {
        platY = (TOP - 0.75) * (1 - smooth(pt / 11));
        if (pt > 11) { phase = 'idle'; pt = 0; platY = 0; onFor = on ? -6 : 0; }
      }
      placePlat();
      /* a rider stays on the deck: the rail is the rail */
      if (c && phase !== 'idle') {
        if (on || platY > 0.3) {
          if (platY > 0.3) { c.position.x = Math.max(-PL + 0.3, Math.min(PL - 0.3, c.position.x)); c.position.z = Math.max(-PL + 0.3, Math.min(PL - 0.3, c.position.z)); }
          if (onDeck(c.position.x, c.position.z)) c.position.y = platY + 0.22 + EYE;
        }
      }
    });

    /* ================= THE WORKS and what stands among them ================= */
    const screen = (x: number, z: number, r: number, m: T.Material, len = 6.4, h = 5.6) => {
      /* static boxes turned to the screen's angle, so the kit's batch merges every screen into a few draws */
      const ux = Math.cos(r), uz = -Math.sin(r);
      const part = (w: number, hh: number, d: number, ox: number, y: number, mm: T.Material) => { k.box(w, hh, d, x + ux * ox, y, z + uz * ox, mm).rotation.y = r; };
      part(len, h, 0.32, 0, h / 2 + 0.3, m); part(len + 0.3, 0.3, 0.5, 0, 0.15, ironB); part(len + 0.3, 0.22, 0.46, 0, h + 0.4, gold);
      for (const e of [-1, 1]) part(0.16, h + 0.8, 0.46, e * (len / 2 + 0.08), (h + 0.8) / 2, ironC);
      /* keep visitors out of it: circles along its length */
      for (let t = -len / 2 + 0.5; t <= len / 2 - 0.4; t += 0.9) k.keepOut.push({ x: x + ux * t, z: z + uz * t, r: 0.5 });
    };
    /* a screen standing along an arm, its face toward the nave, a work on the face */
    const navescreen = (a: Arm, s: number, sg: number, m: T.Material) => {
      const p = P(a, s, sg * 5.6, 0);
      const nrm = a.ax === 'z' ? v(-sg, 0, 0) : v(0, 0, -sg);
      const r = Math.atan2(nrm.x, nrm.z);
      screen(p.x, p.z, r, m);
      hang(mounts, p.x + nrm.x * 0.18, 3.3, p.z + nrm.z * 0.18, r, 4.6, 3.4, st);
    };
    const [W, E, S, Nn] = [arms[0], arms[1], arms[2], arms[3]];
    /* west, the entrance */
    for (const s of [20, 31, 42]) for (const sg of [-1, 1]) navescreen(W, s, sg, damask);
    k.prop('cp_statue', 0, 0, 36.5, { height: 3.4, rotY: PI, keepOut: 0.9 });
    k.box(1.6, 0.5, 1.6, 0, 0.25, 36.5, k.flat(0xe8e2d6, 0, 0.5));
    const vitAt: { x: number; y: number; z: number; ry?: number }[] = [], palmAt: { x: number; y: number; z: number; ry?: number }[] = [], benchAt: { x: number; y: number; z: number; ry?: number }[] = [];
    for (const s of [25.5, 36.5]) for (const sg of [-1, 1]) vitAt.push({ x: sg * 9.2, y: 0, z: s, ry: 0 });
    for (const s of [15, 47]) for (const sg of [-1, 1]) palmAt.push({ x: sg * 9.4, y: 0, z: s });
    /* south, the salon and the fountain */
    for (const s of [20, 31]) for (const sg of [-1, 1]) navescreen(S, s, sg, damask);
    k.box(0.6, 9, 11, -48.3, 4.5, 0, damask); k.box(0.9, 0.4, 11.4, -48.2, 9.1, 0, gold);
    k.block(-50, -47.9, -5.8, 5.8);
    hang(mounts, -47.95, 4.3, 0, PI / 2, 7.2, 5.2, st);
    k.prop('cp_fountain', -40.5, 0, 0, { height: 4.6, keepOut: 2.7 });
    for (const sg of [-1, 1]) { palmAt.push({ x: -25.5, y: 0, z: sg * 9.4 }, { x: -45, y: 0, z: sg * 9.4 }); benchAt.push({ x: -36, y: 0, z: sg * 3.8, ry: sg > 0 ? PI : 0 }); }
    /* east, the industry hall */
    for (const s of [20, 42]) for (const sg of [-1, 1]) navescreen(E, s, sg, boards);
    k.box(11, 9, 0.6, 0, 4.5, -48.3, boards); k.box(11.4, 0.4, 0.9, 0, 9.1, -48.2, gold);
    k.block(-5.8, 5.8, -50, -47.9);
    for (const x of [-3, 3]) hang(mounts, x, 3.7, -47.95, 0, 4.6, 3.6, st);
    k.prop('cp_engine', -0.9, 0, -31, { height: 4.4, keepOut: 2.3 });
    k.prop('cp_press', 9.0, 0, -31, { height: 2.5, rotY: -PI / 2, keepOut: 1.2 });
    k.prop('cp_globe', -9.0, 0, -31, { height: 1.9, keepOut: 0.9 });
    for (const s of [27, 35]) for (const sg of [-1, 1]) vitAt.push({ x: sg * 9.2, y: 0, z: -s, ry: 0 });
    /* the flywheel the engine turns, and its connecting rod */
    const fly = new T.Group(); fly.position.set(1.5, 2.1, -31); k.add(fly);
    {
      const fm = k.flat(0x2c4a34, 0.5, 0.4);
      const rim = new T.Mesh(new T.TorusGeometry(1.75, 0.16, 8, 48), fm); rim.rotation.y = PI / 2; fly.add(rim);
      for (let i = 0; i < 8; i++) { const sp = new T.Mesh(new T.BoxGeometry(0.1, 3.4, 0.14), fm); sp.rotation.x = (i / 8) * PI; fly.add(sp); }
      const hub = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 0.5, 14), gold); hub.rotation.z = PI / 2; fly.add(hub);
      k.box(0.5, 2.1, 0.5, 1.5, 1.05, -31, k.flat(0x2c4a34, 0.5, 0.4));
      k.keepOut.push({ x: 1.5, z: -31, r: 1.9 });
      if (!ctx.reduced) k.ticks.push((_t, dt) => { fly.rotation.x -= Math.min(dt, 0.1) * 1.6; });
    }
    /* north, 1858: the calm half nearest the dome */
    for (const s of [19, 27]) for (const sg of [-1, 1]) navescreen(Nn, s, sg, damask);
    /* the crossing: four screens on the diagonals, facing the platform */
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const x = sx * 7.4, z = sz * 7.4, r = Math.atan2(-sx, -sz);
      screen(x, z, r, damask, 6.0);
      hang(mounts, x - sx * 0.13, 3.3, z - sz * 0.13, r, 4.4, 3.3, st);
    }
    propMany(k, 'cp_vitrine', vitAt, 1.15); for (const p of vitAt) k.keepOut.push({ x: p.x, z: p.z, r: 1.1 });
    propMany(k, 'cp_palm', palmAt, 3.4); for (const p of palmAt) k.keepOut.push({ x: p.x, z: p.z, r: 0.8 });
    propMany(k, 'cp_bench', benchAt, 0.95); for (const p of benchAt) k.keepOut.push({ x: p.x, z: p.z, r: 0.9 });

    /* the fountain's water: one cloud of points thrown from the top bowl and falling back */
    {
      const n = ctx.quality === 'low' ? 180 : 420, pos = new Float32Array(n * 3), seed = Array.from({ length: n }, (_, i) => ({ a: noise(i, 1) * PI * 2, sp: 0.7 + noise(i, 2) * 0.9, ph: noise(i, 3), tier: i % 3 }));
      const dropT = tex(32, 32, (g) => { const r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); });
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
      const water = new T.Points(g, new T.PointsMaterial({ color: 0xcfe8ff, size: 0.09, map: dropT, transparent: true, depthWrite: false, opacity: 0.8 }));
      water.frustumCulled = false; k.add(water);
      const tops = [4.5, 3.3, 2.0], rads = [0.35, 0.75, 1.15];
      const place = (t: number) => {
        seed.forEach((p, i) => {
          const u = (p.ph + t * 0.9) % 1, r = rads[p.tier] + u * p.sp * 0.9, y = tops[p.tier] + 0.35 * u * (1 - u) * 4 * (p.tier === 0 ? 1.2 : 0.4) - u * u * (p.tier === 2 ? 1.6 : 1.1);
          pos[i * 3] = -40.5 + Math.cos(p.a) * r; pos[i * 3 + 1] = Math.max(0.5, y); pos[i * 3 + 2] = Math.sin(p.a) * r;
        });
        (g.attributes.position as T.BufferAttribute).needsUpdate = true;
      };
      place(0);
      if (!ctx.reduced) k.ticks.push((t) => place(t));
      const pondM = new T.MeshStandardMaterial({ color: 0x3a5a6a, metalness: 0.6, roughness: 0.15 });
      const pond = k.mesh(new T.CircleGeometry(2.2, 40).rotateX(-PI / 2), pondM, -40.5, 0.42, 0, true); void pond;
    }

    /* ================= 1858: the burning half of the north arm ================= */
    const FX0 = 33, FX1 = 49.5;
    {
      k.box(FX1 - FX0 + 1, 0.02, 2 * A - 0.5, (FX0 + FX1) / 2, 0.012, 0, k.flat(0x16120e, 0, 0.95));
      k.block(FX0 - 0.2, 60, -A, A);
      /* the rope across the arm */
      const rp: T.Vector3[] = [];
      for (let z = -A + 0.6; z <= A - 0.5; z += 2.2) { k.lathe([[0.18, 0], [0.05, 0.1], [0.04, 0.9], [0, 1.05]], FX0 - 0.6, 0, z, gold, 8); rp.push(v(FX0 - 0.6, 0.92 - 0.12 * Math.abs(Math.sin(z)), z)); }
      k.curve(rp, 0.03, k.flat(0x7a1420, 0, 0.75), 40);
      /* the iron left standing glows, the timber of the galleries hangs charred */
      const hot = new T.MeshStandardMaterial({ color: 0x2a1a12, emissive: 0xff5a18, emissiveIntensity: 1.2, roughness: 0.6 });
      k.mesh(mergeGeometries(hotRibs)!, hot, 0, 0, 0, true);
      const char = k.flat(0x1a1410, 0, 0.95);
      for (const sg of [-1, 1]) for (let x = FX0 + 1; x < FX1; x += 2.6) { const o = k.box(2.2, 0.25, 4.4, x, 6.5 - (x - FX0) * 0.12 - noise(x, sg) * 1.2, sg * 9, char); o.rotation.z = (noise(x, 9 + sg) - 0.5) * 0.6; o.rotation.x = sg * 0.2; }
      for (const sg of [-1, 1]) for (let x = FX0; x <= L; x += 5) { const o = k.box(0.22, 9.6 - noise(x, sg + 4) * 4, 0.22, x, 4.8 - noise(x, sg + 4) * 2, sg * A, hot); o.rotation.x = (noise(x, sg + 5) - 0.5) * 0.3; }
      if (!ctx.reduced) k.ticks.push((t) => { hot.emissiveIntensity = 0.9 + 0.5 * vnoise(t * 2.2, 3); });
      /* light from the fire */
      const fl = [k.point(40, 3, -4, 0xff7a2a, 70, 34, 1.4), k.point(44, 6, 5, 0xff9a40, 60, 30, 1.4)];
      if (!ctx.reduced) k.ticks.push((t) => { fl[0].intensity = 55 + 40 * vnoise(t * 6, 1); fl[1].intensity = 45 + 40 * vnoise(t * 5, 2); });
      /* flames: crossed quads, additive, flickering in scale and colour */
      const flameT = tex(64, 128, (g) => {
        const r = g.createRadialGradient(32, 96, 2, 32, 80, 60); r.addColorStop(0, 'rgba(255,250,210,1)'); r.addColorStop(0.25, 'rgba(255,190,70,0.95)'); r.addColorStop(0.6, 'rgba(255,90,20,0.55)'); r.addColorStop(1, 'rgba(120,20,0,0)');
        g.fillStyle = r; g.beginPath(); g.moveTo(32, 0); g.bezierCurveTo(54, 40, 64, 80, 52, 112); g.quadraticCurveTo(32, 128, 12, 112); g.bezierCurveTo(0, 80, 10, 40, 32, 0); g.fill();
      });
      const fg = mergeGeometries([new T.PlaneGeometry(1, 1).translate(0, 0.5, 0), new T.PlaneGeometry(1, 1).translate(0, 0.5, 0).rotateY(PI / 2)])!;
      const fN = ctx.quality === 'low' ? 60 : 120;
      const fM = new T.MeshBasicMaterial({ map: flameT, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, toneMapped: false, fog: false });
      const flames = k.instances(fg, fM, Array.from({ length: fN }, () => new T.Matrix4()));
      flames.frustumCulled = false; flames.castShadow = false; flames.renderOrder = 4;
      const fp = Array.from({ length: fN }, (_, i) => {
        const kind = i % 4, x = FX0 + 2 + noise(i, 11) * (FX1 - FX0 - 2.5), z = (noise(i, 12) - 0.5) * 2 * (A - 1);
        return kind === 3 ? { x, y: 6.4 - (x - FX0) * 0.1, z: (noise(i, 13) > 0.5 ? 1 : -1) * (7 + noise(i, 14) * 4), s: 1.6 + noise(i, 15) * 1.6, ph: noise(i, 16) * 10 } : { x, y: 0, z, s: 1.6 + noise(i, 15) * 5.2 * Math.pow((x - FX0) / (FX1 - FX0) + 0.15, 1.3), ph: noise(i, 16) * 10 };
      });
      const m4 = new T.Matrix4(), q = new T.Quaternion(), col = new T.Color();
      const placeF = (t: number) => {
        fp.forEach((p, i) => {
          const f = vnoise(t * 3.2 + p.ph, i);
          q.setFromAxisAngle(UP, p.ph + t * 0.3);
          m4.compose(v(p.x, p.y, p.z), q, v(p.s * (0.55 + 0.15 * f), p.s * (0.75 + 0.55 * f), p.s * (0.55 + 0.15 * f)));
          flames.setMatrixAt(i, m4); flames.setColorAt(i, col.setRGB(0.75 + 0.25 * f, 0.55 + 0.3 * f, 0.4 + 0.2 * f));
        });
        flames.instanceMatrix.needsUpdate = true; if (flames.instanceColor) flames.instanceColor.needsUpdate = true;
      };
      placeF(0);
      if (!ctx.reduced) k.ticks.push((t) => placeF(t));
      /* embers going up, and smoke out of the open roof */
      const dot = tex(32, 32, (g) => { const r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.4, 'rgba(255,255,255,0.6)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); });
      const eN = ctx.quality === 'low' ? 240 : 560, ep = new Float32Array(eN * 3), ec = new Float32Array(eN * 3);
      const es = Array.from({ length: eN }, (_, i) => ({ x: FX0 + 1 + noise(i, 21) * (FX1 - FX0), z: (noise(i, 22) - 0.5) * 2 * (A - 1), v: 1.2 + noise(i, 23) * 3.2, ph: noise(i, 24) * 40, w: noise(i, 25) * 6 }));
      es.forEach((_, i) => { const c = new T.Color().setHSL(0.04 + noise(i, 26) * 0.08, 1, 0.55 + noise(i, 27) * 0.2); ec.set([c.r, c.g, c.b], i * 3); });
      const eg = new T.BufferGeometry(); eg.setAttribute('position', new T.BufferAttribute(ep, 3)); eg.setAttribute('color', new T.BufferAttribute(ec, 3));
      const embers = new T.Points(eg, new T.PointsMaterial({ size: 0.16, map: dot, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false, fog: false }));
      embers.frustumCulled = false; embers.renderOrder = 5; k.add(embers);
      const sN = ctx.quality === 'low' ? 40 : 90, sp = new Float32Array(sN * 3), ss = Array.from({ length: sN }, (_, i) => ({ x: FX0 + 2 + noise(i, 31) * 14, z: (noise(i, 32) - 0.5) * 16, ph: noise(i, 33) }));
      const sg2 = new T.BufferGeometry(); sg2.setAttribute('position', new T.BufferAttribute(sp, 3));
      const smoke = new T.Points(sg2, new T.PointsMaterial({ size: 12, map: dot, color: 0x1c1814, transparent: true, opacity: 0.32, depthWrite: false }));
      smoke.frustumCulled = false; smoke.renderOrder = 6; k.add(smoke);
      const placeE = (t: number) => {
        es.forEach((p, i) => {
          const y = ((t + p.ph) * p.v) % 34;
          ep[i * 3] = p.x + Math.sin(t * 0.8 + p.w) * 0.6 * (y / 10) - y * 0.12; ep[i * 3 + 1] = y; ep[i * 3 + 2] = p.z + Math.cos(t * 0.7 + p.w) * 0.6 * (y / 10) - y * 0.18;
        });
        (eg.attributes.position as T.BufferAttribute).needsUpdate = true;
        ss.forEach((p, i) => { const u = (p.ph + t * 0.035) % 1; sp[i * 3] = p.x - u * 18; sp[i * 3 + 1] = 12 + u * 60; sp[i * 3 + 2] = p.z - u * 30; });
        (sg2.attributes.position as T.BufferAttribute).needsUpdate = true;
      };
      placeE(0);
      if (!ctx.reduced) k.ticks.push((t) => placeE(t));
      /* the glass melting into signal: noise blocks on the vault that is no longer there, and drips */
      const gN = ctx.quality === 'low' ? 160 : 320;
      const gm = k.instances(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ side: T.DoubleSide, toneMapped: false, transparent: true, opacity: 0.92, depthWrite: false }), Array.from({ length: gN }, () => new T.Matrix4()));
      gm.frustumCulled = false; gm.castShadow = false; gm.renderOrder = 4;
      const gr = X.mulberry(1858), gc = new T.Color(), gq = new T.Quaternion(), gM = new T.Matrix4();
      const reseed = (i: number) => {
        const x = FX0 + 0.5 + gr() * (FX1 - FX0 - 0.5), drip = gr() < 0.35;
        if (drip) {
          const c = (gr() - 0.5) * 2 * N, top = VS + Math.sqrt(Math.max(0, N * N - c * c)), len = 0.6 + gr() * gr() * 7 * ((x - FX0) / (FX1 - FX0) + 0.2);
          gq.setFromAxisAngle(UP, gr() * PI); gM.compose(v(x, top - len / 2, c), gq, v(0.05 + gr() * 0.18, len, 1));
        } else {
          const a = gr() * PI, c = Math.cos(a) * N, y = VS + Math.sin(a) * N;
          gq.setFromUnitVectors(new T.Vector3(0, 0, 1), v(0, -Math.sin(a), -Math.cos(a)));
          gM.compose(v(x, y, c), gq, v(0.1 + gr() * gr() * 1.4, 0.05 + gr() * 0.4, 1));
        }
        gm.setMatrixAt(i, gM); gm.setColorAt(i, gc.set(GLITCH[Math.floor(gr() * GLITCH.length)]));
      };
      for (let i = 0; i < gN; i++) reseed(i);
      gm.instanceMatrix.needsUpdate = true; if (gm.instanceColor) gm.instanceColor.needsUpdate = true;
      /* a few panes falling, glinting */
      const pN = 26, panes = k.instances(new T.BoxGeometry(0.9, 0.02, 0.7), new T.MeshBasicMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.55, depthWrite: false }), Array.from({ length: pN }, () => new T.Matrix4()));
      panes.frustumCulled = false; panes.castShadow = false;
      const pp = Array.from({ length: pN }, (_, i) => ({ x: FX0 + 1 + noise(i, 41) * (FX1 - FX0 - 1), z: (noise(i, 42) - 0.5) * 2 * N, ph: noise(i, 43), sp: 0.12 + noise(i, 44) * 0.1 }));
      const placeP = (t: number) => {
        pp.forEach((p, i) => { const u = (p.ph + t * p.sp) % 1, y = (VS + 4) * (1 - u * u); gq.setFromEuler(new T.Euler(t * 2 + i, t * 1.3 + i * 2, t * 1.7)); gM.compose(v(p.x + u * 0.8, Math.max(0.05, y), p.z), gq, v(1, 1, 1)); panes.setMatrixAt(i, gM); });
        panes.instanceMatrix.needsUpdate = true;
      };
      placeP(0);
      let acc = 0;
      if (!ctx.reduced) k.ticks.push((t, dt) => {
        placeP(t);
        acc += dt; if (acc < 0.07) return; acc = 0;
        for (let j = 0; j < gN * 0.2; j++) reseed(Math.floor(gr() * gN));
        gm.instanceMatrix.needsUpdate = true; if (gm.instanceColor) gm.instanceColor.needsUpdate = true;
      });
    }

    /* ================= the dome finds you: stand still before a work and its colours fall on it ================= */
    {
      const lightM = new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false });
      const veil = new T.Mesh(new T.PlaneGeometry(1, 1), lightM); veil.renderOrder = 5; veil.visible = false; k.add(veil);
      domeTexUsers.push((t) => { const c = t.clone(); c.wrapS = c.wrapT = T.RepeatWrapping; c.repeat.set(0.45, 0.45); c.needsUpdate = true; lightM.map = c; lightM.needsUpdate = true; });
      const arts = new Map<number, T.Mesh>();
      let scanAt = -10, cand = -1, hold = 0, act = -1, I = 0;
      const last = new T.Vector3(), fwd = new T.Vector3();
      if (!ctx.reduced) k.ticks.push((t, dt) => {
        const c = cam(); if (!c) return;
        if (t - scanAt > 2) { scanAt = t; arts.clear(); k.scene.traverse((o) => { if (o instanceof T.Mesh && o.userData.piece && typeof o.userData.mountIndex === 'number') arts.set(o.userData.mountIndex, o); }); }
        const speed = c.position.distanceTo(last) / Math.max(dt, 1e-3); last.copy(c.position);
        c.getWorldDirection(fwd);
        let best = -1, bd = 1e9;
        mounts.forEach((m, i) => {
          const dx = c.position.x - m.position.x, dz = c.position.z - m.position.z, dist = Math.hypot(dx, dz);
          if (dist > 7 || Math.abs(c.position.y - m.position.y) > 4) return;
          const nx = Math.sin(m.rotation), nz = Math.cos(m.rotation);
          if ((dx * nx + dz * nz) / dist < 0.45) return;
          if ((-dx * fwd.x - dz * fwd.z) / (dist * Math.hypot(fwd.x, fwd.z) || 1) < 0.72) return;
          if (dist < bd) { bd = dist; best = i; }
        });
        if (best !== cand) { cand = best; hold = 0; }
        if (cand >= 0 && speed < 0.4) hold += dt; else hold = 0;
        if (cand >= 0 && hold > 1.2 && act !== cand && I < 0.02) act = cand;
        const want = act >= 0 && act === cand && hold > 1.2 ? 1 : 0;
        I += (want - I) * Math.min(1, dt * (want ? 0.9 : 2));
        if (act >= 0 && I < 0.01 && !want) act = -1;
        if (act < 0) { veil.visible = false; return; }
        const m = mounts[act], art = arts.get(act);
        const w = art ? (art.geometry as T.PlaneGeometry).parameters.width : m.width, h = art ? (art.geometry as T.PlaneGeometry).parameters.height : m.height;
        veil.visible = true; veil.scale.set(w * 1.04, h * 1.04, 1);
        /* in front of the picture itself, which stands proud of the mount in its frame */
        if (art) { art.getWorldPosition(veil.position); veil.position.x += Math.sin(m.rotation) * 0.03; veil.position.z += Math.cos(m.rotation) * 0.03; }
        else veil.position.set(m.position.x + Math.sin(m.rotation) * 0.2, m.position.y, m.position.z + Math.cos(m.rotation) * 0.2);
        veil.rotation.set(0, m.rotation, 0);
        if (lightM.map) { lightM.map.offset.set(0.27 + 0.18 * Math.cos(t * 0.11 + act), 0.27 + 0.18 * Math.sin(t * 0.13 + act)); lightM.map.rotation = t * 0.02; }
        lightM.opacity = 0.24 * I;
      });
    }

    /* ---- people: painted cutouts, the fair of 1853 on the pavement and in the halls, today's visitors at the works ---- */
    {
      const R = (...p: number[][]) => p.map(([x, y, z]) => v(x, y, z));
      const F: Fig[] = [
        { f: 1, x: 0, y: 0, z: 0, route: R([-40, 0, 59], [-6, 0, 59]), speed: 1.0 },
        { f: 0, x: 0, y: 0, z: 0, route: R([8, 0, 58.2], [40, 0, 58.2]), speed: 0.8 },
        { f: 2, x: 0, y: 0, z: 0, route: R([-3, 0, 60], [-2, 0, 48], [-1.5, 0, 30]), speed: 1.3 },
        { f: 3, x: -22, y: 0, z: 55.6 }, { f: 5, x: 25.6, y: 0, z: 54.6 }, { f: 4, x: 30, y: 0, z: 76 },
        { f: 0, x: 0, y: 0, z: 0, route: R([1.6, 0, 46], [2.2, 0, 26], [3.4, 0, 15]), speed: 0.7 },
        { f: 1, x: 0, y: 0, z: 0, route: R([-2.6, 0, 16], [-4, 0, 9], [-10, 0, 3], [-30, 0, 2.8]), speed: 0.9 },
        { f: 3, x: 0, y: 0, z: 0, route: R([-18, 0, -2.6], [-34, 0, -2.4], [-37, 0, -3.6]), speed: 0.75 },
        { f: 5, x: -9.6, y: 0, z: 30.8 }, { f: 4, x: -2.2, y: 0, z: -26.6 }, { f: 2, x: 3.4, y: 0, z: -27.2 },
        { f: 0, x: -33.8, y: 0, z: 3.4 }, { f: 1, x: -44.4, y: 0, z: 3.0 },
        { f: 6, x: -1.8, y: 0, z: 20.6 }, { f: 9, x: 1.6, y: 0, z: 42.4 }, { f: 8, x: -21, y: 0, z: -1.4 }, { f: 10, x: -44.8, y: 0, z: -1.6 },
        { f: 7, x: 1.8, y: 0, z: -19.4 }, { f: 6, x: 2.8, y: 0, z: -44.6 }, { f: 9, x: 22.6, y: 0, z: -2.4 }, { f: 10, x: 29, y: 0, z: 2.2 },
        { f: 7, x: 5.2, y: 0, z: 4.8 }, { f: 8, x: -4.6, y: 0, z: -5.4 },
        { f: 0, x: 0, y: 15, z: 0, route: R([-60, 15, -66.8], [-14, 15, -66.8]), speed: 0.6 }, { f: 1, x: 0, y: 15, z: 0, route: R([12, 15, -67.4], [64, 15, -67.4]), speed: 0.7 },
        { f: 3, x: -36, y: 15, z: -67 }, { f: 5, x: 30, y: 15, z: -66.6 },
      ];
      for (const p of F) if (!p.route && p.y === 0) k.keepOut.push({ x: p.x, z: p.z, r: 0.4 });
      cutouts(k, ctx, F);
    }

    /* the hung works, their frames and the props draw no sun shadow: under glass the iron is what writes on the floor */
    {
      let done = false;
      k.ticks.push((t) => {
        if (done || t < 1.5) return; done = true;
        k.scene.traverse((o) => { if ((o instanceof T.Mesh || o instanceof T.Points) && o.castShadow && o.parent && o.parent !== k.scene && o.parent !== plat) o.castShadow = false; });
      });
    }

    /* ---- what the house knows ---- */
    const src = { name: 'New York Crystal Palace, Wikipedia', url: 'https://en.wikipedia.org/wiki/New_York_Crystal_Palace' };
    k.egg(v(0, D0 + DR * 0.7, 0), { id: 'crystalpalace-dome', title: 'A hundred foot dome', year: '1853', text: 'The New York Crystal Palace was built for the Exhibition of the Industry of All Nations, after the Crystal Palace of the Great Exhibition in London in 1851. Designed by Georg Carstensen and Charles Gildemeister, it was an iron and glass Greek cross crowned by a dome 100 feet across, behind the Croton Distributing Reservoir in what is now Bryant Park. President Franklin Pierce dedicated it on July 14, 1853.', clue: 'Stand where its colours fall and look straight up.', source: src }, { r: 4 });
    k.egg(v(PL + 0.32, 3.2, 0.3), { id: 'crystalpalace-otis', title: 'The rope is cut', year: '1854', text: 'Elisha Otis invented the safety elevator in 1852. After he gave a public demonstration of it at the New York Crystal Palace in 1854, demand for the safety elevator began to rise.', clue: 'Step onto the open platform under the dome and stand still.', source: { name: 'Elisha Otis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Elisha_Otis' } }, { r: 1.4 });
    k.egg(v(FX0 - 0.6, 1.4, 0), { id: 'crystalpalace-fire', title: 'Twenty five minutes', year: '1858', text: 'On October 5, 1858, during the American Institute Fair, a fire started in a lumber room on the 42nd Street side. Within fifteen minutes the dome fell, and in twenty five minutes the whole building had burned to the ground. No one was killed.', clue: 'The rope across the north arm, and what is past it.', source: src }, { r: 1.6 });
    k.egg(v(86, 40, 4), { id: 'crystalpalace-latting', title: 'Taller than Trinity', year: '1853', text: 'The Latting Observatory, an octagonal, iron braced wooden tower 315 feet tall on the north side of 42nd Street, opened beside the Crystal Palace in 1853. Visitors climbed winding stairs to landings at 125, 225 and 300 feet. It burned on August 30, 1856.', clue: 'The timber tower to the north, from the pavement.', source: { name: 'Latting Observatory, Wikipedia', url: 'https://en.wikipedia.org/wiki/Latting_Observatory' } }, { r: 6 });
    k.egg(v(0, 12, -58), { id: 'crystalpalace-reservoir', title: 'A walk on the wall', year: '1842', text: 'The Croton Distributing Reservoir at 42nd Street and Fifth Avenue was first filled on July 4, 1842. Its Egyptian Revival granite walls stood 50 feet high and 25 feet thick, with a public promenade along the top. The New York Public Library stands where it was.', clue: 'The granite wall to the east, seen through the glass.', source: { name: 'Croton Distributing Reservoir, Wikipedia', url: 'https://en.wikipedia.org/wiki/Croton_Distributing_Reservoir' } }, { r: 5 });
    k.egg(v(0, 4.2, 49.6), { id: 'crystalpalace-barnum', title: 'A showman in charge', text: 'Theodore Sedgwick was the first president of the Crystal Palace Association. After a year he was succeeded by Phineas T. Barnum.', clue: 'The door off Sixth Avenue.', source: src }, { r: 1.6 });

    /* the entrance arm first, so a short hang lands by the door, then the crossing, the salon, the hall of machines and 1858 */
    const zone = (m: Mount) => (m.position.z > 12 ? 0 : Math.abs(m.position.x) < 12 && Math.abs(m.position.z) < 12 ? 1 : m.position.x < -12 ? 2 : m.position.z < -12 ? 3 : 4);
    mounts.sort((a, b) => zone(a) - zone(b) || b.position.z - a.position.z || a.position.x - b.position.x);
    const floorY = (x: number, z: number) => (Math.abs(x) < PL - 0.15 && Math.abs(z) < PL - 0.15 ? platY + 0.22 : 0);
    return { mounts, spawn: v(0, EYE, 59.5), look: v(0, 13, 30), eye: EYE, floorY, bounds: [-49.2, 49.2, -49.2, 61], style: st };
  },
};
