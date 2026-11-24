/* Rooms 82 to 86: the Met's Great Hall, the American Wing court, the European paintings suite, the Hall of Ocean Life, the Rose Center.
   Fifth set: the institutions. Museum light, the institution kit from Blender, the MLow and Blossom brand layer, every room fresh. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront } from './f';
import { mlowBanner, blossomFlag, donorWall, eyeMedallion, wordmarkRelief, eyeMonument, INK, CLOUD, ELECTRIC } from './brand';
import { hsign, paintTex, anamorphTex } from './f';
import { hero, heroInstances } from './heroes';
import { fireflyPlate } from './a';
import type { Kit } from '../kit';

const PI = Math.PI;

/* ---------- THE BIG UPGRADE, wave 5a (2026-11-24): helpers for rooms 82 to 86 ----------
   Scanned CC0 surfaces (Poly Haven, assets/museum/tex/<room>/) that wear a sensible colour until all their maps land,
   real CC0 models from assets/museum/props/<room>/ placed many at once (tilted, for the flower bursts), canvas painted
   surfaces that redraw when the house fonts arrive. Safe in node: the audit builds these rooms with no DOM, so a scan
   falls back to its painted surface, no canvas is touched and the loaders never resolve. */
const HAS_DOM = typeof window !== 'undefined' && typeof document !== 'undefined' && typeof HTMLImageElement !== 'undefined';
const texL = HAS_DOM ? new T.TextureLoader() : null;
const w5 = new Map<string, { s: X.Surface; ready: Promise<unknown> }>();
function sc(k: Kit, room: string, id: string, metres: number, paint: () => X.Surface, p: Partial<T.MeshStandardMaterialParameters> & { normal?: number } = {}, wait = 0x888888) {
  if (!texL) return k.pbr(`w5a-${room}-${id}`, paint(), 1 / metres, p);
  let e = w5.get(`${room}/${id}`);
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
    w5.set(`${room}/${id}`, e);
  }
  k.pending.push(e.ready);
  const m = k.pbr(`w5a-${room}-${id}`, e.s, 1 / metres, p);
  if (!m.userData.w5a) {
    /* an unloaded roughness map samples as 0, a mirror: every map waits for all three, and the surface wears `wait`
       (about 40 percent of its own colour) so a phone never sees white walls while the scan is on its way */
    m.userData.w5a = true;
    const maps = { map: m.map, normalMap: m.normalMap, roughnessMap: m.roughnessMap }, tint = m.color.clone();
    m.map = m.normalMap = m.roughnessMap = null;
    m.color.set(wait);
    void e.ready.then(() => { Object.assign(m, maps); m.color.copy(tint); m.needsUpdate = true; });
  }
  return m;
}
/* A real model fitted once and set at every [x, y, z, rotY, scale?, tiltX?]; tiltX leans it about its own x after the
   turn, so a ring of blooms can fan out from a vase. Seven or more become instanced parts (no shadows); `tweak` runs
   once on the loaded model; `then` gets the placed copies when there are six or fewer. */
function many(k: Kit, name: string, fit: Parameters<typeof hero>[2], at: number[][], tweak?: (o: T.Object3D) => void, then?: (os: T.Object3D[]) => void) {
  if (!at.length) return;
  void hero(k, name, fit).then((h) => {
    if (!h || !k.live) return;
    if (tweak) tweak(h);
    if (at.length > 6) {
      h.traverse((c) => { c.castShadow = false; });
      const ins = heroInstances(k, h, at.length), m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(0, 0, 0, 'YXZ');
      at.forEach(([x, y, z, r, s = 1, tx = 0], i) => ins.setAt(i, m.compose(new T.Vector3(x, y, z), q.setFromEuler(e.set(tx, r, 0, 'YXZ')), new T.Vector3(s, s, s))));
      ins.commit();
      return;
    }
    const os = at.map(([x, y, z, r, s = 1, tx = 0], i) => { const c = i ? h.clone() : h; c.position.set(x, y, z); c.rotation.set(tx, r, 0, 'YXZ'); c.scale.setScalar(s); k.add(c); return c; });
    then?.(os);
  });
}
/* Recolour every material of a loaded model: `keepMap` multiplies the scan's own colour map by the tint (a marble
   figure cast in bronze keeps its carving and its grime), otherwise the tint replaces it. Normal maps stay. */
function recolour(o: T.Object3D, hex: number, rough = 0.8, metal = 0, keepMap = false) {
  const cache = new Map<T.Material, T.Material>();
  o.traverse((c) => { if (!(c instanceof T.Mesh)) return; const src = c.material as T.MeshStandardMaterial; let m = cache.get(src); if (!m) { const n = src.clone(); n.color.setHex(hex); if (!keepMap) n.map = null; n.roughness = rough; n.roughnessMap = keepMap ? n.roughnessMap : null; n.metalness = metal; n.metalnessMap = null; m = n; cache.set(src, m); } c.material = m; });
}
/* Painted lettering for an anamorphic floor piece, in a house font; `colors` paints each letter in turn. Null in node. */
function floorType(text: string, colors: string[], w = 1024, h = 256, font = 'W2 Archivo Expanded') {
  if (!HAS_DOM) return null;
  return paintTex(w, h, (g) => {
    g.textBaseline = 'middle';
    let s = h * 0.8; g.font = `800 ${s}px "${font}", Arial, sans-serif`;
    let tw = g.measureText(text).width; if (tw > w * 0.94) { s *= (w * 0.94) / tw; g.font = `800 ${s}px "${font}", Arial, sans-serif`; tw = g.measureText(text).width; }
    let x = (w - tw) / 2, n = 0;
    for (const ch of text) { g.fillStyle = colors[n++ % colors.length]; g.fillText(ch, x, h / 2); x += g.measureText(ch).width; if (ch === ' ') n--; }
  }, [font]);
}
/* A canvas texture painted once (and again when the fonts land); null in node. */
const w5Tex = new Map<string, T.CanvasTexture>();
function canvas(key: string, W: number, H: number, draw: (g: CanvasRenderingContext2D, W: number, H: number) => void, fonts: string[] = [], repeat = false) {
  if (!HAS_DOM) return null;
  let t = w5Tex.get(key);
  if (!t) { t = paintTex(W, H, (g) => draw(g, W, H), fonts); if (repeat) t.wrapS = t.wrapT = T.RepeatWrapping; w5Tex.set(key, t); }
  return t;
}
/* A flat wall of `w` by `h` (local x along the wall, y up) with rectangular holes [cx, cy, hw, hh] cut through it,
   `depth` thick, turned by rotY and set with its back face at (x, y, z). For walls with real recesses in them. */
function holedWall(k: Kit, w: number, h: number, depth: number, holes: number[][], m: T.Material, x: number, y: number, z: number, rotY: number) {
  const s = new T.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.closePath();
  for (const [cx, cy, hw, hh] of holes) { const p = new T.Path(); p.moveTo(cx - hw, cy - hh); p.lineTo(cx - hw, cy + hh); p.lineTo(cx + hw, cy + hh); p.lineTo(cx + hw, cy - hh); p.closePath(); s.holes.push(p); }
  const o = k.mesh(new T.ExtrudeGeometry(s, { depth, bevelEnabled: false }), m, x, y, z);
  o.rotation.y = rotY;
  return o;
}

