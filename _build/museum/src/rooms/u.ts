/* Rooms 97 to 101: the Museum of Arts and Design, the Hispanic Society court, the Studio Museum in Harlem, El Museo del Barrio, the Museum of the City of New York. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront } from './f';
import { mlowBanner, blossomFlag, donorWall, eyeMedallion, wordmarkRelief, eyeMonument, blossomGarden, INK, CLOUD, ELECTRIC, CYAN } from './brand';

const PI = Math.PI;

/* ---------------- 97 THE MUSEUM OF ARTS AND DESIGN ---------------- */
export const mad: RoomDef = {
  id: 'mad',
  name: 'The lollipop building',
  area: 'MUSEUM OF ARTS AND DESIGN',
  mood: 'Columbus Circle at rush hour',
  color: '#e8e0d0',
  description: 'The circle with its column and fountains, the white tower with the slot windows cut through it in a line, the tall galleries inside, the works in glass and terracotta light.',
  signatures: 'The nine storey tower on the circle sheathed in white glazed terracotta and glass, the vertical slot of windows snaking up its face, the circle with the column and monument and the ring of fountains, the park behind.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad0, horizon: 0xe8e8e0, ground: 0x5a5a55, fog: 0.002, sun: { az: 4.0, el: 0.5, color: 0xfff4e6, size: 12 }, env: 0.9 });
    k.hemi(0xffffff, 0x5a5a58, 0.85);
    k.sun(0xfff4e6, 2.0, -40, 60, 40, true, 90);
    const terra = k.pbr('madTerra', X.plaster(0xf0ece4, 157), 0.3, { roughness: 0.4 }), glass = k.glass(0xdcecf6, 0.14, 0.04), dark = k.flat(0x1a1c20, 0.5, 0.6),
      floorW = k.pbr('madFloor', X.planks(0xd8c8a8, 8, 298, 0.1), 0.8, { roughness: 0.5 }), white = k.pbr('madWhite', X.plaster(0xf6f6f4, 158), 0.4, { roughness: 0.9 }),
      granite = k.pbr('madGranite', X.ashlar(0x8a8480, 299, 2), 0.2), waterM = k.flat(0x88aacc, 0.3, 0.2, { transparent: true, opacity: 0.6 }), steel = k.flat(0x8c98a4, 0.9, 0.3);
    // the circle: the column with its figure, the ring of fountains, traffic, the park edge
    k.box(200, 0.3, 200, 0, -0.15, 0, k.pbr('asphaltS', X.asphalt(0x24282d), 0.11));
    k.mesh(new T.CylinderGeometry(24, 24, 0.5, 64), k.pbr('madPlaza', X.pavers(0x9a9a94, 159), 0.4), 0, 0.1, 40);
    k.cyl(1.4, 22, 0, 11.4, 40, granite, 1.2, 16); k.box(4, 4, 4, 0, 2.2, 40, granite); k.prop('bronze_figure', 0, 22.4, 40, { height: 4 }); k.keepOut.push({ x: 0, z: 40, r: 2.6 });
    for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; const j = k.mesh(new T.CylinderGeometry(0.05, 0.16, 3, 6), waterM, Math.cos(a) * 14, 1.8, 40 + Math.sin(a) * 14, true); if (!ctx.reduced) k.ticks.push((t) => { j.scale.y = 0.6 + 0.4 * Math.sin(t * 1.4 + i); }); k.box(1.2, 0.5, 1.2, Math.cos(a) * 14, 0.5, 40 + Math.sin(a) * 14, granite); }
    k.mesh(new T.RingGeometry(12, 16, 64), waterM, 0, 0.55, 40).rotation.x = -PI / 2;
    k.block(-16, 16, 24, 56);
    const cars: T.Mesh[] = [];
    for (let i = 0; i < 16; i++) { const c = k.mesh(new T.BoxGeometry(4.2, 1.4, 1.8), i % 3 ? k.flat(0xf1c531, 0.2, 0.5) : k.flat(0x1a1a1a, 0.4, 0.4), 0, 0.7, 0, true); c.userData.a = (i / 16) * PI * 2; cars.push(c); }
    if (!ctx.reduced) k.ticks.push((t) => cars.forEach((c) => { const a = c.userData.a + t * 0.25; c.position.set(Math.cos(a) * 30, 0.7, 40 + Math.sin(a) * 30); c.rotation.y = -a; }));
    k.box(120, 0.4, 100, 80, -0.2, -30, k.pbr('madLawn', X.grass(0x4a7a3a, 160), 0.06));
    const rnd = X.mulberry(97); for (let i = 0; i < 24; i++) k.tree(40 + rnd() * 80, 0, -70 + rnd() * 80, { kind: 'round', h: 8 + rnd() * 6, r: 3 + rnd() * 2, leaf: 0x4a7a3c, seed: i });
    blockFront(k, { x: -50, z0: 100, count: 12, face: 1, seed: 300, h: [24, 50] });
    // the tower: white terracotta with the slot climbing its face, the entrance, the galleries in a stack
    const TX = -22, TZ = -10, TW = 26, TH = 40;
    k.box(TW, TH, TW, TX, TH / 2, TZ, terra);
    const slot = [[6, 2], [9, 6], [9, 12], [4, 12], [4, 18], [10, 18], [10, 26], [2, 26], [2, 34]];
    for (let i = 0; i < slot.length - 1; i++) { const [x0, y0] = slot[i], [x1, y1] = slot[i + 1]; const w = Math.abs(x1 - x0) + 1.4, h = Math.abs(y1 - y0) + 1.4; k.box(w, h, 0.3, TX + (x0 + x1) / 2, (y0 + y1) / 2, TZ + TW / 2 + 0.05, glass); }
    k.box(8, 5, 0.3, TX - 6, 2.5, TZ + TW / 2 + 0.05, glass); k.block(TX - TW / 2, TX - 8.2, TZ + TW / 2 - 0.5, TZ + TW / 2 + 0.5); k.block(TX - 3.8, TX + TW / 2, TZ + TW / 2 - 0.5, TZ + TW / 2 + 0.5);
    k.sign('MUSEUM OF ARTS AND DESIGN', 8, 0.7, TX, 7, TZ + TW / 2 + 0.06, 'transparent', '#1a1c20', 70, 0);
    mlowBanner(k, TX + 8, 14, TZ + TW / 2 + 0.4, 0, 3.0, false); blossomFlag(k, TX - 9, 12, TZ + TW / 2 + 0.4, 0, 2.4, 3, 'cloud');
    const GW = TW - 1.2, GH = 5.6;
    for (let f = 0; f < 3; f++) { const y = f * (GH + 0.4); k.box(GW, 0.3, GW, TX, y + 0.15, TZ, floorW); for (const s of [-1, 1]) { k.box(0.3, GH, GW, TX + s * (GW / 2 - 0.2), y + GH / 2, TZ, white); k.box(GW, GH, 0.3, TX, y + GH / 2, TZ + s * (GW / 2 - 0.2), white); } k.box(GW, 0.4, GW, TX, y + GH, TZ, dark); for (let i = 0; i < 4; i++) k.point(TX - 6 + (i % 2) * 12, y + GH - 1, TZ - 6 + Math.floor(i / 2) * 12, 0xffffff, 18, 12); }
    k.block(TX - GW / 2 - 0.5, TX - GW / 2 + 0.5, TZ - GW / 2, TZ + GW / 2); k.block(TX + GW / 2 - 0.5, TX + GW / 2 + 0.5, TZ - GW / 2, TZ + GW / 2); k.block(TX - GW / 2, TX + GW / 2, TZ - GW / 2 - 0.5, TZ - GW / 2 + 0.5);
    for (let f = 0; f < 2; f++) { const y0 = f * 6; for (let i = 0; i < 18; i++) k.box(2.4, 0.33, 0.9, TX + GW / 2 - 1.5, y0 + 0.17 + i * 0.33, TZ + GW / 2 - 2 - i * 0.9, floorW); k.box(0.06, 1.0, 16, TX + GW / 2 - 2.8, y0 + 3.6, TZ + GW / 2 - 10, steel); }
    k.block(TX + GW / 2 - 2.8, TX + GW / 2 - 0.3, TZ - GW / 2, TZ + GW / 2 - 1.5);
    for (const [x, z, p, h] of [[TX - 6, TZ, 'vitrine', 1.7], [TX + 4, TZ - 6, 'vitrine', 1.7], [TX, TZ + 6, 'globe_stand', 2], [TX - 6, TZ + 6, 'armillary', 2.2]] as const) k.prop(p, x, 0.15, z, { height: h, keepOut: 1.2 });
    for (const [x, z, p] of [[TX - 4, TZ - 4, 'noguchi_stone_1'], [TX + 5, TZ + 5, 'noguchi_stone_3']] as const) k.prop(p, x, 6.15, z, { height: 2.4, keepOut: 1.6 });
    eyeMedallion(k, TX, 0.16, TZ + 8, 1.8);
    donorWall(k, TX, 3.6, TZ - GW / 2 + 0.36, 0, 9, true);
    k.crowd([v(-4, 0, 30), v(TX - 8, 0, TZ + 20), v(TX - 4, 0.15, TZ + 6), v(TX + 4, 0.15, TZ - 6)], 16, { seed: 131, speed: 0.4, spread: 2, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a] });
    k.censusWall({ x: TX - GW / 2 + 0.36, y: 9.2, z: TZ, rotY: PI / 2, cols: 30, rows: 5, tile: 0.5, gap: 0.05, start: ctx.wallStart(5700, 150), pieces: ctx.all, backing: dark });
    // the works: the white walls on each level, the slot side gets the small ones between the window pieces
    const mounts: Mount[] = [];
    for (let f = 0; f < 3; f++) { const y = f * 6 + 3.2; for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = TZ - 7 + i * 7; if (s > 0 && f < 2 && z > TZ) continue; mounts.push({ position: v(TX + s * (GW / 2 - 0.36), y, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(TX, y - 0.6, z), width: 4.4, height: 2.6, style: 'white', wash: true }); } for (const x of [-7, 0, 7]) mounts.push({ position: v(TX + x, y, TZ - GW / 2 + 0.36), rotation: 0, target: v(TX + x, y - 0.6, TZ), width: 4.4, height: 2.6, style: 'white', wash: true }); }
    return { mounts, spawn: v(-4, 3, 24), look: v(TX, 18, TZ), eye: 3, bounds: [TX - GW / 2 + 0.8, 20, TZ - GW / 2 + 0.8, 60], style: 'white', floorY: (x, z) => { for (const f of [0, 1]) { const y0 = f * 6; if (x > TX + GW / 2 - 2.8 && x < TX + GW / 2 - 0.3 && z < TZ + GW / 2 - 1.5 && z > TZ + GW / 2 - 17.8) { const t = (TZ + GW / 2 - 1.5 - z) / 16.3; if (f === 0 && t < 1) return t * 6; if (f === 1 && t < 1) return 6 + t * 6; } } if (x > TX - GW / 2 && x <= TX + GW / 2 - 2.8 && z > TZ - GW / 2 && z < TZ + GW / 2) return 0; return 0; } };
  },
};

