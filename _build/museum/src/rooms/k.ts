/* Rooms 47 to 51: the Morgan's East Room, Radio City, the Woolworth lobby, Wall Street, Lincoln Center. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront } from './f';

const PI = Math.PI;

/* ---------------- 47 THE MORGAN LIBRARY ---------------- */
export const morgan: RoomDef = {
  id: 'morgan',
  name: 'Three tiers of books',
  area: 'THE MORGAN LIBRARY',
  mood: 'Reading lamp afternoon',
  color: '#b8864a',
  description: 'Madison Avenue, the marble palazzo, then the East Room: three storeys of walnut bookcases with two walkable balconies, the painted ceiling, the works between the tiers.',
  signatures: 'The McKim palazzo of dry laid marble, the East Room of triple tiered inlaid walnut bookcases behind bronze grilles, the narrow balconies, the tapestry over the fireplace, the lunettes and the painted ceiling.',
  build(k, ctx) {
    k.sky({ top: 0x7fa0d0, horizon: 0xe8e8e0, ground: 0x5a5a55, fog: 0.0022, sun: { az: 3.9, el: 0.7, color: 0xfff4e6, size: 12 }, env: 0.8 });
    k.hemi(0xfff0dc, 0x3a2a1a, 0.55);
    k.sun(0xfff0d8, 1.4, -30, 50, 40, true, 60);
    const marble = k.pbr('morganMarble', X.ashlar(0xe0d8c8, 95, 4), 0.25, { roughness: 0.5 }),
      walnut = k.pbr('morganWalnut', X.planks(0x4a2e1a, 3, 96, 0.2), 1.6, { roughness: 0.45 }),
      walnutL = k.pbr('morganWalnutL', X.planks(0x6a4428, 4, 97, 0.2), 1.4, { roughness: 0.45 }),
      books = k.pbr('morganBooks', X.planks(0x6a3a2a, 14, 98, 0.5), 0.35, { roughness: 0.8, stretch: 0.3 }),
      bronze = k.flat(0x6a5a3a, 0.8, 0.4),
      carpet = k.pbr('morganCarpet', X.carpet(0x6a2a2a, 0xc79a4a), 0.4, { roughness: 0.95 }),
      plaster = k.pbr('morganCeiling', X.plaster(0xe6dcc8, 50), 0.3),
      gilt = k.pbr('morganGilt', X.gilt(0xd0a852), 2, { metalness: 0.85, roughness: 0.3 }),
      glass = k.glass(0xdcecf6, 0.14, 0.04),
      dark = k.flat(0x1a1a1c, 0.5, 0.6);
    // Madison Avenue and the palazzo
    street(k, { w: 18, len: 120, z: 40, x: 0 });
    blockFront(k, { x: -40, z0: 90, count: 8, face: 1, seed: 99, h: [16, 26] });
    blockFront(k, { x: 40, z0: 90, count: 4, face: -1, seed: 100, h: [14, 20] });
    const RW = 20, RD = 30, RH = 12, FZ = 8;
    k.box(RW + 24, RH + 3, RD + 10, 0, (RH + 3) / 2, FZ - RD / 2 - 5, marble);
    k.moulding([[0, 0], [0.9, 0], [1.0, 0.3], [0.6, 0.5], [0.8, 0.8], [0.3, 1.0], [0, 1.1]], RW + 24.2, 0, RH + 2, FZ + 0.05, k.pbr('morganCornice', X.plaster(0xd8d0c0, 51), 0.6), 0);
    k.arch(4.4, 6.4, 5.2, 0, 0, FZ - 2.2, marble, false, 0.85);
    for (const s of [-1, 1]) { k.column(s * 3.6, 0.1, FZ + 0.6, 6.2, 0.5, marble, true); k.column(s * 5.2, 0.1, FZ + 0.6, 6.2, 0.5, marble, true); }
    k.box(RW + 24, 1.4, 6, 0, 7.4, FZ + 0.5, marble);
    for (const s of [-1, 1]) { k.box(1.2, 1.8, 1.2, s * 4.4, 0.9, FZ + 4, marble); k.mesh(new T.SphereGeometry(0.8, 12, 8), bronze, s * 4.4, 2.4, FZ + 4); k.mesh(new T.SphereGeometry(0.5, 10, 6), bronze, s * 4.4, 3.4, FZ + 4.6); }
    k.block(-RW / 2 - 12, -2.2, FZ - 0.5, FZ + 0.5); k.block(2.2, RW / 2 + 12, FZ - 0.5, FZ + 0.5);
    for (let i = 0; i < 4; i++) k.box(RW + 4, 0.16, 1.0, 0, 0.08 + i * 0.16, FZ + 1.4 + i * 1.0, marble);
    // the East Room: floor, three tiers of cases on three walls, balconies at 4 and 8 with bronze rails, the fireplace wall
    const Z0 = FZ - 2, Z1 = FZ - RD;
    k.box(RW, 0.3, RD, 0, 0.15, (Z0 + Z1) / 2, carpet);
    k.box(RW + 2, 0.4, RD + 2, 0, RH + 0.2, (Z0 + Z1) / 2, plaster);
    for (const s of [-1, 1]) k.block(s * (RW / 2 + 0.2), s * (RW / 2 + 1.4), Z1, Z0);
    k.block(-RW / 2, RW / 2, Z1 - 1.4, Z1 - 0.2);
    const tiers = [0, 4, 8];
    const caseWall = (x: number, rot: number, len: number, zc: number) => {
      for (const ty of tiers) {
        for (let i = 0; i < Math.floor(len / 2.2); i++) {
          const z = zc - len / 2 + 1.1 + i * 2.2;
          const bx = rot === 0 ? z : x, bz = rot === 0 ? x : z;
          void bx; void bz;
          const shelf = k.box(0.7, 3.2, 2.0, 0, 0, 0, walnut);
          const bk = k.box(0.5, 2.8, 1.7, 0, 0, 0, books);
          const gr = k.box(0.04, 2.9, 1.8, 0, 0, 0, bronze);
          const px = rot === 0 ? x : z, pz = rot === 0 ? z : x;
          shelf.position.set(px, ty + 1.9, pz); bk.position.set(px + (rot === 0 ? Math.sign(-x) * 0.1 : 0), ty + 1.9, pz + (rot === 0 ? 0 : 0.1 * Math.sign(-x)));
          gr.position.set(px + (rot === 0 ? Math.sign(-x) * 0.37 : 0), ty + 1.9, pz + (rot === 0 ? 0 : Math.sign(-x) * 0.37));
          for (const o of [shelf, bk, gr]) o.rotation.y = rot;
        }
        const t = k.box(rot === 0 ? 0.9 : len + 0.2, 0.18, rot === 0 ? len + 0.2 : 0.9, 0, 0, 0, walnutL);
        t.position.set(rot === 0 ? x : 0, ty + 3.6, rot === 0 ? zc : x);
      }
    };
    caseWall(-RW / 2 + 0.45, 0, RD - 2, (Z0 + Z1) / 2);
    caseWall(RW / 2 - 0.45, 0, RD - 2, (Z0 + Z1) / 2);
    caseWall(Z1 + 0.45, PI / 2, RW - 2, 0);
    // balconies: a walk 1.1 wide at each upper tier on all three case walls, bronze rail, a stair in the far corners
    const BW = 1.1;
    for (const by of [4, 8]) {
      for (const s of [-1, 1]) { k.box(BW, 0.2, RD - 2, s * (RW / 2 - 0.9 - BW / 2), by - 0.1, (Z0 + Z1) / 2, walnutL); k.rail(s * (RW / 2 - 0.9 - BW), (Z0 + Z1) / 2, RD - 2, bronze, 0.95, 'z', 1.2); }
      k.box(RW - 1.8, 0.2, BW, 0, by - 0.1, Z1 + 0.9 + BW / 2, walnutL);
      k.rail(0, Z1 + 0.9 + BW, RW - 1.8, bronze, 0.95, 'x', 1.2);
      for (let i = 0; i < 6; i++) k.point(-8 + i * 3.2, by + 2.6, Z1 + 3, 0xffe6c0, 6, 5);
    }
    // stairs: a straight flight in each far corner, right side up to 4, left side up to 8 from 4
    const flight = (x: number, z0: number, y0: number, dir: number) => { for (let i = 0; i < 16; i++) k.box(BW, 0.25, 0.42, x, y0 + 0.125 + i * 0.25, z0 + dir * i * 0.42, walnutL); };
    flight(RW / 2 - 0.9 - BW / 2, Z0 - 1.2, 0, -1);
    flight(-RW / 2 + 0.9 + BW / 2, Z0 - 1.2, 4, -1);
    k.block(-RW / 2 + 0.9, -RW / 2 + 0.9 + BW, Z0 - 8, Z0 - 1.0);
    // the fireplace wall and the tapestry, the reading tables, the lamps
    k.box(4.6, 5.2, 0.8, 0, 2.6, Z1 + 0.8, marble);
    k.box(2.4, 2.2, 0.3, 0, 1.2, Z1 + 1.15, dark);
    k.point(0, 1.4, Z1 + 1.6, 0xff9a40, 14, 6);
    for (const x of [-3.4, 3.4]) { k.box(3.6, 0.1, 1.6, x, 0.9, -6, walnutL); for (const dx of [-1.6, 1.6]) k.box(0.12, 0.85, 1.4, x + dx, 0.45, -6, walnut); k.keepOut.push({ x, z: -6, r: 2.0 }); for (const dx of [-1, 1]) { k.cyl(0.03, 0.5, x + dx, 1.2, -6, bronze, 0.03, 6); k.cyl(0.22, 0.2, x + dx, 1.5, -6, k.glow(0x7fd48a), 0.16, 12); k.point(x + dx, 1.4, -6, 0xc8ffc0, 6, 4); } }
    for (let i = 0; i < 3; i++) { const z = Z0 - 6 - i * 9; k.mesh(new T.SphereGeometry(4.2, 24, 10, 0, PI * 2, 0, PI / 2), plaster, 0, RH - 0.2, z).scale.set(1.6, 0.5, 1); k.point(0, RH - 2.4, z, 0xfff0dc, 26, 16); }
    k.censusWall({ x: 0, y: 9.8, z: Z1 + 0.2, rotY: 0, cols: 20, rows: 3, tile: 0.55, gap: 0.05, start: ctx.wallStart(1500, 60), pieces: ctx.all, backing: walnut });
    // the works: between the tiers on the case walls (hung on the balcony fronts), the fireplace tapestry, over the door
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = Z0 - 5 - i * 6; mounts.push({ position: v(s * (RW / 2 - 0.9 - BW - 0.12), 5.0, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 3, z), width: 4.0, height: 1.2, style: 'gilt', wash: false }); mounts.push({ position: v(s * (RW / 2 - 0.9 - BW - 0.12), 9.0, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 6, z), width: 4.0, height: 1.2, style: 'gilt', wash: false }); }
    for (const x of [-6, 6]) mounts.push({ position: v(x, 5.0, Z1 + 0.9 + BW + 0.12), rotation: PI, target: v(x, 3, Z1 + 10), width: 4.0, height: 1.2, style: 'gilt', wash: false });
    mounts.push({ position: v(0, 6.8, Z1 + 0.42), rotation: 0, target: v(0, 4, Z1 + 10), width: 4.4, height: 3.2, style: 'gilt', wash: true });
    mounts.push({ position: v(0, 5.4, Z0 - 0.2), rotation: PI, target: v(0, 3, Z0 - 8), width: 3.6, height: 2.1, style: 'gilt', wash: true });
    for (const s of [-1, 1]) mounts.push({ position: v(s * 6, 5.4, Z0 - 0.2), rotation: PI, target: v(s * 6, 3, Z0 - 8), width: 3.6, height: 2.1, style: 'gilt', wash: true });
    const bal = (x: number, z: number) => { const onSide = Math.abs(x) > RW / 2 - 0.9 - BW && Math.abs(x) < RW / 2 - 0.85 && z > Z1 + 0.9 && z < Z0 - 1; const onEnd = z > Z1 + 0.9 && z < Z1 + 0.9 + BW && Math.abs(x) < RW / 2 - 0.9; return onSide || onEnd; };
    return { mounts, spawn: v(0, 3, FZ + 30), look: v(0, 7, FZ), eye: 3, bounds: [-RW / 2 + 0.6, RW / 2 - 0.6, Z1 + 0.6, FZ + 34], style: 'gilt', floorY: (x, z) => {
      if (z > FZ + 1 && z < FZ + 5.4) return Math.max(0, Math.min(0.64, (FZ + 5.4 - z) / 4.4 * 0.64));
      if (z > FZ - 0.2 && z <= FZ + 1) return 0.64 - 0.64 * Math.max(0, (z - FZ + 0.2) / 1.2) + 0.64 * 0;
      // right stair to the first balcony, left stair from the first to the second
      if (Math.abs(x - (RW / 2 - 0.9 - BW / 2)) < BW / 2 && z < Z0 - 1.0 && z > Z0 - 8) return Math.min(4, (Z0 - 1.0 - z) / 6.7 * 4);
      if (Math.abs(x + (RW / 2 - 0.9 - BW / 2)) < BW / 2 && z < Z0 - 1.0 && z > Z0 - 8) return 4 + Math.min(4, (Z0 - 1.0 - z) / 6.7 * 4);
      if (bal(x, z)) return x > 0 ? 4 : 8;
      return 0;
    } };
  },
};

