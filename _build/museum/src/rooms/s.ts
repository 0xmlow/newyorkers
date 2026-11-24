/* Rooms 87 to 91: the MoMA atrium, the New Museum, the Neue Galerie, Cooper Hewitt's garden, the Breuer. */
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

/* ---------- THE BIG UPGRADE, wave 5b (2026-11-24): helpers for rooms 87 to 91 ----------
   Same pattern as waves 3 and 4 (q.ts), kept local: scanned CC0 surfaces from assets/museum/tex/<room>/ that wear a
   sensible colour until their maps land, real models from assets/museum/props/<room>/ placed many at once (seven or
   more become instanced parts), painted canvases. Safe in node: the audit builds with no DOM, so scans fall back to paint. */
const HAS_DOM = typeof window !== 'undefined' && typeof HTMLImageElement !== 'undefined';
const texL = HAS_DOM ? new T.TextureLoader() : null;
const w5b = new Map<string, { s: X.Surface; ready: Promise<unknown> }>();
function sc(k: Kit, room: string, id: string, metres: number, paint: () => X.Surface, p: Partial<T.MeshStandardMaterialParameters> & { normal?: number; stretch?: number } = {}, wait = 0x888888) {
  if (!texL) return k.pbr(`w5b-${room}-${id}`, paint(), 1 / metres, p);
  let e = w5b.get(`${room}/${id}`);
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
    w5b.set(`${room}/${id}`, e);
  }
  k.pending.push(e.ready);
  const m = k.pbr(`w5b-${room}-${id}`, e.s, 1 / metres, p);
  if (!m.userData.w5b) {
    m.userData.w5b = true;
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
/* Small props cast no sun shadow: the shadow pass doubled their triangles for a shadow nobody sees. */
const noShadow = (o: T.Object3D) => o.traverse((c) => { c.castShadow = false; });
/* Recolour every material of a loaded model without touching the source cache. */
function tint(o: T.Object3D, hex: number, rough = 0.6, metal = 0.5) {
  const cache = new Map<T.Material, T.Material>();
  o.traverse((c) => { if (!(c instanceof T.Mesh)) return; const src = c.material as T.MeshStandardMaterial; let m = cache.get(src); if (!m) { const n = src.clone(); n.color.setHex(hex); n.roughness = rough; n.metalness = metal; m = n; cache.set(src, m); } c.material = m; });
}
/* Painted lettering for an anamorphic floor piece, in a house font. */
function floorType(text: string, fg: string, w = 1024, h = 256, font = 'W2 Archivo Expanded') {
  return paintTex(w, h, (g) => { g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; let s = h * 0.8; g.font = `800 ${s}px "${font}", Arial, sans-serif`; const tw = g.measureText(text).width; if (tw > w * 0.94) { s *= (w * 0.94) / tw; g.font = `800 ${s}px "${font}", Arial, sans-serif`; } g.fillText(text, w / 2, h / 2); }, [font]);
}
/* The shared street (f.ts street()) laid in scanned asphalt and pavers, same plan: road `w` across x, running `len` along z. */
function scanStreet(k: Kit, room: string, p: { w: number; len: number; z: number; x?: number; walk?: number }) {
  const { w, len, z, x = 0, walk = 5 } = p;
  const asphalt = sc(k, room, 'asphalt_02', 3, () => X.asphalt(0x24282d), { roughness: 0.85 }, 0x303438),
    pav = sc(k, room, 'concrete_pavers', 1.6, () => X.pavers(0x8e8b84, 5), { roughness: 0.85 }, 0x8e8b84),
    granite = k.pbr('curbS', X.ashlar(0x8a8a86, 4, 2), 0.35), white = k.flat(0xdedbd2, 0, 0.7), yellow = k.flat(0xe6a626, 0, 0.6);
  k.box(w, 0.3, len, x, -0.15, z, asphalt);
  for (const s of [-1, 1]) { k.box(walk, 0.28, len, x + s * (w / 2 + walk / 2), 0.0, z, pav); k.box(0.3, 0.32, len, x + s * (w / 2 + 0.1), 0.02, z, granite); }
  for (const dx of [-0.14, 0.14]) k.box(0.09, 0.012, len - 6, x + dx, 0.01, z, yellow);
  for (let cz = z + len / 2 - 6; cz > z - len / 2; cz -= 28) for (let cx = -w / 2 + 1.2; cx <= w / 2 - 1; cx += 1.2) k.box(0.62, 0.014, 2.8, x + cx, 0.012, cz, white);
}
const CLEAR = (k: Kit) => k.flat(0x000000, 0, 1, { transparent: true, opacity: 0 });

/* ---------------- 87 THE ATRIUM ---------------- */
export const momaatrium: RoomDef = {
  id: 'momaatrium',
  name: 'The atrium',
  area: 'MOMA',
  mood: 'Free Friday, six o\'clock',
  color: '#e8e8e4',
  description: 'Fifty third Street under the black glass, the lobby, then the atrium: a white shaft of light six storeys tall, bridges crossing it, the escalators, a mobile turning above, the works on the great walls.',
  signatures: 'The sheer white atrium with its cut through balconies at every level, the glass bridges, the grand stair, the mobile hung in the void, the escalators seen through glass, the garden through the wall of windows.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad0, horizon: 0xe8e8e0, ground: 0x5a5a55, fog: 0.0022, sun: { az: 3.4, el: 0.75, color: 0xfff4e6, size: 12 }, env: 0.9 });
    k.hemi(0xffffff, 0x5a5a58, 0.8);
    k.sun(0xffffff, 1.6, 20, 80, 30, true, 80);
    /* 2026-11-24 (wave 5b): scanned CC0 surfaces (Poly Haven): white plaster on the atrium walls, pale granite tile underfoot */
    const white = sc(k, 'momaatrium', 'white_plaster_02', 7, () => X.plaster(0xf4f4f2, 131), { roughness: 0.92, color: new T.Color(2.75, 2.77, 2.8), normal: 0.15 }, 0xe8e8e4),
      floorT = sc(k, 'momaatrium', 'granite_tile', 2.4, () => X.terrazzo(0xd8d8d4, 132), { roughness: 0.32, color: new T.Color(1.9, 1.88, 1.84) }, 0xc8c6c0),
      glass = k.glass(0xdcecf6, 0.14, 0.04), glassDark = k.glass(0x1a2228, 0.5, 0.1), steel = k.flat(0x8c98a4, 0.9, 0.3),
      dark = k.flat(0x1a1c20, 0.5, 0.6), black = k.flat(0x0e0e10, 0.2, 0.4);
    // 53rd Street and the black glass front, the lobby
    scanStreet(k, 'momaatrium', { w: 20, len: 140, z: 40, x: 0 });
    blockFront(k, { x: -46, z0: 100, count: 10, face: 1, seed: 261, h: [18, 40] });
    const FZ = 12;
    /* wave 5b: the glass block stopped at the atrium's front wall; it ran 16 m into the atrium and stood through a work */
    k.box(70, 24, 14, 0, 12, FZ - 7, glassDark);
    for (let x = -34; x <= 34; x += 4) k.box(0.3, 24, 0.3, x, 12, FZ + 0.1, black);
    k.box(70, 0.6, 14, 0, 24, FZ - 7, black);
    k.box(10, 4, 0.2, 0, 2, FZ, glass); k.block(-35, -3, FZ - 0.4, FZ + 0.4); k.block(3, 35, FZ - 0.4, FZ + 0.4);
    k.box(40, 6, 2, 0, 27, FZ - 1, black);
    /* wave 5b: the landmark's name in the house type in place of a copy of its logo */
    hsign(k, 'THE MUSEUM OF MODERN ART', 30, 2.2, 0, 27, FZ + 0.06, 0, { fg: '#f4f4f2', font: 'W2 Archivo Expanded', size: 0.62, lit: true });
    mlowBanner(k, -18, 12, FZ + 0.6, 0, 3.6, false); blossomFlag(k, 18, 12, FZ + 0.6, 0, 3.0, 1, 'cloud');
    k.box(40, 0.3, 14, 0, 0.15, FZ - 7, floorT);
    for (let i = 0; i < 4; i++) k.prop('rope_stanchion', -6 + i * 4, 0.15, FZ - 4, { height: 1.0 });
    k.egg(v(-10, 1.6, FZ + 1.6), { id: 'momaatrium-1939', title: 'Rockefeller land', year: '1939', text: 'MoMA\'s International Style building by Philip L. Goodwin and Edward Durell Stone opened on 10 May 1939 on land given by John D. Rockefeller Jr., who did not care for the museum himself. Taniguchi\'s expansion restored that building\'s white marble facade and its canopy.', clue: 'Stop on the 53rd Street pavement in front of the glass.', source: { name: 'Museum of Modern Art, Wikipedia', url: 'https://en.wikipedia.org/wiki/Museum_of_Modern_Art' } }, { r: 1.6 });
    k.egg(v(-9, 1.4, FZ - 4), { id: 'momaatrium-fridays', title: 'Friday nights', text: 'New York State residents get into MoMA free every Friday from 5:30 to 8:30 in the evening, under the Uniqlo Friday Nights program.', clue: 'Look at the rope line in the lobby.', source: { name: 'Museum of Modern Art, Wikipedia', url: 'https://en.wikipedia.org/wiki/Museum_of_Modern_Art' } }, { r: 1.4 });
    k.egg(v(15, 1.6, FZ - 10), { id: 'momaatrium-garden', title: 'The garden came first', year: '1953', text: 'The sculpture garden behind the lobby opened in 1939, laid out by Alfred H. Barr Jr. and the curator John McAndrew. Philip Johnson redesigned it in 1953 as the Abby Aldrich Rockefeller Sculpture Garden, and Taniguchi treated it as the core of the museum, with views into it from every building around it.', clue: 'Walk to the far east end of the lobby, toward the garden.', source: { name: 'AD Classics: The Museum of Modern Art, ArchDaily', url: 'https://www.archdaily.com/430903/ad-classics-the-museum-of-modern-art' } }, { r: 1.6 });
    // the atrium: a white shaft with cut through balconies at four levels, glass bridges, the stair, the mobile
    const AX = 0, AZ = FZ - 14 - 22, AW = 40, AD = 44, AH = 34;
    k.box(AW, 0.3, AD, AX, 0.15, AZ, floorT);
    for (const s of [-1, 1]) { k.box(0.8, AH, AD, AX + s * AW / 2, AH / 2, AZ, white); k.block(AX + s * AW / 2 - 0.6, AX + s * AW / 2 + 0.6, AZ - AD / 2, AZ + AD / 2); }
    k.box(AW, AH, 0.8, AX, AH / 2, AZ - AD / 2, white); k.block(AX - AW / 2, AX + AW / 2, AZ - AD / 2 - 0.6, AZ - AD / 2 + 0.6);
    k.box(AW, AH, 0.8, AX, AH / 2, AZ + AD / 2, white); k.block(AX - AW / 2, -3, AZ + AD / 2 - 0.6, AZ + AD / 2 + 0.6); k.block(3, AX + AW / 2, AZ + AD / 2 - 0.6, AZ + AD / 2 + 0.6);
    k.box(AW + 2, 0.4, AD + 2, AX, AH, AZ, glass); for (let x = -AW / 2; x <= AW / 2; x += 4) k.box(0.3, 0.4, AD + 2, AX + x, AH + 0.1, AZ, steel);
    for (let lvl = 1; lvl <= 4; lvl++) { const y = lvl * 7.6; for (const s of [-1, 1]) { const w = lvl % 2 ? 9 : 6; k.box(w, 0.5, AD - 2, AX + s * (AW / 2 - w / 2 - 0.4), y, AZ, white); k.box(0.1, 1.1, AD - 2, AX + s * (AW / 2 - w - 0.4), y + 0.8, AZ, glass); k.box(0.06, 0.06, AD - 2, AX + s * (AW / 2 - w - 0.4), y + 1.35, AZ, steel); } if (lvl === 2 || lvl === 4) { k.box(AW - 12, 0.4, 3, AX, y, AZ - AD / 2 + 8 + (lvl === 4 ? 20 : 0), glass); for (const s of [-1, 1]) k.box(AW - 12, 0.06, 0.06, AX, y + 1.2, AZ - AD / 2 + 8 + (lvl === 4 ? 20 : 0) + s * 1.5, steel); } for (let z = -18; z <= 18; z += 9) k.point(AX, y + 5, AZ + z, 0xffffff, 26, 18); }
    for (let i = 0; i < 24; i++) k.box(4, 0.32, 0.9, AX + AW / 2 - 6.4, 0.16 + i * 0.32, AZ + AD / 2 - 3 - i * 0.9, white);
    for (let i = 0; i < 24; i++) k.box(4, 0.32, 0.9, AX - AW / 2 + 6.4, 7.6 + 0.16 + i * 0.32, AZ - AD / 2 + 3 + i * 0.9, white);
    k.block(AX + AW / 2 - 8.6, AX + AW / 2 - 4.2, AZ + AD / 2 - 25, AZ + AD / 2 - 2.6);
    k.prop('mobile', AX, 19, AZ, { height: 11 }).then((o) => { if (o && !ctx.reduced) k.ticks.push((t) => { o.rotation.y = t * 0.08; o.children.forEach((c, i) => { c.rotation.y = Math.sin(t * 0.3 + i) * 0.4; }); }); });
    for (let i = 0; i < 6; i++) k.point(AX + (i % 2 ? 10 : -10), 26, AZ - 15 + i * 6, 0xffffff, 40, 26);
    eyeMedallion(k, AX, 0.16, AZ + AD / 2 - 6, 2.4);
    k.egg(v(AX, 1.6, AZ - 4), { id: 'momaatrium-110', title: 'A hundred and ten feet of white', year: '2004', text: 'Yoshio Taniguchi\'s atrium rises 110 feet, with openings cut in its walls so visitors in the galleries can look into it. His expansion reopened the museum on 20 November 2004; the whole project cost $858 million, the Midtown renovation alone $425 million.', clue: 'Stand in the middle of the atrium floor and look straight up.', source: { name: 'AD Classics: The Museum of Modern Art, ArchDaily', url: 'https://www.archdaily.com/430903/ad-classics-the-museum-of-modern-art' } }, { r: 1.8 });
    k.egg(v(AX + AW / 2 - 6.4, 2.2, AZ + AD / 2 - 7), { id: 'momaatrium-2019', title: 'Bigger again', year: '2019', text: 'MoMA expanded again with Diller Scofidio + Renfro and Gensler and reopened on 21 October 2019, adding 47,000 square feet of gallery space and bringing the museum to 708,000 square feet in all.', clue: 'Start up the stair on the east side of the atrium.', source: { name: 'Museum of Modern Art, Wikipedia', url: 'https://en.wikipedia.org/wiki/Museum_of_Modern_Art' } }, { r: 1.4 });
    donorWall(k, AX, 4.6, AZ - AD / 2 + 0.42, 0, 12, true);
    for (const x of [-10, 10]) k.prop('museum_bench', AX + x, 0.15, AZ, { height: 0.58, keepOut: 1.4 });
    k.prop('bronze_figure', AX - 8, 0.15, AZ - 12, { height: 3.2, keepOut: 1.4 }); k.prop('noguchi_stone_2', AX + 8, 0.15, AZ + 10, { height: 2.6, keepOut: 1.6 });
    k.crowd([v(-6, 0.15, FZ - 4), v(0, 0.15, AZ + 12), v(-10, 0.15, AZ - 4), v(8, 0.15, AZ - 16), v(12, 0.15, AZ + 6)], 28, { seed: 116, speed: 0.4, spread: 2.6, animate: !ctx.reduced, closed: true, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a, 0x33477f, 0xd8d0c0] });
    k.crowd([v(AX - 12, 7.6, AZ - 18), v(AX - 12, 7.6, AZ + 18)], 8, { seed: 117, speed: 0.3, spread: 1.6, animate: !ctx.reduced });
    k.censusWall({ x: AX + AW / 2 - 0.82, y: 16, z: AZ, rotY: -PI / 2, cols: 40, rows: 10, tile: 0.55, gap: 0.05, start: ctx.wallStart(5500, 400), pieces: ctx.all, backing: dark });
    /* ---- 2026-11-24 (wave 5b): the 53rd Street front dressed, the lobby furnished, the escalators built, one trick ---- */
    const granite = sc(k, 'momaatrium', 'granite_tile', 1.2, () => X.ashlar(0x2a2a2c, 262, 2), { roughness: 0.3, color: 0x55555a }, 0x2a2a2e),
      pav = sc(k, 'momaatrium', 'concrete_pavers', 1.6, () => X.pavers(0x8e8b84, 5), { roughness: 0.85 }, 0x8e8b84),
      steelD = k.flat(0x2a2e33, 0.8, 0.35);
    /* the pavement along the black front, a black granite base course, a steel canopy, two revolving doors */
    k.box(70, 0.28, 8, 0, 0.0, FZ + 4, pav);
    for (const s of [-1, 1]) k.box(29, 1.2, 0.5, s * 20.5, 0.6, FZ + 0.25, granite);
    k.box(14, 0.3, 4.2, 0, 4.7, FZ + 2.1, steelD);
    for (const s of [-1, 1]) k.beam(v(s * 6, 4.85, FZ + 3.9), v(s * 6, 9, FZ + 0.1), 0.04, steelD, 6);
    hsign(k, '11 WEST 53 STREET', 6, 0.26, 0, 4.7, FZ + 4.22, 0, { fg: '#f4f4f2', font: 'W2 JetBrains Mono', size: 0.8, lit: true });
    for (const s of [-1, 1]) {
      const dx = s * 4.4;
      k.cyl(1.25, 0.24, dx, 3.0, FZ, steelD, 1.25, 24); k.cyl(1.25, 0.1, dx, 0.2, FZ, steelD, 1.25, 24);
      k.mesh(new T.CylinderGeometry(1.2, 1.2, 2.7, 24, 1, true), glass, dx, 1.6, FZ);
      const wings = new T.Group(); wings.position.set(dx, 1.6, FZ);
      for (let i = 0; i < 4; i++) { const p = new T.Mesh(new T.BoxGeometry(1.15, 2.5, 0.05), glass); p.position.set(Math.cos((i * PI) / 2) * 0.58, 0, Math.sin((i * PI) / 2) * 0.58); p.rotation.y = -(i * PI) / 2; wings.add(p); }
      k.add(wings);
      if (!ctx.reduced) k.ticks.push((t) => { wings.rotation.y = t * 0.35 * s; });
    }
    many(k, 'momaatrium/ph_street_lamp_02', { height: 6.6 }, [[-30, 0.14, FZ + 7.4, 0], [-16, 0.14, FZ + 7.4, 0], [16, 0.14, FZ + 7.4, 0], [30, 0.14, FZ + 7.4, 0]]);
    many(k, 'momaatrium/ph_fire_hydrant', { height: 0.8 }, [[8.6, 0.14, FZ + 7.2, 0.4]]);
    many(k, 'momaatrium/ph_metal_trash_can', { height: 1.0 }, [[-11.2, 0.14, FZ + 7.1, 0], [12.2, 0.14, FZ + 7.1, 0.6]]);
    /* the lobby: a design platform on the way in, real chairs, a table and a lamp on it (Poly Haven scans, CC0) */
    k.box(7, 0.36, 6, 13, 0.33, 5, k.flat(0xf2f2ee, 0, 0.6)); k.keepOut.push({ x: 13, z: 5, r: 3.9 });
    many(k, 'momaatrium/ph_mid_century_lounge_chair', { height: 0.86 }, [[11.0, 0.51, 4.0, 0.7]]);
    many(k, 'momaatrium/ph_modern_arm_chair_01', { height: 0.8 }, [[15.0, 0.51, 3.4, -0.6]]);
    many(k, 'momaatrium/ph_modern_coffee_table_01', { height: 0.42 }, [[13.0, 0.51, 5.8, 0.2]]);
    many(k, 'momaatrium/ph_desk_lamp_arm_01', { height: 0.5 }, [[13.3, 0.93, 5.7, 0.9]]);
    k.box(0.05, 1.0, 0.05, 13, 0.51 + 0.5, 7.9, steelD);
    hsign(k, 'ARCHITECTURE AND DESIGN', 2.6, 0.34, 13, 1.15, 7.95, 0, { fg: '#16181c', bg: '#f4f4f2', font: 'W2 Archivo Expanded', size: 0.5, lit: false });
    hsign(k, 'ATRIUM  GALLERIES 2 TO 6', 9, 0.55, 0, 5.4, AZ + AD / 2 + 0.43, 0, { fg: '#16181c', font: 'W2 Archivo Expanded', size: 0.6, lit: false });
    /* the escalators: two runs up the west side of the lobby to the second floor, their steps riding */
    {
      const L = Math.hypot(10.8, 7.3), a = Math.atan2(7.3, 10.8), z0 = 10, z1 = -0.8, y0 = 0.3, y1 = 7.6, n = 30;
      const stepG = new T.BoxGeometry(1.05, 0.05, 0.38), stepM = k.flat(0x3a3d42, 0.7, 0.4), dir = new T.Vector3(0, y1 - y0, z1 - z0).normalize();
      for (const ex of [-16.6, -14.3]) {
        const truss = k.box(1.6, 0.9, L, ex, (y0 + y1) / 2 - 0.5, (z0 + z1) / 2, k.flat(0xb8bcc2, 0.8, 0.3)); truss.rotation.x = a;
        for (const s of [-1, 1]) {
          const bal = k.box(0.04, 1.0, L, ex + s * 0.78, (y0 + y1) / 2 + 0.45, (z0 + z1) / 2, glass); bal.rotation.x = a;
          k.beam(v(ex + s * 0.78, y0 + 1.0, z0 + 0.6), v(ex + s * 0.78, y1 + 1.0, z1 - 0.6), 0.04, black, 6);
        }
        k.box(1.6, 0.06, 1.4, ex, y0 + 0.02, z0 + 0.9, steelD); k.box(1.6, 0.06, 1.4, ex, y1 + 0.02, z1 - 0.9, steelD);
        const steps = new T.InstancedMesh(stepG, stepM, n); steps.frustumCulled = false; k.scene.add(steps); k.dynamic.add(steps);
        const m4 = new T.Matrix4(), up = ex < -15 ? 1 : -1;
        const place = (t: number) => { for (let i = 0; i < n; i++) { let f = (i / n + t * 0.03 * up) % 1; if (f < 0) f += 1; steps.setMatrixAt(i, m4.makeTranslation(ex, y0 + 0.06 + (y1 - y0) * f, z0 + (z1 - z0) * f)); } steps.instanceMatrix.needsUpdate = true; };
        place(0);
        if (!ctx.reduced) k.ticks.push(place);
        void dir;
      }
      k.block(-17.8, -13.1, -0.6, 10.9);
    }
    /* the garden through the east glass: a Firefly plate, invisible until its file lands */
    fireflyPlate(k, 'assets/museum/tex/momaatrium/ff_sculpture_garden.webp', 14, 11, 34.7, 5.6, 5, -PI / 2, CLEAR(k));
    /* one trick (ON LOCATION rule 9): letters on the atrium floor that stand up only from the doorway */
    anamorph(k, 'LOOK UP', 0, -4.5, 3, 0.31, 9, 8, 1.6, '#1b1d22', 150);
    k.egg(v(0, 0.6, -11), { id: 'momaatrium-lookup', title: 'Painted for the doorway', text: 'Taniguchi cut openings into the atrium walls so that people in the galleries can look into the void and down at the floor. The two words on the floor here are stretched so that they stand up only from the atrium doorway, and from anywhere else they are a smear of paint.', clue: 'Stand in the atrium doorway and look down at the floor.', source: { name: 'AD Classics: The Museum of Modern Art, ArchDaily', url: 'https://www.archdaily.com/430903/ad-classics-the-museum-of-modern-art' } }, { r: 1.8 });
    // the works: the great white end wall (one very large), the ground floor walls, the balcony backs at level one and two
    const mounts: Mount[] = [];
    mounts.push({ position: v(AX, 14, AZ - AD / 2 + 0.42), rotation: 0, target: v(AX, 6, AZ + 10), width: 16, height: 9, style: 'none', wash: true });
    for (let i = 0; i < 4; i++) { const z = AZ - 15 + i * 10; mounts.push({ position: v(AX - AW / 2 + 0.42, 3.4, z), rotation: PI / 2, target: v(AX, 3, z), width: 4.8, height: 2.8, style: 'white', wash: true }); }
    for (let i = 0; i < 2; i++) { const z = AZ - 8 + i * 16; mounts.push({ position: v(AX + AW / 2 - 0.42, 3.4, z), rotation: -PI / 2, target: v(AX, 3, z), width: 4.8, height: 2.8, style: 'white', wash: true }); }
    /* wave 5b: the east balcony targets stood over the stair's block; they stand nearer the wall now */
    for (const lvl of [1, 2]) { const y = lvl * 7.6; for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = AZ - 12 + i * 12; mounts.push({ position: v(AX + s * (AW / 2 - 0.42), y + 3.2, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(AX + s * (s < 0 ? AW / 2 - 6 : AW / 2 - 2.8), y + 2.5, z), width: 3.6, height: 2.1, style: 'white', wash: true }); } }
    for (const x of [-12, 8]) mounts.push({ position: v(AX + x, 3.4, AZ + AD / 2 - 0.42), rotation: PI, target: v(AX + x, 3, AZ + 4), width: 4.4, height: 2.6, style: 'white', wash: true });
    return { mounts, spawn: v(-8, 3, 46), look: v(0, 14, FZ), eye: 3, bounds: [-AW / 2 + 1.2, AW / 2 - 1.2, AZ - AD / 2 + 1, 50], style: 'white', floorY: (x, z) => { if (x > AX + AW / 2 - 8.6 && x < AX + AW / 2 - 4.2 && z < AZ + AD / 2 - 2.6 && z > AZ + AD / 2 - 25) return Math.min(7.6, ((AZ + AD / 2 - 2.6 - z) / 21.6) * 7.6); if (x > AX + AW / 2 - 9.4 && z <= AZ + AD / 2 - 25 && z > AZ - AD / 2 + 1 && x < AX + AW / 2 - 0.4) return 7.6; return 0; } };
  },
};