/* ---------------- 98 THE HISPANIC SOCIETY ---------------- */
export const hispanicsociety: RoomDef = {
  id: 'hispanicsociety',
  name: 'The terracotta court',
  area: 'THE HISPANIC SOCIETY',
  mood: 'Audubon Terrace, afternoon',
  color: '#c8784a',
  description: 'The Beaux Arts terrace on Broadway at 155th, the bronze horseman, then the two storey court in red terracotta with its arcaded gallery, the works among the Spanish painters.',
  signatures: 'The plaza of white limestone institutions with the bronze equestrian at its centre, the main court lined in ornate red Spanish Renaissance terracotta with an arcaded upper gallery, the skylight, the Sorolla room of vision of Spain.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad8, horizon: 0xeef0ec, ground: 0x6a6a66, fog: 0.002, sun: { az: 3.6, el: 0.7, color: 0xfff4e6, size: 12 }, env: 0.95 });
    k.hemi(0xfff0dc, 0x4a4038, 0.8);
    k.sun(0xfff0d8, 2.0, 30, 60, 30, true, 80);
    const lime = k.pbr('hsLime', X.ashlar(0xd8d0bc, 301, 4), 0.25), terra = k.pbr('hsTerra', X.ashlar(0x9a4a3a, 302, 2), 0.16, { roughness: 0.6 }),
      terraD = k.pbr('hsTerraD', X.ashlar(0x7a3a2e, 303, 2), 0.16, { roughness: 0.6 }), floorT = k.pbr('hsFloor', X.terrazzo(0xb8a890, 161), 0.4, { roughness: 0.3 }),
      dark = k.flat(0x1a1c20, 0.5, 0.6), glass = k.glass(0xe8f4f8, 0.1, 0.03), steel = k.flat(0x8c98a4, 0.9, 0.3), bronze = k.flat(0x4a3a28, 0.8, 0.4);
    // Audubon Terrace: the plaza between the limestone buildings, the horseman, Broadway beyond
    street(k, { w: 26, len: 160, z: 50, x: 0 });
    blockFront(k, { x: 60, z0: 130, count: 10, face: -1, seed: 304, h: [16, 26] });
    k.box(60, 0.3, 50, 0, 0.05, 15, k.pbr('hsPlaza', X.pavers(0xb8b0a0, 162), 0.4));
    for (const s of [-1, 1]) { k.box(20, 14, 50, s * 40, 7, 15, lime); for (let i = 0; i < 5; i++) k.column(s * 30.5, 0, -5 + i * 10, 10, 0.8, lime, true); k.box(20, 2, 52, s * 40, 15, 15, lime); k.block(s * 40 - 10, s * 40 + 10, -10, 40); }
    k.prop('equestrian', 0, 0.15, 22, { height: 6, rotY: PI, keepOut: 3 }); k.box(4, 2.4, 6, 0, 1.2, 22, lime);
    k.prop('bronze_figure', -10, 0.15, 30, { height: 2.8, keepOut: 1.2 }); k.prop('bronze_figure', 10, 0.15, 30, { height: 2.8, keepOut: 1.2 });
    const FZ = -10, FW = 40;
    k.box(FW, 18, 34, 0, 9, FZ - 17, lime);
    for (let i = 0; i < 6; i++) { k.column(-15 + i * 6, 0.1, FZ + 1.2, 10, 0.9, lime, true); k.prop('ionic_capital', -15 + i * 6, 10.2, FZ + 1.2, { height: 1.4 }); }
    k.box(FW, 2, 4, 0, 12, FZ + 1.2, lime);
    k.arch(3.4, 6, 3, 0, 0, FZ - 1, lime, false, 0.85); k.block(-FW / 2, -1.9, FZ - 0.6, FZ + 0.6); k.block(1.9, FW / 2, FZ - 0.6, FZ + 0.6);
    k.sign('THE HISPANIC SOCIETY OF AMERICA', 14, 0.8, 0, 14, FZ + 0.06, 'transparent', '#3a3020', 70, 0);
    mlowBanner(k, -12, 7, FZ + 0.6, 0, 2.8, true); blossomFlag(k, 12, 7, FZ + 0.6, 0, 2.4, 7, 'ink');
    // the court: red terracotta on two storeys, arcades above, the skylight, the works
    const CW = 30, CD = 24, CZ = FZ - 16, CH = 14;
    k.box(CW, 0.3, CD, 0, 0.15, CZ, floorT);
    for (const s of [-1, 1]) { k.box(0.6, CH, CD, s * CW / 2, CH / 2, CZ, terra); k.block(s * CW / 2 - 0.5, s * CW / 2 + 0.5, CZ - CD / 2, CZ + CD / 2); }
    k.box(CW, CH, 0.6, 0, CH / 2, CZ - CD / 2, terra); k.block(-CW / 2, CW / 2, CZ - CD / 2 - 0.5, CZ - CD / 2 + 0.5);
    k.box(CW, CH, 0.6, 0, CH / 2, CZ + CD / 2, terra); k.block(-CW / 2, -1.9, CZ + CD / 2 - 0.5, CZ + CD / 2 + 0.5); k.block(1.9, CW / 2, CZ + CD / 2 - 0.5, CZ + CD / 2 + 0.5);
    k.box(CW + 1, 0.4, CD + 1, 0, CH, CZ, glass); for (let x = -CW / 2; x <= CW / 2; x += 3) k.box(0.2, 0.4, CD + 1, x, CH + 0.1, CZ, steel);
    k.point(0, CH - 3, CZ, 0xfff4e6, 80, 40);
    for (const s of [-1, 1]) { k.arcade(CD - 2, 6, 1.2, 4, 3.6, 5, s * (CW / 2 - 0.6), 7, CZ, terraD, PI / 2, false); k.box(3, 0.4, CD - 2, s * (CW / 2 - 1.5), 7, CZ, floorT); for (let i = 0; i < 5; i++) k.box(0.3, 0.3, 0.3, s * (CW / 2 - 3), 7.4, CZ - 8 + i * 4, terraD); }
    k.arcade(CW - 2, 6, 1.2, 5, 3.6, 5, 0, 7, CZ - CD / 2 + 0.6, terraD, 0, false); k.box(CW - 2, 0.4, 3, 0, 7, CZ - CD / 2 + 1.5, floorT);
    for (let i = 0; i < 20; i++) k.box(2.4, 0.35, 0.9, CW / 2 - 1.5, 0.17 + i * 0.35, CZ + CD / 2 - 1.5 - i * 0.9, floorT);
    k.block(CW / 2 - 2.8, CW / 2 - 0.3, CZ - CD / 2, CZ + CD / 2 - 1);
    for (let f = 0; f < 2; f++) for (let i = 0; i < 24; i++) { const a = (i / 24) * PI * 2; const r = 0.12; void a; void r; }
    for (let x = -12; x <= 12; x += 6) for (const s of [-1, 1]) k.box(0.8, 1.2, 0.3, x, 3.2, CZ + s * (CD / 2 - 0.45), terraD);
    eyeMedallion(k, 0, 0.16, CZ + 6, 2.2);
    donorWall(k, 0, 10.2, CZ - CD / 2 + 0.36, 0, 9, false);
    for (const x of [-8, 8]) k.prop('museum_bench', x, 0.15, CZ, { height: 0.58, keepOut: 1.4 });
    k.prop('vitrine', 0, 0.15, CZ - 4, { height: 1.7, keepOut: 1.2 });
    k.crowd([v(0, 0, 40), v(-6, 0, 10), v(0, 0.15, CZ + 8), v(-8, 0.15, CZ - 4), v(8, 0.15, CZ - 8)], 16, { seed: 132, speed: 0.4, spread: 2, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a, 0xc9a25a] });
    k.censusWall({ x: -CW / 2 + 0.36, y: 10.6, z: CZ, rotY: PI / 2, cols: 30, rows: 4, tile: 0.5, gap: 0.05, start: ctx.wallStart(2400, 120), pieces: ctx.all, backing: dark });
    // the works: the court walls at ground level in gilt between the terracotta pilasters, the upper gallery bays
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = CZ - 9 + i * 6; mounts.push({ position: v(s * (CW / 2 - 0.36), 3.4, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 2.8, z), width: 4.2, height: 2.6, style: 'gilt', wash: true }); }
    for (const x of [-9, -3, 3, 9]) mounts.push({ position: v(x, 3.4, CZ - CD / 2 + 0.36), rotation: 0, target: v(x, 2.8, CZ), width: 4.2, height: 2.6, style: 'gilt', wash: true });
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = CZ - 6 + i * 6; mounts.push({ position: v(s * (CW / 2 - 0.36), 10.2, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 9.5, z), width: 3.2, height: 2.0, style: 'gilt', wash: false }); }
    for (const x of [-12, 12]) mounts.push({ position: v(x, 5.4, FZ + 0.42), rotation: 0, target: v(x, 4, FZ + 12), width: 4.6, height: 2.7, style: 'gilt', wash: false });
    return { mounts, spawn: v(-6, 3, 44), look: v(0, 10, FZ), eye: 3, bounds: [-CW / 2 + 1, CW / 2 - 1, CZ - CD / 2 + 1, 56], style: 'gilt', floorY: (x, z) => { if (x > CW / 2 - 2.8 && x < CW / 2 - 0.3 && z < CZ + CD / 2 - 1 && z > CZ + CD / 2 - 19.5) return Math.min(6.8, ((CZ + CD / 2 - 1 - z) / 18.5) * 6.8); if (x > CW / 2 - 3.2 && x < CW / 2 - 0.3 && z <= CZ + CD / 2 - 19.5 && z > CZ - CD / 2) return 7.2; if (z > CZ - CD / 2 && z < CZ - CD / 2 + 3 && Math.abs(x) < CW / 2 - 0.6) return 7.2; return 0; } };
  },
};

