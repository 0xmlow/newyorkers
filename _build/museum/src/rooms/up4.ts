/* Upgrade batch four (2026-09-24): the Apollo and Carnegie Hall, rebuilt.

   Nothing is overwritten: `apollo` still lives in d.ts and `carnegie` in n.ts, and
   rooms/index.ts imports these instead. Ids are unchanged.

   The Apollo had eighteen of its nineteen works unreachable. corridorMounts put
   every viewing spot at x = 9.2, and the seat blocks ran from the centre aisle to
   the wall, so there was no side aisle to stand in. The two stage flanks aimed at
   the seats too. The room had no street: no marquee, no 125th Street.

   Carnegie Hall had sixteen of its twenty unreachable. The ten works on the box
   fronts all aimed at (0, -28), inside the twelve metre keep out drawn round the
   stage; four more aimed into the blocked parquet. The facade was one solid brick
   box 60 metres on a side with the whole hall inside it, and 57th Street ran
   straight into the building instead of across its front. */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as X from '../textures';
import { v, type Mount } from '../kit';
import type { RoomDef } from './types';
const PI = Math.PI;
type K = Parameters<RoomDef['build']>[0];
const ONE = new T.Vector3(1, 1, 1);
const at = (x: number, y: number, z: number, ry = 0, s = ONE) => new T.Matrix4().compose(v(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(0, ry, 0)), s);

function personGroup(coat: number, skin = 0xc8a284) {
  const g = new T.Group();
  const b = new T.Mesh(new T.CapsuleGeometry(0.2, 0.82, 3, 8), new T.MeshStandardMaterial({ color: coat, roughness: 0.85 }));
  b.position.y = 0.61;
  const h = new T.Mesh(new T.SphereGeometry(0.125, 8, 6), new T.MeshStandardMaterial({ color: skin, roughness: 0.7 }));
  h.position.y = 1.35;
  g.add(b, h);
  return g;
}
/* Twenty four triangles a head, seated: for a full house seen from the aisle. */
function seatedBoxGeo() {
  const body = new T.BoxGeometry(0.38, 0.52, 0.28); body.translate(0, 0.26, 0);
  const head = new T.BoxGeometry(0.2, 0.22, 0.2); head.translate(0, 0.64, 0);
  return mergeGeometries([body, head])!;
}
/* Seated with a round head, for the few people a visitor stands close to. */
function seatedGeo() {
  const body = new T.CapsuleGeometry(0.19, 0.42, 3, 8); body.translate(0, 0.4, 0);
  const head = new T.SphereGeometry(0.12, 8, 6); head.translate(0, 0.92, 0);
  return mergeGeometries([body, head])!;
}
const COATS = [0x24262c, 0x8a3a3a, 0x33477f, 0xd8d0c0, 0x4a6a3a, 0x151517, 0xc9a25a, 0x6a4a8a, 0xe6e2da, 0x2b5f6e, 0x7a2a4a, 0x1f1f24];

/* A crosstown street along x in front of a facade that faces +z: the near
   sidewalk from zNear, the road, the far sidewalk, and a row of buildings
   across it with their windows lit. */
function crossStreet(k: K, zNear: number, len: number, seed: number, h: [number, number]) {
  const asphalt = k.pbr('csAsphalt', X.asphalt(0x24282d), 0.11, { roughness: 0.62, metalness: 0.12 }),
    pav = k.pbr('csWalk', X.pavers(0x8e8b84, 5), 0.42),
    granite = k.pbr('csCurb', X.ashlar(0x8a8a86, 4, 2), 0.35),
    white = k.flat(0xdedbd2, 0, 0.7),
    yellow = k.flat(0xe6a626, 0, 0.6);
  k.box(len, 0.28, 5.5, 0, 0, zNear + 2.75, pav);
  k.box(len, 0.3, 14, 0, -0.15, zNear + 12.5, asphalt);
  k.box(len, 0.28, 5.5, 0, 0, zNear + 22.25, pav);
  for (const z of [zNear + 5.55, zNear + 19.45]) k.box(len, 0.32, 0.3, 0, 0.02, z, granite);
  for (const dz of [-0.14, 0.14]) k.box(len - 6, 0.012, 0.09, 0, 0.01, zNear + 12.5 + dz, yellow);
  for (let x = -len / 2 + 4; x < len / 2 - 4; x += 6) for (const dz of [-3.5, 3.5]) k.box(3, 0.012, 0.12, x, 0.01, zNear + 12.5 + dz, white);
  const rnd = X.mulberry(seed);
  const win = k.pbr('csWin' + seed, X.windows(seed, 0.45, 0x2a3542, true), 0.11, { emissive: 0xffffff, emissiveIntensity: 0.9 + 1.4 * k.night, roughness: 0.4, metalness: 0.5, stretch: 0.42 }),
    bricks = [k.pbr('csBrickA', X.brick(0x6b4437, 21), 0.28), k.pbr('csBrickB', X.brick(0x4f3b36, 22), 0.28), win, win],
    cornice = k.flat(0x2a2622, 0.2, 0.8);
  for (let x = -len / 2 + 5; x < len / 2 - 4; x += 9.2) {
    const hh = h[0] + rnd() * (h[1] - h[0]), m = bricks[Math.floor(rnd() * bricks.length)];
    k.box(9, hh, 12, x, hh / 2, zNear + 31, m);
    k.box(9.3, 0.5, 12.3, x, hh + 0.25, zNear + 31, cornice);
    k.box(8.4, 3.2, 0.1, x, 1.8, zNear + 24.95, k.glow(rnd() > 0.5 ? 0xffd9a0 : 0xbfd8ff, 0.8));
  }
  return zNear + 12.5;
}
/* Cabs and cars along a crosstown road, both ways. */
function traffic(k: K, zRoad: number, len: number, reduced: boolean, n = 6) {
  const cars: { g: T.Group; dir: number; off: number; sp: number }[] = [];
  const cols = [0xf2b705, 0xf2b705, 0x1a1c20, 0xd8d4cc, 0xf2b705, 0x2a3f6a, 0x8a2a2a];
  const dark = new T.MeshStandardMaterial({ color: 0x14161a, roughness: 0.7 });
  for (let i = 0; i < n; i++) {
    const g = new T.Group(), dir = i % 2 ? -1 : 1;
    const body = new T.Mesh(new T.BoxGeometry(4.4, 0.75, 1.8), new T.MeshStandardMaterial({ color: cols[i % cols.length], metalness: 0.4, roughness: 0.4 })); body.position.y = 0.62;
    const cab = new T.Mesh(new T.BoxGeometry(2.2, 0.6, 1.6), new T.MeshStandardMaterial({ color: 0x22303a, metalness: 0.6, roughness: 0.2 })); cab.position.y = 1.3;
    const lamp = new T.Mesh(new T.BoxGeometry(0.06, 0.18, 1.2), new T.MeshBasicMaterial({ color: dir > 0 ? 0xfff2d0 : 0xff3a2a })); lamp.position.set(2.22, 0.7, 0);
    g.add(body, cab, lamp);
    for (const dx of [-1.45, 1.45]) for (const dz of [-0.85, 0.85]) { const w = new T.Mesh(new T.CylinderGeometry(0.33, 0.33, 0.24, 10), dark); w.rotation.x = PI / 2; w.position.set(dx, 0.33, dz); g.add(w); }
    g.rotation.y = dir > 0 ? 0 : PI;
    g.position.set(-len / 2 + i * (len / n), 0, zRoad + (dir > 0 ? 3.5 : -3.5));
    k.add(g);
    cars.push({ g, dir, off: i * (len / n), sp: 7 + (i % 3) * 2 });
  }
  if (!reduced) k.ticks.push((t) => { for (const c of cars) { const s = (t * c.sp + c.off) % len; c.g.position.x = c.dir > 0 ? -len / 2 + s : len / 2 - s; } });
}
/* A full house: seat boxes and, in most of them, a person. Returns the audience
   mesh and its base matrices so a room can make it sway. */
