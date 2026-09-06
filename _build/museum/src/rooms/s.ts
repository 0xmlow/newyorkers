/* Rooms 87 to 91: the MoMA atrium, the New Museum, the Neue Galerie, Cooper Hewitt's garden, the Breuer. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront } from './f';
import { mlowBanner, blossomFlag, donorWall, eyeMedallion, wordmarkRelief, eyeMonument, blossomGarden, INK, CLOUD, ELECTRIC, CYAN } from './brand';

const PI = Math.PI;

/* ---------------- 87 THE ATRIUM ---------------- */
export const momaatrium: RoomDef = {
  id: 'momaatrium',
  name: 'The atrium',
  area: 'MOMA',
  mood: 'Free Friday, six o\'clock',
  color: '#e8e8e4',
  description: 'Fifty third Street under the black glass, the lobby, then the atrium: a white shaft of light six storeys tall, bridges crossing it, the escalators, a mobile turning above, the works on the great walls.',
  signatures: 'The sheer white atrium with its cut through balconies at every level, the glass bridges, the grand stair, the mobile hung in the void, the escalators seen through glass, the garden through the wall of windows.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad0, horizon: 0xe8e8e0, ground: 0x5a5a55, fog: 0.0022, sun: { az: 3.4, el: 0.75, color: 0xfff4e6, size: 12 }, env: 0.9 });
    k.hemi(0xffffff, 0x5a5a58, 0.8);
    k.sun(0xffffff, 1.6, 20, 80, 30, true, 80);
    const white = k.pbr('maWhite', X.plaster(0xf4f4f2, 131), 0.4, { roughness: 0.85 }),
      floorT = k.pbr('maFloor', X.terrazzo(0xd8d8d4, 132), 0.4, { roughness: 0.3 }),
      glass = k.glass(0xdcecf6, 0.14, 0.04), glassDark = k.glass(0x1a2228, 0.5, 0.1), steel = k.flat(0x8c98a4, 0.9, 0.3),
      dark = k.flat(0x1a1c20, 0.5, 0.6), black = k.flat(0x0e0e10, 0.2, 0.4);
    // 53rd Street and the black glass front, the lobby
    street(k, { w: 20, len: 140, z: 40, x: 0 });
    blockFront(k, { x: -46, z0: 100, count: 10, face: 1, seed: 261, h: [18, 40] });
    const FZ = 12;
    k.box(70, 24, 30, 0, 12, FZ - 15, glassDark);
    for (let x = -34; x <= 34; x += 4) k.box(0.3, 24, 0.3, x, 12, FZ + 0.1, black);
    k.box(70, 0.6, 30, 0, 24, FZ - 15, black);
    k.box(10, 4, 0.2, 0, 2, FZ, glass); k.block(-35, -3, FZ - 0.4, FZ + 0.4); k.block(3, 35, FZ - 0.4, FZ + 0.4);
    k.box(40, 6, 2, 0, 27, FZ - 1, black); k.sign('MOMA', 6, 3, 0, 27, FZ + 0.05, '#0e0e10', '#f4f4f2', 200, 0);
    mlowBanner(k, -18, 12, FZ + 0.6, 0, 3.6, false); blossomFlag(k, 18, 12, FZ + 0.6, 0, 3.0, 1, 'cloud');
    k.box(40, 0.3, 14, 0, 0.15, FZ - 7, floorT);
    for (let i = 0; i < 4; i++) k.prop('rope_stanchion', -6 + i * 4, 0.15, FZ - 4, { height: 1.0 });
    // the atrium: a white shaft with cut through balconies at four levels, glass bridges, the stair, the mobile
    const AX = 0, AZ = FZ - 14 - 22, AW = 40, AD = 44, AH = 34;
    k.box(AW, 0.3, AD, AX, 0.15, AZ, floorT);
    for (const s of [-1, 1]) { k.box(0.8, AH, AD, AX + s * AW / 2, AH / 2, AZ, white); k.block(AX + s * AW / 2 - 0.6, AX + s * AW / 2 + 0.6, AZ - AD / 2, AZ + AD / 2); }
    k.box(AW, AH, 0.8, AX, AH / 2, AZ - AD / 2, white); k.block(AX - AW / 2, AX + AW / 2, AZ - AD / 2 - 0.6, AZ - AD / 2 + 0.6);
    k.box(AW, AH, 0.8, AX, AH / 2, AZ + AD / 2, white); k.block(AX - AW / 2, -3, AZ + AD / 2 - 0.6, AZ + AD / 2 + 0.6); k.block(3, AX + AW / 2, AZ + AD / 2 - 0.6, AZ + AD / 2 + 0.6);
    k.box(AW + 2, 0.4, AD + 2, AX, AH, AZ, glass); for (let x = -AW / 2; x <= AW / 2; x += 4) k.box(0.3, 0.4, AD + 2, AX + x, AH + 0.1, AZ, steel);
    for (let lvl = 1; lvl <= 4; lvl++) { const y = lvl * 7.6; for (const s of [-1, 1]) { const w = lvl % 2 ? 9 : 6; k.box(w, 0.5, AD - 2, AX + s * (AW / 2 - w / 2 - 0.4), y, AZ, white); k.box(0.1, 1.1, AD - 2, AX + s * (AW / 2 - w - 0.4), y + 0.8, AZ, glass); k.box(0.06, 0.06, AD - 2, AX + s * (AW / 2 - w - 0.4), y + 1.35, AZ, steel); } if (lvl === 2 || lvl === 4) { k.box(AW - 12, 0.4, 3, AX, y, AZ - AD / 2 + 8 + (lvl === 4 ? 20 : 0), glass); for (const s of [-1, 1]) k.box(AW - 12, 0.06, 0.06, AX, y + 1.2, AZ - AD / 2 + 8 + (lvl === 4 ? 20 : 0) + s * 1.5, steel); } for (let z = -18; z <= 18; z += 9) k.point(AX, y + 5, AZ + z, 0xffffff, 26, 18); }
    for (let i = 0; i < 24; i++) k.box(4, 0.32, 0.9, AX + AW / 2 - 6.4, 0.16 + i * 0.32, AZ + AD / 2 - 3 - i * 0.9, white);
    for (let i = 0; i < 24; i++) k.box(4, 0.32, 0.9, AX - AW / 2 + 6.4, 7.6 + 0.16 + i * 0.32, AZ - AD / 2 + 3 + i * 0.9, white);
    k.block(AX + AW / 2 - 8.6, AX + AW / 2 - 4.2, AZ + AD / 2 - 25, AZ + AD / 2 - 2.6);
    k.prop('mobile', AX, 20, AZ, { height: 8 }).then((o) => { if (o && !ctx.reduced) k.ticks.push((t) => { o.rotation.y = t * 0.08; o.children.forEach((c, i) => { c.rotation.y = Math.sin(t * 0.3 + i) * 0.4; }); }); });
    for (let i = 0; i < 6; i++) k.point(AX + (i % 2 ? 10 : -10), 26, AZ - 15 + i * 6, 0xffffff, 40, 26);
    eyeMedallion(k, AX, 0.16, AZ + AD / 2 - 6, 2.4);
    donorWall(k, AX, 4.6, AZ - AD / 2 + 0.42, 0, 12, true);
    for (const x of [-10, 10]) k.prop('museum_bench', AX + x, 0.15, AZ, { height: 0.58, keepOut: 1.4 });
    k.prop('bronze_figure', AX - 8, 0.15, AZ - 12, { height: 3.2, keepOut: 1.4 }); k.prop('noguchi_stone_2', AX + 8, 0.15, AZ + 10, { height: 2.6, keepOut: 1.6 });
    k.crowd([v(-6, 0.15, FZ - 4), v(0, 0.15, AZ + 12), v(-10, 0.15, AZ - 4), v(8, 0.15, AZ - 16), v(12, 0.15, AZ + 6)], 28, { seed: 116, speed: 0.4, spread: 2.6, animate: !ctx.reduced, closed: true, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a, 0x33477f, 0xd8d0c0] });
    k.crowd([v(AX - 12, 7.6, AZ - 18), v(AX - 12, 7.6, AZ + 18)], 8, { seed: 117, speed: 0.3, spread: 1.6, animate: !ctx.reduced });
    k.censusWall({ x: AX + AW / 2 - 0.82, y: 16, z: AZ, rotY: -PI / 2, cols: 40, rows: 10, tile: 0.55, gap: 0.05, start: ctx.wallStart(5500, 400), pieces: ctx.all, backing: dark });
    // the works: the great white end wall (one very large), the ground floor walls, the balcony backs at level one and two
    const mounts: Mount[] = [];
    mounts.push({ position: v(AX, 14, AZ - AD / 2 + 0.42), rotation: 0, target: v(AX, 6, AZ + 10), width: 16, height: 9, style: 'none', wash: true });
    for (let i = 0; i < 4; i++) { const z = AZ - 15 + i * 10; mounts.push({ position: v(AX - AW / 2 + 0.42, 3.4, z), rotation: PI / 2, target: v(AX, 3, z), width: 4.8, height: 2.8, style: 'white', wash: true }); }
    for (let i = 0; i < 2; i++) { const z = AZ - 8 + i * 16; mounts.push({ position: v(AX + AW / 2 - 0.42, 3.4, z), rotation: -PI / 2, target: v(AX, 3, z), width: 4.8, height: 2.8, style: 'white', wash: true }); }
    for (const lvl of [1, 2]) { const y = lvl * 7.6; for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = AZ - 12 + i * 12; mounts.push({ position: v(AX + s * (AW / 2 - 0.42), y + 3.2, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(AX + s * (AW / 2 - 6), y + 2.5, z), width: 3.6, height: 2.1, style: 'white', wash: true }); } }
    for (const x of [-12, 12]) mounts.push({ position: v(AX + x, 3.4, AZ + AD / 2 - 0.42), rotation: PI, target: v(AX + x, 3, AZ + 4), width: 4.4, height: 2.6, style: 'white', wash: true });
    return { mounts, spawn: v(-8, 3, 46), look: v(0, 14, FZ), eye: 3, bounds: [-AW / 2 + 1.2, AW / 2 - 1.2, AZ - AD / 2 + 1, 50], style: 'white', floorY: (x, z) => { if (x > AX + AW / 2 - 8.6 && x < AX + AW / 2 - 4.2 && z < AZ + AD / 2 - 2.6 && z > AZ + AD / 2 - 25) return Math.min(7.6, ((AZ + AD / 2 - 2.6 - z) / 21.6) * 7.6); if (x > AX + AW / 2 - 9.4 && z <= AZ + AD / 2 - 25 && z > AZ - AD / 2 + 1 && x < AX + AW / 2 - 0.4) return 7.6; return 0; } };
  },
};

