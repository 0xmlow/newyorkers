/* 169 and 170: the Little Red Lighthouse under the George Washington Bridge, and Louis Kahn's
   Four Freedoms Park at the tip of Roosevelt Island. Both rooms keep New York time: the bridge
   decks carry traffic all day, the lamp turns after dusk, the lindens sway, the ferries run and
   the gulls never land for long. Rules kept: no likeness of any real person (the bronze head at
   Four Freedoms is a plain form with no modelled face), no lettered text beyond public signage
   (the band on the Room's wall is plain granite), the memorial keeps its tone and its Room stays
   empty of art. Helpers are copied from v14 and v3, nothing there is exported. */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as X from '../textures';
import { v, type Mount, type FrameStyle } from '../kit';
import type { RoomDef } from './types';
const PI = Math.PI;
type K = Parameters<RoomDef['build']>[0];
type C = Parameters<RoomDef['build']>[1];
const ONE = new T.Vector3(1, 1, 1);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
/* the camera, read inside a tick only: the audit and the check scripts run in node with no window */
const cam = (): T.Camera | undefined => (typeof window === 'undefined' ? undefined : (window as unknown as { __museum?: { camera?: T.Camera } }).__museum?.camera);

/* ---------------- helpers, copied from v14 and v3 (not exported there) ---------------- */
function figureGeo(r = 0.2, len = 0.82, headY = 1.35) {
  const body = new T.CapsuleGeometry(r, len, 3, 8); body.translate(0, r + len / 2, 0);
  const head = new T.SphereGeometry(r * 0.62, 10, 8); head.translate(0, headY, 0);
  return mergeGeometries([body, head])!;
}
/* a wall with round arched openings, round windows or plain rectangles, one extrusion, centred on x, base at y 0 */
type Hole = { kind: 'arch'; cx: number; y0: number; w: number; h: number; shoe?: number } | { kind: 'circle'; cx: number; cy: number; r: number } | { kind: 'rect'; cx: number; y0: number; w: number; h: number };
function holedWall(w: number, h: number, depth: number, holes: Hole[]) {
  const s = new T.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.closePath();
  for (const o of holes) {
    const p = new T.Path();
    if (o.kind === 'circle') p.absarc(o.cx, o.cy, o.r, 0, PI * 2, false);
    else if (o.kind === 'rect') { p.moveTo(o.cx - o.w / 2, o.y0); p.lineTo(o.cx + o.w / 2, o.y0); p.lineTo(o.cx + o.w / 2, o.y0 + o.h); p.lineTo(o.cx - o.w / 2, o.y0 + o.h); p.closePath(); }
    else {
      const a = o.w / 2, R = a * (o.shoe ?? 1), cy = o.y0 + o.h - R, sd = Math.sqrt(Math.max(0, R * R - a * a)), d = Math.atan2(sd, a);
      p.moveTo(o.cx - a, o.y0); p.lineTo(o.cx - a, cy - sd);
      p.absarc(o.cx, cy, R, PI + d, -d, true);
      p.lineTo(o.cx + a, o.y0); p.closePath();
    }
    s.holes.push(p);
  }
  const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 12 });
  g.translate(0, 0, -depth / 2);
  return g;
}
/* a mount on a wall: rotation r faces the normal (sin r, 0, cos r); the target is d metres out */
function hang(ms: Mount[], x: number, y: number, z: number, r: number, w: number, h: number, style: FrameStyle, d = 3.2) {
  ms.push({ position: v(x, y, z), rotation: r, target: v(x + Math.sin(r) * d, y, z + Math.cos(r) * d), width: w, height: h, style, wash: true });
}
/* cars on a road along x: one instanced body, one instanced cabin; parked ones never move */
function traffic(k: K, ctx: C, p: { lanes: { z: number; dir: number; n: number; speed?: number }[]; x0: number; x1: number; seed: number; y?: number }) {
  const { lanes, x0, x1, seed, y = 0 } = p, rnd = X.mulberry(seed), span = x1 - x0;
  const cars: { x: number; z: number; dir: number; v: number; len: number }[] = [];
  for (const l of lanes) for (let i = 0; i < l.n; i++) {
    const len = 4.2 + rnd() * 0.8;
    cars.push({ x: x0 + ((i + rnd() * 0.5) / l.n) * span, z: l.z, dir: l.dir, v: l.dir === 0 ? 0 : (l.speed ?? 8) * (0.8 + rnd() * 0.35), len });
  }
  const n = cars.length;
  const prof = (pts: number[][], depth: number) => { const sh = new T.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) sh.lineTo(p[0], p[1]); sh.closePath(); const g = new T.ExtrudeGeometry(sh, { depth, bevelEnabled: false }); g.translate(0, 0, -depth / 2); return g; };
  const bodyG = prof([[-0.5, 0.28], [0.5, 0.28], [0.5, 0.62], [0.47, 0.76], [0.22, 0.84], [-0.3, 0.86], [-0.48, 0.8], [-0.5, 0.64]], 1.8);
  const cabG = prof([[-0.3, 0.84], [0.2, 0.84], [0.06, 1.34], [-0.24, 1.34]], 1.66);
  const body = k.instances(bodyG, new T.MeshStandardMaterial({ roughness: 0.35, metalness: 0.5 }), Array.from({ length: n }, () => new T.Matrix4()));
  const cab = k.instances(cabG, new T.MeshStandardMaterial({ color: 0x1a2026, roughness: 0.15, metalness: 0.7 }), Array.from({ length: n }, () => new T.Matrix4()));
  const wheel = k.instances(new T.CylinderGeometry(0.34, 0.34, 1.9, 10).rotateX(PI / 2), new T.MeshStandardMaterial({ color: 0x151515, roughness: 0.9 }), Array.from({ length: n * 2 }, () => new T.Matrix4()));
  body.frustumCulled = cab.frustumCulled = wheel.frustumCulled = false;
  const pal = [0xf2c318, 0x1c1e22, 0xe8e8ea, 0x6a7078, 0x2a3a5a, 0x7a1e22, 0xb8bcc2, 0x1a3a2a, 0xe8e8ea, 0x3a3a3c];
  const c = new T.Color();
  cars.forEach((a, i) => body.setColorAt(i, c.set(pal[Math.floor(rnd() * pal.length)])));
  if (body.instanceColor) body.instanceColor.needsUpdate = true;
  const m = new T.Matrix4(), q = new T.Quaternion(), pos = new T.Vector3(), sc = new T.Vector3(), up = new T.Vector3(0, 1, 0);
  const place = (dt: number) => {
    cars.forEach((a, i) => {
      a.x += a.v * a.dir * Math.min(dt, 0.1);
      if (a.x > x1) a.x -= span; if (a.x < x0) a.x += span;
      q.setFromAxisAngle(up, a.dir < 0 ? PI : 0);
      pos.set(a.x, y, a.z); sc.set(a.len, 1, 1); m.compose(pos, q, sc); body.setMatrixAt(i, m); cab.setMatrixAt(i, m);
      for (const s of [-1, 1]) { pos.set(a.x + s * a.len * 0.32, y + 0.34, a.z); sc.set(1, 1, 1); q.identity(); m.compose(pos, q, sc); wheel.setMatrixAt(i * 2 + (s > 0 ? 1 : 0), m); }
    });
    body.instanceMatrix.needsUpdate = cab.instanceMatrix.needsUpdate = wheel.instanceMatrix.needsUpdate = true;
  };
  place(0);
  if (!ctx.reduced) k.ticks.push((_t, dt) => place(dt));
}
/* people standing still: one instanced figure each, dark clothes */
function still(k: K, pts: { x: number; y: number; z: number; ry: number; sit?: boolean }[], seed: number, colours = [0x1c1e24, 0x2a2e38, 0x3a3230, 0x1a1a1c, 0x4a4a52, 0x2c3a4a, 0x5a4a3a, 0xe0dcd0]) {
  if (!pts.length) return;
  const rnd = X.mulberry(seed), c = new T.Color();
  const o = k.instances(figureGeo(0.19, 0.62, 1.12), new T.MeshStandardMaterial({ roughness: 0.9 }), pts.map((p) => new T.Matrix4().compose(v(p.x, p.y + (p.sit ? 0.12 : 0), p.z), new T.Quaternion().setFromAxisAngle(v(0, 1, 0), p.ry), v(1, p.sit ? 0.82 : 1.1 + rnd() * 0.12, 1))));
  pts.forEach((_, i) => o.setColorAt(i, c.set(colours[Math.floor(rnd() * colours.length)])));
  if (o.instanceColor) o.instanceColor.needsUpdate = true;
}
/* a flat ring segment on the floor plan, in the room's angle convention (x = r sin a, z = r cos a) */
function ringXZ(r0: number, r1: number, a0: number, a1: number, seg = 48) {
  const g = new T.RingGeometry(r0, r1, seg, 1, 0, a1 - a0);
  g.rotateX(PI / 2); g.rotateY(a1 - PI / 2);
  return g;
}
/* river water in daylight: the kit's water is a mirror until the metalness comes down */
function daylightWater(k: K, p: { y: number; color: number; w: number; d: number; x: number; z: number; amp: number }) {
  const w = k.water(p);
  const m = w.material as T.MeshStandardMaterial;
  m.metalness = 0.05; m.roughness = 0.3; m.envMapIntensity = 0.25;
  return w;
}
/* gulls circling a centre: two instanced meshes, bodies and wings; optional resting spots they lift from
   when the visitor comes close, and settle back on a while later */
