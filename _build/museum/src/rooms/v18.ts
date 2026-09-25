/* 171 and 172: two rooms in Central Park that keep New York time.
   171 sealions: the Central Park Zoo as rebuilt in 1988, the round sea lion pool in the middle of the
   garden with its rock island and glass rim, the brick pergola on its piers, the Arsenal of 1851 on the
   east, the penguin house in its cold blue light on the west, and the Delacorte Musical Clock on the
   arch to the north, whose bronze animals turn on the hour and the half hour by the real clock.
   172 delacorte: the Delacorte Theater at night, Shakespeare in the Park, the bowl full, five
   anonymous performers moving between marks on the stage, the lights sweeping, Turtle Pond behind
   the stage with fireflies over it and Belvedere Castle lit on Vista Rock. No real play, no likeness.
   Every moving thing is one instanced rig rewritten in place or one group on k.ticks. */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as X from '../textures';
import { v, type Mount, type FrameStyle } from '../kit';
import type { RoomDef } from './types';
const PI = Math.PI;
type K = Parameters<RoomDef['build']>[0];
type C = Parameters<RoomDef['build']>[1];

/* ---------------- helpers, copied from v14 and v3 (nothing there is exported) ---------------- */
function figureGeo(r = 0.2, len = 0.82, headY = 1.35) {
  const body = new T.CapsuleGeometry(r, len, 3, 8); body.translate(0, r + len / 2, 0);
  const head = new T.SphereGeometry(r * 0.62, 10, 8); head.translate(0, headY, 0);
  return mergeGeometries([body, head])!;
}
/* a seated or standing figure as two boxes, 24 triangles, for crowds in the thousands */
function boxFigureGeo(w = 0.36, h = 0.62, d = 0.24, head = 0.22) {
  const body = new T.BoxGeometry(w, h, d); body.translate(0, h / 2, 0);
  const hd = new T.BoxGeometry(head, head, head); hd.translate(0, h + head / 2 + 0.03, 0);
  return mergeGeometries([body, hd])!;
}
/* translucent puffs that rise, spread and fade: spray, steam, breath */
function vapour(k: K, pts: T.Vector3[], perPt: number, p: { rise?: number; spread?: number; size?: number; opacity?: number; colour?: number; seed?: number; speed?: number; animate: boolean; additive?: boolean }) {
  const { rise = 1.4, spread = 0.5, size = 0.1, opacity = 0.2, colour = 0xffffff, seed = 1, speed = 0.28, animate, additive = false } = p;
  const n = pts.length * perPt, rnd = X.mulberry(seed);
  const o = k.instances(new T.SphereGeometry(size, 6, 5), new T.MeshBasicMaterial({ color: colour, transparent: true, opacity, depthWrite: false, blending: additive ? T.AdditiveBlending : T.NormalBlending }), Array.from({ length: n }, () => new T.Matrix4()));
  o.frustumCulled = false;
  const ph = Array.from({ length: n }, (_, i) => ({ b: pts[i % pts.length], o: rnd(), dx: (rnd() - 0.5) * spread, dz: (rnd() - 0.5) * spread }));
  const m = new T.Matrix4(), q = new T.Quaternion(), pos = new T.Vector3(), s = new T.Vector3();
  const place = (t: number) => {
    ph.forEach((a, i) => {
      const u = (t * speed + a.o) % 1, sc = 0.6 + u * 2.4;
      pos.set(a.b.x + a.dx * (1 + u * 3), a.b.y + u * rise, a.b.z + a.dz * (1 + u * 3));
      s.setScalar(sc * (1 - u * 0.35));
      m.compose(pos, q, s);
      o.setMatrixAt(i, m);
    });
    o.instanceMatrix.needsUpdate = true;
  };
  place(0.4);
  if (animate) k.ticks.push(place);
  return o;
}
/* walls along x (at z) and along z (at x) with door gaps, blocked where solid */
type Gap = { c: number; w: number; h: number };
function wallX(k: K, x0: number, x1: number, z: number, h: number, t: number, m: T.Material, gaps: Gap[] = [], y0 = 0, block = true) {
  let cur = x0;
  for (const g of [...gaps].sort((a, b) => a.c - b.c)) {
    const a = g.c - g.w / 2, b = g.c + g.w / 2;
    if (a > cur) { k.box(a - cur, h, t, (cur + a) / 2, y0 + h / 2, z, m); if (block) k.block(cur, a, z - t / 2 - 0.3, z + t / 2 + 0.3); }
    if (h > g.h) k.box(g.w, h - g.h, t, g.c, y0 + g.h + (h - g.h) / 2, z, m);
    cur = b;
  }
  if (x1 > cur) { k.box(x1 - cur, h, t, (cur + x1) / 2, y0 + h / 2, z, m); if (block) k.block(cur, x1, z - t / 2 - 0.3, z + t / 2 + 0.3); }
}
function wallZ(k: K, z0: number, z1: number, x: number, h: number, t: number, m: T.Material, gaps: Gap[] = [], y0 = 0, block = true) {
  let cur = z0;
  for (const g of [...gaps].sort((a, b) => a.c - b.c)) {
    const a = g.c - g.w / 2, b = g.c + g.w / 2;
    if (a > cur) { k.box(t, h, a - cur, x, y0 + h / 2, (cur + a) / 2, m); if (block) k.block(x - t / 2 - 0.3, x + t / 2 + 0.3, cur, a); }
    if (h > g.h) k.box(t, h - g.h, g.w, x, y0 + g.h + (h - g.h) / 2, g.c, m);
    cur = b;
  }
  if (z1 > cur) { k.box(t, h, z1 - cur, x, y0 + h / 2, (cur + z1) / 2, m); if (block) k.block(x - t / 2 - 0.3, x + t / 2 + 0.3, cur, z1); }
}
/* a mount on a wall: rotation r faces the normal (sin r, 0, cos r); the target is d metres out */
function hang(ms: Mount[], x: number, y: number, z: number, r: number, w: number, h: number, style: FrameStyle, d = 3.2) {
  ms.push({ position: v(x, y, z), rotation: r, target: v(x + Math.sin(r) * d, y, z + Math.cos(r) * d), width: w, height: h, style, wash: true });
}
/* people sitting or standing still: one instanced figure each, dark clothes */
function still(k: K, pts: { x: number; y: number; z: number; ry: number; sit?: boolean }[], seed: number, colours = [0x1c1e24, 0x2a2e38, 0x3a3230, 0x1a1a1c, 0x4a4a52, 0x2c3a4a, 0x5a4a3a, 0xe0dcd0]) {
  if (!pts.length) return null;
  const rnd = X.mulberry(seed), c = new T.Color();
  const o = k.instances(figureGeo(0.19, 0.62, 1.12), new T.MeshStandardMaterial({ roughness: 0.9 }), pts.map((p) => new T.Matrix4().compose(v(p.x, p.y + (p.sit ? 0.12 : 0), p.z), new T.Quaternion().setFromAxisAngle(v(0, 1, 0), p.ry), v(1, p.sit ? 0.82 : 1.1 + rnd() * 0.12, 1))));
  pts.forEach((_, i) => o.setColorAt(i, c.set(colours[Math.floor(rnd() * colours.length)])));
  if (o.instanceColor) o.instanceColor.needsUpdate = true;
  return o;
}
/* a flat ring or ring segment on the floor plan, in the room's angle convention (x = r sin a, z = r cos a) */
function ringXZ(r0: number, r1: number, a0: number, a1: number, seg = 48) {
  const g = new T.RingGeometry(r0, r1, seg, 1, 0, a1 - a0);
  g.rotateX(PI / 2); g.rotateY(a1 - PI / 2);
  return g;
}
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const one = new T.Vector3(1, 1, 1), hide = new T.Vector3(0.0001, 0.0001, 0.0001), up = new T.Vector3(0, 1, 0);
/* the New York clock, read in a tick: hours, minutes, seconds in America/New_York. A ?hour= on the
   page (the screenshot tool and the hang of the day use it) overrides the hour and minute so a room
   can be shot at a feeding or on the half hour; the seconds always come from the real clock. */
const nyFmt = typeof Intl !== 'undefined' ? new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) : null;
const hourParam = (() => { try { return typeof location !== 'undefined' ? new URLSearchParams(location.search).get('hour') : null; } catch { return null; } })();
function nyClock() {
  let h = 0, m = 0, s = 0;
  if (nyFmt) for (const p of nyFmt.formatToParts(new Date())) { if (p.type === 'hour') h = Number(p.value) % 24; else if (p.type === 'minute') m = Number(p.value); else if (p.type === 'second') s = Number(p.value); }
  if (hourParam != null && hourParam !== '' && !Number.isNaN(Number(hourParam))) { const f = Number(hourParam); h = Math.floor(f) % 24; m = Math.floor((f - Math.floor(f)) * 60 + 1e-6); }
  return { h, m, s, min: h * 60 + m + s / 60 };
}
/* the visitor's camera, or null in the audit and the check scripts (no window there) */
function cam(): T.Camera | null {
  if (typeof window === 'undefined') return null;
  const m = (window as unknown as { __museum?: { camera?: T.Camera } }).__museum;
  return m && m.camera ? m.camera : null;
}
/* a box part translated into place, for merged animal and prop geometries */
const part = (w: number, h: number, d: number, x: number, y: number, z: number, rz = 0, ry = 0) => { const g = new T.BoxGeometry(w, h, d); if (rz) g.rotateZ(rz); if (ry) g.rotateY(ry); g.translate(x, y, z); return g; };

