/* Rooms 22 to 26: the Chrysler lobby and crown, the Flatiron prow, the Bleachers, the Deli Counter, Washington Square.
   Every interior comes with its street and its skin: walk in from outside. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Kit, Mount } from '../kit';
import type { RoomDef, RoomCtx } from './types';
import { billboard } from './a';

const PI = Math.PI;

/* ---------- shared street furniture for the exterior rooms ---------- */
export function street(k: Kit, p: { w: number; len: number; z: number; x?: number; walk?: number; night?: boolean; curbs?: boolean }) {
  const { w, len, z, x = 0, walk = 5, curbs = true } = p;
  const asphalt = k.pbr('asphaltS', X.asphalt(0x24282d), 0.11, { roughness: 0.62, metalness: 0.12 }),
    pav = k.pbr('sidewalkS', X.pavers(0x8e8b84, 5), 0.42),
    granite = k.pbr('curbS', X.ashlar(0x8a8a86, 4, 2), 0.35),
    white = k.flat(0xdedbd2, 0, 0.7),
    yellow = k.flat(0xe6a626, 0, 0.6);
  k.box(w, 0.3, len, x, -0.15, z, asphalt);
  for (const s of [-1, 1]) {
    k.box(walk, 0.28, len, x + s * (w / 2 + walk / 2), 0.0, z, pav);
    if (curbs) k.box(0.3, 0.32, len, x + s * (w / 2 + 0.1), 0.02, z, granite);
  }
  for (const dx of [-0.14, 0.14]) k.box(0.09, 0.012, len - 6, x + dx, 0.01, z, yellow);
  for (let cz = z + len / 2 - 6; cz > z - len / 2; cz -= 28) for (let cx = -w / 2 + 1.2; cx <= w / 2 - 1; cx += 1.2) k.box(0.62, 0.014, 2.8, x + cx, 0.012, cz, white);
}

/* A city block of brick and glass neighbours, with lit windows, along one side of a street. */
export function blockFront(k: Kit, p: { x: number; z0: number; count: number; depth?: number; face: 1 | -1; seed?: number; h?: [number, number] }) {
  const { x, z0, count, depth = 9, face, seed = 1, h = [14, 26] } = p;
  const rnd = X.mulberry(seed);
  const bricks = [k.pbr('nbBrickA', X.brick(0x6b4437, 21), 0.28), k.pbr('nbBrickB', X.brick(0x4f3b36, 22), 0.28), k.pbr('nbStone', X.ashlar(0xb9ad97, 23, 3), 0.22), k.pbr('nbGlass', X.windows(24, 0.25, 0x51697a, false), 0.12, { emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.4, metalness: 0.5, stretch: 0.42 })];
  const cornice = k.pbr('nbCornice', X.plaster(0xb8ad9a, 3), 0.6),
    glassDark = k.glass(0x9fc4d8, 0.35, 0.08),
    warm = k.glow(0xffd28a),
    iron = k.flat(0x1f262b, 0.75, 0.45);
  for (let b = 0; b < count; b++) {
    const z = z0 - b * 8,
      hh = h[0] + Math.floor(rnd() * (h[1] - h[0])),
      m = bricks[Math.floor(rnd() * bricks.length)];
    k.box(depth, hh, 7.9, x - face * depth / 2, hh / 2, z, m);
    if (m !== bricks[3]) {
      k.moulding([[0, 0], [0.7, 0], [0.8, 0.2], [0.5, 0.35], [0.6, 0.55], [0.25, 0.75], [0, 0.85]], 8.1, x - face * 0.05, hh - 0.5, z, cornice, face > 0 ? 0 : PI);
      for (let y = 3.2; y < hh - 1.5; y += 2.7) for (const dz of [-2.6, 0, 2.6]) {
        k.box(0.2, 1.9, 1.35, x - face * 0.06, y, z + dz, cornice);
        k.box(0.05, 1.65, 1.1, x + face * 0.06, y, z + dz, rnd() > 0.72 ? warm : glassDark);
        k.box(0.05, 1.7, 0.05, x + face * 0.1, y, z + dz, iron);
      }
      if (rnd() > 0.5) k.prop('fire_escape', x + face * 1.05, 6.6 + rnd() * 3, z, { height: 3.2, rotY: face > 0 ? -PI / 2 : PI / 2 });
      if (rnd() > 0.6) k.prop('water_tower', x - face * (depth / 2), hh, z + 1.5, { height: 5 });
    }
  }
}

