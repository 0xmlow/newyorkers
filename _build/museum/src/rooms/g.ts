/* Rooms 27 to 31: the Prospect Park Boathouse, the Hall of Fame colonnade, the TWA Flight Center, Snug Harbor, Wollman Rink. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Kit, Mount } from '../kit';
import type { RoomDef } from './types';
import { billboard } from './a';

const PI = Math.PI;

/* A rowboat: hull, thwarts, oars. */
function rowboat(k: Kit, x: number, y: number, z: number, rotY: number, hull: T.Material, wood: T.Material) {
  const g = new T.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  const h = new T.Mesh(new T.SphereGeometry(1, 16, 8, 0, PI * 2, PI / 2, PI / 2), hull);
  h.scale.set(1.0, 0.6, 2.6);
  g.add(h);
  const rim = new T.Mesh(new T.TorusGeometry(1, 0.06, 6, 24), wood);
  rim.rotation.x = PI / 2;
  rim.scale.set(1, 2.6, 1);
  g.add(rim);
  for (const dz of [-1.2, 0, 1.2]) { const t = new T.Mesh(new T.BoxGeometry(1.8, 0.06, 0.3), wood); t.position.set(0, -0.15, dz); g.add(t); }
  for (const s of [-1, 1]) { const oar = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 3.2, 6), wood); oar.position.set(s * 1.6, 0.1, 0.2); oar.rotation.z = s * 1.2; oar.rotation.y = 0.3; g.add(oar); }
  k.add(g);
  return g;
}