/* ---------------- 48 RADIO CITY ---------------- */
export const radiocity: RoomDef = {
  id: 'radiocity',
  name: 'The great stage',
  area: 'RADIO CITY MUSIC HALL',
  mood: 'House lights down',
  color: '#c8963a',
  description: 'Sixth Avenue under the marquee, the grand foyer, then the auditorium: the sunrise arches of the proscenium, the great stage, the works as the show.',
  signatures: 'The neon marquee wrapping the corner, the grand foyer with its gold mural and chandeliers, the telescoping plaster arches of the auditorium radiating from the stage, the deep red seats, the gold curtain.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x141a2e, horizon: 0x5a4a60, ground: 0x0e0e12, fog: 0.003, stars: 120, env: 0.6 });
    k.hemi(0xffd8c0, 0x1a1418, 0.4);
    const gold = k.pbr('rcGold', X.gilt(0xd8b060), 2, { metalness: 0.85, roughness: 0.3 }),
      plasterA = k.pbr('rcArch', X.plaster(0xd8b890, 52), 0.35, { roughness: 0.8 }),
      plasterB = k.pbr('rcArchB', X.plaster(0xb8905e, 53), 0.35, { roughness: 0.8 }),
      red = k.pbr('rcSeats', X.velvet(0x8a1a22), 0.4, { roughness: 0.95 }),
      carpet = k.pbr('rcCarpet', X.carpet(0x5a1a22, 0xc79a4a), 0.5),
      curtain = k.pbr('rcCurtain', X.velvet(0xb08a30), 0.3, { roughness: 0.9, metalness: 0.3 }),
      stage = k.pbr('rcStage', X.planks(0x2a2018, 6, 101), 1.2, { roughness: 0.6 }),
      dark = k.flat(0x0e0e12, 0.4, 0.8),
      neon = k.glow(0xff3a3a),
      neonB = k.glow(0x3a8aff),
      warm = k.glow(0xffe0b0),
      limestone = k.pbr('rcLimestone', X.ashlar(0xb8ad97, 102, 3), 0.22);
    // Sixth Avenue and the marquee corner
    street(k, { w: 24, len: 140, z: 30, x: 0 });
    blockFront(k, { x: -46, z0: 90, count: 10, face: 1, seed: 103, h: [18, 40] });
    const FZ = 10;
    k.box(70, 40, 60, 0, 20, FZ - 30, limestone);
    for (let i = 0; i < 3; i++) k.box(24 - i * 4, 8, 24 - i * 4, 0, 40 + 4 + i * 8, FZ - 40, limestone);
    for (let x = -34; x <= 34; x += 6) k.box(1.2, 40, 0.8, x, 20, FZ + 0.4, limestone);
    for (let i = 0; i < 9; i++) { const ch = 'RADIO CITY'[i]; const y = 30 - i * 2.1; k.box(2.6, 2.1, 1.0, -22, y, FZ + 3.6, dark); if (ch !== ' ') { k.sign(ch, 2.2, 1.9, -22, y, FZ + 4.12, '#14090a', '#ff4a4a', 150, 0, { border: false }); k.sign(ch, 2.2, 1.9, -22, y, FZ + 3.08, '#14090a', '#ff4a4a', 150, PI, { border: false }); } }
    k.mesh(new T.BoxGeometry(0.1, 19, 0.1), neon, -23.32, 20.5, FZ + 3.6); k.mesh(new T.BoxGeometry(0.1, 19, 0.1), neon, -20.68, 20.5, FZ + 3.6);
    k.point(-22, 22, FZ + 7, 0xff5a4a, 60, 26);
    k.box(40, 3.2, 6, 0, 8.2, FZ + 3, dark);
    for (const [y, m] of [[6.7, neon], [9.7, neon], [8.2, neonB]] as const) k.mesh(new T.BoxGeometry(40.2, 0.08, 6.2), m, 0, y, FZ + 3);
    k.sign('RADIO CITY MUSIC HALL', 30, 2.2, 0, 8.2, FZ + 6.05, '#14090a', '#ff4a4a', 160, 0, { border: true });
    k.sign('THE MUSEUM  ·  TONIGHT  ·  THE NEW YORKERS', 30, 1.2, 0, 4.9, FZ + 6.05, '#14090a', '#ffe0b0', 90, 0);
    for (let i = 0; i < 12; i++) k.point(-18 + i * 3.3, 6.2, FZ + 5, 0xff6a5a, 8, 6);
    for (let x = -18; x <= 18; x += 4.5) { k.box(2.6, 5.4, 0.3, x, 2.7, FZ, k.glass(0xffe0b0, 0.3, 0.1)); k.box(0.3, 5.4, 0.3, x + 2.25, 2.7, FZ, gold); }
    k.block(-40, -3.2, FZ - 0.3, FZ + 0.3); k.block(3.2, 40, FZ - 0.3, FZ + 0.3);
    // the grand foyer: tall, gold mural wall (the census), chandeliers, the stair
    const GW = 30, GD = 16;
    k.box(GW, 0.3, GD, 0, 0.15, FZ - GD / 2, carpet);
    k.box(GW, 18, 0.6, 0, 9, FZ - GD, plasterB);
    k.block(-GW / 2, -4, FZ - GD - 0.5, FZ - GD + 0.5); k.block(4, GW / 2, FZ - GD - 0.5, FZ - GD + 0.5);
    for (const s of [-1, 1]) { k.box(0.6, 18, GD, s * GW / 2, 9, FZ - GD / 2, plasterB); k.block(s * GW / 2 - 0.5, s * GW / 2 + 0.5, FZ - GD, FZ); }
    k.box(GW, 0.6, GD, 0, 18, FZ - GD / 2, dark);
    k.censusWall({ x: 0, y: 8.4, z: FZ - GD + 0.34, rotY: 0, cols: 40, rows: 8, tile: 0.55, gap: 0.05, start: ctx.wallStart(5600, 320), pieces: ctx.all, backing: gold });
    for (const x of [-9, 9]) { for (let i = 0; i < 5; i++) { k.cyl(0.9 - i * 0.14, 1.4, x, 12 - i * 1.5, FZ - GD / 2, k.glass(0xfff0d0, 0.5, 0.05), 0.5 - i * 0.08, 16); } k.point(x, 9, FZ - GD / 2, 0xffe6c0, 40, 22); k.beam(v(x, 18, FZ - GD / 2), v(x, 12.6, FZ - GD / 2), 0.05, gold, 4); }
    for (let i = 0; i < 12; i++) { for (const s of [-1, 1]) k.box(3, 0.3, 1.2, s * (GW / 2 - 2.5), 0.15 + i * 0.3, FZ - 3 - i * 1.0, carpet); }
    // the auditorium: the fan of arches stepping down to the stage, the seats, the stage and the gold curtain
    const AZ = FZ - GD, arches = 8;
    for (let i = 0; i < arches; i++) {
      const w = 56 - i * 5, h = 26 - i * 2.2, z = AZ - 4 - i * 7;
      const a = k.mesh(new T.TorusGeometry(w / 2, 1.3, 8, 40, PI), i % 2 ? plasterA : plasterB, 0, 0, z);
      a.scale.set(1, h / (w / 2), 1);
      for (const s of [-1, 1]) k.box(2.4, 2, 7, s * (w / 2 + 0.2), 1, z - 3.5, i % 2 ? plasterA : plasterB);
      k.box(w + 2, 0.8, 7, 0, h + 0.4, z - 3.5, dark);
      for (const s of [-1, 1]) { k.box(0.4, h, 7, s * (w / 2 + 1.3), h / 2, z - 3.5, dark); k.block(s * (w / 2 + 1.1), s * (w / 2 + 1.5), z - 7, z); }
      k.point(0, h - 3, z - 3.5, 0xffc890, 60, 40);
      for (const s of [-1, 1]) k.point(s * (w / 2 - 3), h - 4, z - 3.5, 0xff9a60, 30, 20);
    }
    const SZ = AZ - 4 - arches * 7;
    k.box(60, 0.3, 64, 0, -0.15, SZ + 32, carpet);
    const seatG = new T.BoxGeometry(0.55, 0.6, 0.6), seats: T.Matrix4[] = [];
    seatG.translate(0, 0.3, 0);
    for (let r = 0; r < 18; r++) { const z = AZ - 8 - r * 2.6, drop = -r * 0.24; for (let x = -18; x <= 18; x += 0.7) { if (Math.abs(x) < 1.8 || Math.abs(Math.abs(x) - 10) < 1) continue; seats.push(new T.Matrix4().compose(v(x, drop, z), new T.Quaternion(), v(1, 1, 1))); } k.box(44, 0.3, 2.6, 0, drop - 0.15, z, carpet); }
    k.instances(seatG, red, seats);
    k.block(-19, -1.8, SZ + 8, AZ - 7); k.block(1.8, 19, SZ + 8, AZ - 7);
    const stageY = -18 * 0.24 - 0.5 + 1.4;
    k.box(44, 1.6, 20, 0, stageY - 0.8, SZ - 6, stage);
    k.mesh(new T.CylinderGeometry(6, 6, 0.4, 32), stage, 0, stageY + 0.2, SZ + 2);
    k.box(46, 24, 1.0, 0, stageY + 12, SZ - 16, curtain);
    for (let x = -22; x <= 22; x += 2) k.box(0.8, 24, 1.2, x, stageY + 12, SZ - 15.8, curtain);
    for (let i = 0; i < 9; i++) k.spot(-16 + i * 4, stageY + 22, SZ + 4, -16 + i * 4, stageY, SZ - 8, 0xfff0d8, 200, 0.4, 0.6, 40);
    for (const s of [-1, 1]) k.box(4, 9, 2, s * 22, stageY + 4.5, SZ - 4, gold);
    // the show: the curated works cycle on a great screen over the stage, and a sunrise wash climbs the arches
    const show = k.mesh(new T.PlaneGeometry(26, 14.6), new T.MeshBasicMaterial({ color: 0x111111 }), 0, stageY + 12, SZ - 14.9);
    void show;
    if (!ctx.reduced) { const glows: T.PointLight[] = []; k.scene.traverse((o) => { if (o instanceof T.PointLight && o.position.z < AZ && o.position.z > SZ - 1) glows.push(o); }); k.ticks.push((t) => glows.forEach((l, i) => { l.intensity = 40 + 30 * Math.sin(t * 0.6 + i * 0.5); })); }
    // the works: the foyer, the arch piers on both sides of the fan, the stage screen
    const mounts: Mount[] = [];
    for (let i = 0; i < 4; i++) { const z = FZ - 2 - i * 3.6; for (const s of [-1, 1]) mounts.push({ position: v(s * (GW / 2 - 0.34), 3.8, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 3, z), width: 3.0, height: 1.8, style: 'gilt', wash: true }); }
    for (let i = 0; i < 6; i++) { const w = 56 - i * 5, z = AZ - 4 - i * 7 - 3.5; const drop = -Math.max(0, (AZ - 8 - z) / 2.6) * 0.24; for (const s of [-1, 1]) mounts.push({ position: v(s * (w / 2 + 1.06), drop + 4.2, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 1.2, drop + 3, z), width: 4.6, height: 2.7, style: 'gilt', wash: true }); }
    mounts.push({ position: v(0, stageY + 12, SZ - 14.8), rotation: 0, target: v(0, stageY + 6, SZ + 12), width: 26, height: 14.6, style: 'none', wash: false });
    for (const x of [-13, 13]) mounts.push({ position: v(x, stageY + 4, SZ - 14.7), rotation: 0, target: v(x < 0 ? -1.2 : 1.2, stageY + 3, SZ + 10), width: 6, height: 3.5, style: 'gilt', wash: false });
    return { mounts, spawn: v(-30, 3, FZ + 24), look: v(-6, 10, FZ + 2), eye: 3, bounds: [-34, 20, SZ + 6, FZ + 32], style: 'gilt', floorY: (x, z) => { void x; if (z < AZ - 7) return -Math.min(18, Math.max(0, (AZ - 8 - z) / 2.6)) * 0.24; return 0; } };
  },
};