/* ---------------- 82 THE GREAT HALL ---------------- */
export const metgreathall: RoomDef = {
  id: 'metgreathall',
  name: 'The Great Hall',
  area: 'THE MET',
  mood: 'Saturday at opening',
  color: '#d8c8a8',
  description: 'Fifth Avenue steps under the MLow banners, then the Great Hall: three domes on their arches, the flower urns, the grand staircase rising to the paintings, the works on the limestone.',
  signatures: 'The Beaux Arts facade with its paired columns and the banners between them, the broad steps and fountains, the vaulted Great Hall with three saucer domes and oculi, the information desk and the five great flower arrangements, the grand staircase.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad8, horizon: 0xeef0ec, ground: 0x6a6a66, fog: 0.0018, sun: { az: 2.9, el: 0.8, color: 0xfff6e8, size: 12 }, env: 1.0 });
    k.hemi(0xf2f6ff, 0x5a5a58, 0.9);
    k.sun(0xfff2dc, 2.4, 40, 80, 40, true, 120);
    /* 2026-11-24 (wave 5a): every big surface is a scan (Poly Haven, CC0): Indiana limestone as a pale Caen stone, the
       hall floor as grey and white marble slabs, the domes as hand floated plaster, the stair as veined marble, the
       plaza as granite setts. Each wears about 40 percent of its own colour until its maps arrive. */
    const R = 'metgreathall';
    const lime = sc(k, R, 'marble_01', 6, () => X.ashlar(0xd8d0bc, 251, 4), { color: 0xfaf4ea, roughness: 0.8 }, 0x8a8272),
      limeD = sc(k, R, 'marble_01', 3, () => X.ashlar(0xc0b8a4, 252, 3), { color: 0xe4dccc, roughness: 0.8 }, 0x7a7262),
      floorM = sc(k, R, 'floor_tiles_02', 4.8, () => X.terrazzo(0xc8c0b0, 117), { color: 0xf2f0ec, roughness: 0.3 }, 0x7a7670),
      plaster = sc(k, R, 'white_plaster_02', 3, () => X.plaster(0xe8e2d4, 118), { color: 0xf4eee2, side: T.BackSide, roughness: 0.9 }, 0x908a80),
      plasterF = sc(k, R, 'white_plaster_02', 3, () => X.plaster(0xe8e2d4, 118), { color: 0xf0e8da, roughness: 0.9 }, 0x908a80),
      marbleS = sc(k, R, 'floor_tiles_02', 2.4, () => X.marble(0xe0dcd2, 0xa09a90, 16), { color: 0xf4f2ee, roughness: 0.3 }, 0x8a8680),
      bronze = k.flat(0x4a3a28, 0.8, 0.4),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      waterM = k.flat(0x88aacc, 0.3, 0.2, { transparent: true, opacity: 0.6 });
    // Fifth Avenue, the plaza with its fountains, the facade with paired columns and the banners
    street(k, { w: 26, len: 200, z: 44, x: 0 });
    blockFront(k, { x: 60, z0: 130, count: 14, face: -1, seed: 253, h: [20, 40] });
    k.box(120, 0.3, 30, 0, 0.05, 26, sc(k, R, 'large_floor_tiles_02', 5, () => X.pavers(0x9a9a94, 119), { color: 0xd8d6d0, roughness: 0.75 }, 0x5a5a56));
    for (const x of [-38, 38]) { k.mesh(new T.CylinderGeometry(6, 6.4, 0.8, 32), lime, x, 0.4, 28); k.mesh(new T.CylinderGeometry(5.4, 5.4, 0.3, 32), waterM, x, 0.85, 28); k.keepOut.push({ x, z: 28, r: 6.6 }); const jets: T.Mesh[] = []; for (let i = 0; i < 10; i++) { const a = (i / 10) * PI * 2; jets.push(k.mesh(new T.CylinderGeometry(0.05, 0.14, 3, 6), waterM, x + Math.cos(a) * 3, 2.4, 28 + Math.sin(a) * 3, true)); } if (!ctx.reduced) k.ticks.push((t) => jets.forEach((j, i) => { j.scale.y = 0.6 + 0.4 * Math.sin(t * 1.4 + i); })); }
    /* David H. Koch Plaza (2014): allees of London plane and littleleaf linden either side of the steps */
    for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) { const x = sx * (44 + i * 4.5); k.tree(x, 0.2, 36.5, { species: 'plane', h: 10, r: 3.2, seed: 300 + i + (sx > 0 ? 10 : 0) }); k.tree(x + sx * 2.2, 0.2, 40.5, { species: 'linden', h: 9, r: 3, seed: 320 + i + (sx > 0 ? 10 : 0) }); }
    const FZ = 10, FW = 110, FH = 26;
    // Exterior wings enclose the hall without filling its navigable interior.
    for (const side of [-1, 1]) k.box(20, FH, 60, side * 45, FH / 2, FZ - 30, lime);
    for (const side of [-1, 1]) k.box(32, FH, 0.8, side * 19, FH / 2, FZ, lime);
    k.box(6, 10, 0.8, 0, 21, FZ, lime);
    /* the crowning cornice: k.moulding extrudes along z, so unturned it ran 110 m straight out across the plaza from the
       middle of the front. Turned a quarter, it runs along the facade and projects toward the avenue. */
    k.moulding([[0, 0], [1.2, 0], [1.3, 0.4], [0.8, 0.6], [1.0, 1.0], [0, 1.2]], FW + 0.4, 0, FH - 0.6, FZ + 0.05, limeD, -PI / 2);
    /* The entrance stair. These twelve treads used to run the other way: step 0
       sat at z = FZ + 2, hard against the building, and each one after it was
       both higher and further out, so the flight climbed away from the door
       while floorY climbed toward it. You walked up an invisible ramp with the
       visible steps descending beside you. Highest tread at the top of the
       plaza now, lowest out at the kerb, which is the way floorY reads it. */
    for (let i = 0; i < 12; i++) k.box(FW + 4, 0.34, 1.6, 0, 0.17 + i * 0.34, FZ + 19.4 - i * 1.6, lime);
    /* Hunt's front: four pairs of Corinthian columns, each pair framing a sculpture niche (the
       facade works below hang in those niches), each pair carrying a projecting entablature with a
       pile of uncarved stone on top, the sculpture groups that were never paid for. */
    const NICHES = [-26, -8.7, 8.6, 25.9];
    for (const nx of NICHES) {
      for (const d of [-3.5, 3.5]) { k.column(nx + d, 4, FZ + 1.4, 16, 1.1, lime, true); k.prop('corinthian_capital', nx + d, 20, FZ + 1.4, { height: 2.2 }); }
      k.box(10, 3.2, 3.4, nx, 23.6, FZ + 1.5, lime);
      k.box(4.4, 1.6, 2.6, nx, 26.0, FZ + 1.5, limeD); k.box(3.2, 1.4, 2.2, nx - 0.4, 27.5, FZ + 1.4, limeD); k.box(1.8, 1.2, 1.6, nx + 0.5, 28.8, FZ + 1.6, limeD);
    }
    k.egg(v(-8.7, 27, FZ + 1.5), { id: 'metgreathall-blocks', title: 'The sculpture nobody paid for', text: 'The rough piles of stone on top of the paired columns were meant to be carved. Richard Morris Hunt planned sculpture groups for four great periods of art, Egyptian, Greek, Renaissance and Modern, but the money ran out and the blocks were left uncarved. They have since become an accepted part of the facade.', clue: 'Look up above the columns, at the stone that was never finished.', source: { name: 'Top Secrets of the Metropolitan Museum of Art, Untapped New York', url: 'https://untappedcities.com/2022/11/02/top-secrets-metropolitan-museum-of-art/4/' } }, { r: 1.8 });
    k.egg(v(-29.5, 5.6, FZ + 2.6), { id: 'metgreathall-niches', title: 'Empty for 117 years', year: '2019', text: 'The niches between the paired columns were always meant to hold sculpture, and they stayed empty from the facade\'s completion in 1902 until September 2019, when Wangechi Mutu installed four bronzes, The Seated I, II, III and IV. It was the first art ever shown in them.', clue: 'Check the niches between each pair of columns on the facade.', source: { name: 'New Sculptures Fill Spaces in Met Museum Facade Left Empty for 117 Years, Untapped New York', url: 'https://untappedcities.com/2019/09/11/new-sculptures-fill-spaces-in-met-museum-facade-left-empty-for-117-years/' } }, { r: 1.6 });
    k.egg(v(-38, 2.2, 28), { id: 'metgreathall-plaza', title: 'Fountains that run on steam', year: '2014', text: 'The David H. Koch Plaza, a $65 million rebuild of the four block plaza, was dedicated on 9 September 2014. Its two granite fountains are warmed by recycled steam so they can run all year, and the plaza now has 106 trees, London planes and littleleaf lindens, about double the number before.', clue: 'Walk out to the fountains at the foot of the steps.', source: { name: 'The Met Museum Officially Opens Its Newly Renovated $65 Million Plaza, 6sqft', url: 'https://www.6sqft.com/?p=157927' } }, { r: 1.8 });
    for (const x of [-18, 0, 18]) { k.arch(6, 12, 4, x, 4, FZ + 0.4, limeD, false, 0.82); k.box(5.2, 9.6, 0.2, x, 9.6, FZ + 0.6, k.glass(0xdcecf6, 0.14, 0.04)); }
    k.block(-FW / 2, -3, FZ - 0.5, FZ + 1); k.block(3, FW / 2, FZ - 0.5, FZ + 1);
    k.box(6.4, 0.3, 6, 0, 4.05, FZ + 3, lime);
    // the brand layer on the facade: banners between the columns, the MLow banner centre, Blossom flags either side
    mlowBanner(k, 0, 13, FZ + 2.6, 0, 4.6, true);
    blossomFlag(k, -18, 13, FZ + 2.6, 0, 3.4, 5, 'electric');
    blossomFlag(k, 18, 13, FZ + 2.6, 0, 3.4, 1, 'ink');
    k.sign('THE MUSEUM  ·  THE NEW YORKERS  ·  THROUGH THE WINTER', 20, 1.0, 0, 24.2, FZ + 1.6, 'transparent', '#3a3020', 80, 0);
    // the Great Hall: a long room with three saucer domes on arches, the oculi, the desk, the urns of flowers
    const HW = 70, HD = 30, HH = 22, HZ = FZ - HD / 2 - 1;
    k.box(HW, 0.3, HD, 0, 4.15, HZ, floorM);
    for (const s of [-1, 1]) { k.box(0.8, HH, HD, s * HW / 2, 4 + HH / 2, HZ, lime); k.block(s * HW / 2 - 0.7, s * HW / 2 + 0.7, HZ - HD / 2, HZ + HD / 2); }
    // A real opening onto the stair instead of a solid wall behind the arch.
    for (const side of [-1, 1]) k.box(27, HH, 0.8, side * 21.5, 4 + HH / 2, HZ - HD / 2, lime);
    k.box(16, 8, 0.8, 0, 22, HZ - HD / 2, lime);
    k.block(-HW / 2, -3, HZ - HD / 2 - 0.6, HZ - HD / 2 + 0.6); k.block(3, HW / 2, HZ - HD / 2 - 0.6, HZ - HD / 2 + 0.6);
    /* 2026-11-24 (wave 5a): the ceiling is built. The three saucer domes used to hang 4 m below the roof slab with
       nothing between them and the walls, so the black slab showed all round each dome. Now a plaster ceiling closes
       the hall at the wall head with three round openings, each dome springs from a moulded ring, and each crown is
       cut open into a real oculus with its ring and a lit laylight above (a Firefly plate, FIREFLY_QUEUE.md). */
    const CY = 4 + HH;
    { const s = new T.Shape(); s.moveTo(-HW / 2 - 1, -HD / 2 - 1); s.lineTo(HW / 2 + 1, -HD / 2 - 1); s.lineTo(HW / 2 + 1, HD / 2 + 1); s.lineTo(-HW / 2 - 1, HD / 2 + 1); s.closePath();
      for (const dx of [-23, 0, 23]) { const h = new T.Path(); h.absarc(dx, 0, 10.6, 0, PI * 2, true); s.holes.push(h); }
      const cg = new T.ExtrudeGeometry(s, { depth: 0.8, bevelEnabled: false, curveSegments: 48 }); cg.rotateX(-PI / 2);
      k.mesh(cg, plasterF, 0, CY, HZ); }
    k.box(HW + 2, 0.6, HD + 2, 0, CY + 6, HZ, dark);
    /* a running cornice under the ceiling round all four walls, turned so each projects into the hall */
    const corn: [number, number][] = [[0, 0], [0.5, 0], [0.62, 0.22], [0.42, 0.36], [0.7, 0.7], [0.7, 0.9], [0, 0.9]];
    for (const s of [-1, 1]) { k.moulding(corn, HD, s * (HW / 2 - 0.4), CY - 0.9, HZ, limeD, s > 0 ? PI : 0); k.moulding(corn, HW, 0, CY - 0.9, HZ + s * (HD / 2 - 0.4), limeD, s > 0 ? PI / 2 : -PI / 2); }
    for (const dx of [-23, 0, 23]) {
      const dome = k.mesh(new T.SphereGeometry(10.8, 48, 14, 0, PI * 2, 0.2, PI / 2 - 0.2), plaster, dx, CY + 0.4, HZ); dome.scale.y = 0.42;
      const top = CY + 0.4 + 10.8 * Math.cos(0.2) * 0.42;
      k.torus(10.7, 0.32, dx, CY + 0.82, HZ, limeD, 64).rotation.x = PI / 2;
      k.torus(10.2, 0.14, dx, CY + 1.9, HZ, limeD, 64).rotation.x = PI / 2;
      k.torus(2.2, 0.28, dx, top - 0.05, HZ, limeD, 32).rotation.x = PI / 2;
      fireflyPlate(k, 'assets/museum/tex/metgreathall/ff_oculus_laylight.webp', 4.6, 4.6, dx, top + 0.3, HZ, 0, k.glow(0xfff4e0, 0.95), true).rotation.x = PI / 2;
      /* sixteen shallow ribs run up each dome from the spring ring to the oculus */
      for (let r = 0; r < 16; r++) { const a = (r / 16) * PI * 2, pts: T.Vector3[] = []; for (let j = 0; j <= 10; j++) { const th = 0.21 + (j / 10) * (PI / 2 - 0.23); pts.push(v(dx + Math.cos(a) * 10.72 * Math.sin(th), CY + 0.4 + 10.72 * Math.cos(th) * 0.42, HZ + Math.sin(a) * 10.72 * Math.sin(th))); } k.curve(pts, 0.09, limeD, 20); }
      k.point(dx, 4 + HH - 6, HZ, 0xfff4e6, 90, 40);
      for (const s of [-1, 1]) { k.arch(10, 14, 1.6, dx, 4, HZ + s * (HD / 2 - 0.8), limeD, false, 0.8); }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { k.column(dx + sx * 9.5, 4.3, HZ + sz * 11.5, 12, 0.9, lime, true); k.prop('corinthian_capital', dx + sx * 9.5, 16.3, HZ + sz * 11.5, { height: 1.8 }); k.keepOut.push({ x: dx + sx * 9.5, z: HZ + sz * 11.5, r: 1.2 }); }
      /* the side bays: a round limestone pedestal with a real glazed vase (CC0 scan) and a Wallace burst of blooms */
      if (dx !== 0) { k.cyl(0.95, 1.1, dx, 4.85, HZ, lime, 1.05, 32); k.torus(1.0, 0.08, dx, 5.4, HZ, limeD, 32).rotation.x = PI / 2; k.keepOut.push({ x: dx, z: HZ, r: 1.3 }); }
    }
    /* the round information desk stands in the middle of the hall, under the centre dome, with the
       biggest of the Wallace flower arrangements rising out of it */
    k.mesh(new T.CylinderGeometry(4, 4, 1.1, 48, 1, true), sc(k, R, 'dark_wood', 1.2, () => X.planks(0x4a2e1c, 5, 254), { color: 0x8a5a3a, roughness: 0.45 }, 0x3a2a1e), 0, 4.7, HZ);
    k.torus(4.05, 0.05, 0, 5.05, HZ, k.flat(0xc9a552, 0.9, 0.3), 64).rotation.x = PI / 2;
    const deskTop = k.mesh(new T.CylinderGeometry(4.2, 4.2, 0.1, 48), marbleS, 0, 5.3, HZ); k.keepOut.push({ x: 0, z: HZ, r: 4.5 });
    const deskVase = k.mesh(new T.CylinderGeometry(0.5, 0.4, 0.5, 20), bronze, 0, 5.6, HZ); void deskTop;
    /* INFORMATION lettered round the desk front, four times, gold on the dark wood */
    for (let i = 0; i < 4; i++) { const a = (i / 4) * PI * 2 + PI / 4; hsign(k, 'INFORMATION', 2.2, 0.3, Math.sin(a) * 4.03, 4.82, HZ + Math.cos(a) * 4.03, a, { fg: '#d8b46a', size: 0.62 }); }
    /* The Wallace arrangements, real flowers now: CC0 scans of gazania and ursinia clumps (Poly Haven) blown up and
       fanned out round a brass vase on the desk and a glazed vase on each side pedestal, a ball of blooms two metres
       across where there were coloured spheres in a bowl. 33 blooms, instanced, no shadows. */
    { const gz: number[][] = [], ur: number[][] = [];
      const burst = (cx: number, cy: number, cz: number, n: number, r: number, size: number) => {
        (n > 7 ? ur : gz).push([cx, cy + 0.05, cz, 0, size * 1.05, 0]);
        for (let ring = 0; ring < 2; ring++) { const m = ring ? n - 1 - Math.floor((n - 1) / 2) : Math.floor((n - 1) / 2); for (let i = 0; i < m; i++) { const a = (i / m) * PI * 2 + ring * 0.6, tilt = ring ? 1.15 : 0.62; (i % 2 === ring % 2 ? gz : ur).push([cx + Math.cos(a) * r * (ring ? 1 : 0.55), cy - (ring ? 0.25 : 0), cz + Math.sin(a) * r * (ring ? 1 : 0.55), PI / 2 - a, size, tilt]); } }
      };
      burst(0, 7.0, HZ, 11, 0.85, 1.7);
      for (const dx of [-23, 23]) burst(dx, 6.8, HZ, 11, 0.7, 1.45);
      many(k, 'metgreathall/ph_flower_gazania', { width: 1 }, gz);
      many(k, 'metgreathall/ph_flower_ursinia', { width: 1 }, ur);
      many(k, 'metgreathall/ph_brass_vase_01', { height: 1.7 }, [[0, 5.35, HZ, 0]]);
      many(k, 'metgreathall/ph_ceramic_vase_03', { height: 1.45 }, [[-23, 5.4, HZ, 0], [23, 5.4, HZ, 0.8]]); }
    k.egg(deskVase, { id: 'metgreathall-flowers', title: 'Flowers every Wednesday', text: 'The starburst arrangements in the Great Hall are paid for by an endowment Lila Acheson Wallace, the co founder of Reader\'s Digest, set up in the late 1960s. The flowers are replaced every Wednesday, with seasonal blooms chosen to last the whole week, on the desk and at both ends of the hall.', clue: 'Look at the flowers rising out of the round information desk.', source: { name: 'A Bouquet for the Ages, The Wallace Foundation', url: 'https://wallacefoundation.org/resource/article/bouquet-ages-gift-continues-bloom' } }, { r: 1.6 });
    eyeMedallion(k, 0, 4.16, HZ + 8, 2.6);
    donorWall(k, 0, 9.4, HZ - HD / 2 + 0.42, 0, 12, false);
    // the grand staircase: rising from the hall's north end through the arch, MLow wordmark relief above
    const SZ = HZ - HD / 2;
    k.egg(v(23, 5.6, HZ), { id: 'metgreathall-accretion', title: 'Twenty buildings in one', text: 'The Met on Fifth Avenue is almost a quarter mile long, with more than two million square feet of floor space, over twenty times the size of the 1880 building. It is an accretion of over twenty structures, most of them invisible from outside, and the first of them, a red brick and stone building by Calvert Vaux and Jacob Wrey Mould, is still in there, swallowed by the rest.', clue: 'Stand under the east dome and think about what is behind the walls.', source: { name: 'Metropolitan Museum of Art, Wikipedia', url: 'https://en.wikipedia.org/wiki/Metropolitan_Museum_of_Art' } }, { r: 1.6 });
    k.egg(v(0, 6.2, SZ - 4), { id: 'metgreathall-hunts', title: 'Father and son', year: '1902', text: 'Richard Morris Hunt, an architect and a museum trustee, designed the Fifth Avenue facade, the Great Hall and the Grand Stairway, but he died before construction began. His son Richard Howland Hunt finished the work, following almost all of his father\'s plans. The building became a city landmark in 1967, its interior followed in 1977, and it was made a National Historic Landmark in 1986.', clue: 'Climb the first steps of the grand staircase.', source: { name: 'Metropolitan Museum of Art, Wikipedia', url: 'https://en.wikipedia.org/wiki/Metropolitan_Museum_of_Art' } }, { r: 1.6 });
    for (let i = 0; i < 26; i++) k.box(14, 0.34, 1.0, 0, 4.17 + i * 0.34, SZ - 1 - i * 1.0, marbleS);
    for (const s of [-1, 1]) k.prop('balustrade', s * 7.4, 4.2, SZ - 14, { height: 1.1, rotY: PI / 2 });
    for (const s of [-1, 1]) k.prop('newel_urn', s * 7.4, 4.2, SZ - 1.5, { height: 2.2 });
    k.box(24, 0.4, 14, 0, 13, SZ - 33, marbleS);
    k.box(30, 20, 1, 0, 23, SZ - 40, lime);
    for (const side of [-1, 1]) k.box(0.8, 24, 40, side * 15, 16, SZ - 20, lime);
    k.box(30, 0.6, 40, 0, 28.3, SZ - 20, plaster);
    k.block(-15, 15, SZ - 40.6, SZ - 39.4);
    k.block(-HW / 2, -7.6, SZ - 40, SZ); k.block(7.6, HW / 2, SZ - 40, SZ);
    k.point(0, 20, SZ - 30, 0xfff4e6, 60, 40);
    for (let i = 0; i < 4; i++) k.prop('rope_stanchion', -9 + i * 6, 4.15, HZ + 12, { height: 1.0 });
    for (const x of [-30, 30]) for (const dz of [-8, 8]) k.prop('quiet_bench', x, 4.3, HZ + dz, { height: 0.8, rotY: PI / 2, keepOut: 1.4 });
    k.crowd([v(0, 0, 40), v(0, 0, FZ + 14), v(0, 4.15, FZ - 4), v(-10, 4.15, HZ), v(10, 4.15, HZ - 10), v(0, 4.15, SZ - 2)], ctx.quality === 'low' ? 8 : 16, { seed: 110, speed: 0.5, spread: 3, animate: !ctx.reduced, colors: [0x24262c, 0x8a3a3a, 0x33477f, 0xd8d0c0, 0x151517, 0xc9a25a, 0xe6e2da] });
    /* wayfinding as the Met does it: bronze totems at the foot of the stair and in the side bays, lettered in the
       house type, pointing to the wings that really open off this hall */
    const totem = (x: number, z: number, rot: number, a: string, b: string) => {
      k.box(1.3, 2.5, 0.14, x, 4.3 + 1.25, z, k.flat(0x2a241e, 0.7, 0.45)).rotation.y = rot;
      for (const f of [0, PI]) { const r = rot + f, nx = Math.sin(r) * 0.075, nz = Math.cos(r) * 0.075; hsign(k, a, 1.16, 0.34, x + nx, 6.3, z + nz, r, { fg: '#f4ead8', size: 0.6 }); hsign(k, b, 1.16, 0.22, x + nx, 5.92, z + nz, r, { fg: '#c9a552', font: 'W2 JetBrains Mono', size: 0.5 }); }
      k.keepOut.push({ x, z, r: 0.8 });
    };
    totem(-5.2, SZ + 3.2, 0, 'EUROPEAN PAINTINGS', 'UP THE GRAND STAIRCASE');
    totem(5.2, SZ + 3.2, 0, 'THE NEW YORKERS', 'SECOND FLOOR  GALLERIES 600');
    totem(-31, HZ + 3, PI / 2, 'EGYPTIAN ART', 'NORTH WING  TEMPLE OF DENDUR');
    totem(31, HZ + 3, -PI / 2, 'GREEK AND ROMAN ART', 'SOUTH WING');
    /* the illusion (one trick a room): THE GREAT HALL is painted flat across the marble, stretched toward the west bay,
       so that from where you arrive it stands up off the floor like a sign. Walk onto it and it falls back into long
       smears of ink and gold. */
    { const t = floorType('THE GREAT HALL', ['#1a1c20', '#a8802e']); if (t) anamorphTex(k, t, 15, HZ + 9, 7.15, 4.3, 1.35, 8.5, 6.4, 1.2, 0.82); }
    k.egg(v(9.4, 4.9, HZ + 7.7), { id: 'metgreathall-anamorph', title: 'A sign that is not there', text: 'THE GREAT HALL is painted flat on the marble, stretched toward the west, so that from the spot where you arrive it stands up off the floor like a sign. Walk onto it and it falls back into long smears of ink and gold. The trick is anamorphosis, the same one that hides a skull across the floor of Hans Holbein\'s The Ambassadors of 1533.', clue: 'Go back to where you came in and look along the floor to the west.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.6 });
    // Hang on unobstructed side walls, between the column lines. Inspection
    // positions remain inside the room and clear of desks, urns and benches.
    const mounts: Mount[] = [];
    for (const side of [-1, 1]) for (const z of [HZ - 7, HZ, HZ + 7]) {
      mounts.push({ position: v(side * (HW / 2 - 0.85), 8.4, z), rotation: side < 0 ? PI / 2 : -PI / 2,
        target: v(side * (HW / 2 - 7), 7.15, z), width: 5.2, height: 3.2, style: 'gilt', wash: true });
    }
    /* The three over the stair landing. The flight is walled in to |x| < 7.6, so
       the outer two used to send the visitor straight out through the wall beside
       the stair. They stand you a little off axis on the steps instead. */
    for (let i = 0; i < 3; i++) { const x = -8 + i * 8; mounts.push({ position: v(x, 19.5 + (i === 1 ? 4 : 0), SZ - 39.42), rotation: 0, target: v(Math.max(-5.5, Math.min(5.5, x)), 14, SZ - 28), width: 5.6, height: 3.4, style: 'gilt', wash: true }); }
    for (let i = 0; i < 4; i++) { const x = -26 + i * 17.3; if (Math.abs(x) < 6) continue; mounts.push({ position: v(x, 10, FZ + 0.42), rotation: 0, target: v(x, 6, FZ + 14), width: 4.6, height: 2.7, style: 'gilt', wash: false }); }
    return { mounts, spawn: v(15, 7.15, HZ + 9), look: v(-HW / 2 + 1, 8.4, HZ - 2), eye: 3,
      /* Stand off-centre and look along the hung wall, so the first frame holds
         paintings at a narrow phone FOV as well as a wide desktop one. */ bounds: [-HW / 2 + 1, HW / 2 - 1, SZ - 39, 50], style: 'gilt', floorY: (x, z) => { void x; if (z > FZ + 1.5 && z < FZ + 21) return Math.min(4.1, ((FZ + 21 - z) / 19.5) * 4.1); if (z <= FZ + 1.5 && z > SZ - 1) return 4.15; if (z <= SZ - 1 && z > SZ - 27) return 4.15 + Math.min(8.8, ((SZ - 1 - z) / 26) * 8.8); if (z <= SZ - 27) return 13.2; return 0; } };
  },
};

