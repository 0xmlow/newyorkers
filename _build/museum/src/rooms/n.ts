/* Rooms 62 to 66: Studio 8H, Carnegie Hall, the Village Vanguard, Rucker Park, 1520 Sedgwick Avenue.
   Fourth set: the cultural icons. Every room here is marked fresh in CURATION, so the walls show New Yorkers no other room has shown. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront } from './f';

const PI = Math.PI;

/* ---------------- 62 STUDIO 8H ---------------- */
export const studio8h: RoomDef = {
  id: 'studio8h',
  name: 'Live from New York',
  area: 'STUDIO 8H',
  mood: 'Eleven thirty Saturday',
  color: '#e8b040',
  description: 'The lobby of the tower on the plaza, the elevator up, then the studio: the home base stage, the band stand, the cameras, the bleachers, the cue cards, the works on every set wall.',
  signatures: 'The art deco lobby with its dark marble and gold leaf ceiling, the studio floor with its brick home base arch and the musical guest stage, the boom cameras and the applause sign, the steep audience bleachers, the cue card easel.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x0e1424, horizon: 0x2a2a44, ground: 0x0a0a10, fog: 0.004, stars: 160, env: 0.5 });
    k.hemi(0xffe4c8, 0x14100c, 0.4);
    const brick = k.pbr('shBrick', X.brick(0x8a5a48, 164), 0.28),
      floorS = k.pbr('shFloor', X.concrete(0x3a3a3c, 79), 0.4, { roughness: 0.6 }),
      dark = k.flat(0x111216, 0.5, 0.7),
      steel = k.flat(0x8c98a4, 0.9, 0.3),
      black = k.flat(0x0a0a0c, 0.3, 0.8),
      wood = k.pbr('shWood', X.planks(0x6a4a30, 5, 165), 1.0),
      red = k.pbr('shSeats', X.velvet(0x8a1a22), 0.4, { roughness: 0.95 }),
      marble = k.pbr('shMarble', X.marble(0x3a2e2a, 0x8a6a4a, 13), 0.4, { roughness: 0.3 }),
      gold = k.pbr('shGold', X.gilt(0xd0a852), 2, { metalness: 0.85, roughness: 0.3 }),
      glow = k.glow(0xffe0b0),
      neon = k.glow(0xff4a3a),
      white = k.flat(0xf4f0e8, 0, 0.8),
      glass = k.glass(0xdcecf6, 0.14, 0.04);
    // the plaza and the lobby of the tower: dark marble, gold ceiling, the elevator bank
    const LZ = 20, LW = 30, LD = 24;
    k.box(120, 0.4, 60, 0, -0.2, LZ + 30, k.pbr('shPlaza', X.pavers(0x6a6a66, 80), 0.4));
    k.box(80, 200, 40, 0, 100, LZ - LD - 20, k.pbr('shTower', X.windows(166, 0.4, 0x6a6660, true), 0.12, { emissive: 0xffffff, emissiveIntensity: 0.9, stretch: 0.42 }));
    for (let x = -36; x <= 36; x += 6) k.box(1.0, 200, 0.6, x, 100, LZ + 0.2, k.pbr('shLime', X.ashlar(0xb8ad97, 167, 3), 0.22));
    k.box(LW, 0.3, LD, 0, 0.15, LZ - LD / 2, marble);
    for (const s of [-1, 1]) { k.box(0.6, 10, LD, s * LW / 2, 5, LZ - LD / 2, marble); k.block(s * LW / 2 - 0.5, s * LW / 2 + 0.5, LZ - LD, LZ); }
    k.box(LW, 0.4, LD, 0, 10, LZ - LD / 2, gold);
    for (const x of [-9, 0, 9]) { k.box(3, 5, 0.4, x, 2.5, LZ - LD + 0.3, gold); k.box(2.2, 4.4, 0.1, x, 2.5, LZ - LD + 0.05, dark); k.point(x, 6, LZ - LD + 3, 0xffe6c0, 20, 12); }
    k.block(-LW / 2, LW / 2, LZ - LD - 0.5, LZ - LD + 0.5);
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) k.point(s * 8, 8, LZ - 3 - i * 6, 0xffe0b0, 18, 12);
    k.sign('STUDIO 8H  ·  EIGHTH FLOOR  ·  THE MUSEUM TONIGHT', 12, 0.7, 0, 7.6, LZ - LD + 0.35, 'transparent', '#f4e4b0', 70, 0);
    // the studio: a big dark box with a lighting grid, reached through the elevator wall (a door in the middle)
    const SZ = LZ - LD, SW = 44, SD = 40, SH = 12;
    k.block(-LW / 2, -1.6, SZ - 0.6, SZ + 0.6); k.block(1.6, LW / 2, SZ - 0.6, SZ + 0.6);
    k.box(SW, 0.4, SD, 0, -0.2, SZ - SD / 2, floorS);
    for (const s of [-1, 1]) { k.box(0.6, SH, SD, s * SW / 2, SH / 2, SZ - SD / 2, black); k.block(s * SW / 2 - 0.5, s * SW / 2 + 0.5, SZ - SD, SZ); }
    k.box(SW, SH, 0.6, 0, SH / 2, SZ - SD, black);
    k.block(-SW / 2, SW / 2, SZ - SD - 0.5, SZ - SD + 0.5);
    k.box(SW, 0.4, SD, 0, SH, SZ - SD / 2, black);
    for (let x = -SW / 2 + 2; x < SW / 2; x += 3) k.box(0.12, 0.12, SD, x, SH - 1.4, SZ - SD / 2, steel);
    for (let z = SZ - 2; z > SZ - SD; z -= 3) k.box(SW, 0.12, 0.12, 0, SH - 1.4, z, steel);
    // home base: the brick arch with the band stand at left, the guest stage at right
    const HX = 0, HZ = SZ - SD + 6;
    k.box(14, 8, 1.0, HX, 4, HZ - 3, brick);
    k.arch(6, 7, 1.2, HX, 0, HZ - 3, brick, false, 0.85);
    k.box(14, 0.4, 8, HX, 0.2, HZ + 1, wood);
    k.block(HX - 7, HX + 7, HZ - 3.6, HZ - 2.4);
    k.box(10, 0.6, 6, -16, 0.3, HZ + 2, black);
    for (let i = 0; i < 5; i++) { k.cyl(0.05, 1.1, -19 + i * 1.5, 0.85, HZ + 1, steel, 0.05, 6); k.box(0.5, 0.35, 0.3, -19 + i * 1.5, 1.4, HZ + 1, black); }
    k.cyl(0.3, 0.5, -14, 1.2, HZ + 3.5, steel, 0.3, 12); k.cyl(0.28, 0.02, -14, 1.5, HZ + 3.5, gold, 0.28, 16);
    k.block(-21, -11, HZ - 1, HZ + 5);
    k.box(12, 0.6, 8, 16, 0.3, HZ + 2, black);
    k.cyl(0.05, 1.6, 16, 1.4, HZ + 4, steel, 0.05, 6); k.cyl(0.08, 0.2, 16, 2.3, HZ + 4, black, 0.08, 8);
    k.block(10, 22, HZ - 2, HZ + 6);
    for (const [x, z] of [[-6, HZ + 12], [6, HZ + 12], [0, HZ + 18]]) { k.box(1.2, 1.2, 1.6, x, 1.6, z, black); k.cyl(0.2, 0.6, x, 1.6, z - 1.1, black, 0.28, 12); k.beam(v(x, 0, z), v(x, 1.0, z), 0.08, steel, 4); k.box(0.8, 0.1, 0.8, x, 0.05, z, steel); k.keepOut.push({ x, z, r: 1.2 }); }
    const boom = k.beam(v(-12, 3, HZ + 20), v(-4, 5, HZ + 8), 0.08, steel, 6); void boom;
    k.box(0.8, 0.8, 1.2, -4, 5, HZ + 8, black);
    for (let i = 0; i < 8; i++) k.spot(-14 + i * 4, SH - 1.6, HZ + 10, -14 + i * 4, 0, HZ + 1, 0xfff0d8, 160, 0.5, 0.6, 30);
    // the bleachers: steep audience risers facing home base, the applause sign, the cue card easel
    const BZ = HZ + 24;
    for (let r = 0; r < 8; r++) { k.box(30, 0.6, 1.6, 0, 0.3 + r * 0.6, BZ + r * 1.6, dark); for (let x = -14; x <= 14; x += 0.7) { k.box(0.55, 0.5, 0.5, x, 0.85 + r * 0.6, BZ + r * 1.6 + 0.3, red); } }
    k.block(-15.2, 15.2, BZ - 0.8, BZ + 13.6);
    k.box(6, 1.2, 0.2, -8, SH - 2.6, HZ + 3, dark);
    k.sign('APPLAUSE', 5.6, 1.0, -8, SH - 2.6, HZ + 3.12, '#14090a', '#ff4a4a', 120, 0, { border: true });
    const app = k.mesh(new T.BoxGeometry(5.8, 0.06, 0.06), neon, -8, SH - 2.0, HZ + 3.12, true);
    if (!ctx.reduced) k.ticks.push((t) => { (app.material as T.MeshBasicMaterial).opacity = Math.sin(t * 3) > 0 ? 1 : 0.1; });
    (app.material as T.MeshBasicMaterial).transparent = true;
    k.box(0.06, 2.4, 0.06, 8, 1.2, HZ + 9, steel); k.box(0.06, 2.4, 0.06, 8.9, 1.2, HZ + 9, steel);
    k.box(1.4, 1.0, 0.04, 8.45, 2.0, HZ + 9, white);
    k.sign('LIVE FROM NEW YORK', 1.3, 0.5, 8.45, 2.0, HZ + 9.03, '#f4f0e8', '#14090a', 40, PI, { border: false });
    k.censusWall({ x: -SW / 2 + 0.34, y: 4.4, z: SZ - SD / 2, rotY: PI / 2, cols: 30, rows: 5, tile: 0.55, gap: 0.05, start: ctx.wallStart(7400, 150), pieces: ctx.all, backing: dark });
    k.crowd([v(-13, 4.4, BZ + 10), v(0, 4.4, BZ + 10), v(13, 4.4, BZ + 10)], 8, { seed: 62, speed: 0.15, spread: 1, animate: !ctx.reduced });
    // the works: the set walls (home base flanks, the band and guest stage backdrops), the studio side walls, the lobby
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) mounts.push({ position: v(HX + s * 5.5, 5.2, HZ - 2.45), rotation: 0, target: v(HX + s * 4, 3, HZ + 8), width: 2.4, height: 2.6, style: 'black', wash: true });
    for (let i = 0; i < 3; i++) { const x = -20 + i * 4; k.box(3.6, 3.0, 0.3, x, 3.6, HZ - 2.4, brick); mounts.push({ position: v(x, 3.6, HZ - 2.2), rotation: 0, target: v(x, 2, HZ + 8), width: 3.2, height: 2.4, style: 'black', wash: true }); }
    for (let i = 0; i < 3; i++) { const x = 12 + i * 4; k.box(3.6, 3.0, 0.3, x, 3.6, HZ - 2.4, black); mounts.push({ position: v(x, 3.6, HZ - 2.2), rotation: 0, target: v(x, 2, HZ + 8), width: 3.2, height: 2.4, style: 'neon', wash: false }); }
    for (let i = 0; i < 4; i++) { const z = HZ + 4 + i * 6; mounts.push({ position: v(SW / 2 - 0.34, 4.0, z), rotation: -PI / 2, target: v(SW / 2 - 8, 3, z), width: 4.4, height: 2.6, style: 'steel', wash: true }); }
    for (let i = 0; i < 3; i++) { const x = -8 + i * 8; mounts.push({ position: v(x, 4.4, SZ + 0.34), rotation: 0, target: v(x, 3, SZ + 8), width: 3.6, height: 2.1, style: 'gilt', wash: true }); }
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const z = LZ - 6 - i * 10; mounts.push({ position: v(s * (LW / 2 - 0.34), 4.0, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 3, z), width: 4.4, height: 2.6, style: 'gilt', wash: true }); }
    return { mounts, spawn: v(0, 3, LZ + 12), look: v(0, 6, LZ - 12), eye: 3, bounds: [-SW / 2 + 1, SW / 2 - 1, SZ - SD + 1, LZ + 28], style: 'black', floorY: (x, z) => { if (z > BZ - 0.8 && z < BZ + 13.6 && Math.abs(x) < 15.2) return Math.min(4.8, Math.floor((z - BZ + 0.8) / 1.6 + 1) * 0.6); return 0; } };
  },
};

