/* Rooms 32 to 36: Doyers Street, Strivers' Row, Top of the Rock, the Frick garden court, South Street Seaport. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Kit, Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront } from './f';

const PI = Math.PI;

/* ---------------- 32 DOYERS STREET ---------------- */
export const doyers: RoomDef = {
  id: 'doyers',
  name: 'The bend',
  area: 'DOYERS STREET',
  mood: 'Lantern hour',
  color: '#e05a4a',
  description: 'The crooked lane in Chinatown under strings of lanterns, a dim sum hall up one flight, the census on every wall.',
  signatures: 'The sharp bend of the lane, tenements with fire escapes, red lanterns strung overhead, the painted mural on the bend, the upstairs banquet hall with round tables and a lazy susan.',
  build(k, ctx) {
    k.sky({ top: 0x2c2f5e, horizon: 0xd88a6a, ground: 0x2a2226, fog: 0.005, sun: { az: 4.5, el: 0.08, color: 0xffa060, size: 18 }, haze: 0.3, stars: 200, env: 0.7 });
    k.hemi(0xffd6c0, 0x2a2228, 0.65);
    k.sun(0xffb890, 1.4, -40, 20, 40, true, 60);
    const asphalt = k.pbr('asphaltS', X.asphalt(0x24282d), 0.11),
      pav = k.pbr('sidewalkS', X.pavers(0x8e8b84, 5), 0.42),
      brick = k.pbr('doyersBrick', X.brick(0x6a3f36, 41), 0.28),
      brick2 = k.pbr('doyersBrick2', X.brick(0x8a5a44, 42), 0.28),
      cornice = k.pbr('nbCornice', X.plaster(0xb8ad9a, 3), 0.6),
      red = k.flat(0xc0302a, 0.1, 0.6),
      gold = k.pbr('doyersGold', X.gilt(0xd0a852), 2, { metalness: 0.8, roughness: 0.35 }),
      lantern = k.glow(0xff6a4a),
      warm = k.glow(0xffd8a0),
      glass = k.glass(0xbfd6e2, 0.3, 0.08),
      carpet = k.pbr('banquetCarpet', X.carpet(0x6a1a22, 0xd9a84a), 0.5),
      linen = k.flat(0xf4f0e6, 0, 0.9),
      wood = k.pbr('doyersWood', X.planks(0x5a3a26, 6, 43), 1.2),
      iron = k.flat(0x1f242a, 0.75, 0.45);
    // the lane: two legs meeting at the bend, tenements both sides, the mural on the elbow
    const leg = (x0: number, z0: number, x1: number, z1: number, w: number) => {
      const len = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(x1 - x0, z1 - z0);
      const g = k.box(w, 0.3, len + w, (x0 + x1) / 2, -0.15, (z0 + z1) / 2, asphalt);
      g.rotation.y = ang;
      for (const s of [-1, 1]) { const p = k.box(3, 0.28, len + 3, (x0 + x1) / 2 + Math.cos(ang) * s * (w / 2 + 1.5), 0, (z0 + z1) / 2 - Math.sin(ang) * s * (w / 2 + 1.5), pav); p.rotation.y = ang; }
      return ang;
    };
    const a1 = leg(0, 14, 0, -18, 8);
    const a2 = leg(0, -18, -26, -40, 8);
    void a1;
    // tenement rows along both legs
    const row = (x0: number, z0: number, ang: number, n: number, side: 1 | -1, seed: number) => {
      const rnd = X.mulberry(seed);
      for (let i = 0; i < n; i++) {
        const d = i * 8 + 4, cx = x0 + Math.sin(ang) * d + Math.cos(ang) * side * 8, cz = z0 + Math.cos(ang) * d - Math.sin(ang) * side * 8;
        const h = 14 + Math.floor(rnd() * 3) * 3, m = rnd() > 0.5 ? brick : brick2;
        const b = k.box(8, h, 7.8, cx, h / 2, cz, m);
        b.rotation.y = ang;
        const c = k.box(8.4, 0.6, 8.2, cx, h, cz, cornice);
        c.rotation.y = ang;
        for (let y = 3.4; y < h - 1; y += 2.7) for (const dz of [-2.6, 0, 2.6]) {
          const wx = cx - Math.cos(ang) * side * 4.05 + Math.sin(ang) * dz, wz = cz + Math.sin(ang) * side * 4.05 + Math.cos(ang) * dz;
          const win = k.box(0.1, 1.7, 1.2, wx, y, wz, rnd() > 0.55 ? warm : glass);
          win.rotation.y = ang;
        }
        if (i % 2 === 0) k.prop('fire_escape', cx - Math.cos(ang) * side * 5.1, 6.8 + rnd() * 3, cz + Math.sin(ang) * side * 5.1, { height: 3.2, rotY: ang + (side > 0 ? PI / 2 : -PI / 2) });
        if (rnd() > 0.5) { const s = k.sign('茶 · 點心', 2.4, 0.9, cx - Math.cos(ang) * side * 4.1, 3.0, cz + Math.sin(ang) * side * 4.1, '#b0261f', '#ffe08a', 120, ang + (side > 0 ? PI / 2 : -PI / 2), { border: true }); void s; }
      }
    };
    row(0, 14, PI, 4, 1, 1);
    row(0, 14, PI, 4, -1, 2);
    row(0, -18, a2, 4, 1, 3);
    row(0, -18, a2, 4, -1, 4);
    // the wall at the elbow: a painted mural that is one of the works
    k.box(10, 16, 1, 6, 8, -24, brick2);
    // lanterns strung across both legs
    for (let d = 2; d < 30; d += 4) {
      for (const [x0, z0, ang] of [[0, 14, PI], [0, -18, a2]] as const) {
        const cx = x0 + Math.sin(ang) * d, cz = z0 + Math.cos(ang) * d;
        const ax = cx + Math.cos(ang) * 4, az = cz - Math.sin(ang) * 4, bx = cx - Math.cos(ang) * 4, bz = cz + Math.sin(ang) * 4;
        k.beam(v(ax, 6.4, az), v(bx, 6.4, bz), 0.015, iron, 4);
        for (let j = -3; j <= 3; j++) { const t = (j + 3) / 6; const lx = ax + (bx - ax) * t, lz = az + (bz - az) * t; const l = k.mesh(new T.SphereGeometry(0.3, 10, 8), lantern, lx, 6.0 - Math.abs(j) * 0.05, lz); l.scale.set(1, 0.8, 1); k.point(lx, 5.9, lz, 0xff7a55, 2.5, 4); }
      }
    }
    k.prop('hydrant', 5.4, 0, 8, { height: 1.1, keepOut: 0.5 });
    k.prop('mailbox', -5.4, 0, -4, { height: 1.5, rotY: PI / 2, keepOut: 0.6 });
    k.prop('lantern', 5.2, 0, -12, { height: 1.0 });
    // the banquet hall upstairs: a stair from the lane into a long room over the bend
    const HX = -14, HZ = -30, HW = 18, HD = 22, HY = 4.6;
    for (let i = 0; i < 14; i++) k.box(2.4, 0.33, 0.9, -6, 0.16 + i * 0.33, -18 - i * 0.9, wood);
    k.box(HW, 0.4, HD, HX, HY - 0.2, HZ, carpet);
    k.box(HW, 0.4, HD, HX, HY + 6, HZ, k.pbr('tinRed', X.ashlar(0x7a2a2a, 30, 6), 1.6, { metalness: 0.4, roughness: 0.5 }));
    for (const s of [-1, 1]) k.box(0.4, 6.2, HD, HX + s * HW / 2, HY + 3, HZ, brick2);
    k.box(HW, 6.2, 0.4, HX, HY + 3, HZ - HD / 2, brick2);
    k.box(HW - 4, 6.2, 0.4, HX - 2, HY + 3, HZ + HD / 2, brick2);
    for (const s of [-1, 1]) k.block(HX + s * HW / 2 - 0.3, HX + s * HW / 2 + 0.3, HZ - HD / 2, HZ + HD / 2);
    k.block(HX - HW / 2, HX + HW / 2, HZ - HD / 2 - 0.3, HZ - HD / 2 + 0.3);
    k.block(HX - HW / 2, HX + HW / 2 - 4, HZ + HD / 2 - 0.3, HZ + HD / 2 + 0.3);
    for (const [tx, tz] of [[-4, -6], [4, -6], [-4, 4], [4, 4]]) {
      const x = HX + tx, z = HZ + tz;
      k.cyl(2.2, 0.08, x, HY + 1.0, z, linen, 2.2, 32);
      k.cyl(0.4, 1.0, x, HY + 0.5, z, wood, 0.6, 12);
      k.cyl(1.1, 0.05, x, HY + 1.06, z, glass, 1.1, 24);
      for (let j = 0; j < 8; j++) { const a = (j / 8) * PI * 2; k.cyl(0.24, 0.08, x + Math.cos(a) * 1.7, HY + 1.08, z + Math.sin(a) * 1.7, linen, 0.24, 12); k.box(0.5, 0.05, 0.5, x + Math.cos(a) * 2.9, HY + 0.6, z + Math.sin(a) * 2.9, red).rotation.y = -a; }
      k.keepOut.push({ x, z, r: 3.2 });
      k.point(x, HY + 4.5, z, 0xffd8a8, 16, 10);
      for (let j = 0; j < 12; j++) { const a = (j / 12) * PI * 2; k.sphere(0.06, x + Math.cos(a) * 0.9, HY + 5.2, z + Math.sin(a) * 0.9, gold, 6); }
      k.beam(v(x, HY + 5.8, z), v(x, HY + 5.2, z), 0.03, gold, 4);
    }
    k.sign('金龍大酒樓  ·  GOLDEN DRAGON  ·  DIM SUM ALL DAY', 10, 0.9, HX, HY + 5.2, HZ - HD / 2 + 0.22, '#b0261f', '#ffe08a', 80, 0, { border: true });
    k.censusWall({ x: HX - HW / 2 + 0.22, y: HY + 3.4, z: HZ, rotY: PI / 2, cols: 30, rows: 5, tile: 0.6, gap: 0.05, start: ctx.wallStart(1700, 150), pieces: ctx.all, backing: wood });
    // the works: the mural on the elbow, storefront frames along the lane, the banquet hall walls
    const mounts: Mount[] = [];
    mounts.push({ position: v(6, 8, -23.45), rotation: 0, target: v(0, 3, -10), width: 9.4, height: 9, style: 'none', wash: false });
    for (let i = 0; i < 4; i++) { const z = 8 - i * 6; for (const s of [-1, 1]) mounts.push({ position: v(s * 3.95, 3.2, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 0.6, 3, z), width: 3.2, height: 2.0, style: 'black' }); }
    for (let i = 0; i < 3; i++) { const d = 6 + i * 7; const cx = Math.sin(a2) * d, cz = -18 + Math.cos(a2) * d; for (const s of [-1, 1]) mounts.push({ position: v(cx + Math.cos(a2) * s * 3.95, 3.2, cz - Math.sin(a2) * s * 3.95), rotation: a2 + (s > 0 ? -PI / 2 : PI / 2), target: v(cx + Math.cos(a2) * s * 0.5, 3, cz - Math.sin(a2) * s * 0.5), width: 3.2, height: 2.0, style: 'black' }); }
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = HZ - 7 + i * 7; mounts.push({ position: v(HX + s * (HW / 2 - 0.24), HY + 3.3, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(HX + s * (HW / 2 - 5), HY + 3, z), width: 3.8, height: 2.2, style: 'gilt', wash: false }); }
    mounts.splice(mounts.length - 3, 3);
    for (const x of [HX - 5, HX + 5]) mounts.push({ position: v(x, HY + 3.4, HZ - HD / 2 + 0.24), rotation: 0, target: v(x, HY + 3, HZ - HD / 2 + 5), width: 4.2, height: 2.5, style: 'gilt', wash: false });
    return { mounts, spawn: v(0, 3, 12), look: v(0, 4, -20), eye: 3, bounds: [-36, 10, -52, 16], style: 'black', floorY: (x, z) => {
      if (x < HX + HW / 2 && x > HX - HW / 2 && z > HZ - HD / 2 && z < HZ + HD / 2) return HY;
      if (Math.abs(x + 6) < 1.4 && z < -17 && z > -31) return Math.min(HY, Math.max(0, (-18 - z) / 12.6 * HY));
      return 0;
    } };
  },
};

