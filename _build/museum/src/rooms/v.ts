/* Rooms 102 to 106: the New-York Historical Society, Dia Chelsea, a West 24th Street gallery block, Fotografiska, MoMA PS1. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront } from './f';
import { mlowBanner, blossomFlag, donorWall, eyeMedallion, wordmarkRelief, eyeMonument, blossomGarden, INK, CLOUD, ELECTRIC, CYAN } from './brand';
import { hero, heroInstances } from './heroes';
import { hsign, paintTex, anamorphTex } from './f';
import { fireflyPlate } from './a';
import type { Kit } from '../kit';

const PI = Math.PI;

/* ---------- THE BIG UPGRADE, wave 6a (2026-11-24): helpers for rooms 102 to 106 ----------
   The wave 5c pattern (t.ts), kept local: scanned CC0 surfaces from assets/museum/tex/<room>/ (Poly Haven, 1k webp) that
   wear a sensible colour until their maps land, real CC0 models from assets/museum/props/<room>/ (Poly Haven) placed many
   at once (seven or more become instanced parts), and painted canvases. Safe in node: the audit builds with no DOM. */
const HAS_DOM = typeof window !== 'undefined' && typeof HTMLImageElement !== 'undefined';
const texL = HAS_DOM ? new T.TextureLoader() : null;
const w6a = new Map<string, { s: X.Surface; ready: Promise<unknown> }>();
function sc(k: Kit, room: string, id: string, metres: number, paint: () => X.Surface, p: Partial<T.MeshStandardMaterialParameters> & { normal?: number; stretch?: number } = {}, wait = 0x888888) {
  if (!texL) return k.pbr(`w6a-${room}-${id}`, paint(), 1 / metres, p);
  let e = w6a.get(`${room}/${id}`);
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
    w6a.set(`${room}/${id}`, e);
  }
  k.pending.push(e.ready);
  const key = `w6a-${room}-${id}-${p.color ?? ''}-${p.side ?? ''}-${p.roughness ?? ''}`;
  const m = k.pbr(key, e.s, 1 / metres, p);
  if (!m.userData.w6a) {
    m.userData.w6a = true;
    const maps = { map: m.map, normalMap: m.normalMap, roughnessMap: m.roughnessMap }, tint = m.color.clone();
    m.map = m.normalMap = m.roughnessMap = null;
    m.color.set(wait);
    void e.ready.then(() => { Object.assign(m, maps); m.color.copy(tint); m.needsUpdate = true; });
  }
  return m;
}
/* A real model fitted once and set at every [x, y, z, rotY, scale?]. */
function many(k: Kit, name: string, fit: Parameters<typeof hero>[2], at: number[][], tweak?: (o: T.Object3D) => void) {
  if (!at.length || !HAS_DOM) return;
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
/* Many copies of one box as a single instanced draw: [x, y, z, rotY?] each. */
function boxes(k: Kit, w: number, h: number, d: number, m: T.Material, at: number[][]) {
  if (!at.length) return;
  const q = new T.Quaternion(), up = new T.Vector3(0, 1, 0), one = new T.Vector3(1, 1, 1);
  k.instances(new T.BoxGeometry(w, h, d), m, at.map(([x, y, z, r = 0]) => new T.Matrix4().compose(new T.Vector3(x, y, z), q.setFromAxisAngle(up, r), one)));
}
/* One trick a room (rule 9): anamorphic type on the floor that stands up as a sign from one spot. */
function standUp(k: Kit, text: string, fg: string, ex: number, ez: number, eh: number, floor: number, yaw: number, D: number, W: number, H: number) {
  if (!HAS_DOM) return;
  anamorphTex(k, floorType(text, fg, 1024, Math.max(96, Math.round((1024 * H) / W))), ex, ez, eh, floor, yaw, D, W, H);
}
const CORNICE: [number, number][] = [[0, 0], [0.5, 0], [0.56, 0.16], [0.36, 0.3], [0.5, 0.48], [0, 0.6]];

/* ---------------- 102 THE HISTORICAL SOCIETY ---------------- */
export const nyhistorical: RoomDef = {
  id: 'nyhistorical',
  name: 'The oldest museum in the city',
  area: 'NEW-YORK HISTORICAL SOCIETY',
  mood: 'Central Park West, a school morning',
  color: '#c8b898',
  description: 'The granite temple front across from the park, the great hall of the city\'s history with its wall of lamps, the library above, the works among the relics.',
  signatures: 'The Roman Eclectic granite facade with its Ionic columns and bronze doors, the entrance hall with the mural and the wall of Tiffany lamps upstairs, the Luce Center of open storage, the reading room with green shaded lamps.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad8, horizon: 0xeef0ec, ground: 0x6a6a66, fog: 0.002, sun: { az: 2.8, el: 0.7, color: 0xfff6e8, size: 12 }, env: 0.95 });
    k.hemi(0xf2f6ff, 0x5a5a58, 0.9);
    k.sun(0xfff2dc, 2.2, 40, 70, 40, true, 90);
    /* 2026-11-24 (wave 6a): scanned CC0 surfaces (Poly Haven, 1k): granite ashlar for the front, white marble for the hall, marble
       tile for the floor, oak veneer for the mezzanine and the tables, white plaster for the ceiling */
    const granite = sc(k, 'nyhistorical', 'granite', 3.2, () => X.ashlar(0xb8b0a0, 312, 3), { roughness: 0.8, color: 0xfaf6f0 }, 0xb8b0a0), marble = sc(k, 'nyhistorical', 'marble', 2.2, () => X.marble(0xe0dcd2, 0x9a948a, 22), { roughness: 0.3, color: 0xf2ede4 }, 0xd8d2c8),
      floorT = sc(k, 'nyhistorical', 'floor', 2.4, () => X.terrazzo(0xc0b8a8, 176), { roughness: 0.32, color: 0xe4dccc }, 0xb8b0a0), oak = sc(k, 'nyhistorical', 'oak', 1.6, () => X.planks(0x5a3a26, 4, 313, 0.15), { roughness: 0.5, color: 0xb08860 }, 0x5a3a26), dark = k.flat(0x1a1c20, 0.5, 0.6),
      glass = k.glass(0xdcecf6, 0.14, 0.04), bronze = k.flat(0x4a3a28, 0.8, 0.4), lampGlass = k.glow(0xffc880), greenG = k.glow(0x4ad86a), white = sc(k, 'nyhistorical', 'plaster', 2.0, () => X.plaster(0xf4f4f2, 177), { roughness: 0.85, color: 0xf4f0e8 }, 0xe8e4dc);
    street(k, { w: 24, len: 160, z: 40, x: 0 });
    k.box(160, 0.4, 200, 100, -0.2, 0, k.pbr('nyhLawn', X.grass(0x4a6a3a, 178), 0.06)); k.rail(18, 0, 160, dark, 1.0, 'z', 2.4); k.block(17.6, 18.4, -80, 80);
    const rnd = X.mulberry(102); for (let i = 0; i < 30; i++) k.tree(24 + rnd() * 60, 0, -80 + rnd() * 160, { h: 8 + rnd() * 6, r: 3 + rnd() * 2, leaf: 0x4a7a3c, seed: i, species: i % 3 ? 'elm' : 'oak' });
    const BX = -30, BZ = 0, BW = 36, BD = 50;
    k.box(BW, 20, BD, BX, 10, BZ, granite);
    k.moulding([[0, 0], [1.0, 0], [1.1, 0.3], [0.7, 0.5], [0.9, 0.9], [0, 1.1]], BD + 0.4, BX + BW / 2 + 0.05, 19.4, BZ, granite, 0); /* wave 6a: was rotated PI / 2, so it ran 50 m along x out across the street into the park */
    // the 1908 York and Sawyer front: a rusticated base with a ledge at the second floor, eight three quarter engaged Ionic columns standing on it, plain end pavilions
    k.box(0.8, 0.5, 30, BX + BW / 2 + 0.3, 6.0, BZ, granite);
    for (let i = 0; i < 8; i++) { const z = BZ - 14 + i * 4; k.column(BX + BW / 2 + 0.3, 6.25, z, 10.6, 0.7, granite, false); k.prop('ionic_capital', BX + BW / 2 + 0.3, 16.85, z, { height: 1.1 }); }
    k.box(1.4, 1.4, 31, BX + BW / 2 + 0.4, 18.3, BZ, granite);
    for (const s of [-1, 1]) k.box(0.8, 19, 7.6, BX + BW / 2 + 0.4, 9.5, BZ + s * 21.2, granite);
    k.arch(3, 5.6, 2, BX + BW / 2, 0, BZ, granite, false, 0.85).rotation.y = PI / 2; k.box(0.2, 5, 2.8, BX + BW / 2 + 0.5, 2.5, BZ, bronze);
    k.block(BX + BW / 2 - 0.6, BX + BW / 2 + 0.8, BZ - BD / 2, BZ - 1.6); k.block(BX + BW / 2 - 0.6, BX + BW / 2 + 0.8, BZ + 1.6, BZ + BD / 2);
    for (let i = 0; i < 10; i++) k.box(1.0, 0.3, 14, BX + BW / 2 + 3 + i * 1.0, 0.15 + (9 - i) * 0.3, BZ, granite);
    for (let f = 0; f < 3; f++) for (let i = 0; i < 7; i++) { const y = 3.2 + f * 4.6, z = BZ - 12 + i * 4; if (f === 0 && Math.abs(z) < 3) continue; k.box(0.16, 2.6, 1.8, BX + BW / 2 + 0.02, y, z, marble); k.box(0.06, 2.2, 1.4, BX + BW / 2 + 0.1, y, z, glass); }
    for (const s of [-1, 1]) for (let f = 0; f < 3; f++) { const y = 3.2 + f * 4.6; k.box(0.06, 2.0, 1.4, BX + BW / 2 + 0.82, y, BZ + s * 21.2, glass); }
    k.sign('NEW-YORK HISTORICAL SOCIETY  ·  1804', 12, 0.7, BX + BW / 2 + 1.12, 18.3, BZ, 'transparent', '#3a3020', 70, PI / 2);
    mlowBanner(k, BX + BW / 2 + 0.85, 10, BZ - 21.2, PI / 2, 3.2, true); blossomFlag(k, BX + BW / 2 + 0.85, 10, BZ + 21.2, PI / 2, 2.8, 7, 'ink');
    k.egg(v(BX + BW / 2 + 1.3, 18.3, BZ), { id: 'nyhistorical-hyphen', title: 'The hyphen they would not give up', year: '1945', text: 'The hyphen in New-York was standard spelling in 1804, and the New York Times kept it in its masthead until the 1890s. In 1945 a councilman objected to it on a subway ad, the Chief Magistrate called it a sneaky gremlin, and the City Council tried to legislate it away. The librarians and curators refused, and the name stays carved in the stone. The staff softball team is called The Hyphens.', clue: 'Read the name cut into the stone over the columns.', source: { name: 'Top 10 Secrets of the New-York Historical Society, Untapped New York', url: 'https://untappedcities.com/2019/06/24/top-10-secrets-of-the-new-york-historical-society/' } }, { r: 1.8 });
    k.egg(v(BX + BW / 2 + 1.0, 7.8, BZ - 8), { id: 'nyhistorical-tricorne', title: 'A Picasso through the window', year: '2015', text: 'The largest artwork here is Picasso\'s Le Tricorne, a 19 by 20 foot stage curtain painted for a 1919 Ballets Russes production, the largest Picasso painting in America. It hung in the Four Seasons restaurant in the Seagram Building from 1957 for six decades. After its removal in 2015 and conservation in Williamstown, a crane lifted it in a 23 foot tube through a second floor window.', clue: 'Look up at the second floor windows on Central Park West.', source: { name: 'Top 10 Secrets of the New-York Historical Society, Untapped New York', url: 'https://untappedcities.com/2019/06/24/top-10-secrets-of-the-new-york-historical-society/' } }, { r: 1.6 });
    k.egg(v(BX + BW / 2 + 1.5, 1.8, BZ - BD / 2 - 0.5), { id: 'nyhistorical-douglass', title: 'Douglass on the 77th Street steps', text: 'A life size bronze of the abolitionist Frederick Douglass stands atop the staircase at the West 77th Street entrance, the work of the sculptor Ivan Schwartz and StudioEIS in Brooklyn. He holds two books in his left hand and gazes into the distance. A life size bronze of Abraham Lincoln stands on the Central Park West side.', clue: 'Walk to the north corner of the building, where 77th Street meets the park.', source: { name: 'Frederick Douglass (New York, New York), Contemporary Monuments to the Slave Past', url: 'https://mail.slaverymonuments.org/items/show/1193' } }, { r: 1.6 });
    // the entrance hall and the great hall, the wall of Tiffany lamps on the mezzanine, the reading room lamps
    const IW = BW - 1.2, ID = BD - 1.2;
    k.box(IW, 0.3, ID, BX, 0.15, BZ, floorT);
    k.block(BX - IW / 2 - 0.6, BX - IW / 2 + 0.2, BZ - ID / 2, BZ + ID / 2); k.block(BX - IW / 2, BX + IW / 2, BZ - ID / 2 - 0.6, BZ - ID / 2 + 0.2); k.block(BX - IW / 2, BX + IW / 2, BZ + ID / 2 - 0.2, BZ + ID / 2 + 0.6);
    for (const s of [-1, 1]) k.box(0.3, 8, ID, BX + s * (IW / 2 - 0.2), 4, BZ, marble);
    k.box(IW, 8, 0.3, BX, 4, BZ - ID / 2 + 0.2, marble); k.box(IW, 8, 0.3, BX, 4, BZ + ID / 2 - 0.2, marble);
    k.box(IW, 0.4, ID, BX, 12.4, BZ, white);
    k.box(IW, 0.4, 8, BX, 8, BZ - ID / 2 + 4, oak); k.box(8, 0.4, ID, BX - IW / 2 + 4, 8, BZ, oak); k.box(0.06, 1.0, ID, BX - IW / 2 + 8, 8.7, BZ, bronze); k.box(IW, 0.06, 1.0, BX, 8.7, BZ - ID / 2 + 8, bronze).rotation.x = PI / 2;
    for (let i = 0; i < 20; i++) k.box(2.4, 0.4, 0.9, BX + IW / 2 - 1.5, 0.2 + i * 0.4, BZ + ID / 2 - 2 - i * 0.9, marble);
    k.block(BX + IW / 2 - 2.8, BX + IW / 2 - 0.3, BZ - ID / 2, BZ + ID / 2 - 1.5);
    k.box(IW - 3, 0.4, 3, BX - 1.5, 8, BZ + ID / 2 - 1.5, oak); k.block(BX - IW / 2, BX + IW / 2 - 3, BZ + ID / 2 - 3, BZ + ID / 2);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 3; j++) { const x = BX - IW / 2 + 1 + j * 2.4, z = BZ - 16 + i * 4.6; k.box(0.3, 0.3, 0.3, x, 8.4 + 0.6, z, oak); k.mesh(new T.ConeGeometry(0.42, 0.4, 12, 1, true), lampGlass, x, 9.5, z).rotation.x = PI; k.cyl(0.04, 0.5, x, 9.2, z, bronze, 0.04, 6); k.point(x, 9.3, z, 0xffc880, 3, 3); }
    /* wave 6a: the reading tables moved 4 m east; their keep outs covered the viewing spots of the west wall */ for (let i = 0; i < 4; i++) { const z = BZ + [-10, -6.5, 6.5, 10][i]; k.box(6, 0.1, 1.6, BX + 6, 0.9, z, oak); for (const dx of [-2.6, 2.6]) k.box(0.12, 0.85, 1.4, BX + 6 + dx, 0.45, z, oak); k.keepOut.push({ x: BX + 6, z, r: 3.2 }); for (const dx of [-1.6, 1.6]) { k.cyl(0.03, 0.5, BX + 6 + dx, 1.2, z, bronze, 0.03, 6); k.cyl(0.24, 0.2, BX + 6 + dx, 1.5, z, greenG, 0.18, 12); k.point(BX + 6 + dx, 1.4, z, 0xc8ffc0, 6, 4); } }
    eyeMedallion(k, BX + 10, 0.16, BZ, 2.2);
    donorWall(k, BX, 4.6, BZ - ID / 2 + 0.36, 0, 10, false);
    k.egg(v(BX - IW / 2 + 3.4, 9.6, BZ), { id: 'nyhistorical-tiffany', title: 'One collector\'s lamps', year: '1935', text: 'The Society owns 132 Tiffany lamps, all from a single gift by the collector Dr. Egon Neustadt, about half of his collection. He and his wife bought their first lamp in 1935 from an antique store in Greenwich Village. Many shades were cut in the women\'s glass cutting department Louis C. Tiffany set up in 1892 after a strike by the men\'s union, run by Clara Wolcott Driscoll.', clue: 'Climb to the mezzanine and walk the row of glowing shades.', source: { name: 'Top 10 Secrets of the New-York Historical Society, Untapped New York', url: 'https://untappedcities.com/2019/06/24/top-10-secrets-of-the-new-york-historical-society/' } }, { r: 1.8 });
    k.egg(v(BX - 8, 2.2, BZ - 8), { id: 'nyhistorical-audubon', title: 'Every Audubon watercolor', text: 'The Society holds all 435 of John James Audubon\'s surviving preparatory watercolors for The Birds of America. Its museum also predates the Metropolitan Museum of Art by nearly 70 years.', clue: 'Find the glass case on the floor of the great hall.', source: { name: 'New-York Historical Society, Wikipedia', url: 'https://en.wikipedia.org/wiki/New-York_Historical_Society' } }, { r: 1.4 });
    k.egg(v(BX - 6, 2.4, BZ + 12), { id: 'nyhistorical-time-capsule', title: 'The capsule nobody opened', year: '1914', text: 'In 1914 the Lower Wall Street Business Men\'s Association sealed a bronze box, which former mayor Seth Low hammered shut and handed to the Society\'s president. It was meant to be opened in 1974, but a cataloguing error hid it until the 1990s. It was finally opened on October 8, 2014, and held a New York Herald of May 15, 1914 and a 1914 almanac.', clue: 'Look by the globe stand in the great hall.', source: { name: 'Top 10 Secrets of the New-York Historical Society, Untapped New York', url: 'https://untappedcities.com/2019/06/24/top-10-secrets-of-the-new-york-historical-society/' } }, { r: 1.4 });
    k.prop('equestrian', BX + 8, 0.15, BZ - 14, { height: 4, keepOut: 2 }); k.prop('globe_stand', BX - 6, 0.15, BZ + 12, { height: 2.0, keepOut: 1 }); k.prop('vitrine', BX - 8, 0.15, BZ - 8, { height: 1.7, keepOut: 1.2 });
    for (let i = 0; i < 4; i++) k.point(BX, 7.4, BZ - 16 + i * 10, 0xfff0dc, 22, 14);
    k.crowd([v(-2, 0, 20), v(BX + 12, 0.15, BZ + 2), v(BX + 4, 0.15, BZ - 8), v(BX - 6, 0.15, BZ + 6)], 14, { seed: 140, speed: 0.35, spread: 2, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a, 0x33477f] });
    k.censusWall({ x: BX + IW / 2 - 0.36, y: 4.2, z: BZ - 8, rotY: -PI / 2, cols: 30, rows: 5, tile: 0.5, gap: 0.05, start: ctx.wallStart(4500, 150), pieces: ctx.all, backing: dark });
    /* ---- 2026-11-24 (wave 6a): the Historical Society built out ----
       Outside: rusticated joints on the base, a dentil course under the cornice, bronze door panels and plaques, Central Park
       West lamps and the corner street sign. Inside: the hall walls run up to a coffered plaster ceiling (from inside the
       one sided granite box let the sky in above the marble), skirting, picture rail and pilasters on the marble, three
       chandeliers, founders' busts on plinths by the door, a tall clock at the foot of the stair, chairs at the reading
       tables, and the Luce Center's open storage cases under the north mezzanine full of vases and clocks. All models
       Poly Haven, CC0. One trick: 1804 painted flat on the floor stands up as a sign from inside the door. */
    {
      const FX = BX + BW / 2, joint = k.flat(0x5a544a, 0, 0.95), dMarble = sc(k, 'nyhistorical', 'marble', 2.2, () => X.marble(0x4a4844, 0x2a2826, 24), { roughness: 0.3, color: 0x5a5650 }, 0x4a4844);
      const gilt = k.pbr('nyhGilt', X.gilt(0xc8a050), 2, { metalness: 0.85, roughness: 0.32 });
      { const at: number[][] = []; for (let y = 0.75; y < 5.6; y += 0.75) for (const zc of [BZ - 9.2, BZ + 9.2]) at.push([FX + 0.05, y, zc]); boxes(k, 0.1, 0.07, 13.2, joint, at); }
      { const at: number[][] = []; for (let z = BZ - 15.2; z <= BZ + 15.2; z += 0.5) at.push([FX + 0.98, 17.5, z]); boxes(k, 0.22, 0.26, 0.2, granite, at); }
      k.moulding(CORNICE, 30, FX + 0.3, 5.8, BZ, granite, 0);
      for (const s of [-1, 1]) { for (const y of [1.0, 2.4, 3.8]) k.box(0.06, 1.1, 0.95, FX + 0.62, y, BZ + s * 0.62, gilt); hsign(k, s < 0 ? 'MUSEUM' : 'LIBRARY', 1.5, 0.42, FX + 0.06, 2.6, BZ + s * 2.6, PI / 2, { fg: '#ead8b0', bg: '#3e3022', border: '#c8a050', size: 0.55, font: 'W2 Archivo Expanded' }); }
      hsign(k, 'CENTRAL PARK WEST AT 77TH STREET  ·  OPEN TODAY', 9, 0.5, FX + 0.06, 6.55, BZ, PI / 2, { fg: '#3a3020', size: 0.6, font: 'W2 JetBrains Mono', lit: false });
      many(k, 'nyhistorical/ph_street_lamp_01', { height: 4.8 }, [[13.2, 0, -18, -PI / 2], [13.2, 0, 22, -PI / 2]]);
      for (const z of [-18, 22]) { k.keepOut.push({ x: 13.2, z, r: 0.35 }); k.point(13.2, 4.6, z, 0xffe2b0, 10 * k.night + 1, 14); }
      { const px = 12.6, pz = -27; k.cyl(0.06, 3.6, px, 1.8, pz, k.flat(0x1e2a22, 0.6, 0.5), 0.06, 8); hsign(k, 'CENTRAL PARK W', 1.8, 0.28, px, 3.5, pz + 0.04, 0, { fg: '#ffffff', bg: '#1f5a3a', border: '#ffffff', size: 0.6 }); hsign(k, 'W 77 ST', 1.4, 0.28, px + 0.04, 3.84, pz, PI / 2, { fg: '#ffffff', bg: '#1f5a3a', border: '#ffffff', size: 0.62 }); k.keepOut.push({ x: px, z: pz, r: 0.3 }); }
      // the hall: walls to the ceiling, the ceiling coffered, skirting, rails and pilasters
      for (const s of [-1, 1]) k.box(0.3, 4.4, ID, BX + s * (IW / 2 - 0.2), 10.2, BZ, white);
      for (const s of [-1, 1]) k.box(IW, 4.4, 0.3, BX, 10.2, BZ + s * (ID / 2 - 0.2), white);
      { const ax: number[][] = [], az: number[][] = []; for (let z = BZ - ID / 2 + 3; z < BZ + ID / 2 - 1; z += 3.4) ax.push([BX, 11.95, z]); for (let x = BX - IW / 2 + 3; x < BX + IW / 2 - 1; x += 3.4) az.push([x, 11.95, BZ]);
        boxes(k, IW - 0.6, 0.5, 0.36, white, ax); boxes(k, 0.36, 0.5, ID - 0.6, white, az);
        const ro: number[][] = []; for (let z = BZ - ID / 2 + 4.7; z < BZ + ID / 2 - 1; z += 3.4) for (let x = BX - IW / 2 + 4.7; x < BX + IW / 2 - 1; x += 3.4) ro.push([x, 12.16, z]); boxes(k, 0.7, 0.06, 0.7, gilt, ro); }
      for (const s of [-1, 1]) { k.box(0.06, 0.36, ID - 0.8, BX + s * (IW / 2 - 0.38), 0.48, BZ, dMarble); k.box(IW - 0.8, 0.36, 0.06, BX, 0.48, BZ + s * (ID / 2 - 0.38), dMarble); }
      k.box(0.08, 0.1, ID - 0.8, BX - IW / 2 + 0.4, 5.6, BZ, oak); k.box(IW - 0.8, 0.1, 0.08, BX, 5.6, BZ + ID / 2 - 0.4, oak);
      for (const z of [-22, -14, -6, 2, 10, 18]) { const x = BX - IW / 2 + 0.52; k.box(0.34, 7.0, 0.9, x, 4.0, BZ + z, marble); k.box(0.5, 0.4, 1.1, x + 0.06, 0.55, BZ + z, dMarble); k.box(0.5, 0.36, 1.1, x + 0.06, 7.6, BZ + z, gilt); }
      many(k, 'nyhistorical/ph_Chandelier_01', { height: 1.7 }, [[BX + 6, 10.1, BZ - 8, 0], [BX + 6, 10.1, BZ + 4, 0], [BX + 6, 10.1, BZ + 15, 0]], (o) => tint(o, 0xc8a050, 0.35, 0.85));
      for (const z of [-8, 4, 15]) { k.cyl(0.02, 0.5, BX + 6, 11.95, BZ + z, bronze, 0.02, 5); k.point(BX + 6, 10.6, BZ + z, 0xffe0b0, 14, 12); }
      // founders' busts on plinths either side of the way in
      { const at: number[][] = []; for (const x of [FX - 5.2, FX - 8.2]) for (const s of [-1, 1]) { k.box(0.62, 1.2, 0.62, x, 0.9, BZ + s * 5, marble); k.box(0.74, 0.1, 0.74, x, 1.5, BZ + s * 5, dMarble); at.push([x, 1.55, BZ + s * 5, s < 0 ? 0 : PI]); k.keepOut.push({ x, z: BZ + s * 5, r: 0.55 }); }
        many(k, 'nyhistorical/ph_marble_bust_01', { height: 0.8 }, at); }
      many(k, 'nyhistorical/ph_vintage_grandfather_clock_01', { height: 2.4 }, [[FX - 4.2, 0.3, BZ + ID / 2 - 0.62, PI]]); k.keepOut.push({ x: FX - 4.2, z: BZ + ID / 2 - 0.62, r: 0.5 });
      many(k, 'nyhistorical/ph_dining_chair_02', { height: 1.0 }, [[BX + 4.6, 0.3, BZ - 7.6, 0], [BX + 7.4, 0.3, BZ - 7.6, 0], [BX + 6, 0.3, BZ - 5.4, PI], [BX + 4.6, 0.3, BZ + 5.4, PI], [BX + 7.4, 0.3, BZ + 5.4, PI], [BX + 6, 0.3, BZ + 7.6, 0]], (o) => tint(o, 0x6a4428, 0.55, 0.05));
      // the Luce Center: open storage, glass cases of the collection under the north mezzanine
      { const vz = BZ - ID / 2 + 0.9, vases: number[][] = [], clocks: number[][] = [];
        for (const [i, x] of [BX - 13, BX - 7, BX - 1, BX + 5].entries()) {
          k.box(3.2, 0.5, 0.9, x, 0.55, vz, oak); k.box(3.2, 2.3, 0.9, x, 1.95, vz, glass); k.box(3.3, 0.12, 1.0, x, 3.16, vz, oak);
          for (const y of [1.25, 1.95, 2.65]) k.box(3.1, 0.04, 0.8, x, y, vz, oak);
          vases.push([x - 0.9, 1.27, vz, i]); if (i % 2) vases.push([x + 0.8, 2.67, vz, 0]); else clocks.push([x + 0.6, 1.97, vz, 0]);
          k.point(x, 3.0, vz + 0.2, 0xfff0d8, 3, 3); k.block(x - 1.6, x + 1.6, vz - 0.5, vz + 0.5); }
        many(k, 'nyhistorical/ph_antique_ceramic_vase_01', { height: 0.5 }, vases); many(k, 'nyhistorical/ph_mantel_clock_01', { height: 0.28 }, clocks); }
      hsign(k, 'HENRY LUCE III CENTER  ·  OPEN STORAGE', 7, 0.45, BX - 4, 7.55, BZ - ID / 2 + 8.04, 0, { fg: '#2a2418', bg: '#efe6d4', size: 0.55, font: 'W2 Archivo Expanded' });
      hsign(k, 'GALLERY OF TIFFANY LAMPS', 6, 0.45, BX - IW / 2 + 8.04, 7.55, BZ + 2, PI / 2, { fg: '#2a2418', bg: '#efe6d4', size: 0.55, font: 'W2 Archivo Expanded' });
      // Firefly: the hall mural over the doors, and leaded glass for the lamp shades (each shows when its file lands)
      fireflyPlate(k, 'assets/museum/tex/nyhistorical/ff_nyh_hall_mural.webp', 12, 2.4, BX + IW / 2 - 0.37, 6.6, BZ - 4, -PI / 2, white);
      if (texL) texL.load('assets/museum/tex/nyhistorical/ff_tiffany_shade.webp', (t) => { if (!k.live) return; t.colorSpace = T.SRGBColorSpace; t.wrapS = T.RepeatWrapping; t.repeat.set(3, 1); lampGlass.map = t; lampGlass.color.set(0xffffff); lampGlass.needsUpdate = true; }, undefined, () => {});
      standUp(k, '1804', '#3a2e1e', FX - 1.2, BZ, 3, 0.31, PI / 2, 7, 5, 1.3);
      k.egg(v(FX - 9, 1.0, BZ), { id: 'nyhistorical-standing-date', title: 'A date that stands up', text: 'The 1804 on the floor of the hall is painted long and thin, so it only reads as an upright sign from one spot just inside the door. Painting a shape stretched so that it comes right from a single viewpoint is anamorphosis, a trick artists have used since the Renaissance. 1804 is the year the Society was founded.', clue: 'Stand just inside the doors and look at the floor ahead.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.4 });
    }
    // the works: the marble walls of the great hall, the mezzanine backs, the reading room's end wall
    const mounts: Mount[] = [];
    for (let i = 0; i < 5; i++) { const z = BZ - 18 + i * 8; mounts.push({ position: v(BX - IW / 2 + 0.38, 3.4, z), rotation: PI / 2, target: v(BX, 2.8, z), width: 4.4, height: 2.6, style: 'gilt', wash: true }); }
    for (const x of [-10, 0, 10]) mounts.push({ position: v(BX + x, 3.4, BZ + ID / 2 - 0.38), rotation: PI, target: v(BX + x, 2.8, BZ), width: 4.4, height: 2.6, style: 'gilt', wash: true });
    for (const x of [-10, 0, 10]) mounts.push({ position: v(BX + x, 10.4, BZ - ID / 2 + 0.38), rotation: 0, target: v(BX + x, 9, BZ - 8), width: 4.4, height: 2.6, style: 'gilt', wash: false });
    for (let i = 0; i < 3; i++) { const z = BZ + 4 + i * 6; mounts.push({ position: v(BX + IW / 2 - 0.38, 3.4, z), rotation: -PI / 2, target: v(BX, 2.8, z), width: 3.6, height: 2.2, style: 'gilt', wash: true }); }
    /* wave 6a: the park side boards faced the park, and the first stood outside the room's bounds; now they face the avenue */ for (let i = 0; i < 3; i++) { const z = -14 + i * 22; k.box(0.3, 3, 4.6, 18.4, 1.9, z, dark); mounts.push({ position: v(18.2, 2.0, z), rotation: -PI / 2, target: v(8, 2, z), width: 4.2, height: 2.5, style: 'black', wash: false }); }
    return { mounts, spawn: v(2, 3, 22), look: v(BX + BW / 2, 12, BZ), eye: 3, bounds: [BX - IW / 2 + 0.8, 40, BZ - ID / 2 + 1, 60], style: 'gilt', floorY: (x, z) => { if (x > BX + IW / 2 - 2.8 && x < BX + IW / 2 - 0.3 && z < BZ + ID / 2 - 1.5 && z > BZ + ID / 2 - 20) return Math.min(7.8, ((BZ + ID / 2 - 1.5 - z) / 18) * 7.8); if (((x > BX - IW / 2 && x < BX - IW / 2 + 8) || (z > BZ - ID / 2 && z < BZ - ID / 2 + 8) || (z > BZ + ID / 2 - 3 && x < BX + IW / 2 - 3)) && x > BX - IW / 2 && x < BX + IW / 2 - 2.8 && z > BZ - ID / 2 && z < BZ + ID / 2) return 8.2; return 0; } };
  },
};

