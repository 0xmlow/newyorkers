/* 179: Columbus Park, Chinatown, at seven in the morning. The ground that was Mulberry Bend, cleared
   in 1897: the raised open air pavilion of that year at the north end with music under its wooden
   roof, the paved plaza with two tai chi groups moving as one (one instanced rig of bodies and one
   of arms, matrices rewritten each frame on a slow shared cycle with a per figure phase offset), the
   xiangqi tables with crowds of elders three deep that shift from table to table, the 1934 limestone
   comfort station carrying the census wall, the turf field with its basketball and volleyball courts,
   the playground, the iron picket fence, London planes, and pigeons that lift when the visitor walks
   into them and settle again twenty seconds later. Mulberry Street's tenements with their fire escapes
   to the east; Baxter Street to the west with the cleared lot where the Tombs stood until 2024 and the
   Criminal Courts Building beyond it. The room keeps New York time: the tai chi and the chess crowds
   are thickest before nine and thin after. Rules kept: no likeness of any real person, no lettered text
   beyond public signage in English, no Chinese characters anywhere (shop signs are plain coloured
   boards), no business names. Helpers are copied from v14 and v3, nothing there is exported. */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as X from '../textures';
import { v, type Mount, type FrameStyle } from '../kit';
import type { RoomDef } from './types';
const PI = Math.PI;
type K = Parameters<RoomDef['build']>[0];
type C = Parameters<RoomDef['build']>[1];
const ONE = new T.Vector3(1, 1, 1);
const UP = new T.Vector3(0, 1, 0);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp01(t);
/* the camera, read inside a tick only: the audit and the check scripts run in node with no window */
const cam = (): T.Camera | undefined => (typeof window === 'undefined' ? undefined : (window as unknown as { __museum?: { camera?: T.Camera } }).__museum?.camera);

/* ---------------- helpers, copied from v14 and v3 (not exported there) ---------------- */
function figureGeo(r = 0.2, len = 0.82, headY = 1.35) {
  const body = new T.CapsuleGeometry(r, len, 3, 8); body.translate(0, r + len / 2, 0);
  const head = new T.SphereGeometry(r * 0.62, 10, 8); head.translate(0, headY, 0);
  return mergeGeometries([body, head])!;
}
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat = false) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) t.wrapS = t.wrapT = T.RepeatWrapping;
  return t;
}
/* a mount on a wall: rotation r faces the normal (sin r, 0, cos r); the target is d metres out */
function hang(ms: Mount[], x: number, y: number, z: number, r: number, w: number, h: number, style: FrameStyle, d = 3.2) {
  ms.push({ position: v(x, y, z), rotation: r, target: v(x + Math.sin(r) * d, y, z + Math.cos(r) * d), width: w, height: h, style, wash: true });
}
/* people sitting or standing still: one instanced figure each */
function still(k: K, pts: { x: number; y: number; z: number; ry: number; sit?: boolean; s?: number }[], seed: number, colours = [0x1c1e24, 0x2a2e38, 0x3a3230, 0x1a1a1c, 0x4a4a52, 0x2c3a4a, 0x5a4a3a, 0xe0dcd0]) {
  if (!pts.length) return null;
  const rnd = X.mulberry(seed), c = new T.Color();
  const o = k.instances(figureGeo(0.19, 0.62, 1.12), new T.MeshStandardMaterial({ roughness: 0.9 }), pts.map((p) => new T.Matrix4().compose(v(p.x, p.y + (p.sit ? 0.12 : 0), p.z), new T.Quaternion().setFromAxisAngle(UP, p.ry), v(p.s ?? 1, (p.sit ? 0.82 : 1.1 + rnd() * 0.12) * (p.s ?? 1), p.s ?? 1))));
  pts.forEach((_, i) => o.setColorAt(i, c.set(colours[Math.floor(rnd() * colours.length)])));
  if (o.instanceColor) o.instanceColor.needsUpdate = true;
  return o;
}
/* a row of New York house fronts: brownstone, brick and limestone, stoops and cornices; facing +z or -z (v14) */
function houses(k: K, x0: number, x1: number, z: number, facing: number, seed: number, p: { hMin?: number; hMax?: number; depth?: number } = {}) {
  const { hMin = 14, hMax = 20, depth = 12 } = p, rnd = X.mulberry(seed);
  const mats = [k.pbr('cpHsBrown' + seed, X.ashlar(0x6e4c3c, seed + 1, 6), 0.4, { normal: 0.4 }), k.pbr('cpHsBrick' + seed, X.brick(0x7a4032, seed + 2), 0.9), k.pbr('cpHsLime' + seed, X.ashlar(0xcdbfa4, seed + 3, 5), 0.35, { normal: 0.4 }), k.pbr('cpHsBrick2' + seed, X.brick(0x9a6a4e, seed + 4), 0.9)];
  const win = k.flat(0x1a2128, 0.6, 0.18), trim = k.flat(0xe8e2d4, 0, 0.6), corn = k.flat(0x4a4038, 0.2, 0.6), door = k.flat(0x2a1c14, 0, 0.5);
  let x = x0;
  while (x < x1 - 3) {
    const w = Math.min(x1 - x, 6 + Math.floor(rnd() * 3)), h = hMin + rnd() * (hMax - hMin), m = mats[Math.floor(rnd() * mats.length)], cx = x + w / 2;
    k.box(w, h, depth, cx, h / 2, z - facing * depth / 2, m);
    const floors = Math.floor((h - 1.5) / 3.3), cols = w > 7 ? 3 : 2;
    for (let f = 0; f < floors; f++) for (let c = 0; c < cols; c++) {
      const wx = x + ((c + 0.5) / cols) * w, wy = 2.4 + f * 3.3 + (f > 0 ? 0.6 : 0);
      if (f === 0 && c === 0) { k.box(1.3, 2.6, 0.1, wx, 1.3 + 0.9, z + facing * 0.02, door); for (let s = 0; s < 5; s++) k.box(1.8, 0.18, 0.36, wx, 0.09 + s * 0.18, z + facing * (0.18 + (4 - s) * 0.36), m); continue; }
      k.box(1.15, 1.9, 0.08, wx, wy, z + facing * 0.03, win);
      k.box(1.35, 0.14, 0.2, wx, wy + 1.02, z + facing * 0.08, trim);
    }
    k.box(w, 0.5, 0.7, cx, h - 0.25, z + facing * 0.3, corn);
    x += w;
  }
}
/* cars on a street along z: one instanced body, one instanced cabin, wheels; parked ones never move (v14's traffic turned through ninety degrees) */
function trafficZ(k: K, ctx: C, p: { lanes: { x: number; dir: number; n: number; speed?: number }[]; z0: number; z1: number; seed: number; y?: number }) {
  const { lanes, z0, z1, seed, y = 0 } = p, rnd = X.mulberry(seed), span = z1 - z0;
  const cars: { x: number; z: number; dir: number; v: number; len: number }[] = [];
  for (const l of lanes) for (let i = 0; i < l.n; i++) {
    const len = 4.2 + rnd() * 0.8;
    cars.push({ z: z0 + ((i + rnd() * 0.5) / l.n) * span, x: l.x, dir: l.dir, v: l.dir === 0 ? 0 : (l.speed ?? 7) * (0.8 + rnd() * 0.35), len });
  }
  const n = cars.length;
  const prof = (pts: number[][], depth: number) => { const sh = new T.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) sh.lineTo(q[0], q[1]); sh.closePath(); const g = new T.ExtrudeGeometry(sh, { depth, bevelEnabled: false }); g.translate(0, 0, -depth / 2); return g; };
  const bodyG = prof([[-0.5, 0.28], [0.5, 0.28], [0.5, 0.62], [0.47, 0.76], [0.22, 0.84], [-0.3, 0.86], [-0.48, 0.8], [-0.5, 0.64]], 1.8);
  const cabG = prof([[-0.3, 0.84], [0.2, 0.84], [0.06, 1.34], [-0.24, 1.34]], 1.66);
  const body = k.instances(bodyG, new T.MeshStandardMaterial({ roughness: 0.35, metalness: 0.5 }), Array.from({ length: n }, () => new T.Matrix4()));
  const cab = k.instances(cabG, new T.MeshStandardMaterial({ color: 0x1a2026, roughness: 0.15, metalness: 0.7 }), Array.from({ length: n }, () => new T.Matrix4()));
  const wheel = k.instances(new T.CylinderGeometry(0.34, 0.34, 1.9, 10).rotateX(PI / 2), new T.MeshStandardMaterial({ color: 0x151515, roughness: 0.9 }), Array.from({ length: n * 2 }, () => new T.Matrix4()));
  body.frustumCulled = cab.frustumCulled = wheel.frustumCulled = false;
  const pal = [0xf2c318, 0x1c1e22, 0xe8e8ea, 0x6a7078, 0x2a3a5a, 0x7a1e22, 0xb8bcc2, 0x1a3a2a, 0xf2c318, 0xe8e8ea];
  const c = new T.Color();
  cars.forEach((a, i) => body.setColorAt(i, c.set(pal[Math.floor(rnd() * pal.length)])));
  if (body.instanceColor) body.instanceColor.needsUpdate = true;
  const m = new T.Matrix4(), q = new T.Quaternion(), pos = new T.Vector3(), sc = new T.Vector3();
  const place = (dt: number) => {
    cars.forEach((a, i) => {
      a.z += a.v * a.dir * Math.min(dt, 0.1);
      if (a.z > z1) a.z -= span; if (a.z < z0) a.z += span;
      /* a car built along +x, turned to point along +z (dir 1) or -z (dir -1 and the parked ones) */
      q.setFromAxisAngle(UP, a.dir > 0 ? -PI / 2 : PI / 2);
      pos.set(a.x, y, a.z); sc.set(a.len, 1, 1); m.compose(pos, q, sc); body.setMatrixAt(i, m); cab.setMatrixAt(i, m);
      for (const s of [-1, 1]) { pos.set(a.x, y + 0.34, a.z + s * a.len * 0.32); sc.set(1, 1, 1); m.compose(pos, q, sc); wheel.setMatrixAt(i * 2 + (s > 0 ? 1 : 0), m); }
    });
    body.instanceMatrix.needsUpdate = cab.instanceMatrix.needsUpdate = wheel.instanceMatrix.needsUpdate = true;
  };
  place(0);
  if (!ctx.reduced) k.ticks.push((_t, dt) => place(dt));
}
/* a hipped roof: eaves w by d at eaveY, a ridge of ridgeLen along x at ridgeY, centred on the origin */
function hipRoof(w: number, d: number, eaveY: number, ridgeY: number, ridgeLen: number) {
  const hw = w / 2, hd = d / 2, hr = ridgeLen / 2;
  const P = [[-hw, eaveY, -hd], [hw, eaveY, -hd], [hw, eaveY, hd], [-hw, eaveY, hd], [-hr, ridgeY, 0], [hr, ridgeY, 0]];
  const F = [[0, 1, 5], [0, 5, 4], [2, 3, 4], [2, 4, 5], [0, 4, 3], [1, 2, 5]];
  const pos: number[] = [];
  for (const f of F) for (const i of f) pos.push(P[i][0], P[i][1], P[i][2]);
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
  return g;
}
/* a park bench from four boxes, batched with everything else (k.bench costs 23 draw calls) */
function parkBench(k: K, x: number, z: number, rotY: number, slats: T.Material, frame: T.Material, len = 1.9) {
  const cs = Math.cos(rotY), sn = Math.sin(rotY);
  const put = (w: number, h: number, d: number, dx: number, y: number, dz: number, m: T.Material) => { const o = k.box(w, h, d, x + dx * cs + dz * sn, y, z - dx * sn + dz * cs, m); o.rotation.y = rotY; };
  put(len, 0.06, 0.5, 0, 0.47, 0, slats);
  put(len, 0.5, 0.06, 0, 0.78, -0.24, slats);
  for (const dx of [-len / 2 + 0.15, len / 2 - 0.15]) put(0.08, 0.46, 0.5, dx, 0.23, 0, frame);
  k.keepOut.push({ x, z, r: 0.75 });
}
/* chain link: a fine grid on a transparent canvas */
function chainLinkMat() {
  const t = canvasTex(128, 128, (g) => {
    g.clearRect(0, 0, 128, 128); g.strokeStyle = 'rgba(190,196,204,0.95)'; g.lineWidth = 3; g.beginPath();
    for (let i = -128; i < 256; i += 16) { g.moveTo(i, 0); g.lineTo(i + 128, 128); g.moveTo(i + 128, 0); g.lineTo(i, 128); }
    g.stroke();
  }, true);
  return new T.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.2, side: T.DoubleSide, depthWrite: false });
}
/* a xiangqi board: nine by ten lines on tan, a river across the middle, round pieces in red and black, no glyphs */
function boardTex(seed: number) {
  return canvasTex(128, 144, (g) => {
    const rnd = X.mulberry(seed);
    g.fillStyle = '#d9c39a'; g.fillRect(0, 0, 128, 144);
    g.strokeStyle = '#3a2a18'; g.lineWidth = 1.5;
    for (let i = 0; i < 9; i++) { const x = 12 + i * 13; g.beginPath(); g.moveTo(x, 12); g.lineTo(x, 64); g.moveTo(x, 80); g.lineTo(x, 132); g.stroke(); }
    for (let j = 0; j < 10; j++) { const y = 12 + j * 13.3; g.beginPath(); g.moveTo(12, y); g.lineTo(116, y); g.stroke(); }
    g.beginPath(); g.moveTo(12, 64); g.lineTo(12, 80); g.moveTo(116, 64); g.lineTo(116, 80); g.stroke();
    for (let n = 0; n < 22; n++) { const x = 12 + Math.floor(rnd() * 9) * 13, y = 12 + Math.floor(rnd() * 10) * 13.3; g.fillStyle = n % 2 ? '#b8262a' : '#1e1c1a'; g.beginPath(); g.arc(x, y, 5.2, 0, PI * 2); g.fill(); g.strokeStyle = '#efe4cc'; g.lineWidth = 1; g.beginPath(); g.arc(x, y, 3.6, 0, PI * 2); g.stroke(); }
  });
}