/* ---------------- 33 STRIVERS' ROW ---------------- */
export const strivers: RoomDef = {
  id: 'strivers',
  name: 'The parlour floor',
  area: 'STRIVERS\' ROW',
  mood: 'Sunday in Harlem',
  color: '#c98a6a',
  description: 'A block of Harlem row houses, and inside one of them the parlour floor: pocket doors, a piano, the census in gilt on the walls.',
  signatures: 'The unbroken row of brownstones and buff brick with high stoops, the tree lined block, the parlour with its bay window, marble mantel, pocket doors and pressed tin ceiling.',
  build(k, ctx) {
    k.sky({ top: 0x7fa8d6, horizon: 0xeae7de, ground: 0x5f5a52, fog: 0.0028, sun: { az: 1.4, el: 0.55, color: 0xfff1d8, size: 14 }, env: 0.85 });
    k.hemi(0xfff4e6, 0x4a4238, 0.85);
    k.sun(0xffefd6, 2.2, 40, 50, 30, true, 70);
    const brown = k.pbr('brownstone', X.ashlar(0x7a5040, 44, 3), 0.28),
      buff = k.pbr('buffBrick', X.brick(0xb99a72, 45), 0.28),
      cornice = k.pbr('rowCornice', X.plaster(0xb8ad9a, 35), 0.6),
      iron = k.flat(0x1f242a, 0.75, 0.45),
      glass = k.glass(0xbfd6e2, 0.3, 0.08),
      warm = k.glow(0xffd8a0),
      oak = k.pbr('parlourOak', X.planks(0x7a5334, 8, 46), 0.6, { roughness: 0.55 }),
      plaster = k.pbr('parlourPlaster', X.plaster(0xe9dccb, 36), 0.4),
      tin = k.pbr('tinCeilingP', X.ashlar(0xe6e2d8, 15, 6), 1.6, { metalness: 0.5, roughness: 0.4 }),
      marble = k.pbr('mantelMarble', X.marble(0xe8e4dc, 0x8a8478, 11), 0.5, { roughness: 0.3 }),
      velvet = k.pbr('parlourVelvet', X.velvet(0x4a2a5a), 0.6),
      wood = k.pbr('pianoBlack', X.planks(0x1a1a1c, 3, 47), 2, { roughness: 0.25 }),
      lawn = k.pbr('lawnSR', X.grass(0x4a7a3a, 17), 0.15);
    // the block: a service alley behind, the tree lined street in front
    street(k, { w: 16, len: 120, z: -10 });
    const rnd = X.mulberry(33);
    for (let i = 0; i < 12; i++) { const x = 12.5 + 0, z = 40 - i * 7; void x; k.tree(-12.4, 0, z + 3, { kind: 'round', h: 6 + rnd() * 3, r: 3 + rnd(), leaf: 0x3f6b36, seed: i }); }
    for (let i = 0; i < 6; i++) k.tree(12.6, 0, 34 - i * 12, { kind: 'round', h: 6 + rnd() * 3, r: 3 + rnd(), leaf: 0x3f6b36, seed: 30 + i });
    // the row: eleven houses, alternating brownstone and buff, every one with a stoop and a bay
    const HX = 12.4;
    for (let i = 0; i < 11; i++) {
      const z = 40 - i * 7.4, m = i % 3 === 1 ? buff : brown, h = 16 + (i % 2) * 1.2;
      k.box(14, h, 7.2, HX + 7, h / 2, z, m);
      k.moulding([[0, 0], [0.8, 0], [0.9, 0.25], [0.6, 0.45], [0.7, 0.7], [0.3, 0.9], [0, 1.0]], 7.4, HX - 0.05, h - 0.6, z, cornice, 0);
      for (let f = 0; f < 3; f++) { const y = 6.2 + f * 3.2; for (const dz of [-2.4, 0, 2.4]) { k.box(0.2, 2.2, 1.3, HX - 0.06, y, z + dz, cornice); k.box(0.05, 1.9, 1.05, HX + 0.06, y, z + dz, rnd() > 0.6 ? warm : glass); } }
      k.box(1.4, 3.2, 2.4, HX - 0.7, 4.6, z + 1.4, m);
      k.box(0.05, 2.2, 1.6, HX - 1.42, 4.8, z + 1.4, glass);
      k.prop('stoop', HX - 1.9, 0, z - 1.6, { height: 2.6, rotY: -PI / 2 });
      k.box(1.2, 2.8, 1.4, HX - 0.6, 4.4, z - 1.6, k.pbr('rowDoor', X.planks(0x3a2418, 3, 48), 1.2));
      k.rail(HX - 3.2, z - 1.6, 3.2, iron, 0.9, 'x', 0.8);
      if (i % 4 === 2) k.prop('fire_escape', HX - 1.05, 7, z + 2, { height: 3.2, rotY: -PI / 2 });
    }
    k.block(HX - 0.4, HX + 14, -45, 44);
    blockFront(k, { x: -12.4, z0: 40, count: 11, face: 1, seed: 53, h: [14, 18] });
    k.prop('hydrant', 9.6, 0, 20, { height: 1.1, keepOut: 0.5 });
    k.prop('mailbox', -9.8, 0, 6, { height: 1.5, rotY: PI / 2, keepOut: 0.6 });
    for (const z of [30, 4, -22]) for (const s of [-1, 1]) k.lamp(s * 9.4, z, 6, iron, 0xffd9a8, 26);
    k.skyline({ z: -150, count: 24, spacing: 8, scale: 1.6, base: -2, seed: 95, lit: 0.15, glow: 0.3, tint: 0x8a8690, rows: 1 });
    // the parlour floor of the fourth house, entered up its stoop
    const PZ = 40 - 3 * 7.4, PX = HX + 7, PW = 13, PD = 20, PY = 3.2;
    k.blocks.pop();
    k.block(HX - 0.4, HX + 14, PZ + 3.9, 44);
    /* This cut the parlour off at z = PZ - 3.9 and left only the back seven
       metres of a twenty metre room standable, so the mantel wall works, the
       far side walls and the bay window all sent the visitor somewhere they
       could not stand. The parlour floor runs to PZ - PD + 3.6, and the
       mantel wall below already blocks the fireplace itself. */
    k.block(HX - 0.4, HX + 14, -45, PZ - PD + 3.3);
    k.box(PW, 0.3, PD, PX, PY - 0.15, PZ - PD / 2 + 3.6, oak);
    k.box(PW, 0.3, PD, PX, PY + 5.2, PZ - PD / 2 + 3.6, tin);
    k.box(0.4, 5.4, PD, PX + PW / 2, PY + 2.6, PZ - PD / 2 + 3.6, plaster);
    k.box(0.4, 5.4, PD, PX - PW / 2 + 1.4, PY + 2.6, PZ - PD / 2 + 3.6, plaster);
    k.box(PW, 5.4, 0.4, PX, PY + 2.6, PZ - PD + 3.6, plaster);
    k.block(PX + PW / 2 - 0.3, PX + PW / 2 + 0.3, PZ - PD + 3.6, PZ + 3.6);
    k.block(PX - PW / 2 + 1.1, PX - PW / 2 + 1.7, PZ - PD + 3.6, PZ - 3.2);
    k.block(PX - PW / 2 + 1.1, PX - PW / 2 + 1.7, PZ - 0.2, PZ + 3.6);
    k.block(PX - PW / 2, PX + PW / 2, PZ - PD + 3.3, PZ - PD + 3.9);
    // the front door bay: a short hall from the stoop into the parlour
    k.box(1.2, 0.3, 4, HX - 0.9, PY - 0.15, PZ - 1.6, oak);
    // pocket doors halfway, the bay window at the front, the mantel, the piano, the settee
    for (const s of [-1, 1]) { k.box(0.3, 4.6, 2.2, PX + s * 4.6, PY + 2.3, PZ - 6, k.pbr('pocketDoor', X.planks(0x4a2c1c, 4, 49), 1.2)); k.block(PX + s * 4.6 - 0.2, PX + s * (PW / 2 - 0.2), PZ - 6.2, PZ - 5.8); }
    k.box(PW - 2, 0.6, 0.3, PX + 0.7, PY + 4.9, PZ - 6, plaster);
    k.box(4.2, 0.4, 0.5, PX, PY + 1.3, PZ - PD + 3.9, marble);
    k.box(0.4, 1.3, 0.5, PX - 2, PY + 0.65, PZ - PD + 3.9, marble);
    k.box(0.4, 1.3, 0.5, PX + 2, PY + 0.65, PZ - PD + 3.9, marble);
    k.box(3.2, 1.2, 0.2, PX, PY + 0.6, PZ - PD + 3.75, k.flat(0x0a0a0a, 0, 1));
    k.point(PX, PY + 0.9, PZ - PD + 4.5, 0xff9a40, 8, 5);
    k.box(2.8, 1.1, 1.4, PX + 2.6, PY + 0.55, PZ - 10, wood);
    k.box(1.0, 0.8, 1.4, PX + 4.2, PY + 1.5, PZ - 10, wood);
    k.box(2.6, 0.08, 0.3, PX + 2.6, PY + 0.96, PZ - 9.25, k.flat(0xf4f0e0, 0, 0.5));
    k.keepOut.push({ x: PX + 3, z: PZ - 10, r: 1.8 });
    k.rounded(2.6, 0.6, 1.0, PX - 2.6, PY + 0.5, PZ - 12, velvet, 0.1);
    k.rounded(2.6, 0.9, 0.3, PX - 2.6, PY + 1.2, PZ - 12.4, velvet, 0.1);
    k.keepOut.push({ x: PX - 2.6, z: PZ - 12, r: 1.6 });
    for (const z of [PZ - 2, PZ - 12]) { k.point(PX, PY + 4.6, z, 0xffe0b8, 24, 12); for (let j = 0; j < 8; j++) { const a = (j / 8) * PI * 2; k.sphere(0.07, PX + Math.cos(a) * 0.6, PY + 4.4, z + Math.sin(a) * 0.6, k.glow(0xfff0d0), 6); } }
    k.censusWall({ x: PX + PW / 2 - 0.22, y: PY + 2.9, z: PZ - 13, rotY: -PI / 2, cols: 12, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(1100, 48), pieces: ctx.all, backing: oak });
    // the works: gilt on the parlour walls, the front room, and along the block as stoop signs
    const mounts: Mount[] = [];
    for (let i = 0; i < 4; i++) { const z = PZ - 1 - i * 1.3 * 0 - i * 1.2; void z; }
    for (const z of [PZ - 1.5, PZ - 4]) mounts.push({ position: v(PX + PW / 2 - 0.24, PY + 3.0, z), rotation: -PI / 2, target: v(PX + 1, PY + 3, z), width: 3.8, height: 2.2, style: 'gilt' });
    for (const z of [PZ - 8.5, PZ - 11.5]) mounts.push({ position: v(PX - PW / 2 + 1.64, PY + 3.0, z), rotation: PI / 2, target: v(PX - 1, PY + 3, z), width: 3.6, height: 2.1, style: 'gilt' });
    mounts.push({ position: v(PX, PY + 3.4, PZ - PD + 3.84), rotation: 0, target: v(PX, PY + 3, PZ - 10), width: 4.4, height: 2.6, style: 'gilt' });
    /* The pair either side of the mantel stand you back a little further than
       the middle one: at PZ - 10 the right hand target landed inside the
       piano's own keep out, which is a spot the visitor is pushed out of. */
    for (const x of [PX - 4, PX + 4]) mounts.push({ position: v(x, PY + 3.4, PZ - PD + 3.84), rotation: 0, target: v(x, PY + 3, PZ - 6.5), width: 3.2, height: 1.9, style: 'gilt' });
    mounts.push({ position: v(PX + PW / 2 - 0.24, PY + 3.0, PZ - 15.5), rotation: -PI / 2, target: v(PX + 1, PY + 3, PZ - 15.5), width: 3.4, height: 2.0, style: 'gilt' });
    /* Stoop signs on the house fronts. These face the street, which is at
       lower x, so the normal is -X: at +PI/2 all ten faced into the brick and
       the visitor on the pavement saw ten backs. */
    for (let i = 0; i < 11; i++) { if (i === 3) continue; const z = 40 - i * 7.4; mounts.push({ position: v(HX - 0.06, 2.9, z + 1.4 + 0.02), rotation: -PI / 2, target: v(HX - 5, 3, z + 1.4), width: 1.5, height: 2.2, style: 'black', wash: false, lookAt: v(HX, 3, z + 1.4) }); }
    return { mounts, spawn: v(-4, 3, 28), look: v(HX, 5, 10), eye: 3, bounds: [-9, PX + PW / 2, -40, 42], style: 'gilt', floorY: (x, z) => {
      if (x > HX - 0.4 && z > PZ - PD + 3.6 && z < PZ + 3.6) return PY;
      if (x > HX - 3.4 && x <= HX - 0.4 && Math.abs(z - (PZ - 1.6)) < 1.6) return Math.max(0, ((x - (HX - 3.4)) / 3) * PY);
      return 0;
    } };
  },
};

