/* Upgrade batch three (2026-09-23): the market hall and the reading room, rebuilt.

   As with up1.ts and up2.ts nothing is overwritten: `arthuravenue` still lives in
   l.ts and `library` in d.ts, and rooms/index.ts simply imports these instead.
   Ids are unchanged.

   Arthur Avenue had seventeen of its twenty two works rescued at runtime. The
   boards over the stalls hung their pictures facing into the board (the rotation
   signs were swapped), four targets stood inside the market's own walls, and the
   three works on the avenue faced the shopfronts. The room also stopped at the
   door: a brick box with a glass lid on a grey road in white fog.

   The reading room had eighteen of its twenty five works unreachable:
   corridorMounts hung the works inside the bookcases and put every viewing spot at
   x = 6.4, in the middle of the reading tables, which are blocked from 2.6 to 7.8.
   Here the tables are pulled in, the side aisles are kept clear, and the works
   hang in bays cut into the lower tier of shelves. */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as X from '../textures';
import { v, type Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront } from './f';
const PI = Math.PI;
type K = Parameters<RoomDef['build']>[0];
const ONE = new T.Vector3(1, 1, 1);

function figure(k: K, x: number, y: number, z: number, coat: number, p: { h?: number; rotY?: number; skin?: number } = {}) {
  const { h = 1, rotY = 0, skin = 0xc8a284 } = p;
  const b = k.mesh(new T.CapsuleGeometry(0.2, 0.82 * h, 3, 8), k.flat(coat, 0, 0.85), x, y + 0.61 * h, z);
  b.rotation.y = rotY;
  k.mesh(new T.SphereGeometry(0.125, 8, 6), k.flat(skin, 0, 0.7), x, y + 1.22 * h + 0.13, z);
  return b;
}
/* A person as one mesh, so a figure can be moved as a whole on a tick. */
function personGroup(coat: number, skin = 0xc8a284) {
  const g = new T.Group();
  const b = new T.Mesh(new T.CapsuleGeometry(0.2, 0.82, 3, 8), new T.MeshStandardMaterial({ color: coat, roughness: 0.85 }));
  b.position.y = 0.61;
  const h = new T.Mesh(new T.SphereGeometry(0.125, 8, 6), new T.MeshStandardMaterial({ color: skin, roughness: 0.7 }));
  h.position.y = 1.35;
  g.add(b, h);
  return g;
}
/* Seated: a shorter body and a head, merged, for instancing at a table. */
function seatedGeo() {
  const body = new T.CapsuleGeometry(0.19, 0.42, 3, 8); body.translate(0, 0.4, 0);
  const head = new T.SphereGeometry(0.12, 8, 6); head.translate(0, 0.92, 0);
  return mergeGeometries([body, head])!;
}
const mod = (a: number, n: number) => ((a % n) + n) % n;
const at = (x: number, y: number, z: number, ry = 0, s = ONE) => new T.Matrix4().compose(v(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(0, ry, 0)), s);