/* ---------------- 88 THE NEW MUSEUM ---------------- */
export const newmuseum: RoomDef = {
  id: 'newmuseum',
  name: 'The stacked boxes',
  area: 'THE NEW MUSEUM',
  mood: 'Bowery, late afternoon',
  color: '#c8ccd0',
  description: 'The Bowery with its restaurant supply stores, then the seven shifted boxes in silver mesh, the tall gallery with the light slot, the sky room at the top, the works on raw white walls.',
  signatures: 'The stack of aluminium mesh clad boxes each shifted off the one below, the slot windows where the shifts open, the double height gallery with a skylight strip, the green elevator, the sky room with its wraparound terrace.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad0, horizon: 0xe8e8e0, ground: 0x5a5a55, fog: 0.0022, sun: { az: 4.2, el: 0.5, color: 0xfff4e6, size: 12 }, env: 0.9 });
    k.hemi(0xffffff, 0x5a5a58, 0.85);
    k.sun(0xfff4e6, 2.0, -40, 60, 40, true, 80);
    /* 2026-11-24 (wave 5b): the boxes wear a matte grey under a layer of expanded aluminium mesh (below); scanned
       concrete floors and white plaster inside (Poly Haven, CC0) */
    const mesh = k.flat(0x6e747a, 0.4, 0.6),
      white = sc(k, 'newmuseum', 'white_plaster_02', 7, () => X.plaster(0xf6f6f4, 133), { roughness: 0.92, color: new T.Color(2.75, 2.77, 2.8), normal: 0.15 }, 0xe8e8e4),
      floorC = sc(k, 'newmuseum', 'concrete_floor_02', 2.6, () => X.concrete(0xb8b8b4, 134), { roughness: 0.6, color: new T.Color(1.25, 1.27, 1.34) }, 0x9a9890),
      glass = k.glass(0xdcecf6, 0.14, 0.04), green = k.flat(0x3aa06a, 0.2, 0.5), dark = k.flat(0x1a1c20, 0.5, 0.6), steel = k.flat(0x8c98a4, 0.9, 0.3);
    // the Bowery: low buildings with roll gates, the stack rising above them
    scanStreet(k, 'newmuseum', { w: 22, len: 160, z: 30, x: 0 });
    blockFront(k, { x: -30, z0: 100, count: 14, face: 1, seed: 263, h: [10, 16] });
    blockFront(k, { x: 30, z0: 100, count: 6, face: -1, seed: 264, h: [10, 14] });
    const BX = 22, BZ = -16;
    const boxes: [number, number, number, number][] = [[22, 8, 0, 0], [20, 6, 1.6, -1], [22, 7, -1.4, 1.2], [18, 6, 2.6, -1.6], [20, 7, -1.2, 1.4], [16, 6, 2.2, -0.6], [14, 5, 0.4, 1.8]];
    let y = 0;
    boxes.forEach(([w, h, dx, dz], i) => { k.box(w, h, w, BX + dx, y + h / 2, BZ + dz, mesh); if (i > 0) k.box(w - 4, 0.4, 3, BX + dx - w / 2 + (i % 2 ? w - 2 : 2), y + 0.2, BZ + dz + w / 2 - 1.5 + 0.2, glass); y += h; });
    /* the roof plant box in the same mesh; the green belongs inside, in the elevator cabs */
    k.box(3, 6, 3, BX + 8, y + 3, BZ - 6, mesh);
    k.egg(v(BX, 1.8, BZ + 12.6), { id: 'newmuseum-stack', title: 'Seven boxes, no columns', year: '2007', text: 'SANAA stacked seven boxes of different proportions round a central core and pushed them off centre, leaving zoning floor area unused. Where a box overhangs the one below, the shift makes room for a skylight. Steel trusses carry the loads, so the galleries need no columns, and the whole thing wears two layers of industrial aluminium mesh.', clue: 'Stand on the Bowery and look up at how each box slides off the one below.', source: { name: 'The New Museum, Arch Journey', url: 'https://archjourney.org/projects/the-new-museum/' } }, { r: 1.8 });
    k.egg(v(BX + 13.5, 1.6, BZ + 13), { id: 'newmuseum-tucker', title: 'From Fifth Avenue to the Bowery', year: '1977', text: 'The independent curator Marcia Tucker founded the New Museum in 1977 in the New School\'s Graduate Center at 65 Fifth Avenue; in 1983 it moved to the Astor Building at 583 Broadway in SoHo. It sold the SoHo home for $18 million, bought this Bowery site for $5 million, and opened the building here on 1 December 2007.', clue: 'Walk along the Bowery to the south edge of the building.', source: { name: 'New Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/New_Museum' } }, { r: 1.6 });
    k.egg(v(BX + 16, 1.6, BZ + 18), { id: 'newmuseum-oma', title: 'The neighbour next door', year: '2026', text: 'In 2008 the museum bought the building next door at 231 Bowery, and in 2017 it hired OMA, where Shohei Shigematsu and Rem Koolhaas designed an addition meant to double the exhibition space. The museum closed in March 2024 for the work and reopened on 21 March 2026.', clue: 'Look at the lot just south of the stack.', source: { name: 'New Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/New_Museum' } }, { r: 1.6 });
    /* wave 5b: the glazed ground floor, its doorway widened to meet the gallery door behind it (they overlapped by 10 cm) */
    k.block(BX - 11, BX - 5, BZ + 10.6, BZ + 11.4); k.block(BX + 2, BX + 11, BZ + 10.6, BZ + 11.4);
    hsign(k, 'NEW MUSEUM', 9, 1.3, BX + 4, 6.7, BZ + 11.32, 0, { fg: '#111214', font: 'W2 Archivo Expanded', size: 0.72, lit: false });
    mlowBanner(k, BX - 8, 12, BZ + 11.3, 0, 3.0, true);
    blossomFlag(k, BX - 12.4, 4, BZ + 4, PI / 2, 2.4, 7, 'cloud');
    // inside: the lobby, the tall gallery with its skylight slot, the freight stair to the second gallery, the sky room
    const GW = 20, GD = 20;
    k.box(GW, 0.3, GD, BX, 0.15, BZ, floorC);
    for (const s of [-1, 1]) { k.box(0.4, 14, GD, BX + s * GW / 2, 7, BZ, white); k.block(BX + s * GW / 2 - 0.4, BX + s * GW / 2 + 0.4, BZ - GD / 2, BZ + GD / 2); }
    k.box(GW, 14, 0.4, BX, 7, BZ - GD / 2, white); k.block(BX - GW / 2, BX + GW / 2, BZ - GD / 2 - 0.4, BZ - GD / 2 + 0.4);
    k.box(GW, 14, 0.4, BX, 7, BZ + GD / 2, white); k.block(BX - GW / 2, BX - 1.8, BZ + GD / 2 - 0.4, BZ + GD / 2 + 0.4); k.block(BX + 1.8, BX + GW / 2, BZ + GD / 2 - 0.4, BZ + GD / 2 + 0.4);
    k.box(GW, 0.4, GD, BX, 14, BZ, dark);
    /* the elevator by the entrance, its doors open on the cab's green */
    k.box(2.4, 3.0, 0.12, BX + 6, 1.65, BZ + GD / 2 - 0.28, green); k.box(3.0, 3.4, 0.08, BX + 6, 1.85, BZ + GD / 2 - 0.24, steel);
    k.egg(v(BX + 6, 1.8, BZ + GD / 2 - 0.9), { id: 'newmuseum-green', title: 'Tree frog green', text: 'Inside this pale, plain building, the elevator cabs are a tart tree frog green, as a Brooklyn Rail critic put it, like glimpsing the innards of the organism. The galleries around them have poured concrete floors, white walls and bare fluorescent light.', clue: 'Find the elevator beside the entrance and look inside.', source: { name: 'Kazuyo Sejima and Ryue Nishizawa, SANAA, The Brooklyn Rail', url: 'https://brooklynrail.org/2008/02/artseen/kazuyo-sejima-and-ryue-nishizawa-sanaa/' } }, { r: 1.3 });
    k.egg(v(BX - GW / 2 + 1.3, 2.2, BZ + GD / 2 - 5), { id: 'newmuseum-stair', title: 'The narrow stair', text: 'Between the third and fourth floors runs a long, very narrow staircase, with stubby fluorescent tubes sticking out of its wall.', clue: 'Climb the narrow stair along the west wall.', source: { name: 'Kazuyo Sejima and Ryue Nishizawa, SANAA, The Brooklyn Rail', url: 'https://brooklynrail.org/2008/02/artseen/kazuyo-sejima-and-ryue-nishizawa-sanaa/' } }, { r: 1.3 });
    k.mesh(new T.PlaneGeometry(3, GD - 2), k.glow(0xffffff, 0.9), BX + 6, 13.8, BZ).rotation.x = PI / 2;
    for (let z = -8; z <= 8; z += 8) k.point(BX + 6, 11, BZ + z, 0xffffff, 26, 16);
    for (let i = 0; i < 20; i++) k.box(2.4, 0.35, 0.9, BX - GW / 2 + 1.3, 0.17 + i * 0.35, BZ + GD / 2 - 1 - i * 0.9, floorC);
    k.box(GW, 0.4, 6, BX, 7.2, BZ - GD / 2 + 3, floorC); k.box(6, 0.4, GD, BX - GW / 2 + 3, 7.2, BZ, floorC);
    k.box(0.1, 1.1, GD - 6, BX - GW / 2 + 6, 7.9, BZ + 3, glass); k.box(GW - 6, 1.1, 0.1, BX + 3, 7.9, BZ - GD / 2 + 6, glass);
    k.block(BX - GW / 2 + 0.4, BX - GW / 2 + 2.6, BZ - GD / 2 + 0.4, BZ + GD / 2 - 0.4);
    donorWall(k, BX, 4.2, BZ - GD / 2 + 0.22, 0, 9, true);
    eyeMonument(k, BX + 4, 0.15, BZ + 2, PI, 3.6);
    k.prop('vitrine', BX - 3, 0.15, BZ - 4, { height: 1.7, keepOut: 1.2 });
    k.prop('track_light', BX, 13.6, BZ - 5, { height: 0.5 }); k.prop('track_light', BX, 13.6, BZ + 5, { height: 0.5 });
    k.crowd([v(0, 0, 60), v(4, 0, 10), v(BX - 4, 0.15, BZ + 8), v(BX + 4, 0.15, BZ - 6)], 22, { seed: 118, speed: 0.4, spread: 2.2, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a] });
    k.censusWall({ x: BX + GW / 2 - 0.22, y: 10.4, z: BZ, rotY: -PI / 2, cols: 30, rows: 6, tile: 0.55, gap: 0.05, start: ctx.wallStart(6300, 180), pieces: ctx.all, backing: dark });
    /* ---- 2026-11-24 (wave 5b): the mesh skin, the glazed lobby, the restaurant supply row, bare tubes, one trick ---- */
    const steelD = k.flat(0x2a2e33, 0.8, 0.35);
    /* expanded aluminium mesh, a painted diamond lattice hung 22 cm off every face so it moves against the box behind */
    if (HAS_DOM) {
      const mt = paintTex(256, 256, (g) => { g.strokeStyle = 'rgba(236,238,240,1)'; g.lineWidth = 13; g.lineCap = 'square'; for (let b = -512; b <= 768; b += 64) { g.beginPath(); g.moveTo(0, b); g.lineTo(256, b + 128); g.stroke(); g.beginPath(); g.moveTo(0, b); g.lineTo(256, b - 128); g.stroke(); } }, [], true);
      mt.wrapS = mt.wrapT = T.RepeatWrapping;
      const mm = new T.MeshStandardMaterial({ map: mt, transparent: true, depthWrite: false, metalness: 0.55, roughness: 0.42, color: 0xf0f2f4, side: T.DoubleSide });
      const skin = (w: number, h: number, x: number, yy: number, z: number, r: number) => { const g = new T.PlaneGeometry(w, h), uv = g.attributes.uv as T.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (w / 0.75), uv.getY(i) * (h / 0.75)); const o = k.mesh(g, mm, x, yy, z, true); o.rotation.y = r; };
      let yb = 0;
      boxes.forEach(([w, h, dx, dz], i) => {
        const y0 = i === 0 ? 5.6 : yb, hh = yb + h - y0, cy = y0 + hh / 2, cx = BX + dx, cz = BZ + dz, o = w / 2 + 0.22;
        skin(w + 0.44, hh, cx, cy, cz + o, 0); skin(w + 0.44, hh, cx, cy, cz - o, PI); skin(w + 0.44, hh, cx + o, cy, cz, PI / 2); skin(w + 0.44, hh, cx - o, cy, cz, -PI / 2);
        yb += h;
      });
      /* the tall gallery's walls rose 6 m above the first box in bare plaster; clad and skinned like the rest */
      skin(22.4, 6, BX, 11, BZ + GD / 2 + 1.03, 0); skin(20.4, 6, BX - GW / 2 - 0.82, 11, BZ, -PI / 2);
    }
    k.box(22, 6, 0.3, BX, 11, BZ + GD / 2 + 0.45, mesh); k.box(0.3, 6, 20.4, BX - GW / 2 - 0.45, 11, BZ, mesh);
    /* the storefront: dark glass either side of the open doors, steel mullions, a steel band over it, the address */
    const shop = k.glass(0x2a3a44, 0.55, 0.06);
    k.box(6, 5.2, 0.1, BX - 8, 2.6, BZ + 11.08, shop); k.box(9, 5.2, 0.1, BX + 6.5, 2.6, BZ + 11.08, shop);
    for (let x = BX - 11; x <= BX + 11.01; x += 1.5) if (x < BX - 5.2 || x > BX + 1.8) k.box(0.08, 5.2, 0.14, x, 2.6, BZ + 11.12, steelD);
    k.box(22.4, 0.5, 0.6, BX, 5.45, BZ + 11.3, steelD);
    hsign(k, '235 BOWERY', 2.2, 0.32, BX + 3.4, 3.6, BZ + 11.16, 0, { fg: '#f4f4f2', font: 'W2 JetBrains Mono', size: 0.8, lit: false });
    /* the Bowery's restaurant supply row across the side street: shopfronts, gates, steel, stoves and pots on the pavement
       (Poly Haven scans, CC0); the trade names are invented */
    /* five low supply buildings, brick with a cornice and windows, built here so no fire escape or tank comes with them */
    const supB = [k.pbr('nbBrickA', X.brick(0x6b4437, 21), 0.28), k.pbr('nbBrickB', X.brick(0x4f3b36, 22), 0.28), k.pbr('nbStone', X.ashlar(0xb9ad97, 23, 3), 0.22)], supC = k.pbr('nbCornice', X.plaster(0xb8ad9a, 3), 0.6), supG = k.glass(0x9fc4d8, 0.35, 0.08), supW = k.glow(0xffd28a);
    [11, 9.5, 12.5, 10, 13].forEach((hh, b) => { const z = 50 - b * 8; k.box(9, hh, 7.9, 21.5, hh / 2, z, supB[b % 3]); k.moulding([[0, 0], [0.7, 0], [0.8, 0.2], [0.5, 0.35], [0.6, 0.55], [0.25, 0.75], [0, 0.85]], 8.1, 17.05, hh - 0.5, z, supC, PI); for (let yy = 5.6; yy < hh - 1.5; yy += 2.7) for (const dz of [-2.6, 0, 2.6]) { k.box(0.2, 1.9, 1.35, 17.06, yy, z + dz, supC); k.box(0.05, 1.65, 1.1, 16.94, yy, z + dz, (b + dz + yy) % 3 > 1.6 ? supW : supG); } });
    k.box(1.6, 0.28, 42, 16.8, 0.0, 34, sc(k, 'newmuseum', 'concrete_pavers', 1.6, () => X.pavers(0x8e8b84, 5), { roughness: 0.85 }, 0x8e8b84));
    k.block(15.4, 32, 14, 54);
    const trades: [string, string, string][] = [['RESTAURANT SUPPLY', '#f4f2ea', '#b8202a'], ['KITCHEN EQUIPMENT', '#b8202a', '#f4f2ea'], ['STAINLESS STEEL  WHOLESALE', '#111214', '#f1c531'], ['LIGHTING  FIXTURES', '#f4f2ea', '#1d3f8e'], ['CHAIRS  TABLES  STOOLS', '#f1c531', '#111214']];
    trades.forEach(([t, fg, bg], b) => {
      const z = 50 - b * 8;
      hsign(k, t, 6.6, 0.9, 16.93, 3.7, z, -PI / 2, { fg, bg, font: 'W2 Archivo Expanded', size: 0.58, lit: false });
      fireflyPlate(k, 'assets/museum/tex/newmuseum/ff_supply_window.webp', 5.6, 2.6, 16.95, 1.6, z, -PI / 2, k.flat(0x1c2024, 0.2, 0.5));
    });
    many(k, 'newmuseum/ph_rollershutter_door', { width: 5.8 }, [[16.9, 0.14, 42, -PI / 2], [16.9, 0.14, 18, -PI / 2]], (o) => o.scale.y *= 0.55);
    many(k, 'newmuseum/ph_steel_frame_shelves_03', { height: 1.9 }, [[16.1, 0.14, 48.4, -PI / 2], [16.1, 0.14, 40.4, -PI / 2], [16.1, 0.14, 32.4, -PI / 2], [16.1, 0.14, 24.4, -PI / 2], [16.1, 0.14, 16.4, -PI / 2]]);
    many(k, 'newmuseum/ph_electric_stove', { height: 0.92 }, [[16.0, 0.14, 51.6, -PI / 2], [16.0, 0.14, 27.6, -PI / 2]]);
    many(k, 'newmuseum/ph_brass_pot_01', { height: 0.34 }, [[16.0, 1.06, 51.4, 0], [16.0, 1.06, 27.4, 2], [16.1, 0.82, 48.0, 0.5], [16.1, 0.82, 40.8, 2.2], [16.1, 0.82, 24.0, 1.4], [16.1, 1.42, 32.6, 0.3]]);
    many(k, 'newmuseum/ph_metal_stool_01', { height: 0.75 }, [[15.9, 0.14, 19.6, 0], [15.9, 0.14, 44.4, 1.1]]);
    many(k, 'newmuseum/ph_hand_truck', { height: 1.25 }, [[15.8, 0.14, 38.0, 0.6]]);
    many(k, 'newmuseum/ph_fire_hydrant', { height: 0.8 }, [[12.0, 0.14, 12.0, 0.3]]);
    many(k, 'newmuseum/ph_metal_trash_can', { height: 1.0 }, [[11.8, 0.14, 4.0, 0], [-11.8, 0.14, 20.0, 0.4]]);
    /* inside: exposed steel beams and bare fluorescent battens (Poly Haven, CC0) under the raw ceiling */
    for (let i = 0; i < 5; i++) k.box(GW, 0.5, 0.3, BX, 13.55, BZ - 8 + i * 4, steelD);
    void hero(k, 'newmuseum/ph_mounted_fluorescent_lights', { width: 1.5 }).then((h) => {
      if (!h || !k.live) return;
      const sy = (h.userData.size as T.Vector3).y, at: [number, number][] = [[BX - 5, BZ - 6], [BX + 5, BZ - 6], [BX - 5, BZ + 2], [BX + 5, BZ + 2]];
      at.forEach(([x, z], i) => { const c = i ? h.clone() : h; c.position.set(x, 13.3 - sy, z); c.rotation.y = PI / 2; k.add(c); });
    });
    for (const [x, z] of [[BX - 5, BZ - 6], [BX + 5, BZ - 6], [BX - 5, BZ + 2], [BX + 5, BZ + 2], [BX, BZ - 6], [BX, BZ + 2], [BX - 5, BZ - 2], [BX + 5, BZ - 2], [BX, BZ - 2]]) for (const dx of [-0.2, 0.2]) k.box(0.06, 0.05, 1.3, x + dx, 13.2, z, k.glow(0xf4f8ff));
    hsign(k, 'ELEVATOR', 1.6, 0.3, BX + 6, 3.6, BZ + GD / 2 - 0.22, PI, { fg: '#111214', font: 'W2 JetBrains Mono', size: 0.8, lit: false });
    /* one trick (ON LOCATION rule 9): the address painted across the Bowery, standing up only from the corner */
    if (HAS_DOM) anamorphTex(k, floorType('235 BOWERY', '#f2efe4'), -4, 24, 3, 0.02, -0.75, 7, 7, 1.4);
    k.egg(v(1, 0.6, 18), { id: 'newmuseum-bowery', title: 'Painted for the corner', text: 'The Bowery takes its name from the Dutch word bouwerij, a farm: it was the road out to Peter Stuyvesant\'s farm. The address painted across it here is stretched so that it stands up only from the corner you arrive on.', clue: 'Stand where you came in and look down at the road.', source: { name: 'Bowery, Wikipedia', url: 'https://en.wikipedia.org/wiki/Bowery' } }, { r: 1.8 });
    // the works: the tall gallery walls, the mezzanine, the lobby
    const mounts: Mount[] = [];
    /* wave 5b: the middle west work hung behind the narrow stair; it moves to the front wall beside the door */
    for (const i of [0, 2]) { const z = BZ - 6 + i * 6; mounts.push({ position: v(BX - GW / 2 + 0.22, 3.4, z), rotation: PI / 2, target: v(BX, 3, z), width: 4.4, height: 2.6, style: 'white', wash: true }); }
    mounts.push({ position: v(BX - 5.6, 3.4, BZ + GD / 2 - 0.22), rotation: PI, target: v(BX - 5.6, 3, BZ + 1), width: 3.6, height: 2.2, style: 'white', wash: true });
    for (let i = 0; i < 3; i++) { const z = BZ - 6 + i * 6; mounts.push({ position: v(BX + GW / 2 - 0.22, 3.4, z), rotation: -PI / 2, target: v(BX, 3, z), width: 4.4, height: 2.6, style: 'white', wash: true }); }
    for (const x of [-6, 6]) mounts.push({ position: v(BX + x, 3.4, BZ - GD / 2 + 0.22), rotation: 0, target: v(BX + x, 3, BZ), width: 4.6, height: 2.7, style: 'white', wash: true });
    for (let i = 0; i < 3; i++) { const z = BZ - 4 + i * 5; mounts.push({ position: v(BX + GW / 2 - 0.22, 10.4 - 0, z), rotation: -PI / 2, target: v(BX, 9.5, z), width: 3.6, height: 2.1, style: 'white', wash: false }); }
    for (const x of [-6, 0, 6]) mounts.push({ position: v(BX + x, 10.6, BZ - GD / 2 + 0.22), rotation: 0, target: v(BX + x, 9.5, BZ - 4), width: 3.6, height: 2.1, style: 'white', wash: true });
    /* wave 5b: these three faced the museum, away from the Bowery pavement they are seen from */
    for (let i = 0; i < 3; i++) { const z = -6 + i * 10; k.box(0.2, 3, 4.2, 8.8, 2.6, z, dark); mounts.push({ position: v(8.65, 2.6, z), rotation: -PI / 2, target: v(0, 2.5, z), width: 3.6, height: 2.1, style: 'black', wash: false }); }
    return { mounts, spawn: v(-4, 3, 24), look: v(BX, 22, BZ), eye: 3, bounds: [-10, BX + GW / 2 - 1, BZ - GD / 2 + 1, 60], style: 'white', floorY: (x, z) => { if (x > BX - GW / 2 + 0.4 && x < BX - GW / 2 + 2.6 && z < BZ + GD / 2 - 0.6 && z > BZ + GD / 2 - 19) return Math.min(7, ((BZ + GD / 2 - 0.6 - z) / 18) * 7); if (x >= BX - GW / 2 + 0.4 && x < BX - GW / 2 + 6 && z > BZ - GD / 2 && z <= BZ + GD / 2 - 19) return 7.4; if (z > BZ - GD / 2 && z < BZ - GD / 2 + 6 && x > BX - GW / 2 && x < BX + GW / 2) return 7.4; return 0; } };
  },
};

