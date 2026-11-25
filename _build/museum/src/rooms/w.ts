/* Rooms 107 to 111: the Noguchi Museum, Socrates Sculpture Park, the Brooklyn Museum's court, Pioneer Works, the Bronx Museum. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront } from './f';
import { libertyFigure, LIBERTY_CREDIT } from './b';
import { standIn } from './heroes';
import { mlowBanner, blossomFlag, donorWall, eyeMedallion, wordmarkRelief, eyeMonument, blossomGarden, INK, CLOUD, ELECTRIC, CYAN } from './brand';
import { hero, heroInstances } from './heroes';
import { hsign, paintTex, anamorphTex } from './f';
import { fireflyPlate } from './a';
import type { Kit } from '../kit';

const PI = Math.PI;

/* ---------- THE BIG UPGRADE, wave 6b (2026-11-24): helpers for rooms 107 to 111 ----------
   The wave 5 pattern (t.ts), kept local: scanned CC0 surfaces from assets/museum/tex/<room>/ that wear a sensible colour
   until their maps land, real models from assets/museum/props/<room>/ placed many at once (seven or more become instanced
   parts), and painted canvases. Safe in node: the audit builds with no DOM, so scans fall back to paint. */
const HAS_DOM = typeof window !== 'undefined' && typeof HTMLImageElement !== 'undefined';
const texL = HAS_DOM ? new T.TextureLoader() : null;
const w6b = new Map<string, { s: X.Surface; ready: Promise<unknown> }>();
function sc(k: Kit, room: string, id: string, metres: number, paint: () => X.Surface, p: Partial<T.MeshStandardMaterialParameters> & { normal?: number; stretch?: number } = {}, wait = 0x888888) {
  if (!texL) return k.pbr(`w6b-${room}-${id}`, paint(), 1 / metres, p);
  let e = w6b.get(`${room}/${id}`);
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
    w6b.set(`${room}/${id}`, e);
  }
  k.pending.push(e.ready);
  const m = k.pbr(`w6b-${room}-${id}`, e.s, 1 / metres, p);
  if (!m.userData.w6b) {
    m.userData.w6b = true;
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
/* An NYC street sign pair on a green post: `a` faces along x, `b` along z. */
function streetSign(k: Kit, x: number, z: number, a: string, b: string) {
  k.cyl(0.06, 3.6, x, 1.8, z, k.flat(0x1e2a22, 0.6, 0.5), 0.06, 8);
  hsign(k, a, 1.6, 0.3, x, 3.5, z + 0.04, 0, { fg: '#ffffff', bg: '#1f5a3a', border: '#ffffff', size: 0.6 });
  hsign(k, a, 1.6, 0.3, x, 3.5, z - 0.04, PI, { fg: '#ffffff', bg: '#1f5a3a', border: '#ffffff', size: 0.6 });
  hsign(k, b, 1.6, 0.3, x + 0.04, 3.86, z, PI / 2, { fg: '#ffffff', bg: '#1f5a3a', border: '#ffffff', size: 0.6 });
  hsign(k, b, 1.6, 0.3, x - 0.04, 3.86, z, -PI / 2, { fg: '#ffffff', bg: '#1f5a3a', border: '#ffffff', size: 0.6 });
  k.keepOut.push({ x, z, r: 0.3 });
}
/* A window on a solid wall: dark glass, a steel sash grid, a sill and a head, and (inside) the same grid on a pane of daylight.
   The wall runs along x (`face` +1 or -1 is the outside normal along z) at wall line z, between faces z and z - face * t. */
function sashWindow(k: Kit, x: number, y: number, z: number, w: number, h: number, face: number, t: number, sash: T.Material, sill: T.Material, glassOut: T.Material, light: T.Material | null, cols = 4, rows = 4) {
  const o = z + face * 0.02, i = z - face * (t + 0.02);
  k.box(w, h, 0.04, x, y, o, glassOut);
  for (let c = 0; c <= cols; c++) k.box(0.06, h, 0.06, x - w / 2 + (c * w) / cols, y, o + face * 0.03, sash);
  for (let r = 0; r <= rows; r++) k.box(w, 0.06, 0.06, x, y - h / 2 + (r * h) / rows, o + face * 0.03, sash);
  k.box(w + 0.3, 0.14, 0.3, x, y - h / 2 - 0.07, z + face * 0.12, sill);
  k.box(w + 0.3, 0.3, 0.16, x, y + h / 2 + 0.15, z + face * 0.06, sill);
  if (light) { k.box(w, h, 0.04, x, y, i, light); for (let c = 0; c <= cols; c++) k.box(0.06, h, 0.06, x - w / 2 + (c * w) / cols, y, i - face * 0.03, sash); for (let r = 0; r <= rows; r++) k.box(w, 0.06, 0.06, x, y - h / 2 + (r * h) / rows, i - face * 0.03, sash); }
}
const CORNICE: [number, number][] = [[0, 0], [0.5, 0], [0.56, 0.16], [0.36, 0.3], [0.5, 0.48], [0, 0.6]];
const scaleProfile = (p: [number, number][], s: number) => p.map(([a, b]) => [a * s, b * s] as [number, number]);

/* ---------------- 107 THE NOGUCHI MUSEUM ---------------- */
export const noguchi: RoomDef = {
  id: 'noguchi',
  name: 'The stone garden',
  area: 'THE NOGUCHI MUSEUM',
  mood: 'Vernon Boulevard, still',
  color: '#8a8a80',
  description: 'A block of industrial Queens, the concrete block building and the walled garden: basalt and granite standing in gravel under a katsura tree, the open air gallery, the works among the stones.',
  signatures: 'The 1920s brick photoengraving plant and its concrete block addition, the open roofed first gallery, the garden paved with granite railway stones, stones among bamboo, katsura, black pines and cherries, The Well of six sided basalt, the paper lanterns hung inside, the raw light.',
  build(k, ctx) {
    k.sky({ top: 0x8fa8c8, horizon: 0xe8e8e2, ground: 0x6a6a66, fog: 0.0024, sun: { az: 3.3, el: 0.6, color: 0xf6f4ee, size: 12 }, haze: 0.4, env: 0.9 });
    k.hemi(0xeef0f4, 0x5a5a58, 0.9);
    k.sun(0xf8f4ec, 1.8, 20, 60, 30, true, 70);
    /* 2026-11-24 (wave 6b): scanned CC0 surfaces (Poly Haven): concrete block, the old plant's brick, raked gravel, granite
       setts for the garden, polished concrete, dark basalt for The Well, hinoki for the plinths */
    const block = sc(k, 'noguchi', 'block', 2.4, () => X.concrete(0x9a9a94, 186), { roughness: 0.9, color: 0xffffff }, 0x8a8a84),
      brick = sc(k, 'noguchi', 'brick', 2.0, () => X.brick(0x6a5a4a, 333), { roughness: 0.85, color: 0xd8b8a8 }, 0x6a4a3a),
      gravel = sc(k, 'noguchi', 'gravel', 1.4, () => X.cobble(0xb8b4a8, 187), { roughness: 1, color: 0xffffff }, 0x9a968c),
      floorC = sc(k, 'noguchi', 'floor', 3.0, () => X.concrete(0xb8b4ac, 188), { roughness: 0.55, color: 0xffffff }, 0x9a968e),
      rail = sc(k, 'noguchi', 'rail', 1.8, () => X.pavers(0x8e8a82, 356), { roughness: 0.95, color: 0xffffff }, 0x7e7a72),
      basalt = sc(k, 'noguchi', 'basalt', 1.2, () => X.concrete(0x2e2f31, 189), { roughness: 0.45, color: 0xf0f0f4 }, 0x2e2f31),
      hinoki = sc(k, 'noguchi', 'wood', 1.4, () => X.planks(0xc8a878, 6, 190), { roughness: 0.7, color: 0xf0dcc0 }, 0xb89868),
      cap = k.flat(0xd6d2ca, 0, 0.85), dark = k.flat(0x1a1c20, 0.5, 0.6), paper = k.glow(0xfff1d8, 0.94), sash = k.flat(0x24272b, 0.6, 0.5), glassOut = k.glass(0x9aaab4, 0.55, 0.06), daylight = k.glow(0xf2f4f6, 0.9),
      bamboo = k.flat(0x8aa06a, 0, 0.8), leaf = k.flat(0x5a7a3a, 0, 0.85), water = k.flat(0x2a3a44, 0.2, 0.1, { transparent: true, opacity: 0.85 });
    street(k, { w: 16, len: 140, z: 36, x: 0 });
    blockFront(k, { x: 30, z0: 100, count: 8, face: -1, seed: 334, h: [8, 14] });
    k.water({ y: -1.4, color: 0x2e4a5c, w: 400, d: 400, x: -200, z: 0, amp: 1 });
    k.skyline({ z: 0, count: 20, spacing: 7, scale: 4.2, base: -1.4, seed: 335, lit: 0.2, glow: 0.4, tint: 0x6e7684, x: -480, spires: true });
    // the building: the brick photoengraving plant and its concrete block addition, the corner gallery open to the sky
    /* 2026-11-24 (wave 6b): the building was one solid box, so from inside its walls vanished and the street showed through,
       its roof covered the open air gallery, and the open air gallery was walled in on every side, so the front door led
       nowhere. Now: real walls with a thickness, a roof with the corner left open, a door from the open gallery into the
       main hall, factory sash windows in the brick, coping on the parapet, exposed beams and skylights in the hall. */
    const BX = -18, BZ = -6, BW = 30, BD = 26, H = 9, x0 = BX - BW / 2, x1 = BX + BW / 2, z0 = BZ - BD / 2, z1 = BZ + BD / 2;
    const OX = x1 - 6, OZ = z1 - 6, DX0 = BX + 2, DX1 = BX + 6;
    k.box(0.6, H, BD, x0 + 0.3, H / 2, BZ, block);
    k.box(BW, H, 0.6, BX, H / 2, z0 + 0.3, block);
    k.box(0.6, H, OZ - 6 - z0, x1 - 0.3, H / 2, (z0 + OZ - 6) / 2, block);
    k.box(0.6, H, 12, x1 - 0.3, H / 2, OZ, block);
    k.box(DX0 - x0, H, 0.6, (x0 + DX0) / 2, H / 2, z1 - 0.3, brick);
    k.box(x1 - DX1, H, 0.6, (DX1 + x1) / 2, H / 2, z1 - 0.3, block);
    k.box(DX1 - DX0, H - 4.4, 0.6, (DX0 + DX1) / 2, 4.4 + (H - 4.4) / 2, z1 - 0.3, block);
    k.block(x0 - 0.4, x0 + 0.8, z0, z1); k.block(x0, x1, z0 - 0.4, z0 + 0.8); k.block(x1 - 0.8, x1 + 0.4, z0, z1); k.block(x0, DX0, z1 - 0.8, z1 + 0.4); k.block(DX1, x1, z1 - 0.8, z1 + 0.4);
    // the open gallery's two inner walls, a door through the west one into the hall
    k.box(0.4, H, 7.6, OX - 6, H / 2, OZ - 2.2, block); k.box(0.4, H, 1.6, OX - 6, H / 2, z1 - 0.8, block); k.box(0.4, H - 3.8, 2.8, OX - 6, 3.8 + (H - 3.8) / 2, OZ + 3, block);
    k.box(12, H, 0.4, OX, H / 2, OZ - 6, block);
    k.block(OX - 6.4, OX - 5.6, OZ - 6, OZ + 1.6); k.block(OX - 6.4, OX - 5.6, OZ + 4.4, z1); k.block(OX - 6, x1, OZ - 6.4, OZ - 5.6);
    // the roof, open over the corner gallery, with coping round the parapet
    k.box(OX - 6 - x0, 0.4, BD, (x0 + OX - 6) / 2, H + 0.2, BZ, block); k.box(x1 - OX + 6, 0.4, OZ - 6 - z0, (OX - 6 + x1) / 2, H + 0.2, (z0 + OZ - 6) / 2, block);
    k.box(BW + 0.3, 0.22, 0.9, BX, H + 0.5, z0 + 0.3, cap); k.box(BW + 0.3, 0.22, 0.9, BX, H + 0.5, z1 - 0.3, cap); k.box(0.9, 0.22, BD, x0 + 0.3, H + 0.5, BZ, cap); k.box(0.9, 0.22, BD, x1 - 0.3, H + 0.5, BZ, cap);
    for (let z = z0 + 2.2; z < z1 - 1; z += 3.2) { const e = z < OZ - 6 ? x1 - 0.6 : OX - 6.2; k.box(e - x0 - 0.6, 0.6, 0.36, (x0 + 0.6 + e) / 2, H - 0.3, z, block); }
    for (let z = z0 + 3.8; z < z1 - 2; z += 6.4) k.box(OX - 6 - x0 - 4, 0.05, 1.1, (x0 + OX - 6) / 2, H - 0.03, z, daylight);
    // factory sash windows in the brick, lit from inside by the day
    for (const x of [-30, -25]) sashWindow(k, x, 3.8, z1, 3.2, 3.8, 1, 0.6, sash, cap, glassOut, daylight, 5, 6);
    k.box(DX1 - DX0 + 1.6, 0.16, 1.8, BX + 4, 4.5, z1 + 0.9, sash);
    for (const s of [-1, 1]) { const d = k.box(1.9, 4, 0.06, BX + 4 + s * 2.2, 2.2, z1 + 0.95, k.glass(0xdcecf6, 0.14, 0.04)); d.rotation.y = s * 1.3; }
    k.sign('THE NOGUCHI MUSEUM', 5, 0.5, BX + 4, 5.2, BZ + BD / 2 + 0.36, 'transparent', '#1a1c20', 60, 0);
    k.egg(v(BX + 4, 6.2, BZ + BD / 2 + 0.8), { id: 'noguchi-living-artist', title: 'A museum by its own artist', year: '1985', text: 'In 1974 Noguchi bought a photogravure plant and a gas station across the street from the studio where he had lived and worked since 1961. The museum opened seasonally in 1985, the first museum of its kind established by a living artist in America.', clue: 'Read the name over the entrance.', source: { name: 'Noguchi Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/Noguchi_Museum' } }, { r: 1.6 });
    mlowBanner(k, BX - 2, 5.6, BZ + BD / 2 + 0.6, 0, 2.4, false);
    streetSign(k, 0.6, 27.6, 'VERNON BLVD', '33 RD');
    const IW = BW - 1.2, ID = BD - 1.2;
    k.box(IW, 0.3, ID, BX, 0.15, BZ, floorC);
    hsign(k, 'GALLERY 1', 1.8, 0.3, OX - 5.78, 5.4, OZ - 2.4, PI / 2, { fg: '#2a2c30', font: 'W2 JetBrains Mono', size: 0.62, lit: false });
    hsign(k, 'GALLERY 2', 1.8, 0.3, OX - 6.22, 5.4, OZ - 2.4, -PI / 2, { fg: '#2a2c30', font: 'W2 JetBrains Mono', size: 0.62, lit: false });
    /* Akari light sculptures hung in the hall: lathed washi shades with their bamboo ribs (instanced), each on its cord */
    { const prof = [[0.06, 0], [0.42, 0.08], [0.62, 0.3], [0.64, 0.55], [0.5, 0.82], [0.18, 1], [0.06, 1.02]], at = [[-28, -15, 1.5], [-21.5, -15, 1.9], [-9, -16, 1.6], [-9, -10, 1.2], [-28, -8, 1.3], [-21.5, -8, 1.7], [-28, -1, 1.6], [-21.5, 1, 1.2], [-25, 4.6, 1.4]], ribs: T.Matrix4[] = [];
      at.forEach(([x, z, h], i) => { const y = 5.2 - h * 0.3; k.lathe(prof.map(([r, yy]) => [r * h * 0.7, yy * h]), x, y, z, paper, 20); k.cyl(0.008, H - y - h, x, (H + y + h) / 2, z, dark, 0.008, 4);
        for (let j = 1; j < 12; j++) { const yy = j / 12, r = (() => { for (let q = 1; q < prof.length; q++) if (prof[q][1] >= yy) { const a = prof[q - 1], b = prof[q], t = (yy - a[1]) / (b[1] - a[1]); return a[0] + t * (b[0] - a[0]); } return 0.06; })() * h * 0.7; ribs.push(new T.Matrix4().compose(v(x, y + yy * h, z), new T.Quaternion().setFromAxisAngle(v(1, 0, 0), PI / 2), v(r, r, 1))); }
        if (i % 2 === 0) k.point(x, y + h * 0.5, z, 0xfff0d4, 10, 9); });
      k.instances(new T.TorusGeometry(1, 0.012, 4, 24), k.flat(0xc8b088, 0, 0.8), ribs); }
    // the stones of the first gallery on low hinoki plinths
    for (const [x, z, p, h] of [[-24, -10.5, 'noguchi_stone_1', 2.6], [-14, -16, 'noguchi_stone_2', 3.0], [-6, -12, 'noguchi_stone_3', 3.4], [-28, -2, 'noguchi_stone_2', 2.2]] as const) { k.box(1.8, 0.12, 1.8, x, 0.36, z, hinoki); k.prop(p, x, 0.42, z, { height: h, keepOut: 1.8 }); }
    k.prop('noguchi/ph_boulder_01', -12.5, 0.36, -9, { height: 1.1, rotY: 0.6, keepOut: 1.2 });
    // the open air gallery: raked gravel inside a granite kerb under the sky, one tall stone
    k.box(11.2, 0.06, 11.2, OX, 0.33, OZ, gravel); for (const [w, d, x, z] of [[11.4, 0.2, OX, OZ - 5.6], [11.4, 0.2, OX, OZ + 5.6], [0.2, 11.4, OX - 5.6, OZ], [0.2, 11.4, OX + 5.6, OZ]]) k.box(w, 0.14, d, x, 0.37, z, rail);
    const rake = k.flat(0xb8b2a6, 0, 1); for (let r = 2.4; r < 5.2; r += 0.45) k.mesh(new T.RingGeometry(r, r + 0.03, 64), rake, OX, 0.365, OZ).rotation.x = -PI / 2;
    k.prop('noguchi_stone_3', OX, 0.36, OZ, { height: 3.6, keepOut: 2 });
    k.egg(v(OX + 3, 2.4, OZ + 3), { id: 'noguchi-sunnyside', title: 'The years in Sunnyside', year: '2004', text: 'A $13.5 million master plan was approved in 1999, and while the building was rebuilt the museum moved temporarily to Sunnyside, Queens. It was chartered in February 2004 and came home in June 2004; a second $8 million stabilization project started in September 2008. Socrates Sculpture Park is one block away.', clue: 'Stand in the gallery with no roof.', source: { name: 'Noguchi Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/Noguchi_Museum' } }, { r: 1.6 });
    k.egg(v(-24, 3.4, -10.5), { id: 'noguchi-backwards', title: 'A visit that runs backwards', text: 'The galleries hold about 250 sculptures across two floors and twelve galleries. The visit begins with his late work, upright monoliths of granite and basalt, and moves back in time, so the early portrait busts and theater set objects wait at the rear of the second floor.', clue: 'Start at the tall dark stones in the first gallery.', source: { name: 'A Refuge From the Gallery Hunters, The Christian Science Monitor', url: 'https://www.csmonitor.com/1991/1016/16181.html' } }, { r: 1.6 });
    /* one trick (rule 9): the hall floor just inside the door is painted with a word that only stands up straight from the
       doorway, lying flat and stretched from anywhere else (egg noguchi-still) */
    if (HAS_DOM) anamorphTex(k, floorType('STILL', '#2a2c30'), OX - 7.6, OZ + 2.6, 3, 0.3, PI / 2, 3.2, 2.6, 1.2, 0.88);
    k.egg(v(OX - 11.6, 0.9, OZ + 2.6), { id: 'noguchi-still', title: 'A word that stands up', text: 'Just inside the hall a word is painted flat on the floor, stretched so far it only reads from the doorway, where it seems to stand upright. Painting a picture to be seen from one spot is called anamorphosis; Holbein hid a skull that way in The Ambassadors in 1533.', clue: 'Stand in the doorway from the open gallery and look down the hall.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.6 });
    // the garden: granite setts, stones, the katsura, bamboo along the wall, the water stone
    const GX = 14, GZ = -6, GW = 26, GD = 30;
    k.box(GW, 0.3, GD, GX, 0.15, GZ, rail);
    for (const s of [-1, 1]) { k.box(0.6, 4, GD, GX + s * GW / 2, 2, GZ, block); k.box(0.9, 0.2, GD + 0.6, GX + s * GW / 2, 4.1, GZ, cap); k.block(GX + s * GW / 2 - 0.6, GX + s * GW / 2 + 0.6, GZ - GD / 2, GZ + GD / 2); }
    k.box(GW, 4, 0.6, GX, 2, GZ - GD / 2, block); k.box(GW + 0.6, 0.2, 0.9, GX, 4.1, GZ - GD / 2, cap); k.block(GX - GW / 2, GX + GW / 2, GZ - GD / 2 - 0.6, GZ - GD / 2 + 0.6);
    for (const s of [-1, 1]) { k.box(GW / 2 - 1.4, 4, 0.6, GX + s * (GW / 4 + 0.7), 2, GZ + GD / 2, block); k.box(GW / 2 - 1.1, 0.2, 0.9, GX + s * (GW / 4 + 0.7), 4.1, GZ + GD / 2, cap); }
    k.block(GX - GW / 2, GX - 1.4, GZ + GD / 2 - 0.6, GZ + GD / 2 + 0.6); k.block(GX + 1.4, GX + GW / 2, GZ + GD / 2 - 0.6, GZ + GD / 2 + 0.6);
    hsign(k, 'THE GARDEN', 1.6, 0.28, GX + 3.4, 2.6, GZ + GD / 2 + 0.32, 0, { fg: '#2a2c30', font: 'W2 JetBrains Mono', size: 0.62, lit: false });
    const rnd = X.mulberry(107);
    for (const [x, z, p, h] of [[GX - 8, GZ - 8, 'noguchi_stone_1', 3.0], [GX + 6, GZ - 2, 'noguchi_stone_3', 4.0], [GX - 9, GZ + 12, 'noguchi_stone_2', 2.8]] as const) k.prop(p, x, 0.3, z, { height: h, keepOut: 2 });
    /* 2026-11-24 (wave 6b): scanned boulders (Poly Haven, CC0) lie among the carved stones, the way the real garden sets
       found rock beside worked basalt and granite */
    k.prop('noguchi/ph_namaqualand_boulder_02', GX - 4, 0.3, GZ + 6, { height: 1.2, rotY: 0.4, keepOut: 2 });
    k.prop('noguchi/ph_boulder_01', GX + 8, 0.3, GZ + 10, { height: 1.5, rotY: 2.1, keepOut: 1.6 });
    k.prop('noguchi/ph_namaqualand_boulder_05', GX + 10, 0.3, GZ - 5, { height: 0.8, rotY: -0.7, keepOut: 1.4 });
    k.tree(GX + 4, 0.3, GZ + 3, { kind: 'round', h: 9, r: 6, leaf: 0x8a9a5a, seed: 3 });
    for (const [x, z, sp, h] of [[GX + 9, GZ - 11, 'pine', 6], [GX - 10, GZ + 2, 'pine', 5], [GX + 3, GZ - 12, 'cherry', 5]] as const) { k.tree(x, 0.3, z, { h, r: 2.4, seed: x + z, species: sp }); k.keepOut.push({ x, z, r: 1.0 }); }
    /* the Tree of Heaven is gone; its stump (a Poly Haven scan) stays in the middle of the garden */
    k.prop('noguchi/ph_tree_stump_01', GX - 1, 0.3, GZ + 1, { height: 0.55, keepOut: 1.0 });
    k.egg(v(GX - 1, 1.2, GZ + 1), { id: 'noguchi-tree-of-heaven', title: 'The tree he would not cut', year: '2008', text: 'For decades the center of the garden was a 60 foot Tree of Heaven, about 75 years old, which predated the museum and which Noguchi spared when he bought the property. It was cut down in March 2008. Its wood went to the Detroit Tree of Heaven Woodshop, which made it into benches and sculptures.', clue: 'Find the old stump in the middle of the garden.', source: { name: 'Noguchi Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/Noguchi_Museum' } }, { r: 1.8 });
    /* bamboo along the east wall, one instanced draw for the culms and one for the leaf tufts */
    { const culms: T.Matrix4[] = [], tufts: T.Matrix4[] = [], up = v(0, 1, 0);
      for (let i = 0; i < 90; i++) { const z = GZ - GD / 2 + 1 + rnd() * (GD - 2), x = GX + GW / 2 - 0.8 - rnd() * 1.4, h = 4 + rnd() * 2.6, tilt = (rnd() - 0.5) * 0.08; culms.push(new T.Matrix4().compose(v(x, 0.3 + h / 2, z), new T.Quaternion().setFromAxisAngle(v(1, 0, 0), tilt), v(1, h, 1))); for (let j = 0; j < 3; j++) { const s = 0.5 + rnd() * 0.5; tufts.push(new T.Matrix4().compose(v(x + (rnd() - 0.5) * 0.8, 0.3 + h * (0.7 + j * 0.12), z + (rnd() - 0.5) * 0.8), new T.Quaternion().setFromAxisAngle(up, rnd() * 6), v(s, s * 0.6, s))); } }
      k.instances(new T.CylinderGeometry(0.035, 0.04, 1, 6), bamboo, culms); k.instances(new T.IcosahedronGeometry(0.6, 0), leaf, tufts); }
    // The Well, 1982: a six sided basalt block, water rising through its flat top and sliding evenly down every side
    k.mesh(new T.CircleGeometry(3.4, 48), gravel, GX - 6, 0.315, GZ - 2).rotation.x = -PI / 2;
    for (let r = 1.7; r < 3.4; r += 0.32) k.mesh(new T.RingGeometry(r, r + 0.03, 64), rake, GX - 6, 0.32, GZ - 2).rotation.x = -PI / 2;
    k.mesh(new T.CylinderGeometry(1.2, 1.25, 0.9, 6), basalt, GX - 6, 0.75, GZ - 2); k.mesh(new T.CylinderGeometry(1.21, 1.21, 0.04, 6), water, GX - 6, 1.21, GZ - 2); k.keepOut.push({ x: GX - 6, z: GZ - 2, r: 1.6 });
    const sheet = k.mesh(new T.CylinderGeometry(1.22, 1.27, 0.9, 6, 1, true), k.flat(0x8ab0c4, 0.4, 0.05, { transparent: true, opacity: 0.25 }), GX - 6, 0.75, GZ - 2, true);
    if (!ctx.reduced) k.ticks.push((t) => { (sheet.material as T.MeshStandardMaterial).opacity = 0.2 + 0.08 * Math.sin(t * 3); });
    k.egg(v(GX - 6, 1.6, GZ - 2), { id: 'noguchi-the-well', title: 'A basin that gives water away', year: '1982', text: 'The Well is a six sided basalt fountain from 1982, a variation on the Japanese tsukubai, the stone basin at a tea garden. Water rises through its flat top and flows evenly over every side. A traditional tsukubai collects water; Noguchi\'s releases it.', clue: 'Find the dark stone that is always wet.', source: { name: 'A Refuge From the Gallery Hunters, The Christian Science Monitor', url: 'https://www.csmonitor.com/1991/1016/16181.html' } }, { r: 1.4 });
    blossomGarden(k, GX, 0.15, GZ + GD / 2 - 6, 3.4, 1.4);
    for (const x of [GX - 8, GX + 8]) k.prop('museum_bench', x, 0.3, GZ - GD / 2 + 3, { height: 0.5, keepOut: 1.4 });
    k.egg(v(GX - 8, 1.0, GZ - GD / 2 + 3), { id: 'noguchi-railway-stones', title: 'Railway stones underfoot', text: 'The garden is paved with granite railway stones, and the low benches are granite and travertine that Noguchi made in the 1960s. The plantings he chose include katsura, Japanese black pines, cherry trees and bamboo.', clue: 'Sit on a low stone bench at the back of the garden.', source: { name: 'A Refuge From the Gallery Hunters, The Christian Science Monitor', url: 'https://www.csmonitor.com/1991/1016/16181.html' } }, { r: 1.4 });
    donorWall(k, GX, 2.6, GZ - GD / 2 + 0.42, 0, 8, false);
    eyeMedallion(k, BX + 4, 0.31, BZ + 6, 1.4);
    k.crowd([v(BX + 4, 0, BZ + BD / 2 + 8), v(BX + 4, 0.3, BZ + 9), v(OX - 9, 0.3, OZ + 3), v(BX, 0.3, BZ - 2), v(BX + 2, 0.3, BZ - 9), v(GX - 6, 0.3, GZ + 8), v(GX + 6, 0.3, GZ - 8)], 10, { seed: 152, speed: 0.25, spread: 1.6, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da] });
    k.censusWall({ x: BX - IW / 2 + 0.36, y: 7.0, z: BZ, rotY: PI / 2, cols: 24, rows: 4, tile: 0.5, gap: 0.05, start: ctx.wallStart(5200, 96), pieces: ctx.all, backing: dark });
    // the works: the concrete walls of the galleries, few and quiet, and the garden walls
    const mounts: Mount[] = [];
    for (let i = 0; i < 3; i++) { const z = BZ - 8 + i * 8; mounts.push({ position: v(BX - IW / 2 + 0.38, 3.2, z), rotation: PI / 2, target: v(BX, 2.6, z), width: 3.6, height: 2.4, style: 'none', wash: true }); }
    for (const x of [-10, -2, 8]) mounts.push({ position: v(BX + x, 3.2, BZ - ID / 2 + 0.38), rotation: 0, target: v(BX + x, 2.6, BZ - 4), width: 3.6, height: 2.4, style: 'none', wash: true });
    /* 2026-11-24 (wave 6b): the garden wall works looked at a spot inside the katsura and the stones; each now has its own
       stand three and a half metres off its wall */
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = GZ - 10 + i * 8; mounts.push({ position: v(GX + s * (GW / 2 - 0.38), 2.0, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(GX + s * (GW / 2 - 3.8), 1.8, z), width: 3.2, height: 2.0, style: 'none', wash: false }); }
    mounts.push({ position: v(OX - 5.78, 3.2, OZ - 2.2), rotation: PI / 2, target: v(OX - 2.6, 2.6, OZ - 2.6), width: 4.0, height: 2.6, style: 'none', wash: true });
    mounts.push({ position: v(OX, 3.2, OZ - 5.78), rotation: 0, target: v(OX + 2.6, 2.6, OZ - 2.6), width: 4.4, height: 2.8, style: 'none', wash: true });
    mounts.push({ position: v(OX - 6.22, 3.2, OZ - 2.6), rotation: -PI / 2, target: v(OX - 9.6, 2.6, OZ - 2.6), width: 3.6, height: 2.4, style: 'none', wash: true });
    mounts.push({ position: v(OX, 3.2, OZ - 6.22), rotation: PI, target: v(OX, 2.6, OZ - 9.8), width: 4.0, height: 2.4, style: 'none', wash: true });
    for (const x of [-6, 6]) mounts.push({ position: v(GX + x, 2.4, GZ - GD / 2 + 0.38), rotation: 0, target: v(GX + x, 2, GZ - GD / 2 + 4.4), width: 3.6, height: 2.2, style: 'none', wash: true });
    return { mounts, spawn: v(GX + 8, 3, GZ + GD / 2 - 2), look: v(GX - GW / 2 + 1, 2.4, GZ - 4), eye: 3, bounds: [BX - IW / 2 + 0.8, GX + GW / 2 - 0.8, BZ - BD / 2 + 1, 34], style: 'none' };
  },
};

/* ---------------- 108 SOCRATES SCULPTURE PARK ---------------- */
export const socrates: RoomDef = {
  id: 'socrates',
  name: 'Sculpture on the river',
  area: 'SOCRATES SCULPTURE PARK',
  mood: 'Wind off Hallets Cove',
  color: '#7aa07a',
  description: 'The reclaimed lot on the East River: big sculpture on the lawn, the cove and the island across the water, kayaks pulled up, the works standing in the open air.',
  signatures: 'The open waterfront lawn with monumental outdoor sculpture, the wooden studio shed and gate of found steel, the rocky shore and kayak launch, Roosevelt Island and the Manhattan skyline across the river.',
  build(k, ctx) {
    k.sky({ top: 0x5f94d8, horizon: 0xeef0ec, ground: 0x5a6a5a, fog: 0.0018, sun: { az: 4.0, el: 0.55, color: 0xfff4e6, size: 12 }, env: 1.0 });
    k.hemi(0xf2f6ff, 0x4a5a48, 0.95);
    k.sun(0xfff0dc, 2.4, -50, 60, 30, true, 100);
    /* 2026-11-24 (wave 6b): scanned CC0 surfaces (Poly Haven): meadow grass, a gravel path, rusted steel for the gate and
       the frames, weathered planks for the studio shed, cast concrete for the studio pad */
    const lawn = sc(k, 'socrates', 'lawn', 3.0, () => X.grass(0x4a7a3a, 189), { roughness: 1, color: 0xffffff }, 0x4a6a3a), gravel = sc(k, 'socrates', 'gravel', 1.6, () => X.cobble(0xa39a86, 190), { roughness: 1, color: 0xe0d8c8 }, 0x9a9282),
      steel = sc(k, 'socrates', 'rust', 1.6, () => X.steel(0x6a4a2a, true, 336), { metalness: 0.35, roughness: 0.8, color: 0xd8b8a0 }, 0x6a4a2a),
      wood = sc(k, 'socrates', 'planks', 1.8, () => X.planks(0x8a6a48, 5, 337), { roughness: 0.85, color: 0xffffff }, 0x8a7a68), dark = k.flat(0x1a1c20, 0.5, 0.6), white = k.flat(0xf4f0e8, 0.05, 0.6),
      pad = sc(k, 'socrates', 'quay', 2.4, () => X.concrete(0x9a9a94, 191), { roughness: 0.85, color: 0xd0ccc4 }, 0x8a8a84), red = k.flat(0xc4402a, 0.45, 0.5);
    k.box(160, 0.4, 120, 0, -0.2, 0, lawn);
    k.water({ y: -1.6, color: 0x2e4a5c, w: 600, d: 400, x: -250, z: 0, amp: 1.2 });
    /* 2026-11-24 (wave 6b): the shore was thirty grey dodecahedrons; now four scanned stretches of coastal rock (Poly Haven,
       CC0) run the length of the park at the water, with the kayak launch between them */
    many(k, 'socrates/ph_coast_rocks_01', { width: 34 }, [[-82, -1.0, -42, PI / 2], [-82, -1.05, 14, PI / 2 + 0.25]]);
    many(k, 'socrates/ph_coast_rocks_02', { width: 30 }, [[-83, -1.1, -14, -PI / 2], [-82, -1.15, 44, PI / 2 + 0.1]]);
    void hero(k, 'socrates/ph_lateral_sea_marker', { height: 4.2 }).then((h) => { if (!h || !k.live) return; h.position.set(-118, -2.3, 8); k.add(h); if (!ctx.reduced) k.ticks.push((t) => { h.position.y = -2.3 + Math.sin(t * 1.1) * 0.12; h.rotation.z = Math.sin(t * 0.8) * 0.05; }); });
    k.egg(v(-70, 1.2, -20), { id: 'socrates-sunswick', title: 'A creek under your feet', text: 'The park sits atop the mouth of Sunswick Creek, which is buried beneath it. Before the park the ground was an abandoned landfill and an illegal dumpsite on Gibbs Point in Astoria.', clue: 'Walk to the rocks at the water\'s edge.', source: { name: 'Socrates Sculpture Park, Wikipedia', url: 'https://en.wikipedia.org/wiki/Socrates_Sculpture_Park' } }, { r: 1.6 });
    k.egg(v(-66, 2.4, 20), { id: 'socrates-hell-gate', title: 'Looking at Hell Gate', text: 'The park looks across the East River at Hell Gate and the northern end of Roosevelt Island. Since it began, the park has shown work by more than one thousand artists, most of it large sculpture that could not fit indoors.', clue: 'Stand near the shore and look out over the river.', source: { name: 'Socrates Sculpture Park, Six to Celebrate, Historic Districts Council', url: 'https://6tocelebrate.org/site/socrates-sculpture-park/' } }, { r: 1.6 });
    k.skyline({ z: 0, count: 24, spacing: 7, scale: 4.4, base: -1.6, seed: 339, lit: 0.2, glow: 0.4, tint: 0x6e7684, x: -420, spires: true });
    k.box(40, 3, 200, -150, -0.3, 0, k.pbr('scIsland', X.grass(0x4a6a3a, 191), 0.06)); for (let i = 0; i < 6; i++) k.box(12, 30 + i * 4, 12, -150, 15 + i * 2, -80 + i * 32, k.pbr('scTowers', X.windows(340, 0.3, 0x8a8478, true), 0.12, { emissive: 0xffffff, emissiveIntensity: 0.4, stretch: 0.42 }));
    street(k, { w: 16, len: 140, z: 0, x: 88 });
    blockFront(k, { x: 100, z0: 60, count: 10, face: -1, seed: 341, h: [8, 14] });
    // the gate of found steel, the studio shed, the gravel path
    for (const s of [-1, 1]) { k.box(1.2, 6, 1.2, 76, 3, s * 4, steel); }
    k.box(10, 1.2, 1.2, 76, 6.6, 0, steel); k.sign('SOCRATES SCULPTURE PARK', 8, 0.8, 75.35, 6.6, 0, 'transparent', '#f4f0e8', 70, -PI / 2);
    k.block(60, 78, 4.6, 60); k.block(60, 78, -60, -4.6);
    streetSign(k, 80.6, 6.2, 'BROADWAY', 'VERNON BLVD');
    // the entrance billboard on Vernon Boulevard, an artwork of its own since 1999, changed once or twice a year
    for (const z of [-15.5, -8.5]) k.box(0.4, 7.6, 0.4, 78.6, 3.8, z, steel);
    k.box(0.3, 4.2, 8.4, 78.6, 5.6, -12, dark);
    /* 2026-11-24 (wave 6b): the yellow board carries a Firefly painted billboard work when it lands (FIREFLY_QUEUE) */
    fireflyPlate(k, 'assets/museum/tex/socrates/ff_socrates_billboard.webp', 8.0, 3.8, 78.79, 5.6, -12, PI / 2, k.flat(0xe8c43a, 0, 0.6), true);
    k.egg(v(77.6, 5.6, -12), { id: 'socrates-billboard', title: 'The billboard is a sculpture', year: '1999', text: 'The big billboard at the entrance has been an ongoing installation since 1999, with one or two new works a year that point to the shows inside. It was first built by Ross H. Radtke, a neighbor and volunteer mechanical engineer.', clue: 'Look at the billboard on its posts beside the gate.', source: { name: 'Socrates Sculpture Park, Wikipedia', url: 'https://en.wikipedia.org/wiki/Socrates_Sculpture_Park' } }, { r: 1.8 });
    k.egg(v(75.4, 7.6, 0), { id: 'socrates-name', title: 'Why Socrates', text: 'The coalition that made the park named it after the Greek philosopher Socrates, who lived from 469 to 399 B.C., and in honor of the large Greek community of neighboring Astoria.', clue: 'Read the name over the steel gate.', source: { name: 'Socrates Sculpture Park, Six to Celebrate, Historic Districts Council', url: 'https://6tocelebrate.org/site/socrates-sculpture-park/' } }, { r: 1.6 });
    k.box(6, 0.3, 140, 40, 0.05, 0, gravel);
    k.box(14, 6, 10, 50, 3, -40, wood); k.mesh(new T.ConeGeometry(10, 3, 4), k.flat(0x4a4a48, 0, 0.9), 50, 7.5, -40).rotation.y = PI / 4; k.block(43, 57, -45, -35);
    hsign(k, 'OUTDOOR STUDIO', 4.4, 0.5, 50, 4.9, -34.96, 0, { fg: '#f4f0e8', bg: '#1a1c20', size: 0.6 });
    mlowBanner(k, 42.8, 3.6, -40, -PI / 2, 2.8, true);
    /* the outdoor studio: a real gantry crane (Poly Haven, CC0) over a concrete pad, a steel piece half made under its hook */
    k.box(16, 0.12, 7, 50, 0.06, -26, pad);
    void hero(k, 'socrates/ph_overhead_crane', { height: 5.2 }).then((h) => { if (!h || !k.live) return; h.position.set(50, 0.1, -26); k.add(h); });
    for (const sx of [-1, 1]) k.keepOut.push({ x: 50 + sx * 6.1, z: -26, r: 1.4 });
    for (let i = 0; i < 4; i++) { const b = k.box(4.4 - i * 0.6, 0.36, 0.36, 50, 0.32 + i * 0.36, -26 + (i % 2 ? 0.2 : -0.2), steel); b.rotation.y = i * 0.35; }
    k.keepOut.push({ x: 50, z: -26, r: 2.4 });
    // the big sculptures: the Blender kit's bronzes and stones at outdoor scale, the eye monument, the blossom garden
    k.egg(v(-10, 3, -16), { id: 'socrates-di-suvero', title: 'Made by sculptors, from a dump', year: '1986', text: 'The sculptor Mark di Suvero created the park on the old dump in 1986. It is about four acres, the largest outdoor space in New York City dedicated to showing sculpture, and about 89,000 people visit a year. In 2018 Virginia Overton became the first woman to have a solo exhibition here.', clue: 'Stand under the tall hanging mobile on the lawn.', source: { name: 'Socrates Sculpture Park, Wikipedia', url: 'https://en.wikipedia.org/wiki/Socrates_Sculpture_Park' } }, { r: 1.6 });
    k.egg(v(40, 1.6, -64), { id: 'socrates-1998', title: 'Saved from a marina', year: '1998', text: 'For its first 14 years the park had only temporary city park status on a short term lease. When a developer moved to build luxury apartments and a marina on the site, Mayor Rudolph Giuliani made it a permanent city park in 1998.', clue: 'Find the long dark wall at the far end of the gravel path.', source: { name: 'Socrates Sculpture Park, Wikipedia', url: 'https://en.wikipedia.org/wiki/Socrates_Sculpture_Park' } }, { r: 1.6 });
    k.prop('mobile', -10, 0, -20, { height: 12, keepOut: 1 }).then((o) => { if (o && !ctx.reduced) k.ticks.push((t) => { o.rotation.y = t * 0.06; }); });
    k.prop('bronze_figure', 10, 0, 10, { height: 7, keepOut: 2 });
    k.prop('noguchi_stone_3', -30, 0, 20, { height: 6, keepOut: 3 }); k.prop('noguchi_stone_1', -40, 0, -30, { height: 5, keepOut: 3 });
    k.prop('armillary', 20, 0, -30, { height: 6, keepOut: 2 });
    k.prop('equestrian', 0, 0, 40, { height: 6, rotY: PI / 2, keepOut: 3 });
    /* 2026-11-24 (wave 6b): three more monumental pieces, real scanned bronzes and a cast concrete cat (Poly Haven, CC0),
       blown up to lawn scale on concrete plinths */
    k.box(2.4, 1.0, 5.6, -12, 0.5, 22, pad); k.prop('socrates/ph_bronze_shark_statue', -12, 1.0, 22, { height: 2.6, rotY: 0.2, keepOut: 3.2 });
    k.box(3.4, 0.6, 3.4, -40, 0.3, 8, pad); k.prop('socrates/ph_bronze_whale_statue', -40, 0.6, 8, { height: 5.2, rotY: 2.4, keepOut: 2.6 });
    k.box(3.0, 0.5, 3.0, 16, 0.25, -12, pad); k.prop('socrates/ph_concrete_cat_statue', 16, 0.5, -12, { height: 3.6, rotY: -0.8, keepOut: 2.2 });
    /* one trick (rule 9): an impossible triangle in di Suvero red. Three straight beams at right angles, the last one coming
       straight back at you, so from one spot on the lawn (the red disc) its two ends meet and it closes into a triangle
       that cannot exist (egg socrates-impossible-triangle) */
    { const L = 4.2, t = 0.55, E = v(18, 3, 18), dir = v(1, Math.sin(0.17), 0).normalize(), q0 = new T.Quaternion().setFromUnitVectors(v(1, 1, 1).normalize(), dir), pts = [v(0, 0, 0), v(L, 0, 0), v(L, L, 0), v(L, L, L)];
      let bq = q0, bm = -1e9;
      for (let i = 0; i < 96; i++) { const q = new T.Quaternion().setFromAxisAngle(dir, (i / 96) * PI * 2).multiply(q0); const m = Math.min(...pts.map((p) => p.clone().applyQuaternion(q).y)); if (m > bm) { bm = m; bq = q; } }
      const P0y = 0.32 + t / 2 - bm, u = (E.y - P0y) / dir.y, P0 = v(E.x - u * dir.x, P0y, E.z - u * dir.z);
      const g = new T.Group(); g.position.copy(P0); g.quaternion.copy(bq);
      for (const [a, b] of [[0, 1], [1, 2], [2, 3]]) { const d = pts[b].clone().sub(pts[a]), len = d.length() + t, m = new T.Mesh(new T.BoxGeometry(Math.abs(d.x) > 0.1 ? len : t, Math.abs(d.y) > 0.1 ? len : t, Math.abs(d.z) > 0.1 ? len : t), red); m.position.copy(pts[a].clone().add(pts[b]).multiplyScalar(0.5)); m.castShadow = m.receiveShadow = k.o.quality === 'high'; g.add(m); }
      k.add(g);
      const low = pts.map((p) => p.clone().applyQuaternion(bq).add(P0)).sort((a, b) => a.y - b.y)[0];
      k.box(1.0, Math.max(0.1, low.y - t / 2), 1.0, low.x, Math.max(0.1, low.y - t / 2) / 2, low.z, pad);
      const c = pts.reduce((s, p) => s.add(p.clone().applyQuaternion(bq)), v(0, 0, 0)).multiplyScalar(0.25).add(P0); k.keepOut.push({ x: c.x, z: c.z, r: 3.6 });
      k.mesh(new T.CircleGeometry(0.7, 32), red, E.x, 0.03, E.z).rotation.x = -PI / 2;
      k.cyl(0.04, 1.1, E.x + 1.1, 0.55, E.z + 0.6, dark, 0.04, 6); hsign(k, 'STAND ON THE DISC', 1.4, 0.28, E.x + 1.1, 1.2, E.z + 0.64, PI / 2, { fg: '#f4f0e8', bg: '#1a1c20', size: 0.56 });
      k.egg(v(E.x - 4, 2.2, E.z), { id: 'socrates-impossible-triangle', title: 'The triangle that cannot be', year: '1958', text: 'From the red disc the three red beams close into a triangle whose corners all turn the wrong way. Walk off the disc and it opens into three straight beams at right angles. The impossible triangle was drawn by Oscar Reutersvard in 1934 and made famous by the mathematician Roger Penrose in 1958; built versions only work from one viewpoint.', clue: 'Stand on the red disc on the lawn and look at the red beams.', source: { name: 'Penrose triangle, Wikipedia', url: 'https://en.wikipedia.org/wiki/Penrose_triangle' } }, { r: 1.8 }); }
    eyeMonument(k, -20, 0, 50, PI * 0.9, 8);
    blossomGarden(k, 30, 0, 44, 7, 3.2);
    /* the kayak launch: two hulls pulled up on the grass, picnic tables (Poly Haven, CC0) by the water */
    for (const [x, z, c] of [[-60, 30, 0xe84a2a], [-60, -10, 0xf1c531]] as const) { const hull = k.mesh(new T.SphereGeometry(1, 20, 10), k.flat(c, 0.1, 0.45), x, 0.22, z); hull.scale.set(0.36, 0.2, 1.75); k.mesh(new T.TorusGeometry(0.22, 0.04, 6, 16), dark, x, 0.4, z + 0.1).rotation.x = PI / 2; k.keepOut.push({ x, z, r: 1.8 }); }
    k.cyl(0.05, 2.2, -63, 1.1, 10, dark, 0.05, 6); hsign(k, 'KAYAK LAUNCH', 1.8, 0.34, -63, 2.0, 10.06, 0, { fg: '#f4f0e8', bg: '#1f5a3a', border: '#f4f0e8', size: 0.56 }); k.keepOut.push({ x: -63, z: 10, r: 0.3 });
    many(k, 'socrates/ph_wooden_picnic_table', { height: 0.75 }, [[-52, 0, 40, 0.3], [-46, 0, 46, -0.2], [-52, 0, -40, 0.1], [-46, 0, -34, 1.4]]);
    for (const [x, z] of [[-52, 40], [-46, 46], [-52, -40], [-46, -34]]) k.keepOut.push({ x, z, r: 1.8 });
    for (let i = 0; i < 6; i++) { const rnd = X.mulberry(120 + i); k.tree(-20 + rnd() * 80, 0, -55 + rnd() * 110, { kind: 'round', h: 6 + rnd() * 4, r: 3 + rnd() * 2, leaf: 0x4a7a3c, seed: i }); }
    k.crowd([v(40, 0, 60), v(30, 0, 20), v(-10, 0, 0), v(-40, 0, -20), v(10, 0, -50), v(40, 0, -30)], 22, { seed: 153, speed: 0.4, spread: 3, animate: !ctx.reduced, closed: true });
    donorWall(k, 40, 2.4, -70 + 0.42, 0, 10, false); k.box(12, 4, 0.6, 40, 2, -70, dark);
    k.censusWall({ x: 40, y: 2.0, z: 69.58, rotY: PI, cols: 30, rows: 3, tile: 0.55, gap: 0.05, start: ctx.wallStart(6000, 90), pieces: ctx.all, backing: dark }); k.box(18, 4, 0.6, 40, 2, 70, dark);
    // the works: free standing steel frames across the lawn, each facing the path, plus the shed and the gate flanks
    const mounts: Mount[] = [];
    for (let i = 0; i < 12; i++) { const rnd = X.mulberry(160 + i); const x = -50 + (i % 4) * 26 + (rnd() - 0.5) * 6, z = -45 + Math.floor(i / 4) * 40 + (rnd() - 0.5) * 8; const rot = Math.atan2(40 - x, -z) + (rnd() - 0.5) * 0.6; const f = k.box(5, 3.4, 0.2, x, 2.2, z, steel); f.rotation.y = rot; for (const dx of [-2.3, 2.3]) k.box(0.2, 4.4, 0.2, x + Math.cos(rot) * dx, 2.2, z - Math.sin(rot) * dx, steel); k.keepOut.push({ x, z, r: 2.8 }); mounts.push({ position: v(x + Math.sin(rot) * 0.12, 2.3, z + Math.cos(rot) * 0.12), rotation: rot, target: v(x + Math.sin(rot) * 8, 2.3, z + Math.cos(rot) * 8), width: 4.4, height: 2.7, style: 'steel', wash: false }); }
    /* 2026-11-24 (wave 6b): the three works on the shed faced into its wall; they face the path now */
    for (let i = 0; i < 3; i++) { const z = -44 + i * 4; mounts.push({ position: v(42.88, 2.6, z), rotation: -PI / 2, target: v(36, 2.4, z), width: 3.2, height: 2.0, style: 'steel', wash: false }); }
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = s * (10 + i * 10); k.box(0.2, 3.2, 4.6, 75.8, 2.0, z, steel); mounts.push({ position: v(75.68, 2.1, z), rotation: -PI / 2, target: v(57, 2, z), width: 4.2, height: 2.5, style: 'steel', wash: false }); }
    return { mounts, spawn: v(70, 3, 0), look: v(-20, 6, 0), eye: 3, bounds: [-70, 76, -68, 68], style: 'steel' };
  },
};

/* ---------------- 109 THE BROOKLYN MUSEUM ---------------- */
export const brooklynmuseum: RoomDef = {
  id: 'brooklynmuseum',
  name: 'The Beaux-Arts Court',
  area: 'THE BROOKLYN MUSEUM',
  mood: 'First Saturday',
  color: '#c8b8a0',
  description: 'The glass pavilion and the great stepped plaza with its fountain, then the third floor court: glass floor, columns on two levels, the skylight, the works around the balcony.',
  signatures: 'The McKim Mead and White facade with its six column Ionic portico, pediment and cornice figures, the 2004 glass entrance pavilion, the fanned plaza steps and the jet fountains, the Beaux-Arts Court with its translucent glass floor, arcaded gallery and skylight, the museum\'s Rodin bronzes.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad8, horizon: 0xeef0ec, ground: 0x6a6a66, fog: 0.0018, sun: { az: 3.0, el: 0.85, color: 0xfff6e8, size: 12 }, env: 1.0 });
    k.hemi(0xf2f6ff, 0x5a5a58, 0.95);
    k.sun(0xfff2dc, 2.4, 20, 90, 40, true, 120);
    /* 2026-11-24 (wave 6b): scanned CC0 surfaces (Poly Haven): pale limestone ashlar, white marble, terrazzo, lime plaster,
       granite paving for the plaza */
    const lime = sc(k, 'brooklynmuseum', 'lime', 3.2, () => X.ashlar(0xd8d0bc, 342, 4), { roughness: 0.85, color: 0xffffff }, 0xb8b0a0), glass = k.glass(0xdcecf6, 0x14 / 255 + 0.06, 0.04), steel = k.flat(0x8c98a4, 0.9, 0.3), dark = k.flat(0x1a1c20, 0.5, 0.6),
      plaster = sc(k, 'brooklynmuseum', 'plaster', 2.6, () => X.plaster(0xe8e2d4, 192), { roughness: 0.9, color: 0xffffff }, 0xd8d2c4), waterM = k.flat(0x88aacc, 0.3, 0.2, { transparent: true, opacity: 0.6 }), bronze = k.flat(0x3a3028, 0.7, 0.45),
      marble = sc(k, 'brooklynmuseum', 'marble', 1.4, () => X.marble(0xe8e4dc, 0x9a948a, 19), { roughness: 0.3, color: 0xffffff }, 0xe0dcd4), terr = sc(k, 'brooklynmuseum', 'terrazzo', 2.0, () => X.terrazzo(0xc8c0b0, 194), { roughness: 0.4, color: 0xffffff }, 0xc8c0b0),
      granite = sc(k, 'brooklynmuseum', 'plaza', 2.2, () => X.pavers(0xb8b0a0, 193), { roughness: 0.8, color: 0xffffff }, 0xa8a49c), shadowL = k.flat(0x4a4438, 0, 0.9);
    /* the court's floor of glass block: a lit grid of squares, not a white sheet that blooms */
    const floorG = HAS_DOM ? new T.MeshStandardMaterial({ map: (() => { const t = paintTex(512, 512, (g) => { g.fillStyle = '#6a7278'; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const gr = g.createLinearGradient(i * 64, j * 64, i * 64 + 64, j * 64 + 64); gr.addColorStop(0, '#c4ccd2'); gr.addColorStop(0.5, '#9aa8b2'); gr.addColorStop(1, '#b8c2c8'); g.fillStyle = gr; g.fillRect(i * 64 + 5, j * 64 + 5, 54, 54); } }); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(17, 15); return t; })(), roughness: 0.22, metalness: 0.1 }) : k.flat(0xe8ecf0, 0.05, 0.3);
    street(k, { w: 30, len: 200, z: 60, x: 0 });
    blockFront(k, { x: 70, z0: 140, count: 10, face: -1, seed: 343, h: [12, 22] });
    k.box(120, 0.3, 40, 0, 0.05, 36, granite);
    for (let i = 0; i < 8; i++) k.box(70 + i * 4, 0.3, 1.4, 0, 0.2 + i * 0.3, 30 - i * 1.4, lime);
    /* the jets rise from a dark granite strip flush with the plaza, each from a bronze nozzle */
    k.box(50, 0.02, 1.6, 0, 0.21, 40, k.flat(0x2a2c30, 0.3, 0.25));
    const jets: T.Mesh[] = []; for (let i = 0; i < 24; i++) { const x = -22 + i * 2; jets.push(k.mesh(new T.CylinderGeometry(0.06, 0.16, 3, 6), waterM, x, 1.6, 40, true)); k.cyl(0.1, 0.06, x, 0.24, 40, bronze, 0.1, 8); }
    if (!ctx.reduced) k.ticks.push((t) => jets.forEach((j, i) => { j.scale.y = Math.max(0.05, Math.sin(t * 2 + i * 0.4)); }));
    const FZ = 16, FW = 100, FH = 24;
    /* 2026-11-24 (wave 6b): the building was one solid box 60 m deep, so the lobby sat inside it behind a blank wall and
       the pavilion looked at stone. The mass is split now so the lobby opens through the facade: the main block behind,
       wings either side, a solid band over the lobby, and a rusticated base under it all. */
    k.box(FW, FH, 47, 0, FH / 2 + 2.4, -20.5, lime);
    for (const s of [-1, 1]) { k.box(28.4, FH, 13, s * 35.8, FH / 2 + 2.4, 9.5, lime); k.box(28.4, 2.4, 13, s * 35.8, 1.2, 9.5, shadowL); k.box(2.6, 8, 0.6, s * 20.3, 4, FZ - 0.3, lime); k.box(0.4, 8, 13, s * 19.2, 4, FZ - 6.5, plaster); }
    k.box(43.2, FH + 2.4 - 8, 10.6, 0, 8 + (FH + 2.4 - 8) / 2, FZ - 5.3, lime);
    k.box(FW, 2.4, 47, 0, 1.2, -20.5, shadowL);
    for (let y = 0.6; y < 2.4; y += 0.6) for (const s of [-1, 1]) k.box(28.4, 0.06, 0.06, s * 35.8, y, FZ + 0.03, dark);
    k.moulding(scaleProfile(CORNICE, 2), FW + 0.4, 0, FH + 2.4 - 1.2, FZ, lime, -PI / 2);
    k.box(FW + 0.2, 0.5, 0.4, 0, 8.25, FZ + 0.2, lime); for (const s of [-1, 1]) k.box(28.6, 0.3, 0.3, s * 35.8, 2.55, FZ + 0.15, lime);
    /* the wings: tall windows with deep reveals, stone surrounds and cornice heads, one floor over another */
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const x = s * (26 + i * 8.6); for (const [y, h] of [[5.0, 3.6], [14.2, 7.2]] as const) { k.box(2.6, h, 0.3, x, y, FZ - 0.05, dark); k.box(2.6, h, 0.06, x, y, FZ + 0.02, glass); for (const sx of [-1, 1]) k.box(0.4, h + 0.4, 0.5, x + sx * 1.5, y, FZ + 0.18, lime); k.box(3.8, 0.24, 0.7, x, y - h / 2 - 0.2, FZ + 0.3, lime); k.moulding(scaleProfile(CORNICE, 0.8), 3.8, x, y + h / 2 + 0.2, FZ + 0.05, lime, -PI / 2); } }
    // the central portico: six Ionic columns under a pediment (McKim, Mead and White, 1897)
    for (let i = 0; i < 6; i++) { const x = -20 + i * 8; k.column(x, 2.6, FZ + 1.4, 16.2, 1.1, lime, true); k.prop('ionic_capital', x, 18.8, FZ + 1.4, { height: 1.9 }); }
    k.box(FW, 2.6, 5, 0, 22, FZ + 1.4, lime);
    const ped = new T.Shape(); ped.moveTo(-27, 0); ped.lineTo(27, 0); ped.lineTo(0, 6.5); ped.closePath(); k.mesh(new T.ExtrudeGeometry(ped, { depth: 5, bevelEnabled: false }), lime, 0, 23.3, FZ - 1);
    for (let i = 0; i < 10; i++) { const x = -40 + i * 8.8; k.box(2.4, 5, 1.4, x, FH + 2.4 + 2.5, FZ - 30 + 30, lime); k.prop('bronze_figure', x, FH + 2.4 + 5, FZ, { height: 3 }); }
    k.box(40, 8, 14, 0, 4, FZ + 5, glass); for (let x = -20; x <= 20; x += 4) k.box(0.3, 8, 0.3, x, 4, FZ + 12, steel); k.box(42, 0.4, 16, 0, 8.2, FZ + 5, steel);
    k.box(6, 5, 0.2, 0, 2.5, FZ + 12, k.glass(0xdcecf6, 0.14, 0.04)); k.block(-50, -3, FZ + 11.6, FZ + 12.4); k.block(3, 50, FZ + 11.6, FZ + 12.4);
    hsign(k, 'ENTRANCE', 3.2, 0.42, 0, 5.4, FZ + 12.22, 0, { fg: '#f4f0e8', bg: '#1a1c20', size: 0.56 });
    k.sign('BROOKLYN MUSEUM', 16, 1.4, 0, 21.2, FZ + 4, 'transparent', '#3a3020', 110, 0);
    // Daniel Chester French's Brooklyn and Manhattan, moved here from the Manhattan Bridge approach in 1963
    for (const sx of [-1, 1]) { k.box(3.2, 2.4, 3.2, sx * 17, 1.2, 50, lime); k.keepOut.push({ x: sx * 17, z: 50, r: 2.4 }); k.prop('bronze_figure', sx * 17, 2.4, 50, { height: 3.4, rotY: 0 }); }
    k.egg(v(17, 4.2, 51.8), { id: 'brooklynmuseum-manhattan-bridge', title: 'Two statues from a bridge', year: '1963', text: 'The two big allegorical figures, Brooklyn and Manhattan, were designed by Daniel Chester French and made in 1916 for the Brooklyn approach of the Manhattan Bridge. They were moved to the museum in 1963. French also made the sculpture in the museum\'s pediment.', clue: 'Look at the two figures on their pedestals at the front of the plaza.', source: { name: 'Brooklyn Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn_Museum' } }, { r: 1.8 });
    k.egg(v(0, 27, FZ + 3), { id: 'brooklynmuseum-movie-set', title: 'A sixth of a museum', year: '1928', text: 'McKim, Mead and White planned a building many times this size; what stands is about one sixth of it, and the Daily News once compared it to a movie set because nothing was built behind the west wing. Of 80 cornice statues planned, construction stopped in 1928 with only 28 installed. Thirty figures survive today.', clue: 'Look up at the statues standing along the roofline.', source: { name: 'Brooklyn Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn_Museum' } }, { r: 2.0 });
    k.egg(v(-8, 4.4, FZ + 12.6), { id: 'brooklynmuseum-pavilion', title: 'Glass where the stairs were', year: '2004', text: 'James Polshek\'s glass entrance pavilion, with its four metal pylons and a semicircular plaza, was finished in April 2004 as part of a $63 million project that also air conditioned the whole building.', clue: 'Stand at the glass doors of the entrance pavilion.', source: { name: 'Brooklyn Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn_Museum' } }, { r: 1.6 });
    k.egg(v(-30, 2.6, 27), { id: 'brooklynmuseum-lost-staircase', title: 'The staircase they took away', year: '1935', text: 'The museum opened in 1897 with grand main steps on Eastern Parkway. NYC Parks approved removing the steps in May 1934 and a remodeled ground level entrance was dedicated on October 5, 1935; the National Register listing dates the removal to 1936 and 1937. The Eastern Parkway front is 510 feet wide.', clue: 'Climb the low steps at the edge of the plaza.', source: { name: 'Brooklyn Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn_Museum' } }, { r: 1.6 });
    mlowBanner(k, -22, 12, FZ + 4.2, 0, 3.6, true); blossomFlag(k, 22, 12, FZ + 4.2, 0, 3.0, 5, 'electric');
    /* Eastern Parkway: cast iron street lamps (Poly Haven, CC0) along the plaza, the subway stair with its green globes,
       and two painted exhibition banners on the wings (Firefly, queued) */
    many(k, 'brooklynmuseum/ph_street_lamp_01', { height: 4.8 }, [[-44, 0.2, 52, 0], [-28, 0.2, 52, 0], [28, 0.2, 52, 0], [44, 0.2, 52, 0], [-52, 0.2, 30, PI / 2], [52, 0.2, 30, -PI / 2]]);
    for (const [x, z] of [[-44, 52], [-28, 52], [28, 52], [44, 52], [-52, 30], [52, 30]]) k.keepOut.push({ x, z, r: 0.5 });
    { const SX = -36, SZ = 44; k.box(2.8, 0.05, 6, SX, 0.22, SZ, k.flat(0x0a0a0c, 0, 1)); for (const sx of [-1, 1]) { k.box(0.08, 1.0, 6, SX + sx * 1.45, 0.7, SZ, k.flat(0x1e3a2a, 0.6, 0.4)); k.cyl(0.05, 2.4, SX + sx * 1.45, 1.2, SZ + 3, k.flat(0x1e3a2a, 0.6, 0.4), 0.05, 8); k.sphere(0.24, SX + sx * 1.45, 2.6, SZ + 3, k.glow(0x4ad878, 0.95), 14); }
      for (let i = 0; i < 10; i++) k.box(2.6, 0.2, 0.5, SX, 0.12 - i * 0.24, SZ - 2.6 + i * 0.5, k.flat(0x6a6a66, 0, 0.9));
      hsign(k, 'EASTERN PKWY  BROOKLYN MUSEUM', 3.2, 0.4, SX, 1.5, SZ + 3.04, 0, { fg: '#ffffff', bg: '#111214', size: 0.5 });
      k.block(SX - 1.6, SX + 1.6, SZ - 3.2, SZ + 3.2); }
    for (const s of [-1, 1]) fireflyPlate(k, 'assets/museum/tex/brooklynmuseum/ff_brooklynmuseum_banner.webp', 3.0, 8.0, s * 30.3, 14.2, FZ + 0.6, 0, k.pbr('bmBanner', X.velvet(0x8a2a2a), 0.6));
    // the lobby, the escalator ramp up, the court on the third floor with its glass floor and arcades
    k.box(38, 0.3, 24, 0, 0.15, FZ - 1, terr); k.block(-19.4, -18.6, FZ - 13, FZ + 12); k.block(18.6, 19.4, FZ - 13, FZ + 12);
    /* the lobby gets a coffered ceiling and marble pilasters (it had none, and looked up into the building's inside) */
    k.box(38.8, 0.4, 13.4, 0, 8.2, FZ - 6.5, plaster);
    { const cof: T.Matrix4[] = []; for (let x = -16; x <= 16; x += 4) for (let z = FZ - 11.5; z <= FZ - 1.5; z += 2.5) cof.push(new T.Matrix4().makeTranslation(x, 7.85, z)); k.instances(new T.BoxGeometry(3.4, 0.3, 2.0), k.flat(0xe8e2d6, 0, 0.9), cof); }
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) k.box(0.9, 8, 0.6, s * 18.6, 4, FZ - 11 + i * 4.5, marble);
    for (let x = -12; x <= 12; x += 8) k.point(x, 6.8, FZ - 6.5, 0xfff2dc, 14, 12);
    for (let i = 0; i < 30; i++) k.box(4, 0.4, 1.0, 14, 0.2 + i * 0.4, FZ - 14 - i * 1.0, steel);
    k.block(11.8, 16.2, FZ - 44, FZ - 13.5);
    const CY = 12, CX = 0, CZ = FZ - 30, CW = 34, CD = 30;
    k.box(CW, 0.3, CD, CX, CY, CZ, floorG);
    k.box(CW + 8, 0.4, CD + 8, CX, CY - 0.3, CZ, marble);
    for (const s of [-1, 1]) { k.box(0.6, 12, CD + 8, CX + s * (CW / 2 + 4), CY + 6, CZ, lime); k.block(CX + s * (CW / 2 + 4) - 0.6, CX + s * (CW / 2 + 4) + 0.6, CZ - CD / 2 - 4, CZ + CD / 2 + 4); }
    k.box(CW + 8, 12, 0.6, CX, CY + 6, CZ - CD / 2 - 4, lime); k.block(CX - CW / 2 - 4, CX + CW / 2 + 4, CZ - CD / 2 - 4.6, CZ - CD / 2 - 3.4);
    k.box(CW + 8, 12, 0.6, CX, CY + 6, CZ + CD / 2 + 4, lime); k.block(CX - CW / 2 - 4, 11.8, CZ + CD / 2 + 3.4, CZ + CD / 2 + 4.6); k.block(16.2, CX + CW / 2 + 4, CZ + CD / 2 + 3.4, CZ + CD / 2 + 4.6);
    for (const s of [-1, 1]) { k.arcade(CD, 5.6, 1.0, 5, 4.4, 4.6, CX + s * (CW / 2 + 0.5), CY, CZ, plaster, PI / 2, false); k.arcade(CD, 5.6, 1.0, 5, 4.4, 4.6, CX + s * (CW / 2 + 0.5), CY + 6, CZ, plaster, PI / 2, false); k.box(3.4, 0.4, CD + 8, CX + s * (CW / 2 + 2.2), CY + 6, CZ, plaster); k.box(3.4, 0.4, CD + 8, CX + s * (CW / 2 + 2.2), CY, CZ, plaster); }
    k.arcade(CW, 5.6, 1.0, 5, 5, 4.6, CX, CY, CZ - CD / 2 - 0.5, plaster, 0, false); k.arcade(CW, 5.6, 1.0, 5, 5, 4.6, CX, CY + 6, CZ - CD / 2 - 0.5, plaster, 0, false);
    k.box(CW + 8, 0.4, 3.4, CX, CY + 6, CZ - CD / 2 - 2.2, plaster); k.box(CW + 8, 0.4, 3.4, CX, CY, CZ - CD / 2 - 2.2, plaster);
    /* the upper gallery gets its balustrade (instanced balusters, a marble rail) and a cornice round the court under the skylight */
    { const bal: T.Matrix4[] = []; const run = (ax: 'x' | 'z', c: number, a0: number, a1: number) => { for (let a = a0; a <= a1; a += 0.42) bal.push(new T.Matrix4().makeTranslation(ax === 'z' ? c : a, CY + 6.2, ax === 'z' ? a : c)); };
      for (const s of [-1, 1]) { run('z', CX + s * (CW / 2 + 0.5), CZ - CD / 2, CZ + CD / 2); k.box(0.36, 0.14, CD, CX + s * (CW / 2 + 0.5), CY + 7.12, CZ, marble); }
      run('x', CZ - CD / 2 - 0.5, CX - CW / 2, CX + CW / 2); k.box(CW, 0.14, 0.36, CX, CY + 7.12, CZ - CD / 2 - 0.5, marble);
      k.instances(new T.LatheGeometry([[0.07, 0], [0.11, 0.06], [0.06, 0.2], [0.11, 0.45], [0.07, 0.75], [0.1, 0.84], [0.0, 0.85]].map(([a, b]) => new T.Vector2(a, b)), 10), plaster, bal); }
    for (const s of [-1, 1]) k.moulding(CORNICE, CD + 8, CX + s * (CW / 2 + 3.7), CY + 11.4, CZ, plaster, s < 0 ? 0 : PI);
    k.moulding(CORNICE, CW + 8, CX, CY + 11.4, CZ - CD / 2 - 3.7, plaster, -PI / 2);
    k.box(CW + 10, 0.4, CD + 10, CX, CY + 12, CZ, glass); for (let x = -CW / 2 - 4; x <= CW / 2 + 4; x += 3) k.box(0.2, 0.4, CD + 10, CX + x, CY + 12.1, CZ, steel);
    for (let z = -CD / 2 - 4; z <= CD / 2 + 4; z += 3) k.box(CW + 10, 0.16, 0.12, CX, CY + 12.05, CZ + z, steel);
    k.point(CX, CY + 9, CZ, 0xfff4e6, 100, 40); for (let i = 0; i < 4; i++) k.point(CX - 12 + i * 8, CY + 4, CZ, 0xfff4e6, 20, 14);
    hsign(k, 'BEAUX-ARTS COURT', 5.4, 0.5, CX, CY + 7.0, CZ - CD / 2 - 3.66, 0, { fg: '#3a3020', font: 'W2 JetBrains Mono', size: 0.62, lit: false });
    for (const [x, z] of [[CX - 10, CZ - 8], [CX + 10, CZ + 8], [CX + 8, CZ - 10]]) k.prop('bronze_figure', x, CY + 0.15, z, { height: 2.8, keepOut: 1.2 });
    k.prop('vitrine', CX, CY + 0.15, CZ, { height: 1.7, keepOut: 1.2 });
    /* real objects on plinths round the court (Poly Haven, CC0): two antique vases by the case, marble busts at the
       corners of the arcade, a bronze horse on a tall base */
    for (const [sx, p, h] of [[-1, 'brooklynmuseum/ph_antique_ceramic_vase_01', 0.8], [1, 'brooklynmuseum/ph_ceramic_vase_03', 0.9]] as const) { k.box(0.8, 1.0, 0.8, CX + sx * 3, CY + 0.65, CZ, marble); k.prop(p, CX + sx * 3, CY + 1.15, CZ, { height: h, keepOut: 0.8 }); }
    for (const [x, z] of [[-14.5, CZ - 12.5], [14.5, CZ - 12.5], [-14.5, CZ + 12.5], [14.5, CZ + 12.5]]) { k.box(0.9, 1.3, 0.9, x, CY + 0.8, z, marble); k.prop('brooklynmuseum/ph_marble_bust_01', x, CY + 1.45, z, { height: 0.9, rotY: x < 0 ? PI / 2 : -PI / 2, keepOut: 0.9 }); }
    k.box(2.6, 1.4, 1.4, CX - 9, CY + 0.85, CZ + 12, marble); void hero(k, 'brooklynmuseum/ph_horse_statue_01', { height: 2.6 }).then((h) => { if (!h || !k.live) return; tint(h, 0x5a4630, 0.45, 0.8); h.position.set(CX - 9, CY + 1.55, CZ + 12); h.rotation.y = PI / 2; k.add(h); }); k.keepOut.push({ x: CX - 9, z: CZ + 12, r: 1.8 });
    k.egg(v(CX, CY + 2.2, CZ), { id: 'brooklynmuseum-egypt', title: 'Nine Egyptians upstairs', text: 'The Egyptian collection spans more than 3,000 years and includes nine mummified Egyptians, the small figure known as the Bird Lady, and the Brooklyn Papyrus. The Wilbour Library of Egyptology came to the museum from the heirs of Charles Edwin Wilbour.', clue: 'Look into the glass case in the middle of the court.', source: { name: 'Brooklyn Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn_Museum' } }, { r: 1.4 });
    k.egg(v(CX + 6, CY + 0.6, CZ - 4), { id: 'brooklynmuseum-glass-floor', title: 'A floor made of glass', year: '2008', text: 'The Beaux-Arts Court, two storeys high and colonnaded under a soaring skylight, has a central floor of about 10,000 square feet made of terrazzo and glass block. In 2008 the museum set out to replace the worn floor of the court with new terrazzo.', clue: 'Look down at the glowing floor of the court.', source: { name: 'The Newtown Bee, January 17, 2008', url: 'https://www.newtownbee.com/?p=88119' } }, { r: 1.6 });
    /* one trick (rule 9): two words painted flat on the glass floor, stretched so that from the top of the ramp, looking
       back down the court, they stand up and point at the skylight (egg brooklynmuseum-look-up) */
    if (HAS_DOM) anamorphTex(k, floorType('LOOK UP', '#2a2418'), CX - 4, CZ - 12, CY + 3.15, CY + 0.15, PI, 3.4, 4.0, 1.3, 0.85);
    k.egg(v(CX - 4, CY + 0.9, CZ - 8), { id: 'brooklynmuseum-look-up', title: 'Two words that stand up', text: 'Two words are painted flat across the glass floor, stretched so they only read from one spot at the back of the court, where they seem to stand upright. A picture made to be seen from a single point is an anamorphosis; Holbein hid a skull that way in The Ambassadors in 1533.', clue: 'Stand at the back of the court and look along the glass floor.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.6 });
    eyeMedallion(k, CX, CY + 0.16, CZ + 10, 2.2);
    donorWall(k, CX, CY + 3.6, CZ - CD / 2 - 3.58, 0, 10, false);
    wordmarkRelief(k, CX, CY + 9.4, CZ - CD / 2 - 3.56, 0, 6);
    k.crowd([v(0, 0, 50), v(0, 0, FZ + 16), v(-8, 0.15, FZ), v(8, 0.15, FZ - 8)], 24, { seed: 154, speed: 0.4, spread: 2.6, animate: !ctx.reduced, colors: [0x24262c, 0x8a3a3a, 0x33477f, 0xd8d0c0, 0x151517, 0xf08a2a] });
    k.crowd([v(CX - 12, CY + 0.15, CZ + 10), v(CX + 12, CY + 0.15, CZ - 10)], 10, { seed: 155, speed: 0.3, spread: 2, animate: !ctx.reduced });
    k.censusWall({ x: CX, y: CY + 3.6, z: CZ + CD / 2 + 3.58, rotY: PI, cols: 40, rows: 5, tile: 0.55, gap: 0.05, start: ctx.wallStart(1600, 200), pieces: ctx.all, backing: dark });
    // the works: the court's arcade bays on both levels, the end wall, the lobby
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = CZ - 9 + i * 6; mounts.push({ position: v(CX + s * (CW / 2 + 3.4), CY + 3.2, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(CX, CY + 2.6, z), width: 3.6, height: 2.4, style: 'gilt', wash: true }); mounts.push({ position: v(CX + s * (CW / 2 + 3.4), CY + 9.2, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(CX, CY + 8.6, z), width: 3.6, height: 2.4, style: 'gilt', wash: false }); }
    for (const x of [-10, 10]) mounts.push({ position: v(CX + x, CY + 3.4, CZ - CD / 2 - 3.58), rotation: 0, target: v(CX + x, CY + 2.6, CZ), width: 4.2, height: 2.6, style: 'gilt', wash: true });
    for (const x of [-12, 12]) mounts.push({ position: v(x, 3.4, FZ - 12.58), rotation: 0, target: v(x, 2.8, FZ), width: 4.4, height: 2.6, style: 'gilt', wash: true });
    /* the lobby's back wall had no opening where the ramp leaves it; now two piers and a lintel */
    k.box(30.4, 8, 0.6, -3.8, 4, FZ - 13, lime); k.box(2.4, 8, 0.6, 17.8, 4, FZ - 13, lime); k.box(5.2, 3.4, 0.6, 14, 6.3, FZ - 13, lime);
    k.block(-19, 11.4, FZ - 13.6, FZ - 12.4); k.block(16.6, 19, FZ - 13.6, FZ - 12.4);
    return { mounts, spawn: v(0, 3, 54), look: v(0, 14, FZ), eye: 3, bounds: [-CW / 2 - 3, CW / 2 + 3, CZ - CD / 2 - 3, 60], style: 'gilt', floorY: (x, z) => { if (x > 11.8 && x < 16.2 && z < FZ - 13.5 && z > FZ - 44) return Math.min(CY, ((FZ - 13.5 - z) / 30.5) * CY); if (z > FZ - 14 && z < FZ + 12 && Math.abs(x) < 19) return 0; if (Math.abs(x - CX) < CW / 2 + 3.4 && z > CZ - CD / 2 - 3.4 && z < CZ + CD / 2 + 3.4) return CY + 0.15; if (z > 20 && z < 31) return Math.max(0, 2.4 - ((z - 20) / 11) * 2.4) * 0; return 0; } };
  },
};

/* ---------------- 110 PIONEER WORKS ---------------- */
export const pioneerworks: RoomDef = {
  id: 'pioneerworks',
  name: 'The ironworks in Red Hook',
  area: 'PIONEER WORKS',
  mood: 'Second Sunday, the garden open',
  color: '#a88a6a',
  description: 'Pioneer Street near the water: the 1866 iron works building, three storeys of open floor around the great hall, the garden with its kiln and stage, the works hung on brick under the trusses.',
  signatures: 'The long brick ironworks with its arched windows, the triple height main hall with balconies on three sides, the timber trusses, the garden of raised beds and a stage, the Statue and the harbor at the end of the street.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad8, horizon: 0xf0e4cc, ground: 0x6a6a66, fog: 0.002, sun: { az: 4.4, el: 0.4, color: 0xffe6c0, size: 14 }, env: 0.95 });
    k.hemi(0xfff0e0, 0x5a4a38, 0.9);
    k.sun(0xffe0b8, 2.2, -60, 40, 30, true, 100);
    /* 2026-11-24 (wave 6b): scanned CC0 surfaces (Poly Haven): red brick outside, limewashed brick inside, old pine boards
       underfoot, rough sawn timber for the trusses, garden lawn, and Belgian block for Pioneer Street */
    const brick = sc(k, 'pioneerworks', 'brick', 2.2, () => X.brick(0x7a4a3a, 344), { roughness: 0.85, color: 0xe0b8a8 }, 0x6a3a2e), brickIn = sc(k, 'pioneerworks', 'brickin', 2.0, () => X.brick(0x9a6a58, 345), { roughness: 0.85, color: 0xffffff }, 0xc8c0b8),
      timber = sc(k, 'pioneerworks', 'timber', 1.6, () => X.planks(0x6a4a30, 4, 346, 0.2), { roughness: 0.8, color: 0xffffff }, 0x6a4a30),
      floorW = sc(k, 'pioneerworks', 'floor', 2.4, () => X.planks(0x8a6a48, 8, 347, 0.2), { roughness: 0.6, color: 0xe8d8c4 }, 0x8a6a48), glass = k.glass(0xdcecf6, 0.14, 0.04), dark = k.flat(0x1a1c20, 0.5, 0.6), steel = k.flat(0x8c98a4, 0.9, 0.3),
      lawn = sc(k, 'pioneerworks', 'lawn', 3.0, () => X.grass(0x4a7a3a, 195), { roughness: 1, color: 0xffffff }, 0x4a6a3a), soil = k.flat(0x3a2a1a, 0, 1), cobble = sc(k, 'pioneerworks', 'cobble', 2.4, () => X.cobble(0x6f6c68, 9), { roughness: 0.9, color: 0xc8c4bc }, 0x5a5854),
      daylight = k.glow(0xf6f0e4, 0.88), sash = k.flat(0x24272b, 0.6, 0.5), roof = k.flat(0x2a2a2c, 0.1, 0.9);
    street(k, { w: 14, len: 140, z: 30, x: 0 });
    k.box(14, 0.03, 112, 0, 0.02, 44, cobble);
    blockFront(k, { x: 20, z0: 90, count: 10, face: -1, seed: 348, h: [8, 12] });
    k.water({ y: -1.6, color: 0x30506a, w: 600, d: 400, x: -260, z: 0, amp: 1.2 });
    /* 2026-10-28: the lathed cone across the water is the stand in for Gravity Jack's Liberty (CC BY 4.0, b.ts), credit by the spawn */
    { const lm = k.objects.length; k.lathe([[0, 0], [4, 0], [3.6, 5], [3, 14], [2, 22], [0, 23]], -220, 4, 40, k.pbr('pwCopper', X.patina(0x5f9a8c), 0.6), 24); libertyFigure(k, standIn(k, lm), -220, 4, 40, 23, [2, 22]); }
    k.box(10, 10, 10, -220, -1, 40, k.pbr('pwGranite', X.ashlar(0xa89c88, 349, 3), 0.25));
    k.box(0.08, 0.9, 0.08, 8, 0.45, 16, dark); k.sign(LIBERTY_CREDIT, 3.4, 0.42, 8, 1.1, 16.05, '#1a1c20', '#e8e2d4', 46, 0);
    k.skyline({ z: -200, count: 30, spacing: 9, scale: 3.8, base: -1.6, seed: 350, lit: 0.25, glow: 0.5, tint: 0x6e7684, x: -80, rows: 1, spires: true });
    // the ironworks: a long brick hall three storeys tall, arched windows, the great hall inside with balconies
    /* 2026-11-24 (wave 6b): the ironworks was one solid brick box, so from inside every wall vanished and the skyline stood
       in the hall, and the stair blocked the only door. Now: brick walls with a limewashed lining and a thickness, a roof
       and a plank ceiling, the windows lit from inside, the door moved south of the stair, a corbelled cornice outside. */
    const BX = -22, BZ = -10, BW = 30, BD = 46, BH = 16, x0 = BX - BW / 2, x1 = BX + BW / 2, z0 = BZ - BD / 2, z1 = BZ + BD / 2, DZ = BZ - 8;
    k.box(0.4, BH, BD, x0 + 0.2, BH / 2, BZ, brick); k.box(0.2, BH, BD - 1.2, x0 + 0.5, BH / 2, BZ, brickIn);
    k.box(BW, BH, 0.4, BX, BH / 2, z0 + 0.2, brick); k.box(BW - 1.2, BH, 0.2, BX, BH / 2, z0 + 0.5, brickIn);
    k.box(BW, BH, 0.4, BX, BH / 2, z1 - 0.2, brick); k.box(BW - 1.2, BH, 0.2, BX, BH / 2, z1 - 0.5, brickIn);
    for (const [a, b] of [[z0, DZ - 2], [DZ + 2, z1]]) { k.box(0.4, BH, b - a, x1 - 0.2, BH / 2, (a + b) / 2, brick); k.box(0.2, BH, b - a - (a === z0 ? 0.6 : 0.6), x1 - 0.5, BH / 2, (a + b) / 2, brickIn); }
    k.box(0.6, BH - 5, 4, x1 - 0.3, 5 + (BH - 5) / 2, DZ, brick);
    k.box(BW + 0.4, 0.4, BD + 0.4, BX, BH + 0.2, BZ, roof);
    for (const [y, d] of [[BH - 0.3, 0.5], [BH - 0.8, 0.3]] as const) { k.box(0.6 + d, 0.4, BD + d, x1 - 0.3 + d / 2 - 0.2, y, BZ, brick); k.box(BW + d, 0.4, 0.6 + d, BX, y, z1 - 0.3 + d / 2 - 0.2, brick); }
    k.block(x0 - 0.4, x0 + 0.8, z0, z1); k.block(x0, x1, z0 - 0.4, z0 + 0.8); k.block(x0, x1, z1 - 0.8, z1 + 0.4); k.block(x1 - 0.8, x1 + 0.4, z0, DZ - 2); k.block(x1 - 0.8, x1 + 0.4, DZ + 2, z1);
    for (let f = 0; f < 3; f++) for (let i = 0; i < 9; i++) { const y = 3 + f * 5, z = BZ - 20 + i * 5; if (f === 0 && Math.abs(z - DZ) < 4) continue; k.arch(2.2, 3.8, 0.4, BX + BW / 2 + 0.05, y - 1.9, z, brickIn, false, 0.7).rotation.y = PI / 2; k.box(0.06, 3.2, 1.6, BX + BW / 2 + 0.1, y, z, glass);
      k.box(0.04, 3.0, 1.5, x1 - 0.62, y - 0.1, z, daylight); for (let c = 0; c <= 3; c++) k.box(0.05, 3.0, 0.05, x1 - 0.65, y - 0.1, z - 0.75 + c * 0.5, sash); for (let r = 0; r <= 4; r++) k.box(0.05, 0.05, 1.5, x1 - 0.65, y - 1.6 + r * 0.75, z, sash); }
    k.arch(3.6, 5, 2, BX + BW / 2, 0, DZ, brickIn, false, 0.85).rotation.y = PI / 2;
    k.sign('PIONEER WORKS  ·  1866', 6, 0.6, BX + BW / 2 + 0.06, 6.2, DZ, 'transparent', '#f0e4c8', 70, PI / 2);
    k.egg(v(BX + BW / 2 + 1.0, 6.2, DZ), { id: 'pioneerworks-pioneer-street', title: 'The street named after the works', year: '1866', text: 'Alexander Bass was 39 when he founded Pioneer Iron Works here in 1866, after training as a railroad machinist and engineering sugar mills in Cuba. Its ads in Scientific American read: Machinery for Sugar Houses and Plantations a Specialty. The street was called Williams Street until it was renamed Pioneer Street after the factory.', clue: 'Read the name over the arched door.', source: { name: 'A Lily Pad on the Muck, Pioneer Works Broadcast', url: 'https://pioneerworks.org/broadcast/on-the-waterfront-joshua-jelly-schapiro' } }, { r: 1.6 });
    /* the ghost sign of the works, faded paint high on the brick over Pioneer Street, with the line from its old ads */
    { const g1 = hsign(k, 'PIONEER IRON WORKS', 22, 2.4, BX, 12.6, z1 + 0.02, 0, { fg: '#efe2c4', font: 'W2 Archivo Expanded', size: 0.78 }); (g1.material as T.MeshBasicMaterial).opacity = 0.62;
      const g2 = hsign(k, 'MACHINERY FOR SUGAR HOUSES', 18, 1.1, BX, 10.4, z1 + 0.02, 0, { fg: '#efe2c4', font: 'W2 Archivo Expanded', size: 0.7 }); (g2.material as T.MeshBasicMaterial).opacity = 0.5; }
    streetSign(k, -6.4, 15.4, 'PIONEER ST', 'VAN BRUNT ST');
    mlowBanner(k, BX + BW / 2 + 0.5, 10, BZ + 4, PI / 2, 3.0, true); blossomFlag(k, BX + BW / 2 + 0.5, 10, BZ - 8, PI / 2, 2.6, 7, 'ink');
    const IW = BW - 1.2, ID = BD - 1.2;
    k.box(IW, 0.3, ID, BX, 0.15, BZ, floorW);
    k.box(IW, 0.3, ID, BX, BH - 0.45, BZ, timber);
    for (let i = 0; i <= 8; i++) { const z = BZ - ID / 2 + i * (ID / 8); k.box(IW, 0.4, 0.3, BX, BH - 0.8, z, timber); for (let j = 1; j < 6; j++) k.beam(v(BX - IW / 2 + j * (IW / 6), BH - 0.8, z), v(BX - IW / 2 + j * (IW / 6) + (j % 2 ? 2 : -2), BH - 3.6, z), 0.1, timber, 4); k.box(IW, 0.3, 0.3, BX, BH - 3.6, z, timber); }
    for (const y of [5, 10]) { for (const s of [-1, 1]) { k.box(4, 0.3, ID, BX + s * (IW / 2 - 2), y, BZ, floorW); k.box(0.06, 1.0, ID, BX + s * (IW / 2 - 4), y + 0.6, BZ, steel); } k.box(IW, 0.3, 4, BX, y, BZ - ID / 2 + 2, floorW); k.box(IW, 0.06, 0.06, BX, y + 1.1, BZ - ID / 2 + 4, steel); for (let z = -ID / 2; z <= ID / 2; z += 3) for (const s of [-1, 1]) k.box(0.06, 1.0, 0.06, BX + s * (IW / 2 - 4), y + 0.6, BZ + z, steel); for (let z = -18; z <= 18; z += 9) k.point(BX, y + 3.6, BZ + z, 0xffe0c0, 18, 12); }
    for (let i = 0; i < 26; i++) k.box(2.4, 0.38, 0.9, BX + IW / 2 - 1.5, 0.19 + i * 0.38, BZ + ID / 2 - 1.5 - i * 0.9, floorW);
    /* the stair's block covers the stair now, not the whole east side, and a boarded stringer wall under it carries works */
    k.block(BX + IW / 2 - 2.8, BX + IW / 2 - 0.3, BZ + ID / 2 - 25, BZ + ID / 2 - 1);
    k.box(0.2, 4.6, 23.6, BX + IW / 2 - 2.95, 2.6, BZ + ID / 2 - 13, timber);
    k.box(16, 0.8, 8, BX - 2, 0.4, BZ - ID / 2 + 6, timber); k.block(BX - 10, BX + 6, BZ - ID / 2 + 2, BZ - ID / 2 + 10);
    // the big round window high in the back wall
    k.mesh(new T.TorusGeometry(1.6, 0.22, 8, 32), brickIn, BX, 10.6, BZ - ID / 2 + 0.4); k.mesh(new T.CircleGeometry(1.5, 32), k.glow(0xeaf2ff, 0.8), BX, 10.6, BZ - ID / 2 + 0.36);
    k.egg(v(BX - IW / 2 + 1.2, 1.6, BZ + 6), { id: 'pioneerworks-no-foundation', title: 'Brick walls on mud', text: 'When the building was renovated, the excavators found no solid foundation at all, only soft gravel, sludge and oily mud, yet the engineers found the walls within a thumb\'s width of level. The method, as a builder put it: compact the dirt, slap some tar on timber, and up you go with the first course of brick.', clue: 'Put your hand on the long brick wall of the main hall.', source: { name: 'A Lily Pad on the Muck, Pioneer Works Broadcast', url: 'https://pioneerworks.org/broadcast/on-the-waterfront-joshua-jelly-schapiro' } }, { r: 1.6 });
    k.egg(v(BX, BH - 3.0, BZ - 6), { id: 'pioneerworks-old-growth', title: 'Forty foot pine', text: 'The beams overhead are old growth pine, some about 40 feet long and 16 inches across. The three storey building has heavy brick walls, and a west facing wall of windows lights the Main Hall, with a big round window at the top of the back wall.', clue: 'Look up into the timber trusses under the roof.', source: { name: 'A Lily Pad on the Muck, Pioneer Works Broadcast', url: 'https://pioneerworks.org/broadcast/on-the-waterfront-joshua-jelly-schapiro' } }, { r: 1.8 });
    k.egg(v(BX + IW / 2 - 2, 11.6, BZ - ID / 2 + 2), { id: 'pioneerworks-charred-beam', title: 'Still black from the fire', year: '1881', text: 'On October 27, 1881 a fire, probably from a malfunctioning furnace, devastated the iron works, took nearly an hour to put out and did about $60,000 of damage. It was rebuilt with insurance money, burned again in 1906 and was rebuilt again. A giant beam in the third floor Science Studios is still charred from the 19th century fires.', clue: 'Climb to the top balcony and look along the beams at the back.', source: { name: 'A Lily Pad on the Muck, Pioneer Works Broadcast', url: 'https://pioneerworks.org/broadcast/on-the-waterfront-joshua-jelly-schapiro' } }, { r: 1.6 });
    k.egg(v(BX + 6, 1.2, BZ + 4), { id: 'pioneerworks-sandy', title: 'Five feet of water', year: '2012', text: 'Dustin Yellin bought the building for $3.7 million and opened it to the public in 2012, at first under the name Intercourse. Then Hurricane Sandy put five feet of floodwater into the ground floor, the rebuilding had to start again, and the space reopened in 2013 as Pioneer Works.', clue: 'Look at the bottom of the walls on the ground floor.', source: { name: 'Pioneer Works, Wikipedia', url: 'https://en.wikipedia.org/wiki/Pioneer_Works' } }, { r: 1.6 });
    k.egg(v(BX, BH + 1.2, BZ + 8), { id: 'pioneerworks-telescope', title: 'An observatory on the roof', year: '1895', text: 'An 1895 telescope, nearly 16 feet long with a 12.5 inch lens, from the building\'s own era, is meant for a public observatory on the reinforced roof. The founder\'s son, William L. Bass, published a trilogy of astronomy books in 1928 that tried to debunk Einstein\'s relativity.', clue: 'Look up at the roof of the ironworks from the street.', source: { name: 'A Lily Pad on the Muck, Pioneer Works Broadcast', url: 'https://pioneerworks.org/broadcast/on-the-waterfront-joshua-jelly-schapiro' } }, { r: 1.8 });
    eyeMedallion(k, BX, 0.31, BZ + 12, 2);
    donorWall(k, BX, 3.6, BZ - ID / 2 + 0.36, 0, 10, false);
    k.prop('noguchi_stone_2', BX - 6, 0.3, BZ, { height: 2.6, keepOut: 1.6 }); k.prop('bronze_figure', BX + 9, 0.3, BZ - 14, { height: 3, keepOut: 1.2 });
    /* 2026-11-24 (wave 6b): the ironworks still works. A real gantry crane stands in the hall, a workshop corner at the back
       has a drill press, a vice on its bench and a tool chest, and twelve factory pendants hang under the trusses (all
       Poly Haven scans, CC0) */
    void hero(k, 'pioneerworks/ph_overhead_crane', { height: 5.6 }).then((h) => { if (!h || !k.live) return; h.position.set(BX, 0.3, BZ + 16); k.add(h); });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.keepOut.push({ x: BX + sx * 6.6, z: BZ + 16 + sz * 1.8, r: 0.9 });
    { const WX = BX + 9, WZ = BZ - ID / 2 + 3; k.box(2.6, 0.08, 0.9, WX, 0.92, WZ, timber); for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(0.08, 0.62, 0.08, WX + sx * 1.2, 0.61, WZ + sz * 0.38, steel);
      k.prop('pioneerworks/ph_bench_vice_01', WX - 0.7, 0.96, WZ, { height: 0.34, rotY: PI / 2 }); k.prop('pioneerworks/ph_drill_press_01', WX + 2.6, 0.3, WZ - 0.4, { height: 1.7, rotY: PI }); k.prop('pioneerworks/ph_metal_tool_chest', WX - 2.6, 0.3, WZ - 0.4, { height: 1.0 });
      k.block(WX - 3.2, WX + 3.2, WZ - 1.0, WZ + 0.7); k.point(WX, 3.2, WZ + 1, 0xffe0b0, 8, 7); }
    { const at: number[][] = []; for (const x of [BX - 7, BX + 7]) for (let i = 0; i < 6; i++) { const z = BZ - 18 + i * 7.2; at.push([x, 10.8, z, 0]); k.cyl(0.012, BH - 3.6 - 11.8, x, (BH - 3.6 + 11.8) / 2, z, dark, 0.012, 4); }
      many(k, 'pioneerworks/ph_hanging_industrial_lamp', { height: 1.0 }, at); }
    /* one trick (rule 9): a word painted flat on the boards just inside the door stands up straight from the doorway
       (egg pioneerworks-iron-floor) */
    if (HAS_DOM) anamorphTex(k, floorType('IRON WORKS', '#2a1c14'), x1 - 2.4, DZ, 3, 0.3, PI / 2, 3.4, 3.6, 1.1, 0.86);
    k.egg(v(x1 - 7.5, 0.8, DZ), { id: 'pioneerworks-iron-floor', title: 'Two words that stand up', text: 'Just inside the door two words are painted flat on the floorboards, stretched so they only read from the doorway, where they seem to stand upright. A picture made to be seen from one spot is an anamorphosis; Holbein hid a skull that way in The Ambassadors in 1533.', clue: 'Stand in the arched doorway and look into the hall.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.6 });
    // the garden: raised beds, the kiln, a small stage, the blossom garden, the crowd
    const GX = 8, GZ = -30;
    k.box(36, 0.4, 30, GX, -0.2, GZ, lawn);
    for (let i = 0; i < 6; i++) { const x = GX - 12 + (i % 3) * 10, z = GZ - 8 + Math.floor(i / 3) * 10; k.box(5, 0.6, 1.6, x, 0.3, z, timber); k.box(4.8, 0.2, 1.4, x, 0.65, z, soil); for (let j = 0; j < 8; j++) k.sphere(0.25, x - 2 + j * 0.55, 0.9, z + (j % 2 ? 0.3 : -0.3), k.flat([0x4a7a3a, 0x6a9a4a, 0xe83a3a][j % 3], 0, 0.9), 6); k.keepOut.push({ x, z, r: 2.8 }); }
    k.cyl(1.2, 2.4, GX + 14, 1.2, GZ - 10, brick, 1.0, 12); k.cyl(0.4, 3, GX + 14, 3.8, GZ - 10, brick, 0.4, 10); k.keepOut.push({ x: GX + 14, z: GZ - 10, r: 1.6 });
    k.box(8, 0.6, 6, GX + 10, 0.3, GZ + 10, timber); k.block(GX + 6, GX + 14, GZ + 7, GZ + 13);
    /* the garden furnished (Poly Haven, CC0): planter boxes along the back, barrels, a fire pit by the kiln, folding stools
       set out for the Sunday music */
    many(k, 'pioneerworks/ph_planter_box_02', { height: 0.5 }, [[GX - 6, 0.2, GZ - 14, 0], [GX - 3, 0.2, GZ - 14, 0], [GX, 0.2, GZ - 14, 0], [GX + 3, 0.2, GZ - 14, 0], [GX + 6, 0.2, GZ - 14, 0], [GX + 9, 0.2, GZ - 14, 0], [GX - 9, 0.2, GZ - 14, 0]]);
    many(k, 'pioneerworks/ph_planter_box_01', { height: 0.45 }, [[GX + 16, 0.2, GZ + 2, PI / 2], [GX + 16, 0.2, GZ + 5, PI / 2]]);
    k.prop('pioneerworks/ph_wooden_barrels_01', GX - 14, 0.2, GZ - 13, { height: 0.95, keepOut: 2.2 });
    k.prop('pioneerworks/ph_stone_fire_pit', GX + 14, 0.2, GZ - 3, { height: 0.4, keepOut: 1.0 });
    { const at: number[][] = []; for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) at.push([GX + 2.4 + r * 1.2, 0.2, GZ + 8 + c * 1.1, PI / 2 + (c % 2) * 0.3]); many(k, 'pioneerworks/ph_folding_wooden_stool', { height: 0.46 }, at); k.keepOut.push({ x: GX + 3, z: GZ + 9.6, r: 2.2 }); }
    blossomGarden(k, GX - 6, 0, GZ + 8, 4, 1.6);
    k.crowd([v(4, 0, 20), v(x1 + 2, 0.15, DZ), v(BX + 4, 0.3, BZ), v(BX - 6, 0.3, BZ - 12), v(GX, 0, GZ), v(GX + 8, 0, GZ + 8)], 22, { seed: 156, speed: 0.35, spread: 2.4, animate: !ctx.reduced, closed: true, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a, 0xf08a2a, 0x3a8ad8] });
    /* the census wall moves to the south wall, off the balconies' works */
    k.censusWall({ x: BX - 0.6, y: 8, z: BZ + ID / 2 - 0.36, rotY: PI, cols: 36, rows: 6, tile: 0.55, gap: 0.05, start: ctx.wallStart(4100, 240), pieces: ctx.all, backing: dark });
    // the works: hung on the brick between the arches on the ground floor, on the balcony backs, and on the end wall high
    const mounts: Mount[] = [];
    for (const z of [-20, -12.5, -5, 2.5, 9.5]) mounts.push({ position: v(BX - IW / 2 + 0.38, 3.2, z), rotation: PI / 2, target: v(BX, 2.6, z), width: 4.6, height: 2.7, style: 'black', wash: true });
    for (const z of [-10, -2, 6]) mounts.push({ position: v(BX + IW / 2 - 3.07, 2.8, z), rotation: -PI / 2, target: v(BX, 2.6, z), width: 4.2, height: 2.6, style: 'black', wash: true });
    mounts.push({ position: v(BX - 8, 3.2, BZ + ID / 2 - 0.38), rotation: PI, target: v(BX - 8, 2.6, BZ + ID / 2 - 6), width: 4.2, height: 2.6, style: 'black', wash: true });
    for (const y of [5, 10]) for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = s < 0 ? (y === 5 ? [-22, -10, 2] : [-18.4, -7.2, 4])[i] : (y === 5 ? [-27.5, -22.5, -17.5] : [-17.5, -7.5, -2.5])[i]; mounts.push({ position: v(BX + s * (IW / 2 - 0.38), y + 2.4, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s > 0 && y === 5 ? BX + 10 : BX, y + 2, z), width: 3.2, height: 2.0, style: 'black', wash: false }); }
    for (const x of [-5, 5]) mounts.push({ position: v(BX + x, 12.9, BZ - ID / 2 + 0.38), rotation: 0, target: v(BX + x, 6, BZ - 4), width: 4.6, height: 2.8, style: 'none', wash: true });
    return { mounts, spawn: v(2, 3, 22), look: v(BX + BW / 2, 8, BZ + 4), eye: 3, bounds: [BX - IW / 2 + 0.8, 26, BZ - ID / 2 + 1, 40], style: 'black' };
  },
};

