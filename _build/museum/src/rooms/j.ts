/* Rooms 42 to 46: the Cyclone, the Brooklyn Bridge walkway, the Panorama, inside the Statue, the Oyster Bar.
   Third set. New moves: rides along splines, crowds, walkable balconies, a city inside a room, a climb inside a figure. */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as X from '../textures';
import { v } from '../kit';
import type { Mount } from '../kit';
import type { RoomDef } from './types';
import type { Kit } from '../kit';
import { street, blockFront, anamorphTex } from './f';
import { hero, heroInstances, standIn, hide } from './heroes';
import { fireflyPlate } from './a';

const PI = Math.PI;

/* ---------- THE BIG UPGRADE, wave 3a (2026-11-24): helpers for rooms 42 to 46 ----------
   sk(): a scanned CC0 surface (Poly Haven, 1k webp in assets/museum/tex/<room>/<name>_{c,n,r}.webp) laid in world
   space at `tile` metres a repeat. With colour off only the relief and the roughness are used, so painted steel can
   stay the colour it is painted while still catching light like metal that has been painted. Until the maps arrive
   the surface is drawn at its tint times `mean`, and the maps go on together (an unloaded roughness map samples 0). */
const HAS_DOM = typeof window !== 'undefined' && typeof HTMLImageElement !== 'undefined';
const texL = HAS_DOM ? new T.TextureLoader() : null;
const skCache = new WeakMap<Kit, Map<string, T.MeshStandardMaterial>>();
function sk(k: Kit, room: string, name: string, tile: number, p: { tint?: number; colour?: boolean; mean?: number; roughness?: number; metalness?: number; normal?: number; side?: T.Side; rough?: boolean; gain?: number } = {}) {
  let cache = skCache.get(k);
  if (!cache) { cache = new Map(); skCache.set(k, cache); }
  const key = room + '/' + name + ':' + tile + ':' + JSON.stringify(p);
  const had = cache.get(key); if (had) return had;
  const { tint = 0xffffff, colour = true, mean = 0.42, roughness = 0.85, metalness = 0, normal = 1, side = T.FrontSide, rough = true, gain = 1 } = p;
  /* gain lifts a dark photograph above its own albedo (a colour may run past 1), for buff tile from a grey scan */
  const m = new T.MeshStandardMaterial({ color: new T.Color(tint).multiplyScalar(gain), roughness, metalness, side, normalScale: new T.Vector2(normal, normal) });
  m.userData.density = 1 / tile;
  cache.set(key, m);
  if (!texL) return m;
  if (colour) m.color.set(tint).multiplyScalar(mean * gain);
  const one = (suf: string, srgb: boolean) => new Promise<T.Texture | null>((res) => {
    const url = `assets/museum/tex/${room}/${name}_${suf}.webp`;
    k.used.images.add(url);
    texL.load(url, (t) => { t.colorSpace = srgb ? T.SRGBColorSpace : T.NoColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8; res(t); }, undefined, () => res(null));
  });
  k.pending.push(Promise.all([colour ? one('c', true) : Promise.resolve(null), one('n', false), rough && k.o.quality === 'high' ? one('r', false) : Promise.resolve(null)]).then(([c, n, r]) => {
    if (!k.live) return;
    if (c) { m.map = c; m.color.set(tint).multiplyScalar(gain); }
    if (n) m.normalMap = n;
    if (r) m.roughnessMap = r;
    m.needsUpdate = true;
  }));
  return m;
}
/* A rolled steel I section one metre long standing on +y from the origin; `beamAt` lays it from a to b. */
function iSection(depth: number, flange: number, web = 0.02, tf = 0.025) {
  const parts = [new T.BoxGeometry(flange, 1, tf), new T.BoxGeometry(flange, 1, tf), new T.BoxGeometry(web, 1, depth - tf * 2)];
  parts[0].translate(0, 0.5, depth / 2 - tf / 2); parts[1].translate(0, 0.5, -depth / 2 + tf / 2); parts[2].translate(0, 0.5, 0);
  const g = mergeGeometries(parts)!; parts.forEach((p) => p.dispose());
  return g;
}
const Y1 = new T.Vector3(0, 1, 0);
function beamAt(a: T.Vector3, b: T.Vector3, roll = 0, w = 1) {
  const d = new T.Vector3().subVectors(b, a), len = d.length();
  const q = new T.Quaternion().setFromUnitVectors(Y1, d.normalize());
  if (roll) q.multiply(new T.Quaternion().setFromAxisAngle(Y1, roll));
  return new T.Matrix4().compose(a, q, new T.Vector3(w, len, w));
}
/* A sign texture drawn once, for anamorphic floor type (null in node, where there is no canvas). */
function floorType(k: Kit, text: string, ex: number, ez: number, eh: number, floor: number, yaw: number, D: number, W: number, H: number, fg: string, size: number) {
  if (!HAS_DOM) return null;
  return anamorphTex(k, X.signText(text, 1024, Math.max(64, Math.round((1024 * H) / W)), 'transparent', fg, size), ex, ez, eh, floor, yaw, D, W, H, 0.94);
}
/* A canvas texture (null in node). */
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat = 1) {
  if (!HAS_DOM) return null;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(repeat, repeat);
  return t;
}