/* ---------------- 22 THE CHRYSLER BUILDING ---------------- */
export const chrysler: RoomDef = {
  id: 'chrysler',
  name: 'The crown and the lobby',
  area: 'THE CHRYSLER BUILDING',
  mood: 'Deco at dusk',
  color: '#d9c48a',
  description: 'Lexington Avenue under the steel crown, then the red marble lobby with its painted ceiling and inlaid elevator doors.',
  signatures: 'The terraced steel crown with triangular windows and its needle, eagle gargoyles at the setbacks, the red Moroccan marble lobby with a ceiling mural and lotus elevator doors.',
  build(k, ctx) {
    k.sky({ top: 0x2a3d6e, horizon: 0xe8a877, ground: 0x2a2a30, fog: 0.0026, sun: { az: 4.6, el: 0.09, color: 0xffb070, size: 20 }, haze: 0.35, stars: 120, env: 0.8 });
    k.hemi(0xffdcc0, 0x2a2c34, 0.7);
    k.sun(0xffc08a, 2.0, -60, 26, -30, true, 90);
    const marbleRed = k.pbr('rougeMarble', X.marble(0x8a3a3a, 0xd9b090, 7), 0.3, { roughness: 0.25 }),
      onyx = k.pbr('onyx', X.marble(0x3a2a22, 0xc9a25a, 8), 0.4, { roughness: 0.2 }),
      brass = k.pbr('brassC', X.gilt(0xc9a55a), 2, { metalness: 0.85, roughness: 0.28 }),
      steelCrown = k.pbr('crownSteel', X.steel(0xc7ccd2, false, 25), 0.35, { metalness: 0.95, roughness: 0.22 }),
      facade = k.pbr('chryslerBrick', X.windows(26, 0.4, 0x6b655c, true), 0.12, { emissive: 0xffffff, emissiveIntensity: 1.0, roughness: 0.6, stretch: 0.42 }),
      wood = k.pbr('lotusWood', X.planks(0x5a3a26, 6, 27), 1.4, { roughness: 0.5 }),
      floorM = k.pbr('lobbyFloor', X.terrazzo(0xc9b8a2, 9), 0.35, { roughness: 0.3 }),
      dark = k.flat(0x1a1a1c, 0.5, 0.6),
      glow = k.glow(0xfff0c8),
      glass = k.glass(0xcfe0e8, 0.18, 0.06);
    // Lexington Avenue and the neighbours
    street(k, { w: 20, len: 120, z: -20 });
    blockFront(k, { x: -15, z0: 30, count: 9, face: 1, seed: 41, h: [16, 30] });
    blockFront(k, { x: 15, z0: 30, count: 3, face: -1, seed: 42, h: [14, 22] });
    for (const z of [26, 6, -46]) for (const s of [-1, 1]) k.lamp(s * 11.6, z, 6.2, dark, 0xffd9a8, 30);
    k.prop('hydrant', 12, 0, 16, { height: 1.1, keepOut: 0.5 });
    k.prop('mailbox', -12, 0, -8, { height: 1.5, rotY: PI / 2, keepOut: 0.6 });
    // the tower: a setback base on the east side of the avenue, the crown far above
    const TX = 32, TZ = -18;
    k.box(34, 62, 34, TX, 31, TZ, facade);
    for (let i = 0; i < 4; i++) k.box(30 - i * 3, 14, 30 - i * 3, TX, 62 + 7 + i * 14, TZ, facade);
    for (let i = 0; i < 4; i++) k.box(31 - i * 3, 0.8, 31 - i * 3, TX, 62 + i * 14, TZ, steelCrown);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const eagle = k.mesh(new T.ConeGeometry(1.4, 4, 5), steelCrown, TX + sx * 15, 62.5, TZ + sz * 15);
      eagle.rotation.set(PI / 2 * -sz * 0, 0, sx * 1.4);
      eagle.rotation.x = -PI / 2;
      eagle.rotation.z = sx * 0.5;
    }
    const cy = 118;
    for (let i = 0; i < 7; i++) {
      const r = 14 - i * 1.7, y = cy + i * 6.2;
      const shell = k.mesh(new T.SphereGeometry(r, 32, 12, 0, PI * 2, 0, PI / 2), steelCrown, TX, y, TZ);
      shell.scale.y = 0.55;
      for (let j = 0; j < 24; j++) {
        const t = (j / 24) * PI * 2, tri = k.mesh(new T.ConeGeometry(0.6, 2.4 - i * 0.2, 3), glow, TX + Math.cos(t) * (r - 0.6), y + 1.6, TZ + Math.sin(t) * (r - 0.6));
        tri.rotation.y = -t;
      }
    }
    k.point(TX, cy + 30, TZ, 0xfff0c8, 400, 120);
    k.beam(v(TX, cy + 42, TZ), v(TX, cy + 66, TZ), 0.5, steelCrown, 8);
    k.cyl(0.08, 4, TX, cy + 68, TZ, glow, 0.02, 6);
    // the lobby: a wedge of red marble on the ground floor, doors onto the avenue
    const LX = 15.3, LZ = -18;
    k.box(0.6, 12, 40, LX, 6, LZ, marbleRed);
    k.block(LX - 0.4, LX + 17, LZ - 20.5, LZ - 19.6);
    k.block(LX - 0.4, LX + 17, LZ + 19.6, LZ + 20.5);
    k.block(LX + 16.6, LX + 17.4, LZ - 20, LZ + 20);
    for (const z of [LZ - 20, LZ + 20]) k.box(17, 12, 0.6, LX + 8.5, 6, z, marbleRed);
    k.box(0.6, 12, 40, LX + 17, 6, LZ, marbleRed);
    // the entrance: two revolving door bays cut in the avenue wall
    for (const dz of [-6, 6]) {
      k.box(0.8, 5, 4.2, LX, 2.5, LZ + dz, glass);
      k.box(0.1, 5.2, 0.3, LX, 2.6, LZ + dz - 2.2, brass);
      k.box(0.1, 5.2, 0.3, LX, 2.6, LZ + dz + 2.2, brass);
      k.box(0.1, 0.3, 4.6, LX, 5.2, LZ + dz, brass);
    }
    k.block(LX - 0.4, LX + 0.4, LZ - 20, LZ - 8.2);
    k.block(LX - 0.4, LX + 0.4, LZ - 3.8, LZ + 3.8);
    k.block(LX - 0.4, LX + 0.4, LZ + 8.2, LZ + 20);
    k.box(18, 0.4, 41, LX + 8.5, -0.2, LZ, floorM);
    k.box(18, 0.5, 41, LX + 8.5, 12, LZ, onyx);
    for (const dz of [-14, 0, 14]) { k.box(17, 0.3, 0.6, LX + 8.5, 11.8, LZ + dz, brass); k.box(3.6, 0.06, 0.3, LX + 8.5, 11.6, LZ + dz, glow); k.point(LX + 8.5, 10.5, LZ + dz, 0xffe0b0, 40, 18); }
    // lotus elevator doors on the back wall, the mural framed overhead
    for (let i = 0; i < 4; i++) {
      const z = LZ - 12 + i * 8;
      k.rounded(2.6, 4.6, 0.12, LX + 16.6, 2.4, z, wood, 0.05);
      k.box(0.08, 4.6, 0.06, LX + 16.55, 2.4, z, brass);
      k.box(0.08, 0.2, 2.8, LX + 16.55, 4.6, z, brass);
      k.box(0.06, 0.12, 0.6, LX + 16.5, 5.2, z, glow);
    }
    k.sign('LEXINGTON AVENUE  ·  1930', 6, 0.5, LX + 16.6, 7.4, LZ, '#4a1e1e', '#e8cfa0', 80, -PI / 2, { border: true });
    k.censusWall({ x: LX + 16.62, y: 9.3, z: LZ, rotY: -PI / 2, cols: 30, rows: 3, tile: 0.55, gap: 0.05, start: ctx.wallStart(6600, 90), pieces: ctx.all, backing: onyx });
    // the works: deco black frames on the marble, the mural on the ceiling, display cases outside
    const mounts: Mount[] = [];
    for (let i = 0; i < 6; i++) {
      const z = LZ - 15 + i * 6;
      mounts.push({ position: v(LX + 0.32, 3.4, z), rotation: PI / 2, target: v(LX + 5, 3, z), width: 4.6, height: 2.7, style: 'black' });
    }
    for (const z of [LZ - 19.68, LZ + 19.68]) for (const x of [LX + 4.5, LX + 12.5]) mounts.push({ position: v(x, 3.4, z), rotation: z < LZ ? 0 : PI, target: v(x, 3, z < LZ ? z + 5 : z - 5), width: 4.6, height: 2.7, style: 'black' });
    for (let i = 0; i < 3; i++) mounts.push({ position: v(LX + 16.66, 3.4, LZ - 16 + i * 16), rotation: -PI / 2, target: v(LX + 11, 3, LZ - 16 + i * 16), width: 4.6, height: 2.7, style: 'black' });
    mounts.push({ position: v(LX + 8.5, 11.75, LZ), rotation: 0, tilt: PI / 2, target: v(LX + 8.5, 3, LZ + 6), lookAt: v(LX + 8.5, 11.8, LZ), width: 15, height: 8.4, style: 'gilt', wash: false });
    for (let i = 0; i < 4; i++) {
      const z = 20 - i * 10;
      k.box(3, 4.4, 0.6, -11.9, 2.2, z, dark);
      mounts.push({ position: v(-11.55, 2.7, z), rotation: PI / 2, target: v(-7, 3, z), width: 2.6, height: 3.2, style: 'neon', wash: false });
    }
    for (let i = 0; i < 4; i++) {
      const z = LZ + 26 + i * 8;
      k.box(0.6, 4.4, 4.2, 14.9, 2.2, z, marbleRed);
      mounts.push({ position: v(14.55, 2.7, z), rotation: -PI / 2, target: v(9, 3, z), width: 3.6, height: 2.6, style: 'black' });
    }
    return { mounts, spawn: v(-6, 3, 26), look: v(TX, 60, TZ), eye: 3, bounds: [-12.2, LX + 16.6, -60, 32], style: 'black' };
  },
};

