/* Rooms 03 to 06: Met roof garden, Brooklyn waterfront, Times Square, Staten Island Ferry. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Kit } from '../kit';
import { corridorMounts } from './types';
import type { RoomDef } from './types';
import { billboard } from './a';

const PI = Math.PI;

/* Liberty as a harbour silhouette: pedestal, lathed robe, crown and torch.
   A procedural interpretation, never presented as the statue itself. */
export function liberty(k: Kit, x: number, y: number, z: number, s = 1) {
  const copper = k.pbr('patina', X.patina(), 0.4, { roughness: 0.55, metalness: 0.25 }),
    stone = k.pbr('pedestal', X.ashlar(0x9a9488, 6, 3), 0.25),
    warm = k.glow(0xffe2a0);
  k.box(9 * s, 1.2 * s, 9 * s, x, y + 0.6 * s, z, stone);
  k.box(5 * s, 5 * s, 5 * s, x, y + 3.6 * s, z, stone);
  k.box(5.6 * s, 0.6 * s, 5.6 * s, x, y + 6.3 * s, z, stone);
  k.box(4 * s, 1.4 * s, 4 * s, x, y + 7.3 * s, z, stone);
  const robe = [[1.7, 0], [1.6, 0.6], [1.35, 2.2], [1.15, 3.6], [1.0, 5.2], [0.8, 6.4], [0.62, 7.2]].map((p) => [p[0] * s, p[1] * s]);
  k.lathe(robe, x, y + 8 * s, z, copper, 18);
  for (let kk = 0; kk < 16; kk++) {
    const t = (kk * PI) / 8, pts = [];
    for (let j = 0; j <= 10; j++) {
      const u = j / 10, r = (1.7 - u * 1.05 + 0.07 * Math.sin(u * 8 + kk)) * s;
      pts.push(v(x + Math.cos(t) * r, y + (8 + u * 6.6) * s, z + Math.sin(t) * r));
    }
    k.curve(pts, 0.04 * s, copper, 12);
  }
  k.sphere(0.72 * s, x, y + 15.9 * s, z, copper, 14);
  for (let kk = 0; kk < 7; kk++) {
    const t = (kk / 6) * PI;
    k.mesh(new T.ConeGeometry(0.1 * s, 0.9 * s, 6), copper, x + Math.cos(t) * 0.9 * s, y + 16.4 * s + Math.sin(t) * 0.6 * s, z);
  }
  k.beam(v(x + 0.7 * s, y + 13.8 * s, z), v(x + 2.2 * s, y + 18.4 * s, z), 0.3 * s, copper, 8);
  k.cyl(0.22 * s, 1.1 * s, x + 2.3 * s, y + 18.9 * s, z, k.flat(0xc9a44a, 0.8, 0.3), 0.3 * s, 8);
  k.sphere(0.4 * s, x + 2.3 * s, y + 19.6 * s, z, warm, 10);
  k.point(x + 2.3 * s, y + 19.6 * s, z, 0xffd27a, 60, 40);
  k.box(0.9 * s, 1.8 * s, 0.35 * s, x - 1.1 * s, y + 12.4 * s, z + 0.6 * s, copper);
}

