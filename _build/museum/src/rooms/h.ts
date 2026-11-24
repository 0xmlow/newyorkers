/* Rooms 32 to 36: Doyers Street, Strivers' Row, Top of the Rock, the Frick garden court, South Street Seaport. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Kit, Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront } from './f';
import { glbs, anamorph } from './a';

const PI = Math.PI;

/* ---------- THE BIG UPGRADE, wave 2c (2026-11-23): helpers for rooms 32 to 36 ----------
   Poly Haven scans that hold a sensible colour until their maps land, painted signs in the house fonts, real
   window units with depth, and Firefly plates that appear when their file does. Everything is safe in node: the
   audits build these rooms with no DOM, so the scans fall back to the painted surfaces and no canvas is touched. */
const HAS_DOM = typeof window !== 'undefined' && typeof document !== 'undefined' && typeof HTMLImageElement !== 'undefined';
const texL = HAS_DOM ? new T.TextureLoader() : null;
const scans = new Map<string, { s: X.Surface; ready: Promise<unknown> }>();
/* A scan (CC0) from assets/museum/tex/<room>/<id>_{c,n,r}.webp with world UVs at real size (`metres` is one tile of
   the photo). Until all three maps arrive the surface wears `wait`, about the colour the scan will read as, so a
   phone never shows white walls or a mirror floor while it waits. */
function scan(k: Kit, room: string, id: string, metres: number, paint: () => X.Surface, p: Partial<T.MeshStandardMaterialParameters> & { normal?: number } = {}, wait = 0x888888) {
  if (!texL) return k.pbr(`w2c-${room}-${id}`, paint(), 1 / metres, p);
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
  const m = k.pbr(`w2c-${room}-${id}`, e.s, 1 / metres, p);
  if (!m.userData.w2c) {
    m.userData.w2c = true;
    const maps = { map: m.map, normalMap: m.normalMap, roughnessMap: m.roughnessMap }, tint = m.color.clone();
    m.map = m.normalMap = m.roughnessMap = null;
    m.color.set(wait);
    void e.ready.then(() => { Object.assign(m, maps); m.color.copy(tint); m.needsUpdate = true; });
  }
  return m;
}
const FONTS = ['900 40px "Archivo"', '800 40px "Archivo Expanded"', '700 40px "JetBrains Mono"', '400 40px "Permanent Marker"'];
/* A painted board: `draw` gets a canvas sized to the board and is run again once the house fonts have loaded. */
function board(k: Kit, w: number, h: number, x: number, y: number, z: number, rotY: number, draw: (g: CanvasRenderingContext2D, W: number, H: number) => void, o: { px?: number; lit?: boolean; double?: boolean; transparent?: boolean; rough?: number } = {}) {
  const W = o.px ?? 1024, H = Math.max(32, Math.round((W * h) / w));
  let m: T.Material;
  if (!HAS_DOM) m = k.flat(0x777777);
  else {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d')!;
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    t.anisotropy = 8;
    const paint = () => { g.clearRect(0, 0, W, H); g.textAlign = 'center'; g.textBaseline = 'middle'; draw(g, W, H); t.needsUpdate = true; };
    paint();
    if (document.fonts) void Promise.all(FONTS.map((f) => document.fonts.load(f))).then(paint).catch(() => undefined);
    const side = o.double ? T.DoubleSide : T.FrontSide;
    m = o.lit === false ? new T.MeshStandardMaterial({ map: t, roughness: o.rough ?? 0.7, side, transparent: !!o.transparent }) : new T.MeshBasicMaterial({ map: t, side, transparent: !!o.transparent });
  }
  const p = k.mesh(new T.PlaneGeometry(w, h), m, x, y, z, true);
  p.rotation.y = rotY;
  return p;
}
/* Fit a line of type to a width: the largest size up to `max` that fits `w` pixels. */
function fitFont(g: CanvasRenderingContext2D, text: string, font: (px: number) => string, max: number, w: number) {
  let px = max;
  g.font = font(px);
  while (px > 8 && g.measureText(text).width > w) { px -= 2; g.font = font(px); }
  return px;
}
/* A window with depth: a dark pane set in a painted frame with a sash bar, a stone sill and a lintel, all standing
   proud of the wall face at (x, y, z) whose outward normal is (nx, nz). Static boxes, merged per material. */
function win(k: Kit, x: number, y: number, z: number, nx: number, nz: number, w: number, h: number, frame: T.Material, pane: T.Material, stone?: T.Material, bars = 1) {
  const a = Math.atan2(-nz, nx);
  const put = (along: number, tall: number, deep: number, off: number, dy: number, dt: number, m: T.Material) => {
    const b = k.box(deep, tall, along, x + nx * off - nz * dt, y + dy, z + nz * off + nx * dt, m);
    b.rotation.y = a;
  };
  put(w, h, 0.04, 0.02, 0, 0, pane);
  put(w + 0.16, 0.09, 0.12, 0.06, h / 2 + 0.045, 0, frame);
  put(w + 0.16, 0.09, 0.12, 0.06, -h / 2 - 0.045, 0, frame);
  for (const s of [-1, 1]) put(0.09, h, 0.12, 0.06, 0, s * (w / 2 + 0.045), frame);
  put(w, 0.05, 0.07, 0.05, h * 0.04, 0, frame);
  if (bars > 1) for (let i = 1; i < bars; i++) put(0.04, h, 0.06, 0.05, 0, -w / 2 + (w * i) / bars, frame);
  if (stone) { put(w + 0.36, 0.1, 0.24, 0.1, -h / 2 - 0.14, 0, stone); put(w + 0.36, 0.24, 0.16, 0.08, h / 2 + 0.21, 0, stone); }
}
/* A Firefly plate that does not exist yet (FIREFLY_QUEUE.md): hidden, or showing `standIn`, until the file lands. */
function ffPlate(k: Kit, url: string, w: number, h: number, x: number, y: number, z: number, rotY: number, rotX = 0, standIn: T.Material | null = null, lit = false) {
  const o = k.mesh(new T.PlaneGeometry(w, h), standIn ?? new T.MeshBasicMaterial({ color: 0x000000 }), x, y, z, true);
  o.rotation.set(rotX, rotY, 0, 'YXZ');
  if (!standIn) o.visible = false;
  texL?.load(url, (t) => {
    if (!k.live) { t.dispose(); return; }
    t.colorSpace = T.SRGBColorSpace;
    t.anisotropy = 8;
    o.material = lit ? new T.MeshBasicMaterial({ map: t }) : new T.MeshStandardMaterial({ map: t, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -2 });
    o.visible = true;
  }, undefined, () => undefined);
  return o;
}
/* A quad from four world points (a b c d, counter clockwise seen from the front), static, with plain 0..1 UVs. */
function quad(k: Kit, a: T.Vector3, b: T.Vector3, c: T.Vector3, d: T.Vector3, m: T.Material, dynamic = false) {
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute([a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, d.x, d.y, d.z], 3));
  g.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.computeVertexNormals();
  return k.mesh(g, m, 0, 0, 0, dynamic);
}
/* Canvas stripes for awnings and the like. */
function stripes(k: Kit, a: string, b: string, n = 8) {
  if (!HAS_DOM) return k.flat(0x8a2a24, 0, 0.8, { side: T.DoubleSide });
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const g = c.getContext('2d')!;
  for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect((i * 256) / n, 0, 256 / n + 1, 64); }
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  return new T.MeshStandardMaterial({ map: t, roughness: 0.85, side: T.DoubleSide });
}

