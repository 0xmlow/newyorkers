/* Rooms 01 to 06: Bowery, Subway, Met roof, Brooklyn waterfront, Times Square, Ferry. */
import * as T from 'three';
import * as X from '../textures';
import { v, loadThumb } from '../kit';
import type { Kit } from '../kit';
import { corridorMounts } from './types';
import type { RoomDef, RoomCtx } from './types';
import { hero, hide, heroInstances } from './heroes';

const PI = Math.PI;

/* ---------- THE BIG UPGRADE, wave 1a (2026-11-23): helpers for rooms 01 to 06, used here and in b.ts ----------
   Scanned surfaces, real models instead of code built heroes, Firefly plates that drop in by file name, and the
   one optical illusion each room carries. Every helper is safe in node (the audits build rooms with no DOM): the
   scan falls back to the painted surface and the loaders simply never resolve there. */
const HAS_DOM = typeof window !== 'undefined' && typeof HTMLImageElement !== 'undefined';
const scanLoader = HAS_DOM ? new T.TextureLoader() : null;
const scanCache = new Map<string, X.Surface>(), scanReady = new Map<string, Promise<unknown>>();
/* A Poly Haven scan (CC0) from assets/museum/tex/<room>/<id>_{c,n,r}.webp as a kit material with world UVs at true
   size: `metres` is the real width of one tile of the photo. `paint` is the procedural stand in for node. */
export function scan(k: Kit, room: string, id: string, metres: number, paint: () => X.Surface, p: Partial<T.MeshStandardMaterialParameters> & { normal?: number } = {}, rot = 0) {
  if (!scanLoader) return k.pbr(`scan-${id}`, paint(), 1 / metres, p);
  const key = `${room}/${id}${rot ? '@' + rot : ''}`;
  let s = scanCache.get(key);
  if (!s) {
    const low = k.o.quality !== 'high';
    const waits: Promise<unknown>[] = [];
    const one = (suf: string, srgb: boolean) => {
      let done: () => void = () => {};
      waits.push(new Promise<void>((res) => (done = res)));
      const t = scanLoader.load(`assets/museum/tex/${room}/${id}_${suf}.webp`, () => done(), undefined, () => done());
      t.wrapS = t.wrapT = T.RepeatWrapping;
      t.anisotropy = 8;
      t.rotation = rot;
      if (srgb) t.colorSpace = T.SRGBColorSpace;
      return t as unknown as T.CanvasTexture;
    };
    s = { map: one('c', true), normalMap: one('n', false), roughnessMap: low ? undefined : one('r', false) };
    scanCache.set(key, s);
    const all = Promise.all(waits);
    scanReady.set(key, all);
    k.pending.push(all);
  }
  const m = k.pbr(`scan-${key}`, s, 1 / metres, p);
  /* an unloaded roughness map samples as 0, a mirror: the maps go on only once all three have arrived */
  if (!m.userData.scanWired) {
    m.userData.scanWired = true;
    const maps = { map: m.map, normalMap: m.normalMap, roughnessMap: m.roughnessMap };
    m.map = m.normalMap = m.roughnessMap = null;
    void scanReady.get(key)!.then(() => { Object.assign(m, maps); m.needsUpdate = true; });
  }
  return m;
}
/* A real model, loaded once and fitted (see heroes.ts), placed at each [x, y, z, rotY]. Up to `inst` copies are
   plain clones; more become instanced parts, one draw each. `then` gets the placed objects. */
export function glbs(k: Kit, name: string, fit: Parameters<typeof hero>[2], at: [number, number, number, number][], then?: (os: T.Object3D[]) => void, inst = 6) {
  if (!at.length) return;
  void hero(k, name, fit).then((h) => {
    if (!h || !k.live) return;
    if (at.length > inst) {
      const ins = heroInstances(k, h, at.length), m = new T.Matrix4(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0), one = new T.Vector3(1, 1, 1);
      at.forEach(([x, y, z, r], i) => ins.setAt(i, m.compose(new T.Vector3(x, y, z), q.setFromAxisAngle(up, r), one)));
      ins.commit();
      return;
    }
    const os = at.map(([x, y, z, r], i) => { const c = i ? h.clone() : h; c.position.set(x, y, z); c.rotation.y = r; k.add(c); return c; });
    then?.(os);
  });
}
/* A Firefly plate that does not exist yet (FIREFLY_QUEUE.md): the mesh shows `standIn` until the file lands at `url`,
   then wears it. A missing file costs one 404 and nothing else. */
export function fireflyPlate(k: Kit, url: string, w: number, h: number, x: number, y: number, z: number, rotY: number, standIn: T.Material, lit = false) {
  const o = k.mesh(new T.PlaneGeometry(w, h), standIn, x, y, z, true);
  o.rotation.y = rotY;
  scanLoader?.load(url, (t) => {
    if (!k.live) { t.dispose(); return; }
    t.colorSpace = T.SRGBColorSpace;
    t.anisotropy = 8;
    o.material = lit ? new T.MeshBasicMaterial({ map: t }) : new T.MeshStandardMaterial({ map: t, roughness: 0.85 });
  }, undefined, () => {});
  return o;
}
/* Anamorphic floor lettering (ON LOCATION rule 9, one trick a room): text painted flat on the ground, stretched so that
   from the eye at (ex, eh, ez) looking along -z it stands up as a sign `H` tall and `W` wide whose foot is `D` ahead.
   A floor point at distance d carries the sign height y where d = D * eh / (eh - y). */
