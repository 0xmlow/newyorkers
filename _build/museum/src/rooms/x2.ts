/* 112 to 116: working worlds. Five speculative rooms built around real New York places: a Queens
   laundromat at 3 a.m., a Long Island City taxi garage at shift change, the 28th Street flower cold
   room before dawn, a Lower East Side handball court at golden hour, the Spring Street Salt Shed.
   Each carries its street, its envelope, its machines and its life, then hangs New Yorkers. */
import * as T from 'three';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';
import * as X from '../textures';
import { v, type Kit, type Mount } from '../kit';
import type { RoomDef, RoomCtx } from './types';
import { street, blockFront } from './f';
const PI = Math.PI;

/* a wall mount facing a viewing point on the floor */
function M(x: number, y: number, z: number, tx: number, tz: number, w: number, h: number, style: Mount['style'], wash = true): Mount {
  return { position: v(x, y, z), target: v(tx, 2.4, tz), rotation: Math.atan2(tx - x, tz - z), width: w, height: h, style, wash };
}
/* the same cab as static boxes merged into the room, for the ones that are parked; returns the roof light */
function cabStatic(k: Kit, x: number, y: number, z: number, ry: number, yellow: T.Material, glass: T.Material, dark: T.Material, light: T.Material) {
  const up = new T.Vector3(0, 1, 0);
  const at = (lx: number, ly: number, lz: number) => new T.Vector3(lx, ly, lz).applyAxisAngle(up, ry).add(new T.Vector3(x, y, z));
  const part = (w: number, h: number, d: number, lx: number, ly: number, lz: number, m: T.Material) => { const p = at(lx, ly, lz); const o = k.box(w, h, d, p.x, p.y, p.z, m); o.rotation.y = ry; return o; };
  part(1.9, 0.6, 4.7, 0, 0.65, 0, yellow); part(1.75, 0.62, 2.6, 0, 1.24, -0.2, yellow); part(1.78, 0.5, 2.5, 0, 1.22, -0.2, glass);
  part(1.95, 0.2, 0.2, 0, 0.45, 2.4, dark); part(1.95, 0.2, 0.2, 0, 0.45, -2.4, dark); part(1.7, 0.08, 4.5, 0, 0.32, 0, dark);
  const lp = at(0, 1.63, 0.2); const lamp = k.mesh(new T.BoxGeometry(0.7, 0.16, 0.22), light, lp.x, lp.y, lp.z, true); lamp.rotation.y = ry;
  return lamp;
}
/* a matrix for an instance */
function mat(x: number, y: number, z: number, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) {
  return new T.Matrix4().compose(v(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz)), v(sx, sy, sz));
}
/* a yellow cab from primitives: body, cabin, glass, bumpers, roof light. Wheels are the caller's instances. */
function cab(k: Kit, yellow: T.Material, glass: T.Material, dark: T.Material, light: T.Material) {
  const g = new T.Group();
  const add = (geo: T.BufferGeometry, m: T.Material, x: number, y: number, z: number) => { const o = new T.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; };
  add(new T.BoxGeometry(1.9, 0.6, 4.7), yellow, 0, 0.65, 0);
  add(new T.BoxGeometry(1.75, 0.62, 2.6), yellow, 0, 1.24, -0.2);
  add(new T.BoxGeometry(1.78, 0.5, 2.5), glass, 0, 1.22, -0.2);
  add(new T.BoxGeometry(1.95, 0.2, 0.2), dark, 0, 0.45, 2.4);
  add(new T.BoxGeometry(1.95, 0.2, 0.2), dark, 0, 0.45, -2.4);
  add(new T.BoxGeometry(1.7, 0.08, 4.5), dark, 0, 0.32, 0);
  const lamp = add(new T.BoxGeometry(0.7, 0.16, 0.22), light, 0, 1.63, 0.2);
  g.userData.lamp = lamp;
  return g;
}

