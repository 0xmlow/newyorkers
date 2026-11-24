/* Rooms 92 to 96: the Jewish Museum, the Rubin, the Shed, the Park Avenue Armory, the Custom House rotunda. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront } from './f';
import { mlowBanner, blossomFlag, donorWall, eyeMedallion, wordmarkRelief, eyeMonument, blossomGarden, INK, CLOUD, ELECTRIC, CYAN } from './brand';
import { hero, heroInstances } from './heroes';
import { hsign, paintTex, anamorphTex } from './f';
import { anamorph, fireflyPlate } from './a';
import type { Kit } from '../kit';

const PI = Math.PI;

/* ---------- THE BIG UPGRADE, wave 5c (2026-11-24): helpers for rooms 92 to 96 ----------
   The wave 4d pattern (q.ts), kept local: scanned CC0 surfaces from assets/museum/tex/<room>/ that wear a sensible colour
   until their maps land, real models from assets/museum/props/<room>/ placed many at once (seven or more become instanced
   parts), and painted canvases. Safe in node: the audit builds with no DOM, so scans fall back to paint. */
const HAS_DOM = typeof window !== 'undefined' && typeof HTMLImageElement !== 'undefined';
const texL = HAS_DOM ? new T.TextureLoader() : null;
const w5c = new Map<string, { s: X.Surface; ready: Promise<unknown> }>();
function sc(k: Kit, room: string, id: string, metres: number, paint: () => X.Surface, p: Partial<T.MeshStandardMaterialParameters> & { normal?: number; stretch?: number } = {}, wait = 0x888888) {
  if (!texL) return k.pbr(`w5c-${room}-${id}`, paint(), 1 / metres, p);
  let e = w5c.get(`${room}/${id}`);
  if (!e) {
    const low = k.o.quality !== 'high', waits: Promise<unknown>[] = [];
    const one = (suf: string, srgb: boolean) => {
      let done: () => void = () => {};
      waits.push(new Promise<void>((r) => (done = r)));
      const t = texL.load(`assets/museum/tex/${room}/${id}_${suf}.webp`, () => done(), undefined, () => done());
      t.wrapS = t.wrapT = T.RepeatWrapping;
      t.anisotropy = 8;
      if (srgb) t.colorSpace = T.SRGBColorSpace;
      return t as unknown as T.CanvasTexture;
    };
    e = { s: { map: one('c', true), normalMap: one('n', false), roughnessMap: low ? undefined : one('r', false) }, ready: Promise.all(waits) };
    w5c.set(`${room}/${id}`, e);
  }
  k.pending.push(e.ready);
  const m = k.pbr(`w5c-${room}-${id}`, e.s, 1 / metres, p);
  if (!m.userData.w5c) {
    m.userData.w5c = true;
    const maps = { map: m.map, normalMap: m.normalMap, roughnessMap: m.roughnessMap }, tint = m.color.clone();
    m.map = m.normalMap = m.roughnessMap = null;
    m.color.set(wait);
    void e.ready.then(() => { Object.assign(m, maps); m.color.copy(tint); m.needsUpdate = true; });
  }
  return m;
}
/* A real model fitted once and set at every [x, y, z, rotY, scale?]. */
function many(k: Kit, name: string, fit: Parameters<typeof hero>[2], at: number[][], tweak?: (o: T.Object3D) => void) {
  if (!at.length) return;
  void hero(k, name, fit).then((h) => {
    if (!h || !k.live) return;
    if (tweak) tweak(h);
    if (at.length > 6) {
      const ins = heroInstances(k, h, at.length), m = new T.Matrix4(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0);
      at.forEach(([x, y, z, r, s = 1], i) => ins.setAt(i, m.compose(new T.Vector3(x, y, z), q.setFromAxisAngle(up, r), new T.Vector3(s, s, s))));
      ins.commit();
      return;
    }
    at.forEach(([x, y, z, r, s = 1], i) => { const c = i ? h.clone() : h; c.position.set(x, y, z); c.rotation.y = r; c.scale.setScalar(s); k.add(c); });
  });
}
/* Recolour every material of a loaded model without touching the source cache. */
function tint(o: T.Object3D, hex: number, rough = 0.6, metal = 0.5) {
  const cache = new Map<T.Material, T.Material>();
  o.traverse((c) => { if (!(c instanceof T.Mesh)) return; const src = c.material as T.MeshStandardMaterial; let m = cache.get(src); if (!m) { const n = src.clone(); n.color.setHex(hex); n.roughness = rough; n.metalness = metal; m = n; cache.set(src, m); } c.material = m; });
}
/* Painted lettering for an anamorphic floor piece, in a house font. */
function floorType(text: string, fg: string, w = 1024, h = 256, font = 'W2 Archivo Expanded') {
  return paintTex(w, h, (g) => { g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; let s = h * 0.8; g.font = `800 ${s}px "${font}", Arial, sans-serif`; const tw = g.measureText(text).width; if (tw > w * 0.94) { s *= (w * 0.94) / tw; g.font = `800 ${s}px "${font}", Arial, sans-serif`; } g.fillText(text, w / 2, h / 2); }, [font]);
}
/* A run of boxes along x or z (string courses, skirting, dado rails), one merged mesh each. */
function band(k: Kit, axis: 'x' | 'z', len: number, w: number, h: number, x: number, y: number, z: number, m: T.Material) {
  return axis === 'x' ? k.box(len, h, w, x, y, z, m) : k.box(w, h, len, x, y, z, m);
}
/* Raised panelling on a wall: a grid of moulded panels proud of the wall face, facing `dir` (+1 or -1 along the normal axis). */
function panels(k: Kit, axis: 'x' | 'z', x: number, z: number, along0: number, along1: number, y0: number, y1: number, n: number, dir: number, m: T.Material, trim: T.Material) {
  const step = (along1 - along0) / n, pw = step * 0.78, ph = y1 - y0;
  for (let i = 0; i < n; i++) {
    const c = along0 + step * (i + 0.5);
    if (axis === 'z') { k.box(0.05, ph, pw, x + dir * 0.03, (y0 + y1) / 2, c, m); k.box(0.04, ph + 0.08, 0.06, x + dir * 0.06, (y0 + y1) / 2, c - pw / 2, trim); k.box(0.04, ph + 0.08, 0.06, x + dir * 0.06, (y0 + y1) / 2, c + pw / 2, trim); k.box(0.04, 0.06, pw, x + dir * 0.06, y0, c, trim); k.box(0.04, 0.06, pw, x + dir * 0.06, y1, c, trim); }
    else { k.box(pw, ph, 0.05, c, (y0 + y1) / 2, z + dir * 0.03, m); k.box(0.06, ph + 0.08, 0.04, c - pw / 2, (y0 + y1) / 2, z + dir * 0.06, trim); k.box(0.06, ph + 0.08, 0.04, c + pw / 2, (y0 + y1) / 2, z + dir * 0.06, trim); k.box(pw, 0.06, 0.04, c, y0, z + dir * 0.06, trim); k.box(pw, 0.06, 0.04, c, y1, z + dir * 0.06, trim); }
  }
}
const CORNICE: [number, number][] = [[0, 0], [0.5, 0], [0.56, 0.16], [0.36, 0.3], [0.5, 0.48], [0, 0.6]];

