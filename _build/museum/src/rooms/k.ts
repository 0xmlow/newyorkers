/* Rooms 47 to 51: the Morgan's East Room, Radio City, the Woolworth lobby, Wall Street, Lincoln Center. */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as X from '../textures';
import { v } from '../kit';
import type { Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront } from './f';
import { glbs, fireflyPlate, anamorph } from './a';
import type { Kit } from '../kit';

const PI = Math.PI;

/* ---------- THE BIG UPGRADE, wave 3b (2026-11-24): helpers for rooms 47 to 51 ----------
   Poly Haven scans (CC0) that wear a sensible colour until all three maps land, canvas painted surfaces (book
   spines, mosaic, lattice, painted ceilings) that redraw once the house fonts load, and real models copied into
   assets/museum/props/<room>/. Everything is safe in node: the audits build these rooms with no DOM, so scans fall
   back to the painted kit surfaces and no canvas is touched. */
const HAS_DOM = typeof window !== 'undefined' && typeof document !== 'undefined' && typeof HTMLImageElement !== 'undefined';
const texL = HAS_DOM ? new T.TextureLoader() : null;
const scans = new Map<string, { s: X.Surface; ready: Promise<unknown> }>();
function scan(k: Kit, room: string, id: string, metres: number, paint: () => X.Surface, p: Partial<T.MeshStandardMaterialParameters> & { normal?: number } = {}, wait = 0x888888) {
  if (!texL) return k.pbr(`w3b-${room}-${id}`, paint(), 1 / metres, p);
  let e = scans.get(`${room}/${id}`);
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
    const s: X.Surface = { map: one('c', true), normalMap: one('n', false), roughnessMap: low ? undefined : one('r', false) };
    e = { s, ready: Promise.all(waits) };
    scans.set(`${room}/${id}`, e);
  }
  k.pending.push(e.ready);
  const m = k.pbr(`w3b-${room}-${id}`, e.s, 1 / metres, p);
  if (!m.userData.w3b) {
    m.userData.w3b = true;
    const maps = { map: m.map, normalMap: m.normalMap, roughnessMap: m.roughnessMap }, tint = m.color.clone();
    m.map = m.normalMap = m.roughnessMap = null;
    m.color.set(wait);
    void e.ready.then(() => { Object.assign(m, maps); m.color.copy(tint); m.needsUpdate = true; });
  }
  return m;
}
const FONTS = ['900 40px "Archivo"', '800 40px "Archivo Expanded"', '700 40px "JetBrains Mono"', '400 40px "Permanent Marker"'];
const paintCache = new Map<string, T.CanvasTexture>();
/* A canvas texture painted by `draw`, painted again once the house fonts arrive; null in node. */
function canvasTex(key: string, W: number, H: number, draw: (g: CanvasRenderingContext2D, W: number, H: number) => void, repeat = true) {
  if (!HAS_DOM) return null;
  let t = paintCache.get(key);
  if (t) return t;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = T.RepeatWrapping;
  const tt = t;
  const paint = () => { g.clearRect(0, 0, W, H); draw(g, W, H); tt.needsUpdate = true; };
  paint();
  if (document.fonts) void Promise.all(FONTS.map((f) => document.fonts.load(f))).then(paint).catch(() => undefined);
  paintCache.set(key, t);
  return t;
}
/* A painted surface tiled in world space (one tile is `metres` across), or `fallback` in node. */
function painted(k: Kit, key: string, px: number, metres: number, draw: (g: CanvasRenderingContext2D, W: number, H: number) => void, fallback: () => X.Surface, p: Partial<T.MeshStandardMaterialParameters> = {}) {
  const t = canvasTex(key, px, px, draw);
  return k.pbr(`w3b-paint-${key}`, t ? { map: t } : fallback(), 1 / metres, p);
}
/* A painted plate with its own 0..1 UVs (a sign, a ceiling panel, a page). */
function plate(k: Kit, key: string, w: number, h: number, x: number, y: number, z: number, rot: [number, number, number], draw: (g: CanvasRenderingContext2D, W: number, H: number) => void, o: { px?: number; lit?: boolean; rough?: number; metal?: number; transparent?: boolean; fallback?: number; dynamic?: boolean } = {}) {
  const W = o.px ?? 1024, H = Math.max(32, Math.round((W * h) / w));
  const t = canvasTex(key, W, H, draw, false);
  const m = !t ? k.flat(o.fallback ?? 0x777777) : o.lit ? new T.MeshBasicMaterial({ map: t, transparent: !!o.transparent, side: T.DoubleSide }) : new T.MeshStandardMaterial({ map: t, roughness: o.rough ?? 0.75, metalness: o.metal ?? 0, transparent: !!o.transparent, alphaTest: o.transparent ? 0.02 : 0 });
  const p = k.mesh(new T.PlaneGeometry(w, h), m, x, y, z, o.dynamic ?? false);
  p.rotation.set(rot[0], rot[1], rot[2], 'YXZ');
  return p;
}
const rnd = (seed: number) => X.mulberry(seed);