/* ---------------- 83 THE AMERICAN WING COURT ---------------- */
export const metamerican: RoomDef = {
  id: 'metamerican',
  name: 'The Engelhard Court',
  area: 'THE MET',
  mood: 'Winter light through the wall of glass',
  color: '#c8d8c8',
  description: 'The glass roofed court on the park side: a bank facade brought indoors, the Tiffany loggia, bronzes among the plantings, the balcony, the works around the marble floor.',
  signatures: 'The sloping glass wall onto the park, the neoclassical marble bank facade standing inside, the loggia of columns with its glass mosaic, the bronze figures and fountains, the mezzanine balcony with its balustrade.',
  build(k, ctx) {
    k.sky({ top: 0x8aa4c4, horizon: 0xc8d0d8, ground: 0x6a6a68, fog: 0.0009, sun: { az: 3.9, el: 0.5, color: 0xfff4e6, size: 12 }, haze: 0.25, env: 0.95 });
    k.hemi(0xeef4ff, 0x4a4a48, 0.9);
    k.sun(0xfff0dc, 2.2, -50, 60, 30, true, 90);
    /* 2026-11-24 (wave 5a): scans (Poly Haven, CC0): grey and white marble slabs on the court floor, the Westchester
       marble of the bank front and the limestone walls as dressed slabs, the park under real snow. */
    const R = 'metamerican';
    const marble = sc(k, R, 'marble_01', 3.2, () => X.marble(0xe0dcd2, 0x9a948a, 17), { color: 0xfbf8f2, roughness: 0.35 }, 0x8a8680),
      floorA = sc(k, R, 'floor_tiles_02', 4.8, () => X.marble(0xe0dcd2, 0x9a948a, 17), { color: 0xf2f0ec, roughness: 0.3 }, 0x7a7670),
      lime = sc(k, R, 'marble_01', 6, () => X.ashlar(0xd8d0bc, 255, 4), { color: 0xf0e8da, roughness: 0.8 }, 0x8a8272),
      glass = k.glass(0xe8f4f8, 0.1, 0.03), steel = k.flat(0x8c98a4, 0.9, 0.3),
      dark = k.flat(0x1a1c20, 0.5, 0.6), bronze = k.flat(0x3a3028, 0.7, 0.45),
      mosaic = k.pbr('awMosaic', X.gilt(0xc9a552), 1.2, { metalness: 0.7, roughness: 0.45 }),
      snow = sc(k, R, 'snow_02', 4, () => X.plaster(0xf4f4f8, 120), { color: 0xffffff, roughness: 0.7 }, 0xb0b4b8), lawnG = k.pbr('awLawn', X.grass(0x4a7a3a, 121), 0.06);
    // the park side under snow, bare trees, the glass wall of the court sloping over it
    k.box(300, 0.4, 200, 0, -0.2, -140, snow);
    const rnd = X.mulberry(83);
    for (let i = 0; i < 40; i++) k.tree((rnd() - 0.5) * 240, 0, -50 - rnd() * 120, { kind: 'bare', species: i % 3 === 2 ? 'oak' : 'elm', h: 8 + rnd() * 6, r: 3 + rnd() * 2, seed: i });
    /* 2026-11-24 (wave 5a): the glass wall looked onto a white void. Now the park's nearer trees crowd up to it and the
       towers of Fifth Avenue and Central Park South stand over the bare tree line, as they do from the real court. */
    for (let i = 0; i < 22; i++) k.tree(-60 + i * 5.6 + (rnd() - 0.5) * 3, 0, -30 - rnd() * 14, { kind: 'bare', species: i % 2 ? 'elm' : 'oak', h: 11 + rnd() * 5, r: 3.5 + rnd() * 2, seed: 60 + i });
    k.skyline({ z: -260, count: 40, spacing: 9, scale: 3.2, base: -6, seed: 83, lit: 0.12, glow: 0.3, tint: 0x9a9ca4, warm: false, rows: 2 });
    const CW = 56, CD = 44, CH = 20;
    k.box(CW, 0.4, CD, 0, -0.2, 0, floorA);
    for (const s of [-1, 1]) { k.box(0.8, CH, CD, s * CW / 2, CH / 2, 0, lime); k.block(s * CW / 2 - 0.7, s * CW / 2 + 0.7, -CD / 2, CD / 2); }
    k.box(CW, CH, 0.8, 0, CH / 2, CD / 2, lime); k.block(-CW / 2, -3, CD / 2 - 0.6, CD / 2 + 0.6); k.block(3, CW / 2, CD / 2 - 0.6, CD / 2 + 0.6);
    const gw = k.mesh(new T.PlaneGeometry(CW, CH + 4), glass, 0, CH / 2 - 0.6, -CD / 2 - 1.8); gw.rotation.x = -0.2;
    for (let x = -CW / 2; x <= CW / 2; x += 3.5) { const m = k.box(0.24, CH + 4, 0.24, x, CH / 2 - 0.6, -CD / 2 - 1.8, steel); m.rotation.x = -0.2; }
    k.block(-CW / 2, CW / 2, -CD / 2 - 3, -CD / 2 - 1.2);
    k.box(CW + 2, 0.4, CD + 2, 0, CH, 0, glass); for (let x = -CW / 2; x <= CW / 2; x += 3.5) k.box(0.2, 0.3, CD + 2, x, CH + 0.1, 0, steel);
    k.point(0, CH - 4, 0, 0xffffff, 60, 40);
    // the bank facade standing inside: a marble front with Ionic columns and a pediment, the door as a gallery entrance
    const BX = 0, BZ = CD / 2 - 0.4;
    k.box(30, 15, 1.2, BX, 7.5, BZ - 0.6, marble);
    for (let i = 0; i < 6; i++) { const x = BX - 10 + i * 4; k.column(x, 0.1, BZ - 2.4, 9.6, 0.7, marble, true); k.prop('ionic_capital', x, 9.7, BZ - 2.4, { height: 1.2 }); k.keepOut.push({ x, z: BZ - 2.4, r: 1 }); }
    k.box(30, 1.6, 3.6, BX, 11.6, BZ - 1.6, marble);
    const ped = new T.Shape(); ped.moveTo(-15, 0); ped.lineTo(15, 0); ped.lineTo(0, 4); ped.closePath();
    k.mesh(new T.ExtrudeGeometry(ped, { depth: 3.6, bevelEnabled: false }), marble, BX, 12.4, BZ - 3.4);
    k.arch(3, 6, 1.4, BX, 0, BZ - 0.6, lime, false, 0.85);
    k.block(BX - 15, BX - 1.6, BZ - 1.2, BZ + 0.2); k.block(BX + 1.6, BX + 15, BZ - 1.2, BZ + 0.2);
    wordmarkRelief(k, BX, 10.2, BZ - 1.22, 0, 5);
    k.egg(v(BX, 2.6, BZ - 2.2), { id: 'metamerican-bank', title: 'A bank on Wall Street', year: '1824', text: 'This marble front was the New York branch of the Bank of the United States at 15 Wall Street, finished in 1824 to a design by Martin Euclid Thompson, who was 28. An 1829 account calls it white marble from the quarries of Westchester. After Andrew Jackson abolished the Bank it became the United States Assay Office, and when the building was torn down Robert W. de Forest saved the facade for the Museum.', clue: 'Stand at the door in the middle of the bank front.', source: { name: 'Bank of the United States, 15 Wall Street, Archiseek', url: 'https://www.archiseek.com/?p=26255' } }, { r: 1.6 });
    /* Hunt's two bronze lampposts, made for the Museum's front entrance, now stand in this court */
    for (const s of [-1, 1]) k.lamp(BX + s * 12.5, BZ - 3.6, 4.6, bronze, 0xfff0d8, 18);
    k.egg(v(BX - 12.5, 2.4, BZ - 3.6), { id: 'metamerican-lamps', title: 'Lamps from the front door', text: 'The two bronze lampposts in this court were designed by Richard Morris Hunt for the Museum\'s entrance on Fifth Avenue. The bank facade behind them stood free, facing a garden, for about fifty years before the court was enclosed in 1980.', clue: 'Find the bronze lampposts either side of the bank front.', source: { name: 'Top Secrets of the Metropolitan Museum of Art, Untapped New York', url: 'https://untappedcities.com/2022/11/02/top-secrets-metropolitan-museum-of-art/4/' } }, { r: 1.4 });
    // the loggia on the east wall: columns with the mosaic behind, and the balcony above with balustrades
    /* Tiffany's loggia from Laurelton Hall has four columns, their capitals flowers of coloured glass and pottery */
    const floral = [k.flat(0xd89a2a, 0.1, 0.35, { emissive: 0x8a5a10, emissiveIntensity: 0.4 }), k.flat(0x2a7ab8, 0.1, 0.35, { emissive: 0x103a6a, emissiveIntensity: 0.4 }), k.flat(0x4a9a5a, 0.1, 0.4)];
    for (const z of [-14, -7, 7, 14]) { k.column(CW / 2 - 4, 0.1, z, 6, 0.5, lime, false); k.prop('corinthian_capital', CW / 2 - 4, 6.1, z, { height: 0.9 }); k.keepOut.push({ x: CW / 2 - 4, z, r: 0.8 }); for (let f = 0; f < 6; f++) { const a = (f / 6) * PI * 2; k.sphere(0.17, CW / 2 - 4 + Math.cos(a) * 0.55, 6.35, z + Math.sin(a) * 0.55, floral[f % 3], 8); } }
    k.egg(v(CW / 2 - 4, 3, 7), { id: 'metamerican-loggia', title: 'Saved from the fire', year: '1957', text: 'This loggia, four columns with floral capitals of coloured glass and pottery, comes from Laurelton Hall, the estate Louis Comfort Tiffany built between 1902 and 1905 on more than 600 acres over Long Island Sound. The house was destroyed by fire in 1957. Hugh and Jeannette McKean gave the loggia to the Museum, and it has stood in this court since 1980.', clue: 'Look at the flowers on top of the four columns along the east wall.', source: { name: 'Louis Comfort Tiffany and Laurelton Hall, Traditional Fine Arts Online', url: 'https://tfaoi.org/aa/6aa/6aa408.htm' } }, { r: 1.6 });
    k.box(0.3, 8, 30, CW / 2 - 0.55, 4, 0, mosaic);
    /* the glass mosaic behind the loggia as Tiffany made it, a Firefly plate (FIREFLY_QUEUE.md); gilt until it lands */
    fireflyPlate(k, 'assets/museum/tex/metamerican/ff_tiffany_mosaic.webp', 30, 8, CW / 2 - 0.705, 4, 0, -PI / 2, mosaic);
    k.box(6, 0.5, 30, CW / 2 - 3, 7.2, 0, lime);
    k.box(CW - 2, 0.4, 6, 0, 8.4, -CD / 2 + 4, marble); k.block(-CW / 2, CW / 2, -CD / 2 + 0.8, -CD / 2 + 7);
    for (let i = 0; i < 9; i++) k.prop('balustrade', -24 + i * 6, 8.6, -CD / 2 + 7.1, { height: 1.1 });
    for (let i = 0; i < 14; i++) k.box(3, 0.6, 1.0, -CW / 2 + 3, 0.3 + i * 0.6, -CD / 2 + 8 + i * 1.0, marble);
    // the bronzes and the plantings, the fountain, benches, the crowd
    /* 2026-11-24 (wave 5a): the bronzes are real carved and cast figures now, CC0 scans (Poly Haven) on granite plinths
       in place of the kit's code built stand ins: a gilded huntress where the Diana stands, a horse and rider in dark
       patina, a second figure in old bronze and a marble portrait bust. Each keeps the scan's own carving and grime. */
    const plinthM = sc(k, R, 'marble_01', 1.4, () => X.marble(0x6a6460, 0x3a3634, 23), { color: 0x6a6662, roughness: 0.4 }, 0x2a2826), plinthT = k.flat(0x2a2826, 0.15, 0.35);
    const plinth = (x: number, z: number, w: number, d: number, h: number) => { k.box(w, h, d, x, h / 2, z, plinthM); k.box(w + 0.16, 0.12, d + 0.16, x, h + 0.06, z, plinthT); k.box(w + 0.2, 0.14, d + 0.2, x, 0.07, z, plinthT); k.keepOut.push({ x, z, r: Math.max(w, d) / 2 + 0.6 }); };
    plinth(-12, 2, 1.5, 1.5, 1.5); plinth(12, -6, 3.6, 1.8, 1.4); plinth(-4, -12, 1.5, 1.5, 1.3); plinth(8, 10, 0.8, 0.8, 1.35);
    void k.prop('metamerican/ph_gothic_statue', -12, 1.62, 2, { height: 2.4, rotY: 0.5 }).then((o) => { if (o) recolour(o, 0xe0b45a, 0.32, 0.9, true); });
    void k.prop('metamerican/ph_horse_statue_01', 12, 1.52, -6, { height: 2.9, rotY: PI }).then((o) => { if (o) recolour(o, 0x8a6a48, 0.42, 0.75, true); });
    void k.prop('metamerican/ph_gothic_statue', -4, 1.42, -12, { height: 2.2, rotY: -0.7 }).then((o) => { if (o) recolour(o, 0x5a4a36, 0.45, 0.8, true); });
    void k.prop('metamerican/ph_marble_bust_01', 8, 1.47, 10, { height: 0.95, rotY: PI });
    k.egg(v(-12, 2.2, 2), { id: 'metamerican-diana', title: 'The weathervane goddess', year: '1891', text: 'The Met owns a 1928 gilded bronze cast of Augustus Saint-Gaudens\'s Diana, cast at half size. The first Diana was an 18 foot weathervane unveiled on top of the tower of Madison Square Garden on 29 September 1891, and in 1893 a lighter 14.5 foot version in hollow copper replaced it. That one is now in the Philadelphia Museum of Art.', clue: 'Look among the bronzes for the huntress who used to turn in the wind.', source: { name: 'Diana (Saint-Gaudens), Wikipedia', url: 'https://en.wikipedia.org/wiki/Diana_(Saint-Gaudens)' } }, { r: 1.6 });
    k.egg(v(-20, 1.8, -8), { id: 'metamerican-courtyard', title: 'Once open to the sky', text: 'The Engelhard Court started out as an open air courtyard. Like the other courtyards in the Museum\'s plans it was filled in once electric light and air conditioning made light wells unnecessary, and the glass roof now does the job the open sky did.', clue: 'Stand among the palms and look up through the glass roof.', source: { name: 'Top Secrets of the Metropolitan Museum of Art, Untapped New York', url: 'https://untappedcities.com/2022/11/02/top-secrets-metropolitan-museum-of-art/4/' } }, { r: 1.6 });
    /* the plantings: real potted palms and ferns (CC0 scans) in limestone planters, in place of the kit's urns */
    for (const [x, z] of [[-20, -8], [-20, 10], [18, 12], [4, -16]]) { k.box(2.4, 0.5, 2.4, x, 0.25, z, lime); k.keepOut.push({ x, z, r: 1.4 }); }
    many(k, 'metamerican/ph_potted_plant_01', { height: 3.4 }, [[-20, 0.5, -8, 0.3], [18, 0.5, 12, 1.9]]);
    many(k, 'metamerican/ph_potted_plant_02', { height: 2.6 }, [[-20, 0.5, 10, 2.2], [4, 0.5, -16, 0.9]]);
    many(k, 'metamerican/ph_fern_02', { width: 1.3 }, [0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const a = (i / 8) * PI * 2 + 0.2; return [Math.cos(a) * 3.75, 0, -2 + Math.sin(a) * 3.75, -a]; }));
    k.mesh(new T.CylinderGeometry(3, 3.2, 0.7, 32), marble, 0, 0.35, -2); k.mesh(new T.CylinderGeometry(2.6, 2.6, 0.2, 32), k.flat(0x88aacc, 0.3, 0.2, { transparent: true, opacity: 0.6 }), 0, 0.75, -2); k.keepOut.push({ x: 0, z: -2, r: 3.4 });
    for (const x of [-16, 16]) k.prop('museum_bench', x, 0, 16, { height: 0.58, keepOut: 1.4 });
    blossomFlag(k, -CW / 2 + 0.72, 6, 6, PI / 2, 2.6, 7, 'cloud');
    donorWall(k, BX, 3.2, BZ - 1.22, 0, 10, false);
    /* the court's own lettering in the house type: the wing over the bank's door, a bronze plaque at it, the court's
       name on the limestone over the balcony stair */
    hsign(k, 'THE AMERICAN WING', 16, 1.1, BX, 11.6, BZ - 3.43, PI, { fg: '#8a8070', size: 0.62 });
    hsign(k, 'BANK OF THE UNITED STATES  ·  15 WALL STREET  ·  1824', 3.4, 0.36, BX + 2.4, 2.5, BZ - 1.23, PI, { fg: '#e8d8a8', bg: '#3a2e20', font: 'W2 JetBrains Mono', border: '#c9a552', size: 0.42 });
    hsign(k, 'THE CHARLES ENGELHARD COURT', 13, 0.9, -CW / 2 + 0.42, 14.2, 6, PI / 2, { fg: '#6a6050', size: 0.6 });
    /* the illusion (one trick a room): THE AMERICAN WING painted flat across the marble toward the glass wall, so that
       from where you arrive it stands up off the floor like a sign; walk onto it and it falls back into smears */
    { const t = floorType('THE AMERICAN WING', ['#1a1c20', '#a8802e']); if (t) anamorphTex(k, t, -4, 16, 3, 0.01, -0.105, 8.5, 6.6, 1.0, 0.82); }
    k.egg(v(-4.8, 0.6, 6.6), { id: 'metamerican-anamorph', title: 'A sign that is not there', text: 'THE AMERICAN WING is painted flat on the marble, stretched toward the glass wall, so that from the spot where you arrive it stands up off the floor like a sign. Walk onto it and it falls back into long smears of ink and gold. The trick is anamorphosis, the same one that hides a skull across the floor of Hans Holbein\'s The Ambassadors of 1533.', clue: 'Go back to where you came in and look along the floor toward the park.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.6 });
    k.crowd([v(-20, 0, 18), v(-8, 0, 4), v(6, 0, -8), v(20, 0, 4), v(10, 0, 18)], 22, { seed: 111, speed: 0.4, spread: 2.4, animate: !ctx.reduced, closed: true, colors: [0x24262c, 0x8a3a3a, 0x33477f, 0xd8d0c0, 0x151517] });
    k.censusWall({ x: -CW / 2 + 0.82, y: 4.4, z: 4, rotY: PI / 2, cols: 30, rows: 5, tile: 0.55, gap: 0.05, start: ctx.wallStart(900, 150), pieces: ctx.all, backing: dark });
    // the works: the west wall, the bank facade flanks, the balcony back wall, the loggia bays
    const mounts: Mount[] = [];
    for (let i = 0; i < 4; i++) { const z = -16 + i * 8; if (i === 2) continue; mounts.push({ position: v(-CW / 2 + 0.82, 4.2, z), rotation: PI / 2, target: v(-CW / 2 + 10, 3, Math.max(z, -CD / 2 + 7.6)), width: 5.2, height: 3.0, style: 'gilt', wash: true }); }
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) mounts.push({ position: v(BX + s * (6 + i * 5.5), 5.6, BZ - 1.22), rotation: PI, target: v(BX + s * 6, 3, BZ - 12), width: 4.2, height: 2.5, style: 'gilt', wash: true });
    for (let i = 0; i < 5; i++) { const x = -20 + i * 10; mounts.push({ position: v(x, 12.4, -CD / 2 + 0.42), rotation: 0, target: v(x, 10, -CD / 2 + 8), width: 5.2, height: 3.0, style: 'gilt', wash: true }); }
    for (let i = 0; i < 4; i++) { const z = -10.5 + i * 7; mounts.push({ position: v(CW / 2 - 0.72, 3.8, z), rotation: -PI / 2, target: v(CW / 2 - 12, 3, z), width: 4.4, height: 2.6, style: 'gilt', wash: true }); }
    return { mounts, spawn: v(-4, 3, 16), look: v(0, 8, -CD / 2), eye: 3, bounds: [-CW / 2 + 1.2, CW / 2 - 1.2, -CD / 2 + 1.5, CD / 2 - 1.5], style: 'gilt', floorY: (x, z) => { if (z > -CD / 2 + 0.8 && z < -CD / 2 + 7) return 8.6; if (x < -CW / 2 + 5 && x > -CW / 2 + 1.5 && z >= -CD / 2 + 7 && z < -CD / 2 + 22) return Math.max(0, 8.6 - ((z - (-CD / 2 + 7)) / 14) * 8.6); return 0; } };
  },
};

