/* Upgrade batch two (2026-09-23): the next two rooms in the audit, rebuilt.

   As with up1.ts nothing is overwritten: `littleisland` still lives in i.ts and
   `highline` in c.ts, and rooms/index.ts simply imports these instead. Ids are
   unchanged.

   Little Island had all twenty of its works rescued at runtime and seventeen of
   them facing away: the glass panels along the paths were rotated `ang + PI/2`,
   which puts the picture's back to the path. The High Line had all twenty two
   targets outside the room's own bounds: corridorMounts put the viewing spot at
   x = 6.45 on a deck that ends at 5.6, so nobody could ever stand where the
   works were meant to be seen from. */
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
/* A path that follows the ground instead of being stacked out of boxes: a quad
   strip sampled along a line, each pair of vertices set on the terrain. */
function terrainStrip(k: K, x0: number, z0: number, x1: number, z1: number, halfW: number, steps: number, y: (x: number, z: number) => number, m: T.Material) {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  let dx = x1 - x0, dz = z1 - z0; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
  const nx = -dz * halfW, nz = dx * halfW;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, px = x0 + (x1 - x0) * t, pz = z0 + (z1 - z0) * t;
    pos.push(px + nx, y(px + nx, pz + nz) + 0.07, pz + nz, px - nx, y(px - nx, pz - nz) + 0.07, pz - nz);
    uv.push(t * L * 0.4, 0, t * L * 0.4, 1);
  }
  for (let i = 0; i < steps; i++) { const o = i * 2; idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3); }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return k.mesh(g, m);
}
/* A quad grid from a parametric function: an elliptical lawn with a real edge,
   instead of a square plane diving into the water and hiding what holds it up. */
function grid(k: K, rows: number, cols: number, f: (r: number, c: number) => T.Vector3, m: T.Material) {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [], W = cols + 1;
  for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) { const p = f(r, c); pos.push(p.x, p.y, p.z); uv.push(p.x * 0.12, p.z * 0.12); }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const o = r * W + c; idx.push(o, o + 1, o + W, o + 1, o + W + 1, o + W); }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return k.mesh(g, m);
}
/* Twenty four triangles a head, for a crowd seen from across a lawn. */
function boxFigureGeo() {
  const body = new T.BoxGeometry(0.34, 0.62, 0.26); body.translate(0, 0.31, 0);
  const head = new T.BoxGeometry(0.21, 0.21, 0.21); head.translate(0, 0.73, 0);
  return mergeGeometries([body, head])!;
}