/* ---------------- 47 THE MORGAN LIBRARY ---------------- */
export const morgan: RoomDef = {
  id: 'morgan',
  name: 'Three tiers of books',
  area: 'THE MORGAN LIBRARY',
  mood: 'Reading lamp afternoon',
  color: '#b8864a',
  description: 'East 36th Street off Madison Avenue, the marble palazzo, then the East Room: three storeys of walnut bookcases with two walkable balconies, the painted ceiling, the works between the tiers.',
  signatures: 'The McKim palazzo of dry laid marble, the East Room of triple tiered inlaid walnut bookcases behind bronze grilles, the narrow balconies, the tapestry over the fireplace, the lunettes and the painted ceiling.',
  build(k, ctx) {
    k.sky({ top: 0x7fa0d0, horizon: 0xe8e8e0, ground: 0x5a5a55, fog: 0.0022, sun: { az: 3.9, el: 0.7, color: 0xfff4e6, size: 12 }, env: 0.8 });
    k.hemi(0xfff0dc, 0x3a2a1a, 0.55);
    k.sun(0xfff0d8, 1.4, -30, 50, 40, true, 60);
    /* THE BIG UPGRADE 3b: the palazzo in scanned pale marble, the East Room in scanned walnut, a jacquard carpet and
       plaster, every case filled with painted spines behind an open bronze lattice, a coffered and painted ceiling
       with the zodiac, lunettes, the false dome, the real chimneypiece, vitrines and banker's lamps. */
    const R = 'morgan';
    const marble = scan(k, R, 'white_sandstone_blocks_02', 2.4, () => X.ashlar(0xe0d8c8, 95, 4), { color: 0xfff2ea, roughness: 0.62 }, 0xd8cec2),
      fine = scan(k, R, 'marble_01', 1.6, () => X.marble(0xe8e0d4, 0x9a8f80, 14), { roughness: 0.28, color: 0xfff4ea }, 0xe2d8cc),
      walnut = scan(k, R, 'dark_wood', 1.3, () => X.planks(0x4a2e1a, 3, 96, 0.2), { roughness: 0.4, color: 0xf0d8c0 }, 0x3e2616),
      walnutL = scan(k, R, 'dark_paneled_wood', 1.4, () => X.planks(0x6a4428, 4, 97, 0.2), { roughness: 0.45, color: 0xe8c8a8 }, 0x4a3020),
      parquet = scan(k, R, 'herringbone_parquet', 3.4, () => X.planks(0x6a4a30, 8, 99), { roughness: 0.5 }, 0x6a4a30),
      carpet = scan(k, R, 'quatrefoil_jacquard_fabric', 0.8, () => X.carpet(0x6a2a2a, 0xc79a4a), { roughness: 0.95, color: 0xd07a66 }, 0x6a2a24),
      plaster = scan(k, R, 'white_plaster_rough_01', 1.4, () => X.plaster(0xe6dcc8, 50), { color: 0xf0e0c4 }, 0xe0d2b8),
      gilt = k.pbr('morganGilt', X.gilt(0xd0a852), 2, { metalness: 0.85, roughness: 0.3 }),
      bronze = k.flat(0x6a5236, 0.85, 0.38),
      dark = k.flat(0x1a1a1c, 0.5, 0.6);
    const SPINES = ['#5a1a16', '#6e2a1c', '#2a3a24', '#1e2a3e', '#3a2416', '#7a5a2a', '#4a1a2a', '#1a1a1a', '#6a4a30', '#2e4a3a', '#8a6a3a', '#5a3018'];
    /* four shelves of bindings to a tile 1.86 m square: spines 3 to 6 cm, gilt bands and labels, a gap now and then */
    const books = painted(k, 'morgan-spines', 1024, 1.86, (g, W, H) => {
      const r = rnd(4711), rows = 4, rh = H / rows;
      g.fillStyle = '#140b06'; g.fillRect(0, 0, W, H);
      for (let row = 0; row < rows; row++) {
        const base = row * rh + rh * 0.96;
        let x = 0;
        while (x < W) {
          const w = 16 + r() * 20, h = rh * (0.6 + r() * 0.32), c = SPINES[Math.floor(r() * SPINES.length)];
          g.fillStyle = c; g.fillRect(x, base - h, w - 1.5, h);
          const sh = g.createLinearGradient(x, 0, x + w, 0); sh.addColorStop(0, 'rgba(0,0,0,0.5)'); sh.addColorStop(0.35, 'rgba(255,240,220,0.10)'); sh.addColorStop(1, 'rgba(0,0,0,0.55)');
          g.fillStyle = sh; g.fillRect(x, base - h, w - 1.5, h);
          g.fillStyle = 'rgba(214,174,92,0.85)';
          const nb = 2 + Math.floor(r() * 3);
          for (let b = 0; b < nb; b++) g.fillRect(x + 1, base - h + h * (0.06 + b * 0.06), w - 3.5, 2);
          g.fillRect(x + 1, base - h * 0.1, w - 3.5, 2);
          if (r() < 0.55) { g.fillStyle = 'rgba(16,8,4,0.9)'; g.fillRect(x + 2, base - h * 0.74, w - 5.5, h * 0.12); g.fillStyle = 'rgba(224,186,104,0.85)'; g.fillRect(x + 4, base - h * 0.69, w - 9, 2); }
          x += w;
          if (r() < 0.03) x += 18 + r() * 26;
        }
        g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, row * rh, W, rh * 0.1);
      }
    }, () => X.planks(0x6a3a2a, 14, 98, 0.5), { roughness: 0.78 });
    /* the bronze lattice in front of the cases: open diamonds, alpha tested, one draw for all of it */
    const latT = canvasTex('morgan-lattice', 256, 256, (g, W, H) => {
      g.strokeStyle = '#ffffff'; g.lineWidth = 9; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W / 2, 0); g.lineTo(W, H / 2); g.lineTo(W / 2, H); g.closePath(); g.stroke();
      g.fillStyle = '#ffffff'; for (const [x, y] of [[W / 2, 0], [0, H / 2], [W, H / 2], [W / 2, H]]) { g.beginPath(); g.arc(x, y, 16, 0, PI * 2); g.fill(); }
      g.beginPath(); g.arc(W / 2, H / 2, 10, 0, PI * 2); g.fill();
    });
    if (latT) latT.repeat.set(2.04 / 0.34, 3.0 / 0.34);
    const lattice = latT ? new T.MeshStandardMaterial({ map: latT, color: 0xb08850, metalness: 0.85, roughness: 0.35, alphaTest: 0.5, side: T.DoubleSide }) : null;
    // Madison Avenue and the palazzo
    street(k, { w: 18, len: 120, z: 40, x: 0 });
    blockFront(k, { x: -40, z0: 90, count: 8, face: 1, seed: 99, h: [16, 26] });
    blockFront(k, { x: 40, z0: 90, count: 4, face: -1, seed: 100, h: [14, 20] });
    const RW = 20, RD = 30, RH = 14, FZ = 8;
    k.box(RW + 24, RH + 3, RD + 10, 0, (RH + 3) / 2, FZ - RD / 2 - 5, marble);
    k.moulding([[0, 0], [0.9, 0], [1.0, 0.3], [0.6, 0.5], [0.8, 0.8], [0.3, 1.0], [0, 1.1]], RW + 24.2, 0, RH + 2, FZ + 0.05, fine, -PI / 2);   // kit.moulding runs along z unless turned; it stood up as a pole over the street
    k.moulding([[0, 0], [0.35, 0], [0.4, 0.15], [0.2, 0.3], [0, 0.32]], RW + 24.2, 0, 1.0, FZ + 0.05, fine, -PI / 2);
    // the frieze of panels and the blind niches either side of the portico, built proud of the wall
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
      const x = s * (9 + i * 4.2);
      k.box(2.2, 4.6, 0.3, x, 5.6, FZ + 0.15, fine);
      k.arch(1.6, 3.6, 0.5, x, 3.4, FZ + 0.1, fine, false, 0.25);
      k.box(1.6, 3.2, 0.1, x, 5.0, FZ - 0.08, k.flat(0x8a7f70, 0, 0.9));
      k.box(2.8, 0.3, 0.5, x, 3.25, FZ + 0.25, fine);
      k.box(3.0, 1.4, 0.2, x, RH - 0.2, FZ + 0.1, marble);
    }
    k.arch(4.4, 6.4, 5.2, 0, 0, FZ - 2.2, marble, false, 0.85);
    for (const s of [-1, 1]) { k.column(s * 3.6, 0.1, FZ + 0.6, 6.2, 0.5, fine, true); k.column(s * 5.2, 0.1, FZ + 0.6, 6.2, 0.5, fine, true); }
    k.box(RW + 24, 1.4, 6, 0, 7.4, FZ + 0.5, marble);
    k.sign('THE MORGAN LIBRARY', 8.4, 0.6, 0, 8.6, FZ + 3.52, 'transparent', '#5a4c3c', 90, 0, { border: false });
    // the Florentine bronze doors, standing open against the sides of the portico passage
    const doorLeaf = (g: CanvasRenderingContext2D, W: number, H: number) => {
      const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#6a4a26'); gr.addColorStop(0.5, '#8a6a3a'); gr.addColorStop(1, '#4a321a');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      const pw = W * 0.78, ph = H * 0.17;
      for (let i = 0; i < 5; i++) {
        const x = (W - pw) / 2, y = H * 0.04 + i * (ph + H * 0.024);
        g.strokeStyle = '#c8a060'; g.lineWidth = 6; g.strokeRect(x, y, pw, ph);
        g.fillStyle = 'rgba(30,18,8,0.35)'; g.fillRect(x + 8, y + 8, pw - 16, ph - 16);
        g.strokeStyle = 'rgba(220,180,110,0.6)'; g.lineWidth = 3;
        g.beginPath(); g.ellipse(W / 2, y + ph * 0.62, pw * 0.22, ph * 0.28, 0, 0, PI * 2); g.stroke();
        g.beginPath(); g.arc(W / 2, y + ph * 0.32, ph * 0.12, 0, PI * 2); g.stroke();
      }
    };
    for (const s of [-1, 1]) plate(k, 'morgan-door', 1.4, 4.8, s * 2.08, 2.45, FZ - 1.2, [0, s < 0 ? PI / 2 : -PI / 2, 0], doorLeaf, { px: 256, metal: 0.7, rough: 0.4, fallback: 0x6a4a26 });
    // Edward Clark Potter's couchant lions either side of the steps: a CC0 scan of a couchant lion on its plinth
    for (const s of [-1, 1]) { k.box(1.6, 1.0, 2.8, s * 4.6, 0.5, FZ + 4.2, fine); k.box(1.8, 0.12, 3.0, s * 4.6, 1.0, FZ + 4.2, fine); }
    glbs(k, 'morgan/lion_couchant', { length: 2.6 }, [[-4.6, 1.0, FZ + 4.2, 0], [4.6, 1.0, FZ + 4.2, 0]]);
    glbs(k, 'morgan/ph_street_lamp_01', { height: 4.2 }, [[-10, 0, FZ + 12.6, 0], [10, 0, FZ + 12.6, 0], [-22, 0, FZ + 12.6, 0], [22, 0, FZ + 12.6, 0]]);
    k.block(-RW / 2 - 12, -2.2, FZ - 0.5, FZ + 0.5); k.block(2.2, RW / 2 + 12, FZ - 0.5, FZ + 0.5);
    for (let i = 0; i < 4; i++) k.box(RW + 4, 0.16, 1.0, 0, 0.08 + i * 0.16, FZ + 1.4 + i * 1.0, fine);
    // the East Room shell: carpet, plaster ceiling, walls behind the cases, the door wall with the way in
    const Z0 = FZ - 2, Z1 = FZ - RD;
    k.box(RW, 0.3, RD, 0, 0.15, (Z0 + Z1) / 2, carpet);
    k.box(RW + 2, 0.4, RD + 2, 0, RH + 0.2, (Z0 + Z1) / 2, plaster);
    for (const s of [-1, 1]) k.box(0.3, RH, RD, s * (RW / 2 + 0.15), RH / 2, (Z0 + Z1) / 2, plaster);
    k.box(RW, RH, 0.3, 0, RH / 2, Z1 - 0.15, walnut);
    for (const s of [-1, 1]) k.box(RW / 2 - 2.2, 5.4, 0.4, s * (RW / 4 + 1.1), 2.7, Z0 + 0.05, walnutL);
    k.box(RW, RH - 5.4, 0.4, 0, 5.4 + (RH - 5.4) / 2, Z0 + 0.05, plaster);
    k.box(4.8, 0.4, 0.5, 0, 5.5, Z0 - 0.05, gilt);
    for (const s of [-1, 1]) k.block(s * (RW / 2 + 0.2), s * (RW / 2 + 1.4), Z1, Z0);
    k.block(-RW / 2, RW / 2, Z1 - 1.4, Z1 - 0.2);
    k.block(-RW / 2, -2.2, Z0 - 0.1, Z0 + 0.3); k.block(2.2, RW / 2, Z0 - 0.1, Z0 + 0.3);
    const tiers = [0, 4, 8];
    /* one run of cases: back, spines, a board at every shelf, pilasters between the bays, plinth and frieze, the lattice */
    const caseRun = (axis: 'x' | 'z', wall: number, inward: number, len: number, center: number, skip: (ty: number, u: number) => boolean) => {
      const B = (du: number, h: number, dd: number, u: number, y: number, d: number, m: T.Material) => (axis === 'z' ? k.box(dd, h, du, wall + inward * d, y, center + u, m) : k.box(du, h, dd, center + u, y, wall + inward * d, m));
      const bays = Math.floor(len / 2.2), u0 = -(bays * 2.2) / 2;
      for (const ty of tiers) for (let i = 0; i < bays; i++) {
        const u = u0 + 1.1 + i * 2.2;
        if (skip(ty, u)) continue;
        B(2.2, 3.6, 0.2, u, ty + 1.8, 0.1, walnut);
        B(2.04, 3.0, 0.16, u, ty + 1.85, 0.28, books);
        for (let j = Math.ceil((ty + 0.35) / 0.465); j * 0.465 <= ty + 3.36; j++) B(2.04, 0.035, 0.55, u, j * 0.465 + 0.005, 0.475, walnutL);
        B(0.16, 3.6, 0.9, u - 1.1, ty + 1.8, 0.45, walnutL);
        if (i === bays - 1 || skip(ty, u + 2.2)) B(0.16, 3.6, 0.9, u + 1.1, ty + 1.8, 0.45, walnutL);
        B(2.2, 0.35, 0.86, u, ty + 0.175, 0.43, walnut);
        B(2.2, 0.26, 0.96, u, ty + 3.72, 0.48, walnutL);
        B(2.2, 0.05, 0.98, u, ty + 3.6, 0.49, gilt);
        if (lattice) {
          const p = k.mesh(new T.PlaneGeometry(2.04, 3.0), lattice, axis === 'z' ? wall + inward * 0.82 : center + u, ty + 1.85, axis === 'z' ? center + u : wall + inward * 0.82);
          p.rotation.y = axis === 'z' ? (inward > 0 ? PI / 2 : -PI / 2) : inward > 0 ? 0 : PI;
        }
      }
    };
    caseRun('z', -RW / 2, 1, RD - 2, (Z0 + Z1) / 2, () => false);
    caseRun('z', RW / 2, -1, RD - 2, (Z0 + Z1) / 2, () => false);
    caseRun('x', Z1, 1, RW - 2, 0, (ty, u) => (ty === 0 && Math.abs(u) < 3.0) || (ty === 4 && Math.abs(u) < 3.2) || (ty === 8 && Math.abs(u) < 6.6));
    // balconies: a walk 1.1 wide at each upper tier on all three case walls, parquet decks, bronze rail, a stair in the far corners
    const BW = 1.1;
    for (const by of [4, 8]) {
      for (const s of [-1, 1]) { k.box(BW, 0.2, RD - 2, s * (RW / 2 - 0.9 - BW / 2), by - 0.1, (Z0 + Z1) / 2, parquet); k.box(0.12, 0.42, RD - 2, s * (RW / 2 - 0.9 - BW), by - 0.31, (Z0 + Z1) / 2, walnutL); k.rail(s * (RW / 2 - 0.9 - BW), (Z0 + Z1) / 2, RD - 2, bronze, 0.95, 'z', 0.6); }
      k.box(RW - 1.8, 0.2, BW, 0, by - 0.1, Z1 + 0.9 + BW / 2, parquet);
      k.box(RW - 1.8, 0.42, 0.12, 0, by - 0.31, Z1 + 0.9 + BW, walnutL);
      k.rail(0, Z1 + 0.9 + BW, RW - 1.8, bronze, 0.95, 'x', 0.6);
      for (let i = 0; i < 6; i++) k.point(-8 + i * 3.2, by + 2.6, Z1 + 3, 0xffe6c0, 6, 5);
    }
    const flight = (x: number, z0: number, y0: number, dir: number) => { for (let i = 0; i < 16; i++) k.box(BW, 0.25, 0.42, x, y0 + 0.125 + i * 0.25, z0 + dir * i * 0.42, walnutL); };
    flight(RW / 2 - 0.9 - BW / 2, Z0 - 1.2, 0, -1);
    flight(-RW / 2 + 0.9 + BW / 2, Z0 - 1.2, 4, -1);
    k.block(-RW / 2 + 0.9, -RW / 2 + 0.9 + BW, Z0 - 8, Z0 - 1.0);
    /* the chimneypiece: jambs, frieze and shelf in veined marble, the firebox glowing, the mantel clock and candelabra */
    for (const s of [-1, 1]) { k.box(0.6, 2.5, 0.9, s * 1.7, 1.25, Z1 + 0.45, fine); k.box(0.7, 0.3, 1.0, s * 1.7, 0.15, Z1 + 0.5, fine); }
    k.box(4.2, 0.65, 0.92, 0, 2.82, Z1 + 0.46, fine);
    k.box(4.6, 0.14, 1.12, 0, 3.21, Z1 + 0.56, fine);
    k.moulding([[0, 0], [0.12, 0], [0.16, 0.08], [0.06, 0.16], [0, 0.18]], 4.6, 0, 3.0, Z1 + 1.02, gilt, -PI / 2);
    k.box(2.8, 2.5, 0.5, 0, 1.25, Z1 + 0.25, dark);
    k.box(4.0, 1.2, 0.5, 0, 3.88, Z1 + 0.25, walnutL);
    k.point(0, 1.0, Z1 + 1.4, 0xff9a40, 16, 6);
    const embers = k.mesh(new T.PlaneGeometry(2.0, 0.5), k.glow(0xff7a2a, 0.85), 0, 0.5, Z1 + 0.52, true);
    if (!ctx.reduced) k.ticks.push((t) => { embers.scale.y = 0.85 + 0.25 * Math.sin(t * 5.3) * Math.sin(t * 2.1); });
    glbs(k, 'morgan/ph_mantel_clock_01', { width: 0.55 }, [[0, 3.28, Z1 + 0.62, 0]]);
    glbs(k, 'morgan/ph_brass_candleholders', { width: 1.0 }, [[-1.55, 3.28, Z1 + 0.6, 0], [1.55, 3.28, Z1 + 0.6, PI]]);
    /* the tapestry over the fireplace: Firefly weaves it (FIREFLY_QUEUE.md); a painted millefleur border stands in */
    const tap = canvasTex('morgan-tapestry', 768, 540, (g, W, H) => {
      const r = rnd(77);
      g.fillStyle = '#3a2a1e'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#1e2c24'; g.fillRect(W * 0.06, H * 0.08, W * 0.88, H * 0.84);
      for (let i = 0; i < 900; i++) { const x = r() * W, y = r() * H; g.fillStyle = ['#a8743a', '#6a3a28', '#c8a868', '#4a6a4a', '#8a2a2a'][Math.floor(r() * 5)]; g.beginPath(); g.arc(x, y, 1.5 + r() * 3, 0, PI * 2); g.fill(); }
      g.strokeStyle = '#c8a060'; g.lineWidth = 6; g.strokeRect(W * 0.06, H * 0.08, W * 0.88, H * 0.84);
      for (let y = 0; y < H; y += 3) { g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(0, y, W, 1); }
    }, false);
    fireflyPlate(k, 'assets/museum/tex/morgan/ff_tapestry.webp', 6.0, 4.2, 0, 6.8, Z1 + 0.32, 0, tap ? new T.MeshStandardMaterial({ map: tap, roughness: 0.95 }) : k.flat(0x3a2a1e, 0, 0.95));
    /* the reading tables with real banker's lamps, and two vitrines down the middle with a Bible open in each */
    for (const x of [-3.4, 3.4]) { k.box(3.6, 0.1, 1.6, x, 0.9, -6, walnutL); for (const dx of [-1.6, 1.6]) k.box(0.12, 0.85, 1.4, x + dx, 0.45, -6, walnut); k.keepOut.push({ x, z: -6, r: 2.0 }); for (const dx of [-1, 1]) k.point(x + dx, 1.4, -6, 0xc8ffc0, 6, 4); }
    glbs(k, 'morgan/banker_lamp', { height: 0.5 }, [[-4.4, 0.95, -6, 0], [-2.4, 0.95, -6, 0], [2.4, 0.95, -6, PI], [4.4, 0.95, -6, PI]]);
    glbs(k, 'morgan/ph_book_encyclopedia_set_01', { width: 0.8 }, [[-3.4, 0.95, -6.45, 0], [3.4, 0.95, -5.55, PI]]);
    const page = (g: CanvasRenderingContext2D, W: number, H: number) => {
      const r = rnd(1455);
      g.fillStyle = '#efe3c6'; g.fillRect(0, 0, W, H);
      const gut = g.createLinearGradient(W / 2 - 40, 0, W / 2 + 40, 0); gut.addColorStop(0, 'rgba(0,0,0,0)'); gut.addColorStop(0.5, 'rgba(60,40,20,0.45)'); gut.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gut; g.fillRect(W / 2 - 40, 0, 80, H);
      for (let leaf = 0; leaf < 2; leaf++) for (let col = 0; col < 2; col++) {
        const x0 = leaf * W / 2 + W * 0.06 + col * W * 0.2, y0 = H * 0.1;
        for (let l = 0; l < 42; l++) { g.fillStyle = 'rgba(28,20,14,0.85)'; let x = x0; while (x < x0 + W * 0.17) { const w = 4 + r() * 12; g.fillRect(x, y0 + l * H * 0.019, w, 3); x += w + 3; } }
        g.fillStyle = r() < 0.5 ? '#b02a22' : '#2a4a9a'; g.fillRect(x0, y0 + H * 0.02 * Math.floor(r() * 30), 18, 22);
      }
    };
    for (const x of [-3.4, 3.4]) {
      const z = -14.5;
      glbs(k, 'morgan/vitrine', { length: 1.7 }, [[x, 0, z, 0]]);
      plate(k, 'morgan-bible', 0.62, 0.44, x, 0.93, z, [-PI / 2, PI / 2, 0], page, { px: 512, rough: 0.9, fallback: 0xefe3c6 });
      k.keepOut.push({ x, z, r: 1.1 });
    }
    /* the ceiling: gilt ribs into a grid of painted panels, the zodiac down both sides, lunettes over the top tier,
       and in the middle the trick: a flat painted dome that reads as a deep coffered one from below */
    for (let z = Z1; z <= Z0 + 0.01; z += 4) k.box(RW, 0.34, 0.3, 0, RH - 0.17, z, gilt);
    for (const x of [-7.5, -2.5, 2.5, 7.5]) k.box(0.3, 0.34, RD, x, RH - 0.17, (Z0 + Z1) / 2, gilt);
    const ZOD = ['ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO', 'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES', 'SPRING', 'AUTUMN'];
    const zodiac = (name: string, seed: number) => (g: CanvasRenderingContext2D, W: number, H: number) => {
      const r = rnd(seed);
      g.fillStyle = '#1c2c52'; g.fillRect(0, 0, W, H);
      g.strokeStyle = '#c9a052'; g.lineWidth = 10; g.strokeRect(12, 12, W - 24, H - 24);
      g.lineWidth = 3; g.strokeRect(34, 34, W - 68, H - 68);
      for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(240,220,160,${0.3 + r() * 0.5})`; g.fillRect(40 + r() * (W - 80), 40 + r() * (H - 80), 2, 2); }
      const cx = W / 2, cy = H / 2, rr = Math.min(W, H) * 0.32;
      g.fillStyle = '#2a3e6e'; g.beginPath(); g.arc(cx, cy, rr, 0, PI * 2); g.fill();
      g.strokeStyle = '#d8b060'; g.lineWidth = 8; g.stroke();
      const pts: [number, number][] = [];
      for (let i = 0; i < 6; i++) pts.push([cx + (r() - 0.5) * rr * 1.3, cy + (r() - 0.5) * rr * 1.1]);
      g.strokeStyle = 'rgba(240,210,140,0.7)'; g.lineWidth = 2; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
      g.fillStyle = '#fff2c8'; for (const [x, y] of pts) { g.beginPath(); g.arc(x, y, 6, 0, PI * 2); g.fill(); }
      g.fillStyle = '#d8b060'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 ${Math.round(W * 0.07)}px "Archivo Expanded", "Archivo", sans-serif`;
      g.fillText(name, cx, H - 70);
    };
    let zi = 0;
    for (const x of [-5, 5]) for (let z = Z1 + 2; z < Z0; z += 4) { plate(k, `morgan-zod-${zi}`, 4.7, 3.7, x, RH - 0.03, z, [PI / 2, 0, 0], zodiac(ZOD[zi % ZOD.length], 300 + zi), { px: 512, rough: 0.8, fallback: 0x1c2c52 }); zi++; }
    const starPanel = (g: CanvasRenderingContext2D, W: number, H: number) => { const r = rnd(9); g.fillStyle = '#20305a'; g.fillRect(0, 0, W, H); g.strokeStyle = '#c9a052'; g.lineWidth = 10; g.strokeRect(12, 12, W - 24, H - 24); for (let i = 0; i < 40; i++) { const x = 60 + r() * (W - 120), y = 60 + r() * (H - 120); g.fillStyle = '#e6c477'; g.beginPath(); for (let a = 0; a < 10; a++) { const rad = a % 2 ? 4 : 11, an = (a / 10) * PI * 2; g.lineTo(x + Math.cos(an) * rad, y + Math.sin(an) * rad); } g.fill(); } };
    for (const z of [Z1 + 2, Z1 + 6, Z1 + 18, Z0 - 6, Z0 - 2]) plate(k, 'morgan-stars', 4.7, 3.7, 0, RH - 0.03, z, [PI / 2, 0, 0], starPanel, { px: 512, rough: 0.8, fallback: 0x20305a });
    /* Pozzo's trick (Sant'Ignazio, 1685): a dome painted flat on the ceiling, its coffers shrinking to a bright lantern */
    const domeZ = Z1 + 12;
    plate(k, 'morgan-falsedome', 4.7, 7.7, 0, RH - 0.03, domeZ, [PI / 2, 0, 0], (g, W, H) => {
      g.fillStyle = '#c9a052'; g.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2, R0 = W * 0.47;
      for (const [dx, dy] of [[0.12, 0.08], [0.88, 0.08], [0.12, 0.92], [0.88, 0.92]]) { g.fillStyle = '#20305a'; g.beginPath(); g.arc(W * dx, H * dy, W * 0.1, 0, PI * 2); g.fill(); }
      const drum = g.createRadialGradient(cx, cy, R0 * 0.8, cx, cy, R0); drum.addColorStop(0, '#f6e7c4'); drum.addColorStop(1, '#8a6a3a');
      g.fillStyle = drum; g.beginPath(); g.arc(cx, cy, R0, 0, PI * 2); g.fill();
      for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; g.fillStyle = 'rgba(255,248,220,0.95)'; g.beginPath(); g.ellipse(cx + Math.cos(a) * R0 * 0.9, cy + Math.sin(a) * R0 * 0.9, R0 * 0.06, R0 * 0.035, a, 0, PI * 2); g.fill(); }
      let rOut = R0 * 0.82;
      for (let ring = 0; ring < 7; ring++) {
        const rIn = rOut * 0.78, n = 16;
        for (let i = 0; i < n; i++) {
          const a0 = (i / n) * PI * 2 + 0.03, a1 = ((i + 1) / n) * PI * 2 - 0.03, lit = 0.45 + 0.4 * Math.cos(((i + 0.5) / n) * PI * 2 - 2.2);
          g.fillStyle = `rgb(${Math.round(120 + 90 * lit)},${Math.round(100 + 80 * lit)},${Math.round(70 + 60 * lit)})`;
          g.beginPath(); g.arc(cx, cy, rOut * 0.97, a0, a1); g.arc(cx, cy, rIn * 1.04, a1, a0, true); g.closePath(); g.fill();
          g.fillStyle = `rgba(30,20,10,${0.55 - ring * 0.05})`;
          g.beginPath(); g.arc(cx, cy, rOut * 0.97, a0, a0 + 0.05); g.arc(cx, cy, rIn * 1.04, a0 + 0.05, a0, true); g.closePath(); g.fill();
          g.fillStyle = '#e8c878'; g.beginPath(); g.arc(cx + Math.cos((a0 + a1) / 2) * (rOut + rIn) / 2, cy + Math.sin((a0 + a1) / 2) * (rOut + rIn) / 2, (rOut - rIn) * 0.12, 0, PI * 2); g.fill();
        }
        rOut = rIn;
      }
      const sky = g.createRadialGradient(cx, cy, 0, cx, cy, rOut); sky.addColorStop(0, '#ffffff'); sky.addColorStop(0.6, '#cfe0f4'); sky.addColorStop(1, '#7a96c0');
      g.fillStyle = sky; g.beginPath(); g.arc(cx, cy, rOut, 0, PI * 2); g.fill();
      g.strokeStyle = '#6a4a26'; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, R0, 0, PI * 2); g.stroke();
    }, { px: 1024, rough: 0.7, fallback: 0xc9a052 });
    // the lunettes over the top tier on both long walls (Firefly paints Mowbray's figures; a painted stand in until then)
    for (const s of [-1, 1]) for (let i = 0; i < 7; i++) {
      const z = Z1 + 2 + i * 4;
      plate(k, 'morgan-lunette', 3.6, 1.8, s * (RW / 2 - 0.02), 12.85, z, [0, s < 0 ? PI / 2 : -PI / 2, 0], (g, W, H) => {
        g.beginPath(); g.moveTo(0, H); g.arc(W / 2, H, W / 2, PI, 0); g.closePath();
        const sk = g.createLinearGradient(0, 0, 0, H); sk.addColorStop(0, '#5a7ab0'); sk.addColorStop(0.7, '#e8d6b0'); sk.addColorStop(1, '#a88a5a');
        g.fillStyle = sk; g.fill(); g.lineWidth = 14; g.strokeStyle = '#c9a052'; g.stroke();
        g.strokeStyle = 'rgba(80,110,60,0.8)'; g.lineWidth = 6; g.beginPath(); g.arc(W / 2, H * 1.2, W * 0.36, PI * 1.15, PI * 1.85); g.stroke();
      }, { px: 512, transparent: true, rough: 0.85, fallback: 0x8aa0c0 });
    }
    k.point(0, RH - 2.4, Z0 - 6, 0xfff0dc, 26, 16); k.point(0, RH - 2.4, domeZ, 0xfff4e0, 34, 16); k.point(0, RH - 2.4, Z1 + 4, 0xfff0dc, 26, 16);
    k.censusWall({ x: 0, y: 9.8, z: Z1 + 0.2, rotY: 0, cols: 20, rows: 3, tile: 0.55, gap: 0.05, start: ctx.wallStart(1500, 60), pieces: ctx.all, backing: walnut });
    // eggs
    k.egg(v(-8, 4, FZ + 0.2), { id: 'morgan-drylaid', title: 'Marble without mortar', year: '1906', text: 'McKim built the library of Tennessee marble blocks laid dry, without mortar, an uncommon method that added $50,000 to the cost. Morgan had asked him for a gem.', clue: 'Look closely at the joints in the front wall.', source: { name: 'Morgan Library & Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/Morgan_Library_%26_Museum' } }, { r: 1.8 });
    k.egg(v(-4.6, 1.8, FZ + 4.2), { id: 'morgan-lionesses', title: 'The lionesses', text: 'Two lionesses by the sculptor Edward Clark Potter flank the steps to the main entrance. The entrance itself is a Palladian arch, a 14 foot opening between two 9 foot ones, with two Ionic columns on each side.', clue: 'Look at the plinths either side of the steps.', source: { name: 'Morgan Library & Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/Morgan_Library_%26_Museum' } }, { r: 1.4 });
    k.egg(v(0, 2.6, FZ - 1.6), { id: 'morgan-doors', title: 'Doors from Florence', text: 'Inside the portico hang 16th century bronze doors imported from Florence, in the manner of Ghiberti\'s Baptistery doors, each leaf with five bronze panels.', clue: 'Stop in the portico before you go in.', source: { name: 'Morgan Library & Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/Morgan_Library_%26_Museum' } }, { r: 1.6 });
    k.egg(v(RW / 2 - 0.9 - BW / 2, 2.2, Z0 - 4), { id: 'morgan-stair', title: 'The stair behind the books', text: 'Some of the East Room bookcases swing out to reveal a stairway to the upper tiers and a secret compartment. The cases were lined with asbestos and glazed; the glazing was replaced with acrylic in 2010.', clue: 'Find the way up to the first balcony.', source: { name: 'Morgan Library & Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/Morgan_Library_%26_Museum' } }, { r: 1.6 });
    k.egg(v(0, 1.4, Z1 + 1.4), { id: 'morgan-avarice', title: 'The Triumph of Avarice', text: 'The fireplace in the East Room is 15th century work imported from Italy, and the tapestry above it shows the Triumph of Avarice.', clue: 'Warm your hands at the fireplace on the far wall.', source: { name: 'Morgan Library & Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/Morgan_Library_%26_Museum' } }, { r: 1.6 });
    k.egg(v(5, RH - 1.2, Z0 - 10), { id: 'morgan-zodiac', title: 'The signs overhead', text: 'H. Siddons Mowbray designed eighteen lunettes and spandrels for the ceiling, modelled on Pinturicchio. Signs of the zodiac fill the spandrels, and two of them show the changing seasons.', clue: 'Climb to the top balcony and look up.', source: { name: 'Morgan Library & Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/Morgan_Library_%26_Museum' } }, { r: 2 });
    k.egg(v(0, RH - 1.4, domeZ), { id: 'morgan-falsedome', title: 'A dome that is not there', year: '1685', text: 'The dome in the middle of the ceiling is flat paint: coffers that shrink toward a bright lantern read as depth from below. Andrea Pozzo painted the same trick on a flat canvas over the crossing of Sant\'Ignazio in Rome in 1685, when the church could not afford a real dome.', clue: 'Stand under the middle of the ceiling and look straight up, then walk to the end of the room and look again.', source: { name: 'Sant\'Ignazio, Rome, Wikipedia', url: 'https://en.wikipedia.org/wiki/Sant%27Ignazio,_Rome' } }, { r: 2.4 });
    // the works: between the tiers on the case walls (hung on the balcony fronts), the fireplace tapestry, over the door
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = Z0 - 5 - i * 6; mounts.push({ position: v(s * (RW / 2 - 0.9 - BW - 0.12), 5.0, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 3, z), width: 4.0, height: 1.2, style: 'gilt', wash: false }); mounts.push({ position: v(s * (RW / 2 - 0.9 - BW - 0.12), 9.0, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 6, z), width: 4.0, height: 1.2, style: 'gilt', wash: false }); }
    for (const x of [-6, 6]) mounts.push({ position: v(x, 5.0, Z1 + 0.9 + BW + 0.12), rotation: 0, target: v(x, 3, Z1 + 10), width: 4.0, height: 1.2, style: 'gilt', wash: false });
    mounts.push({ position: v(0, 6.8, Z1 + 0.42), rotation: 0, target: v(0, 4, Z1 + 10), width: 4.4, height: 3.2, style: 'gilt', wash: true });
    mounts.push({ position: v(0, 7.1, Z0 - 0.2), rotation: PI, target: v(0, 3, Z0 - 8), width: 3.6, height: 2.1, style: 'gilt', wash: true });
    for (const s of [-1, 1]) mounts.push({ position: v(s * 6, 5.4, Z0 - 0.2), rotation: PI, target: v(s * 6, 3, Z0 - 8), width: 3.6, height: 2.1, style: 'gilt', wash: true });
    const bal = (x: number, z: number) => { const onSide = Math.abs(x) > RW / 2 - 0.9 - BW && Math.abs(x) < RW / 2 - 0.85 && z > Z1 + 0.9 && z < Z0 - 1; const onEnd = z > Z1 + 0.9 && z < Z1 + 0.9 + BW && Math.abs(x) < RW / 2 - 0.9; return onSide || onEnd; };
    return { mounts, spawn: v(0, 3, FZ + 30), look: v(0, 7, FZ), eye: 3, bounds: [-RW / 2 + 0.6, RW / 2 - 0.6, Z1 + 0.6, FZ + 34], style: 'gilt', floorY: (x, z) => {
      if (z > FZ + 1 && z < FZ + 5.4) return Math.max(0, Math.min(0.64, (FZ + 5.4 - z) / 4.4 * 0.64));
      if (z > FZ - 0.2 && z <= FZ + 1) return 0.64 - 0.64 * Math.max(0, (z - FZ + 0.2) / 1.2) + 0.64 * 0;
      // right stair to the first balcony, left stair from the first to the second
      if (Math.abs(x - (RW / 2 - 0.9 - BW / 2)) < BW / 2 && z < Z0 - 1.0 && z > Z0 - 8) return Math.min(4, (Z0 - 1.0 - z) / 6.7 * 4);
      if (Math.abs(x + (RW / 2 - 0.9 - BW / 2)) < BW / 2 && z < Z0 - 1.0 && z > Z0 - 8) return 4 + Math.min(4, (Z0 - 1.0 - z) / 6.7 * 4);
      if (bal(x, z)) return x > 0 ? 4 : 8;
      return 0;
    } };
  },
};