/* ---------------- 92 THE JEWISH MUSEUM ---------------- */
export const jewishmuseum: RoomDef = {
  id: 'jewishmuseum',
  name: 'The Warburg mansion',
  area: 'THE JEWISH MUSEUM',
  mood: 'Sunday on Museum Mile',
  color: '#b8a8c8',
  description: 'The French chateau mansion at 92nd and Fifth, the carved Indiana limestone and the slate mansard roofs, the panelled rooms inside stacked with galleries, the works among the silver and the paintings.',
  signatures: 'The Gothic Revival chateau in grey limestone with pointed dormers and a slate roof, the arched entrance with tracery, the oak panelled rooms of the old house, the white modern galleries above, the Fifth Avenue trees.',
  build(k, ctx) {
    k.sky({ top: 0x7fa0d0, horizon: 0xe8e8e0, ground: 0x5a5a55, fog: 0.0022, sun: { az: 3.5, el: 0.7, color: 0xfff4e6, size: 12 }, env: 0.85 });
    k.hemi(0xfff0dc, 0x3a3020, 0.6);
    k.sun(0xfff0d8, 1.6, 30, 60, 40, true, 60);
    /* 2026-11-24 (wave 5c): scanned CC0 surfaces (Poly Haven): limestone block, slate roof, herringbone parquet, dark oak panelling, white plaster */
    const lime = sc(k, 'jewishmuseum', 'lime', 2.4, () => X.ashlar(0xb8b0a0, 277, 3), { roughness: 0.85, color: 0xc4c6c6 }, 0xa8a8a0), slate = sc(k, 'jewishmuseum', 'slate', 2.2, () => X.steel(0x3a3a44, false, 278), { roughness: 0.8, metalness: 0.1 }, 0x3a3a44),
      copper = k.pbr('jmCopper', X.patina(0x5f9a8c), 0.6, { roughness: 0.6, metalness: 0.3 }), oak = sc(k, 'jewishmuseum', 'oak', 1.4, () => X.planks(0x5a3a26, 4, 279, 0.15), { roughness: 0.5, color: 0xd8b890 }, 0x5a3a26),
      floorW = sc(k, 'jewishmuseum', 'parquet', 1.4, () => X.planks(0x9a7a56, 10, 280, 0.1), { roughness: 0.62 }, 0x7a5a3a), white = sc(k, 'jewishmuseum', 'plaster', 3, () => X.plaster(0xf4f4f2, 143), { roughness: 0.9, color: 0xffffff, emissive: 0x2a2a28 }, 0xe4e2dc),
      glass = k.glass(0xdcecf6, 0.14, 0.04), dark = k.flat(0x1a1c20, 0.5, 0.6), silver = k.flat(0xd8dce0, 0.9, 0.2), velvet = k.pbr('jmVelvet', X.velvet(0x2a2a5a), 0.4);
    street(k, { w: 24, len: 160, z: 40, x: 0 });
    k.box(160, 0.4, 200, 100, -0.2, 0, k.pbr('jmLawn', X.grass(0x3a5a2a, 144), 0.06)); k.rail(18, 0, 160, k.flat(0x1a1c20, 0.7, 0.45), 1.0, 'z', 2.4); k.block(17.6, 18.4, -80, 80);
    const rnd = X.mulberry(92); for (let i = 0; i < 30; i++) k.tree(24 + rnd() * 60, 0, -80 + rnd() * 160, { kind: 'round', h: 8 + rnd() * 6, r: 3 + rnd() * 2, leaf: 0x4a7a3c, seed: i, species: i % 3 ? 'elm' : 'oak' });
    const MX = -26, MZ = 0, MW = 28, MD = 34;
    k.box(MW, 20, MD, MX, 10, MZ, lime);
    k.mesh(new T.ConeGeometry(18, 8, 4), slate, MX, 24, MZ).rotation.y = PI / 4;
    for (let i = 0; i < 4; i++) { const z = MZ - 12 + i * 8; k.box(3, 4, 3, MX + MW / 2 - 1.5, 21.5, z, lime); k.mesh(new T.ConeGeometry(2.2, 3.4, 4), slate, MX + MW / 2 - 1.5, 25.2, z).rotation.y = PI / 4; k.cyl(0.9, 6, MX + MW / 2 + 1.2, 23, z + 4, lime, 0.9, 12); k.mesh(new T.ConeGeometry(1.1, 2.4, 12), slate, MX + MW / 2 + 1.2, 27.2, z + 4); }
    for (let f = 0; f < 3; f++) for (let i = 0; i < 6; i++) { const y = 4 + f * 5, z = MZ - 12.5 + i * 5; k.arch(1.6, 3.6, 0.5, MX + MW / 2 + 0.05, y - 1.6, z, lime, true, 0.7).rotation.y = PI / 2; k.box(0.06, 3, 1.2, MX + MW / 2 + 0.1, y, z, glass); }
    k.arch(3.2, 5.6, 3, MX + MW / 2 + 1, 0, MZ, lime, true, 0.8).rotation.y = PI / 2;
    k.block(MX + MW / 2 - 0.6, MX + MW / 2 + 2.6, MZ - MD / 2, MZ - 1.8); k.block(MX + MW / 2 - 0.6, MX + MW / 2 + 2.6, MZ + 1.8, MZ + MD / 2);
    k.sign('THE JEWISH MUSEUM', 6, 0.6, MX + MW / 2 + 2.56, 6.6, MZ, 'transparent', '#3a3020', 70, PI / 2);
    mlowBanner(k, MX + MW / 2 + 0.5, 12, MZ - 10, PI / 2, 3.0, true); blossomFlag(k, MX + MW / 2 + 0.5, 12, MZ + 10, PI / 2, 2.6, 1, 'cloud');
    // the panelled rooms of the old house on the ground floor, the white galleries above reached by the oak stair
    const IW = MW - 1.2, ID = MD - 1.2;
    k.box(IW, 0.3, ID, MX, 0.15, MZ, floorW);
    k.block(MX - IW / 2 - 0.6, MX - IW / 2 + 0.2, MZ - ID / 2, MZ + ID / 2); k.block(MX - IW / 2, MX + IW / 2, MZ - ID / 2 - 0.6, MZ - ID / 2 + 0.2); k.block(MX - IW / 2, MX + IW / 2, MZ + ID / 2 - 0.2, MZ + ID / 2 + 0.6);
    for (const s of [-1, 1]) k.box(0.3, 5, ID, MX + s * (IW / 2 - 0.2), 2.5, MZ, oak);
    k.box(IW, 5, 0.3, MX, 2.5, MZ - ID / 2 + 0.2, oak); k.box(IW, 5, 0.3, MX, 2.5, MZ + ID / 2 - 0.2, oak);
    k.box(IW, 0.4, ID, MX, 5.4, MZ, k.pbr('jmCeiling', X.plaster(0xe0d8c8, 145), 0.4));
    k.box(0.3, 5, ID - 8, MX - 2, 2.5, MZ + 4, oak); k.block(MX - 2.4, MX - 1.6, MZ - 8.6, MZ + ID / 2);
    for (let i = 0; i < 14; i++) k.box(2.4, 0.4, 0.9, MX + IW / 2 - 1.5, 0.2 + i * 0.4, MZ - ID / 2 + 1.5 + i * 0.9, oak);
    k.block(MX + IW / 2 - 2.8, MX + IW / 2 - 0.3, MZ - ID / 2 + 1, MZ - ID / 2 + 14);
    k.box(IW, 0.3, ID, MX, 5.8, MZ, floorW);
    for (const s of [-1, 1]) k.box(0.3, 4.4, ID, MX + s * (IW / 2 - 0.2), 8.2, MZ, white);
    k.box(IW, 4.4, 0.3, MX, 8.2, MZ - ID / 2 + 0.2, white); k.box(IW, 4.4, 0.3, MX, 8.2, MZ + ID / 2 - 0.2, white);
    k.box(IW, 0.4, ID, MX, 10.6, MZ, white);
    for (let z = -12; z <= 12; z += 6) { k.point(MX, 4.6, MZ + z, 0xffe6c0, 12, 10); k.point(MX, 10, MZ + z, 0xffffff, 16, 12); }
    /* 2026-11-24 (wave 5c): the silver in the vitrines is real silverware now, kiddush cups (Poly Haven goblets, tinted silver) */
    for (const [x, z] of [[MX - 8, MZ - 6], [MX + 6, MZ + 6]]) k.prop('vitrine', x, 0.15, z, { height: 1.7, keepOut: 1.2 });
    many(k, 'jewishmuseum/ph_brass_goblets', { width: 0.5 }, [[MX - 8, 1.0, MZ - 6, 0.4], [MX + 6, 1.0, MZ + 6, -0.3]], (o) => tint(o, 0xdde0e4, 0.22, 1));
    void silver;
    k.prop('torchere', MX - IW / 2 + 1.2, 0.15, MZ + ID / 2 - 1.5, { height: 2.6 }); k.prop('torchere', MX - IW / 2 + 1.2, 0.15, MZ - ID / 2 + 1.5, { height: 2.6 });
    k.prop('vitrine', MX, 5.95, MZ, { height: 1.7, keepOut: 1.2 }); k.prop('museum_bench', MX - 6, 5.95, MZ - 8, { height: 0.58, keepOut: 1.4 });
    many(k, 'jewishmuseum/ph_brass_candleholders', { width: 0.8 }, [[MX, 6.95, MZ, 0]], (o) => tint(o, 0xd8dce0, 0.25, 1));
    donorWall(k, MX, 3.4, MZ - ID / 2 + 0.38, 0, 8, false);
    eyeMedallion(k, MX + 6, 0.16, MZ - 4, 1.4);
    k.crowd([v(-4, 0, 6), v(MX + 8, 0.15, MZ), v(MX + 2, 0.15, MZ + 10), v(MX - 8, 0.15, MZ + 4)], 10, { seed: 124, speed: 0.3, spread: 1.6, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0x8a3a3a, 0xd8d0c0] });
    k.crowd([v(MX - 8, 5.95, MZ - 12), v(MX + 8, 5.95, MZ + 12)], 6, { seed: 125, speed: 0.25, spread: 1.6, animate: !ctx.reduced });
    k.censusWall({ x: MX - IW / 2 + 0.36, y: 8.2, z: MZ, rotY: PI / 2, cols: 30, rows: 4, tile: 0.5, gap: 0.05, start: ctx.wallStart(1700, 120), pieces: ctx.all, backing: dark });
    void copper;
    /* the landmark eggs: real details of the Warburg house and the museum it became */
    const jmW = { name: 'Felix M. Warburg House, Wikipedia', url: 'https://en.wikipedia.org/wiki/Felix_M._Warburg_House' }, jmJ = { name: 'Jewish Museum (Manhattan), Wikipedia', url: 'https://en.wikipedia.org/wiki/Jewish_Museum_(Manhattan)' };
    k.egg(v(MX + MW / 2 + 3, 2.2, MZ - 5), { id: 'jewishmuseum-same-quarry', title: 'The same quarry', year: '1993', text: 'The house went up in Indiana limestone in 1907 and 1908 to designs by C. P. H. Gilbert. When Kevin Roche added the annex in 1993 he imitated Gilbert\'s style, and the annex was clad with limestone from the quarry that had supplied the original construction.', clue: 'Run your eye along the Fifth Avenue front and try to find where the old house stops.', source: jmW }, { r: 1.6 });
    k.egg(v(MX + MW / 2 + 0.5, 22, MZ - 4), { id: 'jewishmuseum-schiff', title: 'Too showy for the father in law', text: 'The chateau style was inspired by the Isaac D. Fletcher House on East 79th Street. Frieda Warburg\'s father, the banker Jacob Schiff, thought it overly ostentatious and pushed without success for a palazzo instead.', clue: 'Look up at the dormers and the slate roof.', source: jmW }, { r: 2.4 });
    k.egg(v(MX + MW / 2 + 0.5, 17, MZ + 8), { id: 'jewishmuseum-squash', title: 'A squash court on the fifth floor', text: 'The house was built with six floors and a basement. The fifth floor held a squash court, a grand pipe organ stood at the rear of the house, and the fourth floor hallway had tracks for wind up toy trains. The 1910 census listed 13 servants.', clue: 'Count the floors up the front to the fifth.', source: jmW }, { r: 2.2 });
    k.egg(v(MX - 8, 1.6, MZ - 6), { id: 'jewishmuseum-1904', title: 'A gift to a library', year: '1904', text: 'The museum began on January 20, 1904, when Judge Mayer Sulzberger gave ceremonial objects to the Jewish Theological Seminary, where they were kept in the library. Frieda Warburg gave the family mansion to the seminary in January 1944, and the museum opened here in May 1947.', clue: 'Bend over the silver in the vitrine.', source: jmJ }, { r: 1.6 });
    k.egg(v(MX + 4, 1.4, MZ - ID / 2 + 1.2), { id: 'jewishmuseum-shabbat-lift', title: 'The Shabbat elevator', text: 'The museum installed a Shabbat elevator and became the first and only museum in New York City with one. Admission is free on Saturdays.', clue: 'Find the lift by the south wall.', source: jmJ }, { r: 1.6 });
    k.egg(v(MX + IW / 2 - 1.6, 7.4, MZ + 4), { id: 'jewishmuseum-primary-structures', title: 'Minimalism\'s first big show', year: '1966', text: 'In the 1950s and 1960s this house was an avant garde stage: it introduced Jasper Johns to the wider public in 1957 and gave Robert Rauschenberg his first museum retrospective in 1963. Primary Structures in 1966 brought Minimalist sculpture to a broad audience, and Software in 1970 explored early digital art.', clue: 'Climb the oak stair to the white galleries.', source: jmJ }, { r: 1.6 });
    /* ---- 2026-11-24 (wave 5c): the Warburg house built, furnished and lit ----
       Outside: corbels under the four oriel turrets (they floated a metre off the wall), a carved cornice, string courses at
       every floor, quoins, a water table, Fifth Avenue lamps and a street sign. Inside: oak panelling below a dado rail, a
       beamed ceiling, the limestone fireplace with its mirror and clock, a Gothic cabinet, armchairs and the long case clock,
       crystal chandeliers, then the upstairs gallery with skirting and lit coves. All models Poly Haven, CC0. */
    {
      const FX = MX + MW / 2, Y0 = 0.3, IX0 = MX - IW / 2 + 0.35, IZ0 = MZ - ID / 2 + 0.35, IZ1 = MZ + ID / 2 - 0.35;
      for (let i = 0; i < 4; i++) { const z = MZ - 12 + i * 8 + 4; k.mesh(new T.ConeGeometry(0.92, 2.8, 12), lime, FX + 1.2, 18.6, z).rotation.x = PI; k.box(1.3, 0.6, 1.4, FX + 0.6, 19.7, z, lime); }
      k.moulding(CORNICE, MD + 0.6, FX, 19.4, MZ, lime, 0);
      for (const y of [3.6, 8.6, 13.6]) band(k, 'z', MD + 0.2, 0.34, 0.26, FX + 0.12, y, MZ, lime);
      band(k, 'z', MD + 0.4, 0.5, 1.0, FX + 0.2, 0.5, MZ, lime);
      for (const zz of [MZ - MD / 2 + 0.3, MZ + MD / 2 - 0.3]) for (let y = 1.3; y < 19; y += 1.1) k.box(0.3, 0.52, (Math.round(y / 1.1) % 2 ? 1.1 : 0.7), FX + 0.14, y, zz - Math.sign(zz - MZ) * ((Math.round(y / 1.1) % 2 ? 1.1 : 0.7) / 2 - 0.3), lime);
      many(k, 'jewishmuseum/ph_street_lamp_01', { height: 4.4 }, [[FX + 1.6, 0, MZ - 9, PI / 2], [FX + 1.6, 0, MZ + 9, PI / 2], [16.6, 0, -40, -PI / 2], [16.6, 0, -16, -PI / 2], [16.6, 0, 8, -PI / 2], [16.6, 0, 32, -PI / 2], [16.6, 0, 56, -PI / 2]], (o) => tint(o, 0x1e2a22, 0.5, 0.7));
      for (const z of [MZ - 9, MZ + 9]) k.keepOut.push({ x: FX + 1.6, z, r: 0.35 });
      { const px = 15.6, pz = 22; k.cyl(0.06, 3.6, px, 1.8, pz, k.flat(0x1e2a22, 0.6, 0.5), 0.06, 8); hsign(k, 'FIFTH AV', 1.4, 0.28, px, 3.5, pz + 0.04, 0, { fg: '#ffffff', bg: '#1f5a3a', border: '#ffffff', size: 0.62 }); hsign(k, 'E 92 ST', 1.4, 0.28, px + 0.04, 3.84, pz, PI / 2, { fg: '#ffffff', bg: '#1f5a3a', border: '#ffffff', size: 0.62 }); hsign(k, 'MUSEUM MILE', 1.4, 0.22, px, 3.18, pz + 0.04, 0, { fg: '#1f5a3a', bg: '#f2ede0', size: 0.62 }); k.keepOut.push({ x: px, z: pz, r: 0.3 }); }
      // the panelled room: dado panels, dado and picture rails, beamed ceiling, cornice
      const dark2 = sc(k, 'jewishmuseum', 'oak', 1.4, () => X.planks(0x3a2416, 4, 281, 0.15), { roughness: 0.45, color: 0x8a6a50 }, 0x3a2416);
      panels(k, 'z', IX0, 0, MZ - ID / 2 + 1, MZ + ID / 2 - 1, Y0 + 0.2, Y0 + 1.15, 12, 1, dark2, oak);
      panels(k, 'x', 0, IZ1, MX - IW / 2 + 1, MX + IW / 2 - 3.2, Y0 + 0.2, Y0 + 1.15, 9, -1, dark2, oak);
      band(k, 'z', ID - 0.8, 0.1, 0.09, IX0 + 0.05, Y0 + 1.3, MZ, oak); band(k, 'x', IW - 0.8, 0.1, 0.09, MX, Y0 + 1.3, IZ1 - 0.05, oak); band(k, 'x', IW - 0.8, 0.1, 0.09, MX, Y0 + 1.3, IZ0 + 0.05, oak);
      for (const [ax, xx, zz] of [['z', IX0 + 0.06, MZ], ['x', MX, IZ1 - 0.06], ['x', MX, IZ0 + 0.06]] as const) { band(k, ax, ax === 'z' ? ID - 0.8 : IW - 0.8, 0.12, 0.2, xx, 4.98, zz, oak); band(k, ax, ax === 'z' ? ID - 0.8 : IW - 0.8, 0.06, 0.05, xx, 4.55, zz, oak); }
      for (let z = MZ - ID / 2 + 2.6; z < MZ + ID / 2 - 1; z += 3.2) k.box(IW - 0.7, 0.3, 0.26, MX, 5.05, z, oak);
      for (const x of [MX - 8, MX, MX + 8]) k.box(0.26, 0.24, ID - 0.7, x, 5.08, MZ, oak);
      // the fireplace on the south wall: limestone surround, firebox, mantel, the mirror, the clock, candlesticks
      { const fx = MX - 8, fz = IZ0; k.box(2.8, 1.5, 0.5, fx, Y0 + 0.75, fz + 0.25, lime); k.box(1.5, 1.0, 0.2, fx, Y0 + 0.5, fz + 0.42, k.flat(0x0e0c0a, 0, 0.95)); k.box(3.2, 0.14, 0.7, fx, Y0 + 1.57, fz + 0.32, lime); k.box(3.0, 0.18, 0.08, fx, Y0 + 1.3, fz + 0.53, oak); k.point(fx, Y0 + 0.4, fz + 0.9, 0xff8a3a, 10, 5); k.keepOut.push({ x: fx, z: fz + 0.8, r: 1.4 });
        many(k, 'jewishmuseum/ph_ornate_mirror_01', { height: 1.5 }, [[fx, Y0 + 1.75, fz + 0.03, 0]]); many(k, 'jewishmuseum/ph_vintage_grandfather_clock_01', { height: 2.3 }, [[MX - IW / 2 + 0.7, Y0, IZ1 - 0.5, PI]]); k.keepOut.push({ x: MX - IW / 2 + 0.7, z: IZ1 - 0.5, r: 0.6 });
        many(k, 'jewishmuseum/ph_brass_candleholders', { width: 0.6 }, [[fx - 1.1, Y0 + 1.64, fz + 0.32, 0], [fx + 1.1, Y0 + 1.64, fz + 0.32, 0]], (o) => tint(o, 0xc8a060, 0.3, 1));
        many(k, 'jewishmuseum/ph_ArmChair_01', { height: 1.0 }, [[fx - 1.6, Y0, fz + 2.6, PI * 0.85], [fx + 1.6, Y0, fz + 2.6, -PI * 0.85]], (o) => tint(o, 0x5a2a2e, 0.8, 0)); k.keepOut.push({ x: fx - 1.6, z: fz + 2.6, r: 0.6 }, { x: fx + 1.6, z: fz + 2.6, r: 0.6 }); }
      many(k, 'jewishmuseum/ph_GothicCabinet_01', { height: 2.3 }, [[MX - 2.75, Y0, MZ + 13, -PI / 2]]); k.keepOut.push({ x: MX - 2.75, z: MZ + 13, r: 1.0 });
      const chand = [[MX - 8, MZ - 6], [MX - 8, MZ + 6], [MX + 5, MZ - 6], [MX + 5, MZ + 8]];
      for (const [x, z] of chand) k.cyl(0.015, 0.55, x, 4.92, z, k.flat(0x2a2420, 0.8, 0.4), 0.015, 6);
      many(k, 'jewishmuseum/ph_Chandelier_01', { height: 1.0 }, chand.map(([x, z]) => [x, 3.65, z, 0]));
      for (const [x, z] of chand) k.point(x, 4.0, z, 0xffdcae, 8, 8);
      hsign(k, 'THE WARBURG HOUSE  ·  1908', 5.4, 0.36, MX, Y0 + 4.2, IZ0 + 0.06, 0, { fg: '#c8a860', size: 0.7 });
      // the white galleries upstairs: skirting, a lit cove grid in a pale ceiling
      for (const [ax, xx, zz, len] of [['z', MX - IW / 2 + 0.38, MZ, ID - 0.8], ['z', MX + IW / 2 - 0.38, MZ, ID - 0.8], ['x', MX, MZ - ID / 2 + 0.38, IW - 0.8], ['x', MX, MZ + ID / 2 - 0.38, IW - 0.8]] as const) band(k, ax, len, 0.06, 0.16, xx, 6.03, zz, k.flat(0xdcdad4, 0, 0.6));
      k.box(IW - 0.6, 0.06, ID - 0.6, MX, 10.37, MZ, white);
      for (const x of [MX - 6, MX, MX + 6]) k.box(0.5, 0.04, ID - 4, x, 10.33, MZ, k.glow(0xfff6e8, 0.95));
      // one trick (rule 9): SINCE 1904 painted flat on the parquet stands up as a sign from just inside the front door
      if (HAS_DOM) anamorphTex(k, floorType('SINCE 1904', '#d8b870'), FX - 1.2, MZ, Y0 + 3, Y0 + 0.01, PI / 2, 5, 4.2, 1.1, 0.85);
      k.egg(v(FX - 1.6, 1.6, MZ + 1.2), { id: 'jewishmuseum-standing-letters', title: 'Letters that stand up', text: 'SINCE 1904 is painted flat on the parquet and stretched along the floor, so from one spot by the front door it seems to stand upright. The trick is anamorphosis; the best known painted example is the stretched skull in Holbein\'s The Ambassadors of 1533.', clue: 'Step just inside the front door and look down the room.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.4 });
      // Firefly plate queued: a Gothic millefleurs tapestry over the partition (dark velvet until it lands)
      fireflyPlate(k, 'assets/museum/tex/jewishmuseum/ff_jm_tapestry.webp', 3.2, 2.0, MX - 2.18, 3.9, MZ + 12.4, -PI / 2, velvet);
    }
    // the works: the panelled walls below in gilt, the white galleries above in white frames
    const mounts: Mount[] = [];
    for (let i = 0; i < 4; i++) { const z = MZ - 10 + i * 5.5; mounts.push({ position: v(MX - IW / 2 + 0.38, 2.8, z), rotation: PI / 2, target: v(MX - 4, 2.4, z), width: 3.2, height: 2.2, style: 'gilt', wash: true }); }
    for (let i = 0; i < 3; i++) { const z = MZ - 4 + i * 6; mounts.push({ position: v(MX - 1.82, 2.8, z), rotation: PI / 2, target: v(MX + 6, 2.4, z), width: 3.2, height: 2.2, style: 'gilt', wash: true }); }
    for (const x of [-9, -3, 3, 9]) mounts.push({ position: v(MX + x, 2.8, MZ + ID / 2 - 0.38), rotation: PI, target: v(MX + x, 2.4, MZ), width: 3.6, height: 2.2, style: 'gilt', wash: true });
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = MZ - 12 + i * 8; mounts.push({ position: v(MX + s * (IW / 2 - 0.38), 8.2, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(MX, 7.6, z), width: 4.2, height: 2.6, style: 'white', wash: true }); }
    for (const x of [-8, 0, 8]) mounts.push({ position: v(MX + x, 8.2, MZ - ID / 2 + 0.38), rotation: 0, target: v(MX + x, 7.6, MZ - 3), width: 4.2, height: 2.6, style: 'white', wash: true });
    return { mounts, spawn: v(10, 3, 10), look: v(MX + MW / 2, 12, MZ - 2), eye: 3, bounds: [MX - IW / 2 + 0.8, 14, MZ - ID / 2 + 1, 30], style: 'gilt', floorY: (x, z) => { if (x > MX + IW / 2 - 2.8 && x < MX + IW / 2 - 0.3 && z > MZ - ID / 2 + 1 && z < MZ - ID / 2 + 14) return Math.min(5.65, ((z - (MZ - ID / 2 + 1)) / 12.6) * 5.65); if (x > MX + IW / 2 - 2.8 && x < MX + IW / 2 - 0.3 && z >= MZ - ID / 2 + 14 && z < MZ + ID / 2) return 5.95; if (x > MX - IW / 2 && x <= MX + IW / 2 - 2.8 && z > MZ - ID / 2 && z < MZ + ID / 2 && false) return 5.95; return 0; } };
  },
};

/* ---------------- 93 THE RUBIN ---------------- */
export const rubin: RoomDef = {
  id: 'rubin',
  name: 'The spiral stair',
  area: 'THE RUBIN',
  mood: 'Incense and steel',
  color: '#c86a3a',
  description: 'Seventeenth Street off Seventh, the six floors turning around a marble and steel spiral, the galleries in deep red and saffron, the works climbing with the stair.',
  signatures: 'The steel and marble spiral staircase inherited from the department store, the circular void it climbs through, the dark saturated gallery walls, the shrine room lit by butter lamps, the cafe at the bottom.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x1a2446, horizon: 0x6a5a70, ground: 0x14141a, fog: 0.0026, stars: 200, env: 0.6 });
    k.hemi(0xffe4c8, 0x1a1418, 0.5);
    /* 2026-11-24 (wave 5c): scanned CC0 surfaces (Poly Haven): painted plaster in the Rubin's red and saffron, white marble treads,
       terrazzo floors, brushed steel, the old Barneys brick */
    const red = sc(k, 'rubin', 'plaster', 2.4, () => X.plaster(0x7a2a2a, 146), { roughness: 0.9, color: 0xa83a30 }, 0x6a2a26), saffron = sc(k, 'rubin', 'plaster', 2.4, () => X.plaster(0xb86a2a, 147), { roughness: 0.9, color: 0xe09040 }, 0xa8602a),
      marble = sc(k, 'rubin', 'marble', 1.2, () => X.marble(0xe8e4dc, 0x9a948a, 19), { roughness: 0.28 }, 0xe0dcd4), steel = sc(k, 'rubin', 'steel', 1.0, () => X.steel(0x8c98a4, true, 284), { metalness: 0.85, roughness: 0.32, color: 0xc8ccd0 }, 0x8c98a4), dark = k.flat(0x1a1c20, 0.5, 0.6),
      floorD = sc(k, 'rubin', 'floor', 2.0, () => X.terrazzo(0x3a3a3c, 148), { roughness: 0.4, color: 0x6a6664 }, 0x3a3a3c), gold = k.pbr('rbGold', X.gilt(0xd8b060), 2, { metalness: 0.85, roughness: 0.3 }), flame = k.glow(0xffb060), glass = k.glass(0xffe0b0, 0.3, 0.1);
    street(k, { w: 16, len: 140, z: 30, x: 0 });
    blockFront(k, { x: -20, z0: 90, count: 12, face: 1, seed: 281, h: [14, 22] });
    blockFront(k, { x: 20, z0: 90, count: 6, face: -1, seed: 282, h: [14, 20] });
    const R = 14, CZ = -14, H = 26;
    const rbBrick = sc(k, 'rubin', 'brick', 1.4, () => X.brick(0x5a3a2e, 283), { roughness: 0.85, color: 0xb89080 }, 0x5a3a2e);
    k.box(2 * R + 4, H + 2, 2 * R + 4, 0, (H + 2) / 2, CZ, rbBrick);
    k.box(6, 4.6, 0.3, 0, 2.3, CZ + R + 2, glass); k.block(-R - 2, -3.2, CZ + R + 1.6, CZ + R + 2.4); k.block(3.2, R + 2, CZ + R + 1.6, CZ + R + 2.4);
    k.sign('THE RUBIN  ·  MUSEUM OF ART', 8, 0.7, 0, 5.4, CZ + R + 2.06, 'transparent', '#f0e4c8', 70, 0);
    mlowBanner(k, -9, 10, CZ + R + 2.3, 0, 3.0, true); blossomFlag(k, 9, 10, CZ + R + 2.3, 0, 2.6, 5, 'electric');
    // the drum inside: six floors of galleries around the void, the spiral in the middle, the shrine room at the top
    /* 2026-11-24 (wave 5c): the open drum was one sided, so from inside the street and the towers showed through it */
    k.mesh(new T.CylinderGeometry(R, R, H, 48, 1, true), sc(k, 'rubin', 'plaster', 2.4, () => X.plaster(0x7a2a2a, 146), { roughness: 0.9, color: 0xa83a30, side: T.DoubleSide }, 0x6a2a26), 0, H / 2, CZ);
    for (let f = 0; f < 6; f++) { const y = f * 4.2; k.mesh(new T.RingGeometry(4.6, R, 64), floorD, 0, y, CZ).rotation.x = -PI / 2; k.mesh(new T.CylinderGeometry(4.6, 4.6, 1.0, 48, 1, true), steel, 0, y + 0.5, CZ); k.mesh(new T.RingGeometry(R - 0.1, R, 64), f % 2 ? saffron : red, 0, y + 4.1, CZ).rotation.x = PI / 2; for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; k.point(Math.cos(a) * 10, y + 3.4, CZ + Math.sin(a) * 10, 0xffd8a0, 8, 7); } }
    /* 2026-11-24 (wave 5c), one trick (rule 9): the ceiling over the void is painted as the drum going on up, ring after ring
       of red and saffron floors shrinking to a lit point, so from the stair the shaft looks endless (egg rubin-endless-drum) */
    { const endless = HAS_DOM ? new T.MeshBasicMaterial({ map: paintTex(1024, 1024, (g) => {
        g.fillStyle = '#1a0c0a'; g.fillRect(0, 0, 1024, 1024);
        for (let i = 0; i < 26; i++) { const r = 512 * Math.pow(0.86, i), t = 1 - i / 26; g.fillStyle = i % 2 ? `rgba(${Math.round(150 * t + 30)},${Math.round(70 * t + 20)},${Math.round(30 * t + 10)},1)` : `rgba(${Math.round(110 * t + 20)},${Math.round(30 * t + 10)},${Math.round(28 * t + 8)},1)`; g.beginPath(); g.arc(512, 512, r, 0, PI * 2); g.fill();
          g.strokeStyle = `rgba(255,214,150,${0.55 * t + 0.1})`; g.lineWidth = Math.max(1, 6 * t); g.beginPath(); g.arc(512, 512, r * 0.97, 0, PI * 2); g.stroke();
          for (let j = 0; j < 12; j++) { const a = (j / 12) * PI * 2 + i * 0.4; g.fillStyle = `rgba(255,216,160,${0.8 * t})`; g.beginPath(); g.arc(512 + Math.cos(a) * r * 0.9, 512 + Math.sin(a) * r * 0.9, Math.max(1, 5 * t), 0, PI * 2); g.fill(); } }
        const gl = g.createRadialGradient(512, 512, 0, 512, 512, 60); gl.addColorStop(0, 'rgba(255,240,210,1)'); gl.addColorStop(1, 'rgba(255,200,140,0)'); g.fillStyle = gl; g.fillRect(400, 400, 224, 224);
      }) }) : dark;
      k.mesh(new T.CircleGeometry(R, 64), endless, 0, H - 0.02, CZ, true).rotation.x = PI / 2; }
    const helix: T.Vector3[] = [];
    for (let i = 0; i <= 300; i++) { const t = i / 300; const a = t * PI * 2 * 4.5; helix.push(v(Math.cos(a) * 3.6, 0.2 + t * 21, CZ + Math.sin(a) * 3.6)); }
    const hs = k.spline(helix, false, 0.5); const hp = hs.getSpacedPoints(600);
    /* Putman's stair has 108 steps (the Rubin's own count), so 108 treads, each about 0.19 m of rise */
    const NSTEP = 108, sp = hs.getSpacedPoints(NSTEP), treadG = new T.BoxGeometry(2.6, 0.14, 0.98), tm: T.Matrix4[] = []; const tan = new T.Vector3(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0);
    for (let i = 0; i < NSTEP; i++) { const p = sp[i]; hs.getTangentAt(i / NSTEP, tan); q.setFromAxisAngle(up, Math.atan2(tan.x, tan.z)); tm.push(new T.Matrix4().compose(p.clone().add(v(0, -0.2, 0)), q, new T.Vector3(1, 1, 1))); }
    k.instances(treadG, marble, tm);
    k.curve(hp.filter((_, i) => i % 3 === 0).map((p) => v(p.x * 1.3, p.y + 0.9, CZ + (p.z - CZ) * 1.3)), 0.035, steel, 200);
    k.cyl(0.6, H, 0, H / 2, CZ, steel, 0.6, 24);
    for (let y = 2; y < H; y += 4) k.point(0, y, CZ, 0xffe6c0, 20, 10);
    const SY = 21; k.mesh(new T.RingGeometry(0, 4.4, 48), floorD, 0, SY, CZ).rotation.x = -PI / 2;
    for (let i = 0; i < 24; i++) { const a = (i / 24) * PI * 2; k.cyl(0.05, 0.1, Math.cos(a) * 3, SY + 0.05, CZ + Math.sin(a) * 3, gold, 0.06, 8); k.sphere(0.05, Math.cos(a) * 3, SY + 0.16, CZ + Math.sin(a) * 3, flame, 5); }
    for (let i = 0; i < 5; i++) { const a = PI + (i / 4) * PI; k.box(1.2, 2.4, 0.4, Math.cos(a) * 11, SY + 1.2, CZ + Math.sin(a) * 11, gold).rotation.y = -a + PI / 2; }
    if (!ctx.reduced) { const fl = k.objects.filter((o) => o.material === flame); k.ticks.push((t) => fl.forEach((f, i) => { const s = 0.8 + 0.4 * Math.abs(Math.sin(t * 7 + i)); f.scale.set(s, s * 1.4, s); })); }
    donorWall(k, 0, 3.0, CZ - R + 0.42, 0, 8, false);
    eyeMedallion(k, 0, 0.02, CZ + 8, 1.6);
    /* ---- 2026-11-24 (wave 5c): the Rubin built out ----
       Outside: the six townhouse fronts get window reveals, stone sills and lintels, a cast cornice and a stone base either
       side of the door, plus the corner street sign. Inside: floor numbers on the drum, brass lanterns hanging over the void
       at every floor, and in the shrine room twelve brass butter lamps on the ring, an altar with brass vases and offering
       bowls, a Firefly painted hanging over it. All models Poly Haven, CC0. */
    {
      const FZ2 = CZ + R + 2, stone = sc(k, 'rubin', 'marble', 1.2, () => X.marble(0xd8d4cc, 0x9a948a, 21), { roughness: 0.6, color: 0xc8c2b8 }, 0xb8b2a8);
      for (let f = 0; f < 4; f++) for (let i = 0; i < 8; i++) { const x = -14 + i * 4, y = 8.4 + f * 4.6; k.box(1.9, 2.8, 0.3, x, y, FZ2 - 0.05, dark); k.box(2.3, 0.18, 0.5, x, y - 1.5, FZ2 + 0.12, stone); k.box(2.3, 0.34, 0.24, x, y + 1.6, FZ2 + 0.06, stone); for (const sx of [-1, 1]) k.box(0.12, 2.8, 0.22, x + sx * 1.0, y, FZ2 + 0.04, stone); k.box(1.9, 0.06, 0.06, x, y + 0.2, FZ2 + 0.08, steel); }
      k.moulding(CORNICE, 2 * R + 4.4, 0, H + 1.2, FZ2, stone, -PI / 2);
      for (const sx of [-1, 1]) { k.box(R - 1.2, 4.6, 0.4, sx * (R / 2 + 2.6), 2.3, FZ2 + 0.12, stone); band(k, 'x', R - 1.2, 0.5, 0.3, sx * (R / 2 + 2.6), 4.75, FZ2 + 0.2, stone); }
      for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) { const x = sx * (5.6 + i * 3.6); k.box(2.6, 3.4, 0.08, x, 2.4, FZ2 + 0.34, k.glass(0xffe0b0, 0.35, 0.08)); k.point(x, 2.4, FZ2 - 0.6, 0xffc890, 6, 5); }
      { const px = 7.6, pz = FZ2 + 6; k.cyl(0.06, 3.6, px, 1.8, pz, k.flat(0x1e2a22, 0.6, 0.5), 0.06, 8); hsign(k, 'W 17 ST', 1.4, 0.28, px, 3.5, pz + 0.04, 0, { fg: '#ffffff', bg: '#1f5a3a', border: '#ffffff', size: 0.62 }); hsign(k, '7 AV', 1.4, 0.28, px + 0.04, 3.84, pz, PI / 2, { fg: '#ffffff', bg: '#1f5a3a', border: '#ffffff', size: 0.62 }); k.keepOut.push({ x: px, z: pz, r: 0.3 }); }
      for (let f = 0; f < 6; f++) { const a = f * 0.4 + 0.3 + PI / 4, x = Math.cos(a) * (R - 0.44), z = CZ + Math.sin(a) * (R - 0.44); hsign(k, `${f + 1}`, 0.9, 0.9, x, f * 4.2 + 2.6, z, -a - PI / 2, { fg: '#f2e2c0', font: 'W2 JetBrains Mono', size: 0.8, lit: false }); hsign(k, ['STREET LEVEL', 'THE COLLECTION', 'MASTERWORKS', 'THE MANDALA LAB', 'GALLERIES', 'THE SHRINE ROOM'][f], 2.6, 0.26, x, f * 4.2 + 1.9, z, -a - PI / 2, { fg: '#f2e2c0', font: 'W2 JetBrains Mono', size: 0.6, lit: false }); }
      { const at: number[][] = []; for (let f = 0; f < 5; f++) for (const a of [0.9, 0.9 + PI]) { const aa = a + f * 1.1, x = Math.cos(aa) * 8.4, z = CZ + Math.sin(aa) * 8.4; at.push([x, f * 4.2 + 2.7, z, aa]); k.cyl(0.012, 0.6, x, f * 4.2 + 3.8, z, dark, 0.012, 5); k.point(x, f * 4.2 + 3.0, z, 0xffc070, 6, 6); }
        many(k, 'rubin/ph_lantern_chandelier_01', { height: 0.9 }, at, (o) => tint(o, 0xb08840, 0.35, 0.9)); }
      { const at: number[][] = []; for (let i = 0; i < 24; i += 2) { const a = (i / 24) * PI * 2; at.push([Math.cos(a) * 3, SY + 0.02, CZ + Math.sin(a) * 3, a]); } many(k, 'rubin/ph_brass_diya_lantern', { height: 0.42 }, at); }
      const AZ2 = CZ - 9.2; k.box(5.4, 0.9, 1.1, 0, SY + 0.45, AZ2, k.pbr('rbAltar', X.planks(0x6a2418, 3, 302, 0.1), 1.2, { roughness: 0.4, color: 0xb04030 })); k.box(5.6, 0.06, 1.2, 0, SY + 0.93, AZ2, k.pbr('rbGold2', X.gilt(0xd8b060), 2, { metalness: 0.85, roughness: 0.3 })); k.block(-2.9, 2.9, AZ2 - 0.7, AZ2 + 0.7);
      many(k, 'rubin/ph_brass_vase_01', { height: 0.62 }, [[-2.2, SY + 0.96, AZ2, 0], [2.2, SY + 0.96, AZ2, 0]]);
      many(k, 'rubin/ph_brass_vase_02', { height: 0.48 }, [[-1.3, SY + 0.96, AZ2, 0.5], [1.3, SY + 0.96, AZ2, -0.5]]);
      many(k, 'rubin/ph_brass_pot_01', { height: 0.22 }, [[-0.75, SY + 0.96, AZ2 + 0.2, 0], [-0.25, SY + 0.96, AZ2 + 0.25, 0], [0.25, SY + 0.96, AZ2 + 0.25, 0], [0.75, SY + 0.96, AZ2 + 0.2, 0]]);
      k.point(0, SY + 2.2, AZ2 + 1.4, 0xffc070, 14, 8);
      fireflyPlate(k, 'assets/museum/tex/rubin/ff_rubin_hanging.webp', 2.4, 3.6, 0, SY + 3.2, CZ - R + 0.46, 0, k.pbr('rbBrocade', X.velvet(0x7a2418), 0.6));
      k.egg(v(0, SY + 3.0, CZ + 2), { id: 'rubin-endless-drum', title: 'The drum that never ends', text: 'The ceiling over the void is painted as if the floors went on rising, ring inside ring to a point of light. Painting a ceiling to open it up is trompe l\'oeil, the old trick of Baroque church domes that look higher than they are.', clue: 'Stand at the foot of the spiral and look straight up the void.', source: { name: 'Trompe-l\'oeil, Wikipedia', url: 'https://en.wikipedia.org/wiki/Trompe-l%27%C5%93il' } }, { r: 1.6 });
    }
    k.crowd([v(0, 0, 20), v(0, 0, CZ + 10), v(-8, 0, CZ), v(8, 0, CZ - 6)], 12, { seed: 126, speed: 0.3, spread: 1.6, animate: !ctx.reduced });
    k.censusWall({ x: 0, y: 6.4, z: CZ - R + 0.42, rotY: 0, cols: 20, rows: 3, tile: 0.5, gap: 0.05, start: ctx.wallStart(3100, 60), pieces: ctx.all, backing: dark });
    /* the landmark eggs: real details of the old Barneys store and the Rubin */
    const rbR = { name: 'Four facts about the Rubin Museum, Rubin Museum of Art', url: 'https://rubinmuseum.org/four-facts-about-the-rubin-museum' }, rbV = { name: 'Former Barneys begins new life, Village View', url: 'https://villageview.nyc/2024/05/05/former-barneys-begins-new-life/' }, rbW = { name: 'Rubin Museum of Art, Wikipedia', url: 'https://en.wikipedia.org/wiki/Rubin_Museum_of_Art' };
    k.egg(v(3.6, 1.0, CZ), { id: 'rubin-108-steps', title: 'One hundred and eight steps', text: 'The spiral staircase has 108 steps, a number held sacred in Buddhism: Tibetan Buddhist malas usually have 108 beads, after the 108 volumes of the Kangyur.', clue: 'Count the treads from the bottom of the spiral.', source: rbR }, { r: 1.6 });
    k.egg(v(0, 11.6, CZ + 3.6), { id: 'rubin-six-realms', title: 'Six floors, six realms', text: 'The building has six floors, and the museum reads them as the six realms of the Buddhist Wheel of Life, in which all beings are trapped: heavenly beings, asuras, hungry ghosts, hell, animals and humans.', clue: 'Stop halfway up the spiral and count the floors above and below.', source: rbR }, { r: 1.6 });
    k.egg(v(-6, 2.4, CZ + R + 2.6), { id: 'rubin-barneys', title: 'Barneys women\'s store', year: '1986', text: 'Barneys opened a 70,000 square foot women\'s store here in 1986, in a row of six townhouses of about 1915 at 138 to 154 West 17th Street. Andree Putman\'s steel and marble staircase spiralled through its six storey centre.', clue: 'Look at the 17th Street front and picture shop windows.', source: rbV }, { r: 1.6 });
    k.egg(v(0, 4.2, CZ + R + 2.4), { id: 'rubin-for-sale-sign', title: 'Seen from a car', year: '1998', text: 'Co founder Donald Rubin saw a for sale sign while driving down 17th Street and judged the building ideal for his collection. The old one storey Barneys entrance was enlarged into a three storey, mandala shaped gateway with a triple height void.', clue: 'Stand at the door and look up through the entrance.', source: rbR }, { r: 1.6 });
    k.egg(v(8, 1.6, 22), { id: 'rubin-seventh-avenue', title: 'Barney\'s first store', year: '1923', text: 'Barney Pressman opened the original Barney\'s men\'s discount store in 1923 in a storefront at 115 Seventh Avenue, round the corner. In 1998 the Rubins paid Barneys $22 million for the whole set of buildings on Seventh Avenue and 17th Street.', clue: 'Walk toward Seventh Avenue at the end of the block.', source: rbV }, { r: 1.6 });
    k.egg(v(0, 2.0, CZ - R + 1.4), { id: 'rubin-without-walls', title: 'A museum without walls', year: '2024', text: 'The museum opened here on October 2, 2004, built on a collection Donald and Shelley Rubin had been assembling since 1974. It closed the building on October 6, 2024, to become a museum without walls.', clue: 'Read the donor wall at the back of the drum.', source: rbW }, { r: 1.6 });
    // the works: on the drum wall at every floor, facing the void, so the climb passes them all
    const mounts: Mount[] = [];
    for (let f = 0; f < 5; f++) for (let i = 0; i < 4; i++) { const a = (i / 4) * PI * 2 + f * 0.4 + 0.3; if (f === 0 && Math.abs(Math.sin(a)) > 0.9 && Math.cos(a) > -0.2 && Math.sin(a) > 0) continue; const x = Math.cos(a) * (R - 0.42), z = CZ + Math.sin(a) * (R - 0.42); mounts.push({ position: v(x, f * 4.2 + 2.4, z), rotation: -a + PI / 2 + PI, target: v(0, f * 4.2 + 2.4, CZ), width: 3.4, height: 2.2, style: f % 2 ? 'gilt' : 'black', wash: true }); }
    const path = [v(0, 3, 22), v(0, 3, CZ + 10), v(3.6, 3, CZ)];
    for (let i = 0; i <= 600; i += 4) path.push(hp[i].clone().add(v(0, 1.6, 0)));
    path.push(v(0, SY + 1.6, CZ));
    return { mounts, spawn: path[0].clone(), look: v(0, 12, CZ), eye: 3, bounds: [-R + 1, R - 1, CZ - R + 1, 30], path, style: 'gilt' };
  },
};