/* ---------------- 23 THE FLATIRON ---------------- */
export const flatiron: RoomDef = {
  id: 'flatiron',
  name: 'The prow',
  area: 'THE FLATIRON',
  mood: 'Noon on the wedge',
  color: '#c9b79a',
  description: 'The triangular building at the split of two avenues, a plaza of chairs at its point, a wedge shaped gallery inside the prow.',
  signatures: 'The triangular plan with its rounded point, limestone and terracotta tiers of bay windows, the pedestrian plaza with green chairs, the cast iron street clock, the park across the way.',
  build(k, ctx) {
    k.sky({ top: 0x6f9fd4, horizon: 0xe4ebee, ground: 0x6d6a62, fog: 0.0024, sun: { az: 3.2, el: 1.1, color: 0xfff6e8, size: 12 }, env: 0.95 });
    k.hemi(0xf1f6ff, 0x4a4a42, 0.9);
    k.sun(0xfff4e6, 2.6, 20, 70, -10, true, 90);
    const lime = k.pbr('flatLime', X.ashlar(0xc8bda6, 12, 3), 0.2),
      terra = k.pbr('flatTerra', X.windows(28, 0.15, 0xb59f82, true), 0.11, { emissive: 0xffffff, emissiveIntensity: 0.45, roughness: 0.65, stretch: 0.42 }),
      plaza = k.pbr('plazaFlat', X.pavers(0x9a968c, 13), 0.3),
      green = k.flat(0x3f6b3a, 0, 0.7),
      iron = k.flat(0x1f242a, 0.7, 0.45),
      oak = k.pbr('prowFloor', X.planks(0x8a6a48, 8, 28), 0.6, { roughness: 0.55 }),
      plaster = k.pbr('prowPlaster', X.plaster(0xe8e2d4, 16), 0.4),
      glass = k.glass(0xd7ecf3, 0.14, 0.06),
      lawn = k.pbr('lawnF', X.grass(0x4c7a3a, 7), 0.15),
      opal = k.glow(0xfff1d6);
    // two avenues meeting: the wedge of the building points south at the visitor
    street(k, { w: 16, len: 140, z: -30, x: -22 });
    const s2 = k.mesh(new T.BoxGeometry(16, 0.3, 140), k.pbr('asphaltS', X.asphalt(0x24282d), 0.11), 22, -0.15, -30);
    s2.rotation.y = 0.2;
    k.box(70, 0.28, 30, 0, 0.0, 12, plaza);
    // the building: a triangular prism twenty floors high, rounded at the prow
    const H = 62, L = 60;
    const tri = new T.Shape();
    tri.moveTo(0, 0);
    tri.lineTo(-13, L);
    tri.lineTo(13, L);
    tri.closePath();
    const body = k.mesh(new T.ExtrudeGeometry(tri, { depth: H, bevelEnabled: false }), terra, 0, 0, -6);
    body.rotation.x = -PI / 2;
    k.cyl(2.2, H, 0, H / 2, -6.2, terra, 2.2, 24);
    /* The building footprint used to be blocked as one solid rectangle, which
       also sealed the wedge gallery inside it: seventeen of this room's twenty
       three works sat behind a wall the visitor could not pass, so they could
       never be stood in front of. Block the limestone either side of the two
       converging walls instead, in slabs, since blocks are axis aligned and the
       gallery is a triangle. halfAt is the inside face of the wall at a given z. */
    for (const y of [0, 12, 24, 36, 48]) {
      const band = k.mesh(new T.ExtrudeGeometry(tri, { depth: 0.6, bevelEnabled: false }), lime, 0, y + 11.4, -6);
      band.rotation.x = -PI / 2;
      band.scale.set(1.02, 1.02, 1);
    }
    const top = k.mesh(new T.ExtrudeGeometry(tri, { depth: 2.2, bevelEnabled: false }), lime, 0, H, -6);
    top.rotation.x = -PI / 2;
    top.scale.set(1.06, 1.06, 1);
    // the plaza: chairs, planters, the street clock, the park across Fifth
    const rnd = X.mulberry(23);
    for (let i = 0; i < 26; i++) {
      const x = (rnd() - 0.5) * 30, z = 4 + rnd() * 18;
      const seat = k.box(0.5, 0.05, 0.5, x, 0.55, z, green);
      k.box(0.5, 0.6, 0.05, x, 0.85, z - 0.25, green);
      for (const dx of [-0.2, 0.2]) for (const dz of [-0.2, 0.2]) k.box(0.04, 0.55, 0.04, x + dx, 0.27, z + dz, iron);
      seat.rotation.y = rnd() * PI;
      k.keepOut.push({ x, z, r: 0.5 });
    }
    for (const x of [-16, 16]) { k.box(3, 0.8, 8, x, 0.4, 14, lime); k.tree(x, 0.8, 14, { kind: 'round', h: 3.2, r: 1.8, leaf: 0x4f7f3c, seed: x }); }
    k.lathe([[0.5, 0], [0.5, 0.3], [0.2, 0.5], [0.16, 5.2], [0.4, 5.5], [0.4, 5.8]], -8, 0, 22, iron, 16);
    for (const s of [-1, 1]) { const face = k.mesh(new T.CircleGeometry(0.9, 36), opal, -8, 7, 22 + s * 0.16); face.rotation.y = s > 0 ? 0 : PI; }
    k.torus(0.9, 0.08, -8, 7, 22, iron, 36);
    k.keepOut.push({ x: -8, z: 22, r: 0.8 });
    k.box(120, 0.4, 60, 0, -0.2, 60, lawn);
    for (let i = 0; i < 24; i++) k.tree((rnd() - 0.5) * 100, -0.1, 36 + rnd() * 40, { kind: 'round', h: 5 + rnd() * 3, r: 3 + rnd() * 2, leaf: 0x3f6b36, seed: 100 + i });
    blockFront(k, { x: -36, z0: 20, count: 10, face: 1, seed: 43, h: [16, 30] });
    blockFront(k, { x: 36, z0: 20, count: 10, face: -1, seed: 44, h: [16, 30] });
    k.skyline({ z: -160, count: 30, spacing: 7, scale: 2.2, base: -2, seed: 45, lit: 0.15, glow: 0.3, tint: 0x7a7e86 });
    // inside the prow: a wedge gallery with the point glazed
    const halfAt = (z: number) => Math.max(0.6, -0.775 - 0.2132 * z);
    for (let z = -64; z < -12; z += 4) {
      const h = halfAt(z + 4);   // the narrow end of the slab, so the corridor is never wider than the room
      k.block(h, 14, z, z + 4);
      k.block(-14, -h, z, z + 4);
    }
    /* The point is where you come in, so it is a vestibule rather than a pinch:
       the limestone either side stops at 2.6 and the doorway between them is the
       full width of the nose. */
    k.block(2.6, 14, -12, -5.6);
    k.block(-14, -2.6, -12, -5.6);

    const wedge = new T.Shape();
    wedge.moveTo(0, 2.6);
    wedge.lineTo(-11.6, L - 1);
    wedge.lineTo(11.6, L - 1);
    wedge.closePath();
    const room = k.mesh(new T.ExtrudeGeometry(wedge, { depth: 0.4, bevelEnabled: false }), oak, 0, 0.0, -6);
    room.rotation.x = -PI / 2;
    const ceil = k.mesh(new T.ExtrudeGeometry(wedge, { depth: 0.4, bevelEnabled: false }), plaster, 0, 11.2, -6);
    ceil.rotation.x = -PI / 2;
    k.box(0.4, 11, 6, 0, 5.5, -9, glass);
    k.box(0.5, 11, L - 8, -6.9, 5.5, -36, plaster).rotation.y = 0.21;
    k.box(0.5, 11, L - 8, 6.9, 5.5, -36, plaster).rotation.y = -0.21;
    k.box(24, 11, 0.6, 0, 5.5, -65, plaster);
    for (const z of [-20, -34, -48]) { k.point(0, 9.5, z, 0xfff3e0, 34, 18); }
    /* The way in. There was no door here and nothing on the plaza to say the
       building holds fourteen works, so the prow read as scenery and the whole
       gallery went unvisited. A lit threshold, a canopy, a sign and a pair of
       ropes leading to it. */
    for (const sx of [-1, 1]) {
      k.box(0.5, 4.2, 0.5, sx * 2.35, 2.1, -6.2, lime);          // jambs
      k.prop('rope_stanchion', sx * 2.9, 0, -1.6, { height: 1.0, keepOut: 0.4 });
      k.prop('rope_stanchion', sx * 2.9, 0, 2.2, { height: 1.0, keepOut: 0.4 });
    }
    k.box(5.6, 0.7, 0.6, 0, 4.5, -6.2, lime);                    // lintel
    k.box(4.4, 4.0, 0.12, 0, 2.0, -6.3, k.glass(0x1b2228, 0.5, 0.08));  // the doors themselves
    for (const sx of [-1, 1]) k.box(0.1, 3.6, 0.06, sx * 0.16, 1.9, -6.22, iron);  // door stiles, so it reads as a way in
    k.box(6.4, 0.22, 3.2, 0, 4.7, -4.7, lime);                   // canopy over the door
    for (const sx of [-1, 1]) k.beam(v(sx * 2.9, 4.6, -3.2), v(sx * 2.6, 6.0, -6.0), 0.05, iron, 4);
    k.box(4.6, 0.06, 2.6, 0, 0.04, -4.4, k.flat(0x2a2a2c, 0.2, 0.9));   // threshold mat
    k.point(0, 3.4, -5.4, 0xffe6c0, 26, 12);                     // light spilling out of the point
    k.point(0, 4.2, -1.0, 0xfff0d8, 14, 9);
    /* The lettering goes on the canopy fascia, where someone walking up to the
       building actually looks. Above the canopy it was hidden by the canopy. */
    k.box(6.4, 0.86, 0.12, 0, 4.32, -3.16, lime);
    k.sign('THE PROW GALLERY', 5.4, 0.42, 0, 4.46, -3.08, 'transparent', '#f0e6d2', 62, 0);
    k.sign('FOURTEEN NEW YORKERS INSIDE  ·  FREE  ·  WALK IN', 5.8, 0.24, 0, 4.08, -3.08, 'transparent', '#c9b79a', 44, 0);
    /* And a board out on the plaza, turned at the visitor as they arrive. */
    const board = k.box(2.2, 2.6, 0.14, -4.6, 1.3, 6.0, lime); board.rotation.y = 0.5;
    k.sign('ART INSIDE', 1.8, 0.4, -4.53, 1.95, 6.06, 'transparent', '#1c1c1e', 56, 0.5);
    k.sign('THE PROW GALLERY', 1.9, 0.22, -4.53, 1.5, 6.06, 'transparent', '#4a4a4c', 44, 0.5);
    k.sign('FOURTEEN WORKS', 1.9, 0.2, -4.53, 1.16, 6.06, 'transparent', '#4a4a4c', 40, 0.5);
    // the works: the two long converging walls, the wide end, plaza screens outside
    const mounts: Mount[] = [];
    /* The two long walls are boxes at x = +/- 6.9, centred z = -36 and turned
       0.21 radians, so their inside face at a depth z is this. The old code
       guessed the half width from a fraction of L and put every one of the
       fourteen wedge works between two and three units outside the wall it was
       supposed to hang on, buried in the terracotta. */
    for (let i = 0; i < 7; i++) {
      const z = -10 - i * 7.4;
      const half = halfAt(z);
      for (const s of [-1, 1]) mounts.push({ position: v(s * (half - 0.3), 3.4, z), rotation: s < 0 ? PI / 2 + 0.21 : -PI / 2 - 0.21, target: v(s * Math.max(0.35, half * 0.4), 3, z), width: Math.min(4.4, half * 1.6), height: 2.6, style: 'white' });
    }
    for (const x of [-7, 0, 7]) mounts.push({ position: v(x, 3.4, -64.68), rotation: 0, target: v(x, 3, -58), width: 4.6, height: 2.7, style: 'white' });
    for (let i = 0; i < 6; i++) {
      const x = -15 + i * 6, z = 28;
      k.box(4.6, 4.2, 0.4, x, 2.1, z, lime);
      mounts.push({ position: v(x, 2.6, z - 0.22), rotation: PI, target: v(x, 3, z - 5), width: 4.2, height: 2.5, style: 'steel', wash: false });
    }
    return { mounts, spawn: v(0, 3, 22), look: v(0, 4.2, -6), eye: 3, bounds: [-30, 30, -64, 30], style: 'white' };
  },
};