export function anamorph(k: Kit, text: string, ex: number, ez: number, eh: number, floor: number, D: number, W: number, H: number, fg: string, size: number) {
  const rows = 40, g = new T.BufferGeometry(), pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const h = eh - floor;
  for (let i = 0; i <= rows; i++) {
    const vv = i / rows, d = (D * h) / (h - vv * H), half = ((W / 2) * d) / D;
    pos.push(ex - half, floor, ez - d, ex + half, floor, ez - d);
    uv.push(0, vv, 1, vv);
    if (i < rows) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  if (!HAS_DOM) return k.mesh(g, k.glow(0xffffff, 0.5), 0, 0.012, 0, true);
  const t = X.signText(text, 1024, Math.max(64, Math.round((1024 * H) / W)), 'transparent', fg, size);
  const m = new T.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.92, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  return k.mesh(g, m, 0, 0.012, 0, true);
}
/* A car the kit will cast (kit.ts cabsLater): a box of cab yellow becomes a real taxi with the MLOW topper, any other
   colour tagged `car` a Camry or an Escape in that paint. Returned as a group so a rider can move it. */
export function carBox(k: Kit, x: number, z: number, rotY: number, paint: number) {
  const g = new T.Group(), b = new T.Mesh(new T.BoxGeometry(1.9, 1.5, 4.6), k.flat(paint, 0.4, 0.4));
  b.position.y = 0.95;
  if (paint !== 0xf3b81c) b.userData.car = true;
  g.add(b);
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  k.add(g);
  return g;
}

/* Shared: lit billboards filled with the room's own New Yorkers beyond the framed page. */
export function billboard(k: Kit, ctx: RoomCtx, idx: number, w: number, h: number, x: number, y: number, z: number, rotY: number, frame?: T.Material) {
  const p = ctx.pieces[(24 + idx) % ctx.pieces.length];
  if (!p) return;
  const ratio = p.ar || 1.777,
    ww = Math.min(w, h * ratio),
    hh = ww / ratio;
  const m = new T.MeshBasicMaterial({ color: 0x0c1016 });
  const o = k.mesh(new T.PlaneGeometry(ww, hh), m, x, y, z, true);
  o.rotation.y = rotY;
  o.userData.piece = p;
  k.clickables.push(o);
  if (frame) {
    const f = k.mesh(new T.BoxGeometry(ww + 0.3, hh + 0.3, 0.1), frame, x, y, z);
    f.rotation.y = rotY;
    f.translateZ(-0.07);
  }
  loadThumb(ctx.thumb(p)).then((t) => {
    if (!k.live) return;
    m.map = t;
    m.color.set(0xffffff);
    m.needsUpdate = true;
  }).catch(() => {});
  return o;
}

/* ---------------- 01 THE BOWERY ---------------- */
export const bowery: RoomDef = {
  id: 'bowery',
  daylit: false,
  name: 'The Bowery',
  area: 'LOWER MANHATTAN',
  mood: 'After hours',
  color: '#79d4e9',
  description: 'Cast iron storefronts, brick tenements, fire escapes and a street that never quite sleeps.',
  signatures: 'Cast iron bases with brick uppers, fire escapes, roof tanks, an elevated girder crossing.',
  build(k, ctx) {
    k.sky({ top: 0x05070f, horizon: 0x13182a, ground: 0x07090f, fog: 0.011, stars: 900, env: 0.35 });
    k.hemi(0x8fa7d6, 0x14110c, 0.55);
    k.sun(0x9fb4ff, 0.9, -30, 60, 20, true, 70);
    /* 2026-11-23: Poly Haven scans (CC0) at their real size replace the painted asphalt, slabs, brick and cast iron */
    const asphalt = scan(k, 'bowery', 'asphalt_02', 3, () => X.asphalt(), { metalness: 0.05 }),
      concrete = scan(k, 'bowery', 'concrete_pavement', 1.8, () => X.pavers(0x8e8b84)),
      granite = k.pbr('granite', X.ashlar(0x8a8a86, 4, 2), 0.35),
      ironGreen = scan(k, 'bowery', 'green_metal_rust', 1.2, () => X.steel(0x2b4a3f, false), { metalness: 0.45, color: 0x8fa896 }),
      iron = k.flat(0x1f262b, 0.75, 0.45),
      steel = k.pbr('steelplate', X.steel(0x3a444c, true), 0.5, { metalness: 0.8, roughness: 0.45 }),
      bricks = [scan(k, 'bowery', 'brick_wall_02', 2, () => X.brick(0x6f4436, 1), { color: 0xc9a594 }), scan(k, 'bowery', 'dark_brick_wall', 1.05, () => X.brick(0x54372f, 2)), scan(k, 'bowery', 'brick_wall_02', 2, () => X.brick(0x7d5a44, 3), { color: 0xffe6d2 }), scan(k, 'bowery', 'dark_brick_wall', 1.05, () => X.brick(0x4a4a52, 4), { color: 0xa8a8b4 })],
      cornice = k.pbr('cornice', X.plaster(0xb8ad9a, 3), 0.6, { roughness: 0.8 }),
      glassDark = k.glass(0x9fc4d8, 0.35, 0.08),
      warm = k.glow(0xffd28a),
      yellow = k.flat(0xe6a626, 0, 0.6),
      white = k.flat(0xdedbd2, 0, 0.7);
    const L = 74, Z0 = 12, ZC = Z0 - L / 2;
    k.box(26, 0.3, L + 20, 0, -0.15, ZC - 4, asphalt);
    for (const s of [-1, 1]) {
      k.box(5, 0.28, L, s * 7.5, 0.0, ZC, concrete);
      k.box(0.3, 0.32, L, s * 5.1, 0.02, ZC, granite);
    }
    for (const x of [-0.14, 0.14]) k.box(0.09, 0.012, L - 6, x, 0.01, ZC, yellow);
    for (const z of [8, -30, -60]) for (let x = -4; x <= 4; x += 1.2) k.box(0.62, 0.014, 2.8, x, 0.012, z, white);
    for (const z of [-4, -26, -48]) {
      k.cyl(0.62, 0.03, 1.6, 0.012, z, iron, 0.62, 20);
      k.torus(0.62, 0.02, 1.6, 0.03, z, iron, 24).rotation.x = PI / 2;
    }
    // buildings: cast iron gallery fronts, brick uppers, cornices, window bays, tanks
    for (const s of [-1, 1])
      for (let b = 0; b < 9; b++) {
        const z = 6 - b * 8,
          h = 15 + ((b * 7 + (s > 0 ? 3 : 0)) % 4) * 2.5,
          brick = bricks[(b + (s > 0 ? 2 : 0)) % 4],
          face = s * 10;
        k.box(4, h - 6.4, 7.9, s * 12, 6.4 + (h - 6.4) / 2, z, brick);
        k.box(4.2, 6.4, 7.9, s * 12.1, 3.2, z, ironGreen);
        for (const dz of [-3.85, 3.85]) k.column(face - s * 0.15, 0.3, z + dz, 5.9, 0.28, ironGreen, true, iron);
        k.moulding([[0, 0], [0.6, 0], [0.7, 0.18], [0.45, 0.3], [0.5, 0.42], [0.2, 0.55], [0, 0.6]], 7.9, face - s * 0.05, 6.2, z, cornice, s > 0 ? PI : 0);
        k.moulding([[0, 0], [0.9, 0], [1.0, 0.25], [0.7, 0.42], [0.8, 0.62], [0.35, 0.85], [0, 0.95]], 8.1, face - s * 0.05, h - 0.5, z, cornice, s > 0 ? PI : 0);
        for (let dz = -3; dz <= 3; dz += 0.75) k.box(0.4, 0.34, 0.16, face - s * 0.18, h - 0.75, z + dz, cornice);
        const mural = s < 0 && b === 0;   // the Houston Street corner wall: blank brick for the mural plate
        const floors = mural ? 0 : Math.floor((h - 8) / 2.7);
        for (let f = 0; f < floors; f++)
          for (const dz of [-2.6, 0, 2.6]) {
            const y = 8.3 + f * 2.7;
            k.box(0.2, 1.95, 1.4, face - s * 0.06, y, z + dz, cornice);
            k.box(0.05, 1.7, 1.15, face - s * 0.14, y, z + dz, (b + f + Math.round(dz)) % 3 === 0 ? warm : glassDark);
            k.box(0.05, 1.7, 0.05, face - s * 0.18, y, z + dz, iron);
            k.box(0.05, 0.05, 1.15, face - s * 0.18, y, z + dz, iron);
            k.box(0.34, 0.1, 1.6, face - s * 0.12, y - 1.0, z + dz, cornice);
          }
        if (b % 3 === 1) {
          k.prop('fire_escape', face - s * 1.05, 7.4, z, { height: 3.2, rotY: s > 0 ? PI / 2 : -PI / 2 });
          k.prop('fire_escape', face - s * 1.05, 10.1, z, { height: 3.2, rotY: s > 0 ? PI / 2 : -PI / 2 });
        } else if (!mural) {
          for (const y of [7.6, 10.3, 13]) {
            if (y > h - 1.5) continue;
            k.box(1.3, 0.08, 3.4, face - s * 0.75, y, z, iron);
            for (let dz = -1.6; dz <= 1.7; dz += 0.34) k.box(0.03, 0.95, 0.03, face - s * 1.38, y + 0.5, z + dz, iron);
            k.box(0.05, 0.05, 3.4, face - s * 1.38, y + 1, z, iron);
            k.bar(v(face - s * 0.3, y + 0.05, z + 1.2), v(face - s * 1.2, y + 2.7, z + 1.2), 0.05, 0.05, iron);
            k.bar(v(face - s * 0.3, y + 0.05, z + 1.7), v(face - s * 1.2, y + 2.7, z + 1.7), 0.05, 0.05, iron);
          }
        }
        if (b % 2 === 0) {
          if (b % 4 === 0) k.prop('water_tower', s * 11.5, h, z + 1.5, { height: 5.2 });
          else {
            const x = s * 11.8;
            for (const dx of [-0.85, 0.85]) for (const dz of [-0.85, 0.85]) k.box(0.1, 1.9, 0.1, x + dx, h + 0.9, z + dz, iron);
            k.cyl(1.15, 2.2, x, h + 2.9, z, k.pbr('staves', X.planks(0x6a4b3a, 12, 2), 0.8), 1.15, 20);
            for (const dy of [-0.8, 0, 0.8]) k.torus(1.17, 0.04, x, h + 2.9 + dy, z, iron, 24).rotation.x = PI / 2;
            k.cyl(1.32, 0.7, x, h + 4.35, z, steel, 0.05, 18);
          }
        }
      }
    // elevated girders, lamps, signals, street furniture
    for (const z of [-6, -34]) {
      for (const s of [-1, 1]) {
        k.box(0.42, 8.5, 0.5, s * 4.6, 4.25, z, steel);
        k.box(0.9, 0.25, 0.9, s * 4.6, 0.12, z, steel);
      }
      k.box(10, 0.8, 0.5, 0, 8.4, z, steel);
      for (let x = -4; x < 5; x++) k.box(0.08, 0.7, 0.56, x, 8.4, z, iron);
      k.box(10.5, 0.15, 3, 0, 8.9, z, steel);
      k.point(0, 7.6, z, 0x9fb8ff, 12, 14);
    }
    for (const z of [7, -13, -33, -53]) for (const s of [-1, 1]) k.lamp(s * 5.6, z, 6, iron, 0xffc98a, 34);
    k.prop('hydrant', 6.1, 0, 2, { height: 1.15, keepOut: 0.5 });
    k.prop('hydrant', -6.1, 0, -40, { height: 1.15, keepOut: 0.5 });
    k.prop('mailbox', 5.9, 0, -20, { height: 1.55, rotY: -PI / 2, keepOut: 0.6 });
    k.prop('stoop', -8.6, 0, -44, { height: 2.1, rotY: PI / 2 });
    k.prop('stoop', 8.6, 0, -28, { height: 2.1, rotY: -PI / 2 });
    k.prop('utility_pole', 6.4, 0, -46, { height: 9 });
    k.prop('tree', -6.6, 0, 9, { height: 6.2, keepOut: 0.6 });
    k.prop('tree', 6.6, 0, -58, { height: 6.2, keepOut: 0.6 });
    for (const z of [-4, -24]) k.tree(-6.4, 0, z, { kind: 'bare', h: 5, r: 2.2 });
    k.box(0.5, 1.4, 0.42, 4.7, 4.9, 9, yellow);
    for (let i = 0; i < 3; i++) k.mesh(new T.CircleGeometry(0.13, 14), k.glow(i === 0 ? 0xff4e31 : 0x24211a), 4.7, 5.35 - i * 0.42, 9.22);
    k.sign('BOWERY', 2.4, 0.5, 5.4, 5.6, 6.2, '#1a5c46', '#ffffff', 150, 0, { border: true, double: true });
    k.sign('E HOUSTON ST', 3, 0.5, 5.4, 4.95, 6.2, '#1a5c46', '#ffffff', 110, 0, { border: true, double: true });
    k.sign('ONE WAY  →', 1.8, 0.5, 4.75, 3.7, 8.3, '#eeeee6', '#111820', 120, 0, { border: true, double: true });
    // subway entrance
    const sx = -6.9, sz = -15;
    k.box(2.6, 0.03, 4, sx, 0.17, sz, k.glow(0x03060a));
    for (const dx of [-1.3, 1.3]) {
      k.rail(sx + dx, sz, 4, iron, 1.0, 'z', 0.45);
      k.cyl(0.07, 2.1, sx + dx, 1.2, sz + 2.1, iron);
      k.sphere(0.26, sx + dx, 2.4, sz + 2.1, k.glow(0x84d9a8), 14);
      k.point(sx + dx, 2.3, sz + 2.1, 0x84d9a8, 6, 5);
    }
    k.sign('BROADWAY  LAFAYETTE ST', 2.7, 0.45, sx, 1.5, sz + 2.15, '#0a1014', '#ffffff', 64, 0, { double: true });
    k.sign('B  D  F  M   Downtown & Brooklyn', 2.7, 0.35, sx, 1.05, sz + 2.16, '#0a1014', '#fbc184', 52, 0, { double: true });
    k.keepOut.push({ x: sx, z: sz, r: 2.6 });
    // the end of the street: a blank party wall carrying one monumental work
    k.box(30, 30, 8, 0, 15, -74, bricks[3]);
    k.box(30.4, 0.6, 8.4, 0, 30, -74, cornice);
    k.sign('MLow / AFTER HOURS', 7, 0.8, 0, 26, -69.9, '#071019', '#83ebff', 90, 0, { border: true });
    k.sign('NEW YORKERS · THE MUSEUM', 12, 1.1, 0, 22.8, -69.9, 'transparent', '#F0F4F8', 80);
    k.skyline({ z: -110, count: 30, spacing: 5, scale: 1.5, base: -6, seed: 3, lit: 0.42, glow: 1.4 });
    // wheatpaste census walls on the last block
    const start = ctx.wallStart(1200, 40);
    for (const s of [-1, 1]) k.censusWall({ x: s * 9.72, y: 3.5, z: -62, rotY: s < 0 ? PI / 2 : -PI / 2, cols: 10, rows: 4, tile: 0.78, start: start + (s > 0 ? 40 : 0), pieces: ctx.all, backing: k.flat(0x0e1116, 0, 0.9) });
    /* ---- THE BIG UPGRADE (2026-11-23) ---- */
    /* the trade signs: the Bowery below Houston is the restaurant supply and lighting row, a lit fascia over every
       storefront between the column capitals and the cornice (invented trade names, no real business) */
    const trades = ['RESTAURANT SUPPLY', 'LAMPS  LIGHTING  FIXTURES', 'KITCHEN EQUIPMENT', 'CHINA & GLASSWARE', 'STAINLESS STEEL', 'HOTEL & BAR SUPPLY', 'NEON  SIGNS  REPAIRS', 'COMMERCIAL REFRIGERATION', '315 BOWERY', 'CHANDELIERS', 'WHOLESALE  RETAIL', 'PIZZA OVENS', 'BAKERY EQUIPMENT', 'LIGHTING CENTER', 'FURNITURE  BOOTHS', 'SLICERS  MIXERS', 'GAS RANGES', 'OPEN LATE'];
    const fasciaInk = ['#f6efe0', '#ffd27a', '#8fe3ff', '#ff8f7a'], fasciaBg = ['#101418', '#14100c', '#0d1513', '#18100f'];
    const fascia = k.flat(0x0c0f12, 0.5, 0.5);
    for (const s of [-1, 1])
      for (let b = 0; b < 9; b++) {
        const z = 6 - b * 8, face = s * 10, n = b * 2 + (s > 0 ? 1 : 0), t = trades[n % trades.length];
        if (s < 0 && b === 4) continue;   // the mission keeps its cross instead
        k.box(0.12, 0.78, 6.9, face - s * 0.5, 5.72, z, fascia);
        k.box(0.5, 0.06, 6.9, face - s * 0.28, 6.13, z, fascia);
        k.sign(t, 6.6, 0.6, face - s * 0.57, 5.72, z, fasciaBg[n % 4], fasciaInk[n % 4], Math.min(96, Math.round(1024 / (0.6 * t.length))), s < 0 ? PI / 2 : -PI / 2);
      }
    /* the Bowery Mission's red neon cross, JESUS SAVES, over 227 Bowery (the egg at the mission storefront is about it) */
    {
      const cx = -8.7, cz = -30, red = k.flat(0x2a0808, 0.3, 0.5), neon = '#ff3b2e';
      k.box(0.36, 4.7, 0.3, cx, 9.7, cz, red);
      k.box(2.6, 0.62, 0.3, cx, 10.0, cz, red);
      k.bar(v(-10, 7.2, cz), v(cx, 7.2, cz), 0.06, 0.06, iron);
      k.bar(v(-10, 10.9, cz), v(cx, 10.9, cz), 0.06, 0.06, iron);
      for (const side of [-1, 1]) {
        const zz = cz + side * 0.16, ry = side > 0 ? 0 : PI;
        [11.6, 11.0, 9.0, 8.4, 7.8].forEach((y, i) => k.sign('JESUS'[i], 0.34, 0.5, cx, y, zz, '#2a0808', neon, 300, ry));
        k.sign('SAVES', 2.5, 0.5, cx, 10.0, zz + side * 0.01, '#2a0808', neon, 300, ry);
      }
      k.point(cx, 9.6, cz + 0.8, 0xff3b2e, 14, 9);
    }
    /* the Third Avenue El's ghost: lattice lacing, ties and rivets on the two girder crossings */
    for (const z of [-6, -34]) {
      for (const f of [-0.27, 0.27]) for (let x = -4.4; x < 4.4; x += 0.8) {
        k.bar(v(x, 8.05, z + f), v(x + 0.8, 8.75, z + f), 0.05, 0.02, iron);
        k.bar(v(x, 8.75, z + f), v(x + 0.8, 8.05, z + f), 0.05, 0.02, iron);
      }
      for (let x = -5; x <= 5; x += 0.45) k.box(0.22, 0.12, 3.2, x, 9.04, z, k.flat(0x2b241e, 0, 0.9));
      for (const s of [-1, 1]) { k.bar(v(s * 4.6, 5.6, z), v(s * 3.2, 8.0, z), 0.2, 0.2, steel); k.box(0.6, 0.6, 0.62, s * 4.6, 7.7, z, steel); }
    }
    /* parked along both curbs: two cabs and five private cars, cast by the kit as real taxis and cars */
    for (const [x, z, paint] of [[3.85, 1, 0xf3b81c], [3.85, -15, 0x1d1f22], [3.85, -46, 0x8a1c1c], [3.85, -54, 0xf3b81c], [-3.85, -21, 0x2a3440], [-3.85, -44, 0xb8b8b4], [-3.85, -56, 0x334a3a]] as [number, number, number][]) {
      carBox(k, x, z, x > 0 ? PI : 0, paint);
      k.keepOut.push({ x, z: z - 1.4, r: 1.0 }, { x, z: z + 1.4, r: 1.0 }, { x, z, r: 1.0 });
    }
    /* the curb: city trash cans, black bags, a payphone, a utility box (NEW YORKERS edits of Poly Haven CC0 models) */
    glbs(k, 'bowery/nyb_trash_dsny', { width: 1.5 }, [[5.7, 0.14, -9, -PI / 2], [-5.7, 0.14, -37, PI / 2], [5.7, 0.14, -41, -PI / 2]]);
    glbs(k, 'bowery/ph_trashbag', { height: 0.62 }, [[5.5, 0.14, -10.4, 0.3], [5.9, 0.14, -10.9, 1.4], [5.4, 0.14, -11.3, 2.2], [-5.5, 0.14, -35.6, 0.8], [-5.9, 0.14, -35.1, 2.6], [5.6, 0.14, -42.6, 1.1], [5.95, 0.14, -43.1, 0.2], [-5.6, 0.14, -9.5, 1.9]]);
    glbs(k, 'bowery/nyb_payphone', { height: 2.0 }, [[5.65, 0.14, -27, -PI / 2]]);
    glbs(k, 'bowery/nyb_walking_newsbox', { height: 1.25 }, [[-5.8, 0.14, 1, PI / 2]]);
    for (const [x, z] of [[5.7, -9], [-5.7, -37], [5.7, -41], [5.65, -27]]) k.keepOut.push({ x, z, r: 0.9 });
    /* roll down gates under the party wall: three bays of scanned corrugated steel shut for the night */
    const shutter = scan(k, 'bowery', 'rusty_metal_shutter', 1.9, () => X.steel(0x6a6e70, false), { metalness: 0.5, color: 0xb0b4b8 });
    for (const x of [-8, 0, 8]) {
      k.box(6.4, 4.2, 0.12, x, 2.1, -69.94, shutter);
      k.box(6.8, 0.5, 0.5, x, 4.45, -69.8, iron);
      for (const dx of [-3.3, 3.3]) k.box(0.16, 4.2, 0.2, x + dx, 2.1, -69.86, iron);
    }
    /* Firefly plate, queued: the Houston Street mural wall (until it lands the wall is plain brick) */
    fireflyPlate(k, 'assets/museum/tex/bowery/ff_houston_mural.webp', 7.6, 7.6, -9.93, 10.6, 6, PI / 2, new T.MeshBasicMaterial({ visible: false }));
    /* the trick: anamorphic road paint. Flat on the asphalt, 21 m long, it stands up as a sign from the spawn */
    anamorph(k, 'AFTER HOURS', 0, 12, 3, 0, 10, 4.2, 1.6, '#f4f1e6', 170);
    k.egg(v(0, 0.3, 0), { id: 'bowery-anamorph', title: 'Paint that stands up', year: '1533', text: 'Look back from where you came in and the letters in the road stand upright. It is anamorphosis, a picture drawn so it only comes right from one spot. The best known is the stretched skull across the foot of Hans Holbein the Younger\'s The Ambassadors, painted in 1533, which snaps into shape when you look at the canvas from the side.', clue: 'Stand where you arrived and read the road.', source: { name: 'The Ambassadors (Holbein), Wikipedia', url: 'https://en.wikipedia.org/wiki/The_Ambassadors_(Holbein)' } }, { r: 1.8 });
    /* easter eggs: real Bowery history, placed at the thing each one is about */
    const bw = { name: 'Bowery, Wikipedia', url: 'https://en.wikipedia.org/wiki/Bowery' };
    k.egg(v(5.4, 4.6, 6.2), { id: 'bowery-bouwerij', title: 'The farm road', year: '1667', text: 'The name comes from bouwerie, later bouwerij, an old Dutch word for farm: the Dutch called the path the Bouwerie road, and Petrus Stuyvesant, the last Dutch governor of New Amsterdam, retired to his Bowery farm in 1667. It is the oldest thoroughfare on Manhattan Island, older than European settlement, because it began as a Lenape footpath.', clue: 'Read the green street sign at the corner.', source: bw }, { r: 1.6 });
    k.egg(v(0, 7.6, -6), { id: 'bowery-third-avenue-el', title: 'Under the El', year: '1955', text: 'From 1878 to 1955 the Third Avenue El ran above the Bowery. The girders over this street are its ghost.', clue: 'Stand in the middle of the street and look up at the steel.', source: bw }, { r: 1.8 });
    k.egg(v(-9.6, 3.2, 4), { id: 'bowery-mural', title: 'The wall at Houston', year: '1982', text: 'The wall at Houston Street and the Bowery was a graffiti spot in the early 1980s, and Keith Haring painted a large mural on it in 1982. Goldman Properties bought it in 1984 and ran advertisements there, then from 2008 Jeffrey Deitch commissioned murals by artists including Shepard Fairey, Os Gemeos and Kenny Scharf, until the owners paused new murals in May 2022.', clue: 'Look at the corner wall nearest the Houston Street sign.', source: { name: 'Bowery Mural, Wikipedia', url: 'https://en.wikipedia.org/wiki/Bowery_Mural' } }, { r: 1.6 });
    k.egg(v(9.6, 1.4, -22), { id: 'bowery-cbgb', title: '315 Bowery', year: '1973', text: 'CBGB opened at 315 Bowery on December 10, 1973. CBGB and OMFUG stood for Country, Bluegrass, Blues and Other Music For Uplifting Gourmandizers, and it closed on October 15, 2006, with Patti Smith playing until just after 1 a.m. Its last awning went to the lobby of the Rock and Roll Hall of Fame in Cleveland.', clue: 'Find the storefront with the iron columns on the right hand side.', source: { name: 'CBGB, Wikipedia', url: 'https://en.wikipedia.org/wiki/CBGB' } }, { r: 1.6 });
    k.egg(v(-9.6, 1.4, -30), { id: 'bowery-mission', title: 'The mission', year: '1880', text: 'The Bowery Mission was founded in 1880 at 36 Bowery by the Reverend Albert Gleason Ruliffson, and in 1909 it moved up the street to 227 and 229 Bowery. A few doors away, at 235, the New Museum opened almost a century later.', clue: 'Look at the storefront doors halfway down the left hand side.', source: bw }, { r: 1.6 });
    k.egg(v(9.6, 1.4, -46), { id: 'bowery-new-museum', title: 'A stack of white boxes', year: '2007', text: 'On December 1, 2007 the New Museum opened its $50 million building at 235 Bowery: a seven story stack of white boxes by the Tokyo firm Sejima and Nishizawa, SANAA. Putting white boxes on the Bowery was a response to the gentrification of the neighbourhood. Its expansion next door at 231 Bowery, designed by OMA, opened on March 21, 2026.', clue: 'Walk toward the far end of the right hand side and look up.', source: { name: 'New Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/New_Museum' } }, { r: 1.6 });
    const mounts = corridorMounts({ pairs: 10, x: 9.8, z0: 2, pitch: 6, y: 3.6, width: 5.4, height: 3.1, inset: 4.6, style: 'black' });
    mounts[6].target = v(-4.6, 3, -17.6);   // the true spot clear of the subway stair's railings
    mounts.push({ position: v(0, 12.5, -69.9), rotation: 0, target: v(0, 3, -50), width: 22, height: 12.4, style: 'none', wash: false });
    return { mounts, spawn: v(0, 3, 12), look: v(0, 3.5, -30), eye: 3, bounds: [-8.4, 8.4, -66, 13], style: 'black' };
  },
};

/* ---------------- 02 THE SUBWAY ---------------- */
export const subway: RoomDef = {
  id: 'subway',
  daylit: false,
  name: 'Below the city',
  area: 'THE SUBWAY',
  mood: 'Last train',
  color: '#e2ca89',
  description: 'Broadway, Lafayette Street on the IND Sixth Avenue Line: white tile with a blue band, blue I beam columns, a silver train at the platform and the yellow edge.',
  signatures: 'White glazed tile with a blue trim line on a black border, black name plates with white lettering, blue riveted I beam columns, the third rail, the tactile platform edge.',
  build(k, ctx) {
    k.sky({ top: 0x0a0d10, horizon: 0x11161a, ground: 0x0a0d10, fog: 0.012, env: 0.3 });
    k.hemi(0xdfe9df, 0x1a1a14, 0.75);
    /* 2026-11-23: scanned glazed tile (laid on its side, so the long tiles run level like the IND's), worn platform
       concrete and painted steel for the columns, all Poly Haven CC0 at their real size */
    const tile = scan(k, 'subway', 'long_white_tiles', 1.27, () => X.subwayTile(0xe9e6d8, 0x3b3f3b), { roughness: 0.32, color: 0xffffff }, PI / 2),
      tileBand = k.pbr('tileIndBlue', X.subwayTile(0x2b4f96, 0x16244a), 0.55, { roughness: 0.25 }),
      tileBlack = k.flat(0x0d0e10, 0, 0.35),
      floor = scan(k, 'subway', 'concrete_floor_worn_001', 3, () => X.concrete(0x8a8a82, 2), { color: 0xd2cec4 }),
      ceiling = k.pbr('ceil', X.concrete(0x5d615e, 5), 0.5),
      steelG = scan(k, 'subway', 'blue_metal_plate', 2.5, () => X.steel(0x274c86, true), { metalness: 0.5, color: 0x9ab4ff }),
      iron = k.flat(0x22272b, 0.75, 0.45),
      silver = k.pbr('car', X.steel(0x9aa5ab, false), 0.35, { metalness: 0.9, roughness: 0.3 }),
      trackBed = k.pbr('ballast', X.cobble(0x3a3a3a, 3), 0.9, { roughness: 1 }),
      yellow = k.flat(0xf1c531, 0, 0.55),
      glow = k.glow(0xf6f2df),
      glassDark = k.glass(0x1a2a33, 0.6, 0.1);
    const L = 78, ZC = 10 - L / 2;
    // platform, track, far wall
    k.box(18, 0.4, L, 0, -0.2, ZC, floor);
    k.box(0.5, 0.05, L - 4, -8.2, 0.03, ZC, yellow);
    const studs: T.Matrix4[] = [];
    for (let z = ZC - L / 2 + 2; z < ZC + L / 2 - 2; z += 0.24) for (let j = 0; j < 3; j++) studs.push(new T.Matrix4().makeTranslation(-8.05 + j * 0.13, 0.05, z));
    k.instances(new T.SphereGeometry(0.03, 6, 4), k.flat(0xd9b437, 0.2, 0.5), studs);
    k.box(6, 0.4, L, -12, -1.6, ZC, trackBed);
    k.box(0.4, 1.4, L, -9.1, -0.9, ZC, floor);
    for (const x of [-10.5, -11.9]) k.box(0.08, 0.12, L, x, -1.3, ZC, iron);
    for (let z = ZC - L / 2; z < ZC + L / 2; z += 0.7) k.box(2.4, 0.1, 0.22, -11.2, -1.4, z, k.flat(0x3b2f27, 0, 0.9));
    k.box(0.6, 12, L, 9.3, 5.5, ZC, tile);
    k.box(0.6, 12, L, -15.3, 5.5, ZC, tile);
    k.box(25, 0.6, L, -3, 0.3, ZC + L, tile);
    /* IND colour code: white tile, a blue trim line on a black border (the 1936 band was blue on white) */
    for (const x of [9, -15]) {
      const sx = x > 0 ? -1 : 1;
      k.box(0.08, 0.8, L, x + sx * 0.05, 6.1, ZC, tileBlack);
      k.box(0.08, 0.56, L, x + sx * 0.08, 6.1, ZC, tileBand);
      k.box(0.08, 0.4, L, x + sx * 0.05, 1.0, ZC, tileBlack);
      k.box(0.08, 0.26, L, x + sx * 0.08, 1.0, ZC, tileBand);
    }
    /* the third rail, on the far side of the track from the platform: 625 volts */
    k.box(0.12, 0.14, L, -12.85, -1.25, ZC, iron);
    k.box(0.55, 0.05, L, -12.9, -1.0, ZC, k.flat(0x4a3a2a, 0, 0.9));
    for (let z = ZC - L / 2 + 1; z < ZC + L / 2; z += 3) k.box(0.06, 0.3, 0.06, -12.62, -1.1, z, iron);
    // vaulted ceiling with tile ribs and concrete beams
    const vaultPts = (z: number) => Array.from({ length: 25 }, (_, i) => { const t = (i / 24) * PI; return v(-3 + Math.cos(t) * 12.3, 8.2 + Math.sin(t) * 3.4, z); });
    const vault = new T.BufferGeometry(), vp: number[] = [], vi: number[] = [];
    for (const zz of [ZC + L / 2, ZC - L / 2]) for (const p of vaultPts(zz)) vp.push(p.x, p.y, p.z);
    for (let i = 0; i < 24; i++) vi.push(i, i + 25, i + 1, i + 1, i + 25, i + 26);
    vault.setAttribute('position', new T.Float32BufferAttribute(vp, 3));
    vault.setIndex(vi);
    vault.computeVertexNormals();
    k.mesh(vault, k.pbr('vaultTile', X.subwayTile(0xdcd9cb, 0x4a4d48), 0.5, { roughness: 0.3, side: T.DoubleSide }));
    for (let z = 8; z > ZC - L / 2; z -= 6) {
      k.curve(vaultPts(z), 0.18, ceiling, 24);
      k.box(24.8, 0.5, 0.5, -3, 8.1, z, ceiling);
      k.box(4.2, 0.12, 0.34, 0, 7.75, z, iron);
      k.box(4, 0.05, 0.26, 0, 7.68, z, glow);
      k.point(0, 7.2, z, 0xf2f0dc, 26, 16);
      k.box(4.2, 0.12, 0.34, -11.5, 7.6, z, iron);
      k.box(4, 0.05, 0.26, -11.5, 7.53, z, glow);
    }
    // riveted columns
    for (let z = 5; z > ZC - L / 2 + 4; z -= 6) {
      for (const x of [-7.4, 6.4]) {
        k.box(0.5, 8, 0.16, x, 4, z - 0.24, steelG);
        k.box(0.5, 8, 0.16, x, 4, z + 0.24, steelG);
        k.box(0.12, 8, 0.4, x, 4, z, steelG);
        k.box(0.9, 0.3, 0.9, x, 0.15, z, steelG);
        k.box(0.9, 0.3, 0.9, x, 7.95, z, steelG);
        const riv: T.Matrix4[] = [];
        for (let y = 0.6; y < 7.6; y += 0.42) for (const dx of [-0.16, 0.16]) for (const dz of [-0.33, 0.33]) riv.push(new T.Matrix4().makeTranslation(x + dx, y, z + dz));
        k.instances(new T.SphereGeometry(0.035, 6, 4), k.flat(0xb5a26a, 0.7, 0.35), riv);
      }
      k.box(0.8, 0.9, 0.9, 6.4, 8.35, z, ceiling);
    }
    // mosaic name plaques and a long mosaic band of New Yorkers
    for (let z = 2; z > ZC - L / 2 + 6; z -= 12) {
      k.sign('BROADWAY-LAFAYETTE ST', 4.6, 0.62, 8.96, 5.35, z, '#0b0c0e', '#ffffff', 70, -PI / 2, { border: true });
      k.sign('BROADWAY-LAFAYETTE ST', 4.6, 0.62, -14.96, 5.35, z, '#0b0c0e', '#ffffff', 70, PI / 2, { border: true });
      /* the small white on black BROADWAY captions set into the lower trim line */
      k.sign('BROADWAY', 0.9, 0.24, 8.9, 1.0, z - 6, '#0b0c0e', '#ffffff', 60, -PI / 2);
      k.sign('BROADWAY', 0.9, 0.24, -14.9, 1.0, z - 6, '#0b0c0e', '#ffffff', 60, PI / 2);
    }
    const start = ctx.wallStart(3200, 96);
    k.censusWall({ x: 8.96, y: 7.05, z: -22, rotY: -PI / 2, cols: 48, rows: 2, tile: 0.52, gap: 0.05, start, pieces: ctx.all, backing: k.flat(0x141a1c, 0, 0.9) });
    k.censusWall({ x: -14.96, y: 7.05, z: -22, rotY: PI / 2, cols: 48, rows: 2, tile: 0.52, gap: 0.05, start: ctx.wallStart(start + 96, 96), pieces: ctx.all, backing: k.flat(0x141a1c, 0, 0.9) });
    // the train: silver car, rounded doors, windows lit with the room's own New Yorkers
    const train = new T.Group();
    train.position.set(-11.2, 0, ZC);
    const carLen = 66;
    /* the box parts below are the stand in: hidden once the hero cars arrive (2026-10-28) */
    const boxCar: T.Object3D[] = [];
    const body = new T.Mesh(new T.BoxGeometry(2.7, 3.5, carLen), silver);
    boxCar.push(body);
    body.position.y = 2.15;
    train.add(body);
    const roof = new T.Mesh(new T.CylinderGeometry(1.35, 1.35, carLen, 12, 1, false, 0, PI), k.flat(0x8a949a, 0.85, 0.35));
    roof.rotation.z = PI / 2;
    roof.rotation.y = PI / 2;
    roof.position.y = 3.9;
    train.add(roof);
    boxCar.push(roof);
    for (let i = 0; i < 11; i++) {
      const z = -carLen / 2 + 3 + i * 6;
      const door = new T.Mesh(new T.BoxGeometry(0.06, 2.8, 1.3), k.flat(0x74808a, 0.8, 0.35));
      door.position.set(1.36, 1.8, z);
      train.add(door);
      boxCar.push(door);
      const gap = new T.Mesh(new T.BoxGeometry(0.07, 2.8, 0.03), iron);
      gap.position.set(1.37, 1.8, z);
      train.add(gap);
      boxCar.push(gap);
      for (const dz of [-0.32, 0.32]) {
        const w = new T.Mesh(new T.PlaneGeometry(0.45, 1.1), glassDark);
        w.position.set(1.4, 2.35, z + dz);
        w.rotation.y = PI / 2;
        train.add(w);
        boxCar.push(w);
      }
      if (i < 10) {
        const wz = z + 3;
        const win = new T.Mesh(new T.PlaneGeometry(3.2, 1.5), k.glow(0xfff4dc));
        win.position.set(1.37, 2.6, wz);
        win.rotation.y = PI / 2;
        train.add(win);
        const wo = new T.Mesh(new T.BoxGeometry(0.05, 1.7, 3.5), iron);
        wo.position.set(1.34, 2.6, wz);
        train.add(wo);
        billboard(k, ctx, i, 2.9, 1.3, -9.8, 2.6, ZC + wz, PI / 2);
        k.point(-9.4, 2.6, ZC + wz, 0xfff0d0, 5, 4);
      }
      const stripe = new T.Mesh(new T.BoxGeometry(0.02, 0.12, carLen), k.flat(0x1c3f8f, 0.3, 0.5));
      stripe.position.set(1.37, 3.65, 0);
      train.add(stripe);
      boxCar.push(stripe);
    }
    for (const dz of [-carLen / 2, carLen / 2]) {
      const face = new T.Mesh(new T.BoxGeometry(2.7, 3.5, 0.3), k.flat(0x232a2f, 0.6, 0.4));
      face.position.set(0, 2.15, dz);
      train.add(face);
      boxCar.push(face);
      const lamp = new T.Mesh(new T.SphereGeometry(0.16, 10, 8), k.glow(0xfff0c0));
      lamp.position.set(0.7, 1.4, dz + (dz > 0 ? 0.16 : -0.16));
      train.add(lamp);
    }
    for (let i = 0; i < 6; i++) {
      const wheel = new T.Mesh(new T.CylinderGeometry(0.45, 0.45, 2.6, 16), iron);
      wheel.rotation.z = PI / 2;
      wheel.position.set(0, -1.0, -carLen / 2 + 5 + i * 11);
      train.add(wheel);
      boxCar.push(wheel);
    }
    k.add(train);
    /* 2026-10-28: the hero car (h_subway_car_lo: the stainless R142 type made 2026-10-09 that v15.ts uses, cut from 40k to 12k triangles for the tiling) tiled
       four times along the 66 m train instead of one stretched box. The lit windows with the room's New Yorkers,
       their frames and the head lamps stay; a failed load leaves the box train as it was. */
    const CARS = 4, CAR = carLen / CARS;
    void hero(k, 'h_subway_car_lo', { box: [2.75, 4.5, CAR - 0.3] }).then((h) => {
      if (!h) return;
      hide(boxCar);
      for (let i = 0; i < CARS; i++) { const c = i ? h.clone() : h; c.position.set(0, -0.6, -carLen / 2 + CAR / 2 + i * CAR); train.add(c); }
    });
    k.sign('DOWNTOWN & BROOKLYN   ↓', 7, 0.7, 0, 5.4, ZC - L / 2 + 0.7, '#0f1a1c', '#f9f8e9', 80, 0, { border: true });
    k.sign('B   D   F   M', 4, 0.7, 0, 4.4, ZC - L / 2 + 0.7, '#152728', '#ffbc69', 150, 0, { border: true });
    k.sign('EXIT  ↑  HOUSTON STREET', 5, 0.62, 0, 6.2, 11.6, '#8f3a2c', '#ffffff', 80, PI, { border: true });
    /* 2026-11-23: the code benches became the real thing, a slatted platform bench with its litter (a NEW YORKERS edit
       of Poly Haven CC0 models) */
    glbs(k, 'subway/nyb_pelham_bench', { width: 4.2 }, [[6.55, 0, -4, -PI / 2], [6.55, 0, -28, -PI / 2], [6.55, 0, -46, -PI / 2]]);
    for (const z of [-4, -28, -46]) k.keepOut.push({ x: 6.4, z: z - 1.2, r: 0.9 }, { x: 6.4, z: z + 1.2, r: 0.9 });
    k.box(6, 0.5, L, 3, 8.3, ZC, ceiling);
    // stair up at the far end
    for (let i = 0; i < 14; i++) k.box(5, 0.32, 0.9, 4, 0.16 + i * 0.32, ZC - L / 2 + 1.5 - i * 0.9 + 14, floor);
    k.box(0.1, 1.1, 13, 1.45, 3.0, ZC - L / 2 + 8, iron);
    k.keepOut.push({ x: 4, z: ZC - L / 2 + 8, r: 5 });
    /* ---- THE BIG UPGRADE (2026-11-23) ---- */
    const Z1 = ZC - L / 2, dark = k.flat(0x161818, 0, 0.9);
    /* the far end was open fog: now a tiled end wall with the tunnel mouth over the track */
    k.box(18.8, 13.6, 0.6, -0.1, 5.2, Z1 - 0.6, tile);
    k.box(0.8, 13.6, 0.6, -14.9, 5.2, Z1 - 0.6, tile);
    k.box(5, 7.8, 0.6, -12, 8.1, Z1 - 0.6, tile);
    k.box(5.4, 0.4, 0.7, -12, 4.3, Z1 - 0.55, tileBlack);
    /* and the entrance end, behind the exit sign, was open too */
    k.box(24.6, 13.6, 0.6, -3, 5.2, 12.2, tile);
    /* the trick: a forced perspective tunnel. Nine portals, each 0.86 the size of the last and set closer, converge on
       one point, so 8.7 m of tunnel reads as a long run of track with its signals going on into the dark */
    {
      const n = 10, vx = -12, vy = 1.1, xs: number[][] = [];
      let z = Z1 - 0.9, f = 1;
      for (let i = 0; i < n; i++) {
        const w = 2.5 * f, yb = vy - (vy + 1.4) * f, yt = vy + (4.1 - vy) * f;
        xs.push([vx - w, vx + w, yb, yt, z]);
        if (i < n - 1) {
          k.box(0.25 * f, yt - yb, 0.25 * f, vx - w + 0.12 * f, (yb + yt) / 2, z, dark);
          k.box(0.25 * f, yt - yb, 0.25 * f, vx + w - 0.12 * f, (yb + yt) / 2, z, dark);
          k.box(2 * w, 0.25 * f, 0.25 * f, vx, yt - 0.12 * f, z, dark);
          if (i % 2 === 1) {
            const lamp = i % 4 === 1 ? 0x48ff7a : 0xff4630;
            k.box(0.22 * f, 0.5 * f, 0.12 * f, vx + w - 0.4 * f, yb + 1.9 * f, z + 0.1, iron);
            k.sphere(0.07 * f, vx + w - 0.4 * f, yb + 1.95 * f, z + 0.18 * f, k.glow(lamp), 8);
          }
          k.sphere(0.05 * f, vx, yt - 0.3 * f, z + 0.2, k.glow(0xfff1c8), 6);
        }
        z -= 1.6 * f;
        f *= 0.86;
      }
      const g = new T.BufferGeometry(), pos: number[] = [];
      const quad = (a: number[], b: number[], c: number[], d: number[]) => pos.push(...a, ...b, ...c, ...a, ...c, ...d);
      for (let i = 0; i < n - 1; i++) {
        const [l0, r0, b0, t0, z0] = xs[i], [l1, r1, b1, t1, z1] = xs[i + 1];
        quad([l0, b0, z0], [r0, b0, z0], [r1, b1, z1], [l1, b1, z1]);
        quad([l0, t0, z0], [l1, t1, z1], [r1, t1, z1], [r0, t0, z0]);
        quad([l0, b0, z0], [l1, b1, z1], [l1, t1, z1], [l0, t0, z0]);
        quad([r0, b0, z0], [r0, t0, z0], [r1, t1, z1], [r1, b1, z1]);
        for (const dx of [-0.72, 0.72]) k.bar(v(vx + dx * (r0 - vx) / 2.5, b0 + 0.08, z0), v(vx + dx * (r1 - vx) / 2.5, b1 + 0.08, z1), 0.07 * (r1 - vx) / 2.5, 0.06, k.flat(0x6a6660, 0.8, 0.35));
      }
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      g.computeVertexNormals();
      k.mesh(g, new T.MeshStandardMaterial({ color: 0x2a2b2a, roughness: 0.95, side: T.DoubleSide }), 0, 0, 0, true);
      const end = xs[n - 1];
      k.box(end[1] - end[0], end[3] - end[2], 0.05, vx, (end[2] + end[3]) / 2, end[4], k.glow(0x050606));
      k.sphere(0.035, vx + 0.08, end[2] + 0.2, end[4] + 0.06, k.glow(0xfff4d0), 6);
      k.egg(v(vx, 1.4, Z1 - 3), { id: 'subway-forced-tunnel', title: 'A tunnel nine metres long', year: '1653', text: 'The tunnel past the end of the platform is a forced perspective: every portal is a little smaller and a little closer than the last, so a few metres read as a long run of track. Francesco Borromini built the classic one at the Palazzo Spada in Rome in 1652 and 1653, a colonnade about 8.8 metres long that looks four times longer, with a sculpture at its end far smaller than it seems.', clue: 'Look down the track past the end of the train.', source: { name: 'Palazzo Spada, Wikipedia', url: 'https://en.wikipedia.org/wiki/Palazzo_Spada' } }, { r: 2.2 });
    }
    /* the ceiling: column line girders, conduit and cable runs the length of the station */
    for (const x of [-7.4, 6.4]) { k.box(0.5, 0.06, L, x, 8.12, ZC, steelG); k.box(0.08, 0.55, L, x, 7.82, ZC, steelG); k.box(0.5, 0.06, L, x, 7.54, ZC, steelG); }
    for (const [x, y, r] of [[1.6, 7.95, 0.05], [1.8, 7.95, 0.04], [2.0, 7.95, 0.06], [-4.2, 7.95, 0.05], [8.7, 7.2, 0.07], [8.7, 7.4, 0.05]]) k.beam(v(x, y, 10), v(x, y, Z1), r, k.flat(0x5f6460, 0.7, 0.45), 6);
    for (let z = 8; z > Z1; z -= 2) for (const x of [1.8, -4.2]) k.box(0.36, 0.04, 0.05, x, 7.99, z, iron);
    /* hung station signs, IND black with the Sixth Avenue line's orange bullets */
    const bullet = k.glow(0xff6319);
    for (const z of [-7, -35]) {
      for (const dx of [-2.2, 2.2]) k.beam(v(dx, 6.9, z), v(dx, 8.1, z), 0.025, iron, 5);
      k.box(5.6, 1.1, 0.12, 0, 6.6, z, k.flat(0x0b0c0e, 0.3, 0.5));
      for (const [side, txt] of [[1, 'DOWNTOWN & BROOKLYN'], [-1, 'UPTOWN & QUEENS']] as [number, string][]) {
        k.sign(txt, 5.2, 0.48, 0, 6.85, z + side * 0.07, '#0b0c0e', '#ffffff', 72, side > 0 ? 0 : PI);
        ['B', 'D', 'F', 'M'].forEach((ch, i) => {
          const bx = (i - 1.5) * 0.62 * side;
          k.mesh(new T.CircleGeometry(0.24, 24), bullet, bx, 6.33, z + side * 0.07).rotation.y = side > 0 ? 0 : PI;
          k.sign(ch, 0.36, 0.36, bx, 6.33, z + side * 0.075, 'transparent', '#ffffff', 300, side > 0 ? 0 : PI);
        });
      }
    }
    /* platform furniture: the hanging clock, city trash cans, a wet floor sign; a rat works the track past the train */
    k.beam(v(0, 7.0, -21), v(0, 8.1, -21), 0.03, iron, 5);
    glbs(k, 'subway/nyb_pelham_clock', { height: 0.62 }, [[0, 6.4, -20.97, 0], [0, 6.4, -21.03, PI]]);
    glbs(k, 'subway/ph_metal_trash_can', { width: 1.5 }, [[7.3, 0, -16, -PI / 2], [7.3, 0, -40, -PI / 2]]);
    for (const z of [-16, -40]) k.keepOut.push({ x: 7.3, z, r: 0.95 });
    glbs(k, 'subway/ph_WetFloorSign_01', { height: 0.7 }, [[2.2, 0, -37, 0.6]]);
    const rat = new T.Group();
    k.add(rat);
    glbs(k, 'subway/ph_street_rat', { length: 0.3 }, [[0, 0, 0, 0]], (os) => { k.scene.remove(os[0]); rat.add(os[0]); });
    const ratPath = k.spline([v(-11.2, -1.36, -62.6), v(-10.9, -1.36, -64.5), v(-11.5, -1.36, -66.4), v(-11.0, -1.36, -67.6), v(-11.4, -1.36, -64.2)], true);
    if (!ctx.reduced) k.rider(rat, ratPath, 0.55); else rat.position.set(-11.2, -1.36, -64);
    /* Firefly plate, queued: a ceramic mosaic over the end wall's frame (until it lands, the wall is tile) */
    fireflyPlate(k, 'assets/museum/tex/subway/ff_mosaic_panel.webp', 8, 2.6, -2.5, 7.4, Z1 - 0.28, 0, new T.MeshBasicMaterial({ visible: false }));
    /* easter eggs: real details of Broadway, Lafayette Street */
    const stn = { name: 'Broadway, Lafayette Street station, Wikipedia', url: 'https://en.wikipedia.org/wiki/Broadway%E2%80%93Lafayette_Street_station' };
    k.egg(v(8.5, 5.35, -10), { id: 'subway-1936', title: 'New Year\'s Day, 1936', year: '1936', text: 'The IND station at Broadway and Lafayette Street opened on January 1, 1936, as one of the first four stations on the Houston, Essex Street Line. It is an express stop with four tracks and two island platforms, and the D and F stop here at all times.', clue: 'Read the black name plate on the wall.', source: stn }, { r: 1.6 });
    k.egg(v(8.5, 6.1, -22), { id: 'subway-blue-band', title: 'Colour coded for the trip home', year: '1936', text: 'The station opened with white tile and a blue tile band, later renovated into a blue trim line on a black border with small BROADWAY captions in white on black. The IND coloured its stations so travelers heading away from Lower Manhattan could tell where they were, which is why the neighbouring stops wear different colours.', clue: 'Follow the blue line along the top of the tile wall.', source: stn }, { r: 1.6 });
    k.egg(v(-8.2, 0.3, 7), { id: 'subway-third-rail', title: '625 volts, under a board', text: 'The subway\'s contact rail, the third rail, needs 625 volts to run the trains. The running rails beside it sit at 4 feet 8 and a half inches apart, the same gauge as most major American railroads, and the system\'s 842 miles of track would reach from New York to Chicago if laid end to end.', clue: 'Look down past the yellow edge at the rail with a board over it.', source: { name: 'Subway FAQ: Facts and Figures, nycsubway.org', url: 'https://nycsubway.org/wiki/Subway_FAQ:_Facts_and_Figures' } }, { r: 1.6 });
    k.egg(v(-8.0, 1.2, -60), { id: 'subway-bumper-blocks', title: 'The express to nowhere', year: '1967', text: 'Before 1967 the two express tracks through this station ran on to Second Avenue and ended at bumper blocks east of that station. When the Chrystie Street connection opened in November 1967 they were turned south toward Grand Street, and the old storage track became the northbound M track.', clue: 'Walk to the far end of the platform and look down the tunnel.', source: stn }, { r: 1.6 });
    k.egg(v(1.5, 5.4, 11), { id: 'subway-uptown-transfer', title: 'A block north and another fare', year: '2012', text: 'A free transfer from here to the southbound 6 at Bleecker Street opened on May 19, 1957, and the station history calls the link purely coincidental. Riders bound for the uptown 6 had to leave, walk a block north and pay again until the uptown transfer fully opened on September 25, 2012.', clue: 'Stand under the red EXIT sign.', source: stn }, { r: 1.6 });
    k.egg(v(4, 2.4, -52.5), { id: 'subway-signal', title: 'Signal, downstairs', year: '1998', text: 'The station\'s artwork is Signal by Mel Chin, from 1998: stainless steel and glass sculptures with lights on the lower mezzanine, plus ceramic tiles on the platform and mezzanine walls. The Seneca artist Peter Jemison worked on it with him and made a mosaic of figures from the Six Nations of the Haudenosaunee confederacy.', clue: 'Go to the foot of the stairs up to the mezzanine.', source: stn }, { r: 1.6 });
    const mounts = corridorMounts({ pairs: 10, x: 9.0, z0: 1, pitch: 6.2, y: 3.5, width: 5, height: 2.9, inset: 4.5, style: 'steel' });
    for (let i = 0; i < 20; i++) {
      if (i % 2 === 0) continue;
      mounts[i].position.x = -14.9;
      mounts[i].rotation = PI / 2;
      mounts[i].target = v(-6.2, 3, mounts[i].position.z);
      mounts[i].width = 6;
      mounts[i].height = 3.4;
    }
    mounts.push({ position: v(-3, 3.6, ZC - L / 2 + 0.7), rotation: 0, target: v(-3, 3, ZC - L / 2 + 6), width: 5, height: 2.9, style: 'steel' });
    mounts.push({ position: v(-3, 3.6, 11.6), rotation: PI, target: v(-3, 3, 6), width: 5, height: 2.9, style: 'steel' });
    return { mounts, spawn: v(0, 3, 9), look: v(-1, 3.4, -30), eye: 3, bounds: [-7.6, 8.4, -62, 10.5], style: 'steel' };
  },
};