/* ---------------- 49 THE WOOLWORTH LOBBY ---------------- */
export const woolworth: RoomDef = {
  id: 'woolworth',
  name: 'The cathedral of commerce',
  area: 'THE WOOLWORTH BUILDING',
  mood: 'Gothic gold',
  color: '#d4c48a',
  description: 'Broadway under the terracotta tower, then the cruciform lobby: gold mosaic vaults, marble, the gothic grilles, the works in the arcade bays.',
  signatures: 'The 792 foot terracotta gothic tower with its green copper crown, the cross shaped lobby with a barrel vault of Byzantine glass mosaic, veined marble walls, bronze gothic tracery, the mezzanine murals.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad0, horizon: 0xe6e8e4, ground: 0x5a5a55, fog: 0.0022, sun: { az: 3.6, el: 0.75, color: 0xfff4e6, size: 12 }, env: 0.85 });
    k.hemi(0xfff0dc, 0x3a3020, 0.55);
    k.sun(0xfff0d8, 1.6, 40, 60, 30, true, 70);
    const terra = k.pbr('wwTerra', X.windows(104, 0.3, 0xd8d0b8, true), 0.12, { emissive: 0xffffff, emissiveIntensity: 0.5, roughness: 0.7, stretch: 0.42 }),
      terraS = k.pbr('wwTerraS', X.ashlar(0xe0d8c0, 105, 4), 0.2),
      marble = k.pbr('wwMarble', X.marble(0xd8cfb8, 0x8a7a5a, 11), 0.35, { roughness: 0.3 }),
      mosaic = k.pbr('wwMosaic', X.gilt(0xc9a552), 1.2, { metalness: 0.7, roughness: 0.45, side: T.BackSide }),
      mosaicF = k.pbr('wwMosaicF', X.gilt(0xc9a552), 1.2, { metalness: 0.7, roughness: 0.45 }),
      bronze = k.flat(0x5a4a2a, 0.8, 0.4),
      floorM = k.pbr('wwFloor', X.terrazzo(0xc8bca0, 54), 0.4, { roughness: 0.3 }),
      copper = k.pbr('wwCopper', X.patina(0x5f9a8c), 0.6, { roughness: 0.6, metalness: 0.3 }),
      glass = k.glass(0xdcecf6, 0.14, 0.04),
      dark = k.flat(0x1a1a1c, 0.5, 0.6),
      glow = k.glow(0xffe8b0);
    // Broadway, City Hall Park across the street, the tower
    street(k, { w: 22, len: 140, z: 30, x: 0 });
    k.box(90, 0.4, 70, 0, -0.1, 70, k.pbr('wwLawn', X.grass(0x4b6b3a, 55), 0.05));
    for (let i = 0; i < 16; i++) { const rnd = X.mulberry(49 + i); const tx = -40 + rnd() * 80, tz = 45 + rnd() * 40; if (Math.abs(tx) < 14) continue; k.tree(tx, 0, tz, { kind: 'round', h: 5 + rnd() * 3, r: 2.4 + rnd() * 1.4, seed: i }); }
    k.box(12, 0.3, 70, 0, 0.05, 70, k.pbr('wwPath', X.pavers(0x9a9a94, 57), 0.4));
    blockFront(k, { x: -50, z0: 90, count: 10, face: 1, seed: 106, h: [18, 34] });
    const FZ = 8, TW = 46;
    k.box(TW, 96, 40, 0, 48, FZ - 20, terra);
    for (let i = 0; i < 3; i++) k.box(TW - i * 2, 1.2, 40 - i * 2, 0, 20 + i * 30, FZ - 20, terraS);
    for (let x = -TW / 2 + 2; x < TW / 2; x += 4) k.box(0.7, 96, 0.5, x, 48, FZ + 0.2, terraS);
    for (const s of [-1, 1]) k.box(0.7, 96, 40.4, s * (TW / 2 - 0.2), 48, FZ - 20, terraS);
    k.box(26, 120, 26, 0, 96 + 60, FZ - 20, terra);
    for (let x = -12; x <= 12; x += 3.2) k.box(0.5, 120, 0.4, x, 156, FZ - 20 + 13.1, terraS);
    for (let i = 0; i < 3; i++) k.moulding([[0, 0], [0.7, 0], [0.8, 0.3], [0.4, 0.5], [0.6, 0.8], [0, 1.0]], 26.4, 0, 120 + i * 30, FZ - 20 + 13.2, terraS, 0);
    k.mesh(new T.ConeGeometry(15, 30, 4), copper, 0, 216 + 15, FZ - 20).rotation.y = PI / 4;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { k.box(3, 12, 3, sx * 12, 216 + 6, FZ - 20 + sz * 12, terraS); k.mesh(new T.ConeGeometry(2, 6, 4), copper, sx * 12, 216 + 15, FZ - 20 + sz * 12); }
    k.point(0, 244, FZ - 20, 0xfff0c8, 400, 120);
    k.arch(8, 14, 6, 0, 0, FZ - 3, terraS, true, 0.85);
    for (let i = 0; i < 4; i++) k.arch(8 + i * 1.4, 14 + i * 1.2, 0.5, 0, 0, FZ + 0.2 + i * 0.5, terraS, true, 0.66);
    k.block(-TW / 2, -4, FZ - 0.4, FZ + 0.4); k.block(4, TW / 2, FZ - 0.4, FZ + 0.4);
    k.box(TW, 0.3, 4, 0, 0.15, FZ + 3, terraS);
    // the lobby: a cross of two barrel vaulted arms, mosaic above, marble below, bronze grilles, the mezzanine
    const arm = (len: number, w: number, h: number, x: number, z: number, rot: number) => {
      const vault = k.mesh(new T.CylinderGeometry(w / 2, w / 2, len, 24, 1, true, PI, PI), mosaic, x, h, z);
      vault.rotation.set(rot === 0 ? PI / 2 : PI / 2, 0, rot === 0 ? 0 : PI / 2);
      vault.rotation.z = rot === 0 ? 0 : PI / 2;
      vault.rotation.x = PI / 2;
      if (rot !== 0) vault.rotation.set(0, 0, PI / 2), vault.rotateX(PI / 2);
      for (const s of [-1, 1]) { const wallM = k.box(rot === 0 ? 0.6 : len, h, rot === 0 ? len : 0.6, 0, h / 2, 0, marble); wallM.position.set(rot === 0 ? x + s * w / 2 : x, h / 2, rot === 0 ? z : z + s * w / 2); }
      const ceil = k.box(rot === 0 ? w + 1 : len, 0.4, rot === 0 ? len : w + 1, 0, h + w / 2 + 0.2, 0, dark); ceil.position.set(x, h + w / 2 + 0.2, z);
    };
    const LZ = FZ - 20, LEN = 40, AW = 12, AH = 8;
    arm(LEN, AW, AH, 0, LZ, 0);
    arm(30, AW, AH, 0, LZ, 1);
    k.box(LEN + 4, 0.3, 34, 0, 0.15, LZ, floorM);
    k.block(-AW / 2 - 0.5, -AW / 2 + 0.1, LZ - LEN / 2, LZ - AW / 2); k.block(AW / 2 - 0.1, AW / 2 + 0.5, LZ - LEN / 2, LZ - AW / 2);
    k.block(-AW / 2 - 0.5, -AW / 2 + 0.1, LZ + AW / 2, FZ); k.block(AW / 2 - 0.1, AW / 2 + 0.5, LZ + AW / 2, FZ);
    k.block(-15.5, -AW / 2, LZ - AW / 2 - 0.5, LZ - AW / 2 + 0.1); k.block(AW / 2, 15.5, LZ - AW / 2 - 0.5, LZ - AW / 2 + 0.1);
    k.block(-15.5, -AW / 2, LZ + AW / 2 - 0.1, LZ + AW / 2 + 0.5); k.block(AW / 2, 15.5, LZ + AW / 2 - 0.1, LZ + AW / 2 + 0.5);
    k.block(-15.5, 15.5, LZ - LEN / 2 - 0.5, LZ - LEN / 2 + 0.1);
    k.block(-15.5, -15, LZ - AW / 2, LZ + AW / 2); k.block(15, 15.5, LZ - AW / 2, LZ + AW / 2);
    // the crossing: a shallow dome of mosaic, the mezzanine balconies with bronze rails on both cross arms
    const dome = k.mesh(new T.SphereGeometry(AW / 2 + 1, 32, 12, 0, PI * 2, 0, PI / 2), mosaic, 0, AH, LZ); dome.scale.y = 0.7;
    k.point(0, AH + 2, LZ, 0xffe6b0, 60, 30);
    for (const s of [-1, 1]) { k.box(6, 0.3, AW - 1, s * 12, 4.6, LZ, marble); k.rail(s * 9.2, LZ, AW - 1, bronze, 0.95, 'z', 1.4); k.point(s * 12, 7, LZ, 0xffe6b0, 20, 12); }
    for (let i = 0; i < 6; i++) { const z = LZ - 14 + i * 5; for (const s of [-1, 1]) { k.box(0.16, 3.2, 2.4, s * (AW / 2 - 0.1), 4.4, z, bronze); k.box(0.1, 0.1, 2.4, s * (AW / 2 - 0.2), 3.6, z, bronze); k.box(0.1, 0.1, 2.4, s * (AW / 2 - 0.2), 5.2, z, bronze); } k.point(0, AH - 1, z, 0xffe0a8, 22, 12); }
    for (const s of [-1, 1]) { k.box(2.4, 5, 0.3, s * 3.6, 2.5, LZ - LEN / 2 + 0.4, bronze); k.mesh(new T.PlaneGeometry(1.6, 3.4), glow, s * 3.6, 2.6, LZ - LEN / 2 + 0.6); }
    k.censusWall({ x: 0, y: 3.6, z: LZ - LEN / 2 + 0.36, rotY: 0, cols: 12, rows: 5, tile: 0.55, gap: 0.05, start: ctx.wallStart(4900, 60), pieces: ctx.all, backing: mosaicF });
    k.sign('THE MUSEUM  ·  WOOLWORTH  ·  1913', 8, 0.7, 0, 6.8, LZ - LEN / 2 + 0.36, 'transparent', '#f0e0b0', 70, 0);
    for (const s of [-1, 1]) k.box(0.8, 0.8, 0.8, s * 4, 0.4, LZ + 8, marble), k.prop('lantern', s * 4, 0.8, LZ + 8, { height: 1.1 });
    // the works: the arcade bays of the long arm between the grilles, the cross arms, the mezzanine fronts
    const mounts: Mount[] = [];
    for (let i = 0; i < 5; i++) { const z = LZ - 11.5 + i * 5; for (const s of [-1, 1]) mounts.push({ position: v(s * (AW / 2 - 0.34), 2.4, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 2.5, z), width: 3.0, height: 1.8, style: 'gilt', wash: true }); }
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const x = s * (8 + i * 3); mounts.push({ position: v(x, 2.6, LZ - AW / 2 + 0.34), rotation: 0, target: v(x, 2.5, LZ), width: 2.4, height: 1.5, style: 'gilt', wash: false }); mounts.push({ position: v(x, 2.6, LZ + AW / 2 - 0.34), rotation: PI, target: v(x, 2.5, LZ), width: 2.4, height: 1.5, style: 'gilt', wash: false }); }
    for (const s of [-1, 1]) mounts.push({ position: v(s * 9.05, 6.0, LZ), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 3, LZ), width: 4.6, height: 2.7, style: 'gilt', wash: true });
    return { mounts, spawn: v(12, 3, FZ + 88), look: v(0, 70, FZ - 20), eye: 3, bounds: [-24, 24, LZ - LEN / 2 + 1, FZ + 96], style: 'gilt' };
  },
};

