/* Rooms 07 to 11: Botanical Garden, Moynihan, Grand Central, High Line, Coney Island. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Kit } from '../kit';
import { corridorMounts } from './types';
import type { RoomDef } from './types';

const PI = Math.PI;

/* A glazed barrel vault with ribs and purlins, the glasshouse and train hall shell. */
function glassVault(k: Kit, p: { z0: number; z1: number; halfW: number; base: number; rise: number; rib: T.Material; glass: T.Material; pitch?: number; purlins?: number }) {
  const { z0, z1, halfW, base, rise, rib, glass, pitch = 3, purlins = 9 } = p;
  const seg = 28;
  const shell = new T.BufferGeometry(), pos: number[] = [], idx: number[] = [];
  for (const z of [z0, z1]) for (let i = 0; i <= seg; i++) { const t = (i / seg) * PI; pos.push(Math.cos(t) * halfW, base + Math.sin(t) * rise, z); }
  for (let i = 0; i < seg; i++) idx.push(i, i + seg + 1, i + 1, i + 1, i + seg + 1, i + seg + 2);
  shell.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  shell.setIndex(idx);
  shell.computeVertexNormals();
  k.mesh(shell, glass);
  for (let z = z0; z >= z1; z -= pitch) {
    const pts = Array.from({ length: seg + 1 }, (_, i) => { const t = (i / seg) * PI; return v(Math.cos(t) * halfW, base + Math.sin(t) * rise, z); });
    k.curve(pts, 0.09, rib, seg);
  }
  for (let i = 0; i <= purlins; i++) {
    const t = (i / purlins) * PI;
    k.box(0.07, 0.07, Math.abs(z0 - z1), Math.cos(t) * halfW, base + Math.sin(t) * rise, (z0 + z1) / 2, rib);
  }
}

/* ---------------- 07 NEW YORK BOTANICAL GARDEN ---------------- */
export const botanical: RoomDef = {
  id: 'botanical',
  name: 'The living city',
  area: 'NEW YORK BOTANICAL GARDEN',
  mood: 'Morning light',
  color: '#a4c7a1',
  description: 'A glass conservatory nave under a great dome, palms and lily water, the census set among the planting.',
  signatures: 'The glazed nave and central dome with lantern, white iron ribs, tropical planting and a still pool.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ed0, horizon: 0xdfe9ec, ground: 0x6a7a62, fog: 0.0035, sun: { az: 1.2, el: 0.7, color: 0xfff1d0, size: 14 }, env: 0.9 });
    k.hemi(0xe8f2ff, 0x3c4a35, 0.95);
    k.sun(0xfff0d6, 2.4, 20, 50, 10, true, 60);
    const iron = k.pbr('whiteIron', X.steel(0xe6e8e2, false, 2), 0.6, { metalness: 0.5, roughness: 0.4 }),
      glass = k.glass(0xcfe6ec, 0.16, 0.08),
      brickF = k.pbr('herring', X.brick(0x8b5a44, 5), 0.34, { roughness: 0.8 }),
      whiteBrick = k.pbr('whitebrick', X.brick(0xdedad0, 6), 0.3),
      soil = k.flat(0x3b2e24, 0, 1),
      stone = k.pbr('pondEdge', X.ashlar(0xb3ada0, 5, 2), 0.4),
      water = k.flat(0x2f5e5a, 0.6, 0.15, { transparent: true, opacity: 0.9 }),
      green = k.flat(0x3f6a3a, 0, 0.95),
      pad = k.flat(0x4c7a3d, 0, 0.9),
      pink = k.flat(0xe6a9c8, 0, 0.7);
    const L = 76, ZC = 12 - L / 2;
    k.box(30, 0.4, L + 4, 0, -0.2, ZC, brickF);
    glassVault(k, { z0: 14, z1: ZC - L / 2 - 2, halfW: 14, base: 7.5, rise: 8, rib: iron, glass, pitch: 3, purlins: 10 });
    for (const s of [-1, 1]) {
      k.box(0.12, 7.5, L + 4, s * 14, 3.75, ZC, glass);
      for (let z = 14; z > ZC - L / 2 - 2; z -= 3) k.box(0.14, 7.5, 0.14, s * 14, 3.75, z, iron);
      for (const y of [2.5, 5, 7.4]) k.box(0.1, 0.1, L + 4, s * 14, y, ZC, iron);
      k.box(0.5, 1.2, L + 4, s * 14, 0.6, ZC, whiteBrick);
    }
    // the dome and lantern
    const dz = -34;
    const dome = k.mesh(new T.SphereGeometry(13.6, 40, 20, 0, PI * 2, 0, PI / 2), glass, 0, 7.5, dz);
    dome.scale.y = 1.15;
    for (let i = 0; i < 16; i++) {
      const a = (i * PI) / 8, pts = [];
      for (let j = 0; j <= 14; j++) { const b = ((j / 14) * PI) / 2; pts.push(v(Math.cos(a) * Math.sin(b) * 13.6, 7.5 + Math.cos(b) * 15.6, dz + Math.sin(a) * Math.sin(b) * 13.6)); }
      k.curve(pts, 0.09, iron, 20);
    }
    for (const [r, y] of [[13.4, 9.5], [12.2, 13], [9.8, 17.2], [6.4, 20.6], [2.4, 22.6]]) k.torus(r, 0.06, 0, y, dz, iron, 64).rotation.x = PI / 2;
    k.lathe([[1.9, 0], [1.9, 0.2], [1.5, 0.3], [1.5, 2.4], [1.2, 2.7], [0.5, 3.6], [0.1, 4]], 0, 22.6, dz, glass, 24);
    for (let i = 0; i < 12; i++) { const a = (i * PI) / 6; k.beam(v(Math.cos(a) * 1.5, 22.8, dz + Math.sin(a) * 1.5), v(Math.cos(a) * 1.5, 25, dz + Math.sin(a) * 1.5), 0.05, iron, 5); }
    k.lathe([[0.2, 0], [0.25, 0.3], [0.08, 0.7], [0.03, 1.4]], 0, 26.4, dz, k.flat(0xc9a44a, 0.8, 0.3), 12);
    for (let i = 0; i < 8; i++) { const a = (i * PI) / 4; k.column(Math.cos(a) * 12.2, 0, dz + Math.sin(a) * 12.2, 7.2, 0.24, iron, false); }
    // planting beds and the white garden walls carrying the works
    for (const s of [-1, 1]) {
      k.box(5, 0.7, L - 4, s * 11.4, 0.35, ZC, whiteBrick);
      k.box(4.6, 0.1, L - 4.4, s * 11.4, 0.72, ZC, soil);
      for (let z = 8; z > ZC - L / 2 + 6; z -= 6.4) {
        k.tree(s * 12.6, 0.7, z - 3.2, { kind: 'palm', h: 5.2 + (Math.abs(z) % 3), r: 2.2, leaf: 0x3d7a3a });
        for (let j = 0; j < 5; j++) k.sphere(0.5, s * 10.4 + (j % 2) * s * 0.7, 1.05, z - 0.8 - j * 0.9, green, 8);
        for (let j = 0; j < 3; j++) k.sphere(0.32, s * 12.8, 1.0, z - 4 + j * 0.6, j % 2 ? pink : green, 8);
      }
    }
    for (let i = 0; i < 20; i++) {
      const s = i % 2 ? 1 : -1, z = 2 - Math.floor(i / 2) * 6.4;
      k.box(0.5, 4.2, 6.2, s * 9.4, 2.8, z, whiteBrick);
      k.box(0.8, 0.2, 6.4, s * 9.4, 4.95, z, whiteBrick);
      for (let j = -2.6; j <= 2.6; j += 0.5) k.sphere(0.28 + (Math.abs(j) % 0.3), s * 9.4 + (j % 1) * s * 0.3, 5.1, z + j, green, 7);
    }
    // the lily pool under the dome, enamel trees as the garden's sculpture
    k.cyl(6.2, 0.6, 0, 0.3, dz, stone, 6.2, 48);
    k.cyl(5.7, 0.6, 0, 0.36, dz, water, 5.7, 48);
    k.keepOut.push({ x: 0, z: dz, r: 6.6 });
    const rnd = X.mulberry(3);
    for (let i = 0; i < 26; i++) {
      const a = rnd() * PI * 2, r = 1 + rnd() * 4.4, x = Math.cos(a) * r, z = dz + Math.sin(a) * r;
      k.cyl(0.35 + rnd() * 0.3, 0.03, x, 0.68, z, pad, 0.35, 12);
      if (i % 3 === 0) for (let p = 0; p < 7; p++) { const o = k.sphere(0.12, x + Math.cos((p * 6.28) / 7) * 0.12, 0.78, z + Math.sin((p * 6.28) / 7) * 0.12, p % 2 ? pink : k.flat(0xf3ead6, 0, 0.7), 6); o.scale.set(0.6, 0.35, 1.3); o.rotation.y = -(p * 6.28) / 7; }
    }
    k.lathe([[0.6, 0], [0.5, 0.3], [0.2, 0.5], [0.15, 1.4], [0.9, 1.6], [0.9, 1.75], [0.1, 1.85], [0.1, 2.4]], 0, 0.6, dz, stone, 24);
    k.point(0, 6, dz, 0xfff4dc, 30, 22);
    for (const [x, z] of [[-6.5, -14], [6.5, -14], [-6.5, -54], [6.5, -54]]) { k.plinth(x, z, 2.2, 0.8, 2.2, whiteBrick); k.prop('tree', x, 0.88, z, { height: 5.2 }); }
    for (const [x, z] of [[-6.5, 6], [6.5, 6]]) { k.plinth(x, z, 1.3, 0.9, 1.3, whiteBrick); k.prop('lantern', x, 0.98, z, { height: 1.0 }); k.point(x, 2.4, z, 0xffe0b0, 12, 9); }
    for (const z of [-6, -24, -44]) { k.bench(-4.6, z, 0, k.pbr('benchG', X.planks(0x6a5a45, 3, 6), 1.2), iron, 2.4); k.bench(4.6, z, PI, k.pbr('benchG', X.planks(0x6a5a45, 3, 6), 1.2), iron, 2.4); }
    // the apse and herbarium wall at the far end
    k.box(30, 8, 1, 0, 4, ZC - L / 2 - 1.5, whiteBrick);
    k.sign('ENID A. HAUPT CONSERVATORY', 9, 0.7, 0, 7.2, ZC - L / 2 - 0.95, '#3a5b48', '#f4edd4', 85, 0, { border: true });
    k.censusWall({ x: 0, y: 3.6, z: ZC - L / 2 - 0.95, rotY: 0, cols: 26, rows: 4, tile: 0.62, gap: 0.05, start: ctx.wallStart(1900, 104), pieces: ctx.all, backing: whiteBrick });
    k.box(30, 4, 1, 0, 2, 14, whiteBrick);
    k.box(30, 3.5, 1, 0, 9.5, 14, glass);
    k.sign('THE LIVING CITY', 6, 0.7, 0, 3.2, 13.45, '#3a5b48', '#f4edd4', 110, PI, { border: true });
    // easter eggs: the real conservatory and the garden around it
    const haupt = { name: 'Enid A. Haupt Conservatory, Wikipedia', url: 'https://en.wikipedia.org/wiki/Enid_A._Haupt_Conservatory' },
      nybg = { name: 'New York Botanical Garden, Wikipedia', url: 'https://en.wikipedia.org/wiki/New_York_Botanical_Garden' };
    k.egg(v(0, 19, dz), { id: 'botanical-kew', title: 'A palm house borrowed from London', year: '1902', text: 'The conservatory was designed by William R. Cobb of the glasshouse makers Lord & Burnham, with its major features inspired by the Palm House at Kew and Joseph Paxton\'s Crystal Palace. Ground was broken in January 1899 and the building was finished in 1902 for $177,000. The central Palm House dome rises 90 feet.', clue: 'Stand at the lily pool and look straight up into the dome.', source: haupt }, { r: 2.4 });
    k.egg(v(0, 7.2, ZC - L / 2 - 0.9), { id: 'botanical-haupt', title: 'Saved from the wrecking ball', year: '1978', text: 'By the 1970s the glasshouse was in such poor shape that it faced demolition. Enid A. Haupt gave $5 million to renovate it and another $5 million to endow its upkeep, and it was renamed in her honor in 1978. The city had already made it a landmark in 1976.', clue: 'Read the name over the far wall.', source: haupt }, { r: 1.6 });
    k.egg(v(-7.6, 6.2, -2), { id: 'botanical-pavilions', title: 'Eleven climates in a row', text: 'The real conservatory is not one hall but a 512 foot C of eleven glass pavilions arranged symmetrically around the Palm House. Each pavilion holds plants from a different climate, with its own temperature and humidity, and the 1997 redesign walks you from wet mountain slopes through rainforest to desert.', clue: 'Look along the glass nave from the entrance.', source: haupt }, { r: 1.6 });
    k.egg(v(11, 9.5, -20), { id: 'botanical-panes', title: 'Bigger glass for the palms', text: 'Most of the conservatory is glazed in 16 inch panes, but the Palm House uses larger 20 inch glass. The heat and humidity the palms, cycads and ferns need is hard on the frame, which is why the dome keeps needing work: it was renovated again in May 2019.', clue: 'Look up at the glazing above the garden walls.', source: haupt }, { r: 1.8 });
    k.egg(v(-6.5, 3.6, -14), { id: 'botanical-forest', title: 'The forest that was always here', text: 'Outside the glass, the Garden keeps a 50 acre tract of old growth forest that was never logged, the largest remnant of the forest that once covered all of New York City. Its oaks, beeches, tulip trees and white ash include trees more than two centuries old, and the Bronx River, the city\'s only freshwater river, runs through it.', clue: 'Find the tree on its plinth near the start of the nave.', source: nybg }, { r: 1.6 });
    k.egg(v(-4, 2.4, ZC - L / 2 - 0.9), { id: 'botanical-herbarium', title: 'Millions of pressed plants', text: 'The Garden\'s William and Lynda Steere Herbarium holds roughly 7.8 million plant specimens. The Garden itself was founded by the state legislature in 1891, after Nathaniel Lord Britton and Elizabeth Gertrude Britton set out to give New York its own answer to Kew.', clue: 'The far wall of tiles is a herbarium of New Yorkers.', source: nybg }, { r: 1.4 });
    const mounts = corridorMounts({ pairs: 10, x: 9.1, z0: 2, pitch: 6.4, y: 2.9, width: 5.2, height: 3.0, inset: 4.4, style: 'white' });
    for (const x of [-6.5, 6.5]) mounts.push({ position: v(x, 2.9, ZC - L / 2 + 3), rotation: 0, target: v(x, 3, ZC - L / 2 + 8.5), width: 4.6, height: 2.7, style: 'white', wash: false });
    for (const m of mounts.slice(20)) { k.box(5.2, 3.6, 0.3, m.position.x, 2.9, ZC - L / 2 + 2.8, whiteBrick); }
    return { mounts, spawn: v(0, 3, 9), look: v(0, 4, -34), eye: 3, bounds: [-8.2, 8.2, ZC - L / 2 + 5, 11], style: 'white' };
  },
};

