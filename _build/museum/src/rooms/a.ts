/* Rooms 01 to 06: Bowery, Subway, Met roof, Brooklyn waterfront, Times Square, Ferry. */
import * as T from 'three';
import * as X from '../textures';
import { v, loadThumb } from '../kit';
import type { Kit } from '../kit';
import { corridorMounts } from './types';
import type { RoomDef, RoomCtx } from './types';

const PI = Math.PI;

/* Shared: lit billboards filled with the room's own New Yorkers beyond the framed page. */
export function billboard(k: Kit, ctx: RoomCtx, idx: number, w: number, h: number, x: number, y: number, z: number, rotY: number, frame?: T.Material) {
  const p = ctx.pieces[(24 + idx) % ctx.pieces.length];
  if (!p) return;
  const ratio = p.ar || 1.777,
    ww = Math.min(w, h * ratio),
    hh = ww / ratio;
  const m = new T.MeshBasicMaterial({ color: 0x0c1016 });
  const o = k.mesh(new T.PlaneGeometry(ww, hh), m, x, y, z, true);
  o.rotation.y = rotY;
  o.userData.piece = p;
  k.clickables.push(o);
  if (frame) {
    const f = k.mesh(new T.BoxGeometry(ww + 0.3, hh + 0.3, 0.1), frame, x, y, z);
    f.rotation.y = rotY;
    f.translateZ(-0.07);
  }
  loadThumb(ctx.thumb(p)).then((t) => {
    if (!k.live) return;
    m.map = t;
    m.color.set(0xffffff);
    m.needsUpdate = true;
  }).catch(() => {});
  return o;
}

