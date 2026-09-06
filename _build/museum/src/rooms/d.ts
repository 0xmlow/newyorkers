/* Rooms 12 to 16: Bethesda Arcade, the Oculus, the Guggenheim spiral, the Rose Reading Room, the Apollo. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Kit, Mount } from '../kit';
import { corridorMounts } from './types';
import type { RoomDef } from './types';

const PI = Math.PI;

/* ---------------- 12 BETHESDA ARCADE ---------------- */
export const bethesda: RoomDef = {
  id: 'bethesda',
  name: 'The painted threshold',
  area: 'BETHESDA ARCADE',
  mood: 'Morning in the park',
  color: '#c4ad83',
  description: 'Sandstone arches under a patterned tile ceiling, the fountain and the lake beyond the far arch.',
  signatures: 'The encaustic tile ceiling in coffers, the sandstone arcade with carved niches, the fountain terrace and lake beyond.',
  build(k, ctx) {
    k.sky({ top: 0x7fa6d6, horizon: 0xe6ecea, ground: 0x4f5a44, fog: 0.003, sun: { az: 1.0, el: 0.55, color: 0xfff3d8, size: 14 }, env: 0.85 });
    k.hemi(0xf0f4ff, 0x4a4a3a, 0.85);
    k.sun(0xfff0d0, 2.2, 30, 40, 40, true, 70);
    const sand = k.pbr('sandstone', X.ashlar(0xc7a77c, 6, 3), 0.22),
      sandDark = k.pbr('sandstoneD', X.ashlar(0xa98a62, 7, 4), 0.3),
      tile = k.pbr('minton', X.minton(), 0.55, { roughness: 0.35 }),
      floor = k.pbr('bluestone', X.pavers(0x77817f, 8), 0.3, { roughness: 0.6 }),
      water = k.flat(0x3a6a72, 0.6, 0.15, { transparent: true, opacity: 0.9 }),
      bronze = k.pbr('bronze', X.patina(0x4f7d6e), 0.5, { metalness: 0.4, roughness: 0.5 }),
      grass = k.pbr('lawnB', X.grass(0x4f7a3e, 3), 0.15),
      opal = k.glow(0xfff1d6);
    const L = 44, ZC = 10 - L / 2;
    // the arcade: three aisles, two rows of columns, groin vault bays and tile coffers
    k.box(26, 0.4, L + 4, 0, -0.2, ZC, floor);
    for (const s of [-1, 1]) {
      k.arcade(L + 4, 9.2, 1.4, 8, 3.2, 6.4, s * 12.4, 0, ZC, sand, PI / 2, false);
      k.box(1.4, 9.2, L + 4, s * 13.9, 4.6, ZC, sandDark);
      for (let z = 8; z > ZC - L / 2; z -= 5.5) k.column(s * 4.2, 0, z, 8.2, 0.42, sand, false, sandDark);
      for (let z = 8; z > ZC - L / 2; z -= 5.5) {
        k.arch(3.6, 8.4, 0.5, s * 4.2, 0, z - 2.75, sand, false, 0.6).rotation.y = PI / 2;
      }
    }
    for (let z = 8; z > ZC - L / 2 - 1; z -= 5.5) {
      k.arch(7.4, 8.6, 0.6, 0, 0, z, sand, false, 0.62);
      for (const s of [-1, 1]) k.arch(7.4, 8.6, 0.6, s * 8.3, 0, z, sand, false, 0.55);
    }
    for (let x = -11; x <= 11; x += 2.2) for (let z = 9; z > ZC - L / 2 - 1; z -= 2.2) {
      k.rounded(2.0, 0.12, 2.0, x, 8.75, z, tile, 0.02);
      k.box(2.2, 0.16, 0.16, x, 8.72, z + 1.1, sandDark);
      k.box(0.16, 0.16, 2.2, x + 1.1, 8.72, z, sandDark);
    }
    k.box(28, 0.5, L + 4, 0, 9.1, ZC, sandDark);
    for (let z = 6, i = 0; z > ZC - L / 2; z -= 11, i++) { k.point(0, 7.2, z, 0xfff0d6, 26, 20); k.torus(0.5, 0.05, 0, 7.6, z, bronze, 20).rotation.x = PI / 2; for (let j = 0; j < 6; j++) { const a = (j * PI) / 3; k.sphere(0.1, Math.cos(a) * 0.5, 7.6, z + Math.sin(a) * 0.5, opal, 6); } k.beam(v(0, 8.7, z), v(0, 7.65, z), 0.02, bronze, 4); }
    // the entrance stair up to the Mall behind the visitor, with the census on its wall
    for (let i = 0; i < 8; i++) k.box(26, 0.4, 1.2, 0, 0.2 + i * 0.4, 12 + i * 1.2, sand);
    k.box(26, 10, 1.4, 0, 5, 22.5, sand);
    k.censusWall({ x: 0, y: 6.4, z: 21.75, rotY: PI, cols: 28, rows: 3, tile: 0.62, gap: 0.05, start: ctx.wallStart(1500, 84), pieces: ctx.all, backing: sandDark });
    k.sign('BETHESDA TERRACE  ·  THE ARCADE', 8, 0.7, 0, 9.2, 21.7, '#6b5334', '#f4e6c8', 90, PI, { border: true });
    // the terrace, fountain and lake beyond the last arch
    const tz = ZC - L / 2 - 2;
    k.box(60, 0.4, 40, 0, -0.2, tz - 20, floor);
    k.cyl(9.5, 0.9, 0, 0.45, tz - 16, sand, 9.5, 48);
    k.cyl(8.8, 0.9, 0, 0.5, tz - 16, water, 8.8, 48);
    k.lathe([[3.4, 0], [3.4, 0.3], [1.2, 0.5], [0.8, 2.2], [2.6, 2.4], [2.6, 2.7], [0.5, 2.9], [0.4, 4.4], [1.5, 4.6], [1.5, 4.8], [0.3, 5], [0.3, 6]], 0, 0.9, tz - 16, sand, 40);
    k.lathe([[0.9, 0], [0.8, 0.6], [0.55, 2.2], [0.5, 3.4], [0.36, 4.2]], 0, 6.9, tz - 16, bronze, 16);
    k.sphere(0.42, 0, 11.6, tz - 16, bronze, 12);
    for (const s of [-1, 1]) { const o = k.mesh(new T.BoxGeometry(2.6, 0.14, 1.2), bronze, s * 1.4, 9.8, tz - 16.4); o.rotation.z = s * 0.5; }
    for (let j = 0; j < 16; j++) { const a = (j * PI) / 8; k.curve([v(Math.cos(a) * 8, 0.6, tz - 16 + Math.sin(a) * 8), v(Math.cos(a) * 6.5, 2.8, tz - 16 + Math.sin(a) * 6.5), v(Math.cos(a) * 4.5, 0.9, tz - 16 + Math.sin(a) * 4.5)], 0.03, k.glow(0xdff4ff), 12); }
    k.keepOut.push({ x: 0, z: tz - 16, r: 10.2 });
    for (const s of [-1, 1]) for (let i = 0; i < 10; i++) k.lathe([[0.22, 0], [0.2, 0.1], [0.1, 0.16], [0.14, 0.5], [0.1, 0.85], [0.26, 0.95]], s * 22, 0, tz - 4 - i * 3.4, sand, 10);
    for (const s of [-1, 1]) k.box(0.5, 0.2, 34, s * 22, 1.05, tz - 19, sand);
    k.water({ y: -0.6, color: 0x2e5a5a, w: 260, d: 200, z: tz - 130, amp: 0.6 });
    k.box(120, 1, 30, 0, -0.5, tz - 40, floor);
    const rnd = X.mulberry(12);
    for (let i = 0; i < 26; i++) k.tree((rnd() - 0.5) * 120, -0.2, tz - 46 - rnd() * 24, { kind: 'round', h: 5 + rnd() * 3, r: 3 + rnd() * 2, leaf: 0x3f6b36, seed: i });
    for (const x of [-30, 30]) k.tree(x, -0.2, tz - 8, { kind: 'round', h: 7, r: 4.2, leaf: 0x4a7a3c });
    k.box(0.5, 0.2, 60, 0, 0.1, tz - 20, grass);
    k.skyline({ z: tz - 200, count: 30, spacing: 8, scale: 2.4, base: -4, seed: 24, lit: 0.1, glow: 0.2, tint: 0x9a9890, rows: 1 });
    // the works: framed in the side niches, then on the terrace balustrades
    const mounts: Mount[] = corridorMounts({ pairs: 8, x: 12.0, z0: 5.25, pitch: 5.5, y: 3.5, width: 5.0, height: 2.9, inset: 5.4, style: 'gilt' });
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) {
      const z = tz - 6 - i * 9;
      k.box(0.5, 4.2, 5.6, s * 12.6, 2.4, z, sand);
      k.moulding([[0, 0], [0.4, 0], [0.4, 0.15], [0.25, 0.25], [0, 0.25]], 6, s * 12.6 - s * 0.25, 4.5, z, sand, s > 0 ? PI : 0);
      mounts.push({ position: v(s * 12.3, 2.6, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 7.4, 3, z), width: 4.4, height: 2.6, style: 'gilt', wash: false });
    }
    for (const s of [-1, 1]) mounts.push({ position: v(s * 8.3, 3.3, tz + 0.05), rotation: 0, target: v(s * 6.4, 3, tz + 6), width: 4.4, height: 2.6, style: 'gilt', wash: false });
    return { mounts, spawn: v(0, 3, 10), look: v(0, 4, -30), eye: 3, bounds: [-20, 20, tz - 26, 11], style: 'gilt' };
  },
};

