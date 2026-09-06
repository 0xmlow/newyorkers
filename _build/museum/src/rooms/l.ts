/* Rooms 52 to 56: Belvedere Castle, the High Bridge, Arthur Avenue, Wave Hill, Gantry Plaza. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront } from './f';

const PI = Math.PI;

/* ---------------- 52 BELVEDERE CASTLE ---------------- */
export const belvedere: RoomDef = {
  id: 'belvedere',
  name: 'The castle on the rock',
  area: 'BELVEDERE CASTLE',
  mood: 'October afternoon',
  color: '#9ab088',
  description: 'Vista Rock, the little castle and its terraces over Turtle Pond and the Great Lawn, the towers of the west side beyond, the works on the ramparts.',
  signatures: 'The granite and schist folly with its tower, the two terraces at different heights, the pond below with turtles and the Delacorte stage, the Great Lawn and the twin towered skyline of Central Park West.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad8, horizon: 0xf0e4cc, ground: 0x4a5a3a, fog: 0.002, sun: { az: 4.2, el: 0.45, color: 0xffe6c0, size: 14 }, env: 0.95 });
    k.hemi(0xf2f0e8, 0x3a4a2a, 0.9);
    k.sun(0xffe0b8, 2.2, -50, 46, 40, true, 110);
    const schist = k.pbr('bvSchist', X.ashlar(0x7a7268, 116, 2), 0.18, { roughness: 0.9 }),
      granite = k.pbr('bvGranite', X.ashlar(0xa8a090, 117, 3), 0.22),
      lawn = k.pbr('bvLawn', X.grass(0x5a7a3a, 58), 0.06),
      pathM = k.pbr('bvPath', X.cobble(0xa39a86, 59), 1.1),
      rock = k.pbr('bvRock', X.ashlar(0x8a847a, 118, 1), 0.12, { roughness: 0.95 }),
      iron = k.flat(0x1f242a, 0.7, 0.45),
      copper = k.pbr('bvCopper', X.patina(0x5f9a8c), 0.6, { roughness: 0.6, metalness: 0.3 }),
      wood = k.pbr('bvStage', X.planks(0x6a5a45, 6, 119), 1.0);
    // the park: lawn, the rock outcrop the castle stands on, the pond, the lawn beyond, the west side towers
    k.box(300, 0.4, 300, 0, -0.2, 0, lawn);
    const RY = 9;
    k.mesh(new T.CylinderGeometry(19, 26, RY, 12), rock, 0, RY / 2 - 0.2, 6);
    k.water({ y: 0.2, color: 0x2e5a4e, w: 70, d: 44, x: 4, z: -40, amp: 0.4 });
    k.mesh(new T.CylinderGeometry(40, 40, 0.5, 48), pathM, 4, -0.05, -40);
    k.box(140, 0.3, 120, 0, 0.05, -120, k.pbr('bvGreat', X.grass(0x6a8a3a, 60), 0.06));
    k.skyline({ z: -250, count: 30, spacing: 10, scale: 2.6, base: -1, seed: 120, lit: 0.25, glow: 0.5, tint: 0x8a7a6e, rows: 1, spires: true });
    for (const x of [-40, 60]) { for (const s of [-1, 1]) k.box(10, 40, 10, x + s * 9, 20, -250, k.pbr('bvTwin', X.windows(121, 0.3, 0x9a8a7a, true), 0.12, { emissive: 0xffffff, emissiveIntensity: 0.4, stretch: 0.42 })); k.box(28, 26, 12, x, 13, -250, k.pbr('bvTwin', X.windows(121, 0.3, 0x9a8a7a, true), 0.12, { emissive: 0xffffff, emissiveIntensity: 0.4, stretch: 0.42 })); }
    const rnd = X.mulberry(52);
    for (let i = 0; i < 70; i++) { const a = rnd() * PI * 2, r = 40 + rnd() * 100; const x = Math.cos(a) * r, z = 8 + Math.sin(a) * r; if (z < -20 && z > -64 && Math.abs(x - 4) < 38) continue; if (z < -70) continue; if (Math.hypot(x, z - 40) < 18 || (Math.abs(x - 7) < 7 && z > 10 && z < 44)) continue; k.tree(x, 0, z, { kind: rnd() > 0.7 ? 'column' : 'round', h: 5 + rnd() * 5, r: 2.4 + rnd() * 2.2, leaf: [0x6a8a3a, 0xc88a3a, 0xb8602a, 0x8a7a2a][Math.floor(rnd() * 4)], seed: i }); }
    // the Delacorte: a ring of seats and a stage by the pond
    for (let i = 0; i < 6; i++) k.mesh(new T.RingGeometry(12 + i * 2, 13.6 + i * 2, 40, 1, PI * 1.15, PI * 0.7), wood, -30, 0.3 + i * 0.6, -40).rotation.x = -PI / 2;
    k.mesh(new T.CylinderGeometry(10, 10, 0.6, 32), wood, -30, 0.3, -40);
    // the castle: the main block on the rock, the tower, the two terraces, the parapets
    const CY = RY, CX = 0, CZ = 12;
    k.box(12, 8, 10, CX, CY + 4, CZ, schist);
    k.box(13, 0.6, 11, CX, CY + 8.2, CZ, granite);
    k.cyl(3.4, 16, CX - 7, CY + 8, CZ - 2, schist, 3.4, 12);
    k.mesh(new T.ConeGeometry(3.9, 4.5, 12), copper, CX - 7, CY + 18.2, CZ - 2);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; k.box(0.7, 0.9, 0.7, CX - 7 + Math.cos(a) * 3.3, CY + 16.4, CZ - 2 + Math.sin(a) * 3.3, granite); }
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) k.box(0.8, 0.8, 0.8, CX + s * 6.2, CY + 8.8, CZ - 4.5 + i * 1.8, granite);
    k.arch(2.4, 4, 1.2, CX, CY, CZ - 5, granite, true, 0.8);
    k.arch(2.4, 4, 1.2, CX + 6, CY, CZ, granite, true, 0.8).rotation.y = PI / 2;
    for (const [x, z] of [[CX - 3, CZ - 5.1], [CX + 3, CZ - 5.1]]) { k.box(1.2, 2.4, 0.3, x, CY + 3.6, z, granite); k.box(0.8, 1.8, 0.1, x, CY + 3.6, z - 0.1, k.glass(0xffe0b0, 0.3, 0.1)); }
    k.block(CX - 6.4, CX - 1.4, CZ - 5.4, CZ + 5.4); k.block(CX + 1.4, CX + 6.4, CZ - 5.4, CZ + 5.4);
    k.block(CX - 1.4, CX + 1.4, CZ - 2, CZ + 5.4);
    // the upper terrace on the rock in front of the castle (north, toward the pond) and the lower terrace to the west
    k.box(26, 0.4, 14, CX, CY - 0.2, CZ - 12, granite);
    k.rail(CX, CZ - 18.8, 26, iron, 1.05, 'x', 1.6);
    for (const s of [-1, 1]) k.rail(CX + s * 12.8, CZ - 12, 14, iron, 1.05, 'z', 1.6);
    for (let i = 0; i < 13; i++) k.box(0.9, 1.2, 0.9, CX - 12 + i * 2, CY + 0.6, CZ - 19, granite);
    const LY = RY - 4, LX = -18;
    k.box(14, 0.4, 20, LX, LY - 0.2, CZ - 4, granite);
    k.mesh(new T.CylinderGeometry(9, 12, 6, 10), rock, LX, LY - 3.2, CZ - 4);
    k.rail(LX - 6.8, CZ - 4, 20, iron, 1.05, 'z', 1.6);
    k.rail(LX, CZ - 13.8, 14, iron, 1.05, 'x', 1.6);
    for (let i = 0; i < 10; i++) k.box(2.4, 0.4, 1.0, CX - 12 + -0.4, CY - 0.2 - (i + 1) * 0.4, CZ - 6 - i * 0.2 + 0, granite);
    for (let i = 0; i < 10; i++) k.box(2.4, 0.4, 1.0, LX + 7 - 0.4, LY - 0.2 + (i + 1) * 0.4, CZ - 10 + i * 0.6, granite);
    // the path up the rock from the lawn: a switchback of steps on the south side
    for (let i = 0; i < 26; i++) k.box(3, 0.35, 1.2, CX + 9 - i * 0.2, 0.17 + i * 0.35, CZ + 12 + 12 - i * 0.9, pathM);
    k.box(3, 0.3, 8, CX + 9 - 5.2, RY - 0.1, CZ + 4, pathM);
    k.box(40, 0.3, 4, 0, 0.05, CZ + 30, pathM);
    for (const x of [-16, 16]) k.lamp(x, CZ + 28, 4.2, iron, 0xffe6c8, 18);
    k.bench(-6, CZ + 32, 0, wood, iron, 2.2); k.bench(6, CZ + 32, 0, wood, iron, 2.2);
    k.prop('lantern', CX + 12, CY, CZ - 6, { height: 0.9 });
    k.prop('lantern', CX - 12, CY, CZ - 6, { height: 0.9 });
    const turtles: T.Mesh[] = [];
    for (let i = 0; i < 8; i++) { const t = k.mesh(new T.SphereGeometry(0.35, 8, 6), k.flat(0x3a4a2a, 0, 0.9), -10 + i * 4, 0.35, -36 + (i % 3) * 5, true); t.scale.y = 0.4; turtles.push(t); }
    if (!ctx.reduced) k.ticks.push((t) => turtles.forEach((m, i) => { m.position.x += Math.sin(t * 0.3 + i) * 0.004; m.position.z += Math.cos(t * 0.2 + i) * 0.004; }));
    k.censusWall({ x: CX, y: CY + 2.6, z: CZ + 5.2, rotY: PI, cols: 16, rows: 3, tile: 0.55, gap: 0.05, start: ctx.wallStart(200, 48), pieces: ctx.all, backing: iron });
    k.sign('BELVEDERE  ·  1869  ·  THE WEATHER STATION', 8, 0.6, CX, CY + 4.8, CZ + 5.2, 'transparent', '#e8e0c8', 70, PI);
    // the works: the parapet screens on the upper terrace, the lower terrace, the castle walls, the lawn path
    const mounts: Mount[] = [];
    for (let i = 0; i < 6; i++) { const x = CX - 10 + i * 4; k.box(3.2, 2.2, 0.16, x, CY + 1.5, CZ - 18.5, iron); mounts.push({ position: v(x, CY + 1.6, CZ - 18.4), rotation: PI, target: v(x, CY + 2, CZ - 12), width: 2.8, height: 1.7, style: 'steel', wash: false }); }
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const z = CZ - 15 + i * 5; k.box(0.16, 2.2, 3.2, CX + s * 12.5, CY + 1.5, z, iron); mounts.push({ position: v(CX + s * 12.4, CY + 1.6, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(CX, CY + 2, z), width: 2.8, height: 1.7, style: 'steel', wash: false }); }
    for (let i = 0; i < 4; i++) { const z = CZ - 12 + i * 5; k.box(0.16, 2.2, 3.2, LX - 6.5, LY + 1.5, z, iron); mounts.push({ position: v(LX - 6.4, LY + 1.6, z), rotation: PI / 2, target: v(LX, LY + 2, z), width: 2.8, height: 1.7, style: 'steel', wash: false }); }
    for (const s of [-1, 1]) mounts.push({ position: v(CX + s * 6.2, CY + 4, CZ), rotation: s < 0 ? -PI / 2 : PI / 2, target: v(CX + s * 14, CY + 3, CZ), width: 3.4, height: 2.0, style: 'gilt', wash: false });
    for (let i = 0; i < 4; i++) { const x = -14 + i * 9.3; k.box(3.6, 2.6, 0.2, x, 1.6, CZ + 32.4, iron); mounts.push({ position: v(x, 1.7, CZ + 32.28), rotation: PI, target: v(x, 2, CZ + 26), width: 3.2, height: 1.9, style: 'steel', wash: false }); }
    return { mounts, spawn: v(0, 3, CZ + 36), look: v(CX, CY + 10, CZ), eye: 3, bounds: [-30, 30, CZ - 20, CZ + 44], style: 'steel', floorY: (x, z) => {
      // the switchback steps up the south face, the upper terrace and castle floor, the west stair, the lower terrace
      if (Math.abs(x - (CX + 9 - 2.6)) < 2.6 && z < CZ + 24.6 && z > CZ + 0.5) return Math.min(RY, ((CZ + 24.6 - z) / 22.5) * RY);
      if (Math.abs(x - (CX + 3.8)) < 1.6 && z <= CZ + 8 && z > CZ - 0.5) return RY;
      if (Math.abs(x - CX) < 13 && z < CZ - 5 && z > CZ - 19) return CY;
      if (Math.abs(x - CX) < 6.4 && z <= CZ + 5.4 && z >= CZ - 5.4) return CY;
      if (Math.abs(x - (LX + 6.6)) < 1.3 && z > CZ - 10.5 && z < CZ - 4) return LY + Math.min(4, ((z - (CZ - 10.5)) / 6.5) * 4);
      if (Math.abs(x - LX) < 7 && z > CZ - 14 && z < CZ + 6) return LY;
      return 0;
    } };
  },
};