/* ---------------- 42 THE CYCLONE ---------------- */
export const cyclone: RoomDef = {
  id: 'cyclone',
  name: 'The ride',
  area: 'THE CYCLONE',
  mood: 'Boardwalk summer',
  color: '#f2e6c8',
  description: 'The wooden coaster at Coney Island, the station, the lift hill, the first drop, and the works along the queue and the boardwalk. Press W to take the ride.',
  signatures: 'The white steel lattice under a wooden track, the 75 foot lift hill with its red CYCLONE letters and the 58 degree first drop, the low station under its roof, the boardwalk, the beach and the tall parachute tower beyond.',
  build(k, ctx) {
    /* THE BIG UPGRADE wave 3a (2026-11-24): the structure is what the egg says it is, white painted steel I beams in
       bents with tie bars and cross bracing, under a wooden track of laminated running rails with a steel strap, ties,
       a catwalk and a lift chain; scanned sand, boardwalk and timber; the station in painted clapboard with its
       valance; the train rebuilt (its yellow nose was being cast as a taxi); a sign kit; the trick is floor type. */
    k.sky({ top: 0x4a8ad6, horizon: 0xd6e4ee, ground: 0x8a8478, fog: 0.0013, sun: { az: 3.4, el: 0.95, color: 0xfff6e6, size: 12 }, env: 1.0 });
    k.hemi(0xeef4ff, 0x6a6458, 1.0);
    k.sun(0xfff2dc, 2.6, 40, 90, -20, true, 120);
    const R = 'cyclone';
    const steelW = sk(k, R, 'steel', 1.5, { tint: 0xf4f2ec, colour: false, roughness: 0.5, metalness: 0.3 }),
      timber = sk(k, R, 'timber', 2.0, { tint: 0xd2bea2, roughness: 0.8 }),
      board = sk(k, R, 'board', 2.4, { tint: 0xe2d0b6 }),
      sand = sk(k, R, 'sand', 5, { tint: 0xffffff, roughness: 1 }),
      siding = sk(k, R, 'siding', 1.4, { tint: 0xfbf8f0, roughness: 0.7 }),
      sidingR = sk(k, R, 'siding', 1.4, { tint: 0xc8302a, roughness: 0.7 }),
      rail = k.flat(0x8a8d92, 0.85, 0.35),
      red = k.flat(0xc62828, 0.1, 0.5),
      yellow = k.flat(0xf1c531, 0, 0.55),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      steel = k.pbr('cySteel', X.steel(0x9aa0a6, true, 83), 0.6, { metalness: 0.8, roughness: 0.4 });
    // the ground: the lot in sand, the boardwalk in weathered planks, the beach, the ocean
    k.box(220, 0.4, 160, 0, -0.2, -40, sand);
    k.box(220, 0.5, 14, 0, 0.05, 40, board);
    k.rail(0, 47, 220, dark, 1.1, 'x', 2.2);
    k.box(400, 0.3, 200, 0, -0.5, 160, sand);
    k.water({ y: -0.4, color: 0x3a6a7a, w: 600, d: 300, z: 300, amp: 1.4 });
    for (let x = -100; x <= 100; x += 24) k.lamp(x, 33, 5, dark, 0xffe0b0, 24);
    k.skyline({ z: -180, count: 28, spacing: 9, scale: 1.1, base: -1, seed: 108, lit: 0.2, glow: 0.4, tint: 0x9a8e86, rows: 1 });
    // the parachute jump, a lattice column with its crown of arms, and the wheel far along the boardwalk
    for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; k.beam(v(-120 + Math.cos(a) * 4, 0, -30 + Math.sin(a) * 4), v(-120 + Math.cos(a) * 1.2, 76, -30 + Math.sin(a) * 1.2), 0.12, red, 4); }
    for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; k.beam(v(-120, 76, -30), v(-120 + Math.cos(a) * 14, 70, -30 + Math.sin(a) * 14), 0.1, red, 4); }
    k.torus(14, 0.12, -120, 70, -30, red, 32).rotation.x = PI / 2;
    // the Wonder Wheel stands west of the Cyclone on West 12th Street: 150 ft, 24 cars, 8 white fixed, 16 swinging, blue legs
    const WX = -80, WZ = -10;
    k.torus(22, 0.5, WX, 26, WZ, steel, 48);
    const wwBlue = k.flat(0x2a5aa8, 0.3, 0.5), wwWhite = k.flat(0xf2f0ea, 0.1, 0.6);
    for (let i = 0; i < 24; i++) { const a = (i / 24) * PI * 2; k.beam(v(WX, 26, WZ), v(WX, 26 + Math.sin(a) * 22, WZ + Math.cos(a) * 22), 0.12, steel, 4); k.box(1.6, 1.8, 1.6, WX, 26 + Math.sin(a) * 22, WZ + Math.cos(a) * 22, i % 3 === 0 ? wwWhite : i % 3 === 1 ? red : yellow); }
    for (const s of [-1, 1]) k.beam(v(WX, 0, WZ + s * 12), v(WX, 26, WZ), 0.4, wwBlue, 6);
    // the track: a closed spline, lift hill along the far side, the drop, the return hills
    const P = [v(0, 3, 0), v(0, 3.4, -14), v(0, 23, -64), v(0, 6, -82), v(10, 4.5, -92), v(22, 11, -88), v(27, 5, -70), v(24, 15, -50), v(19, 4.5, -32), v(22, 12, -14), v(15, 4, 4), v(8, 6.5, 12), v(0, 3, 8)];
    const curve = k.spline(P, true, 0.45);
    const N = 520, pts = curve.getSpacedPoints(N);
    const tan = new T.Vector3(), side = new T.Vector3();
    const lift = (p: T.Vector3) => Math.abs(p.x) < 1.5 && p.z < -13 && p.z > -64;
    /* every segment of the track as one frame: the laminated running rails with the steel strap on top, the ties,
       the outer guard boards, and on the lift the catwalk, its handrail and the chain */
    const railM: T.Matrix4[] = [], strapM: T.Matrix4[] = [], tieM: T.Matrix4[] = [], guardM: T.Matrix4[] = [], walkM: T.Matrix4[] = [], chainM: T.Matrix4[] = [], postM: T.Matrix4[] = [];
    const q = new T.Quaternion(), e = new T.Euler(), one = new T.Vector3(1, 1, 1);
    for (let i = 0; i < N; i++) {
      const a = pts[i], b = pts[i + 1], d = new T.Vector3().subVectors(b, a), len = d.length();
      if (len < 1e-4) continue;
      const yaw = Math.atan2(d.x, d.z), pitch = -Math.asin(T.MathUtils.clamp(d.y / len, -1, 1));
      q.setFromEuler(e.set(pitch, yaw, 0, 'YXZ'));
      side.set(Math.cos(yaw), 0, -Math.sin(yaw));
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const at = (dx: number, dy: number, sx: number, sy: number, list: T.Matrix4[]) => list.push(new T.Matrix4().compose(mid.clone().addScaledVector(side, dx).add(v(0, dy, 0)), q, new T.Vector3(sx, sy, len * 1.02)));
      for (const sg of [-1, 1]) { at(sg * 0.58, -0.02, 1, 1, railM); at(sg * 0.58, 0.13, 1, 1, strapM); at(sg * 1.12, 0.02, 1, 1, guardM); }
      if (i % 2 === 0) tieM.push(new T.Matrix4().compose(a.clone().add(v(0, -0.2, 0)), q, one));
      if (lift(a)) { at(1.9, -0.16, 1, 1, walkM); at(0, 0.0, 1, 1, chainM); if (i % 3 === 0) postM.push(new T.Matrix4().compose(a.clone().addScaledVector(side, 2.55).add(v(0, 0.36, 0)), q, one)); }
    }
    const railG = new T.BoxGeometry(0.24, 0.26, 1), strapG = new T.BoxGeometry(0.16, 0.035, 1), tieG = new T.BoxGeometry(3.0, 0.14, 0.26), guardG = new T.BoxGeometry(0.06, 0.32, 1), walkG = new T.BoxGeometry(1.2, 0.06, 1), chainG = new T.BoxGeometry(0.16, 0.08, 1), postG = new T.BoxGeometry(0.06, 1.1, 0.06);
    k.instances(railG, timber, railM); k.instances(strapG, rail, strapM); k.instances(tieG, timber, tieM); k.instances(guardG, timber, guardM);
    k.instances(walkG, timber, walkM); k.instances(chainG, dark, chainM); k.instances(postG, steelW, postM);
    { const hr: T.Vector3[] = []; for (let i = 0; i < N; i += 2) if (lift(pts[i])) hr.push(pts[i].clone().add(v(2.55, 0.9, 0))); if (hr.length > 2) k.curve(hr, 0.03, steelW, hr.length); }
    /* the structure: white steel bents every few metres, two posts in I section with a cap ledger, tie bars every
       three metres and an X in each panel; between bents, a tie and a diagonal at every level on both sides */
    const big: T.Matrix4[] = [], small: T.Matrix4[] = [];
    const bents: { a: T.Vector3; b: T.Vector3; top: number; yaw: number }[] = [];
    for (let i = 0; i < N; i += 6) {
      const p = pts[i]; curve.getTangentAt(i / N, tan); side.set(tan.z, 0, -tan.x).normalize();
      /* none under the station: the track lies on its platform there, and the posts stood on the works' viewing spots */
      if (Math.abs(p.x) < 2.5 && Math.abs(p.z) < 13) continue;
      const yaw = Math.atan2(tan.x, tan.z), top = p.y - 0.3;
      const a = v(p.x + side.x * 1.4, 0, p.z + side.z * 1.4), b = v(p.x - side.x * 1.4, 0, p.z - side.z * 1.4);
      big.push(beamAt(a, a.clone().setY(top), yaw), beamAt(b, b.clone().setY(top), yaw));
      big.push(beamAt(a.clone().setY(top - 0.1), b.clone().setY(top - 0.1), yaw));
      let y0 = 0;
      for (let y = 3; y < top - 0.6; y += 3) { small.push(beamAt(a.clone().setY(y), b.clone().setY(y), yaw)); small.push(beamAt(a.clone().setY(y0 + 0.1), b.clone().setY(y), yaw), beamAt(b.clone().setY(y0 + 0.1), a.clone().setY(y), yaw)); y0 = y; }
      if (top - y0 > 1.2) small.push(beamAt(a.clone().setY(y0 + 0.1), b.clone().setY(top - 0.2), yaw));
      bents.push({ a, b, top, yaw });
    }
    for (let i = 1; i < bents.length; i++) {
      const A = bents[i - 1], B = bents[i], h = Math.min(A.top, B.top) - 0.4;
      if (A.a.distanceTo(B.a) > 5) continue;
      for (const [pa, pb] of [[A.a, B.a], [A.b, B.b]] as const) {
        let y0 = 0;
        for (let y = 3; y < h; y += 3) { small.push(beamAt(pa.clone().setY(y), pb.clone().setY(y), A.yaw + PI / 2)); small.push(beamAt(pa.clone().setY(y0 + 0.1), pb.clone().setY(y), A.yaw + PI / 2)); y0 = y; }
      }
    }
    k.instances(iSection(0.32, 0.22, 0.03, 0.035), steelW, big);
    k.instances(iSection(0.16, 0.1, 0.02, 0.02), steelW, small);
    for (const b of bents) for (const c of [b.a, b.b]) k.keepOut.push({ x: c.x, z: c.z, r: 0.5 });
    /* the train: three cars in the ride's red with a cream stripe, padded benches, lap bars, riders with their arms
       up on the drop. Every mesh is marked so the kit's cab swap leaves it alone (the old yellow nose read as a taxi). */
    const train = new T.Group();
    const carR = k.flat(0xbe1f2a, 0.3, 0.38), cream = k.flat(0xf2ead6, 0.05, 0.5), seatM = k.flat(0x2a1612, 0, 0.75), chrome = k.flat(0xd2d5da, 0.9, 0.22), under = k.flat(0x24262a, 0.6, 0.5);
    const riderCols = [0x3a8ae8, 0xf0d24a, 0xe8e2d4, 0x2a2a34, 0xe83a5a, 0x2a8a4a]; let rc = 0;
    for (let c = 0; c < 3; c++) {
      const car = new T.Group();
      const add = (g: T.BufferGeometry, m: T.Material, x: number, y: number, z: number, rx = 0, rz = 0) => { const o = new T.Mesh(g, m); o.position.set(x, y, z); o.rotation.set(rx, 0, rz); car.add(o); return o; };
      add(new T.BoxGeometry(1.7, 0.5, 2.5), carR, 0, 0.45, 0);
      add(new T.CylinderGeometry(0.85, 0.85, 0.5, 18, 1, false, 0, PI), carR, 0, 0.45, 1.25, 0, 0).rotation.set(0, PI / 2, 0);
      for (const s of [-1, 1]) { add(new T.BoxGeometry(0.08, 0.42, 2.5), carR, s * 0.82, 0.9, 0); add(new T.BoxGeometry(0.09, 0.07, 2.52), cream, s * 0.83, 0.62, 0); }
      add(new T.BoxGeometry(1.5, 0.3, 2.3), under, 0, 0.08, 0);
      for (const dz of [-0.6, 0.5]) { add(new T.BoxGeometry(1.5, 0.16, 0.5), seatM, 0, 0.76, dz); add(new T.BoxGeometry(1.5, 0.5, 0.12), seatM, 0, 1.0, dz - 0.3); add(new T.CylinderGeometry(0.025, 0.025, 1.4, 6), chrome, 0, 1.05, dz + 0.32, 0, PI / 2); }
      for (const [dz, s] of [[-0.6, -1], [-0.6, 1], [0.5, -1], [0.5, 1]] as const) {
        const col = k.flat(riderCols[rc++ % riderCols.length], 0, 0.8);
        add(new T.CapsuleGeometry(0.17, 0.4, 3, 8), col, s * 0.38, 1.2, dz);
        add(new T.SphereGeometry(0.13, 10, 8), k.flat(0xc89a7a, 0, 0.7), s * 0.38, 1.62, dz);
        if ((c + (dz > 0 ? 1 : 0)) % 2 === 0) for (const h of [-1, 1]) add(new T.CapsuleGeometry(0.045, 0.42, 2, 6), col, s * 0.38 + h * 0.2, 1.85, dz + 0.05, 0, h * 0.25);
      }
      car.position.z = -c * 2.9;
      train.add(car);
    }
    train.traverse((o) => { o.userData.cab = true; if (o instanceof T.Mesh) o.castShadow = ctx.quality === 'high'; });
    k.add(train);
    if (!ctx.reduced) k.rider(train, curve, (y) => (Math.abs(train.position.x) < 1.5 && train.position.z < -12 && train.position.z > -63 ? 4 : Math.max(5, Math.sqrt(2 * 9.8 * Math.max(0.5, 24 - y)) * 0.75)), 6);
    else { train.position.copy(pts[30]); }
    /* the station: a low shed over the loading straight in white painted clapboard, red trim, a red and white valance
       under the roof edge, white steel posts, the sign on both gables */
    k.box(12, 0.3, 22, 0, 2.45, 0, board);
    for (const x of [-5.6, 5.6]) for (const z of [-10, -3, 4, 10]) k.box(0.3, 9.7, 0.3, x, 4.85, z, steelW);
    /* the platform stands on a red clapboard skirt (the structure under it was taken out: it stood on the viewing spots) */
    k.box(0.2, 2.3, 24, 5.9, 1.15, 0, sidingR); k.box(12, 2.3, 0.2, 0, 1.15, -11.9, sidingR);
    k.box(13, 0.4, 24, 0, 9.9, 0, dark);
    k.box(12.8, 0.08, 23.8, 0, 9.66, 0, siding);
    for (const s of [-1, 1]) { k.box(0.2, 0.6, 24.4, s * 6.6, 9.5, 0, sidingR); k.box(13.4, 0.6, 0.2, 0, 9.5, s * 12.2, sidingR); }
    { const vm: T.Matrix4[] = [], vr: T.Matrix4[] = [];
      for (let z = -11.8; z <= 11.8; z += 0.6) for (const x of [-6.6, 6.6]) (Math.round(z / 0.6) % 2 ? vm : vr).push(new T.Matrix4().compose(v(x, 9.0, z), new T.Quaternion(), one));
      for (let x = -6.3; x <= 6.3; x += 0.6) for (const z of [-12.1, 12.1]) (Math.round(x / 0.6) % 2 ? vm : vr).push(new T.Matrix4().compose(v(x, 9.0, z), new T.Quaternion().setFromAxisAngle(Y1, PI / 2), one));
      const vg = new T.ConeGeometry(0.32, 0.5, 3); vg.rotateX(PI); vg.rotateY(PI / 6);
      k.instances(vg, siding, vm); k.instances(vg, sidingR, vr);
    }
    k.box(0.4, 9.9, 24, -6, 4.95, 0, siding);
    k.box(0.44, 0.9, 24.04, -6, 2.9, 0, sidingR);
    k.block(-6.3, -5.7, -12, 12);
    k.block(-6, 6, 11.6, 12.4);
    k.box(12, 9.9, 0.4, 0, 4.95, 12, siding);
    k.box(12.04, 0.9, 0.44, 0, 2.9, 12, sidingR);
    k.sign('CYCLONE', 6.4, 1.4, 0, 11.2, 12.2, '#c62828', '#fff3d0', 130, 0, { border: true });
    k.sign('CYCLONE', 6.4, 1.4, 0, 11.2, -12.2, '#c62828', '#fff3d0', 130, PI, { border: true });
    k.sign('CONEY ISLAND  CYCLONE  SINCE 1927', 9, 0.9, 0, 7.6, 12.22, '#f7f2e6', '#b8202a', 74, 0, { border: true });
    /* a Firefly sideshow banner for the outside of the west wall, painted clapboard until it lands */
    fireflyPlate(k, 'assets/museum/tex/cyclone/ff_station_banner.webp', 22, 5.6, -6.24, 6.0, 0, -PI / 2, siding);
    for (let i = 0; i < 6; i++) { k.rail(9 + i * 1.6, 12, 14, rail, 1.0, 'z', 3.5); }
    /* the queue: a ticket booth and the height board at the head of the line */
    k.box(2.4, 2.6, 2.0, 14.5, 1.3, 21.5, siding); k.box(2.6, 0.3, 2.2, 14.5, 2.75, 21.5, sidingR);
    k.sign('TICKETS', 2.2, 0.5, 14.5, 2.2, 22.52, '#b8202a', '#fff3d0', 120, 0, { border: true });
    k.box(0.12, 2.4, 0.12, 9.3, 1.2, 19.2, steelW);
    k.sign('YOU MUST BE THIS TALL TO RIDE  54 IN', 1.1, 0.5, 9.3, 2.05, 19.27, '#f7f2e6', '#b8202a', 34, 0, { border: true });
    k.box(0.5, 0.06, 0.06, 9.55, 1.37, 19.2, red);
    k.sign('RIDE AT YOUR OWN RISK  KEEP HANDS INSIDE THE CAR', 3.4, 0.5, 5.75, 4.4, 10.7, '#1a1c20', '#f1c531', 40, -PI / 2, { border: true });
    k.censusWall({ x: -5.78, y: 4.6, z: 0, rotY: PI / 2, cols: 30, rows: 3, tile: 0.6, gap: 0.05, start: ctx.wallStart(2100, 90), pieces: ctx.all, backing: dark });
    k.point(0, 8.6, -6, 0xfff0d0, 20, 14); k.point(0, 8.6, 6, 0xfff0d0, 20, 14);
    // people in the queue and on the boardwalk
    k.crowd([v(18, 0, 18), v(12, 0, 20), v(9.5, 0, 12), v(9.5, 0, 6)], 14, { seed: 42, speed: 0.4, spread: 0.8, animate: !ctx.reduced });
    k.crowd([v(-100, 0.3, 40), v(-40, 0.3, 39), v(0, 0.3, 41), v(50, 0.3, 39), v(100, 0.3, 40)], 40, { seed: 43, speed: 1.1, spread: 6, animate: !ctx.reduced });
    k.prop('hydrant', -14, 0, 20, { height: 1.1 });
    /* the boardwalk: life rings on the rail, an ices cart, picnic tables, cans */
    for (const x of [-46, -10, 26, 62]) k.prop('cyclone/nyb_coney_buoy', x, 0.6, 46.85, { height: 0.84 });
    k.prop('cyclone/nyb_heat_ices', -24, 0.3, 36.5, { height: 1.7, rotY: PI });
    for (const x of [-36, 14, 40]) k.prop('cyclone/ph_wooden_picnic_table', x, 0.3, 43.5, { height: 0.75, rotY: PI / 2, keepOut: 1.6 });
    for (const x of [-30, 20, 54]) k.prop('cyclone/metal_trash_can', x, 0.3, 45.8, { height: 0.91 });
    /* the red CYCLONE letters at the crest of the lift, on a white steel frame */
    for (const s of [-1, 1]) {
      k.sign('CYCLONE', 9, 2.4, s * 2.0, 25.6, -60, 'transparent', '#ff3a2a', 150, s * PI / 2, { border: false });
      for (const dz of [-4.4, 0, 4.4]) k.box(0.14, 3.4, 0.14, s * 1.9, 24.6, -60 + dz, steelW);
      for (const y of [24.4, 26.8]) k.box(0.12, 0.12, 9, s * 1.9, y, -60, steelW);
    }
    // eggs: the documented oddities of the ride
    k.egg(v(0, 24.6, -62), { id: 'cyclone-crest', title: 'Seventy five feet, not eighty five', year: '1927', text: 'The lift hill is 75 feet high. The often quoted 85 feet is measured to the top of the CYCLONE sign above it, ten feet higher than the track. The first drop falls at 58.1 degrees and was cut by 5 feet in 1939.', clue: 'Ride to the crest of the lift hill and read the red letters.', source: { name: 'Coney Island Cyclone, Wikipedia', url: 'https://en.wikipedia.org/wiki/Coney_Island_Cyclone' } }, { r: 1.6 });
    k.egg(v(-1.3, 3.0, -32), { id: 'cyclone-steel', title: 'A wooden coaster on steel', text: 'The Cyclone runs on a wooden track, but the white structure under it is steel: vertical I beams, tie bars and diagonal bracing joined by riveted plates. Coaster databases class it as a hybrid for that reason.', clue: 'Look at the white bents under the lift hill.', source: { name: 'Coney Island Cyclone, Wikipedia', url: 'https://en.wikipedia.org/wiki/Coney_Island_Cyclone' } }, { r: 1.6 });
    k.egg(v(4, 3.6, 6), { id: 'cyclone-franco', title: 'The man who found his voice', year: '1948', text: 'In 1948, by several accounts, a coal miner named Emilio Franco who could not speak screamed on the first drop. Back at the station he said I feel sick, then fainted when he realised he had spoken.', clue: 'Wait on the station platform where the trains come back in.', source: { name: 'Coney Island Cyclone, Wikipedia', url: 'https://en.wikipedia.org/wiki/Coney_Island_Cyclone' } }, { r: 1.6 });
    k.egg(v(6, 6, -88), { id: 'cyclone-lindbergh', title: 'Better than flying', year: '1929', text: 'Charles Lindbergh is said to have ridden the Cyclone two years after it opened and called it greater than flying an airplane at top speed. The ride reaches about 60 miles an hour at the bottom of the first drop.', clue: 'Find the low turn at the bottom of the first drop.', source: { name: 'Coney Island Cyclone, Wikipedia', url: 'https://en.wikipedia.org/wiki/Coney_Island_Cyclone' } }, { r: 1.8 });
    k.egg(v(0, 11.2, 12.4), { id: 'cyclone-quarter', title: 'Twenty five cents', year: '1927', text: 'The Cyclone opened on 26 June 1927 at Surf Avenue and West 10th Street and cost 25 cents a ride, 35 cents on Sundays. The city bought it for $1.2 million in 1969, and in 1975 a rider named Michael Boodley took 1,001 rides in a row over 45 hours.', clue: 'Look up at the CYCLONE sign over the station entrance.', source: { name: 'Coney Island Cyclone, Wikipedia', url: 'https://en.wikipedia.org/wiki/Coney_Island_Cyclone' } }, { r: 1.6 });
    k.egg(v(WX, 26, WZ), { id: 'cyclone-wonderwheel', title: 'The wheel with sliding cars', year: '1920', text: 'The Wonder Wheel opened on Memorial Day 1920 on West 12th Street, just north of the boardwalk. It stands 150 feet high with 24 cars: eight white cars fixed to the rim and sixteen that swing and slide inward on curved tracks.', clue: 'Look west along the boardwalk at the big wheel.', source: { name: 'Wonder Wheel, Wikipedia', url: 'https://en.wikipedia.org/wiki/Wonder_Wheel' } }, { r: 3 });
    /* THE TRICK, anamorphic floor type: from the boardwalk steps, looking north at the station, the words painted flat
       across the sand stand up like a sign on legs in front of the door; one step aside and they smear into the lot */
    floorType(k, 'THE CYCLONE  1927', 0, 32, 1.25, 0, 0, 4.5, 7.5, 0.95, '#d62a22', 150);
    k.egg(v(0, 0.6, 22), { id: 'cyclone-floor-sign', title: 'A sign that is not there', text: 'The red letters in front of the station are painted flat on the sand, stretched so that from one spot on the boardwalk they stand up like a board on legs. Painters of pavement art and of the big sports field logos use the same anamorphic trick.', clue: 'Stand on the boardwalk in line with the station door and look at the sand.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.8 });
    // the works: the station's platform wall, the queue fence panels, the boardwalk billboards, the lattice bases
    const mounts: Mount[] = [];
    for (let i = 0; i < 6; i++) { const z = -9 + i * 3.6; mounts.push({ position: v(5.78, 4.4, z), rotation: -PI / 2, target: v(1, 4, z), width: 3.0, height: 1.8, style: 'white', wash: false }); k.box(0.1, 2.2, 3.3, 5.9, 4.4, z, sidingR); }
    for (let i = 0; i < 6; i++) { const z = -8 + i * 3.6; k.box(0.14, 2.4, 3.2, 17.7, 1.6, z, sidingR); mounts.push({ position: v(17.6, 1.7, z), rotation: -PI / 2, target: v(13.2, 2, z), width: 2.8, height: 1.7, style: 'white', wash: false }); }
    for (let i = 0; i < 6; i++) { const x = -60 + i * 24; k.box(5, 3.4, 0.4, x, 3.4, 47.3, dark); for (const dx of [-2.2, 2.2]) k.box(0.2, 5, 0.2, x + dx, 2.5, 47.3, dark); mounts.push({ position: v(x, 3.5, 47.05), rotation: PI, target: v(x, 3, 40), width: 4.6, height: 2.7, style: 'black', wash: false }); }
    for (const [x, z] of [[-4, -30], [-4, -50], [30, -60], [30, -40]]) { k.box(0.3, 3, 4.6, x, 1.9, z, timber); mounts.push({ position: v(x + (x < 0 ? -0.2 : 0.2), 2.0, z), rotation: x < 0 ? -PI / 2 : PI / 2, target: v(x < 0 ? -12 : 40, 2, z), width: 4.2, height: 2.5, style: 'white', wash: false }); }
    // the ride as the route: every point sits at a rider's eye above the rail
    const path = pts.map((p) => p.clone().add(v(0, 1.25, 0)));
    return { mounts, spawn: path[0].clone(), look: v(0, 12, -50), eye: 1.25, /* cyclone: the six boardwalk works sit at x +/- 60 and z 47, outside the old bounds, so the visitor was fenced off from a third of the room */ bounds: [-64, 64, -100, 44], path, style: 'white' };
  },
};