function house(k: K, seatsAt: T.Vector3[], fill: number, seatMat: T.Material, seed: number, facing = 0) {
  const rnd = X.mulberry(seed);
  const sg = new T.BoxGeometry(0.56, 0.5, 0.52); sg.translate(0, 0.25, 0);
  const back = new T.BoxGeometry(0.56, 0.5, 0.1); back.translate(0, 0.75, 0.24);
  const seatGeo = mergeGeometries([sg, back])!;
  k.instances(seatGeo, seatMat, seatsAt.map((p) => at(p.x, p.y, p.z, facing)));
  const who = seatsAt.filter(() => rnd() < fill);
  const base = who.map((p) => at(p.x, p.y + 0.42, p.z - 0.02 * Math.cos(facing), facing));
  const aud = k.instances(seatedBoxGeo(), new T.MeshStandardMaterial({ roughness: 0.9 }), base);
  aud.frustumCulled = false;
  const c = new T.Color();
  for (let i = 0; i < who.length; i++) aud.setColorAt(i, c.set(COATS[Math.floor(rnd() * COATS.length)]));
  if (aud.instanceColor) aud.instanceColor.needsUpdate = true;
  return { aud, base, pos: who.map((p) => v(p.x, p.y + 0.42, p.z)) };
}

/* ---------------- 16 AMATEUR NIGHT (rebuild) ---------------- */
export const apollo2: RoomDef = {
  id: 'apollo',
  daylit: false,
  name: 'After the applause',
  area: 'THE APOLLO',
  mood: 'Amateur Night',
  color: '#dc8c86',
  description: 'West 125th Street at night, the marquee running its bulbs and the red sign straight up the front, the Tree of Hope in the lobby for luck, then a velvet house of three levels with a singer out in the follow spot and the whole room moving with her. The works hang down both sides of the house and on the back wall of the stage.',
  signatures: 'The vertical APOLLO sign and the marquee with its chasing bulbs on 125th Street, the Walk of Fame plaques on the sidewalk, the Tree of Hope stump in the lobby, the gilt proscenium with its red drapes, two balconies over the orchestra, the footlights, a singer in the follow spot, the band, and a full house.',
  build(k, ctx) {
    k.sky({ top: 0x0e1020, horizon: 0x2c2230, ground: 0x0e0a0e, fog: 0.004, stars: 80, env: 0.45 });
    k.hemi(0xffd4c0, 0x1a1418, 0.4);
    const velvet = k.pbr('ap2Velvet', X.velvet(0x7a1f2b), 0.6, { roughness: 1 }),
      velvetD = k.pbr('ap2VelvetD', X.velvet(0x4d1219), 0.6, { roughness: 1 }),
      carpet = k.pbr('ap2Carpet', X.carpet(0x3b1a22, 0xc79a4a), 0.4, { roughness: 1 }),
      gold = k.pbr('ap2Gold', X.gilt(0xd2a94e), 2, { metalness: 0.85, roughness: 0.3 }),
      plaster = k.pbr('ap2Plaster', X.plaster(0xd8c0a6, 15), 0.4, { roughness: 0.8 }),
      stageWood = k.pbr('ap2Stage', X.planks(0x3a2a1e, 10, 17), 0.6, { roughness: 0.6 }),
      brick = k.pbr('ap2Brick', X.brick(0x7a4a3a, 181), 0.28),
      terrazzo = k.pbr('ap2Lobby', X.terrazzo(0xc8b8a0, 182), 0.3),
      bronze = k.flat(0x8a6a3a, 0.85, 0.35),
      dark = k.flat(0x14100f, 0.3, 0.7),
      warm = k.glow(0xffd9a0);

    /* ---- 125th Street ---- */
    const FZ = 14;
    const road = crossStreet(k, FZ + 0.6, 150, 183, [12, 26]);
    traffic(k, road, 150, ctx.reduced, 7);
    k.crowd([v(-60, 0, FZ + 3.2), v(60, 0, FZ + 3.2)], 18, { seed: 184, speed: 1.0, spread: 1.4, animate: !ctx.reduced });
    k.crowd([v(60, 0, FZ + 23), v(-60, 0, FZ + 23)], 14, { seed: 185, speed: 0.9, spread: 1.2, animate: !ctx.reduced });
    for (const x of [-26, 26]) k.lamp(x, FZ + 5.1, 6, k.flat(0x2a2e34, 0.6, 0.5), 0xffd7a0, 40);
    // the Walk of Fame: bronze plaques in the sidewalk
    const plaques: T.Vector3[] = [];
    for (let i = 0; i < 9; i++) { const x = -12 + i * 3; k.cyl(0.5, 0.04, x, 0.16, FZ + 3.0, bronze, 0.5, 20); plaques.push(v(x, 0.2, FZ + 3.0)); }
    // the front: four storeys of brick, the doors, the poster cases, the marquee, the blade
    k.box(10, 16, 0.6, -9, 8, FZ + 0.3, brick); k.box(10, 16, 0.6, 9, 8, FZ + 0.3, brick);
    k.box(8, 12.4, 0.6, 0, 9.8, FZ + 0.3, brick);
    for (let fl = 0; fl < 3; fl++) for (let i = 0; i < 6; i++) { const x = -11.25 + i * 4.5; k.box(1.8, 2.2, 0.1, x, 7.4 + fl * 2.9, FZ + 0.62, k.flat(0x1a2230, 0.5, 0.25)); k.box(2.1, 0.18, 0.2, x, 6.2 + fl * 2.9, FZ + 0.66, k.flat(0xcfc2a8, 0, 0.7)); }
    k.box(28.4, 0.6, 1, 0, 16.2, FZ + 0.5, k.flat(0xcfc2a8, 0, 0.7));
    for (const x of [-2.7, 0, 2.7]) k.box(2.4, 3.4, 0.08, x, 1.9, FZ + 0.1, k.glass(0xffd9a0, 0.35, 0.1));
    k.block(-14, -4, FZ - 0.1, FZ + 0.7); k.block(4, 14, FZ - 0.1, FZ + 0.7);
    const mounts: Mount[] = [];
    for (const x of [-8, 8]) { k.box(2.9, 3.8, 0.2, x, 2.3, FZ + 0.68, bronze); mounts.push({ position: v(x, 2.3, FZ + 0.8), rotation: 0, target: v(x, 3, FZ + 4.2), width: 2.4, height: 3.2, style: 'black', wash: true }); }
    // the marquee, with its bulbs running round the edge
    const MZ = FZ + 2.6;
    k.box(19, 1.8, 4, 0, 4.9, MZ, dark);
    k.box(19.2, 0.12, 4.2, 0, 4.0, MZ, k.flat(0xd8c070, 0.8, 0.3));
    const marquee = k.sign('AMATEUR NIGHT', 15, 1.1, 0, 4.95, MZ + 2.02, '#f4ead0', '#7a1020', 120, 0, { border: true });
    for (const s of [-1, 1]) k.sign('APOLLO', 3.4, 1.1, s * 9.52, 4.95, MZ, '#f4ead0', '#7a1020', 150, s > 0 ? PI / 2 : -PI / 2, { border: true });
    const bulbM: T.Matrix4[] = [];
    for (let i = 0; i < 48; i++) for (const y of [4.1, 5.8]) bulbM.push(at(-9.4 + i * 0.4, y, MZ + 2.05));
    for (const s of [-1, 1]) for (let i = 0; i < 10; i++) for (const y of [4.1, 5.8]) bulbM.push(at(s * 9.55, y, MZ - 1.8 + i * 0.4));
    const bulbs = k.instances(new T.SphereGeometry(0.07, 6, 4), new T.MeshBasicMaterial({ color: 0xffffff }), bulbM);
    bulbs.frustumCulled = false;
    { const c = new T.Color(0xffe4a0); for (let i = 0; i < bulbM.length; i++) bulbs.setColorAt(i, c); if (bulbs.instanceColor) bulbs.instanceColor.needsUpdate = true; }
    k.point(0, 3.4, MZ + 1.5, 0xffe0b0, 40, 12);
    // the blade: APOLLO read straight down, both sides
    const BX = 11.5;
    k.box(0.5, 10, 2.2, BX, 10.8, FZ + 1.7, k.flat(0x9a1a22, 0.3, 0.5));
    k.box(0.6, 10.2, 0.12, BX, 10.8, FZ + 2.8, k.flat(0xd8c070, 0.8, 0.3));
    const blade: T.Mesh[] = [];
    'APOLLO'.split('').forEach((ch, i) => { for (const s of [-1, 1]) blade.push(k.sign(ch, 1.5, 1.5, BX + s * 0.27, 14.6 - i * 1.55, FZ + 1.7, '#9a1a22', '#ffe8b0', 700, s > 0 ? PI / 2 : -PI / 2)); });
    k.point(BX + 2, 11, FZ + 3, 0xff6a5a, 30, 12);

    /* ---- the lobby, with the Tree of Hope ---- */
    const LB = 4;
    k.box(24, 0.2, FZ - LB, 0, 0.0, (FZ + LB) / 2, terrazzo);
    k.box(24.6, 0.4, FZ - LB, 0, 5.2, (FZ + LB) / 2, plaster);
    for (const s of [-1, 1]) k.box(0.6, 5.2, FZ - LB, s * 12.3, 2.6, (FZ + LB) / 2, plaster);
    const stump = k.cyl(0.55, 0.9, -6, 0.65, 9, k.pbr('ap2Bark', X.bark(0x5a4634), 0.7), 0.7, 14);
    k.cyl(0.9, 0.2, -6, 0.1, 9, bronze, 0.9, 20);
    k.box(1.6, 0.9, 0.08, -6, 1.3, 7.9, bronze).rotation.x = -0.4;
    k.keepOut.push({ x: -6, z: 9, r: 1.1 });
    k.censusWall({ x: -11.95, y: 2.8, z: (FZ + LB) / 2, rotY: PI / 2, cols: 13, rows: 3, tile: 0.62, gap: 0.05, start: ctx.wallStart(900, 39), pieces: ctx.all, backing: gold });
    k.sign('WALL OF FAME', 5, 0.5, -11.94, 4.6, (FZ + LB) / 2, '#5e2436', '#f2dca2', 110, PI / 2, { border: true });
    for (const z of [11.2, 6.8]) { k.box(0.1, 2.6, 3.4, 11.95, 2.6, z, gold); mounts.push({ position: v(11.88, 2.6, z), rotation: -PI / 2, target: v(8.6, 3, z), width: 3.0, height: 2.1, style: 'gilt', wash: true }); }
    for (const x of [-8.2, 8.2]) { k.box(3.4, 2.6, 0.1, x, 2.7, LB + 0.35, gold); mounts.push({ position: v(x, 2.7, LB + 0.42), rotation: 0, target: v(x, 3, LB + 3.6), width: 3.0, height: 2.1, style: 'gilt', wash: true }); }
    k.point(0, 4.6, 9, 0xffd9a0, 36, 14);
    // the wall between the lobby and the house, with the doors in the middle
    k.box(9, 15, 0.6, -7.5, 7.5, LB + 0.0, plaster); k.box(9, 15, 0.6, 7.5, 7.5, LB + 0.0, plaster);
    k.box(6, 11, 0.6, 0, 9.5, LB, plaster);
    k.block(-12.5, -3, LB - 0.3, LB + 0.3); k.block(3, 12.5, LB - 0.3, LB + 0.3);

    /* ---- the house: 24 wide, orchestra and two balconies, stage at the far end ---- */
    const STF = -38, SB = -50.5, W = 11.9;
    k.box(W * 2, 0.2, LB - STF, 0, 0.0, (LB + STF) / 2, carpet);
    for (const s of [-1, 1]) k.box(1.2, 16, LB - SB + 1, s * (W + 0.6), 8, (LB + SB) / 2, plaster);
    k.box(W * 2 + 2.4, 0.6, LB - SB + 1, 0, 16.3, (LB + SB) / 2, plaster);
    k.mesh(new T.SphereGeometry(8, 28, 10, 0, PI * 2, 0, PI / 2.6), k.pbr('ap2Plaster', X.plaster(0xd8c0a6, 15), 0.4, { roughness: 0.8, side: T.DoubleSide }), 0, 16, -18).rotation.x = PI;
    k.torus(7.1, 0.25, 0, 15.9, -18, gold, 48).rotation.x = PI / 2;
    k.beam(v(0, 13.6, -18), v(0, 11.6, -18), 0.05, gold, 5);
    for (const [r, y] of [[1.6, 11.4], [1.0, 10.8]]) { k.torus(r, 0.05, 0, y, -18, gold, 24).rotation.x = PI / 2; for (let j = 0; j < 12; j++) { const a = (j * PI) / 6; k.sphere(0.12, Math.cos(a) * r, y - 0.15, -18 + Math.sin(a) * r, warm, 6); } }
    k.point(0, 10.6, -18, 0xffdfb0, 40, 30);
    // pilasters and sconces down both walls, the works between them
    const bayZ = [-2.2, -8.6, -15, -21.4, -27.8, -34.2];
    for (const s of [-1, 1]) {
      for (let i = 0; i <= bayZ.length; i++) { const z = (i === 0 ? LB - 1 : bayZ[i - 1] - 3.2); if (z < STF + 1) break; k.column(s * (W - 0.3), 0, z, 6.2, 0.26, plaster, true, gold); k.sphere(0.16, s * (W - 0.6), 5.4, z, warm, 8); }
      for (const z of bayZ) {
        k.box(0.1, 3.0, 4.0, s * (W - 0.05), 3.4, z, velvetD);
        k.box(0.14, 0.14, 4.2, s * (W - 0.08), 5.0, z, gold);
        mounts.push({ position: v(s * (W - 0.14), 3.4, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 8.6, 3, z), width: 3.4, height: 2.3, style: 'gilt', wash: true });
      }
      // the side boxes by the stage
      for (const y of [5.6, 9.4]) { k.rounded(1.6, 1.0, 3.4, s * (W - 0.9), y, -36.4, gold, 0.1); k.box(1.4, 0.9, 3.2, s * (W - 0.8), y + 0.9, -36.4, velvetD); }
      k.point(s * 9.5, 7.4, -12, 0xffc890, 14, 14); k.point(s * 9.5, 7.4, -28, 0xffc890, 14, 14);
    }
    // the orchestra seats, a centre aisle and two side aisles
    const orch: T.Vector3[] = [];
    for (let r = 0; r < 30; r++) { const z = -34.6 + r * 1.1; if (z > LB - 1.2) break; for (let x = 1.9; x <= 7.6; x += 0.62) for (const s of [-1, 1]) orch.push(v(s * x, 0.1, z)); }
    k.block(-7.95, -1.6, -35, LB - 0.9); k.block(1.6, 7.95, -35, LB - 0.9);
    // two balconies across the back, raked, full
    const balc: T.Vector3[] = [];
    for (const [y, front] of [[5.0, -7], [9.4, -3.5]] as const) {
      const d = LB - front;
      k.box(W * 2, 0.5, d, 0, y - 0.25, LB - d / 2, velvetD);
      k.box(W * 2, 1.0, 0.3, 0, y + 0.5, front, gold);
      k.box(W * 2, 0.12, 0.5, 0, y + 1.05, front + 0.1, gold);
      for (let r = 0; r < Math.floor(d / 1.1) - 1; r++) { const z = front + 0.9 + r * 1.1, yy = y + r * 0.35; k.box(W * 2, 0.35, 1.1, 0, yy - 0.17 + 0.35, z, carpet); for (let x = -10.6; x <= 10.6; x += 0.62) if (Math.abs(x) > 0.6) balc.push(v(x, yy + 0.35, z)); }
    }
    const hA = house(k, orch, 0.85, velvet, 186), hB = house(k, balc, 0.8, velvet, 187);

    /* ---- the stage ---- */
    k.box(W * 2, 1.2, STF - SB, 0, 0.6, (STF + SB) / 2, stageWood);
    k.box(W * 2, 1.2, 0.2, 0, 0.6, STF + 0.02, dark);
    k.block(-W, W, SB - 1, STF + 0.1);
    k.arch(20, 11.5, 1.2, 0, 0, STF - 0.6, gold, false, 0.74);
    k.box(W * 2 + 1, 4, 1.2, 0, 15, STF - 0.6, plaster);
    for (const s of [-1, 1]) for (let j = 0; j < 8; j++) { const dr = k.mesh(new T.CylinderGeometry(0.34, 0.28, 11, 8, 1, true), velvet, s * (9.9 - j * 0.18), 6.7, STF - 1.4); void dr; }
    for (let j = 0; j < 22; j++) { const x = -8.4 + j * 0.8; const sw = k.mesh(new T.CylinderGeometry(0.5, 0.42, 2.4, 8, 1, true), velvet, x, 11.6 - Math.abs(x) * 0.05, STF - 1.3); sw.rotation.z = 0.12 * Math.sign(x); }
    k.box(W * 2, 16, 0.6, 0, 8, SB - 0.3, dark);
    k.sign('APOLLO', 8, 1.4, 0, 12.8, STF + 0.02, '#5e2436', '#f2dca2', 170, 0, { border: true });
    for (let x = -9.6; x <= 9.6; x += 0.8) k.sphere(0.1, x, 1.3, STF - 0.25, warm, 6);
    // the band: piano, drums, bass; the singer at the front with her microphone
    k.box(2.2, 1.0, 1.4, -7, 1.7, -46.5, k.flat(0x0e0e10, 0.3, 0.2)); k.box(2.2, 0.08, 1.5, -7, 2.25, -46.5, k.flat(0x0e0e10, 0.3, 0.2));
    for (const [x, z, r, h] of [[6.2, -47, 0.45, 0.5], [7.1, -46.4, 0.32, 0.3], [5.4, -46.3, 0.3, 0.3], [6.9, -47.6, 0.4, 0.05]] as const) k.cyl(r, h, x, 1.2 + 0.35 + h / 2, z, k.flat(0xb82a2a, 0.4, 0.4), r, 16);
    const band: T.Group[] = [];
    for (const [x, z, c] of [[-7, -45.4, 0x1a1a1e], [6.3, -48.2, 0x2b3f6a], [2.8, -48.4, 0x3a2a2a]] as const) { const p = personGroup(c); p.position.set(x, 1.2, z); p.rotation.y = x < 0 ? -0.6 : 0.3; k.add(p); band.push(p); }
    k.cyl(0.35, 1.8, 2.3, 2.1, -48.2, k.pbr('ap2Bass', X.planks(0x6a3a1a, 2, 188), 1), 0.25, 10);
    const singer = personGroup(0xc81a3a, 0x8d5a3b); singer.position.set(0, 1.2, -41.5); singer.rotation.y = 0; k.add(singer);
    k.cyl(0.02, 1.5, 0, 1.95, -40.9, k.flat(0x202024, 0.8, 0.3), 0.02, 6);
    const micHead = k.sphere(0.07, 0, 2.75, -40.9, k.flat(0x2a2a2e, 0.8, 0.3), 8);
    // the works on the back wall of the stage
    for (const x of [-6, 0, 6]) { k.box(5.0, 3.6, 0.1, x, 6.2, SB + 0.06, gold); mounts.push({ position: v(x, 6.2, SB + 0.14), rotation: 0, target: v(x * 0.25, 3, STF + 1.6), width: 4.6, height: 3.1, style: 'gilt', wash: true }); }
    // light: the house warm and low, the stage from the front, the follow spot on her
    k.spot(-9, 12, -20, -4, 2, -46, 0xff9a7a, 260, 0.45, 0.6, 50);
    k.spot(9, 12, -20, 4, 2, -46, 0x9ab6ff, 260, 0.45, 0.6, 50);
    const follow = k.spot(0, 9.6, 2, 0, 1.6, -41.5, 0xfff4e0, 520, 0.08, 0.35, 60);

    /* motion */
    if (!ctx.reduced) {
      const m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), c = new T.Color();
      const sway = (h: ReturnType<typeof house>, t: number, amp: number) => {
        for (let i = 0; i < h.pos.length; i++) { const p = h.pos[i]; m.compose(p, q.setFromEuler(e.set(0, 0, amp * Math.sin(t * 2.1 + p.x * 0.35))), ONE); h.aud.setMatrixAt(i, m); }
        h.aud.instanceMatrix.needsUpdate = true;
      };
      k.ticks.push((t) => {
        // she works the stage; the spot follows; the house sways with the song
        const sx = 3.2 * Math.sin(t * 0.23), sz = -41.5 - 0.8 * Math.sin(t * 0.17);
        singer.position.set(sx, 1.2, sz); singer.rotation.y = 0.35 * Math.sin(t * 0.23 + 1.4); singer.rotation.z = 0.06 * Math.sin(t * 2.1);
        follow.target.position.set(sx, 1.6, sz);
        band[0].rotation.z = 0.05 * Math.sin(t * 4.2); band[1].position.y = 1.2 + 0.05 * Math.abs(Math.sin(t * 4.2)); band[2].rotation.z = 0.05 * Math.sin(t * 2.1 + 1);
        sway(hA, t, 0.07); sway(hB, t + 0.3, 0.07);
        // the marquee chases
        for (let i = 0; i < bulbM.length; i++) bulbs.setColorAt(i, c.setHex(((i >> 1) + Math.floor(t * 8)) % 4 === 0 ? 0x5a4020 : 0xffe4a0));
        if (bulbs.instanceColor) bulbs.instanceColor.needsUpdate = true;
      });
    }

    /* eggs */
    const src = { name: 'Apollo Theater, Wikipedia', url: 'https://en.wikipedia.org/wiki/Apollo_Theater' };
    k.egg(v(0, 12, FZ + 0.8), { id: 'burlesque-1914', title: 'It opened as something else', year: '1914', text: 'The building opened in 1914 as Hurtig and Seamon\'s New (Burlesque) Theater, designed by George Keister, and it originally served only white patrons.', clue: 'Look up at the brick over the marquee. It is older than the name.', source: src }, { r: 3 });
    k.egg(marquee, { id: 'reopened-1934', title: 'The twenty sixth of January', year: '1934', text: 'Sidney Cohen bought the theater in January 1934 and turned it into a stage for Black entertainers. It reopened on January 26, 1934 as the 125th Street Apollo Theatre, with Morris Sussman managing.', clue: 'Read the marquee from across the street.', source: src }, { r: 3 });
    k.egg(micHead, { id: 'wednesday-nights', title: 'Wednesday nights', text: 'Morris Sussman, the manager, hosted competitions for amateur performers on Wednesday nights. Showtime at the Apollo, the television series built on those nights, launched in 1987.', clue: 'The microphone at the front of the stage belongs to whoever is brave enough.', source: src }, { r: 1.8 });
    k.egg(stump, { id: 'tree-of-hope', title: 'The Tree of Hope', text: 'The Tree of Hope is a stump that performers rub for good luck on their way to the stage. After a renovation in 2006 it was moved to the lobby.', clue: 'Touch the old wood in the lobby before you go in.', source: src }, { r: 1.6 });
    k.egg(blade[0], { id: 'landmark-1983', title: 'A landmark in 1983', year: '1983', text: 'New York City designated the Apollo a landmark on June 28, 1983, and it was added to the National Register of Historic Places on November 17 the same year. It seats about 1,500 on three levels, two balconies over the orchestra.', clue: 'Read the red sign from the top down.', source: src }, { r: 2.4 });
    k.egg(plaques[4], { id: 'walk-of-fame', title: 'The walk outside', year: '2010', text: 'A walk of fame was dedicated outside the theater in May 2010, recognizing the performers in the Apollo Legends Hall of Fame.', clue: 'Look down at the bronze in the sidewalk under the marquee.', source: src }, { r: 1.6 });

    return { mounts, spawn: v(-5, 3, FZ + 21.8), look: v(1, 6, FZ), eye: 3, bounds: [-11.4, 11.4, STF + 0.6, FZ + 24], style: 'gilt' };
  },
};