/* ---------------- 53 THE HIGH BRIDGE ---------------- */
export const highbridge: RoomDef = {
  id: 'highbridge',
  name: 'The aqueduct walk',
  area: 'THE HIGH BRIDGE',
  mood: 'Blue hour',
  color: '#8898b8',
  description: 'The oldest bridge in the city, an aqueduct on stone arches across the Harlem River, the walk on top from the Bronx to the water tower on the Manhattan bluff.',
  signatures: 'The tall masonry arches on the Bronx bank and the steel arch over the river, the brick paved walkway with iron railings and lamps, the octagonal water tower on the Manhattan cliff, the river and the Deegan below.',
  build(k, ctx) {
    k.sky({ top: 0x223a6e, horizon: 0xc88a70, ground: 0x1a1e26, fog: 0.0022, sun: { az: 4.9, el: 0.02, color: 0xff9a60, size: 18 }, stars: 160, haze: 0.4, env: 0.7 });
    k.hemi(0xb8c8ee, 0x1a1e26, 0.6);
    k.sun(0xffb890, 1.2, -80, 10, -30, true, 90);
    const stone = k.pbr('hbStone', X.ashlar(0x8a8070, 122, 3), 0.2, { roughness: 0.9 }),
      brickW = k.pbr('hbBrick', X.brick(0x8a5a48, 123), 0.28),
      pave = k.pbr('hbPave', X.brick(0x9a6a58, 124), 0.2, { roughness: 0.8 }),
      iron = k.flat(0x1f242a, 0.7, 0.45),
      steel = k.pbr('hbSteel', X.steel(0x4a5058, true, 125), 0.6, { metalness: 0.7, roughness: 0.45 }),
      lawn = k.pbr('hbLawn', X.grass(0x3a5a2a, 61), 0.06),
      asphalt = k.pbr('hbRoad', X.asphalt(0x2a2d31), 0.11),
      warm = k.glow(0xffd8a0);
    const DY = 36, RIVER = 0;
    // the valley: the river, the highway on the Manhattan side, the two banks rising, the Bronx flats
    k.water({ y: RIVER, color: 0x24405a, w: 80, d: 500, x: 0, z: 0, amp: 0.8 });
    k.box(24, 0.4, 500, -52, 0.2, 0, asphalt);
    k.box(60, 0.4, 500, 70, 0.2, 0, lawn);
    for (let i = 0; i < 10; i++) k.box(40 - i * 3, 4, 500, -80 - i * 2, 2 + i * 4, 0, k.pbr('hbCliff', X.ashlar(0x5a5650, 126, 1), 0.12, { roughness: 0.95 }));
    k.box(60, 0.4, 500, -130, DY + 2, 0, lawn);
    k.skyline({ z: 0, count: 16, spacing: 8, scale: 2.0, base: DY + 1, seed: 127, lit: 0.45, glow: 1.1, tint: 0x3a3a48, rows: 1, x: -300 });
    k.skyline({ z: 0, count: 16, spacing: 10, scale: 1.4, base: 0, seed: 128, lit: 0.4, glow: 0.9, tint: 0x4a4048, rows: 1, x: 270 });
    const cars: T.Mesh[] = [];
    for (let i = 0; i < 20; i++) { const c = k.mesh(new T.BoxGeometry(1.8, 1.3, 4.2), k.flat([0xd8d0c0, 0x1a1a1a, 0xc62828][i % 3], 0.4, 0.4), -52 + (i % 2 ? 4 : -4), 1.0, -200 + i * 21, true); c.userData.d = i % 2 ? 1 : -1; cars.push(c); const l = new T.Mesh(new T.BoxGeometry(1.4, 0.2, 0.1), warm); l.position.set(0, 0, c.userData.d * 2.1); c.add(l); }
    if (!ctx.reduced) k.ticks.push((_t, dt) => cars.forEach((c) => { c.position.z += c.userData.d * 16 * Math.min(dt, 0.1); if (c.position.z > 250) c.position.z = -250; if (c.position.z < -250) c.position.z = 250; }));
    // the bridge: masonry arches from the Bronx bank, the steel arch across the river, the deck on top
    const deckLen = 240;
    k.box(9, 2.4, deckLen, 0, DY - 1.2, 0, stone);
    k.box(6.4, 0.2, deckLen, 0, DY + 0.1, 0, pave);
    for (const s of [-1, 1]) { k.box(1.3, 1.2, deckLen, s * 3.85, DY + 0.6, 0, brickW); k.rail(s * 3.2, 0, deckLen, iron, 1.1, 'z', 2.4); }
    k.block(-4.6, -3.1, -deckLen / 2, deckLen / 2); k.block(3.1, 4.6, -deckLen / 2, deckLen / 2);
    for (let z = -100; z <= 100; z += 40) for (const s of [-1, 1]) k.lamp(s * 2.7, z, 3.6, iron, 0xffd9a8, 22);
    for (let i = 0; i < 8; i++) { const z = 40 + i * 24; k.box(9, DY - 2, 5, 0, (DY - 2) / 2, z, stone); k.arch(15, 30, 9, 0, 0, z + 12, stone, false, 0.55).rotation.y = PI / 2; }
    const arcPts: T.Vector3[] = []; for (let i = 0; i <= 24; i++) { const t = i / 24; arcPts.push(v(0, RIVER + 4 + Math.sin(t * PI) * (DY - 10), -60 + t * 100)); }
    for (const s of [-1, 1]) { k.curve(arcPts.map((p) => v(p.x + s * 4, p.y, p.z)), 0.6, steel, 24); for (let i = 1; i < 24; i++) k.beam(arcPts[i].clone().setX(s * 4), v(s * 4, DY - 2.4, arcPts[i].z), 0.14, steel, 4); }
    for (let i = 0; i <= 24; i += 2) k.beam(arcPts[i].clone().setX(-4), arcPts[i].clone().setX(4), 0.14, steel, 4);
    for (const z of [-62, 42]) k.box(12, DY - 2, 8, 0, (DY - 2) / 2, z, stone);
    for (let i = 0; i < 3; i++) { const z = -80 - i * 24; k.box(9, DY - 2, 5, 0, (DY - 2) / 2, z, stone); k.arch(15, 30, 9, 0, 0, z - 12, stone, false, 0.55).rotation.y = PI / 2; }
    // the water tower on the Manhattan bluff and the Bronx approach with its steps
    const TX = -120, TZ = -20;
    k.mesh(new T.CylinderGeometry(4.6, 5.2, 48, 8), stone, TX, DY + 2 + 24, TZ);
    k.mesh(new T.CylinderGeometry(5.6, 4.6, 4, 8), stone, TX, DY + 2 + 50, TZ);
    k.mesh(new T.ConeGeometry(5.8, 6, 8), k.pbr('hbCopper', X.patina(0x5f9a8c), 0.6), TX, DY + 2 + 55, TZ);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; k.box(0.6, 2.2, 0.3, TX + Math.cos(a) * 4.9, DY + 2 + 44, TZ + Math.sin(a) * 4.9, warm).rotation.y = -a; }
    k.point(TX, DY + 2 + 46, TZ, 0xffd8a0, 120, 60);
    k.box(24, 0.4, 40, -114, DY + 0.05, 0, pave);
    k.block(-130, -104, -21, -19);
    for (let i = 0; i < 12; i++) k.box(6, 0.34, 1.0, 118 + i * 0.4, DY - 0.17 - i * 0.34, i * -0.9, stone);
    k.box(30, 0.4, 30, 130, DY - 4.2 + 0.05, -10, pave);
    k.crowd([v(-0.6, DY, -110), v(0.6, DY, -40), v(-0.6, DY, 30), v(0.6, DY, 110)], 22, { seed: 53, speed: 1.0, spread: 2.4, animate: !ctx.reduced });
    k.censusWall({ x: -3.22, y: DY + 1.9, z: -20, rotY: PI / 2, cols: 30, rows: 2, tile: 0.55, gap: 0.05, start: ctx.wallStart(1300, 60), pieces: ctx.all, backing: iron });
    k.sign('HIGH BRIDGE  ·  1848  ·  THE CROTON AQUEDUCT', 8, 0.6, 0, DY + 2.6, 121.5, '#1a1c22', '#e8dcc0', 70, PI, { border: true });
    // the works: panels on the parapets along the walk, on the tower plaza, at the Bronx landing
    const mounts: Mount[] = [];
    for (let i = 0; i < 12; i++) { const z = -100 + i * 18; const s = i % 2 ? 1 : -1; k.box(0.16, 2.0, 3.0, s * 3.4, DY + 1.9, z, iron); mounts.push({ position: v(s * 3.3, DY + 2.0, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, DY + 2, z), width: 2.8, height: 1.7, style: 'steel', wash: false }); }
    for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2; const x = TX + Math.cos(a) * 9, z = TZ + Math.sin(a) * 9; k.box(0.2, 3, 3.6, x, DY + 1.8, z, iron).rotation.y = -a + PI / 2; mounts.push({ position: v(x - Math.cos(a) * 0.14, DY + 2.0, z - Math.sin(a) * 0.14), rotation: -a + PI / 2, target: v(TX + Math.cos(a) * 3, DY + 2, TZ + Math.sin(a) * 3), width: 3.2, height: 1.9, style: 'steel', wash: false }); }
    for (let i = 0; i < 4; i++) { const x = 118 + i * 6; k.box(3.6, 2.6, 0.2, x + 2, DY - 4 + 1.7, 4.8, iron); mounts.push({ position: v(x + 2, DY - 4 + 1.8, 4.68), rotation: PI, target: v(x + 2, DY - 2, -4), width: 3.2, height: 1.9, style: 'steel', wash: false }); }
    return { mounts, spawn: v(0, DY + 3, 100), look: v(TX, DY + 30, TZ), eye: 3, bounds: [-132, 140, -124, 124], style: 'steel', floorY: (x, z) => { if (Math.abs(x) < 4.6 && Math.abs(z) < deckLen / 2) return DY; if (x < -104 && x > -130 && Math.abs(z) < 20) return DY; if (x >= 118 && x < 124 && z > -12 && z < 2) return DY - Math.min(4, ((x - 118) / 6) * 4); if (x >= 124) return DY - 4; return DY; } };
  },
};

