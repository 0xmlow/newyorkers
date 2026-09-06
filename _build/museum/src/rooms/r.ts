/* Rooms 82 to 86: the Met's Great Hall, the American Wing court, the European paintings suite, the Hall of Ocean Life, the Rose Center.
   Fifth set: the institutions. Museum light, the institution kit from Blender, the MLow and Blossom brand layer, every room fresh. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront } from './f';
import { mlowBanner, blossomFlag, donorWall, eyeMedallion, wordmarkRelief, eyeMonument, INK, CLOUD, ELECTRIC } from './brand';

const PI = Math.PI;

/* ---------------- 82 THE GREAT HALL ---------------- */
export const metgreathall: RoomDef = {
  id: 'metgreathall',
  name: 'The Great Hall',
  area: 'THE MET',
  mood: 'Saturday at opening',
  color: '#d8c8a8',
  description: 'Fifth Avenue steps under the MLow banners, then the Great Hall: three domes on their arches, the flower urns, the grand staircase rising to the paintings, the works on the limestone.',
  signatures: 'The Beaux Arts facade with its paired columns and the banners between them, the broad steps and fountains, the vaulted Great Hall with three saucer domes and oculi, the information desk and the five great flower arrangements, the grand staircase.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad8, horizon: 0xeef0ec, ground: 0x6a6a66, fog: 0.0018, sun: { az: 2.9, el: 0.8, color: 0xfff6e8, size: 12 }, env: 1.0 });
    k.hemi(0xf2f6ff, 0x5a5a58, 0.9);
    k.sun(0xfff2dc, 2.4, 40, 80, 40, true, 120);
    const lime = k.pbr('metLime', X.ashlar(0xd8d0bc, 251, 4), 0.25),
      limeD = k.pbr('metLimeD', X.ashlar(0xc0b8a4, 252, 3), 0.25),
      floorM = k.pbr('metFloor', X.terrazzo(0xc8c0b0, 117), 0.4, { roughness: 0.3 }),
      plaster = k.pbr('metDome', X.plaster(0xe8e2d4, 118), 0.3, { side: T.BackSide }),
      marbleS = k.pbr('metStair', X.marble(0xe0dcd2, 0xa09a90, 16), 0.5, { roughness: 0.3 }),
      bronze = k.flat(0x4a3a28, 0.8, 0.4),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      waterM = k.flat(0x88aacc, 0.3, 0.2, { transparent: true, opacity: 0.6 });
    // Fifth Avenue, the plaza with its fountains, the facade with paired columns and the banners
    street(k, { w: 26, len: 200, z: 44, x: 0 });
    blockFront(k, { x: 60, z0: 130, count: 14, face: -1, seed: 253, h: [20, 40] });
    k.box(120, 0.3, 30, 0, 0.05, 26, k.pbr('metPlaza', X.pavers(0x9a9a94, 119), 0.4));
    for (const x of [-38, 38]) { k.mesh(new T.CylinderGeometry(6, 6.4, 0.8, 32), lime, x, 0.4, 28); k.mesh(new T.CylinderGeometry(5.4, 5.4, 0.3, 32), waterM, x, 0.85, 28); k.keepOut.push({ x, z: 28, r: 6.6 }); const jets: T.Mesh[] = []; for (let i = 0; i < 10; i++) { const a = (i / 10) * PI * 2; jets.push(k.mesh(new T.CylinderGeometry(0.05, 0.14, 3, 6), waterM, x + Math.cos(a) * 3, 2.4, 28 + Math.sin(a) * 3, true)); } if (!ctx.reduced) k.ticks.push((t) => jets.forEach((j, i) => { j.scale.y = 0.6 + 0.4 * Math.sin(t * 1.4 + i); })); }
    const FZ = 10, FW = 110, FH = 26;
    k.box(FW, FH, 60, 0, FH / 2, FZ - 30, lime);
    k.moulding([[0, 0], [1.2, 0], [1.3, 0.4], [0.8, 0.6], [1.0, 1.0], [0, 1.2]], FW + 0.4, 0, FH - 0.6, FZ + 0.05, limeD, 0);
    for (let i = 0; i < 12; i++) k.box(FW + 4, 0.34, 1.6, 0, 0.17 + i * 0.34, FZ + 2 + i * 1.6, lime);
    for (const cx of [-22, -14, 14, 22, -38, 38]) { k.column(cx, 4, FZ + 1.4, 16, 1.1, lime, true); k.prop('corinthian_capital', cx, 20, FZ + 1.4, { height: 2.2 }); }
    for (const s of [-1, 1]) { k.box(14, 6, 3, s * 30, 23, FZ + 1.5, lime); k.box(2.6, 4, 2.6, s * 30, 13, FZ + 2.4, lime); }
    for (const x of [-18, 0, 18]) { k.arch(6, 12, 4, x, 4, FZ + 0.4, limeD, false, 0.82); k.box(5.2, 9.6, 0.2, x, 9.6, FZ + 0.6, k.glass(0xdcecf6, 0.14, 0.04)); }
    k.block(-FW / 2, -3, FZ - 0.5, FZ + 1); k.block(3, FW / 2, FZ - 0.5, FZ + 1);
    k.box(6.4, 0.3, 6, 0, 4.05, FZ + 3, lime);
    // the brand layer on the facade: banners between the columns, the MLow banner centre, Blossom flags either side
    mlowBanner(k, 0, 13, FZ + 2.6, 0, 4.6, true);
    blossomFlag(k, -18, 13, FZ + 2.6, 0, 3.4, 5, 'electric');
    blossomFlag(k, 18, 13, FZ + 2.6, 0, 3.4, 1, 'ink');
    k.sign('THE MUSEUM  ·  THE NEW YORKERS  ·  THROUGH THE WINTER', 20, 1.0, 0, 24.2, FZ + 1.6, 'transparent', '#3a3020', 80, 0);
    // the Great Hall: a long room with three saucer domes on arches, the oculi, the desk, the urns of flowers
    const HW = 70, HD = 30, HH = 22, HZ = FZ - HD / 2 - 1;
    k.box(HW, 0.3, HD, 0, 4.15, HZ, floorM);
    for (const s of [-1, 1]) { k.box(0.8, HH, HD, s * HW / 2, 4 + HH / 2, HZ, lime); k.block(s * HW / 2 - 0.7, s * HW / 2 + 0.7, HZ - HD / 2, HZ + HD / 2); }
    k.box(HW, HH, 0.8, 0, 4 + HH / 2, HZ - HD / 2, lime);
    k.block(-HW / 2, -3, HZ - HD / 2 - 0.6, HZ - HD / 2 + 0.6); k.block(3, HW / 2, HZ - HD / 2 - 0.6, HZ - HD / 2 + 0.6);
    k.box(HW + 2, 0.6, HD + 2, 0, 4 + HH + 3, HZ, dark);
    for (const dx of [-23, 0, 23]) {
      const dome = k.mesh(new T.SphereGeometry(11, 32, 12, 0, PI * 2, 0, PI / 2), plaster, dx, 4 + HH - 4, HZ); dome.scale.y = 0.6;
      k.torus(2.4, 0.3, dx, 4 + HH + 2.4, HZ, limeD, 32).rotation.x = PI / 2;
      k.mesh(new T.CircleGeometry(2.2, 24), k.glow(0xfff4e0, 0.9), dx, 4 + HH + 2.5, HZ).rotation.x = PI / 2;
      k.point(dx, 4 + HH - 6, HZ, 0xfff4e6, 90, 40);
      for (const s of [-1, 1]) { k.arch(10, 14, 1.6, dx, 4, HZ + s * (HD / 2 - 0.8), limeD, false, 0.8); }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { k.column(dx + sx * 9.5, 4.3, HZ + sz * 11.5, 12, 0.9, lime, true); k.prop('corinthian_capital', dx + sx * 9.5, 16.3, HZ + sz * 11.5, { height: 1.8 }); k.keepOut.push({ x: dx + sx * 9.5, z: HZ + sz * 11.5, r: 1.2 }); }
      k.prop('newel_urn', dx, 4.3, HZ, { height: 2.2, keepOut: 1.2 });
      for (let i = 0; i < 26; i++) { const a = (i / 26) * PI * 2, rr = 0.5 + (i % 3) * 0.2; k.sphere(0.16, dx + Math.cos(a) * rr, 6.5 + (i % 4) * 0.28, HZ + Math.sin(a) * rr, [k.flat(0xf1c531, 0, 0.8), k.flat(0xe8e2f0, 0, 0.8), k.flat(0xd83a6a, 0, 0.8)][i % 3], 6); }
    }
    k.mesh(new T.CylinderGeometry(4, 4, 1.1, 32, 1, true), k.pbr('metDesk', X.planks(0x4a2e1c, 5, 254), 1.2), -11.5, 4.7, HZ + 6);
    k.mesh(new T.CylinderGeometry(4.2, 4.2, 0.1, 32), marbleS, -11.5, 5.3, HZ + 6); k.keepOut.push({ x: -11.5, z: HZ + 6, r: 4.5 });
    eyeMedallion(k, 0, 4.16, HZ + 8, 2.6);
    donorWall(k, 0, 9.4, HZ - HD / 2 + 0.42, 0, 12, false);
    // the grand staircase: rising from the hall's north end through the arch, MLow wordmark relief above
    const SZ = HZ - HD / 2;
    for (let i = 0; i < 26; i++) k.box(14, 0.34, 1.0, 0, 4.17 + i * 0.34, SZ - 1 - i * 1.0, marbleS);
    for (const s of [-1, 1]) k.prop('balustrade', s * 7.4, 4.2, SZ - 14, { height: 1.1, rotY: PI / 2 });
    for (const s of [-1, 1]) k.prop('newel_urn', s * 7.4, 4.2, SZ - 1.5, { height: 2.2 });
    k.box(24, 0.4, 14, 0, 13, SZ - 33, marbleS);
    k.box(30, 20, 1, 0, 23, SZ - 40, lime);
    wordmarkRelief(k, 0, 16, SZ - 39.4, 0, 8);
    k.block(-15, 15, SZ - 40.6, SZ - 39.4);
    k.block(-HW / 2, -7.6, SZ - 40, SZ); k.block(7.6, HW / 2, SZ - 40, SZ);
    k.point(0, 20, SZ - 30, 0xfff4e6, 60, 40);
    for (let i = 0; i < 4; i++) k.prop('rope_stanchion', -9 + i * 6, 4.15, HZ + 12, { height: 1.0 });
    for (const x of [-30, 30]) for (const dz of [-8, 8]) k.prop('museum_bench', x, 4.15, HZ + dz, { height: 0.58, rotY: PI / 2, keepOut: 1.4 });
    k.crowd([v(0, 0, 40), v(0, 0, FZ + 14), v(0, 4.15, FZ - 4), v(-10, 4.15, HZ), v(10, 4.15, HZ - 10), v(0, 4.15, SZ - 2)], 44, { seed: 110, speed: 0.5, spread: 3, animate: !ctx.reduced, colors: [0x24262c, 0x8a3a3a, 0x33477f, 0xd8d0c0, 0x151517, 0xc9a25a, 0xe6e2da] });
    k.censusWall({ x: HW / 2 - 0.82, y: 10, z: HZ, rotY: -PI / 2, cols: 40, rows: 8, tile: 0.55, gap: 0.05, start: ctx.wallStart(100, 320), pieces: ctx.all, backing: limeD });
    // the works: the limestone walls of the Great Hall between the arches, the stair landing, the facade niches
    const mounts: Mount[] = [];
    for (let i = 0; i < 6; i++) { const x = -29 + i * 11.6; if (Math.abs(x - 0) < 4 || Math.abs(x + 23) < 4 || Math.abs(x - 23) < 4) continue; for (const s of [-1, 1]) mounts.push({ position: v(x, 8.4, HZ + s * (HD / 2 - 0.42)), rotation: s > 0 ? PI : 0, target: v(x, 6, HZ), width: 5.2, height: 3.2, style: 'gilt', wash: true }); }
    for (const s of [-1, 1]) mounts.push({ position: v(-HW / 2 + 0.82, 9, HZ + s * 8), rotation: PI / 2, target: v(-HW / 2 + 12, 6, HZ + s * 8), width: 6, height: 3.6, style: 'gilt', wash: true });
    for (let i = 0; i < 3; i++) { const x = -8 + i * 8; mounts.push({ position: v(x, 19.5 + (i === 1 ? 4 : 0), SZ - 39.42), rotation: 0, target: v(x, 14, SZ - 28), width: 5.6, height: 3.4, style: 'gilt', wash: true }); }
    for (let i = 0; i < 4; i++) { const x = -26 + i * 17.3; if (Math.abs(x) < 6) continue; mounts.push({ position: v(x, 10, FZ + 0.42), rotation: 0, target: v(x, 6, FZ + 14), width: 4.6, height: 2.7, style: 'gilt', wash: false }); }
    return { mounts, spawn: v(0, 3, 40), look: v(0, 14, FZ), eye: 3, bounds: [-HW / 2 + 1, HW / 2 - 1, SZ - 39, 50], style: 'gilt', floorY: (x, z) => { void x; if (z > FZ + 1.5 && z < FZ + 21) return Math.min(4.1, ((FZ + 21 - z) / 19.5) * 4.1); if (z <= FZ + 1.5 && z > SZ - 1) return 4.15; if (z <= SZ - 1 && z > SZ - 27) return 4.15 + Math.min(8.8, ((SZ - 1 - z) / 26) * 8.8); if (z <= SZ - 27) return 13.2; return 0; } };
  },
};