function gulls(k: K, ctx: C, p: { cx: number; cz: number; n: number; seed: number; rMin: number; rMax: number; yMin: number; yMax: number; rest?: { x: number; y: number; z: number }[]; restNear?: number }) {
  if (ctx.reduced) return;
  const { cx, cz, n, seed, rMin, rMax, yMin, yMax, rest = [], restNear = 7 } = p;
  const NG = n + rest.length, bodyG = new T.ConeGeometry(0.16, 0.8, 5); bodyG.rotateX(PI / 2);
  const bodies = k.instances(bodyG, k.flat(0xdde2e6, 0, 0.85), Array.from({ length: NG }, () => new T.Matrix4()));
  const wings = k.instances(new T.BoxGeometry(1.5, 0.04, 0.34), k.flat(0xe8ecee, 0, 0.9), Array.from({ length: NG }, () => new T.Matrix4()));
  bodies.frustumCulled = wings.frustumCulled = false;
  const rnd = X.mulberry(seed);
  const st = Array.from({ length: NG }, (_, i) => ({ a: rnd() * PI * 2, r: rMin + rnd() * (rMax - rMin), y: yMin + rnd() * (yMax - yMin), w: 0.5 + rnd() * 0.6, f: rnd() * 6.3, rest: i >= n ? rest[i - n] : null, fly: i >= n ? 0 : 1, ry: rnd() * PI * 2 }));
  const m = new T.Matrix4(), q = new T.Quaternion(), pos = new T.Vector3(), sc = new T.Vector3(), up = new T.Vector3(0, 1, 0), c = cam;
  let lifted = 0, cool = 0;
  k.ticks.push((t, dt) => {
    const camera = c();
    if (rest.length) {
      if (camera && cool <= 0) {
        const d = Math.hypot(camera.position.x - rest[0].x, camera.position.z - rest[0].z);
        if (d < restNear && lifted === 0) { lifted = 1; cool = 24; }
      }
      if (cool > 0) { cool -= dt; if (cool <= 0) lifted = 0; }
    }
    st.forEach((b, i) => {
      if (b.rest) b.fly += ((lifted ? 1 : 0) - b.fly) * Math.min(1, dt * 0.9);
      const fl = b.fly, a = b.a + t * 0.16 * b.w;
      const fx = cx + Math.cos(a) * b.r, fy = b.y + Math.sin(t * 0.6 + b.f) * 2.2, fz = cz + Math.sin(a) * b.r;
      if (b.rest) pos.set(b.rest.x + (fx - b.rest.x) * fl, b.rest.y + 0.3 + (fy - b.rest.y) * fl, b.rest.z + (fz - b.rest.z) * fl);
      else pos.set(fx, fy, fz);
      q.setFromAxisAngle(up, b.rest ? b.ry + (-a + PI / 2 - b.ry) * fl : -a + PI / 2);
      m.compose(pos, q, ONE); bodies.setMatrixAt(i, m);
      sc.set(fl < 0.05 ? 0.35 : 1, 1, 0.3 + 0.7 * Math.abs(Math.sin(t * 5 + b.f)) * fl + 0.2 * (1 - fl));
      m.compose(pos, q, sc); wings.setMatrixAt(i, m);
    });
    bodies.instanceMatrix.needsUpdate = wings.instanceMatrix.needsUpdate = true;
  });
}
/* a park bench built from batched boxes: the kit's bench is a group of twenty three meshes, one draw call each */
function bench(k: K, x: number, y: number, z: number, rotY: number, slats: T.Material, frame: T.Material, len = 2.2) {
  const c = Math.cos(rotY), sn = Math.sin(rotY);
  const put = (w: number, h: number, d: number, px: number, py: number, pz: number, m: T.Material) => { const o = k.box(w, h, d, x + px * c + pz * sn, y + py, z - px * sn + pz * c, m); o.rotation.y = rotY; };
  put(0.5, 0.05, len, 0, 0.62, 0, slats); put(0.05, 0.42, len, 0.44, 1.0, 0, slats);
  for (const dz of [-len / 2 + 0.2, len / 2 - 0.2]) { put(0.72, 0.06, 0.07, 0.05, 0.6, dz, frame); put(0.06, 0.6, 0.07, -0.28, 0.3, dz, frame); put(0.06, 0.6, 0.07, 0.38, 0.3, dz, frame); put(0.06, 0.65, 0.07, 0.46, 0.95, dz, frame); }
  k.keepOut.push({ x, z, r: 0.9 });
}
/* a lattice between two rails along x: verticals and diagonals as two instanced meshes, one draw call each */
function latticeX(k: K, x0: number, x1: number, y0: number, y1: number, z: number, pitch: number, m: T.Material, t = 0.3) {
  const n = Math.floor((x1 - x0) / pitch), h = y1 - y0, len = Math.hypot(pitch, h), ang = Math.atan2(h, pitch);
  const vert: T.Matrix4[] = [], diag: T.Matrix4[] = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + i * pitch;
    vert.push(new T.Matrix4().compose(v(x, (y0 + y1) / 2, z), new T.Quaternion(), v(t, h, t)));
    if (i < n) diag.push(new T.Matrix4().compose(v(x + pitch / 2, (y0 + y1) / 2, z), new T.Quaternion().setFromAxisAngle(v(0, 0, 1), i % 2 ? ang : -ang), v(len, t, t)));
  }
  const g = new T.BoxGeometry(1, 1, 1);
  k.instances(g, m, vert); k.instances(g, m, diag);
}