/* ---------------- 27 PROSPECT PARK BOATHOUSE ---------------- */
export const boathouse: RoomDef = {
  id: 'boathouse',
  name: 'The Lullwater',
  area: 'PROSPECT PARK BOATHOUSE',
  mood: 'Late summer',
  color: '#a9c9b0',
  description: 'A white terracotta boathouse on the lake, its loggia hung with the census, rowboats drifting under the bridge.',
  signatures: 'The Beaux Arts loggia of five arches with a balustraded roof, the terrace over the water, the arched Lullwater bridge, rowboats and swans, the tree line closing the lake.',
  build(k, ctx) {
    k.sky({ top: 0x6f9fd2, horizon: 0xe9ebe2, ground: 0x4f6a48, fog: 0.003, sun: { az: 4.2, el: 0.5, color: 0xffe9c8, size: 16 }, haze: 0.2, env: 0.9 });
    k.hemi(0xf1f6ff, 0x3f5a38, 0.9);
    k.sun(0xffe6c4, 2.3, -40, 50, 10, true, 80);
    const terra = k.pbr('boathouseTerra', X.plaster(0xf0e9dc, 21), 0.4, { roughness: 0.65 }),
      lime = k.pbr('boathouseBase', X.ashlar(0xd8d0bd, 22, 3), 0.25),
      tileRoof = k.pbr('greenTile', X.boardwalk(0x5e7a5a), 0.5, { roughness: 0.6 }),
      floorT = k.pbr('loggiaFloor', X.terrazzo(0xd9d0be, 12), 0.35, { roughness: 0.35 }),
      oak = k.pbr('boathouseOak', X.planks(0x7a5a3a, 6, 33), 0.8),
      lawn = k.pbr('lawnP', X.grass(0x4a7a3a, 14), 0.15),
      stoneB = k.pbr('bridgeStone', X.ashlar(0x8f8a7c, 23, 3), 0.3),
      hull = k.flat(0x3a6a8a, 0.2, 0.6),
      iron = k.flat(0x1f242a, 0.7, 0.45),
      white = k.flat(0xf4f2ea, 0, 0.6);
    // the lake and the lawns
    k.water({ y: -0.9, color: 0x2e5a4e, w: 300, d: 300, z: -80, amp: 0.7 });
    k.box(120, 1.2, 60, 0, -0.6, 22, lawn);
    k.box(140, 1.2, 40, -70, -0.6, -60, lawn);
    k.box(140, 1.2, 40, 70, -0.6, -60, lawn);
    const rnd = X.mulberry(27);
    for (let i = 0; i < 40; i++) { const x = (rnd() - 0.5) * 120, z = 30 + rnd() * 24; k.tree(x, 0, z, { kind: rnd() > 0.5 ? 'round' : 'column', h: 6 + rnd() * 5, r: 3 + rnd() * 2.6, leaf: 0x3f6b36, seed: i }); }
    for (let i = 0; i < 30; i++) { const s = i % 2 ? 1 : -1, x = s * (40 + rnd() * 40), z = -46 - rnd() * 30; k.tree(x, 0, z, { kind: 'round', h: 7 + rnd() * 5, r: 4 + rnd() * 3, leaf: 0x466f3a, seed: 100 + i }); }
    // the boathouse: base, five arch loggia, balustrade roof, side pavilions
    const BZ = 8, BW = 30, BD = 12;
    k.box(BW + 4, 1.0, BD + 6, 0, 0.5, BZ, lime);
    k.box(BW, 0.4, BD, 0, 1.0, BZ, floorT);
    k.arcade(BW, 7.2, 1.2, 5, 4.6, 6.2, 0, 1.0, BZ - BD / 2, terra, 0, false);
    k.box(BW, 7.2, 0.6, 0, 4.6, BZ + BD / 2, terra);
    for (const s of [-1, 1]) k.box(0.6, 7.2, BD, s * BW / 2, 4.6, BZ, terra);
    k.block(-BW / 2 - 0.4, BW / 2 + 0.4, BZ + BD / 2 - 0.4, BZ + BD / 2 + 0.4);
    for (const s of [-1, 1]) k.block(s * BW / 2 - 0.4, s * BW / 2 + 0.4, BZ - BD / 2, BZ + BD / 2);
    for (let i = 0; i < 5; i++) { const cx = -BW / 2 + (BW / 5) * (i + 0.5); k.block(cx - 3, cx - 2.3, BZ - BD / 2 - 0.7, BZ - BD / 2 + 0.7); k.block(cx + 2.3, cx + 3, BZ - BD / 2 - 0.7, BZ - BD / 2 + 0.7); }
    k.box(BW + 1, 0.5, BD + 1, 0, 8.4, BZ, terra);
    k.moulding([[0, 0], [0.9, 0], [1.0, 0.25], [0.7, 0.45], [0.8, 0.7], [0.3, 0.9], [0, 1.0]], BW + 1.4, -BW / 2 - 0.6, 7.4, BZ, terra, 0);
    k.moulding([[0, 0], [0.9, 0], [1.0, 0.25], [0.7, 0.45], [0.8, 0.7], [0.3, 0.9], [0, 1.0]], BW + 1.4, BW / 2 + 0.6, 7.4, BZ, terra, PI);
    for (let x = -BW / 2; x <= BW / 2; x += 1.2) k.lathe([[0.16, 0], [0.16, 0.1], [0.08, 0.2], [0.13, 0.6], [0.08, 0.95], [0.18, 1.05]], x, 8.65, BZ - BD / 2 - 0.3, white, 10);
    k.box(BW + 1.2, 0.18, 0.5, 0, 9.75, BZ - BD / 2 - 0.3, white);
    k.box(BW + 2, 0.3, BD + 2, 0, 9.9, BZ + 0.6, tileRoof);
    for (const s of [-1, 1]) { k.box(8, 6, 8, s * (BW / 2 + 4), 4, BZ + 2, terra); k.mesh(new T.ConeGeometry(6, 3, 4), tileRoof, s * (BW / 2 + 4), 8.5, BZ + 2).rotation.y = PI / 4; }
    for (const x of [-9, -3, 3, 9]) k.point(x, 6.5, BZ, 0xfff0d6, 20, 14);
    // the terrace and dock over the water
    k.box(BW + 4, 0.4, 8, 0, 0.8, BZ - BD / 2 - 6, oak);
    k.rail(0, BZ - BD / 2 - 9.8, BW + 4, white, 1.1, 'x', 1.4);
    k.box(6, 0.3, 14, -12, 0.2, BZ - BD / 2 - 16, oak);
    for (let z = BZ - BD / 2 - 10; z > BZ - BD / 2 - 24; z -= 3) for (const dx of [-2.7, 2.7]) k.cyl(0.22, 3, -12 + dx, -1.2, z, oak, 0.22, 8);
    k.prop('life_ring', -14.9, 1.1, BZ - BD / 2 - 12, { height: 0.8, rotY: PI / 2 });
    k.prop('cleat', -10, 0.4, BZ - BD / 2 - 14, { height: 0.4 });
    k.prop('lantern', 14, 1.2, BZ - BD / 2 - 8, { height: 0.9 });
    k.prop('bell', 15.5, 2.4, BZ - BD / 2 - 8, { height: 0.8 });
    k.box(0.25, 2.4, 0.25, 15.5, 2.0, BZ - BD / 2 - 8, iron);
    // rowboats, swans, the Lullwater bridge
    const boats = [rowboat(k, -6, -0.7, -22, 0.4, hull, oak), rowboat(k, 10, -0.7, -34, -0.8, hull, oak), rowboat(k, -20, -0.7, -44, 1.9, hull, oak), rowboat(k, 4, -0.7, -56, 0.2, hull, oak)];
    /* 2026-10-01: the swans are the life kit's swan.glb; the squashed spheres they were are
       kept below, one flag away */
    const KIT_SWANS = true;
    const swans: T.Object3D[] = [];
    if (KIT_SWANS) {
      for (let i = 0; i < 6; i++) k.prop('swan', 14 + i * 3, -0.88, -30 - i * 4, { height: 1.15, rotY: 0.6 + i * 1.3 }).then((o) => { if (o) swans.push(o); });
    } else {
      for (let i = 0; i < 6; i++) { const s = k.mesh(new T.SphereGeometry(0.5, 10, 8), white, 14 + i * 3, -0.6, -30 - i * 4, true); s.scale.set(1, 0.7, 1.6); const n = k.mesh(new T.CylinderGeometry(0.06, 0.09, 0.9, 6), white, 14 + i * 3 + 0.5, -0.1, -30 - i * 4 - 0.6, true); n.rotation.x = 0.4; swans.push(s, n); }
    }
    if (!ctx.reduced) k.ticks.push((t) => { boats.forEach((b, i) => { b.position.x += Math.sin(t * 0.2 + i) * 0.004; b.rotation.y += Math.sin(t * 0.13 + i * 2) * 0.0008; b.position.y = -0.7 + Math.sin(t * 0.8 + i) * 0.04; }); swans.forEach((s, i) => { s.position.y += Math.sin(t * 1.1 + i) * 0.001; }); });
    const BRZ = -70;
    k.box(6, 1.2, 44, 34, 3.6, BRZ, stoneB);
    k.arch(12, 7, 6, 34, -1.5, BRZ, stoneB, false, 1.6).rotation.y = PI / 2;
    k.rail(31.2, BRZ, 44, iron, 1.0, 'z', 1.5);
    k.rail(36.8, BRZ, 44, iron, 1.0, 'z', 1.5);
    k.skyline({ z: -220, count: 22, spacing: 8, scale: 1.6, base: -2, seed: 71, lit: 0.1, glow: 0.2, tint: 0x8a9096, rows: 1 });
    // the census in the boathouse's back room
    k.censusWall({ x: 0, y: 4.2, z: BZ + BD / 2 - 0.32, rotY: PI, cols: 30, rows: 4, tile: 0.62, gap: 0.05, start: ctx.wallStart(1400, 120), pieces: ctx.all, backing: oak });
    k.sign('PROSPECT PARK  ·  THE BOATHOUSE  ·  1905', 9, 0.7, 0, 7.6, BZ + BD / 2 - 0.32, '#3a5a48', '#f4efe0', 80, PI, { border: true });
    // the works: inside the loggia, on the terrace screens, along the dock
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (const z of [BZ - 3.4, BZ + 2.4]) mounts.push({ position: v(s * (BW / 2 - 0.32), 3.6, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * (BW / 2 - 5), 3, z), width: 4.4, height: 2.6, style: 'oak' });
    for (let i = 0; i < 5; i++) { const cx = -BW / 2 + (BW / 5) * (i + 0.5); mounts.push({ position: v(cx, 8.9, BZ - BD / 2 + 0.3), rotation: 0, tilt: 0, target: v(cx, 3, BZ - BD / 2 - 6), width: 3.6, height: 2.0, style: 'white', wash: false }); }
    for (let i = 0; i < 6; i++) { const x = -15 + i * 6; k.box(4.6, 3.8, 0.4, x, 2.9, BZ - BD / 2 - 9.6, white); mounts.push({ position: v(x, 3.2, BZ - BD / 2 - 9.38), rotation: 0, target: v(x, 3, BZ - BD / 2 - 5), width: 4.2, height: 2.5, style: 'white', wash: false }); }
    for (let i = 0; i < 4; i++) { const z = BZ - BD / 2 - 12 - i * 3.2; k.box(0.4, 3.4, 2.8, -14.8, 2.5, z, white); mounts.push({ position: v(-14.58, 2.8, z), rotation: PI / 2, target: v(-11.5, 3, z), width: 2.6, height: 1.9, style: 'white', wash: false }); }
    for (let i = 0; i < 3; i++) { const x = -10 + i * 10; mounts.push({ position: v(x, 3.6, BZ + BD / 2 - 0.34), rotation: PI, target: v(x, 3, BZ), width: 4.2, height: 2.4, style: 'oak' }); }
    return { mounts, spawn: v(0, 3, BZ - BD / 2 - 5), look: v(0, 5, BZ), eye: 3, bounds: [-40, 40, BZ - BD / 2 - 25, 50], style: 'oak' };
  },
};