/* ---------------- 63 CARNEGIE HALL ---------------- */
export const carnegie: RoomDef = {
  id: 'carnegie',
  name: 'The horseshoe',
  area: 'CARNEGIE HALL',
  mood: 'Concert black',
  color: '#c8a070',
  description: 'Fifty seventh Street, the Italianate brick front, then the hall: five curved tiers in cream and gold around the stage, the works in the boxes, practice, practice, practice.',
  signatures: 'The brown brick and terracotta facade with its arched windows, the cream and gold horseshoe auditorium with five levels curving to the stage, the red seats, the plain proscenium and the organ grille, the dressing room corridor.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x141a2e, horizon: 0x4a4050, ground: 0x0e0e12, fog: 0.003, stars: 140, env: 0.55 });
    k.hemi(0xffe4c8, 0x1a1418, 0.45);
    const brick = k.pbr('chBrick', X.brick(0x6a4436, 168), 0.28),
      terra = k.pbr('chTerra', X.ashlar(0xb89a7a, 169, 3), 0.2),
      cream = k.pbr('chCream', X.plaster(0xe8dcc8, 81), 0.35),
      gold = k.pbr('chGold', X.gilt(0xd0a852), 2, { metalness: 0.85, roughness: 0.3 }),
      red = k.pbr('chSeats', X.velvet(0x9a1a22), 0.4, { roughness: 0.95 }),
      carpet = k.pbr('chCarpet', X.carpet(0x6a1a22, 0xc79a4a), 0.5),
      stage = k.pbr('chStage', X.planks(0xb89a6a, 6, 170), 1.2, { roughness: 0.6 }),
      dark = k.flat(0x121216, 0.5, 0.7),
      glass = k.glass(0xffe0b0, 0.3, 0.1),
      warm = k.glow(0xffe0b0);
    // 57th Street and the corner facade
    street(k, { w: 22, len: 140, z: 30, x: 0 });
    blockFront(k, { x: -40, z0: 90, count: 8, face: 1, seed: 171, h: [18, 34] });
    const FZ = 8;
    k.box(60, 30, 60, 0, 15, FZ - 30, brick);
    for (let t = 0; t < 3; t++) for (let i = 0; i < 7; i++) { const x = -24 + i * 8, y = 6 + t * 8; k.arch(3, 5.6, 1.2, x, y - 2.8, FZ + 0.3, terra, false, 0.75); k.box(2.6, 4.8, 0.1, x, y - 0.4, FZ + 0.4, glass); }
    k.moulding([[0, 0], [0.9, 0], [1.0, 0.3], [0.6, 0.5], [0.8, 0.8], [0, 1.0]], 60.4, 0, 29, FZ + 0.05, terra, 0);
    k.box(12, 26, 12, 30, 43, FZ - 6, brick);
    for (let i = 0; i < 3; i++) k.arch(2.8, 6, 3, 0, 0, FZ - 1, terra, false, 0.85), k.arch(2.8, 6, 3, -8 + i * 8, 0, FZ - 1, terra, false, 0.85);
    k.block(-30, -9.4, FZ - 1.5, FZ + 1.5); k.block(-6.6, -1.4, FZ - 1.5, FZ + 1.5); k.block(1.4, 6.6, FZ - 1.5, FZ + 1.5); k.block(9.4, 30, FZ - 1.5, FZ + 1.5);
    k.box(24, 1.6, 6, 0, 8, FZ + 2.6, dark);
    k.sign('CARNEGIE HALL', 10, 1.2, 0, 8, FZ + 5.62, '#14090a', '#f4e4b0', 130, 0, { border: true });
    for (let i = 0; i < 6; i++) k.point(-10 + i * 4, 7, FZ + 4, 0xffe0b0, 10, 8);
    // the hall: a horseshoe of five tiers around the parquet, the stage at the far end
    const CZ = FZ - 30, R = 22;
    k.box(70, 0.3, 66, 0, 0.15, CZ - 2, carpet);
    k.mesh(new T.CylinderGeometry(R + 4, R + 4, 30, 48, 1, true, 0, PI), cream, 0, 15, CZ);
    k.box(2 * (R + 4), 30, 0.6, 0, 15, CZ - R - 3.5, cream);
    for (const s of [-1, 1]) { k.box(0.6, 30, R + 4, s * (R + 4), 15, CZ - (R + 4) / 2 - 1, cream); k.block(s * (R + 4) - 0.6, s * (R + 4) + 0.6, CZ - R - 4, CZ); }
    k.block(-R - 4, R + 4, CZ - R - 4, CZ - R - 3);
    k.mesh(new T.CylinderGeometry(R + 5, R + 5, 0.6, 48, 1, false, 0, PI), dark, 0, 30, CZ);
    k.box(2 * (R + 5), 0.6, R + 6, 0, 30, CZ - (R + 6) / 2, dark);
    for (let tier = 0; tier < 5; tier++) {
      const y = 4.5 + tier * 4.6, rr = R - 1 - tier * 0.4;
      const ring = k.mesh(new T.RingGeometry(rr - 3.4, rr, 48, 1, 0, PI), tier % 2 ? cream : gold, 0, y, CZ); ring.rotation.x = -PI / 2;
      const front = k.mesh(new T.CylinderGeometry(rr - 3.4, rr - 3.4, 1.1, 48, 1, true, 0, PI), gold, 0, y + 0.55, CZ);
      void front;
      for (const s of [-1, 1]) { k.box(3.4, 0.3, R + 2, s * (rr - 1.7), y, CZ - (R + 2) / 2, tier % 2 ? cream : gold); k.box(0.3, 1.1, R + 2, s * (rr - 3.4), y + 0.55, CZ - (R + 2) / 2, gold); }
      for (let i = 0; i < 12; i++) { const a = (i / 11) * PI; k.point(Math.cos(a) * (rr - 2), y + 3, CZ + Math.sin(a) * (rr - 2) * 0, 0xffe6c0, 5, 5); }
      for (let i = 0; i < 24; i++) { const a = ((i + 0.5) / 24) * PI; k.box(0.5, 0.5, 0.5, Math.cos(a) * (rr - 1.7), y + 0.45, CZ + Math.sin(a) * (rr - 1.7), red).rotation.y = -a; }
    }
    const seatG = new T.BoxGeometry(0.5, 0.55, 0.5); seatG.translate(0, 0.28, 0);
    const seats: T.Matrix4[] = [];
    for (let r = 0; r < 14; r++) { const z = CZ - 20 + r * 1.6; const half = 8 + Math.min(8, r); for (let x = -half; x <= half; x += 0.65) { if (Math.abs(x) < 1) continue; seats.push(new T.Matrix4().compose(v(x, 0.3 + r * 0.1, z), new T.Quaternion(), v(1, 1, 1))); } k.box(2 * half + 1, 0.2, 1.6, 0, 0.2 + r * 0.1, z, carpet); }
    k.instances(seatG, red, seats);
    k.block(-18, -1, CZ - 21, CZ + 2); k.block(1, 18, CZ - 21, CZ + 2);
    const SZ = CZ - R;
    k.box(26, 1.4, 12, 0, 0.7, SZ + 3, stage);
    k.box(2 * (R + 3), 10, 0.6, 0, 25, SZ - 3, cream);
    k.box(30, 26, 0.6, 0, 13, SZ - 3.02, gold);
    for (let i = 0; i < 24; i++) k.cyl(0.14, 6 + Math.abs(12 - i) * 0.3, -11.5 + i, 18, SZ - 2.6, k.flat(0xb8a878, 0.8, 0.35), 0.12, 8);
    for (let i = 0; i < 9; i++) { k.cyl(0.06, 1.1, -8 + i * 2, 1.95, SZ + 3 + (i % 2) * 1.2, dark, 0.06, 6); k.box(0.8, 0.5, 0.05, -8 + i * 2, 2.6, SZ + 3 + (i % 2) * 1.2, dark).rotation.x = -0.3; }
    k.cyl(0.3, 0.3, 0, 1.55, SZ + 7, dark, 0.3, 12); k.box(1.0, 0.8, 0.05, 0, 2.2, SZ + 7.2, dark).rotation.x = -0.4;
    k.keepOut.push({ x: 0, z: SZ + 5, r: 12 });
    for (let i = 0; i < 6; i++) k.spot(-10 + i * 4, 26, SZ + 12, -10 + i * 4, 1.4, SZ + 4, 0xfff0d8, 140, 0.4, 0.6, 40);
    k.point(0, 26, CZ - 8, 0xffe6c0, 120, 60);
    k.censusWall({ x: 0, y: 14, z: SZ - 2.7, rotY: 0, cols: 26, rows: 8, tile: 0.55, gap: 0.05, start: ctx.wallStart(7100, 208), pieces: ctx.all, backing: gold });
    k.crowd([v(-12, 0.3, CZ - 18), v(12, 0.3, CZ - 18)], 6, { seed: 63, speed: 0.2, spread: 2, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0x1a1a1a] });
    // the works: the box fronts of the first two tiers, the stage flanks, the corridor behind the parquet, the lobby
    const mounts: Mount[] = [];
    for (let tier = 0; tier < 2; tier++) { const y = 4.5 + tier * 4.6, rr = R - 1 - tier * 0.4; for (let i = 0; i < 5; i++) { const a = ((i + 0.5) / 5) * PI; const x = Math.cos(a) * (rr - 3.6), z = CZ + Math.sin(a) * (rr - 3.6); mounts.push({ position: v(x, y + 0.6, z), rotation: -a + PI / 2 + PI, target: v(0, 2, CZ - 6), width: 2.6, height: 0.9, style: 'gilt', wash: false }); } }
    for (const s of [-1, 1]) mounts.push({ position: v(s * 14.5, 6, SZ - 2.7), rotation: 0, target: v(s * 8, 3, SZ + 10), width: 5, height: 5.6, style: 'gilt', wash: true });
    for (let i = 0; i < 4; i++) { const x = -12 + i * 8; mounts.push({ position: v(x, 3.4, CZ + 2.6), rotation: PI, target: v(x, 2, CZ - 6), width: 4.2, height: 2.5, style: 'gilt', wash: true }); }
    k.box(70, 6, 0.6, 0, 3, CZ + 3, cream); k.block(-35, -1.6, CZ + 2.5, CZ + 3.5); k.block(1.6, 35, CZ + 2.5, CZ + 3.5);
    for (let i = 0; i < 4; i++) { const x = -18 + i * 12; mounts.push({ position: v(x, 3.4, FZ - 3.4), rotation: PI, target: v(x, 2, FZ - 12), width: 4.2, height: 2.5, style: 'gilt', wash: true }); }
    k.box(70, 6, 0.6, 0, 3, FZ - 3, cream); k.block(-35, -1.6, FZ - 3.5, FZ - 2.5); k.block(1.6, 35, FZ - 3.5, FZ - 2.5);
    return { mounts, spawn: v(-8, 3, FZ + 26), look: v(0, 10, FZ), eye: 3, bounds: [-30, 30, SZ + 6, FZ + 32], style: 'gilt', floorY: (x, z) => { void x; if (z > CZ - 21 && z < CZ + 2) return Math.max(0, Math.min(1.3, (z - (CZ - 21)) / 1.6 * 0.1)); return 0; } };
  },
};

