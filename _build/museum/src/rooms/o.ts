/* Rooms 67 to 71: balloon inflation night, Christopher Street, the San Gennaro feast, the Chelsea Hotel, the Strand. */
import * as T from 'three';
import { personTag } from '../kit';
import * as X from '../textures';
import { v } from '../kit';
import type { Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront, hsign, paintTex, anamorphTex } from './f';
import { hero, heroInstances } from './heroes';
import { billboard, fireflyPlate } from './a';
import type { Kit } from '../kit';

const PI = Math.PI;

/* ---------- THE BIG UPGRADE, wave 4b (2026-11-24): helpers for rooms 67 to 71 ----------
   Scanned CC0 surfaces (Poly Haven, assets/museum/tex/<room>/) that wear a sensible colour until all three maps land,
   real CC0 models from assets/museum/props/<room>/ placed many at once, canvas painted surfaces that redraw when the
   house fonts arrive. Safe in node: the audit builds these rooms with no DOM, so a scan falls back to its painted
   surface, no canvas is touched and the loaders never resolve. */
const HAS_DOM = typeof window !== 'undefined' && typeof document !== 'undefined' && typeof HTMLImageElement !== 'undefined';
const texL = HAS_DOM ? new T.TextureLoader() : null;
const w4b = new Map<string, { s: X.Surface; ready: Promise<unknown> }>();
function sc(k: Kit, room: string, id: string, metres: number, paint: () => X.Surface, p: Partial<T.MeshStandardMaterialParameters> & { normal?: number } = {}, wait = 0x888888) {
  if (!texL) return k.pbr(`w4b-${room}-${id}`, paint(), 1 / metres, p);
  let e = w4b.get(`${room}/${id}`);
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
    w4b.set(`${room}/${id}`, e);
  }
  k.pending.push(e.ready);
  const m = k.pbr(`w4b-${room}-${id}`, e.s, 1 / metres, p);
  if (!m.userData.w4b) {
    /* an unloaded roughness map samples as 0, a mirror: every map waits for all three, and the surface wears `wait`
       (about 40 percent of its own colour) so a phone never sees white walls while the scan is on its way */
    m.userData.w4b = true;
    const maps = { map: m.map, normalMap: m.normalMap, roughnessMap: m.roughnessMap }, tint = m.color.clone();
    m.map = m.normalMap = m.roughnessMap = null;
    m.color.set(wait);
    void e.ready.then(() => { Object.assign(m, maps); m.color.copy(tint); m.needsUpdate = true; });
  }
  return m;
}
/* A real model fitted once and set at every [x, y, z, rotY, scale?]; seven or more become instanced parts. `tweak`
   runs once on the loaded model (recolour, shadows); `then` gets the placed copies when there are six or fewer. */
function many(k: Kit, name: string, fit: Parameters<typeof hero>[2], at: number[][], tweak?: (o: T.Object3D) => void, then?: (os: T.Object3D[]) => void) {
  if (!at.length) return;
  void hero(k, name, fit).then((h) => {
    if (!h || !k.live) return;
    if (tweak) tweak(h);
    if (at.length > 6) {
      /* the many small things (bags, onions, cases) cast no shadows: each shadow casting light would draw them all again */
      h.traverse((c) => { c.castShadow = false; });
      const ins = heroInstances(k, h, at.length), m = new T.Matrix4(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0);
      at.forEach(([x, y, z, r, s = 1], i) => ins.setAt(i, m.compose(new T.Vector3(x, y, z), q.setFromAxisAngle(up, r), new T.Vector3(s, s, s))));
      ins.commit();
      return;
    }
    const os = at.map(([x, y, z, r, s = 1], i) => { const c = i ? h.clone() : h; c.position.set(x, y, z); c.rotation.y = r; c.scale.setScalar(s); k.add(c); return c; });
    then?.(os);
  });
}
/* Recolour every material of a loaded model: `keepMap` multiplies the scan's own colour map by the tint (a weathered
   bench repainted), otherwise the tint replaces it. Normal maps stay, so the carved detail still reads. */
function recolour(o: T.Object3D, hex: number, rough = 0.8, metal = 0, keepMap = false) {
  const cache = new Map<T.Material, T.Material>();
  o.traverse((c) => { if (!(c instanceof T.Mesh)) return; const src = c.material as T.MeshStandardMaterial; let m = cache.get(src); if (!m) { const n = src.clone(); n.color.setHex(hex); if (!keepMap) n.map = null; n.roughness = rough; n.roughnessMap = keepMap ? n.roughnessMap : null; n.metalness = metal; n.metalnessMap = null; m = n; cache.set(src, m); } c.material = m; });
}
/* Parade balloon skin: polyurethane coated nylon with a wet clear coat, over the scan's own normal map. `hex` null keeps
   the model's colour map (the duck stays a duck yellow, the apple an apple red). */
function vinyl(o: T.Object3D, hex: number | null) {
  const cache = new Map<T.Material, T.Material>();
  o.traverse((c) => { if (!(c instanceof T.Mesh)) return; const src = c.material as T.MeshStandardMaterial; let m = cache.get(src); if (!m) { m = new T.MeshPhysicalMaterial({ color: hex ?? 0xffffff, map: hex === null ? src.map : null, normalMap: src.normalMap, normalScale: new T.Vector2(0.35, 0.35), roughness: 0.42, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12, sheen: 0.4, sheenColor: new T.Color(0xffffff) }); cache.set(src, m); } c.material = m; c.castShadow = true; });
}
/* Painted lettering for an anamorphic floor piece, in a house font; `colors` paints each letter in turn. */
function floorType(text: string, colors: string[], w = 1024, h = 256, font = 'W2 Archivo Expanded') {
  return paintTex(w, h, (g) => {
    g.textBaseline = 'middle';
    let s = h * 0.8; g.font = `800 ${s}px "${font}", Arial, sans-serif`;
    let tw = g.measureText(text).width; if (tw > w * 0.94) { s *= (w * 0.94) / tw; g.font = `800 ${s}px "${font}", Arial, sans-serif`; tw = g.measureText(text).width; }
    let x = (w - tw) / 2, n = 0;
    for (const ch of text) { g.fillStyle = colors[n++ % colors.length]; g.fillText(ch, x, h / 2); x += g.measureText(ch).width; if (ch === ' ') n--; }
  }, [font]);
}
/* A canvas texture painted once (and again when the fonts land); null in node. */
const w4bTex = new Map<string, T.CanvasTexture>();
function canvas(key: string, W: number, H: number, draw: (g: CanvasRenderingContext2D, W: number, H: number) => void, fonts: string[] = [], repeat = true) {
  if (!HAS_DOM) return null;
  let t = w4bTex.get(key);
  if (!t) { t = paintTex(W, H, draw, fonts); if (repeat) t.wrapS = t.wrapT = T.RepeatWrapping; w4bTex.set(key, t); }
  return t;
}
/* Instanced boxes of one material at [x, y, z, rotY] with one shared size: one draw for a hundred barricades. */
function boxes(k: Kit, w: number, h: number, d: number, m: T.Material, at: number[][], cast = false) {
  if (!at.length) return null;
  const ms = at.map(([x, y, z, r = 0]) => new T.Matrix4().compose(v(x, y, z), new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), r), v(1, 1, 1)));
  const im = k.instances(new T.BoxGeometry(w, h, d), m, ms);
  im.castShadow = cast;
  return im;
}