/* ---------------- 89 THE NEUE GALERIE ---------------- */
export const neuegalerie: RoomDef = {
  id: 'neuegalerie',
  name: 'The gold room',
  area: 'NEUE GALERIE',
  mood: 'Café hour',
  color: '#d8b060',
  description: 'The mansion at 86th and Fifth, the marble stair with its bronze rail, the second floor salon where the gold portrait hangs, the café below with its marble tables and newspapers.',
  signatures: 'The Beaux Arts limestone mansion with iron and glass canopy, the spiral marble staircase, the wood panelled galleries with the Vienna 1900 furniture, the café with bentwood chairs and a display of cakes.',
  build(k, ctx) {
    k.sky({ top: 0x7fa0d0, horizon: 0xe8e8e0, ground: 0x5a5a55, fog: 0.0022, sun: { az: 3.7, el: 0.65, color: 0xfff4e6, size: 12 }, env: 0.85 });
    k.hemi(0xfff0dc, 0x3a3020, 0.6);
    k.sun(0xfff0d8, 1.6, 30, 60, 40, true, 60);
    /* 2026-11-24 (wave 5b): scanned CC0 surfaces (Poly Haven): limestone block, Carrara slabs underfoot, herringbone
       parquet and dark panelling upstairs, velvet; the gilt and the cream stay painted */
    const lime = sc(k, 'neuegalerie', 'white_sandstone_blocks_02', 2.6, () => X.ashlar(0xd8d0bc, 265, 4), { roughness: 0.8, color: new T.Color(1.3, 1.28, 1.22) }, 0xd0c8b4),
      wood = sc(k, 'neuegalerie', 'dark_paneled_wood', 1.4, () => X.planks(0x5a3a26, 4, 266, 0.15), { roughness: 0.45, color: new T.Color(1.7, 1.45, 1.25) }, 0x4a2e20),
      marble = sc(k, 'neuegalerie', 'marble_01', 1.8, () => X.marble(0xe0dcd2, 0x9a948a, 18), { roughness: 0.25, color: new T.Color(1.35, 1.38, 1.42) }, 0xd8d4ca),
      floorW = sc(k, 'neuegalerie', 'herringbone_parquet', 1.4, () => X.planks(0x9a7a56, 10, 267, 0.1), { roughness: 0.4 }, 0x8a6a48),
      gold = k.pbr('ngGold', X.gilt(0xd8b060), 2, { metalness: 0.85, roughness: 0.3 }), bronze = k.flat(0x4a3a28, 0.8, 0.4), dark = k.flat(0x1a1c20, 0.5, 0.6),
      glass = k.glass(0xdcecf6, 0.14, 0.04), cream = k.pbr('ngCream', X.plaster(0xe8e0d0, 135), 0.4),
      velvet = sc(k, 'neuegalerie', 'velour_velvet', 0.8, () => X.velvet(0x4a2a3a), { roughness: 0.85, color: new T.Color(0.55, 0.42, 0.6) }, 0x4a2a3a);
    // Fifth Avenue corner, the mansion with its canopy
    scanStreet(k, 'neuegalerie', { w: 24, len: 160, z: 40, x: 0 });
    k.box(160, 0.4, 200, 100, -0.2, 0, sc(k, 'neuegalerie', 'leafy_grass', 3, () => X.grass(0x3a5a2a, 136), { roughness: 0.95, color: new T.Color(0.5, 0.8, 0.42) }, 0x3a5a2a));
    k.rail(18, 0, 160, k.flat(0x1a1c20, 0.7, 0.45), 1.0, 'z', 2.4); k.block(17.6, 18.4, -80, 80);
    const rnd = X.mulberry(89); for (let i = 0; i < 30; i++) k.tree(24 + rnd() * 60, 0, -80 + rnd() * 160, { kind: 'bare', species: i % 3 === 2 ? 'oak' : 'elm', h: 8 + rnd() * 6, r: 3 + rnd() * 2, seed: i });
    const MX = -26, MZ = 0, MW = 26, MD = 30;
    /* Carrere and Hastings, 1914: red brick with limestone trim under a slate mansard with dormers */
    const brickR = sc(k, 'neuegalerie', 'red_brick_03', 1.6, () => X.brick(0x8a4636, 289), { roughness: 0.85, color: new T.Color(1.15, 1.0, 0.95) }, 0x7a3e30), slate = sc(k, 'neuegalerie', 'roof_slates_02', 2, () => X.steel(0x3e4248, false, 290), { roughness: 0.7, color: new T.Color(0.55, 0.6, 0.7) }, 0x3e4248);
    k.box(MW, 22, MD, MX, 11, MZ, brickR);
    k.box(MW - 1.4, 3.4, MD - 1.4, MX, 23.7, MZ, slate); k.box(MW - 3.2, 0.3, MD - 3.2, MX, 25.5, MZ, slate);
    for (let i = 0; i < 5; i++) { const z = MZ - 10 + i * 5; k.box(1.0, 2.0, 1.6, MX + MW / 2 - 0.4, 23.6, z, cream); k.box(0.06, 1.4, 1.1, MX + MW / 2 + 0.12, 23.5, z, glass); }
    k.egg(v(MX + MW / 2 + 1.2, 1.6, MZ - 8), { id: 'neuegalerie-vosges', title: 'A Paris square on Fifth Avenue', year: '1914', text: 'Carrere and Hastings, the architects of the New York Public Library, finished this house in 1914 for the industrialist William Starr Miller and modelled it on the seventeenth century Place des Vosges in Paris. Red brick with limestone trim under a slate mansard, it cost about $150,000, and it is one of the few Gilded Age mansions left on Fifth Avenue.', clue: 'Stand on the Fifth Avenue pavement and look up at the slate roof and its dormers.', source: { name: '1048 Fifth Avenue, Neue Galerie', url: 'https://neuegalerie.org/learn/building' } }, { r: 1.6 });
    k.egg(v(MX + MW / 2 + 2.6, 1.6, MZ + 3.2), { id: 'neuegalerie-cottage', title: 'The gardener\'s cottage', year: '1944', text: 'After her husband died in 1942, Grace Vanderbilt had to give up the family palace at 640 Fifth Avenue and moved here once Miller\'s widow died in 1944. She called the house the gardener\'s cottage, and is said to have described herself as all alone in it, with 18 servants. She lived here until she died in 1953.', clue: 'Stop under the iron and glass canopy at the door.', source: { name: 'The story of a Fifth Avenue mansion scorned by its second owner, Ephemeral New York', url: 'https://www.goodreads.com/author_blog_posts/23264630-the-story-of-a-fifth-avenue-mansion-scorned-by-its-second-owner-as-a-ga' } }, { r: 1.4 });
    k.moulding([[0, 0], [0.9, 0], [1.0, 0.3], [0.6, 0.5], [0.8, 0.8], [0, 1.0]], MD + 0.4, MX + MW / 2 + 0.05, 21.5, MZ, lime, 0); /* wave 5b: unrotated, it runs along the Fifth Avenue front; rotated it ran 30 m through the house */
    for (let f = 0; f < 4; f++) for (let i = 0; i < 5; i++) { const y = 4 + f * 4.6, z = MZ - 10 + i * 5; k.box(0.16, 3.0, 1.8, MX + MW / 2 + 0.02, y, z, cream); k.box(0.06, 2.6, 1.5, MX + MW / 2 + 0.1, y, z, glass); if (f === 1) { k.box(0.6, 0.06, 2.2, MX + MW / 2 + 0.4, y - 1.5, z, bronze); for (let b = -1; b <= 1; b += 0.25) k.box(0.03, 0.7, 0.03, MX + MW / 2 + 0.7, y - 1.15, z + b, bronze); } }
    k.box(3.6, 0.1, 5, MX + MW / 2 + 1.8, 4.2, MZ, glass); for (const dz of [-2.4, 2.4]) k.beam(v(MX + MW / 2 + 0.2, 6, MZ + dz), v(MX + MW / 2 + 3.6, 4.3, MZ + dz), 0.04, bronze, 4);
    k.arch(2.4, 4, 1.4, MX + MW / 2, 0, MZ, lime, false, 0.85).rotation.y = PI / 2;
    k.block(MX + MW / 2 - 0.6, MX + MW / 2 + 0.6, MZ - MD / 2, MZ - 1.4); k.block(MX + MW / 2 - 0.6, MX + MW / 2 + 0.6, MZ + 1.4, MZ + MD / 2);
    hsign(k, 'NEUE GALERIE NEW YORK', 6.4, 0.62, MX + MW / 2 + 0.07, 6.5, MZ, PI / 2, { fg: '#3a3020', font: 'W2 Archivo Expanded', size: 0.66, lit: false });
    hsign(k, 'MUSEUM FOR GERMAN AND AUSTRIAN ART', 6.4, 0.3, MX + MW / 2 + 0.07, 6.02, MZ, PI / 2, { fg: '#3a3020', font: 'W2 Archivo Expanded', size: 0.6, lit: false });
    mlowBanner(k, MX + MW / 2 + 0.5, 14, MZ - 9, PI / 2, 3.0, true); blossomFlag(k, MX + MW / 2 + 0.5, 14, MZ + 9, PI / 2, 2.6, 3, 'cloud');
    // the ground floor: the entrance hall with the marble stair spiralling up, the café to the left
    const IW = MW - 1.2, ID = MD - 1.2;
    k.box(IW, 0.3, ID, MX, 0.15, MZ, marble);
    k.block(MX - IW / 2 - 0.6, MX - IW / 2 + 0.2, MZ - ID / 2, MZ + ID / 2); k.block(MX - IW / 2, MX + IW / 2, MZ - ID / 2 - 0.6, MZ - ID / 2 + 0.2); k.block(MX - IW / 2, MX + IW / 2, MZ + ID / 2 - 0.2, MZ + ID / 2 + 0.6);
    k.box(IW, 0.4, ID, MX, 5.4, MZ, cream); k.box(IW, 0.4, ID, MX, 10.4, MZ, cream); k.box(IW, 0.4, ID, MX, 15.4, MZ, dark);
    const SX = MX - 5, SZ = MZ + 8;
    const helix: T.Vector3[] = []; for (let i = 0; i <= 60; i++) { const t = i / 60; const a = PI * 0.2 + t * PI * 1.5; helix.push(v(SX + Math.cos(a) * 3.2, 0.2 + t * 5.2, SZ + Math.sin(a) * 3.2)); }
    const hs = k.spline(helix, false, 0.5); const hp = hs.getSpacedPoints(90);
    const treadG = new T.BoxGeometry(2.4, 0.16, 0.34), tm: T.Matrix4[] = []; const tan = new T.Vector3(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0);
    for (let i = 0; i < 90; i++) { const p = hp[i]; hs.getTangentAt(i / 90, tan); q.setFromAxisAngle(up, Math.atan2(tan.x, tan.z)); tm.push(new T.Matrix4().compose(p.clone().add(v(0, -0.2, 0)), q, new T.Vector3(1, 1, 1))); }
    k.instances(treadG, marble, tm);
    k.curve(hp.filter((_, i) => i % 2 === 0).map((p) => v(SX + (p.x - SX) * 1.36, p.y + 0.9, SZ + (p.z - SZ) * 1.36)), 0.04, bronze, 45);
    k.mesh(new T.CylinderGeometry(4.6, 4.6, 0.4, 32), cream, SX, 5.4, SZ);
    k.mesh(new T.CylinderGeometry(4.4, 4.4, 5.6, 32, 1, true), k.flat(0x000000, 0, 1, { transparent: true, opacity: 0 }), SX, 8.2, SZ);
    k.block(SX - 4.6, SX + 4.6, SZ - 4.6, SZ - 3.6);
    k.point(SX, 5, SZ, 0xffe6c0, 20, 12);
    k.egg(v(SX, 2.2, SZ), { id: 'neuegalerie-yivo', title: 'From YIVO to the Neue', year: '2001', text: 'After Grace Vanderbilt, the YIVO Institute for Jewish Research took over the house in 1955. Serge Sabarsky and Ronald Lauder bought it in 1994, Annabelle Selldorf converted it into a museum, and the Neue Galerie opened here on 16 November 2001.', clue: 'Stand in the well of the spiral stair and look up.', source: { name: 'William Starr Miller House, Wikipedia', url: 'https://en.wikipedia.org/wiki/William_Starr_Miller_House' } }, { r: 1.4 });
    const CX = MX - 5, CZ = MZ - 7;
    /* wave 5b: the cafe's code tables and stools are real tables and bentwood chairs (Poly Haven, CC0) */
    const tabs: number[][] = [], chairs: number[][] = [];
    for (let i = 0; i < 6; i++) { const x = CX - 6 + (i % 3) * 5, z = CZ - 3 + Math.floor(i / 3) * 5; k.keepOut.push({ x, z, r: 1.1 }); tabs.push([x, 0.3, z, i * 0.7]); for (const a of [0.4, PI + 0.4]) chairs.push([x + Math.cos(a) * 0.85, 0.3, z + Math.sin(a) * 0.85, -a - PI / 2]); }
    many(k, 'neuegalerie/ph_round_wooden_table_02', { height: 0.76 }, tabs, noShadow);
    many(k, 'neuegalerie/ph_painted_wooden_chair_01', { height: 0.92 }, chairs, (o) => { tint(o, 0x3a2418, 0.5, 0); noShadow(o); });
    k.box(4, 1.1, 1.0, CX + 4, 0.55, CZ - 7, wood); k.box(4.2, 0.1, 1.2, CX + 4, 1.12, CZ - 7, marble); k.box(3.6, 0.6, 0.8, CX + 4, 1.5, CZ - 7, glass); k.block(CX + 1.8, CX + 6.2, CZ - 7.7, CZ - 6.3);
    many(k, 'neuegalerie/ph_strawberry_chocolate_cake', { width: 0.3 }, [[CX + 2.9, 1.17, CZ - 7, 0], [CX + 5.1, 1.17, CZ - 7, 2]], noShadow);
    many(k, 'neuegalerie/ph_carrot_cake', { width: 0.3 }, [[CX + 4.0, 1.17, CZ - 6.9, 0.5]], noShadow);
    k.egg(v(CX + 4, 1.7, CZ - 6.2), { id: 'neuegalerie-sabarsky', title: 'Cafe Sabarsky', text: 'The cafe is named for Serge Sabarsky, who dreamed up the museum with Ronald Lauder and died in 1996 before it opened. It is modelled on the cafes of Vienna, with lighting by Josef Hoffmann, furniture by Adolf Loos and banquettes covered in a 1912 Otto Wagner fabric.', clue: 'Look at the cake counter in the cafe.', source: { name: 'Neue Galerie New York, Wikipedia', url: 'https://en.wikipedia.org/wiki/Neue_Galerie_New_York' } }, { r: 1.4 });
    eyeMedallion(k, MX + 3, 0.16, MZ, 1.6);
    donorWall(k, MX + IW / 2 - 0.42, 3.6, MZ - 8, -PI / 2, 7, true); /* wave 5b: moved off the cafe wall, where it hung behind a work */
    for (let i = 0; i < 3; i++) k.point(MX - 6 + i * 6, 4.6, MZ - 4, 0xffe6c0, 12, 10);
    // the salon upstairs: wood panelled walls, the gold room at the end where one work hangs alone in gilt
    const UY = 5.6;
    k.box(IW, 0.3, ID, MX, UY, MZ, floorW);
    for (const s of [-1, 1]) k.box(0.3, 4.4, ID, MX + s * (IW / 2 - 0.2), UY + 2.2, MZ, wood);
    k.box(IW, 4.4, 0.3, MX, UY + 2.2, MZ - ID / 2 + 0.2, gold);
    k.box(IW, 0.3, 0.3, MX, UY + 4.4, MZ, cream);
    /* wave 5b: the two velvet boxes are real sofas, in plum (Poly Haven, CC0) */
    for (const [x, z] of [[MX - 6, MZ + 2], [MX + 5, MZ - 4]]) k.keepOut.push({ x, z, r: 1.4 });
    many(k, 'neuegalerie/ph_Sofa_01', { width: 2.2 }, [[MX - 6, UY + 0.15, MZ + 2, 0], [MX + 5, UY + 0.15, MZ - 4, PI]], (o) => tint(o, 0x5a3048, 0.8, 0));
    for (let i = 0; i < 4; i++) k.point(MX - 6 + i * 4, UY + 4, MZ - 6 + (i % 2) * 8, 0xffe6c0, 12, 10);
    k.point(MX, UY + 3, MZ - ID / 2 + 3, 0xffd890, 30, 12);
    k.egg(v(MX + 6.5, UY + 1.7, MZ - ID / 2 + 1.4), { id: 'neuegalerie-adele', title: 'The golden portrait', year: '2006', text: 'In 2006 Ronald Lauder bought Gustav Klimt\'s Portrait of Adele Bloch-Bauer I from Maria Altmann for the Neue Galerie. Lauder said only that he paid more than $104.2 million; the press reported $135 million, which would have made it the most expensive painting ever sold at the time.', clue: 'Find the gold wall at the end of the upstairs salon.', source: { name: 'Neue Galerie New York, Wikipedia', url: 'https://en.wikipedia.org/wiki/Neue_Galerie_New_York' } }, { r: 1.4 });
    k.crowd([v(MX + 10, 0.15, MZ + 4), v(MX - 2, 0.15, MZ - 2), v(MX - 8, 0.15, MZ - 8)], 8, { seed: 119, speed: 0.25, spread: 1.4, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0x8a3a3a] });
    k.crowd([v(MX - 8, UY + 0.15, MZ + 8), v(MX + 6, UY + 0.15, MZ - 8)], 6, { seed: 120, speed: 0.2, spread: 1.4, animate: !ctx.reduced });
    k.censusWall({ x: MX - IW / 2 + 0.36, y: 2.6, z: MZ + 2, rotY: PI / 2, cols: 20, rows: 4, tile: 0.5, gap: 0.05, start: ctx.wallStart(1900, 80), pieces: ctx.all, backing: dark });
    /* ---- 2026-11-24 (wave 5b): the house built inside: walls, marble dado, pilasters, cornices, a coffered ceiling,
       chandeliers and the cafe, real furniture, signs, one trick ----
       Seen from inside, the brick box had no walls at all: its faces point outward, so the hall opened onto the sky. */
    {
      const H = 4.9, yc = 0.3 + H / 2, ex = MX + IW / 2 - 0.05, wx = MX - IW / 2 - 0.05, nz = MZ - ID / 2, sz = MZ + ID / 2;
      const DX = -19, DW = 2.0, DH = 3.2;   // the doorway in the south wall that opens on the enfilade
      k.box(0.3, H, 12.8, ex, yc, MZ - 8.0, cream); k.box(0.3, H, 12.8, ex, yc, MZ + 8.0, cream); k.box(0.3, 1.3, 3.2, ex, 4.55, MZ, cream);
      k.box(0.3, H, ID, wx, yc, MZ, cream);
      k.box(IW, H, 0.3, MX, yc, nz, cream);
      const sw = (x0: number, x1: number) => k.box(x1 - x0, H, 0.3, (x0 + x1) / 2, yc, sz, cream);
      sw(MX - IW / 2, DX - DW / 2); sw(DX + DW / 2, MX + IW / 2); k.box(DW, H - DH, 0.3, DX, 0.3 + DH + (H - DH) / 2, sz, cream);
      /* the marble dado, 1.1 m, a hair proud of the plaster */
      const dado = (w: number, x: number, z: number, r: number) => { const o = k.box(w, 1.1, 0.06, x, 0.85, z, marble); o.rotation.y = r; };
      dado(12.6, ex - 0.18, MZ - 8.0, PI / 2); dado(12.6, ex - 0.18, MZ + 8.0, PI / 2); dado(ID - 0.4, wx + 0.18, MZ, PI / 2); dado(IW - 0.4, MX, nz + 0.18, 0);
      dado(DX - DW / 2 - (MX - IW / 2) - 0.2, (MX - IW / 2 + DX - DW / 2) / 2, sz - 0.18, 0); dado(MX + IW / 2 - (DX + DW / 2) - 0.2, (DX + DW / 2 + MX + IW / 2) / 2, sz - 0.18, 0);
      /* cornices: the moulding runs along z and projects +x unrotated */
      const prof: [number, number][] = [[0, 0], [0.3, 0], [0.36, 0.12], [0.2, 0.22], [0.26, 0.36], [0, 0.42]];
      for (const [yy, mat] of [[0.3 + H - 0.42, cream], [UY + 4.4 - 0.42, gold]] as [number, T.Material][]) {
        k.moulding(prof, ID, wx + 0.15, yy, MZ, mat, 0); k.moulding(prof, ID, ex - 0.15, yy, MZ, mat, PI);
        k.moulding(prof, IW, MX, yy, nz + 0.15, mat, -PI / 2); k.moulding(prof, IW, MX, yy, sz - 0.15, mat, PI / 2);
      }
      /* marble pilasters with gilt capitals, clear of the works and the census wall */
      const pil = (x: number, z: number, r: number) => { const a = k.box(0.7, H - 0.6, 0.16, x, 0.3 + (H - 0.6) / 2, z, marble); a.rotation.y = r; const c = k.box(0.9, 0.24, 0.26, x, H - 0.2, z, gold); c.rotation.y = r; };
      for (const z of [-12, -7.6, 11.2]) pil(wx + 0.22, z, PI / 2);
      for (const x of [-20.6, -16.6]) pil(x, nz + 0.22, 0);
      for (const x of [-35.6, -23.4, -16.4]) pil(x, sz - 0.22, 0);
      /* a coffered plaster ceiling over the hall: beams both ways under the slab */
      for (let x = MX - IW / 2 + 3.1; x < MX + IW / 2; x += 3.1) k.box(0.28, 0.34, ID - 0.6, x, 5.03, MZ, cream);
      for (let z = MZ - ID / 2 + 3.2; z < MZ + ID / 2; z += 3.2) k.box(IW - 0.6, 0.34, 0.28, MX, 5.03, z, cream);
      /* upstairs: the salon's missing south wall, panelled like the rest */
      k.box(IW, 4.4, 0.3, MX, UY + 2.2, sz - 0.2, wood);
      /* a gilt frieze under the hall cornice: Firefly Vienna 1900 pattern, gilt until it lands */
      fireflyPlate(k, 'assets/museum/tex/neuegalerie/ff_vienna_frieze.webp', IW - 0.8, 0.42, MX, 4.52, nz + 0.17, 0, gold);
      fireflyPlate(k, 'assets/museum/tex/neuegalerie/ff_vienna_frieze.webp', ID - 0.8, 0.42, wx + 0.17, 4.52, MZ, PI / 2, gold);
      /* the cafe: a velvet banquette along the north wall in the 1912 Wagner colour, its sign in gold */
      k.box(8.2, 0.45, 0.7, CX - 2.7, 0.53, nz + 0.55, velvet); k.box(8.2, 0.7, 0.18, CX - 2.7, 1.0, nz + 0.27, velvet); k.block(CX - 6.9, CX + 1.5, nz + 0.15, nz + 0.95);
      hsign(k, 'CAFE', 2.4, 0.55, CX, 4.53, nz + 0.26, 0, { fg: '#d8b060', font: 'W2 Archivo Expanded', size: 0.7, lit: false });
      /* the enfilade (the trick): six door frames in two metres, each smaller, the floor rising and the ceiling falling,
         so a niche reads as a long run of rooms; you cannot walk in, which is what keeps it whole */
      const N = 6, step = 0.42, cols = [cream, k.flat(0x51624c, 0, 0.8), cream, k.flat(0x8a3a3a, 0, 0.8), cream, gold];
      for (let i = 0; i < N; i++) {
        const sc_ = 1 - 0.1 * i, z = sz + 0.15 + i * step, fy = 0.3 + 0.07 * i, w = DW * sc_, h = DH * sc_, d = step;
        k.box(w + 0.5 * sc_, 0.04, d, DX, fy, z + d / 2, floorW);
        for (const s2 of [-1, 1]) { k.box(0.22 * sc_, h, 0.16, DX + s2 * (w / 2 + 0.11 * sc_), fy + h / 2, z, i % 2 ? gold : marble); k.box(0.04, h, d, DX + s2 * (w / 2 + 0.25 * sc_), fy + h / 2, z + d / 2, cols[i]); }
        k.box(w + 0.44 * sc_, 0.22 * sc_, 0.16, DX, fy + h + 0.11 * sc_, z, i % 2 ? gold : marble);
        k.box(w + 0.5 * sc_, 0.04, d, DX, fy + h + 0.24 * sc_, z + d / 2, cream);
      }
      const endZ = sz + 0.15 + N * step, es = 1 - 0.1 * N;
      k.box(DW * es + 0.4, DH * es + 0.4, 0.06, DX, 0.3 + 0.07 * N + (DH * es) / 2, endZ, cream);
      k.box(DW * es * 0.55, DH * es * 0.45, 0.04, DX, 0.3 + 0.07 * N + DH * es * 0.55, endZ - 0.04, gold);
      k.box(DW * es * 0.45, DH * es * 0.36, 0.03, DX, 0.3 + 0.07 * N + DH * es * 0.55, endZ - 0.07, k.glow(0xfff0d0));
      /* its brick shell outside: sides, top and back only, so nothing stands across the doorway */
      for (const s2 of [-1, 1]) k.box(0.2, 4.4, endZ - sz + 0.2, DX + s2 * 1.5, 2.2, (sz + endZ) / 2 + 0.1, brickR);
      k.box(3.2, 0.2, endZ - sz + 0.2, DX, 4.4, (sz + endZ) / 2 + 0.1, brickR); k.box(3.2, 4.4, 0.2, DX, 2.2, endZ + 0.2, brickR);
      k.point(DX, 2.4, sz + 1.2, 0xffe6c0, 8, 4);
      k.block(DX - 1.4, DX + 1.4, sz - 0.2, endZ + 0.4);
      k.egg(v(DX, 1.6, sz - 2.4), { id: 'neuegalerie-enfilade', title: 'Rooms that are not there', text: 'Mansions like this one were planned as enfilades, rooms in a row with their doors lined up so you can see through all of them at once. This one is a forced perspective trick, the kind Borromini built at the Palazzo Spada in Rome, where a colonnade about nine metres long looks four times as deep: every door is smaller than the last, the floor rises and the ceiling falls, and the whole run is two and a half metres deep.', clue: 'Look through the doorway in the south wall of the hall, but do not try to walk in.', source: { name: 'Palazzo Spada, Wikipedia', url: 'https://en.wikipedia.org/wiki/Palazzo_Spada' } }, { r: 1.6 });
    }
    /* chandeliers in the hall, the cafe and the salon, a tall case clock, a console with a mantel clock (Poly Haven, CC0) */
    void hero(k, 'neuegalerie/ph_Chandelier_01', { height: 1.3 }).then((h) => { if (!h || !k.live) return; noShadow(h); [[MX, UY + 3.1, MZ - 5], [MX, UY + 3.1, MZ + 6]].forEach(([x, y, z], i) => { const c = i ? h.clone() : h; c.position.set(x, y, z); k.add(c); }); });
    void hero(k, 'neuegalerie/ph_lantern_chandelier_01', { height: 1.2 }).then((h) => { if (!h || !k.live) return; noShadow(h); [[-21, 4.0, -6], [-21, 4.0, 6], [CX - 4, 4.0, CZ], [CX + 2, 4.0, CZ]].forEach(([x, y, z], i) => { const c = i ? h.clone() : h; c.position.set(x, y, z); k.add(c); }); });
    many(k, 'neuegalerie/ph_vintage_grandfather_clock_01', { height: 2.3 }, [[MX + IW / 2 - 1.6, 0.3, MZ + ID / 2 - 0.55, PI]]); k.keepOut.push({ x: MX + IW / 2 - 1.6, z: MZ + ID / 2 - 0.7, r: 0.6 });
    many(k, 'neuegalerie/ph_ClassicConsole_01', { width: 1.5 }, [[MX - IW / 2 + 0.6, UY + 0.15, MZ - 12.4, PI / 2]]); k.keepOut.push({ x: MX - IW / 2 + 0.7, z: MZ - 12.4, r: 0.9 });
    void hero(k, 'neuegalerie/ph_ClassicConsole_01', { width: 1.5 }).then((h) => { if (!h || !k.live) return; const top = (h.userData.size as T.Vector3).y; many(k, 'neuegalerie/ph_mantel_clock_01', { height: 0.42 }, [[MX - IW / 2 + 0.6, UY + 0.15 + top, MZ - 12.4, PI / 2]], noShadow); });
    many(k, 'neuegalerie/ph_street_lamp_02', { height: 5.2 }, [[-12.6, 0.14, -10, 0], [-12.6, 0.14, 10, 0], [12.8, 0.14, 0, 0]], noShadow);
    // the works: the gold room's single work, the panelled salon walls in gilt, the entrance hall, the café
    const mounts: Mount[] = [];
    mounts.push({ position: v(MX, UY + 2.4, MZ - ID / 2 + 0.38), rotation: 0, target: v(MX, UY + 1.8, MZ), width: 3.2, height: 3.2, style: 'gilt', wash: true });
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = MZ - 9 + i * 6; mounts.push({ position: v(MX + s * (IW / 2 - 0.38), UY + 2.4, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(MX, UY + 1.8, z), width: 3.2, height: 2.4, style: 'gilt', wash: true }); }
    for (let i = 0; i < 3; i++) { const z = MZ + 4 + i * 4; mounts.push({ position: v(MX + IW / 2 - 0.38, 3.0, z), rotation: -PI / 2, target: v(MX + 4, 2.5, z), width: 2.6, height: 1.9, style: 'gilt', wash: true }); }
    for (let i = 0; i < 3; i++) { const x = CX - 5.5 + i * 5; /* wave 5b: was CX - 7, whose spot stood outside the bounds */ mounts.push({ position: v(x, 3.0, MZ - ID / 2 + 0.38 + 0), rotation: 0, target: v(x, 2, CZ), width: 2.8, height: 2.0, style: 'gilt', wash: false }); }
    return { mounts, spawn: v(MX + IW / 2 - 3, 3, MZ - 1), look: v(SX, 4.5, SZ), eye: 3, bounds: [MX - IW / 2 + 0.8, 14, MZ - ID / 2 + 1, 30], style: 'gilt', floorY: (x, z) => { const dx = x - SX, dz = z - SZ; const d = Math.hypot(dx, dz); if (d > 2.0 && d < 4.4 && x > MX - IW / 2 && x < MX + IW / 2) { const a = Math.atan2(dz, dx); let t = ((a - PI * 0.2) / (PI * 1.5)); while (t < -0.1) t += (2 * PI) / (PI * 1.5); if (t >= -0.05 && t <= 1.0) return Math.max(0.2, Math.min(5.4, 0.2 + t * 5.2)); } if (x > MX - IW / 2 && x < MX + IW / 2 && z > MZ - ID / 2 && z < MZ + ID / 2 && d >= 4.4 && d < 4.6) return 0; return 0; } };
  },
};