/* ---------------- 112 THE LAUNDROMAT ---------------- */
export const laundry: RoomDef = {
  id: 'laundry',
  name: 'Spin cycle for a sleepless city',
  area: 'ROOSEVELT AVENUE, JACKSON HEIGHTS',
  mood: 'Three in the morning',
  color: '#85b9bf',
  daylit: false,
  description: 'A 24 hour laundromat under the 7 train at 3 a.m.: a horseshoe of washers and stacked dryers turning behind round glass, folding tables down the middle, fluorescent light on the sidewalk, the works on enamel panels above the machines.',
  signatures: 'The yellow and red LAVANDERIA sign, the OPEN 24 HOURS neon in the window, the horseshoe of front loaders with drums turning, rolling wire baskets, orange plastic chairs at the window, the change machine and the soap vending wall, the TV on its bracket, the el across the avenue.',
  build(k, ctx) {
    k.sky({ top: 0x070a16, horizon: 0x1c2236, ground: 0x07080c, fog: 0.0035, stars: 320, env: 0.45 });
    k.hemi(0xb8c4e0, 0x141218, 0.42);
    k.sun(0x9fb0e0, 0.35, -40, 50, 30, false, 60);
    const floorT = k.pbr('lauFloor', X.terrazzo(0xb9b4a6, 401), 1.3, { roughness: 0.5 }),
      wall = k.pbr('lauWall', X.plaster(0xcfe0d6, 402), 0.5, { roughness: 0.9 }),
      dado = k.pbr('lauDado', X.subwayTile(0xdad5c4, 0x6a6a62), 0.9, { roughness: 0.3 }),
      ceil = k.pbr('lauCeil', X.plaster(0xf2f1ec, 404), 0.8, { roughness: 0.95, emissive: 0x8a9098, emissiveIntensity: 0.4 }),
      brick = k.pbr('lauBrick', X.brick(0x8a5a48, 405), 0.28),
      cornice = k.pbr('nbCornice', X.plaster(0xb8ad9a, 3), 0.6),
      gate = k.pbr('lauGate', X.steel(0x6a7078, false, 406), 0.5, { metalness: 0.7, roughness: 0.5, stretch: 0.25 }),
      enamel = k.flat(0xe8e9e5, 0.15, 0.35),
      chrome = k.flat(0xcfd3d6, 0.9, 0.22),
      glass = k.glass(0xa8c4d0, 0.28, 0.05),
      drum = k.flat(0x24272b, 0.5, 0.5),
      paddle = k.flat(0x9aa0a6, 0.8, 0.3),
      laminate = k.flat(0xefece2, 0, 0.5),
      orange = k.flat(0xe2622a, 0, 0.6),
      wire = k.flat(0xd8dce0, 0.8, 0.35, { transparent: true, opacity: 0.5 }),
      dark = k.flat(0x1c1f24, 0.4, 0.6),
      blue = k.flat(0x2a4aa8, 0.2, 0.5),
      tube = k.glow(0xeef4ff),
      warm = k.glow(0xffd28a),
      glassDark = k.glass(0x9fc4d8, 0.35, 0.08),
      iron = k.flat(0x1f262b, 0.75, 0.45),
      steel = k.flat(0x5a6470, 0.8, 0.4),
      neonRed = k.glow(0xff4a3a);
    // the avenue: Roosevelt under the el, the block across, the neighbours, a cab going by
    street(k, { w: 16, len: 130, z: 0 });
    blockFront(k, { x: -13, z0: 52, count: 13, face: 1, seed: 411, h: [10, 16] });
    blockFront(k, { x: 13, z0: 52, count: 4, face: -1, seed: 412, h: [10, 16] });
    blockFront(k, { x: 13, z0: -20, count: 5, face: -1, seed: 413, h: [10, 16] });
    for (const s of [-1, 1]) { k.box(9, 6, 7, 17.5, 3, s * 12.5, brick); k.box(0.12, 3.6, 5.6, 13.02, 1.8, s * 12.5, gate); k.moulding([[0, 0], [0.5, 0], [0.55, 0.2], [0.3, 0.4], [0, 0.5]], 7, 12.95, 5.5, s * 12.5, cornice, 0); }
    k.skyline({ z: -140, count: 14, spacing: 8, scale: 1.3, base: -2, seed: 414, lit: 0.3, glow: 0.8, tint: 0x2a3040, rows: 1 });
    // the el across the avenue
    for (const z of [-46, -70]) { for (const x of [-6.5, 6.5]) k.cyl(0.45, 8, x, 4, z, steel, 0.45, 10); k.box(2.2, 1.2, 3, 0, 8.4, z, steel); }
    k.box(1.0, 1.4, 60, -6.5, 9.6, -58, steel); k.box(1.0, 1.4, 60, 6.5, 9.6, -58, steel); k.box(14, 0.5, 60, 0, 10.4, -58, dark);
    for (let z = -32; z > -86; z -= 2.4) k.box(15, 0.14, 0.35, 0, 10.75, z, iron);
    for (const s of [-1, 1]) k.box(0.08, 1.1, 60, s * 7.4, 11.3, -58, iron);
    for (const z of [26, -26]) for (const s of [-1, 1]) k.lamp(s * 10.5, z, 6.5, iron, 0xffd9a8, 26);
    k.prop('hydrant', -10.6, 0, 8, { height: 1.1, keepOut: 0.5 });
    k.prop('mailbox', 10.7, 0, -14, { height: 1.5, rotY: PI / 2, keepOut: 0.6 });
    k.prop('utility_pole', 10.4, 0, 22, { height: 9, keepOut: 0.5 });
    k.prop('storm_drain', -8.6, 0.02, 30, { height: 0.08 });
    // the building: brick above the storefront, apartment windows, the neighbours' gates
    const SX = 13, W = 26, D = 18, H = 4.6;
    k.box(W, 10.1, D, SX + W / 2, H + 0.3 + 5.05, 0, brick);
    k.moulding([[0, 0], [0.7, 0], [0.8, 0.2], [0.5, 0.35], [0.6, 0.55], [0.25, 0.75], [0, 0.85]], D + 0.2, SX - 0.05, H + 9.5, 0, cornice, 0);
    for (let y = H + 3.2; y < H + 9; y += 2.7) for (let dz = -7.5; dz <= 7.5; dz += 3) { k.box(0.2, 1.9, 1.35, SX - 0.06, y, dz, cornice); k.box(0.05, 1.65, 1.1, SX + 0.06, y, dz, (dz + y) % 5 < 2 ? warm : glassDark); k.box(0.05, 1.7, 0.05, SX + 0.1, y, dz, iron); }
    k.prop('fire_escape', SX - 1.05, H + 2.6, -3, { height: 3.2, rotY: PI / 2 });
    k.prop('fire_escape', SX - 1.05, H + 5.3, -3, { height: 3.2, rotY: PI / 2 });
    k.prop('water_tower', SX + 18, H + 10.4, 4, { height: 5 });
    // the storefront: sill wall, big windows, the door, the bulkhead, the sign, the neon
    for (const s of [-1, 1]) { const zc = s * (1.6 + (D / 2 - 1.6) / 2), zw = D / 2 - 1.6; k.box(0.3, 0.9, zw, SX, 0.45, zc, dado); k.box(0.1, 2.3, zw, SX, 2.05, zc, glass); k.block(SX - 0.3, SX + 0.3, s > 0 ? 1.6 : -D / 2, s > 0 ? D / 2 : -1.6); }
    k.box(0.3, H - 3.2, D, SX, 3.2 + (H - 3.2) / 2, 0, wall);
    for (const z of [-1.7, 1.7]) k.box(0.12, 3.2, 0.12, SX, 1.6, z, iron);
    k.box(0.06, 0.06, 3.3, SX, 3.15, 0, iron);
    k.box(0.4, 1.1, D + 0.6, SX - 0.2, 5.3, 0, k.flat(0xf6d24a, 0, 0.5));
    k.sign('LAVANDERIA  ·  WASH  DRY  FOLD  ·  OPEN 24 HOURS', 17.6, 0.95, SX - 0.42, 5.3, 0, '#f4cf3c', '#b41d1d', 88, -PI / 2, { border: true });
    for (let i = 0; i < 5; i++) k.point(SX - 1.2, 5.0, -7 + i * 3.5, 0xffe08a, 10, 7);
    const neon = k.sign('OPEN  24  HRS', 2.6, 0.7, SX - 0.16, 2.6, 5.4, 'transparent', '#ff4a3a', 150, -PI / 2);
    const neonL = k.point(SX - 0.8, 2.6, 5.4, 0xff5a4a, 14, 6);
    k.box(0.04, 0.04, 2.8, SX - 0.14, 2.2, 5.4, neonRed);
    if (!ctx.reduced) k.ticks.push((t) => { const on = Math.sin(t * 2.6) > -0.6 && Math.sin(t * 17.1) > -0.92; neon.visible = on; neonL.intensity = on ? 14 : 2; });
    // the box: floor, walls, ceiling with the troffer grid, one tube that will not settle
    k.box(W, 0.3, D, SX + W / 2, -0.15, 0, floorT);
    k.box(W, 0.3, D, SX + W / 2, H + 0.15, 0, ceil);
    for (const s of [-1, 1]) { k.box(W, H, 0.3, SX + W / 2, H / 2, s * D / 2, wall); k.box(W, 1.2, 0.06, SX + W / 2, 0.6, s * (D / 2 - 0.18), dado); k.block(SX, SX + W, s > 0 ? D / 2 - 0.3 : -D / 2 - 0.3, s > 0 ? D / 2 + 0.3 : -D / 2 + 0.3); }
    k.box(0.3, H, D, SX + W, H / 2, 0, wall); k.block(SX + W - 0.3, SX + W + 0.3, -D / 2, D / 2);
    for (let x = SX + 3; x < SX + W - 1; x += 3.5) for (const z of [-6, -2, 2, 6]) if (!(x > 19 && x < 21 && z === -2)) k.box(1.2, 0.05, 0.32, x, H - 0.03, z, tube);
    for (const x of [SX + 4, SX + 13, SX + 22]) for (const z of [-4, 4]) k.point(x, H - 0.5, z, 0xe6f0ff, 13, 12);
    const flick = k.mesh(new T.BoxGeometry(1.2, 0.05, 0.32), k.glow(0xeef4ff), 20, H - 0.03, -2, true);
    const flickL = k.point(20, H - 0.5, -2, 0xe6f0ff, 10, 8);
    if (!ctx.reduced) k.ticks.push((t) => { const on = Math.sin(t * 9.3) * Math.sin(t * 2.1) > -0.35 || Math.sin(t * 31) > 0.97; flick.visible = on; flickL.intensity = on ? 10 : 0; });
    // the horseshoe: front loaders along the back, stacked dryers down both sides, every drum a window
    type Machine = { c: T.Vector3; q: T.Quaternion; d: number; tall: boolean; run: number };
    const machines: Machine[] = [];
    for (let i = 0; i < 20; i++) machines.push({ c: v(SX + W - 0.55, 0.55, -7.6 + i * 0.8), q: new T.Quaternion().setFromEuler(new T.Euler(0, -PI / 2, 0)), d: 0.4, tall: false, run: i % 5 < 2 ? 0.8 + (i % 3) * 0.4 : 0 });
    for (const s of [-1, 1]) for (let i = 0; i < 26; i++) machines.push({ c: v(SX + 2.6 + i * 0.85, 1.0, s * (D / 2 - 0.6)), q: new T.Quaternion().setFromEuler(new T.Euler(0, s > 0 ? PI : 0, 0)), d: 0.425, tall: true, run: (i + (s > 0 ? 1 : 0)) % 5 < 2 ? 0.6 + (i % 4) * 0.3 : 0 });
    const bodies: T.Matrix4[] = [], rings: T.Matrix4[] = [], glassM: T.Matrix4[] = [], drums: T.Matrix4[] = [], panels: T.Matrix4[] = [];
    type Port = { m: Machine; y: number };
    const ports: Port[] = [];
    const off = (m: Machine, lx: number, ly: number, lz: number) => v(lx, ly, lz).applyQuaternion(m.q).add(m.c);
    for (const m of machines) {
      bodies.push(new T.Matrix4().compose(m.c, m.q, v(0.78, m.tall ? 2.0 : 1.1, m.d * 2)));
      const ys = m.tall ? [-0.45, 0.5] : [0.05];
      for (const y of ys) { ports.push({ m, y }); const at = (dz: number) => new T.Matrix4().compose(off(m, 0, y, m.d + dz), m.q, v(1, 1, 1)); drums.push(at(0.012)); glassM.push(at(0.055)); rings.push(at(0.05)); }
      panels.push(new T.Matrix4().compose(off(m, 0, m.tall ? 0.93 : 0.47, m.d + 0.01), m.q, v(1, 1, 1)));
    }
    k.instances(new T.BoxGeometry(1, 1, 1), enamel, bodies);
    k.instances(new T.CircleGeometry(0.25, 18), drum, drums);
    k.instances(new T.CircleGeometry(0.255, 18), glass, glassM);
    k.instances(new T.TorusGeometry(0.265, 0.035, 8, 26), chrome, rings);
    k.instances(new T.BoxGeometry(0.6, 0.08, 0.02), dark, panels);
    k.block(SX + W - 1.0, SX + W, -D / 2, D / 2);
    for (const s of [-1, 1]) k.block(SX + 2.0, SX + W, s > 0 ? D / 2 - 1.1 : -D / 2, s > 0 ? D / 2 : -D / 2 + 1.1);
    // the drums that are running: paddles and a tumbling load, one instanced mesh each
    const running = ports.filter((p) => p.m.run > 0);
    const padG = new T.BoxGeometry(0.04, 0.2, 0.02), loadG = new T.SphereGeometry(0.05, 7, 5);
    const pads = k.instances(padG, paddle, running.flatMap(() => [new T.Matrix4(), new T.Matrix4(), new T.Matrix4()]));
    const loads = k.instances(loadG, k.flat(0xffffff, 0, 0.8), running.flatMap(() => [new T.Matrix4(), new T.Matrix4(), new T.Matrix4()]));
    const loadCols = [0xd23a2a, 0x2a4aa8, 0xf0e8d8, 0x3a8a4a, 0xe6b23a, 0x1a1a1e, 0xd88ab0];
    const cc = new T.Color();
    running.forEach((_, i) => { for (let j = 0; j < 3; j++) loads.setColorAt(i * 3 + j, cc.set(loadCols[(i * 3 + j) % loadCols.length])); });
    const spin = new T.Quaternion(), qq = new T.Quaternion(), mm = new T.Matrix4(), one = v(1, 1, 1), zAxis = v(0, 0, 1);
    const placeDrums = (t: number) => {
      running.forEach((p, i) => {
        const a = t * p.m.run * 2.2 + i * 0.7;
        for (let j = 0; j < 3; j++) {
          const ang = a + j * (PI * 2 / 3);
          spin.setFromAxisAngle(zAxis, ang - PI / 2); qq.copy(p.m.q).multiply(spin);
          mm.compose(off(p.m, Math.cos(ang) * 0.15, p.y + Math.sin(ang) * 0.15, p.m.d + 0.03), qq, one); pads.setMatrixAt(i * 3 + j, mm);
          const la = ang + 0.9, lr = 0.06 + 0.07 * Math.abs(Math.sin(t * 1.3 + j));
          mm.compose(off(p.m, Math.cos(la) * lr, p.y + Math.min(0.12, Math.sin(la) * lr + 0.03), p.m.d + 0.028), p.m.q, one); loads.setMatrixAt(i * 3 + j, mm);
        }
      });
      pads.instanceMatrix.needsUpdate = loads.instanceMatrix.needsUpdate = true;
    };
    placeDrums(0);
    if (!ctx.reduced) k.ticks.push((t) => placeDrums(t));
    // the middle: two folding tables, rolling baskets, a bench of orange chairs at the window
    for (const x of [SX + 9, SX + 17]) { k.box(1.1, 0.06, 5, x, 0.9, 0, laminate); k.box(1.0, 0.84, 4.9, x, 0.42, 0, k.flat(0xd8d3c4, 0, 0.6)); k.block(x - 0.6, x + 0.6, -2.5, 2.5); k.box(0.5, 0.18, 0.7, x - 0.2, 1.02, -1.2, blue); k.box(0.6, 0.12, 0.5, x + 0.1, 0.99, 1.4, k.flat(0xf0e8d8, 0, 0.8)); }
    for (const [bx, bz] of [[SX + 6.4, -3.4], [SX + 13, 3.6], [SX + 20.5, -3.6], [SX + 11.2, -3.9]]) { k.box(0.62, 0.7, 0.9, bx, 0.6, bz, wire); for (const dx of [-0.31, 0.31]) for (const dz of [-0.45, 0.45]) k.cyl(0.04, 0.24, bx + dx, 0.12, bz + dz, dark, 0.04, 8); k.box(0.66, 0.03, 0.94, bx, 0.96, bz, chrome); k.keepOut.push({ x: bx, z: bz, r: 0.55 }); }
    const seats: T.Matrix4[] = [], backs: T.Matrix4[] = [], legs: T.Matrix4[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = s * (3.2 + i * 0.95), x = SX + 1.1; seats.push(mat(x, 0.46, z, PI / 2)); backs.push(mat(x - 0.2, 0.78, z, PI / 2, 1, 1, 1, 0, 0.18)); for (const dx of [-0.18, 0.18]) for (const dz of [-0.18, 0.18]) legs.push(mat(x + dx, 0.22, z + dz)); k.keepOut.push({ x, z, r: 0.4 }); }
    k.instances(new T.BoxGeometry(0.46, 0.05, 0.46), orange, seats); k.instances(new T.BoxGeometry(0.46, 0.5, 0.05), orange, backs); k.instances(new T.CylinderGeometry(0.014, 0.014, 0.44, 5), chrome, legs);
    // the change machine, the soap wall, the TV on its bracket, the attendant's counter
    k.box(0.7, 1.8, 0.5, SX + 1.0, 0.9, -D / 2 + 1.0, blue); k.box(0.5, 0.35, 0.02, SX + 1.0, 1.4, -D / 2 + 1.26, k.glow(0xdbe6ff)); k.sign('CHANGE', 0.6, 0.18, SX + 1.0, 1.05, -D / 2 + 1.26, '#0d0d0d', '#f4cf3c', 90, 0); k.keepOut.push({ x: SX + 1.0, z: -D / 2 + 1.0, r: 0.6 });
    k.box(1.3, 1.9, 0.42, SX + 1.0, 0.95, D / 2 - 1.0, enamel); k.box(1.1, 1.3, 0.04, SX + 1.0, 1.1, D / 2 - 1.22, glass);
    const soaps: T.Matrix4[] = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) soaps.push(mat(SX + 0.55 + c * 0.22, 0.65 + r * 0.38, D / 2 - 1.1));
    const soapM = k.instances(new T.BoxGeometry(0.14, 0.24, 0.1), k.flat(0xffffff, 0, 0.6), soaps); soaps.forEach((_, i) => soapM.setColorAt(i, cc.set([0xe0402a, 0x2a5ac8, 0xf2b52a, 0x3aa05a, 0xf0f0e8][i % 5])));
    k.sign('SOAP  ·  BLEACH  ·  SOFTENER', 1.2, 0.16, SX + 1.0, 1.82, D / 2 - 1.22, '#0d0d0d', '#eef4ff', 80, 0);
    k.keepOut.push({ x: SX + 1.0, z: D / 2 - 1.0, r: 0.8 });
    const tv = k.mesh(new T.BoxGeometry(0.06, 0.62, 1.05), k.glow(0x8ab0ff), SX + 0.72, 3.75, 0, true); tv.rotation.z = -0.15;
    k.box(0.5, 0.7, 1.15, SX + 0.45, 3.75, 0, dark); k.beam(v(SX + 0.15, H - 0.05, 0), v(SX + 0.45, 4.15, 0), 0.03, chrome, 5);
    if (!ctx.reduced) { let last = 0; k.ticks.push((t) => { if (t - last > 0.35 + Math.abs(Math.sin(t)) * 0.6) { last = t; (tv.material as T.MeshBasicMaterial).color.set([0x8ab0ff, 0xdfe8ff, 0x5a7ad0, 0xffd8a0, 0xb0c8ff][Math.floor(t * 7) % 5]); } }); }
    k.box(2.2, 1.05, 0.7, SX + W - 2.4, 0.52, -D / 2 + 2.2, laminate); k.sign('DROP OFF  ·  WASH & FOLD  ·  $1.25 / LB', 2.0, 0.22, SX + W - 2.4, 0.8, -D / 2 + 2.56, '#0d0d0d', '#f4cf3c', 60, 0); k.keepOut.push({ x: SX + W - 2.4, z: -D / 2 + 2.2, r: 1.3 });
    k.sign('"FOLD"', 1.4, 0.36, SX + 13, H - 0.4, 0, 'transparent', '#0d0d0d', 120, -PI / 2, { double: true });
    // the people: two night shift figures inside, walkers under the el, a cab on the avenue
    k.crowd([v(SX + 4, 0, -5), v(SX + 12, 0, -3.2), v(SX + 21, 0, 3.2), v(SX + 6, 0, 5.4)], 3, { seed: 411, speed: 0.22, spread: 0.6, animate: !ctx.reduced, colors: [0x24262c, 0x8a3a3a, 0xd8d0c0] });
    k.crowd([v(-10.5, 0, 55), v(-10.5, 0, -55)], 5, { seed: 412, speed: 0.8, spread: 1.6, animate: !ctx.reduced });
    k.crowd([v(10.6, 0, 55), v(10.6, 0, 16)], 2, { seed: 413, speed: 0.7, spread: 1.2, animate: !ctx.reduced });
    const taxi = cab(k, k.flat(0xf2c230, 0.2, 0.45), glassDark, dark, k.glow(0xfff0c0));
    { const wm = new T.InstancedMesh(new T.CylinderGeometry(0.32, 0.32, 0.22, 12), dark, 4); [[-0.8, 1.5], [0.8, 1.5], [-0.8, -1.5], [0.8, -1.5]].forEach(([dx, dz], i) => wm.setMatrixAt(i, mat(dx, 0.32, dz, 0, 1, 1, 1, 0, PI / 2))); wm.instanceMatrix.needsUpdate = true; taxi.add(wm); }
    k.add(taxi);
    k.rider(taxi, k.spline([v(-4, 0, 62), v(-4, 0, -62), v(-1, 0, -66), v(4, 0, -62), v(4, 0, 62), v(1, 0, 66)], true), 8);
    // the hang: enamel panels above the dryers and the washers, the community board over the window, the census as the notice wall
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const x = SX + 3.5 + i * 4.0; mounts.push(M(x, 3.35, s * (D / 2 - 0.2), x, s * 3.0, 3.4, 1.9, 'enamel', true)); }
    for (const z of [-6.2, 6.2]) mounts.push(M(SX + W - 0.2, 3.3, z, SX + W - 5, z, 3.6, 2.0, 'enamel', true));
    for (const z of [-7.2, -2.4, 2.4, 7.2]) mounts.push(M(SX + 0.2, 3.9, z, SX + 5.5, z, Math.abs(z) > 5 ? 2.8 : 3.0, 1.3, 'enamel', false));
    k.censusWall({ x: SX + W - 0.2, y: 3.3, z: 0, rotY: -PI / 2, cols: 12, rows: 3, tile: 0.5, gap: 0.05, start: ctx.wallStart(6200, 36), pieces: ctx.all, backing: dark });
    return { mounts, spawn: v(4.0, 2.8, 0), look: v(SX + W, 3.2, 0), eye: 2.8, bounds: [-12.4, SX + W - 0.5, -50, 50], style: 'enamel' };
  },
};