/* ---------------- 54 ARTHUR AVENUE ---------------- */
export const arthuravenue: RoomDef = {
  id: 'arthuravenue',
  name: 'The market hall',
  area: 'ARTHUR AVENUE',
  mood: 'Saturday morning',
  color: '#c89a5a',
  description: 'The Belmont street of bakeries and butchers, then the covered retail market: stalls under one roof, hanging provolone and salami, the works over the counters.',
  signatures: 'The 1940 market hall with its skylit steel roof, the long aisles of stalls, cheeses and sausages hung from rails, crates of produce, cigar rollers by the door, the avenue of awnings outside.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad0, horizon: 0xeae8e0, ground: 0x6a6660, fog: 0.0022, sun: { az: 2.8, el: 0.7, color: 0xfff4e6, size: 12 }, env: 0.9 });
    k.hemi(0xf6f0e6, 0x4a4038, 0.85);
    k.sun(0xfff0d8, 1.8, 30, 60, 40, true, 70);
    const brick = k.pbr('aaBrick', X.brick(0x8a5a48, 129), 0.28),
      cream = k.pbr('aaCream', X.plaster(0xe8dcc0, 62), 0.3),
      floorC = k.pbr('aaFloor', X.concrete(0x9a948a, 63), 0.3, { roughness: 0.8 }),
      steel = k.pbr('aaSteel', X.steel(0x4a5058, true, 130), 0.6, { metalness: 0.7 }),
      glass = k.glass(0xffffff, 0.12, 0.05),
      wood = k.pbr('aaWood', X.planks(0x8a6a48, 5, 131), 1.0),
      crate = k.pbr('aaCrate', X.planks(0xb89a6a, 3, 132, 0.3), 0.8),
      green = k.flat(0x2e6a3a, 0, 0.7),
      redA = k.flat(0xb8202a, 0, 0.8),
      cheese = k.flat(0xe8d090, 0, 0.6),
      salami = k.flat(0x7a2a2a, 0, 0.7),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      warm = k.glow(0xffe0b0);
    // the avenue: a street of low brick buildings with awnings both sides, the market's brick front on the west
    street(k, { w: 16, len: 140, z: 40, x: 0 });
    blockFront(k, { x: 8, z0: 100, count: 12, face: -1, seed: 133, h: [10, 16] });
    for (let i = 0; i < 12; i++) { const z = 100 - i * 8; const m = i % 3 === 0 ? green : i % 3 === 1 ? redA : cream; const aw = k.box(2.6, 0.1, 6, 9.6, 3.6, z, m); aw.rotation.z = 0.25; for (let dz = -2.6; dz <= 2.6; dz += 1.3) k.box(0.05, 0.5, 0.06, 8.6, 3.05, z + dz, m); }
    const MX = -8, MZ = 6, MW = 30, MD = 44, MH = 9;
    k.box(0.6, MH, MD + 8, MX, MH / 2, MZ - MD / 2, brick);
    k.block(MX - 0.4, MX + 0.4, MZ - MD - 4, MZ - 7); k.block(MX - 0.4, MX + 0.4, MZ - 3, MZ + 4);
    k.box(6, 5, 0.8, MX, 2.5, MZ - 5, brick);
    k.arch(5, 4.6, 0.8, MX, 0, MZ - 5, cream, false, 0.8).rotation.y = PI / 2;
    k.box(8, 1.6, 1.2, MX + 0.2, 6.2, MZ - 5, cream);
    k.sign('ARTHUR AVENUE RETAIL MARKET', 7.4, 1.2, MX + 0.42, 6.2, MZ - 5, '#e8dcc0', '#8a2a1a', 90, PI / 2, { border: true });
    for (const s of [-1, 1]) { k.box(0.8, 0.8, 0.8, MX + 1.2, 0.4, MZ - 5 + s * 3.4, wood); k.box(0.6, 0.6, 0.6, MX + 1.2, 1.1, MZ - 5 + s * 3.4, crate); }
    // the hall: brick walls, a skylit steel roof with trusses, the concrete floor
    k.box(MW, 0.4, MD, MX - MW / 2, -0.2, MZ - MD / 2, floorC);
    k.box(MW, MH, 0.6, MX - MW / 2, MH / 2, MZ, brick);
    k.box(MW, MH, 0.6, MX - MW / 2, MH / 2, MZ - MD, brick);
    k.box(0.6, MH, MD, MX - MW, MH / 2, MZ - MD / 2, brick);
    k.block(MX - MW - 0.5, MX - MW + 0.5, MZ - MD, MZ); k.block(MX - MW, MX, MZ - 0.5, MZ + 0.5); k.block(MX - MW, MX, MZ - MD - 0.5, MZ - MD + 0.5);
    for (let z = MZ - 2; z > MZ - MD; z -= 6) { for (const x of [MX - 1, MX - MW + 1]) k.box(0.4, MH, 0.4, x, MH / 2, z, steel); k.box(MW, 0.4, 0.3, MX - MW / 2, MH - 0.2, z, steel); for (let i = 1; i < 6; i++) k.beam(v(MX - MW + i * 5, MH - 0.4, z), v(MX - MW + i * 5 - 2.5, MH + 1.6, z), 0.08, steel, 4), k.beam(v(MX - MW + i * 5, MH - 0.4, z), v(MX - MW + i * 5 + 2.5, MH + 1.6, z), 0.08, steel, 4); }
    const roof = k.box(MW + 1, 0.3, MD + 1, MX - MW / 2, MH + 2.4, MZ - MD / 2, glass); void roof;
    k.box(MW + 1, 0.3, 0.6, MX - MW / 2, MH + 2.4, MZ - MD / 2, steel);
    for (let z = MZ - 6; z > MZ - MD; z -= 12) k.point(MX - MW / 2, MH - 1.5, z, 0xfff0d8, 30, 24);
    // the stalls: two aisles of counters, produce crates, the cheese and salami rails, a cafe corner
    const stall = (x: number, z: number, len: number, kind: number) => {
      k.box(2.2, 1.0, len, x, 0.5, z, wood); k.box(2.4, 0.08, len + 0.2, x, 1.04, z, kind === 2 ? cheese : crate);
      k.block(x - 1.2, x + 1.2, z - len / 2, z + len / 2);
      k.box(2.6, 0.06, len + 0.4, x, 3.4, z, green);
      for (const dz of [-len / 2 + 0.3, len / 2 - 0.3]) k.box(0.06, 3.4, 0.06, x - 1.2, 1.7, z + dz, steel), k.box(0.06, 3.4, 0.06, x + 1.2, 1.7, z + dz, steel);
      k.point(x, 3.0, z, 0xffe6c0, 14, 8);
      const rnd = X.mulberry(54 + Math.round(x * 3 + z));
      if (kind === 0) for (let i = 0; i < len / 0.8; i++) { const cx = x + (rnd() - 0.5) * 1.4, cz = z - len / 2 + 0.4 + i * 0.8; k.box(0.7, 0.4, 0.5, cx, 1.3, cz, crate); for (let j = 0; j < 6; j++) k.sphere(0.1, cx - 0.25 + (j % 3) * 0.25, 1.56, cz - 0.12 + Math.floor(j / 3) * 0.24, [redA, green, k.flat(0xf1c531, 0, 0.6), k.flat(0xe87a2a, 0, 0.6)][Math.floor(rnd() * 4)], 6); }
      if (kind === 1) { k.box(0.04, 0.04, len, x, 3.0, z, steel); for (let i = 0; i < len / 0.5; i++) { const cz = z - len / 2 + 0.25 + i * 0.5; k.cyl(0.11, 0.7 + rnd() * 0.4, x + (i % 2 ? 0.4 : -0.4), 2.5, cz, salami, 0.09, 8); k.beam(v(x + (i % 2 ? 0.4 : -0.4), 3.0, cz), v(x + (i % 2 ? 0.4 : -0.4), 2.9, cz), 0.02, steel, 3); } }
      if (kind === 2) { k.box(0.04, 0.04, len, x, 3.0, z, steel); for (let i = 0; i < len / 0.8; i++) { const cz = z - len / 2 + 0.4 + i * 0.8; k.mesh(new T.SphereGeometry(0.3, 10, 8), cheese, x, 2.4, cz).scale.set(1, 1.5, 1); k.cyl(0.02, 0.5, x, 2.95, cz, steel, 0.02, 4); } for (let i = 0; i < len / 0.7; i++) k.cyl(0.26, 0.2, x + 0.5, 1.2, z - len / 2 + 0.35 + i * 0.7, cheese, 0.26, 12); }
    };
    stall(MX - 6, MZ - 12, 12, 0); stall(MX - 6, MZ - 30, 14, 1); stall(MX - 15, MZ - 12, 12, 2); stall(MX - 15, MZ - 30, 14, 0); stall(MX - 24, MZ - 12, 12, 1); stall(MX - 24, MZ - 30, 14, 2);
    for (let i = 0; i < 4; i++) { const x = MX - 4 - i * 2.6, z = MZ - 40; k.cyl(0.05, 0.7, x, 0.35, z, steel, 0.05, 8); k.cyl(0.4, 0.05, x, 0.72, z, wood, 0.4, 14); k.keepOut.push({ x, z, r: 0.6 }); }
    k.box(3, 1.1, 1.4, MX - 3, 0.55, MZ - 2.6, wood); k.block(MX - 4.5, MX - 1.5, MZ - 3.3, MZ - 1.9);
    k.crowd([v(MX + 2, 0, MZ - 5), v(MX - 4, 0, MZ - 5), v(MX - 10, 0, MZ - 8), v(MX - 10.5, 0, MZ - 24), v(MX - 19.5, 0, MZ - 34), v(MX - 19.5, 0, MZ - 10), v(MX - 28, 0, MZ - 8)], 22, { seed: 54, speed: 0.5, spread: 1.4, animate: !ctx.reduced });
    k.crowd([v(0, 0, 100), v(-1, 0, 40), v(0, 0, -20)], 24, { seed: 55, speed: 1.0, spread: 4, animate: !ctx.reduced });
    k.censusWall({ x: MX - MW + 0.34, y: 4.6, z: MZ - MD / 2, rotY: PI / 2, cols: 40, rows: 5, tile: 0.55, gap: 0.05, start: ctx.wallStart(6500, 200), pieces: ctx.all, backing: dark });
    k.sign('BELMONT  ·  THE MARKET  ·  SINCE 1940', 8, 0.6, MX - MW + 0.34, 7.8, MZ - MD / 2, 'transparent', '#e8dcc0', 70, PI / 2);
    // the works: over the stalls on hanging boards, the end walls, the awnings outside
    const mounts: Mount[] = [];
    for (const [x, z] of [[MX - 6, MZ - 12], [MX - 6, MZ - 30], [MX - 15, MZ - 12], [MX - 15, MZ - 30], [MX - 24, MZ - 12], [MX - 24, MZ - 30]]) { for (const s of [-1, 1]) { k.box(0.1, 1.6, 2.4, x + s * 1.35, 4.6, z, dark); mounts.push({ position: v(x + s * 1.3, 4.6, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(x + s * 6, 3, z), width: 2.2, height: 1.4, style: 'oak', wash: false }); } }
    for (let i = 0; i < 4; i++) { const x = MX - 4 - i * 7; mounts.push({ position: v(x, 4.4, MZ - MD + 0.34), rotation: 0, target: v(x, 3, MZ - MD + 8), width: 3.6, height: 2.1, style: 'oak', wash: true }); }
    for (let i = 0; i < 3; i++) { const x = MX - 10 - i * 7; mounts.push({ position: v(x, 4.4, MZ - 0.34), rotation: PI, target: v(x, 3, MZ - 8), width: 3.6, height: 2.1, style: 'oak', wash: true }); }
    for (let i = 0; i < 3; i++) { const z = 30 + i * 16; k.box(0.14, 2.4, 3.4, 7.9, 1.7, z, dark); mounts.push({ position: v(7.8, 1.8, z), rotation: PI / 2, target: v(0, 2, z), width: 3.0, height: 1.8, style: 'black', wash: false }); }
    return { mounts, spawn: v(2, 3, 20), look: v(MX, 4, MZ - 6), eye: 3, bounds: [MX - MW + 1, 7, MZ - MD + 1, 60], style: 'oak' };
  },
};

