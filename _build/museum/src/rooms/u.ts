/* Rooms 97 to 101: the Museum of Arts and Design, the Hispanic Society court, the Studio Museum in Harlem, El Museo del Barrio, the Museum of the City of New York. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront } from './f';
import { mlowBanner, blossomFlag, donorWall, eyeMedallion, wordmarkRelief, eyeMonument, blossomGarden, INK, CLOUD, ELECTRIC, CYAN } from './brand';
import { standIn, hide, hero, heroInstances } from './heroes';
import { hsign, paintTex, anamorphTex } from './f';
import { fireflyPlate } from './a';
import type { Kit } from '../kit';

const PI = Math.PI;

/* ---------- THE BIG UPGRADE, wave 5d (2026-11-24): helpers for mad, hispanicsociety, studiomuseum, elmuseo ----------
   The wave 4 pattern, kept local: scanned CC0 surfaces (Poly Haven, copied into assets/museum/tex/<room>/) that wear a
   sensible colour until their maps land, real models from assets/museum/props/<room>/ fitted once and set many times
   (seven or more become instanced parts), painted canvases. Safe in node: the audit has no DOM, so scans fall back to paint. */
const HAS_DOM = typeof window !== 'undefined' && typeof HTMLImageElement !== 'undefined';
const texL = HAS_DOM ? new T.TextureLoader() : null;
const w5d = new Map<string, { s: X.Surface; ready: Promise<unknown> }>();
function sc(k: Kit, room: string, id: string, metres: number, paint: () => X.Surface, p: Partial<T.MeshStandardMaterialParameters> & { normal?: number; stretch?: number } = {}, wait = 0x888888) {
  if (!texL) return k.pbr(`w5d-${room}-${id}`, paint(), 1 / metres, p);
  let e = w5d.get(`${room}/${id}`);
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
    w5d.set(`${room}/${id}`, e);
  }
  k.pending.push(e.ready);
  const m = k.pbr(`w5d-${room}-${id}-${metres}-${(p.color as number | undefined) ?? 0}`, e.s, 1 / metres, p);
  if (!m.userData.w5d) {
    m.userData.w5d = true;
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
/* Anamorphic floor type seen from (ex, eh, ez) looking along yaw (0 is -z); a flat glow stands in under node. */
function floorTrick(k: Kit, text: string, fg: string, ex: number, ez: number, eh: number, floor: number, yaw: number, D: number, W: number, H: number) {
  if (!HAS_DOM) return;
  anamorphTex(k, floorType(text, fg, 1024, Math.max(96, Math.round((1024 * H) / W))), ex, ez, eh, floor, yaw, D, W, H);
}
/* Small props cast no shadow: the shadow pass doubles their triangles for a speck of shade. */
function noShadow(o: T.Object3D) { o.traverse((c) => { c.castShadow = false; }); }
/* Instanced thin boxes from [x, y, z, sx, sy, sz] rows: joints, mullions, ribs. */
function bars(k: Kit, m: T.Material, rows: number[][]) {
  if (!rows.length) return;
  const g = new T.BoxGeometry(1, 1, 1), q = new T.Quaternion();
  k.instances(g, m, rows.map(([x, y, z, sx, sy, sz]) => new T.Matrix4().compose(new T.Vector3(x, y, z), q, new T.Vector3(sx, sy, sz))));
}

/* ---------------- 97 THE MUSEUM OF ARTS AND DESIGN ---------------- */
export const mad: RoomDef = {
  id: 'mad',
  name: 'The lollipop building',
  area: 'MUSEUM OF ARTS AND DESIGN',
  mood: 'Columbus Circle at rush hour',
  color: '#e8e0d0',
  description: 'The circle with its column and fountains, the white tower with the slot windows cut through it in a line, the tall galleries inside, the works in glass and terracotta light.',
  signatures: 'The nine storey tower on the circle sheathed in white glazed terracotta and glass, the vertical slot of windows snaking up its face, the circle with the column and monument and the ring of fountains, the park behind.',
  build(k, ctx) {
    /* 2026-11-24 (wave 5d): a deeper sky and thinner haze; the white tower washed into a white horizon */
    k.sky({ top: 0x4a7fca, horizon: 0xd6dee4, ground: 0x5a5a55, fog: 0.0011, sun: { az: 4.0, el: 0.5, color: 0xfff4e6, size: 12 }, env: 0.95 });
    k.hemi(0xffffff, 0x5a5a58, 0.8);
    k.sun(0xfff4e6, 2.2, -40, 60, 40, true, 90);
    /* 2026-11-24 (wave 5d): scanned CC0 surfaces (Poly Haven): the glazed terracotta skin as long white tiles, oak gallery
       floors, plaster walls, warm granite for the monument, asphalt, granite pavers, lawn */
    const terra = sc(k, 'mad', 'tile', 1.1, () => X.plaster(0xf0ece4, 157), { roughness: 0.32, color: 0xf8f6f0 }, 0xe2ded6),
      glass = k.glass(0x2c3c4a, 0.62, 0.05), dark = k.flat(0x1a1c20, 0.5, 0.6),
      floorW = sc(k, 'mad', 'wood', 2.2, () => X.planks(0xd8c8a8, 8, 298, 0.1), { roughness: 0.5 }, 0x9a7a58),
      white = sc(k, 'mad', 'stucco', 3, () => X.plaster(0xf6f6f4, 158), { roughness: 0.9, color: 0xfaf9f6 }, 0xe6e4de),
      ceil = sc(k, 'mad', 'stucco', 4, () => X.plaster(0xb8b6b0, 158), { roughness: 0.95, color: 0x8e8c88 }, 0x86847f),
      granite = sc(k, 'mad', 'granite', 2.6, () => X.ashlar(0x8a8480, 299, 2), { roughness: 0.75 }, 0xa89c88),
      waterM = k.flat(0x5a86a8, 0.2, 0.1, { transparent: true, opacity: 0.7 }), steel = k.flat(0x8c98a4, 0.9, 0.3),
      bronze = k.flat(0x5a4a30, 0.85, 0.4), joint = k.flat(0x9c978e, 0, 0.9), green = k.flat(0x1e4a32, 0.3, 0.5);
    // the circle: the column with its figure, the ring of fountains, traffic, the park edge
    k.box(200, 0.3, 200, 0, -0.15, 0, sc(k, 'mad', 'asphalt', 6, () => X.asphalt(0x24282d), { roughness: 0.9 }, 0x2c3034));
    k.mesh(new T.CylinderGeometry(24, 24, 0.5, 64), sc(k, 'mad', 'plaza', 3.2, () => X.pavers(0x9a9a94, 159), { roughness: 0.8 }, 0x8a8a86), 0, 0.1, 40);
    k.cyl(1.4, 22, 0, 11.4, 40, granite, 1.2, 16); k.box(4, 4, 4, 0, 2.2, 40, granite); k.prop('bronze_figure', 0, 22.4, 40, { height: 4 }); k.keepOut.push({ x: 0, z: 40, r: 2.6 });
    /* wave 5d: the monument gets its stepped granite base, its cornice and the bronze ship prows up the shaft */
    k.box(6.4, 0.6, 6.4, 0, 0.6, 40, granite); k.box(5.2, 0.6, 5.2, 0, 1.0, 40, granite); k.box(4.6, 0.5, 4.6, 0, 4.4, 40, granite); k.cyl(1.8, 0.6, 0, 22.4, 40, granite, 1.8, 16);
    for (const y of [9, 13.5]) for (let i = 0; i < 3; i++) { const a = (i / 3) * PI * 2 + (y > 10 ? PI / 3 : 0); const pr = k.mesh(new T.ConeGeometry(0.42, 2.0, 8), bronze, Math.cos(a) * 1.9, y, 40 + Math.sin(a) * 1.9); pr.rotation.set(0, -a, -PI / 2); }
    for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; const j = k.mesh(new T.CylinderGeometry(0.05, 0.16, 3, 6), waterM, Math.cos(a) * 14, 1.8, 40 + Math.sin(a) * 14, true); if (!ctx.reduced) k.ticks.push((t) => { j.scale.y = 0.6 + 0.4 * Math.sin(t * 1.4 + i); }); k.box(1.2, 0.5, 1.2, Math.cos(a) * 14, 0.5, 40 + Math.sin(a) * 14, granite); }
    k.mesh(new T.RingGeometry(12, 16, 64), waterM, 0, 0.55, 40).rotation.x = -PI / 2;
    k.mesh(new T.TorusGeometry(16, 0.25, 6, 64), granite, 0, 0.6, 40).rotation.x = -PI / 2; k.mesh(new T.TorusGeometry(12, 0.25, 6, 64), granite, 0, 0.6, 40).rotation.x = -PI / 2;
    k.block(-16, 16, 24, 56);
    const cars: T.Mesh[] = [];
    for (let i = 0; i < 16; i++) { const c = k.mesh(new T.BoxGeometry(4.2, 1.4, 1.8), i % 3 ? k.flat(0xf1c531, 0.2, 0.5) : k.flat(0x1a1a1a, 0.4, 0.4), 0, 0.7, 0, true); c.userData.a = (i / 16) * PI * 2; c.userData.car = true; cars.push(c); }
    if (!ctx.reduced) k.ticks.push((t) => cars.forEach((c) => { const a = c.userData.a + t * 0.25; c.position.set(Math.cos(a) * 30, 0.7, 40 + Math.sin(a) * 30); c.rotation.y = -a; }));
    k.box(120, 0.4, 100, 80, -0.2, -30, sc(k, 'mad', 'lawn', 4, () => X.grass(0x4a7a3a, 160), { roughness: 0.95 }, 0x3e5a30));
    const rnd = X.mulberry(97); for (let i = 0; i < 24; i++) k.tree(40 + rnd() * 80, 0, -70 + rnd() * 80, { kind: 'round', h: 8 + rnd() * 6, r: 3 + rnd() * 2, leaf: 0x4a7a3c, seed: i });
    blockFront(k, { x: -50, z0: 100, count: 12, face: 1, seed: 300, h: [24, 50] });
    /* wave 5d: the plaza furnished with real models (Poly Haven, CC0): park lamps round the fountain ring, curved
       granite seats facing the water, clear of the view from the spawn */
    { const la: number[][] = []; for (let i = 0; i < 8; i++) { const a = ((22.5 + i * 45) * PI) / 180; la.push([Math.cos(a) * 22.5, 0.35, 40 + Math.sin(a) * 22.5, -a + PI / 2]); k.keepOut.push({ x: Math.cos(a) * 22.5, z: 40 + Math.sin(a) * 22.5, r: 0.5 }); } many(k, 'mad/ph_street_lamp_01', { height: 5.2 }, la, noShadow); }
    { const sa: number[][] = []; for (const d of [10, 70, 130, 190, 320]) { const a = (d * PI) / 180, x = Math.cos(a) * 18.4, z = 40 + Math.sin(a) * 18.4; sa.push([x, 0.35, z, -a - PI / 2]); k.keepOut.push({ x, z, r: 2.3 }); } many(k, 'mad/ph_modular_street_seating', { width: 4.4 }, sa, (o) => { tint(o, 0xb8b0a4, 0.7, 0); noShadow(o); }); }
    /* wave 5d: the subway entrance on the circle, railings, two green globes and its sign */
    { const SX = -12, SZ = 20.5, y0 = 0.35; k.box(2.6, 0.06, 5, SX, y0 + 0.01, SZ, dark); bars(k, green, [[SX - 1.35, y0 + 0.55, SZ, 0.06, 1.1, 5], [SX + 1.35, y0 + 0.55, SZ, 0.06, 1.1, 5], [SX, y0 + 0.55, SZ - 2.5, 2.76, 1.1, 0.06], [SX - 1.35, y0 + 1.1, SZ, 0.1, 0.08, 5.1], [SX + 1.35, y0 + 1.1, SZ, 0.1, 0.08, 5.1], [SX, y0 + 1.1, SZ - 2.5, 2.8, 0.08, 0.1]]); for (const sx of [-1, 1]) { k.cyl(0.07, 2.4, SX + sx * 1.35, y0 + 1.2, SZ + 2.4, green, 0.09, 8); k.sphere(0.24, SX + sx * 1.35, y0 + 2.6, SZ + 2.4, k.glow(0x6af0a0, 0.95), 12); } hsign(k, '59 ST  COLUMBUS CIRCLE', 2.6, 0.42, SX, y0 + 1.5, SZ - 2.56, PI, { fg: '#f4f4f0', bg: '#141414', size: 0.56 }); hsign(k, '59 ST  COLUMBUS CIRCLE', 2.6, 0.42, SX, y0 + 1.5, SZ - 2.44, 0, { fg: '#f4f4f0', bg: '#141414', size: 0.56 }); k.block(SX - 1.45, SX + 1.45, SZ - 2.6, SZ + 2.5); }
    { k.cyl(0.06, 3.6, 7, 2.15, 21.5, green, 0.06, 8); hsign(k, 'COLUMBUS CIR', 1.9, 0.32, 7, 3.7, 21.5, PI / 4, { fg: '#ffffff', bg: '#1e5a36', size: 0.62 }); hsign(k, 'W 59 ST', 1.5, 0.32, 7, 3.32, 21.5, -PI / 4, { fg: '#ffffff', bg: '#1e5a36', size: 0.62 }); k.keepOut.push({ x: 7, z: 21.5, r: 0.3 }); }
    // the tower: white terracotta with the slot climbing its face, the entrance, the galleries in a stack
    const TX = -22, TZ = -10, TW = 26, TH = 40, FZ = TZ + TW / 2;
    /* wave 5d: the tower was one solid box with the lobby sealed behind it; now the ground floor is four walls with the
       glass entrance open, and the 2008 terracotta skin is panelled with its deep grooves */
    k.box(TW, TH - 6, TW, TX, 6 + (TH - 6) / 2, TZ, terra);
    k.box(TW, 6, 0.6, TX, 3, TZ - TW / 2 + 0.3, terra); for (const s of [-1, 1]) k.box(0.6, 6, TW, TX + s * (TW / 2 - 0.3), 3, TZ, terra);
    k.box(TW / 2 - 10.2 + 0.0, 6, 0.6, TX - TW / 2 + (TW / 2 - 10.2) / 2, 3, FZ - 0.3, terra); k.box(TW / 2 + 1.8, 6, 0.6, TX - 1.8 + (TW / 2 + 1.8) / 2, 3, FZ - 0.3, terra);
    k.box(8.4, 1.0, 0.6, TX - 6, 5.5, FZ - 0.3, terra);
    { const rows: number[][] = []; for (let y = 1.25; y < TH; y += 1.25) { rows.push([TX, y, FZ + 0.02, TW + 0.04, 0.07, 0.05], [TX, y, TZ - TW / 2 - 0.02, TW + 0.04, 0.07, 0.05], [TX - TW / 2 - 0.02, y, TZ, 0.05, 0.07, TW + 0.04], [TX + TW / 2 + 0.02, y, TZ, 0.05, 0.07, TW + 0.04]); } for (let x = -TW / 2 + 2.6; x < TW / 2; x += 2.6) { rows.push([TX + x, TH / 2 + 3, FZ + 0.02, 0.06, TH - 6, 0.05], [TX + x, TH / 2 + 3, TZ - TW / 2 - 0.02, 0.06, TH - 6, 0.05], [TX - TW / 2 - 0.02, TH / 2 + 3, TZ + x, 0.05, TH - 6, 0.06], [TX + TW / 2 + 0.02, TH / 2 + 3, TZ + x, 0.05, TH - 6, 0.06]); } bars(k, joint, rows); }
    k.box(TW + 0.6, 0.5, TW + 0.6, TX, TH + 0.25, TZ, granite); bars(k, granite, [[TX, 0.3, TZ - TW / 2 - 0.15, TW + 0.6, 0.6, 0.3], [TX - TW / 2 - 0.15, 0.3, TZ, 0.3, 0.6, TW], [TX + TW / 2 + 0.15, 0.3, TZ, 0.3, 0.6, TW], [TX - TW / 2 + (TW / 2 - 10.2) / 2 - 0.15, 0.3, FZ + 0.15, TW / 2 - 10.2 + 0.3, 0.6, 0.3], [TX - 1.8 + (TW / 2 + 1.8) / 2 + 0.15, 0.3, FZ + 0.15, TW / 2 + 1.8 + 0.3, 0.6, 0.3]]);
    const slot = [[6, 2], [9, 6], [9, 12], [4, 12], [4, 18], [10, 18], [10, 26], [2, 26], [2, 34]];
    for (let i = 0; i < slot.length - 1; i++) { const [x0, y0] = slot[i], [x1, y1] = slot[i + 1]; const w = Math.abs(x1 - x0) + 1.4, h = Math.abs(y1 - y0) + 1.4, cx = TX + (x0 + x1) / 2, cy = (y0 + y1) / 2; k.box(w, h, 0.3, cx, cy, FZ + 0.05, glass); bars(k, steel, [[cx, cy + h / 2, FZ + 0.22, w + 0.1, 0.1, 0.12], [cx, cy - h / 2, FZ + 0.22, w + 0.1, 0.1, 0.12], [cx - w / 2, cy, FZ + 0.22, 0.1, h, 0.12], [cx + w / 2, cy, FZ + 0.22, 0.1, h, 0.12]]); }
    /* the band of windows the board added near the top: an H on the Columbus Circle face, an I on the Eighth Avenue face */
    for (const dx of [-8, -2]) k.box(1.0, 7, 0.3, TX + dx, 33, FZ + 0.05, glass); k.box(6, 1.0, 0.3, TX - 5, 33, FZ + 0.05, glass);
    k.box(0.3, 7, 1.0, TX - TW / 2 - 0.05, 33, TZ, glass); for (const dy of [-3.5, 3.5]) k.box(0.3, 1.0, 4, TX - TW / 2 - 0.05, 33 + dy, TZ, glass);
    k.box(8, 5, 0.3, TX - 6, 2.5, FZ + 0.05, k.glass(0xcfe2ee, 0.16, 0.04)); k.block(TX - TW / 2, TX - 8.2, FZ - 0.5, FZ + 0.5); k.block(TX - 3.8, TX + TW / 2, FZ - 0.5, FZ + 0.5);
    bars(k, steel, [[TX - 10, 2.5, FZ + 0.22, 0.1, 5, 0.1], [TX - 8.2, 2.5, FZ + 0.22, 0.1, 5, 0.1], [TX - 3.8, 2.5, FZ + 0.22, 0.1, 5, 0.1], [TX - 2, 2.5, FZ + 0.22, 0.1, 5, 0.1], [TX - 6, 5.0, FZ + 0.22, 8.1, 0.1, 0.1]]);
    k.box(10, 0.22, 2.6, TX - 6, 5.3, FZ + 1.3, steel); bars(k, steel, [[TX - 10.6, 2.65, FZ + 2.4, 0.08, 5.3, 0.08], [TX - 1.4, 2.65, FZ + 2.4, 0.08, 5.3, 0.08]]); k.keepOut.push({ x: TX - 10.6, z: FZ + 2.4, r: 0.2 }, { x: TX - 1.4, z: FZ + 2.4, r: 0.2 });
    k.sign('MUSEUM OF ARTS AND DESIGN', 8, 0.7, TX, 7, FZ + 0.06, 'transparent', '#1a1c20', 70, 0);
    hsign(k, '2 COLUMBUS CIRCLE', 4.4, 0.36, TX - 6, 5.6, FZ + 2.62, 0, { fg: '#f4f2ec', bg: '#1a1c20', size: 0.56 });
    mlowBanner(k, TX + 8, 14, FZ + 0.4, 0, 3.0, false); blossomFlag(k, TX - 9, 12, FZ + 0.4, 0, 2.4, 3, 'cloud');
    const GW = TW - 1.2, GH = 5.6;
    for (let f = 0; f < 3; f++) { const y = f * (GH + 0.4); k.box(GW, 0.3, GW, TX, y + 0.15, TZ, floorW); for (const s of [-1, 1]) { k.box(0.3, GH, GW, TX + s * (GW / 2 - 0.2), y + GH / 2, TZ, white); if (s > 0 && f === 0) { for (const [x0, x1] of [[TX - GW / 2, TX - 10.2], [TX - 1.8, TX + GW / 2]]) k.box(x1 - x0, GH, 0.3, (x0 + x1) / 2, y + GH / 2, TZ + s * (GW / 2 - 0.2), white); k.box(8.4, 0.6, 0.3, TX - 6, y + GH - 0.3, TZ + s * (GW / 2 - 0.2), white); } else k.box(GW, GH, 0.3, TX, y + GH / 2, TZ + s * (GW / 2 - 0.2), white); }
      k.box(GW, 0.4, GW, TX, y + GH, TZ, ceil); for (let i = 0; i < 4; i++) k.point(TX - 6 + (i % 2) * 12, y + GH - 1, TZ - 6 + Math.floor(i / 2) * 12, 0xffffff, 18, 12);
      /* wave 5d: track lighting on the ceiling, oak skirting and a shadow gap at the foot of every wall */
      const tr: number[][] = []; for (const x of [-7.5, -2.5, 2.5, 7.5]) { tr.push([TX + x, y + GH - 0.24, TZ, 0.08, 0.06, GW - 2]); for (let z = -9; z <= 9; z += 3) tr.push([TX + x, y + GH - 0.36, TZ + z, 0.14, 0.2, 0.14]); } bars(k, dark, tr);
      bars(k, dark, [[TX - GW / 2 + 0.37, y + 0.36, TZ, 0.04, 0.12, GW - 0.8], [TX + GW / 2 - 0.37, y + 0.36, TZ, 0.04, 0.12, GW - 0.8], [TX, y + 0.36, TZ - GW / 2 + 0.37, GW - 0.8, 0.12, 0.04]]); }
    k.block(TX - GW / 2 - 0.5, TX - GW / 2 + 0.5, TZ - GW / 2, TZ + GW / 2); k.block(TX + GW / 2 - 0.5, TX + GW / 2 + 0.5, TZ - GW / 2, TZ + GW / 2); k.block(TX - GW / 2, TX + GW / 2, TZ - GW / 2 - 0.5, TZ - GW / 2 + 0.5);
    for (let f = 0; f < 2; f++) { const y0 = f * 6; for (let i = 0; i < 18; i++) k.box(2.4, 0.33, 0.9, TX + GW / 2 - 1.5, y0 + 0.17 + i * 0.33, TZ + GW / 2 - 2 - i * 0.9, floorW); k.box(0.06, 1.0, 16, TX + GW / 2 - 2.8, y0 + 3.6, TZ + GW / 2 - 10, steel); }
    k.block(TX + GW / 2 - 2.8, TX + GW / 2 - 0.3, TZ - GW / 2, TZ + GW / 2 - 1.5);
    /* wave 5d: the vitrines and stones moved to the diagonals so every work's viewing spot is clear; the globe and the
       armillary gave way to what the museum shows, glass and clay: real vases (Poly Haven, CC0) on white plinths under glass */
    for (const [x, z] of [[TX - 4.5, TZ + 4.5], [TX + 4.5, TZ - 4.5]] as const) k.prop('vitrine', x, 0.15, z, { height: 1.7, keepOut: 1.2 });
    for (const [x, z, p] of [[TX - 4.5, TZ - 4.5, 'noguchi_stone_1'], [TX + 4.5, TZ + 4.5, 'noguchi_stone_3']] as const) k.prop(p, x, 6.15, z, { height: 2.4, keepOut: 1.6 });
    { const kinds = ['mad/ph_ceramic_vase_01', 'mad/ph_ceramic_vase_03', 'mad/ph_brass_vase_01', 'mad/ph_brass_vase_02', 'mad/nyb_loft_vase_c', 'mad/ph_ceramic_pot'], heights = [0.62, 0.7, 0.75, 0.6, 0.5, 0.34], at: number[][][] = kinds.map(() => []);
      const shows: [number, number, number][] = [[0, -4.5, -4.5], [0, 4.5, 4.5], [1, -4.5, 4.5], [1, 4.5, -4.5], [2, -4.5, -4.5], [2, 4.5, 4.5]];
      const hood = k.glass(0xe8f4f8, 0.1, 0.03);
      shows.forEach(([f, dx, dz], si) => { const y = f * 6 + 0.3, x = TX + dx, z = TZ + dz; k.box(2.8, 0.95, 1.1, x, y + 0.475, z, white); k.box(2.84, 0.9, 1.14, x, y + 0.95 + 0.45, z, hood); k.keepOut.push({ x, z, r: 1.6 }); for (let i = 0; i < 3; i++) at[(si * 3 + i) % kinds.length].push([x - 0.85 + i * 0.85, y + 0.95, z + (i % 2 ? 0.12 : -0.12), (si + i) * 1.3]); });
      kinds.forEach((n, i) => many(k, n, { height: heights[i] }, at[i], noShadow)); }
    for (const f of [0, 1, 2]) k.point(TX, f * 6 + 4.6, TZ, 0xfff4e8, 10, 10);
    /* the one trick: HI painted long and thin on the lobby floor stands up straight from the door, as the windows spell HI */
    floorTrick(k, 'HI', '#1a1c20', TX - 6, FZ + 1.6, 3, 0.31, 0, 4.2, 3.0, 1.3);
    /* Firefly plate queued: a wall of studio glass and ceramics, beside the door inside the lobby (plain wall until it lands) */
    fireflyPlate(k, 'assets/museum/tex/mad/ff_glass_wall.webp', 9, 3.4, TX + 4, 3.0, FZ - 0.98, PI, white);
    eyeMedallion(k, TX, 0.16, TZ + 8, 1.8);
    donorWall(k, TX, 3.6, TZ - GW / 2 + 0.36, 0, 9, true);
    k.crowd([v(-4, 0, 30), v(TX - 8, 0, TZ + 20), v(TX - 4, 0.15, TZ + 6), v(TX + 4, 0.15, TZ - 6)], 16, { seed: 131, speed: 0.4, spread: 2, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a] });
    k.censusWall({ x: TX - GW / 2 + 0.36, y: 9.2, z: TZ, rotY: PI / 2, cols: 30, rows: 5, tile: 0.5, gap: 0.05, start: ctx.wallStart(5700, 150), pieces: ctx.all, backing: dark });
    /* the landmark eggs: the lollipop building and what became of it */
    const mdW = { name: '2 Columbus Circle, Wikipedia', url: 'https://en.wikipedia.org/wiki/2_Columbus_Circle' };
    k.egg(v(TX + 4, 2.2, TZ + TW / 2 + 1.2), { id: 'mad-lollipops', title: 'A palazzo on lollypops', year: '1964', text: 'Edward Durell Stone\'s Gallery of Modern Art opened here on March 21, 1964, in white Vermont marble over a loggia of 27 concrete columns eight feet tall. Ada Louise Huxtable called it a die cut Venetian palazzo on lollypops, and the nickname stuck.', clue: 'Stand at the foot of the tower where the columns used to be.', source: mdW }, { r: 1.6 });
    k.egg(v(TX - 5, 33, TZ + TW / 2 + 0.8), { id: 'mad-hi', title: 'The building says HI', text: 'Brad Cloepfil wanted no extra windows near the top, but the museum\'s board and director added a band of them against his wishes. They form an H on the Columbus Circle side and an I on the Eighth Avenue side, so from the northwest the building appears to spell HI.', clue: 'Look up at the windows near the top of the tower, then walk round the corner.', source: mdW }, { r: 2.4 });
    k.egg(v(TX + 9, 3, TZ + TW / 2 + 0.8), { id: 'mad-stippled', title: 'Panels that sparkle', year: '2008', text: 'The 2008 skin is made of terracotta panels four inches thick, separated by deep grooves. The white panels are stippled, which makes them sparkle in sunlight and seem to change colour through the day.', clue: 'Put your face close to the white cladding beside the door.', source: mdW }, { r: 1.6 });
    k.egg(v(TX - 10, 1.8, TZ + TW / 2 + 5), { id: 'mad-shame-cam', title: 'The shame cam', text: 'Preservationists fought the recladding in court, Landmark West filing its eighth legal challenge as work began and streaming the construction on a shame cam. The director joked that the controversy gave the museum $5 million of free advertising.', clue: 'Look for a camera\'s eye view of the tower from the pavement.', source: mdW }, { r: 1.6 });
    k.egg(v(-6, 1.4, 14), { id: 'mad-taxi', title: 'The taxi drivers\' favourite', text: 'Tom Wolfe defended the original building and called it a jewel. He reported that Stone insisted every taxi driver in New York would call it his favourite building.', clue: 'Watch the yellow cabs swing round the circle.', source: mdW }, { r: 1.6 });
    k.egg(v(TX + 8, TH - 6, TZ + TW / 2 + 0.6), { id: 'mad-gauguin-room', title: 'The Gauguin Room', text: 'The ninth floor of Stone\'s building held the Gauguin Room, a 52 seat Polynesian restaurant. It reopened in December 2009 as Robert, with 138 seats, reachable without entering the museum.', clue: 'Look to the top floors facing the circle.', source: mdW }, { r: 2.0 });
    k.egg(v(TX - 6, 0.8, FZ - 3), { id: 'mad-hi-floor', title: 'HI from the door', text: 'The band of windows the board added near the top makes the tower spell HI from the northwest. The HI on the lobby floor is painted long and thin, so it only stands up straight from the doorway.', clue: 'Stand in the glass doorway and look at the lobby floor.', source: mdW }, { r: 1.6 });
    // the works: the white walls on each level, the slot side gets the small ones between the window pieces
    const mounts: Mount[] = [];
    for (let f = 0; f < 3; f++) { const y = f * 6 + 3.2; for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = TZ - 7 + i * 7; if (s > 0 && f < 2 && z > TZ) continue; mounts.push({ position: v(TX + s * (GW / 2 - 0.36), y, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(TX, y - 0.6, z), width: 4.4, height: 2.6, style: 'white', wash: true }); } for (const x of [-7, 0, 7]) mounts.push({ position: v(TX + x, y, TZ - GW / 2 + 0.36), rotation: 0, target: v(TX + x, y - 0.6, TZ), width: 4.4, height: 2.6, style: 'white', wash: true }); }
    return { mounts, spawn: v(-4, 3, 24), look: v(TX, 18, TZ), eye: 3, bounds: [TX - GW / 2 + 0.8, 20, TZ - GW / 2 + 0.8, 60], style: 'white', floorY: (x, z) => { for (const f of [0, 1]) { const y0 = f * 6; if (x > TX + GW / 2 - 2.8 && x < TX + GW / 2 - 0.3 && z < TZ + GW / 2 - 1.5 && z > TZ + GW / 2 - 17.8) { const t = (TZ + GW / 2 - 1.5 - z) / 16.3; if (f === 0 && t < 1) return t * 6; if (f === 1 && t < 1) return 6 + t * 6; } } if (x > TX - GW / 2 && x <= TX + GW / 2 - 2.8 && z > TZ - GW / 2 && z < TZ + GW / 2) return 0; return 0; } };
  },
};