/* ---------------- 113 THE TAXI GARAGE ---------------- */
export const taxi: RoomDef = {
  id: 'taxidispatch',
  name: 'Every light is a fare',
  area: 'VERNON BOULEVARD, LONG ISLAND CITY',
  mood: 'Five o\'clock shift change',
  color: '#e1b850',
  description: 'A medallion garage in Long Island City at the five o\'clock shift change: roll up doors open to the low sun, a fan of numbered dispatch bays, a cab on the lift, the dispatcher in a glass booth under the radio mast, the works hung one to a bay and along the medallion wall.',
  signatures: 'The corrugated roll up doors, the fan of yellow bay lines on an oil stained floor, hanging bay numbers, yellow cabs with their roof lights blinking, the hydraulic lift, tire stacks, the dispatch booth and its antenna, the Manhattan skyline at the end of the street across the river.',
  build(k, ctx) {
    k.sky({ top: 0x6f94c4, horizon: 0xf2c896, ground: 0x4a4038, fog: 0.0028, sun: { az: 3.3, el: 0.16, color: 0xffc08a, size: 22 }, haze: 0.5, env: 0.85 });
    k.hemi(0xe8ecff, 0x5a4a3a, 0.95);
    k.sun(0xffb073, 2.6, -34, 22, -90, false, 80);
    const conc = k.pbr('txFloor', X.concrete(0x8c8d89, 421), 0.3, { roughness: 0.75 }),
      brick = k.pbr('txBrick', X.brick(0x7a5040, 422), 0.28),
      block = k.pbr('txBlock', X.ashlar(0xb9b4a4, 423, 2), 0.55, { roughness: 0.95 }),
      corr = k.pbr('txDoor', X.steel(0x8a8e92, false, 424), 0.6, { metalness: 0.6, roughness: 0.5, stretch: 0.2 }),
      roofM = k.flat(0x2a2c30, 0.4, 0.7),
      steel = k.flat(0x4a525c, 0.8, 0.45),
      steelL = k.flat(0x9aa2aa, 0.85, 0.35),
      yellow = k.flat(0xf2c230, 0.2, 0.45),
      paint = k.flat(0xe6b81e, 0, 0.7),
      dark = k.flat(0x1c1f24, 0.4, 0.6),
      stain = k.flat(0x141416, 0.1, 0.9, { transparent: true, opacity: 0.32 }),
      glass = k.glass(0xcfe4ee, 0.22, 0.05),
      glassDark = k.glass(0x9fc4d8, 0.35, 0.08),
      red = k.flat(0xb8262a, 0.2, 0.5),
      rubber = k.flat(0x1a1a1c, 0.1, 0.9),
      warm = k.glow(0xffe0b0),
      sky = k.glow(0xffe9c8),
      cornice = k.pbr('nbCornice', X.plaster(0xb8ad9a, 3), 0.6);
    // the boulevard: low rise LIC on both sides, the East River and Manhattan at the end of the street
    street(k, { w: 18, len: 160, z: 0 });
    blockFront(k, { x: -14, z0: 60, count: 15, face: 1, seed: 421, h: [8, 14] });
    blockFront(k, { x: 13, z0: 60, count: 4, face: -1, seed: 422, h: [8, 14] });
    blockFront(k, { x: 13, z0: -34, count: 5, face: -1, seed: 423, h: [8, 14] });
    k.water({ y: -1.4, color: 0x2e4a62, w: 460, d: 220, z: -200, amp: 0.9 });
    k.box(60, 1.6, 6, 0, -0.6, -84, k.pbr('txBulk', X.ashlar(0x6a6a66, 425, 2), 0.4));
    k.skyline({ z: -280, count: 30, spacing: 8, scale: 2.4, base: -1.4, seed: 426, lit: 0.3, glow: 0.7, tint: 0x4a5060, rows: 2, spires: true });
    for (const z of [30, -30, -70]) for (const s of [-1, 1]) k.lamp(s * 11.5, z, 7, steel, 0xffd9a8, 20);
    k.prop('hydrant', -11.6, 0, 14, { height: 1.1, keepOut: 0.5 });
    k.prop('utility_pole', 11.4, 0, -26, { height: 9, keepOut: 0.5 });
    k.prop('utility_pole', -11.4, 0, 44, { height: 9, keepOut: 0.5 });
    // the side lot: chain link, two cabs waiting for their drivers
    const fence = k.flat(0x8c98a4, 0.9, 0.3, { transparent: true, opacity: 0.5 });
    k.box(0.03, 2.4, 8, 13.2, 1.2, 26, fence); for (let z = 22; z <= 30; z += 4) k.box(0.08, 2.5, 0.08, 13.2, 1.25, z, steelL); k.block(12.9, 13.5, 22, 30);
    k.box(12, 0.3, 8, 19, -0.15, 26, k.pbr('txLot', X.asphalt(0x2a2c30), 0.12));
    // the garage: a wide brick shed, four piers, three doors, one of them down
    const GX = 13, GW = 40, GD = 44, H = 7.6;
    k.box(GW, 0.3, GD, GX + GW / 2, -0.15, 0, conc);
    for (const s of [-1, 1]) { k.box(GW, H, 0.4, GX + GW / 2, H / 2, s * GD / 2, block); k.block(GX, GX + GW, s > 0 ? GD / 2 - 0.4 : -GD / 2 - 0.4, s > 0 ? GD / 2 + 0.4 : -GD / 2 + 0.4); }
    k.box(0.4, H, GD, GX + GW, H / 2, 0, block); k.block(GX + GW - 0.4, GX + GW + 0.4, -GD / 2, GD / 2);
    k.box(GW + 0.8, 0.5, GD + 0.8, GX + GW / 2, H + 0.25, 0, roofM);
    for (const [z0, z1] of [[-GD / 2, -15.2], [-8.8, -3.2], [3.2, 8.8], [15.2, GD / 2]]) { const zc = (z0 + z1) / 2, w = z1 - z0; k.box(0.5, H + 1.2, w, GX, (H + 1.2) / 2, zc, brick); k.box(0.56, 1.2, w, GX, 0.6, zc, paint); k.block(GX - 0.3, GX + 0.3, z0, z1); }
    for (const zc of [-12, 0, 12]) { k.box(0.5, H + 1.2 - 5.2, 6.4, GX, 5.2 + (H + 1.2 - 5.2) / 2, zc, brick); k.box(0.7, 0.5, 6.6, GX, 5.35, zc, steel); }
    for (const zc of [-18.6, -6, 6, 18.6]) { k.box(0.2, 1.3, 3.2, GX - 0.2, 7.0, zc, cornice); k.box(0.06, 1.1, 3.0, GX - 0.32, 7.0, zc, glassDark); }
    k.box(0.16, 5.0, 6.3, GX + 0.1, 2.55, -12, corr); k.block(GX - 0.3, GX + 0.3, -15.2, -8.8);
    k.moulding([[0, 0], [0.7, 0], [0.8, 0.2], [0.5, 0.35], [0.6, 0.55], [0.25, 0.75], [0, 0.85]], GD + 0.4, GX - 0.05, H + 0.9, 0, cornice, 0);
    k.box(0.3, 1.5, 24, GX - 0.25, H + 2.2, 0, dark);
    k.sign('L.I.C. CAB CORP.  ·  MEDALLION GARAGE  ·  DISPATCH 24 HRS', 22, 1.3, GX - 0.42, H + 2.2, 0, '#141416', '#f2c230', 88, -PI / 2, { border: true });
    for (let i = 0; i < 4; i++) k.point(GX - 1.4, H + 1.6, -9 + i * 6, 0xffd060, 12, 9);
    // the roof inside: trusses, three bands of skylight, hanging shades
    const chords: T.Matrix4[] = [], diags: T.Matrix4[] = [], shades: T.Matrix4[] = [];
    for (let i = 0; i < 5; i++) { const x = GX + 4 + i * 8; chords.push(mat(x, H - 1.3, 0), mat(x, H - 0.25, 0)); for (let j = 0; j < 22; j++) { const z = -GD / 2 + 1 + j * 2; diags.push(mat(x, H - 0.78, z + 1, 0, 1, 1, 1, (j % 2 ? 1 : -1) * 0.76)); } }
    k.instances(new T.BoxGeometry(0.18, 0.18, GD - 1), steel, chords);
    k.instances(new T.BoxGeometry(0.08, 1.9, 0.08), steel, diags);
    for (const x of [GX + 8, GX + 20, GX + 32]) k.box(6, 0.06, GD - 3, x, H - 0.02, 0, sky);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const x = GX + 6 + i * 9.5, z = -14 + j * 14; shades.push(mat(x, H - 2.3, z)); if ((i + j) % 2 === 0) k.point(x, H - 2.9, z, 0xffe6b0, 30, 22); }
    k.instances(new T.ConeGeometry(0.55, 0.5, 14, 1, true), steelL, shades);
    // the fan: seven bays on an arc, yellow lines to each, a number hanging over every one
    const CX = 28, R = 22;
    const bays: { x: number; z: number; th: number }[] = [];
    for (let i = 0; i < 7; i++) { const th = (-55 + i * 18.33) * PI / 180; bays.push({ x: CX + Math.cos(th) * R, z: Math.sin(th) * R, th }); }
    bays.forEach((b, i) => {
      const ry = -b.th + PI / 2;
      const panel = k.box(6.6, 5.2, 0.3, b.x, 2.6, b.z, block); panel.rotation.y = ry;
      const stripe = k.box(6.6, 1.0, 0.34, b.x, 0.5, b.z, paint); stripe.rotation.y = ry;
      const ux = -Math.sin(ry), uz = -Math.cos(ry);
      for (const s of [-1, 1]) { const px = b.x + Math.cos(ry) * s * 2.9 + ux * 4.2, pz = b.z - Math.sin(ry) * s * 2.9 + uz * 4.2; const line = k.box(0.12, 0.012, 8.4, px, 0.16, pz, paint); line.rotation.y = ry; }
      const sx = b.x + ux * 1.2, sz = b.z + uz * 1.2;
      k.box(0.06, 0.06, 1.2, sx, H - 0.9, sz, steel).rotation.y = ry;
      k.sign(String(i + 1), 0.9, 0.9, sx, H - 1.95, sz, '#f2c230', '#141416', 520, ry + PI, { border: true, double: true });
      for (let s = -2; s <= 2; s++) k.keepOut.push({ x: b.x + Math.cos(ry) * s * 1.4, z: b.z - Math.sin(ry) * s * 1.4, r: 0.95 });
    });
    for (const s of [-1, 1]) k.keepOut.push({ x: 39.5, z: s * 20.6, r: 1.4 });
    for (let i = 0; i < 9; i++) { const r = X.mulberry(431 + i); const o = k.mesh(new T.CircleGeometry(0.9 + r() * 1.2, 14), stain, GX + 6 + r() * 26, 0.02, -16 + r() * 32); o.rotation.x = -PI / 2; o.scale.x = 1.6; }
    // the machines: the lift with a cab up on it, tire stacks, the tool chest, drums of oil
    const cabYellow = yellow;
    const wheels: T.Matrix4[] = [];
    const park = (x: number, z: number, ry: number, y = 0) => { const lamp = cabStatic(k, x, y, z, ry, cabYellow, glassDark, dark, k.glow(0xfff0c0)); for (const [dx, dz] of [[-0.8, 1.5], [0.8, 1.5], [-0.8, -1.5], [0.8, -1.5]]) { const p = v(dx, 0.32 + y, dz).applyAxisAngle(v(0, 1, 0), ry).add(v(x, 0, z)); wheels.push(mat(p.x, p.y, p.z, ry, 1, 1, 1, 0, PI / 2)); } k.keepOut.push({ x, z, r: 2.6 }); return lamp; };
    const parked = [park(bays[1].x - Math.cos(bays[1].th) * 3.4, bays[1].z - Math.sin(bays[1].th) * 3.4, PI / 2 - bays[1].th), park(bays[3].x - 3.4, bays[3].z, PI / 2), park(bays[5].x - Math.cos(bays[5].th) * 3.4, bays[5].z - Math.sin(bays[5].th) * 3.4, PI / 2 - bays[5].th), park(20, 26, 0.1), park(24, 26, -0.1)];
    const LX = 24, LZ = -15;
    for (const s of [-1, 1]) { k.box(0.5, 3.6, 0.7, LX + s * 1.6, 1.8, LZ, red); k.box(2.2, 0.16, 0.16, LX, 2.0, LZ + s * 0.9, steelL); }
    k.box(3.6, 0.3, 0.5, LX, 3.5, LZ, red);
    parked.push(park(LX, LZ, PI / 2, 1.9));
    k.instances(new T.CylinderGeometry(0.32, 0.32, 0.22, 12), rubber, wheels);
    const tires: T.Matrix4[] = [];
    for (const [tx, tz, n] of [[30, -19.5, 5], [32, -19.5, 4], [34, -19.5, 6]]) for (let i = 0; i < n; i++) tires.push(mat(tx, 0.18 + i * 0.24, tz, 0, 1, 1, 1, PI / 2));
    k.instances(new T.TorusGeometry(0.33, 0.12, 8, 18), rubber, tires);
    for (const [tx, tz] of [[30, -19.5], [32, -19.5], [34, -19.5]]) k.keepOut.push({ x: tx, z: tz, r: 0.6 });
    k.box(1.4, 1.0, 0.6, 20, 0.5, -19.6, red); k.box(1.4, 0.05, 0.62, 20, 1.03, -19.6, dark); k.keepOut.push({ x: 20, z: -19.6, r: 0.9 });
    for (let i = 0; i < 4; i++) { k.cyl(0.3, 0.9, 36.5 + i * 0.7, 0.45, 20.5, i % 2 ? dark : k.flat(0x2a5aa8, 0.2, 0.6), 0.3, 12); }
    k.keepOut.push({ x: 37.5, z: 20.5, r: 1.6 });
    // the dispatcher: a glass booth on a step, the radio, the antenna up through the roof, a beacon on top
    const BX = 17.5, BZ = -17.5;
    k.box(4.4, 0.36, 3.6, BX, 0.18, BZ, block);
    k.box(4.0, 1.2, 3.2, BX, 0.96, BZ, dark); k.box(4.0, 1.6, 3.2, BX, 2.36, BZ, glass); k.box(4.2, 0.2, 3.4, BX, 3.26, BZ, dark);
    for (const [dx, dz] of [[-1.95, -1.55], [1.95, -1.55], [-1.95, 1.55], [1.95, 1.55]]) k.box(0.1, 2.9, 0.1, BX + dx, 1.8, BZ + dz, steelL);
    k.box(0.5, 0.3, 0.3, BX + 1.2, 1.7, BZ, dark); k.box(0.02, 0.18, 0.2, BX + 1.46, 1.72, BZ, k.glow(0x9ad0ff));
    k.point(BX, 2.4, BZ, 0xffd090, 8, 5);
    k.sign('"DISPATCH"', 2.6, 0.5, BX, 3.0, BZ + 1.62, 'transparent', '#f2c230', 120, 0);
    k.keepOut.push({ x: BX, z: BZ, r: 2.9 });
    k.beam(v(BX, 3.4, BZ), v(BX, 16, BZ), 0.09, steelL, 6);
    for (const y of [11, 13, 15]) k.box(1.6, 0.05, 0.05, BX, y, BZ, steelL);
    const beacon = k.mesh(new T.SphereGeometry(0.22, 10, 8), k.glow(0xff3a2a), BX, 16.2, BZ, true);
    const beaconL = k.point(BX, 16.2, BZ, 0xff3a2a, 30, 24);
    if (!ctx.reduced) k.ticks.push((t) => { const on = (t % 1.6) < 0.35; beacon.visible = on; beaconL.intensity = on ? 30 : 0; });
    // the shift board, the medallion wall, the works
    const board = k.sign('SHIFT CHANGE 5:00  ·  OUT 27  ·  IN 14', 5.6, 0.7, GX + 0.32, 6.4, -12, '#141416', '#f2c230', 88, PI / 2, { border: true });
    if (!ctx.reduced) { let out = 27, inn = 14, last = 0; k.ticks.push((t) => { if (t - last > 4.5) { last = t; if (Math.sin(t * 1.7) > 0) out++; else inn++; (board.material as T.MeshBasicMaterial).map = X.signText(`SHIFT CHANGE 5:00  ·  OUT ${out}  ·  IN ${inn}`, 1024, 128, '#141416', '#f2c230', 88, { border: true }); (board.material as T.MeshBasicMaterial).needsUpdate = true; } }); }
    k.censusWall({ x: 23, y: 3.4, z: -GD / 2 + 0.24, rotY: 0, cols: 14, rows: 4, tile: 0.5, gap: 0.05, start: ctx.wallStart(6400, 56), pieces: ctx.all, backing: dark });
    k.sign('THE MEDALLION WALL  ·  EVERY DRIVER ON THE FIVE O\'CLOCK', 7.6, 0.5, 23, 5.9, -GD / 2 + 0.24, 'transparent', '#f2c230', 60, 0);
    // the people: drivers waiting on their cabs, the sidewalk across the boulevard, a cab pulling in
    k.crowd([v(17, 0, -6), v(24, 0, 2), v(31, 0, -12), v(21, 0, -13)], 9, { seed: 427, speed: 0.3, spread: 1.4, animate: !ctx.reduced, colors: [0x24262c, 0x8a3a3a, 0x33477f, 0x151517, 0xc9a25a, 0x2b5f6e] });
    k.crowd([v(-11, 0, 60), v(-11, 0, -60)], 10, { seed: 428, speed: 0.9, spread: 1.6, animate: !ctx.reduced });
    const mover = cab(k, cabYellow, glassDark, dark, k.glow(0xfff0c0));
    mover.add(new T.InstancedMesh(new T.CylinderGeometry(0.32, 0.32, 0.22, 12), rubber, 4));
    { const wm = mover.children[mover.children.length - 1] as T.InstancedMesh; [[-0.8, 1.5], [0.8, 1.5], [-0.8, -1.5], [0.8, -1.5]].forEach(([dx, dz], i) => wm.setMatrixAt(i, mat(dx, 0.32, dz, 0, 1, 1, 1, 0, PI / 2))); wm.instanceMatrix.needsUpdate = true; }
    k.add(mover);
    k.rider(mover, k.spline([v(-2, 0, 78), v(-2, 0, 30), v(3, 0, 19), v(9, 0, 14.5), v(16, 0, 13), v(28, 0, 12), v(41, 0, 7), v(44, 0, -4), v(37, 0, -9), v(26, 0, -5), v(19, 0, 5), v(15, 0, 10.4), v(9, 0, 11.5), v(2, 0, 24), v(-5, 0, 44), v(-5, 0, 96), v(-1, 0, 104), v(-2, 0, 96)], true), 6.5);
    const lamps = [mover.userData.lamp as T.Mesh, ...parked];
    if (!ctx.reduced) k.ticks.push((t) => lamps.forEach((l, i) => { (l.material as T.MeshBasicMaterial).color.set(Math.sin(t * 2.4 + i * 1.9) > 0.2 ? 0xfff0c0 : 0x6a5a30); }));
    const mounts: Mount[] = [];
    bays.forEach((b) => mounts.push(M(b.x - Math.cos(b.th) * 0.2, 3.35, b.z - Math.sin(b.th) * 0.2, b.x - Math.cos(b.th) * 7, b.z - Math.sin(b.th) * 7, 5.0, 2.7, 'steel', true)));
    for (const x of [17.5, 24, 30.5, 37]) mounts.push(M(x, 3.5, GD / 2 - 0.24, x, GD / 2 - 6, 4.6, 2.6, 'steel', true));
    for (const x of [30, 36.5]) mounts.push(M(x, 3.5, -GD / 2 + 0.24, x, -GD / 2 + 6, 4.6, 2.6, 'steel', true));
    for (const z of [-6, 6]) mounts.push(M(GX + 0.28, 3.0, z, GX + 6, z, 4.6, 2.4, 'steel', true));
    for (const z of [-18.6, 18.6]) mounts.push(M(GX + 0.28, 3.5, z, GX + (z < 0 ? 7.8 : 6), z, 5.6, 2.8, 'steel', true));
    mounts.push(M(GX + 0.28, 6.3, 0, GX + 8, 0, 5.6, 2.0, 'steel', true));
    mounts.push(M(BX, 5.2, -GD / 2 + 0.24, BX, -GD / 2 + 8.2, 4.0, 2.2, 'steel', true));
    return { mounts, spawn: v(-9.5, 3, 0), look: v(GX + 18, 4.2, 0), eye: 3, bounds: [-13.4, GX + GW - 0.6, -70, 70], style: 'steel' };
  },
};