/* ---------------- 08 MOYNIHAN TRAIN HALL ---------------- */
export const penn: RoomDef = {
  id: 'penn',
  name: 'Arrivals / departures',
  area: 'PENN / MOYNIHAN TRAIN HALL',
  mood: 'The morning rush',
  color: '#bddce7',
  description: 'Three steel trusses under a skylight, a hanging clock, departure boards that list New Yorkers instead of trains.',
  signatures: 'Exposed riveted trusses, the vaulted skylight lattice, the suspended Art Deco clock, limestone walls.',
  build(k, ctx) {
    k.sky({ top: 0x8fa9bf, horizon: 0xdde4e8, ground: 0x6d6f6c, fog: 0.004, sun: { az: 2.2, el: 0.9, color: 0xffffff, size: 12 }, env: 0.8 });
    k.hemi(0xe4ecf5, 0x4a4b46, 1.0);
    k.sun(0xfff6ea, 2.2, 6, 60, -20, true, 60);
    const terrazzo = k.pbr('terrazzo', X.terrazzo(0xd6d0c2, 2), 0.35, { roughness: 0.3 }),
      lime = k.pbr('limePenn', X.ashlar(0xc9c0ad, 4, 3), 0.2),
      steel = k.pbr('trussSteel', X.steel(0x3b4148, true, 7), 0.6, { metalness: 0.75, roughness: 0.4 }),
      glass = k.glass(0xd7ecf3, 0.14, 0.08),
      brass = k.pbr('brassP', X.gilt(0xc9a55a), 2, { metalness: 0.85, roughness: 0.3 }),
      walnut = k.pbr('walnut', X.planks(0x5a3d2a, 4, 3), 1.2, { roughness: 0.5 }),
      dark = k.flat(0x141b22, 0.3, 0.6),
      opal = k.glow(0xfff1d2);
    const L = 76, ZC = 12 - L / 2;
    k.box(30, 0.4, L + 4, 0, -0.2, ZC, terrazzo);
    for (const s of [-1, 1]) {
      k.box(1.2, 14, L + 4, s * 12.6, 7, ZC, lime);
      k.moulding([[0, 0], [0.7, 0], [0.75, 0.2], [0.55, 0.4], [0.6, 0.6], [0.3, 0.8], [0, 0.9]], L + 4, s * 12 - s * 0.02, 13.6, ZC, lime, s > 0 ? PI : 0);
      for (let z = 8; z > ZC - L / 2; z -= 12.8) {
        k.arch(3.6, 6, 0.4, s * 11.95, 7, z - 3, lime, false, 0.62).rotation.y = s > 0 ? -PI / 2 : PI / 2;
        k.box(0.06, 5, 3.2, s * 11.9, 9.2, z - 3, glass);
        for (let dz = -1.2; dz <= 1.2; dz += 0.8) k.box(0.1, 5, 0.06, s * 11.88, 9.2, z - 3 + dz, dark);
        k.column(s * 11.5, 0.2, z, 13.2, 0.36, lime, true);
      }
    }
    // three trusses and the glazed lattice roof between them
    glassVault(k, { z0: 14, z1: ZC - L / 2 - 2, halfW: 12.6, base: 14, rise: 5.5, rib: steel, glass, pitch: 2.4, purlins: 8 });
    for (const z of [0, -22, -44]) {
      for (const y of [13.2, 16]) k.box(26, 0.35, 0.4, 0, y, z, steel);
      for (let x = -13; x < 13; x += 2) { k.bar(v(x, 13.2, z), v(x + 2, 16, z), 0.14, 0.12, steel); k.bar(v(x, 16, z), v(x + 2, 13.2, z), 0.14, 0.12, steel); }
      for (let x = -12; x <= 12; x += 4) k.box(0.2, 2.8, 0.4, x, 14.6, z, steel);
      const riv: T.Matrix4[] = [];
      for (let x = -12.5; x <= 12.5; x += 0.5) for (const y of [13.0, 16.2]) riv.push(new T.Matrix4().makeTranslation(x, y, z + 0.22));
      k.instances(new T.SphereGeometry(0.05, 6, 4), k.flat(0x8a8f96, 0.8, 0.35), riv);
    }
    // the hanging clock: Peter Pennoyer's 12 foot tall, 6 foot wide four sided case, pewter finish, from the centre truss
    const pewter = k.pbr('pewterP', X.steel(0xa3a6a4, false, 3), 0.6, { metalness: 0.8, roughness: 0.32 });
    k.beam(v(0, 13.2, -22), v(0, 11.6, -22), 0.1, pewter, 8);
    for (let j = 0; j < 4; j++) k.rounded(2.1 - j * 0.32, 0.2, 2.1 - j * 0.32, 0, 11.1 + j * 0.2, -22, pewter);
    for (let j = 0; j < 3; j++) k.rounded(2.1 - j * 0.32, 0.2, 2.1 - j * 0.32, 0, 7.6 - j * 0.2, -22, pewter);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(0.2, 3.6, 0.2, sx * 0.95, 9.4, -22 + sz * 0.95, pewter);
    for (let f = 0; f < 4; f++) {
      const g = new T.Group();
      g.position.set(0, 9.9, -22);
      g.rotation.y = (f * PI) / 2;
      g.scale.setScalar(0.68);
      const face = new T.Mesh(new T.CircleGeometry(1.05, 40), opal);
      face.position.z = 1.36;
      g.add(face);
      const ring = new T.Mesh(new T.TorusGeometry(1.05, 0.06, 8, 40), pewter);
      ring.position.z = 1.38;
      g.add(ring);
      for (let t = 0; t < 12; t++) { const tick = new T.Mesh(new T.BoxGeometry(0.03, t % 3 === 0 ? 0.22 : 0.12, 0.02), dark); const a = (t * PI) / 6; tick.position.set(Math.sin(a) * 0.86, Math.cos(a) * 0.86, 1.39); tick.rotation.z = -a; g.add(tick); }
      for (const [len, a] of [[0.6, -0.4], [0.42, 1.3]]) { const hand = new T.Mesh(new T.BoxGeometry(0.03, len, 0.02), dark); hand.position.set((Math.sin(a) * len) / 2, (Math.cos(a) * len) / 2, 1.41); hand.rotation.z = -a; g.add(hand); }
      k.add(g);
    }
    k.box(1.8, 3.6, 1.8, 0, 9.4, -22, pewter);
    k.point(0, 7.0, -22, 0xfff0d0, 40, 20);
    // The Hive over the 31st Street entry: an upside down mirrored city hanging from the ceiling
    const mirror = k.flat(0xdfe4ea, 1.0, 0.08), hrnd = X.mulberry(31);
    for (let i = 0; i < 18; i++) { const h = 0.8 + hrnd() * 2.6, w = 0.35 + hrnd() * 0.5; k.box(w, h, w, -9.6 + (i % 6) * 0.75 + hrnd() * 0.2, 14 - h / 2, 8.4 + Math.floor(i / 6) * 1.3, mirror); }
    // Go, the backlit stained glass ceiling over the 33rd Street entry (colour field only, no figures)
    k.box(4.2, 0.08, 3.2, 7.8, 13.9, 10.2, k.glow(0x9cc3e6));
    for (const dx of [-0.7, 0.7]) k.box(0.06, 0.1, 3.2, 7.8 + dx, 13.85, 10.2, dark);
    // departure boards: the census as a timetable
    for (const z of [-10, -34]) {
      k.box(8, 3.4, 0.3, 0, 7.4, z, dark);
      k.sign('DEPARTURES  ·  ALL NEW YORKERS  ·  ON TIME', 7.6, 0.5, 0, 8.8, z + 0.17, '#0f1a24', '#ffffff', 60, 0);
      const rows = ctx.pieces.slice(60 + (z === -10 ? 0 : 6), 66 + (z === -10 ? 0 : 6));
      rows.forEach((p, j) => k.sign(`${String(p.n).padStart(4, '0')}    ${p.t.slice(0, 34).toUpperCase().padEnd(36, ' ')}   ${(p.nb || p.b || '').toUpperCase().slice(0, 18)}`, 7.6, 0.38, 0, 8.2 - j * 0.42, z + 0.17, '#0f1a24', '#ead78a', 44, 0, { font: '600', align: 'left' } as never));
    }
    for (const s of [-1, 1]) for (const z of [2, -20, -42]) {
      k.rounded(1.6, 0.2, 3.4, s * 6.4, 0.85, z, walnut);
      for (let j = 0; j < 10; j++) k.box(1.5, 0.04, 0.03, s * 6.4, 0.96, z - 1.5 + j * 0.32, dark);
      for (const dz of [-1.4, 1.4]) k.box(1.4, 0.1, 0.1, s * 6.4, 0.42, z + dz, dark);
      k.keepOut.push({ x: s * 6.4, z, r: 2 });
      k.sign('TRACKS  ' + (s > 0 ? '1 · 10' : '11 · 21'), 2.2, 0.5, s * 6.4, 2.3, z + 1.9, '#173141', '#ffffff', 90, 0, { border: true, double: true });
    }
    for (const z of [-4, -28, -52]) for (const s of [-1, 1]) k.point(s * 7, 11, z, 0xfff6e8, 22, 20);
    // end walls and the great board
    k.box(30, 14, 1.2, 0, 7, ZC - L / 2 - 1, lime);
    k.box(30, 14, 1.2, 0, 7, 14.5, lime);
    k.sign('MOYNIHAN TRAIN HALL', 10, 0.9, 0, 12.2, ZC - L / 2 - 0.35, '#273f4c', '#ffffff', 85, 0, { border: true });
    k.censusWall({ x: 0, y: 7.6, z: ZC - L / 2 - 0.35, rotY: 0, cols: 30, rows: 5, tile: 0.62, gap: 0.05, start: ctx.wallStart(600, 150), pieces: ctx.all, backing: dark });
    k.sign('ARRIVALS  ·  THE CITY', 8, 0.8, 0, 11, 13.85, '#273f4c', '#ffffff', 90, PI, { border: true });
    // easter eggs: the post office under the train hall
    const asce = { name: 'How New York\'s Moynihan Train Hall brings back glamour to train travel, ASCE Civil Engineering', url: 'https://asce.org/publications-and-news/civil-engineering-source/civil-engineering-magazine/issues/magazine-issue/article/2022/03/how-new-yorks-moynihan-train-hall-brings-back-glamour-to-train-travel' },
      timeout = { name: 'Three astonishing works of art are inside the new Moynihan Train Hall, Time Out New York', url: 'https://www.timeout.com/newyork/news/three-astonishing-works-of-art-are-inside-the-new-moynihan-train-hall-123020' };
    k.egg(v(0, 14.6, 0), { id: 'penn-trusses', title: 'Catwalks for postal inspectors', year: '1912', text: 'The hall was the mail sorting room of the Farley Post Office, a column free space spanned by three riveted steel trusses, each 150 feet long and 50 feet apart. Each truss is really two parallel bents about 3 feet apart, and the gap between them served as an overhead gallery for postal inspectors watching the floor below.', clue: 'Look up into the nearest truss.', source: asce }, { r: 2 });
    k.egg(v(0, 18.2, -11), { id: 'penn-blackout', title: 'A skylight that went dark', text: 'The mailroom roof had skylights, but they were blacked out during the Second World War and later replaced with concrete slabs. The new roof is four catenary glass vaults rising 92 feet, and removing the slabs between the old floor levels added 20 feet of height.', clue: 'Look up between the first and second trusses.', source: asce }, { r: 2 });
    k.egg(v(0, 9.4, -22), { id: 'penn-clock', title: 'A clock for meeting under', year: '2021', text: 'The hall\'s clock was designed by Peter Pennoyer Architects: a 12 foot tall case with stepped, Art Deco extensions and a pewter like finish that catches the daylight from the skylight. Its numerals use a typeface designed in 1936 for road and railroad signage, and Americlock made the clockworks and faces.', clue: 'Meet under the clock on the centre truss.', source: { name: 'Moynihan Train Hall Clock, Peter Pennoyer Architects', url: 'https://www.ppapc.com/projects/mthclock/' } }, { r: 2 });
    k.egg(v(-7.6, 12.4, 9.7), { id: 'penn-hive', title: 'The city hanging upside down', year: '2020', text: 'Over the 31st Street entrance hangs The Hive by Elmgreen and Dragset: an upside down cityscape of 91 small buildings, each about 9 feet tall, dangling like glowing stalactites. It weighs more than 30,000 pounds and is lit by 72,000 LEDs.', clue: 'Look up at the ceiling near the entrance, on the left.', source: timeout }, { r: 2 });
    k.egg(v(7.8, 13.6, 10.2), { id: 'penn-go', title: 'Breakdancers in the clouds', year: '2020', text: 'Over the 33rd Street entrance Kehinde Wiley made Go, a hand painted, backlit stained glass triptych modelled on Tiepolo\'s ceiling frescoes. It shows young Black New Yorkers in breakdance poses among clouds, pigeons and a jet plane. In the ticketed waiting room nearby, Stan Douglas restaged nine forgotten moments of the old Penn Station in photographs.', clue: 'Look up at the glowing ceiling near the entrance, on the right.', source: timeout }, { r: 2 });
    k.egg(v(-6, 11, 13.8), { id: 'penn-motto', title: 'Neither snow nor rain', year: '1912', text: 'The Eighth Avenue front of the Farley Building carries the line about couriers that neither snow nor rain nor heat nor gloom of night stays from their appointed rounds. The words come from Herodotus, describing the mounted messengers of Xerxes, and the Treasury picked it for the building in 1912. The facade behind it has 20 Corinthian columns, each 53 feet tall.', clue: 'Turn around to the entrance wall and picture the street front beyond it.', source: { name: 'James A. Farley Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/James_A._Farley_Building' } }, { r: 1.8 });
    const mounts = corridorMounts({ pairs: 10, x: 11.9, z0: 2, pitch: 6.4, y: 3.5, width: 5.6, height: 3.2, inset: 5.4, style: 'steel' });
    for (const x of [-6.6, 6.6]) mounts.push({ position: v(x, 3.4, ZC - L / 2 - 0.35), rotation: 0, target: v(x, 3, ZC - L / 2 + 6), width: 5.4, height: 3.1, style: 'steel' });
    for (const x of [-6.6, 6.6]) mounts.push({ position: v(x, 3.4, 13.85), rotation: PI, target: v(x, 3, 8), width: 5.4, height: 3.1, style: 'steel' });
    return { mounts, spawn: v(0, 3, 10), look: v(0, 6, -30), eye: 3, bounds: [-10.6, 10.6, ZC - L / 2 + 2, 12.5], style: 'steel' };
  },
};