/* ---------------- 32 DOYERS STREET ---------------- */
export const doyers: RoomDef = {
  id: 'doyers',
  name: 'The bend',
  area: 'DOYERS STREET',
  mood: 'Lantern hour',
  color: '#e05a4a',
  description: 'The crooked lane in Chinatown under strings of lanterns, a dim sum hall up one flight, the census on every wall.',
  signatures: 'The sharp bend of the lane, tenements with fire escapes, red lanterns strung overhead, the painted mural on the bend, the upstairs banquet hall with round tables and a lazy susan.',
  build(k, ctx) {
    k.sky({ top: 0x2c2f5e, horizon: 0xd88a6a, ground: 0x2a2226, fog: 0.005, sun: { az: 4.5, el: 0.08, color: 0xffa060, size: 18 }, haze: 0.3, stars: 200, env: 0.7 });
    k.hemi(0xffd6c0, 0x2a2228, 0.65);
    k.sun(0xffb890, 1.4, -40, 20, 40, true, 60);
    /* THE BIG UPGRADE 2c: every wall and the street are Poly Haven scans at real size; three brick stocks so the
       tenements read as different buildings, painted brick in the mint and cream the lane is really painted. */
    const R = 'doyers';
    const asphalt = scan(k, R, 'worn_asphalt', 2.4, () => X.asphalt(0x24282d), { metalness: 0.04, color: 0xa8a49e }, 0x34363a),
      pav = scan(k, R, 'concrete_pavement', 1.8, () => X.pavers(0x8e8b84, 5), { color: 0xd8d2c8 }, 0x7c7a74),
      brick = scan(k, R, 'red_brick_03', 1.4, () => X.brick(0x6a3f36, 41), { color: 0xe2c0ae }, 0x6e4438),
      brick2 = scan(k, R, 'painted_brick', 1.8, () => X.brick(0x8a5a44, 42), { color: 0xcfe0cc }, 0x8a9a88),
      brick2b = scan(k, R, 'painted_brick', 1.8, () => X.brick(0x9a7a64, 44), { color: 0xf2d8bc }, 0xa89480),
      brick3 = scan(k, R, 'dark_brick_wall', 1.05, () => X.brick(0x54372f, 2), { color: 0xe8d0c4 }, 0x4a3530),
      panelW = scan(k, R, 'dark_paneled_wood', 1.4, () => X.planks(0x5a3a26, 6, 43), { color: 0xd8b8a0 }, 0x3e2a1e),
      cornice = k.pbr('nbCornice', X.plaster(0xb8ad9a, 3), 0.6),
      red = k.flat(0xc0302a, 0.1, 0.6),
      gold = k.pbr('doyersGold', X.gilt(0xd0a852), 2, { metalness: 0.8, roughness: 0.35 }),
      glass = k.glass(0xbfd6e2, 0.3, 0.08),
      carpet = k.pbr('banquetCarpet', X.carpet(0x6a1a22, 0xd9a84a), 0.5),
      linen = k.flat(0xe9dfcf, 0, 0.9),
      wood = panelW,
      iron = k.flat(0x1f242a, 0.75, 0.45),
      paneD = k.flat(0x141a20, 0.55, 0.1),
      paneL = k.flat(0x2a241c, 0.1, 0.35, { emissive: 0xffbb70, emissiveIntensity: 0.06 + 1.25 * k.night }),
      sashW = k.flat(0xe6e0d2, 0, 0.6),
      sashG = k.flat(0x2e4a3c, 0.25, 0.55),
      shopGlass = k.flat(0x0b1016, 0.85, 0.05, { emissive: 0xffc98a, emissiveIntensity: 0.02 + 0.5 * k.night, envMapIntensity: 1.6 }),
      castIron = k.flat(0x2a3a34, 0.55, 0.5);
    const awnings = [stripes(k, '#a8241e', '#efe6d6'), stripes(k, '#1f5a3e', '#efe6d6'), stripes(k, '#1d2f55', '#efe6d6'), stripes(k, '#a8241e', '#a8241e', 2)];
    const tenements = [brick, brick2, brick, brick2b, brick3];
    // the lane: two legs meeting at the bend, tenements both sides, the mural on the elbow
    const leg = (x0: number, z0: number, x1: number, z1: number, w: number) => {
      const len = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(x1 - x0, z1 - z0);
      const g = k.box(w, 0.3, len + w, (x0 + x1) / 2, -0.15, (z0 + z1) / 2, asphalt);
      g.rotation.y = ang;
      for (const s of [-1, 1]) { const p = k.box(3, 0.28, len + 3, (x0 + x1) / 2 + Math.cos(ang) * s * (w / 2 + 1.5), 0, (z0 + z1) / 2 - Math.sin(ang) * s * (w / 2 + 1.5), pav); p.rotation.y = ang; }
      return ang;
    };
    const a1 = leg(0, 14, 0, -18, 8);
    const a2 = leg(0, -18, -26, -40, 8);
    void a1;
    /* where the street level works hang: storefront iron, signs and doors keep clear of them */
    const laneMounts: [number, number][] = [];
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) laneMounts.push([s * 3.95, 8 - i * 6]);
    for (let i = 0; i < 3; i++) { const d = 6 + i * 7, cx = Math.sin(a2) * d, cz = -18 + Math.cos(a2) * d; for (const s of [-1, 1]) laneMounts.push([cx + Math.cos(a2) * s * 3.95, cz - Math.sin(a2) * s * 3.95]); }
    const clear = (x: number, z: number, r = 1.95) => laneMounts.every(([mx, mz]) => Math.hypot(mx - x, mz - z) > r);
    /* the trades on the lane: barbers, bakeries, herbs, the post office; invented, no real business named */
    const trades: [string, string][] = [['理髮', 'BARBER'], ['麵包', 'BAKERY'], ['藥材', 'HERBS'], ['雜貨', 'GROCERY'], ['旅行社', 'TRAVEL'], ['珠寶', 'JEWELRY'], ['印務', 'PRINTER'], ['燒臘', 'ROAST MEATS'], ['花店', 'FLOWERS'], ['影樓', 'PHOTO STUDIO'], ['郵局', 'POST OFFICE'], ['茶葉', 'TEA LEAVES'], ['麵家', 'NOODLES'], ['眼鏡', 'OPTICIAN'], ['裁縫', 'TAILOR'], ['書局', 'BOOKS']];
    const blades: [string, string, string][] = [['理髮', '#b0261f', '#ffe08a'], ['藥材行', '#1f5a3e', '#f4e2b0'], ['茶樓', '#b0261f', '#ffe08a'], ['旅社', '#f2e6cc', '#a8241e'], ['麵家', '#1d2f55', '#ffd27a'], ['書局', '#b0261f', '#ffffff']];
    let tradeN = 0, bladeN = 0;
    // tenement rows along both legs
    const row = (x0: number, z0: number, ang: number, n: number, side: 1 | -1, seed: number, gap = -1) => {
      const rnd = X.mulberry(seed);
      const nx = -Math.cos(ang) * side, nz = Math.sin(ang) * side, tx = Math.sin(ang), tz = Math.cos(ang);
      for (let i = 0; i < n; i++) {
        const d = i * 8 + 4, cx = x0 + tx * d - nx * 8, cz = z0 + tz * d - nz * 8;
        const h = 14 + Math.floor(rnd() * 3) * 3, m = tenements[Math.floor(rnd() * tenements.length)];
        const fx = cx + nx * 4, fz = cz + nz * 4;
        if (i === gap) {
          /* the slot up to the banquet hall: the building splits either side of a 2.6 m passage */
          for (const [t0, t1] of [[-3.9, -1.3], [1.3, 3.9]]) { const tc = (t0 + t1) / 2, b = k.box(8, h, t1 - t0, cx + tx * tc, h / 2, cz + tz * tc, m); b.rotation.y = ang; }
        } else { const b = k.box(8, h, 7.8, cx, h / 2, cz, m); b.rotation.y = ang; }
        /* a bracketed cornice and a frieze band, not a slab */
        { const c = k.box(8.6, 0.5, 8.3, cx + nx * 0.15, h - 0.05, cz + nz * 0.15, cornice); c.rotation.y = ang; const f = k.box(0.12, 0.5, 7.8, fx + nx * 0.06, h - 0.75, fz + nz * 0.06, cornice); f.rotation.y = ang; }
        for (let t = -3.6; t <= 3.61; t += 0.9) { const b = k.box(0.34, 0.42, 0.12, fx + nx * 0.17 + tx * t, h - 0.5, fz + nz * 0.17 + tz * t, cornice); b.rotation.y = ang; }
        /* the windows: painted sash, dark glass that lights at night, stone sill and lintel */
        const sash = rnd() > 0.5 ? sashW : sashG;
        for (let y = 6.4; y < h - 1.6; y += 2.7) for (const dt of [-2.6, 0, 2.6]) {
          if (i === gap && Math.abs(dt) < 1.4) continue;
          win(k, fx + tx * dt, y, fz + tz * dt, nx, nz, 1.1, 1.65, sash, rnd() > 0.6 ? paneL : paneD, cornice);
        }
        if (i % 2 === 0) k.prop('fire_escape', cx + nx * 5.1, 6.8 + rnd() * 3, cz + nz * 5.1, { height: 3.2, rotY: ang + (side > 0 ? PI / 2 : -PI / 2) });
        if (i === gap) continue;
        /* the storefront: dark shop glass behind the works, cast iron piers, a lit sign band and a striped awning */
        { const g = k.box(0.06, 3.4, 7.2, fx + nx * 0.03, 2.3, fz + nz * 0.03, shopGlass); g.rotation.y = ang; }
        for (const t of [-3.8, 3.8]) if (clear(fx + tx * t, fz + tz * t)) { const p = k.box(0.18, 4.4, 0.34, fx + nx * 0.09 + tx * t, 2.2, fz + nz * 0.09 + tz * t, castIron); p.rotation.y = ang; }
        { const p = k.box(0.2, 0.22, 7.9, fx + nx * 0.1, 4.28, fz + nz * 0.1, castIron); p.rotation.y = ang; }
        const [zh, en] = trades[tradeN++ % trades.length];
        board(k, 6.4, 0.62, fx + nx * 0.13, 4.72, fz + nz * 0.13, Math.atan2(nx, nz), (g, W, H) => {
          g.fillStyle = '#7e1712'; g.fillRect(0, 0, W, H); g.strokeStyle = '#e8c46a'; g.lineWidth = 6; g.strokeRect(8, 8, W - 16, H - 16);
          g.fillStyle = '#ffe08a'; g.font = `900 ${H * 0.62}px "Archivo", "PingFang TC", "Heiti TC", sans-serif`; g.fillText(zh, W * 0.3, H * 0.54);
          g.fillStyle = '#f6ead0'; fitFont(g, en, (px) => `800 ${px}px "Archivo Expanded", "Archivo", sans-serif`, H * 0.4, W * 0.4); g.fillText(en, W * 0.72, H * 0.55);
        }, { px: 1024 });
        /* the awning: a sloped striped canvas and its valance, built in world space so it merges */
        const aw = awnings[Math.floor(rnd() * awnings.length)], half = 3.2, top = 5.62, out = 1.25, low = 5.08;
        const p = (t: number, o: number, y: number) => v(fx + tx * t + nx * o, y, fz + tz * t + nz * o);
        quad(k, p(-half, out, low), p(half, out, low), p(half, 0.06, top), p(-half, 0.06, top), aw);
        quad(k, p(-half, out, low - 0.3), p(half, out, low - 0.3), p(half, out, low), p(-half, out, low), aw);
        for (const s of [-1, 1]) k.beam(p(s * half, 0.06, top - 0.75), p(s * half, out, low), 0.018, iron, 4);
        /* a blade sign on every other building, projecting over the lane */
        if (rnd() > 0.45) {
          const [txt, bg, fg] = blades[bladeN++ % blades.length], t = 2.9, bh = 0.7 * txt.length + 0.6;
          const c = p(t, 0.95, 8.4 + bh / 2);
          board(k, 0.95, bh, c.x, c.y, c.z, Math.atan2(tx, tz), (g, W, H) => {
            g.fillStyle = bg; g.fillRect(0, 0, W, H); g.strokeStyle = fg; g.lineWidth = 10; g.strokeRect(14, 14, W - 28, H - 28);
            g.fillStyle = fg; g.font = `900 ${W * 0.62}px "PingFang TC", "Heiti TC", "Archivo", sans-serif`;
            [...txt].forEach((ch, j) => g.fillText(ch, W / 2, (H * (j + 0.5 + 0.3)) / (txt.length + 0.6)));
          }, { px: 256, double: true });
          k.beam(p(t, 0.05, 8.4 + bh - 0.1), p(t, 1.5, 8.4 + bh - 0.1), 0.03, iron, 5);
          k.beam(p(t, 0.05, 8.3), p(t, 1.5, 8.3), 0.03, iron, 5);
        }
      }
    };
    row(0, 14, PI, 4, 1, 1, 2);
    row(0, 14, PI, 4, -1, 2);
    row(0, -18, a2, 4, 1, 3);
    row(0, -18, a2, 4, -1, 4);
    // the wall at the elbow: a painted mural that is one of the works
    k.box(10, 16, 1, 6, 8, -24, brick3);
    /* red lanterns strung across both legs: a real lantern shape (ribbed body, gilt caps, tassel), one draw per part,
       swaying a little. Nine lights for the strings instead of ninety eight. */
    const lanterns: [number, number, number][] = [];
    for (let d = 2; d < 30; d += 4) {
      for (const [x0, z0, ang] of [[0, 14, PI], [0, -18, a2]] as const) {
        const cx = x0 + Math.sin(ang) * d, cz = z0 + Math.cos(ang) * d;
        const ax = cx + Math.cos(ang) * 4, az = cz - Math.sin(ang) * 4, bx = cx - Math.cos(ang) * 4, bz = cz + Math.sin(ang) * 4;
        k.curve([v(ax, 6.6, az), v((ax + cx) / 2, 6.25, (az + cz) / 2), v(cx, 6.15, cz), v((bx + cx) / 2, 6.25, (bz + cz) / 2), v(bx, 6.6, bz)], 0.014, iron, 16);
        for (let j = -2; j <= 2; j++) { const t = (j + 3) / 6; lanterns.push([ax + (bx - ax) * t, 6.1 - (2 - Math.abs(j)) * 0.05, az + (bz - az) * t]); }
        if ((d / 4) % 2 === 0) k.point(cx, 5.6, cz, 0xff7a55, 7, 9);
      }
    }
    {
      const prof: T.Vector2[] = [];
      for (let i = 0; i <= 12; i++) { const t = i / 12; prof.push(new T.Vector2(0.06 + 0.3 * Math.sin(t * PI) ** 0.8, -0.3 + 0.6 * t)); }
      const body = new T.LatheGeometry(prof, 14), cap = new T.CylinderGeometry(0.12, 0.14, 0.07, 14), tas = new T.CylinderGeometry(0.035, 0.02, 0.34, 6);
      const lit = new T.MeshStandardMaterial({ color: 0xc8261c, emissive: 0xff3a12, emissiveIntensity: 0.35 + 1.4 * k.night, roughness: 0.65 });
      const capM = k.flat(0xc9a24a, 0.8, 0.35), tasM = k.flat(0xb0181a, 0, 0.8);
      const parts: [T.BufferGeometry, T.Material, number][] = [[body, lit, 0], [cap, capM, 0.33], [cap, capM, -0.33], [tas, tasM, -0.55]];
      const ms = parts.map(([g, m]) => k.instances(g, m, lanterns.map(() => new T.Matrix4())));
      const M = new T.Matrix4(), Q = new T.Quaternion(), E = new T.Euler(), P = new T.Vector3(), S = new T.Vector3(1, 1, 1), O = new T.Vector3();
      const pose = (t: number) => lanterns.forEach(([x, y, z], i) => {
        E.set(Math.sin(t * 0.9 + i) * 0.05, 0, Math.cos(t * 0.7 + i * 1.7) * 0.06);
        Q.setFromEuler(E);
        parts.forEach(([, , dy], j) => { O.set(0, dy - 0.05, 0).applyQuaternion(Q); P.set(x, y + 0.05, z).add(O); ms[j].setMatrixAt(i, M.compose(P, Q, S)); ms[j].instanceMatrix.needsUpdate = true; });
      });
      pose(0);
      for (const o of ms) o.frustumCulled = false;
      if (!ctx.reduced) k.ticks.push((t) => pose(t));
    }
    k.prop('hydrant', 5.4, 0, 8, { height: 1.1, keepOut: 0.5 });
    k.prop('mailbox', -5.4, 0, -4, { height: 1.5, rotY: PI / 2, keepOut: 0.6 });
    k.prop('lantern', 5.2, 0, -12, { height: 1.0 });
    /* the real signs: the green street sign at the Pell Street end, the tea parlour on the first leg near the bend */
    k.sign('DOYERS ST', 2.2, 0.4, 4.2, 4.2, 13, '#1f6a3a', '#ffffff', 90, -PI / 2, { border: true });
    k.sign('南華茶室  NOM WAH TEA PARLOR', 4.4, 0.8, 3.9, 5.2, -12, '#b0261f', '#ffe08a', 90, -PI / 2, { border: true });
    /* the arcade door on the inside of the bend: a dark steel door and a lit transom over the stair down */
    k.box(0.12, 2.3, 1.4, -3.96, 1.15, -15.5, iron); k.box(0.1, 0.35, 1.4, -3.95, 2.5, -15.5, k.glow(0xffd8a0));
    /* THE TRICK (one a room): THE BLOODY ANGLE painted flat on the asphalt, stretched so it stands up as a sign only
       from where you come in. Step off the line and it smears back into road paint. */
    anamorph(k, 'THE BLOODY ANGLE', 0, 12, 3, 0, 9, 5.6, 1.45, '#f2d56b', 150);
    /* the 2021 Rice Terraces pavement mural on the second leg: a Firefly plate, invisible until the file lands */
    { const cx = Math.sin(a2) * 15, cz = -18 + Math.cos(a2) * 15; ffPlate(k, 'assets/museum/tex/doyers/ff_rice_terraces.webp', 6.4, 26, cx, 0.015, cz, a2, -PI / 2); }
    /* easter eggs: the real lane */
    k.egg(v(3.6, 3.6, 13), { id: 'doyers-name', title: 'A distiller\'s lane', year: '1791', text: 'The street is named for Hendrik Doyers, an 18th century Dutch immigrant who bought property facing the Bowery in 1791. He ran a distillery at 6 Doyers and the Plough and Harrow tavern near the Bowery corner. The lane bends because it follows the old route of a stream, and the whole thing is only about 200 feet long.', clue: 'Look up at the green street sign where the lane begins.', source: { name: 'Doyers Street, Wikipedia', url: 'https://en.wikipedia.org/wiki/Doyers_Street' } }, { r: 1.6 });
    k.egg(v(0, 2.2, -18), { id: 'doyers-bloody-angle', title: 'The Bloody Angle', year: '1994', text: 'Early in the twentieth century the bend became known as the Bloody Angle, or Murder Alley, for the tong killings that went on into the 1930s. Hatchets were used so often that they gave the language the term hatchet man. In 1994 law enforcement officials said more people had died violently here than at any other intersection in the United States.', clue: 'Stand right on the elbow of the lane, where you cannot see either end.', source: { name: 'Doyers Street, Wikipedia', url: 'https://en.wikipedia.org/wiki/Doyers_Street' } }, { r: 1.6 });
    k.egg(v(3.2, 4.6, -12), { id: 'doyers-nom-wah', title: 'Since 1920', year: '1920', text: 'Nom Wah Tea Parlor opened in 1920 at 15 Doyers and moved next door to 13 Doyers in 1968, and it is called the oldest continuously running restaurant in Manhattan\'s Chinatown. Ed and May Choy ran it mostly as a bakery from the 1940s; their nephew Wally Tang started there at sixteen in 1950 and bought it in 1976. His nephew Wilson Tang, a former investment banker, took over in 2010 and swapped the carts for made to order dim sum.', clue: 'Find the red tea parlour sign just before the bend.', source: { name: 'Nom Wah Tea Parlor, Wikipedia', url: 'https://en.wikipedia.org/wiki/Nom_Wah_Tea_Parlor' } }, { r: 1.6 });
    k.egg(v(-3.4, 0.9, -15.5), { id: 'doyers-tunnel', title: 'The way out underground', year: '1909', text: 'A tunnel ran from the Chinese theater on Doyers to a boardinghouse on Chatham Square. In 1909 the actor Ah Foon, who had taunted a rival gang from the stage, was walked out through it after a show; he reached his apartment safely but was shot on the landing that night. The passage later became an underground arcade of feng shui shops, employment and travel agencies, and one entrance is still in the middle of the street.', clue: 'Look low on the inside of the bend for a door that goes down.', source: { name: 'The Doyers Street Tunnel in Chinatown, Untapped Cities', url: 'https://untappedcities.com/2012/11/26/the-doyers-street-tunnel-in-chinatown-the-bloody-angle/' } }, { r: 1.6 });
    k.egg(v(0, 6.2, 2), { id: 'doyers-lanterns', title: 'Light Up Chinatown', year: '2021', text: 'In September 2021 lanterns were strung over the lane as part of the Light Up Chinatown initiative, alongside a tribute mural to the photographer Corky Lee. The same year the pavement itself was painted with Rice Terraces, a 4,800 square foot mural by Dasic Fernández. In 2017 the street had been made pedestrian only by day for a one month pilot.', clue: 'Look up at the strings of red lanterns over the first leg.', source: { name: 'Doyers Street, Wikipedia', url: 'https://en.wikipedia.org/wiki/Doyers_Street' } }, { r: 1.6 });
    k.egg(v(-23.8, 2.4, -38.2), { id: 'doyers-theater', title: 'The first Chinese theater', year: '1893', text: 'From 1893 to 1911, 5 to 7 Doyers held the city\'s first Chinese language theater, later turned into a rescue mission for the homeless. In 1903 it staged a fundraiser for the Jewish victims of the Kishinev massacre. In 1905 a shooting in the packed house, which held about 400 people, killed three.', clue: 'Walk on down the second leg of the lane, toward the Bowery end.', source: { name: 'Doyers Street, Wikipedia', url: 'https://en.wikipedia.org/wiki/Doyers_Street' } }, { r: 1.6 });
    k.egg(v(0, 0.4, 2), { id: 'doyers-anamorph', title: 'Paint that stands up', year: '1533', text: 'THE BLOODY ANGLE is painted flat on the road and stretched along the lane, so that it rises off the asphalt as a sign only from the spot where you came in. Take one step aside and it smears back into road paint. The trick is anamorphosis, the same one that hides a skull across the floor of Hans Holbein\'s The Ambassadors of 1533.', clue: 'Go back to where you came in and look down the lane at the road.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.6 });
    /* the banquet hall up one flight. It used to sit over the second leg of the lane, so its floor swallowed the street
       there and seven works hung under it; it now stands behind the west row, up a stair slot between two tenements. */
    const HX = -22, HZ = -3, HW = 18, HD = 22, HY = 4.6, SZ = -7;
    for (let i = 0; i < 14; i++) k.box(0.62, 0.33, 2.4, -4.31 - i * 0.62, 0.165 + i * 0.33, SZ, wood);
    k.box(8.8, 0.06, 0.12, -8.6, 1.05, SZ - 1.25, gold); k.box(8.8, 0.06, 0.12, -8.6, 1.05, SZ + 1.25, gold);
    board(k, 2.5, 0.75, -3.92, 4.9, SZ, PI / 2, (g, W, H) => {
      g.fillStyle = '#8a1712'; g.fillRect(0, 0, W, H); g.strokeStyle = '#e8c46a'; g.lineWidth = 8; g.strokeRect(10, 10, W - 20, H - 20);
      g.fillStyle = '#ffe08a'; g.font = `900 ${H * 0.42}px "PingFang TC", "Heiti TC", "Archivo", sans-serif`; g.fillText('金龍大酒樓', W / 2, H * 0.36);
      g.fillStyle = '#f6ead0'; fitFont(g, 'BANQUET HALL  UPSTAIRS', (px) => `800 ${px}px "Archivo Expanded", "Archivo", sans-serif`, H * 0.22, W * 0.86); g.fillText('BANQUET HALL  UPSTAIRS', W / 2, H * 0.74);
    }, { px: 768 });
    k.point(-5, 3.6, SZ, 0xffc890, 6, 8);
    /* the hall: a brick building under it, lacquer red walls over a dark wood dado, a coffered ceiling */
    const lacquer = k.flat(0x7a1a16, 0.05, 0.45), beamM = k.flat(0x2a120e, 0.1, 0.5);
    k.box(HW, HY - 0.4, HD, HX, (HY - 0.4) / 2, HZ, brick);
    k.box(HW, 0.4, HD, HX, HY - 0.2, HZ, carpet);
    k.box(HW, 0.4, HD, HX, HY + 6.2, HZ, lacquer);
    k.box(HW + 0.6, 14 - HY - 6.4, HD + 0.6, HX, (14 + HY + 6.4) / 2, HZ, brick);
    for (let x = HX - HW / 2 + 1.5; x < HX + HW / 2; x += 3) k.box(0.28, 0.34, HD - 0.4, x, HY + 5.83, HZ, beamM);
    for (let z = HZ - HD / 2 + 1.83; z < HZ + HD / 2; z += 3.67) k.box(HW - 0.4, 0.3, 0.28, HX, HY + 5.85, z, beamM);
    k.box(0.4, 6.2, HD, HX - HW / 2, HY + 3, HZ, lacquer);
    k.box(HW, 6.2, 0.4, HX, HY + 3, HZ - HD / 2, lacquer);
    k.box(HW, 6.2, 0.4, HX, HY + 3, HZ + HD / 2, lacquer);
    /* the east wall, open where the stair arrives */
    const e0 = SZ - 1.3, e1 = SZ + 1.3, ex = HX + HW / 2;
    k.box(0.4, 6.2, e0 - (HZ - HD / 2), ex, HY + 3, (HZ - HD / 2 + e0) / 2, lacquer);
    k.box(0.4, 6.2, HZ + HD / 2 - e1, ex, HY + 3, (HZ + HD / 2 + e1) / 2, lacquer);
    k.box(0.4, 6.2 - 2.9, 2.6, ex, HY + 2.9 + (6.2 - 2.9) / 2, SZ, lacquer);
    for (const [x, z, w, d] of [[HX - HW / 2 + 0.23, HZ, 0.06, HD - 0.4], [HX, HZ - HD / 2 + 0.23, HW - 0.4, 0.06], [HX, HZ + HD / 2 - 0.23, HW - 0.4, 0.06]]) { k.box(w, 1.3, d, x, HY + 0.65, z, panelW); k.box(w === 0.06 ? 0.1 : w, 0.08, w === 0.06 ? d : 0.1, x, HY + 1.34, z, gold); k.box(w === 0.06 ? 0.08 : w, 0.12, w === 0.06 ? d : 0.08, x, HY + 5.55, z, gold); }
    for (const s of [-1, 1]) k.block(HX + s * HW / 2 - 0.3, HX + s * HW / 2 + 0.3, HZ - HD / 2, HZ + HD / 2);
    k.blocks.pop();
    k.block(ex - 0.3, ex + 0.3, HZ - HD / 2, e0);
    k.block(ex - 0.3, ex + 0.3, e1, HZ + HD / 2);
    k.block(HX - HW / 2, HX + HW / 2, HZ - HD / 2 - 0.3, HZ - HD / 2 + 0.3);
    k.block(HX - HW / 2, HX + HW / 2, HZ + HD / 2 - 0.3, HZ + HD / 2 + 0.3);
    /* three round tables down the hall: linen, a glass lazy susan with a real tea set on it, eight carved armchairs
       each (Poly Haven), a Chinese chandelier over each (Poly Haven) */
    const tables: [number, number][] = [[HX + 2.5, HZ - 5], [HX + 2.5, HZ + 2], [HX + 2.5, HZ + 9]].map(([x, z]) => [x, Math.min(z, HZ + HD / 2 - 3.4)] as [number, number]);
    tables[2][1] = HZ + 8.4;
    const chairs: [number, number, number, number][] = [], sets: [number, number, number, number][] = [], lamps: [number, number, number, number][] = [];
    for (const [x, z] of tables) {
      k.cyl(2.2, 0.08, x, HY + 1.0, z, linen, 2.2, 40);
      k.cyl(2.24, 0.5, x, HY + 0.72, z, linen, 2.24, 40);
      k.cyl(0.4, 1.0, x, HY + 0.5, z, wood, 0.6, 12);
      k.cyl(1.1, 0.05, x, HY + 1.065, z, glass, 1.1, 32);
      for (let j = 0; j < 8; j++) { const a = (j / 8) * PI * 2; k.cyl(0.24, 0.03, x + Math.cos(a) * 1.75, HY + 1.055, z + Math.sin(a) * 1.75, k.flat(0xf6f2ea, 0, 0.3), 0.2, 16); chairs.push([x + Math.cos(a) * 2.75, HY, z + Math.sin(a) * 2.75, Math.atan2(-Math.cos(a), -Math.sin(a))]); }
      sets.push([x, HY + 1.09, z, 0.4]);
      lamps.push([x, HY + 5.65 - 1.6, z, 0]);
      k.keepOut.push({ x, z, r: 3.2 });
      k.point(x, HY + 3.9, z, 0xffd2a0, 6, 9);
    }
    void red;
    glbs(k, 'doyers/ph_chinese_armchair', { height: 1.95 }, chairs);
    glbs(k, 'doyers/ph_tea_set_01', { width: 1.25 }, sets);
    glbs(k, 'doyers/ph_chinese_chandelier', { height: 1.6 }, lamps);
    glbs(k, 'doyers/ph_chinese_screen_panels', { height: 2.6 }, [[ex - 1.0, HY, HZ - HD / 2 + 1.4, -PI / 2]]);
    k.keepOut.push({ x: ex - 1.0, z: HZ - HD / 2 + 1.4, r: 1.4 });
    board(k, 9, 0.85, HX, HY + 5.0, HZ - HD / 2 + 0.24, 0, (g, W, H) => {
      g.fillStyle = '#8a1712'; g.fillRect(0, 0, W, H); g.strokeStyle = '#e8c46a'; g.lineWidth = 8; g.strokeRect(10, 10, W - 20, H - 20);
      g.fillStyle = '#ffe08a'; g.font = `900 ${H * 0.6}px "PingFang TC", "Heiti TC", "Archivo", sans-serif`; g.fillText('金龍大酒樓', W * 0.27, H * 0.53);
      g.fillStyle = '#f6ead0'; fitFont(g, 'GOLDEN DRAGON  ·  DIM SUM ALL DAY', (px) => `800 ${px}px "Archivo Expanded", "Archivo", sans-serif`, H * 0.34, W * 0.5); g.fillText('GOLDEN DRAGON  ·  DIM SUM ALL DAY', W * 0.7, H * 0.55);
    }, { px: 2048 });
    /* the dragon and phoenix panel between the two works on the far wall: a Firefly plate (queued), gold leaf stand in */
    ffPlate(k, 'assets/museum/tex/doyers/ff_dragon_phoenix.webp', 4.6, 3.0, HX, HY + 3.0, HZ - HD / 2 + 0.23, 0, 0, k.pbr('doyersGoldLeaf', X.gilt(0xb8903e), 1.2, { metalness: 0.7, roughness: 0.4 }));
    k.censusWall({ x: HX, y: HY + 3.4, z: HZ + HD / 2 - 0.22, rotY: PI, cols: 26, rows: 5, tile: 0.6, gap: 0.05, start: ctx.wallStart(1700, 130), pieces: ctx.all, backing: wood });
    // the works: the mural on the elbow, storefront frames along the lane, the banquet hall walls
    const mounts: Mount[] = [];
    mounts.push({ position: v(6, 8, -23.45), rotation: 0, target: v(0, 3, -10), width: 9.4, height: 9, style: 'none', wash: false });
    for (let i = 0; i < 4; i++) { const z = 8 - i * 6; for (const s of [-1, 1]) mounts.push({ position: v(s * 3.95, 3.2, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 0.6, 3, z), width: 3.2, height: 2.0, style: 'black' }); }
    for (let i = 0; i < 3; i++) { const d = 6 + i * 7; const cx = Math.sin(a2) * d, cz = -18 + Math.cos(a2) * d; for (const s of [-1, 1]) mounts.push({ position: v(cx + Math.cos(a2) * s * 3.95, 3.2, cz - Math.sin(a2) * s * 3.95), rotation: a2 + (s > 0 ? -PI / 2 : PI / 2), target: v(cx + Math.cos(a2) * s * 0.5, 3, cz - Math.sin(a2) * s * 0.5), width: 3.2, height: 2.0, style: 'black' }); }
    /* the hall: three on the west wall, two either side of the dragon and phoenix on the south wall */
    for (let i = 0; i < 3; i++) { const z = HZ - 7 + i * 7; mounts.push({ position: v(HX - HW / 2 + 0.24, HY + 3.3, z), rotation: PI / 2, target: v(HX - HW / 2 + 4.2, HY + 3, z), width: 3.8, height: 2.2, style: 'gilt', wash: false }); }
    for (const x of [HX - 5, HX + 5]) mounts.push({ position: v(x, HY + 3.3, HZ - HD / 2 + 0.24), rotation: 0, target: v(x, HY + 3, HZ - HD / 2 + 3.6), width: 4.0, height: 2.4, style: 'gilt', wash: false });
    return { mounts, spawn: v(0, 3, 12), look: v(0, 4, -20), eye: 3, bounds: [-36, 10, -52, 16], style: 'black', floorY: (x, z) => {
      if (x < HX + HW / 2 && x > HX - HW / 2 && z > HZ - HD / 2 && z < HZ + HD / 2) return HY;
      if (Math.abs(z - SZ) < 1.3 && x <= -4 && x >= HX + HW / 2) return Math.min(HY, Math.max(0, ((-4 - x) / 8.7) * HY));
      return 0;
    } };
  },
};

/* ---------------- 33 STRIVERS' ROW ---------------- */
export const strivers: RoomDef = {
  id: 'strivers',
  name: 'The parlour floor',
  area: 'STRIVERS\' ROW',
  mood: 'Sunday in Harlem',
  color: '#c98a6a',
  description: 'A block of Harlem row houses, and inside one of them the parlour floor: pocket doors, a piano, the census in gilt on the walls.',
  signatures: 'The unbroken row of yellow brick with white limestone trim and stoops, the alley gate that says walk your horses, the tree lined block, the parlour with its bay window, marble mantel, pocket doors and pressed tin ceiling.',
  build(k, ctx) {
    k.sky({ top: 0x7fa8d6, horizon: 0xeae7de, ground: 0x5f5a52, fog: 0.0028, sun: { az: 1.4, el: 0.55, color: 0xfff1d8, size: 14 }, env: 0.85 });
    k.hemi(0xfff4e6, 0x4a4238, 0.85);
    k.sun(0xffefd6, 2.2, 40, 50, 30, true, 70);
    /* THE BIG UPGRADE 2c: the row in scanned yellow brick and white limestone (Price and Luce's side of 138th), the
       parlour in scanned herringbone oak, plaster, dark panelling and marble. */
    const R = 'strivers';
    const buff = scan(k, R, 'yellow_bricks', 2, () => X.brick(0xb99a72, 45), { color: 0xffffff }, 0xb99a72),
      cornice = scan(k, R, 'white_sandstone_blocks_02', 2, () => X.plaster(0xb8ad9a, 35), { color: 0xfff8ee }, 0xd6cebe),
      iron = k.flat(0x1f242a, 0.75, 0.45),
      glass = k.glass(0xbfd6e2, 0.3, 0.08),
      oak = scan(k, R, 'herringbone_parquet', 3.4, () => X.planks(0x7a5334, 8, 46), { roughness: 0.55 }, 0x7a5334),
      plaster = scan(k, R, 'white_plaster_rough_01', 1.2, () => X.plaster(0xe9dccb, 36), { color: 0xf4e6d0 }, 0xe2d4c0),
      panelW = scan(k, R, 'dark_paneled_wood', 1.4, () => X.planks(0x4a2c1c, 4, 49), { color: 0xd8b8a0 }, 0x3e2a1e),
      tin = k.pbr('tinCeilingP', X.ashlar(0xe6e2d8, 15, 6), 1.6, { metalness: 0.3, roughness: 0.62, color: 0xd8d0c0 }),
      marble = scan(k, R, 'marble_01', 1.5, () => X.marble(0xe8e4dc, 0x8a8478, 11), { roughness: 0.3 }, 0xe4e0d8),
      wood = k.pbr('pianoBlack', X.planks(0x1a1a1c, 3, 47), 2, { roughness: 0.25 }),
      sashW = k.flat(0xf1ede4, 0, 0.55),
      paneD = k.flat(0x182028, 0.6, 0.08),
      paneL = k.flat(0x2a241c, 0.1, 0.35, { emissive: 0xffc27a, emissiveIntensity: 0.05 + 1.2 * k.night }),
      doorM = k.pbr('rowDoor', X.planks(0x3a2418, 3, 48), 1.2, { roughness: 0.4 }),
      brass = k.flat(0xc9a24a, 0.85, 0.3);
    // the block: a service alley behind, the tree lined street in front
    street(k, { w: 16, len: 120, z: -10 });
    const rnd = X.mulberry(33);
    for (let i = 0; i < 12; i++) { const z = 40 - i * 7; k.tree(-12.4, 0, z + 3, { kind: 'round', h: 6 + rnd() * 3, r: 3 + rnd(), leaf: 0x3f6b36, seed: i }); }
    /* the near side trees stood at x = 12.6, inside the house fronts (which start at HX = 12.4); they belong at the kerb */
    for (let i = 0; i < 6; i++) k.tree(8.8, 0, 34 - i * 12, { kind: 'round', h: 6 + rnd() * 3, r: 3 + rnd(), leaf: 0x3f6b36, seed: 30 + i });
    /* the row: eleven houses, every one with a stoop and a bay. Each block face of the real district is one architect's
       uniform row, so this is the north side of West 138th, Bruce Price and Clarence Luce: yellow brick with white
       limestone trim, not the old brownstone and buff alternation. */
    const HX = 12.4, PZ = 40 - 3 * 7.4, PX = HX + 7, PW = 13, PD = 20, PY = 3.2;
    for (let i = 0; i < 11; i++) {
      const z = 40 - i * 7.4, m = buff, h = 16 + (i % 2) * 1.2;
      /* Houses 3 to 5 hold the parlour. They were solid boxes, so the parlour inside them was filled with brick and
         every view of it was the back of the next house. Now they are shells: the front wall, the floor under the
         parlour, the storeys over it, with a door in the fourth house's front. */
      if (i >= 3 && i <= 5) {
        const top = PY + 5.35;
        if (i === 3) {
          for (const [z0, z1] of [[z - 3.6, z - 2.3], [z - 0.9, z + 3.6]]) k.box(0.4, h, z1 - z0, HX + 0.2, h / 2, (z0 + z1) / 2, m);
          k.box(0.4, PY, 1.4, HX + 0.2, PY / 2, z - 1.6, m);
          k.box(0.4, h - PY - 2.8, 1.4, HX + 0.2, (h + PY + 2.8) / 2, z - 1.6, m);
        } else k.box(0.4, h, 7.2, HX + 0.2, h / 2, z, m);
        k.box(13.6, PY - 0.3, 7.2, HX + 7.2, (PY - 0.3) / 2, z, m);
        k.box(13.6, h - top, 7.2, HX + 7.2, (h + top) / 2, z, m);
      } else k.box(14, h, 7.2, HX + 7, h / 2, z, m);
      /* limestone: a water table at the parlour floor, sill courses, a bracketed cornice */
      k.box(0.16, 0.34, 7.2, HX - 0.06, PY, z, cornice);
      k.box(0.12, 0.3, 7.2, HX - 0.04, 7.8, z, cornice); k.box(0.12, 0.3, 7.2, HX - 0.04, 11.0, z, cornice);
      k.moulding([[0, 0], [0.8, 0], [0.9, 0.25], [0.6, 0.45], [0.7, 0.7], [0.3, 0.9], [0, 1.0]], 7.4, HX - 0.05, h - 0.6, z, cornice, 0);
      for (let t = -3.3; t <= 3.31; t += 1.1) k.box(0.5, 0.5, 0.16, HX - 0.25, h - 0.85, z + t, cornice);
      /* the windows: white sash in limestone surrounds, dark glass that lights up at night */
      for (let f = 0; f < 3; f++) { const y = 9.2 + f * 3.2; if (y > h - 1.6) continue; for (const dz of [-2.4, 0, 2.4]) win(k, HX, y, z + dz, -1, 0, 1.05, 1.95, sashW, rnd() > 0.65 ? paneL : paneD, cornice, 2); }
      /* the parlour bay: a limestone faced box with a wide window on its front and narrow ones on its sides */
      k.box(1.4, 3.8, 2.4, HX - 0.7, PY + 1.9, z + 1.4, m);
      k.box(1.6, 0.3, 2.6, HX - 0.7, PY + 3.95, z + 1.4, cornice);
      k.box(1.5, 0.24, 2.5, HX - 0.7, PY + 0.1, z + 1.4, cornice);
      win(k, HX - 1.4, PY + 2.0, z + 1.4, -1, 0, 1.6, 2.3, sashW, i >= 3 && i <= 5 ? paneD : rnd() > 0.5 ? paneL : paneD, undefined, 2);
      for (const s of [-1, 1]) win(k, HX - 0.7, PY + 2.0, z + 1.4 + s * 1.2, 0, s, 0.7, 2.3, sashW, paneD);
      k.prop('stoop', HX - 1.9, 0, z - 1.6, { height: 2.6, rotY: -PI / 2 });
      /* the door: panelled, under a limestone hood, with a lit transom; the fourth house's stands open */
      if (i !== 3) k.box(0.12, 2.7, 1.3, HX - 0.04, PY + 1.35, z - 1.6, doorM);
      else { const d = k.box(0.08, 2.7, 1.3, HX + 0.3, PY + 1.35, z - 1.6 - 0.6, doorM); d.rotation.y = -1.25; d.position.set(HX + 0.85, PY + 1.35, z - 2.3 + 0.2); }
      k.box(0.06, 0.45, 1.2, HX - 0.03, PY + 3.0, z - 1.6, paneL);
      k.box(0.5, 0.22, 1.9, HX - 0.25, PY + 3.35, z - 1.6, cornice);
      for (const s of [-1, 1]) k.box(0.32, 0.4, 0.16, HX - 0.16, PY + 3.1, z - 1.6 + s * 0.85, cornice);
      k.box(0.05, 0.12, 0.12, HX - 0.1, PY + 1.3, z - 1.6 + 0.45, brass);
      k.rail(HX - 3.2, z - 1.6, 3.2, iron, 0.9, 'x', 0.8);
      /* the English basement under the stoop: a low iron gated door and a window */
      win(k, HX, 1.5, z + 1.4, -1, 0, 1.2, 1.3, sashW, paneD, cornice, 2);
      if (i % 4 === 2) k.prop('fire_escape', HX - 1.05, 7, z + 2, { height: 3.2, rotY: -PI / 2 });
    }
    k.block(HX - 0.4, HX + 14, -45, 44);
    blockFront(k, { x: -12.4, z0: 40, count: 11, face: 1, seed: 53, h: [14, 18] });
    /* the alley gate past the end of the row: two piers, an iron gate, and the words cast on them */
    for (const z of [44.3, 47.5]) k.box(0.7, 2.8, 0.7, HX + 0.35, 1.4, z, cornice);
    for (let z = 44.9; z < 47.1; z += 0.22) k.box(0.05, 2.0, 0.05, HX + 0.35, 1.0, z, iron);
    k.box(0.08, 0.08, 2.6, HX + 0.35, 1.95, 45.9, iron);
    k.sign('PRIVATE ROAD  ·  WALK YOUR HORSES', 3.8, 0.42, HX - 0.05, 3.05, 45.9, '#e8e0cc', '#2a2a2a', 70, -PI / 2, { border: true });
    /* THE TRICK (one a room): the alley behind the gate is six metres of forced perspective. Its walls fall from six
       metres to under two, its doors and windows shrink with them and its floor climbs, so through the bars it reads as
       a lane a city block long. A Firefly plate (queued) will close the far end. */
    {
      const x0 = HX + 0.8, x1 = HX + 7.2, zc = 45.9, w0 = 1.6, w1 = 0.42, h0 = 6.2, h1 = 1.5, y1 = 0.55, n = 8;
      const brickT = !HAS_DOM ? buff : (() => { const s = X.brick(0xb99a72, 77); const t = s.map.clone(); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(5, 2.5); t.needsUpdate = true; return new T.MeshStandardMaterial({ map: t, roughness: 0.85, color: 0xd8c8a8 }); })();
      const floorT = k.flat(0x6a6660, 0, 0.9), lampG = k.glow(0xffd9a0);
      for (let i = 0; i < n; i++) {
        const a = i / n, b = (i + 1) / n, xa = x0 + (x1 - x0) * a, xb = x0 + (x1 - x0) * b;
        const wa = w0 + (w1 - w0) * a, wb = w0 + (w1 - w0) * b, ha = h0 + (h1 - h0) * a, hb = h0 + (h1 - h0) * b, ya = y1 * a, yb = y1 * b;
        quad(k, v(xa, ya, zc - wa), v(xb, yb, zc - wb), v(xb, yb + hb, zc - wb), v(xa, ya + ha, zc - wa), brickT);
        quad(k, v(xb, yb, zc + wb), v(xa, ya, zc + wa), v(xa, ya + ha, zc + wa), v(xb, yb + hb, zc + wb), brickT);
        quad(k, v(xa, ya + 0.01, zc + wa), v(xb, yb + 0.01, zc + wb), v(xb, yb + 0.01, zc - wb), v(xa, ya + 0.01, zc - wa), floorT);
        /* a carriage house door every other bay, scaled with the wall */
        if (i % 2 === 1) for (const s of [-1, 1]) { const wm = (wa + wb) / 2, hm = (ha + hb) / 2, ym = (ya + yb) / 2, xm = (xa + xb) / 2; k.box(0.02, hm * 0.42, (xb - xa) * 0.6, xm, ym + hm * 0.21, zc + s * (wm - 0.02), doorM).rotation.y = PI / 2; k.box(0.02, hm * 0.12, (xb - xa) * 0.5, xm, ym + hm * 0.62, zc + s * (wm - 0.02), paneL).rotation.y = PI / 2; }
      }
      k.box(0.05, h1, w1 * 2, x1 + 0.01, y1 + h1 / 2, zc, brickT);
      k.sphere(0.05, x1 - 0.1, y1 + h1 * 0.6, zc, lampG, 8);
      k.point(x1 - 0.3, y1 + h1 * 0.6, zc, 0xffd9a0, 1.5, 3);
      ffPlate(k, 'assets/museum/tex/strivers/ff_alley_end.webp', w1 * 2 - 0.02, h1, x1 - 0.01, y1 + h1 / 2, zc, -PI / 2);
    }
    /* easter eggs: the real block */
    k.egg(v(HX - 0.4, 1.8, 45.9), { id: 'strivers-horses', title: 'Walk your horses', text: 'The houses were built back to back around shared rear courtyards, with alleys behind them, a rarity in Manhattan. The alleys let horses be stabled and supplies delivered out of sight of the parlours. The gate posts still carry the words Private Road, Walk Your Horses; today the back is used almost entirely for parking.', clue: 'Walk to the north end of the row and read the gate posts.', source: { name: 'History of Streets: Strivers\' Row, Untapped Cities', url: 'https://untappedcities.com/2012/12/20/history-of-streets-strivers-row/' } }, { r: 1.6 });
    k.egg(v(HX - 0.4, 1.6, 47.2), { id: 'strivers-alley', title: 'A block in six metres', year: '1653', text: 'The lane behind the gate looks as if it runs the length of the block, but it is six metres deep. Its walls fall from six metres to one and a half, its carriage doors shrink with them and its floor climbs toward the eye. It is forced perspective, the trick Francesco Borromini built in stone at the Palazzo Spada in Rome, where a colonnade about eight metres long passes for thirty seven.', clue: 'Look through the bars of the alley gate at the end of the row.', source: { name: 'Palazzo Spada, Wikipedia', url: 'https://en.wikipedia.org/wiki/Palazzo_Spada' } }, { r: 1.6 });
    k.egg(v(HX - 1.2, 8.6, 25.2), { id: 'strivers-three-architects', title: 'Three architects, one block', year: '1891', text: 'The developer David H. King Jr. built the King Model Houses in 1891 to 1893 and gave each row to a different architect. James Brown Lord did red brick and brownstone on the south side of West 138th, Bruce Price and Clarence Luce did yellow brick with white limestone on the north side of 138th and the south side of 139th, and Stanford White of McKim, Mead and White did dark brick and brownstone on the north side of 139th.', clue: 'Look up at the yellow brick and the limestone bands of the row.', source: { name: 'St. Nicholas Historic District, Wikipedia', url: 'https://en.wikipedia.org/wiki/St._Nicholas_Historic_District' } }, { r: 1.6 });
    k.egg(v(9.4, 5.2, 4), { id: 'strivers-landmark', title: 'Landmarked in 1967', year: '1967', text: 'The block is the St. Nicholas Historic District: both sides of West 138th and West 139th Streets between Adam Clayton Powell Jr. Boulevard and Frederick Douglass Boulevard, 9.9 acres in all. The city made it a landmark on March 16, 1967, and it joined the National Register of Historic Places in 1975. Only the outsides are protected, so the interiors can still be renovated.', clue: 'Find the street lamp in front of the middle of the row.', source: { name: 'St. Nicholas Historic District, Wikipedia', url: 'https://en.wikipedia.org/wiki/St._Nicholas_Historic_District' } }, { r: 1.6 });
    k.prop('hydrant', 9.6, 0, 20, { height: 1.1, keepOut: 0.5 });
    k.prop('mailbox', -9.8, 0, 6, { height: 1.5, rotY: PI / 2, keepOut: 0.6 });
    for (const z of [30, 4, -22]) for (const s of [-1, 1]) k.lamp(s * 9.4, z, 6, iron, 0xffd9a8, 26);
    k.skyline({ z: -150, count: 24, spacing: 8, scale: 1.6, base: -2, seed: 95, lit: 0.15, glow: 0.3, tint: 0x8a8690, rows: 1 });
    // the parlour floor of the fourth house, entered up its stoop
    k.blocks.pop();
    k.block(HX - 0.4, HX + 14, PZ + 3.9, 44);
    /* This cut the parlour off at z = PZ - 3.9 and left only the back seven
       metres of a twenty metre room standable, so the mantel wall works, the
       far side walls and the bay window all sent the visitor somewhere they
       could not stand. The parlour floor runs to PZ - PD + 3.6, and the
       mantel wall below already blocks the fireplace itself. */
    k.block(HX - 0.4, HX + 14, -45, PZ - PD + 3.3);
    const P0 = PZ - PD + 3.6, P1 = PZ + 3.6, PC = (P0 + P1) / 2, WX = PX - PW / 2 + 1.4, EX = PX + PW / 2;
    k.box(PW, 0.3, PD, PX, PY - 0.15, PC, oak);
    k.box(PW, 0.3, PD, PX, PY + 5.2, PC, tin);
    k.box(0.4, 5.4, PD, EX, PY + 2.6, PC, plaster);
    k.box(0.4, 5.4, PD, WX, PY + 2.6, PC, plaster);
    k.box(PW, 5.4, 0.4, PX, PY + 2.6, P0, plaster);
    k.block(EX - 0.3, EX + 0.3, P0, P1);
    k.block(WX - 0.3, WX + 0.3, P0, PZ - 3.2);
    k.block(WX - 0.3, WX + 0.3, PZ - 0.2, P1);
    k.block(PX - PW / 2, PX + PW / 2, P0 - 0.3, P0 + 0.3);
    // the front door bay: a short hall from the stoop into the parlour
    k.box(1.2, 0.3, 4, HX - 0.9, PY - 0.15, PZ - 1.6, oak);
    k.box(WX - HX - 0.6, 0.3, 4.2, (HX + 0.4 + WX - 0.2) / 2, PY - 0.15, PZ - 1.7, oak);
    /* the room dressed: a dark panelled dado with a chair rail, wallpaper above it (a Firefly paper is queued; the
       painted damask stands in), a picture rail and a deep crown cornice, a plaster medallion over each chandelier */
    const paper = (() => {
      if (!HAS_DOM) return k.flat(0x2f4a3c, 0, 0.8);
      const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d')!;
      g.fillStyle = '#28443a'; g.fillRect(0, 0, 256, 256); g.fillStyle = 'rgba(214,180,104,0.55)';
      for (const [cx, cy] of [[64, 64], [192, 192], [192, 64], [64, 192]] as const) { const small = (cx + cy) % 256 === 0; g.save(); g.translate(cx, cy); g.scale(small ? 1 : 0.55, small ? 1 : 0.55); for (let i = 0; i < 4; i++) { g.rotate(PI / 2); g.beginPath(); g.ellipse(0, -26, 11, 26, 0, 0, PI * 2); g.fill(); } g.beginPath(); g.arc(0, 0, 9, 0, PI * 2); g.fill(); g.restore(); }
      const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
      const m = k.pbr('w2c-strivers-paper', { map: t } as X.Surface, 1 / 0.9, { roughness: 0.8 });
      texL?.load('assets/museum/tex/strivers/ff_wallpaper.webp', (f) => { if (!k.live) return; f.colorSpace = T.SRGBColorSpace; f.wrapS = f.wrapT = T.RepeatWrapping; f.anisotropy = 8; m.map = f; m.needsUpdate = true; }, undefined, () => undefined);
      return m;
    })();
    const crown = k.flat(0xf2ead8, 0, 0.6);
    const walls: [number, number, number, number, number][] = [[EX - 0.21, PC, 0.04, PD - 0.4, -1], [WX + 0.21, (P0 + PZ - 3.2) / 2, 0.04, PZ - 3.2 - P0 - 0.2, 1], [WX + 0.21, (PZ - 0.2 + P1) / 2, 0.04, P1 - PZ + 0.2, 1], [PX, P0 + 0.21, PW - 0.4, 0.04, 0]];
    for (const [x, z, w, d] of walls) {
      k.box(w, 1.1, d, x, PY + 0.55, z, panelW);
      k.box(w ? w + 0.08 : 0.12, 0.08, d ? d : 0.12, x, PY + 1.12, z, panelW);
      k.box(w, 3.0, d, x, PY + 2.68, z, paper);
      k.box(w ? w + 0.05 : 0.08, 0.06, d ? d : 0.08, x, PY + 4.2, z, crown);
      k.box(w ? w + 0.3 : 0.34, 0.34, d ? d : 0.34, x, PY + 4.88, z, crown);
      k.box(w ? w + 0.18 : 0.2, 0.18, d ? d : 0.2, x, PY + 4.65, z, crown);
      k.box(w ? w + 0.12 : 0.14, 0.18, d ? d : 0.14, x, PY + 0.09, z, panelW);
    }
    // pocket doors halfway, the bay window at the front, the mantel, the piano
    for (const s of [-1, 1]) { k.box(0.3, 4.6, 2.2, PX + s * 4.6, PY + 2.3, PZ - 6, panelW); k.block(PX + s * 4.6 - 0.2, PX + s * (PW / 2 - 0.2), PZ - 6.2, PZ - 5.8); }
    k.box(PW - 2, 0.6, 0.3, PX + 0.7, PY + 4.9, PZ - 6, crown);
    k.box(4.4, 0.14, 0.62, PX, PY + 1.36, P0 + 0.32, marble);
    k.box(4.2, 0.3, 0.5, PX, PY + 1.15, P0 + 0.25, marble);
    for (const s of [-1, 1]) { k.box(0.42, 1.0, 0.5, PX + s * 1.9, PY + 0.5, P0 + 0.25, marble); k.box(0.5, 0.12, 0.56, PX + s * 1.9, PY + 0.06, P0 + 0.25, marble); }
    k.box(3.2, 1.0, 0.2, PX, PY + 0.5, P0 + 0.15, k.flat(0x0a0a0a, 0, 1));
    k.box(2.6, 0.06, 0.4, PX, PY + 0.04, P0 + 0.62, brass);
    k.point(PX, PY + 0.9, P0 + 0.9, 0xff9a40, 8, 5);
    k.box(2.8, 1.1, 1.4, PX + 2.6, PY + 0.55, PZ - 10, wood);
    k.box(1.0, 0.8, 1.4, PX + 4.2, PY + 1.5, PZ - 10, wood);
    k.box(2.6, 0.08, 0.3, PX + 2.6, PY + 0.96, PZ - 9.25, k.flat(0xf4f0e0, 0, 0.5));
    k.box(2.8, 1.2, 0.06, PX + 2.6, PY + 1.65, PZ - 10.68, wood);
    k.box(1.2, 0.55, 0.45, PX + 2.6, PY + 0.28, PZ - 8.7, k.pbr('parlourVelvet', X.velvet(0x4a2a5a), 0.6));
    k.keepOut.push({ x: PX + 3, z: PZ - 10, r: 1.8 });
    /* real furniture (Poly Haven, CC0): a sofa and two armchairs round a table at the front of the room, a console,
       a mantel clock, two chandeliers, a palm in the bay corner */
    glbs(k, 'strivers/ph_sofa_03', { width: 2.6 }, [[PX - 1.6, PY, P1 - 1.0, PI]]);
    glbs(k, 'strivers/ph_CoffeeTable_01', { width: 1.4 }, [[PX - 1.6, PY, P1 - 2.7, 0]]);
    glbs(k, 'strivers/ph_ArmChair_01', { height: 1.35 }, [[PX - 3.7, PY, P1 - 2.9, PI / 2], [PX + 0.5, PY, P1 - 2.9, -PI / 2]]);
    k.keepOut.push({ x: PX - 1.6, z: P1 - 2.2, r: 2.3 });
    glbs(k, 'strivers/ph_ClassicConsole_01', { width: 1.7 }, [[WX + 0.6, PY, PZ - 13.5, PI / 2]]);
    glbs(k, 'strivers/ph_ornate_mirror_01', { height: 1.6 }, [[WX + 0.26, PY + 1.25, PZ - 13.5, PI / 2]]);
    glbs(k, 'strivers/ph_mantel_clock_01', { height: 0.48 }, [[PX, PY + 1.43, P0 + 0.32, 0]]);
    glbs(k, 'strivers/ph_Chandelier_01', { height: 1.25 }, [[PX, PY + 5.05 - 1.25, PZ - 2, 0], [PX, PY + 5.05 - 1.25, PZ - 12, 0]]);
    glbs(k, 'strivers/ph_potted_plant_02', { height: 1.7 }, [[EX - 0.9, PY, P1 - 0.9, 0], [WX + 0.9, PY, P0 + 1.0, 0]]);
    for (const z of [PZ - 2, PZ - 12]) { k.point(PX, PY + 3.0, z, 0xffe0b8, 6, 11); k.cyl(0.55, 0.06, PX, PY + 5.02, z, crown, 0.7, 24); }
    k.censusWall({ x: EX - 0.22, y: PY + 2.9, z: PZ - 9.4, rotY: -PI / 2, cols: 10, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(1100, 40), pieces: ctx.all, backing: panelW });
    k.egg(v(HX - 0.9, PY + 1.6, PZ - 1.6), { id: 'strivers-empty', title: 'Empty for twenty years', year: '1919', text: 'King sold very few houses, and in 1895 the Equitable Life Assurance Society, which had financed the project, foreclosed on almost all of them. The houses sat empty until 1919 to 1920, when they were at last made available to African Americans, for $8,000 each.', clue: 'Stand in the front door at the top of the stoop.', source: { name: 'St. Nicholas Historic District, Wikipedia', url: 'https://en.wikipedia.org/wiki/St._Nicholas_Historic_District' } }, { r: 1.6 });
    k.egg(v(PX + 2.6, PY + 1.4, PZ - 10), { id: 'strivers-piano', title: 'Who lived on the row', text: 'The residents of these two blocks included Eubie Blake, W. C. Handy, Fletcher Henderson, Bill Bojangles Robinson, the boxer Harry Wills, the surgeon Louis T. Wright and Adam Clayton Powell Jr.', clue: 'Lift the lid of the piano in the parlour.', source: { name: 'St. Nicholas Historic District, Wikipedia', url: 'https://en.wikipedia.org/wiki/St._Nicholas_Historic_District' } }, { r: 1.6 });
    k.egg(v(PX, PY + 1.0, PZ - PD + 4.2), { id: 'strivers-plumbing', title: 'Indoor plumbing', year: '1893', text: 'Each house is about 18 to 22 feet wide and 50 feet deep, and they cost about $1.5 million to build. They were sold on modern comforts, among them indoor plumbing, still a new and sought after amenity when the rows went up. The row turns up in songs too, in Earl Hines\'s Topsy Turvy and Cab Calloway\'s The Ghost of Smokey Joe.', clue: 'Warm your hands at the marble mantel.', source: { name: 'History of Streets: Strivers\' Row, Untapped Cities', url: 'https://untappedcities.com/2012/12/20/history-of-streets-strivers-row/' } }, { r: 1.6 });
    // the works: gilt on the parlour walls, the front room, and along the block as stoop signs
    const mounts: Mount[] = [];
    /* the front room's east wall carries two that no longer overlap; the back room one more beside the census */
    for (const z of [PZ + 0.8, PZ - 3.2]) mounts.push({ position: v(EX - 0.24, PY + 3.0, z), rotation: -PI / 2, target: v(PX + 1, PY + 3, z), width: 3.4, height: 2.1, style: 'gilt' });
    for (const z of [PZ - 8.5, PZ - 11.5]) mounts.push({ position: v(WX + 0.24, PY + 3.0, z), rotation: PI / 2, target: v(PX - 1, PY + 3, z), width: 2.6, height: 1.8, style: 'gilt' });
    mounts.push({ position: v(PX, PY + 3.4, P0 + 0.24), rotation: 0, target: v(PX, PY + 3, PZ - 10), width: 3.4, height: 2.2, style: 'gilt' });
    /* The pair either side of the mantel stand you back a little further than
       the middle one: at PZ - 10 the right hand target landed inside the
       piano's own keep out, which is a spot the visitor is pushed out of. */
    for (const x of [PX - 4.3, PX + 4.3]) mounts.push({ position: v(x, PY + 3.0, P0 + 0.24), rotation: 0, target: v(x, PY + 3, PZ - 7.6), width: 2.6, height: 1.9, style: 'gilt' });
    mounts.push({ position: v(EX - 0.24, PY + 3.0, PZ - 14.5), rotation: -PI / 2, target: v(PX + 1, PY + 3, PZ - 14.5), width: 2.8, height: 1.9, style: 'gilt' });
    /* Stoop signs on the house fronts, on the English basement under each bay. These face the street, which is at
       lower x, so the normal is -X: at +PI/2 all ten faced into the brick and the visitor on the pavement saw ten backs. */
    for (let i = 0; i < 11; i++) { if (i === 3) continue; const z = 40 - i * 7.4; mounts.push({ position: v(HX - 0.06, 1.85, z + 1.4 + 0.02), rotation: -PI / 2, target: v(HX - 5, 3, z + 1.4), width: 1.3, height: 1.5, style: 'black', wash: false, lookAt: v(HX, 1.85, z + 1.4) }); }
    return { mounts, spawn: v(-4, 3, 28), look: v(HX, 5, 10), eye: 3, bounds: [-9, PX + PW / 2, -40, 42], style: 'gilt', floorY: (x, z) => {
      if (x > HX - 0.4 && z > PZ - PD + 3.6 && z < PZ + 3.6) return PY;
      if (x > HX - 3.4 && x <= HX - 0.4 && Math.abs(z - (PZ - 1.6)) < 1.6) return Math.max(0, ((x - (HX - 3.4)) / 3) * PY);
      return 0;
    } };
  },
};

/* ---------------- 34 TOP OF THE ROCK ---------------- */
export const rock: RoomDef = {
  id: 'rock',
  name: 'Seventy floors up',
  area: 'TOP OF THE ROCK',
  mood: 'Blue hour',
  color: '#8fb3d9',
  description: 'The observation decks of a limestone tower, glass panels at the edge, the whole island laid out around the works.',
  signatures: 'The stepped limestone crown of the slab, three terraced decks, safety glass panels between stone piers, the park to the north and the spire to the south, the city as the wall.',
  build(k, ctx) {
    /* THE BIG UPGRADE 2c: the fog and haze were so heavy that from the decks the city was a white wall. The air is
       clearer now and the city is built at its real depth, 260 m down, with Midtown around the tower, the towers of
       57th Street and the park to the north and the Empire State Building to the south. */
    k.sky({ top: 0x122446, horizon: 0x8a9cc4, ground: 0x0e1420, fog: 0.00075, stars: 400, sun: { az: 1.6, el: 0.5, color: 0xffa070, size: 10 }, haze: 0.12, env: 0.7 });
    k.hemi(0xbfd0ff, 0x1a1e2a, 0.65);
    k.sun(0xffc09a, 1.3, -60, 12, 30, true, 60);
    const R = 'rock';
    const lime = scan(k, R, 'white_sandstone_blocks_02', 3, () => X.ashlar(0xd8cfb8, 50, 3), { color: 0xfffaf0 }, 0xd8cfb8),
      limeFine = scan(k, R, 'white_sandstone_blocks_02', 2, () => X.ashlar(0xd8cfb8, 50, 3), { color: 0xffffff }, 0xd6ccb6),
      pav = scan(k, R, 'large_floor_tiles_02', 2, () => X.pavers(0x8c8880, 21), { color: 0xf2f0ec }, 0x9c9890),
      glass = k.glass(0xdcecf6, 0.14, 0.04),
      steel = k.flat(0x9aa4ae, 0.85, 0.3),
      redOxide = k.flat(0x8a3a24, 0.35, 0.6),
      facade = k.pbr('rockFacade', X.windows(51, 0.35, 0x8a8272, true), 0.12, { emissive: 0xffffff, emissiveIntensity: 1.1, roughness: 0.6, stretch: 0.42 });
    // the decks: three terraces on the crown, glass at every edge
    const decks = [[0, 0, 34, 20], [7.5, -14, 26, 10], [15, -26, 18, 8]] as const;
    /* the 70th floor: tiles laid in a celestial pattern, gilt stars on blue black stone */
    const starFloor = (() => {
      if (!HAS_DOM) return pav;
      const c = document.createElement('canvas'); c.width = 2048; c.height = 1024; const g = c.getContext('2d')!;
      g.fillStyle = '#1b2230'; g.fillRect(0, 0, 2048, 1024);
      for (let x = 0; x <= 2048; x += 128) { g.fillStyle = '#2a3242'; g.fillRect(x - 2, 0, 4, 1024); }
      for (let y = 0; y <= 1024; y += 128) { g.fillStyle = '#2a3242'; g.fillRect(0, y - 2, 2048, 4); }
      const r = X.mulberry(707), stars: [number, number][] = [];
      for (let i = 0; i < 90; i++) stars.push([r() * 2048, r() * 1024]);
      g.strokeStyle = 'rgba(214,180,104,0.45)'; g.lineWidth = 3;
      for (let i = 0; i < 40; i++) { const a = stars[i], b = stars[(i * 7 + 3) % 40]; if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 360) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); } }
      g.fillStyle = '#e8c46a';
      for (const [x, y] of stars) { const s = 6 + r() * 14; g.beginPath(); for (let j = 0; j < 10; j++) { const a = (j / 10) * PI * 2, rr = j % 2 ? s * 0.42 : s; g.lineTo(x + Math.sin(a) * rr, y - Math.cos(a) * rr); } g.closePath(); g.fill(); }
      g.strokeStyle = '#e8c46a'; g.lineWidth = 6; g.beginPath(); g.arc(1024, 512, 380, 0, PI * 2); g.stroke(); g.beginPath(); g.arc(1024, 512, 396, 0, PI * 2); g.stroke();
      const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
      return new T.MeshStandardMaterial({ map: t, roughness: 0.35, metalness: 0.15 });
    })();
    /* THE TRICK (one a room): a glass panel in the 67th floor deck over a shaft that falls 40 m. Its walls lean in as
       they drop and the street at the bottom is a toy, so it reads as the full 850 feet to 50th Street. */
    const HOLE = { x0: -1.6, x1: 1.6, z0: 1.4, z1: 4.6 };
    for (const [y, z, w, d] of decks) {
      if (y === 0) {
        /* the lower deck is built round the hole */
        const zs = z - d / 2, ze = z + d / 2, xs = -w / 2, xe = w / 2;
        for (const [a0, a1, b0, b1] of [[xs, xe, zs, HOLE.z0], [xs, xe, HOLE.z1, ze], [xs, HOLE.x0, HOLE.z0, HOLE.z1], [HOLE.x1, xe, HOLE.z0, HOLE.z1]]) {
          k.box(a1 - a0, 1.6, b1 - b0, (a0 + a1) / 2, y - 0.8, (b0 + b1) / 2, lime);
          k.box(Math.max(0.01, a1 - a0 - (a0 === xs ? 0.5 : 0) - (a1 === xe ? 0.5 : 0)), 0.2, Math.max(0.01, b1 - b0 - (b0 === zs ? 0.5 : 0) - (b1 === ze ? 0.5 : 0)), (a0 + a1) / 2 + (a0 === xs ? 0.25 : 0) - (a1 === xe ? 0.25 : 0), y + 0.1, (b0 + b1) / 2 + (b0 === zs ? 0.25 : 0) - (b1 === ze ? 0.25 : 0), pav);
        }
      } else {
        k.box(w, 1.6, d, 0, y - 0.8, z, lime);
        k.box(w - 1, 0.2, d - 1, 0, y + 0.1, z, y === 15 ? starFloor : pav);
      }
      /* The 67th and 69th floor terraces have the 8.5 foot frameless glass parapet. The 70th floor roof is the one
         level with no glass at all, open to the sky over a low limestone parapet, so the top deck gets stone only. */
      if (y < 15) {
        for (const s of [-1, 1]) { k.box(0.12, 2.6, d - 1, s * (w / 2 - 0.4), y + 1.4, z, glass); for (let zz = z - d / 2 + 0.5; zz <= z + d / 2; zz += 3) k.box(0.4, 2.8, 0.4, s * (w / 2 - 0.4), y + 1.4, zz, limeFine); }
        k.box(w - 1, 2.6, 0.12, 0, y + 1.4, z - d / 2 + 0.4, glass);
        for (let xx = -w / 2 + 0.9; xx <= w / 2 - 0.5; xx += 3) k.box(0.4, 2.8, 0.4, xx, y + 1.4, z - d / 2 + 0.4, limeFine);
        /* a bronze handrail and a limestone curb at the foot of the glass */
        for (const s of [-1, 1]) { k.box(0.5, 0.3, d - 1, s * (w / 2 - 0.55), y + 0.35, z, limeFine); k.box(0.06, 0.06, d - 1.2, s * (w / 2 - 0.75), y + 1.15, z, k.flat(0x8a6a3a, 0.85, 0.35)); }
        k.box(w - 1, 0.3, 0.5, 0, y + 0.35, z - d / 2 + 0.55, limeFine);
      } else {
        for (const s of [-1, 1]) k.box(0.4, 1.1, d - 1, s * (w / 2 - 0.4), y + 0.65, z, limeFine);
        k.box(w - 1, 1.1, 0.4, 0, y + 0.65, z - d / 2 + 0.4, limeFine);
        /* two limestone screens carry the pair of works that used to hang on the glass */
        for (const xx of [-5, 5]) k.box(3.8, 2.6, 0.3, xx, y + 1.4, z - d / 2 + 0.25, limeFine);
      }
      k.block(-w / 2, w / 2, z - d / 2 - 1, z - d / 2 + 0.6);
      k.block(-w / 2 - 1, -w / 2 + 0.6, z - d / 2, z + d / 2);
      k.block(w / 2 - 0.6, w / 2 + 1, z - d / 2, z + d / 2);
    }
    k.box(34, 2.6, 0.12, 0, 1.4, 9.6, glass);
    k.box(33, 0.3, 0.5, 0, 0.35, 9.35, limeFine);
    k.block(-17, 17, 9.4, 11);
    /* the shaft under the glass */
    {
      const top = -0.02, bot = -40, w0 = 1.6, w1 = 0.5;
      const P = (sx: number, sz: number, y: number, w: number) => v(sx * w, y, 3 + sz * w);
      let shaftWall: T.Material = facade;
      if (HAS_DOM && facade.map) {
        const sm = new T.MeshStandardMaterial({ map: facade.map.clone(), emissiveMap: facade.emissiveMap, emissive: 0xffd9a0, emissiveIntensity: 0.7, roughness: 0.6, color: 0x6a6460 });
        const sw = sm.map!; sw.wrapS = sw.wrapT = T.RepeatWrapping; sw.repeat.set(1, 9); sw.needsUpdate = true;
        if (sm.emissiveMap) { const e = sm.emissiveMap.clone(); e.wrapS = e.wrapT = T.RepeatWrapping; e.repeat.set(1, 9); e.needsUpdate = true; sm.emissiveMap = e; }
        shaftWall = sm;
      }
      for (const [ax, az, bx, bz] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]) quad(k, P(ax, az, bot, w1), P(bx, bz, bot, w1), P(bx, bz, top, w0), P(ax, az, top, w0), shaftWall, true);
      const street = k.flat(0x2a2c30, 0, 0.9);
      k.box(w1 * 2, 0.05, w1 * 2, 0, bot, 3, street);
      k.box(w1 * 2, 0.052, 0.16, 0, bot, 3, k.flat(0xd8d4c8, 0, 0.8));
      for (const [x, z] of [[-0.25, 2.7], [0.1, 3.3], [0.3, 2.55], [-0.1, 3.6]]) k.box(0.07, 0.04, 0.16, x, bot + 0.04, z, k.flat(0xf3b81c, 0.3, 0.5));
      k.point(0, bot + 3, 3, 0xffd8a0, 4, 12);
      k.box(3.2, 0.06, 3.2, 0, 0.17, 3, k.glass(0xdff0ff, 0.12, 0.02));
      for (const [x, z, w, d] of [[0, HOLE.z0, 3.3, 0.1], [0, HOLE.z1, 3.3, 0.1], [HOLE.x0, 3, 0.1, 3.3], [HOLE.x1, 3, 0.1, 3.3]]) k.box(w, 0.24, d, x, 0.1, z, steel);
    }
    // stairs between decks
    for (let i = 0; i < 10; i++) { k.box(4, 0.75, 1.2, 12, 0.375 + i * 0.75, -8 - i * 0.6, lime); k.box(4, 0.75, 1.2, -12, 0.375 + i * 0.75, -8 - i * 0.6, lime); }
    for (let i = 0; i < 10; i++) { k.box(3, 0.75, 1.0, 8, 7.875 + i * 0.75, -21 - i * 0.5, lime); k.box(3, 0.75, 1.0, -8, 7.875 + i * 0.75, -21 - i * 0.5, lime); }
    /* the floors named at the foot of each stair, in deco brass on black */
    for (const [x, y, z, n] of [[12, 1.7, -7.3, '67  ·  69'], [-12, 1.7, -7.3, '67  ·  69'], [8, 9.2, -20.4, '69  ·  70'], [-8, 9.2, -20.4, '69  ·  70']] as const)
      board(k, 1.6, 0.36, x, y, z, 0, (g, W, H) => { g.fillStyle = '#16181c'; g.fillRect(0, 0, W, H); g.strokeStyle = '#c9a24a'; g.lineWidth = 4; g.strokeRect(6, 6, W - 12, H - 12); g.fillStyle = '#e8c46a'; g.font = `800 ${H * 0.55}px "Archivo Expanded", "Archivo", sans-serif`; g.fillText(n, W / 2, H * 0.54); }, { px: 512 });
    // the tower below the decks and the crown behind
    k.box(44, 260, 30, 0, -130, -8, facade);
    k.box(24, 10, 12, 0, 20, -40, lime);
    k.box(16, 6, 8, 0, 28, -42, lime);
    k.cyl(0.4, 30, 0, 44, -42, steel, 0.1, 8);
    /* the city, built round the tower at street level 260 m down: a grid of blocks with prewar, deco and glass towers
       taller toward Midtown's spine, the avenues and streets cut through, the rivers at both edges */
    {
      const G = -260, rr = X.mulberry(3434);
      const mats = [0, 1, 2, 3].map((i) => k.pbr('rockCity' + i, X.windows(60 + i, 0.3 + i * 0.05, [0x8a8272, 0x6a5a4c, 0x2a3a4a, 0x9a9282][i], i !== 2), 0.05, { emissive: 0xffffff, emissiveIntensity: 1.0, roughness: i === 2 ? 0.3 : 0.65, metalness: i === 2 ? 0.5 : 0, stretch: 0.42 }));
      const roofM = k.flat(0x3a3c40, 0.1, 0.85), trim = k.flat(0x8a8478, 0, 0.8);
      k.box(2600, 2, 2600, 0, G - 1, 0, k.flat(0x34363a, 0, 0.95));
      for (const x of [-1080, 1020]) k.box(320, 0.5, 2600, x + (x < 0 ? -40 : 40), G + 0.6, 0, k.flat(0x24384a, 0.5, 0.2));
      /* Central Park from 59th Street north, its reservoir, Fifth and Central Park West along its sides */
      k.box(820, 0.6, 1400, -40, G + 0.4, 1300, k.flat(0x34502e, 0, 0.95));
      k.box(300, 0.7, 220, -40, G + 0.5, 1150, k.flat(0x2c4458, 0.5, 0.2));
      for (let i = 0; i < 260; i++) { const tx = -40 + (rr() - 0.5) * 800, tz = 620 + rr() * 560; if (Math.abs(tz - 1150) < 120 && Math.abs(tx + 40) < 160) continue; k.sphere(6 + rr() * 6, tx, G + 6, tz, k.flat([0x2e4a2a, 0x3a5a30, 0x26402a][i % 3], 0, 0.95), 6); }
      const tower = (x: number, z: number, w: number, d: number, h: number, kind: number) => {
        const m = mats[kind];
        if (kind === 2 || h < 90) { k.box(w, h, d, x, G + h / 2, z, m); k.box(w * 0.9, 4, d * 0.9, x, G + h + 2, z, roofM); return; }
        const h1 = h * 0.6, h2 = h * 0.25, h3 = h - h1 - h2;
        k.box(w, h1, d, x, G + h1 / 2, z, m); k.box(w + 1, 1.2, d + 1, x, G + h1, z, trim);
        k.box(w * 0.75, h2, d * 0.75, x, G + h1 + h2 / 2, z, m); k.box(w * 0.75 + 0.8, 1, d * 0.75 + 0.8, x, G + h1 + h2, z, trim);
        k.box(w * 0.5, h3, d * 0.5, x, G + h1 + h2 + h3 / 2, z, m);
      };
      for (let bz = -1100; bz <= 560; bz += 80) for (let bx = -1000; bx <= 960; bx += 140) {
        if (Math.abs(bx) < 90 && Math.abs(bz + 8) < 90) continue;
        const spine = Math.exp(-((bx / 520) ** 2)), core = Math.exp(-(((bz + 300) / 700) ** 2));
        for (const half of [-1, 1]) {
          if (rr() < 0.12) continue;
          const x = bx + half * 32 + (rr() - 0.5) * 8, z = bz + (rr() - 0.5) * 10, w = 34 + rr() * 22, d = 40 + rr() * 24;
          const h = 40 + rr() * 90 + spine * core * (120 + rr() * 200) * (rr() < 0.35 ? 1 : 0.5);
          tower(x, z, w, d, h, h > 200 && rr() < 0.55 ? 2 : Math.floor(rr() * 4) === 2 ? 0 : Math.floor(rr() * 4));
        }
      }
      /* the pencil towers of 57th Street, standing well above the deck to the north */
      for (const [x, z, w, h] of [[-150, 560, 34, 472], [-60, 575, 18, 435], [-120, 590, 30, 306], [-230, 585, 30, 290], [180, 560, 30, 426], [60, 600, 24, 330]] as const) {
        const m = x === 180 ? mats[0] : mats[2];
        k.box(w, h, w * 1.1, x, G + h / 2, z, m); k.box(w * 0.86, 6, w * 0.95, x, G + h + 3, z, roofM);
      }
      /* the Empire State Building, 1.6 km south: setbacks, the tower, the mast. A real model is queued. */
      { const x = 60, z = -1050, s = 1;
        tower(x, z, 130 * s, 60 * s, 25 * s, 0);
        k.box(80 * s, 250 * s, 50 * s, x, G + 125 * s, z, mats[3]);
        k.box(56 * s, 40 * s, 38 * s, x, G + 270 * s, z, mats[3]);
        for (let i = 0; i < 4; i++) k.box((40 - i * 6) * s, 12 * s, (30 - i * 5) * s, x, G + 296 * s + i * 12 * s, z, mats[3]);
        k.cyl(6 * s, 40 * s, x, G + 360 * s, z, steel, 3 * s, 12);
        k.cyl(1.2 * s, 60 * s, x, G + 410 * s, z, steel, 0.4 * s, 8);
        k.point(x, G + 400 * s, z, 0xfff4e0, 400, 300); }
    }
    /* the Beam on the 69th floor: Lunch Atop a Skyscraper as a riveted girder raised over the terrace */
    {
      const y = 7.5 + 3.9, z = -15.6;
      k.box(7.2, 0.05, 0.42, 0, y + 0.32, z, redOxide); k.box(7.2, 0.05, 0.42, 0, y - 0.32, z, redOxide); k.box(7.2, 0.62, 0.05, 0, y, z, redOxide);
      for (let x = -3.4; x <= 3.41; x += 0.34) for (const s of [-1, 1]) k.sphere(0.02, x, y + 0.35, z + s * 0.15, redOxide, 5);
      k.box(0.3, 3.9, 0.3, 0, 7.5 + 1.95, -18.6, steel);
      k.beam(v(0, y + 0.34, z), v(0, 7.5 + 3.9, -18.6), 0.09, steel, 6);
      k.beam(v(-3.2, y + 0.34, z), v(0, y + 2.2, -18.0), 0.012, steel, 4); k.beam(v(3.2, y + 0.34, z), v(0, y + 2.2, -18.0), 0.012, steel, 4);
      board(k, 2.0, 0.42, 0, 7.5 + 1.6, -18.4, 0, (g, W, H) => { g.fillStyle = '#16181c'; g.fillRect(0, 0, W, H); g.fillStyle = '#e8c46a'; g.font = `800 ${H * 0.5}px "Archivo Expanded", "Archivo", sans-serif`; g.fillText('THE BEAM  ·  69', W / 2, H * 0.54); }, { px: 512 });
    }
    /* the binoculars at the north glass: real Poly Haven binoculars on bronze posts, aimed at the park */
    for (const x of [-10, 0, 10]) { k.cyl(0.08, 1.2, x, 0.6, 8.6, steel, 0.08, 8); k.cyl(0.18, 0.08, x, 1.22, 8.6, steel, 0.18, 12); k.keepOut.push({ x, z: 8.6, r: 0.5 }); }
    glbs(k, 'rock/ph_vintage_binocular', { width: 0.5 }, [[-10, 1.26, 8.6, PI], [0, 1.26, 8.6, PI], [10, 1.26, 8.6, PI]]);
    for (const x of [-6, 6]) k.bench(x, -2, 0, k.pbr('benchR', X.planks(0x6a5a45, 3, 52), 1.2), steel, 2.4);
    k.prop('lantern', 14, 0.2, 6, { height: 0.9 });
    k.prop('lantern', -14, 0.2, 6, { height: 0.9 });
    k.censusWall({ x: 0, y: 3.2, z: -9.35, rotY: 0, cols: 26, rows: 3, tile: 0.55, gap: 0.05, start: ctx.wallStart(2500, 78), pieces: ctx.all, backing: limeFine });
    board(k, 9, 0.8, 0, 5.4, -9.33, 0, (g, W, H) => {
      g.fillStyle = '#16181c'; g.fillRect(0, 0, W, H); g.strokeStyle = '#c9a24a'; g.lineWidth = 6; g.strokeRect(10, 10, W - 20, H - 20); g.strokeRect(22, 22, W - 44, H - 44);
      g.fillStyle = '#e8c46a'; fitFont(g, 'TOP OF THE ROCK  ·  SEVENTY FLOORS', (px) => `800 ${px}px "Archivo Expanded", "Archivo", sans-serif`, H * 0.5, W * 0.86); g.fillText('TOP OF THE ROCK  ·  SEVENTY FLOORS', W / 2, H * 0.54);
    }, { px: 2048 });
    /* the spherical beacon on the 70th floor roof */
    k.cyl(0.35, 1.0, 0, 15.6, -24.6, steel, 0.45, 12); k.sphere(0.55, 0, 16.6, -24.6, k.glow(0xe8f0ff), 20); k.point(0, 16.8, -24.6, 0xdfe8ff, 6, 8); k.keepOut.push({ x: 0, z: -24.6, r: 0.9 });
    /* a Firefly panorama of Lower Manhattan and the harbour closes the far south, beyond the code city (queued) */
    ffPlate(k, 'assets/museum/tex/rock/ff_downtown_plate.webp', 2300, 520, 40, -60, -1170, 0, 0, null, true);
    /* easter eggs */
    const W30 = { name: '30 Rockefeller Plaza, Wikipedia', url: 'https://en.wikipedia.org/wiki/30_Rockefeller_Plaza' };
    k.egg(v(0, 4.6, -9.1), { id: 'rock-sixty-six', title: 'Seventy floors, nearly', text: 'The tower itself has 66 stories. The famous figure of 70 comes from what the encyclopedia calls a hyperbolic press release by Merle Crowell, the complex\'s publicist while it was going up. The decks are still sold as the 67th, 69th and 70th floors, about 850 feet above the street.', clue: 'Read the sign over the census wall, then count again.', source: W30 }, { r: 1.6 });
    k.egg(v(-8, 1.6, 9.2), { id: 'rock-glass', title: 'Frameless', year: '2005', text: 'The deck closed in 1986 and reopened in 2005 as Top of the Rock after a renovation by Gabellini Sheppard Associates. That is when the 8.5 foot parapet of frameless safety glass went in around the terraces. By 2011 it drew about 2.5 million visitors a year.', clue: 'Put your hand on the glass at the north edge, facing the park.', source: W30 }, { r: 1.6 });
    k.egg(v(-6, 1.2, -2), { id: 'rock-ocean-liner', title: 'Deck chairs in the sky', year: '1933', text: 'The observation deck first opened in July 1933, with terraces on the 67th, 69th and 70th floors. It was decorated in the style of an ocean liner, with slatted chairs, and the original deck measured 190 by 21 feet.', clue: 'Sit on the bench on the lower terrace.', source: W30 }, { r: 1.6 });
    k.egg(v(12, 1.6, -6), { id: 'rock-freight', title: 'Up the freight shafts', text: 'Visitors come in by their own entrance on 50th Street and ride two elevators converted from freight elevator shafts to the 67th floor. There a double height indoor observatory leads by escalator to the 69th.', clue: 'Stand at the foot of the stair that climbs to the next terrace.', source: W30 }, { r: 1.6 });
    k.egg(v(8, 9.4, -14), { id: 'rock-lunch', title: 'Lunch on the 69th floor', year: '1932', text: 'The photograph Lunch Atop a Skyscraper was taken on September 20, 1932, while the 69th floor was under construction, as part of a publicity stunt for the RCA Building. The 69th floor now has the Beam, a ride themed on the photo that seats seven and turns 12 feet above the terrace. The tower topped out six days after the picture, on September 26, with an American flag.', clue: 'Climb to the middle terrace, the 69th floor, and stand at its glass.', source: W30 }, { r: 1.6 });
    k.egg(v(0, 17.6, -24.6), { id: 'rock-beacon', title: 'A beacon and a starry floor', text: 'The 70th floor roof is the one level with no glass. It carries a spherical rooftop beacon and floor tiles laid in a celestial pattern, and, as of 2024, a rotating Skylift ride as well.', clue: 'Climb to the top terrace and find the glowing sphere.', source: W30 }, { r: 1.6 });
    k.egg(v(0, 0.6, 3), { id: 'rock-drop', title: 'Forty metres that read as 850 feet', text: 'Under the glass panel the shaft falls 40 metres, not the 850 feet to 50th Street. Its walls lean in as they drop and the street, the crosswalk and the cabs at the bottom are built small, so the eye reads the full height. It is forced perspective, the trick film sets use to make a short street look like a long one.', clue: 'Find the glass panel in the floor of the lowest terrace and look down.', source: { name: 'Forced perspective, Wikipedia', url: 'https://en.wikipedia.org/wiki/Forced_perspective' } }, { r: 1.6 });
    // the works: glass mounted panels on the deck edges facing in, on the piers, on the upper terraces
    const mounts: Mount[] = [];
    for (let i = 0; i < 8; i++) { const x = -14 + i * 4; mounts.push({ position: v(x, 1.6, 9.45), rotation: PI, target: v(x, 3, 5), width: 3.4, height: 2.0, style: 'steel', wash: false }); }
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = 6 - i * 6; mounts.push({ position: v(s * 16.45, 1.6, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 12, 3, z), width: 3.4, height: 2.0, style: 'steel', wash: false }); }
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const z = -12 - i * 5; mounts.push({ position: v(s * 12.45, 9.1, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 8.5, 10.5, z), width: 3.2, height: 1.9, style: 'steel', wash: false }); }
    for (const x of [-5, 5]) mounts.push({ position: v(x, 16.6, -29.55), rotation: 0, target: v(x, 18, -25), width: 3.4, height: 2.0, style: 'steel', wash: false });
    return { mounts, spawn: v(0, 3, -4), look: v(0, -36, 120), eye: 3, bounds: [-16.6, 16.6, -29.6, 9.4], style: 'steel', floorY: (x, z) => {
      for (const [y, zz, w, d] of decks) if (Math.abs(x) < w / 2 && z > zz - d / 2 && z < zz + d / 2) { if (Math.abs(Math.abs(x) - 12) < 2 && z > -14 && z < -8) return ((-8 - z) / 6) * 7.5; if (Math.abs(Math.abs(x) - 8) < 1.5 && z > -26 && z < -21) return 7.5 + ((-21 - z) / 5) * 7.5; return y; }
      return 0;
    } };
  },
};