/* ---------------- 43 THE BROOKLYN BRIDGE WALKWAY ---------------- */
export const brooklynbridge: RoomDef = {
  id: 'brooklynbridge',
  name: 'Between the cables',
  area: 'THE BROOKLYN BRIDGE',
  mood: 'Golden hour crossing',
  color: '#c9b08a',
  description: 'The plank promenade above the traffic, the gothic towers, the web of cables, Manhattan ahead and the harbor below, the works hung on the tower piers and the lamp banners.',
  signatures: 'The two granite towers with pointed double arches, four main cables and the diagonal stay web, the raised timber walkway between the roadways, the iron lamps, the river far below.',
  build(k, ctx) {
    k.sky({ top: 0x4d78b8, horizon: 0xf2c896, ground: 0x2c3a44, fog: 0.0016, sun: { az: 4.75, el: 0.12, color: 0xffc078, size: 22 }, haze: 0.45, env: 0.9 });
    k.hemi(0xffe0c0, 0x2a323a, 0.8);
    k.sun(0xffc890, 2.4, -80, 22, -60, true, 90);
    /* THE BIG UPGRADE wave 3a (2026-11-24): the towers in scanned limestone and granite blocks with their pilasters,
       string courses and cornice; the promenade in scanned planks laid across the walk; the steel in the bridge's
       tan paint, with the stiffening trusses built as lattice beside the roadways and under the walk; cable bands on
       the mains; Central Park style lanterns (CC0) on the lamp posts and park benches; the Emily Warren Roebling
       plaque; the trick is the date painted on the planks. */
    const R = 'brooklynbridge';
    const granite = sk(k, R, 'stone', 4.5, { tint: 0xf4ead6, roughness: 0.85, gain: 1.25 }),
      plank = sk(k, R, 'plank', 2.0, { tint: 0xf2dcc0, roughness: 0.8 }),
      cable = k.flat(0x8c8476, 0.5, 0.55),
      iron = k.flat(0x24262a, 0.75, 0.45),
      tan = sk(k, R, 'steel', 1.5, { tint: 0xc4b496, colour: false, roughness: 0.55, metalness: 0.35 }),
      asphalt = sk(k, R, 'road', 4, { tint: 0x8a8a8a, roughness: 0.9 }),
      glass = k.glass(0x9fc4d8, 0.35, 0.08),
      warm = k.glow(0xffd8a0);
    const TZ = [-70, 210];    // the two towers along z; the visitor works the Manhattan half
    const DECK = 0, ROAD = -5.5, RIVER = -38;   // the promenade runs 18 ft (5.5 m) above the roadways; 127 ft clearance over the river
    // river, both shores, the skylines, the other bridges far
    k.water({ y: RIVER, color: 0x30506a, w: 600, d: 700, z: 70, amp: 1.2 });
    k.skyline({ z: -190, count: 40, spacing: 8, scale: 4.8, base: RIVER, seed: 109, lit: 0.45, glow: 1.2, tint: 0x3a4250, spires: true });
    k.skyline({ z: 330, count: 30, spacing: 10, scale: 2.2, base: RIVER, seed: 110, lit: 0.3, glow: 0.8, tint: 0x4a4a52, rows: 1 });
    for (const z of [-100, 300]) { k.box(180, 6, 60, 0, RIVER + 3, z, k.pbr('bbQuay', X.ashlar(0x6a6a64, 85, 2), 0.1)); }
    for (let x = -100; x <= -60; x += 8) k.box(3, 30, 1.2, x, RIVER + 15, 130, iron);
    k.box(44, 1.2, 1.4, -80, RIVER + 30, 130, iron);
    // the towers: two piers each with a pointed arch pair, the cornice, the saddles
    for (const tz of TZ) {
      for (const s of [-1, 1]) k.box(10, 84, 14, s * 12, RIVER + 42, tz, granite);
      k.box(34, 18, 14, 0, RIVER + 84 - 9, tz, granite);
      k.box(36, 2, 16, 0, RIVER + 85, tz, granite);
      k.box(34, 4, 14, 0, ROAD - 2.5, tz, granite);
      // a pair of Gothic pointed arches, 117 ft (35.7 m) tall from the roadway and 33.75 ft (10.3 m) wide
      for (const s of [-1, 1]) { k.arch(10.3, 35.7, 14, s * 6.4, ROAD, tz, granite, true, 0.8); }
      // the flagpole on each tower top
      k.beam(v(0, RIVER + 85.5, tz), v(0, RIVER + 95, tz), 0.12, iron, 6);
      k.box(0.06, 1.6, 2.6, 0, RIVER + 94.1, tz + 1.4, k.flat(0xb22234, 0, 0.8));
      k.box(2.4, 84, 14, 0, RIVER + 42, tz, granite);
      /* pilasters up both faces of each pier, string courses at the roadway and the arch heads, a corbelled cornice */
      for (const s of [-1, 1]) for (const dx of [-4.2, 4.2]) for (const f of [-1, 1]) k.box(1.4, 80, 0.5, s * 12 + dx, RIVER + 40, tz + f * 7.2, granite);
      for (const y of [ROAD + 0.6, ROAD + 30.2, RIVER + 80.5]) for (const f of [-1, 1]) k.box(35, 0.9, 0.7, 0, y, tz + f * 7.3, granite);
      for (let x = -16.5; x <= 16.5; x += 1.5) for (const f of [-1, 1]) k.box(0.6, 0.7, 0.5, x, RIVER + 83.4, tz + f * 7.4, granite);
      for (const s of [-1, 1]) k.box(4, 3, 4, s * 12, RIVER + 87, tz, iron);
      k.block(-17, -7, tz - 7.2, tz + 7.2);
      k.block(-1.3, 1.3, tz - 7.2, tz + 7.2);
      k.block(7, 17, tz - 7.2, tz + 7.2);
    }
    // the deck: two roadways at ROAD, the promenade raised on its trusses between them
    for (const s of [-1, 1]) { k.box(11, 0.6, 400, s * 9.5, ROAD - 0.3, 70, asphalt); for (const dx of [-0.14, 0.14]) k.box(0.1, 0.012, 380, s * 9.5 + dx, ROAD + 0.01, 70, k.flat(0xe6a626, 0, 0.6)); }
    k.box(6.4, 0.3, 400, 0, DECK - 0.15, 70, plank);
    for (let z = -140; z <= 280; z += 4) { k.box(6.6, 0.3, 0.3, 0, DECK - 0.45, z, iron); k.box(0.24, -ROAD, 0.24, -3.4, ROAD / 2, z, iron); k.box(0.24, -ROAD, 0.24, 3.4, ROAD / 2, z, iron); }
    for (const s of [-1, 1]) { k.rail(s * 3.1, 70, 400, iron, 1.05, 'z', 2); k.box(0.06, 0.06, 400, s * 3.1, DECK + 0.6, 70, iron); }
    k.box(50, 1.4, 400, 0, ROAD - 1.3, 70, tan);
    /* the stiffening trusses: lattice under the promenade's two edges, and the outer pair beside the roadways that
       stand above the traffic; verticals every four metres, an X in every panel, top and bottom chords */
    { const tm: T.Matrix4[] = [], ch: T.Matrix4[] = [];
      for (const [x, y0, y1] of [[-3.4, ROAD, DECK - 0.45], [3.4, ROAD, DECK - 0.45], [-15.6, ROAD - 0.6, ROAD + 3.2], [15.6, ROAD - 0.6, ROAD + 3.2]] as const) {
        for (let z = -140; z < 280; z += 4) {
          if (TZ.some((t) => Math.abs(z + 2 - t) < 9)) continue;
          if (Math.abs(x) > 10) tm.push(beamAt(v(x, y0, z), v(x, y1, z), 0));
          tm.push(beamAt(v(x, y0, z), v(x, y1, z + 4), 0), beamAt(v(x, y0, z + 4), v(x, y1, z), 0));
        }
        for (const y of [y0, y1]) for (let z = -140; z < 280; z += 20) ch.push(beamAt(v(x, y, z), v(x, y, z + 20), PI / 2));
      }
      k.instances(iSection(0.2, 0.14, 0.02, 0.02), tan, tm);
      k.instances(iSection(0.42, 0.3, 0.03, 0.04), tan, ch);
    }
    k.box(6.4, 0.02, 400, 0, RIVER + 0.3, 70, k.flat(0x1a1a1a, 0, 1));
    // cables: four main catenaries between the towers and down to the anchorages, suspenders, and the diagonal stays
    const sag = (z: number, z0: number, z1: number, top: number, low: number) => { const t = (z - z0) / (z1 - z0); return low + (top - low) * (2 * t - 1) ** 2; };
    for (const x of [-15.5, -8.5, 8.5, 15.5]) {
      const mid: T.Vector3[] = []; for (let z = TZ[0]; z <= TZ[1]; z += 8) mid.push(v(x, sag(z, TZ[0], TZ[1], RIVER + 86, DECK + 4), z));
      k.curve(mid, 0.28, cable, 40);
      const back: T.Vector3[] = []; for (let z = TZ[0]; z >= TZ[0] - 180; z -= 10) back.push(v(x, RIVER + 86 - ((TZ[0] - z) / 180) ** 1.15 * (RIVER + 86 - ROAD + 2), z));
      k.curve(back, 0.28, cable, 20);
      const fwd: T.Vector3[] = []; for (let z = TZ[1]; z <= TZ[1] + 120; z += 12) fwd.push(v(x, RIVER + 86 - ((z - TZ[1]) / 180) ** 1.15 * (RIVER + 86 - ROAD + 2), z));
      k.curve(fwd, 0.28, cable, 12);
      for (let z = TZ[0] + 8; z < TZ[1]; z += 8) k.beam(v(x, sag(z, TZ[0], TZ[1], RIVER + 86, DECK + 4), z), v(x, ROAD, z), 0.035, cable, 3);
      for (let z = TZ[0] - 8; z > TZ[0] - 170; z -= 8) k.beam(v(x, RIVER + 86 - ((TZ[0] - z) / 180) ** 1.15 * (RIVER + 86 - ROAD + 2), z), v(x, ROAD, z), 0.035, cable, 3);
    }
    { const bands: T.Matrix4[] = [];
      for (const x of [-15.5, -8.5, 8.5, 15.5]) for (let z = TZ[0] + 8; z < TZ[1]; z += 8) { const y = sag(z, TZ[0], TZ[1], RIVER + 86, DECK + 4), y2 = sag(z + 0.5, TZ[0], TZ[1], RIVER + 86, DECK + 4); bands.push(beamAt(v(x, y - (y2 - y) * 0.5, z - 0.25), v(x, y2, z + 0.25))); }
      const bg = new T.CylinderGeometry(0.36, 0.36, 1, 10); bg.translate(0, 0.5, 0);
      k.instances(bg, iron, bands);
    }
    for (const tz of TZ) for (const x of [-15.5, -8.5, 8.5, 15.5]) for (let i = 1; i <= 12; i++) { for (const d of [-1, 1]) k.beam(v(x, RIVER + 82, tz), v(x, ROAD, tz + d * i * 9), 0.03, cable, 3); }
    // lamps, benches, the pedestrians, traffic on both roadways
    /* the lamp posts and benches: built in code first, then the CC0 models (Central Park lantern, park bench) take
       their place when they load; a failed load keeps the code ones */
    { const lampAt: [number, number][] = [], lm = k.objects.length;
      for (let z = -130; z <= 200; z += 22) for (const s of [-1, 1]) { k.lamp(s * 2.7, z, 3.8, iron, 0xffd9a8, 22); lampAt.push([s * 2.7, z]); }
      const posts = standIn(k, lm).filter((o) => o instanceof T.Mesh && o.geometry instanceof T.LatheGeometry);
      void hero(k, 'brooklynbridge/cp_gaslamp', { height: 4.1 }).then((h) => {
        if (!h || !k.live) return;
        hide(posts);
        const ins = heroInstances(k, h, lampAt.length), m = new T.Matrix4();
        lampAt.forEach(([x, z], i) => ins.setAt(i, m.makeTranslation(x, 0, z)));
        ins.commit();
      });
      const benchAt: number[] = [], bm = k.objects.length;
      for (let z = -120; z <= 40; z += 40) { k.bench(-2.2, z, PI / 2, plank, iron, 2.0); benchAt.push(z); }
      const benches = standIn(k, bm);
      void hero(k, 'brooklynbridge/cp_bench', { width: 2.0 }).then((h) => {
        if (!h || !k.live) return;
        hide(benches);
        const ins = heroInstances(k, h, benchAt.length), m = new T.Matrix4(), q = new T.Quaternion().setFromAxisAngle(Y1, PI / 2), one = new T.Vector3(1, 1, 1);
        benchAt.forEach((z, i) => ins.setAt(i, m.compose(v(-2.3, 0, z), q, one)));
        ins.commit();
      });
    }
    k.crowd([v(0.6, DECK, -150), v(0.8, DECK, -60), v(0.6, DECK, 40), v(0.8, DECK, 150)], 36, { seed: 44, speed: 1.2, spread: 2.6, animate: !ctx.reduced });
    const carG = new T.BoxGeometry(1.8, 1.4, 4.2), cars: T.Object3D[] = [];
    const carCols = [0xd8d0c0, 0x1a1a1a, 0xc62828, 0x2b4a8a, 0xf1c531, 0x6a6a6e];
    for (let i = 0; i < 28; i++) { const s = i % 2 ? 1 : -1; const c = new T.Mesh(carG, k.flat(carCols[i % carCols.length], 0.4, 0.4)); c.position.set(s * (9.5 + (i % 4 < 2 ? -2.4 : 2.4)), ROAD + 0.7, -150 + (i * 31) % 420); c.userData.s = s; c.userData.v = 9 + (i % 5) * 1.5; k.add(c); cars.push(c); const lamp = new T.Mesh(new T.BoxGeometry(1.4, 0.2, 0.1), warm); lamp.position.set(0, 0, s * 2.1); c.add(lamp); }
    if (!ctx.reduced) k.ticks.push((_t, dt) => { for (const c of cars) { c.position.z += c.userData.s * c.userData.v * Math.min(dt, 0.1); if (c.position.z > 290) c.position.z = -150; if (c.position.z < -150) c.position.z = 290; } });
    const boats: T.Group[] = [];
    for (const z of [-40, 60, 160]) { const boat = new T.Group(); const hull = new T.Mesh(new T.BoxGeometry(6, 2.2, 22), k.flat(0xe6e2da, 0.2, 0.6)); hull.position.y = 1; boat.add(hull); const cab = new T.Mesh(new T.BoxGeometry(4, 2.4, 8), k.flat(0xd84a2a, 0.2, 0.6)); cab.position.set(0, 3.2, 0); boat.add(cab); k.add(boat); boats.push(boat); const route = k.spline([v(-120, RIVER + 0.3, z), v(0, RIVER + 0.3, z + 40), v(120, RIVER + 0.3, z), v(0, RIVER + 0.3, z - 40)], true); if (!ctx.reduced) k.rider(boat, route, 3.2, z); else boat.position.copy(route.getPointAt(0.1)); }
    /* 2026-10-28: the box boats become the hero ferry and tug (h_ferry, h_tug, made 2026-10-09 nose to +z, the way
       k.rider points them): a ferry, a tug, a ferry. A failed load keeps the boxes. */
    boats.forEach((boat, i) => { void hero(k, i === 1 ? 'h_tug' : 'h_ferry', { length: i === 1 ? 14 : 22 }).then((h) => { if (!h) return; for (const m of boat.children) m.visible = false; h.position.y = -0.7; boat.add(h); }); });
    k.censusWall({ x: -3.22, y: 1.6, z: -30, rotY: PI / 2, cols: 40, rows: 2, tile: 0.55, gap: 0.05, start: ctx.wallStart(3000, 80), pieces: ctx.all, backing: iron });
    k.sign('BROOKLYN BRIDGE  ·  1883', 8, 0.8, 0, DECK + 5.4, TZ[0] + 7.3, '#2a2622', '#e8dcc0', 80, 0, { border: true });
    /* the bronze plaque on the Manhattan tower, set up in 1951 by the Brooklyn Engineers' Club */
    k.box(2.3, 1.3, 0.08, 0, DECK + 2.0, TZ[0] + 7.04, k.pbr('bbBronze', X.gilt(0x6a5434), 2, { metalness: 0.8, roughness: 0.45 }));
    k.sign('EMILY WARREN ROEBLING  1843  1903', 2.1, 0.34, 0, DECK + 2.4, TZ[0] + 7.1, '#4a3a22', '#e8d29a', 46, 0);
    k.sign('WHOSE FAITH AND COURAGE HELPED HER HUSBAND', 2.1, 0.24, 0, DECK + 2.0, TZ[0] + 7.1, '#4a3a22', '#e8d29a', 34, 0);
    k.sign('COMPLETE THE CONSTRUCTION OF THIS BRIDGE', 2.1, 0.24, 0, DECK + 1.72, TZ[0] + 7.1, '#4a3a22', '#e8d29a', 34, 0);
    k.sign('PEDESTRIANS  KEEP RIGHT', 2.4, 0.5, -2.95, DECK + 2.6, 24, '#1f5a3a', '#f2f2ea', 60, PI / 2, { border: true });
    k.sign('MANHATTAN', 2.4, 0.5, 2.95, DECK + 2.6, 24, '#1f5a3a', '#f2f2ea', 80, -PI / 2, { border: true });
    /* a Firefly matte of Lower Manhattan for far behind the code skyline; invisible until the file lands */
    fireflyPlate(k, 'assets/museum/tex/brooklynbridge/ff_lower_manhattan.webp', 700, 175, 0, RIVER + 70, -330, 0, new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), true);
    // eggs
    k.egg(v(8.5, 4.2, 70), { id: 'brooklynbridge-wire', title: 'The crooked wire', year: '1877', text: 'The contractor J. Lloyd Haigh supplied inferior wire for the cables: of 80 rings tested, only five met the standard. Because the bad wire was already spun in, 150 extra wires were added to each cable, leaving the bridge about four times as strong as needed instead of six to eight.', clue: 'Look at the main cable where it dips lowest beside the walk, midway between the towers.', source: { name: 'Brooklyn Bridge, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn_Bridge' } }, { r: 1.8 });
    k.egg(v(0, 2.4, TZ[0] + 7.6), { id: 'brooklynbridge-caisson', title: 'The bends, named here', year: '1872', text: 'The towers stand on caissons sunk into the riverbed, and the men who dug in them came up sick. The project physician Andrew Smith named it caisson disease and treated 110 cases between January and May 1872. The chief engineer, Washington Roebling, was paralysed by it.', clue: 'Stand at the foot of the Manhattan tower, between the two arches.', source: { name: 'Brooklyn Bridge, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn_Bridge' } }, { r: 1.6 });
    k.egg(v(0, RIVER + 94, TZ[0]), { id: 'brooklynbridge-whiteflags', title: 'The white flags', year: '2014', text: 'On 22 July 2014 the American flags on top of both towers were found swapped for bleached white flags. Two Berlin artists later claimed it, saying the flags celebrated the beauty of public space.', clue: 'Look up at the flagpole on top of the Manhattan tower.', source: { name: 'Brooklyn Bridge, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn_Bridge' } }, { r: 2.4 });
    k.egg(v(0, 1.4, 186), { id: 'brooklynbridge-stampede', title: 'Six days after opening', year: '1883', text: 'The bridge opened on 24 May 1883. On 30 May a woman fell down a stairway at the Brooklyn approach, and the rumour that the bridge was collapsing set off a stampede that killed at least twelve people.', clue: 'Walk toward the Brooklyn tower until the planks run out.', source: { name: 'Brooklyn Bridge, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn_Bridge' } }, { r: 1.6 });
    k.egg(v(-1.6, 1.2, 120), { id: 'brooklynbridge-jumbo', title: 'Twenty one elephants', year: '1884', text: 'On 17 May 1884 Jumbo the elephant led a parade of 21 elephants across the bridge, a show by P. T. Barnum that also answered anyone still doubting it would hold.', clue: 'Look along the planks past the middle of the span.', source: { name: 'Brooklyn Bridge, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn_Bridge' } }, { r: 1.6 });
    k.egg(v(0, 1.2, -156), { id: 'brooklynbridge-vaults', title: 'Wine under the anchorage', year: '1876', text: 'From 1876 the city rented out the vaults inside the Manhattan anchorage to pay for upkeep, and they were used to store wine at a steady 60 degrees. During the 1950s rebuilding a fallout shelter was built beneath the Manhattan approach and stocked for a nuclear attack.', clue: 'Walk to the Manhattan end of the promenade, over the anchorage.', source: { name: 'Brooklyn Bridge, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn_Bridge' } }, { r: 1.6 });
    k.egg(v(0, DECK + 2.0, TZ[0] + 7.4), { id: 'brooklynbridge-emily', title: 'The engineer nobody hired', year: '1883', text: 'When Washington Roebling was confined to his room by caisson disease, his wife Emily Warren Roebling carried his instructions to the site and dealt with the engineers and officials for years. She was the first person to cross the finished bridge, carrying a rooster as a sign of victory. The plaque on the tower honours her.', clue: 'Read the bronze plaque at the foot of the Manhattan tower.', source: { name: 'Emily Warren Roebling, Wikipedia', url: 'https://en.wikipedia.org/wiki/Emily_Warren_Roebling' } }, { r: 1.6 });
    /* THE TRICK, anamorphic floor type: from the middle of the walk, facing Manhattan, the year painted along the
       planks stands up in the air like a sign hung between the cables; a step to either side and it falls flat */
    floorType(k, '1883', 0, 46, 3, DECK, 0, 9, 3.4, 2.0, '#f2ead6', 520);
    k.egg(v(0, DECK + 0.4, 30), { id: 'brooklynbridge-floor-sign', title: 'A year standing on the planks', text: 'The 1883 ahead of you is painted flat on the boards, stretched so that from one spot on the walk it stands upright. The bridge opened on 24 May 1883 after fourteen years of building.', clue: 'Stand in the middle of the walk well short of the Manhattan tower and look ahead at the planks.', source: { name: 'Brooklyn Bridge, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn_Bridge' } }, { r: 1.6 });
    // the works: the Manhattan tower's arch piers on both faces, lamp banners along the walk, rail panels
    const mounts: Mount[] = [];
    for (const dz of [-7.3, 7.3]) for (const x of [-10, 10]) mounts.push({ position: v(x, 3.6, TZ[0] + dz + (dz > 0 ? 0.02 : -0.02)), rotation: dz > 0 ? 0 : PI, target: v(Math.sign(x) * 2.6, 3, TZ[0] + dz * 2), width: 2.8, height: 1.8, style: 'steel', wash: false });
    for (let i = 0; i < 10; i++) { const z = -130 + i * 22; const s = i % 2 ? 1 : -1; k.box(0.1, 2.2, 1.5, s * 2.75, 5.0, z + 1.2, iron); mounts.push({ position: v(s * 2.68, 5.0, z + 1.2), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 3, z + 1.2), width: 1.4, height: 2.0, style: 'steel', wash: false }); }
    for (let i = 0; i < 8; i++) { const z = -16 + i * 9; const s = i % 2 ? 1 : -1; k.box(0.1, 1.5, 3.4, s * 3.16, 1.65, z, iron); mounts.push({ position: v(s * 3.08, 1.7, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 2, z), width: 3.0, height: 1.3, style: 'steel', wash: false }); }
    return { mounts, spawn: v(0, DECK + 3, 30), look: v(0, 30, TZ[0]), eye: 3, bounds: [-3.0, 3.0, -160, 190], style: 'steel' };
  },
};