/* ================================================================== */
/* ---------------- 171 THE SEA LION POOL ---------------- */
export const sealions: RoomDef = {
  id: 'sealions',
  name: 'The sea lion pool',
  area: 'CENTRAL PARK ZOO / 64TH STREET',
  mood: 'Feeding time, and the clock about to play',
  color: '#4a7a8a',
  daylit: true,
  description: 'The Central Park Zoo as Kevin Roche rebuilt it in 1988: the round sea lion pool in the middle of the garden with its rock island and its glass rim, the brick pergola on its piers all round, the Arsenal of 1851 on the east side, the penguin house in its cold blue light on the west, and the Delacorte Musical Clock on the arch to the Children\'s Zoo. The sea lions swim their loop and haul out on the rock, a keeper comes to the rail with a bucket at the real feeding hours and a crowd gathers, and on the hour and the half hour by the New York clock the bronze animals turn round the clock while two monkeys strike the bell. The New Yorkers hang on the piers of the pergola facing the pool, on the front of the Arsenal, beside the penguins and on the entrance walls.',
  signatures: 'The round pool with its rock island and glass rim, four sea lions on their loop and one that comes to the glass when you do, the brick pergola on its piers, the Arsenal\'s brick front with its half octagonal towers, the penguin house glowing blue, the Delacorte Clock on its brick and limestone arch with the bear, the elephant, the goat, the hippo, the kangaroo and the penguin turning and the two monkeys with the bell, the keeper and the crowd at feeding time, the London planes, and the Fifth Avenue towers over the trees.',
  build(k, ctx) {
    k.sky({ top: 0x4f8ad0, horizon: 0xd8e6ee, ground: 0x6a7a5a, fog: 0.0024, sun: { az: 2.4, el: 0.8, color: 0xfff4e0, size: 8 }, env: 0.6 });
    k.hemi(0xe8ecf0, 0x5a6a4a, 0.9);
    k.sun(0xfff0d8, 2.4, 34, 70, 30, true, 90);
    const brick = k.pbr('slBrick', X.brick(0x8a4a38, 171), 0.9), brickD = k.pbr('slBrickD', X.brick(0x6a3a2c, 172), 0.9),
      lime = k.pbr('slLime', X.ashlar(0xd2c8ae, 173, 5), 0.45, { normal: 0.35, roughness: 0.8 }),
      walk = k.pbr('slWalk', X.pavers(0x9a9488, 174), 0.5), grassM = k.pbr('slGrass', X.grass(0x4a6a38, 175), 0.9, { roughness: 1 }),
      basin = k.flat(0x24404a, 0.05, 0.6, { side: T.DoubleSide }), rockM = k.flat(0x6a6660, 0, 0.95), rockD = k.flat(0x4a4642, 0, 0.95),
      steel = k.flat(0x8a9098, 0.8, 0.35), iron = k.flat(0x1e2022, 0.6, 0.5), wood = k.pbr('slWood', X.planks(0x5a3e28, 6, 176), 0.7, { roughness: 0.7 }),
      glassM = k.glass(0xcfe6ee, 0.18, 0.08), win = k.flat(0x1a2128, 0.6, 0.18), trim = k.flat(0xe8e2d4, 0, 0.6),
      bronze = k.flat(0x6e5230, 0.85, 0.42), bronzeL = k.flat(0x8a6a3a, 0.85, 0.4), gold = k.flat(0xc8a050, 1, 0.3),
      seal = k.flat(0x3a2a20, 0.05, 0.55), sealW = k.flat(0x5a4a3c, 0.05, 0.6), keeperM = k.flat(0x1e4a8a, 0, 0.85), skin = k.flat(0xc8a284, 0, 0.7),
      penB = k.flat(0x14161a, 0, 0.7), penW = k.flat(0xe8ecf0, 0, 0.7), ice = k.flat(0xbcd4e0, 0, 0.9), blueGlow = new T.MeshBasicMaterial({ color: 0x8fd0ff }),
      bucket = k.flat(0xd8dce0, 0.7, 0.4), fish = k.flat(0xb8c4cc, 0.6, 0.35), bell = k.flat(0xb89448, 1, 0.3);
    const mounts: Mount[] = [], st: FrameStyle = 'oak';

    /* ---- the ground: the paved garden inside the pergola, grass and planes beyond ---- */
    /* the grass and the paving are slabs with a round hole for the pool: a solid box here hides the water */
    const holed = (w: number, d: number, depth: number, m: T.Material, y: number, cz: number, uvScale: number) => {
      const sh = new T.Shape(); sh.moveTo(-w / 2, -d / 2 - cz); sh.lineTo(w / 2, -d / 2 - cz); sh.lineTo(w / 2, d / 2 - cz); sh.lineTo(-w / 2, d / 2 - cz); sh.closePath();
      const hole = new T.Path(); hole.absarc(0, 0, 9.55, 0, PI * 2, false); sh.holes.push(hole);
      const g = new T.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 48 }); g.rotateX(-PI / 2);
      const uv = g.attributes.uv as T.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / uvScale, uv.getY(i) / uvScale);
      k.mesh(g, m, 0, y, 0);
    };
    holed(100, 100, 0.2, grassM, 0.0, 4, 8);
    holed(42, 40, 0.22, walk, 0.01, 0, 6);
    k.box(10, 0.22, 14, 0, -0.1, -29, walk); k.box(10, 0.22, 8, 0, -0.1, 24, walk);
    k.box(8, 0.22, 30, 20.5, -0.1, 0, walk); k.box(6, 0.22, 24, -19.5, -0.1, 0, walk);

    /* ---- the pool: a sunk basin, the water, the rock island, the glass rim ---- */
    const PR = 9;
    k.mesh(new T.CylinderGeometry(PR, PR, 2.4, 48, 1, true), basin, 0, -1.1, 0);
    { const g = new T.CircleGeometry(PR, 48); g.rotateX(-PI / 2); k.mesh(g, basin, 0, -2.25, 0); }
    { const w = k.water({ y: -0.3, color: 0x2a5a6e, w: 18.6, d: 18.6, x: 0, z: 0, amp: 0.35 }); const wm = w.material as T.MeshStandardMaterial; wm.metalness = 0.05; wm.roughness = 0.25; wm.envMapIntensity = 0.25; }
    /* the rock island: a low pile of boulders the sea lions haul out on */
    for (const [x, z, r, y, m] of [[0, 0, 2.8, -0.9, rockM], [1.4, -1.1, 1.6, -0.3, rockD], [-1.4, 1.0, 1.5, -0.4, rockM], [0.4, 1.8, 1.1, -0.4, rockD], [-0.8, -1.7, 1.2, -0.45, rockM], [2.6, 0.8, 0.9, -0.5, rockD]] as [number, number, number, number, T.Material][]) {
      const g = new T.IcosahedronGeometry(r, 1); g.scale(1, 0.6, 1); k.mesh(g, m, x, y, z);
    }
    k.mesh(new T.CylinderGeometry(PR + 0.55, PR + 0.55, 0.32, 64, 1, true), lime, 0, 0.16, 0);
    k.mesh(ringXZ(PR - 0.05, PR + 0.55, 0, 2 * PI, 64), lime, 0, 0.32, 0);
    /* the glass fence on its posts, all round, with a low stone ledge where the keeper stands */
    k.mesh(new T.CylinderGeometry(PR + 0.62, PR + 0.62, 1.15, 64, 1, true), glassM, 0, 0.32 + 0.575, 0);
    for (let i = 0; i < 40; i++) { const a = (i / 40) * PI * 2; k.cyl(0.03, 1.2, Math.sin(a) * (PR + 0.62), 0.92, Math.cos(a) * (PR + 0.62), steel, 0.03, 6); }
    k.torus(PR + 0.62, 0.03, 0, 1.5, 0, steel, 64).rotation.x = PI / 2;
    k.keepOut.push({ x: 0, z: 0, r: PR + 1.35 });
    k.box(2.4, 0.5, 1.2, 0, 0.25, PR - 0.5, lime);

    /* ---- the pergola: brick piers with wooden beams over them, round the garden ---- */
    const PX = 16, PZ = 14, pierAt: [number, number, number][] = [];
    for (const z of [-12, -8, -4, 0, 4, 8, 12]) { pierAt.push([-PX, z, PI / 2]); pierAt.push([PX, z, -PI / 2]); }
    for (const x of [-12, -8, 8, 12]) { pierAt.push([x, PZ, PI]); pierAt.push([x, -PZ, 0]); }
    for (const [x, z, r] of pierAt) {
      const o = k.box(1.6, 3.3, 0.8, x, 1.65, z, brick); o.rotation.y = r;
      const c = k.box(1.8, 0.16, 1.0, x, 3.38, z, lime); c.rotation.y = r;
      k.keepOut.push({ x, z, r: 1.05 });
    }
    for (const s of [-1, 1]) {
      k.box(0.24, 0.3, 2 * PZ + 1.6, s * PX, 3.6, 0, wood); k.box(0.24, 0.3, 2 * PZ + 1.6, s * (PX - 1.4), 3.6, 0, wood); k.box(0.24, 0.3, 2 * PZ + 1.6, s * (PX + 1.4), 3.6, 0, wood);
      for (let z = -PZ; z <= PZ; z += 0.7) k.box(3.4, 0.12, 0.1, s * PX, 3.82, z, wood);
      for (const x of [-13.8, 10.2]) { k.box(5.2, 0.3, 0.24, x + 1.8, 3.6, s * PZ, wood); k.box(5.2, 0.3, 0.24, x + 1.8, 3.6, s * (PZ - 1.4), wood); k.box(5.2, 0.3, 0.24, x + 1.8, 3.6, s * (PZ + 1.4), wood); for (let xx = x - 0.4; xx <= x + 4.1; xx += 0.7) k.box(0.1, 0.12, 3.4, xx, 3.82, s * PZ, wood); }
    }
    /* the works on the piers facing the pool: the four middle piers of each long side, three of each short */
    for (const z of [-8, -4, 4, 8]) { hang(mounts, -PX + 0.41, 2.0, z, PI / 2, 1.2, 0.9, st, 3.2); hang(mounts, PX - 0.41, 2.0, z, -PI / 2, 1.2, 0.9, st, 3.2); }
    for (const x of [-12, -8, 8, 12]) { hang(mounts, x, 2.0, PZ - 0.41, PI, 1.2, 0.9, st, 3.2); }
    for (const x of [-12, 12]) { hang(mounts, x, 2.0, -PZ + 0.41, 0, 1.2, 0.9, st, 3.2); }
    /* benches and plane trees between the pergola and the buildings */
    for (const [x, z, r] of [[-4.5, 17.5, 0], [4.5, 17.5, 0], [-12, -17.5, PI], [12, -17.5, PI]] as number[][]) { k.bench(x, z, r, wood, iron, 2.2); k.keepOut.push({ x, z, r: 1.3 }); }
    for (const [x, z] of [[-19.5, 17.5], [19.5, 17.5], [-19.5, -17.5], [19.5, -17.5], [-30, 22], [30, 24], [-34, -26], [34, -28], [-38, 0], [-8, 32], [10, 34], [26, 34], [-30, 34]]) { k.tree(x, 0, z, { h: 9 + (x % 3), r: 4.2, seed: 171 + Math.abs(x) }); k.keepOut.push({ x, z, r: 0.9 }); }
    for (const [x, z] of [[-18, 6], [-18, -6], [18, 6], [18, -6]]) k.lamp(x, z, 3.6, iron, 0xffd7a0, 22);

    /* ---- the Arsenal on the east: brick, half octagonal towers, a crenellated parapet, 1851 ---- */
    const AX = 24, AW = 14, AH = 16, AL = 40;
    k.box(AW, AH, AL, AX + AW / 2, AH / 2, 0, brick);
    k.block(AX - 0.2, AX + AW + 0.5, -AL / 2 - 0.6, AL / 2 + 0.6);
    for (const z of [-AL / 2 + 1.4, -4.2, 4.2, AL / 2 - 1.4]) { k.cyl(2.2, AH + 1.6, AX + 0.2, (AH + 1.6) / 2, z, brickD, 2.2, 8); for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2 + PI / 8; k.box(0.9, 0.7, 0.5, AX + 0.2 + Math.sin(a) * 2.2, AH + 1.95, z + Math.cos(a) * 2.2, brickD).rotation.y = a; } }
    for (let z = -AL / 2 + 4.5; z < AL / 2 - 4; z += 1.4) k.box(0.5, 0.7, 0.8, AX - 0.1, AH + 0.35, z, brickD);
    for (let f = 0; f < 4; f++) for (const z of [-15.5, -12, -8.5, 8.5, 12, 15.5, -1.6, 1.6]) { if (f === 0 && Math.abs(z) < 2) continue; const y = 2.2 + f * 3.6; k.box(0.1, 2.2, 1.2, AX - 0.03, y, z, win); k.box(0.16, 0.16, 1.5, AX - 0.06, y + 1.2, z, trim); k.box(0.16, 0.16, 1.5, AX - 0.06, y - 1.2, z, trim); }
    k.mesh(new T.CylinderGeometry(1.5, 1.5, 0.8, 24, 1, false, 0, PI), lime, AX - 0.2, 4.6, 0).rotation.set(0, -PI / 2, PI / 2);
    k.box(0.8, 3.8, 2.6, AX - 0.15, 1.9, 0, brickD); k.box(0.1, 3.4, 2.0, AX - 0.6, 1.7, 0, win);
    for (let s = 0; s < 4; s++) k.box(0.4, 0.14, 4.2 - s * 0.4, AX - 0.9 - s * 0.4, 0.07 + s * 0.14, 0, lime);
    k.sign('THE ARSENAL', 3.6, 0.5, AX - 0.62, 5.7, 0, 'transparent', '#e8dfc8', 60, -PI / 2);
    k.box(AW + 2, 0.4, AL + 2, AX + AW / 2, AH + 0.2, 0, brickD);
    for (const z of [-13, -7, 7, 13]) hang(mounts, AX - 0.42, 2.6, z, -PI / 2, 2.2, 1.6, st, 3.4);
    k.skyline({ z: 0, x: 92, count: 10, spacing: 8, seed: 1711, base: 0, lit: 0.25, scale: 1.4 });

    /* ---- the penguin house on the west: a low stone building with a tall glass front, cold blue inside ---- */
    const HX = -22, HW = 12, HH = 6.5, HL = 20;
    k.box(HW, HH, HL, HX - HW / 2 - 0.4, HH / 2, 0, lime);
    k.block(HX - HW - 1, HX + 0.3, -HL / 2 - 0.6, HL / 2 + 0.6);
    k.box(0.3, HH - 1.2, 8, HX + 0.05, HH / 2 + 0.3, 0, glassM);
    for (const z of [-4, -2, 0, 2, 4]) k.box(0.2, HH - 1.2, 0.12, HX + 0.08, HH / 2 + 0.3, z, steel);
    k.box(0.4, 1.2, 8.4, HX + 0.05, 0.6, 0, lime);
    k.box(6, HH - 0.6, 7.4, HX - 3.4, HH / 2, 0, k.flat(0x0e2436, 0, 0.9, { side: T.BackSide }));
    k.box(5, 0.3, 6.8, HX - 3.4, 1.2, 0, ice); k.box(2.4, 0.7, 2.6, HX - 4.4, 1.5, -1.6, ice); k.box(1.6, 1.1, 1.4, HX - 5.2, 1.6, 1.8, ice);
    k.plane(5, 4.5, HX - 6.3, HH / 2 + 0.2, 0, blueGlow, PI / 2);
    k.point(HX - 3.2, 4.4, 0, 0x7fc4ff, 70, 14, 1.6);
    {
      const pen = mergeGeometries([new T.CapsuleGeometry(0.16, 0.34, 3, 8).translate(0, 0.42, 0), new T.SphereGeometry(0.11, 8, 6).translate(0, 0.78, 0), new T.BoxGeometry(0.05, 0.28, 0.16).translate(0.15, 0.4, 0), new T.BoxGeometry(0.05, 0.28, 0.16).translate(-0.15, 0.4, 0)])!;
      const prnd = X.mulberry(1713), pts: T.Matrix4[] = [];
      for (let i = 0; i < 16; i++) pts.push(new T.Matrix4().compose(v(HX - 1.6 - prnd() * 3.6, 1.35, -2.8 + prnd() * 5.6), new T.Quaternion().setFromAxisAngle(up, prnd() * 6.3), v(1, 0.9 + prnd() * 0.3, 1)));
      k.instances(pen, penB, pts);
      k.instances(new T.CapsuleGeometry(0.11, 0.3, 3, 8).translate(0.07, 0.42, 0), penW, pts);
    }
    for (const z of [-7.5, 7.5]) hang(mounts, HX + 0.16, 2.4, z, PI / 2, 2.0, 1.5, st, 3.2);
    k.sign('PENGUINS', 2.6, 0.4, HX + 0.18, 5.6, 0, 'transparent', '#e8dfc8', 60, PI / 2);

    /* ---- the entrance on the south: brick walls with the way in, the census wall, the zoo's name ---- */
    const EZ = 22;
    wallX(k, -20, 20, EZ, 3.6, 0.6, brick, [{ c: 0, w: 5, h: 3.6 }]);
    for (const x of [-2.9, 2.9]) { k.box(1.2, 4.4, 1.2, x, 2.2, EZ, brickD); k.box(1.5, 0.3, 1.5, x, 4.5, EZ, lime); }
    k.box(6.8, 0.4, 1.0, 0, 4.6, EZ, lime);
    k.sign('CENTRAL PARK ZOO', 5.4, 0.56, 0, 4.0, EZ - 0.52, 'transparent', '#2a2018', 60, PI);
    for (const x of [7.5, 12.5, 17]) hang(mounts, x, 2.0, EZ - 0.31, PI, 2.0, 1.5, st, 3.2);
    k.censusWall({ x: -11, y: 2.0, z: EZ - 0.31, rotY: PI, cols: 10, rows: 4, tile: 0.5, gap: 0.04, start: ctx.wallStart(850, 40), pieces: ctx.all, backing: brickD });

    /* ---- the Delacorte Musical Clock on its arch to the north ---- */
    const CZ = -24;
    wallX(k, -14, 14, CZ, 4.2, 0.7, brick, [{ c: 0, w: 4.6, h: 4.2 }]);
    for (const x of [-3.0, 3.0]) { k.box(1.6, 5.6, 1.6, x, 2.8, CZ, brickD); k.box(1.9, 0.3, 1.9, x, 5.75, CZ, lime); }
    for (let i = 0; i < 13; i++) { const a = (i + 0.5) / 13 * PI, s = k.box(2.3 * PI / 13 + 0.03, 0.5, 1.5, Math.cos(a) * 2.5, 3.5 + Math.sin(a) * 2.5, CZ, i === 6 ? lime : brickD); s.rotation.z = a + PI / 2; }
    k.box(7.2, 0.6, 1.7, 0, 6.2, CZ, lime);
    /* the clock tower: a limestone box with the dial on both faces, the carousel ring above, the bell on top */
    k.box(2.4, 2.6, 1.7, 0, 7.8, CZ, lime);
    {
      const dialTex = (() => {
        const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d')!;
        g.fillStyle = '#f2ead6'; g.beginPath(); g.arc(128, 128, 122, 0, PI * 2); g.fill();
        g.strokeStyle = '#3a2a18'; g.lineWidth = 8; g.beginPath(); g.arc(128, 128, 118, 0, PI * 2); g.stroke();
        for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; g.lineWidth = i % 3 ? 4 : 8; g.beginPath(); g.moveTo(128 + Math.cos(a) * 96, 128 + Math.sin(a) * 96); g.lineTo(128 + Math.cos(a) * 112, 128 + Math.sin(a) * 112); g.stroke(); }
        const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
      })();
      const dialM = new T.MeshStandardMaterial({ map: dialTex, roughness: 0.6, transparent: true, alphaTest: 0.5 });
      for (const s of [-1, 1]) {
        const d = k.plane(1.8, 1.8, 0, 7.9, CZ + s * 0.86, dialM, s > 0 ? 0 : PI);
        void d;
        const hands = new T.Group(); hands.position.set(0, 7.9, CZ + s * 0.9); k.add(hands);
        const hh = new T.Mesh(new T.BoxGeometry(0.06, 0.5, 0.03).translate(0, 0.22, 0), iron), mh = new T.Mesh(new T.BoxGeometry(0.04, 0.72, 0.03).translate(0, 0.33, 0), iron);
        hands.add(hh, mh);
        if (!ctx.reduced) k.ticks.push(() => { const c = nyClock(); hh.rotation.z = -s * ((c.h % 12) + c.m / 60) / 12 * PI * 2; mh.rotation.z = -s * (c.m + c.s / 60) / 60 * PI * 2; });
      }
    }
    k.box(2.8, 0.3, 2.1, 0, 9.25, CZ, lime);
    /* the carousel of six bronze animals with their instruments, and the two monkeys at the bell */
    const ring = new T.Group(); ring.position.set(0, 9.4, CZ); k.add(ring);
    {
      const animals: T.BufferGeometry[] = [
        /* bear, upright, tambourine */ mergeGeometries([part(0.5, 0.8, 0.36, 0, 0.55, 0), part(0.34, 0.3, 0.3, 0, 1.08, 0.04), part(0.1, 0.1, 0.1, 0.12, 1.24, 0.06), part(0.1, 0.1, 0.1, -0.12, 1.24, 0.06), part(0.12, 0.5, 0.12, 0.36, 0.95, 0.12, 0, 0), part(0.12, 0.5, 0.12, -0.36, 0.95, 0.12), new T.CylinderGeometry(0.16, 0.16, 0.04, 12).translate(0.4, 1.22, 0.2)])!,
        /* elephant, accordion */ mergeGeometries([part(0.8, 0.6, 0.5, 0, 0.6, 0), part(0.44, 0.44, 0.4, 0, 0.95, 0.42), part(0.32, 0.5, 0.06, 0.28, 0.9, 0.5), part(0.32, 0.5, 0.06, -0.28, 0.9, 0.5), part(0.1, 0.5, 0.1, 0, 0.6, 0.62, 0.2), part(0.12, 0.34, 0.12, 0.28, 0.17, 0.16), part(0.12, 0.34, 0.12, -0.28, 0.17, 0.16), part(0.12, 0.34, 0.12, 0.28, 0.17, -0.16), part(0.12, 0.34, 0.12, -0.28, 0.17, -0.16), part(0.36, 0.26, 0.2, 0, 0.62, 0.72)])!,
        /* goat, horn */ mergeGeometries([part(0.6, 0.34, 0.26, 0, 0.62, 0), part(0.22, 0.34, 0.22, 0.32, 0.9, 0), part(0.08, 0.26, 0.06, 0.34, 1.14, 0.06, 0.3), part(0.08, 0.26, 0.06, 0.34, 1.14, -0.06, -0.3), part(0.08, 0.45, 0.08, 0.2, 0.22, 0.08), part(0.08, 0.45, 0.08, -0.2, 0.22, 0.08), part(0.08, 0.45, 0.08, 0.2, 0.22, -0.08), part(0.08, 0.45, 0.08, -0.2, 0.22, -0.08), new T.ConeGeometry(0.1, 0.4, 8).rotateZ(-PI / 2).translate(0.62, 0.86, 0)])!,
        /* hippo, violin */ mergeGeometries([part(0.5, 0.7, 0.44, 0, 0.5, 0), part(0.42, 0.34, 0.5, 0, 0.98, 0.1), part(0.14, 0.14, 0.14, 0.14, 1.18, -0.06), part(0.14, 0.14, 0.14, -0.14, 1.18, -0.06), part(0.12, 0.44, 0.12, 0.34, 0.9, 0.1, 0, 0), part(0.28, 0.16, 0.06, -0.3, 0.98, 0.28, 0.4)])!,
        /* kangaroo, french horn */ mergeGeometries([part(0.34, 0.7, 0.3, 0, 0.6, 0), part(0.2, 0.22, 0.34, 0, 1.06, 0.1), part(0.06, 0.2, 0.06, 0.06, 1.24, 0), part(0.06, 0.2, 0.06, -0.06, 1.24, 0), part(0.14, 0.5, 0.14, 0.14, 0.25, 0.04), part(0.14, 0.5, 0.14, -0.14, 0.25, 0.04), part(0.1, 0.1, 0.7, 0, 0.16, -0.4, 0, 0), new T.TorusGeometry(0.16, 0.05, 6, 14).translate(0.3, 0.9, 0.18)])!,
        /* penguin, drums */ mergeGeometries([new T.CapsuleGeometry(0.18, 0.4, 3, 8).translate(0, 0.5, 0), new T.SphereGeometry(0.13, 8, 6).translate(0, 0.9, 0), part(0.05, 0.3, 0.16, 0.2, 0.55, 0, -0.6), part(0.05, 0.3, 0.16, -0.2, 0.55, 0, 0.6), new T.CylinderGeometry(0.16, 0.16, 0.2, 12).translate(0, 0.4, 0.34)])!,
      ];
      animals.forEach((g, i) => { const a = (i / 6) * PI * 2, r = 1.95; const o = new T.Mesh(g, i % 2 ? bronzeL : bronze); o.position.set(Math.sin(a) * r, 0, Math.cos(a) * r); o.rotation.y = a + PI / 2; ring.add(o); });
      const plate = new T.Mesh(new T.CylinderGeometry(2.5, 2.5, 0.16, 32), gold); plate.position.y = -0.08; ring.add(plate);
      const rail = new T.Mesh(new T.TorusGeometry(2.5, 0.03, 6, 48), gold); rail.rotation.x = PI / 2; rail.position.y = 0.55; ring.add(rail);
    }
    k.cyl(0.12, 2.0, 0, 10.4, CZ, gold, 0.12, 8);
    k.lathe([[0.02, 0.5], [0.3, 0.42], [0.42, 0.2], [0.44, 0]], 0, 11.5, CZ, bell, 16);
    k.box(0.9, 0.1, 0.9, 0, 12.05, CZ, lime); for (const s of [-1, 1]) k.cyl(0.05, 2.4, s * 0.42, 10.85, CZ, gold, 0.05, 6);
    const monkeys: T.Group[] = [];
    for (const s of [-1, 1]) {
      const g = new T.Group(); g.position.set(s * 0.7, 9.35, CZ); g.rotation.y = s > 0 ? -PI / 2 : PI / 2; k.add(g);
      g.add(new T.Mesh(mergeGeometries([part(0.28, 0.44, 0.24, 0, 0.32, 0), part(0.2, 0.2, 0.2, 0, 0.66, 0.02), part(0.1, 0.36, 0.1, -0.16, 0.3, 0.02, -0.2)])!, bronzeL));
      const arm = new T.Group(); arm.position.set(0.16, 0.52, 0.02); arm.add(new T.Mesh(part(0.08, 0.42, 0.08, 0, -0.18, 0), bronzeL), new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.16, 8).rotateZ(PI / 2).translate(0, -0.4, 0), gold)); g.add(arm);
      g.userData.arm = arm; monkeys.push(g);
    }
    /* the animals turn for the first minute of the hour and the half hour, and the monkeys strike */
    if (!ctx.reduced) k.ticks.push((t, dt) => {
      const c = nyClock(), playing = c.m % 30 === 0;
      const spd = playing ? 0.5 : 0; ring.rotation.y += spd * Math.min(dt, 0.1);
      monkeys.forEach((g, i) => { const arm = g.userData.arm as T.Group; const target = playing ? 0.5 + 0.9 * Math.max(0, Math.sin(t * 4.2 + i * PI)) : 0.2; arm.rotation.x += (target - arm.rotation.x) * Math.min(1, dt * 10); });
    });
    /* the works on the flanking walls, facing the garden */
    for (const x of [-11, -7, 7, 11]) hang(mounts, x, 2.2, CZ + 0.36, 0, 2.0, 1.5, st, 3.2);
    /* the Children's Zoo side of the arch: a path under trees */
    for (const [x, z] of [[-6, -30], [6, -31], [-3, -36], [4, -37]]) { k.tree(x, 0, z, { h: 7, r: 3.2, seed: 1714 + Math.abs(x) }); k.keepOut.push({ x, z, r: 0.8 }); }

    /* ---- the sea lions: four on a submerged loop that breaks the surface and crosses the rock ---- */
    const mkSeal = (scale: number) => {
      const g = new T.Group();
      const bg = new T.LatheGeometry([[0.02, -1.2], [0.16, -0.9], [0.3, -0.2], [0.34, 0.4], [0.26, 0.95], [0.16, 1.2], [0.02, 1.35]].map((p) => new T.Vector2(p[0], p[1])), 12); bg.rotateX(-PI / 2);
      g.add(new T.Mesh(bg, seal));
      const nose = new T.Mesh(new T.SphereGeometry(0.1, 8, 6), sealW); nose.position.set(0, 0.06, 1.4); g.add(nose);
      for (const s of [-1, 1]) { const fl = new T.Mesh(new T.BoxGeometry(0.5, 0.05, 0.3), sealW); fl.position.set(s * 0.4, -0.12, 0.35); fl.rotation.y = -s * 0.4; fl.rotation.z = s * 0.35; g.add(fl); }
      const tail = new T.Group(); tail.position.set(0, 0, -1.15); g.add(tail);
      for (const s of [-1, 1]) { const fl = new T.Mesh(new T.BoxGeometry(0.28, 0.04, 0.4), sealW); fl.position.set(s * 0.14, 0, -0.2); fl.rotation.y = s * 0.35; tail.add(fl); }
      g.scale.setScalar(scale);
      k.add(g);
      return { g, tail };
    };
    const loop = [v(6.2, -0.8, 0.5), v(4.4, -0.2, 4.8), v(-0.5, -0.9, 6.4), v(-5.6, -0.4, 2.4), v(-6.2, -1.0, -3.0), v(-2.2, -0.15, -6.2), v(2.6, 0.5, -2.8), v(1.0, 0.95, 0.0), v(4.2, -0.3, 2.0)];
    /* the swimmers are the Blender prop (nose along -z, which k.rider treats as forward); the prop
       loads async, so each rider is attached when its object arrives */
    const sealsOut: { g: T.Group; tail: T.Group }[] = [];
    if (!ctx.reduced) {
      const curve = k.spline(loop, true);
      [1.15, 0.95, 1.05, 0.85].forEach((s, i) => {
        k.prop('sealion_swim', loop[i].x, loop[i].y, loop[i].z, { height: 0.75 * s }).then((o) => { if (o) k.rider(o, curve, 1.3 + (i % 2) * 0.3, i * 9); });
      });
      vapour(k, [v(4.4, -0.3, 4.8), v(-2.2, -0.3, -6.2)], 14, { rise: 0.9, spread: 0.7, size: 0.07, opacity: 0.35, colour: 0xf0f8ff, seed: 1715, speed: 0.4, animate: true });
    } else { k.prop('sealion_swim', 2.4, 0.5, -2.2, { height: 0.8, rotY: 0.8 }); }
    /* one hauled out on the rock, chest up, and one asleep beside it */
    k.prop('sealion', -0.6, 0.55, 1.4, { height: 1.1, rotY: 2.4 });
    k.prop('sealion', 1.5, 0.62, -1.3, { height: 0.95, rotY: -1.1 });
    /* the greeter: it lies on the rock until you come to the glass, then swims over and looks at you */
    const REST = v(-1.3, 0.62, -1.7);
    const greet = mkSeal(1.0); greet.g.position.copy(REST); greet.g.rotation.y = -0.6;
    const gTarget = REST.clone(), gLook = new T.Vector3();
    /* feeding: the keeper on the ledge with a bucket, fish in the air, and a crowd at the rail */
    const keeper = new T.Group(); keeper.position.set(0, 0.5, PR - 0.5); k.add(keeper);
    keeper.add(new T.Mesh(figureGeo(0.2, 0.8, 1.34), keeperM));
    { const cap = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 0.08, 10), keeperM); cap.position.y = 1.5; keeper.add(cap); const b = new T.Mesh(new T.CylinderGeometry(0.16, 0.13, 0.3, 10), bucket); b.position.set(0.34, 0.5, 0); keeper.add(b); }
    void skin;
    const fishM = new T.Mesh(new T.BoxGeometry(0.06, 0.05, 0.22), fish); fishM.position.set(0, 1.2, PR - 0.9); k.add(fishM);
    const crowdPts: { x: number; y: number; z: number; ry: number }[] = [];
    { const r = X.mulberry(1716); for (let i = 0; i < 26; i++) { const a = -1.15 + (i / 25) * 2.3 + (r() - 0.5) * 0.06, rr = PR + 1.6 + (i % 2) * 0.75 + r() * 0.3; crowdPts.push({ x: Math.sin(a) * rr, y: 0, z: Math.cos(a) * rr, ry: a + PI }); } }
    const feedCrowd = still(k, crowdPts, 1717, [0xe63946, 0x1d3557, 0xf1c40f, 0x2a9d8f, 0xe0dcd0, 0x264653, 0x8a3a3a, 0x3a3230])!;
    feedCrowd.frustumCulled = false;
    const feedNow = () => { const c = nyClock(); return (c.min >= 11 * 60 + 30 && c.min < 11 * 60 + 50) || (c.min >= 15 * 60 + 30 && c.min < 15 * 60 + 50); };
    const setFeed = (on: boolean) => {
      const m = new T.Matrix4(), q = new T.Quaternion();
      crowdPts.forEach((p, i) => { q.setFromAxisAngle(up, p.ry); m.compose(v(p.x, 0, p.z), q, on ? v(1, 1.1, 1) : hide); feedCrowd.setMatrixAt(i, m); });
      feedCrowd.instanceMatrix.needsUpdate = true;
      keeper.scale.copy(on ? one : hide); fishM.visible = on;
    };
    setFeed(feedNow());
    if (!ctx.reduced) {
      let feedState = feedNow(), tf = 0;
      k.ticks.push((t, dt) => {
        sealsOut.forEach((o, i) => { o.tail.rotation.y = 0.35 * Math.sin(t * 3.2 + i * 1.1); });
        const f = feedNow(); if (f !== feedState) { feedState = f; setFeed(f); }
        if (f) { tf = (tf + dt) % 2.2; const u = tf / 2.2; fishM.position.set(0.3 - u * 1.6, 1.4 + 3.2 * u * (1 - u), PR - 0.9 - u * 3.4); fishM.rotation.x = u * 6; }
        /* the greeter comes to the glass nearest the visitor */
        const c = cam();
        if (c) {
          const cx = c.position.x, cz = c.position.z, d = Math.hypot(cx, cz);
          if (d < PR + 4.2 && d > PR - 1) { const s = (PR - 1.0) / d; gTarget.set(cx * s, -0.05, cz * s); gLook.set(cx, 0.6, cz); }
          else { gTarget.copy(REST); gLook.set(6, 0.3, 4); }
        }
        const l = Math.min(1, dt * 0.9); greet.g.position.lerp(gTarget, l);
        const near = greet.g.position.distanceTo(gTarget) < 0.6;
        greet.g.position.y += near ? 0.03 * Math.sin(t * 2.4) * dt : 0;
        if (!near) { const dir = gTarget.clone().sub(greet.g.position); dir.y = 0; if (dir.lengthSq() > 1e-4) { const want = Math.atan2(dir.x, dir.z); greet.g.rotation.y += Math.atan2(Math.sin(want - greet.g.rotation.y), Math.cos(want - greet.g.rotation.y)) * l * 2; } }
        else { const dir = gLook.clone().sub(greet.g.position); const want = Math.atan2(dir.x, dir.z); greet.g.rotation.y += Math.atan2(Math.sin(want - greet.g.rotation.y), Math.cos(want - greet.g.rotation.y)) * l; }
        greet.tail.rotation.y = 0.3 * Math.sin(t * 2.8);
      });
    }
    /* visitors walking the garden, and a few coming in from Fifth Avenue */
    k.crowd([v(-13.5, 0, -11), v(0, 0, -12.8), v(13.5, 0, -11), v(14.2, 0, 0), v(13.5, 0, 11), v(0, 0, 12.8), v(-13.5, 0, 11), v(-14.2, 0, 0)], 16, { seed: 1718, spread: 1.0, speed: 0.9, animate: !ctx.reduced, closed: true });
    k.crowd([v(0, 0, 27), v(0.6, 0, 16), v(-4, 0, 12.5), v(-11, 0, 8), v(-14, 0, 0), v(-12, 0, -8), v(-4, 0, -12.6), v(0, 0, -20), v(0, 0, -28)], 8, { seed: 1719, spread: 0.8, speed: 1.0, animate: !ctx.reduced });

    /* ---- what the garden knows ---- */
    const zoo = { name: 'Central Park Zoo, Wikipedia', url: 'https://en.wikipedia.org/wiki/Central_Park_Zoo' };
    k.egg(v(0, 3.4, EZ - 0.4), { id: 'zoo-1864', title: 'The second public zoo', year: '1864', text: 'A menagerie stood here from 1864, which makes this the second publicly owned zoo in the United States, after Philadelphia\'s of 1859. The zoo of 1934 opened on December 2 of that year.', clue: 'Read the name over the way in and ask how long there have been animals behind it.', source: zoo }, { r: 2.4 });
    k.egg(v(PX - 0.6, 2.4, 0), { id: 'zoo-1988', title: 'Six and a half acres, rebuilt', year: '1988', text: 'The zoo reopened on August 8, 1988 after a rebuild by Kevin Roche of Kevin Roche John Dinkeloo Associates that cost 35 million dollars against a first budget of 8.3 million: three naturalistic habitats on six and a half acres, run by the Wildlife Conservation Society.', clue: 'The brick pergola with the wooden trellis on top is the 1988 zoo. Stand under it.', source: zoo }, { r: 1.8 });
    k.egg(v(0, 1.6, PR + 0.8), { id: 'zoo-count', title: 'One thousand four hundred and eighty seven', year: '2016', text: 'The glass fence round the pool lets visitors watch the sea lions. In 2016 the zoo held 1,487 animals of 163 species, and about a million people a year came through the gates in 2006 and 2007.', clue: 'Put your hands on the glass and count what swims past.', source: zoo }, { r: 1.6 });
    k.egg(v(0, 9.4, CZ), { id: 'delacorte-clock', title: 'The clock that plays every half hour', year: '1965', text: 'George T. Delacorte gave the clock after seeing the automaton clocks of Europe; Andrea Spadini made its eight bronze animals, a bear on the tambourine, an elephant on the accordion, a goat on the horn, a hippo on the violin, a kangaroo on the French horn, a penguin on the drums and two monkeys at the bell. It was unveiled in 1965 on the brick and limestone gateway by Fernando Texidor and Edward Coe Embury, and it plays every thirty minutes from eight in the morning until six.', clue: 'Wait under the arch for the hour or the half hour and look up.', source: { name: 'Delacorte Clock, Wikipedia', url: 'https://en.wikipedia.org/wiki/Delacorte_Clock' } }, { r: 3.2 });
    k.egg(v(AX - 0.8, 5.0, 0), { id: 'arsenal-1851', title: 'Older than the park', year: '1851', text: 'Martin E. Thompson designed the Arsenal and it went up between 1847 and 1851 as a storehouse for the arms of the New York State Militia, a symmetrical brick building with half octagonal towers. Only Blockhouse No. 1 of 1814 is older inside the park. It has been a zoo, a police precinct and a weather bureau, it held the American Museum of Natural History\'s collections while that museum was built, and today the Parks Department has its offices here with the Greensward Plan on the third floor.', clue: 'The brick fort on the east side of the garden was here before Central Park was.', source: { name: 'Arsenal (Central Park), Wikipedia', url: 'https://en.wikipedia.org/wiki/Arsenal_(Central_Park)' } }, { r: 3.0 });
    k.egg(v(HX + 0.6, 3.0, 0), { id: 'zoo-feedings', title: 'Half past eleven and half past three', text: 'On the zoo\'s own schedule the sea lions are fed at 11:30 in the morning and 3:30 in the afternoon, and the penguins at 10:40 and 2:30. The penguin house keeps macaroni, king, chinstrap and gentoo penguins. The zoo opens at ten and closes at five, last entry at four.', clue: 'The blue light on the west side of the garden is the coldest room in the park.', source: { name: 'Central Park Zoo, the zoo\'s own site', url: 'https://centralparkzoo.com/' } }, { r: 2.4 });

    return { mounts, spawn: v(0, 3, 19.5), look: v(0, 2.6, -24), eye: 3, bounds: [-21.6, 23.6, -38, 27.5], style: st };
  },
};