/* ---------------- 64 THE VILLAGE VANGUARD ---------------- */
export const vanguard: RoomDef = {
  id: 'vanguard',
  name: 'The wedge downstairs',
  area: 'THE VILLAGE VANGUARD',
  mood: 'Second set',
  color: '#c83a3a',
  description: 'The red awning on Seventh Avenue South, the narrow stair down, the triangular room: fourteen feet of stage, the piano, the drums, the photographs, the works between them.',
  signatures: 'The red canopy and the steep staircase, the wedge shaped basement with the stage in the point, the red walls hung with photographs of the players, the tiny round tables and bentwood chairs, the kitchen door that never opens.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x101426, horizon: 0x3a3048, ground: 0x0a0a0e, fog: 0.004, stars: 100, env: 0.5 });
    k.hemi(0xffd8c0, 0x14100c, 0.35);
    const redW = k.pbr('vvRed', X.plaster(0x8a1a1e, 82), 0.3, { roughness: 0.9 }),
      redC = k.flat(0xb8202a, 0.1, 0.7),
      floorW = k.pbr('vvFloor', X.planks(0x3a2a1c, 5, 172, 0.4), 1.0),
      dark = k.flat(0x111216, 0.5, 0.7),
      black = k.flat(0x0a0a0c, 0.3, 0.8),
      brass = k.pbr('vvBrass', X.gilt(0xc9a55a), 2, { metalness: 0.85, roughness: 0.3 }),
      wood = k.pbr('vvWood', X.planks(0x5a3a26, 4, 173), 1.0),
      white = k.flat(0xf4f0e8, 0, 0.8),
      warm = k.glow(0xffd8a0),
      glass = k.glass(0xffe0b0, 0.3, 0.1);
    // Seventh Avenue South at night, the low buildings, the awning and the stair
    street(k, { w: 22, len: 140, z: 40, x: 0 });
    blockFront(k, { x: -12, z0: 100, count: 14, face: 1, seed: 174, h: [10, 18] });
    blockFront(k, { x: 12, z0: 100, count: 14, face: -1, seed: 175, h: [10, 16] });
    for (const z of [80, 40, 0]) for (const s of [-1, 1]) k.lamp(s * 11.6, z, 6.2, dark, 0xffd9a8, 26);
    const AX = -12.5, AZ = 20;
    const aw = k.box(3.6, 0.14, 5, AX + 1.8, 3.6, AZ, redC); aw.rotation.z = 0.12;
    for (let dz = -2.2; dz <= 2.2; dz += 1.1) k.box(0.05, 0.6, 0.06, AX + 3.6, 3.0, AZ + dz, redC);
    k.sign('VILLAGE VANGUARD', 3.4, 0.5, AX + 3.62, 3.0, AZ, '#b8202a', '#f4f0e8', 60, PI / 2 + PI / 2 * 0, { border: false });
    k.sign('VILLAGE VANGUARD', 4.6, 0.7, AX + 0.06, 5.4, AZ, '#b8202a', '#f4f0e8', 70, PI / 2, { border: true });
    k.point(AX + 2, 3.2, AZ, 0xff8a6a, 16, 8);
    // the stair down: a straight flight from the sidewalk into the ground, walled in red
    const SY = -5.2, STEPS = 16;
    for (let i = 0; i < STEPS; i++) k.box(1.6, 0.34, 0.7, AX + 1.2, -0.17 - i * (5.2 / STEPS) * 1, AZ - 1 - i * 0.7, wood);
    for (const s of [-1, 1]) k.box(0.3, 8, 13, AX + 1.2 + s * 1.0, -2, AZ - 6.5, redW);
    k.box(2.3, 0.3, 13, AX + 1.2, 2.6, AZ - 6.5, dark);
    k.block(AX - 0.2, AX + 0.1, AZ - 14, AZ + 0.5); k.block(AX + 2.3, AX + 2.6, AZ - 14, AZ + 0.5);
    k.box(60, 0.4, 40, AX, -0.2, AZ - 20, dark);
    // the wedge: a triangle in plan, stage in the point, tables on the floor, the kitchen door
    const P0 = v(AX + 1.2, SY, AZ - 14), P1 = v(AX - 10, SY, AZ - 40), P2 = v(AX + 16, SY, AZ - 40);
    const tri = new T.Shape(); tri.moveTo(P0.x, -P0.z); tri.lineTo(P1.x, -P1.z); tri.lineTo(P2.x, -P2.z); tri.closePath();
    const fg = new T.ExtrudeGeometry(tri, { depth: 0.3, bevelEnabled: false }); fg.rotateX(-PI / 2); k.mesh(fg, floorW, 0, SY - 0.3, 0);
    const cg = new T.ExtrudeGeometry(tri, { depth: 0.3, bevelEnabled: false }); cg.rotateX(-PI / 2); k.mesh(cg, dark, 0, SY + 3.4, 0);
    const wallAlong = (a: T.Vector3, b: T.Vector3) => { const len = a.distanceTo(b), m = a.clone().lerp(b, 0.5); const w = k.box(0.4, 3.6, len, m.x, SY + 1.8, m.z, redW); w.rotation.y = Math.atan2(b.x - a.x, b.z - a.z); for (let t = 0.1; t < 0.95; t += 0.1) { const p = a.clone().lerp(b, t); k.keepOut.push({ x: p.x, z: p.z, r: 0.9 }); } return w; };
    wallAlong(P0, P1); wallAlong(P0, P2); wallAlong(P1, P2);
    k.block(P1.x - 1, P2.x + 1, P1.z - 1, P1.z + 0.3);
    k.box(6, 0.5, 4, AX + 3, SY + 0.25, AZ - 37.5, wood);
    k.block(AX, AX + 6, AZ - 39.5, AZ - 35.5);
    k.box(1.6, 1.0, 1.8, AX + 1, SY + 1.0, AZ - 38, black); k.box(1.4, 0.06, 1.6, AX + 1, SY + 1.5, AZ - 38, black).rotation.x = -0.2;
    k.cyl(0.4, 0.5, AX + 5, SY + 0.8, AZ - 37.5, brass, 0.4, 12); k.cyl(0.32, 0.4, AX + 5.6, SY + 0.7, AZ - 38.6, brass, 0.32, 12); k.cyl(0.36, 0.05, AX + 4.6, SY + 1.4, AZ - 38.6, brass, 0.36, 16);
    k.cyl(0.05, 1.6, AX + 3, SY + 1.3, AZ - 36, dark, 0.05, 6); k.cyl(0.08, 0.2, AX + 3, SY + 2.15, AZ - 36, black, 0.08, 8);
    k.spot(AX + 3, SY + 3.2, AZ - 30, AX + 3, SY + 0.5, AZ - 37, 0xffd8a0, 80, 0.5, 0.7, 14);
    const rnd = X.mulberry(64);
    for (let i = 0; i < 14; i++) { const t = 0.25 + (i % 4) * 0.2, u = 0.2 + Math.floor(i / 4) * 0.22; const p = P0.clone().lerp(P1.clone().lerp(P2, t), u); k.cyl(0.04, 0.7, p.x, SY + 0.35, p.z, dark, 0.04, 6); k.cyl(0.36, 0.04, p.x, SY + 0.72, p.z, white, 0.36, 14); k.cyl(0.06, 0.12, p.x, SY + 0.8, p.z, warm, 0.03, 8); k.point(p.x, SY + 1.0, p.z, 0xffd0a0, 1.5, 2); k.keepOut.push({ x: p.x, z: p.z, r: 0.6 }); for (let c = 0; c < 2; c++) { const a = rnd() * PI * 2; k.box(0.4, 0.45, 0.4, p.x + Math.cos(a) * 0.6, SY + 0.23, p.z + Math.sin(a) * 0.6, wood); k.box(0.4, 0.5, 0.05, p.x + Math.cos(a) * 0.78, SY + 0.7, p.z + Math.sin(a) * 0.78, wood).rotation.y = -a + PI / 2; } }
    k.box(1.0, 2.4, 0.1, AX + 13, SY + 1.2, AZ - 39.7, k.flat(0x8a6a48, 0, 0.7)); k.box(0.3, 0.3, 0.02, AX + 13.2, SY + 1.6, AZ - 39.64, glass);
    k.point(AX + 2, SY + 3, AZ - 22, 0xff9a70, 10, 10);
    k.point(AX - 2, SY + 3, AZ - 32, 0xff9a70, 10, 10);
    k.crowd([v(AX + 1.2, SY, AZ - 16), v(AX + 4, SY, AZ - 26), v(AX + 8, SY, AZ - 34)], 4, { seed: 64, speed: 0.2, spread: 1, animate: !ctx.reduced, colors: [0x151517, 0x24262c] });
    k.censusWall({ x: AX + 1.2, y: 1.6, z: AZ - 13.8, rotY: 0, cols: 6, rows: 3, tile: 0.4, gap: 0.04, start: ctx.wallStart(6400, 18), pieces: ctx.all, backing: dark });
    // the works: along both long red walls where the photographs hang, small and close, plus the back wall and the stair
    const mounts: Mount[] = [];
    for (const [a, b, sgn] of [[P0, P1, 1], [P0, P2, -1]] as const) { const ang = Math.atan2(b.x - a.x, b.z - a.z); const nx = Math.cos(ang) * sgn, nz = -Math.sin(ang) * sgn; for (let i = 0; i < 7; i++) { const t = 0.12 + i * 0.13; const p = a.clone().lerp(b, t); mounts.push({ position: v(p.x + nx * 0.22, SY + 1.7, p.z + nz * 0.22), rotation: ang + (sgn > 0 ? PI / 2 : -PI / 2), target: v(p.x + nx * 4, SY + 1.5, p.z + nz * 4), width: 1.3, height: 1.0, style: 'black', wash: false }); } }
    for (let i = 0; i < 5; i++) { const x = P1.x + 3 + i * 5; mounts.push({ position: v(x, SY + 2.0, P1.z + 0.22), rotation: 0, target: v(x, SY + 1.5, P1.z + 6), width: 1.8, height: 1.2, style: 'black', wash: false }); }
    for (let i = 0; i < 4; i++) { const z = AZ - 4 - i * 2.6; const y = -0.17 - ((AZ - 1 - z) / 0.7) * (5.2 / STEPS) + 1.6; mounts.push({ position: v(AX + 0.42, y, z), rotation: PI / 2, target: v(AX + 1.2, y, z), width: 0.9, height: 0.7, style: 'black', wash: false }); }
    const stairY = (z: number) => { const i = (AZ - 1 - z) / 0.7; return -Math.min(STEPS, Math.max(0, i)) * (5.2 / STEPS); };
    return { mounts, spawn: v(AX + 8, 3, AZ + 6), look: v(AX + 1, 3, AZ - 4), eye: 3, bounds: [AX - 11, AX + 17, AZ - 41, AZ + 30], style: 'black', floorY: (x, z) => { if (x > AX - 0.2 && x < AX + 2.6 && z < AZ + 0.5 && z > AZ - 14) return stairY(z); if (z <= AZ - 14 && z > P1.z) return SY; return 0; } };
  },
};