/* ---------------- 88 THE NEW MUSEUM ---------------- */
export const newmuseum: RoomDef = {
  id: 'newmuseum',
  name: 'The stacked boxes',
  area: 'THE NEW MUSEUM',
  mood: 'Bowery, late afternoon',
  color: '#c8ccd0',
  description: 'The Bowery with its restaurant supply stores, then the seven shifted boxes in silver mesh, the tall gallery with the light slot, the sky room at the top, the works on raw white walls.',
  signatures: 'The stack of aluminium mesh clad boxes each shifted off the one below, the slot windows where the shifts open, the double height gallery with a skylight strip, the green elevator, the sky room with its wraparound terrace.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad0, horizon: 0xe8e8e0, ground: 0x5a5a55, fog: 0.0022, sun: { az: 4.2, el: 0.5, color: 0xfff4e6, size: 12 }, env: 0.9 });
    k.hemi(0xffffff, 0x5a5a58, 0.85);
    k.sun(0xfff4e6, 2.0, -40, 60, 40, true, 80);
    const mesh = k.pbr('nmMesh', X.steel(0xc8ccd0, false, 262), 0.25, { metalness: 0.6, roughness: 0.55 }),
      white = k.pbr('nmWhite', X.plaster(0xf6f6f4, 133), 0.4, { roughness: 0.9 }),
      floorC = k.pbr('nmFloor', X.concrete(0xb8b8b4, 134), 0.3, { roughness: 0.7 }),
      glass = k.glass(0xdcecf6, 0.14, 0.04), green = k.flat(0x3aa06a, 0.2, 0.5), dark = k.flat(0x1a1c20, 0.5, 0.6), steel = k.flat(0x8c98a4, 0.9, 0.3);
    // the Bowery: low buildings with roll gates, the stack rising above them
    street(k, { w: 22, len: 160, z: 30, x: 0 });
    blockFront(k, { x: -30, z0: 100, count: 14, face: 1, seed: 263, h: [10, 16] });
    blockFront(k, { x: 30, z0: 100, count: 6, face: -1, seed: 264, h: [10, 14] });
    const BX = 22, BZ = -16;
    const boxes: [number, number, number, number][] = [[22, 8, 0, 0], [20, 6, 1.6, -1], [22, 7, -1.4, 1.2], [18, 6, 2.6, -1.6], [20, 7, -1.2, 1.4], [16, 6, 2.2, -0.6], [14, 5, 0.4, 1.8]];
    let y = 0;
    boxes.forEach(([w, h, dx, dz], i) => { k.box(w, h, w, BX + dx, y + h / 2, BZ + dz, i === 0 ? white : mesh); if (i > 0) k.box(w - 4, 0.4, 3, BX + dx - w / 2 + (i % 2 ? w - 2 : 2), y + 0.2, BZ + dz + w / 2 - 1.5 + 0.2, glass); y += h; });
    k.box(3, 6, 3, BX + 8, y + 3, BZ - 6, green);
    k.box(4.4, 5.2, 0.2, BX - 4, 2.6, BZ + 11.02, glass); k.block(BX - 11, BX - 6.3, BZ + 10.6, BZ + 11.4); k.block(BX - 1.7, BX + 11, BZ + 10.6, BZ + 11.4);
    k.sign('NEW MUSEUM', 8, 1.6, BX + 2, 6.5, BZ + 11.04, 'transparent', '#0d0d0d', 120, 0);
    mlowBanner(k, BX - 8, 12, BZ + 11.3, 0, 3.0, true);
    blossomFlag(k, BX - 12.4, 4, BZ + 4, PI / 2, 2.4, 7, 'cloud');
    // inside: the lobby, the tall gallery with its skylight slot, the freight stair to the second gallery, the sky room
    const GW = 20, GD = 20;
    k.box(GW, 0.3, GD, BX, 0.15, BZ, floorC);
    for (const s of [-1, 1]) { k.box(0.4, 14, GD, BX + s * GW / 2, 7, BZ, white); k.block(BX + s * GW / 2 - 0.4, BX + s * GW / 2 + 0.4, BZ - GD / 2, BZ + GD / 2); }
    k.box(GW, 14, 0.4, BX, 7, BZ - GD / 2, white); k.block(BX - GW / 2, BX + GW / 2, BZ - GD / 2 - 0.4, BZ - GD / 2 + 0.4);
    k.box(GW, 14, 0.4, BX, 7, BZ + GD / 2, white); k.block(BX - GW / 2, BX - 1.8, BZ + GD / 2 - 0.4, BZ + GD / 2 + 0.4); k.block(BX + 1.8, BX + GW / 2, BZ + GD / 2 - 0.4, BZ + GD / 2 + 0.4);
    k.box(GW, 0.4, GD, BX, 14, BZ, dark);
    k.mesh(new T.PlaneGeometry(3, GD - 2), k.glow(0xffffff, 0.9), BX + 6, 13.8, BZ).rotation.x = PI / 2;
    for (let z = -8; z <= 8; z += 8) k.point(BX + 6, 11, BZ + z, 0xffffff, 26, 16);
    for (let i = 0; i < 20; i++) k.box(2.4, 0.35, 0.9, BX - GW / 2 + 1.3, 0.17 + i * 0.35, BZ + GD / 2 - 1 - i * 0.9, floorC);
    k.box(GW, 0.4, 6, BX, 7.2, BZ - GD / 2 + 3, floorC); k.box(6, 0.4, GD, BX - GW / 2 + 3, 7.2, BZ, floorC);
    k.box(0.1, 1.1, GD - 6, BX - GW / 2 + 6, 7.9, BZ + 3, glass); k.box(GW - 6, 1.1, 0.1, BX + 3, 7.9, BZ - GD / 2 + 6, glass);
    k.block(BX - GW / 2 + 0.4, BX - GW / 2 + 2.6, BZ - GD / 2 + 0.4, BZ + GD / 2 - 0.4);
    donorWall(k, BX, 4.2, BZ - GD / 2 + 0.22, 0, 9, true);
    eyeMonument(k, BX + 4, 0.15, BZ + 2, PI, 3.6);
    k.prop('vitrine', BX - 3, 0.15, BZ - 4, { height: 1.7, keepOut: 1.2 });
    k.prop('track_light', BX, 13.6, BZ - 5, { height: 0.5 }); k.prop('track_light', BX, 13.6, BZ + 5, { height: 0.5 });
    k.crowd([v(0, 0, 60), v(4, 0, 10), v(BX - 4, 0.15, BZ + 8), v(BX + 4, 0.15, BZ - 6)], 22, { seed: 118, speed: 0.4, spread: 2.2, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a] });
    k.censusWall({ x: BX + GW / 2 - 0.22, y: 10.4, z: BZ, rotY: -PI / 2, cols: 30, rows: 6, tile: 0.55, gap: 0.05, start: ctx.wallStart(6300, 180), pieces: ctx.all, backing: dark });
    // the works: the tall gallery walls, the mezzanine, the lobby
    const mounts: Mount[] = [];
    for (let i = 0; i < 3; i++) { const z = BZ - 6 + i * 6; mounts.push({ position: v(BX - GW / 2 + 0.22, 3.4, z), rotation: PI / 2, target: v(BX, 3, z), width: 4.4, height: 2.6, style: 'white', wash: true }); }
    for (let i = 0; i < 3; i++) { const z = BZ - 6 + i * 6; mounts.push({ position: v(BX + GW / 2 - 0.22, 3.4, z), rotation: -PI / 2, target: v(BX, 3, z), width: 4.4, height: 2.6, style: 'white', wash: true }); }
    for (const x of [-6, 6]) mounts.push({ position: v(BX + x, 3.4, BZ - GD / 2 + 0.22), rotation: 0, target: v(BX + x, 3, BZ), width: 4.6, height: 2.7, style: 'white', wash: true });
    for (let i = 0; i < 3; i++) { const z = BZ - 4 + i * 5; mounts.push({ position: v(BX + GW / 2 - 0.22, 10.4 - 0, z), rotation: -PI / 2, target: v(BX, 9.5, z), width: 3.6, height: 2.1, style: 'white', wash: false }); }
    for (const x of [-6, 0, 6]) mounts.push({ position: v(BX + x, 10.6, BZ - GD / 2 + 0.22), rotation: 0, target: v(BX + x, 9.5, BZ - 4), width: 3.6, height: 2.1, style: 'white', wash: true });
    for (let i = 0; i < 3; i++) { const z = -6 + i * 10; k.box(0.2, 3, 4.2, 8.8, 2.6, z, dark); mounts.push({ position: v(8.65, 2.6, z), rotation: -PI / 2 + PI, target: v(0, 2.5, z), width: 3.6, height: 2.1, style: 'black', wash: false }); }
    return { mounts, spawn: v(-4, 3, 24), look: v(BX, 22, BZ), eye: 3, bounds: [-10, BX + GW / 2 - 1, BZ - GD / 2 + 1, 60], style: 'white', floorY: (x, z) => { if (x > BX - GW / 2 + 0.4 && x < BX - GW / 2 + 2.6 && z < BZ + GD / 2 - 0.6 && z > BZ + GD / 2 - 19) return Math.min(7, ((BZ + GD / 2 - 0.6 - z) / 18) * 7); if (x >= BX - GW / 2 + 0.4 && x < BX - GW / 2 + 6 && z > BZ - GD / 2 && z <= BZ + GD / 2 - 19) return 7.4; if (z > BZ - GD / 2 && z < BZ - GD / 2 + 6 && x > BX - GW / 2 && x < BX + GW / 2) return 7.4; return 0; } };
  },
};