/* ---------------- 44 THE PANORAMA ---------------- */
export const panorama: RoomDef = {
  id: 'panorama',
  name: 'The city on a table',
  area: 'THE QUEENS MUSEUM',
  mood: 'Model dusk cycle',
  color: '#8ab0c8',
  description: 'The Panorama of the city, every borough in miniature under a hall, its lights cycling from day to dusk, a glass walkway around it, the works on the walls above.',
  signatures: 'The 1964 scale model of all five boroughs with its rivers and bridges, the darkened hall with a raised ramped walkway circling the model, the day to night lighting cycle, the Unisphere outside the glass.',
  build(k, ctx) {
    k.sky({ top: 0x7fa0c8, horizon: 0xe8e8e0, ground: 0x5a5a55, fog: 0.002, sun: { az: 3.2, el: 0.9, color: 0xfff4e6, size: 12 }, env: 0.7 });
    k.hemi(0xdde4f0, 0x2a2a30, 0.45);
    k.sun(0xfff2dc, 0.8, 30, 60, 40, false, 60);
    /* THE BIG UPGRADE wave 3a (2026-11-24): the model coloured the way the Panorama is, limestone, brick,
       brownstone, glass and white towers with the parks treed and the water catching the light; the hall in scanned
       plaster and stone tile with the lighting grid overhead; the glass ring on posts; borough names on the rim; a
       Firefly frieze queued for the high walls; the trick is the scale painted across the harbour. */
    const R = 'panorama';
    const wall = sk(k, R, 'wall', 3, { tint: 0x4a4c54, roughness: 0.9 }),
      floor = sk(k, R, 'floor', 2.4, { tint: 0x6a6660, roughness: 0.45 }),
      glass = k.glass(0xdcecf6, 0.05, 0.02),
      steel = k.flat(0x8c98a4, 0.9, 0.3),
      dark = k.flat(0x121316, 0.4, 0.7),
      waterM = k.flat(0x2a5a7c, 0.35, 0.16, { emissive: 0x0a2a40, emissiveIntensity: 0.55 }),
      landM = k.flat(0xa8a294, 0, 0.9),
      parkM = k.flat(0x4f7038, 0, 0.9),
      bldg = k.flat(0xffffff, 0, 0.75),
      glowCity = k.glow(0xffd090, 1);
    const HW = 64, HD = 46, HH = 13;
    // the hall
    k.box(HW, 0.4, HD, 0, -0.2, 0, floor);
    for (const s of [-1, 1]) { k.box(0.6, HH, HD, s * HW / 2, HH / 2, 0, wall); k.block(s * HW / 2 - 0.5, s * HW / 2 + 0.5, -HD / 2, HD / 2); }
    k.box(HW, HH, 0.6, 0, HH / 2, -HD / 2, wall);
    k.block(-HW / 2, HW / 2, -HD / 2 - 0.5, -HD / 2 + 0.5);
    k.box(HW, 0.6, HD, 0, HH, 0, dark);
    /* the lighting grid under the ceiling: steel beams both ways, track cans aimed at the table */
    { const gm: T.Matrix4[] = [], cans: T.Matrix4[] = [], q = new T.Quaternion(), r4 = X.mulberry(146);
      for (let z = -HD / 2 + 3; z < HD / 2; z += 4) gm.push(beamAt(v(-HW / 2, HH - 0.8, z), v(HW / 2, HH - 0.8, z), 0));
      for (let x = -HW / 2 + 4; x < HW / 2; x += 8) gm.push(beamAt(v(x, HH - 0.5, -HD / 2), v(x, HH - 0.5, HD / 2), PI / 2));
      for (let z = -HD / 2 + 3; z < HD / 2; z += 4) for (let x = -24; x <= 24; x += 3) { if (r4() < 0.45) continue; q.setFromEuler(new T.Euler(0.25 * Math.sign(-z), 0, 0.25 * Math.sign(-x))); cans.push(new T.Matrix4().compose(v(x, HH - 1.2, z), q, v(1, 1, 1))); }
      k.instances(iSection(0.3, 0.16, 0.02, 0.025), k.flat(0x2a2c30, 0.7, 0.45), gm);
      k.instances(new T.CylinderGeometry(0.12, 0.09, 0.42, 10), k.flat(0x141518, 0.6, 0.5), cans);
      k.instances(new T.CircleGeometry(0.085, 10).rotateX(PI / 2), k.glow(0xfff2dc), cans.map((m) => m.clone().multiply(new T.Matrix4().makeTranslation(0, -0.215, 0))));
    }
    /* a Firefly frieze for the high walls, the five boroughs at dusk; dark plaster until the file lands */
    for (const s of [-1, 1]) fireflyPlate(k, 'assets/museum/tex/panorama/ff_boroughs_frieze.webp', 40, 3.4, s * (HW / 2 - 0.31), 10.7, 0, s < 0 ? PI / 2 : -PI / 2, wall);
    k.sign('QUEENS MUSEUM', 10, 1.2, 0, HH - 1.4, HD / 2 + 0.25, 'transparent', '#e8e2d4', 120, 0);
    // the glass entrance wall to the park, the Unisphere outside
    for (let x = -HW / 2 + 2; x < HW / 2; x += 4) k.box(0.3, HH, 0.3, x, HH / 2, HD / 2, steel);
    k.box(HW, HH, 0.12, 0, HH / 2, HD / 2, glass);
    k.block(-HW / 2, -4, HD / 2 - 0.3, HD / 2 + 0.3);
    k.block(4, HW / 2, HD / 2 - 0.3, HD / 2 + 0.3);
    k.box(200, 0.3, 200, 0, -0.4, HD / 2 + 100, k.pbr('qmLawn', X.grass(0x4b6b3a, 45), 0.05));
    k.box(40, 0.2, 60, 0, -0.25, HD / 2 + 40, k.pbr('qmPlaza', X.pavers(0x9a9a94, 46), 0.4));
    const U = v(0, 22, HD / 2 + 70);
    k.sphere(18, U.x, U.y, U.z, k.pbr('qmSphere', X.steel(0x8a8f96, false, 87), 0.5, { metalness: 0.9, roughness: 0.35, wireframe: false, side: T.DoubleSide, transparent: true, opacity: 0.55 }), 24);
    for (const r of [0, 0.5, -0.5]) { const t = k.torus(18.6 + Math.abs(r) * 3, 0.5, U.x, U.y, U.z, steel, 48); t.rotation.set(PI / 2 + r * 0.6, 0, r); }
    for (let i = 0; i < 3; i++) { const a = (i / 3) * PI * 2 + 0.5; k.beam(v(U.x + Math.cos(a) * 6, 0, U.z + Math.sin(a) * 6), v(U.x + Math.cos(a) * 3, 8, U.z + Math.sin(a) * 3), 0.5, steel, 6); }
    k.skyline({ z: HD / 2 + 200, count: 20, spacing: 12, scale: 1.4, base: -1, seed: 111, lit: 0.2, glow: 0.4, tint: 0x8a8e96, rows: 1 });
    // the model table: rivers as the base, the boroughs as low plates, the grid as instanced towers
    const TW = 40, TD = 28, TY = 0.9;
    k.box(TW + 2, TY, TD + 2, 0, TY / 2, 0, dark);
    k.box(TW, 0.08, TD, 0, TY + 0.04, 0, waterM);
    k.block(-TW / 2 - 1, TW / 2 + 1, -TD / 2 - 1, TD / 2 + 1);
    const rnd = X.mulberry(44);
    const plate = (pts: [number, number][], m: T.Material, h = 0.14) => { const sh = new T.Shape(pts.map(([x, z]) => new T.Vector2(x, -z))); const g = new T.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false }); g.rotateX(-PI / 2); const mesh = k.mesh(g, m, 0, TY + 0.06, 0); return mesh; };
    const manhattan: [number, number][] = [[-3, -12], [-1, -13], [1, -12.5], [1.5, -8], [2, -3], [1.6, 3], [0.8, 7], [-0.6, 9], [-2, 8], [-2.4, 3], [-2.6, -3], [-3.2, -8]];
    const bronx: [number, number][] = [[-2, -13.5], [6, -14], [8, -10], [4, -8.5], [2.2, -9.5]];
    const bkqn: [number, number][] = [[3, -7.5], [12, -9], [19, -6], [19, 4], [12, 10], [4, 12], [2.8, 6], [3.4, -1]];
    const jersey: [number, number][] = [[-20, -14], [-5, -14], [-5.2, -9], [-5, -2], [-5.4, 6], [-6, 12], [-20, 14]];
    const staten: [number, number][] = [[-9, 8], [-3, 9.5], [-1, 13], [-7, 14], [-11, 12]];
    plate(manhattan, landM); plate(bronx, landM); plate(bkqn, landM); plate(jersey, k.flat(0x6a6a62, 0, 0.9), 0.1); plate(staten, landM);
    plate([[-1.6, -7.5], [0.9, -7.2], [0.7, -1.5], [-1.4, -1.8]], parkM, 0.16);
    const inside = (pts: [number, number][], x: number, z: number) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, zi] = pts[i], [xj, zj] = pts[j]; if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };
    const towers: T.Matrix4[] = [], glows: T.Matrix4[] = [];
    const unit = new T.BoxGeometry(0.22, 1, 0.22);
    unit.translate(0, 0.5, 0);
    for (let x = -TW / 2 + 0.3; x < TW / 2; x += 0.34) for (let z = -TD / 2 + 0.3; z < TD / 2; z += 0.34) {
      const inM = inside(manhattan, x, z), inB = inside(bronx, x, z) || inside(bkqn, x, z) || inside(staten, x, z);
      if (!inM && !inB) continue;
      if (inside([[-1.6, -7.5], [0.9, -7.2], [0.7, -1.5], [-1.4, -1.8]], x, z) || inside([[7, 6], [9.5, 5.5], [10, 8], [7.4, 8.6]], x, z)) continue;
      const mid = inM && ((z > -3 && z < 3) || z > 5);
      const h = inM ? (mid ? 0.5 + rnd() * 2.4 : 0.15 + rnd() * 0.6) : 0.08 + rnd() * 0.25;
      towers.push(new T.Matrix4().compose(v(x + (rnd() - 0.5) * 0.1, TY + 0.2, z + (rnd() - 0.5) * 0.1), new T.Quaternion(), v(1, h, 1)));
      if (rnd() < 0.12) glows.push(new T.Matrix4().compose(v(x, TY + 0.2 + h + 0.01, z), new T.Quaternion(), v(0.6, 0.03, 0.6)));
    }
    const city = k.instances(unit, bldg, towers);
    { const pal = [0xd9cfbd, 0xd9cfbd, 0xa8705a, 0x8a6a58, 0xeeeae2, 0x8fa4b4, 0x6a6a70, 0xc8b8a0], c = new T.Color(), r2 = X.mulberry(144);
      for (let i = 0; i < towers.length; i++) { const sy = towers[i].elements[5]; const tall = sy > 1.2; c.setHex(tall ? [0x8fa4b4, 0xd9cfbd, 0xeeeae2, 0x6a6a70][Math.floor(r2() * 4)] : pal[Math.floor(r2() * pal.length)]); city.setColorAt(i, c); }
      if (city.instanceColor) city.instanceColor.needsUpdate = true;
    }
    /* trees in Central Park and Prospect Park: green dots on the park plates */
    { const tm: T.Matrix4[] = [], r3 = X.mulberry(145), cp: [number, number][] = [[-1.6, -7.5], [0.9, -7.2], [0.7, -1.5], [-1.4, -1.8]], pp: [number, number][] = [[7, 6], [9.5, 5.5], [10, 8], [7.4, 8.6]];
      plate(pp, parkM, 0.16);
      for (const poly of [cp, pp]) for (let n = 0; n < 340; n++) { const x = -2 + r3() * 13, z = -8 + r3() * 17; if (!inside(poly, x, z)) continue; const sc = 0.6 + r3() * 0.6; tm.push(new T.Matrix4().compose(v(x, TY + 0.26, z), new T.Quaternion(), v(sc, sc, sc))); }
      k.instances(new T.IcosahedronGeometry(0.11, 0), k.flat(0x3e6a2e, 0, 0.9), tm);
    }
    /* the borough names on the rim of the table, facing the walkway */
    for (const [t, x, z, r] of [['MANHATTAN', 0, -TD / 2 - 1.02, PI], ['THE BRONX', 8, -TD / 2 - 1.02, PI], ['BROOKLYN', 8, TD / 2 + 1.02, 0], ['STATEN ISLAND', -8, TD / 2 + 1.02, 0], ['QUEENS', TW / 2 + 1.02, 0, PI / 2], ['NEW JERSEY', -TW / 2 - 1.02, 0, -PI / 2]] as const) k.sign(t, 2.8, 0.36, x, TY * 0.55, z, '#121316', '#d8c8a0', 52, r);
    const cityGlow = k.instances(new T.BoxGeometry(0.22, 1, 0.22), glowCity, glows);
    for (const [x, z, h] of [[0.6, 1.2, 3.6], [-0.4, 8.2, 3.4], [1.2, -0.6, 2.8], [0.2, 2.4, 2.9]]) k.box(0.3, h, 0.3, x, TY + 0.2 + h / 2, z, bldg);
    for (const [x0, z0, x1, z1] of [[0.8, 7.6, 3.6, 8.2], [1.2, 6.2, 3.8, 6.6], [1.8, 0.6, 3.4, 1.4], [-2.4, -6, -5, -6.4], [1.9, -3.4, 3.2, -3.6]]) k.beam(v(x0, TY + 0.4, z0), v(x1, TY + 0.4, z1), 0.04, steel, 3);
    // the Twin Towers are still on the model at the tip of Manhattan
    for (const dx of [-0.2, 0.2]) k.box(0.26, 3.3, 0.26, -1.2 + dx, TY + 0.2 + 1.65, 7.4 + dx * 0.5, bldg);
    // the model planes at LaGuardia, guided along a long wire
    const LGA = v(7, TY + 0.28, -8.3), LGB = v(10.5, TY + 3.2, -12.6);
    k.beam(LGA, LGB, 0.008, steel, 3);
    const plane = new T.Group();
    { const fus = new T.Mesh(new T.BoxGeometry(0.06, 0.06, 0.42), bldg); plane.add(fus); const wing = new T.Mesh(new T.BoxGeometry(0.44, 0.015, 0.1), bldg); plane.add(wing); const tail = new T.Mesh(new T.BoxGeometry(0.16, 0.08, 0.05), bldg); tail.position.set(0, 0.04, -0.18); plane.add(tail); }
    plane.position.copy(LGA); plane.lookAt(LGB); k.add(plane);
    if (!ctx.reduced) k.ticks.push((t) => { const u = (Math.sin(t * 0.35) + 1) / 2; plane.position.lerpVectors(LGA, LGB, u); });
    k.egg(LGA.clone().lerp(LGB, 0.5), { id: 'panorama-laguardia', title: 'Planes on wires', year: '1964', text: 'Tiny model airplanes take off from and land at the model LaGuardia Airport, guided mechanically by long wires. The Panorama was built for the 1964 World\'s Fair by Lester Associates, a team of 100 people in West Nyack who worked on it for three years.', clue: 'Find the airport on the north shore of Queens and watch the wire.', source: { name: 'Panorama of the City of New York, Wikipedia', url: 'https://en.wikipedia.org/wiki/Panorama_of_the_City_of_New_York' } }, { r: 2.4 });
    k.egg(v(-1.2, TY + 2.4, 7.4), { id: 'panorama-twins', title: 'Still standing here', text: 'The original Twin Towers remain on the model even though new buildings stand on the site today. The museum has left the destroyed structures in place until construction there is complete.', clue: 'Look at the tip of Lower Manhattan.', source: { name: 'Panorama of the City of New York, Wikipedia', url: 'https://en.wikipedia.org/wiki/Panorama_of_the_City_of_New_York' } }, { r: 1.4 });
    k.egg(v(0, TY + 0.4, -TD / 2 - 1.2), { id: 'panorama-scale', title: 'One inch, one hundred feet', text: 'The model is at a scale of one inch to 100 feet and covers 9,335 square feet. It is made of 273 sections, each four by ten feet, of Formica board and polyurethane foam.', clue: 'Stand at the north edge of the table and look at the seams.', source: { name: 'Panorama of the City of New York, Wikipedia', url: 'https://en.wikipedia.org/wiki/Panorama_of_the_City_of_New_York' } }, { r: 1.6 });
    k.egg(v(16, TY + 0.4, TD / 2 + 0.6), { id: 'panorama-rockaway', title: 'The missing peninsula', text: 'The Far Rockaway section of Queens was never installed, for lack of space. Everything else built before 1992 in all five boroughs is on the table.', clue: 'Look at the south east corner of the table, past Brooklyn and Queens.', source: { name: 'Panorama of the City of New York, Wikipedia', url: 'https://en.wikipedia.org/wiki/Panorama_of_the_City_of_New_York' } }, { r: 1.6 });
    k.egg(v(-(TW / 2 + 4.5), 2.4 + 1.4, -6), { id: 'panorama-helicopter', title: 'A helicopter ride for a dime', year: '1964', text: 'At the World\'s Fair visitors paid 10 cents for a nine minute simulated helicopter ride around the model in mechanical cars. The cars were taken out before the museum reopened in 1994, and the walkway took their place.', clue: 'Walk the raised ring along the west side of the model.', source: { name: 'Panorama of the City of New York, Wikipedia', url: 'https://en.wikipedia.org/wiki/Panorama_of_the_City_of_New_York' } }, { r: 1.6 });
    k.egg(v(1.2, TY + 3.2, -0.6), { id: 'panorama-adopt', title: 'Adopt a building', year: '2009', text: 'Lester Associates were hired back to update the model for the 1992 reopening and changed more than 60,000 structures, taking it from 835,000 to about 895,000 buildings. Since 2009 people can pay for an accurate scale model of a newer building to be added.', clue: 'Look among the Midtown towers for the newer ones.', source: { name: 'Panorama of the City of New York, Wikipedia', url: 'https://en.wikipedia.org/wiki/Panorama_of_the_City_of_New_York' } }, { r: 1.4 });
    /* THE TRICK, anamorphic type across the harbour: from the south side of the ring the scale of the model stands up
       over the water like a card on the table; from anywhere else it is a smear of paint on the bay */
    floorType(k, 'ONE INCH  100 FEET', 5, 18.5, 2.4 + 3, TY + 0.1, 0, 4.6, 6.4, 1.2, '#f2e6c4', 110);
    k.egg(v(5, TY + 0.6, 12), { id: 'panorama-floor-sign', title: 'The scale, standing up', text: 'The words over the harbour are painted flat on the model, stretched so that from one spot on the walkway they stand upright. The model really is at one inch to one hundred feet: a 1,250 foot tower is a little over a foot tall.', clue: 'Stand on the south side of the ring between two of the glass panels and look down across the harbour.', source: { name: 'Panorama of the City of New York, Wikipedia', url: 'https://en.wikipedia.org/wiki/Panorama_of_the_City_of_New_York' } }, { r: 1.6 });
    const pinLight = k.point(0, 5, 0, 0xfff0d0, 40, 30);
    const modelLights = [k.point(-10, 6, -6, 0xfff0d0, 25, 22), k.point(10, 6, 6, 0xfff0d0, 25, 22)];
    // the dusk cycle: every ninety seconds the hall goes from day to night and the model's windows come on
    if (!ctx.reduced) k.ticks.push((t) => { const c = 0.5 + 0.5 * Math.sin(t * (PI * 2 / 90)); const night = Math.pow(c, 1.5); pinLight.intensity = 40 * (1 - 0.85 * night); for (const l of modelLights) l.intensity = 25 * (1 - 0.8 * night); (glowCity as T.MeshBasicMaterial).opacity = 0.1 + 0.9 * night; cityGlow.scale.y = 1; });
    (glowCity as T.MeshBasicMaterial).transparent = true;
    // the walkway: a glass balustraded ramp ring around the table at 2.4 m, entered from the door end by two ramps
    const RY = 2.4, R0x = TW / 2 + 3, R0z = TD / 2 + 3, RW = 3;
    for (const s of [-1, 1]) { k.box(RW, 0.3, TD + 12, s * (R0x + RW / 2), RY - 0.15, 0, floor); k.box(TW + 12, 0.3, RW, 0, RY - 0.15, s * (R0z + RW / 2), floor); }
    for (const s of [-1, 1]) { k.box(0.1, 1.1, TD + 12, s * (R0x + 0.2), RY + 0.55, 0, glass); k.box(0.06, 0.06, TD + 12, s * (R0x + 0.2), RY + 1.1, 0, steel); k.box(TW + 12, 1.1, 0.1, 0, RY + 0.55, s * (R0z + 0.2), glass); k.box(TW + 12, 0.06, 0.06, 0, RY + 1.1, s * (R0z + 0.2), steel); }
    for (const s of [-1, 1]) { k.box(0.1, 1.1, TD + 12, s * (R0x + RW - 0.2), RY + 0.55, 0, glass); k.box(TW + 12, 1.1, 0.1, 0, RY + 0.55, s * (R0z + RW - 0.2), glass); }
    for (const s of [-1, 1]) for (const z of [-TD / 2 - 1, TD / 2 + 1]) k.box(0.4, RY, 0.4, s * (R0x + RW / 2), RY / 2, z, steel);
    /* the posts that carry the glass, every two metres round both edges of the ring */
    { const pm: T.Matrix4[] = [], one = new T.Vector3(1, 1, 1), q = new T.Quaternion();
      for (const e of [0.2, RW - 0.2]) { for (let z = -TD / 2 - 5; z <= TD / 2 + 5; z += 2) for (const s of [-1, 1]) pm.push(new T.Matrix4().compose(v(s * (R0x + e), RY + 0.55, z), q, one)); for (let x = -TW / 2 - 5; x <= TW / 2 + 5; x += 2) for (const s of [-1, 1]) pm.push(new T.Matrix4().compose(v(x, RY + 0.55, s * (R0z + e)), q, one)); }
      k.instances(new T.BoxGeometry(0.06, 1.12, 0.06), steel, pm);
    }
    for (let i = 0; i < 12; i++) { for (const s of [-1, 1]) k.box(RW, 0.2, 1.0, s * (R0x + RW / 2), (i + 0.5) * (RY / 12), HD / 2 - 2 - i * 1.0, floor); }
    const ramp = (x: number, z: number) => { if (Math.abs(Math.abs(x) - (R0x + RW / 2)) < RW / 2 && z > HD / 2 - 14 && z < HD / 2 - 1.5) return T.MathUtils.clamp((HD / 2 - 1.5 - z) / 12.5, 0, 1) * RY; return -1; };
    const onRing = (x: number, z: number) => (Math.abs(x) > R0x && Math.abs(x) < R0x + RW && Math.abs(z) < R0z + RW) || (Math.abs(z) > R0z && Math.abs(z) < R0z + RW && Math.abs(x) < R0x + RW);
    // the works: the hall walls above the walkway, and the glass panels on the inside of the ring
    const mounts: Mount[] = [];
    for (let i = 0; i < 5; i++) { const x = -24 + i * 12; mounts.push({ position: v(x, RY + 4.4, -HD / 2 + 0.34), rotation: 0, target: v(x, RY + 3, -HD / 2 + 8), width: 5.2, height: 3.0, style: 'black', wash: true }); }
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = -15 + i * 10; mounts.push({ position: v(s * (HW / 2 - 0.34), RY + 4.4, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * (HW / 2 - 8), RY + 3, z), width: 5.2, height: 3.0, style: 'black', wash: true }); }
    for (let i = 0; i < 5; i++) { const x = -20 + i * 10; k.box(2.8, 1.7, 0.1, x, RY + 1.9, R0z + 0.3, dark); mounts.push({ position: v(x, RY + 1.9, R0z + 0.37), rotation: 0, target: v(x, RY + 2, R0z + 3), width: 2.6, height: 1.5, style: 'steel', wash: false }); }
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const z = -8 + i * 16; k.box(0.1, 1.7, 2.8, s * (R0x + 0.3), RY + 1.9, z, dark); mounts.push({ position: v(s * (R0x + 0.37), RY + 1.9, z), rotation: s < 0 ? -PI / 2 : PI / 2, target: v(s * (R0x + 3), RY + 2, z), width: 2.6, height: 1.5, style: 'steel', wash: false }); }
    k.censusWall({ x: 0, y: RY + 4.6, z: -HD / 2 + 0.34, rotY: 0, cols: 12, rows: 3, tile: 0.6, gap: 0.05, start: ctx.wallStart(1200, 36), pieces: ctx.all, backing: dark });
    k.sign('THE PANORAMA OF THE CITY OF NEW YORK  ·  1964', 14, 0.8, 0, RY + 7.4, -HD / 2 + 0.34, 'transparent', '#e8dcc0', 70, 0);
    return { mounts, spawn: v(5, 3, HD / 2 - 1.6), look: v(0, 2, -6), eye: 3, bounds: [-HW / 2 + 1, HW / 2 - 1, -HD / 2 + 1, HD / 2 + 30], style: 'black', floorY: (x, z) => { const r = ramp(x, z); if (r >= 0) return r; if (onRing(x, z)) return RY; return 0; } };
  },
};