/* ---------------- 34 TOP OF THE ROCK ---------------- */
export const rock: RoomDef = {
  id: 'rock',
  name: 'Seventy floors up',
  area: 'TOP OF THE ROCK',
  mood: 'Blue hour',
  color: '#8fb3d9',
  description: 'The observation decks of a limestone tower, glass panels at the edge, the whole island laid out around the works.',
  signatures: 'The stepped limestone crown of the slab, three terraced decks, safety glass panels between stone piers, the park to the north and the spire to the south, the city as the wall.',
  build(k, ctx) {
    k.sky({ top: 0x122446, horizon: 0x7e8fbd, ground: 0x0e1420, fog: 0.0015, stars: 400, sun: { az: 4.7, el: 0.06, color: 0xffa070, size: 14 }, haze: 0.35, env: 0.7 });
    k.hemi(0xbfd0ff, 0x1a1e2a, 0.65);
    k.sun(0xffc09a, 1.3, -60, 12, 30, true, 60);
    const lime = k.pbr('rockLime', X.ashlar(0xd8cfb8, 50, 3), 0.22),
      pav = k.pbr('deckPav', X.pavers(0x8c8880, 21), 0.35),
      glass = k.glass(0xdcecf6, 0.14, 0.04),
      steel = k.flat(0x9aa4ae, 0.85, 0.3),
      lawn = k.pbr('parkLawn', X.grass(0x2e4a2e, 18), 0.05);
    // the decks: three terraces on the crown, glass at every edge
    const decks = [[0, 0, 34, 20], [7.5, -14, 26, 10], [15, -26, 18, 8]] as const;
    for (const [y, z, w, d] of decks) {
      k.box(w, 1.6, d, 0, y - 0.8, z, lime);
      k.box(w - 1, 0.2, d - 1, 0, y + 0.1, z, pav);
      for (const s of [-1, 1]) { k.box(0.12, 2.6, d - 1, s * (w / 2 - 0.4), y + 1.4, z, glass); k.box(0.12, 0.1, d - 1, s * (w / 2 - 0.4), y + 2.7, z, steel); for (let zz = z - d / 2 + 0.5; zz <= z + d / 2; zz += 3) k.box(0.4, 2.8, 0.4, s * (w / 2 - 0.4), y + 1.4, zz, lime); }
      k.box(w - 1, 2.6, 0.12, 0, y + 1.4, z - d / 2 + 0.4, glass);
      k.box(w - 1, 0.1, 0.12, 0, y + 2.7, z - d / 2 + 0.4, steel);
      for (let xx = -w / 2 + 0.9; xx <= w / 2 - 0.5; xx += 3) k.box(0.4, 2.8, 0.4, xx, y + 1.4, z - d / 2 + 0.4, lime);
      k.block(-w / 2, w / 2, z - d / 2 - 1, z - d / 2 + 0.6);
      k.block(-w / 2 - 1, -w / 2 + 0.6, z - d / 2, z + d / 2);
      k.block(w / 2 - 0.6, w / 2 + 1, z - d / 2, z + d / 2);
    }
    k.box(34, 2.6, 0.12, 0, 1.4, 9.6, glass);
    k.box(34, 0.1, 0.12, 0, 2.7, 9.6, steel);
    k.block(-17, 17, 9.4, 11);
    // stairs between decks
    for (let i = 0; i < 10; i++) { k.box(4, 0.75, 1.2, 12, 0.375 + i * 0.75, -8 - i * 0.6, lime); k.box(4, 0.75, 1.2, -12, 0.375 + i * 0.75, -8 - i * 0.6, lime); }
    for (let i = 0; i < 10; i++) { k.box(3, 0.75, 1.0, 8, 7.875 + i * 0.75, -21 - i * 0.5, lime); k.box(3, 0.75, 1.0, -8, 7.875 + i * 0.75, -21 - i * 0.5, lime); }
    // the tower below the decks and the crown behind
    k.box(44, 200, 30, 0, -100, -8, k.pbr('rockFacade', X.windows(51, 0.35, 0x8a8272, true), 0.12, { emissive: 0xffffff, emissiveIntensity: 1.1, roughness: 0.6, stretch: 0.42 }));
    k.box(24, 10, 12, 0, 20, -40, lime);
    k.box(16, 6, 8, 0, 28, -42, lime);
    k.cyl(0.4, 30, 0, 44, -42, steel, 0.1, 8);
    // the city: park to the north, the whole grid around, the spire to the south
    k.box(120, 0.5, 300, 0, -202, 210, lawn);
    k.box(60, 0.3, 300, 0, -201.9, 210, k.flat(0x1a2a36, 0.6, 0.3));
    k.skyline({ z: -120, count: 40, spacing: 9, scale: 5.2, base: -200, seed: 96, lit: 0.5, glow: 1.5, tint: 0x2a3140, spires: true });
    k.skyline({ z: -260, count: 36, spacing: 12, scale: 5.6, base: -200, seed: 97, lit: 0.45, glow: 1.3, tint: 0x323a48, rows: 1 });
    k.skyline({ z: 120, count: 30, spacing: 12, scale: 3.6, base: -200, seed: 98, lit: 0.4, glow: 1.1, tint: 0x2a3140, rows: 1 });
    k.skyline({ z: -40, count: 14, spacing: 14, scale: 4.4, base: -200, seed: 99, lit: 0.45, glow: 1.2, tint: 0x2c3444, x: -140, rows: 1 });
    k.skyline({ z: -40, count: 14, spacing: 14, scale: 4.4, base: -200, seed: 100, lit: 0.45, glow: 1.2, tint: 0x2c3444, x: 140, rows: 1 });
    // the spire to the south: a tapering deco tower with a lit crown
    for (let i = 0; i < 6; i++) k.box(30 - i * 4, 40, 30 - i * 4, 0, -180 + i * 40 + 20, -190, k.pbr('rockFacade', X.windows(51, 0.35, 0x8a8272, true), 0.12, { emissive: 0xffffff, emissiveIntensity: 1.1, roughness: 0.6, stretch: 0.42 }));
    k.cyl(1.2, 40, 0, 80, -190, steel, 0.2, 10);
    k.point(0, 62, -190, 0xffffff, 800, 120);
    // binoculars, benches, lamps
    for (const x of [-10, 0, 10]) { k.cyl(0.08, 1.2, x, 0.6, 8.6, steel, 0.08, 8); k.box(0.7, 0.3, 0.4, x, 1.3, 8.6, steel); k.keepOut.push({ x, z: 8.6, r: 0.5 }); }
    for (const x of [-6, 6]) k.bench(x, -2, 0, k.pbr('benchR', X.planks(0x6a5a45, 3, 52), 1.2), steel, 2.4);
    k.prop('lantern', 14, 0.2, 6, { height: 0.9 });
    k.prop('lantern', -14, 0.2, 6, { height: 0.9 });
    k.censusWall({ x: 0, y: 3.2, z: -9.35, rotY: 0, cols: 26, rows: 3, tile: 0.55, gap: 0.05, start: ctx.wallStart(2500, 78), pieces: ctx.all, backing: lime });
    k.sign('TOP OF THE ROCK  ·  SEVENTY FLOORS', 8, 0.7, 0, 5.4, -9.35, '#2a2a30', '#f4efe0', 80, 0, { border: true });
    // the works: glass mounted panels on the deck edges facing in, on the piers, on the upper terraces
    const mounts: Mount[] = [];
    for (let i = 0; i < 8; i++) { const x = -14 + i * 4; mounts.push({ position: v(x, 1.6, 9.45), rotation: PI, target: v(x, 3, 5), width: 3.4, height: 2.0, style: 'steel', wash: false }); }
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = 6 - i * 6; mounts.push({ position: v(s * 16.45, 1.6, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 12, 3, z), width: 3.4, height: 2.0, style: 'steel', wash: false }); }
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const z = -12 - i * 5; mounts.push({ position: v(s * 12.45, 9.1, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 8.5, 10.5, z), width: 3.2, height: 1.9, style: 'steel', wash: false }); }
    for (const x of [-5, 5]) mounts.push({ position: v(x, 16.6, -29.55), rotation: 0, target: v(x, 18, -25), width: 3.4, height: 2.0, style: 'steel', wash: false });
    return { mounts, spawn: v(0, 3, -4), look: v(0, 3, 60), eye: 3, bounds: [-16.6, 16.6, -29.6, 9.4], style: 'steel', floorY: (x, z) => {
      for (const [y, zz, w, d] of decks) if (Math.abs(x) < w / 2 && z > zz - d / 2 && z < zz + d / 2) { if (Math.abs(Math.abs(x) - 12) < 2 && z > -14 && z < -8) return ((-8 - z) / 6) * 7.5; if (Math.abs(Math.abs(x) - 8) < 1.5 && z > -26 && z < -21) return 7.5 + ((-21 - z) / 5) * 7.5; return y; }
      return 0;
    } };
  },
};