/* ---------------- 65 RUCKER PARK ---------------- */
export const rucker: RoomDef = {
  id: 'rucker',
  name: 'The court',
  area: 'RUCKER PARK',
  mood: 'Summer night game',
  color: '#f08a2a',
  description: 'One hundred fifty fifth and Frederick Douglass: the fenced court under the lights, the bleachers packed, a game moving, the river and the Bronx beyond, the works on the fence.',
  signatures: 'The full court inside a chain link fence, the aluminium bleachers along both sidelines, the light towers, the Polo Grounds Towers behind, the Harlem River and the Macombs Dam Bridge, a crowd three deep at the fence.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x14203a, horizon: 0x6a4a5a, ground: 0x0e1018, fog: 0.0026, stars: 200, env: 0.6 });
    k.hemi(0xd8e0ff, 0x1a1418, 0.5);
    k.sun(0xc8d0ff, 0.4, -60, 60, 40, false, 90);
    const court = k.pbr('rpCourt', X.asphalt(0x2a4a3a), 0.15, { roughness: 0.9 }),
      key = k.flat(0xc85a2a, 0, 0.9),
      white = k.flat(0xf4f0e8, 0, 0.6),
      fence = k.flat(0x8c98a4, 0.9, 0.3, { transparent: true, opacity: 0.55 }),
      steel = k.flat(0x8c98a4, 0.9, 0.3),
      alu = k.pbr('rpBleach', X.steel(0xb8bcc0, false, 176), 0.5, { metalness: 0.8, roughness: 0.4 }),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      towers = k.pbr('rpTowers', X.windows(177, 0.5, 0x5a5048, true), 0.12, { emissive: 0xffffff, emissiveIntensity: 1.1, stretch: 0.42 }),
      orange = k.flat(0xe87a2a, 0, 0.7),
      pave = k.pbr('rpPave', X.pavers(0x7a7a76, 83), 0.4),
      glow = k.glow(0xfff0d8);
    // the block: the avenue, the towers, the river and the bridge behind
    street(k, { w: 20, len: 160, z: 0, x: 40 });
    k.box(160, 0.4, 120, -20, -0.2, 0, pave);
    for (const [x, z] of [[-60, 60], [-20, 70], [20, 70]]) k.box(22, 70, 22, x, 35, z, towers);
    k.water({ y: -3, color: 0x24405a, w: 400, d: 200, z: -140, amp: 0.8 });
    for (let x = -120; x <= 120; x += 40) { k.box(3, 20, 3, x, 7, -120, steel); }
    k.box(260, 1.5, 6, 0, 14, -120, steel);
    for (let x = -120; x <= 120; x += 6) k.beam(v(x, 14, -120), v(x + 3, 24 + Math.abs(Math.sin(x * 0.05)) * 6, -120), 0.08, steel, 4);
    k.skyline({ z: -260, count: 24, spacing: 12, scale: 1.6, base: -3, seed: 178, lit: 0.4, glow: 1.0, tint: 0x3a3a48, rows: 1 });
    // the court: asphalt, the lines, the keys, two hoops, the fence all round, four light towers
    const CW = 15, CL = 28;
    k.box(CW + 8, 0.2, CL + 8, 0, 0.05, 0, court);
    for (const [w, d, x, z] of [[CW, 0.06, 0, CL / 2], [CW, 0.06, 0, -CL / 2], [0.06, CL, CW / 2, 0], [0.06, CL, -CW / 2, 0], [CW, 0.06, 0, 0]]) k.box(w as number, 0.01, d as number, x as number, 0.16, z as number, white);
    for (const s of [-1, 1]) { k.box(4.9, 0.01, 5.8, 0, 0.155, s * (CL / 2 - 2.9), key); k.torus(1.8, 0.03, 0, 0.16, s * (CL / 2 - 5.8), white, 32).rotation.x = PI / 2; const arc = k.mesh(new T.RingGeometry(6.6, 6.7, 48, 1, s > 0 ? PI : 0, PI), white, 0, 0.16, s * (CL / 2 - 1.6)); arc.rotation.x = -PI / 2; }
    k.torus(1.8, 0.03, 0, 0.16, 0, white, 32).rotation.x = PI / 2;
    for (const s of [-1, 1]) { const z = s * (CL / 2 + 1.2); k.beam(v(0, 0, z), v(0, 3.4, z), 0.1, steel, 6); k.beam(v(0, 3.4, z), v(0, 3.4, z - s * 1.2), 0.08, steel, 4); k.box(1.8, 1.05, 0.05, 0, 3.05, z - s * 1.2, k.glass(0xffffff, 0.35, 0.05)); k.box(1.8, 0.06, 0.06, 0, 2.55, z - s * 1.2, white); k.torus(0.23, 0.02, 0, 3.05 - 0.5, z - s * 1.5, orange, 16).rotation.x = PI / 2; for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; k.beam(v(Math.cos(a) * 0.23, 2.55, z - s * 1.5 + Math.sin(a) * 0.23), v(Math.cos(a) * 0.1, 2.15, z - s * 1.5 + Math.sin(a) * 0.1), 0.006, white, 3); } k.keepOut.push({ x: 0, z, r: 0.5 }); }
    const FX = CW / 2 + 4, FZ = CL / 2 + 4;
    for (const s of [-1, 1]) { k.box(0.03, 4, 2 * FZ, s * FX, 2, 0, fence); k.box(2 * FX, 4, 0.03, 0, 2, s * FZ, fence); for (let z = -FZ; z <= FZ; z += 4) k.box(0.08, 4.2, 0.08, s * FX, 2.1, z, steel); for (let x = -FX; x <= FX; x += 4) k.box(0.08, 4.2, 0.08, x, 2.1, s * FZ, steel); k.box(2 * FX, 0.06, 0.06, 0, 4.1, s * FZ, steel); k.box(0.06, 0.06, 2 * FZ, s * FX, 4.1, 0, steel); }
    k.block(-FX - 0.2, -FX + 0.2, -FZ, FZ); k.block(FX - 0.2, FX + 0.2, -FZ, FZ); k.block(-FX, FX, FZ - 0.2, FZ + 0.2); k.block(-FX, -1.2, -FZ - 0.2, -FZ + 0.2); k.block(1.2, FX, -FZ - 0.2, -FZ + 0.2);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { k.beam(v(sx * (FX + 3), 0, sz * (FZ + 3)), v(sx * (FX + 3), 14, sz * (FZ + 3)), 0.25, steel, 8); for (let i = 0; i < 3; i++) k.box(0.6, 0.5, 0.3, sx * (FX + 3) - sx * 0.6 - i * sx * 0.7, 13.6, sz * (FZ + 3), glow).rotation.y = -sz * 0.3; k.spot(sx * (FX + 3), 14, sz * (FZ + 3), sx * 3, 0, sz * 6, 0xfff4e0, 400, 0.7, 0.6, 50); }
    // the bleachers along both sidelines, the crowd at the fence, the players
    for (const s of [-1, 1]) { for (let r = 0; r < 5; r++) { k.box(24, 0.06, 0.5, 0, 0.5 + r * 0.4, s * (FZ + 5.5 + r * 0.8), alu); k.box(24, 0.06, 0.4, 0, 0.3 + r * 0.4, s * (FZ + 5.2 + r * 0.8), alu); } k.block(-12, 12, s * (FZ + 5) - 2.6, s * (FZ + 5) + 2.6); }
    k.crowd([v(-12, 0.7, FZ + 6.8), v(0, 0.7, FZ + 7.2), v(12, 0.7, FZ + 6.8)], 26, { seed: 65, speed: 0.1, spread: 2.2, animate: !ctx.reduced });
    k.crowd([v(-12, 0.7, -FZ - 6.8), v(0, 0.7, -FZ - 7.2), v(12, 0.7, -FZ - 6.8)], 26, { seed: 66, speed: 0.1, spread: 2.2, animate: !ctx.reduced });
    k.crowd([v(FX + 0.8, 0, -FZ), v(FX + 0.8, 0, 0), v(FX + 0.8, 0, FZ)], 18, { seed: 67, speed: 0.15, spread: 1.4, animate: !ctx.reduced });
    const players = k.crowd([v(-4, 0.2, -10), v(3, 0.2, -2), v(-3, 0.2, 4), v(4, 0.2, 11)], 10, { seed: 68, speed: 3.2, spread: 3, animate: !ctx.reduced, colors: [0xf4f0e8, 0xf08a2a, 0xf4f0e8, 0x1e56b4] });
    void players;
    const ball = k.mesh(new T.SphereGeometry(0.12, 10, 8), orange, 0, 1, 0, true);
    if (!ctx.reduced) k.ticks.push((t) => { const u = (t * 0.25) % 1; ball.position.set(Math.sin(t * 0.7) * 5, 0.9 + Math.abs(Math.sin(t * 4)) * 1.6, -12 + u * 24); });
    k.censusWall({ x: -FX - 0.36, y: 2.4, z: 0, rotY: PI / 2, cols: 40, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(7600, 160), pieces: ctx.all, backing: dark });
    k.box(0.3, 5, 24, -FX - 0.6, 2.5, 0, dark);
    k.sign('RUCKER PARK  ·  155TH  ·  THE GAME IS TONIGHT', 8, 0.7, 0, 4.6, FZ + 0.08, 'transparent', '#f4f0e8', 70, PI);
    // the works: banners hung on the fence inside the court on the far side and both ends, the light tower bases
    const mounts: Mount[] = [];
    for (let i = 0; i < 6; i++) { const z = -15 + i * 6; mounts.push({ position: v(FX - 0.12, 2.2, z), rotation: -PI / 2, target: v(0, 2, z), width: 3.4, height: 2.0, style: 'steel', wash: false }); }
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const x = -7 + i * 7; if (s < 0 && i === 1) continue; mounts.push({ position: v(x, 2.2, s * (FZ - 0.12)), rotation: s > 0 ? PI : 0, target: v(x, 2, 0), width: 3.4, height: 2.0, style: 'steel', wash: false }); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { k.box(2.8, 3.2, 0.3, sx * (FX + 3), 1.8, sz * (FZ + 3) - sz * 1.6, dark); mounts.push({ position: v(sx * (FX + 3), 1.9, sz * (FZ + 3) - sz * 1.78), rotation: sz > 0 ? PI : 0, target: v(sx * 6, 2, sz * 8), width: 2.4, height: 1.5, style: 'black', wash: false }); }
    for (let i = 0; i < 5; i++) { const x = 30 + i * 6; k.box(3.6, 2.6, 0.2, x, 1.6, -14, dark); mounts.push({ position: v(x, 1.7, -13.88), rotation: 0, target: v(x, 2, -6), width: 3.2, height: 1.9, style: 'black', wash: false }); }
    return { mounts, spawn: v(0, 3, -FZ - 12), look: v(0, 3, 10), eye: 3, bounds: [-FX - 6, 60, -FZ - 16, FZ + 14], style: 'steel' };
  },
};