/* ---------------- 28 THE HALL OF FAME ---------------- */
export const halloffame: RoomDef = {
  id: 'halloffame',
  name: 'The colonnade',
  area: 'HALL OF FAME FOR GREAT AMERICANS',
  mood: 'Bronze afternoon',
  color: '#c9b08a',
  description: 'A semicircular colonnade on a Bronx bluff, the census where the bronze busts stand, a domed library at its heart.',
  signatures: 'The open air Corinthian colonnade curving around the library, bust pedestals between the columns, the terraced site over the Harlem River, the green copper dome and portico.',
  build(k, ctx) {
    k.sky({ top: 0x7aa6d8, horizon: 0xe8e5dc, ground: 0x5a6350, fog: 0.0024, sun: { az: 4.4, el: 0.42, color: 0xffe4c0, size: 16 }, env: 0.9 });
    k.hemi(0xf4f3ea, 0x4a4a3a, 0.9);
    k.sun(0xffe2b8, 2.4, -50, 40, 20, true, 90);
    const lime = k.pbr('hofLime', X.ashlar(0xc9bfa6, 24, 3), 0.22),
      tileF = k.pbr('hofTile', X.subwayTile(0xd9c9a8, 0x7a6a50), 0.6, { roughness: 0.4 }),
      bronze = k.pbr('hofBronze', X.patina(0x5a7a6a), 0.5, { metalness: 0.5, roughness: 0.5 }),
      copper = k.pbr('hofDome', X.patina(0x5f9a8c), 0.3, { metalness: 0.3, roughness: 0.6 }),
      brick = k.pbr('hofBrick', X.brick(0x8a5a44, 34), 0.28),
      lawn = k.pbr('lawnH', X.grass(0x4c7a3c, 15), 0.15),
      iron = k.flat(0x1f242a, 0.7, 0.45),
      glow = k.glow(0xfff1d6);
    // the bluff, the river below, the far palisade
    k.box(200, 2, 200, 0, -1, -20, lawn);
    k.water({ y: -22, color: 0x2b4a5c, w: 500, d: 300, z: -230, amp: 0.8 });
    k.box(300, 20, 100, 0, -12, -160, k.pbr('bluff', X.ashlar(0x6f6a5c, 25, 3), 0.1));
    k.box(400, 26, 80, 0, -10, -330, k.pbr('palisade', X.ashlar(0x5a5e58, 26, 2), 0.08));
    k.skyline({ z: -300, count: 24, spacing: 9, scale: 1.4, base: -8, seed: 81, lit: 0.1, glow: 0.2, tint: 0x8a8e94, rows: 1 });
    // the colonnade: a semicircle of paired columns on a terrace, open to the river
    const R = 30, CZ = -50;
    k.mesh(new T.RingGeometry(R - 5, R + 5, 96, 1, 0, PI), tileF, 0, 0.02, CZ).rotation.x = -PI / 2;
    k.mesh(new T.RingGeometry(R - 5.6, R - 5, 96, 1, 0, PI), lime, 0, 0.1, CZ).rotation.x = -PI / 2;
    k.mesh(new T.RingGeometry(R + 5, R + 5.6, 96, 1, 0, PI), lime, 0, 0.1, CZ).rotation.x = -PI / 2;
    const N = 26;
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * PI;
      for (const rr of [R - 3.6, R + 3.6]) {
        const x = Math.cos(t) * rr, z = CZ - Math.sin(t) * rr;
        k.column(x, 0.1, z, 9, 0.42, lime, true);
      }
    }
    for (let i = 0; i < N; i++) {
      const t0 = (i / N) * PI, t1 = ((i + 1) / N) * PI, tm = (t0 + t1) / 2;
      for (const rr of [R - 3.6, R + 3.6]) {
        const a = v(Math.cos(t0) * rr, 9.3, CZ - Math.sin(t0) * rr), b = v(Math.cos(t1) * rr, 9.3, CZ - Math.sin(t1) * rr);
        k.bar(a, b, 0.8, 1.2, lime);
      }
      const ax = Math.cos(tm) * R, az = CZ - Math.sin(tm) * R;
      k.box(7.4, 0.5, 0.8, 0, 0, 0, lime).position.set(ax, 9.9, az);
      k.objects[k.objects.length - 1].rotation.y = -tm + PI / 2;
    }
    k.mesh(new T.RingGeometry(R - 4.4, R + 4.4, 96, 1, 0, PI), lime, 0, 10.6, CZ).rotation.x = -PI / 2;
    k.mesh(new T.RingGeometry(R - 4.6, R + 4.6, 96, 1, 0, PI), copper, 0, 11.2, CZ).rotation.x = -PI / 2;
    for (let i = 0; i < 12; i++) { const t = ((i + 0.5) / 12) * PI; k.point(Math.cos(t) * R, 8, CZ - Math.sin(t) * R, 0xfff0d8, 14, 14); }
    // the library at the centre: a rotunda with a green dome and a portico
    k.cyl(15, 12, 0, 6, CZ + 8, brick, 15, 48);
    k.cyl(16, 0.8, 0, 12.4, CZ + 8, lime, 16, 48);
    k.mesh(new T.SphereGeometry(15, 40, 20, 0, PI * 2, 0, PI / 2), copper, 0, 12.8, CZ + 8);
    k.lathe([[2, 0], [2, 0.3], [1.4, 0.5], [1.4, 3], [0.6, 4], [0.1, 4.6]], 0, 27.6, CZ + 8, lime, 20);
    for (let i = 0; i < 6; i++) k.column(-7.5 + i * 3, 0.1, CZ + 24, 10, 0.5, lime, true);
    k.box(20, 1.6, 6, 0, 10.8, CZ + 24.5, lime);
    k.mesh(new T.ConeGeometry(11, 4, 3), lime, 0, 13.6, CZ + 24.5).rotation.y = PI / 6;
    k.box(6, 7, 1.4, 0, 3.5, CZ + 23, k.pbr('hofDoor', X.planks(0x4a3020, 4, 35), 1.2));
    k.block(-15.5, 15.5, CZ - 7.5, CZ + 23.5);
    k.sign('THE HALL OF FAME  ·  1900', 10, 0.9, 0, 9.4, CZ + 27.6, '#5a4a30', '#f4efe0', 90, 0, { border: true });
    // the bust pedestals between the columns carry the census, one work on each
    const mounts: Mount[] = [];
    for (let i = 0; i < 24; i++) {
      const t = ((i + 0.5) / 24) * PI, x = Math.cos(t) * (R + 3.4), z = CZ - Math.sin(t) * (R + 3.4);
      k.lathe([[0.6, 0], [0.6, 0.2], [0.42, 0.3], [0.42, 1.4], [0.55, 1.5], [0.55, 1.6]], x, 0.1, z, lime, 16);
      k.box(0.14, 2.6, 4.2, 0, 0, 0, bronze).position.set(x, 3.0, z);
      k.objects[k.objects.length - 1].rotation.y = -t + PI / 2;
      k.keepOut.push({ x, z, r: 0.9 });
      mounts.push({ position: v(x + Math.cos(t) * -0.12, 3.0, z + Math.sin(t) * 0.12), rotation: -t + PI / 2, target: v(Math.cos(t) * (R - 1), 3, CZ - Math.sin(t) * (R - 1)), width: 3.8, height: 2.2, style: 'none', wash: false });
    }
    // benches, lamps, the inscription band, the census in the rotunda vestibule
    for (let i = 0; i < 6; i++) { const t = ((i + 0.5) / 6) * PI; k.bench(Math.cos(t) * (R - 8), CZ - Math.sin(t) * (R - 8), -t - PI / 2, k.pbr('benchH', X.planks(0x5d4939, 3, 36), 1.2), iron, 2.4); }
    for (const t of [0.2, 1.0, 2.1, 2.9]) k.lamp(Math.cos(t) * (R + 7), CZ - Math.sin(t) * (R + 7), 5.5, iron, 0xffe0b0, 22);
    k.prop('tree', 24, 0, CZ + 20, { height: 6 });
    k.prop('tree', -24, 0, CZ + 20, { height: 6 });
    k.censusWall({ x: 0, y: 5.2, z: CZ + 22.3, rotY: 0, cols: 20, rows: 3, tile: 0.55, gap: 0.05, start: ctx.wallStart(700, 60), pieces: ctx.all, backing: lime });
    return { mounts, spawn: v(Math.cos(0.12) * R, 3, CZ - Math.sin(0.12) * R), look: v(Math.cos(0.75) * R, 6, CZ - Math.sin(0.75) * R), eye: 3, bounds: [-40, 40, CZ - 36, CZ + 46], style: 'none' };
  },
};