/* ---------------- 94 THE SHED ---------------- */
export const theshed: RoomDef = {
  id: 'theshed',
  name: 'The shell rolls out',
  area: 'THE SHED',
  mood: 'Opening night at Hudson Yards',
  color: '#8ab0d0',
  description: 'The telescoping shell on its rails rolling out over the plaza to make the McCourt, the pillow skin lit from within, the works inside the hall and up on the gallery levels.',
  signatures: 'The quilted translucent ETFE shell on six bogies sliding on rails out from the base building, the McCourt hall it encloses, the exposed steel diagrid, the plaza and the Vessel beyond, the High Line spur.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x14203a, horizon: 0x5a4a60, ground: 0x0e1018, fog: 0.0024, stars: 220, env: 0.65 });
    k.hemi(0xd8e0ff, 0x1a1418, 0.55);
    const skin = k.flat(0xe8ecf4, 0.05, 0.6, { transparent: true, opacity: 0.55, emissive: 0x3a5aa8, emissiveIntensity: 0.6 }),
      steel = sc(k, 'theshed', 'steel', 1.6, () => X.steel(0x9aa0a6, true, 284), { metalness: 0.8, roughness: 0.4, color: 0xd8dce0 }, 0x9aa0a6), dark = k.flat(0x1a1c20, 0.5, 0.6),
      /* 2026-11-24 (wave 5c): scanned CC0 concrete for the McCourt floor and granite pavers for the plaza (Poly Haven) */
      floorC = sc(k, 'theshed', 'floor', 2.4, () => X.concrete(0x6a6a68, 149), { roughness: 0.7, color: 0xb0aca4 }, 0x6a6a68), plaza = sc(k, 'theshed', 'plaza', 2.2, () => X.pavers(0x9a9a94, 150), { roughness: 0.8 }, 0x8a8a84),
      glassT = k.pbr('shdGlass', X.windows(285, 0.3, 0x5a6a8a, false), 0.11, { emissive: 0xffffff, emissiveIntensity: 0.8, roughness: 0.3, metalness: 0.5, stretch: 0.42 }), white = k.flat(0xf4f4f2, 0, 0.9), rail = k.flat(0x3a3a3c, 0.6, 0.55);
    k.box(200, 0.4, 200, 0, -0.2, 0, plaza);
    for (const [x, z, w, h] of [[-60, -60, 34, 160], [70, -50, 30, 130], [-70, 60, 28, 110], [80, 70, 40, 200]]) k.box(w as number, h as number, w as number, x as number, (h as number) / 2, z as number, glassT);
    k.skyline({ z: 200, count: 24, spacing: 9, scale: 2.4, base: -1, seed: 286, lit: 0.4, glow: 1.0, tint: 0x3a3a48, rows: 1 });
    // the base building: eight storeys of galleries in a steel frame, glass front
    const BX = 0, BZ = -40, BW = 40, BD = 40, BH = 34;
    k.box(BW, BH, BD, BX, BH / 2, BZ, glassT);
    for (let x = -BW / 2; x <= BW / 2; x += 5) k.box(0.6, BH, 0.6, BX + x, BH / 2, BZ + BD / 2 + 0.1, steel);
    for (let y = 0; y < BH; y += 4.2) k.box(BW + 0.4, 0.4, 0.6, BX, y + 0.2, BZ + BD / 2 + 0.1, steel);
    // the shell: a quilted box on eight wheels riding two rails out across the plaza, rolling slowly out and back
    const SW = 44, SH = 38, SD = 36;
    const shell = new T.Group();
    const skinM = new T.Mesh(new T.BoxGeometry(SW, SH, SD), skin); skinM.position.y = SH / 2 + 2; shell.add(skinM);
    /* 2026-11-24 (wave 5c): the 216 separate balls become quilted cushions, flat and square shouldered like the real ETFE
       pillows, in one instanced draw, held in a steel grid of mullions and transoms (also instanced) */
    { const pg = new T.SphereGeometry(1, 16, 10); pg.scale(1.95, 1.95, 0.34); const sq = pg.attributes.position; for (let i = 0; i < sq.count; i++) { const x = sq.getX(i), y = sq.getY(i), r = Math.hypot(x, y) / 1.95, f = r > 0.01 ? Math.min(1.32, 1 / Math.max(Math.abs(x), Math.abs(y)) * Math.hypot(x, y)) : 1; sq.setXY(i, x * (0.7 + 0.3 * f), y * (0.7 + 0.3 * f)); } pg.computeVertexNormals();
      const cells: T.Matrix4[] = []; for (let x = -SW / 2 + 2; x < SW / 2; x += 4) for (let y = 4; y < SH + 2; y += 4) for (const sz of [1, -1]) cells.push(new T.Matrix4().makeTranslation(x, y, sz * (SD / 2 + 0.45)));
      const pim = new T.InstancedMesh(pg, skin, cells.length); cells.forEach((m, i) => pim.setMatrixAt(i, m)); shell.add(pim);
      const bars: T.Matrix4[] = []; for (const sz of [1, -1]) { for (let x = -SW / 2; x <= SW / 2 + 0.01; x += 4) bars.push(new T.Matrix4().compose(new T.Vector3(x, SH / 2 + 2, sz * (SD / 2 + 0.7)), new T.Quaternion(), new T.Vector3(1, SH, 1))); for (let y = 2; y <= SH + 2.01; y += 4) bars.push(new T.Matrix4().compose(new T.Vector3(0, y, sz * (SD / 2 + 0.7)), new T.Quaternion(), new T.Vector3(SW + 0.3, 1, 1))); }
      const bim = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1).scale(0.26, 0.26, 0.3), steel, bars.length); bars.forEach((m, i) => bim.setMatrixAt(i, m)); bim.castShadow = true; shell.add(bim); }
    for (let i = 0; i < 6; i++) { const y = 4 + i * 6; const beam = new T.Mesh(new T.BoxGeometry(SW + 0.2, 0.5, 0.5), steel); beam.position.set(0, y, SD / 2 + 0.3); shell.add(beam); const beam2 = beam.clone(); beam2.position.z = -SD / 2 - 0.3; shell.add(beam2); }
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; const d1 = new T.Mesh(new T.BoxGeometry(0.4, 12, 0.4), steel); d1.position.set(Math.cos(a) * SW / 2 * 0.9, 8 + (i % 2) * 8, Math.sin(a) * SD / 2 * 0.9); d1.rotation.z = 0.7 * (i % 2 ? 1 : -1); shell.add(d1); }
    /* six bogie wheel assemblies, three a side, each wheel six feet tall (ENR) */
    for (const sx of [-1, 1]) for (const dz of [-14, 0, 14]) { for (const wz of [-1.1, 1.1]) { const wheel = new T.Mesh(new T.CylinderGeometry(0.9, 0.9, 0.8, 20), dark); wheel.rotation.z = PI / 2; wheel.position.set(sx * (SW / 2 + 0.8), 0.9, dz + wz); shell.add(wheel); } const bogie = new T.Mesh(new T.BoxGeometry(2.4, 1.6, 4.4), steel); bogie.position.set(sx * (SW / 2 + 0.8), 2.4, dz); shell.add(bogie); }
    shell.position.set(BX, 0, BZ + BD / 2 + SD / 2 + 4); k.add(shell);
    for (const sx of [-1, 1]) { k.box(0.4, 0.4, 90, BX + sx * (SW / 2 + 0.8), 0.2, BZ + 26, rail); k.box(1.2, 0.2, 90, BX + sx * (SW / 2 + 0.8), 0.05, BZ + 26, dark); }
    /* the real shell rolls at a quarter mile an hour, about 0.11 m/s: so does this one, the wheels turning with the distance */
    if (!ctx.reduced) k.ticks.push((t) => { const d = 8 * Math.sin(t * 0.014); shell.position.z = BZ + BD / 2 + SD / 2 + 4 + d; shell.children.forEach((c) => { if ((c as T.Mesh).geometry instanceof T.CylinderGeometry) c.rotation.x = d / 0.9; }); });
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; k.point(BX + Math.cos(a) * 14, 14, BZ + BD / 2 + SD / 2 + 4 + Math.sin(a) * 10, 0x6a9aff, 40, 30); }
    // the McCourt floor under the shell: the hall, its stage, the works on the base building's face and on screens
    const HZ = BZ + BD / 2 + SD / 2 + 4;
    k.box(SW - 4, 0.3, SD - 4, BX, 0.15, HZ, floorC);
    k.box(20, 1.2, 10, BX, 0.6, HZ - 10, dark);
    for (let i = 0; i < 5; i++) k.spot(BX - 8 + i * 4, 30, HZ + 4, BX - 8 + i * 4, 1.2, HZ - 10, 0xffffff, 200, 0.4, 0.6, 40);
    k.block(BX - 10, BX + 10, HZ - 15, HZ - 5);
    k.block(BX - SW / 2 - 1.6, BX - SW / 2 + 1.6, HZ - SD / 2, HZ + SD / 2); k.block(BX + SW / 2 - 1.6, BX + SW / 2 + 1.6, HZ - SD / 2, HZ + SD / 2);
    donorWall(k, BX, 6.4, BZ + BD / 2 + 0.42, 0, 12, false);
    wordmarkRelief(k, BX, 12, BZ + BD / 2 + 0.44, 0, 8);
    eyeMonument(k, BX + 26, 0, HZ + 22, PI * 1.25, 5);
    blossomGarden(k, BX - 30, 0, HZ + 20, 6, 2.2);
    for (let i = 0; i < 6; i++) k.prop('rope_stanchion', BX - 12 + i * 4.8, 0.15, HZ + 10, { height: 1.0 });
    k.crowd([v(BX - 16, 0.15, HZ + 12), v(BX - 6, 0.15, HZ + 2), v(BX + 6, 0.15, HZ + 2), v(BX + 16, 0.15, HZ + 12)], 24, { seed: 127, speed: 0.3, spread: 3, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a, 0x33477f, 0xd8d0c0] });
    k.crowd([v(-40, 0, 60), v(0, 0, 50), v(40, 0, 60)], 14, { seed: 128, speed: 0.8, spread: 6, animate: !ctx.reduced });
    k.censusWall({ x: BX, y: 20, z: BZ + BD / 2 + 0.42, rotY: 0, cols: 40, rows: 8, tile: 0.55, gap: 0.05, start: ctx.wallStart(3600, 320), pieces: ctx.all, backing: dark });
    /* ---- 2026-11-24 (wave 5c): the McCourt set for a show ----
       Three rows of real folding chairs (Poly Haven, CC0, instanced) face the stage; a lighting truss over the stage carries
       three real flood light rigs; a projection screen at the back of the stage (Firefly plate queued); the plaza gets real
       street seating and a wayfinding totem; THE McCOURT on the stage front. One trick: anamorphic type on the plaza. */
    {
      const chairs: number[][] = []; for (let r = 0; r < 3; r++) for (let i = 0; i < 12; i++) chairs.push([BX - 4.95 + i * 0.9, 0.3, HZ - 1.6 + r * 1.15, PI]);
      many(k, 'theshed/ph_folding_chair_01', { height: 0.86 }, chairs, (o) => tint(o, 0x1a1c22, 0.5, 0.4)); k.block(BX - 5.5, BX + 5.5, HZ - 2.1, HZ + 1.3);
      const TY = 11.5; for (const dz of [-0.5, 0.5]) for (const dy of [0, 0.9]) k.box(24, 0.08, 0.08, BX, TY + dy, HZ - 7 + dz, steel); for (let x = -12; x <= 12; x += 1.5) k.beam(v(BX + x, TY, HZ - 7.5), v(BX + x + 0.75, TY + 0.9, HZ - 6.5), 0.03, steel, 4);
      for (const sx of [-1, 1]) k.box(0.1, TY, 0.1, BX + sx * 12, TY / 2, HZ - 7, steel);
      many(k, 'theshed/ph_flood_lights', { width: 2.6 }, [[BX - 7, TY - 1.1, HZ - 7, PI], [BX, TY - 1.1, HZ - 7, PI], [BX + 7, TY - 1.1, HZ - 7, PI]], (o) => o.rotation.x = 0.2);
      k.box(10.6, 6, 0.3, BX, 4.2, HZ - 14.4, dark); fireflyPlate(k, 'assets/museum/tex/theshed/ff_shed_stage.webp', 10, 5.6, BX, 4.2, HZ - 14.2, 0, k.glow(0x2a3a6a, 0.9), true);
      hsign(k, 'THE McCOURT', 4.4, 0.6, BX, 0.62, HZ - 4.98, 0, { fg: '#e8ecf4', font: 'W2 Archivo Expanded', size: 0.66 });
      many(k, 'theshed/ph_modular_street_seating', { width: 4.3 }, [[BX - 16, 0, HZ + 30, 0], [BX + 16, 0, HZ + 30, 0], [BX - 16, 0, HZ + 40, PI], [BX + 16, 0, HZ + 40, PI]]);
      for (const [x, z] of [[BX - 16, HZ + 30], [BX + 16, HZ + 30], [BX - 16, HZ + 40], [BX + 16, HZ + 40]]) k.block(x - 2.2, x + 2.2, z - 0.5, z + 0.5);
      { const tx = BX + 10, tz = HZ + 34; k.box(0.9, 3.0, 0.3, tx, 1.5, tz, k.flat(0x1a1c22, 0.4, 0.5)); hsign(k, 'THE SHED', 0.8, 0.5, tx, 2.5, tz + 0.16, 0, { fg: '#ffffff', size: 0.6 }); hsign(k, 'HUDSON YARDS', 0.8, 0.2, tx, 2.1, tz + 0.16, 0, { fg: '#9ab0d0', font: 'W2 JetBrains Mono', size: 0.6 }); hsign(k, 'HIGH LINE  ·  W 30 ST', 0.8, 0.16, tx, 1.8, tz + 0.16, 0, { fg: '#9ab0d0', font: 'W2 JetBrains Mono', size: 0.6 }); k.keepOut.push({ x: tx, z: tz, r: 0.6 }); }
      anamorph(k, 'THE SHELL MOVES', -10, 58, 3, 0.02, 12, 9, 1.4, '#9ad0ff', 150);
      k.egg(v(-10, 1.4, 54), { id: 'theshed-standing-type', title: 'Type that stands up', text: 'THE SHELL MOVES is painted flat on the plaza and stretched away from you, so from this one spot it seems to stand upright. The trick is anamorphosis, the same geometry as the stretched skull in Holbein\'s The Ambassadors of 1533.', clue: 'Stand where you arrived on the plaza and look toward the shell.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.4 });
    }
    /* the High Line spur alongside the rails: a planted deck on steel columns */
    { const LX = -46; k.box(9, 0.7, 120, LX, 5.6, 20, steel); k.box(8.4, 0.3, 120, LX, 6.1, 20, k.pbr('shdHL', X.grass(0x4a5a34, 290), 0.08)); for (const s of [-1, 1]) k.box(0.1, 1.1, 120, LX + s * 4.4, 6.8, 20, rail); for (let z = -36; z <= 76; z += 12) for (const s of [-1, 1]) { k.box(0.5, 5.4, 0.5, LX + s * 3.6, 2.7, z, steel); k.keepOut.push({ x: LX + s * 3.6, z, r: 0.6 }); } }
    /* the landmark eggs: the engineering of the moving shell */
    const shE = { name: 'The Shed\'s mobile structure has new level of performance, ENR', url: 'https://enr.com/articles/47532-the-sheds-mobile-structure-has-new-level-of-performance' }, shW = { name: 'The Shed (Hudson Yards), Wikipedia', url: 'https://en.wikipedia.org/wiki/The_Shed_(Hudson_Yards)' };
    k.egg(v(BX + SW / 2 + 0.8, 1.2, HZ + 22), { id: 'theshed-bogies', title: 'Six wheels, 140 feet', text: 'The shell moves 140 feet on six bogie wheel assemblies, each wheel six feet tall, carried on rails beside the High Line. A rack and pinion drive with 12 to 15 horsepower motors pushes it.', clue: 'Crouch by the rail and follow it to the wheels.', source: shE }, { r: 1.6 });
    k.egg(v(BX - SW / 2 - 0.8, 1.2, HZ + 30), { id: 'theshed-quarter-mile', title: 'A quarter mile an hour', text: 'At one quarter of a mile per hour it takes five minutes for the shell to roll out. Including setup and disconnecting the systems, turning the plaza into the McCourt takes six hours.', clue: 'Stand on the other rail and watch the shell creep.', source: shE }, { r: 1.6 });
    k.egg(v(BX, 7, HZ + SD / 2 + 2.4), { id: 'theshed-etfe', title: 'Pillows of air', text: 'The 120 foot tall shell is covered with 43,000 square feet of air filled ETFE panels, some up to 70 feet long, hung on a 4,000 ton exposed steel frame.', clue: 'Look up at the quilted skin of the shell.', source: shE }, { r: 2.2 });
    k.egg(v(BX - 16, 3, BZ + BD / 2 + 1.2), { id: 'theshed-inch-and-a-half', title: 'An inch and a half', text: 'When the shell rolls home the shell and the fixed building pass one another with a clearance of about one and a half inches. Tolerances at times ran to a thousandth of an inch, and the builders used the fixed building as shoring while they built the shell on top of it.', clue: 'Find where the shell meets the glass of the base building.', source: shE }, { r: 1.6 });
    k.egg(v(BX, 2.0, HZ - 10), { id: 'theshed-mccourt', title: 'Three thousand in the McCourt', text: 'With the shell rolled out, the McCourt is a 17,000 square foot hall that can seat up to 3,000 when the galleries open onto it, with clear spans of up to 100 feet.', clue: 'Climb onto the stage and look out at the hall.', source: shE }, { r: 1.6 });
    k.egg(v(BX + 14, 3, BZ + BD / 2 + 1.2), { id: 'theshed-bloomberg', title: 'The Bloomberg Building', year: '2019', text: 'The Shed opened on April 5, 2019. Michael Bloomberg gave $75 million of its predicted $475 million cost, and the building was ceremonially renamed the Bloomberg Building after him.', clue: 'Read the face of the fixed building behind the hall.', source: shW }, { r: 1.6 });
    const mounts: Mount[] = [];
    for (let i = 0; i < 6; i++) { const x = BX - 15 + i * 6; if (Math.abs(x) < 4) continue; mounts.push({ position: v(x, 4.2, BZ + BD / 2 + 0.42), rotation: 0, target: v(x, 3, HZ), width: 4.6, height: 2.7, style: 'steel', wash: true }); }
    for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) { const z = HZ - 12 + i * 8; const sc = k.box(0.14, 3.2, 4.6, BX + sx * (SW / 2 - 2.2), 2.4, z, dark); void sc; mounts.push({ position: v(BX + sx * (SW / 2 - 2.3), 2.5, z), rotation: sx < 0 ? PI / 2 : -PI / 2, target: v(z > HZ - 16 && z < HZ - 4 ? BX + sx * 11 : BX, 2.5, z), width: 4.2, height: 2.5, style: 'steel', wash: false }); }
    for (let i = 0; i < 4; i++) { const x = BX - 12 + i * 8; k.box(4.6, 3.2, 0.3, x, 2.4, HZ + SD / 2 - 3, dark); mounts.push({ position: v(x, 2.5, HZ + SD / 2 - 3.18), rotation: PI, target: v(x, 2.5, HZ + 6), width: 4.2, height: 2.5, style: 'steel', wash: false }); }
    return { mounts, spawn: v(-10, 3, 60), look: v(BX, 16, HZ), eye: 3, bounds: [-60, 60, BZ + BD / 2 + 1, 80], style: 'steel' };
  },
};