/* ---------------- 84 THE EUROPEAN PAINTINGS ---------------- */
export const meteuropean: RoomDef = {
  id: 'meteuropean',
  name: 'The skylit suite',
  area: 'THE MET',
  mood: 'Museum daylight',
  color: '#b8a888',
  description: 'The second floor galleries in a line: skylights with their diffusers, red and grey walls, oak floors, benches in the middle, the works hung at the museum\'s own height.',
  signatures: 'The enfilade of galleries seen through aligned doorways, the coved skylights with their scrim, dark red and slate walls, herringbone oak floors, leather benches, the labels, the guards at the doors.',
  build(k, ctx) {
    k.sky({ top: 0x9ab0c8, horizon: 0xe8e8e4, ground: 0x6a6a68, fog: 0.004, env: 0.7 });
    k.hemi(0xffffff, 0x4a4a48, 0.7);
    /* 2026-11-24 (wave 5a): scans (Poly Haven, CC0): the herringbone oak parquet, the walls as damask silk on the
       red rooms, fine plaster washed slate and smooth stucco in stone, the benches in real leather. */
    const R = 'meteuropean';
    const oak = sc(k, R, 'herringbone_parquet', 2.2, () => X.planks(0x9a7a56, 8, 256, 0.12), { color: 0xc8a888, roughness: 0.62 }, 0x5a4434),
      red = sc(k, R, 'quatrefoil_jacquard_fabric', 1.2, () => X.plaster(0x6a2a2e, 122), { color: 0xb86a6a, roughness: 0.85 }, 0x4a1e20),
      slate = sc(k, R, 'plastered_wall', 2.4, () => X.plaster(0x5a6068, 123), { color: 0x7c8898, roughness: 0.9 }, 0x3a4048),
      cream = sc(k, R, 'white_stucco', 3, () => X.plaster(0xe0d8c8, 124), { color: 0xf6eee0, roughness: 0.9, normal: 0.6 }, 0x8a8478),
      leather = sc(k, R, 'fabric_leather_02', 0.8, () => X.plaster(0x3a2420, 126), { color: 0x6a3a2c, roughness: 0.55 }, 0x2a1a16),
      white = k.flat(0xf4f4f0, 0, 0.9), dark = k.flat(0x1a1c20, 0.5, 0.6),
      scrim = k.glow(0xfffaf0, 0.85), trimM = k.pbr('epTrim', X.plaster(0xf0ece4, 125), 0.5);
    const benchWood = k.flat(0x2a1c14, 0, 0.5), pedM = sc(k, R, 'marble_01', 1.6, () => X.marble(0xe8e4dc, 0x9a948a, 19), { color: 0xf4f0ea, roughness: 0.35 }, 0x8a8680);
    const busts: number[][] = [];
    const NEXT = ['DUTCH PAINTING  ·  VERMEER', 'REMBRANDT AND HIS CIRCLE', 'NETHERLANDISH  ·  BRUEGEL', 'SPANISH PAINTING  ·  EL GRECO'];
    const rooms = [{ w: 18, d: 22, m: red }, { w: 16, d: 18, m: slate }, { w: 20, d: 26, m: cream }, { w: 16, d: 18, m: red }, { w: 18, d: 22, m: slate }];
    let z = 0; const centres: number[] = [];
    const mounts: Mount[] = [];
    rooms.forEach((r, i) => {
      const cz = z - r.d / 2; centres.push(cz);
      k.box(r.w, 0.3, r.d, 0, 0.15, cz, oak);
      for (const s of [-1, 1]) { k.box(0.5, 9, r.d, s * r.w / 2, 4.5, cz, r.m); k.block(s * r.w / 2 - 0.5, s * r.w / 2 + 0.5, cz - r.d / 2, cz + r.d / 2); k.box(0.6, 0.6, r.d, s * (r.w / 2 - 0.05), 8.9, cz, trimM); k.box(0.6, 0.3, r.d, s * (r.w / 2 - 0.05), 0.15, cz, trimM); }
      for (const s of [-1, 1]) { const ez = cz + s * r.d / 2; const side = (r.w - 4.4) / 2; k.box(side, 9, 0.5, -(2.2 + side / 2), 4.5, ez, r.m); k.box(side, 9, 0.5, 2.2 + side / 2, 4.5, ez, r.m); k.box(4.6, 2.6, 0.5, 0, 7.7, ez, r.m); k.block(-r.w / 2, -2.2, ez - 0.4, ez + 0.4); k.block(2.2, r.w / 2, ez - 0.4, ez + 0.4); k.box(5, 0.5, 0.7, 0, 6.25, ez, trimM); k.box(0.3, 6.2, 0.7, -2.35, 3.1, ez, trimM); k.box(0.3, 6.2, 0.7, 2.35, 3.1, ez, trimM); }
      const cove = k.mesh(new T.CylinderGeometry(r.w / 2 - 1, r.w / 2 - 1, r.d - 2, 24, 1, true, 0, PI), k.pbr('epCove', X.plaster(0xf4f0e8, 126), 0.3, { side: T.BackSide }), 0, 7.6, cz); cove.rotation.set(0, 0, PI / 2); cove.rotateX(PI / 2); cove.scale.set(1, 0.45, 1); void cove;
      k.box(r.w + 1, 0.4, r.d + 1, 0, 11.4, cz, dark);
      /* the laylight: leaded glass under the skylight, a Firefly plate (FIREFLY_QUEUE.md); a plain warm scrim until then */
      fireflyPlate(k, 'assets/museum/tex/meteuropean/ff_laylight.webp', r.w - 5, r.d - 5, 0, 10.6, cz, 0, scrim, true).rotation.x = PI / 2;
      /* the laylight: the glass ceiling panels under the skylight sit in a grid of muntins */
      for (let gx = -(r.w - 5) / 2; gx <= (r.w - 5) / 2 + 0.01; gx += (r.w - 5) / 4) k.box(0.12, 0.14, r.d - 5, gx, 10.5, cz, trimM);
      for (let gz = -(r.d - 5) / 2; gz <= (r.d - 5) / 2 + 0.01; gz += (r.d - 5) / 5) k.box(r.w - 5, 0.14, 0.12, 0, 10.5, cz + gz, trimM);
      for (let j = 0; j < 3; j++) k.point(0, 9.4, cz - r.d / 3 + j * (r.d / 3), 0xfff8f0, 26, 16);
      /* the benches: long backless leather benches on dark oak legs, as the Met's are, in place of the kit's box */
      const bench = (bz: number) => { k.box(1.0, 0.18, 3.2, 0, 0.62, bz, leather); k.box(1.04, 0.06, 3.24, 0, 0.5, bz, benchWood); for (const lx of [-0.42, 0.42]) for (const lz of [-1.45, 1.45]) k.box(0.08, 0.36, 0.08, lx, 0.3 + 0.15, bz + lz, benchWood); k.keepOut.push({ x: 0, z: bz, r: 1.6 }); };
      bench(cz); if (i % 2 === 0) bench(cz + (i === 2 ? 7 : 5));
      /* marble portrait busts (CC0 scan) on pedestals either side of the door you come in by */
      for (const s of [-1, 1]) { k.box(0.62, 1.3, 0.62, s * 4.0, 0.15 + 0.65, cz + r.d / 2 - 0.9, pedM); k.box(0.74, 0.08, 0.74, s * 4.0, 1.49, cz + r.d / 2 - 0.9, pedM); busts.push([s * 4.0, 1.53, cz + r.d / 2 - 0.9, s * 0.35 + PI * 0]); k.keepOut.push({ x: s * 4.0, z: cz + r.d / 2 - 0.9, r: 0.7 }); }
      /* the gallery's subject over the door that leads on into it, in the house type, as the Met letters its doorways */
      if (i < rooms.length - 1) hsign(k, NEXT[i], 4.4, 0.42, 0, 7.05, cz - r.d / 2 + 0.27, 0, { fg: '#3a3026', size: 0.5 });
      // the works: three or four per long wall, one either side of each doorway
      const n = Math.floor((r.d - 4) / 5.4);
      for (const s of [-1, 1]) for (let j = 0; j < n; j++) { const wz = cz + r.d / 2 - 2.5 - (j + 0.5) * ((r.d - 5) / n) + 0; mounts.push({ position: v(s * (r.w / 2 - 0.3), 3.3, wz), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * (r.w / 2 - 5), 2.6, wz), width: 4.4, height: 3.0, style: 'gilt', wash: true }); }
      for (const s of [-1, 1]) mounts.push({ position: v(s * (r.w / 4 + 1.2), 3.3, cz - r.d / 2 + 0.3), rotation: 0, target: v(s * (r.w / 4 + 1.2), 2.6, cz), width: Math.min(4.4, r.w / 2 - 4), height: 2.6, style: 'gilt', wash: true });
      z -= r.d;
    });
    const END = z;
    const eggAt = (i: number, side: number) => v(side * 2.9, 1.3, centres[i] + rooms[i].d / 2 - 0.6);
    k.egg(v(0, 10.3, centres[0]), { id: 'meteuropean-skylights', title: 'Thirty thousand square feet of sky', year: '2023', text: 'The European paintings galleries have been on the second floor of the Museum\'s 1880 to 1894 wings since the nineteenth century, lit from above. Between 2018 and 2023 the Met replaced 30,000 square feet of skylights over them, along with the glass ceiling panels and the louvers that control the sun, and reopened 45 galleries on 20 November 2023.', clue: 'Look straight up at the glass ceiling of the first gallery.', source: { name: 'European Paintings Skylights Project, Beyer Blinder Belle', url: 'https://www.beyerblinderbelle.com/projects/208_the_metropolitan_museum_of_art_european_paintings_skylights_project' } }, { r: 2.2 });
    k.egg(eggAt(1, -1), { id: 'meteuropean-vermeer', title: 'Five Vermeers', text: 'Only 34 paintings are firmly attributed to Johannes Vermeer, and five of them belong to the Met: A Girl Asleep, Woman with a Lute, Woman with a Water Jug, Portrait of a Young Woman and The Allegory of Faith. No other museum has as many; the Rijksmuseum has four.', clue: 'Stop at the doorway as you enter the second gallery.', source: { name: 'List of paintings by Johannes Vermeer, Wikipedia', url: 'https://en.wikipedia.org/wiki/List_of_paintings_by_Johannes_Vermeer' } }, { r: 1.1 });
    k.egg(eggAt(2, 1), { id: 'meteuropean-aristotle', title: 'The record of 1961', year: '1961', text: 'In 1961 the Met bought Rembrandt\'s Aristotle with a Bust of Homer for $2.3 million, at the time the highest amount ever paid for any picture at public or private sale.', clue: 'Stop at the doorway into the big central gallery.', source: { name: 'Aristotle with a Bust of Homer, Wikipedia', url: 'https://en.wikipedia.org/wiki/Aristotle_with_a_Bust_of_Homer' } }, { r: 1.1 });
    k.egg(eggAt(3, -1), { id: 'meteuropean-harvesters', title: 'The first modern landscape', year: '1565', text: 'Pieter Bruegel the Elder painted The Harvesters in 1565 as one of a series on the times of the year for the Antwerp collector Nicolaes Jonghelinck; five of the series survive. It has been at the Met since 1919, and the Museum calls it a watershed in the history of Western art.', clue: 'Stop at the doorway into the fourth gallery.', source: { name: 'The Harvesters (painting), Wikipedia', url: 'https://en.wikipedia.org/wiki/The_Harvesters_(painting)' } }, { r: 1.1 });
    k.egg(eggAt(4, 1), { id: 'meteuropean-toledo', title: 'A city rearranged', text: 'El Greco\'s View of Toledo, painted between 1596 and 1600, is one of only two landscapes by him that survive, and it hangs at the Met. Several of the Toledo landmarks in it are not where they really stand: he painted the city as he imagined it.', clue: 'Stop at the doorway into the last gallery.', source: { name: 'View of Toledo, Wikipedia', url: 'https://en.wikipedia.org/wiki/View_of_Toledo' } }, { r: 1.1 });
    /* 2026-11-24 (wave 5a): the census wall and the donor wall move to the two walls of the entrance room, where you
       read them on the way in, and free the far doorway for the illusion below. */
    donorWall(k, 4.72, 5.6, 5, -PI / 2, 8.6, false);
    k.censusWall({ x: -4.72, y: 2.6, z: 5, rotY: PI / 2, cols: 16, rows: 3, tile: 0.5, gap: 0.05, start: ctx.wallStart(2600, 48), pieces: ctx.all, backing: dark });
    hsign(k, 'EUROPEAN PAINTINGS  1250 TO 1800', 8.6, 0.62, -4.72, 5.1, 5, PI / 2, { fg: '#2a2420', size: 0.62 });
    hsign(k, 'SECOND FLOOR  ·  THE SKYLIT GALLERIES', 6.4, 0.3, -4.72, 4.45, 5, PI / 2, { fg: '#6a5a48', font: 'W2 JetBrains Mono', size: 0.55 });
    many(k, 'meteuropean/ph_marble_bust_01', { height: 0.78 }, busts);
    /* the illusion (one trick a room): through the last doorway the enfilade seems to run on for three more galleries.
       It is ten metres of forced perspective: each doorway beyond is 0.62 of the one before and only half as far on,
       the floor rises and the ceiling falls toward your eye line, the paintings shrink with the rooms. From the
       entrance it reads as forty metres more of museum; the rope stops you finding out. */
    { const E = 3.15, F0 = 0.3, H0 = 10.5, W0 = 8.6, cols = [slate, cream, red, slate];
      const sAt = (i: number) => Math.pow(0.62, i), zAt = (i: number) => END - 4.6 * (1 - Math.pow(0.62, i)) / (1 - 0.62);
      const P = (i: number) => { const s = sAt(i), f = F0 + (E - F0) * (1 - s); return { s, z: zAt(i), w: W0 * s, f, c: f + H0 * s }; };
      const quad = (pts: T.Vector3[], m: T.Material, inward: T.Vector3) => {
        const n = new T.Vector3().subVectors(pts[1], pts[0]).cross(new T.Vector3().subVectors(pts[2], pts[0]));
        const q = n.dot(inward) < 0 ? [pts[0], pts[3], pts[2], pts[1]] : pts, g = new T.BufferGeometry();
        g.setAttribute('position', new T.Float32BufferAttribute(q.flatMap((p) => [p.x, p.y, p.z]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals();
        return k.mesh(g, m);
      };
      const gilt = k.flat(0xb8903a, 0.8, 0.35), canvasC = [0x3a2a1c, 0x5a4a30, 0x2a3a4a, 0x6a4a2a, 0x4a3a2a, 0x2e3a2a];
      for (let i = 1; i <= 4; i++) {
        const a = P(i - 1), b = P(i), m = cols[i - 1];
        quad([v(-a.w, a.f, a.z), v(a.w, a.f, a.z), v(b.w, b.f, b.z), v(-b.w, b.f, b.z)], oak, v(0, 1, 0));
        quad([v(-a.w, a.c, a.z), v(a.w, a.c, a.z), v(b.w, b.c, b.z), v(-b.w, b.c, b.z)], scrim, v(0, -1, 0));
        for (const sx of [-1, 1]) {
          quad([v(sx * a.w, a.f, a.z), v(sx * b.w, b.f, b.z), v(sx * b.w, b.c, b.z), v(sx * a.w, a.c, a.z)], m, v(-sx, 0, 0));
          /* two paintings a wall, hung at the museum's height for that scale */
          for (const u of [0.3, 0.7]) { const zz = a.z + (b.z - a.z) * u, ss = a.s + (b.s - a.s) * u, ff = a.f + (b.f - a.f) * u, ww = a.w + (b.w - a.w) * u; const fr = k.box(0.06 * ss, 2.9 * ss, 3.6 * ss, sx * (ww - 0.04 * ss), ff + 3.2 * ss, zz, gilt); void fr; k.box(0.04 * ss, 2.5 * ss, 3.2 * ss, sx * (ww - 0.08 * ss), ff + 3.2 * ss, zz, k.flat(canvasC[(i * 2 + (u > 0.5 ? 1 : 0) + (sx > 0 ? 3 : 0)) % 6], 0, 0.8)); }
        }
        /* the doorway into the next room, or, at the end, the last wall with one painting on it */
        const t = 0.5 * b.s, dw = 2.2 * b.s, dh = 6.2 * b.s, side = b.w - dw;
        if (i < 4) { k.box(side, b.c - b.f, t, -(dw + side / 2), (b.f + b.c) / 2, b.z, cols[i]); k.box(side, b.c - b.f, t, dw + side / 2, (b.f + b.c) / 2, b.z, cols[i]); k.box(2 * dw, b.c - b.f - dh, t, 0, b.f + dh + (b.c - b.f - dh) / 2, b.z, cols[i]); k.box(2 * dw + 0.6 * b.s, 0.5 * b.s, t * 1.4, 0, b.f + dh + 0.25 * b.s, b.z, trimM); for (const sx of [-1, 1]) k.box(0.3 * b.s, dh, t * 1.4, sx * (dw + 0.15 * b.s), b.f + dh / 2, b.z, trimM); }
        else { k.box(2 * b.w, b.c - b.f, t, 0, (b.f + b.c) / 2, b.z, cols[0]); k.box(3.8 * b.s, 3.0 * b.s, 0.08 * b.s, 0, b.f + 3.2 * b.s, b.z + t / 2 + 0.02, gilt); k.box(3.4 * b.s, 2.6 * b.s, 0.06 * b.s, 0, b.f + 3.2 * b.s, b.z + t / 2 + 0.06, k.flat(0x8a5a30, 0, 0.8)); }
      }
      k.point(0, 5, END - 3, 0xfff4e6, 14, 10);
      k.block(-2.2, 2.2, END - 0.4, END + 0.6);
      for (const sx of [-1, 1]) k.prop('rope_stanchion', sx * 1.7, 0.3, END + 0.75, { height: 1.0 });
      k.box(3.4, 0.05, 0.05, 0, 1.1, END + 0.75, k.flat(0x8a1a22, 0, 0.6)); }
    k.egg(v(0, 2.4, END + 1.4), { id: 'meteuropean-forced', title: 'Forty metres in ten', text: 'The galleries beyond the rope are not there. They are a forced perspective, the trick Francesco Borromini used in 1652 at the Palazzo Spada in Rome, where a colonnade of about nine metres reads as more than thirty: each doorway is smaller than the one before and closer behind it, the floor climbs and the ceiling drops. Here each room is 0.62 of the last, and the whole run is about ten metres deep.', clue: 'Stand in the entrance and look down the line of doorways to the very end.', source: { name: 'Palazzo Spada, Wikipedia', url: 'https://en.wikipedia.org/wiki/Palazzo_Spada' } }, { r: 1.4 });
    k.box(6.8, 9, 0.5, -5.6, 4.5, 0.25, cream); k.box(6.8, 9, 0.5, 5.6, 4.5, 0.25, cream); k.box(4.6, 2.6, 0.5, 0, 7.7, 0.25, cream); k.block(-9, -2.2, -0.1, 0.5); k.block(2.2, 9, -0.1, 0.5);
    k.box(10, 0.3, 10, 0, 0.15, 5, oak); k.box(10, 9, 0.5, 0, 4.5, 10.2, cream); k.block(-5, 5, 9.8, 10.6); for (const s of [-1, 1]) { k.box(0.5, 9, 10, s * 5, 4.5, 5, cream); k.block(s * 5 - 0.4, s * 5 + 0.4, 0, 10); } k.box(10.4, 0.4, 10.4, 0, 9, 5, dark); k.point(0, 7.6, 5, 0xfff8f0, 20, 12);
    mlowBanner(k, 0, 5, 9.92, PI, 2.6, false);
    for (const cz of centres) k.crowd([v(-4, 0.15, cz + 6), v(4, 0.15, cz - 6)], 4, { seed: 112 + Math.round(cz), speed: 0.15, spread: 1.4, animate: !ctx.reduced, colors: [0x24262c, 0x151517, 0x8a3a3a, 0xd8d0c0] });
    for (const cz of centres) { k.box(0.5, 1.7, 0.4, -6, 1.0, cz + 8, dark); k.sphere(0.14, -6, 2.0, cz + 8, k.flat(0xc8a284, 0, 0.7), 8); }
    return { mounts, spawn: v(0, 3, 6), look: v(0, 3, -40), eye: 3, bounds: [-8, 8, END + 1, 9.4], style: 'gilt' };
  },
};

/* ---------------- 85 THE HALL OF OCEAN LIFE ---------------- */
export const oceanlife: RoomDef = {
  id: 'oceanlife',
  name: 'Under the whale',
  area: 'NATURAL HISTORY',
  mood: 'Deep blue afternoon',
  color: '#3a6aa8',
  description: 'The two storey hall lit like the sea floor, the blue whale hanging over everything, the dioramas glowing in the walls, the works between the windows of the deep.',
  signatures: 'The ninety four foot whale suspended from the ceiling, the blue light and the ocean floor mural, the upper and lower tiers of dioramas set into the walls, the balcony, the great hall doorway with its columns.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad8, horizon: 0xeef0ec, ground: 0x6a6a66, fog: 0.005, env: 0.6 });
    k.hemi(0x6a9ad8, 0x0a1a2a, 0.55);
    /* 2026-11-24 (wave 5a): scans (Poly Haven, CC0): the walls as plaster washed deep sea blue, the floor as polished
       terrazzo gone blue grey under the light, the front on Central Park West as granite, the diorama beds as real sand. */
    const R = 'oceanlife';
    const blue = sc(k, R, 'white_plaster_02', 3, () => X.plaster(0x1a3a5a, 127), { color: 0x2c4c70, roughness: 0.9 }, 0x14283a),
      deep = k.flat(0x081826, 0.2, 0.9), floorD = sc(k, R, 'terrazzo_tiles', 2.6, () => X.terrazzo(0x2a3a48, 128), { color: 0x7a8c9c, roughness: 0.3 }, 0x2a3440),
      sandS = sc(k, R, 'coast_sand_01', 2.4, () => X.plaster(0xd8c8a0, 129), { color: 0xe8dcc0, roughness: 0.95 }, 0x6a6048),
      lime = k.pbr('olLime', X.ashlar(0xd8d0bc, 257, 4), 0.25), dark = k.flat(0x1a1c20, 0.5, 0.6),
      glassD = k.glass(0x8ac8e8, 0.12, 0.04), sand = k.flat(0xd8c8a0, 0, 0.9), coral = [k.flat(0xe87a5a, 0, 0.8), k.flat(0xf1c531, 0, 0.8), k.flat(0x8a3ad8, 0, 0.8), k.flat(0x3aa0a0, 0, 0.8)];
    // the museum front on the park side, the entrance, then the hall
    street(k, { w: 24, len: 160, z: 50, x: 0 });
    k.box(120, 30, 40, 0, 15, 30, sc(k, R, 'granite_wall', 4, () => X.ashlar(0xb8a890, 258, 3), { color: 0xe0c4b4, roughness: 0.75 }, 0x5a4c44));
    for (let i = 0; i < 4; i++) { k.column(-9 + i * 6, 0, 50.5, 14, 1.0, lime, true); k.prop('corinthian_capital', -9 + i * 6, 14, 50.5, { height: 2 }); }
    k.box(30, 3, 12, 0, 15.5, 50, lime);
    k.arch(4, 8, 4, 0, 0, 50, lime, false, 0.85); k.block(-60, -2.2, 49.4, 51); k.block(2.2, 60, 49.4, 51);
    mlowBanner(k, -14, 9, 51.2, 0, 3.6, true); blossomFlag(k, 14, 9, 51.2, 0, 3.0, 5, 'electric');
    k.box(20, 0.3, 40, 0, 0.15, 30, floorD); k.block(-10, -3, 10, 49); k.block(3, 10, 10, 49);
    const HW = 60, HD = 50, HH = 18;
    k.box(HW, 0.3, HD, 0, 0.15, -HD / 2 + 10, floorD);
    /* 2026-11-24 (wave 5a): the walls are cut through now. The dioramas used to be glass laid on a solid wall with
       their sand and coral buried inside it, so every window showed flat blue. Each window is a real opening onto a
       lit case two metres deep behind the wall (built below). */
    const DZ = [0, 1, 2, 3].map((i) => -HD + 18 + i * 10), DY = [3.2, 10.6], EX = [-18, 0, 18];
    for (const s of [-1, 1]) { holedWall(k, HD, HH, 0.8, DZ.flatMap((z) => DY.map((y) => [-(z + HD / 2 - 10), y, 2.5, 1.5])), blue, s * HW / 2 - 0.4, 0, -HD / 2 + 10, PI / 2); k.block(s * HW / 2 - 0.7, s * HW / 2 + 0.7, -HD + 10, 10); }
    holedWall(k, HW, HH, 0.8, EX.flatMap((x) => DY.map((y) => [x, y, 2.5, 1.5])), blue, 0, 0, -HD + 9.6, 0); k.block(-HW / 2, HW / 2, -HD + 9.4, -HD + 10.6);
    k.box(HW, HH, 0.8, 0, HH / 2, 10, blue); k.block(-HW / 2, -3, 9.4, 10.6); k.block(3, HW / 2, 9.4, 10.6);
    k.box(HW + 2, 0.6, HD + 2, 0, HH, -HD / 2 + 10, deep);
    for (let x = -24; x <= 24; x += 8) for (let z = -HD + 16; z < 10; z += 10) k.point(x, HH - 2, z, 0x3a8ad8, 24, 18);
    // the whale from the Blender kit, hanging on cables, lit from below
    /* The real whale hangs without wires: an iron frame inside it bolts to one 16 inch steel pipe
       braced to the roof trusses, its back almost touching the ceiling, so it rides high here too. */
    /* the whale stays the institution kit's model (no free scan of a blue whale exists; queued as 3D PAID OK in
       FIREFLY_QUEUE.md), repainted from the flat pale blue to the slate of the 2003 paint job, with a satin skin */
    void k.prop('blue_whale', 0, 10, -HD / 2 + 10, { height: 5.6, rotY: 0.2, keepOut: 0 }).then((o) => { if (o) recolour(o, 0x485c72, 0.5, 0.05); });
    k.cyl(0.21, 3.2, 0, HH - 1.6, -HD / 2 + 10, dark, 0.21, 12);
    k.point(0, 5, -HD / 2 + 10, 0x9ad8ff, 60, 30); k.spot(0, 1, -HD / 2 + 10, 0, 12, -HD / 2 + 10, 0xb8e0ff, 200, 0.8, 0.5, 20);
    k.egg(v(0, 9.3, -HD / 2 + 10), { id: 'oceanlife-nowires', title: 'No wires', year: '1969', text: 'The 94 foot whale hangs without any wires. An iron frame inside it connects to a steel pipe 16 inches across, tied by steel bars to the trusses of the room, so its back nearly touches the ceiling. It weighs about 21,000 pounds and replaced an older papier mache whale that the Museum thought looked outdated by the early 1960s.', clue: 'Stand under the whale\'s belly and look for what holds it up.', source: { name: 'Photos from 1968 show the 94 foot blue whale being hung, 6sqft', url: 'https://www.6sqft.com/photos-from-1968-show-the-museum-of-natural-historys-94-foot-blue-whale-being-hung/' } }, { r: 1.8 });
    k.egg(v(-9, 1.6, -HD / 2 + 10), { id: 'oceanlife-tenton', title: 'Four tons on paper, ten in the air', text: 'The whale was assembled right here in the hall from late 1967, a steel frame with molded polyurethane and a fiberglass skin, and went on show in February 1969. It was planned to weigh four tons and came out at ten, so 600 pounds of paint were sanded off. The first paint job made it look like a naval battleship.', clue: 'Walk the floor under the west half of the whale and look up at its skin.', source: { name: 'How to Build a Blue Whale Without Having Seen One, Part II, Mental Floss', url: 'https://www.mentalfloss.com/culture/museums/how-build-blue-whale-without-having-seen-one-part-ii' } }, { r: 1.6 });
    k.egg(v(9, 1.6, -HD / 2 + 10), { id: 'oceanlife-2003', title: 'Fixed after 34 years', year: '2003', text: 'When the hall reopened on 17 May 2003 the whale was remade and repainted. Its blowhole was moved, because the original spot had been a guess, and it got an anus, which it had gone without for 34 years. The very last touch on the 1969 model had been 28 fine hairs on its chin.', clue: 'Walk the floor under the east half of the whale and look up.', source: { name: 'How to Build a Blue Whale Without Having Seen One, Part II, Mental Floss', url: 'https://www.mentalfloss.com/culture/museums/how-build-blue-whale-without-having-seen-one-part-ii' } }, { r: 1.6 });
    /* the dioramas, two tiers of real cases: each opening in the wall gives onto a box two metres deep with a sand bed
       (scan), CC0 rocks and shells (Poly Haven) on it, a painted backdrop of the sea it shows (a Firefly plate per
       habitat, FIREFLY_QUEUE.md; a painted gradient with light shafts until then), a lamp in the case and glass. */
    const HAB = ['kelp', 'reef', 'deep', 'ice'] as const, HABN = ['KELP FOREST', 'CORAL REEF', 'THE DEEP SEA', 'ARCTIC ICE EDGE'];
    /* case i (lower tier even, upper odd): the second west case is the deep sea of the sperm whale and the squid */
    const habi = (i: number) => (i >> 1 === 1 ? 2 : ((i >> 1) + (i & 1) * 2) % 4);
    const back = HAB.map((h, i) => {
      const t = canvas(`ol-${h}`, 512, 320, (g, W, H) => {
        const top = ['#2a7a8a', '#3aa8c8', '#0a2a4a', '#8ab8d0'][i], bot = ['#0a2a2a', '#0a3a5a', '#020812', '#1a3a5a'][i];
        const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, W, H);
        g.globalCompositeOperation = 'lighter';
        for (let r = 0; r < 7; r++) { const x = (r * 83 + i * 37) % W; const sh = g.createLinearGradient(x, 0, x + 40, H); sh.addColorStop(0, 'rgba(200,240,255,0.18)'); sh.addColorStop(1, 'rgba(200,240,255,0)'); g.fillStyle = sh; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 28, 0); g.lineTo(x + 90, H); g.lineTo(x + 40, H); g.closePath(); g.fill(); }
        g.globalCompositeOperation = 'source-over';
        if (i === 0) { g.strokeStyle = 'rgba(40,90,40,0.8)'; g.lineWidth = 6; for (let r = 0; r < 14; r++) { const x = (r * 41) % W; g.beginPath(); g.moveTo(x, H); g.bezierCurveTo(x + 20, H * 0.6, x - 20, H * 0.3, x + 8, 0); g.stroke(); } }
        if (i === 3) { g.fillStyle = 'rgba(240,248,255,0.85)'; g.beginPath(); g.moveTo(0, 0); for (let x = 0; x <= W; x += 32) g.lineTo(x, 30 + ((x * 7) % 26)); g.lineTo(W, 0); g.fill(); }
      });
      return t ? new T.MeshBasicMaterial({ map: t }) : k.glow([0x1a4a7a, 0x2a6a8a, 0x0a2a4a, 0x3a5a7a][i], 0.9);
    });
    const caseM = k.flat(0x0a1824, 0.1, 0.9), rocksAt: number[][] = [], shellsAt: number[][] = [], reefAt: number[][] = [];
    /* one case: (cx, cz) the middle of the opening on the wall face, (ox, oz) the unit vector into the wall, rot its turn */
    const dio = (cx: number, cy: number, cz: number, ox: number, oz: number, rot: number, i: number) => {
      const D = 2.2, mid = (d: number) => [cx + ox * d, cz + oz * d], [bx, bz] = mid(D), [mx, mz] = mid(D / 2 + 0.2);
      const along = (w: number, h: number, d: number, x: number, y: number, z: number, m: T.Material) => { const o = k.box(w, h, d, 0, 0, 0, m); o.position.set(x, y, z); o.rotation.y = rot; return o; };
      along(5.4, 3.4, 0.1, bx, cy, bz, caseM);
      fireflyPlate(k, `assets/museum/tex/oceanlife/ff_diorama_${HAB[habi(i)]}.webp`, 5.0, 3.0, bx - ox * 0.06, cy, bz - oz * 0.06, rot, back[habi(i)], true);
      along(5.2, 0.1, D + 0.4, mx, cy + 1.55, mz, caseM); along(5.2, 0.5, D + 0.4, mx, cy - 1.7, mz, sandS);
      for (const e of [-1, 1]) { const [px, pz] = [mx + Math.cos(rot) * e * 2.55, mz - Math.sin(rot) * e * 2.55]; along(0.1, 3.2, D + 0.4, px, cy, pz, caseM); }
      const g = along(5, 3, 0.04, cx + ox * 0.1, cy, cz + oz * 0.1, glassD); void g;
      const fx = (d: number, a: number) => [cx + ox * d + Math.cos(rot) * a, cz + oz * d - Math.sin(rot) * a];
      const [rx, rz] = fx(1.1, (i % 3) - 1); rocksAt.push([rx, cy - 1.45, rz, rot + i, 0.8 + (i % 3) * 0.15]);
      if (cy < 5) { const [qx, qz] = fx(1.9, 1.2 - (i % 2) * 2.4); reefAt.push([qx, cy - 1.45, qz, rot + i * 0.7]); }
      for (let c = 0; c < 3; c++) { const [sx2, sz2] = fx(0.6 + c * 0.35, -1.8 + c * 1.6 + (i % 2) * 0.3); shellsAt.push([sx2, cy - 1.43, sz2, i + c * 2.1]); }
      k.point(cx + ox * 0.9, cy + 1.2, cz + oz * 0.9, 0xbfe6ff, 9, 4.5);
    };
    let di = 0;
    for (const s of [-1, 1]) for (const z of DZ) for (const y of DY) dio(s * (HW / 2 - 0.4), y, z, s, 0, s < 0 ? PI / 2 : -PI / 2, di++);
    for (const x of EX) for (const y of DY) dio(x, y, -HD + 10.4, 0, -1, 0, di++);
    many(k, 'oceanlife/ph_sand_rocks_small_01', { width: 2.6 }, rocksAt);
    many(k, 'oceanlife/ph_coast_rocks_01', { box: [3.0, 1.1, 1.1] }, reefAt);
    many(k, 'oceanlife/ph_lambis_shell', { width: 0.34 }, shellsAt);
    /* the labels under the lower cases, in the house mono */
    const lab = (c: number) => (c === 1 ? 'SPERM WHALE AND GIANT SQUID' : HABN[habi(c * 2)]);
    let li = 0;
    for (const s of [-1, 1]) for (const z of DZ) hsign(k, lab(li++), 3.2, 0.26, s * (HW / 2 - 0.415), 1.35, z, s < 0 ? PI / 2 : -PI / 2, { fg: '#bfe6ff', font: 'W2 JetBrains Mono', size: 0.55 });
    for (const x of EX) hsign(k, lab(li++), 3.2, 0.26, x, 1.35, -HD + 10.415, 0, { fg: '#bfe6ff', font: 'W2 JetBrains Mono', size: 0.55 });
    k.box(HW - 2, 0.4, 5, 0, 8, -HD + 13, floorD); for (const s of [-1, 1]) k.box(5, 0.4, HD - 2, s * (HW / 2 - 3), 8, -HD / 2 + 10, floorD);
    for (let i = 0; i < 9; i++) { k.prop('balustrade', -24 + i * 6, 8.2, -HD + 15.6, { height: 1.0 }); }
    for (const s of [-1, 1]) for (let i = 0; i < 8; i++) k.prop('balustrade', s * (HW / 2 - 5.6), 8.2, -HD + 18 + i * 6, { height: 1.0, rotY: PI / 2 });
    for (let i = 0; i < 14; i++) k.box(3, 0.57, 1.0, HW / 2 - 4, 0.28 + i * 0.57, 6 - i * 1.0, floorD);
    k.block(-HW / 2 + 0.8, HW / 2 - 0.8, -HD + 10.6, -HD + 15.2); k.block(-HW / 2 + 0.8, -HW / 2 + 5.4, -HD + 15, 9); k.block(HW / 2 - 5.4, HW / 2 - 0.8, -HD + 15, -8);
    eyeMedallion(k, 0, 0.16, 4, 2.2);
    /* caustics: the light of a sea surface moving over the whole floor, two layers of a painted caustic net drifting
       against each other (additive, so the terrazzo shows through). Still for reduced motion. */
    { const ct = canvas('ol-caustic', 256, 256, (g, W, H) => {
        const img = g.createImageData(W, H), pts: number[][] = [], rnd = X.mulberry(85);
        for (let i = 0; i < 26; i++) pts.push([rnd() * W, rnd() * H]);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          let d1 = 1e9, d2 = 1e9;
          for (const [px, py] of pts) for (const ox of [-W, 0, W]) for (const oy of [-H, 0, H]) { const d = Math.hypot(x - px - ox, y - py - oy); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
          const e = Math.max(0, 1 - (d2 - d1) / 9), c = Math.round(255 * e * e), o = (y * W + x) * 4;
          img.data[o] = c; img.data[o + 1] = c; img.data[o + 2] = c; img.data[o + 3] = 255;
        }
        g.putImageData(img, 0, 0);
      }, [], true);
      if (ct) for (const [rep, op, sp] of [[7, 0.22, 0.012], [11, 0.14, -0.018]] as const) {
        const t = ct.clone(); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep, rep * HD / HW); t.needsUpdate = true;
        const m = new T.MeshBasicMaterial({ map: t, color: 0x8ad0ff, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false });
        const pl = k.mesh(new T.PlaneGeometry(HW - 1.6, HD - 1.6), m, 0, 0.32 + (rep > 8 ? 0.004 : 0), -HD / 2 + 10, true); pl.rotation.x = -PI / 2;
        if (!ctx.reduced) k.ticks.push((tt) => { t.offset.set(tt * sp, tt * sp * 0.6 + Math.sin(tt * 0.3) * 0.02); });
      } }
    /* the hall's name over the way in, and the illusion (one trick a room): UNDER THE WHALE painted flat on the floor,
       stretched toward the whale, so that from where you arrive it stands up like a sign */
    hsign(k, 'MILSTEIN HALL OF OCEAN LIFE', 16, 1.0, 0, 12.6, 9.57, PI, { fg: '#bfe6ff', size: 0.6 });
    hsign(k, 'MILSTEIN HALL OF OCEAN LIFE', 14, 0.9, 0, 7.6, 10.43, 0, { fg: '#e8dcc8', size: 0.6 });
    { const t = floorType('UNDER THE WHALE', ['#bfe6ff', '#f4f0e8']); if (t) anamorphTex(k, t, 0, 6, 3, 0.3, 0, 11, 7.4, 1.0, 0.8); }
    k.egg(v(-1.6, 0.8, -6.5), { id: 'oceanlife-anamorph', title: 'A sign that is not there', text: 'UNDER THE WHALE is painted flat on the terrazzo, stretched toward the whale, so that from the doorway where you arrive it stands up off the floor like a sign. Walk onto it and it falls back into long smears of paint. The trick is anamorphosis, the same one that hides a skull across the floor of Hans Holbein\'s The Ambassadors of 1533.', clue: 'Go back to the doorway and look along the floor toward the whale.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.6 });
    k.egg(v(-HW / 2 + 1.3, 3.2, -22), { id: 'oceanlife-squid', title: 'A fight nobody has seen', text: 'One of the dioramas in this hall shows a sperm whale with a giant squid caught in its mouth, the squid\'s tentacles grasping at the whale\'s head. Human eyes have never witnessed that battle; the scene rests on squid parts found in sperm whale stomachs and on whale scars that match the suckers of a giant squid.', clue: 'Look into the lower dioramas along the west wall.', source: { name: 'Sperm whale, American Museum of Natural History on Tumblr', url: 'https://tumblr.amnh.org/tagged/sperm%20whale' } }, { r: 1.4 });
    k.egg(v(0, 2.2, 8.4), { id: 'oceanlife-hall', title: 'Nineteen thousand square feet', text: 'The hall floor covers 19,000 square feet. The upper level shows ocean ecosystems and the lower half holds 15 large dioramas of the bigger sea creatures. A 1969 renovation brought in the blue whale, and after another in 2003 the hall was renamed for Paul and Irma Milstein.', clue: 'Pause in the doorway before you walk in under the whale.', source: { name: 'American Museum of Natural History, Wikipedia', url: 'https://en.wikipedia.org/wiki/American_Museum_of_Natural_History' } }, { r: 1.6 });
    donorWall(k, 0, 6.6, 9.58, PI, 10, false);
    for (const x of [-12, 12]) k.prop('museum_bench', x, 0.15, -HD / 2 + 10, { height: 0.58, rotY: PI / 2, keepOut: 1.4 });
    k.crowd([v(-20, 0.15, 2), v(-10, 0.15, -20), v(10, 0.15, -30), v(20, 0.15, -6)], 26, { seed: 113, speed: 0.4, spread: 3, animate: !ctx.reduced, closed: true });
    k.crowd([v(-22, 8.4, -HD + 20), v(-22, 8.4, 0)], 8, { seed: 114, speed: 0.3, spread: 1.4, animate: !ctx.reduced });
    k.censusWall({ x: 0, y: 3.4, z: 9.58, rotY: PI, cols: 26, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(3500, 104), pieces: ctx.all, backing: dark });
    // the works: between the dioramas on both tiers, the end wall between the windows, the balcony faces
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = -HD + 23 + i * 10; for (const y of [3.2, 10.6]) mounts.push({ position: v(s * (HW / 2 - 0.82), y, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, y - 1, z), width: 3.6, height: 2.4, style: 'steel', wash: true }); }
    for (const x of [-9, 9]) for (const y of [3.2, 10.6]) mounts.push({ position: v(x, y, -HD + 10.42), rotation: 0, target: v(x, y - 1, -HD + 24), width: 4.4, height: 2.6, style: 'steel', wash: true });
    for (let i = 0; i < 3; i++) { const x = -16 + i * 16; mounts.push({ position: v(x, 6.6, -HD + 15.3), rotation: 0, target: v(x, 4, -HD + 30), width: 4.2, height: 2.0, style: 'steel', wash: false }); }
    return { mounts, spawn: v(0, 3, 6), look: v(0, 8, -HD / 2 + 10), eye: 3, bounds: [-HW / 2 + 1.2, HW / 2 - 1.2, -HD + 11, 84], style: 'steel', floorY: (x, z) => { if (z > -HD + 10.6 && z < -HD + 15.2 && Math.abs(x) < HW / 2 - 0.8) return 8.4; if ((x < -HW / 2 + 5.4 || x > HW / 2 - 5.4) && z >= -HD + 15 && z < 6) return 8.4; if (x > HW / 2 - 5.5 && x < HW / 2 - 2.5 && z >= -8 && z < 7) return Math.min(8, ((6 - z) / 13) * 8.4); return 0; } };
  },
};