/* ---------------- 83 THE AMERICAN WING COURT ---------------- */
export const metamerican: RoomDef = {
  id: 'metamerican',
  name: 'The Engelhard Court',
  area: 'THE MET',
  mood: 'Winter light through the wall of glass',
  color: '#c8d8c8',
  description: 'The glass roofed court on the park side: a bank facade brought indoors, the Tiffany loggia, bronzes among the plantings, the balcony, the works around the marble floor.',
  signatures: 'The sloping glass wall onto the park, the neoclassical marble bank facade standing inside, the loggia of columns with its glass mosaic, the bronze figures and fountains, the mezzanine balcony with its balustrade.',
  build(k, ctx) {
    k.sky({ top: 0x9ab0c8, horizon: 0xe8e8e4, ground: 0x6a6a68, fog: 0.002, sun: { az: 3.9, el: 0.5, color: 0xfff4e6, size: 12 }, haze: 0.4, env: 0.95 });
    k.hemi(0xeef4ff, 0x4a4a48, 0.9);
    k.sun(0xfff0dc, 2.2, -50, 60, 30, true, 90);
    const marble = k.pbr('awMarble', X.marble(0xe0dcd2, 0x9a948a, 17), 0.6, { roughness: 0.3 }),
      lime = k.pbr('awLime', X.ashlar(0xd8d0bc, 255, 4), 0.25),
      glass = k.glass(0xe8f4f8, 0.1, 0.03), steel = k.flat(0x8c98a4, 0.9, 0.3),
      dark = k.flat(0x1a1c20, 0.5, 0.6), bronze = k.flat(0x3a3028, 0.7, 0.45),
      mosaic = k.pbr('awMosaic', X.gilt(0xc9a552), 1.2, { metalness: 0.7, roughness: 0.45 }),
      snow = k.pbr('awSnow', X.plaster(0xf4f4f8, 120), 0.3), lawnG = k.pbr('awLawn', X.grass(0x4a7a3a, 121), 0.06);
    // the park side under snow, bare trees, the glass wall of the court sloping over it
    k.box(300, 0.4, 200, 0, -0.2, -140, snow);
    const rnd = X.mulberry(83);
    for (let i = 0; i < 40; i++) k.tree((rnd() - 0.5) * 240, 0, -50 - rnd() * 120, { kind: 'bare', h: 8 + rnd() * 6, r: 3 + rnd() * 2, seed: i });
    const CW = 56, CD = 44, CH = 20;
    k.box(CW, 0.4, CD, 0, -0.2, 0, marble);
    for (const s of [-1, 1]) { k.box(0.8, CH, CD, s * CW / 2, CH / 2, 0, lime); k.block(s * CW / 2 - 0.7, s * CW / 2 + 0.7, -CD / 2, CD / 2); }
    k.box(CW, CH, 0.8, 0, CH / 2, CD / 2, lime); k.block(-CW / 2, -3, CD / 2 - 0.6, CD / 2 + 0.6); k.block(3, CW / 2, CD / 2 - 0.6, CD / 2 + 0.6);
    const gw = k.mesh(new T.PlaneGeometry(CW, CH + 4), glass, 0, CH / 2 - 0.6, -CD / 2 - 1.8); gw.rotation.x = -0.2;
    for (let x = -CW / 2; x <= CW / 2; x += 3.5) { const m = k.box(0.24, CH + 4, 0.24, x, CH / 2 - 0.6, -CD / 2 - 1.8, steel); m.rotation.x = -0.2; }
    k.block(-CW / 2, CW / 2, -CD / 2 - 3, -CD / 2 - 1.2);
    k.box(CW + 2, 0.4, CD + 2, 0, CH, 0, glass); for (let x = -CW / 2; x <= CW / 2; x += 3.5) k.box(0.2, 0.3, CD + 2, x, CH + 0.1, 0, steel);
    k.point(0, CH - 4, 0, 0xffffff, 60, 40);
    // the bank facade standing inside: a marble front with Ionic columns and a pediment, the door as a gallery entrance
    const BX = 0, BZ = CD / 2 - 0.4;
    k.box(30, 15, 1.2, BX, 7.5, BZ - 0.6, marble);
    for (let i = 0; i < 6; i++) { const x = BX - 10 + i * 4; k.column(x, 0.1, BZ - 2.4, 9.6, 0.7, marble, true); k.prop('ionic_capital', x, 9.7, BZ - 2.4, { height: 1.2 }); k.keepOut.push({ x, z: BZ - 2.4, r: 1 }); }
    k.box(30, 1.6, 3.6, BX, 11.6, BZ - 1.6, marble);
    const ped = new T.Shape(); ped.moveTo(-15, 0); ped.lineTo(15, 0); ped.lineTo(0, 4); ped.closePath();
    k.mesh(new T.ExtrudeGeometry(ped, { depth: 3.6, bevelEnabled: false }), marble, BX, 12.4, BZ - 3.4);
    k.arch(3, 6, 1.4, BX, 0, BZ - 0.6, lime, false, 0.85);
    k.block(BX - 15, BX - 1.6, BZ - 1.2, BZ + 0.2); k.block(BX + 1.6, BX + 15, BZ - 1.2, BZ + 0.2);
    wordmarkRelief(k, BX, 10.2, BZ - 1.22, 0, 5);
    // the loggia on the east wall: columns with the mosaic behind, and the balcony above with balustrades
    for (let i = 0; i < 5; i++) { const z = -14 + i * 7; k.column(CW / 2 - 4, 0.1, z, 6, 0.5, lime, false); k.prop('corinthian_capital', CW / 2 - 4, 6.1, z, { height: 0.9 }); k.keepOut.push({ x: CW / 2 - 4, z, r: 0.8 }); }
    k.box(0.3, 8, 30, CW / 2 - 0.55, 4, 0, mosaic);
    k.box(6, 0.5, 30, CW / 2 - 3, 7.2, 0, lime);
    k.box(CW - 2, 0.4, 6, 0, 8.4, -CD / 2 + 4, marble); k.block(-CW / 2, CW / 2, -CD / 2 + 0.8, -CD / 2 + 7);
    for (let i = 0; i < 9; i++) k.prop('balustrade', -24 + i * 6, 8.6, -CD / 2 + 7.1, { height: 1.1 });
    for (let i = 0; i < 14; i++) k.box(3, 0.6, 1.0, -CW / 2 + 3, 0.3 + i * 0.6, -CD / 2 + 8 + i * 1.0, marble);
    // the bronzes and the plantings, the fountain, benches, the crowd
    for (const [x, z, p] of [[-12, 2, 'bronze_figure'], [12, -6, 'equestrian'], [-4, -12, 'bronze_figure'], [8, 10, 'bust_plinth']] as const) k.prop(p, x, 0, z, { height: p === 'equestrian' ? 4.2 : p === 'bust_plinth' ? 2.2 : 2.8, keepOut: 1.6 });
    for (const [x, z] of [[-20, -8], [-20, 10], [18, 12], [4, -16]]) { k.box(2.4, 0.5, 2.4, x, 0.25, z, lime); k.prop('palm_urn', x, 0.5, z, { height: 3.2, keepOut: 1.4 }); }
    k.mesh(new T.CylinderGeometry(3, 3.2, 0.7, 32), marble, 0, 0.35, -2); k.mesh(new T.CylinderGeometry(2.6, 2.6, 0.2, 32), k.flat(0x88aacc, 0.3, 0.2, { transparent: true, opacity: 0.6 }), 0, 0.75, -2); k.keepOut.push({ x: 0, z: -2, r: 3.4 });
    for (const x of [-16, 16]) k.prop('museum_bench', x, 0, 16, { height: 0.58, keepOut: 1.4 });
    blossomFlag(k, -CW / 2 + 0.72, 6, 6, PI / 2, 2.6, 7, 'cloud');
    donorWall(k, BX, 3.2, BZ - 1.22, 0, 10, false);
    k.crowd([v(-20, 0, 18), v(-8, 0, 4), v(6, 0, -8), v(20, 0, 4), v(10, 0, 18)], 22, { seed: 111, speed: 0.4, spread: 2.4, animate: !ctx.reduced, closed: true, colors: [0x24262c, 0x8a3a3a, 0x33477f, 0xd8d0c0, 0x151517] });
    k.censusWall({ x: -CW / 2 + 0.82, y: 4.4, z: 4, rotY: PI / 2, cols: 30, rows: 5, tile: 0.55, gap: 0.05, start: ctx.wallStart(900, 150), pieces: ctx.all, backing: dark });
    // the works: the west wall, the bank facade flanks, the balcony back wall, the loggia bays
    const mounts: Mount[] = [];
    for (let i = 0; i < 4; i++) { const z = -16 + i * 8; if (i === 2) continue; mounts.push({ position: v(-CW / 2 + 0.82, 4.2, z), rotation: PI / 2, target: v(-CW / 2 + 10, 3, z), width: 5.2, height: 3.0, style: 'gilt', wash: true }); }
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) mounts.push({ position: v(BX + s * (6 + i * 5.5), 5.6, BZ - 1.22), rotation: 0, target: v(BX + s * 6, 3, BZ - 12), width: 4.2, height: 2.5, style: 'gilt', wash: true });
    for (let i = 0; i < 5; i++) { const x = -20 + i * 10; mounts.push({ position: v(x, 12.4, -CD / 2 + 0.42), rotation: 0, target: v(x, 10, -CD / 2 + 8), width: 5.2, height: 3.0, style: 'gilt', wash: true }); }
    for (let i = 0; i < 4; i++) { const z = -10.5 + i * 7; mounts.push({ position: v(CW / 2 - 0.72, 3.8, z), rotation: -PI / 2, target: v(CW / 2 - 12, 3, z), width: 4.4, height: 2.6, style: 'gilt', wash: true }); }
    return { mounts, spawn: v(-4, 3, 16), look: v(0, 8, -CD / 2), eye: 3, bounds: [-CW / 2 + 1.2, CW / 2 - 1.2, -CD / 2 + 1.5, CD / 2 - 1.5], style: 'gilt', floorY: (x, z) => { if (z > -CD / 2 + 0.8 && z < -CD / 2 + 7) return 8.6; if (x < -CW / 2 + 5 && x > -CW / 2 + 1.5 && z >= -CD / 2 + 7 && z < -CD / 2 + 22) return Math.max(0, 8.6 - ((z - (-CD / 2 + 7)) / 14) * 8.6); return 0; } };
  },
};