/* ---------------- 98 THE HISPANIC SOCIETY ---------------- */
export const hispanicsociety: RoomDef = {
  id: 'hispanicsociety',
  name: 'The terracotta court',
  area: 'THE HISPANIC SOCIETY',
  mood: 'Audubon Terrace, afternoon',
  color: '#c8784a',
  description: 'The Beaux Arts terrace on Broadway at 155th, the bronze horseman, then the two storey court in red terracotta with its arcaded gallery, the works among the Spanish painters.',
  signatures: 'The plaza of white limestone institutions with the bronze El Cid at its centre, four warriors at his pedestal, the two flagpoles and their pool, the main court lined in ornate red Spanish Renaissance terracotta with an arcaded upper gallery, the skylight, the Sorolla room of vision of Spain.',
  build(k, ctx) {
    /* 2026-11-24 (wave 5d): a deeper sky; the white haze swallowed the limestone terrace */
    k.sky({ top: 0x4a7fca, horizon: 0xd6dee4, ground: 0x6a6a66, fog: 0.0011, sun: { az: 3.6, el: 0.7, color: 0xfff4e6, size: 12 }, env: 0.95 });
    k.hemi(0xfff0dc, 0x4a4038, 0.8);
    k.sun(0xfff0d8, 2.2, 30, 60, 30, true, 80);
    /* wave 5d: scanned CC0 surfaces (Poly Haven): limestone block, the court's red terracotta as weathered red plaster with
       red sandstone for the arcades and pilasters, red quarry tile underfoot, herringbone brick on the terrace */
    const lime = sc(k, 'hispanicsociety', 'lime', 2.4, () => X.ashlar(0xd8d0bc, 301, 4), { roughness: 0.8 }, 0xc8c0ac),
      terra = sc(k, 'hispanicsociety', 'terra', 2.2, () => X.ashlar(0x9a4a3a, 302, 2), { roughness: 0.7 }, 0x8a4434),
      terraD = sc(k, 'hispanicsociety', 'terraD', 1.8, () => X.ashlar(0x7a3a2e, 303, 2), { roughness: 0.65, color: 0xd88a6a }, 0x7a3a2e),
      floorT = sc(k, 'hispanicsociety', 'floor', 1.6, () => X.terrazzo(0xb8a890, 161), { roughness: 0.45 }, 0x7a3a2a),
      dark = k.flat(0x1a1c20, 0.5, 0.6), glass = k.glass(0xe8f4f8, 0.1, 0.03), steel = k.flat(0x8c98a4, 0.9, 0.3), bronze = k.flat(0x4a3a28, 0.8, 0.4);
    // Audubon Terrace: the plaza between the limestone buildings, the horseman, Broadway beyond
    street(k, { w: 26, len: 160, z: 50, x: 0 });
    blockFront(k, { x: 60, z0: 130, count: 10, face: -1, seed: 304, h: [16, 26] });
    k.box(60, 0.3, 50, 0, 0.05, 15, sc(k, 'hispanicsociety', 'plaza', 1.8, () => X.pavers(0xb8b0a0, 162), { roughness: 0.85 }, 0x8a5a44));
    for (const s of [-1, 1]) { k.box(20, 14, 50, s * 40, 7, 15, lime); for (let i = 0; i < 5; i++) k.column(s * 30.5, 0, -5 + i * 10, 10, 0.8, lime, true); k.box(20, 2, 52, s * 40, 15, 15, lime); k.block(s * 40 - 10, s * 40 + 10, -10, 40); }
    /* wave 5d: El Cid on a real sculpted horse (Poly Haven's porcelain horse, CC0, cast here in bronze) with the kit's
       faceless rider; the old box horse comes back only if the model fails */
    k.keepOut.push({ x: 0, z: 22, r: 3 }); k.box(4, 2.4, 6, 0, 1.2, 22, lime); k.box(4.6, 0.4, 6.6, 0, 2.5, 22, lime); k.box(4.3, 0.3, 6.3, 0, 0.3, 22, lime);
    void hero(k, 'hispanicsociety/ph_horse_statue_01', { height: 4.6 }).then((h) => { if (!k.live) return; if (!h) { k.prop('equestrian', 0, 0.15, 22, { height: 6, rotY: PI }); return; } tint(h, 0x4a3a26, 0.42, 0.85); h.position.set(0, 2.7, 22); k.add(h); });
    void Promise.resolve(k.prop('bronze_figure', 0.6, 4.6, 22.15, { height: 2.1, rotY: PI / 2 })).then((o) => { if (o) tint(o, 0x4a3a26, 0.42, 0.85); });
    /* El Cid's pedestal carries four bronze warriors at its corners; the flags of Spain and the United States on bronze based poles joined by a reflecting pool */
    for (const [dx, dz] of [[-2.3, -3.3], [2.3, -3.3], [-2.3, 3.3], [2.3, 3.3]]) k.prop('bronze_figure', dx, 0.15, 22 + dz, { height: 1.7, keepOut: 0.7 });
    for (const sx of [-1, 1]) { k.cyl(0.7, 1.2, sx * 9, 0.75, 34, bronze, 0.9, 16); k.cyl(0.12, 16, sx * 9, 9.3, 34, steel, 0.08, 8); k.keepOut.push({ x: sx * 9, z: 34, r: 1.1 }); }
    k.box(15, 0.1, 1.6, 0, 0.26, 34, k.flat(0x6a8aa8, 0.3, 0.15)); k.box(15.4, 0.3, 2.0, 0, 0.15, 34, lime); k.block(-7.7, 7.7, 33, 35);
    const FZ = -10, FW = 40;
    k.box(FW, 18, 34, 0, 9, FZ - 17, lime);
    for (let i = 0; i < 6; i++) { k.column(-15 + i * 6, 0.1, FZ + 1.2, 10, 0.9, lime, true); k.prop('ionic_capital', -15 + i * 6, 10.2, FZ + 1.2, { height: 1.4 }); }
    k.box(FW, 2, 4, 0, 12, FZ + 1.2, lime);
    k.arch(3.4, 6, 3, 0, 0, FZ - 1, lime, false, 0.85); k.block(-FW / 2, -1.9, FZ - 0.6, FZ + 0.6); k.block(1.9, FW / 2, FZ - 0.6, FZ + 0.6);
    k.sign('THE HISPANIC SOCIETY OF AMERICA', 14, 0.8, 0, 14, FZ + 0.06, 'transparent', '#3a3020', 70, 0);
    mlowBanner(k, -12, 7, FZ + 0.6, 0, 2.8, true); blossomFlag(k, 12, 7, FZ + 0.6, 0, 2.4, 7, 'ink');
    // the court: red terracotta on two storeys, arcades above, the skylight, the works
    const CW = 30, CD = 24, CZ = FZ - 16, CH = 14;
    k.box(CW, 0.3, CD, 0, 0.15, CZ, floorT);
    for (const s of [-1, 1]) { k.box(0.6, CH, CD, s * CW / 2, CH / 2, CZ, terra); k.block(s * CW / 2 - 0.5, s * CW / 2 + 0.5, CZ - CD / 2, CZ + CD / 2); }
    k.box(CW, CH, 0.6, 0, CH / 2, CZ - CD / 2, terra); k.block(-CW / 2, CW / 2, CZ - CD / 2 - 0.5, CZ - CD / 2 + 0.5);
    k.box(CW, CH, 0.6, 0, CH / 2, CZ + CD / 2, terra); k.block(-CW / 2, -1.9, CZ + CD / 2 - 0.5, CZ + CD / 2 + 0.5); k.block(1.9, CW / 2, CZ + CD / 2 - 0.5, CZ + CD / 2 + 0.5);
    k.box(CW + 1, 0.4, CD + 1, 0, CH, CZ, glass); for (let x = -CW / 2; x <= CW / 2; x += 3) k.box(0.2, 0.4, CD + 1, x, CH + 0.1, CZ, steel);
    k.point(0, CH - 3, CZ, 0xfff4e6, 80, 40);
    for (const s of [-1, 1]) { k.arcade(CD - 2, 6, 1.2, 4, 3.6, 5, s * (CW / 2 - 0.6), 7, CZ, terraD, PI / 2, false); k.box(3, 0.4, CD - 2, s * (CW / 2 - 1.5), 7, CZ, floorT); for (let i = 0; i < 5; i++) k.box(0.3, 0.3, 0.3, s * (CW / 2 - 3), 7.4, CZ - 8 + i * 4, terraD); }
    k.arcade(CW - 2, 6, 1.2, 5, 3.6, 5, 0, 7, CZ - CD / 2 + 0.6, terraD, 0, false); k.box(CW - 2, 0.4, 3, 0, 7, CZ - CD / 2 + 1.5, floorT);
    for (let i = 0; i < 20; i++) k.box(2.4, 0.35, 0.9, CW / 2 - 1.5, 0.17 + i * 0.35, CZ + CD / 2 - 1.5 - i * 0.9, floorT);
    k.block(CW / 2 - 2.8, CW / 2 - 0.3, CZ - CD / 2, CZ + CD / 2 - 1);
    for (let f = 0; f < 2; f++) for (let i = 0; i < 24; i++) { const a = (i / 24) * PI * 2; const r = 0.12; void a; void r; }
    /* wave 5d: the court built, not painted: terracotta pilasters with capitals between the works, a cornice round the
       top, the skylight in a coffered frame, lantern chandeliers on chains, lustreware and brass on pedestals, plants */
    { const pil: number[][] = [], cap: number[][] = []; for (const z of [-6, 0, 6]) for (const s of [-1, 1]) { pil.push([s * (CW / 2 - 0.5), 3.5, CZ + z, 0.4, 7, 1.0]); cap.push([s * (CW / 2 - 0.55), 6.75, CZ + z, 0.5, 0.5, 1.3]); }
      for (const x of [-12, -6, 0, 6, 12]) { pil.push([x, 3.5, CZ - CD / 2 + 0.5, 1.0, 7, 0.4]); cap.push([x, 6.75, CZ - CD / 2 + 0.55, 1.3, 0.5, 0.5]); if (Math.abs(x) > 2) { pil.push([x, 3.5, CZ + CD / 2 - 0.5, 1.0, 7, 0.4]); cap.push([x, 6.75, CZ + CD / 2 - 0.55, 1.3, 0.5, 0.5]); } }
      bars(k, terraD, pil); bars(k, terraD, cap); }
    { const prof: [number, number][] = [[0, 0], [0.5, 0], [0.6, 0.2], [0.45, 0.35], [0.7, 0.55], [0.8, 0.8], [0, 0.8]]; k.moulding(prof, CW, 0, CH - 1.0, CZ - CD / 2 + 0.3, terraD, -PI / 2); k.moulding(prof, CW, 0, CH - 1.0, CZ + CD / 2 - 0.3, terraD, PI / 2); k.moulding(prof, CD, -CW / 2 + 0.3, CH - 1.0, CZ, terraD, 0); k.moulding(prof, CD, CW / 2 - 0.3, CH - 1.0, CZ, terraD, PI); }
    bars(k, terraD, [[0, CH - 0.1, CZ - CD / 2 + 1.1, CW, 0.5, 1.6], [0, CH - 0.1, CZ + CD / 2 - 1.1, CW, 0.5, 1.6], [-CW / 2 + 1.1, CH - 0.1, CZ, 1.6, 0.5, CD], [CW / 2 - 1.1, CH - 0.1, CZ, 1.6, 0.5, CD]]);
    { const ch: number[][] = []; for (const x of [-8, 0, 8]) for (const z of [CZ - 5, CZ + 5]) { ch.push([x, CH - 4.6, z, 0]); k.beam(v(x, CH, z), v(x, CH - 3.0, z), 0.025, bronze, 4); } many(k, 'hispanicsociety/ph_lantern_chandelier_01', { height: 1.7 }, ch, noShadow); for (const x of [-8, 8]) k.point(x, CH - 4.4, CZ, 0xffd9a0, 22, 14); }
    { const ped: number[][] = [], va: number[][] = [], vb: number[][] = []; for (const [x, z] of [[-11, CZ - 6], [-11, CZ + 6], [11, CZ - 6], [11, CZ + 6]] as const) { ped.push([x, 0.6, z, 0.8, 1.2, 0.8]); k.keepOut.push({ x, z, r: 0.7 }); (x < 0 ? va : vb).push([x, 1.2, z, z * 0.7]); } bars(k, terraD, ped); many(k, 'hispanicsociety/ph_brass_vase_01', { height: 0.9 }, va, noShadow); many(k, 'hispanicsociety/ph_ceramic_vase_01', { height: 0.8 }, vb, (o) => { tint(o, 0xc89a48, 0.25, 0.55); noShadow(o); }); }
    many(k, 'hispanicsociety/ph_potted_plant_02', { height: 1.8 }, [[-13, 0.3, CZ - 10.4, 0.3], [-13, 0.3, CZ + 10.4, 1.2]]); k.keepOut.push({ x: -13, z: CZ - 10.4, r: 0.6 }, { x: -13, z: CZ + 10.4, r: 0.6 });
    hsign(k, 'SOROLLA  ·  VISION OF SPAIN', 6.2, 0.5, 0, 6.0, CZ - CD / 2 + 0.72, 0, { fg: '#f2e6c8', bg: '#3a1e16', border: '#c8a050', size: 0.5 });
    hsign(k, 'AUDUBON TERRACE', 3.6, 0.5, 0, 1.2, 25.06, 0, { fg: '#e8dcc0', bg: '#4a3a28', border: '#c8a050', lit: false, size: 0.5 });
    { k.cyl(0.06, 3.6, -14, 1.95, 44, dark, 0.06, 8); hsign(k, 'BROADWAY', 1.8, 0.32, -14, 3.5, 44, PI / 4, { fg: '#ffffff', bg: '#1e5a36', size: 0.62 }); hsign(k, 'W 155 ST', 1.6, 0.32, -14, 3.12, 44, -PI / 4, { fg: '#ffffff', bg: '#1e5a36', size: 0.62 }); k.keepOut.push({ x: -14, z: 44, r: 0.3 }); }
    /* the terrace's limestone wings get window reveals and a cornice */
    { const win: number[][] = []; for (const s of [-1, 1]) for (let i = 0; i < 4; i++) for (const y of [4.5, 9.5]) win.push([s * 29.96, y, 0 + i * 10, 0.06, 3.2, 1.8]); bars(k, k.flat(0x34404a, 0.6, 0.25), win); for (const s of [-1, 1]) k.moulding([[0, 0], [0.6, 0], [0.8, 0.3], [0.5, 0.5], [0.9, 0.9], [0, 0.9]], 50, s * 30, 13.1, 15, lime, s < 0 ? 0 : PI); }
    eyeMedallion(k, 0, 0.16, CZ - 8.2, 2.0);
    /* the one trick: VISION OF SPAIN painted long on the court floor stands up for whoever comes in through the door */
    floorTrick(k, 'VISION OF SPAIN', '#f4e6c4', 0, CZ + CD / 2 - 1.2, 3, 0.31, 0, 4.2, 6.4, 1.3);
    /* Firefly plate queued: a sunlit Spanish frieze over the court door (the terracotta wall until it lands) */
    fireflyPlate(k, 'assets/museum/tex/hispanicsociety/ff_spain_frieze.webp', 22, 3.2, 0, 10.6, CZ + CD / 2 - 0.34, PI, terra);
    donorWall(k, 0, 10.2, CZ - CD / 2 + 0.36, 0, 9, false);
    /* wave 5d: the benches and the vitrine stood on the viewing spots of four works; moved clear */
    for (const x of [-6.5, 6.5]) k.prop('museum_bench', x, 0.15, CZ + 6, { height: 0.58, keepOut: 1.4 });
    k.prop('vitrine', -4.5, 0.15, CZ - 4.5, { height: 1.7, keepOut: 1.2 });
    k.crowd([v(0, 0, 40), v(-6, 0, 10), v(0, 0.15, CZ + 8), v(-8, 0.15, CZ - 4), v(8, 0.15, CZ - 8)], 16, { seed: 132, speed: 0.4, spread: 2, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a, 0xc9a25a] });
    k.censusWall({ x: -CW / 2 + 0.36, y: 10.6, z: CZ, rotY: PI / 2, cols: 30, rows: 4, tile: 0.5, gap: 0.05, start: ctx.wallStart(2400, 120), pieces: ctx.all, backing: dark });
    /* the landmark eggs: Audubon Terrace and Archer Huntington's society */
    const hsW = { name: 'Hispanic Society of America, Wikipedia', url: 'https://en.wikipedia.org/wiki/Hispanic_Society_of_America' }, hsA = { name: 'Audubon Terrace, Wikipedia', url: 'https://en.wikipedia.org/wiki/Audubon_Terrace' };
    k.egg(v(0, 4.2, 25.4), { id: 'hispanicsociety-el-cid', title: 'El Cid, twice', year: '1927', text: 'Anna Hyatt Huntington\'s bronze El Cid of 1927 stands in front of the society\'s library, a replica of a similar statue she made for Seville. Four bronze warriors sit at the corners of the pedestal.', clue: 'Walk round the horseman and count the warriors at his feet.', source: hsA }, { r: 2.0 });
    k.egg(v(-16, 1.4, 34), { id: 'hispanicsociety-minniesland', title: 'Audubon\'s farm', text: 'The terrace stands on part of John James Audubon\'s estate, Minniesland, named for his wife Lucy, who was called Minnie. It covered 30 to 40 acres.', clue: 'Stand at the Broadway end of the terrace and imagine fields.', source: hsA }, { r: 1.6 });
    k.egg(v(0, 2.6, FZ + 1.0), { id: 'hispanicsociety-doors', title: 'Doors from Cairo, then ten years', year: '1939', text: 'The main doorway first held a pair of bronze doors from a mosque in Cairo. They were replaced by double doors designed by Berthold Nebel, finished in 1939 after ten years of work. The entrance stair is flanked by lions by Anna Hyatt Huntington.', clue: 'Look closely at the door before you go in.', source: hsW }, { r: 1.6 });
    k.egg(v(-8, 1.4, CZ + 5), { id: 'hispanicsociety-court', title: 'A Spanish patio', text: 'The main court measures 98 by 40 feet and rises 35 feet. It is modelled on the patio of a Spanish house, its upper gallery carried on terracotta pillars.', clue: 'Stand in the court and look up at the gallery.', source: hsW }, { r: 1.6 });
    k.egg(v(-4.5, 1.6, CZ - 4.5), { id: 'hispanicsociety-23-paintings', title: 'Twenty three paintings', year: '1904', text: 'Archer M. Huntington founded the society in 1904 with only 23 paintings, most of them insignificant, and his mother Arabella bought the two most expensive. Despite its name it has never worked as a learned society, and under his trust admission has always been free.', clue: 'Lean over the vitrine in the middle of the court.', source: hsW }, { r: 1.6 });
    k.egg(v(0, 2.2, CZ - CD / 2 + 1.2), { id: 'hispanicsociety-sorolla', title: 'Two hundred feet of Spain', year: '1911', text: 'Archer Huntington commissioned Joaquin Sorolla in 1911 for fourteen huge paintings, which together run more than 200 linear feet round their own room.', clue: 'Go to the back of the court, toward the Sorolla room.', source: hsW }, { r: 1.6 });
    k.egg(v(0, 0.6, CZ + 4), { id: 'hispanicsociety-vision', title: 'Vision of Spain', year: '1911', text: 'Sorolla\'s fourteen paintings for Archer Huntington, commissioned in 1911, run more than 200 linear feet round their own room at the back of the court. Their name is painted long on the court floor, so it only stands up straight from the door you came in by.', clue: 'Step in through the court door and look at the floor ahead.', source: hsW }, { r: 1.6 });
    // the works: the court walls at ground level in gilt between the terracotta pilasters, the upper gallery bays
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = CZ - 9 + i * 6; mounts.push({ position: v(s * (CW / 2 - 0.36), 3.4, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 2.8, z), width: 4.2, height: 2.6, style: 'gilt', wash: true }); }
    for (const x of [-9, -3, 3, 9]) mounts.push({ position: v(x, 3.4, CZ - CD / 2 + 0.36), rotation: 0, target: v(x, 2.8, CZ), width: 4.2, height: 2.6, style: 'gilt', wash: true });
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = CZ - 6 + i * 6; mounts.push({ position: v(s * (CW / 2 - 0.36), 10.2, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 9.5, z), width: 3.2, height: 2.0, style: 'gilt', wash: false }); }
    for (const x of [-12, 12]) mounts.push({ position: v(x, 5.4, FZ + 0.42), rotation: 0, target: v(x, 4, FZ + 12), width: 4.6, height: 2.7, style: 'gilt', wash: false });
    return { mounts, spawn: v(-6, 3, 44), look: v(0, 10, FZ), eye: 3, bounds: [-CW / 2 + 1, CW / 2 - 1, CZ - CD / 2 + 1, 56], style: 'gilt', floorY: (x, z) => { if (x > CW / 2 - 2.8 && x < CW / 2 - 0.3 && z < CZ + CD / 2 - 1 && z > CZ + CD / 2 - 19.5) return Math.min(6.8, ((CZ + CD / 2 - 1 - z) / 18.5) * 6.8); if (x > CW / 2 - 3.2 && x < CW / 2 - 0.3 && z <= CZ + CD / 2 - 19.5 && z > CZ - CD / 2) return 7.2; if (z > CZ - CD / 2 && z < CZ - CD / 2 + 3 && Math.abs(x) < CW / 2 - 0.6) return 7.2; return 0; } };
  },
};