/* ---------------- 90 COOPER HEWITT ---------------- */
export const cooperhewitt: RoomDef = {
  id: 'cooperhewitt',
  name: 'The Carnegie garden',
  area: 'COOPER HEWITT',
  mood: 'Garden party',
  color: '#a8c090',
  description: 'The mansion on 91st Street from its own lawn: the conservatory, the terrace and pergola, the great hall with its carved oak stair, the works in the design galleries and out on the garden walls.',
  signatures: 'The Georgian brick and limestone mansion set back behind a lawn and iron fence, the glass and bronze conservatory, the Scottish oak entrance hall with organ pipes, the garden pergola of wisteria, the terrace where the summer parties happen.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad8, horizon: 0xeef0ec, ground: 0x5a6a5a, fog: 0.002, sun: { az: 3.0, el: 0.85, color: 0xfff6e8, size: 12 }, env: 1.0 });
    k.hemi(0xf2f6ff, 0x4a5a48, 0.95);
    k.sun(0xfff2dc, 2.4, 30, 80, 40, true, 90);
    /* 2026-11-24 (wave 5b): scanned CC0 surfaces (Poly Haven): red brick, limestone block, lawn, gravel, panelled oak,
       herringbone parquet, terrazzo */
    const brick = sc(k, 'cooperhewitt', 'red_brick', 1.4, () => X.brick(0x8a4a3a, 268), { roughness: 0.85, color: new T.Color(1.05, 0.98, 0.95) }, 0x7a4a3a),
      lime = sc(k, 'cooperhewitt', 'large_sandstone_blocks', 2.4, () => X.ashlar(0xd8d0bc, 269, 4), { roughness: 0.8, color: new T.Color(2.35, 2.28, 2.12) }, 0xd0c8b4),
      lawn = sc(k, 'cooperhewitt', 'leafy_grass', 3, () => X.grass(0x4a7a3a, 137), { roughness: 0.95, color: new T.Color(0.5, 0.82, 0.42) }, 0x4a6a3a),
      gravel = sc(k, 'cooperhewitt', 'gravel_floor_02', 1.5, () => X.cobble(0xa39a86, 138), { roughness: 0.95, color: new T.Color(0.78, 0.74, 0.66) }, 0x8a8270),
      oak = sc(k, 'cooperhewitt', 'dark_paneled_wood', 1.6, () => X.planks(0x4a2e1a, 4, 270, 0.15), { roughness: 0.5, color: new T.Color(2.3, 1.95, 1.6) }, 0x4a2e1a),
      floorW = sc(k, 'cooperhewitt', 'herringbone_parquet', 1.4, () => X.planks(0x8a6a48, 10, 271, 0.1), { roughness: 0.42 }, 0x8a6a48),
      glass = k.glass(0xdcecf6, 0.12, 0.04), bronze = k.flat(0x4a3a28, 0.8, 0.4), iron = k.flat(0x1a1c20, 0.7, 0.45), dark = k.flat(0x1a1c20, 0.5, 0.6),
      white = k.flat(0xf4f0e8, 0.05, 0.6), timber = k.pbr('chPergola', X.planks(0x8a7a5a, 4, 272, 0.3), 0.8);
    // 91st Street, the fence, the lawn, the mansion
    scanStreet(k, 'cooperhewitt', { w: 20, len: 140, z: 46, x: 0 });
    blockFront(k, { x: 44, z0: 100, count: 8, face: -1, seed: 273, h: [16, 30] });
    k.box(80, 0.4, 70, 0, -0.2, 0, lawn);
    k.rail(0, 34, 80, iron, 1.4, 'x', 1.6); k.block(-40, -2.4, 33.6, 34.4); k.block(2.4, 40, 33.6, 34.4);
    k.box(4, 0.3, 40, 0, 0.05, 14, gravel);
    const MX = -12, MZ = -10, MW = 34, MD = 26;
    k.box(MW, 18, MD, MX, 9, MZ, brick);
    k.box(MW + 0.4, 2.4, MD + 0.4, MX, 1.2, MZ, lime); k.box(MW + 0.6, 1.0, MD + 0.6, MX, 17.6, MZ, lime);
    /* wave 5b: the windows built, not stuck on: dark glass with glazing bars, limestone jambs, head, keystone and sill,
       on the 91st Street front and the garden front; quoins at the corners; the pyramid roof was not the house's, which
       has a flat roof behind a stone balustrade */
    {
      const pane = k.flat(0x1c2830, 0.7, 0.12), bar = k.flat(0xe8e2d4, 0.1, 0.6);
      const win = (x: number, y: number, zf: number, d: number) => {
        k.box(1.5, 2.5, 0.04, x, y, zf + d * 0.02, pane); k.box(0.05, 2.5, 0.03, x, y, zf + d * 0.05, bar); for (const dy of [-0.42, 0.42]) k.box(1.5, 0.05, 0.03, x, y + dy, zf + d * 0.05, bar);
        for (const s2 of [-1, 1]) k.box(0.22, 2.9, 0.2, x + s2 * 0.86, y, zf + d * 0.1, lime);
        k.box(2.1, 0.32, 0.26, x, y + 1.55, zf + d * 0.13, lime); k.box(0.34, 0.5, 0.32, x, y + 1.62, zf + d * 0.16, lime); k.box(2.2, 0.14, 0.34, x, y - 1.32, zf + d * 0.17, lime);
      };
      for (let f = 0; f < 3; f++) for (let i = 0; i < 7; i++) { const y = 4 + f * 4.8, x = MX - 15 + i * 5; if (!(f === 0 && i === 3)) win(x, y, MZ + MD / 2, 1); win(x, y, MZ - MD / 2, -1); }
      for (const cx of [MX - MW / 2, MX + MW / 2]) for (const cz of [MZ - MD / 2, MZ + MD / 2]) for (let j = 0; j < 15; j++) { const a = j % 2 ? 0.6 : 1.0, b = j % 2 ? 1.0 : 0.6; k.box(a, 0.46, b, cx + Math.sign(cx - MX) * (0.05 - a / 2), 2.65 + j * 1.0, cz + Math.sign(cz - MZ) * (0.05 - b / 2), lime); }
      const R = 18.1, bh = 0.78;
      k.box(MW + 0.6, 0.1, MD + 0.6, MX, 18.05, MZ, lime);
      const balG = new T.LatheGeometry([[0, 0], [0.09, 0], [0.11, 0.05], [0.06, 0.18], [0.12, 0.4], [0.05, 0.62], [0.09, 0.7], [0.09, bh], [0, bh]].map(([r, y]) => new T.Vector2(r, y)), 8), bm: T.Matrix4[] = [];
      const runs: [number, number, number, number][] = [[MX - MW / 2 + 0.2, MZ + MD / 2 - 0.2, MX + MW / 2 - 0.2, MZ + MD / 2 - 0.2], [MX - MW / 2 + 0.2, MZ - MD / 2 + 0.2, MX + MW / 2 - 0.2, MZ - MD / 2 + 0.2], [MX - MW / 2 + 0.2, MZ - MD / 2 + 0.2, MX - MW / 2 + 0.2, MZ + MD / 2 - 0.2], [MX + MW / 2 - 0.2, MZ - MD / 2 + 0.2, MX + MW / 2 - 0.2, MZ + MD / 2 - 0.2]];
      for (const [x0, z0, x1, z1] of runs) {
        const L = Math.hypot(x1 - x0, z1 - z0), n = Math.floor(L / 0.42);
        for (let i = 0; i <= n; i++) bm.push(new T.Matrix4().makeTranslation(x0 + ((x1 - x0) * i) / n, R + 0.1, z0 + ((z1 - z0) * i) / n));
        const along = Math.abs(x1 - x0) > 0.1;
        k.box(along ? L + 0.3 : 0.34, 0.14, along ? 0.34 : L + 0.3, (x0 + x1) / 2, R + 0.12, (z0 + z1) / 2, lime); k.box(along ? L + 0.4 : 0.44, 0.16, along ? 0.44 : L + 0.4, (x0 + x1) / 2, R + bh + 0.18, (z0 + z1) / 2, lime);
      }
      k.instances(balG, lime, bm);
    }
    k.box(6, 5, 3, MX, 2.5, MZ + MD / 2 + 1.5, lime); k.arch(2.6, 4, 3, MX, 0, MZ + MD / 2 + 1.5, lime, false, 0.85);
    /* wave 5b: the copper and glass canopy over the door, on two scrolled brackets */
    { const cz = MZ + MD / 2 + 3 + 1.7, cu = k.pbr('chCopper', X.patina(0x4f8a7c), 0.6, { roughness: 0.55, metalness: 0.4 });
      k.box(7, 0.08, 3.4, MX, 5.35, cz, glass); for (const s2 of [-1, 1]) { k.box(0.12, 0.22, 3.5, MX + s2 * 3.5, 5.35, cz, cu); k.curve([v(MX + s2 * 3.3, 3.9, MZ + MD / 2 + 3.05), v(MX + s2 * 3.3, 4.7, cz - 0.6), v(MX + s2 * 3.3, 5.3, cz + 1.6)], 0.05, cu, 16); }
      k.box(7.2, 0.26, 0.12, MX, 5.35, cz + 1.72, cu); }
    k.block(MX - MW / 2, MX - 1.5, MZ + MD / 2 - 0.4, MZ + MD / 2 + 3.2); k.block(MX + 1.5, MX + MW / 2, MZ + MD / 2 - 0.4, MZ + MD / 2 + 3.2);
    hsign(k, 'COOPER HEWITT', 4.2, 0.5, MX, 4.55, MZ + MD / 2 + 3.03, 0, { fg: '#3a3020', font: 'W2 Archivo Expanded', size: 0.66, lit: false });
    k.egg(v(MX + 2.6, 1.6, MZ + MD / 2 + 4), { id: 'cooperhewitt-modest', title: 'The plainest house in New York', year: '1902', text: 'Andrew Carnegie told his architects, Babb, Cook and Willard, that he wanted the most modest, plainest and most roomy house in New York. They gave him at least 64 rooms over three basements and four storeys, and the Carnegies moved in on 12 December 1902. The Smithsonian opened its design museum here on 7 October 1976.', clue: 'Stop at the front door.', source: { name: 'Andrew Carnegie Mansion, Wikipedia', url: 'https://en.wikipedia.org/wiki/Andrew_Carnegie_Mansion' } }, { r: 1.4 });
    mlowBanner(k, MX - 10, 10, MZ + MD / 2 + 0.6, 0, 3.0, true); blossomFlag(k, MX + 10, 10, MZ + MD / 2 + 0.6, 0, 2.6, 5, 'electric');
    // the conservatory on the garden side, the terrace, the pergola
    const CX = MX + MW / 2 + 6, CZ = MZ + 4;
    k.box(12, 0.3, 14, CX, 0.15, CZ, sc(k, 'cooperhewitt', 'terrazzo_tiles', 1.2, () => X.terrazzo(0xc8c0b0, 139), { roughness: 0.4, color: new T.Color(1.5, 1.5, 1.5) }, 0xb8b0a0));
    for (const s of [-1, 1]) { k.box(0.16, 6, 14, CX + s * 6, 3, CZ, glass); k.box(12, 6, 0.16, CX, 3, CZ + s * 7, glass); k.block(CX + s * 6 - 0.3, CX + s * 6 + 0.3, CZ - 7, CZ + 7); }
    k.block(CX - 6, CX + 6, CZ + 6.7, CZ + 7.3); k.block(CX - 6, CX - 1.5, CZ - 7.3, CZ - 6.7); k.block(CX + 1.5, CX + 6, CZ - 7.3, CZ - 6.7);
    for (let i = 0; i <= 6; i++) { k.box(0.16, 6, 0.16, CX - 6 + i * 2, 3, CZ - 7, bronze); k.box(0.16, 6, 0.16, CX - 6 + i * 2, 3, CZ + 7, bronze); k.box(12.2, 0.16, 0.16, CX, 6 + i * 0.5, CZ - 7 + i * 2.33, bronze); }
    const roof = k.mesh(new T.CylinderGeometry(6, 6, 14, 16, 1, true, 0, PI), glass, CX, 6, CZ); roof.rotation.set(0, 0, PI / 2); roof.rotateX(PI / 2); void roof;
    /* wave 5b: the palm urns are real potted plants and ferns (Poly Haven scans, CC0) */
    { const big: number[][] = [], fern: number[][] = [];
      for (let i = 0; i < 8; i++) { const x = CX - 4 + (i % 4) * 2.6, z = CZ - 4 + Math.floor(i / 4) * 8; k.keepOut.push({ x, z, r: 1.0 }); (i === 1 || i === 6 ? big : fern).push([x, 0.3, z, i * 1.3]); }
      many(k, 'cooperhewitt/ph_potted_plant_02', { height: 2.3 }, big, noShadow);
      many(k, 'cooperhewitt/ph_planter_pot_clay', { height: 0.5 }, fern, noShadow);
      many(k, 'cooperhewitt/ph_fern_02', { height: 1.1 }, fern.map(([x, y, z, r]) => [x, y + 0.45, z, r]), noShadow); }
    k.egg(v(CX, 1.6, CZ), { id: 'cooperhewitt-conservatory', title: 'Room for six hundred', text: 'The metal and glass conservatory, now named the Barbara Riley Levin Conservatory, could hold 600 guests.', clue: 'Walk into the glass conservatory among the palms.', source: { name: 'Andrew Carnegie Mansion, Wikipedia', url: 'https://en.wikipedia.org/wiki/Andrew_Carnegie_Mansion' } }, { r: 1.4 });
    k.box(30, 0.3, 12, MX + 2, 0.05, MZ - MD / 2 - 7, gravel);
    const PZ = MZ - MD / 2 - 12;
    k.egg(v(MX + 12, 1.4, MZ - MD / 2 - 7), { id: 'cooperhewitt-garden', title: 'The terrace he cancelled', text: 'The mansion sits on a 1.2 acre site with its garden on the southern half, planted at first with about 30 mature trees. The early plans wrapped a terrace round the whole house, but Carnegie had it taken out when the building was nearly finished.', clue: 'Walk out onto the gravel behind the house.', source: { name: 'Andrew Carnegie Mansion, Wikipedia', url: 'https://en.wikipedia.org/wiki/Andrew_Carnegie_Mansion' } }, { r: 1.6 });
    for (let i = 0; i <= 6; i++) { const x = MX - 12 + i * 4.6; for (const dz of [-2, 2]) { k.box(0.5, 3.2, 0.5, x, 1.6, PZ + dz, white); k.keepOut.push({ x, z: PZ + dz, r: 0.5 }); } k.box(0.24, 0.24, 5.2, x, 3.4, PZ, timber); }
    k.box(28.6, 0.24, 0.3, MX + 2, 3.4, PZ - 2, timber); k.box(28.6, 0.24, 0.3, MX + 2, 3.4, PZ + 2, timber);
    for (let x = MX - 11.5; x < MX + 15; x += 0.9) k.box(0.14, 0.2, 5.6, x, 3.6, PZ, timber);
    const rnd = X.mulberry(90);
    for (let i = 0; i < 30; i++) { const x = MX - 12 + rnd() * 28, z = PZ - 2 + rnd() * 4; k.mesh(new T.SphereGeometry(0.4 + rnd() * 0.3, 7, 5), k.flat(0x4a7a3a, 0, 0.9), x, 3.9 + rnd() * 0.4, z); k.mesh(new T.SphereGeometry(0.16, 6, 4), k.flat(0x8a6ad8, 0, 0.8), x, 3.1 + rnd() * 0.5, z); }
    /* wave 5b: six garden trees, not twenty four: each kit tree is 30 to 100 thousand triangles and they took the spawn view past 1.7 million */
    for (let i = 0; i < 6; i++) { const x = -30 + rnd() * 60, z = -34 + rnd() * 20; if (Math.abs(x - MX) < 20 && z > MZ - MD / 2 - 14) continue; k.tree(x, 0, z, { kind: rnd() > 0.5 ? 'round' : 'column', h: 5 + rnd() * 4, r: 2.4 + rnd() * 2, leaf: 0x4a7a3c, seed: i }); }
    for (let i = 0; i < 8; i++) { const x = -20 + i * 6, z = 8 + (i % 2) * 4; k.cyl(0.04, 0.72, x, 0.36, z, white, 0.04, 8); k.cyl(0.6, 0.03, x, 0.74, z, white, 0.6, 16); k.keepOut.push({ x, z, r: 0.8 }); }
    blossomGarden(k, 14, 0, -20, 5, 1.8);
    // the great hall: oak panelling, the carved stair, the organ pipes, the works on the oak
    const HW = MW - 1.2, HD = MD - 1.2;
    k.box(HW, 0.3, HD, MX, 0.15, MZ, floorW);
    for (const s of [-1, 1]) { k.box(0.3, 7, HD, MX + s * (HW / 2 - 0.2), 3.5, MZ, oak); k.block(MX + s * (HW / 2 - 0.6), MX + s * (HW / 2 + 0.6), MZ - HD / 2, MZ + HD / 2); }
    k.box(HW, 7, 0.3, MX, 3.5, MZ - HD / 2 + 0.2, oak); k.block(MX - HW / 2, MX + HW / 2, MZ - HD / 2 - 0.6, MZ - HD / 2 + 0.6);
    const ceilM = k.pbr('chCeiling', X.plaster(0xd8d0c0, 140), 0.4);
    k.box(HW, 0.4, HD, MX, 7.2, MZ, ceilM);
    /* Carnegie's 3,000 pipe organ played here until 1946 and left the house in 1974, so the wall where it stood is bare oak now */
    k.egg(v(MX - 6, 4.4, MZ - HD / 2 + 0.9), { id: 'cooperhewitt-organ', title: 'The organ that left', year: '1974', text: 'The house had a 3,000 pipe Aeolian-Skinner organ, played until 1946, the year Louise Carnegie died here. In 1974 it was moved out to Roslyn Harbor on Long Island.', clue: 'Look at the bare oak at the far end of the great hall.', source: { name: 'Andrew Carnegie Mansion, Wikipedia', url: 'https://en.wikipedia.org/wiki/Andrew_Carnegie_Mansion' } }, { r: 1.4 });
    k.egg(v(MX + 4, 1.8, MZ + 2), { id: 'cooperhewitt-steel', title: 'A house like an ocean liner', text: 'The mansion was among the first houses in New York built on a steel frame, and it had a private Otis elevator, five electric elevators from the start. Its heating plant was big enough for an ocean liner, and its air cooling system was among the first in any private house in the country.', clue: 'Stand in the middle of the great hall.', source: { name: 'Andrew Carnegie Mansion, Wikipedia', url: 'https://en.wikipedia.org/wiki/Andrew_Carnegie_Mansion' } }, { r: 1.6 });
    k.egg(v(MX - HW / 2 + 1.8, 1.4, MZ + HD / 2 - 2.6), { id: 'cooperhewitt-stair', title: 'Scottish oak', text: 'The grand staircase of the house was made of imported Scottish oak. The mansion has been a National Historic Landmark since 13 November 1966 and a New York City landmark since 17 February 1974.', clue: 'Put a hand on the carved stair at the side of the hall.', source: { name: 'Andrew Carnegie Mansion, Wikipedia', url: 'https://en.wikipedia.org/wiki/Andrew_Carnegie_Mansion' } }, { r: 1.3 });
    for (let i = 0; i < 16; i++) k.box(3, 0.4, 1.0, MX - HW / 2 + 1.8, 0.2 + i * 0.4, MZ + HD / 2 - 2 - i * 1.0, oak);
    for (let i = 0; i < 16; i++) k.box(0.06, 0.9, 0.06, MX - HW / 2 + 3.4, 0.9 + i * 0.4, MZ + HD / 2 - 2 - i * 1.0, oak);
    k.box(HW, 0.4, 5, MX, 6.6, MZ - HD / 2 + 2.5, oak);
    k.block(MX - HW / 2 + 0.3, MX - HW / 2 + 3.6, MZ + HD / 2 - 18, MZ + HD / 2 - 1.6);
    eyeMedallion(k, MX, 0.16, MZ + 4, 2.0);
    donorWall(k, MX, 4.6, MZ - HD / 2 + 0.38, 0, 10, false);
    for (const x of [-8, 8]) k.prop('museum_bench', MX + x, 0.15, MZ, { height: 0.58, keepOut: 1.4 });
    k.prop('vitrine', MX + 6, 0.15, MZ - 5, { height: 1.7, keepOut: 1.2 }); /* wave 5b: moved off the spot a west wall work is seen from */ k.prop('globe_stand', MX + 6, 0.15, MZ + 6, { height: 2.0, keepOut: 1.0 });
    for (let i = 0; i < 3; i++) k.point(MX - 8 + i * 8, 6.2, MZ, 0xffe6c0, 16, 12);
    k.crowd([v(0, 0, 30), v(-2, 0, 14), v(MX + 8, 0, MZ + MD / 2 + 6), v(MX - 6, 0, PZ + 5), v(10, 0, -14), v(16, 0, 6)], 26, { seed: 121, speed: 0.4, spread: 2.6, animate: !ctx.reduced, closed: true, colors: [0xe6e2da, 0xf4f0e8, 0xd8d0c0, 0x8a3a3a, 0x33477f, 0xc9a25a] });
    k.censusWall({ x: MX + HW / 2 - 0.36, y: 3.4, z: MZ, rotY: -PI / 2, cols: 30, rows: 4, tile: 0.5, gap: 0.05, start: ctx.wallStart(2900, 120), pieces: ctx.all, backing: dark });
    /* ---- 2026-11-24 (wave 5b): the hall closed and furnished, the garden furnished, signs, one trick ---- */
    {
      /* the hall's 91st Street wall: from inside, the brick box had no face, so the hall opened onto the street */
      const fz = MZ + HD / 2 - 0.2;
      k.box(MX - 1.5 - (MX - HW / 2), 7, 0.3, (MX - 1.5 + MX - HW / 2) / 2, 3.5, fz, oak); k.box(MX + HW / 2 - (MX + 1.5), 7, 0.3, (MX + 1.5 + MX + HW / 2) / 2, 3.5, fz, oak); k.box(3, 3, 0.3, MX, 5.5, fz, oak);
      k.block(MX - HW / 2, MX - 1.5, fz - 0.3, fz + 0.3); k.block(MX + 1.5, MX + HW / 2, fz - 0.3, fz + 0.3);
      /* an oak cornice round the hall (the moulding runs along z and projects +x unrotated) and a coffered ceiling */
      const prof: [number, number][] = [[0, 0], [0.3, 0], [0.36, 0.12], [0.2, 0.22], [0.26, 0.36], [0, 0.42]];
      k.moulding(prof, HD, MX - HW / 2 + 0.35, 6.58, MZ, oak, 0); k.moulding(prof, HD, MX + HW / 2 - 0.35, 6.58, MZ, oak, PI);
      k.moulding(prof, HW, MX, 6.58, MZ - HD / 2 + 0.35, oak, -PI / 2); k.moulding(prof, HW, MX, 6.58, fz - 0.15, oak, PI / 2);
      for (let x = MX - HW / 2 + 3.3; x < MX + HW / 2; x += 3.3) k.box(0.3, 0.34, HD - 0.6, x, 6.83, MZ, ceilM);
      for (let z = MZ - HD / 2 + 3.1; z < MZ + HD / 2; z += 3.1) k.box(HW - 0.6, 0.34, 0.3, MX, 6.83, z, ceilM);
      const cp = fireflyPlate(k, 'assets/museum/tex/cooperhewitt/ff_hall_ceiling.webp', HW - 0.6, HD - 0.6, MX, 6.99, MZ, 0, ceilM); cp.rotation.x = PI / 2;
      /* a marble chimneypiece on the far wall with a bust on the shelf, two armchairs at it, a tall case clock by the door */
      k.box(3.4, 1.6, 0.5, MX, 1.1, MZ - HD / 2 + 0.55, lime); k.box(1.6, 1.0, 0.1, MX, 0.8, MZ - HD / 2 + 0.82, k.flat(0x0e0c0a, 0, 0.9)); k.box(3.8, 0.12, 0.6, MX, 1.96, MZ - HD / 2 + 0.6, lime);
      k.block(MX - 1.9, MX + 1.9, MZ - HD / 2 + 0.3, MZ - HD / 2 + 0.9);
      many(k, 'cooperhewitt/ph_marble_bust_01', { height: 0.55 }, [[MX, 2.02, MZ - HD / 2 + 0.6, 0]], noShadow);
      many(k, 'cooperhewitt/ph_ArmChair_01', { height: 1.05 }, [[MX - 2.2, 0.3, MZ - HD / 2 + 2.9, 0.5], [MX + 2.2, 0.3, MZ - HD / 2 + 2.9, -0.5]]);
      for (const s2 of [-1, 1]) k.keepOut.push({ x: MX + s2 * 2.2, z: MZ - HD / 2 + 2.9, r: 0.7 });
      many(k, 'cooperhewitt/ph_vintage_grandfather_clock_01', { height: 2.4 }, [[MX + 4, 0.3, fz - 0.45, PI]]); k.keepOut.push({ x: MX + 4, z: fz - 0.5, r: 0.6 });
      void hero(k, 'cooperhewitt/ph_lantern_chandelier_01', { height: 1.3 }).then((h) => { if (!h || !k.live) return; noShadow(h); [[MX - 8, 5.5, MZ], [MX, 5.5, MZ], [MX + 8, 5.5, MZ]].forEach(([x, y, z], i) => { const c = i ? h.clone() : h; c.position.set(x, y, z); k.add(c); }); });
      k.curve([v(MX - HW / 2 + 3.3, 1.3, MZ + HD / 2 - 2), v(MX - HW / 2 + 3.3, 7.7, MZ + HD / 2 - 18)], 0.045, oak, 8);
      k.prop('newel_urn', MX - HW / 2 + 3.3, 0.3, MZ + HD / 2 - 1.6, { height: 1.4 });
      /* 91st Street: the fence's gate piers with urns and the address, street lamps (Poly Haven, CC0) */
      for (const s2 of [-1, 1]) { k.box(0.8, 2.2, 0.8, s2 * 2.8, 1.1, 34, lime); k.prop('newel_urn', s2 * 2.8, 2.2, 34, { height: 0.9 }); }
      k.block(-3.2, -2.4, 33.6, 34.4); k.block(2.4, 3.2, 33.6, 34.4);
      hsign(k, '2 EAST 91 STREET', 0.74, 0.2, 2.8, 1.5, 34.41, 0, { fg: '#3a3020', bg: '#c9b98f', font: 'W2 JetBrains Mono', size: 0.7, lit: false });
      hsign(k, 'SMITHSONIAN DESIGN MUSEUM', 0.74, 0.2, -2.8, 1.5, 34.41, 0, { fg: '#3a3020', bg: '#c9b98f', font: 'W2 Archivo Expanded', size: 0.5, lit: false });
      many(k, 'cooperhewitt/ph_street_lamp_01', { height: 4.6 }, [[-14, 0.14, 37.4, 0], [14, 0.14, 37.4, 0], [-30, 0.14, 37.4, 0], [30, 0.14, 37.4, 0]]);
      /* benches on the lawn and in the garden, cafe tables on the gravel (Poly Haven, CC0) */
      many(k, 'cooperhewitt/ph_painted_wooden_bench', { width: 1.8 }, [[-28, 0, 24, PI / 2], [-28, 0, 12, PI / 2], [22, 0, 24, -PI / 2], [22, 0, 12, -PI / 2], [-31, 0, -30, PI / 2], [12, 0, -34, PI], [18, 0, -26, -PI / 2]], (o) => tint(o, 0x2f4a36, 0.6, 0.1));
      for (const [x, z] of [[-28, 24], [-28, 12], [22, 24], [22, 12], [-31, -30], [12, -34], [18, -26]]) k.keepOut.push({ x, z, r: 1.0 });
      many(k, 'cooperhewitt/ph_outdoor_table_chair_set_01', { width: 1.9 }, [[-18, 0.2, -26.2, 0.3], [-4, 0.2, -26.2, 2.1]], noShadow);
      for (const x of [-18, -4]) k.keepOut.push({ x, z: -26.2, r: 1.3 });
      /* the trick (ON LOCATION rule 9): a cafe wall on the lawn. Every mortar line is dead straight and level, and every
         one of them looks tilted, because the dark and light tiles are shifted a quarter tile from row to row */
      const WX = -16, WZ = 18, WL = 12, WH = 2.4;
      k.box(WL + 0.4, 0.4, 0.5, WX, 0.2, WZ, brick); k.box(WL + 0.4, WH, 0.4, WX, 0.4 + WH / 2, WZ, lime); k.box(WL + 0.6, 0.12, 0.6, WX, 0.46 + WH, WZ, lime);
      k.block(WX - WL / 2 - 0.3, WX + WL / 2 + 0.3, WZ - 0.35, WZ + 0.35);
      if (HAS_DOM) {
        const cw = paintTex(2048, 410, (g, W, H) => { const m = 7, rows = 4, th = (H - m * (rows + 1)) / rows, tw = W / 20, off = [0, 0.25, 0.5, 0.25]; g.fillStyle = '#8c8c88'; g.fillRect(0, 0, W, H); for (let r = 0; r < rows; r++) { const y = m + r * (th + m); for (let c = -1; c <= 20; c++) { const x = (c + off[r]) * tw; g.fillStyle = c % 2 === 0 ? '#151515' : '#f2f0ea'; g.fillRect(x, y, tw, th); } } });
        for (const s2 of [-1, 1]) { const o = k.mesh(new T.PlaneGeometry(WL, WH), new T.MeshStandardMaterial({ map: cw, roughness: 0.7 }), WX, 0.4 + WH / 2, WZ + s2 * 0.21, true); o.rotation.y = s2 > 0 ? 0 : PI; }
      }
      k.egg(v(WX, 1.6, WZ + 2.6), { id: 'cooperhewitt-cafewall', title: 'Every line is straight', year: '1979', text: 'This is the cafe wall illusion. The grey mortar lines between the rows are perfectly straight and parallel, yet they look like wedges, because the black and white tiles shift by part of a tile from one row to the next. Richard Gregory and Priscilla Heard described it in 1979, after a tiled wall of a cafe in Bristol.', clue: 'Stand on the lawn in front of the black and white wall and follow one grey line with your eye.', source: { name: 'Cafe wall illusion, Wikipedia', url: 'https://en.wikipedia.org/wiki/Caf%C3%A9_wall_illusion' } }, { r: 1.8 });
    }
    // the works: the oak walls of the hall, the garden wall along the pergola, the conservatory panels
    const mounts: Mount[] = [];
    /* wave 5b: the third west work hung behind the oak stair; it moves to the new 91st Street wall of the hall */
    mounts.push({ position: v(MX + 8, 3.2, MZ + HD / 2 - 0.38), rotation: PI, target: v(MX + 8, 2.6, MZ - 4), width: 3.6, height: 2.4, style: 'gilt', wash: true });
    for (const i of [0, 1, 3]) { const z = MZ - 8 + i * 5.5; mounts.push({ position: v(MX - HW / 2 + 0.38, 3.2, z), rotation: PI / 2, target: v(MX, 2.6, z), width: 3.6, height: 2.4, style: 'gilt', wash: true }); }
    for (const x of [-10, 10]) mounts.push({ position: v(MX + x, 3.4, MZ - HD / 2 + 0.38), rotation: 0, target: v(MX + x, 2.6, MZ), width: 4.2, height: 2.6, style: 'gilt', wash: true });
    for (let i = 0; i < 6; i++) { const x = MX - 10 + i * 4.6; k.box(3.2, 2.2, 0.14, x, 1.7, PZ - 2.5, white); mounts.push({ position: v(x, 1.8, PZ - 2.42), rotation: 0, target: v(x, 2, PZ + 6), width: 2.8, height: 1.7, style: 'white', wash: false }); }
    for (let i = 0; i < 3; i++) { const z = CZ - 4 + i * 4; mounts.push({ position: v(CX + 5.9, 2.4, z), rotation: -PI / 2, target: v(CX, 2, z), width: 2.4, height: 1.6, style: 'white', wash: false }); }
    for (let i = 0; i < 3; i++) { const x = -16 + i * 16; k.box(0.14, 2.6, 3.6, 0, 0, 0, iron).position.set(x, 1.8, 33.6); mounts.push({ position: v(x, 1.9, 33.5), rotation: PI, target: v(x, 2, 24), width: 3.2, height: 2.0, style: 'black', wash: false }); }
    return { mounts, spawn: v(0, 3, 42), look: v(MX, 10, MZ), eye: 3, bounds: [-38, 38, -38, 50], style: 'gilt', floorY: (x, z) => { if (x > MX - HW / 2 + 0.3 && x < MX - HW / 2 + 3.6 && z < MZ + HD / 2 - 1.6 && z > MZ + HD / 2 - 18) return Math.min(6.4, ((MZ + HD / 2 - 1.6 - z) / 16) * 6.4); if (z > MZ - HD / 2 && z < MZ - HD / 2 + 5 && x > MX - HW / 2 && x < MX + HW / 2) return 6.8; return 0; } };
  },
};