/* ---------------- 13 THE OCULUS ---------------- */
export const oculus: RoomDef = {
  id: 'oculus',
  name: 'White ribs, infinite city',
  area: 'THE OCULUS',
  mood: 'Pure daylight',
  color: '#c6e4ef',
  description: 'Tapered white ribs closing over a long skylight, marble underfoot, the census standing on white fins in the light.',
  signatures: 'Paired tapering steel ribs meeting at a central skylight spine, a white marble hall, mezzanine galleries behind glass.',
  build(k, ctx) {
    k.sky({ top: 0x86b4e6, horizon: 0xf3f6f8, ground: 0xb8bcbd, fog: 0.0015, sun: { az: 3, el: 1.2, color: 0xffffff, size: 10 }, env: 1.1 });
    k.hemi(0xffffff, 0x9aa0a4, 1.1);
    k.sun(0xffffff, 2.6, 4, 70, -14, true, 60);
    const white = k.pbr('ribWhite', X.plaster(0xf4f5f2, 9), 0.5, { roughness: 0.45, metalness: 0.1 }),
      marble = k.pbr('oculusMarble', X.marble(0xf1efe9, 0xc9c5bb, 5), 0.25, { roughness: 0.2 }),
      glass = k.glass(0xdff0f8, 0.12, 0.05),
      steel = k.flat(0xd9dde0, 0.7, 0.35);
    const L = 84, ZC = 10 - L / 2;
    k.box(34, 0.4, L + 8, 0, -0.2, ZC, marble);
    for (let z = 14; z > ZC - L / 2 - 4; z -= 2) {
      const d = Math.abs(z - ZC) / (L / 2 + 4), h = 24 - 9 * d * d;
      for (const s of [-1, 1]) {
        const pts = [v(s * 17.5, 0, z), v(s * 16.5, 6, z), v(s * 12.5, h - 4, z), v(s * 5.5, h - 0.6, z), v(s * 0.9, h, z)];
        const tube = new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, 0.28, 8);
        const pa = tube.attributes.position;
        for (let i = 0; i < pa.count; i++) { const t = i / pa.count; const s2 = 1.6 - t * 1.1; const p = new T.CatmullRomCurve3(pts).getPoint(Math.min(1, Math.floor(i / 9) / 40)); pa.setXYZ(i, p.x + (pa.getX(i) - p.x) * s2, p.y + (pa.getY(i) - p.y) * s2, p.z + (pa.getZ(i) - p.z) * s2); }
        tube.computeVertexNormals();
        k.mesh(tube, white);
        k.box(0.6, 0.7, 1.6, s * 17.5, 0.35, z, white);
      }
      k.box(1.6, 0.08, 1.9, 0, h + 0.1, z, k.glow(0xffffff));
    }
    const shell = new T.BufferGeometry(), pos: number[] = [], idx: number[] = [], seg = 30;
    const zs = Array.from({ length: 44 }, (_, i) => 14 - i * 2.05);
    for (const z of zs) { const d = Math.abs(z - ZC) / (L / 2 + 4), h = 24 - 9 * d * d; for (let i = 0; i <= seg; i++) { const t = (i / seg) * PI; pos.push(Math.cos(t) * 17.4, Math.max(0, Math.sin(t) * h), z); } }
    for (let r = 0; r < zs.length - 1; r++) for (let i = 0; i < seg; i++) { const a = r * (seg + 1) + i; idx.push(a, a + 1, a + seg + 1, a + 1, a + seg + 2, a + seg + 1); }
    shell.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    shell.setIndex(idx);
    shell.computeVertexNormals();
    k.mesh(shell, glass);
    // mezzanines behind glass on both sides
    for (const s of [-1, 1]) {
      k.box(5, 0.5, L, s * 14.5, 6, ZC, white);
      k.box(0.08, 1.4, L, s * 12.05, 6.95, ZC, glass);
      for (let z = 12; z > ZC - L / 2; z -= 3) k.box(0.1, 1.4, 0.1, s * 12.05, 6.95, z, steel);
      k.box(0.12, 0.12, L, s * 12.05, 7.7, ZC, steel);
      k.box(5, 0.5, L, s * 14.5, 12, ZC, white);
      k.box(0.08, 1.4, L, s * 12.05, 12.95, ZC, glass);
      k.box(0.12, 0.12, L, s * 12.05, 13.7, ZC, steel);
      for (let z = 8; z > ZC - L / 2; z -= 8) { k.box(0.6, 12.5, 0.6, s * 12.3, 6.25, z, white); k.point(s * 10, 5, z, 0xffffff, 10, 14); }
    }
    // the fins carrying the works, and the end walls
    const mounts: Mount[] = [];
    for (let i = 0; i < 5; i++) {
      const z = 0 - i * 12.5;
      for (const s of [-1, 1]) {
        k.box(0.5, 5.4, 7.4, s * 6.5, 2.7, z, white);
        k.box(1.4, 0.16, 7.8, s * 6.5, 0.08, z, marble);
        k.block(s * 6.5 - 1.0, s * 6.5 + 1.0, z - 4.2, z + 4.2);
        mounts.push({ position: v(s * 6.22, 3.0, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 1.6, 3, z), width: 5.4, height: 3.1, style: 'white', wash: false });
        mounts.push({ position: v(s * 6.78, 3.0, z), rotation: s < 0 ? -PI / 2 : PI / 2, target: v(s * 10.4, 3, z), width: 4.6, height: 2.7, style: 'white', wash: false });
      }
    }
    const ez = ZC - L / 2 - 3;
    k.box(36, 26, 1.2, 0, 13, ez, white);
    k.box(36, 26, 1.2, 0, 13, 15, white);
    k.censusWall({ x: 0, y: 9.6, z: ez + 0.65, rotY: 0, cols: 30, rows: 5, tile: 0.62, gap: 0.05, start: ctx.wallStart(0, 150), pieces: ctx.all, backing: k.flat(0xe9ebe9, 0, 0.6) });
    k.sign('WORLD TRADE CENTER  ·  OCULUS', 10, 0.8, 0, 14.4, ez + 0.65, '#e9ebe9', '#1a2530', 85, 0, { border: true });
    k.sign('THE CITY IS THE GALLERY', 10, 0.8, 0, 14.4, 14.35, '#e9ebe9', '#1a2530', 85, PI, { border: true });
    for (const x of [-6.5, 6.5]) mounts.push({ position: v(x, 3.4, ez + 0.65), rotation: 0, target: v(x, 3, ez + 7), width: 5.4, height: 3.1, style: 'white', wash: false });
    for (const x of [-6.5, 6.5]) mounts.push({ position: v(x, 3.4, 14.35), rotation: PI, target: v(x, 3, 8), width: 5.4, height: 3.1, style: 'white', wash: false });
    return { mounts, spawn: v(0, 3, 12), look: v(0, 8, -40), eye: 3, bounds: [-11.2, 11.2, ez + 2, 13.6], style: 'white' };
  },
};