/* ---------------- 24 THE BLEACHERS ---------------- */
export const bleachers: RoomDef = {
  id: 'bleachers',
  name: 'Bottom of the ninth',
  area: 'THE BRONX BALLPARK',
  mood: 'Night game',
  color: '#9fb4d6',
  description: 'A ballpark bowl under the lights, the census hung along the outfield wall, the scoreboard running the lineup.',
  signatures: 'The white steel frieze around the upper deck, the limestone gate arches, the diamond and warning track, the outfield wall, the light towers, the bleachers.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x070a16, horizon: 0x1a2340, ground: 0x0a0d14, fog: 0.004, stars: 700, env: 0.45 });
    k.hemi(0xcfd8ff, 0x1c2a1a, 0.55);
    k.sun(0xffffff, 1.6, 40, 80, 40, true, 120);
    const grass = k.pbr('outfield', X.grass(0x2f6b34, 9), 0.2, { roughness: 0.95 }),
      grass2 = k.pbr('outfield2', X.grass(0x2a5f2f, 10), 0.2, { roughness: 0.95 }),
      dirt = k.pbr('infield', X.concrete(0x8a5a3c, 11), 0.3, { roughness: 1 }),
      lime = k.pbr('gateLime', X.ashlar(0xcfc6b0, 14, 3), 0.2),
      steelW = k.flat(0xe6e8e4, 0.6, 0.4),
      seat = k.flat(0x1a3f7a, 0.1, 0.7),
      seat2 = k.flat(0x2a5aa0, 0.1, 0.7),
      concrete = k.pbr('bowlConc', X.concrete(0x8c8c86, 12), 0.3),
      wall = k.pbr('outfieldWall', X.plaster(0x1f3f7a, 17), 0.5, { roughness: 0.8 }),
      dark = k.flat(0x14161a, 0.5, 0.6),
      glow = k.glow(0xfff6e0);
    // the field: home plate at the origin, the outfield wall an arc to the north
    k.box(220, 0.4, 220, 0, -0.2, -60, grass2);
    for (let i = 0; i < 14; i++) k.box(160, 0.02, 4, 0, 0.01, -14 - i * 8, i % 2 ? grass : grass2);
    const dia = k.mesh(new T.CylinderGeometry(19, 19, 0.06, 4), dirt, 0, 0.03, -19);
    dia.rotation.y = PI / 4;
    k.mesh(new T.RingGeometry(7, 9.5, 48, 1, 0, PI), dirt, 0, 0.04, -19).rotation.x = -PI / 2;
    k.mesh(new T.CircleGeometry(2.6, 24), dirt, 0, 0.05, -19).rotation.x = -PI / 2;
    for (const [x, z] of [[13.4, -19], [0, -32.4], [-13.4, -19]]) k.box(0.9, 0.12, 0.9, x, 0.1, z, steelW);
    k.box(1.2, 0.04, 1.2, 0, 0.07, -5.6, steelW);
    for (const s of [-1, 1]) k.box(0.12, 0.02, 110, 0, 0.06, -60, steelW).rotation.y = s * PI / 4;
    const R = 92;
    for (let i = 0; i <= 40; i++) {
      const t = PI * 0.25 + (i / 40) * PI * 0.5;
      const x = Math.cos(t) * R, z = -5 - Math.sin(t) * R;
      k.box(0.6, 3.2, 7.6, x, 1.6, z, wall).rotation.y = -t + PI / 2;
      k.box(0.8, 0.2, 7.8, x, 3.3, z, k.flat(0xf1c531, 0, 0.6)).rotation.y = -t + PI / 2;
      if (i % 5 === 0) k.box(0.6, 3.2, 7.6, x, 1.6, z, dark).rotation.y = -t + PI / 2;
    }
    k.mesh(new T.RingGeometry(R - 4, R + 0.5, 64, 1, PI * 0.25, PI * 0.5), dirt, 0, 0.03, -5).rotation.x = -PI / 2;
    // the bowl: tiers of seats climbing behind the outfield wall and along the lines
    const seats: T.Matrix4[] = [], seats2: T.Matrix4[] = [];
    for (let tier = 0; tier < 3; tier++) {
      const r0 = R + 6 + tier * 14, rows = 12;
      for (let row = 0; row < rows; row++) {
        const rr = r0 + row * 0.9, y = 3 + tier * 9 + row * 0.62;
        k.mesh(new T.RingGeometry(rr - 0.45, rr + 0.45, 96, 1, PI * 0.2, PI * 0.6), concrete, 0, y, -5).rotation.x = -PI / 2;
        for (let j = 0; j < 130; j++) {
          const t = PI * 0.2 + (j / 130) * PI * 0.6;
          const m = new T.Matrix4().compose(v(Math.cos(t) * rr, y + 0.45, -5 - Math.sin(t) * rr), new T.Quaternion().setFromEuler(new T.Euler(0, -t + PI / 2, 0)), v(1, 1, 1));
          (j % 7 === 0 ? seats2 : seats).push(m);
        }
      }
      k.mesh(new T.RingGeometry(r0 + 11.5, r0 + 13, 96, 1, PI * 0.2, PI * 0.6), steelW, 0, 3 + tier * 9 + 8.2, -5).rotation.x = -PI / 2;
    }
    k.instances(new T.BoxGeometry(0.6, 0.7, 0.55), seat, seats);
    k.instances(new T.BoxGeometry(0.6, 0.7, 0.55), seat2, seats2);
    // the frieze: white steel arches along the top of the upper deck
    const fr = R + 6 + 2 * 14 + 12;
    for (let j = 0; j < 30; j++) {
      const t0 = PI * 0.2 + (j / 30) * PI * 0.6, t1 = PI * 0.2 + ((j + 1) / 30) * PI * 0.6;
      const a = v(Math.cos(t0) * fr, 30, -5 - Math.sin(t0) * fr), b = v(Math.cos(t1) * fr, 30, -5 - Math.sin(t1) * fr);
      const mid = a.clone().lerp(b, 0.5).add(v(0, 3.6, 0));
      k.curve([a, mid, b], 0.22, steelW, 12);
      k.beam(a, a.clone().add(v(0, 4.4, 0)), 0.16, steelW, 6);
    }
    k.mesh(new T.RingGeometry(fr - 0.4, fr + 0.4, 96, 1, PI * 0.2, PI * 0.6), steelW, 0, 34.4, -5).rotation.x = -PI / 2;
    // light towers
    for (const t of [PI * 0.28, PI * 0.5, PI * 0.72]) {
      const x = Math.cos(t) * (fr + 4), z = -5 - Math.sin(t) * (fr + 4);
      k.box(1.2, 44, 1.2, x, 22, z, dark);
      k.box(9, 3.4, 0.6, x, 44, z, dark).rotation.y = -t + PI / 2;
      for (let i = -4; i <= 4; i++) for (const dy of [-1, 0, 1]) k.sphere(0.3, x + Math.sin(t) * i * 0.95, 44 + dy * 1.0, z + Math.cos(t) * i * 0.95, glow, 6);
      k.spot(x, 45, z, 0, 0, -30, 0xffffff, 2600, 0.55, 0.5, 220);
    }
    // the scoreboard over centre field: the lineup is the census
    const sz = -5 - R - 30;
    k.box(44, 18, 2, 0, 24, sz, dark);
    k.box(0.8, 24, 0.8, -18, 12, sz, dark);
    k.box(0.8, 24, 0.8, 18, 12, sz, dark);
    k.censusWall({ x: 0, y: 19.5, z: sz + 1.05, rotY: 0, cols: 34, rows: 5, tile: 1.1, gap: 0.08, start: ctx.wallStart(300, 170), pieces: ctx.all, backing: dark });
    k.sign('TONIGHT  ·  THE CENSUS  vs  THE CITY', 30, 2, 0, 31.5, sz + 1.05, '#0d1526', '#f4e9c4', 120, 0);
    const bill = billboard(k, ctx, 0, 40, 7, 0, 27.2, sz + 1.05, 0, dark);
    void bill;
    // the gate arches behind home plate, the dugouts, the bleachers' beer stand
    for (let i = 0; i < 7; i++) k.arch(4.6, 9, 2.4, -18 + i * 6, 0, 22, lime, false, 0.62);
    k.box(44, 1.4, 2.6, 0, 10.7, 22, lime);
    k.sign('THE BRONX  ·  GATE 4', 8, 0.9, 0, 12.2, 20.6, '#2a3a5a', '#f4e9c4', 100, PI, { border: true });
    for (const s of [-1, 1]) { k.box(10, 2.6, 4, s * 16, 1.3, 6, concrete); k.box(10, 0.3, 4.4, s * 16, 2.8, 6, dark); k.keepOut.push({ x: s * 16, z: 6, r: 6 }); }
    k.prop('captains_hat', 0, 0.9, 12, { height: 0.6 });
    k.plinth(0, 12, 1.4, 0.8, 1.4, lime);
    k.prop('bell', -6, 1.5, 14, { height: 0.9 });
    k.box(0.25, 1.5, 0.25, -6, 0.75, 14, dark);
    if (!ctx.reduced) {
      const boards = ctx.pieces.slice(60);
      let last = 0;
      k.ticks.push((t) => { if (t - last > 7 && bill) { last = t; const p = boards[Math.floor(t / 7) % boards.length]; import('../kit').then(({ loadThumb }) => loadThumb(ctx.thumb(p)).then((tex) => { if (!k.live) return; (bill.material as T.MeshBasicMaterial).map = tex; (bill.material as T.MeshBasicMaterial).needsUpdate = true; bill.userData.piece = p; })); } });
    }
    // the works: along the outfield wall, on the dugout roofs, at the gate
    const mounts: Mount[] = [];
    for (let i = 0; i < 16; i++) {
      const t = PI * 0.27 + (i / 15) * PI * 0.46;
      const x = Math.cos(t) * (R - 0.35), z = -5 - Math.sin(t) * (R - 0.35);
      mounts.push({ position: v(x, 2.0, z), rotation: -t - PI / 2, target: v(Math.cos(t) * (R - 7), 3, -5 - Math.sin(t) * (R - 7)), width: 5.8, height: 2.6, style: 'steel', wash: false });
    }
    for (const s of [-1, 1]) for (const dx of [-2.6, 2.6]) mounts.push({ position: v(s * 16 + dx, 4.4, 4.2), rotation: 0, target: v(s * 16 + dx, 3, -2), width: 4.4, height: 2.5, style: 'steel', wash: false });
    for (const x of [-12, 12]) mounts.push({ position: v(x, 4.2, 20.7), rotation: PI, target: v(x, 3, 15), width: 4.4, height: 2.5, style: 'black' });
    return { mounts, spawn: v(0, 3, 4), look: v(0, 8, -80), eye: 3, bounds: [-70, 70, -95, 18], style: 'steel' };
  },
};