/* ---------------- 48 RADIO CITY ---------------- */
export const radiocity: RoomDef = {
  id: 'radiocity',
  name: 'The great stage',
  area: 'RADIO CITY MUSIC HALL',
  mood: 'House lights down',
  color: '#c8963a',
  description: 'Sixth Avenue under the marquee, the grand foyer, then the auditorium: the sunrise arches of the proscenium, the great stage, the works as the show.',
  signatures: 'The neon marquee wrapping the corner, the grand foyer with its gold mural and chandeliers, the telescoping plaster arches of the auditorium radiating from the stage, the deep red seats, the gold curtain.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x141a2e, horizon: 0x5a4a60, ground: 0x0e0e12, fog: 0.003, stars: 120, env: 0.6 });
    k.hemi(0xffd8c0, 0x1a1418, 0.4);
    /* THE BIG UPGRADE 3b: scanned limestone outside, marble and mirror in the foyer under a gold ceiling with the two
       great chandeliers (a real model), the auditorium as eight smooth plaster bands with ribs and a sunrise cove of
       light at every edge, velvet seats with backs, a scanned stage, the gold contour curtain in folds, and the
       Rockettes kicking in a line of thirty six. */
    const R = 'radiocity';
    const gold = k.pbr('rcGold', X.gilt(0xd8b060), 2, { metalness: 0.85, roughness: 0.3 }),
      red = scan(k, R, 'velour_velvet', 0.6, () => X.velvet(0x8a1a22), { roughness: 0.95, color: 0xff6a6a }, 0x7a1a22),
      carpet = k.pbr('rcCarpet', X.carpet(0x5a1a22, 0xc79a4a), 0.5),
      curtain = k.pbr('rcCurtain', X.velvet(0xc0952e), 0.3, { roughness: 0.55, metalness: 0.55 }),
      stage = scan(k, R, 'old_wood_floor', 2.4, () => X.planks(0x2a2018, 6, 101), { roughness: 0.5, color: 0xa08068 }, 0x3a2a1e),
      marble = scan(k, R, 'marble_01', 1.8, () => X.marble(0xd8c8b0, 0x8a7a5a, 15), { roughness: 0.25, color: 0xffe8d0 }, 0xd8c8b0),
      plaster = scan(k, R, 'white_plaster_02', 2, () => X.plaster(0xd8b890, 52), { color: 0xf0d0a0, roughness: 0.8 }, 0xc8a878),
      dark = k.flat(0x0e0e12, 0.4, 0.8),
      neon = k.glow(0xff3a3a),
      neonB = k.glow(0x3a8aff),
      limestone = scan(k, R, 'large_sandstone_blocks', 3, () => X.ashlar(0xb8ad97, 102, 3), { color: 0xf2e8d8 }, 0xb8ad97),
      mirror = k.flat(0xd8c8b0, 1, 0.06);
    void neonB;
    // Sixth Avenue and the marquee corner
    street(k, { w: 24, len: 140, z: 30, x: 0 });
    blockFront(k, { x: -46, z0: 90, count: 10, face: 1, seed: 103, h: [18, 40] });
    glbs(k, 'radiocity/ph_street_lamp_01', { height: 5 }, [[-30, 0, 22.4, PI], [-12, 0, 22.4, PI], [12, 0, 22.4, PI], [30, 0, 22.4, PI]]);
    const FZ = 10;
    k.box(70, 40, 60, 0, 20, FZ - 30, limestone);
    for (let i = 0; i < 3; i++) k.box(24 - i * 4, 8, 24 - i * 4, 0, 40 + 4 + i * 8, FZ - 40, limestone);
    for (let x = -34; x <= 34; x += 6) k.box(1.2, 40, 0.8, x, 20, FZ + 0.4, limestone);
    for (let i = 0; i < 10; i++) { const ch = 'RADIO CITY'[i]; const y = 30.5 - i * 2.1; k.box(2.6, 2.1, 1.0, -22, y, FZ + 3.6, dark); if (ch !== ' ') { k.sign(ch, 2.2, 1.9, -22, y, FZ + 4.12, '#14090a', '#ff4a4a', 150, 0, { border: false }); k.sign(ch, 2.2, 1.9, -22, y, FZ + 3.08, '#14090a', '#ff4a4a', 150, PI, { border: false }); } }
    k.mesh(new T.BoxGeometry(0.1, 21.2, 0.1), neon, -23.32, 21.05, FZ + 3.6); k.mesh(new T.BoxGeometry(0.1, 21.2, 0.1), neon, -20.68, 21.05, FZ + 3.6);
    k.point(-22, 22, FZ + 7, 0xff5a4a, 60, 26);
    k.box(40, 3.2, 6, 0, 8.2, FZ + 3, dark);
    for (const [y, m] of [[6.7, neon], [9.7, neon]] as const) k.mesh(new T.BoxGeometry(40.2, 0.08, 6.2), m, 0, y, FZ + 3);
    k.sign('RADIO CITY MUSIC HALL', 30, 2.2, 0, 8.2, FZ + 6.05, '#14090a', '#ff4a4a', 160, 0, { border: true });
    k.sign('THE MUSEUM  ·  TONIGHT  ·  THE NEW YORKERS', 30, 1.2, 0, 4.9, FZ + 6.05, '#14090a', '#ffe0b0', 90, 0);
    /* the marquee's chasing bulbs, front and soffit: one instanced draw, colours stepped round the frame */
    const bulbPos: T.Vector3[] = [];
    for (let i = 0; i < 100; i++) { const x = -19.6 + i * 0.396; bulbPos.push(v(x, 6.55, FZ + 6.1), v(x, 9.85, FZ + 6.1)); }
    for (let i = 0; i < 60; i++) bulbPos.push(v(-19.6 + (i % 30) * 1.35, 6.5, FZ + 1.2 + Math.floor(i / 30) * 3.2));
    const bulbs = new T.InstancedMesh(new T.SphereGeometry(0.09, 8, 6), new T.MeshBasicMaterial({ color: 0xffffff }), bulbPos.length);
    const bm = new T.Matrix4(), warmC = new T.Color(0xffe2a0), dimC = new T.Color(0x5a3a20);
    bulbPos.forEach((p, i) => { bulbs.setMatrixAt(i, bm.makeTranslation(p.x, p.y, p.z)); bulbs.setColorAt(i, warmC); });
    k.add(bulbs);
    if (!ctx.reduced) k.ticks.push((t) => { const step = Math.floor(t * 8); for (let i = 0; i < bulbPos.length; i++) bulbs.setColorAt(i, (i + step) % 4 === 0 ? dimC : warmC); bulbs.instanceColor!.needsUpdate = true; });
    for (let i = 0; i < 12; i++) k.point(-18 + i * 3.3, 6.2, FZ + 5, 0xff6a5a, 8, 6);
    for (let x = -18; x <= 18; x += 4.5) { k.box(2.6, 5.4, 0.3, x, 2.7, FZ, k.glass(0xffe0b0, 0.3, 0.1)); k.box(0.3, 5.4, 0.3, x + 2.25, 2.7, FZ, gold); }
    k.block(-40, -3.2, FZ - 0.3, FZ + 0.3); k.block(3.2, 40, FZ - 0.3, FZ + 0.3);
    /* the grand foyer: veined marble walls with gilt pilasters and tall mirrors, a gold leaf ceiling, the two great
       chandeliers, the mural over the stair (Firefly) above the census wall */
    const GW = 30, GD = 16;
    k.box(GW, 0.3, GD, 0, 0.15, FZ - GD / 2, carpet);
    k.box(GW, 18, 0.6, 0, 9, FZ - GD, marble);
    k.block(-GW / 2, -4, FZ - GD - 0.5, FZ - GD + 0.5); k.block(4, GW / 2, FZ - GD - 0.5, FZ - GD + 0.5);
    for (const s of [-1, 1]) { k.box(0.6, 18, GD, s * GW / 2, 9, FZ - GD / 2, marble); k.block(s * GW / 2 - 0.5, s * GW / 2 + 0.5, FZ - GD, FZ); }
    for (const s of [-1, 1]) for (let i = 0; i < 5; i++) {
      const z = FZ - 0.2 - i * 3.6;
      k.box(0.3, 17.4, 0.5, s * (GW / 2 - 0.4), 8.7, z, gold);
      if (i < 4) k.box(0.06, 9.6, 2.8, s * (GW / 2 - 0.32), 11.6, z - 1.8, mirror);
    }
    k.box(GW, 0.6, GD, 0, 18, FZ - GD / 2, gold);
    for (let i = 0; i < 5; i++) k.box(GW - 1, 0.5, 0.4, 0, 17.5, FZ - 1.6 - i * 3.2, gold);
    k.censusWall({ x: 0, y: 8.4, z: FZ - GD + 0.34, rotY: 0, cols: 40, rows: 8, tile: 0.55, gap: 0.05, start: ctx.wallStart(5600, 320), pieces: ctx.all, backing: gold });
    const mural = canvasTex('rc-mural', 1024, 200, (g, W, H) => {
      const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#3a2a4a'); sky.addColorStop(1, '#d8904a');
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      g.save(); g.translate(W / 2, H * 1.05);
      for (let i = 0; i < 36; i++) { const a = PI + (i / 36) * PI; g.strokeStyle = i % 2 ? 'rgba(255,220,150,0.5)' : 'rgba(255,190,110,0.25)'; g.lineWidth = 10; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * W, Math.sin(a) * W); g.stroke(); }
      g.restore();
      g.fillStyle = '#f2c880'; g.beginPath(); g.arc(W / 2, H * 1.05, H * 0.5, PI, 0); g.fill();
    }, false);
    fireflyPlate(k, 'assets/museum/tex/radiocity/ff_foyer_mural.webp', 24, 4.7, 0, 13.6, FZ - GD + 0.32, 0, mural ? new T.MeshStandardMaterial({ map: mural, roughness: 0.7 }) : k.flat(0x8a5a3a, 0, 0.7));
    glbs(k, 'radiocity/chandelier', { height: 6.2 }, [[-8, 11.4, FZ - GD / 2, 0], [8, 11.4, FZ - GD / 2, 0]]);
    for (const x of [-8, 8]) { k.point(x, 12.5, FZ - GD / 2, 0xffe6c0, 50, 24); k.beam(v(x, 18, FZ - GD / 2), v(x, 17.4, FZ - GD / 2), 0.05, gold, 4); }
    for (let i = 0; i < 12; i++) { for (const s of [-1, 1]) k.box(3, 0.3, 1.2, s * (GW / 2 - 2.5), 0.15 + i * 0.3, FZ - 3 - i * 1.0, carpet); }
    glbs(k, 'radiocity/rope_stanchion', { width: 2.2 }, [[-6, 0.3, FZ - 1.5, 0], [6, 0.3, FZ - 1.5, 0]]);
    /* the trick in the foyer: RADIO CITY painted flat on the carpet, stretched so it stands up as a sign only from the doors */
    anamorph(k, 'RADIO CITY', 0, FZ - 0.6, 3.3, 0.31, 4.2, 6.4, 1.5, '#e8c26a', 170);
    /* the auditorium: eight smooth plaster bands telescoping to the proscenium, ribbed, each edge lit from behind */
    const ribT = canvasTex('rc-ribs', 1024, 128, (g, W, H) => {
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#f6e2bc'); gr.addColorStop(0.6, '#e2c08a'); gr.addColorStop(1, '#a8804a');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 48; i++) { const x = (i + 0.5) * (W / 48); g.fillStyle = 'rgba(120,80,40,0.35)'; g.fillRect(x - 3, 0, 6, H); g.fillStyle = 'rgba(255,245,220,0.5)'; g.fillRect(x + 3, 0, 2, H); }
      for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(70,50,30,0.25)'; g.fillRect(0, (i + 0.5) * (H / 6), W, 2); }
    }, false);
    const bandM = ribT ? new T.MeshStandardMaterial({ map: ribT, roughness: 0.75, side: T.BackSide }) : plaster;
    const AZ = FZ - GD, arches = 8;
    const coves: T.MeshBasicMaterial[] = [];
    for (let i = 0; i < arches; i++) {
      const w = 56 - i * 3.7, h = 26 - i * 1.2, z = AZ - 4 - i * 7;   // eight bands closing on a proscenium about 100 ft wide and 60 ft high
      const band = k.mesh(new T.CylinderGeometry(w / 2, w / 2, 7.4, 64, 1, true, PI / 2, PI), bandM, 0, 0, z - 3.5);
      band.rotation.set(PI / 2, 0, 0); band.scale.set(1, 1, h / (w / 2));
      const cm = new T.MeshBasicMaterial({ color: 0xffa860 }); coves.push(cm);
      const cove = k.mesh(new T.TorusGeometry(w / 2 - 0.25, 0.16, 6, 72, PI), cm, 0, 0, z + 0.05, true);
      cove.scale.set(1, (h - 0.25) / (w / 2 - 0.25), 1);
      for (const s of [-1, 1]) k.box(2.4, 2, 7, s * (w / 2 - 0.6), 1, z - 3.5, plaster);
      k.box(w + 2, 0.8, 7, 0, h + 0.4, z - 3.5, dark);
      for (const s of [-1, 1]) { k.box(0.4, h, 7, s * (w / 2 + 1.3), h / 2, z - 3.5, dark); k.block(s * (w / 2 + 1.1), s * (w / 2 + 1.5), z - 7, z); }
      k.point(0, h - 3, z - 3.5, 0xffc890, 60, 40);
      for (const s of [-1, 1]) k.point(s * (w / 2 - 3), h - 4, z - 3.5, 0xff9a60, 30, 20);
    }
    const SZ = AZ - 4 - arches * 7;
    // the orchestra floor steps down row by row (a flat slab here once hid the lower rows, the pit and the stage)
    k.box(44, 0.3, 4.2, 0, -18 * 0.24 - 0.15, AZ - 8 - 17 * 2.6 - 3.4, carpet);
    /* seats with a cushion, a back and arms: one merged shape, instanced */
    const seatParts = [new T.BoxGeometry(0.5, 0.12, 0.5).translate(0, 0.45, 0), new T.BoxGeometry(0.5, 0.62, 0.1).rotateX(-0.12).translate(0, 0.78, 0.26), new T.BoxGeometry(0.06, 0.3, 0.5).translate(-0.28, 0.62, 0), new T.BoxGeometry(0.06, 0.3, 0.5).translate(0.28, 0.62, 0), new T.BoxGeometry(0.4, 0.4, 0.06).translate(0, 0.2, 0.2)];
    const seatG = mergeGeometries(seatParts.map((g) => g.toNonIndexed()))!;
    const seats: T.Matrix4[] = [];
    for (let r = 0; r < 18; r++) { const z = AZ - 8 - r * 2.6, drop = -r * 0.24; for (let x = -18; x <= 18; x += 0.7) { if (Math.abs(x) < 1.8 || Math.abs(Math.abs(x) - 10) < 1) continue; seats.push(new T.Matrix4().compose(v(x, drop, z), new T.Quaternion(), v(1, 1, 1))); } k.box(44, 0.3, 2.6, 0, drop - 0.15, z, carpet); }
    k.instances(seatG, red, seats);
    k.block(-19, -1.8, SZ + 8, AZ - 7); k.block(1.8, 19, SZ + 8, AZ - 7);
    const stageY = -18 * 0.24 - 0.5 + 1.4;
    k.box(44, 1.6, 20, 0, stageY - 0.8, SZ - 6, stage);
    k.box(44.2, 0.2, 0.3, 0, stageY - 0.1, SZ + 4.05, gold);
    const turntable = k.mesh(new T.CylinderGeometry(7.6, 7.6, 0.4, 40), stage, 0, stageY + 0.2, SZ - 6);   // the 50 ft turntable at the centre of the stage
    /* the gold curtain, 112 ft wide by 78 ft tall, hung in folds, and the scalloped contour valance across the top */
    const cg = new T.PlaneGeometry(34.2, 23.8, 160, 1), cp = cg.attributes.position as T.BufferAttribute;
    for (let i = 0; i < cp.count; i++) cp.setZ(i, 0.35 * Math.sin(cp.getX(i) * 3.4) + 0.12 * Math.sin(cp.getX(i) * 9.1));
    cg.computeVertexNormals();
    k.mesh(cg, curtain, 0, stageY + 11.9, SZ - 16);
    const vg = new T.PlaneGeometry(36, 3.4, 180, 6), vp = vg.attributes.position as T.BufferAttribute;
    for (let i = 0; i < vp.count; i++) { const x = vp.getX(i), y = vp.getY(i); const sc = Math.abs(Math.sin(x * PI / 3)); vp.setZ(i, 0.3 * sc * (1 - (y + 1.7) / 3.4) + 0.15 * Math.sin(x * 6)); if (y < -1.2) vp.setY(i, -1.2 - 0.5 * sc); }
    vg.computeVertexNormals();
    k.mesh(vg, curtain, 0, stageY + 21.4, SZ - 13.6);
    for (let i = 0; i < 9; i++) k.spot(-16 + i * 4, stageY + 22, SZ + 4, -16 + i * 4, stageY, SZ - 8, 0xfff0d8, 200, 0.4, 0.6, 40);
    for (const s of [-1, 1]) k.box(4, 9, 2, s * 22, stageY + 4.5, SZ - 4, gold);
    /* the Rockettes: thirty six in a line downstage, kicking together */
    const N = 36, dx = 0.82, hip = 1.25;
    const body = mergeGeometries([new T.BoxGeometry(0.42, 0.62, 0.24).translate(0, hip + 0.42, 0).toNonIndexed(), new T.CylinderGeometry(0.36, 0.2, 0.26, 10).translate(0, hip + 0.06, 0).toNonIndexed(), new T.SphereGeometry(0.15, 10, 8).translate(0, hip + 0.92, 0).toNonIndexed(), new T.CylinderGeometry(0.16, 0.16, 0.22, 10).translate(0, hip + 1.14, 0).toNonIndexed()])!;
    const legG = new T.BoxGeometry(0.12, 1.25, 0.13).translate(0, -0.62, 0);
    const bodies = new T.InstancedMesh(body, new T.MeshStandardMaterial({ color: 0xc8182e, metalness: 0.6, roughness: 0.3 }), N);
    const legs = [0, 1].map(() => new T.InstancedMesh(legG, new T.MeshStandardMaterial({ color: 0xd2a080, roughness: 0.55 }), N));
    const lineZ = SZ + 1.6, q = new T.Quaternion(), ax = new T.Vector3(1, 0, 0), one = new T.Vector3(1, 1, 1);
    const kick = (t: number) => {
      for (let i = 0; i < N; i++) {
        const x = (i - (N - 1) / 2) * dx;
        bodies.setMatrixAt(i, bm.makeTranslation(x, stageY, lineZ));
        [0, 1].forEach((l) => { const a = 1.55 * Math.max(0, Math.sin(t * 3.0 + (l ? PI : 0))); legs[l].setMatrixAt(i, new T.Matrix4().compose(v(x + (l ? 0.1 : -0.1), stageY + hip, lineZ), q.setFromAxisAngle(ax, -a), one)); });
      }
      bodies.instanceMatrix.needsUpdate = true; legs.forEach((m) => (m.instanceMatrix.needsUpdate = true));
    };
    kick(0.5);
    for (const m of [bodies, ...legs]) { m.frustumCulled = false; k.add(m); }
    /* the show: the curated works cycle on a great screen over the stage, and a sunrise climbs the cove lights */
    const show = k.mesh(new T.PlaneGeometry(26, 14.6), new T.MeshBasicMaterial({ color: 0x111111 }), 0, stageY + 12, SZ - 14.9);
    void show;
    const sunrise = [new T.Color(0xff5a3a), new T.Color(0xffa860), new T.Color(0xffe0a0), new T.Color(0xff7aa0)];
    coves.forEach((m, i) => m.color.copy(sunrise[i % 4]));
    if (!ctx.reduced) {
      const glows: T.PointLight[] = [];
      k.scene.traverse((o) => { if (o instanceof T.PointLight && o.position.z < AZ && o.position.z > SZ - 1) glows.push(o); });
      const c = new T.Color();
      k.ticks.push((t) => {
        glows.forEach((l, i) => { l.intensity = 40 + 30 * Math.sin(t * 0.6 + i * 0.5); });
        coves.forEach((m, i) => { const p = (Math.sin(t * 0.5 - i * 0.55) + 1) / 2; c.copy(sunrise[0]).lerp(sunrise[2], p); m.color.copy(c); });
        kick(t);
      });
    }
    k.egg(v(0, 0.4, FZ - 6), { id: 'radiocity-anamorph', title: 'Letters that stand up', year: '1533', text: 'RADIO CITY is painted flat on the foyer carpet and stretched toward the stair, so that it rises off the floor as a sign only from the doors. Take a step aside and it falls back into a smear. The trick is anamorphosis, the one that hides a skull across the floor of Hans Holbein\'s The Ambassadors of 1533.', clue: 'Go back to the doors and look down the foyer.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.8 });
    k.egg(v(0, stageY + 1.6, SZ + 1.6), { id: 'radiocity-rockettes', title: 'The eye high kicks', year: '1932', text: 'The Rockettes began in St. Louis in 1925 as the Missouri Rockets and have danced at Radio City since it opened in 1932. They are known for precision dance and the eye high kick, done in unison down the whole line.', clue: 'Watch the line at the front of the stage.', source: { name: 'Rockettes, Wikipedia', url: 'https://en.wikipedia.org/wiki/Rockettes' } }, { r: 2.4 });
    // eggs
    k.egg(v(0, 22, AZ - 18), { id: 'radiocity-sunset', title: 'A sunset from a ship', text: 'The ceiling is eight telescoping plaster bands, each overlapping the next by two feet at 30 foot intervals, closing on a proscenium meant to look like a setting sun. Roxy Rothafel reportedly came up with the sunset while sailing home from Europe. Grilles in the bands hide air conditioning, speakers and organ pipes.', clue: 'Stand in the aisle and look up the bands toward the stage.', source: { name: 'Radio City Music Hall, Wikipedia', url: 'https://en.wikipedia.org/wiki/Radio_City_Music_Hall' } }, { r: 2.4 });
    k.egg(turntable, { id: 'radiocity-hydraulics', title: 'Guarded in wartime', text: 'Peter Clark designed the stage, 144 by 66.5 feet, with a 50 foot turntable and three 70 foot sections that rise and sink, built by Otis. Radio City lore says the Navy used the same hydraulics on aircraft carriers in the Second World War and government agents guarded the basement.', clue: 'Look at the round turntable in the middle of the stage.', source: { name: 'Radio City Music Hall, Wikipedia', url: 'https://en.wikipedia.org/wiki/Radio_City_Music_Hall' } }, { r: 2.4 });
    k.egg(v(22, stageY + 4.5, SZ - 4), { id: 'radiocity-wurlitzer', title: 'The biggest Wurlitzer', text: 'The Mighty Wurlitzer here is the largest the company ever built, with 58 ranks and 4,178 pipes. It plays from twin four manual consoles on either side of the stage, so two organists can play at once.', clue: 'Look at the gold console at the right hand side of the stage.', source: { name: 'Radio City Music Hall, Wikipedia', url: 'https://en.wikipedia.org/wiki/Radio_City_Music_Hall' } }, { r: 2 });
    k.egg(v(-GW / 2 + 1.6, 1.6, FZ - GD + 1.6), { id: 'radiocity-eve', title: 'The nudes Roxy hid', year: '1932', text: 'Three aluminium nude sculptures were planned, but Roxy Rothafel thought nudes wrong for a family hall, and only Robert Laurent\'s Goose Girl was on show on opening night. Gwen Lux\'s Eve stands in the south west corner of the grand foyer.', clue: 'Find the far left corner of the foyer.', source: { name: 'Radio City Music Hall, Wikipedia', url: 'https://en.wikipedia.org/wiki/Radio_City_Music_Hall' } }, { r: 1.6 });
    k.egg(v(0, -2, AZ - 30), { id: 'radiocity-seats', title: 'The largest auditorium', year: '1932', text: 'The hall opened on 27 December 1932 with 5,960 seats, about 3,500 of them on the orchestra floor, the largest auditorium in the world at the time. There are only four aisles and no crossover aisle.', clue: 'Walk down the centre aisle.', source: { name: 'Radio City Music Hall, Wikipedia', url: 'https://en.wikipedia.org/wiki/Radio_City_Music_Hall' } }, { r: 2 });
    k.egg(v(-22, 20, FZ + 4.4), { id: 'radiocity-signs', title: 'Ninety feet of name', text: 'Three vertical signs, each 90 feet tall, carry the name, and the marquee wraps the corner of Sixth Avenue and 50th Street. Inside, no two of the restrooms and lounges were given the same design.', clue: 'Look up the vertical sign by the marquee.', source: { name: 'Radio City Music Hall, Wikipedia', url: 'https://en.wikipedia.org/wiki/Radio_City_Music_Hall' } }, { r: 2.4 });
    // the works: the foyer, the arch piers on both sides of the fan, the stage screen
    const mounts: Mount[] = [];
    for (let i = 0; i < 4; i++) { const z = FZ - 2 - i * 3.6; for (const s of [-1, 1]) mounts.push({ position: v(s * (GW / 2 - 0.34), 3.8, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 3, z), width: 3.0, height: 1.8, style: 'gilt', wash: true }); }
    for (let i = 0; i < 6; i++) { const w = 56 - i * 3.7, z = AZ - 4 - i * 7 - 3.5; const drop = -Math.max(0, (AZ - 8 - z) / 2.6) * 0.24; for (const s of [-1, 1]) mounts.push({ position: v(s * (w / 2 + 1.06), drop + 4.2, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 1.2, drop + 3, z), width: 4.6, height: 2.7, style: 'gilt', wash: true }); }
    mounts.push({ position: v(0, stageY + 12, SZ - 14.8), rotation: 0, target: v(0, stageY + 6, SZ + 12), width: 26, height: 14.6, style: 'none', wash: false });
    for (const x of [-13, 13]) mounts.push({ position: v(x, stageY + 4, SZ - 14.7), rotation: 0, target: v(x < 0 ? -1.2 : 1.2, stageY + 3, SZ + 10), width: 6, height: 3.5, style: 'gilt', wash: false });
    return { mounts, spawn: v(-30, 3, FZ + 24), look: v(-6, 10, FZ + 2), eye: 3, bounds: [-34, 20, SZ + 6, FZ + 32], style: 'gilt', floorY: (x, z) => { void x; if (z < AZ - 7) return -Math.min(18, Math.max(0, (AZ - 8 - z) / 2.6)) * 0.24; return 0; } };
  },
};