/* ---------------- 01 THE BOWERY ---------------- */
export const bowery: RoomDef = {
  id: 'bowery',
  daylit: false,
  name: 'The Bowery',
  area: 'LOWER MANHATTAN',
  mood: 'After hours',
  color: '#79d4e9',
  description: 'Cast iron storefronts, brick tenements, fire escapes and a street that never quite sleeps.',
  signatures: 'Cast iron bases with brick uppers, fire escapes, roof tanks, an elevated girder crossing.',
  build(k, ctx) {
    k.sky({ top: 0x05070f, horizon: 0x13182a, ground: 0x07090f, fog: 0.011, stars: 900, env: 0.35 });
    k.hemi(0x8fa7d6, 0x14110c, 0.55);
    k.sun(0x9fb4ff, 0.9, -30, 60, 20, true, 70);
    const asphalt = k.pbr('asphalt', X.asphalt(), 0.11, { roughness: 0.65, metalness: 0.1 }),
      concrete = k.pbr('sidewalk', X.pavers(0x8e8b84), 0.42),
      granite = k.pbr('granite', X.ashlar(0x8a8a86, 4, 2), 0.35),
      ironGreen = k.pbr('ironGreen', X.steel(0x2b4a3f, false), 0.5, { metalness: 0.55, roughness: 0.45 }),
      iron = k.flat(0x1f262b, 0.75, 0.45),
      steel = k.pbr('steelplate', X.steel(0x3a444c, true), 0.5, { metalness: 0.8, roughness: 0.45 }),
      bricks = [k.pbr('brickA', X.brick(0x6f4436, 1), 0.28), k.pbr('brickB', X.brick(0x54372f, 2), 0.28), k.pbr('brickC', X.brick(0x7d5a44, 3), 0.28), k.pbr('brickD', X.brick(0x4a4a52, 4), 0.28)],
      cornice = k.pbr('cornice', X.plaster(0xb8ad9a, 3), 0.6, { roughness: 0.8 }),
      glassDark = k.glass(0x9fc4d8, 0.35, 0.08),
      warm = k.glow(0xffd28a),
      yellow = k.flat(0xe6a626, 0, 0.6),
      white = k.flat(0xdedbd2, 0, 0.7);
    const L = 74, Z0 = 12, ZC = Z0 - L / 2;
    k.box(26, 0.3, L + 20, 0, -0.15, ZC - 4, asphalt);
    for (const s of [-1, 1]) {
      k.box(5, 0.28, L, s * 7.5, 0.0, ZC, concrete);
      k.box(0.3, 0.32, L, s * 5.1, 0.02, ZC, granite);
    }
    for (const x of [-0.14, 0.14]) k.box(0.09, 0.012, L - 6, x, 0.01, ZC, yellow);
    for (const z of [8, -30, -60]) for (let x = -4; x <= 4; x += 1.2) k.box(0.62, 0.014, 2.8, x, 0.012, z, white);
    for (const z of [-4, -26, -48]) {
      k.cyl(0.62, 0.03, 1.6, 0.012, z, iron, 0.62, 20);
      k.torus(0.62, 0.02, 1.6, 0.03, z, iron, 24).rotation.x = PI / 2;
    }
    // buildings: cast iron gallery fronts, brick uppers, cornices, window bays, tanks
    for (const s of [-1, 1])
      for (let b = 0; b < 9; b++) {
        const z = 6 - b * 8,
          h = 15 + ((b * 7 + (s > 0 ? 3 : 0)) % 4) * 2.5,
          brick = bricks[(b + (s > 0 ? 2 : 0)) % 4],
          face = s * 10;
        k.box(4, h - 6.4, 7.9, s * 12, 6.4 + (h - 6.4) / 2, z, brick);
        k.box(4.2, 6.4, 7.9, s * 12.1, 3.2, z, ironGreen);
        for (const dz of [-3.85, 3.85]) k.column(face - s * 0.15, 0.3, z + dz, 5.9, 0.28, ironGreen, true, iron);
        k.moulding([[0, 0], [0.6, 0], [0.7, 0.18], [0.45, 0.3], [0.5, 0.42], [0.2, 0.55], [0, 0.6]], 7.9, face - s * 0.05, 6.2, z, cornice, s > 0 ? PI : 0);
        k.moulding([[0, 0], [0.9, 0], [1.0, 0.25], [0.7, 0.42], [0.8, 0.62], [0.35, 0.85], [0, 0.95]], 8.1, face - s * 0.05, h - 0.5, z, cornice, s > 0 ? PI : 0);
        for (let dz = -3; dz <= 3; dz += 0.75) k.box(0.4, 0.34, 0.16, face - s * 0.18, h - 0.75, z + dz, cornice);
        const floors = Math.floor((h - 8) / 2.7);
        for (let f = 0; f < floors; f++)
          for (const dz of [-2.6, 0, 2.6]) {
            const y = 8.3 + f * 2.7;
            k.box(0.2, 1.95, 1.4, face - s * 0.06, y, z + dz, cornice);
            k.box(0.05, 1.7, 1.15, face - s * 0.14, y, z + dz, (b + f + Math.round(dz)) % 3 === 0 ? warm : glassDark);
            k.box(0.05, 1.7, 0.05, face - s * 0.18, y, z + dz, iron);
            k.box(0.05, 0.05, 1.15, face - s * 0.18, y, z + dz, iron);
            k.box(0.34, 0.1, 1.6, face - s * 0.12, y - 1.0, z + dz, cornice);
          }
        if (b % 3 === 1) {
          k.prop('fire_escape', face - s * 1.05, 7.4, z, { height: 3.2, rotY: s > 0 ? PI / 2 : -PI / 2 });
          k.prop('fire_escape', face - s * 1.05, 10.1, z, { height: 3.2, rotY: s > 0 ? PI / 2 : -PI / 2 });
        } else {
          for (const y of [7.6, 10.3, 13]) {
            if (y > h - 1.5) continue;
            k.box(1.3, 0.08, 3.4, face - s * 0.75, y, z, iron);
            for (let dz = -1.6; dz <= 1.7; dz += 0.34) k.box(0.03, 0.95, 0.03, face - s * 1.38, y + 0.5, z + dz, iron);
            k.box(0.05, 0.05, 3.4, face - s * 1.38, y + 1, z, iron);
            k.bar(v(face - s * 0.3, y + 0.05, z + 1.2), v(face - s * 1.2, y + 2.7, z + 1.2), 0.05, 0.05, iron);
            k.bar(v(face - s * 0.3, y + 0.05, z + 1.7), v(face - s * 1.2, y + 2.7, z + 1.7), 0.05, 0.05, iron);
          }
        }
        if (b % 2 === 0) {
          if (b % 4 === 0) k.prop('water_tower', s * 11.5, h, z + 1.5, { height: 5.2 });
          else {
            const x = s * 11.8;
            for (const dx of [-0.85, 0.85]) for (const dz of [-0.85, 0.85]) k.box(0.1, 1.9, 0.1, x + dx, h + 0.9, z + dz, iron);
            k.cyl(1.15, 2.2, x, h + 2.9, z, k.pbr('staves', X.planks(0x6a4b3a, 12, 2), 0.8), 1.15, 20);
            for (const dy of [-0.8, 0, 0.8]) k.torus(1.17, 0.04, x, h + 2.9 + dy, z, iron, 24).rotation.x = PI / 2;
            k.cyl(1.32, 0.7, x, h + 4.35, z, steel, 0.05, 18);
          }
        }
      }
    // elevated girders, lamps, signals, street furniture
    for (const z of [-6, -34]) {
      for (const s of [-1, 1]) {
        k.box(0.42, 8.5, 0.5, s * 4.6, 4.25, z, steel);
        k.box(0.9, 0.25, 0.9, s * 4.6, 0.12, z, steel);
      }
      k.box(10, 0.8, 0.5, 0, 8.4, z, steel);
      for (let x = -4; x < 5; x++) k.box(0.08, 0.7, 0.56, x, 8.4, z, iron);
      k.box(10.5, 0.15, 3, 0, 8.9, z, steel);
      k.point(0, 7.6, z, 0x9fb8ff, 12, 14);
    }
    for (const z of [7, -13, -33, -53]) for (const s of [-1, 1]) k.lamp(s * 5.6, z, 6, iron, 0xffc98a, 34);
    k.prop('hydrant', 6.1, 0, 2, { height: 1.15, keepOut: 0.5 });
    k.prop('hydrant', -6.1, 0, -40, { height: 1.15, keepOut: 0.5 });
    k.prop('mailbox', 5.9, 0, -20, { height: 1.55, rotY: -PI / 2, keepOut: 0.6 });
    k.prop('stoop', -8.6, 0, -44, { height: 2.1, rotY: PI / 2 });
    k.prop('stoop', 8.6, 0, -28, { height: 2.1, rotY: -PI / 2 });
    k.prop('utility_pole', 6.4, 0, -46, { height: 9 });
    k.prop('tree', -6.6, 0, 9, { height: 6.2, keepOut: 0.6 });
    k.prop('tree', 6.6, 0, -58, { height: 6.2, keepOut: 0.6 });
    for (const z of [-4, -24]) k.tree(-6.4, 0, z, { kind: 'bare', h: 5, r: 2.2 });
    k.box(0.5, 1.4, 0.42, 4.7, 4.9, 9, yellow);
    for (let i = 0; i < 3; i++) k.mesh(new T.CircleGeometry(0.13, 14), k.glow(i === 0 ? 0xff4e31 : 0x24211a), 4.7, 5.35 - i * 0.42, 9.22);
    k.sign('BOWERY', 2.4, 0.5, 5.4, 5.6, 6.2, '#1a5c46', '#ffffff', 150, 0, { border: true, double: true });
    k.sign('E HOUSTON ST', 3, 0.5, 5.4, 4.95, 6.2, '#1a5c46', '#ffffff', 110, 0, { border: true, double: true });
    k.sign('ONE WAY  →', 1.8, 0.5, 4.75, 3.7, 8.3, '#eeeee6', '#111820', 120, 0, { border: true, double: true });
    // subway entrance
    const sx = -6.9, sz = -15;
    k.box(2.6, 0.03, 4, sx, 0.17, sz, k.glow(0x03060a));
    for (const dx of [-1.3, 1.3]) {
      k.rail(sx + dx, sz, 4, iron, 1.0, 'z', 0.45);
      k.cyl(0.07, 2.1, sx + dx, 1.2, sz + 2.1, iron);
      k.sphere(0.26, sx + dx, 2.4, sz + 2.1, k.glow(0x84d9a8), 14);
      k.point(sx + dx, 2.3, sz + 2.1, 0x84d9a8, 6, 5);
    }
    k.sign('BROADWAY  LAFAYETTE ST', 2.7, 0.45, sx, 1.5, sz + 2.15, '#0a1014', '#ffffff', 64, 0, { double: true });
    k.sign('B  D  F  M   Downtown & Brooklyn', 2.7, 0.35, sx, 1.05, sz + 2.16, '#0a1014', '#fbc184', 52, 0, { double: true });
    k.keepOut.push({ x: sx, z: sz, r: 2.6 });
    // the end of the street: a blank party wall carrying one monumental work
    k.box(30, 30, 8, 0, 15, -74, bricks[3]);
    k.box(30.4, 0.6, 8.4, 0, 30, -74, cornice);
    k.sign('MLow / AFTER HOURS', 7, 0.8, 0, 26, -69.9, '#071019', '#83ebff', 90, 0, { border: true });
    k.sign('NEW YORKERS · THE MUSEUM', 12, 1.1, 0, 22.8, -69.9, 'transparent', '#F0F4F8', 80);
    k.skyline({ z: -110, count: 30, spacing: 5, scale: 1.5, base: -6, seed: 3, lit: 0.42, glow: 1.4 });
    // wheatpaste census walls on the last block
    const start = ctx.wallStart(1200, 40);
    for (const s of [-1, 1]) k.censusWall({ x: s * 9.72, y: 3.5, z: -62, rotY: s < 0 ? PI / 2 : -PI / 2, cols: 10, rows: 4, tile: 0.78, start: start + (s > 0 ? 40 : 0), pieces: ctx.all, backing: k.flat(0x0e1116, 0, 0.9) });
    const mounts = corridorMounts({ pairs: 10, x: 9.8, z0: 2, pitch: 6, y: 3.6, width: 5.4, height: 3.1, inset: 4.6, style: 'black' });
    mounts.push({ position: v(0, 12.5, -69.9), rotation: 0, target: v(0, 3, -50), width: 22, height: 12.4, style: 'none', wash: false });
    return { mounts, spawn: v(0, 3, 12), look: v(0, 3.5, -30), eye: 3, bounds: [-8.4, 8.4, -66, 13], style: 'black' };
  },
};