/* ---------------- 91 THE BREUER ---------------- */
export const breuer: RoomDef = {
  id: 'breuer',
  name: 'The inverted ziggurat',
  area: 'THE BREUER',
  mood: 'Granite grey noon',
  color: '#8a8a88',
  description: 'Madison at 75th: the granite building stepping out over the moat, the bridge in, the concrete coffered ceilings, the trapezoid window, the works in the great fourth floor gallery.',
  signatures: 'The three cantilevered granite storeys each overhanging the one below, the sunken sculpture court and the concrete bridge over it, the single angled window on the facade, the bush hammered concrete inside, the bluestone floors, the grid of circular ceiling lights.',
  build(k, ctx) {
    k.sky({ top: 0x8fa0b8, horizon: 0xe6e6e2, ground: 0x5a5a58, fog: 0.0022, sun: { az: 3.2, el: 0.8, color: 0xf6f4f0, size: 12 }, haze: 0.4, env: 0.85 });
    k.hemi(0xeef0f4, 0x4a4a48, 0.9);
    k.sun(0xf6f4f0, 1.8, 20, 80, 30, true, 80);
    /* 2026-11-24 (wave 5b): scanned CC0 surfaces (Poly Haven): the coursed granite slabs, bush hammered concrete, a grey
       stone slab tinted to bluestone */
    const granite = sc(k, 'breuer', 'granite_tile', 2.2, () => X.ashlar(0x6a6a68, 275, 2), { roughness: 0.55, color: new T.Color(1.05, 1.07, 1.12) }, 0x5e6064),
      conc = sc(k, 'breuer', 'brushed_concrete', 2.4, () => X.concrete(0x8a8a86, 141), { roughness: 0.9, color: new T.Color(1.35, 1.4, 1.5) }, 0x8a8a86),
      blue = sc(k, 'breuer', 'granite_tile', 1.4, () => X.pavers(0x5a6068, 142), { roughness: 0.5, color: new T.Color(0.9, 1.0, 1.2) }, 0x5a6068),
      dark = k.flat(0x1a1c20, 0.5, 0.6), glass = k.glass(0xdcecf6, 0.14, 0.04), glow = k.glow(0xfff4e8), white = k.flat(0xf4f4f2, 0, 0.9);
    // Madison Avenue, the moat, the bridge, the cantilevers
    scanStreet(k, 'breuer', { w: 22, len: 140, z: 40, x: 0 });
    blockFront(k, { x: -44, z0: 100, count: 10, face: 1, seed: 276, h: [16, 30] });
    const BX = 0, BZ = -6, BW = 34;
    k.box(BW + 12, 0.4, 24, BX, -4.2, BZ + 16, blue);
    for (const s of [-1, 1]) k.box(0.6, 4, 24, BX + s * (BW / 2 + 6), -2, BZ + 16, conc);
    k.egg(v(BX, 1.6, BZ + 16), { id: 'breuer-moat', title: 'A moat for sculpture', text: 'The sunken areaway along Madison Avenue, sometimes called the moat, was meant for sculpture, and a canopied concrete bridge carries visitors over it into the lobby.', clue: 'Stop halfway across the bridge and look down.', source: { name: 'Breuer Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/Breuer_Building' } }, { r: 1.4 });
    k.box(6, 0.5, 14, BX, 0, BZ + 16, conc); k.rail(BX - 2.8, BZ + 16, 14, dark, 1.0, 'z', 2); k.rail(BX + 2.8, BZ + 16, 14, dark, 1.0, 'z', 2);
    k.block(-BW / 2 - 6, -3.2, BZ + 9, BZ + 24); k.block(3.2, BW / 2 + 6, BZ + 9, BZ + 24);
    k.prop('bronze_figure', BX - 10, -4, BZ + 16, { height: 3.4 }); k.prop('noguchi_stone_1', BX + 10, -4, BZ + 18, { height: 2.6 }); k.prop('mobile', BX + 8, 2, BZ + 12, { height: 4 });
    const tiers: [number, number, number][] = [[BW, 8, 0], [BW + 6, 6, 8], [BW + 12, 6, 14], [BW + 18, 6, 20]];
    /* each storey steps out over the moat toward Madison, the inverted ziggurat (the front faces used
       to stay flush at one plane, so nothing overhung the street) */
    const front = (i: number) => BZ + 9 + i * 2.5;
    tiers.forEach(([w, h, y], i) => { const d = 30 + i * 4, cz = front(i) - d / 2; k.box(w, h, d, BX, y + h / 2, cz, granite); if (i > 0) k.box(w + 0.4, 0.5, d + 0.4, BX, y + 0.25, cz, dark); });
    /* the one big trapezoid window on the Madison front, turned toward the north instead of tipped at the sky */
    const tw = k.box(6, 3, 0.4, BX + 8, 24, front(3) + 0.2, glass); tw.rotation.y = -0.4; k.box(6.4, 3.4, 0.3, BX + 8, 24, front(3) + 0.1, conc).rotation.y = -0.4;
    k.egg(tw, { id: 'breuer-window', title: 'Turned from the sun', text: 'The trapezoid windows are angled 20 to 25 degrees away from the sun. The Madison Avenue front has just one, oversized and turned north, and the 75th Street side has six, all tilted west.', clue: 'Find the one angled window high on the Madison Avenue front.', source: { name: 'Breuer Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/Breuer_Building' } }, { r: 2.4 });
    k.egg(v(BX - 9, 1.6, BZ + 25), { id: 'breuer-granite', title: 'Fifteen hundred slabs', year: '1966', text: 'The concrete building is faced with 1,500 slabs of variegated grey granite, mostly dark with white veins, each weighing 500 to 600 pounds. Above the ground floor each gallery level steps out farther than the one below, which is why people call it an inverted ziggurat.', clue: 'Stand at the edge of the moat and look up at the overhangs.', source: { name: 'Breuer Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/Breuer_Building' } }, { r: 1.6 });
    k.box(8, 5, 0.3, BX, 2.5, BZ + 9.2, glass); k.block(-BW / 2, -3.2, BZ + 8.8, BZ + 9.6); k.block(3.2, BW / 2, BZ + 8.8, BZ + 9.6);
    hsign(k, 'THE BREUER', 4.6, 0.56, BX, 6.6, BZ + 9.06, 0, { fg: '#f0ece4', font: 'W2 Archivo Expanded', size: 0.66, lit: false });
    hsign(k, '945 MADISON AVENUE', 4.6, 0.26, BX, 6.1, BZ + 9.06, 0, { fg: '#f0ece4', font: 'W2 JetBrains Mono', size: 0.7, lit: false });
    mlowBanner(k, BX - 12, 4.2, BZ + 9.4, 0, 2.8, true); blossomFlag(k, BX + 12, 4.2, BZ + 9.4, 0, 2.4, 1, 'ink');
    // inside: the lobby, the great gallery upstairs with its coffered ceiling and the grid of round lights, the bluestone floor
    const GW = BW - 2, GD = 28, GY = 14;
    k.box(GW, 0.3, GD, BX, 0.15, BZ - 6, blue);
    for (const s of [-1, 1]) k.block(BX + s * (GW / 2), BX + s * (GW / 2 + 1), BZ - 20, BZ + 9);
    k.block(BX - GW / 2, BX + GW / 2, BZ - 21, BZ - 20);
    k.box(GW, 0.4, GD, BX, 6.4, BZ - 6, conc);
    for (let x = -12; x <= 12; x += 4) for (let z = -18; z <= 4; z += 4) { k.mesh(new T.CircleGeometry(0.3, 16), glow, BX + x, 6.18, BZ + z).rotation.x = PI / 2; k.point(BX + x, 5.4, BZ + z, 0xfff4e8, 6, 6); }
    k.box(GW + 6, 0.4, GD + 6, BX, GY, BZ - 8, blue);
    k.box(GW + 6, 0.5, GD + 6, BX, GY + 6.4, BZ - 8, conc);
    /* wave 5b: the gallery ceiling is Breuer's open concrete grid, ribs both ways, not dark tiles */
    for (let x = -16.5; x <= 16.5; x += 3) k.box(0.22, 0.7, GD + 5.6, BX + x, GY + 5.9, BZ - 8, conc);
    for (let z = -22.5; z <= 5.5; z += 3) k.box(GW + 5.6, 0.7, 0.22, BX, GY + 5.9, BZ + z, conc);
    for (let x = -15; x <= 15; x += 3) for (let z = -21; z <= 4; z += 3) { k.mesh(new T.CircleGeometry(0.28, 16), glow, BX + x, GY + 5.9, BZ + z).rotation.x = PI / 2; if ((x + z) % 6 === 0) k.point(BX + x, GY + 5, BZ + z, 0xfff4e8, 8, 7); }
    for (const s of [-1, 1]) k.box(0.4, 6.4, GD + 6, BX + s * (GW / 2 + 3), GY + 3.2, BZ - 8, conc);
    k.box(GW + 6, 6.4, 0.4, BX, GY + 3.2, BZ - 8 - GD / 2 - 3, conc); k.box(GW + 6, 6.4, 0.4, BX, GY + 3.2, BZ - 8 + GD / 2 + 3, conc);
    k.block(BX - GW / 2 - 3, BX + GW / 2 + 3, BZ - 8 + GD / 2 + 2.6, BZ - 8 + GD / 2 + 3.4); k.block(BX - GW / 2 - 3, BX + GW / 2 + 3, BZ - 8 - GD / 2 - 3.4, BZ - 8 - GD / 2 - 2.6);
    for (let i = 0; i < 28; i++) k.box(3, 0.5, 1.0, BX - GW / 2 + 1.8, 0.25 + i * 0.5, BZ + 6 - i * 0.9, conc);
    k.block(BX - GW / 2 + 0.3, BX - GW / 2 + 3.3, BZ - 20, BZ + 6.6);
    k.egg(v(BX - GW / 2 + 1.8, 1.6, BZ + 4.5), { id: 'breuer-stair', title: 'The spiral the city refused', text: 'The main stair runs at the south end of the building from the basement to the fifth floor, with bush hammered concrete walls, terrazzo treads and bronze and wood rails. Breuer had proposed a spiral staircase in the middle of the building, and the city rejected it.', clue: 'Start up the concrete stair.', source: { name: 'Breuer Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/Breuer_Building' } }, { r: 1.3 });
    k.egg(v(BX + 6, 1.6, BZ - 4), { id: 'breuer-rebel', title: 'Against skyscrapers and brownstones', year: '1966', text: 'Marcel Breuer and Hamilton P. Smith designed the building as the Whitney Museum\'s third home, and it officially opened in September 1966. Breuer told Newsweek that year: maybe I built it to rebel against skyscrapers and brownstones. The bulbs in the lobby\'s round ceiling lights were bare.', clue: 'Stand in the lobby under the grid of round lights.', source: { name: 'Breuer Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/Breuer_Building' } }, { r: 1.6 });
    k.egg(v(BX + 10, GY + 1.8, BZ - 18), { id: 'breuer-tenants', title: 'Three museums and an auction house', year: '2025', text: 'After the Whitney left, the Met ran the building as the Met Breuer from 2016 to 2020, and the Frick showed its collection here as Frick Madison from March 2021 to March 2024. Sotheby\'s agreed to buy it in 2023 for about $100 million and opened its headquarters here on 8 November 2025, months after the city made the exterior, lobby and main stair a landmark.', clue: 'Walk to the far corner of the big fourth floor gallery.', source: { name: 'Breuer Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/Breuer_Building' } }, { r: 1.6 });
    for (const [x, z] of [[BX - 6, BZ - 14], [BX + 6, BZ - 2]]) { k.box(0.4, 5, 8, x, GY + 2.5, z, white); k.block(x - 0.4, x + 0.4, z - 4, z + 4); }
    k.prop('vitrine', BX - 6, GY + 0.2, BZ - 6, { height: 1.7, keepOut: 1.2 }); /* wave 5b: moved off the spot the far wall's middle work is seen from */ k.prop('museum_bench', BX + 10, GY + 0.2, BZ - 12, { height: 0.58, keepOut: 1.4 });
    donorWall(k, BX, 3.6, BZ - 20 + 0.42, 0, 9, false);
    k.crowd([v(0, 0, 36), v(0, 0, BZ + 12), v(-8, 0.15, BZ - 4), v(8, 0.15, BZ - 14)], 20, { seed: 122, speed: 0.4, spread: 2.2, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a] });
    k.crowd([v(BX - 10, GY + 0.2, BZ - 18), v(BX + 12, GY + 0.2, BZ + 2)], 8, { seed: 123, speed: 0.3, spread: 2, animate: !ctx.reduced });
    k.censusWall({ x: BX + GW / 2 - 0.42, y: 3.2, z: BZ - 6, rotY: -PI / 2, cols: 40, rows: 5, tile: 0.5, gap: 0.05, start: ctx.wallStart(6800, 200), pieces: ctx.all, backing: dark });
    /* ---- 2026-11-24 (wave 5b): the trapezoid windows built out of the stone, dish lights, busts, a horse in the moat,
       the street dressed, one trick ---- */
    {
      /* the windows: square frustums of granite flaring out of the wall, glass at the back (one on Madison, three on 75th) */
      const frus = (x: number, y: number, z: number, ry: number, s: number) => { const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry; const f = new T.Mesh(new T.CylinderGeometry(1.5 * s, 2.3 * s, 1.4 * s, 4, 1, true), granite); f.rotation.set(PI / 2, PI / 4, 0); f.position.z = 0.7 * s; g.add(f); const gl = new T.Mesh(new T.PlaneGeometry(2.1 * s, 2.1 * s), k.flat(0x1e262c, 0.7, 0.1)); gl.position.z = 0.05; g.add(gl); k.add(g); };
      frus(BX + 8, 24, front(3) + 0.05, -0.4, 1.3);
      for (const [y, z] of [[17, BZ - 2], [17, BZ - 12], [23, BZ - 7]]) { const t = y > 20 ? 3 : 2, hw = (BW + t * 6) / 2; frus(BX + hw + 0.02, y, z, PI / 2 - 0.35, 0.8); }
      /* the lobby's grid of round lights as spun aluminium dishes */
      const alu = k.flat(0xc8ccd0, 0.85, 0.3);
      for (let x = -12; x <= 12; x += 4) for (let z = -18; z <= 4; z += 4) k.mesh(new T.CylinderGeometry(0.5, 0.32, 0.14, 20, 1, true), alu, BX + x, 6.12, BZ + z);
      /* a bronze horse on a granite block in the moat, busts on plinths upstairs (the Frick showed its busts here), Poly Haven CC0 */
      k.box(1.6, 1.0, 2.6, BX - 15, -3.5, BZ + 18, granite);
      many(k, 'breuer/ph_horse_statue_01', { height: 2.6 }, [[BX - 15, -3.0, BZ + 18, 0.6]], (o) => tint(o, 0x5a4630, 0.45, 0.8));
      const busts = [[BX - 12, BZ - 22], [BX + 12, BZ - 22], [BX - 12, BZ + 6], [BX + 12, BZ + 6]];
      for (const [x, z] of busts) { k.box(0.55, 1.15, 0.55, x, GY + 0.2 + 0.575, z, white); k.keepOut.push({ x, z, r: 0.8 }); }
      many(k, 'breuer/ph_marble_bust_01', { height: 0.62 }, busts.map(([x, z], i) => [x, GY + 1.35, z, (i % 2 ? -1 : 1) * 0.5 + (z > BZ ? PI : 0)]), noShadow);
      many(k, 'breuer/ph_street_lamp_02', { height: 6.2 }, [[-14, 0.14, BZ + 27, 0], [14, 0.14, BZ + 27, 0]], noShadow);
      many(k, 'breuer/ph_fire_hydrant', { height: 0.8 }, [[11.8, 0.14, BZ + 29, 0.3]], noShadow);
      many(k, 'breuer/ph_metal_trash_can', { height: 1.0 }, [[-11.8, 0.14, BZ + 30, 0]], noShadow);
      /* the trick (ON LOCATION rule 9): an Ames window turning in the lobby. It is a flat trapezoid painted as a window seen
         at an angle; it spins all the way round, but the eye insists it only swings back and forth */
      if (HAS_DOM) {
        const at = paintTex(512, 512, (g, W, H) => {
          const L = (u: number) => [u * W, H * (0.5 - 0.5 * (1 - 0.45 * u)), H * (0.5 + 0.5 * (1 - 0.45 * u))];
          const cols = [0, 0.3, 0.55, 0.78, 1].map((c) => Math.pow(c, 1.18)), rows = [0, 0.36, 0.68, 1];
          const P = (u: number, vv: number) => { const [x, t, b] = L(u); return [x, t + (b - t) * vv]; };
          g.fillStyle = '#e9e6de'; g.beginPath(); for (const [u, vv] of [[0, 0], [1, 0], [1, 1], [0, 1]]) { const [x, y] = P(u, vv); g.lineTo(x, y); } g.closePath(); g.fill();
          g.fillStyle = '#9a968e'; g.beginPath(); for (const [u, vv] of [[0, 0], [0.06, 0.05], [0.06, 0.95], [0, 1]]) { const [x, y] = P(u, vv); g.lineTo(x, y); } g.closePath(); g.fill();
          g.globalCompositeOperation = 'destination-out';
          for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const du = (cols[i + 1] - cols[i]) * 0.16, dv = 0.07; g.beginPath(); for (const [u, vv] of [[cols[i] + du, rows[j] + dv], [cols[i + 1] - du, rows[j] + dv], [cols[i + 1] - du, rows[j + 1] - dv], [cols[i] + du, rows[j + 1] - dv]]) { const [x, y] = P(u, vv); g.lineTo(x, y); } g.closePath(); g.fill(); }
          g.globalCompositeOperation = 'source-over';
        }, [], true);
        const win = k.mesh(new T.PlaneGeometry(2.4, 2.0), new T.MeshStandardMaterial({ map: at, transparent: true, alphaTest: 0.4, side: T.DoubleSide, roughness: 0.6 }), BX + 8, 3.4, BZ - 12, true);
        k.box(0.03, 1.5, 0.03, BX + 8, 5.4, BZ - 12, alu);
        if (!ctx.reduced) k.ticks.push((t) => { win.rotation.y = t * 0.55; });
      }
      k.egg(v(BX + 8, 1.6, BZ - 10), { id: 'breuer-ames', title: 'The window that will not turn', year: '1951', text: 'This is an Ames window, after the American scientist Adelbert Ames Jr., who described the rotating trapezoidal window in 1951. It is a flat trapezoid painted as a window seen in perspective. It turns round and round at an even speed, but most people see it swing back and forth instead, because the eye takes its longer side to be the nearer one. Here it hangs in a building famous for its trapezoid windows.', clue: 'Stand in the lobby and watch the hanging window turn for a while.', source: { name: 'Ames window, Wikipedia', url: 'https://en.wikipedia.org/wiki/Ames_window' } }, { r: 1.6 });
      fireflyPlate(k, 'assets/museum/tex/breuer/ff_madison_storefronts.webp', 30, 5, BX - 44 + 0.06, 2.6, 30, PI / 2, CLEAR(k));
    }
    // the works: the lobby, the fourth floor gallery on its perimeter and the free standing walls
    const mounts: Mount[] = [];
    for (let i = 0; i < 4; i++) { const z = BZ - 16 + i * 6; mounts.push({ position: v(BX - GW / 2 + 3.7, 3.2, z), rotation: PI / 2, target: v(BX, 2.6, z), width: 4.2, height: 2.6, style: 'white', wash: true }); }
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = BZ - 20 + i * 8; mounts.push({ position: v(BX + s * (GW / 2 + 2.58), GY + 3.2, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(BX, GY + 2.6, z), width: 5.2, height: 3.0, style: 'white', wash: true }); }
    for (const [x, z] of [[BX - 6, BZ - 14], [BX + 6, BZ - 2]]) for (const s of [-1, 1]) mounts.push({ position: v(x + s * 0.22, GY + 2.8, z), rotation: s < 0 ? -PI / 2 : PI / 2, target: v(x + s * 6, GY + 2.6, z), width: 4.4, height: 2.6, style: 'white', wash: true });
    for (const x of [-10, 0, 10]) mounts.push({ position: v(BX + x, GY + 3.2, BZ - 8 - GD / 2 - 2.58), rotation: 0, target: v(BX + x, GY + 2.6, BZ - 8), width: 5.2, height: 3.0, style: 'white', wash: true });
    return { mounts, spawn: v(-6, 3, 36), look: v(BX, 14, BZ), eye: 3, bounds: [-GW / 2 - 2.6, GW / 2 + 2.6, BZ - 8 - GD / 2 - 2.4, 46], style: 'white', floorY: (x, z) => { if (x > BX - GW / 2 + 0.3 && x < BX - GW / 2 + 3.3 && z < BZ + 6.6 && z > BZ - 19) return Math.min(GY, ((BZ + 6.6 - z) / 25.2) * GY); if (x >= BX - GW / 2 + 0.3 && x < BX - GW / 2 + 3.3 && z <= BZ - 19) return GY + 0.2; if (z < BZ - 8 - GD / 2 - 2.6 + GD + 6 && z > BZ - 8 - GD / 2 - 2.6 && x > BX - GW / 2 + 3.3 && x < BX + GW / 2 + 2.6 && z <= BZ + 9) return GY + 0.2; return 0; } };
  },
};