/* ---------------- 14 THE GUGGENHEIM SPIRAL ---------------- */
export const guggenheim: RoomDef = {
  id: 'guggenheim',
  name: 'Endless ascent',
  area: 'THE GUGGENHEIM SPIRAL',
  mood: 'A continuous journey',
  color: '#e9debf',
  description: 'One helical ramp rising three turns under a radial skylight, the works following the curve of the outer wall.',
  signatures: 'A continuous helical ramp widening as it rises, banded parapets, the ribbed circular skylight, the open rotunda void.',
  build(k, ctx) {
    k.sky({ top: 0xb9c6d2, horizon: 0xe9e4d6, ground: 0x8b8578, fog: 0.002, env: 0.9 });
    k.hemi(0xffffff, 0x8c867a, 1.0);
    k.sun(0xfff6e6, 1.8, 0, 60, 0, true, 40);
    const cream = k.pbr('cream', X.plaster(0xece7dc, 10), 0.4, { roughness: 0.85 }),
      floorM = k.pbr('rotundaFloor', X.terrazzo(0xd8d3c8, 4), 0.35, { roughness: 0.4 }),
      dark = k.flat(0x2a2622, 0.3, 0.6),
      glass = k.glass(0xeaf3f8, 0.2, 0.05);
    const R = 10.5, RISE = 0.85, TURNS = 3, N = 300;
    const path = Array.from({ length: N + 1 }, (_, i) => { const t = (i / N) * PI * 2 * TURNS; return v(Math.cos(t) * R, 2.1 + t * RISE, Math.sin(t) * R); });
    k.mesh(new T.CylinderGeometry(16, 16, 0.4, 96), floorM, 0, -0.2, 0);
    // the ramp surface, outer wall bands and inner parapet as helical ribbons
    const ribbon = (r0: number, r1: number, y0: number, y1: number, m: T.Material, wall = false) => {
      const p: number[] = [], idx: number[] = [], uv: number[] = [];
      for (let i = 0; i <= N; i++) {
        const t = (i / N) * PI * 2 * TURNS, y = t * RISE;
        if (wall) { p.push(Math.cos(t) * r0, y + y0, Math.sin(t) * r0, Math.cos(t) * r0, y + y1, Math.sin(t) * r0); }
        else { p.push(Math.cos(t) * r0, y + y0, Math.sin(t) * r0, Math.cos(t) * r1, y + y1, Math.sin(t) * r1); }
        uv.push(i * 0.4, 0, i * 0.4, 1);
        if (i < N) { const n = i * 2; idx.push(n, n + 2, n + 1, n + 1, n + 2, n + 3); }
      }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      g.computeVertexNormals();
      const mesh = k.mesh(g, m, 0, 0, 0, true);
      (mesh.material as T.Material).side = T.DoubleSide;
      return mesh;
    };
    ribbon(8.6, 13.2, 0, 0, cream);
    ribbon(8.6, 8.6, 0, 1.1, cream, true);
    ribbon(8.4, 8.4, 1.05, 1.15, dark, true);
    ribbon(13.3, 13.3, -1.2, 5.4, cream, true);
    ribbon(14.0, 14.0, 5.4, 5.9, dark, true);
    for (let i = 0; i <= N; i += 25) { const t = (i / N) * PI * 2 * TURNS; k.box(0.5, 1.1, 0.5, Math.cos(t) * 8.6, t * RISE + 0.55, Math.sin(t) * 8.6, cream); }
    // the skylight with its radial ribs, the ground floor pieces, the entrance
    const top = 2 * PI * TURNS * RISE + 6.5;
    k.torus(15, 0.25, 0, top, 0, cream, 96).rotation.x = PI / 2;
    for (let i = 0; i < 24; i++) { const t = (i * PI) / 12; k.beam(v(Math.cos(t) * 15, top, Math.sin(t) * 15), v(0, top + 4, 0), 0.12, cream, 8); }
    for (const r of [11, 7, 3.5]) k.torus(r, 0.1, 0, top + 4 - (r / 15) * 4 + 0.05, 0, cream, 64).rotation.x = PI / 2;
    k.mesh(new T.CircleGeometry(15, 64), new T.MeshBasicMaterial({ color: 0xf6fbff, side: T.DoubleSide }), 0, top + 4.2, 0).rotation.x = PI / 2;
    k.mesh(new T.ConeGeometry(15, 4, 64, 1, true), glass, 0, top + 2, 0).rotation.x = PI;
    k.point(0, top - 4, 0, 0xffffff, 120, 60);
    k.mesh(new T.CylinderGeometry(15.5, 15.5, 1.4, 96, 1, true), cream, 0, top - 0.7, 0);
    k.plinth(0, 0, 4, 0.9, 4, cream);
    k.prop('water_tower', 0, 0.98, 0, { height: 7 });
    k.plinth(5.5, -3, 1.6, 0.9, 1.6, cream);
    k.prop('hydrant', 5.5, 0.98, -3, { height: 1.8 });
    k.plinth(-5.5, 3, 1.6, 0.9, 1.6, cream);
    k.prop('lantern', -5.5, 0.98, 3, { height: 1.1 });
    k.point(0, 6, 0, 0xffffff, 40, 30);
    k.censusWall({ x: 0, y: 3.6, z: 13.15, rotY: PI, cols: 22, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(5600, 88), pieces: ctx.all, backing: dark });
    // the works along the outer wall, following the helix at eye height
    const mounts: Mount[] = [];
    for (let i = 0; i < 24; i++) {
      const t = ((i + 0.5) / 24) * PI * 2 * TURNS, rr = 13.1;
      mounts.push({ position: v(Math.cos(t) * rr, 2.7 + t * RISE, Math.sin(t) * rr), rotation: -t - PI / 2, target: v(Math.cos(t) * R, 2.1 + t * RISE, Math.sin(t) * R), width: 3.0, height: 2.9, style: 'white', wash: true });
    }
    return { mounts, spawn: path[0].clone(), look: path[6].clone(), eye: 2.1, bounds: [-14, 14, -14, 14], path, style: 'white' };
  },
};