/* ---------------- 99 THE STUDIO MUSEUM ---------------- */
export const studiomuseum: RoomDef = {
  id: 'studiomuseum',
  name: 'The new building on 125th',
  area: 'THE STUDIO MUSEUM IN HARLEM',
  mood: 'Opening on 125th Street',
  color: '#d88a3a',
  description: 'One hundred twenty fifth Street with its music, the new building\'s stacked concrete terraces and the inverted stoop, the tall gallery inside, the works on the walls of Harlem\'s museum.',
  signatures: 'The new building\'s facade of layered concrete frames stepping back, the inverted stoop that opens the ground floor to the street as bleacher seating, the double height gallery, the roof terrace, the avenue with its vendors and the Apollo down the block.',
  build(k, ctx) {
    /* 2026-11-24 (wave 5d): a deeper late afternoon sky and thinner haze */
    k.sky({ top: 0x4f80c8, horizon: 0xe8dcc8, ground: 0x6a6a66, fog: 0.0011, sun: { az: 4.2, el: 0.5, color: 0xffe6c0, size: 14 }, env: 0.95 });
    k.hemi(0xfff0e0, 0x5a4a38, 0.85);
    k.sun(0xffe0b8, 2.3, -50, 46, 40, true, 90);
    /* wave 5d: scanned CC0 surfaces (Poly Haven): the grey precast as brushed concrete in two tones, a polished concrete
       gallery floor, white stucco walls, oak for the stoop seats and the vendors, concrete pavers on 125th */
    const conc = sc(k, 'studiomuseum', 'conc', 3, () => X.concrete(0x9a948a, 163), { roughness: 0.8, color: 0xffffff }, 0xb8b2a8), concD = sc(k, 'studiomuseum', 'conc', 3, () => X.concrete(0x7a746a, 164), { roughness: 0.85, color: 0xd4d0c8 }, 0x9a948a),
      floorC = sc(k, 'studiomuseum', 'conc', 4, () => X.concrete(0xb8b4ac, 165), { roughness: 0.4, color: 0xe4e0d8 }, 0xb0aca4), white = sc(k, 'studiomuseum', 'stucco', 3, () => X.plaster(0xf6f6f4, 166), { roughness: 0.9, color: 0xfaf9f6 }, 0xe6e4de),
      glass = k.glass(0xbcd0dc, 0.3, 0.05), dark = k.flat(0x1a1c20, 0.5, 0.6), wood = sc(k, 'studiomuseum', 'wood', 1.6, () => X.planks(0x8a6a48, 5, 305), { roughness: 0.6 }, 0x8a6a48);
    k.box(62, 0.1, 25, -49.2, -0.03, 17.5, sc(k, 'studiomuseum', 'walk', 1.8, () => X.pavers(0x8e8b84, 5), { roughness: 0.85 }, 0x7e7b74));
    street(k, { w: 26, len: 200, z: 30, x: 0 });
    blockFront(k, { x: 52, z0: 130, count: 14, face: -1, seed: 306, h: [10, 18] });
    blockFront(k, { x: -52, z0: 130, count: 6, face: 1, seed: 307, h: [10, 16] });
    for (let i = 0; i < 6; i++) { const x = -60 + i * 24; k.box(2.4, 1.0, 1.2, x, 0.5, 20, wood); k.box(2.6, 0.06, 1.4, x, 1.04, 20, k.flat([0xe83a3a, 0xf1c531, 0x3aa06a][i % 3], 0, 0.8)); for (const dx of [-1.2, 1.2]) k.box(0.06, 2.6, 0.06, x + dx, 1.3, 20, dark); k.box(2.6, 0.06, 1.6, x, 2.6, 20, k.flat([0xe83a3a, 0xf1c531, 0x3aa06a][(i + 1) % 3], 0, 0.8)); k.keepOut.push({ x, z: 20, r: 1.6 }); }
    // the building: concrete frames stepping back, the inverted stoop as bleacher steps under the facade, the gallery
    const BX = -30, BZ = -10, BW = 34, BD = 30;
    const frames: [number, number][] = [[BW, 12], [BW - 4, 8], [BW - 8, 8], [BW - 14, 6]];
    let y = 0;
    frames.forEach(([w, h], i) => { k.box(w, h, BD - i * 3, BX, y + h / 2, BZ - i * 1.5, i % 2 ? concD : conc); for (let x = -w / 2; x <= w / 2; x += 4) k.box(0.8, h, 0.6, BX + x, y + h / 2, BZ + BD / 2 - i * 3 + 0.4, concD); k.box(w - 2, h - 1, 0.2, BX, y + h / 2, BZ + BD / 2 - i * 3 + 0.05, glass); y += h; });
    for (let i = 0; i < 6; i++) { k.box(BW - 4, 0.5, 1.2, BX, 0.25 + i * 0.5, BZ + BD / 2 + 1 + i * 1.2, conc); k.box(BW - 4, 0.6, 0.06, BX, 0.55 + i * 0.5, BZ + BD / 2 + 0.4 + i * 1.2, dark); }
    k.block(BX - BW / 2, BX - 2.2, BZ + BD / 2 - 0.4, BZ + BD / 2 + 0.6); k.block(BX + 2.2, BX + BW / 2, BZ + BD / 2 - 0.4, BZ + BD / 2 + 0.6);
    k.sign('THE STUDIO MUSEUM IN HARLEM', 10, 0.8, BX, 10, BZ + BD / 2 + 0.44, '#1a1c20', '#f4f0e8', 80, 0, { border: true });
    /* wave 5d: transoms across every glazed frame, oak seats on the inverted stoop, a street that is furnished: real
       lamps, coffee carts and a mailbox (Poly Haven and our own models, CC0), a street sign, a hydrant */
    { const tr: number[][] = []; let yy = 0; frames.forEach(([w, h], i) => { for (let t = yy + 3; t < yy + h - 0.5; t += 3) tr.push([BX, t, BZ + BD / 2 - i * 3 + 0.18, w - 2, 0.12, 0.1]); yy += h; }); bars(k, dark, tr); }
    for (let i = 0; i < 6; i++) k.box(BW - 4.4, 0.06, 0.7, BX, 0.53 + i * 0.5, BZ + BD / 2 + 1.25 + i * 1.2, wood);
    { const fl: number[][] = []; let yy = frames[0][1]; frames.forEach(([w, h], i) => { if (!i) return; const d = BD - i * 3, ex = BX + w / 2 + 0.2, cz = BZ - i * 1.5; for (let z = -d / 2 + 2; z < d / 2; z += 4) fl.push([ex + 0.2, yy + h / 2, cz + z, 0.6, h, 0.8]); k.box(0.2, h - 1, d - 2, ex - 0.15, yy + h / 2, cz, glass); yy += h; }); bars(k, concD, fl); }
    many(k, 'studiomuseum/ph_street_lamp_01', { height: 5.2 }, [[-66, 0, 24.5, 0], [-50, 0, 24.5, 0], [-34, 0, 24.5, 0], [15.6, 0, 0, -PI / 2], [15.6, 0, 30, -PI / 2], [15.6, 0, 60, -PI / 2], [-15.6, 0, 44, PI / 2], [-15.6, 0, 74, PI / 2]], noShadow);
    for (const [x, z] of [[-66, 24.5], [-50, 24.5], [-34, 24.5], [15.6, 0], [15.6, 30], [15.6, 60], [-15.6, 44], [-15.6, 74]]) k.keepOut.push({ x, z, r: 0.4 });
    many(k, 'studiomuseum/ph_CoffeeCart_01', { width: 2.2 }, [[-54, 0, 23.6, 0], [-30, 0, 23.6, 0]]); k.keepOut.push({ x: -54, z: 23.6, r: 1.4 }, { x: -30, z: 23.6, r: 1.4 });
    many(k, 'studiomuseum/mailbox', { height: 1.3 }, [[-17, 0, 26, PI / 2]]); k.keepOut.push({ x: -17, z: 26, r: 0.5 });
    k.prop('hydrant', -16.6, 0, 12, { height: 0.8, keepOut: 0.4 });
    { k.cyl(0.06, 3.6, -17, 1.8, 28.5, dark, 0.06, 8); hsign(k, 'W 125 ST', 1.7, 0.32, -17, 3.4, 28.5, PI / 4, { fg: '#ffffff', bg: '#1e5a36', size: 0.62 }); hsign(k, 'MALCOLM X BLVD', 2.1, 0.32, -17, 3.02, 28.5, -PI / 4, { fg: '#ffffff', bg: '#1e5a36', size: 0.6 }); k.keepOut.push({ x: -17, z: 28.5, r: 0.3 }); }
    /* the one trick: HARLEM painted long across the avenue stands up for whoever arrives, facing the museum */
    floorTrick(k, 'HARLEM', '#f4efe4', 0, 26, 3, 0.02, 0.695, 7, 5.2, 1.5);
    /* Firefly plate queued: a Harlem mural on the museum's east flank, facing the arrival (bare precast until it lands) */
    fireflyPlate(k, 'assets/museum/tex/studiomuseum/ff_harlem_mural.webp', 24, 9, BX + BW / 2 + 0.06, 6, BZ - 9, PI / 2, conc);
    mlowBanner(k, BX - 12, 6, BZ + BD / 2 + 0.7, 0, 3.0, true); blossomFlag(k, BX + 12, 6, BZ + BD / 2 + 0.7, 0, 2.6, 5, 'ink');
    const GW = BW - 2, GD = BD - 2, GH = 11;
    k.box(GW, 0.3, GD, BX, 0.15, BZ, floorC);
    for (const s of [-1, 1]) { k.box(0.4, GH, GD, BX + s * GW / 2, GH / 2, BZ, white); k.block(BX + s * GW / 2 - 0.4, BX + s * GW / 2 + 0.4, BZ - GD / 2, BZ + GD / 2); }
    k.box(GW, GH, 0.4, BX, GH / 2, BZ - GD / 2, white); k.block(BX - GW / 2, BX + GW / 2, BZ - GD / 2 - 0.4, BZ - GD / 2 + 0.4);
    k.box(GW, 0.4, GD, BX, GH, BZ, concD);
    for (let x = -12; x <= 12; x += 8) for (let z = -10; z <= 10; z += 10) k.point(BX + x, GH - 1, BZ + z, 0xfff4e8, 16, 12);
    /* wave 5d: the light work high on the east wall, after Tom Lloyd's 1968 opening show: three aluminium boxes of
       coloured bulbs that run their own sequence; ceiling coffers of the precast frame overhead */
    { const n = 3 * 16, lg = new T.InstancedMesh(new T.SphereGeometry(0.16, 10, 8), new T.MeshBasicMaterial({ color: 0xffffff }), n), m4 = new T.Matrix4(), cols = [0xff3a3a, 0xffc020, 0x3a8aff, 0x30e080, 0xff5ad0, 0xfff4e0], c = new T.Color();
      for (let p = 0; p < 3; p++) { const z = BZ - 8 + p * 5.5; k.box(0.3, 2.6, 2.6, BX + GW / 2 - 0.35, 9.2, z, k.flat(0x9aa0a8, 0.9, 0.35)); for (let i = 0; i < 16; i++) { m4.makeTranslation(BX + GW / 2 - 0.55, 8.25 + Math.floor(i / 4) * 0.62, z - 0.93 + (i % 4) * 0.62); lg.setMatrixAt(p * 16 + i, m4); lg.setColorAt(p * 16 + i, c.setHex(cols[(i + p) % cols.length])); } }
      lg.frustumCulled = false; k.add(lg);
      if (!ctx.reduced) k.ticks.push((t) => { for (let i = 0; i < n; i++) { const on = Math.sin(t * 2.2 + i * 1.7) > -0.3; lg.setColorAt(i, c.setHex(on ? cols[(i + Math.floor(t * 0.8)) % cols.length] : 0x202020)); } if (lg.instanceColor) lg.instanceColor.needsUpdate = true; }); }
    { const cf: number[][] = []; for (let x = -GW / 2 + 4; x < GW / 2; x += 4) cf.push([BX + x, GH - 0.5, BZ, 0.3, 0.6, GD]); for (let z = -GD / 2 + 4; z < GD / 2; z += 4) cf.push([BX, GH - 0.5, BZ + z, GW, 0.6, 0.3]); bars(k, concD, cf); }
    k.box(0.4, 6, 10, BX - 4, 3, BZ - 4, white); k.block(BX - 4.4, BX - 3.6, BZ - 9, BZ + 1);
    k.box(GW, 0.4, 6, BX, 5.8, BZ - GD / 2 + 3, floorC); k.box(0.1, 1.1, GW, BX, 6.5, BZ - GD / 2 + 6, glass);
    for (let i = 0; i < 16; i++) k.box(2.4, 0.36, 0.9, BX + GW / 2 - 1.5, 0.18 + i * 0.36, BZ + 4 - i * 0.9, floorC);
    k.block(BX + GW / 2 - 2.8, BX + GW / 2 - 0.3, BZ - GD / 2 + 6, BZ + 4.5);
    eyeMedallion(k, BX, 0.16, BZ + 8, 2);
    donorWall(k, BX, 3.6, BZ - GD / 2 + 0.22, 0, 9, true);
    wordmarkRelief(k, BX, 8.6, BZ - GD / 2 + 0.24, 0, 5);
    k.prop('museum_bench', BX + 6, 0.15, BZ + 2, { height: 0.58, keepOut: 1.4 }); k.prop('bronze_figure', BX + 8, 0.15, BZ - 8, { height: 3, keepOut: 1.2 });
    k.crowd([v(-60, 0, 14), v(-20, 0, 14), v(20, 0, 14), v(60, 0, 14)], 30, { seed: 133, speed: 0.9, spread: 3, animate: !ctx.reduced, colors: [0xf08a2a, 0xf1c531, 0x3aa06a, 0xe83a3a, 0x24262c, 0xf4f0e8, 0x8a3ad8] });
    k.crowd([v(BX - 10, 0.15, BZ + 10), v(BX + 4, 0.15, BZ), v(BX - 8, 0.15, BZ - 10)], 12, { seed: 134, speed: 0.3, spread: 2, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da, 0xf08a2a] });
    k.crowd([v(BX - 12, 1.2, BZ + BD / 2 + 3), v(BX + 12, 1.8, BZ + BD / 2 + 4.6)], 12, { seed: 135, speed: 0.05, spread: 1.4, animate: !ctx.reduced });
    k.censusWall({ x: BX - GW / 2 + 0.22, y: 5.6, z: BZ + 4, rotY: PI / 2, cols: 30, rows: 6, tile: 0.55, gap: 0.05, start: ctx.wallStart(2000, 180), pieces: ctx.all, backing: dark });
    /* the landmark eggs: the Studio Museum, from a loft to its own building */
    const smW = { name: 'Studio Museum in Harlem, Wikipedia', url: 'https://en.wikipedia.org/wiki/Studio_Museum_in_Harlem' };
    k.egg(v(BX + 6, 1.8, BZ + BD / 2 + 3.4), { id: 'studiomuseum-stoop', title: 'An upside down stoop', year: '2025', text: 'The new building is organised round a feature like an inverted staircase, a nod to the stoops of the houses nearby. Its front is glass and grey precast concrete.', clue: 'Sit on the steps that face the street.', source: smW }, { r: 1.6 });
    k.egg(v(BX, 35, BZ + 6.6), { id: 'studiomuseum-seven-storeys', title: 'Seven storeys on 125th', year: '2025', text: 'The new building opened on November 15, 2025, at a cost of $160 million. It is seven storeys high, with five storeys of exhibition space covering 82,000 square feet and a roof terrace on top.', clue: 'Look up past the stepped frames to the roof terrace.', source: smW }, { r: 2.4 });
    k.egg(v(20, 1.4, 23), { id: 'studiomuseum-loft', title: 'A rented loft', year: '1968', text: 'The museum opened in 1968 in a rented loft at 2033 Fifth Avenue, at 125th Street, and moved to its present site at 144 West 125th Street in 1982.', clue: 'Walk east along 125th toward Fifth Avenue.', source: smW }, { r: 1.6 });
    k.egg(v(BX + 6, 2.0, BZ - 4), { id: 'studiomuseum-tom-lloyd', title: 'The first show was light', year: '1968', text: 'The first exhibition, in September 1968, showed Tom Lloyd\'s light works, and the 2025 reopening returned to his work.', clue: 'Stand in the tall gallery and look at the light.', source: smW }, { r: 1.6 });
    k.egg(v(BX - 6, 7.4, BZ - GD / 2 + 3), { id: 'studiomuseum-residency', title: 'The studio in the name', text: 'Every year the museum gives an eleven month studio residency to three emerging artists, who must work in the studio at least 20 hours a week. The programme has supported more than one hundred artists.', clue: 'Climb to the mezzanine where the studios would be.', source: smW }, { r: 1.6 });
    k.egg(v(-10, 1.2, 15), { id: 'studiomuseum-ringgold', title: 'The old building in mosaic', text: 'A mosaic by Faith Ringgold in the nearby 125th Street subway station depicts the museum\'s previous building.', clue: 'Head for the subway steps on the avenue.', source: smW }, { r: 1.6 });
    k.egg(v(-4.6, 0.6, 20.6), { id: 'studiomuseum-harlem', title: 'HARLEM, from the corner', year: '1968', text: 'The museum opened in 1968 at Fifth Avenue and 125th Street and moved to West 125th in 1982. The word on the street is painted long and thin, so it only stands up straight for someone arriving at the corner and facing the museum.', clue: 'Stand where you arrived and look at the street between you and the stoop.', source: smW }, { r: 1.6 });
    // the works: the tall gallery walls, the free wall, the mezzanine, the street facing bleacher wall
    const mounts: Mount[] = [];
    for (let i = 0; i < 3; i++) { const z = BZ - 8 + i * 8; mounts.push({ position: v(BX + GW / 2 - 0.22, 3.6, z), rotation: -PI / 2, target: v(BX, 3, z), width: 4.6, height: 2.7, style: 'white', wash: true }); }
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const z = BZ - 6 + i * 5; mounts.push({ position: v(BX - 4 + s * 0.22, 3.2, z), rotation: s < 0 ? -PI / 2 : PI / 2, target: v(BX - 4 + s * 6, 3, z), width: 4.0, height: 2.4, style: 'white', wash: true }); }
    for (const x of [-10, -3, 4, 11]) mounts.push({ position: v(BX + x, 3.4, BZ - GD / 2 + 0.22), rotation: 0, target: v(BX + x, 3, BZ), width: 4.4, height: 2.6, style: 'white', wash: true });
    for (const x of [-10, 0, 10]) mounts.push({ position: v(BX + x, 8.4, BZ - GD / 2 + 0.22), rotation: 0, target: v(BX + x, 7.5, BZ - 4), width: 4.4, height: 2.4, style: 'white', wash: false });
    /* wave 5d: the first street panel stood outside the room's bounds; it moves in to x -42 */
    for (let i = 0; i < 4; i++) { const x = i ? -60 + i * 24 + 12 : -42; k.box(0.3, 3.2, 4.6, 0, 0, 0, dark).position.set(x, 2.2, 28.8); mounts.push({ position: v(x, 2.3, 28.62), rotation: PI, target: v(x, 2.5, 20), width: 4.2, height: 2.5, style: 'black', wash: false }); }
    return { mounts, spawn: v(0, 3, 26), look: v(BX, 12, BZ), eye: 3, bounds: [BX - GW / 2 + 0.8, 70, BZ - GD / 2 + 1, 36], style: 'white', floorY: (x, z) => { if (x > BX + GW / 2 - 2.8 && x < BX + GW / 2 - 0.3 && z < BZ + 4.5 && z > BZ - 10) return Math.min(5.7, ((BZ + 4.5 - z) / 14.4) * 5.7); if (z > BZ - GD / 2 && z < BZ - GD / 2 + 6 && x > BX - GW / 2 && x < BX + GW / 2) return 6; if (Math.abs(x - BX) < BW / 2 - 2 && z > BZ + BD / 2 + 0.4 && z < BZ + BD / 2 + 7.6) return 0.5 + Math.floor((z - (BZ + BD / 2 + 0.4)) / 1.2) * 0.5; return 0; } };
  },
};