/* ---------------- 09 GRAND CENTRAL ---------------- */
export const grand: RoomDef = {
  id: 'grand',
  daylit: false,
  name: 'Under the stars',
  area: 'GRAND CENTRAL TERMINAL',
  mood: 'Timeless',
  color: '#b6c5ad',
  description: 'The concourse under a celestial vault, light falling through the great arched windows, the brass clock at the centre.',
  signatures: 'The green celestial ceiling with gold constellations, the arched east and west windows, the opal faced clock on the information booth, marble everywhere.',
  build(k, ctx) {
    k.sky({ top: 0x3d5450, horizon: 0x6e7e72, ground: 0x2c2a26, fog: 0.005, env: 0.6 });
    k.hemi(0xe5dcc4, 0x2e2a22, 0.7);
    k.sun(0xffe9c0, 1.6, 30, 40, -10, true, 60);
    const marble = k.pbr('tennessee', X.marble(0xd9c9b8, 0xa08c78, 2), 0.28, { roughness: 0.28 }),
      lime = k.pbr('limeGC', X.ashlar(0xc7b998, 5, 3), 0.18),
      brass = k.pbr('brassGC', X.gilt(0xc8a45a), 2, { metalness: 0.85, roughness: 0.28 }),
      teal = k.pbr('vaultGC', X.plaster(0x3f7a6e, 4), 0.2, { roughness: 0.9, side: T.DoubleSide }),
      dark = k.flat(0x1a2024, 0.4, 0.6),
      opal = k.glow(0xfff0cc),
      glass = k.glass(0xf3e6c8, 0.28, 0.1);
    const L = 76, ZC = 12 - L / 2, H = 22;
    k.box(30, 0.4, L + 4, 0, -0.2, ZC, marble);
    for (const s of [-1, 1]) {
      k.box(1.2, H, L + 4, s * 12.6, H / 2, ZC, lime);
      k.moulding([[0, 0], [0.9, 0], [0.95, 0.25], [0.7, 0.5], [0.75, 0.75], [0.35, 1.0], [0, 1.1]], L + 4, s * 12 - s * 0.02, 9.2, ZC, lime, s > 0 ? PI : 0);
      for (const z of [0, -22, -44]) {
        k.arch(7, 10, 0.5, s * 11.85, 10.4, z, lime).rotation.y = s > 0 ? -PI / 2 : PI / 2;
        k.box(0.06, 9, 6.6, s * 11.8, 14.6, z, glass);
        for (let dz = -3; dz <= 3; dz += 0.75) k.box(0.12, 9, 0.06, s * 11.75, 14.6, z + dz, brass);
        for (let y = 11; y < 19.5; y += 1.4) k.box(0.12, 0.06, 6.6, s * 11.75, y, z, brass);
        for (const dz of [-4.6, 4.6]) k.column(s * 11.3, 0.1, z + dz, 20.4, 0.34, lime, true, brass);
        // shafts of light through the west windows
        if (s > 0) {
          const shaft = k.mesh(new T.PlaneGeometry(7, 22), new T.MeshBasicMaterial({ map: X.pool(), transparent: true, opacity: 0.35, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }), 6, 8, z, true);
          shaft.rotation.set(0, 0, 0.55);
          shaft.renderOrder = 3;
        }
      }
    }
    // the celestial vault
    const seg = 40, vault = new T.BufferGeometry(), pos: number[] = [], idx: number[] = [];
    for (const z of [14, ZC - L / 2 - 2]) for (let i = 0; i <= seg; i++) { const t = (i / seg) * PI; pos.push(Math.cos(t) * 12.6, H - 6 + Math.sin(t) * 7.5, z); }
    for (let i = 0; i < seg; i++) idx.push(i, i + seg + 1, i + 1, i + 1, i + seg + 1, i + seg + 2);
    vault.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    vault.setIndex(idx);
    vault.computeVertexNormals();
    k.mesh(vault, teal);
    for (let z = 12; z > ZC - L / 2; z -= 12) k.curve(Array.from({ length: 41 }, (_, i) => { const t = (i / 40) * PI; return v(Math.cos(t) * 12.4, H - 6 + Math.sin(t) * 7.3, z); }), 0.1, brass, 40);
    const rnd = X.mulberry(11), stars: { x: number; y: number; z: number }[] = [];
    for (let i = 0; i < 160; i++) {
      const t = 0.15 + rnd() * (PI - 0.3), z = 12 - rnd() * (L + 2), x = Math.cos(t) * 12.2, y = H - 6 + Math.sin(t) * 7.2;
      stars.push({ x, y, z });
      k.sphere(0.05 + rnd() * 0.07, x, y, z, opal, 6);
      if (i % 4 === 0 && stars.length > 2) { const p = stars[stars.length - 2 - Math.floor(rnd() * 2)]; if (Math.hypot(p.x - x, p.z - z) < 9) k.beam(v(x, y, z), v(p.x, p.y, p.z), 0.012, brass, 4); }
    }
    for (const [x, z, s] of [[-4, -8, 1.2], [5, -30, 1.5], [-3, -50, 1.1]]) for (let j = 0; j < 8; j++) { const a = (j * PI) / 4; const r = 0.6 * (s as number); const y = H - 6 + Math.sqrt(Math.max(0, 1 - ((x as number) / 12.6) ** 2)) * 7.2 - 0.05; k.beam(v(x as number, y, z as number), v((x as number) + Math.cos(a) * r, y - 0.1, (z as number) + Math.sin(a) * r), 0.015, brass, 4); }
    // information booth and the four faced clock
    k.lathe([[2.4, 0], [2.45, 0.15], [2.2, 0.25], [2.2, 1.3], [2.45, 1.4], [2.5, 1.55]], 0, 0, -26, brass, 40);
    for (let j = 0; j < 32; j++) { const t = (j * PI) / 16; k.beam(v(Math.cos(t) * 2.22, 0.25, -26 + Math.sin(t) * 2.22), v(Math.cos(t) * 2.22, 1.25, -26 + Math.sin(t) * 2.22), 0.025, dark, 5); }
    k.lathe([[0.5, 0], [0.5, 0.12], [0.26, 0.25], [0.18, 1.6], [0.36, 1.8], [0.36, 1.9]], 0, 1.55, -26, brass, 24);
    for (let f = 0; f < 4; f++) {
      const g = new T.Group();
      g.position.set(0, 4.1, -26);
      g.rotation.y = (f * PI) / 2;
      g.scale.setScalar(0.6);
      const face = new T.Mesh(new T.CircleGeometry(0.52, 36), opal);
      face.position.z = 0.56;
      g.add(face);
      const ring = new T.Mesh(new T.TorusGeometry(0.52, 0.045, 8, 36), brass);
      ring.position.z = 0.58;
      g.add(ring);
      for (let t = 0; t < 12; t++) { const tick = new T.Mesh(new T.BoxGeometry(0.02, t % 3 === 0 ? 0.1 : 0.06, 0.02), dark); const a = (t * PI) / 6; tick.position.set(Math.sin(a) * 0.42, Math.cos(a) * 0.42, 0.59); tick.rotation.z = -a; g.add(tick); }
      for (const [len, a] of [[0.3, -0.5], [0.22, 1.1]]) { const hand = new T.Mesh(new T.BoxGeometry(0.02, len, 0.02), dark); hand.position.set((Math.sin(a) * len) / 2, (Math.cos(a) * len) / 2, 0.61); hand.rotation.z = -a; g.add(hand); }
      k.add(g);
    }
    k.box(0.62, 0.62, 0.62, 0, 4.1, -26, brass);
    k.lathe([[0.3, 0], [0.2, 0.15], [0.1, 0.25], [0.2, 0.42], [0.04, 0.6]], 0, 4.41, -26, brass, 12);
    k.sign('INFORMATION', 3, 0.42, 0, 1.0, -23.48, '#a58c51', '#192d2b', 105, 0);
    k.keepOut.push({ x: 0, z: -26, r: 3.2 });
    k.point(0, 6, -26, 0xffe6b8, 30, 16);
    // chandeliers and the west stair at the far end
    // ten chandeliers, as in the real concourse (lights only on four of them, to keep the light count sane)
    for (const z of [4, -12, -28, -44, -58]) for (const s of [-1, 1]) {
      k.beam(v(s * 7, H - 5, z), v(s * 7, 8.5, z), 0.03, brass, 5);
      k.torus(0.9, 0.06, s * 7, 8.5, z, brass, 24).rotation.x = PI / 2;
      for (let j = 0; j < 10; j++) { const a = (j * PI) / 5; k.sphere(0.14, s * 7 + Math.cos(a) * 0.9, 8.5, z + Math.sin(a) * 0.9, opal, 8); }
      if (z === -12 || z === -44) k.point(s * 7, 8.2, z, 0xffdfae, 40, 22);
    }
    const sz = ZC - L / 2 + 1;
    for (let i = 0; i < 12; i++) k.box(18, 0.34, 0.9, 0, 0.17 + i * 0.34, sz - 2 - i * 0.9, marble);
    k.box(18, 4.2, 4, 0, 2.1, sz - 14.6, marble);
    for (const s of [-1, 1]) for (let i = 0; i <= 12; i++) k.lathe([[0.1, 0], [0.13, 0.15], [0.07, 0.45], [0.12, 0.85], [0.16, 0.95]], s * 8.6, 0.34 + i * 0.34, sz - 2 - i * 0.9, lime, 10);
    k.keepOut.push({ x: 0, z: sz - 8, r: 10 });
    k.box(30, H, 1.2, 0, H / 2, sz - 17, lime);
    k.box(30, H, 1.2, 0, H / 2, 14.5, lime);
    k.sign('GRAND CENTRAL TERMINAL', 10, 0.9, 0, 12, sz - 16.35, '#5a665b', '#f8edce', 85, 0, { border: true });
    k.censusWall({ x: 0, y: 8.4, z: sz - 16.35, rotY: 0, cols: 24, rows: 4, tile: 0.62, gap: 0.05, start: ctx.wallStart(3900, 96), pieces: ctx.all, backing: dark });
    k.sign('42ND STREET  ·  VANDERBILT AVENUE', 9, 0.8, 0, 11, 13.85, '#5a665b', '#f8edce', 85, PI, { border: true });
    // the patch of old grime left on purpose, beside Cancer, and the small hole from the 1957 rocket display
    const grime = k.flat(0x1f2a24, 0, 1);
    const patch = k.mesh(new T.PlaneGeometry(0.9, 0.5), grime, 6.6, H - 6 + Math.sqrt(1 - (6.6 / 12.6) ** 2) * 7.5 - 0.06, -33, true);
    patch.lookAt(0, H - 6, -33);
    const hole = k.mesh(new T.CircleGeometry(0.14, 12), k.flat(0x080808, 0, 1), -2.4, H - 6 + Math.sqrt(1 - (2.4 / 12.6) ** 2) * 7.5 - 0.05, -42, true);
    hole.lookAt(0, H - 6, -42);
    // easter eggs
    const mc = { name: 'Main Concourse (Grand Central Terminal), Wikipedia', url: 'https://en.wikipedia.org/wiki/Main_Concourse_(Grand_Central_Terminal)' };
    k.egg(v(0, H + 1.2, -16), { id: 'grand-backwards-sky', title: 'The sky is on backwards', year: '1913', text: 'The gold constellations on the turquoise ceiling are reversed left to right, and so is their overall arrangement, though the stars inside some constellations are drawn as seen from Earth. A commuter spotted the mistakes in 1913, the year the terminal opened, and they have never been corrected. The ceiling carries more than 2,500 stars.', clue: 'Look straight up and find a constellation you know.', source: mc }, { r: 2.4 });
    k.egg(patch, { id: 'grand-dark-patch', title: 'The patch they left dirty', year: '1998', text: 'When the ceiling was restored in the late 1990s, one single patch was left uncleaned, and it is still there. The constellation Cancer, the crab, points toward it.', clue: 'Find the crab on the ceiling and follow where it points.', source: mc }, { r: 1.2 });
    k.egg(v(0, 4.1, -26), { id: 'grand-opal-clock', title: 'Not actually opal', text: 'The four faced clock on the information booth has faces 24 inches across in opalescent glass. For years tour guides, and even Wikipedia, repeated that the faces were precious opal worth millions. Untapped New York debunked it: the glass is opalescent, often called opal or milk glass, and is no gemstone.', clue: 'Meet at the clock on the information booth.', source: mc }, { r: 1.4 });
    k.egg(hole, { id: 'grand-redstone', title: 'The hole in the heavens', year: '1957', text: 'In 1957 a Redstone rocket was put on display in the concourse. The popular story says it was so tall it was poked through the ceiling, but the rocket was more than 50 feet shorter than the 125 foot room. The small hole that survives was likely made to anchor a stabilizing wire, and it was kept when the ceiling was restored.', clue: 'Search the vault for a small dark hole among the stars.', source: { name: 'The myths of Grand Central Terminal, Untapped New York', url: 'https://untappedcities.com/2022/07/21/myths-of-grand-central-terminal/3/' } }, { r: 1.2 });
    k.egg(v(-9.6, 2.2, 11.6), { id: 'grand-whisper', title: 'The whispering gallery', text: 'One level down, under the walkway over the ramps to the Oyster Bar, the vaulted tile ceiling carries sound across the arch. Stand in one corner and whisper into the wall, and someone in the diagonally opposite corner hears you clearly.', clue: 'Find a corner by the entrance and whisper.', source: { name: 'Grand Central Terminal, Wikipedia', url: 'https://en.wikipedia.org/wiki/Grand_Central_Terminal' } }, { r: 1.4 });
    k.egg(v(0, 2.2, sz - 6), { id: 'grand-stairs', title: 'The staircase that waited', text: 'The marble staircase on the west side was built for the opening in 1913. Its twin on the east side was in the original plans but was only built during the restoration of the 1990s, which brought the concourse close to its 1913 appearance.', clue: 'Climb the grand marble stair at the far end.', source: mc }, { r: 1.8 });
    const mounts = corridorMounts({ pairs: 10, x: 11.9, z0: 4, pitch: 6.4, y: 3.5, width: 5.6, height: 3.2, inset: 5.4, style: 'gilt' });
    for (const m of mounts) if (Math.abs(m.position.z - 0) < 2.6 || Math.abs(m.position.z + 22) < 2.6 || Math.abs(m.position.z + 44) < 2.6) { m.position.y = 3.2; m.width = 4.6; m.height = 2.7; }
    for (const x of [-6.2, 6.2]) mounts.push({ position: v(x, 4.4, sz - 14.5), rotation: 0, target: v(x, 3, sz - 6), width: 5.4, height: 3.1, style: 'gilt' });
    return { mounts, spawn: v(0, 3, 10), look: v(0, 6, -30), eye: 3, bounds: [-10.4, 10.4, sz - 1, 12.5], style: 'gilt' };
  },
};