/* ---------------- 95 THE ARMORY ---------------- */
export const armory: RoomDef = {
  id: 'armory',
  name: 'The drill hall',
  area: 'PARK AVENUE ARMORY',
  mood: 'An installation at dusk',
  color: '#8a6a4a',
  description: 'The brick fortress on Park Avenue, the period rooms of the regiment, then the drill hall: two hundred by three hundred feet under eleven iron arches, the works standing in the dark like an installation.',
  signatures: 'The Gothic Revival brick armory with its crenellated towers, the Tiffany and Herter Brothers company rooms, the drill hall\'s eleven wrought iron elliptical arches, the roof a hundred feet up, the vast wooden floor, the balcony round the hall.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x1a2446, horizon: 0x6a5a70, ground: 0x14141a, fog: 0.0024, stars: 200, env: 0.6 });
    k.hemi(0xd8d0e8, 0x1a1418, 0.45);
    /* 2026-11-24 (wave 5c): scanned CC0 surfaces (Poly Haven): red brick, the drill hall's plank floor, dark oak panelling, limestone trim */
    const brick = sc(k, 'armory', 'brick', 1.6, () => X.brick(0x6a4436, 287), { roughness: 0.85 }, 0x6a4436), iron = k.pbr('armIron', X.steel(0x3a3a3c, true, 288), 0.6, { metalness: 0.7, roughness: 0.5 }),
      floorW = sc(k, 'armory', 'floor', 2.0, () => X.planks(0x7a5a3a, 8, 289, 0.15), { roughness: 0.55, color: 0xc8a078 }, 0x7a5a3a), dark = k.flat(0x1a1c20, 0.5, 0.6), oak = sc(k, 'armory', 'oak', 2.2, () => X.planks(0x4a2e1a, 4, 290, 0.15), { roughness: 0.5, color: 0xd8b890 }, 0x5a3a24),
      glow = k.glow(0xffd8a0), glass = k.glass(0xffe0b0, 0.3, 0.1), lime = sc(k, 'armory', 'lime', 2.0, () => X.ashlar(0xb8ad97, 291, 3), { roughness: 0.8 }, 0xb0a890);
    street(k, { w: 40, len: 160, z: 40, x: 0 });
    /* 2026-11-24 (wave 5c): the Park Avenue mall ran 50 m into the armory, so lawn and trees stood in the company room and the drill hall */
    k.box(8, 0.5, 104, 0, 0.1, 68, k.pbr('armMall', X.grass(0x3a5a2a, 151), 0.06)); for (let z = 24; z <= 110; z += 14) k.tree(0, 0.4, z, { kind: 'round', h: 5, r: 2, seed: z });
    blockFront(k, { x: -60, z0: 110, count: 12, face: 1, seed: 292, h: [20, 40] });
    const AW = 60, AD = 118, AX = 0, AZ = -49, AH = 16; /* front stays at z 10; the drill hall behind runs the real 300 feet */
    k.box(AW, AH, AD, AX, AH / 2, AZ, brick);
    for (let x = -AW / 2 + 2; x < AW / 2; x += 4) k.box(2, 2, 2.2, AX + x, AH + 1, AZ + AD / 2 - 1, brick);
    /* the central tower, 100 feet, the tallest of the three on Park Avenue */
    k.box(10, 14, 8, AX, AH + 7, AZ + AD / 2 - 4, brick); for (let x = -4; x <= 4; x += 2) k.box(1.4, 1.6, 1.4, AX + x, AH + 14.8, AZ + AD / 2 - 0.6, brick);
    for (const sx of [-1, 1]) { k.box(8, 22, 8, AX + sx * (AW / 2 - 4), 11, AZ + AD / 2 - 4, brick); for (let x = -3; x <= 3; x += 2) k.box(1.4, 1.6, 1.4, AX + sx * (AW / 2 - 4) + x, 22.8, AZ + AD / 2 - 1, brick); }
    k.arch(6, 9, 4, AX, 0, AZ + AD / 2, lime, false, 0.85);
    k.block(AX - AW / 2, AX - 3.2, AZ + AD / 2 - 0.6, AZ + AD / 2 + 0.6); k.block(AX + 3.2, AX + AW / 2, AZ + AD / 2 - 0.6, AZ + AD / 2 + 0.6);
    for (let f = 0; f < 2; f++) for (let i = 0; i < 6; i++) { const y = 5 + f * 6, x = AX - 20 + i * 8; if (Math.abs(x) < 5) continue; k.arch(1.8, 3.6, 0.4, x, y - 1.8, AZ + AD / 2 + 0.05, lime, false, 0.7); k.box(1.4, 3, 0.06, x, y, AZ + AD / 2 + 0.1, glass); }
    k.sign('SEVENTH REGIMENT ARMORY  ·  1880', 10, 0.7, AX, 14, AZ + AD / 2 + 0.06, 'transparent', '#e8dcc0', 70, 0);
    mlowBanner(k, AX - 14, 9, AZ + AD / 2 + 0.6, 0, 3.2, true); blossomFlag(k, AX + 14, 9, AZ + AD / 2 + 0.6, 0, 2.8, 7, 'ink');
    for (let i = 0; i < 5; i++) k.point(AX - 16 + i * 8, 2.4, AZ + AD / 2 + 2.6, 0xffc890, 34, 26);
    for (const x of [AX - 22, AX + 22]) { k.cyl(0.08, 5, x, 2.5, AZ + AD / 2 + 7, k.flat(0x1a1c20, 0.5, 0.6), 0.08, 8); k.sphere(0.3, x, 5.2, AZ + AD / 2 + 7, k.glow(0xffe0b0, 1.2)); k.point(x, 5.2, AZ + AD / 2 + 7, 0xffe0b0, 25, 20); }
    // the company room: oak, a fireplace, Tiffany glass, then the drill hall beyond
    const CZ = AZ + AD / 2 - 8;
    k.box(20, 0.3, 14, AX, 0.15, CZ, floorW);
    for (const s of [-1, 1]) { k.box(0.4, 6, 14, AX + s * 10, 3, CZ, oak); k.block(AX + s * 10 - 0.4, AX + s * 10 + 0.4, CZ - 7, CZ + 7); }
    k.box(20, 0.4, 14, AX, 6, CZ, k.pbr('armCeiling', X.plaster(0x6a5a48, 152), 0.4));
    /* 2026-11-24 (wave 5c): the back wall was one solid box across the doorway into the drill hall; now two piers and a lintel */
    for (const sx of [-1, 1]) k.box(7, 6, 0.4, AX + sx * 6.5, 3, CZ - 7, oak); k.box(6, 1.4, 0.4, AX, 5.3, CZ - 7, oak); k.block(AX - 10, AX - 3, CZ - 7.4, CZ - 6.6); k.block(AX + 3, AX + 10, CZ - 7.4, CZ - 6.6);
    k.box(3, 3.6, 0.6, AX - 6, 1.8, CZ - 6.6, lime); k.box(1.6, 1.4, 0.3, AX - 6, 0.7, CZ - 6.3, dark); k.point(AX - 6, 1.2, CZ - 5.6, 0xff9a40, 14, 6);
    k.prop('torchere', AX + 8, 0.15, CZ + 5, { height: 2.6 }); k.prop('torchere', AX - 8, 0.15, CZ + 5, { height: 2.6 });
    for (let i = 0; i < 3; i++) k.point(AX - 6 + i * 6, 5, CZ, 0xffd8a0, 20, 12);
    // the drill hall: the iron trusses, the wooden floor, the balcony, the installation of works standing in the dark
    const HD = 91, HZ = AZ + AD / 2 - 26 - HD / 2, HW = AW - 2, HH = 24; /* 200 by 300 feet */
    k.box(HW, 0.3, HD, AX, 0.15, HZ, floorW);
    for (const s of [-1, 1]) { k.box(0.6, HH, HD, AX + s * HW / 2, HH / 2, HZ, brick); k.block(AX + s * HW / 2 - 0.6, AX + s * HW / 2 + 0.6, HZ - HD / 2, HZ + HD / 2); }
    k.box(HW, HH, 0.6, AX, HH / 2, HZ - HD / 2, brick); k.block(AX - HW / 2, AX + HW / 2, HZ - HD / 2 - 0.6, HZ - HD / 2 + 0.6);
    for (let i = 0; i <= 10; i++) { const z = HZ - HD / 2 + i * (HD / 10); /* eleven wrought iron arches */ const pts: T.Vector3[] = []; for (let j = 0; j <= 20; j++) { const a = (j / 20) * PI; pts.push(v(AX + Math.cos(a) * HW / 2, 8 + Math.sin(a) * (HH - 8), z)); } k.curve(pts, 0.35, iron, 20); const pts2 = pts.map((p) => v(p.x * 0.94, 8 + (p.y - 8) * 0.88, p.z)); k.curve(pts2, 0.25, iron, 20); for (let j = 1; j < 20; j += 2) k.beam(pts[j], pts2[j], 0.08, iron, 4); }
    for (let j = 0; j <= 20; j += 4) { const a = (j / 20) * PI; k.box(0.3, 0.3, HD, AX + Math.cos(a) * HW / 2, 8 + Math.sin(a) * (HH - 8), HZ, iron); }
    const roofG = new T.CylinderGeometry(HW / 2 + 0.6, HW / 2 + 0.6, HD, 32, 1, true, 0, PI); const roof = k.mesh(roofG, sc(k, 'armory', 'roof', 1.6, () => X.plaster(0x3a3a40, 153), { side: T.BackSide, roughness: 0.8, color: 0x8a7a6a }, 0x3a3230), AX, 8, HZ); roof.rotation.set(0, 0, PI / 2); roof.rotateX(PI / 2); roof.scale.set(1, (HH - 8) / (HW / 2), 1); void roof;
    for (const s of [-1, 1]) { k.box(4, 0.4, HD, AX + s * (HW / 2 - 2), 7.6, HZ, floorW); k.box(0.06, 1.1, HD, AX + s * (HW / 2 - 4), 8.4, HZ, iron); for (let z = -HD / 2; z <= HD / 2; z += 3) k.box(0.06, 1.1, 0.06, AX + s * (HW / 2 - 4), 8.4, HZ + z, iron); }
    for (let i = 0; i < 14; i++) k.box(3, 0.55, 1.0, AX + HW / 2 - 2, 0.27 + i * 0.55, HZ + HD / 2 - 1 - i * 1.0, iron);
    k.block(AX - HW / 2 + 0.6, AX - HW / 2 + 4, HZ - HD / 2, HZ + HD / 2); k.block(AX + HW / 2 - 4, AX + HW / 2 - 0.6, HZ - HD / 2, HZ + HD / 2 - 15);
    for (let z = -HD / 2 + 6; z < HD / 2; z += 10) k.point(AX, HH - 4, HZ + z, 0xffd8a0, 20, 30);
    /* ---- 2026-11-24 (wave 5c): the armory armed and furnished ----
       Outside: oak doors standing open in the arch, two cast iron cannon on the Park Avenue front, limestone string courses.
       The company room: oak panelling, a mantel with its clock, two crystal chandeliers, leather armchairs, swords and
       shields on the walls, DRILL HALL over the inner door. The drill hall: the regiment's colours hung along both walls
       (Firefly plate queued), and one trick, 200 BY 300 FEET painted on the floor that stands up from the door.
       All models Poly Haven, CC0. */
    {
      const FZ3 = AZ + AD / 2;
      many(k, 'armory/ph_large_castle_door', { height: 5.4 }, [[AX - 2.75, 0, FZ3 + 1.6, PI / 2], [AX + 2.75, 0, FZ3 + 1.6, -PI / 2]], (o) => tint(o, 0x5a3a22, 0.6, 0.2));
      many(k, 'armory/ph_cannon_01', { length: 3.4 }, [[AX - 7, 0, FZ3 + 5, 0], [AX + 7, 0, FZ3 + 5, 0]]); k.keepOut.push({ x: AX - 7, z: FZ3 + 5, r: 1.5 }, { x: AX + 7, z: FZ3 + 5, r: 1.5 });
      for (const y of [3.2, 8.4, AH - 0.6]) band(k, 'x', AW + 0.2, 0.4, 0.3, AX, y, FZ3 + 0.1, lime);
      const ci = CZ;
      panels(k, 'z', AX - 9.8, 0, ci - 6.4, ci + 6.4, 0.5, 1.5, 6, 1, oak, lime); panels(k, 'z', AX + 9.8, 0, ci - 6.4, ci + 6.4, 0.5, 1.5, 6, -1, oak, lime);
      k.box(3.4, 0.14, 0.6, AX - 6, 1.72, ci - 6.05, lime); many(k, 'armory/ph_mantel_clock_01', { width: 0.6 }, [[AX - 6, 1.79, ci - 6.1, 0]]);
      for (const x of [AX - 4, AX + 4]) k.cyl(0.015, 0.5, x, 5.55, ci, dark, 0.015, 6);
      many(k, 'armory/ph_Chandelier_02', { height: 1.1 }, [[AX - 4, 4.2, ci, 0], [AX + 4, 4.2, ci, 0]]);
      many(k, 'armory/ph_ArmChair_01', { height: 1.0 }, [[AX - 7.6, 0.3, ci - 3.6, PI * 0.8], [AX - 4.4, 0.3, ci - 3.6, -PI * 0.8]], (o) => tint(o, 0x4a2a1a, 0.55, 0)); k.keepOut.push({ x: AX - 7.6, z: ci - 3.6, r: 0.6 }, { x: AX - 4.4, z: ci - 3.6, r: 0.6 });
      for (const sx of [-1, 1]) { many(k, 'armory/ph_kite_shield', { height: 1.2 }, [[AX + sx * 9.72, 2.6, ci - 2, sx * -PI / 2], [AX + sx * 9.72, 2.6, ci + 3, sx * -PI / 2]], (o) => tint(o, 0x7a1a1e, 0.5, 0.3)); many(k, 'armory/ph_antique_estoc', { height: 1.4 }, [[AX + sx * 9.7, 2.5, ci + 0.5, sx * -PI / 2]]); }
      hsign(k, 'DRILL HALL', 3.6, 0.5, AX, 4.9, ci - 6.78, 0, { fg: '#e8d8b0', size: 0.7, lit: false });
      hsign(k, 'PARK AVENUE ARMORY  ·  643 PARK AVENUE', 9, 0.5, AX - 15, 2.5, FZ3 + 0.32, 0, { fg: '#2a1a12', size: 0.62, lit: false });
      const colours = HAS_DOM ? new T.MeshStandardMaterial({ side: T.DoubleSide, roughness: 0.8, map: paintTex(256, 512, (g) => { g.fillStyle = '#7a1a22'; g.fillRect(0, 0, 256, 512); g.fillStyle = '#1d2f5c'; g.fillRect(0, 0, 256, 150); g.strokeStyle = '#d8b060'; g.lineWidth = 14; g.strokeRect(10, 10, 236, 470); g.fillStyle = '#d8b060'; g.font = '800 170px "W2 Archivo Expanded", Arial'; g.textAlign = 'center'; g.fillText('7', 128, 360); for (let i = 0; i < 16; i++) g.fillRect(i * 16 + 2, 486, 8, 26); }, ['W2 Archivo Expanded']) }) : k.flat(0x7a1a22, 0, 0.8);
      for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) { const z = HZ - HD / 2 + 10 + i * 14; fireflyPlate(k, 'assets/museum/tex/armory/ff_armory_colours.webp', 2.2, 4.4, AX + sx * (HW / 2 - 0.36), 13.4, z, sx < 0 ? PI / 2 : -PI / 2, colours); k.box(0.08, 0.08, 2.6, AX + sx * (HW / 2 - 0.4), 15.65, z, iron); }
      anamorph(k, '200 BY 300 FEET', AX, HZ + HD / 2 - 2, 3.3, 0.32, 10, 12, 1.4, '#f2e2c0', 150);
      k.egg(v(AX + 1.4, 1.4, HZ + HD / 2 - 3), { id: 'armory-standing-type', title: 'The floor stands up', text: '200 BY 300 FEET is painted flat on the drill hall floor and stretched away from the door, so from the doorway it seems to stand upright like a sign. The trick is anamorphosis; Holbein hid a stretched skull in The Ambassadors in 1533.', clue: 'Stop in the doorway from the company room and look down the hall.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.4 });
    }
    /* the landmark eggs: the Silk Stocking Regiment's armory */
    const amW = { name: 'Park Avenue Armory, Wikipedia', url: 'https://en.wikipedia.org/wiki/Park_Avenue_Armory' };
    k.egg(v(AX + 8, 2.2, HZ + 22), { id: 'armory-eleven-arches', title: 'Eleven iron arches', text: 'The drill hall measures 200 by 300 feet, one of the city\'s largest column free rooms when it was finished. Eleven wrought iron elliptical arches, each about 187 feet wide, carry a roof that peaks 100 feet above the floor.', clue: 'Stand in the middle of the hall and count the arches overhead.', source: amW }, { r: 1.8 });
    k.egg(v(AX - 12, 0.8, HZ - HD / 2 + 5), { id: 'armory-rifle-range', title: 'A range in the basement', text: 'The armory\'s basement held a rifle range 300 feet long. The hall itself was about three times the size of the regiment\'s previous armory.', clue: 'Look down at the floorboards at the far end of the hall.', source: amW }, { r: 1.8 });
    k.egg(v(AX - 6, 2.0, CZ - 5.4), { id: 'armory-veterans-room', title: 'Tiffany and White', year: '1881', text: 'The Veterans Room and the library were finished in 1881 to designs by Tiffany and Stanford White. Robert A. M. Stern called the Veterans Room perhaps the armory\'s most notable interior.', clue: 'Warm your hands at the fireplace in the company room.', source: amW }, { r: 1.6 });
    k.egg(v(AX + 7, 2.0, CZ + 4), { id: 'armory-company-rooms', title: 'Twelve company rooms', text: 'Herter Brothers designed the Reception, Board of Officers and Colonel\'s rooms, and the twelve company rooms on the second floor are landmarked. Since 2006 the Park Avenue Armory Conservancy has run the building on a 99 year lease.', clue: 'Look round the panelled room by the torcheres.', source: amW }, { r: 1.6 });
    k.egg(v(AX - 10, 3, AZ + AD / 2 + 1.2), { id: 'armory-brick-not-granite', title: 'Brick, to save money', year: '1880', text: 'The city approved up to $350,000 but never paid, so the 7th Regiment raised the money itself through donations and bonds, one of the few American armories built and furnished with private funds. It cost $589,438.91, and the builders used brick rather than granite to cut costs.', clue: 'Touch the brick of the Park Avenue front.', source: amW }, { r: 1.6 });
    k.egg(v(AX, AH + 8, AZ + AD / 2 + 0.2), { id: 'armory-silk-stocking', title: 'The Silk Stocking Regiment', text: 'The 7th Regiment was nicknamed the Silk Stocking Regiment for the wealth of its members. Its armory opened on September 30, 1880, behind a Park Avenue front split by three towers, the central one 100 feet tall.', clue: 'Look up at the middle tower over the door.', source: amW }, { r: 2.2 });
    // the installation: works standing on free walls in a grid on the floor, each lit by one spot from the trusses
    const mounts: Mount[] = [];
    const rnd = X.mulberry(95);
    for (let i = 0; i < 12; i++) { const gx = (i % 4) - 1.5, gz = Math.floor(i / 4) - 1; const x = AX + gx * 12 + (rnd() - 0.5) * 3, z = HZ + gz * 14 + (rnd() - 0.5) * 3; const rot = rnd() * PI; const w = k.box(5.2, 3.6, 0.4, x, 1.8, z, k.pbr('armWall' + (i % 3), X.plaster([0xf4f4f2, 0x2a2a2e, 0x6a2a2a][i % 3], 154 + i % 3), 0.4)); w.rotation.y = rot; for (let t = -2; t <= 2; t++) k.keepOut.push({ x: x + Math.cos(rot) * t, z: z - Math.sin(rot) * t, r: 0.7 }); for (const s of [-1, 1]) mounts.push({ position: v(x + Math.sin(rot) * s * 0.22, 1.9, z + Math.cos(rot) * s * 0.22), rotation: rot + (s > 0 ? 0 : PI), target: v(x + Math.sin(rot) * s * 6, 2, z + Math.cos(rot) * s * 6), width: 4.4, height: 2.6, style: i % 3 === 1 ? 'white' : 'black', wash: false }); k.spot(x, HH - 2, z + 3, x, 1.8, z, 0xfff0d8, 120, 0.35, 0.5, 30); }
    eyeMonument(k, AX, 0.15, HZ + HD / 2 - 4, PI, 4.6);
    donorWall(k, AX, 4.4, HZ - HD / 2 + 0.42, 0, 12, false);
    k.crowd([v(AX - 20, 0.15, HZ + 20), v(AX - 12, 0.15, HZ - 10), v(AX + 10, 0.15, HZ - 20), v(AX + 20, 0.15, HZ + 10)], 20, { seed: 129, speed: 0.3, spread: 3, animate: !ctx.reduced, closed: true, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a] });
    k.censusWall({ x: AX, y: 6, z: HZ - HD / 2 + 0.42, rotY: 0, cols: 40, rows: 6, tile: 0.55, gap: 0.05, start: ctx.wallStart(7000, 240), pieces: ctx.all, backing: dark });
    return { mounts, spawn: v(-16, 3, 44), look: v(AX + 4, 14, AZ + AD / 2), eye: 3, bounds: [-HW / 2 + 4.2, HW / 2 - 4.2, HZ - HD / 2 + 1, 48], style: 'black', floorY: (x, z) => { if (x > AX + HW / 2 - 4 && x < AX + HW / 2 - 0.6 && z < HZ + HD / 2 - 0.5 && z > HZ + HD / 2 - 15) return Math.min(7.6, ((HZ + HD / 2 - 0.5 - z) / 14) * 7.6); if ((x < AX - HW / 2 + 4 || x > AX + HW / 2 - 4) && z > HZ - HD / 2 && z <= HZ + HD / 2 - 15 && Math.abs(x) < HW / 2) return 7.8; return 0; } };
  },
};