/* ---------------- 84 THE EUROPEAN PAINTINGS ---------------- */
export const meteuropean: RoomDef = {
  id: 'meteuropean',
  name: 'The skylit suite',
  area: 'THE MET',
  mood: 'Museum daylight',
  color: '#b8a888',
  description: 'The second floor galleries in a line: skylights with their diffusers, red and grey walls, oak floors, benches in the middle, the works hung at the museum\'s own height.',
  signatures: 'The enfilade of galleries seen through aligned doorways, the coved skylights with their scrim, dark red and slate walls, herringbone oak floors, leather benches, the labels, the guards at the doors.',
  build(k, ctx) {
    k.sky({ top: 0x9ab0c8, horizon: 0xe8e8e4, ground: 0x6a6a68, fog: 0.004, env: 0.7 });
    k.hemi(0xffffff, 0x4a4a48, 0.7);
    const oak = k.pbr('epOak', X.planks(0x9a7a56, 8, 256, 0.12), 0.8, { roughness: 0.5 }),
      red = k.pbr('epRed', X.plaster(0x6a2a2e, 122), 0.4, { roughness: 0.9 }),
      slate = k.pbr('epSlate', X.plaster(0x5a6068, 123), 0.4, { roughness: 0.9 }),
      cream = k.pbr('epCream', X.plaster(0xe0d8c8, 124), 0.4, { roughness: 0.9 }),
      white = k.flat(0xf4f4f0, 0, 0.9), dark = k.flat(0x1a1c20, 0.5, 0.6),
      scrim = k.glow(0xfffaf0, 0.85), trimM = k.pbr('epTrim', X.plaster(0xf0ece4, 125), 0.5);
    const rooms = [{ w: 18, d: 22, m: red }, { w: 16, d: 18, m: slate }, { w: 20, d: 26, m: cream }, { w: 16, d: 18, m: red }, { w: 18, d: 22, m: slate }];
    let z = 0; const centres: number[] = [];
    const mounts: Mount[] = [];
    rooms.forEach((r, i) => {
      const cz = z - r.d / 2; centres.push(cz);
      k.box(r.w, 0.3, r.d, 0, 0.15, cz, oak);
      for (const s of [-1, 1]) { k.box(0.5, 9, r.d, s * r.w / 2, 4.5, cz, r.m); k.block(s * r.w / 2 - 0.5, s * r.w / 2 + 0.5, cz - r.d / 2, cz + r.d / 2); k.box(0.6, 0.6, r.d, s * (r.w / 2 - 0.05), 8.9, cz, trimM); k.box(0.6, 0.3, r.d, s * (r.w / 2 - 0.05), 0.15, cz, trimM); }
      for (const s of [-1, 1]) { const ez = cz + s * r.d / 2; const side = (r.w - 4.4) / 2; k.box(side, 9, 0.5, -(2.2 + side / 2), 4.5, ez, r.m); k.box(side, 9, 0.5, 2.2 + side / 2, 4.5, ez, r.m); k.box(4.6, 2.6, 0.5, 0, 7.7, ez, r.m); k.block(-r.w / 2, -2.2, ez - 0.4, ez + 0.4); k.block(2.2, r.w / 2, ez - 0.4, ez + 0.4); k.box(5, 0.5, 0.7, 0, 6.25, ez, trimM); k.box(0.3, 6.2, 0.7, -2.35, 3.1, ez, trimM); k.box(0.3, 6.2, 0.7, 2.35, 3.1, ez, trimM); }
      const cove = k.mesh(new T.CylinderGeometry(r.w / 2 - 1, r.w / 2 - 1, r.d - 2, 24, 1, true, 0, PI), k.pbr('epCove', X.plaster(0xf4f0e8, 126), 0.3, { side: T.BackSide }), 0, 7.6, cz); cove.rotation.set(0, 0, PI / 2); cove.rotateX(PI / 2); cove.scale.set(1, 0.45, 1); void cove;
      k.box(r.w + 1, 0.4, r.d + 1, 0, 11.4, cz, dark);
      k.mesh(new T.PlaneGeometry(r.w - 5, r.d - 5), scrim, 0, 10.6, cz).rotation.x = PI / 2;
      for (let j = 0; j < 3; j++) k.point(0, 9.4, cz - r.d / 3 + j * (r.d / 3), 0xfff8f0, 26, 16);
      k.prop('museum_bench', 0, 0.15, cz, { height: 0.58, keepOut: 1.6 });
      if (i % 2 === 0) k.prop('museum_bench', 0, 0.15, cz + (i === 2 ? 7 : 5), { height: 0.58, keepOut: 1.6 });
      // the works: three or four per long wall, one either side of each doorway
      const n = Math.floor((r.d - 4) / 5.4);
      for (const s of [-1, 1]) for (let j = 0; j < n; j++) { const wz = cz + r.d / 2 - 2.5 - (j + 0.5) * ((r.d - 5) / n) + 0; mounts.push({ position: v(s * (r.w / 2 - 0.3), 3.3, wz), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 2.6, wz), width: 4.4, height: 3.0, style: 'gilt', wash: true }); }
      for (const s of [-1, 1]) mounts.push({ position: v(s * (r.w / 4 + 1.2), 3.3, cz - r.d / 2 + 0.3), rotation: 0, target: v(s * (r.w / 4 + 1.2), 2.6, cz), width: Math.min(4.4, r.w / 2 - 4), height: 2.6, style: 'gilt', wash: true });
      z -= r.d;
    });
    const END = z;
    donorWall(k, 0, 5.4, END + 0.3, 0, 9, false);
    k.censusWall({ x: 0, y: 2.6, z: END + 0.3, rotY: 0, cols: 16, rows: 3, tile: 0.5, gap: 0.05, start: ctx.wallStart(2600, 48), pieces: ctx.all, backing: dark });
    k.box(6.8, 9, 0.5, -5.6, 4.5, 0.25, cream); k.box(6.8, 9, 0.5, 5.6, 4.5, 0.25, cream); k.box(4.6, 2.6, 0.5, 0, 7.7, 0.25, cream); k.block(-9, -2.2, -0.1, 0.5); k.block(2.2, 9, -0.1, 0.5);
    k.box(10, 0.3, 10, 0, 0.15, 5, oak); k.box(10, 9, 0.5, 0, 4.5, 10.2, cream); k.block(-5, 5, 9.8, 10.6); for (const s of [-1, 1]) { k.box(0.5, 9, 10, s * 5, 4.5, 5, cream); k.block(s * 5 - 0.4, s * 5 + 0.4, 0, 10); } k.box(10.4, 0.4, 10.4, 0, 9, 5, dark); k.point(0, 7.6, 5, 0xfff8f0, 20, 12);
    mlowBanner(k, 0, 5, 9.92, PI, 2.6, false);
    for (const cz of centres) k.crowd([v(-4, 0.15, cz + 6), v(4, 0.15, cz - 6)], 4, { seed: 112 + Math.round(cz), speed: 0.15, spread: 1.4, animate: !ctx.reduced, colors: [0x24262c, 0x151517, 0x8a3a3a, 0xd8d0c0] });
    for (const cz of centres) { k.box(0.5, 1.7, 0.4, -6, 1.0, cz + 8, dark); k.sphere(0.14, -6, 2.0, cz + 8, k.flat(0xc8a284, 0, 0.7), 8); }
    return { mounts, spawn: v(0, 3, 6), look: v(0, 3, -40), eye: 3, bounds: [-8, 8, END + 1, 9.4], style: 'gilt' };
  },
};