/* ---------------- 35 THE FRICK GARDEN COURT ---------------- */
export const frick: RoomDef = {
  id: 'frick',
  name: 'The garden court',
  area: 'THE FRICK',
  mood: 'Gilded quiet',
  color: '#d9cfb0',
  description: 'A Fifth Avenue mansion, the skylit garden court with its fountain and ionic columns, the census where the old masters hang.',
  signatures: 'The limestone mansion behind its lawn and iron fence on Fifth Avenue, the glass roofed garden court with paired ionic columns and a central fountain, the paneled galleries opening off it.',
  build(k, ctx) {
    k.sky({ top: 0x7ea9d6, horizon: 0xe8e8e0, ground: 0x5a5a4a, fog: 0.0026, sun: { az: 1.8, el: 0.6, color: 0xfff3dc, size: 14 }, env: 0.9 });
    k.hemi(0xf6f4ea, 0x4a4a3a, 0.9);
    k.sun(0xfff0d4, 2.2, 20, 60, 20, true, 70);
    /* THE BIG UPGRADE 2c: Indiana limestone, St. Genevieve style marble, red silk walls over a dark dado, all scans. */
    const R = 'frick';
    const lime = scan(k, R, 'white_sandstone_blocks_02', 2, () => X.ashlar(0xd9d0ba, 53, 3), { color: 0xfff6e6 }, 0xd9d0ba),
      marble = scan(k, R, 'marble_01', 1.5, () => X.marble(0xe9e4d8, 0xb3aa98, 12), { roughness: 0.25, color: 0xfffaf2 }, 0xe9e4d8),
      floorM = scan(k, R, 'marble_tiles', 2, () => X.marble(0xd6cdbb, 0x9a8f7a, 13), { roughness: 0.3, color: 0xf6efe4 }, 0xd6cdbb),
      panel = scan(k, R, 'dark_paneled_wood', 1.4, () => X.planks(0x5a3d2a, 3, 54), { roughness: 0.5, color: 0xe0c4a8 }, 0x4a3222),
      damask = scan(k, R, 'quatrefoil_jacquard_fabric', 0.56, () => X.carpet(0x5a2a2a, 0x8a5a4a), { roughness: 0.9, color: 0xd88a78 }, 0x7a3a32),
      parquet = scan(k, R, 'herringbone_parquet', 3.4, () => X.planks(0x6a4a30, 8, 55), { roughness: 0.5 }, 0x6a4a30),
      glass = k.glass(0xf2f6f8, 0.22, 0.25),
      iron = k.flat(0x1f242a, 0.75, 0.45),
      water = k.flat(0x3a6a6a, 0.5, 0.2, { transparent: true, opacity: 0.9 }),
      lawn = k.pbr('frickLawn', X.grass(0x4c7a3c, 19), 0.15),
      gold = k.pbr('frickGold', X.gilt(0xc9a552), 2, { metalness: 0.85, roughness: 0.3 }),
      plasterW = k.flat(0xf1ebe0, 0, 0.75);
    // Fifth Avenue, the fence, the lawn, the park across
    street(k, { w: 20, len: 120, z: -10, x: -30 });
    k.box(60, 0.4, 20, 4, -0.2, 20, lawn);
    k.rail(-19, 20, 60, iron, 2.2, 'x', 1.2);
    for (const x of [-22, -6, 10, 26]) k.box(0.8, 2.8, 0.8, -19, 1.4, x - 6, lime);
    for (let i = 0; i < 6; i++) k.tree(-14 + i * 8, 0, 26, { kind: 'round', h: 5, r: 2.6, leaf: 0x4a7a3c, seed: i });
    k.box(120, 0.4, 100, -80, -0.2, -30, lawn);
    const rnd = X.mulberry(35);
    for (let i = 0; i < 30; i++) k.tree(-48 - rnd() * 50, 0, -60 + rnd() * 80, { kind: 'round', h: 7 + rnd() * 5, r: 4 + rnd() * 3, leaf: 0x3f6b36, seed: 40 + i });
    // the mansion: a limestone block with a rusticated base and the garden court's glass roof in the middle
    const MX = 4, MZ = -14, MW = 56, MD = 40;
    const CX = MX, CZ = MZ, CW = 22, CD = 26;
    k.box(MW, 14, MD, MX, 7, MZ, lime);
    /* The roof slab over the whole house hid the court's glass roof: from inside, the court looked up at stone and a
       lamp. It is a ring now, open over the court and its galleries, so the court is lit by the sky as it really is. */
    const hx0 = CX - (CW + 8) / 2, hx1 = CX + (CW + 8) / 2, hz0 = CZ - (CD + 8) / 2, hz1 = CZ + (CD + 8) / 2;
    const ox0 = MX - (MW + 0.6) / 2, ox1 = MX + (MW + 0.6) / 2, oz0 = MZ - (MD + 0.6) / 2, oz1 = MZ + (MD + 0.6) / 2;
    for (const [a0, a1, b0, b1] of [[ox0, hx0, oz0, oz1], [hx1, ox1, oz0, oz1], [hx0, hx1, oz0, hz0], [hx0, hx1, hz1, oz1]]) k.box(a1 - a0, 0.8, b1 - b0, (a0 + a1) / 2, 14, (b0 + b1) / 2, lime);
    k.moulding([[0, 0], [1.0, 0], [1.1, 0.3], [0.8, 0.5], [0.9, 0.8], [0.4, 1.0], [0, 1.2]], MW + 1, MX - MW / 2 - 0.05, 12.6, MZ, lime, 0);
    /* the avenue front: windows in limestone surrounds with cornices, a balustrade along the roof */
    const sashW = k.flat(0xf1ede4, 0, 0.55), paneD = k.flat(0x1a2026, 0.6, 0.08);
    for (let x = -24; x <= 24; x += 6) for (const y of [3.4, 9]) {
      if (y < 5 && (Math.abs(x - 12) < 3.5 || [-12, -4, 4].some((m) => Math.abs(x - m) < 2.7))) continue;
      win(k, MX - MW / 2, y, MZ + x, -1, 0, 1.5, 2.6, sashW, paneD, lime, 2);
      k.box(0.5, 0.22, 2.3, MX - MW / 2 - 0.25, y + 1.75, MZ + x, lime);
      k.box(0.4, 0.14, 2.5, MX - MW / 2 - 0.2, y + 1.92, MZ + x, lime);
    }
    const balus: [number, number, number, number][] = [];
    for (let z = MZ - MD / 2 + 1.7; z < MZ + MD / 2 - 1; z += 3.26) balus.push([MX - MW / 2 + 0.3, 14.4, z, PI / 2]);
    glbs(k, 'frick/balustrade', { width: 3.26 }, balus);
    k.box(4, 6, 0.8, MX - MW / 2, 3, MZ + 12, panel);
    k.box(6, 1.2, 1.6, MX - MW / 2 - 0.4, 6.4, MZ + 12, lime);
    for (const dz of [-2.6, 2.6]) k.column(MX - MW / 2 - 1.2, 0.1, MZ + 12 + dz, 6.2, 0.4, lime, true);
    board(k, 3.9, 0.5, MX - MW / 2 - 1.215, 6.45, MZ + 12, -PI / 2, (g, W, H) => { g.fillStyle = '#3a342a'; g.font = `600 ${H * 0.62}px "Archivo Expanded", "Archivo", serif`; fitFont(g, 'THE FRICK COLLECTION', (px) => `600 ${px}px "Archivo Expanded", "Archivo", serif`, H * 0.62, W * 0.94); g.fillText('THE FRICK COLLECTION', W / 2, H * 0.55); }, { px: 1024, lit: false, transparent: true });
    // the court: a glass roofed room in the centre, the mansion around it
    k.box(CW + 8, 0.4, CD + 8, CX, 14.2, CZ, glass);
    for (let x = -CW / 2 - 2; x <= CW / 2 + 2; x += 2.8) k.box(0.14, 0.3, CD + 8, CX + x, 14.3, CZ, iron);
    for (let z = -CD / 2 - 2; z <= CD / 2 + 2; z += 2.8) k.box(CW + 8, 0.3, 0.14, CX, 14.3, CZ + z, iron);
    /* a coved plaster frame round the glass, so the roof reads as a laylight and not as a hole */
    for (const s of [-1, 1]) { k.box(1.2, 0.6, CD + 8, CX + s * (CW / 2 + 3.6), 13.75, CZ, plasterW); k.box(CW + 8, 0.6, 1.2, CX, 13.75, CZ + s * (CD / 2 + 3.6), plasterW); }
    k.box(MW, 0.4, MD, MX, -0.05, MZ, floorM);
    /* The real fountain is a pool that runs the length of the court, with a tiered set of basins and a finial in the
       middle, all St. Genevieve marble, and two small bronze frogs at the ends spraying toward the centre. It was a
       round basin here. */
    const PL = 16, PWd = 3.2;
    k.box(PWd + 0.6, 0.5, PL + 0.6, CX, 0.25, CZ, marble);
    k.box(PWd + 0.9, 0.1, PL + 0.9, CX, 0.52, CZ, marble);
    k.box(PWd, 0.5, PL, CX, 0.3, CZ, water);
    k.lathe([[0.9, 0], [0.6, 0.4], [0.3, 1.2], [1.2, 1.4], [1.25, 1.5], [1.2, 1.6], [0.2, 1.8], [0.25, 2.2], [0.55, 2.3], [0.5, 2.38], [0.12, 2.45], [0.12, 2.9], [0.22, 3.0], [0.0, 3.25]], CX, 0.55, CZ, marble, 32);
    const frogM = k.flat(0x4a5a3a, 0.7, 0.45);
    for (const s of [-1, 1]) { const fz = CZ + s * (PL / 2 - 0.5); k.sphere(0.22, CX, 0.62, fz, frogM, 10); k.sphere(0.12, CX, 0.78, fz - s * 0.16, frogM, 8); k.mesh(new T.CylinderGeometry(0.02, 0.05, PL / 2 - 1.4, 5), k.glow(0xdff4ff), CX, 1.2, CZ + s * (PL / 4), true).rotation.x = PI / 2 + s * 0.08; }
    for (let z = -PL / 2 + 1.5; z <= PL / 2 - 1.5; z += 2.6) k.keepOut.push({ x: CX, z: CZ + z, r: 2.0 });
    for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2; k.mesh(new T.CylinderGeometry(0.03, 0.08, 2, 6), k.glow(0xdff4ff), CX + Math.cos(a) * 0.9, 2.45, CZ + Math.sin(a) * 0.9, true).rotation.z = Math.cos(a) * 0.3; }
    /* the paired ionic colonnade, with real carved ionic capitals (a model) on the shafts */
    const caps: [number, number, number, number][] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = CZ - 9 + i * 6; for (const d of [-0.9, 0.9]) { k.column(CX + s * (CW / 2 + 1.2), 0.1, z + d, 12.6, 0.44, marble, true); caps.push([CX + s * (CW / 2 + 1.2), 12.05, z + d, PI / 2]); } }
    for (let i = 0; i < 3; i++) { const x = CX - 6 + i * 6; for (const d of [-0.9, 0.9]) for (const zz of [CZ - CD / 2 - 1.2, CZ + CD / 2 + 1.2]) { k.column(x + d, 0.1, zz, 12.6, 0.44, marble, true); caps.push([x + d, 12.05, zz, 0]); } }
    glbs(k, 'frick/ionic_capital', { width: 1.55 }, caps);
    for (const s of [-1, 1]) k.box(1.2, 1.4, CD + 2.4, CX + s * (CW / 2 + 1.2), 13.3, CZ, marble);
    for (const s of [-1, 1]) k.box(CW + 2.4, 1.4, 1.2, CX, 13.3, CZ + s * (CD / 2 + 1.2), marble);
    /* the planting beds with real potted plants (Poly Haven), blocked as the beds they are, not as wide circles */
    const plants: [number, number, number, number][] = [];
    for (const s of [-1, 1]) { k.box(2, 0.8, 8, CX + s * 8, 0.4, CZ, marble); k.box(1.8, 0.1, 7.8, CX + s * 8, 0.82, CZ, k.flat(0x3a2a1e, 0, 1)); for (let j = -3; j <= 3; j += 2) plants.push([CX + s * 8, 0.86, CZ + j, j]); k.block(CX + s * 8 - 1.2, CX + s * 8 + 1.2, CZ - 4.2, CZ + 4.2); }
    glbs(k, 'frick/ph_potted_plant_01', { height: 1.9 }, plants);
    /* marble busts on pedestals at the court's four corners, a small horse in the middle of the south end */
    const busts: [number, number, number, number][] = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x = CX + sx * (CW / 2 - 1.2), z = CZ + sz * (CD / 2 - 1.2); k.box(0.7, 1.4, 0.7, x, 0.7, z, marble); k.box(0.86, 0.12, 0.86, x, 1.44, z, marble); busts.push([x, 1.5, z, Math.atan2(CX - x, CZ - z)]); k.keepOut.push({ x, z, r: 0.7 }); }
    glbs(k, 'frick/ph_marble_bust_01', { height: 0.95 }, busts);
    k.box(1.0, 1.2, 1.4, CX, 0.6, CZ + CD / 2 - 1.6, marble); k.keepOut.push({ x: CX, z: CZ + CD / 2 - 1.6, r: 1.0 });
    glbs(k, 'frick/ph_horse_statue_01', { height: 1.3 }, [[CX, 1.2, CZ + CD / 2 - 1.6, PI]]);
    // the galleries around the court: panelled walls with red silk over a dark dado, parquet floors, the works in gilt
    for (const s of [-1, 1]) { k.box(0.4, 14, MD, MX + s * (CW / 2 + 4), 7, MZ, lime); k.box(0.12, 1.5, MD - 4, MX + s * (CW / 2 + 3.72), 0.75, MZ, panel); k.box(0.1, 6.4, MD - 4, MX + s * (CW / 2 + 3.7), 4.8, MZ, damask); k.box(0.14, 0.12, MD - 4, MX + s * (CW / 2 + 3.68), 8.05, MZ, gold); k.box(0.14, 0.12, MD - 4, MX + s * (CW / 2 + 3.68), 1.55, MZ, gold); }
    for (const s of [-1, 1]) k.box(2.5, 0.03, MD - 2, MX + s * (CW / 2 + 2.6), 0.16, MZ, parquet);
    /* the end walls: the north one opens in the east gallery onto the enfilade (the trick, below) */
    const EF = { x: CX + CW / 2 + 2.6, w: 1.7, h: 3.5 }, NZ = MZ - CD / 2 - 6;
    k.box(EF.x - EF.w / 2 - (MX - MW / 2), 14, 0.4, (MX - MW / 2 + EF.x - EF.w / 2) / 2, 7, NZ, lime);
    k.box(MX + MW / 2 - (EF.x + EF.w / 2), 14, 0.4, (MX + MW / 2 + EF.x + EF.w / 2) / 2, 7, NZ, lime);
    k.box(EF.w, 14 - EF.h, 0.4, EF.x, EF.h + (14 - EF.h) / 2, NZ, lime);
    k.box(MW, 14, 0.4, MX, 7, MZ + CD / 2 + 6, lime);
    for (const s of [-1, 1]) k.block(MX + s * (CW / 2 + 4) - 0.3, MX + s * (CW / 2 + 4) + 0.3, MZ - MD / 2, MZ + MD / 2);
    k.block(MX - MW / 2, MX + MW / 2, NZ - 0.3, NZ + 0.3);
    k.block(MX - MW / 2, MX + MW / 2, MZ + CD / 2 + 5.7, MZ + CD / 2 + 6.3);
    k.block(MX - MW / 2 - 0.3, MX - MW / 2 + 0.3, MZ - MD / 2, MZ + 10);
    k.block(MX - MW / 2 - 0.3, MX - MW / 2 + 0.3, MZ + 14, MZ + MD / 2);
    k.block(MX + MW / 2 - 0.3, MX + MW / 2 + 0.3, MZ - MD / 2, MZ + MD / 2);
    /* THE TRICK (one a room): the door at the north end of the east gallery opens on an enfilade of five more
       galleries, each doorway smaller than the last and the floor rising toward a lit picture. It is six metres
       deep. A Firefly plate (queued) will be the picture at the end. */
    {
      const n = 6, depth = 6.2, z0 = NZ - 0.2, sh = 0.72;
      const frame = (i: number) => { const s = sh ** i; return { z: z0 - (depth * (1 - sh ** i)) / (1 - sh ** n), w: EF.w * s, h: EF.h * s, y: 0.9 * (1 - s) }; };
      const tiled = (sf: X.Surface, rx: number, ry: number, color: number) => { if (!HAS_DOM) return k.flat(color); const t = sf.map.clone(); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx, ry); t.needsUpdate = true; return new T.MeshStandardMaterial({ map: t, color, roughness: 0.85 }); };
      const silk = tiled(X.carpet(0x6a2626, 0xa86a52), 2, 5, 0xffffff), boards = tiled(X.planks(0x6a4a30, 8, 55), 1, 1, 0xffffff);
      for (let i = 0; i < n; i++) {
        const a = frame(i), b = frame(i + 1);
        const L = (f: ReturnType<typeof frame>, top: boolean) => v(EF.x - f.w / 2, f.y + (top ? f.h : 0), f.z), Rr = (f: ReturnType<typeof frame>, top: boolean) => v(EF.x + f.w / 2, f.y + (top ? f.h : 0), f.z);
        quad(k, L(a, false), L(b, false), L(b, true), L(a, true), silk, true);
        quad(k, Rr(b, false), Rr(a, false), Rr(a, true), Rr(b, true), silk, true);
        quad(k, v(EF.x - a.w / 2, a.y + 0.01, a.z), v(EF.x + a.w / 2, a.y + 0.01, a.z), v(EF.x + b.w / 2, b.y + 0.01, b.z), v(EF.x - b.w / 2, b.y + 0.01, b.z), boards, true);
        quad(k, v(EF.x - b.w / 2, b.y + b.h, b.z), v(EF.x + b.w / 2, b.y + b.h, b.z), v(EF.x + a.w / 2, a.y + a.h, a.z), v(EF.x - a.w / 2, a.y + a.h, a.z), plasterW, true);
        /* a doorway surround at each step, in the gallery's dark wood */
        if (i > 0) { const t = 0.12 * sh ** i; for (const s of [-1, 1]) k.box(t, a.h, t, EF.x + s * (a.w / 2 - t / 2), a.y + a.h / 2, a.z, panel); k.box(a.w, t, t, EF.x, a.y + a.h - t / 2, a.z, panel); }
      }
      const e = frame(n);
      k.box(e.w, e.h, 0.04, EF.x, e.y + e.h / 2, e.z - 0.02, damask);
      ffPlate(k, 'assets/museum/tex/frick/ff_enfilade_end.webp', e.w * 0.46, e.h * 0.4, EF.x, e.y + e.h * 0.55, e.z + 0.005, 0, 0, k.pbr('frickEndPic', X.gilt(0x8a6a3a), 4, { metalness: 0.4, roughness: 0.5 }));
      k.point(EF.x, e.y + e.h * 0.9, e.z + 0.6, 0xffe4c0, 1.2, 3);
      for (const s of [-1, 1]) k.box(0.22, EF.h + 0.2, 0.5, EF.x + s * (EF.w / 2 + 0.11), (EF.h + 0.2) / 2, NZ + 0.05, gold);
      k.box(EF.w + 0.66, 0.3, 0.5, EF.x, EF.h + 0.25, NZ + 0.05, gold);
    }
    for (const z of [MZ - 8, MZ + 8]) for (const s of [-1, 1]) k.point(MX + s * 20, 9, z, 0xfff0d6, 26, 16);
    k.point(CX, 11, CZ, 0xfff6e8, 12, 30);
    k.censusWall({ x: MX, y: 4.6, z: MZ + CD / 2 + 5.75, rotY: PI, cols: 26, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(3000, 104), pieces: ctx.all, backing: panel });
    board(k, 8, 0.7, MX, 8.4, MZ + CD / 2 + 5.75, PI, (g, W, H) => { g.fillStyle = '#2c2218'; g.fillRect(0, 0, W, H); g.strokeStyle = '#c9a552'; g.lineWidth = 5; g.strokeRect(9, 9, W - 18, H - 18); g.fillStyle = '#f0dfb4'; fitFont(g, 'FIFTH AVENUE  ·  THE GARDEN COURT', (px) => `700 ${px}px "Archivo Expanded", "Archivo", serif`, H * 0.48, W * 0.86); g.fillText('FIFTH AVENUE  ·  THE GARDEN COURT', W / 2, H * 0.55); }, { px: 2048 });
    /* easter eggs */
    const WF = { name: 'The Frick Collection, Wikipedia', url: 'https://en.wikipedia.org/wiki/The_Frick_Collection' };
    k.egg(v(CX, 0.9, CZ + 7.5), { id: 'frick-frogs', title: 'Two bronze frogs', text: 'The pool runs the length of the court, with a tiered set of basins and a finial in the middle, all carved from St. Genevieve marble from Missouri. At the ends, two small bronze frogs spray toward the centre. The fountain ran without a break from the 1930s until the renovation began in 2020.', clue: 'Crouch at the end of the long pool and look for the frog.', source: { name: 'Garden Court Fountain Conservation, EverGreene', url: 'https://evergreene.com/projects/garden-court-fountain-conservation/' } }, { r: 1.6 });
    k.egg(v(CX - CW / 2 - 1.2, 4.2, CZ - 3), { id: 'frick-carriage-court', title: 'Once the driveway', year: '1932', text: 'This was an open courtyard of the Frick house, the carriage court. To turn the mansion into a museum, John Russell Pope proposed clearing it and enclosing it under glass as a garden court with palms, plants and a sunken pool and fountain, and the idea seems to have won him the commission in March 1932. Hastings\'s old porte cochere was moved to become the museum\'s doorway.', clue: 'Stand among the paired columns and look up at the glass roof.', source: { name: 'The Frick Collection at 75: The Garden Court, The Frick Collection', url: 'https://www.frick.org/exhibitions/past/2010/75th/garden_court' } }, { r: 1.6 });
    k.egg(v(MX, 6.6, MZ + CD / 2 + 5.6), { id: 'frick-bequest', title: 'A house left to the public', year: '1919', text: 'Henry Clay Frick died in 1919 at 69 and left the house as a public museum for his art collection. The collection held 635 pieces of art and decoration when he died; by 2025 it had about 1,800.', clue: 'Read the sign over the census wall at the end of the court.', source: WF }, { r: 1.6 });
    k.egg(v(MX + CW / 2 + 2.6, 0.4, MZ + CD / 2 + 4), { id: 'frick-bowling', title: 'A bowling alley downstairs', text: 'The mansion has a bowling alley in the basement. Before the Frick Art Reference Library got its own building, the alley was used to store the library\'s collection.', clue: 'Look down at the floor in the far corner of the east gallery, as if you could see through it.', source: WF }, { r: 1.6 });
    k.egg(v(MX - MW / 2 - 0.6, 3.6, MZ + 12), { id: 'frick-reopened', title: 'Reopened in 2025', year: '2025', text: 'Annabelle Selldorf\'s plan to expand and renovate the museum was announced in April 2018 and approved by the Landmarks Preservation Commission that June. The Frick reopened on April 17, 2025, and that June it opened its first restaurant, Westmoreland.', clue: 'Stand at the front door under its pediment.', source: WF }, { r: 1.6 });
    k.egg(v(-19, 2.8, 10), { id: 'frick-hastings', title: '1 East 70th Street', year: '1914', text: 'Thomas Hastings of Carrere and Hastings designed the house at 1 East 70th Street, completed in 1914, with a facade of Indiana limestone. The lawn in front of it is mostly closed to the public. The garden on 70th Street came later, with the 1977 annex, designed by the British landscape architect Russell Page.', clue: 'Walk up to the iron fence along the avenue and look at the limestone house.', source: WF }, { r: 1.6 });
    k.egg(v(CX + CW / 2 + 2.6, 1.6, MZ - CD / 2 - 5.2), { id: 'frick-enfilade', title: 'Five rooms in six metres', year: '1653', text: 'Through the door at the end of the east gallery an enfilade runs on through five more rooms, each doorway in line with the last. It is six metres deep: every doorway is smaller than the one before and the floor climbs toward the picture at the end. It is forced perspective, the trick Francesco Borromini built in stone at the Palazzo Spada in Rome, where a colonnade about eight metres long passes for thirty seven.', clue: 'Walk to the north end of the east gallery and look through the door.', source: { name: 'Palazzo Spada, Wikipedia', url: 'https://en.wikipedia.org/wiki/Palazzo_Spada' } }, { r: 1.6 });
    // the works: the two long galleries in gilt, the court's end walls, the avenue front
    const mounts: Mount[] = [];
    /* These ten hang on the outer walls at MX +/- 14.64 and face inward, but the
       target was set further out still, at +/- 20, which is behind the wall they
       are hung on. Every one of them was turned to face the stone. The viewer
       belongs in the gallery, between the wall and the colonnade. */
    for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const z = MZ - 14 + i * 7; mounts.push({ position: v(MX + s * (CW / 2 + 3.64), 3.6, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(MX + s * (CW / 2 - 1.6), 3, z), width: 4.4, height: 2.6, style: 'gilt' }); }
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const x = MX - 12 + i * 12; mounts.push({ position: v(x, 3.6, MZ - CD / 2 - 5.76), rotation: 0, target: v(x, 3, MZ - CD / 2), width: 4.4, height: 2.6, style: 'gilt' }); break; }
    for (const x of [MX - 20, MX + 20]) mounts.push({ position: v(x, 3.6, MZ + CD / 2 + 5.76), rotation: PI, target: v(x, 3, MZ + CD / 2), width: 4.4, height: 2.6, style: 'gilt' });
    for (const x of [MX - 8, MX + 8]) mounts.push({ position: v(x, 3.6, MZ - CD / 2 - 5.76), rotation: 0, target: v(x, 3, MZ - CD / 2), width: 4.4, height: 2.6, style: 'gilt' });
    for (let i = 0; i < 4; i++) { const z = MZ - 12 + i * 8; if (Math.abs(z - (MZ + 12)) < 3) continue; mounts.push({ position: v(MX - MW / 2 - 0.1, 3.4, z), rotation: -PI / 2, target: v(MX - MW / 2 - 5, 3, z), width: 3.2, height: 1.9, style: 'black', wash: false }); }
    return { mounts, spawn: v(MX - MW / 2 - 14, 3, MZ + 14), look: v(MX - MW / 2, 5, MZ - 2), eye: 3, bounds: [MX - MW / 2 - 16, MX + MW / 2 - 1, MZ - MD / 2 + 1, MZ + MD / 2 + 8], style: 'gilt' };
  },
};