/* ---------------- 45 INSIDE THE STATUE ---------------- */
export const liberty: RoomDef = {
  id: 'liberty',
  name: 'The climb to the crown',
  area: 'LIBERTY ISLAND',
  mood: 'Harbor morning',
  color: '#7fb8a8',
  description: 'The star fort, the pedestal, then the spiral inside the copper figure up to the twenty five windows of the crown, the harbor and the city through them.',
  signatures: 'The eleven pointed star of the old fort, the granite pedestal, the green copper robe, the raised torch, the seven rayed crown, the iron armature inside and the double helix stair.',
  build(k, ctx) {
    k.sky({ top: 0x5f94d0, horizon: 0xe6eef0, ground: 0x4a5a5c, fog: 0.0016, sun: { az: 2.4, el: 0.55, color: 0xfff6e8, size: 12 }, env: 1.0 });
    k.hemi(0xeaf2ff, 0x3a4a48, 0.9);
    k.sun(0xfff0dc, 2.4, 60, 70, 40, true, 140);
    const copper = k.pbr('libertyCopper', X.patina(0x5f9a8c), 0.6, { roughness: 0.6, metalness: 0.3, side: T.DoubleSide }),
      granite = k.pbr('libertyGranite', X.ashlar(0xa89c88, 88, 3), 0.25),
      fort = k.pbr('fortStone', X.ashlar(0x7a7268, 89, 2), 0.2),
      iron = k.flat(0x3a2e26, 0.6, 0.6),
      ironL = k.flat(0x5a4a3e, 0.5, 0.6),
      tread = k.pbr('libertyTread', X.steel(0x6a6c70, true, 90), 0.8, { metalness: 0.6, roughness: 0.5 }),
      glass = k.glass(0xe8f4f8, 0.1, 0.04),
      glowT = k.glow(0xffd070),
      lawn = k.pbr('libertyLawn', X.grass(0x4b6b3a, 47), 0.06);
    // the harbor, the island, the star fort, the city far off
    k.water({ y: -1.2, color: 0x30586a, w: 900, d: 900, amp: 1.2 });
    k.mesh(new T.CylinderGeometry(70, 74, 2, 11), lawn, 0, -0.9, 0);
    const star = new T.Shape(); for (let i = 0; i < 22; i++) { const a = (i / 22) * PI * 2, r = i % 2 ? 24 : 34; if (i === 0) star.moveTo(Math.cos(a) * r, Math.sin(a) * r); else star.lineTo(Math.cos(a) * r, Math.sin(a) * r); } star.closePath();
    const starG = new T.ExtrudeGeometry(star, { depth: 6, bevelEnabled: false }); starG.rotateX(-PI / 2); k.mesh(starG, fort, 0, 0, 0);
    k.mesh(new T.CylinderGeometry(15, 16, 8, 8), granite, 0, 10, 0);
    k.box(22, 26, 22, 0, 27, 0, granite);
    for (let i = 0; i < 4; i++) k.box(23 - i * 0.6, 0.8, 23 - i * 0.6, 0, 14 + i * 8, 0, granite);
    k.box(24, 2, 24, 0, 41, 0, granite);
    k.skyline({ z: -320, count: 40, spacing: 9, scale: 4.2, base: -1.2, seed: 112, lit: 0.25, glow: 0.5, tint: 0x6e7684, spires: true });
    k.skyline({ z: -260, count: 10, spacing: 14, scale: 1.2, base: -1.2, seed: 113, lit: 0.2, glow: 0.3, tint: 0x8a6a5a, rows: 1, x: -220 });
    for (const [x, z] of [[-90, 40], [80, -60]]) { const boat = new T.Group(); const hull = new T.Mesh(new T.BoxGeometry(8, 3, 30), k.flat(0xf1c531, 0.2, 0.6)); hull.position.y = 1.4; boat.add(hull); const cab = new T.Mesh(new T.BoxGeometry(6, 3, 18), k.flat(0xe6e2da, 0.2, 0.6)); cab.position.set(0, 4.4, 0); boat.add(cab); k.add(boat); if (!ctx.reduced) k.rider(boat, k.spline([v(x - 60, -0.8, z), v(x, -0.8, z + 90), v(x + 100, -0.8, z), v(x, -0.8, z - 90)], true), 4, 40); }
    // the figure: a lathe robe on the pedestal, the raised arm and torch, head and crown
    const SY = 42;
    k.lathe([[0, 0], [9, 0], [8.6, 6], [7.4, 16], [6.6, 26], [5.6, 34], [4.4, 40], [3.6, 44], [2.2, 46], [0, 46]], 0, SY, 0, copper, 32);
    k.sphere(3.0, 0, SY + 48.5, 0, copper, 20);
    for (let i = 0; i < 7; i++) { const a = -PI * 0.15 + (i / 6) * PI * 1.3; const r = 3.4; const spike = k.mesh(new T.ConeGeometry(0.28, 3.6, 6), copper, Math.cos(a) * r, SY + 50.5 + Math.sin(a) * 1.2, -Math.sin(a) * r * 0.6); spike.rotation.z = -Math.cos(a) * 0.9; spike.rotation.x = Math.sin(a) * 0.6; }
    k.mesh(new T.CylinderGeometry(3.6, 3.6, 1.6, 25, 1, true), copper, 0, SY + 50.4, 0);
    k.beam(v(4.2, SY + 40, 0), v(6.4, SY + 58, 0), 1.2, copper, 8);
    k.cyl(1.4, 3.2, 6.4, SY + 60, 0, copper, 1.0, 12);
    k.mesh(new T.SphereGeometry(1.7, 12, 8), glowT, 6.4, SY + 62.6, 0);
    k.point(6.4, SY + 63, 0, 0xffd070, 200, 40);
    k.beam(v(-4, SY + 32, 1), v(-6.2, SY + 24, 2.4), 0.9, copper, 8);
    k.box(3.6, 4.6, 1.2, -6.4, SY + 22, 2.8, copper);
    // inside: the pedestal lobby, then the shaft with the iron armature and the helix stair to the crown
    const helixTop = SY + 46;
    const helix: T.Vector3[] = [];
    for (let i = 0; i <= 300; i++) { const t = i / 300; const y = 4 + (helixTop - 4) * t; const r = y < SY ? 6.5 : Math.max(1.4, 6.5 - (y - SY) / (helixTop - SY) * 5.3); const a = t * PI * 2 * 9; helix.push(v(Math.cos(a) * r, y, Math.sin(a) * r)); }
    const stair = k.spline(helix, false, 0.5);
    const sp = stair.getSpacedPoints(900);
    const treadG = new T.BoxGeometry(1.5, 0.08, 0.36), tm: T.Matrix4[] = [];
    const tan = new T.Vector3(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0);
    for (let i = 0; i < 900; i += 2) { const p = sp[i]; stair.getTangentAt(i / 900, tan); q.setFromAxisAngle(up, Math.atan2(tan.x, tan.z)); tm.push(new T.Matrix4().compose(p.clone().add(v(0, -0.9, 0)), q, new T.Vector3(1, 1, 1))); }
    k.instances(treadG, tread, tm);
    k.curve(sp.filter((_, i) => i % 3 === 0).map((p) => p.clone().add(v(0, 0.1, 0))), 0.04, ironL, 300);
    k.cyl(0.7, helixTop, 0, helixTop / 2, 0, iron, 0.7, 12);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; const pts: T.Vector3[] = []; for (let y = SY; y <= helixTop; y += 4) { const rr = Math.max(1.6, 8.4 - (y - SY) / (helixTop - SY) * 6.4) - 0.3; pts.push(v(Math.cos(a) * rr, y, Math.sin(a) * rr)); } k.curve(pts, 0.07, iron, 14); }
    for (let y = SY + 4; y < helixTop; y += 6) { const rr = Math.max(1.6, 8.4 - (y - SY) / (helixTop - SY) * 6.4) - 0.3; k.torus(rr, 0.05, 0, y, 0, iron, 24).rotation.x = PI / 2; }
    k.mesh(new T.CylinderGeometry(9.5, 9.5, SY - 4, 24, 1, true), k.pbr('pedestalInner', X.ashlar(0x8a8478, 91, 3), 0.3, { side: T.BackSide }), 0, (SY + 4) / 2, 0);
    k.mesh(new T.CylinderGeometry(9.5, 9.5, 0.4, 24), k.pbr('pedestalFloor', X.terrazzo(0xb8b0a0, 48), 0.4), 0, 3.8, 0);
    k.arch(4, 6, 3, 0, 4, 11.5, granite, false, 0.7);
    k.block(-12, -2.2, 10, 12); k.block(2.2, 12, 10, 12);
    for (let i = 0; i < 12; i++) k.box(5, 0.34, 1.2, 0, 0.17 + i * 0.32, 22 - i * 1.0, granite);
    for (let y = 8; y < helixTop; y += 8) k.point(0, y, 0, 0xffe6c8, 24, 14);
    // the crown room: twenty five windows facing the harbor, the glass, the platform
    const CY = helixTop;
    k.mesh(new T.CylinderGeometry(3.2, 3.2, 0.3, 25), tread, 0, CY - 1.0, 0);
    for (let i = 0; i < 25; i++) { const a = -PI * 0.5 + (i / 24) * PI; const x = Math.cos(a) * 3.35, z = Math.sin(a) * 3.35; const w = k.box(0.08, 1.1, 0.7, x, CY + 0.6, z, glass); w.rotation.y = -a; }
    k.torus(3.5, 0.08, 0, CY + 1.3, 0, iron, 32).rotation.x = PI / 2;
    k.torus(3.5, 0.08, 0, CY - 0.1, 0, iron, 32).rotation.x = PI / 2;
    // the works: the pedestal lobby, the landings of the climb, the crown
    const mounts: Mount[] = [];
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2 + PI / 8; const x = Math.cos(a) * 9.1, z = Math.sin(a) * 9.1; mounts.push({ position: v(x, 7.2, z), rotation: -a + PI / 2, target: v(0, 6, 0), width: 3.6, height: 2.1, style: 'gilt', wash: true }); }
    for (let i = 0; i < 10; i++) { const y = 12 + i * 3.4; const a = (i / 10) * PI * 2 + 0.7; const rr = y < SY ? 9.0 : 8.0 - (y - SY) / (helixTop - SY) * 6.2; const x = Math.cos(a) * rr, z = Math.sin(a) * rr; if (y >= SY - 2) continue; mounts.push({ position: v(x, y, z), rotation: -a + PI / 2, target: v(0, y, 0), width: 2.4, height: 1.4, style: 'steel', wash: false }); }
    for (let i = 0; i < 6; i++) { const y = SY + 4 + i * 6; const a = (i / 6) * PI * 2 + 1.1; const rr = 8.4 - (y - SY) / (helixTop - SY) * 6.4 - 0.5; if (rr < 2.2) continue; mounts.push({ position: v(Math.cos(a) * rr, y, Math.sin(a) * rr), rotation: -a + PI / 2, target: v(0, y, 0), width: Math.min(2.2, rr * 0.7), height: 1.3, style: 'steel', wash: false }); }
    for (const a of [PI * 0.62, PI * 0.88]) { const x = Math.cos(a) * 3.1, z = Math.sin(a) * 3.1; mounts.push({ position: v(x, CY + 0.6, z), rotation: -a + PI / 2, target: v(0, CY + 0.6, 0), width: 1.4, height: 0.9, style: 'steel', wash: false }); }
    k.censusWall({ x: 0, y: 7.4, z: -9.2, rotY: 0, cols: 12, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(300, 48), pieces: ctx.all, backing: iron });
    // the route: across the fort, up the steps into the pedestal lobby, then the whole helix to the crown
    const path = [v(0, 3, 58), v(0, 3, 40), v(0, 3, 26), v(0, 5.5, 18), v(0, 6.8, 12), v(0, 6.8, 4), v(3, 6.8, 0)];
    for (let i = 0; i <= 900; i += 3) path.push(sp[i].clone().add(v(0, 0.9, 0)));
    path.push(v(0, CY + 1.2, 0));
    return { mounts, spawn: path[0].clone(), look: v(0, 56, 0), eye: 3, bounds: [-64, 64, -64, 64], path, style: 'steel' };
  },
};

