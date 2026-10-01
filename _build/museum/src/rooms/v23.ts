/* 180: THE HALL NEW YORK LOST. The original Pennsylvania Station of 1910 by McKim, Mead and White,
   pulled down from October 1963, built again as the census gallery of THE CENSUS RELEASE. Not the
   Moynihan Train Hall (that is `penn`, rooms/c.ts): this is the station that is gone.

   Walked front to back in the three states every census token has.
     Entrance: Seventh Avenue, the Doric colonnade in pink granite, the clock over the centre with the
       Day and Night groups beside it, two granite eagles at the door, a row of brass turnstiles as the
       way into the museum, then the shopping arcade and the grand stair down.
     PAINTED, the waiting room: travertine walls, twelve giant columns, a coffered barrel vault, three
       lunettes on each long side and a thermal window at each end; warm shafts of light come through
       the lunettes on the side the real New York sun is on. Salon hung works behind velvet ropes, oak
       benches, and the marble census desk with its open ledger in the middle.
     MOSH, the 1963 seam: the passage to the concourse. The south side is intact, the north side is
       half way through demolition (broken drums, rubble, bare steel, open sky, a wrecking ball swinging
       slowly), joined by a jagged seam of signal noise. Any work in the building moshes when a visitor
       stands still in front of it: colour streams out of the frame across the wall and the floor (one
       InstancedMesh of quads, matrices rewritten in place) and settles back when they walk away.
     DITHER, the concourse at night: riveted steel arches and the glass vaults, freestanding gallery
       walls like platforms, everything in an ordered dither of navy and bone with one warm accent. By
       day the shadow of the glass grid moves with the New York sun; after dark it is the moon.
   FIND MINE: at the census desk a visitor gives a wallet or an ENS name. The hall reads
   api/collectors.json; if their works hang here a spotlight sweeps down the hall to them, and if not the
   hall rehangs itself with their own New Yorkers (the museum's collector hang) and the light sweeps
   along them. Rules kept: no likeness of anyone (Day and Night are draped forms with no faces), no
   lettering beyond the station's name, and the works are only ever called works. Helpers are copied from v14 and v22. */
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
/* the museum, read inside a tick only: the audit and the check scripts run in node with no window */
const museum = (): Museum | undefined => (typeof window === 'undefined' ? undefined : (window as unknown as { __museum?: Museum }).__museum);
const cam = () => museum()?.camera;

/* ---------------- helpers, copied from v14 and v22 (not exported there) ---------------- */
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
function hang(ms: Mount[], x: number, y: number, z: number, r: number, w: number, h: number, style: FrameStyle, d = 4) {
  ms.push({ position: v(x, y, z), rotation: r, target: v(x + Math.sin(r) * d, y, z + Math.cos(r) * d), width: w, height: h, style, wash: true });
}
function still(k: K, pts: { x: number; y: number; z: number; ry: number; sit?: boolean }[], seed: number, colours = [0x1c1e24, 0x2a2e38, 0x3a3230, 0x1a1a1c, 0x4a4a52, 0x2c3a4a, 0x5a4a3a, 0xe0dcd0]) {
  if (!pts.length) return;
  const rnd = X.mulberry(seed), c = new T.Color();
  const o = k.instances(figureGeo(0.19, 0.62, 1.12), new T.MeshStandardMaterial({ roughness: 0.9 }), pts.map((p) => new T.Matrix4().compose(v(p.x, p.y + (p.sit ? 0.12 : 0), p.z), new T.Quaternion().setFromAxisAngle(UP, p.ry), v(1, p.sit ? 0.82 : 1.1 + rnd() * 0.12, 1))));
  pts.forEach((_, i) => o.setColorAt(i, c.set(colours[Math.floor(rnd() * colours.length)])));
  if (o.instanceColor) o.instanceColor.needsUpdate = true;
}
function houses(k: K, x0: number, x1: number, z: number, facing: number, seed: number, p: { hMin?: number; hMax?: number; depth?: number; y?: number } = {}) {
  const { hMin = 14, hMax = 20, depth = 12, y = 0 } = p, rnd = X.mulberry(seed);
  const mats = [k.pbr('psHsBrick' + seed, X.brick(0x7a4032, seed + 2), 0.9), k.pbr('psHsLime' + seed, X.ashlar(0xcdbfa4, seed + 3, 5), 0.35, { normal: 0.4 }), k.pbr('psHsBrick2' + seed, X.brick(0x9a6a4e, seed + 4), 0.9)];
  const win = k.flat(0x1a2128, 0.6, 0.18), trim = k.flat(0xe8e2d4, 0, 0.6), corn = k.flat(0x4a4038, 0.2, 0.6);
  const lit = k.flat(0x3a2a18, 0, 0.6, { emissive: 0xffc070, emissiveIntensity: 0.2 + 1.4 * k.night });
  let x = x0;
  while (x < x1 - 3) {
    const w = Math.min(x1 - x, 9 + Math.floor(rnd() * 6)), h = hMin + rnd() * (hMax - hMin), m = mats[Math.floor(rnd() * mats.length)], cx = x + w / 2;
    k.box(w, h, depth, cx, y + h / 2, z - facing * depth / 2, m);
    const floors = Math.floor((h - 1.5) / 3.3), cols = Math.floor(w / 2.6);
    for (let f = 1; f < floors; f++) for (let c = 0; c < cols; c++) {
      const wx = x + ((c + 0.5) / cols) * w, wy = y + 2.4 + f * 3.3;
      k.box(1.15, 1.9, 0.08, wx, wy, z + facing * 0.03, rnd() < 0.25 ? lit : win);
      k.box(1.35, 0.14, 0.2, wx, wy + 1.02, z + facing * 0.08, trim);
    }
    k.box(w, 0.6, 0.8, cx, y + h - 0.3, z + facing * 0.3, corn);
    x += w;
  }
}
/* cars on a street along x (v14) */
function traffic(k: K, ctx: C, p: { lanes: { z: number; dir: number; n: number; speed?: number }[]; x0: number; x1: number; seed: number; y?: number }) {
  const { lanes, x0, x1, seed, y = 0 } = p, rnd = X.mulberry(seed), span = x1 - x0;
  const cars: { x: number; z: number; dir: number; v: number; len: number }[] = [];
  for (const l of lanes) for (let i = 0; i < l.n; i++) {
    const len = 4.2 + rnd() * 0.8;
    cars.push({ x: x0 + ((i + rnd() * 0.5) / l.n) * span, z: l.z, dir: l.dir, v: l.dir === 0 ? 0 : (l.speed ?? 8) * (0.8 + rnd() * 0.35), len });
  }
  const n = cars.length;
  const prof = (pts: number[][], depth: number) => { const sh = new T.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) sh.lineTo(q[0], q[1]); sh.closePath(); const g = new T.ExtrudeGeometry(sh, { depth, bevelEnabled: false }); g.translate(0, 0, -depth / 2); return g; };
  const bodyG = prof([[-0.5, 0.28], [0.5, 0.28], [0.5, 0.62], [0.47, 0.76], [0.22, 0.84], [-0.3, 0.86], [-0.48, 0.8], [-0.5, 0.64]], 1.8);
  const cabG = prof([[-0.3, 0.84], [0.2, 0.84], [0.06, 1.34], [-0.24, 1.34]], 1.66);
  const body = k.instances(bodyG, new T.MeshStandardMaterial({ roughness: 0.35, metalness: 0.5 }), Array.from({ length: n }, () => new T.Matrix4()));
  const cab = k.instances(cabG, new T.MeshStandardMaterial({ color: 0x1a2026, roughness: 0.15, metalness: 0.7 }), Array.from({ length: n }, () => new T.Matrix4()));
  const wheel = k.instances(new T.CylinderGeometry(0.34, 0.34, 1.9, 10).rotateX(PI / 2), new T.MeshStandardMaterial({ color: 0x151515, roughness: 0.9 }), Array.from({ length: n * 2 }, () => new T.Matrix4()));
  body.frustumCulled = cab.frustumCulled = wheel.frustumCulled = false;
  const pal = [0xf2c318, 0xf2c318, 0x1c1e22, 0xe8e8ea, 0x6a7078, 0x2a3a5a, 0x7a1e22, 0xb8bcc2, 0x1a3a2a];
  const c = new T.Color();
  cars.forEach((_, i) => body.setColorAt(i, c.set(pal[Math.floor(rnd() * pal.length)])));
  if (body.instanceColor) body.instanceColor.needsUpdate = true;
  const m = new T.Matrix4(), q = new T.Quaternion(), pos = new T.Vector3(), sc = new T.Vector3();
  const place = (dt: number) => {
    cars.forEach((a, i) => {
      a.x += a.v * a.dir * Math.min(dt, 0.1);
      if (a.x > x1) a.x -= span; if (a.x < x0) a.x += span;
      q.setFromAxisAngle(UP, a.dir < 0 ? PI : 0);
      pos.set(a.x, y, a.z); sc.set(a.len, 1, 1); m.compose(pos, q, sc); body.setMatrixAt(i, m); cab.setMatrixAt(i, m);
      for (const s of [-1, 1]) { pos.set(a.x + s * a.len * 0.32, y + 0.34, a.z); sc.set(1, 1, 1); q.identity(); m.compose(pos, q, sc); wheel.setMatrixAt(i * 2 + (s > 0 ? 1 : 0), m); }
    });
    body.instanceMatrix.needsUpdate = cab.instanceMatrix.needsUpdate = wheel.instanceMatrix.needsUpdate = true;
  };
  place(0);
  if (!ctx.reduced) k.ticks.push((_t, dt) => place(dt));
}
/* a wall in the x y plane with arched (lunette) and square holes, one extrusion, base at y 0 (v14 holedWall) */
type Hole = { kind: 'arch'; cx: number; y0: number; w: number; h: number } | { kind: 'rect'; cx: number; y0: number; w: number; h: number };
function holedWall(w: number, h: number, depth: number, holes: Hole[], top?: number) {
  const s = new T.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h);
  /* top: a semicircular gable over the wall, the end of a barrel vault */
  if (top) s.absarc(0, h, w / 2, 0, PI, false); else s.lineTo(-w / 2, h);
  s.closePath();
  for (const o of holes) {
    const p = new T.Path();
    if (o.kind === 'rect') { p.moveTo(o.cx - o.w / 2, o.y0); p.lineTo(o.cx + o.w / 2, o.y0); p.lineTo(o.cx + o.w / 2, o.y0 + o.h); p.lineTo(o.cx - o.w / 2, o.y0 + o.h); p.closePath(); }
    else { const a = o.w / 2, cy = o.y0 + o.h - a; p.moveTo(o.cx - a, o.y0); p.lineTo(o.cx - a, cy); p.absarc(o.cx, cy, a, PI, 0, true); p.lineTo(o.cx + a, o.y0); p.closePath(); }
    s.holes.push(p);
  }
  const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 24 });
  g.translate(0, 0, -depth / 2);
  return g;
}
/* one GLB prop many times as instanced meshes: one draw call per part instead of one per copy */
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
/* a half barrel along x (open, both faces), radius r, length len, springing at y 0 */
function barrelX(r: number, len: number, seg = 48) {
  const g = new T.CylinderGeometry(r, r, len, seg, 1, true, PI / 2, PI); g.rotateX(PI / 2); g.rotateY(PI / 2);
  return g;
}
/* a half barrel along z */
function barrelZ(r: number, len: number, seg = 40) {
  const g = new T.CylinderGeometry(r, r, len, seg, 1, true, PI / 2, PI); g.rotateX(PI / 2);
  return g;
}
/* a semicircle window: leaded glass in a thermal (Diocletian) pattern, bright, transparent outside the arch */
function lunetteTex(seed: number, mullions = 2) {
  const W = 512, H = 256;
  return canvasTex(W, H, (g) => {
    const rnd = X.mulberry(seed);
    g.clearRect(0, 0, W, H);
    g.save(); g.beginPath(); g.moveTo(0, H); g.arc(W / 2, H, W / 2 - 2, PI, 0); g.closePath(); g.clip();
    for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) { const b = 228 + rnd() * 27; g.fillStyle = `rgb(${b},${b - 6},${b - 22})`; g.fillRect(x, y, 16, 16); }
    g.strokeStyle = '#4a4034'; g.lineWidth = 2;
    for (let y = 0; y <= H; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    for (let x = 0; x <= W; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    g.lineWidth = 12; g.strokeStyle = '#3a3228';
    for (let i = 1; i <= mullions; i++) { const x = (i / (mullions + 1)) * W; g.beginPath(); g.moveTo(x, H); g.lineTo(x, 0); g.stroke(); }
    g.beginPath(); g.moveTo(0, H - 6); g.lineTo(W, H - 6); g.stroke();
    g.restore();
    g.lineWidth = 14; g.strokeStyle = '#3a3228'; g.beginPath(); g.arc(W / 2, H, W / 2 - 7, PI, 0); g.stroke();
  });
}
/* the coffered vault: deep square coffers with a rosette, shaded as if lit from below */
function cofferTex() {
  return canvasTex(256, 256, (g) => {
    g.fillStyle = '#b9a785'; g.fillRect(0, 0, 256, 256);
    const steps: [number, string][] = [[0, '#cdbb98'], [22, '#a8956f'], [40, '#94815d'], [58, '#7f6c4c']];
    for (const [i, c] of steps) { g.fillStyle = c; g.fillRect(i + 12, i + 12, 232 - 2 * i, 232 - 2 * i); }
    g.fillStyle = '#d8c39a'; g.beginPath();
    for (let q = 0; q < 16; q++) { const a = (q / 16) * PI * 2, r = q % 2 ? 16 : 30; g.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r); }
    g.closePath(); g.fill();
    g.fillStyle = '#efe0bc'; g.beginPath(); g.arc(128, 128, 8, 0, PI * 2); g.fill();
    g.strokeStyle = '#e4d3ae'; g.lineWidth = 4; g.strokeRect(10, 10, 236, 236);
  }, true);
}
/* the ordered dither the concourse is drawn in: a Bayer 4 by 4 threshold between navy and bone,
   with one warm accent where `accent` says so. Nearest filtering keeps the dots crisp up close. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const NAVY = 0x16203a, BONE = 0xe9e0c8, WARM = 0xe0893a;
function ditherTex(size: number, shade: (x: number, y: number) => number, accent?: (x: number, y: number) => boolean, dark = NAVY, light = BONE) {
  const t = canvasTex(size, size, (g) => {
    const id = g.createImageData(size, size), d = id.data;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const th = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
      const c = accent && accent(x, y) ? WARM : shade(x, y) > th ? light : dark;
      const o = (y * size + x) * 4; d[o] = (c >> 16) & 255; d[o + 1] = (c >> 8) & 255; d[o + 2] = c & 255; d[o + 3] = 255;
    }
    g.putImageData(id, 0, 0);
  }, true);
  t.magFilter = T.NearestFilter;
  return t;
}
/* a material projected in world space by the kit's batch, `density` tiles per metre */
function worldMat(map: T.Texture, density: number, p: Partial<T.MeshStandardMaterialParameters> = {}) {
  const m = new T.MeshStandardMaterial({ map, roughness: 0.85, metalness: 0, ...p });
  m.userData.density = density;
  return m;
}
const noise = (x: number, y: number, s: number) => { const n = Math.sin(x * 12.9898 + y * 78.233 + s * 37.719) * 43758.5453; return n - Math.floor(n); };
const vnoise = (x: number, y: number, s: number) => {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), w = yf * yf * (3 - 2 * yf);
  const a = noise(xi, yi, s), b = noise(xi + 1, yi, s), c = noise(xi, yi + 1, s), d = noise(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
};
/* the direction to the sun over New York for a fractional hour, in this room's frame:
   +z is east (Seventh Avenue), -z west (Eighth Avenue), -x south (31st Street), +x north */