/* ---------------- 35 THE FRICK GARDEN COURT ---------------- */
export const frick: RoomDef = {
  id: 'frick',
  name: 'The garden court',
  area: 'THE FRICK',
  mood: 'Gilded quiet',
  color: '#d9cfb0',
  description: 'A Fifth Avenue mansion, the skylit garden court with its fountain and ionic columns, the census where the old masters hang.',
  signatures: 'The limestone mansion behind its lawn and iron fence on Fifth Avenue, the glass roofed garden court with paired ionic columns and a central fountain, the paneled galleries opening off it.',
  build(k, ctx) {
    k.sky({ top: 0x7ea9d6, horizon: 0xe8e8e0, ground: 0x5a5a4a, fog: 0.0026, sun: { az: 1.8, el: 0.6, color: 0xfff3dc, size: 14 }, env: 0.9 });
    k.hemi(0xf6f4ea, 0x4a4a3a, 0.9);
    k.sun(0xfff0d4, 2.2, 20, 60, 20, true, 70);
    const lime = k.pbr('frickLime', X.ashlar(0xd9d0ba, 53, 3), 0.2),
      marble = k.pbr('courtMarble', X.marble(0xe9e4d8, 0xb3aa98, 12), 0.3, { roughness: 0.25 }),
      floorM = k.pbr('courtFloor', X.marble(0xd6cdbb, 0x9a8f7a, 13), 0.35, { roughness: 0.3 }),
      panel = k.pbr('frickPanel', X.planks(0x5a3d2a, 3, 54), 0.8, { roughness: 0.5 }),
      damask = k.pbr('damask', X.carpet(0x5a2a2a, 0x8a5a4a), 0.6, { roughness: 0.9 }),
      glass = k.glass(0xe6f0f4, 0.16, 0.05),
      iron = k.flat(0x1f242a, 0.75, 0.45),
      water = k.flat(0x3a6a6a, 0.5, 0.2, { transparent: true, opacity: 0.9 }),
      green = k.flat(0x3f6b3a, 0, 0.9),
      lawn = k.pbr('frickLawn', X.grass(0x4c7a3c, 19), 0.15),
      gold = k.pbr('frickGold', X.gilt(0xc9a552), 2, { metalness: 0.85, roughness: 0.3 });
    // Fifth Avenue, the fence, the lawn, the park across
    street(k, { w: 20, len: 120, z: -10, x: -30 });
    k.box(60, 0.4, 20, 4, -0.2, 20, lawn);
    k.rail(-19, 20, 60, iron, 2.2, 'x', 1.2);
    for (const x of [-22, -6, 10, 26]) k.box(0.8, 2.8, 0.8, -19, 1.4, x - 6, lime);
    for (let i = 0; i < 6; i++) k.tree(-14 + i * 8, 0, 26, { kind: 'round', h: 5, r: 2.6, leaf: 0x4a7a3c, seed: i });
    k.box(120, 0.4, 100, -80, -0.2, -30, lawn);
    const rnd = X.mulberry(35);
    for (let i = 0; i < 30; i++) k.tree(-48 - rnd() * 50, 0, -60 + rnd() * 80, { kind: 'round', h: 7 + rnd() * 5, r: 4 + rnd() * 3, leaf: 0x3f6b36, seed: 40 + i });
    // the mansion: a limestone block with a rusticated base and the garden court's glass roof in the middle
    const MX = 4, MZ = -14, MW = 56, MD = 40;
    k.box(MW, 14, MD, MX, 7, MZ, lime);
    k.box(MW + 0.6, 0.8, MD + 0.6, MX, 14, MZ, lime);
    k.moulding([[0, 0], [1.0, 0], [1.1, 0.3], [0.8, 0.5], [0.9, 0.8], [0.4, 1.0], [0, 1.2]], MW + 1, MX - MW / 2 - 0.05, 12.6, MZ, lime, 0);
    for (let x = -24; x <= 24; x += 6) for (const y of [3.4, 9]) { k.box(0.2, 3, 1.8, MX - MW / 2 - 0.05, y, MZ + x, lime); k.box(0.05, 2.6, 1.5, MX - MW / 2 + 0.05, y, MZ + x, glass); }
    k.box(4, 6, 0.8, MX - MW / 2, 3, MZ + 12, panel);
    k.box(6, 1.2, 1.6, MX - MW / 2 - 0.4, 6.4, MZ + 12, lime);
    for (const dz of [-2.6, 2.6]) k.column(MX - MW / 2 - 1.2, 0.1, MZ + 12 + dz, 6.2, 0.4, lime, true);
    // the court: a glass roofed room in the centre, the mansion around it
    const CX = MX, CZ = MZ, CW = 22, CD = 26;
    k.box(CW + 8, 0.4, CD + 8, CX, 14.2, CZ, glass);
    for (let x = -CW / 2 - 2; x <= CW / 2 + 2; x += 2.8) k.box(0.14, 0.3, CD + 8, CX + x, 14.3, CZ, iron);
    for (let z = -CD / 2 - 2; z <= CD / 2 + 2; z += 2.8) k.box(CW + 8, 0.3, 0.14, CX, 14.3, CZ + z, iron);
    k.box(MW, 0.4, MD, MX, -0.05, MZ, floorM);
    k.mesh(new T.CylinderGeometry(3.6, 3.8, 0.7, 40), marble, CX, 0.35, CZ);
    k.mesh(new T.CylinderGeometry(3.2, 3.2, 0.7, 40), water, CX, 0.4, CZ);
    k.lathe([[0.9, 0], [0.6, 0.4], [0.3, 1.2], [1.2, 1.4], [1.2, 1.6], [0.2, 1.8], [0.2, 2.6]], CX, 0.7, CZ, marble, 24);
    k.keepOut.push({ x: CX, z: CZ, r: 4.2 });
    for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2; k.mesh(new T.CylinderGeometry(0.03, 0.08, 2, 6), k.glow(0xdff4ff), CX + Math.cos(a) * 0.9, 2.6, CZ + Math.sin(a) * 0.9, true).rotation.z = Math.cos(a) * 0.3; }
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = CZ - 9 + i * 6; for (const d of [-0.9, 0.9]) k.column(CX + s * (CW / 2 + 1.2), 0.1, z + d, 12.6, 0.44, marble, true); }
    for (let i = 0; i < 3; i++) { const x = CX - 6 + i * 6; for (const d of [-0.9, 0.9]) { k.column(x + d, 0.1, CZ - CD / 2 - 1.2, 12.6, 0.44, marble, true); k.column(x + d, 0.1, CZ + CD / 2 + 1.2, 12.6, 0.44, marble, true); } }
    for (const s of [-1, 1]) k.box(1.2, 1.4, CD + 2.4, CX + s * (CW / 2 + 1.2), 13.3, CZ, marble);
    for (const s of [-1, 1]) k.box(CW + 2.4, 1.4, 1.2, CX, 13.3, CZ + s * (CD / 2 + 1.2), marble);
    for (const s of [-1, 1]) { k.box(2, 0.8, 8, CX + s * 8, 0.4, CZ, marble); for (let j = -3; j <= 3; j += 1.5) k.sphere(0.6, CX + s * 8, 1.3, CZ + j, green, 8); k.keepOut.push({ x: CX + s * 8, z: CZ, r: 4.6 }); }
    // the galleries around the court: paneled walls with damask, the works in gilt
    for (const s of [-1, 1]) { k.box(0.4, 14, MD, MX + s * (CW / 2 + 4), 7, MZ, panel); k.box(0.1, 8, MD - 4, MX + s * (CW / 2 + 3.7), 5, MZ, damask); }
    k.box(MW, 14, 0.4, MX, 7, MZ - CD / 2 - 6, panel);
    k.box(MW, 14, 0.4, MX, 7, MZ + CD / 2 + 6, panel);
    for (const s of [-1, 1]) k.block(MX + s * (CW / 2 + 4) - 0.3, MX + s * (CW / 2 + 4) + 0.3, MZ - MD / 2, MZ + MD / 2);
    k.block(MX - MW / 2, MX + MW / 2, MZ - CD / 2 - 6.3, MZ - CD / 2 - 5.7);
    k.block(MX - MW / 2, MX + MW / 2, MZ + CD / 2 + 5.7, MZ + CD / 2 + 6.3);
    k.block(MX - MW / 2 - 0.3, MX - MW / 2 + 0.3, MZ - MD / 2, MZ + 10);
    k.block(MX - MW / 2 - 0.3, MX - MW / 2 + 0.3, MZ + 14, MZ + MD / 2);
    k.block(MX + MW / 2 - 0.3, MX + MW / 2 + 0.3, MZ - MD / 2, MZ + MD / 2);
    for (const z of [MZ - 8, MZ + 8]) for (const s of [-1, 1]) k.point(MX + s * 20, 9, z, 0xfff0d6, 26, 16);
    k.point(CX, 12, CZ, 0xffffff, 60, 30);
    k.censusWall({ x: MX, y: 4.6, z: MZ + CD / 2 + 5.75, rotY: PI, cols: 26, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(3000, 104), pieces: ctx.all, backing: panel });
    k.sign('FIFTH AVENUE  ·  THE GARDEN COURT', 8, 0.7, MX, 8.4, MZ + CD / 2 + 5.75, '#3a2a1a', '#f4e8c8', 90, PI, { border: true });
    // the works: the two long galleries in gilt, the court's end walls, the avenue front
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const z = MZ - 14 + i * 7; mounts.push({ position: v(MX + s * (CW / 2 + 3.64), 3.6, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(MX + s * (CW / 2 + 9), 3, z), width: 4.4, height: 2.6, style: 'gilt' }); }
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const x = MX - 12 + i * 12; mounts.push({ position: v(x, 3.6, MZ - CD / 2 - 5.76), rotation: 0, target: v(x, 3, MZ - CD / 2), width: 4.4, height: 2.6, style: 'gilt' }); break; }
    for (const x of [MX - 20, MX + 20]) mounts.push({ position: v(x, 3.6, MZ + CD / 2 + 5.76), rotation: PI, target: v(x, 3, MZ + CD / 2), width: 4.4, height: 2.6, style: 'gilt' });
    for (const x of [MX - 8, MX + 8]) mounts.push({ position: v(x, 3.6, MZ - CD / 2 - 5.76), rotation: 0, target: v(x, 3, MZ - CD / 2), width: 4.4, height: 2.6, style: 'gilt' });
    for (let i = 0; i < 4; i++) { const z = MZ - 12 + i * 8; if (Math.abs(z - (MZ + 12)) < 3) continue; mounts.push({ position: v(MX - MW / 2 - 0.1, 3.4, z), rotation: PI / 2, target: v(MX - MW / 2 - 5, 3, z), width: 3.2, height: 1.9, style: 'black', wash: false }); }
    return { mounts, spawn: v(MX - MW / 2 - 14, 3, MZ + 14), look: v(MX - MW / 2, 5, MZ - 2), eye: 3, bounds: [MX - MW / 2 - 16, MX + MW / 2 - 1, MZ - MD / 2 + 1, MZ + MD / 2 + 8], style: 'gilt' };
  },
};