/* ---------------- 54 THE MARKET HALL (rebuild) ---------------- */
export const arthuravenue2: RoomDef = {
  id: 'arthuravenue',
  name: 'The market hall',
  area: 'ARTHUR AVENUE',
  mood: 'Saturday morning',
  color: '#c89a5a',
  description: 'The Belmont street of bakeries and butchers, awnings down both sides and the produce out on the sidewalk, then the city market the pushcarts moved into: one long brick hall with light coming down the aisles, provolone and salami hanging over the counters, and the works hung over the stalls where the prices would be.',
  signatures: 'The retail market La Guardia built to bring the pushcarts indoors, its brick front and name over the door, the skylit aisles, the stalls with salami and provolone hung from rails, the slicer at the deli counter, the cigar roller by the door, the avenue of awnings with bread and fruit out front.',
  build(k, ctx) {
    k.sky({ top: 0x5f8cc8, horizon: 0xc9d4de, ground: 0x6a6660, fog: 0.0011, sun: { az: 2.6, el: 0.75, color: 0xfff4e6, size: 12 }, env: 0.9 });
    k.hemi(0xf2eee6, 0x8a8478, 0.9);
    k.sun(0xfff0d8, 2.1, 40, 60, 30, true, 90);
    const brick = k.pbr('aa2Brick', X.brick(0x8e5a44, 129), 0.28),
      coping = k.pbr('aa2Coping', X.ashlar(0xd8ceb8, 134, 1), 0.4),
      cream = k.pbr('aa2Cream', X.plaster(0xe8dcc0, 62), 0.3),
      floorC = k.pbr('aa2Floor', X.terrazzo(0xb9b2a4, 63), 0.25),
      steel = k.flat(0x3e464e, 0.7, 0.45),
      glass = k.glass(0xeaf2f6, 0.18, 0.05),
      wood = k.pbr('aa2Wood', X.planks(0x7a5a3a, 5, 131), 1.0),
      crate = k.pbr('aa2Crate', X.planks(0xb89a6a, 3, 132, 0.3), 0.8),
      marble = k.pbr('aa2Marble', X.marble(0xe8e4dc, 0x9a968c, 135), 0.5),
      dark = k.flat(0x22252a, 0.2, 0.6),
      tar = k.flat(0x3a3a3c, 0, 0.95),
      ice = k.flat(0xe8f0f4, 0, 0.3),
      chrome = k.flat(0xc8ccd0, 0.9, 0.25),
      shade = k.glow(0xffe6b8),
      awnings = [k.flat(0x2e6a3a, 0, 0.8), k.flat(0xb8202a, 0, 0.8), k.flat(0xd8cbb0, 0, 0.85), k.flat(0x1f3f6a, 0, 0.8), k.flat(0x7a2a2a, 0, 0.8)],
      hallAwnings = [awnings[0], awnings[1], awnings[3], awnings[4]];

    /* ---- the avenue: road x -7..7, sidewalks to 12 both sides ---- */
    street(k, { w: 14, len: 180, z: 5, x: 0 });
    blockFront(k, { x: 12, z0: 86, count: 21, face: -1, seed: 133, h: [10, 17] });
    blockFront(k, { x: -12, z0: 86, count: 9, face: 1, seed: 136, h: [10, 16] });
    blockFront(k, { x: -12, z0: -46, count: 5, face: 1, seed: 137, h: [11, 16] });
    k.skyline({ z: -130, count: 30, spacing: 8, scale: 0.55, base: -1, seed: 138, lit: 0.1, glow: 0.3, tint: 0x7a6a60, spires: false });
    k.skyline({ z: 150, count: 30, spacing: 8, scale: 0.55, base: -1, seed: 139, lit: 0.1, glow: 0.3, tint: 0x7a6a60, spires: false });
    k.block(-60, -12, 16.6, 100); k.block(-60, -12, -100, -40.6);

    /* the shops: awnings, a name on every fascia, the goods out on the sidewalk */
    const shopNames = ['PANETTERIA', 'SALUMERIA', 'CAFFE', 'PASTICCERIA', 'MACELLERIA', 'FRUTTA E VERDURA', 'PESCHERIA', 'LATTICINI', 'RISTORANTE', 'PANETTERIA', 'ENOTECA', 'PASTA FRESCA', 'MACELLERIA', 'PASTICCERIA'];
    const fruitM: T.Matrix4[] = [], fruitC: number[] = [], breadM: T.Matrix4[] = [];
    const fruitCols = [0xb8202a, 0x3f8a2e, 0xf1c531, 0xe87a2a, 0x7a2a6a, 0x9ac23a];
    const rnd = X.mulberry(140);
    const produce = (x: number, z: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const cx = x, cz = z - (n - 1) * 0.35 + i * 0.7;
        k.box(0.6, 0.35, 0.6, cx, 0.95, cz, crate);
        const col = fruitCols[Math.floor(rnd() * fruitCols.length)];
        for (let j = 0; j < 9; j++) { fruitM.push(at(cx - 0.2 + (j % 3) * 0.2, 1.18 + rnd() * 0.04, cz - 0.2 + Math.floor(j / 3) * 0.2)); fruitC.push(col); }
      }
    };
    let bakeryZ = 0;
    for (const side of [1, -1] as const) {
      for (let i = 0; i < 14; i++) {
        const z = 62 - i * 8;
        if (side < 0 && z < 18 && z > -46) continue;           // the market fills the west side here
        const fx = side * 12, dir = -side;                      // the facade line and the way it faces
        const m = awnings[(i + (side > 0 ? 0 : 2)) % awnings.length];
        const aw = k.box(2.3, 0.08, 6.6, fx + dir * 1.15, 3.35, z, m); aw.rotation.z = side * 0.26;
        k.box(0.04, 0.42, 6.6, fx + dir * 2.28, 2.86, z, m);
        const name = shopNames[(i + (side > 0 ? 0 : 5)) % shopNames.length];
        k.sign(name, 5.6, 0.8, fx + dir * 0.06, 4.35, z, '#1a1c20', '#e8dcc0', Math.min(80, Math.floor(1024 / (0.62 * name.length))), side > 0 ? -PI / 2 : PI / 2, { border: true });
        if (name === 'FRUTTA E VERDURA' || (i % 4 === 1)) { k.box(0.9, 0.7, 5, fx + dir * 0.9, 0.45, z, wood); produce(fx + dir * 0.9, z, 7); k.block(Math.min(fx, fx + dir * 1.4), Math.max(fx, fx + dir * 1.4), z - 2.6, z + 2.6); }
        if (name === 'PANETTERIA' && side > 0) {
          bakeryZ = z;
          k.box(0.5, 1.8, 2.2, fx + dir * 0.5, 0.9, z + 1.8, wood);
          for (let r = 0; r < 4; r++) for (let j = 0; j < 7; j++) breadM.push(new T.Matrix4().compose(v(fx + dir * 0.5, 0.35 + r * 0.42, z + 0.9 + j * 0.3), new T.Quaternion().setFromEuler(new T.Euler(PI / 2, 0, 0)), ONE));
          k.block(fx - 1.0, fx, z + 0.6, z + 3.0);
        }
      }
    }
    /* lamps, a hydrant, the corner pole with the street's name */
    const post = k.flat(0x2a3a2e, 0.6, 0.5);
    for (const [x, z] of [[7.8, 34], [7.8, -18], [-7.8, 30], [-7.8, -52]]) k.lamp(x, z, 5.2, post, 0xffd7a0, k.night > 0.5 ? 60 : 10);
    k.cyl(0.18, 0.7, 8.2, 0.45, 8, k.flat(0xb8202a, 0.3, 0.5), 0.18, 10); k.keepOut.push({ x: 8.2, z: 8, r: 0.4 });
    k.cyl(0.06, 4.2, -7.7, 2.1, 18, post, 0.06, 8); k.keepOut.push({ x: -7.7, z: 18, r: 0.35 });
    k.sign('ARTHUR AV', 1.9, 0.34, -7.7, 4.0, 18, '#1e6a3a', '#ffffff', 90, PI / 2, { double: true });

    /* parked cars at both curbs, a van double parked outside the market */
    const carCols = [0x8a2a2a, 0x2a3f6a, 0xd8d4cc, 0x1a1c20, 0x6a6a6e, 0x3a5a3a, 0xc9a25a];
    const car = (x: number, z: number, c: number, len = 4.4) => {
      k.box(1.8, 0.75, len, x, 0.62, z, k.flat(c, 0.5, 0.35));
      k.box(1.6, 0.6, len * 0.5, x, 1.3, z - len * 0.05, k.flat(0x22303a, 0.6, 0.2));
      for (const dz of [-len * 0.33, len * 0.33]) for (const dx of [-0.85, 0.85]) k.cyl(0.33, 0.24, x + dx, 0.33, z + dz, dark, 0.33, 10).rotation.z = PI / 2;
      k.block(x - 1.0, x + 1.0, z - len / 2 - 0.1, z + len / 2 + 0.1);
    };
    for (let i = 0; i < 9; i++) { car(5.6, 58 - i * 11 - (i % 2) * 2, carCols[i % carCols.length]); if (i !== 5 && i !== 6) car(-5.6, 54 - i * 12, carCols[(i + 3) % carCols.length]); }
    k.box(2.1, 2.3, 5.6, -2.8, 1.35, 36, k.flat(0xe6e2da, 0.3, 0.5)); k.box(2.0, 1.4, 1.6, -2.8, 1.0, 32.4, k.flat(0xe6e2da, 0.3, 0.5));
    k.block(-3.9, -1.7, 31.6, 38.9);
    /* traffic both ways */
    {
      const cars: { g: T.Group; x: number; dir: number; off: number; sp: number }[] = [];
      for (let i = 0; i < 4; i++) {
        const g = new T.Group(), c = carCols[(i * 2 + 1) % carCols.length];
        const body = new T.Mesh(new T.BoxGeometry(1.8, 0.75, 4.4), new T.MeshStandardMaterial({ color: c, metalness: 0.5, roughness: 0.35 })); body.position.y = 0.62;
        const cab = new T.Mesh(new T.BoxGeometry(1.6, 0.6, 2.2), new T.MeshStandardMaterial({ color: 0x22303a, metalness: 0.6, roughness: 0.2 })); cab.position.y = 1.3;
        g.add(body, cab);
        for (const dz of [-1.45, 1.45]) for (const dx of [-0.85, 0.85]) { const w = new T.Mesh(new T.CylinderGeometry(0.33, 0.33, 0.24, 10), dark); w.rotation.z = PI / 2; w.position.set(dx, 0.33, dz); g.add(w); }
        k.add(g);
        const dir = i % 2 ? -1 : 1;
        cars.push({ g, x: dir > 0 ? 2.2 : -1.6, dir, off: i * 47, sp: 6 + i });
        g.position.set(dir > 0 ? 2.2 : -1.6, 0, -60 + i * 38); g.rotation.y = dir > 0 ? 0 : PI;
      }
      if (!ctx.reduced) k.ticks.push((t) => { for (const c of cars) { const s = ((t * c.sp + c.off) % 170); c.g.position.z = c.dir > 0 ? -80 + s : 90 - s; } });
    }

    /* ---- the market: brick hall x -42..-12.6, z -40..16 ---- */
    const HX0 = -42, HX1 = -12.6, HZ0 = -40, HZ1 = 16, MH = 7, DOOR = -12;
    k.box(HX1 - HX0, 0.2, HZ1 - HZ0, (HX0 + HX1) / 2, 0.02, (HZ0 + HZ1) / 2, floorC);
    // the front, with the door and the name over it
    k.box(0.6, MH, DOOR - 2.5 - (HZ0 - 0.6), -12.3, MH / 2, (DOOR - 2.5 + HZ0 - 0.6) / 2, brick);
    k.box(0.6, MH, HZ1 + 0.6 - (DOOR + 2.5), -12.3, MH / 2, (HZ1 + 0.6 + DOOR + 2.5) / 2, brick);
    k.box(0.6, MH - 4.4, 5, -12.3, 4.4 + (MH - 4.4) / 2, DOOR, brick);
    k.box(0.9, 0.35, HZ1 - HZ0 + 1.4, -12.3, MH + 0.15, (HZ0 + HZ1) / 2, coping);
    for (const dz of [-2.75, 2.75]) k.box(0.9, 4.4, 0.5, -12.1, 2.2, DOOR + dz, coping);
    k.box(0.9, 0.5, 6, -12.1, 4.55, DOOR, coping);
    k.box(0.2, 1.5, 12, -11.9, 5.6, DOOR, cream);
    const marketSign = k.sign('ARTHUR AVENUE RETAIL MARKET', 11.6, 1.2, -11.78, 5.6, DOOR, '#e8dcc0', '#7a2418', 56, PI / 2, { border: true });
    k.block(-12.7, -11.8, HZ0 - 1, DOOR - 2.5); k.block(-12.7, -11.8, DOOR + 2.5, HZ1 + 1);
    // the other three walls, with a row of high windows
    for (const [w, d, x, z] of [[HX1 - HX0 + 1.2, 0.6, (HX0 + HX1) / 2, HZ1 + 0.3], [HX1 - HX0 + 1.2, 0.6, (HX0 + HX1) / 2, HZ0 - 0.3], [0.6, HZ1 - HZ0, HX0 - 0.3, (HZ0 + HZ1) / 2]] as const) k.box(w, MH, d, x, MH / 2, z, brick);
    k.block(HX0 - 1, HX1, HZ1, HZ1 + 1); k.block(HX0 - 1, HX1, HZ0 - 1, HZ0); k.block(HX0 - 1, HX0, HZ0, HZ1);
    // the roof: a flat deck over the stalls, a raised lantern of glass over every aisle
    const aisles = [10.48, -0.76, -12.0, -23.24, -34.48], islands = [4.86, -6.38, -17.62, -28.86], AW = 6.24;
    let zPrev = HZ1;
    for (const a of aisles) {
      const za = a + AW / 2, zb = a - AW / 2;
      if (zPrev - za > 0.05) k.box(HX1 - HX0, 0.3, zPrev - za, (HX0 + HX1) / 2, MH + 0.15, (zPrev + za) / 2, tar);
      for (const e of [za, zb]) { k.box(HX1 - HX0, 1.4, 0.08, (HX0 + HX1) / 2, MH + 1.0, e, glass); k.box(HX1 - HX0, 0.12, 0.2, (HX0 + HX1) / 2, MH + 1.72, e, steel); }
      k.box(HX1 - HX0, 0.08, AW, (HX0 + HX1) / 2, MH + 1.76, a, glass);
      for (let x = HX0 + 2; x < HX1; x += 3) k.box(0.1, 0.1, AW, x, MH + 1.72, a, steel);
      zPrev = zb;
    }
    if (zPrev - HZ0 > 0.05) k.box(HX1 - HX0, 0.3, zPrev - HZ0, (HX0 + HX1) / 2, MH + 0.15, (zPrev + HZ0) / 2, tar);
    // trusses across the hall on the island lines, columns inside the islands
    for (const zc of islands) {
      k.box(HX1 - HX0, 0.35, 0.25, (HX0 + HX1) / 2, MH - 0.2, zc, steel);
      for (let x = HX0 + 1.5; x < HX1 - 1; x += 3) { k.beam(v(x, MH - 0.35, zc), v(x + 1.5, MH - 1.3, zc), 0.05, steel, 4); k.beam(v(x + 1.5, MH - 1.3, zc), v(x + 3, MH - 0.35, zc), 0.05, steel, 4); }
      k.box(HX1 - HX0, 0.12, 0.12, (HX0 + HX1) / 2, MH - 1.3, zc, steel);
      for (const x of [-37.7, -29.5, -25.5, -17.3]) k.box(0.3, MH - 0.2, 0.3, x, (MH - 0.2) / 2, zc, steel);
    }
    // light: pendants down the aisles, a few real lamps
    for (const a of aisles) for (let x = HX0 + 5; x < HX1 - 2; x += 7) { k.beam(v(x, MH - 0.1, a), v(x, 5.3, a), 0.015, steel, 3); k.cyl(0.05, 0.3, x, 5.2, a, shade, 0.34, 12); }
    const lampI = k.night > 0.5 ? 55 : 26;
    for (const a of [-0.76, -12, -23.24]) k.point(-27.5, 5.6, a, 0xffe8c8, lampI, 22);
    k.point(-14.8, 5.2, DOOR, 0xffe8c8, lampI * 0.8, 16); k.point(-40, 5.2, -12, 0xffe8c8, lampI * 0.8, 18);

    /* the stalls: four islands in two halves, counters on both faces, a stall along each end wall */
    type Kind = 0 | 1 | 2 | 3 | 4;
    const LABEL = ['FRUTTA E VERDURA', 'SALUMERIA', 'LATTICINI', 'PESCHERIA', 'PANETTERIA'];
    const wheelM: T.Matrix4[] = [], fishM: T.Matrix4[] = [], swingers: { g: T.Group; ph: number }[] = [];
    const salamiMat = new T.MeshStandardMaterial({ color: 0x7a2a2a, roughness: 0.7 }), provMat = new T.MeshStandardMaterial({ color: 0xe8cf88, roughness: 0.55 });
    const hangRail = (x: number, len: number, y: number, z: number, kind: 1 | 2) => {
      const parts: T.BufferGeometry[] = [];
      for (let i = 0; i < len / (kind === 1 ? 0.42 : 0.7); i++) {
        const px = -len / 2 + 0.3 + i * (kind === 1 ? 0.42 : 0.7);
        if (kind === 1) { const l = 0.55 + ((i * 37) % 5) * 0.08; const g = new T.CylinderGeometry(0.08, 0.1, l, 7); g.translate(px, -0.12 - l / 2, 0); parts.push(g); }
        else { const g = new T.SphereGeometry(0.2, 8, 6); g.scale(1, 1.6, 1); g.translate(px, -0.5, 0); parts.push(g); const n = new T.CylinderGeometry(0.06, 0.08, 0.14, 6); n.translate(px, -0.14, 0); parts.push(n); }
      }
      const g = new T.Group();
      const mesh = new T.Mesh(mergeGeometries(parts)!, kind === 1 ? salamiMat : provMat);
      g.add(mesh); g.position.set(x, y, z);
      k.add(g);
      k.box(len, 0.05, 0.05, x, y, z, chrome);
      swingers.push({ g, ph: x * 0.7 + z * 1.3 });
    };
    const goods = (kind: Kind, cx: number, len: number, zf: number, face: 1 | -1) => {
      // zf is the front edge of the counter; face is the way the customer stands
      const zc = zf - face * 0.6;
      if (kind === 0) { for (let i = 0; i < Math.floor(len / 0.7); i++) { const x = cx - len / 2 + 0.4 + i * 0.7; k.box(0.6, 0.3, 0.9, x, 1.2, zc, crate); const col = fruitCols[Math.floor(rnd() * fruitCols.length)]; for (let j = 0; j < 8; j++) { fruitM.push(at(x - 0.18 + (j % 3) * 0.18, 1.42, zc - 0.3 + Math.floor(j / 3) * 0.3)); fruitC.push(col); } } }
      if (kind === 1) { hangRail(cx, len - 0.6, 3.05, zf - face * 0.35, 1); for (let i = 0; i < 4; i++) k.box(0.9, 0.12, 0.5, cx - len / 2 + 1.2 + i * 2.1, 1.14, zc, k.flat(0xc86a6a, 0, 0.6)); }
      if (kind === 2) { hangRail(cx, len - 0.6, 3.05, zf - face * 0.35, 2); for (let i = 0; i < Math.floor(len / 0.6); i++) wheelM.push(at(cx - len / 2 + 0.35 + i * 0.6, 1.17, zc)); }
      if (kind === 3) { k.box(len - 0.4, 0.2, 1.2, cx, 1.15, zc, ice); for (let i = 0; i < Math.floor(len / 0.35); i++) fishM.push(new T.Matrix4().compose(v(cx - len / 2 + 0.4 + i * 0.35, 1.3, zc + (i % 2 ? 0.25 : -0.25)), new T.Quaternion().setFromEuler(new T.Euler(0, PI / 2 + (i % 3) * 0.2, PI / 2)), v(1, 1, 0.45))); }
      if (kind === 4) { k.box(len - 0.6, 0.9, 0.4, cx, 1.55, zf - face * 1.1, wood); for (let i = 0; i < Math.floor(len / 0.32); i++) { breadM.push(new T.Matrix4().compose(v(cx - len / 2 + 0.4 + i * 0.32, 1.2, zc), new T.Quaternion().setFromEuler(new T.Euler(PI / 2, 0, 0)), ONE)); breadM.push(new T.Matrix4().compose(v(cx - len / 2 + 0.4 + i * 0.32, 1.7, zf - face * 1.05), new T.Quaternion().setFromEuler(new T.Euler(PI / 2, 0, 0.3)), ONE)); } }
      k.sign(LABEL[kind], 3.4, 0.46, cx, 2.62, zf + face * 0.03, '#1a1c20', '#e8dcc0', Math.min(76, Math.floor(1024 / (0.62 * LABEL[kind].length))), face > 0 ? 0 : PI, { border: true });
    };
    const coats = [0xe6e2da, 0xd8d0c0, 0xf0ece4];
    const mounts: Mount[] = [];
    const half = (cx: number, zc: number, kinds: [Kind, Kind], len = 9) => {
      k.box(len, 1.0, 5, cx, 0.5, zc, wood);
      k.box(len + 0.2, 0.08, 5.2, cx, 1.04, zc, kinds[0] === 3 || kinds[0] === 2 ? marble : wood);
      k.box(len, 6.0, 0.3, cx, 3.0, zc, dark);                   // the spine the boards hang on
      k.block(cx - len / 2 - 0.1, cx + len / 2 + 0.1, zc - 2.6, zc + 2.6);
      for (const face of [1, -1] as const) {
        const kind = face > 0 ? kinds[0] : kinds[1];
        const can = k.box(len, 0.06, 2.75, cx, 3.3, zc + face * 1.35, hallAwnings[mod(Math.round(cx) + Math.round(zc) + face, hallAwnings.length)]); can.rotation.x = face * 0.22;
        goods(kind, cx, len, zc + face * 2.5, face);
        figure(k, cx + (face > 0 ? -1.8 : 2.1), 0, zc + face * 1.2, coats[(Math.abs(Math.round(cx + zc)) + face + 3) % 3], { rotY: face > 0 ? 0 : PI });
        mounts.push({ position: v(cx, 4.7, zc + face * 0.17), rotation: face > 0 ? 0 : PI, target: v(cx, 3, zc + face * (2.5 + AW / 2)), width: 3.4, height: 1.9, style: 'oak', wash: true });
      }
    };
    const plan: [Kind, Kind][] = [[0, 1], [2, 3], [1, 4], [0, 2], [3, 0], [4, 1], [2, 0], [1, 3]];
    let n = 0;
    for (const zc of islands) for (const cx of [-33.5, -21.5]) half(cx, zc, plan[n++]);
    // the end stalls against the north and south walls
    for (const [zw, face, kinds] of [[HZ1, -1, [0, 4]], [HZ0, 1, [1, 2]]] as const) {
      [-33.5, -21.5].forEach((cx, i) => {
        const zc = zw + face * 1.2;
        k.box(9, 1.0, 2.4, cx, 0.5, zc, wood); k.box(9.2, 0.08, 2.6, cx, 1.04, zc, wood);
        k.block(cx - 4.6, cx + 4.6, Math.min(zw, zc + face * 1.3), Math.max(zw, zc + face * 1.3));
        const can = k.box(9, 0.06, 2.6, cx, 3.3, zc, hallAwnings[(i + 2) % hallAwnings.length]); can.rotation.x = face * 0.2;
        goods(kinds[i] as Kind, cx, 9, zc + face * 1.2, face as 1 | -1);
        figure(k, cx - 2, 0, zw + face * 0.5, coats[i], { rotY: face > 0 ? 0 : PI });
        k.box(4.2, 2.5, 0.1, cx, 4.7, zw + face * 0.02, dark);
        mounts.push({ position: v(cx, 4.7, zw + face * 0.09), rotation: face > 0 ? 0 : PI, target: v(cx, 3, zw + face * (2.4 + AW / 2)), width: 3.4, height: 1.9, style: 'oak', wash: true });
      });
    }
    // instanced goods, one draw each
    { const f = k.instances(new T.IcosahedronGeometry(0.1, 0), new T.MeshStandardMaterial({ roughness: 0.55 }), fruitM); const c = new T.Color(); fruitC.forEach((col, i) => f.setColorAt(i, c.set(col))); if (f.instanceColor) f.instanceColor.needsUpdate = true; }
    k.instances(new T.CapsuleGeometry(0.09, 0.28, 2, 6), k.flat(0xc08a4a, 0, 0.8), breadM);
    k.instances(new T.CylinderGeometry(0.24, 0.24, 0.16, 14), k.flat(0xe6cf8a, 0, 0.6), wheelM);
    k.instances(new T.ConeGeometry(0.1, 0.5, 5), k.flat(0x9aa4ae, 0.6, 0.35), fishM);

    /* the front of the hall: a coffee bar on one side of the door, the cigar roller on the other */
    k.box(1.4, 1.1, 5.2, -16.3, 0.55, 10.6, wood); k.box(1.6, 0.08, 5.4, -16.3, 1.12, 10.6, marble);
    k.box(0.6, 0.55, 0.5, -16.4, 1.43, 9.4, chrome); k.box(0.3, 1.2, 4.6, -16.95, 1.8, 10.6, dark);
    for (let i = 0; i < 4; i++) { k.cyl(0.04, 0.7, -15.2, 0.35, 8.8 + i * 1.2, steel, 0.04, 6); k.cyl(0.2, 0.06, -15.2, 0.72, 8.8 + i * 1.2, k.flat(0x7a2418, 0, 0.6), 0.2, 12); k.keepOut.push({ x: -15.2, z: 8.8 + i * 1.2, r: 0.35 }); }
    k.block(-17.1, -15.5, 7.9, 13.3);
    figure(k, -16.8, 0, 11.2, 0x1a1c20, { rotY: PI / 2 });
    k.sign('CAFFE', 2.2, 0.5, -16.94, 2.9, 10.6, '#1a1c20', '#e8dcc0', 90, PI / 2);
    k.box(1.6, 0.8, 1.2, -14.6, 0.4, -17.6, wood); k.box(1.8, 0.05, 1.4, -14.6, 0.82, -17.6, k.flat(0x5a3a22, 0, 0.6));
    k.block(-15.6, -13.6, -18.4, -16.8);
    k.box(0.5, 1.6, 2.4, -16.6, 0.8, -17.6, k.pbr('aa2Humidor', X.planks(0x5a3a22, 4, 141), 1.2));
    k.sign('SIGARI  FATTI A MANO', 3.2, 0.5, -14.6, 2.6, -18.6, '#1a1c20', '#c9a25a', 60, 0);
    const roller = figure(k, -15.2, -0.3, -17.6, 0x6a4a3a, { rotY: PI / 2, h: 0.85 });
    void roller;
    const cigar = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 0.16, 6), new T.MeshStandardMaterial({ color: 0x5a3a22 }));
    cigar.rotation.z = PI / 2; cigar.position.set(-14.4, 0.87, -17.6); k.add(cigar);
    // the slicer at the salumeria counter, and the man working it
    const slicer = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 0.02, 20), new T.MeshStandardMaterial({ color: 0xd8dce0, metalness: 0.9, roughness: 0.2 }));
    slicer.rotation.x = PI / 2; slicer.position.set(-31, 1.45, islands[0] - 2.1); k.add(slicer);
    k.box(0.5, 0.3, 0.4, -31, 1.2, islands[0] - 2.1, chrome);
    const slicerMan = personGroup(0xf0ece4); slicerMan.position.set(-31, 0, islands[0] - 1.1); slicerMan.rotation.y = PI; k.add(slicerMan);
    // a hand truck of crates, up and down the fourth aisle all morning
    const truck = new T.Group();
    { const base = new T.Mesh(new T.BoxGeometry(1.0, 0.1, 0.7), steel); base.position.y = 0.2; truck.add(base);
      for (let i = 0; i < 3; i++) { const c = new T.Mesh(new T.BoxGeometry(0.6, 0.35, 0.5), crate); c.position.set(0.1, 0.45 + i * 0.37, 0); truck.add(c); }
      const handle = new T.Mesh(new T.BoxGeometry(0.06, 1.3, 0.6), steel); handle.position.set(-0.45, 0.8, 0); truck.add(handle);
      const pusher = personGroup(0x33477f); pusher.position.x = -1.0; truck.add(pusher);
      truck.position.set(-27, 0, aisles[3]); k.add(truck); }
    // shoppers in the aisles, and on the avenue
    k.crowd([v(-14.5, 0, -12), v(-40, 0, -12), v(-40, 0, -0.76), v(-14.5, 0, -0.76), v(-14.5, 0, 10.48), v(-40, 0, 10.48), v(-39.8, 0, -1), v(-15, 0, -1)], 18, { seed: 54, speed: 0.45, spread: 0.9, closed: true, animate: !ctx.reduced });
    k.crowd([v(-15, 0, -13), v(-27.5, 0, -13), v(-27.5, 0, -34.48), v(-40, 0, -34.48), v(-40, 0, -23.24), v(-15, 0, -23.24)], 14, { seed: 56, speed: 0.4, spread: 0.8, closed: true, animate: !ctx.reduced });
    k.crowd([v(9.6, 0, 80), v(9.6, 0, -70)], 18, { seed: 55, speed: 1.0, spread: 1.2, animate: !ctx.reduced });
    k.crowd([v(-9.4, 0, -70), v(-9.4, 0, 80)], 16, { seed: 57, speed: 0.9, spread: 1.0, animate: !ctx.reduced });
    k.crowd([v(-9.6, 0, -8), v(0, 0, -6), v(9.6, 0, -4)], 5, { seed: 58, speed: 0.8, spread: 1.0, animate: !ctx.reduced });
    /* the last pushcart on the avenue, parked outside the hall that replaced it */
    k.box(1.1, 0.5, 2.0, -9.6, 1.0, 5.5, wood);
    for (const dz of [-0.6, 0.6]) k.cyl(0.42, 0.06, -9.6 + (dz > 0 ? 0.62 : -0.62) * 0, 0.45, 5.5 + dz * 1.2, wood, 0.42, 12).rotation.z = PI / 2;
    k.beam(v(-9.6, 1.2, 6.5), v(-9.6, 1.0, 7.6), 0.04, wood, 4);
    produce(-9.6, 5.5, 3);
    k.block(-10.3, -8.9, 4.4, 7.7);

    /* the census wall on the back wall of the hall */
    k.censusWall({ x: HX0 + 0.05, y: 4.1, z: (HZ0 + HZ1) / 2, rotY: PI / 2, cols: 36, rows: 5, tile: 0.55, gap: 0.05, start: ctx.wallStart(6500, 180), pieces: ctx.all, backing: dark });
    k.sign('BELMONT  ·  THE MARKET  ·  THE BRONX', 9, 0.6, HX0 + 0.06, 6.3, (HZ0 + HZ1) / 2, 'transparent', '#e8dcc0', 70, PI / 2);

    /* the works: over every stall (above), and four on the brick front, to the street */
    for (const z of [9, 0, -24, -33]) { k.box(0.1, 2.3, 3.8, -11.95, 3.1, z, dark); mounts.push({ position: v(-11.88, 3.1, z), rotation: PI / 2, target: v(-8.4, 3, z), width: 3.2, height: 1.9, style: 'black', wash: true }); }

    /* motion */
    if (!ctx.reduced) k.ticks.push((t) => {
      for (const s of swingers) s.g.rotation.x = 0.045 * Math.sin(t * 1.1 + s.ph);
      slicer.rotation.y = t * 14;
      slicerMan.position.x = -31 + 0.12 * Math.sin(t * 2.2);
      cigar.rotation.x = t * 3; cigar.position.x = -14.4 + 0.06 * Math.sin(t * 1.7);
      const s = Math.sin(t * 0.09), c = Math.cos(t * 0.09);
      truck.position.x = -27.5 + 11.5 * s;
      truck.rotation.y = c >= 0 ? 0 : PI;
    });

    /* eggs */
    const hdc = { name: 'Arthur Avenue Retail Market, Historic Districts Council', url: 'https://6tocelebrate.org/site/arthur-avenue-retail-market/' };
    k.egg(marketSign, { id: 'the-retail-market', title: 'Off the street, under one roof', year: '1941', text: 'The Historic Districts Council dates the opening to October 28, 1941, with 120 stalls for the sale of meat, poultry, fish, vegetables and other items sold on pushcarts. Other accounts put it in 1940. Either way the city built it, to bring the peddlers indoors.', clue: 'Read the name over the door, then count the stalls inside.', source: hdc }, { r: 3 });
    k.egg(v(-9.6, 1.4, 5.5), { id: 'the-pushcarts', title: 'Why the pushcarts went indoors', text: 'In the 1930s the roadbed of Arthur Avenue was covered with crowded stalls. Mayor La Guardia thought street markets were bad for the city\'s image, got in the way of fire engines and ambulances, and would be much easier to regulate and tax inside city owned buildings.', clue: 'One pushcart is still parked outside the hall that replaced it.', source: hdc }, { r: 1.8 });
    k.egg(v(-27.5, 3, -12), { id: 'one-of-ten', title: 'One of ten', text: 'The market belongs to a system of enclosed city markets built between 1937 and 1955. At its peak there were 10 of them in Manhattan, Brooklyn and the Bronx, with space for 2,110 vendors, far fewer than the pushcarts they were meant to replace.', clue: 'Stand where the aisles cross under the glass and look both ways.', source: { name: 'New York City\'s Public Markets, Past and Present, Turnstile Tours', url: 'https://turnstiletours.com/new-york-citys-public-markets-past-present/' } }, { r: 2.4 });
    const wiki = { name: 'Arthur Avenue, Wikipedia', url: 'https://en.wikipedia.org/wiki/Arthur_Avenue' };
    k.egg(v(-7.7, 4.0, 18), { id: 'named-for-arthur', title: 'A president\'s street', text: 'The avenue is named for Chester A. Arthur, the 21st president. When the streets were laid out in the late nineteenth century, Catherine Lorillard, an admirer of his, asked that the main street of the area carry his name.', clue: 'Look up at the green blade on the corner pole.', source: wiki }, { r: 1.6 });
    k.egg(v(0, 1.6, 52), { id: 'greatest-street', title: 'One of the great streets', year: '2016', text: 'In 2016 the American Planning Association named Arthur Avenue one of America\'s Greatest Streets. It runs 1.2 miles, from Crotona Park North in Tremont to Fordham Road in Belmont.', clue: 'Walk north up the avenue until you are standing in the middle of it.', source: wiki }, { r: 2.4 });
    k.egg(v(10.6, 3.2, bakeryZ), { id: 'zoo-and-reservoir', title: 'Built by the builders', text: 'With the construction of the Bronx Zoo and the Jerome Park Reservoir at the turn of the twentieth century, a large wave of Italian immigrants moved into Belmont. The commercial heart of the neighborhood is still Arthur Avenue and East 187th Street.', clue: 'Stand under the bakery awning across the avenue from the market.', source: { name: 'Belmont, Bronx, Wikipedia', url: 'https://en.wikipedia.org/wiki/Belmont,_Bronx' } }, { r: 2 });

    return { mounts, spawn: v(4, 3, 18), look: v(-13, 3.4, -10), eye: 3, bounds: [HX0 + 0.6, 11.6, -60, 72], style: 'oak' };
  },
};