/* ---------------- 38 THE TULIPS (rebuild) ---------------- */
export const littleisland2: RoomDef = {
  id: 'littleisland',
  name: 'The tulips',
  area: 'LITTLE ISLAND',
  mood: 'Golden hour on the river',
  color: '#a8c4a0',
  description: 'Two and a half acres of park held over the Hudson on a hundred and thirty two concrete tulips, none of them the same height, so the ground rolls. Paths climb to an overlook, the Amph faces the water with its back to the city, and the works stand in glass beside the paths where the light comes off the river at the end of the day.',
  signatures: 'The field of pot shaped concrete piles rising between fifteen and sixty two feet out of the Hudson, the rolling planted topography on top of them, the Amph facing the river, the two bridges from the esplanade at Thirteenth Street, the overlook at the high point, and Manhattan behind it all.',
  build(k, ctx) {
    k.sky({ top: 0x5d85c0, horizon: 0xecc199, ground: 0x4a5040, fog: 0.0014, sun: { az: 4.75, el: 0.2, color: 0xffc38a, size: 18 }, haze: 0.25, env: 0.95 });
    k.hemi(0xffe4c8, 0x6a6458, 0.85);
    k.sun(0xffd2a4, 2.5, -80, 34, 0, true, 110);
    const conc = k.pbr('liConc', X.concrete(0xbdbab1, 24), 0.22, { roughness: 0.82 }),
      lawn = k.pbr('liLawn', X.grass(0x4a7a38, 25), 0.16),
      gravel = k.pbr('liPath', X.pavers(0xa6a094, 26), 0.75),
      timber = k.pbr('liTimber', X.planks(0x8a6a48, 4, 66), 0.9),
      deck = k.pbr('liDeck', X.planks(0x6f5336, 6, 67), 1.1),
      glass = k.glass(0xdcecf6, 0.12, 0.04),
      steel = k.flat(0x9aa4ae, 0.85, 0.3),
      iron = k.flat(0x1f242a, 0.7, 0.45);
    /* the ground: a heightfield clipped to an ellipse, the same one the piles carry */
    const field = (x: number, z: number) => 4 + 5 * Math.exp(-((x + 18) ** 2 + (z + 22) ** 2) / 500) + 7 * Math.exp(-((x - 20) ** 2 + (z + 40) ** 2) / 700) + 2.5 * Math.sin(x * 0.12) * Math.cos(z * 0.1) - 4 * Math.exp(-((x - 6) ** 2 + (z + 46) ** 2) / 260);
    const inside = (x: number, z: number) => (x / 46) ** 2 + ((z + 35) / 38) ** 2;
    /* the river, the esplanade, the city behind */
    k.water({ y: -0.6, color: 0x2e4e62, w: 520, d: 420, z: -70, amp: 1.1 });
    k.box(170, 1.0, 22, 0, 0.4, 25, k.pbr('liEsp', X.pavers(0x8e8b84, 27), 0.4));
    k.rail(0, 14.2, 170, iron, 1.1, 'x', 1.8);
    street(k, { w: 20, len: 170, z: 46, x: 0 });
    blockFront(k, { x: 32, z0: 104, count: 8, face: -1, seed: 71, h: [18, 34] });
    blockFront(k, { x: -32, z0: 104, count: 8, face: 1, seed: 72, h: [18, 34] });
    k.skyline({ z: 210, count: 32, spacing: 9, scale: 2.8, base: -2, seed: 104, lit: 0.24, glow: 0.5, tint: 0x6e7684 });
    /* the tulips: a hundred and thirty two pots, none of them the same height */
    {
      const pots: T.Matrix4[] = [], rnd = X.mulberry(132);
      for (let x = -42; x <= 42 && pots.length < 132; x += 6.2) for (let z = -68; z <= -2 && pots.length < 132; z += 6.2) {
        if (inside(x, z) > 1.02) continue;
        const h = field(x, z) - 0.9;
        pots.push(new T.Matrix4().compose(v(x, h, z), new T.Quaternion(), v(1, (h + 3) / 2, 1)));
      }
      /* the rim of the park is the rim of a ring of pots, which is what you see from the water */
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * PI * 2, x = Math.cos(a) * 43, z = -35 + Math.sin(a) * 35.4, h = field(x, z) - 0.55;
        pots.push(new T.Matrix4().compose(v(x, h, z), new T.Quaternion(), v(1, (h + 3) / 2, 1)));
      }
      void rnd;
      const tulip = new T.LatheGeometry([new T.Vector2(1.5, -2), new T.Vector2(1.05, -1.1), new T.Vector2(0.95, -0.55), new T.Vector2(1.7, -0.18), new T.Vector2(3.4, 0)], 12);
      k.instances(tulip, conc, pots);
    }
    {
      /* the lawn is exactly the ellipse the tulips carry, with a concrete edge beam
         under it, so from the water you see what is holding the park up */
      const RG = 34, SG = 96, RX = 45.6, RZ = 37.6;
      const rim = (c: number) => { const a = (c / SG) * PI * 2; return v(Math.cos(a) * RX, 0, -35 + Math.sin(a) * RZ); };
      grid(k, RG, SG, (r, c) => { const u = r / RG, p = rim(c); const x = p.x * u, z = -35 + (p.z + 35) * u; return v(x, field(x, z), z); }, lawn);
      grid(k, 1, SG, (r, c) => { const p = rim(c); return v(p.x, r ? field(p.x, p.z) - 1.1 : field(p.x, p.z), p.z); }, conc);
    }
    /* the Amph: timber tiers facing the water, a stage, and somebody on it */
    const AX = 6, AZ = -46, AY = field(AX, AZ);
    for (let i = 0; i < 10; i++) { const r = 6 + i * 2; const ring = k.mesh(new T.RingGeometry(r, r + 1.7, 40, 1, PI * 1.08, PI * 0.84), timber, AX, AY - 3.4 + i * 0.7, AZ); ring.rotation.x = -PI / 2; }
    k.mesh(new T.CylinderGeometry(6, 6, 0.4, 32), deck, AX, AY - 3.5, AZ);
    k.box(15, 6.4, 0.6, AX, AY - 0.4, AZ - 6.6, conc);
    k.keepOut.push({ x: AX, z: AZ, r: 3.6 });
    figure(k, AX - 1.2, AY - 3.3, AZ - 1.0, 0xe8e2d4, { rotY: PI });
    figure(k, AX + 1.4, AY - 3.3, AZ - 1.6, 0x2a3f6a, { rotY: PI });
    /* the paths, the overlook, the planting, the bulbs */
    const legs: [number, number, number, number][] = [[-14, 0, -20, -20], [-20, -20, 18, -38], [18, -38, 6, -52], [12, 0, 24, -18]];
    for (const [x0, z0, x1, z1] of legs) terrainStrip(k, x0, z0, x1, z1, 1.6, 26, (x, z) => (inside(x, z) < 1 ? field(x, z) : 0.9), gravel);
    const OX = 18, OZ = -38, OY = field(OX, OZ);
    k.mesh(new T.CylinderGeometry(6, 6.4, 0.3, 24), gravel, OX, OY + 0.12, OZ);
    for (let i = 0; i < 26; i++) { const a = (i / 26) * PI * 2; k.box(0.06, 1.1, 0.06, OX + Math.cos(a) * 5.8, OY + 0.72, OZ + Math.sin(a) * 5.8, steel); }
    k.torus(5.8, 0.04, OX, OY + 1.28, OZ, steel, 48).rotation.x = PI / 2;
    k.keepOut.push({ x: OX, z: OZ, r: 1.2 });
    {
      const rnd = X.mulberry(38);
      for (let i = 0; i < 40; i++) {
        const x = (rnd() - 0.5) * 84, z = -8 - rnd() * 58;
        if (inside(x, z) > 0.86) continue;
        if (Math.hypot(x - AX, z - AZ) < 15 || Math.hypot(x - OX, z - OZ) < 9) continue;
        k.tree(x, field(x, z) - 0.2, z, { kind: rnd() > 0.35 ? 'round' : 'column', h: 3 + rnd() * 3.4, r: 1.5 + rnd() * 1.7, leaf: [0x4a7a3c, 0x5f8a45, 0x3a6a34][i % 3], seed: i });
      }
      /* sixty six thousand bulbs, stood in for by twelve hundred */
      const NB = 1200, bulbs = k.instances(new T.SphereGeometry(0.075, 5, 4), new T.MeshStandardMaterial({ roughness: 0.8 }), Array.from({ length: NB }, () => new T.Matrix4()));
      const c = new T.Color(), pal = [0xe8503a, 0xf0c22a, 0xe86aa8, 0xf4f0e4, 0x8a4ad8, 0xff8c3b];
      const m = new T.Matrix4(), p = new T.Vector3(), q = new T.Quaternion();
      let n = 0, guard = 0;
      while (n < NB && guard++ < NB * 6) {
        const x = (rnd() - 0.5) * 84, z = -6 - rnd() * 60;
        if (inside(x, z) > 0.9) continue;
        p.set(x, field(x, z) + 0.22, z); m.compose(p, q, ONE);
        bulbs.setMatrixAt(n, m); bulbs.setColorAt(n, c.set(pal[Math.floor(rnd() * pal.length)])); n++;
      }
      bulbs.instanceMatrix.needsUpdate = true;
      if (bulbs.instanceColor) bulbs.instanceColor.needsUpdate = true;
    }
    /* the two bridges from the esplanade, and the water between */
    const BR: [number, number][] = [[-14, 3.4], [12, 3.4]];
    for (const [bx, bw] of BR) {
      const zEnd = -35 + 38 * Math.sqrt(Math.max(0, 1 - (bx / 46) ** 2)), y1 = field(bx, zEnd);
      const ramp = (_x: number, z: number) => 0.9 + (y1 - 0.9) * Math.min(1, Math.max(0, (13 - z) / (13 - zEnd)));
      terrainStrip(k, bx, 13.6, bx, zEnd - 1, bw / 2, 22, ramp, deck);
      for (let i = 0; i <= 10; i++) { const t = i / 10, z = 13 - (13 - zEnd) * t; for (const sg of [-1, 1]) k.box(0.1, 1.0, 0.1, bx + sg * (bw / 2 - 0.12), ramp(bx, z) + 0.55, z, steel); }
      for (const sg of [-1, 1]) { const a = v(bx + sg * (bw / 2 - 0.12), 1.55, 13), b = v(bx + sg * (bw / 2 - 0.12), y1 + 0.65, zEnd); k.beam(a, b, 0.05, steel, 5); }
    }
    /* the water is not walkable, and neither is the drop off the edge */
    k.block(-46, -17, 1, 13); k.block(-11, 9, 1, 13); k.block(15, 46, 1, 13);
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * PI * 2, x = Math.cos(a) * 45.5, z = -35 + Math.sin(a) * 37.5;
      if (z > 0 && Math.abs(x) < 20) continue;
      k.block(x - 2.6, x + 2.6, z - 2.6, z + 2.6);
    }
    /* people on the paths and the esplanade, a boat on the river */
    if (!ctx.reduced) {
      for (const [x0, z0, x1, z1] of legs.slice(0, 3)) k.crowd([v(x0, field(x0, z0), z0), v((x0 + x1) / 2, field((x0 + x1) / 2, (z0 + z1) / 2), (z0 + z1) / 2), v(x1, field(x1, z1), z1)], 7, { seed: Math.round(x0 + z1), speed: 0.3, spread: 1.1, colors: [0xe83a5a, 0x3a8ae8, 0xf0d24a, 0x2a2a34, 0xe8e2d4, 0x8a4ad8, 0xff8c3b] });
      k.crowd([v(-70, 0.9, 20), v(70, 0.9, 20)], 16, { seed: 51, speed: 0.5, spread: 2.4 });
      /* the Amph has an audience, on the tiers, facing the water */
      const NA = 150, aud = k.instances(boxFigureGeo(), new T.MeshStandardMaterial({ roughness: 0.9 }), Array.from({ length: NA }, () => new T.Matrix4()));
      aud.frustumCulled = false;
      const rnd = X.mulberry(687), c = new T.Color(), pal = [0x1c232c, 0xe8e2d4, 0x2a3f6a, 0x8a2a2a, 0xd8c04a, 0x3a5a3a, 0x6a4a8a, 0xd07a3a];
      const m = new T.Matrix4(), p = new T.Vector3(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0);
      for (let i = 0; i < NA; i++) {
        const tier = Math.floor(rnd() * 10), r = 6.9 + tier * 2, a = PI * 1.1 + rnd() * PI * 0.8;
        p.set(AX + Math.cos(a) * r, AY - 3.35 + tier * 0.7, AZ + Math.sin(a) * r);
        q.setFromAxisAngle(up, -a + PI / 2);
        m.compose(p, q, ONE); aud.setMatrixAt(i, m); aud.setColorAt(i, c.set(pal[Math.floor(rnd() * pal.length)]));
      }
      aud.instanceMatrix.needsUpdate = true;
      if (aud.instanceColor) aud.instanceColor.needsUpdate = true;
      const boat = new T.Group();
      boat.add(new T.Mesh(new T.BoxGeometry(6, 2.6, 26), k.flat(0x2a3138, 0.3, 0.6)));
      const cab = new T.Mesh(new T.BoxGeometry(5, 3, 9), k.flat(0xd8d2c4, 0.2, 0.6)); cab.position.set(0, 2.6, -3); boat.add(cab);
      k.add(boat);
      k.rider(boat, k.spline([v(-120, 0.4, -40), v(-40, 0.4, -95), v(60, 0.4, -110), v(140, 0.4, -60)], false), 5, 0);
      /* gulls over the water */
      const NG = 16, bodyG = new T.ConeGeometry(0.14, 0.7, 5); bodyG.rotateX(PI / 2);
      const gulls = k.instances(bodyG, k.flat(0xdde2e6, 0, 0.85), Array.from({ length: NG }, () => new T.Matrix4()));
      gulls.frustumCulled = false;
      const st = Array.from({ length: NG }, () => ({ a: rnd() * PI * 2, r: 40 + rnd() * 50, y: 14 + rnd() * 16, w: 0.6 + rnd() * 0.6 }));
      k.ticks.push((t) => {
        st.forEach((b, i) => { const a = b.a + t * 0.2 * b.w; p.set(Math.cos(a) * b.r, b.y + Math.sin(t * 0.7 + i) * 1.6, -35 + Math.sin(a) * b.r * 0.8); q.setFromAxisAngle(up, -a + PI / 2); m.compose(p, q, ONE); gulls.setMatrixAt(i, m); });
        gulls.instanceMatrix.needsUpdate = true;
      });
    }
    /* The works: glass panels beside the paths. A panel offset to the side of a path
       has to face back at it, which is rotY = ang - PI/2, not ang + PI/2. */
    const mounts: Mount[] = [];
    for (const [x0, z0, x1, z1] of legs) {
      const ang = Math.atan2(x1 - x0, z1 - z0), px = Math.cos(ang), pz = -Math.sin(ang);
      const n = 4;
      for (let i = 1; i <= n; i++) {
        const t = i / (n + 1), x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
        const gx = x + px * 2.6, gz = z + pz * 2.6, y = field(gx, gz);
        const panel = k.box(4.4, 3.2, 0.16, gx, y + 1.9, gz, glass); panel.rotation.y = ang;
        mounts.push({ position: v(gx - px * 0.14, y + 2.15, gz - pz * 0.14), rotation: ang - PI / 2, target: v(x, field(x, z) + 2.0, z), width: 3.6, height: 2.1, style: 'steel', wash: false });
      }
    }
    for (const dx of [-4.6, 0, 4.6]) mounts.push({ position: v(AX + dx, AY - 0.4, AZ - 6.26), rotation: 0, target: v(AX + dx * 0.5, AY - 0.4, AZ + 9), width: 4.2, height: 2.5, style: 'steel', wash: false });
    for (let i = 0; i < 3; i++) { const a = PI * 0.8 + (i / 2) * PI * 0.4, x = OX + Math.cos(a) * 5.7, z = OZ + Math.sin(a) * 5.7; mounts.push({ position: v(x, OY + 2.1, z), rotation: -a - PI / 2, target: v(OX + Math.cos(a) * 2.4, OY + 2.1, OZ + Math.sin(a) * 2.4), width: 2.8, height: 1.7, style: 'steel', wash: false }); }
    k.censusWall({ x: 0, y: 3.0, z: 14.4, rotY: PI, cols: 26, rows: 3, tile: 0.6, gap: 0.05, start: ctx.wallStart(6000, 78), pieces: ctx.all, backing: iron });
    /* what the island knows */
    const src = { name: 'Little Island, Wikipedia', url: 'https://en.wikipedia.org/wiki/Little_Island_(New_York_City)' };
    k.egg(v(-14, field(-14, 2) + 1.2, 2), { id: 'opened-2021', title: 'Two hundred and sixty million dollars', year: '2021', text: 'Little Island opened on May 21, 2021. It cost 260 million dollars to build; Barry Diller\'s foundation put in an estimated 380 million in all, including 120 million for twenty years of upkeep.', clue: 'Cross the bridge and ask who paid for the ground you are standing on.', source: src }, { r: 3 });
    k.egg(v(OX, OY + 1.6, OZ), { id: 'one-three-two', title: 'A hundred and thirty two tulips', text: 'The park sits on 132 pot shaped structures, the tulips, standing between fifteen and sixty two feet above the mean waterline on 267 or 280 concrete pilings driven as much as two hundred feet into the bed of the Hudson.', clue: 'From the high point, look over the rail at what is holding you up.', source: src }, { r: 3.4 });
    k.egg(v(AX, AY - 2.6, AZ + 3), { id: 'the-amph', title: 'The Amph', text: 'The amphitheatre at the west end seats 687 and faces the water. The whole park is 2.4 acres and holds a thousand people at once.', clue: 'Sit down at the end that faces away from the city.', source: src }, { r: 4 });
    k.egg(v(-20, field(-20, -20) + 1.2, -20), { id: 'the-planting', title: 'Three hundred and fifty species', text: 'The planting opened with 66,000 bulbs and 114 trees, and runs to 35 tree species, 65 shrub species and 270 perennials and grasses: more than 350 species of flora on two and a half acres.', clue: 'Count the colours at your feet before you count the trees.', source: src }, { r: 3 });
    k.egg(v(12, field(12, 2) + 1.2, 2), { id: 'raised-for-sandy', title: 'Thirteen feet higher than drawn', year: '2012', text: 'After Hurricane Sandy in 2012 Diller had the whole structure raised about thirteen feet above the original plans, to put the park out of reach of the next flood.', clue: 'The reason the bridges climb is a storm that happened before the park existed.', source: src }, { r: 3 });
    const floorY = (x: number, z: number) => {
      if (z > 13) return 0.9;
      for (const [bx, bw] of BR) {
        if (Math.abs(x - bx) < bw / 2 + 0.4) {
          const zEnd = -35 + 38 * Math.sqrt(Math.max(0, 1 - (bx / 46) ** 2));
          if (z > zEnd) { const t = (13 - z) / (13 - zEnd); return 0.9 + (field(bx, zEnd) - 0.9) * t; }
        }
      }
      return inside(x, z) < 1 ? field(x, z) - 0.15 : 0.9;
    };
    return { mounts, spawn: v(-14, 4.1, 12), look: v(-11, 4.6, -14), eye: 3, bounds: [-44, 44, -68, 13], style: 'steel', floorY };
  },
};