/* ================================================================== */
/* ---------------- 169 THE LITTLE RED LIGHTHOUSE ---------------- */
export const lighthouse: RoomDef = {
  id: 'lighthouse',
  name: 'The Little Red Lighthouse',
  area: 'JEFFREY\'S HOOK / FORT WASHINGTON PARK',
  mood: 'Late afternoon under the great gray bridge',
  color: '#b83a2a',
  daylit: true,
  description: 'Jeffrey\'s Hook Light, forty feet of red cast iron on a rock in the Hudson at the foot of Fort Washington Park, with the George Washington Bridge crossing the sky above it: the near tower of bare steel lattice rising out of the frame, two decks of traffic, the cables dropping to the far tower on the Palisades side. You stand on the greenway with the river on your left, the railroad behind the trees on your right, and the lighthouse door open. The New Yorkers hang on the seawall, in the picnic shelter, on the fence panels and inside the tower up its stair.',
  signatures: 'The red conical tower with its white lantern and black roof on the rock at the water, the door on the landward side and the spiral stair inside, the George Washington Bridge tower of open steel lattice with its two crossed braces, the upper and lower decks with their traffic, the four main cables and the suspenders, the far tower small against the Palisades, the Hudson with a tour boat, a tug and barge and a group of kayaks, the greenway and its joggers, the stone seawall and the riprap, the railroad behind the chain link fence and the trees, and the gulls.',
  build(k, ctx) {
    k.sky({ top: 0x4d8ad0, horizon: 0xd6e2ec, ground: 0x4a5a58, fog: 0.0011, sun: { az: 3.7, el: 0.5, color: 0xfff2e0, size: 9 }, env: 0.8 });
    k.hemi(0xd8e6f8, 0x5a6a58, 0.85);
    k.sun(0xfff0dc, 2.4, -70, 80, 40, true, 90);
    const lawn = k.pbr('lhLawn', X.grass(0x4e6e3c, 169), 0.08),
      asph = k.pbr('lhAsph', X.asphalt(0x2a2e33), 0.3),
      stone = k.pbr('lhStone', X.ashlar(0x8a8478, 170, 3), 0.35, { normal: 0.5, roughness: 0.9 }),
      rock = k.flat(0x5a5650, 0, 0.95), rockDark = k.flat(0x3e3a36, 0, 1),
      red = k.pbr('lhRed', X.steel(0xb0301f, true, 171), 0.9, { roughness: 0.55, metalness: 0.2 }),
      redIn = k.flat(0xd8d0c4, 0, 0.9, { side: T.BackSide }),
      white = k.flat(0xe8e6e0, 0.1, 0.5), black = k.flat(0x141414, 0.4, 0.6),
      glassM = k.glass(0xdfeefa, 0.2, 0.05),
      steel = k.pbr('lhSteel', X.steel(0x6a7078, true, 172), 0.12, { roughness: 0.55, metalness: 0.5 }),
      steelF = k.flat(0x5c636b, 0.6, 0.5), deckM = k.flat(0x7a8088, 0.2, 0.85), cableM = k.flat(0x2e3238, 0.5, 0.5),
      cliff = k.pbr('lhCliff', X.ashlar(0x4e4238, 173, 2), 0.05, { roughness: 1 }),
      wood = k.pbr('lhWood', X.planks(0x6a4a30, 6, 174), 0.8), timber = k.flat(0x4a3320, 0, 0.8),
      fenceM = k.flat(0x8a8f94, 0.6, 0.5, { transparent: true, opacity: 0.35, side: T.DoubleSide }),
      gravel = k.pbr('lhGravel', X.pavers(0x8a8680, 175), 0.9, { roughness: 1 }),
      concrete = k.pbr('lhConc', X.concrete(0x9c9a92, 176), 0.3, { roughness: 0.9 }),
      hullW = k.flat(0xe8e6e0, 0.2, 0.5), hullG = k.flat(0x2e6a3a, 0.2, 0.6), hullD = k.flat(0x1d2a33, 0.3, 0.6), rust = k.flat(0x6a3a26, 0.3, 0.8),
      line = k.flat(0xe8d040, 0, 0.8);
    const mounts: Mount[] = [], st: FrameStyle = 'steel';
    const lampOn = Math.max(Number(k.night) || 0, (Number(k.dusk) || 0) * 0.7);

    /* ---- the park: lawn east of the seawall, the greenway, the railroad behind the fence, the bluff ---- */
    k.box(50.3, 0.2, 130, 16.85, -0.1, -4, lawn);
    k.box(4, 0.02, 130, -4, 0.01, -4, asph);
    for (let z = -32; z < 30; z += 4) k.box(0.12, 0.006, 1.8, -4, 0.025, z, line);
    /* the seawall, broken where the rock of Jeffrey's Hook comes through */
    for (const [z0, z1, h] of [[-34, -22, 2.4], [-6, 30, 1.2]] as number[][]) {
      k.box(0.7, h, z1 - z0, -8, h / 2, (z0 + z1) / 2, stone); k.box(0.9, 0.12, z1 - z0, -8, h + 0.06, (z0 + z1) / 2, rockDark);
      k.block(-9.2, -7.4, z0, z1);
    }
    daylightWater(k, { y: -1.0, color: 0x3a5a6a, w: 900, d: 1200, x: -455, z: -40, amp: 0.9 });
    {
      const rnd = X.mulberry(1691), rip: T.Matrix4[] = [];
      for (let i = 0; i < 70; i++) { const z = -34 + rnd() * 64, s = 0.6 + rnd() * 0.9; if (z > -23 && z < -5) continue; rip.push(new T.Matrix4().compose(v(-9.6 - rnd() * 2.4, -0.7 + rnd() * 0.6, z), new T.Quaternion().setFromAxisAngle(v(1, 0.4, 0.2).normalize(), rnd() * 6), v(s, s * 0.7, s))); }
      k.instances(new T.IcosahedronGeometry(0.8, 0), rock, rip);
    }
    /* the railroad: chain link fence, gravel bed, rails and ties, trees on both sides, the bluff behind */
    k.box(0.05, 0.05, 64, 22, 2.4, -2, steelF); k.plane(64, 2.4, 22, 1.2, -2, fenceM, PI / 2);
    for (let z = -34; z <= 30; z += 3) k.box(0.06, 2.45, 0.06, 22, 1.22, z, steelF);
    k.block(21.6, 22.4, -34, 30);
    k.box(6, 0.3, 130, 28, 0.15, -4, gravel);
    for (const x of [27.3, 28.7]) k.box(0.08, 0.15, 130, x, 0.36, -4, steelF);
    { const ties: T.Matrix4[] = []; for (let z = -68; z < 60; z += 0.65) ties.push(new T.Matrix4().makeTranslation(28, 0.31, z)); k.instances(new T.BoxGeometry(2.4, 0.12, 0.22), timber, ties); }
    for (let z = -62; z < 56; z += 7) { k.tree(24.6, 0, z + 1.5, { h: 7.5, r: 3.0, seed: 169, leaf: 0x3a6a34 }); k.tree(32, 0, z - 1.5, { h: 8.5, r: 3.4, seed: 170, leaf: 0x30582c }); }
    k.box(24, 14, 130, 50, 7, -4, cliff);
    for (let z = -60; z < 56; z += 9) k.tree(46 + (z % 3), 14, z, { h: 8, r: 3.4, seed: 171, leaf: 0x2e5a2c });
    k.skyline({ z: -150, x: 130, count: 14, spacing: 8, scale: 1.4, base: 14, seed: 169, lit: 0.15, glow: 0.3, tint: 0x6a5a4a, rows: 2 });
    /* joggers and walkers on the greenway */
    k.crowd([v(-4.6, 0, -34), v(-4.6, 0, 30)], 6, { seed: 1692, speed: 2.4, spread: 0.6, animate: !ctx.reduced, colors: [0xe83a5a, 0x3a8ae8, 0xf0d24a, 0x2a2a34, 0xe8e2d4, 0x1a1a1c] });
    k.crowd([v(-3.2, 0, 30), v(-3.2, 0, -34)], 5, { seed: 1693, speed: 0.9, spread: 0.6, animate: !ctx.reduced });

    /* ---- Jeffrey's Hook: the rock, and the lighthouse on it ---- */
    const LX = -9, LZ = -14, RY = 0.7, TY = RY + 0.5;
    k.lathe([[0, RY], [4.5, RY], [6.5, 0.2], [8.2, -1.6], [0, -1.6]], LX, 0, LZ, rock, 20);
    {
      const rnd = X.mulberry(1694), bo: T.Matrix4[] = [];
      for (let i = 0; i < 16; i++) { const a = rnd() * PI * 2, r = 5 + rnd() * 3, s = 0.5 + rnd() * 0.7; bo.push(new T.Matrix4().compose(v(LX + Math.sin(a) * r, RY - 0.3 - (r - 5) * 0.5, LZ + Math.cos(a) * r), new T.Quaternion().setFromAxisAngle(v(0.3, 1, 0.2).normalize(), rnd() * 6), v(s, s * 0.6, s))); }
      k.instances(new T.IcosahedronGeometry(0.9, 0), rockDark, bo);
    }
    k.cyl(3.0, 0.5, LX, RY + 0.25, LZ, concrete, 3.1, 24);
    /* the tower: a cast iron cone, riveted, the gallery and the lantern on top */
    const rAt = (y: number) => 2.35 - 0.6 * clamp01((y - 0.5) / 8.1);
    k.lathe([[2.5, 0], [2.5, 0.35], [2.35, 0.5], [1.75, 8.6], [1.75, 8.9], [0.3, 8.9]], LX, TY, LZ, red, 32);
    for (const y of [2.1, 4.2, 6.3, 8.2]) k.torus(rAt(y) + 0.02, 0.035, LX, TY + y, LZ, black, 40).rotation.x = PI / 2;
    k.mesh(new T.CylinderGeometry(1.5, 2.1, 8.4, 24, 1, true, PI / 2 + 0.3, 2 * PI - 0.6), redIn, LX, TY + 4.7, LZ);
    k.cyl(2.1, 0.1, LX, TY + 0.05, LZ, concrete, 2.1, 24);
    k.cyl(0.12, 8.4, LX, TY + 4.7, LZ, black, 0.12, 10);
    k.keepOut.push({ x: LX, z: LZ, r: 0.5 });
    /* small windows up the tower, two faces */
    for (const [y, a] of [[3.0, PI], [5.6, 0], [3.0, 0], [6.4, PI]] as number[][]) { const o = k.box(0.5, 0.8, 0.12, LX + Math.sin(a) * rAt(y), TY + y, LZ + Math.cos(a) * rAt(y), black); o.rotation.y = a; }
    /* the gallery: a black deck with a railing, then the white lantern with its twelve panes and the black roof */
    k.cyl(2.5, 0.25, LX, TY + 9.0, LZ, black, 2.5, 32);
    k.torus(2.4, 0.03, LX, TY + 10.1, LZ, black, 40).rotation.x = PI / 2; k.torus(2.4, 0.03, LX, TY + 9.6, LZ, black, 40).rotation.x = PI / 2;
    for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; k.box(0.04, 1.0, 0.04, LX + Math.sin(a) * 2.4, TY + 9.62, LZ + Math.cos(a) * 2.4, black); }
    k.cyl(1.3, 0.35, LX, TY + 9.3, LZ, white, 1.3, 20);
    k.mesh(new T.CylinderGeometry(1.15, 1.15, 2.0, 12, 1, true), glassM, LX, TY + 10.5, LZ);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; const o = k.box(0.08, 2.0, 0.08, LX + Math.sin(a) * 1.15, TY + 10.5, LZ + Math.cos(a) * 1.15, black); o.rotation.y = a; }
    k.lathe([[1.45, 0], [1.45, 0.12], [1.1, 0.55], [0.5, 1.1], [0.12, 1.5], [0, 1.5]], LX, TY + 11.5, LZ, black, 16);
    k.sphere(0.16, LX, TY + 13.15, LZ, black, 10);
    /* the lamp: a lens that always glows, and a beam that turns once the New York hour is past dusk */
    const lens = k.mesh(new T.SphereGeometry(0.28, 14, 10), new T.MeshBasicMaterial({ color: 0xfff2c0 }), LX, TY + 10.5, LZ, true);
    void lens;
    if (lampOn > 0.05) {
      const beamG = new T.ConeGeometry(2.8, 60, 12, 1, true); beamG.translate(0, -30, 0); beamG.rotateZ(PI / 2);
      const beamM = new T.MeshBasicMaterial({ color: 0xffe6a8, transparent: true, opacity: 0.06 * lampOn, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending });
      const beam = new T.Group(); beam.position.set(LX, TY + 10.5, LZ);
      for (const r of [0, PI]) { const b = new T.Mesh(beamG, beamM); b.rotation.y = r; beam.add(b); }
      k.add(beam);
      const L = k.point(LX, TY + 10.5, LZ, 0xffe8b0, 40 * lampOn, 70, 1.6);
      if (!ctx.reduced) k.ticks.push((t) => { beam.rotation.y = t * 0.5; L.intensity = 40 * lampOn * (0.85 + 0.15 * Math.sin(t * 2.4)); });
    }
    /* the door on the landward side, which opens as the visitor comes up the rock */
    const DA = PI / 2, DR = rAt(1.1), DX = LX + Math.sin(DA) * DR, DZ = LZ + Math.cos(DA) * DR;
    { const f = k.box(0.25, 2.3, 1.2, DX, TY + 1.15, DZ, black); f.rotation.y = DA; }
    const door = new T.Group(); door.position.set(DX + 0.14, TY + 0.02, DZ - 0.5);
    { const leaf = new T.Mesh(new T.BoxGeometry(0.08, 2.15, 0.98), k.flat(0x8a2a1e, 0.2, 0.6)); leaf.position.set(0, 1.08, 0.49); door.add(leaf); const knob = new T.Mesh(new T.SphereGeometry(0.04, 8, 6), k.flat(0xc8a050, 1, 0.3)); knob.position.set(0.07, 1.05, 0.85); door.add(knob); }
    k.add(door);
    if (!ctx.reduced) { let open = 0; k.ticks.push((_t, dt) => { const c = cam(); const want = c && Math.hypot(c.position.x - DX, c.position.z - DZ) < 4.5 ? 1.55 : 0; open += (want - open) * Math.min(1, dt * 2.2); door.rotation.y = open; }); }
    /* the spiral stair inside: treads on the post, a railing, a landing on the far side of the door */
    const A0 = DA + 0.45, SA = 1.35 * PI, SH = 3.4, LA = 2 * PI - 0.9;
    {
      const N = 30, tr: T.Matrix4[] = [];
      for (let i = 0; i < N; i++) { const a = A0 + ((i + 0.5) / N) * SA, y = TY + SH * ((i + 0.5) / N); tr.push(new T.Matrix4().compose(v(LX + Math.sin(a) * 1.15, y, LZ + Math.cos(a) * 1.15), new T.Quaternion().setFromAxisAngle(v(0, 1, 0), a), v(0.34, 0.06, 1.55))); }
      k.instances(new T.BoxGeometry(1, 1, 1), timber, tr);
      const railPts = Array.from({ length: 31 }, (_, i) => { const u = i / 30, a = A0 + u * SA; return v(LX + Math.sin(a) * 1.85, TY + SH * u + 1.0, LZ + Math.cos(a) * 1.85); });
      k.curve(railPts, 0.03, black, 60);
      for (let i = 0; i <= 8; i++) { const u = i / 8, a = A0 + u * SA; k.cyl(0.02, 1.0, LX + Math.sin(a) * 1.85, TY + SH * u + 0.5, LZ + Math.cos(a) * 1.85, black, 0.02, 6); }
      k.mesh(ringXZ(0.4, 2.05, A0 + SA, A0 + LA, 16), timber, LX, TY + SH, LZ);
      const lp = Array.from({ length: 12 }, (_, i) => { const a = A0 + SA + (i / 11) * (LA - SA); return v(LX + Math.sin(a) * 0.5, TY + SH + 1.0, LZ + Math.cos(a) * 0.5); });
      k.curve(lp, 0.03, black, 24);
      k.box(0.06, 1.0, 0.06, LX + Math.sin(A0 + LA) * 1.2, TY + SH + 0.5, LZ + Math.cos(A0 + LA) * 1.2, black);
      k.point(LX, TY + 4, LZ, 0xffe0b0, 10, 8);
    }
    /* the tower wall is solid for the visitor: a ring of blocks with the door gap, and the seam under the landing */
    for (let i = 1; i < 18; i++) { const a = DA + (i / 18) * PI * 2, x = LX + Math.sin(a) * 2.55, z = LZ + Math.cos(a) * 2.55; k.block(x - 0.5, x + 0.5, z - 0.5, z + 0.5); }
    k.block(LX + 0.4, LX + 2.0, LZ + 0.15, LZ + 0.95);
    /* three works inside, hung where the stair and the landing see them across the room */
    const inMount = (dWall: number, dFloor: number, w: number, h: number) => {
      const a = A0 + dWall, x = LX + Math.sin(a) * 1.92, z = LZ + Math.cos(a) * 1.92;
      const fy = dFloor < SA ? TY + SH * (dFloor / SA) : TY + SH;
      hang(mounts, x, fy + 2.35, z, a + PI, w, h, st, 3.2);
    };
    inMount(0.5 * PI, 1.5 * PI, 1.7, 1.25);
    inMount(1.15 * PI, 0.15 * PI, 1.6, 1.2);
    inMount(1.6 * PI, 0.6 * PI, 1.6, 1.2);

    /* ---- the picnic shelter, its stone back wall carrying four works, the census wall on its far face ---- */
    const SX = 10, SZ = 6;
    for (const x of [SX - 3.5, SX + 3.5]) for (const z of [SZ - 5, SZ, SZ + 5]) { k.box(0.25, 3.2, 0.25, x, 1.6, z, timber); k.keepOut.push({ x, z, r: 0.35 }); }
    k.box(0.5, 3.2, 12, SX + 3.5, 1.6, SZ, stone); k.block(SX + 3.1, SX + 3.9, SZ - 6, SZ + 6);
    k.box(9.4, 0.14, 12.4, SX, 3.3, SZ, wood);
    for (const s of [-1, 1]) { const r = k.box(9.8, 0.12, 7.0, SX, 4.55, SZ + s * 2.95, wood); r.rotation.x = -s * 0.42; }
    k.box(9.8, 0.3, 0.3, SX, 5.85, SZ, timber);
    k.box(9.4, 0.06, 12.4, SX, 0.03, SZ, concrete);
    for (const z of [SZ - 4.4, SZ - 1.5, SZ + 1.5, SZ + 4.4]) hang(mounts, SX + 3.24, 2.3, z, -PI / 2, 2.2, 1.6, st, 3.2);
    k.censusWall({ x: SX + 3.77, y: 1.9, z: SZ, rotY: PI / 2, cols: 10, rows: 5, tile: 0.5, gap: 0.04, start: ctx.wallStart(650, 50), pieces: ctx.all, backing: rockDark });
    for (const z of [17, 22]) { k.box(2.0, 0.08, 0.9, SX, 0.76, z, wood); for (const s of [-1, 1]) { k.box(2.0, 0.06, 0.32, SX, 0.46, z + s * 0.8, wood); k.box(0.1, 0.76, 1.9, SX + s * 0.8, 0.38, z, timber); } k.keepOut.push({ x: SX, z, r: 1.4 }); }
    /* five works on plywood panels wired to the fence, facing the walk */
    for (const z of [-27, -19, -11, 15, 23]) { k.box(2.8, 2.2, 0.08, 21.9, 2.4, z, timber); hang(mounts, 21.84, 2.4, z, -PI / 2, 2.2, 1.6, st, 3.2); }
    /* six works on the tall seawall north of the rock, facing the greenway */
    for (let i = 0; i < 4; i++) hang(mounts, -7.62, 1.55, -31.6 + i * 2.8, PI / 2, 2.0, 1.4, st, 3.2);
    /* a park sign at the path, public signage only */
    k.box(0.12, 2.2, 0.12, -1.2, 1.1, 28, timber); k.box(0.12, 2.2, 0.12, 1.2, 1.1, 28, timber);
    k.sign('FORT WASHINGTON PARK', 2.6, 0.5, 0, 1.9, 28.07, '#2a4a2a', '#f0ead8', 64);
    k.sign('JEFFREY\'S HOOK', 2.6, 0.32, 0, 1.45, 28.07, '#2a4a2a', '#f0ead8', 52);
    k.keepOut.push({ x: 0, z: 28, r: 1.5 });
    for (const [x, z] of [[4, -30], [4, 24], [15, -20], [15, 20]]) bench(k, x, 0, z, x < 8 ? PI / 2 : -PI / 2, wood, steelF, 2.0);
    for (const [x, z] of [[8, -26], [16, -8], [18, 26], [6, 26]]) { k.tree(x, 0, z, { h: 6.5, r: 2.8, seed: 172, leaf: 0x3e6a38 }); k.keepOut.push({ x, z, r: 0.6 }); }

    /* ---- the George Washington Bridge: the near tower, two decks, the cables, the far tower ---- */
    const TX = 24, TZ = -56, TH = 184, UD = 66, LD = 58, FX = -560, AX = 200, DX0 = -640;
    const tower = (x: number, full: boolean) => {
      for (const s of [-1, 1]) {
        const lz = TZ + s * 16;
        for (const dx of [-3.2, 3.2]) for (const dz of [-2.6, 2.6]) k.box(1.6, TH, 1.6, x + dx, TH / 2, lz + dz, steel);
        const levels = full ? 15 : 7, step = TH / levels;
        for (let l = 1; l <= levels; l++) {
          const y = l * step;
          k.box(8, 0.9, 0.7, x, y, lz - 2.6, steel); k.box(8, 0.9, 0.7, x, y, lz + 2.6, steel);
          k.box(0.7, 0.9, 6.8, x - 3.2, y, lz, steel); k.box(0.7, 0.9, 6.8, x + 3.2, y, lz, steel);
          if (full || l % 2 === 0) for (const dz of [-2.6, 2.6]) { k.bar(v(x - 3.2, y - step, lz + dz), v(x + 3.2, y, lz + dz), 0.35, 0.35, steelF); k.bar(v(x + 3.2, y - step, lz + dz), v(x - 3.2, y, lz + dz), 0.35, 0.35, steelF); }
        }
      }
      /* the girders between the legs, and the two crossed braces above the deck that the bridge is known by */
      for (const y of [LD - 1.5, UD + 1.5, 78, 122, TH - 1.5]) k.box(4, 3, 26, x, y, TZ, steel);
      for (const [ya, yb] of [[80, 120], [124, TH - 3]] as number[][]) for (const dx of [-3.2, 3.2]) { k.bar(v(x + dx, ya, TZ - 13), v(x + dx, yb, TZ + 13), 1.0, 1.0, steelF); k.bar(v(x + dx, ya, TZ + 13), v(x + dx, yb, TZ - 13), 1.0, 1.0, steelF); }
      const arc = Array.from({ length: 17 }, (_, i) => { const u = i / 16; return v(x, 22 + 32 * Math.sin(u * PI), TZ - 13 + 26 * u); });
      for (const dx of [-3.2, 3.2]) k.curve(arc.map((p) => v(p.x + dx, p.y, p.z)), 0.7, steelF, 32);
      k.box(9, 2, 34, x, TH + 1, TZ, steel);
    };
    tower(TX, true);
    tower(FX, false);
    /* two decks, the stiffening truss between them, parapets, lamp posts */
    const DL = AX - DX0, DC = (AX + DX0) / 2;
    k.box(DL, 1.2, 36, DC, UD - 0.6, TZ, deckM);
    k.box(DL, 1.2, 36, DC, LD - 0.6, TZ, deckM);
    for (const s of [-1, 1]) { latticeX(k, DX0, AX, LD, UD - 1.2, TZ + s * 18, 12, steelF, 0.45); k.box(DL, 0.9, 0.25, DC, UD + 0.45, TZ + s * 17.9, steelF); k.box(DL, 0.9, 0.25, DC, LD + 0.45, TZ + s * 17.9, steelF); }
    for (let x = DX0 + 20; x < AX; x += 40) k.box(0.2, 9, 0.2, x, UD + 4.5, TZ, steelF);
    /* the Manhattan anchorage, a block of concrete in the park east of the tower */
    k.box(30, 26, 50, AX + 10, 13, TZ, concrete);
    /* four main cables: the main span to the far tower, the side span down into the anchorage; suspenders every 18 m */
    const half = (TX - FX) / 2, XM = (TX + FX) / 2, cy = (x: number) => (x >= TX ? 22 + (TH - 22) * ((x - AX) / (TX - AX)) ** 2 : UD + 2 + (TH - UD - 2) * ((x - XM) / half) ** 2);
    const susp: T.Matrix4[] = [];
    for (const s of [-1, 1]) for (const dz of [-0.7, 0.7]) {
      const z = TZ + s * 17 + dz;
      const main = Array.from({ length: 61 }, (_, i) => { const x = FX + (i / 60) * (TX - FX); return v(x, cy(x), z); });
      const side = Array.from({ length: 21 }, (_, i) => { const x = TX + (i / 20) * (AX - TX); return v(x, cy(x), z); });
      k.curve(main, 0.45, cableM, 120); k.curve(side, 0.45, cableM, 40);
      for (let x = FX + 18; x < AX - 8; x += 18) { if (Math.abs(x - TX) < 6) continue; const top = cy(x); if (top - UD < 3) continue; susp.push(new T.Matrix4().compose(v(x, (top + UD) / 2, z), new T.Quaternion(), v(0.14, top - UD, 0.14))); }
    }
    k.instances(new T.BoxGeometry(1, 1, 1), cableM, susp);
    traffic(k, ctx, { lanes: [-13, -9.4, -5.8, -2.2].map((dz) => ({ z: TZ + dz, dir: -1, n: 9, speed: 14 })).concat([2.2, 5.8, 9.4, 13].map((dz) => ({ z: TZ + dz, dir: 1, n: 9, speed: 14 }))), x0: DX0, x1: AX, seed: 1695, y: UD });
    traffic(k, ctx, { lanes: [-11, -7, -3].map((dz) => ({ z: TZ + dz, dir: -1, n: 7, speed: 12 })).concat([3, 7, 11].map((dz) => ({ z: TZ + dz, dir: 1, n: 7, speed: 12 }))), x0: DX0, x1: AX, seed: 1696, y: LD });
    /* the New Jersey shore and the Palisades behind the far tower */
    k.box(90, 5, 1200, -628, 1.5, -40, k.flat(0x4a5a3a, 0, 1));
    { const rnd = X.mulberry(1697); for (let z = -600; z < 560; z += 58) { const h = 60 + rnd() * 35; k.box(70, h, 60, -700 + rnd() * 10, h / 2, z, cliff); k.box(72, 6, 62, -700, h + 3, z, k.flat(0x2e4a2a, 0, 1)); } }

    /* ---- the river: a tour boat, a tug with its barge, a group of kayaks, and the gulls ---- */
    if (!ctx.reduced) {
      const boat = new T.Group();
      { const h = new T.Mesh(new T.BoxGeometry(6, 2.6, 30), hullW); h.position.y = 0.6; boat.add(h); const b = new T.Mesh(new T.BoxGeometry(6.2, 0.5, 30), hullG); b.position.y = 0.4; boat.add(b); const c = new T.Mesh(new T.BoxGeometry(5.2, 2.4, 20), hullW); c.position.set(0, 3.1, -1); boat.add(c); const g = new T.Mesh(new T.BoxGeometry(5.3, 0.9, 19), k.flat(0x2a3640, 0.3, 0.2)); g.position.set(0, 3.0, -1); boat.add(g); const t = new T.Mesh(new T.BoxGeometry(3.4, 1.6, 6), hullW); t.position.set(0, 5.1, 2); boat.add(t); }
      k.add(boat); k.rider(boat, k.spline([v(-40, -0.4, 120), v(-90, -0.4, -60), v(-200, -0.4, -260), v(-330, -0.4, -80), v(-260, -0.4, 140), v(-110, -0.4, 200)], true), 5, 40);
      const tug = new T.Group();
      { const h = new T.Mesh(new T.BoxGeometry(5, 2.4, 12), hullD); h.position.y = 0.5; tug.add(h); const c = new T.Mesh(new T.BoxGeometry(3.4, 2.6, 4), k.flat(0xc83a2a, 0.2, 0.6)); c.position.set(0, 2.8, 1); tug.add(c); const s = new T.Mesh(new T.CylinderGeometry(0.4, 0.45, 2.4, 8), black); s.position.set(0, 4.8, -0.5); tug.add(s); const b = new T.Mesh(new T.BoxGeometry(11, 2.2, 40), rust); b.position.set(0, 0.3, 30); tug.add(b); const l = new T.Mesh(new T.BoxGeometry(9, 1.2, 36), k.flat(0x3a3a3a, 0, 1)); l.position.set(0, 1.6, 30); tug.add(l); }
      k.add(tug); k.rider(tug, k.spline([v(-150, -0.6, 300), v(-170, -0.6, 0), v(-190, -0.6, -300), v(-260, -0.6, -520), v(-360, -0.6, -300), v(-340, -0.6, 200), v(-260, -0.6, 400)], true), 2.6, 200);
      const kay = new T.Group();
      { const rnd = X.mulberry(1698); for (let i = 0; i < 5; i++) { const x = (i - 2) * 2.4 + (rnd() - 0.5), z = (rnd() - 0.5) * 4; const hull = new T.Mesh(new T.CapsuleGeometry(0.34, 2.8, 3, 8).rotateX(PI / 2), k.flat([0xf0c020, 0xe03a2a, 0x2a70d0, 0x30a060, 0xf07020][i], 0.1, 0.6)); hull.position.set(x, -0.1, z); hull.scale.set(1, 0.55, 1); kay.add(hull); const body = new T.Mesh(figureGeo(0.17, 0.4, 0.86), k.flat([0x2a2a34, 0xe8e2d4, 0x1a3a5a, 0x8a2a2a, 0x3a5a3a][i], 0, 0.9)); body.position.set(x, -0.05, z); kay.add(body); const paddle = new T.Mesh(new T.BoxGeometry(2.4, 0.05, 0.16), k.flat(0xe8e6e0, 0, 0.6)); paddle.position.set(x, 0.7, z); paddle.userData.ph = rnd() * 6; kay.add(paddle); } }
      k.add(kay); k.rider(kay, k.spline([v(-30, 0, 60), v(-26, 0, 0), v(-40, 0, -70), v(-90, 0, -110), v(-130, 0, -40), v(-100, 0, 50), v(-60, 0, 90)], true), 1.3, 0);
      k.ticks.push((t) => { for (const c of kay.children) if (c.userData.ph !== undefined) { c.rotation.z = 0.45 * Math.sin(t * 2.2 + c.userData.ph); c.rotation.y = 0.15 * Math.cos(t * 2.2 + c.userData.ph); } });
    }
    gulls(k, ctx, { cx: LX - 20, cz: LZ, n: 22, seed: 1699, rMin: 14, rMax: 60, yMin: 10, yMax: 40 });

    /* ---- what the park knows ---- */
    const srcL = { name: 'Jeffrey\'s Hook Light, Wikipedia', url: 'https://en.wikipedia.org/wiki/Jeffrey%27s_Hook_Light' };
    const srcB = { name: 'George Washington Bridge, Wikipedia', url: 'https://en.wikipedia.org/wiki/George_Washington_Bridge' };
    k.egg(v(LX - Math.sin(0.4) * 2.2, TY + 3.2, LZ - Math.cos(0.4) * 2.2), { id: 'lh-sandy-hook', title: 'It came from Sandy Hook', year: '1921', text: 'The tower stood first as the North Hook Beacon at Sandy Hook, New Jersey, until 1917, when it became obsolete. In 1921 it was reconstructed at its present spot on Jeffrey\'s Hook by the United States Lighthouse Board.', clue: 'The red iron on the rock was not made for this river. Look at the tower itself.', source: srcL }, { r: 1.8 });
    k.egg(v(LX, TY + 10.5, LZ), { id: 'lh-lantern', title: 'Forty feet, a twelve inch lens', year: '1948', text: 'The lighthouse is 40 ft (12 m) tall, a red tower with a white lantern, and carried a 12 inch (300 mm) lens. The Coast Guard decommissioned the light in 1948. In 2002 the city relit it.', clue: 'Look up at the glass on top.', source: srcL }, { r: 2.0 });
    k.egg(v(DX + 0.3, TY + 1.2, DZ), { id: 'lh-book', title: 'Saved by children', year: '1951', text: 'The 1942 children\'s book The Little Red Lighthouse and the Great Gray Bridge, written by Hildegarde Swift and illustrated by Lynd Ward, made the tower famous. When its dismantling was proposed the public outcry came largely from children who were fans of the book, and the Coast Guard signed its deed over to the New York City Department of Parks and Recreation on July 23, 1951.', clue: 'The door is open. Ask who kept it here.', source: srcL }, { r: 1.4 });
    k.egg(v(0, 1.7, 28), { id: 'lh-landmark', title: 'Fort Washington Park', year: '1991', text: 'The lighthouse stands in Fort Washington Park along the Hudson River in Manhattan, reached by the Hudson River Greenway. It was listed on the National Register of Historic Places on May 29, 1979 and designated a New York City landmark on May 14, 1991.', clue: 'The park sign by the path.', source: srcL }, { r: 1.5 });
    k.egg(v(TX - 3.2, 4, TZ + 16 + 2.6), { id: 'gwb-tower', title: 'The bare steel was never meant to show', year: '1931', text: 'The George Washington Bridge opened to traffic on October 25, 1931, the day after its dedication, with a main span of 3,500 feet (1,100 m) and towers 604 feet (184 m) tall. Othmar Ammann was chief engineer and Cass Gilbert consulting architect. The towers were to be encased in concrete and granite in a Revival style; the stone facades were postponed in 1929 in the Depression and left off for cost, and the lattice you see is the result.', clue: 'Walk to the foot of the great tower.', source: srcB }, { r: 4 });
    k.egg(v(TX - 30, LD - 1.4, TZ + 18), { id: 'gwb-decks', title: 'Fourteen lanes on two decks', year: '1962', text: 'The bridge carries 14 lanes of traffic, eight on the upper level and six on the lower, which opened on August 29, 1962. Four main cables 3 feet (0.91 m) across hold the deck on 592 suspender cables from 38 to 674 feet long. It is the world\'s busiest motor vehicle bridge, carrying over 101 million vehicles in 2025.', clue: 'Look straight up at the underside of the lower deck.', source: srcB }, { r: 6 });

    const floorY = (x: number, z: number) => {
      const dx = x - LX, dz = z - LZ, r = Math.hypot(dx, dz);
      if (r < 2.15) {
        const a = Math.atan2(dx, dz), d = (((a - A0) % (2 * PI)) + 2 * PI) % (2 * PI);
        if (d < SA) return TY + SH * (d / SA);
        if (d < LA) return TY + SH;
        return TY;
      }
      if (r < 4.5) return RY;
      if (r < 6.5) return RY - 0.5 * ((r - 4.5) / 2);
      if (r < 8.2) return 0.2 - 1.8 * ((r - 6.5) / 1.7);
      return 0;
    };
    return { mounts, spawn: v(-1, 3, 22), look: v(LX + 2, TY + 9, LZ - 10), eye: 3, floorY, bounds: [-15.5, 21.3, -34, 30], style: st };
  },
};