/* ---------------- 50 WALL STREET ---------------- */
export const wallstreet: RoomDef = {
  id: 'wallstreet',
  name: 'The canyon',
  area: 'WALL STREET',
  mood: 'Opening bell',
  color: '#9aa8b8',
  description: 'The narrow canyon at Broad Street, the Doric steps of Federal Hall, the exchange front with its columns and the giant banner, the crowd at the bell, the works in the canyon.',
  signatures: 'The stone canyon of Wall and Broad, the Greek Revival Federal Hall with its steps and statue plinth, the six Corinthian columns and pediment of the exchange with a banner between them, the flags, the crowds, the cobbles.',
  build(k, ctx) {
    k.sky({ top: 0x5f8fc8, horizon: 0xe4e6e2, ground: 0x4a4a48, fog: 0.0022, sun: { az: 2.6, el: 0.65, color: 0xfff4e6, size: 12 }, env: 0.9 });
    k.hemi(0xe8f0ff, 0x3a3a38, 0.8);
    k.sun(0xfff0dc, 2.0, 30, 70, 20, true, 80);
    const lime = k.pbr('wsLime', X.ashlar(0xc8c0ac, 107, 3), 0.22),
      granite = k.pbr('wsGranite', X.ashlar(0x8a8480, 108, 2), 0.2),
      facade = k.pbr('wsFacade', X.windows(109, 0.3, 0x8a8478, false), 0.12, { emissive: 0xffffff, emissiveIntensity: 0.5, roughness: 0.6, stretch: 0.42 }),
      cobble = k.pbr('wsCobble', X.cobble(0x6f6c68, 56), 0.9),
      bronze = k.flat(0x4a3a22, 0.8, 0.4),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      navy = k.flat(0x1d2f5c, 0.1, 0.7),
      redF = k.flat(0xb8202a, 0.1, 0.7),
      white = k.flat(0xf4f0e8, 0, 0.8);
    // the canyon: Wall Street running along x, Broad Street opening south, tall walls of stone and glass
    k.box(200, 0.4, 16, 0, -0.2, 0, cobble);
    k.box(18, 0.4, 100, 0, -0.2, 50, cobble);
    for (const s of [-1, 1]) k.box(200, 0.3, 3.4, 0, 0.05, s * 9.7, k.pbr('wsWalk', X.pavers(0x9a9a94, 57), 0.4));
    for (let x = -90; x <= 90; x += 24) { if (Math.abs(x) < 20) continue; k.box(22, 60 + (Math.abs(x) % 48), 30, x, 30 + (Math.abs(x) % 48) / 2, -26, facade); k.box(22, 50, 30, x, 25, 26, facade); }
    for (const x of [-60, 60]) k.block(x - 11, x + 11, -41, -11), k.block(x - 11, x + 11, 11, 41);
    k.block(-100, 100, -12, -11); k.block(-100, -9, 11, 12); k.block(9, 100, 11, 12);
    k.skyline({ z: -140, count: 30, spacing: 9, scale: 4.6, base: -1, seed: 114, lit: 0.25, glow: 0.6, tint: 0x5a6270, rows: 1 });
    // Federal Hall: the Doric front up a broad flight of steps on the north side, the plinth
    const HX = -16, HZ = -12;
    k.box(30, 22, 26, HX, 11, HZ - 13, lime);
    k.box(30, 1.6, 26, HX, 22.8, HZ - 13, lime);
    for (let i = 0; i < 12; i++) k.box(26, 0.34, 1.2, HX, 0.17 + i * 0.34, HZ + 4.2 - i * 0.55, lime);
    k.box(30, 4.2, 6, HX, 6.2, HZ - 2.5, lime);
    for (let i = 0; i < 8; i++) k.column(HX - 12 + i * 3.4, 4.2, HZ - 1.5, 12.4, 0.9, lime, true);
    k.box(30, 1.8, 6, HX, 17.5, HZ - 1.5, lime);
    k.mesh(new T.CylinderGeometry(0.1, 20, 6, 3), lime, HX, 18.4 + 3, HZ - 1.5).rotation.set(0, 0, 0);
    const ped = new T.Shape(); ped.moveTo(-15, 0); ped.lineTo(15, 0); ped.lineTo(0, 6); ped.closePath();
    k.mesh(new T.ExtrudeGeometry(ped, { depth: 6, bevelEnabled: false }), lime, HX, 18.4, HZ - 4.5);
    k.box(3, 4.6, 3, HX, 6.2 + 2.3 + 2.1, HZ + 0.5, granite);
    k.box(3.4, 0.5, 3.4, HX, 6.2 + 4.2, HZ + 0.5, granite);
    k.keepOut.push({ x: HX, z: HZ + 0.5, r: 2.2 });
    k.block(HX - 15, HX + 15, HZ - 26, HZ - 3);
    k.sign('FEDERAL HALL  ·  1842', 10, 0.8, HX, 16.8, HZ + 1.6, 'transparent', '#5a5040', 80, 0);
    // the exchange: six columns and a pediment on the south west corner, the banner as the census
    const EX = -30, EZ = 10;
    k.box(34, 30, 26, EX, 15, EZ + 13, lime);
    k.box(38, 2, 30, EX, 31, EZ + 13, lime);
    for (let i = 0; i < 6; i++) k.column(EX - 12 + i * 4.8, 4.5, EZ + 1.5, 16, 1.0, lime, true);
    k.box(34, 4.5, 6, EX, 2.25, EZ + 2.5, granite);
    k.box(34, 2.6, 6, EX, 21.8, EZ + 1.5, lime);
    const ped2 = new T.Shape(); ped2.moveTo(-17, 0); ped2.lineTo(17, 0); ped2.lineTo(0, 6); ped2.closePath();
    k.mesh(new T.ExtrudeGeometry(ped2, { depth: 6, bevelEnabled: false }), lime, EX, 23.1, EZ - 1.5);
    k.block(EX - 17, EX + 17, EZ - 0.5, EZ + 26);
    k.censusWall({ x: EX, y: 12.6, z: EZ - 1.7, rotY: PI, cols: 22, rows: 10, tile: 0.55, gap: 0.05, start: ctx.wallStart(5000, 220), pieces: ctx.all, backing: navy });
    for (const [s, m] of [[-1, redF], [0, white], [1, navy]] as const) { k.beam(v(EX + s * 10, 24, EZ - 2), v(EX + s * 10 + 2, 30, EZ - 5), 0.12, dark, 4); k.box(3, 2, 0.1, EX + s * 10 + 2.6, 29, EZ - 5.2, m); }
    // the crowd at the bell, the barriers, the bull's plinth by the subway stair, the works
    k.crowd([v(-60, 0, -6), v(-30, 0, -5), v(0, 0, -6), v(30, 0, -5), v(60, 0, -6)], 40, { seed: 50, speed: 1.0, spread: 4, animate: !ctx.reduced });
    k.crowd([v(EX - 14, 0, EZ - 4), v(EX, 0, EZ - 3), v(EX + 14, 0, EZ - 4), v(EX + 14, 0, 6), v(0, 0, 5), v(0, 0, 40)], 30, { seed: 51, speed: 0.6, spread: 3, animate: !ctx.reduced });
    for (let i = 0; i < 8; i++) { k.box(2.2, 1.0, 0.06, EX - 10 + i * 3, 0.55, EZ - 6, dark); for (const dx of [-1.05, 1.05]) k.box(0.06, 1.05, 0.06, EX - 10 + i * 3 + dx, 0.52, EZ - 6, dark); }
    k.prop('mailbox', 30, 0, -8.6, { height: 1.5 });
    k.prop('hydrant', -50, 0, 8.6, { height: 1.1 });
    for (const x of [-70, -40, 40, 70]) for (const s of [-1, 1]) k.lamp(x, s * 8.8, 6, dark, 0xffe6c8, 20);
    const mounts: Mount[] = [];
    for (let i = 0; i < 6; i++) { const x = 14 + i * 12; k.box(4.6, 3.4, 0.3, x, 3.2, -11.6, dark); mounts.push({ position: v(x, 3.4, -11.4), rotation: 0, target: v(x, 3, -2), width: 4.2, height: 2.5, style: 'steel', wash: false }); }
    for (let i = 0; i < 6; i++) { const x = 14 + i * 12; k.box(4.6, 3.4, 0.3, x, 3.2, 11.6, dark); mounts.push({ position: v(x, 3.4, 11.4), rotation: PI, target: v(x, 3, 2), width: 4.2, height: 2.5, style: 'steel', wash: false }); }
    for (let i = 0; i < 4; i++) { const z = 18 + i * 10; for (const s of [-1, 1]) { k.box(0.3, 3.4, 4.6, s * 8.6, 3.2, z, dark); mounts.push({ position: v(s * 8.4, 3.4, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 3, z), width: 4.2, height: 2.5, style: 'steel', wash: false }); } }
    for (let i = 0; i < 3; i++) { const x = HX - 9 + i * 9; mounts.push({ position: v(x, 9.4, HZ - 5.9), rotation: 0, target: v(x, 8, HZ + 6), width: 2.6, height: 3.4, style: 'gilt', wash: true }); }
    k.block(HX - 15, HX + 15, HZ - 6.5, HZ - 5.5);
    return { mounts, spawn: v(20, 3, 2), look: v(EX, 14, EZ), eye: 3, bounds: [-90, 90, -10, 60], style: 'steel', floorY: (x, z) => { if (Math.abs(x - HX) < 13 && z < HZ + 4.8 && z > HZ - 2.4) return Math.min(4.2, Math.max(0, (HZ + 4.8 - z) / 6.6 * 4.2)); if (Math.abs(x - HX) < 15 && z <= HZ - 2.4 && z > HZ - 5.5) return 4.2; return 0; } };
  },
};