/* ---------------- 29 TWA FLIGHT CENTER ---------------- */
export const twa: RoomDef = {
  id: 'twa',
  name: 'Departures, 1962',
  area: 'TWA FLIGHT CENTER',
  mood: 'Jet age',
  color: '#e07a7a',
  description: 'The swooping concrete terminal at the airport, a sunken red lounge, the flight tubes, a plane on the apron.',
  signatures: 'The winged concrete shell and its four vaults, the sunken conversation pit in red, the split flap board, the curved tube corridors, the airliner at the gate.',
  build(k, ctx) {
    k.sky({ top: 0x7fa8d8, horizon: 0xe8e6df, ground: 0x6d6b66, fog: 0.0026, sun: { az: 2.8, el: 0.8, color: 0xfff4e6, size: 14 }, env: 0.95 });
    k.hemi(0xf6f6f0, 0x5a5650, 0.9);
    k.sun(0xfff6ea, 2.4, 20, 60, 30, true, 90);
    const concrete = k.pbr('twaShell', X.plaster(0xe9e6df, 31), 0.35, { roughness: 0.75, side: T.DoubleSide }),
      terrazzo = k.pbr('twaFloor', X.terrazzo(0xe3dfd6, 13), 0.35, { roughness: 0.3 }),
      red = k.pbr('twaRed', X.velvet(0xb8202a), 0.5, { roughness: 0.95 }),
      redSolid = k.flat(0xb8202a, 0.1, 0.7),
      glass = k.glass(0xd6ebf3, 0.16, 0.05),
      steel = k.flat(0xc9ccd0, 0.85, 0.3),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      apron = k.pbr('apron', X.concrete(0x8e8e88, 14), 0.1),
      white = k.flat(0xf2f2ee, 0.2, 0.5);
    // the apron, the runway lights, the far terminals
    k.box(400, 0.4, 300, 0, -0.2, -120, apron);
    for (let x = -120; x <= 120; x += 12) { k.sphere(0.25, x, 0.3, -180, k.glow(0x7ad0ff), 6); k.sphere(0.25, x, 0.3, -230, k.glow(0xffffff), 6); }
    k.skyline({ z: -300, count: 20, spacing: 14, scale: 1.2, base: -2, seed: 91, lit: 0.2, glow: 0.4, tint: 0x9a9ea6, rows: 1 });
    // the shell: two wings and a central spine over a glazed drum
    const shell = (sx: number, sz: number, w: number, rot: number) => {
      const s = k.mesh(new T.SphereGeometry(1, 40, 20, 0, PI, 0, PI / 2), concrete, sx, 0, sz);
      s.scale.set(w, 12, 22);
      s.rotation.y = rot;
      return s;
    };
    shell(-16, -30, 26, 0.35);
    shell(16, -30, 26, -0.35);
    const spine = k.mesh(new T.SphereGeometry(1, 40, 20, 0, PI * 2, 0, PI / 2), concrete, 0, 0, -34);
    spine.scale.set(14, 16, 30);
    for (const s of [-1, 1]) { const rib = k.mesh(new T.TorusGeometry(24, 0.5, 8, 48, PI), concrete, s * 4, 0, -30); rib.rotation.set(0, PI / 2 + s * 0.3, 0); }
    k.box(60, 0.6, 50, 0, -0.1, -34, terrazzo);
    k.mesh(new T.CylinderGeometry(26, 26, 8, 48, 1, true), glass, 0, 4, -34);
    for (let i = 0; i < 24; i++) { const a = (i / 24) * PI * 2; k.box(0.3, 8, 0.3, Math.cos(a) * 26, 4, -34 + Math.sin(a) * 26, white); }
    k.block(-27, 27, -61, -60);
    // the sunken lounge: a red pit with curved seating, the board above it
    k.mesh(new T.CylinderGeometry(9, 9, 1.2, 48), red, 0, -0.6, -30);
    k.mesh(new T.TorusGeometry(8.4, 0.9, 10, 48, PI * 1.5), red, 0, -0.5, -30).rotation.set(PI / 2, 0, PI * 0.25);
    k.mesh(new T.CylinderGeometry(9.6, 9.6, 0.3, 48, 1, true), white, 0, 0.05, -30);
    k.keepOut.push({ x: 0, z: -30, r: 9.8 });
    k.box(10, 4.2, 0.6, 0, 6, -12, dark);
    k.beam(v(-4, 8.2, -12), v(-4, 13, -12), 0.08, steel, 6);
    k.beam(v(4, 8.2, -12), v(4, 13, -12), 0.08, steel, 6);
    k.censusWall({ x: 0, y: 6.4, z: -11.68, rotY: 0, cols: 16, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(4800, 64), pieces: ctx.all, backing: dark });
    k.sign('DEPARTURES  ·  ALL NEW YORKERS  ·  ON TIME', 9.6, 0.5, 0, 8.4, -11.68, '#111', '#ffd27a', 60, 0);
    const boardRows = ctx.pieces.slice(80, 86);
    boardRows.forEach((p, j) => k.sign(`${String(p.n).padStart(4, '0')}   ${p.t.slice(0, 30).toUpperCase().padEnd(32, ' ')}  GATE ${1 + j}`, 9.6, 0.36, 0, 4.2 - j * 0.4, -11.68, '#111', '#e8e2c8', 44, 0, { align: 'left' } as never));
    // the tubes: two red carpeted corridors leaving the drum toward the gates
    for (const s of [-1, 1]) {
      const tube = k.mesh(new T.CylinderGeometry(3.2, 3.2, 40, 24, 1, true), concrete, s * 30, 3, -74);
      tube.rotation.set(PI / 2, 0, 0);
      tube.rotation.z = s * 0.35;
      k.box(4, 0.3, 40, s * 30, 0.15, -74, red).rotation.y = -s * 0.35;
      for (let i = 0; i < 8; i++) k.point(s * (30 + (i - 4) * 1.6 * Math.sin(0.35) * -1), 5.6, -56 - i * 5, 0xfff0e0, 12, 8);
    }
    // the airliner at the gate
    const px = 60, pz = -110;
    const fus = k.mesh(new T.CylinderGeometry(3.4, 3.4, 52, 24), white, px, 6, pz);
    fus.rotation.set(PI / 2, 0, 0.3);
    k.mesh(new T.SphereGeometry(3.4, 20, 12), white, px - Math.sin(0.3) * 26, 6, pz + Math.cos(0.3) * 26);
    k.mesh(new T.ConeGeometry(3.4, 10, 20), white, px + Math.sin(0.3) * 31, 6.8, pz - Math.cos(0.3) * 31).rotation.set(-PI / 2 + 0.15, 0, 0.3);
    for (const s of [-1, 1]) { const wing = k.mesh(new T.BoxGeometry(34, 0.8, 8), white, px + s * 17 * Math.cos(0.3), 4.6, pz + s * 17 * Math.sin(0.3)); wing.rotation.y = -0.3 - s * 0.35; wing.rotation.z = s * 0.06; const eng = k.mesh(new T.CylinderGeometry(1.6, 1.6, 6, 16), steel, px + s * 10 * Math.cos(0.3), 3.6, pz + s * 10 * Math.sin(0.3) - 4); eng.rotation.set(PI / 2, 0, 0.3); }
    k.mesh(new T.BoxGeometry(0.6, 10, 8), redSolid, px + Math.sin(0.3) * 24, 11, pz - Math.cos(0.3) * 24).rotation.y = 0.3;
    k.box(52, 0.5, 1.2, px, 0.25, pz + 30, redSolid);
    for (let i = 0; i < 4; i++) k.cyl(0.9, 1.2, px - 12 + i * 8, 0.6, pz + 8, dark, 0.9, 12);
    // the works: around the drum's wall, the pit rim, the tube mouths
    const mounts: Mount[] = [];
    for (let i = 0; i < 12; i++) {
      const a = PI * 0.12 + (i / 11) * PI * 0.76, x = Math.cos(a) * 24.6, z = -34 - Math.sin(a) * 24.6;
      k.box(0.3, 4.2, 5.8, 0, 0, 0, white).position.set(x, 3, z);
      k.objects[k.objects.length - 1].rotation.y = -a - PI / 2;
      mounts.push({ position: v(x - Math.cos(a) * 0.2, 3.2, z + Math.sin(a) * 0.2), rotation: -a - PI / 2 + PI, target: v(Math.cos(a) * 19, 3, -34 - Math.sin(a) * 19), width: 4.8, height: 2.8, style: 'white', wash: false });
    }
    for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2; const x = Math.cos(a) * 11.5, z = -30 + Math.sin(a) * 11.5; k.box(0.3, 3, 4, 0, 0, 0, redSolid).position.set(x, 1.6, z); k.objects[k.objects.length - 1].rotation.y = -a - PI / 2; mounts.push({ position: v(x - Math.cos(a) * 0.2, 1.9, z - Math.sin(a) * 0.2), rotation: -a + PI / 2, target: v(Math.cos(a) * 15, 3, -30 + Math.sin(a) * 15), width: 3.6, height: 2.0, style: 'white', wash: false }); }
    for (const x of [-6.8, 6.8]) mounts.push({ position: v(x, 4.2, -11.68), rotation: 0, target: v(x, 3, -6), width: 4.4, height: 2.5, style: 'steel' });
    for (const s of [-1, 1]) mounts.push({ position: v(s * 26, 3.4, -59.7), rotation: 0, target: v(s * 22, 3, -50), width: 4.4, height: 2.5, style: 'white', wash: false });
    return { mounts, spawn: v(0, 3, 16), look: v(0, 9, -34), eye: 3, bounds: [-25, 25, -58, 20], style: 'white' };
  },
};