/* ================================================================== */
/* ---------------- 179 COLUMBUS PARK AT SEVEN ---------------- */
export const columbuspark: RoomDef = {
  id: 'columbuspark',
  name: 'Columbus Park at seven',
  area: 'COLUMBUS PARK / CHINATOWN',
  mood: 'Seven in the morning, everyone already here',
  color: '#b8322c',
  daylit: true,
  description: 'Columbus Park at seven in the morning, on the ground that was Mulberry Bend: two tai chi groups moving as one on the plaza, crowds of elders three deep round the xiangqi tables under the planes, music under the pavilion of 1897 at the north end, pigeons underfoot, delivery bikes on Mulberry Street and the tenements with their fire escapes catching the first sun. Across Baxter Street to the west, the cleared lot where the Tombs stood until 2024 and the towers of the Criminal Courts Building. The New Yorkers hang on the pavilion\'s back wall, on the park\'s iron fence facing in, on the handball wall and on the courts\' fence, and a census wall covers the limestone comfort station of 1934.',
  signatures: 'The raised open air pavilion of 1897 with its wooden roof beams and its new elevator, the paved plaza, the xiangqi tables with concrete stools and their standing crowds, tai chi with red fans, the 1934 limestone comfort station, the turf field with three basketball and three volleyball courts, the playground, the iron picket fence, London planes, the tenements of Mulberry Street with fire escapes and plain coloured shop boards, the Criminal Courts Building, and the hoarding round the site of the Tombs on Baxter Street.',
  build(k, ctx) {
    /* ---- light: the sun low in the east over Mulberry Street, morning haze ---- */
    k.sky({ top: 0x5a92d4, horizon: 0xe6e2d6, ground: 0x7a7468, fog: 0.0022, sun: { az: 1.15, el: 0.28, color: 0xffe2b8, size: 10 }, haze: 0.5, env: 0.65 });
    k.hemi(0xdde6f0, 0x7a7468, 1.05);
    k.sun(0xffe4c0, 2.4, 80, 34, -30, true, 110);
    const hour0 = k.o && typeof k.o.hour === 'number' ? k.o.hour : 7;
    /* how full the plaza is by the New York hour: thickest before nine, thin by eleven, a few at night */
    const dens = (h: number) => h < 5 ? 0.05 : h < 6.5 ? lerp(0.05, 1, (h - 5) / 1.5) : h < 9 ? 1 : h < 11 ? lerp(1, 0.4, (h - 9) / 2) : h < 17 ? 0.4 : h < 19.5 ? lerp(0.4, 0.15, (h - 17) / 2.5) : h < 23 ? lerp(0.15, 0.05, (h - 19.5) / 3.5) : 0.05;

    const plaza = k.pbr('cpPlaza', X.pavers(0x8e8a80, 179), 0.5), asph = k.pbr('cpAsph', X.asphalt(), 0.3), walk = k.pbr('cpWalk', X.concrete(0xa8a49c, 180), 0.4),
      turf = k.pbr('cpTurf', X.grass(0x3f7a3a, 181), 0.3, { roughness: 1 }), lawn = k.pbr('cpLawn', X.grass(0x4b6b3a, 184), 0.35, { roughness: 1 }), dirt = k.flat(0x8a7a62, 0, 1),
      lime = k.pbr('cpLime', X.ashlar(0xcdbfa4, 182, 5), 0.35, { normal: 0.4 }), limeDark = k.flat(0x9a8e76, 0, 0.85), court = k.pbr('cpCourt', X.asphalt(0x2c3036), 0.3),
      terr = k.pbr('cpTerr', X.concrete(0xb8b2a6, 185), 0.4), cream = k.flat(0xe6dcc6, 0, 0.8), roofM = k.flat(0x5a3a2c, 0.3, 0.6, { side: T.DoubleSide }),
      wood = k.pbr('cpWood', X.planks(0x6a4428, 6, 183), 0.8, { roughness: 0.55 }), woodDark = k.flat(0x3e2616, 0, 0.5),
      iron = k.flat(0x1e2024, 0.6, 0.5), steel = k.flat(0x9aa4ae, 0.8, 0.35), glass = k.glass(0xcfe0ea, 0.3, 0.1), white = k.flat(0xf0f2f0, 0, 0.6), line = k.flat(0xe8e4d8, 0, 0.8),
      curb = k.flat(0x8a8680, 0, 0.8), concrete = k.pbr('cpConc', X.concrete(0x9c9a92, 186), 0.5), rubber = k.flat(0x7a3a30, 0, 0.95), rubberG = k.flat(0x3a6a4a, 0, 0.95),
      yellow = k.flat(0xf2c318, 0, 0.6), blue = k.flat(0x2a5db8, 0, 0.6), red = k.flat(0xc8262a, 0, 0.6), green = k.flat(0x1f5a2b, 0, 0.7),
      plyGreen = k.flat(0x2f6a3a, 0, 0.9), orange = k.flat(0xe8792a, 0, 0.7), fan = k.flat(0xc8262a, 0, 0.6, { side: T.DoubleSide }), chain = chainLinkMat();
    const mounts: Mount[] = [], st: FrameStyle = 'black';
    const rnd = X.mulberry(1897);

    /* ================= the ground: park, pavements, streets ================= */
    k.box(200, 0.3, 280, 0, -0.35, 0, dirt);
    /* the park floor: lawn everywhere, the plaza paved over its north half, paths round the edge */
    k.box(61, 0.2, 133, 0, -0.1, 0, lawn);
    k.box(60, 0.22, 42, 0, -0.1, -28, plaza);
    for (const s of [-1, 1]) k.box(5, 0.22, 133, s * 27.5, -0.1, 0, plaza);
    k.box(60, 0.22, 6, 0, -0.1, 17, plaza); k.box(60, 0.22, 5, 0, -0.1, 57.5, plaza);
    k.box(6, 0.22, 60, 0, -0.1, 27, plaza); k.box(6, 0.22, 5, 0, -0.1, 63.5, plaza);
    /* pavements and streets: Mulberry east, Baxter west, Bayard north, Worth south */
    for (const s of [-1, 1]) {
      k.box(5.5, 0.2, 145, s * 33.25, -0.1, 0, walk); k.box(0.25, 0.18, 145, s * 36, -0.02, 0, curb);
      k.box(10, 0.2, 145, s * 41, -0.14, 0, asph);
      k.box(4, 0.2, 145, s * 48, -0.1, 0, walk); k.box(0.25, 0.18, 145, s * 46, -0.02, 0, curb);
      for (let z = -70; z < 72; z += 3.4) k.box(0.12, 0.012, 1.6, s * 41, 0.005, z, line);
      k.box(100, 0.2, 5.5, 0, -0.1, s * 69.25, walk); k.box(100, 0.18, 0.25, 0, -0.02, s * 72, curb);
      k.box(100, 0.2, 10, 0, -0.14, s * 77, asph);
      k.box(100, 0.2, 4, 0, -0.1, s * 84, walk); k.box(100, 0.18, 0.25, 0, -0.02, s * 82, curb);
      for (let x = -48; x < 50; x += 3.4) k.box(1.6, 0.012, 0.12, x, 0.005, s * 77, line);
    }
    /* cars: Mulberry one way north (towards -z), Baxter one way south, parking on both, two lanes on Worth and Bayard */
    trafficZ(k, ctx, { lanes: [{ x: 42.5, dir: -1, n: 3, speed: 6 }, { x: 38, dir: 0, n: 9 }, { x: -42.5, dir: 1, n: 3, speed: 6 }, { x: -38, dir: 0, n: 8 }], z0: -70, z1: 70, seed: 1791 });
    /* delivery bikes: three riders on a loop round the block */
    {
      const loop = k.spline([v(40, 0, -66), v(40, 0, 0), v(40, 0, 66), v(30, 0, 75), v(-30, 0, 75), v(-40, 0, 66), v(-40, 0, 0), v(-40, 0, -66), v(-30, 0, -75), v(30, 0, -75)], true, 0.5);
      for (let i = 0; i < 3; i++) {
        const g = new T.Group();
        const wheelG = new T.TorusGeometry(0.33, 0.035, 6, 18).rotateY(PI / 2);
        for (const dz of [-0.55, 0.55]) { const w = new T.Mesh(wheelG, iron); w.position.set(0, 0.33, dz); g.add(w); }
        const frame = new T.Mesh(new T.BoxGeometry(0.08, 0.1, 1.05), [k.flat(0x1c1e22, 0.5, 0.5), red, blue][i]); frame.position.set(0, 0.62, 0); frame.rotation.x = 0.25; g.add(frame);
        const rider = new T.Mesh(figureGeo(0.18, 0.5, 1.02), k.flat([0x2a2e38, 0x3a3230, 0x1a1a1c][i], 0, 0.9)); rider.position.set(0, 0.55, -0.1); rider.rotation.x = 0.28; g.add(rider);
        const bag = new T.Mesh(new T.BoxGeometry(0.5, 0.45, 0.4), [blue, red, orange][i]); bag.position.set(0, 0.95, -0.72); g.add(bag);
        k.add(g);
        if (!ctx.reduced) k.rider(g, loop, 5.2 + i * 0.4, i * 130 + 20);
        else { loop.getPointAt(i / 3, g.position); }
      }
    }
    /* walkers on the pavements and through the park */
    k.crowd([v(33.5, 0, -66), v(33.5, 0, 66)], 8, { seed: 1792, spread: 1.6, speed: 1.0, animate: !ctx.reduced });
    k.crowd([v(-33.5, 0, -66), v(-33.5, 0, 66)], 5, { seed: 1793, spread: 1.6, speed: 1.0, animate: !ctx.reduced });
    k.crowd([v(30.5, 0, -30), v(20, 0, -30), v(8, 0, -8), v(0, 0, 6), v(0, 0, 40), v(0, 0, 66.5)], 7, { seed: 1794, spread: 1.4, speed: 0.9, animate: !ctx.reduced });
    k.crowd([v(-30.5, 0, 30), v(-16, 0, 20), v(4, 0, 18), v(20, 0, 8), v(30.5, 0, -30)], 6, { seed: 1795, spread: 1.4, speed: 0.85, animate: !ctx.reduced });

    /* ================= the iron picket fence, with gates and the works' boards ================= */
    const FX = 30.5, FZ = 66.5;
    {
      const pk: T.Matrix4[] = [];
      const run = (x0: number, z0: number, x1: number, z1: number, gaps: [number, number][]) => {
        const L = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / L, uz = (z1 - z0) / L, ang = Math.atan2(ux, uz);
        const open = (s: number) => gaps.some(([a, b]) => s > a && s < b);
        let segStart = 0;
        const rail = (a: number, b: number) => {
          if (b - a < 0.3) return;
          const cx = x0 + ux * (a + b) / 2, cz = z0 + uz * (a + b) / 2;
          for (const y of [0.25, 1.35]) { const o = k.box(0.06, 0.06, b - a, cx, y, cz, iron); o.rotation.y = ang; }
          k.block(Math.min(x0 + ux * a, x0 + ux * b) - 0.25, Math.max(x0 + ux * a, x0 + ux * b) + 0.25, Math.min(z0 + uz * a, z0 + uz * b) - 0.25, Math.max(z0 + uz * a, z0 + uz * b) + 0.25);
        };
        for (let s = 0; s <= L + 0.01; s += 0.16) {
          if (open(s)) { if (segStart >= 0) { rail(segStart, s); segStart = -1; } continue; }
          if (segStart < 0) segStart = s;
          pk.push(new T.Matrix4().makeTranslation(x0 + ux * s, 0.72, z0 + uz * s));
        }
        if (segStart >= 0) rail(segStart, L);
        for (let s = 0; s <= L + 0.01; s += 3) { if (open(s) && !gaps.some(([a, b]) => Math.abs(s - a) < 0.2 || Math.abs(s - b) < 0.2)) continue; k.box(0.14, 1.6, 0.14, x0 + ux * s, 0.8, z0 + uz * s, iron); k.sphere(0.1, x0 + ux * s, 1.66, z0 + uz * s, iron, 8); }
      };
      /* east and west runs along z (s measured from z = -FZ); gates at z = -30 and 30 */
      run(FX, -FZ, FX, FZ, [[FZ - 32, FZ - 28], [FZ + 28, FZ + 32]]);
      run(-FX, -FZ, -FX, FZ, [[FZ - 32, FZ - 28], [FZ + 28, FZ + 32]]);
      /* north run (gates at x = -12 and 12) and south run (gate at x = 0) */
      run(-FX, -FZ, FX, -FZ, [[FX - 14, FX - 10], [FX + 10, FX + 14]]);
      run(-FX, FZ, FX, FZ, [[FX - 2.5, FX + 2.5]]);
      k.instances(new T.BoxGeometry(0.03, 1.3, 0.03), iron, pk);
      for (const [x, z, r] of [[FX + 0.6, -30, -PI / 2], [-FX - 0.6, 30, PI / 2], [FX + 0.6, 30, -PI / 2], [-FX - 0.6, -30, PI / 2]] as number[][]) {
        k.box(0.1, 1.9, 0.1, x + Math.sin(r) * 0.0, 0.95, z + 2.4, iron); k.box(1.6, 0.42, 0.06, x, 1.95, z + 2.4, green).rotation.y = r;
        k.sign('COLUMBUS PARK', 1.5, 0.3, x + Math.sin(r) * 0.04, 1.95, z + 2.4, 'transparent', '#f4f1e6', 96, r, { double: true });
      }
    }
    /* works on boards fixed to the fence, facing into the park */
    for (const z of [-46, -38, -22, -14, 6, 14]) { k.box(0.1, 2.3, 2.9, FX - 0.22, 1.95, z, woodDark); hang(mounts, FX - 0.3, 1.95, z, -PI / 2, 2.4, 1.8, st, 3.2); }
    for (const z of [-46, -38, -14, 42]) { k.box(0.1, 2.3, 2.9, -FX + 0.22, 1.95, z, woodDark); hang(mounts, -FX + 0.3, 1.95, z, PI / 2, 2.4, 1.8, st, 3.2); }

    /* ================= the pavilion of 1897 at the north end, on its terrace ================= */
    const TY = 1.5, PZ = -58;
    k.box(28, TY, 14, 0, TY / 2, PZ, terr);
    k.box(28.6, 0.12, 14.6, 0, TY + 0.06, PZ, limeDark);
    /* parapets, open at the central stair */
    for (const s of [-1, 1]) { k.box(0.3, 0.9, 14.4, s * 14.15, TY + 0.45, PZ, terr); k.block(s * 14.15 - 0.4, s * 14.15 + 0.4, PZ - 7.4, PZ + 7.4); }
    for (const s of [-1, 1]) { k.box(10, 0.9, 0.3, s * 9, TY + 0.45, PZ + 7.15, terr); k.block(s > 0 ? 4 : -14.3, s > 0 ? 14.3 : -4, PZ + 6.75, PZ + 7.55); }
    /* the stair down to the plaza, eight steps, eight metres wide */
    for (let i = 0; i < 8; i++) { const y = TY * (i + 1) / 8; k.box(8, y, 0.44, 0, y / 2, PZ + 7.3 + 0.22 + i * 0.44, terr); }
    for (const s of [-1, 1]) k.box(0.3, 1.0, 3.6, s * 4.15, TY * 0.6, PZ + 9.05, terr);
    /* the back wall the works hang on, plain rendered stone under the roof */
    k.box(28, 3.6, 0.4, 0, TY + 1.8, PZ - 6.6, lime); k.block(-14.2, 14.2, PZ - 7, PZ - 6.2);
    k.box(28.4, 0.2, 0.5, 0, TY + 3.7, PZ - 6.6, limeDark);
    /* twelve cream piers in two rows, wooden beams, the hipped roof with its beams showing underneath */
    for (const zr of [PZ - 4, PZ + 5]) for (let i = 0; i < 6; i++) { const x = -12.5 + i * 5; k.box(0.6, 4.4, 0.6, x, TY + 2.2, zr, cream); k.box(0.8, 0.3, 0.8, x, TY + 4.55, zr, cream); k.box(0.8, 0.25, 0.8, x, TY + 0.12, zr, limeDark); k.keepOut.push({ x, z: zr, r: 0.55 }); }
    for (const zr of [PZ - 6.4, PZ - 4, PZ + 5]) k.box(29.6, 0.36, 0.3, 0, TY + 4.9, zr, wood);
    for (let i = 0; i <= 14; i++) { const x = -14 + i * 2; k.box(0.18, 0.32, 15.6, x, TY + 5.05, PZ - 0.2, wood); }
    k.box(29.6, 0.3, 0.3, 0, TY + 7.0, PZ - 0.2, wood);
    k.mesh(hipRoof(31, 16.6, TY + 5.2, TY + 7.3, 22), roofM, 0, 0, PZ - 0.2);
    /* the elevator added in the restoration, glass and steel at the west end */
    k.box(3, TY + 5.2, 3, -16.6, (TY + 5.2) / 2, PZ, steel); k.box(2.6, TY + 4.6, 2.6, -16.6, (TY + 4.6) / 2 + 0.3, PZ, glass); k.block(-18.2, -15, PZ - 1.6, PZ + 1.6);
    k.box(2.4, 0.1, 1.2, -14.9, TY + 0.05, PZ, terr);
    /* planting round the terrace, as the restoration left it */
    { const shr: T.Matrix4[] = []; for (let i = 0; i < 40; i++) { const s = 0.45 + rnd() * 0.5, side = rnd() < 0.5 ? -1 : 1; shr.push(new T.Matrix4().compose(v(side * (15 + rnd() * 1.6), 0.35, PZ - 7 + rnd() * 14), new T.Quaternion(), v(s, s * 1.2, s))); } for (let i = 0; i < 14; i++) { const x = -13.5 + i * 2.05; if (Math.abs(x) < 4.8) continue; const s = 0.45 + rnd() * 0.4; shr.push(new T.Matrix4().compose(v(x, 0.35, PZ + 8.6 + rnd() * 0.6), new T.Quaternion(), v(s, s * 1.2, s))); } k.instances(new T.IcosahedronGeometry(0.5, 0), k.flat(0x3e6a38, 0, 0.9), shr); }
    k.block(-17, -4.2, PZ + 7.6, PZ + 9.6); k.block(4.2, 17, PZ + 7.6, PZ + 9.6);
    /* the works on the back wall, between the piers */
    for (const x of [-10, -5, 0, 5, 10]) hang(mounts, x, TY + 2.5, PZ - 6.35, 0, 2.4, 1.8, st, 3.15);
    /* the musicians under the roof at the west end: five seated, bows moving */
    {
      const mus = [-10.5, -9, -7.5, -6, -4.5].map((x, i) => ({ x, y: TY, z: PZ - 1, ry: PI, sit: true, i }));
      still(k, mus, 1798, [0x1c1e24, 0x6a1e22, 0x2c3a4a, 0x3a3230, 0xe0dcd0]);
      for (const m of mus) { k.box(0.5, 0.42, 0.5, m.x, TY + 0.21, m.z, woodDark); k.cyl(0.03, 0.9, m.x - 0.22, TY + 0.9, m.z + 0.25, woodDark, 0.03, 6); k.cyl(0.09, 0.14, m.x - 0.22, TY + 0.5, m.z + 0.25, wood, 0.09, 10); }
      k.box(0.6, 0.02, 0.4, -7.5, TY + 1.25, PZ - 0.9, iron); k.cyl(0.02, 1.2, -7.5, TY + 0.6, PZ - 0.9, iron, 0.02, 6);
      const bows = k.instances(new T.BoxGeometry(0.62, 0.03, 0.03), k.flat(0xd8c8a8, 0, 0.6), mus.map(() => new T.Matrix4()));
      bows.frustumCulled = false;
      const m4 = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3();
      const bow = (t: number) => { mus.forEach((m, i) => { p.set(m.x - 0.22 + 0.22 * Math.sin(t * 2.6 + i * 0.7), TY + 0.72, m.z + 0.42); q.setFromAxisAngle(UP, 0.35 * Math.sin(t * 2.6 + i * 0.7)); m4.compose(p, q, ONE); bows.setMatrixAt(i, m4); }); bows.instanceMatrix.needsUpdate = true; };
      bow(0);
      if (!ctx.reduced) k.ticks.push((t) => bow(t));
      k.keepOut.push({ x: -7.5, z: PZ - 1, r: 2.2 });
    }

    /* ================= the plaza: tai chi, the chess tables, benches, planes, lamps ================= */
    /* London planes in two rows down the plaza and along the field, and on the pavements */
    const trees: number[][] = [];
    for (let z = -44; z <= -12; z += 8) { trees.push([-23, z]); trees.push([23, z]); }
    for (let z = 26; z <= 50; z += 8) { trees.push([-24.5, z]); trees.push([24.5, z]); }
    for (const x of [-22, -12, -3]) trees.push([x, 62]);
    trees.push([-21, -58], [20, -58]);
    for (let z = -60; z <= 60; z += 15) { trees.push([33.5, z]); trees.push([-33.5, z + 7]); }
    for (const [x, z] of trees) { k.tree(x, 0, z, { h: 8 + rnd() * 3, r: 3.4 + rnd() * 1.2, seed: 179 + Math.round(x + z), leaf: 0x3f6b3e }); k.box(1.4, 0.06, 1.4, x, 0.03, z, iron); k.keepOut.push({ x, z, r: 0.9 }); }
    /* lamps, dim by day */
    for (const [x, z] of [[-14, -48], [14, -48], [-14, -10], [14, -10], [-4, 20], [4, 56], [26, 0], [-26, 40]]) k.lamp(x, z, 4.6, iron, 0xffd7a0, k.night > 0.5 ? 60 : 8);
    /* benches along the plaza's sides and the field paths */
    for (const z of [-42, -34, -26, -18]) { parkBench(k, 26.6, z, PI / 2, wood, iron); parkBench(k, -26.6, z, -PI / 2, wood, iron); }
    for (const z of [30, 38, 46]) { parkBench(k, 28.4, z, PI / 2, wood, iron); parkBench(k, -28.4, z, -PI / 2, wood, iron); }
    for (const x of [-20, -14, -8]) parkBench(k, x, 59.5, PI, wood, iron);

    /* the tai chi: two groups on the plaza facing north to their leaders, moving as one */
    {
      const spots: { x: number; z: number; fan: boolean }[] = [];
      for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) spots.push({ x: -12 + (c - 2) * 1.7, z: -36 + (r - 2) * 1.7, fan: false });
      spots.push({ x: -12, z: -41.2, fan: false });
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) spots.push({ x: 12 + (c - 1.5) * 1.7, z: -22 + (r - 1.5) * 1.7, fan: true });
      spots.push({ x: 12, z: -27, fan: true });
      const N = spots.length;
      const bodies = k.instances(figureGeo(0.19, 0.62, 1.12), new T.MeshStandardMaterial({ roughness: 0.9 }), Array.from({ length: N }, () => new T.Matrix4()));
      const arms = k.instances(new T.CapsuleGeometry(0.05, 0.5, 3, 6).translate(0, -0.3, 0), new T.MeshStandardMaterial({ roughness: 0.9 }), Array.from({ length: N * 2 }, () => new T.Matrix4()));
      const fanG = new T.RingGeometry(0.02, 0.34, 10, 1, 0, PI * 0.9); fanG.rotateZ(PI * 0.05);
      const fans = k.instances(fanG, fan, Array.from({ length: N }, () => new T.Matrix4()));
      bodies.frustumCulled = arms.frustumCulled = fans.frustumCulled = false;
      const pal = [0xf2f0ea, 0xe8e2d4, 0xdfe6f0, 0xf2f0ea, 0x9fb8d8, 0x1c1e24, 0xe8d8a8, 0xf2f0ea, 0xc8d8c0], c = new T.Color();
      const ph = new Float32Array(N), hs = new Float32Array(N);
      for (let i = 0; i < N; i++) { bodies.setColorAt(i, c.set(pal[Math.floor(rnd() * pal.length)])); arms.setColorAt(i * 2, c); arms.setColorAt(i * 2 + 1, c); ph[i] = (rnd() - 0.5) * 0.6; hs[i] = 0.92 + rnd() * 0.16; }
      if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true; if (arms.instanceColor) arms.instanceColor.needsUpdate = true;
      const m = new T.Matrix4(), q = new T.Quaternion(), qa = new T.Quaternion(), e = new T.Euler(), p = new T.Vector3(), hand = new T.Vector3(), sc = new T.Vector3(), zero = new T.Vector3(0, 0, 0);
      const face = PI; /* facing north, up the plaza to the leader */
      const place = (t: number, h: number) => {
        const d = dens(h), shown = Math.round(N * d);
        for (let i = 0; i < N; i++) {
          const s = spots[i];
          if (i >= shown && i !== 25 && i !== N - 1) { m.compose(p.set(s.x, -5, s.z), q.identity(), zero); bodies.setMatrixAt(i, m); arms.setMatrixAt(i * 2, m); arms.setMatrixAt(i * 2 + 1, m); fans.setMatrixAt(i, m); continue; }
          const u = t * 0.42 + ph[i];                 /* one slow shared cycle of about fifteen seconds */
          const sway = 0.22 * Math.sin(u), knee = 0.96 + 0.04 * Math.cos(u * 2), yaw = face + 0.28 * Math.sin(u * 0.5 + 0.4);
          p.set(s.x + sway * Math.cos(face), 0, s.z - sway * Math.sin(face));
          q.setFromAxisAngle(UP, yaw); sc.set(1, hs[i] * knee, 1);
          m.compose(p, q, sc); bodies.setMatrixAt(i, m);
          for (const side of [-1, 1]) {
            const raise = 0.5 + 0.5 * Math.sin(u + side * 0.35);        /* arms float up to the horizontal and down */
            const pitch = -0.2 - 1.45 * raise, roll = side * (0.25 + 0.55 * (1 - raise));
            e.set(pitch, yaw, roll, 'YXZ'); qa.setFromEuler(e);
            p.set(s.x + sway * Math.cos(face) + Math.cos(yaw) * side * 0.24, 1.22 * hs[i] * knee, s.z - sway * Math.sin(face) - Math.sin(yaw) * side * 0.24);
            m.compose(p, qa, ONE); arms.setMatrixAt(i * 2 + (side > 0 ? 1 : 0), m);
            if (side > 0) {
              if (s.fan) { hand.set(0, -0.6, 0).applyQuaternion(qa).add(p); e.set(pitch + PI / 2, yaw, 0.4 * Math.sin(u * 2), 'YXZ'); qa.setFromEuler(e); m.compose(hand, qa, ONE); fans.setMatrixAt(i, m); }
              else { m.compose(p.set(s.x, -5, s.z), q, zero); fans.setMatrixAt(i, m); }
            }
          }
        }
        bodies.instanceMatrix.needsUpdate = arms.instanceMatrix.needsUpdate = fans.instanceMatrix.needsUpdate = true;
      };
      place(0.4, hour0);
      if (!ctx.reduced) k.ticks.push((t) => place(t, (hour0 + t / 3600) % 24));
    }

    /* the xiangqi tables: concrete pedestals with stools, two players each, crowds of onlookers that shift */
    const tables: { x: number; z: number }[] = [];
    for (let i = 0; i < 6; i++) tables.push({ x: 20.5, z: -45 + i * 6.2 });
    for (let i = 0; i < 3; i++) tables.push({ x: -20.5, z: -21 + i * 6.2 });
    {
      const seated: { x: number; y: number; z: number; ry: number; sit?: boolean }[] = [];
      const boardM = new T.MeshStandardMaterial({ map: boardTex(1799), roughness: 0.8 });
      for (const tb of tables) {
        k.cyl(0.32, 0.72, tb.x, 0.36, tb.z, concrete, 0.38, 12); k.box(1.0, 0.07, 1.0, tb.x, 0.76, tb.z, concrete);
        k.plane(0.62, 0.7, tb.x, 0.8, tb.z, boardM, 0, -PI / 2);
        for (const s of [-1, 1]) { k.cyl(0.2, 0.45, tb.x + s * 0.85, 0.225, tb.z, concrete, 0.22, 10); seated.push({ x: tb.x + s * 0.85, y: 0.05, z: tb.z, ry: s > 0 ? PI / 2 : -PI / 2, sit: true }); }
        k.keepOut.push({ x: tb.x, z: tb.z, r: 1.7 });
      }
      still(k, seated, 1800, [0x1c1e24, 0x2a2e38, 0x3a3230, 0x4a4a52, 0x2c3a4a, 0x6a5a48, 0xe0dcd0, 0x1a1a1c]);
      /* the onlookers: six slots round every table, filled by the hour, one of them always on the move */
      const slots: { x: number; z: number; ry: number; tb: number }[] = [];
      tables.forEach((tb, ti) => { for (let j = 0; j < 6; j++) { const a = -PI * 0.42 + (j / 5) * PI * 0.84 + (ti % 2 ? PI : 0); const sx = tb.x + Math.sin(a) * 1.45, sz = tb.z + Math.cos(a) * 1.45; slots.push({ x: sx, z: sz, ry: Math.atan2(tb.x - sx, tb.z - sz), tb: ti }); } });
      const NO = slots.length;
      const look = k.instances(figureGeo(0.19, 0.62, 1.12), new T.MeshStandardMaterial({ roughness: 0.9 }), Array.from({ length: NO }, () => new T.Matrix4()));
      look.frustumCulled = false;
      const pal = [0x1c1e24, 0x2a2e38, 0x3a3230, 0x1a1a1c, 0x4a4a52, 0x2c3a4a, 0x5a4a3a, 0xe0dcd0, 0x7a2a2a, 0x24405a], c = new T.Color();
      const ph = new Float32Array(NO), hs = new Float32Array(NO), order: number[] = [];
      for (let i = 0; i < NO; i++) { look.setColorAt(i, c.set(pal[Math.floor(rnd() * pal.length)])); ph[i] = rnd() * 6.3; hs[i] = 1.02 + rnd() * 0.16; order.push(i); }
      for (let i = NO - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
      if (look.instanceColor) look.instanceColor.needsUpdate = true;
      const m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), p = new T.Vector3(), sc = new T.Vector3(), zero = new T.Vector3(0, 0, 0);
      /* the mover: every nine seconds one onlooker leaves a slot and walks to an empty one at another table */
      const mover = { who: -1, from: -1, to: -1, t0: -1 };
      const at = new Int16Array(NO); at.forEach((_, i) => { at[i] = i; });
      const place = (t: number, h: number) => {
        const d = Math.max(dens(h), h < 21 && h > 6 ? 0.5 : 0.08), shown = Math.round(NO * d);
        if (t - mover.t0 > 9 && shown > 2) {
          const who = order[Math.floor((t / 9) % shown)];
          const empties = order.slice(shown).filter((s) => slots[s].tb !== slots[at[who]].tb);
          if (empties.length) { mover.who = who; mover.from = at[who]; mover.to = empties[Math.floor(rnd() * empties.length)]; mover.t0 = t; }
        }
        for (let n = 0; n < NO; n++) {
          const i = order[n], s = slots[at[i]];
          if (n >= shown) { m.compose(p.set(s.x, -5, s.z), q.identity(), zero); look.setMatrixAt(i, m); continue; }
          let x = s.x, z = s.z, ry = s.ry;
          if (i === mover.who && mover.to >= 0) {
            const u = clamp01((t - mover.t0) / 4.5), a = slots[mover.from], b = slots[mover.to];
            x = lerp(a.x, b.x, u); z = lerp(a.z, b.z, u); ry = u < 1 ? Math.atan2(b.x - a.x, b.z - a.z) : b.ry;
            if (u >= 1) { at[i] = mover.to; order[order.indexOf(mover.to)] = mover.from; order[n] = mover.to; mover.to = -1; mover.who = -1; }
          }
          const sway = 0.03 * Math.sin(t * 0.9 + ph[i]), lean = 0.06 + 0.05 * Math.sin(t * 0.35 + ph[i] * 2);
          e.set(lean, ry, sway, 'YXZ'); q.setFromEuler(e);
          p.set(x, 0, z); sc.set(1, hs[i], 1); m.compose(p, q, sc); look.setMatrixAt(i, m);
        }
        look.instanceMatrix.needsUpdate = true;
      };
      place(0, hour0);
      if (!ctx.reduced) k.ticks.push((t) => place(t, (hour0 + t / 3600) % 24));
    }

    /* the pigeons: a flock of fourteen on the plaza that lifts when the visitor walks into it */
    const PIG = { cx: 1, cz: -16 };
    {
      const PN = 14, hx = new Float32Array(PN), hz = new Float32Array(PN), ph = new Float32Array(PN);
      for (let i = 0; i < PN; i++) { const a = rnd() * PI * 2, r = 0.8 + rnd() * 3.4; hx[i] = PIG.cx + Math.cos(a) * r; hz[i] = PIG.cz + Math.sin(a) * r; ph[i] = rnd() * 6.3; }
      k.prop('pigeon', hx[0], 0, hz[0], { height: 0.3 }).then((o) => {
        if (!o || !k.live) return;
        o.updateMatrixWorld(true);
        const inv = o.matrixWorld.clone().invert();
        const parts: { im: T.InstancedMesh; local: T.Matrix4 }[] = [];
        o.traverse((ch) => { if (ch instanceof T.Mesh) parts.push({ im: k.instances(ch.geometry, ch.material as T.Material, Array.from({ length: PN }, () => new T.Matrix4())), local: ch.matrixWorld.clone().premultiply(inv) }); });
        k.scene.remove(o); k.dynamic.delete(o);
        for (const pt of parts) pt.im.frustumCulled = false;
        const m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), p = new T.Vector3();
        let mode = 0, t0 = -100;
        const place = (t: number) => {
          const c = cam();
          if (mode === 0 && c) { for (let i = 0; i < PN; i++) if (Math.hypot(c.position.x - hx[i], c.position.z - hz[i]) < 3) { mode = 1; t0 = t; break; } }
          const u = t - t0;
          if (mode === 1 && u > 24) mode = 0;
          for (let i = 0; i < PN; i++) {
            let x: number, y: number, z: number, yaw: number, bank = 0, pitch = 0;
            if (mode === 0) {
              const dx = 0.35 * Math.sin(t * 0.31 + ph[i]), dz = 0.35 * Math.cos(t * 0.23 + ph[i] * 1.3);
              x = hx[i] + dx; z = hz[i] + dz; y = 0.02 * Math.abs(Math.sin(t * 2.7 + ph[i]));
              yaw = Math.atan2(0.35 * 0.31 * Math.cos(t * 0.31 + ph[i]), -0.35 * 0.23 * Math.sin(t * 0.23 + ph[i] * 1.3));
              pitch = 0.25 * Math.abs(Math.sin(t * 2.7 + ph[i]));
            } else {
              const rise = clamp01(u / 1.6), land = clamp01((u - 20) / 4);
              const a = ph[i] + u * 1.15, r = 4.5 + (i % 4) * 0.9, hgt = 3.6 + (i % 5) * 0.7;
              const fx = PIG.cx + Math.cos(a) * r, fz = PIG.cz + Math.sin(a) * r, fy = hgt * rise + 0.18 * Math.sin(t * 9 + ph[i]);
              x = lerp(fx, hx[i], land); z = lerp(fz, hz[i], land); y = lerp(fy, 0, land * land);
              yaw = Math.atan2(-Math.sin(a), Math.cos(a)) + PI; bank = -0.45 * (1 - land); pitch = -0.15 * (1 - land);
            }
            e.set(pitch, yaw, bank, 'YXZ'); q.setFromEuler(e); p.set(x, y, z); m.compose(p, q, ONE);
            for (const pt of parts) { const mm = m.clone().multiply(pt.local); pt.im.setMatrixAt(i, mm); }
          }
          for (const pt of parts) pt.im.instanceMatrix.needsUpdate = true;
        };
        place(0.5);
        if (!ctx.reduced) k.ticks.push((t) => place(t));
      });
    }

    /* ================= the middle: the 1934 comfort station with the census wall, the handball wall ================= */
    {
      const RX = -21.75, RZ = 6, RW = 8.5, RD = 14, RH = 4.6;
      k.box(RW, RH, RD, RX, RH / 2, RZ, lime); k.box(RW + 0.5, 0.4, RD + 0.5, RX, RH + 0.1, RZ, limeDark); k.box(RW - 0.6, 0.3, RD - 0.6, RX, RH + 0.3, RZ, concrete);
      k.block(RX - RW / 2 - 0.3, RX + RW / 2 + 0.3, RZ - RD / 2 - 0.3, RZ + RD / 2 + 0.3);
      for (const z of [RZ - 5, RZ + 5]) { k.box(0.1, 1.0, 1.4, RX + RW / 2 + 0.02, 3.4, z, k.flat(0x1a2128, 0.6, 0.18)); k.box(0.16, 0.14, 1.6, RX + RW / 2 + 0.06, 3.98, z, limeDark); }
      k.box(0.12, 2.4, 1.2, RX + RW / 2 + 0.02, 1.2, RZ + RD / 2 - 1.2, woodDark); k.box(0.12, 2.4, 1.2, RX - RW / 2 - 0.02, 1.2, RZ - RD / 2 + 1.2, woodDark);
      k.censusWall({ x: RX + RW / 2 + 0.08, y: 2.25, z: RZ, rotY: PI / 2, cols: 13, rows: 5, tile: 0.48, gap: 0.04, start: ctx.wallStart(1650, 65), pieces: ctx.all, backing: limeDark });
      k.box(0.06, 0.3, RD - 1, RX + RW / 2 + 0.03, 4.15, RZ, limeDark);
    }
    /* the handball wall north of the field, works on both faces */
    {
      const HX = -8, HZ = 16;
      k.box(8, 5, 0.4, HX, 2.5, HZ, concrete); k.box(8.2, 0.2, 0.5, HX, 5.05, HZ, limeDark); k.block(HX - 4.2, HX + 4.2, HZ - 0.5, HZ + 0.5);
      k.box(8, 0.05, 0.02, HX, 1.5, HZ - 0.21, line); k.box(8, 0.05, 0.02, HX, 1.5, HZ + 0.21, line);
      for (const x of [HX - 2, HX + 2]) { hang(mounts, x, 2.5, HZ - 0.24, PI, 2.4, 1.8, st, 3.2); hang(mounts, x, 2.5, HZ + 0.24, 0, 2.4, 1.8, st, 3.2); }
    }

    /* ================= the field: turf, three basketball and three volleyball courts, chain link ================= */
    {
      const Z0 = 22, Z1 = 54, X0 = -28, X1 = 28;
      k.box(34, 0.24, Z1 - Z0, -11, -0.09, (Z0 + Z1) / 2, turf); k.box(22, 0.24, Z1 - Z0, 17, -0.09, (Z0 + Z1) / 2, court);
      for (const z of [27, 38, 49]) {
        /* a basketball half court with the hoop on the east side */
        k.box(0.16, 3.4, 0.16, 26.6, 1.7, z, steel); k.box(1.8, 1.1, 0.06, 26.0, 3.3, z, white); k.box(0.05, 0.05, 0.05, 25.95, 3.05, z, orange);
        k.torus(0.23, 0.02, 25.6, 3.05, z, orange, 16).rotation.x = PI / 2;
        k.keepOut.push({ x: 26.6, z, r: 0.5 });
        for (const dz of [-4, 4]) k.box(10, 0.012, 0.08, 21, 0.035, z + dz, line); k.box(0.08, 0.012, 8, 16, 0.035, z, line);
        /* a volleyball court on the west of the asphalt, net across x */
        for (const x of [7.5, 15.5]) { k.cyl(0.05, 2.5, x, 1.25, z, steel, 0.05, 8); k.keepOut.push({ x, z, r: 0.35 }); }
        k.plane(8, 1.0, 11.5, 1.95, z, chain, PI / 2); k.box(8, 0.06, 0.02, 11.5, 2.45, z, white);
        for (const dz of [-4.5, 4.5]) k.box(9, 0.012, 0.08, 11.5, 0.035, z + dz, line);
      }
      /* the chain link fence, 3.6 m, posts every four metres, open at the middle of the north and south sides */
      const fenceRun = (ax: number, az: number, bx: number, bz: number, gap?: [number, number]) => {
        const L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L, ang = Math.atan2(ux, uz);
        const segs: [number, number][] = gap ? [[0, gap[0]], [gap[1], L]] : [[0, L]];
        for (const [a, b] of segs) {
          const cx = ax + ux * (a + b) / 2, cz = az + uz * (a + b) / 2;
          const pl = k.plane(b - a, 3.6, cx, 1.8, cz, chain, ang + PI / 2); void pl;
          for (const y of [0.1, 3.55]) { const o = k.box(0.05, 0.05, b - a, cx, y, cz, steel); o.rotation.y = ang; }
          k.block(Math.min(ax + ux * a, ax + ux * b) - 0.2, Math.max(ax + ux * a, ax + ux * b) + 0.2, Math.min(az + uz * a, az + uz * b) - 0.2, Math.max(az + uz * a, az + uz * b) + 0.2);
        }
        for (let s = 0; s <= L + 0.01; s += 4) { if (gap && s > gap[0] + 0.3 && s < gap[1] - 0.3) continue; k.cyl(0.05, 3.7, ax + ux * s, 1.85, az + uz * s, steel, 0.05, 8); }
      };
      fenceRun(X0, Z0, X1, Z0, [X1 - 2.2, X1 + 2.2]); fenceRun(X0, Z1, X1, Z1, [X1 - 2.2, X1 + 2.2]);
      fenceRun(X0, Z0, X0, Z1); fenceRun(X1, Z0, X1, Z1);
      /* works on boards fixed to the north fence, facing the plaza */
      for (const x of [10, 16, 22]) { k.box(2.9, 2.3, 0.1, x, 1.95, Z0 - 0.12, woodDark); hang(mounts, x, 1.95, Z0 - 0.2, PI, 2.4, 1.8, st, 3.2); }
      /* early players: a volleyball game and two shooting hoops */
      still(k, [{ x: 9, y: 0, z: 35.5, ry: 0 }, { x: 13.5, y: 0, z: 35, ry: 0.3 }, { x: 10, y: 0, z: 41, ry: PI }, { x: 14, y: 0, z: 41.5, ry: PI - 0.3 }, { x: 22, y: 0, z: 27.5, ry: PI / 2 }, { x: 20, y: 0, z: 50, ry: PI / 2 }, { x: -6, y: 0, z: 30, ry: 1 }, { x: -12, y: 0, z: 44, ry: 2.4 }], 1801, [0xe8e2d4, 0x2a5db8, 0xc8262a, 0x1c1e24, 0xf2c318, 0x3a6a4a]);
      if (!ctx.reduced) {
        const ball = k.mesh(new T.SphereGeometry(0.11, 10, 8), k.flat(0xf0e6c8, 0, 0.6), 11.5, 2, 38, true);
        k.ticks.push((t) => { const u = (t * 0.55) % 2, w = u < 1 ? u : 2 - u; ball.position.set(11.5, 1.3 + 2.2 * Math.sin(w * PI), 35.5 + 5.5 * w); });
      }
    }

    /* ================= the playground in the south east corner ================= */
    {
      k.box(22, 0.05, 9, 17, 0.025, 61, rubber); k.box(6, 0.06, 6, 12, 0.03, 61, rubberG);
      /* a climbing frame with a slide, swings, two spring riders, a low fence */
      for (const [x, z] of [[19, 59], [22, 59], [19, 63], [22, 63]]) k.box(0.14, 2.6, 0.14, x, 1.3, z, blue);
      k.box(3.4, 0.12, 4.4, 20.5, 1.5, 61, yellow); k.box(3.4, 0.9, 0.06, 20.5, 1.95, 58.9, red); k.box(3.4, 0.9, 0.06, 20.5, 1.95, 63.1, red);
      { const sl = k.box(0.8, 0.08, 3.4, 24.0, 0.8, 61, yellow); sl.rotation.z = 0.44; k.box(0.9, 1.2, 0.9, 25.6, 0.6, 61, k.flat(0x3a4048, 0.6, 0.5)); }
      for (let i = 0; i < 6; i++) k.box(1.2, 0.12, 0.35, 17.6, 0.25 + i * 0.25, 61 - 1.2 + i * 0.4, steel);
      k.keepOut.push({ x: 20.5, z: 61, r: 2.6 }, { x: 24.5, z: 61, r: 1.4 });
      for (const x of [9.5, 14.5]) k.box(0.12, 2.6, 0.12, x, 1.3, 65, steel); k.box(5.2, 0.12, 0.12, 12, 2.6, 65, steel);
      for (const x of [10.7, 13.3]) { for (const dx of [-0.25, 0.25]) k.cyl(0.015, 2.0, x + dx, 1.55, 65, iron, 0.015, 5); k.box(0.5, 0.06, 0.2, x, 0.55, 65, k.flat(0x1a1a1c, 0, 0.7)); }
      k.keepOut.push({ x: 12, z: 65, r: 1.6 });
      for (const [x, z] of [[8, 58.5], [8, 63]]) { k.cyl(0.05, 0.5, x, 0.25, z, steel, 0.08, 8); k.box(0.7, 0.4, 0.3, x, 0.7, z, [red, green][x > 0 && z > 60 ? 1 : 0]); k.keepOut.push({ x, z, r: 0.5 }); }
      for (let x = 6; x <= 28; x += 2) k.box(0.06, 0.9, 0.06, x, 0.45, 56.6, iron); k.box(22, 0.05, 0.05, 17, 0.9, 56.6, iron);
      /* two children and a grandparent, early */
      still(k, [{ x: 18, y: 0, z: 60.2, ry: 0.5, s: 0.55 }, { x: 10.7, y: 0.35, z: 65, ry: 0, sit: true, s: 0.55 }, { x: 15.5, y: 0, z: 62, ry: PI, s: 1 }], 1802, [0xf2c318, 0x2a5db8, 0x3a3230, 0xe8e2d4]);
    }

    /* ================= Mulberry Street: tenements with fire escapes, plain shop boards, awnings ================= */
    const tenements = (z0: number, z1: number, x: number, facing: number, seed: number) => {
      const r2 = X.mulberry(seed);
      const bricks = [k.pbr('cpTenA' + seed, X.brick(0x7a4032, seed + 1), 0.9), k.pbr('cpTenB' + seed, X.brick(0x9a6a4e, seed + 2), 0.9), k.pbr('cpTenC' + seed, X.brick(0x5e3a30, seed + 3), 0.9), k.pbr('cpTenD' + seed, X.ashlar(0xb8a888, seed + 4, 6), 0.4)];
      const win = k.flat(0x1a2128, 0.6, 0.18), sill = k.flat(0xd8d2c4, 0, 0.6), corn = k.flat(0x3a3028, 0.2, 0.6), fe = k.flat(0x1c1c1c, 0.6, 0.55);
      const boards = [red, yellow, green, blue, orange, k.flat(0xf0f2f0, 0, 0.6), k.flat(0x8a2a5a, 0, 0.6)];
      let z = z0;
      while (z < z1 - 3) {
        const w = Math.min(z1 - z, 6.5 + Math.floor(r2() * 3)), floors = 5 + Math.floor(r2() * 2), h = 4.2 + (floors - 1) * 3.1 + 0.8, m = bricks[Math.floor(r2() * bricks.length)], cz = z + w / 2;
        k.box(16, h, w, x + facing * 8, h / 2, cz, m);   /* the body stands behind the front; the front faces -x when facing is 1 */
        k.box(0.7, 0.6, w, x - facing * 0.3, h - 0.3, cz, corn);
        const cols = w > 8 ? 3 : 2;
        for (let f = 0; f < floors; f++) {
          const wy = f === 0 ? 2.1 : 4.2 + (f - 1) * 3.1 + 1.5;
          if (f === 0) {
            /* the shop: glazed front, a plain coloured board over it, an awning */
            k.box(0.08, 2.6, w - 1.2, x - facing * 0.03, 1.5, cz, win);
            k.box(0.12, 0.9, w - 0.8, x - facing * 0.1, 3.55, cz, boards[Math.floor(r2() * boards.length)]);
            if (r2() < 0.6) { const aw = k.box(1.6, 0.06, w - 1.4, x - facing * 0.9, 3.0, cz, boards[Math.floor(r2() * boards.length)]); aw.rotation.z = facing * 0.32; }
            continue;
          }
          for (let c = 0; c < cols; c++) { const wz = z + ((c + 0.5) / cols) * w; k.box(0.08, 1.7, 1.1, x - facing * 0.03, wy, wz, win); k.box(0.2, 0.12, 1.3, x - facing * 0.08, wy - 0.9, wz, sill); }
          /* the fire escape: a platform, its railing, and the ladder down to the floor below */
          const px = x - facing * 0.55;
          k.box(0.95, 0.05, w - 1.6, px, wy - 1.0, cz, fe);
          k.box(0.04, 0.9, w - 1.6, x - facing * 1.0, wy - 0.55, cz, fe); k.box(0.04, 0.04, w - 1.6, x - facing * 1.0, wy - 0.12, cz, fe);
          for (const dz of [-(w - 1.6) / 2, (w - 1.6) / 2]) k.box(0.95, 0.04, 0.04, px, wy - 0.12, cz + dz, fe);
          for (let j = 0; j < 4; j++) k.box(0.04, 0.9, 0.04, x - facing * 1.0, wy - 0.55, cz - (w - 1.6) / 2 + (j / 3) * (w - 1.6), fe);
          if (f > 1) { const lad = k.box(0.05, 3.0, 0.5, x - facing * 0.75, wy - 2.55, cz + (w - 1.6) / 2 - 0.5, fe); lad.rotation.x = facing * 0.32; }
        }
        z += w;
      }
    };
    tenements(-70, 70, 50, 1, 1803);
    /* street signs on the corners, and two water towers on the roofs */
    for (const [x, z, text, r] of [[36.2, -68, 'MULBERRY ST', PI / 2], [36.2, 68, 'MULBERRY ST', PI / 2], [-36.2, -68, 'BAXTER ST', -PI / 2], [-36.2, 68, 'BAXTER ST', -PI / 2], [36.2, -68.8, 'BAYARD ST', PI], [-36.2, 68.8, 'WORTH ST', 0]] as [number, number, string, number][]) {
      k.box(0.08, 3.4, 0.08, x, 1.7, z, iron); k.sign(text, 1.3, 0.26, x + Math.sin(r) * 0.06, 3.1, z + Math.cos(r) * 0.06, '#1f5a2b', '#f4f1e6', 60, r, { double: true });
    }
    k.prop('water_tower', 56, 19.8, -28, { height: 6 }); k.prop('water_tower', 57, 19.8, 34, { height: 6 });

    /* ================= Baxter Street: the cleared site of the Tombs, the Criminal Courts Building beyond ================= */
    {
      /* the hoarding along the pavement, green plywood on posts, and the lot behind it */
      k.box(0.12, 2.6, 58, -50.1, 1.3, -37, plyGreen); k.box(0.16, 0.14, 58, -50.1, 2.65, -37, iron);
      for (let z = -66; z <= -8; z += 2.4) k.box(0.2, 2.6, 0.2, -50.25, 1.3, z, iron);
      k.box(0.12, 2.6, 6, -50.1, 1.3, -37, k.flat(0x3a4048, 0.6, 0.5));
      k.box(40, 0.12, 58, -70, 0.02, -37, dirt);
      k.box(16, 0.6, 24, -68, 0.3, -40, concrete); k.box(12, 0.5, 8, -74, 0.25, -18, concrete);
      for (let i = 0; i < 9; i++) k.cyl(0.35, 2.0 + (i % 3), -58 - (i % 3) * 5, 1 + (i % 3) * 0.5, -56 + Math.floor(i / 3) * 6, steel, 0.35, 8);
      for (const [x, z, m] of [[-58, -14, blue], [-64, -14, red], [-58, -20, k.flat(0xf0f2f0, 0, 0.6)]] as [number, number, T.Material][]) k.box(6, 2.6, 2.4, x, 1.3, z, m);
      /* a tower crane */
      k.box(2.2, 46, 2.2, -70, 23, -40, yellow); k.box(1.4, 3, 1.4, -70, 47.5, -40, k.flat(0x3a4048, 0.6, 0.5));
      k.box(44, 1.6, 1.4, -56, 49, -40, yellow); k.box(12, 2.2, 1.6, -80, 48.5, -40, yellow); k.box(3, 2, 3, -85, 47.6, -40, concrete);
      k.beam(v(-70, 52, -40), v(-36, 49.5, -40), 0.06, iron, 4); k.beam(v(-70, 52, -40), v(-84, 49.5, -40), 0.06, iron, 4);
      k.beam(v(-46, 48.2, -40), v(-46, 6, -40), 0.05, iron, 4); k.box(1.4, 1.0, 1.4, -46, 6, -40, k.flat(0x3a4048, 0.6, 0.5));
      /* the Criminal Courts Building at 100 Centre Street: a limestone mass in setbacks, the tall slots of its windows */
      const cc = k.pbr('cpCourt2', X.ashlar(0xbfb49a, 187, 8), 0.3), ccWin = k.pbr('cpCcWin', X.windows(188, 0.18, 0x3a4048, false), 0.12, { emissive: 0xffffff, emissiveIntensity: 0.3 + 1.6 * k.night, roughness: 0.6, stretch: 0.5 });
      k.box(40, 26, 62, -71, 13, 30, cc); k.box(39.6, 20, 61.6, -71, 13.2, 30, ccWin);
      k.box(28, 26, 40, -73, 39, 30, cc); k.box(27.6, 24, 39.6, -73, 39.2, 30, ccWin);
      k.box(16, 22, 22, -75, 65, 30, cc); k.box(15.6, 20, 21.6, -75, 65.2, 30, ccWin);
      k.box(8, 8, 10, -75, 80, 30, cc);
      for (const dz of [-16, 16]) { k.box(12, 22, 16, -71, 61, 30 + dz, cc); k.box(11.6, 20, 15.6, -71, 61.2, 30 + dz, ccWin); }
      k.box(6, 0.2, 62, -50.5, 26.05, 30, limeDark);
    }
    /* Bayard Street to the north and Worth Street to the south: more house fronts and the Civic Center beyond */
    houses(k, -50, 50, -86, 1, 1804, { hMin: 15, hMax: 22, depth: 14 });
    houses(k, -50, 50, 86, -1, 1805, { hMin: 15, hMax: 22, depth: 14 });
    k.box(30, 60, 30, -70, 30, 100, k.pbr('cpCivic', X.windows(189, 0.2, 0x4a5058, false), 0.1, { emissive: 0xffffff, emissiveIntensity: 0.3 + 1.6 * k.night, roughness: 0.6, stretch: 0.6 }));
    k.skyline({ z: -150, count: 34, spacing: 7, seed: 1806, base: 0, lit: 0.25, x: 0, scale: 1.1 });
    k.skyline({ z: 160, count: 34, spacing: 7, seed: 1807, base: 0, lit: 0.25, x: 0, scale: 1.4, spires: true });

    /* ================= what the park knows ================= */
    const wiki = { name: 'Columbus Park (Manhattan), Wikipedia', url: 'https://en.wikipedia.org/wiki/Columbus_Park_(Manhattan)' };
    k.egg(v(0, TY + 6, PZ), { id: 'columbuspark-pavilion', title: 'The pavilion of 1897', year: '1897', text: 'The open air pavilion at the north end was built in 1897, in the administration of Mayor William L. Strong, the year the park opened as Mulberry Bend Park. It was closed for about thirty years and restored in 2007, and it is where the music plays in the mornings.', clue: 'Climb the steps at the north end and stand under the roof.', source: { name: 'Friends of Columbus Park, About the Park', url: 'https://jngong.github.io/focp-ny-website/about-columbus-park.html' } }, { r: 3.4 });
    k.egg(v(FX + 0.6, 2.2, -30), { id: 'columbuspark-bend', title: 'The Bend', year: '1897', text: 'This was Mulberry Bend, the curve of Mulberry Street at the heart of the Five Points, which Jacob Riis called the foul core of New York\'s slums. Calvert Vaux, co designer of Central Park, planned the park in the 1880s; the tenements came down and Mulberry Bend Park opened in the summer of 1897 with bench lined curved walkways and an open lawn. It was renamed for Columbus in 1911. Baxter Street was once Orange Street, and Worth Street was Anthony Street.', clue: 'The gate on Mulberry Street, where the Bend was.', source: { name: 'Columbus Park history, NYC Parks', url: 'https://www.nycgovparks.org/parks/columbus-park-m015/history' } }, { r: 1.6 });
    k.egg(v(tables[2].x, 1.0, tables[2].z), { id: 'columbuspark-xiangqi', title: 'Chess, mahjong and tai chi', year: '1970', text: 'The neighbourhood meets here to play mahjong, perform traditional Chinese music and practise tai chi in the early mornings, and the tables draw crowds of xiangqi players and onlookers. In 1970 the Chinese American Arts Council launched the Chinatown Outdoor Summer Festival in the park; by its tenth year in 1980 the free event ran from traditional Chinese opera to folk dance and modern pop.', clue: 'Find a table with a crowd three deep round it.', source: wiki }, { r: 1.5 });
    k.egg(v(PIG.cx, 0.6, PIG.cz), { id: 'columbuspark-pigeons', title: 'Four hundred and forty two pigeons', year: '1934', text: 'In August 1934 work began to add trees and expand the playground, and on Columbus Day the park reopened before an estimated 15,000 people while the Bronx Homing Pigeon Club released 442 homing pigeons, one for each year since 1492. A statue of Columbus by Emma Stebbins, the sculptor of the Angel of the Waters at Bethesda Fountain, stood in the park from 1934 until 1971.', clue: 'Walk into the pigeons on the plaza.', source: wiki }, { r: 2.4 });
    k.egg(v(-50, 2.4, -37), { id: 'columbuspark-tombs', title: 'Where the Tombs stood', year: '2024', text: 'Across Baxter Street stood the Manhattan Detention Complex at 125 White Street, called the Tombs after the Egyptian Revival Halls of Justice of 1838 by John Haviland. The Art Deco Manhattan House of Detention of 1941 by Harvey Wiley Corbett and Charles B. Meyers became its south tower, reopened in 1983, and a north tower followed in 1990. Demolition of the complex was completed in August 2024 for one of the four borough jails meant to replace Rikers Island, expected to be finished in 2032.', clue: 'The green hoarding across Baxter Street, on the west.', source: { name: 'Manhattan Detention Complex, Wikipedia', url: 'https://en.wikipedia.org/wiki/Manhattan_Detention_Complex' } }, { r: 2.2 });
    k.egg(v(49.6, 7, -20), { id: 'columbuspark-mulberry', title: 'Tenements and fire escapes', year: '1870s', text: 'Mott Street below Canal, Mulberry, Bayard, Pell, Doyers and Worth Streets were settled by Chinese immigrants from the 1870s. Ah Ken is credited as the first Chinese person to settle here permanently, in the 1850s; the Chinese population was about 200 by 1870 and 2,000 by 1882, the year the Chinese Exclusion Act was passed. Chinatown today holds an estimated 90,000 to 100,000 people, the highest concentration of Chinese people in the Western Hemisphere.', clue: 'Look up at the fire escapes across Mulberry Street.', source: { name: 'Chinatown, Manhattan, Wikipedia', url: 'https://en.wikipedia.org/wiki/Chinatown,_Manhattan' } }, { r: 3.2 });

    const floorY = (x: number, z: number) => {
      if (Math.abs(x) < 14 && z < PZ + 7.3 && z > PZ - 7.3) return TY;
      if (Math.abs(x) < 4 && z >= PZ + 7.3 && z < PZ + 7.3 + 3.6) return TY * clamp01((PZ + 7.3 + 3.6 - z) / 3.6);
      return 0;
    };
    return { mounts, spawn: v(1, 3, -6), look: v(0, 4.2, PZ), eye: 3, floorY, bounds: [-49.5, 49.5, -71, 71], style: st };
  },
};
