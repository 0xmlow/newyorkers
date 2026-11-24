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

/* ---------------- THE BIG UPGRADE helpers (2026-11-23), local to this file ---------------- */
const HAS_DOM = typeof window !== 'undefined' && typeof HTMLImageElement !== 'undefined';
const TEXP = 'assets/museum/tex/';
function texLoad(k: Kit, url: string, srgb: boolean, on: (t: T.Texture) => void) {
  if (!HAS_DOM) return;
  k.used.images.add(url);
  k.pending.push(new Promise<void>((res) => new T.TextureLoader().load(url, (t) => {
    t.colorSpace = srgb ? T.SRGBColorSpace : T.NoColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8;
    on(t); res();
  }, undefined, () => res())));
}
/* A scanned CC0 surface (Poly Haven, 1k): assets/museum/tex/<set>_{c,n,r}.webp, laid in world space at `tile` metres a repeat.
   `color` tints the photo; the kit's batch projects the UVs, so this only works on static (merged) geometry. */
const scanCache = new WeakMap<Kit, Map<string, T.MeshStandardMaterial>>();
function scan(k: Kit, set: string, tile: number, p: Partial<T.MeshStandardMaterialParameters> & { normal?: number; relief?: boolean } = {}) {
  let cache = scanCache.get(k);
  if (!cache) { cache = new Map(); scanCache.set(k, cache); }
  const key = set + ':' + tile + ':' + JSON.stringify(p);
  let m = cache.get(key);
  if (m) return m;
  const { normal = 1, relief = false, ...rest } = p;
  m = new T.MeshStandardMaterial({ roughness: 1, metalness: 0, normalScale: new T.Vector2(normal, normal), ...rest });
  m.userData.density = 1 / tile;
  const mm = m;
  /* relief: the scan's shape and wear only, under a painted colour (whitewashed brick, bathhouse paint) */
  if (!relief) texLoad(k, TEXP + set + '_c.webp', true, (t) => { mm.map = t; mm.needsUpdate = true; });
  texLoad(k, TEXP + set + '_n.webp', false, (t) => { mm.normalMap = t; mm.needsUpdate = true; });
  texLoad(k, TEXP + set + '_r.webp', false, (t) => { mm.roughnessMap = t; mm.needsUpdate = true; });
  cache.set(key, m);
  return m;
}
/* Lettering as a canvas: the kit's own sign painter on a transparent ground. */
function letters(text: string, w: number, h: number, fg: string, size: number) {
  return typeof document !== 'undefined' ? X.signText(text, w, h, 'transparent', fg, size) : null;
}
/* ANAMORPHIC FLOOR: a flat painting on the floor that reads as an upright sign from one spot only.
   A virtual card stands square to the line of sight at `center`; every vertex of a fine grid on it is projected from
   the eye down onto the floor, so the paint is long and smeared from anywhere else and snaps upright from the eye. */
function anamorphFloor(k: Kit, tex: T.Texture | null, eye: T.Vector3, center: T.Vector3, w: number, h: number, y0 = 0.012, opacity = 0.92) {
  const n = new T.Vector3().subVectors(center, eye).normalize(), right = new T.Vector3().crossVectors(n, new T.Vector3(0, 1, 0)).normalize(), up = new T.Vector3().crossVectors(right, n);
  const NX = 32, NY = 16, pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
    const P = center.clone().addScaledVector(right, (i / NX - 0.5) * w).addScaledVector(up, (j / NY) * h);
    const t = (y0 - eye.y) / (P.y - eye.y);
    pos.push(eye.x + t * (P.x - eye.x), y0, eye.z + t * (P.z - eye.z));
    uv.push(i / NX, j / NY);
  }
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new T.MeshStandardMaterial({ map: tex, transparent: true, opacity, roughness: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, side: T.DoubleSide });
  const o = k.mesh(g, m, 0, 0, 0, true);
  o.renderOrder = 2;
  return o;
}
/* FRAGMENTED ANAMORPHOSIS: one line of lettering cut into vertical strips, each strip hung at its own depth along
   the sight line and scaled so that it covers the same angle. From the eye it is one sign; a step aside and it falls apart. */
function anamorphStrips(k: Kit, tex: T.Texture | null, eye: T.Vector3, target: T.Vector3, w: number, h: number, depths: number[]) {
  const dir = new T.Vector3().subVectors(target, eye), d0 = dir.length();
  dir.normalize();
  const yaw = Math.atan2(-dir.x, -dir.z), right = new T.Vector3(-dir.z, 0, dir.x).normalize();
  const n = depths.length, out: T.Mesh[] = [];
  for (let i = 0; i < n; i++) {
    const s = depths[i] / d0, g = new T.PlaneGeometry((w / n) * s, h * s), uv = g.attributes.uv as T.BufferAttribute;
    for (let q = 0; q < uv.count; q++) uv.setX(q, (i + uv.getX(q)) / n);
    const local = ((i + 0.5) / n - 0.5) * w;
    const P = eye.clone().addScaledVector(new T.Vector3().subVectors(target.clone().addScaledVector(right, local), eye).normalize(), depths[i]);
    const o = k.mesh(g, new T.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.2, roughness: 0.6, side: T.DoubleSide }), P.x, P.y, P.z, true);
    o.rotation.y = yaw;
    out.push(o);
  }
  return out;
}

/* Every work needs a free spot to be seen from: a target that lands in a keep out (a bench, a pool, a planter) is
   walked along the wall normal, then sideways, until it stands on open floor inside the room. */