/* ---------------- 89 THE NEUE GALERIE ---------------- */
export const neuegalerie: RoomDef = {
  id: 'neuegalerie',
  name: 'The gold room',
  area: 'NEUE GALERIE',
  mood: 'Café hour',
  color: '#d8b060',
  description: 'The mansion at 86th and Fifth, the marble stair with its bronze rail, the second floor salon where the gold portrait hangs, the café below with its marble tables and newspapers.',
  signatures: 'The Beaux Arts limestone mansion with iron and glass canopy, the spiral marble staircase, the wood panelled galleries with the Vienna 1900 furniture, the café with bentwood chairs and a display of cakes.',
  build(k, ctx) {
    k.sky({ top: 0x7fa0d0, horizon: 0xe8e8e0, ground: 0x5a5a55, fog: 0.0022, sun: { az: 3.7, el: 0.65, color: 0xfff4e6, size: 12 }, env: 0.85 });
    k.hemi(0xfff0dc, 0x3a3020, 0.6);
    k.sun(0xfff0d8, 1.6, 30, 60, 40, true, 60);
    const lime = k.pbr('ngLime', X.ashlar(0xd8d0bc, 265, 4), 0.25), wood = k.pbr('ngPanel', X.planks(0x5a3a26, 4, 266, 0.15), 1.4, { roughness: 0.45 }),
      marble = k.pbr('ngMarble', X.marble(0xe0dcd2, 0x9a948a, 18), 0.5, { roughness: 0.3 }), floorW = k.pbr('ngParquet', X.planks(0x9a7a56, 10, 267, 0.1), 0.7, { roughness: 0.5 }),
      gold = k.pbr('ngGold', X.gilt(0xd8b060), 2, { metalness: 0.85, roughness: 0.3 }), bronze = k.flat(0x4a3a28, 0.8, 0.4), dark = k.flat(0x1a1c20, 0.5, 0.6),
      glass = k.glass(0xdcecf6, 0.14, 0.04), cream = k.pbr('ngCream', X.plaster(0xe8e0d0, 135), 0.4), velvet = k.pbr('ngVelvet', X.velvet(0x4a2a3a), 0.4);
    // Fifth Avenue corner, the mansion with its canopy
    street(k, { w: 24, len: 160, z: 40, x: 0 });
    k.box(160, 0.4, 200, 100, -0.2, 0, k.pbr('ngLawn', X.grass(0x3a5a2a, 136), 0.06));
    k.rail(18, 0, 160, k.flat(0x1a1c20, 0.7, 0.45), 1.0, 'z', 2.4); k.block(17.6, 18.4, -80, 80);
    const rnd = X.mulberry(89); for (let i = 0; i < 30; i++) k.tree(24 + rnd() * 60, 0, -80 + rnd() * 160, { kind: 'bare', h: 8 + rnd() * 6, r: 3 + rnd() * 2, seed: i });
    const MX = -26, MZ = 0, MW = 26, MD = 30;
    k.box(MW, 22, MD, MX, 11, MZ, lime);
    k.moulding([[0, 0], [0.9, 0], [1.0, 0.3], [0.6, 0.5], [0.8, 0.8], [0, 1.0]], MD + 0.4, MX + MW / 2 + 0.05, 21.5, MZ, lime, PI / 2);
    for (let f = 0; f < 4; f++) for (let i = 0; i < 5; i++) { const y = 4 + f * 4.6, z = MZ - 10 + i * 5; k.box(0.16, 3.0, 1.8, MX + MW / 2 + 0.02, y, z, cream); k.box(0.06, 2.6, 1.5, MX + MW / 2 + 0.1, y, z, glass); if (f === 1) { k.box(0.6, 0.06, 2.2, MX + MW / 2 + 0.4, y - 1.5, z, bronze); for (let b = -1; b <= 1; b += 0.25) k.box(0.03, 0.7, 0.03, MX + MW / 2 + 0.7, y - 1.15, z + b, bronze); } }
    k.box(3.6, 0.1, 5, MX + MW / 2 + 1.8, 4.2, MZ, glass); for (const dz of [-2.4, 2.4]) k.beam(v(MX + MW / 2 + 0.2, 6, MZ + dz), v(MX + MW / 2 + 3.6, 4.3, MZ + dz), 0.04, bronze, 4);
    k.arch(2.4, 4, 1.4, MX + MW / 2, 0, MZ, lime, false, 0.85).rotation.y = PI / 2;
    k.block(MX + MW / 2 - 0.6, MX + MW / 2 + 0.6, MZ - MD / 2, MZ - 1.4); k.block(MX + MW / 2 - 0.6, MX + MW / 2 + 0.6, MZ + 1.4, MZ + MD / 2);
    k.sign('NEUE GALERIE  ·  NEW YORK', 6, 0.6, MX + MW / 2 + 0.06, 7.2, MZ, 'transparent', '#3a3020', 70, PI / 2);
    mlowBanner(k, MX + MW / 2 + 0.5, 14, MZ - 9, PI / 2, 3.0, true); blossomFlag(k, MX + MW / 2 + 0.5, 14, MZ + 9, PI / 2, 2.6, 3, 'cloud');
    // the ground floor: the entrance hall with the marble stair spiralling up, the café to the left
    const IW = MW - 1.2, ID = MD - 1.2;
    k.box(IW, 0.3, ID, MX, 0.15, MZ, marble);
    k.block(MX - IW / 2 - 0.6, MX - IW / 2 + 0.2, MZ - ID / 2, MZ + ID / 2); k.block(MX - IW / 2, MX + IW / 2, MZ - ID / 2 - 0.6, MZ - ID / 2 + 0.2); k.block(MX - IW / 2, MX + IW / 2, MZ + ID / 2 - 0.2, MZ + ID / 2 + 0.6);
    k.box(IW, 0.4, ID, MX, 5.4, MZ, cream); k.box(IW, 0.4, ID, MX, 10.4, MZ, cream); k.box(IW, 0.4, ID, MX, 15.4, MZ, dark);
    const SX = MX - 5, SZ = MZ + 8;
    const helix: T.Vector3[] = []; for (let i = 0; i <= 60; i++) { const t = i / 60; const a = PI * 0.2 + t * PI * 1.5; helix.push(v(SX + Math.cos(a) * 3.2, 0.2 + t * 5.2, SZ + Math.sin(a) * 3.2)); }
    const hs = k.spline(helix, false, 0.5); const hp = hs.getSpacedPoints(90);
    const treadG = new T.BoxGeometry(2.4, 0.16, 0.34), tm: T.Matrix4[] = []; const tan = new T.Vector3(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0);
    for (let i = 0; i < 90; i++) { const p = hp[i]; hs.getTangentAt(i / 90, tan); q.setFromAxisAngle(up, Math.atan2(tan.x, tan.z)); tm.push(new T.Matrix4().compose(p.clone().add(v(0, -0.2, 0)), q, new T.Vector3(1, 1, 1))); }
    k.instances(treadG, marble, tm);
    k.curve(hp.filter((_, i) => i % 2 === 0).map((p) => v(SX + (p.x - SX) * 1.36, p.y + 0.9, SZ + (p.z - SZ) * 1.36)), 0.04, bronze, 45);
    k.mesh(new T.CylinderGeometry(4.6, 4.6, 0.4, 32), cream, SX, 5.4, SZ);
    k.mesh(new T.CylinderGeometry(4.4, 4.4, 5.6, 32, 1, true), k.flat(0x000000, 0, 1, { transparent: true, opacity: 0 }), SX, 8.2, SZ);
    k.block(SX - 4.6, SX + 4.6, SZ - 4.6, SZ - 3.6);
    k.point(SX, 5, SZ, 0xffe6c0, 20, 12);
    const CX = MX - 5, CZ = MZ - 7;
    for (let i = 0; i < 6; i++) { const x = CX - 6 + (i % 3) * 5, z = CZ - 3 + Math.floor(i / 3) * 5; k.cyl(0.05, 0.72, x, 0.36, z, bronze, 0.05, 8); k.cyl(0.42, 0.04, x, 0.75, z, marble, 0.42, 16); k.keepOut.push({ x, z, r: 0.7 }); for (let c = 0; c < 3; c++) { const a = (c / 3) * PI * 2; k.box(0.4, 0.45, 0.4, x + Math.cos(a) * 0.7, 0.23, z + Math.sin(a) * 0.7, wood); k.torus(0.2, 0.02, x + Math.cos(a) * 0.85, 0.75, z + Math.sin(a) * 0.85, wood, 12); } }
    k.box(4, 1.1, 1.0, CX + 4, 0.55, CZ - 7, wood); k.box(4.2, 0.1, 1.2, CX + 4, 1.12, CZ - 7, marble); k.box(3.6, 0.6, 0.8, CX + 4, 1.5, CZ - 7, glass); k.block(CX + 1.8, CX + 6.2, CZ - 7.7, CZ - 6.3);
    for (let i = 0; i < 6; i++) k.cyl(0.14, 0.12, CX + 2.6 + i * 0.5, 1.24, CZ - 7, [k.flat(0x8a4a2a, 0, 0.6), k.flat(0xe8d0a0, 0, 0.6), k.flat(0xd83a6a, 0, 0.6)][i % 3], 0.14, 12);
    eyeMedallion(k, MX + 3, 0.16, MZ, 1.6);
    donorWall(k, MX, 3.6, MZ - ID / 2 + 0.22, 0, 8, true);
    for (let i = 0; i < 3; i++) k.point(MX - 6 + i * 6, 4.6, MZ - 4, 0xffe6c0, 12, 10);
    // the salon upstairs: wood panelled walls, the gold room at the end where one work hangs alone in gilt
    const UY = 5.6;
    k.box(IW, 0.3, ID, MX, UY, MZ, floorW);
    for (const s of [-1, 1]) k.box(0.3, 4.4, ID, MX + s * (IW / 2 - 0.2), UY + 2.2, MZ, wood);
    k.box(IW, 4.4, 0.3, MX, UY + 2.2, MZ - ID / 2 + 0.2, gold);
    k.box(IW, 0.3, 0.3, MX, UY + 4.4, MZ, cream);
    for (const [x, z] of [[MX - 6, MZ + 2], [MX + 5, MZ - 4]]) { k.box(2.2, 0.5, 0.9, x, UY + 0.4, z, velvet); k.box(2.2, 0.7, 0.3, x, UY + 0.85, z - 0.3, velvet); k.keepOut.push({ x, z, r: 1.4 }); }
    for (let i = 0; i < 4; i++) k.point(MX - 6 + i * 4, UY + 4, MZ - 6 + (i % 2) * 8, 0xffe6c0, 12, 10);
    k.point(MX, UY + 3, MZ - ID / 2 + 3, 0xffd890, 30, 12);
    k.crowd([v(MX + 10, 0.15, MZ + 4), v(MX - 2, 0.15, MZ - 2), v(MX - 8, 0.15, MZ - 8)], 8, { seed: 119, speed: 0.25, spread: 1.4, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0x8a3a3a] });
    k.crowd([v(MX - 8, UY + 0.15, MZ + 8), v(MX + 6, UY + 0.15, MZ - 8)], 6, { seed: 120, speed: 0.2, spread: 1.4, animate: !ctx.reduced });
    k.censusWall({ x: MX - IW / 2 + 0.36, y: 2.6, z: MZ + 2, rotY: PI / 2, cols: 20, rows: 4, tile: 0.5, gap: 0.05, start: ctx.wallStart(1900, 80), pieces: ctx.all, backing: dark });
    // the works: the gold room's single work, the panelled salon walls in gilt, the entrance hall, the café
    const mounts: Mount[] = [];
    mounts.push({ position: v(MX, UY + 2.4, MZ - ID / 2 + 0.38), rotation: 0, target: v(MX, UY + 1.8, MZ), width: 3.2, height: 3.2, style: 'gilt', wash: true });
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = MZ - 9 + i * 6; mounts.push({ position: v(MX + s * (IW / 2 - 0.38), UY + 2.4, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(MX, UY + 1.8, z), width: 3.2, height: 2.4, style: 'gilt', wash: true }); }
    for (let i = 0; i < 3; i++) { const z = MZ + 4 + i * 4; mounts.push({ position: v(MX + IW / 2 - 0.38, 3.0, z), rotation: -PI / 2, target: v(MX + 4, 2.5, z), width: 2.6, height: 1.9, style: 'gilt', wash: true }); }
    for (let i = 0; i < 3; i++) { const x = CX - 7 + i * 5; mounts.push({ position: v(x, 3.0, MZ - ID / 2 + 0.38 + 0), rotation: 0, target: v(x, 2, CZ), width: 2.8, height: 2.0, style: 'gilt', wash: false }); }
    return { mounts, spawn: v(MX + IW / 2 - 3, 3, MZ - 1), look: v(SX, 4.5, SZ), eye: 3, bounds: [MX - IW / 2 + 0.8, 14, MZ - ID / 2 + 1, 30], style: 'gilt', floorY: (x, z) => { const dx = x - SX, dz = z - SZ; const d = Math.hypot(dx, dz); if (d > 2.0 && d < 4.4 && x > MX - IW / 2 && x < MX + IW / 2) { const a = Math.atan2(dz, dx); let t = ((a - PI * 0.2) / (PI * 1.5)); while (t < -0.1) t += (2 * PI) / (PI * 1.5); if (t >= -0.05 && t <= 1.0) return Math.max(0.2, Math.min(5.4, 0.2 + t * 5.2)); } if (x > MX - IW / 2 && x < MX + IW / 2 && z > MZ - ID / 2 && z < MZ + ID / 2 && d >= 4.4 && d < 4.6) return 0; return 0; } };
  },
};