/* ---------------- 96 THE CUSTOM HOUSE ---------------- */
export const customhouse: RoomDef = {
  id: 'customhouse',
  name: 'The rotunda at Bowling Green',
  area: 'THE CUSTOM HOUSE',
  mood: 'Harbor light through the skylight',
  color: '#c8b8a0',
  description: 'Bowling Green and the four continents on their pedestals, the granite palace of the old Custom House, then the oval rotunda: a tile dome that floats with no columns, the murals of the harbor, the works in the collector\'s offices.',
  signatures: 'The Beaux Arts granite front with its giant columns and the four seated continents, the elliptical rotunda with a Guastavino tile dome and skylight, the harbor murals in the dome\'s spandrels, the old collector\'s counters in marble and bronze, the twelve seafaring nations on the cornice.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad8, horizon: 0xeef0ec, ground: 0x6a6a66, fog: 0.0018, sun: { az: 2.6, el: 0.7, color: 0xfff6e8, size: 12 }, env: 1.0 });
    k.hemi(0xf2f6ff, 0x5a5a58, 0.9);
    k.sun(0xfff2dc, 2.4, 60, 80, 40, true, 100);
    /* 2026-11-24 (wave 5c): scanned CC0 surfaces (Poly Haven): granite ashlar, white marble, buff herringbone tile for the
       Guastavino dome, marble floor tiles */
    const granite = sc(k, 'customhouse', 'granite', 2.6, () => X.ashlar(0x9a9488, 293, 3), { roughness: 0.8, color: 0xc4c8cc }, 0x9a9488), marble = sc(k, 'customhouse', 'marble', 1.4, () => X.marble(0xe0dcd2, 0x9a948a, 20), { roughness: 0.3, side: T.DoubleSide }, 0xe0dcd2),
      tile = sc(k, 'customhouse', 'tile', 1.2, () => X.brick(0xcbb894, 294), { roughness: 0.6, side: T.BackSide, color: 0xe8d8b8 }, 0xb8a888), bronze = k.flat(0x4a3a28, 0.8, 0.4),
      floorT = sc(k, 'customhouse', 'floor', 2.0, () => X.terrazzo(0xc8c0b0, 155), { roughness: 0.3 }, 0xc8c0b0), dark = k.flat(0x1a1c20, 0.5, 0.6), glass = k.glass(0xe8f4f8, 0.1, 0.03),
      mural = [k.flat(0x6a8ab0, 0, 0.9), k.flat(0xb89a6a, 0, 0.9), k.flat(0x8ab0a0, 0, 0.9), k.flat(0xc8a878, 0, 0.9)], lawn = k.pbr('bgLawn2', X.grass(0x4a7a3a, 156), 0.06);
    // Bowling Green: the oval park, the fence, the canyon of Broadway behind
    street(k, { w: 24, len: 160, z: 40, x: 0 });
    k.mesh(new T.CylinderGeometry(18, 18, 0.5, 48), lawn, 0, 0.05, 66).scale.set(1, 1, 0.7);
    for (let i = 0; i < 48; i++) { const a = (i / 48) * PI * 2; k.box(0.06, 1.2, 0.06, Math.cos(a) * 18.5, 0.6, 66 + Math.sin(a) * 12.9, dark); }
    k.mesh(new T.CylinderGeometry(2.4, 2.6, 0.6, 32), granite, 0, 0.3, 66); k.mesh(new T.CylinderGeometry(2, 2, 0.2, 32), k.flat(0x88aacc, 0.3, 0.2, { transparent: true, opacity: 0.6 }), 0, 0.7, 66);
    blockFront(k, { x: -46, z0: 130, count: 12, face: 1, seed: 295, h: [24, 50] }); blockFront(k, { x: 46, z0: 130, count: 12, face: -1, seed: 296, h: [24, 50] });
    k.skyline({ z: -200, count: 30, spacing: 9, scale: 4.2, base: -1, seed: 297, lit: 0.25, glow: 0.5, tint: 0x6e7684, rows: 1, spires: true });
    // the facade: giant columns, the four continents seated on pedestals, the steps
    const FZ = 10, FW = 90;
    k.box(FW, 32, 60, 0, 16, FZ - 30, granite);
    k.moulding([[0, 0], [1.4, 0], [1.5, 0.4], [0.9, 0.7], [1.2, 1.1], [0, 1.4]], FW + 0.4, 0, 31.2, FZ + 0.05, granite, -PI / 2); /* wave 5c: rotated, it ran 90 m along z through the building */
    for (let i = 0; i < 12; i++) k.box(FW + 6, 0.34, 1.6, 0, 0.17 + i * 0.34, FZ + 2 + i * 1.6, granite);
    for (let i = 0; i < 12; i++) { const x = -38.5 + i * 7; k.column(x, 4, FZ + 1.6, 20, 1.2, granite, true); k.prop('corinthian_capital', x, 24, FZ + 1.6, { height: 2.4 }); }
    k.box(FW, 2.4, 5, 0, 26.6, FZ + 1.6, granite);
    /* the twelve seafaring nations on the cornice, one over each column, eleven feet tall */
    for (let i = 0; i < 12; i++) k.prop('bronze_figure', -38.5 + i * 7, 27.8, FZ + 2.6, { height: 3.4 });
    for (const x of [-42, -14, 14, 42]) { k.box(5, 3, 5, x, 5.5, FZ + 5, granite); k.prop('bronze_figure', x, 7, FZ + 5, { height: 3.6 }); k.keepOut.push({ x, z: FZ + 5, r: 3.4 }); }
    for (const x of [-28, 0, 28]) { k.arch(4.4, 9, 4, x, 4, FZ + 0.4, granite, false, 0.85); k.box(3.6, 6.6, 0.2, x, 8, FZ + 0.6, glass); }
    k.block(-FW / 2, -2.2, FZ - 0.5, FZ + 1); k.block(2.2, FW / 2, FZ - 0.5, FZ + 1);
    k.sign('CUSTOM HOUSE  ·  1907  ·  THE MUSEUM OF THE AMERICAN INDIAN', 24, 0.9, 0, 29, FZ + 1.4, 'transparent', '#e8dcc0', 70, 0);
    mlowBanner(k, -21, 15, FZ + 2.4, 0, 4.2, true); blossomFlag(k, 21, 15, FZ + 2.4, 0, 3.6, 5, 'electric');
    // the rotunda: an ellipse under a tile dome with a skylight, the murals in the spandrels, the counters
    const RZ = FZ - 26, RA = 20.5, RB = 13, RH = 12; /* the real ellipse: 135 by 85 feet */
    k.mesh(new T.CylinderGeometry(RA, RA, 0.3, 64), floorT, 0, 4.15, RZ).scale.set(1, 1, RB / RA);
    const wall = k.mesh(new T.CylinderGeometry(RA, RA, RH, 64, 1, true), marble, 0, 4 + RH / 2, RZ); wall.scale.set(1, 1, RB / RA);
    for (let i = 0; i < 64; i++) { const a = (i / 64) * PI * 2; const x = Math.cos(a) * (RA + 0.4), z = RZ + Math.sin(a) * (RB + 0.4); if (Math.abs(a - PI / 2) < 0.14) continue; k.keepOut.push({ x, z, r: 1.2 }); }
    k.block(-RA, -2.4, RZ + RB - 0.6, RZ + RB + 0.6); k.block(2.4, RA, RZ + RB - 0.6, RZ + RB + 0.6);
    const dome = k.mesh(new T.SphereGeometry(RA, 48, 16, 0, PI * 2, 0, PI / 2), tile, 0, 4 + RH, RZ); dome.scale.set(1, 0.55, RB / RA);
    k.torus(6, 0.4, 0, 4 + RH + RA * 0.55 - 0.6, RZ, bronze, 48).rotation.x = PI / 2;
    k.mesh(new T.CircleGeometry(5.6, 32), k.glow(0xfff4e0, 0.9), 0, 4 + RH + RA * 0.55 - 0.5, RZ).rotation.x = PI / 2;
    k.point(0, 4 + RH + 4, RZ, 0xfff4e6, 120, 50);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2 + PI / 8; const x = Math.cos(a) * (RA - 0.6), z = RZ + Math.sin(a) * (RB - 0.6); const m = k.box(6, 3.2, 0.2, 0, 0, 0, mural[i % 4]); m.position.set(x, 4 + RH - 2, z); m.rotation.y = -a + PI / 2; k.point(x * 0.85, 4 + RH - 1, RZ + (z - RZ) * 0.85, 0xffe8c8, 10, 8); }
    for (let i = 0; i < 4; i++) { const a = (i / 4) * PI * 2; const x = Math.cos(a) * 9, z = RZ + Math.sin(a) * 7; k.box(5, 1.1, 1.0, x, 4.7, z, marble).rotation.y = -a; k.box(5, 0.9, 0.06, x, 6.0, z, bronze).rotation.y = -a; k.keepOut.push({ x, z, r: 2.8 }); }
    eyeMedallion(k, 0, 4.32, RZ, 2.8);
    /* ---- 2026-11-24 (wave 5c): the rotunda and Bowling Green built out ----
       The rotunda wall was one sided, so the towers of Broadway showed through it; now it is solid marble with a darker
       wainscot, a moulded ring where the dome springs, twelve tile ribs up the Guastavino dome, iron glazing bars across the
       skylight, and the eight harbour murals as painted plates (Firefly queued). In the lobby a Dutch ship model stands in a
       glass case for Fort Amsterdam. Bowling Green gets a top rail and finials on its fence, lamps and benches, and the corner
       street sign. One trick: LOOK UP painted flat in the lobby stands up from the door. Models Poly Haven, CC0. */
    {
      const DY = 4 + RH, ribM = sc(k, 'customhouse', 'marble', 1.4, () => X.marble(0xd8d2c4, 0x9a948a, 22), { roughness: 0.4, color: 0xe8e0d0 }, 0xd8d0c0);
      const wain = k.mesh(new T.CylinderGeometry(RA - 0.06, RA - 0.06, 1.5, 64, 1, true), sc(k, 'customhouse', 'marble', 1.4, () => X.marble(0x8a8478, 0x5a564e, 23), { roughness: 0.25, color: 0x8a8070, side: T.DoubleSide }, 0x7a7468), 0, 4.15 + 0.75, RZ); wain.scale.set(1, 1, (RB - 0.06) / RA);
      const ring = k.torus(RA - 0.25, 0.32, 0, DY, RZ, ribM, 64); ring.rotation.x = PI / 2; ring.scale.set(1, (RB - 0.25) / (RA - 0.25), 1);
      for (let i = 0; i < 12; i++) { const ph = (i / 12) * PI * 2, pts: T.Vector3[] = []; for (let j = 0; j <= 14; j++) { const th = PI / 2 - (j / 14) * (PI / 2 - Math.asin(6.4 / RA)); pts.push(v(Math.cos(ph) * RA * Math.sin(th) * 0.985, DY + RA * Math.cos(th) * 0.55 * 0.985, RZ + Math.sin(ph) * RB * Math.sin(th) * 0.985)); } k.curve(pts, 0.2, ribM, 14); }
      const TOP = DY + RA * 0.55 - 0.56; for (let i = 0; i < 6; i++) k.box(11.4, 0.12, 0.12, 0, TOP, RZ, k.flat(0x2a2a2c, 0.7, 0.4)).rotation.y = (i / 6) * PI; k.torus(3, 0.08, 0, TOP, RZ, k.flat(0x2a2a2c, 0.7, 0.4), 32).rotation.x = PI / 2;
      const harbour = (seed: number) => HAS_DOM ? new T.MeshStandardMaterial({ roughness: 0.9, map: paintTex(768, 410, (g) => { const r = X.mulberry(seed); const sk = g.createLinearGradient(0, 0, 0, 260); sk.addColorStop(0, '#7a9cc0'); sk.addColorStop(1, '#e8d8b8'); g.fillStyle = sk; g.fillRect(0, 0, 768, 260); g.fillStyle = '#3a5a6a'; g.fillRect(0, 260, 768, 150); g.fillStyle = '#8a8478'; for (let i = 0; i < 18; i++) { const w = 18 + r() * 30, h = 30 + r() * 110; g.fillRect(i * 44 + r() * 10, 260 - h, w, h); } for (let i = 0; i < 4; i++) { const x = 60 + i * 180 + r() * 40, y = 300 + r() * 60; g.fillStyle = '#2a2420'; g.fillRect(x, y, 120, 26); g.fillStyle = '#c84030'; g.fillRect(x + 30, y - 40, 18, 40); g.fillStyle = 'rgba(240,240,235,0.7)'; g.beginPath(); g.arc(x + 39, y - 60, 22, 0, PI * 2); g.fill(); } g.strokeStyle = '#c8a860'; g.lineWidth = 10; g.strokeRect(5, 5, 758, 400); }) }) : k.flat(0x6a8ab0, 0, 0.9);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2 + PI / 8, x = Math.cos(a) * (RA - 0.74), z = RZ + Math.sin(a) * (RB - 0.74); fireflyPlate(k, `assets/museum/tex/customhouse/ff_ch_harbour_${i % 2 ? 'b' : 'a'}.webp`, 5.8, 3.1, x, DY - 2, z, -a + PI / 2 + PI, harbour(400 + i)); }
      { const sx = 6, sz = 6; k.box(3.0, 1.0, 1.3, sx, 4.3 + 0.5, sz, ribM); k.box(3.0, 2.9, 1.3, sx, 5.3 + 1.45, sz, k.glass(0xe8f4f8, 0.08, 0.03)); k.box(3.04, 0.06, 1.34, sx, 8.22, sz, bronze); many(k, 'customhouse/ph_dutch_ship_medium', { width: 2.7 }, [[sx, 5.32, sz, 0]]); k.keepOut.push({ x: sx, z: sz, r: 1.7 }); k.point(sx, 9, sz + 1.2, 0xfff0dc, 8, 6);
        hsign(k, 'A DUTCH TRADER OF FORT AMSTERDAM', 2.8, 0.16, sx, 4.62, sz + 0.66, 0, { fg: '#2a2218', font: 'W2 JetBrains Mono', size: 0.6, lit: false }); }
      for (let i = 0; i < 48; i++) { const a = (i / 48) * PI * 2; k.sphere(0.08, Math.cos(a) * 18.5, 1.26, 66 + Math.sin(a) * 12.9, k.flat(0xb08a40, 0.9, 0.35), 6); }
      { const pts: T.Vector3[] = []; for (let i = 0; i <= 48; i++) { const a = (i / 48) * PI * 2; pts.push(v(Math.cos(a) * 18.5, 1.12, 66 + Math.sin(a) * 12.9)); } k.curve(pts, 0.035, dark, 96, true); }
      many(k, 'customhouse/ph_street_lamp_01', { height: 4.2 }, [[-20, 0, 66, 0], [20, 0, 66, PI], [-13, 0, 53, 0], [13, 0, 53, PI], [-13, 0, 79, 0], [13, 0, 79, PI]], (o) => tint(o, 0x1e2a22, 0.5, 0.7));
      for (const [x, z] of [[-20, 66], [20, 66], [-13, 53], [13, 53], [-13, 79], [13, 79]]) k.keepOut.push({ x, z, r: 0.35 });
      { const at: number[][] = []; for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2 + PI / 6, x = Math.cos(a) * 6.2, z = 66 + Math.sin(a) * 4.6; at.push([x, 0.3, z, -a - PI / 2]); k.keepOut.push({ x, z, r: 0.8 }); } many(k, 'customhouse/ph_painted_wooden_bench', { width: 1.8 }, at, (o) => tint(o, 0x2a4a32, 0.6, 0.1)); }
      { const px = 14, pz = 50; k.cyl(0.06, 3.6, px, 1.8, pz, k.flat(0x1e2a22, 0.6, 0.5), 0.06, 8); hsign(k, 'BROADWAY', 1.4, 0.28, px, 3.5, pz + 0.04, 0, { fg: '#ffffff', bg: '#1f5a3a', border: '#ffffff', size: 0.62 }); hsign(k, 'STATE ST', 1.4, 0.28, px + 0.04, 3.84, pz, PI / 2, { fg: '#ffffff', bg: '#1f5a3a', border: '#ffffff', size: 0.62 }); hsign(k, 'BOWLING GREEN', 1.4, 0.22, px, 3.18, pz + 0.04, 0, { fg: '#1f5a3a', bg: '#f2ede0', size: 0.62 }); k.keepOut.push({ x: px, z: pz, r: 0.3 }); }
      if (HAS_DOM) anamorphTex(k, floorType('LOOK UP', '#c8a860'), 0, FZ - 2, 4.3 + 3, 4.31, 0, 6, 4.4, 1.1, 0.8);
      k.egg(v(-1.4, 5.6, FZ - 3), { id: 'customhouse-look-up', title: 'Two words on the floor', text: 'LOOK UP is painted flat on the lobby floor and stretched toward the rotunda, so from just inside the door it stands upright and points you at the skylight. The trick is anamorphosis, as old as the stretched skull in Holbein\'s The Ambassadors of 1533.', clue: 'Step in from the steps and look across the lobby toward the rotunda.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.4 });
    }
    donorWall(k, 0, 8.8, RZ - RB + 0.6, 0, 12, false);
    for (let i = 0; i < 4; i++) k.prop('rope_stanchion', -8 + i * 5.3, 4.15, RZ + RB - 5, { height: 1.0 });
    k.box(24, 0.3, 24, 0, 4.15, FZ - 12, floorT); k.block(-12, -12 + 0.4, FZ - 24, FZ); k.block(12 - 0.4, 12, FZ - 24, FZ);
    k.crowd([v(0, 0, 44), v(0, 0, FZ + 12), v(0, 4.15, FZ - 6), v(-10, 4.15, RZ + 4), v(10, 4.15, RZ - 6)], 30, { seed: 130, speed: 0.4, spread: 3, animate: !ctx.reduced, colors: [0x24262c, 0x8a3a3a, 0x33477f, 0xd8d0c0, 0x151517] });
    k.censusWall({ x: -11.66, y: 8, z: FZ - 12, rotY: PI / 2, cols: 24, rows: 6, tile: 0.55, gap: 0.05, start: ctx.wallStart(200, 144), pieces: ctx.all, backing: dark });
    /* the landmark eggs: Cass Gilbert's custom house */
    const chW = { name: 'Alexander Hamilton U.S. Custom House, Wikipedia', url: 'https://en.wikipedia.org/wiki/Alexander_Hamilton_U.S._Custom_House' };
    k.egg(v(-42, 8, FZ + 5), { id: 'customhouse-four-continents', title: 'Asia, America, Europe, Africa', text: 'Daniel Chester French carved the Four Continents in marble, with Adolph Weinman as his associate. From east to west they are Asia, America, Europe and Africa, Asia with a tiger and Africa with a lion, and each group cost $13,500.', clue: 'Start at the east end of the steps and walk the four continents in order.', source: chW }, { r: 2.0 });
    k.egg(v(0, 29.6, FZ + 2.6), { id: 'customhouse-germania', title: 'Germany became Belgium', year: '1918', text: 'Twelve statues on the cornice personify seafaring nations, each eleven feet tall and weighing twenty tons, from Greece and Rome in the east to the French and British empires in the west. In 1918, after the United States entered the First World War, Albert Jaegers\'s Germania was recarved with Belgian insignia.', clue: 'Look up at the figures standing on the cornice.', source: chW }, { r: 2.4 });
    k.egg(v(-24.5, 6, FZ + 2.6), { id: 'customhouse-hermes', title: 'Forty four heads of Hermes', text: 'The building carries 44 engaged Corinthian columns, twelve on the Bowling Green front, and every capital carries a carved head of Hermes, the Greek god of commerce. It is the only major custom house in the city that does not face the water.', clue: 'Climb the steps and look up at a capital.', source: chW }, { r: 1.8 });
    k.egg(v(0, 6.2, RZ), { id: 'customhouse-skylight', title: 'A 140 ton skylight', text: 'The elliptical rotunda measures 85 by 135 feet and rises to the third storey. Its ceiling is built on the Guastavino tile arch system, with a 140 ton oval skylight at the centre.', clue: 'Stand in the middle of the rotunda and look straight up.', source: chW }, { r: 1.8 });
    { const a = PI / 8 + PI, x = Math.cos(a) * (RA - 1.6), z = RZ + Math.sin(a) * (RB - 1.6); k.egg(v(x, 5.6, z), { id: 'customhouse-marsh', title: 'Reginald Marsh\'s harbour', year: '1937', text: 'Reginald Marsh and eight assistants painted the rotunda murals in fresco secco in 1937 for the Treasury Relief Art Project, finishing by February 1938. The large panels show shipping in the Port of New York, the small ones the explorers.', clue: 'Look up at the paintings round the top of the rotunda wall.', source: chW }, { r: 1.6 }); }
    k.egg(v(0, 1.4, 66), { id: 'customhouse-fort-amsterdam', title: 'Fort Amsterdam', text: 'The custom house stands on the site of Fort Amsterdam, built by the Dutch West India Company. Bowling Green, just to the north, is the oldest park in New York City.', clue: 'Walk out to the fountain in Bowling Green and turn round.', source: chW }, { r: 1.8 });
    // the works: the rotunda wall between the murals, the lobby walls, the facade bays
    const mounts: Mount[] = [];
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; if (Math.abs(a - PI / 2) < 0.2) continue; const x = Math.cos(a) * (RA - 0.5), z = RZ + Math.sin(a) * (RB - 0.5); mounts.push({ position: v(x, 8.2, z), rotation: -a + PI / 2 + PI, target: v(0, 7, RZ), width: 4.4, height: 3.2, style: 'gilt', wash: true }); }
    for (let i = 0; i < 3; i++) { const z = FZ - 6 - i * 6; mounts.push({ position: v(11.66, 7.6, z), rotation: -PI / 2, target: v(z < -5 ? 4 : 2.5, 6.5, z), width: 4.4, height: 2.6, style: 'gilt', wash: true }); }
    for (const x of [-35, -7, 7, 35]) mounts.push({ position: v(x, 12, FZ + 0.42), rotation: 0, target: v(Math.max(-21, Math.min(21, x)), 7, FZ + 16), width: 4.6, height: 3.2, style: 'gilt', wash: false });
    return { mounts, spawn: v(0, 3, 46), look: v(0, 18, FZ), eye: 3, bounds: [-23, 23, RZ - RB + 1.5, 54], style: 'gilt', floorY: (x, z) => { void x; if (z > FZ + 1.5 && z < FZ + 21) return Math.min(4.1, ((FZ + 21 - z) / 19.5) * 4.1); if (z <= FZ + 1.5) return 4.15; return 0; } };
  },
};
