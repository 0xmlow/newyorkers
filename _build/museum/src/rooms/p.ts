/* Rooms 72 to 76: the Dakota, the Garden, the Temple of Dendur, the sculpture garden, the Whitney terraces. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront } from './f';

const PI = Math.PI;

/* ---------------- 72 THE DAKOTA ---------------- */
export const dakota: RoomDef = {
  id: 'dakota',
  name: 'The courtyard and the mosaic',
  area: 'THE DAKOTA',
  mood: 'December dusk',
  color: '#c8b090',
  description: 'Seventy second and Central Park West: the gabled fortress of an apartment house, the carriage arch into its courtyard, and across the street the round mosaic in the park with its one word, the works on the courtyard walls.',
  signatures: 'The sandstone and brick block with its gables, dormers and iron railings, the deep arched carriage entrance with the sentry box, the square inner courtyard with two fountains, the teardrop park across the avenue with the black and white mosaic ringed with flowers.',
  build(k, ctx) {
    k.sky({ top: 0x3a4a86, horizon: 0xf0b890, ground: 0x2a2a30, fog: 0.0024, sun: { az: 4.75, el: 0.06, color: 0xffb070, size: 20 }, haze: 0.4, stars: 120, env: 0.8 });
    k.hemi(0xffdcc0, 0x2a2c34, 0.7);
    k.sun(0xffc08a, 1.8, -70, 16, -20, true, 90);
    const stone = k.pbr('dkStone', X.ashlar(0xb8a888, 206, 3), 0.22),
      brick = k.pbr('dkBrick', X.brick(0x8a5a48, 207), 0.28),
      slate = k.pbr('dkSlate', X.steel(0x3a3a40, false, 208), 0.4, { metalness: 0.2, roughness: 0.8 }),
      iron = k.flat(0x1a1c20, 0.7, 0.45),
      cobble = k.pbr('dkCobble', X.cobble(0x6f6c68, 96), 0.9),
      lawn = k.pbr('dkLawn', X.grass(0x3a5a2a, 97), 0.06),
      pave = k.pbr('dkPave', X.pavers(0x8e8b84, 98), 0.4),
      black = k.flat(0x141416, 0, 0.5), white = k.flat(0xf4f0e8, 0, 0.5),
      glass = k.glass(0xffe0b0, 0.3, 0.1), waterM = k.flat(0x88aacc, 0.3, 0.2, { transparent: true, opacity: 0.6 }),
      warm = k.glow(0xffd8a0);
    // the avenue, the park across it, the block
    street(k, { w: 24, len: 160, z: 0, x: 0 });
    k.box(160, 0.4, 200, 100, -0.2, 0, lawn);
    k.rail(18, 0, 160, iron, 1.0, 'z', 2.4);
    k.block(17.6, 18.4, -80, -6); k.block(17.6, 18.4, 6, 80);
    const rnd = X.mulberry(72);
    for (let i = 0; i < 40; i++) { const x = 24 + rnd() * 80, z = -90 + rnd() * 180; if (Math.hypot(x - 34, z) < 14) continue; k.tree(x, 0, z, { kind: 'bare', h: 8 + rnd() * 6, r: 3 + rnd() * 2, seed: i }); }
    for (const z of [-60, -20, 20, 60]) for (const s of [-1, 1]) k.lamp(s * 13.5, z, 6.2, iron, 0xffd9a8, 30);
    // the building: a square block around a courtyard, gables and dormers, the carriage arch on 72nd
    const BX = -34, BZ = 0, BW = 44, BH = 30;
    for (const [x, z, w, d] of [[BX, BZ - BW / 2 + 5, BW, 10], [BX, BZ + BW / 2 - 5, BW, 10], [BX - BW / 2 + 5, BZ, 10, BW - 20], [BX + BW / 2 - 5, BZ, 10, BW - 20]]) { k.box(w, BH, d, x, BH / 2, z, brick); k.box(w + 0.4, 3, d + 0.4, x, 1.5, z, stone); k.box(w + 0.4, 0.8, d + 0.4, x, BH - 0.4, z, stone); }
    for (let i = 0; i < 5; i++) { const z = BZ - 16 + i * 8; const g = k.mesh(new T.ConeGeometry(4, 6, 4), slate, BX + BW / 2 - 5, BH + 3, z); g.rotation.y = PI / 4; k.box(1.2, 3, 1.2, BX + BW / 2 - 2, BH + 1.5, z + 3, brick); }
    for (let f = 0; f < 7; f++) for (let i = 0; i < 9; i++) { const y = 4 + f * 3.6, z = BZ - 18 + i * 4.5; k.box(0.16, 2.2, 1.4, BX + BW / 2 + 0.02, y, z, stone); k.box(0.06, 1.9, 1.1, BX + BW / 2 + 0.1, y, z, rnd() > 0.6 ? warm : glass); if (f % 2 === 0) { k.box(0.6, 0.06, 1.6, BX + BW / 2 + 0.4, y - 1.1, z, iron); for (let b = -0.7; b <= 0.7; b += 0.2) k.box(0.03, 0.6, 0.03, BX + BW / 2 + 0.7, y - 0.8, z + b, iron); } }
    k.block(BX - BW / 2 - 0.5, BX + BW / 2 + 0.5, BZ - BW / 2 - 0.5, BZ - BW / 2 + 10.5); k.block(BX - BW / 2 - 0.5, BX + BW / 2 + 0.5, BZ + BW / 2 - 10.5, BZ + BW / 2 + 0.5);
    k.block(BX - BW / 2 - 0.5, BX - BW / 2 + 10.5, BZ - BW / 2, BZ + BW / 2); k.block(BX + BW / 2 - 10.5, BX + BW / 2 + 0.5, BZ - BW / 2, BZ + BW / 2);
    const AZ = BZ + BW / 2 - 5;
    k.arch(5, 7, 10, BX, 0, AZ, stone, false, 0.85).rotation.y = 0;
    k.box(1.6, 2.4, 1.6, BX + 3.6, 1.2, AZ + 5.4, stone); k.box(1.4, 1.6, 0.1, BX + 3.6, 1.5, AZ + 6.2, glass); k.point(BX + 3.6, 2.2, AZ + 6.4, 0xffd8a0, 8, 5);
    k.box(6, 0.3, 12, BX, 0.05, AZ, cobble);
    k.sign('THE DAKOTA  ·  1884', 4.6, 0.6, BX, 7.6, AZ + 5.05, 'transparent', '#e8dcc0', 70, 0);
    for (let i = 0; i < 4; i++) k.point(BX, 5.5, AZ - 4 + i * 2.8, 0xffd8a0, 10, 6);
    // the courtyard: cobbles, two fountains, lamps, the doors to the four corner entrances
    const CW = BW - 20;
    k.box(CW, 0.3, CW, BX, 0.05, BZ, cobble);
    for (const dz of [-5, 5]) { k.mesh(new T.CylinderGeometry(2.4, 2.6, 0.7, 24), stone, BX, 0.35, BZ + dz); k.mesh(new T.CylinderGeometry(2.1, 2.1, 0.2, 24), waterM, BX, 0.75, BZ + dz); const j = k.mesh(new T.CylinderGeometry(0.06, 0.16, 2.2, 6), waterM, BX, 1.8, BZ + dz, true); if (!ctx.reduced) k.ticks.push((t) => { j.scale.y = 0.8 + 0.3 * Math.sin(t * 1.6 + dz); }); k.keepOut.push({ x: BX, z: BZ + dz, r: 2.8 }); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { k.lamp(BX + sx * 7, BZ + sz * 7, 3.6, iron, 0xffd9a8, 20); k.arch(2, 3.4, 0.6, BX + sx * (CW / 2 - 0.1), 0, BZ + sz * 6, stone, false, 0.8).rotation.y = PI / 2; }
    for (let f = 0; f < 7; f++) for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const y = 4 + f * 3.6, z = BZ - 8 + i * 4; k.box(0.16, 2.2, 1.4, BX + s * (CW / 2 + 0.02), y, z, stone); k.box(0.06, 1.9, 1.1, BX + s * (CW / 2 - 0.05), y, z, rnd() > 0.5 ? warm : glass); }
    k.point(BX, 8, BZ, 0xffd8a0, 30, 20);
    // the mosaic across the avenue: the round of black and white with the word, the ring of flowers, the benches
    const MX = 34, MZ = 0;
    k.mesh(new T.CylinderGeometry(6, 6.2, 0.3, 48), pave, MX, 0.1, MZ);
    k.mesh(new T.CylinderGeometry(2.6, 2.6, 0.02, 48), white, MX, 0.27, MZ);
    k.mesh(new T.RingGeometry(2.6, 3.0, 48), black, MX, 0.28, MZ).rotation.x = -PI / 2;
    for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; k.mesh(new T.RingGeometry(0.4, 0.6, 12), black, MX + Math.cos(a) * 2.1, 0.285, MZ + Math.sin(a) * 2.1).rotation.x = -PI / 2; }
    k.sign('IMAGINE', 2.4, 0.5, MX, 0.29, MZ, 'transparent', '#141416', 70, 0);
    const word = k.objects[k.objects.length - 1]; word.rotation.set(-PI / 2, 0, 0);
    for (let i = 0; i < 30; i++) { const a = (i / 30) * PI * 2; k.sphere(0.14, MX + Math.cos(a) * 2.8, 0.36, MZ + Math.sin(a) * 2.8, [k.flat(0xe83a3a, 0, 0.7), k.flat(0xf1c531, 0, 0.7), k.flat(0xf4f0e8, 0, 0.7)][i % 3], 6); }
    for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2; k.bench(MX + Math.cos(a) * 8, MZ + Math.sin(a) * 8, -a + PI / 2, k.pbr('dkBench', X.planks(0x6a5a45, 3, 209), 1.2), iron, 2.2); }
    k.keepOut.push({ x: MX, z: MZ, r: 3.4 });
    k.box(16, 0.3, 0.1, MX - 8 - 4, 0.05, MZ, pave); k.box(6, 0.3, 40, MX - 14, 0.05, MZ, pave);
    k.crowd([v(MX - 14, 0, -30), v(MX - 14, 0, 30)], 12, { seed: 82, speed: 0.5, spread: 1.6, animate: !ctx.reduced, colors: [0x24262c, 0x8a3a3a, 0x151517, 0xd8d0c0] });
    k.crowd([v(-6, 0, -70), v(-6, 0, 70)], 20, { seed: 83, speed: 1.0, spread: 2.4, animate: !ctx.reduced });
    k.censusWall({ x: BX, y: 3.6, z: BZ - CW / 2 + 0.36, rotY: 0, cols: 22, rows: 4, tile: 0.5, gap: 0.05, start: ctx.wallStart(2200, 88), pieces: ctx.all, backing: iron });
    // the works: the courtyard walls at ground level, the carriage arch, the park benches' backs face the mosaic
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = BZ - 9 + i * 6; mounts.push({ position: v(BX + s * (CW / 2 - 0.34), 2.2, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(BX, 2, z), width: 3.2, height: 1.9, style: 'gilt', wash: true }); }
    for (let i = 0; i < 4; i++) { const x = BX - 9 + i * 6; if (Math.abs(x - BX) < 2) continue; mounts.push({ position: v(x, 2.2, BZ + CW / 2 - 0.34), rotation: PI, target: v(x, 2, BZ), width: 3.2, height: 1.9, style: 'gilt', wash: true }); }
    for (let i = 0; i < 3; i++) { const z = AZ - 3 + i * 3; for (const s of [-1, 1]) mounts.push({ position: v(BX + s * 2.42, 2.4, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(BX, 2, z), width: 1.8, height: 1.4, style: 'black', wash: false }); }
    for (let i = 0; i < 4; i++) { const z = -60 + i * 40; if (Math.abs(z) < 12) continue; k.box(0.3, 3, 4.6, 18.4, 1.9, z, iron); mounts.push({ position: v(18.2, 2.0, z), rotation: PI / 2, target: v(8, 2, z), width: 4.2, height: 2.5, style: 'black', wash: false }); }
    return { mounts, spawn: v(14, 3, 44), look: v(BX + 6, 18, BZ + 6), eye: 3, bounds: [BX - CW / 2 + 0.6, 60, -80, 80], style: 'gilt' };
  },
};