/* ================================================================== */
/* ---------------- 170 FOUR FREEDOMS PARK ---------------- */
export const fourfreedoms: RoomDef = {
  id: 'fourfreedoms',
  name: 'A room and a garden',
  area: 'FOUR FREEDOMS PARK / ROOSEVELT ISLAND',
  mood: 'Granite, lindens, the river on both sides',
  color: '#c8c4b8',
  daylit: true,
  description: 'Louis Kahn\'s memorial to Franklin D. Roosevelt at the southern tip of Roosevelt Island: the wide granite stair, the lawn narrowing between two allées of little leaf lindens to the Room at the point, its granite blocks open to the East River, and the bronze head in its niche as a plain form. The United Nations and Midtown stand across the water to the west, Long Island City to the east, the Queensboro Bridge to the north, and the Smallpox Hospital ruin behind you. The Room holds no art. The New Yorkers hang on the stair walls, on granite panels behind the trees, and inside the ruin as an exhibition in the shell.',
  signatures: 'The grand granite stair between its walls, the tapering lawn with 120 lindens in four rows, the gravel walks, the low parapets with the river on both sides, the Room of granite blocks with narrow gaps open to the water at the tip, the head of Roosevelt in the niche wall, the plain band where the words are carved, the Gothic Revival ruin of the Smallpox Hospital with its pointed windows and no roof, the United Nations slab and the Midtown towers across the west channel, Long Island City to the east, the Queensboro Bridge, the ferries, a barge and the gulls.',
  build(k, ctx) {
    k.sky({ top: 0x5590d4, horizon: 0xdde6ee, ground: 0x505850, fog: 0.0015, sun: { az: 3.9, el: 0.55, color: 0xfff2e0, size: 9 }, env: 0.8 });
    k.hemi(0xd8e6f8, 0x6a6a5e, 0.85);
    k.sun(0xfff0dc, 2.3, -80, 100, 60, true, 150);
    const granite = k.pbr('ffGranite', X.ashlar(0xb8b0a2, 177, 5), 0.35, { normal: 0.35, roughness: 0.75 }),
      graniteP = k.pbr('ffPave', X.pavers(0xb4ada0, 178), 0.5, { roughness: 0.8 }),
      graniteD = k.flat(0x9a948a, 0, 0.8), band = k.flat(0xcfc8bc, 0, 0.7),
      lawnM = k.pbr('ffLawn', X.grass(0x4f7a3c, 179), 0.09),
      gravel = k.pbr('ffGravel', X.pavers(0xa8a294, 180), 1.2, { roughness: 1 }),
      bronze = k.flat(0x5a4632, 0.9, 0.4),
      gneiss = k.pbr('ffGneiss', X.ashlar(0x7e7870, 181, 4), 0.5, { normal: 0.5, roughness: 0.95 }),
      rubble = k.pbr('ffRubble', X.concrete(0x6e6a62, 182), 0.6, { roughness: 1 }),
      bank = k.flat(0x3e4a3a, 0, 1), bankStone = k.flat(0x6a665e, 0, 0.9),
      unGlass = k.flat(0x4a7a8a, 0.6, 0.25), steelF = k.flat(0x6a7078, 0.6, 0.5), deckM = k.flat(0x3a3d42, 0.1, 0.9),
      hullW = k.flat(0xe8e6e0, 0.2, 0.5), hullD = k.flat(0x1d2a33, 0.3, 0.6), rust = k.flat(0x6a3a26, 0.3, 0.8),
      wood = k.flat(0x5a4632, 0, 0.8);
    const mounts: Mount[] = [], st: FrameStyle = 'black';
    const PY = 3, night = Number(k.night) || 0;
    const pts = (a: number[][]) => a.map(([x, z]) => new T.Vector2(x, -z));
    const flatShape = (poly: number[][], depth: number, m: T.Material, y: number) => { const s = new T.Shape(pts(poly)); const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: false }); g.rotateX(-PI / 2); return k.mesh(g, m, 0, y, 0); };
    const hwP = (z: number) => 42 - 29 * clamp01((30 - z) / 134);
    const hwL = (z: number) => 20 - 13 * clamp01((20 - z) / 118);

    /* ---- the river and the shores ---- */
    daylightWater(k, { y: -0.9, color: 0x3a5866, w: 900, d: 1100, x: 0, z: -60, amp: 0.7 });
    k.box(120, 6, 1100, -320, 2, -40, bank); k.box(120, 6, 1100, 320, 2, -40, bank);
    k.box(4, 7, 1100, -258, 2.5, -40, bankStone); k.box(4, 7, 1100, 258, 2.5, -40, bankStone);
    /* Manhattan to the west: the United Nations slab straight across, Midtown behind it */
    k.box(24, 154, 88, -300, 80, -60, unGlass); k.box(26, 3, 90, -300, 158, -60, deckM);
    k.box(60, 12, 120, -320, 9, -30, k.flat(0xd8d2c4, 0, 0.8));
    {
      const facade = k.pbr('ffWin', X.windows(183, 0.25 + 0.3 * night, 0x4a5262, true), 0.1, { emissive: 0xffffff, emissiveIntensity: 0.35 + 2.0 * night, roughness: 0.6, stretch: 0.42 });
      const rnd = X.mulberry(184);
      for (let z = -480; z < 320; z += 34) { if (z > -110 && z < 10) continue; const h = 50 + rnd() * 150, w = 22 + rnd() * 26; k.box(w, h, 26, -340 - rnd() * 60, h / 2 + 3, z, facade); }
      for (let z = -420; z < 300; z += 40) { const h = 30 + rnd() * 90, w = 20 + rnd() * 24; k.box(w, h, 24, 320 + rnd() * 50, h / 2 + 3, z + 10, facade); }
    }
    /* the Queensboro Bridge to the north: deck, four towers, the cantilever arms as arcs */
    {
      const QZ = 240, QY = 42;
      k.box(660, 3, 22, 0, QY, QZ, deckM);
      for (const x of [-190, -90, 90, 190]) for (const dz of [-9, 9]) { k.box(5, 100, 4, x, 50, QZ + dz, steelF); k.box(6, 3, 24, x, QY + 48, QZ, steelF); }
      for (const [xa, xb] of [[-190, -90], [-90, 90], [90, 190], [-300, -190], [190, 300]] as number[][]) for (const dz of [-9, 9]) { const arc = Array.from({ length: 13 }, (_, i) => { const u = i / 12; return v(xa + (xb - xa) * u, QY - 1 + 34 * Math.sin(u * PI) * (Math.abs(xb - xa) > 150 ? 1.3 : 1), QZ + dz); }); k.curve(arc, 1.2, steelF, 24); }
    }

    /* ---- the platform: a granite plinth tapering to the tip, with parapets, and the water on both sides ---- */
    const poly = [[-42, 30], [42, 30], [13, -104], [13, -126], [-13, -126], [-13, -104]];
    flatShape(poly, 4, granite, PY - 4);
    flatShape([[-41.5, 29.5], [41.5, 29.5], [12.7, -104], [12.7, -125.6], [-12.7, -125.6], [-12.7, -104]], 0.06, graniteP, PY - 0.03);
    flatShape([[-20, 20], [20, 20], [7, -98], [-7, -98]], 0.12, lawnM, PY + 0.02);
    for (const s of [-1, 1]) {
      const g = flatShape([[s * 20.6, 20.6], [s * 7.3, -98.6], [s * (hwL(-98.6) + 8.6), -98.6], [s * (hwL(20.6) + 8.6), 20.6]], 0.04, gravel, PY + 0.01); void g;
      /* the parapet along the long edge, a rotated box, and a chain of blocks under it */
      const x0 = s * 41.6, z0 = 30, x1 = s * 12.7, z1 = -104, len = Math.hypot(x1 - x0, z1 - z0);
      const pb = k.box(0.5, 0.9, len, (x0 + x1) / 2, PY + 0.45, (z0 + z1) / 2, graniteD); pb.rotation.y = Math.atan2(x1 - x0, z1 - z0);
      for (let z = 30; z > -104; z -= 3) { const x = s * hwP(z); k.block(Math.min(x, x - s * 1.6) - 0.2, Math.max(x, x - s * 1.6) + 0.2, z - 1.6, z + 1.6); }
      k.box(0.5, 0.9, 22, s * 12.7, PY + 0.45, -115, graniteD); k.block(s > 0 ? 12.2 : -13.2, s > 0 ? 13.2 : -12.2, -126, -104);
      k.box(26.5, 0.9, 0.5, s * 28.75, PY + 0.45, 30, graniteD); k.block(s > 0 ? 15.5 : -42, s > 0 ? 42 : -15.5, 29.4, 31);
    }
    k.box(26, 0.5, 0.5, 0, PY + 0.25, -125.7, graniteD); k.block(-13, 13, -127, -125.4);

    /* ---- the grand stair from the forecourt up to the garden, works on the walls either side ---- */
    for (let i = 0; i < 16; i++) { const top = PY * ((i + 1) / 16), z = 40 - (i + 0.5) * 0.625; k.box(30, top, 0.63, 0, top / 2, z, granite); }
    for (const s of [-1, 1]) {
      k.box(1.2, 6.6, 12.4, s * 15.6, 3.3, 34, granite); k.box(1.4, 0.3, 12.6, s * 15.6, 6.72, 34, graniteD);
      k.block(s > 0 ? 15.0 : -16.4, s > 0 ? 16.4 : -15.0, 27.8, 42.4);
      for (const z of [32.6, 36.4, 40.2] as number[]) { const fy = PY * clamp01((40 - z) / 10); hang(mounts, s * 15.0, fy + 2.35, z, s > 0 ? -PI / 2 : PI / 2, 2.2, 1.6, st, 3.2); }
    }
    k.box(88, 0.2, 6, 0, -0.1, 43, graniteP);
    k.box(88, 0.2, 40, 0, -0.1, 63, lawnM);
    k.box(6, 0.04, 8, 0, 0.02, 47, gravel);
    /* the park sign at the foot of the stair */
    k.box(0.12, 1.8, 0.12, 19.2, 0.9, 42, graniteD); k.box(0.12, 1.8, 0.12, 22.4, 0.9, 42, graniteD);
    k.sign('FOUR FREEDOMS PARK', 3.2, 0.5, 20.8, 1.55, 42.07, '#2a2c30', '#e8e2d4', 66);
    k.keepOut.push({ x: 20.8, z: 42, r: 1.7 });

    /* ---- the allées: 120 little leaf lindens in four rows, one instanced trunk and one instanced crown that sways ---- */
    const trees: { x: number; z: number; ph: number; s: number }[] = [];
    { const rnd = X.mulberry(185); for (let j = 0; j < 30; j++) { const z = 16 - j * 3.86, hw = hwL(z); for (const s of [-1, 1]) for (const off of [2.6, 6.6]) trees.push({ x: s * (hw + off), z, ph: rnd() * 6.3, s: 0.9 + rnd() * 0.2 }); } }
    {
      const trunkG = new T.CylinderGeometry(0.13, 0.2, 5.2, 7); trunkG.translate(0, 2.6, 0);
      k.instances(trunkG, k.pbr('ffBark', X.bark(0x4e4234), 0.7, { roughness: 1 }), trees.map((t) => new T.Matrix4().compose(v(t.x, PY, t.z), new T.Quaternion(), v(t.s, t.s, t.s))));
      const crownG = new T.SphereGeometry(1, 9, 7); crownG.scale(2.0, 2.7, 2.0); crownG.translate(0, 2.7, 0);
      const crowns = k.instances(crownG, k.flat(0x4a7a38, 0, 0.95), trees.map((t) => new T.Matrix4().compose(v(t.x, PY + 4.6, t.z), new T.Quaternion(), v(t.s, t.s, t.s))));
      crowns.frustumCulled = false;
      { const rnd = X.mulberry(191), c = new T.Color(), pal = [0x4a7a38, 0x527f3c, 0x437034, 0x5a8a40, 0x4c7a3a]; trees.forEach((_, i) => crowns.setColorAt(i, c.set(pal[Math.floor(rnd() * pal.length)]))); if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true; }
      for (const t of trees) k.keepOut.push({ x: t.x, z: t.z, r: 0.55 });
      if (!ctx.reduced) {
        const m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), p = new T.Vector3(), sc = new T.Vector3();
        let hush = 1;
        k.ticks.push((t, dt) => {
          const c = cam();
          /* the wind drops as the visitor stands inside the Room */
          const want = c && Math.abs(c.position.x) < 9 && c.position.z < -105 ? 0.25 : 1;
          hush += (want - hush) * Math.min(1, dt * 0.5);
          const gust = (0.035 + 0.025 * Math.sin(t * 0.23) + 0.012 * Math.sin(t * 0.61)) * hush;
          trees.forEach((tr, i) => {
            e.set(gust * Math.sin(t * 0.9 + tr.ph) * 0.6, 0, gust * Math.sin(t * 1.1 + tr.ph * 1.3));
            q.setFromEuler(e); p.set(tr.x, PY + 4.6, tr.z); sc.setScalar(tr.s);
            m.compose(p, q, sc); crowns.setMatrixAt(i, m);
          });
          crowns.instanceMatrix.needsUpdate = true;
        });
      }
    }
    /* granite panels behind the trees, on both sides, facing the lawn */
    for (const s of [-1, 1]) for (const j of [2, 6, 10, 14]) {
      const z = 16 - (j + 0.5) * 3.86, x = s * (hwL(z) + 10.6);
      k.box(0.36, 3.6, 3.2, x, PY + 1.8, z, granite); k.keepOut.push({ x, z, r: 1.9 });
      hang(mounts, x - s * 0.2, PY + 2.2, z, s > 0 ? -PI / 2 : PI / 2, 2.2, 1.6, st, 3.2);
    }
    for (const s of [-1, 1]) for (const z of [-4, -34, -64]) bench(k, s * (hwL(z) + 9.2), PY, z, s > 0 ? -PI / 2 : PI / 2, wood, graniteD, 2.2);

    /* ---- the Room at the tip: twenty eight granite blocks with narrow gaps, open to the river; the head in its niche ---- */
    const RZ0 = -104, BW = 1.8, GAP = 0.04;
    for (const s of [-1, 1]) for (let i = 0; i < 12; i++) { const z = RZ0 - (i + 0.5) * BW; k.box(BW - GAP, 3.66, BW - GAP, s * (9 + BW / 2), PY + 1.83, z, granite); }
    for (const s of [-1, 1]) k.block(s > 0 ? 9 : -9 - BW, s > 0 ? 9 + BW : -9, RZ0 - 12 * BW, RZ0);
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const x = s * (5.4 + (i + 0.5) * BW); k.box(BW - GAP, 3.66, BW - GAP, x, PY + 1.83, RZ0 - BW / 2, granite); }
    for (const s of [-1, 1]) k.block(s > 0 ? 5.4 : -9, s > 0 ? 9 : -5.4, RZ0 - BW, RZ0);
    /* the niche wall between the garden and the Room, the head before it, a plain band on the Room side */
    k.box(6.2, 3.66, 1.2, 0, PY + 1.83, RZ0 - 0.6, granite); k.block(-3.1, 3.1, RZ0 - 1.2, RZ0);
    k.box(2.6, 2.4, 0.2, 0, PY + 1.6, RZ0 + 0.1, graniteD);
    k.box(1.3, 1.5, 1.1, 0, PY + 0.75, RZ0 + 1.2, granite); k.keepOut.push({ x: 0, z: RZ0 + 1.2, r: 1.2 });
    k.lathe([[0, 0], [0.26, 0], [0.32, 0.16], [0.3, 0.36], [0.42, 0.56], [0.47, 0.82], [0.41, 1.06], [0.22, 1.22], [0, 1.28]], 0, PY + 1.5, RZ0 + 1.2, bronze, 24);
    k.box(4.6, 0.5, 0.06, 0, PY + 2.6, RZ0 - 1.23, band);
    /* the sunken well of the Room floor and the lip at the point */
    flatShape([[-9, RZ0], [9, RZ0], [9, RZ0 - 21.6], [-9, RZ0 - 21.6]], 0.04, graniteP, PY);
    /* a few visitors standing in the Room, quiet */
    still(k, [{ x: -3, y: PY, z: -112, ry: 0.4 }, { x: 4, y: PY, z: -116, ry: -0.3 }, { x: 1, y: PY, z: -121, ry: PI }, { x: -5, y: PY, z: -119, ry: -1.2 }], 186);
    /* a slow crowd walking the garden to the tip, both sides */
    for (const s of [-1, 1]) k.crowd([v(s * 24, PY, 24), v(s * 21, PY, 0), v(s * 17, PY, -40), v(s * 13, PY, -80), v(s * 9, PY, -100), v(s * 4, PY, -110), v(0, PY, -122)], 12, { seed: 187 + s, speed: 0.5, spread: 1.2, animate: !ctx.reduced, colors: [0x24262c, 0x8a3a3a, 0x33477f, 0xd8d0c0, 0x151517, 0x6a4a8a, 0xe6e2da, 0x2b5f6e] });

    /* ---- the Smallpox Hospital ruin, north of the stair: Gothic Revival walls, no roof, the exhibition inside ---- */
    const RX = 13, RZA = 50, RZB = 80, RH = 11, WT = 0.8;
    const win = (cx: number, y0: number, h: number): Hole => ({ kind: 'arch', cx, y0, w: 1.5, h });
    const rowsAt = (n: number, span: number, y0s: number[]) => { const hs: Hole[] = []; for (let i = 0; i < n; i++) { const cx = -span / 2 + ((i + 0.5) / n) * span; for (const y0 of y0s) hs.push(win(cx, y0, 3.2)); } return hs; };
    const south = holedWall(RX * 2, RH, WT, [...rowsAt(6, 24, [4.6, 8.0]).filter((h) => h.kind === 'arch' && Math.abs(h.cx) > 3), ...[-9, -5, 5, 9].map((cx) => win(cx, 1.0, 3.2)), { kind: 'arch', cx: 0, y0: 0, w: 2.6, h: 4.6 }]);
    k.mesh(south, gneiss, 0, 0, RZA);
    k.mesh(holedWall(RX * 2, RH, WT, rowsAt(6, 24, [1.0, 4.6, 8.0])), gneiss, 0, 0, RZB);
    for (const s of [-1, 1]) { const w = k.mesh(holedWall(RZB - RZA, RH, WT, rowsAt(7, 28, [1.0, 4.6, 8.0])), gneiss, s * RX, 0, (RZA + RZB) / 2); w.rotation.y = PI / 2; }
    /* broken tops: a few raised battlements, and fallen stone inside */
    for (const [x, z, w, d] of [[-8, RZA, 4, WT], [6, RZA, 3, WT], [-3, RZB, 5, WT], [9, RZB, 3, WT], [RX, 60, WT, 4], [-RX, 72, WT, 5]] as number[][]) k.box(w, 1.4, d, x, RH + 0.7, z, gneiss);
    k.block(-RX - 0.6, RX + 0.6, RZB - 0.6, RZB + 0.6); k.block(-RX - 0.6, -RX + 0.6, RZA, RZB); k.block(RX - 0.6, RX + 0.6, RZA, RZB);
    k.block(-RX - 0.6, -1.4, RZA - 0.6, RZA + 0.6); k.block(1.4, RX + 0.6, RZA - 0.6, RZA + 0.6);
    k.box(RX * 2, 0.1, RZB - RZA, 0, 0.0, (RZA + RZB) / 2, rubble);
    {
      const rnd = X.mulberry(188), rb: T.Matrix4[] = [];
      for (let i = 0; i < 24; i++) { const s = 0.3 + rnd() * 0.5; rb.push(new T.Matrix4().compose(v((rnd() > 0.5 ? -RX + 1.0 : RX - 1.0) + (rnd() - 0.5) * 1.6, 0.1, (rnd() > 0.5 ? 61 : 69) + (rnd() - 0.5) * 3), new T.Quaternion().setFromAxisAngle(v(0, 1, 0), rnd() * 6), v(s, s * 0.6, s))); }
      k.instances(new T.BoxGeometry(1, 1, 1), gneiss, rb);
    }
    for (const x of [-RX + 1.8, RX - 1.8]) k.keepOut.push({ x, z: 61, r: 2.0 }, { x, z: 69, r: 2.0 });
    /* ivy along the base, and the floodlights that have lit the ruin every night since 1995 */
    for (const s of [-1, 1]) k.box(0.3, 1.6, RZB - RZA - 2, s * (RX + 0.5), 0.8, (RZA + RZB) / 2, k.flat(0x2e4a2a, 0, 1));
    if (night > 0.2) { for (const [x, z] of [[-6, 56], [6, 74], [0, 65]]) k.point(x, 1.5, z, 0xffc070, 40 * night, 30, 1.6); for (const [x, z] of [[-24, 47], [24, 47], [0, 88]]) k.point(x, 2, z, 0xffd090, 30 * night, 40, 1.6); }
    /* the exhibition in the shell: six works on the inner faces between the windows, and the census wall on the north wall */
    for (const s of [-1, 1]) for (const z of [57, 65, 73]) hang(mounts, s * (RX - WT / 2 - 0.05), 2.5, z, s > 0 ? -PI / 2 : PI / 2, 2.2, 1.6, st, 3.2);
    k.censusWall({ x: 0, y: 2.6, z: RZB - WT / 2 - 0.05, rotY: PI, cols: 10, rows: 5, tile: 0.5, gap: 0.04, start: ctx.wallStart(750, 50), pieces: ctx.all, backing: graniteD });
    k.point(0, 6, 65, 0xfff0d8, 8, 26);
    for (let z = RZA - 4; z < RZB + 8; z += 10) for (const s of [-1, 1]) { const x = s * (RX + 8 + (z % 7)); k.tree(x, 0, z, { h: 7, r: 3, seed: 189, leaf: 0x3a6a34 }); k.keepOut.push({ x, z, r: 0.6 }); }

    /* ---- the river traffic and the gulls ---- */
    if (!ctx.reduced) {
      const ferry = (stripe: number) => { const g = new T.Group(); const h = new T.Mesh(new T.BoxGeometry(7, 2.6, 26), hullW); h.position.y = 0.6; g.add(h); const b = new T.Mesh(new T.BoxGeometry(7.2, 0.6, 26), k.flat(stripe, 0.2, 0.6)); b.position.y = 1.9; g.add(b); const c = new T.Mesh(new T.BoxGeometry(6.2, 2.6, 18), hullW); c.position.set(0, 3.2, 0); g.add(c); const w = new T.Mesh(new T.BoxGeometry(6.3, 1.0, 17), k.flat(0x2a3640, 0.3, 0.2)); w.position.set(0, 3.2, 0); g.add(w); const t = new T.Mesh(new T.BoxGeometry(4, 1.4, 6), hullW); t.position.set(0, 5.2, 2); g.add(t); return g; };
      const f1 = ferry(0x2a70d0); k.add(f1); k.rider(f1, k.spline([v(-140, -0.3, 380), v(-150, -0.3, 60), v(-130, -0.3, -160), v(-100, -0.3, -330), v(-60, -0.3, -420), v(-30, -0.3, -330), v(-60, -0.3, -140), v(-90, -0.3, 120), v(-100, -0.3, 380)], true), 6, 0);
      const f2 = ferry(0xe8a020); k.add(f2); k.rider(f2, k.spline([v(120, -0.3, -400), v(110, -0.3, -160), v(130, -0.3, 80), v(150, -0.3, 380), v(190, -0.3, 200), v(170, -0.3, -100), v(150, -0.3, -400)], true), 5, 300);
      const tug = new T.Group();
      { const h = new T.Mesh(new T.BoxGeometry(5, 2.4, 12), hullD); h.position.y = 0.5; tug.add(h); const c = new T.Mesh(new T.BoxGeometry(3.4, 2.6, 4), k.flat(0xc83a2a, 0.2, 0.6)); c.position.set(0, 2.8, 1); tug.add(c); const b = new T.Mesh(new T.BoxGeometry(11, 2.2, 40), rust); b.position.set(0, 0.3, 30); tug.add(b); const l = new T.Mesh(new T.BoxGeometry(9, 1.2, 36), k.flat(0x3a3a3a, 0, 1)); l.position.set(0, 1.6, 30); tug.add(l); }
      k.add(tug); k.rider(tug, k.spline([v(-190, -0.6, -440), v(-200, -0.6, 0), v(-200, -0.6, 400), v(-230, -0.6, 500), v(-235, -0.6, 0), v(-230, -0.6, -460)], true), 2.4, 100);
    }
    {
      const rest: { x: number; y: number; z: number }[] = [];
      for (let i = 0; i < 9; i++) rest.push({ x: -10 + i * 2.5, y: PY + 0.5, z: -125.7 });
      gulls(k, ctx, { cx: 0, cz: -120, n: 16, seed: 190, rMin: 20, rMax: 70, yMin: 8, yMax: 34, rest, restNear: 9 });
    }

    /* ---- what the memorial knows ---- */
    const srcW = { name: 'Franklin D. Roosevelt Four Freedoms Park, Wikipedia', url: 'https://en.wikipedia.org/wiki/Franklin_D._Roosevelt_Four_Freedoms_Park' };
    const srcC = { name: 'Four Freedoms Park Conservancy, The Park', url: 'https://www.fdrfourfreedomspark.org/about/park/' };
    const srcS = { name: 'Smallpox Hospital, Wikipedia', url: 'https://en.wikipedia.org/wiki/Smallpox_Hospital' };
    k.egg(v(0, PY + 2.6, RZ0 - 1.3), { id: 'ff-kahn', title: 'A room and a garden', year: '1974', text: 'Louis Kahn was asked to design the memorial in 1972. He had the thought that a memorial should be a room and a garden, and he was carrying the finished designs with him when he died in 1974 at Pennsylvania Station in New York.', clue: 'Stand in the Room and look back at the wall you came round.', source: srcW }, { r: 1.8 });
    k.egg(v(0, 1.6, 40.5), { id: 'ff-opened', title: 'Thirty eight years to build', year: '2012', text: 'Construction began on March 29, 2010 and was completed in September 2012. The park was dedicated on October 17, 2012 and opened to the public on October 24, 2012, and at the dedication it was officially designated a New York State park.', clue: 'The foot of the great stair.', source: srcC }, { r: 2.2 });
    k.egg(v(trees[8].x, PY + 4.6, trees[8].z), { id: 'ff-lindens', title: 'One hundred and twenty lindens', text: 'The four acre (1.6 ha) memorial is planted with 120 little leaf lindens in allées leading up to the monument. The island itself was named for Roosevelt in 1973.', clue: 'Any tree in the two rows on the west side.', source: srcW }, { r: 2.0 });
    k.egg(v(-9 - BW / 2 + 1.0, PY + 1.8, RZ0 - 6 * BW), { id: 'ff-granite', title: 'Twenty eight blocks, thirty six tons each', text: 'The memorial is a procession of open air spaces ending in a 3,600 square foot (330 m2) plaza surrounded by 28 blocks of North Carolina granite, each weighing 36 tons. Over 140,000 cubic feet (4,000 m3) of Mount Airy granite went into the park.', clue: 'Put a hand on the west wall of the Room.', source: srcW }, { r: 1.6 });
    k.egg(v(0, PY + 2.2, RZ0 + 1.2), { id: 'ff-head', title: 'The head by Jo Davidson', year: '1933', text: 'The colossal head of Roosevelt is by the sculptor Jo Davidson, who went to Washington in December 1933 to sculpt the President and finished the work in one or two visits. It is shown here as a plain bronze form, with no face modelled.', clue: 'The bronze in the niche, before the Room.', source: srcC }, { r: 1.5 });
    k.egg(v(0, 2.6, RZA + 0.6), { id: 'ff-smallpox', title: 'The only landmarked ruin', year: '1856', text: 'James Renwick Jr. designed the Smallpox Hospital, which opened in 1856 when this was Blackwell\'s Island. In 1875 it closed and became a training centre for nurses attached to City Hospital, and in the 1950s that closed too. It was added to the National Register of Historic Places in 1972 and designated a New York City landmark four years later, the city\'s only landmarked ruin. The Gothic walls have been lit every night since 1995, and a $4.5 million stabilisation followed.', clue: 'The pointed doorway of the shell behind the stair.', source: srcS }, { r: 2.0 });

    const floorY = (x: number, z: number) => {
      if (z > 40) return 0;
      if (z > 30) return Math.abs(x) < 15 ? PY * clamp01((40 - z) / 10) : 0;
      return PY;
    };
    return { mounts, spawn: v(0, PY + 3, 25), look: v(0, PY + 1.2, -112), eye: 3, floorY, bounds: [-40, 40, -125, 84], style: st };
  },
};