/* ---------------- 36 SOUTH STREET SEAPORT ---------------- */
export const seaport: RoomDef = {
  id: 'seaport',
  name: 'The tall ship',
  area: 'SOUTH STREET SEAPORT',
  mood: 'Morning fog lifting',
  color: '#9fb8c4',
  description: 'Cobblestones, the brick counting houses, a square rigger at the pier, the census hung in the rigging and along the row.',
  signatures: 'The Schermerhorn Row brick warehouses, Belgian block paving, the iron and timber pier, a three masted ship with yards and rigging, the bridge over the rooftops.',
  build(k, ctx) {
    k.sky({ top: 0x8fa9c4, horizon: 0xe6e8e6, ground: 0x5a6068, fog: 0.005, sun: { az: 1.1, el: 0.35, color: 0xfff0d6, size: 18 }, haze: 0.45, env: 0.8 });
    k.hemi(0xeef2f8, 0x3a4048, 0.85);
    k.sun(0xffefd8, 1.8, 40, 30, 40, true, 80);
    const cobble = k.pbr('belgian', X.cobble(0x6a6862, 22), 0.9),
      brick = k.pbr('seaportBrick', X.brick(0x7a4a3a, 55), 0.28),
      granite = k.pbr('seaportGranite', X.ashlar(0x8a8a86, 56, 2), 0.35),
      timber = k.pbr('pierTimber', X.planks(0x5a4a3a, 5, 57), 0.7),
      hull = k.pbr('shipHull', X.steel(0x1a2a3a, true, 58), 0.4, { metalness: 0.5, roughness: 0.6 }),
      deck = k.pbr('shipDeck', X.planks(0xb89a70, 10, 59), 0.9),
      mast = k.pbr('mast', X.planks(0x8a6a48, 3, 60), 1.4),
      rope = k.flat(0xc9b89a, 0, 0.9),
      iron = k.flat(0x1f242a, 0.75, 0.45),
      sail = k.flat(0xf1ede2, 0, 0.9, { side: T.DoubleSide }),
      glass = k.glass(0xbfd6e2, 0.3, 0.08),
      warm = k.glow(0xffd8a0);
    // the water, the pier, the street of Belgian block
    k.water({ y: -1.6, color: 0x2e4a58, w: 400, d: 300, x: 60, z: -60, amp: 1.2 });
    k.box(40, 0.5, 90, -20, -0.25, -20, cobble);
    k.box(14, 0.6, 70, 12, -0.3, -30, timber);
    for (let z = 0; z > -64; z -= 4) for (const dx of [-6, 6]) k.cyl(0.28, 3.4, 12 + dx, -1.5, z, timber, 0.28, 8);
    k.rail(18.8, -30, 70, iron, 1.0, 'z', 1.5);
    k.rail(5.2, -30, 70, iron, 1.0, 'z', 1.5);
    for (const z of [-6, -30, -54]) { k.prop('cleat', 7, 0, z, { height: 0.5 }); k.prop('cleat', 17, 0, z, { height: 0.5 }); }
    k.prop('buoy', 8, 0, 4, { height: 1.9, keepOut: 0.8 });
    k.prop('lobster_trap', 16, 0, -14, { height: 0.9, rotY: 0.4 });
    k.prop('life_ring', 18.9, 1.2, -20, { height: 0.9, rotY: PI / 2 });
    k.prop('bell', 4.4, 1.8, -2, { height: 0.9 });
    k.box(0.25, 1.8, 0.25, 4.4, 0.9, -2, iron);
    // the row: brick counting houses with granite piers, shopfronts on the ground floor
    for (let i = 0; i < 7; i++) {
      const z = 14 - i * 10, h = 14 + (i % 3) * 2;
      k.box(12, h, 9.6, -26, h / 2, z, brick);
      k.box(12.4, 0.6, 9.8, -26, h, z, granite);
      for (let dz = -3.6; dz <= 3.6; dz += 2.4) { k.box(0.6, 3.6, 0.5, -20, 1.8, z + dz, granite); }
      k.box(0.1, 3.4, 8.4, -19.85, 1.9, z, glass);
      for (let y = 6; y < h - 1; y += 2.8) for (const dz of [-3, 0, 3]) { k.box(0.2, 2, 1.3, -19.94, y, z + dz, granite); k.box(0.05, 1.7, 1.05, -19.86, y, z + dz, (i + Math.round(y)) % 3 === 0 ? warm : glass); }
      if (i % 2 === 1) k.prop('fire_escape', -18.95, 7, z + 2, { height: 3.2, rotY: -PI / 2 });
    }
    k.block(-32.4, -19.6, -50, 20);
    for (const z of [8, -18, -44]) k.lamp(-15, z, 6, iron, 0xffd9a8, 26);
    k.prop('lamppost', 2, 0, -46, { height: 6 });
    k.sign('SCHERMERHORN ROW  ·  1812', 6, 0.6, -19.8, 4.4, -16, '#2a3a48', '#f4efe0', 80, PI / 2, { border: true });
    // the ship: hull, deck, three masts with yards, rigging, furled sails
    const SX = 28, SZ = -34, SL = 70;
    const h = k.mesh(new T.SphereGeometry(1, 24, 12, 0, PI * 2, PI / 2, PI / 2), hull, SX, 1.8, SZ);
    h.scale.set(6.5, 5.2, SL / 2);
    const hd = k.mesh(new T.CylinderGeometry(6.4, 6.4, SL - 6, 24, 1, false, 0, PI), hull, SX, 1.8, SZ);
    hd.rotation.set(PI / 2, 0, PI / 2);
    hd.rotation.z = -PI / 2;
    hd.rotation.set(0, 0, PI / 2);
    hd.rotation.y = PI / 2;
    k.box(12.4, 0.4, SL - 8, SX, 2.6, SZ, deck);
    k.box(12.6, 1.1, SL - 6, SX, 2.0, SZ, hull);
    k.mesh(new T.ConeGeometry(4, 16, 12), hull, SX, 1.8, SZ + SL / 2 + 6).rotation.x = PI / 2;
    k.beam(v(SX, 3, SZ + SL / 2 + 8), v(SX, 8, SZ + SL / 2 + 26), 0.3, mast, 8);
    k.rail(SX - 6, SZ, SL - 8, iron, 1.0, 'z', 1.6);
    k.rail(SX + 6, SZ, SL - 8, iron, 1.0, 'z', 1.6);
    k.box(6, 2.4, 10, SX, 3.9, SZ - 24, timber);
    k.prop('ships_wheel', SX, 3.2, SZ - 30, { height: 1.6, rotY: 0 });
    k.prop('porthole', SX + 6.5, 1.0, SZ - 10, { height: 0.7, rotY: PI / 2 });
    k.prop('porthole', SX + 6.5, 1.0, SZ + 10, { height: 0.7, rotY: PI / 2 });
    for (const mz of [SZ - 20, SZ, SZ + 20]) {
      k.beam(v(SX, 2.8, mz), v(SX, 46, mz), 0.42, mast, 10);
      k.beam(v(SX, 46, mz), v(SX, 58, mz), 0.22, mast, 8);
      for (const [y, w] of [[14, 30], [24, 26], [34, 22], [44, 16]]) {
        k.beam(v(SX - w / 2, y, mz), v(SX + w / 2, y, mz), 0.2, mast, 8);
        const s = k.mesh(new T.PlaneGeometry(w - 1, 1.6), sail, SX, y - 1.0, mz + 0.3);
        s.rotation.x = 0.15;
        for (let x = -w / 2 + 2; x < w / 2; x += 4) k.beam(v(SX + x, y, mz), v(SX + x, y - 6, mz), 0.015, rope, 3);
      }
      for (const s of [-1, 1]) for (let i = 0; i < 6; i++) k.beam(v(SX + s * 6.2, 3.2, mz - 6 + i * 2.4), v(SX + s * 1.0, 45, mz), 0.03, rope, 4);
      for (let i = 0; i < 10; i++) { const y = 6 + i * 3.6; for (const s of [-1, 1]) k.beam(v(SX + s * (6 - i * 0.5), y, mz), v(SX + s * (1 + (9 - i) * 0.5), y + 3.6, mz - 1), 0.012, rope, 3); }
    }
    k.beam(v(SX, 58, SZ + 20), v(SX, 14, SZ + SL / 2 + 22), 0.05, rope, 4);
    k.beam(v(SX, 58, SZ - 20), v(SX, 8, SZ - SL / 2 - 4), 0.05, rope, 4);
    k.block(SX - 7, SX + 7, SZ - SL / 2, SZ + SL / 2);
    // the gangway onto the deck, and the deck as walkable ground
    for (let i = 0; i < 6; i++) k.box(2.4, 0.3, 1.2, 20 + i * 0.6, 0.15 + i * 0.5, SZ + 8 - i * 0.2, timber);
    k.blocks.pop();
    k.block(SX - 7, SX - 6.2, SZ - SL / 2 + 3, SZ + 6);
    k.block(SX - 7, SX - 6.2, SZ + 10, SZ + SL / 2 - 3);
    k.block(SX + 6.2, SX + 7, SZ - SL / 2 + 3, SZ + SL / 2 - 3);
    k.block(SX - 7, SX + 7, SZ - SL / 2 - 1, SZ - SL / 2 + 3);
    k.block(SX - 7, SX + 7, SZ + SL / 2 - 3, SZ + SL / 2 + 1);
    k.keepOut.push({ x: SX, z: SZ - 24, r: 6 });
    for (const mz of [SZ - 20, SZ, SZ + 20]) k.keepOut.push({ x: SX, z: mz, r: 0.9 });
    // the bridge over the rooftops, the far shore
    for (const x of [-60, 20]) { for (const dz of [-2, 2]) k.arch(4, 18, 3, x, 6, -140 + dz, granite, true, 0.7); k.box(12, 0.9, 6, x, 30, -140, granite); }
    k.box(160, 0.6, 6, -20, 12, -140, iron);
    for (const z of [-137.5, -142.5]) { const pts = []; for (let i = 0; i <= 80; i++) { const x = -100 + i * 2; const y = Math.abs(x + 20) <= 40 ? 15 + 14 * ((x + 20) / 40) ** 2 : 29 - 14 * ((Math.abs(x + 20) - 40) / 40); pts.push(v(x, y, z)); if (i % 2 === 0) k.beam(v(x, 12.5, z), v(x, y, z), 0.03, k.flat(0xd8dde2, 0.6, 0.4), 4); } k.curve(pts, 0.1, k.flat(0xd8dde2, 0.6, 0.4), 80); }
    k.skyline({ z: -220, count: 30, spacing: 8, scale: 2.4, base: -2, seed: 101, lit: 0.2, glow: 0.4, tint: 0x6e7684 });
    k.skyline({ z: 90, count: 20, spacing: 10, scale: 3.2, base: -2, seed: 102, lit: 0.2, glow: 0.4, tint: 0x5e6674, rows: 1 });
    k.censusWall({ x: -19.8, y: 3.4, z: -28, rotY: PI / 2, cols: 14, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(2800, 56), pieces: ctx.all, backing: granite });
    // the works: along the row's shopfronts, on the pier rail screens, hung in the rigging as banners
    const mounts: Mount[] = [];
    for (let i = 0; i < 6; i++) { const z = 14 - i * 10; if (i === 4) continue; mounts.push({ position: v(-19.8, 3.4, z), rotation: PI / 2, target: v(-14, 3, z), width: 4.6, height: 2.7, style: 'oak' }); }
    for (let i = 0; i < 5; i++) { const z = -2 - i * 12; k.box(0.3, 4, 5, 18.9, 2.6, z, timber); mounts.push({ position: v(18.72, 3.0, z), rotation: PI / 2, target: v(14, 3, z), width: 4.4, height: 2.6, style: 'oak', wash: false }); }
    for (const mz of [SZ - 20, SZ, SZ + 20]) for (const y of [8, 19, 29]) { mounts.push({ position: v(SX - 6.5, y, mz + 1.2), rotation: PI / 2, target: v(SX - 3, 3, mz + 6), width: 4.6, height: 3.4, style: 'none', wash: false, lookAt: v(SX - 6.5, y, mz + 1.2) }); }
    mounts.splice(mounts.length - 3, 3);
    for (const x of [SX - 3, SX + 3]) mounts.push({ position: v(x, 4.8, SZ - 29), rotation: PI, target: v(x, 3, SZ - 20), width: 2.6, height: 1.6, style: 'oak', wash: false });
    return { mounts, spawn: v(-8, 3, 20), look: v(SX, 20, SZ), eye: 3, bounds: [-19.4, SX + 6, -66, 22], style: 'oak', floorY: (x, z) => {
      if (x > SX - 6.4 && x < SX + 6.4 && z > SZ - SL / 2 + 3 && z < SZ + SL / 2 - 3) return 2.8;
      if (x > 19 && x <= SX - 6.4 && Math.abs(z - (SZ + 8)) < 1.4) return ((x - 19) / (SX - 6.4 - 19)) * 2.8;
      return 0;
    } };
  },
};
