/* Rooms 03 to 06: Met roof garden, Brooklyn waterfront, Times Square, Staten Island Ferry. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Kit } from '../kit';
import { corridorMounts } from './types';
import type { RoomDef } from './types';
import { billboard, scan, glbs, fireflyPlate, carBox } from './a';
import { hero, standIn, hide } from './heroes';

const PI = Math.PI;

/* Liberty in the harbour: the pedestal in code, the figure Gravity Jack's "Statue Of Liberty" (Sketchfab, CC BY 4.0,
   https://sketchfab.com/3d-models/statue-of-liberty-84094e8d5e724b5c882cf576ca12e44e), the same file the climb rooms
   use (liberty_statue_v2.glb, up6.ts and up7.ts). 2026-10-28: the lathed robe, sphere head and cone crown read as a
   green traffic cone with a torch, MLow's words for the old climb figure. At this distance she is only the shell: no
   crown mask, no stair. The code figure is still built first and hidden when she loads, so a failed load leaves the
   silhouette. She turns to face `toward` (x, z), the visitor's side of the water. The licence asks for credit: each
   room that calls this carries the plaque line from `LIBERTY_CREDIT`. */
export const LIBERTY_CREDIT = 'STATUE MODEL: GRAVITY JACK, CC BY 4.0';
export function liberty(k: Kit, x: number, y: number, z: number, s = 1, toward: [number, number] = [0, 0]) {
  const copper = k.pbr('patina', X.patina(), 0.4, { roughness: 0.55, metalness: 0.25 }),
    stone = k.pbr('pedestal', X.ashlar(0x9a9488, 6, 3), 0.25),
    warm = k.glow(0xffe2a0);
  k.box(9 * s, 1.2 * s, 9 * s, x, y + 0.6 * s, z, stone);
  k.box(5 * s, 5 * s, 5 * s, x, y + 3.6 * s, z, stone);
  k.box(5.6 * s, 0.6 * s, 5.6 * s, x, y + 6.3 * s, z, stone);
  k.box(4 * s, 1.4 * s, 4 * s, x, y + 7.3 * s, z, stone);
  const mark = k.objects.length;
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
  const torch = k.point(x + 2.3 * s, y + 19.6 * s, z, 0xffd27a, 60, 40);
  k.box(0.9 * s, 1.8 * s, 0.35 * s, x - 1.1 * s, y + 12.4 * s, z + 0.6 * s, copper);
  libertyFigure(k, standIn(k, mark), x, y + 8 * s, z, 12 * s, toward, torch, warm);
}
/* The figure alone, for rooms that keep their own base: Gravity Jack's model `height` tall standing at (x, y, z), facing
   `toward`; `old` (the code figure) is hidden when she loads. The model faces its own -z with the torch at about
   (3.45, top, 2.85) in its frame (up7.ts FLAME, unrotated); a torch light and glow, if given, move to her flame. */