/* ---------------- 90 COOPER HEWITT ---------------- */
export const cooperhewitt: RoomDef = {
  id: 'cooperhewitt',
  name: 'The Carnegie garden',
  area: 'COOPER HEWITT',
  mood: 'Garden party',
  color: '#a8c090',
  description: 'The mansion on 91st Street from its own lawn: the conservatory, the terrace and pergola, the great hall with its carved oak stair, the works in the design galleries and out on the garden walls.',
  signatures: 'The Georgian brick and limestone mansion set back behind a lawn and iron fence, the glass and bronze conservatory, the Scottish oak entrance hall with organ pipes, the garden pergola of wisteria, the terrace where the summer parties happen.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad8, horizon: 0xeef0ec, ground: 0x5a6a5a, fog: 0.002, sun: { az: 3.0, el: 0.85, color: 0xfff6e8, size: 12 }, env: 1.0 });
    k.hemi(0xf2f6ff, 0x4a5a48, 0.95);
    k.sun(0xfff2dc, 2.4, 30, 80, 40, true, 90);
    const brick = k.pbr('chBrickR', X.brick(0x8a4a3a, 268), 0.28), lime = k.pbr('chLime2', X.ashlar(0xd8d0bc, 269, 4), 0.25),
      lawn = k.pbr('chLawn', X.grass(0x4a7a3a, 137), 0.06), gravel = k.pbr('chGravel', X.cobble(0xa39a86, 138), 1.1),
      oak = k.pbr('chOak', X.planks(0x4a2e1a, 4, 270, 0.15), 1.4, { roughness: 0.45 }), floorW = k.pbr('chParquet', X.planks(0x8a6a48, 10, 271, 0.1), 0.7),
      glass = k.glass(0xdcecf6, 0.12, 0.04), bronze = k.flat(0x4a3a28, 0.8, 0.4), iron = k.flat(0x1a1c20, 0.7, 0.45), dark = k.flat(0x1a1c20, 0.5, 0.6),
      white = k.flat(0xf4f0e8, 0.05, 0.6), timber = k.pbr('chPergola', X.planks(0x8a7a5a, 4, 272, 0.3), 0.8);
    // 91st Street, the fence, the lawn, the mansion
    street(k, { w: 20, len: 140, z: 46, x: 0 });
    blockFront(k, { x: 44, z0: 100, count: 8, face: -1, seed: 273, h: [16, 30] });
    k.box(80, 0.4, 70, 0, -0.2, 0, lawn);
    k.rail(0, 34, 80, iron, 1.4, 'x', 1.6); k.block(-40, -2.4, 33.6, 34.4); k.block(2.4, 40, 33.6, 34.4);
    k.box(4, 0.3, 40, 0, 0.05, 14, gravel);
    const MX = -12, MZ = -10, MW = 34, MD = 26;
    k.box(MW, 18, MD, MX, 9, MZ, brick);
    k.box(MW + 0.4, 2.4, MD + 0.4, MX, 1.2, MZ, lime); k.box(MW + 0.6, 1.0, MD + 0.6, MX, 17.6, MZ, lime);
    for (let f = 0; f < 3; f++) for (let i = 0; i < 7; i++) { const y = 4 + f * 4.8, x = MX - 15 + i * 5; k.box(2.0, 3.0, 0.16, x, y, MZ + MD / 2 + 0.02, lime); k.box(1.6, 2.6, 0.06, x, y, MZ + MD / 2 + 0.1, glass); }
    k.mesh(new T.ConeGeometry(16, 5, 4), k.pbr('chSlate2', X.steel(0x3a3a40, false, 274), 0.4), MX, 20.5, MZ).rotation.y = PI / 4;
    k.box(6, 5, 3, MX, 2.5, MZ + MD / 2 + 1.5, lime); k.arch(2.6, 4, 3, MX, 0, MZ + MD / 2 + 1.5, lime, false, 0.85);
    k.block(MX - MW / 2, MX - 1.5, MZ + MD / 2 - 0.4, MZ + MD / 2 + 3.2); k.block(MX + 1.5, MX + MW / 2, MZ + MD / 2 - 0.4, MZ + MD / 2 + 3.2);
    k.sign('COOPER HEWITT  ·  DESIGN', 6, 0.6, MX, 6.2, MZ + MD / 2 + 3.06, 'transparent', '#3a3020', 70, 0);
    mlowBanner(k, MX - 10, 10, MZ + MD / 2 + 0.6, 0, 3.0, true); blossomFlag(k, MX + 10, 10, MZ + MD / 2 + 0.6, 0, 2.6, 5, 'electric');
    // the conservatory on the garden side, the terrace, the pergola
    const CX = MX + MW / 2 + 6, CZ = MZ + 4;
    k.box(12, 0.3, 14, CX, 0.15, CZ, k.pbr('chTile', X.terrazzo(0xc8c0b0, 139), 0.4));
    for (const s of [-1, 1]) { k.box(0.16, 6, 14, CX + s * 6, 3, CZ, glass); k.box(12, 6, 0.16, CX, 3, CZ + s * 7, glass); k.block(CX + s * 6 - 0.3, CX + s * 6 + 0.3, CZ - 7, CZ + 7); }
    k.block(CX - 6, CX + 6, CZ + 6.7, CZ + 7.3); k.block(CX - 6, CX - 1.5, CZ - 7.3, CZ - 6.7); k.block(CX + 1.5, CX + 6, CZ - 7.3, CZ - 6.7);
    for (let i = 0; i <= 6; i++) { k.box(0.16, 6, 0.16, CX - 6 + i * 2, 3, CZ - 7, bronze); k.box(0.16, 6, 0.16, CX - 6 + i * 2, 3, CZ + 7, bronze); k.box(12.2, 0.16, 0.16, CX, 6 + i * 0.5, CZ - 7 + i * 2.33, bronze); }
    const roof = k.mesh(new T.CylinderGeometry(6, 6, 14, 16, 1, true, 0, PI), glass, CX, 6, CZ); roof.rotation.set(0, 0, PI / 2); roof.rotateX(PI / 2); void roof;
    for (let i = 0; i < 8; i++) { const x = CX - 4 + (i % 4) * 2.6, z = CZ - 4 + Math.floor(i / 4) * 8; k.prop('palm_urn', x, 0.15, z, { height: 2.4 + (i % 3) * 0.4, keepOut: 1.0 }); }
    k.box(30, 0.3, 12, MX + 2, 0.05, MZ - MD / 2 - 7, gravel);
    const PZ = MZ - MD / 2 - 12;
    for (let i = 0; i <= 6; i++) { const x = MX - 12 + i * 4.6; for (const dz of [-2, 2]) { k.box(0.5, 3.2, 0.5, x, 1.6, PZ + dz, white); k.keepOut.push({ x, z: PZ + dz, r: 0.5 }); } k.box(0.24, 0.24, 5.2, x, 3.4, PZ, timber); }
    k.box(28.6, 0.24, 0.3, MX + 2, 3.4, PZ - 2, timber); k.box(28.6, 0.24, 0.3, MX + 2, 3.4, PZ + 2, timber);
    for (let x = MX - 11.5; x < MX + 15; x += 0.9) k.box(0.14, 0.2, 5.6, x, 3.6, PZ, timber);
    const rnd = X.mulberry(90);
    for (let i = 0; i < 30; i++) { const x = MX - 12 + rnd() * 28, z = PZ - 2 + rnd() * 4; k.mesh(new T.SphereGeometry(0.4 + rnd() * 0.3, 7, 5), k.flat(0x4a7a3a, 0, 0.9), x, 3.9 + rnd() * 0.4, z); k.mesh(new T.SphereGeometry(0.16, 6, 4), k.flat(0x8a6ad8, 0, 0.8), x, 3.1 + rnd() * 0.5, z); }
    for (let i = 0; i < 24; i++) { const x = -30 + rnd() * 60, z = -34 + rnd() * 20; if (Math.abs(x - MX) < 20 && z > MZ - MD / 2 - 14) continue; k.tree(x, 0, z, { kind: rnd() > 0.5 ? 'round' : 'column', h: 5 + rnd() * 4, r: 2.4 + rnd() * 2, leaf: 0x4a7a3c, seed: i }); }
    for (let i = 0; i < 8; i++) { const x = -20 + i * 6, z = 8 + (i % 2) * 4; k.cyl(0.04, 0.72, x, 0.36, z, white, 0.04, 8); k.cyl(0.6, 0.03, x, 0.74, z, white, 0.6, 16); k.keepOut.push({ x, z, r: 0.8 }); }
    blossomGarden(k, 14, 0, -20, 5, 1.8);
    // the great hall: oak panelling, the carved stair, the organ pipes, the works on the oak
    const HW = MW - 1.2, HD = MD - 1.2;
    k.box(HW, 0.3, HD, MX, 0.15, MZ, floorW);
    for (const s of [-1, 1]) { k.box(0.3, 7, HD, MX + s * (HW / 2 - 0.2), 3.5, MZ, oak); k.block(MX + s * (HW / 2 - 0.6), MX + s * (HW / 2 + 0.6), MZ - HD / 2, MZ + HD / 2); }
    k.box(HW, 7, 0.3, MX, 3.5, MZ - HD / 2 + 0.2, oak); k.block(MX - HW / 2, MX + HW / 2, MZ - HD / 2 - 0.6, MZ - HD / 2 + 0.6);
    k.box(HW, 0.4, HD, MX, 7.2, MZ, k.pbr('chCeiling', X.plaster(0xd8d0c0, 140), 0.4));
    for (let i = 0; i < 12; i++) { const h = 2.4 + Math.abs(5.5 - i) * 0.3; k.cyl(0.1, h, MX - 5.5 + i * 1.0, 3.6 + h / 2, MZ - HD / 2 + 0.6, k.flat(0xb8a878, 0.8, 0.35), 0.09, 10); }
    for (let i = 0; i < 16; i++) k.box(3, 0.4, 1.0, MX - HW / 2 + 1.8, 0.2 + i * 0.4, MZ + HD / 2 - 2 - i * 1.0, oak);
    for (let i = 0; i < 16; i++) k.box(0.06, 0.9, 0.06, MX - HW / 2 + 3.4, 0.9 + i * 0.4, MZ + HD / 2 - 2 - i * 1.0, oak);
    k.box(HW, 0.4, 5, MX, 6.6, MZ - HD / 2 + 2.5, oak);
    k.block(MX - HW / 2 + 0.3, MX - HW / 2 + 3.6, MZ + HD / 2 - 18, MZ + HD / 2 - 1.6);
    eyeMedallion(k, MX, 0.16, MZ + 4, 2.0);
    donorWall(k, MX, 4.6, MZ - HD / 2 + 0.38, 0, 10, false);
    for (const x of [-8, 8]) k.prop('museum_bench', MX + x, 0.15, MZ, { height: 0.58, keepOut: 1.4 });
    k.prop('vitrine', MX, 0.15, MZ - 3, { height: 1.7, keepOut: 1.2 }); k.prop('globe_stand', MX + 6, 0.15, MZ + 6, { height: 2.0, keepOut: 1.0 });
    for (let i = 0; i < 3; i++) k.point(MX - 8 + i * 8, 6.2, MZ, 0xffe6c0, 16, 12);
    k.crowd([v(0, 0, 30), v(-2, 0, 14), v(MX + 8, 0, MZ + MD / 2 + 6), v(MX - 6, 0, PZ + 5), v(10, 0, -14), v(16, 0, 6)], 26, { seed: 121, speed: 0.4, spread: 2.6, animate: !ctx.reduced, closed: true, colors: [0xe6e2da, 0xf4f0e8, 0xd8d0c0, 0x8a3a3a, 0x33477f, 0xc9a25a] });
    k.censusWall({ x: MX + HW / 2 - 0.36, y: 3.4, z: MZ, rotY: -PI / 2, cols: 30, rows: 4, tile: 0.5, gap: 0.05, start: ctx.wallStart(2900, 120), pieces: ctx.all, backing: dark });
    // the works: the oak walls of the hall, the garden wall along the pergola, the conservatory panels
    const mounts: Mount[] = [];
    for (let i = 0; i < 4; i++) { const z = MZ - 8 + i * 5.5; mounts.push({ position: v(MX - HW / 2 + 0.38, 3.2, z), rotation: PI / 2, target: v(MX, 2.6, z), width: 3.6, height: 2.4, style: 'gilt', wash: true }); }
    for (const x of [-10, 10]) mounts.push({ position: v(MX + x, 3.4, MZ - HD / 2 + 0.38), rotation: 0, target: v(MX + x, 2.6, MZ), width: 4.2, height: 2.6, style: 'gilt', wash: true });
    for (let i = 0; i < 6; i++) { const x = MX - 10 + i * 4.6; k.box(3.2, 2.2, 0.14, x, 1.7, PZ - 2.5, white); mounts.push({ position: v(x, 1.8, PZ - 2.42), rotation: 0, target: v(x, 2, PZ + 6), width: 2.8, height: 1.7, style: 'white', wash: false }); }
    for (let i = 0; i < 3; i++) { const z = CZ - 4 + i * 4; mounts.push({ position: v(CX + 5.9, 2.4, z), rotation: -PI / 2, target: v(CX, 2, z), width: 2.4, height: 1.6, style: 'white', wash: false }); }
    for (let i = 0; i < 3; i++) { const x = -16 + i * 16; k.box(0.14, 2.6, 3.6, 0, 0, 0, iron).position.set(x, 1.8, 33.6); mounts.push({ position: v(x, 1.9, 33.5), rotation: PI, target: v(x, 2, 24), width: 3.2, height: 2.0, style: 'black', wash: false }); }
    return { mounts, spawn: v(0, 3, 42), look: v(MX, 10, MZ), eye: 3, bounds: [-38, 38, -38, 50], style: 'gilt', floorY: (x, z) => { if (x > MX - HW / 2 + 0.3 && x < MX - HW / 2 + 3.6 && z < MZ + HD / 2 - 1.6 && z > MZ + HD / 2 - 18) return Math.min(6.4, ((MZ + HD / 2 - 1.6 - z) / 16) * 6.4); if (z > MZ - HD / 2 && z < MZ - HD / 2 + 5 && x > MX - HW / 2 && x < MX + HW / 2) return 6.8; return 0; } };
  },
};