/* ---------------- 86 THE ROSE CENTER ---------------- */
export const rosecenter: RoomDef = {
  id: 'rosecenter',
  name: 'The sphere in the cube',
  area: 'THE ROSE CENTER',
  mood: 'Space show letting out',
  color: '#8ab8e8',
  description: 'The glass cube on 81st Street with the great sphere floating inside, the spiral walkway of cosmic time, the planets on their orbits, the works on the balconies at every level.',
  signatures: 'The six storey glass cube, the eighty seven foot sphere held in its cradle, the ramp spiralling round it, the scale models of planets hanging in the void, the granite terraces outside, the night lit interior.',
  build(k, ctx) {
    k.sky({ top: 0x1a2446, horizon: 0x6a5a70, ground: 0x14141a, fog: 0.0022, stars: 300, env: 0.7 });
    k.hemi(0xb8c8ee, 0x1a1418, 0.55);
    const glass = k.glass(0xdcecf6, 0.14, 0.04), steel = k.flat(0x8c98a4, 0.9, 0.3),
      dark = k.flat(0x1a1c20, 0.5, 0.6), glow = k.glow(0xfff0e0);
    /* 2026-11-24 (wave 5a): scans (Poly Haven, CC0): the terraces in dark granite slabs, the cube's floor as smooth
       poured concrete, the 81st Street pavement as concrete pavers. The sphere wears its aluminium panels (a painted map
       of the joints, latitude rings and gores), the planets their own painted faces (Firefly maps queued). */
    const R = 'rosecenter';
    const granite = sc(k, R, 'granite_tile', 3, () => X.ashlar(0x8a8480, 259, 3), { color: 0xb8b4b0, roughness: 0.6 }, 0x3a3836),
      deck = sc(k, R, 'smooth_concrete_floor', 4, () => X.concrete(0x9a9a94, 129), { color: 0xd0ccc4, roughness: 0.45 }, 0x5a5854),
      pave = sc(k, R, 'concrete_pavers', 2.4, () => X.pavers(0x8e8b84, 130), { color: 0xc4c0b8, roughness: 0.8 }, 0x4a4846);
    const panels = canvas('rc-sphere', 1024, 512, (g, W, H) => {
      g.fillStyle = '#eef0f2'; g.fillRect(0, 0, W, H);
      const rnd = X.mulberry(86);
      for (let r = 0; r < 18; r++) for (let c = 0; c < 48; c++) { const sh = 232 + Math.floor(rnd() * 16); g.fillStyle = `rgb(${sh},${sh + 2},${sh + 5})`; g.fillRect((c * W) / 48 + 1, (r * H) / 18 + 1, W / 48 - 2, H / 18 - 2); }
      g.strokeStyle = 'rgba(120,128,140,0.55)'; g.lineWidth = 1.2;
      for (let r = 0; r <= 18; r++) { g.beginPath(); g.moveTo(0, (r * H) / 18); g.lineTo(W, (r * H) / 18); g.stroke(); }
      for (let c = 0; c <= 48; c++) { g.beginPath(); g.moveTo((c * W) / 48, H * 0.06); g.lineTo((c * W) / 48, H * 0.94); g.stroke(); }
    });
    const sphereM = panels ? new T.MeshStandardMaterial({ map: panels, roughness: 0.32, metalness: 0.35, color: 0xffffff }) : k.flat(0xe8ecf0, 0.1, 0.35);
    // 81st Street, the terraces, the cube
    street(k, { w: 24, len: 160, z: 50, x: 0 });
    blockFront(k, { x: 60, z0: 130, count: 12, face: -1, seed: 260, h: [18, 34] });
    k.box(120, 0.4, 60, 0, -0.2, 8, pave);
    for (let i = 0; i < 6; i++) k.box(60, 0.4, 1.4, 0, 0.2 + i * 0.4, 38 - i * 1.4, granite);
    const CW = 44, CH = 30, CZ = 0;
    k.box(CW, 0.6, CW, 0, 2.6, CZ, deck);
    for (const s of [-1, 1]) { k.box(0.16, CH, CW, s * CW / 2, CH / 2 + 2.6, CZ, glass); k.box(CW, CH, 0.16, 0, CH / 2 + 2.6, CZ + s * CW / 2, glass); k.block(s * CW / 2 - 0.4, s * CW / 2 + 0.4, CZ - CW / 2, CZ + CW / 2); }
    k.block(-CW / 2, -3, CZ + CW / 2 - 0.4, CZ + CW / 2 + 0.4); k.block(3, CW / 2, CZ + CW / 2 - 0.4, CZ + CW / 2 + 0.4); k.block(-CW / 2, CW / 2, CZ - CW / 2 - 0.4, CZ - CW / 2 + 0.4);
    for (let i = -CW / 2; i <= CW / 2; i += 4) { for (const s of [-1, 1]) { k.box(0.3, CH, 0.3, s * CW / 2, CH / 2 + 2.6, CZ + i, steel); k.box(0.3, CH, 0.3, i, CH / 2 + 2.6, CZ + s * CW / 2, steel); } }
    for (let y = 6; y < CH + 2; y += 5) for (const s of [-1, 1]) { k.box(CW, 0.3, 0.3, 0, y + 2.6, CZ + s * CW / 2, steel); k.box(0.3, 0.3, CW, s * CW / 2, y + 2.6, CZ, steel); }
    k.box(CW + 1, 0.5, CW + 1, 0, CH + 2.9, CZ, dark);
    // the sphere in its cradle, the spiral walkway round it, the planets
    const SY = 16, SR = 11;
    k.sphere(SR, 0, SY, CZ, sphereM, 48);
    for (let i = 0; i < 3; i++) { const a = (i / 3) * PI * 2; k.beam(v(Math.cos(a) * 14, 2.9, CZ + Math.sin(a) * 14), v(Math.cos(a) * 8, SY - 7, CZ + Math.sin(a) * 8), 0.5, steel, 8); }
    for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; k.point(Math.cos(a) * 15, 8 + (i % 4) * 5, CZ + Math.sin(a) * 15, i % 2 ? 0x4a8aff : 0xfff0e0, 20, 16); }
    const helix: T.Vector3[] = [];
    for (let i = 0; i <= 200; i++) { const t = i / 200; const a = t * PI * 2 * 1.75; const y = 3 + t * 20; helix.push(v(Math.cos(a) * 17, y, CZ + Math.sin(a) * 17)); }
    const sp = k.spline(helix, false, 0.5); const pts = sp.getSpacedPoints(400);
    const treadG = new T.BoxGeometry(3.6, 0.16, 0.5), tm: T.Matrix4[] = [];
    const tan = new T.Vector3(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0);
    for (let i = 0; i < 400; i++) { const p = pts[i]; sp.getTangentAt(i / 400, tan); q.setFromAxisAngle(up, Math.atan2(tan.x, tan.z)); tm.push(new T.Matrix4().compose(p.clone().add(v(0, -0.3, 0)), q, new T.Vector3(1, 1, 1))); }
    k.instances(treadG, deck, tm);
    k.curve(pts.filter((_, i) => i % 3 === 0).map((p) => p.clone().add(v(p.x * 0.11, 0.8, (p.z - CZ) * 0.11))), 0.04, steel, 130);
    k.curve(pts.filter((_, i) => i % 3 === 0).map((p) => p.clone().add(v(-p.x * 0.09, 0.8, -(p.z - CZ) * 0.09))), 0.04, steel, 130);
    /* the planets: Venus, Saturn with its rings, Earth, Mars, Mercury and (new) Jupiter, each with a painted face in
       place of one flat colour, turning on its cable. The first is still the Pluto egg: the display left Pluto out. */
    const face = (key: string, base: string, paint: (g: CanvasRenderingContext2D, W: number, H: number, rnd: () => number) => void) => canvas(`rc-${key}`, 512, 256, (g, W, H) => { g.fillStyle = base; g.fillRect(0, 0, W, H); paint(g, W, H, X.mulberry(key.length * 31 + 7)); });
    const bands = (cols: string[]) => (g: CanvasRenderingContext2D, W: number, H: number, rnd: () => number) => { let y = 0; while (y < H) { const h = 4 + rnd() * 22; g.fillStyle = cols[Math.floor(rnd() * cols.length)]; g.globalAlpha = 0.55 + rnd() * 0.45; g.fillRect(0, y, W, h); y += h; } g.globalAlpha = 1; for (let i = 0; i < 60; i++) { g.fillStyle = cols[i % cols.length]; g.globalAlpha = 0.25; g.beginPath(); g.ellipse(rnd() * W, rnd() * H, 10 + rnd() * 40, 2 + rnd() * 5, 0, 0, PI * 2); g.fill(); } g.globalAlpha = 1; };
    const blots = (cols: string[], n: number, r0: number, r1: number) => (g: CanvasRenderingContext2D, W: number, H: number, rnd: () => number) => { for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; g.globalAlpha = 0.35 + rnd() * 0.5; g.beginPath(); g.ellipse(rnd() * W, H * 0.15 + rnd() * H * 0.7, r0 + rnd() * r1, (r0 + rnd() * r1) * 0.6, rnd() * PI, 0, PI * 2); g.fill(); } g.globalAlpha = 1; };
    const FACES: Record<number, T.CanvasTexture | null> = {
      0: face('venus', '#d8b888', bands(['#e8cc9a', '#c8a070', '#f0dcb0', '#b8905a'])),
      1: face('saturn', '#d8c090', bands(['#e8d4a4', '#c8a86a', '#f0e2bc', '#b89a64', '#a88a5a'])),
      2: face('earth', '#1a4a8a', (g, W, H, rnd) => { blots(['#3a7a3a', '#6a8a4a', '#9a8a5a', '#2a6a2a'], 26, 18, 60)(g, W, H, rnd); g.fillStyle = '#f4f8fc'; g.fillRect(0, 0, W, H * 0.07); g.fillRect(0, H * 0.94, W, H * 0.06); blots(['#ffffff'], 40, 6, 30)(g, W, H, rnd); }),
      3: face('mars', '#b8583a', (g, W, H, rnd) => { blots(['#8a3a2a', '#d87a4a', '#6a2a1a'], 40, 8, 40)(g, W, H, rnd); g.fillStyle = '#f4f0ec'; g.fillRect(0, 0, W, H * 0.05); }),
      4: face('mercury', '#8a8a88', blots(['#6a6a68', '#a4a4a0', '#5a5a58', '#b8b8b4'], 90, 3, 18)),
      5: face('jupiter', '#c8a888', (g, W, H, rnd) => { bands(['#e8d8c0', '#b88a5a', '#d8b890', '#8a6a4a', '#f0e4d0'])(g, W, H, rnd); g.fillStyle = '#b8583a'; g.beginPath(); g.ellipse(W * 0.62, H * 0.64, 26, 12, 0, 0, PI * 2); g.fill(); }),
    };
    const planets: [number, number, number][] = [[0.6, 0xc8a070, 0], [1.6, 0xd8b890, 1], [1.1, 0x8ab8e8, 2], [0.8, 0xc85a3a, 3], [0.5, 0x9aa4ae, 4], [2.2, 0xc8a888, 5]];
    planets.forEach(([r, c, i]) => { const a = i === 5 ? 2.4 : (i / 5) * PI * 2 + 0.6; const pm = FACES[i] ? new T.MeshStandardMaterial({ map: FACES[i], roughness: 0.7, metalness: 0.02 }) : k.flat(c, 0.1, 0.6); if (texL && pm instanceof T.MeshStandardMaterial && FACES[i]) texL.load(`assets/museum/tex/rosecenter/ff_planet_${['venus', 'saturn', 'earth', 'mars', 'mercury', 'jupiter'][i]}.webp`, (t) => { if (!k.live) { t.dispose(); return; } t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; pm.map = t; pm.needsUpdate = true; }, undefined, () => {}); const p = k.mesh(new T.SphereGeometry(r, 40, 28), pm, Math.cos(a) * (i === 5 ? 13.5 : 13 + i), i === 5 ? 25 : 8 + i * 3.6, CZ + Math.sin(a) * (i === 5 ? 13.5 : 13 + i), true); k.beam(v(p.position.x, CH + 2.6, p.position.z), p.position.clone().add(v(0, r, 0)), 0.015, dark, 3); if (i === 1) { const rt = canvas('rc-rings', 512, 512, (g, W) => { const rnd = X.mulberry(87); for (let rr = W / 2; rr > W * 0.29; rr -= 2) { const t = (rr - W * 0.29) / (W * 0.21); const gap = t > 0.55 && t < 0.6; g.strokeStyle = gap ? 'rgba(0,0,0,0)' : `rgba(${220 - t * 40},${200 - t * 40},${160 - t * 30},${0.25 + rnd() * 0.6})`; g.clearRect(0, 0, 0, 0); g.lineWidth = 2.2; g.beginPath(); g.arc(W / 2, W / 2, rr, 0, PI * 2); g.stroke(); } }); const ring = k.mesh(new T.RingGeometry(r * 1.25, r * 2.3, 96, 1), rt ? new T.MeshStandardMaterial({ map: rt, transparent: true, side: T.DoubleSide, roughness: 0.8, depthWrite: false }) : k.flat(0xe8dcc0, 0.2, 0.6), p.position.x, p.position.y, p.position.z, true); ring.rotation.x = -PI / 2 + 0.45; } if (i === 0) k.egg(p, { id: 'rosecenter-pluto', title: 'Eight planets', year: '2001', text: 'The Rose Center opened with a display of the solar system that showed eight planets, leaving Pluto out. When The New York Times reported it on its front page on 22 January 2001 it set off a public controversy.', clue: 'Count the planets hanging in the cube.', source: { name: 'Rose Center for Earth and Space, Wikipedia', url: 'https://en.wikipedia.org/wiki/Rose_Center_for_Earth_and_Space' } }, { r: 1.6 }); if (!ctx.reduced) k.ticks.push((t) => { p.rotation.y = t * 0.2 * (i + 1); }); });
    k.egg(v(0, 4.4, CZ), { id: 'rosecenter-bigbang', title: 'A bowl under the sphere', text: 'The sphere is the Space Theater, and the Rose Center also holds the Big Bang Theater: a screen 36 feet across set over a bowl eight feet deep, with a show narrated by Liam Neeson.', clue: 'Stand right underneath the sphere and look up at its belly.', source: { name: 'Rose Center for Earth and Space, Wikipedia', url: 'https://en.wikipedia.org/wiki/Rose_Center_for_Earth_and_Space' } }, { r: 1.8 });
    k.egg(v(-6.6, 4.2, CZ + 11.4), { id: 'rosecenter-cathedral', title: 'The cosmic cathedral', year: '2000', text: 'The $210 million Rose Center opened on 19 February 2000, designed by James Polshek and Todd Schliemann of Polshek Partnership, and Polshek called it a cosmic cathedral. The 87 foot Hayden Sphere looks as if it floats inside the six storey glass cube, but it is held up by truss work.', clue: 'Find one of the steel legs that carry the sphere.', source: { name: 'Rose Center for Earth and Space, Wikipedia', url: 'https://en.wikipedia.org/wiki/Rose_Center_for_Earth_and_Space' } }, { r: 1.6 });
    k.egg(v(17, 4.3, CZ + 0.6), { id: 'rosecenter-pathway', title: 'The walk through time', text: 'The spiral ramp that wraps the sphere is the Heilbrun Cosmic Pathway. It links the first and second floors and is one of the most popular exhibits in the building.', clue: 'Step onto the foot of the spiral ramp.', source: { name: 'Rose Center for Earth and Space, Wikipedia', url: 'https://en.wikipedia.org/wiki/Rose_Center_for_Earth_and_Space' } }, { r: 1.4 });
    k.egg(v(-14, 1.6, 42), { id: 'rosecenter-hayden', title: 'The planetarium that came before', year: '1935', text: 'The cube replaced the old Hayden Planetarium, whose first projector was dedicated in 1935. The old building closed and was demolished in January 1997 to make way for the Rose Center.', clue: 'Stop on the 81st Street pavement before you climb the terraces.', source: { name: 'Rose Center for Earth and Space, Wikipedia', url: 'https://en.wikipedia.org/wiki/Rose_Center_for_Earth_and_Space' } }, { r: 1.6 });
    k.egg(v(18, 2.6, 33.4), { id: 'rosecenter-terrace', title: 'An eclipse in the paving', text: 'The idea for the Arthur Ross Terrace outside the cube came from an illustration of the shadows cast during a lunar eclipse.', clue: 'Walk out onto the granite terraces in front of the glass.', source: { name: 'Rose Center for Earth and Space, Wikipedia', url: 'https://en.wikipedia.org/wiki/Rose_Center_for_Earth_and_Space' } }, { r: 1.6 });
    eyeMonument(k, -14, 2.9, CZ + 14, PI * 0.75, 4.6);
    /* the Willamette meteorite under the sphere, a real scanned rock (Poly Haven, CC0) cast as pitted iron on a low
       granite plinth, with its label; it stands in the Hall of the Universe below the sphere in the real building */
    k.box(4.4, 0.4, 3.0, 5.5, 2.9 + 0.2, CZ - 5, granite); k.keepOut.push({ x: 5.5, z: CZ - 5, r: 2.8 });
    void k.prop('rosecenter/ph_moon_rock_01', 5.5, 3.3, CZ - 5, { height: 1.15, rotY: 0.6 }).then((o) => { if (o) recolour(o, 0x6a625a, 0.42, 0.7, true); });
    k.point(5.5, 7.5, CZ - 5, 0xfff0e0, 18, 9);
    hsign(k, 'WILLAMETTE METEORITE', 2.8, 0.34, 5.5, 3.55, CZ - 3.49, 0, { fg: '#f4f0e8', bg: '#1a1c20', size: 0.55 });
    hsign(k, 'IRON  ·  ABOUT 15.5 TONNES  ·  FOUND IN OREGON 1902', 2.8, 0.16, 5.5, 3.27, CZ - 3.49, 0, { fg: '#8ab8e8', bg: '#1a1c20', font: 'W2 JetBrains Mono', size: 0.5 });
    k.box(2.9, 0.62, 0.06, 5.5, 3.43, CZ - 3.52, dark);
    k.egg(v(5.5, 4.4, CZ - 5), { id: 'rosecenter-willamette', title: 'Thirty two thousand pounds of iron', year: '1902', text: 'The Willamette Meteorite is the largest meteorite found in the United States and the sixth largest in the world, an iron and nickel mass of about 15.5 tonnes. It was found in Oregon in 1902 and has been at the Museum since 1906. The Confederated Tribes of the Grand Ronde Community know it as Tomanowos, and since a 2000 agreement members come each year for a private ceremony with it.', clue: 'Find the dark iron rock under the sphere.', source: { name: 'Willamette Meteorite, Wikipedia', url: 'https://en.wikipedia.org/wiki/Willamette_Meteorite' } }, { r: 1.8 });
    /* the building's name on a granite monument at the foot of the terraces, the pathway's name at its foot */
    k.box(12, 1.3, 0.7, -17, 0.65, 41.5, granite);
    hsign(k, 'ROSE CENTER FOR EARTH AND SPACE', 11.2, 0.62, -17, 0.8, 41.86, 0, { fg: '#e8ecf0', size: 0.62 });
    k.box(0.08, 1.2, 0.08, 19.8, 3.5, CZ + 2.2, dark);
    hsign(k, 'HEILBRUN COSMIC PATHWAY', 3.2, 0.3, 19.75, 4.2, CZ + 2.2, -PI / 2, { fg: '#e8ecf0', bg: '#1a1c20', size: 0.55 });
    /* the illusion (one trick a room): LOOK UP painted flat across the cube's floor toward the sphere, so that from the
       doorway it stands up off the concrete like a sign */
    { const t = floorType('LOOK UP', ['#8ab8e8', '#f4f0e8']); if (t) anamorphTex(k, t, 0, CZ + 19, 5.9, 2.9, 0, 4.5, 5.2, 1.3, 0.85); }
    k.egg(v(1.5, 3.6, CZ + 15.5), { id: 'rosecenter-anamorph', title: 'A sign that is not there', text: 'LOOK UP is painted flat on the concrete, stretched toward the sphere, so that from the doorway of the cube it stands up off the floor like a sign. Walk onto it and it falls back into long smears of paint. The trick is anamorphosis, the same one that hides a skull across the floor of Hans Holbein\'s The Ambassadors of 1533.', clue: 'Stand just inside the glass doors and look along the floor to the sphere.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.4 });
    blossomFlag(k, -CW / 2 + 0.3, 8, CZ - 10, PI / 2, 2.8, 5, 'electric');
    donorWall(k, 0, 5.6, CZ - CW / 2 + 0.3, 0, 10, false);
    for (let i = 0; i < 6; i++) k.prop('rope_stanchion', -12 + i * 4.8, 2.9, CZ + CW / 2 - 6, { height: 1.0 });
    k.crowd([v(-8, 2.9, CZ + 18), v(-16, 2.9, CZ + 4), v(-10, 2.9, CZ - 14), v(12, 2.9, CZ - 14), v(16, 2.9, CZ + 6)], 24, { seed: 115, speed: 0.4, spread: 2.4, animate: !ctx.reduced, closed: true });
    k.censusWall({ x: CW / 2 - 0.42, y: 7, z: CZ, rotY: -PI / 2, cols: 30, rows: 5, tile: 0.55, gap: 0.05, start: ctx.wallStart(4800, 150), pieces: ctx.all, backing: dark });
    // the works: glass screens along the spiral's outer rail at intervals, the ground floor perimeter, the entrance wall
    const mounts: Mount[] = [];
    for (let i = 0; i < 12; i++) { const p = pts[30 + i * 30]; const a = Math.atan2(p.z - CZ, p.x); const px = Math.cos(a) * 19.2, pz = CZ + Math.sin(a) * 19.2; const sc = k.box(0.14, 2.4, 3.2, 0, 0, 0, dark); sc.position.set(px, p.y + 1.2, pz); sc.rotation.y = -a; mounts.push({ position: v(px - Math.cos(a) * 0.1, p.y + 1.3, pz - Math.sin(a) * 0.1), rotation: -a + PI / 2 + PI, target: v(Math.cos(a) * 17, p.y + 1.3, CZ + Math.sin(a) * 17), width: 2.8, height: 1.7, style: 'steel', wash: false }); }
    for (let i = 0; i < 4; i++) { const x = -15 + i * 10; mounts.push({ position: v(x, 5.4, CZ + CW / 2 - 0.42), rotation: PI, target: v(x, 4, CZ + 8), width: 4.4, height: 2.6, style: 'steel', wash: true }); }
    for (let i = 0; i < 4; i++) { const z = CZ - 15 + i * 10; mounts.push({ position: v(-CW / 2 + 0.42, 5.4, z), rotation: PI / 2, target: v(-CW / 2 + 10, 4, z), width: 4.4, height: 2.6, style: 'steel', wash: true }); }
    const path = helix.map((p) => p.clone().add(v(0, 1.4, 0)));
    return { mounts, spawn: v(0, 3, 44), look: v(0, 14, CZ), eye: 3, bounds: [-CW / 2 + 1, CW / 2 - 1, CZ - CW / 2 + 1, 56], style: 'steel', floorY: (x, z) => { if (Math.abs(x) < CW / 2 && Math.abs(z - CZ) < CW / 2) { const d = Math.hypot(x, z - CZ); if (d > 15 && d < 19.5) { const a = Math.atan2(z - CZ, x); let best = 2.9; for (let i = 0; i <= 200; i += 4) { const t = i / 200; const ha = (t * PI * 2 * 1.75) % (PI * 2); const da = Math.abs(Math.atan2(Math.sin(a - ha), Math.cos(a - ha))); if (da < 0.12 && 3 + t * 20 - 1.4 <= best + 3.2) best = 3 + t * 20 - 1.4 > best ? 3 + t * 20 - 1.4 : best; } return Math.max(2.9, best); } return 2.9; } if (z > 30 && z < 39) return Math.min(2.6, ((z - 30) / 8) * 2.6) * 0 + Math.max(0, 2.6 - ((z - 30) / 8) * 2.6); return 0; } };
  },
};