/* ---------------- 55 WAVE HILL ---------------- */
export const wavehill: RoomDef = {
  id: 'wavehill',
  name: 'The pergola over the river',
  area: 'WAVE HILL',
  mood: 'Late light on the Palisades',
  color: '#a8c8a0',
  description: 'The garden estate in Riverdale: the great lawn, the pergola on the terrace edge, the conservatory, and across the Hudson the cliffs of the Palisades catching the last sun.',
  signatures: 'The long timber pergola on the terrace edge, the flower garden with its rustic fence, the glass conservatory, the fieldstone house, the lawn falling to the river and the wall of the Palisades beyond.',
  build(k, ctx) {
    k.sky({ top: 0x5f8fd0, horizon: 0xf4d6a8, ground: 0x3a4a34, fog: 0.0016, sun: { az: 4.8, el: 0.16, color: 0xffc888, size: 20 }, haze: 0.35, env: 0.9 });
    k.hemi(0xfff0dc, 0x2a3a24, 0.8);
    k.sun(0xffd0a0, 2.2, -80, 26, 10, true, 100);
    const lawn = k.pbr('whLawn', X.grass(0x4a7a3a, 64), 0.06),
      stone = k.pbr('whStone', X.ashlar(0x7a7268, 134, 2), 0.18, { roughness: 0.9 }),
      timber = k.pbr('whTimber', X.planks(0x8a7a5a, 4, 135, 0.3), 0.8),
      gravel = k.pbr('whGravel', X.cobble(0xa39a86, 65), 1.1),
      glass = k.glass(0xdcecf6, 0.12, 0.04),
      white = k.flat(0xe9e6df, 0.05, 0.6),
      iron = k.flat(0x1f242a, 0.7, 0.45),
      cliff = k.pbr('palisades', X.ashlar(0x6a5a50, 136, 1), 0.06, { roughness: 0.95 }),
      bloom = [k.flat(0xd83a6a, 0, 0.8), k.flat(0xf1c531, 0, 0.8), k.flat(0xe8e2f0, 0, 0.8), k.flat(0x8a3ad8, 0, 0.8), k.flat(0xe87a2a, 0, 0.8)];
    // the estate slope, the river far below, the Palisades across
    k.box(240, 0.4, 200, 0, -0.2, 0, lawn);
    for (let i = 0; i < 12; i++) k.box(240, 3, 12, 0, -1.6 - i * 3, -70 - i * 12, lawn);
    k.water({ y: -40, color: 0x2e4a5c, w: 600, d: 400, z: -320, amp: 1.2 });
    k.box(600, 90, 60, 0, 5, -520, cliff);
    for (let i = 0; i < 20; i++) k.box(30, 90 + (i % 3) * 8, 30, -300 + i * 31, 6 + (i % 3) * 4, -530 + (i % 2) * 14, cliff);
    k.box(600, 3, 80, 0, 50, -540, k.pbr('whWoods', X.grass(0x2a4a2a, 66), 0.05));
    const rnd = X.mulberry(55);
    for (let i = 0; i < 50; i++) { const x = (rnd() - 0.5) * 220, z = 20 + rnd() * 80; if (Math.abs(x) < 26 && z < 60) continue; k.tree(x, 0, z, { kind: rnd() > 0.6 ? 'column' : 'round', h: 6 + rnd() * 6, r: 2.8 + rnd() * 2.6, leaf: [0x4a7a3a, 0x6a8a3a, 0xb8702a][Math.floor(rnd() * 3)], seed: i }); }
    for (let i = 0; i < 12; i++) { const x = -110 + i * 20; k.tree(x, -6, -74, { kind: 'round', h: 5 + rnd() * 3, r: 3 + rnd() * 2, leaf: 0x3a6a2a, seed: 100 + i }); }
    // the terrace and the pergola along its edge: stone piers, timber beams, wisteria
    const PZ = -60, PL = 60;
    k.box(PL + 10, 0.6, 10, 0, 0.3, PZ + 2, gravel);
    k.box(PL + 10, 1.4, 0.8, 0, 0.7, PZ - 3, stone);
    k.block(-PL / 2 - 5, PL / 2 + 5, PZ - 3.6, PZ - 2.4);
    for (let i = 0; i <= 10; i++) { const x = -PL / 2 + i * (PL / 10); for (const dz of [0, 5]) { k.box(0.9, 3.4, 0.9, x, 2.0, PZ - 2 + dz, stone); k.keepOut.push({ x, z: PZ - 2 + dz, r: 0.7 }); } k.box(0.3, 0.3, 6.4, x, 3.9, PZ + 0.5, timber); }
    k.box(PL + 1, 0.3, 0.4, 0, 3.9, PZ - 2, timber); k.box(PL + 1, 0.3, 0.4, 0, 3.9, PZ + 3, timber);
    for (let x = -PL / 2 + 0.6; x < PL / 2; x += 1.2) k.box(0.16, 0.24, 7, x, 4.15, PZ + 0.5, timber);
    for (let i = 0; i < 40; i++) { const x = -PL / 2 + rnd() * PL, z = PZ - 2 + rnd() * 6; k.mesh(new T.SphereGeometry(0.6 + rnd() * 0.5, 7, 5), k.flat(0x4a7a3a, 0, 0.9), x, 4.6 + rnd() * 0.5, z); if (rnd() > 0.5) k.mesh(new T.SphereGeometry(0.25, 6, 4), bloom[3], x, 3.6 + rnd() * 0.6, z); }
    for (const x of [-20, 0, 20]) k.bench(x, PZ + 1.2, 0, timber, iron, 2.2);
    // the flower garden inside a rustic fence, the conservatory, the fieldstone house
    const GZ = -20;
    for (let i = 0; i < 60; i++) { const x = -18 + rnd() * 36, z = GZ - 10 + rnd() * 20; k.box(0.9, 0.5, 0.9, x, 0.25, z, k.flat(0x3a6a2a, 0, 0.9)); for (let j = 0; j < 5; j++) k.sphere(0.12, x + (rnd() - 0.5) * 0.8, 0.6 + rnd() * 0.3, z + (rnd() - 0.5) * 0.8, bloom[Math.floor(rnd() * 5)], 5); }
    for (const s of [-1, 1]) { k.box(40, 0.06, 0.06, 0, 0.9, GZ + s * 11, timber); for (let x = -20; x <= 20; x += 2) k.box(0.1, 1.0, 0.1, x, 0.5, GZ + s * 11, timber); k.box(0.06, 0.06, 22, s * 20, 0.9, GZ, timber); }
    k.block(-20.5, 20.5, GZ - 11.5, GZ - 10.5); k.block(-20.5, 20.5, GZ + 10.5, GZ + 11.5); k.block(-20.5, -19.5, GZ - 11, GZ + 11); k.block(19.5, 20.5, GZ - 11, GZ + 11);
    k.box(2.4, 0.3, 24, 0, 0.1, GZ, gravel);
    const CX = 34, CZ = -30;
    k.box(14, 0.4, 10, CX, 0.2, CZ, stone);
    for (let i = 0; i < 8; i++) { const a = -PI / 2 + (i / 7) * PI; for (let j = 0; j <= 10; j++) { const z = CZ - 5 + j; k.box(0.08, 0.08, 1.0, CX + Math.cos(a) * 6, 0.4 + Math.sin(a) * 6 + 0.4, z, white); } }
    k.mesh(new T.CylinderGeometry(6, 6, 10, 16, 1, true, 0, PI), glass, CX, 0.8, CZ).rotation.set(PI / 2, 0, PI / 2);
    k.block(CX - 6.4, CX + 6.4, CZ - 5.4, CZ + 5.4);
    for (let i = 0; i < 12; i++) k.mesh(new T.SphereGeometry(0.5 + rnd() * 0.4, 7, 5), k.flat(0x3a7a3a, 0, 0.9), CX - 5 + rnd() * 10, 0.8, CZ - 4 + rnd() * 8);
    k.box(24, 8, 14, -40, 4, -20, stone);
    k.mesh(new T.ConeGeometry(15, 5, 4), k.pbr('whSlate', X.steel(0x3a3a40, false, 137), 0.4), -40, 10.5, -20).rotation.y = PI / 4;
    for (let i = 0; i < 4; i++) { k.box(1.2, 1.8, 0.2, -48 + i * 5.3, 3.2, -12.9, k.glass(0xffe0b0, 0.3, 0.1)); k.box(1.2, 1.8, 0.2, -48 + i * 5.3, 6.0, -12.9, k.glass(0xffe0b0, 0.3, 0.1)); }
    k.block(-52, -28, -27, -13);
    k.box(6, 0.3, 40, -40, 0.05, 6, gravel);
    k.censusWall({ x: -40, y: 3.0, z: -12.7, rotY: 0, cols: 16, rows: 2, tile: 0.55, gap: 0.05, start: ctx.wallStart(1000, 32), pieces: ctx.all, backing: iron });
    k.crowd([v(-40, 0, 24), v(-30, 0, -4), v(-10, 0, -8), v(10, 0, -8), v(20, 0, -34), v(0, 0, -57), v(-24, 0, -57)], 14, { seed: 56, speed: 0.6, spread: 2, animate: !ctx.reduced });
    // the works: between the pergola piers facing the terrace, in the garden on easels, the conservatory, the house wall
    const mounts: Mount[] = [];
    for (let i = 0; i < 10; i++) { const x = -PL / 2 + PL / 20 + i * (PL / 10); mounts.push({ position: v(x, 2.0, PZ - 2.6), rotation: 0, target: v(x, 2, PZ + 4), width: 2.8, height: 1.7, style: 'white', wash: false }); k.box(3.2, 2.2, 0.16, x, 2.0, PZ - 2.7, white); }
    for (let i = 0; i < 6; i++) { const x = -15 + i * 6, z = GZ + 12.6; for (const dx of [-0.7, 0.7]) k.beam(v(x + dx, 0, z + 0.4), v(x, 2.6, z), 0.05, timber, 4); k.beam(v(x, 0, z - 0.7), v(x, 2.6, z), 0.05, timber, 4); mounts.push({ position: v(x, 1.7, z - 0.1), rotation: PI, target: v(x, 2, z - 6), width: 2.4, height: 1.8, style: 'oak', wash: false }); }
    for (let i = 0; i < 3; i++) { const z = CZ - 3 + i * 3; mounts.push({ position: v(CX - 6.6, 1.9, z), rotation: PI / 2, target: v(CX - 14, 2, z), width: 2.4, height: 1.4, style: 'white', wash: false }); k.box(0.12, 1.8, 2.8, CX - 6.5, 1.9, z, white); }
    for (let i = 0; i < 3; i++) { const x = -48 + i * 8; mounts.push({ position: v(x, 1.8, -12.8), rotation: 0, target: v(x, 2, -4), width: 3.2, height: 1.9, style: 'oak', wash: false }); }
    return { mounts, spawn: v(-6, 3, 30), look: v(0, 6, PZ), eye: 3, bounds: [-70, 60, PZ - 2, 60], style: 'white' };
  },
};