/* ---------------- 73 THE GARDEN ---------------- */
export const garden: RoomDef = {
  id: 'garden',
  name: "The world's most famous arena",
  area: 'MADISON SQUARE GARDEN',
  mood: 'Fourth quarter, two minutes',
  color: '#f0842a',
  description: 'Above the train hall, the round drum of the arena: the bowl in blue and orange, the cable ceiling, the scoreboard cube, a game on the floor, the works around the concourse.',
  signatures: 'The circular drum on Seventh Avenue, the bowl of orange and blue seats climbing to the suspended cable roof, the four sided scoreboard over centre court, the hardwood with its lines, the bridges hanging under the ceiling.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x14183a, horizon: 0x4a4060, ground: 0x0e0e12, fog: 0.003, stars: 120, env: 0.6 });
    k.hemi(0xffe4c8, 0x1a1418, 0.5);
    const conc = k.pbr('mgConc', X.concrete(0x8a8a86, 99), 0.3),
      drum = k.pbr('mgDrum', X.concrete(0xb8b4ac, 100), 0.4),
      floorH = k.pbr('mgHardwood', X.planks(0xd8b070, 6, 214, 0.15), 0.9, { roughness: 0.35 }),
      orange = k.flat(0xf08a2a, 0, 0.8), blue = k.flat(0x1e56b4, 0, 0.8),
      dark = k.flat(0x111216, 0.5, 0.7), steel = k.flat(0x8c98a4, 0.9, 0.3),
      white = k.flat(0xf4f0e8, 0, 0.6), glowW = k.glow(0xfff4e0), screen = k.glow(0x3a6aff, 0.9);
    // Seventh Avenue and the drum
    street(k, { w: 24, len: 160, z: 60, x: 0 });
    blockFront(k, { x: 40, z0: 140, count: 10, face: -1, seed: 215, h: [18, 40] });
    const R = 60;
    k.mesh(new T.CylinderGeometry(R, R, 26, 64, 1, true), drum, 0, 13, -20);
    k.mesh(new T.CylinderGeometry(R + 1, R + 1, 2, 64), conc, 0, 27, -20);
    for (let i = 0; i < 48; i++) { const a = (i / 48) * PI * 2; k.box(1.2, 26, 0.8, Math.cos(a) * (R + 0.3), 13, -20 + Math.sin(a) * (R + 0.3), conc).rotation.y = -a; }
    k.box(30, 8, 8, 0, 4, 44, dark);
    k.sign('MADISON SQUARE GARDEN', 26, 2.4, 0, 4.5, 48.05, '#111216', '#f4f0e8', 150, 0, { border: true });
    for (let i = 0; i < 6; i++) k.arch(2.6, 3.6, 4, -10 + i * 4, 0, 40, dark, false, 0.85);
    k.block(-R, -11.4, 39, 41); k.block(11.4, R, 39, 41);
    // the bowl: rings of seats climbing in two tiers, the concourse ring, the court in the middle
    const CX = 0, CZ = -20;
    k.box(120, 0.4, 120, CX, -0.2, CZ, conc);
    k.box(29, 0.1, 15.5, CX, 0.05, CZ, floorH);
    for (const [w, d, x, z] of [[28, 0.08, 0, 7.6], [28, 0.08, 0, -7.6], [0.08, 15.2, 14, 0], [0.08, 15.2, -14, 0], [0.08, 15.2, 0, 0]]) k.box(w as number, 0.01, d as number, CX + (x as number), 0.11, CZ + (z as number), white);
    for (const s of [-1, 1]) { k.box(4.9, 0.01, 5.8, CX + s * (14 - 2.9), 0.105, CZ, orange).rotation.y = PI / 2; k.torus(1.8, 0.03, CX + s * (14 - 5.8), 0.11, CZ, white, 32).rotation.x = PI / 2; }
    k.torus(1.8, 0.03, CX, 0.11, CZ, white, 32).rotation.x = PI / 2;
    for (const s of [-1, 1]) { const x = CX + s * (14 + 1.2); k.beam(v(x, 0, CZ), v(x, 3.4, CZ), 0.1, steel, 6); k.box(0.05, 1.05, 1.8, x - s * 1.2, 3.05, CZ, k.glass(0xffffff, 0.35, 0.05)); k.torus(0.23, 0.02, x - s * 1.5, 2.55, CZ, orange, 16).rotation.x = PI / 2; }
    k.block(CX - 15, CX + 15, CZ - 8, CZ + 8);
    const seatG = new T.BoxGeometry(0.5, 0.5, 0.5); seatG.translate(0, 0.25, 0);
    const lo: T.Matrix4[] = [], hi: T.Matrix4[] = [];
    for (let r = 0; r < 22; r++) { const rad = 18 + r * 0.9, y = 0.4 + r * 0.5; const n = Math.floor(rad * 6); for (let i = 0; i < n; i++) { const a = (i / n) * PI * 2; if (r > 12 && Math.abs(Math.sin(a)) < 0.06) continue; (r % 2 ? lo : hi).push(new T.Matrix4().compose(v(CX + Math.cos(a) * rad, y, CZ + Math.sin(a) * rad), new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), -a + PI / 2), v(1, 1, 1))); } k.mesh(new T.RingGeometry(rad - 0.45, rad + 0.45, 96), conc, CX, y - 0.05, CZ).rotation.x = -PI / 2; }
    k.instances(seatG, blue, lo); k.instances(seatG, orange, hi);
    for (let r = 0; r < 12; r++) { const rad = 40 + r * 0.9, y = 13 + r * 0.6; const n = Math.floor(rad * 5); const arr: T.Matrix4[] = []; for (let i = 0; i < n; i++) { const a = (i / n) * PI * 2; if (Math.abs(Math.sin(a)) < 0.05 || Math.abs(Math.cos(a)) < 0.05) continue; arr.push(new T.Matrix4().compose(v(CX + Math.cos(a) * rad, y, CZ + Math.sin(a) * rad), new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), -a + PI / 2), v(1, 1, 1))); } k.instances(seatG, r % 2 ? blue : orange, arr); k.mesh(new T.RingGeometry(rad - 0.45, rad + 0.45, 96), conc, CX, y - 0.05, CZ).rotation.x = -PI / 2; }
    k.mesh(new T.RingGeometry(38, 40.5, 96), conc, CX, 12.4, CZ).rotation.x = -PI / 2;
    k.mesh(new T.CylinderGeometry(39.6, 39.6, 3, 96, 1, true), dark, CX, 11, CZ);
    k.mesh(new T.RingGeometry(16.5, 18.5, 96), conc, CX, 0.05, CZ).rotation.x = -PI / 2;
    k.rail(0, 0, 0, steel, 1.0, 'x', 1);
    for (let i = 0; i < 64; i++) { const a = (i / 64) * PI * 2; k.box(0.06, 1.0, 0.06, CX + Math.cos(a) * 16.6, 0.5, CZ + Math.sin(a) * 16.6, steel); k.box(0.06, 1.0, 0.06, CX + Math.cos(a) * 38.2, 12.9, CZ + Math.sin(a) * 38.2, steel); }
    k.torus(16.6, 0.03, CX, 1.0, CZ, steel, 96).rotation.x = PI / 2; k.torus(38.2, 0.03, CX, 13.4, CZ, steel, 96).rotation.x = PI / 2;
    // the cable roof and the bridges, the cube over centre
    k.mesh(new T.CylinderGeometry(R - 1, R - 1, 0.5, 64), dark, CX, 30, CZ);
    for (let i = 0; i < 48; i++) { const a = (i / 48) * PI * 2; k.curve([v(CX + Math.cos(a) * (R - 2), 29.6, CZ + Math.sin(a) * (R - 2)), v(CX + Math.cos(a) * 25, 24, CZ + Math.sin(a) * 25), v(CX + Math.cos(a) * 4, 22.6, CZ + Math.sin(a) * 4)], 0.1, steel, 16); }
    for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; k.point(CX + Math.cos(a) * 30, 24, CZ + Math.sin(a) * 30, 0xfff0d8, 60, 40); k.box(1.6, 0.4, 1.0, CX + Math.cos(a) * 30, 25, CZ + Math.sin(a) * 30, glowW).rotation.y = -a; }
    for (const a of [PI / 4, (3 * PI) / 4, (5 * PI) / 4, (7 * PI) / 4]) k.box(50, 1.2, 2.4, CX, 21, CZ, steel).rotation.y = a;
    const cube = new T.Group(); cube.position.set(CX, 15, CZ);
    for (let f = 0; f < 4; f++) { const face = new T.Mesh(new T.PlaneGeometry(9, 5), new T.MeshBasicMaterial({ color: 0x0a0a10 })); face.rotation.y = (f / 4) * PI * 2; face.position.set(Math.sin((f / 4) * PI * 2) * 4.6, 0, Math.cos((f / 4) * PI * 2) * 4.6); cube.add(face); }
    const frame = new T.Mesh(new T.BoxGeometry(9.4, 5.4, 9.4), dark); cube.add(frame);
    k.add(cube); k.beam(v(CX, 30, CZ), v(CX, 17.8, CZ), 0.2, steel, 8);
    if (!ctx.reduced) k.ticks.push((t) => { cube.rotation.y = t * 0.05; });
    for (let f = 0; f < 4; f++) { const a = (f / 4) * PI * 2; k.sign('HOME 98  ·  VISITORS 97  ·  4TH  1:58', 8.4, 1.0, CX + Math.sin(a) * 4.75, 16.6, CZ + Math.cos(a) * 4.75, '#0a0a10', '#f08a2a', 80, a, { border: false }); }
    // the game and the crowd, the concourse, the census as the ribbon board
    const players = k.crowd([v(CX - 12, 0.1, CZ - 5), v(CX + 12, 0.1, CZ + 5), v(CX - 12, 0.1, CZ + 5), v(CX + 12, 0.1, CZ - 5)], 10, { seed: 84, speed: 3.6, spread: 4, animate: !ctx.reduced, closed: true, colors: [0xf4f0e8, 0x1e56b4, 0xf4f0e8, 0xf08a2a] });
    void players;
    const ball = k.mesh(new T.SphereGeometry(0.12, 10, 8), orange, CX, 1, CZ, true);
    if (!ctx.reduced) k.ticks.push((t) => { ball.position.set(CX + Math.sin(t * 0.5) * 12, 0.9 + Math.abs(Math.sin(t * 4)) * 1.6, CZ + Math.cos(t * 0.35) * 5); });
    k.censusWall({ x: CX, y: 12, z: CZ, rotY: 0, cols: 1, rows: 1, tile: 0.01, gap: 0, start: 0, pieces: ctx.all.slice(0, 1), backing: dark });
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2 + PI / 8; const x = CX + Math.cos(a) * 39.4, z = CZ + Math.sin(a) * 39.4; k.censusWall({ x, y: 15.2, z, rotY: -a + PI / 2 + PI, cols: 12, rows: 2, tile: 0.55, gap: 0.05, start: ctx.wallStart(300 + i * 24, 24), pieces: ctx.all, backing: dark }); }
    k.crowd([v(CX - 17, 0.1, CZ - 10), v(CX + 17, 0.1, CZ + 10)], 8, { seed: 85, speed: 0.3, spread: 3, animate: !ctx.reduced });
    k.point(CX, 6, CZ, 0xfff4e0, 60, 30);
    // the works: the concourse ring wall between the vomitories, the courtside boards, the lobby
    const mounts: Mount[] = [];
    for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2 + PI / 12; const x = CX + Math.cos(a) * 41.2, z = CZ + Math.sin(a) * 41.2; if (Math.abs(a - PI / 2) < 0.3 || Math.abs(a - (3 * PI) / 2) < 0.3) continue; mounts.push({ position: v(x, 16.5, z), rotation: -a + PI / 2 + PI, target: v(CX + Math.cos(a) * 34, 15, CZ + Math.sin(a) * 34), width: 4.2, height: 2.5, style: 'steel', wash: true }); }
    for (let i = 0; i < 6; i++) { const x = CX - 12 + i * 4.8; for (const s of [-1, 1]) mounts.push({ position: v(x, 0.7, CZ + s * 8.2), rotation: s > 0 ? PI : 0, target: v(x, 1, CZ), width: 4.4, height: 1.0, style: 'none', wash: false }); }
    for (let i = 0; i < 3; i++) { const x = -8 + i * 8; mounts.push({ position: v(x, 3.4, 40.34), rotation: PI, target: v(x, 3, 30), width: 3.6, height: 2.1, style: 'steel', wash: true }); }
    return { mounts, spawn: v(-18, 3, 64), look: v(4, 12, 24), eye: 3, bounds: [-42, 42, CZ - 42, 68], style: 'steel', floorY: (x, z) => { const d = Math.hypot(x - CX, z - CZ); if (d > 38 && d < 41 && z < 30) return 12.4; if (d >= 18 && d <= 38 && z < 30) return 0.4 + Math.min(21, (d - 18) / 0.9) * 0.5; return 0; } };
  },
};