/* ---------------- 03 THE MET ROOF GARDEN ---------------- */
export const met: RoomDef = {
  id: 'met',
  name: 'Above the park',
  area: 'THE MET ROOF GARDEN',
  mood: 'Golden hour',
  color: '#dabb96',
  description: 'A limestone terrace over the treetops, sculpture commissions in enamel, the skyline turning gold.',
  signatures: 'Limestone parapets over the park canopy, freestanding sculpture on the terrace, the midtown skyline as backdrop.',
  build(k, ctx) {
    k.sky({ top: 0x5f7fae, horizon: 0xf2bb8c, ground: 0x4c4640, fog: 0.0022, sun: { az: 4.9, el: 0.12, color: 0xffc27a, size: 26 }, haze: 0.35, env: 0.85 });
    k.hemi(0xffe1bd, 0x3d4a3a, 0.7);
    k.sun(0xffcf94, 2.6, -60, 22, -10, true, 70);
    const lime = k.pbr('limestone', X.ashlar(0xc3b8a2, 3, 3), 0.22),
      pav = k.pbr('terrace', X.pavers(0xb9b1a0, 4), 0.28, { roughness: 0.7 }),
      bronze = k.flat(0x5c4a2c, 0.9, 0.35),
      iron = k.flat(0x22262a, 0.7, 0.45),
      teak = k.pbr('teak', X.planks(0x8a6640, 4, 7), 1.2, { roughness: 0.6 }),
      hedge = k.flat(0x3f5f38, 0, 0.95),
      soil = k.flat(0x3a2f26, 0, 1);
    const L = 76, ZC = 12 - L / 2;
    k.box(28, 0.6, L, 0, -0.3, ZC, pav);
    for (const s of [-1, 1]) {
      k.box(0.6, 1.25, L, s * 13.7, 0.62, ZC, lime);
      k.moulding([[0, 0], [0.5, 0], [0.55, 0.1], [0.42, 0.18], [0.42, 0.24], [0, 0.24]], L, s * 13.7 - s * 0.05, 1.25, ZC, lime, s > 0 ? PI : 0);
      for (let z = 10; z > ZC - L / 2; z -= 5) k.box(0.9, 1.45, 0.9, s * 13.7, 0.72, z, lime);
    }
    k.box(28, 1.25, 0.6, 0, 0.62, ZC - L / 2, lime);
    // the terrace screens carrying the framed works, each on a limestone base
    for (let i = 0; i < 20; i++) {
      const s = i % 2 ? 1 : -1, z = 2 - Math.floor(i / 2) * 6.2;
      k.box(0.6, 4.6, 6.8, s * 9.6, 2.5, z, lime);
      k.box(1.1, 0.35, 7.2, s * 9.6, 0.17, z, lime);
      k.moulding([[0, 0], [0.5, 0], [0.5, 0.14], [0.36, 0.22], [0, 0.22]], 7.2, s * 9.6 - s * 0.3, 4.8, z, lime, s > 0 ? PI : 0);
    }
    k.box(14, 6, 0.8, 0, 3, ZC - L / 2 + 5, lime);
    // enamel roof commissions on plinths down the centre
    k.plinth(0, -14, 5, 0.9, 5, lime);
    k.prop('water_tower', 0, 0.98, -14, { height: 7.5 });
    k.plinth(0, -36, 4.2, 0.9, 4.2, lime);
    k.prop('tree', 0, 0.98, -36, { height: 6.8 });
    k.plinth(0, -52, 3, 0.9, 3, lime);
    k.prop('hydrant', 0, 0.98, -52, { height: 2.6 });
    k.plinth(0, -26, 3.2, 0.7, 3.2, lime);
    const knot = k.mesh(new T.TorusKnotGeometry(1.1, 0.16, 120, 14), bronze, 0, 2.5, -26);
    /* eggs: real details of the Iris and B. Gerald Cantor Roof Garden */
    k.egg(knot, { id: 'met-one-artist-a-summer', title: 'One artist a summer', year: '1998', text: 'Every summer since 1998 the roof garden has hosted a single artist exhibition. Ellsworth Kelly opened the series in 1998, followed by Magdalena Abakanowicz, David Smith and Joel Shapiro, and later Roy Lichtenstein in 2003, Sol LeWitt in 2005, Jeff Koons in 2008 and Huma Bhabha in 2018.', clue: 'Walk round the bronze knot on its plinth in the middle of the terrace.', source: { name: 'The Met Fifth Avenue, Wikipedia', url: 'https://en.wikipedia.org/wiki/The_Met_Fifth_Avenue' } }, { r: 1.6 });
    k.egg(v(0, 4.2, -36), { id: 'met-big-bambu', title: 'A climbable bamboo forest', year: '2010', text: 'From April to October 2010 the roof held Big Bambu by Doug and Mike Starn, built from 3,200 bamboo poles to about 100 feet long, 50 feet wide and 50 feet high. Visitors could climb through it, as long as they wore rubber soled, closed toe shoes, and the artists built it with a team of twenty rock climbers.', clue: 'Look up into the tree on its plinth halfway down the terrace.', source: { name: 'Big Bambu (artwork), Wikipedia', url: 'https://en.wikipedia.org/wiki/Big_Bamb%C3%BA_(artwork)' } }, { r: 1.8 });
    k.egg(v(0, 5, -14), { id: 'met-psychobarn', title: 'The Psycho house on the roof', year: '2016', text: 'In 2016 Cornelia Parker became the first woman commissioned to make a new work for the Roof Garden. Transitional Object (PsychoBarn) was a scaled down facade of the house from Hitchcock\'s Psycho, built from a salvaged red barn, a nod to Edward Hopper\'s House by the Railroad, which Hitchcock used as the model for that house.', clue: 'Stand under the water tower on its plinth: another rooftop building once stood on this roof.', source: { name: 'Cornelia Parker, Wikipedia', url: 'https://en.wikipedia.org/wiki/Transitional_Object_(PsychoBarn)' } }, { r: 1.8 });
    // hedges, planters, tables, benches
    for (const s of [-1, 1])
      for (let z = 6; z > ZC - L / 2 + 8; z -= 12.4) {
        k.box(1.6, 0.9, 4.4, s * 12.4, 0.45, z, lime);
        k.box(1.4, 0.1, 4.2, s * 12.4, 0.92, z, soil);
        for (let j = -1.4; j <= 1.4; j += 0.7) k.sphere(0.62, s * 12.4, 1.45, z + j, hedge, 10);
        k.prop('lantern', s * 12.4, 0.95, z + 2.6, { height: 0.9 });
      }
    for (const z of [-6, -26, -46]) for (const s of [-1, 1]) {
      const x = s * 5.6;
      k.lathe([[0.36, 0], [0.36, 0.08], [0.09, 0.12], [0.06, 1.0], [0.8, 1.06], [0.8, 1.1]], x, 0, z, iron, 20);
      for (const dz of [-1.4, 1.4]) {
        k.rounded(0.62, 0.05, 0.62, x, 0.72, z + dz, teak);
        for (const dx of [-0.22, 0.22]) k.beam(v(x + dx, 0.1, z + dz - 0.22), v(x + dx, 1.4, z + dz + 0.26), 0.025, iron, 5);
        k.rounded(0.64, 0.36, 0.05, x, 1.16, z + dz + 0.26, teak);
      }
      k.keepOut.push({ x, z, r: 1.7 });
    }
    for (const z of [-16, -40]) { k.bench(-6.4, z, 0, teak, iron, 2.4); k.bench(6.4, z, PI, teak, iron, 2.4); }
    // the bar pergola at the entrance carries the census ledger
    for (const x of [-9, -3, 3, 9]) k.box(0.3, 4.2, 0.3, x, 2.1, 12, iron);
    k.box(20, 0.2, 3.2, 0, 4.3, 11, iron);
    for (let x = -9.5; x <= 9.5; x += 0.7) k.box(0.12, 0.3, 3.2, x, 4.55, 11, teak);
    k.censusWall({ x: 0, y: 2.3, z: 12.6, rotY: PI, cols: 30, rows: 3, tile: 0.62, gap: 0.05, start: ctx.wallStart(4500, 90), pieces: ctx.all, backing: lime });
    k.egg(v(0, 3.8, 10.6), { id: 'met-roof-1987', title: 'The best view in Manhattan', year: '1987', text: 'The Iris and B. Gerald Cantor Roof Garden opened to the public on August 1, 1987, on the roof near the southwestern corner of the museum. Its views of Central Park and the Manhattan skyline have been called the best in Manhattan, and on Friday and Saturday evenings the café and bar drew elevator lines.', clue: 'Stand under the bar pergola at the entrance.', source: { name: 'The Met Fifth Avenue, Wikipedia', url: 'https://en.wikipedia.org/wiki/The_Met_Fifth_Avenue' } }, { r: 1.6 });
    k.egg(v(0, 5.4, ZC - L / 2 + 5.5), { id: 'met-roof-closed', title: 'Closed for five years', year: '2025', text: 'In 2025 the Met announced that the roof garden would close for five years starting that October. The museum meanwhile has a new Tang Wing for Modern Art set for completion in 2030.', clue: 'Look at the top of the limestone wall at the far end of the terrace.', source: { name: 'The Met Fifth Avenue, Wikipedia', url: 'https://en.wikipedia.org/wiki/The_Met_Fifth_Avenue' } }, { r: 1.8 });
    // the park below and the city beyond
    k.box(300, 0.4, 200, 0, -7, -140, k.pbr('lawn', X.grass(0x4a6a3b), 0.15));
    const canopy: T.Matrix4[] = [];
    const rnd = X.mulberry(5);
    for (let i = 0; i < 260; i++) {
      const x = (rnd() - 0.5) * 220, z = -68 - rnd() * 60, s = 2.4 + rnd() * 3.4;
      canopy.push(new T.Matrix4().compose(v(x, -6.5 + s * 0.7, z), new T.Quaternion().setFromEuler(new T.Euler(rnd(), rnd(), rnd())), v(s, s * 0.8, s)));
    }
    k.instances(new T.IcosahedronGeometry(1, 1), k.flat(0x3d5c34, 0, 1), canopy);
    k.instances(new T.CylinderGeometry(0.2, 0.3, 4, 6), k.flat(0x4a3a2c, 0, 1), canopy.map((m) => { const p = new T.Vector3().setFromMatrixPosition(m); return new T.Matrix4().makeTranslation(p.x, -5, p.z); }));
    k.skyline({ z: -150, count: 34, spacing: 6, scale: 2.2, base: -8, seed: 8, lit: 0.18, glow: 0.35, tint: 0x8a8576, warm: true });
    k.skyline({ z: -200, count: 30, spacing: 8, scale: 2.8, base: -8, seed: 9, lit: 0.12, glow: 0.25, tint: 0x9c968a, rows: 1 });
    const mounts = corridorMounts({ pairs: 10, x: 9.25, z0: 2, pitch: 6.2, y: 3.0, width: 5.4, height: 3.1, inset: 4.4, style: 'gilt' });
    mounts.push({ position: v(-3.5, 3.1, ZC - L / 2 + 5.45), rotation: 0, target: v(-3.5, 3, ZC - L / 2 + 11), width: 5.4, height: 3.1, style: 'gilt' });
    mounts.push({ position: v(3.5, 3.1, ZC - L / 2 + 5.45), rotation: 0, target: v(3.5, 3, ZC - L / 2 + 11), width: 5.4, height: 3.1, style: 'gilt' });
    return { mounts, spawn: v(0, 3, 8.5), look: v(0, 3.4, -30), eye: 3, bounds: [-8.6, 8.6, ZC - L / 2 + 7.5, 10], style: 'gilt' };
  },
};