/* ---------------- 15 THE ROSE READING ROOM ---------------- */
export const library: RoomDef = {
  id: 'library',
  daylit: false,
  name: 'City of stories',
  area: 'NYPL ROSE READING ROOM',
  mood: 'Quiet afternoon',
  color: '#c4a47a',
  description: 'Long oak tables under bronze lamps, book galleries on the walls, and paintings set into the carved ceiling coffers.',
  signatures: 'Rows of reading tables with bronze lamps, two tier bookcase walls with a gallery, tall arched windows, a gilded coffered ceiling with painted panels.',
  build(k, ctx) {
    k.sky({ top: 0x9ab5d6, horizon: 0xf1e7d4, ground: 0x6b5f4d, fog: 0.004, sun: { az: 4.4, el: 0.4, color: 0xffe3b8, size: 16 }, env: 0.6 });
    k.hemi(0xfff0dc, 0x4a3b2a, 0.65);
    k.sun(0xffe0b8, 1.8, -40, 30, -10, true, 60);
    const oak = k.pbr('oakFloor', X.planks(0x7a5334, 8, 12), 0.6, { roughness: 0.55 }),
      oakDark = k.pbr('oakDark', X.planks(0x5c3d26, 4, 13), 1.0, { roughness: 0.5 }),
      plaster = k.pbr('plasterL', X.plaster(0xd9c9a8, 12), 0.4, { roughness: 0.8 }),
      gold = k.pbr('goldL', X.gilt(0xc9a552), 2, { metalness: 0.8, roughness: 0.35 }),
      bronze = k.flat(0x6b4f2a, 0.85, 0.35),
      books = k.pbr('books', X.planks(0x6a3a2a, 14, 15), 2.2, { roughness: 0.85 }),
      books2 = k.pbr('books2', X.planks(0x2f4a5a, 12, 16), 2.2, { roughness: 0.85 }),
      glass = k.glass(0xf3e9d3, 0.2, 0.1),
      opal = k.glow(0xfff1d2);
    const L = 76, ZC = 12 - L / 2, H = 16;
    k.box(30, 0.4, L + 4, 0, -0.2, ZC, oak);
    for (const s of [-1, 1]) {
      k.box(1.2, H, L + 4, s * 12.6, H / 2, ZC, plaster);
      // two tiers of bookcases with a gallery rail between
      for (let z = 10; z > ZC - L / 2; z -= 6.4) {
        for (const tier of [0, 1]) {
          const y0 = tier ? 5.6 : 0.3;
          if (tier === 0 && Math.abs((z - 3.2 - 2) % 6.4) < 0.1) { /* space for the framed works */ }
          for (let j = 0; j < 4; j++) k.box(0.5, 0.08, 6, s * 11.75, y0 + 0.4 + j * 1.05, z - 3.2, oakDark);
          for (let j = 0; j < 4; j++) k.box(0.3, 0.9, 5.7, s * 11.85, y0 + 0.88 + j * 1.05, z - 3.2, j % 2 ? books : books2);
          k.box(0.7, 4.6, 0.3, s * 11.7, y0 + 2.3, z, oakDark);
        }
        k.box(0.6, 0.12, 6.4, s * 11.5, 5.3, z - 3.2, oakDark);
        k.rail(s * 11.15, z - 3.2, 6.4, bronze, 0.9, 'z', 0.8);
        k.arch(3.8, 5, 0.3, s * 11.95, 10.4, z - 3.2, plaster, false, 0.62).rotation.y = s > 0 ? -PI / 2 : PI / 2;
        k.box(0.06, 4.2, 3.4, s * 11.9, 12.6, z - 3.2, glass);
        for (let dz = -1.2; dz <= 1.2; dz += 0.8) k.box(0.1, 4.2, 0.06, s * 11.88, 12.6, z - 3.2 + dz, bronze);
      }
      k.moulding([[0, 0], [0.8, 0], [0.85, 0.2], [0.6, 0.4], [0.7, 0.6], [0.3, 0.85], [0, 1]], L + 4, s * 12 - s * 0.02, H - 1.2, ZC, gold, s > 0 ? PI : 0);
    }
    // the coffered ceiling: gilt frames around painted panels, three carry works from the census
    k.box(30, 0.6, L + 4, 0, H + 0.3, ZC, plaster);
    const mounts: Mount[] = corridorMounts({ pairs: 10, x: 11.4, z0: 6.8, pitch: 6.4, y: 3.0, width: 4.4, height: 2.6, inset: 5, style: 'gilt', wash: false });
    for (let x = -8; x <= 8; x += 8) for (let z = 8; z > ZC - L / 2; z -= 8) {
      k.rounded(7.4, 0.4, 7.4, x, H - 0.2, z - 4, gold, 0.06);
      k.box(6.6, 0.1, 6.6, x, H - 0.35, z - 4, k.pbr('skyPanel', X.plaster(0xbfd3e6, 14), 0.3));
      k.torus(0.45, 0.05, x, H - 0.45, z - 4, gold, 16).rotation.x = PI / 2;
    }
    for (const z of [-4, -28, -52]) mounts.push({ position: v(0, H - 0.44, z), rotation: 0, tilt: PI / 2, target: v(0, 3, z + 5), lookAt: v(0, H - 0.5, z), width: 6.2, height: 3.6, style: 'gilt', wash: false });
    // tables, lamps, chairs
    for (const s of [-1, 1]) for (let z = 4; z > ZC - L / 2 + 4; z -= 7) {
      const x = s * 5.2;
      k.rounded(3.2, 0.14, 5.2, x, 1.05, z, oakDark);
      for (const dx of [-1.3, 1.3]) for (const dz of [-2.3, 2.3]) k.box(0.14, 1.0, 0.14, x + dx, 0.5, z + dz, oakDark);
      k.box(0.3, 0.6, 5.2, x, 1.4, z, oakDark);
      for (const dz of [-1.7, 0, 1.7]) {
        k.lathe([[0.22, 0], [0.22, 0.06], [0.05, 0.1], [0.05, 0.6], [0.3, 0.64]], x, 1.7, z + dz, bronze, 12);
        k.rounded(0.72, 0.22, 0.44, x, 2.42, z + dz, opal, 0.05);
        k.point(x, 2.2, z + dz, 0xffe0a8, 5, 4);
      }
      for (const dx of [-2.1, 2.1]) for (const dz of [-1.6, 0, 1.6]) { k.box(0.5, 0.06, 0.5, x + dx, 0.6, z + dz, oakDark); k.box(0.06, 1.0, 0.5, x + dx + (dx > 0 ? 0.22 : -0.22), 1.0, z + dz, oakDark); for (const lx of [-0.2, 0.2]) for (const lz of [-0.2, 0.2]) k.box(0.05, 0.6, 0.05, x + dx + lx, 0.3, z + dz + lz, oakDark); }
      k.block(x - 2.6, x + 2.6, z - 2.9, z + 2.9);
    }
    for (const z of [0, -24, -48]) k.point(0, 11, z, 0xffe8c8, 30, 24);
    // the delivery desk and the far wall, the card catalogue at the entrance
    const ez = ZC - L / 2 - 1;
    k.box(30, H, 1.2, 0, H / 2, ez, plaster);
    k.box(30, H, 1.2, 0, H / 2, 14.5, plaster);
    k.rounded(12, 1.3, 2.6, 0, 0.65, ez + 3.4, oakDark, 0.05);
    k.rounded(12.4, 0.12, 3, 0, 1.36, ez + 3.4, oakDark);
    k.keepOut.push({ x: 0, z: ez + 3.4, r: 6.8 });
    k.sign('ROSE MAIN READING ROOM', 9, 0.8, 0, 9, ez + 0.65, '#6b5334', '#f4e6c8', 90, 0, { border: true });
    k.censusWall({ x: 0, y: 5.6, z: ez + 0.65, rotY: 0, cols: 24, rows: 4, tile: 0.62, gap: 0.05, start: ctx.wallStart(4200, 96), pieces: ctx.all, backing: oakDark });
    k.censusWall({ x: 0, y: 3.8, z: 13.85, rotY: PI, cols: 28, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(4300, 112), pieces: ctx.all, backing: oakDark });
    for (const x of [-9.4, 9.4]) mounts.push({ position: v(x, 3.4, ez + 0.65), rotation: 0, target: v(x * 0.8, 3, ez + 8), width: 4.6, height: 2.7, style: 'gilt', wash: false });
    return { mounts, spawn: v(0, 3, 11), look: v(0, 5, -30), eye: 3, bounds: [-10.4, 10.4, ez + 2, 12.5], style: 'gilt' };
  },
};