/* ---------------- 85 THE HALL OF OCEAN LIFE ---------------- */
export const oceanlife: RoomDef = {
  id: 'oceanlife',
  name: 'Under the whale',
  area: 'NATURAL HISTORY',
  mood: 'Deep blue afternoon',
  color: '#3a6aa8',
  description: 'The two storey hall lit like the sea floor, the blue whale hanging over everything, the dioramas glowing in the walls, the works between the windows of the deep.',
  signatures: 'The ninety four foot whale suspended from the ceiling, the blue light and the ocean floor mural, the upper and lower tiers of dioramas set into the walls, the balcony, the great hall doorway with its columns.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad8, horizon: 0xeef0ec, ground: 0x6a6a66, fog: 0.005, env: 0.6 });
    k.hemi(0x6a9ad8, 0x0a1a2a, 0.55);
    const blue = k.pbr('olBlue', X.plaster(0x1a3a5a, 127), 0.4, { roughness: 0.9 }),
      deep = k.flat(0x081826, 0.2, 0.9), floorD = k.pbr('olFloor', X.terrazzo(0x2a3a48, 128), 0.4, { roughness: 0.35 }),
      lime = k.pbr('olLime', X.ashlar(0xd8d0bc, 257, 4), 0.25), dark = k.flat(0x1a1c20, 0.5, 0.6),
      glassD = k.glass(0x8ac8e8, 0.12, 0.04), sand = k.flat(0xd8c8a0, 0, 0.9), coral = [k.flat(0xe87a5a, 0, 0.8), k.flat(0xf1c531, 0, 0.8), k.flat(0x8a3ad8, 0, 0.8), k.flat(0x3aa0a0, 0, 0.8)];
    // the museum front on the park side, the entrance, then the hall
    street(k, { w: 24, len: 160, z: 50, x: 0 });
    k.box(120, 30, 40, 0, 15, 30, k.pbr('olGranite', X.ashlar(0xb8a890, 258, 3), 0.22));
    for (let i = 0; i < 4; i++) { k.column(-9 + i * 6, 0, 50.5, 14, 1.0, lime, true); k.prop('corinthian_capital', -9 + i * 6, 14, 50.5, { height: 2 }); }
    k.box(30, 3, 12, 0, 15.5, 50, lime);
    k.arch(4, 8, 4, 0, 0, 50, lime, false, 0.85); k.block(-60, -2.2, 49.4, 51); k.block(2.2, 60, 49.4, 51);
    mlowBanner(k, -14, 9, 51.2, 0, 3.6, true); blossomFlag(k, 14, 9, 51.2, 0, 3.0, 5, 'electric');
    k.box(20, 0.3, 40, 0, 0.15, 30, floorD); k.block(-10, -3, 10, 49); k.block(3, 10, 10, 49);
    const HW = 60, HD = 50, HH = 18;
    k.box(HW, 0.3, HD, 0, 0.15, -HD / 2 + 10, floorD);
    for (const s of [-1, 1]) { k.box(0.8, HH, HD, s * HW / 2, HH / 2, -HD / 2 + 10, blue); k.block(s * HW / 2 - 0.7, s * HW / 2 + 0.7, -HD + 10, 10); }
    k.box(HW, HH, 0.8, 0, HH / 2, -HD + 10, blue); k.block(-HW / 2, HW / 2, -HD + 9.4, -HD + 10.6);
    k.box(HW, HH, 0.8, 0, HH / 2, 10, blue); k.block(-HW / 2, -3, 9.4, 10.6); k.block(3, HW / 2, 9.4, 10.6);
    k.box(HW + 2, 0.6, HD + 2, 0, HH, -HD / 2 + 10, deep);
    for (let x = -24; x <= 24; x += 8) for (let z = -HD + 16; z < 10; z += 10) k.point(x, HH - 2, z, 0x3a8ad8, 24, 18);
    // the whale from the Blender kit, hanging on cables, lit from below
    k.prop('blue_whale', 0, 7, -HD / 2 + 10, { height: 5.6, rotY: 0.2, keepOut: 0 });
    for (const [x, z] of [[-1, -8], [1, -22], [0, 4]]) k.beam(v(x, HH, z + 0), v(x, 11.5, z), 0.02, dark, 4);
    k.point(0, 4, -HD / 2 + 10, 0x9ad8ff, 60, 30); k.spot(0, 1, -HD / 2 + 10, 0, 9, -HD / 2 + 10, 0xb8e0ff, 200, 0.8, 0.5, 20);
    // the dioramas: lit windows in the walls on two tiers, a balcony at the upper tier
    const dio = (x: number, y: number, z: number, rot: number, i: number) => {
      const g = k.box(0.2, 3, 5, 0, 0, 0, glassD); g.position.set(x, y, z); g.rotation.y = rot;
      const back = k.box(0.1, 3, 5, 0, 0, 0, k.flat([0x1a4a7a, 0x2a6a8a, 0x0a2a4a, 0x3a5a3a][i % 4], 0, 0.9, { emissive: [0x1a4a7a, 0x2a6a8a, 0x0a2a4a, 0x3a5a3a][i % 4], emissiveIntensity: 0.6 })); back.position.set(x - Math.cos(rot) * 0.6, y, z + Math.sin(rot) * 0.6); back.rotation.y = rot;
      const fl = k.box(0.5, 0.1, 5, 0, 0, 0, sand); fl.position.set(x - Math.cos(rot) * 0.35, y - 1.4, z + Math.sin(rot) * 0.35); fl.rotation.y = rot;
      for (let c = 0; c < 4; c++) k.sphere(0.2 + (c % 2) * 0.1, x - Math.cos(rot) * 0.4, y - 1.1 + (c % 2) * 0.3, z + Math.sin(rot) * 0.4 - 1.6 + c * 1.05, coral[(i + c) % 4], 6);
      k.point(x - Math.cos(rot) * 0.3, y + 0.8, z, 0x9ad8ff, 8, 5);
    };
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = -HD + 18 + i * 10; for (const y of [3.2, 10.6]) dio(s * (HW / 2 - 0.5), y, z, s < 0 ? 0 : PI, i + (y > 5 ? 4 : 0)); }
    for (let i = 0; i < 3; i++) { const x = -18 + i * 18; for (const y of [3.2, 10.6]) { const g = k.box(5, 3, 0.2, x, y, -HD + 10.5, glassD); void g; k.box(5, 3, 0.1, x, y, -HD + 11.1, k.flat(0x0a2a4a, 0, 0.9, { emissive: 0x1a4a7a, emissiveIntensity: 0.6 })); k.point(x, y + 0.8, -HD + 12, 0x9ad8ff, 8, 5); } }
    k.box(HW - 2, 0.4, 5, 0, 8, -HD + 13, floorD); for (const s of [-1, 1]) k.box(5, 0.4, HD - 2, s * (HW / 2 - 3), 8, -HD / 2 + 10, floorD);
    for (let i = 0; i < 9; i++) { k.prop('balustrade', -24 + i * 6, 8.2, -HD + 15.6, { height: 1.0 }); }
    for (const s of [-1, 1]) for (let i = 0; i < 8; i++) k.prop('balustrade', s * (HW / 2 - 5.6), 8.2, -HD + 18 + i * 6, { height: 1.0, rotY: PI / 2 });
    for (let i = 0; i < 14; i++) k.box(3, 0.57, 1.0, HW / 2 - 4, 0.28 + i * 0.57, 6 - i * 1.0, floorD);
    k.block(-HW / 2 + 0.8, HW / 2 - 0.8, -HD + 10.6, -HD + 15.2); k.block(-HW / 2 + 0.8, -HW / 2 + 5.4, -HD + 15, 9); k.block(HW / 2 - 5.4, HW / 2 - 0.8, -HD + 15, -8);
    eyeMedallion(k, 0, 0.16, 4, 2.2);
    donorWall(k, 0, 6.6, 9.58, PI, 10, false);
    for (const x of [-12, 12]) k.prop('museum_bench', x, 0.15, -HD / 2 + 10, { height: 0.58, rotY: PI / 2, keepOut: 1.4 });
    k.crowd([v(-20, 0.15, 2), v(-10, 0.15, -20), v(10, 0.15, -30), v(20, 0.15, -6)], 26, { seed: 113, speed: 0.4, spread: 3, animate: !ctx.reduced, closed: true });
    k.crowd([v(-22, 8.4, -HD + 20), v(-22, 8.4, 0)], 8, { seed: 114, speed: 0.3, spread: 1.4, animate: !ctx.reduced });
    k.censusWall({ x: 0, y: 3.4, z: 9.58, rotY: PI, cols: 26, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(3500, 104), pieces: ctx.all, backing: dark });
    // the works: between the dioramas on both tiers, the end wall between the windows, the balcony faces
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = -HD + 23 + i * 10; for (const y of [3.2, 10.6]) mounts.push({ position: v(s * (HW / 2 - 0.82), y, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, y - 1, z), width: 3.6, height: 2.4, style: 'steel', wash: true }); }
    for (const x of [-9, 9]) for (const y of [3.2, 10.6]) mounts.push({ position: v(x, y, -HD + 10.42), rotation: 0, target: v(x, y - 1, -HD + 24), width: 4.4, height: 2.6, style: 'steel', wash: true });
    for (let i = 0; i < 3; i++) { const x = -16 + i * 16; mounts.push({ position: v(x, 6.6, -HD + 15.3), rotation: 0, target: v(x, 4, -HD + 30), width: 4.2, height: 2.0, style: 'steel', wash: false }); }
    return { mounts, spawn: v(0, 3, 6), look: v(0, 8, -HD / 2 + 10), eye: 3, bounds: [-HW / 2 + 1.2, HW / 2 - 1.2, -HD + 11, 84], style: 'steel', floorY: (x, z) => { if (z > -HD + 10.6 && z < -HD + 15.2 && Math.abs(x) < HW / 2 - 0.8) return 8.4; if ((x < -HW / 2 + 5.4 || x > HW / 2 - 5.4) && z >= -HD + 15 && z < 6) return 8.4; if (x > HW / 2 - 5.5 && x < HW / 2 - 2.5 && z >= -8 && z < 7) return Math.min(8, ((6 - z) / 13) * 8.4); return 0; } };
  },
};