/* ---------------- 67 BALLOON NIGHT ---------------- */
export const balloons: RoomDef = {
  id: 'balloons',
  name: 'The night before the parade',
  area: 'CENTRAL PARK WEST',
  mood: 'Inflation night',
  color: '#f0a0c0',
  description: 'The blocks beside the museum the night before Thanksgiving: giant balloons under their nets, the crews, the crowd shuffling past under the streetlights, the works on the barricade walls.',
  signatures: 'The pink granite Roosevelt Memorial front with its four columns and four figures on the parapet, the side streets closed off, enormous character balloons lying on their sides under cargo nets and sandbags, helium trucks, police barricades, families in coats, bare trees in the park.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x101a34, horizon: 0x4a4a68, ground: 0x0e1018, fog: 0.0024, stars: 220, env: 0.6 });
    k.hemi(0xd8e0ff, 0x1a1418, 0.55);
    k.sun(0xc8d0ff, 0.4, -60, 60, 40, false, 90);
    /* 2026-11-24 (wave 4b): every big surface is a scan (Poly Haven, CC0): the side streets' asphalt and pavement, the
       park lawn, and the museum's pink Milford granite as a granite wall scan warmed toward rose. */
    const R = 'balloons';
    const asphalt = sc(k, R, 'asphalt_02', 4, () => X.asphalt(0x24282d), { color: 0x8a8a8c, roughness: 0.9 }, 0x2a2c30),
      granite = sc(k, R, 'large_sandstone_blocks', 4.2, () => X.ashlar(0xc6a090, 184, 3), { color: 0xffd4c8, roughness: 0.8 }, 0x6a5048), /* Pope's facade is pink granite */
      stepsM = sc(k, R, 'granite_wall', 2.4, () => X.ashlar(0xc6a090, 185, 4), { color: 0xf0d0c4 }, 0x64504a),
      walk = sc(k, R, 'concrete_pavement', 3, () => X.pavers(0x8e8b84, 89), { color: 0xb8b4ac }, 0x4a4844),
      lawn = sc(k, R, 'leafy_grass', 3, () => X.grass(0x2a4a2a, 88), { color: 0x7a9070 }, 0x2a3a28),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      bronze = k.flat(0x4a3a28, 0.75, 0.4),
      rope = k.flat(0xd8ccaa, 0, 0.9),
      white = k.flat(0xf4f0e8, 0, 0.6),
      warmIn = k.flat(0x3a2414, 0, 0.9, { emissive: 0xffb060, emissiveIntensity: 0.35 });
    // the avenue and the two side streets closed off, the museum front, the park across
    street(k, { w: 24, len: 200, z: 0, x: 0 });
    for (const z of [-40, 40]) { k.box(80, 0.3, 16, -60, -0.15, z, asphalt); for (const s of [-1, 1]) k.box(80, 0.28, 4, -60, 0, z + s * 10, walk); }
    k.box(60, 30, 40, -60, 15, 0, granite);
    /* the Roosevelt Memorial front, built: a plinth course and rustication lines, the great round arch between the
       middle columns with a lit hall behind its bronze doors, four Ionic columns with real carved capitals (our own
       ionic_capital model), the entablature with its name cut in, the parapet and four figures on their pedestals */
    for (const s of [-1, 1]) { k.box(0.5, 2.4, 16.4, -29.8, 1.2, s * 11.8, granite); for (let y = 3.2; y < 14; y += 1.6) k.box(0.06, 0.08, 16.6, -29.97, y, s * 11.7, k.flat(0x3a2a26, 0, 0.9)); }
    k.moulding([[0, 0], [0.6, 0], [0.75, 0.25], [0.5, 0.45], [0.9, 0.8], [0, 1.1]], 40.4, -30, 28.9, 0, granite, 0);
    { const arch = k.arch(4.8, 12.6, 1.4, -30.2, 2.4, 0, granite, false, 0.72); arch.rotation.y = PI / 2;
      const hole = new T.Shape(); hole.moveTo(-2.4, 0); hole.lineTo(-2.4, 12.6 * 0.65); hole.absellipse(0, 12.6 * 0.65, 2.4, 12.6 * 0.35, PI, 0, true); hole.lineTo(2.4, 0); hole.closePath();
      k.mesh(new T.ShapeGeometry(hole, 24), warmIn, -29.96, 2.4, 0).rotation.y = PI / 2;
      for (const dz of [-1.5, 0, 1.5]) { k.box(0.12, 3.6, 1.3, -29.9, 4.2, dz, bronze); k.box(0.14, 0.12, 1.3, -29.88, 5.0, dz, k.flat(0x8a6a3a, 0.9, 0.3)); }
      k.box(0.1, 0.5, 4.6, -29.9, 6.4, 0, bronze); k.point(-28, 5, 0, 0xffc080, 18, 10); }
    /* a landing at the top of eight steps carries the four columns, which stand free in front of the wall (they were
       sunk inside the granite block, so the front had no columns at all) */
    k.box(2.6, 2.4, 30, -28.7, 1.2, 0, stepsM);
    for (let i = 0; i < 8; i++) { const w = 2.5 - i * 0.31; k.box(w, 0.3, 30, -27.4 + w / 2, 0.15 + i * 0.3, 0, stepsM); }
    for (let i = 0; i < 4; i++) k.column(-28.6, 2.4, -9 + i * 6, 11.6, 1.0, granite, true);
    many(k, `${R}/ionic_capital`, { width: 3.1 }, [-9, -3, 3, 9].map((z) => [-28.6, 13.2, z, PI / 2]), (o) => recolour(o, 0xe8c4b4, 0.8, 0, true));
    k.box(3.6, 3, 30, -29.2, 15.5, 0, granite); /* the entablature runs along the front, over the columns */
    /* no pediment on the Roosevelt Memorial: a parapet, and over each of the four columns a standing figure (Audubon,
       Boone, Lewis and Clark on the real front), kept generic here: our own bronze_figure model, cut in the granite */
    k.box(3.6, 2.2, 30, -29.2, 18.1, 0, granite);
    for (let i = 0; i < 4; i++) { const z = -9 + i * 6; k.box(1.4, 0.4, 1.4, -28.6, 19.4, z, granite); }
    many(k, 'bronze_figure', { height: 3.0 }, [-9, -3, 3, 9].map((z) => [-28.6, 19.6, z, PI / 2]), (o) => recolour(o, 0xd8b4a4, 0.85, 0));
    hsign(k, 'AMERICAN MUSEUM OF NATURAL HISTORY', 24, 1.0, -27.37, 15.6, 0, PI / 2, { fg: '#2a1e1a', font: 'W2 Archivo Expanded', size: 0.62, lit: false });
    hsign(k, 'THEODORE ROOSEVELT MEMORIAL', 18, 0.8, -27.37, 18.1, 0, PI / 2, { fg: '#2a1e1a', font: 'W2 Archivo Expanded', size: 0.6, lit: false });
    k.block(-95, -25, -22, 22);
    // the facade is floodlit from the street, as it is every night
    k.spot(-14, 0.6, -10, -30, 12, -3, 0xffd8b0, 260, 0.42, 0.6, 46);
    k.spot(-14, 0.6, 10, -30, 12, 3, 0xffd8b0, 260, 0.42, 0.6, 46);
    k.box(160, 0.4, 200, 60 + 40, -0.2, 0, lawn);
    /* Central Park at night past the elms, with the towers of Central Park South (FIREFLY_QUEUE.md, balloons): invisible until it lands */
    fireflyPlate(k, 'assets/museum/tex/balloons/ff_park_night.webp', 320, 80, 178, 34, 0, -PI / 2, new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), true);
    const rnd = X.mulberry(67);
    for (let i = 0; i < 40; i++) k.tree(30 + rnd() * 100, 0, -90 + rnd() * 180, { kind: 'bare', h: 8 + rnd() * 6, r: 3 + rnd() * 2, seed: i, species: 'elm' }); /* American elms line the park side of Central Park West */
    k.rail(18, 0, 200, dark, 1.0, 'z', 2.4);
    k.block(17.6, 18.4, -100, 100);
    for (const z of [-80, -40, 0, 40, 80]) for (const s of [-1, 1]) k.lamp(s * 13.5, z, 6.2, dark, 0xffd9a8, 30);
    blockFront(k, { x: -100, z0: 100, count: 12, face: 1, seed: 185, h: [18, 34] });
    /* the balloons: five giants under their nets, held down by sandbags. They were spheres and cones; now each is a real
       CC0 scan (Poly Haven) blown up to parade size and skinned as coated nylon: a rubber duck, a carved elephant gone
       pink, a bronze whale gone blue, an apple for the Big Apple, a horse statue in orange */
    const netTex = canvas('bnNet', 256, 256, (g, W) => { g.clearRect(0, 0, W, W); g.strokeStyle = '#eee4c4'; g.lineWidth = 7; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, W); g.moveTo(W, 0); g.lineTo(0, W); g.stroke(); g.fillStyle = '#eee4c4'; for (const [x, y] of [[0, 0], [W, 0], [0, W], [W, W], [W / 2, W / 2]]) { g.beginPath(); g.arc(x, y, 9, 0, PI * 2); g.fill(); } });
    if (netTex) netTex.repeat.set(26, 12);
    const net = netTex ? new T.MeshStandardMaterial({ map: netTex, transparent: true, alphaTest: 0.35, side: T.DoubleSide, roughness: 0.9 }) : k.flat(0xe8e0c0, 0, 0.9, { transparent: true, opacity: 0.35, wireframe: true });
    const kinds: [string, number, number | null, number][] = [['ph_rubber_duck_toy', 15, null, 0.3], ['ph_carved_wooden_elephant', 19, 0xf07aa8, -0.4], ['ph_food_apple_01', 10.5, null, 0.6], ['ph_bronze_whale_statue', 22, 0x3a8ad8, 0.2], ['ph_horse_statue_01', 16, 0xf08a2a, -0.3]];
    const bags: number[][] = [];
    const balloon = (x: number, z: number, kind: number) => {
      const g = new T.Group(); g.position.set(x, 0, z); k.add(g);
      const [name, len, hex, yaw] = kinds[kind];
      const rx = kind === 1 || kind === 3 ? 14 : 11, rz = 7;
      const nm = k.mesh(new T.SphereGeometry(1, 28, 16, 0, PI * 2, 0, PI / 2), net, x + 1, 0, z, true); nm.scale.set(rx * 0.72, len * 0.62, rz * 0.95);
      void hero(k, `${R}/${name}`, kind === 2 ? { height: len } : { length: len }).then((h) => {
        if (!h || !k.live) return;
        vinyl(h, hex); h.rotation.y = yaw; g.add(h);
        const s = h.userData.size as T.Vector3; nm.scale.set(Math.max(s.x, s.z) * 0.62 + 1, s.y * 1.06, Math.min(s.x, s.z) * 0.62 + 1);
      });
      for (let i = 0; i < 14; i++) { const a = (i / 14) * PI * 2; const bx = x + rx * Math.cos(a) + 1, bz = z + rz * Math.sin(a); bags.push([bx, 0.02, bz, a + PI / 2]); k.beam(v(bx, 0.25, bz), v(x + 1 + rx * 0.55 * Math.cos(a), 3.2, z + rz * 0.6 * Math.sin(a)), 0.025, rope, 3); }
      k.keepOut.push({ x: x + 1, z, r: rx });
      return g;
    };
    const set = [balloon(-60, -40, 0), balloon(-60, 40, 1), balloon(-36, -40, 2), balloon(-34, 40, 3), balloon(-84, 40, 4)];
    many(k, `${R}/ph_cement_bag`, { length: 0.8 }, bags, (o) => recolour(o, 0xc8b890, 0.95, 0, true));
    if (!ctx.reduced) k.ticks.push((t) => set.forEach((g, i) => { g.position.y = 0.15 * Math.sin(t * 0.8 + i * 1.3); g.rotation.z = 0.01 * Math.sin(t * 0.5 + i); }));
    // the work lights on the balloons, a portable searchlight on its stand for each
    const lights: [number, number, number, number][] = [[-48, -29.5, -60, -40], [-48, 29.5, -60, 40], [-72, 29.5, -84, 40]];
    for (const [lx, lz, tx, tz] of lights) k.spot(lx, 3.4, lz, tx, 4, tz, 0xf4f0ff, 340, 0.55, 0.7, 40);
    many(k, `${R}/ph_portable_searchlight`, { height: 2.4 }, lights.map(([lx, lz, tx, tz]) => [lx, 0.14, lz + (lz < 0 ? -0.8 : 0.8), Math.atan2(tx - lx, tz - lz)]));
    // the helium: a white rig truck at each end, racks of cylinders, hand trucks
    for (const [x, z] of [[-86, -40], [-8, 40]]) { k.box(2.6, 3.2, 8, x, 1.6, z, white); k.box(2.6, 2.4, 2.4, x, 1.2, z + 5, dark); for (const dx of [-1.1, 1.1]) for (const dz of [-2.6, 3.4]) k.cyl(0.5, 0.4, x + dx, 0.5, z + dz, dark, 0.5, 12).rotation.z = PI / 2; k.keepOut.push({ x, z, r: 4.5 }); k.beam(v(x + 1.3, 1.4, z), v(x + 6, 0.4, z - 4), 0.05, dark, 4); for (const s of [-1, 1]) hsign(k, 'HELIUM  ·  COMPRESSED', 6, 0.7, x + s * 1.31, 2.2, z, s * PI / 2, { fg: '#1a3a6a', font: 'W2 Archivo Expanded', size: 0.6, lit: false }); }
    { const tanks: number[][] = []; for (const [x, z] of [[-86, -40], [-8, 40]]) for (let i = 0; i < 6; i++) tanks.push([x + 2.2 + (i % 3) * 0.55, 0.14, z - 2.4 + Math.floor(i / 3) * 0.55, i]); many(k, `${R}/ph_propane_tank`, { height: 1.45 }, tanks, (o) => recolour(o, 0x6a7a6a, 0.5, 0.6, true)); }
    many(k, `${R}/ph_hand_truck`, { height: 1.3 }, [[-83, 0.02, -37, 0.4], [-5, 0.02, 43, -0.6]]);
    /* the police lines: blue wooden sawhorses lettered POLICE LINE DO NOT CROSS, as NYPD puts out on parade night,
       instanced (a plank and two legs each) where 216 merged boxes stood */
    const plankTex = canvas('bnPolice', 1024, 128, (g, W, H) => { g.fillStyle = '#1d3f8e'; g.fillRect(0, 0, W, H); g.fillStyle = '#f4f2ea'; g.font = '800 84px "W2 Archivo Expanded", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('POLICE LINE  DO NOT CROSS', W / 2, H / 2 + 4); }, ['W2 Archivo Expanded'], false);
    const plank = plankTex ? new T.MeshStandardMaterial({ map: plankTex, roughness: 0.7 }) : k.flat(0x1d3f8e, 0, 0.7);
    { const pl: number[][] = [], legs: number[][] = []; for (let x = -95; x <= -25; x += 2.4) for (const z of [-32, -48, 32, 48]) { pl.push([x, 0.95, z]); for (const dx of [-0.95, 0.95]) legs.push([x + dx, 0.5, z]); }
      boxes(k, 2.3, 0.28, 0.07, plank, pl); boxes(k, 0.07, 1.0, 0.5, k.flat(0x1d3f8e, 0, 0.75), legs); }
    k.block(-96, -24, -33, -31); k.block(-96, -24, -49, -47); k.block(-96, -24, 31, 33); k.block(-96, -24, 47, 49);
    // street signs at the corners, a crowd control board on the avenue
    for (const [z, name] of [[-30, 'W 77 ST'], [30, 'W 81 ST']] as [number, string][]) { k.box(0.1, 3.4, 0.1, -15.5, 1.7, z, k.flat(0x2a3a2e, 0.6, 0.5)); for (const s of [-1, 1]) hsign(k, name, 1.6, 0.34, -15.5 + s * 0.06, 3.15, z, s > 0 ? PI / 2 : -PI / 2, { fg: '#f4f2ea', bg: '#1e5a32', font: 'W2 Archivo Expanded', size: 0.6, lit: false }); hsign(k, 'CENTRAL PARK W', 2.2, 0.34, -15.5, 2.75, z + 0.06, 0, { fg: '#f4f2ea', bg: '#1e5a32', font: 'W2 Archivo Expanded', size: 0.6, lit: false }); }
    k.box(2.4, 1.5, 0.08, -10.6, 1.15, -24, dark).rotation.y = 0.5;
    hsign(k, 'BALLOON INFLATION  VIEWING  ENTER AT 79 ST', 2.3, 1.3, -10.56, 1.18, -23.93, 0.5, { fg: '#f4f2ea', bg: '#c62828', font: 'W2 Archivo Expanded', size: 0.2, lit: false });
    k.keepOut.push({ x: -10.6, z: -24, r: 1.2 });
    // the crowd shuffles the loop: avenue, side street, avenue
    k.crowd([v(6, 0, -70), v(6, 0, -30), v(-90, 0, -30), v(-90, 0, 30), v(6, 0, 30), v(6, 0, 70), v(-4, 0, 70), v(-4, 0, -70)], 60, { seed: 71, speed: 0.6, spread: 3, animate: !ctx.reduced, closed: true, colors: [0x24262c, 0x8a3a3a, 0x33477f, 0x151517, 0xc9a25a, 0x6a4a8a, 0xd8d0c0] });
    k.censusWall({ x: -24.66, y: 3.2, z: 0, rotY: PI / 2, cols: 22, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(7800, 88), pieces: ctx.all, backing: dark });
    k.box(0.4, 4.8, 14, -24.9, 2.4, 0, dark);
    /* the illusion (one trick a room): BALLOON NIGHT is painted flat across the avenue and the sidewalk, stretched so
       that from where you arrive it stands up like a banner in front of the museum */
    { const t = floorType('BALLOON NIGHT', ['#f07aa8', '#f4d23a', '#5ab0f0', '#f08a2a']); if (t) anamorphTex(k, t, 6, -66, 3, 0.02, 2.004, 10, 9, 2.0, 0.9); }
    const MP = 'https://en.wikipedia.org/wiki/Macy%27s_Thanksgiving_Day_Parade', AM = 'https://en.wikipedia.org/wiki/American_Museum_of_Natural_History';
    k.egg(set[0], { id: 'balloons-felix', title: 'Felix on sticks', year: '1927', text: 'The first parade, in 1924, had live animals borrowed from the Central Park Zoo. In 1927 the first balloon, a Felix the Cat, replaced them, filled with air and held up on sticks. Macy\'s switched to helium the next year.', clue: 'Find the first balloon on 77th Street, under its net.', source: { name: 'Macy\'s Thanksgiving Day Parade, Wikipedia', url: MP } });
    k.egg(set[1], { id: 'balloons-reward', title: 'Let go on purpose', year: '1928', text: 'In 1928 Tony Sarg released five balloons into the sky with a reward for whoever brought one back: $100, cut to $50 the next year. In 1931 an aviator cut a dragon balloon down in midair for a $25 reward, and a blue hippo was never found. The releases ended in 1932 after a novice pilot nearly crashed chasing one.', clue: 'Look at the pink elephant on 81st Street.', source: { name: 'Macy\'s Thanksgiving Day Parade, Wikipedia', url: MP } });
    k.egg(v(-86, 2.2, -36), { id: 'balloons-rubber', title: 'Rubber for the war', year: '1942', text: 'The parade did not run from 1942 to 1944, because the rubber and helium were needed for the war effort. It came back in 1945.', clue: 'Find the helium truck at the far end of 77th Street.', source: { name: 'Macy\'s Thanksgiving Day Parade, Wikipedia', url: MP } }, { r: 1.8 });
    k.egg(v(13.5, 5.6, -40), { id: 'balloons-wind', title: 'The wind law', year: '1997', text: 'After a Cat in the Hat balloon hit a lamppost in 1997 and badly injured a parade goer, the city passed a law: no full size balloons if sustained winds pass 23 mph or gusts pass 35 mph. Each character balloon is handled by 90 people.', clue: 'Look at the lampposts along the avenue.', source: { name: 'Macy\'s Thanksgiving Day Parade, Wikipedia', url: MP } }, { r: 1.4 });
    k.egg(v(-28.6, 21, 3), { id: 'balloons-explorers', title: 'Four on the parapet', year: '1936', text: 'The museum\'s Central Park West front is the Theodore Roosevelt Memorial by John Russell Pope, pink granite modelled on Roman arches, dedicated in 1936. Figures of Audubon, Boone, Lewis and Clark by James Earle Fraser stand over the four columns, each column 48 feet tall.', clue: 'Look up at the top of the four columns.', source: { name: 'American Museum of Natural History, Wikipedia', url: AM } }, { r: 2.0 });
    k.egg(v(-20, 1.0, 0), { id: 'balloons-statue', title: 'The statue that left', year: '2022', text: 'Fraser\'s bronze equestrian statue of Roosevelt stood on these steps until January 2022. The museum removed it because of the way it placed a Native American and an African American figure beside him, and lent it to the Theodore Roosevelt Presidential Library in North Dakota.', clue: 'Stand at the foot of the museum steps, where the bronze rider used to be.', source: { name: 'American Museum of Natural History, Wikipedia', url: AM } }, { r: 0.9 });
    k.egg(v(-2, 0.6, -52), { id: 'balloons-anamorph', title: 'A banner that is not there', text: 'BALLOON NIGHT is painted flat on the avenue, stretched toward the museum, so that from the corner where you arrive it stands up off the asphalt like a banner. Walk onto it and it falls back into long smears of paint. The trick is anamorphosis, the same one that hides a skull across the floor of Hans Holbein\'s The Ambassadors of 1533.', clue: 'Go back to where you came in and look toward the museum.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.8 });
    // the works: light boxes along the barricade lines on both side streets, the park fence, the museum front
    const mounts: Mount[] = [];
    for (let i = 0; i < 6; i++) { const x = -90 + i * 12; for (const [z, rot] of [[-30.8, 0], [30.8, PI]] as const) { k.box(4.6, 3.2, 0.4, x, 2.0, z + (rot ? 0.3 : -0.3), dark); mounts.push({ position: v(x, 2.1, z + (rot ? 0.08 : -0.08)), rotation: rot, target: v(x, 2, rot ? z - 8 : z + 8), width: 4.2, height: 2.5, style: 'black', wash: true }); } }
    /* the park fence boards faced the park, away from their own viewing spot on the avenue: turned to face the street */
    for (let i = 0; i < 6; i++) { const z = -60 + i * 24; k.box(0.3, 3.0, 4.2, 18.4, 1.9, z, dark); mounts.push({ position: v(18.2, 2.0, z), rotation: -PI / 2, target: v(8, 2, z), width: 3.6, height: 2.1, style: 'black', wash: true }); }
    /* the two on the museum front hung 0.6 m inside the granite: brought out to its face */
    for (let i = 0; i < 2; i++) { const z = -14 + i * 28; mounts.push({ position: v(-29.88, 6, z), rotation: PI / 2, target: v(-16, 3, z), width: 4.4, height: 2.6, style: 'steel', wash: true }); }
    return { mounts, spawn: v(6, 3, -66), look: v(-50, 6, -40), eye: 3, bounds: [-96, 17, -96, 96], style: 'black' };
  },
};

/* ---------------- 68 CHRISTOPHER STREET ---------------- */
export const stonewall: RoomDef = {
  id: 'stonewall',
  name: 'Christopher Street',
  area: 'SHERIDAN SQUARE',
  mood: 'The last Sunday in June',
  color: '#e83a8a',
  description: 'The little brick bar with its arched windows, the park across the street with the white figures, the banners on every building, the march coming down Christopher with its floats.',
  signatures: 'The two storey front, brick below and stucco above, the storefront window between two arched doors and the neon in the window, the triangular park with its benches and the four white sculptures, rainbow flags on the fire escapes, floats and marchers filling the narrow street, confetti in the air.',
  build(k, ctx) {
    k.sky({ top: 0x5f94d8, horizon: 0xf0e8e0, ground: 0x6a6660, fog: 0.002, sun: { az: 3.3, el: 0.85, color: 0xfff6e8, size: 12 }, env: 1.0 });
    k.hemi(0xf6f6ff, 0x5a5048, 0.95);
    k.sun(0xfff2dc, 2.4, 20, 80, 30, true, 90);
    /* 2026-11-24 (wave 4b): scans (Poly Haven, CC0) for the bar's brick and stucco, the park lawn and its hexagonal
       pavers, the side street; real CC0 models for the benches, the lamps, the bins and the two bronze figures */
    const R = 'stonewall';
    const brick = sc(k, R, 'red_brick_03', 2.4, () => X.brick(0x8a4a3a, 186), { color: 0xc89080 }, 0x4a2a22),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      white = k.flat(0xf4f0e8, 0, 0.6),
      iron = k.flat(0x1f242a, 0.7, 0.45),
      lawn = sc(k, R, 'leafy_grass', 3, () => X.grass(0x4a7a3a, 90), { color: 0xb8c8a0 }, 0x3a5230),
      hexp = sc(k, R, 'hexagonal_concrete_paving', 2.4, () => X.pavers(0x8e8b84, 91), { color: 0xc8c4bc }, 0x5a5854),
      stucco = sc(k, R, 'white_stucco', 2.6, () => X.plaster(0xd8cfc0, 186), { color: 0xe4dccf }, 0x8a847a),
      rainbow = [0xe40303, 0xff8c00, 0xffed00, 0x008026, 0x24408e, 0x732982].map((c) => k.flat(c, 0, 0.7));
    // the street bending past the park, the low brick blocks with fire escapes, flags everywhere
    street(k, { w: 12, len: 140, z: 0, x: 0 });
    k.box(12, 0.3, 60, -14, -0.15, -50, sc(k, R, 'asphalt_02', 4, () => X.asphalt(0x24282d), { color: 0x9a9a9c }, 0x2a2c30));
    blockFront(k, { x: -11, z0: 60, count: 6, face: 1, seed: 188, h: [10, 14] });
    blockFront(k, { x: 11, z0: 60, count: 5, face: -1, seed: 189, h: [10, 16] });
    blockFront(k, { x: 11, z0: -10, count: 8, face: -1, seed: 190, h: [10, 14] });
    for (let i = 0; i < 24; i++) { const s = i % 2 ? 1 : -1; const z = 56 - i * 4.6; const x = s * 10.2; for (let c = 0; c < 6; c++) k.box(0.05, 0.16, 1.0, x + s * 0.05, 7.5 - c * 0.16, z, rainbow[c]); }
    const BX = -11, BZ = -4;
    k.box(12, 9, 10, BX - 6, 4.5, BZ, brick);
    /* the real front: brick at street level, stucco above, a wide storefront window between two arched entrances,
       three windows on the second floor (two 1840s stables refaced together in 1930) */
    const swGlass = k.glass(0xffe0c0, 0.35, 0.1);
    k.box(0.1, 5.2, 10, BX + 0.05, 6.4, BZ, stucco);
    /* the cornice and the sill course, the dark painted door surrounds standing proud of the brick */
    k.moulding([[0, 0], [0.35, 0], [0.45, 0.18], [0.3, 0.3], [0.5, 0.55], [0, 0.7]], 10.4, BX + 0.08, 8.4, BZ, stucco, 0);
    k.box(0.3, 0.22, 10.2, BX + 0.18, 3.9, BZ, stucco);
    for (const dz of [-3.4, 3.4]) { k.arch(1.8, 3.2, 0.4, BX + 0.1, 0.8, BZ + dz, dark, false, 0.8).rotation.y = PI / 2; k.box(0.1, 2.4, 1.4, BX + 0.16, 2.2, BZ + dz, swGlass); }
    k.box(0.14, 2.4, 4.0, BX + 0.12, 2.0, BZ, dark);
    /* the bar seen through its window (FIREFLY_QUEUE.md, stonewall): a warm dim room until the plate lands */
    fireflyPlate(k, 'assets/museum/tex/stonewall/ff_bar_interior.webp', 3.6, 2.0, BX + 0.2, 2.0, BZ, PI / 2, k.flat(0x2a1812, 0, 0.9, { emissive: 0x6a3018, emissiveIntensity: 0.5 }));
    k.box(0.03, 2.0, 3.6, BX + 0.27, 2.0, BZ, swGlass);
    for (const dz of [-3.4, 0, 3.4]) { k.box(0.12, 1.9, 1.3, BX + 0.1, 7.0, BZ + dz, dark); k.box(0.1, 1.6, 1.0, BX + 0.14, 7.0, BZ + dz, swGlass); }
    hsign(k, 'Stonewall', 1.9, 0.62, BX + 0.24, 2.45, BZ + 0.5, PI / 2, { fg: '#ff4a8a', font: 'W2 Permanent Marker', size: 0.8 });
    hsign(k, 'NATIONAL HISTORIC LANDMARK', 0.9, 0.5, BX + 0.17, 1.7, BZ - 4.7, PI / 2, { fg: '#e8d8a8', bg: '#4a3a22', border: '#c8a85a', font: 'W2 Archivo Expanded', size: 0.16, lit: false });
    hsign(k, 'STONEWALL INN', 3.6, 0.7, BX + 0.16, 5.2, BZ, PI / 2, { fg: '#f4f0e8', bg: '#1a1c20', border: '#f4f0e8', font: 'W2 Archivo Expanded', size: 0.5 });
    k.block(BX - 12.5, BX + 0.4, BZ - 5.5, BZ + 5.5);
    for (let c = 0; c < 6; c++) k.box(0.1, 0.3, 4.2, BX + 0.18, 7.2 - c * 0.3, BZ, rainbow[c]);
    k.point(BX + 1, 2.6, BZ + 0.6, 0xff6a8a, 12, 6);
    // the park: a triangle with lawn, benches, the four white figures on their bases
    const P = [v(2, 0, -8), v(28, 0, -40), v(2, 0, -44)];
    const tri = new T.Shape(); tri.moveTo(P[0].x, -P[0].z); tri.lineTo(P[1].x, -P[1].z); tri.lineTo(P[2].x, -P[2].z); tri.closePath();
    const lg = new T.ExtrudeGeometry(tri, { depth: 0.3, bevelEnabled: false }); lg.rotateX(-PI / 2); k.mesh(lg, lawn, 0, 0.02, 0);
    for (let i = 0; i < 3; i++) { const a = P[i], b = P[(i + 1) % 3]; const len = a.distanceTo(b), m = a.clone().lerp(b, 0.5); const f = k.box(0.06, 1.1, len, m.x, 0.55, m.z, iron); f.rotation.y = Math.atan2(b.x - a.x, b.z - a.z); for (let t = 0; t < 1; t += 0.06) { const p = a.clone().lerp(b, t); k.box(0.06, 1.2, 0.06, p.x, 0.6, p.z, iron); } }
    /* The park used to be sealed, which put the works on its own railings
       out of reach: they face in, so the lawn is the only floor they can be
       seen from. */
    /* the park's paving: hexagonal pavers along the long side where the benches are, the lawn inside */
    { const a = P[0], b = P[1]; const len = a.distanceTo(b), m = a.clone().lerp(b, 0.5); const ang = Math.atan2(b.x - a.x, b.z - a.z); const strip = k.box(3.2, 0.06, len - 2, m.x + Math.cos(ang) * 1.9, 0.33, m.z - Math.sin(ang) * 1.9, hexp); strip.rotation.y = ang; }
    /* Segal's white figures: the two seated women stay as plain cast shapes, the two standing men are our own figure
       model cast in white; nobody's likeness, only the pose of the group */
    const fig = (x: number, z: number) => { k.box(0.6, 0.9, 0.4, x, 0.95, z, white); k.sphere(0.2, x, 1.6, z, white, 10); k.box(0.6, 0.3, 0.9, x, 0.6, z + 0.3, white); };
    fig(7.6, -20.4); fig(8.6, -20.4);
    many(k, `${R}/ph_painted_wooden_bench`, { length: 2.2 }, [[8.1, 0.3, -20.6, PI / 2 + 0.6], [16, 0.3, -30.2, PI / 2 + 0.6], [10.6, 0.3, -36, PI / 2 + 0.6], [4.2, 0.3, -30, PI / 2]], (o) => recolour(o, 0x3a5a3a, 0.7, 0, true));
    many(k, 'bronze_figure', { height: 1.85 }, [[12, 0.3, -16, 2.4], [12.8, 0.3, -15.2, 2.0]], (o) => recolour(o, 0xf2eee6, 0.9, 0));
    for (const [x, z] of [[16, -30.2], [10.6, -36], [4.2, -30]]) k.keepOut.push({ x, z, r: 1.0 });
    many(k, `${R}/ph_street_lamp_01`, { height: 4.2 }, [[5.2, 0.3, -16.5, 0], [13, 0.3, -26, 0], [21, 0.3, -35, 0], [3.4, 0.3, -38, 0]]);
    many(k, `${R}/ph_metal_trash_can`, { height: 0.95 }, [[3.4, 0.3, -18, 0.3], [24, 0.3, -38.6, 1]]);
    many(k, `${R}/ph_fire_hydrant`, { height: 0.8 }, [[-8.8, 0.14, 22, 0], [8.8, 0.14, 8, 1.2]]);
    for (const [x, z] of [[5.2, -16.5], [13, -26], [21, -35], [3.4, -38], [3.4, -18], [24, -38.6], [-8.8, 22], [8.8, 8]]) k.keepOut.push({ x, z, r: 0.5 });
    /* General Sheridan in bronze (1936) at the point of the park, a generic figure on a granite pedestal */
    const bronze = k.flat(0x3a4a3c, 0.6, 0.5);
    k.box(1.4, 1.8, 1.4, 4.6, 0.9, -12.5, k.flat(0x8a8680, 0, 0.8)); k.keepOut.push({ x: 4.6, z: -12.5, r: 1.1 });
    many(k, 'bronze_figure', { height: 2.3 }, [[4.6, 1.8, -12.5, -0.6]], (o) => recolour(o, 0x3a4a3c, 0.5, 0.6));
    /* the signs: the monument's, the corner's, the flags out of the windows */
    k.box(0.08, 2.2, 0.08, 2.6, 1.1, -9.6, iron); hsign(k, 'STONEWALL NATIONAL MONUMENT', 1.9, 0.62, 2.6, 2.0, -9.54, 0.35, { fg: '#f2eee4', bg: '#5a3a22', border: '#f2eee4', font: 'W2 Archivo Expanded', size: 0.28, lit: false });
    k.box(0.1, 3.6, 0.1, 1.2, 1.8, -7.2, k.flat(0x2a3a2e, 0.6, 0.5)); for (const s of [-1, 1]) hsign(k, 'CHRISTOPHER ST', 1.9, 0.34, 1.2 + s * 0.06, 3.35, -7.2, s * PI / 2, { fg: '#f4f2ea', bg: '#1e5a32', font: 'W2 Archivo Expanded', size: 0.6, lit: false }); hsign(k, 'GROVE ST', 1.4, 0.34, 1.2, 2.95, -7.14, 0, { fg: '#f4f2ea', bg: '#1e5a32', font: 'W2 Archivo Expanded', size: 0.6, lit: false });
    k.keepOut.push({ x: 2.6, z: -9.6, r: 0.5 }, { x: 1.2, z: -7.2, r: 0.4 });
    const SNM = 'https://en.wikipedia.org/wiki/Stonewall_National_Monument', SWI = 'https://en.wikipedia.org/wiki/Stonewall_Inn';
    k.egg(v(BX + 0.4, 7.0, BZ - 3.4), { id: 'stonewall-stables', title: 'Two stables', year: '1843', text: 'The Stonewall began as two horse stables, No. 51 built in 1843 and No. 53 in 1846. In 1930 the architect William Bayard Willis joined and refaced them, and the third storey of No. 51 came off.', clue: 'Look at the second floor windows over the bar.', source: { name: 'Stonewall Inn, Wikipedia', url: SWI } }, { r: 1.4 });
    k.egg(v(BX + 0.5, 2.0, BZ + 3.4), { id: 'stonewall-raid', title: 'One twenty in the morning', year: '1969', text: 'The bar opened as a gay bar on March 18, 1967, bought for $3,500 by men tied to the Genovese family, and ran as a members only club because it had no liquor licence. The police raid that started the uprising came at about 1:20 a.m. on June 28, 1969, and the unrest ran until July 3.', clue: 'Stand at the arched door of the bar.', source: { name: 'Stonewall Inn, Wikipedia', url: SWI } }, { r: 1.0 });
    k.egg(v(BX + 0.5, 5.2, BZ), { id: 'stonewall-register', title: 'One in seventy thousand', year: '1999', text: 'When the site joined the National Register of Historic Places in 1999 it was the first listing, out of more than 70,000 at the time, dedicated only to LGBT history. It became a National Historic Landmark in 2000, a city landmark in 2015 and a national monument on June 24, 2016.', clue: 'Read the sign over the storefront.', source: { name: 'Stonewall National Monument, Wikipedia', url: SNM } }, { r: 1.4 });
    k.egg(v(8.1, 1.4, -20.4), { id: 'stonewall-segal', title: 'Gay Liberation', year: '1992', text: 'George Segal\'s white figures, two men standing and two women seated on a bench, were placed in the park in 1992. A near identical cast stands at Stanford University.', clue: 'Sit down on the bench with the white figures.', source: { name: 'Stonewall National Monument, Wikipedia', url: SNM } }, { r: 1.4 });
    k.egg(v(4.6, 3.2, -12.5), { id: 'stonewall-farm', title: 'A tobacco farm and a fire', year: '1835', text: 'The little park was once part of a tobacco farm that Wouter van Twiller worked from 1633 to 1638. The Great Fire of 1835 swept the block, which was then condemned and made a park. The bronze of General Philip Sheridan here dates from 1936.', clue: 'Find the bronze general at the point of the park.', source: { name: 'Stonewall National Monument, Wikipedia', url: SNM } }, { r: 1.4 });
    k.egg(v(BX + 0.4, 2.4, BZ - 7), { id: 'stonewall-station', title: 'The station changed its name', year: '2024', text: 'The monument\'s visitor centre opened next door at 51 Christopher Street on June 28, 2024, the first official national visitor centre for the LGBTQ+ experience. The same day the Christopher Street Sheridan Square subway station was renamed Christopher Street Stonewall.', clue: 'Look at the door just south of the bar.', source: { name: 'Stonewall National Monument, Wikipedia', url: SNM } }, { r: 1.4 });
    for (let i = 0; i < 6; i++) k.tree(6 + i * 3.4, 0, -14 - i * 4.4, { kind: 'round', h: 5 + (i % 3), r: 2.6, leaf: 0x4a7a3c, seed: i });
    // the march: floats on the street with dancers, marchers on both sides, confetti drifting down
    const floats: T.Group[] = [];
    for (let i = 0; i < 3; i++) { const g = new T.Group(); const bed = new T.Mesh(new T.BoxGeometry(4.6, 1.4, 10), k.flat([0xe83a8a, 0x3a8ad8, 0xf1c531][i], 0.1, 0.6)); bed.position.y = 0.9; g.add(bed); const cab = new T.Mesh(new T.BoxGeometry(2.4, 2.2, 2.4), white); cab.position.set(0, 2.3, 5.8); g.add(cab); for (let c = 0; c < 6; c++) { const band = new T.Mesh(new T.BoxGeometry(4.7, 0.2, 10.1), rainbow[c]); band.position.y = 0.3 + c * 0.22; g.add(band); } for (let d = 0; d < 6; d++) { const dancer = new T.Mesh(new T.CapsuleGeometry(0.2, 0.8, 3, 8), [white, k.flat(0x151517, 0, 0.8), rainbow[d]][d % 3]); dancer.position.set(-1.6 + (d % 3) * 1.6, 2.2, -3 + Math.floor(d / 3) * 4); g.add(personTag(dancer, 'auto', 1.4, ['discoking', 'actress', 'gown', 'workgirl', 'discoking', 'tough'][(d + i) % 6])); } const arch = new T.Mesh(new T.TorusGeometry(2.4, 0.25, 8, 24, PI), rainbow[i]); arch.position.set(0, 1.6, -2); g.add(arch); g.position.set(0, 0, -60 + i * 50); k.add(g); floats.push(g); }
    if (!ctx.reduced) k.ticks.push((t, dt) => floats.forEach((g, i) => { g.position.z += 1.4 * Math.min(dt, 0.1); if (g.position.z > 80) g.position.z = -70; g.children.forEach((c, j) => { if (j >= 8 && j < 14) c.position.y = 2.2 + 0.25 * Math.abs(Math.sin(t * 4 + j + i)); }); }));
    k.crowd([v(-4.5, 0, -70), v(-4.5, 0, 70)], 40, { seed: 72, speed: 1.3, spread: 1.6, animate: !ctx.reduced, colors: [0xe40303, 0xff8c00, 0xffed00, 0x008026, 0x24408e, 0x732982, 0xf4f0e8, 0x151517] });
    k.crowd([v(4.5, 0, -70), v(4.5, 0, 70)], 40, { seed: 73, speed: 1.3, spread: 1.6, animate: !ctx.reduced, colors: [0xe40303, 0xff8c00, 0xffed00, 0x008026, 0x24408e, 0x732982, 0xf4f0e8, 0x151517] });
    k.crowd([v(-8.6, 0, 60), v(-8.6, 0, -60)], 24, { seed: 74, speed: 0.2, spread: 1.2, animate: !ctx.reduced });
    k.crowd([v(8.6, 0, 60), v(8.6, 0, 0)], 16, { seed: 75, speed: 0.2, spread: 1.2, animate: !ctx.reduced });
    const conf: T.Matrix4[] = []; const rnd = X.mulberry(68);
    for (let i = 0; i < 500; i++) conf.push(new T.Matrix4().compose(v((rnd() - 0.5) * 24, rnd() * 14, (rnd() - 0.5) * 120), new T.Quaternion(), v(1, 1, 1)));
    const confetti = k.instances(new T.PlaneGeometry(0.12, 0.12), k.flat(0xffffff, 0, 0.8, { side: T.DoubleSide, vertexColors: false }), conf);
    const cc = new T.Color(); for (let i = 0; i < 500; i++) confetti.setColorAt(i, cc.set([0xe40303, 0xff8c00, 0xffed00, 0x008026, 0x24408e, 0x732982][i % 6]));
    if (!ctx.reduced) { const m = new T.Matrix4(), p = new T.Vector3(), q = new T.Quaternion(), s = new T.Vector3(1, 1, 1); k.ticks.push((t, dt) => { for (let i = 0; i < 500; i++) { confetti.getMatrixAt(i, m); p.setFromMatrixPosition(m); p.y -= (0.5 + (i % 5) * 0.2) * Math.min(dt, 0.1); p.x += Math.sin(t * 2 + i) * 0.01; if (p.y < 0.1) p.y = 14; q.setFromEuler(new T.Euler(t * 2 + i, t + i, 0)); m.compose(p, q, s); confetti.setMatrixAt(i, m); } confetti.instanceMatrix.needsUpdate = true; }); }
    /* flags out of the windows on angled poles, waving: one shared cloth geometry per flag, rewritten each frame */
    { const flagTex = canvas('swFlag', 256, 168, (g, W, H) => { ['#e40303', '#ff8c00', '#ffed00', '#008026', '#24408e', '#732982'].forEach((c, i) => { g.fillStyle = c; g.fillRect(0, (i * H) / 6, W, H / 6 + 1); }); }, [], false);
      const cloth = flagTex ? new T.MeshStandardMaterial({ map: flagTex, side: T.DoubleSide, roughness: 0.85 }) : k.flat(0xe83a8a, 0, 0.8, { side: T.DoubleSide });
      const flags: T.Mesh[] = [];
      for (const [x, y, z, s] of [[-11, 7.2, 30, 1], [-11, 9.6, 20, 1], [11, 7.6, 40, -1], [11, 10.4, 32, -1], [11, 8.0, -14, -1], [-11, 7.6, 46, 1]] as [number, number, number, number][]) {
        k.beam(v(x, y, z), v(x + s * 2.0, y + 1.2, z), 0.035, iron, 5);
        const fg = new T.PlaneGeometry(1.8, 1.15, 12, 4); fg.translate(0.9, -0.58, 0);
        const f = k.mesh(fg, cloth, x + s * 2.0, y + 1.2, z, true); f.rotation.y = s > 0 ? -PI / 2 : PI / 2; f.userData.base = Float32Array.from(fg.attributes.position.array as Float32Array); flags.push(f); }
      if (!ctx.reduced) k.ticks.push((t) => flags.forEach((f, j) => { const pa = f.geometry.attributes.position as T.BufferAttribute, b = f.userData.base as Float32Array; for (let i = 0; i < pa.count; i++) { const x = b[i * 3]; pa.setZ(i, Math.sin(x * 3 - t * 5 + j) * 0.12 * x); } pa.needsUpdate = true; })); }
    /* the illusion (one trick a room): PRIDE painted flat down Christopher Street in the flag's colours, stretched so
       that from where you arrive it stands up over the march like a banner */
    { const t = floorType('PRIDE', ['#e40303', '#ff8c00', '#ffed00', '#008026', '#24408e', '#732982']); if (t) anamorphTex(k, t, -8.2, 46, 3, 0.16, -0.25, 14, 6, 1.8, 0.85); }
    k.egg(v(-6.5, 0.6, 30), { id: 'stonewall-anamorph', title: 'A banner that is not there', text: 'PRIDE is painted flat on the asphalt of Christopher Street, stretched down the block, so that from the corner where you arrive it stands up over the march like a banner. Step onto it and it falls back into long stripes of paint. The trick is anamorphosis, the same one that hides a skull across the floor of Hans Holbein\'s The Ambassadors of 1533.', clue: 'Go back to where you came in and look down the street.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.8 });
    k.censusWall({ x: 10.66, y: 3.4, z: -30, rotY: -PI / 2, cols: 30, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(600, 120), pieces: ctx.all, backing: dark });
    // the works: banners across the street between the fire escapes, the park fence, the bar's flank
    const mounts: Mount[] = [];
    for (let i = 0; i < 8; i++) { const z = 50 - i * 12; const s = i % 2 ? 1 : -1; k.box(0.14, 3.0, 4.2, s * 10.5, 4.6, z, dark); mounts.push({ position: v(s * 10.4, 4.6, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 3, z), width: 3.6, height: 2.4, style: 'none', wash: false }); }
    for (let i = 0; i < 5; i++) { const t = 0.12 + i * 0.19; const p = P[0].clone().lerp(P[1], t); const ang = Math.atan2(P[1].x - P[0].x, P[1].z - P[0].z); mounts.push({ position: v(p.x - Math.cos(ang) * 0.3, 1.6, p.z + Math.sin(ang) * 0.3), rotation: ang - PI / 2, target: v(p.x - Math.cos(ang) * 6, 2, p.z + Math.sin(ang) * 6), width: 2.6, height: 1.6, style: 'white', wash: false }); k.box(2.9, 1.9, 0.1, p.x, 1.6, p.z, white).rotation.y = ang; }
    for (let i = 0; i < 4; i++) { const z = -38 + i * 3; mounts.push({ position: v(2.2, 1.6, z), rotation: -PI / 2, target: v(-3, 2, z), width: 2.4, height: 1.5, style: 'white', wash: false }); k.box(0.1, 1.9, 2.7, 2.05, 1.6, z, white); }
    for (let i = 0; i < 3; i++) { const z = BZ - 12 - i * 5; k.box(0.2, 3, 4.2, -10.7, 2.6, z, dark); mounts.push({ position: v(-10.55, 2.6, z), rotation: PI / 2, target: v(-4, 2.5, z), width: 3.6, height: 2.1, style: 'none', wash: false }); }
    return { mounts, spawn: v(-8.2, 3, 46), look: v(-1, 4, -20), eye: 3, /* stonewall: three works run east along Christopher Street to x 25 */ bounds: [-10, 32, -70, 66], style: 'white' };
  },
};

/* ---------------- 69 THE FEAST ---------------- */
export const sangennaro: RoomDef = {
  id: 'sangennaro',
  name: 'The feast on Mulberry',
  area: 'THE FEAST OF SAN GENNARO',
  mood: 'Eleven nights in September',
  color: '#e8503a',
  description: 'Mulberry Street under the arches of lights, the zeppole stands, the sausage smoke, the saint carried down the block, the works between the strings of bulbs.',
  signatures: 'Arches of red white and green lights spanning the street block after block, food stands with striped awnings and steam, the tenements with fire escapes, the statue of the saint on his litter pinned with ribbons, the cannoli.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x14183a, horizon: 0x5a3a48, ground: 0x0e0e12, fog: 0.003, stars: 160, env: 0.6 });
    k.hemi(0xffe0c0, 0x1a1418, 0.5);
    const asphalt = k.pbr('sgRoad', X.asphalt(0x2a2a2e), 0.11),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      steel = k.flat(0x8c98a4, 0.9, 0.3),
      wood = sc(k, 'sangennaro', 'weathered_planks', 2, () => X.planks(0x8a6a48, 4, 191), { color: 0xd8b890 }, 0x4a3a28),
      redS = k.flat(0xc62828, 0, 0.8), whiteS = k.flat(0xf4f0e8, 0, 0.8), greenS = k.flat(0x2e7d32, 0, 0.8),
      gold = k.pbr('sgGold', X.gilt(0xd0a852), 2, { metalness: 0.85, roughness: 0.3 }),
      steam = k.flat(0xffffff, 0, 1, { transparent: true, opacity: 0.25 }),
      pastry = k.flat(0xd8a860, 0, 0.8);
    // the street, the tenements
    street(k, { w: 10, len: 160, z: 0, x: 0, walk: 4 });
    blockFront(k, { x: -9, z0: 80, count: 20, face: 1, seed: 192, h: [12, 18] });
    blockFront(k, { x: 9, z0: 80, count: 20, face: -1, seed: 193, h: [12, 18] });
    k.skyline({ z: -200, count: 24, spacing: 10, scale: 3.0, base: -1, seed: 194, lit: 0.4, glow: 1.0, tint: 0x2a3244, rows: 1 });
    // the arches of light: every twelve metres a steel arch with three rows of bulbs and a crown of light at the top
    /* 2026-11-24 (wave 4b): the 585 bulbs were 585 meshes, about 1,800 of the room's 3,000 draw calls. They are six
       instanced meshes now (three colours, two chase phases), and each arch gained the luminarie crown: a ring and
       a sunburst of bulbs over the middle of the street */
    const bulbAt: number[][][] = [[], [], [], [], [], []];
    for (let z = 72; z >= -72; z -= 12) {
      const pts: T.Vector3[] = []; for (let i = 0; i <= 16; i++) { const a = (i / 16) * PI; pts.push(v(-Math.cos(a) * 8.5, 5 + Math.sin(a) * 4.4, z)); }
      k.curve(pts, 0.08, steel, 16);
      for (const s of [-1, 1]) k.box(0.16, 5.2, 0.16, s * 8.5, 2.6, z, steel);
      for (let row = 0; row < 3; row++) for (let i = 1; i < 16; i++) { const a = (i / 16) * PI; const r = 4.4 - row * 0.7; bulbAt[row * 2 + (i % 2)].push([-Math.cos(a) * (8.5 - row * 0.9), 5 + Math.sin(a) * r - row * 0.2, z]); }
      k.mesh(new T.TorusGeometry(1.25, 0.05, 6, 28), steel, 0, 10.6, z);
      for (let i = 0; i < 20; i++) { const a = (i / 20) * PI * 2; bulbAt[2 + (i % 2)].push([Math.cos(a) * 1.25, 10.6 + Math.sin(a) * 1.25, z]); }
      for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; for (let j = 1; j <= 3; j++) bulbAt[(i % 2 ? 0 : 4) + (j % 2)].push([Math.cos(a) * 0.3 * j, 10.6 + Math.sin(a) * 0.3 * j, z]); }
      k.point(0, 8, z, 0xffd8a0, 30, 16);
    }
    const bulbG = new T.SphereGeometry(0.11, 6, 5), bulbMats = [0xff4a3a, 0xff4a3a, 0xfff4d8, 0xfff4d8, 0x4ad86a, 0x4ad86a].map((c) => new T.MeshBasicMaterial({ color: c }));
    bulbAt.forEach((at, j) => { const im = k.instances(bulbG, bulbMats[j], at.map(([x, y, z]) => new T.Matrix4().makeTranslation(x, y, z))); im.castShadow = im.receiveShadow = false; });
    { const base = [0xff4a3a, 0xff4a3a, 0xfff4d8, 0xfff4d8, 0x4ad86a, 0x4ad86a].map((c) => new T.Color(c)); if (!ctx.reduced) k.ticks.push((t) => bulbMats.forEach((m, j) => { const on = Math.sin(t * 5 + (j >> 1) * 2.1 + (j % 2) * PI) > -0.3; m.color.copy(base[j]).multiplyScalar(on ? 1 : 0.3); })); }
    for (let z = 66; z >= -66; z -= 12) { for (let c = 0; c < 6; c++) k.box(0.04, 3, 0.04, -8.5 + 0.02, 6.5 + 0, z + 1 + c * 0.5, [redS, whiteS, greenS][c % 3]); }
    // the stands: striped awnings on both curbs, counters, steam, the goods
    const rnd = X.mulberry(69);
    const pot: number[][] = [], pastryAt: number[][] = [], onionAt: number[][] = [], cakeAt: number[][] = [], crateAt: number[][] = [], barrelAt: number[][] = [], shelfAt: number[][] = [], lanternAt: number[][] = [];
    for (let i = 0; i < 14; i++) {
      const s = i % 2 ? 1 : -1; const z = 60 - i * 9; const x = s * 6.2;
      k.box(3.2, 1.0, 2.4, x, 0.5, z, wood); k.box(3.4, 0.08, 2.6, x, 1.04, z, whiteS);
      for (const dx of [-1.5, 1.5]) for (const dz of [-1.1, 1.1]) k.box(0.06, 3.0, 0.06, x + dx, 1.5, z + dz, steel);
      for (let st = 0; st < 6; st++) k.box(3.6 / 6, 0.06, 3.0, x - 1.8 + 0.3 + st * 0.6, 3.05, z, [redS, whiteS, greenS][st % 3]);
      k.block(x - 1.7, x + 1.7, z - 1.3, z + 1.3);
      const kind = i % 4;
      if (kind === 0) { const st = k.mesh(new T.SphereGeometry(0.9, 8, 6), steam, x, 2.0, z, true); st.userData.p = 0; if (!ctx.reduced) k.ticks.push((t) => { st.position.y = 1.6 + ((t * 0.3 + i) % 1) * 1.2; st.scale.setScalar(0.6 + ((t * 0.3 + i) % 1)); (st.material as T.MeshStandardMaterial).opacity = 0.3 * (1 - ((t * 0.3 + i) % 1)); }); }
      if (kind === 1) { for (let j = 0; j < 8; j++) k.cyl(0.08, 0.7, x - 1.2 + j * 0.34, 1.1, z + 0.3, k.flat(0x8a3a2a, 0, 0.7), 0.08, 8).rotation.z = PI / 2; k.box(2.4, 0.3, 1.0, x, 1.2, z - 0.4, dark); }
      if (kind === 2) { for (let j = 0; j < 10; j++) k.cyl(0.12, 0.5, x - 1.2 + j * 0.27, 1.16, z, k.flat(0xf4e8d0, 0, 0.6), 0.12, 8).rotation.z = PI / 2; }
      if (kind === 3) { for (let j = 0; j < 6; j++) { const c = k.flat([0xe83a3a, 0xf1c531, 0x3aa06a, 0x3a8ad8][j % 4], 0, 0.6); k.sphere(0.3, x - 1.2 + j * 0.5, 4.2 + (j % 2) * 0.4, z, c, 8); k.beam(v(x - 1.2 + j * 0.5, 3.1, z), v(x - 1.2 + j * 0.5, 3.9 + (j % 2) * 0.4, z), 0.01, whiteS, 3); } }
      for (const f of [-1, 1]) hsign(k, ['ZEPPOLE', 'SAUSAGE & PEPPERS', 'CANNOLI', 'GAMES  ·  PRIZES'][kind], 3.2, 0.5, x, 3.5, z + f * 1.55, f > 0 ? 0 : PI, { fg: '#f4f0e8', bg: ['#c62828', '#1f6a34', '#c62828', '#1d3f8e'][kind], border: '#f4f0e8', font: 'W2 Archivo Expanded', size: 0.5 });
      const top = 1.08, back = x + s * 1.2;
      if (kind === 0) { pot.push([x + 0.6, top, z, 0]); for (let j = 0; j < 8; j++) pastryAt.push([x - 1.2 + (j % 4) * 0.32, top, z - 0.5 + Math.floor(j / 4) * 0.5, j]); }
      if (kind === 1) for (let j = 0; j < 7; j++) onionAt.push([x + 0.6 + (j % 3) * 0.22, top, z - 0.3 + Math.floor(j / 3) * 0.22, j]);
      if (kind === 2) { cakeAt.push([x + 0.9, top, z - 0.4, 0], [x + 0.9, top, z + 0.5, 1]); for (let j = 0; j < 4; j++) pastryAt.push([x - 0.4 + j * 0.3, top, z + 0.75, j]); }
      if (kind === 3) crateAt.push([back + s * 0.4, 0.14, z - 0.6, 0.2], [back + s * 0.4, 0.62, z - 0.6, 0.5]);
      crateAt.push([back + s * 0.6, 0.14, z + 1.6, i]); barrelAt.push([x - s * 0.1, 0.14, z + (i % 2 ? 1.9 : -1.9), i]); shelfAt.push([back + s * 0.55, 0.14, z, s > 0 ? -PI / 2 : PI / 2]); lanternAt.push([x - s * 1.45, 1.9, z + 1.05, 0]);
      k.point(x, 2.6, z, 0xffe0b0, 8, 5);
    }
    /* the real things on and around the stands, CC0 scans (Poly Haven): fryers, pastries, onions for the peppers, cakes
       at the cannoli stand, crates, wine barrels, display shelves behind the counters, a lantern on each corner post */
    const R = 'sangennaro';
    many(k, `${R}/ph_brass_pot_01`, { height: 0.42 }, pot);
    many(k, `${R}/ph_croissant`, { length: 0.22 }, pastryAt);
    many(k, `${R}/ph_yellow_onion`, { height: 0.14 }, onionAt);
    many(k, `${R}/ph_strawberry_chocolate_cake`, { height: 0.22 }, cakeAt);
    many(k, `${R}/ph_wooden_crate_01`, { height: 0.48 }, crateAt);
    many(k, `${R}/ph_wine_barrel_01`, { height: 0.95 }, barrelAt);
    many(k, `${R}/ph_wooden_display_shelves_01`, { height: 1.9 }, shelfAt);
    many(k, `${R}/ph_wooden_lantern_01`, { height: 0.42 }, lanternAt);
    many(k, `${R}/ph_wine_bottles_01`, { height: 0.34 }, shelfAt.filter((_, i) => i % 4 === 1).map(([x, , z]) => [x, 1.12, z + 0.4, 0]));
    many(k, `${R}/ph_lemon`, { height: 0.08 }, onionAt.map(([x, y, z, r]) => [x - 1.4, y, z + 0.1, r]));
    // the shop fronts behind the stands: lettered signs over the ground floor windows, nobody's name
    ['CAFFE', 'PASTICCERIA', 'SALUMERIA', 'RISTORANTE', 'GELATERIA', 'LATTICINI', 'PANETTERIA', 'TRATTORIA'].forEach((t, i) => { const s = i % 2 ? 1 : -1, z = 51 - i * 16.5; hsign(k, t, 3.4, 0.62, s * 8.94, 4.15, z, s > 0 ? -PI / 2 : PI / 2, { fg: ['#f4f0e8', '#ffd8a0', '#9af0b0'][i % 3], bg: ['#7a1a1a', '#1a1c20', '#1f4a2a'][i % 3], border: '#d8b46a', font: i % 2 ? 'W2 Archivo Expanded' : 'W2 Permanent Marker', size: 0.6 }); });
    /* the illusion (one trick a room): VIVA SAN GENNARO painted flat down the middle of Mulberry Street in the colours of
       the lights, stretched so that from the north end it stands up under the arches like a banner */
    { const t = floorType('VIVA SAN GENNARO', ['#ff4a3a', '#fff4d8', '#4ad86a']); if (t) anamorphTex(k, t, 1.5, 72, 3, 0.02, 0.016, 10, 7.4, 2.0, 0.85); }
    k.egg(v(1, 0.6, 52), { id: 'sangennaro-anamorph', title: 'A banner that is not there', text: 'VIVA SAN GENNARO is painted flat down the middle of Mulberry Street, stretched toward the south, so that from the north end of the feast it stands up under the arches like a banner. Walk onto it and it falls back into long smears of red, white and green. The trick is anamorphosis, the same one that hides a skull across the floor of Hans Holbein\'s The Ambassadors of 1533.', clue: 'Go back to where you came in and look down the street.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.8 });
    // the procession banners on the fire escapes (FIREFLY_QUEUE.md, sangennaro): plain festival cloth until they land
    for (let i = 0; i < 6; i++) { const s = i % 2 ? 1 : -1, z = 45 - i * 24; fireflyPlate(k, 'assets/museum/tex/sangennaro/ff_procession_banner.webp', 1.4, 4.2, s * 8.9, 9.6, z, s > 0 ? -PI / 2 : PI / 2, k.flat([0xc62828, 0xf4f0e8, 0x2e7d32][i % 3], 0, 0.85, { side: T.DoubleSide })); }
    // the procession: the saint on his litter carried down the middle, the band ahead, the crowd all round
    const litter = new T.Group();
    const base = new T.Mesh(new T.BoxGeometry(2.2, 0.4, 2.6), gold); base.position.y = 1.6; litter.add(base);
    /* the saint is carried as a half figure bust in bishop's robes and mitre, not a full standing statue */
    const saint = new T.Mesh(new T.CapsuleGeometry(0.5, 0.5, 4, 10), k.flat(0xf4e8d0, 0, 0.6)); saint.position.y = 2.35; litter.add(saint);
    const head = new T.Mesh(new T.SphereGeometry(0.26, 12, 10), k.flat(0xe8d4b8, 0, 0.6)); head.position.y = 3.25; litter.add(head);
    const mitre = new T.Mesh(new T.ConeGeometry(0.24, 0.6, 6), gold); mitre.position.y = 3.75; litter.add(mitre);
    for (let i = 0; i < 30; i++) { const rib = new T.Mesh(new T.PlaneGeometry(0.16, 0.7 + (i % 3) * 0.3), k.flat([0x3aa06a, 0xf4f0e8, 0xe83a3a][i % 3], 0, 0.8, { side: T.DoubleSide })); const a = (i / 30) * PI * 2; rib.position.set(Math.cos(a) * 0.7, 2.4 + (i % 4) * 0.25, Math.sin(a) * 0.7); rib.rotation.y = -a; litter.add(rib); }
    /* 2026-10-28: the four bearers stand under the poles, feet on the street and shoulders at the pole (1.5 m), working men in suits and jackets */
    const bearerCast = ['wiseguy', 'cabbie', 'oscar', 'cabbie']; let bi = 0;
    for (const dx of [-1.2, 1.2]) for (const dz of [-1.5, 1.5]) { const bearer = new T.Mesh(new T.CapsuleGeometry(0.2, 0.9, 3, 8), k.flat(0xf4f0e8, 0, 0.8)); bearer.position.set(dx, 0.65, dz); litter.add(personTag(bearer, 'auto', 1.41, bearerCast[bi++])); const pole = new T.Mesh(new T.BoxGeometry(0.08, 0.08, 3.4), wood); pole.position.set(dx, 1.5, 0); litter.add(pole); }
    k.add(litter);
    /* the saint is a real carved figure now, a CC0 scan of a gothic statue (Poly Haven) warmed to painted ivory, in place
       of the capsule; the capsule stays until it loads */
    void hero(k, `sangennaro/ph_gothic_statue`, { height: 1.75 }).then((h) => { if (!h || !k.live) return; recolour(h, 0xfff0dc, 0.6, 0, true); h.position.y = 1.8; litter.add(h); saint.visible = head.visible = mitre.visible = false; });
    if (!ctx.reduced) k.rider(litter, k.spline([v(0, 0, 76), v(0.4, 0, 0), v(0, 0, -76), v(-14, 0, -90), v(14, 0, -90)], true), 0.7, 60);
    if (!ctx.reduced) k.ticks.push((t) => { litter.position.y = 0.08 * Math.sin(t * 3); });
    k.crowd([v(-3.2, 0, -70), v(-3.2, 0, 70)], 40, { seed: 76, speed: 0.5, spread: 1.4, animate: !ctx.reduced });
    k.crowd([v(3.2, 0, -70), v(3.2, 0, 70)], 40, { seed: 77, speed: 0.5, spread: 1.4, animate: !ctx.reduced });
    k.crowd([v(0, 0, 60), v(0, 0, -60)], 20, { seed: 78, speed: 0.4, spread: 1.6, animate: !ctx.reduced });
    k.censusWall({ x: -8.66, y: 3.2, z: 0, rotY: PI / 2, cols: 30, rows: 3, tile: 0.55, gap: 0.05, start: ctx.wallStart(1400, 90), pieces: ctx.all, backing: dark });
    k.box(0.3, 5, 18, -8.9, 3, 0, dark);
    k.sign('FESTA  ·  SAN GENNARO  ·  MULBERRY STREET', 10, 0.8, 0, 9.2, 78, '#c62828', '#f4f0e8', 90, PI, { border: true });
    k.box(11, 1.0, 0.3, 0, 9.2, 78.2, dark);
    const FSG = 'https://en.wikipedia.org/wiki/Feast_of_San_Gennaro', MUL = 'https://en.wikipedia.org/wiki/Mulberry_Street_(Manhattan)';
    k.egg(v(0, 8.4, 77.6), { id: 'sangennaro-1926', title: 'One day became eleven', year: '1926', text: 'Immigrants from Naples first held the feast on Mulberry Street in 1926. It began as a one day religious observance and grew into an eleven day festival.', clue: 'Read the big FESTA sign at the north end.', source: { name: 'Feast of San Gennaro, Wikipedia', url: FSG } }, { r: 1.8 });
    k.egg(v(0, 3, 70), { id: 'sangennaro-ribbons', title: 'Money on the ribbons', text: 'Donations are pinned to the ribbon streamers that hang from the statue, and the money went to poorer residents of the neighbourhood. The Grand Procession starts at 2 p.m. on the last Saturday, after a Mass at the Church of the Most Precious Blood.', clue: 'Wait under the first arch for the saint to be carried past.', source: { name: 'Feast of San Gennaro, Wikipedia', url: FSG } }, { r: 1.8 });
    k.egg(v(-6.2, 1.6, 42), { id: 'sangennaro-vesuvius', title: 'The blood and the volcano', year: '1631', text: 'Saint Januarius\'s feast day is September 19, the date of his martyrdom in 305. His blood is said to liquefy three times a year, one of them on December 16, for the day he is believed to have helped end the eruption of Vesuvius in 1631.', clue: 'Find the cannoli stand on the west curb.', source: { name: 'Feast of San Gennaro, Wikipedia', url: FSG } }, { r: 1.0 });
    k.egg(v(-8.4, 3, 30), { id: 'sangennaro-bend', title: 'Slaughter-house Street', year: '1755', text: 'Mulberry Street is on maps from at least 1755 and is named for the mulberry trees that once lined Mulberry Bend. During the Revolution it was often called Slaughter-house Street, after a slaughterhouse that was cleared away in the summer of 1784.', clue: 'Look at the tenement fronts on the west side.', source: { name: 'Mulberry Street (Manhattan), Wikipedia', url: MUL } }, { r: 1.6 });
    k.egg(v(0, 7.2, -79), { id: 'sangennaro-church', title: 'A church of their own', text: 'The Church of the Most Precious Blood, at 113 Baxter Street, was built by Italians who were not allowed to worship in the main churches of the area. The procession sets out from its Mass.', clue: 'Look up at the brick wall at the south end of the feast.', source: { name: 'Mulberry Street (Manhattan), Wikipedia', url: MUL } }, { r: 1.0 });
    k.egg(v(8.4, 3, -36), { id: 'sangennaro-bank', title: 'Bankers of Mulberry Street', year: '1896', text: 'The Italian American Museum is at 155 Mulberry Street, in the building of the old immigrant bank Banca Stabile. In 1896 the New York Times reported that there were more bankers among the Italians than among any other foreigners in the city except the Germans.', clue: 'Look at the tenements on the east side, south of the stands.', source: { name: 'Mulberry Street (Manhattan), Wikipedia', url: MUL } }, { r: 1.6 });
    // the works: hung from the arches on both sides, on the stand backs, on the tenement stoops
    const mounts: Mount[] = [];
    for (let i = 0; i < 12; i++) { const z = 66 - i * 12; const s = i % 2 ? 1 : -1; k.box(0.12, 2.2, 3.0, s * 7.9, 5.6, z, dark); mounts.push({ position: v(s * 7.8, 5.6, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 3, z), width: 2.6, height: 1.8, style: 'none', wash: false }); k.beam(v(s * 7.9, 6.8, z), v(s * 8.5, 7.6, z), 0.02, steel, 3); }
    for (let i = 0; i < 7; i++) { const s = i % 2 ? 1 : -1; const z = 60 - i * 18; const x = s * 8.66; mounts.push({ position: v(x, 2.0, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 4, 2, z), width: 2.4, height: 1.6, style: 'black', wash: false }); }
    for (let i = 0; i < 3; i++) { const x = -5 + i * 5; mounts.push({ position: v(x, 3.4, -79.66), rotation: 0, target: v(x, 3, -70), width: 4.2, height: 2.5, style: 'black', wash: true }); }
    k.box(18, 8, 0.6, 0, 4, -80, sc(k, 'sangennaro', 'red_brick', 2.2, () => X.brick(0x6a4436, 195), { color: 0xb08878 }, 0x3a2620)); k.block(-9, 9, -80.6, -79.4);
    return { mounts, spawn: v(1.5, 3, 72), look: v(0, 5, -20), eye: 3, bounds: [-8.4, 8.4, -79, 78], style: 'black' };
  },
};

/* ---------------- 70 THE CHELSEA HOTEL ---------------- */
export const chelseahotel: RoomDef = {
  id: 'chelseahotel',
  name: 'The lobby of the hotel',
  area: 'THE CHELSEA HOTEL',
  mood: 'Room rate paid in paintings',
  color: '#b8483a',
  description: 'Twenty third Street under the iron balconies, the lobby hung floor to ceiling with the art residents left instead of rent, the stair climbing up through the building, the works in every frame.',
  signatures: 'The red brick front with white stone bands and flowered iron balconies on floors two to eight, eleven storeys high, the neon vertical sign, the lobby with its fireplace and salon hang, the famous open stair with iron balusters climbing through the building, the corridors of numbered doors.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad0, horizon: 0xe8e6e0, ground: 0x5a5a55, fog: 0.0022, sun: { az: 3.7, el: 0.7, color: 0xfff4e6, size: 12 }, env: 0.85 });
    k.hemi(0xfff0dc, 0x3a3020, 0.6);
    k.sun(0xfff0d8, 1.6, 30, 60, 40, true, 70);
    /* 2026-11-24 (wave 4b): scans (Poly Haven, CC0) for the red brick, the white stone bands, the lobby's marble floor
       and plaster, the dark wood of the desk and the stair, the velvet; real CC0 furniture (Poly Haven) in the lobby */
    const R = 'chelseahotel';
    const brick = sc(k, R, 'red_brick_03', 2.4, () => X.brick(0x8a3a2e, 196), { color: 0xc08070 }, 0x4a2620),
      iron = k.flat(0x1a1c20, 0.7, 0.45),
      cream = sc(k, R, 'white_sandstone_blocks_02', 2.2, () => X.plaster(0xe0d4c0, 91), { color: 0xeee6d8 }, 0x8a847a),
      plaster = sc(k, R, 'white_plaster_02', 2.5, () => X.plaster(0xe0d4c0, 91), { color: 0xf0dcc4 }, 0x8a7e70),
      wood = sc(k, R, 'dark_wood', 1.6, () => X.planks(0x4a2e1c, 5, 197), { color: 0xc8a088, roughness: 0.6 }, 0x2a1a12),
      floorT = sc(k, R, 'marble_tiles', 1.6, () => X.terrazzo(0xb8a890, 92), { color: 0xf0e8dc, roughness: 0.5 }, 0x8a8478),
      marble = sc(k, R, 'marble_01', 1.4, () => X.marble(0xd8cfb8, 0x8a7a5a, 14), { color: 0xe8e0d0, roughness: 0.4 }, 0x8a8478),
      neon = k.glow(0xff3a3a),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      glass = k.glass(0xffe0b0, 0.3, 0.1);
    // 23rd Street and the twelve storey front with its balconies
    street(k, { w: 24, len: 140, z: 30, x: 0 });
    blockFront(k, { x: -50, z0: 90, count: 10, face: 1, seed: 198, h: [14, 26] });
    const FZ = 8, W = 40, H = 46;
    k.box(W, H, 40, 0, H / 2, FZ - 20, brick);
    /* eleven storeys on the front; the flowered iron balconies run on floors two to eight only; white stone bands */
    /* the windows read as windows now (a dark room behind the glass, a stone lintel and sill), and the balconies carry
       their flowered cast iron: one painted panel per balcony, instanced, where eleven little bars stood
       (FIREFLY_QUEUE.md, chelseahotel: the real ironwork plate replaces the painted one by file name) */
    const panelAt: T.Matrix4[] = [];
    for (let f = 1; f < 11; f++) { const y = 2 + f * 3.8; k.box(W, 0.3, 0.2, 0, y - 0.2, FZ + 0.1, cream); for (let i = 0; i < 7; i++) { const x = -16 + i * 5.3; if (f <= 7) { k.box(3.2, 0.12, 1.2, x, y, FZ + 0.6, iron); panelAt.push(new T.Matrix4().makeTranslation(x, y + 0.5, FZ + 1.17)); k.box(3.24, 0.06, 0.08, x, y + 0.97, FZ + 1.17, iron); for (const b of [-1.58, 1.58]) k.box(0.06, 0.94, 0.06, x + b, y + 0.5, FZ + 1.17, iron); } k.box(2.0, 2.6, 0.1, x, y + 1.5, FZ + 0.06, glass); k.box(2.2, 2.8, 0.12, x, y + 1.5, FZ + 0.01, k.flat(0x16110e, 0, 0.8)); k.box(2.7, 0.32, 0.3, x, y + 3.0, FZ + 0.12, cream); k.box(2.5, 0.14, 0.34, x, y + 0.16, FZ + 0.14, cream); } }
    { const ironTex = canvas('chlIron', 512, 160, (g, Wd, Hd) => { g.clearRect(0, 0, Wd, Hd); g.strokeStyle = '#15171a'; g.fillStyle = '#15171a'; g.lineWidth = 6; g.strokeRect(4, 4, Wd - 8, Hd - 8); for (let i = 0; i < 8; i++) { const cx = 32 + i * 64, cy = Hd / 2; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, 8); g.lineTo(cx, Hd - 8); g.stroke(); for (let p = 0; p < 6; p++) { const a = (p / 6) * PI * 2; g.beginPath(); g.ellipse(cx + Math.cos(a) * 14, cy + Math.sin(a) * 14, 12, 6, a, 0, PI * 2); g.stroke(); } g.beginPath(); g.arc(cx, cy, 6, 0, PI * 2); g.fill(); for (const d of [-1, 1]) { g.beginPath(); g.moveTo(cx, cy + d * 24); g.bezierCurveTo(cx + 22, cy + d * 30, cx + 30, cy + d * 56, cx + 32, cy + d * 62); g.stroke(); g.beginPath(); g.moveTo(cx, cy + d * 24); g.bezierCurveTo(cx - 22, cy + d * 30, cx - 30, cy + d * 56, cx - 32, cy + d * 62); g.stroke(); } } }, [], false);
      const panel = ironTex ? new T.MeshStandardMaterial({ map: ironTex, transparent: true, alphaTest: 0.4, side: T.DoubleSide, metalness: 0.6, roughness: 0.5 }) : iron;
      const im = k.instances(new T.PlaneGeometry(3.1, 0.88), panel, panelAt); im.castShadow = false;
      if (texL) texL.load('assets/museum/tex/chelseahotel/ff_balcony_iron.webp', (t) => { if (!k.live) { t.dispose(); return; } t.colorSpace = T.SRGBColorSpace; (panel as T.MeshStandardMaterial).map = t; (panel as T.MeshStandardMaterial).needsUpdate = true; }, undefined, () => {}); }
    const brassP = k.pbr('chlBrass', X.gilt(0xc9a55a), 2, { metalness: 0.85, roughness: 0.35 });
    for (const sx of [-1, 1]) for (let r = 0; r < 3; r++) k.box(0.7, 0.45, 0.04, sx * 2.9, 1.3 + r * 0.6, FZ + 0.04, brassP);
    /* the cornice ran along z, 40 m out of the front into 23rd Street (k.moulding extrudes along z): turned to run along the front */
    k.moulding([[0, 0], [0.9, 0], [1.0, 0.3], [0.6, 0.5], [0.8, 0.8], [0, 1.0]], W + 0.4, 0, H - 0.5, FZ + 0.05, cream, -PI / 2);
    /* the vertical sign: it lost its last letter (twelve boxes for thirteen characters), and its letters were small red
       dots in a 140 px default face; now all thirteen, as big neon letters in the house face, on both sides of the blade */
    for (let i = 0; i < 13; i++) { const ch = 'HOTEL CHELSEA'[i]; const y = 41 - i * 2.4; k.box(2.2, 2.4, 1.0, -W / 2 - 1.2, y, FZ + 1.2, dark); if (ch !== ' ') for (const f of [0, PI]) hsign(k, ch, 1.9, 2.1, -W / 2 - 1.2, y, FZ + 1.2 + (f ? -0.52 : 0.52), f, { fg: '#ff3a3a', font: 'W2 Archivo Expanded', size: 0.92 }); }
    k.mesh(new T.BoxGeometry(0.08, 30, 0.08), neon, -W / 2 - 2.3, 26, FZ + 1.2); k.mesh(new T.BoxGeometry(0.08, 30, 0.08), neon, -W / 2 - 0.1, 26, FZ + 1.2);
    k.arch(3.6, 5.2, 4, 0, 0, FZ - 1.6, marble, false, 0.85);
    k.box(6, 1.2, 4, 0, 5.4, FZ + 1.2, dark);
    k.sign('CHELSEA', 5, 0.9, 0, 5.4, FZ + 3.22, '#14090a', '#f4e4b0', 100, 0, { border: true });
    k.block(-W / 2, -1.8, FZ - 0.5, FZ + 0.5); k.block(1.8, W / 2, FZ - 0.5, FZ + 0.5);
    // the lobby: a tall salon with the fireplace, the desk, the stair rising in the well behind
    const LW = 22, LD = 24, LZ = FZ, LH = 8;
    k.box(LW, 0.3, LD, 0, 0.15, LZ - LD / 2, floorT);
    for (const s of [-1, 1]) { k.box(0.6, LH, LD, s * LW / 2, LH / 2, LZ - LD / 2, plaster); k.block(s * LW / 2 - 0.5, s * LW / 2 + 0.5, LZ - LD, LZ); }
    /* the back wall was one solid box across the stair door, so the famous stair was walled off from the lobby: it is
       two walls and a lintel now, and the door opens on the well */
    for (const s of [-1, 1]) k.box(LW / 2 - 2.4, LH, 0.6, s * (LW / 4 + 1.2), LH / 2, LZ - LD, plaster);
    k.box(4.8, LH - 4.2, 0.6, 0, (LH + 4.2) / 2, LZ - LD, plaster);
    k.block(-LW / 2, -2.4, LZ - LD - 0.5, LZ - LD + 0.5); k.block(2.4, LW / 2, LZ - LD - 0.5, LZ - LD + 0.5);
    k.box(LW, 0.4, LD, 0, LH, LZ - LD / 2, plaster);
    /* the room is built now: a dark wood dado with its rail, a plaster cornice round the top, a beamed ceiling */
    for (const s of [-1, 1]) { k.box(0.08, 1.1, LD - 0.2, s * (LW / 2 - 0.34), 0.7, LZ - LD / 2, wood); k.box(0.14, 0.08, LD - 0.2, s * (LW / 2 - 0.36), 1.28, LZ - LD / 2, wood); k.moulding([[0, 0], [0, 0.5], [0.12, 0.45], [0.2, 0.3], [0.35, 0.2], [0.42, 0]], LD - 0.6, s * (LW / 2 - 0.3), LH - 0.7, LZ - LD / 2, plaster, s > 0 ? PI : 0); }
    k.moulding([[0, 0], [0, 0.5], [0.12, 0.45], [0.2, 0.3], [0.35, 0.2], [0.42, 0]], LW - 0.6, 0, LH - 0.7, LZ - LD + 0.3, plaster, -PI / 2);
    for (let z = LZ - 3; z > LZ - LD; z -= 4) k.box(LW - 0.6, 0.36, 0.3, 0, LH - 0.38, z, plaster);
    for (const x of [-3.6, 3.6]) k.box(0.3, 0.36, LD - 0.6, x, LH - 0.4, LZ - LD / 2, plaster);
    /* the fireplace stood 4.6 m out from the wall, a marble slab across the room: turned flat to the wall between the
       hung works, with a firebox, a mantel shelf, a gilt mirror, a clock and candlesticks on it (Poly Haven, CC0) */
    const FPZ = LZ - 10.9;
    k.box(0.6, 2.3, 3.2, -LW / 2 + 0.6, 1.15, FPZ, marble); k.box(0.64, 1.15, 1.4, -LW / 2 + 0.6, 0.62, FPZ, dark); k.box(0.9, 0.12, 3.6, -LW / 2 + 0.75, 2.36, FPZ, marble);
    k.point(-LW / 2 + 1.4, 0.8, FPZ, 0xff9a40, 14, 6); k.keepOut.push({ x: -LW / 2 + 1, z: FPZ, r: 1.6 });
    many(k, `${R}/ph_ornate_mirror_01`, { height: 1.5 }, [[-LW / 2 + 0.38, 2.5, FPZ, PI / 2]]);
    many(k, `${R}/ph_mantel_clock_01`, { height: 0.42 }, [[-LW / 2 + 0.75, 2.42, FPZ, PI / 2]]);
    many(k, `${R}/ph_brass_candleholders`, { height: 0.36 }, [[-LW / 2 + 0.75, 2.42, FPZ - 1.3, PI / 2], [-LW / 2 + 0.75, 2.42, FPZ + 1.3, PI / 2]]);
    k.box(6, 1.1, 1.2, 4, 0.55, LZ - 4, wood); k.box(6.2, 0.1, 1.4, 4, 1.12, LZ - 4, marble); k.block(1, 7, LZ - 4.8, LZ - 3.2);
    /* the box sofas are real furniture now (Poly Haven, CC0): two velvet sofas, armchairs, side tables, palms, a
       grandfather clock by the desk, three chandeliers under the beams */
    for (const [x, z] of [[-4, LZ - 6], [4, LZ - 14], [-3, LZ - 18]]) k.keepOut.push({ x, z, r: 1.6 });
    many(k, `${R}/ph_sofa_03`, { length: 2.4 }, [[-4, 0.3, LZ - 6, 0], [4, 0.3, LZ - 14, PI]], (o) => recolour(o, 0xa83a4a, 0.85, 0, true));
    many(k, `${R}/ph_ArmChair_01`, { height: 1.0 }, [[-5.8, 0.3, LZ - 8.2, 0.7], [-2.2, 0.3, LZ - 8.2, -0.7], [5.8, 0.3, LZ - 11.8, PI + 0.7]]);
    many(k, `${R}/ph_chinese_armchair`, { height: 1.0 }, [[-3, 0.3, LZ - 18, 0], [-1.6, 0.3, LZ - 16.6, -PI / 2]]);
    many(k, `${R}/ph_side_table_01`, { height: 0.6 }, [[-4, 0.3, LZ - 8.4, 0], [2.2, 0.3, LZ - 14, 0]]);
    many(k, `${R}/ph_potted_plant_02`, { height: 1.9 }, [[-LW / 2 + 1.0, 0.3, LZ - 23.2, 0], [LW / 2 - 1.0, 0.3, LZ - 23.2, 1], [-LW / 2 + 1.0, 0.3, LZ - 0.6, 2]]);
    many(k, `${R}/ph_vintage_grandfather_clock_01`, { height: 2.3 }, [[7.6, 0.3, LZ - 2.2, -PI / 2]]);
    many(k, `${R}/ph_ClassicConsole_01`, { length: 2.4 }, [[4, 0.3, LZ - 2.6, PI]]);
    for (const [x, z] of [[-4, LZ - 8.4], [2.2, LZ - 14], [-LW / 2 + 1, LZ - 23.2], [LW / 2 - 1, LZ - 23.2], [-LW / 2 + 1, LZ - 0.6], [7.6, LZ - 2.2], [4, LZ - 2.6], [-5.8, LZ - 8.2], [-2.2, LZ - 8.2], [5.8, LZ - 11.8]]) k.keepOut.push({ x, z, r: 0.7 });
    for (let i = 0; i < 3; i++) k.point(-6 + i * 6, LH - 1.5, LZ - 8 - (i % 2) * 8, 0xffe6c0, 24, 14);
    many(k, `${R}/ph_Chandelier_02`, { height: 1.4 }, [0, 1, 2].map((i) => [-6 + i * 6, LH - 1.82, LZ - 8 - (i % 2) * 8, 0]));
    /* the salon hang: smaller pieces of the room's own New Yorkers, gilt framed, up the walls between the big works and
       in a band under the cornice, the way the lobby filled with what residents left instead of rent */
    { const gilt = k.pbr('chlGilt', X.gilt(0xc9a55a), 2, { metalness: 0.85, roughness: 0.35 }); let n = 0;
      for (const s of [-1, 1]) { const x = s * (LW / 2 - 0.33), rot = s < 0 ? PI / 2 : -PI / 2;
        for (let z = LZ - 1.0; z > LZ - LD + 1; z -= 2.1) billboard(k, ctx, n++, 1.3, 0.8, x, 6.85, z, rot, gilt);
        for (const [z, y] of [[LZ - 6.6, 2.5], [LZ - 6.6, 4.9], [LZ - 17, 2.5], [LZ - 17, 4.9], [LZ - 22.7, 4.6]]) if (!(s < 0 && Math.abs(z - FPZ) < 2.4)) billboard(k, ctx, n++, 1.05, 0.95, x, y, z, rot, gilt); } }
    // the stair well: a square well with the open stair climbing ten flights, the iron balusters, landings you can reach
    const SX = 0, SZ = LZ - LD - 6, SW = 8;
    /* the well's walls, open to the lobby below the door head (the brick block and a closed plaster box hid the stair) */
    { const wp = sc(k, R, 'white_plaster_02', 2.5, () => X.plaster(0xe0d4c0, 91), { color: 0xf0dcc4 }, 0x8a7e70);
      k.box(SW, 32.4, 0.1, SX, 16.2, SZ - SW / 2, wp); for (const s of [-1, 1]) k.box(0.1, 32.4, SW, SX + s * SW / 2, 16.2, SZ, wp); k.box(SW, 28.2, 0.1, SX, 4.2 + 14.1, SZ + SW / 2, wp);
      for (const s of [-1, 1]) k.box(SW / 2 - 2.4, 4.2, 0.1, SX + s * (SW / 4 + 1.2), 2.1, SZ + SW / 2, wp); }
    k.block(SX - SW / 2 - 1, SX + SW / 2 + 1, SZ - SW / 2 - 1, SZ - SW / 2 + 0.2);
    k.block(SX - SW / 2 - 1, SX - SW / 2 + 0.2, SZ - SW / 2, SZ + SW / 2); k.block(SX + SW / 2 - 0.2, SX + SW / 2 + 1, SZ - SW / 2, SZ + SW / 2);
    const flights: [number, number, number, number][] = [];
    for (let f = 0; f < 4; f++) {
      const y0 = f * 3.8; const side = f % 4;
      for (let i = 0; i < 12; i++) { const t = i / 12; const y = y0 + i * (3.8 / 12); let x = 0, z = 0; if (side === 0) { x = SX + SW / 2 - 0.9; z = SZ + SW / 2 - 0.6 - t * (SW - 1.2); } else if (side === 1) { x = SX + SW / 2 - 0.6 - t * (SW - 1.2); z = SZ - SW / 2 + 0.9; } else if (side === 2) { x = SX - SW / 2 + 0.9; z = SZ - SW / 2 + 0.6 + t * (SW - 1.2); } else { x = SX - SW / 2 + 0.6 + t * (SW - 1.2); z = SZ + SW / 2 - 0.9; } k.box(side % 2 ? 0.6 : 1.6, 0.16, side % 2 ? 1.6 : 0.6, x, y + 0.08, z, wood); if (i % 2 === 0) k.box(0.03, 0.95, 0.03, x + (side === 0 ? -0.7 : side === 2 ? 0.7 : 0), y + 0.55, z + (side === 1 ? 0.7 : side === 3 ? -0.7 : 0), iron); }
      flights.push([side, y0, 0, 0]);
    }
    for (let f = 1; f <= 4; f++) { const y = f * 3.8; k.box(SW, 0.2, 1.6, SX, y, SZ + SW / 2 - 0.8, wood); k.box(1.6, 0.2, SW, SX + SW / 2 - 0.8, y, SZ, wood); k.box(SW, 0.2, 1.6, SX, y, SZ - SW / 2 + 0.8, wood); k.box(1.6, 0.2, SW, SX - SW / 2 + 0.8, y, SZ, wood); k.point(SX, y + 2.2, SZ, 0xffe6c0, 12, 8); }
    for (const y of [3, 9, 21, 27]) k.point(SX, y, SZ, 0xffe6c0, 8, 8);
    /* the handrail rides each flight's inner edge (it had only bars), and the illusion (one trick a room): above the
       four flights you can climb, ten more rise in forced perspective, each floor 0.8 the height of the one below, so
       looking up the well the hotel seems to climb forever, as it does in the famous photographs of this stair */
    const rail = (side: number, t: number, y: number) => side === 0 ? v(SX + SW / 2 - 1.6, y, SZ + SW / 2 - 0.6 - t * (SW - 1.2)) : side === 1 ? v(SX + SW / 2 - 0.6 - t * (SW - 1.2), y, SZ - SW / 2 + 1.6) : side === 2 ? v(SX - SW / 2 + 1.6, y, SZ - SW / 2 + 0.6 + t * (SW - 1.2)) : v(SX - SW / 2 + 0.6 + t * (SW - 1.2), y, SZ + SW / 2 - 1.6);
    const mahogany = k.flat(0x3a1a10, 0, 0.45);
    for (let f = 0; f < 4; f++) k.beam(rail(f % 4, 0, f * 3.8 + 1.05), rail(f % 4, 1, f * 3.8 + 3.8 + 1.05), 0.045, mahogany, 6);
    { const tread: T.Matrix4[] = [], bal: T.Matrix4[] = [], q0 = new T.Quaternion(), q1 = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), PI / 2);
      let y0 = 15.2, hF = 3.8;
      for (let f = 4; f < 14; f++) {
        hF *= 0.8; const side = f % 4, sc0 = hF / 3.8;
        for (let i = 0; i < 12; i++) { const t = i / 12, p = rail(side, t, y0 + i * (hF / 12)), c = side === 0 ? v(-0.7, 0, 0) : side === 1 ? v(0, 0, -0.7) : side === 2 ? v(0.7, 0, 0) : v(0, 0, 0.7);
          tread.push(new T.Matrix4().compose(v(p.x - c.x, p.y + 0.08, p.z - c.z), side % 2 ? q1 : q0, v(1, Math.max(0.5, sc0), 1)));
          if (i % 2 === 0) bal.push(new T.Matrix4().compose(v(p.x + c.x * 0.14, p.y + 0.5 * sc0 + 0.08, p.z + c.z * 0.14), q0, v(1, sc0, 1))); }
        k.beam(rail(side, 0, y0 + 1.05 * sc0), rail(side, 1, y0 + hF + 1.05 * sc0), 0.04, mahogany, 6);
        y0 += hF;
        for (const [w, d, dx, dz] of [[SW, 1.6, 0, SW / 2 - 0.8], [1.6, SW, SW / 2 - 0.8, 0], [SW, 1.6, 0, -SW / 2 + 0.8], [1.6, SW, -SW / 2 + 0.8, 0]]) k.box(w, 0.2, d, SX + dx, y0, SZ + dz, wood);
      }
      k.instances(new T.BoxGeometry(1.6, 0.16, 0.6), wood, tread); k.instances(new T.BoxGeometry(0.035, 0.95, 0.035), iron, bal);
      /* the skylight at the top of the well, sealed in the early 1950s; a lit plate until the Firefly one lands */
      k.box(SW, 0.3, SW, SX, y0 + 2.6, SZ, sc(k, R, 'white_plaster_02', 2.5, () => X.plaster(0xe0d4c0, 91), { color: 0xf0dcc4 }, 0x8a7e70));
      const sky = fireflyPlate(k, 'assets/museum/tex/chelseahotel/ff_skylight.webp', 3.2, 3.2, SX, y0 + 2.44, SZ, 0, k.glow(0xe8eef4), true); sky.rotation.x = PI / 2;
      k.point(SX, y0 + 1.5, SZ, 0xe8f0ff, 10, 12); }
    k.egg(v(SX + 2.6, 1.6, SZ + 3), { id: 'chelsea-endless', title: 'The stair that never ends', text: 'Only the first four flights are real. Above them each floor is built at four fifths the height of the one below, so the well narrows to a point far faster than it should and the hotel seems to climb forever. Film sets call it forced perspective: the same trick shrinks the far end of a street on a back lot.', clue: 'Stand at the foot of the stair and look straight up the well.', source: { name: 'Forced perspective, Wikipedia', url: 'https://en.wikipedia.org/wiki/Forced_perspective' } }, { r: 1.2 });
    k.censusWall({ x: -6.7, y: 4.3, z: LZ - LD + 0.34, rotY: 0, cols: 15, rows: 7, tile: 0.5, gap: 0.05, start: ctx.wallStart(6700, 108), pieces: ctx.all, backing: dark });
    k.crowd([v(-6, 0, LZ - 3), v(6, 0, LZ - 20)], 6, { seed: 79, speed: 0.3, spread: 1.6, animate: !ctx.reduced });
    const HC = 'https://en.wikipedia.org/wiki/Hotel_Chelsea';
    k.egg(v(2.9, 1.9, FZ + 0.3), { id: 'chelsea-plaques', title: 'The brass plaques', text: 'Brass plaques beside the main entrance remember the people who lived here. The roll of residents runs from Mark Twain and Dylan Thomas to Arthur Miller, Leonard Cohen, Patti Smith and Arthur C. Clarke.', clue: 'Read the brass plaques beside the front door.', source: { name: 'Hotel Chelsea, Wikipedia', url: HC } }, { r: 1.2 });
    k.egg(v(-16, 2 + 3.8 * 2 + 0.6, FZ + 1.3), { id: 'chelsea-balconies', title: 'Flowers in iron', year: '1986', text: 'The flower ornamented iron balconies on floors two to eight were made by J.B. and J.M. Cornell. In 1986 one of them fell from the facade and injured two people walking below.', clue: 'Look up at the balconies from the sidewalk.', source: { name: 'Hotel Chelsea, Wikipedia', url: HC } }, { r: 1.6 });
    k.egg(v(14, 12, FZ + 0.6), { id: 'chelsea-tallest', title: 'Three feet of wall', year: '1884', text: 'Philip Hubert\'s building opened in 1884 as one of the first Victorian Gothic buildings in the city and its tallest apartment building, about 180 feet. Its masonry walls are about three feet thick at the base, and it was among the first in the city with duplex and penthouse apartments.', clue: 'Stand back on 23rd Street and take in the whole front.', source: { name: 'Hotel Chelsea, Wikipedia', url: HC } }, { r: 2.0 });
    k.egg(v(-LW / 2 + 1.3, 2.6, LZ - 11.8), { id: 'chelsea-rent', title: 'Paid in paintings', text: 'The manager Stanley Bard sometimes took a resident\'s paintings in place of unpaid rent and hung them in the lobby, which is how the lobby filled with art.', clue: 'Look at the salon hang on the lobby wall by the fireplace.', source: { name: 'Hotel Chelsea, Wikipedia', url: HC } }, { r: 0.8 });
    k.egg(v(4, 1.6, LZ - 4), { id: 'chelsea-titanic', title: 'Guests off the Titanic', year: '1912', text: 'After the Titanic sank in 1912, several of the people who survived it were given rooms at the hotel.', clue: 'Ask at the front desk.', source: { name: 'Hotel Chelsea, Wikipedia', url: HC } }, { r: 1.2 });
    k.egg(v(SX, 2 * 3.8 + 2.6, SZ), { id: 'chelsea-skylight', title: 'The skylight', text: 'The central stair was lit from a skylight on the roof and was meant for guests. Its walls were once lined with photographs of the residents. The skylight was sealed in the early 1950s.', clue: 'Climb the stair and look up the middle of the well.', source: { name: 'Hotel Chelsea, Wikipedia', url: HC } }, { r: 1.6 });
    // the works: a salon hang, floor to ceiling on both lobby walls, the stair well walls at every landing, the street front
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) for (let row = 0; row < 2; row++) { const z = LZ - 4 - i * 5.2; if (s < 0 && i === 1 && row === 0) continue; mounts.push({ position: v(s * (LW / 2 - 0.34), 2.4 + row * 2.9, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 2.5, z), width: 3.6, height: row ? 1.9 : 2.2, style: row ? 'oak' : 'gilt', wash: row === 0 }); }
    /* the well's works aimed at the middle of the well, which is open air: each level's pair now hangs on the wall beside
       that level's flight and is seen from the flight */
    /* hung two metres over the stair line where each picture is, so the rising treads pass under it */
    const lift = (base: number, t: number) => base + t * 3.8 + 2.0;
    for (const d of [-1.7, 1.7]) {
      mounts.push({ position: v(SX + d, lift(3.8, (SX + SW / 2 - 0.6 - (SX + d)) / (SW - 1.2)), SZ - SW / 2 + 0.22), rotation: 0, target: v(SX + d, 5.6, SZ - SW / 2 + 1.3), width: 2.2, height: 1.4, style: 'gilt', wash: false });
      mounts.push({ position: v(SX - SW / 2 + 0.22, lift(7.6, (SZ + d - (SZ - SW / 2 + 0.6)) / (SW - 1.2)), SZ + d), rotation: PI / 2, target: v(SX - SW / 2 + 1.3, 9.4, SZ + d), width: 2.2, height: 1.4, style: 'gilt', wash: false });
      mounts.push({ position: v(SX + d, lift(11.4, (SX + d - (SX - SW / 2 + 0.6)) / (SW - 1.2)), SZ + SW / 2 - 0.22), rotation: PI, target: v(SX + d, 13.2, SZ + SW / 2 - 1.3), width: 2.2, height: 1.4, style: 'gilt', wash: false });
    }
    for (let i = 0; i < 2; i++) { const x = -10 + i * 20; mounts.push({ position: v(x, 3.4, FZ + 0.34), rotation: 0, target: v(x, 3, FZ + 10), width: 4.2, height: 2.5, style: 'black', wash: false }); }
    const stairY = (x: number, z: number) => { const dx = x - SX, dz = z - SZ; const inWell = Math.abs(dx) < SW / 2 && Math.abs(dz) < SW / 2; if (!inWell) return -1; const onE = dx > SW / 2 - 1.7, onW = dx < -SW / 2 + 1.7, onN = dz < -SW / 2 + 1.7, onS = dz > SW / 2 - 1.7; const per = 3.8; if (onE && !onN) return Math.min(per, ((SZ + SW / 2 - 0.6 - z) / (SW - 1.2)) * per); if (onN) return per + Math.min(per, ((SX + SW / 2 - 0.6 - x) / (SW - 1.2)) * per); if (onW) return 2 * per + Math.min(per, ((z - (SZ - SW / 2 + 0.6)) / (SW - 1.2)) * per); if (onS) return 3 * per + Math.min(per, ((x - (SX - SW / 2 + 0.6)) / (SW - 1.2)) * per); return -2; };
    k.block(SX - SW / 2 + 1.7, SX + SW / 2 - 1.7, SZ - SW / 2 + 1.7, SZ + SW / 2 - 1.7);
    return { mounts, spawn: v(-16, 3, FZ + 30), look: v(-8, 18, FZ), eye: 3, bounds: [-LW / 2 + 0.6, LW / 2 - 0.6, SZ - SW / 2 + 0.4, FZ + 36], style: 'gilt', floorY: (x, z) => { const y = stairY(x, z); return y >= 0 ? y : 0; } };
  },
};