/* ---------------- 114 THE FLOWER COLD ROOM ---------------- */
export const flowercold: RoomDef = {
  id: 'flowercold',
  name: 'Before the flowers wake',
  area: 'WEST 28TH STREET, THE FLOWER DISTRICT',
  mood: 'Four in the morning',
  color: '#abbba2',
  daylit: false,
  description: 'A wholesaler\'s cold room on West 28th Street before dawn: strip curtains at the door, steel racks of buckets, tulips and roses by the hundred under frost coloured light, cold air pooling on the wet floor, the works on white fins floating over the flowers.',
  signatures: 'The green awnings and sidewalk buckets of the wholesalers, the plastic strip curtain, insulated panel walls, black buckets on wire racks, tulips and roses in colour blocks, a hand truck of buckets rolling the aisle, the evaporator fans, the loading dock and the delivery van at the curb.',
  build(k, ctx) {
    k.sky({ top: 0x0a1130, horizon: 0x3c3458, ground: 0x08080c, fog: 0.0034, stars: 260, env: 0.4 });
    k.hemi(0xcfe0ff, 0x101418, 0.5);
    k.sun(0x8090c0, 0.25, -40, 40, 30, false, 60);
    const floorT = k.pbr('fcFloor', X.concrete(0x6e7478, 441), 0.3, { roughness: 0.32, metalness: 0.1 }),
      panel = k.pbr('fcPanel', X.steel(0xd6dce0, false, 442), 0.5, { metalness: 0.3, roughness: 0.55 }),
      panelD = k.pbr('fcPanelD', X.steel(0xb8c0c6, false, 443), 0.5, { metalness: 0.3, roughness: 0.6 }),
      brick = k.pbr('fcBrick', X.brick(0x6a4a40, 444), 0.28),
      cornice = k.pbr('nbCornice', X.plaster(0xb8ad9a, 3), 0.6),
      awning = k.pbr('fcAwning', X.velvet(0x1f5a3a), 0.5, { roughness: 0.9 }),
      awningR = k.pbr('fcAwningR', X.velvet(0x8a2a2a), 0.5, { roughness: 0.9 }),
      corr = k.pbr('fcDock', X.steel(0x7a8288, false, 445), 0.6, { metalness: 0.6, roughness: 0.5, stretch: 0.2 }),
      fin = k.flat(0xf2f5f7, 0, 0.9, { emissive: 0xbfd4e8, emissiveIntensity: 0.12 }),
      steel = k.flat(0x9aa2aa, 0.85, 0.35),
      wire = k.flat(0xb8bcc0, 0.8, 0.35),
      bucketM = k.flat(0x1c1e22, 0.05, 0.6),
      stemM = k.flat(0x3d7a3a, 0, 0.9),
      headM = k.flat(0xffffff, 0, 0.75, { emissive: 0xffffff, emissiveIntensity: 0.12 }),
      dark = k.flat(0x1c1f24, 0.4, 0.6),
      white = k.flat(0xe8ecee, 0.1, 0.5),
      rubber = k.flat(0x1a1a1c, 0.1, 0.9),
      glass = k.glass(0xcfe4ee, 0.24, 0.05),
      glassDark = k.glass(0x9fc4d8, 0.35, 0.08),
      strip = k.glass(0xd8ecf4, 0.22, 0.1),
      frost = k.glow(0xdff4ff),
      warm = k.glow(0xffd28a);
    // the street: wholesalers under awnings, buckets on the sidewalk, palms in pots, the van at the curb
    street(k, { w: 16, len: 130, z: 0 });
    blockFront(k, { x: -13, z0: 52, count: 13, face: 1, seed: 446, h: [12, 20] });
    blockFront(k, { x: 13, z0: 52, count: 4, face: -1, seed: 447, h: [12, 20] });
    blockFront(k, { x: 13, z0: -20, count: 5, face: -1, seed: 448, h: [12, 20] });
    const aw = (x: number, z: number, len: number, m: T.Material, face: 1 | -1) => { const a = k.mesh(new T.BoxGeometry(2.4, 0.1, len), m, x + face * 1.1, 3.6, z); a.rotation.z = face * 0.3; k.box(0.05, 0.4, len, x + face * 2.15, 3.15, z, m); };
    for (const z of [44, 28, 12, -20, -36]) aw(-13, z, 7.4, z % 3 ? awning : awningR, 1);
    for (const z of [28, -20, -36]) aw(13, z, 7.4, awning, -1);
    for (const [x, z] of [[-9.2, 40], [-9.2, 18], [-9.2, -26], [9.4, -22], [9.4, 24]]) k.prop('palm_urn', x, 0, z, { height: 3.0, keepOut: 0.7 });
    for (const z of [36, -44]) for (const s of [-1, 1]) k.lamp(s * 10.5, z, 6.5, dark, 0xffd9a8, 24);
    k.prop('hydrant', -10.6, 0, 4, { height: 1.1, keepOut: 0.5 });
    k.prop('mailbox', -10.7, 0, -14, { height: 1.5, rotY: -PI / 2, keepOut: 0.6 });
    k.box(2.3, 2.3, 4.8, 5.2, 1.55, 17.6, white); k.box(2.2, 1.5, 1.9, 5.2, 1.05, 21.0, white); k.box(2.1, 0.8, 0.1, 5.2, 1.4, 21.96, glassDark);
    for (const [dx, dz] of [[-0.95, 19.2], [0.95, 19.2], [-0.95, 15.6], [0.95, 15.6]]) { const w = k.cyl(0.36, 0.26, 5.2 + dx, 0.36, dz, rubber, 0.36, 12); w.rotation.z = PI / 2; }
    k.sign('28TH STREET WHOLESALE FLOWERS', 3.6, 0.5, 6.37, 2.0, 17.6, 'transparent', '#1f5a3a', 80, PI / 2);
    k.keepOut.push({ x: 5.2, z: 18.5, r: 2.6 });
    // the building: brick above, the shop, the loading dock beside it
    const SX = 13, W = 30, D = 16, H = 5.8;
    k.box(W, 11.7, D + 7, SX + W / 2, H + 0.3 + 5.85, 3.5, brick);
    k.moulding([[0, 0], [0.7, 0], [0.8, 0.2], [0.5, 0.35], [0.6, 0.55], [0.25, 0.75], [0, 0.85]], D + 7.2, SX - 0.05, H + 11.2, 3.5, cornice, 0);
    for (let y = H + 2.6; y < H + 11; y += 2.7) for (let dz = -6; dz <= 13; dz += 3.2) { k.box(0.2, 1.9, 1.35, SX - 0.06, y, dz, cornice); k.box(0.05, 1.65, 1.1, SX + 0.06, y, dz, (dz + y) % 7 < 2 ? warm : glassDark); }
    k.prop('fire_escape', SX - 1.05, H + 2.2, 6, { height: 3.2, rotY: PI / 2 });
    k.prop('fire_escape', SX - 1.05, H + 4.9, 6, { height: 3.2, rotY: PI / 2 });
    k.box(5, 1.2, 5.6, SX + 2.5, 0.6, 11.7, k.pbr('fcDockC', X.concrete(0x8a8c88, 449), 0.3)); k.box(0.4, 0.4, 3.6, SX - 0.15, 1.05, 11.7, rubber);
    k.box(0.16, 3.4, 4.6, SX + 0.08, 2.9, 11.7, corr); k.box(0.5, 1.2, 0.5, SX + 0.25, 4.9, 11.7, dark); k.block(SX - 0.3, SX + 5.2, 9, 14.6);
    k.sign('RECEIVING  ·  5 AM', 2.2, 0.32, SX - 0.02, 4.9, 11.7, '#0d0d0d', '#f4f0e8', 90, -PI / 2);
    aw(SX, 0, D - 1, awning, -1);
    k.box(0.3, 0.3, D, SX - 0.1, H - 0.15, 0, panel);
    k.sign('CUT FLOWERS  ·  WHOLESALE  ·  OPEN 5 AM  ·  TO THE TRADE', 13, 0.42, SX - 2.2, 3.15, 0, 'transparent', '#f4f0e8', 70, -PI / 2);
    for (let i = 0; i < 3; i++) k.point(SX - 1.6, 3.0, -5 + i * 5, 0xffe0a0, 8, 7);
    // the front: panel wall, a window of flowers, the strip curtain door with its header
    for (const s of [-1, 1]) { const z0 = s > 0 ? 1.7 : -D / 2, z1 = s > 0 ? D / 2 : -1.7, zc = (z0 + z1) / 2, w = z1 - z0; k.box(0.3, H, w, SX, H / 2, zc, panel); k.block(SX - 0.3, SX + 0.3, z0, z1); }
    k.box(0.34, 1.7, 3.6, SX, 2.05, 5.2, k.flat(0xdfe8ee, 0, 0.8, { emissive: 0xbfd0dc, emissiveIntensity: 0.6 })); k.box(0.12, 1.5, 3.4, SX - 0.14, 2.05, 5.2, glass);
    k.sign('ROSES  ·  TULIPS  ·  PEONIES  ·  RANUNCULUS  ·  BY THE BUNCH', 3.2, 0.34, SX - 0.22, 2.55, 5.2, 'transparent', '#1f5a3a', 60, -PI / 2);
    k.box(0.3, H - 3.2, 3.4, SX, 3.2 + (H - 3.2) / 2, 0, panel);
    for (const z of [-1.8, 1.8]) k.box(0.34, 3.3, 0.16, SX, 1.65, z, steel);
    k.box(0.36, 0.2, 3.6, SX, 3.25, 0, steel);
    k.sign('"COLD"', 1.6, 0.38, SX - 0.2, 3.8, 0, 'transparent', '#0d0d0d', 120, -PI / 2, { double: true });
    const strips = k.instances(new T.PlaneGeometry(0.3, 3.1), strip, Array.from({ length: 12 }, (_, i) => mat(SX, 1.6, -1.55 + i * 0.28 + (i % 2) * 0.02, PI / 2)));
    if (!ctx.reduced) { const mm = new T.Matrix4(); k.ticks.push((t) => { for (let i = 0; i < 12; i++) { mm.compose(v(SX + Math.sin(t * 1.3 + i * 0.7) * 0.05, 1.6, -1.55 + i * 0.28), new T.Quaternion().setFromEuler(new T.Euler(0, PI / 2, Math.sin(t * 1.1 + i) * 0.03)), v(1, 1, 1)); strips.setMatrixAt(i, mm); } strips.instanceMatrix.needsUpdate = true; }); }
    // the box: wet floor, insulated walls and ceiling, cold strips, the evaporator fans
    k.box(W, 0.3, D, SX + W / 2, -0.15, 0, floorT);
    k.box(W, 0.3, D, SX + W / 2, H + 0.15, 0, panelD);
    for (const s of [-1, 1]) { k.box(W, H, 0.3, SX + W / 2, H / 2, s * D / 2, panel); k.block(SX, SX + W, s > 0 ? D / 2 - 0.3 : -D / 2 - 0.3, s > 0 ? D / 2 + 0.3 : -D / 2 + 0.3); }
    k.box(0.3, H, D, SX + W, H / 2, 0, panel); k.block(SX + W - 0.3, SX + W + 0.3, -D / 2, D / 2);
    for (const z of [-5, 0, 5]) k.box(W - 3, 0.05, 0.22, SX + W / 2, H - 0.03, z, frost);
    for (const x of [SX + 5, SX + 15, SX + 25]) for (const z of [-4, 4]) k.point(x, H - 0.6, z, 0xd8ecff, 20, 14);
    const fans: T.Group[] = [];
    for (const z of [-4.5, 4.5]) { k.box(2.6, 1.0, 1.6, SX + W - 1.6, H - 0.5, z, white); for (const dx of [-0.65, 0.65]) { const g = new T.Group(); g.position.set(SX + W - 2.42, H - 0.5, z + dx); g.rotation.y = -PI / 2; for (let b = 0; b < 5; b++) { const bl = new T.Mesh(new T.BoxGeometry(0.1, 0.42, 0.02), steel); bl.position.y = 0.2; const pv = new T.Group(); pv.rotation.z = (b * PI * 2) / 5; pv.add(bl); g.add(pv); } k.add(g); fans.push(g); } }
    if (!ctx.reduced) k.ticks.push((t) => fans.forEach((g, i) => { g.rotation.z = t * (7 + i); }));
    // flowers: buckets on the floor islands and the wall racks, tulips and roses instanced by the hundred
    const buckets: T.Matrix4[] = [], stems: T.Matrix4[] = [], tulips: T.Matrix4[] = [], roses: T.Matrix4[] = [];
    const tcols: number[] = [], rcols: number[] = [], rnd = X.mulberry(451);
    const tulipCols = [0xe0222a, 0xf2b52a, 0xf4f0e8, 0xf06aa0, 0xff6a2a, 0x7a2aa0], roseCols = [0xb8101e, 0xf4d2dc, 0xf4f0e8, 0xf08a2a, 0xe63a7a, 0xf2e26a];
    let bi = 0;
    const bucket = (x: number, y: number, z: number, n: number) => {
      buckets.push(mat(x, y + 0.21, z));
      const tulip = bi++ % 2 === 0, col = tulip ? tulipCols[Math.floor(rnd() * tulipCols.length)] : roseCols[Math.floor(rnd() * roseCols.length)];
      for (let i = 0; i < n; i++) {
        const a = rnd() * PI * 2, r = rnd() * 0.11, h = 0.5 + rnd() * 0.16, lean = (rnd() - 0.5) * 0.25;
        const sx = x + Math.cos(a) * r, sz = z + Math.sin(a) * r;
        stems.push(mat(sx, y + 0.3 + h / 2, sz, 0, 1, h / 0.55, 1, lean, lean * 0.7));
        const top = mat(sx + lean * 0.3, y + 0.3 + h, sz + lean * 0.2, rnd() * PI * 2);
        if (tulip) { tulips.push(top); tcols.push(col); } else { roses.push(top); rcols.push(col); }
      }
    };
    const islands = [[SX + 7, SX + 10], [SX + 12, SX + 15], [SX + 17, SX + 20], [SX + 22, SX + 25]];
    for (const [x0, x1] of islands) { k.box(x1 - x0 + 0.2, 0.22, 2.6, (x0 + x1) / 2, 0.11, 0, k.pbr('fcPallet', X.planks(0x8a7a60, 3, 452), 1.2)); k.block(x0 - 0.1, x1 + 0.1, -1.3, 1.3); for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) bucket(x0 + 0.3 + i * 0.6, 0.22, -0.9 + j * 0.6, 7); }
    const posts: T.Matrix4[] = [];
    for (const s of [-1, 1]) {
      const zr = s * (D / 2 - 0.7);
      for (const y of [0.05, 1.05, 2.05]) k.box(W - 4, 0.04, 1.0, SX + W / 2, y, zr, wire);
      for (let x = SX + 2; x <= SX + W - 2; x += 2) for (const dz of [-0.45, 0.45]) posts.push(mat(x, 1.25, zr + dz));
      k.block(SX + 1.8, SX + W - 1.8, s > 0 ? zr - 0.6 : zr - 0.7, s > 0 ? zr + 0.7 : zr + 0.6);
      for (const y of [0.07, 1.07]) for (let x = SX + 2.4; x <= SX + W - 2.4; x += 0.6) bucket(x, y, zr + (y > 0.5 ? 0.1 : -0.1), 5);
    }
    k.instances(new T.BoxGeometry(0.05, 2.4, 0.05), steel, posts);
    for (const [x, z] of [[-9.6, 12], [-9.6, 12.7], [-9.6, 13.4], [-9.6, 42], [-9.6, 42.7], [9.4, -6], [9.4, -6.7], [9.4, -7.4], [9.4, 5.2], [9.4, 5.9], [9.4, -21], [9.4, -21.7], [-9.6, -28], [-9.6, -28.7]]) bucket(x, 0.28, z, 6);
    for (let i = 0; i < 6; i++) bucket(SX - 0.55, 0.0, 3.7 + i * 0.6, 6);
    k.keepOut.push({ x: SX - 0.55, z: 5.2, r: 1.2 });
    for (const x of [-9.6, 9.4]) for (const z of [12.7, 42.4, -6.7, 5.5, -21.4, -28.4]) k.keepOut.push({ x, z, r: 0.7 });
    k.instances(new T.CylinderGeometry(0.16, 0.13, 0.42, 10), bucketM, buckets);
    k.instances(new T.CylinderGeometry(0.006, 0.006, 0.55, 4), stemM, stems);
    const tulipG = new T.LatheGeometry([new T.Vector2(0.006, 0), new T.Vector2(0.045, 0.02), new T.Vector2(0.064, 0.09), new T.Vector2(0.04, 0.15), new T.Vector2(0.006, 0.17)], 6);
    const tulipMesh = k.instances(tulipG, headM, tulips), roseMesh = k.instances(new T.IcosahedronGeometry(0.055, 0), headM, roses);
    const cc = new T.Color();
    tcols.forEach((c, i) => tulipMesh.setColorAt(i, cc.set(c))); rcols.forEach((c, i) => roseMesh.setColorAt(i, cc.set(c)));
    // the fins: white panels floating over the aisle crossings, hung on rods, a work on each face
    const rods: T.Matrix4[] = [];
    const finsX = [SX + 6, SX + 11, SX + 16, SX + 21, SX + 26];
    for (const x of finsX) { k.box(0.12, 2.6, 4.4, x, 4.2, 0, fin); for (const dz of [-1.8, 1.8]) rods.push(mat(x, (H + 5.5) / 2, dz, 0, 1, H - 5.5, 1)); }
    k.instances(new T.BoxGeometry(0.03, 1, 0.03), steel, rods);
    // cold air on the floor: a drifting sheet of soft pools
    const fogM = new T.MeshBasicMaterial({ map: X.pool(), color: 0xa8cfe8, transparent: true, opacity: 0.22, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
    const fogN = 16, fogG = new T.PlaneGeometry(7, 5);
    const fogPos = Array.from({ length: fogN }, (_, i) => ({ x: SX + 3 + (i % 8) * 3.4, z: -5 + Math.floor(i / 8) * 8 + (i % 3) * 1.2, ph: i * 0.9 }));
    const fog = k.instances(fogG, fogM, fogPos.map((p) => mat(p.x, 0.3, p.z, 0, 1, 1, 1, -PI / 2)));
    if (!ctx.reduced) { const mm = new T.Matrix4(); k.ticks.push((t) => { fogPos.forEach((p, i) => { mm.compose(v(p.x + Math.sin(t * 0.18 + p.ph) * 1.6, 0.28 + Math.sin(t * 0.5 + p.ph) * 0.08, p.z + Math.cos(t * 0.13 + p.ph) * 1.0), new T.Quaternion().setFromEuler(new T.Euler(-PI / 2, 0, t * 0.05 + p.ph)), v(1 + 0.2 * Math.sin(t * 0.3 + p.ph), 1, 1)); fog.setMatrixAt(i, mm); }); fog.instanceMatrix.needsUpdate = true; }); }
    // the hand truck rolling the aisle, the two workers, the buyers on the street
    const truck = new T.Group();
    const tf = new T.Mesh(new T.BoxGeometry(0.55, 1.25, 0.04), steel); tf.position.set(0, 0.75, -0.2); tf.rotation.x = -0.35; truck.add(tf);
    const tb = new T.Mesh(new T.BoxGeometry(0.55, 0.03, 0.5), steel); tb.position.set(0, 0.12, 0.05); truck.add(tb);
    for (const dx of [-0.3, 0.3]) { const w = new T.Mesh(new T.CylinderGeometry(0.14, 0.14, 0.05, 10), rubber); w.rotation.z = PI / 2; w.position.set(dx, 0.14, -0.15); truck.add(w); }
    for (let i = 0; i < 3; i++) { const b = new T.Mesh(new T.CylinderGeometry(0.16, 0.13, 0.42, 10), bucketM); b.position.set(-0.17 + (i % 2) * 0.34, 0.35 + Math.floor(i / 2) * 0.45, 0.1); truck.add(b); const f = new T.Mesh(new T.ConeGeometry(0.2, 0.36, 8), k.flat([0xe0222a, 0xf4d2dc, 0xf2b52a][i], 0, 0.8)); f.position.set(b.position.x, b.position.y + 0.5, 0.1); truck.add(f); }
    k.add(truck);
    k.rider(truck, k.spline([v(SX + 4, 0, -3.6), v(SX + 27, 0, -3.6), v(SX + 28.5, 0, 0), v(SX + 27, 0, 3.6), v(SX + 4, 0, 3.6), v(SX + 3, 0, 0)], true), 0.75);
    k.crowd([v(SX + 3, 0, 3.4), v(SX + 14, 0, 3.6), v(SX + 26, 0, 3.4)], 2, { seed: 453, speed: 0.25, spread: 0.4, animate: !ctx.reduced, colors: [0x24262c, 0x1f5a3a] });
    k.crowd([v(-10.5, 0, 55), v(-10.5, 0, -55)], 6, { seed: 454, speed: 0.75, spread: 1.4, animate: !ctx.reduced });
    k.crowd([v(10.5, 0, 55), v(10.5, 0, 17)], 3, { seed: 455, speed: 0.7, spread: 1.0, animate: !ctx.reduced });
    // the hang: both faces of every fin, the long walls above the racks, the order board at the back
    const mounts: Mount[] = [];
    finsX.forEach((x, i) => { mounts.push(M(x - 0.07, 4.2, 0, x - 5, 0, 4.2, 2.4, 'white', true)); if (i < finsX.length - 1) mounts.push(M(x + 0.07, 4.2, 0, x + 5, 0, 4.2, 2.4, 'white', true)); });
    for (const s of [-1, 1]) for (const x of [SX + 4, SX + 9.5, SX + 15, SX + 20.5, SX + 26]) mounts.push(M(x, 4.0, s * (D / 2 - 0.2), x, s * 3.5, 3.6, 2.2, 'steel', true));
    for (const z of [-5, 5]) mounts.push(M(SX + W - 0.2, 3.7, z, SX + W - 5, z, 3.6, 2.2, 'steel', true));
    k.censusWall({ x: SX + W - 0.2, y: 4.0, z: 0, rotY: -PI / 2, cols: 10, rows: 3, tile: 0.5, gap: 0.05, start: ctx.wallStart(6600, 30), pieces: ctx.all, backing: dark });
    k.sign('ORDERS  ·  TULIPS 120  ·  ROSES 300  ·  PEONIES SOLD OUT', 5.2, 0.4, SX + W - 0.2, 5.5, 0, 'transparent', '#dff4ff', 64, -PI / 2);
    return { mounts, spawn: v(1.5, 2.8, 0), look: v(SX + W, 3.2, 0), eye: 2.8, bounds: [-12.4, SX + W - 0.5, -50, 50], style: 'white' };
  },
};

/* ---------------- 115 THE HANDBALL COURTS ---------------- */
export const handball: RoomDef = {
  id: 'handball',
  name: 'The fourth wall belongs to us',
  area: 'ALLEN STREET, LOWER EAST SIDE',
  mood: 'Golden hour, last game',
  color: '#96a7bd',
  description: 'Three one wall handball courts on the Lower East Side at golden hour, the walls scaled up to monuments: low sun raking the concrete, a blue ball between wall and hand, the crowd along the chain link, the tenements and their fire escapes behind, the works as a civic triptych on the walls and portraits along the fence.',
  signatures: 'Three sixteen foot walls with the court lines painted on, the short line and sidelines on asphalt, the chain link fence with its gate, the park benches and the trees, the open hydrant on the sidewalk, tenements with fire escapes behind the walls, a pickup game in the middle court.',
  build(k, ctx) {
    k.sky({ top: 0x5f86c0, horizon: 0xf4b978, ground: 0x4a4238, fog: 0.0026, sun: { az: 1.1, el: 0.12, color: 0xffb073, size: 22 }, haze: 0.6, env: 0.9 });
    k.hemi(0xdfe6ff, 0x5a4a3a, 0.8);
    k.sun(0xffb073, 2.7, 70, 15, -46, true, 90);
    const court = k.pbr('hbCourt', X.asphalt(0x2c3034), 0.15, { roughness: 0.9 }),
      wallC = k.pbr('hbWall', X.concrete(0xd6d0c0, 461), 0.22, { roughness: 0.85 }),
      wallB = k.pbr('hbWallB', X.concrete(0xb8b0a0, 462), 0.22, { roughness: 0.9 }),
      band = k.flat(0x2a4aa8, 0, 0.8),
      white = k.flat(0xf4f0e8, 0, 0.6),
      red = k.flat(0xc83a2a, 0, 0.8),
      fence = k.flat(0x8c98a4, 0.9, 0.3, { transparent: true, opacity: 0.5 }),
      steel = k.flat(0x8c98a4, 0.9, 0.3),
      dark = k.flat(0x1f242a, 0.7, 0.45),
      hex = k.pbr('hexPavers', X.pavers(0x9a968c, 18), 0.35),
      lawn = k.pbr('hbLawn', X.grass(0x4f7a3a, 463), 0.15),
      wood = k.pbr('hbSlat', X.planks(0x6a4a30, 3, 464), 1.2, { roughness: 0.6 }),
      green = k.flat(0x1f5a3a, 0, 0.7),
      water = k.flat(0xcfe8ff, 0.2, 0.2, { transparent: true, opacity: 0.7 }),
      ballM = k.flat(0x2a5ad8, 0, 0.5);
    // the block: Allen Street with its tenements across, the park strip, the tenement row behind the walls
    street(k, { w: 16, len: 150, z: 0, x: 21 });
    blockFront(k, { x: 34, z0: 64, count: 16, face: -1, seed: 465, h: [16, 24] });
    blockFront(k, { x: -26, z0: 32, count: 9, face: 1, seed: 466, h: [16, 22] });
    k.box(60, 0.3, 150, -12, -0.16, 0, hex);
    k.box(10, 0.34, 46, 3, -0.15, 0, hex);
    for (const s of [-1, 1]) k.box(10, 0.36, 24, 3, -0.14, s * 35, lawn);
    for (const z of [26, -26]) for (const s of [-1, 1]) k.lamp(s > 0 ? 12.5 : 29.5, z, 6.5, dark, 0xffd9a8, 20);
    k.prop('mailbox', 12.7, 0, 30, { height: 1.5, rotY: PI / 2, keepOut: 0.6 });
    for (const [x, z, sd] of [[6, -13, 1], [6, 13, 2], [6, -30, 3], [6, 30, 4]]) { k.tree(x, 0, z, { h: 5.5, r: 2.8, seed: sd, leaf: 0x4a7a3a }); k.keepOut.push({ x, z, r: 0.7 }); }
    for (const z of [-8, 8]) k.bench(4.6, z, PI / 2, wood, dark);
    k.prop('quiet_bench', 5.5, 0, -20, { height: 0.9, rotY: PI / 2, keepOut: 1.2 });
    k.prop('storm_drain', 12.2, 0.02, -2, { height: 0.08 });
    k.prop('utility_pole', 30.5, 0, -18, { height: 9, keepOut: 0.5 });
    // the open hydrant: a jet into the street
    k.prop('hydrant', 9.6, 0, -14, { height: 1.1, keepOut: 0.5 });
    const dropsN = 90, drops = k.instances(new T.SphereGeometry(0.07, 5, 4), water, Array.from({ length: dropsN }, () => new T.Matrix4()));
    const dropAt = (i: number, t: number, mm: T.Matrix4) => { const u = ((t * 1.6 + i * 0.011) % 1), s = (i % 7) * 0.04; mm.compose(v(10.0 + u * 9.5, 0.7 + u * 3.6 - u * u * 4.6 + s, -14 + (i % 9 - 4) * 0.05 * u * 4), new T.Quaternion(), v(1, 1, 1)); };
    { const mm = new T.Matrix4(); for (let i = 0; i < dropsN; i++) { dropAt(i, 0, mm); drops.setMatrixAt(i, mm); } }
    if (!ctx.reduced) { const mm = new T.Matrix4(); k.ticks.push((t) => { for (let i = 0; i < dropsN; i++) { dropAt(i, t, mm); drops.setMatrixAt(i, mm); } drops.instanceMatrix.needsUpdate = true; }); }
    k.box(4, 0.02, 3, 16, 0.02, -14, k.flat(0x1a2430, 0.3, 0.2, { transparent: true, opacity: 0.6 }));
    // the courts: asphalt, three monumental walls, the lines, the gaps closed with fence
    const WX = -16, WW = 12, WH = 9.6, GAP = 1.5;
    k.box(15.2, 0.32, 42, -9.4, -0.14, 0, court);
    const walls = [-(WW + GAP), 0, WW + GAP];
    walls.forEach((zc, i) => {
      k.box(0.6, WH, WW, WX, WH / 2, zc, i === 1 ? wallC : wallB);
      k.box(0.64, 1.1, WW, WX, 0.55, zc, i === 1 ? band : red);
      k.box(0.66, 0.08, WW, WX, WH - 0.1, zc, white);
      k.box(0.06, 0.02, WW, WX + 9.7, 0.19, zc, red);
      for (const s of [-1, 1]) k.box(13.6, 0.02, 0.06, WX + 7.1, 0.19, zc + s * WW / 2, white);
      for (let x = WX + 0.5; x < -2; x += 1.7) k.box(0.05, 0.03, 0.05, x, 0.18, zc, white);
    });
    k.box(0.5, WH, 42, WX - 0.6, WH / 2, 0, wallB);
    k.box(1.4, 0.4, 42, WX - 0.2, WH + 0.2, 0, dark);
    for (const zc of [-(WW / 2 + GAP / 2), WW / 2 + GAP / 2]) k.box(0.03, WH, GAP, WX + 0.3, WH / 2, zc, fence);
    k.block(WX - 1.2, WX + 0.35, -21.2, 21.2);
    k.sign('"WALL"', 1.6, 0.4, WX + 0.34, WH - 0.55, -4.6, 'transparent', '#0d0d0d', 120, PI / 2);
    // the chain link: front with the gate, both sides, posts and top rail
    const FX = -2, FZ = 21, FH = 4.2;
    for (const s of [-1, 1]) { const z0 = s > 0 ? 1.8 : -FZ, z1 = s > 0 ? FZ : -1.8; k.box(0.03, FH, z1 - z0, FX, FH / 2, (z0 + z1) / 2, fence); k.block(FX - 0.25, FX + 0.25, z0, z1); }
    for (const s of [-1, 1]) { k.box(FX - WX, FH, 0.03, (FX + WX) / 2, FH / 2, s * FZ, fence); k.block(WX, FX, s * FZ - 0.25, s * FZ + 0.25); k.box(FX - WX, 0.06, 0.06, (FX + WX) / 2, FH, s * FZ, steel); for (let x = WX; x <= FX; x += 3) k.box(0.08, FH + 0.2, 0.08, x, FH / 2 + 0.1, s * FZ, steel); }
    for (let z = -FZ; z <= FZ; z += 3) if (Math.abs(z) > 2) k.box(0.08, FH + 0.2, 0.08, FX, FH / 2 + 0.1, z, steel);
    for (const s of [-1, 1]) k.box(0.06, 0.06, FZ - 1.8, FX, FH, s * (FZ + 1.8) / 2, steel);
    for (const z of [-1.9, 1.9]) k.box(0.12, FH + 0.3, 0.12, FX, FH / 2 + 0.15, z, steel);
    k.box(4.2, 0.12, 0.12, FX, FH + 0.2, 0, steel);
    k.sign('NYC PARKS  ·  HANDBALL COURTS  ·  DUSK TO DAWN  ·  NO BIKES ON THE COURT', 3.4, 0.5, FX + 0.1, FH + 0.6, 0, '#1f5a3a', '#f4f0e8', 46, PI / 2, { border: true, double: true });
    k.box(0.06, 0.6, 3.6, FX, FH + 0.6, 0, green);
    for (const s of [-1, 1]) { k.beam(v(FX - 0.6, 0, s * (FZ - 0.6)), v(FX - 0.6, 11, s * (FZ - 0.6)), 0.14, steel, 8); k.box(0.5, 0.4, 0.9, FX - 0.9, 10.8, s * (FZ - 0.6), dark); k.box(0.3, 0.2, 0.7, FX - 1.15, 10.7, s * (FZ - 0.6), k.glow(0xfff4e0)); k.spot(FX - 0.9, 10.8, s * (FZ - 0.6), WX + 6, 0, s * 8, 0xfff0d8, 260, 0.75, 0.6, 40); k.keepOut.push({ x: FX - 0.6, z: s * (FZ - 0.6), r: 0.5 }); }
    // the game: a ball between wall and hand, two players, the crowd at the fence, pigeons
    const ball = k.mesh(new T.SphereGeometry(0.12, 10, 8), ballM, -8, 1, 0, true);
    k.rider(ball, k.spline([v(-7, 1.3, 11.9), v(-11, 3.6, 12.9), v(-15.3, 3.4, 13.9), v(-12, 2.6, 15.1), v(-8.5, 0.7, 14.7)], true), 9);
    k.crowd([v(-10, 0, 10), v(-13, 0, 15.7), v(-9.5, 0, 17.1)], 2, { seed: 467, speed: 2.0, spread: 1.0, animate: !ctx.reduced, colors: [0xf4f0e8, 0x2a5ad8] });
    k.crowd([v(-14, 0, 19.4), v(-4.5, 0, 19.6)], 8, { seed: 468, speed: 0.12, spread: 1.0, animate: !ctx.reduced });
    k.crowd([v(-14, 0, -19.4), v(-4.5, 0, -19.6)], 7, { seed: 469, speed: 0.12, spread: 1.0, animate: !ctx.reduced });
    k.crowd([v(10.5, 0, 60), v(10.5, 0, -60)], 9, { seed: 470, speed: 0.8, spread: 1.4, animate: !ctx.reduced });
    k.crowd([v(31.5, 0, 60), v(31.5, 0, -60)], 6, { seed: 471, speed: 0.8, spread: 1.4, animate: !ctx.reduced });
    const pigeons: T.Mesh[] = [];
    for (let i = 0; i < 7; i++) { const b = k.mesh(new T.ConeGeometry(0.09, 0.4, 4), dark, 0, 8, 0, true); b.rotation.x = PI / 2; pigeons.push(b); }
    if (!ctx.reduced) k.ticks.push((t) => pigeons.forEach((b, i) => { const a = t * 0.45 + i * 0.9, r = 9 + 3 * Math.sin(t * 0.2 + i); b.position.set(2 + Math.cos(a) * r, 7 + 2 * Math.sin(t * 0.8 + i), Math.sin(a) * r * 1.6); b.rotation.y = -a; }));
    // the hang: the civic triptych, one monumental work and two flanking portraits per wall, portraits along the fence
    const mounts: Mount[] = [];
    walls.forEach((zc) => { mounts.push(M(WX + 0.34, 5.6, zc, WX + 9, zc, 7.0, 5.2, 'white', false)); for (const s of [-1, 1]) mounts.push(M(WX + 0.34, 3.3, zc + s * 4.8, WX + 6, zc + s * 4.8, 1.8, 2.0, 'white', false)); });
    for (const s of [-1, 1]) for (const x of [-14, -11, -8, -5]) mounts.push(M(x, 3.0, s * (FZ - 0.1), x, s * (FZ - 6), 2.6, 1.8, 'steel', false));
    for (const z of [-16, -11, -6, 6, 11, 16]) mounts.push(M(FX - 0.1, 3.0, z, FX - 6, z, 2.6, 1.8, 'steel', false));
    return { mounts, spawn: v(-3.4, 3, 0), look: v(WX, 5.0, 0), eye: 3, bounds: [WX + 0.6, 12.4, -24, 24], style: 'white' };
  },
};

/* ---------------- 116 THE SALT SHED ---------------- */
export const salt: RoomDef = {
  id: 'saltvault',
  name: 'Winter stored as a mountain',
  area: 'SPRING STREET AND WEST STREET',
  mood: 'The city before snow',
  color: '#c6d4e1',
  description: 'The Spring Street Salt Shed: a faceted concrete crystal on the Hudson beside the sanitation garage in its skin of fins. Inside, five thousand tons of salt as a white mountain under the folded shell, plow blades against the wall, a loader idling, the works on the promenade around the pile.',
  signatures: 'The tilted concrete facets cantilevering over the base, the truck door on Spring Street, the garage next door wrapped in perforated fins, the Hudson and the Jersey shore behind, the salt cone with grains sliding, the yellow plow blades, a salt spreader rolling past on West Street, gulls.',
  build(k, ctx) {
    k.sky({ top: 0x6a9ad8, horizon: 0xe2e6ea, ground: 0x4a5058, fog: 0.0024, sun: { az: 1.3, el: 0.5, color: 0xfff1d8, size: 14 }, env: 0.9 });
    k.hemi(0xeef3ff, 0x4a4e52, 0.85);
    k.sun(0xfff0d4, 2.3, 40, 55, 30, false, 90);
    const conc = k.pbr('ssShell', X.concrete(0xb9b8b2, 471), 0.09, { roughness: 0.82, flatShading: true }),
      concIn = k.pbr('ssShellIn', X.concrete(0x8a8c8e, 471), 0.09, { roughness: 0.9, flatShading: true }),
      base = k.pbr('ssBase', X.concrete(0x8e8e8a, 472), 0.3, { roughness: 0.85 }),
      floorT = k.pbr('ssFloor', X.concrete(0x6a6c6a, 473), 0.3, { roughness: 0.5 }),
      apron = k.pbr('ssApron', X.pavers(0x8a8a86, 474), 0.4),
      saltM = k.pbr('ssSalt', X.plaster(0xf6f4ee, 475), 1.4, { roughness: 1, normal: 1.6 }),
      grain = k.flat(0xf8f7f2, 0, 0.9),
      garage = k.pbr('ssGarage', X.windows(476, 0.2, 0x3a4048, false), 0.12, { emissive: 0xffffff, emissiveIntensity: 0.6, roughness: 0.5, metalness: 0.4, stretch: 0.42 }),
      finM = k.flat(0xc8ccd0, 0.85, 0.35),
      steel = k.flat(0x6a727a, 0.8, 0.45),
      steelL = k.flat(0x9aa2aa, 0.85, 0.35),
      yellow = k.flat(0xf2b230, 0.2, 0.5),
      orange = k.flat(0xf07a20, 0.1, 0.6),
      whiteM = k.flat(0xe8ecee, 0.1, 0.5),
      dark = k.flat(0x1c1f24, 0.4, 0.6),
      rubber = k.flat(0x1a1a1c, 0.1, 0.9),
      glassDark = k.glass(0x9fc4d8, 0.35, 0.08),
      rail = k.flat(0x3a4048, 0.7, 0.45),
      gull = k.flat(0xf0f0ea, 0, 0.8);
    // West Street: the highway, the bikeway and the river on one side, the shed and the garage on the other
    street(k, { w: 22, len: 200, z: 0 });
    for (const dx of [-3.7, 3.7]) k.box(0.1, 0.012, 190, dx, 0.012, 0, k.flat(0xdedbd2, 0, 0.7));
    k.box(6, 0.3, 200, -19, -0.15, 0, k.pbr('ssBike', X.asphalt(0x2a3a3a), 0.11));
    k.rail(-22.2, 0, 200, rail, 1.1, 'z', 2.5);
    k.block(-22.6, -21.8, -100, 100);
    k.water({ y: -1.6, color: 0x2e4a62, w: 300, d: 420, x: -172, z: 0, amp: 1 });
    k.box(4, 2, 200, -24, -1, 0, k.pbr('ssBulk', X.ashlar(0x6a6a66, 477, 2), 0.4));
    k.skyline({ z: -300, count: 22, spacing: 9, scale: 1.9, base: -1.6, seed: 478, lit: 0.25, glow: 0.6, tint: 0x4a5060, rows: 1, x: -90 });
    k.skyline({ z: 300, count: 22, spacing: 9, scale: 2.1, base: -1.6, seed: 479, lit: 0.25, glow: 0.6, tint: 0x4a5060, rows: 1, x: 40 });
    blockFront(k, { x: 16, z0: -24, count: 6, face: -1, seed: 480, h: [12, 20] });
    for (const z of [40, -40]) for (const s of [-1, 1]) k.lamp(s * 13.5, z, 8, steel, 0xffd9a8, 22);
    k.box(46, 0.3, 100, 39, -0.14, 20, apron);
    // the sanitation garage: a long box wrapped in a double skin of fins
    const GZ0 = 25, GZ1 = 65, GH = 26;
    k.box(38, GH, GZ1 - GZ0, 37, GH / 2, (GZ0 + GZ1) / 2, garage);
    k.box(38.6, 0.6, GZ1 - GZ0 + 0.6, 37, GH + 0.3, (GZ0 + GZ1) / 2, dark);
    const fins: T.Matrix4[] = [];
    for (let z = GZ0 + 0.5; z < GZ1; z += 1.0) fins.push(mat(17.3, GH / 2 + 1, z, 0, 1, 1, 1, 0, 0.0));
    for (let x = 18.5; x < 56; x += 1.0) fins.push(mat(x, GH / 2 + 1, GZ0 - 0.7, PI / 2));
    k.instances(new T.BoxGeometry(0.12, GH - 3, 0.7), finM, fins);
    k.block(16.8, 56.5, GZ0 - 1, GZ1);
    k.sign('DSNY  ·  MANHATTAN DISTRICTS 1  2  5  GARAGE', 12, 0.7, 17.2, 5.0, 26, '#1c1f24', '#f0f0ea', 70, -PI / 2, { border: true });
    // the shed: a base of concrete walls with the truck door, and the crystal folded over it
    const BX0 = 17, BX1 = 53, BZ = 17, BH = 6.2;
    k.box(BX1 - BX0, 0.3, 2 * BZ, (BX0 + BX1) / 2, -0.15, 0, floorT);
    for (const [z0, z1] of [[-BZ, -4], [4, BZ]]) { k.box(0.4, BH, z1 - z0, BX0, BH / 2, (z0 + z1) / 2, base); k.block(BX0 - 0.3, BX0 + 0.3, z0, z1); }
    k.box(0.4, BH - 5.2, 8.4, BX0, 5.2 + (BH - 5.2) / 2, 0, base);
    k.box(0.6, 0.3, 8.6, BX0, 5.2, 0, steel);
    for (const z of [-4.1, 4.1]) k.box(0.5, 5.3, 0.2, BX0, 2.65, z, steel);
    for (const s of [-1, 1]) { k.box(BX1 - BX0, BH, 0.4, (BX0 + BX1) / 2, BH / 2, s * BZ, base); k.block(BX0, BX1, s > 0 ? BZ - 0.3 : -BZ - 0.3, s > 0 ? BZ + 0.3 : -BZ + 0.3); }
    k.box(0.4, BH, 2 * BZ, BX1, BH / 2, 0, base); k.block(BX1 - 0.3, BX1 + 0.3, -BZ, BZ);
    k.sign('SPRING STREET SALT SHED  ·  DSNY', 6.4, 0.5, BX0 - 0.22, 5.75, 0, 'transparent', '#f0f0ea', 70, -PI / 2);
    const pts: T.Vector3[] = [];
    for (const s of [-1, 1]) {
      pts.push(v(BX0 - 0.6, BH, s * (BZ + 0.6)), v(BX1 + 0.6, BH, s * (BZ + 0.6)), v(35, BH, s * (BZ + 1.2)));
      pts.push(v(13.5, 13, s * 19.5), v(56.5, 13, s * 19.5), v(35, 14, s * 21), v(24, 13.5, s * 20.2), v(46, 13.5, s * 20.2));
      pts.push(v(19, 19, s * 10), v(51, 19, s * 10), v(35, 20, s * 12));
    }
    pts.push(v(12.5, 14, -3), v(57.5, 13.5, 4), v(24, 24, -4), v(46, 23.5, 3), v(33, 28.5, -1), v(28, 22.5, 7), v(43, 22, -7), v(38, 26.5, 4));
    const hull = new ConvexGeometry(pts);
    const pa = hull.attributes.position, keep: number[] = [];
    for (let i = 0; i < pa.count; i += 3) {
      const a = v(pa.getX(i), pa.getY(i), pa.getZ(i)), b = v(pa.getX(i + 1), pa.getY(i + 1), pa.getZ(i + 1)), c = v(pa.getX(i + 2), pa.getY(i + 2), pa.getZ(i + 2));
      const n = b.clone().sub(a).cross(c.clone().sub(a));
      if (n.y > -0.9 * n.length()) keep.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    }
    const shell = new T.BufferGeometry();
    shell.setAttribute('position', new T.Float32BufferAttribute(keep, 3));
    shell.computeVertexNormals();
    k.mesh(shell, conc, 0, 0, 0);
    // the inside skin is the same hull wound the other way, so it is a true front face for every pass, the occlusion pass included
    const inner = new T.BufferGeometry();
    const flipped: number[] = [];
    for (let i = 0; i < keep.length; i += 9) flipped.push(keep[i], keep[i + 1], keep[i + 2], keep[i + 6], keep[i + 7], keep[i + 8], keep[i + 3], keep[i + 4], keep[i + 5]);
    inner.setAttribute('position', new T.Float32BufferAttribute(flipped, 3));
    inner.computeVertexNormals();
    k.mesh(inner, concIn, 0, 0, 0);
    // the salt: the mountain, the grains that keep sliding, the loader, the plow blades against the wall
    const CX = 36, CZ = -1, CR = 11, CH = 9;
    k.mesh(new T.ConeGeometry(CR, CH, 30, 1), saltM, CX, CH / 2, CZ);
    k.keepOut.push({ x: CX, z: CZ, r: CR + 0.5 });
    const grainsN = 320, grains = k.instances(new T.SphereGeometry(0.09, 5, 4), grain, Array.from({ length: grainsN }, () => new T.Matrix4()));
    const gr = X.mulberry(481), gs = Array.from({ length: grainsN }, () => ({ a: PI + (gr() - 0.5) * 1.6, u: gr(), sp: 0.05 + gr() * 0.08 }));
    const placeGrains = (t: number) => { const mm = new T.Matrix4(); gs.forEach((g, i) => { const u = (g.u + t * g.sp) % 1; mm.compose(v(CX + Math.cos(g.a) * (CR * u + 0.4), CH * (1 - u) + 0.12, CZ + Math.sin(g.a) * (CR * u + 0.4)), new T.Quaternion(), v(1, 1, 1)); grains.setMatrixAt(i, mm); }); grains.instanceMatrix.needsUpdate = true; };
    placeGrains(0);
    if (!ctx.reduced) k.ticks.push((t) => placeGrains(t));
    for (let i = 0; i < 40; i++) { const r = X.mulberry(482 + i); k.sphere(0.5 + r() * 0.9, CX + Math.cos(r() * PI * 2) * (CR + 0.6 + r() * 1.4), 0.1, CZ + Math.sin(r() * PI * 2) * (CR + 0.6 + r() * 1.4), saltM, 7); }
    const LX = 27, LZ = -13;
    k.box(2.6, 1.6, 4.6, LX, 1.6, LZ, yellow); k.box(2.2, 1.6, 1.8, LX, 3.2, LZ - 0.4, glassDark); k.box(2.3, 0.15, 1.9, LX, 4.05, LZ - 0.4, yellow);
    k.box(0.4, 0.4, 3.0, LX, 1.4, LZ + 3.6, yellow); k.box(3.2, 1.3, 1.2, LX, 0.8, LZ + 5.4, steel);
    for (const [dx, dz] of [[-1.3, 1.4], [1.3, 1.4], [-1.3, -1.4], [1.3, -1.4]]) { const w = k.cyl(0.8, 0.6, LX + dx, 0.8, LZ + dz, rubber, 0.8, 14); w.rotation.z = PI / 2; }
    k.box(0.5, 0.12, 0.2, LX, 4.2, LZ + 0.6, orange);
    const beacon = k.mesh(new T.SphereGeometry(0.14, 8, 6), k.glow(0xffa020), LX, 4.32, LZ + 0.6, true);
    if (!ctx.reduced) k.ticks.push((t) => { beacon.visible = Math.sin(t * 6) > 0; });
    k.keepOut.push({ x: LX, z: LZ + 1.2, r: 2.8 });
    for (let i = 0; i < 4; i++) { const x = 30 + i * 4.2; const bl = k.mesh(new T.CylinderGeometry(1.3, 1.3, 3.4, 12, 1, true, 0, PI * 0.5), k.flat(0xf2b230, 0.2, 0.5, { side: T.DoubleSide }), x, 1.7, -BZ + 1.1); bl.rotation.set(0.2, -PI * 0.6, PI / 2); k.keepOut.push({ x, z: -BZ + 1.1, r: 1.5 }); }
    k.box(1.2, 1.0, 2.6, 19.2, 0.5, 15.0, orange); k.box(1.2, 1.0, 2.6, 20.6, 0.5, 15.0, orange); k.keepOut.push({ x: 19.9, z: 15.2, r: 1.4 });
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; k.point(CX + Math.cos(a) * 15.5, 4.6, CZ + Math.sin(a) * 14.5, 0xffc890, 16, 12); }
    for (const [x, z] of [[26, -8], [46, 8], [36, 12]]) k.point(x, 16, z, 0xdfe8ff, 30, 30);
    for (const z of [-9, 9]) { k.box(0.4, 0.3, 0.6, BX0 - 0.3, 5.4, z, dark); k.point(BX0 - 1.2, 5.2, z, 0xffc070, 26, 18); }
    k.sign('"SALT"', 2.0, 0.5, BX0 + 0.24, 5.6, 0, 'transparent', '#f0f0ea', 130, PI / 2);
    // the river life: gulls over the water, the spreader rolling down West Street, walkers on the bikeway
    const gulls: T.Mesh[] = [];
    for (let i = 0; i < 9; i++) { const b = k.mesh(new T.ConeGeometry(0.16, 0.7, 4), gull, 0, 14, 0, true); b.rotation.x = PI / 2; gulls.push(b); }
    if (!ctx.reduced) k.ticks.push((t) => gulls.forEach((b, i) => { const a = t * 0.22 + i * 0.7, r = 26 + 10 * Math.sin(t * 0.1 + i); b.position.set(-40 + Math.cos(a) * r, 10 + 4 * Math.sin(t * 0.6 + i), Math.sin(a) * r * 1.4); b.rotation.y = -a; }));
    const truck = new T.Group();
    const tadd = (geo: T.BufferGeometry, m: T.Material, x: number, y: number, z: number) => { const o = new T.Mesh(geo, m); o.position.set(x, y, z); truck.add(o); return o; };
    tadd(new T.BoxGeometry(2.5, 2.4, 5.6), whiteM, 0, 2.0, -1.2); tadd(new T.BoxGeometry(2.5, 2.2, 2.2), whiteM, 0, 1.9, 2.8); tadd(new T.BoxGeometry(2.4, 0.9, 0.1), glassDark, 0, 2.3, 3.92);
    tadd(new T.BoxGeometry(2.6, 0.3, 5.8), orange, 0, 1.4, -1.2); tadd(new T.BoxGeometry(3.4, 1.1, 0.5), yellow, 0, 0.6, 4.4);
    { const wm = new T.InstancedMesh(new T.CylinderGeometry(0.5, 0.5, 0.35, 12), rubber, 6); [[-1.1, 2.3], [1.1, 2.3], [-1.1, -1.6], [1.1, -1.6], [-1.1, -3.2], [1.1, -3.2]].forEach(([dx, dz], i) => wm.setMatrixAt(i, mat(dx, 0.5, dz, 0, 1, 1, 1, 0, PI / 2))); wm.instanceMatrix.needsUpdate = true; truck.add(wm); }
    const tl = new T.Mesh(new T.BoxGeometry(0.3, 0.2, 0.3), k.glow(0xffa020)); tl.position.set(0, 3.1, 2.8); truck.add(tl);
    k.add(truck);
    k.rider(truck, k.spline([v(-6, 0, 100), v(-6, 0, -100), v(-2, 0, -108), v(6, 0, -100), v(6, 0, 100), v(2, 0, 108)], true), 7);
    if (!ctx.reduced) k.ticks.push((t) => { tl.visible = Math.sin(t * 5) > -0.2; });
    k.crowd([v(-18, 0, 90), v(-18, 0, -90)], 12, { seed: 483, speed: 1.6, spread: 1.6, animate: !ctx.reduced });
    k.crowd([v(13.5, 0, 80), v(13.5, 0, -80)], 8, { seed: 484, speed: 0.9, spread: 1.4, animate: !ctx.reduced });
    k.crowd([v(21, 0, -13), v(24, 0, -8), v(22, 0, 2), v(20, 0, 12)], 5, { seed: 485, speed: 0.3, spread: 1.0, animate: !ctx.reduced, colors: [0xf07a20, 0x24262c, 0xf07a20, 0x33477f] });
    // the hang: the promenade walls around the mountain, the crew wall as the census
    const mounts: Mount[] = [];
    for (const z of [-10.5, 10.5]) mounts.push(M(BX0 + 0.24, 3.5, z, BX0 + 5, z, 5.0, 2.6, 'steel', true));
    for (const x of [20, 25.5, 31, 36.5, 42, 47.5]) mounts.push(M(x, 3.5, BZ - 0.24, x, BZ - 5, 4.6, 2.6, 'steel', true));
    for (const x of [21, 39, 45, 50.4]) mounts.push(M(x, 3.5, -BZ + 0.24, x, -BZ + (x === 39 ? 4 : 5), 4.6, 2.6, 'steel', true));
    for (const z of [-14.4, -9.6, -4.8, 0, 4.8, 9.6, 14.4]) mounts.push(M(BX1 - 0.24, 3.5, z, BX1 - 5, z, 4.2, 2.6, 'steel', true));
    k.censusWall({ x: 30, y: 3.6, z: -BZ + 0.24, rotY: 0, cols: 14, rows: 4, tile: 0.5, gap: 0.05, start: ctx.wallStart(6800, 56), pieces: ctx.all, backing: dark });
    k.sign('THE CREW  ·  SPRING STREET  ·  NIGHT PLOW', 6, 0.44, 30, 5.65, -BZ + 0.24, 'transparent', '#f0f0ea', 64, 0);
    return { mounts, spawn: v(-14, 3, 0), look: v(35, 10, 0), eye: 3, bounds: [-21.6, BX1 - 0.6, -70, 70], style: 'steel' };
  },
};