/* ---------------- 86 THE ROSE CENTER ---------------- */
export const rosecenter: RoomDef = {
  id: 'rosecenter',
  name: 'The sphere in the cube',
  area: 'THE ROSE CENTER',
  mood: 'Space show letting out',
  color: '#8ab8e8',
  description: 'The glass cube on 81st Street with the great sphere floating inside, the spiral walkway of cosmic time, the planets on their orbits, the works on the balconies at every level.',
  signatures: 'The six storey glass cube, the eighty seven foot sphere held in its cradle, the ramp spiralling round it, the scale models of planets hanging in the void, the granite terraces outside, the night lit interior.',
  build(k, ctx) {
    k.sky({ top: 0x1a2446, horizon: 0x6a5a70, ground: 0x14141a, fog: 0.0022, stars: 300, env: 0.7 });
    k.hemi(0xb8c8ee, 0x1a1418, 0.55);
    const glass = k.glass(0xdcecf6, 0.14, 0.04), steel = k.flat(0x8c98a4, 0.9, 0.3),
      sphereM = k.flat(0xe8ecf0, 0.1, 0.35), dark = k.flat(0x1a1c20, 0.5, 0.6),
      granite = k.pbr('rcGranite', X.ashlar(0x8a8480, 259, 3), 0.22), deck = k.pbr('rcDeck', X.concrete(0x9a9a94, 129), 0.3),
      pave = k.pbr('rcPave', X.pavers(0x8e8b84, 130), 0.4), glow = k.glow(0xfff0e0);
    // 81st Street, the terraces, the cube
    street(k, { w: 24, len: 160, z: 50, x: 0 });
    blockFront(k, { x: 60, z0: 130, count: 12, face: -1, seed: 260, h: [18, 34] });
    k.box(120, 0.4, 60, 0, -0.2, 8, pave);
    for (let i = 0; i < 6; i++) k.box(60, 0.4, 1.4, 0, 0.2 + i * 0.4, 38 - i * 1.4, granite);
    const CW = 44, CH = 30, CZ = 0;
    k.box(CW, 0.6, CW, 0, 2.6, CZ, deck);
    for (const s of [-1, 1]) { k.box(0.16, CH, CW, s * CW / 2, CH / 2 + 2.6, CZ, glass); k.box(CW, CH, 0.16, 0, CH / 2 + 2.6, CZ + s * CW / 2, glass); k.block(s * CW / 2 - 0.4, s * CW / 2 + 0.4, CZ - CW / 2, CZ + CW / 2); }
    k.block(-CW / 2, -3, CZ + CW / 2 - 0.4, CZ + CW / 2 + 0.4); k.block(3, CW / 2, CZ + CW / 2 - 0.4, CZ + CW / 2 + 0.4); k.block(-CW / 2, CW / 2, CZ - CW / 2 - 0.4, CZ - CW / 2 + 0.4);
    for (let i = -CW / 2; i <= CW / 2; i += 4) { for (const s of [-1, 1]) { k.box(0.3, CH, 0.3, s * CW / 2, CH / 2 + 2.6, CZ + i, steel); k.box(0.3, CH, 0.3, i, CH / 2 + 2.6, CZ + s * CW / 2, steel); } }
    for (let y = 6; y < CH + 2; y += 5) for (const s of [-1, 1]) { k.box(CW, 0.3, 0.3, 0, y + 2.6, CZ + s * CW / 2, steel); k.box(0.3, 0.3, CW, s * CW / 2, y + 2.6, CZ, steel); }
    k.box(CW + 1, 0.5, CW + 1, 0, CH + 2.9, CZ, dark);
    // the sphere in its cradle, the spiral walkway round it, the planets
    const SY = 16, SR = 11;
    k.sphere(SR, 0, SY, CZ, sphereM, 48);
    for (let i = 0; i < 3; i++) { const a = (i / 3) * PI * 2; k.beam(v(Math.cos(a) * 14, 2.9, CZ + Math.sin(a) * 14), v(Math.cos(a) * 8, SY - 7, CZ + Math.sin(a) * 8), 0.5, steel, 8); }
    for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; k.point(Math.cos(a) * 15, 8 + (i % 4) * 5, CZ + Math.sin(a) * 15, i % 2 ? 0x4a8aff : 0xfff0e0, 20, 16); }
    const helix: T.Vector3[] = [];
    for (let i = 0; i <= 200; i++) { const t = i / 200; const a = t * PI * 2 * 1.75; const y = 3 + t * 20; helix.push(v(Math.cos(a) * 17, y, CZ + Math.sin(a) * 17)); }
    const sp = k.spline(helix, false, 0.5); const pts = sp.getSpacedPoints(400);
    const treadG = new T.BoxGeometry(3.6, 0.16, 0.5), tm: T.Matrix4[] = [];
    const tan = new T.Vector3(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0);
    for (let i = 0; i < 400; i++) { const p = pts[i]; sp.getTangentAt(i / 400, tan); q.setFromAxisAngle(up, Math.atan2(tan.x, tan.z)); tm.push(new T.Matrix4().compose(p.clone().add(v(0, -0.3, 0)), q, new T.Vector3(1, 1, 1))); }
    k.instances(treadG, deck, tm);
    k.curve(pts.filter((_, i) => i % 3 === 0).map((p) => p.clone().add(v(p.x * 0.11, 0.8, (p.z - CZ) * 0.11))), 0.04, steel, 130);
    k.curve(pts.filter((_, i) => i % 3 === 0).map((p) => p.clone().add(v(-p.x * 0.09, 0.8, -(p.z - CZ) * 0.09))), 0.04, steel, 130);
    const planets: [number, number, number][] = [[0.6, 0xc8a070, 0], [1.6, 0xd8b890, 1], [1.1, 0x8ab8e8, 2], [0.8, 0xc85a3a, 3], [0.5, 0x9aa4ae, 4]];
    planets.forEach(([r, c, i]) => { const a = (i / 5) * PI * 2 + 0.6; const p = k.mesh(new T.SphereGeometry(r, 20, 14), k.flat(c, 0.1, 0.6), Math.cos(a) * (13 + i), 8 + i * 3.6, CZ + Math.sin(a) * (13 + i), true); k.beam(v(p.position.x, CH + 2.6, p.position.z), p.position.clone().add(v(0, r, 0)), 0.015, dark, 3); if (i === 1) k.torus(r * 1.8, 0.08, p.position.x, p.position.y, p.position.z, k.flat(0xe8dcc0, 0.2, 0.6), 48).rotation.x = PI / 2.4; if (!ctx.reduced) k.ticks.push((t) => { p.rotation.y = t * 0.2 * (i + 1); }); });
    eyeMonument(k, -14, 2.9, CZ + 14, PI * 0.75, 4.6);
    blossomFlag(k, -CW / 2 + 0.3, 8, CZ - 10, PI / 2, 2.8, 5, 'electric');
    donorWall(k, 0, 5.6, CZ - CW / 2 + 0.3, 0, 10, false);
    for (let i = 0; i < 6; i++) k.prop('rope_stanchion', -12 + i * 4.8, 2.9, CZ + CW / 2 - 6, { height: 1.0 });
    k.crowd([v(-8, 2.9, CZ + 18), v(-16, 2.9, CZ + 4), v(-10, 2.9, CZ - 14), v(12, 2.9, CZ - 14), v(16, 2.9, CZ + 6)], 24, { seed: 115, speed: 0.4, spread: 2.4, animate: !ctx.reduced, closed: true });
    k.censusWall({ x: CW / 2 - 0.42, y: 7, z: CZ, rotY: -PI / 2, cols: 30, rows: 5, tile: 0.55, gap: 0.05, start: ctx.wallStart(4800, 150), pieces: ctx.all, backing: dark });
    // the works: glass screens along the spiral's outer rail at intervals, the ground floor perimeter, the entrance wall
    const mounts: Mount[] = [];
    for (let i = 0; i < 12; i++) { const p = pts[30 + i * 30]; const a = Math.atan2(p.z - CZ, p.x); const px = Math.cos(a) * 19.2, pz = CZ + Math.sin(a) * 19.2; const sc = k.box(0.14, 2.4, 3.2, 0, 0, 0, dark); sc.position.set(px, p.y + 1.2, pz); sc.rotation.y = -a; mounts.push({ position: v(px - Math.cos(a) * 0.1, p.y + 1.3, pz - Math.sin(a) * 0.1), rotation: -a + PI / 2 + PI, target: v(Math.cos(a) * 17, p.y + 1.3, CZ + Math.sin(a) * 17), width: 2.8, height: 1.7, style: 'steel', wash: false }); }
    for (let i = 0; i < 4; i++) { const x = -15 + i * 10; mounts.push({ position: v(x, 5.4, CZ + CW / 2 - 0.42), rotation: PI, target: v(x, 4, CZ + 8), width: 4.4, height: 2.6, style: 'steel', wash: true }); }
    for (let i = 0; i < 4; i++) { const z = CZ - 15 + i * 10; mounts.push({ position: v(-CW / 2 + 0.42, 5.4, z), rotation: PI / 2, target: v(-CW / 2 + 10, 4, z), width: 4.4, height: 2.6, style: 'steel', wash: true }); }
    const path = helix.map((p) => p.clone().add(v(0, 1.4, 0)));
    return { mounts, spawn: v(0, 3, 44), look: v(0, 14, CZ), eye: 3, bounds: [-CW / 2 + 1, CW / 2 - 1, CZ - CW / 2 + 1, 56], style: 'steel', floorY: (x, z) => { if (Math.abs(x) < CW / 2 && Math.abs(z - CZ) < CW / 2) { const d = Math.hypot(x, z - CZ); if (d > 15 && d < 19.5) { const a = Math.atan2(z - CZ, x); let best = 2.9; for (let i = 0; i <= 200; i += 4) { const t = i / 200; const ha = (t * PI * 2 * 1.75) % (PI * 2); const da = Math.abs(Math.atan2(Math.sin(a - ha), Math.cos(a - ha))); if (da < 0.12 && 3 + t * 20 - 1.4 <= best + 3.2) best = 3 + t * 20 - 1.4 > best ? 3 + t * 20 - 1.4 : best; } return Math.max(2.9, best); } return 2.9; } if (z > 30 && z < 39) return Math.min(2.6, ((z - 30) / 8) * 2.6) * 0 + Math.max(0, 2.6 - ((z - 30) / 8) * 2.6); return 0; } };
  },
};