/* ---------------- 74 THE TEMPLE OF DENDUR ---------------- */
export const dendur: RoomDef = {
  id: 'dendur',
  name: 'The temple by the window',
  area: 'THE TEMPLE OF DENDUR',
  mood: 'Snow light through glass',
  color: '#d8c8a0',
  description: 'The great sloped glass wall on the park, the pool standing in for the Nile, the sandstone gate and temple on their platform, the works along the granite walls of the wing.',
  signatures: 'The Sackler wing with its tilted wall of glass and the park beyond, the reflecting pool with its edge of black granite, the temple and its pylon gateway raised on a stone platform, the sloped granite walls of the hall, the sunlight sliding across the floor.',
  build(k, ctx) {
    k.sky({ top: 0x9ab0c8, horizon: 0xe8e8e4, ground: 0x6a6a68, fog: 0.002, sun: { az: 3.6, el: 0.55, color: 0xfff4e6, size: 12 }, haze: 0.5, env: 0.95 });
    k.hemi(0xeef4ff, 0x4a4a48, 0.9);
    k.sun(0xfff0dc, 2.2, 60, 60, 30, true, 90);
    const granite = k.pbr('tdGranite', X.ashlar(0x7a7268, 216, 3), 0.25, { roughness: 0.7 }),
      floorG = k.pbr('tdFloor', X.terrazzo(0xa8a49a, 101), 0.4, { roughness: 0.3 }),
      sandstone = k.pbr('tdSandstone', X.ashlar(0xc8a878, 217, 2), 0.2, { roughness: 0.85 }),
      water = k.flat(0x1a2a34, 0.2, 0.1, { transparent: true, opacity: 0.85 }),
      glass = k.glass(0xe8f4f8, 0.1, 0.03),
      steel = k.flat(0x8c98a4, 0.9, 0.3),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      snow = k.pbr('tdSnow', X.plaster(0xf4f4f8, 102), 0.3, { roughness: 0.9 });
    // the park outside under snow, the wing's glass wall sloping out over it
    k.box(300, 0.4, 200, 0, -0.2, -140, snow);
    const rnd = X.mulberry(74);
    for (let i = 0; i < 50; i++) k.tree((rnd() - 0.5) * 240, 0, -60 - rnd() * 120, { kind: 'bare', h: 8 + rnd() * 6, r: 3 + rnd() * 2, seed: i });
    k.skyline({ z: -320, count: 26, spacing: 10, scale: 2.8, base: -1, seed: 218, lit: 0.25, glow: 0.5, tint: 0x8a8e96, rows: 1, spires: true });
    const HW = 60, HD = 50, HH = 16;
    k.box(HW, 0.4, HD, 0, -0.2, 0, floorG);
    for (const s of [-1, 1]) { const w = k.box(0.8, HH, HD, s * HW / 2, HH / 2, 0, granite); w.rotation.z = -s * 0.12; k.block(s * HW / 2 - 1.2, s * HW / 2 + 1.2, -HD / 2, HD / 2); }
    k.box(HW, HH, 0.8, 0, HH / 2, HD / 2, granite); k.block(-HW / 2, -2, HD / 2 - 0.6, HD / 2 + 0.6); k.block(2, HW / 2, HD / 2 - 0.6, HD / 2 + 0.6);
    k.box(HW + 2, 0.6, HD + 2, 0, HH, 0, dark);
    const gw = k.mesh(new T.PlaneGeometry(HW, HH + 3), glass, 0, HH / 2 - 0.4, -HD / 2 - 1.6); gw.rotation.x = -0.18;
    for (let x = -HW / 2; x <= HW / 2; x += 3) { const m = k.box(0.24, HH + 3, 0.24, x, HH / 2 - 0.4, -HD / 2 - 1.6, steel); m.rotation.x = -0.18; }
    for (let y = 2; y < HH + 2; y += 3) { const m = k.box(HW, 0.16, 0.16, 0, y, -HD / 2 - 1.6 + (HH / 2 - 0.4 - y) * 0.18, steel); void m; }
    k.block(-HW / 2, HW / 2, -HD / 2 - 2.6, -HD / 2 - 1.0);
    // the pool, the platform, the gate and the temple
    k.box(HW - 8, 0.3, 14, 0, 0.1, -HD / 2 + 10, k.flat(0x141416, 0.1, 0.4));
    k.box(HW - 9, 0.16, 13, 0, 0.26, -HD / 2 + 10, water);
    k.block(-HW / 2 + 4, HW / 2 - 4, -HD / 2 + 3, -HD / 2 + 17);
    const PX = 0, PZ = 0;
    k.box(30, 1.2, 22, PX, 0.6, PZ, sandstone);
    k.box(30.4, 0.3, 22.4, PX, 1.3, PZ, k.pbr('tdPlat', X.ashlar(0x8a8478, 219, 3), 0.25));
    for (let i = 0; i < 4; i++) k.box(30, 0.3, 1.0, PX, 0.15 + i * 0.3, PZ + 11 + 3 - i * 1.0, sandstone);
    k.box(4, 8, 2.4, PX - 4, 5.4, PZ + 6, sandstone); k.box(4, 8, 2.4, PX + 4, 5.4, PZ + 6, sandstone); k.box(12, 1.2, 2.6, PX, 9.9, PZ + 6, sandstone);
    k.arch(3.6, 6.2, 2.6, PX, 1.4, PZ + 6, sandstone, false, 0.9);
    k.box(8, 7, 12, PX, 4.9, PZ - 4, sandstone);
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) k.box(0.3, 4, 0.3, PX + s * 3.9, 3.6, PZ + 1 - i * 3, sandstone);
    k.arch(2.4, 4.4, 0.6, PX, 1.4, PZ + 2, sandstone, false, 0.9);
    k.box(8.4, 0.8, 12.4, PX, 8.8, PZ - 4, sandstone);
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { k.box(0.06, 0.6, 0.6, PX + s * 4.02, 4 + (i % 3) * 1.4, PZ - 8 + Math.floor(i / 3) * 6, k.flat(0xa88860, 0, 0.9)); }
    k.block(PX - 15.4, PX + 15.4, PZ - 11.4, PZ + 11.4);
    k.point(PX, 12, PZ - 4, 0xffe8d0, 30, 24);
    k.point(PX, 3, PZ + 12, 0xffe8d0, 10, 8);
    const sunPatch = k.mesh(new T.PlaneGeometry(14, 30), k.glow(0xfff0d8, 0.12), 0, 0.02, 4); sunPatch.rotation.x = -PI / 2; (sunPatch.material as T.MeshBasicMaterial).transparent = true;
    if (!ctx.reduced) k.ticks.push((t) => { sunPatch.position.x = -18 + ((t * 0.4) % 36); });
    k.crowd([v(-22, 0, 18), v(-10, 0, -14), v(12, 0, -14), v(22, 0, 18)], 14, { seed: 86, speed: 0.4, spread: 2, animate: !ctx.reduced, colors: [0x24262c, 0x8a3a3a, 0x151517, 0xd8d0c0, 0x33477f] });
    k.censusWall({ x: 0, y: 4.6, z: HD / 2 - 0.42, rotY: PI, cols: 40, rows: 5, tile: 0.55, gap: 0.05, start: ctx.wallStart(4200, 200), pieces: ctx.all, backing: dark });
    k.sign('THE TEMPLE OF DENDUR  ·  15 BC  ·  GIVEN 1965', 12, 0.7, 0, 8.4, HD / 2 - 0.42, 'transparent', '#e8dcc0', 70, PI);
    // the works: the sloped granite walls of the hall on both sides, the platform's edge screens, the glass wall piers
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const z = -18 + i * 8; mounts.push({ position: v(s * (HW / 2 - 0.9), 3.8, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * (HW / 2 - 10), 3, z), width: 4.6, height: 2.7, style: 'steel', wash: true }); }
    for (let i = 0; i < 4; i++) { const x = -12 + i * 8; k.box(3.6, 2.4, 0.2, x, 2.4, PZ + 11.5, sandstone); mounts.push({ position: v(x, 2.5, PZ + 11.62), rotation: 0, target: v(x, 2.5, PZ + 20), width: 3.2, height: 1.9, style: 'none', wash: false }); }
    for (let i = 0; i < 4; i++) { const x = -21 + i * 14; mounts.push({ position: v(x, 4.0, -HD / 2 + 2.6), rotation: 0, target: v(x, 3, -HD / 2 + 12), width: 3.2, height: 4.0, style: 'steel', wash: false }); k.box(0.3, 5, 0.3, x - 1.8, 2.5, -HD / 2 + 2.4, steel); k.box(0.3, 5, 0.3, x + 1.8, 2.5, -HD / 2 + 2.4, steel); }
    return { mounts, spawn: v(-10, 3, HD / 2 - 6), look: v(PX, 6, PZ - 10), eye: 3, bounds: [-HW / 2 + 2, HW / 2 - 2, -HD / 2 + 3, HD / 2 - 1], style: 'steel', floorY: (x, z) => (Math.abs(x - PX) < 15 && z > PZ - 11 && z < PZ + 11 ? 1.45 : Math.abs(x - PX) < 15 && z >= PZ + 11 && z < PZ + 14.5 ? Math.max(0, 1.45 - ((z - PZ - 11) / 3.5) * 1.45) : 0) };
  },
};