/* ---------------- 04 BROOKLYN WATERFRONT ---------------- */
export const brooklyn: RoomDef = {
  id: 'brooklyn',
  name: 'Across the river',
  area: 'BROOKLYN WATERFRONT',
  mood: 'Blue hour',
  color: '#91bacf',
  description: 'A granite promenade under the bridge, weathered steel screens on the river side, Manhattan lit across the water.',
  signatures: 'Gothic pointed arches in the towers, sagging main cables with vertical suspenders and diagonal stays, the deck truss.',
  build(k, ctx) {
    k.sky({ top: 0x0f1f3d, horizon: 0x4d6f9c, ground: 0x111a26, fog: 0.0035, stars: 300, sun: { az: 0.6, el: 0.5, color: 0xd8e6ff, size: 9 }, env: 0.6 });
    k.hemi(0xa9c4ee, 0x1c2531, 0.7);
    k.sun(0xcfe0ff, 1.4, 20, 40, 30, true, 80);
    const granite = k.pbr('quay', X.pavers(0x7b7d7c, 6), 0.3),
      masonry = k.pbr('masonry', X.ashlar(0x8f8674, 7, 4), 0.14),
      corten = k.pbr('corten', X.steel(0x6b3f2a, false, 3), 0.4, { metalness: 0.4, roughness: 0.7 }),
      iron = k.flat(0x1d2327, 0.7, 0.45),
      steelW = k.flat(0xc9ced2, 0.6, 0.4),
      brick = k.pbr('warehouse', X.brick(0x5f3d33, 6), 0.26),
      timber = k.pbr('pier', X.planks(0x4d3b2d, 5, 8), 0.8),
      glassDark = k.glass(0x8fb6c9, 0.3, 0.1);
    const L = 78, ZC = 12 - L / 2;
    k.water({ y: -1.6, color: 0x1d3a55, w: 420, d: 360, z: -90, amp: 1.2 });
    k.box(28, 1.6, L, 0, -0.8, ZC, granite);
    k.box(0.5, 2.6, L, -14.2, -1.3, ZC, masonry);
    k.rail(-13.6, ZC, L, iron, 1.15, 'z', 1.2);
    for (let z = 10; z > ZC - L / 2; z -= 4) k.cyl(0.32, 3.4, -15.2, -1.6, z, timber, 0.32, 10);
    // DUMBO warehouses on the land side, framed works as murals on the brick
    for (let b = 0; b < 8; b++) {
      const z = 6 - b * 9, h = 14 + (b % 3) * 4;
      k.box(6, h, 8.8, 15, h / 2, z, brick);
      k.box(6.3, 0.5, 9, 15, h, z, masonry);
      for (let y = 7; y < h - 1.5; y += 3) for (const dz of [-3, 0, 3]) {
        k.arch(1.4, 2.2, 0.3, 11.95, y - 1.1, z + dz, masonry, false, 0.62).rotation.y = -PI / 2;
        k.box(0.05, 1.8, 1.2, 12.0, y, z + dz, (b + y) % 2 ? k.glow(0xffd9a0) : glassDark);
      }
      if (b % 2 === 0) k.prop('fire_escape', 10.95, 6.6, z + 2.8, { height: 3.2, rotY: -PI / 2 });
    }
    // river side screens in weathered steel
    for (let i = 0; i < 10; i++) {
      const z = 2 - i * 6.6;
      k.box(0.35, 4.4, 6.6, -9.4, 2.4, z, corten);
      k.box(1.0, 0.3, 7, -9.4, 0.15, z, granite);
    }
    // pier shed at the end with the census wall, lamps, bollards, chains
    k.box(20, 9, 8, 0, 4.5, ZC - L / 2 - 1, corten);
    k.box(20.6, 0.4, 8.6, 0, 9.2, ZC - L / 2 - 1, iron);
    k.mesh(new T.CylinderGeometry(4.2, 4.2, 20.8, 16, 1, false, 0, PI), iron, 0, 9.2, ZC - L / 2 - 1).rotation.set(0, 0, PI / 2);
    k.sign('BROOKLYN  ·  EAST RIVER  ·  PIER', 9, 0.8, 0, 8.3, ZC - L / 2 + 3.05, '#16283a', '#e8eff7', 80, 0, { border: true });
    k.censusWall({ x: 0, y: 3.0, z: ZC - L / 2 + 3.05, rotY: 0, cols: 24, rows: 4, tile: 0.62, gap: 0.05, start: ctx.wallStart(2600, 96), pieces: ctx.all, backing: iron });
    for (let z = 8; z > ZC - L / 2 + 4; z -= 6) {
      k.lathe([[0.22, 0], [0.22, 0.75], [0.28, 0.85], [0.28, 0.95]], -12.9, 0, z, iron, 14);
      k.curve([v(-12.9, 0.8, z), v(-12.9, 0.55, z - 3), v(-12.9, 0.8, z - 6)], 0.035, iron, 16);
    }
    for (const z of [6, -14, -34, -54]) k.prop('lamppost', 7.4, 0, z, { height: 6.4, keepOut: 0.45 });
    for (const z of [6, -14, -34, -54]) k.point(7.4, 6, z, 0xffd0a0, 26, 15);
    k.prop('buoy', -12.2, 0, -2, { height: 1.9, keepOut: 0.8 });
    k.egg(v(-6.5, 0.4, 4), { id: 'brooklyn-granite-prospect', title: 'Steps from another bridge', text: 'The Granite Prospect, the stepped seating at Pier 1 of Brooklyn Bridge Park, is made of over 300 pieces of granite, about 2,000 linear feet of it, salvaged from the reconstruction of the Roosevelt Island Bridge. The park now holds many of its free events on those steps.', clue: 'Look down at the granite underfoot on the river side of the promenade.', source: { name: 'Granite Prospect, Brooklyn Bridge Park', url: 'https://www.brooklynbridgepark.org/places-to-see/granite-prospect/' } }, { r: 1.6 });
    k.egg(v(-10.4, 1.2, ZC - L / 2 + 4.6), { id: 'brooklyn-whitman-rail', title: 'A poem on the railing', year: '1856', text: 'Walt Whitman\'s Crossing Brooklyn Ferry first appeared in the 1856 edition of Leaves of Grass as Sun-Down Poem and took its present title in 1860. An excerpt is inscribed at Fulton Ferry Landing, near where Whitman would have stepped off the boat from Manhattan.', clue: 'Go to the end of the promenade, where the steel screens stop, and look at the river rail.', source: { name: 'Crossing Brooklyn Ferry, Wikipedia', url: 'https://en.wikipedia.org/wiki/Crossing_Brooklyn_Ferry' } }, { r: 1.6 });
    k.prop('life_ring', -13.55, 1.2, -20, { height: 1.0, rotY: PI / 2 });
    k.prop('life_ring', -13.55, 1.2, -48, { height: 1.0, rotY: PI / 2 });
    k.prop('lobster_trap', 8.6, 0, -10, { height: 0.9, rotY: 0.4 });
    k.prop('cleat', -12.4, 0, -28, { height: 0.5 });
    k.prop('bell', 5.2, 1.5, ZC - L / 2 + 5, { height: 1.1 });
    k.box(0.3, 1.5, 0.3, 5.2, 0.75, ZC - L / 2 + 5, iron);
    for (const z of [-8, -28, -46]) k.bench(4.4, z, PI, k.pbr('benchB', X.planks(0x5d4939, 3, 9), 1.2), iron, 2.6);
    // the bridge across the view
    const bx = 30, bz = -82;
    for (const x of [-bx, bx]) {
      for (const dz of [-2.2, 2.2]) k.arch(4.2, 20, 3.6, x, 9, bz + dz, masonry, true, 0.7);
      k.box(14, 0.9, 6.4, x, 33.5, bz, masonry);
      for (let kk = 0; kk < 4; kk++) k.box(13.6 - kk * 0.5, 0.4, 6.6 - kk * 0.25, x, 34 + kk * 0.4, bz, masonry);
      for (const dx of [-6, 0, 6]) k.box(1.4, 25, 6, x + dx, 21, bz, masonry);
      k.box(15, 10, 7, x, 4, bz, masonry);
    }
    for (const z of [bz - 2.5, bz + 2.5]) {
      const pts = [];
      for (let kk = 0; kk <= 120; kk++) {
        const x = -bx * 2 + kk, y = Math.abs(x) <= bx ? 12 + 20 * (x / bx) ** 2 : 32 - 20 * ((Math.abs(x) - bx) / bx);
        pts.push(v(x, y, z));
        if (kk % 2 === 0 && Math.abs(x) < bx * 2 - 2) k.beam(v(x, 9.5, z), v(x, y, z), 0.03, steelW, 5);
      }
      k.curve(pts, 0.12, steelW, 120);
      for (const tower of [-bx, bx]) for (let dx = -20; dx <= 20; dx += 2.5) k.beam(v(tower, 32, z), v(tower + dx, 9.5, z), 0.025, steelW, 4);
    }
    // the bridge has four main cables, not two: the inner pair between the roadways and the promenade
    for (const z of [bz - 0.9, bz + 0.9]) {
      const pts = [];
      for (let kk = 0; kk <= 120; kk += 2) {
        const x = -bx * 2 + kk, y = Math.abs(x) <= bx ? 12 + 20 * (x / bx) ** 2 : 32 - 20 * ((Math.abs(x) - bx) / bx);
        pts.push(v(x, y, z));
        if (kk % 4 === 0 && Math.abs(x) < bx * 2 - 2) k.beam(v(x, 9.5, z), v(x, y, z), 0.03, steelW, 5);
      }
      k.curve(pts, 0.12, steelW, 120);
    }
    k.box(128, 0.6, 7, 0, 9, bz, iron);
    /* eggs: the bridge across the view */
    k.egg(v(-15, 17.5, bz), { id: 'brooklyn-haigh-wire', title: 'The crooked wire', text: 'Each of the four main cables is 15.75 inches thick and holds 5,282 parallel galvanized steel wires. The contractor J. Lloyd Haigh supplied substandard wire: of eighty rings tested, only five met the standard, so 150 extra wires were added to each cable to make up for it.', clue: 'Follow the main cables as they sag between the towers.', source: { name: 'Brooklyn Bridge, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn_Bridge' } }, { r: 3 });
    k.egg(v(bx, 22, bz), { id: 'brooklyn-towers', title: 'Limestone, granite, cement', text: 'Each tower is built of limestone, granite and Rosendale cement and stands 278.25 feet above mean high water. Each holds a pair of Gothic Revival pointed arches that the roadways run through, and the main span between the two towers is 1,595.5 feet.', clue: 'Look at the pointed arches in the tower on the right.', source: { name: 'Brooklyn Bridge, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn_Bridge' } }, { r: 3 });
    k.egg(v(-bx, 22, bz), { id: 'brooklyn-opening-day', title: 'Opening day and the stampede', year: '1883', text: 'The New York and Brooklyn Bridge opened on May 24, 1883, and officially Emily Warren Roebling was the first to cross it. Six days later a woman fell on a stairway at the Brooklyn approach and set off a stampede that crushed at least twelve people to death.', clue: 'Look at the tower on the left, the Manhattan side.', source: { name: 'Brooklyn Bridge, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn_Bridge' } }, { r: 3 });
    k.egg(v(0, 10.2, bz), { id: 'brooklyn-jumbo', title: 'Twenty one elephants', year: '1884', text: 'On May 17, 1884, P. T. Barnum sent Jumbo at the head of a parade of 21 elephants over the Brooklyn Bridge. The march promoted his circus and helped quiet doubts about whether the bridge was stable.', clue: 'Look at the middle of the deck, halfway between the towers.', source: { name: 'Brooklyn Bridge, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn_Bridge' } }, { r: 3 });
    for (let x = -62; x < 62; x += 2.5) {
      k.beam(v(x, 8, bz - 3), v(x + 2.5, 9, bz - 3), 0.05, iron, 5);
      k.beam(v(x, 9, bz - 3), v(x + 2.5, 8, bz - 3), 0.05, iron, 5);
    }
    for (let x = -60; x <= 60; x += 6) { k.sphere(0.2, x, 10.4, bz, k.glow(0xfff0c8), 8); }
    k.skyline({ z: -140, count: 34, spacing: 6.5, scale: 2.2, base: -2, seed: 12, lit: 0.45, glow: 1.5, tint: 0x1f2a3a });
    k.skyline({ z: -185, count: 30, spacing: 8.5, scale: 3, base: -2, seed: 13, lit: 0.35, glow: 1.1, tint: 0x27303d, rows: 1 });
    const mounts = corridorMounts({ pairs: 10, x: 9.2, z0: 2, pitch: 6.6, y: 3.0, width: 5.4, height: 3.1, inset: 4.6, style: 'steel' });
    for (let i = 1; i < 20; i += 2) {
      mounts[i].position.x = 11.85;
      mounts[i].target.x = 6.6;
      mounts[i].position.y = 3.4;
      mounts[i].style = 'black';
    }
    for (const x of [-6.6, 6.6]) mounts.push({ position: v(x, 6.3, ZC - L / 2 + 3.05), rotation: 0, target: v(x, 3, ZC - L / 2 + 10.5), width: 5.4, height: 3.1, style: 'steel' });
    return { mounts, spawn: v(0, 3, 9), look: v(-2, 4, -40), eye: 3, bounds: [-8.4, 10.6, ZC - L / 2 + 5, 10.5], style: 'steel' };
  },
};