/* ---------------- 46 THE OYSTER BAR ---------------- */
export const oysterbar: RoomDef = {
  id: 'oysterbar',
  name: 'Under the tile vaults',
  area: 'GRAND CENTRAL OYSTER BAR',
  mood: 'Lunch rush',
  color: '#d8b070',
  description: 'Down the ramp under the whispering gallery into the tiled vaults, the long counters, red checked tables, the works between the arches.',
  signatures: 'The Guastavino herringbone tile vaults, the whispering gallery at the ramp crossing, the U shaped lunch counters with stools, the red and white cloths, the neon over the entrance.',
  build(k, ctx) {
    /* THE BIG UPGRADE wave 3a (2026-11-24): the vaults built as Guastavino built them. Every bay is a shallow tile
       vault on four arches (a sail vault: each edge is an arch springing from the piers, the crown is the highest
       point), laid in buff tile in herringbone, the arches as tile ribs lined with bare bulbs; square tile piers with
       flared capitals; oak wainscot under tiled walls; red and white checked cloths and wooden chairs; the neon on
       both faces; the trick is floor type at the crossing. The old domes were hemispheres with brick stretched over
       them. */
    k.sky({ top: 0x2a2a30, horizon: 0x3a3630, ground: 0x1a1a1c, fog: 0.004, env: 0.5 });
    k.hemi(0xffe4c0, 0x3a2c20, 0.8);
    const R = 'oysterbar';
    const vaultM = sk(k, R, 'hpave', 2.2, { tint: 0xf6e4c0, side: T.DoubleSide, roughness: 0.5, mean: 0.5, gain: 2.3 }),
      ribM = sk(k, R, 'hpave', 1.1, { tint: 0xc9a66c, roughness: 0.55, mean: 0.5, gain: 1.6 }),
      wallT = sk(k, R, 'hpave', 2.2, { tint: 0xe8cf9c, roughness: 0.55, mean: 0.5, gain: 1.7 }),
      floorT = sk(k, R, 'floor', 1.8, { tint: 0xe0c0a8, roughness: 0.5 }),
      marble = k.pbr('obCounter', X.marble(0xe8e4dc, 0x9a948a, 10), 0.6, { roughness: 0.25 }),
      wood = sk(k, R, 'wood', 1.6, { tint: 0x9a6a48, roughness: 0.45 }),
      cloth = k.pbr('obCloth', X.velvet(0xb8202a), 0.3, { roughness: 0.95 }),
      chrome = k.flat(0xc9ccd0, 0.9, 0.25),
      brass = k.pbr('obBrass', X.gilt(0xc9a55a), 2, { metalness: 0.85, roughness: 0.3 }),
      neon = k.glow(0xff4a3a),
      bulbM = k.glow(0xfff0c6),
      ice = k.flat(0xdff2ff, 0.1, 0.3, { transparent: true, opacity: 0.8 }),
      shell = k.flat(0xd8d0c0, 0.1, 0.5),
      dark = k.flat(0x1a1a1c, 0.5, 0.6);
    /* the checked cloth: drawn once, the whole pattern on each table top */
    const gingham = canvasTex(256, 256, (g) => { g.fillStyle = '#f4efe4'; g.fillRect(0, 0, 256, 256); g.fillStyle = 'rgba(184,32,42,0.55)'; for (let i = 0; i < 8; i++) { g.fillRect(i * 32, 0, 16, 256); g.fillRect(0, i * 32, 256, 16); } });
    const checked = gingham ? new T.MeshStandardMaterial({ map: gingham, roughness: 0.9 }) : cloth;
    const W = 44, D = 34, H = 7.2;
    // floor and the enclosing walls: oak wainscot to 1.2 m, tile above
    k.box(W + 40, 0.4, D + 40, 0, -0.2, -4, floorT);
    for (const s of [-1, 1]) { k.box(0.6, H, D, s * W / 2, H / 2, -D / 2, wallT); k.box(0.14, 1.2, D, s * (W / 2 - 0.36), 0.6, -D / 2, wood); k.box(0.2, 0.08, D, s * (W / 2 - 0.36), 1.22, -D / 2, brass); k.block(s * W / 2 - 0.5, s * W / 2 + 0.5, -D, 0); }
    k.box(W, H, 0.6, 0, H / 2, -D, wallT); k.box(W, 1.2, 0.14, 0, 0.6, -D + 0.36, wood);
    k.block(-W / 2, W / 2, -D - 0.5, -D + 0.5);
    /* the vaults: 4 by 3 bays, each a sail vault on arches. y0 is the springing at the pier capitals, e the rise of
       the edge arches, c the crown; at an edge the surface is that edge's arch, so bays meet on shared ribs. */
    const vaultPos: number[] = [], vaultIdx: number[] = [];
    const bulbs: T.Matrix4[] = [], one = new T.Vector3(1, 1, 1), qI = new T.Quaternion();
    const bay = (cx: number, cz: number, ax: number, az: number, y0: number, e: number, c: number, ribs: ('n' | 's' | 'e' | 'w')[]) => {
      const n = 18, base = vaultPos.length / 3;
      const Y = (u: number, w: number) => y0 + e * (1 - u * u) + e * (1 - w * w) + (c - 2 * e) * (1 - u * u) * (1 - w * w);
      for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) { const u = -1 + (2 * i) / n, w = -1 + (2 * j) / n; vaultPos.push(cx + u * ax, Y(u, w), cz + w * az); }
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = base + j * (n + 1) + i, b = a + 1, d = a + n + 1, f = d + 1; vaultIdx.push(a, d, b, b, d, f); }
      for (const r of ribs) {
        const pts: T.Vector3[] = [];
        for (let i = 0; i <= 16; i++) { const t = -1 + i / 8; const u = r === 'e' ? 1 : r === 'w' ? -1 : t, w = r === 'n' ? -1 : r === 's' ? 1 : t; pts.push(v(cx + u * ax, Y(u, w) - 0.06, cz + w * az)); }
        k.curve(pts, 0.14, ribM, 24);
        const cv = new T.CatmullRomCurve3(pts), L = cv.getLength(), nb = Math.floor(L / 0.42);
        for (let i = 1; i < nb; i++) { const p = cv.getPointAt(i / nb); bulbs.push(new T.Matrix4().compose(p.add(v(0, -0.15, 0)), qI, one)); }
      }
    };
    const AX = 5.5, AZ = D / 6;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
      const ribs: ('n' | 's' | 'e' | 'w')[] = ['n', 'w'];
      if (i === 3) ribs.push('e');
      if (j === 2) ribs.push('s');
      bay(-16.5 + i * 11, -AZ - j * 2 * AZ, AX, AZ, 3.6, 1.7, 2.7, ribs);
    }
    /* the crossing at the foot of the ramp (the whispering gallery) and the bay over the upper ramp */
    bay(0, 6, 5.5, 5.5, 4.4, 1.6, 2.6, ['n', 's', 'e', 'w']);
    bay(0, 17.25, 5.5, 5.75, 6.0, 1.2, 2.2, ['s', 'e', 'w']);
    { const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(vaultPos, 3)); g.setIndex(vaultIdx); g.computeVertexNormals(); k.mesh(g, vaultM); }
    k.instances(new T.SphereGeometry(0.05, 8, 6), bulbM, bulbs);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) k.point(-16.5 + i * 11, 3.9, -AZ - j * 2 * AZ, 0xffdcb0, 30, 14);
    /* the piers: square, tile clad, oak at the foot, a flared capital where the arches spring */
    const capG = new T.CylinderGeometry(0.78, 0.5, 0.7, 4, 1); capG.rotateY(PI / 4);
    for (let i = 0; i <= 4; i++) for (let j = 0; j <= 3; j++) {
      const x = -22 + i * 11, z = -j * 2 * AZ;
      if (Math.abs(x) >= W / 2 - 1 || z <= -D + 1) continue;
      k.box(0.86, 3.4, 0.86, x, 1.7, z, wallT); k.box(0.96, 1.1, 0.96, x, 0.55, z, wood);
      k.mesh(capG, ribM, x, 3.3, z);
      k.keepOut.push({ x, z, r: 0.8 });
    }
    k.box(W, 0.3, D, 0, H, -D / 2, dark);
    // the ramp down from the concourse and the whispering gallery crossing
    for (let i = 0; i < 14; i++) k.box(10, 0.22, 1.4, 0, 0.22 * i + 0.11, 4 + i * 1.4, floorT);
    for (const s of [-1, 1]) { k.box(0.6, 9, 22, s * 5.5, 4.5, 12, wallT); k.box(0.14, 1.2, 22, s * 5.14, 0.6, 12, wood); k.block(s * 5.5 - 0.5, s * 5.5 + 0.5, 0, 24); }
    k.box(12, 0.5, 22, 0, 9.4, 12, dark);
    k.box(11.6, 9.8, 0.4, 0, 4.9, 24.3, wallT);
    k.point(0, 5.0, 6, 0xffe0b8, 16, 12); k.point(0, 6.2, 17, 0xffe0b8, 12, 12);
    /* the neon over the entrance, on both faces: the dining room's and the ramp's */
    k.box(6.4, 1.2, 0.08, 0, 5.2, 0, dark);
    for (const s of [-1, 1]) {
      k.sign('OYSTER BAR', 6, 1.0, 0, 5.2, s * 0.06, 'transparent', '#ff5a4a', 120, s > 0 ? 0 : PI);
      k.mesh(new T.BoxGeometry(6.2, 0.06, 0.06), neon, 0, 4.6, s * 0.12);
      k.mesh(new T.BoxGeometry(6.2, 0.06, 0.06), neon, 0, 5.8, s * 0.12);
    }
    k.point(0, 4.4, -1.4, 0xff6a5a, 18, 10);
    k.sign('GRAND CENTRAL OYSTER BAR  RESTAURANT', 8, 0.5, 0, 3.75, 0.08, '#1a1a1c', '#d8b070', 52, 0, { border: true });
    k.prop('oysterbar/nyb_pelham_clock', 3.9, 3.3, -0.36, { height: 0.7, rotY: PI });
    // counters: two U shaped lunch counters with stools, the raw bar with ice and shells, the tables
    const stools: [number, number][] = [], stoolBoxes: T.Object3D[] = [];
    const counter = (cx: number, cz: number) => {
      k.box(9, 1.1, 0.9, cx, 0.55, cz, wood); k.box(9.2, 0.1, 1.1, cx, 1.12, cz, marble);
      for (const s of [-1, 1]) { k.box(0.9, 1.1, 6, cx + s * 4.05, 0.55, cz - 3, wood); k.box(1.1, 0.1, 6.2, cx + s * 4.05, 1.12, cz - 3, marble); }
      k.box(9.1, 0.06, 0.06, cx, 0.2, cz + 0.5, brass);
      k.block(cx - 4.6, cx + 4.6, cz - 0.5, cz + 0.5); k.block(cx - 4.6, cx - 3.5, cz - 6, cz); k.block(cx + 3.5, cx + 4.6, cz - 6, cz);
      const sm = k.objects.length;
      for (let i = 0; i < 7; i++) { const x = cx - 3.6 + i * 1.2; k.cyl(0.06, 0.7, x, 0.35, cz + 1.0, chrome, 0.06, 8); k.cyl(0.24, 0.1, x, 0.75, cz + 1.0, cloth, 0.24, 12); k.keepOut.push({ x, z: cz + 1.0, r: 0.3 }); stools.push([x, cz + 1.0]); }
      for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = cz - 1.2 - i * 1.3; k.cyl(0.06, 0.7, cx + s * 5.1, 0.35, z, chrome, 0.06, 8); k.cyl(0.24, 0.1, cx + s * 5.1, 0.75, z, cloth, 0.24, 12); k.keepOut.push({ x: cx + s * 5.1, z, r: 0.3 }); stools.push([cx + s * 5.1, z]); }
      stoolBoxes.push(...standIn(k, sm));
      k.box(8.6, 0.5, 0.8, cx, 1.4, cz - 3.2, ice);
      for (let i = 0; i < 40; i++) { const a = X.mulberry(46 + i)(); k.sphere(0.07, cx - 4 + (i % 20) * 0.42, 1.7, cz - 3.5 + Math.floor(i / 20) * 0.5 + a * 0.2, shell, 6); }
      for (const dx of [-3.2, 0, 3.2]) k.point(cx + dx, 3.0, cz, 0xffe8c8, 12, 6);
    };
    counter(-11, -14); counter(11, -14);
    k.prop('oysterbar/ph_cash_register', -14.6, 1.17, -14, { height: 0.5, rotY: 0 });
    for (const x of [-11, 11]) k.prop('oysterbar/ph_wine_bottles_01', x, 1.65, -3.2 - 14, { height: 0.33 });
    /* the boards hung over the counters on brass chains */
    for (const [x, t] of [[-11, 'TODAY  BLUEPOINTS  WELLFLEETS  KUMAMOTOS'], [11, 'OYSTER PAN ROAST  CLAM CHOWDER  SHUCKED TO ORDER']] as const) {
      k.sign(t, 6.4, 0.6, x, 3.05, -14.6, '#1a1a1c', '#f4e8c8', 40, 0, { border: true, double: true });
      for (const dx of [-3, 3]) k.box(0.03, 0.5, 0.03, x + dx, 3.6, -14.6, brass);
    }
    /* 2026-10-28: the two cylinder stools become Poly Haven's Bar Chair Round 01 (Dairon Sanchez, CC0), instanced,
       seat at the old 0.8 m. A failed load keeps the cylinders. */
    void hero(k, 'ph_bar_chair_round_01', { height: 0.8 }).then((h) => {
      if (!h) return;
      hide(stoolBoxes);
      const ins = heroInstances(k, h, stools.length), m = new T.Matrix4();
      stools.forEach(([x, z], i) => ins.setAt(i, m.makeTranslation(x, 0, z)));
      ins.commit();
      for (const p of ins.parts) p.im.castShadow = false; // under the counter lamps their shadows cost more than they show
    });
    const rnd = X.mulberry(46);
    const chairs: [number, number, number][] = [];
    for (let i = 0; i < 14; i++) { const x = -18 + (i % 7) * 6, z = -26 - Math.floor(i / 7) * 5; if (Math.abs(x) < 3) continue; k.cyl(0.06, 0.7, x, 0.35, z, chrome, 0.06, 8); k.box(1.4, 0.02, 1.4, x, 0.76, z, checked).rotation.y = rnd() * 0.3; k.box(1.46, 0.3, 1.46, x, 0.62, z, cloth); k.keepOut.push({ x, z, r: 0.9 }); for (const [dx, dz] of [[-0.9, 0], [0.9, 0]]) { chairs.push([x + dx, z + dz, dx < 0 ? PI / 2 : -PI / 2]); } }
    /* the dining chairs: Poly Haven's painted wooden chair (CC0) in a dark stain, instanced */
    void hero(k, 'oysterbar/ph_painted_wooden_chair_01', { height: 0.96 }).then((h) => {
      if (!h) return;
      h.traverse((c) => { if (c instanceof T.Mesh) { const m = (c.material as T.MeshStandardMaterial).clone(); m.color.setHex(0x6a4228); c.material = m; } });
      const ins = heroInstances(k, h, chairs.length), m = new T.Matrix4(), q = new T.Quaternion();
      chairs.forEach(([x, z, r], i) => ins.setAt(i, m.compose(v(x, 0, z), q.setFromAxisAngle(Y1, r), one)));
      ins.commit();
      for (const p of ins.parts) p.im.castShadow = false;
    });
    k.crowd([v(0, 0, 22), v(0, 0, 4), v(-6, 0, -6), v(-14, 0, -8), v(-20, 0, -20), v(-8, 0, -30), v(8, 0, -30), v(20, 0, -20)], 16, { seed: 46, speed: 0.5, spread: 1.2, animate: !ctx.reduced });
    k.censusWall({ x: 0, y: 2.7, z: -D + 0.34, rotY: 0, cols: 24, rows: 3, tile: 0.55, gap: 0.05, start: ctx.wallStart(4600, 96), pieces: ctx.all, backing: dark });
    /* a Firefly mural for the lunette over the census wall, plain tile until it lands */
    fireflyPlate(k, 'assets/museum/tex/oysterbar/ff_oyster_boats.webp', 8.4, 1.2, -5.5, 4.65, -D + 0.33, 0, wallT);
    // eggs
    k.egg(v(-4.8, 3.6, 1.2), { id: 'oysterbar-whisper', title: 'Whisper into the corner', text: 'The tiled arches under the pedestrian bridge make a whispering gallery on the landing: a person in one corner can hear someone speaking softly in the diagonally opposite corner. The underside of the bridge is covered in Guastavino tile.', clue: 'Stand in a corner of the crossing at the foot of the ramp and face the wall.', source: { name: 'Grand Central Terminal, Wikipedia', url: 'https://en.wikipedia.org/wiki/Grand_Central_Terminal' } }, { r: 1.6 });
    k.egg(v(0, 5.2, -0.3), { id: 'oysterbar-eve', title: 'Dinner the night before', year: '1913', text: 'The restaurant opened as the Grand Central Terminal Restaurant. The day before the terminal opened on 2 February 1913, it served a dinner for the architects Warren and Wetmore and 100 guests.', clue: 'Look at the neon over the entrance.', source: { name: 'Grand Central Oyster Bar, Wikipedia', url: 'https://en.wikipedia.org/wiki/Grand_Central_Oyster_Bar_%26_Restaurant' } }, { r: 1.6 });
    k.egg(v(-5.5, 5.9, -17), { id: 'oysterbar-fire', title: 'The vaults that held', year: '1997', text: 'A fire in 1997 delaminated thousands of the ceiling tiles, but the structure of the Guastavino vaults was not compromised. The vaults are thin layered tile, lightweight, fireproof and able to carry heavy loads.', clue: 'Look up into the vault over the left hand counter.', source: { name: 'Palaces for the People: Guastavino and the Art of Structural Tile, The Magazine Antiques', url: 'https://www.themagazineantiques.com/article/palaces-for-the-people/' } }, { r: 1.8 });
    k.egg(v(5.5, 5.9, -5.67), { id: 'oysterbar-onetile', title: 'One tile, a dozen vaults', text: 'Only one type of tile is used across the ceiling, which gives the dozen vaults their even finish. More than two hundred Guastavino tile spaces survive across the five boroughs.', clue: 'Count the vaults from the entrance.', source: { name: 'Palaces for the People: Guastavino and the Art of Structural Tile, The Magazine Antiques', url: 'https://www.themagazineantiques.com/article/palaces-for-the-people/' } }, { r: 1.8 });
    k.egg(v(11, 1.6, -14.4), { id: 'oysterbar-owners', title: 'Owned by the staff', year: '1999', text: 'Jerome Brody sold the Oyster Bar to its employees in 1999. Managers joined an employee stock ownership plan, and the staff are represented by UNITE HERE Local 100.', clue: 'Sit at the right hand counter and look across it.', source: { name: 'Grand Central Oyster Bar, Wikipedia', url: 'https://en.wikipedia.org/wiki/Grand_Central_Oyster_Bar_%26_Restaurant' } }, { r: 1.6 });
    /* THE TRICK, anamorphic floor type: from the top of the ramp the words painted flat across the crossing stand up
       like a card propped in the doorway; walk down and they lie back into a long smear of paint on the tile */
    floorType(k, 'WHISPER HERE', 0, 21, 5.7, 0, 0, 17, 4.6, 1.5, '#d8b070', 150);
    k.egg(v(0, 0.6, 1.5), { id: 'oysterbar-floor-sign', title: 'Letters that stand up', text: 'WHISPER HERE is painted flat on the floor of the crossing, stretched so that from the top of the ramp it stands up in the doorway. The crossing outside the restaurant is the whispering gallery: the low tile arches carry a whisper from one corner to the diagonally opposite one.', clue: 'Stop at the top of the ramp and look down at the floor by the door.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.6 });
    k.egg(v(-11, 3.05, -14.4), { id: 'oysterbar-varieties', title: 'Twenty to thirty a day', text: 'The restaurant is split into three parts: the main dining room, the counters with individual seats, and the Saloon with its long bar. It serves anywhere between 20 and 30 varieties of oyster on any given day.', clue: 'Read the boards hung over the counters.', source: { name: 'A New York Mainstay, Resident', url: 'https://resident.com/food-and-drink/2014/08/05/a-new-york-mainstay' } }, { r: 1.8 });
    // the works: between the arches on both long walls, the ramp walls, over the counters on the piers
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = -D / 6 - i * D / 3; mounts.push({ position: v(s * (W / 2 - 0.34), 3.4, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * (W / 2 - 8), 3, z), width: 4.4, height: 2.6, style: 'gilt', wash: true }); }
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = 6 + i * 6; mounts.push({ position: v(s * 5.16, 3.0, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 3, z), width: 3.2, height: 1.9, style: 'oak', wash: false }); }
    for (const x of [-22 + 11, 0, 22 - 11]) for (const z of [-D / 3, -2 * D / 3]) { for (const s of [-1, 1]) { const zz = z + s * 0.65; mounts.push({ position: v(x, 3.0, zz), rotation: s > 0 ? 0 : PI, target: v(x, 3, z + s * 5), width: 1.2, height: 1.8, style: 'oak', wash: false }); } }
    for (const x of [-9, 9]) mounts.push({ position: v(x, 2.9, -D + 0.34), rotation: 0, target: v(x, 3, -D + 8), width: 2.8, height: 1.7, style: 'gilt', wash: true });
    return { mounts, spawn: v(0, 7.5, 22), look: v(0, 3, -10), eye: 3, bounds: [-W / 2 + 1, W / 2 - 1, -D + 1, 24], style: 'oak', floorY: (x, z) => { void x; if (z > 4 && z < 24) return Math.min(3.0, Math.max(0, (z - 4) / 20 * 3.0)); return 0; } };
  },
};