/* ---------------- 75 THE SCULPTURE GARDEN ---------------- */
export const moma: RoomDef = {
  id: 'moma',
  name: 'The garden on 54th',
  area: 'THE SCULPTURE GARDEN',
  mood: 'First warm Friday',
  color: '#8ab0a8',
  description: 'The marble court between the towers: two long pools, the birches and the weeping beech, the bronze figures on their plinths, the glass galleries looking in, the works on the garden walls.',
  signatures: 'The sunken marble court with two rectangular pools crossed by narrow bridges, groves of birches and a weeping beech, bronzes on low plinths, the grey granite wall to the street, the glass curtain walls of the galleries above.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad8, horizon: 0xeef0ec, ground: 0x6a6a66, fog: 0.002, sun: { az: 3.4, el: 0.8, color: 0xfff6e8, size: 12 }, env: 1.0 });
    k.hemi(0xf2f6ff, 0x5a5a58, 0.95);
    k.sun(0xfff2dc, 2.4, 20, 80, 20, true, 80);
    const marble = k.pbr('mmMarble', X.marble(0xd8d4cc, 0x9a948a, 15), 0.6, { roughness: 0.35 }),
      granite = k.pbr('mmGranite', X.ashlar(0x6a6a66, 220, 3), 0.25),
      water = k.flat(0x1e3a44, 0.2, 0.1, { transparent: true, opacity: 0.85 }),
      glass = k.glass(0xdcecf6, 0.14, 0.04),
      steel = k.flat(0x8c98a4, 0.9, 0.3),
      bronze = k.flat(0x3a3028, 0.7, 0.45),
      white = k.flat(0xf4f0e8, 0.05, 0.6),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      pave = k.pbr('mmPave', X.terrazzo(0xc8c4bc, 103), 0.5, { roughness: 0.3 }),
      birchBark = k.flat(0xe8e4dc, 0, 0.9), birchLeaf = k.flat(0x8ab04a, 0, 0.9);
    // 54th Street and the granite wall, the museum's glass flanks, the towers over it
    street(k, { w: 20, len: 140, z: 30, x: 0 });
    blockFront(k, { x: -46, z0: 90, count: 10, face: 1, seed: 221, h: [18, 40] });
    const GW = 60, GD = 34, GZ = 8;
    k.box(GW + 8, 4.6, 0.8, 0, 2.3, GZ, granite);
    k.block(-GW / 2 - 4, -2.4, GZ - 0.6, GZ + 0.6); k.block(2.4, GW / 2 + 4, GZ - 0.6, GZ + 0.6);
    k.box(4, 3.4, 0.2, 0, 1.7, GZ, steel); k.box(3.2, 3.0, 0.05, 0, 1.7, GZ, glass);
    k.box(GW, 0.3, GD, 0, -0.85, GZ - GD / 2, marble);
    for (let i = 0; i < 4; i++) k.box(8, 0.3, 1.2, 0, -0.15 - i * 0.25, GZ - 1.2 - i * 1.2, marble);
    for (const s of [-1, 1]) { k.box(0.6, 30, GD, s * (GW / 2 + 0.3), 14, GZ - GD / 2, glass); for (let z = GZ; z > GZ - GD; z -= 4) k.box(0.4, 30, 0.4, s * (GW / 2 + 0.3), 14, z, steel); for (let y = 4; y < 30; y += 4.5) k.box(0.4, 0.4, GD, s * (GW / 2 + 0.3), y, GZ - GD / 2, steel); k.block(s * GW / 2 - 0.4, s * GW / 2 + 1, GZ - GD, GZ); for (let y = 2.5; y < 28; y += 4.5) for (let z = GZ - 3; z > GZ - GD; z -= 6) k.point(s * (GW / 2 - 2), y, z, 0xfff0e0, 6, 6); }
    k.box(GW + 2, 20, 0.8, 0, 10, GZ - GD, glass); for (let x = -GW / 2; x <= GW / 2; x += 4) k.box(0.4, 20, 0.4, x, 10, GZ - GD, steel);
    k.block(-GW / 2, GW / 2, GZ - GD - 0.6, GZ - GD + 0.6);
    for (const [x, z, w, h] of [[-50, -60, 30, 120], [40, -70, 34, 160], [0, -90, 40, 200]]) k.box(w as number, h as number, w as number, x as number, (h as number) / 2, z as number, k.pbr('mmTower', X.windows(222, 0.25, 0x6a7a8a, false), 0.11, { emissive: 0xffffff, emissiveIntensity: 0.4, roughness: 0.3, metalness: 0.6, stretch: 0.42 }));
    // the pools with their bridges, the trees, the bronzes on plinths, the benches
    const Y = -0.85;
    for (const [x, len] of [[-14, 26], [16, 22]]) { k.box(len as number, 0.2, 5, x as number, Y + 0.05, GZ - GD / 2 + 2, k.flat(0x141416, 0.1, 0.4)); k.box((len as number) - 0.6, 0.12, 4.4, x as number, Y + 0.16, GZ - GD / 2 + 2, water); k.block((x as number) - (len as number) / 2, (x as number) + (len as number) / 2, GZ - GD / 2 - 0.5, GZ - GD / 2 + 4.5); }
    for (const x of [-20, -8, 22]) { k.box(1.6, 0.14, 5.2, x, Y + 0.32, GZ - GD / 2 + 2, marble); k.keepOut.splice(0, 0); }
    k.block(-27, -21, GZ - GD / 2 - 0.5, GZ - GD / 2 + 4.5); k.block(-19, -9, GZ - GD / 2 - 0.5, GZ - GD / 2 + 4.5); k.block(-7, -1, GZ - GD / 2 - 0.5, GZ - GD / 2 + 4.5); k.block(5, 21, GZ - GD / 2 - 0.5, GZ - GD / 2 + 4.5); k.block(23, 27, GZ - GD / 2 - 0.5, GZ - GD / 2 + 4.5);
    const rnd = X.mulberry(75);
    for (let i = 0; i < 14; i++) { const x = -26 + rnd() * 52, z = GZ - GD + 3 + rnd() * 8; k.cyl(0.12, 6 + rnd() * 3, x, Y + 3, z, birchBark, 0.09, 8); for (let j = 0; j < 4; j++) k.sphere(0.9 + rnd() * 0.6, x + (rnd() - 0.5) * 1.6, Y + 5 + j * 0.9 + rnd(), z + (rnd() - 0.5) * 1.6, birchLeaf, 7); k.keepOut.push({ x, z, r: 0.4 }); }
    k.tree(-22, Y, GZ - 8, { kind: 'round', h: 6, r: 5, leaf: 0x5a3a4a, seed: 9 });
    const plinths: [number, number][] = [[-4, GZ - 8], [8, GZ - 8], [0, GZ - 24], [24, GZ - 12], [-26, GZ - 22]];
    plinths.forEach(([x, z], i) => { k.box(1.6, 0.5, 1.6, x, Y + 0.25, z, white); if (i % 2) { k.mesh(new T.TorusKnotGeometry(0.5, 0.16, 64, 10), bronze, x, Y + 1.4, z); } else { k.box(0.5, 1.7, 0.4, x, Y + 1.35, z, bronze); k.sphere(0.22, x, Y + 2.4, z, bronze, 10); k.box(0.16, 0.9, 0.16, x + 0.4, Y + 1.4, z, bronze).rotation.z = -0.6; } k.keepOut.push({ x, z, r: 1.3 }); });
    for (const x of [-10, 4, 18]) k.bench(x, GZ - 3, 0, k.pbr('mmBench', X.planks(0x4a4a48, 3, 223), 1.2), steel, 2.4);
    k.crowd([v(-24, Y, GZ - 4), v(-4, Y, GZ - 12), v(10, Y, GZ - 26), v(26, Y, GZ - 6)], 20, { seed: 87, speed: 0.4, spread: 2, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a, 0x33477f] });
    k.censusWall({ x: 0, y: 2.0, z: GZ - 0.42, rotY: PI, cols: 40, rows: 3, tile: 0.55, gap: 0.05, start: ctx.wallStart(5300, 120), pieces: ctx.all, backing: granite });
    // the works: the granite street wall, the glass flanks at garden level, the far glass wall
    const mounts: Mount[] = [];
    for (let i = 0; i < 5; i++) { const x = -24 + i * 12; if (Math.abs(x) < 3) continue; mounts.push({ position: v(x, Y + 3.0, GZ - 0.42), rotation: PI, target: v(x, Y + 2, GZ - 8), width: 4.2, height: 2.5, style: 'white', wash: true }); }
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = GZ - 5 - i * 8; k.box(0.2, 3.2, 4.4, s * (GW / 2 - 0.6), Y + 2.0, z, white); mounts.push({ position: v(s * (GW / 2 - 0.72), Y + 2.1, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * (GW / 2 - 8), Y + 2, z), width: 4.0, height: 2.4, style: 'white', wash: true }); }
    for (let i = 0; i < 6; i++) { const x = -25 + i * 10; k.box(4.4, 3.2, 0.2, x, Y + 2.0, GZ - GD + 0.6, white); mounts.push({ position: v(x, Y + 2.1, GZ - GD + 0.72), rotation: 0, target: v(x, Y + 2, GZ - GD + 8), width: 4.0, height: 2.4, style: 'white', wash: true }); }
    return { mounts, spawn: v(0, 3, GZ - 1.2), look: v(3, 0, GZ - 30), eye: 3, bounds: [-GW / 2 + 1, GW / 2 - 1, GZ - GD + 1.2, GZ + 30], style: 'white', floorY: (x, z) => { void x; if (z < GZ - 0.6 && z > GZ - 5.4) return Math.max(Y, -((GZ - 0.6 - z) / 4.8) * 0.85); if (z <= GZ - 5.4) return Y; return 0; } };
  },
};