/* ---------------- 111 THE BRONX MUSEUM ---------------- */
export const bronxmuseum: RoomDef = {
  id: 'bronxmuseum',
  name: 'The Concourse museum',
  area: 'THE BRONX MUSEUM OF THE ARTS',
  mood: 'Grand Concourse, Friday',
  color: '#c8a0b8',
  description: 'The Grand Concourse with its Art Deco apartment houses, the folded metal and glass front of the museum, the atrium and the galleries inside, the works of the borough on the walls.',
  signatures: 'The pleated aluminium and glass facade folding along the Concourse, the tall lobby with its stair, the flexible white galleries, the north wing courtyard, the Deco buildings across the boulevard with their casement corners.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad8, horizon: 0xf0e8dc, ground: 0x6a6a66, fog: 0.002, sun: { az: 3.5, el: 0.7, color: 0xfff6e8, size: 12 }, env: 0.95 });
    k.hemi(0xf6f6ff, 0x5a5048, 0.9);
    k.sun(0xfff2dc, 2.2, 30, 70, 40, true, 90);
    /* 2026-11-24 (wave 6b): scanned CC0 surfaces (Poly Haven): brushed aluminium, white plaster, polished concrete, the buff
       brick and cast stone of the Concourse apartment houses */
    const alu = sc(k, 'bronxmuseum', 'alu', 1.6, () => X.steel(0xc8ccd0, false, 351), { metalness: 0.7, roughness: 0.4, color: 0xffffff }, 0xa8acb0), glass = k.glass(0xdcecf6, 0.14, 0.04), white = sc(k, 'bronxmuseum', 'white', 2.6, () => X.plaster(0xf6f6f4, 196), { roughness: 0.9, color: 0xffffff, normal: 0.35 }, 0xe8e8e4),
      floorC = sc(k, 'bronxmuseum', 'floor', 3.0, () => X.concrete(0xb8b4ac, 197), { roughness: 0.45, color: 0xffffff, normal: 0.5 }, 0xa8a49c), dark = k.flat(0x1a1c20, 0.5, 0.6), steel = k.flat(0x8c98a4, 0.9, 0.3),
      brickD = sc(k, 'bronxmuseum', 'deco', 2.0, () => X.brick(0xb89a78, 352), { roughness: 0.85, color: 0xffffff }, 0xb89a78), cream = sc(k, 'bronxmuseum', 'cast', 2.4, () => X.plaster(0xe8dcc0, 198), { roughness: 0.8, color: 0xffffff }, 0xd8ccb0);
    /* 2026-11-24 (wave 6b): the Concourse ran through the museum (its west kerb was seven metres inside the building); the
       street, its planted mall and the apartment houses move ten metres east */
    const SX = 12;
    street(k, { w: 40, len: 200, z: 40, x: SX });
    k.box(6, 0.4, 200, SX, 0.1, 40, k.pbr('bxMall', X.grass(0x3a5a2a, 199), 0.06)); for (let z = -40; z <= 120; z += 16) k.tree(SX, 0.3, z, { kind: 'round', h: 6, r: 2.6, seed: z });
    k.egg(v(SX, 2.2, 24), { id: 'bronxmuseum-champs-elysees', title: 'A Champs-Elysees for the Bronx', year: '1909', text: 'Louis Aloys Risse, an immigrant from Lorraine, conceived the Grand Concourse in 1890 and modeled it on the Champs-Elysees, only bigger: 180 feet wide for most of its length, originally three roadways split by tree lined dividers. It cost $14 million and opened to traffic in November 1909.', clue: 'Stand on the planted median in the middle of the boulevard.', source: { name: 'Grand Concourse (Bronx), Wikipedia', url: 'https://en.wikipedia.org/wiki/Grand_Concourse_(Bronx)' } }, { r: 1.6 });
    k.egg(v(SX + 23.4, 6, 70), { id: 'bronxmuseum-park-avenue', title: 'The Park Avenue of the middle class', text: 'By the mid 1930s almost 300 apartment buildings lined the Concourse, most of them five or six storeys. The 1939 WPA Guide called it the Park Avenue of middle class Bronx residents, and the stretch from 153rd to 167th Street became a city landmark district on October 25, 2011.', clue: 'Look across the boulevard at the apartment houses and their corner windows.', source: { name: 'Grand Concourse (Bronx), Wikipedia', url: 'https://en.wikipedia.org/wiki/Grand_Concourse_(Bronx)' } }, { r: 1.8 });
    /* the apartment houses: buff brick on a cast stone base, string courses at every floor, the famous corner casements,
       a stepped Deco crown and a cast surround at each door */
    for (let i = 0; i < 5; i++) { const z = 130 - i * 30, H = 22 + (i % 2) * 6, fx = SX + 25; k.box(24, H, 26, SX + 37, H / 2, z, brickD); k.box(24.4, 3.2, 26.4, SX + 37, 1.6, z, cream);
      for (let f = 0; f < 6; f++) { const y = 3 + f * 3.4; k.box(2.4, 1.6, 2.4, fx + 0.2, y + 1.2, z - 12.2, glass); k.box(0.3, 1.8, 3, fx + 0.1, y + 1.2, z - 12, cream); if (f) k.box(0.3, 0.22, 26.2, fx - 0.05, y, z, cream); for (let w = 0; w < 5; w++) { const wz = z - 8 + w * 4; k.box(0.06, 1.5, 1.4, fx - 0.03, y + 1.3, wz, glass); k.box(0.2, 0.12, 1.6, fx - 0.08, y + 0.5, wz, cream); } }
      k.box(24.4, 0.6, 26.4, SX + 37, H + 0.3, z, cream); k.box(0.6, 2.4, 8, fx + 0.2, H + 1.2, z, cream); k.box(0.6, 1.4, 4, fx + 0.2, H + 3.1, z, cream);
      k.box(0.5, 3.6, 3.6, fx - 0.2, 1.8, z + 4, cream); k.box(0.1, 2.8, 2.2, fx - 0.46, 1.4, z + 4, dark); }
    // the museum: a pleated aluminium front over a glass ground floor, the lobby atrium with a stair, two galleries
    const BX = -30, BZ = -6, BW = 34, BD = 34, BH = 14, x0 = BX - BW / 2, x1 = BX + BW / 2, z0 = BZ - BD / 2, z1 = BZ + BD / 2, DZ = BZ - 8;
    /* 2026-11-24 (wave 6b): the museum was one solid white box with its walls invisible from inside; now real walls, a roof,
       a glass storefront with the door south of the stair (the stair covered the old one) and an upper wall behind the pleats */
    k.box(0.6, BH, BD, x0 + 0.3, BH / 2, BZ, white); k.box(BW, BH, 0.6, BX, BH / 2, z0 + 0.3, white); k.box(BW, BH, 0.6, BX, BH / 2, z1 - 0.3, white);
    k.box(0.4, BH - 5.5, BD, x1 - 0.4, 5.5 + (BH - 5.5) / 2, BZ, white); k.box(BW + 0.4, 0.4, BD + 0.4, BX, BH + 0.2, BZ, k.flat(0x3a3c40, 0.2, 0.8));
    k.block(x0 - 0.4, x0 + 0.8, z0, z1); k.block(x0, x1, z0 - 0.4, z0 + 0.8); k.block(x0, x1, z1 - 0.8, z1 + 0.4); k.block(x1 - 0.6, x1 + 1.8, z0, DZ - 1.7); k.block(x1 - 0.6, x1 + 1.8, DZ + 1.7, z1);
    for (const [a, b] of [[z0, DZ - 1.7], [DZ + 1.7, z1]]) k.box(0.08, 4.6, b - a, x1 - 0.2, 2.3, (a + b) / 2, glass);
    for (let z = z0 + 1; z < z1; z += 2) if (Math.abs(z - DZ) > 1.8) k.box(0.14, 4.6, 0.12, x1 - 0.16, 2.3, z, steel);
    for (const s of [-1, 1]) { const d = k.box(1.6, 3.2, 0.06, x1 + 0.6, 1.6, DZ + s * 1.75, glass); d.rotation.y = s * 0.4; }
    k.box(1.8, 0.9, BD, x1 + 0.7, 5.05, BZ, alu); k.box(1.8, 0.06, BD, x1 + 0.7, 4.58, BZ, k.glow(0xfff4e0, 0.7));
    k.sign('THE BRONX MUSEUM OF THE ARTS', 10, 0.62, x1 + 1.62, 5.05, DZ + 5, 'transparent', '#1a1c20', 64, PI / 2);
    /* one trick (rule 9): the pleats are an agamograph. Every fold has two faces, one turned north and one south, and each
       set carries its own painting, so the Concourse front reads THE BRONX walking south and OF THE ARTS walking north
       (egg bronxmuseum-two-faces) */
    { const PD = 1.1, PS = 1.2, N = 28, Z0 = z0 + 0.2, span = N * PS, Y0 = 5.5, PH = BH - Y0 + 0.4;
      const face = (word: string, ink: string) => HAS_DOM ? new T.MeshStandardMaterial({ metalness: 0.55, roughness: 0.38, map: paintTex(2048, 560, (g) => {
          g.fillStyle = '#c4c8cc'; g.fillRect(0, 0, 2048, 560); for (let i = 0; i < 1400; i++) { const x = Math.random() * 2048, c = 180 + Math.random() * 50; g.fillStyle = `rgba(${c},${c + 2},${c + 6},0.35)`; g.fillRect(x, 0, 1 + Math.random() * 2, 560); }
          g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle'; let s = 420; g.font = `800 ${s}px "W2 Archivo Expanded", Arial, sans-serif`; const tw = g.measureText(word).width; if (tw > 1960) { s *= 1960 / tw; g.font = `800 ${s}px "W2 Archivo Expanded", Arial, sans-serif`; } g.fillText(word, 1024, 290); }, ['W2 Archivo Expanded']) }) : alu;
      const south = face('OF THE ARTS', '#2962ff'), north = face('THE BRONX', '#14161a');
      for (let j = 0; j < N; j++) { const za = Z0 + j * PS, zb = za + PS, xa = x1 + (j % 2 ? PD : 0), xb = x1 + (j % 2 ? 0 : PD), dx = xb - xa, dz = zb - za, len = Math.hypot(dx, dz);
        const g = new T.PlaneGeometry(len, PH), uv = g.getAttribute('uv') as T.BufferAttribute, ua = 1 - (za - Z0) / span, ub = 1 - (zb - Z0) / span;
        for (let q = 0; q < uv.count; q++) uv.setX(q, ub + uv.getX(q) * (ua - ub));
        const m = k.mesh(g, j % 2 ? north : south, (xa + xb) / 2, Y0 + PH / 2, (za + zb) / 2); m.rotation.y = Math.atan2(dz, -dx);
        if (j % 2 === 0) k.box(0.06, PH, 0.06, xb, Y0 + PH / 2, zb, steel); }
      k.box(PD + 0.4, 0.3, span + 0.4, x1 + PD / 2, BH + 0.25, Z0 + span / 2, alu);
      k.egg(v(x1 + 9, 3.2, DZ + 22), { id: 'bronxmuseum-two-faces', title: 'A front with two faces', text: 'Every fold of the aluminium front has a face turned north and a face turned south, and each set is painted on its own, so the building reads one way as you walk up the Concourse and another way as you walk down it. Yaacov Agam made art this way, on pleated grounds that change as you pass; the pieces are called agamographs.', clue: 'Walk along the Concourse past the folded front, then turn and look back.', source: { name: 'Yaacov Agam, Wikipedia', url: 'https://en.wikipedia.org/wiki/Yaacov_Agam' } }, { r: 1.8 }); }
    k.egg(v(BX + BW / 2 + 2.6, 7.0, BZ - 10), { id: 'bronxmuseum-accordion', title: 'An accordion on the Concourse', year: '2006', text: 'The north wing by Arquitectonica opened in 2006 for $19 million and doubled the museum to 33,000 square feet. Its pleated aluminum facade is often compared to an accordion or a paper fan.', clue: 'Look along the folded metal and glass front.', source: { name: 'Bronx Museum of the Arts, Wikipedia', url: 'https://en.wikipedia.org/wiki/Bronx_Museum_of_the_Arts' } }, { r: 1.8 });
    k.egg(v(BX + BW / 2 + 2.2, 3.0, BZ - 16), { id: 'bronxmuseum-temporary-walls', title: 'Walls built to come down', text: 'The side walls of the 2006 north wing are temporary. They were designed to be removed if the site is later redeveloped with a residential high rise.', clue: 'Find the end of the folded front, where it meets the side wall.', source: { name: 'Bronx Museum of the Arts, Wikipedia', url: 'https://en.wikipedia.org/wiki/Bronx_Museum_of_the_Arts' } }, { r: 1.4 });
    k.egg(v(BX + BW / 2 + 2.2, 2.6, DZ), { id: 'bronxmuseum-synagogue', title: 'The museum in a synagogue', year: '1961', text: 'The older half of the museum was built in 1961 for Young Israel of the Concourse, a congregation that began in a small synagogue on Walton Avenue and raised money for years to build here. The museum, which began life in the Bronx County Courthouse, moved in later.', clue: 'Stand at the glass entrance on the Concourse.', source: { name: '8 Architectural Gems Along the Grand Concourse, Untapped New York', url: 'https://untappedcities.com/2013/10/16/8-architectural-gems-along-the-bronx-grand-concourse-county-courthouse-post-office-loews-paradise-theater-poe-cottage/8/' } }, { r: 1.6 });
    mlowBanner(k, BX + 8, 8, z1 + 0.1, 0, 2.8, true); blossomFlag(k, BX - 4, 8, z1 + 0.1, 0, 2.4, 5, 'electric');
    streetSign(k, x1 + 3.2, z1 + 2.4, 'GRAND CONCOURSE', 'E 165 ST');
    const IW = BW - 1.2, ID = BD - 1.2;
    k.box(IW, 0.3, ID, BX, 0.15, BZ, floorC);
    k.box(IW, 0.3, ID, BX, BH - 0.55, BZ, white);
    k.mesh(new T.PlaneGeometry(IW - 6, 10), k.glow(0xffffff, 0.9), BX, BH - 0.72, BZ + 6).rotation.x = PI / 2;
    for (let z = -12; z <= 12; z += 8) k.point(BX, BH - 3, BZ + z, 0xffffff, 26, 16);
    /* track lighting: steel tracks across the ceiling with spot heads, one instanced draw */
    { const heads: T.Matrix4[] = []; for (let x = x0 + 4; x < x1 - 2; x += 6) { k.box(0.08, 0.06, ID - 2, x, BH - 0.75, BZ, dark); for (let z = z0 + 3; z < z1 - 2; z += 3.4) heads.push(new T.Matrix4().compose(v(x, BH - 0.95, z), new T.Quaternion().setFromAxisAngle(v(1, 0, 0), (z < BZ ? 1 : -1) * 0.5), v(1, 1, 1))); }
      k.instances(new T.CylinderGeometry(0.09, 0.12, 0.32, 10), dark, heads); }
    k.box(0.4, 8, ID - 12, BX - 4, 4, BZ - 4, white); k.block(BX - 4.4, BX - 3.6, BZ - ID / 2 + 6, BZ + 8);
    k.box(0.4, 8, 10, BX + 6, 4, BZ - 10, white); k.block(BX + 5.6, BX + 6.4, BZ - 15, BZ - 5);
    for (let i = 0; i < 20; i++) k.box(2.4, 0.36, 0.9, BX + IW / 2 - 1.5, 0.18 + i * 0.36, BZ + ID / 2 - 1.5 - i * 0.9, floorC);
    k.block(BX + IW / 2 - 2.8, BX + IW / 2 - 0.3, BZ + ID / 2 - 19.6, BZ + ID / 2 - 1);
    k.box(IW, 0.4, 8, BX, 7.4, BZ - ID / 2 + 4, floorC); k.box(0.1, 1.1, IW, BX, 8.1, BZ - ID / 2 + 8, glass);
    eyeMedallion(k, BX + 8, 0.31, BZ + 10, 2);
    donorWall(k, BX, 3.6, BZ - ID / 2 + 0.36, 0, 9, true);
    wordmarkRelief(k, BX, 6.4, BZ - ID / 2 + 0.38, 0, 5);
    k.prop('museum_bench', BX + 2, 0.3, BZ + 4, { height: 0.58, keepOut: 1.4 }); k.prop('vitrine', BX - 10, 0.3, BZ + 8, { height: 1.7, keepOut: 1.2 });
    k.egg(v(BX - 10, 2.2, BZ + 8), { id: 'bronxmuseum-courthouse', title: 'Born in a courthouse rotunda', year: '1971', text: 'The museum opened on May 11, 1971 in the first floor rotunda of the Bronx County Courthouse, at 161st Street on the Concourse, with 28 paintings lent from the Metropolitan Museum. Admission has been free every day since March 29, 2012, and the collection now holds more than 800 works.', clue: 'Look into the glass case in the lobby.', source: { name: 'Bronx Museum of the Arts, Wikipedia', url: 'https://en.wikipedia.org/wiki/Bronx_Museum_of_the_Arts' } }, { r: 1.4 });
    /* 2026-11-24 (wave 6b): the lobby furnished (Poly Haven, CC0): a desk at the door, lounge chairs round a low table,
       pendant lamps, plants; a Firefly mural (queued) over the end wall */
    { const RX = x1 - 3, RZ = z0 + 4.4; k.box(1.0, 1.1, 4.2, RX, 0.85, RZ, white); k.box(1.1, 0.06, 4.4, RX, 1.43, RZ, k.flat(0x2a2c30, 0.3, 0.4)); hsign(k, 'FREE ADMISSION', 3.6, 0.36, RX + 0.52, 0.95, RZ, PI / 2, { fg: '#14161a', size: 0.62, lit: false }); k.block(RX - 0.7, RX + 0.7, RZ - 2.3, RZ + 2.3); }
    many(k, 'bronxmuseum/ph_mid_century_lounge_chair', { height: 0.85 }, [[BX - 1.2, 0.3, BZ + 11, PI / 2], [BX + 3.2, 0.3, BZ + 11, -PI / 2], [BX + 1, 0.3, BZ + 13.2, PI]]);
    k.prop('bronxmuseum/ph_modern_coffee_table_01', BX + 1, 0.3, BZ + 11, { height: 0.4, rotY: PI / 2 }); k.keepOut.push({ x: BX + 1, z: BZ + 11.6, r: 2.6 });
    many(k, 'bronxmuseum/ph_potted_plant_01', { height: 1.5 }, [[x0 + 1.4, 0.3, z1 - 1.4, 0], [x1 - 5.4, 0.3, z1 - 1.6, 1], [x0 + 1.4, 0.3, z0 + 9.6, 2]]);
    for (const [x, z] of [[x0 + 1.4, z1 - 1.4], [x1 - 5.4, z1 - 1.6], [x0 + 1.4, z0 + 9.6]]) k.keepOut.push({ x, z, r: 0.8 });
    { const at: number[][] = [[BX + 1, BH - 2.4, BZ + 11, 0], [BX - 8, BH - 2.4, BZ + 11, 0], [BX + 10, BH - 2.4, BZ + 11, 0], [x1 - 3, BH - 2.4, z0 + 4.4, 0]]; for (const [x, y, z] of at) k.cyl(0.01, BH - 0.7 - y - 1.1, x, (BH - 0.7 + y + 1.1) / 2, z, dark, 0.01, 4); many(k, 'bronxmuseum/ph_modern_ceiling_lamp_01', { height: 1.1 }, at); }
    fireflyPlate(k, 'assets/museum/tex/bronxmuseum/ff_bronxmuseum_mural.webp', 18, 4.4, BX - 2, 9.4, z1 - 0.62, PI, k.flat(0xe0b84a, 0, 0.8));
    /* the Concourse furnished: lamp posts on both kerbs, a hydrant, litter baskets, street seating (Poly Haven, CC0) */
    { const at: number[][] = []; for (let z = -40; z <= 100; z += 28) { at.push([SX - 21.6, 0.14, z, -PI / 2]); at.push([SX + 21.6, 0.14, z + 14, PI / 2]); } many(k, 'bronxmuseum/ph_street_lamp_01', { height: 5.2 }, at); for (const [x, , z] of at) k.keepOut.push({ x, z, r: 0.5 }); }
    k.prop('bronxmuseum/ph_fire_hydrant', SX - 21.4, 0.14, 24, { height: 0.8, rotY: PI / 2, keepOut: 0.6 });
    k.prop('bronxmuseum/ph_metal_trash_can', SX - 22.6, 0.14, -30, { height: 0.9, rotY: PI / 2, keepOut: 1.0 });
    k.prop('bronxmuseum/ph_modular_street_seating', SX - 23.4, 0.14, 44, { height: 0.9, rotY: PI / 2, keepOut: 2.4 });
    k.crowd([v(6, 0, 30), v(x1 + 3, 0, DZ), v(BX + 14, 0.3, BZ - 8), v(BX + 2, 0.3, BZ), v(BX - 10, 0.3, BZ - 10)], 14, { seed: 157, speed: 0.35, spread: 2, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a, 0xf08a2a] });
    k.crowd([v(SX - 24, 0, 100), v(SX - 24, 0, -20)], 20, { seed: 158, speed: 0.9, spread: 1.2, animate: !ctx.reduced });
    k.censusWall({ x: BX - IW / 2 + 0.36, y: 4.2, z: BZ + 6, rotY: PI / 2, cols: 30, rows: 5, tile: 0.5, gap: 0.05, start: ctx.wallStart(1200, 150), pieces: ctx.all, backing: dark });
    // the works: the two galleries' walls on both sides of the free walls, the mezzanine, the end wall
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = BZ - 10 + i * 5; mounts.push({ position: v(BX - 4 + s * 0.22, 3.0, z), rotation: s < 0 ? -PI / 2 : PI / 2, target: v(BX - 4 + s * 6, 2.6, z), width: 4.0, height: 2.4, style: 'white', wash: true }); }
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const z = BZ - 12 + i * 4.5; mounts.push({ position: v(BX + 6 + s * 0.22, 3.0, z), rotation: s < 0 ? -PI / 2 : PI / 2, target: v(BX + 6 + s * 5, 2.6, z), width: 3.6, height: 2.2, style: 'white', wash: true }); }
    for (const x of [-12, -2, 8]) mounts.push({ position: v(BX + x, 3.4, BZ + ID / 2 - 0.36), rotation: PI, target: v(BX + x, 2.6, BZ), width: 4.4, height: 2.6, style: 'white', wash: true });
    for (const x of [-10, 0, 10]) mounts.push({ position: v(BX + x, 10, BZ - ID / 2 + 0.36), rotation: 0, target: v(BX + x, 8.8, BZ - 4), width: 4.4, height: 2.6, style: 'white', wash: false });
    /* the Concourse works stand on the planted mall now, facing the museum across the street */
    for (const z of [96, 64, 32]) { k.box(0.3, 3.2, 4.6, SX + 0.2, 2.2, z, dark); mounts.push({ position: v(SX + 0.02, 2.3, z), rotation: -PI / 2, target: v(SX - 8, 2.5, z), width: 4.2, height: 2.5, style: 'black', wash: false }); }
    return { mounts, spawn: v(-7, 3, 14), look: v(BX + BW / 2, 7, BZ - 2), eye: 3, bounds: [BX - IW / 2 + 0.8, SX + 20, BZ - ID / 2 + 1, 120], style: 'white' };
  },
};
