/* Rooms 42 to 46: the Cyclone, the Brooklyn Bridge walkway, the Panorama, inside the Statue, the Oyster Bar.
   Third set. New moves: rides along splines, crowds, walkable balconies, a city inside a room, a climb inside a figure. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront } from './f';

const PI = Math.PI;

/* ---------------- 42 THE CYCLONE ---------------- */
export const cyclone: RoomDef = {
  id: 'cyclone',
  name: 'The ride',
  area: 'THE CYCLONE',
  mood: 'Boardwalk summer',
  color: '#f2e6c8',
  description: 'The wooden coaster at Coney Island, the station, the lift hill, the first drop, and the works along the queue and the boardwalk. Press W to take the ride.',
  signatures: 'The white timber lattice, the lift hill and the plunging first drop, the low station under its roof, the boardwalk, the beach and the tall parachute tower beyond.',
  build(k, ctx) {
    k.sky({ top: 0x5f9ad8, horizon: 0xeef0ec, ground: 0x8a8478, fog: 0.0018, sun: { az: 3.4, el: 0.95, color: 0xfff6e6, size: 12 }, env: 1.0 });
    k.hemi(0xeef4ff, 0x6a6458, 1.0);
    k.sun(0xfff2dc, 2.6, 40, 90, -20, true, 120);
    const timber = k.pbr('cycloneTimber', X.planks(0xe6e1d4, 5, 81, 0.2), 0.7, { roughness: 0.8 }),
      timberD = k.pbr('cycloneTimberD', X.planks(0xc9c2b2, 4, 82, 0.3), 0.7),
      rail = k.flat(0x7a7d82, 0.85, 0.35),
      board = k.pbr('cyBoardwalk', X.boardwalk(0x8a6a48), 0.5),
      sand = k.pbr('cySand', X.concrete(0xd9c9a4, 41), 0.1, { roughness: 1 }),
      red = k.flat(0xc62828, 0.1, 0.5),
      yellow = k.flat(0xf1c531, 0, 0.55),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      glow = k.glow(0xfff0c8),
      steel = k.pbr('cySteel', X.steel(0x9aa0a6, true, 83), 0.6, { metalness: 0.8, roughness: 0.4 });
    // the ground: the lot, the boardwalk and the beach, the ocean
    k.box(220, 0.4, 160, 0, -0.2, -40, sand);
    k.box(220, 0.5, 14, 0, 0.05, 40, board);
    k.rail(0, 47, 220, dark, 1.1, 'x', 2.2);
    k.box(400, 0.3, 200, 0, -0.5, 160, k.pbr('cyBeach', X.concrete(0xe3d5b0, 42), 0.08));
    k.water({ y: -0.4, color: 0x3a6a7a, w: 600, d: 300, z: 300, amp: 1.4 });
    for (let x = -100; x <= 100; x += 24) k.lamp(x, 33, 5, dark, 0xffe0b0, 24);
    k.skyline({ z: -180, count: 28, spacing: 9, scale: 1.6, base: -1, seed: 108, lit: 0.2, glow: 0.4, tint: 0x9a8e86, rows: 1 });
    // the parachute jump, a lattice column with its crown of arms, and the wheel far along the boardwalk
    for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; k.beam(v(-120 + Math.cos(a) * 4, 0, -30 + Math.sin(a) * 4), v(-120 + Math.cos(a) * 1.2, 76, -30 + Math.sin(a) * 1.2), 0.12, red, 4); }
    for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; k.beam(v(-120, 76, -30), v(-120 + Math.cos(a) * 14, 70, -30 + Math.sin(a) * 14), 0.1, red, 4); }
    k.torus(14, 0.12, -120, 70, -30, red, 32).rotation.x = PI / 2;
    const wheel = k.torus(22, 0.5, 130, 26, -20, steel, 48);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; k.beam(v(130, 26, -20), v(130, 26 + Math.sin(a) * 22, -20 + Math.cos(a) * 22), 0.12, steel, 4); k.box(1.6, 1.8, 1.6, 130, 26 + Math.sin(a) * 22, -20 + Math.cos(a) * 22, i % 2 ? red : yellow); }
    for (const s of [-1, 1]) k.beam(v(130 + s * 4, 0, -20 - 12), v(130, 26, -20), 0.4, steel, 6);
    void wheel;
    // the track: a closed spline, lift hill along the far side, the drop, the return hills
    const P = [v(0, 3, 0), v(0, 3.4, -14), v(0, 27, -64), v(0, 6, -82), v(10, 4.5, -92), v(22, 11, -88), v(27, 5, -70), v(24, 15, -50), v(19, 4.5, -32), v(22, 12, -14), v(15, 4, 4), v(8, 6.5, 12), v(0, 3, 8)];
    const curve = k.spline(P, true, 0.45);
    const N = 520, pts = curve.getSpacedPoints(N);
    k.curve(pts, 0.14, rail, N, true);
    const tan = new T.Vector3(), side = new T.Vector3();
    const tieG = new T.BoxGeometry(2.6, 0.12, 0.28), ties: T.Matrix4[] = [];
    const q = new T.Quaternion(), up = new T.Vector3(0, 1, 0), m4 = new T.Matrix4();
    for (let i = 0; i < N; i += 2) {
      const p = pts[i]; curve.getTangentAt(i / N, tan);
      const yaw = Math.atan2(tan.x, tan.z), pitch = -Math.asin(T.MathUtils.clamp(tan.y, -1, 1));
      q.setFromEuler(new T.Euler(pitch, yaw, 0, 'YXZ'));
      ties.push(m4.clone().compose(p.clone().add(v(0, -0.16, 0)), q, new T.Vector3(1, 1, 1)));
      side.set(Math.cos(yaw), 0, -Math.sin(yaw));
      if (i % 4 === 0) { for (const sgn of [-1, 1]) k.curve([p.clone().addScaledVector(side, sgn * 0.75), pts[Math.min(N, i + 4)].clone().addScaledVector(side, sgn * 0.75)], 0.06, rail, 2); }
    }
    k.instances(tieG, timberD, ties);
    // the lattice under the track: paired posts every few metres, ledgers and cross bracing between bents
    const bents: T.Vector3[][] = [];
    for (let i = 0; i < N; i += 6) {
      const p = pts[i]; curve.getTangentAt(i / N, tan); side.set(tan.z, 0, -tan.x).normalize();
      const pair = [p.clone().addScaledVector(side, 1.3), p.clone().addScaledVector(side, -1.3)];
      for (const b of pair) { k.beam(v(b.x, 0, b.z), v(b.x, b.y - 0.3, b.z), 0.11, timber, 4); }
      k.beam(v(pair[0].x, p.y - 0.4, pair[0].z), v(pair[1].x, p.y - 0.4, pair[1].z), 0.09, timber, 4);
      for (let y = 3; y < p.y - 2; y += 4) k.beam(v(pair[0].x, y, pair[0].z), v(pair[1].x, y, pair[1].z), 0.07, timber, 4);
      bents.push(pair);
    }
    for (let i = 1; i < bents.length; i++) {
      const a = bents[i - 1], b = bents[i];
      const h = Math.min(a[0].y, b[0].y) - 1;
      for (let y = 0; y < h; y += 5) { k.beam(v(a[0].x, y, a[0].z), v(b[0].x, Math.min(y + 5, h), b[0].z), 0.06, timber, 3); k.beam(v(a[1].x, Math.min(y + 5, h), a[1].z), v(b[1].x, y, b[1].z), 0.06, timber, 3); }
    }
    for (const b of bents) for (const c of b) k.keepOut.push({ x: c.x, z: c.z, r: 0.5 });
    // the train: three cars, gravity in the speed, a rider on the curve
    const train = new T.Group();
    for (let c = 0; c < 3; c++) {
      const car = new T.Group();
      const bodyM = new T.Mesh(new T.BoxGeometry(1.7, 0.7, 2.6), c % 2 ? red : k.flat(0x1e56b4, 0.1, 0.5)); bodyM.position.y = 0.35; car.add(bodyM);
      const nose = new T.Mesh(new T.BoxGeometry(1.4, 0.4, 0.6), yellow); nose.position.set(0, 0.5, 1.5); car.add(nose);
      for (const dz of [-0.6, 0.5]) { const seat = new T.Mesh(new T.BoxGeometry(1.5, 0.5, 0.5), dark); seat.position.set(0, 0.95, dz - 0.3); car.add(seat); }
      car.position.z = -c * 2.9;
      train.add(car);
    }
    k.add(train);
    train.traverse((o) => { if (o instanceof T.Mesh) o.castShadow = ctx.quality === 'high'; });
    if (!ctx.reduced) k.rider(train, curve, (y) => (y > 20 && train.position.z < -40 ? 5 : Math.max(5, Math.sqrt(2 * 9.8 * Math.max(0.5, 28 - y)) * 0.75)), 6);
    // the station: a low shed over the loading straight, queue rails, the sign
    k.box(12, 0.3, 22, 0, 2.45, 0, board);
    for (const x of [-5.6, 5.6]) for (const z of [-10, -3, 4, 10]) k.box(0.3, 7.2, 0.3, x, 6.1, z, timber);
    k.box(13, 0.4, 24, 0, 9.9, 0, timberD);
    k.box(0.4, 7.4, 24, -6, 6.2, 0, timber);
    k.block(-6.3, -5.7, -12, 12);
    k.block(-6, 6, 11.6, 12.4);
    k.box(12, 7.4, 0.4, 0, 6.2, 12, timber);
    k.sign('CYCLONE', 6.4, 1.4, 0, 11.2, 12.2, '#c62828', '#fff3d0', 130, 0, { border: true });
    k.sign('CYCLONE', 6.4, 1.4, 0, 11.2, -12.2, '#c62828', '#fff3d0', 130, PI, { border: true });
    for (let i = 0; i < 6; i++) { k.rail(9 + i * 1.6, 12, 14, rail, 1.0, 'z', 3.5); }
    k.censusWall({ x: -5.78, y: 4.6, z: 0, rotY: PI / 2, cols: 30, rows: 3, tile: 0.6, gap: 0.05, start: ctx.wallStart(2100, 90), pieces: ctx.all, backing: dark });
    k.point(0, 8.6, -6, 0xfff0d0, 20, 14); k.point(0, 8.6, 6, 0xfff0d0, 20, 14);
    // people in the queue and on the boardwalk
    k.crowd([v(18, 0, 18), v(12, 0, 20), v(9.5, 0, 12), v(9.5, 0, 6)], 14, { seed: 42, speed: 0.4, spread: 0.8, animate: !ctx.reduced });
    k.crowd([v(-100, 0.3, 40), v(-40, 0.3, 39), v(0, 0.3, 41), v(50, 0.3, 39), v(100, 0.3, 40)], 40, { seed: 43, speed: 1.1, spread: 6, animate: !ctx.reduced });
    k.prop('hydrant', -14, 0, 20, { height: 1.1 });
    k.prop('life_ring', 3, 1.7, 46.4, { height: 0.9 });
    // the works: the station's platform wall, the queue fence panels, the boardwalk billboards, the lattice bases
    const mounts: Mount[] = [];
    for (let i = 0; i < 6; i++) { const z = -9 + i * 3.6; mounts.push({ position: v(5.78, 4.4, z), rotation: -PI / 2, target: v(1, 4, z), width: 3.0, height: 1.8, style: 'white', wash: false }); k.box(0.1, 2.2, 3.3, 5.9, 4.4, z, timberD); }
    for (let i = 0; i < 6; i++) { const z = -8 + i * 3.6; k.box(0.14, 2.4, 3.2, 17.7, 1.6, z, timberD); mounts.push({ position: v(17.6, 1.7, z), rotation: PI / 2, target: v(12, 2, z), width: 2.8, height: 1.7, style: 'white', wash: false }); }
    for (let i = 0; i < 6; i++) { const x = -60 + i * 24; k.box(5, 3.4, 0.4, x, 3.4, 47.3, dark); for (const dx of [-2.2, 2.2]) k.box(0.2, 5, 0.2, x + dx, 2.5, 47.3, dark); mounts.push({ position: v(x, 3.5, 47.05), rotation: PI, target: v(x, 3, 40), width: 4.6, height: 2.7, style: 'black', wash: false }); }
    for (const [x, z] of [[-4, -30], [-4, -50], [30, -60], [30, -40]]) { k.box(0.3, 3, 4.6, x, 1.9, z, timber); mounts.push({ position: v(x + (x < 0 ? -0.2 : 0.2), 2.0, z), rotation: x < 0 ? -PI / 2 : PI / 2, target: v(x < 0 ? -12 : 40, 2, z), width: 4.2, height: 2.5, style: 'white', wash: false }); }
    // the ride as the route: every point sits at a rider's eye above the rail
    const path = pts.map((p) => p.clone().add(v(0, 1.25, 0)));
    return { mounts, spawn: path[0].clone(), look: v(0, 12, -50), eye: 1.25, bounds: [-40, 40, -100, 30], path, style: 'white' };
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
    const granite = k.pbr('bbGranite', X.ashlar(0xa89c88, 84, 3), 0.2, { roughness: 0.85 }),
      plank = k.pbr('bbPlank', X.boardwalk(0x9a7a56), 0.4),
      cable = k.flat(0x3a3a3c, 0.6, 0.55),
      iron = k.flat(0x24262a, 0.75, 0.45),
      asphalt = k.pbr('bbRoad', X.asphalt(0x2a2d31), 0.11),
      glass = k.glass(0x9fc4d8, 0.35, 0.08),
      warm = k.glow(0xffd8a0);
    const TZ = [-70, 210];    // the two towers along z; the visitor works the Manhattan half
    const DECK = 0, ROAD = -3.6, RIVER = -38;
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
      k.box(34, 14, 14, 0, RIVER + 84 - 7, tz, granite);
      k.box(36, 2, 16, 0, RIVER + 85, tz, granite);
      k.box(34, 4, 14, 0, DECK - 6, tz, granite);
      for (const s of [-1, 1]) { k.arch(9, 22, 14, s * 7 + s * -1.5 * 0, DECK + 0, tz, granite, true, 0.8); }
      k.box(2.4, 84, 14, 0, RIVER + 42, tz, granite);
      for (const s of [-1, 1]) k.box(4, 3, 4, s * 12, RIVER + 87, tz, iron);
      k.block(-17, -7, tz - 7.2, tz + 7.2);
      k.block(-1.3, 1.3, tz - 7.2, tz + 7.2);
      k.block(7, 17, tz - 7.2, tz + 7.2);
    }
    // the deck: two roadways at ROAD, the promenade raised on its trusses between them
    for (const s of [-1, 1]) { k.box(11, 0.6, 400, s * 9.5, ROAD - 0.3, 70, asphalt); for (const dx of [-0.14, 0.14]) k.box(0.1, 0.012, 380, s * 9.5 + dx, ROAD + 0.01, 70, k.flat(0xe6a626, 0, 0.6)); }
    k.box(6.4, 0.3, 400, 0, DECK - 0.15, 70, plank);
    for (let z = -140; z <= 280; z += 4) { k.box(6.6, 0.3, 0.3, 0, DECK - 0.45, z, iron); k.box(0.24, 3.6, 0.24, -3.4, ROAD + 1.8, z, iron); k.box(0.24, 3.6, 0.24, 3.4, ROAD + 1.8, z, iron); }
    for (const s of [-1, 1]) { k.rail(s * 3.1, 70, 400, iron, 1.05, 'z', 2); k.box(0.06, 0.06, 400, s * 3.1, DECK + 0.6, 70, iron); }
    k.box(50, 1.4, 400, 0, ROAD - 1.3, 70, k.pbr('bbTruss', X.steel(0x2e3236, true, 86), 0.5, { metalness: 0.7 }));
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
    for (const tz of TZ) for (const x of [-15.5, -8.5, 8.5, 15.5]) for (let i = 1; i <= 12; i++) { for (const d of [-1, 1]) k.beam(v(x, RIVER + 82, tz), v(x, ROAD, tz + d * i * 9), 0.03, cable, 3); }
    // lamps, benches, the pedestrians, traffic on both roadways
    for (let z = -130; z <= 200; z += 22) for (const s of [-1, 1]) k.lamp(s * 2.7, z, 3.8, iron, 0xffd9a8, 22);
    for (let z = -120; z <= 40; z += 40) k.bench(-2.2, z, PI / 2, plank, iron, 2.0);
    k.crowd([v(0.6, DECK, -150), v(0.8, DECK, -60), v(0.6, DECK, 40), v(0.8, DECK, 150)], 36, { seed: 44, speed: 1.2, spread: 2.6, animate: !ctx.reduced });
    const carG = new T.BoxGeometry(1.8, 1.4, 4.2), cars: T.Object3D[] = [];
    const carCols = [0xd8d0c0, 0x1a1a1a, 0xc62828, 0x2b4a8a, 0xf1c531, 0x6a6a6e];
    for (let i = 0; i < 28; i++) { const s = i % 2 ? 1 : -1; const c = new T.Mesh(carG, k.flat(carCols[i % carCols.length], 0.4, 0.4)); c.position.set(s * (9.5 + (i % 4 < 2 ? -2.4 : 2.4)), ROAD + 0.7, -150 + (i * 31) % 420); c.userData.s = s; c.userData.v = 9 + (i % 5) * 1.5; k.add(c); cars.push(c); const lamp = new T.Mesh(new T.BoxGeometry(1.4, 0.2, 0.1), warm); lamp.position.set(0, 0, s * 2.1); c.add(lamp); }
    if (!ctx.reduced) k.ticks.push((_t, dt) => { for (const c of cars) { c.position.z += c.userData.s * c.userData.v * Math.min(dt, 0.1); if (c.position.z > 290) c.position.z = -150; if (c.position.z < -150) c.position.z = 290; } });
    for (const z of [-40, 60, 160]) { const boat = new T.Group(); const hull = new T.Mesh(new T.BoxGeometry(6, 2.2, 22), k.flat(0xe6e2da, 0.2, 0.6)); hull.position.y = 1; boat.add(hull); const cab = new T.Mesh(new T.BoxGeometry(4, 2.4, 8), k.flat(0xd84a2a, 0.2, 0.6)); cab.position.set(0, 3.2, 0); boat.add(cab); k.add(boat); if (!ctx.reduced) k.rider(boat, k.spline([v(-120, RIVER + 0.3, z), v(0, RIVER + 0.3, z + 40), v(120, RIVER + 0.3, z), v(0, RIVER + 0.3, z - 40)], true), 3.2, z); }
    k.censusWall({ x: -3.22, y: 1.6, z: -30, rotY: PI / 2, cols: 40, rows: 2, tile: 0.55, gap: 0.05, start: ctx.wallStart(3000, 80), pieces: ctx.all, backing: iron });
    k.sign('BROOKLYN BRIDGE  ·  1883', 8, 0.8, 0, DECK + 5.4, TZ[0] + 7.3, '#2a2622', '#e8dcc0', 80, 0, { border: true });
    // the works: the Manhattan tower's arch piers on both faces, lamp banners along the walk, rail panels
    const mounts: Mount[] = [];
    for (const dz of [-7.3, 7.3]) for (const x of [-12, 12]) mounts.push({ position: v(x, 3.6, TZ[0] + dz + (dz > 0 ? 0.02 : -0.02)), rotation: dz > 0 ? 0 : PI, target: v(x * 0.4, 3, TZ[0] + dz * 2), width: 4.2, height: 2.5, style: 'steel', wash: false });
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
    const wall = k.pbr('qmWall', X.plaster(0x2a2c30, 43), 0.3, { roughness: 0.9 }),
      floor = k.pbr('qmFloor', X.terrazzo(0x3a3a3c, 44), 0.35, { roughness: 0.4 }),
      glass = k.glass(0xdcecf6, 0.12, 0.04),
      steel = k.flat(0x8c98a4, 0.9, 0.3),
      dark = k.flat(0x121316, 0.4, 0.7),
      waterM = k.flat(0x24485e, 0.2, 0.3, { emissive: 0x0a2233, emissiveIntensity: 0.6 }),
      landM = k.flat(0x8a8a80, 0, 0.9),
      parkM = k.flat(0x4a6a3a, 0, 0.9),
      bldg = k.flat(0xd8d4cc, 0, 0.8),
      glowCity = k.glow(0xffd090, 1);
    const HW = 64, HD = 46, HH = 13;
    // the hall
    k.box(HW, 0.4, HD, 0, -0.2, 0, floor);
    for (const s of [-1, 1]) { k.box(0.6, HH, HD, s * HW / 2, HH / 2, 0, wall); k.block(s * HW / 2 - 0.5, s * HW / 2 + 0.5, -HD / 2, HD / 2); }
    k.box(HW, HH, 0.6, 0, HH / 2, -HD / 2, wall);
    k.block(-HW / 2, HW / 2, -HD / 2 - 0.5, -HD / 2 + 0.5);
    k.box(HW, 0.6, HD, 0, HH, 0, dark);
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
      if (inside([[-1.6, -7.5], [0.9, -7.2], [0.7, -1.5], [-1.4, -1.8]], x, z)) continue;
      const mid = inM && ((z > -3 && z < 3) || z > 5);
      const h = inM ? (mid ? 0.5 + rnd() * 2.4 : 0.15 + rnd() * 0.6) : 0.08 + rnd() * 0.25;
      towers.push(new T.Matrix4().compose(v(x + (rnd() - 0.5) * 0.1, TY + 0.2, z + (rnd() - 0.5) * 0.1), new T.Quaternion(), v(1, h, 1)));
      if (rnd() < 0.12) glows.push(new T.Matrix4().compose(v(x, TY + 0.2 + h + 0.01, z), new T.Quaternion(), v(0.6, 0.03, 0.6)));
    }
    k.instances(unit, bldg, towers);
    const cityGlow = k.instances(new T.BoxGeometry(0.22, 1, 0.22), glowCity, glows);
    for (const [x, z, h] of [[0.6, 1.2, 3.6], [-0.4, 8.2, 3.4], [1.2, -0.6, 2.8], [0.2, 2.4, 2.9]]) k.box(0.3, h, 0.3, x, TY + 0.2 + h / 2, z, bldg);
    for (const [x0, z0, x1, z1] of [[0.8, 7.6, 3.6, 8.2], [1.2, 6.2, 3.8, 6.6], [1.8, 0.6, 3.4, 1.4], [-2.4, -6, -5, -6.4], [1.9, -3.4, 3.2, -3.6]]) k.beam(v(x0, TY + 0.4, z0), v(x1, TY + 0.4, z1), 0.04, steel, 3);
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
    for (let i = 0; i < 12; i++) { for (const s of [-1, 1]) k.box(RW, 0.2, 1.0, s * (R0x + RW / 2), (i + 0.5) * (RY / 12), HD / 2 - 2 - i * 1.0, floor); }
    const ramp = (x: number, z: number) => { if (Math.abs(Math.abs(x) - (R0x + RW / 2)) < RW / 2 && z > HD / 2 - 14 && z < HD / 2 - 1.5) return T.MathUtils.clamp((HD / 2 - 1.5 - z) / 12.5, 0, 1) * RY; return -1; };
    const onRing = (x: number, z: number) => (Math.abs(x) > R0x && Math.abs(x) < R0x + RW && Math.abs(z) < R0z + RW) || (Math.abs(z) > R0z && Math.abs(z) < R0z + RW && Math.abs(x) < R0x + RW);
    // the works: the hall walls above the walkway, and the glass panels on the inside of the ring
    const mounts: Mount[] = [];
    for (let i = 0; i < 5; i++) { const x = -24 + i * 12; mounts.push({ position: v(x, RY + 4.4, -HD / 2 + 0.34), rotation: 0, target: v(x, RY + 3, -HD / 2 + 8), width: 5.2, height: 3.0, style: 'black', wash: true }); }
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = -15 + i * 10; mounts.push({ position: v(s * (HW / 2 - 0.34), RY + 4.4, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * (HW / 2 - 8), RY + 3, z), width: 5.2, height: 3.0, style: 'black', wash: true }); }
    for (let i = 0; i < 5; i++) { const x = -20 + i * 10; k.box(2.8, 1.7, 0.1, x, RY + 1.9, R0z + 0.3, dark); mounts.push({ position: v(x, RY + 1.9, R0z + 0.24), rotation: PI, target: v(x, RY + 2, R0z + 3), width: 2.6, height: 1.5, style: 'steel', wash: false }); }
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const z = -8 + i * 16; k.box(0.1, 1.7, 2.8, s * (R0x + 0.3), RY + 1.9, z, dark); mounts.push({ position: v(s * (R0x + 0.24), RY + 1.9, z), rotation: s < 0 ? -PI / 2 : PI / 2, target: v(s * (R0x + 3), RY + 2, z), width: 2.6, height: 1.5, style: 'steel', wash: false }); }
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
    k.sky({ top: 0x2a2a30, horizon: 0x3a3630, ground: 0x1a1a1c, fog: 0.004, env: 0.5 });
    k.hemi(0xffe4c0, 0x2a2018, 0.5);
    const tile = k.pbr('guastavino', X.brick(0xcbb894, 92), 0.16, { roughness: 0.55, stretch: 0.5 }),
      tileD = k.pbr('guastavinoD', X.brick(0xa89466, 93), 0.16, { roughness: 0.6 }),
      floorT = k.pbr('obFloor', X.terrazzo(0xb8a890, 49), 0.35, { roughness: 0.35 }),
      marble = k.pbr('obCounter', X.marble(0xe8e4dc, 0x9a948a, 10), 0.6, { roughness: 0.25 }),
      wood = k.pbr('obWood', X.planks(0x4a2e1c, 5, 94), 1.2, { roughness: 0.5 }),
      cloth = k.pbr('obCloth', X.velvet(0xb8202a), 0.3, { roughness: 0.95 }),
      white = k.flat(0xf4f0e8, 0, 0.8),
      chrome = k.flat(0xc9ccd0, 0.9, 0.25),
      brass = k.pbr('obBrass', X.gilt(0xc9a55a), 2, { metalness: 0.85, roughness: 0.3 }),
      neon = k.glow(0xff4a3a),
      ice = k.flat(0xdff2ff, 0.1, 0.3, { transparent: true, opacity: 0.8 }),
      shell = k.flat(0xd8d0c0, 0.1, 0.5),
      dark = k.flat(0x1a1a1c, 0.5, 0.6);
    const W = 44, D = 34, H = 7.2;
    // floor and the enclosing walls
    k.box(W + 40, 0.4, D + 40, 0, -0.2, -4, floorT);
    for (const s of [-1, 1]) { k.box(0.6, H, D, s * W / 2, H / 2, -D / 2, tileD); k.block(s * W / 2 - 0.5, s * W / 2 + 0.5, -D, 0); }
    k.box(W, H, 0.6, 0, H / 2, -D, tileD);
    k.block(-W / 2, W / 2, -D - 0.5, -D + 0.5);
    // the vaults: a grid of low tile domes on piers, four by three bays
    const bays: [number, number][] = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) bays.push([-16.5 + i * 11, -5.5 - j * 11]);
    for (const [bx, bz] of bays) {
      const dome = k.mesh(new T.SphereGeometry(7.8, 24, 10, 0, PI * 2, 0, PI / 2), tile, bx, H - 4.2, bz);
      dome.scale.set(1, 0.55, 1);
      (dome.material as T.Material).side = T.BackSide;
      for (const s of [-1, 1]) { k.box(0.5, 0.5, 11, bx + s * 5.5, H - 0.4, bz, tileD); k.box(11, 0.5, 0.5, bx, H - 0.4, bz + s * 5.5, tileD); }
      k.point(bx, H - 1.8, bz, 0xffe0b8, 22, 12);
    }
    for (let i = 0; i <= 4; i++) for (let j = 0; j <= 3; j++) { const x = -22 + i * 11, z = -j * 11; if (Math.abs(x) >= W / 2 - 1 || z <= -D + 1) continue; k.column(x, 0, z, H - 0.5, 0.55, tileD, false); k.keepOut.push({ x, z, r: 0.8 }); }
    k.box(W, 0.3, D, 0, H, -D / 2, dark);
    // the ramp down from the concourse and the whispering gallery crossing
    for (let i = 0; i < 14; i++) k.box(10, 0.22, 1.4, 0, 0.22 * i + 0.11, 4 + i * 1.4, floorT);
    for (let i = 0; i < 4; i++) { const g = k.mesh(new T.SphereGeometry(6, 24, 10, i * PI / 2, PI / 2, 0, PI / 2), tile, 0, 7.4, 6); g.scale.set(1, 0.7, 1); (g.material as T.Material).side = T.BackSide; }
    for (const s of [-1, 1]) { k.box(0.6, 9, 22, s * 5.5, 4.5, 12, tileD); k.block(s * 5.5 - 0.5, s * 5.5 + 0.5, 0, 24); }
    k.box(12, 0.5, 22, 0, 9.4, 12, dark);
    k.point(0, 7, 14, 0xffe0b8, 20, 12);
    k.sign('OYSTER BAR', 6, 1.0, 0, 5.2, -0.1, 'transparent', '#ff5a4a', 120, PI);
    k.box(6.4, 1.2, 0.08, 0, 5.2, 0, dark);
    k.mesh(new T.BoxGeometry(6.2, 0.06, 0.06), neon, 0, 4.6, -0.12);
    k.mesh(new T.BoxGeometry(6.2, 0.06, 0.06), neon, 0, 5.8, -0.12);
    k.point(0, 4.4, -1.4, 0xff6a5a, 18, 10);
    // counters: two U shaped lunch counters with stools, the raw bar with ice and shells, the tables
    const counter = (cx: number, cz: number) => {
      k.box(9, 1.1, 0.9, cx, 0.55, cz, wood); k.box(9.2, 0.1, 1.1, cx, 1.12, cz, marble);
      for (const s of [-1, 1]) { k.box(0.9, 1.1, 6, cx + s * 4.05, 0.55, cz - 3, wood); k.box(1.1, 0.1, 6.2, cx + s * 4.05, 1.12, cz - 3, marble); }
      k.block(cx - 4.6, cx + 4.6, cz - 0.5, cz + 0.5); k.block(cx - 4.6, cx - 3.5, cz - 6, cz); k.block(cx + 3.5, cx + 4.6, cz - 6, cz);
      for (let i = 0; i < 7; i++) { const x = cx - 3.6 + i * 1.2; k.cyl(0.06, 0.7, x, 0.35, cz + 1.0, chrome, 0.06, 8); k.cyl(0.24, 0.1, x, 0.75, cz + 1.0, cloth, 0.24, 12); k.keepOut.push({ x, z: cz + 1.0, r: 0.3 }); }
      for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = cz - 1.2 - i * 1.3; k.cyl(0.06, 0.7, cx + s * 5.1, 0.35, z, chrome, 0.06, 8); k.cyl(0.24, 0.1, cx + s * 5.1, 0.75, z, cloth, 0.24, 12); k.keepOut.push({ x: cx + s * 5.1, z, r: 0.3 }); }
      k.box(8.6, 0.5, 0.8, cx, 1.4, cz - 3.2, ice);
      for (let i = 0; i < 40; i++) { const a = X.mulberry(46 + i)(); k.sphere(0.07, cx - 4 + (i % 20) * 0.42, 1.7, cz - 3.5 + Math.floor(i / 20) * 0.5 + a * 0.2, shell, 6); }
      for (const dx of [-3.2, 0, 3.2]) k.point(cx + dx, 3.2, cz, 0xffe8c8, 12, 6);
    };
    counter(-11, -14); counter(11, -14);
    const rnd = X.mulberry(46);
    for (let i = 0; i < 14; i++) { const x = -18 + (i % 7) * 6, z = -26 - Math.floor(i / 7) * 5; if (Math.abs(x) < 3) continue; k.cyl(0.06, 0.7, x, 0.35, z, chrome, 0.06, 8); k.box(1.4, 0.06, 1.4, x, 0.74, z, cloth).rotation.y = rnd() * 0.3; k.box(1.3, 0.02, 1.3, x, 0.78, z, white).rotation.y = 0.78; k.keepOut.push({ x, z, r: 0.9 }); for (const [dx, dz] of [[-0.9, 0], [0.9, 0]]) { k.box(0.45, 0.45, 0.45, x + dx, 0.45, z + dz, wood); k.box(0.45, 0.5, 0.06, x + dx * 1.2, 0.9, z + dz, wood); } }
    k.crowd([v(0, 0, 22), v(0, 0, 4), v(-6, 0, -6), v(-14, 0, -8), v(-20, 0, -20), v(-8, 0, -30), v(8, 0, -30), v(20, 0, -20)], 16, { seed: 46, speed: 0.5, spread: 1.2, animate: !ctx.reduced });
    k.censusWall({ x: 0, y: 3.6, z: -D + 0.34, rotY: 0, cols: 24, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(4600, 96), pieces: ctx.all, backing: dark });
    k.sign('TODAY  ·  BLUEPOINTS  ·  WELLFLEETS  ·  KUMAMOTOS  ·  PAN ROAST  ·  CHOWDER', 16, 0.7, 0, 6.2, -D + 0.34, '#1a1a1c', '#f4e8c8', 60, 0, { border: true });
    // the works: between the arches on both long walls, the ramp walls, over the counters on the piers
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = -5.5 - i * 11; mounts.push({ position: v(s * (W / 2 - 0.34), 3.6, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * (W / 2 - 8), 3, z), width: 4.4, height: 2.6, style: 'gilt', wash: true }); }
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = 6 + i * 6; mounts.push({ position: v(s * 5.16, 3.0, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 3, z), width: 3.2, height: 1.9, style: 'oak', wash: false }); }
    for (const x of [-22 + 11, 0, 22 - 11]) for (const z of [-11, -22]) { for (const s of [-1, 1]) { const zz = z + s * 0.65; mounts.push({ position: v(x, 3.4, zz), rotation: s > 0 ? 0 : PI, target: v(x, 3, z + s * 5), width: 1.2, height: 1.8, style: 'oak', wash: false }); } }
    for (const x of [-9, 9]) mounts.push({ position: v(x, 3.4, -D + 0.34), rotation: 0, target: v(x, 3, -D + 8), width: 3.2, height: 1.9, style: 'gilt', wash: true });
    return { mounts, spawn: v(0, 7.5, 22), look: v(0, 3, -10), eye: 3, bounds: [-W / 2 + 1, W / 2 - 1, -D + 1, 24], style: 'oak', floorY: (x, z) => { void x; if (z > 4 && z < 24) return Math.min(3.0, Math.max(0, (z - 4) / 20 * 3.0)); return 0; } };
  },
};