export function libertyFigure(k: Kit, old: T.Object3D[], x: number, y: number, z: number, height: number, toward: [number, number], torch?: T.PointLight, warm?: T.Material) {
  void hero(k, 'liberty_statue_v2', { height }).then((h) => {
    if (!h) return;
    hide(old);
    h.position.set(x, y, z);
    h.rotation.y = Math.atan2(-(toward[0] - x), -(toward[1] - z));
    k.add(h);
    h.updateMatrixWorld(true);
    const top = new T.Box3().setFromObject(h).max.y, f = h.children[0].localToWorld(new T.Vector3(3.45, 0, 2.85)), u = height / 12;
    if (torch) torch.position.set(f.x, top - 0.25 * u, f.z);
    if (warm) k.mesh(new T.SphereGeometry(0.32 * u, 10, 8), warm, f.x, top - 0.45 * u, f.z, true);
  });
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
    /* 2026-11-23: scanned limestone block and stone paving (Poly Haven CC0) at true size for the painted ones */
    const lime = scan(k, 'met', 'white_sandstone_blocks_02', 2, () => X.ashlar(0xc3b8a2, 3, 3), { color: new T.Color(1.08, 1.02, 0.93) }),
      pav = scan(k, 'met', 'granite_tile', 2.3, () => X.pavers(0xb9b1a0, 4), { color: new T.Color(1.9, 1.82, 1.66) }),
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
    k.plinth(0, -26, 3.2, 0.7, 3.2, lime);
    /* 2026-11-23: the code torus knot is a real sculpture now, Poly Haven's horse statue (CC0, a scan) cast large */
    const knot = v(0, 2.5, -26);
    glbs(k, 'met/ph_horse_statue_01', { height: 3.1 }, [[0, 0.78, -26, PI * 0.15]]);
    /* eggs: real details of the Iris and B. Gerald Cantor Roof Garden */
    k.egg(knot, { id: 'met-one-artist-a-summer', title: 'One artist a summer', year: '1998', text: 'Every summer since 1998 the roof garden has hosted a single artist exhibition. Ellsworth Kelly opened the series in 1998, followed by Magdalena Abakanowicz, David Smith and Joel Shapiro, and later Roy Lichtenstein in 2003, Sol LeWitt in 2005, Jeff Koons in 2008 and Huma Bhabha in 2018.', clue: 'Walk round the rearing horse on its plinth in the middle of the terrace.', source: { name: 'The Met Fifth Avenue, Wikipedia', url: 'https://en.wikipedia.org/wiki/The_Met_Fifth_Avenue' } }, { r: 1.6 });
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
    /* the café: real table and chair sets (Poly Haven CC0) under square canvas umbrellas */
    const canvas = k.flat(0xe9e1cf, 0, 0.85), cafe: [number, number, number, number][] = [];
    for (const z of [-6, -26, -46]) for (const s of [-1, 1]) {
      const x = s * 5.6;
      cafe.push([x, 0, z, PI / 2]);
      k.cyl(0.04, 2.6, x, 1.3, z, iron);
      k.mesh(new T.ConeGeometry(1.9, 0.55, 4, 1, true), canvas, x, 2.75, z).rotation.y = PI / 4;
      k.box(0.06, 0.06, 0.06, x, 3.05, z, iron);
      k.keepOut.push({ x, z, r: 1.7 });
    }
    glbs(k, 'met/ph_outdoor_table_chair_set_01', { height: 0.92 }, cafe);
    for (const z of [-16, -40]) { k.bench(-6.4, z, 0, teak, iron, 2.4); k.bench(6.4, z, PI, teak, iron, 2.4); }
    // the bar pergola at the entrance carries the census ledger
    for (const x of [-9, -3, 3, 9]) k.box(0.3, 4.2, 0.3, x, 2.1, 12, iron);
    k.box(20, 0.2, 3.2, 0, 4.3, 11, iron);
    for (let x = -9.5; x <= 9.5; x += 0.7) k.box(0.12, 0.3, 3.2, x, 4.55, 11, teak);
    k.censusWall({ x: 0, y: 2.3, z: 12.6, rotY: PI, cols: 30, rows: 3, tile: 0.62, gap: 0.05, start: ctx.wallStart(4500, 90), pieces: ctx.all, backing: lime });
    k.egg(v(0, 3.8, 10.6), { id: 'met-roof-1987', title: 'The best view in Manhattan', year: '1987', text: 'The Iris and B. Gerald Cantor Roof Garden opened to the public on August 1, 1987, on the roof near the southwestern corner of the museum. Its views of Central Park and the Manhattan skyline have been called the best in Manhattan, and on Friday and Saturday evenings the café and bar drew elevator lines.', clue: 'Stand under the bar pergola at the entrance.', source: { name: 'The Met Fifth Avenue, Wikipedia', url: 'https://en.wikipedia.org/wiki/The_Met_Fifth_Avenue' } }, { r: 1.6 });
    k.egg(v(0, 5.4, ZC - L / 2 + 5.5), { id: 'met-roof-closed', title: 'Closed for five years', year: '2025', text: 'In 2025 the Met announced that the roof garden would close for five years starting that October. The museum meanwhile has a new Tang Wing for Modern Art set for completion in 2030.', clue: 'Look at the top of the limestone wall at the far end of the terrace.', source: { name: 'The Met Fifth Avenue, Wikipedia', url: 'https://en.wikipedia.org/wiki/The_Met_Fifth_Avenue' } }, { r: 1.8 });
    /* ---- THE BIG UPGRADE (2026-11-23) ---- */
    /* the trick: a two way mirror pavilion in the hedges, after the roof's 2014 commission. Half silvered glass on an
       S curve reflects the terrace and the sky and shows the people on the other side at once */
    {
      const pz = -50, mirror = new T.MeshPhysicalMaterial({ color: 0xaab8c0, metalness: 1, roughness: 0.03, transparent: true, opacity: 0.62, side: T.DoubleSide, envMapIntensity: 1.6 });
      for (const [cx, start] of [[-1.2, 0], [1.2, PI]] as [number, number][]) {
        const arc = k.mesh(new T.CylinderGeometry(1.3, 1.3, 2.3, 32, 1, true, start, PI), mirror, cx, 1.15, pz, true);
        arc.rotation.y = PI / 2;
        for (const y of [0.04, 2.3]) { const r = k.mesh(new T.TorusGeometry(1.3, 0.035, 6, 32, PI), k.flat(0x8d9296, 0.9, 0.3), cx, y, pz, true); r.rotation.set(PI / 2, 0, start === 0 ? PI : 0); }
      }
      for (const s of [-1, 1]) for (let z = pz - 2.4; z <= pz + 2.4; z += 0.8) k.box(0.7, 1.05, 0.82, s * 3.0, 0.52, z, hedge);
      k.keepOut.push({ x: 0, z: pz, r: 2.9 });
      k.egg(v(0, 1.6, pz), { id: 'met-two-way-mirror', title: 'Mirror and window at once', year: '2014', text: 'In 2014 the roof garden commission went to Dan Graham, working with the Swiss landscape architect Günther Vogt: Hedge Two-Way Mirror Walkabout, a curved pavilion of two way mirror glass between ivy hedges. Half silvered glass is a mirror and a window at the same time, so you see yourself, the sky and the visitor on the far side laid over one another.', clue: 'Walk into the curved glass among the hedges at the far end.', source: { name: 'Dan Graham, Wikipedia', url: 'https://en.wikipedia.org/wiki/Dan_Graham' } }, { r: 1.8 });
    }
    /* Firefly plate, queued: a painted golden hour Fifth Avenue and Central Park South backdrop behind the code skyline */
    fireflyPlate(k, 'assets/museum/tex/met/ff_skyline_backdrop.webp', 640, 160, 0, 60, -260, 0, new T.MeshBasicMaterial({ visible: false }), true);
    // the park below and the city beyond
    k.box(300, 0.4, 200, 0, -7, -140, k.pbr('lawn', X.grass(0x4a6a3b), 0.15));
    /* 2026-10-28: Central Park below the roof was 260 icosahedron blobs on sticks; it is the tree kit now (instanced photo
       trees, the city's street mix, far LOD at this distance), same places and sizes, the rnd() sequence kept */
    const rnd = X.mulberry(5);
    for (let i = 0; i < 260; i++) {
      const x = (rnd() - 0.5) * 220, z = -68 - rnd() * 60, s = 2.4 + rnd() * 3.4;
      rnd(); rnd(); rnd();
      if (i % 3 === 0) k.tree(x, -6.8, z, { h: 4 + s * 1.5, r: s * 1.35, seed: 500 + i });   // a third of them, larger: below the parapet the canopy reads as one, and 260 kit trees cost a million triangles
    }
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
    /* 2026-11-23: Poly Haven scans (CC0) at real size: granite setts, dressed granite for the bridge, weathering steel,
       DUMBO brick and tarred pier timber */
    const granite = scan(k, 'brooklyn', 'granite_tile_02', 1.88, () => X.pavers(0x7b7d7c, 6), { color: new T.Color(1.15, 1.15, 1.12) }),
      masonry = scan(k, 'brooklyn', 'granite_wall', 3.2, () => X.ashlar(0x8f8674, 7, 4), { color: new T.Color(1.25, 1.18, 1.05) }),
      corten = scan(k, 'brooklyn', 'rust_coarse_01', 2.2, () => X.steel(0x6b3f2a, false, 3), { metalness: 0.3 }),
      iron = k.flat(0x1d2327, 0.7, 0.45),
      steelW = k.flat(0xc9ced2, 0.6, 0.4),
      brick = scan(k, 'brooklyn', 'brick_wall_08', 1.9, () => X.brick(0x5f3d33, 6), { color: new T.Color(1.3, 0.86, 0.72) }),
      timber = scan(k, 'brooklyn', 'wood_planks_dirt', 2, () => X.planks(0x4d3b2d, 5, 8), { color: 0x9a8a78 }),
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
      /* 2026-11-23: a metre's gap between screens, so the river and its boats show between them */
      k.box(0.35, 4.4, 5.6, -9.4, 2.4, z, corten);
      k.box(1.0, 0.3, 5.9, -9.4, 0.15, z, granite);
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
    /* DUMBO's cast iron gas lamp heads (a NEW YORKERS edit of a Poly Haven CC0 model) for the generic posts */
    glbs(k, 'brooklyn/nyb_dumbo_gaslamp', { height: 6.4 }, [[7.4, 0, 6, -PI / 2], [7.4, 0, -14, -PI / 2], [7.4, 0, -34, -PI / 2], [7.4, 0, -54, -PI / 2]]);
    for (const z of [6, -14, -34, -54]) k.keepOut.push({ x: 7.4, z, r: 0.45 });
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
    /* ---- THE BIG UPGRADE (2026-11-23) ---- */
    /* the river works: a ferry crossing under the bridge and a tug pushing up the channel, the museum's own hero models */
    {
      const ferryBoat = new T.Group(), tug = new T.Group();
      k.add(ferryBoat); k.add(tug);
      glbs(k, 'h_ferry', { length: 34 }, [[0, 0, 0, 0]], (os) => { k.scene.remove(os[0]); ferryBoat.add(os[0]); });
      glbs(k, 'h_tug_lo', { length: 19 }, [[0, 0, 0, 0]], (os) => { k.scene.remove(os[0]); tug.add(os[0]); });
      const wy = -1.9;
      const fr = k.spline([v(-170, wy, -104), v(0, wy, -100), v(170, wy, -104), v(170, wy, -122), v(0, wy, -126), v(-170, wy, -122)], true);
      const tr = k.spline([v(-42, wy, 60), v(-40, wy, -60), v(-44, wy, -170), v(-62, wy, -170), v(-60, wy, -60), v(-62, wy, 60)], true);
      if (!ctx.reduced) { k.rider(ferryBoat, fr, 6.5, 30); k.rider(tug, tr, 3.2, 90); }
      else { ferryBoat.position.set(20, wy, -101); ferryBoat.rotation.y = PI / 2; tug.position.set(-41, wy, -20); }
    }
    /* the trick: an etched window. A pane on the pier carries the bridge drawn in white lines, projected from one spot
       on the promenade; stand on the brass mark and the drawing lies exactly over the real towers and cables, even
       where the pier shed hides them */
    {
      const E = v(-1.5, 3, -50), zg = -52.6, line = k.glow(0xf4f8ff, 0.85);
      const proj = (p: T.Vector3) => { const t = (zg - E.z) / (p.z - E.z); return v(E.x + t * (p.x - E.x), E.y + t * (p.y - E.y), zg + 0.02); };
      /* the pane frames the Manhattan tower only; lines outside it are dropped */
      const box = [proj(v(-bx - 9, 4, bz)).x, proj(v(-bx + 9, 4, bz)).x, proj(v(0, 3.6, bz)).y, proj(v(0, 37, bz)).y];
      const inside = (p: T.Vector3) => p.x >= box[0] && p.x <= box[1] && p.y >= box[2] && p.y <= box[3];
      const draw = (pts: T.Vector3[]) => { for (let i = 0; i < pts.length - 1; i++) { const a = proj(pts[i]), b = proj(pts[i + 1]); if (inside(a) && inside(b)) k.beam(a, b, 0.0035, line, 4); } };
      const cy = (x: number) => (Math.abs(x) <= bx ? 12 + 20 * (x / bx) ** 2 : 32 - 20 * ((Math.abs(x) - bx) / bx));
      for (const x of [-bx]) {
        draw([v(x - 7, 4, bz + 3), v(x - 7, 35.2, bz + 3), v(x + 7, 35.2, bz + 3), v(x + 7, 4, bz + 3)]);
        for (const dx of [-3.3, 3.3]) { const a = []; for (let i = 0; i <= 8; i++) { const u = i / 8; a.push(v(x + dx - 2.1 + 4.2 * u, 19 + 10 * Math.sin(PI * u) ** 0.7, bz + 3)); } draw([v(x + dx - 2.1, 9.5, bz + 3), ...a, v(x + dx + 2.1, 9.5, bz + 3)]); }
      }
      { const a = []; for (let x = -bx * 2; x <= bx * 2; x += 1) a.push(v(x, cy(x), bz + 2.5)); draw(a); }
      { const a = []; for (let x = -bx - 9; x <= -bx + 9; x += 1) a.push(v(x, 9.4, bz + 3)); draw(a); }
      const xs = [box[0], box[1]], ys = [box[2], box[3]];
      const pw = xs[1] - xs[0] + 0.12, ph = ys[1] - ys[0] + 0.12, pcx = (xs[0] + xs[1]) / 2, pcy = (ys[0] + ys[1]) / 2;
      k.mesh(new T.PlaneGeometry(pw, ph), k.glass(0xd6e6f2, 0.16, 0.05), pcx, pcy, zg, true);
      const steel = k.flat(0x2a3034, 0.8, 0.4);
      for (const dx of [-pw / 2, pw / 2]) k.box(0.05, pcy + ph / 2, 0.05, pcx + dx, (pcy + ph / 2) / 2, zg, steel);
      k.box(pw + 0.1, 0.05, 0.06, pcx, pcy + ph / 2, zg, steel);
      k.box(pw + 0.1, 0.05, 0.06, pcx, pcy - ph / 2, zg, steel);
      for (let x = pcx - pw / 2; x <= pcx + pw / 2 + 0.01; x += 0.5) k.keepOut.push({ x, z: zg, r: 0.45 });
      k.cyl(0.32, 0.03, E.x, 0.015, E.z, k.flat(0xb8924a, 0.9, 0.3), 0.32, 24);
      k.sign('STAND HERE', 0.6, 0.12, E.x, 0.035, E.z + 0.45, 'transparent', '#e6d6a8', 90, 0);
      k.egg(v(pcx, pcy, zg), { id: 'brooklyn-etched-window', title: 'Drawn from one spot', year: '1420', text: 'The lines on the glass are the bridge, projected onto the pane from the brass mark, so from there and nowhere else they lie over the real towers and cables. It is the oldest trick of linear perspective: Filippo Brunelleschi is credited with showing it around 1415 to 1420, with a painted panel of the Florence Baptistery held up against the building itself and viewed through a hole from one spot.', clue: 'Find the brass mark on the promenade and look through the glass toward the bridge.', source: { name: 'Perspective (graphical), Wikipedia', url: 'https://en.wikipedia.org/wiki/Perspective_(graphical)' } }, { r: 1.6 });
    }
    /* festoon lights strung across the promenade from the screens to the warehouses, one zigzag the length of the pier */
    {
      const wire = k.flat(0x111111, 0.3, 0.6), bulbs: T.Vector3[] = [];
      for (let i = 0; i < 10; i++) {
        const z0 = 2 - i * 6.6 + 3.3, a = v(-9.25, 4.55, z0), b = v(11.85, 6.4, z0 - 3.3), c = v(-9.25, 4.55, z0 - 6.6);
        for (const [p, q] of [[a, b], [b, c]] as [T.Vector3, T.Vector3][]) {
          const pts: T.Vector3[] = [];
          for (let j = 0; j <= 24; j++) { const u = j / 24, pt = p.clone().lerp(q, u); pt.y -= Math.sin(PI * u) * 1.1; pts.push(pt); if (j % 2 === 1) bulbs.push(pt.clone().add(v(0, -0.09, 0))); }
          k.curve(pts, 0.008, wire, 24);
        }
      }
      const im = new T.InstancedMesh(new T.SphereGeometry(0.06, 8, 6), k.glow(0xffd9a0), bulbs.length), m = new T.Matrix4();
      bulbs.forEach((p, i) => im.setMatrixAt(i, m.makeTranslation(p.x, p.y, p.z)));
      k.add(im);
    }
    /* Firefly plate, queued: a weathered painted ghost sign high on the second warehouse */
    fireflyPlate(k, 'assets/museum/tex/brooklyn/ff_ghost_sign.webp', 8, 2.6, 11.93, 15.2, -3, -PI / 2, new T.MeshBasicMaterial({ visible: false }));
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
    /* 2026-11-23: scanned asphalt kept wet (low roughness) and the plaza's concrete pavers, Poly Haven CC0 */
    const wet = scan(k, 'times', 'asphalt_04', 4, () => X.asphalt(0x1c2027), { roughness: 0.35, metalness: 0.3, color: 0x8a8f99 }),
      facade = k.pbr('facadeT', X.windows(21, 0.3, 0x1c2433, false), 0.12, { emissive: 0xffffff, emissiveIntensity: 0.8, roughness: 0.6, stretch: 0.42 }),
      steel = k.flat(0x2a3038, 0.8, 0.4),
      red = k.pbr('tkts', X.plaster(0xb02a45, 8), 0.5, { roughness: 0.35, metalness: 0.2 }),
      white = k.flat(0xe8e8e2, 0.1, 0.5),
      pale = scan(k, 'times', 'concrete_pavers', 1.92, () => X.concrete(0x5d6068, 9), { roughness: 0.8, color: 0x9a9ca4 }),
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
          /* 2026-11-23: the dark backing box stood 1 cm proud of the billboard and hid every one of them; set it behind */
          k.box(0.05, 6.4, 9.4, s * 11.985, y, z, neon[(j + kk) % 4]);
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
    /* ---- THE BIG UPGRADE (2026-11-23) ---- */
    const TW = ZC - L / 2 - 6.9;   // the tower's face
    /* traffic: five cabs and two cars crawling the loop, cast by the kit as real taxis with the MLOW topper */
    {
      const loop = k.spline([v(-2.6, 0, 16), v(-2.6, 0, -50), v(-1.5, 0, -54), v(1.5, 0, -54), v(2.6, 0, -50), v(2.6, 0, 16), v(1.5, 0, 20), v(-1.5, 0, 20)], true);
      const fleet: [number, number][] = [[0xf3b81c, 0], [0xf3b81c, 22], [0x1d1f22, 41], [0xf3b81c, 63], [0xf3b81c, 85], [0x8a1c1c, 104], [0xf3b81c, 124]];
      for (const [paint, off] of fleet) {
        const car = carBox(k, 0, 0, 0, paint);
        if (!ctx.reduced) k.rider(car, loop, 2.6, off);
        else { const len = loop.getLength(); loop.getPointAt((off % len) / len, car.position); }
      }
    }
    /* the zipper: a news ribbon running round the tower, as the Times started it on November 6, 1928 */
    if (typeof window !== 'undefined' && typeof HTMLImageElement !== 'undefined') {
      const zt = X.signText('NEW YORKERS BY MLOW   +++   THE CENSUS COUNTED EVERY ONE   +++   OPEN AFTER MIDNIGHT   +++   ', 2048, 96, '#050607', '#ffb43a', 64, { align: 'left' });
      zt.wrapS = T.RepeatWrapping;
      zt.repeat.x = 0.6;
      const zm = new T.MeshBasicMaterial({ map: zt });
      for (const [w, x, z, ry] of [[14.2, 0, TW + 0.12, 0], [10.2, -7.12, ZC - L / 2 - 12, -PI / 2], [10.2, 7.12, ZC - L / 2 - 12, PI / 2]] as [number, number, number, number][]) k.mesh(new T.PlaneGeometry(w, 1.1), zm, x, 11.4, z, true).rotation.y = ry;
      if (!ctx.reduced) k.ticks.push((_t, dt) => { zt.offset.x = (zt.offset.x + dt * 0.045) % 1; });
    }
    k.box(14.6, 1.5, 10.6, 0, 11.4, ZC - L / 2 - 12, steel);
    /* chase lights round the NEW YORKERS sign on the tower: 96 bulbs, every third lit in turn */
    {
      const pts: T.Vector3[] = [];
      for (let i = 0; i < 32; i++) { const x = -6.4 + (12.8 * i) / 31; pts.push(v(x, 32.4, TW + 0.15), v(x, 23.6, TW + 0.15)); }
      for (let i = 1; i < 16; i++) { const y = 23.6 + (8.8 * i) / 16; pts.push(v(-6.4, y, TW + 0.15), v(6.4, y, TW + 0.15)); }
      const bulbs = new T.InstancedMesh(new T.SphereGeometry(0.11, 8, 6), new T.MeshBasicMaterial({ color: 0xffffff }), pts.length);
      const m = new T.Matrix4(), on = new T.Color(0xfff0c0), off = new T.Color(0x3a2a18);
      pts.forEach((p, i) => { bulbs.setMatrixAt(i, m.makeTranslation(p.x, p.y, p.z)); bulbs.setColorAt(i, i % 3 ? off : on); });
      k.add(bulbs);
      let step = 0;
      if (!ctx.reduced) k.ticks.push((t) => { const s = Math.floor(t * 6) % 3; if (s === step) return; step = s; for (let i = 0; i < pts.length; i++) bulbs.setColorAt(i, (i + s) % 3 ? off : on); bulbs.instanceColor!.needsUpdate = true; });
    }
    /* the trick: a lenticular sign, after the tabula scalata turning pictures. Sixty vertical prism slats carry one
       message on their left faces and another on their right: walk across the plaza and it turns */
    {
      const N = 60, W = 11, H = 3.4, cx = 0, cy = 7.2, z0 = TW + 0.25, w = W / N, d = (w / 2) * Math.tan((38 * PI) / 180);
      const g = new T.BufferGeometry(), pos: number[] = [], uv: number[] = [];
      for (let i = 0; i < N; i++) {
        const x0 = cx - W / 2 + i * w, u0 = i / N, u1 = (i + 1) / N;
        const L0 = [x0, cy - H / 2, z0], L1 = [x0, cy + H / 2, z0], A0 = [x0 + w / 2, cy - H / 2, z0 + d], A1 = [x0 + w / 2, cy + H / 2, z0 + d], R0 = [x0 + w, cy - H / 2, z0], R1 = [x0 + w, cy + H / 2, z0];
        pos.push(...L0, ...A0, ...A1, ...L0, ...A1, ...L1);
        uv.push(u0, 0, u1, 0, u1, 1, u0, 0, u1, 1, u0, 1);
        pos.push(...A0, ...R0, ...R1, ...A0, ...R1, ...A1);
        uv.push(u0, 0, u1, 0, u1, 1, u0, 0, u1, 1, u0, 1);
      }
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      g.computeVertexNormals();
      for (let i = 0; i < N; i++) { g.addGroup(i * 12, 6, 0); g.addGroup(i * 12 + 6, 6, 1); }
      const dom = typeof window !== 'undefined' && typeof HTMLImageElement !== 'undefined';
      const ta = dom ? new T.MeshBasicMaterial({ map: X.signText('NEW YORKERS', 1024, 316, '#c33064', '#ffffff', 170) }) : k.glow(0xc33064);
      const tb = dom ? new T.MeshBasicMaterial({ map: X.signText('BY MLOW', 1024, 316, '#2654b9', '#ffffff', 220) }) : k.glow(0x2654b9);
      k.mesh(g, [ta, tb] as unknown as T.Material, 0, 0, 0, true);
      k.box(W + 0.4, H + 0.4, 0.3, cx, cy, TW + 0.1, steel);
      k.egg(v(cx, cy, z0), { id: 'times-lenticular', title: 'The sign that turns', year: '1906', text: 'The red and blue sign over the steps is two signs at once: sixty prism slats show one message to the left of the plaza and another to the right. Corrugated turning pictures, tabula scalata, were popular in England from the sixteenth century, and in 1906 H. C. J. Deeks patented a postcard that did it with fine vertical ridges pressed into photographic paper.', clue: 'Walk from one side of the plaza to the other and watch the sign above the red steps.', source: { name: 'Lenticular printing, Wikipedia', url: 'https://en.wikipedia.org/wiki/Lenticular_printing' } }, { r: 2.2 });
    }
    /* the sidewalk: a coffee cart, a newsstand rack and the counted department's barriers (NEW YORKERS edits of CC0 models) */
    glbs(k, 'times/nyb_coffeecart', { height: 1.9 }, [[-7.6, 0.14, -8, PI / 2]]);
    glbs(k, 'times/nyb_naked_newsstand', { height: 1.8 }, [[7.9, 0.14, -36, -PI / 2]]);
    glbs(k, 'times/nyb_barrier', { width: 1.6 }, [[-4.2, 0, -52.5, 0.1], [-2.4, 0, -52.8, -0.05], [4.0, 0, -52.6, 0.08]]);
    k.keepOut.push({ x: -7.6, z: -8, r: 1.2 }, { x: 7.9, z: -36, r: 0.8 });
    /* Firefly plate, queued: a lit spectacular high on the first building on the left */
    fireflyPlate(k, 'assets/museum/tex/times/ff_spectacular.webp', 9.2, 4.2, -11.93, 23.2, 8, PI / 2, new T.MeshBasicMaterial({ visible: false }), true);
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
      deck = scan(k, 'ferry', 'metal_plate', 0.5, () => X.steel(0x5f6a63, true, 5), { metalness: 0.35, color: 0xb4b8b4 }),   // 2026-11-23: scanned tread plate (Poly Haven CC0)
      white = k.pbr('cabin', X.plaster(0xeeeae0, 6), 0.5, { roughness: 0.6 }),
      rail = k.flat(0xf1eee6, 0.4, 0.5),
      navy = k.flat(0x1a3446, 0.5, 0.5),
      glassDark = k.glass(0x9ec9d8, 0.35, 0.1),
      teak = scan(k, 'ferry', 'wood_floor_deck', 1.8, () => X.planks(0x8a6640, 4, 7));
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
      /* the real ferry bench (a NEW YORKERS edit of Poly Haven CC0 models) facing the water */
      const seats: [number, number, number, number][] = [];
      for (let z = -6; z > ZC - L / 2 + 8; z -= 16) { seats.push([s * 6.6, 0, z, s > 0 ? PI / 2 : -PI / 2]); k.keepOut.push({ x: s * 6.6, z: z - 1.3, r: 0.8 }, { x: s * 6.6, z: z + 1.3, r: 0.8 }); }
      glbs(k, 'ferry/nyb_ferry_bench', { width: 4.2 }, seats);
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
    /* ---- THE BIG UPGRADE (2026-11-23) ---- */
    /* the upper deck overhang: on the real boats the side promenades run under the deck above, white underneath with
       an orange fascia, carried on stanchions at the rail */
    for (const s of [-1, 1]) {
      const x = s * 8.75;
      k.box(8.3, 0.26, L - 8, x, 4.78, ZC, white);
      k.box(0.12, 0.62, L - 8, s * 12.86, 4.75, ZC, orange);
      k.box(0.2, 0.07, L - 2, s * 12.85, 1.6, ZC, teak);   // the scanned teak handrail cap on the rail
      k.box(0.12, 0.14, L - 8, s * 12.86, 5.12, ZC, rail);
      for (let z = 6; z > ZC - L / 2 + 4; z -= 6.4) {
        k.cyl(0.09, 4.4, s * 12.62, 2.42, z, rail, 0.09, 10);
        k.box(1.2, 0.05, 0.22, x + s * 1.2, 4.64, z - 3.2, k.glow(0xfff2d6));
      }
      for (let z = 4; z > ZC - L / 2 + 4; z -= 1.6) k.box(8.2, 0.1, 0.08, x, 4.62, z, k.flat(0xd8d4ca, 0.2, 0.6));
    }
    /* a sister boat passes the other way to starboard, and gulls ride the wind over the deck */
    {
      const boat = new T.Group();
      k.add(boat);
      glbs(k, 'h_ferry', { length: 94 }, [[0, 0, 0, 0]], (os) => { k.scene.remove(os[0]); boat.add(os[0]); });
      const lane = k.spline([v(85, -3.4, 220), v(82, -3.4, -40), v(85, -3.4, -320), v(260, -3.4, -320), v(260, -3.4, 220)], true);
      if (!ctx.reduced) k.rider(boat, lane, 7.5, 120); else { boat.position.set(82, -3.4, -60); boat.rotation.y = PI; }
      glbs(k, 'gull', { width: 1.1 }, [0, 1, 2, 3, 4, 5].map((i) => [i * 3, 11 + i, -20, 0] as [number, number, number, number]), (os) => {
        if (ctx.reduced) return;
        k.ticks.push((t) => os.forEach((o, i) => {
          const a = t * (0.22 + i * 0.03) + i * 1.1, r = 12 + i * 2.2;
          o.position.set(Math.cos(a) * r, 11 + i * 0.9 + Math.sin(t * 0.7 + i) * 0.8, -20 + Math.sin(a) * r * 1.5);
          o.rotation.set(0, -a, Math.sin(t * 1.3 + i) * 0.25);
        }));
      });
    }
    // the harbour: Liberty, distant islands, the skyline ahead, buoys
    liberty(k, -64, -3, -120, 1.6, [0, -40]);
    /* the credit her model's licence asks for, on the port rail beside the Liberty egg */
    k.sign(LIBERTY_CREDIT, 3.4, 0.42, -12.2, 1.25, -36, '#1a3446', '#fff3d5', 46, PI / 2);
    for (const [x, z] of [[-40, -60], [50, -90], [30, -40]]) k.prop('buoy', x, -2.9, z, { height: 2.4 });
    /* the trick: Liberty in a ring. A brass ring on a post by the port rail, sized and placed from one spot on the deck
       so that from the brass mark the whole figure, 93 m off, stands exactly inside a hoop a hand across */
    {
      const E = v(-10.4, 3, -42), L0 = v(-64, 9.8, -120), L1 = v(-64, 29.6, -120), mid = L0.clone().add(L1).multiplyScalar(0.5);
      const dir = mid.clone().sub(E), dist = dir.length(), at = 2.4, c = E.clone().addScaledVector(dir.normalize(), at);
      const r = ((L1.y - L0.y) / 2 / dist) * at * 1.08, brass = k.flat(0xc59a4a, 0.9, 0.28);
      const ring = k.mesh(new T.TorusGeometry(r, 0.022, 8, 40), brass, c.x, c.y, c.z, true);
      ring.lookAt(E);
      k.cyl(0.03, c.y - r, c.x, (c.y - r) / 2, c.z, brass);
      k.keepOut.push({ x: c.x, z: c.z, r: 0.35 });
      k.cyl(0.3, 0.03, E.x, 0.015, E.z, brass, 0.3, 24);
      k.sign('STAND HERE', 0.6, 0.12, E.x + 0.4, 0.035, E.z, 'transparent', '#f3e0b0', 90, -PI / 2);
      k.egg(c, { id: 'ferry-liberty-ring', title: 'A statue in a hoop', year: '1886', text: 'From the brass mark the whole figure stands inside a ring no wider than a hand, because at this distance she covers less of your view than the ring does. The copper statue is 151 feet 1 inch tall, and from the ground to the tip of the torch, pedestal and all, the monument rises 305 feet 1 inch. She was dedicated on October 28, 1886.', clue: 'Find the brass mark near the port rail and look through the ring.', source: { name: 'Statue of Liberty, Wikipedia', url: 'https://en.wikipedia.org/wiki/Statue_of_Liberty' } }, { r: 1.4 });
    }
    /* Firefly plate, queued: a painted sunset harbour, Lower Manhattan from the water, behind the code skyline */
    fireflyPlate(k, 'assets/museum/tex/ferry/ff_harbor_backdrop.webp', 700, 170, 0, 60, -300, 0, new T.MeshBasicMaterial({ visible: false }), true);

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