/* ---------------- 100 EL MUSEO DEL BARRIO ---------------- */
export const elmuseo: RoomDef = {
  id: 'elmuseo',
  name: 'The courtyard on Fifth',
  area: 'EL MUSEO DEL BARRIO',
  mood: 'Three Kings Day',
  color: '#e8a030',
  description: 'Fifth Avenue at 104th, the Heckscher building\'s courtyard with its fountain and the bandstand, the galleries behind their arches, the Three Kings Day parade of camels and kings, the works in colour.',
  signatures: 'The red brick and limestone building with its arcaded ground floor, the courtyard with a fountain and palms, the ornate theater doors, the Three Kings Day parade with puppets, camels and the paper crowns, the park across the avenue.',
  build(k, ctx) {
    /* 2026-11-24 (wave 5d): a clear January sky instead of the white haze */
    k.sky({ top: 0x4a7fca, horizon: 0xd6dee4, ground: 0x6a6a66, fog: 0.0011, sun: { az: 3.2, el: 0.6, color: 0xfff6e8, size: 12 }, env: 1.0 });
    k.hemi(0xf2f6ff, 0x5a5a58, 0.85);
    k.sun(0xfff2dc, 2.3, 30, 70, 40, true, 90);
    /* wave 5d: scanned CC0 surfaces (Poly Haven): red brick, limestone block, terrazzo in the courtyard, a lawn for the
       park, and white stucco washed in the courtyard's three colours */
    const brick = sc(k, 'elmuseo', 'brick', 1.3, () => X.brick(0x8a4a3a, 308), { roughness: 0.85 }, 0x7a4234), lime = sc(k, 'elmuseo', 'lime', 2.2, () => X.ashlar(0xd8d0bc, 309, 4), { roughness: 0.8 }, 0xc8c0ac), floorT = sc(k, 'elmuseo', 'floor', 1.6, () => X.terrazzo(0xc8b8a0, 167), { roughness: 0.4 }, 0xa08a70),
      dark = k.flat(0x1a1c20, 0.5, 0.6), glass = k.glass(0xdcecf6, 0.14, 0.04), gold = k.pbr('emGold', X.gilt(0xd0a852), 2, { metalness: 0.85, roughness: 0.3 }), waterM = k.flat(0x88aacc, 0.3, 0.2, { transparent: true, opacity: 0.6 }),
      pinkW = sc(k, 'elmuseo', 'stucco', 2.4, () => X.plaster(0xd85a7a, 168), { roughness: 0.9, color: 0xe06a88 }, 0xc85a78), yellowW = sc(k, 'elmuseo', 'stucco', 2.4, () => X.plaster(0xe8b040, 169), { roughness: 0.9, color: 0xf0b848 }, 0xd8a040), tealW = sc(k, 'elmuseo', 'stucco', 2.4, () => X.plaster(0x2a8a8a, 170), { roughness: 0.9, color: 0x2a9a98 }, 0x2a8a8a), white = k.flat(0xf4f0e8, 0, 0.7);
    street(k, { w: 24, len: 160, z: 40, x: 0 });
    k.box(160, 0.4, 200, 100, -0.2, 0, sc(k, 'elmuseo', 'lawn', 4, () => X.grass(0x4a6a3a, 171), { roughness: 0.95, color: 0xb8b090 }, 0x5a6040)); k.rail(18, 0, 160, dark, 1.0, 'z', 2.4); k.block(17.6, 18.4, -80, 80);
    const rnd = X.mulberry(100); for (let i = 0; i < 30; i++) k.tree(24 + rnd() * 60, 0, -80 + rnd() * 160, { kind: 'bare', h: 8 + rnd() * 6, r: 3 + rnd() * 2, seed: i, species: i % 3 ? 'elm' : 'oak' });
    // the building around its courtyard: arcaded ground floor, the theater doors, the fountain, palms
    const BX = -34, BZ = 0, BW = 44, CW = 20;
    for (const [x, z, w, d] of [[BX, BZ - BW / 2 + 6, BW, 12], [BX - BW / 2 + 6, BZ, 12, BW - 24], [BX, BZ + BW / 2 - 6, BW, 12]]) k.box(w, 18, d, x, 9, z, brick);
    k.box(BW + 0.4, 3, BW + 0.4, BX, 1.5, BZ, lime); k.box(BW + 0.4, 1.0, BW + 0.4, BX, 17.6, BZ, lime);
    for (let i = 0; i < 5; i++) { const z = BZ - 16 + i * 8; k.arch(2.6, 4.4, 1.4, BX + BW / 2, 0, z, lime, false, 0.8).rotation.y = PI / 2; k.box(0.1, 3.6, 2.2, BX + BW / 2 - 0.2, 2.2, z, glass); }
    k.block(BX + BW / 2 - 1, BX + BW / 2 + 1, BZ - BW / 2, BZ - 1.4); k.block(BX + BW / 2 - 1, BX + BW / 2 + 1, BZ + 1.4, BZ + BW / 2);
    for (let f = 1; f < 4; f++) for (let i = 0; i < 9; i++) { const y = 5.6 + f * 3.6, z = BZ - 20 + i * 5; k.box(0.16, 2.4, 1.6, BX + BW / 2 + 0.02, y, z, lime); k.box(0.06, 2.0, 1.2, BX + BW / 2 + 0.1, y, z, glass); }
    k.sign('EL MUSEO DEL BARRIO', 8, 0.8, BX + BW / 2 + 0.06, 6.4, BZ, 'transparent', '#3a3020', 80, PI / 2);
    mlowBanner(k, BX + BW / 2 + 0.5, 12, BZ - 12, PI / 2, 3.0, true); blossomFlag(k, BX + BW / 2 + 0.5, 12, BZ + 12, PI / 2, 2.6, 5, 'electric');
    k.box(CW, 0.3, CW, BX, 0.15, BZ, floorT);
    /* since 2009 the old open courtyard is roofed in glass as the lobby, cafe and performance space */
    k.box(CW + 0.8, 0.2, CW + 0.8, BX, 8.1, BZ, glass); for (let x = -CW / 2; x <= CW / 2; x += 2.5) k.box(0.12, 0.3, CW + 0.8, BX + x, 8.3, BZ, dark);
    k.mesh(new T.CylinderGeometry(3, 3.2, 0.8, 32), lime, BX, 0.4, BZ); k.mesh(new T.CylinderGeometry(2.6, 2.6, 0.2, 32), waterM, BX, 0.85, BZ); k.keepOut.push({ x: BX, z: BZ, r: 3.4 });
    /* wave 5d: the fountain is a real tiered model (our Central Park cast, CC0) in the basin; potted palms (the same set)
       in the corners clear of the works; four crystal chandeliers under the glass (Poly Haven, CC0); real lamps and
       park benches on Fifth; the parade gets its banner across the avenue */
    k.prop('cp_fountain', BX, 0.55, BZ, { height: 3.4 });
    const spray = k.mesh(new T.CylinderGeometry(0.05, 0.14, 1.2, 6), waterM, BX, 4.3, BZ, true); if (!ctx.reduced) k.ticks.push((t) => { spray.scale.y = 0.7 + 0.3 * Math.sin(t * 1.6); });
    for (const [x, z] of [[BX - 8.4, BZ - 8.4], [BX + 8.4, BZ - 8.4], [BX - 8.4, BZ + 8.4], [BX + 8.4, BZ + 8.4]]) k.prop('cp_palm', x, 0.3, z, { height: 4.0, keepOut: 1.0 });
    { const ch: number[][] = []; for (const x of [-5, 5]) for (const z of [-5, 5]) { ch.push([BX + x, 5.9, BZ + z, 0]); k.beam(v(BX + x, 8.1, BZ + z), v(BX + x, 7.0, BZ + z), 0.02, gold, 4); } many(k, 'elmuseo/ph_Chandelier_02', { height: 1.2 }, ch, noShadow); for (const x of [-5, 5]) k.point(BX + x, 5.6, BZ, 0xffe6c0, 14, 10); }
    many(k, 'elmuseo/ph_street_lamp_01', { height: 5.2 }, [-60, -36, -12, 12, 36, 60].map((z) => [15.6, 0, z, -PI / 2]), noShadow); for (const z of [-60, -36, -12, 12, 36, 60]) k.keepOut.push({ x: 15.6, z, r: 0.4 });
    for (const z of [-60, -20, 20, 60]) k.prop('cp_bench', 16.8, 0, z, { height: 0.85, rotY: -PI / 2, keepOut: 1.0 });
    { const purple = k.flat(0x5a2a8a, 0.1, 0.6); for (const sx of [-1, 1]) k.cyl(0.12, 8, sx * 12.6, 4, -30, purple, 0.12, 8); k.box(25.2, 0.12, 0.12, 0, 7.7, -30, purple); hsign(k, 'TRES REYES MAGOS', 14, 1.5, 0, 6.7, -29.94, 0, { fg: '#f6d65a', bg: '#4a1e7a', border: '#f6d65a', size: 0.6 }); hsign(k, 'TRES REYES MAGOS', 14, 1.5, 0, 6.7, -30.06, PI, { fg: '#f6d65a', bg: '#4a1e7a', border: '#f6d65a', size: 0.6 }); k.keepOut.push({ x: -12.6, z: -30, r: 0.3 }, { x: 12.6, z: -30, r: 0.3 }); }
    { k.cyl(0.06, 3.6, 13.4, 1.8, 3, dark, 0.06, 8); hsign(k, '5 AV', 1.3, 0.32, 13.4, 3.4, 3, PI / 4, { fg: '#ffffff', bg: '#1e5a36', size: 0.62 }); hsign(k, 'E 104 ST', 1.6, 0.32, 13.4, 3.02, 3, -PI / 4, { fg: '#ffffff', bg: '#1e5a36', size: 0.62 }); k.keepOut.push({ x: 13.4, z: 3, r: 0.3 }); }
    /* the one trick: DIA DE REYES painted long down the avenue stands up for whoever waits mid avenue for the kings */
    floorTrick(k, 'DIA DE REYES', '#f6d65a', 0, 10, 3, 0.02, 0, 8, 8, 1.9);
    /* Firefly plate queued: a frieze of vejigante masks over the courtyard's pink wall (plain pink until it lands) */
    fireflyPlate(k, 'assets/museum/tex/elmuseo/ff_vejigante_frieze.webp', 18, 2.2, BX, 6.6, BZ + CW / 2 - 0.24, PI, pinkW);
    for (const s of [-1, 1]) { const w = k.box(0.4, 8, CW, BX + s * CW / 2, 4, BZ, s < 0 ? pinkW : yellowW); void w; k.block(BX + s * CW / 2 - 0.4, BX + s * CW / 2 + 0.4, BZ - CW / 2, BZ + CW / 2); }
    k.box(CW, 8, 0.4, BX, 4, BZ - CW / 2, tealW); k.block(BX - CW / 2, BX - 1.8, BZ - CW / 2 - 0.4, BZ - CW / 2 + 0.4); k.block(BX + 1.8, BX + CW / 2, BZ - CW / 2 - 0.4, BZ - CW / 2 + 0.4);
    k.box(3.6, 5, 0.6, BX, 2.5, BZ - CW / 2 + 0.4, gold); k.arch(2.2, 4, 0.8, BX, 0, BZ - CW / 2 + 0.4, gold, false, 0.85);
    k.box(CW, 8, 0.4, BX, 4, BZ + CW / 2, pinkW); k.block(BX - CW / 2, BX + CW / 2, BZ + CW / 2 - 0.4, BZ + CW / 2 + 0.4);
    k.block(BX - CW / 2 - 4, BX - CW / 2 - 3, BZ - CW / 2, BZ + CW / 2);
    eyeMedallion(k, BX, 0.16, BZ + 7, 1.6);
    donorWall(k, BX, 6.4, BZ - CW / 2 + 0.22, 0, 9, false);
    // the parade on the avenue: three kings on camels, puppets, the paper crowns
    const camel = (x: number, z: number, i: number) => { const g = new T.Group(); const body = new T.Mesh(new T.SphereGeometry(1, 16, 10), k.flat(0xc8a878, 0, 0.8)); body.scale.set(0.7, 0.8, 1.4); body.position.y = 1.8; g.add(body); const hump = new T.Mesh(new T.SphereGeometry(0.6, 12, 8), k.flat(0xc8a878, 0, 0.8)); hump.position.set(0, 2.5, -0.2); g.add(hump); const neck = new T.Mesh(new T.CylinderGeometry(0.22, 0.3, 1.8, 8), k.flat(0xc8a878, 0, 0.8)); neck.position.set(0, 2.6, 1.3); neck.rotation.x = -0.5; g.add(neck); const head = new T.Mesh(new T.BoxGeometry(0.4, 0.4, 0.7), k.flat(0xc8a878, 0, 0.8)); head.position.set(0, 3.4, 1.9); g.add(head); for (const sx of [-1, 1]) for (const sz of [-0.8, 0.8]) { const leg = new T.Mesh(new T.CylinderGeometry(0.1, 0.12, 1.8, 6), k.flat(0xb89868, 0, 0.8)); leg.position.set(sx * 0.4, 0.9, sz); g.add(leg); } const king = new T.Mesh(new T.CapsuleGeometry(0.28, 0.9, 3, 8), k.flat([0x8a3ad8, 0xe83a3a, 0x3aa06a][i], 0, 0.8)); king.position.set(0, 3.2, -0.6); g.add(king); const crown = new T.Mesh(new T.CylinderGeometry(0.22, 0.2, 0.3, 8), k.pbr('emGold', X.gilt(0xd0a852), 2)); crown.position.set(0, 4.0, -0.6); g.add(crown); g.position.set(x, 0, z); k.add(g); return g; };
    const kings = [camel(-4, -50, 0), camel(0, -58, 1), camel(4, -66, 2)];
    if (!ctx.reduced) k.ticks.push((t, dt) => kings.forEach((g, i) => { g.position.z += 1.0 * Math.min(dt, 0.1); if (g.position.z > 80) g.position.z = -80; g.position.y = 0.1 * Math.abs(Math.sin(t * 3 + i)); }));
    k.crowd([v(-6, 0, -80), v(-6, 0, 80)], 30, { seed: 136, speed: 1.0, spread: 2, animate: !ctx.reduced, colors: [0xf08a2a, 0xf1c531, 0x3aa06a, 0xe83a3a, 0x8a3ad8, 0xf4f0e8] });
    k.crowd([v(6, 0, -80), v(6, 0, 80)], 30, { seed: 137, speed: 1.0, spread: 2, animate: !ctx.reduced, colors: [0xf08a2a, 0xf1c531, 0x3aa06a, 0xe83a3a, 0x8a3ad8, 0xf4f0e8] });
    for (let i = 0; i < 20; i++) { const x = -60 + rnd() * 100, z = -70 + rnd() * 140; if (Math.abs(x) < 14 || (x < BX + BW / 2 + 2 && x > BX - BW / 2 - 2)) continue; void x; void z; }
    k.crowd([v(BX + 4, 0.15, BZ + 6), v(BX - 6, 0.15, BZ - 6), v(BX + 6, 0.15, BZ - 6)], 10, { seed: 138, speed: 0.3, spread: 1.6, animate: !ctx.reduced, colors: [0xf08a2a, 0xf1c531, 0x24262c, 0xf4f0e8] });
    k.censusWall({ x: BX - CW / 2 + 0.22, y: 4.4, z: BZ, rotY: PI / 2, cols: 24, rows: 5, tile: 0.5, gap: 0.05, start: ctx.wallStart(3200, 120), pieces: ctx.all, backing: dark });
    /* the landmark eggs: El Museo, its children's theatre and its parade */
    const emW = { name: 'El Museo del Barrio, Wikipedia', url: 'https://en.wikipedia.org/wiki/El_Museo_del_Barrio' }, emC = { name: 'Museo del Barrio restores its historic children\'s theater, Commercial Observer', url: 'https://commercialobserver.com/2020/02/museo-del-barrio-restores-its-historic-childrens-theater/' }, emA = { name: 'The 47th annual Three Kings Day Parade warmed hearts in frigid weather, amNY', url: 'https://www.amny.com/latino/the-47th-annual-three-kings-day-parade-warmed-hearts-in-frigid-weather' };
    k.egg(v(BX + BW / 2 + 2, 2.0, BZ + 6), { id: 'elmuseo-classroom', title: 'It began in a classroom', year: '1969', text: 'The artist and teacher Raphael Montanez Ortiz founded El Museo in 1969 in a public school classroom in East Harlem. It ran from storefronts on Third and Lexington Avenues until 1976, moved into this building in 1977, and joined Museum Mile when the mile launched in 1978.', clue: 'Read the name over the arcade on Fifth.', source: emW }, { r: 1.6 });
    k.egg(v(BX, 2.4, BZ - CW / 2 + 1.4), { id: 'elmuseo-teatro', title: 'A theatre built for children', year: '1922', text: 'The Heckscher Foundation, set up to serve children, built the theatre here as part of its headquarters in 1922. The 600 seat hall has 30 foot murals of fairy tales including Little Red Riding Hood and Cinderella.', clue: 'Stand at the gilded theatre doors.', source: emC }, { r: 1.6 });
    k.egg(v(BX + 5, 3.2, BZ - CW / 2 + 1.2), { id: 'elmuseo-chandeliers', title: 'Castles in storage', text: 'During the restoration a set of original chandeliers shaped like fairytale castles turned up after 20 years in storage, and they now hang on either side of the stage. El Museo set aside a little under $5 million for the work.', clue: 'Look beside the theatre doors and think of the stage behind them.', source: emC }, { r: 1.6 });
    k.egg(v(BX + 4, 1.6, BZ + 4.2), { id: 'elmuseo-glass-courtyard', title: 'The courtyard got a roof', year: '2009', text: 'The 2009 expansion, led by the local architects Gruzen Samton, turned the open courtyard into a glass lobby, cafe and performance space.', clue: 'Stand by the fountain and look up at the glass.', source: emW }, { r: 1.6 });
    k.egg(v(BX - 6, 2.0, BZ + 8), { id: 'elmuseo-santos', title: 'Eight hundred years', text: 'The permanent collection holds over 6,500 pieces spanning more than 800 years, from Taino artifacts to carved santos de palo and vejigante masks. El Museo calls itself the oldest museum in the country dedicated to Latino art.', clue: 'Look along the pink wall of the courtyard.', source: emW }, { r: 1.6 });
    k.egg(v(0, 2.4, 10), { id: 'elmuseo-camels', title: 'Sergeant, Joe and Sandman', year: '2024', text: 'El Museo has honoured Three Kings Day since 1977. For the 47th parade in January 2024 three live camels named Sergeant, Joe and Sandman came from a zoo in Goshen, Connecticut, and the parade ran along Park Avenue from 106th to 115th Street.', clue: 'Wait in the middle of the avenue for the kings to ride past.', source: emA }, { r: 2.4 });
    k.egg(v(0, 0.6, 2), { id: 'elmuseo-dia-de-reyes', title: 'Wait for the kings', year: '1977', text: 'El Museo has honoured Three Kings Day since 1977 with a parade of kings, camels and puppets. The words on the avenue are painted long and thin, so they only stand up straight for someone waiting in the middle of the street for the parade.', clue: 'Stand mid avenue where the kings ride past and look down Fifth.', source: emA }, { r: 1.6 });
    // the works: the coloured courtyard walls in white frames, the arcade piers on the avenue, the theater flank
    const mounts: Mount[] = [];
    /* wave 5d: every courtyard target stood in the fountain; each now stands 3.6 m in front of its own wall */
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = BZ - 6 + i * 6; mounts.push({ position: v(BX + s * (CW / 2 - 0.22), 3.4, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(BX + s * (CW / 2 - 3.8), 3, z), width: 4.2, height: 2.6, style: 'white', wash: true }); }
    for (const x of [-7, 7]) mounts.push({ position: v(BX + x, 3.4, BZ - CW / 2 + 0.22), rotation: 0, target: v(BX + x, 3, BZ - CW / 2 + 3.8), width: 4.2, height: 2.6, style: 'white', wash: true });
    for (const x of [-7, 0, 7]) mounts.push({ position: v(BX + x, 3.4, BZ + CW / 2 - 0.22), rotation: PI, target: v(BX + x, 3, BZ + CW / 2 - 3.8), width: 4.2, height: 2.6, style: 'white', wash: true });
    for (let i = 0; i < 4; i++) { const z = BZ - 12 + i * 8; if (Math.abs(z) < 3) continue; mounts.push({ position: v(BX + BW / 2 + 0.22, 3.0, z), rotation: -PI / 2 + PI, target: v(BX + BW / 2 + 8, 2.6, z), width: 2.6, height: 2.6, style: 'black', wash: false }); }
    /* wave 5d: the three on the park wall faced the park; they face the avenue now */
    for (let i = 0; i < 3; i++) { const z = -40 + i * 40; k.box(0.3, 3, 4.6, 18.4, 1.9, z, dark); mounts.push({ position: v(18.2, 2.0, z), rotation: -PI / 2, target: v(14.4, 2, z), width: 4.2, height: 2.5, style: 'black', wash: false }); }
    return { mounts, spawn: v(2, 3, 20), look: v(BX + BW / 2, 8, BZ), eye: 3, bounds: [BX - CW / 2 + 0.8, 60, -80, 80], style: 'white' };
  },
};