/* ---------------- 99 THE STUDIO MUSEUM ---------------- */
export const studiomuseum: RoomDef = {
  id: 'studiomuseum',
  name: 'The new building on 125th',
  area: 'THE STUDIO MUSEUM IN HARLEM',
  mood: 'Opening on 125th Street',
  color: '#d88a3a',
  description: 'One hundred twenty fifth Street with its music, the new building\'s stacked concrete terraces and the inverted stoop, the tall gallery inside, the works on the walls of Harlem\'s museum.',
  signatures: 'The new building\'s facade of layered concrete frames stepping back, the inverted stoop that opens the ground floor to the street as bleacher seating, the double height gallery, the roof terrace, the avenue with its vendors and the Apollo down the block.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad8, horizon: 0xf0e4cc, ground: 0x6a6a66, fog: 0.002, sun: { az: 4.2, el: 0.5, color: 0xffe6c0, size: 14 }, env: 0.95 });
    k.hemi(0xfff0e0, 0x5a4a38, 0.9);
    k.sun(0xffe0b8, 2.2, -50, 46, 40, true, 90);
    const conc = k.pbr('smConc', X.concrete(0x9a948a, 163), 0.3, { roughness: 0.8 }), concD = k.pbr('smConcD', X.concrete(0x7a746a, 164), 0.3, { roughness: 0.85 }),
      floorC = k.pbr('smFloor', X.concrete(0xb8b4ac, 165), 0.3, { roughness: 0.6 }), white = k.pbr('smWhite', X.plaster(0xf6f6f4, 166), 0.4, { roughness: 0.9 }),
      glass = k.glass(0xdcecf6, 0.14, 0.04), dark = k.flat(0x1a1c20, 0.5, 0.6), wood = k.pbr('smWood', X.planks(0x8a6a48, 5, 305), 1.0);
    street(k, { w: 26, len: 200, z: 30, x: 0 });
    blockFront(k, { x: 52, z0: 130, count: 14, face: -1, seed: 306, h: [10, 18] });
    blockFront(k, { x: -52, z0: 130, count: 6, face: 1, seed: 307, h: [10, 16] });
    for (let i = 0; i < 6; i++) { const x = -60 + i * 24; k.box(2.4, 1.0, 1.2, x, 0.5, 20, wood); k.box(2.6, 0.06, 1.4, x, 1.04, 20, k.flat([0xe83a3a, 0xf1c531, 0x3aa06a][i % 3], 0, 0.8)); for (const dx of [-1.2, 1.2]) k.box(0.06, 2.6, 0.06, x + dx, 1.3, 20, dark); k.box(2.6, 0.06, 1.6, x, 2.6, 20, k.flat([0xe83a3a, 0xf1c531, 0x3aa06a][(i + 1) % 3], 0, 0.8)); k.keepOut.push({ x, z: 20, r: 1.6 }); }
    // the building: concrete frames stepping back, the inverted stoop as bleacher steps under the facade, the gallery
    const BX = -30, BZ = -10, BW = 34, BD = 30;
    const frames: [number, number][] = [[BW, 12], [BW - 4, 8], [BW - 8, 8], [BW - 14, 6]];
    let y = 0;
    frames.forEach(([w, h], i) => { k.box(w, h, BD - i * 3, BX, y + h / 2, BZ - i * 1.5, i % 2 ? concD : conc); for (let x = -w / 2; x <= w / 2; x += 4) k.box(0.8, h, 0.6, BX + x, y + h / 2, BZ + BD / 2 - i * 3 + 0.4, concD); k.box(w - 2, h - 1, 0.2, BX, y + h / 2, BZ + BD / 2 - i * 3 + 0.05, glass); y += h; });
    for (let i = 0; i < 6; i++) { k.box(BW - 4, 0.5, 1.2, BX, 0.25 + i * 0.5, BZ + BD / 2 + 1 + i * 1.2, conc); k.box(BW - 4, 0.6, 0.06, BX, 0.55 + i * 0.5, BZ + BD / 2 + 0.4 + i * 1.2, dark); }
    k.block(BX - BW / 2, BX - 2.2, BZ + BD / 2 - 0.4, BZ + BD / 2 + 0.6); k.block(BX + 2.2, BX + BW / 2, BZ + BD / 2 - 0.4, BZ + BD / 2 + 0.6);
    k.sign('THE STUDIO MUSEUM IN HARLEM', 10, 0.8, BX, 10, BZ + BD / 2 + 0.44, '#1a1c20', '#f4f0e8', 80, 0, { border: true });
    mlowBanner(k, BX - 12, 6, BZ + BD / 2 + 0.7, 0, 3.0, true); blossomFlag(k, BX + 12, 6, BZ + BD / 2 + 0.7, 0, 2.6, 5, 'ink');
    const GW = BW - 2, GD = BD - 2, GH = 11;
    k.box(GW, 0.3, GD, BX, 0.15, BZ, floorC);
    for (const s of [-1, 1]) { k.box(0.4, GH, GD, BX + s * GW / 2, GH / 2, BZ, white); k.block(BX + s * GW / 2 - 0.4, BX + s * GW / 2 + 0.4, BZ - GD / 2, BZ + GD / 2); }
    k.box(GW, GH, 0.4, BX, GH / 2, BZ - GD / 2, white); k.block(BX - GW / 2, BX + GW / 2, BZ - GD / 2 - 0.4, BZ - GD / 2 + 0.4);
    k.box(GW, 0.4, GD, BX, GH, BZ, concD);
    for (let x = -12; x <= 12; x += 8) for (let z = -10; z <= 10; z += 10) k.point(BX + x, GH - 1, BZ + z, 0xfff4e8, 16, 12);
    k.box(0.4, 6, 10, BX - 4, 3, BZ - 4, white); k.block(BX - 4.4, BX - 3.6, BZ - 9, BZ + 1);
    k.box(GW, 0.4, 6, BX, 5.8, BZ - GD / 2 + 3, floorC); k.box(0.1, 1.1, GW, BX, 6.5, BZ - GD / 2 + 6, glass);
    for (let i = 0; i < 16; i++) k.box(2.4, 0.36, 0.9, BX + GW / 2 - 1.5, 0.18 + i * 0.36, BZ + 4 - i * 0.9, floorC);
    k.block(BX + GW / 2 - 2.8, BX + GW / 2 - 0.3, BZ - GD / 2 + 6, BZ + 4.5);
    eyeMedallion(k, BX, 0.16, BZ + 8, 2);
    donorWall(k, BX, 3.6, BZ - GD / 2 + 0.22, 0, 9, true);
    wordmarkRelief(k, BX, 8.6, BZ - GD / 2 + 0.24, 0, 5);
    k.prop('museum_bench', BX + 6, 0.15, BZ + 2, { height: 0.58, keepOut: 1.4 }); k.prop('bronze_figure', BX + 8, 0.15, BZ - 8, { height: 3, keepOut: 1.2 });
    k.crowd([v(-60, 0, 14), v(-20, 0, 14), v(20, 0, 14), v(60, 0, 14)], 30, { seed: 133, speed: 0.9, spread: 3, animate: !ctx.reduced, colors: [0xf08a2a, 0xf1c531, 0x3aa06a, 0xe83a3a, 0x24262c, 0xf4f0e8, 0x8a3ad8] });
    k.crowd([v(BX - 10, 0.15, BZ + 10), v(BX + 4, 0.15, BZ), v(BX - 8, 0.15, BZ - 10)], 12, { seed: 134, speed: 0.3, spread: 2, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da, 0xf08a2a] });
    k.crowd([v(BX - 12, 1.2, BZ + BD / 2 + 3), v(BX + 12, 1.8, BZ + BD / 2 + 4.6)], 12, { seed: 135, speed: 0.05, spread: 1.4, animate: !ctx.reduced });
    k.censusWall({ x: BX - GW / 2 + 0.22, y: 5.6, z: BZ + 4, rotY: PI / 2, cols: 30, rows: 6, tile: 0.55, gap: 0.05, start: ctx.wallStart(2000, 180), pieces: ctx.all, backing: dark });
    // the works: the tall gallery walls, the free wall, the mezzanine, the street facing bleacher wall
    const mounts: Mount[] = [];
    for (let i = 0; i < 3; i++) { const z = BZ - 8 + i * 8; mounts.push({ position: v(BX + GW / 2 - 0.22, 3.6, z), rotation: -PI / 2, target: v(BX, 3, z), width: 4.6, height: 2.7, style: 'white', wash: true }); }
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const z = BZ - 6 + i * 5; mounts.push({ position: v(BX - 4 + s * 0.22, 3.2, z), rotation: s < 0 ? -PI / 2 : PI / 2, target: v(BX - 4 + s * 6, 3, z), width: 4.0, height: 2.4, style: 'white', wash: true }); }
    for (const x of [-10, -3, 4, 11]) mounts.push({ position: v(BX + x, 3.4, BZ - GD / 2 + 0.22), rotation: 0, target: v(BX + x, 3, BZ), width: 4.4, height: 2.6, style: 'white', wash: true });
    for (const x of [-10, 0, 10]) mounts.push({ position: v(BX + x, 8.4, BZ - GD / 2 + 0.22), rotation: 0, target: v(BX + x, 7.5, BZ - 4), width: 4.4, height: 2.4, style: 'white', wash: false });
    for (let i = 0; i < 4; i++) { const x = -60 + i * 24 + 12; k.box(0.3, 3.2, 4.6, 0, 0, 0, dark).position.set(x, 2.2, 28.8); mounts.push({ position: v(x, 2.3, 28.62), rotation: PI, target: v(x, 2.5, 20), width: 4.2, height: 2.5, style: 'black', wash: false }); }
    return { mounts, spawn: v(0, 3, 26), look: v(BX, 12, BZ), eye: 3, bounds: [BX - GW / 2 + 0.8, 70, BZ - GD / 2 + 1, 36], style: 'white', floorY: (x, z) => { if (x > BX + GW / 2 - 2.8 && x < BX + GW / 2 - 0.3 && z < BZ + 4.5 && z > BZ - 10) return Math.min(5.7, ((BZ + 4.5 - z) / 14.4) * 5.7); if (z > BZ - GD / 2 && z < BZ - GD / 2 + 6 && x > BX - GW / 2 && x < BX + GW / 2) return 6; if (Math.abs(x - BX) < BW / 2 - 2 && z > BZ + BD / 2 + 0.4 && z < BZ + BD / 2 + 7.6) return 0.5 + Math.floor((z - (BZ + BD / 2 + 0.4)) / 1.2) * 0.5; return 0; } };
  },
};