/* ---------------- 02 THE SUBWAY ---------------- */
export const subway: RoomDef = {
  id: 'subway',
  daylit: false,
  name: 'Below the city',
  area: 'THE SUBWAY',
  mood: 'Last train',
  color: '#e2ca89',
  description: 'White tile vaults, riveted columns, a silver train at the platform and the yellow edge.',
  signatures: 'Glazed tile vaults, mosaic name plaques, riveted I columns, the tactile platform edge.',
  build(k, ctx) {
    k.sky({ top: 0x0a0d10, horizon: 0x11161a, ground: 0x0a0d10, fog: 0.012, env: 0.3 });
    k.hemi(0xdfe9df, 0x1a1a14, 0.75);
    const tile = k.pbr('tile', X.subwayTile(0xe9e6d8, 0x3b3f3b), 0.55, { roughness: 0.25 }),
      tileGreen = k.pbr('tileG', X.subwayTile(0x2f6c62, 0x1a2e2a), 0.55, { roughness: 0.25 }),
      floor = k.pbr('platform', X.concrete(0x8a8a82, 2), 0.35, { roughness: 0.75 }),
      ceiling = k.pbr('ceil', X.concrete(0x5d615e, 5), 0.5),
      steelG = k.pbr('colG', X.steel(0x1f5a4f, true), 0.9, { metalness: 0.6, roughness: 0.4 }),
      iron = k.flat(0x22272b, 0.75, 0.45),
      silver = k.pbr('car', X.steel(0x9aa5ab, false), 0.35, { metalness: 0.9, roughness: 0.3 }),
      trackBed = k.pbr('ballast', X.cobble(0x3a3a3a, 3), 0.9, { roughness: 1 }),
      yellow = k.flat(0xf1c531, 0, 0.55),
      glow = k.glow(0xf6f2df),
      glassDark = k.glass(0x1a2a33, 0.6, 0.1);
    const L = 78, ZC = 10 - L / 2;
    // platform, track, far wall
    k.box(18, 0.4, L, 0, -0.2, ZC, floor);
    k.box(0.5, 0.05, L - 4, -8.2, 0.03, ZC, yellow);
    const studs: T.Matrix4[] = [];
    for (let z = ZC - L / 2 + 2; z < ZC + L / 2 - 2; z += 0.24) for (let j = 0; j < 3; j++) studs.push(new T.Matrix4().makeTranslation(-8.05 + j * 0.13, 0.05, z));
    k.instances(new T.SphereGeometry(0.03, 6, 4), k.flat(0xd9b437, 0.2, 0.5), studs);
    k.box(6, 0.4, L, -12, -1.6, ZC, trackBed);
    k.box(0.4, 1.4, L, -9.1, -0.9, ZC, floor);
    for (const x of [-10.5, -11.9]) k.box(0.08, 0.12, L, x, -1.3, ZC, iron);
    for (let z = ZC - L / 2; z < ZC + L / 2; z += 0.7) k.box(2.4, 0.1, 0.22, -11.2, -1.4, z, k.flat(0x3b2f27, 0, 0.9));
    k.box(0.6, 12, L, 9.3, 5.5, ZC, tile);
    k.box(0.6, 12, L, -15.3, 5.5, ZC, tile);
    k.box(25, 0.6, L, -3, 0.3, ZC + L, tile);
    for (const x of [9, -15]) {
      k.box(0.08, 0.8, L, x + (x > 0 ? -0.05 : 0.05), 6.1, ZC, tileGreen);
      k.box(0.08, 0.4, L, x + (x > 0 ? -0.05 : 0.05), 1.0, ZC, tileGreen);
    }
    // vaulted ceiling with tile ribs and concrete beams
    const vaultPts = (z: number) => Array.from({ length: 25 }, (_, i) => { const t = (i / 24) * PI; return v(-3 + Math.cos(t) * 12.3, 8.2 + Math.sin(t) * 3.4, z); });
    const vault = new T.BufferGeometry(), vp: number[] = [], vi: number[] = [];
    for (const zz of [ZC + L / 2, ZC - L / 2]) for (const p of vaultPts(zz)) vp.push(p.x, p.y, p.z);
    for (let i = 0; i < 24; i++) vi.push(i, i + 25, i + 1, i + 1, i + 25, i + 26);
    vault.setAttribute('position', new T.Float32BufferAttribute(vp, 3));
    vault.setIndex(vi);
    vault.computeVertexNormals();
    k.mesh(vault, k.pbr('vaultTile', X.subwayTile(0xdcd9cb, 0x4a4d48), 0.5, { roughness: 0.3, side: T.DoubleSide }));
    for (let z = 8; z > ZC - L / 2; z -= 6) {
      k.curve(vaultPts(z), 0.18, ceiling, 24);
      k.box(24.8, 0.5, 0.5, -3, 8.1, z, ceiling);
      k.box(4.2, 0.12, 0.34, 0, 7.75, z, iron);
      k.box(4, 0.05, 0.26, 0, 7.68, z, glow);
      k.point(0, 7.2, z, 0xf2f0dc, 26, 16);
      k.box(4.2, 0.12, 0.34, -11.5, 7.6, z, iron);
      k.box(4, 0.05, 0.26, -11.5, 7.53, z, glow);
    }
    // riveted columns
    for (let z = 5; z > ZC - L / 2 + 4; z -= 6) {
      for (const x of [-7.4, 6.4]) {
        k.box(0.5, 8, 0.16, x, 4, z - 0.24, steelG);
        k.box(0.5, 8, 0.16, x, 4, z + 0.24, steelG);
        k.box(0.12, 8, 0.4, x, 4, z, steelG);
        k.box(0.9, 0.3, 0.9, x, 0.15, z, steelG);
        k.box(0.9, 0.3, 0.9, x, 7.95, z, steelG);
        const riv: T.Matrix4[] = [];
        for (let y = 0.6; y < 7.6; y += 0.42) for (const dx of [-0.16, 0.16]) for (const dz of [-0.33, 0.33]) riv.push(new T.Matrix4().makeTranslation(x + dx, y, z + dz));
        k.instances(new T.SphereGeometry(0.035, 6, 4), k.flat(0xb5a26a, 0.7, 0.35), riv);
      }
      k.box(0.8, 0.9, 0.9, 6.4, 8.35, z, ceiling);
    }
    // mosaic name plaques and a long mosaic band of New Yorkers
    for (let z = 2; z > ZC - L / 2 + 6; z -= 12) {
      k.sign('BROADWAY  LAFAYETTE', 4.6, 0.62, 8.96, 5.35, z, '#e7e0c6', '#1f4a48', 70, -PI / 2, { border: true });
      k.sign('BROADWAY  LAFAYETTE', 4.6, 0.62, -14.96, 5.35, z, '#e7e0c6', '#1f4a48', 70, PI / 2, { border: true });
    }
    const start = ctx.wallStart(3200, 96);
    k.censusWall({ x: 8.96, y: 7.05, z: -22, rotY: -PI / 2, cols: 48, rows: 2, tile: 0.52, gap: 0.05, start, pieces: ctx.all, backing: k.flat(0x141a1c, 0, 0.9) });
    k.censusWall({ x: -14.96, y: 7.05, z: -22, rotY: PI / 2, cols: 48, rows: 2, tile: 0.52, gap: 0.05, start: ctx.wallStart(start + 96, 96), pieces: ctx.all, backing: k.flat(0x141a1c, 0, 0.9) });
    // the train: silver car, rounded doors, windows lit with the room's own New Yorkers
    const train = new T.Group();
    train.position.set(-11.2, 0, ZC);
    const carLen = 66;
    const body = new T.Mesh(new T.BoxGeometry(2.7, 3.5, carLen), silver);
    body.position.y = 2.15;
    train.add(body);
    const roof = new T.Mesh(new T.CylinderGeometry(1.35, 1.35, carLen, 12, 1, false, 0, PI), k.flat(0x8a949a, 0.85, 0.35));
    roof.rotation.z = PI / 2;
    roof.rotation.y = PI / 2;
    roof.position.y = 3.9;
    train.add(roof);
    for (let i = 0; i < 11; i++) {
      const z = -carLen / 2 + 3 + i * 6;
      const door = new T.Mesh(new T.BoxGeometry(0.06, 2.8, 1.3), k.flat(0x74808a, 0.8, 0.35));
      door.position.set(1.36, 1.8, z);
      train.add(door);
      const gap = new T.Mesh(new T.BoxGeometry(0.07, 2.8, 0.03), iron);
      gap.position.set(1.37, 1.8, z);
      train.add(gap);
      for (const dz of [-0.32, 0.32]) {
        const w = new T.Mesh(new T.PlaneGeometry(0.45, 1.1), glassDark);
        w.position.set(1.4, 2.35, z + dz);
        w.rotation.y = PI / 2;
        train.add(w);
      }
      if (i < 10) {
        const wz = z + 3;
        const win = new T.Mesh(new T.PlaneGeometry(3.2, 1.5), k.glow(0xfff4dc));
        win.position.set(1.37, 2.6, wz);
        win.rotation.y = PI / 2;
        train.add(win);
        const wo = new T.Mesh(new T.BoxGeometry(0.05, 1.7, 3.5), iron);
        wo.position.set(1.34, 2.6, wz);
        train.add(wo);
        billboard(k, ctx, i, 2.9, 1.3, -9.8, 2.6, ZC + wz, PI / 2);
        k.point(-9.4, 2.6, ZC + wz, 0xfff0d0, 5, 4);
      }
      const stripe = new T.Mesh(new T.BoxGeometry(0.02, 0.12, carLen), k.flat(0x1c3f8f, 0.3, 0.5));
      stripe.position.set(1.37, 3.65, 0);
      train.add(stripe);
    }
    for (const dz of [-carLen / 2, carLen / 2]) {
      const face = new T.Mesh(new T.BoxGeometry(2.7, 3.5, 0.3), k.flat(0x232a2f, 0.6, 0.4));
      face.position.set(0, 2.15, dz);
      train.add(face);
      const lamp = new T.Mesh(new T.SphereGeometry(0.16, 10, 8), k.glow(0xfff0c0));
      lamp.position.set(0.7, 1.4, dz + (dz > 0 ? 0.16 : -0.16));
      train.add(lamp);
    }
    for (let i = 0; i < 6; i++) {
      const wheel = new T.Mesh(new T.CylinderGeometry(0.45, 0.45, 2.6, 16), iron);
      wheel.rotation.z = PI / 2;
      wheel.position.set(0, -1.0, -carLen / 2 + 5 + i * 11);
      train.add(wheel);
    }
    k.add(train);
    k.sign('DOWNTOWN & BROOKLYN   ↓', 7, 0.7, 0, 5.4, ZC - L / 2 + 0.7, '#0f1a1c', '#f9f8e9', 80, 0, { border: true });
    k.sign('B   D   F   M', 4, 0.7, 0, 4.4, ZC - L / 2 + 0.7, '#152728', '#ffbc69', 150, 0, { border: true });
    k.sign('EXIT  ↑  HOUSTON STREET', 5, 0.62, 0, 6.2, 11.6, '#8f3a2c', '#ffffff', 80, PI, { border: true });
    for (const z of [-4, -24, -44]) k.bench(6.3, z, 0, k.pbr('benchwood', X.planks(0x6d4d34, 3, 4), 1.2), iron, 2.4);
    k.box(6, 0.5, L, 3, 8.3, ZC, ceiling);
    // stair up at the far end
    for (let i = 0; i < 14; i++) k.box(5, 0.32, 0.9, 4, 0.16 + i * 0.32, ZC - L / 2 + 1.5 - i * 0.9 + 14, floor);
    k.box(0.1, 1.1, 13, 1.45, 3.0, ZC - L / 2 + 8, iron);
    k.keepOut.push({ x: 4, z: ZC - L / 2 + 8, r: 5 });
    const mounts = corridorMounts({ pairs: 10, x: 9.0, z0: 1, pitch: 6.2, y: 3.5, width: 5, height: 2.9, inset: 4.5, style: 'steel' });
    for (let i = 0; i < 20; i++) {
      if (i % 2 === 0) continue;
      mounts[i].position.x = -14.9;
      mounts[i].rotation = PI / 2;
      mounts[i].target = v(-6.2, 3, mounts[i].position.z);
      mounts[i].width = 6;
      mounts[i].height = 3.4;
    }
    mounts.push({ position: v(-3, 3.6, ZC - L / 2 + 0.7), rotation: 0, target: v(-3, 3, ZC - L / 2 + 6), width: 5, height: 2.9, style: 'steel' });
    mounts.push({ position: v(-3, 3.6, 11.6), rotation: PI, target: v(-3, 3, 6), width: 5, height: 2.9, style: 'steel' });
    return { mounts, spawn: v(0, 3, 9), look: v(-1, 3.4, -30), eye: 3, bounds: [-7.6, 8.4, -62, 10.5], style: 'steel' };
  },
};