/* ---------------- 51 LINCOLN CENTER ---------------- */
export const lincolncenter: RoomDef = {
  id: 'lincolncenter',
  name: 'The plaza at eight',
  area: 'LINCOLN CENTER',
  mood: 'Curtain in ten minutes',
  color: '#e8d8a8',
  description: 'The travertine plaza around the fountain, the opera house arches with the works hung where the murals are, the crystal chandeliers rising, the crowd in evening clothes.',
  signatures: 'The travertine plaza with the round fountain at its centre, the five soaring arches of the opera house glowing through glass, the two great murals in the lobby, the starburst chandeliers, the flanking theaters with their colonnades.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x1a2446, horizon: 0x6a5a70, ground: 0x14141a, fog: 0.0026, stars: 260, env: 0.7 });
    k.hemi(0xffe4c8, 0x1a1418, 0.5);
    k.sun(0xc8d0ff, 0.5, -40, 60, 40, true, 90);
    const trav = k.pbr('lcTravertine', X.ashlar(0xe0d6c0, 110, 4), 0.3, { roughness: 0.55 }),
      travD = k.pbr('lcTravertineD', X.ashlar(0xc8bea8, 111, 3), 0.3),
      glass = k.glass(0xffe6c0, 0.18, 0.05),
      gold = k.pbr('lcGold', X.gilt(0xd8b060), 2, { metalness: 0.85, roughness: 0.3 }),
      red = k.pbr('lcCarpet', X.carpet(0x8a1a22, 0xc79a4a), 0.5),
      dark = k.flat(0x14141a, 0.5, 0.6),
      waterM = k.flat(0x88aacc, 0.3, 0.2, { transparent: true, opacity: 0.6 }),
      crystal = k.glow(0xfff4d8);
    // the plaza: a travertine field with the fountain, the three houses around it, the steps down to Columbus Avenue
    k.box(120, 0.4, 100, 0, -0.2, -10, trav);
    for (let i = 0; i < 6; i++) k.box(60, 0.3, 1.4, 0, -0.35 - i * 0.3, 40 + i * 1.4, travD);
    street(k, { w: 24, len: 140, z: 62, x: 0 });
    blockFront(k, { x: 12, z0: 130, count: 8, face: -1, seed: 112, h: [16, 30] });
    blockFront(k, { x: -12, z0: 130, count: 8, face: 1, seed: 113, h: [16, 30] });
    k.skyline({ z: -160, count: 26, spacing: 10, scale: 3.6, base: -1, seed: 115, lit: 0.45, glow: 1.2, tint: 0x2c3444, rows: 1 });
    k.mesh(new T.CylinderGeometry(9, 9.4, 0.9, 48), travD, 0, 0.45, 0);
    k.mesh(new T.CylinderGeometry(8.4, 8.4, 0.3, 48), waterM, 0, 0.95, 0);
    k.keepOut.push({ x: 0, z: 0, r: 9.6 });
    const jets: T.Mesh[] = [];
    for (let i = 0; i < 24; i++) { const a = (i / 24) * PI * 2, r = 2 + (i % 3) * 2.2; const j = k.mesh(new T.CylinderGeometry(0.05, 0.14, 4, 6), waterM, Math.cos(a) * r, 3, Math.sin(a) * r, true); jets.push(j); }
    const core = k.mesh(new T.CylinderGeometry(0.2, 0.5, 9, 8), waterM, 0, 5.4, 0, true); jets.push(core);
    if (!ctx.reduced) k.ticks.push((t) => jets.forEach((j, i) => { const s = 0.6 + 0.4 * Math.sin(t * 1.4 + i * 0.6); j.scale.y = s; j.position.y = (i === jets.length - 1 ? 4.5 : 2) * s + 1; }));
    for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; k.point(Math.cos(a) * 8, 1.6, Math.sin(a) * 8, 0xffe8c8, 6, 6); }
    // the opera house: five glass arches in a travertine frame, the lobby behind with the red stair and the two murals
    const OZ = -40, OW = 60, OH = 28;
    k.box(OW + 10, OH + 4, 40, 0, (OH + 4) / 2, OZ - 20, travD);
    k.box(OW + 10, 2, 44, 0, OH + 5, OZ - 20, trav);
    for (let i = 0; i < 5; i++) { const x = -24 + i * 12; k.arch(10, OH - 2, 3, x, 0, OZ + 0.4, trav, false, 0.9); k.mesh(new T.PlaneGeometry(9.6, OH - 4), glass, x, (OH - 4) / 2, OZ + 0.6); }
    for (let i = 0; i < 6; i++) k.column(-30 + i * 12, 0, OZ + 1.6, OH - 1, 0.9, trav, false);
    k.block(-OW / 2 - 5, -3, OZ - 0.6, OZ + 1.0); k.block(3, OW / 2 + 5, OZ - 0.6, OZ + 1.0);
    k.box(OW - 2, 0.3, 30, 0, 0.15, OZ - 15, red);
    for (let i = 0; i < 14; i++) k.box(16, 0.3, 1.4, 0, 0.15 + i * 0.3, OZ - 8 - i * 1.4, red);
    for (const s of [-1, 1]) { k.box(0.6, 6, 30, s * 8.4, 3 + 0, OZ - 22, trav); }
    k.box(OW - 2, 0.6, 30, 0, OH - 2, OZ - 15, dark);
    for (const x of [-14, 14]) for (let i = 0; i < 3; i++) { const y = OH - 6 - i * 2.2; for (let j = 0; j < 14; j++) { const a = (j / 14) * PI * 2; k.beam(v(x, y, OZ - 10), v(x + Math.cos(a) * (2.6 - i * 0.6), y + Math.sin(a) * (2.6 - i * 0.6), OZ - 10 + Math.sin(a * 2) * 1.2), 0.03, gold, 3); k.sphere(0.12, x + Math.cos(a) * (2.6 - i * 0.6), y + Math.sin(a) * (2.6 - i * 0.6), OZ - 10 + Math.sin(a * 2) * 1.2, crystal, 6); } }
    const chand = k.objects.filter((o) => o.material === crystal);
    if (!ctx.reduced) k.ticks.push((t) => { const rise = Math.max(0, Math.sin(t * 0.25)) * 3; chand.forEach((o) => { o.position.y = (o.userData.y0 ??= o.position.y) + rise; }); });
    for (const x of [-14, 14]) k.point(x, OH - 8, OZ - 10, 0xfff0d8, 90, 40);
    for (let i = 0; i < 5; i++) k.point(-24 + i * 12, 10, OZ - 4, 0xffe6c0, 40, 26);
    // the two flanking houses: colonnades of thin travertine fins with glass behind
    for (const s of [-1, 1]) { const HX = s * 52; k.box(40, 22, 60, HX, 11, -10, travD); for (let i = 0; i < 14; i++) k.box(0.8, 20, 1.2, HX - s * 20.5, 10, -36 + i * 4, trav); k.box(0.3, 20, 56, HX - s * 20.2, 10, -10, glass); k.block(HX - s * 21.5, HX + s * 20, -40, 20); for (let i = 0; i < 6; i++) k.point(HX - s * 19, 4, -32 + i * 9, 0xffe6c8, 16, 12); }
    // people, the works
    k.crowd([v(0, 0, 44), v(-6, 0, 20), v(-12, 0, 4), v(-8, 0, -14), v(0, 0, -30), v(-12, 0, -39.5)], 44, { seed: 52, speed: 0.8, spread: 5, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0x3a1a2a, 0x8a3a3a, 0xd8d0c0, 0x1a2a4a, 0xc9a25a] });
    k.crowd([v(12, 0, 30), v(16, 0, 8), v(12, 0, -14), v(4, 0, -30), v(12, 0, -39.5)], 30, { seed: 53, speed: 0.7, spread: 5, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a, 0x33477f] });
    k.censusWall({ x: 0, y: 6.2, z: OZ - 29.6, rotY: 0, cols: 30, rows: 5, tile: 0.55, gap: 0.05, start: ctx.wallStart(1800, 150), pieces: ctx.all, backing: gold });
    k.sign('THE MUSEUM  ·  OPENING NIGHT  ·  THE NEW YORKERS', 16, 0.8, 0, 10.4, OZ - 29.6, 'transparent', '#f4e4b0', 70, 0);
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) mounts.push({ position: v(s * 8.05, 9, OZ - 16), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 8, OZ - 16), width: 20, height: 11, style: 'none', wash: true });
    for (let i = 0; i < 5; i++) { const x = -24 + i * 12; mounts.push({ position: v(x, 4.4, OZ - 29.6), rotation: 0, target: v(x, 3, OZ - 14), width: 5, height: 3, style: 'gilt', wash: true }); }
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const z = -34 + i * 8; mounts.push({ position: v(s * 31.4, 3.6, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 20, 3, z), width: 3.2, height: 3.8, style: 'white', wash: true }); }
    for (let i = 0; i < 4; i++) { const a = PI * 0.25 + (i / 3) * PI * 0.5; const x = Math.cos(a) * 16, z = Math.sin(a) * 16; k.box(0.3, 3, 4, x, 1.8, z, travD).rotation.y = -a + PI / 2; mounts.push({ position: v(x + Math.cos(a) * 0.2, 2.0, z + Math.sin(a) * 0.2), rotation: -a + PI / 2, target: v(Math.cos(a) * 26, 2.5, Math.sin(a) * 26), width: 3.6, height: 2.1, style: 'white', wash: false }); }
    return { mounts, spawn: v(0, 3, 44), look: v(0, 14, OZ), eye: 3, bounds: [-31, 31, OZ - 28, 52], style: 'white', floorY: (x, z) => { void x; if (z < OZ - 8) return Math.min(4.2, Math.max(0, (OZ - 8 - z) / 19.6 * 4.2)); return 0; } };
  },
};