/* ---------------- 15 THE ROSE READING ROOM (rebuild) ---------------- */
export const library2: RoomDef = {
  id: 'library',
  daylit: false,
  name: 'City of stories',
  area: 'NYPL ROSE READING ROOM',
  mood: 'Quiet afternoon',
  color: '#c4a47a',
  description: 'Seventy eight feet by two hundred and ninety seven under a painted sky, two halls of oak tables and bronze lamps either side of the delivery desk, two tiers of books with a gallery between them, and the afternoon coming in through the high west windows. You come in from Fifth Avenue, past the lions.',
  signatures: 'The reading room built to its own plan with the delivery desk in the middle, the long oak tables with their bronze lamps and readers at them, two tiers of bookcases and the gallery, the tall windows, the coffered gilt ceiling with painted skies, the chandeliers, and outside the marble front on Fifth Avenue with Patience and Fortitude on the steps.',
  build(k, ctx) {
    k.sky({ top: 0x86a8d4, horizon: 0xe8dcc8, ground: 0x6b5f4d, fog: 0.0016, sun: { az: 4.5, el: 0.42, color: 0xffe0b0, size: 16 }, env: 0.6 });
    k.hemi(0xfff0dc, 0x8a8478, 0.7);
    k.sun(0xffdcae, 2.4, -60, 34, -20, true, 110);
    const oak = k.pbr('lb2Oak', X.planks(0x7a5334, 8, 12), 0.6, { roughness: 0.55 }),
      oakDark = k.pbr('lb2OakDark', X.planks(0x5c3d26, 4, 13), 1.0, { roughness: 0.5 }),
      plaster = k.pbr('lb2Plaster', X.plaster(0xd9c9a8, 12), 0.4, { roughness: 0.8 }),
      ochre = k.pbr('lb2Ochre', X.plaster(0xa8804a, 14), 0.4, { roughness: 0.7 }),
      gold = k.pbr('lb2Gold', X.gilt(0xc9a552), 2, { metalness: 0.8, roughness: 0.35 }),
      bronze = k.flat(0x6b4f2a, 0.85, 0.35),
      books = k.pbr('lb2Books', X.planks(0x6a3a2a, 14, 15), 2.2, { roughness: 0.85 }),
      books2 = k.pbr('lb2Books2', X.planks(0x2f4a5a, 12, 16), 2.2, { roughness: 0.85 }),
      books3 = k.pbr('lb2Books3', X.planks(0x5a5a2a, 13, 17), 2.2, { roughness: 0.85 }),
      marbleW = k.pbr('lb2Marble', X.marble(0xece6da, 0x9a968c, 18), 0.25),
      facadeM = k.pbr('lb2Facade', X.ashlar(0xe2dccf, 19, 4), 0.38),
      skyPanel = k.pbr('lb2Sky', X.plaster(0x9cbadc, 20), 0.3, { roughness: 0.9 }),
      glass = k.glass(0xf3e9d3, 0.2, 0.1),
      opal = k.glow(0xfff1d2),
      stone = k.pbr('lb2Stone', X.pavers(0xb8b2a6, 21), 0.35);

    /* ---- the room to its plan: 78 by 297 feet, 52 high ---- */
    const W = 23.8, L = 90.5, H = 15.8, Z1 = 12, Z0 = Z1 - L, ZC = (Z0 + Z1) / 2, XW = W / 2;
    k.box(W + 2.4, 0.4, L + 2.4, 0, -0.2, ZC, oak);
    // bays for the works: five a side in each hall, clear of the desk in the middle
    const bayZ = [7.8, -0.6, -9, -17.4, -25.8, -40.7, -49.1, -57.5, -65.9, -74.3], BAY = 4.4, DOORW = 4.4;
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) {
      // the long walls: solid below the windows, piers and spandrels above
      if (s > 0) {
        k.box(1.2, 9.4, ZC - DOORW / 2 - Z0 + 0.6, s * (XW + 0.6), 4.7, (Z0 - 0.6 + ZC - DOORW / 2) / 2, plaster);
        k.box(1.2, 9.4, Z1 + 0.6 - (ZC + DOORW / 2), s * (XW + 0.6), 4.7, (Z1 + 0.6 + ZC + DOORW / 2) / 2, plaster);
        k.box(1.2, 9.4 - 5.6, DOORW, s * (XW + 0.6), 5.6 + (9.4 - 5.6) / 2, ZC, plaster);
      } else k.box(1.2, 9.4, L + 1.2, s * (XW + 0.6), 4.7, ZC, plaster);
      k.box(1.2, H - 15.0 + 0.6, L + 1.2, s * (XW + 0.6), 15.0 + (H - 15.0 + 0.6) / 2, ZC, plaster);
      // piers between the windows, 3 m wide on the bay lines
      for (let i = 0; i <= 11; i++) {
        const z = Z1 - i * 8.4, za = Math.min(Z1 + 1.2, z + 1.5), zb = Math.max(Z0 - 1.2, z - 1.5);
        if (za > zb) k.box(1.2, 5.6, za - zb, s * (XW + 0.6), 12.2, (za + zb) / 2, plaster);
      }
      for (let i = 0; i < 11; i++) {
        const zc = Z1 - 4.2 - i * 8.4; if (zc < Z0 + 2) break;
        k.box(0.06, 2.8, 5.4, s * (XW + 0.1), 10.8, zc, glass);
        k.mesh(new T.CircleGeometry(2.7, 16, 0, PI), glass, s * (XW + 0.1), 12.2, zc).rotation.y = s > 0 ? -PI / 2 : PI / 2;
        for (let dz = -1.8; dz <= 1.81; dz += 1.2) k.box(0.1, 2.8, 0.07, s * (XW + 0.05), 10.8, zc + dz, bronze);
        for (const y of [10.2, 11.4]) k.box(0.1, 0.07, 5.4, s * (XW + 0.05), y, zc, bronze);
      }
      // the lower tier: bookcases, broken by the bays and, on the east, by the door
      const gaps: [number, number][] = bayZ.map((z) => [z - BAY / 2, z + BAY / 2] as [number, number]);
      if (s > 0) gaps.push([ZC - DOORW / 2 - 0.3, ZC + DOORW / 2 + 0.3]);
      gaps.sort((a, b) => b[0] - a[0]);
      let top = Z1;
      const runs: [number, number][] = [];
      for (const [a, b] of gaps) { if (top - b > 0.2) runs.push([b, top]); top = a; }
      if (top - Z0 > 0.2) runs.push([Z0, top]);
      const shelf = (z0: number, z1: number, y0: number, tiers: number) => {
        const len = z1 - z0, zc = (z0 + z1) / 2;
        k.box(0.1, tiers * 1.0 + 0.3, len, s * (XW - 0.05), y0 + (tiers * 1.0 + 0.3) / 2, zc, oakDark);
        for (let j = 0; j <= tiers; j++) k.box(0.6, 0.07, len, s * (XW - 0.3), y0 + 0.1 + j * 1.0, zc, oakDark);
        for (let j = 0; j < tiers; j++) k.box(0.46, 0.8, len - 0.1, s * (XW - 0.3), y0 + 0.55 + j * 1.0, zc, [books, books2, books3][mod(j + Math.round(z0), 3)]);
        for (let zz = z1 - 0.04; zz > z0; zz -= 1.3) k.box(0.62, tiers * 1.0 + 0.2, 0.08, s * (XW - 0.31), y0 + (tiers * 1.0 + 0.2) / 2, Math.max(z0 + 0.04, zz), oakDark);
      };
      for (const [a, b] of runs) shelf(a, b, 0, 5);
      // the upper tier runs the whole length, over the gallery
      shelf(Z0, Z1, 5.5, 3);
      // the gallery: a narrow walk at the head of the lower tier, with its bronze rail
      k.box(1.0, 0.2, L, s * (XW - 0.5), 5.3, ZC, oakDark);
      k.rail(s * (XW - 0.98), ZC, L, bronze, 1.0, 'z', 1.6);
      for (let z = Z1 - 1; z > Z0; z -= 3) k.box(0.1, 0.4, 0.1, s * (XW - 0.9), 5.05, z, bronze);
      k.moulding([[0, 0], [0.8, 0], [0.85, 0.2], [0.6, 0.4], [0.7, 0.6], [0.3, 0.85], [0, 1]], L, s * (XW - 0.02), H - 1.2, ZC, gold, s > 0 ? PI : 0);
      // the bays: a dark oak panel in a gilt frame, the work hung on it
      for (const z of bayZ) {
        k.box(0.1, 3.4, BAY - 0.2, s * (XW - 0.55), 2.6, z, oakDark);
        k.box(0.14, 0.18, BAY, s * (XW - 0.55), 4.4, z, gold);
        k.box(0.62, 5.3, 0.18, s * (XW - 0.31), 2.65, z - BAY / 2 + 0.09, oakDark); k.box(0.62, 5.3, 0.18, s * (XW - 0.31), 2.65, z + BAY / 2 - 0.09, oakDark);
        mounts.push({ position: v(s * (XW - 0.66), 2.6, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 7.9, 3, z), width: 3.4, height: 2.2, style: 'gilt', wash: true });
      }
    }
    k.block(-XW - 1, -XW + 0.9, Z0 - 1, Z1 + 1);
    k.block(XW - 0.9, XW + 1.3, Z0 - 1, ZC - DOORW / 2); k.block(XW - 0.9, XW + 1.3, ZC + DOORW / 2, Z1 + 1);
    // the end walls
    k.box(W + 2.4, H + 0.6, 1.2, 0, (H + 0.6) / 2, Z0 - 0.6, plaster);
    k.box(W + 2.4, H + 0.6, 1.2, 0, (H + 0.6) / 2, Z1 + 0.6, plaster);
    for (const [z, f] of [[Z0, 1], [Z1, -1]] as const) {
      k.censusWall({ x: 0, y: 5.2, z: z + f * 0.05, rotY: f > 0 ? 0 : PI, cols: 18, rows: 5, tile: 0.62, gap: 0.05, start: ctx.wallStart(f > 0 ? 4200 : 4300, 90), pieces: ctx.all, backing: oakDark });
      for (const x of [-8.5, 8.5]) { k.box(4.2, 2.9, 0.1, x, 2.8, z + f * 0.06, oakDark); mounts.push({ position: v(x, 2.8, z + f * 0.13), rotation: f > 0 ? 0 : PI, target: v(x, 3, z + f * 3.5), width: 3.4, height: 2.2, style: 'gilt', wash: true }); }
      k.box(W, 0.6, 0.5, 0, 9.4, z + f * 0.25, gold);
    }

    /* ---- the ceiling: gilt beams, ochre coffers with rosettes, and a painted sky in each hall ---- */
    k.box(W + 2.4, 0.6, L + 2.4, 0, H + 0.3, ZC, plaster);
    const panels = [[-21.6, 3.6], [-70.1, -44.9]];
    for (const x of [-XW + 0.3, -4.2, 4.2, XW - 0.3]) k.box(0.6, 0.9, L, x, H - 0.45, ZC, gold);
    const rosettes: T.Vector3[] = [];
    for (let z = Z1; z >= Z0; z -= 8.4) {
      // the cross beams stop at the painted skies, which run unbroken down the middle
      if (panels.some(([za, zb]) => z > za && z < zb)) for (const sx of [-1, 1]) k.box(XW - 4.2, 0.9, 0.6, sx * (XW + 4.2) / 2, H - 0.45, z, gold);
      else k.box(W, 0.9, 0.6, 0, H - 0.45, z, gold);
      for (const x of [-XW + 0.3, -4.2, 4.2, XW - 0.3]) rosettes.push(v(x, H - 0.95, z));
    }
    for (const x of [-8.1, 8.1]) for (let z = Z1 - 4.2; z > Z0; z -= 8.4) { k.box(7.0, 0.1, 7.6, x, H - 0.05, z, ochre); k.torus(0.9, 0.12, x, H - 0.2, z, gold, 12).rotation.x = PI / 2; }
    for (const [za, zb] of panels) k.box(8.2, 0.1, zb - za, 0, H - 0.06, (za + zb) / 2, skyPanel);
    for (const [za, zb] of [[Z1, 3.6], [-21.6, -44.9], [-70.1, Z0]]) if (za - zb > 0.5) for (let z = za - 4.2; z > zb; z -= 8.4) { k.box(7.6, 0.1, 7.6, 0, H - 0.05, z, ochre); k.torus(1.0, 0.12, 0, H - 0.2, z, gold, 12).rotation.x = PI / 2; }
    { const g = new T.LatheGeometry([new T.Vector2(0.01, 0), new T.Vector2(0.45, 0.05), new T.Vector2(0.35, 0.2), new T.Vector2(0.15, 0.35), new T.Vector2(0.01, 0.4)], 10); g.rotateX(PI); k.instances(g, gold, rosettes.map((p) => at(p.x, p.y + 0.4, p.z))); }
    // clouds in the painted skies, drifting slowly
    const cloudN = 56, cloudBase: number[] = [];
    const clouds = k.instances(new T.IcosahedronGeometry(1, 1), new T.MeshStandardMaterial({ color: 0xf6efe4, roughness: 1, emissive: 0x5a5046 }), Array.from({ length: cloudN }, () => new T.Matrix4()));
    clouds.frustumCulled = false;
    { const r = X.mulberry(151); for (let i = 0; i < cloudN; i++) { const p = panels[i % 2]; cloudBase.push(-3.2 + r() * 6.4, p[0] + 1.5 + r() * (p[1] - p[0] - 3), 0.8 + r() * 1.2, r() * 6.3); } }
    const placeClouds = (t: number) => {
      const m = new T.Matrix4(), q = new T.Quaternion();
      for (let i = 0; i < cloudN; i++) {
        const [x, z, sc, ph] = cloudBase.slice(i * 4, i * 4 + 4), p = panels[i % 2];
        const zz = p[0] + 1.2 + (((z - p[0] - 1.2) + t * 0.05) % (p[1] - p[0] - 2.4) + (p[1] - p[0] - 2.4)) % (p[1] - p[0] - 2.4);
        m.compose(v(x + 0.3 * Math.sin(t * 0.03 + ph), H - 0.35, zz), q, v(sc * 1.4, 0.14, sc));
        clouds.setMatrixAt(i, m);
      }
      clouds.instanceMatrix.needsUpdate = true;
    };
    placeClouds(0);
    // chandeliers down the middle of each hall
    const chand = [7.8, -9, -25.8, -40.7, -57.5, -74.3];
    for (const z of chand) {
      k.beam(v(0, H - 0.9, z), v(0, 9.6, z), 0.04, bronze, 5);
      k.torus(1.3, 0.07, 0, 9.3, z, bronze, 28).rotation.x = PI / 2;
      k.torus(0.7, 0.06, 0, 9.9, z, bronze, 20).rotation.x = PI / 2;
      k.lathe([[0.01, 0], [0.4, 0.2], [0.3, 0.7], [0.08, 1.1], [0.01, 1.2]], 0, 8.9, z, bronze, 12);
      for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; k.sphere(0.13, Math.cos(a) * 1.3, 9.5, z + Math.sin(a) * 1.3, opal, 8); }
      k.point(0, 8.8, z, 0xffe2b0, k.night > 0.5 ? 90 : 55, 26);
    }

    /* ---- tables, lamps, chairs, readers ---- */
    const seatM: T.Matrix4[] = [], seatC: number[] = [], seatSide: number[] = [], rnd = X.mulberry(152);
    const readerCols = [0x24262c, 0x8a3a3a, 0x33477f, 0xd8d0c0, 0x4a6a3a, 0x151517, 0xc9a25a, 0x6a4a8a, 0xe6e2da, 0x2b5f6e];
    const TX = 4.2;
    for (const s of [-1, 1]) for (const z of bayZ) {
      const x = s * TX;
      k.rounded(1.8, 0.12, 6.6, x, 0.98, z, oakDark, 0.05);
      for (const dz of [-3.0, 3.0]) for (const dx of [-0.7, 0.7]) k.box(0.14, 0.92, 0.14, x + dx, 0.46, z + dz, oakDark);
      k.box(0.24, 0.3, 6.4, x, 1.19, z, oakDark);
      for (const dz of [-2.2, 0, 2.2]) {
        k.lathe([[0.16, 0], [0.16, 0.05], [0.04, 0.08], [0.04, 0.46], [0.22, 0.5]], x, 1.34, z + dz, bronze, 10);
        k.box(0.5, 0.14, 0.34, x, 1.9, z + dz, opal);
      }
      for (const dx of [-1.35, 1.35]) for (const dz of [-2.4, -0.8, 0.8, 2.4]) {
        const cx = x + dx, back = dx > 0 ? 0.24 : -0.24;
        k.box(0.48, 0.06, 0.48, cx, 0.58, z + dz, oakDark);
        k.box(0.06, 0.62, 0.46, cx + back, 0.9, z + dz, oakDark);
        for (const lz of [-0.19, 0.19]) k.box(0.42, 0.56, 0.05, cx, 0.28, z + dz + lz, oakDark);
        if (rnd() < 0.5) { seatM.push(at(cx - back * 0.2, 0.45, z + dz)); seatC.push(readerCols[Math.floor(rnd() * readerCols.length)]); seatSide.push(dx > 0 ? 1 : -1); }
      }
      k.block(x - 1.9, x + 1.9, z - 3.5, z + 3.5);
    }
    const readers = k.instances(seatedGeo(), new T.MeshStandardMaterial({ roughness: 0.85 }), seatM);
    readers.frustumCulled = false;
    { const c = new T.Color(); seatC.forEach((col, i) => readers.setColorAt(i, c.set(col))); if (readers.instanceColor) readers.instanceColor.needsUpdate = true; }
    const readerPos = seatM.map((m) => new T.Vector3().setFromMatrixPosition(m));
    // open books on the table in front of each reader, toward the table's middle
    k.instances(new T.BoxGeometry(0.3, 0.03, 0.22), k.flat(0xf0e8d4, 0, 0.9), readerPos.map((p, i) => at(p.x - seatSide[i] * 0.72, 1.06, p.z)));

    /* ---- the delivery desk between the halls ---- */
    k.rounded(12, 1.25, 5.4, 0, 0.62, ZC, oakDark, 0.05);
    k.rounded(12.4, 0.1, 5.8, 0, 1.3, ZC, oakDark, 0.03);
    for (const x of [-6, -2, 2, 6]) k.box(0.4, 4.2, 0.4, x, 3.4, ZC, oakDark);
    k.box(12.6, 0.8, 0.6, 0, 5.5, ZC, oakDark);
    k.box(12.6, 0.2, 0.9, 0, 5.95, ZC, gold);
    const clock = k.cyl(0.8, 0.12, 0, 6.9, ZC, k.flat(0xb4a88e, 0, 0.8), 0.8, 24); clock.rotation.x = PI / 2;
    k.torus(0.82, 0.07, 0, 6.9, ZC + 0.07, gold, 24); k.torus(0.82, 0.07, 0, 6.9, ZC - 0.07, gold, 24);
    k.sign('ROSE MAIN READING ROOM', 8.6, 0.6, 0, 5.5, ZC + 0.32, '#3a2616', '#f4e6c8', 42, 0, { border: true });
    k.sign('ROSE MAIN READING ROOM', 8.6, 0.6, 0, 5.5, ZC - 0.32, '#3a2616', '#f4e6c8', 42, PI, { border: true });
    k.block(-6.4, 6.4, ZC - 3, ZC + 3);
    k.point(0, 3.2, ZC + 4.2, 0xffe2b0, 22, 10);
    for (let i = 0; i < 4; i++) { figure(k, -1.2 + (i % 2) * 2.2, 0, ZC + 4.0 + i * 0.9, readerCols[i + 2], { rotY: PI }); figure(k, 1.4 - (i % 2) * 2.4, 0, ZC - 4.0 - i * 0.9, readerCols[i + 5], { rotY: 0 }); }
    // a librarian with a book truck, working the west aisle
    const cart = new T.Group();
    { const b = new T.Mesh(new T.BoxGeometry(0.5, 0.9, 1.1), oakDark); b.position.y = 0.6; cart.add(b);
      for (let j = 0; j < 2; j++) { const r = new T.Mesh(new T.BoxGeometry(0.44, 0.24, 1.0), j ? books2 : books); r.position.y = 0.55 + j * 0.34; cart.add(r); }
      const p = personGroup(0x3a3f4a); p.position.z = -0.9; cart.add(p);
      cart.position.set(-9.2, 0, 0); k.add(cart); }

    /* ---- the way in: the east door, a marble hall, the front on Fifth Avenue ---- */
    const FX = 24;
    k.box(FX - (XW + 1.2), 0.2, 10, (XW + 1.2 + FX) / 2, -0.08, ZC, marbleW);
    for (const f of [-1, 1]) k.box(FX - (XW + 1.2), 10, 0.6, (XW + 1.2 + FX) / 2, 5, ZC + f * 5.3, marbleW);
    k.box(FX - (XW + 1.2), 0.5, 11.2, (XW + 1.2 + FX) / 2, 10.2, ZC, marbleW);
    for (let x = XW + 3; x < FX - 1; x += 3.4) { k.box(0.5, 0.6, 10, x, 9.7, ZC, gold); }
    k.point((XW + FX) / 2 + 0.6, 7.5, ZC, 0xffe8cc, 40, 18);
    for (const f of [-1, 1]) k.box(0.4, 5.8, 0.5, XW - 0.9, 2.9, ZC + f * (DOORW / 2 + 0.25), gold);
    k.box(0.4, 0.5, DOORW + 1, XW - 0.9, 5.8, ZC, gold);
    k.block(XW + 1.2, FX + 1.6, Z0 - 1, ZC - 5); k.block(XW + 1.2, FX + 1.6, ZC + 5, Z1 + 1);
    // the front: marble ashlar, three arches behind paired columns, the name on the frieze
    const FH = 19, FW = 64;
    for (const f of [-1, 1]) k.box(1.6, FH, FW / 2 - 2, FX + 0.8, FH / 2, ZC + f * (FW / 4 + 1), facadeM);
    k.box(1.6, FH - 7, 4, FX + 0.8, 7 + (FH - 7) / 2, ZC, facadeM);
    k.block(FX, FX + 1.6, ZC - FW / 2, ZC - 2); k.block(FX, FX + 1.6, ZC + 2, ZC + FW / 2);
    for (const dz of [-7, 7]) { k.box(0.1, 6, 4, FX + 1.65, 3, ZC + dz, k.flat(0x1e2226, 0.4, 0.3)); k.mesh(new T.CircleGeometry(2, 16, 0, PI), k.flat(0x1e2226, 0.4, 0.3), FX + 1.66, 6, ZC + dz).rotation.y = PI / 2; }
    k.mesh(new T.CircleGeometry(2, 16, 0, PI), plaster, FX + 1.62, 7, ZC).rotation.y = PI / 2;
    for (const dz of [-10.4, -3.6, 3.6, 10.4]) for (const e of [-0.7, 0.7]) { k.column(FX + 2.6, 0, ZC + dz + e, 12, 0.5, facadeM, true); k.keepOut.push({ x: FX + 2.6, z: ZC + dz + e, r: 0.75 }); }
    k.box(2.4, 1.6, 26, FX + 2.4, 12.8, ZC, facadeM);
    k.box(2.8, 0.4, 27, FX + 2.4, 13.8, ZC, facadeM);
    k.sign('THE NEW YORK PUBLIC LIBRARY', 16, 0.9, FX + 3.62, 12.8, ZC, '#d8d0c0', '#5a5040', 58, PI / 2);
    for (const dz of [-10.4, -3.6, 3.6, 10.4]) k.lathe([[0.5, 0], [0.4, 0.4], [0.45, 1.6], [0.3, 2.4], [0.18, 2.8], [0.01, 3]], FX + 2.2, 14, ZC + dz, facadeM, 10);
    k.box(1.2, 1.2, FW, FX + 0.6, FH + 0.6, ZC, facadeM);
    // the terrace, the steps down to the avenue, the lions
    k.box(9, 0.3, FW, FX + 6.1, -0.15, ZC, stone);
    for (let i = 0; i < 9; i++) k.box(0.6, 0.2, 24, FX + 10.9 + i * 0.6, -0.1 - i * 0.2, ZC, stone);
    for (const f of [-1, 1]) k.box(5.4, 2.0, (FW - 24) / 2, FX + 13.3, -1.0, ZC + f * (12 + (FW - 24) / 4), stone);
    k.block(FX + 1.6, FX + 12, Z0 - 1, ZC - 20); k.block(FX + 1.6, FX + 12, ZC + 20, Z1 + 1);
    const lionM = k.pbr('lb2Lion', X.marble(0xdcd2c2, 0xa89a88, 22), 0.4);
    const lions: T.Vector3[] = [];
    for (const f of [-1, 1]) {
      const lx = FX + 8.6, lz = ZC + f * 9.5;
      k.box(2.2, 2.2, 5.2, lx, 1.1, lz, facadeM);
      k.box(2.5, 0.25, 5.5, lx, 2.3, lz, facadeM);
      k.mesh(new T.SphereGeometry(1, 16, 10), lionM, lx, 3.1, lz).scale.set(0.75, 0.62, 1.9);
      k.mesh(new T.SphereGeometry(0.85, 14, 10), lionM, lx + 0.15, 3.65, lz).scale.set(0.9, 1, 0.9);
      const head = k.mesh(new T.SphereGeometry(0.62, 14, 10), lionM, lx + 0.75, 3.75, lz); head.scale.set(1.1, 1, 0.9);
      k.mesh(new T.SphereGeometry(0.28, 10, 8), lionM, lx + 1.3, 3.55, lz);
      for (const e of [-0.35, 0.35]) k.box(1.4, 0.35, 0.3, lx + 1.0, 2.6, lz + e, lionM);
      k.beam(v(lx - 0.5, 2.6, lz - 1.6), v(lx - 0.2, 2.5, lz - 2.5), 0.1, lionM, 6);
      k.block(lx - 1.3, lx + 1.3, lz - 2.8, lz + 2.8);
      lions.push(v(lx + 0.8, 3.6, lz));
    }
    // Fifth Avenue below the steps, one way downtown, and the block across it
    const SY = -1.8;
    k.box(5.5, 0.3, 200, FX + 17.2, SY - 0.15, ZC, k.pbr('lb2Walk', X.pavers(0x8e8b84, 23), 0.42));
    k.box(16, 0.3, 200, FX + 27.9, SY - 0.2, ZC, k.pbr('lb2Asphalt', X.asphalt(0x24282d), 0.11, { roughness: 0.62, metalness: 0.12 }));
    k.box(5.5, 0.3, 200, FX + 38.6, SY - 0.15, ZC, k.pbr('lb2Walk', X.pavers(0x8e8b84, 23), 0.42));
    for (const dx of [-2.6, 2.6]) for (let z = ZC - 90; z < ZC + 90; z += 6) k.box(0.15, 0.01, 3, FX + 27.9 + dx, SY - 0.04, z, k.flat(0xdedbd2, 0, 0.7));
    k.box(14, 1.9, 200, FX + 48.3, SY + 0.95 - 1.9, ZC, facadeM);
    blockFront(k, { x: FX + 41.4, z0: ZC + 80, count: 21, face: -1, seed: 153, h: [24, 60] });
    for (let z = ZC - 60; z < ZC + 60; z += 12) if (Math.abs(z - ZC) > 14) k.tree(FX + 16.4, SY, z, { h: 6, r: 2.2, seed: 154 });
    k.skyline({ z: ZC - 220, count: 26, spacing: 11, scale: 2.4, base: -4, seed: 155, lit: 0.25, glow: 0.6, x: 40, tint: 0x6e7684 });
    k.skyline({ z: ZC + 220, count: 26, spacing: 11, scale: 2.2, base: -4, seed: 156, lit: 0.25, glow: 0.6, x: 40, tint: 0x6e7684 });
    blockFront(k, { x: -XW - 26, z0: Z1 - 4, count: 11, face: 1, seed: 157, h: [30, 70] });
    const cars: T.Group[] = [];
    for (let i = 0; i < 5; i++) {
      const g = new T.Group(), c = [0xe6b422, 0x1a1c20, 0xd8d4cc, 0x8a2a2a, 0x2a3f6a][i];
      const body = new T.Mesh(new T.BoxGeometry(1.8, 0.75, 4.4), new T.MeshStandardMaterial({ color: c, metalness: 0.5, roughness: 0.35 })); body.position.y = 0.62;
      const cab = new T.Mesh(new T.BoxGeometry(1.6, 0.6, 2.2), new T.MeshStandardMaterial({ color: 0x22303a, metalness: 0.6, roughness: 0.2 })); cab.position.y = 1.3;
      g.add(body, cab); g.position.set(FX + 22 + (i % 3) * 3.2, SY, ZC - 80 + i * 33); k.add(g); cars.push(g);
    }
    k.crowd([v(FX + 3.5, 0, ZC - 18), v(FX + 7, 0, ZC - 5), v(FX + 9, 0, ZC + 2), v(FX + 4, 0, ZC + 18)], 10, { seed: 158, speed: 0.7, spread: 1.4, animate: !ctx.reduced });
    k.crowd([v(FX + 17, SY, ZC - 90), v(FX + 17, SY, ZC + 90)], 16, { seed: 159, speed: 1.0, spread: 1.4, animate: !ctx.reduced });
    k.crowd([v(0, 0, 11), v(0, 0, ZC + 4.5)], 7, { seed: 160, speed: 0.5, spread: 1.2, animate: !ctx.reduced });
    k.crowd([v(0, 0, ZC - 4.5), v(0, 0, Z0 + 2)], 7, { seed: 161, speed: 0.5, spread: 1.2, animate: !ctx.reduced });
    k.crowd([v(XW - 1.5, 0, ZC), v(FX + 1, 0, ZC)], 4, { seed: 162, speed: 0.6, spread: 0.8, animate: !ctx.reduced });

    /* the afternoon through the west windows: shafts of light laid across the room */
    const shaftMat = new T.MeshBasicMaterial({ color: 0xffe6b8, transparent: true, opacity: 0.07, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
    const shafts: T.Mesh[] = [];
    for (let i = 0; i < 10; i++) {
      const zc = Z1 - 4.2 - i * 8.4 - (i > 4 ? 0 : 0);
      if (zc < Z0 + 2) break;
      const a = v(-XW, 12, zc), b = v(-1.5, 0.3, zc - 3), len = a.distanceTo(b);
      const sh = new T.Mesh(new T.PlaneGeometry(4.6, len), shaftMat);
      sh.position.copy(a.clone().add(b).multiplyScalar(0.5));
      sh.lookAt(b.clone().add(v(0, 0, 0)));
      sh.rotateX(PI / 2);
      k.add(sh); shafts.push(sh);
    }

    /* motion */
    if (!ctx.reduced) k.ticks.push((t) => {
      placeClouds(t);
      shaftMat.opacity = 0.06 + 0.025 * Math.sin(t * 0.07);
      // readers lean over their books, and every so often one sits back to turn a page
      const m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler();
      for (let i = 0; i < readerPos.length; i++) {
        const lean = 0.1 + 0.05 * Math.sin(t * 0.4 + i * 1.9) - (Math.sin(t * 0.23 + i * 2.7) > 0.96 ? 0.14 : 0);
        m.compose(readerPos[i], q.setFromEuler(e.set(0, 0, seatSide[i] * lean)), ONE);
        readers.setMatrixAt(i, m);
      }
      readers.instanceMatrix.needsUpdate = true;
      const cz = Math.sin(t * 0.035);
      cart.position.z = ZC + 42 * cz; cart.rotation.y = Math.cos(t * 0.035) >= 0 ? PI : 0;
      for (let i = 0; i < cars.length; i++) cars[i].position.z = ZC - 95 + (((t * (7 + i)) + i * 38) % 190);
    });

    /* eggs */
    const wiki = { name: 'Stephen A. Schwarzman Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/Stephen_A._Schwarzman_Building' };
    k.egg(v(0, 3.2, -52), { id: 'the-dimensions', title: 'Seventy eight by two hundred ninety seven', text: 'The reading room is 78 feet wide and 297 feet long, with a ceiling 52 feet high: about 24 by 91 metres, and 16 metres up.', clue: 'Stand in the middle of the north hall and look up and along.', source: wiki }, { r: 2.4 });
    k.egg(v(FX + 3.6, 12.8, ZC), { id: 'opened-1911', title: 'The twenty third of May', year: '1911', text: 'The building on Fifth Avenue opened on May 23, 1911. Carrère and Hastings designed it in the Beaux-Arts style.', clue: 'Read the frieze over the columns.', source: wiki }, { r: 3 });
    k.egg(rosettes[5 * 4 + 2], { id: 'the-rosette', title: 'The rosette that fell', year: '2016', text: 'In May 2014 one of the rosettes in this ceiling fell to the floor. The room closed, and a 12 million dollar restoration repaired the rosettes and hung them from steel cables. The room reopened on October 5, 2016.', clue: 'Stand at the south side of the desk and look up at the nearest gilt flower.', source: wiki }, { r: 1.6 });
    k.egg(clock, { id: 'book-trains', title: 'The book trains', text: 'Requests come to the delivery desk. The library replaced its historic chain and lift book conveyor with a new delivery system that runs on book trains.', clue: 'Look at the clock over the desk between the two halls.', source: wiki }, { r: 1.6 });
    k.egg(lions[1], { id: 'patience-and-fortitude', title: 'Patience and Fortitude', year: '1930s', text: 'The lions are Tennessee marble, carved by the Piccirilli Brothers to a design by Edward Clark Potter. Mayor La Guardia named them Patience and Fortitude in the 1930s, the qualities he thought New Yorkers would need to get through the Depression. Patience sits on the south side, to the left of the steps, and Fortitude on the north.', clue: 'Go out to the steps. The one on the left as you face the door is Patience.', source: wiki }, { r: 2.4 });
    k.egg(v(0, 5.5, ZC + 3.2), { id: 'the-rose-name', title: 'Why it is the Rose', year: '1998', text: 'A restoration in 1997 and 1998 cleaned and repainted the ceiling, cleaned the windows and refinished the wood. The room reopened on November 16, 1998, renamed after the children of a benefactor who had given 15 million dollars toward the work.', clue: 'The name is on the desk, both sides.', source: wiki }, { r: 2 });

    return { mounts, spawn: v(0, 3, 10), look: v(0, 5, -60), eye: 3, bounds: [-XW + 1.0, FX + 10.4, Z0 + 0.6, Z1 - 0.6], style: 'gilt' };
  },
};