/* ---------------- 91 THE BREUER ---------------- */
export const breuer: RoomDef = {
  id: 'breuer',
  name: 'The inverted ziggurat',
  area: 'THE BREUER',
  mood: 'Granite grey noon',
  color: '#8a8a88',
  description: 'Madison at 75th: the granite building stepping out over the moat, the bridge in, the concrete coffered ceilings, the trapezoid window, the works in the great fourth floor gallery.',
  signatures: 'The three cantilevered granite storeys each overhanging the one below, the sunken sculpture court and the concrete bridge over it, the single angled window on the facade, the bush hammered concrete inside, the bluestone floors, the grid of circular ceiling lights.',
  build(k, ctx) {
    k.sky({ top: 0x8fa0b8, horizon: 0xe6e6e2, ground: 0x5a5a58, fog: 0.0022, sun: { az: 3.2, el: 0.8, color: 0xf6f4f0, size: 12 }, haze: 0.4, env: 0.85 });
    k.hemi(0xeef0f4, 0x4a4a48, 0.9);
    k.sun(0xf6f4f0, 1.8, 20, 80, 30, true, 80);
    const granite = k.pbr('brGranite', X.ashlar(0x6a6a68, 275, 2), 0.3, { roughness: 0.8 }),
      conc = k.pbr('brConc', X.concrete(0x8a8a86, 141), 0.3, { roughness: 0.9 }), blue = k.pbr('brBluestone', X.pavers(0x5a6068, 142), 0.5, { roughness: 0.6 }),
      dark = k.flat(0x1a1c20, 0.5, 0.6), glass = k.glass(0xdcecf6, 0.14, 0.04), glow = k.glow(0xfff4e8), white = k.flat(0xf4f4f2, 0, 0.9);
    // Madison Avenue, the moat, the bridge, the cantilevers
    street(k, { w: 22, len: 140, z: 40, x: 0 });
    blockFront(k, { x: -44, z0: 100, count: 10, face: 1, seed: 276, h: [16, 30] });
    const BX = 0, BZ = -6, BW = 34;
    k.box(BW + 12, 0.4, 24, BX, -4.2, BZ + 16, blue);
    for (const s of [-1, 1]) k.box(0.6, 4, 24, BX + s * (BW / 2 + 6), -2, BZ + 16, conc);
    k.box(6, 0.5, 14, BX, 0, BZ + 16, conc); k.rail(BX - 2.8, BZ + 16, 14, dark, 1.0, 'z', 2); k.rail(BX + 2.8, BZ + 16, 14, dark, 1.0, 'z', 2);
    k.block(-BW / 2 - 6, -3.2, BZ + 9, BZ + 24); k.block(3.2, BW / 2 + 6, BZ + 9, BZ + 24);
    k.prop('bronze_figure', BX - 10, -4, BZ + 16, { height: 3.4 }); k.prop('noguchi_stone_1', BX + 10, -4, BZ + 18, { height: 2.6 }); k.prop('mobile', BX + 8, 2, BZ + 12, { height: 4 });
    const tiers: [number, number, number][] = [[BW, 8, 0], [BW + 6, 6, 8], [BW + 12, 6, 14], [BW + 18, 6, 20]];
    tiers.forEach(([w, h, y], i) => { k.box(w, h, 30 + i * 4, BX, y + h / 2, BZ - 6 - i * 2, granite); if (i > 0) k.box(w + 0.4, 0.5, 30 + i * 4 + 0.4, BX, y + 0.25, BZ - 6 - i * 2, dark); });
    const tw = k.box(6, 3, 0.4, BX + 8, 24, BZ + 14, glass); tw.rotation.x = -0.4; k.box(6.4, 3.4, 0.3, BX + 8, 24, BZ + 13.7, conc).rotation.x = -0.4;
    k.box(8, 5, 0.3, BX, 2.5, BZ + 9.2, glass); k.block(-BW / 2, -3.2, BZ + 8.8, BZ + 9.6); k.block(3.2, BW / 2, BZ + 8.8, BZ + 9.6);
    k.sign('THE BREUER  ·  1966', 6, 0.6, BX, 6.6, BZ + 9.05, 'transparent', '#f0ece4', 70, 0);
    mlowBanner(k, BX - 12, 4.2, BZ + 9.4, 0, 2.8, true); blossomFlag(k, BX + 12, 4.2, BZ + 9.4, 0, 2.4, 1, 'ink');
    // inside: the lobby, the great gallery upstairs with its coffered ceiling and the grid of round lights, the bluestone floor
    const GW = BW - 2, GD = 28, GY = 14;
    k.box(GW, 0.3, GD, BX, 0.15, BZ - 6, blue);
    for (const s of [-1, 1]) k.block(BX + s * (GW / 2), BX + s * (GW / 2 + 1), BZ - 20, BZ + 9);
    k.block(BX - GW / 2, BX + GW / 2, BZ - 21, BZ - 20);
    k.box(GW, 0.4, GD, BX, 6.4, BZ - 6, conc);
    for (let x = -12; x <= 12; x += 4) for (let z = -18; z <= 4; z += 4) { k.mesh(new T.CircleGeometry(0.3, 16), glow, BX + x, 6.18, BZ + z).rotation.x = PI / 2; k.point(BX + x, 5.4, BZ + z, 0xfff4e8, 6, 6); }
    k.box(GW + 6, 0.4, GD + 6, BX, GY, BZ - 8, blue);
    k.box(GW + 6, 0.5, GD + 6, BX, GY + 6.4, BZ - 8, conc);
    for (let x = -15; x <= 15; x += 3) for (let z = -21; z <= 4; z += 3) { k.box(2.8, 0.5, 2.8, BX + x, GY + 6.2, BZ + z, dark); k.mesh(new T.CircleGeometry(0.28, 16), glow, BX + x, GY + 5.9, BZ + z).rotation.x = PI / 2; if ((x + z) % 6 === 0) k.point(BX + x, GY + 5, BZ + z, 0xfff4e8, 8, 7); }
    for (const s of [-1, 1]) k.box(0.4, 6.4, GD + 6, BX + s * (GW / 2 + 3), GY + 3.2, BZ - 8, conc);
    k.box(GW + 6, 6.4, 0.4, BX, GY + 3.2, BZ - 8 - GD / 2 - 3, conc); k.box(GW + 6, 6.4, 0.4, BX, GY + 3.2, BZ - 8 + GD / 2 + 3, conc);
    k.block(BX - GW / 2 - 3, BX + GW / 2 + 3, BZ - 8 + GD / 2 + 2.6, BZ - 8 + GD / 2 + 3.4); k.block(BX - GW / 2 - 3, BX + GW / 2 + 3, BZ - 8 - GD / 2 - 3.4, BZ - 8 - GD / 2 - 2.6);
    for (let i = 0; i < 28; i++) k.box(3, 0.5, 1.0, BX - GW / 2 + 1.8, 0.25 + i * 0.5, BZ + 6 - i * 0.9, conc);
    k.block(BX - GW / 2 + 0.3, BX - GW / 2 + 3.3, BZ - 20, BZ + 6.6);
    for (const [x, z] of [[BX - 6, BZ - 14], [BX + 6, BZ - 2]]) { k.box(0.4, 5, 8, x, GY + 2.5, z, white); k.block(x - 0.4, x + 0.4, z - 4, z + 4); }
    k.prop('vitrine', BX, GY + 0.2, BZ - 8, { height: 1.7, keepOut: 1.2 }); k.prop('museum_bench', BX + 10, GY + 0.2, BZ - 12, { height: 0.58, keepOut: 1.4 });
    donorWall(k, BX, 3.6, BZ - 20 + 0.42, 0, 9, false);
    k.crowd([v(0, 0, 36), v(0, 0, BZ + 12), v(-8, 0.15, BZ - 4), v(8, 0.15, BZ - 14)], 20, { seed: 122, speed: 0.4, spread: 2.2, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a] });
    k.crowd([v(BX - 10, GY + 0.2, BZ - 18), v(BX + 12, GY + 0.2, BZ + 2)], 8, { seed: 123, speed: 0.3, spread: 2, animate: !ctx.reduced });
    k.censusWall({ x: BX + GW / 2 - 0.42, y: 3.2, z: BZ - 6, rotY: -PI / 2, cols: 40, rows: 5, tile: 0.5, gap: 0.05, start: ctx.wallStart(6800, 200), pieces: ctx.all, backing: dark });
    // the works: the lobby, the fourth floor gallery on its perimeter and the free standing walls
    const mounts: Mount[] = [];
    for (let i = 0; i < 4; i++) { const z = BZ - 16 + i * 6; mounts.push({ position: v(BX - GW / 2 + 3.7, 3.2, z), rotation: PI / 2, target: v(BX, 2.6, z), width: 4.2, height: 2.6, style: 'white', wash: true }); }
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = BZ - 20 + i * 8; mounts.push({ position: v(BX + s * (GW / 2 + 2.58), GY + 3.2, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(BX, GY + 2.6, z), width: 5.2, height: 3.0, style: 'white', wash: true }); }
    for (const [x, z] of [[BX - 6, BZ - 14], [BX + 6, BZ - 2]]) for (const s of [-1, 1]) mounts.push({ position: v(x + s * 0.22, GY + 2.8, z), rotation: s < 0 ? -PI / 2 : PI / 2, target: v(x + s * 6, GY + 2.6, z), width: 4.4, height: 2.6, style: 'white', wash: true });
    for (const x of [-10, 0, 10]) mounts.push({ position: v(BX + x, GY + 3.2, BZ - 8 - GD / 2 - 2.58), rotation: 0, target: v(BX + x, GY + 2.6, BZ - 8), width: 5.2, height: 3.0, style: 'white', wash: true });
    return { mounts, spawn: v(-6, 3, 36), look: v(BX, 14, BZ), eye: 3, bounds: [-GW / 2 - 2.6, GW / 2 + 2.6, BZ - 8 - GD / 2 - 2.4, 46], style: 'white', floorY: (x, z) => { if (x > BX - GW / 2 + 0.3 && x < BX - GW / 2 + 3.3 && z < BZ + 6.6 && z > BZ - 19) return Math.min(GY, ((BZ + 6.6 - z) / 25.2) * GY); if (x >= BX - GW / 2 + 0.3 && x < BX - GW / 2 + 3.3 && z <= BZ - 19) return GY + 0.2; if (z < BZ - 8 - GD / 2 - 2.6 + GD + 6 && z > BZ - 8 - GD / 2 - 2.6 && x > BX - GW / 2 + 3.3 && x < BX + GW / 2 + 2.6 && z <= BZ + 9) return GY + 0.2; return 0; } };
  },
};