/* ---------------- 56 GANTRY PLAZA ---------------- */
export const gantry: RoomDef = {
  id: 'gantry',
  name: 'The gantries',
  area: 'GANTRY PLAZA',
  mood: 'Neon on the water',
  color: '#e05a5a',
  description: 'The Long Island City waterfront: the two iron transfer gantries, the piers reaching into the East River, the great neon sign, the whole Midtown skyline across the water at night.',
  signatures: 'The pair of black riveted gantry frames with their lettering, four long piers with benches and lounge chairs, the red neon bottle sign on its frame, the towers of Midtown mirrored in the river.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x0e1630, horizon: 0x4a4a6a, ground: 0x0a0c14, fog: 0.0016, stars: 320, env: 0.6 });
    k.hemi(0xb8c8ee, 0x0e1018, 0.5);
    k.sun(0xc8d0ff, 0.4, 60, 50, -40, true, 90);
    const iron = k.pbr('gpIron', X.steel(0x1e2024, true, 138), 0.6, { metalness: 0.7, roughness: 0.5 }),
      deck = k.pbr('gpDeck', X.boardwalk(0x6a5a48), 0.5),
      pave = k.pbr('gpPave', X.pavers(0x7a7a76, 67), 0.4),
      lawn = k.pbr('gpLawn', X.grass(0x2e4a2a, 68), 0.06),
      steel = k.flat(0x8c98a4, 0.9, 0.3),
      neon = k.glow(0xff3a3a),
      warm = k.glow(0xffe0b0),
      dark = k.flat(0x111216, 0.5, 0.6),
      glassT = k.pbr('gpGlass', X.windows(139, 0.55, 0x3a4a6a, false), 0.11, { emissive: 0xffffff, emissiveIntensity: 1.2, roughness: 0.3, metalness: 0.5, stretch: 0.42 });
    // the river and Midtown across it, the LIC towers behind
    k.water({ y: -1.6, color: 0x14243a, w: 700, d: 500, z: -200, amp: 0.8 });
    k.skyline({ z: -330, count: 46, spacing: 8, scale: 5.2, base: -1.6, seed: 140, lit: 0.55, glow: 1.6, tint: 0x1e2434, spires: true });
    k.skyline({ z: -380, count: 40, spacing: 10, scale: 4.2, base: -1.6, seed: 141, lit: 0.5, glow: 1.3, tint: 0x2a3040, rows: 1 });
    for (const [x, z, w, h] of [[-60, 70, 26, 110], [-20, 90, 30, 140], [30, 80, 24, 100], [70, 70, 28, 120]]) k.box(w as number, h as number, w as number, x as number, (h as number) / 2, z as number, glassT);
    k.box(300, 0.4, 120, 0, -0.2, 40, lawn);
    k.box(300, 0.3, 30, 0, 0.05, -4, pave);
    // the piers: four long decks on piles with benches, lounge chairs on the last one
    for (let i = 0; i < 4; i++) { const x = -60 + i * 40; const len = 50 + (i % 2) * 20; k.box(8, 0.5, len, x, 0.3, -18 - len / 2, deck); for (let z = -22; z > -18 - len; z -= 6) for (const s of [-1, 1]) k.cyl(0.4, 6, x + s * 3.4, -3, z, iron, 0.4, 8); k.rail(x - 3.9, -18 - len / 2, len, steel, 1.05, 'z', 2); k.rail(x + 3.9, -18 - len / 2, len, steel, 1.05, 'z', 2); k.rail(x, -18 - len + 0.1, 8, steel, 1.05, 'x', 2); for (let z = -30; z > -18 - len + 6; z -= 12) k.bench(x - 2.4, z, PI / 2, deck, steel, 2.0); for (let z = -26; z > -18 - len; z -= 10) k.lamp(x + 3.2, z, 3.6, dark, 0xffe0b0, 16); }
    for (let i = 0; i < 6; i++) { const x = 60 - 3 + (i % 2) * 5, z = -40 - Math.floor(i / 2) * 6; const c = k.box(0.7, 0.1, 1.8, x, 0.7, z, deck); c.rotation.x = -0.3; k.box(0.7, 0.1, 0.9, x, 0.45, z + 1.1, deck); k.keepOut.push({ x, z, r: 0.9 }); }
    // the gantries: two black riveted frames, lettered, over the old float bridges
    for (const gx of [-30, 10]) {
      for (const s of [-1, 1]) for (const dz of [-6, 6]) k.box(1.4, 24, 1.4, gx + s * 9, 12, -14 + dz, iron);
      for (const dz of [-6, 6]) k.box(20, 2.4, 1.4, gx, 24, -14 + dz, iron);
      for (const s of [-1, 1]) { k.box(1.4, 2.4, 14, gx + s * 9, 24, -14, iron); for (let y = 4; y < 22; y += 4) k.beam(v(gx + s * 9, y, -20), v(gx + s * 9, y + 4, -8), 0.14, iron, 4), k.beam(v(gx + s * 9, y + 4, -20), v(gx + s * 9, y, -8), 0.14, iron, 4); }
      for (let y = 4; y < 22; y += 4) for (const dz of [-6, 6]) k.beam(v(gx - 9, y, -14 + dz), v(gx + 9, y + 4, -14 + dz), 0.14, iron, 4), k.beam(v(gx - 9, y + 4, -14 + dz), v(gx + 9, y, -14 + dz), 0.14, iron, 4);
      k.sign('LONG ISLAND', 16, 1.8, gx, 24, -20.8, '#0e0e10', '#f4f0e8', 120, PI, { border: true });
      k.box(14, 0.4, 14, gx, 0.2, -14, deck);
      k.block(gx - 9.8, gx - 8.2, -21, -7); k.block(gx + 8.2, gx + 9.8, -21, -7);
      for (const s of [-1, 1]) k.point(gx + s * 6, 20, -14, 0xffe0b0, 30, 24);
    }
    // the neon sign on its frame, blinking slowly
    const SX = 60, SZ = 30;
    for (const dx of [-14, 14]) k.box(0.6, 20, 0.6, SX + dx, 10, SZ, iron);
    for (let y = 4; y < 20; y += 4) k.box(28, 0.3, 0.3, SX, y, SZ, iron);
    const bottle = k.mesh(new T.BoxGeometry(24, 6, 0.3), dark, SX, 15, SZ - 0.2);
    void bottle;
    k.sign('LONG ISLAND CITY', 22, 4, SX, 15, SZ - 0.4, '#141416', '#ff4a4a', 200, PI, { border: true });
    const tubes: T.Mesh[] = [];
    for (let i = 0; i < 3; i++) tubes.push(k.mesh(new T.BoxGeometry(24.4, 0.14, 0.14), neon, SX, 12.4 + i * 2.6, SZ - 0.5, true));
    const signLight = k.point(SX, 15, SZ - 6, 0xff4a4a, 120, 50);
    if (!ctx.reduced) k.ticks.push((t) => { const on = Math.sin(t * 0.8) > -0.85 ? 1 : 0.15; tubes.forEach((m) => ((m.material as T.MeshBasicMaterial).opacity = on)); signLight.intensity = 120 * on; });
    tubes.forEach((m) => ((m.material as T.MeshBasicMaterial).transparent = true));
    const ferry = new T.Group(); const hull = new T.Mesh(new T.BoxGeometry(8, 3, 26), k.flat(0xe6e2da, 0.2, 0.6)); hull.position.y = 1.2; ferry.add(hull); const cab = new T.Mesh(new T.BoxGeometry(6, 3, 16), k.flat(0x2b4a8a, 0.2, 0.6)); cab.position.y = 4; ferry.add(cab); for (let i = -6; i <= 6; i += 2) { const w = new T.Mesh(new T.PlaneGeometry(1.4, 1), warm); w.position.set(3.05, 4, i); w.rotation.y = PI / 2; ferry.add(w); } k.add(ferry);
    if (!ctx.reduced) k.rider(ferry, k.spline([v(-200, -1.2, -100), v(0, -1.2, -80), v(200, -1.2, -110), v(0, -1.2, -140)], true), 5, 0);
    k.crowd([v(-100, 0, -4), v(-40, 0, -6), v(0, 0, -4), v(50, 0, -6), v(100, 0, -4)], 30, { seed: 57, speed: 0.9, spread: 5, animate: !ctx.reduced });
    k.censusWall({ x: 0, y: 3.4, z: 12.34, rotY: PI, cols: 40, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(7000, 160), pieces: ctx.all, backing: dark });
    k.box(24, 7, 0.6, 0, 3.5, 12.6, dark);
    for (const x of [-9, 9]) k.point(x, 5, 9, 0xffe0b0, 20, 14);
    // the works: light boxes along the esplanade, on the pier ends, on the gantry legs
    const mounts: Mount[] = [];
    for (let i = 0; i < 8; i++) { const x = -110 + i * 30; if (Math.abs(x) < 14) continue; k.box(4.6, 3.2, 0.4, x, 2.0, 12.6, dark); mounts.push({ position: v(x, 2.1, 12.36), rotation: PI, target: v(x, 2, 4), width: 4.2, height: 2.5, style: 'black', wash: true }); }
    for (let i = 0; i < 4; i++) { const x = -60 + i * 40; const len = 50 + (i % 2) * 20; const z = -18 - len + 0.6; k.box(6, 3, 0.3, x, 2.0, z, dark); mounts.push({ position: v(x, 2.1, z + 0.18), rotation: 0, target: v(x, 2, z + 8), width: 4.6, height: 2.6, style: 'black', wash: true }); }
    for (const gx of [-30, 10]) for (const s of [-1, 1]) { k.box(0.2, 2.8, 4, gx + s * 8.2, 2.2, -14, dark); mounts.push({ position: v(gx + s * 8.05, 2.3, -14), rotation: s < 0 ? -PI / 2 : PI / 2, target: v(gx, 2, -14), width: 3.6, height: 2.1, style: 'black', wash: false }); }
    for (let i = 0; i < 4; i++) { const x = 44 + i * 8; mounts.push({ position: v(x, 4.2, SZ - 0.5 - 8), rotation: PI, target: v(x, 3, 10), width: 3.2, height: 1.9, style: 'black', wash: false }); k.box(3.6, 2.4, 0.3, x, 4.2, SZ - 8.3, dark); k.box(0.2, 5.4, 0.2, x - 1.7, 2.7, SZ - 8.3, iron); k.box(0.2, 5.4, 0.2, x + 1.7, 2.7, SZ - 8.3, iron); }
    return { mounts, spawn: v(-10, 3, 6), look: v(-10, 14, -120), eye: 3, bounds: [-120, 120, -90, 40], style: 'black' };
  },
};