/* ---------------- 103 DIA CHELSEA ---------------- */
export const diachelsea: RoomDef = {
  id: 'diachelsea',
  name: 'The long light',
  area: 'DIA CHELSEA',
  mood: 'Twenty second Street, grey day',
  color: '#a8a8a0',
  description: 'The brick warehouses on West 22nd, the sawtooth roofs, then the joined galleries: bare brick and concrete under skylights the length of a block, the works given all the room they want.',
  signatures: 'Three adjoining industrial buildings, one of them the old Alcamo Marble Works, joined into one behind three new brick fronts, the single storey galleries under banks of skylights, the poured floors, the basalt stones and trees of Beuys\'s 7000 Oaks on the sidewalk, the High Line passing behind.',
  build(k, ctx) {
    k.sky({ top: 0x9aa4ac, horizon: 0xd8dcd8, ground: 0x5a5e58, fog: 0.003, sun: { az: 3.1, el: 0.6, color: 0xf0f0e8, size: 10 }, haze: 0.7, env: 0.7 });
    k.hemi(0xe8ecf0, 0x4a4a48, 0.9);
    k.sun(0xf4f0e8, 1.0, 20, 60, 30, false, 60);
    /* 2026-11-24 (wave 6a): scanned CC0 surfaces (Poly Haven, 1k): red brick, whitewashed brick, polished concrete, corrugated roof, rough basalt */
    const brick = sc(k, 'diachelsea', 'brick', 2.4, () => X.brick(0x8a5a48, 314), { roughness: 0.85, color: 0xd8b0a0 }, 0x8a5a48), brickW = sc(k, 'diachelsea', 'brickw', 2.4, () => X.brick(0xe8e4dc, 315), { roughness: 0.9, color: 0xf4f2ec }, 0xe0dcd4),
      floorC = sc(k, 'diachelsea', 'floor', 3.0, () => X.concrete(0xb8b4ac, 179), { roughness: 0.7, color: 0xf0ece4 }, 0xb8b4ac), glass = k.glass(0xe8f4f8, 0.1, 0.03), steel = k.flat(0x3a3a3c, 0.6, 0.55), dark = k.flat(0x1a1c20, 0.5, 0.6), scrim = k.glow(0xf8f8f4, 0.9);
    street(k, { w: 16, len: 160, z: 20, x: 0 });
    blockFront(k, { x: 12, z0: 100, count: 12, face: -1, seed: 316, h: [10, 18] });
    for (let z = 90; z > -70; z -= 12) for (const x of [-30, -24]) k.box(0.9, 8, 0.9, x, 4, z, steel);
    k.box(12, 0.8, 170, -27, 8.2, 10, steel); k.box(6, 0.2, 170, -27, 8.7, 10, k.pbr('diaDeck', X.boardwalk(0x9a8a70), 0.5));
    k.crowd([v(-27, 8.8, 90), v(-27, 8.8, -70)], 12, { seed: 141, speed: 0.8, spread: 2.4, animate: !ctx.reduced });
    // the three garages joined: brick fronts with loading doors, sawtooth roofs, one long interior
    const GX = -10, GZ = -20, GW = 22, GD = 60;
    // three new brick fronts, distinct but related, one per building; the middle one is the old Alcamo Marble Works
    const brickM = sc(k, 'diachelsea', 'brick', 2.4, () => X.brick(0x6a4a3e, 353), { roughness: 0.85, color: 0x9a7466 }, 0x6a4a3e);
    for (let i = 0; i < 3; i++) { const fw = (GW + 2) / 3; k.box(fw, 9 + (i === 1 ? 0.8 : 0), 0.6, GX - (GW + 2) / 2 + fw * (i + 0.5), 4.5 + (i === 1 ? 0.4 : 0), GZ + GD / 2 + 0.3, [brick, brickM, brickW][i]); }
    // Joseph Beuys, 7000 Oaks: a basalt stone stood beside each tree along the block, a mix of street species
    const basalt = sc(k, 'diachelsea', 'basalt', 1.2, () => X.ashlar(0x3c3e40, 354, 1), { roughness: 0.85, color: 0x4a4c4e }, 0x3c3e40);
    const oaks: [number, 'pear' | 'ginkgo' | 'linden' | 'oak' | 'plane' | 'locust'][] = [[14, 'ginkgo'], [22, 'linden'], [30, 'oak'], [40, 'pear'], [52, 'plane'], [64, 'locust']];
    for (const [z, sp] of oaks) { k.tree(-11.4, 0.14, z, { h: 7, r: 2.4, seed: z, species: sp }); k.cyl(0.28, 1.25, -10.3, 0.75, z + 0.6, basalt, 0.32, 6); k.keepOut.push({ x: -11.4, z, r: 0.8 }, { x: -10.3, z: z + 0.6, r: 0.5 }); }
    k.box(0.6, 9, GD, GX - GW / 2, 4.5, GZ, brick); k.box(0.6, 9, GD, GX + GW / 2, 4.5, GZ, brick); k.box(GW, 9, 0.6, GX, 4.5, GZ - GD / 2, brick);
    for (let i = 0; i < 6; i++) { const z = GZ + GD / 2 - 5 - i * 10; const saw = k.box(GW + 1, 0.4, 10, GX, 9.5 + 1.2, z, sc(k, 'diachelsea', 'roof', 2.0, () => X.steel(0x6a6f76, false, 317), { roughness: 0.6, metalness: 0.4, color: 0xb8bcc0 }, 0x6a6f76)); saw.rotation.x = 0.3; k.box(GW + 1, 3.2, 0.1, GX, 10.6, z - 5, glass); }
    k.box(6, 5, 0.3, GX, 2.5, GZ + GD / 2 + 0.3, glass); k.block(GX - GW / 2 - 1, GX - 3.2, GZ + GD / 2 - 0.2, GZ + GD / 2 + 0.8); k.block(GX + 3.2, GX + GW / 2 + 1, GZ + GD / 2 - 0.2, GZ + GD / 2 + 0.8);
    for (const dx of [-8, 8]) { k.box(4, 4, 0.2, GX + dx, 2, GZ + GD / 2 + 0.62, steel); for (let i = 0; i < 6; i++) k.box(4, 0.06, 0.02, GX + dx, 0.4 + i * 0.66, GZ + GD / 2 + 0.74, dark); }
    k.sign('DIA  ·  CHELSEA', 5, 0.7, GX, 7.4, GZ + GD / 2 + 0.62, 'transparent', '#1a1c20', 80, 0);
    mlowBanner(k, GX - 9.5, 6.2, GZ + GD / 2 + 0.9, 0, 2.4, false); blossomFlag(k, GX + 9.5, 6.2, GZ + GD / 2 + 0.9, 0, 2.2, 3, 'cloud');
    const IW = GW - 1.2, ID = GD - 1.2;
    k.box(IW, 0.3, ID, GX, 0.15, GZ, floorC);
    k.block(GX - IW / 2 - 0.6, GX - IW / 2 + 0.2, GZ - ID / 2, GZ + ID / 2); k.block(GX + IW / 2 - 0.2, GX + IW / 2 + 0.6, GZ - ID / 2, GZ + ID / 2); k.block(GX - IW / 2, GX + IW / 2, GZ - ID / 2 - 0.6, GZ - ID / 2 + 0.2);
    for (let i = 0; i < 6; i++) { const z = GZ + ID / 2 - 5 - i * 10; k.mesh(new T.PlaneGeometry(IW - 2, 8), scrim, GX, 9.2, z).rotation.x = PI / 2; k.point(GX, 8, z, 0xf8f8f4, 30, 20); }
    for (const z of [GZ + 10, GZ - 10]) { k.box(IW - 6, 5, 0.4, GX, 2.5, z, brickW); k.block(GX - IW / 2 + 3, GX + IW / 2 - 3, z - 0.4, z + 0.4); }
    for (const [x, z, p] of [[GX - 5.5, GZ + 14.5, 'noguchi_stone_2' /* entrance pass: moved out of the torqued ellipse's bay */], [GX + 5, GZ, 'noguchi_stone_3'], [GX, GZ - 22, 'noguchi_stone_1']] as const) k.prop(p, x, 0.15, z, { height: 2.6, keepOut: 1.6 });
    eyeMedallion(k, GX, 0.16, GZ + 13, 1.8); /* wave 6a: moved back to clear the floor type at the door */
    k.egg(v(-10.3, 1.9, 22.6), { id: 'diachelsea-7000-oaks', title: 'A stone for every tree', year: '1988', text: 'In 1988 Dia installed five basalt columns, each paired with a tree, outside its first Chelsea building, an extension of Joseph Beuys\'s 7000 Oaks. A 1996 expansion brought the block to 37 pairs, and one more pair was added in the 2021 renovation, making 38. The trees are not all oaks: Callery pear, hackberry, ginkgo, pagoda tree, zelkova, linden, pin oak, sycamore and honeylocust.', clue: 'Look at the dark stone standing beside each street tree.', source: { name: 'Dia Chelsea, Wikipedia', url: 'https://en.wikipedia.org/wiki/Dia_Chelsea' } }, { r: 1.4 });
    k.egg(v(GX, 6.4, GZ + GD / 2 + 1.0), { id: 'diachelsea-alcamo', title: 'The marble works in the middle', year: '2011', text: 'The middle of the three buildings was the Alcamo Marble Works, which Dia bought in June 2011 for $11.5 million and called a strategic purchase. It opened as a gallery in 2012 with Thomas Hirschhorn\'s Timeline: Work in Public Space. It sits between the buildings at 535 and 545 West 22nd Street.', clue: 'Find the middle of the three brick fronts.', source: { name: 'Dia Chelsea, Wikipedia', url: 'https://en.wikipedia.org/wiki/Dia_Chelsea' } }, { r: 1.6 });
    k.egg(v(GX + 8, 6.0, GZ + GD / 2 + 1.0), { id: 'diachelsea-serra', title: 'Where the ellipses first stood', year: '1997', text: 'Dia bought 545 West 22nd Street in 1992 and opened it in 1997 with Richard Serra\'s Torqued Ellipses, huge curved steel works that now stand at Dia Beacon. By 2011 the building was leased to Pace Gallery, and it came back to Dia in 2015 with a La Monte Young and Marian Zazeela show.', clue: 'Look at the end brick front of the three.', source: { name: 'Dia Chelsea, Wikipedia', url: 'https://en.wikipedia.org/wiki/Dia_Chelsea' } }, { r: 1.6 });
    k.egg(v(GX, 9.6, GZ + 5), { id: 'diachelsea-skylights', title: 'One storey, all daylight', year: '2021', text: 'Architecture Research Office joined the three buildings into 32,500 square feet, with about 20,000 square feet of exhibition space at street level. They kept the natural light of the single storey galleries by retaining the skylights, and designed three new brick facades as an ensemble of distinct but related buildings. Every artist in the first exhibitions was a woman, opening with Lucy Raven.', clue: 'Look straight up at the light coming through the roof.', source: { name: 'Dia Chelsea reopens to the public following two year renovation, Wallpaper', url: 'https://wallpaper.com/art/dia-chelsea-new-york-reopening' } }, { r: 1.8 });
    k.egg(v(11.4, 3.0, 20), { id: 'diachelsea-548', title: 'The first art museum in Chelsea', year: '1987', text: 'Across the street, the four storey brick warehouse at 548 West 22nd Street opened in October 1987 as the Dia Center for the Arts, the first art museum in Chelsea. For years Dia and the Kitchen were the only art institutions in the neighborhood. Attendance grew from about 16,000 a year to about 60,000, Dia closed it in 2004 citing crowds the building could not handle, and sold it in 2007 for $38.55 million.', clue: 'Look across the street at the brick building facing Dia.', source: { name: 'Dia Chelsea, Wikipedia', url: 'https://en.wikipedia.org/wiki/Dia_Chelsea' } }, { r: 1.6 });
    k.egg(v(11.4, 9.0, 18), { id: 'diachelsea-graham-roof', title: 'A mirror on the roof', year: '1991', text: 'From 1991 to 2004 the roof of 548 West 22nd Street held Dan Graham\'s Rooftop Urban Park Project. Its centerpiece was Two-Way Mirror Cylinder Inside Cube, a pavilion of one way glass, beside a shed for watching video art. It was taken apart when the building closed in 2004.', clue: 'Look up at the roofline of the building across the street.', source: { name: 'Dia Chelsea, Wikipedia', url: 'https://en.wikipedia.org/wiki/Dia_Chelsea' } }, { r: 1.6 });
    /* ---- 2026-11-24 (wave 6a): Dia built out ----
       Outside: the three fronts get their street numbers, stone sills, steel lintels and a parapet coping, industrial lamps
       over the loading doors, an art crate on a hand truck by the dock, a hydrant and the corner sign, and a ghost sign of
       the old marble works on the middle front (a Firefly plate, waiting). Inside: whitewashed brick lining on the bare
       brick, steel roof trusses in every bay, control joints in the poured floor, a boulder laid on the floor as a work.
       Models Poly Haven, CC0. One trick: LOOK UP painted on the floor stands up from the door. */
    {
      const FZ = GZ + GD / 2 + 0.62, coping = sc(k, 'diachelsea', 'basalt', 1.2, () => X.ashlar(0x8a8680, 356, 1), { roughness: 0.8, color: 0xc8c4bc }, 0x9a9690), fw = (GW + 2) / 3;
      for (let i = 0; i < 3; i++) { const cx = GX - (GW + 2) / 2 + fw * (i + 0.5), top = 9 + (i === 1 ? 0.8 : 0); k.box(fw + 0.1, 0.3, 0.9, cx, top + 0.15, FZ - 0.25, coping); hsign(k, ['535', '541', '545'][i], 1.0, 0.42, cx + fw / 2 - 1.0, 5.2, FZ + 0.02, 0, { fg: '#f4f2ec', bg: '#1a1c20', size: 0.62, font: 'W2 JetBrains Mono' }); }
      for (const dx of [-8, 8]) { k.box(4.8, 0.36, 0.5, GX + dx, 4.2, FZ + 0.12, steel); k.box(4.6, 0.12, 0.6, GX + dx, 0.06, FZ + 0.3, coping); }
      many(k, 'diachelsea/ph_industrial_wall_lamp', { height: 0.6 }, [[GX - 8, 4.55, FZ + 0.08, 0], [GX + 8, 4.55, FZ + 0.08, 0], [GX - 2.4, 5.6, FZ + 0.08, 0], [GX + 2.4, 5.6, FZ + 0.08, 0]]);
      for (const dx of [-8, 8]) k.point(GX + dx, 4.2, FZ + 0.8, 0xffe6c0, 5, 7);
      many(k, 'diachelsea/ph_wooden_crate_01', { width: 2.4 }, [[GX + 6.2, 0, FZ + 1.6, 0.1], [GX + 6.4, 0.98, FZ + 1.6, -0.06]]);
      many(k, 'diachelsea/ph_hand_truck', { height: 1.4 }, [[GX + 9.4, 0, FZ + 1.8, -0.5]]);
      many(k, 'diachelsea/ph_fire_hydrant', { height: 0.8 }, [[GX - 13.2, 0, FZ + 2.6, 0]]);
      k.keepOut.push({ x: GX + 6.3, z: FZ + 1.6, r: 1.4 }, { x: GX + 9.4, z: FZ + 1.8, r: 0.5 }, { x: GX - 13.2, z: FZ + 2.6, r: 0.4 });
      { const px = GX + 13.4, pz = FZ + 3.4; k.cyl(0.06, 3.6, px, 1.8, pz, k.flat(0x1e2a22, 0.6, 0.5), 0.06, 8); hsign(k, 'W 22 ST', 1.4, 0.28, px, 3.5, pz + 0.04, 0, { fg: '#ffffff', bg: '#1f5a3a', border: '#ffffff', size: 0.62 }); hsign(k, '11 AV', 1.4, 0.28, px + 0.04, 3.84, pz, PI / 2, { fg: '#ffffff', bg: '#1f5a3a', border: '#ffffff', size: 0.62 }); k.keepOut.push({ x: px, z: pz, r: 0.3 }); }
      fireflyPlate(k, 'assets/museum/tex/diachelsea/ff_alcamo_ghost_sign.webp', 6.6, 1.6, GX, 8.85, FZ + 0.03, 0, brickM);
      // inside: whitewashed lining, trusses, joints, the boulder
      for (const sx of [-1, 1]) k.box(0.1, 8.7, ID - 0.4, GX + sx * (IW / 2 + 0.15), 4.5, GZ, brickW);
      k.box(IW, 8.7, 0.1, GX, 4.5, GZ - ID / 2 - 0.15, brickW);
      { const chords: number[][] = [], posts: number[][] = []; for (let i = 0; i < 6; i++) { const z = GZ + GD / 2 - 5 - i * 10 + 4.6; chords.push([GX, 9.0, z], [GX, 10.4, z]); for (let x = -9; x <= 9; x += 1.5) posts.push([GX + x, 9.7, z]); }
        boxes(k, IW, 0.16, 0.2, steel, chords); boxes(k, 0.08, 1.4, 0.12, steel, posts); }
      { const j: number[][] = []; for (let z = GZ - ID / 2 + 4; z < GZ + ID / 2; z += 4) j.push([GX, 0.305, z]); boxes(k, IW - 0.2, 0.01, 0.025, k.flat(0x6a6660, 0, 0.9), j); k.box(0.025, 0.01, ID - 0.4, GX, 0.305, GZ, k.flat(0x6a6660, 0, 0.9)); }
      many(k, 'diachelsea/ph_boulder_01', { length: 3.6 }, [[GX - 5.2, 0.28, GZ - 1, 0.3]]); k.keepOut.push({ x: GX - 5.2, z: GZ - 1, r: 2.0 });
      k.spot(GX - 5.2, 8.6, GZ + 3, GX - 5.2, 0.8, GZ - 1, 0xfff6ea, 60, 0.45, 0.6, 14);
      hsign(k, 'DIA CHELSEA  ·  WEST 22ND STREET', 8, 0.4, GX, 6.2, GZ + GD / 2 - 0.02, PI, { fg: '#1a1c20', size: 0.5, font: 'W2 JetBrains Mono', lit: false });
      standUp(k, 'LOOK UP', '#2a2c30', GX, GZ + GD / 2 - 1.6, 3, 0.31, 0.55, 6, 4.4, 1.2); /* entrance pass: turned to the left of the ellipse */
      k.egg(v(GX - 3.2, 1.0, GZ + GD / 2 - 6.4), { id: 'diachelsea-look-up', title: 'Words that stand up', text: 'LOOK UP is painted on the poured floor so long and thin that it only reads upright from one spot by the door, an anamorphic picture of the kind painters have made since the Renaissance. It points at the reason the galleries are here: the skylights that the 2021 renovation kept over the single storey rooms.', clue: 'Stand just inside the door and look down the long gallery.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.4 });
    }
    /* ---- 2026-11-28 (entrance pass): the first view is an installation ----
       A torqued ellipse in weathering steel stands in the first bay, the kind of work the egg by the door remembers
       (Serra's Torqued Ellipses opened Dia's building here in 1997): two equal ellipses, the top one turned against the
       bottom, joined by straight lines, so the wall leans out on one side and in on the other. Built as that ruled
       surface, a plate 5 cm thick with a slot to look in, in a scanned rust (Poly Haven rust_coarse_01, CC0). Daylight
       falls from the first two skylights in soft shafts. The visitor now arrives inside the door. */
    {
      const corten = sc(k, 'diachelsea', 'corten', 2.0, () => X.steel(0x6a3a22, false, 357), { roughness: 0.9, metalness: 0.25, color: 0xd8c0b0, side: T.DoubleSide }, 0x5a3a28);
      const EX = GX, EZ = -1.6, A = 3.0, B = 2.2, EH = 4.0, TW = 0.75, TH = 0.05, GAP = 0.32, G0 = 1.95, N = 140, R = 4;
      const P = (t: number, f: number, inset: number) => { const bx = (A - inset) * Math.cos(t), bz = (B - inset) * Math.sin(t), c = Math.cos(TW), s = Math.sin(TW); return [bx + (bx * c - bz * s - bx) * f, f * EH, bz + (bx * s + bz * c - bz) * f]; };
      const pos: number[] = [], uv: number[] = [], idx: number[] = [], span = PI * 2 - GAP, per = PI * (3 * (A + B) - Math.sqrt((3 * A + B) * (A + 3 * B)));
      const sheet = (inset: number) => { const o = pos.length / 3; for (let i = 0; i <= N; i++) { const t = G0 + GAP / 2 + (span * i) / N; for (let j = 0; j <= R; j++) { pos.push(...P(t, j / R, inset)); uv.push(((per * i) / N) * 0.5, (EH * j) / R * 0.5); } } for (let i = 0; i < N; i++) for (let j = 0; j < R; j++) { const a = o + i * (R + 1) + j, b = a + R + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); } };
      sheet(0); sheet(TH);
      { const o = pos.length / 3; for (let i = 0; i <= N; i++) { const t = G0 + GAP / 2 + (span * i) / N; pos.push(...P(t, 1, 0), ...P(t, 1, TH)); uv.push(i * 0.02, 0, i * 0.02, 0.03); } for (let i = 0; i < N; i++) { const a = o + i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
      for (const t of [G0 + GAP / 2, G0 + GAP / 2 + span]) { const o = pos.length / 3; pos.push(...P(t, 0, 0), ...P(t, 0, TH), ...P(t, 1, 0), ...P(t, 1, TH)); uv.push(0, 0, 0.03, 0, 0, 2, 0.03, 2); idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      k.mesh(g, corten, EX, 0.3, EZ, true);
      k.keepOut.push({ x: EX, z: EZ, r: 3.2 });
      k.spot(GX + 4, 8.8, 5, EX, 1.6, EZ, 0xfff2e0, 70, 0.5, 0.7, 18);
      k.spot(GX - 5, 8.8, -7, EX, 2.0, EZ, 0xf4f6ff, 40, 0.5, 0.7, 16);
      if (HAS_DOM) {
        const ray = paintTex(256, 512, (c, w, h) => { for (let x = 0; x < w; x += 2) { const a = 0.35 + 0.65 * Math.abs(Math.sin(x * 0.11) * Math.sin(x * 0.037 + 1)), edge = Math.min(1, x / 40, (w - x) / 40); const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, `rgba(255,248,236,${0.9 * a * edge})`); gr.addColorStop(0.55, `rgba(255,248,236,${0.32 * a * edge})`); gr.addColorStop(1, 'rgba(255,248,236,0)'); c.fillStyle = gr; c.fillRect(x, 0, 2, h); } });
        const shaft = new T.MeshBasicMaterial({ map: ray, transparent: true, opacity: 0.12, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false });
        for (const [z, x, w] of [[GZ + ID / 2 - 5, GX - 2, 12], [GZ + ID / 2 - 15, GX + 1.5, 14], [GZ + ID / 2 - 8.5, GX + 5, 6]] as const) { const o = k.mesh(new T.PlaneGeometry(w, 8.8), shaft, x, 4.75, z, true); o.rotation.x = -0.28; o.renderOrder = 3; o.castShadow = false; o.userData.noShadow = true; }
      }
    }
    donorWall(k, GX, 4.4, GZ - ID / 2 + 0.36, 0, 9, true);
    k.crowd([v(GX - 8, 0.15, GZ + 24), v(GX + 6, 0.15, GZ + 6), v(GX - 6, 0.15, GZ - 8), v(GX + 4, 0.15, GZ - 24)], 12, { seed: 142, speed: 0.3, spread: 2, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da] });
    k.censusWall({ x: GX + IW / 2 - 0.36, y: 4.4, z: GZ - 18, rotY: -PI / 2, cols: 30, rows: 6, tile: 0.5, gap: 0.05, start: ctx.wallStart(1100, 180), pieces: ctx.all, backing: dark });
    // the works: few and large, on the long walls and both faces of the two cross walls
    const mounts: Mount[] = [];
    for (let i = 0; i < 4; i++) { const z = GZ + 22 - i * 14; mounts.push({ position: v(GX - IW / 2 + 0.38, 3.4, z), rotation: PI / 2, target: v(i ? GX : GX - 4.5, 2.6, z), width: 6.4, height: 3.6, style: 'none', wash: true }); }
    for (let i = 0; i < 2; i++) { const z = GZ + 20 - i * 14 - 6; mounts.push({ position: v(GX + IW / 2 - 0.38, 3.4, z), rotation: -PI / 2, target: v(i ? GX : GX + 4.5, 2.6, z), width: 6.4, height: 3.6, style: 'none', wash: true }); }
    for (const z of [GZ + 10, GZ - 10]) for (const s of [-1, 1]) mounts.push({ position: v(GX, 2.8, z + s * 0.22), rotation: s > 0 ? 0 : PI, target: v(GX, 2.6, z + s * (z === GZ + 10 && s > 0 ? 4.4 : 8)), width: 5.6, height: 3.2, style: 'none', wash: true });
    for (const x of [-6, 6]) mounts.push({ position: v(GX + x, 3.4, GZ - ID / 2 + 0.38), rotation: 0, target: v(GX + x, 2.6, GZ - ID / 2 + 5), width: 5, height: 3, style: 'none', wash: true });
    /* entrance pass (2026-11-28): the visitor used to arrive on the sidewalk facing the brick fronts through the street trees;
       now they arrive just inside the door, the long daylit gallery ahead and the torqued ellipse in its first bay */
    return { mounts, spawn: v(GX - 3.4, 3, 8.8), look: v(GX + 2.5, 3.0, -30), eye: 3, bounds: [GX - IW / 2 + 0.8, 10, GZ - ID / 2 + 1, 30], style: 'none' };
  },
};

/* ---------------- 104 THE GALLERY BLOCK ---------------- */
export const chelseablock: RoomDef = {
  id: 'chelseablock',
  name: 'Thursday openings on 24th',
  area: 'WEST 24TH STREET',
  mood: 'Six to eight, plastic cups',
  color: '#f4f4f0',
  description: 'The block of white cubes between Tenth and Eleventh: garage doors rolled up, the crowds spilling onto the sidewalk with their wine, three galleries open in a row, the works inside each.',
  signatures: 'The low former garages turned galleries with roll up fronts, white cube interiors under fluorescent grids, the desks with the price lists, the crowd on the sidewalk at an opening, the High Line at the corner and the river at the end of the street.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x1a2446, horizon: 0x6a5a70, ground: 0x14141a, fog: 0.0024, stars: 200, env: 0.7 });
    k.hemi(0xd8e0ff, 0x1a1418, 0.55);
    /* 2026-11-24 (wave 6a): scanned CC0 surfaces (Poly Haven, 1k): white plaster for the cubes, garage floor concrete, painted brick */
    const white = sc(k, 'chelseablock', 'white', 2.0, () => X.plaster(0xf6f6f4, 180), { roughness: 0.9, color: 0xfafaf8, emissive: 0x34342f /* entrance pass: the cubes read grey from the street */ }, 0xf0f0ee), floorC = sc(k, 'chelseablock', 'floor', 3.0, () => X.concrete(0xb8b4ac, 181), { roughness: 0.4, color: 0xd0ccc4 }, 0xb8b4ac),
      brick = sc(k, 'chelseablock', 'brick', 2.4, () => X.brick(0x6a4a3a, 318), { roughness: 0.85, color: 0xb89080 }, 0x6a4a3a), glass = k.glass(0xdcecf6, 0.14, 0.04), dark = k.flat(0x1a1c20, 0.5, 0.6), steel = k.flat(0x8c98a4, 0.9, 0.3), tube = k.glow(0xf0f4ff), wood = k.pbr('cbDesk', X.planks(0xe8e0d0, 4, 319, 0.1), 1.0);
    street(k, { w: 16, len: 160, z: 0, x: 0 });
    blockFront(k, { x: 12, z0: 80, count: 14, face: -1, seed: 320, h: [10, 16] });
    k.water({ y: -1.6, color: 0x24405a, w: 300, d: 300, z: -190, amp: 0.8 });
    k.skyline({ z: -260, count: 20, spacing: 10, scale: 1.4, base: -1.6, seed: 321, lit: 0.4, glow: 0.9, tint: 0x3a3a48, rows: 1 });
    // three galleries in a row on the west side, doors rolled up, each a white cube of a different depth
    const galleries: [number, number, number, string][] = [[36, 16, 22, 'GALLERY ONE'], [8, 14, 26, 'GALLERY TWO'], [-22, 18, 20, 'GALLERY THREE']];
    const mounts: Mount[] = [];
    galleries.forEach(([z, w, d, name], gi) => {
      const x = -8 - d / 2;
      /* entrance pass (2026-11-28): the shell was one solid brick box whose street face covered the rolled up door, the
         GALLERY sign and the reception vinyl; now it is built as back, sides, roof and a lintel over the open door */
      k.box(0.6, 7, w + 1.2, x - d / 2 - 0.3, 3.5, z, brick); for (const s of [-1, 1]) k.box(d + 1.2, 7, 0.6, x, 3.5, z + s * (w / 2 + 0.3), brick);
      k.box(d + 0.45, 0.4, w + 1.2, x - 0.375, 6.8, z, brick); k.box(0.3, 0.4, w - 6, -8, 6.8, z, brick);
      k.box(d, 0.3, w, x, 0.15, z, floorC);
      for (const s of [-1, 1]) { k.box(d, 6, 0.3, x, 3, z + s * (w / 2 - 0.15), white); k.block(x - d / 2, x + d / 2, z + s * (w / 2 - 0.6), z + s * (w / 2 + 0.6)); }
      k.box(0.3, 6, w, x - d / 2 + 0.15, 3, z, white); k.block(x - d / 2 - 0.6, x - d / 2 + 0.6, z - w / 2, z + w / 2);
      k.box(d, 0.4, w, x, 6, z, dark);
      for (let i = -d / 2 + 3; i < d / 2; i += 4) for (let j = -w / 2 + 3; j < w / 2; j += 4) { k.box(1.2, 0.08, 0.1, x + i, 5.85, z + j, tube); if ((i + j) % 8 === 0) k.point(x + i, 5.2, z + j, 0xf0f4ff, 10, 8); }
      k.box(0.3, 7, 3, -8, 3.5, z - w / 2 + 1.5, brick); k.box(0.3, 7, 3, -8, 3.5, z + w / 2 - 1.5, brick);
      /* entrance pass: the roll up header and its slats ran along x, ten metres out across the sidewalk; now along the door */ k.box(0.3, 0.6, w - 6, -8, 6.3, z, steel); for (let i = 0; i < 8; i++) k.box(0.04, 0.06, w - 6, -7.84, 6.0 - i * 0.04, z, dark);
      k.block(-8.6, -7.4, z - w / 2, z - w / 2 + 3); k.block(-8.6, -7.4, z + w / 2 - 3, z + w / 2);
      k.sign(name, w - 6, 0.6, -7.84, 6.7, z, '#f6f6f4', '#0d0d0d', 60, PI / 2);
      many(k, 'chelseablock/ph_metal_office_desk', { width: 2.2 }, [[x - d / 2 + 2, 0.3, z - w / 2 + 2, PI / 2]], (o) => tint(o, 0xf2f0ea, 0.5, 0.2)); /* wave 6a: the front desk is a real desk */ k.keepOut.push({ x: x - d / 2 + 2, z: z - w / 2 + 2, r: 1.5 });
      k.prop('rope_stanchion', -9.5, 0.15, z, { height: 1.0 });
      if (gi === 0) k.egg(v(-8, 5.6, z), { id: 'chelseablock-garage-doors', title: 'Why the galleries live in garages', text: 'Barbara Gladstone moved her gallery from SoHo to an empty garage building at 515 West 24th Street during the 1990s, part of the new community forming in Chelsea. She liked garages for their convenient doors, which make it easy to move big works in and out, and for their column free floors.', clue: 'Look up at the rolled up door over the entrance.', source: { name: 'Repurposed parking spaces and garages in New York City, Untapped New York', url: 'https://untappedcities.com/2013/07/23/repurposed-parking-spaces-garages-in-new-york-city-the-exley-antique-garage-barcade-the-park/3/' } }, { r: 1.6 });
      if (gi === 1) k.egg(v(x, 4.4, z), { id: 'chelseablock-gagosian-1999', title: 'A hangar for one sculpture', year: '1999', text: 'In September 1999 Gagosian moved from SoHo to West 24th Street, into a 25,000 square foot space designed by Richard Gluckman. That November Richard Serra showed his monumental sculpture Switch there, the kind of work only a room this size could hold. Gluckman also designed a second Gagosian on West 21st Street in 2006.', clue: 'Stand in the middle of the second white cube.', source: { name: 'Gagosian, Wikipedia', url: 'https://en.wikipedia.org/wiki/Gagosian_Gallery' } }, { r: 1.6 });
      if (gi === 2) k.egg(v(x - d / 2 + 2, 1.5, z - w / 2 + 2), { id: 'chelseablock-pioneers', title: 'Two pioneers on the block', year: '1987', text: 'When the Dia Center for the Arts opened on West 22nd Street in October 1987 it was the first art museum in Chelsea. Through the 1980s and early 1990s Dia and the Kitchen were the only arts institutions in the neighborhood, before the SoHo dealers followed them west.', clue: 'Find the front desk in the third gallery.', source: { name: 'Dia Chelsea, Wikipedia', url: 'https://en.wikipedia.org/wiki/Dia_Chelsea' } }, { r: 1.4 });
      const n = Math.floor((d - 4) / 4.4);
      for (const s of [-1, 1]) for (let i = 0; i < n; i++) { const wx = x - d / 2 + 3 + i * ((d - 4) / n) + 1; mounts.push({ position: v(wx, 3.0, z + s * (w / 2 - 0.32)), rotation: s > 0 ? PI : 0, target: v(wx, 2.6, gi ? z : z + s * 3.4) /* entrance pass: the first cube's middle is the mobile's */, width: 3.6, height: 2.4, style: gi === 1 ? 'none' : 'white', wash: true }); }
      mounts.push({ position: v(x - d / 2 + 0.32, 3.0, z), rotation: PI / 2 /* wave 6a: was turned to face the wall */, target: v(x, 2.6, z), width: Math.min(6, w - 4), height: 3.2, style: 'none', wash: true });
      k.crowd([v(x - d / 2 + 3, 0.15, z - w / 2 + 3), v(x + d / 2 - 3, 0.15, z), v(x - d / 2 + 3, 0.15, z + w / 2 - 3)], 10, { seed: 143 + gi, speed: 0.25, spread: 1.6, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a, 0x0d0d0d] });
    });
    k.crowd([v(-6, 0, 60), v(-6, 0, -40)], 40, { seed: 146, speed: 0.2, spread: 3, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0x0d0d0d, 0xe6e2da, 0x8a3a3a] });
    k.crowd([v(4, 0, 70), v(4, 0, -60)], 20, { seed: 147, speed: 0.9, spread: 2, animate: !ctx.reduced });
    for (const z of [60, 20, -20, -60]) for (const s of [-1, 1]) k.lamp(s * 9.5, z, 6, dark, 0xffd9a8, 24);
    /* ---- 2026-11-24 (wave 6a): the block built out ----
       The gaps between the galleries get their own garage fronts with real roll down shutters, wheatpaste poster walls
       (Firefly plates, waiting) and air conditioners; fluorescent troffers down the middle of every cube; a sculpture on a
       plinth in two of the cubes; an opening night table of wine on the sidewalk; reception vinyl by every door;
       a hydrant and bins across the street; the corner sign. Models Poly Haven, CC0. One trick: OPEN LATE painted on the
       floor of the second cube stands up from its door. */
    {
      for (const [z0, z1] of [[15.6, 27.4], [-13, 1]]) { const zc = (z0 + z1) / 2; k.box(0.6, 7.4, z1 - z0, -8.3, 3.7, zc, brick); k.block(-9, -7.6, z0, z1); }
      many(k, 'chelseablock/ph_rollershutter_door', { width: 4.2 }, [[-7.98, 0, 18.6, PI / 2], [-7.98, 0, -10, PI / 2]]);
      many(k, 'chelseablock/ph_exterior_aircon_unit', { width: 1.5 }, [[-7.8, 4.6, 18.6, PI / 2], [-7.8, 4.6, -10, PI / 2], [-7.8, 5.2, 46, PI / 2]]);
      fireflyPlate(k, 'assets/museum/tex/chelseablock/ff_wheatpaste_wall.webp', 4.4, 3.0, -7.97, 2.1, 24.4, PI / 2, brick);
      fireflyPlate(k, 'assets/museum/tex/chelseablock/ff_wheatpaste_wall.webp', 4.4, 3.0, -7.97, 2.1, -4.2, PI / 2, brick);
      galleries.forEach(([z, w, d], gi) => {
        const x = -8 - d / 2, at: number[][] = [];
        for (let i = -d / 2 + 2.5; i < d / 2 - 1; i += 4) at.push([x + i, 5.76, z, 0]);
        many(k, 'chelseablock/ph_mounted_fluorescent_lights', { width: 1.2 }, at);
        hsign(k, 'OPENING RECEPTION TONIGHT  ·  6 TO 8 PM', 3.4, 0.24, -7.66, 1.6, z + w / 2 - 1.5 + 0.0, PI / 2, { fg: '#0d0d0d', bg: '#f6f6f4', size: 0.5, font: 'W2 JetBrains Mono' });
        hsign(k, ['STUDIO PAINTINGS', 'SCULPTURE', 'NEW YORKERS'][gi], 2.6, 0.3, x - d / 2 + 0.17, 5.0, z, PI / 2, { fg: '#0d0d0d', size: 0.6, font: 'W2 Archivo Expanded', lit: false });
      });
      const plinth = k.flat(0xf6f6f4, 0, 0.85);
      k.box(1.4, 0.9, 1.4, -23.75, 0.75, 40, plinth); many(k, 'chelseablock/ph_concrete_cat_statue', { height: 1.1 }, [[-23.75, 1.2, 40, -PI / 2]]); k.keepOut.push({ x: -23.75, z: 40, r: 1.0 }); k.spot(-23.75, 5.4, 37, -23.75, 1.6, 40, 0xfff6ea, 40, 0.4, 0.6, 9);
      k.box(2.2, 0.5, 2.6, -21.3, 0.55, -17.6, plinth); many(k, 'chelseablock/ph_bronze_whale_statue', { length: 2.4 }, [[-21.3, 0.8, -17.6, 0.4]]); k.keepOut.push({ x: -21.3, z: -17.6, r: 1.5 }); k.spot(-21.3, 5.4, -21, -21.3, 1.2, -17.6, 0xfff6ea, 50, 0.4, 0.6, 9);
      // the opening: a table of wine on the sidewalk outside the first cube
      k.box(2.0, 0.9, 0.7, -6.4, 0.45, 29.4, k.flat(0xf4f4f0, 0, 0.8)); many(k, 'chelseablock/ph_wine_bottles_01', { width: 0.7 }, [[-6.4, 0.9, 29.3, PI / 2]]); many(k, 'chelseablock/ph_brass_goblets', { width: 0.45 }, [[-6.4, 0.9, 29.85, 0], [-6.4, 0.9, 28.8, 1.2]]);
      k.keepOut.push({ x: -6.4, z: 29.4, r: 1.1 }); k.point(-6.4, 2.4, 29.4, 0xffe2b8, 6, 5);
      // across the street: a hydrant, the bins, the corner sign
      many(k, 'chelseablock/ph_fire_hydrant', { height: 0.8 }, [[8.8, 0, 32, -PI / 2], [-7.2, 0, -48, PI / 2]]);
      many(k, 'chelseablock/ph_metal_trash_can', { width: 1.6 }, [[10.6, 0, -8, -PI / 2]]);
      k.keepOut.push({ x: 8.8, z: 32, r: 0.4 }, { x: -7.2, z: -48, r: 0.4 }, { x: 10.6, z: -8, r: 1.0 });
      { const px = 8.6, pz = 66; k.cyl(0.06, 3.6, px, 1.8, pz, k.flat(0x1e2a22, 0.6, 0.5), 0.06, 8); hsign(k, 'W 24 ST', 1.4, 0.28, px, 3.5, pz + 0.04, 0, { fg: '#ffffff', bg: '#1f5a3a', border: '#ffffff', size: 0.62 }); hsign(k, '10 AV', 1.4, 0.28, px + 0.04, 3.84, pz, PI / 2, { fg: '#ffffff', bg: '#1f5a3a', border: '#ffffff', size: 0.62 }); k.keepOut.push({ x: px, z: pz, r: 0.3 }); }
      standUp(k, 'OPEN LATE', '#111214', -9.6, 8, 3, 0.31, PI / 2, 7, 6, 1.2);
      k.egg(v(-14, 1.0, 8), { id: 'chelseablock-open-late', title: 'Letters on the floor', text: 'OPEN LATE is painted on the concrete stretched so long that it only stands up straight from the doorway of the second gallery. The trick is anamorphosis: a picture drawn for one viewpoint, distorted from every other.', clue: 'Stand in the doorway of the second gallery and look at the floor.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.4 });
    }
    /* ---- 2026-11-28 (entrance pass): the first view is the opening ----
       The visitor arrives across the street from GALLERY ONE. Its cube is the hero: a large hanging mobile turning slowly
       in the middle (the museum's own mobile model), two ceiling tracks of gallery spots (the museum's track_light model)
       raking the walls, the end wall lit, light from the door spilling across the sidewalk and the road, the show title in vinyl
       on the pier. Side wall works in this cube are now seen from beside their wall. */
    {
      const G1 = galleries[0], gz = G1[0], gw = G1[1], gd = G1[2], gx = -8 - gd / 2;
      k.prop('mobile', gx + 3.5, 1.8, gz, { height: 4.0, keepOut: 2.0 }).then((o) => { if (o && !ctx.reduced) k.ticks.push((t) => { o.rotation.y = t * 0.07; }); });
      k.spot(-9.5, 5.6, gz, gx + 3.5, 3.6, gz, 0xfff4e4, 70, 0.4, 0.6, 16);
      const rail = k.flat(0x1a1a1c, 0.6, 0.4);
      for (const s of [-1, 1]) { k.box(gd - 2, 0.06, 0.08, gx, 5.74, gz + s * 3.2, rail); for (let i = 0; i < 5; i++) k.prop('track_light', gx - gd / 2 + 3 + i * 4.2, 5.2, gz + s * 3.2, { height: 0.5, rotY: s > 0 ? 0 : PI }); }
      k.spot(gx + 2, 5.6, gz, gx - gd / 2 + 0.3, 3.0, gz, 0xfffaf0, 90, 0.45, 0.5, 20);
      const spill = new T.MeshBasicMaterial({ map: HAS_DOM ? X.pool() : null, color: 0xfff0d8, transparent: true, opacity: 0.5, blending: T.AdditiveBlending, depthWrite: false });
      { const o = k.mesh(new T.PlaneGeometry(16, 13), spill, -4.6, 0.03, gz, true); o.rotation.x = -PI / 2; o.renderOrder = 2; }
      k.point(-6.2, 3.4, gz, 0xfff2dc, 18, 14); for (const s of [-1, 1]) k.point(gx - 2, 4.6, gz + s * 3.5, 0xfbfaf6, 55, 18); k.point(gx - 7, 4.6, gz, 0xfbfaf6, 45, 16);
      // the steel canopy over the rolled door and the show title in vinyl on the brick
      hsign(k, 'NEW YORKERS  ·  THROUGH JANUARY', 2.6, 0.5, -7.83, 4.6, gz - gw / 2 + 1.5, PI / 2, { fg: '#0d0d0d', size: 0.5, font: 'W2 Archivo Expanded', lit: false });
    }
    eyeMonument(k, -6, 0, -46, PI, 4.2);
    // the High Line crosses 24th Street mid block on its steel bridge, planted on top
    k.box(48, 1.2, 8, -4, 8.2, -53, dark); k.box(48, 0.5, 0.5, -4, 9.0, -57, steel); k.box(48, 0.5, 0.5, -4, 9.0, -49, steel);
    k.box(46, 0.3, 6, -4, 8.95, -53, k.flat(0x4a6a3a, 0, 0.9));
    for (const x of [-10.6, 10.6]) for (const z of [-56, -50]) { k.box(0.6, 7.6, 0.6, x, 3.8, z, dark); k.keepOut.push({ x, z, r: 0.7 }); }
    k.egg(v(0, 7.2, -53), { id: 'chelseablock-high-line', title: 'The freight line overhead', text: 'The elevated freight line through West Chelsea fell out of use between the 1960s and 1980, and in the early 2000s it was turned into a park in the air, a rails to trails greenway. The zoning changes that came with it set off a construction boom in the neighborhood around the galleries.', clue: 'Look up at the steel bridge crossing the street.', source: { name: 'Chelsea, Manhattan, Wikipedia', url: 'https://en.wikipedia.org/wiki/Chelsea,_Manhattan' } }, { r: 1.8 });
    k.egg(v(-6, 2.2, 44), { id: 'chelseablock-gasoline-alley', title: 'Before the galleries: Gasoline Alley', text: 'West Chelsea was once known as Gasoline Alley, a manufacturing district of garages, warehouses and freight terminals. In the late 1990s galleries began leaving SoHo for it, pushed out by rising rents and upscale retailers who wanted the same large airy spaces. Today the neighborhood has more than 200 galleries, and part of West Chelsea became a historic district in 2008.', clue: 'Stand on the sidewalk between the first two galleries.', source: { name: 'Chelsea, Manhattan, Wikipedia', url: 'https://en.wikipedia.org/wiki/Chelsea,_Manhattan' } }, { r: 1.6 });
    k.egg(v(4, 1.2, -30), { id: 'chelseablock-sandy', title: 'When the river came in', year: '2012', text: 'In October 2012 Hurricane Sandy flooded the gallery district, which runs from about 18th to 29th Street between Tenth Avenue and the West Side Highway. Thousands of artworks were destroyed, and basement storage was hit hardest: one dealer on 27th Street lost hundreds of thousands of dollars of art. Some galleries could not reopen until the new year.', clue: 'Look down the street toward the river at the end of the block.', source: { name: 'Chelsea art galleries destroyed by Sandy, ABC7 New York', url: 'https://abc7ny.com/archive/8882764/' } }, { r: 1.6 });
    mlowBanner(k, -7.6, 4.4, 50, PI / 2, 2.6, true);
    blossomFlag(k, -7.6, 4.4, -36, PI / 2, 2.4, 5, 'electric');
    k.censusWall({ x: 7.66, y: 3.2, z: 0, rotY: -PI / 2, cols: 40, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(5800, 160), pieces: ctx.all, backing: dark });
    k.box(0.3, 5, 24, 7.9, 2.5, 0, dark);
    for (let i = 0; i < 3; i++) { const z = 56 - i * 56; k.box(0.3, 3.2, 4.6, 7.8, 2.2, z, dark); mounts.push({ position: v(7.62, 2.3, z), rotation: -PI / 2, target: v(0, 2.5, z), width: 4.2, height: 2.5, style: 'black', wash: false }); }
    /* entrance pass (2026-11-28): the visitor used to arrive mid street looking down the block at a brick side wall;
       now they arrive across the street from the first gallery, looking straight into the lit cube */
    return { mounts, spawn: v(5.6, 3, 30.5), look: v(-22, 2.9, 37.6), eye: 3, bounds: [-34, 7, -70, 70], style: 'white' };
  },
};

/* ---------------- 105 FOTOGRAFISKA ---------------- */
export const fotografiska: RoomDef = {
  id: 'fotografiska',
  name: 'The mission house',
  area: 'FOTOGRAFISKA',
  mood: 'Park Avenue South, after nine',
  color: '#8a4a5a',
  description: 'The Flemish Revival landmark at 22nd Street, six floors of limestone over a granite base, dark galleries where the photographs glow, the bar upstairs, the works lit like prints in the dark.',
  signatures: 'The 1894 Church Missions House in Indiana limestone over a granite ground floor, its corner tourelles running the full height, the second floor arcade and the round arched fifth floor, the black painted galleries with spot lit photographs, the wide stair, the restaurant and the bar upstairs.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x101426, horizon: 0x4a3a48, ground: 0x0a0a0e, fog: 0.0028, stars: 180, env: 0.55 });
    k.hemi(0xffd8c0, 0x14100c, 0.4);
    /* 2026-11-24 (wave 6a): scanned CC0 surfaces (Poly Haven, 1k): limestone blocks for the front, granite for the ground storey,
       plaster painted near black for the galleries, worn oak for their floors, herringbone parquet in the bar, dark marble on it */
    const brick = sc(k, 'fotografiska', 'lime', 3.0, () => X.ashlar(0xc9bfa8, 322, 3), { roughness: 0.85, color: 0xeee2cc }, 0xc9bfa8), terra = sc(k, 'fotografiska', 'lime', 3.0, () => X.ashlar(0xb89a7a, 323, 3), { roughness: 0.85, color: 0xd8b898 }, 0xb89a7a), black = sc(k, 'fotografiska', 'black', 2.0, () => X.plaster(0x141416, 182), { roughness: 0.95, color: 0x2a2a2c }, 0x141416),
      floorD = sc(k, 'fotografiska', 'floor', 2.0, () => X.planks(0x2a2420, 6, 324, 0.2), { roughness: 0.6, color: 0x6a5a4a }, 0x2a2420), glass = k.glass(0xffe0b0, 0.3, 0.1), warm = k.glow(0xffd8a0, 0.85), dark = k.flat(0x1a1c20, 0.5, 0.6), gold = k.pbr('ftGold', X.gilt(0xd0a852), 2, { metalness: 0.85, roughness: 0.3 });
    street(k, { w: 26, len: 160, z: 36, x: 0 });
    blockFront(k, { x: 50, z0: 130, count: 12, face: -1, seed: 325, h: [18, 40] });
    blockFront(k, { x: -50, z0: 130, count: 12, face: 1, seed: 326, h: [18, 40] });
    const BX = 0, BZ = -10, BW = 30, BD = 30, BH = 26;
    k.box(BW, BH, BD, BX, BH / 2, BZ, brick);
    k.moulding([[0, 0], [1.0, 0], [1.1, 0.3], [0.7, 0.5], [0.9, 0.9], [0, 1.1]], BW + 0.4, BX, BH - 0.6, BZ + BD / 2 + 0.05, terra, -PI / 2); /* wave 6a: unrotated it ran 30 m along z through the building */
    // granite ground storey, corner tourelles the full height with conical caps
    k.box(BW + 0.3, 4.2, BD + 0.3, BX, 2.1, BZ, sc(k, 'fotografiska', 'granite', 3.0, () => X.ashlar(0x8a8680, 355, 2), { roughness: 0.8, color: 0xb0aaa2 }, 0x8a8680));
    for (const sx of [-1, 1]) { k.cyl(1.5, BH + 1, BX + sx * (BW / 2 - 0.4), (BH + 1) / 2, BZ + BD / 2 - 0.4, brick, 1.5, 16); k.mesh(new T.ConeGeometry(1.7, 4, 16), k.flat(0x3a3e44, 0.3, 0.6), BX + sx * (BW / 2 - 0.4), BH + 3, BZ + BD / 2 - 0.4); k.keepOut.push({ x: BX + sx * (BW / 2 - 0.4), z: BZ + BD / 2 - 0.4, r: 1.8 }); }
    for (let f = 0; f < 6; f++) for (let i = 0; i < 5; i++) { const y = 3 + f * 4, x = BX - 10 + i * 5; if (f === 0) continue; if (f === 1) { k.arch(4.2, 3.6, 0.5, x, y - 1.6, BZ + BD / 2 + 0.05, terra, false, 0.6); k.box(3.8, 3.0, 0.06, x, y + 0.2, BZ + BD / 2 + 0.1, glass); continue; } if (f === 4) { k.arch(2.4, 3.6, 0.5, x, y - 1.2, BZ + BD / 2 + 0.05, terra, false, 0.75); k.box(2.0, 3.0, 0.06, x, y + 0.4, BZ + BD / 2 + 0.1, glass); } else { k.box(2.2, 2.8, 0.16, x, y, BZ + BD / 2 + 0.02, terra); k.box(1.8, 2.4, 0.06, x, y, BZ + BD / 2 + 0.1, f % 2 ? warm : k.flat(0x0a0a0c, 0, 0.9)); } }
    for (let i = 0; i < 4; i++) k.point(BX - 9 + i * 6, 2.2, BZ + BD / 2 + 2.5, 0xffc890, 30, 22);
    for (const x of [-16, 16]) { k.cyl(0.08, 5, x, 2.5, BZ + BD / 2 + 6, dark, 0.08, 8); k.sphere(0.3, x, 5.2, BZ + BD / 2 + 6, k.glow(0xffe0b0, 1.2)); k.point(x, 5.2, BZ + BD / 2 + 6, 0xffe0b0, 25, 20); }
    k.arch(3.2, 5, 3, BX, 0, BZ + BD / 2, terra, false, 0.85); k.block(-BW / 2, -1.8, BZ + BD / 2 - 0.6, BZ + BD / 2 + 0.6); k.block(1.8, BW / 2, BZ + BD / 2 - 0.6, BZ + BD / 2 + 0.6);
    k.sign('FOTOGRAFISKA  ·  NEW YORK', 8, 0.7, BX, 6.4, BZ + BD / 2 + 0.06, 'transparent', '#f0e4c8', 70, 0);
    k.egg(v(BX + BW / 2 - 0.4, 14, BZ + BD / 2 + 1.4), { id: 'fotografiska-steel', title: 'A steel frame in a stone coat', year: '1894', text: 'Behind the limestone is a self supporting steel superstructure filled with brick, with terracotta fireproofing and an elevator from the start. It predates the American Surety Building, usually called the first New York skyscraper with an all steel superstructure, by two years. The cornerstone was laid on October 3, 1892.', clue: 'Look up the round corner tower on the right.', source: { name: 'Church Missions House, Wikipedia', url: 'https://en.wikipedia.org/wiki/Church_Missions_House' } }, { r: 1.8 });
    k.egg(v(BX, 19.4, BZ + BD / 2 + 1.0), { id: 'fotografiska-haarlem', title: 'A Dutch town hall on Park Avenue South', text: 'The architects Robert W. Gibson and Edward J. Neville Stent drew on the town halls of Haarlem and medieval Amsterdam. The AIA Guide called the front equal to buildings of the Flemish and Dutch Renaissance. The round arched openings on the fifth floor suggest a medieval triforium, and the central gable carries a stone cross and a statue of St. Paul.', clue: 'Look up at the row of round arches near the top of the front.', source: { name: 'Church Missions House, Wikipedia', url: 'https://en.wikipedia.org/wiki/Church_Missions_House' } }, { r: 1.8 });
    k.egg(v(BX - 3, 2.2, BZ + BD / 2 + 2.4), { id: 'fotografiska-charity-row', title: 'Charity Row', text: 'The building was part of Charity Row, three blocks of charity headquarters. The New York Society for the Prevention of Cruelty to Children, the Xavier Society for the Blind, United Cerebral Palsy of New York City and the Russell Sage Foundation all had offices here. The Federation of Protestant Welfare Agencies bought it in 1963.', clue: 'Stand at the arched entrance on the avenue.', source: { name: 'Church Missions House, Wikipedia', url: 'https://en.wikipedia.org/wiki/Church_Missions_House' } }, { r: 1.6 });
    k.egg(v(BX + 3, 2.2, BZ + BD / 2 + 2.4), { id: 'fotografiska-281', title: 'They called it 281', year: '1935', text: 'Built for the Episcopal Church\'s Domestic and Foreign Missionary Society, the house was its headquarters for much of the 20th century and hosted the annual House of Bishops. Episcopalians simply called it 281, after the address. Women were first invited to the National Council\'s meetings here in 1935.', clue: 'Read the street number by the door.', source: { name: 'Church Missions House, Wikipedia', url: 'https://en.wikipedia.org/wiki/Church_Missions_House' } }, { r: 1.6 });
    mlowBanner(k, BX - 11, 12, BZ + BD / 2 + 0.6, 0, 3.0, true); blossomFlag(k, BX + 11, 12, BZ + BD / 2 + 0.6, 0, 2.6, 5, 'ink');
    // inside: two black galleries stacked, the stair, the prints spot lit, the bar level with arched windows
    const IW = BW - 1.2, ID = BD - 1.2;
    for (const [y, m] of [[0, black], [5, black], [10, black]] as const) { k.box(IW, 0.3, ID, BX, y + 0.15, BZ, y === 10 ? sc(k, 'fotografiska', 'bar', 1.6, () => X.planks(0x6a4a30, 6, 327), { roughness: 0.78, color: 0xa88870 }, 0x6a4a30) : floorD); k.box(IW, 0.4, ID, BX, y + 4.6, BZ, dark); for (const s of [-1, 1]) k.box(0.3, 4.6, ID, BX + s * (IW / 2 - 0.2), y + 2.3, BZ, m); k.box(IW, 4.6, 0.3, BX, y + 2.3, BZ - ID / 2 + 0.2, m); void m; }
    k.block(BX - IW / 2 - 0.6, BX - IW / 2 + 0.2, BZ - ID / 2, BZ + ID / 2); k.block(BX + IW / 2 - 0.2, BX + IW / 2 + 0.6, BZ - ID / 2, BZ + ID / 2); k.block(BX - IW / 2, BX + IW / 2, BZ - ID / 2 - 0.6, BZ - ID / 2 + 0.2);
    for (let f = 0; f < 2; f++) { const y0 = f * 5; for (let i = 0; i < 14; i++) k.box(2.4, 0.36, 0.9, BX + IW / 2 - 1.5, y0 + 0.18 + i * 0.36, BZ + ID / 2 - 1.5 - i * 0.9, floorD); }
    k.block(BX + IW / 2 - 2.8, BX + IW / 2 - 0.3, BZ - ID / 2, BZ + ID / 2 - 1);
    for (let f = 0; f < 2; f++) { const y0 = f * 5; k.box(0.3, 4, 8, BX - 2, y0 + 2.2, BZ - 2, black); k.block(BX - 2.4, BX - 1.6, BZ - 6, BZ + 2); }
    k.box(8, 1.1, 1.0, BX - 4, 10.7, BZ - ID / 2 + 3, sc(k, 'fotografiska', 'bartop', 1.4, () => X.marble(0x2a2a2e, 0x6a6a6e, 23), { roughness: 0.25, color: 0x5a5a5e }, 0x2a2a2e)); k.block(BX - 8, BX, BZ - ID / 2 + 2.4, BZ - ID / 2 + 3.6);
    for (let i = 0; i < 12; i++) k.cyl(0.05, 0.3, BX - 7.5 + i * 0.6, 11.4, BZ - ID / 2 + 3, [gold, k.flat(0x8a3a3a, 0, 0.5), glass][i % 3], 0.04, 8);
    for (let i = 0; i < 4; i++) { k.cyl(0.04, 0.7, BX + 4 + (i % 2) * 3, 10.5, BZ - 4 + Math.floor(i / 2) * 5, dark, 0.04, 6); k.cyl(0.4, 0.04, BX + 4 + (i % 2) * 3, 10.87, BZ - 4 + Math.floor(i / 2) * 5, k.flat(0x2a2a2e, 0.3, 0.5), 0.4, 14); k.keepOut.push({ x: BX + 4 + (i % 2) * 3, z: BZ - 4 + Math.floor(i / 2) * 5, r: 0.6 }); }
    for (let i = 0; i < 5; i++) k.point(BX - 10 + i * 5, 13, BZ + ID / 2 - 3, 0xffd8a0, 10, 8);
    k.egg(v(BX - 4, 12.2, BZ - ID / 2 + 3), { id: 'fotografiska-last-call', title: 'Last call on Park Avenue South', year: '2024', text: 'Fotografiska New York opened here in December 2019, with a 150 seat restaurant, Veronika, on the second floor that kept some of the old stained glass, and a bar in the former chapel. In 2024 the museum announced it would move to a larger space; the restaurant and the chapel bar closed in mid June, and the galleries closed on 29 September with Vivian Maier and Bruce Gilden on the walls.', clue: 'Lean on the bar upstairs.', source: { name: 'Fotografiska museum in New York is closing and relocating, The Art Newspaper', url: 'https://www.theartnewspaper.com/2024/05/24/fotografiska-museum-new-york-closing-relocating' } }, { r: 1.6 });
    k.egg(v(BX + 8, 2.4, BZ - 8), { id: 'fotografiska-delvey', title: 'The tenant who never was', text: 'Anna Sorokin, who called herself Anna Delvey, was a contender to lease this building for her proposed foundation. She was later indicted for fraud, and the building\'s fame grew again after the Netflix series Inventing Anna.', clue: 'Search the ground floor gallery, away from the stair.', source: { name: 'Church Missions House, Wikipedia', url: 'https://en.wikipedia.org/wiki/Church_Missions_House' } }, { r: 1.4 });
    eyeMedallion(k, BX + 6, 0.16, BZ + 3, 1.4); /* wave 6a: moved off the axis of the floor type at the door */
    /* ---- 2026-11-24 (wave 6a): the mission house built out ----
       Outside: string courses and sills across the limestone, a stepped Flemish gable over the centre, lanterns at the
       door, the corner sign and a hydrant. Inside: the open front of every floor closed with a wall (from inside the one
       sided limestone let the avenue show through), cameras in glass on plinths in the lobby, level signs on the stair, and
       the chapel bar: three chandeliers, stools along the bar, a back bar of bottles under gilt mirrors, a sofa and lounge
       chairs, lancet windows of stained glass (Firefly plates, waiting). Models Poly Haven, CC0. One trick: NO FLASH painted
       on the lobby floor stands up from the door. */
    {
      const FZ = BZ + BD / 2, gilt = gold;
      for (const y of [4.25, 8.4, 12.4, 16.4, 20.4]) k.box(BW + 0.2, 0.3, 0.4, BX, y, FZ + 0.15, terra);
      { const sills: number[][] = []; for (let f = 2; f < 6; f++) for (let i = 0; i < 5; i++) if (f !== 4) sills.push([BX - 10 + i * 5, 3 + f * 4 - 1.5, FZ + 0.2]); boxes(k, 2.5, 0.16, 0.36, terra, sills); }
      for (let i = 0; i < 4; i++) { const w = 12 - i * 3; k.box(w, 1.3, 0.8, BX, BH + 0.65 + i * 1.3, FZ - 0.3, brick); k.box(w + 0.3, 0.2, 1.0, BX, BH + 1.3 + i * 1.3, FZ - 0.3, terra); }
      k.box(0.3, 1.6, 0.3, BX, BH + 6.2, FZ - 0.3, terra); k.box(1.1, 0.3, 0.3, BX, BH + 6.4, FZ - 0.3, terra);
      many(k, 'fotografiska/ph_street_lamp_02', { height: 1.2 }, [[BX - 2.9, 3.0, FZ + 0.05, 0], [BX + 2.9, 3.0, FZ + 0.05, 0]]);
      for (const sx of [-1, 1]) k.point(BX + sx * 2.9, 3.4, FZ + 1.0, 0xffd8a0, 8, 8);
      hsign(k, '281', 0.9, 0.36, BX + 2.6, 1.6, FZ + 0.06, 0, { fg: '#f0e4c8', bg: '#1a1410', size: 0.66, font: 'W2 JetBrains Mono' });
      many(k, 'fotografiska/ph_fire_hydrant', { height: 0.8 }, [[BX + 9, 0, FZ + 4.2, 0]]); k.keepOut.push({ x: BX + 9, z: FZ + 4.2, r: 0.4 });
      { const px = BX + 15.6, pz = FZ + 5; k.cyl(0.06, 3.6, px, 1.8, pz, k.flat(0x1e2a22, 0.6, 0.5), 0.06, 8); hsign(k, 'PARK AV S', 1.6, 0.28, px, 3.5, pz + 0.04, 0, { fg: '#ffffff', bg: '#1f5a3a', border: '#ffffff', size: 0.6 }); hsign(k, 'E 22 ST', 1.4, 0.28, px + 0.04, 3.84, pz, PI / 2, { fg: '#ffffff', bg: '#1f5a3a', border: '#ffffff', size: 0.62 }); k.keepOut.push({ x: px, z: pz, r: 0.3 }); }
      // the open fronts closed: the ground floor keeps its door, the floors above their dark arcade
      const IZ = BZ + ID / 2 - 0.2;
      k.box(IW / 2 - 1.8, 4.6, 0.3, BX - (IW / 4 + 0.9), 2.3, IZ, black); k.box(IW / 2 - 1.8, 4.6, 0.3, BX + (IW / 4 + 0.9), 2.3, IZ, black); k.box(3.6, 1.2, 0.3, BX, 4.0, IZ, black);
      for (const y of [5, 10]) k.box(IW, 4.6, 0.3, BX, y + 2.3, IZ, black);
      // the lobby: cameras in glass on plinths
      const plinth = k.flat(0x101012, 0.2, 0.6), case_ = k.glass(0xeef4f8, 0.12, 0.04);
      for (const [x, z] of [[7, -1], [7, -4.6], [9.6, -2.8]]) { k.box(0.8, 1.1, 0.8, BX + x, 0.85, BZ + z + 10 - 10, plinth); k.box(0.78, 0.7, 0.78, BX + x, 1.75, BZ + z + 10 - 10, case_); k.keepOut.push({ x: BX + x, z: BZ + z, r: 0.6 }); k.spot(BX + x, 4.2, BZ + z + 1.2, BX + x, 1.5, BZ + z, 0xfff0d8, 20, 0.3, 0.5, 6); }
      many(k, 'fotografiska/ph_Camera_01', { width: 0.42 }, [[BX + 7, 1.4, BZ - 1, 0.5]]);
      many(k, 'fotografiska/ph_vintage_video_camera', { height: 0.4 }, [[BX + 7, 1.4, BZ - 4.6, -0.6]]);
      many(k, 'fotografiska/ph_filmstrip_projector_8mm', { length: 0.6 }, [[BX + 9.6, 1.4, BZ - 2.8, PI / 2]]);
      hsign(k, 'GALLERIES  ·  LEVEL 2', 2.6, 0.3, BX + IW / 2 - 0.36, 3.6, BZ + ID / 2 - 3, -PI / 2, { fg: '#f0e4c8', size: 0.55, font: 'W2 JetBrains Mono', lit: true });
      hsign(k, 'THE BAR  ·  LEVEL 3', 2.6, 0.3, BX + IW / 2 - 0.36, 8.6, BZ - 4, -PI / 2, { fg: '#f0e4c8', size: 0.55, font: 'W2 JetBrains Mono', lit: true });
      // the chapel bar
      const BY = 10.3, bz = BZ - ID / 2 + 3;
      many(k, 'fotografiska/ph_Chandelier_03', { height: 1.3 }, [[BX - 6, 13.0, BZ - 6, 0], [BX, 13.0, BZ - 6, 0], [BX + 6, 13.0, BZ - 6, 0]], (o) => tint(o, 0xc8a050, 0.35, 0.85));
      for (const x of [-6, 0, 6]) { k.cyl(0.02, 0.4, BX + x, 14.25, BZ - 6, dark, 0.02, 5); k.point(BX + x, 13.2, BZ - 6, 0xffcf90, 10, 10); }
      { const at: number[][] = []; for (let i = 0; i < 7; i++) at.push([BX - 7.2 + i * 1.1, BY, bz + 1.05, PI]); many(k, 'fotografiska/ph_bar_chair_round_01', { height: 0.95 }, at, (o) => tint(o, 0x6a4a30, 0.5, 0.3)); }
      k.box(8, 0.06, 0.4, BX - 4, 11.5, BZ - ID / 2 + 0.6, gilt); k.box(8, 0.06, 0.4, BX - 4, 12.2, BZ - ID / 2 + 0.6, gilt);
      many(k, 'fotografiska/ph_wine_bottles_01', { width: 0.68 }, [[BX - 7, 11.53, BZ - ID / 2 + 0.6, 0], [BX - 5, 11.53, BZ - ID / 2 + 0.6, 0], [BX - 3, 12.23, BZ - ID / 2 + 0.6, 0], [BX - 1, 12.23, BZ - ID / 2 + 0.6, 0]]);
      many(k, 'fotografiska/ph_ornate_mirror_01', { height: 1.1 }, [[BX - 6.4, 12.4, BZ - ID / 2 + 0.38, 0], [BX - 4, 12.4, BZ - ID / 2 + 0.38, 0], [BX - 1.6, 12.4, BZ - ID / 2 + 0.38, 0]]);
      many(k, 'fotografiska/ph_sofa_02', { width: 2.2 }, [[BX + 8, BY, BZ + ID / 2 - 2.2, PI]], (o) => tint(o, 0x5a1e22, 0.8, 0));
      many(k, 'fotografiska/ph_mid_century_lounge_chair', { height: 1.0 }, [[BX + 5, BY, BZ + ID / 2 - 5, PI * 0.8], [BX + 11, BY, BZ + ID / 2 - 5, -PI * 0.8]]);
      k.keepOut.push({ x: BX + 8, z: BZ + ID / 2 - 2.2, r: 1.2 }, { x: BX + 5, z: BZ + ID / 2 - 5, r: 0.7 }, { x: BX + 11, z: BZ + ID / 2 - 5, r: 0.7 });
      for (const x of [-7, 0, 7]) { k.arch(2.2, 3.3, 0.2, BX + x, BY + 0.6, IZ - 0.16, gilt, false, 0.75); fireflyPlate(k, 'assets/museum/tex/fotografiska/ff_chapel_glass.webp', 1.8, 3.0, BX + x, BY + 2.15, IZ - 0.17, PI, k.glow(0x6a3a2a, 0.9), true); }
      standUp(k, 'NO FLASH', '#e8dcc0', BX, BZ + ID / 2 - 0.8, 3, 0.31, 0, 6, 5, 1.1);
      k.egg(v(BX, 1.0, BZ + ID / 2 - 4.6), { id: 'fotografiska-no-flash', title: 'A sign painted flat', text: 'NO FLASH is painted on the lobby floor stretched so long that it only stands up as a sign from the doorway. It is anamorphosis, a picture distorted so it comes right from one viewpoint.', clue: 'Stand in the doorway and look at the floor ahead.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.4 });
    }
    donorWall(k, BX, 3.0, BZ - ID / 2 + 0.38, 0, 9, false);
    k.crowd([v(2, 0, 30), v(BX + 4, 0.15, BZ + 6), v(BX - 8, 0.15, BZ - 2), v(BX + 4, 0.15, BZ - 10)], 12, { seed: 148, speed: 0.3, spread: 1.8, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0x0d0d0d, 0x8a3a3a] });
    k.crowd([v(BX - 8, 10.15, BZ + 8), v(BX + 8, 10.15, BZ - 6)], 8, { seed: 149, speed: 0.25, spread: 1.6, animate: !ctx.reduced });
    k.censusWall({ x: BX - IW / 2 + 0.38, y: 7.4, z: BZ, rotY: PI / 2, cols: 30, rows: 4, tile: 0.5, gap: 0.05, start: ctx.wallStart(2700, 120), pieces: ctx.all, backing: dark });
    // the works: spot lit in the dark on every wall of both galleries, each with its own spot
    const mounts: Mount[] = [];
    for (let f = 0; f < 2; f++) { const y = f * 5 + 2.6; for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = BZ - 10 + i * 6.5; if (s > 0 && z > BZ) continue; mounts.push({ position: v(BX + s * (IW / 2 - 0.38), y, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(BX, y - 0.4, z), width: 3.0, height: 2.0, style: 'black', wash: false }); k.spot(BX + s * (IW / 2 - 4), y + 2.0, z, BX + s * (IW / 2 - 0.4), y, z, 0xfff0d8, 40, 0.5, 0.6, 8); } for (const x of [-9, -3, 3, 9]) { mounts.push({ position: v(BX + x, y, BZ - ID / 2 + 0.38), rotation: 0, target: v(BX + x, y - 0.4, BZ), width: 3.0, height: 2.0, style: 'black', wash: false }); k.spot(BX + x, y + 2.0, BZ - ID / 2 + 4, BX + x, y, BZ - ID / 2 + 0.4, 0xfff0d8, 40, 0.5, 0.6, 8); } for (const s of [-1, 1]) mounts.push({ position: v(BX - 2 + s * 0.22, y, BZ - 2), rotation: s < 0 ? -PI / 2 : PI / 2, target: v(BX - 2 + s * 5, y - 0.4, BZ - 2), width: 3.2, height: 2.2, style: 'black', wash: false }); }
    return { mounts, spawn: v(-4, 3, 28), look: v(BX, 12, BZ + BD / 2), eye: 3, bounds: [BX - IW / 2 + 0.8, IW / 2 - 0.8, BZ - ID / 2 + 1, 40], style: 'black', floorY: (x, z) => { for (const f of [0, 1]) { const y0 = f * 5; if (x > BX + IW / 2 - 2.8 && x < BX + IW / 2 - 0.3 && z < BZ + ID / 2 - 1 && z > BZ + ID / 2 - 14) { const t = (BZ + ID / 2 - 1 - z) / 13; if (f === 0 && t <= 1) return t * 5; } } if (x > BX + IW / 2 - 2.8 && x < BX + IW / 2 - 0.3 && z <= BZ + ID / 2 - 14 && z > BZ + ID / 2 - 27) { const t = (BZ + ID / 2 - 14 - z) / 13; return 5 + Math.min(1, t) * 5; } if (x > BX + IW / 2 - 2.8 && x < BX + IW / 2 - 0.3 && z <= BZ + ID / 2 - 27) return 10.15; return 0; } };
  },
};

/* ---------------- 106 MOMA PS1 ---------------- */
export const ps1: RoomDef = {
  id: 'ps1',
  name: 'The old school',
  area: 'MOMA PS1',
  mood: 'Warm Up Saturday',
  color: '#c8a888',
  description: 'The Romanesque public school in Long Island City, the concrete courtyard with its summer stage and the crowd, the classrooms turned galleries down long corridors, the boiler room, the works in the old school\'s bones.',
  signatures: 'The Victorian brick schoolhouse with its tower, the walled concrete courtyard with the summer installation and DJ stage, the long corridors of classrooms with their original wood and radiators, the sky room with the roof cut open.',
  build(k, ctx) {
    k.sky({ top: 0x5f94d8, horizon: 0xf0e8dc, ground: 0x6a6660, fog: 0.002, sun: { az: 3.0, el: 0.85, color: 0xfff6e8, size: 12 }, env: 1.0 });
    k.hemi(0xf6f6ff, 0x5a5048, 0.95);
    k.sun(0xfff2dc, 2.4, 20, 80, 30, true, 100);
    /* 2026-11-24 (wave 6a): scanned CC0 surfaces (Poly Haven, 1k): red brick, worn concrete for the courtyard, old school floorboards,
       plastered walls, sandstone trim */
    const brick = sc(k, 'ps1', 'brick', 2.4, () => X.brick(0x8a4a3a, 328), { roughness: 0.85, color: 0xd8a890 }, 0x8a4a3a), conc = sc(k, 'ps1', 'conc', 3.0, () => X.concrete(0x9a948a, 183), { roughness: 0.85, color: 0xd0ccc4 }, 0x9a948a), floorW = sc(k, 'ps1', 'floor', 1.8, () => X.planks(0x8a6a48, 6, 329, 0.2), { roughness: 0.6, color: 0xc8a880 }, 0x8a6a48),
      white = sc(k, 'ps1', 'plaster', 2.0, () => X.plaster(0xf6f6f4, 184), { roughness: 0.9, color: 0xf2efe8 }, 0xe8e4dc), dark = k.flat(0x1a1c20, 0.5, 0.6), glass = k.glass(0xdcecf6, 0.14, 0.04), steel = k.flat(0x8c98a4, 0.9, 0.3), pink = k.flat(0xf05aa0, 0, 0.7), radiator = k.flat(0xc8c0b0, 0.3, 0.6);
    street(k, { w: 20, len: 160, z: 46, x: 0 });
    blockFront(k, { x: 50, z0: 130, count: 10, face: -1, seed: 330, h: [10, 24] });
    for (const [x, z, w, h] of [[-70, -60, 30, 120], [60, -80, 34, 160]]) k.box(w as number, h as number, w as number, x as number, (h as number) / 2, z as number, k.pbr('licGlass', X.windows(74, 0.3, 0x6a88a0, false), 0.11, { emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.3, metalness: 0.5, stretch: 0.42 }));
    // the courtyard behind a concrete wall, the stage, the summer installation, the crowd
    const CX = 0, CZ = 10, CW = 50, CD = 34;
    k.box(CW, 0.4, CD, CX, -0.2, CZ, conc);
    for (const s of [-1, 1]) { k.box(0.6, 5, CD, CX + s * CW / 2, 2.5, CZ, conc); k.block(CX + s * CW / 2 - 0.6, CX + s * CW / 2 + 0.6, CZ - CD / 2, CZ + CD / 2); }
    for (const s of [-1, 1]) k.box(CW / 2 - 2.4, 5, 0.6, CX + s * (CW / 4 + 1.2), 2.5, CZ + CD / 2, conc); k.box(4.8, 1.4, 0.6, CX, 4.3, CZ + CD / 2, conc); k.block(CX - CW / 2, CX - 2.4, CZ + CD / 2 - 0.6, CZ + CD / 2 + 0.6); k.block(CX + 2.4, CX + CW / 2, CZ + CD / 2 - 0.6, CZ + CD / 2 + 0.6);
    // Eric Orr, Wall Slits, 1998: three vertical slits in the courtyard wall facing Jackson Avenue
    for (const x of [10.6, 11.5, 12.4]) k.box(0.14, 3.4, 0.7, CX + x, 2.3, CZ + CD / 2, dark);
    k.egg(v(CX + 11.5, 2.6, CZ + CD / 2 + 0.8), { id: 'ps1-wall-slits', title: 'Three cuts in the wall', year: '1998', text: 'The three narrow vertical slits in the courtyard wall facing Jackson Avenue are an artwork: Eric Orr\'s Wall Slits of 1998, meant to open the closed courtyard to the street. Most people walk past them on the way to the gate.', clue: 'Look along the outside of the courtyard wall, right of the gate.', source: { name: 'Artist Interventions, MoMA PS1', url: 'https://www.momaps1.org/programs/85-artist-interventions' } }, { r: 1.6 });
    k.box(16, 1.0, 8, CX + 12, 0.5, CZ - 8, dark); k.block(CX + 4, CX + 20, CZ - 12, CZ - 4);
    k.box(2.4, 0.9, 0.9, CX + 12, 1.45, CZ - 8, dark); for (const dx of [-3, 3]) k.box(1.0, 1.6, 0.8, CX + 12 + dx, 1.8, CZ - 8.4, dark);
    for (let i = 0; i < 5; i++) { const a = (i / 5) * PI * 2; const x = CX - 12 + Math.cos(a) * 6, z = CZ + 4 + Math.sin(a) * 6; k.beam(v(x, 0, z), v(CX - 12, 9, CZ + 4), 0.08, steel, 4); }
    const canopy = k.mesh(new T.ConeGeometry(9, 4, 5, 1, true), pink, CX - 12, 8, CZ + 4); canopy.rotation.x = PI; void canopy;
    if (!ctx.reduced) k.ticks.push((t) => { canopy.rotation.y = t * 0.1; canopy.scale.setScalar(1 + 0.03 * Math.sin(t)); });
    for (let i = 0; i < 6; i++) { const x = CX - 22 + i * 3, z = CZ + 12; k.cyl(0.05, 0.7, x, 0.35, z, steel, 0.05, 8); k.cyl(0.4, 0.04, x, 0.72, z, dark, 0.4, 14); k.keepOut.push({ x, z, r: 0.6 }); }
    eyeMonument(k, CX + 18, 0, CZ + 10, PI * 1.25, 4.6);
    blossomGarden(k, CX - 12, 0, CZ + 4, 4.4, 1.6);
    k.crowd([v(CX - 20, 0, CZ + 14), v(CX - 6, 0, CZ - 2), v(CX + 8, 0, CZ + 4), v(CX + 20, 0, CZ + 12)], 40, { seed: 150, speed: 0.3, spread: 3, animate: !ctx.reduced, closed: true, colors: [0xf08a2a, 0xf1c531, 0x3aa06a, 0xd83a6a, 0x24262c, 0xf4f0e8, 0x8a3ad8, 0x3a8ad8] });
    // the school: the brick block with its tower, the corridor of classrooms, the boiler room below
    const SX = 0, SZ = -30, SW = 50, SD = 30, SH = 18;
    k.box(SW, SH, SD, SX, SH / 2, SZ, brick);
    k.box(8, 10, 8, SX + SW / 2 - 6, SH + 5, SZ + SD / 2 - 6, brick); k.mesh(new T.ConeGeometry(6, 5, 4), k.pbr('psSlate', X.steel(0x3a3a40, false, 331), 0.4), SX + SW / 2 - 6, SH + 12.5, SZ + SD / 2 - 6).rotation.y = PI / 4;
    for (let f = 0; f < 3; f++) for (let i = 0; i < 10; i++) { const y = 3.6 + f * 5.2, x = SX - 22 + i * 4.8; k.arch(1.8, 3.6, 0.4, x, y - 1.8, SZ + SD / 2 + 0.05, sc(k, 'ps1', 'stone', 2.4, () => X.ashlar(0xb8a890, 332, 3), { roughness: 0.85, color: 0xe0d0b8 }, 0xb8a890), false, 0.7); k.box(1.4, 3, 0.06, x, y, SZ + SD / 2 + 0.1, glass); }
    k.arch(3, 4.6, 2, SX, 0, SZ + SD / 2, sc(k, 'ps1', 'stone', 2.4, () => X.ashlar(0xb8a890, 332, 3), { roughness: 0.85, color: 0xe0d0b8 }, 0xb8a890), false, 0.85); k.block(SX - SW / 2, SX - 1.8, SZ + SD / 2 - 0.6, SZ + SD / 2 + 0.6); k.block(SX + 1.8, SX + SW / 2, SZ + SD / 2 - 0.6, SZ + SD / 2 + 0.6);
    k.sign('PUBLIC SCHOOL 1  ·  1892  ·  MOMA PS1', 10, 0.7, SX, 16, SZ + SD / 2 + 0.06, 'transparent', '#e8dcc0', 70, 0);
    k.egg(v(SX, 2.8, SZ + SD / 2 + 1.0), { id: 'ps1-weiner-doors', title: 'Words on the front door', year: '1976', text: 'The text on the glass of the entrance doors is Lawrence Weiner\'s A bit of matter and a little bit more., first placed on the entrance and the back door in 1976 for the opening of the art center. After the 1997 renovation it was recreated on the front door windows. The art center opened in 1976 in a public school building from 1892.', clue: 'Read the glass of the front doors before you go in.', source: { name: 'Artist Interventions, MoMA PS1', url: 'https://www.momaps1.org/programs/85-artist-interventions' } }, { r: 1.4 });
    mlowBanner(k, SX - 16, 9, SZ + SD / 2 + 0.6, 0, 3.2, true); blossomFlag(k, SX + 16, 9, SZ + SD / 2 + 0.6, 0, 2.8, 5, 'electric');
    const HW = 4, HZ = SZ;
    k.box(HW, 0.3, SD - 1.2, SX, 0.15, HZ, floorW);
    const rooms: [number, number][] = [[-1, -4], [1, -4], [-1, 4], [1, 4], [-1, 12], [1, 12]];
    const mounts: Mount[] = [];
    rooms.forEach(([sx, dz], i) => { const rx = SX + sx * (HW / 2 + 5), rz = HZ - dz + 0; const rw = 10, rd = 7; k.box(rw, 0.3, rd, rx, 0.15, rz, floorW); k.box(rw, 0.4, rd, rx, 4.6, rz, dark); for (const s of [-1, 1]) { k.box(rw, 4.6, 0.3, rx, 2.3, rz + s * (rd / 2 - 0.15), i % 2 ? white : sc(k, 'ps1', 'plaster', 2.0, () => X.plaster(0x8a9a7a, 185), { roughness: 0.9, color: 0xa8b898 }, 0x8a9a7a)); k.block(rx - rw / 2, rx + rw / 2, rz + s * (rd / 2 - 0.4), rz + s * (rd / 2 + 0.4)); } k.box(0.3, 4.6, rd, rx + sx * (rw / 2 - 0.15), 2.3, rz, white); k.block(rx + sx * (rw / 2 - 0.4), rx + sx * (rw / 2 + 0.4), rz - rd / 2, rz + rd / 2); k.box(0.3, 4.6, 2, rx - sx * (rw / 2 - 0.15), 2.3, rz - rd / 2 + 1, white); k.box(0.3, 4.6, 2, rx - sx * (rw / 2 - 0.15), 2.3, rz + rd / 2 - 1, white); k.block(rx - sx * (rw / 2 + 0.4), rx - sx * (rw / 2 - 0.4), rz - rd / 2, rz - rd / 2 + 2); k.block(rx - sx * (rw / 2 + 0.4), rx - sx * (rw / 2 - 0.4), rz + rd / 2 - 2, rz + rd / 2); k.box(1.4, 0.8, 0.3, rx + sx * (rw / 2 - 0.4), 0.55, rz, radiator); k.point(rx, 4, rz, 0xfff4e8, 16, 10); k.box(1.2, 1.0, 0.1, rx + sx * (rw / 2 - 0.2), 2.6, rz - 2, glass); mounts.push({ position: v(rx + sx * (rw / 2 - 0.32), 2.6, rz + 1.5), rotation: sx < 0 ? PI / 2 : -PI / 2, target: v(rx, 2.4, rz + 1.5), width: 2.6, height: 1.8, style: 'white', wash: true }); for (const s of [-1, 1]) mounts.push({ position: v(rx, 2.6, rz + s * (rd / 2 - 0.32)), rotation: s > 0 ? PI : 0, target: v(rx, 2.4, rz), width: 4.4, height: 2.6, style: i % 2 ? 'white' : 'black', wash: true }); });
    /* wave 6a: the corridor walls ran solid past every classroom door; now they stop at each door, with an oak frame */
    { const z0 = HZ - (SD - 1.2) / 2, z1 = HZ + (SD - 1.2) / 2, gaps = [-42, -34, -26].map((z) => SZ - (-30 - z)), cuts: [number, number][] = []; let a = z0; for (const g of gaps) { cuts.push([a, g - 1.5]); a = g + 1.5; } cuts.push([a, z1]);
      for (const s of [-1, 1]) { for (const [p0, p1] of cuts) k.box(0.3, 4.6, p1 - p0, SX + s * HW / 2, 2.3, (p0 + p1) / 2, white); for (const g of gaps) { k.box(0.4, 0.3, 3.2, SX + s * HW / 2, 3.15, g, floorW); for (const e of [-1, 1]) k.box(0.4, 3.0, 0.12, SX + s * HW / 2, 1.6, g + e * 1.5, floorW); k.box(0.32, 1.6, 3.0, SX + s * HW / 2, 3.9, g, white); } } }
    k.box(1.6, 0.4, 1.6, -7, 4.5, HZ - 12, k.glow(0x9cc8f4, 1.0)); k.point(-7, 3.6, HZ - 12, 0xcfe4ff, 10, 6);
    k.egg(v(-7, 4.0, HZ - 12), { id: 'ps1-turrell-meeting', title: 'A classroom open to the sky', year: '1986', text: 'Upstairs on the third floor, James Turrell\'s Meeting cuts an opening in the ceiling of an old classroom so you sit and watch the sky. It was commissioned in 1976 and opened in 1986, and entered MoMA\'s collection in 2016. Its lights run on a program that times the sequence to the sun through the year.', clue: 'Look up at the pale square in the ceiling of a far classroom.', source: { name: 'Artist Interventions, MoMA PS1', url: 'https://www.momaps1.org/programs/85-artist-interventions' } }, { r: 1.4 });
    k.egg(v(-11.4, 1.8, HZ + 2.5), { id: 'ps1-saret-hole', title: 'A hole dug in the brick', year: '1976', text: 'Alan Saret\'s The Hole at P.S.1, Fifth Solar Chthonic Wall Temple is a carefully sized and shaped hole dug out of a brick wall on the third floor of the school. It dates from 1976, the year the art center opened, and the sunlight coming through it shapes the work.', clue: 'Search the outer brick wall of a classroom on the left.', source: { name: 'Artist Interventions, MoMA PS1', url: 'https://www.momaps1.org/programs/85-artist-interventions' } }, { r: 1.4 });
    k.egg(v(SX, 4.1, HZ), { id: 'ps1-exit-bulbs', title: 'Exit, on every bulb', year: '1976', text: 'Richard Artschwager painted the word Exit on each of the five bulbs lighting a ground floor corridor, a piece called Exit, Don\'t fight City Hall, made for the inaugural exhibition Rooms in 1976. His black oval blps also turn up in hallways and stairwells all over the building.', clue: 'Look up at the lights in the long corridor.', source: { name: 'Artist Interventions, MoMA PS1', url: 'https://www.momaps1.org/programs/85-artist-interventions' } }, { r: 1.6 });
    k.egg(v(SX + 1.0, 0.35, SZ + SD / 2 - 5), { id: 'ps1-rist-floor', title: 'A tiny video in the floor', year: '1994', text: 'Look down in the lobby: Pipilotti Rist\'s Selbstlos im Lavabad, Selfless in the Bath of Lava, is a small video embedded in a hole in the floor. Most visitors step right over it.', clue: 'Look at your feet just inside the front door.', source: { name: 'Artist Interventions, MoMA PS1', url: 'https://www.momaps1.org/programs/85-artist-interventions' } }, { r: 1.2 });
    k.box(HW, 0.4, SD - 1.2, SX, 4.6, HZ, dark); for (let z = -12; z <= 12; z += 6) k.point(SX, 4, HZ + z, 0xfff4e8, 12, 8);
    /* ---- 2026-11-24 (wave 6a): the old school built out ----
       Outside: a cornice, sandstone string courses and sills, quoins and chimneys on the schoolhouse; board formed
       concrete with its tie holes and a coping on the courtyard walls; monobloc chairs and bins in the courtyard, the DJ's
       boombox on the deck, a mural on the Jackson Avenue wall (a Firefly plate, waiting). Inside: oak dado and picture rail
       down the corridor, Artschwager's five bare bulbs hanging there, a classroom on each side set with old desks, chairs and
       a chalkboard, a clock in every room. Models Poly Haven, CC0. One trick: WARM UP painted on the courtyard floor stands
       up from the gate. */
    {
      const stoneT = sc(k, 'ps1', 'stone', 2.4, () => X.ashlar(0xb8a890, 332, 3), { roughness: 0.85, color: 0xe0d0b8 }, 0xb8a890), FZ = SZ + SD / 2;
      k.moulding(CORNICE, SW + 0.4, SX, SH - 0.6, FZ + 0.02, stoneT, -PI / 2);
      for (const y of [6.4, 11.6]) k.box(SW + 0.2, 0.3, 0.3, SX, y, FZ + 0.12, stoneT);
      { const q: number[][] = []; for (let y = 0.6; y < SH; y += 1.2) for (const sx of [-1, 1]) q.push([SX + sx * (SW / 2 - 0.5 - (Math.round(y / 1.2) % 2) * 0.3), y, FZ + 0.06]); boxes(k, 1.0 + 0.0, 0.55, 0.14, stoneT, q); }
      { const sills: number[][] = []; for (let f = 0; f < 3; f++) for (let i = 0; i < 10; i++) sills.push([SX - 22 + i * 4.8, 3.6 + f * 5.2 - 1.62, FZ + 0.2]); boxes(k, 1.9, 0.14, 0.34, stoneT, sills); }
      for (const x of [-18, -6, 10]) { k.box(1.4, 3.4, 1.0, SX + x, SH + 1.7, SZ - 4, brick); k.box(1.6, 0.25, 1.2, SX + x, SH + 3.5, SZ - 4, stoneT); }
      // board formed concrete: tie holes and a coping on the courtyard walls
      { const ties: number[][] = []; for (const s2 of [-1, 1]) for (let z = CZ - CD / 2 + 1; z < CZ + CD / 2; z += 1.2) for (const y of [1.2, 2.6, 4.0]) ties.push([CX + s2 * (CW / 2 - 0.31), y, z, PI / 2]);
        for (let x = -CW / 2 + 1; x < CW / 2; x += 1.2) { if (Math.abs(x) < 2.6) continue; for (const y of [1.2, 2.6, 4.0]) ties.push([CX + x, y, CZ + CD / 2 - 0.31, 0]); }
        boxes(k, 0.07, 0.07, 0.02, k.flat(0x4a4844, 0, 0.9), ties);
        for (const s2 of [-1, 1]) { k.box(0.8, 0.14, CD + 0.4, CX + s2 * CW / 2, 5.07, CZ, stoneT); k.box(CW / 2 - 2.2, 0.14, 0.8, CX + s2 * (CW / 4 + 1.1), 5.07, CZ + CD / 2, stoneT); } }
      { const ch: number[][] = []; for (let i = 0; i < 6; i++) ch.push([CX + 9 + (i % 3) * 1.8 + ((i * 7) % 3) * 0.12, 0, CZ - 2.4 + Math.floor(i / 3) * 1.6, PI + ((i * 5) % 7 - 3) * 0.08]); many(k, 'ps1/ph_plastic_monobloc_chair_01', { height: 0.88 }, ch); for (const c of ch) k.keepOut.push({ x: c[0], z: c[2], r: 0.4 }); }
      many(k, 'ps1/ph_boombox', { width: 0.9 }, [[CX + 12, 1.9, CZ - 8.1, 0]]);
      many(k, 'ps1/ph_metal_trash_can', { width: 1.5 }, [[CX - 23, 0, CZ - 4, PI / 2], [CX + 23, 0, CZ + 15, -PI / 2]]); k.keepOut.push({ x: CX - 23, z: CZ - 4, r: 0.9 }, { x: CX + 23, z: CZ + 15, r: 0.9 });
      fireflyPlate(k, 'assets/museum/tex/ps1/ff_jackson_ave_mural.webp', 16, 4.2, CX - 13.2, 2.5, CZ + CD / 2 + 0.32, 0, conc);
      hsign(k, 'WARM UP  ·  SATURDAYS  ·  COURTYARD', 7, 0.5, CX + 12, 3.4, CZ - 12.02, 0, { fg: '#f05aa0', bg: '#111214', size: 0.55, font: 'W2 Archivo Expanded' });
      // the corridor: dado, rail, the five bulbs
      { const z0 = HZ - (SD - 1.4) / 2, z1 = HZ + (SD - 1.4) / 2, runs: [number, number][] = []; let a0 = z0; for (const g of [-42, -34, -26]) { runs.push([a0, g - 1.62]); a0 = g + 1.62; } runs.push([a0, z1]);
        for (const sx of [-1, 1]) for (const [p0, p1] of runs) { const L = p1 - p0, zc = (p0 + p1) / 2, xx = SX + sx * (HW / 2 - 0.17); k.box(0.04, 1.1, L, xx, 0.85, zc, floorW); k.box(0.07, 0.08, L, xx, 1.42, zc, floorW); k.box(0.05, 0.06, L, xx, 3.3, zc, floorW); } }
      { const bz = [-40, -35, -30, -25, -20].map((z) => SZ + 30 + z); for (const z of bz) k.cyl(0.006, 0.5, SX, 4.15, z, dark, 0.006, 4); many(k, 'ps1/ph_lightbulb_01', { height: 0.22 }, bz.map((z) => [SX, 3.68, z, 0])); }
      // two classrooms set as classrooms, and a clock in every room
      const desks: number[][] = [], chairs: number[][] = [];
      for (const sx of [-1, 1]) { const rz = SZ - 4; for (const dx of [3.4, 5.4]) for (const dz of [-1.8, 0.4]) { desks.push([SX + sx * dx, 0.3, rz + dz, sx > 0 ? -PI / 2 : PI / 2]); chairs.push([SX + sx * (dx - 0.62), 0.3, rz + dz, sx > 0 ? -PI / 2 : PI / 2]); k.keepOut.push({ x: SX + sx * dx, z: rz + dz, r: 0.45 }); }
        many(k, 'ps1/ph_standing_chalkboard_01', { height: 1.6 }, [[SX + sx * 10.6, 0.3, rz - 2.4, sx > 0 ? -PI / 2 : PI / 2]]); k.keepOut.push({ x: SX + sx * 10.6, z: rz - 2.4, r: 0.6 }); }
      many(k, 'ps1/ph_SchoolDesk_01', { height: 0.78 }, desks); many(k, 'ps1/ph_SchoolChair_01', { height: 0.86 }, chairs);
      { const cl: number[][] = []; for (const sx of [-1, 1]) for (const dz of [-4, 4, 12]) cl.push([SX + sx * 2.33, 3.7, SZ - dz - 2.4, sx > 0 ? PI / 2 : -PI / 2]); many(k, 'ps1/ph_wall_clock', { height: 0.4 }, cl); }
      standUp(k, 'WARM UP', '#f05aa0', CX, CZ + CD / 2 - 0.6, 3, 0.01, 0, 7, 10, 1.6);
      k.egg(v(CX, 1.0, CZ + CD / 2 - 6), { id: 'ps1-warm-up-floor', title: 'Letters that stand up', text: 'WARM UP is painted on the courtyard concrete stretched so long that it only stands up as a sign from the gate. It is anamorphosis, a picture drawn for a single viewpoint. Warm Up is the museum\'s summer music series in this courtyard.', clue: 'Stand in the gate and look across the courtyard floor.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.4 });
    }
    k.block(SX - SW / 2, SX + SW / 2, SZ - SD / 2 - 0.6, SZ - SD / 2 + 0.6);
    donorWall(k, SX, 3.4, SZ - SD / 2 + 0.62, 0, 4, false);
    eyeMedallion(k, SX, 0.16, HZ + SD / 2 - 3, 1.4);
    k.crowd([v(SX, 0.15, HZ + 12), v(SX, 0.15, HZ - 12)], 8, { seed: 151, speed: 0.3, spread: 1, animate: !ctx.reduced });
    k.censusWall({ x: SX, y: 2.6, z: SZ - SD / 2 + 0.66, rotY: 0, cols: 6, rows: 4, tile: 0.5, gap: 0.05, start: ctx.wallStart(4700, 24), pieces: ctx.all, backing: dark });
    for (let i = 0; i < 4; i++) { const x = CX - 18 + i * 12; k.box(4.6, 3.2, 0.3, x, 2.0, CZ + CD / 2 - 0.5, dark); mounts.push({ position: v(x, 2.1, CZ + CD / 2 - 0.68), rotation: PI, target: v(x, 2, CZ), width: 4.2, height: 2.5, style: 'black', wash: false }); }
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = CZ - 10 + i * 10; k.box(0.3, 3.2, 4.6, CX + s * (CW / 2 - 0.5), 2.0, z, dark); mounts.push({ position: v(CX + s * (CW / 2 - 0.68), 2.1, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(CX + s * 21, 2, z), width: 4.2, height: 2.5, style: 'black', wash: false }); }
    return { mounts, spawn: v(4, 3, 24), look: v(SX, 9, SZ + SD / 2), eye: 3, bounds: [-CW / 2 + 1, CW / 2 - 1, SZ - SD / 2 + 1, 52], style: 'white' };
  },
};