/* ---------------- 100 EL MUSEO DEL BARRIO ---------------- */
export const elmuseo: RoomDef = {
  id: 'elmuseo',
  name: 'The courtyard on Fifth',
  area: 'EL MUSEO DEL BARRIO',
  mood: 'Three Kings Day',
  color: '#e8a030',
  description: 'Fifth Avenue at 104th, the Heckscher building\'s courtyard with its fountain and the bandstand, the galleries behind their arches, the parade of camels and kings passing on the avenue, the works in colour.',
  signatures: 'The red brick and limestone building with its arcaded ground floor, the courtyard with a fountain and palms, the ornate theater doors, the Three Kings Day parade with puppets, camels and the paper crowns, the park across the avenue.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad8, horizon: 0xeef0ec, ground: 0x6a6a66, fog: 0.002, sun: { az: 3.2, el: 0.6, color: 0xfff6e8, size: 12 }, env: 1.0 });
    k.hemi(0xf2f6ff, 0x5a5a58, 0.9);
    k.sun(0xfff2dc, 2.2, 30, 70, 40, true, 90);
    const brick = k.pbr('emBrick', X.brick(0x8a4a3a, 308), 0.28), lime = k.pbr('emLime', X.ashlar(0xd8d0bc, 309, 4), 0.25), floorT = k.pbr('emFloor', X.terrazzo(0xc8b8a0, 167), 0.4, { roughness: 0.4 }),
      dark = k.flat(0x1a1c20, 0.5, 0.6), glass = k.glass(0xdcecf6, 0.14, 0.04), gold = k.pbr('emGold', X.gilt(0xd0a852), 2, { metalness: 0.85, roughness: 0.3 }), waterM = k.flat(0x88aacc, 0.3, 0.2, { transparent: true, opacity: 0.6 }),
      pinkW = k.pbr('emPink', X.plaster(0xd85a7a, 168), 0.4, { roughness: 0.9 }), yellowW = k.pbr('emYellow', X.plaster(0xe8b040, 169), 0.4, { roughness: 0.9 }), tealW = k.pbr('emTeal', X.plaster(0x2a8a8a, 170), 0.4, { roughness: 0.9 }), white = k.flat(0xf4f0e8, 0, 0.7);
    street(k, { w: 24, len: 160, z: 40, x: 0 });
    k.box(160, 0.4, 200, 100, -0.2, 0, k.pbr('emLawn', X.grass(0x4a6a3a, 171), 0.06)); k.rail(18, 0, 160, dark, 1.0, 'z', 2.4); k.block(17.6, 18.4, -80, 80);
    const rnd = X.mulberry(100); for (let i = 0; i < 30; i++) k.tree(24 + rnd() * 60, 0, -80 + rnd() * 160, { kind: 'bare', h: 8 + rnd() * 6, r: 3 + rnd() * 2, seed: i });
    // the building around its courtyard: arcaded ground floor, the theater doors, the fountain, palms
    const BX = -34, BZ = 0, BW = 44, CW = 20;
    for (const [x, z, w, d] of [[BX, BZ - BW / 2 + 6, BW, 12], [BX - BW / 2 + 6, BZ, 12, BW - 24], [BX, BZ + BW / 2 - 6, BW, 12]]) k.box(w, 18, d, x, 9, z, brick);
    k.box(BW + 0.4, 3, BW + 0.4, BX, 1.5, BZ, lime); k.box(BW + 0.4, 1.0, BW + 0.4, BX, 17.6, BZ, lime);
    for (let i = 0; i < 5; i++) { const z = BZ - 16 + i * 8; k.arch(2.6, 4.4, 1.4, BX + BW / 2, 0, z, lime, false, 0.8).rotation.y = PI / 2; k.box(0.1, 3.6, 2.2, BX + BW / 2 - 0.2, 2.2, z, glass); }
    k.block(BX + BW / 2 - 1, BX + BW / 2 + 1, BZ - BW / 2, BZ - 1.4); k.block(BX + BW / 2 - 1, BX + BW / 2 + 1, BZ + 1.4, BZ + BW / 2);
    for (let f = 1; f < 4; f++) for (let i = 0; i < 9; i++) { const y = 5.6 + f * 3.6, z = BZ - 20 + i * 5; k.box(0.16, 2.4, 1.6, BX + BW / 2 + 0.02, y, z, lime); k.box(0.06, 2.0, 1.2, BX + BW / 2 + 0.1, y, z, glass); }
    k.sign('EL MUSEO DEL BARRIO', 8, 0.8, BX + BW / 2 + 0.06, 6.4, BZ, 'transparent', '#3a3020', 80, PI / 2);
    mlowBanner(k, BX + BW / 2 + 0.5, 12, BZ - 12, PI / 2, 3.0, true); blossomFlag(k, BX + BW / 2 + 0.5, 12, BZ + 12, PI / 2, 2.6, 5, 'electric');
    k.box(CW, 0.3, CW, BX, 0.15, BZ, floorT);
    k.mesh(new T.CylinderGeometry(3, 3.2, 0.8, 32), lime, BX, 0.4, BZ); k.mesh(new T.CylinderGeometry(2.6, 2.6, 0.2, 32), waterM, BX, 0.85, BZ); k.keepOut.push({ x: BX, z: BZ, r: 3.4 });
    const j = k.mesh(new T.CylinderGeometry(0.08, 0.2, 3, 6), waterM, BX, 2.2, BZ, true); if (!ctx.reduced) k.ticks.push((t) => { j.scale.y = 0.7 + 0.3 * Math.sin(t * 1.6); });
    for (const [x, z] of [[BX - 7, BZ - 7], [BX + 7, BZ - 7], [BX - 7, BZ + 7], [BX + 7, BZ + 7]]) k.prop('palm_urn', x, 0.15, z, { height: 3.6, keepOut: 1.2 });
    for (const s of [-1, 1]) { const w = k.box(0.4, 8, CW, BX + s * CW / 2, 4, BZ, s < 0 ? pinkW : yellowW); void w; k.block(BX + s * CW / 2 - 0.4, BX + s * CW / 2 + 0.4, BZ - CW / 2, BZ + CW / 2); }
    k.box(CW, 8, 0.4, BX, 4, BZ - CW / 2, tealW); k.block(BX - CW / 2, BX - 1.8, BZ - CW / 2 - 0.4, BZ - CW / 2 + 0.4); k.block(BX + 1.8, BX + CW / 2, BZ - CW / 2 - 0.4, BZ - CW / 2 + 0.4);
    k.box(3.6, 5, 0.6, BX, 2.5, BZ - CW / 2 + 0.4, gold); k.arch(2.2, 4, 0.8, BX, 0, BZ - CW / 2 + 0.4, gold, false, 0.85);
    k.box(CW, 8, 0.4, BX, 4, BZ + CW / 2, pinkW); k.block(BX - CW / 2, BX + CW / 2, BZ + CW / 2 - 0.4, BZ + CW / 2 + 0.4);
    k.block(BX - CW / 2 - 4, BX - CW / 2 - 3, BZ - CW / 2, BZ + CW / 2);
    eyeMedallion(k, BX, 0.16, BZ + 7, 1.6);
    donorWall(k, BX, 6.4, BZ - CW / 2 + 0.22, 0, 9, false);
    // the parade on the avenue: three kings on camels, puppets, the paper crowns
    const camel = (x: number, z: number, i: number) => { const g = new T.Group(); const body = new T.Mesh(new T.SphereGeometry(1, 16, 10), k.flat(0xc8a878, 0, 0.8)); body.scale.set(0.7, 0.8, 1.4); body.position.y = 1.8; g.add(body); const hump = new T.Mesh(new T.SphereGeometry(0.6, 12, 8), k.flat(0xc8a878, 0, 0.8)); hump.position.set(0, 2.5, -0.2); g.add(hump); const neck = new T.Mesh(new T.CylinderGeometry(0.22, 0.3, 1.8, 8), k.flat(0xc8a878, 0, 0.8)); neck.position.set(0, 2.6, 1.3); neck.rotation.x = -0.5; g.add(neck); const head = new T.Mesh(new T.BoxGeometry(0.4, 0.4, 0.7), k.flat(0xc8a878, 0, 0.8)); head.position.set(0, 3.4, 1.9); g.add(head); for (const sx of [-1, 1]) for (const sz of [-0.8, 0.8]) { const leg = new T.Mesh(new T.CylinderGeometry(0.1, 0.12, 1.8, 6), k.flat(0xb89868, 0, 0.8)); leg.position.set(sx * 0.4, 0.9, sz); g.add(leg); } const king = new T.Mesh(new T.CapsuleGeometry(0.28, 0.9, 3, 8), k.flat([0x8a3ad8, 0xe83a3a, 0x3aa06a][i], 0, 0.8)); king.position.set(0, 3.2, -0.6); g.add(king); const crown = new T.Mesh(new T.CylinderGeometry(0.22, 0.2, 0.3, 8), k.pbr('emGold', X.gilt(0xd0a852), 2)); crown.position.set(0, 4.0, -0.6); g.add(crown); g.position.set(x, 0, z); k.add(g); return g; };
    const kings = [camel(-4, -50, 0), camel(0, -58, 1), camel(4, -66, 2)];
    if (!ctx.reduced) k.ticks.push((t, dt) => kings.forEach((g, i) => { g.position.z += 1.0 * Math.min(dt, 0.1); if (g.position.z > 80) g.position.z = -80; g.position.y = 0.1 * Math.abs(Math.sin(t * 3 + i)); }));
    k.crowd([v(-6, 0, -80), v(-6, 0, 80)], 30, { seed: 136, speed: 1.0, spread: 2, animate: !ctx.reduced, colors: [0xf08a2a, 0xf1c531, 0x3aa06a, 0xe83a3a, 0x8a3ad8, 0xf4f0e8] });
    k.crowd([v(6, 0, -80), v(6, 0, 80)], 30, { seed: 137, speed: 1.0, spread: 2, animate: !ctx.reduced, colors: [0xf08a2a, 0xf1c531, 0x3aa06a, 0xe83a3a, 0x8a3ad8, 0xf4f0e8] });
    for (let i = 0; i < 20; i++) { const x = -60 + rnd() * 100, z = -70 + rnd() * 140; if (Math.abs(x) < 14 || (x < BX + BW / 2 + 2 && x > BX - BW / 2 - 2)) continue; void x; void z; }
    k.crowd([v(BX + 4, 0.15, BZ + 6), v(BX - 6, 0.15, BZ - 6), v(BX + 6, 0.15, BZ - 6)], 10, { seed: 138, speed: 0.3, spread: 1.6, animate: !ctx.reduced, colors: [0xf08a2a, 0xf1c531, 0x24262c, 0xf4f0e8] });
    k.censusWall({ x: BX - CW / 2 + 0.22, y: 4.4, z: BZ, rotY: PI / 2, cols: 24, rows: 5, tile: 0.5, gap: 0.05, start: ctx.wallStart(3200, 120), pieces: ctx.all, backing: dark });
    // the works: the coloured courtyard walls in white frames, the arcade piers on the avenue, the theater flank
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = BZ - 6 + i * 6; mounts.push({ position: v(BX + s * (CW / 2 - 0.22), 3.4, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(BX, 3, z), width: 4.2, height: 2.6, style: 'white', wash: true }); }
    for (const x of [-7, 7]) mounts.push({ position: v(BX + x, 3.4, BZ - CW / 2 + 0.22), rotation: 0, target: v(BX + x, 3, BZ), width: 4.2, height: 2.6, style: 'white', wash: true });
    for (const x of [-7, 0, 7]) mounts.push({ position: v(BX + x, 3.4, BZ + CW / 2 - 0.22), rotation: PI, target: v(BX + x, 3, BZ), width: 4.2, height: 2.6, style: 'white', wash: true });
    for (let i = 0; i < 4; i++) { const z = BZ - 12 + i * 8; if (Math.abs(z) < 3) continue; mounts.push({ position: v(BX + BW / 2 + 0.22, 3.0, z), rotation: -PI / 2 + PI, target: v(BX + BW / 2 + 8, 2.6, z), width: 2.6, height: 2.6, style: 'black', wash: false }); }
    for (let i = 0; i < 3; i++) { const z = -40 + i * 40; k.box(0.3, 3, 4.6, 18.4, 1.9, z, dark); mounts.push({ position: v(18.2, 2.0, z), rotation: PI / 2, target: v(8, 2, z), width: 4.2, height: 2.5, style: 'black', wash: false }); }
    return { mounts, spawn: v(2, 3, 20), look: v(BX + BW / 2, 8, BZ), eye: 3, bounds: [BX - CW / 2 + 0.8, 60, -80, 80], style: 'white' };
  },
};