/* ---------------- 36 SOUTH STREET SEAPORT ---------------- */
export const seaport: RoomDef = {
  id: 'seaport',
  name: 'The tall ship',
  area: 'SOUTH STREET SEAPORT',
  mood: 'Morning fog lifting',
  color: '#9fb8c4',
  description: 'Cobblestones, the brick counting houses, a square rigger at the pier, the census hung in the rigging and along the row.',
  signatures: 'The Schermerhorn Row brick warehouses, Belgian block paving, the iron and timber pier, a three masted ship with yards and rigging, the bridge over the rooftops.',
  build(k, ctx) {
    k.sky({ top: 0x8fa9c4, horizon: 0xe6e8e6, ground: 0x5a6068, fog: 0.005, sun: { az: 1.1, el: 0.35, color: 0xfff0d6, size: 18 }, haze: 0.45, env: 0.8 });
    k.hemi(0xeef2f8, 0x3a4048, 0.85);
    k.sun(0xffefd8, 1.8, 40, 30, 40, true, 80);
    /* THE BIG UPGRADE 2c: Belgian block, Flemish bond brick, granite piers, a weathered plank pier and slate roofs,
       every one a Poly Haven scan at real size. */
    const R = 'seaport';
    const cobble = scan(k, R, 'square_cobblestone', 2.2, () => X.cobble(0x6a6862, 22), { color: 0xe6e0d8 }, 0x6a6862),
      brick = scan(k, R, 'red_brick', 1.4, () => X.brick(0x7a4a3a, 55), { color: 0xf0c8b8 }, 0x7a4a3a),
      granite = scan(k, R, 'granite_wall', 1.9, () => X.ashlar(0x8a8a86, 56, 2), { color: 0xf2f0ea }, 0x8a8a86),
      timber = scan(k, R, 'weathered_planks', 2, () => X.planks(0x5a4a3a, 5, 57), { color: 0xd8ccc0 }, 0x5a4a3a),
      deck = k.pbr('shipDeck', X.planks(0xb89a70, 10, 59), 0.9),
      mast = k.pbr('mast', X.planks(0x8a6a48, 3, 60), 1.4),
      rope = k.flat(0xc9b89a, 0, 0.9),
      iron = k.flat(0x1f242a, 0.75, 0.45),
      sail = k.flat(0xe9e2d0, 0, 0.92),
      glass = k.glass(0xbfd6e2, 0.3, 0.08),
      sashW = k.flat(0xf1ede4, 0, 0.55),
      paneD = k.flat(0x182028, 0.6, 0.08),
      paneL = k.flat(0x2a241c, 0.1, 0.35, { emissive: 0xffc27a, emissiveIntensity: 0.05 + 1.2 * k.night }),
      shutterM = k.flat(0x1e2a24, 0.2, 0.6);
    void glass;
    // the water, the pier, the street of Belgian block
    k.water({ y: -1.6, color: 0x2e4a58, w: 400, d: 300, x: 60, z: -60, amp: 1.2 });
    k.box(40, 0.5, 90, -20, -0.25, -20, cobble);
    k.box(14, 0.6, 70, 12, -0.3, -30, timber);
    for (let z = 0; z > -64; z -= 4) for (const dx of [-6, 6]) k.cyl(0.28, 3.4, 12 + dx, -1.5, z, timber, 0.28, 8);
    k.rail(18.8, -30, 70, iron, 1.0, 'z', 1.5);
    k.rail(5.2, -30, 70, iron, 1.0, 'z', 1.5);
    for (const z of [-6, -30, -54]) { k.prop('cleat', 7, 0, z, { height: 0.5 }); k.prop('cleat', 17, 0, z, { height: 0.5 }); }
    k.prop('buoy', 8, 0, 4, { height: 1.9, keepOut: 0.8 });
    k.prop('lobster_trap', 16, 0, -14, { height: 0.9, rotY: 0.4 });
    k.prop('life_ring', 18.9, 1.2, -20, { height: 0.9, rotY: PI / 2 });
    k.prop('bell', 4.4, 1.8, -2, { height: 0.9 });
    k.box(0.25, 1.8, 0.25, 4.4, 0.9, -2, iron);
    /* cargo on the pier and the street: barrels and crates (Poly Haven), a channel marker riding in the river */
    glbs(k, 'seaport/nyb_dumbo_barrel', { height: 1.25 }, [[7.6, 0, -9.2, 0.3], [8.5, 0, -10.0, 1.2], [7.5, 0, -10.6, 2.0], [-17.2, 0, -21.5, 0.6], [-16.4, 0, -22.4, 2.2], [16.6, 0, -37.4, 0.4], [17.2, 0, -38.4, 1.8], [8.0, 1.25, -10.0, 0.9]], undefined, 4);
    
    glbs(k, 'seaport/wooden_military_crate', { width: 1.7 }, [[7.8, 0, -47.5, 0.1], [7.9, 0.64, -47.4, 0.25], [16.8, 0, -40, 1.5], [-17.4, 0, -6.2, 0.2]]);
    for (const [x, z, r] of [[8, -10, 1.6], [16.9, -38.4, 1.6], [7.9, -47.5, 1.3], [-16.8, -22, 1.2], [-17.4, -6.2, 1.0]] as const) k.keepOut.push({ x, z, r });
    glbs(k, 'seaport/ph_lateral_sea_marker', { height: 5.5 }, [[46, -2.6, 8, 0.4]], (os) => { if (ctx.reduced) return; const o = os[0], y0 = o.position.y; k.ticks.push((t) => { o.position.y = y0 + Math.sin(t * 0.8) * 0.18; o.rotation.z = Math.sin(t * 0.6) * 0.05; }); });
    // the row: brick counting houses with granite piers, shopfronts on the ground floor
    /* The Fulton Street buildings are four storeys (2 Fulton has six) of plain red Flemish bond brick under one slate
       roof, "the only file of slant-roof warehouses still intact in New York City". They were 14 to 18 m with flat tops. */
    const slate = scan(k, R, 'roof_slates_02', 3, () => X.ashlar(0x4a4e56, 61, 8), { color: 0xd0d4dc }, 0x4a4e56);
    const trades = ['SHIP CHANDLERY', 'SAIL LOFT', 'ROPE  ·  CORDAGE', 'COUNTING HOUSE', 'OYSTERS', 'CHARTS  ·  INSTRUMENTS', 'TEA  ·  COFFEE'];
    for (let i = 0; i < 7; i++) {
      const z = 14 - i * 10, h = i === 0 ? 18.4 : 13.6;
      k.box(12, h, 9.6, -26, h / 2, z, brick);
      k.box(12.4, 0.6, 9.8, -26, h, z, granite);
      { const g = new T.CylinderGeometry(1, 1, 9.8, 3); g.rotateX(-PI / 2); const r = k.mesh(g, slate, -26, h + 1.3, z); r.scale.set(7.2, 2, 1); }
      /* two dormers on the street slope of each roof */
      for (const dz of [-2.4, 2.4]) { k.box(1.6, 1.5, 1.5, -21.3, h + 1.25, z + dz, brick); win(k, -20.5, h + 1.2, z + dz, 1, 0, 0.9, 0.9, sashW, paneD, undefined, 2); const c = new T.CylinderGeometry(1, 1, 1.7, 3); c.rotateZ(PI / 2); const cm = k.mesh(c, slate, -21.2, h + 2.2, z + dz); cm.scale.set(1, 0.55, 0.95); }
      for (let dz = -3.6; dz <= 3.6; dz += 2.4) { k.box(0.6, 3.6, 0.5, -20, 1.8, z + dz, granite); }
      k.box(0.1, 3.4, 8.4, -19.85, 1.9, z, paneD);
      k.box(0.5, 0.5, 9.6, -19.9, 3.85, z, granite);
      /* the trade painted on the granite lintel, gilt on black */
      board(k, 6.2, 0.42, -19.63, 3.85, z, PI / 2, (g, W, H) => { g.fillStyle = '#16191c'; g.fillRect(0, 0, W, H); g.fillStyle = '#e2c27a'; fitFont(g, trades[i], (px) => `800 ${px}px "Archivo Expanded", "Archivo", serif`, H * 0.6, W * 0.9); g.fillText(trades[i], W / 2, H * 0.55); }, { px: 1024, lit: false });
      /* six over six sash windows with granite lintels and sills, and shutters */
      for (let y = 6; y < h - 1; y += 2.8) for (const dz of [-3, 0, 3]) { win(k, -20, y, z + dz, 1, 0, 1.15, 1.75, sashW, (i + Math.round(y)) % 3 === 0 ? paneL : paneD, granite, 3); for (const s of [-1, 1]) k.box(0.05, 1.8, 0.55, -19.95, y, z + dz + s * 0.9, shutterM); }
      if (i % 2 === 1) k.prop('fire_escape', -18.95, 7, z + 2, { height: 3.2, rotY: -PI / 2 });
    }
    k.block(-32.4, -19.6, -50, 20);
    for (const z of [8, -18, -44]) k.lamp(-15, z, 6, iron, 0xffd9a8, 26);
    k.prop('lamppost', 2, 0, -46, { height: 6 });
    board(k, 6, 0.6, -19.63, 5.0, -16, PI / 2, (g, W, H) => { g.fillStyle = '#1f2c38'; g.fillRect(0, 0, W, H); g.strokeStyle = '#e8dcc0'; g.lineWidth = 6; g.strokeRect(10, 10, W - 20, H - 20); g.fillStyle = '#f4efe0'; fitFont(g, 'SCHERMERHORN ROW  ·  1812', (px) => `800 ${px}px "Archivo Expanded", "Archivo", serif`, H * 0.55, W * 0.86); g.fillText('SCHERMERHORN ROW  ·  1812', W / 2, H * 0.55); }, { px: 1024 });
    /* the green street signs at Fulton and South */
    k.cyl(0.06, 3.6, -14.2, 1.8, 17, iron, 0.06, 8);
    board(k, 1.5, 0.3, -14.2, 3.45, 17, 0, (g, W, H) => { g.fillStyle = '#1f6a3a'; g.fillRect(0, 0, W, H); g.strokeStyle = '#fff'; g.lineWidth = 3; g.strokeRect(5, 5, W - 10, H - 10); g.fillStyle = '#fff'; g.font = `800 ${H * 0.6}px "Archivo", sans-serif`; g.fillText('FULTON ST', W / 2, H * 0.55); }, { px: 512, double: true });
    board(k, 1.5, 0.3, -14.2, 3.1, 17, PI / 2, (g, W, H) => { g.fillStyle = '#1f6a3a'; g.fillRect(0, 0, W, H); g.strokeStyle = '#fff'; g.lineWidth = 3; g.strokeRect(5, 5, W - 10, H - 10); g.fillStyle = '#fff'; g.font = `800 ${H * 0.6}px "Archivo", sans-serif`; g.fillText('SOUTH ST', W / 2, H * 0.55); }, { px: 512, double: true });
    /* a ghost sign painted high on the end wall of 2 Fulton: a Firefly plate (queued); the painted stand in until then */
    ffPlate(k, 'assets/museum/tex/seaport/ff_ghost_sign.webp', 8.4, 4.8, -26, 12.4, 18.83, 0, 0, (() => {
      if (!HAS_DOM) return k.flat(0x7a4a3a);
      const c = document.createElement('canvas'); c.width = 1024; c.height = 586; const g = c.getContext('2d')!;
      g.clearRect(0, 0, 1024, 586); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(236,226,204,0.55)';
      g.font = '900 150px "Archivo", sans-serif'; g.fillText('SHIP', 512, 120); g.font = '900 120px "Archivo", sans-serif'; g.fillText('CHANDLERY', 512, 270);
      g.font = '800 64px "Archivo Expanded", "Archivo", sans-serif'; g.fillText('SAIL LOFT  ·  ROPE  ·  TAR', 512, 410); g.fillText('SOUTH ST  ·  1835', 512, 500);
      const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
      return new T.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2 });
    })());
    /* THE TRICK (one a room): WAVERTREE  1885 painted flat on the pier planks, stretched so it stands up as a sign only
       from the head of the pier. A step aside and it lies back down as deck paint. */
    anamorph(k, 'WAVERTREE  ·  1885', 12, 7, 3, 0, 9, 4.8, 1.3, '#f2ead8', 150);
    /* easter eggs */
    const WS = { name: 'Schermerhorn Row, Wikipedia', url: 'https://en.wikipedia.org/wiki/Schermerhorn_Row' }, WW = { name: 'Wavertree (ship), Wikipedia', url: 'https://en.wikipedia.org/wiki/Wavertree_(ship)' };
    k.egg(v(-19.6, 5.6, -16), { id: 'seaport-saved', title: 'Nearly an office tower', year: '1968', text: 'Schermerhorn Row is about twenty buildings on Fulton, Front, John and South Streets, the Fulton Street ones from 1811 to 1812, named for the developer Peter Schermerhorn. A developer once wanted the block replaced by an office building, and the South Street Seaport Museum spent millions on legal fees to save it. The city made the buildings landmarks on October 29, 1968.', clue: 'Read the Schermerhorn Row sign on the brick front.', source: WS }, { r: 1.6 });
    k.egg(v(-20.2, 15.5, 4), { id: 'seaport-slant-roofs', title: 'The last slant roofs', year: '1812', text: 'The Fulton Street buildings were built nearly identical, four storeys of plain red brick in Flemish bond under one shared slate roof. The New York Times called them the only file of slant roof warehouses still intact in New York City. The museum\'s curator compared their scale to City Hall\'s.', clue: 'Look up at the slate roofs above the row.', source: WS }, { r: 1.6 });
    k.egg(v(-18.6, 0.4, -6), { id: 'seaport-landfill', title: 'Built on the river', text: 'Before the colony, this ground was under the East River, and the shoreline ran along Water and Pearl Streets, about three blocks inland. The block stands on land filled in between Burling Slip and Beekman Slip, and the shore did not reach South Street until the 1810s. The original wooden plank footings are kept soaked in salt water so they do not rot.', clue: 'Look down at the cobbles where the row meets the street.', source: WS }, { r: 1.6 });
    k.egg(v(16, 0.9, -14), { id: 'seaport-fish-market', title: 'Across Fulton Street', year: '1816', text: 'Ferry service from here to Brooklyn began in 1814, and the Fulton Market opened across Fulton Street in 1816, the forerunner of the Fulton Fish Market. Sweet\'s Seafood House stayed in the row for over a century. Hotel rooms on the block were once under 100 square feet, with no heat, lighting or bathrooms.', clue: 'Find the lobster trap on the pier.', source: WS }, { r: 1.6 });
    k.egg(v(12, 0.4, -1), { id: 'seaport-anamorph', title: 'Her name on the planks', year: '1533', text: 'WAVERTREE and her year are painted flat along the pier and stretched, so they stand up as a sign only from the head of the pier. Take one step aside and they lie back down as deck paint. It is anamorphosis, the trick Hans Holbein used to hide a skull across the floor of The Ambassadors in 1533.', clue: 'Stand at the head of the pier and look along the planks toward the ship.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.6 });
    // the ship: hull, deck, three masts with yards, rigging, furled sails
    const SX = 28, SZ = -34, SL = 70;
    /* The hull was a half sphere and a half cylinder, a black tube. It is a lofted iron hull now: forty stations along
       a 74 m length, a fine bow and a fuller stern, the sheer rising at both ends, black topsides over a red boot top,
       a thin white line under the rail. A real model of Wavertree is queued; this is the best code can do meanwhile. */
    {
      const L = SL + 4, B = 6.3, KEEL = -5.2, NS = 48, NU = 14, pos: number[] = [], col: number[] = [], idx: number[] = [];
      const black = new T.Color(0x15181c), redC = new T.Color(0x6a2018), white = new T.Color(0xe8e4da);
      const half = (t: number) => t >= 0 ? B * Math.max(0, 1 - t ** 2.4) ** 0.55 : B * Math.max(0, 1 - (-t) ** 5) ** 0.5;
      const sheer = (t: number) => 4.2 + 1.3 * t ** 2 + (t > 0 ? 0.6 * t ** 3 : 0);
      for (let i = 0; i <= NS; i++) {
        const t = -1 + (2 * i) / NS, b = half(t), top = sheer(t), z = SZ + (t * L) / 2;
        for (const side of [-1, 1]) for (let j = 0; j <= NU; j++) {
          const u = j / NU, x = SX + side * b * (1 - (1 - u) ** 3), y = KEEL + (top - KEEL) * u;
          pos.push(x, y, z);
          const c = y < -1.25 ? redC : top - y < 0.22 && top - y > 0.08 ? white : black;
          col.push(c.r, c.g, c.b);
        }
      }
      const row = (NU + 1) * 2;
      for (let i = 0; i < NS; i++) for (let s = 0; s < 2; s++) for (let j = 0; j < NU; j++) {
        const a = i * row + s * (NU + 1) + j, b2 = a + row;
        if (s === 0) idx.push(a, a + 1, b2, a + 1, b2 + 1, b2); else idx.push(a, b2, a + 1, a + 1, b2, b2 + 1);
      }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      const hullM = new T.MeshStandardMaterial({ vertexColors: true, metalness: 0.35, roughness: 0.5, side: T.DoubleSide });
      const hm = k.mesh(g, hullM, 0, 0, 0, true);
      hm.castShadow = hm.receiveShadow = k.o.quality === 'high';
      /* the rail cap along the bulwark, the name on both bows */
      const capPts: T.Vector3[] = [];
      for (const side of [-1, 1]) { const pts: T.Vector3[] = []; for (let i = 2; i <= NS - 2; i++) { const t = -1 + (2 * i) / NS; pts.push(v(SX + side * half(t), sheer(t) + 0.04, SZ + (t * L) / 2)); } k.curve(pts, 0.12, k.pbr('railTeak', X.planks(0x6a4a30, 3, 62), 2), 80); capPts.push(...pts); }
      void capPts;
      for (const side of [-1, 1]) { const t = 0.78, z = SZ + (t * L) / 2, x = SX + side * (half(t) + 0.05); board(k, 6, 0.8, x, sheer(t) - 0.9, z, side * PI / 2 + (side < 0 ? 0.12 : -0.12), (g2, W, H) => { g2.fillStyle = '#e2c27a'; fitFont(g2, 'WAVERTREE', (px) => `900 ${px}px "Archivo Expanded", "Archivo", serif`, H * 0.7, W * 0.92); g2.fillText('WAVERTREE', W / 2, H * 0.55); }, { px: 1024, lit: false, transparent: true }); }
    }
    k.box(12.0, 0.4, SL - 8, SX, 2.6, SZ, deck);
    k.beam(v(SX, 5.2, SZ + SL / 2 + 1), v(SX, 9.5, SZ + SL / 2 + 20), 0.32, mast, 10);
    k.beam(v(SX, 9.5, SZ + SL / 2 + 20), v(SX, 11, SZ + SL / 2 + 27), 0.14, mast, 8);
    k.rail(SX - 6, SZ, SL - 8, iron, 1.0, 'z', 1.6);
    k.rail(SX + 6, SZ, SL - 8, iron, 1.0, 'z', 1.6);
    /* the deckhouse: varnished teak with portholes and a skylight, the wheel behind it */
    const teak = k.pbr('deckhouseTeak', X.planks(0x7a5434, 4, 63), 1.6, { roughness: 0.35 });
    k.box(6, 2.4, 10, SX, 3.9, SZ - 24, teak);
    k.box(6.4, 0.18, 10.4, SX, 5.15, SZ - 24, k.flat(0xf0ece2, 0, 0.6));
    k.box(2.2, 0.6, 2.8, SX, 5.5, SZ - 22, teak); k.box(2.0, 0.08, 2.6, SX, 5.82, SZ - 22, k.glass(0xcfe0ea, 0.5, 0.1));
    for (const s of [-1, 1]) for (const dz of [-3, 0, 3]) k.cyl(0.22, 0.06, SX + s * 3.02, 4.1, SZ - 24 + dz, k.flat(0xc9a24a, 0.85, 0.3), 0.22, 16).rotation.z = PI / 2;
    k.prop('ships_wheel', SX, 3.2, SZ - 30, { height: 1.6, rotY: 0 });
    k.prop('porthole', SX + 6.5, 1.0, SZ - 10, { height: 0.7, rotY: PI / 2 });
    k.prop('porthole', SX + 6.5, 1.0, SZ + 10, { height: 0.7, rotY: PI / 2 });
    for (const mz of [SZ - 20, SZ, SZ + 20]) {
      k.beam(v(SX, 2.8, mz), v(SX, 46, mz), 0.42, mast, 10);
      k.beam(v(SX, 46, mz), v(SX, 58, mz), 0.22, mast, 8);
      /* the fighting tops and crosstrees */
      k.box(3.2, 0.25, 2.4, SX, 25.5, mz, mast); k.box(2.0, 0.18, 1.4, SX, 46.2, mz, mast);
      for (const [y, w] of [[14, 30], [24, 26], [34, 22], [44, 16]]) {
        k.beam(v(SX - w / 2, y, mz), v(SX + w / 2, y, mz), 0.2, mast, 8);
        /* sails furled on the yards, as she lies at the pier */
        k.beam(v(SX - w / 2 + 1.2, y - 0.32, mz + 0.12), v(SX + w / 2 - 1.2, y - 0.32, mz + 0.12), 0.3, sail, 10);
        for (let x = -w / 2 + 2; x < w / 2 - 1; x += 2.2) k.beam(v(SX + x, y - 0.6, mz + 0.12), v(SX + x, y + 0.05, mz + 0.12), 0.32, sail, 6);
        k.beam(v(SX - w / 2, y + 0.3, mz), v(SX + w / 2, y + 0.3, mz), 0.025, rope, 3);
      }
      for (const s of [-1, 1]) for (let i = 0; i < 6; i++) k.beam(v(SX + s * 6.2, 4.2, mz - 6 + i * 2.4), v(SX + s * 1.0, 45, mz), 0.03, rope, 4);
      for (let i = 0; i < 10; i++) { const y = 6 + i * 3.6; for (const s of [-1, 1]) k.beam(v(SX + s * (6 - i * 0.5), y, mz), v(SX + s * (1 + (9 - i) * 0.5), y + 3.6, mz - 1), 0.012, rope, 3); }
    }
    k.beam(v(SX, 58, SZ + 20), v(SX, 11, SZ + SL / 2 + 27), 0.05, rope, 4);
    k.beam(v(SX, 46, SZ + 20), v(SX, 9.5, SZ + SL / 2 + 20), 0.04, rope, 4);
    k.beam(v(SX, 58, SZ - 20), v(SX, 8, SZ - SL / 2 - 2), 0.05, rope, 4);
    k.block(SX - 7, SX + 7, SZ - SL / 2, SZ + SL / 2);
    // the gangway onto the deck, and the deck as walkable ground
    for (let i = 0; i < 6; i++) k.box(2.4, 0.3, 1.2, 20 + i * 0.6, 0.15 + i * 0.5, SZ + 8 - i * 0.2, timber);
    k.beam(v(19.6, 1.1, SZ + 9.2), v(22.4, 3.9, SZ + 8.6), 0.03, iron, 4); k.beam(v(19.6, 1.1, SZ + 6.8), v(22.4, 3.9, SZ + 6.6), 0.03, iron, 4);
    k.blocks.pop();
    k.block(SX - 7, SX - 6.2, SZ - SL / 2 + 3, SZ + 6);
    k.block(SX - 7, SX - 6.2, SZ + 10, SZ + SL / 2 - 3);
    k.block(SX + 6.2, SX + 7, SZ - SL / 2 + 3, SZ + SL / 2 - 3);
    k.block(SX - 7, SX + 7, SZ - SL / 2 - 1, SZ - SL / 2 + 3);
    k.block(SX - 7, SX + 7, SZ + SL / 2 - 3, SZ + SL / 2 + 1);
    k.keepOut.push({ x: SX, z: SZ - 24, r: 6 });
    k.egg(v(SX, 4.0, SZ + 12), { id: 'seaport-wavertree', title: 'Wrought iron', year: '1885', text: 'The museum\'s tall ship Wavertree was built in Southampton in 1885 as Southgate, one of the last large sailing ships built of wrought iron, and is called the largest wrought iron sailing vessel afloat. She carried jute between eastern India and Scotland, then tramped cargo anywhere in the world.', clue: 'Walk up the gangway onto the deck.', source: WW }, { r: 1.6 });
    k.egg(v(SX + 1.2, 4.2, SZ), { id: 'seaport-cape-horn', title: 'Dismasted off Cape Horn', year: '1910', text: 'In 1910 Wavertree was dismasted off Cape Horn and barely reached the Falklands. Instead of re-rigging her, her owners sold her as a floating warehouse at Punta Arenas, and from 1947 she was a sand barge in Buenos Aires. An American found her there in 1967, the Seaport Museum bought her in 1968, and a $13 million restoration on Staten Island brought her back in 2016.', clue: 'Stand at the foot of the mainmast.', source: WW }, { r: 1.6 });
    for (const mz of [SZ - 20, SZ, SZ + 20]) k.keepOut.push({ x: SX, z: mz, r: 0.9 });
    // the bridge over the rooftops, the far shore
    for (const x of [-60, 20]) { for (const dz of [-2, 2]) k.arch(4, 18, 3, x, 6, -140 + dz, granite, true, 0.7); k.box(12, 0.9, 6, x, 30, -140, granite); }
    k.box(160, 0.6, 6, -20, 12, -140, iron);
    for (const z of [-137.5, -142.5]) { const pts = []; for (let i = 0; i <= 80; i++) { const x = -100 + i * 2; const y = Math.abs(x + 20) <= 40 ? 15 + 14 * ((x + 20) / 40) ** 2 : 29 - 14 * ((Math.abs(x + 20) - 40) / 40); pts.push(v(x, y, z)); if (i % 2 === 0) k.beam(v(x, 12.5, z), v(x, y, z), 0.03, k.flat(0xd8dde2, 0.6, 0.4), 4); } k.curve(pts, 0.1, k.flat(0xd8dde2, 0.6, 0.4), 80); }
    k.skyline({ z: -220, count: 30, spacing: 8, scale: 2.4, base: -2, seed: 101, lit: 0.2, glow: 0.4, tint: 0x6e7684 });
    k.skyline({ z: 90, count: 20, spacing: 10, scale: 3.2, base: -2, seed: 102, lit: 0.2, glow: 0.4, tint: 0x5e6674, rows: 1 });
    k.censusWall({ x: -19.8, y: 3.4, z: -28, rotY: PI / 2, cols: 14, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(2800, 56), pieces: ctx.all, backing: granite });
    // the works: along the row's shopfronts, on the pier rail screens, hung in the rigging as banners
    const mounts: Mount[] = [];
    for (let i = 0; i < 6; i++) { const z = 14 - i * 10; if (i === 4) continue; mounts.push({ position: v(-19.8, 3.4, z), rotation: PI / 2, target: v(-14, 3, z), width: 4.6, height: 2.7, style: 'oak' }); }
    for (let i = 0; i < 5; i++) { const z = -2 - i * 12; k.box(0.3, 4, 5, 18.9, 2.6, z, timber); mounts.push({ position: v(18.72, 3.0, z), rotation: -PI / 2, target: v(14, 3, z), width: 4.4, height: 2.6, style: 'oak', wash: false }); }
    for (const mz of [SZ - 20, SZ, SZ + 20]) for (const y of [8, 19, 29]) { mounts.push({ position: v(SX - 6.5, y, mz + 1.2), rotation: PI / 2, target: v(SX - 3, 3, mz + 6), width: 4.6, height: 3.4, style: 'none', wash: false, lookAt: v(SX - 6.5, y, mz + 1.2) }); }
    mounts.splice(mounts.length - 3, 3);
    for (const x of [SX - 1.6, SX + 1.6]) mounts.push({ position: v(x, 3.9, SZ - 18.96), rotation: 0, target: v(x, 3, SZ - 14.5), width: 2.6, height: 1.6, style: 'oak', wash: false });
    return { mounts, spawn: v(-8, 3, 20), look: v(SX, 20, SZ), eye: 3, bounds: [-19.4, SX + 6, -66, 22], style: 'oak', floorY: (x, z) => {
      if (x > SX - 6.4 && x < SX + 6.4 && z > SZ - SL / 2 + 3 && z < SZ + SL / 2 - 3) return 2.8;
      if (x > 19 && x <= SX - 6.4 && Math.abs(z - (SZ + 8)) < 1.4) return ((x - 19) / (SX - 6.4 - 19)) * 2.8;
      return 0;
    } };
  },
};