/* ---------------- 25 THE DELI COUNTER ---------------- */
export const deli: RoomDef = {
  id: 'deli',
  name: 'Take a number',
  area: 'THE APPETIZING COUNTER',
  mood: 'Sunday morning',
  color: '#e9c46a',
  description: 'A Lower East Side corner store: neon over the awning, a tin ceiling, glass cases lit from inside, the census in every case and up on the photo wall.',
  signatures: 'The long glass and marble counter, hanging salamis on a rail, a pressed tin ceiling, the numbered ticket dispenser, the corner neon and awning, the photo wall.',
  build(k, ctx) {
    k.sky({ top: 0x7fa6d3, horizon: 0xe6e9e6, ground: 0x5f5a52, fog: 0.003, sun: { az: 1.0, el: 0.5, color: 0xfff1d8, size: 14 }, env: 0.9 });
    k.hemi(0xfff3e0, 0x4a4238, 0.85);
    k.sun(0xfff0d4, 2.0, 30, 40, 30, true, 60);
    const tin = k.pbr('tinCeiling', X.ashlar(0xe6e2d8, 15, 6), 1.6, { metalness: 0.5, roughness: 0.4 }),
      tile = k.pbr('deliTile', X.subwayTile(0xefece2, 0x2a2c2a), 1.1, { roughness: 0.25 }),
      floorT = k.pbr('deliFloor', X.pavers(0x8a8478, 16), 1.4, { roughness: 0.6 }),
      marble = k.pbr('counterMarble', X.marble(0xe8e4dc, 0x9a948a, 9), 0.6, { roughness: 0.25 }),
      wood = k.pbr('deliWood', X.planks(0x6a4a30, 5, 29), 1.2, { roughness: 0.55 }),
      steel = k.flat(0xc8ccd0, 0.85, 0.3),
      brick = k.pbr('deliBrick', X.brick(0x6b4a3d, 30), 0.28),
      awning = k.pbr('awning', X.velvet(0x8a2a2a), 0.5, { roughness: 0.9 }),
      glass = k.glass(0xdcecf2, 0.16, 0.05),
      salami = k.flat(0x7a2a24, 0.1, 0.6),
      neon = k.glow(0xff5a4a),
      neonB = k.glow(0x7ad0ff),
      warm = k.glow(0xffe7c0);
    // the corner: Houston meets Orchard, the store on the corner lot
    street(k, { w: 18, len: 110, z: -20 });
    const s2 = k.mesh(new T.BoxGeometry(110, 0.3, 14), k.pbr('asphaltS', X.asphalt(0x24282d), 0.11), 0, -0.15, 22);
    void s2;
    blockFront(k, { x: -14, z0: -2, count: 6, face: 1, seed: 51, h: [14, 20] });
    blockFront(k, { x: 14, z0: -2, count: 6, face: -1, seed: 52, h: [14, 20] });
    k.prop('hydrant', -10.8, 0, 8, { height: 1.1, keepOut: 0.5 });
    k.prop('mailbox', 10.8, 0, 2, { height: 1.5, rotY: -PI / 2, keepOut: 0.6 });
    for (const z of [10, -30]) for (const s of [-1, 1]) k.lamp(s * 10.5, z, 6, k.flat(0x1f262b, 0.75, 0.45), 0xffd9a8, 28);
    k.prop('tree', -10.6, 0, 16, { height: 5.5, keepOut: 0.6 });
    // the store: the corner building with the shop on the ground floor
    const SX = 14, SZ = 12, W = 22, D = 26;
    k.box(W, 14, D, SX + W / 2 - 0.5, 7 + 5.6, SZ - D / 2, brick);
    k.moulding([[0, 0], [0.7, 0], [0.8, 0.2], [0.5, 0.35], [0.6, 0.55], [0.25, 0.75], [0, 0.85]], D, SX - 0.05, 5.5, SZ - D / 2, k.pbr('nbCornice', X.plaster(0xb8ad9a, 3), 0.6), 0);
    for (let y = 8.6; y < 18; y += 2.7) for (let dz = -22; dz <= -3; dz += 3.2) { k.box(0.2, 1.9, 1.35, SX - 0.06, y, SZ + dz, k.flat(0xd6d1c3, 0, 0.8)); k.box(0.05, 1.65, 1.1, SX + 0.06, y, SZ + dz, y < 12 ? warm : glass); }
    k.prop('fire_escape', SX - 1.05, 7, SZ - 10, { height: 3.2, rotY: PI / 2 });
    k.prop('fire_escape', SX - 1.05, 9.8, SZ - 10, { height: 3.2, rotY: PI / 2 });
    // storefront: awning, big windows, the corner door, the neon
    const aw = k.box(0.1, 0.1, 0.1, 0, 0, 0, awning);
    aw.visible = false;
    const awn = k.mesh(new T.BoxGeometry(2.6, 0.12, D - 2), awning, SX - 1.3, 4.6, SZ - D / 2);
    awn.rotation.z = 0.35;
    for (let dz = -24; dz <= -2; dz += 2) k.box(0.05, 0.5, 0.06, SX - 2.5, 4.05, SZ + dz, awning);
    k.box(0.12, 3.2, D - 5, SX, 2.4, SZ - D / 2 - 1.5, glass);
    k.box(0.4, 0.9, D, SX, 0.45, SZ - D / 2, wood);
    k.block(SX - 0.3, SX + 0.3, SZ - D, SZ - 3.2);
    k.box(0.3, 3.4, 1.8, SX, 1.7, SZ - 1.6, wood);
    k.box(0.1, 2.6, 1.2, SX, 1.8, SZ - 1.6, glass);
    k.box(W, 3.4, 0.3, SX + W / 2, 1.7, SZ, brick);
    k.block(SX, SX + W, SZ - 0.3, SZ + 0.3);
    k.block(SX + W - 0.3, SX + W + 0.3, SZ - D, SZ);
    k.block(SX, SX + W, SZ - D - 0.3, SZ - D + 0.3);
    k.box(W, 0.3, D, SX + W / 2, 5.6, SZ - D / 2, tin);
    k.box(W, 0.3, D, SX + W / 2, -0.1, SZ - D / 2, floorT);
    k.box(0.3, 5.6, D, SX + W - 0.15, 2.8, SZ - D / 2, tile);
    k.box(W, 5.6, 0.3, SX + W / 2, 2.8, SZ - D + 0.15, tile);
    const sign = (txt: string, w: number, y: number, m: T.Material) => { for (let i = 0; i < txt.length; i++) { const cw = w / txt.length; k.box(0.06, 0.9, cw * 0.7, SX - 0.4, y, SZ - D / 2 + (i - txt.length / 2) * cw + cw / 2, m); } };
    sign('APPETIZING', 12, 7.2, neon);
    k.sign('APPETIZING  ·  SMOKED FISH  ·  SINCE 1914', 12, 1.0, SX - 0.45, 7.2, SZ - D / 2, 'transparent', '#ff5a4a', 110, PI / 2);
    k.box(0.06, 0.25, 8, SX - 0.4, 6.3, SZ - D / 2, neonB);
    k.point(SX - 1.5, 6.5, SZ - D / 2, 0xff6a5a, 40, 14);
    // inside: the long counter, cases lit from within, salamis on a rail, the ticket machine, fans
    const CX = SX + 6.5;
    k.box(1.2, 1.1, D - 6, CX, 0.55, SZ - D / 2, wood);
    k.box(1.4, 0.12, D - 5.6, CX, 1.16, SZ - D / 2, marble);
    k.box(1.2, 1.1, D - 6, CX, 1.75, SZ - D / 2, glass);
    k.box(1.3, 0.06, D - 5.8, CX, 2.32, SZ - D / 2, steel);
    k.block(CX - 0.8, CX + 0.8, SZ - D + 3, SZ - 3);
    for (let i = 0; i < 10; i++) { const z = SZ - D + 4 + i * 2; k.point(CX, 1.7, z, 0xfff0d0, 3, 2.2); }
    for (let i = 0; i < 14; i++) { const z = SZ - D + 2.5 + i * 1.5; k.cyl(0.14, 1.3 + (i % 3) * 0.2, CX + 1.6, 4.4, z, salami, 0.12, 8); k.beam(v(CX + 1.6, 5.1, z), v(CX + 1.6, 5.5, z), 0.02, steel, 4); }
    k.box(0.06, 0.06, D - 4, CX + 1.6, 5.5, SZ - D / 2, steel);
    for (const z of [SZ - 7, SZ - 19]) { const fan = new T.Group(); fan.position.set(CX + 5, 5.2, z); for (let b = 0; b < 4; b++) { const bl = new T.Mesh(new T.BoxGeometry(1.4, 0.04, 0.3), k.flat(0x3a2a20, 0.2, 0.7)); bl.position.x = 0.8; const pivot = new T.Group(); pivot.rotation.y = (b * PI) / 2; pivot.add(bl); fan.add(pivot); } k.add(fan); if (!ctx.reduced) k.ticks.push((t) => { fan.rotation.y = t * 3; }); }
    k.box(0.4, 0.5, 0.3, SX + 2, 1.4, SZ - 2.5, k.flat(0xb02a2a, 0.3, 0.5));
    k.box(0.1, 0.1, 0.1, SX + 2, 1.65, SZ - 2.5, steel);
    const served = k.sign('NOW SERVING  7541', 3.2, 0.7, SX + W / 2, 4.6, SZ - D + 0.32, '#111', '#ff5a4a', 120, 0);
    if (!ctx.reduced) { let n = 7541, last = 0; k.ticks.push((t) => { if (t - last > 5) { last = t; n++; (served.material as T.MeshBasicMaterial).map = X.signText('NOW SERVING  ' + n, 1024, 224, '#111', '#ff5a4a', 120); (served.material as T.MeshBasicMaterial).needsUpdate = true; } }); }
    k.box(6, 0.8, 0.4, SX + 13, 0.4, SZ - D + 0.4, wood);
    for (let i = 0; i < 3; i++) { k.cyl(0.05, 0.75, SX + 3.5 + i * 3, 0.38, SZ - D / 2 + 9, steel, 0.05, 8); k.cyl(0.32, 0.06, SX + 3.5 + i * 3, 0.78, SZ - D / 2 + 9, k.flat(0xb02a2a, 0.3, 0.5), 0.32, 16); k.keepOut.push({ x: SX + 3.5 + i * 3, z: SZ - D / 2 + 9, r: 0.45 }); }
    // the photo wall: the regulars, floor to ceiling
    k.censusWall({ x: SX + W - 0.32, y: 3.2, z: SZ - D / 2, rotY: -PI / 2, cols: 32, rows: 6, tile: 0.6, gap: 0.05, start: ctx.wallStart(2000, 192), pieces: ctx.all, backing: wood });
    // the works: above the counter on the tile, inside the cases, in the window
    const mounts: Mount[] = [];
    for (let i = 0; i < 10; i++) { const z = SZ - D + 4 + i * 2; mounts.push({ position: v(CX, 1.72, z), rotation: -PI / 2, target: v(CX - 3, 3, z), width: 1.7, height: 0.95, style: 'none', wash: false, lookAt: v(CX, 1.7, z) }); }
    for (let i = 0; i < 6; i++) { const z = SZ - D + 4 + i * 3.6; mounts.push({ position: v(SX + W - 0.34, 3.6, z), rotation: -PI / 2, target: v(SX + W - 5, 3, z), width: 3.2, height: 1.9, style: 'oak' }); }
    for (const x of [SX + 4, SX + 10, SX + 16]) mounts.push({ position: v(x, 3.5, SZ - D + 0.34), rotation: 0, target: v(x, 3, SZ - D + 5), width: 4.4, height: 2.6, style: 'oak' });
    for (const z of [SZ - 18, SZ - 12, SZ - 6]) mounts.push({ position: v(SX - 0.34, 2.6, z), rotation: PI / 2, target: v(SX - 5, 3, z), width: 3.6, height: 2.1, style: 'black', wash: false });
    return { mounts, spawn: v(1, 3, -3), look: v(SX, 3.2, SZ - 11), eye: 3, bounds: [-10.4, SX + W - 0.6, SZ - D + 0.6, 18], style: 'oak' };
  },
};