/* ---------------- 05 TIMES SQUARE ---------------- */
export const times: RoomDef = {
  id: 'times',
  daylit: false,
  name: 'Electric crossroads',
  area: 'TIMES SQUARE',
  mood: 'Midnight',
  color: '#e477bc',
  description: 'A canyon of lit billboards showing nothing but New Yorkers, the red steps and the ball at the end.',
  signatures: 'Stacked wraparound screens, the red TKTS staircase, One Times Square with its mast and ball.',
  build(k, ctx) {
    k.sky({ top: 0x070914, horizon: 0x1c1a33, ground: 0x0a0a12, fog: 0.007, haze: 0.2, env: 0.5 });
    k.hemi(0xa9b4ff, 0x2a1a2e, 0.55);
    k.sun(0xb9c8ff, 0.5, 0, 60, 10, false);
    const wet = k.pbr('wet', X.asphalt(0x1c2027), 0.11, { roughness: 0.3, metalness: 0.35 }),
      facade = k.pbr('facadeT', X.windows(21, 0.3, 0x1c2433, false), 0.12, { emissive: 0xffffff, emissiveIntensity: 0.8, roughness: 0.6, stretch: 0.42 }),
      steel = k.flat(0x2a3038, 0.8, 0.4),
      red = k.pbr('tkts', X.plaster(0xb02a45, 8), 0.5, { roughness: 0.35, metalness: 0.2 }),
      white = k.flat(0xe8e8e2, 0.1, 0.5),
      pale = k.pbr('plaza', X.concrete(0x5d6068, 9), 0.3, { roughness: 0.7 }),
      neon = [k.glow(0x00e5ff), k.glow(0xff2e63), k.glow(0x7c6bff), k.glow(0xffc857)];
    const L = 80, ZC = 12 - L / 2;
    k.box(30, 0.3, L + 20, 0, -0.15, ZC - 6, wet);
    for (const s of [-1, 1]) k.box(6, 0.28, L, s * 9, 0, ZC, pale);
    for (const z of [7, -20, -46]) for (let x = -5; x <= 5; x += 1.3) k.box(0.7, 0.014, 3, x, 0.012, z, white);
    // the canyon: every facade a stack of screens showing the census
    let bb = 0;
    for (const s of [-1, 1])
      for (let j = 0; j < 8; j++) {
        const z = 8 - j * 10, h = 26 + (j % 4) * 6;
        k.box(9, h, 9.6, s * 16.5, h / 2, z, facade);
        k.box(9.3, 0.4, 9.9, s * 16.5, h, z, steel);
        k.box(9.2, 6.2, 9.8, s * 16.6, 3.1, z, steel);
        for (let kk = 0; kk < 3; kk++) {
          const y = 9.5 + kk * 7.4;
          if (y + 3.4 > h) break;
          const rot = s > 0 ? -PI / 2 : PI / 2;
          billboard(k, ctx, bb++, 8.6, 5.6, s * 11.9, y, z, rot, steel);
          k.box(0.12, 6.4, 9.4, s * 11.97, y, z, neon[(j + kk) % 4]);
          k.box(0.14, 5.9, 9.0, s * 11.96, y, z, k.flat(0x0a0d12, 0.2, 0.6));
          k.point(s * 9.5, y, z, [0x53d8ef, 0xff477e, 0x6c68ff, 0xe1b752][(j + kk) % 4], 22, 12);
        }
      }
    // TKTS steps, the tower behind and the ball
    // 27 steps rising 16 feet (4.9 m) above the street, so each riser is about 0.18 m
    for (let kk = 0; kk < 27; kk++) {
      k.rounded(10, 0.18, 0.62, 0, 0.09 + kk * 0.18, ZC - L / 2 + 12 - kk * 0.6, red, 0.03);
      k.box(9.8, 0.03, 0.03, 0, 0.17 + kk * 0.18, ZC - L / 2 + 12.3 - kk * 0.6, k.glow(0xff9fb5));
    }
    k.box(10, 4.9, 1, 0, 2.45, ZC - L / 2 - 5, red);
    k.sign('tkts', 3.4, 1.2, 0, 1.7, ZC - L / 2 + 12.4, '#c02e40', '#ffffff', 150, 0);
    k.keepOut.push({ x: 0, z: ZC - L / 2 + 5, r: 9 });
    k.box(14, 40, 10, 0, 20, ZC - L / 2 - 12, facade);
    k.box(14.4, 0.6, 10.4, 0, 40, ZC - L / 2 - 12, steel);
    k.beam(v(0, 40, ZC - L / 2 - 12), v(0, 52, ZC - L / 2 - 12), 0.12, white, 8);
    k.mesh(new T.IcosahedronGeometry(1.3, 2), k.glow(0xfff6d0), 0, 49.5, ZC - L / 2 - 12);
    k.point(0, 49.5, ZC - L / 2 - 12, 0xffffff, 200, 60);
    k.egg(v(0, 49.5, ZC - L / 2 - 12), { id: 'times-the-ball', title: 'From 700 pounds to 12,300', year: '1907', text: 'The first ball dropped on December 31, 1907: iron and wood, lit by a hundred incandescent bulbs, weighing 700 pounds. The present ball is 12.5 feet across, weighs over 12,300 pounds and is covered in 5,280 Waterford Crystal panels, and it has stayed on top of One Times Square nearly all year since 2009. The drop was paused for New Year\'s Eve 1942 and 1943 because of wartime lighting rules.', clue: 'Look up at the ball on the mast above the tower.', source: { name: 'Times Square Ball, Wikipedia', url: 'https://en.wikipedia.org/wiki/Times_Square_Ball' } }, { r: 2.6 });
    k.egg(v(0, 9, ZC - L / 2 - 6.9), { id: 'times-longacre', title: 'Longacre Square', year: '1904', text: 'Until April 8, 1904 this was Longacre Square. It was renamed after The New York Times moved its headquarters into the Times Building, now One Times Square. New Year fireworks there from 1904 to 1906 were stopped by city officials for fear of fire, and the first ball dropped instead at the end of 1907.', clue: 'Look at the foot of the tower behind the red steps.', source: { name: 'Times Square, Wikipedia', url: 'https://en.wikipedia.org/wiki/Times_Square' } }, { r: 2.2 });
    k.egg(v(0, 34, ZC - L / 2 - 6.9), { id: 'times-empty-tower', title: 'A tower made of billboards', year: '1928', text: 'The Times left its tower in 1913 and the last office tenants moved out in 1996, so the building now earns its keep from the signs on its face, estimated at $23 million a year in 2019. Its news zipper began on November 6, 1928, and the first headline it ran was Herbert Hoover\'s presidential win.', clue: 'Look at the signs high on the tower face.', source: { name: 'One Times Square, Wikipedia', url: 'https://en.wikipedia.org/wiki/One_Times_Square' } }, { r: 2.4 });
    k.sign('NEW YORKERS', 12, 4, 0, 30, ZC - L / 2 - 6.9, '#c33064', '#ffffff', 160, 0);
    k.sign('BY MLOW', 12, 2.2, 0, 26.6, ZC - L / 2 - 6.9, '#2654b9', '#ffffff', 130, 0);
    k.sign('THE CENSUS IS COMING', 12, 1.3, 0, 24.7, ZC - L / 2 - 6.9, '#111925', '#00e5ff', 90, 0);
    // a plain steel grate on the plaza between 45th and 46th: the sound piece under it has no sign, by the artist's wish
    k.box(2.4, 0.04, 1.3, -3, 0.02, -24, steel);
    for (let x = -4.1; x <= -1.9; x += 0.2) k.box(0.05, 0.05, 1.2, x, 0.045, -24, k.flat(0x0a0d12, 0.6, 0.5));
    k.egg(v(-3, 0.4, -24), { id: 'times-neuhaus-drone', title: 'The hum under the grate', year: '1977', text: 'Under a grate on the pedestrian island between 45th and 46th Streets, Max Neuhaus installed a sound work in 1977 that he described as resembling the after ring of large bells. It was disconnected in 1992 and reinstalled in 2002, and Neuhaus later gave it to the Dia Art Foundation. There is no sign or marking, at his request.', clue: 'Stand on the steel grate in the plaza and listen.', source: { name: 'Times Square (Neuhaus), Wikipedia', url: 'https://en.wikipedia.org/wiki/Times_Square_(Neuhaus)' } }, { r: 1.6 });
    k.egg(v(3, 1.2, ZC - L / 2 + 12.6), { id: 'times-red-steps', title: 'Twenty seven red steps', year: '2008', text: 'The TKTS booth has sold discount theatre tickets here since June 1973, when it was housed in a rented construction trailer. The present booth opened on October 16, 2008, under an amphitheatre of red glass steps, 27 steps high and 16 feet above the street, lit from below with LEDs.', clue: 'Count the red steps from the bottom.', source: { name: 'TDF\'s new TKTS booth under the red steps, TDF', url: 'https://www.tdf.org/about-us/media-center/tdfs-new-tkts-booth-under-the-red-steps-opening-thursday-october-16-at-3pm-will-bring-discount-theatre-and-dance-tickets-back-the-newly-revitalized-father-duffy-square/' } }, { r: 1.8 });
    k.egg(v(-11.4, 9.5, -2), { id: 'times-signs-by-law', title: 'Bright lights by law', year: '1987', text: 'Since 1987 the zoning ordinances have required building owners here to put up illuminated signs, and Times Square is the only district in New York City with that rule. The same 1987 rules made large new developments set aside about 5 percent of their space for entertainment uses.', clue: 'Look at the lit billboards on the left hand wall.', source: { name: 'Times Square, Wikipedia', url: 'https://en.wikipedia.org/wiki/Times_Square' } }, { r: 2.4 });
    for (const s of [-1, 1]) for (let z = 8; z > ZC - L / 2 + 14; z -= 7) k.lathe([[0.25, 0], [0.25, 0.18], [0.15, 0.26], [0.15, 0.85], [0.2, 0.92]], s * 6, 0, z, steel, 12);
    for (const s of [-1, 1]) for (const z of [-2, -30]) { k.prop('mailbox', s * 7.6, 0, z, { height: 1.5, rotY: s > 0 ? PI : 0, keepOut: 0.6 }); }
    k.prop('hydrant', -7.4, 0, -16, { height: 1.1, keepOut: 0.5 });
    k.prop('hydrant', 7.4, 0, -44, { height: 1.1, keepOut: 0.5 });
    for (const z of [4, -22, -48]) for (const s of [-1, 1]) k.lamp(s * 7, z, 7, steel, 0xf8f4ff, 40);
    // framed street level light boxes
    const mounts = corridorMounts({ pairs: 10, x: 11.85, z0: 4, pitch: 6.2, y: 3.5, width: 5.6, height: 3.2, inset: 5.6, style: 'neon' });
    mounts.push({ position: v(0, 16, ZC - L / 2 - 6.9), rotation: 0, target: v(0, 3, ZC - L / 2 + 26), width: 13, height: 7.4, style: 'neon', wash: false });
    return { mounts, spawn: v(0, 3, 11), look: v(0, 6, -40), eye: 3, bounds: [-9.6, 9.6, ZC - L / 2 + 15, 12], style: 'neon' };
  },
};