function freeTargets(k: Kit, mounts: { position: T.Vector3; target: T.Vector3 }[], b: [number, number, number, number]) {
  const ok = (x: number, z: number) => x > b[0] + 0.2 && x < b[1] - 0.2 && z > b[2] + 0.2 && z < b[3] - 0.2 && !k.keepOut.some((o) => Math.hypot(x - o.x, z - o.z) < o.r + 0.25) && !k.blocks.some((q) => x > q.x0 - 0.25 && x < q.x1 + 0.25 && z > q.z0 - 0.25 && z < q.z1 + 0.25);
  for (const m of mounts) {
    if (ok(m.target.x, m.target.z)) continue;
    const n = new T.Vector3(m.target.x - m.position.x, 0, m.target.z - m.position.z).normalize(), side = new T.Vector3(-n.z, 0, n.x);
    search: for (const d of [2.6, 3.2, 3.8, 4.4, 5.0, 5.8, 6.6, 7.4]) for (const sd of [0, 1.2, -1.2, 2.4, -2.4]) {
      const x = m.position.x + n.x * d + side.x * sd, z = m.position.z + n.z * d + side.z * sd;
      if (ok(x, z)) { m.target.x = x; m.target.z = z; break search; }
    }
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
      /* THE BIG UPGRADE 2026-11-23: scanned herringbone brick, painted brick and granite; real planting as models
         (Poly Haven CC0 pachira, anthurium, calathea, fern and a tropical tree), the cast iron fountain as a model in
         the pool, the gallery labels, and THE LIVING CITY cut into hanging strips that only join from the door. */
      brickF = scan(k, 'botanical/herring', 1.6, { color: 0xd8b8a8, roughness: 0.9 }),
      whiteBrick = scan(k, 'botanical/whitebrick', 2.6, { color: 0xf2efe8, normal: 0.9, relief: true }),
      soil = k.flat(0x3b2e24, 0, 1),
      stone = scan(k, 'botanical/granite', 1.4, { color: 0xd8d2c8, roughness: 0.7 }),
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
      }
    }
    for (let i = 0; i < 20; i++) {
      const s = i % 2 ? 1 : -1, z = 2 - Math.floor(i / 2) * 6.4;
      k.box(0.5, 4.2, 6.2, s * 9.4, 2.8, z, whiteBrick);
      k.box(0.8, 0.2, 6.4, s * 9.4, 4.95, z, whiteBrick);
      k.box(0.7, 0.1, 6.0, s * 9.4, 5.08, z, soil);
      k.prop(i % 4 < 2 ? 'botanical/fern' : 'botanical/calathea', s * 9.4, 5.1, z + (i % 3 - 1) * 1.4, { height: 1.2, rotY: i });
    }
    // the tall planting behind the walls: rows of pachira over the parapets, a tropical tree at each end of the nave
    for (const s of [-1, 1]) for (const z of [-8, -56]) k.prop('botanical/pachira', s * 12.2, 0.72, z, { height: 6.2, rotY: PI / 2 + (s > 0 ? 0.08 : -0.08) });
    for (const s of [-1, 1]) k.prop('botanical/island_tree', s * 11.6, 0.72, 8.5, { height: 7.5, rotY: s });
    // palms in urns and anthurium along the aisle, the way the Palm House stands its specimens
    for (const s of [-1, 1]) for (const z of [-2.6, -15.4, -47.4, -60.2]) { k.prop('cp_palm', s * 7.4, 0, z, { height: 3.4, rotY: z, keepOut: 0.8 }); }
    for (const s of [-1, 1]) for (const z of [3.8, -21.8]) k.prop('botanical/anthurium', s * 7.6, 0, z, { height: 1.4, keepOut: 0.6 });
    // the gallery labels, on green enamel plates as the Garden hangs them
    const gal = ['PALMS OF THE WORLD', 'LOWLAND RAIN FOREST', 'UPLAND RAIN FOREST', 'AQUATIC PLANTS', 'DESERTS OF THE AMERICAS', 'DESERTS OF AFRICA'];
    gal.forEach((t, i) => { const s = i % 2 ? 1 : -1, z = 5 - Math.floor(i / 2) * 25.6 - (i > 1 ? 0 : 0); k.box(0.06, 1.4, 0.06, s * 8.2, 0.7, z, iron); k.sign(t, 2.2, 0.36, s * 8.2, 1.55, z, '#2f5a3e', '#f4edd4', 64, s > 0 ? -PI / 2 : PI / 2, { double: true }); });
    // the lily pool under the dome, enamel trees as the garden's sculpture
    k.cyl(6.2, 0.6, 0, 0.3, dz, stone, 6.2, 48);
    const poolFloor = k.mesh(new T.CircleGeometry(5.7, 48), k.image(TEXP + 'botanical/lily_pool.webp', { opaque: true, roughness: 0.6 }), 0, 0.1, dz, true);
    poolFloor.rotation.x = -PI / 2;
    k.cyl(5.7, 0.04, 0, 0.62, dz, k.flat(0x2f5e5a, 0.3, 0.08, { transparent: true, opacity: 0.55 }), 5.7, 48);
    k.keepOut.push({ x: 0, z: dz, r: 6.6 });
    const rnd = X.mulberry(3);
    for (let i = 0; i < 26; i++) {
      const a = rnd() * PI * 2, r = 1 + rnd() * 4.4, x = Math.cos(a) * r, z = dz + Math.sin(a) * r;
      k.cyl(0.35 + rnd() * 0.3, 0.03, x, 0.68, z, pad, 0.35, 12);
      if (i % 3 === 0) for (let p = 0; p < 7; p++) { const o = k.sphere(0.12, x + Math.cos((p * 6.28) / 7) * 0.12, 0.78, z + Math.sin((p * 6.28) / 7) * 0.12, p % 2 ? pink : k.flat(0xf3ead6, 0, 0.7), 6); o.scale.set(0.6, 0.35, 1.3); o.rotation.y = -(p * 6.28) / 7; }
    }
    k.prop('cp_fountain', 0, 0.3, dz, { height: 3.4 });
    k.point(0, 6, dz, 0xfff4dc, 30, 22);
    for (const [x, z] of [[-6.5, -14], [6.5, -14], [-6.5, -54], [6.5, -54]]) { k.plinth(x, z, 2.2, 0.8, 2.2, whiteBrick); k.prop('botanical/island_tree', x, 0.88, z, { height: 5.6, rotY: x + z }); }
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
    // THE TRICK: THE LIVING CITY cut into seven banners hung at seven depths down the nave; only the doorway puts them together
    const banner = typeof document !== 'undefined' ? X.signText('THE LIVING CITY', 1024, 170, '#2f5a3e', '#f4edd4', 132) : null;
    const strips = anamorphStrips(k, banner, v(0, 3, 9), v(0, 10.4, -34), 13, 2.15, [7, 11.5, 16, 21, 26.5, 32, 37.5]);
    for (const o of strips) { const top = o.position.y + (o.geometry as T.PlaneGeometry).parameters.height / 2; k.beam(v(o.position.x, top, o.position.z), v(o.position.x, Math.max(top + 0.5, 14.6), o.position.z), 0.012, iron, 4); }
    k.egg(strips[3], { id: 'botanical-banners', title: 'Seven banners, one sign', text: 'The words over the nave are not one sign. They are seven green banners hung at seven different depths and sizes, each cut from a slice of the same line of lettering. From the doorway every slice lines up and the sign reads whole; walk a few steps and it breaks apart into the glass. Artists call this a fragmented anamorphosis.', clue: 'Go back to the doors and look up the nave toward the dome.', source: haupt }, { r: 1.6 });
    const mounts = corridorMounts({ pairs: 10, x: 9.1, z0: 2, pitch: 6.4, y: 2.9, width: 5.2, height: 3.0, inset: 4.4, style: 'white' });
    for (const x of [-6.5, 6.5]) mounts.push({ position: v(x, 2.9, ZC - L / 2 + 3), rotation: 0, target: v(x, 3, ZC - L / 2 + 8.5), width: 4.6, height: 2.7, style: 'white', wash: false });
    for (const m of mounts.slice(20)) { k.box(5.2, 3.6, 0.3, m.position.x, 2.9, ZC - L / 2 + 2.8, whiteBrick); }
    freeTargets(k, mounts, [-8.2, 8.2, ZC - L / 2 + 5, 11]);
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
    /* THE BIG UPGRADE 2026-11-23: scanned terrazzo, stone and steel; Peter Pennoyer's clock as a model; the Hive's
       city mirrored right way up in a black glass pit under it (the trick); travellers; real wayfinding. */
    const terrazzo = scan(k, 'penn/floor', 3.6, { color: 0xf2f0ec, roughness: 0.45, normal: 0.6 }),
      lime = scan(k, 'penn/lime', 9, { color: 0xf8f2ea, normal: 0.45 }),
      steel = scan(k, 'penn/steel', 2.2, { color: 0x56606a, metalness: 0.7, roughness: 0.8 }),
      glass = k.glass(0xd7ecf3, 0.14, 0.08),
      brass = k.pbr('brassP', X.gilt(0xc9a55a), 2, { metalness: 0.85, roughness: 0.3 }),
      walnut = k.pbr('walnut', X.planks(0x5a3d2a, 4, 3), 1.2, { roughness: 0.5 }),
      dark = k.flat(0x141b22, 0.3, 0.6),
      opal = k.glow(0xfff1d2);
    const L = 76, ZC = 12 - L / 2;
    // the floor leaves a pit under the Hive: HX0..HX1, HZ0..HZ1
    const HX0 = -10.3, HX1 = -4.9, HZ0 = 7.7, HZ1 = 12.3, FZ0 = ZC - L / 2 - 2, FZ1 = 14;
    k.box(30, 0.4, HZ0 - FZ0, 0, -0.2, (HZ0 + FZ0) / 2, terrazzo);
    k.box(30, 0.4, FZ1 - HZ1, 0, -0.2, (HZ1 + FZ1) / 2, terrazzo);
    k.box(HX0 + 15, 0.4, HZ1 - HZ0, (HX0 - 15) / 2, -0.2, (HZ0 + HZ1) / 2, terrazzo);
    k.box(15 - HX1, 0.4, HZ1 - HZ0, (HX1 + 15) / 2, -0.2, (HZ0 + HZ1) / 2, terrazzo);
    for (const s of [-1, 1]) {
      k.box(1.2, 14, L + 4, s * 12.6, 7, ZC, lime);
      k.box(0.25, 1.0, L + 4, s * 11.95, 0.5, ZC, k.flat(0x2a2c2e, 0.3, 0.5));
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
    // the hanging clock: Peter Pennoyer's 12 foot tall, 6 foot wide four sided case, pewter finish, from the centre truss, as a model
    k.prop('penn/moynihan_clock', 0, 13.2 - 4.4, -22, { height: 4.4 });
    k.point(0, 7.0, -22, 0xfff0d0, 40, 20);
    // The Hive over the 31st Street entry: an upside down mirrored city hanging from the ceiling
    const mirror = k.flat(0xdfe4ea, 1.0, 0.08), hrnd = X.mulberry(31);
    const towers: [number, number, number, number][] = [];
    for (let i = 0; i < 24; i++) { const h = 0.8 + hrnd() * 2.6, w = 0.3 + hrnd() * 0.45; towers.push([w, h, -9.7 + (i % 6) * 0.82 + hrnd() * 0.2, 8.2 + Math.floor(i / 6) * 1.05]); }
    for (const [w, h, x, z] of towers) { k.box(w, h, w, x, 14 - h / 2, z, mirror); k.box(w * 0.7, 0.04, w * 0.7, x, 14 - h - 0.02, z, k.glow(0xfff2d8)); }
    // THE TRICK: the same city again, right way up, in a black well under it, so the floor seems to mirror the Hive.
    // It is a stage mirror: no reflection is computed, the double is built (shallower than a true mirror, so it can be seen).
    const pitBlack = k.flat(0x07090b, 0.2, 0.9);
    k.box(HX1 - HX0, 0.2, HZ1 - HZ0, (HX0 + HX1) / 2, -4.6, (HZ0 + HZ1) / 2, pitBlack);
    for (const [x0, x1, z0, z1] of [[HX0 - 0.2, HX0, HZ0, HZ1], [HX1, HX1 + 0.2, HZ0, HZ1], [HX0, HX1, HZ0 - 0.2, HZ0], [HX0, HX1, HZ1, HZ1 + 0.2]]) k.box(x1 - x0, 4.6, z1 - z0, (x0 + x1) / 2, -2.3, (z0 + z1) / 2, pitBlack);
    const lowCity = k.flat(0xd8dee4, 0.55, 0.22, { emissive: 0x3a4048 });
    for (const [w, h, x, z] of towers) { k.box(w, h, w, x, -4.5 + h / 2, z, lowCity); k.box(w * 0.7, 0.04, w * 0.7, x, -4.5 + h + 0.02, z, k.glow(0xfff2d8)); }
    // an open well with a low glass balustrade, so the visitor leans over it rather than walks across it
    const balG = k.glass(0xd7e6ec, 0.1, 0.04);
    for (const [cx, cz, w, d] of [[(HX0 + HX1) / 2, HZ0 - 0.1, HX1 - HX0 + 0.2, 0.05], [(HX0 + HX1) / 2, HZ1 + 0.1, HX1 - HX0 + 0.2, 0.05], [HX1 + 0.1, (HZ0 + HZ1) / 2, 0.05, HZ1 - HZ0 + 0.2], [HX0 - 0.1, (HZ0 + HZ1) / 2, 0.05, HZ1 - HZ0 + 0.2]] as number[][]) {
      k.box(w, 1.0, d, cx, 0.5, cz, balG);
      k.box(Math.max(w, 0.08), 0.06, Math.max(d, 0.08), cx, 1.02, cz, k.flat(0x8a8f96, 0.8, 0.3));
    }
    k.block(HX0 - 0.3, HX1 + 0.3, HZ0 - 0.3, HZ1 + 0.3);
    for (const [x0, z0, w, d] of [[HX0, (HZ0 + HZ1) / 2, 0.12, HZ1 - HZ0], [HX1, (HZ0 + HZ1) / 2, 0.12, HZ1 - HZ0]] as number[][]) k.box(w, 0.04, d, x0, 0.01, z0, k.flat(0x8a8f96, 0.8, 0.3));
    k.point((HX0 + HX1) / 2, -0.4, (HZ0 + HZ1) / 2, 0xfff0d8, 40, 9);
    // Go, the backlit stained glass ceiling over the 33rd Street entry (colour field only, no figures)
    k.box(4.2, 0.08, 3.2, 7.8, 13.9, 10.2, k.glow(0x9cc3e6));
    for (const dx of [-0.7, 0.7]) k.box(0.06, 0.1, 3.2, 7.8 + dx, 13.85, 10.2, dark);
    // departure boards: the census as a timetable
    for (const z of [-36, -50]) {
      k.box(8, 3.4, 0.3, 0, 7.4, z, dark);
      k.sign('DEPARTURES  ·  ALL NEW YORKERS  ·  ON TIME', 7.6, 0.5, 0, 8.8, z + 0.17, '#0f1a24', '#ffffff', 60, 0);
      const rows = ctx.all.slice(60 + (z === -36 ? 0 : 6), 66 + (z === -36 ? 0 : 6));
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
    // travellers with somewhere to be, and the hall's own wayfinding over the two street entrances
    const pc = [0x24262c, 0x3a3a44, 0x6a5a48, 0xd8d0c0, 0x2b3f5e, 0x151517, 0x8a3a3a, 0x4a6a8a, 0xc9b28a];
    k.crowd([v(-8, 0, 6), v(-3, 0, -8), v(3, 0, -30), v(8, 0, -50)], 16, { seed: 81, speed: 1.25, spread: 1.6, colors: pc });
    k.crowd([v(8, 0, 4), v(2, 0, -14), v(-4, 0, -38), v(-8, 0, -56)], 14, { seed: 82, speed: 1.15, spread: 1.6, colors: pc });
    k.crowd([v(-9, 0, -46), v(0, 0, -40), v(9, 0, -46)], 8, { seed: 83, speed: 0.9, spread: 1.0, colors: pc });
    for (const [x, t] of [[-7.6, '31ST STREET  ·  8TH AVENUE'], [7.6, '33RD STREET  ·  8TH AVENUE']] as [number, string][]) k.sign(t, 5.2, 0.5, x, 6.2, 13.85, '#0f1a24', '#ffffff', 72, PI);
    /* 2026-11-23 Firefly: a sepia memory of the 1910 station over the entrance, the building the city tore down in 1963 */
    { const mem = k.mesh(new T.PlaneGeometry(12, 6), k.image(TEXP + 'penn/old_penn.webp', { opaque: true, emissive: 0x6e6254, roughness: 0.9 }), 0, 10.3, 13.82); mem.rotation.y = PI; }
    for (const s of [-1, 1]) for (const z of [2, -20, -42]) for (const dx of [-0.9, 0.9]) k.prop('rope_stanchion', s * 6.4 + dx, 0, z + 2.6, { height: 1.0 });
    // easter eggs: the post office under the train hall
    const asce = { name: 'How New York\'s Moynihan Train Hall brings back glamour to train travel, ASCE Civil Engineering', url: 'https://asce.org/publications-and-news/civil-engineering-source/civil-engineering-magazine/issues/magazine-issue/article/2022/03/how-new-yorks-moynihan-train-hall-brings-back-glamour-to-train-travel' },
      timeout = { name: 'Three astonishing works of art are inside the new Moynihan Train Hall, Time Out New York', url: 'https://www.timeout.com/newyork/news/three-astonishing-works-of-art-are-inside-the-new-moynihan-train-hall-123020' };
    k.egg(v(0, 14.6, 0), { id: 'penn-trusses', title: 'Catwalks for postal inspectors', year: '1912', text: 'The hall was the mail sorting room of the Farley Post Office, a column free space spanned by three riveted steel trusses, each 150 feet long and 50 feet apart. Each truss is really two parallel bents about 3 feet apart, and the gap between them served as an overhead gallery for postal inspectors watching the floor below.', clue: 'Look up into the nearest truss.', source: asce }, { r: 2 });
    k.egg(v(0, 18.2, -11), { id: 'penn-blackout', title: 'A skylight that went dark', text: 'The mailroom roof had skylights, but they were blacked out during the Second World War and later replaced with concrete slabs. The new roof is four catenary glass vaults rising 92 feet, and removing the slabs between the old floor levels added 20 feet of height.', clue: 'Look up between the first and second trusses.', source: asce }, { r: 2 });
    k.egg(v(0, 9.4, -22), { id: 'penn-clock', title: 'A clock for meeting under', year: '2021', text: 'The hall\'s clock was designed by Peter Pennoyer Architects: a 12 foot tall case with stepped, Art Deco extensions and a pewter like finish that catches the daylight from the skylight. Its numerals use a typeface designed in 1936 for road and railroad signage, and Americlock made the clockworks and faces.', clue: 'Meet under the clock on the centre truss.', source: { name: 'Moynihan Train Hall Clock, Peter Pennoyer Architects', url: 'https://www.ppapc.com/projects/mthclock/' } }, { r: 2 });
    k.egg(v(-7.6, 12.4, 9.7), { id: 'penn-hive', title: 'The city hanging upside down', year: '2020', text: 'Over the 31st Street entrance hangs The Hive by Elmgreen and Dragset: an upside down cityscape of 91 small buildings, each about 9 feet tall, dangling like glowing stalactites. It weighs more than 30,000 pounds and is lit by 72,000 LEDs.', clue: 'Look up at the ceiling near the entrance, on the left.', source: timeout }, { r: 2 });
    k.egg(v(7.8, 13.6, 10.2), { id: 'penn-go', title: 'Breakdancers in the clouds', year: '2020', text: 'Over the 33rd Street entrance Kehinde Wiley made Go, a hand painted, backlit stained glass triptych modelled on Tiepolo\'s ceiling frescoes. It shows young Black New Yorkers in breakdance poses among clouds, pigeons and a jet plane. In the ticketed waiting room nearby, Stan Douglas restaged nine forgotten moments of the old Penn Station in photographs.', clue: 'Look up at the glowing ceiling near the entrance, on the right.', source: timeout }, { r: 2 });
    k.egg(v(-6, 11, 13.8), { id: 'penn-motto', title: 'Neither snow nor rain', year: '1912', text: 'The Eighth Avenue front of the Farley Building carries the line about couriers that neither snow nor rain nor heat nor gloom of night stays from their appointed rounds. The words come from Herodotus, describing the mounted messengers of Xerxes, and the Treasury picked it for the building in 1912. The facade behind it has 20 Corinthian columns, each 53 feet tall.', clue: 'Turn around to the entrance wall and picture the street front beyond it.', source: { name: 'James A. Farley Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/James_A._Farley_Building' } }, { r: 1.8 });
    k.egg(v(-7.6, -2.4, 10), { id: 'penn-mirror-pit', title: 'A mirror with nothing in it', text: 'Lean over the black well under the Hive and the city stands the right way up down there, as if the floor were a mirror. There is no mirror. The second city is built, tower for tower, in a well under the floor, the way theatres faked reflections before glass was cheap. The real Hive is 91 upside down buildings lit by 72,000 LEDs.', clue: 'Lean over the dark well by the 31st Street doors and look down.', source: timeout }, { r: 2.2 });
    const mounts = corridorMounts({ pairs: 10, x: 11.9, z0: 2, pitch: 6.4, y: 3.5, width: 5.6, height: 3.2, inset: 5.4, style: 'steel' });
    // the track desks stand where four of these would be viewed from: view those from closer to the wall
    for (const m of mounts) if (k.keepOut.some((o) => Math.hypot(m.target.x - o.x, m.target.z - o.z) < o.r + 0.3)) m.target.x = Math.sign(m.target.x) * 8.7;
    for (const x of [-6.6, 6.6]) mounts.push({ position: v(x, 3.4, ZC - L / 2 - 0.35), rotation: 0, target: v(x, 3, ZC - L / 2 + 6), width: 5.4, height: 3.1, style: 'steel' });
    for (const x of [-6.6, 6.6]) mounts.push({ position: v(x, 3.4, 13.85), rotation: PI, target: v(x, 3, 8), width: 5.4, height: 3.1, style: 'steel' });
    freeTargets(k, mounts, [-10.6, 10.6, ZC - L / 2 + 2, 12.5]);
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
    k.sky({ top: 0x3d5450, horizon: 0x6e7e72, ground: 0x2c2a26, fog: 0.004, env: 0.6 });
    k.hemi(0xe5dcc4, 0x2e2a22, 0.75);
    k.sun(0xffe9c0, 1.4, 30, 40, -10, true, 60);
    /* THE BIG UPGRADE 2026-11-23: scanned Tennessee marble floor and Caen stone walls, the end walls built as real
       lunettes with three great arched windows cut through them (reveals, mullions, the glass catwalks), the zodiac
       vault as a painted plate, the brass ball clock and ten bare bulb chandeliers as models, commuters, and the
       anamorphic MEET ME AT THE CLOCK painted on the floor. */
    const marble = scan(k, 'grand/marble', 4.5, { color: 0xf0d8c8, roughness: 0.55, normal: 0.6 }),
      caen = scan(k, 'grand/caen', 7, { color: 0xdccdb0, normal: 0.9 }),
      lime = k.pbr('limeGC', X.ashlar(0xc7b998, 5, 3), 0.18),
      brass = k.pbr('brassGC', X.gilt(0xc8a45a), 2, { metalness: 0.85, roughness: 0.28 }),
      dark = k.flat(0x1a2024, 0.4, 0.6),
      bronze = k.flat(0x3a3226, 0.8, 0.45),
      opal = k.glow(0xfff0cc),
      pane = k.glow(0x9fb2b4, 0.82),
      /* 2026-11-23 Firefly: the view out through the great windows, haze and Midtown towers, on every pane */
      paneView = k.image(TEXP + 'grand/window_glow.webp', { opaque: true, emissive: 0xd8d2c2, roughness: 0.4 }),
      catwalk = k.glass(0xdfe8e6, 0.35, 0.05);
    const L = 76, ZC = 12 - L / 2, H = 22, VB = H - 6, VR = 7.5, ZF = 14.5, ZB = -80;
    const vaultY = (x: number) => VB + Math.sqrt(Math.max(0, 1 - (x / 12.6) ** 2)) * VR;
    k.box(30, 0.4, ZF - ZB, 0, -0.2, (ZF + ZB) / 2, marble);
    // marble border bands across the floor, the way the real concourse is laid in panels
    for (let z = 8; z > ZB + 6; z -= 9.6) k.box(24, 0.02, 0.22, 0, 0.01, z, k.flat(0x8a7466, 0.1, 0.4));
    for (const x of [-8, 8]) k.box(0.22, 0.02, ZF - ZB - 8, x, 0.01, (ZF + ZB) / 2, k.flat(0x8a7466, 0.1, 0.4));
    for (const s of [-1, 1]) {
      k.box(1.2, H, ZF - ZB, s * 12.6, H / 2, (ZF + ZB) / 2, caen);
      k.box(0.3, 1.1, ZF - ZB, s * 11.9, 0.55, (ZF + ZB) / 2, marble);   // marble wainscot
      k.moulding([[0, 0], [0.9, 0], [0.95, 0.25], [0.7, 0.5], [0.75, 0.75], [0.35, 1.0], [0, 1.1]], ZF - ZB, s * 12 - s * 0.02, 9.2, (ZF + ZB) / 2, lime, s > 0 ? PI : 0);
      k.moulding([[0, 0], [0.6, 0], [0.65, 0.18], [0.5, 0.35], [0.55, 0.5], [0.25, 0.7], [0, 0.8]], ZF - ZB, s * 12 - s * 0.02, VB - 0.8, (ZF + ZB) / 2, lime, s > 0 ? PI : 0);
      for (const z of [0, -22, -44]) {
        k.arch(7, 10, 0.5, s * 11.85, 10.4, z, lime).rotation.y = s > 0 ? -PI / 2 : PI / 2;
        k.box(0.06, 9, 6.6, s * 11.8, 14.6, z, pane);
        for (let dz = -3; dz <= 3; dz += 0.75) k.box(0.12, 9, 0.06, s * 11.75, 14.6, z + dz, bronze);
        for (let y = 11; y < 19.5; y += 1.4) k.box(0.12, 0.06, 6.6, s * 11.75, y, z, bronze);
        for (const dz of [-4.6, 4.6]) k.column(s * 11.3, 0.1, z + dz, 20.4, 0.34, caen, true, brass);
      }
      // pilasters with Corinthian capitals between the bays, clear of the arches
      for (let z = 7.2; z > ZB + 2; z -= 6.4) {
        if ([0, -22, -44].some((a) => Math.abs(z - a) < 5.2)) continue;
        k.box(0.9, VB - 1.6, 0.36, s * 11.85, (VB - 1.6) / 2, z, caen);
        k.prop('corinthian_capital', s * 11.75, VB - 1.6, z, { height: 1.1, rotY: s > 0 ? -PI / 2 : PI / 2 });
      }
    }
    // dentils under the vault springing, one draw call
    const dent: T.Matrix4[] = [];
    for (const s of [-1, 1]) for (let z = ZF; z > ZB; z -= 0.55) dent.push(new T.Matrix4().makeTranslation(s * 11.8, VB - 0.95, z));
    k.instances(new T.BoxGeometry(0.22, 0.26, 0.28), k.flat(0xd9c8a4, 0, 0.8), dent);
    // the celestial vault: one shell carrying the zodiac plate (FIREFLY_QUEUE: grand/zodiac.webp)
    const seg = 48, vault = new T.BufferGeometry(), pos: number[] = [], uvs: number[] = [], idx: number[] = [];
    for (const [zi, z] of [[0, ZF], [1, ZB]] as [number, number][]) for (let i = 0; i <= seg; i++) { const t = (i / seg) * PI; pos.push(Math.cos(t) * 12.6, VB + Math.sin(t) * VR, z); uvs.push(zi, i / seg); }
    for (let i = 0; i < seg; i++) idx.push(i, i + seg + 1, i + 1, i + 1, i + seg + 1, i + seg + 2);
    vault.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    vault.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
    vault.setIndex(idx);
    vault.computeVertexNormals();
    const sky = k.image(TEXP + 'grand/zodiac.webp', { opaque: true, emissive: 0x5a6a66, roughness: 0.85, color: 0xb8c8c0 });
    k.mesh(vault, sky, 0, 0, 0, true);
    for (let z = 12; z > ZB; z -= 12) k.curve(Array.from({ length: 41 }, (_, i) => { const t = (i / 40) * PI; return v(Math.cos(t) * 12.45, VB + Math.sin(t) * (VR - 0.12), z); }), 0.1, brass, 40);
    // the lit stars: the real ceiling has a few dozen bulbs in the brightest stars
    const rnd = X.mulberry(11);
    for (let i = 0; i < 60; i++) { const t = 0.2 + rnd() * (PI - 0.4), z = 12 - rnd() * (ZF - ZB - 4); k.sphere(0.06 + rnd() * 0.05, Math.cos(t) * 12.4, VB + Math.sin(t) * (VR - 0.15), z, opal, 6); }
    // the end walls: built lunettes with the three great arched windows cut through them
    const lunette = (z: number, face: number) => {
      const sh = new T.Shape();
      sh.moveTo(-12.6, 0); sh.lineTo(12.6, 0); sh.lineTo(12.6, VB);
      for (let i = 0; i <= 40; i++) { const t = (i / 40) * PI; sh.lineTo(Math.cos(t) * 12.6, VB + Math.sin(t) * VR); }
      sh.lineTo(-12.6, 0);
      const wins: [number, number, number, number][] = [[-7.6, 4.6, 9.6, 17.2], [0, 5.8, 9.2, 18.6], [7.6, 4.6, 9.6, 17.2]];
      for (const [cx, w, y0, y1] of wins) {
        const hole = new T.Path(), r = w / 2, ys = y1 - r;
        hole.moveTo(cx - r, y0); hole.lineTo(cx + r, y0); hole.lineTo(cx + r, ys);
        hole.absarc(cx, ys, r, 0, PI, false);
        hole.lineTo(cx - r, y0);
        sh.holes.push(hole);
      }
      const g = new T.ExtrudeGeometry(sh, { depth: 1.4, bevelEnabled: false, curveSegments: 20 });
      g.translate(0, 0, -0.7);
      const o = k.mesh(g, caen, 0, 0, z);
      o.rotation.y = face > 0 ? 0 : PI;
      for (const [cx, w, y0, y1] of wins) {
        const r = w / 2, ys = y1 - r, back = z - face * 0.55;
        // glass and the bronze grid, then the catwalk floors seen through it
        const gl = new T.Shape(); gl.moveTo(cx - r, y0); gl.lineTo(cx + r, y0); gl.lineTo(cx + r, ys); gl.absarc(cx, ys, r, 0, PI, false); gl.lineTo(cx - r, y0);
        const gg = new T.ShapeGeometry(gl, 16), ua = gg.attributes.uv as T.BufferAttribute, pa = gg.attributes.position as T.BufferAttribute;
        for (let i = 0; i < ua.count; i++) ua.setXY(i, (pa.getX(i) - (cx - r)) / w, (pa.getY(i) - y0) / (y1 - y0));
        const gp = k.mesh(gg, paneView, 0, 0, back, true);
        gp.rotation.y = face > 0 ? 0 : PI;
        if (face < 0) gp.position.x = 0;
        for (let x = cx - r + w / 6; x < cx + r - 0.1; x += w / 6) { const top = ys + Math.sqrt(Math.max(0, r * r - (x - cx) ** 2)); k.box(0.1, top - y0, 0.12, face > 0 ? x : -x, (top + y0) / 2, back + face * 0.04, bronze); }
        for (let y = y0 + 1.1; y < y1 - 0.2; y += 1.1) { const half = y > ys ? Math.sqrt(Math.max(0, r * r - (y - ys) ** 2)) : r; k.box(half * 2, 0.08, 0.12, face > 0 ? cx : -cx, y, back + face * 0.04, bronze); }
        for (const y of [12.2, 15.4]) k.box(w, 0.06, 1.1, face > 0 ? cx : -cx, y, z - face * 0.05, catwalk);
        k.box(w + 0.6, 0.3, 1.8, face > 0 ? cx : -cx, y0 - 0.15, z + face * 0.2, marble);
      }
    };
    lunette(ZB + 0.7, 1);
    lunette(ZF - 0.7, -1);
    // shafts of light through the far windows, the photograph everyone knows
    const shaftMat = new T.MeshBasicMaterial({ map: X.pool(), transparent: true, opacity: 0.2, color: 0xfff0d0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
    for (const cx of [-7.6, 0, 7.6]) {
      const shaft = k.mesh(new T.PlaneGeometry(4.2, 34), shaftMat, cx * 0.7, 7.5, ZB + 15, true);
      shaft.rotation.x = Math.atan2(-30, 14);
      shaft.renderOrder = 3;
    }
    // the west balcony over the stair, its balustrade and the name on its fascia
    k.box(25.2, 0.55, 2.6, 0, 7.5, ZB + 2.6, caen);
    k.box(25.2, 0.18, 2.8, 0, 7.82, ZB + 2.6, marble);
    for (let x = -10.4; x <= 10.5; x += 3.3) k.prop('balustrade', x, 7.9, ZB + 3.7, { height: 1.05 });
    k.sign('GRAND CENTRAL TERMINAL', 9, 0.46, 0, 7.5, ZB + 3.92, '#2a2a22', '#e8cf8a', 70, 0);
    // the information booth: marble drum, brass grilles, and the ball clock as a model on its roof
    const BZ = -26;
    k.lathe([[2.55, 0], [2.6, 0.12], [2.42, 0.22], [2.42, 1.1], [2.6, 1.2], [2.6, 1.32]], 0, 0, BZ, marble, 36);
    for (let j = 0; j < 36; j++) { const t = (j * PI) / 18; k.beam(v(Math.cos(t) * 2.38, 1.32, BZ + Math.sin(t) * 2.38), v(Math.cos(t) * 2.38, 2.42, BZ + Math.sin(t) * 2.38), 0.03, brass, 5); }
    k.torus(2.38, 0.05, 0, 1.86, BZ, brass, 36).rotation.x = PI / 2;
    k.cyl(2.3, 1.1, 0, 1.87, BZ, k.glass(0xe9dfc4, 0.18, 0.05), 2.3, 36);
    k.lathe([[2.62, 0], [2.66, 0.14], [2.4, 0.26], [1.6, 0.42], [0.7, 0.52], [0.4, 0.56]], 0, 2.42, BZ, brass, 36);
    k.prop('grand/opal_clock', 0, 2.92, BZ, { height: 2.9 });
    for (const r of [0, PI]) k.sign('INFORMATION', 2.2, 0.3, Math.sin(r) * 2.45, 1.0, BZ + Math.cos(r) * 2.45, '#a58c51', '#192d2b', 105, r);
    k.keepOut.push({ x: 0, z: BZ, r: 3.2 });
    k.point(0, 6.4, BZ, 0xffe6b8, 34, 16);
    // ten chandeliers of bare bulbs, as models, on rods from the vault
    for (const z of [4, -12, -28, -44, -58]) for (const s of [-1, 1]) {
      k.beam(v(s * 7, vaultY(7) - 0.1, z), v(s * 7, 11.1, z), 0.03, brass, 5);
      k.prop('grand/chandelier', s * 7, 8, z, { height: 3.16 });
      if (z === -12 || z === -44) k.point(s * 7, 8.6, z, 0xffdfae, 40, 22);
    }
    // the stair to the balcony, with its balusters
    const sz = ZC - L / 2 + 1;
    for (let i = 0; i < 12; i++) k.box(18, 0.34, 0.9, 0, 0.17 + i * 0.34, sz - 2 - i * 0.9, marble);
    k.box(18, 4.2, 4, 0, 2.1, sz - 14.6, marble);
    for (const s of [-1, 1]) for (let i = 0; i <= 12; i++) k.lathe([[0.1, 0], [0.13, 0.15], [0.07, 0.45], [0.12, 0.85], [0.16, 0.95]], s * 8.6, 0.34 + i * 0.34, sz - 2 - i * 0.9, marble, 10);
    for (const s of [-1, 1]) k.beam(v(s * 8.6, 1.3, sz - 2), v(s * 8.6, 5.3, sz - 13), 0.07, brass, 6);
    k.keepOut.push({ x: 0, z: sz - 8, r: 10 });
    k.censusWall({ x: 0, y: 5.4, z: ZB + 1.42, rotY: 0, cols: 24, rows: 3, tile: 0.62, gap: 0.05, start: ctx.wallStart(3900, 72), pieces: ctx.all, backing: dark });
    k.sign('42ND STREET  ·  VANDERBILT AVENUE', 9, 0.8, 0, 8.4, ZF - 1.45, '#5a665b', '#f8edce', 85, PI, { border: true });
    // wayfinding in the house lettering over the side arches
    const way = ['TO TRACKS 11 · 24', 'LEXINGTON AVENUE', 'TO TRACKS 25 · 42', 'DINING CONCOURSE', 'TO SUBWAY', 'VANDERBILT HALL'];
    [0, -22, -44].forEach((z, i) => { for (const s of [-1, 1]) k.sign(way[i * 2 + (s > 0 ? 1 : 0)], 4.6, 0.42, s * 11.55, 8.95, z, '#151a17', '#e8cf8a', 80, s > 0 ? -PI / 2 : PI / 2); });
    // commuters crossing the concourse, around the booth and never through it
    const cc = [0x24262c, 0x3a3a44, 0x6a5a48, 0xd8d0c0, 0x2b3f5e, 0x151517, 0x8a3a3a, 0xc9b28a];
    k.crowd([v(-9, 0, 8), v(-2, 0, -6), v(9, 0, -14)], 14, { seed: 91, speed: 1.1, spread: 1.4, colors: cc });
    k.crowd([v(9, 0, 6), v(5, 0, -12), v(-4, 0, -24), v(-9, 0, -40)], 16, { seed: 92, speed: 1.2, spread: 1.4, colors: cc });
    k.crowd([v(-9, 0, -52), v(0, 0, -44), v(9, 0, -36)], 12, { seed: 93, speed: 1.0, spread: 1.2, colors: cc });
    // the trick: MEET ME AT THE CLOCK, painted long across the marble, upright only from the 42nd Street doors
    const eye = v(0, 3, 10);
    const meet = anamorphFloor(k, letters('MEET ME AT THE CLOCK', 1024, 150, '#d9b968', 104), eye, v(0, 0, -5), 7.4, 1.08);
    // the patch of old grime left on purpose, beside Cancer, and the small hole from the 1957 rocket display
    const grime = k.flat(0x1f2a24, 0, 1);
    const patch = k.mesh(new T.PlaneGeometry(0.9, 0.5), grime, 6.6, vaultY(6.6) - 0.06, -33, true);
    patch.lookAt(0, VB, -33);
    const hole = k.mesh(new T.CircleGeometry(0.14, 12), k.flat(0x080808, 0, 1), -2.4, vaultY(2.4) - 0.05, -42, true);
    hole.lookAt(0, VB, -42);
    // easter eggs
    const mc = { name: 'Main Concourse (Grand Central Terminal), Wikipedia', url: 'https://en.wikipedia.org/wiki/Main_Concourse_(Grand_Central_Terminal)' };
    k.egg(v(0, H + 1.2, -16), { id: 'grand-backwards-sky', title: 'The sky is on backwards', year: '1913', text: 'The gold constellations on the turquoise ceiling are reversed left to right, and so is their overall arrangement, though the stars inside some constellations are drawn as seen from Earth. A commuter spotted the mistakes in 1913, the year the terminal opened, and they have never been corrected. The ceiling carries more than 2,500 stars.', clue: 'Look straight up and find a constellation you know.', source: mc }, { r: 2.4 });
    k.egg(patch, { id: 'grand-dark-patch', title: 'The patch they left dirty', year: '1998', text: 'When the ceiling was restored in the late 1990s, one single patch was left uncleaned, and it is still there. The constellation Cancer, the crab, points toward it.', clue: 'Find the crab on the ceiling and follow where it points.', source: mc }, { r: 1.2 });
    k.egg(v(0, 4.5, BZ), { id: 'grand-opal-clock', title: 'Not actually opal', text: 'The four faced clock on the information booth has faces 24 inches across in opalescent glass. For years tour guides, and even Wikipedia, repeated that the faces were precious opal worth millions. Untapped New York debunked it: the glass is opalescent, often called opal or milk glass, and is no gemstone.', clue: 'Meet at the clock on the information booth.', source: mc }, { r: 1.4 });
    k.egg(v(0, 5.9, BZ), { id: 'grand-acorn', title: 'Great oaks from little acorns', year: '1913', text: 'The brass ball clock was made by the Self Winding Clock Company of Brooklyn, and it is crowned with a brass acorn. The acorn was the Vanderbilt family symbol: Cornelius Vanderbilt took the saying great oaks from little acorns grow as the family motto, and acorns turn up all over the terminal.', clue: 'Look at the very top of the clock.', source: { name: 'The Grand Central clock: myths and secrets, Untapped New York', url: 'https://untappedcities.com/2020/09/03/the-grand-central-clock-myths-and-secrets/' } }, { r: 0.9 });
    k.egg(hole, { id: 'grand-redstone', title: 'The hole in the heavens', year: '1957', text: 'In 1957 a Redstone rocket was put on display in the concourse. The popular story says it was so tall it was poked through the ceiling, but the rocket was more than 50 feet shorter than the 125 foot room. The small hole that survives was likely made to anchor a stabilizing wire, and it was kept when the ceiling was restored.', clue: 'Search the vault for a small dark hole among the stars.', source: { name: 'The myths of Grand Central Terminal, Untapped New York', url: 'https://untappedcities.com/2022/07/21/myths-of-grand-central-terminal/3/' } }, { r: 1.2 });
    k.egg(v(-9.6, 2.2, 11.6), { id: 'grand-whisper', title: 'The whispering gallery', text: 'One level down, under the walkway over the ramps to the Oyster Bar, the vaulted tile ceiling carries sound across the arch. Stand in one corner and whisper into the wall, and someone in the diagonally opposite corner hears you clearly.', clue: 'Find a corner by the entrance and whisper.', source: { name: 'Grand Central Terminal, Wikipedia', url: 'https://en.wikipedia.org/wiki/Grand_Central_Terminal' } }, { r: 1.4 });
    k.egg(v(0, 2.2, sz - 6), { id: 'grand-stairs', title: 'The staircase that waited', text: 'The marble staircase on the west side was built for the opening in 1913. Its twin on the east side was in the original plans but was only built during the restoration of the 1990s, which brought the concourse close to its 1913 appearance.', clue: 'Climb the grand marble stair at the far end.', source: mc }, { r: 1.8 });
    k.egg(meet, { id: 'grand-meet-me', title: 'Meet me at the clock', text: 'The clock on the information booth is the most famous meeting point in New York, and this floor paints the line people say. It is an anamorphic painting: from anywhere else it is a long smear of gold across the marble, and only from the 42nd Street doors does it stand up and read. The trick is as old as Holbein\'s skull in The Ambassadors.', clue: 'Go back to the doors you came in by and look down the concourse.', source: mc }, { r: 2.2 });
    const mounts = corridorMounts({ pairs: 10, x: 11.9, z0: 4, pitch: 6.4, y: 3.5, width: 5.6, height: 3.2, inset: 5.4, style: 'gilt' });
    for (const m of mounts) if (Math.abs(m.position.z - 0) < 2.6 || Math.abs(m.position.z + 22) < 2.6 || Math.abs(m.position.z + 44) < 2.6) { m.position.y = 3.2; m.width = 4.6; m.height = 2.7; }
    for (const x of [-6.6, 6.6]) mounts.push({ position: v(x, 3.4, ZF - 1.45), rotation: PI, target: v(x, 3, ZF - 7), width: 4.6, height: 2.8, style: 'gilt' });
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
    /* THE BIG UPGRADE 2026-11-23: scanned concrete planks, ballast, rusted rail, brick and ipe; the planting as models
       (Poly Haven CC0 shrubs and grasses); the cross street signs; a painted wall ad (a Firefly plate in the queue);
       and at the end, the rail bed running on north for miles, which is a forced perspective set thirty metres deep. */
    const plank = scan(k, 'highline/plank', 1.4, { color: 0xb4aea4, roughness: 0.85 }),
      gravel = scan(k, 'highline/ballast', 1.6, { color: 0xb8b0a4 }),
      soil = k.flat(0x3d3128, 0, 1),
      grass = k.flat(0x8a9a5a, 0, 0.95, { side: T.DoubleSide }),
      grass2 = k.flat(0x5d7a44, 0, 0.95, { side: T.DoubleSide }),
      iron = k.flat(0x35302c, 0.6, 0.6),
      rust = scan(k, 'highline/rust', 0.8, { metalness: 0.4 }),
      ipe = scan(k, 'highline/ipe', 1.6, { color: 0xc89a78, roughness: 0.8 }),
      brick = scan(k, 'highline/brick', 2.4, { color: 0xe0b8a8 }),
      brick2 = scan(k, 'highline/brick', 2.4, { color: 0x9a8c94 }),
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
    k.instances(new T.PlaneGeometry(0.035, 1.2).translate(0, 0.6, 0), grass, blades);
    k.instances(new T.PlaneGeometry(0.05, 0.9).translate(0, 0.45, 0), grass2, blades2);
    for (const s of [-1, 1]) for (let z = 8; z > ZC - L / 2 + 4; z -= 7.5) {
      k.box(5.6, 0.25, 6, s * 7.4, 0.1, z, soil);
      for (let j = 0; j < 2; j++) k.prop('highline/shrub_0' + (1 + ((j + Math.round(-z)) % 4)), s * (8 + rnd() * 2.4), 0.1, z - 2.5 + rnd() * 5, { height: 1.1 + rnd() * 0.6, rotY: rnd() * 6 });
      if (z % 3 === 0 || rnd() > 0.5) k.tree(s * 8.6, 0.1, z - 3, { kind: 'round', h: 3.4, r: 1.6, leaf: 0x5f8a45, seed: Math.round(z) });
      k.prop('highline/shrub_0' + (1 + (Math.round(-z) % 4)), s * (6.1 + rnd() * 1.2), 0.1, z - 1.2, { height: 1.0 + rnd() * 0.5, rotY: rnd() * 6 });
      k.prop('highline/grass', s * (5.0 + rnd() * 0.6), 0.1, z + 1.6, { height: 0.9, rotY: rnd() * 6 });
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
      k.box(8.5, 0.25, 9.5, s * 16, h - 0.6, z, k.flat(0x8f857a, 0, 0.8));
      if (s < 0 && b === 5) { const ad = k.mesh(new T.PlaneGeometry(8.2, 10.2), k.image(TEXP + 'highline/mural.webp', { opaque: true, roughness: 0.9 }), -11.94, 10.4, z, true); ad.rotation.y = PI / 2; continue; }
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
    // the frame over the end is open now: brick piers carry two works, and between them the line runs on north
    for (const s of [-1, 1]) k.box(6.4, 10, 0.8, s * 9.2, 4.6, ez - 9.1, brick);
    k.box(12, 1.2, 0.8, 0, 8.9, ez - 9, iron);
    for (const s of [-1, 1]) k.box(0.4, 8.6, 0.8, s * 6, 4.4, ez - 9, iron);
    k.keepOut.push({ x: 0, z: ez - 4, r: 6 });
    // THE TRICK: three hundred metres of rail bed, built as real sections and then pulled toward the eye at the end of the
    // walk and shrunk about it, so from that spot it reads at full depth and from the side it is a thirty metre model.
    {
      const fe = v(0, 3, ez + 2.4), real0 = 12, realN = 420, fake0 = 12, fakeN = 40;
      const fake = (d: number) => fake0 + (fakeN - fake0) * (1 - real0 / d) / (1 - real0 / realN);
      const winTex = HAS_DOM ? X.windows(41, 0.25, 0x4c4650, true).map : null;
      const towerM = new T.MeshStandardMaterial({ map: winTex, color: 0xbfb4aa, roughness: 0.8, emissive: 0xffd9a8, emissiveMap: winTex, emissiveIntensity: 0.35 });
      const bed = k.flat(0x6a6258, 0, 1), green2 = k.flat(0x6f7f48, 0, 1), steelR = k.flat(0x4a3a30, 0.5, 0.6);
      const frnd = X.mulberry(77);
      const put = (w: number, h: number, d: number, x: number, y: number, dist: number, m: T.Material) => {
        const kk = fake(dist) / dist, cx = fe.x + (x - fe.x) * kk, cy = fe.y + (y - fe.y) * kk, cz = fe.z - dist * kk;
        const o = k.mesh(new T.BoxGeometry(w * kk, h * kk, d * kk), m, cx, cy, cz, true);
        return o;
      };
      for (let dist = real0; dist < realN; dist += 10) {
        put(12, 0.3, 10, 0, -0.15, dist + 5, bed);
        for (const x of [-0.75, 0.75]) put(0.12, 0.16, 10, x, 0.08, dist + 5, steelR);
        for (let j = 0; j < 3; j++) put(1.2 + frnd() * 2, 0.5 + frnd() * 0.8, 1.6, (frnd() > 0.5 ? 1 : -1) * (2 + frnd() * 3.5), 0.3, dist + frnd() * 10, green2);
        if ((dist / 10) % 2 === 0) for (const sd of [-1, 1]) { const hgt = 10 + frnd() * 26; put(9, hgt + 9, 14, sd * 15.5, hgt / 2 - 4.5, dist + 7, towerM); }
      }
      k.egg(v(0, 3, ez - 20), { id: 'highline-forever', title: 'A line that goes on forever', text: 'Through the frame the old rail bed seems to run north for blocks, grasses between the rails and towers either side. It is about thirty metres of set. Each block of it was built at full size and then drawn in toward your eye and shrunk, the way film sets fake a long street on a short lot, so it only works from the end of the walk. The real line runs 1.45 miles, from Gansevoort Street to 34th Street.', clue: 'Stand at the end of the walk and look through the frame.', source: { name: 'High Line, Wikipedia', url: 'https://en.wikipedia.org/wiki/High_Line' } }, { r: 3 });
    }
    k.sign('THE HIGH LINE', 7, 0.8, 0, 10.0, ez - 8.55, '#2b2f2c', '#f2f2de', 120, 0, { border: true });
    // the cross street signs on posts, as the park marks its blocks
    ['GANSEVOORT ST', 'W 14 ST', 'W 16 ST', 'W 18 ST', 'W 20 ST'].forEach((t, i) => { const z = 8 - i * 15, s = i % 2 ? 1 : -1; k.box(0.08, 2.4, 0.08, s * 5.2, 1.2, z, iron); k.sign(t, 1.7, 0.34, s * 5.2, 2.35, z, '#2b2f2c', '#ffffff', 72, s > 0 ? -PI / 2 : PI / 2, { double: true }); });
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
    /* THE BIG UPGRADE 2026-11-23: scanned weathered boards, beach sand and bathhouse plaster; a carousel of carved
       horses (models) turning on the beach; lifebuoys and picnic tables as models; the street and park signs; the
       sideshow banners (a Firefly plate in the queue); and CONEY ISLAND painted long across the boards (the trick). */
    const boards = scan(k, 'coney/boards', 1.3, { color: 0xd8c0a8, roughness: 0.85 }),
      white = k.flat(0xf1ede2, 0.2, 0.6),
      sand = scan(k, 'coney/sand', 3, { color: 0xf0e0c4 }),
      iron = k.flat(0x2f2c30, 0.6, 0.55),
      red = k.pbr('cycloneRed', X.plaster(0xb33a3a, 6), 0.5, { roughness: 0.6 }),
      cream = scan(k, 'coney/plaster', 2.6, { color: 0xf2e6c8, relief: true }),
      teal = scan(k, 'coney/plaster', 2.6, { color: 0x3e8a8c, relief: true }),
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
    for (const z of [-10, -36, -58]) k.prop('coney/lifebuoy', -12.6, 1.3, z, { height: 0.85, rotY: PI / 2 });
    for (const z of [-14, -40]) k.prop('coney/picnic', 6.8, 0, z, { height: 0.8, rotY: PI / 2, keepOut: 1.1 });
    // the sideshow banners along the bathhouse roofs (FIREFLY_QUEUE: coney/sideshow.webp)
    const show = k.image(TEXP + 'coney/sideshow.webp', { opaque: true, roughness: 0.8 });
    for (const [z, i] of [[-21.2, 0], [-33.8, 1], [-46.4, 2]] as [number, number][]) {
      const g = new T.PlaneGeometry(7.5, 2.5), uv = g.attributes.uv as T.BufferAttribute;
      for (let q = 0; q < uv.count; q++) uv.setX(q, (i + uv.getX(q)) / 3);
      const o = k.mesh(g, show, 12.1, 8.2, z, true); o.rotation.y = -PI / 2;
      for (const dz of [-3.4, 3.4]) k.box(0.12, 2.2, 0.12, 12.3, 7.4, z + dz, iron);
    }
    // street and park signs on the lamp posts
    for (const [z, t] of [[8, 'STILLWELL AV'], [-12, 'W 12 ST'], [-32, 'W 10 ST'], [-52, 'W 8 ST']] as [number, string][]) k.sign(t, 1.6, 0.32, 6.6, 3.4, z + 0.12, '#1f5a3a', '#ffffff', 72, 0, { double: true });
    k.sign('RIEGELMANN BOARDWALK', 3.4, 0.42, -6.6, 3.4, 8.12, '#5a3a24', '#f2e6c8', 64, 0, { double: true });
    // THE CAROUSEL on the beach: carved horses (models) on a turning platform under a striped canopy
    {
      const cx = -22, cz = -16, ride = new T.Group();
      ride.position.set(cx, 0, cz);
      k.add(ride);
      const brassC = k.flat(0xd8b060, 0.85, 0.3), red2 = k.flat(0xc8413c, 0.1, 0.6), wht = k.flat(0xf4eee0, 0.05, 0.6);
      const deck = new T.Mesh(new T.CylinderGeometry(7, 7, 0.5, 40), k.flat(0x8a5a3a, 0.1, 0.7)); deck.position.y = 0.05; ride.add(deck);
      const core = new T.Mesh(new T.CylinderGeometry(1.6, 1.6, 6.4, 24), k.flat(0xe8d8b0, 0.1, 0.5)); core.position.y = 3.3; ride.add(core);
      for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2, c = new T.Mesh(new T.ConeGeometry(8.2, 3, 16, 1, true, a, PI / 8), i % 2 ? red2 : wht); c.position.y = 7.8; ride.add(c); }
      for (let i = 0; i < 24; i++) { const a = (i / 24) * PI * 2, b = new T.Mesh(new T.SphereGeometry(0.12, 6, 4), k.glow(0xffe2a8)); b.position.set(Math.cos(a) * 8, 6.3, Math.sin(a) * 8); ride.add(b); }
      for (const [r, n, off] of [[5.6, 12, 0], [3.6, 8, 0.4]] as [number, number, number][]) for (let i = 0; i < n; i++) {
        const a = (i / n) * PI * 2 + off, x = Math.cos(a) * r, z = Math.sin(a) * r;
        const pole = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 6.2, 8), brassC); pole.position.set(x, 3.3, z); ride.add(pole);
        k.prop(r > 4 ? 'h_carousel_horse' : 'h_carousel_horse_lo', cx + x, 0.9 + (i % 2) * 0.4, cz + z, { height: 1.9, rotY: -a }).then((o) => { if (o) ride.attach(o); });
      }
      if (!ctx.reduced) k.ticks.push((t) => { ride.rotation.y = -t * 0.35; });
      k.point(cx, 5.5, cz, 0xffd9a0, 30, 14);
      k.sign('CAROUSEL', 5, 0.9, -12.9, 6.4, cz, '#c8413c', '#fff3d8', 120, PI / 2, { border: true });
      for (const dz of [-2.4, 2.4]) k.box(0.15, 3, 0.15, -12.9, 4.4, cz + dz, iron);
      k.egg(v(cx, 4, cz), { id: 'coney-carousel', title: 'Horses carved in Brooklyn', year: '1906', text: 'Coney Island was the capital of the carved carousel. Immigrant carvers such as Charles Carmel and Marcus Illions cut flashy, jewelled horses in Brooklyn workshops, a style still called Coney Island style. The B&B Carousell, which came to the boardwalk in 1932, has 50 hand carved horses and was restored and reopened at Luna Park in 2013.', clue: 'Look over the beach screens for the striped roof that turns.', source: { name: 'B&B Carousell, Wikipedia', url: 'https://en.wikipedia.org/wiki/B%26B_Carousell' } }, { r: 4 });
    }
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
    // THE TRICK: CONEY ISLAND painted forty metres long down the boards, standing up only from the top of the walk
    const painted = anamorphFloor(k, letters('CONEY ISLAND', 1024, 170, '#c8413c', 150), v(0, 3, 10), v(0, 0, -5), 8.6, 1.3);
    k.egg(painted, { id: 'coney-anamorph', title: 'Letters that stand up', text: 'From the top of the walk CONEY ISLAND stands up off the boards like a sign. Walk onto it and it is a long red smear stretched down the boardwalk. It is an anamorphic painting, the trick pavement artists use for their chalk holes and waterfalls: every letter is drawn as the shadow it would cast from one eye.', clue: 'Go back to where you came in and look down the boards.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 2.2 });
    const mounts = corridorMounts({ pairs: 10, x: 9.3, z0: 2, pitch: 6.6, y: 3.0, width: 5.4, height: 3.1, inset: 4.6, style: 'white' });
    for (let i = 1; i < 20; i += 2) { mounts[i].position.x = 11.95; mounts[i].position.y = 3.5; mounts[i].target.x = 6.6; }
    for (const x of [-8.6, 8.6]) mounts.push({ position: v(x, 3.0, ez - 1.5), rotation: 0, target: v(x * 0.6, 3, ez + 6), width: 4.6, height: 2.7, style: 'white' });
    freeTargets(k, mounts, [-8.2, 10.6, ez + 5, 11]);
    return { mounts, spawn: v(0, 3, 10), look: v(2, 4, -30), eye: 3, bounds: [-8.2, 10.6, ez + 5, 11], style: 'white' };
  },
};