/* ---------------- 49 THE WOOLWORTH LOBBY ---------------- */
export const woolworth: RoomDef = {
  id: 'woolworth',
  name: 'The cathedral of commerce',
  area: 'THE WOOLWORTH BUILDING',
  mood: 'Gothic gold',
  color: '#d4c48a',
  description: 'Broadway under the terracotta tower, then the cruciform lobby: gold mosaic vaults, marble, the gothic grilles, the works in the arcade bays.',
  signatures: 'The 792 foot terracotta gothic tower with its green copper crown, the cross shaped lobby of two barrel vaulted arms under glass mosaic and a dome at the crossing, veined Skyros marble walls, bronze gothic tracery, the mezzanine murals.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad0, horizon: 0xe6e8e4, ground: 0x5a5a55, fog: 0.0022, sun: { az: 3.6, el: 0.75, color: 0xfff4e6, size: 12 }, env: 0.85 });
    k.hemi(0xfff0dc, 0x3a3020, 0.55);
    k.sun(0xfff0d8, 1.6, 40, 60, 30, true, 70);
    const terra = k.pbr('wwTerra', X.windows(104, 0.3, 0xd8d0b8, true), 0.12, { emissive: 0xffffff, emissiveIntensity: 0.5, roughness: 0.7, stretch: 0.42 }),
      terraS = k.pbr('wwTerraS', X.ashlar(0xe0d8c0, 105, 4), 0.2),
      marble = scan(k, 'woolworth', 'marble_01', 1.4, () => X.marble(0xd8cfb8, 0x8a7a5a, 11), { roughness: 0.25, color: 0xfff0dc }, 0xdcd2bc),
      mosaicF = k.pbr('wwMosaicF', X.gilt(0xc9a552), 1.2, { metalness: 0.6, roughness: 0.45 }),
      bronze = k.flat(0x5a4a2a, 0.8, 0.4),
      gold = k.pbr('wwGold', X.gilt(0xc9a552), 2, { metalness: 0.8, roughness: 0.35 }),
      verde = k.flat(0x2a3a30, 0.1, 0.25),
      floorM = scan(k, 'woolworth', 'marble_tiles', 1.6, () => X.terrazzo(0xc8bca0, 54), { roughness: 0.22, color: 0xf6ecdc }, 0xc8bca0),
      copper = k.pbr('wwCopper', X.patina(0x5f9a8c), 0.6, { roughness: 0.6, metalness: 0.3 }),
      glass = k.glass(0xdcecf6, 0.14, 0.04),
      dark = k.flat(0x1a1a1c, 0.5, 0.6),
      glow = k.glow(0xffe8b0);
    // Broadway, City Hall Park across the street, the tower
    street(k, { w: 22, len: 140, z: 30, x: 0 });
    k.box(90, 0.4, 70, 0, -0.1, 70, k.pbr('wwLawn', X.grass(0x4b6b3a, 55), 0.05));
    for (let i = 0; i < 16; i++) { const rnd = X.mulberry(49 + i); const tx = -40 + rnd() * 80, tz = 45 + rnd() * 40; if (Math.abs(tx) < 14) continue; k.tree(tx, 0, tz, { kind: 'round', h: 5 + rnd() * 3, r: 2.4 + rnd() * 1.4, seed: i }); }
    k.box(12, 0.3, 70, 0, 0.05, 70, k.pbr('wwPath', X.pavers(0x9a9a94, 57), 0.4));
    blockFront(k, { x: -50, z0: 90, count: 10, face: 1, seed: 106, h: [18, 34] });
    glbs(k, 'woolworth/ph_street_lamp_01', { height: 4.6 }, [[-14, 0, 20.6, PI], [14, 0, 20.6, PI], [-7, 0, 44, 0], [7, 0, 44, 0], [-7, 0, 64, 0], [7, 0, 64, 0]]);
    glbs(k, 'woolworth/ph_painted_wooden_bench', { width: 1.8 }, [[-7.4, 0.1, 50, PI / 2], [7.4, 0.1, 50, -PI / 2], [-7.4, 0.1, 58, PI / 2], [7.4, 0.1, 58, -PI / 2]]);
    const FZ = 8, TW = 46;
    k.box(TW, 96, 40, 0, 48, FZ - 20, terra);
    for (let i = 0; i < 3; i++) k.box(TW - i * 2, 1.2, 40 - i * 2, 0, 20 + i * 30, FZ - 20, terraS);
    for (let x = -TW / 2 + 2; x < TW / 2; x += 4) { k.box(0.9, 96, 0.9, x, 48, FZ + 0.4, terraS); k.mesh(new T.ConeGeometry(0.7, 3.4, 4), copper, x, 97.7, FZ + 0.4).rotation.y = PI / 4; }
    /* THE BIG UPGRADE 3b: gothic spandrel bands every two floors and pinnacles on the piers, so the shaft reads as
       Gilbert's terracotta and not as a window grid */
    for (let y = 8; y < 95; y += 8) k.box(TW + 0.6, 0.45, 0.7, 0, y, FZ + 0.3, terraS);
    for (let y = 104; y < 214; y += 8) k.box(26.6, 0.45, 0.7, 0, y, FZ - 20 + 13.3, terraS);
    for (let x = -12; x <= 12; x += 3.2) k.mesh(new T.ConeGeometry(0.45, 2.6, 4), copper, x, 217.3, FZ - 20 + 13.2).rotation.y = PI / 4;
    for (const s of [-1, 1]) k.box(0.7, 96, 40.4, s * (TW / 2 - 0.2), 48, FZ - 20, terraS);
    k.box(26, 120, 26, 0, 96 + 60, FZ - 20, terra);
    for (let x = -12; x <= 12; x += 3.2) k.box(0.5, 120, 0.4, x, 156, FZ - 20 + 13.1, terraS);
    for (let i = 0; i < 3; i++) k.moulding([[0, 0], [0.7, 0], [0.8, 0.3], [0.4, 0.5], [0.6, 0.8], [0, 1.0]], 26.4, 0, 120 + i * 30, FZ - 20 + 13.2, terraS, -PI / 2);
    k.mesh(new T.ConeGeometry(15, 30, 4), copper, 0, 216 + 15, FZ - 20).rotation.y = PI / 4;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { k.box(3, 12, 3, sx * 12, 216 + 6, FZ - 20 + sz * 12, terraS); k.mesh(new T.ConeGeometry(2, 6, 4), copper, sx * 12, 216 + 15, FZ - 20 + sz * 12); }
    k.point(0, 244, FZ - 20, 0xfff0c8, 400, 120);
    k.arch(8, 14, 6, 0, 0, FZ - 3, terraS, true, 0.85);
    for (let i = 0; i < 4; i++) k.arch(8 + i * 1.4, 14 + i * 1.2, 0.5, 0, 0, FZ + 0.2 + i * 0.5, terraS, true, 0.66);
    k.block(-TW / 2, -4, FZ - 0.4, FZ + 0.4); k.block(4, TW / 2, FZ - 0.4, FZ + 0.4);
    k.box(TW, 0.3, 4, 0, 0.15, FZ + 3, terraS);
    /* the lobby: a cross of two barrel vaulted arms. THE BIG UPGRADE 3b: each arm's marble walls stopped short of the
       crossing (they used to run straight through it, so from the door the lobby was a closed box), scanned Skyros
       style marble and marble floor, glass mosaic painted tessera by tessera, gothic bronze tracery, hanging lanterns
       (a real model), end walls with the Labor and Commerce lunettes and, at the far end, the trick. */
    const LZ = FZ - 20, LEN = 40, AW = 12, AH = 8, CL = 30;
    const mosT = canvasTex('ww-mosaic', 512, 512, (g, W, H) => {
      const r = rnd(1913), t = 8;
      for (let y = 0; y < H; y += t) for (let x = 0; x < W; x += t) { const b = 0.75 + r() * 0.35; g.fillStyle = `rgb(${Math.round(196 * b)},${Math.round(150 * b)},${Math.round(62 * b)})`; g.fillRect(x, y, t - 1, t - 1); }
      const tess = (cx: number, cy: number, rad: number, col: string[]) => { for (let y = cy - rad; y < cy + rad; y += t) for (let x = cx - rad; x < cx + rad; x += t) { const d = Math.hypot(x - cx, y - cy); if (d < rad) { g.fillStyle = col[Math.floor(r() * col.length)]; g.fillRect(x, y, t - 1, t - 1); } } };
      tess(W / 2, H / 2, 150, ['#1f4a7a', '#24568a', '#1a3e6a']);
      tess(W / 2, H / 2, 110, ['#2e7a5e', '#286a52', '#348a6a']);
      tess(W / 2, H / 2, 46, ['#d8b060', '#e8c878', '#b02a2a']);
      for (const [cx, cy] of [[0, 0], [W, 0], [0, H], [W, H]]) tess(cx, cy, 70, ['#1f4a7a', '#b02a2a', '#24568a']);
      g.strokeStyle = 'rgba(160,30,30,0.85)'; g.lineWidth = 8; g.beginPath(); g.arc(W / 2, H / 2, 154, 0, PI * 2); g.stroke();
      g.strokeStyle = 'rgba(40,110,80,0.8)'; g.lineWidth = 7;
      for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; g.beginPath(); g.moveTo(W / 2 + Math.cos(a) * 160, H / 2 + Math.sin(a) * 160); g.quadraticCurveTo(W / 2 + Math.cos(a + 0.3) * 230, H / 2 + Math.sin(a + 0.3) * 230, W / 2 + Math.cos(a + 0.2) * 250, H / 2 + Math.sin(a + 0.2) * 250); g.stroke(); }
    });
    if (mosT) mosT.repeat.set(6, 12);
    const mosaic = mosT ? new T.MeshStandardMaterial({ map: mosT, metalness: 0.55, roughness: 0.42, side: T.BackSide }) : k.pbr('wwMosaic', X.gilt(0xc9a552), 1.2, { metalness: 0.5, roughness: 0.5, side: T.BackSide });
    const vault = (len: number, x: number, z: number, along: 'z' | 'x') => {
      const m = k.mesh(new T.CylinderGeometry(AW / 2, AW / 2, len, 32, 1, true, along === 'z' ? PI / 2 : 0, PI), mosaic, x, AH, z);
      if (along === 'z') m.rotation.set(PI / 2, 0, 0); else m.rotation.set(0, 0, PI / 2);
      k.box(along === 'z' ? AW + 1 : len, 0.4, along === 'z' ? len : AW + 1, x, AH + AW / 2 + 0.2, z, dark);
    };
    vault(LEN, 0, LZ, 'z');
    vault(CL, 0, LZ, 'x');
    // marble walls in four runs that stop at the crossing, a moulded cornice where the vault springs
    const nearZ = LZ + AW / 2, farZ = LZ - AW / 2, ZE = LZ + LEN / 2, ZF = LZ - LEN / 2;
    for (const s of [-1, 1]) {
      for (const [a, b] of [[ZF, farZ], [nearZ, ZE]]) { k.box(0.6, AH, b - a, s * (AW / 2 + 0.3), AH / 2, (a + b) / 2, marble); k.box(0.5, 0.35, b - a, s * (AW / 2 - 0.1), AH - 0.2, (a + b) / 2, gold); k.box(0.3, 0.5, b - a, s * (AW / 2 - 0.05), 0.25, (a + b) / 2, verde); }
      for (const zz of [farZ, nearZ]) { k.box(CL / 2 - AW / 2, AH, 0.6, s * (CL / 4 + AW / 4), AH / 2, zz + (zz < LZ ? -0.3 : 0.3), marble); k.box(CL / 2 - AW / 2, 0.35, 0.5, s * (CL / 4 + AW / 4), AH - 0.2, zz + (zz < LZ ? 0.1 : -0.1), gold); }
      k.box(0.6, AH + AW / 2, AW, s * (CL / 2 + 0.3), (AH + AW / 2) / 2, LZ, marble);
      for (const zz of [farZ, nearZ]) k.box(1.0, AH, 1.0, s * (AW / 2 + 0.2), AH / 2, zz + (zz < LZ ? 0.2 : -0.2), marble);
    }
    k.box(AW, AH + AW / 2, 0.6, 0, (AH + AW / 2) / 2, ZF - 0.3, marble);
    for (const s of [-1, 1]) k.box(AW / 2 - 3.2, AH, 0.6, s * (3.2 + (AW / 2 - 3.2) / 2), AH / 2, ZE - 0.3, marble);
    k.box(AW, AW / 2, 0.6, 0, AH + AW / 4, ZE - 0.3, marble);
    k.arch(6.4, AH, 0.8, 0, 0, ZE - 0.3, gold, true, 0.35);
    k.box(LEN + 4, 0.3, 34, 0, 0.15, LZ, floorM);
    k.block(-AW / 2 - 0.5, -AW / 2 + 0.1, ZF, farZ); k.block(AW / 2 - 0.1, AW / 2 + 0.5, ZF, farZ);
    k.block(-AW / 2 - 0.5, -AW / 2 + 0.1, nearZ, FZ); k.block(AW / 2 - 0.1, AW / 2 + 0.5, nearZ, FZ);
    k.block(-15.5, -AW / 2, farZ - 0.5, farZ + 0.1); k.block(AW / 2, 15.5, farZ - 0.5, farZ + 0.1);
    k.block(-15.5, -AW / 2, nearZ - 0.1, nearZ + 0.5); k.block(AW / 2, 15.5, nearZ - 0.1, nearZ + 0.5);
    k.block(-15.5, 15.5, ZF - 0.5, ZF + 0.1);
    k.block(-15.5, -15, farZ, nearZ); k.block(15, 15.5, farZ, nearZ);
    // the crossing: a shallow dome of mosaic, the mezzanine balconies with bronze rails on both cross arms
    const dome = k.mesh(new T.SphereGeometry(AW / 2 + 1, 32, 12, 0, PI * 2, 0, PI / 2), mosaic, 0, AH, LZ); dome.scale.y = 0.7;
    k.point(0, AH + 2, LZ, 0xffe6b0, 34, 30);
    for (const s of [-1, 1]) { k.box(6, 0.3, AW - 1, s * 12, 4.6, LZ, marble); k.box(6, 0.5, 0.2, s * 12, 4.3, LZ - AW / 2 + 0.6, gold); k.rail(s * 9.2, LZ, AW - 1, bronze, 0.95, 'z', 1.4); k.point(s * 12, 7, LZ, 0xffe6b0, 14, 12); }
    /* gothic bronze tracery between the arcade bays: a pointed lancet pair under a quatrefoil, alpha tested */
    const traT = canvasTex('ww-tracery', 256, 344, (g, W, H) => {
      g.strokeStyle = '#ffffff'; g.lineWidth = 9;
      g.strokeRect(6, 6, W - 12, H - 12);
      const lancet = (x0: number, w: number, top: number) => { g.beginPath(); g.moveTo(x0, H - 10); g.lineTo(x0, top + w * 0.8); g.quadraticCurveTo(x0, top, x0 + w / 2, top - w * 0.1); g.quadraticCurveTo(x0 + w, top, x0 + w, top + w * 0.8); g.lineTo(x0 + w, H - 10); g.stroke(); };
      lancet(28, 90, 150); lancet(138, 90, 150);
      for (let i = 0; i < 4; i++) { const a = (i / 4) * PI * 2; g.beginPath(); g.arc(W / 2 + Math.cos(a) * 26, 70 + Math.sin(a) * 26, 22, 0, PI * 2); g.stroke(); }
      for (let y = 200; y < H; y += 46) { g.beginPath(); g.moveTo(10, y); g.lineTo(W - 10, y); g.stroke(); }
    }, false);
    const tracery = traT ? new T.MeshStandardMaterial({ map: traT, color: 0x9a7a44, metalness: 0.85, roughness: 0.35, alphaTest: 0.5, side: T.DoubleSide }) : null;
    for (let i = 0; i < 6; i++) {
      const z = LZ - 14 + i * 5;
      if (Math.abs(z - LZ) < AW / 2 + 0.5) continue;
      for (const s of [-1, 1]) {
        if (tracery) { const p = k.mesh(new T.PlaneGeometry(2.4, 3.2), tracery, s * (AW / 2 - 0.08), 4.4, z); p.rotation.y = s < 0 ? PI / 2 : -PI / 2; }
        k.box(0.12, 0.12, 2.5, s * (AW / 2 - 0.12), 2.78, z, bronze); k.box(0.12, 0.12, 2.5, s * (AW / 2 - 0.12), 6.02, z, bronze);
      }
      k.point(0, AH - 1, z, 0xffe0a8, 12, 12);
    }
    glbs(k, 'woolworth/lantern', { height: 1.7 }, [[0, 5.6, LZ - 15, 0], [0, 5.6, LZ - 10.5 + 21, 0], [0, 5.6, LZ + 15, 0], [-11, 6.4, LZ, 0], [11, 6.4, LZ, 0]]);
    for (const [x, z, y] of [[0, LZ - 15, 7.3], [0, LZ + 10.5, 7.3], [0, LZ + 15, 7.3], [-11, LZ, 8.1], [11, LZ, 8.1]]) k.beam(v(x, y, z), v(x, Math.min(AH + AW / 2 - 0.3, y + 6), z), 0.025, bronze, 4);
    /* Labor and Commerce in the lunettes at the ends of the cross arms (Firefly paints them), a mosaic roundel until then */
    const lun = (seed: number, title: string) => canvasTex(`ww-lunette-${seed}`, 1024, 512, (g, W, H) => {
      const r = rnd(seed);
      const sk = g.createLinearGradient(0, 0, 0, H); sk.addColorStop(0, '#24406a'); sk.addColorStop(1, '#c9a552');
      g.fillStyle = sk; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(255,${200 + Math.floor(r() * 50)},120,${r() * 0.25})`; g.fillRect(r() * W, r() * H, 7, 7); }
      g.strokeStyle = '#d8b060'; g.lineWidth = 18; g.beginPath(); g.arc(W / 2, H, W / 2 - 12, PI, 0); g.stroke();
      g.fillStyle = '#f2e2b0'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '800 64px "Archivo Expanded", "Archivo", sans-serif'; g.fillText(title, W / 2, H * 0.78);
    }, false);
    for (const [s, title, seed] of [[-1, 'LABOR', 31], [1, 'COMMERCE', 32]] as const) {
      const t = lun(seed, title);
      fireflyPlate(k, `assets/museum/tex/woolworth/ff_${title.toLowerCase()}.webp`, AW, AW / 2, s * (CL / 2 - 0.02), AH + AW / 4, LZ, s < 0 ? PI / 2 : -PI / 2, t ? new T.MeshStandardMaterial({ map: t, roughness: 0.6 }) : k.flat(0x24406a, 0, 0.6));
    }
    /* THE TRICK: at the far end the vault does not stop. A painted lunette carries its ribs and lanterns on and on to a
       vanishing point (quadratura, the wall painting that extends a real room), so the arcade reads twice as long. */
    plate(k, 'ww-quadratura', AW, AW / 2, 0, AH + AW / 4, ZF + 0.12, [0, 0, 0], (g, W, H) => {
      const cx = W / 2, cy = H, vy = H * 0.98;
      g.fillStyle = '#2a2016'; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 14; i++) {
        const f = Math.pow(0.8, i), rr = (W / 2) * f, nr = (W / 2) * f * 0.8;
        const b = 0.95 * Math.pow(0.86, i);
        g.fillStyle = `rgb(${Math.round(205 * b)},${Math.round(160 * b)},${Math.round(70 * b)})`;
        g.beginPath(); g.arc(cx, vy + (cy - vy) * f, rr, PI, 0); g.arc(cx, vy + (cy - vy) * f * 0.8, nr, 0, PI, true); g.closePath(); g.fill();
        for (let j = 0; j < 9; j++) { const a = PI + ((j + 0.5) / 9) * PI; g.fillStyle = `rgba(30,70,110,${0.7 * b})`; g.beginPath(); g.arc(cx + Math.cos(a) * (rr + nr) / 2, vy + Math.sin(a) * (rr + nr) / 2, (rr - nr) * 0.22, 0, PI * 2); g.fill(); }
        g.strokeStyle = `rgba(80,50,20,${0.9 * b})`; g.lineWidth = Math.max(1, 10 * f); g.beginPath(); g.arc(cx, vy, rr, PI, 0); g.stroke();
        if (i % 2 === 1) { g.fillStyle = `rgba(255,220,150,${0.9 * b})`; g.beginPath(); g.ellipse(cx, vy - rr * 0.55, 8 * f + 1, 16 * f + 2, 0, 0, PI * 2); g.fill(); }
      }
      const glow = g.createRadialGradient(cx, vy, 0, cx, vy, W * 0.08); glow.addColorStop(0, 'rgba(255,240,200,0.95)'); glow.addColorStop(1, 'rgba(255,240,200,0)');
      g.fillStyle = glow; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'destination-in'; g.fillStyle = '#000'; g.beginPath(); g.arc(cx, H, W / 2, PI, 0); g.closePath(); g.fill(); g.globalCompositeOperation = 'source-over';
    }, { px: 1024, transparent: true, rough: 0.6, fallback: 0x8a6a3a });
    for (const s of [-1, 1]) { k.box(2.4, 5, 0.3, s * 3.6, 2.5, ZF + 0.4, bronze); k.mesh(new T.PlaneGeometry(1.6, 3.4), glow, s * 3.6, 2.6, ZF + 0.6); }
    k.censusWall({ x: 0, y: 3.6, z: ZF + 0.36, rotY: 0, cols: 12, rows: 5, tile: 0.55, gap: 0.05, start: ctx.wallStart(4900, 60), pieces: ctx.all, backing: mosaicF });
    k.sign('THE MUSEUM  ·  WOOLWORTH  ·  1913', 8, 0.7, 0, 6.8, ZF + 0.36, 'transparent', '#f0e0b0', 70, 0);
    for (const s of [-1, 1]) k.box(0.8, 0.8, 0.8, s * 4, 0.4, LZ + 8, marble), k.prop('lantern', s * 4, 0.8, LZ + 8, { height: 1.1 });
    k.egg(v(0, AH + 2, ZF + 1), { id: 'woolworth-quadratura', title: 'The vault that keeps going', text: 'The far end of the vault is a flat wall. The arches, the mosaic and the lanterns that seem to carry on past it are painted in perspective onto the lunette, so the lobby reads twice as long from the door. Painters call it quadratura: Andrea Mantegna painted an open oculus on the flat ceiling of the Camera degli Sposi in Mantua around 1474.', clue: 'Walk toward the far end of the lobby and watch the vault stop.', source: { name: 'Quadratura, Wikipedia', url: 'https://en.wikipedia.org/wiki/Quadratura' } }, { r: 2 });
    // eggs
    k.egg(v(0, 236, FZ - 20), { id: 'woolworth-wilson', title: 'Lit from Washington', year: '1913', text: 'The building opened on 24 April 1913. At 7:30 that evening President Woodrow Wilson pressed a button in Washington and the lights came on. At 792 feet it was the tallest building in the world until 40 Wall Street and the Chrysler Building went up in 1929 and 1930.', clue: 'Look up at the green crown from City Hall Park.', source: { name: 'Woolworth Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/Woolworth_Building' } }, { r: 6 });
    k.egg(v(AW / 2 - 0.4, 6.4, LZ - 9), { id: 'woolworth-grotesques', title: 'The builders in the brackets', text: 'Twelve plaster brackets in the lobby carry grotesques of the people behind the building: Cass Gilbert holding a model of it, the engineer Gunvald Aus measuring a girder, and Frank Woolworth holding nickels and dimes.', clue: 'Look up where the arcade walls meet the vault.', source: { name: 'Woolworth Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/Woolworth_Building' } }, { r: 1.6 });
    k.egg(v(-12, 7.2, LZ), { id: 'woolworth-murals', title: 'Labor and Commerce', text: 'C. Paul Jennewein\'s ceiling murals Labor and Commerce sit above the mezzanine where it crosses the north and south wings of the lobby.', clue: 'Look above the mezzanine in the cross arms.', source: { name: 'Woolworth Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/Woolworth_Building' } }, { r: 2 });
    k.egg(v(0, 0.6, LZ + 4), { id: 'woolworth-pool', title: 'A pool under the lobby', text: 'The basement holds an unused bank vault, a restaurant, a barbershop and a private pool 15 by 55 feet, restored in the mid 2010s. A subway entrance to Park Place station closed after the September 11 attacks.', clue: 'Stand at the crossing and look down.', source: { name: 'Woolworth Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/Woolworth_Building' } }, { r: 1.6 });
    k.egg(v(0, 6.8, LZ - LEN / 2 + 0.8), { id: 'woolworth-cadman', title: 'Not his cathedral', year: '1916', text: 'The nickname Cathedral of Commerce comes from the Reverend S. Parkes Cadman, in a 1916 booklet. Cass Gilbert disliked the religious comparison.', clue: 'Read the sign at the far end of the lobby.', source: { name: 'Woolworth Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/Woolworth_Building' } }, { r: 1.6 });
    k.egg(v(0, AH + 3.6, LZ), { id: 'woolworth-dome', title: 'A dome from Ravenna', text: 'The two barrel vaulted arms of the lobby cross under a dome whose pendentives may be modelled on the Mausoleum of Galla Placidia. The walls are veined marble from Skyros in Greece, and the ceilings are glass mosaic in blue, green and gold with red accents.', clue: 'Stand at the crossing and look straight up.', source: { name: 'Woolworth Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/Woolworth_Building' } }, { r: 2 });
    // the works: the arcade bays of the long arm between the grilles, the cross arms, the mezzanine fronts
    const mounts: Mount[] = [];
    for (let i = 0; i < 5; i++) { const z = LZ - 11.5 + i * 5; for (const s of [-1, 1]) mounts.push({ position: v(s * (AW / 2 - 0.34), 2.4, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 2.5, z), width: 3.0, height: 1.8, style: 'gilt', wash: true }); }
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const x = s * (8 + i * 3); mounts.push({ position: v(x, 2.6, LZ - AW / 2 + 0.34), rotation: 0, target: v(x, 2.5, LZ), width: 2.4, height: 1.5, style: 'gilt', wash: false }); mounts.push({ position: v(x, 2.6, LZ + AW / 2 - 0.34), rotation: PI, target: v(x, 2.5, LZ), width: 2.4, height: 1.5, style: 'gilt', wash: false }); }
    for (const s of [-1, 1]) mounts.push({ position: v(s * 9.05, 6.0, LZ), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 3, LZ), width: 4.6, height: 2.7, style: 'gilt', wash: true });
    return { mounts, spawn: v(12, 3, FZ + 88), look: v(0, 70, FZ - 20), eye: 3, bounds: [-24, 24, LZ - LEN / 2 + 1, FZ + 96], style: 'gilt' };
  },
};

/* ---------------- 50 WALL STREET ---------------- */
export const wallstreet: RoomDef = {
  id: 'wallstreet',
  name: 'The canyon',
  area: 'WALL STREET',
  mood: 'Opening bell',
  color: '#9aa8b8',
  description: 'The narrow canyon at Broad Street, the Doric steps of Federal Hall, the exchange front with its columns and the giant banner, the crowd at the bell, the works in the canyon.',
  signatures: 'The stone canyon of Wall and Broad, the Greek Revival Federal Hall with its eighteen steps and statue plinth, the six fluted columns and pediment of the exchange facing Broad Street with a banner on them, 23 Wall Street on the corner, the flags, the crowds, the cobbles.',
  build(k, ctx) {
    k.sky({ top: 0x5f8fc8, horizon: 0xe4e6e2, ground: 0x4a4a48, fog: 0.0022, sun: { az: 2.6, el: 0.65, color: 0xfff4e6, size: 12 }, env: 0.9 });
    k.hemi(0xe8f0ff, 0x3a3a38, 0.8);
    k.sun(0xfff0dc, 2.0, 30, 70, 20, true, 80);
    /* THE BIG UPGRADE 3b: the canyon in scanned limestone, granite, Belgian block and pavement, real street lamps,
       concrete security barriers and bins on Broad Street, the flag over the exchange in the wind, a ticker running
       round the corner, and the trick: WALL ST painted on Broad Street that stands up from one spot. */
    const R = 'wallstreet';
    const lime = scan(k, R, 'white_sandstone_blocks_02', 5.2, () => X.ashlar(0xc8c0ac, 107, 3), { color: 0xfff6ea }, 0xc8c0ac),
      granite = scan(k, R, 'granite_tile', 1.6, () => X.ashlar(0x8a8480, 108, 2), { color: 0xd8d4d0 }, 0x8a8480),
      facade = k.pbr('wsFacade', X.windows(109, 0.3, 0x8a8478, false), 0.12, { emissive: 0xffffff, emissiveIntensity: 0.5, roughness: 0.6, stretch: 0.42 }),
      cobble = scan(k, R, 'square_cobblestone', 2.2, () => X.cobble(0x6f6c68, 56), { color: 0xe6e0d8 }, 0x6a6862),
      bronze = k.flat(0x4a3a22, 0.8, 0.4),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      navy = k.flat(0x1d2f5c, 0.1, 0.7),
      redF = k.flat(0xb8202a, 0.1, 0.7),
      white = k.flat(0xf4f0e8, 0, 0.8);
    // the canyon: Wall Street running along x, Broad Street opening south, tall walls of stone and glass
    k.box(200, 0.4, 16, 0, -0.2, 0, cobble);
    k.box(18, 0.4, 100, 0, -0.2, 50, cobble);
    for (const s of [-1, 1]) k.box(200, 0.3, 3.4, 0, 0.05, s * 9.7, scan(k, R, 'concrete_pavement', 1.8, () => X.pavers(0x9a9a94, 57), { color: 0xd8d2c8 }, 0x8c8a84));
    for (const s of [-1, 1]) k.box(200, 0.32, 0.3, 0, 0.06, s * 8.1, granite);
    for (let x = -90; x <= 90; x += 24) { if (Math.abs(x) < 20) continue; k.box(22, 60 + (Math.abs(x) % 48), 30, x, 30 + (Math.abs(x) % 48) / 2, -26, facade); k.box(22, 50, 30, x, 25, 26, facade); }
    for (const x of [-60, 60]) k.block(x - 11, x + 11, -41, -11), k.block(x - 11, x + 11, 11, 41);
    k.block(-100, 100, -12, -11); k.block(-100, -9, 11, 12); k.block(9, 100, 11, 12);
    k.skyline({ z: -140, count: 30, spacing: 9, scale: 4.6, base: -1, seed: 114, lit: 0.25, glow: 0.6, tint: 0x5a6270, rows: 1 });
    k.box(70, 70, 6, 0, 35, 106, facade);   // Broad Street ran out into white sky; a tower closes the view south
    // Federal Hall: the Doric front up a broad flight of steps on the north side, the plinth
    const HX = -16, HZ = -12;
    k.box(30, 22, 26, HX, 11, HZ - 13, lime);
    k.box(30, 1.6, 26, HX, 22.8, HZ - 13, lime);
    for (let i = 0; i < 18; i++) k.box(26, 0.233, 0.8, HX, 0.117 + i * 0.233, HZ + 4.2 - i * 0.367, granite);   // 18 granite steps up to the portico
    k.box(30, 4.2, 6, HX, 6.2, HZ - 2.5, lime);
    for (let i = 0; i < 8; i++) k.column(HX - 12 + i * 3.4, 4.2, HZ - 1.5, 12.4, 0.9, lime, true);
    k.box(30, 1.8, 6, HX, 17.5, HZ - 1.5, lime);
    k.mesh(new T.CylinderGeometry(0.1, 20, 6, 3), lime, HX, 18.4 + 3, HZ - 1.5).rotation.set(0, 0, 0);
    const ped = new T.Shape(); ped.moveTo(-15, 0); ped.lineTo(15, 0); ped.lineTo(0, 6); ped.closePath();
    k.mesh(new T.ExtrudeGeometry(ped, { depth: 6, bevelEnabled: false }), lime, HX, 18.4, HZ - 4.5);
    k.box(3, 4.6, 3, HX, 6.2 + 2.3 + 2.1, HZ + 0.5, granite);
    k.box(3.4, 0.5, 3.4, HX, 6.2 + 4.2, HZ + 0.5, granite);
    k.keepOut.push({ x: HX, z: HZ + 0.5, r: 2.2 });
    k.block(HX - 15, HX + 15, HZ - 26, HZ - 3);
    k.sign('FEDERAL HALL  ·  1842', 10, 0.8, HX, 16.8, HZ + 1.6, 'transparent', '#5a5040', 80, 0);
    // the exchange at 18 Broad Street: its six column front faces EAST onto Broad Street (it faced Wall Street here), raised on a podium, the banner hung on the colonnade
    const EX = -28, EZ = 29, EF = -12;   // body centre x, centre of the Broad Street front along z, the face line
    k.box(26, 30, 34, EX - 1, 15, EZ, lime);
    k.box(30, 2, 38, EX, 31, EZ, lime);
    k.box(4, 4.5, 34, EF - 2, 2.25, EZ, granite);
    for (let i = 0; i < 6; i++) k.column(EF - 2, 4.5, EZ - 12 + i * 4.8, 16, 1.0, lime, true);
    for (const dz of [-16, 16]) k.box(4, 16, 2, EF - 2, 12.5, EZ + dz, lime);
    k.box(4, 2.6, 34, EF - 2, 21.8, EZ, lime);
    const ped2 = new T.Shape(); ped2.moveTo(-17, 0); ped2.lineTo(17, 0); ped2.lineTo(0, 6); ped2.closePath();
    k.mesh(new T.ExtrudeGeometry(ped2, { depth: 5, bevelEnabled: false }), lime, EF - 4.5, 23.1, EZ).rotation.y = PI / 2;
    k.block(EX - 14.5, EF + 0.2, EZ - 17.5, EZ + 17.5);
    k.censusWall({ x: EF + 0.3, y: 12.6, z: EZ, rotY: PI / 2, cols: 22, rows: 10, tile: 0.55, gap: 0.05, start: ctx.wallStart(5000, 220), pieces: ctx.all, backing: navy });
    void redF; void white;
    /* the flag: stars and stripes painted on a canvas, on a pole off the attic, rippling */
    const flagT = canvasTex('ws-flag', 512, 270, (g, W, H) => {
      for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? '#f4f0e8' : '#b3192b'; g.fillRect(0, (i * H) / 13, W, H / 13 + 1); }
      g.fillStyle = '#1d2f5c'; g.fillRect(0, 0, W * 0.4, (H * 7) / 13);
      g.fillStyle = '#f4f0e8';
      for (let r = 0; r < 9; r++) for (let c = 0; c < (r % 2 ? 5 : 6); c++) { const x = W * 0.4 * ((c + (r % 2 ? 1 : 0.5)) / 6.1), y = ((H * 7) / 13) * ((r + 0.7) / 10); g.beginPath(); for (let a = 0; a < 10; a++) { const rad = a % 2 ? 2.6 : 6.4, an = -PI / 2 + (a / 10) * PI * 2; g.lineTo(x + Math.cos(an) * rad, y + Math.sin(an) * rad); } g.fill(); }
    }, false);
    const flagG = new T.PlaneGeometry(9, 4.7, 40, 6), fp = flagG.attributes.position as T.BufferAttribute, fx0 = Float32Array.from({ length: fp.count }, (_, i) => fp.getX(i));
    flagG.translate(4.5, 0, 0);
    const flag = k.mesh(flagG, flagT ? new T.MeshStandardMaterial({ map: flagT, roughness: 0.85, side: T.DoubleSide }) : navy, EF + 0.6, 30.2, EZ, true);
    flag.rotation.y = -PI / 2;
    k.beam(v(EF + 0.6, 24.5, EZ), v(EF + 0.6, 33.2, EZ), 0.1, k.flat(0xd8d0c0, 0.6, 0.4), 6);
    k.sphere(0.22, EF + 0.6, 33.3, EZ, k.flat(0xc9a552, 0.9, 0.3), 10);
    const waveFlag = (t: number) => { for (let i = 0; i < fp.count; i++) { const u = (fx0[i] + 4.5) / 9; fp.setZ(i, u * 0.7 * Math.sin(u * 7 - t * 3.2) + u * 0.2 * Math.sin(fp.getY(i) * 1.3 + t * 2)); } fp.needsUpdate = true; flagG.computeVertexNormals(); };
    waveFlag(0);
    if (!ctx.reduced) k.ticks.push((t) => waveFlag(t));
    // 23 Wall Street, the House of Morgan, four storeys on the south east corner of Wall and Broad
    const morganHouse = k.box(24, 26, 26, 21, 13, 25, lime);
    k.block(9, 33, 12, 38);
    // eggs
    k.egg(v(9.3, 3.2, 15), { id: 'wallstreet-bombing', title: 'The divots at the corner', year: '1920', text: 'At 12:01 on 16 September 1920 a horse drawn wagon packed with about 100 pounds of dynamite and 500 pounds of iron sash weights blew up across from 23 Wall Street, killing 38 people. It was never solved, and shrapnel divots are still in the stone.', clue: 'Run your eye over the stone of the low corner building across Broad Street.', source: { name: 'Wall Street bombing, Wikipedia', url: 'https://en.wikipedia.org/wiki/Wall_Street_bombing' } }, { r: 1.6 });
    k.egg(v(32, 8, 11.7), { id: 'wallstreet-noname', title: 'No name needed', year: '1914', text: 'The House of Morgan at 23 Wall Street opened in 1914, four storeys and about 85 feet tall on the south east corner of Wall and Broad. No name plaque was ever put over its door; the bank was too well known to need one.', clue: 'Look above the door of the corner building for a name that is not there.', source: { name: '23 Wall Street, Wikipedia', url: 'https://en.wikipedia.org/wiki/23_Wall_Street' } }, { r: 1.6 });
    k.egg(v(EF - 2, 25, EZ), { id: 'wallstreet-pediment', title: 'Integrity, in sheet metal', year: '1936', text: 'The pediment over the six columns of the exchange was designed by John Quincy Adams Ward and Paul Wayland Bartlett, with a female figure of integrity at its centre. The marble figures were replaced in 1936 with lead coated sheet metal carvings.', clue: 'Look up into the pediment over the exchange columns.', source: { name: 'New York Stock Exchange Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/New_York_Stock_Exchange_Building' } }, { r: 2.4 });
    k.egg(v(EF + 0.6, 3, EZ - 14), { id: 'wallstreet-floor', title: 'Behind the columns', year: '1903', text: 'George B. Post\'s exchange at 18 Broad Street was finished in 1903. Behind the colonnade the main trading floor covers 15,000 square feet under a 30 by 30 foot skylight.', clue: 'Walk down Broad Street to the foot of the exchange.', source: { name: 'New York Stock Exchange Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/New_York_Stock_Exchange_Building' } }, { r: 1.6 });
    k.egg(v(HX, 10.6, HZ + 0.5), { id: 'wallstreet-wrongbuilding', title: 'Not the balcony', year: '1789', text: 'Washington took the oath on 30 April 1789 on the balcony of the original Federal Hall, demolished in 1812, not this building. Inside the rotunda a stone slab marks where he once stood, and a piece of the original balcony railing and floor is on display.', clue: 'Climb the steps to the empty plinth.', source: { name: 'Federal Hall, Wikipedia', url: 'https://en.wikipedia.org/wiki/Federal_Hall' } }, { r: 1.6 });
    k.egg(v(HX + 8, 1.4, HZ + 3.4), { id: 'wallstreet-customhouse', title: 'Built for the customs', year: '1842', text: 'The building opened in 1842 as the Custom House for the Port of New York, designed by Town and Davis in Tuckahoe marble from Westchester. Eighteen granite steps lead up to a rotunda 60 feet across, and a 1994 guide called it the Parthenon of public buildings in the city.', clue: 'Count the steps up to the portico.', source: { name: 'Federal Hall, Wikipedia', url: 'https://en.wikipedia.org/wiki/Federal_Hall' } }, { r: 1.6 });
    k.egg(v(0, 0.4, 3), { id: 'wallstreet-anamorph', title: 'Paint that stands up', year: '1533', text: 'WALL ST is painted flat on the paving of Broad Street and stretched away from you, so that from the middle of the crossing it stands up as a sign. Step to either side and it smears back into street paint. The trick is anamorphosis, the one that hides a skull across the floor of Hans Holbein\'s The Ambassadors of 1533.', clue: 'Stand in the middle of Wall and Broad and look south down Broad Street.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.6 });
    // the crowd at the bell, the barriers, the works
    k.crowd([v(-60, 0, -6), v(-30, 0, -5), v(0, 0, -6), v(30, 0, -5), v(60, 0, -6)], 40, { seed: 50, speed: 1.0, spread: 4, animate: !ctx.reduced });
    k.crowd([v(-6.5, 0, 44), v(-6, 0, 29), v(-6.5, 0, 15), v(-4, 0, 6), v(0, 0, 5), v(0, 0, 40)], 30, { seed: 51, speed: 0.6, spread: 3, animate: !ctx.reduced });
    for (let i = 0; i < 8; i++) { k.box(0.06, 1.0, 2.2, -9.6, 0.55, EZ - 10.5 + i * 3, dark); for (const dz of [-1.05, 1.05]) k.box(0.06, 1.05, 0.06, -9.6, 0.52, EZ - 10.5 + i * 3 + dz, dark); }
    k.prop('mailbox', 30, 0, -8.6, { height: 1.5 });
    k.prop('hydrant', -50, 0, 8.6, { height: 1.1 });
    glbs(k, 'wallstreet/ph_street_lamp_01', { height: 5.2 }, [-70, -40, 40, 70].flatMap((x) => [[x, 0.2, -8.6, 0], [x, 0.2, 8.6, PI]] as [number, number, number, number][]));
    for (const x of [-70, -40, 40, 70]) for (const s of [-1, 1]) k.point(x, 4.8, s * 8.2, 0xffe6c8, 14, 14);
    /* Broad Street is closed to cars: concrete security barriers across it, bins at the corners */
    glbs(k, 'wallstreet/ph_concrete_road_barrier', { width: 1.9 }, [[-6.4, 0, 9.4, 0], [-3.2, 0, 9.4, 0], [3.2, 0, 9.4, 0], [6.4, 0, 9.4, 0], [-6.4, 0, 52, 0], [6.4, 0, 52, 0]]);
    for (const x of [-6.4, -3.2, 3.2, 6.4]) k.block(x - 1.0, x + 1.0, 9.0, 9.8);
    glbs(k, 'wallstreet/ph_metal_trash_can', { width: 1.5 }, [[10.5, 0.2, 9.6, 0], [-10.5, 0.2, -9.6, PI], [24, 0.2, -9.6, PI]]);
    /* a ticker on the north side of Wall Street: a lit band scrolling the room's own line */
    const tickT = canvasTex('ws-ticker', 2048, 64, (g, W, H) => {
      g.fillStyle = '#050608'; g.fillRect(0, 0, W, H);
      g.font = '700 40px "JetBrains Mono", monospace'; g.textBaseline = 'middle';
      const words = ['THE NEW YORKERS', 'OPENING BELL 9:30', 'WALL AND BROAD', 'THE CANYON', 'CENSUS ON VIEW', 'FEDERAL HALL 1842', 'NYSE 1903', 'BY MLOW'];
      let x = 20; for (let i = 0; i < 16; i++) { const w = words[i % words.length]; g.fillStyle = i % 3 === 0 ? '#ffb43a' : i % 3 === 1 ? '#5ae08a' : '#f2f0ea'; g.fillText(w, x, H / 2); x += g.measureText(w).width + 60; g.fillStyle = '#5a5a5a'; g.fillText('·', x - 38, H / 2); }
    });
    if (tickT) {
      tickT.repeat.set(1, 1);
      const tick = k.mesh(new T.PlaneGeometry(22, 0.7), new T.MeshBasicMaterial({ map: tickT, toneMapped: false }), 26, 7.4, -10.84, true);
      k.box(22.4, 0.9, 0.2, 26, 7.4, -10.98, dark);
      void tick;
      if (!ctx.reduced) k.ticks.push((t) => { tickT.offset.x = (t * 0.035) % 1; });
    }
    /* THE TRICK: WALL ST painted flat on the Belgian block of Broad Street, stretched so it stands up as a sign only
       from the middle of the crossing, looking south toward the exchange */
    const ana = anamorph(k, 'WALL ST', 0, 0, 3, 0.01, 7, 9, 2.4, '#f2efe6', 160);
    ana.rotation.y = PI; ana.position.set(0, 0.012, 3);
    const mounts: Mount[] = [];
    for (let i = 0; i < 6; i++) { const x = 14 + i * 12; k.box(4.6, 3.4, 0.3, x, 3.2, -11.6, dark); mounts.push({ position: v(x, 3.4, -11.4), rotation: 0, target: v(x, 3, -2), width: 4.2, height: 2.5, style: 'steel', wash: false }); }
    for (let i = 0; i < 6; i++) { const x = 14 + i * 12; k.box(4.6, 3.4, 0.3, x, 3.2, 11.6, dark); mounts.push({ position: v(x, 3.4, 11.4), rotation: PI, target: v(x, 3, 2), width: 4.2, height: 2.5, style: 'steel', wash: false }); }
    for (let i = 0; i < 4; i++) { const z = 18 + i * 10; for (const s of [-1, 1]) { k.box(0.3, 3.4, 4.6, s * 8.6, 3.2, z, dark); mounts.push({ position: v(s * 8.4, 3.4, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 3, z), width: 4.2, height: 2.5, style: 'steel', wash: false }); } }
    for (let i = 0; i < 3; i++) { const x = HX - 9 + i * 9; mounts.push({ position: v(x, 9.4, HZ - 5.9), rotation: 0, target: v(x, 8, HZ + 6), width: 2.6, height: 3.4, style: 'gilt', wash: true }); }
    k.block(HX - 15, HX + 15, HZ - 6.5, HZ - 5.5);
    return { mounts, spawn: v(20, 3, 2), look: v(EF, 14, EZ), eye: 3, bounds: [-90, 90, -10, 60], style: 'steel', floorY: (x, z) => { if (Math.abs(x - HX) < 13 && z < HZ + 4.8 && z > HZ - 2.4) return Math.min(4.2, Math.max(0, (HZ + 4.8 - z) / 6.6 * 4.2)); if (Math.abs(x - HX) < 15 && z <= HZ - 2.4 && z > HZ - 5.5) return 4.2; return 0; } };
  },
};

/* ---------------- 51 LINCOLN CENTER ---------------- */
export const lincolncenter: RoomDef = {
  id: 'lincolncenter',
  name: 'The plaza at eight',
  area: 'LINCOLN CENTER',
  mood: 'Curtain in ten minutes',
  color: '#e8d8a8',
  description: 'The travertine plaza around the fountain, the opera house arches with the works hung where the murals are, the crystal chandeliers rising, the crowd in evening clothes.',
  signatures: 'The travertine plaza with the round fountain at its centre, the five soaring arches of the opera house glowing through glass, the two great murals in the lobby, the starburst chandeliers, the flanking theaters with their colonnades.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x1a2446, horizon: 0x6a5a70, ground: 0x14141a, fog: 0.0026, stars: 260, env: 0.7 });
    k.hemi(0xffe4c8, 0x1a1418, 0.5);
    k.sun(0xc8d0ff, 0.5, -40, 60, 40, true, 90);
    /* THE BIG UPGRADE 3b: the opera house was a solid block with its lobby sealed inside; it is hollow now, so the red
       stair, the gold ceiling and nine starburst chandeliers glow through the five arches. Scanned travertine walls and
       paving in rings round a rebuilt fountain of 73 dancing jets, benches (a real model), and in the middle arch the
       trick: a Pepper's ghost dancer who is only there from the fountain's axis. */
    const R = 'lincolncenter';
    const trav = scan(k, R, 'white_sandstone_blocks_02', 6, () => X.ashlar(0xe0d6c0, 110, 4), { roughness: 0.55, color: 0xfff4e2 }, 0xd8cebc),
      travD = scan(k, R, 'white_sandstone_blocks_02', 4.4, () => X.ashlar(0xc8bea8, 111, 3), { color: 0xe8dcc6 }, 0xc8bea8),
      paving = scan(k, R, 'large_floor_tiles_02', 2.2, () => X.ashlar(0xe0d6c0, 110, 4), { roughness: 0.45, color: 0xfff2dc }, 0xd8cebc),
      granite = scan(k, R, 'granite_tile_02', 1.4, () => X.ashlar(0x3a3a3e, 112, 3), { roughness: 0.3, color: 0x8a8a90 }, 0x3a3a3e),
      glass = k.glass(0xffe6c0, 0.18, 0.05),
      gold = k.pbr('lcGold', X.gilt(0xd8b060), 2, { metalness: 0.85, roughness: 0.3 }),
      red = k.pbr('lcCarpet', X.carpet(0x8a1a22, 0xc79a4a), 0.5),
      dark = k.flat(0x14141a, 0.5, 0.6),
      waterM = k.flat(0x88aacc, 0.3, 0.2, { transparent: true, opacity: 0.6 }),
      crystal = k.glow(0xfff4d8);
    void crystal;
    // the plaza: a travertine field with the fountain, the three houses around it, the steps down to Columbus Avenue
    k.box(120, 0.4, 100, 0, -0.2, -10, paving);
    for (const [r0, r1] of [[6.3, 7.3], [11, 11.4], [16, 16.4], [21, 21.4]]) { const ring = k.mesh(new T.RingGeometry(r0, r1, 96), granite, 0, 0.012, 0); ring.rotation.x = -PI / 2; }
    for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; const sp = k.box(0.3, 0.02, 14, Math.cos(a) * 14.3, 0.011, Math.sin(a) * 14.3, granite); sp.rotation.y = -a + PI / 2; }
    glbs(k, 'lincolncenter/bench', { width: 2.6 }, [0.35, 0.65, 1.35, 1.65].map((f) => { const a = f * PI; return [Math.cos(a) * 9.2, 0, Math.sin(a) * 9.2, -a - PI / 2] as [number, number, number, number]; }));
    for (let i = 0; i < 6; i++) k.box(60, 0.3, 1.4, 0, -0.35 - i * 0.3, 40 + i * 1.4, travD);
    street(k, { w: 24, len: 140, z: 62, x: 0 });
    blockFront(k, { x: 12, z0: 130, count: 8, face: -1, seed: 112, h: [16, 30] });
    blockFront(k, { x: -12, z0: 130, count: 8, face: 1, seed: 113, h: [16, 30] });
    k.skyline({ z: -160, count: 26, spacing: 10, scale: 3.6, base: -1, seed: 115, lit: 0.45, glow: 1.2, tint: 0x2c3444, rows: 1 });
    // Revson Fountain: 38 ft (11.6 m) across, its jets in three concentric rings
    const basin = k.mesh(new T.CylinderGeometry(5.8, 6.1, 0.9, 64), granite, 0, 0.45, 0);
    k.mesh(new T.TorusGeometry(5.95, 0.22, 8, 96), trav, 0, 0.92, 0).rotation.x = PI / 2;
    k.mesh(new T.CylinderGeometry(5.6, 5.6, 0.3, 64), waterM, 0, 0.8, 0);
    k.keepOut.push({ x: 0, z: 0, r: 6.4 });
    /* 73 jets in three rings and a centre plume, one instanced draw, rising and falling in waves round the rings */
    const jetG = new T.CylinderGeometry(0.035, 0.09, 1, 6, 1, true).translate(0, 0.5, 0);
    const jetM = new T.MeshBasicMaterial({ color: 0xdcecff, transparent: true, opacity: 0.3, depthWrite: false, blending: T.AdditiveBlending });
    const jetAt: [number, number, number][] = [];
    for (const [n, r] of [[16, 1.3], [24, 2.7], [32, 4.2]]) for (let i = 0; i < n; i++) { const a = (i / n) * PI * 2; jetAt.push([Math.cos(a) * r, Math.sin(a) * r, a]); }
    jetAt.push([0, 0, 0]);
    const jets = new T.InstancedMesh(jetG, jetM, jetAt.length); jets.frustumCulled = false;
    const jm = new T.Matrix4(), jq = new T.Quaternion();
    const playJets = (t: number) => {
      jetAt.forEach(([x, z, a], i) => {
        const ring = i < 16 ? 0 : i < 40 ? 1 : i < 72 ? 2 : 3;
        const h = ring === 3 ? 6 + 5 * (0.5 + 0.5 * Math.sin(t * 0.7)) : (2.2 + ring * 0.8) * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.3 - a * 2 + ring * 1.7)));
        jets.setMatrixAt(i, jm.compose(v(x, 0.9, z), jq, v(1, h, 1)));
      });
      jets.instanceMatrix.needsUpdate = true;
    };
    playJets(1.2);
    k.add(jets);
    if (!ctx.reduced) k.ticks.push((t) => playJets(t));
    for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; k.point(Math.cos(a) * 5, 1.6, Math.sin(a) * 5, 0xffe8c8, 6, 6); }
    // the opera house: five glass arches in a travertine frame, the lobby behind with the red stair and the two murals
    const OZ = -40, OW = 60, OH = 28;
    k.box(OW + 10, OH + 4, 1, 0, (OH + 4) / 2, OZ - 30.6, travD);
    for (const s of [-1, 1]) { k.box(1, OH + 4, 31, s * (OW / 2 + 4.5), (OH + 4) / 2, OZ - 15, travD); k.box(5.2, OH + 4, 1.2, s * (OW / 2 + 2.45), (OH + 4) / 2, OZ + 0.2, trav); }
    k.box(OW + 10, 6.2, 1.2, 0, OH + 1, OZ + 0.2, trav);
    k.box(OW + 8, 0.8, 31, 0, OH + 3.4, OZ - 15, gold);
    for (let i = 0; i < 6; i++) k.box(OW + 6, 0.6, 0.5, 0, OH + 2.8, OZ - 3 - i * 5, gold);
    for (const x of [-18, -6, 6, 18]) k.box(0.8, OH - 2, 1.2, x, (OH - 2) / 2, OZ + 0.2, trav);
    k.point(0, OH - 4, OZ - 18, 0xffe0b0, 120, 50);
    for (const s of [-1, 1]) k.point(s * 22, 10, OZ - 18, 0xffd8a8, 50, 30);
    k.box(OW + 10, 2, 44, 0, OH + 5, OZ - 20, trav);
    for (let i = 0; i < 5; i++) { const x = -24 + i * 12; k.arch(10, OH - 2, 3, x, 0, OZ + 0.4, trav, false, 0.9); k.mesh(new T.PlaneGeometry(9.6, OH - 4), glass, x, (OH - 4) / 2, OZ + 0.6); }
    for (let i = 0; i < 6; i++) k.column(-30 + i * 12, 0, OZ + 1.6, OH - 1, 0.9, trav, false);
    k.block(-OW / 2 - 5, -3, OZ - 0.6, OZ + 1.0); k.block(3, OW / 2 + 5, OZ - 0.6, OZ + 1.0);
    k.box(OW - 2, 0.3, 30, 0, 0.15, OZ - 15, red);
    for (let i = 0; i < 14; i++) k.box(16, 0.3, 1.4, 0, 0.15 + i * 0.3, OZ - 8 - i * 1.4, red);
    for (const s of [-1, 1]) { k.box(0.6, 16, 30, s * 8.4, 8, OZ - 22, trav); k.box(0.8, 0.5, 30, s * 8.4, 16.2, OZ - 22, gold); }   // the two mural walls, tall enough now to carry the works hung on them
    k.box(OW - 2, 0.6, 30, 0, OH - 2, OZ - 15, dark);
    /* Lobmeyr's starbursts: crystal tipped rods on a sphere of directions, nine of them, rising before curtain */
    const rays: T.Vector3[] = [];
    { const rr = rnd(1966); for (let i = 0; i < 56; i++) { const y = 1 - (2 * (i + 0.5)) / 56, r = Math.sqrt(1 - y * y), th = i * 2.39996; rays.push(v(Math.cos(th) * r, y, Math.sin(th) * r).multiplyScalar(1.1 + rr() * 1.3)); } }
    const rodG = new T.CylinderGeometry(0.018, 0.018, 1, 4).translate(0, 0.5, 0), tipG = new T.IcosahedronGeometry(0.09, 0);
    /* marked transparent so the kit does not cast their shadows: 1,000 crystals in the shadow pass cost more than they show */
    const rodM = new T.MeshStandardMaterial({ color: 0xd8b878, metalness: 0.9, roughness: 0.25, transparent: true }), tipM = new T.MeshBasicMaterial({ color: 0xfff6dc, transparent: true });
    const chandAt: [number, number, number][] = [[-24, 17, OZ - 6], [-12, 17, OZ - 6], [0, 17, OZ - 6], [12, 17, OZ - 6], [24, 17, OZ - 6], [-18, 21, OZ - 16], [-6, 21, OZ - 16], [6, 21, OZ - 16], [18, 21, OZ - 16]];
    const chand: T.Group[] = [];
    const up = new T.Vector3(0, 1, 0), m4 = new T.Matrix4(), qq = new T.Quaternion();
    for (const [x, y, z] of chandAt) {
      const g = new T.Group(), rods = new T.InstancedMesh(rodG, rodM, rays.length), tips = new T.InstancedMesh(tipG, tipM, rays.length);
      rays.forEach((d, i) => { qq.setFromUnitVectors(up, d.clone().normalize()); rods.setMatrixAt(i, m4.compose(v(0, 0, 0), qq, v(1, d.length(), 1))); tips.setMatrixAt(i, m4.makeTranslation(d.x, d.y, d.z)); });
      g.add(rods, tips, new T.Mesh(new T.SphereGeometry(0.35, 12, 8), tipM));
      g.position.set(x, y, z); g.userData.y0 = y;
      k.add(g); chand.push(g);
      k.beam(v(x, y + 1, z), v(x, OH + 3, z), 0.02, gold, 3);
    }
    if (!ctx.reduced) k.ticks.push((t) => { const rise = Math.max(0, Math.sin(t * 0.25)) * 3; chand.forEach((g) => { g.position.y = g.userData.y0 + rise; g.rotation.y = t * 0.05; }); });
    /* THE TRICK: Pepper's ghost. A dancer turns in the middle arch, but only from the fountain's axis; walk off it and
       the reflection that makes her is lost, so she fades away */
    const ghostT = canvasTex('lc-ghost', 256, 384, (g, W, H) => {
      const glow = g.createRadialGradient(W / 2, H * 0.45, 10, W / 2, H * 0.45, W * 0.6); glow.addColorStop(0, 'rgba(200,220,255,0.35)'); glow.addColorStop(1, 'rgba(200,220,255,0)');
      g.fillStyle = glow; g.fillRect(0, 0, W, H);
      g.fillStyle = '#eef4ff'; g.strokeStyle = '#eef4ff'; g.lineCap = 'round';
      g.beginPath(); g.arc(W / 2, H * 0.16, 14, 0, PI * 2); g.fill();
      g.lineWidth = 16; g.beginPath(); g.moveTo(W / 2, H * 0.21); g.lineTo(W / 2, H * 0.44); g.stroke();
      g.lineWidth = 7; g.beginPath(); g.moveTo(W / 2, H * 0.25); g.quadraticCurveTo(W * 0.28, H * 0.12, W * 0.36, H * 0.05); g.moveTo(W / 2, H * 0.25); g.quadraticCurveTo(W * 0.72, H * 0.12, W * 0.64, H * 0.05); g.stroke();
      g.beginPath(); g.ellipse(W / 2, H * 0.46, W * 0.3, H * 0.045, 0, 0, PI * 2); g.fill();
      g.lineWidth = 9; g.beginPath(); g.moveTo(W / 2 - 4, H * 0.48); g.lineTo(W / 2 - 2, H * 0.95); g.moveTo(W / 2 + 4, H * 0.48); g.lineTo(W * 0.82, H * 0.36); g.stroke();
    }, false);
    if (ghostT) {
      const gm = new T.MeshBasicMaterial({ map: ghostT, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
      const ghost = k.mesh(new T.PlaneGeometry(3.2, 4.8), gm, 0, 2.6, OZ - 1.6, true);
      const gp = new T.Vector3(0, 2.6, OZ - 1.6), d = new T.Vector3();
      k.ticks.push((t) => {
        const cam = (window as unknown as { __museum?: { camera?: T.Camera } }).__museum?.camera;
        if (!cam) return;
        d.copy(cam.position).sub(gp).normalize();
        gm.opacity = 0.9 * Math.min(1, Math.max(0, (d.z - 0.985) / 0.012));
        ghost.scale.x = ctx.reduced ? 1 : Math.cos(t * 1.6);
      });
    }
    for (const x of [-14, 14]) k.point(x, OH - 8, OZ - 10, 0xfff0d8, 90, 40);
    for (let i = 0; i < 5; i++) k.point(-24 + i * 12, 10, OZ - 4, 0xffe6c0, 40, 26);
    // the two flanking houses: colonnades of thin travertine fins with glass behind
    for (const s of [-1, 1]) { const HX = s * 52; k.box(40, 22, 60, HX, 11, -10, travD); for (let i = 0; i < 14; i++) k.box(0.8, 20, 1.2, HX - s * 20.5, 10, -36 + i * 4, trav); k.box(0.3, 20, 56, HX - s * 20.2, 10, -10, glass); k.block(HX - s * 21.5, HX + s * 20, -40, 20); for (let i = 0; i < 6; i++) k.point(HX - s * 19, 4, -32 + i * 9, 0xffe6c8, 16, 12); }
    // people, the works
    k.crowd([v(0, 0, 44), v(-6, 0, 20), v(-12, 0, 4), v(-8, 0, -14), v(0, 0, -30), v(-12, 0, -39.5)], 44, { seed: 52, speed: 0.8, spread: 5, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0x3a1a2a, 0x8a3a3a, 0xd8d0c0, 0x1a2a4a, 0xc9a25a] });
    k.crowd([v(12, 0, 30), v(16, 0, 8), v(12, 0, -14), v(4, 0, -30), v(12, 0, -39.5)], 30, { seed: 53, speed: 0.7, spread: 5, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a, 0x33477f] });
    k.censusWall({ x: 0, y: 6.2, z: OZ - 29.6, rotY: 0, cols: 30, rows: 5, tile: 0.55, gap: 0.05, start: ctx.wallStart(1800, 150), pieces: ctx.all, backing: gold });
    k.sign('THE MUSEUM  ·  OPENING NIGHT  ·  THE NEW YORKERS', 16, 0.8, 0, 10.4, OZ - 29.6, 'transparent', '#f4e4b0', 70, 0);
    k.egg(v(0, 3.2, OZ - 1.6), { id: 'lincolncenter-ghost', title: 'The dancer who is not there', year: '1862', text: 'The dancer in the middle arch is a Pepper\'s ghost: in the theatre trick a lit figure hidden out of sight is reflected in a sheet of angled glass, so she seems to stand on the stage, and only from the seats the glass was set for. John Henry Pepper showed it at the Royal Polytechnic in London in 1862.', clue: 'Stand on the line from the fountain to the middle arch, then step off it.', source: { name: 'Pepper\'s ghost, Wikipedia', url: 'https://en.wikipedia.org/wiki/Pepper%27s_ghost' } }, { r: 2 });
    // eggs
    k.egg(basin, { id: 'lincolncenter-fountain', title: 'Three rings of jets', year: '2009', text: 'Philip Johnson\'s fountain was dedicated in 1964, 38 feet across. WET rebuilt it for 2009 with 353 jets in three concentric rings, 272 lights and 24 pumps that can throw water 60 feet up. It plays a part in The Producers and Moonstruck.', clue: 'Walk to the rim of the fountain in the middle of the plaza.', source: { name: 'Revson Fountain, Wikipedia', url: 'https://en.wikipedia.org/wiki/Revson_Fountain' } }, { r: 2.4 });
    k.egg(v(-7.6, 2.2, OZ - 27.5), { id: 'lincolncenter-chagall', title: 'Murals as collateral', text: 'Marc Chagall\'s two lobby murals are each about 30 by 36 feet: The Triumph of Music on the south wall and The Sources of Music on the north. In 2009 the Met\'s board decided to put them up as collateral for a long term loan.', clue: 'Look at the great walls either side of the lobby.', source: { name: 'Metropolitan Opera House (Lincoln Center), Wikipedia', url: 'https://en.wikipedia.org/wiki/Metropolitan_Opera_House_(Lincoln_Center)' } }, { r: 2 });
    k.egg(v(14, OH - 6, OZ - 10), { id: 'lincolncenter-chandeliers', title: 'A thank you from Vienna', text: 'The crystal chandeliers, eleven in the lobby and 21 in the auditorium, were designed by Hans Harald Rath of Lobmeyr in Vienna and given by Austria in thanks for American help under the Marshall Plan. Twelve of the auditorium ones are winched up to the ceiling before each performance.', clue: 'Watch the starburst chandeliers behind the glass.', source: { name: 'Metropolitan Opera House (Lincoln Center), Wikipedia', url: 'https://en.wikipedia.org/wiki/Metropolitan_Opera_House_(Lincoln_Center)' } }, { r: 2.4 });
    k.egg(v(0, 12, OZ + 0.8), { id: 'lincolncenter-arches', title: 'Five arches, ninety six feet', year: '1966', text: 'Wallace Harrison\'s opera house opened on 16 September 1966. Its east front of white travertine is five concrete arches rising 96 feet above the plaza. Inside, over 4,000 square feet of gold leaf covers the petal shaped ceiling above roughly 3,800 seats.', clue: 'Stand in front of the middle arch and look up.', source: { name: 'Metropolitan Opera House (Lincoln Center), Wikipedia', url: 'https://en.wikipedia.org/wiki/Metropolitan_Opera_House_(Lincoln_Center)' } }, { r: 2.4 });
    k.egg(v(-31.6, 6, -6), { id: 'lincolncenter-statetheater', title: 'Built for the World\'s Fair', year: '1964', text: 'The theatre on the south side of the plaza opened on 23 April 1964 as the New York State Theater, paid for by the state as part of its showing at the 1964 to 1965 World\'s Fair. Philip Johnson and John Burgee designed it. It took David H. Koch\'s name in 2008 after a $100 million pledge.', clue: 'Look at the colonnade on the left as you face the opera house.', source: { name: 'David H. Koch Theater, Wikipedia', url: 'https://en.wikipedia.org/wiki/David_H._Koch_Theater' } }, { r: 2 });
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) mounts.push({ position: v(s * 8.05, 9, OZ - 16), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 8, OZ - 16), width: 20, height: 11, style: 'none', wash: true });
    for (let i = 0; i < 5; i++) { const x = -24 + i * 12; mounts.push({ position: v(x, 4.4, OZ - 29.6), rotation: 0, target: v(x, 3, OZ - 14), width: 5, height: 3, style: 'gilt', wash: true }); }
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const z = -34 + i * 8; mounts.push({ position: v(s * 31.4, 3.6, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 20, 3, z), width: 3.2, height: 3.8, style: 'white', wash: true }); }
    for (let i = 0; i < 4; i++) { const a = PI * 0.25 + (i / 3) * PI * 0.5; const x = Math.cos(a) * 16, z = Math.sin(a) * 16; k.box(0.3, 3, 4, x, 1.8, z, travD).rotation.y = -a + PI / 2; mounts.push({ position: v(x + Math.cos(a) * 0.2, 2.0, z + Math.sin(a) * 0.2), rotation: -a + PI / 2, target: v(Math.cos(a) * 26, 2.5, Math.sin(a) * 26), width: 3.6, height: 2.1, style: 'white', wash: false }); }
    return { mounts, spawn: v(0, 3, 44), look: v(0, 14, OZ), eye: 3, bounds: [-31, 31, OZ - 28, 52], style: 'white', floorY: (x, z) => { void x; if (z < OZ - 8) return Math.min(4.2, Math.max(0, (OZ - 8 - z) / 19.6 * 4.2)); return 0; } };
  },
};