/* ---------------- 30 SNUG HARBOR ---------------- */
export const snug: RoomDef = {
  id: 'snug',
  name: 'The sailors\' rest',
  area: 'SNUG HARBOR',
  mood: 'Staten Island stillness',
  color: '#c9c3a4',
  description: 'Five Greek temples in a row on a Staten Island lawn, a hall of the census inside the main one, a walled scholar\'s garden behind.',
  signatures: 'The row of Greek Revival temple fronts with Ionic porticos, the long front lawn, the Music Hall, the Chinese Scholar\'s Garden with its pond, pavilion and moon gate.',
  build(k, ctx) {
    k.sky({ top: 0x7ea9d6, horizon: 0xe9ebe5, ground: 0x59684c, fog: 0.0026, sun: { az: 1.6, el: 0.7, color: 0xfff3dc, size: 14 }, env: 0.9 });
    k.hemi(0xf4f6ff, 0x455a3c, 0.9);
    k.sun(0xfff0d4, 2.4, 40, 60, 30, true, 100);
    const lime = k.pbr('snugLime', X.ashlar(0xd6cdb6, 27, 3), 0.22),
      plaster = k.pbr('snugPlaster', X.plaster(0xece6d8, 32), 0.4),
      floorW = k.pbr('snugFloor', X.planks(0x8a6a48, 8, 37), 0.6),
      lawn = k.pbr('lawnS', X.grass(0x4a7a3a, 16), 0.15),
      gravel = k.pbr('gravelS', X.cobble(0xa8a08c, 8), 1.2),
      tileRoof = k.pbr('greyTile', X.boardwalk(0x5a5e66), 0.5),
      stoneG = k.pbr('gardenStone', X.ashlar(0x8f8a7c, 28, 3), 0.3),
      wood = k.pbr('pavilionWood', X.planks(0x7a3a2a, 4, 38), 1.2),
      water = k.flat(0x37646a, 0.5, 0.2, { transparent: true, opacity: 0.9 }),
      koi = k.flat(0xe07a2a, 0.1, 0.6),
      iron = k.flat(0x1f242a, 0.7, 0.45);
    // the lawn, the flagpole, the harbour beyond the trees
    k.box(220, 0.4, 220, 0, -0.2, -20, lawn);
    k.box(6, 0.2, 80, 0, 0.0, 30, gravel);
    k.cyl(0.08, 16, 10, 8, 40, iron, 0.05, 8);
    k.box(2.4, 1.4, 0.05, 11.2, 14.8, 40, k.flat(0xd8d8e0, 0, 0.8));
    const rnd = X.mulberry(30);
    for (let i = 0; i < 40; i++) { const x = (rnd() - 0.5) * 200, z = 46 + rnd() * 30; k.tree(x, 0, z, { kind: 'round', h: 7 + rnd() * 5, r: 4 + rnd() * 3, leaf: 0x3f6b36, seed: i }); }
    k.water({ y: -1.5, color: 0x3a5468, w: 400, d: 200, z: 170, amp: 0.8 });
    k.skyline({ z: 240, count: 22, spacing: 10, scale: 1.4, base: -2, seed: 92, lit: 0.1, glow: 0.2, tint: 0x8a8e96, rows: 1 });
    // five temple fronts in a row
    const temple = (x: number, w: number, d: number, main: boolean) => {
      const z = -6;
      k.box(w + 2, 1.2, d + 4, x, 0.6, z - d / 2, lime);
      k.box(w, 10, d, x, 6, z - d / 2 - 2, plaster);
      k.block(x - w / 2 - 0.3, x + w / 2 + 0.3, z - d - 2.3, z - 1.7);
      const n = Math.round(w / 3.2);
      for (let i = 0; i <= n; i++) k.column(x - w / 2 + (w / n) * i, 1.2, z + 1.4, 9, 0.5, lime, true);
      k.box(w + 1.6, 1.4, 5, x, 10.9, z - 0.6, lime);
      k.mesh(new T.ConeGeometry((w + 1.6) / 2 / Math.cos(PI / 6) * 0.87, 3.4, 3), lime, x, 13.4, z - 0.6).rotation.y = PI / 6;
      k.box(w + 1, 0.4, d + 2, x, 11.6, z - d / 2 - 1, tileRoof);
      if (main) { k.box(4, 6, 0.4, x, 3, z - 1.9, k.pbr('snugDoor', X.planks(0x4a3020, 4, 39), 1.2)); }
      return { x, z, w, d };
    };
    temple(-46, 16, 24, false);
    temple(-24, 18, 26, false);
    const main = temple(0, 24, 34, true);
    temple(24, 18, 26, false);
    temple(46, 16, 24, false);
    // inside the main hall: a coffered ceiling, the census on the end wall, works on both long walls
    const MX = main.x, MZ = main.z - 2, MW = main.w, MD = main.d;
    k.box(MW - 0.6, 0.3, MD - 0.6, MX, 1.2, MZ - MD / 2, floorW);
    for (let x = -9; x <= 9; x += 6) for (let z = -4; z > -MD + 4; z -= 6) { k.rounded(5.4, 0.3, 5.4, MX + x, 9.8, MZ + z, lime, 0.05); k.point(MX + x, 8.5, MZ + z, 0xfff2e0, 14, 12); }
    // cut a door in the front wall: the block list above sealed the whole footprint, reopen the door bay
    k.blocks = k.blocks.filter((b) => !(Math.abs(b.x0 - (MX - MW / 2 - 0.3)) < 0.01 && Math.abs(b.z1 - (main.z - 1.7)) < 0.01));
    k.block(MX - MW / 2 - 0.3, MX - 2.2, MZ - MD - 0.3, MZ + 0.3);
    k.block(MX + 2.2, MX + MW / 2 + 0.3, MZ - MD - 0.3, MZ + 0.3);
    k.block(MX - MW / 2, MX + MW / 2, MZ - MD - 0.3, MZ - MD + 0.3);
    k.block(MX - MW / 2 - 0.3, MX - MW / 2 + 0.3, MZ - MD, MZ);
    k.block(MX + MW / 2 - 0.3, MX + MW / 2 + 0.3, MZ - MD, MZ);
    k.censusWall({ x: MX, y: 5.0, z: MZ - MD + 0.32, rotY: 0, cols: 26, rows: 4, tile: 0.62, gap: 0.05, start: ctx.wallStart(5200, 104), pieces: ctx.all, backing: lime });
    k.sign('SAILORS\' SNUG HARBOR  ·  1833', 8, 0.7, MX, 8.4, MZ - MD + 0.32, '#4a4a3a', '#f4efe0', 90, 0, { border: true });
    // the scholar's garden behind the row: wall, moon gate, pond, pavilion, rockery
    const GZ = -60, GW = 40, GD = 30;
    for (const s of [-1, 1]) k.box(0.6, 3.6, GD, s * GW / 2, 1.8, GZ - GD / 2, plaster);
    k.box(GW, 3.6, 0.6, 0, 1.8, GZ - GD, plaster);
    k.box(GW / 2 - 3, 3.6, 0.6, -GW / 4 - 1.5, 1.8, GZ, plaster);
    k.box(GW / 2 - 3, 3.6, 0.6, GW / 4 + 1.5, 1.8, GZ, plaster);
    k.torus(3, 0.4, 0, 1.6, GZ, stoneG, 32);
    for (const s of [-1, 1]) { k.block(s * GW / 2 - 0.4, s * GW / 2 + 0.4, GZ - GD, GZ); k.block(s > 0 ? 3 : -GW / 2, s > 0 ? GW / 2 : -3, GZ - 0.4, GZ + 0.4); }
    k.block(-GW / 2, GW / 2, GZ - GD - 0.4, GZ - GD + 0.4);
    for (const s of [-1, 1]) k.box(0.4, 0.4, GD + 1, s * GW / 2, 3.8, GZ - GD / 2, tileRoof);
    k.box(GW + 1, 0.4, 0.4, 0, 3.8, GZ - GD, tileRoof);
    k.box(GW, 0.4, GD, 0, -0.05, GZ - GD / 2, gravel);
    k.mesh(new T.CylinderGeometry(7, 7.5, 0.8, 32), stoneG, -6, 0.3, GZ - 16);
    k.mesh(new T.CylinderGeometry(6.4, 6.4, 0.8, 32), water, -6, 0.35, GZ - 16);
    k.keepOut.push({ x: -6, z: GZ - 16, r: 7.8 });
    const fish: T.Mesh[] = [];
    for (let i = 0; i < 8; i++) { const f = k.mesh(new T.SphereGeometry(0.22, 8, 6), koi, -6, 0.6, GZ - 16, true); f.scale.set(1, 0.5, 2); fish.push(f); }
    if (!ctx.reduced) k.ticks.push((t) => fish.forEach((f, i) => { const a = t * 0.3 + i; const r = 2 + (i % 4); f.position.set(-6 + Math.cos(a) * r, 0.6, GZ - 16 + Math.sin(a) * r); f.rotation.y = -a; }));
    for (let i = 0; i < 9; i++) { const s = 0.8 + rnd() * 1.4; k.box(s * 1.2, s * 1.6, s, 8 + rnd() * 8, s * 0.7, GZ - 8 - rnd() * 14, stoneG).rotation.set(rnd() * 0.3, rnd() * PI, rnd() * 0.3); }
    k.keepOut.push({ x: 12, z: GZ - 15, r: 6 });
    const PX = 10, PZ = GZ - 24;
    k.box(7, 0.6, 7, PX, 0.3, PZ, stoneG);
    for (const dx of [-2.8, 2.8]) for (const dz of [-2.8, 2.8]) k.cyl(0.18, 4, PX + dx, 2.6, PZ + dz, wood, 0.18, 10);
    k.mesh(new T.ConeGeometry(6, 2.6, 4), tileRoof, PX, 5.6, PZ).rotation.y = PI / 4;
    k.box(7.4, 0.3, 7.4, PX, 4.6, PZ, wood);
    for (let i = 0; i < 4; i++) k.tree(-14 + i * 10, 0, GZ - 26, { kind: 'round', h: 3.4, r: 1.9, leaf: 0x5a8a3a, seed: 200 + i });
    k.prop('lantern', -6, 1.0, GZ - 8, { height: 1.0 });
    k.prop('lantern', PX, 0.6, PZ + 4.2, { height: 1.0 });
    // the works: the main hall's long walls, between the portico columns, in the pavilion
    const mounts: Mount[] = [];
    for (let i = 0; i < 5; i++) { const z = MZ - 5 - i * 5.6; for (const s of [-1, 1]) mounts.push({ position: v(MX + s * (MW / 2 - 0.34), 3.6, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(MX + s * (MW / 2 - 5.5), 3, z), width: 4.4, height: 2.6, style: 'gilt' }); }
    for (const x of [-8, 8]) mounts.push({ position: v(MX + x, 4.6, MZ - MD + 0.34), rotation: 0, target: v(MX + x, 3, MZ - MD + 6), width: 4.4, height: 2.6, style: 'gilt' });
    for (const tx of [-46, -24, 24, 46]) { for (const dx of [-3.5, 3.5]) mounts.push({ position: v(tx + dx, 3.6, -7.66), rotation: 0, target: v(tx + dx, 3, -1), width: 3.6, height: 2.2, style: 'white', wash: false }); }
    for (const a of [PI / 4, (3 * PI) / 4, (5 * PI) / 4, (7 * PI) / 4]) { const x = PX + Math.cos(a) * 3.2, z = PZ + Math.sin(a) * 3.2; mounts.push({ position: v(x, 2.6, z), rotation: -a + PI / 2, target: v(PX + Math.cos(a) * 7, 3, PZ + Math.sin(a) * 7), width: 2.6, height: 1.6, style: 'oak', wash: false }); }
    return { mounts, spawn: v(0, 3, 26), look: v(0, 8, -6), eye: 3, bounds: [-58, 58, GZ - GD + 1, 44], style: 'gilt' };
  },
};

/* ---------------- 31 WOLLMAN RINK ---------------- */
export const wollman: RoomDef = {
  id: 'wollman',
  name: 'Ice under the towers',
  area: 'WOLLMAN RINK',
  mood: 'December night',
  color: '#bcd7ea',
  description: 'The rink in the southeast corner of the park, the works hung on the boards, skaters as light, snow falling on the skyline.',
  signatures: 'The oval rink below the outcrops, the Midtown towers rising over bare trees, the boards, the rental house and terrace, snow on every ledge.',
  build(k, ctx) {
    k.sky({ top: 0x0a1226, horizon: 0x2b3a5e, ground: 0x0c1018, fog: 0.004, stars: 500, env: 0.5 });
    k.hemi(0xc8d8ff, 0x1a2230, 0.6);
    k.sun(0xbfd0ff, 0.9, 30, 60, 20, true, 90);
    const ice = k.flat(0xd9eef8, 0.2, 0.08, { envMapIntensity: 1.4 }),
      board = k.pbr('rinkBoard', X.plaster(0xf2f2ee, 33), 0.5, { roughness: 0.6 }),
      snow = k.flat(0xf4f7fb, 0, 0.9),
      rock = k.pbr('schist', X.ashlar(0x5a5a58, 29, 2), 0.2),
      pav = k.pbr('rinkPav', X.pavers(0x6f6f6a, 20), 0.35),
      timber = k.pbr('rentalWood', X.planks(0x6a4a30, 6, 40), 0.8),
      iron = k.flat(0x1f242a, 0.7, 0.45),
      glow = k.glow(0xfff0d0),
      cyan = k.glow(0x9fe8ff);
    // the rink: an oval of ice ringed by boards, a terrace to the south
    const RX = 26, RZ = 18;
    const oval = k.mesh(new T.CircleGeometry(1, 96), ice, 0, 0.05, -30);
    oval.scale.set(RX, RZ, 1);
    oval.rotation.x = -PI / 2;
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * PI * 2, x = Math.cos(a) * (RX + 0.4), z = -30 + Math.sin(a) * (RZ + 0.4);
      const seg = k.box(0.3, 1.2, 2.7, x, 0.6, z, board);
      seg.rotation.y = -Math.atan2(Math.sin(a) * RX, Math.cos(a) * RZ) + PI / 2;
      k.box(0.36, 0.12, 2.7, x, 1.24, z, snow).rotation.y = seg.rotation.y;
    }
    k.mesh(new T.RingGeometry(1, 1.5, 96), pav, 0, 0.01, -30).scale.set(RX + 0.5, RZ + 0.5, 1);
    k.objects[k.objects.length - 1].rotation.x = -PI / 2;
    k.box(70, 0.4, 24, 0, -0.2, 6, pav);
    k.box(24, 4.2, 10, 0, 2.1, 14, timber);
    k.box(25, 0.6, 11, 0, 4.4, 14, snow);
    k.sign('SKATE RENTAL  ·  HOT COCOA  ·  THE COUNT', 9, 0.8, 0, 3.2, 8.95, '#1a2230', '#ffe0a8', 80, PI, { border: true });
    k.block(-12.5, 12.5, 9, 19.5);
    // the skaters: points of light tracing loops on the ice
    const skaters: T.Mesh[] = [];
    for (let i = 0; i < 14; i++) skaters.push(k.mesh(new T.SphereGeometry(0.2, 8, 6), i % 3 ? cyan : glow, 0, 0.6, -30, true));
    if (!ctx.reduced) k.ticks.push((t) => skaters.forEach((s, i) => { const sp = 0.25 + (i % 5) * 0.05, a = t * sp + i * 1.3, r = 0.35 + (i % 4) * 0.15; s.position.set(Math.cos(a) * RX * r + Math.sin(t * 0.7 + i) * 2, 0.5 + Math.abs(Math.sin(t * 3 + i)) * 0.15, -30 + Math.sin(a) * RZ * r + Math.cos(t * 0.5 + i) * 2); }));
    // snow falling: a cloud of points that recycles from the top
    const NPTS = 700, pos = new Float32Array(NPTS * 3), rnd = X.mulberry(31);
    for (let i = 0; i < NPTS; i++) { pos[i * 3] = (rnd() - 0.5) * 120; pos[i * 3 + 1] = rnd() * 40; pos[i * 3 + 2] = -30 + (rnd() - 0.5) * 120; }
    const pg = new T.BufferGeometry();
    pg.setAttribute('position', new T.BufferAttribute(pos, 3));
    const flakes = new T.Points(pg, new T.PointsMaterial({ color: 0xffffff, size: 0.18, transparent: true, opacity: 0.85 }));
    k.add(flakes);
    if (!ctx.reduced) k.ticks.push((t, dt) => { const a = pg.attributes.position as T.BufferAttribute; for (let i = 0; i < NPTS; i++) { let y = a.getY(i) - dt * (1.2 + (i % 3) * 0.5); if (y < 0) y = 40; a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(t + i) * dt * 0.3); } a.needsUpdate = true; });
    // the outcrops, bare trees under snow, lamps, the towers of Midtown over the trees
    for (let i = 0; i < 10; i++) { const a = rnd() * PI * 2, r = 40 + rnd() * 20, x = Math.cos(a) * r, z = -30 + Math.sin(a) * r * 0.7; if (z > 0) continue; const s = 3 + rnd() * 4; k.box(s * 2, s, s * 1.4, x, s * 0.4, z, rock).rotation.y = rnd() * PI; k.box(s * 2.1, 0.2, s * 1.5, x, s * 0.9, z, snow).rotation.y = k.objects[k.objects.length - 1].rotation.y; }
    for (let i = 0; i < 40; i++) { const a = rnd() * PI * 2, r = 34 + rnd() * 30, x = Math.cos(a) * r, z = -30 + Math.sin(a) * r * 0.8; if (z > 2 && Math.abs(x) < 40) continue; k.tree(x, 0, z, { kind: 'bare', h: 5 + rnd() * 4, r: 3 + rnd() * 2, seed: i }); }
    for (let i = 0; i < 10; i++) { const a = (i / 10) * PI * 2; k.lamp(Math.cos(a) * (RX + 5), -30 + Math.sin(a) * (RZ + 5), 5.5, iron, 0xffe0b0, 26); }
    k.skyline({ z: 70, count: 30, spacing: 6.5, scale: 2.4, base: -2, seed: 93, lit: 0.55, glow: 1.6, tint: 0x232a3a });
    k.skyline({ z: 110, count: 26, spacing: 9, scale: 3.2, base: -2, seed: 94, lit: 0.45, glow: 1.3, tint: 0x2a3140, rows: 1 });
    k.box(80, 0.4, 60, 0, -0.2, -80, k.pbr('snowLawn', X.plaster(0xeef2f8, 34), 0.3, { roughness: 0.95 }));
    k.box(6, 3.5, 4, 22, 1.75, 4, k.flat(0xdedee0, 0.3, 0.5));
    k.box(3, 2, 3.6, 21, 4.4, 4, k.glass(0xbfd8e6, 0.4, 0.1));
    k.keepOut.push({ x: 22, z: 4, r: 4 });
    k.prop('lantern', -12, 0, 6, { height: 1.0 });
    k.prop('bell', 12, 1.6, 8, { height: 0.8 });
    k.box(0.25, 1.6, 0.25, 12, 0.8, 8, iron);
    k.censusWall({ x: 0, y: 2.6, z: 19.2, rotY: 0, cols: 22, rows: 3, tile: 0.6, gap: 0.05, start: ctx.wallStart(3300, 66), pieces: ctx.all, backing: timber });
    // the works: on the boards facing the ice, on the rental house, on the terrace
    const mounts: Mount[] = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * PI * 2 + PI / 16, x = Math.cos(a) * (RX + 0.3), z = -30 + Math.sin(a) * (RZ + 0.3);
      const rot = -Math.atan2(Math.sin(a) * RX, Math.cos(a) * RZ) + PI / 2;
      mounts.push({ position: v(x - Math.cos(a) * 0.35, 2.4, z - Math.sin(a) * 0.35), rotation: rot + PI, target: v(Math.cos(a) * (RX - 5), 3, -30 + Math.sin(a) * (RZ - 4)), width: 3.6, height: 2.0, style: 'white', wash: false });
    }
    for (const x of [-8, 0, 8]) mounts.push({ position: v(x, 3.0, 8.95), rotation: PI, target: v(x, 3, 3), width: 4.4, height: 2.6, style: 'oak' });
    for (const x of [-26, 26]) { k.box(4.6, 4, 0.4, x, 2, 4, board); mounts.push({ position: v(x, 2.6, 3.78), rotation: PI, target: v(x, 3, -1), width: 4.2, height: 2.5, style: 'white', wash: false }); }
    return { mounts, spawn: v(0, 3, -12), look: v(0, 5, -64), eye: 3, bounds: [-40, 40, -66, 8], style: 'white', floorY: (x, z) => (((x / RX) ** 2 + ((z + 30) / RZ) ** 2) < 1 ? 0.05 : 0) };
  },
};