/* ---------------- 10 THE CITY, REWILDED (rebuild) ---------------- */
export const highline2: RoomDef = {
  id: 'highline',
  name: 'The city, rewilded',
  area: 'THE HIGH LINE',
  mood: 'Late afternoon',
  color: '#acbf89',
  description: 'Thirty feet up on a freight viaduct that carried its last train in 1980 and then grew a meadow on its own. Concrete planks finger into Oudolf\'s grasses, the old rails are still in the deck, the traffic runs underneath, and the buildings press in so close on both sides that their brick is the wall the works hang on.',
  signatures: 'The tapered concrete planks fingering into the planting, the original rails and ties left in the deck, the peel up benches, the sundeck chairs on their rails, the Tenth Avenue Square cut down into the deck with its window over the traffic, a hotel straddling the line, water towers and fire escapes, and the grasses.',
  build(k, ctx) {
    k.sky({ top: 0x7fa2cf, horizon: 0xf1d3ad, ground: 0x5b5347, fog: 0.0026, sun: { az: 4.7, el: 0.24, color: 0xffd9a0, size: 18 }, haze: 0.28, env: 0.9 });
    k.hemi(0xffe6c8, 0x6a6458, 0.8);
    k.sun(0xffd7a3, 2.5, -50, 30, 0, true, 70);
    const plank = k.pbr('hlPlank', X.concrete(0xb5b2a6, 3), 0.4, { roughness: 0.8 }),
      gravel = k.pbr('hlBallast', X.cobble(0x6a655c, 4), 1.0),
      soil = k.flat(0x3d3128, 0, 1),
      grassA = k.flat(0x8a9a5a, 0, 0.95, { side: T.DoubleSide }),
      grassB = k.flat(0x5d7a44, 0, 0.95, { side: T.DoubleSide }),
      grassC = k.flat(0xb9a86a, 0, 0.95, { side: T.DoubleSide }),
      iron = k.flat(0x35302c, 0.6, 0.6),
      rust = k.pbr('hlRail', X.steel(0x6a4a3a, false, 8), 0.6, { metalness: 0.5, roughness: 0.7 }),
      ipe = k.pbr('hlIpe', X.planks(0x6b4a30, 5, 5), 1.4, { roughness: 0.55 }),
      brick = k.pbr('hlBrick', X.brick(0x6b4a3d, 7), 0.28),
      brick2 = k.pbr('hlBrick2', X.brick(0x4c4650, 8), 0.28),
      glassT = k.pbr('hlTower', X.windows(31, 0.22, 0x5c7686, false), 0.11, { emissive: 0xffffff, emissiveIntensity: 0.5, roughness: 0.3, metalness: 0.4, stretch: 0.42 }),
      asphalt = k.pbr('hlStreet', X.asphalt(0x2a2d31), 0.11),
      dark = k.flat(0x14171c, 0.3, 0.7);
    const Z0 = 11, Z1 = -62;
    /* the street thirty feet below, with the traffic on it */
    k.box(90, 0.3, 300, 0, -9.2, -40, asphalt);
    for (let z = Z0; z > Z1 - 20; z -= 3.4) k.box(0.26, 0.02, 1.8, 0, -9.03, z, k.flat(0xd8c84a, 0, 0.9));
    if (!ctx.reduced) {
      const cabs = k.instances(new T.BoxGeometry(1.8, 1.3, 4.2), k.flat(0xf0c22a, 0.2, 0.5), Array.from({ length: 10 }, () => new T.Matrix4()));
      const cars = k.instances(new T.BoxGeometry(1.8, 1.25, 4.4), k.flat(0x2a3038, 0.3, 0.5), Array.from({ length: 10 }, () => new T.Matrix4()));
      const tail = k.instances(new T.BoxGeometry(1.6, 0.18, 0.18), k.glow(0xff3322), Array.from({ length: 20 }, () => new T.Matrix4()));
      cabs.frustumCulled = cars.frustumCulled = tail.frustumCulled = false;
      const rnd = X.mulberry(11), m = new T.Matrix4();
      const st = Array.from({ length: 20 }, (_, i) => ({ s: rnd() * 180, x: (i % 2 ? -1 : 1) * (3 + (i % 3) * 3.4), v: 9 + rnd() * 7, d: i % 2 ? 1 : -1 }));
      const place = (_t: number, dt: number) => {
        st.forEach((a, i) => {
          a.s = (a.s + a.v * Math.min(dt, 0.1)) % 200;
          const z = a.d > 0 ? Z0 - a.s : Z0 - 200 + a.s;
          m.setPosition(a.x, -8.4, z);
          if (i < 10) cabs.setMatrixAt(i, m); else cars.setMatrixAt(i - 10, m);
          m.setPosition(a.x, -8.2, z - a.d * 2.3); tail.setMatrixAt(i, m);
        });
        cabs.instanceMatrix.needsUpdate = cars.instanceMatrix.needsUpdate = tail.instanceMatrix.needsUpdate = true;
      };
      place(0, 0); k.ticks.push(place);
    }
    /* the viaduct: girders, columns, the ballast and the deck */
    k.box(24, 1.6, Z0 - Z1 + 8, 0, -0.9, (Z0 + Z1) / 2, k.pbr('hlGirder', X.steel(0x2f3a3a, true, 9), 0.5, { metalness: 0.7, roughness: 0.5 }));
    for (let z = Z0; z > Z1; z -= 9) for (const x of [-9, 9]) { k.box(1.0, 8, 1.0, x, -5, z, iron); k.box(24, 0.8, 0.8, 0, -1.9, z, iron); }
    /* the deck stops at the square: the square is a hole cut down into it */
    const DZ = Z1 + 11;
    k.box(24, 0.3, Z0 - DZ, 0, -0.15, (Z0 + DZ) / 2, gravel);
    k.box(11.2, 0.12, Z0 - DZ, 0, 0.06, (Z0 + DZ) / 2, plank);
    /* the planks fingering into the beds on both sides */
    for (const s of [-1, 1]) for (let i = 0; i < 24; i++) {
      const z = Z0 - 1 - i * 2.4, sh = new T.Shape();
      sh.moveTo(0, 0); sh.lineTo(3.0, 0); sh.lineTo(4.4, 0.16); sh.lineTo(3.0, 0.32); sh.lineTo(0, 0.32);
      const o = k.mesh(new T.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: false }), plank, s * 5.5, 0.05, z);
      o.rotation.x = -PI / 2;
      if (s < 0) o.rotation.z = PI;
    }
    /* the rails, still in the deck */
    for (const x of [-6.9, -5.5, 5.5, 6.9]) k.box(0.09, 0.11, Z0 - DZ - 2, x, 0.11, (Z0 + DZ) / 2, rust);
    for (let z = Z0; z > DZ; z -= 1.1) for (const s of [-1, 1]) k.box(2.2, 0.08, 0.22, s * 6.2, 0.03, z, k.flat(0x3b2e25, 0, 1));
    /* Oudolf's planting: three grades of grass that move, mounds, birches */
    {
      const rnd = X.mulberry(21);
      const mats = [grassA, grassB, grassC];
      const geos = [new T.PlaneGeometry(0.09, 1.3).translate(0, 0.65, 0), new T.PlaneGeometry(0.15, 0.95).translate(0, 0.48, 0), new T.PlaneGeometry(0.07, 1.6).translate(0, 0.8, 0)];
      const groups = mats.map((mm, gi) => {
        const n = 900;
        const o = k.instances(geos[gi], mm, Array.from({ length: n }, () => new T.Matrix4()));
        o.frustumCulled = false;
        const st = Array.from({ length: n }, () => { const s = rnd() > 0.5 ? 1 : -1; return { x: s * (6.4 + rnd() * 5.2), z: Z0 - rnd() * (Z0 - Z1), ry: rnd() * PI, h: 0.6 + rnd() * 0.9, ph: rnd() * 6.3 }; });
        return { o, st, ph: gi * 2.1 };
      });
      const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), sc = new T.Vector3(), e = new T.Euler();
      const place = (t: number) => {
        for (const g of groups) {
          g.st.forEach((b, i) => {
            const lean = 0.16 * Math.sin(t * 1.1 + g.ph + b.ph) + 0.06 * Math.sin(t * 2.7 + b.ph);
            e.set(0, b.ry, lean); q.setFromEuler(e);
            p.set(b.x, 0.1, b.z); sc.set(1, b.h, 1);
            m.compose(p, q, sc); g.o.setMatrixAt(i, m);
          });
          g.o.instanceMatrix.needsUpdate = true;
        }
      };
      place(0);
      if (!ctx.reduced) k.ticks.push(place);
      for (const s of [-1, 1]) for (let z = Z0 - 3; z > Z1 + 4; z -= 7.5) {
        k.box(5.4, 0.25, 6, s * 8.6, 0.1, z, soil);
        for (let j = 0; j < 3; j++) k.sphere(0.35 + rnd() * 0.3, s * (6.6 + rnd() * 3.4), 0.45, z - 2.4 + rnd() * 4.8, j % 2 ? grassB : k.flat(0x9a8a58, 0, 1), 7);
        if (rnd() > 0.45) k.tree(s * 9.0, 0.1, z - 3, { kind: 'column', h: 4.6, r: 1.3, leaf: 0x6f9a52, seed: Math.round(z) + s });
      }
    }
    /* the peel up benches and the sundeck chairs */
    for (const s of [-1, 1]) for (const z of [-3, -27, -49]) {
      for (let strip = 0; strip < 6; strip++) {
        const x = s * 4.5 + strip * 0.15 * s, sh = new T.Shape();
        sh.moveTo(-0.065, 0); sh.lineTo(0.065, 0); sh.lineTo(0.065, 0.07); sh.lineTo(-0.065, 0.07); sh.closePath();
        const path = new T.CatmullRomCurve3([v(x, 0.1, z + 2.2), v(x, 0.12, z + 1.0), v(x, 0.35, z + 0.4), v(x, 0.66, z), v(x, 0.7, z - 1.4)]);
        k.mesh(new T.ExtrudeGeometry(sh, { steps: 28, bevelEnabled: false, extrudePath: path }), ipe);
      }
      k.keepOut.push({ x: s * 4.7, z, r: 1.3 });
    }
    for (let i = 0; i < 5; i++) {
      const z = -13 - i * 2.6;
      const ch = k.mesh(new T.BoxGeometry(1.9, 0.12, 0.7), ipe, 3.6, 0.55, z); ch.rotation.z = -0.16;
      k.box(0.1, 0.5, 0.7, 3.0, 0.3, z, iron); k.box(0.1, 0.5, 0.7, 4.3, 0.3, z, iron);
      k.keepOut.push({ x: 3.7, z, r: 1.1 });
    }
    for (const x of [2.9, 4.4]) k.box(0.07, 0.07, 14, x, 0.14, -18, rust);
    /* the buildings pressing in, and the works on their brick */
    for (const s of [-1, 1]) for (let b = 0; b < 9; b++) {
      const z = Z0 - 2 - b * 8.4, h = 14 + (b % 3) * 6, mtl = b % 2 ? brick : brick2;
      if (b % 4 === 3) { k.box(8, h + 13, 8.2, s * 16, (h + 13) / 2 - 9, z, glassT); continue; }
      k.box(8, h + 9, 8.2, s * 16, (h + 9) / 2 - 9, z, mtl);
      k.box(8.3, 0.4, 8.5, s * 16, h, z, k.flat(0x8f857a, 0, 0.8));
      for (let y = 6; y < h - 1; y += 3) for (const dz of [-2.8, 0, 2.8]) {
        k.box(0.1, 1.9, 1.3, s * 11.98, y, z + dz, k.flat(0xd6d1c3, 0, 0.8));
        k.box(0.05, 1.6, 1.05, s * 11.93, y, z + dz, (b + y) % 3 === 0 ? k.glow(0xffe0b0) : k.glass(0x8fb0c0, 0.4, 0.1));
      }
      if (b % 3 === 1) k.prop('fire_escape', s * 10.95, 7, z + 3, { height: 3.2, rotY: s > 0 ? -PI / 2 : PI / 2 });
      if (b % 2 === 0) k.prop('water_tower', s * 15.5, h, z, { height: 5 });
      k.block(s > 0 ? 11.9 : -20, s > 0 ? 20 : -11.9, z - 4.2, z + 4.2);
    }
    k.skyline({ z: -170, count: 30, spacing: 7, scale: 2.4, base: -9, seed: 22, lit: 0.24, glow: 0.5, tint: 0x6a6f78 });
    /* the hotel straddling the line at the north end */
    for (const s of [-1, 1]) { k.box(3.2, 14, 6, s * 9.6, 7, 7.5, k.pbr('hlPier', X.concrete(0x8a8780, 33), 0.4)); k.block(s > 0 ? 7.9 : -11.3, s > 0 ? 11.3 : -7.9, 4.4, 10.6); }
    k.box(26, 9, 15, 0, 18.5, 7.5, glassT);
    k.box(26.6, 0.7, 15.6, 0, 13.6, 7.5, dark);
    /* the Tenth Avenue Square: the deck cut down into steps behind a window */
    const SQ = Z1 + 8;
    for (let i = 0; i < 7; i++) k.box(13, 0.44, 1.5, 0, 0.05 - i * 0.42, SQ + 3 - i * 1.5, ipe);
    k.box(13.4, 0.5, 3.0, 0, -2.78, SQ - 7.1, ipe);
    for (const s of [-1, 1]) k.box(0.5, 3.4, 11, s * 6.7, -1.2, SQ - 2.6, plank);
    k.box(13.4, 0.3, 0.6, 0, -2.6, SQ - 8.1, iron);
    k.box(12, 5.2, 0.12, 0, 0.2, SQ - 8.3, k.glass(0xbfd8e6, 0.16, 0.05));
    k.box(13.4, 0.5, 0.8, 0, 3.0, SQ - 8.3, iron);
    k.sign('THE HIGH LINE', 6.4, 0.72, 0, 3.0, SQ - 8.72, 'transparent', '#f2f2de', 96, PI);
    k.block(-13, 13, Z1 - 2, SQ - 8.0);
    for (const s of [-1, 1]) k.block(s > 0 ? 6.5 : -13, s > 0 ? 13 : -6.5, SQ - 8, SQ + 4);
    /* people, strolling both ways all afternoon */
    if (!ctx.reduced) {
      k.crowd([v(0, 0, Z0 - 1), v(1.6, 0, -14), v(-1.4, 0, -34), v(0, 0, SQ + 3)], 22, { seed: 12, speed: 0.55, spread: 2.6, colors: [0xe83a5a, 0x3a8ae8, 0xf0d24a, 0x2a2a34, 0xe8e2d4, 0x8a4ad8, 0xff8c3b, 0x2a8a4a] });
      for (let i = 0; i < 4; i++) figure(k, 3.6, 0.62, -13 - i * 2.6, [0xe8e2d4, 0x2a3f6a, 0xd07a3a, 0x8a2a2a][i], { h: 0.55, rotY: -PI / 2 });
    }
    /* the works: on the brick either side, seen from the deck the visitor is on.
       The old room sent the viewer to x = 6.45 on a deck that stops at 5.6. */
    const mounts: Mount[] = [];
    for (let i = 0; i < 9; i++) {
      const z = Z0 - 4 - i * 6.0;
      for (const s of [-1, 1]) mounts.push({ position: v(s * 11.85, 3.7, z), rotation: s > 0 ? -PI / 2 : PI / 2, target: v(s * 4.9, 3.2, z), width: 5.0, height: 3.0, style: 'black', wash: true });
    }
    for (const x of [-3.4, 3.4]) mounts.push({ position: v(x, -0.9, SQ - 8.18), rotation: 0, target: v(x * 0.6, -1.4, SQ - 3.4), width: 3.4, height: 2.1, style: 'black', wash: true });
    k.censusWall({ x: -11.9, y: 8.2, z: -6, rotY: PI / 2, cols: 14, rows: 4, tile: 0.56, gap: 0.05, start: ctx.wallStart(2200, 56), pieces: ctx.all, backing: iron });
    k.censusWall({ x: 11.9, y: 8.2, z: -6, rotY: -PI / 2, cols: 14, rows: 4, tile: 0.56, gap: 0.05, start: ctx.wallStart(2280, 56), pieces: ctx.all, backing: iron });
    /* what the viaduct knows */
    const src = { name: 'High Line, Wikipedia', url: 'https://en.wikipedia.org/wiki/High_Line' };
    k.egg(v(0, 1.2, Z0 - 2), { id: 'built-1934', title: 'A freight line, dedicated 1934', year: '1934', text: 'The viaduct was built between 1929 and 1934 as part of the West Side Improvement, to get freight trains off the street. The first train ran on it in 1933 and it was dedicated on June 29, 1934.', clue: 'The thing under the grass is a railway, and the rails are still here.', source: src }, { r: 3 });
    k.egg(v(-6.2, 0.4, -20), { id: 'frozen-turkeys', title: 'The last train', year: '1980', text: 'The last train ran in 1980: three cars of frozen turkeys. After that the viaduct was left alone and a meadow of drought tolerant grasses, sumac and rugged trees seeded itself on the ballast.', clue: 'Follow the rails until you find what they last carried.', source: src }, { r: 2.6 });
    k.egg(v(6.2, 0.4, -40), { id: 'friends-1999', title: 'Two neighbours and a camera', year: '1999', text: 'Friends of the High Line was founded in October 1999 by Joshua David and Robert Hammond, who lived nearby and wanted the structure kept. Section one opened on June 8, 2009, section two on June 7, 2011, section three on September 21, 2014.', clue: 'The reason this is a park and not a memory is two people who went to a community meeting.', source: src }, { r: 2.6 });
    k.egg(v(0, 0.6, SQ - 1), { id: 'tenth-avenue', title: 'The window over the avenue', text: 'The deck is cut down into steps here and glazed, so the traffic below becomes the thing you sit and watch. The park runs 1.45 miles in all, thirty feet above the street.', clue: 'Sit on the steps and look at the one view nobody designed.', source: src }, { r: 3.4 });
    k.egg(v(-8.6, 0.6, -50), { id: 'four-hundred-species', title: 'Four hundred species', text: 'The planting by Piet Oudolf, with James Corner Field Operations and Diller Scofidio and Renfro, runs to about 400 species and roughly 100,000 individual plants. Eight million people walked it in 2019.', clue: 'Count the kinds of grass. Stop at four hundred.', source: src }, { r: 3 });
    /* the square is cut down into the deck, so the deck has a floor that follows it */
    const floorY = (x: number, z: number) => {
      if (Math.abs(x) < 6.2 && z < SQ + 3.4 && z > SQ - 8.6) return Math.max(-2.5, 0.1 - 2.6 * ((SQ + 3.4 - z) / 9.4));
      return 0;
    };
    return { mounts, spawn: v(0, 3, Z0 - 2), look: v(0, 3.2, -30), eye: 3, bounds: [-5.3, 5.3, SQ - 4, Z0 - 1], style: 'black', floorY };
  },
};