/* ---------------- 101 THE MUSEUM OF THE CITY OF NEW YORK ---------------- */
export const mcny: RoomDef = {
  id: 'mcny',
  name: 'The city\'s museum',
  area: 'MUSEUM OF THE CITY OF NEW YORK',
  mood: 'Museum Mile, the top of the mile',
  color: '#b8a8a0',
  description: 'The red brick Georgian building at 103rd, the marble rotunda with its twin curving stairs, the timeline gallery, the works telling the city\'s own story.',
  signatures: 'The Colonial Revival red brick and marble front with its portico and cupola, the entrance rotunda with two sweeping marble staircases, the New York at its core gallery with its wall of screens, the terrace on Fifth.',
  build(k, ctx) {
    k.sky({ top: 0x7fa0d0, horizon: 0xe8e8e0, ground: 0x5a5a55, fog: 0.0022, sun: { az: 3.4, el: 0.7, color: 0xfff4e6, size: 12 }, env: 0.9 });
    k.hemi(0xfff0dc, 0x4a4038, 0.7);
    k.sun(0xfff0d8, 1.8, 30, 60, 40, true, 70);
    const brick = k.pbr('mcBrick', X.brick(0x8a3a2e, 310), 0.28), marble = k.pbr('mcMarble', X.marble(0xe8e4dc, 0x9a948a, 21), 0.5, { roughness: 0.3 }), lime = k.pbr('mcLime', X.ashlar(0xd8d0bc, 311, 4), 0.25),
      floorT = k.pbr('mcFloor', X.terrazzo(0xc8c0b0, 172), 0.4, { roughness: 0.3 }), dark = k.flat(0x1a1c20, 0.5, 0.6), glass = k.glass(0xdcecf6, 0.14, 0.04), bronze = k.flat(0x4a3a28, 0.8, 0.4), screen = k.glow(0x3a6aff, 0.8), white = k.pbr('mcWhite', X.plaster(0xf4f4f2, 173), 0.4);
    street(k, { w: 24, len: 160, z: 40, x: 0 });
    k.box(160, 0.4, 200, 100, -0.2, 0, k.pbr('mcLawn', X.grass(0x3a5a2a, 174), 0.06)); k.rail(18, 0, 160, dark, 1.0, 'z', 2.4); k.block(17.6, 18.4, -80, 80);
    const rnd = X.mulberry(101); for (let i = 0; i < 30; i++) k.tree(24 + rnd() * 60, 0, -80 + rnd() * 160, { kind: 'round', h: 8 + rnd() * 6, r: 3 + rnd() * 2, leaf: 0x4a7a3c, seed: i });
    const BX = -30, BZ = 0, BW = 34, BD = 40;
    k.box(BW, 16, BD, BX, 8, BZ, brick);
    k.box(BW + 0.4, 2, BD + 0.4, BX, 1, BZ, marble); k.box(BW + 0.6, 1.2, BD + 0.6, BX, 15.6, BZ, marble);
    k.box(10, 8, 6, BX + BW / 2 - 1, 4, BZ, marble); for (let i = 0; i < 4; i++) k.column(BX + BW / 2 + 2.4, 0.1, BZ - 4.5 + i * 3, 6, 0.6, marble, true); k.box(8, 1.4, 8, BX + BW / 2 + 0.8, 6.9, BZ, marble);
    const ped = new T.Shape(); ped.moveTo(-4, 0); ped.lineTo(4, 0); ped.lineTo(0, 2); ped.closePath(); k.mesh(new T.ExtrudeGeometry(ped, { depth: 6 }), marble, BX + BW / 2 + 3.4, 7.6, BZ - 3).rotation.y = PI / 2;
    k.cyl(2.4, 4, BX, 18, BZ, marble, 2.4, 12); k.mesh(new T.SphereGeometry(2.6, 16, 10, 0, PI * 2, 0, PI / 2), k.pbr('mcCopper', X.patina(0x5f9a8c), 0.6), BX, 20, BZ);
    for (let f = 0; f < 3; f++) for (let i = 0; i < 7; i++) { const y = 4 + f * 4.2, z = BZ - 15 + i * 5; if (Math.abs(z) < 3.5 && f === 0) continue; k.box(0.16, 2.6, 1.6, BX + BW / 2 + 0.02, y, z, lime); k.box(0.06, 2.2, 1.2, BX + BW / 2 + 0.1, y, z, glass); }
    k.arch(2.4, 4.2, 1.4, BX + BW / 2 + 0.2, 0, BZ, marble, false, 0.85).rotation.y = PI / 2;
    k.block(BX + BW / 2 - 0.6, BX + BW / 2 + 1.6, BZ - BD / 2, BZ - 1.4); k.block(BX + BW / 2 - 0.6, BX + BW / 2 + 1.6, BZ + 1.4, BZ + BD / 2);
    for (let i = 0; i < 8; i++) k.box(10, 0.3, 1.0, BX + BW / 2 + 4.4, 0.15 + i * 0.3, BZ - 5 + i * 0 + 0, marble), void i;
    for (let i = 0; i < 8; i++) k.box(1.0, 0.3, 10, BX + BW / 2 + 3 + i * 1.0, 0.15 + (7 - i) * 0.3, BZ, marble);
    k.sign('MUSEUM OF THE CITY OF NEW YORK', 9, 0.7, BX + BW / 2 + 4.06, 6.2, BZ, 'transparent', '#3a3020', 70, PI / 2);
    mlowBanner(k, BX + BW / 2 + 0.5, 11, BZ - 12, PI / 2, 3.0, true); blossomFlag(k, BX + BW / 2 + 0.5, 11, BZ + 12, PI / 2, 2.6, 1, 'cloud');
    // the rotunda: two curving marble stairs meeting at the mezzanine, the timeline gallery beyond with its wall of screens
    const RW = BW - 1.2, RD = 20;
    k.box(RW, 0.3, RD, BX, 0.15, BZ, floorT);
    k.block(BX - RW / 2 - 0.6, BX - RW / 2 + 0.2, BZ - RD / 2, BZ + RD / 2);
    k.box(RW, 0.4, RD, BX, 12, BZ, white);
    k.mesh(new T.SphereGeometry(8, 32, 12, 0, PI * 2, 0, PI / 2), k.pbr('mcDome', X.plaster(0xe8e2d4, 175), 0.3, { side: T.BackSide }), BX, 11.8, BZ).scale.y = 0.5;
    k.point(BX, 9, BZ, 0xfff4e6, 60, 30);
    for (const s of [-1, 1]) { const arc: T.Vector3[] = []; for (let i = 0; i <= 40; i++) { const t = i / 40; const a = PI / 2 + s * t * PI * 0.5; arc.push(v(BX - 2 + Math.cos(a) * 8, 0.2 + t * 5.4, BZ + Math.sin(a) * 8 * s * s)); } const sp = k.spline(arc, false, 0.5); const pts = sp.getSpacedPoints(60); const tg = new T.BoxGeometry(2.2, 0.14, 0.32), tm: T.Matrix4[] = []; const tan = new T.Vector3(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0); for (let i = 0; i < 60; i++) { const p = pts[i]; sp.getTangentAt(i / 60, tan); q.setFromAxisAngle(up, Math.atan2(tan.x, tan.z)); tm.push(new T.Matrix4().compose(p.clone().add(v(0, -0.15, 0)), q, new T.Vector3(1, 1, 1))); } k.instances(tg, marble, tm); k.curve(pts.filter((_, i) => i % 2 === 0).map((p) => v(BX - 2 + (p.x - BX + 2) * 1.14, p.y + 0.95, BZ + (p.z - BZ) * 1.14)), 0.035, bronze, 30); }
    k.box(RW - 4, 0.4, 6, BX - 4, 5.6, BZ, marble); k.block(BX - RW / 2, BX + RW / 2 - 4, BZ - 3, BZ + 3);
    k.prop('balustrade', BX - 4, 5.8, BZ + 3.1, { height: 1.0 }); k.prop('balustrade', BX - 4, 5.8, BZ - 3.1, { height: 1.0 });
    eyeMedallion(k, BX + 6, 0.16, BZ, 2.4);
    donorWall(k, BX, 8.4, BZ - RD / 2 + 0.36, 0, 9, false);
    const TZ = BZ - RD / 2 - 8;
    k.box(RW, 0.3, 14, BX, 0.15, TZ, floorT); k.block(BX - RW / 2 - 0.6, BX - RW / 2 + 0.2, TZ - 7, TZ + 7); k.block(BX - RW / 2, BX + RW / 2, TZ - 7.6, TZ - 6.8);
    k.box(RW, 0.4, 14, BX, 6, TZ, dark);
    for (let i = 0; i < 10; i++) { const s = k.mesh(new T.PlaneGeometry(2.6, 1.5), screen, BX - 13.5 + i * 3, 3.4, TZ - 6.6); void s; }
    for (let i = 0; i < 10; i++) k.point(BX - 13.5 + i * 3, 5, TZ - 5, 0x3a6aff, 4, 5);
    k.censusWall({ x: BX, y: 3.4, z: TZ - 6.62, rotY: 0, cols: 40, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(0, 160), pieces: ctx.all, backing: dark });
    k.prop('vitrine', BX - 8, 0.15, TZ, { height: 1.7, keepOut: 1.2 }); k.prop('vitrine', BX + 8, 0.15, TZ, { height: 1.7, keepOut: 1.2 }); k.prop('globe_stand', BX, 0.15, TZ + 4, { height: 2, keepOut: 1 });
    k.crowd([v(-4, 0, 20), v(BX + 12, 0.15, BZ + 4), v(BX - 4, 0.15, BZ + 6), v(BX - 10, 0.15, TZ)], 14, { seed: 139, speed: 0.35, spread: 2, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a] });
    // the works: the rotunda walls under the stairs, the mezzanine, the timeline gallery's side walls
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const x = BX - 8 + i * 6; mounts.push({ position: v(x, 3.0, BZ + s * (RD / 2 - 0.36)), rotation: s > 0 ? PI : 0, target: v(x, 2.6, BZ), width: 3.6, height: 2.2, style: 'gilt', wash: true }); }
    for (const x of [-8, 0]) mounts.push({ position: v(BX + x, 8.4 + 0, BZ - RD / 2 + 0.36), rotation: 0, target: v(BX + x, 7, BZ), width: 3.6, height: 2.2, style: 'gilt', wash: false });
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const z = TZ - 3 + i * 6; mounts.push({ position: v(BX + s * (RW / 2 - 0.36), 3.2, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(BX, 2.6, z), width: 4.2, height: 2.6, style: 'black', wash: true }); }
    for (const x of [-12, 12]) mounts.push({ position: v(x + BX, 8.6, BZ - RD / 2 + 0.36), rotation: 0, target: v(x + BX, 7, BZ), width: 3.6, height: 2.2, style: 'gilt', wash: false });
    for (let i = 0; i < 3; i++) { const z = -30 + i * 30; k.box(0.3, 3, 4.6, 18.4, 1.9, z, dark); mounts.push({ position: v(18.2, 2.0, z), rotation: PI / 2, target: v(8, 2, z), width: 4.2, height: 2.5, style: 'black', wash: false }); }
    return { mounts, spawn: v(2, 3, 18), look: v(BX + BW / 2, 10, BZ), eye: 3, bounds: [BX - RW / 2 + 0.8, 40, TZ - 6.6, 60], style: 'gilt', floorY: (x, z) => { const dx = x - (BX - 2), dz = z - BZ; const d = Math.hypot(dx, dz); if (d > 6.6 && d < 9.4 && dx < 0.5) { const a = Math.atan2(Math.abs(dz), dx); const t = Math.min(1, Math.max(0, (a - PI / 2) / (PI * 0.5))); return 0.2 + t * 5.4; } if (Math.abs(dz) < 3 && x < BX + RW / 2 - 4 && x > BX - RW / 2 && x < BX - 2) return 5.8; return 0; } };
  },
};