/* ---------------- 10 THE HIGH LINE ---------------- */
export const highline: RoomDef = {
  id: 'highline',
  name: 'The city, rewilded',
  area: 'THE HIGH LINE',
  mood: 'Late afternoon',
  color: '#acbf89',
  description: 'An elevated rail bed gone to grass, concrete planks and peel up benches, art on the brick walls that press in on both sides.',
  signatures: 'Tapered concrete planks fingering into planting, the old rails and ties, peel up benches, tight brick and glass facades.',
  build(k, ctx) {
    k.sky({ top: 0x7fa2cf, horizon: 0xf1d3ad, ground: 0x5b5347, fog: 0.003, sun: { az: 4.7, el: 0.25, color: 0xffd9a0, size: 20 }, haze: 0.3, env: 0.85 });
    k.hemi(0xffe6c8, 0x3f4a33, 0.8);
    k.sun(0xffd7a3, 2.4, -50, 30, 0, true, 60);
    const plank = k.pbr('plank', X.concrete(0xb5b2a6, 3), 0.4, { roughness: 0.8 }),
      gravel = k.pbr('ballastH', X.cobble(0x6a655c, 4), 1.0),
      soil = k.flat(0x3d3128, 0, 1),
      grass = k.flat(0x8a9a5a, 0, 0.95, { side: T.DoubleSide }),
      grass2 = k.flat(0x5d7a44, 0, 0.95, { side: T.DoubleSide }),
      iron = k.flat(0x35302c, 0.6, 0.6),
      rust = k.pbr('railRust', X.steel(0x6a4a3a, false, 8), 0.6, { metalness: 0.5, roughness: 0.7 }),
      ipe = k.pbr('ipe', X.planks(0x6b4a30, 5, 5), 1.4, { roughness: 0.55 }),
      brick = k.pbr('brickHL', X.brick(0x6b4a3d, 7), 0.28),
      brick2 = k.pbr('brickHL2', X.brick(0x4c4650, 8), 0.28),
      glassT = k.pbr('glassTower', X.windows(31, 0.2, 0x5c7686, false), 0.11, { emissive: 0xffffff, emissiveIntensity: 0.4, roughness: 0.3, metalness: 0.4, stretch: 0.42 }),
      street = k.pbr('streetH', X.asphalt(0x2a2d31), 0.11);
    const L = 76, ZC = 12 - L / 2;
    // the elevated structure and the street below
    k.box(80, 0.3, 260, 0, -9.2, -60, street);
    k.box(24, 1.6, L + 6, 0, -0.9, ZC, k.pbr('girder', X.steel(0x2f3a3a, true, 9), 0.5, { metalness: 0.7, roughness: 0.5 }));
    for (let z = 10; z > ZC - L / 2; z -= 10) for (const x of [-9, 9]) { k.box(1.0, 8, 1.0, x, -5, z, iron); k.box(24, 0.8, 0.8, 0, -1.9, z, iron); }
    for (const z of [4, -30]) for (const s of [-1, 1]) k.lamp(s * 6, z, 5.2, iron, 0xffdcb0, 24);
    k.box(24, 0.3, L, 0, -0.15, ZC, gravel);
    for (const s of [-1, 1]) for (let i = 0; i < 24; i++) {
      const z = 10 - i * 3.2, sh = new T.Shape();
      sh.moveTo(0, 0); sh.lineTo(3.2, 0); sh.lineTo(4.6, 0.16); sh.lineTo(3.2, 0.32); sh.lineTo(0, 0.32);
      const o = k.mesh(new T.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: false }), plank, s * 3.4, 0.05, z);
      o.rotation.x = -PI / 2;
      if (s < 0) o.rotation.z = PI;
    }
    k.box(6.8, 0.12, L, 0, 0.06, ZC, plank);
    for (const x of [-6.9, -5.5, 5.5, 6.9]) k.box(0.08, 0.1, L - 2, x, 0.1, ZC, rust);
    for (let z = 10; z > ZC - L / 2; z -= 1.1) for (const s of [-1, 1]) k.box(2.2, 0.08, 0.2, s * 6.2, 0.02, z, k.flat(0x3b2e25, 0, 1));
    // planting: grasses as instanced blades, mounds and small trees
    const blades: T.Matrix4[] = [], blades2: T.Matrix4[] = [];
    const rnd = X.mulberry(21);
    for (let i = 0; i < 2600; i++) {
      const s = i % 2 ? 1 : -1, x = s * (4.6 + rnd() * 5.6), z = 12 - rnd() * (L - 2);
      const m = new T.Matrix4().compose(v(x, 0.1, z), new T.Quaternion().setFromEuler(new T.Euler((rnd() - 0.5) * 0.5, rnd() * PI, (rnd() - 0.5) * 0.5)), v(1, 0.5 + rnd() * 0.9, 1));
      (i % 3 ? blades : blades2).push(m);
    }
    k.instances(new T.PlaneGeometry(0.08, 1.2).translate(0, 0.6, 0), grass, blades);
    k.instances(new T.PlaneGeometry(0.14, 0.9).translate(0, 0.45, 0), grass2, blades2);
    for (const s of [-1, 1]) for (let z = 8; z > ZC - L / 2 + 4; z -= 7.5) {
      k.box(5.6, 0.25, 6, s * 7.4, 0.1, z, soil);
      for (let j = 0; j < 4; j++) k.sphere(0.35 + rnd() * 0.3, s * (5.4 + rnd() * 3.6), 0.45, z - 2.5 + rnd() * 5, j % 2 ? grass2 : k.flat(0x9a8a58, 0, 1), 7);
      if (z % 3 === 0 || rnd() > 0.5) k.tree(s * 8.6, 0.1, z - 3, { kind: 'round', h: 3.4, r: 1.6, leaf: 0x5f8a45, seed: Math.round(z) });
    }
    // peel up benches from the planks
    for (const s of [-1, 1]) for (const z of [-4, -26, -48]) for (let strip = 0; strip < 6; strip++) {
      const x = s * 4.4 + strip * 0.15 * s, sh = new T.Shape();
      sh.moveTo(-0.065, 0); sh.lineTo(0.065, 0); sh.lineTo(0.065, 0.07); sh.lineTo(-0.065, 0.07); sh.closePath();
      const path = new T.CatmullRomCurve3([v(x, 0.1, z + 2.2), v(x, 0.12, z + 1.0), v(x, 0.35, z + 0.4), v(x, 0.66, z), v(x, 0.7, z - 1.4)]);
      k.mesh(new T.ExtrudeGeometry(sh, { steps: 32, bevelEnabled: false, extrudePath: path }), ipe);
    }
    for (const s of [-1, 1]) for (const z of [-4, -26, -48]) k.keepOut.push({ x: s * 4.6, z, r: 1.3 });
    // the buildings pressing in, the works as murals on their brick
    for (const s of [-1, 1]) for (let b = 0; b < 8; b++) {
      const z = 6 - b * 9.4, h = 14 + (b % 3) * 6, m = b % 2 ? brick : brick2;
      if (b % 4 === 3) { k.box(8, h + 12, 9, s * 16, (h + 12) / 2 - 9, z, glassT); continue; }
      k.box(8, h + 9, 9, s * 16, (h + 9) / 2 - 9, z, m);
      k.box(8.3, 0.4, 9.3, s * 16, h, z, k.flat(0x8f857a, 0, 0.8));
      for (let y = 6; y < h - 1; y += 3) for (const dz of [-3, 0, 3]) {
        if (y > 2 && y < 5.4) continue;
        k.box(0.1, 1.9, 1.3, s * 11.98, y, z + dz, k.flat(0xd6d1c3, 0, 0.8));
        k.box(0.05, 1.6, 1.05, s * 11.93, y, z + dz, (b + y) % 3 === 0 ? k.glow(0xffe0b0) : k.glass(0x8fb0c0, 0.4, 0.1));
      }
      if (b % 3 === 1) k.prop('fire_escape', s * 10.95, 7, z + 3, { height: 3.2, rotY: s > 0 ? -PI / 2 : PI / 2 });
      if (b % 2 === 0) k.prop('water_tower', s * 15.5, h, z, { height: 5 });
    }
    k.skyline({ z: -150, count: 30, spacing: 7, scale: 2.4, base: -9, seed: 22, lit: 0.22, glow: 0.5, tint: 0x6a6f78 });
    k.censusWall({ x: -11.95, y: 3.5, z: 9.5, rotY: PI / 2, cols: 12, rows: 4, tile: 0.62, gap: 0.05, start: ctx.wallStart(2200, 48), pieces: ctx.all, backing: iron });
    k.censusWall({ x: 11.95, y: 3.5, z: 9.5, rotY: -PI / 2, cols: 12, rows: 4, tile: 0.62, gap: 0.05, start: ctx.wallStart(2260, 48), pieces: ctx.all, backing: iron });
    // the viewing window over the avenue at the end
    const ez = ZC - L / 2 - 1;
    k.box(24, 1, 8, 0, 0.4, ez - 3, plank);
    for (let i = 0; i < 5; i++) k.box(20, 0.45, 1.4, 0, 0.6 + i * 0.45, ez - 1 - i * 1.4, ipe);
    k.box(14, 8, 0.6, 0, 5, ez - 9, iron);
    k.box(12, 6, 0.1, 0, 5, ez - 8.6, k.glass(0xbfd8e6, 0.2, 0.05));
    k.keepOut.push({ x: 0, z: ez - 4, r: 6 });
    k.sign('THE HIGH LINE', 7, 0.8, 0, 9.6, ez - 8.6, '#465d50', '#f2f2de', 120, 0, { border: true });
    for (const s of [-1, 1]) k.prop('fence', s * 7.5, 0.1, ez - 2, { height: 1.4, rotY: PI / 2 });
    const mounts = corridorMounts({ pairs: 10, x: 11.85, z0: 2, pitch: 6.6, y: 3.7, width: 5.6, height: 3.2, inset: 5.4, style: 'black' });
    for (const x of [-9, 9]) mounts.push({ position: v(x, 3.4, ez - 8.6), rotation: 0, target: v(x * 0.5, 3, ez + 2), width: 4.6, height: 2.7, style: 'black' });
    return { mounts, spawn: v(0, 3, 10), look: v(0, 3.4, -30), eye: 3, bounds: [-5.6, 5.6, ez + 1, 11], style: 'black' };
  },
};