/* ================================================================== */
/* ---------------- 172 SHAKESPEARE IN THE PARK ---------------- */
export const delacorte: RoomDef = {
  id: 'delacorte',
  name: 'Shakespeare in the Park',
  area: 'THE DELACORTE THEATER / CENTRAL PARK',
  mood: 'Curtain at eight, the castle lit behind the stage',
  color: '#2a3a5a',
  daylit: false,
  description: 'The Delacorte Theater on a summer night, the free Shakespeare in the Park of the Public Theater. You stand at the top of the bowl with the house full below you, five players moving between their marks on the open stage, the lights sweeping and changing colour, Turtle Pond black behind the stage with fireflies over it and Belvedere Castle lit on Vista Rock above, a moon over the trees. Before eight the house lights are up and the stage waits; from eight the house goes dark and the play is on. The New Yorkers hang on the theatre\'s outer wall, in the lobby and on the boards along the ticket line, never on the stage.',
  signatures: 'The semicircular bowl of seats full to the top, the thrust stage with its wooden set and stair, the lighting towers and their beams, Turtle Pond behind the stage, Belvedere Castle on Vista Rock with its tower and conical cap floodlit, the moon, the fireflies over the water, the laugh that goes through the house, the queue rail and the boards along it, and the wooden slat wall of the rebuilt theatre.',
  build(k, ctx) {
    k.sky({ top: 0x05070f, horizon: 0x141c30, ground: 0x05070a, fog: 0.0028, stars: 900, env: 0.4 });
    k.hemi(0x6a7aa0, 0x141418, 0.55);
    k.sun(0xaab8e0, 0.35, -30, 80, -40, true, 90);
    const seatM = k.flat(0x2a3a5a, 0, 0.85), tread = k.pbr('dcTread', X.concrete(0x5a5c60, 172), 0.6, { roughness: 0.9 }), riser = k.flat(0x3a3c42, 0, 0.9),
      stageM = k.pbr('dcStage', X.planks(0x4a3826, 8, 173), 0.7, { roughness: 0.7 }), setM = k.pbr('dcSet', X.planks(0x6a5038, 6, 174), 0.6, { roughness: 0.7 }),
      slat = k.pbr('dcSlat', X.planks(0x8a6a48, 10, 175), 0.7, { roughness: 0.65 }), slatD = k.flat(0x3a2c20, 0, 0.8),
      steel = k.flat(0x3a3e44, 0.7, 0.45), iron = k.flat(0x1a1c20, 0.6, 0.5), grassM = k.pbr('dcGrass', X.grass(0x2a3a24, 176), 1, { roughness: 1 }),
      walk = k.pbr('dcWalk', X.pavers(0x5a5852, 177), 0.5), rock = k.flat(0x3c3a38, 0, 0.95), castle = k.pbr('dcCastle', X.ashlar(0x8a8478, 178, 5), 0.5, { normal: 0.4, roughness: 0.85 }),
      castleLit = k.flat(0xb8a888, 0, 0.8, { emissive: 0x6a5a3a, emissiveIntensity: 0.5 }), cap = k.flat(0x2a2e34, 0.2, 0.7),
      warmWin = new T.MeshBasicMaterial({ color: 0xffd890 }), moonM = new T.MeshBasicMaterial({ color: 0xf4f0e0 }),
      perfM = [0xe63946, 0xf1c40f, 0xe0dcd0, 0x2a9d8f, 0x8a3a8a].map((c) => k.flat(c, 0, 0.8));
    const mounts: Mount[] = [], st: FrameStyle = 'black';
    const CZ = -4, ROWS = 20, R0 = 7.5, RISE = 0.38, ANG = 1.2;
    const bottom = -RISE * ROWS;

    /* ---- the ground: the park at y 0, the bowl dug into it ---- */
    k.box(160, 0.2, 60, 0, -0.1, CZ + 62, grassM);
    for (const s of [-1, 1]) k.box(60, 0.2, 80, s * 62, -0.1, CZ - 8, grassM);
    k.box(24, 0.22, 34, 0, -0.1, CZ + 47, walk);
    k.mesh(ringXZ(30.8, 36, -1.6, 1.6, 48), walk, 0, 0.02, CZ);

    /* ---- the bowl: twenty rows stepping down to the stage, a seat and a New Yorker in every one ---- */
    const seats: { x: number; y: number; z: number; a: number; r: number }[] = [];
    for (let i = 0; i < ROWS; i++) {
      const r = R0 + (ROWS - 1 - i), y = -RISE * (i + 1);
      k.mesh(ringXZ(r - 0.5, r + 0.5, -ANG, ANG, 40), tread, 0, y, CZ);
      k.mesh(new T.CylinderGeometry(r + 0.5, r + 0.5, RISE, 40, 1, true, PI - ANG, 2 * ANG), riser, 0, y + RISE / 2, CZ);
      const n = Math.floor((r * 2 * ANG) / 0.6);
      for (let j = 0; j < n; j++) {
        const a = -ANG + ((j + 0.5) / n) * 2 * ANG;
        if (Math.abs(a) < 0.045 || Math.abs(Math.abs(a) - 0.72) < 0.045) continue;
        seats.push({ x: Math.sin(a) * (r + 0.1), y, z: CZ + Math.cos(a) * (r + 0.1), a, r });
      }
    }
    /* the promenade at the top, the front cross aisle, the side walls of the bowl */
    k.mesh(ringXZ(R0 + ROWS - 0.5, 31.2, -1.5, 1.5, 48), walk, 0, 0.0, CZ);
    k.mesh(ringXZ(4.6, R0 - 0.5, -ANG - 0.1, ANG + 0.1, 40), tread, 0, bottom, CZ);
    k.mesh(new T.CylinderGeometry(R0 + ROWS - 0.5, R0 + ROWS - 0.5, RISE, 48, 1, true, PI - ANG, 2 * ANG), riser, 0, -RISE / 2, CZ);
    /* the sides of the bowl: a low parapet stepping down with the rake, the wooded bank outside it */
    for (const s of [-1, 1]) {
      const a = s * (ANG + 0.03), sa = Math.sin(a), ca = Math.cos(a);
      for (let i = 0; i <= ROWS; i++) {
        const r = R0 + ROWS - 0.5 - i, y = -RISE * i, rr = Math.max(r, 4.6);
        const w = k.box(1.06, 1.1, 0.4, sa * rr, y + 0.55, CZ + ca * rr, slatD); w.rotation.y = -a + PI / 2;
      }
      for (let i = 0; i <= 12; i++) { const u = i / 12, rr = 4.6 + u * (R0 + ROWS - 4); k.keepOut.push({ x: sa * rr, z: CZ + ca * rr, r: 1.3 }); }
      k.mesh(ringXZ(4.6, 31.2, s > 0 ? ANG + 0.05 : -1.55, s > 0 ? 1.55 : -ANG - 0.05, 24), grassM, 0, bottom + 0.05, CZ);
      for (let i = 0; i < 5; i++) { const b = s * (ANG + 0.28 + i * 0.07), r = 9 + i * 4.4; k.tree(Math.sin(b) * r, bottom, CZ + Math.cos(b) * r, { h: 8 + i, r: 3.6, seed: 1760 + i + (s > 0 ? 10 : 0), leaf: 0x1e3020 }); }
    }
    /* the seats: one instanced box each; the audience: one two box figure each, coloured */
    const N = seats.length;
    {
      const sm = new T.Matrix4(), q = new T.Quaternion();
      const sg = mergeGeometries([new T.BoxGeometry(0.5, 0.08, 0.44).translate(0, 0.42, 0), new T.BoxGeometry(0.5, 0.5, 0.08).translate(0, 0.66, -0.22)])!;
      const seatI = k.instances(sg, seatM, seats.map((s) => { q.setFromAxisAngle(up, s.a + PI); return sm.compose(v(s.x, s.y, s.z), q, one).clone(); }));
      void seatI;
    }
    const house = k.instances(boxFigureGeo(0.4, 0.58, 0.26, 0.22), new T.MeshStandardMaterial({ roughness: 0.9 }), Array.from({ length: N }, () => new T.Matrix4()));
    house.frustumCulled = false;
    const hs = new Float32Array(N), ph = new Float32Array(N), face = new Float32Array(N);
    {
      const rnd = X.mulberry(1721), c = new T.Color(), pal = [0x1c232c, 0xe8e2d4, 0x2a3f6a, 0x8a2a2a, 0xd8c04a, 0x3a5a3a, 0xf0f0f0, 0x6a4a8a, 0x2b5f6e, 0xd07a3a, 0x24262c, 0x8a3a3a];
      for (let i = 0; i < N; i++) { house.setColorAt(i, c.set(pal[Math.floor(rnd() * pal.length)])); hs[i] = 0.9 + rnd() * 0.25; ph[i] = rnd() * 6.3; face[i] = seats[i].a + PI; }
      if (house.instanceColor) house.instanceColor.needsUpdate = true;
    }
    const m4 = new T.Matrix4(), q4 = new T.Quaternion(), p4 = new T.Vector3(), s4 = new T.Vector3();
    const placeHouse = (t: number, laugh: number, c: T.Camera | null) => {
      for (let i = 0; i < N; i++) {
        const s = seats[i];
        const wave = laugh > 0 ? laugh * 0.18 * Math.max(0, Math.sin(t * 2.2 - s.r * 0.35 + ph[i] * 0.3)) : 0;
        let ry = face[i];
        if (c) { const dx = c.position.x - s.x, dz = c.position.z - s.z; if (dx * dx + dz * dz < 30) ry = Math.atan2(dx, dz); }
        p4.set(s.x, s.y + 0.4 + wave, s.z); q4.setFromAxisAngle(up, ry); s4.set(1, hs[i] + wave * 0.5, 1);
        m4.compose(p4, q4, s4); house.setMatrixAt(i, m4);
      }
      house.instanceMatrix.needsUpdate = true;
    };
    placeHouse(0, 0, null);

    /* ---- the stage: a thrust at the foot of the bowl, the set behind it, the towers ---- */
    const SY = bottom + 0.9, SZ0 = CZ - 3.5, SZ1 = CZ - 17;
    k.box(30, SY - bottom + 3, SZ0 - SZ1, 0, (SY + bottom - 3) / 2, (SZ0 + SZ1) / 2, stageM);
    k.mesh(new T.CylinderGeometry(4.6, 4.6, SY - bottom, 40, 1, false, PI - 1.3, 2.6), stageM, 0, (SY + bottom) / 2, CZ);
    k.mesh(new T.CylinderGeometry(4.6, 4.6, 0.02, 40, 1, false, PI - 1.3, 2.6), stageM, 0, SY + 0.01, CZ);
    k.block(-15.5, 15.5, SZ1 - 1, SZ0 + 0.3); k.keepOut.push({ x: 0, z: CZ, r: 5.0 });
    /* the set: a two storey wooden frame with a balcony and a stair, doorways, no lettering */
    for (const x of [-9, -3, 3, 9]) k.box(0.4, 7.5, 0.4, x, SY + 3.75, SZ1 + 3, setM);
    k.box(19, 0.3, 3.2, 0, SY + 4.0, SZ1 + 2.6, setM); k.box(19, 0.9, 0.12, 0, SY + 4.6, SZ1 + 4.2, setM);
    for (let x = -9.2; x <= 9.2; x += 0.5) k.box(0.06, 0.9, 0.06, x, SY + 4.6, SZ1 + 4.2, setM);
    k.box(19.4, 0.4, 0.5, 0, SY + 7.6, SZ1 + 3, setM);
    k.box(6, 3.6, 0.3, -6, SY + 1.8, SZ1 + 1.6, setM); k.box(6, 3.6, 0.3, 6, SY + 1.8, SZ1 + 1.6, setM);
    { const N2 = 10; for (let i = 0; i < N2; i++) k.box(1.4, 0.16, 0.5, 11.2, SY + 0.4 + i * 0.4, SZ1 + 6.5 - i * 0.5, setM); }
    k.box(2.6, 0.6, 1.4, 0, SY + 0.3, SZ0 - 4, setM);
    /* lighting towers either side of the stage, spots on them */
    const beamM = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.045, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
    const lights: { L: T.SpotLight; beam: T.Mesh; base: T.Vector3; ph: number; hue: number }[] = [];
    for (const s of [-1, 1]) {
      const tx = s * 17, tz = CZ - 6;
      for (let i = 0; i < 4; i++) { const a = (i / 4) * PI * 2; k.box(0.16, 12, 0.16, tx + Math.sin(a) * 0.6, bottom + 6, tz + Math.cos(a) * 0.6, steel); }
      for (let y = bottom + 2; y < bottom + 12; y += 2) k.box(1.3, 0.1, 1.3, tx, y, tz, steel);
      k.keepOut.push({ x: tx, z: tz, r: 1.3 });
      for (let i = 0; i < 2; i++) {
        const base = v(tx, bottom + 9 + i * 1.6, tz);
        const L = k.spot(base.x, base.y, base.z, 0, SY + 1.4, CZ - 9, 0xfff1d6, 0, 0.26, 0.4, 34);
        const beam = k.mesh(new T.CylinderGeometry(0.12, 2.6, 22, 12, 1, true).translate(0, -11, 0), beamM, base.x, base.y, base.z, true);
        lights.push({ L, beam, base, ph: (s + 1) * 1.3 + i * 2.1, hue: (i + (s + 1)) * 0.23 });
      }
    }
    /* the front of house lights: warm points over the bowl, up before the show */
    const houseLights: T.PointLight[] = [];
    for (const [x, z] of [[-12, CZ + 14], [12, CZ + 14], [0, CZ + 24]]) houseLights.push(k.point(x, 8, z, 0xffd8a0, 0, 40, 1.4));
    const stageWash = k.point(0, SY + 8, SZ1 + 6, 0xfff4e0, 0, 44, 1.5);
    k.point(0, SY + 6, SZ0 - 6, 0x8fa0d0, 26, 30, 1.5);
    for (const s of [-1, 1]) k.point(s * 9, SY + 5.5, SZ1 + 4.5, 0xffe0b0, 14, 16, 1.6);
    /* five players on their marks, moving between them, no faces, no play */
    const players: { g: T.Group; marks: T.Vector3[]; i: number; t: number }[] = [];
    const markSets = [
      [v(-5, SY, SZ0 - 7), v(-2, SY, SZ0 - 3), v(-7, SY, SZ0 - 11), v(0, SY, SZ0 - 9)],
      [v(5, SY, SZ0 - 6), v(2.5, SY, SZ0 - 2.5), v(7, SY, SZ0 - 10), v(3, SY, SZ0 - 12)],
      [v(0, SY, SZ0 - 5), v(-3, SY, SZ0 - 1.5), v(4, SY, SZ0 - 8), v(-1, SY, SZ0 - 12)],
      [v(-8, SY + 4.15, SZ1 + 2.6), v(-3, SY + 4.15, SZ1 + 2.6), v(6, SY + 4.15, SZ1 + 2.6)],
      [v(8, SY, SZ0 - 12), v(6, SY, SZ0 - 4), v(-6, SY, SZ0 - 13), v(1, SY, SZ0 - 1.5)],
    ];
    markSets.forEach((marks, i) => {
      const g = new T.Group(); g.position.copy(marks[0]); k.add(g);
      const body = new T.Mesh(figureGeo(0.21, 0.84, 1.4), perfM[i]); g.add(body);
      const cloak = new T.Mesh(new T.ConeGeometry(0.46, 1.1, 10, 1, true), perfM[i]); cloak.position.y = 0.72; g.add(cloak);
      players.push({ g, marks, i: 0, t: i * 0.7 });
    });
    const onStage = (on: boolean) => players.forEach((p) => p.g.scale.copy(on ? one : hide));
    const showOn = () => { const c = nyClock(); return c.min >= 20 * 60 || c.min < 2 * 60; };
    const setShow = (on: boolean) => { onStage(on); houseLights.forEach((l) => { l.intensity = on ? 0 : 28; }); stageWash.intensity = on ? 0 : 10; lights.forEach((l) => { l.L.intensity = on ? 420 : 0; l.beam.visible = on; }); };
    setShow(showOn());
    if (!ctx.reduced) {
      let show = showOn(), laugh = 0;
      const col = new T.Color(), dir = new T.Vector3(), tgt = new T.Vector3();
      k.ticks.push((t, dt) => {
        const on = showOn(); if (on !== show) { show = on; setShow(on); }
        const c = cam();
        /* the laugh: a wave that goes through the house every forty seconds during the show */
        const cyc = t % 40; laugh = on && cyc < 4 ? Math.sin((cyc / 4) * PI) : 0;
        placeHouse(t, laugh, c);
        if (on) {
          players.forEach((p, i) => {
            p.t += dt;
            const dwell = 6 + i * 1.5, cur = p.marks[p.i], nxt = p.marks[(p.i + 1) % p.marks.length];
            if (p.t > dwell) { const u = clamp01((p.t - dwell) / 2.4); p.g.position.lerpVectors(cur, nxt, u * u * (3 - 2 * u)); p.g.position.y += 0.06 * Math.abs(Math.sin(t * 9)); if (u >= 1) { p.i = (p.i + 1) % p.marks.length; p.t = 0; } }
            else { p.g.position.y = cur.y + 0.01 * Math.sin(t * 2 + i); }
            const look = i === 3 ? v(0, cur.y, SZ0 - 5) : v(0, cur.y, CZ + 12);
            const d = look.sub(p.g.position); p.g.rotation.y = Math.atan2(d.x, d.z) + 0.3 * Math.sin(t * 0.7 + i);
          });
          lights.forEach((l, i) => {
            const sweep = Math.sin(t * 0.35 + l.ph);
            tgt.set(sweep * 8 + (i % 2 ? 2 : -2), SY + 1.2, SZ0 - 7 + 3 * Math.cos(t * 0.27 + l.ph));
            l.L.target.position.copy(tgt);
            col.setHSL((l.hue + t * 0.012) % 1, 0.55, 0.62); l.L.color.copy(col); (l.beam.material as T.MeshBasicMaterial).color.copy(col);
            dir.copy(tgt).sub(l.base).normalize();
            l.beam.quaternion.setFromUnitVectors(v(0, -1, 0), dir);
          });
        }
      });
    }
    /* ---- Turtle Pond behind the stage, fireflies over it, Belvedere Castle on Vista Rock ---- */
    { const w = k.water({ y: bottom + 0.15, color: 0x0a1a24, w: 90, d: 40, x: 0, z: SZ1 - 22, amp: 0.4 }); const wm = w.material as T.MeshStandardMaterial; wm.metalness = 0.4; wm.roughness = 0.35; wm.envMapIntensity = 0.5; }
    k.box(160, 0.2, 40, 0, bottom - 0.1, SZ1 - 58, grassM);
    for (const s of [-1, 1]) k.box(40, 0.2, 44, s * 62, bottom - 0.1, SZ1 - 22, grassM);
    /* the bank between the stage and the water, and the far bank rising to the rock */
    k.box(34, 1.2, 3, 0, bottom + 0.3, SZ1 - 1.4, rock);
    { const g = new T.IcosahedronGeometry(16, 1); g.scale(2.0, 1.0, 1.1); k.mesh(g, rock, 0, bottom + 2, SZ1 - 52); }
    { const g = new T.IcosahedronGeometry(10, 1); g.scale(1.4, 1.1, 1.0); k.mesh(g, rock, -8, bottom + 9, SZ1 - 54); }
    const VY = bottom + 18, VZ = SZ1 - 56;
    k.box(9, 6, 7, -1, VY + 3, VZ, castle); k.box(5, 3.5, 5, -1, VY + 7.6, VZ + 0.4, castle);
    k.cyl(2.4, 12, 3.6, VY + 6, VZ - 1, castle, 2.4, 16); k.lathe([[2.7, 0], [0.1, 4.2]], 3.6, VY + 12, VZ - 1, cap, 16);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * PI * 2; k.box(0.5, 0.6, 0.5, 3.6 + Math.sin(a) * 2.4, VY + 12.3, VZ - 1 + Math.cos(a) * 2.4, castle); }
    for (let i = 0; i < 8; i++) k.box(0.7, 0.6, 0.5, -4.6 + i * 1.05, VY + 6.3, VZ + 3.4, castle);
    for (const [x, y] of [[-3.2, VY + 2.4], [0.6, VY + 2.4], [-1, VY + 4.4], [3.6, VY + 3.5], [3.6, VY + 8]]) k.box(0.7, 1.1, 0.1, x, y, VZ + 3.56, warmWin);
    k.box(0.1, 1.0, 0.6, 6.05, VY + 5.5, VZ - 1, warmWin);
    k.box(9.6, 0.6, 0.4, -1, VY + 6.2, VZ + 3.5, castleLit);
    k.point(0, VY + 4, VZ + 9, 0xffd0a0, 260, 30, 1.4); k.point(6, VY + 8, VZ + 6, 0xffc890, 140, 22, 1.4);
    /* the moon, and the trees round the pond and behind the bowl */
    k.sphere(3.2, 28, 62, SZ1 - 110, moonM, 16);
    k.point(28, 62, SZ1 - 100, 0xd8e0ff, 30, 120, 1);
    const trnd = X.mulberry(1722);
    for (let i = 0; i < 26; i++) { const x = -56 + i * 4.5 + (trnd() - 0.5) * 3, z = SZ1 - 30 - trnd() * 22; if (Math.abs(x) < 16 && z > SZ1 - 46) continue; k.tree(x, bottom, z, { h: 9 + trnd() * 6, r: 4 + trnd() * 2, seed: 1723 + i, leaf: 0x1e3020 }); }
    for (let i = 0; i < 14; i++) { const a = -1.75 + (i / 13) * 3.5, r = 38 + trnd() * 6; if (Math.abs(Math.sin(a) * r) < 14) continue; k.tree(Math.sin(a) * r, 0, CZ + Math.cos(a) * r, { h: 10 + trnd() * 6, r: 4.5 + trnd() * 2, seed: 1750 + i, leaf: 0x1e3020 }); k.keepOut.push({ x: Math.sin(a) * r, z: CZ + Math.cos(a) * r, r: 0.9 }); }
    k.skyline({ z: SZ1 - 150, count: 16, spacing: 12, seed: 1724, base: bottom, lit: 0.45, warm: true, scale: 1.3 });
    {
      const NF = 240, fl = k.instances(new T.SphereGeometry(0.06, 5, 4), new T.MeshBasicMaterial({ color: 0xd8ff70 }), Array.from({ length: NF }, () => new T.Matrix4()));
      fl.frustumCulled = false;
      const frnd = X.mulberry(1725), base = Array.from({ length: NF }, () => v(-34 + frnd() * 68, bottom + 0.4 + frnd() * 3.5, SZ1 - 4 - frnd() * 34)), fph = Array.from({ length: NF }, () => frnd() * 6.3);
      const fm = new T.Matrix4(), fq = new T.Quaternion(), fp = new T.Vector3(), fs = new T.Vector3();
      const place = (t: number) => {
        for (let i = 0; i < NF; i++) { const b = base[i], p = fph[i]; fp.set(b.x + 1.2 * Math.sin(t * 0.5 + p), b.y + 0.6 * Math.sin(t * 0.7 + p * 1.7), b.z + 1.2 * Math.cos(t * 0.4 + p)); const glow = Math.max(0, Math.sin(t * 1.6 + p * 3)) > 0.6 ? 1 : 0.0001; fs.setScalar(glow); fm.compose(fp, fq, fs); fl.setMatrixAt(i, fm); }
        fl.instanceMatrix.needsUpdate = true;
      };
      place(1);
      if (!ctx.reduced) k.ticks.push(place);
    }

    /* ---- the theatre's outer wall of wooden slats, the lobby, the queue and its boards ---- */
    const OR = 31.3;
    k.mesh(new T.CylinderGeometry(OR, OR, 3.6, 64, 1, true, PI - 1.5, 3.0), slat, 0, 1.8, CZ);
    k.mesh(new T.CylinderGeometry(OR - 0.2, OR - 0.2, -bottom + 0.2, 64, 1, true, PI - 1.6, 3.2), slatD, 0, bottom / 2, CZ);
    k.mesh(new T.CylinderGeometry(OR + 0.5, OR + 0.5, 3.6, 64, 1, true, PI - 1.5, 3.0), slat, 0, 1.8, CZ);
    k.mesh(ringXZ(OR, OR + 0.5, -1.5, 1.5, 64), slatD, 0, 3.6, CZ);
    for (let i = 0; i <= 24; i++) { const a = -1.5 + (i / 24) * 3.0; if (Math.abs(a) < 0.14) continue; k.keepOut.push({ x: Math.sin(a) * (OR + 0.25), z: CZ + Math.cos(a) * (OR + 0.25), r: 1.0 }); }
    for (let i = 0; i < 24; i++) { const a = -1.5 + ((i + 0.5) / 24) * 3.0; if (Math.abs(a) < 0.16) continue; k.box(0.14, 3.6, 0.14, Math.sin(a) * (OR + 0.62), 1.8, CZ + Math.cos(a) * (OR + 0.62), slatD); }
    /* the way in at the south, through the wall at the top of the centre aisle */
    for (const s of [-1, 1]) { k.box(0.6, 4.4, 1.2, s * 3.6, 2.2, CZ + OR + 0.25, slatD); }
    k.box(7.8, 0.5, 1.4, 0, 4.4, CZ + OR + 0.25, slatD);
    k.sign('DELACORTE THEATER', 5.6, 0.6, 0, 3.9, CZ + OR + 0.98, 'transparent', '#e8dfc8', 60, 0);
    /* the works on the outside of the wall, facing the park, lamps along the walk to light them */
    for (const a of [-1.32, -1.05, -0.78, -0.5, 0.5, 0.78, 1.05, 1.32]) hang(mounts, Math.sin(a) * (OR + 0.76), 1.9, CZ + Math.cos(a) * (OR + 0.76), a, 2.2, 1.6, st, 3.4);
    for (const a of [-1.2, -0.65, 0.65, 1.2]) k.lamp(Math.sin(a) * (OR + 5.2), CZ + Math.cos(a) * (OR + 5.2), 3.8, iron, 0xffd7a0, 30);
    for (const a of [-1.18, -0.92, -0.64, 0.64, 0.92, 1.18]) k.point(Math.sin(a) * (OR + 2.4), 3.2, CZ + Math.cos(a) * (OR + 2.4), 0xffe2b8, 12, 10, 1.6);
    /* the lobby: two walls of slats running south from the way in, the box office window between them */
    const LZ0 = CZ + OR + 1.4, LZ1 = CZ + OR + 12;
    for (const s of [-1, 1]) { wallZ(k, LZ0, LZ1, s * 8.5, 3.4, 0.4, slat); k.box(0.5, 0.6, LZ1 - LZ0, s * 8.5, 3.6, (LZ0 + LZ1) / 2, slatD); }
    k.box(17.4, 0.4, LZ1 - LZ0 + 0.4, 0, 3.95, (LZ0 + LZ1) / 2, slatD);
    for (const x of [-6, 0, 6]) for (const z of [LZ0 + 2, LZ1 - 2]) k.box(0.24, 3.8, 0.24, x, 1.9, z, slatD);
    for (const [x, z] of [[-6, LZ0 + 5.3], [6, LZ0 + 5.3], [0, LZ0 + 5.3]]) k.point(x, 3.4, z, 0xffe0b0, 12, 12);
    k.box(2.6, 1.1, 0.8, -6.8, 0.55, LZ1 - 0.9, slatD); k.box(2.6, 1.6, 0.1, -6.8, 1.9, LZ1 - 0.6, k.flat(0x1a2128, 0.6, 0.2));
    for (const z of [LZ0 + 2.6, LZ0 + 5.6, LZ0 + 8.6]) hang(mounts, -8.29, 1.9, z, PI / 2, 2.0, 1.5, st, 3.0);
    for (const z of [LZ0 + 2.6, LZ0 + 5.6]) hang(mounts, 8.29, 1.9, z, -PI / 2, 2.0, 1.5, st, 3.0);
    k.censusWall({ x: 8.29, y: 1.9, z: LZ0 + 9.0, rotY: -PI / 2, cols: 8, rows: 4, tile: 0.5, gap: 0.04, start: ctx.wallStart(950, 32), pieces: ctx.all, backing: slatD });
    /* the ticket line: a rail down the walk with exhibition boards facing it */
    const QZ0 = LZ1 + 1, QZ1 = LZ1 + 16;
    for (const s of [-1, 1]) k.rail(s * 2.2, (QZ0 + QZ1) / 2, QZ1 - QZ0, iron, 1.0, 'z', 2.0);
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
      const z = QZ0 + 2.5 + i * 5, x = s * 4.6, cy = 1.85;
      const b = k.box(0.14, 2.4, 3.0, x, cy, z, slatD); void b;
      k.box(0.12, 2.8, 0.12, x, 1.4, z - 1.55, iron); k.box(0.12, 2.8, 0.12, x, 1.4, z + 1.55, iron);
      k.keepOut.push({ x, z, r: 1.7 });
      hang(mounts, x - s * 0.09, cy + 0.05, z, s > 0 ? -PI / 2 : PI / 2, 2.2, 1.6, st, 3.0);
    }
    for (const [x, z] of [[-7, QZ0 + 4], [7, QZ0 + 12], [-7, QZ1 - 1]]) k.lamp(x, z, 3.8, iron, 0xffd7a0, 26);
    /* people in the line, and the ushers on the promenade */
    k.crowd([v(1, 0, QZ1 + 2), v(1, 0, QZ0), v(0, 0, LZ1 - 1), v(0, 0, LZ0 + 0.5), v(0, 0, CZ + OR - 1.5)], 12, { seed: 1726, spread: 0.7, speed: 0.6, animate: !ctx.reduced });
    k.crowd([v(-22, 0, CZ + 20), v(-12, 0, CZ + 27.5), v(0, 0, CZ + 29.4), v(12, 0, CZ + 27.5), v(22, 0, CZ + 20)], 8, { seed: 1727, spread: 0.8, speed: 0.8, animate: !ctx.reduced });

    /* ---- what the house knows ---- */
    const dth = { name: 'Delacorte Theater, Wikipedia', url: 'https://en.wikipedia.org/wiki/Delacorte_Theater' };
    const sip = { name: 'Shakespeare in the Park (New York City), Wikipedia', url: 'https://en.wikipedia.org/wiki/Shakespeare_in_the_Park_(New_York_City)' };
    k.egg(v(0, SY + 1.4, SZ0 - 4), { id: 'delacorte-1962', title: 'The Merchant of Venice, June 1962', year: '1962', text: 'The first production here was The Merchant of Venice in June 1962. George T. Delacorte Jr., the president of Dell Publishing, put up the last 150,000 dollars to finish the theatre, and it was named for him and his wife Valerie.', clue: 'Look at the stage from the front row and think of the first summer it was used.', source: dth }, { r: 3.4 });
    k.egg(v(-6.8, 2.2, LZ1 - 0.7), { id: 'papp-moses', title: 'Grass erosion', year: '1959', text: 'Joseph Papp conceived the festival in 1954. In 1959 the parks commissioner Robert Moses demanded that Papp charge for the performances to pay for grass erosion; Papp fought him in court and won, and Moses then had a theatre built for him in the park.', clue: 'The box office window sells nothing. Ask why.', source: sip }, { r: 1.8 });
    k.egg(v(0, 1.4, (QZ0 + QZ1) / 2), { id: 'free-tickets', title: 'Free, the day of', text: 'Every ticket is free and is given out on the day of the performance: at the box office, by borough distribution, by an in person lottery and a digital one, two tickets to a person. About 80,000 people come each summer, and since 1973 two works a season has been the standard.', clue: 'Stand in the line. It starts before dawn on the real morning.', source: sip }, { r: 2.6 });
    k.egg(v(0, VY + 5, VZ + 4), { id: 'belvedere', title: 'The castle on Vista Rock', year: '1869', text: 'Calvert Vaux and Jacob Wrey Mould designed Belvedere Castle in 1867 and it was finished in 1869, Manhattan schist and granite with a corner tower under a conical cap, on Vista Rock, a 130 foot outcrop that is the park\'s second highest natural point. It has held Central Park\'s official weather station since 1919. Turtle Pond below it lies where the old receiving reservoir was.', clue: 'Look over the stage at the lit tower on the rock.', source: { name: 'Belvedere Castle, Wikipedia', url: 'https://en.wikipedia.org/wiki/Belvedere_Castle' } }, { r: 12 });
    k.egg(v(0, 2.6, CZ + OR + 0.9), { id: 'delacorte-2025', title: 'Rebuilt for eighty five million', year: '2025', text: 'The Delacorte closed for renovation in September 2023 after the last show of that summer, an 85 million dollar rebuild, and reopened on July 15, 2025.', clue: 'The wooden slats of the wall are new. Read the date on the way in.', source: dth }, { r: 2.4 });
    k.egg(v(0, 1.2, CZ + 27), { id: 'five-million', title: 'Five million', text: 'Over five million people have attended more than 150 free productions of Shakespeare and other classical works and musicals at the Delacorte since it opened in 1962.', clue: 'Stand at the top of the bowl and look down at a full house.', source: dth }, { r: 2.6 });

    const floorY = (x: number, z: number) => {
      const dz = z - CZ, r = Math.hypot(x, dz), a = Math.atan2(x, dz);
      if (Math.abs(a) <= ANG + 0.02 && dz > 0) {
        if (r < 4.6) return bottom;
        if (r < R0 + ROWS - 0.5) return -RISE * clamp01((R0 + ROWS - 0.5 - r) / (ROWS - 1)) * ROWS;
      }
      return 0;
    };
    return { mounts, spawn: v(0, 3, CZ + 29.6), look: v(0, SY + 1, SZ0 - 8), eye: 3, floorY, bounds: [-37, 37, CZ + 3, QZ1 + 3], style: st };
  },
};