function sunDir(h: number) {
  const s = (h - 6.6) / 11.4;
  if (s <= 0 || s >= 1) return { d: v(0.35, 0.8, -0.48).normalize(), day: 0 };
  const el = Math.sin(PI * s) * 0.72 + 0.04, a = PI * s;
  return { d: v(-Math.sin(a) * Math.cos(el), Math.sin(el), Math.cos(a) * Math.cos(el)).normalize(), day: smooth(Math.sin(PI * s) * 4) };
}
/* the New York wall clock, read through Intl and never from Date.now() raw */
const nyFmt = typeof Intl !== 'undefined' ? new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) : null;
function nyClock(fallbackHour: number) {
  try {
    const o: Record<string, string> = {};
    for (const p of nyFmt!.formatToParts(new Date())) o[p.type] = p.value;
    return { h: Number(o.hour) % 24, m: Number(o.minute), s: Number(o.second) };
  } catch { return { h: Math.floor(fallbackHour), m: Math.floor((fallbackHour % 1) * 60), s: 0 }; }
}

/* ================================================================== */
/* ---------------- 180 THE HALL NEW YORK LOST ---------------- */
export const pennstation: RoomDef = {
  id: 'pennstation',
  name: 'The hall New York lost',
  area: 'PENNSYLVANIA STATION, 1910 / THE CENSUS HALL',
  mood: 'Travertine, steel and glass, and the seam where it came down',
  color: '#c9a86a',
  daylit: true,
  description: 'The Pennsylvania Station of 1910, the station New York pulled down from October 1963, raised again as the census hall of the New Yorkers. You come in off Seventh Avenue through the Doric colonnade and a row of brass turnstiles, down the arcade and the grand stair into the travertine waiting room under its coffered vault, where light falls through the lunettes on the side the real sun is on. Past the census desk the hall breaks: one side intact, the other half demolished under a swinging ball, and beyond it the steel and glass concourse at night, drawn in dots. Stand still before any work and it comes apart into colour; give your wallet or name at the desk and a light finds yours.',
  signatures: 'The Seventh Avenue colonnade in pink granite with the clock and the Day and Night groups over the door, two granite eagles, brass turnstiles, the shopping arcade with its newsstand and shoeshine stand, the grand stair, the travertine waiting room with twelve giant columns, a coffered barrel vault, six lunettes and two thermal windows, velvet ropes and oak benches, the marble census desk with its open ledger, the 1963 seam with broken column drums, rubble, bare steel and a wrecking ball, and the dithered steel and glass concourse with freestanding gallery walls and a baggage wagon.',
  build(k, ctx) {
    const hour0 = typeof k.o.hour === 'number' && Number.isFinite(k.o.hour) ? k.o.hour : 15;
    const sun0 = sunDir(hour0);
    k.sky({ top: 0x6a98d0, horizon: 0xe2dccc, ground: 0x6e6a60, fog: 0.0016, sun: { az: 2.1, el: 0.5, color: 0xfff0d8, size: 8 }, haze: 0.4, env: 0.7 });
    k.hemi(0xf0e6d4, 0x6a6050, 1.0);
    const sunL = k.sun(0xfff0d8, 2.4, sun0.d.x * 120, sun0.d.y * 120 + 2, -79 + sun0.d.z * 120, true, 70);
    sunL.target?.position?.set(0, 0, -79);   /* guarded: the audit hands rooms a stub light */

    const S = 3;                                     /* street level; the waiting room floor is 0 */
    const st: FrameStyle = 'gilt';
    const mounts: Mount[] = [];
    const bulbs: { x: number; y: number; z: number }[] = [];

    /* ---- materials ---- */
    const trav = k.pbr('psTrav', X.ashlar(0xd8c6a0, 1801, 4), 0.22, { normal: 0.35, roughness: 0.8 });
    const travD = k.pbr('psTravD', X.ashlar(0xd8c6a0, 1801, 4), 0.22, { normal: 0.35, roughness: 0.8, side: T.DoubleSide });
    const travPlain = k.pbr('psTravP', X.plaster(0xd6c49e, 1802), 0.2, { roughness: 0.85 });
    const travDark = k.pbr('psTravK', X.ashlar(0xb9a47c, 1803, 3), 0.3, { normal: 0.4, roughness: 0.85 });
    const granite = k.pbr('psGran', X.ashlar(0xc4a294, 1804, 7), 0.13, { normal: 0.25, roughness: 0.7 });
    const graniteS = k.pbr('psGranS', X.plaster(0xc6a596, 1830), 0.3, { roughness: 0.6 });
    const graniteDk = k.pbr('psGranK', X.ashlar(0xa98576, 1805, 3), 0.3, { normal: 0.4, roughness: 0.75 });
    const marbleF = k.pbr('psFloor', X.marble(0xcdbb96, 0x8a7a5e, 1806), 0.16, { roughness: 0.32 });
    const walk = k.pbr('psWalk', X.pavers(0x9a958a, 1807), 0.5), asph = k.pbr('psAsph', X.asphalt(), 0.3), curb = k.flat(0x8a8680, 0, 0.8), line = k.flat(0xe8e4d8, 0, 0.8);
    const oak = k.pbr('psOak', X.planks(0x7a5230, 5, 1808), 0.9, { roughness: 0.55 }), oakDk = k.flat(0x3e2616, 0, 0.5);
    const brass = k.flat(0xc8a050, 1, 0.3), bronze = k.flat(0x6e5230, 0.9, 0.4), iron = k.flat(0x1c1c1e, 0.6, 0.5), velvet = k.flat(0x7a1420, 0, 0.75);
    const shopGlass = k.flat(0x2a3038, 0.4, 0.15, { emissive: 0xffd8a0, emissiveIntensity: 0.12 + 0.25 * k.night });
    const vaultM = new T.MeshStandardMaterial({ map: cofferTex(), roughness: 0.85, side: T.BackSide });
    vaultM.map!.repeat.set(18, 30);
    const winM = new T.MeshBasicMaterial({ map: lunetteTex(1809), color: new T.Color(0xfff4de).lerp(new T.Color(0x3a4a70), k.night * 0.85), transparent: true, alphaTest: 0.1, side: T.DoubleSide });
    const winEnd = new T.MeshBasicMaterial({ map: lunetteTex(1810, 2), color: new T.Color(0xfff4de).lerp(new T.Color(0x3a4a70), k.night * 0.85), transparent: true, alphaTest: 0.1, side: T.DoubleSide });

    /* ================= ENTRANCE: Seventh Avenue and the colonnade ================= */
    /* the street level: one platform from the arcade to the far pavement */
    k.box(130, S, 32, 0, S / 2 - 0.02, 20, walk);
    k.box(130, 0.2, 13, 0, S - 0.12, 42, asph);
    for (const z of [35.5, 48.5]) k.box(130, 0.2, 0.3, 0, S + 0.02, z, curb);
    for (let x = -62; x < 62; x += 3.4) for (const z of [39.4, 43.6]) k.box(1.8, 0.012, 0.12, x, S + 0.01, z, line);
    k.box(130, 0.2, 6, 0, S - 0.1, 51.5, walk);
    houses(k, -66, 66, 54.5, -1, 1811, { hMin: 22, hMax: 40, y: S });
    k.skyline({ z: 120, count: 30, spacing: 8, seed: 1812, base: S, lit: 0.22, x: 0, scale: 1.4 });
    k.skyline({ z: -190, count: 30, spacing: 8, seed: 1813, base: 0, lit: 0.22, x: 0, scale: 1.3 });
    /* Seventh Avenue runs one way, south (toward -x) */
    traffic(k, ctx, { lanes: [{ z: 38.2, dir: -1, n: 5, speed: 8 }, { z: 41.6, dir: -1, n: 4, speed: 9 }, { z: 45, dir: -1, n: 4, speed: 7 }], x0: -64, x1: 64, seed: 1814, y: S });
    k.crowd([v(-60, S, 33.6), v(60, S, 33.6)], 10, { seed: 1815, spread: 1.8, speed: 1.1, animate: !ctx.reduced });
    k.crowd([v(-60, S, 50.2), v(60, S, 50.2)], 6, { seed: 1816, spread: 1.4, speed: 1.0, animate: !ctx.reduced });
    for (const x of [-30, -12, 12, 30]) { k.cyl(0.09, 5, x, S + 2.5, 35, iron, 0.12, 8); k.sphere(0.28, x, S + 5.1, 35, k.glow(0xffe2b0), 10); if (k.night > 0.4) k.point(x, S + 4.8, 35, 0xffd7a0, 30, 16); k.keepOut.push({ x, z: 35, r: 0.4 }); }

    /* the colonnade: unfluted Roman Doric columns in pink granite along the whole Seventh Avenue front */
    const CZ = 27.4, CH = 10.4;
    const colXs: number[] = [];
    for (let x = -42; x <= 42.01; x += 4.2) colXs.push(x);
    for (const x of colXs) {
      k.lathe([[0.86, 0], [0.86, 0.12], [0.8, 0.24], [0.74, 0.4], [0.64, CH - 0.7], [0.68, CH - 0.62]], x, S, CZ, graniteS, 20);
      k.lathe([[0.66, 0], [0.92, 0.3], [0.98, 0.42]], x, S + CH - 0.62, CZ, graniteDk, 20);
      k.box(2.0, 0.24, 2.0, x, S + CH - 0.08, CZ, graniteDk);
      k.keepOut.push({ x, z: CZ, r: 1.0 });
    }
    k.box(88, 1.6, 2.6, 0, S + CH + 0.8, CZ, granite);                       /* architrave and frieze */
    for (let x = -43; x <= 43; x += 2.1) k.box(0.7, 0.9, 0.12, x, S + CH + 0.9, CZ + 1.32, graniteDk);   /* triglyphs */
    k.box(89, 0.5, 3.4, 0, S + CH + 1.85, CZ + 0.1, graniteDk);              /* cornice */
    k.box(88, 0.5, 8, 0, S + CH + 1.3, 23.6, travPlain);                    /* coffered roof of the portico */
    k.box(88, 1.6, 2.2, 0, S + CH + 2.9, CZ - 0.2, granite);                 /* attic */
    /* the facade wall behind the colonnade, the door to the arcade in the middle */
    k.mesh(holedWall(88, 16, 0.8, [{ kind: 'rect', cx: 0, y0: 0, w: 14, h: 12 }, ...[-30, -18, 18, 30].map((cx) => ({ kind: 'arch' as const, cx, y0: 2.5, w: 3.4, h: 6.5 }))]), granite, 0, S, 20);
    for (const cx of [-30, -18, 18, 30]) { k.plane(3.4, 6.5, cx, S + 5.75, 19.7, shopGlass); }
    k.block(-46, -7.2, 19.4, 20.6); k.block(7.2, 46, 19.4, 20.6);
    k.block(-46, -44, 20, 30); k.block(44, 46, 20, 30);
    /* the central pavilion over the door: attic, clock, the Day and Night groups, small eagles */
    const AY = S + CH + 4;
    k.box(30, 9, 8, 0, AY + 4.5, 23.6, granite);
    k.box(31, 0.6, 8.6, 0, AY + 9.2, 23.6, graniteDk);
    k.box(30.4, 0.5, 8.4, 0, AY + 0.25, 23.6, graniteDk);
    k.sign('PENNSYLVANIA STATION', 16, 1.2, 0, AY + 1.6, 27.65, 'transparent', '#5a3a30', 60);
    /* the clock: 61 feet over the pavement, faces 7 feet across; hands keep New York time */
    const clockY = S + 18.6, clockZ = 27.75;
    k.torus(1.18, 0.16, 0, clockY, clockZ, bronze, 40);
    const dial = canvasTex(256, 256, (g) => {
      g.fillStyle = '#f2ead6'; g.beginPath(); g.arc(128, 128, 124, 0, PI * 2); g.fill();
      g.fillStyle = '#2a2420';
      for (let i = 0; i < 60; i++) { const a = (i / 60) * PI * 2, r0 = i % 5 ? 112 : 100; g.save(); g.translate(128, 128); g.rotate(a); g.fillRect(-(i % 5 ? 1.5 : 4), -122, i % 5 ? 3 : 8, 122 - r0); g.restore(); }
    });
    { const g = new T.CircleGeometry(1.08, 40); k.mesh(g, new T.MeshBasicMaterial({ map: dial, color: k.night > 0.5 ? 0xffe8b8 : 0xffffff }), 0, clockY, clockZ + 0.02, true); }
    const handM = new T.MeshBasicMaterial({ color: 0x1a1612 });
    const hourH = new T.Mesh(new T.BoxGeometry(0.1, 0.62, 0.04).translate(0, 0.26, 0), handM), minH = new T.Mesh(new T.BoxGeometry(0.07, 0.92, 0.04).translate(0, 0.4, 0), handM);
    hourH.position.set(0, clockY, clockZ + 0.06); minH.position.set(0, clockY, clockZ + 0.09); k.add(hourH); k.add(minH);
    /* Day and Night: two draped seated figures in stone, no faces, flanking the clock */
    const stoneFig = k.flat(0xd2c2b0, 0, 0.85);
    for (const s of [-1, 1]) {
      const x = s * 7.6, y = AY + 9.5;
      k.lathe([[1.1, 0], [1.0, 0.5], [0.7, 1.4], [0.5, 2.2], [0.42, 2.7], [0.2, 2.95], [0, 3.0]], x, y, 25.4, stoneFig, 14);
      k.sphere(0.34, x, y + 3.25, 25.5, stoneFig, 12);
      const arm = k.box(0.32, 1.6, 0.32, x - s * 0.5, y + 2.2, 25.9, stoneFig); arm.rotation.z = s * 0.7;
      k.box(1.6, 0.9, 1.4, x + s * 1.1, y + 0.45, 25.2, stoneFig);              /* the drape over the plinth */
    }
    k.box(10, 4.6, 1.6, 0, AY + 11.8, 23.6, granite); k.box(10.6, 0.5, 2, 0, AY + 14.2, 23.6, graniteDk);
    /* the two granite eagles at the door, where two stand today on the Seventh Avenue side */
    const eagleSpots: [number, number][] = [[-9.4, 30.4], [9.4, 30.4]];
    for (const [x, z] of eagleSpots) { k.box(1.9, 0.4, 1.9, x, S + 0.2, z, graniteDk); k.prop('penn_eagle', x, S + 0.4, z, { height: 3.0, rotY: x < 0 ? 0.35 : -0.35 }); k.block(x - 1.1, x + 1.1, z - 1.1, z + 1.1); }
    /* the brass turnstiles: the way into the museum. Each set of arms turns as a visitor passes */
    const TZ = 22.6, tsX: number[] = [];
    for (let i = 0; i <= 8; i++) tsX.push(-6.4 + i * 1.6);
    tsX.forEach((x) => {
      k.box(0.34, 1.0, 0.9, x, S + 0.5, TZ, brass);
      k.keepOut.push({ x, z: TZ, r: 0.32 }, { x, z: TZ - 0.35, r: 0.25 }, { x, z: TZ + 0.35, r: 0.25 });
    });
    k.box(14, 0.06, 2.2, 0, S + 0.03, TZ, brass);
    {
      const gx = tsX.slice(0, 8).map((x) => x + 0.8), spin = gx.map(() => 0), ang = gx.map((_, i) => i * 0.7);
      let parts: T.InstancedMesh[] = [], locals: T.Matrix4[] = [];
      propMany(k, 'penn_turnstile', gx.map((x) => ({ x, y: S, z: TZ })), 1.15, (ims) => {
        parts = ims; locals = ims.map((im) => { const m = new T.Matrix4(); im.getMatrixAt(0, m); return m.premultiply(new T.Matrix4().makeTranslation(-gx[0], -S, -TZ)); });
        for (const im of ims) im.frustumCulled = false;
      });
      const m = new T.Matrix4(), r = new T.Matrix4();
      if (!ctx.reduced) k.ticks.push((_t, dt) => {
        const c = cam(); if (!c || !parts.length) return;
        let moved = false;
        gx.forEach((x, i) => {
          const near = Math.hypot(c.position.x - x, c.position.z - TZ) < 1.3;
          spin[i] = near ? Math.min(3.5, spin[i] + dt * 8) : spin[i] * Math.pow(0.15, dt);
          if (spin[i] < 0.01) return;
          ang[i] += spin[i] * dt; moved = true;
          r.makeRotationY(ang[i]);
          parts.forEach((im, p) => { m.makeTranslation(x, S, TZ).multiply(r).multiply(locals[p]); im.setMatrixAt(i, m); im.instanceMatrix.needsUpdate = true; });
        });
        void moved;
      });
    }

    /* ================= THE ARCADE, z 20 to 4, and the grand stair ================= */
    const AX = 7;
    for (const s of [-1, 1]) {
      k.box(0.6, 12, 16.4, s * (AX + 0.3), S + 6, 12, trav);
      for (const z of [8, 16]) {                                               /* shop fronts, no names */
        k.box(0.12, 4.2, 4.6, s * (AX - 0.02), S + 2.1, z, oakDk);
        k.plane(4.0, 3.2, s * (AX - 0.1), S + 2.2, z, shopGlass, -s * PI / 2);
        k.box(0.2, 0.7, 4.8, s * (AX - 0.1), S + 4.6, z, oak);
      }
      k.block(s > 0 ? AX - 0.1 : -AX - 1, s > 0 ? AX + 1 : -AX + 0.1, 4, 20);
    }
    k.box(14.6, 0.5, 16.4, 0, S + 12.25, 12, k.pbr('psArcCeil', X.plaster(0xd8c8a6, 1817), 0.25));
    for (let z = 5; z <= 19; z += 2.8) k.box(14, 0.6, 0.4, 0, S + 11.7, z, travDark);
    for (const z of [8, 16]) { k.cyl(0.02, 2, 0, S + 10.6, z, bronze); k.sphere(0.45, 0, S + 9.5, z, k.glow(0xffe6b8), 14); k.point(0, S + 9, z, 0xffdcaa, 24, 16); }
    hang(mounts, -AX + 0.05, S + 2.9, 12, PI / 2, 2.6, 2.2, st, 3.6);
    hang(mounts, AX - 0.05, S + 2.9, 12, -PI / 2, 2.6, 2.2, st, 3.6);
    k.prop('penn_newsstand', -5.3, S, 18.2, { height: 2.6, rotY: PI / 2, keepOut: 1.2 });
    k.prop('penn_shoeshine', 5.6, S, 5.6, { height: 1.7, rotY: -PI / 2, keepOut: 1.1 });
    /* the grand stair, from the arcade down into the waiting room */
    const SZ0 = 4, SZ1 = -4.4, SW = 7;
    { const N = 18; for (let i = 0; i < N; i++) { const z = SZ0 - ((i + 0.5) / N) * (SZ0 - SZ1), y = S * (1 - (i + 1) / N); k.box(SW * 2, y + 0.02, (SZ0 - SZ1) / N + 0.02, 0, y / 2, z, i % 2 ? marbleF : travPlain); } }
    for (const s of [-1, 1]) {
      k.box(0.5, 1.1, Math.hypot(SZ0 - SZ1, S), s * (SW + 0.25), S / 2 + 0.55, (SZ0 + SZ1) / 2, travDark).rotation.x = -Math.atan2(S, SZ0 - SZ1);
      k.box(0.6, S, SZ0 - SZ1, s * (SW + 0.3), S / 2, (SZ0 + SZ1) / 2, trav);
      k.block(s > 0 ? SW - 0.05 : -SW - 0.8, s > 0 ? SW + 0.8 : -SW + 0.05, SZ1, SZ0);
      k.lamp(s * (SW + 0.3), SZ1 + 0.3, 4.2, bronze, 0xffd8a0, 10);
    }

    /* ================= PAINTED: the waiting room, x -48 to 48, z 4 to -29 ================= */
    const WX = 48, WZ0 = 4, WZ1 = -29, WC = (WZ0 + WZ1) / 2, WR = (WZ0 - WZ1) / 2, SPR = 28;
    k.box(WX * 2, 0.2, WZ0 - WZ1, 0, -0.1, WC, marbleF);
    for (let x = -44; x <= 44; x += 8) k.box(0.18, 0.012, WZ0 - WZ1 - 1, x, 0.006, WC, travDark);
    /* long walls: travertine, lunettes, the openings to the arcade and to the seam */
    const lunX = [-32, 0, 32], LR = 11;
    const longHoles = (open: Hole): Hole[] => [open, ...lunX.map((cx) => ({ kind: 'arch' as const, cx, y0: 16.5, w: LR * 2, h: LR }))];
    k.mesh(holedWall(WX * 2, SPR, 1, longHoles({ kind: 'rect', cx: 0, y0: 0, w: 14, h: S + 12 })), trav, 0, 0, WZ0 + 0.5);
    k.mesh(holedWall(WX * 2, SPR, 1, longHoles({ kind: 'rect', cx: 0, y0: 0, w: 20, h: 14 })), trav, 0, 0, WZ1 - 0.5);
    for (const z of [WZ0 + 0.3, WZ1 - 0.3]) for (const cx of lunX) k.plane(LR * 2, LR, cx, 16.5 + LR / 2, z, winM);
    /* the end walls with the barrel's semicircle over them, each a great thermal window */
    for (const s of [-1, 1]) {
      const o = k.mesh(holedWall(WZ0 - WZ1, SPR, 1, [{ kind: 'arch', cx: 0, y0: SPR + 0.6, w: 26, h: 13 }], 1), trav, s * (WX + 0.5), 0, WC);
      o.rotation.y = PI / 2;
      k.plane(26, 13, s * (WX + 0.3), SPR + 0.6 + 6.5, WC, winEnd, PI / 2);
    }
    k.block(-WX - 2, -7.1, WZ0 - 0.2, WZ0 + 1.2); k.block(7.1, WX + 2, WZ0 - 0.2, WZ0 + 1.2);
    k.block(-WX - 2, -10.1, WZ1 - 1.2, WZ1 + 0.2); k.block(10.1, WX + 2, WZ1 - 1.2, WZ1 + 0.2);
    k.block(-WX - 2, -WX + 0.2, WZ1, WZ0); k.block(WX - 0.2, WX + 2, WZ1, WZ0);
    /* bands: a dado, the entablature at 21, the cornice at the springing */
    for (const z of [WZ0 - 0.05, WZ1 + 0.05]) {
      const d = z > WC ? -1 : 1;
      for (const [a, b] of [[-WX, z > WC ? -7 : -10], [z > WC ? 7 : 10, WX]]) k.box(b - a, 0.5, 0.3, (a + b) / 2, 1.0, z + d * 0.1, travDark);
      for (const [y, h, dd] of [[21, 1.8, 0.9], [SPR - 0.4, 0.8, 1.3]] as number[][]) k.box(WX * 2, h, dd, 0, y, z + d * dd / 2, travDark);
    }
    for (const s of [-1, 1]) for (const [y, h, dd] of [[21, 1.8, 0.9], [SPR - 0.4, 0.8, 1.3]] as number[][]) k.box(dd, h, WZ0 - WZ1, s * (WX - dd / 2), y, WC, travDark);
    /* the coffered barrel vault */
    k.mesh(barrelX(WR + 0.4, WX * 2 + 1.2, 56), vaultM, 0, SPR, WC);
    k.mesh(barrelX(WR + 1.2, WX * 2 + 2, 40), k.flat(0x8a8478, 0.2, 0.8), 0, SPR, WC);   /* the roof over it, seen from the street */
    for (let x = -44; x <= 44.1; x += 22) { const pts = Array.from({ length: 33 }, (_, i) => { const a = (i / 32) * PI; return v(x, SPR + Math.sin(a) * (WR + 0.1), WC + Math.cos(a) * (WR + 0.1)); }); k.curve(pts, 0.5, travDark, 64); }
    /* twelve giant columns on pedestals, between the lunettes; a capital each */
    const colAt: [number, number][] = [];
    for (const x of [-45.6, -18.4, -13.6, 13.6, 18.4, 45.6]) colAt.push([x, WZ0 - 1.6], [x, WZ1 + 1.6]);
    for (const [x, z] of colAt) {
      k.box(2.7, 3.2, 2.7, x, 1.6, z, travDark); k.box(2.9, 0.3, 2.9, x, 3.35, z, travDark);
      k.lathe([[1.05, 0], [1.05, 0.3], [0.98, 0.5], [0.86, 14.4], [0.92, 14.6]], x, 3.5, z, trav, 22);
      k.box(2.5, 0.5, 2.5, x, 20.35, z, travDark);
      k.block(x - 1.5, x + 1.5, z - 1.5, z + 1.5);
    }
    propMany(k, 'penn_capital', colAt.map(([x, z]) => ({ x, y: 18.1, z })), 2.1);
    /* the works under the lunettes, behind velvet ropes; a third set on the north end wall */
    const WH = 4.6, WW = 6.4;
    for (const x of [-37.5, -26.5, 26.5, 37.5]) { hang(mounts, x, 4.1, WZ0 - 0.05, PI, WW, WH, st); hang(mounts, x, 4.1, WZ1 + 0.05, 0, WW, WH, st); }
    for (const z of [-4.5, WC, -20.5]) hang(mounts, WX - 0.05, 4.4, z, -PI / 2, 5.6, 4.2, st);
    const postsAt: [number, number][] = [];
    const rope = (a: T.Vector3, b: T.Vector3) => { const m = a.clone().lerp(b, 0.5); m.y -= 0.22; k.curve([a, m, b], 0.03, velvet, 10); };
    for (const z of [WZ0 - 2.2, WZ1 + 2.2]) for (const [a, b] of [[-43, -21], [21, 43]]) {
      const n = 5; for (let i = 0; i <= n; i++) postsAt.push([a + (i / n) * (b - a), z]);
      for (let i = 0; i < n; i++) rope(v(a + (i / n) * (b - a), 0.92, z), v(a + ((i + 1) / n) * (b - a), 0.92, z));
      k.block(a, b, Math.min(z, z > WC ? WZ0 : WZ1), Math.max(z, z > WC ? WZ0 : WZ1));
    }
    for (let i = 0; i <= 4; i++) postsAt.push([WX - 2.2, -1.5 - i * 5.75]);
    k.block(WX - 2.3, WX, -24.5, -0.5);
    for (const [x, z] of postsAt) { k.lathe([[0.2, 0], [0.2, 0.05], [0.05, 0.1], [0.04, 0.9], [0.07, 0.95], [0, 1.05]], x, 0, z, brass, 10); }
    for (let i = 0; i < 4; i++) { const z0 = -1.5 - i * 5.75, z1 = z0 - 5.75; rope(v(WX - 2.2, 0.92, z0), v(WX - 2.2, 0.92, z1)); }
    /* oak benches in rows across the hall */
    const seated: { x: number; y: number; z: number; ry: number; sit?: boolean }[] = [];
    const rnd = X.mulberry(1818);
    for (const x of [-34, -26, 26, 34]) for (const z of [-7.5, -17.5]) for (const s of [-1, 1]) {
      const bz = z + s * 1.1;
      k.box(5.4, 0.08, 0.6, x, 0.48, bz, oak); k.box(5.4, 0.7, 0.08, x, 0.86, bz + s * 0.3, oak);
      for (const dx of [-2.5, 0, 2.5]) k.box(0.12, 0.48, 0.56, x + dx, 0.24, bz, oakDk);
      for (let i = 0; i < 6; i++) if (rnd() < 0.3) seated.push({ x: x - 2.2 + i * 0.88, y: 0.36, z: bz, ry: s > 0 ? PI : 0, sit: true });
      k.block(x - 2.8, x + 2.8, bz - 0.45, bz + 0.45);
    }
    still(k, seated, 1819);
    k.prop('penn_luggage', -30, 0, -12.4, { height: 1.0, rotY: 0.4, keepOut: 0.8 });
    k.prop('penn_luggage', 31, 0, -12.6, { height: 1.0, rotY: -1.2, keepOut: 0.8 });
    /* travellers crossing the hall, from the stair to the concourse */
    k.crowd([v(-3, 0, -5), v(-6, 0, -12), v(-4, 0, -20), v(-2, 0, -28)], 9, { seed: 1820, spread: 3, speed: 0.9, animate: !ctx.reduced });
    k.crowd([v(44, 0, -12), v(16, 0, -12.5), v(-16, 0, -12.5), v(-44, 0, -12)], 8, { seed: 1821, spread: 4, speed: 0.8, animate: !ctx.reduced });
    /* the census desk with its open ledger, four standard lamps, stanchions round it */
    const DX = 0, DZ = WC;
    k.prop('penn_census_desk', DX, 0, DZ, { height: 1.25 });
    k.block(DX - 2.1, DX + 2.1, DZ - 0.75, DZ + 0.75);
    const lampAt = [[-3.4, -2.2], [3.4, -2.2], [-3.4, 2.2], [3.4, 2.2]].map(([x, z]) => ({ x: DX + x, y: 0, z: DZ + z }));
    propMany(k, 'penn_lamp', lampAt, 4.2);
    for (const p of lampAt) k.keepOut.push({ x: p.x, z: p.z, r: 0.5 });
    const stanAt = [[-2.6, 1.4], [2.6, 1.4], [-2.6, -1.4], [2.6, -1.4]].map(([x, z]) => ({ x: DX + x, y: 0, z: DZ + z }));
    propMany(k, 'penn_stanchion', stanAt, 1.05);
    for (const p of stanAt) k.keepOut.push({ x: p.x, z: p.z, r: 0.3 });
    k.point(DX, 6, DZ, 0xffdcaa, 30, 18);
    /* warm interior light; daylight comes through the windows below */
    for (const x of [-32, 0, 32]) k.point(x, 12, WC, 0xffe2b8, 60 + 40 * k.night, 40, 1.6);
    for (const x of [-26.5, 26.5]) for (const z of [WZ0 - 3, WZ1 + 3]) k.point(x, 6.5, z, 0xffe0b0, 14, 12);
    /* the census wall, salon hung on the south end wall under the thermal window */
    k.censusWall({ x: -WX + 0.08, y: 6.6, z: WC, rotY: PI / 2, cols: 20, rows: 8, tile: 1.0, gap: 0.08, start: ctx.wallStart(1750, 160), pieces: ctx.all, backing: travDark });
    k.block(-WX, -WX + 2.2, WC - 11, WC + 11);
    for (let i = 0; i < 6; i++) { const z = WC - 10 + i * 4; k.lathe([[0.2, 0], [0.05, 0.1], [0.04, 0.9], [0, 1.05]], -WX + 2.2, 0, z, brass, 10); if (i < 5) rope(v(-WX + 2.2, 0.92, z), v(-WX + 2.2, 0.92, z + 4)); }

    /* sun shafts: three striated slabs under each lunette on the side the sun is on; a pool where they land */
    type Shaft = { win: T.Vector3; facing: T.Vector3 };
    const shafts: Shaft[] = [];
    const winCentres: [T.Vector3, T.Vector3][] = [];
    for (const cx of lunX) { winCentres.push([v(cx, 16.5 + LR * 0.42, WZ0), v(0, 0, -1)], [v(cx, 16.5 + LR * 0.42, WZ1), v(0, 0, 1)]); }
    winCentres.push([v(-WX, SPR + 5.5, WC), v(1, 0, 0)], [v(WX, SPR + 5.5, WC), v(-1, 0, 0)]);
    for (const [win, facing] of winCentres) shafts.push({ win, facing });
    /* additive light: the instance colour is the brightness, so one draw call carries every shaft */
    const slabs = k.instances(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false }), Array.from({ length: shafts.length * 3 }, () => new T.Matrix4().makeScale(0, 0, 0)));
    const pools = k.instances(new T.PlaneGeometry(1, 1).rotateX(-PI / 2), new T.MeshBasicMaterial({ map: X.pool(), transparent: true, depthWrite: false, blending: T.AdditiveBlending }), Array.from({ length: shafts.length }, () => new T.Matrix4().makeScale(0, 0, 0)));
    slabs.frustumCulled = pools.frustumCulled = false; slabs.renderOrder = pools.renderOrder = 3;
    const warm = new T.Color(0xffd8a0), cc = new T.Color(), zero = new T.Matrix4().makeScale(0, 0, 0), sm = new T.Matrix4(), sq = new T.Quaternion();
    const placeShafts = (h: number) => {
      const { d, day } = sunDir(h);
      const ray = d.clone().negate();
      shafts.forEach((sh, w) => {
        const f = sh.facing.x * ray.x + sh.facing.z * ray.z;
        const on = day * clamp01(f * 2.2) * (1 - k.night);
        const vis = on > 0.02 && ray.y < -0.05;
        const L = vis ? Math.min(70, (sh.win.y - 0.05) / -ray.y) : 0;
        sq.setFromUnitVectors(UP, ray.clone().negate());
        for (let i = 0; i < 3; i++) {
          const j = w * 3 + i;
          if (!vis) { slabs.setMatrixAt(j, zero); continue; }
          const side = new T.Vector3(sh.facing.z, 0, -sh.facing.x).multiplyScalar((i - 1) * 6.2);
          const pos = sh.win.clone().add(side).addScaledVector(ray, L / 2);
          sm.compose(pos, sq, v(i === 1 ? 4.6 : 2.8, L, 0.25 + i * 0.15)); slabs.setMatrixAt(j, sm);
          slabs.setColorAt(j, cc.copy(warm).multiplyScalar(0.032 * on));
        }
        if (!vis) { pools.setMatrixAt(w, zero); return; }
        const hit = sh.win.clone().addScaledVector(ray, L); hit.x = Math.max(-WX + 3, Math.min(WX - 3, hit.x)); hit.z = Math.max(WZ1 + 2, Math.min(WZ0 - 2, hit.z));
        sm.compose(v(hit.x, 0.03, hit.z), new T.Quaternion(), v(19, 1, 9)); pools.setMatrixAt(w, sm); pools.setColorAt(w, cc.copy(warm).multiplyScalar(0.4 * on));
      });
      slabs.instanceMatrix.needsUpdate = pools.instanceMatrix.needsUpdate = true;
      if (slabs.instanceColor) slabs.instanceColor.needsUpdate = true;
      if (pools.instanceColor) pools.instanceColor.needsUpdate = true;
    };
    placeShafts(hour0);

    /* ================= MOSH: the 1963 seam, z -29 to -47 ================= */
    const MZ0 = WZ1 - 1, MZ1 = -47, MW = 16;
    k.box(MW * 2, 0.2, MZ0 - MZ1, 0, -0.1, (MZ0 + MZ1) / 2, marbleF);
    /* the intact south side: travertine wall with three works, and half the vault over it */
    k.box(0.8, 20, MZ0 - MZ1, -MW - 0.4, 10, (MZ0 + MZ1) / 2, trav);
    k.block(-MW - 2, -MW + 0.1, MZ1, MZ0);
    for (const z of [-34, -39, -44]) hang(mounts, -MW + 0.05, 3.6, z, PI / 2, 3.4, 3.0, st, 3.8);
    for (const z of [-31.2, -36.5, -41.5, -46.5]) { k.box(1.4, 20, 1.4, -MW + 0.3, 10, z, travDark); }
    k.box(MW + 1, 1.2, MZ0 - MZ1, -MW / 2, 19.4, (MZ0 + MZ1) / 2, travDark);
    { const g = new T.CylinderGeometry(9, 9, MZ0 - MZ1, 24, 1, true, PI, PI / 2); g.rotateX(PI / 2); k.mesh(g, vaultM, -MW + 9, 20, (MZ0 + MZ1) / 2); }
    k.point(-10, 8, -38, 0xffe0b0, 24, 18);
    /* the north side coming down: a jagged wall, bare steel, broken drums, rubble, open sky */
    const jag = X.mulberry(1822);
    for (let z = MZ0; z > MZ1; z -= 1.5) { const h = 2 + jag() * (z < -40 ? 7 : 13); k.box(0.9, h, 1.55, MW + 0.45, h / 2, z - 0.75, trav); }
    k.block(MW - 0.2, MW + 2, MZ1, MZ0);
    const steelM = k.pbr('psSteelRaw', X.steel(0x4a3c34, true, 1823), 0.5, { roughness: 0.75, metalness: 0.4 });
    for (const z of [-31, -37.5, -44]) { k.box(0.5, 18, 0.5, 12, 9, z, steelM); k.box(0.9, 0.12, 0.6, 12, 18, z, steelM); }
    k.box(0.4, 0.8, MZ0 - MZ1, 12, 18.2, (MZ0 + MZ1) / 2, steelM);
    { const b = k.box(0.4, 0.8, 9, 7.6, 16.2, -34.5, steelM); b.rotation.x = 0.45; b.rotation.z = 0.2; }
    for (const z of [-31, -37.5, -44]) { const b = k.box(10.5, 0.7, 0.35, 6.8, 18.2, z, steelM); b.rotation.z = z === -37.5 ? 0 : -0.08; }
    /* the broken roof: a few coffers still hanging at the seam, the rest is sky */
    for (let i = 0; i < 7; i++) { const z = MZ0 - 1 - i * 2.5, w = 1.5 + jag() * 2.5; const o = k.box(w, 0.6, 2.4, 1.6 + w / 2, 19.6 - jag() * 0.6, z, travPlain); o.rotation.z = (jag() - 0.5) * 0.2; }
    /* broken column drums lying where they fell, one stump still standing, a capital face down */
    const drums: [number, number, number, number][] = [[6.5, -33, 0.2, 1.1], [9.4, -35.8, 1.4, 0.9], [5.2, -40.8, -0.6, 1.2], [10.8, -42.4, 0.9, 1.0], [7.8, -45.2, 2.1, 0.8]];
    for (const [x, z, ry, l] of drums) { const o = k.cyl(0.95, l * 1.6, x, 0.95, z, trav, 0.95, 18); o.rotation.z = PI / 2; o.rotation.y = ry; }
    k.cyl(0.95, 2.4, 13.6, 1.2, -38, trav, 0.98, 18); k.cyl(0.95, 0.9, 13.6, 2.85, -38, travDark, 0.9, 7);
    k.prop('penn_capital', 4.6, 0, -36.8, { height: 1.8, rotY: 0.6 });
    for (const [x, z, h] of [[8.4, -31.6, 1.6], [11.6, -39.6, 2.1], [6.2, -44.6, 1.4]]) k.prop('penn_rubble', x, 0, z, { height: h, rotY: x });
    {
      const chunks: T.Matrix4[] = [], cc: number[] = [], pal = [0xd8c6a0, 0xc9b38c, 0xb4a07c, 0x9a8a6e, 0x6e655a];
      for (let i = 0; i < 260; i++) {
        const x = 3.2 + jag() * 12.4, z = MZ0 - 0.5 - jag() * (MZ0 - MZ1 - 1), s = 0.12 + jag() * jag() * 0.9;
        chunks.push(new T.Matrix4().compose(v(x, s * 0.35, z), new T.Quaternion().setFromEuler(new T.Euler(jag() * 3, jag() * 3, jag() * 3)), v(s * (0.8 + jag()), s * (0.5 + jag() * 0.6), s * (0.8 + jag()))));
        cc.push(pal[Math.floor(jag() * pal.length)]);
      }
      const im = k.instances(new T.BoxGeometry(1, 1, 1), new T.MeshStandardMaterial({ roughness: 0.95 }), chunks);
      const c = new T.Color(); cc.forEach((h, i) => im.setColorAt(i, c.set(h))); if (im.instanceColor) im.instanceColor.needsUpdate = true;
    }
    { const g = new T.CircleGeometry(7, 20); g.rotateX(-PI / 2); g.scale(1.1, 1, 1.4); k.mesh(g, k.flat(0x8a8070, 0, 0.95), 9, 0.02, -38); }
    k.block(3.0, MW, MZ1, MZ0);                                   /* the visitor stays on the intact side */
    /* the wrecking ball on its cable from the last girder, swinging slowly toward the broken wall */
    const pivot = new T.Group(); pivot.position.set(8.6, 18.2, -37.5); k.add(pivot);
    { const cable = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 10.8, 6).translate(0, -5.4, 0), iron); pivot.add(cable); }
    const ballFallback = new T.Mesh(new T.SphereGeometry(0.85, 20, 14), k.flat(0x1a1a1c, 0.7, 0.45)); ballFallback.position.y = -11.6; pivot.add(ballFallback);
    void k.prop('penn_wrecking_ball', 0, 0, 0, { height: 2.4 }).then((o) => { if (!o) return; ballFallback.visible = false; o.position.set(0, -12.8 + (o.position.y), 0); pivot.add(o); });
    pivot.rotation.x = 0.0; pivot.rotation.z = 0.24;
    if (!ctx.reduced) k.ticks.push((t) => { pivot.rotation.z = 0.26 * Math.sin(t * 0.42); pivot.rotation.x = 0.05 * Math.sin(t * 0.21 + 1); });
    /* the seam: a jagged column of signal noise where the two sides meet, floor to the broken roof */
    const SEAM_N = ctx.quality === 'low' ? 160 : 320;
    const seamM = new T.MeshBasicMaterial({ side: T.DoubleSide, toneMapped: false });
    const seam = k.instances(new T.PlaneGeometry(1, 1), seamM, Array.from({ length: SEAM_N }, () => new T.Matrix4()));
    seam.frustumCulled = false;
    const glitchPal = [0x00e5ff, 0xff2e63, 0xffe600, 0xffffff, 0x101014, 0x2962ff, 0x39ff88, 0xff8a00];
    {
      const sr = X.mulberry(1824), m = new T.Matrix4(), q = new T.Quaternion(), c = new T.Color();
      /* a crack, not confetti: a jagged zig zag in x that runs floor to roof, clustered tight to it */
      const saw = (u: number) => { const f = u - Math.floor(u); return f < 0.5 ? f * 2 : 2 - f * 2; };
      const edge = (y: number) => 1.6 + 1.1 * (saw(y * 0.23) - 0.5) + 0.5 * (saw(y * 0.71 + 0.3) - 0.5);
      const reseed = (i: number, t: number) => {
        const flat = sr() < 0.22, y = flat ? 0.02 : Math.pow(sr(), 0.8) * 20, z = flat ? MZ0 - sr() * (MZ0 - MZ1) : MZ0 - 0.6 - sr() * 1.6;
        const x = edge(flat ? (MZ0 - z) * 0.9 : y) + (sr() - 0.5) * (flat ? 0.5 : 0.35);
        const w = 0.05 + sr() * sr() * (flat ? 0.5 : 0.7), h = 0.04 + sr() * sr() * 0.3;
        q.setFromEuler(new T.Euler(flat ? -PI / 2 : 0, 0, 0));
        m.compose(v(x, y + (flat ? 0 : 0), z), q, v(flat ? w * 2 : w, flat ? h * 3 : h, 1));
        seam.setMatrixAt(i, m); seam.setColorAt(i, c.set(glitchPal[Math.floor(sr() * glitchPal.length)]));
        void t;
      };
      for (let i = 0; i < SEAM_N; i++) reseed(i, 0);
      seam.instanceMatrix.needsUpdate = true; if (seam.instanceColor) seam.instanceColor.needsUpdate = true;
      let acc = 0;
      if (!ctx.reduced) k.ticks.push((t, dt) => {
        acc += dt; if (acc < 0.07) return; acc = 0;
        for (let j = 0; j < SEAM_N * 0.22; j++) reseed(Math.floor(sr() * SEAM_N), t);
        seam.instanceMatrix.needsUpdate = true; if (seam.instanceColor) seam.instanceColor.needsUpdate = true;
      });
    }

    /* ================= DITHER: the concourse, z -47 to -111, at night ================= */
    const QZ0 = MZ1, QZ1 = -111, QX = 32, QC = (QZ0 + QZ1) / 2;
    const floorT = ditherTex(128, (x, y) => { const g = (x % 64 < 2 || y % 64 < 2) ? 0.08 : 0.52 + 0.22 * vnoise(x / 22, y / 22, 3) + 0.1 * Math.sin((x + y) * 0.07); return g; });
    const wallT = ditherTex(128, (x, y) => 0.84 + 0.1 * vnoise(x / 30, y / 30, 5));
    const steelT = ditherTex(64, (x, y) => ((x % 16 === 8 && y % 16 === 8) ? 0.75 : 0.2 + 0.1 * vnoise(x / 9, y / 9, 7)));
    const brickT = ditherTex(128, (x, y) => ((y % 16 < 2) || ((x + (Math.floor(y / 16) % 2) * 16) % 32 < 2) ? 0.25 : 0.58 + 0.1 * vnoise(x / 12, y / 12, 9)));
    const qFloor = worldMat(floorT, 0.25, { roughness: 0.55 }), qWall = worldMat(wallT, 0.25, { roughness: 0.9 }), qSteel = worldMat(steelT, 0.6, { roughness: 0.6, metalness: 0.3 }), qOuter = worldMat(brickT, 0.18, { roughness: 0.9 });
    k.box(QX * 2, 0.2, QZ0 - QZ1, 0, -0.1, QC, qFloor);
    /* the screen wall between the seam and the concourse, and the outer walls */
    k.mesh(holedWall(QX * 2, 16, 0.8, [{ kind: 'rect', cx: 0, y0: 0, w: MW * 2, h: 14 }]), qOuter, 0, 0, QZ0);
    k.block(-QX - 2, -MW, QZ0 - 0.6, QZ0 + 0.6); k.block(MW, QX + 2, QZ0 - 0.6, QZ0 + 0.6);
    for (const s of [-1, 1]) { k.box(0.8, 14, QZ0 - QZ1, s * (QX + 0.4), 7, QC, qOuter); k.block(s > 0 ? QX - 0.2 : -QX - 2, s > 0 ? QX + 2 : -QX + 0.2, QZ1, QZ0); }
    k.box(QX * 2, 14, 0.8, 0, 7, QZ1 - 0.4, qOuter); k.block(-QX - 2, QX + 2, QZ1 - 2, QZ1 + 0.2);
    /* the far wall: the stair heads down to the platforms, dark arches with railings, no train names */
    for (const x of [-24, -12, 0, 12, 24]) {
      k.plane(6, 6, x, 3, QZ1 + 0.05, k.flat(0x07090f, 0, 1));
      for (const s of [-1, 1]) k.box(0.08, 1.1, 3, x + s * 3.2, 0.55, QZ1 + 1.5, qSteel);
      k.box(6.6, 0.6, 0.6, x, 6.3, QZ1 + 0.2, qSteel);
    }
    /* riveted steel: columns at x 12 and 32, arches across every bay and along the rows */
    const rowZ: number[] = []; for (let z = -55; z >= -103; z -= 12) rowZ.push(z);
    const arc = (cx: number, y: number, z: number, r: number, along: 'x' | 'z', n = 14) => {
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * PI, a1 = ((i + 1) / n) * PI;
        const p = (a: number) => along === 'x' ? v(cx + Math.cos(a) * r, y + Math.sin(a) * r, z) : v(cx, y + Math.sin(a) * r, z + Math.cos(a) * r);
        k.bar(p(a0), p(a1), 0.36, 0.7, qSteel);
      }
    };
    for (const z of rowZ) {
      for (const x of [-12, 12]) { k.box(0.9, 14, 0.9, x, 7, z, qSteel); k.box(1.3, 0.5, 1.3, x, 0.25, z, qSteel); k.keepOut.push({ x, z, r: 0.9 }); }
      arc(0, 14, z, 12, 'x', 18);
      for (const s of [-1, 1]) arc(s * 22, 12, z, 10, 'x', 14);
    }
    for (const x of [-12, 12]) for (let i = 0; i < rowZ.length - 1; i++) arc(x, 12, (rowZ[i] + rowZ[i + 1]) / 2, 6, 'z', 10);
    /* the glass vaults: a grid of panes over each bay, transparent to the sky */
    const glassT = canvasTex(128, 128, (g) => {
      g.clearRect(0, 0, 128, 128); g.fillStyle = 'rgba(160,190,220,0.10)'; g.fillRect(0, 0, 128, 128);
      g.fillStyle = '#16203a'; g.fillRect(0, 0, 128, 7); g.fillRect(0, 0, 7, 128); g.fillRect(0, 62, 128, 3); g.fillRect(62, 0, 3, 128);
    }, true);
    const glassM = new T.MeshBasicMaterial({ map: glassT, color: new T.Color(0xffffff).lerp(new T.Color(0x6a7aa8), k.night), transparent: true, depthWrite: false, side: T.DoubleSide });
    glassT.repeat.set(16, 22);
    k.mesh(barrelZ(12, QZ0 - QZ1, 36), glassM, 0, 14, QC, true);
    for (const s of [-1, 1]) k.mesh(barrelZ(10, QZ0 - QZ1, 30), glassM, s * 22, 12, QC, true);
    for (const s of [-1, 1]) k.box(0.6, 0.8, QZ0 - QZ1, s * 12, 14, QC, qSteel);
    /* the glass grid's shadow on the floor, moved with the New York sun (and the moon after dark) */
    const shadowT = canvasTex(64, 64, (g) => {
      g.clearRect(0, 0, 64, 64); g.fillStyle = '#0a1024';
      for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const on = x < 4 || y < 4 || ((x === 31 || x === 32) || (y === 31 || y === 32)); if (on && ((x + y) & 1) === 0) g.fillRect(x, y, 1, 1); }
    }, true);
    shadowT.magFilter = T.NearestFilter;
    const shadowM = new T.MeshBasicMaterial({ map: shadowT, transparent: true, opacity: 0.5, depthWrite: false });
    const TILE = 4.2;
    const shadow = k.mesh(new T.PlaneGeometry(QX * 2 - 1, QZ0 - QZ1 - 1).rotateX(-PI / 2), shadowM, 0, 0.025, QC, true);
    shadow.renderOrder = 1;
    shadowT.repeat.set((QX * 2) / TILE, (QZ0 - QZ1) / TILE);
    const placeShadow = (h: number) => {
      const { d, day } = sunDir(h);
      const dd = day > 0 ? d : v(0.35, 0.8, -0.48).normalize();
      const H = 20, sx = -dd.x / dd.y * H, sz = -dd.z / dd.y * H;
      shadowT.offset.set(-sx / TILE, sz / TILE);
      shadowM.opacity = day > 0 ? 0.55 * day : 0.3 * k.night;
    };
    placeShadow(hour0);
    /* freestanding gallery walls, like platforms, two works a face */
    const GW = [-9, 9], GZ0 = -60, GZ1 = -77;
    for (const x of GW) {
      k.box(0.5, 5.2, GZ0 - GZ1, x, 2.6, (GZ0 + GZ1) / 2, qWall);
      k.box(0.7, 0.3, GZ0 - GZ1 + 0.2, x, 0.15, (GZ0 + GZ1) / 2, k.flat(WARM, 0, 0.6, { emissive: WARM, emissiveIntensity: 0.4 }));
      k.block(x - 0.45, x + 0.45, GZ1, GZ0);
      for (const z of [-64.4, -72.6]) { hang(mounts, x - 0.27, 2.7, z, -PI / 2, 4.6, 3.6, st, 3.8); hang(mounts, x + 0.27, 2.7, z, PI / 2, 4.6, 3.6, st, 3.8); }
    }
    for (const x of [-21, 21]) { k.box(0.5, 4.2, 12, x, 2.1, -92, qWall); k.block(x - 0.45, x + 0.45, -98, -86); }
    k.prop('penn_baggage_wagon', -4.5, 0, -90, { height: 1.1, rotY: 0.3, keepOut: 1.8 });
    k.prop('penn_luggage', -4.2, 1.05, -90.2, { height: 0.9, rotY: 0.3 });
    k.prop('penn_luggage', 5.6, 0, -84.5, { height: 0.9, rotY: 2.2, keepOut: 0.8 });
    /* moonlit: cool lights high in the vaults, a warm one over each gallery wall */
    for (const z of [-60, -84, -104]) k.point(0, 16, z, 0x9fb4e8, 30 + 50 * k.night, 34, 1.4);
    for (const x of GW) k.point(x, 6.5, -68.5, WARM, 18, 12);
    k.crowd([v(-2, 0, -50), v(-3, 0, -66), v(2, 0, -82), v(0, 0, -106)], 7, { seed: 1825, spread: 3, speed: 0.95, animate: !ctx.reduced, colors: [0x16203a, 0xe9e0c8, 0x16203a, 0x2a3450] });
    k.crowd([v(-26, 0, -52), v(-26, 0, -106)], 4, { seed: 1826, spread: 2, speed: 0.8, animate: !ctx.reduced, colors: [0x16203a, 0xe9e0c8] });

    /* the real clock and the real sun: hands, shafts and the glass shadow follow New York time */
    {
      let acc = 10;
      const tickClock = () => {
        const c = nyClock(hour0);
        minH.rotation.z = -((c.m + c.s / 60) / 60) * PI * 2;
        hourH.rotation.z = -(((c.h % 12) + c.m / 60) / 12) * PI * 2;
      };
      tickClock();
      if (!ctx.reduced) k.ticks.push((t, dt) => {
        acc += dt; if (acc < 1) return; acc = 0;
        tickClock();
        const h = (hour0 + t / 3600) % 24;
        placeShafts(h); placeShadow(h);
        const { d } = sunDir(h); sunL.position?.set(d.x * 120, d.y * 120 + 2, -79 + d.z * 120);
      });
    }

    /* ================= the mosh: any work moshes when a visitor stands still before it ================= */
    {
      const N = ctx.quality === 'low' ? 360 : 720;
      const im = k.instances(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ side: T.DoubleSide, toneMapped: false }), Array.from({ length: N }, () => new T.Matrix4().makeScale(0, 0, 0)));
      im.frustumCulled = false;
      const pr = X.mulberry(1827);
      const P = Array.from({ length: N }, (_, i) => ({ u: pr() - 0.5, w: pr() - 0.5, sp: 0.12 + pr() * 0.22, ph: pr(), lat: (pr() - 0.5) * 2, reach: 0.4 + pr() * 0.6, sx: 0.06 + pr() * pr() * 0.5, sy: 0.02 + pr() * 0.09, block: i % 5 === 0 }));
      const col = new T.Color();
      P.forEach((_, i) => im.setColorAt(i, col.set(glitchPal[i % glitchPal.length])));
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      const arts = new Map<number, T.Mesh>();
      let cleared = true, scanAt = -10, act = -1, I = 0, cand = -1, hold = 0, sampled = -1;
      const last = new T.Vector3(), fwd = new T.Vector3(), m4 = new T.Matrix4(), q = new T.Quaternion(), qW = new T.Quaternion(), qF = new T.Quaternion(), pos = new T.Vector3(), sc = new T.Vector3();
      const artBase = new Map<T.Mesh, T.Vector3>();
      const sample = (i: number) => {
        sampled = i;
        const art = arts.get(i); const img = (art?.material as T.MeshBasicMaterial | undefined)?.map?.image as CanvasImageSource & { width?: number } | undefined;
        let px: Uint8ClampedArray | null = null;
        try {
          if (img && img.width) { const c = document.createElement('canvas'); c.width = 24; c.height = 14; const g = c.getContext('2d')!; g.drawImage(img, 0, 0, 24, 14); px = g.getImageData(0, 0, 24, 14).data; }
        } catch { px = null; }
        P.forEach((p, j) => {
          if (px && pr() > 0.08) { const xi = Math.min(23, Math.floor((p.u + 0.5) * 24)), yi = Math.min(13, Math.floor((0.5 - p.w) * 14)), o = (yi * 24 + xi) * 4; col.setRGB(px[o] / 255, px[o + 1] / 255, px[o + 2] / 255, T.SRGBColorSpace); col.multiplyScalar(1.25); }
          else col.set(glitchPal[j % glitchPal.length]);
          im.setColorAt(j, col);
        });
        if (im.instanceColor) im.instanceColor.needsUpdate = true;
      };
      const place = (t: number) => {
        const m = mounts[act];
        if (!m || I <= 0.001) { if (!cleared) { for (let i = 0; i < N; i++) im.setMatrixAt(i, m4.makeScale(0, 0, 0)); im.instanceMatrix.needsUpdate = true; cleared = true; } return; }
        cleared = false;
        const nx = Math.sin(m.rotation), nz = Math.cos(m.rotation), rx = nz, rz = -nx;
        qW.setFromAxisAngle(UP, m.rotation);
        qF.setFromEuler(new T.Euler(-PI / 2, m.rotation, 0, 'YXZ'));
        const art = arts.get(act); const aw = art ? (art.geometry as T.PlaneGeometry).parameters.width : m.width * 0.7, ah = art ? (art.geometry as T.PlaneGeometry).parameters.height : m.height * 0.6;
        const fy = floorY(m.position.x + nx * 1.2, m.position.z + nz * 1.2);
        for (let i = 0; i < N; i++) {
          const p = P[i];
          const x0 = m.position.x + rx * p.u * aw, z0 = m.position.z + rz * p.u * aw, y0 = m.position.y + p.w * ah;
          if (p.block) {
            const j = Math.floor(t * 9 + p.ph * 50);
            const jx = (X.mulberry(j * 7 + i)() - 0.5) * 0.5 * I;
            pos.set(x0 + rx * jx + nx * 0.12, y0 + (X.mulberry(j * 13 + i)() - 0.5) * 0.2 * I, z0 + rz * jx + nz * 0.12);
            sc.set(p.sx * 2.2 * I, p.sy * 3 * I, 1); m4.compose(pos, qW, sc); im.setMatrixAt(i, m4); continue;
          }
          const s = (p.ph + t * p.sp) % 1;
          if (s < 0.42) {
            const a = s / 0.42;
            pos.set(x0 + rx * p.lat * a * 1.6 * I + nx * 0.1, y0 - (y0 - fy) * a * a, z0 + rz * p.lat * a * 1.6 * I + nz * 0.1);
            sc.set(p.sx * I, (p.sy + a * 0.25) * I, 1); q.copy(qW);
          } else {
            const b = (s - 0.42) / 0.58, out = 0.25 + p.reach * 4.6 * I * b, lat = p.lat * (1.6 + 2.4 * b) * I;
            pos.set(x0 + rx * lat + nx * out, fy + 0.03 + i * 0.00001, z0 + rz * lat + nz * out);
            sc.set(p.sx * (1 + b) * I, (p.sy * 2 + 0.2 * b) * I * (1 - 0.5 * b), 1); q.copy(qF);
          }
          m4.compose(pos, q, sc); im.setMatrixAt(i, m4);
        }
        im.instanceMatrix.needsUpdate = true;
        if (art) {
          let b = artBase.get(art); if (!b) { b = art.position.clone(); artBase.set(art, b); }
          const j = Math.floor(t * 14);
          art.position.x = b.x + (X.mulberry(j)() - 0.5) * 0.09 * I; art.position.y = b.y + (X.mulberry(j + 3)() - 0.5) * 0.04 * I;
          art.scale.x = 1 + 0.025 * I * Math.sin(t * 23);
        }
      };
      if (!ctx.reduced) k.ticks.push((t, dt) => {
        const c = cam(); if (!c) return;
        if (t - scanAt > 2 || (act >= 0 && !arts.has(act))) {
          scanAt = t; arts.clear();
          k.scene.traverse((o) => { if (o instanceof T.Mesh && o.userData.piece && typeof o.userData.mountIndex === 'number') arts.set(o.userData.mountIndex, o); });
        }
        const speed = c.position.distanceTo(last) / Math.max(dt, 1e-3); last.copy(c.position);
        c.getWorldDirection(fwd);
        let best = -1, bd = 1e9;
        mounts.forEach((m, i) => {
          if (!arts.has(i)) return;
          const dx = c.position.x - m.position.x, dz = c.position.z - m.position.z, dist = Math.hypot(dx, dz);
          if (dist > 4.8 || Math.abs(c.position.y - m.position.y) > 4) return;
          const nx = Math.sin(m.rotation), nz = Math.cos(m.rotation);
          if ((dx * nx + dz * nz) / dist < 0.45) return;
          if ((-dx * fwd.x - dz * fwd.z) / (dist * Math.hypot(fwd.x, fwd.z) || 1) < 0.72) return;
          if (dist < bd) { bd = dist; best = i; }
        });
        if (best !== cand) { cand = best; hold = 0; }
        if (cand >= 0 && speed < 0.4) hold += dt; else if (speed >= 0.4 && cand !== act) hold = 0;
        if (cand >= 0 && hold > 1.5 && act !== cand) {
          if (act >= 0 && I > 0.05) { I -= dt / 0.6; }
          else { const old = arts.get(act); const b = old && artBase.get(old); if (old && b) { old.position.copy(b); old.scale.x = 1; } act = cand; I = 0; }
        }
        if (act >= 0 && act === cand && hold > 1.5) { if (sampled !== act) sample(act); I = Math.min(1, I + dt / 1.8); }
        else if (act >= 0) { I = Math.max(0, I - dt / 1.4); if (I === 0) { const old = arts.get(act); const b = old && artBase.get(old); if (old && b) { old.position.copy(b); old.scale.x = 1; } act = -1; } }
        place(t);
      });
    }

    /* ================= FIND MINE: the census desk ================= */
    {
      const BEAM_TOP = v(0, SPR + WR - 1.5, WC + 4);
      const beamM = new T.MeshBasicMaterial({ color: 0xffe2a8, transparent: true, opacity: 0.04, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false });
      const beam = new T.Mesh(new T.CylinderGeometry(0.2, 1.4, 1, 28, 1, true).translate(0, -0.5, 0), beamM);
      beam.renderOrder = 4; k.add(beam);
      const poolM = new T.MeshBasicMaterial({ map: X.pool(), color: 0xffe2a8, transparent: true, opacity: 0.35, depthWrite: false, blending: T.AdditiveBlending });
      const pool = new T.Mesh(new T.PlaneGeometry(5, 5), poolM); pool.renderOrder = 4; k.add(pool);
      const spot = k.spot(BEAM_TOP.x, BEAM_TOP.y, BEAM_TOP.z, DX, 1, DZ, 0xffe6b8, 0, 0.09, 0.4, 70);
      const aim = v(DX, 1.1, DZ), want = aim.clone();
      const aimBeam = () => {
        const d = aim.clone().sub(BEAM_TOP), L = d.length();
        beam.position.copy(BEAM_TOP); beam.quaternion.setFromUnitVectors(UP, d.clone().negate().normalize()); beam.scale.set(1, L, 1);
        spot.target?.position?.copy(aim);
        pool.position.copy(aim); pool.lookAt(BEAM_TOP);
      };
      aimBeam();
      /* the tour the light makes: one stop per work, a few seconds each, then the camera walks to the first */
      let stops: number[] = [], si = 0, stopT = 0, walked = false, sweeping = false;
      const startSweep = (list: number[]) => { stops = list; si = 0; stopT = 0; walked = false; sweeping = list.length > 0; };
      if (typeof window !== 'undefined') {
        const w = window as unknown as { __pennFind?: { at: number } };
        /* the hall was just rehung with a collector's own works: walk them to the first and light the rest */
        if (w.__pennFind && performance.now() - w.__pennFind.at < 30000) { delete w.__pennFind; startSweep(mounts.map((_, i) => i)); setTimeout(() => { const c = cam(); if (c) { c.position.set(DX, 3, DZ + 5); c.lookAt(DX, 3, DZ); } museum()?.focus?.(0); }, 600); walked = true; }
      }
      let panel: HTMLDivElement | null = null, status: HTMLDivElement | null = null;
      const say = (s: string) => { if (status) status.textContent = s; };
      const find = async (key: string) => {
        key = key.trim().toLowerCase(); if (!key) return;
        say('READING THE ROLL');
        try {
          const d = await (await fetch('api/collectors.json')).json() as { collectors: { a: string; ens?: string }[] };
          const row = d.collectors.find((c) => c.a.toLowerCase() === key || (c.ens || '').toLowerCase() === key || (c.ens || '').toLowerCase() === key + '.eth');
          if (!row) { say('NOT ON THE ROLL YET. THE ROLL IS READ FROM THE CHAIN AND REFRESHED WITH THE SITE.'); return; }
          const r = await fetch(`api/c/${row.a}.json`);
          const pd = r.ok ? await r.json() as { pieces?: { n?: number }[] } : { pieces: [] };
          const nums = new Set((pd.pieces || []).map((p) => p.n).filter((n): n is number => typeof n === 'number'));
          const here: number[] = [];
          k.scene.traverse((o) => { if (o instanceof T.Mesh && o.userData.piece && nums.has(o.userData.piece.n) && typeof o.userData.mountIndex === 'number') here.push(o.userData.mountIndex); });
          const name = row.ens || row.a.slice(0, 6) + '…' + row.a.slice(-4);
          if (here.length) { say(`${name.toUpperCase()}: ${here.length} HANGING IN THIS HALL`); startSweep(here.sort((a, b) => a - b)); return; }
          if (!nums.size) { say(`${name.toUpperCase()}: NO NEW YORKERS ON THIS WALLET YET`); return; }
          say(`${name.toUpperCase()}: REHANGING THE HALL WITH YOUR ${nums.size} NEW YORKERS`);
          (window as unknown as { __pennFind?: { at: number } }).__pennFind = { at: performance.now() };
          setTimeout(() => { location.hash = `room=pennstation&hang=collector:${row.a}`; }, 700);
        } catch { say('THE ROLL COULD NOT BE READ FROM HERE. TRY AGAIN ON THE LIVE SITE.'); }
      };
      const ensurePanel = () => {
        if (panel || typeof document === 'undefined' || !document.body) return;
        panel = document.createElement('div');
        panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Find mine');
        panel.style.cssText = 'position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:40;width:min(420px,calc(100vw - 32px));box-sizing:border-box;padding:14px 14px 12px;background:rgba(10,12,18,.88);border:1px solid #c9a86a;color:#f0e8d6;font:12px/1.4 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.06em;display:none';
        panel.innerHTML = '<div style="color:#c9a86a;margin-bottom:8px">THE CENSUS DESK · FIND MINE</div><form style="display:flex;gap:8px"><input name="k" autocomplete="off" spellcheck="false" placeholder="wallet or ENS" style="flex:1;min-width:0;padding:9px 10px;background:#0b0d12;border:1px solid #4a4234;color:#f0e8d6;font:inherit;font-size:16px"><button style="padding:9px 12px;background:#c9a86a;border:0;color:#0b0d12;font:inherit;font-weight:700;cursor:pointer">FIND</button></form><div data-s style="margin-top:8px;color:#a89c84;min-height:1.4em">THE LEDGER KNOWS EVERY HOLDER OF THE CENSUS RELEASE.</div>';
        status = panel.querySelector('[data-s]');
        const form = panel.querySelector('form')!, input = panel.querySelector('input')!;
        form.addEventListener('submit', (e) => { e.preventDefault(); void find(input.value); });
        for (const ev of ['pointerdown', 'pointerup', 'click', 'wheel', 'touchstart']) panel.addEventListener(ev, (e) => e.stopPropagation());
        document.body.appendChild(panel);
        /* the panel belongs to this room: when the museum swaps the kit out, it goes */
        const watch = setInterval(() => { if (museum()?.kit !== k) { panel?.remove(); panel = null; clearInterval(watch); } }, 800);
      };
      k.ticks.push((t, dt) => {
        const c = cam(); if (!c) return;
        const near = Math.hypot(c.position.x - DX, c.position.z - DZ) < 4.2 && c.position.y < 6;
        if (near) ensurePanel();
        if (panel) { const show = near || sweeping; if ((panel.style.display !== 'none') !== show) panel.style.display = show ? 'block' : 'none'; }
        if (sweeping) {
          const m = mounts[stops[si]];
          if (m) want.set(m.position.x, m.position.y - 0.3, m.position.z).addScaledVector(v(Math.sin(m.rotation), 0, Math.cos(m.rotation)), 0.4);
          stopT += dt;
          if (stopT > 2.6) { stopT = 0; si++; if (si >= stops.length) { sweeping = false; if (!walked && stops.length) { walked = true; museum()?.focus?.(stops[0]); } } }
          beamM.opacity += (0.2 - beamM.opacity) * Math.min(1, dt * 3); spot.intensity += (900 - spot.intensity) * Math.min(1, dt * 3);
        } else {
          want.set(DX, 1.1, DZ);
          beamM.opacity += (0.04 - beamM.opacity) * Math.min(1, dt * 2); spot.intensity += ((near ? 260 : 0) - spot.intensity) * Math.min(1, dt * 2);
        }
        aim.lerp(want, Math.min(1, dt * (sweeping ? 2.4 : 1.2)));
        aimBeam();
      });
    }

    bulbsMesh(k, bulbs);

    /* ---- what the hall knows ---- */
    const src = { name: 'Pennsylvania Station (1910 to 1963), Wikipedia', url: 'https://en.wikipedia.org/wiki/Pennsylvania_Station_(1910%E2%80%931963)' };
    k.egg(v(0, SPR + 6, WC), { id: 'pennstation-baths', title: 'A Roman bath for a railroad', year: '1910', text: 'The main waiting room was inspired by Roman structures such as the baths of Caracalla, Diocletian and Titus. It measured 314 feet 4 inches long, 108 feet 8 inches wide and 150 feet tall. The lower walls were of travertine from the Campagna in Italy, which made Penn Station the first major American building to use travertine.', clue: 'Look up at the coffered vault, then put a hand on the wall.', source: src }, { r: 4 });
    k.egg(v(32, 16.5 + LR * 0.5, WZ1 + 0.6), { id: 'pennstation-lunettes', title: 'Eight lunettes', text: 'Eight lunette windows sat on top of the waiting room walls: one each over the north and south walls and three each over the west and east walls. Each had a radius of 38 feet 4 inches.', clue: 'Find the half moons of glass high on the walls and count them.', source: src }, { r: 3 });
    k.egg(v(eagleSpots[1][0], S + 2.4, eagleSpots[1][1]), { id: 'pennstation-eagles', title: 'Twenty two eagles', text: 'Of the 22 eagle sculptures around the station exterior, the locations of all 14 larger freestanding eagles are known. Three remain in New York City: two at Penn Plaza along Seventh Avenue flanking the main entrance, and one at Cooper Union, Adolph Weinman\'s alma mater, which since 2009 has stood on the eighth floor green roof of 41 Cooper Square.', clue: 'The granite birds at the door.', source: src }, { r: 1.6 });
    k.egg(v(0, clockY, clockZ + 0.3), { id: 'pennstation-day-night', title: 'Day and Night', text: 'Above the centre of the entrance, 61 feet above the sidewalk, was a clock with faces 7 feet across. The station carried four pairs of sculptures by Adolph Weinman, each two female personifications, Day and Night, modelled on Audrey Munson, flanking large clocks at the top of each side of the building.', clue: 'Look up over the door at the time. It is the real time in New York.', source: src }, { r: 1.6 });
    k.egg(v(7.8, 1.2, -45.2), { id: 'pennstation-meadowlands', title: 'Columns in the Meadowlands', year: '1963', text: 'Demolition of the station house began on October 28, 1963, and was finished in 1966. Many of its architectural elements were lost or buried in the New Jersey Meadowlands; a New York Times photograph by Eddie Hausner showed Weinman\'s sculpture Day lying in a landfill there. Eighteen of the station\'s 84 columns were supposed to go to Battery Park; the largest piece known to have been saved, a 35 foot Doric column, went upstate to Woodridge.', clue: 'The fallen drums on the side that is coming down.', source: src }, { r: 1.8 });
    k.egg(v(0, 24, -80), { id: 'pennstation-concourse', title: 'Glass on plain steel', year: '1910', text: 'The concourse was covered by glass vaults held up by a plain steel framework, a glass roof 210 by 340 feet. The station opened to all its trains on November 27, 1910, on an eight acre plot from Seventh to Eighth Avenue between 31st and 33rd Streets.', clue: 'Stand under the glass and look up through the grid.', source: src }, { r: 4 });

    /* the waiting room first, so a short hang (a collector's five) lands under the vault, then the
       north end wall, the concourse, the seam and the arcade */
    const zone = (m: Mount) => m.position.z < WZ0 + 0.5 && m.position.z > WZ1 - 0.5 ? (m.position.x > WX - 1 ? 1 : 0) : m.position.z < QZ0 ? 2 : m.position.z < WZ1 ? 3 : 4;
    mounts.sort((a, b) => zone(a) - zone(b) || a.position.x - b.position.x || b.position.z - a.position.z);
    const floorY = (x: number, z: number) => {
      if (z >= SZ0) return S;
      if (z > SZ1 && Math.abs(x) <= SW + 0.6) return S * clamp01((z - SZ1) / (SZ0 - SZ1));
      return 0;
    };
    return { mounts, spawn: v(0, S + 3, 51.2), look: v(0, S + 12.5, 20), eye: 3, floorY, bounds: [-WX + 0.6, WX - 0.6, QZ1 + 0.6, 49.6], style: st };
  },
};

function bulbsMesh(k: K, bulbs: { x: number; y: number; z: number }[], color = 0xffe2a8, size = 0.09) {
  if (!bulbs.length) return;
  k.instances(new T.SphereGeometry(size, 8, 6), new T.MeshBasicMaterial({ color }), bulbs.map((b) => new T.Matrix4().makeTranslation(b.x, b.y, b.z)));
}