/* ---------------- 71 THE STRAND ---------------- */
export const strand: RoomDef = {
  id: 'strand',
  name: 'Eighteen miles of books',
  area: 'THE STRAND',
  mood: 'Rainy Tuesday',
  color: '#c83a3a',
  description: 'Broadway and Twelfth in the rain, the dollar carts under the awning, then the aisles: tables of new arrivals, the tall stacks, the rare book room upstairs, the works on the end caps.',
  signatures: 'The red awning and the sidewalk carts of one dollar books, the ground floor of long tables and tall wooden stacks under fluorescent light, the tote bags, the staff picks wall, the rolling ladders, the rare book room with its leather and glass.',
  build(k, ctx) {
    k.sky({ top: 0x7a8494, horizon: 0xb8bcc0, ground: 0x4a4a48, fog: 0.004, sun: { az: 3.2, el: 0.6, color: 0xe8e8e8, size: 10 }, haze: 0.7, env: 0.6 });
    k.hemi(0xd8dce0, 0x3a3a38, 0.8);
    k.sun(0xe8e8e8, 0.8, 20, 60, 30, false, 60);
    /* 2026-11-24 (wave 4b): scans (Poly Haven, CC0) for the brick, the worn wood floor, the dark wood of the stacks, the
       wet street, the plaster and the leather; real CC0 models (Poly Haven) for the wall cases, the ladders, the strip
       lights, the register and the rare book room; painted book spines on every shelf */
    const R = 'strand';
    const brick = sc(k, R, 'brick_wall_08', 2.6, () => X.brick(0x6a4a3a, 199), { color: 0xc8a090 }, 0x3a2a22),
      redA = k.flat(0xc62828, 0.1, 0.7),
      wood = sc(k, R, 'dark_wood', 1.6, () => X.planks(0x5a3a26, 4, 200), { color: 0xd0a888, roughness: 0.6 }, 0x2e1e14),
      floorW = sc(k, R, 'old_wood_floor', 2.2, () => X.planks(0x8a7a5a, 6, 203, 0.3), { color: 0xe0c8a8 }, 0x4a3a2a),
      wet = sc(k, R, 'asphalt_02', 4, () => X.asphalt(0x1e2226), { color: 0x6a6e74, roughness: 0.28, metalness: 0.2 }, 0x1e2226),
      plaster = sc(k, R, 'white_plaster_02', 2.5, () => X.plaster(0xe8e4dc, 94), { color: 0xf2ece2 }, 0x8a867e),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      white = k.flat(0xf4f0e8, 0, 0.6),
      glass = k.glass(0xdcecf6, 0.14, 0.04),
      leather = sc(k, R, 'fabric_leather_02', 1.2, () => X.velvet(0x4a2a1a), { color: 0x8a4a2a, roughness: 0.7 }, 0x3a1e12);
    /* book spines, painted once: cloth in oxblood, navy, forest, cream, rust, slate and black, title bands and gilt rules,
       uneven heights with the shadow of the shelf above (FIREFLY_QUEUE.md, strand: a real spine plate replaces it) */
    const spineTex = canvas('stSpines', 1024, 256, (g, W, H) => {
      const rr = X.mulberry(711), cols = ['#5a1e1e', '#1e2a4a', '#24402e', '#d8ccb0', '#8a3a22', '#4a5258', '#161616', '#6a2a3a', '#2a5a5a', '#b8a888'];
      g.fillStyle = '#100c0a'; g.fillRect(0, 0, W, H); let x = 0;
      while (x < W) { const w = 10 + Math.floor(rr() * 22), top = H * (0.06 + rr() * 0.22), c = cols[Math.floor(rr() * cols.length)];
        g.fillStyle = c; g.fillRect(x, top, w - 1, H - top);
        g.fillStyle = 'rgba(255,240,200,0.55)'; for (const y of [top + (H - top) * 0.12, H - (H - top) * 0.14]) g.fillRect(x + 2, y, w - 5, 2);
        g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x + 3, top + (H - top) * 0.3, w - 7, (H - top) * 0.28);
        g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x + w - 3, top, 2, H - top); x += w; }
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, 0, W, H * 0.12); }, [], true);
    const spineMats = new Map<number, T.Material>();
    if (texL) texL.load('assets/museum/tex/strand/ff_spines.webp', (t) => { if (!k.live) { t.dispose(); return; } t.colorSpace = T.SRGBColorSpace; spineMats.forEach((m) => { const sm = m as T.MeshStandardMaterial; if (!sm.map) return; const n = t.clone(); n.wrapS = n.wrapT = T.RepeatWrapping; n.repeat.copy(sm.map.repeat); n.needsUpdate = true; sm.map = n; sm.needsUpdate = true; }); }, undefined, () => {});
    const spines = (len: number) => { const key = Math.round(len * 10); let m = spineMats.get(key); if (!m) { if (spineTex) { const t = spineTex.clone(); t.wrapS = T.RepeatWrapping; t.repeat.set(Math.max(1, len / 0.9), 1); t.needsUpdate = true; m = new T.MeshStandardMaterial({ map: t, roughness: 0.85 }); } else m = k.flat(0x5a3a2a, 0, 0.85); spineMats.set(key, m); } return m; };
    // Broadway in the rain: wet asphalt, the corner building, the awning and the carts
    k.box(24, 0.3, 140, 0, -0.15, 30, wet);
    for (const s of [-1, 1]) k.box(5, 0.28, 140, s * 14.5, 0, 30, sc(k, R, 'concrete_pavement', 3, () => X.pavers(0x6a6a66, 94), { color: 0x9a9894, roughness: 0.35 }, 0x3a3a38));
    blockFront(k, { x: 17, z0: 100, count: 10, face: -1, seed: 204, h: [14, 30] });
    const FX = -12, FZ = 8, BW = 34, BD = 40;
    /* 826 Broadway is an eleven storey steel framed store and loft building (Birkmire, 1902), not six */
    k.box(BW, 44, BD, FX - BW / 2 + 0.3, 22, FZ - BD / 2, brick);
    for (let t = 0; t < 9; t++) for (let i = 0; i < 6; i++) { const y = 6 + t * 4.4; k.box(2.4, 3.0, 0.1, FX + 0.06 - 1 + 0, y, FZ - 4 - i * 6, glass).rotation.y = PI / 2; k.box(2.8, 3.4, 0.16, FX - 0.02, y, FZ - 4 - i * 6, k.pbr('stLime', X.ashlar(0xb8ad97, 205, 3), 0.22)).rotation.y = PI / 2; }
    const aw = k.box(3.4, 0.12, 30, FX + 1.7, 3.8, FZ - 16, redA); aw.rotation.z = 0.14;
    for (let dz = -14; dz <= 14; dz += 2) k.box(0.05, 0.5, 0.06, FX + 3.4, 3.3, FZ - 16 + dz, redA);
    hsign(k, 'STRAND   18 MILES OF BOOKS', 9, 0.62, FX + 3.44, 3.32, FZ - 16, PI / 2, { fg: '#f4f0e8', bg: '#c62828', font: 'W2 Archivo Expanded', size: 0.62, lit: false });
    for (let i = 0; i < 6; i++) { const z = FZ - 2 - i * 4.4; k.box(1.2, 0.9, 3.2, FX + 4.6, 0.65, z, wood); k.box(0.9, 0.24, 3.0, FX + 4.6, 1.22, z, spines(3.0)); for (const dz of [-1.4, 1.4]) k.cyl(0.14, 0.05, FX + 4.6, 0.15, z + dz, dark, 0.14, 10).rotation.z = PI / 2; k.keepOut.push({ x: FX + 4.6, z, r: 1.8 }); hsign(k, '$1', 0.8, 0.5, FX + 5.22, 0.9, z, PI / 2, { fg: '#c62828', bg: '#f4f0e8', font: 'W2 Archivo Expanded', size: 0.7, lit: false }); }
    k.arch(3.2, 4, 1.4, FX, 0, FZ - 30, brick, false, 0.85).rotation.y = PI / 2;
    k.block(FX - 0.6, FX + 0.6, FZ - BD, FZ - 32); k.block(FX - 0.6, FX + 0.6, FZ - 28, FZ);
    // inside: the long floor, tables of new arrivals, the stacks, fluorescent tubes, the mezzanine rare book room
    const IX = FX - BW / 2 + 0.3, IZ = FZ - BD / 2, IW = BW - 1.2, ID = BD - 1.2;
    const MY = 6.6, MX = IX - IW / 2 + 6, MZ = IZ - ID / 2 + 7;
    const xW = IX - IW / 2, xE = IX + IW / 2, zS = IZ - ID / 2, zN = IZ + ID / 2;
    k.box(IW, 0.3, ID, IX, 0.15, IZ, floorW);
    /* the shop had no inside walls: it sat in a solid block seen from within, so past the stacks there was open sky.
       Plaster walls line it now, the ceiling opens over the stair, and the rare book room is a closed room upstairs. */
    k.box(0.1, 10.6, ID, xW + 0.05, 5.3, IZ, plaster);
    k.box(IW, 10.6, 0.1, IX, 5.3, zS + 0.05, plaster);
    k.box(IW, 6.4, 0.1, IX, 3.2, zN - 0.05, plaster);
    k.box(0.1, 6.4, -23.6 - zS, xE - 0.4, 3.2, (zS - 23.6) / 2, plaster); k.box(0.1, 6.4, zN + 20.4, xE - 0.4, 3.2, (zN - 20.4) / 2, plaster); k.box(0.1, 2.2, 3.2, xE - 0.4, 5.2, -22, plaster);
    k.box(IW - 3.2, 0.4, ID, IX + 1.6, 6.2, IZ, white); k.box(3.2, 0.4, zN + 8, xW + 1.6, 6.2, (zN - 8) / 2, white); k.box(3.2, 0.4, MZ + 6 - zS, xW + 1.6, 6.2, (zS + MZ + 6) / 2, white);
    k.box(0.1, 4.4, 10.4, xW + 3.2, 8.4, MZ + 11.2, plaster); k.box(3.2, 4.4, 0.1, xW + 1.6, 8.4, MZ + 16.4, plaster); k.box(3.2, 0.3, 10.4, xW + 1.6, 10.6, MZ + 11.2, white);
    k.box(0.1, 4.0, 12, MX + 6, MY + 2, MZ, plaster); k.box(8.8, 4.0, 0.1, MX + 1.6, MY + 2, MZ + 6, plaster);
    /* the strip lights are real fixtures now (Poly Haven, CC0), one in two with a light */
    { const at: number[][] = []; let n = 0; for (let x = IX - IW / 2 + 3; x < IX + IW / 2; x += 6) for (let z = IZ - ID / 2 + 4; z < IZ + ID / 2; z += 8) { if (x < MX + 6 && z < MZ + 6) continue; at.push([x, 5.85, z, 0]); if (n++ % 2 === 0) k.point(x, 5.4, z, 0xf0f4ff, 16, 11); } many(k, `${R}/ph_mounted_fluorescent_lights`, { length: 1.5 }, at); }
    const stacks = (x: number, z: number, len: number, rot: number) => { const s = k.box(0.6, 3.2, len, x, 1.6, z, wood); s.rotation.y = rot; for (const sgn of [-1, 1]) for (let sh = 0; sh < 5; sh++) { const b = k.box(0.28, 0.5, len - 0.2, x + (rot ? 0 : sgn * 0.42), 0.5 + sh * 0.62, z + (rot ? sgn * 0.42 : 0), spines(len - 0.2)); b.rotation.y = rot; } for (let t = -len / 2; t <= len / 2; t += 1) k.keepOut.push({ x: x + (rot ? t : 0), z: z + (rot ? 0 : t), r: 0.8 }); };
    for (let i = 0; i < 5; i++) stacks(IX - IW / 2 + 4 + i * 5.2, IZ - 4, 14, 0);
    for (let i = 0; i < 4; i++) stacks(IX - IW / 2 + 6 + i * 6.5, IZ + 12, 6, PI / 2);
    /* new arrivals: the tables moved between the stack ends, which their keep outs used to swallow (no mustard covers) */
    for (let i = 0; i < 4; i++) { const x = IX - IW / 2 + 6.6 + i * 5.2, z = IZ + 6; k.box(3.2, 0.9, 1.4, x, 0.45, z, wood); for (let j = 0; j < 24; j++) k.box(0.4, 0.06 + (j % 3) * 0.02, 0.3, x - 1.3 + (j % 8) * 0.37, 0.95 + Math.floor(j / 8) * 0.05, z - 0.45 + Math.floor(j / 8) * 0.45, k.flat([0x5a1e1e, 0x1e2a4a, 0xe8dcc0, 0xd86a5a, 0x2a6a6a, 0x161616][(j + i) % 6], 0, 0.7)); k.keepOut.push({ x, z, r: 2 }); }
    /* wall cases all round (Poly Haven bookshelf, CC0, instanced) and rolling ladders on the tall stacks */
    { const at: number[][] = []; for (let z = zS + 1.4; z < zN - 1; z += 1.9) { if ((z > -24.8 && z < -19.2) || Math.abs(z - (IZ + 16)) < 2.2 || Math.abs(z - (IZ - 15)) < 2.2) continue; at.push([xE - 0.75, 0.3, z, -PI / 2]); } for (let x = MX + 7.4; x < xE - 1.5; x += 1.9) { if (Math.abs(x - IX) < 4) continue; at.push([x, 0.3, zS + 0.45, 0]); } for (let z = -4.6; z < zN - 1; z += 1.9) at.push([xW + 0.48, 0.3, z, PI / 2]); many(k, `${R}/ph_wooden_bookshelf_worn`, { height: 2.7 }, at, (o) => recolour(o, 0xc8a888, 0.75, 0, true)); for (const [x, , z, r] of at) { k.keepOut.push({ x, z, r: 0.5 }); for (let sh = 0; sh < 4; sh++) { const b = k.box(1.6, 0.36, 0.34, x, 0.62 + sh * 0.6, z, spines(1.6)); b.rotation.y = r; } } }
    many(k, `${R}/ph_wooden_ladder`, { height: 2.0 }, [[IX - IW / 2 + 4 + 5.2 + 0.95, 0.3, IZ - 8, PI / 2], [IX - IW / 2 + 4 + 15.6 - 0.95, 0.3, IZ - 1, -PI / 2], [IX - IW / 2 + 4 + 20.8 + 0.95, 0.3, IZ - 6, PI / 2]]);
    k.box(6, 1.0, 0.8, IX, 0.5, IZ - ID / 2 + 3, wood); k.block(IX - 3.2, IX + 3.2, IZ - ID / 2 + 2.4, IZ - ID / 2 + 3.6);
    many(k, `${R}/ph_CashRegister_01`, { height: 0.5 }, [[IX - 1.4, 1.0, IZ - ID / 2 + 3, PI]]);
    for (let i = 0; i < 5; i++) k.box(0.3, 0.4, 0.05, IX - 2 + i * 1, 1.2, IZ - ID / 2 + 3, redA);
    // section signs hung from the ceiling over the aisles, both faces
    for (const [t, x, z] of [['FICTION', IX - IW / 2 + 6.6, IZ - 4], ['NEW YORK', IX - IW / 2 + 11.8, IZ - 4], ['ART', IX - IW / 2 + 17, IZ - 4], ['POETRY', IX - IW / 2 + 22.2, IZ - 4], ['HISTORY', IX - IW / 2 + 27.4, IZ - 4], ['RARE BOOKS UPSTAIRS', IX - IW / 2 + 5, IZ + 2.5]] as [string, number, number][]) { for (const f of [0, PI]) hsign(k, t, t.length > 9 ? 3.4 : 2.2, 0.5, x, 5.0, z + (f ? -0.02 : 0.02), f, { fg: '#f4f0e8', bg: '#c62828', font: 'W2 Archivo Expanded', size: 0.5, lit: false }); k.box(0.02, 0.7, 0.02, x, 5.6, z, dark); }
    k.box(12, 0.3, 12, MX, MY, MZ, floorW);
    for (let i = 0; i < 20; i++) k.box(2.4, 0.33, 1.0, IX - IW / 2 + 1.6, 0.16 + i * 0.33, MZ + 8 + i * -0.4 + 8, wood);
    k.box(0.4, 3.6, 12, MX - 5.8, MY + 1.8, MZ, wood); k.box(12, 3.6, 0.4, MX, MY + 1.8, MZ - 5.8, wood);
    for (let sh = 0; sh < 5; sh++) { k.box(0.3, 0.5, 11, MX - 5.4, MY + 0.6 + sh * 0.6, MZ, leather); k.box(11, 0.5, 0.3, MX, MY + 0.6 + sh * 0.6, MZ - 5.4, leather); }
    k.box(4, 0.1, 1.6, MX + 1, MY + 0.9, MZ + 1, wood); k.box(4.2, 0.4, 1.8, MX + 1, MY + 1.1, MZ + 1, glass);
    k.rail(MX + 5.8, MZ, 12, dark, 1.0, 'z', 1.5); k.rail(MX, MZ + 5.8, 12, dark, 1.0, 'x', 1.5);
    k.point(MX, MY + 3, MZ, 0xffe6c0, 16, 10);
    k.box(12, 0.4, 12, MX, MY + 3.8, MZ, white);
    /* the rare book room: a reading chair, a lamp and a glass on the case, a cabinet, step stools (Poly Haven, CC0) */
    many(k, `${R}/ph_GreenChair_01`, { height: 1.0 }, [[MX + 2, MY + 0.15, MZ - 3.2, -2.4]]);
    many(k, `${R}/ph_desk_lamp_arm_01`, { height: 0.5 }, [[MX + 2.6, MY + 1.3, MZ + 1.2, -1.2]]);
    many(k, `${R}/ph_magnifying_glass_01`, { length: 0.26 }, [[MX + 0.4, MY + 1.32, MZ + 1.0, 0.6]]);
    many(k, `${R}/ph_book_encyclopedia_set_01`, { length: 0.5 }, [[MX - 0.4, MY + 1.32, MZ + 1.0, 0]]);
    many(k, `${R}/ph_vintage_cabinet_01`, { height: 1.9 }, [[MX + 5.2, MY + 0.15, MZ - 4.6, -PI / 2]]);
    many(k, `${R}/ph_wooden_stool_01`, { height: 0.6 }, [[IX - IW / 2 + 9, 0.3, IZ - 15, 0.4], [IX - IW / 2 + 19.5, 0.3, IZ - 2, 1.2], [IX + 8, 0.3, IZ + 3, 2]]);
    k.keepOut.push({ x: MX + 2, z: MZ - 3.2, r: 0.8 }, { x: MX + 5.2, z: MZ - 4.6, r: 0.8 }, { x: IX - IW / 2 + 9, z: IZ - 15, r: 0.4 }, { x: IX - IW / 2 + 19.5, z: IZ - 2, r: 0.4 }, { x: IX + 8, z: IZ + 3, r: 0.4 });
    /* rainy Broadway through two shop windows on the inside of the front wall (FIREFLY_QUEUE.md, strand) */
    for (const z of [IZ + 16, IZ - 15]) fireflyPlate(k, 'assets/museum/tex/strand/ff_rain_window.webp', 3.6, 2.6, xE - 0.46, 2.4, z, -PI / 2, k.glow(0xbcc8d4), true);
    k.crowd([v(IX - 12, 0, IZ + 16), v(IX - 12, 0, IZ - 14), v(IX + 8, 0, IZ - 14), v(IX + 8, 0, IZ + 16)], 18, { seed: 80, speed: 0.4, spread: 1.6, animate: !ctx.reduced, closed: true });
    k.crowd([v(FX + 3, 0, FZ - 2), v(FX + 3, 0, FZ - 26)], 8, { seed: 81, speed: 0.5, spread: 1, animate: !ctx.reduced });
    k.censusWall({ x: IX - IW / 2 + 0.34, y: 3.4, z: IZ - 2, rotY: PI / 2, cols: 30, rows: 5, tile: 0.5, gap: 0.05, start: ctx.wallStart(200, 150), pieces: ctx.all, backing: dark });
    hsign(k, 'STAFF PICKS   THE NEW YORKERS', 8, 0.6, IX - IW / 2 + 0.36, 5.4, IZ - 2, PI / 2, { fg: '#f4f0e8', font: 'W2 Archivo Expanded', size: 0.55, lit: false });
    /* the illusion (one trick a room): 18 MILES OF BOOKS painted flat on wet Broadway, stretched so that from where you
       arrive it stands up off the street like a sign */
    { const t = floorType('18 MILES OF BOOKS', ['#f4f0e8', '#f4f0e8', '#c62828']); if (t) anamorphTex(k, t, -4, 14, 3, 0.03, -0.15, 8, 4.6, 1.5, 0.88); }
    const SB = 'https://en.wikipedia.org/wiki/Strand_Bookstore', LPC = 'https://home4.nyc.gov/site/lpc/about/pr2019/lpc-designates-7-broadway-buildings-south-ofunion-square-as-individual-landmarks.page';
    k.egg(v(FX + 1.0, 3, FZ - 30), { id: 'strand-bookrow', title: 'Six hundred dollars and a cot', year: '1927', text: 'Benjamin Bass opened the Strand in 1927 with $300 of his own and $300 borrowed, and slept on a cot in the shop. It stood on Fourth Avenue\'s Book Row, which then had 48 bookstores.', clue: 'Stop at the arched door on Broadway.', source: { name: 'Strand Bookstore, Wikipedia', url: SB } }, { r: 1.2 });
    k.egg(v(FX + 3.0, 3.9, FZ - 1.5), { id: 'strand-miles', title: 'More than eighteen miles', text: 'The slogan on the awning says eighteen miles of books, but the store now holds more than 23 miles. In the 1990s it held 2.5 million books, with the overflow in a warehouse in Sunset Park, Brooklyn.', clue: 'Look at the north end of the red awning.', source: { name: 'Strand Bookstore, Wikipedia', url: SB } }, { r: 0.9 });
    k.egg(v(MX + 1, MY + 1.4, MZ + 1), { id: 'strand-ulysses', title: 'The most expensive book in the house', text: 'In the 1990s the oldest book for sale was an edition of Magna Moralia at $4,500, and the most expensive was a copy of James Joyce\'s Ulysses at $38,000.', clue: 'Look in the glass case in the rare book room upstairs.', source: { name: 'Strand Bookstore, Wikipedia', url: SB } }, { r: 1.0 });
    k.egg(v(FX + 0.8, 16, FZ - 16), { id: 'strand-landmark', title: 'Steel behind the brick', year: '1902', text: 'The building is an eleven storey store and loft building designed by William H. Birkmire and finished in 1902, its steel frame an example of the new skyscraper engineering of its day. The Strand moved in from Book Row in 1956, and the city landmarked the building in 2019 over the owner\'s objection.', clue: 'Stand on Broadway and look up the front.', source: { name: 'LPC designates seven Broadway buildings, NYC Landmarks Preservation Commission', url: LPC } }, { r: 2.0 });
    k.egg(v(IX, 1.6, IZ - ID / 2 + 3), { id: 'strand-1996', title: 'Buying the building', year: '1996', text: 'Fred Bass took over in 1956, and in 1996 he bought the building for $8.2 million, when the Strand was the largest used bookstore in the world. His daughter Nancy Bass Wyden became sole owner after he died in 2018.', clue: 'Go to the counter at the back of the floor.', source: { name: 'Strand Bookstore, Wikipedia', url: SB } }, { r: 1.2 });
    k.egg(v(IX - IW / 2 + 6.6 + 2 * 5.2, 1.3, IZ + 6), { id: 'strand-mcfall', title: 'Forty three years on the floor', year: '2021', text: 'Ben McFall started at the Strand in 1978 and worked there until his death in December 2021, the longest serving bookseller in the store\'s history. The staff have been unionized for more than 35 years.', clue: 'Browse the new arrivals tables in the middle of the floor.', source: { name: 'Strand Bookstore, Wikipedia', url: SB } }, { r: 0.8 });
    k.egg(v(-4, 0.6, 2), { id: 'strand-anamorph', title: 'A sign that is not there', text: '18 MILES OF BOOKS is painted flat on the wet asphalt of Broadway, stretched away from you, so that from the corner where you arrive it stands up off the street like a sign. Walk onto it and it falls back into long smears of paint. The trick is anamorphosis, the same one that hides a skull across the floor of Hans Holbein\'s The Ambassadors of 1533.', clue: 'Go back to where you came in and look down Broadway.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.6 });
    // the works: the stack end caps facing the aisles, the back wall, the rare book room, the street front between the windows
    /* targets moved off the new arrivals tables, the counter and the dollar carts, which had swallowed eight of them */
    const mounts: Mount[] = [];
    for (let i = 0; i < 5; i++) { const x = IX - IW / 2 + 4 + i * 5.2; mounts.push({ position: v(x, 1.9, IZ - 4 + 7.22), rotation: 0, target: v(x, 2, IZ + 6), width: 1.6, height: 2.2, style: 'oak', wash: false }); mounts.push({ position: v(x, 1.9, IZ - 4 - 7.22), rotation: PI, target: v(x, 2, IZ - 14.6), width: 1.6, height: 2.2, style: 'oak', wash: false }); }
    for (let i = 0; i < 4; i++) { const x = IX - 10 + i * 7; mounts.push({ position: v(x, 3.6, IZ + ID / 2 - 0.34), rotation: PI, target: v(x, 2.5, IZ + ID / 2 - 3.6), width: 3.6, height: 2.1, style: 'black', wash: true }); }
    for (let i = 0; i < 3; i++) { const z = MZ - 3.5 + i * 3.5; mounts.push({ position: v(MX - 5.58, MY + 2.2, z), rotation: PI / 2, target: v(MX, MY + 1.6, z), width: 2.4, height: 1.4, style: 'gilt', wash: false }); }
    for (let i = 0; i < 3; i++) { const z = FZ - 7 - i * 6; mounts.push({ position: v(FX + 0.42, 2.0, z - 3), rotation: PI / 2, target: v(FX + 7.6, 2, z - 3), width: 2.2, height: 1.4, style: 'black', wash: false }); }
    const mezz = (x: number, z: number) => Math.abs(x - MX) < 6 && Math.abs(z - MZ) < 6;
    return { mounts, spawn: v(-4, 3, FZ + 6), look: v(FX, 4, FZ - 20), eye: 3, bounds: [IX - IW / 2 + 0.6, 12, IZ - ID / 2 + 0.6, FZ + 30], style: 'oak', floorY: (x, z) => { if (mezz(x, z)) return MY + 0.15; if (x < IX - IW / 2 + 3.2 && x > IX - IW / 2 + 0.4 && z > MZ + 6 && z < MZ + 16.4) return Math.min(MY, ((MZ + 16.4 - z) / 10) * MY); return 0; } };
  },
};