/* ---------------- 63 THE HORSESHOE (rebuild) ---------------- */
export const carnegie2: RoomDef = {
  id: 'carnegie',
  name: 'The horseshoe',
  area: 'CARNEGIE HALL',
  mood: 'Concert black',
  color: '#c8a070',
  daylit: false,
  description: 'Fifty seventh Street at night, the brick and terracotta front with its arches, a lobby in cream and gold, then the hall: five levels in a horseshoe round the stage, a full house, and the orchestra playing with the bows all going together. The works hang round the parquet under the first tier, where you walk the ring.',
  signatures: 'The Roman brick and terracotta front on 57th Street with its arched windows and the studio floors above, the lobby, the cream and gold horseshoe of five levels, the boxes of the first and second tiers, the red seats and a full house, the stage under its elliptic arch, the orchestra in its arcs and the conductor on the podium.',
  build(k, ctx) {
    k.sky({ top: 0x141a2e, horizon: 0x4a4050, ground: 0x0e0e12, fog: 0.003, stars: 140, env: 0.55 });
    k.hemi(0xffe4c8, 0x1a1418, 0.5);
    const brick = k.pbr('ch2Brick', X.brick(0x6a4436, 168), 0.28),
      terra = k.pbr('ch2Terra', X.ashlar(0xb89a7a, 169, 3), 0.2),
      cream = k.pbr('ch2Cream', X.plaster(0xece2cf, 81), 0.35),
      gold = k.pbr('ch2Gold', X.gilt(0xd0a852), 2, { metalness: 0.85, roughness: 0.3 }),
      red = k.pbr('ch2Seats', X.velvet(0x9a1a22), 0.4, { roughness: 0.95 }),
      carpet = k.pbr('ch2Carpet', X.carpet(0x6a1a22, 0xc79a4a), 0.5),
      stage = k.pbr('ch2Stage', X.planks(0xb89a6a, 6, 170), 1.2, { roughness: 0.6 }),
      marble = k.pbr('ch2Marble', X.marble(0xe8e0d0, 0x9a8f80, 189), 0.3),
      wood = k.pbr('ch2Wood', X.planks(0x6a3a1a, 2, 190), 1),
      dark = k.flat(0x121216, 0.5, 0.7),
      glass = k.glass(0xffe0b0, 0.3, 0.1),
      warm = k.glow(0xffe0b0),
      /* curved shells are seen from inside and out: open cylinders and rings need both faces */
      creamIn = k.pbr('ch2Cream', X.plaster(0xece2cf, 81), 0.35, { side: T.DoubleSide }),
      goldIn = k.pbr('ch2Gold', X.gilt(0xd0a852), 2, { metalness: 0.85, roughness: 0.3, side: T.DoubleSide });

    /* ---- 57th Street across the front ---- */
    const FZ = 10;
    const road = crossStreet(k, FZ + 0.6, 170, 191, [16, 40]);
    traffic(k, road, 170, ctx.reduced, 8);
    k.crowd([v(-70, 0, FZ + 3.4), v(70, 0, FZ + 3.4)], 20, { seed: 192, speed: 1.0, spread: 1.6, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0x1a1a1a, 0x3a3f4a, 0x6a1a22] });
    for (const x of [-30, 0, 30]) k.lamp(x, FZ + 5.2, 6, k.flat(0x2a2e34, 0.6, 0.5), 0xffd7a0, 40);

    /* ---- the front: hollow, eight storeys of brick and terracotta, doors on the street ---- */
    const FW = 64, FH = 30;
    // the ground floor: five arches, three of them doors
    const doorX = [-8, 0, 8];
    let x0 = -FW / 2;
    for (const dx of doorX) { const xa = dx - 2; k.box(xa - x0, 6, 0.8, (x0 + xa) / 2, 3, FZ - 0.4, terra); x0 = dx + 2; }
    k.box(FW / 2 - x0, 6, 0.8, (x0 + FW / 2) / 2, 3, FZ - 0.4, terra);
    for (const dx of doorX) { k.arch(4, 5.2, 0.9, dx, 0, FZ - 0.4, terra, false, 0.62); k.box(3.8, 2.2, 0.1, dx, 4.6, FZ - 0.5, glass); }
    k.box(FW, FH - 6, 0.8, 0, 6 + (FH - 6) / 2, FZ - 0.4, brick);
    for (let t = 0; t < 3; t++) for (let i = 0; i < 7; i++) { const x = -24 + i * 8, y = 9 + t * 6.6; k.arch(3, 4.6, 0.3, x, y - 2.3, FZ + 0.05, terra, false, 0.75); k.box(2.6, 4.0, 0.1, x, y - 0.1, FZ + 0.02, glass); }
    for (const y of [6.3, 13.2, 19.8, 26.4]) k.box(FW + 0.4, 0.4, 0.5, 0, y, FZ + 0.1, terra);
    k.moulding([[0, 0], [0.9, 0], [1.0, 0.3], [0.6, 0.5], [0.8, 0.8], [0, 1.0]], FW + 0.4, 0, FH - 1, FZ + 0.05, terra, 0);
    for (const s of [-1, 1]) k.box(0.8, FH, 44, s * (FW / 2 - 0.4), FH / 2, FZ - 22, brick);
    k.box(14, 18, 14, 22, FH + 9, FZ - 8, brick);
    for (let y = FH + 2; y < FH + 17; y += 3) for (let x = 16.5; x < 28; x += 2.6) k.box(1.2, 1.6, 0.1, x, y, FZ - 0.95, k.glow(0xffe0b0, 0.7));
    k.block(-FW / 2, -10, FZ - 0.9, FZ + 0.1); k.block(-6, -2, FZ - 0.9, FZ + 0.1); k.block(2, 6, FZ - 0.9, FZ + 0.1); k.block(10, FW / 2, FZ - 0.9, FZ + 0.1);
    k.box(26, 0.3, 4.5, 0, 6.6, FZ + 2.2, dark);
    const nameSign = k.sign('CARNEGIE HALL', 12, 1.2, 0, 7.5, FZ + 4.46, '#14090a', '#f4e4b0', 130, 0, { border: true });
    for (let i = 0; i < 6; i++) k.sphere(0.14, -10 + i * 4, 6.35, FZ + 4.2, warm, 8);
    k.point(0, 5.6, FZ + 3, 0xffe0b0, 40, 14);

    /* ---- the lobby ---- */
    const LB = FZ - 12.6, LW = 14;
    k.box(LW * 2, 0.2, FZ - LB, 0, 0, (FZ + LB) / 2, marble);
    k.box(LW * 2, 0.5, FZ - LB, 0, 6.6, (FZ + LB) / 2, cream);
    for (let z = LB + 2; z < FZ - 1; z += 3.2) k.box(LW * 2, 0.4, 0.5, 0, 6.2, z, gold);
    for (const s of [-1, 1]) { k.box(0.6, 6.6, FZ - LB, s * (LW + 0.3), 3.3, (FZ + LB) / 2, cream); k.block(s > 0 ? LW : -40, s > 0 ? 40 : -LW, LB - 0.3, FZ); }
    for (const s of [-1, 1]) k.box(LW - 2.4, 6.6, 0.6, s * (LW + 2.4) / 2, 3.3, LB - 0.3, cream);
    k.box(4.8, 2.2, 0.6, 0, 5.5, LB - 0.3, cream);
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (const z of [FZ - 4, FZ - 9]) { k.box(0.1, 2.8, 3.6, s * (LW - 0.05), 2.8, z, gold); mounts.push({ position: v(s * (LW - 0.12), 2.8, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * (LW - 3.4), 3, z), width: 3.2, height: 2.2, style: 'gilt', wash: true }); }
    k.censusWall({ x: -8, y: 3.0, z: LB + 0.05, rotY: 0, cols: 12, rows: 5, tile: 0.55, gap: 0.05, start: ctx.wallStart(7100, 60), pieces: ctx.all, backing: gold });
    k.censusWall({ x: 8, y: 3.0, z: LB + 0.05, rotY: 0, cols: 12, rows: 5, tile: 0.55, gap: 0.05, start: ctx.wallStart(7160, 60), pieces: ctx.all, backing: gold });
    k.box(3, 1.2, 1, 9, 0.6, FZ - 2.5, wood); k.box(3.2, 0.1, 1.2, 9, 1.25, FZ - 2.5, marble); k.block(7.4, 10.6, FZ - 3.1, FZ - 1.9);
    const clerk = personGroup(0x1a1a20); clerk.position.set(9, 0, FZ - 3.4); clerk.rotation.y = 0; k.add(clerk);
    k.point(0, 5.8, (FZ + LB) / 2, 0xffe6c0, 34, 16);

    /* ---- the hall: a horseshoe, parquet plus four tiers, round the stage ---- */
    const RW = 19.6, R0 = 16, CZ = LB - RW, STF = CZ - 14, SB = STF - 12.8, HH = 22;
    k.box(RW * 2, 0.2, CZ + RW - SB, 0, 0, (CZ + RW + SB) / 2, carpet);
    k.block(-RW - 0.3, -RW + 0.3 + 0.0, SB - 1, CZ); k.block(RW - 0.3, RW + 0.3, SB - 1, CZ);
    k.block(-40, -2.4, LB - 0.6, LB); k.block(2.4, 40, LB - 0.6, LB);
    // the parquet wall round the back: flat panels on the true tangent, a door in the middle
    const N = 24;
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * PI, a1 = ((i + 1) / N) * PI, am = (a0 + a1) / 2;
      const px = RW * Math.cos(am), pz = CZ + RW * Math.sin(am), chord = 2 * RW * Math.sin(PI / N / 2) + 0.05;
      const bx0 = Math.min(RW * Math.cos(a0), RW * Math.cos(a1)), bx1 = Math.max(RW * Math.cos(a0), RW * Math.cos(a1));
      const bz0 = CZ + Math.min(RW * Math.sin(a0), RW * Math.sin(a1)), bz1 = CZ + Math.max(RW * Math.sin(a0), RW * Math.sin(a1));
      if (Math.abs(am - PI / 2) < 0.1) continue;                               // the door from the lobby
      k.block(bx0 - 0.25, bx1 + 0.25, bz0 - 0.1, bz1 + 0.35);
      const seg = k.box(chord, 4.4, 0.4, px, 2.2, pz, cream); seg.rotation.y = Math.atan2(Math.cos(am), Math.sin(am));
    }
    for (const s of [-1, 1]) k.box(0.4, 4.4, CZ - STF, s * (RW + 0.0), 2.2, (CZ + STF) / 2, cream);
    // the walls above, the ceiling, the ring of lamps
    k.mesh(new T.CylinderGeometry(RW + 0.2, RW + 0.2, HH - 4.4, 48, 1, true, -PI / 2, PI), creamIn, 0, 4.4 + (HH - 4.4) / 2, CZ);
    for (const s of [-1, 1]) k.box(0.4, HH - 4.4, CZ - SB, s * (RW + 0.2), 4.4 + (HH - 4.4) / 2, (CZ + SB) / 2, cream);
    k.mesh(new T.CylinderGeometry(RW + 0.4, RW + 0.4, 0.5, 48, 1, false, -PI / 2, PI), cream, 0, HH, CZ);
    k.box(RW * 2 + 0.8, 0.5, CZ - SB, 0, HH, (CZ + SB) / 2, cream);
    k.torus(12, 0.3, 0, HH - 0.3, CZ - 6, gold, 64).rotation.x = PI / 2;
    k.torus(8, 0.2, 0, HH - 0.3, CZ - 6, gold, 48).rotation.x = PI / 2;
    for (let i = 0; i < 24; i++) { const a = (i / 24) * PI * 2; k.sphere(0.22, Math.cos(a) * 12, HH - 0.7, CZ - 6 + Math.sin(a) * 12, warm, 8); }
    // four tiers above the parquet, each a horseshoe with a gilt front
    const tierAud: T.Vector3[] = [], tierYs = [4.4, 8.4, 12.4, 16.4];
    tierYs.forEach((y, tier) => {
      const ri = R0 + tier * 0.7, m = tier % 2 ? cream : gold;
      const ring = k.mesh(new T.RingGeometry(ri, RW + 0.2, 48, 1, PI, PI), tier % 2 ? creamIn : goldIn, 0, y, CZ); ring.rotation.x = -PI / 2;
      k.mesh(new T.CylinderGeometry(ri, ri, 1.0, 48, 1, true, -PI / 2, PI), goldIn, 0, y + 0.5, CZ);
      for (const s of [-1, 1]) {
        k.box(RW + 0.2 - ri, 0.3, CZ - STF - 1, s * (ri + RW + 0.2) / 2, y - 0.15, (CZ + STF + 1) / 2, m);
        k.box(0.2, 1.0, CZ - STF - 1, s * ri, y + 0.5, (CZ + STF + 1) / 2, gold);
        for (let z = CZ - 1; z > STF + 1.5; z -= 1.0) for (let d = 0.8; d < RW - ri - 0.3; d += 0.9) tierAud.push(v(s * (ri + d), y, z));
      }
      // the box partitions on the first two tiers, eight a box on the first
      if (tier < 2) for (let i = 1; i < 16; i++) { const a = (i / 16) * PI; const p = k.box(0.08, 1.4, RW - ri, Math.cos(a) * (ri + RW) / 2, y + 0.7, CZ + Math.sin(a) * (ri + RW) / 2, cream); p.rotation.y = Math.atan2(Math.cos(a), Math.sin(a)) + PI / 2; }
      for (let a = 0.08; a < PI - 0.05; a += 0.9 / ((ri + RW) / 2)) for (let d = 0.8; d < RW - ri - 0.3; d += 0.9) tierAud.push(v(Math.cos(a) * (ri + d), y, CZ + Math.sin(a) * (ri + d)));
      for (let i = 0; i < 9; i++) { const a = ((i + 0.5) / 9) * PI; k.sphere(0.12, Math.cos(a) * (ri - 0.1), y + 1.2, CZ + Math.sin(a) * (ri - 0.1), warm, 6); }
    });
    // the tier audiences face the stage
    {
      const rnd = X.mulberry(193);
      const who = tierAud.filter(() => rnd() < 0.8);
      const mats = who.map((p) => { const yaw = Math.atan2(-p.x, (STF - 4) - p.z); return at(p.x, p.y + 0.02, p.z, yaw + PI); });
      const aud = k.instances(seatedBoxGeo(), new T.MeshStandardMaterial({ roughness: 0.9 }), mats);
      const c = new T.Color(); for (let i = 0; i < who.length; i++) aud.setColorAt(i, c.set(COATS[Math.floor(rnd() * COATS.length)])); if (aud.instanceColor) aud.instanceColor.needsUpdate = true;
    }
    // the parquet: straight rows to the stage, a centre aisle, the ring aisle clear under the first tier
    const parq: T.Vector3[] = [], half = (z: number) => (z > CZ ? Math.sqrt(Math.max(0, 14.4 ** 2 - (z - CZ) ** 2)) : 14.4);
    const rows: number[] = [];
    for (let z = STF + 5; z < CZ + 13; z += 1.1) rows.push(z);
    for (const z of rows) for (let x = 1.4; x <= half(z) - 0.4; x += 0.62) for (const s of [-1, 1]) parq.push(v(s * x, 0.1, z));
    for (let i = 0; i < rows.length; i += 3) { const za = rows[i] - 0.5, zb = rows[Math.min(rows.length - 1, i + 2)] + 0.5, w = Math.max(...rows.slice(i, i + 3).map(half)); k.block(-w, -1.1, za, zb); k.block(1.1, w, za, zb); }
    const hP = house(k, parq, 0.85, red, 194);

    /* ---- the stage, the arch, the orchestra ---- */
    k.box(26, 1.2, STF - SB, 0, 0.6, (STF + SB) / 2, stage);
    k.block(-13.2, 13.2, SB - 1, STF + 0.2);
    for (const s of [-1, 1]) k.box(RW - 13, HH, 0.6, s * (13 + (RW - 13) / 2), HH / 2, STF - 0.3, cream);
    k.arch(26, 17.5, 1.0, 0, 0, STF - 0.3, cream, false, 0.53);
    k.box(26, HH - 19.8, 1.0, 0, 19.8 + (HH - 19.8) / 2, STF - 0.3, cream);
    k.mesh(new T.TorusGeometry(13.1, 0.25, 8, 48, PI), gold, 0, 11.4, STF + 0.25).scale.set(1, 0.65, 1);
    for (const s of [-1, 1]) k.box(0.6, 12, STF - SB, s * 13.3, 6, (STF + SB) / 2, cream);
    k.box(RW * 2 + 1.2, HH + 0.3, 0.6, 0, (HH + 0.3) / 2, SB - 0.3, cream);
    for (const [w, h, x, y] of [[22, 0.3, 0, 15.5], [22, 0.3, 0, 6.5], [0.3, 9, -11, 11], [0.3, 9, 11, 11]] as const) k.box(w, h, 0.2, x, y, SB, gold);
    k.point(0, 14, STF - 6, 0xfff0d8, 70, 26);
    const pod = k.box(1.2, 0.3, 1.2, 0, 1.35, STF - 1.4, wood);
    const conductor = personGroup(0x0e0e10); conductor.position.set(0, 1.5, STF - 1.4); conductor.rotation.y = PI; k.add(conductor);
    const baton = new T.Group(); const arm = new T.Mesh(new T.BoxGeometry(0.08, 0.08, 0.7), new T.MeshStandardMaterial({ color: 0x0e0e10 })); arm.position.z = -0.35; baton.add(arm);
    const stick = new T.Mesh(new T.BoxGeometry(0.015, 0.015, 0.45), new T.MeshBasicMaterial({ color: 0xffffff })); stick.position.z = -0.9; baton.add(stick);
    baton.position.set(0.22, 2.75, STF - 1.4); k.add(baton);
    const players: T.Matrix4[] = [], bowBase: { x: number; y: number; z: number; yaw: number }[] = [], cellos: T.Matrix4[] = [], stands: T.Matrix4[] = [];
    const CX = 0, CZc = STF - 1.4;
    [3.2, 5.0, 6.8, 8.6, 10.4].forEach((r, arc) => {
      const n = Math.round(r * 2.1);
      for (let i = 0; i < n; i++) {
        const phi = -1.15 + (i / (n - 1)) * 2.3, x = CX + r * Math.sin(phi), z = CZc - r * Math.cos(phi), yaw = Math.atan2(CX - x, CZc - z);
        if (z < SB + 0.8) continue;
        const y = 1.2 + (arc > 2 ? 0.3 : 0);
        players.push(at(x, y, z, yaw));
        if (arc < 2) bowBase.push({ x: x + Math.sin(yaw) * 0.3, y: y + 0.85, z: z + Math.cos(yaw) * 0.3, yaw });
        if (arc === 2 && i % 2 === 0) cellos.push(at(x + Math.sin(yaw) * 0.45, y + 0.5, z + Math.cos(yaw) * 0.45, yaw, v(1, 1, 0.6)));
        if (arc < 3) stands.push(at(x + Math.sin(yaw) * 0.8, y + 1.05, z + Math.cos(yaw) * 0.8, yaw));
      }
    });
    const orch = k.instances(seatedGeo(), new T.MeshStandardMaterial({ color: 0x141418, roughness: 0.8 }), players);
    { const c = new T.Color(); for (let i = 0; i < players.length; i++) orch.setColorAt(i, c.set(i % 5 === 0 ? 0x2a2a30 : 0x121216)); if (orch.instanceColor) orch.instanceColor.needsUpdate = true; }
    k.instances(new T.CylinderGeometry(0.25, 0.3, 1.1, 10), wood, cellos);
    k.instances(new T.BoxGeometry(0.5, 0.35, 0.03), k.flat(0x1a1a1e, 0.6, 0.4), stands);
    for (const [x, z] of [[-5, SB + 1.4], [-3.6, SB + 1.2], [-2.2, SB + 1.3]]) k.cyl(0.55, 0.7, x, 1.2 + 0.35 + 0.3, z, k.flat(0xb87333, 0.8, 0.3), 0.45, 18);
    const bows = k.instances(new T.BoxGeometry(0.02, 0.02, 0.75), new T.MeshBasicMaterial({ color: 0xd8c8a0 }), bowBase.map((b) => at(b.x, b.y, b.z, b.yaw + PI / 2)));
    bows.frustumCulled = false;
    // light: the stage washed from the front, the house low and warm
    for (let i = 0; i < 4; i++) k.spot(-9 + i * 6, 17, STF + 12, -9 + i * 6, 1.2, STF - 5, 0xfff0d8, 180, 0.4, 0.6, 40);
    k.point(0, 16, CZ - 2, 0xffe6c0, 60, 50);
    k.point(0, 7, CZ + 12, 0xffe6c0, 30, 24);

    /* the works: round the parquet under the first tier, down the straight sides, beside the stage */
    for (let i = 0; i < 9; i++) {
      const a = ((i + 0.5) / 9) * PI;
      if (Math.abs(a - PI / 2) < 0.2) continue;                                   // the door
      const r = RW - 0.45, x = Math.cos(a) * r, z = CZ + Math.sin(a) * r;
      mounts.push({ position: v(x, 2.3, z), rotation: Math.atan2(-Math.cos(a), -Math.sin(a)), target: v(Math.cos(a) * 16.2, 3, CZ + Math.sin(a) * 16.2), width: 3.0, height: 1.8, style: 'gilt', wash: true });
    }
    for (const s of [-1, 1]) for (const z of [CZ - 3.5, CZ - 10]) mounts.push({ position: v(s * (RW - 0.25), 2.3, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 16.2, 3, z), width: 3.0, height: 1.8, style: 'gilt', wash: true });
    for (const s of [-1, 1]) mounts.push({ position: v(s * 16.3, 2.7, STF + 0.35), rotation: 0, target: v(s * 16.3, 3, STF + 3.4), width: 4.0, height: 2.6, style: 'gilt', wash: true });

    /* motion */
    if (!ctx.reduced) {
      const m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler();
      k.ticks.push((t) => {
        // the bows go together, the baton beats four, the house barely moves
        for (let i = 0; i < bowBase.length; i++) {
          const b = bowBase[i], s = 0.22 * Math.sin(t * 3.4), fx = Math.cos(b.yaw), fz = -Math.sin(b.yaw);
          m.compose(v(b.x + fx * s, b.y, b.z + fz * s), q.setFromEuler(e.set(0.35, b.yaw + PI / 2, 0)), ONE);
          bows.setMatrixAt(i, m);
        }
        bows.instanceMatrix.needsUpdate = true;
        const beat = (t * 1.6) % 4, ph = beat - Math.floor(beat);
        baton.rotation.x = -0.4 + 0.55 * Math.sin(ph * PI);
        baton.rotation.y = [0, -0.5, 0.5, 0][Math.floor(beat)] * (1 - ph) + [-0.5, 0.5, 0, 0][Math.floor(beat)] * ph;
        conductor.rotation.z = 0.04 * Math.sin(t * 1.6 * PI / 2);
        for (let i = 0; i < hP.pos.length; i += 7) { const p = hP.pos[i]; m.compose(p, q.setFromEuler(e.set(0, 0, 0.03 * Math.sin(t * 0.8 + i))), ONE); hP.aud.setMatrixAt(i, m); }
        hP.aud.instanceMatrix.needsUpdate = true;
      });
    }
    void pod;

    /* eggs */
    const src = { name: 'Carnegie Hall, Wikipedia', url: 'https://en.wikipedia.org/wiki/Carnegie_Hall' };
    k.egg(v(0, 3, STF - 1.4), { id: 'opened-1891', title: 'Tchaikovsky on the first night', year: '1891', text: 'Carnegie Hall opened on May 5, 1891, with the Old 100th hymn, a speech by Bishop Henry C. Potter, and a concert conducted by Walter Damrosch and Pyotr Ilyich Tchaikovsky, who found the room, lit and full, unusually impressive and grand.', clue: 'Look at who is standing on the podium.', source: src }, { r: 2 });
    k.egg(nameSign, { id: 'tuthill', title: 'Roman brick and terracotta', text: 'William Burnet Tuthill, little known at the time, designed the building in a modified Italian Renaissance style: Roman brick with band courses, pilasters and arches in architectural terracotta. It was built as an eight storey block, and the floors above the halls once held 133 or 150 studios.', clue: 'Read the name over the doors on 57th Street.', source: src }, { r: 3 });
    k.egg(v(Math.cos(1.1) * R0, 5.2, CZ + Math.sin(1.1) * R0), { id: 'five-levels', title: 'Five levels, 2,790 seats', text: 'The main hall seats 2,790 on five levels. The first tier has 264 seats, eight to a box; the second tier has 238, six to eight to a box.', clue: 'Count the partitions along the first tier front.', source: src }, { r: 2.4 });
    k.egg(v(0, 2.2, FZ - 6), { id: 'saved-1960', title: 'Saved by a violinist', year: '1960', text: 'The hall was sold to developers in 1956, with the Philharmonic leaving for Lincoln Center. Isaac Stern enlisted his friends Jacob and Alice Kaplan to save it, and in 1960 the city bought it for five million dollars. It became a National Historic Landmark in 1962.', clue: 'Stand in the lobby and think about how close it came.', source: src }, { r: 2.4 });
    k.egg(v(-9, 1.6, STF - 4), { id: 'the-concrete', title: 'The slab under the stage', year: '1995', text: 'The main hall reopened on December 15, 1986 after a seven month renovation, but by the early 1990s the stage had begun to warp. When it was taken apart in 1995 they found a slab of concrete underneath, and it came out that summer while the hall was closed.', clue: 'Look at the boards under the players on the left.', source: src }, { r: 2.4 });
    k.egg(v(0, 11.4, STF + 0.3), { id: 'the-arch', title: 'The elliptic arch', text: 'The stage is 42 feet deep, and the ceiling over the hall is carried on an elliptic arch.', clue: 'Follow the gilt line over the orchestra from one side to the other.', source: src }, { r: 3 });

    return { mounts, spawn: v(-7, 3, FZ + 21.8), look: v(0, 10, FZ), eye: 3, bounds: [-RW + 0.4, RW - 0.4, STF + 1.2, FZ + 24], style: 'gilt' };
  },
};