/* ---------------- 101 THE MUSEUM OF THE CITY OF NEW YORK ---------------- */
export const mcny: RoomDef = {
  id: 'mcny',
  name: 'The city\'s museum',
  area: 'MUSEUM OF THE CITY OF NEW YORK',
  mood: 'Museum Mile, the top of the mile',
  color: '#b8a8a0',
  description: 'The red brick Georgian building at 103rd, the marble rotunda with its twin curving stairs, the timeline gallery, the works telling the city\'s own story.',
  signatures: 'The Colonial Revival red brick and marble front with its portico and cupola, the entrance rotunda with two sweeping marble staircases, the New York at its core gallery with its wall of screens, the terrace on Fifth.',
  build(k, ctx) {
    k.sky({ top: 0x7fa0d0, horizon: 0xe8e8e0, ground: 0x5a5a55, fog: 0.0022, sun: { az: 3.4, el: 0.7, color: 0xfff4e6, size: 12 }, env: 0.9 });
    k.hemi(0xfff0dc, 0x4a4038, 0.7);
    k.sun(0xfff0d8, 1.8, 30, 60, 40, true, 70);
    const brick = k.pbr('mcBrick', X.brick(0x8a3a2e, 310), 0.28), marble = k.pbr('mcMarble', X.marble(0xe8e4dc, 0x9a948a, 21), 0.5, { roughness: 0.3 }), lime = k.pbr('mcLime', X.ashlar(0xd8d0bc, 311, 4), 0.25),
      floorT = k.pbr('mcFloor', X.terrazzo(0xc8c0b0, 172), 0.4, { roughness: 0.3 }), dark = k.flat(0x1a1c20, 0.5, 0.6), glass = k.glass(0xdcecf6, 0.14, 0.04), bronze = k.flat(0x4a3a28, 0.8, 0.4), screen = k.glow(0x3a6aff, 0.8), white = k.pbr('mcWhite', X.plaster(0xf4f4f2, 173), 0.4);
    street(k, { w: 24, len: 160, z: 40, x: 0 });
    k.box(160, 0.4, 200, 100, -0.2, 0, k.pbr('mcLawn', X.grass(0x3a5a2a, 174), 0.06)); k.rail(18, 0, 160, dark, 1.0, 'z', 2.4); k.block(17.6, 18.4, -80, 80);
    const rnd = X.mulberry(101); for (let i = 0; i < 30; i++) k.tree(24 + rnd() * 60, 0, -80 + rnd() * 160, { kind: 'round', h: 8 + rnd() * 6, r: 3 + rnd() * 2, leaf: 0x4a7a3c, seed: i });
    const BX = -30, BZ = 0, BW = 34, BD = 40;
    k.box(BW, 16, BD, BX, 8, BZ, brick);
    k.box(BW + 0.4, 2, BD + 0.4, BX, 1, BZ, marble); k.box(BW + 0.6, 1.2, BD + 0.6, BX, 15.6, BZ, marble);
    k.box(10, 8, 6, BX + BW / 2 - 1, 4, BZ, marble); for (let i = 0; i < 4; i++) k.column(BX + BW / 2 + 2.4, 0.1, BZ - 4.5 + i * 3, 6, 0.6, marble, true); k.box(8, 1.4, 8, BX + BW / 2 + 0.8, 6.9, BZ, marble);
    const ped = new T.Shape(); ped.moveTo(-4, 0); ped.lineTo(4, 0); ped.lineTo(0, 2); ped.closePath(); k.mesh(new T.ExtrudeGeometry(ped, { depth: 6 }), marble, BX + BW / 2 + 3.4, 7.6, BZ - 3).rotation.y = PI / 2;
    k.cyl(2.4, 4, BX, 18, BZ, marble, 2.4, 12); k.mesh(new T.SphereGeometry(2.6, 16, 10, 0, PI * 2, 0, PI / 2), k.pbr('mcCopper', X.patina(0x5f9a8c), 0.6), BX, 20, BZ);
    for (let f = 0; f < 3; f++) for (let i = 0; i < 7; i++) { const y = 4 + f * 4.2, z = BZ - 15 + i * 5; if (Math.abs(z) < 3.5 && f === 0) continue; k.box(0.16, 2.6, 1.6, BX + BW / 2 + 0.02, y, z, lime); k.box(0.06, 2.2, 1.2, BX + BW / 2 + 0.1, y, z, glass); }
    k.arch(2.4, 4.2, 1.4, BX + BW / 2 + 0.2, 0, BZ, marble, false, 0.85).rotation.y = PI / 2;
    k.block(BX + BW / 2 - 0.6, BX + BW / 2 + 1.6, BZ - BD / 2, BZ - 1.4); k.block(BX + BW / 2 - 0.6, BX + BW / 2 + 1.6, BZ + 1.4, BZ + BD / 2);
    for (let i = 0; i < 8; i++) k.box(10, 0.3, 1.0, BX + BW / 2 + 4.4, 0.15 + i * 0.3, BZ - 5 + i * 0 + 0, marble), void i;
    for (let i = 0; i < 8; i++) k.box(1.0, 0.3, 10, BX + BW / 2 + 3 + i * 1.0, 0.15 + (7 - i) * 0.3, BZ, marble);
    k.sign('MUSEUM OF THE CITY OF NEW YORK', 9, 0.7, BX + BW / 2 + 4.06, 6.2, BZ, 'transparent', '#3a3020', 70, PI / 2);
    mlowBanner(k, BX + BW / 2 + 0.5, 11, BZ - 12, PI / 2, 3.0, true); blossomFlag(k, BX + BW / 2 + 0.5, 11, BZ + 12, PI / 2, 2.6, 1, 'cloud');
    // the rotunda: two curving marble stairs meeting at the mezzanine, the timeline gallery beyond with its wall of screens
    const RW = BW - 1.2, RD = 20;
    k.box(RW, 0.3, RD, BX, 0.15, BZ, floorT);
    k.block(BX - RW / 2 - 0.6, BX - RW / 2 + 0.2, BZ - RD / 2, BZ + RD / 2);
    k.box(RW, 0.4, RD, BX, 12, BZ, white);
    k.mesh(new T.SphereGeometry(8, 32, 12, 0, PI * 2, 0, PI / 2), k.pbr('mcDome', X.plaster(0xe8e2d4, 175), 0.3, { side: T.BackSide }), BX, 11.8, BZ).scale.y = 0.5;
    k.point(BX, 9, BZ, 0xfff4e6, 60, 30);
    for (const s of [-1, 1]) { const arc: T.Vector3[] = []; for (let i = 0; i <= 40; i++) { const t = i / 40; const a = PI / 2 + s * t * PI * 0.5; arc.push(v(BX - 2 + Math.cos(a) * 8, 0.2 + t * 5.4, BZ + Math.sin(a) * 8 * s * s)); } const sp = k.spline(arc, false, 0.5); const pts = sp.getSpacedPoints(60); const tg = new T.BoxGeometry(2.2, 0.14, 0.32), tm: T.Matrix4[] = []; const tan = new T.Vector3(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0); for (let i = 0; i < 60; i++) { const p = pts[i]; sp.getTangentAt(i / 60, tan); q.setFromAxisAngle(up, Math.atan2(tan.x, tan.z)); tm.push(new T.Matrix4().compose(p.clone().add(v(0, -0.15, 0)), q, new T.Vector3(1, 1, 1))); } k.instances(tg, marble, tm); k.curve(pts.filter((_, i) => i % 2 === 0).map((p) => v(BX - 2 + (p.x - BX + 2) * 1.14, p.y + 0.95, BZ + (p.z - BZ) * 1.14)), 0.035, bronze, 30); }
    k.box(RW - 4, 0.4, 6, BX - 4, 5.6, BZ, marble); k.block(BX - RW / 2, BX + RW / 2 - 4, BZ - 3, BZ + 3);
    k.prop('balustrade', BX - 4, 5.8, BZ + 3.1, { height: 1.0 }); k.prop('balustrade', BX - 4, 5.8, BZ - 3.1, { height: 1.0 });
    eyeMedallion(k, BX + 6, 0.16, BZ, 2.4);
    donorWall(k, BX, 8.4, BZ - RD / 2 + 0.36, 0, 9, false);
    const TZ = BZ - RD / 2 - 8;
    k.box(RW, 0.3, 14, BX, 0.15, TZ, floorT); k.block(BX - RW / 2 - 0.6, BX - RW / 2 + 0.2, TZ - 7, TZ + 7); k.block(BX - RW / 2, BX + RW / 2, TZ - 7.6, TZ - 6.8);
    k.box(RW, 0.4, 14, BX, 6, TZ, dark);
    for (let i = 0; i < 10; i++) { const s = k.mesh(new T.PlaneGeometry(2.6, 1.5), screen, BX - 13.5 + i * 3, 3.4, TZ - 6.6); void s; }
    for (let i = 0; i < 10; i++) k.point(BX - 13.5 + i * 3, 5, TZ - 5, 0x3a6aff, 4, 5);
    k.censusWall({ x: BX, y: 3.4, z: TZ - 6.62, rotY: 0, cols: 40, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(0, 160), pieces: ctx.all, backing: dark });
    k.prop('vitrine', BX - 8, 0.15, TZ, { height: 1.7, keepOut: 1.2 }); k.prop('vitrine', BX + 8, 0.15, TZ, { height: 1.7, keepOut: 1.2 }); k.prop('globe_stand', BX, 0.15, TZ + 4, { height: 2, keepOut: 1 });
    k.crowd([v(-4, 0, 20), v(BX + 12, 0.15, BZ + 4), v(BX - 4, 0.15, BZ + 6), v(BX - 10, 0.15, TZ)], 14, { seed: 139, speed: 0.35, spread: 2, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a] });
    // the works: the rotunda walls under the stairs, the mezzanine, the timeline gallery's side walls
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const x = BX - 8 + i * 6; mounts.push({ position: v(x, 3.0, BZ + s * (RD / 2 - 0.36)), rotation: s > 0 ? PI : 0, target: v(x, 2.6, BZ), width: 3.6, height: 2.2, style: 'gilt', wash: true }); }
    for (const x of [-8, 0]) mounts.push({ position: v(BX + x, 8.4 + 0, BZ - RD / 2 + 0.36), rotation: 0, target: v(BX + x, 7, BZ), width: 3.6, height: 2.2, style: 'gilt', wash: false });
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const z = TZ - 3 + i * 6; mounts.push({ position: v(BX + s * (RW / 2 - 0.36), 3.2, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(BX, 2.6, z), width: 4.2, height: 2.6, style: 'black', wash: true }); }
    for (const x of [-12, 12]) mounts.push({ position: v(x + BX, 8.6, BZ - RD / 2 + 0.36), rotation: 0, target: v(x + BX, 7, BZ), width: 3.6, height: 2.2, style: 'gilt', wash: false });
    for (let i = 0; i < 3; i++) { const z = -30 + i * 30; k.box(0.3, 3, 4.6, 18.4, 1.9, z, dark); mounts.push({ position: v(18.2, 2.0, z), rotation: PI / 2, target: v(8, 2, z), width: 4.2, height: 2.5, style: 'black', wash: false }); }
    return { mounts, spawn: v(2, 3, 18), look: v(BX + BW / 2, 10, BZ), eye: 3, bounds: [BX - RW / 2 + 0.8, 40, TZ - 6.6, 60], style: 'gilt', floorY: (x, z) => { const dx = x - (BX - 2), dz = z - BZ; const d = Math.hypot(dx, dz); if (d > 6.6 && d < 9.4 && dx < 0.5) { const a = Math.atan2(Math.abs(dz), dx); const t = Math.min(1, Math.max(0, (a - PI / 2) / (PI * 0.5))); return 0.2 + t * 5.4; } if (Math.abs(dz) < 3 && x < BX + RW / 2 - 4 && x > BX - RW / 2 && x < BX - 2) return 5.8; return 0; } };
  },
};