/* ---------------- 11 CONEY ISLAND ---------------- */
export const coney: RoomDef = {
  id: 'coney',
  name: 'At the edge of it all',
  area: 'CONEY ISLAND',
  mood: 'Summer dusk',
  color: '#eec092',
  description: 'The boardwalk at dusk, the wheel turning, the Cyclone roaring, the census hung on bathhouse walls facing the sea.',
  signatures: 'The timber boardwalk and white rails, the wheel with swinging cars, the wooden coaster trestles, the Parachute Jump lattice.',
  build(k, ctx) {
    k.sky({ top: 0x4e5aa0, horizon: 0xf0a698, ground: 0x2e2a36, fog: 0.0022, sun: { az: 4.5, el: 0.06, color: 0xffb37a, size: 16 }, stars: 200, haze: 0.4, env: 0.8 });
    k.hemi(0xffd0c0, 0x2c2e3c, 0.7);
    k.sun(0xffb98a, 2.0, -70, 14, -30, true, 70);
    const boards = k.pbr('boardwalk', X.boardwalk(0x8a6a48), 0.36, { roughness: 0.75 }),
      white = k.flat(0xf1ede2, 0.2, 0.6),
      sand = k.pbr('sand', X.concrete(0xd8c39c, 6), 0.2, { roughness: 1 }),
      iron = k.flat(0x2f2c30, 0.6, 0.55),
      red = k.pbr('cycloneRed', X.plaster(0xb33a3a, 6), 0.5, { roughness: 0.6 }),
      cream = k.pbr('bathhouse', X.plaster(0xf2e6c8, 7), 0.5, { roughness: 0.75 }),
      teal = k.pbr('teal', X.plaster(0x3e8a8c, 8), 0.5, { roughness: 0.6 }),
      timber = k.pbr('trestle', X.planks(0xd8d0c0, 3, 5), 1.2, { roughness: 0.8 }),
      warm = k.glow(0xffd9a0);
    const L = 76, ZC = 12 - L / 2;
    k.water({ y: -1.8, color: 0x35566a, w: 460, d: 420, x: -120, z: -80, amp: 1.5 });
    k.box(160, 1.2, L + 120, -80, -1.2, ZC - 10, sand);
    k.box(26, 0.5, L + 4, 0, -0.25, ZC, boards);
    for (let z = 12; z > ZC - L / 2; z -= 6) for (const x of [-11, -4, 4, 11]) k.box(0.4, 2.2, 0.4, x, -1.4, z, timber);
    k.rail(-12.7, ZC, L + 4, white, 1.15, 'z', 1.5);
    k.rail(12.7, ZC, L + 4, white, 1.15, 'z', 1.5);
    // sea side: lifeguard screens carrying the works, the beach beyond
    for (let i = 0; i < 10; i++) {
      const z = 2 - i * 6.6;
      k.box(0.4, 4.4, 6.4, -9.5, 2.5, z, cream);
      k.box(0.5, 0.3, 6.8, -9.5, 4.8, z, teal);
      k.box(1.1, 0.35, 6.8, -9.5, 0.17, z, white);
    }
    for (let i = 0; i < 3; i++) { k.box(2.2, 2.4, 2.2, -20 - i * 2, 1.4, -10 - i * 24, cream); k.box(2.6, 0.2, 2.6, -20 - i * 2, 2.7, -10 - i * 24, teal); for (const dx of [-0.9, 0.9]) for (const dz of [-0.9, 0.9]) k.box(0.15, 2.4, 0.15, -20 - i * 2 + dx, -0.6, -10 - i * 24 + dz, timber); }
    for (let i = 0; i < 8; i++) { k.cyl(0.05, 2.6, -18 - (i % 3) * 4, 0.6, 6 - i * 9, timber, 0.05, 6); k.mesh(new T.ConeGeometry(1.3, 0.5, 8, 1, true), i % 2 ? red : teal, -18 - (i % 3) * 4, 2.0, 6 - i * 9); }
    // amusement side: bathhouse walls with the framed works, a franks stand, the rides beyond
    for (let b = 0; b < 6; b++) {
      const z = 4 - b * 12.6;
      k.box(4, 6.5, 12, 14, 3.25, z, b % 2 ? cream : teal);
      k.moulding([[0, 0], [0.5, 0], [0.55, 0.2], [0.3, 0.4], [0, 0.5]], 12, 12.0, 6.4, z, white, PI);
      for (let x = -5; x <= 5; x += 2.5) k.sphere(0.12, 12.0, 6.9, z + x, warm, 6);
      k.point(11, 5.5, z, 0xffd9a0, 12, 10);
    }
    k.sign("FRANKS  ·  CLAMS  ·  BEER", 7, 1.1, 11.95, 7.6, -22, '#b33a3a', '#fff3d8', 120, -PI / 2, { border: true });
    k.sign('CONEY ISLAND', 8, 1.4, 11.95, 7.8, -48, '#31586f', '#ffe1a8', 130, -PI / 2, { border: true });
    for (const z of [8, -12, -32, -52]) for (const s of [-1, 1]) { k.prop('lamppost', s * 6.6, 0, z, { height: 6, keepOut: 0.45 }); k.point(s * 6.6, 5.6, z, 0xffd9a0, 24, 14); }
    for (const z of [-2, -24, -44]) k.bench(6.4, z, 0, k.pbr('benchC', X.planks(0x8a6a48, 3, 7), 1.2), white, 2.4);
    for (const z of [-10, -36]) k.prop('life_ring', -12.7, 1.3, z, { height: 0.9, rotY: PI / 2 });
    k.prop('lobster_trap', -8, 0, 8, { height: 0.9, rotY: 0.6 });
    k.prop('buoy', -8.4, 0, -60, { height: 1.9, keepOut: 0.8 });
    k.prop('bell', 4.4, 1.8, 10, { height: 0.8 });
    k.box(0.25, 1.8, 0.25, 4.4, 0.9, 10, white);
    // the wheel
    const wheel = new T.Group();
    wheel.position.set(34, 15, -46);
    k.add(wheel);
    for (const dz of [-0.9, 0.9]) for (const r of [13, 12.4, 5.5]) { const rim = new T.Mesh(new T.TorusGeometry(r, 0.1, 8, 80), white); rim.position.z = dz; wheel.add(rim); }
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * PI * 2;
      for (const dz of [-0.9, 0.9]) { const sp = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 13, 6), k.flat(0xd9c27a, 0.6, 0.4)); sp.position.set(Math.cos(a) * 6.5, Math.sin(a) * 6.5, dz); sp.rotation.z = a - PI / 2; wheel.add(sp); }
      const cab = new T.Group();
      cab.position.set(Math.cos(a) * 13, Math.sin(a) * 13, 0);
      // 8 white cars fixed to the rim, 16 that slide along inner tracks, red and yellow or blue and yellow
      const fixed = i % 3 === 0;
      const body = new T.Mesh(new T.BoxGeometry(1.5, 1.4, 1.3), k.flat(fixed ? 0xf3f0e6 : i % 3 === 1 ? 0xc8413c : 0x3d78b8, 0.2, 0.6));
      body.position.y = -1.1;
      cab.add(body);
      const hanger = new T.Mesh(new T.BoxGeometry(0.06, 0.6, 0.06), iron);
      hanger.position.y = -0.3;
      cab.add(hanger);
      const bulb = new T.Mesh(new T.SphereGeometry(0.14, 8, 6), warm);
      bulb.position.z = 1.0;
      cab.add(bulb);
      const roof = new T.Mesh(new T.BoxGeometry(1.6, 0.18, 1.4), k.flat(fixed ? 0xf3f0e6 : 0xe9c03a, 0.2, 0.6));
      roof.position.y = -0.35;
      cab.add(roof);
      cab.userData.cabin = true;
      cab.userData.slide = !fixed;
      cab.userData.a = a;
      wheel.add(cab);
    }
    const axle = new T.Mesh(new T.CylinderGeometry(0.5, 0.5, 4, 16), k.flat(0xb89a5a, 0.8, 0.3));
    axle.rotation.x = PI / 2;
    wheel.add(axle);
    if (!ctx.reduced) k.ticks.push((t) => { wheel.rotation.z = t * 0.06; wheel.children.forEach((c) => { if (!c.userData.cabin) return; c.rotation.z = -t * 0.06; if (c.userData.slide) { const a = c.userData.a as number, r = 11.2 + 1.8 * Math.max(0, Math.sin(a + t * 0.06)); c.position.set(Math.cos(a) * r, Math.sin(a) * r, 0); } }); });
    for (const dx of [-7, 7]) for (const dz of [-1.5, 1.5]) k.beam(v(34 + dx, -1, -46 + dz), v(34, 15, -46 + dz), 0.3, white, 8);
    k.beam(v(27, -1, -46), v(41, -1, -46), 0.2, white, 8);
    // the Cyclone and the Parachute Jump
    const tracks = [[], []] as T.Vector3[][];
    for (let i = 0; i <= 110; i++) {
      const x = 16 + i * 0.6, y = 4 + Math.sin(i * 0.11) * 4.5 + Math.sin(i * 0.21) * 2, z = -68 - Math.sin(i * 0.05) * 6;
      tracks[0].push(v(x, y, z - 0.6));
      tracks[1].push(v(x, y, z + 0.6));
      if (i % 3 === 0) { k.beam(v(x, y, z - 0.6), v(x, y, z + 0.6), 0.05, timber, 5); for (const zz of [z - 0.6, z + 0.6]) { k.beam(v(x, -1, zz), v(x, y, zz), 0.07, timber, 5); k.beam(v(x, -1, zz), v(x + 1.6, y * 0.6, zz), 0.035, timber, 4); } }
    }
    tracks.forEach((p) => k.curve(p, 0.07, iron, 110));
    k.sign('CYCLONE', 10, 2.2, 40, 13, -66, '#e7d8b5', '#af3439', 150, 0, { border: true });
    const PJ = 46; // the Parachute Jump stands 250 ft to the Wonder Wheel's 150 ft, scaled to this wheel
    for (let j = 0; j < 6; j++) {
      const t = (j * PI) / 3;
      k.beam(v(62 + Math.cos(t) * 3.5, -1, -100 + Math.sin(t) * 3.5), v(62 + Math.cos(t) * 1.4, PJ, -100 + Math.sin(t) * 1.4), 0.12, red, 6);
      for (let y = 0; y < PJ - 2; y += 4) k.beam(v(62 + Math.cos(t) * 2.8, y, -100 + Math.sin(t) * 2.8), v(62 + Math.cos(t + PI / 3) * 2.8, y + 4, -100 + Math.sin(t + PI / 3) * 2.8), 0.05, iron, 4);
    }
    k.torus(6, 0.18, 62, PJ, -100, red, 24).rotation.x = PI / 2;
    for (let j = 0; j < 12; j++) { const t = (j * PI) / 6; k.beam(v(62, PJ, -100), v(62 + Math.cos(t) * 6, PJ, -100 + Math.sin(t) * 6), 0.06, iron, 4); k.sphere(0.2, 62 + Math.cos(t) * 6, PJ, -100 + Math.sin(t) * 6, warm, 6); }
    // the bandshell at the end with the census wall
    const ez = ZC - L / 2 - 2;
    k.mesh(new T.SphereGeometry(9, 32, 16, 0, PI, 0, PI / 2), teal, 0, 0, ez - 6).rotation.y = PI / 2;
    k.box(20, 0.9, 6, 0, 0.45, ez - 3, cream);
    k.keepOut.push({ x: 0, z: ez - 4, r: 8 });
    k.censusWall({ x: 0, y: 4.4, z: ez - 1.5, rotY: 0, cols: 22, rows: 4, tile: 0.62, gap: 0.05, start: ctx.wallStart(7000 > ctx.all.length ? 5000 : 7000, 88), pieces: ctx.all, backing: iron });
    k.sign('SUMMER DUSK  ·  THE EDGE OF IT ALL', 8, 0.7, 0, 7.4, ez - 1.5, '#31586f', '#ffe1a8', 80, 0, { border: true });
    // easter eggs
    k.egg(v(34, 15, -46), { id: 'coney-wonderwheel', title: 'The wheel with sliding cars', year: '1920', text: 'The Wonder Wheel opened on Memorial Day 1920 and stands 150 feet tall. Of its 24 cars, the 8 white ones are fixed to the rim like an ordinary Ferris wheel, while the 16 red or blue and yellow cars slide along inner tracks as the wheel turns, swinging riders toward the hub. It weighs 200 tons and was made a city landmark in 1989.', clue: 'Watch the coloured cars on the big wheel slide in and out.', source: { name: 'Wonder Wheel, Wikipedia', url: 'https://en.wikipedia.org/wiki/Wonder_Wheel' } }, { r: 3.5 });
    k.egg(v(40, 13, -66), { id: 'coney-cyclone', title: 'The scream that came back', year: '1927', text: 'The Cyclone opened on June 26, 1927, with a first drop of 58.1 degrees and a top speed of 60 miles per hour, on wooden track over a steel frame. The best known story about it: Emilio Franco, a coal miner who had lost his voice, reportedly screamed on the first drop, said I feel sick as the train returned, and fainted when he realised he had spoken.', clue: 'Find the red letters on the coaster\'s lift hill.', source: { name: 'Cyclone (roller coaster), Wikipedia', url: 'https://en.wikipedia.org/wiki/Cyclone_(roller_coaster)' } }, { r: 3 });
    k.egg(v(62, PJ, -100), { id: 'coney-parachute', title: 'A ride that came from Queens', year: '1939', text: 'The Parachute Jump was built for the 1939 World\'s Fair in Flushing Meadows, taken apart in January 1941 and rebuilt at Steeplechase Park in Coney Island. Its six sided steel tower is 250 feet tall with twelve arms, each once carrying a parachute. It stopped giving rides in 1964, and today, lit with thousands of LEDs, it is called the Eiffel Tower of Brooklyn.', clue: 'Look for the tall red tower far down the beach.', source: { name: 'Parachute Jump, Wikipedia', url: 'https://en.wikipedia.org/wiki/Parachute_Jump' } }, { r: 4 });
    k.egg(v(0, 0.4, 5), { id: 'coney-riegelmann', title: 'Whose boardwalk', year: '1923', text: 'The boardwalk is formally the Riegelmann Boardwalk, after Brooklyn borough president Edward J. Riegelmann, who led the project, though he and his assistant commissioner preferred plain Coney Island Boardwalk. It opened in full on May 15, 1923, runs 2.7 miles, and sits 13 or 14 feet above sea level to ride out storm surges. On May 15, 2018 it became the city\'s eleventh scenic landmark.', clue: 'Look down at the boards under your feet.', source: { name: 'Riegelmann Boardwalk, Wikipedia', url: 'https://en.wikipedia.org/wiki/Riegelmann_Boardwalk' } }, { r: 1.6 });
    k.egg(v(-6, 0.4, -36), { id: 'coney-chevron', title: 'Not herringbone', text: 'The planks are laid in a modified chevron, running at 45 degrees between two lengthwise wooden axes, across a walk up to 80 feet wide. The first planks were Douglas fir from Washington state, and from the early 1990s the city began re-planking with ipe, a tropical hardwood; plastic and concrete were used in later sections.', clue: 'Look at the angle of the boards along the sea rail.', source: { name: 'Riegelmann Boardwalk, Wikipedia', url: 'https://en.wikipedia.org/wiki/Riegelmann_Boardwalk' } }, { r: 1.6 });
    k.egg(v(11.95, 7.6, -22), { id: 'coney-nathans', title: 'Half price franks', year: '1916', text: 'Nathan and Ida Handwerker spent their life savings of $300 to open a hot dog stand at Surf and Stillwell Avenues in 1916. Nathan had worked for Feltman\'s, which charged 10 cents a frank, so he charged five. The July 4th eating contest has been held at that corner since the early 1970s.', clue: 'Find the franks stand on the amusement side.', source: { name: 'Nathan\'s Famous, Wikipedia', url: 'https://en.wikipedia.org/wiki/Nathan%27s_Famous' } }, { r: 1.8 });
    const mounts = corridorMounts({ pairs: 10, x: 9.3, z0: 2, pitch: 6.6, y: 3.0, width: 5.4, height: 3.1, inset: 4.6, style: 'white' });
    for (let i = 1; i < 20; i += 2) { mounts[i].position.x = 11.95; mounts[i].position.y = 3.5; mounts[i].target.x = 6.6; }
    for (const x of [-8.6, 8.6]) mounts.push({ position: v(x, 3.0, ez - 1.5), rotation: 0, target: v(x * 0.6, 3, ez + 6), width: 4.6, height: 2.7, style: 'white' });
    return { mounts, spawn: v(0, 3, 10), look: v(2, 4, -30), eye: 3, bounds: [-8.2, 10.6, ez + 5, 11], style: 'white' };
  },
};