/* ---------------- 26 WASHINGTON SQUARE ---------------- */
export const washington: RoomDef = {
  id: 'washington',
  name: 'Under the arch',
  area: 'WASHINGTON SQUARE',
  mood: 'Saturday afternoon',
  color: '#b9c8a4',
  description: 'The marble arch, the fountain plaza, chess tables under the trees, the works set on steel easels around the water.',
  signatures: 'The white marble arch with its relief panels and the avenue framed through it, the round fountain basin with a jet, the chess tables in the southwest corner, the red brick row houses on the north side.',
  build(k, ctx) {
    k.sky({ top: 0x6f9dd2, horizon: 0xe7ebe7, ground: 0x556546, fog: 0.0026, sun: { az: 1.2, el: 0.75, color: 0xfff3dc, size: 14 }, env: 0.95 });
    k.hemi(0xf0f6ff, 0x40503a, 0.95);
    k.sun(0xfff2d8, 2.5, 30, 60, 20, true, 90);
    const marble = k.pbr('archMarble', X.marble(0xece8e0, 0xb8b2a6, 10), 0.25, { roughness: 0.35 }),
      hex = k.pbr('hexPavers', X.pavers(0x9a968c, 18), 0.35),
      lawn = k.pbr('lawnW', X.grass(0x4a7a3a, 12), 0.15),
      granite = k.pbr('basinGranite', X.ashlar(0x8c8c88, 19, 3), 0.3),
      water = k.flat(0x3a6a78, 0.6, 0.15, { transparent: true, opacity: 0.9 }),
      iron = k.flat(0x1f242a, 0.7, 0.45),
      brickRow = k.pbr('rowBrick', X.brick(0x8a3f34, 31), 0.28),
      stoneRow = k.pbr('rowStone', X.ashlar(0xb9ad97, 20, 3), 0.22),
      steel = k.flat(0x8c98a4, 0.9, 0.3),
      glow = k.glow(0xdff4ff);
    // the square: lawn, hex paving, paths radiating from the fountain
    k.box(160, 0.4, 160, 0, -0.2, -30, lawn);
    k.mesh(new T.CylinderGeometry(24, 24, 0.3, 64), hex, 0, 0.0, -30);
    for (const a of [0, PI / 4, PI / 2, (3 * PI) / 4]) { const p = k.box(5, 0.28, 130, 0, 0.0, -30, hex); p.rotation.y = a; }
    // the fountain
    k.mesh(new T.CylinderGeometry(11, 11.5, 0.9, 64), granite, 0, 0.45, -30);
    k.mesh(new T.CylinderGeometry(10.2, 10.2, 0.9, 64), water, 0, 0.5, -30);
    for (let i = 0; i < 4; i++) k.mesh(new T.CylinderGeometry(11 + i * 0.9, 11.5 + i * 0.9, 0.22, 64), granite, 0, 0.11 - i * 0.02, -30);
    const jets: T.Mesh[] = [];
    for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; const j = k.mesh(new T.CylinderGeometry(0.06, 0.16, 5, 6), glow, Math.cos(a) * 1.5, 3.4, -30 + Math.sin(a) * 1.5, true); jets.push(j); }
    const jet0 = k.mesh(new T.CylinderGeometry(0.1, 0.3, 8, 8), glow, 0, 4.9, -30, true);
    if (!ctx.reduced) k.ticks.push((t) => { jets.forEach((j, i) => { j.scale.y = 0.7 + 0.3 * Math.sin(t * 2 + i); j.position.y = 0.9 + 2.5 * j.scale.y; }); jet0.scale.y = 0.8 + 0.2 * Math.sin(t * 1.3); jet0.position.y = 0.9 + 4 * jet0.scale.y; });
    k.keepOut.push({ x: 0, z: -30, r: 12 });
    // the arch to the north, the avenue framed through it
    const AZ = 22;
    k.arch(9, 14, 5, 0, 0, AZ, marble, false, 0.7);
    for (const s of [-1, 1]) {
      k.box(5.8, 12, 5.2, s * 8.6, 6, AZ, marble);
      k.rounded(3.2, 4.2, 0.2, s * 8.6, 8.6, AZ + 2.7, k.flat(0xd9d4ca, 0, 0.7), 0.04);
      k.column(s * 6.2, 12.4, AZ + 2.4, 3.6, 0.22, marble, true);
      k.column(s * 11, 12.4, AZ + 2.4, 3.6, 0.22, marble, true);
    }
    k.box(23, 2.4, 6, 0, 17.2, AZ, marble);
    k.moulding([[0, 0], [0.9, 0], [1.0, 0.3], [0.6, 0.5], [0.7, 0.8], [0.3, 1.0], [0, 1.1]], 23.4, 0, 18.4, AZ + 3.0, marble, 0);
    k.sign('MDCCLXXXIX', 8, 0.9, 0, 17.2, AZ + 3.05, 'transparent', '#5a544a', 110, 0);
    k.block(-11.5, -3.9, AZ - 2.7, AZ + 2.7);
    k.block(3.9, 11.5, AZ - 2.7, AZ + 2.7);
    k.point(0, 10, AZ, 0xfff4e0, 30, 22);
    street(k, { w: 14, len: 120, z: AZ + 70 });
    k.skyline({ z: 160, count: 26, spacing: 7, scale: 2.4, base: -2, seed: 61, lit: 0.12, glow: 0.3, tint: 0x7e8290, rows: 1 });
    // the Row on the north side, the university red brick south and east
    for (let i = 0; i < 10; i++) { const x = -45 + i * 10; if (Math.abs(x) < 16) continue; k.box(9.6, 16, 12, x, 8, AZ + 12, brickRow); k.box(9.8, 0.6, 12.4, x, 16, AZ + 12, stoneRow); for (let y = 3; y < 14; y += 3.2) for (const dx of [-3, 0, 3]) k.box(1.3, 2, 0.1, x + dx, y, AZ + 5.95, y < 6 ? k.glow(0xffe0b0) : k.glass(0x8fb0c0, 0.4, 0.1)); k.prop('stoop', x, 0, AZ + 5.2, { height: 2, rotY: PI }); }
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const z = -70 + i * 14; k.box(12, 22, 12, s * 62, 11, z, brickRow); }
    // trees, benches, chess tables, the players' corner, lamps
    const rnd = X.mulberry(26);
    for (let i = 0; i < 60; i++) { const a = rnd() * PI * 2, r = 38 + rnd() * 30, x = Math.cos(a) * r, z = -30 + Math.sin(a) * r; if (z > AZ - 8 && Math.abs(x) < 16) continue; if (Math.abs(x) < 4 || Math.abs(z + 30) < 4) continue; k.tree(x, 0, z, { kind: rnd() > 0.5 ? 'round' : 'column', h: 5 + rnd() * 4, r: 2.6 + rnd() * 2, leaf: 0x3f6b36, seed: i }); }
    for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; k.bench(Math.cos(a) * 20, -30 + Math.sin(a) * 20, -a + PI / 2, k.pbr('benchW', X.planks(0x5d4939, 3, 32), 1.2), iron, 2.4); }
    for (let i = 0; i < 8; i++) { const x = -36 + (i % 4) * 4, z = -58 + Math.floor(i / 4) * 4; k.cyl(0.32, 0.9, x, 0.45, z, granite, 0.32, 12); k.box(1.2, 0.08, 1.2, x, 0.94, z, k.pbr('chess', X.subwayTile(0xe8e4d8, 0x2a2a2a), 3.2, { roughness: 0.4 })); for (const s of [-1, 1]) k.box(0.5, 0.06, 0.5, x + s * 0.9, 0.5, z, granite); k.keepOut.push({ x, z, r: 0.9 }); }
    for (const a of [0.4, 1.2, 2.0, 2.8, 3.6, 4.4, 5.2, 6.0]) k.lamp(Math.cos(a) * 26, -30 + Math.sin(a) * 26, 5.5, iron, 0xffe0b0, 24);
    k.prop('lamppost', 14, 0, AZ - 8, { height: 6 });
    k.prop('lamppost', -14, 0, AZ - 8, { height: 6 });
    k.prop('tree', 24, 0, -10, { height: 6, keepOut: 0.6 });
    // the census on a long low wall by the players' corner
    k.censusWall({ x: -30, y: 2.0, z: -66, rotY: 0, cols: 28, rows: 3, tile: 0.6, gap: 0.05, start: ctx.wallStart(4000, 84), pieces: ctx.all, backing: granite });
    k.box(19, 0.6, 0.5, -30, 0.3, -66, granite);
    // the works: steel easels around the fountain ring, the arch piers, plinths on the axes
    const mounts: Mount[] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * PI * 2 + PI / 24, r = 15.5, x = Math.cos(a) * r, z = -30 + Math.sin(a) * r;
      k.box(0.3, 4.2, 5.6, 0, 0, 0, steel).position.set(x, 2.2, z);
      k.objects[k.objects.length - 1].rotation.y = -a - PI / 2;
      k.box(1.0, 0.25, 6, 0, 0, 0, granite).position.set(x, 0.12, z);
      k.objects[k.objects.length - 1].rotation.y = -a - PI / 2;
      mounts.push({ position: v(x + Math.cos(a) * 0.2, 2.6, z + Math.sin(a) * 0.2), rotation: -a + PI / 2, target: v(Math.cos(a) * (r + 4.5), 3, -30 + Math.sin(a) * (r + 4.5)), width: 4.8, height: 2.8, style: 'steel', wash: false });
    }
    for (const s of [-1, 1]) { mounts.push({ position: v(s * 8.6, 3.2, AZ - 2.65), rotation: PI, target: v(s * 8.6, 3, AZ - 8), width: 4.6, height: 2.7, style: 'white', wash: false }); mounts.push({ position: v(s * 5.65, 3.2, AZ), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 1.2, 3, AZ), width: 3.6, height: 2.2, style: 'white', wash: false }); }
    for (const a of [PI / 4, (3 * PI) / 4, (5 * PI) / 4, (7 * PI) / 4]) { const x = Math.cos(a) * 34, z = -30 + Math.sin(a) * 34; k.box(0.4, 4, 5, 0, 0, 0, granite).position.set(x, 2, z); k.objects[k.objects.length - 1].rotation.y = -a - PI / 2; mounts.push({ position: v(x - Math.cos(a) * 0.25, 2.6, z - Math.sin(a) * 0.25), rotation: -a - PI / 2, target: v(Math.cos(a) * 29, 3, -30 + Math.sin(a) * 29), width: 4.4, height: 2.6, style: 'steel', wash: false }); }
    return { mounts, spawn: v(0, 3, -8), look: v(0, 9, AZ), eye: 3, bounds: [-58, 58, -95, AZ + 60], style: 'steel' };
  },
};