/* ---------------- 16 THE APOLLO ---------------- */
export const apollo: RoomDef = {
  id: 'apollo',
  daylit: false,
  name: 'After the applause',
  area: 'THE APOLLO',
  mood: 'From the stage',
  color: '#dc8c86',
  description: 'A velvet house, gilt boxes and balconies, a lit stage carrying three works the size of a curtain.',
  signatures: 'The proscenium arch with its gilt frame, curved balcony fronts, red velvet seats and drapes, footlights and the marquee lettering.',
  build(k, ctx) {
    k.sky({ top: 0x1a1016, horizon: 0x2c1a22, ground: 0x110a0e, fog: 0.008, env: 0.4 });
    k.hemi(0xffd4c0, 0x1a0a0e, 0.45);
    const velvet = k.pbr('velvet', X.velvet(0x7a1f2b), 0.6, { roughness: 1 }),
      velvetD = k.pbr('velvetD', X.velvet(0x4d1219), 0.6, { roughness: 1 }),
      carpet = k.pbr('carpet', X.carpet(0x3b1a22, 0xc79a4a), 0.4, { roughness: 1 }),
      gold = k.pbr('goldA', X.gilt(0xd2a94e), 2, { metalness: 0.85, roughness: 0.3 }),
      plaster = k.pbr('plasterA', X.plaster(0xd8c0a6, 15), 0.4, { roughness: 0.8 }),
      stageWood = k.pbr('stage', X.planks(0x3a2a1e, 10, 17), 0.6, { roughness: 0.6 }),
      dark = k.flat(0x14100f, 0.3, 0.7),
      warm = k.glow(0xffd9a0);
    const L = 62, ZC = 12 - L / 2, SZ = ZC - L / 2;
    k.box(30, 0.4, L + 4, 0, -0.2, ZC, carpet);
    for (const s of [-1, 1]) {
      k.box(1.2, 20, L + 4, s * 12.6, 10, ZC, plaster);
      // side boxes in gilt with velvet drapes, the framed works between them
      for (let z = 6; z > SZ + 8; z -= 6.4) {
        k.rounded(1.4, 0.4, 3.6, s * 11.4, 7.2, z - 3.2, gold, 0.1);
        k.box(1.2, 1.1, 3.6, s * 11.5, 7.9, z - 3.2, velvetD);
        k.moulding([[0, 0], [0.3, 0], [0.3, 0.12], [0.15, 0.2], [0, 0.2]], 3.6, s * 10.7 - s * 0.15, 8.4, z - 3.2, gold, s > 0 ? PI : 0);
        for (const dz of [-1.6, 1.6]) { const dr = k.mesh(new T.CylinderGeometry(0.45, 0.35, 5, 10, 1, true, 0, PI), velvet, s * 11.6, 11.5, z - 3.2 + dz); dr.rotation.y = s > 0 ? PI / 2 : -PI / 2; }
        k.column(s * 11.6, 0.2, z, 7, 0.28, plaster, true, gold);
        k.point(s * 10.8, 8.8, z - 3.2, 0xffc890, 8, 8);
      }
    }
    // seats in raked rows, split by the aisles
    for (let row = 0; row < 14; row++) {
      const z = 2 - row * 3.0, y = row * 0.16;
      for (let x = -9.6; x <= 9.6; x += 1.2) {
        if (Math.abs(x) < 2.1) continue;
        k.rounded(0.95, 0.9, 0.7, x, y + 0.9, z, velvet, 0.08);
        k.rounded(0.95, 0.5, 0.9, x, y + 0.5, z + 0.3, velvetD, 0.06);
        k.box(0.08, 0.5, 0.8, x - 0.5, y + 0.3, z + 0.2, gold);
      }
      k.box(24, 0.16, 3, 0, y - 0.08, z - 1.5, carpet);
    }
    k.block(-10.4, -2.0, SZ + 4, 4);
    k.block(2.0, 10.4, SZ + 4, 4);
    // the proscenium, curtains, footlights, the stage and its three works
    k.box(30, 3, 3, 0, 1.5, SZ + 2, stageWood);
    k.box(24, 30, 1.6, 0, 15, SZ - 6, dark);
    k.arch(20, 14, 1.6, 0, 0, SZ, gold, false, 0.75);
    k.moulding([[0, 0], [1.2, 0], [1.3, 0.3], [0.9, 0.6], [1.0, 0.9], [0.4, 1.2], [0, 1.3]], 28, 0, 15.6, SZ + 0.9, gold, 0);
    for (const s of [-1, 1]) for (let j = 0; j < 12; j++) { const x = s * (9.6 + j * 0.16); const dr = k.mesh(new T.CylinderGeometry(0.34, 0.28, 13, 8, 1, true), velvet, x, 8.4, SZ + 0.6); dr.rotation.y = 0; }
    for (let j = 0; j < 24; j++) { const x = -9.2 + j * 0.8; const sw = k.mesh(new T.CylinderGeometry(0.5, 0.42, 3.4, 8, 1, true), velvet, x, 13.2 - Math.abs(x) * 0.08, SZ + 0.7); sw.rotation.z = 0.15 * Math.sign(x); }
    for (let x = -10; x <= 10; x += 1.4) { k.sphere(0.12, x, 3.15, SZ + 3.3, warm, 6); }
    k.point(0, 6, SZ + 1, 0xffd0a0, 60, 30);
    k.spot(-8, 14, SZ + 16, -6, 6, SZ - 3, 0xff9a7a, 260, 0.45, 0.6, 50);
    k.spot(8, 14, SZ + 16, 6, 6, SZ - 3, 0x9ab6ff, 260, 0.45, 0.6, 50);
    k.spot(0, 16, SZ + 20, 0, 6, SZ - 3, 0xfff0d0, 320, 0.5, 0.5, 50);
    k.keepOut.push({ x: 0, z: SZ + 3.5, r: 1 });
    // the ceiling dome and chandelier, the marquee letters, the wall of fame in the lobby
    k.mesh(new T.SphereGeometry(11, 32, 16, 0, PI * 2, 0, PI / 2), plaster, 0, 19.5, -18).rotation.x = PI;
    k.torus(11, 0.3, 0, 19.6, -18, gold, 64).rotation.x = PI / 2;
    k.beam(v(0, 19.5, -18), v(0, 14.5, -18), 0.05, gold, 5);
    for (const [r, y] of [[1.6, 14.4], [1.1, 13.6], [0.6, 12.9]]) { k.torus(r, 0.05, 0, y, -18, gold, 24).rotation.x = PI / 2; for (let j = 0; j < 12; j++) { const a = (j * PI) / 6; k.sphere(0.12, Math.cos(a) * r, y - 0.15, -18 + Math.sin(a) * r, warm, 6); } }
    k.point(0, 13.2, -18, 0xffdfb0, 60, 30);
    k.sign('APOLLO', 8, 1.6, 0, 17.6, SZ + 1.05, '#5e2436', '#f2dca2', 190, 0, { border: true });
    k.box(30, 20, 1.2, 0, 10, 14.6, plaster);
    k.box(30, 20, 1.2, 0, 10, SZ - 8, dark);
    k.censusWall({ x: 0, y: 4.2, z: 13.95, rotY: PI, cols: 28, rows: 5, tile: 0.6, gap: 0.05, start: ctx.wallStart(900, 140), pieces: ctx.all, backing: gold });
    k.sign('WALL OF FAME  ·  AMATEUR NIGHT', 8, 0.7, 0, 8.4, 13.9, '#5e2436', '#f2dca2', 90, PI, { border: true });
    const mounts: Mount[] = corridorMounts({ pairs: 8, x: 11.9, z0: 2.8, pitch: 6.4, y: 3.6, width: 5.4, height: 3.1, inset: 3.2, style: 'gilt', wash: true });
    for (const m of mounts) m.target.x = Math.sign(m.position.x) * 9.2;
    for (const x of [-7.6, 0, 7.6]) mounts.push({ position: v(x, 8.2, SZ - 5.1), rotation: 0, target: v(x * 0.3, 3, SZ + 12), width: 7.2, height: 9.6, style: 'gilt', wash: false });
    return { mounts, spawn: v(0, 3, 10), look: v(0, 6, -40), eye: 3, bounds: [-10.4, 10.4, SZ + 4, 12.5], style: 'gilt' };
  },
};