/* ---------------- 76 THE WHITNEY ---------------- */
export const whitney: RoomDef = {
  id: 'whitney',
  name: 'The terraces over the High Line',
  area: 'THE WHITNEY',
  mood: 'Blue afternoon on the river',
  color: '#a8c0d0',
  description: 'Gansevoort Street where the High Line ends: the stepped museum, its outdoor stairs and terraces climbing the east face, the largest column free gallery inside, the river and the works on both.',
  signatures: 'The asymmetric stack of steel and glass with cantilevered terraces stepping down toward the High Line, the outside steel stairs between them, the vast open gallery with its sawtooth skylights, the Hudson and the piers to the west, the cobbled meatpacking streets.',
  build(k, ctx) {
    k.sky({ top: 0x5f8fd0, horizon: 0xe8ecf0, ground: 0x5a5a58, fog: 0.0018, sun: { az: 4.2, el: 0.5, color: 0xfff4e6, size: 12 }, env: 1.0 });
    k.hemi(0xeef4ff, 0x4a4a48, 0.95);
    k.sun(0xfff0dc, 2.4, -60, 60, 30, true, 100);
    const steel = k.pbr('whSteel', X.steel(0xb8bcc0, false, 224), 0.6, { metalness: 0.7, roughness: 0.4 }),
      steelD = k.pbr('whSteelD', X.steel(0x6a7078, true, 225), 0.6, { metalness: 0.7, roughness: 0.45 }),
      glass = k.glass(0xdcecf6, 0.14, 0.04),
      deck = k.pbr('whDeck', X.boardwalk(0x9a8a70), 0.5),
      floorG = k.pbr('whFloor', X.planks(0xb8a888, 8, 226, 0.1), 1.0, { roughness: 0.5 }),
      cobble = k.pbr('whCobble', X.cobble(0x6f6c68, 104), 0.9),
      white = k.flat(0xf4f0e8, 0.05, 0.6),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      rail = k.flat(0x8c98a4, 0.9, 0.3);
    // the cobbled street, the river and the piers to the west, the High Line arriving from the north
    k.box(200, 0.4, 200, 0, -0.2, 0, cobble);
    k.water({ y: -1.4, color: 0x2e4a5c, w: 500, d: 500, x: -220, z: 0, amp: 1.0 });
    k.box(24, 1, 90, -80, -0.5, -20, k.pbr('whPier', X.concrete(0x8a8a84, 105), 0.3));
    for (const z of [-60, 10]) { k.box(14, 8, 30, -80, 4, z, k.pbr('whShed', X.steel(0x9a9e9a, true, 227), 0.6)); k.mesh(new T.CylinderGeometry(7, 7, 30, 16, 1, false, 0, PI), k.pbr('whShed', X.steel(0x9a9e9a, true, 227), 0.6), -80, 8, z).rotation.set(PI / 2, 0, PI / 2); }
    blockFront(k, { x: 40, z0: 100, count: 8, face: -1, seed: 228, h: [10, 18] });
    blockFront(k, { x: 40, z0: -20, count: 6, face: -1, seed: 229, h: [10, 16] });
    k.skyline({ z: -260, count: 26, spacing: 10, scale: 3.2, base: -1, seed: 230, lit: 0.25, glow: 0.5, tint: 0x6e7684, rows: 1, spires: true });
    const HY = 8;
    for (let z = 40; z <= 140; z += 12) for (const x of [10, 20]) k.box(0.9, HY, 0.9, x, HY / 2, z, steelD);
    k.box(12, 0.8, 110, 15, HY, 90, steelD); k.box(6, 0.2, 110, 15, HY + 0.5, 90, deck);
    for (let z = 40; z <= 140; z += 6) k.box(0.06, 1.2, 0.06, 12.4, HY + 1.1, z, rail), k.box(0.06, 1.2, 0.06, 17.6, HY + 1.1, z, rail);
    // the museum: a stack of blocks stepping back from the High Line, terraces on each step, the outdoor stairs
    const MX = -20, MZ = 0;
    const blocks: [number, number, number, number][] = [[46, 12, 46, 0], [40, 10, 40, 12], [34, 10, 32, 22], [28, 10, 26, 32]];
    blocks.forEach(([w, h, d, y], i) => { k.box(w, h, d, MX - (46 - w) / 2, y + h / 2, MZ, i % 2 ? steel : glass); for (let yy = y + 2; yy < y + h; yy += 3.4) k.box(w + 0.1, 0.24, d + 0.1, MX - (46 - w) / 2, yy, MZ, steelD); for (let xx = -w / 2; xx <= w / 2; xx += 4) k.box(0.24, h, 0.24, MX - (46 - w) / 2 + xx, y + h / 2, MZ + d / 2 + 0.05, steelD); });
    const terraces: [number, number, number, number][] = [];
    for (let i = 1; i < blocks.length; i++) { const [w, , d, y] = blocks[i]; const [pw] = blocks[i - 1]; const tx = MX - (46 - pw) / 2 + pw / 2 - (pw - w) / 4 + (pw - w) / 4; const tw = (pw - w) / 1 + 0; void tx; void tw; const ex = MX + pw / 2 - (46 - pw) / 2; terraces.push([ex - (pw - w) / 2, y, (pw - w), d]); k.box(pw - w, 0.3, d, ex - (pw - w) / 2, y + 0.15, MZ, deck); k.rail(ex - 0.2, MZ, d, rail, 1.05, 'z', 2); k.rail(ex - (pw - w) / 2, MZ + d / 2 - 0.2, pw - w, rail, 1.05, 'x', 2); k.rail(ex - (pw - w) / 2, MZ - d / 2 + 0.2, pw - w, rail, 1.05, 'x', 2); }
    for (let i = 0; i < 3; i++) { const [x0, y0, w0] = terraces[i]; const y1 = i + 1 < terraces.length ? terraces[i + 1][1] : y0 + 10; const sx = x0 - w0 / 2 + 1.2; for (let s = 0; s < 20; s++) k.box(1.8, 0.25, 0.8, sx, y0 + 0.5 + s * ((y1 - y0) / 20), MZ - blocks[i + 1][2] / 2 + 2 + s * 1.0, steelD); k.rail(sx - 1.0, MZ - blocks[i + 1][2] / 2 + 12, 20, rail, 1.0, 'z', 2.5); }
    for (let s = 0; s < 24; s++) k.box(3, 0.5, 1.2, MX + 23 + 2, 0.25 + s * 0.5, MZ + 23 - s * 1.0 - 0, steelD);
    k.block(MX - 23, MX + 23, MZ - 23, MZ - 22); k.block(MX - 23, MX - 22, MZ - 23, MZ + 23); k.block(MX - 23, MX + 23, MZ + 22, MZ + 23);
    k.sign('THE WHITNEY  ·  GANSEVOORT', 8, 0.7, MX, 11, MZ + 23.1, 'transparent', '#1a1c20', 70, 0);
    // the big gallery inside the ground block: sawtooth skylights, the works on white walls
    const GW = 44, GD = 44, GH = 11;
    k.box(GW, 0.3, GD, MX, 0.15, MZ, floorG);
    for (const s of [-1, 1]) k.box(0.6, GH, GD, MX + s * GW / 2, GH / 2, MZ, white);
    k.box(GW, GH, 0.6, MX, GH / 2, MZ - GD / 2, white);
    k.box(GW, GH, 0.6, MX, GH / 2, MZ + GD / 2, white);
    k.block(MX - GW / 2, MX + 3, MZ + GD / 2 - 0.6, MZ + GD / 2 + 0.6); k.block(MX + 7, MX + GW / 2, MZ + GD / 2 - 0.6, MZ + GD / 2 + 0.6);
    for (let x = MX - GW / 2; x < MX + GW / 2; x += 6) { const saw = k.box(6, 0.3, GD, x + 3, GH + 1.5, MZ, white); saw.rotation.z = 0.35; k.box(0.1, 3.6, GD, x + 6, GH + 1.8, MZ, glass); }
    for (let x = MX - 16; x <= MX + 16; x += 8) for (let z = MZ - 14; z <= MZ + 14; z += 14) k.point(x, GH - 1, z, 0xfff4ec, 22, 14);
    for (let i = 0; i < 3; i++) { k.box(0.6, 6, 10, MX - 12 + i * 12, 3, MZ - 6 + (i % 2) * 8, white); k.block(MX - 12.4 + i * 12, MX - 11.6 + i * 12, MZ - 11 + (i % 2) * 8, MZ - 1 + (i % 2) * 8); }
    k.censusWall({ x: MX, y: 4.6, z: MZ - GD / 2 + 0.34, rotY: 0, cols: 40, rows: 6, tile: 0.55, gap: 0.05, start: ctx.wallStart(5900, 240), pieces: ctx.all, backing: dark });
    k.crowd([v(MX - 18, 0, MZ + 18), v(MX - 6, 0, MZ - 10), v(MX + 8, 0, MZ + 6), v(MX + 18, 0, MZ - 14)], 18, { seed: 88, speed: 0.4, spread: 2, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a] });
    k.crowd([v(15, HY + 0.6, 140), v(15, HY + 0.6, 42)], 16, { seed: 89, speed: 0.8, spread: 2.4, animate: !ctx.reduced });
    // the works: the gallery's free standing walls and long walls, the terraces' glass screens facing the river
    const mounts: Mount[] = [];
    for (let i = 0; i < 3; i++) { const x = MX - 12 + i * 12, z = MZ - 6 + (i % 2) * 8; for (const s of [-1, 1]) mounts.push({ position: v(x + s * 0.34, 3.2, z), rotation: s < 0 ? -PI / 2 : PI / 2, target: v(x + s * 6, 3, z), width: 4.6, height: 2.7, style: 'white', wash: true }); }
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = MZ - 14 + i * 14; mounts.push({ position: v(MX + s * (GW / 2 - 0.34), 3.4, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(MX + s * (GW / 2 - 8), 3, z), width: 5.2, height: 3.0, style: 'white', wash: true }); }
    for (let i = 0; i < 3; i++) { const x = MX - 14 + i * 14; if (i === 1) continue; mounts.push({ position: v(x, 3.4, MZ + GD / 2 - 0.34), rotation: PI, target: v(x, 3, MZ + 8), width: 5.2, height: 3.0, style: 'white', wash: true }); }
    terraces.forEach(([x0, y, w0, d], i) => { for (let j = 0; j < 2; j++) { const z = MZ - d / 4 + j * (d / 2); const px = x0 + w0 / 2 - 0.8; k.box(0.12, 2.4, 3.4, px, y + 1.6, z, white); mounts.push({ position: v(px - 0.1, y + 1.7, z), rotation: PI / 2, target: v(x0 - 4, y + 2, z), width: 3.0, height: 1.8, style: 'white', wash: false }); } void i; });
    const tY = (x: number, z: number) => { for (const [x0, y, w0, d] of terraces) if (Math.abs(x - x0) < w0 / 2 && Math.abs(z - MZ) < d / 2) return y + 0.3; return -1; };
    return { mounts, spawn: v(16, 3, 40), look: v(MX, 16, MZ), eye: 3, bounds: [MX - GW / 2 + 1, 24, MZ - GD / 2 + 1, 140], style: 'white', floorY: (x, z) => { if (x > 12 && x < 18 && z > 40) return HY + 0.6; if (x > MX + 23.5 && x < MX + 26.5 && z > MZ - 1 && z < MZ + 24) return Math.min(12, ((MZ + 23 - z) / 24) * 12); const t = tY(x, z); if (t >= 0) return t; return 0; } };
  },
};