/* ---------------- 06 STATEN ISLAND FERRY ---------------- */
export const ferry: RoomDef = {
  id: 'ferry',
  name: 'The harbor crossing',
  area: 'STATEN ISLAND FERRY',
  mood: 'Sunset crossing',
  color: '#f8af72',
  description: 'Orange decks, white rails, the cabin walls hung with New Yorkers, Liberty off the port side.',
  signatures: 'The orange hull and white superstructure, side promenade decks, wheelhouse and funnel, Liberty and the skyline off the water.',
  build(k, ctx) {
    k.sky({ top: 0x5a6fa8, horizon: 0xf0a06a, ground: 0x2c2a30, fog: 0.0016, sun: { az: 4.6, el: 0.07, color: 0xffb060, size: 18 }, haze: 0.4, env: 0.9 });
    k.hemi(0xffd9b8, 0x2a3140, 0.7);
    k.sun(0xffb878, 2.4, -80, 12, -20, true, 60);
    const orange = k.pbr('hull', X.steel(0xd4712a, false, 4), 0.35, { metalness: 0.35, roughness: 0.5 }),
      deck = k.pbr('deck', X.steel(0x5f6a63, true, 5), 0.5, { metalness: 0.3, roughness: 0.75 }),
      white = k.pbr('cabin', X.plaster(0xeeeae0, 6), 0.5, { roughness: 0.6 }),
      rail = k.flat(0xf1eee6, 0.4, 0.5),
      navy = k.flat(0x1a3446, 0.5, 0.5),
      glassDark = k.glass(0x9ec9d8, 0.35, 0.1),
      teak = k.pbr('teakF', X.planks(0x8a6640, 4, 7), 1.2);
    const L = 74, ZC = 8 - L / 2;
    k.water({ y: -3.2, color: 0x2b4558, w: 520, d: 460, z: -120, amp: 1.6 });
    // hull, deck, cabin
    k.box(26, 0.5, L, 0, -0.25, ZC, deck);
    k.box(27, 4.5, L + 6, 0, -2.6, ZC, orange);
    k.mesh(new T.CylinderGeometry(13.5, 13.5, 4.5, 24, 1, false, 0, PI), orange, 0, -2.6, ZC - L / 2 - 3).rotation.set(0, PI / 2, 0);
    k.mesh(new T.CylinderGeometry(13.5, 13.5, 4.5, 24, 1, false, PI, PI), orange, 0, -2.6, ZC + L / 2 + 3).rotation.set(0, PI / 2, 0);
    k.box(8.6, 4.4, L - 8, 0, 2.2, ZC, white);
    k.block(-4.8, 4.8, ZC - L / 2 + 3.6, ZC + L / 2 - 3.6);
    k.box(9.2, 0.4, L - 7, 0, 4.5, ZC, orange);
    k.box(9.6, 0.15, L - 6, 0, 4.75, ZC, white);
    for (const s of [-1, 1]) for (let z = 4; z > ZC - L / 2 + 6; z -= 6.4) k.box(0.05, 0.9, 1.6, s * 4.32, 3.6, z - 3.2, glassDark);
    // upper works: wheelhouse, funnel, mast, radar
    k.box(10, 3.2, 12, 0, 6.4, -12, white);
    k.rounded(10.4, 0.3, 12.4, 0, 8.1, -12, orange, 0.2);
    for (let x = -3.6; x <= 3.6; x += 1.2) k.rounded(1.0, 1.5, 0.06, x, 6.6, -5.9, glassDark, 0.12);
    k.cyl(1.2, 5, 0, 10.5, -22, orange, 1.0, 20);
    k.cyl(1.25, 0.5, 0, 13.1, -22, navy, 1.25, 20);
    k.beam(v(0, 8.2, -12), v(0, 16, -12), 0.12, rail, 8);
    k.beam(v(-3, 14, -12), v(3, 14, -12), 0.06, rail, 6);
    k.box(1.8, 0.14, 0.3, 0, 15.2, -12, rail);
    k.point(0, 15.5, -12, 0xffffff, 20, 20);
    // rails, lifebuoys, deck gear
    for (const s of [-1, 1]) {
      k.box(0.3, 1.0, L, s * 12.85, 0.5, ZC, orange);
      k.rail(s * 12.85, ZC, L, rail, 1.55, 'z', 1.6);
      for (let z = 2; z > ZC - L / 2; z -= 12) k.prop('life_ring', s * 12.85 - s * 0.3, 1.7, z, { height: 0.85, rotY: PI / 2 });
      for (let z = -6; z > ZC - L / 2 + 8; z -= 16) k.bench(s * 6.4, z, s > 0 ? 0 : PI, teak, navy, 3);
      for (let z = 0; z > ZC - L / 2 + 4; z -= 12) k.prop('porthole', s * 4.34, 1.4, z + 0.2, { height: 0.6, rotY: s > 0 ? PI / 2 : -PI / 2 });
      k.point(s * 8.5, 4, -10, 0xffe4c0, 18, 16);
      k.point(s * 8.5, 4, -36, 0xffe4c0, 18, 16);
    }
    // the bow end of the cabin faces the bow deck: the wheel, the two works and the route board sit on its outer face
    k.prop('ships_wheel', 0, 1.9, ZC - L / 2 + 3.4, { height: 1.6 });
    k.plinth(8.6, ZC - L / 2 + 6, 1.4, 0.9, 1.4, white);
    k.prop('captains_hat', 8.6, 0.98, ZC - L / 2 + 6, { height: 0.5 });
    k.prop('bell', 7, 2.2, ZC - L / 2 + 2, { height: 0.8 });
    k.box(0.25, 2.2, 0.25, 7, 1.1, ZC - L / 2 + 2, rail);
    for (const x of [-9, 9]) k.prop('cleat', x, 0, ZC - L / 2 + 1.5, { height: 0.45 });
    k.prop('buoy', -10, 0, ZC - L / 2 + 3, { height: 1.8, keepOut: 0.8 });
    k.rail(0, ZC - L / 2 - 1.2, 22, rail, 1.5, 'x', 1.6);
    k.sign('STATEN ISLAND FERRY', 9, 0.8, 0, 5.2, 12.3, '#d0762a', '#fff3d5', 95, PI, { border: true });
    k.sign('MANHATTAN  ·  ST. GEORGE', 6, 0.55, 0, 4.15, ZC - L / 2 + 3.5, '#1a3446', '#fff3d5', 80, PI, { border: true });
    /* eggs: real details of the ferry */
    k.egg(v(0, 5.2, 11.9), { id: 'ferry-free-since-1997', title: 'The nickel, then nothing', year: '1997', text: 'For most of the nineteenth and twentieth centuries the ride cost a nickel, famed as the biggest bargain in New York City. The fare went to 25 cents on August 4, 1975, a round trip to 50 cents in 1990, and in July 1997 the passenger fare was eliminated altogether.', clue: 'Read the name board over the stern.', source: { name: 'Staten Island Ferry, Wikipedia', url: 'https://en.wikipedia.org/wiki/Staten_Island_Ferry' } }, { r: 1.6 });
    k.egg(v(0, 2.2, ZC - L / 2 + 2.9), { id: 'ferry-25-minutes', title: '5.2 miles, all night', text: 'The run between Whitehall Terminal in Manhattan and St. George on Staten Island is 5.2 miles and takes about 25 minutes. The boats run 24 hours a day, seven days a week, and it is the busiest ferry route in the United States.', clue: 'Find the ship\'s wheel on the bow deck.', source: { name: 'Staten Island Ferry, Wikipedia', url: 'https://en.wikipedia.org/wiki/Staten_Island_Ferry' } }, { r: 1.4 });
    k.egg(v(-12.3, 1.7, -40), { id: 'ferry-liberty-side', title: 'The free view of Liberty', text: 'The crossing passes the Statue of Liberty on Liberty Island, Ellis Island, Governors Island and the Verrazzano Narrows Bridge. Ridership peaked at 27.5 million in 1964 and fell to 22 million in 1965, after that bridge opened.', clue: 'Lean on the port rail and look across the water to the statue.', source: { name: 'Staten Island Ferry, Wikipedia', url: 'https://en.wikipedia.org/wiki/Staten_Island_Ferry' } }, { r: 1.8 });
    k.egg(v(7, 2.3, ZC - L / 2 + 2), { id: 'ferry-vanderbilt', title: 'A sixteen year old\'s ferry', year: '1810', text: 'Cornelius Vanderbilt started a ferry service between Staten Island and Manhattan in 1810, when he was 16.', clue: 'Ring the bell on the bow deck.', source: { name: 'Staten Island Ferry, Wikipedia', url: 'https://en.wikipedia.org/wiki/Staten_Island_Ferry' } }, { r: 1.4 });
    k.egg(v(0, 6.6, -5.7), { id: 'ferry-spirit-of-america', title: 'Which boat is this', year: '2006', text: 'The Molinari class boats, the Guy V. Molinari, the Sen. John J. Marchi and the Spirit of America, are 310 feet long and carry up to 4,427 passengers and 30 vehicles, built to recall the classic New York ferryboats. Spirit of America was delivered on September 16, 2005, but did not make its maiden voyage until April 4, 2006. The bigger Barberi class boats carry 6,000.', clue: 'Look up at the wheelhouse windows.', source: { name: 'Staten Island Ferry, Wikipedia', url: 'https://en.wikipedia.org/wiki/Staten_Island_Ferry' } }, { r: 1.8 });
    k.egg(v(0, 11, -22), { id: 'ferry-orange', title: 'Why orange', year: '1926', text: 'The ferries were originally white. In 1926 the colour was changed to a reddish maroon and later to orange, to make the boats easier to see in fog and snow.', clue: 'Look up at the orange funnel.', source: { name: 'The Top 13 Secrets of NYC\'s Staten Island Ferry, Untapped New York', url: 'https://www.untappedcities.com/the-top-13-secrets-of-nycs-staten-island-ferry/' } }, { r: 1.8 });
    // the harbour: Liberty, distant islands, the skyline ahead, buoys
    liberty(k, -64, -3, -120, 1.6);
    for (const [x, z] of [[-40, -60], [50, -90], [30, -40]]) k.prop('buoy', x, -2.9, z, { height: 2.4 });
    k.box(60, 6, 30, -64, -3, -125, k.pbr('island', X.ashlar(0x6f7566, 4, 3), 0.1));
    k.skyline({ z: -190, count: 36, spacing: 6.5, scale: 2.6, base: -3, seed: 15, lit: 0.3, glow: 0.9, tint: 0x4a4f5c });
    k.skyline({ z: -240, count: 30, spacing: 9, scale: 3.4, base: -3, seed: 16, lit: 0.2, glow: 0.6, tint: 0x5b5f6b, rows: 1 });
    k.censusWall({ x: 0, y: 2.6, z: 12.25, rotY: PI, cols: 26, rows: 3, tile: 0.6, gap: 0.05, start: ctx.wallStart(5300, 78), pieces: ctx.all, backing: navy });
    const mounts = corridorMounts({ pairs: 10, x: 4.36, z0: 1, pitch: 6.4, y: 2.5, width: 4.6, height: 2.6, inset: -4.2, style: 'white' });
    for (const m of mounts) m.rotation = m.position.x > 0 ? PI / 2 : -PI / 2;
    mounts.push({ position: v(-2.4, 2.4, ZC - L / 2 + 3.55), rotation: PI, target: v(-2.4, 3, ZC - L / 2 + 1.6), width: 3.6, height: 2.4, style: 'white' });
    mounts.push({ position: v(2.4, 2.4, ZC - L / 2 + 3.55), rotation: PI, target: v(2.4, 3, ZC - L / 2 + 1.6), width: 3.6, height: 2.4, style: 'white' });
    return { mounts, spawn: v(-8.5, 3, 9), look: v(-6, 3.2, -30), eye: 3, bounds: [-12, 12, ZC - L / 2 + 1, 11], style: 'white' };
  },
};
