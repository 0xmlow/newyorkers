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
  description: 'East 36th Street off Madison Avenue, the marble palazzo, then the East Room: three storeys of walnut bookcases with two walkable balconies, the painted ceiling, the works between the tiers.',
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
    // Edward Clark Potter's two marble lionesses flank the steps (they were bronze balls here), couchant on their plinths
    const lionesses: T.Object3D[] = [];
    for (const s of [-1, 1]) { k.box(1.2, 1.8, 1.8, s * 4.4, 0.9, FZ + 4, marble); const body = k.box(0.9, 0.7, 1.6, s * 4.4, 2.15, FZ + 3.9, marble); lionesses.push(body); k.box(0.7, 0.75, 0.6, s * 4.4, 2.5, FZ + 4.7, marble); k.box(0.9, 0.18, 0.5, s * 4.4, 1.89, FZ + 4.85, marble); }
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
    // eggs
    k.egg(v(-8, 4, FZ + 0.2), { id: 'morgan-drylaid', title: 'Marble without mortar', year: '1906', text: 'McKim built the library of Tennessee marble blocks laid dry, without mortar, an uncommon method that added $50,000 to the cost. Morgan had asked him for a gem.', clue: 'Look closely at the joints in the front wall.', source: { name: 'Morgan Library & Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/Morgan_Library_%26_Museum' } }, { r: 1.8 });
    k.egg(lionesses[0], { id: 'morgan-lionesses', title: 'The lionesses', text: 'Two lionesses by the sculptor Edward Clark Potter flank the steps to the main entrance. The entrance itself is a Palladian arch, a 14 foot opening between two 9 foot ones, with two Ionic columns on each side.', clue: 'Look at the plinths either side of the steps.', source: { name: 'Morgan Library & Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/Morgan_Library_%26_Museum' } }, { r: 1.4 });
    k.egg(v(0, 2.6, FZ - 1.6), { id: 'morgan-doors', title: 'Doors from Florence', text: 'Inside the portico hang 16th century bronze doors imported from Florence, in the manner of Ghiberti\'s Baptistery doors, each leaf with five bronze panels.', clue: 'Stop in the portico before you go in.', source: { name: 'Morgan Library & Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/Morgan_Library_%26_Museum' } }, { r: 1.6 });
    k.egg(v(RW / 2 - 0.9 - BW / 2, 2.2, Z0 - 4), { id: 'morgan-stair', title: 'The stair behind the books', text: 'Some of the East Room bookcases swing out to reveal a stairway to the upper tiers and a secret compartment. The cases were lined with asbestos and glazed; the glazing was replaced with acrylic in 2010.', clue: 'Find the way up to the first balcony.', source: { name: 'Morgan Library & Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/Morgan_Library_%26_Museum' } }, { r: 1.6 });
    k.egg(v(0, 1.4, Z1 + 1.4), { id: 'morgan-avarice', title: 'The Triumph of Avarice', text: 'The fireplace in the East Room is 15th century work imported from Italy, and the tapestry above it shows the Triumph of Avarice.', clue: 'Warm your hands at the fireplace on the far wall.', source: { name: 'Morgan Library & Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/Morgan_Library_%26_Museum' } }, { r: 1.6 });
    k.egg(v(0, RH - 1.2, Z0 - 15), { id: 'morgan-zodiac', title: 'The signs overhead', text: 'H. Siddons Mowbray designed eighteen lunettes and spandrels for the ceiling, modelled on Pinturicchio. Signs of the zodiac fill the spandrels, and two of them show the changing seasons.', clue: 'Climb to the top balcony and look up.', source: { name: 'Morgan Library & Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/Morgan_Library_%26_Museum' } }, { r: 2 });
    // the works: between the tiers on the case walls (hung on the balcony fronts), the fireplace tapestry, over the door
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = Z0 - 5 - i * 6; mounts.push({ position: v(s * (RW / 2 - 0.9 - BW - 0.12), 5.0, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 3, z), width: 4.0, height: 1.2, style: 'gilt', wash: false }); mounts.push({ position: v(s * (RW / 2 - 0.9 - BW - 0.12), 9.0, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 6, z), width: 4.0, height: 1.2, style: 'gilt', wash: false }); }
    for (const x of [-6, 6]) mounts.push({ position: v(x, 5.0, Z1 + 0.9 + BW + 0.12), rotation: 0, target: v(x, 3, Z1 + 10), width: 4.0, height: 1.2, style: 'gilt', wash: false });
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
    for (let i = 0; i < 10; i++) { const ch = 'RADIO CITY'[i]; const y = 30.5 - i * 2.1; k.box(2.6, 2.1, 1.0, -22, y, FZ + 3.6, dark); if (ch !== ' ') { k.sign(ch, 2.2, 1.9, -22, y, FZ + 4.12, '#14090a', '#ff4a4a', 150, 0, { border: false }); k.sign(ch, 2.2, 1.9, -22, y, FZ + 3.08, '#14090a', '#ff4a4a', 150, PI, { border: false }); } }
    k.mesh(new T.BoxGeometry(0.1, 21.2, 0.1), neon, -23.32, 21.05, FZ + 3.6); k.mesh(new T.BoxGeometry(0.1, 21.2, 0.1), neon, -20.68, 21.05, FZ + 3.6);
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
      const w = 56 - i * 3.7, h = 26 - i * 1.2, z = AZ - 4 - i * 7;   // eight bands closing on a proscenium about 100 ft wide and 60 ft high
      const a = k.mesh(new T.TorusGeometry(w / 2, 1.3, 8, 40, PI), i % 2 ? plasterA : plasterB, 0, 0, z);
      a.scale.set(1, h / (w / 2), 1);
      for (const s of [-1, 1]) k.box(2.4, 2, 7, s * (w / 2 - 0.6), 1, z - 3.5, i % 2 ? plasterA : plasterB);
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
    const turntable = k.mesh(new T.CylinderGeometry(7.6, 7.6, 0.4, 40), stage, 0, stageY + 0.2, SZ - 6);   // the 50 ft turntable at the centre of the stage
    k.box(34.2, 23.8, 1.0, 0, stageY + 11.9, SZ - 16, curtain);   // the gold curtain, 112 ft wide by 78 ft tall
    for (let x = -17; x <= 17; x += 2) k.box(0.8, 24, 1.2, x, stageY + 12, SZ - 15.8, curtain);
    for (let i = 0; i < 9; i++) k.spot(-16 + i * 4, stageY + 22, SZ + 4, -16 + i * 4, stageY, SZ - 8, 0xfff0d8, 200, 0.4, 0.6, 40);
    for (const s of [-1, 1]) k.box(4, 9, 2, s * 22, stageY + 4.5, SZ - 4, gold);
    // the show: the curated works cycle on a great screen over the stage, and a sunrise wash climbs the arches
    const show = k.mesh(new T.PlaneGeometry(26, 14.6), new T.MeshBasicMaterial({ color: 0x111111 }), 0, stageY + 12, SZ - 14.9);
    void show;
    if (!ctx.reduced) { const glows: T.PointLight[] = []; k.scene.traverse((o) => { if (o instanceof T.PointLight && o.position.z < AZ && o.position.z > SZ - 1) glows.push(o); }); k.ticks.push((t) => glows.forEach((l, i) => { l.intensity = 40 + 30 * Math.sin(t * 0.6 + i * 0.5); })); }
    // eggs
    k.egg(v(0, 22, AZ - 18), { id: 'radiocity-sunset', title: 'A sunset from a ship', text: 'The ceiling is eight telescoping plaster bands, each overlapping the next by two feet at 30 foot intervals, closing on a proscenium meant to look like a setting sun. Roxy Rothafel reportedly came up with the sunset while sailing home from Europe. Grilles in the bands hide air conditioning, speakers and organ pipes.', clue: 'Stand in the aisle and look up the bands toward the stage.', source: { name: 'Radio City Music Hall, Wikipedia', url: 'https://en.wikipedia.org/wiki/Radio_City_Music_Hall' } }, { r: 2.4 });
    k.egg(turntable, { id: 'radiocity-hydraulics', title: 'Guarded in wartime', text: 'Peter Clark designed the stage, 144 by 66.5 feet, with a 50 foot turntable and three 70 foot sections that rise and sink, built by Otis. Radio City lore says the Navy used the same hydraulics on aircraft carriers in the Second World War and government agents guarded the basement.', clue: 'Look at the round turntable in the middle of the stage.', source: { name: 'Radio City Music Hall, Wikipedia', url: 'https://en.wikipedia.org/wiki/Radio_City_Music_Hall' } }, { r: 2.4 });
    k.egg(v(22, stageY + 4.5, SZ - 4), { id: 'radiocity-wurlitzer', title: 'The biggest Wurlitzer', text: 'The Mighty Wurlitzer here is the largest the company ever built, with 58 ranks and 4,178 pipes. It plays from twin four manual consoles on either side of the stage, so two organists can play at once.', clue: 'Look at the gold console at the right hand side of the stage.', source: { name: 'Radio City Music Hall, Wikipedia', url: 'https://en.wikipedia.org/wiki/Radio_City_Music_Hall' } }, { r: 2 });
    k.egg(v(-GW / 2 + 1.6, 1.6, FZ - GD + 1.6), { id: 'radiocity-eve', title: 'The nudes Roxy hid', year: '1932', text: 'Three aluminium nude sculptures were planned, but Roxy Rothafel thought nudes wrong for a family hall, and only Robert Laurent\'s Goose Girl was on show on opening night. Gwen Lux\'s Eve stands in the south west corner of the grand foyer.', clue: 'Find the far left corner of the foyer.', source: { name: 'Radio City Music Hall, Wikipedia', url: 'https://en.wikipedia.org/wiki/Radio_City_Music_Hall' } }, { r: 1.6 });
    k.egg(v(0, -2, AZ - 30), { id: 'radiocity-seats', title: 'The largest auditorium', year: '1932', text: 'The hall opened on 27 December 1932 with 5,960 seats, about 3,500 of them on the orchestra floor, the largest auditorium in the world at the time. There are only four aisles and no crossover aisle.', clue: 'Walk down the centre aisle.', source: { name: 'Radio City Music Hall, Wikipedia', url: 'https://en.wikipedia.org/wiki/Radio_City_Music_Hall' } }, { r: 2 });
    k.egg(v(-22, 20, FZ + 4.4), { id: 'radiocity-signs', title: 'Ninety feet of name', text: 'Three vertical signs, each 90 feet tall, carry the name, and the marquee wraps the corner of Sixth Avenue and 50th Street. Inside, no two of the restrooms and lounges were given the same design.', clue: 'Look up the vertical sign by the marquee.', source: { name: 'Radio City Music Hall, Wikipedia', url: 'https://en.wikipedia.org/wiki/Radio_City_Music_Hall' } }, { r: 2.4 });
    // the works: the foyer, the arch piers on both sides of the fan, the stage screen
    const mounts: Mount[] = [];
    for (let i = 0; i < 4; i++) { const z = FZ - 2 - i * 3.6; for (const s of [-1, 1]) mounts.push({ position: v(s * (GW / 2 - 0.34), 3.8, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 3, z), width: 3.0, height: 1.8, style: 'gilt', wash: true }); }
    for (let i = 0; i < 6; i++) { const w = 56 - i * 3.7, z = AZ - 4 - i * 7 - 3.5; const drop = -Math.max(0, (AZ - 8 - z) / 2.6) * 0.24; for (const s of [-1, 1]) mounts.push({ position: v(s * (w / 2 + 1.06), drop + 4.2, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 1.2, drop + 3, z), width: 4.6, height: 2.7, style: 'gilt', wash: true }); }
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
  signatures: 'The 792 foot terracotta gothic tower with its green copper crown, the cross shaped lobby of two barrel vaulted arms under glass mosaic and a dome at the crossing, veined Skyros marble walls, bronze gothic tracery, the mezzanine murals.',
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
    // eggs
    k.egg(v(0, 236, FZ - 20), { id: 'woolworth-wilson', title: 'Lit from Washington', year: '1913', text: 'The building opened on 24 April 1913. At 7:30 that evening President Woodrow Wilson pressed a button in Washington and the lights came on. At 792 feet it was the tallest building in the world until 40 Wall Street and the Chrysler Building went up in 1929 and 1930.', clue: 'Look up at the green crown from City Hall Park.', source: { name: 'Woolworth Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/Woolworth_Building' } }, { r: 6 });
    k.egg(v(AW / 2 - 0.4, 6.4, LZ - 9), { id: 'woolworth-grotesques', title: 'The builders in the brackets', text: 'Twelve plaster brackets in the lobby carry grotesques of the people behind the building: Cass Gilbert holding a model of it, the engineer Gunvald Aus measuring a girder, and Frank Woolworth holding nickels and dimes.', clue: 'Look up where the arcade walls meet the vault.', source: { name: 'Woolworth Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/Woolworth_Building' } }, { r: 1.6 });
    k.egg(v(-12, 7.2, LZ), { id: 'woolworth-murals', title: 'Labor and Commerce', text: 'C. Paul Jennewein\'s ceiling murals Labor and Commerce sit above the mezzanine where it crosses the north and south wings of the lobby.', clue: 'Look above the mezzanine in the cross arms.', source: { name: 'Woolworth Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/Woolworth_Building' } }, { r: 2 });
    k.egg(v(0, 0.6, LZ + 4), { id: 'woolworth-pool', title: 'A pool under the lobby', text: 'The basement holds an unused bank vault, a restaurant, a barbershop and a private pool 15 by 55 feet, restored in the mid 2010s. A subway entrance to Park Place station closed after the September 11 attacks.', clue: 'Stand at the crossing and look down.', source: { name: 'Woolworth Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/Woolworth_Building' } }, { r: 1.6 });
    k.egg(v(0, 6.8, LZ - LEN / 2 + 0.8), { id: 'woolworth-cadman', title: 'Not his cathedral', year: '1916', text: 'The nickname Cathedral of Commerce comes from the Reverend S. Parkes Cadman, in a 1916 booklet. Cass Gilbert disliked the religious comparison.', clue: 'Read the sign at the far end of the lobby.', source: { name: 'Woolworth Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/Woolworth_Building' } }, { r: 1.6 });
    k.egg(v(0, AH + 3.6, LZ), { id: 'woolworth-dome', title: 'A dome from Ravenna', text: 'The two barrel vaulted arms of the lobby cross under a dome whose pendentives may be modelled on the Mausoleum of Galla Placidia. The walls are veined marble from Skyros in Greece, and the ceilings are glass mosaic in blue, green and gold with red accents.', clue: 'Stand at the crossing and look straight up.', source: { name: 'Woolworth Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/Woolworth_Building' } }, { r: 2 });
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
  signatures: 'The stone canyon of Wall and Broad, the Greek Revival Federal Hall with its eighteen steps and statue plinth, the six fluted columns and pediment of the exchange facing Broad Street with a banner on them, 23 Wall Street on the corner, the flags, the crowds, the cobbles.',
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
    for (let i = 0; i < 18; i++) k.box(26, 0.233, 0.8, HX, 0.117 + i * 0.233, HZ + 4.2 - i * 0.367, granite);   // 18 granite steps up to the portico
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
    // the exchange at 18 Broad Street: its six column front faces EAST onto Broad Street (it faced Wall Street here), raised on a podium, the banner hung on the colonnade
    const EX = -28, EZ = 29, EF = -12;   // body centre x, centre of the Broad Street front along z, the face line
    k.box(26, 30, 34, EX - 1, 15, EZ, lime);
    k.box(30, 2, 38, EX, 31, EZ, lime);
    k.box(4, 4.5, 34, EF - 2, 2.25, EZ, granite);
    for (let i = 0; i < 6; i++) k.column(EF - 2, 4.5, EZ - 12 + i * 4.8, 16, 1.0, lime, true);
    for (const dz of [-16, 16]) k.box(4, 16, 2, EF - 2, 12.5, EZ + dz, lime);
    k.box(4, 2.6, 34, EF - 2, 21.8, EZ, lime);
    const ped2 = new T.Shape(); ped2.moveTo(-17, 0); ped2.lineTo(17, 0); ped2.lineTo(0, 6); ped2.closePath();
    k.mesh(new T.ExtrudeGeometry(ped2, { depth: 5, bevelEnabled: false }), lime, EF - 4.5, 23.1, EZ).rotation.y = PI / 2;
    k.block(EX - 14.5, EF + 0.2, EZ - 17.5, EZ + 17.5);
    k.censusWall({ x: EF + 0.3, y: 12.6, z: EZ, rotY: PI / 2, cols: 22, rows: 10, tile: 0.55, gap: 0.05, start: ctx.wallStart(5000, 220), pieces: ctx.all, backing: navy });
    for (const [s, m] of [[-1, redF], [0, white], [1, navy]] as const) { k.beam(v(EF, 24, EZ + s * 10), v(EF + 3, 30, EZ + s * 10 + 0.5), 0.12, dark, 4); k.box(0.1, 2, 3, EF + 3.2, 29, EZ + s * 10 + 2.1, m); }
    // 23 Wall Street, the House of Morgan, four storeys on the south east corner of Wall and Broad
    const morganHouse = k.box(24, 26, 26, 21, 13, 25, lime);
    k.block(9, 33, 12, 38);
    // eggs
    k.egg(v(9.3, 3.2, 15), { id: 'wallstreet-bombing', title: 'The divots at the corner', year: '1920', text: 'At 12:01 on 16 September 1920 a horse drawn wagon packed with about 100 pounds of dynamite and 500 pounds of iron sash weights blew up across from 23 Wall Street, killing 38 people. It was never solved, and shrapnel divots are still in the stone.', clue: 'Run your eye over the stone of the low corner building across Broad Street.', source: { name: 'Wall Street bombing, Wikipedia', url: 'https://en.wikipedia.org/wiki/Wall_Street_bombing' } }, { r: 1.6 });
    k.egg(v(32, 8, 11.7), { id: 'wallstreet-noname', title: 'No name needed', year: '1914', text: 'The House of Morgan at 23 Wall Street opened in 1914, four storeys and about 85 feet tall on the south east corner of Wall and Broad. No name plaque was ever put over its door; the bank was too well known to need one.', clue: 'Look above the door of the corner building for a name that is not there.', source: { name: '23 Wall Street, Wikipedia', url: 'https://en.wikipedia.org/wiki/23_Wall_Street' } }, { r: 1.6 });
    k.egg(v(EF - 2, 25, EZ), { id: 'wallstreet-pediment', title: 'Integrity, in sheet metal', year: '1936', text: 'The pediment over the six columns of the exchange was designed by John Quincy Adams Ward and Paul Wayland Bartlett, with a female figure of integrity at its centre. The marble figures were replaced in 1936 with lead coated sheet metal carvings.', clue: 'Look up into the pediment over the exchange columns.', source: { name: 'New York Stock Exchange Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/New_York_Stock_Exchange_Building' } }, { r: 2.4 });
    k.egg(v(EF + 0.6, 3, EZ - 14), { id: 'wallstreet-floor', title: 'Behind the columns', year: '1903', text: 'George B. Post\'s exchange at 18 Broad Street was finished in 1903. Behind the colonnade the main trading floor covers 15,000 square feet under a 30 by 30 foot skylight.', clue: 'Walk down Broad Street to the foot of the exchange.', source: { name: 'New York Stock Exchange Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/New_York_Stock_Exchange_Building' } }, { r: 1.6 });
    k.egg(v(HX, 10.6, HZ + 0.5), { id: 'wallstreet-wrongbuilding', title: 'Not the balcony', year: '1789', text: 'Washington took the oath on 30 April 1789 on the balcony of the original Federal Hall, demolished in 1812, not this building. Inside the rotunda a stone slab marks where he once stood, and a piece of the original balcony railing and floor is on display.', clue: 'Climb the steps to the empty plinth.', source: { name: 'Federal Hall, Wikipedia', url: 'https://en.wikipedia.org/wiki/Federal_Hall' } }, { r: 1.6 });
    k.egg(v(HX + 8, 1.4, HZ + 3.4), { id: 'wallstreet-customhouse', title: 'Built for the customs', year: '1842', text: 'The building opened in 1842 as the Custom House for the Port of New York, designed by Town and Davis in Tuckahoe marble from Westchester. Eighteen granite steps lead up to a rotunda 60 feet across, and a 1994 guide called it the Parthenon of public buildings in the city.', clue: 'Count the steps up to the portico.', source: { name: 'Federal Hall, Wikipedia', url: 'https://en.wikipedia.org/wiki/Federal_Hall' } }, { r: 1.6 });
    // the crowd at the bell, the barriers, the bull's plinth by the subway stair, the works
    k.crowd([v(-60, 0, -6), v(-30, 0, -5), v(0, 0, -6), v(30, 0, -5), v(60, 0, -6)], 40, { seed: 50, speed: 1.0, spread: 4, animate: !ctx.reduced });
    k.crowd([v(-6.5, 0, 44), v(-6, 0, 29), v(-6.5, 0, 15), v(-4, 0, 6), v(0, 0, 5), v(0, 0, 40)], 30, { seed: 51, speed: 0.6, spread: 3, animate: !ctx.reduced });
    for (let i = 0; i < 8; i++) { k.box(0.06, 1.0, 2.2, -9.6, 0.55, EZ - 10.5 + i * 3, dark); for (const dz of [-1.05, 1.05]) k.box(0.06, 1.05, 0.06, -9.6, 0.52, EZ - 10.5 + i * 3 + dz, dark); }
    k.prop('mailbox', 30, 0, -8.6, { height: 1.5 });
    k.prop('hydrant', -50, 0, 8.6, { height: 1.1 });
    for (const x of [-70, -40, 40, 70]) for (const s of [-1, 1]) k.lamp(x, s * 8.8, 6, dark, 0xffe6c8, 20);
    const mounts: Mount[] = [];
    for (let i = 0; i < 6; i++) { const x = 14 + i * 12; k.box(4.6, 3.4, 0.3, x, 3.2, -11.6, dark); mounts.push({ position: v(x, 3.4, -11.4), rotation: 0, target: v(x, 3, -2), width: 4.2, height: 2.5, style: 'steel', wash: false }); }
    for (let i = 0; i < 6; i++) { const x = 14 + i * 12; k.box(4.6, 3.4, 0.3, x, 3.2, 11.6, dark); mounts.push({ position: v(x, 3.4, 11.4), rotation: PI, target: v(x, 3, 2), width: 4.2, height: 2.5, style: 'steel', wash: false }); }
    for (let i = 0; i < 4; i++) { const z = 18 + i * 10; for (const s of [-1, 1]) { k.box(0.3, 3.4, 4.6, s * 8.6, 3.2, z, dark); mounts.push({ position: v(s * 8.4, 3.4, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 3, z), width: 4.2, height: 2.5, style: 'steel', wash: false }); } }
    for (let i = 0; i < 3; i++) { const x = HX - 9 + i * 9; mounts.push({ position: v(x, 9.4, HZ - 5.9), rotation: 0, target: v(x, 8, HZ + 6), width: 2.6, height: 3.4, style: 'gilt', wash: true }); }
    k.block(HX - 15, HX + 15, HZ - 6.5, HZ - 5.5);
    return { mounts, spawn: v(20, 3, 2), look: v(EF, 14, EZ), eye: 3, bounds: [-90, 90, -10, 60], style: 'steel', floorY: (x, z) => { if (Math.abs(x - HX) < 13 && z < HZ + 4.8 && z > HZ - 2.4) return Math.min(4.2, Math.max(0, (HZ + 4.8 - z) / 6.6 * 4.2)); if (Math.abs(x - HX) < 15 && z <= HZ - 2.4 && z > HZ - 5.5) return 4.2; return 0; } };
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
    // Revson Fountain: 38 ft (11.6 m) across, its jets in three concentric rings
    const basin = k.mesh(new T.CylinderGeometry(5.8, 6.1, 0.9, 48), travD, 0, 0.45, 0);
    k.mesh(new T.CylinderGeometry(5.3, 5.3, 0.3, 48), waterM, 0, 0.95, 0);
    k.keepOut.push({ x: 0, z: 0, r: 6.4 });
    const jets: T.Mesh[] = [];
    for (let i = 0; i < 24; i++) { const a = (i / 24) * PI * 2, r = 1.4 + (i % 3) * 1.4; const j = k.mesh(new T.CylinderGeometry(0.05, 0.14, 4, 6), waterM, Math.cos(a) * r, 3, Math.sin(a) * r, true); jets.push(j); }
    const core = k.mesh(new T.CylinderGeometry(0.2, 0.5, 9, 8), waterM, 0, 5.4, 0, true); jets.push(core);
    if (!ctx.reduced) k.ticks.push((t) => jets.forEach((j, i) => { const s = 0.6 + 0.4 * Math.sin(t * 1.4 + i * 0.6); j.scale.y = s; j.position.y = (i === jets.length - 1 ? 4.5 : 2) * s + 1; }));
    for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; k.point(Math.cos(a) * 5, 1.6, Math.sin(a) * 5, 0xffe8c8, 6, 6); }
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
    // eggs
    k.egg(basin, { id: 'lincolncenter-fountain', title: 'Three rings of jets', year: '2009', text: 'Philip Johnson\'s fountain was dedicated in 1964, 38 feet across. WET rebuilt it for 2009 with 353 jets in three concentric rings, 272 lights and 24 pumps that can throw water 60 feet up. It plays a part in The Producers and Moonstruck.', clue: 'Walk to the rim of the fountain in the middle of the plaza.', source: { name: 'Revson Fountain, Wikipedia', url: 'https://en.wikipedia.org/wiki/Revson_Fountain' } }, { r: 2.4 });
    k.egg(v(-7.6, 2.2, OZ - 27.5), { id: 'lincolncenter-chagall', title: 'Murals as collateral', text: 'Marc Chagall\'s two lobby murals are each about 30 by 36 feet: The Triumph of Music on the south wall and The Sources of Music on the north. In 2009 the Met\'s board decided to put them up as collateral for a long term loan.', clue: 'Look at the great walls either side of the lobby.', source: { name: 'Metropolitan Opera House (Lincoln Center), Wikipedia', url: 'https://en.wikipedia.org/wiki/Metropolitan_Opera_House_(Lincoln_Center)' } }, { r: 2 });
    k.egg(v(14, OH - 6, OZ - 10), { id: 'lincolncenter-chandeliers', title: 'A thank you from Vienna', text: 'The crystal chandeliers, eleven in the lobby and 21 in the auditorium, were designed by Hans Harald Rath of Lobmeyr in Vienna and given by Austria in thanks for American help under the Marshall Plan. Twelve of the auditorium ones are winched up to the ceiling before each performance.', clue: 'Watch the starburst chandeliers behind the glass.', source: { name: 'Metropolitan Opera House (Lincoln Center), Wikipedia', url: 'https://en.wikipedia.org/wiki/Metropolitan_Opera_House_(Lincoln_Center)' } }, { r: 2.4 });
    k.egg(v(0, 12, OZ + 0.8), { id: 'lincolncenter-arches', title: 'Five arches, ninety six feet', year: '1966', text: 'Wallace Harrison\'s opera house opened on 16 September 1966. Its east front of white travertine is five concrete arches rising 96 feet above the plaza. Inside, over 4,000 square feet of gold leaf covers the petal shaped ceiling above roughly 3,800 seats.', clue: 'Stand in front of the middle arch and look up.', source: { name: 'Metropolitan Opera House (Lincoln Center), Wikipedia', url: 'https://en.wikipedia.org/wiki/Metropolitan_Opera_House_(Lincoln_Center)' } }, { r: 2.4 });
    k.egg(v(-31.6, 6, -6), { id: 'lincolncenter-statetheater', title: 'Built for the World\'s Fair', year: '1964', text: 'The theatre on the south side of the plaza opened on 23 April 1964 as the New York State Theater, paid for by the state as part of its showing at the 1964 to 1965 World\'s Fair. Philip Johnson and John Burgee designed it. It took David H. Koch\'s name in 2008 after a $100 million pledge.', clue: 'Look at the colonnade on the left as you face the opera house.', source: { name: 'David H. Koch Theater, Wikipedia', url: 'https://en.wikipedia.org/wiki/David_H._Koch_Theater' } }, { r: 2 });
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) mounts.push({ position: v(s * 8.05, 9, OZ - 16), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 8, OZ - 16), width: 20, height: 11, style: 'none', wash: true });
    for (let i = 0; i < 5; i++) { const x = -24 + i * 12; mounts.push({ position: v(x, 4.4, OZ - 29.6), rotation: 0, target: v(x, 3, OZ - 14), width: 5, height: 3, style: 'gilt', wash: true }); }
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const z = -34 + i * 8; mounts.push({ position: v(s * 31.4, 3.6, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 20, 3, z), width: 3.2, height: 3.8, style: 'white', wash: true }); }
    for (let i = 0; i < 4; i++) { const a = PI * 0.25 + (i / 3) * PI * 0.5; const x = Math.cos(a) * 16, z = Math.sin(a) * 16; k.box(0.3, 3, 4, x, 1.8, z, travD).rotation.y = -a + PI / 2; mounts.push({ position: v(x + Math.cos(a) * 0.2, 2.0, z + Math.sin(a) * 0.2), rotation: -a + PI / 2, target: v(Math.cos(a) * 26, 2.5, Math.sin(a) * 26), width: 3.6, height: 2.1, style: 'white', wash: false }); }
    return { mounts, spawn: v(0, 3, 44), look: v(0, 14, OZ), eye: 3, bounds: [-31, 31, OZ - 28, 52], style: 'white', floorY: (x, z) => { void x; if (z < OZ - 8) return Math.min(4.2, Math.max(0, (OZ - 8 - z) / 19.6 * 4.2)); return 0; } };
  },
};