/* ---------------- 66 1520 SEDGWICK AVENUE ---------------- */
export const sedgwick: RoomDef = {
  id: 'sedgwick',
  name: 'The rec room',
  area: '1520 SEDGWICK AVENUE',
  mood: 'August 1973',
  color: '#e0c030',
  description: 'The tower over the Cross Bronx, the block party on the plaza, then the rec room downstairs: two turntables and a mixer, the speakers, the break, the works on the cinderblock.',
  signatures: 'The brown brick tower at the top of the hill, the highway trench below, the lobby and the community room with its drop ceiling and cinderblock, two turntables on a folding table, a wall of speakers, a crowd in a circle around the floor.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x1a1a40, horizon: 0x8a5a60, ground: 0x0e0e12, fog: 0.0026, stars: 180, env: 0.6 });
    k.hemi(0xffd8c0, 0x1a1418, 0.5);
    k.sun(0xff9a60, 0.6, -80, 12, 40, true, 90);
    const brick = k.pbr('sdBrick', X.brick(0x6a4a3a, 179), 0.28),
      cinder = k.pbr('sdCinder', X.brick(0xb8b4a8, 180), 0.5, { roughness: 0.95 }),
      floorT = k.pbr('sdFloor', X.terrazzo(0x8a8478, 84), 0.4, { roughness: 0.5 }),
      tile = k.pbr('sdCeiling', X.plaster(0xd8d4c8, 85), 0.6),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      black = k.flat(0x0a0a0c, 0.3, 0.8),
      steel = k.flat(0x8c98a4, 0.9, 0.3),
      wood = k.pbr('sdWood', X.planks(0x8a6a48, 4, 181), 1.0),
      asphalt = k.pbr('sdRoad', X.asphalt(0x2a2d31), 0.11),
      pave = k.pbr('sdPave', X.pavers(0x8e8b84, 86), 0.4),
      warm = k.glow(0xffd8a0),
      neonR = k.glow(0xff3a5a),
      neonB = k.glow(0x3a8aff),
      towers = k.pbr('sdTowers', X.windows(182, 0.5, 0x6a5a48, true), 0.12, { emissive: 0xffffff, emissiveIntensity: 1.0, stretch: 0.42 });
    // the hill: the tower, the plaza in front, the highway trench with traffic below, the Bronx beyond
    k.box(120, 0.4, 60, 0, -0.2, 10, pave);
    k.box(60, 100, 30, 0, 50, -25, towers);
    k.box(62, 4, 32, 0, 2, -25, brick);
    for (let i = 0; i < 3; i++) k.box(1.6, 3.6, 0.2, -6 + i * 6, 1.8, -9.8, k.glass(0xffe0b0, 0.3, 0.1));
    k.arch(3, 3.6, 2, 0, 0, -10, brick, false, 0.85);
    k.block(-31, -1.6, -10.5, -9.5); k.block(1.6, 31, -10.5, -9.5);
    k.sign('1520', 2, 0.9, 0, 4.4, -9.78, '#1a1c20', '#f4f0e8', 90, 0, { border: true });
    k.box(300, 0.4, 40, 0, -12, 60, asphalt);
    for (let i = 0; i < 6; i++) k.box(300, 12, 3, 0, -6, 40 + i * 0, k.pbr('sdWall', X.concrete(0x8a8a82, 87), 0.3));
    for (let i = 0; i < 6; i++) k.box(300, 12, 3, 0, -6, 80, k.pbr('sdWall', X.concrete(0x8a8a82, 87), 0.3));
    const cars: T.Mesh[] = [];
    for (let i = 0; i < 20; i++) { const c = k.mesh(new T.BoxGeometry(4.2, 1.3, 1.8), k.flat([0xd8d0c0, 0x1a1a1a, 0xc62828, 0x2b4a8a][i % 4], 0.4, 0.4), -150 + i * 15, -11.2, 52 + (i % 2) * 8, true); c.userData.d = i % 2 ? 1 : -1; cars.push(c); const l = new T.Mesh(new T.BoxGeometry(0.1, 0.2, 1.4), warm); l.position.set(c.userData.d * 2.1, 0, 0); c.add(l); }
    if (!ctx.reduced) k.ticks.push((_t, dt) => cars.forEach((c) => { c.position.x += c.userData.d * 14 * Math.min(dt, 0.1); if (c.position.x > 160) c.position.x = -160; if (c.position.x < -160) c.position.x = 160; }));
    k.rail(0, 39, 300, steel, 1.1, 'x', 2.5);
    k.block(-150, 150, 38.6, 39.6);
    k.skyline({ z: 200, count: 30, spacing: 10, scale: 1.8, base: -12, seed: 183, lit: 0.45, glow: 1.0, tint: 0x3a3040, rows: 1 });
    for (const [x, z] of [[-70, 10], [70, 10]]) k.box(24, 60, 24, x, 30, z - 30, towers);
    // the block party on the plaza: a DJ table under a lamp, speakers, the circle
    const PX = 18, PZ = 18;
    k.box(2.4, 0.9, 0.9, PX, 0.45, PZ, wood); k.box(1.0, 0.1, 0.9, PX - 0.6, 0.95, PZ, black); k.box(1.0, 0.1, 0.9, PX + 0.6, 0.95, PZ, black); k.keepOut.push({ x: PX, z: PZ, r: 1.6 });
    for (const dx of [-3, 3]) { k.box(1.0, 1.6, 0.8, PX + dx, 0.8, PZ - 0.4, black); k.cyl(0.3, 0.05, PX + dx, 1.1, PZ + 0.02, dark, 0.3, 14); k.keepOut.push({ x: PX + dx, z: PZ - 0.4, r: 0.8 }); }
    k.lamp(PX, PZ - 3, 6, dark, 0xffd9a8, 30);
    k.crowd([v(PX - 8, 0, PZ + 3), v(PX - 4, 0, PZ + 8), v(PX + 4, 0, PZ + 8), v(PX + 8, 0, PZ + 3)], 20, { seed: 69, speed: 0.4, spread: 2.4, animate: !ctx.reduced, colors: [0xf08a2a, 0xf1c531, 0x3a8ab0, 0xd83a6a, 0x24262c, 0xf4f0e8] });
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; k.prop('hydrant', -30 + i * 0, 0, 0, { height: 0 }); void a; break; }
    k.prop('hydrant', -14, 0, 14, { height: 1.1 });
    k.prop('mailbox', 14, 0, 6, { height: 1.5, rotY: PI });
    // the rec room: down a short stair inside the lobby, cinderblock, drop ceiling, the setup on a folding table, the speaker wall
    const RY = -3.6, RX = 0, RZ = -30, RW = 26, RD = 20;
    k.box(30, 0.3, 14, 0, 0.15, -17, floorT);
    for (let i = 0; i < 10; i++) k.box(3, 0.36, 0.8, -10, -0.18 - i * 0.36, -22 - i * 0.8, floorT);
    k.box(RW, 0.3, RD, RX, RY - 0.15, RZ - 6, floorT);
    k.box(RW, 3.0, RD, RX, RY + 3.2, RZ - 6, tile);
    for (const s of [-1, 1]) { k.box(0.4, 3.2, RD, RX + s * RW / 2, RY + 1.6, RZ - 6, cinder); k.block(RX + s * RW / 2 - 0.4, RX + s * RW / 2 + 0.4, RZ - 16, RZ + 4); }
    k.box(RW, 3.2, 0.4, RX, RY + 1.6, RZ - 16, cinder); k.block(RX - RW / 2, RX + RW / 2, RZ - 16.4, RZ - 15.6);
    k.box(RW, 3.2, 0.4, RX, RY + 1.6, RZ + 4, cinder); k.block(RX - RW / 2, -7.6, RZ + 3.6, RZ + 4.4); k.block(-5.4, RX + RW / 2, RZ + 3.6, RZ + 4.4);
    k.block(-30, -12, -31, -16); k.block(-8, 30, -31, -16);
    for (let x = -10; x <= 10; x += 5) for (let z = RZ - 14; z < RZ + 4; z += 5) k.box(1.2, 0.05, 0.3, x, RY + 3.15, z, warm), k.point(x, RY + 2.9, z, 0xffe8d0, 6, 6);
    const TX = 0, TZ = RZ - 12;
    k.box(2.4, 0.06, 0.9, TX, RY + 0.85, TZ, wood); for (const dx of [-1, 1]) k.beam(v(TX + dx, RY, TZ), v(TX + dx, RY + 0.82, TZ), 0.03, steel, 4);
    const platters: T.Mesh[] = [];
    for (const dx of [-0.75, 0.75]) { k.box(0.55, 0.08, 0.5, TX + dx, RY + 0.92, TZ, black); const p = k.mesh(new T.CylinderGeometry(0.2, 0.2, 0.02, 24), dark, TX + dx, RY + 0.98, TZ, true); platters.push(p); k.box(0.02, 0.01, 0.16, TX + dx + 0.16, RY + 1.0, TZ - 0.12, steel).rotation.y = -0.6; }
    k.box(0.4, 0.06, 0.4, TX, RY + 0.92, TZ, black);
    if (!ctx.reduced) k.ticks.push((_t, dt) => platters.forEach((p, i) => { p.rotation.y += dt * (i ? 3.5 : 3.49); }));
    k.keepOut.push({ x: TX, z: TZ, r: 1.5 });
    for (let i = 0; i < 6; i++) { const x = -6 + (i % 3) * 6, y = RY + 0.7 + Math.floor(i / 3) * 1.4; k.box(1.6, 1.3, 0.9, x, y, RZ - 15.3, black); k.cyl(0.45, 0.04, x, y, RZ - 14.84, dark, 0.45, 16); k.cyl(0.14, 0.06, x + 0.45, y + 0.4, RZ - 14.84, dark, 0.14, 12); k.keepOut.push({ x, z: RZ - 15.3, r: 1 }); }
    const cones = k.objects.filter((o) => o.geometry instanceof T.CylinderGeometry && Math.abs(o.position.z - (RZ - 14.84)) < 0.01 && o.position.y < RY + 3);
    if (!ctx.reduced) k.ticks.push((t) => cones.forEach((c, i) => { const s = 1 + 0.08 * Math.max(0, Math.sin(t * 8 + i)); c.scale.set(s, 1, s); }));
    for (let i = 0; i < 2; i++) { const l = k.point(-4 + i * 8, RY + 2.6, RZ - 4, i ? 0x3a8aff : 0xff3a5a, 20, 12); if (!ctx.reduced) k.ticks.push((t) => { l.intensity = 12 + 12 * Math.sin(t * 6 + i * 2); }); }
    k.mesh(new T.BoxGeometry(6, 0.06, 0.06), neonR, -6, RY + 3.0, RZ - 15.6); k.mesh(new T.BoxGeometry(6, 0.06, 0.06), neonB, 6, RY + 3.0, RZ - 15.6);
    k.crowd([v(-8, RY, RZ - 2), v(-8, RY, RZ - 10), v(0, RY, RZ - 8), v(8, RY, RZ - 10), v(8, RY, RZ - 2)], 22, { seed: 70, speed: 0.3, spread: 1.6, animate: !ctx.reduced, closed: true, colors: [0xf08a2a, 0xf1c531, 0x3a8ab0, 0xd83a6a, 0x24262c, 0xf4f0e8, 0x8a3ad8] });
    k.censusWall({ x: RX + RW / 2 - 0.42, y: RY + 1.6, z: RZ - 6, rotY: -PI / 2, cols: 30, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(7700, 120), pieces: ctx.all, backing: dark });
    k.sign('SEDGWICK AVE  ·  REC ROOM  ·  BACK TO SCHOOL JAM', 8, 0.6, RX, RY + 2.7, RZ + 3.78, 'transparent', '#f4e4b0', 70, PI);
    // the works: the cinderblock walls of the rec room, taped up like flyers, the lobby, the plaza fence
    const mounts: Mount[] = [];
    for (let i = 0; i < 6; i++) { const z = RZ - 14 + i * 3; mounts.push({ position: v(RX - RW / 2 + 0.22, RY + 1.7, z), rotation: PI / 2, target: v(RX, RY + 1.5, z), width: 2.4, height: 1.5, style: 'none', wash: false }); }
    for (let i = 0; i < 5; i++) { const x = -10 + i * 5; if (Math.abs(x) < 3) continue; mounts.push({ position: v(x, RY + 1.9, RZ + 3.78), rotation: PI, target: v(x, RY + 1.5, RZ - 4), width: 2.6, height: 1.6, style: 'none', wash: false }); }
    for (let i = 0; i < 3; i++) { const x = -8 + i * 8; mounts.push({ position: v(x, RY + 2.4, RZ - 15.78), rotation: 0, target: v(x, RY + 1.5, RZ - 8), width: 2.8, height: 1.1, style: 'none', wash: false }); }
    for (let i = 0; i < 4; i++) { const x = -12 + i * 8; mounts.push({ position: v(x, 2.6, -9.78), rotation: 0, target: v(x, 2, 0), width: 3.6, height: 2.1, style: 'black', wash: false }); }
    for (let i = 0; i < 4; i++) { const x = -40 + i * 8; k.box(3.6, 2.6, 0.2, x, 1.6, 30, dark); mounts.push({ position: v(x, 1.7, 29.88), rotation: PI, target: v(x, 2, 20), width: 3.2, height: 1.9, style: 'black', wash: false }); }
    return { mounts, spawn: v(-30, 3, 36), look: v(12, 5, 4), eye: 3, bounds: [-50, 50, RZ - 15.5, 38], style: 'black', floorY: (x, z) => { if (x > -11.6 && x < -8.4 && z < -21.6 && z > -30) return -Math.min(3.6, ((-21.6 - z) / 8) * 3.6); if (z < -16 && Math.abs(x) < RW / 2 && z > RZ - 16) return RY; return 0; } };
  },
};
