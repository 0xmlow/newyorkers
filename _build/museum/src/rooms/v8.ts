/* 153 and 154: two rooms New Yorkers take their visitors to.
   The Palm Court at the Plaza, afternoon tea under the stained glass laylight with the palms, the
   trellis, the mirrors and the four caryatids, and the Pulitzer Fountain through the Fifth Avenue
   doors; and Chelsea Market, the long brick concourse through the old Nabisco bakery, with the
   waterfall from the old pipe, the ducts overhead, the stalls, the clock and the High Line at the
   Tenth Avenue end. Moving things are instanced rigs or single groups on k.ticks, and nothing
   moves when ctx.reduced is set. */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as X from '../textures';
import { v, type Mount } from '../kit';
import type { RoomDef } from './types';
const PI = Math.PI;
type K = Parameters<RoomDef['build']>[0];

/* a standing or seated figure that never moves: batched with everything else of its colour */
function figure(k: K, x: number, y: number, z: number, coat: number, p: { h?: number; rotY?: number; skin?: number } = {}) {
  const { h = 1, rotY = 0, skin = 0xc8a284 } = p;
  const body = k.mesh(new T.CapsuleGeometry(0.2, 0.82 * h, 3, 8), k.flat(coat, 0, 0.85), x, y + 0.61 * h, z);
  body.rotation.y = rotY;
  k.mesh(new T.SphereGeometry(0.125, 10, 8), k.flat(skin, 0, 0.7), x, y + (1.22 * h + 0.13), z);
  return body;
}
/* a small figure with a head, as one merged geometry for instancing */
function figureGeo(r = 0.2, len = 0.82, headY = 1.35) {
  const body = new T.CapsuleGeometry(r, len, 3, 8); body.translate(0, r + len / 2, 0);
  const head = new T.SphereGeometry(r * 0.62, 10, 8); head.translate(0, headY, 0);
  return mergeGeometries([body, head])!;
}
const canvasTex = (c: HTMLCanvasElement) => { const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t; };
const mkCanvas = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

/* Diagonal lattice clipped to a w x h rectangle, placed in the world by at(u, v). */
function lattice(k: K, w: number, h: number, step: number, m: T.Material, at: (u: number, v: number) => T.Vector3, bar = 0.05) {
  const clip = (px: number, py: number, dx: number, dy: number) => {
    let t0 = -1e9, t1 = 1e9;
    for (const [p, d, lo, hi] of [[px, dx, -w / 2, w / 2], [py, dy, -h / 2, h / 2]]) {
      if (Math.abs(d) < 1e-9) { if (p < lo || p > hi) return null; continue; }
      const a = (lo - p) / d, b = (hi - p) / d;
      t0 = Math.max(t0, Math.min(a, b)); t1 = Math.min(t1, Math.max(a, b));
    }
    return t1 > t0 + 0.05 ? [t0, t1] : null;
  };
  const span = w + h;
  for (const s of [1, -1]) for (let c = -span; c <= span; c += step) {
    const r = clip(c, 0, s, 1); if (!r) continue;
    k.bar(at(c + s * r[0], r[0]), at(c + s * r[1], r[1]), bar, bar * 0.8, m);
  }
}

/* The laylight, painted in polar form: the top of the canvas is the centre of the glass, the bottom its rim. */
function laylightTexture() {
  const W = 2048, H = 512, c = mkCanvas(W, H), g = c.getContext('2d')!;
  const rnd = X.mulberry(153);
  const lead = '#5a4a30';
  g.fillStyle = '#efe2bd'; g.fillRect(0, 0, W, H);
  const seg = 64, sw = W / seg;
  /* the medallion: amber and gold petals round the centre */
  for (let i = 0; i < seg; i++) {
    g.fillStyle = i % 2 ? '#e0b25e' : '#f2cf84'; g.fillRect(i * sw, 0, sw, 40);
    g.fillStyle = i % 4 < 2 ? '#c98f3e' : '#e8c070'; g.fillRect(i * sw, 40, sw, 28);
  }
  /* a ring of leaves */
  g.fillStyle = '#dfe3c2'; g.fillRect(0, 68, W, 40);
  for (let i = 0; i < seg * 2; i++) { g.fillStyle = i % 2 ? '#7f9a62' : '#94ad74'; g.beginPath(); g.ellipse((i + 0.5) * sw / 2, 88, sw * 0.22, 15, 0.5, 0, PI * 2); g.fill(); }
  /* the field: cream panes, a pale green lozenge in every other pane */
  const rows = [108, 160, 212, 264, 316, 368];
  for (let r = 0; r < rows.length - 1; r++) for (let i = 0; i < seg; i++) {
    const x = i * sw, y = rows[r], h = rows[r + 1] - rows[r];
    const t = 0.9 + rnd() * 0.1;
    g.fillStyle = `rgb(${Math.round(242 * t)},${Math.round(230 * t)},${Math.round(196 * t)})`; g.fillRect(x, y, sw, h);
    if ((i + r) % 2 === 0) { g.fillStyle = r % 2 ? '#aebf94' : '#c9b877'; g.beginPath(); g.moveTo(x + sw / 2, y + 6); g.lineTo(x + sw - 6, y + h / 2); g.lineTo(x + sw / 2, y + h - 6); g.lineTo(x + 6, y + h / 2); g.closePath(); g.fill(); }
  }
  /* the garland band and the border */
  g.fillStyle = '#6f8a5c'; g.fillRect(0, 368, W, 44);
  for (let i = 0; i < seg * 2; i++) { g.fillStyle = i % 3 ? '#b8c78e' : '#e7b77a'; g.beginPath(); g.arc((i + 0.5) * sw / 2, 390, 9, 0, PI * 2); g.fill(); }
  g.fillStyle = '#e8d49a'; g.fillRect(0, 412, W, 40);
  for (let i = 0; i < seg; i++) { g.fillStyle = '#c69a4c'; g.fillRect(i * sw + sw * 0.35, 418, sw * 0.3, 28); }
  g.fillStyle = '#5f7d6c'; g.fillRect(0, 452, W, 60);
  /* the leading */
  g.strokeStyle = lead; g.lineWidth = 3;
  for (const y of [40, 68, 108, 160, 212, 264, 316, 368, 412, 452]) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.lineWidth = 2;
  for (let i = 0; i <= seg; i++) { g.beginPath(); g.moveTo(i * sw, i % 2 ? 108 : 0); g.lineTo(i * sw, 452); g.stroke(); }
  return canvasTex(c);
}

/* A kentia palm in a pot: three slender stems, each crowned with arching fronds whose leaflets are
   written straight into one geometry, so a palm is two draw calls however many leaves it has. */
function kentia(k: K, x: number, y0: number, z: number, h: number, seed: number, leafM: T.Material, stemM: T.Material) {
  const rnd = X.mulberry(seed), pos: number[] = [];
  const quad = (a: T.Vector3, b: T.Vector3, c: T.Vector3, d: T.Vector3) => pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, a.x, a.y, a.z, c.x, c.y, c.z, d.x, d.y, d.z);
  for (let s = 0; s < 3; s++) {
    const a = (s / 3) * PI * 2 + rnd() * 0.8, lean = 0.3 + rnd() * 0.45, hh = h * (0.62 + rnd() * 0.38);
    const top = v(x + Math.cos(a) * lean, y0 + hh, z + Math.sin(a) * lean);
    k.beam(v(x + Math.cos(a) * 0.1, y0, z + Math.sin(a) * 0.1), top, 0.05, stemM, 6);
    const nf = 8;
    for (let f = 0; f < nf; f++) {
      const t = (f / nf) * PI * 2 + rnd() * 0.6, len = 1.5 + rnd() * 0.8, rise = 0.35 + rnd() * 0.5, droop = 0.7 + rnd() * 0.9;
      const cv = new T.QuadraticBezierCurve3(top, v(top.x + Math.cos(t) * len * 0.5, top.y + rise, top.z + Math.sin(t) * len * 0.5), v(top.x + Math.cos(t) * len, top.y + rise - droop, top.z + Math.sin(t) * len));
      k.mesh(new T.TubeGeometry(cv, 6, 0.018, 4), stemM);
      for (let j = 1; j <= 13; j++) {
        const u = j / 14, p = cv.getPoint(u), tan = cv.getTangent(u), side = v(-tan.z, 0, tan.x).normalize();
        for (const sd of [-1, 1]) {
          const dir = side.clone().multiplyScalar(sd).add(v(0, -0.8, 0)).addScaledVector(tan, 0.5).normalize();
          const L = 0.62 * (1 - 0.55 * u) + 0.12, w = 0.04;
          const tip = p.clone().addScaledVector(dir, L);
          quad(p.clone().addScaledVector(tan, -w), p.clone().addScaledVector(tan, w), tip.clone().addScaledVector(tan, w * 0.25), tip.clone().addScaledVector(tan, -w * 0.25));
        }
      }
    }
  }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
  k.mesh(g, leafM);
}

/* A caryatid in relief: a robed figure on a plinth, arms raised to the basket she carries. */
function caryatid(k: K, x: number, z: number, stone: T.Material, gilt: T.Material) {
  k.box(1.0, 1.1, 0.8, x, 0.55, z, stone);
  k.box(1.1, 0.12, 0.9, x, 1.12, z, gilt);
  k.lathe([[0, 1.18], [0.4, 1.18], [0.36, 1.6], [0.3, 2.5], [0.23, 3.2], [0.2, 3.45], [0.26, 3.75], [0.24, 4.02], [0.1, 4.14], [0.09, 4.26], [0.16, 4.38], [0.17, 4.58], [0.12, 4.72], [0, 4.78]], x, 0, z, stone, 18);
  for (const s of [-1, 1]) { k.beam(v(x + s * 0.24, 3.95, z), v(x + s * 0.32, 4.72, z + 0.05), 0.07, stone, 6); k.beam(v(x + s * 0.32, 4.72, z + 0.05), v(x + s * 0.22, 5.05, z), 0.06, stone, 6); }
  k.lathe([[0.12, 4.78], [0.36, 4.92], [0.42, 5.2], [0.46, 5.24], [0, 5.24]], x, 0, z, gilt, 16);
  k.box(1.1, 0.24, 0.9, x, 5.36, z, stone);
}

/* ---------------- 153 THE PALM COURT ---------------- */
export const palmcourt: RoomDef = {
  id: 'palmcourt',
  name: 'An afternoon at the Plaza',
  area: 'THE PLAZA / THE PALM COURT',
  mood: 'Tea under the glass',
  color: '#c8b98a',
  daylit: true,
  description: 'The Palm Court in the middle of the Plaza, where afternoon tea has been poured under a ceiling of stained glass since 1907. The palms stand in their planters along the trellis, the waiters work the aisle between the white cloths, the piano plays, and through the Fifth Avenue doors the Pulitzer Fountain splashes in Grand Army Plaza. The New Yorkers hang in the gilded bays between the pilasters, under the mirrors, where the room has always hung its finery.',
  signatures: 'The stained glass laylight with its amber medallion and green garlands, tall palms in planters, cream trellis panels and arched mirrors, the four caryatids on the west wall, Caen stone pilasters over purple Breche Violette marble, the mosaic floor, tea tables with white cloths and cane chairs, waiters in black, a grand piano, and the Pulitzer Fountain and Fifth Avenue through the doors.',
  build(k, ctx) {
    k.sky({ top: 0x5a8fd2, horizon: 0xd8e2ec, ground: 0x7a746c, fog: 0.0035, sun: { az: 3.9, el: 0.8, color: 0xfff2dc, size: 8 }, env: 0.6 });
    k.hemi(0xfff1dc, 0x8a8478, 1.15);
    k.sun(0xfff0d8, 2.0, -30, 70, 60, true, 70);
    const rnd = X.mulberry(1530);
    const W = 10, Z0 = -14, Z1 = 14, ZL = 17.6, H = 8.4;
    const plaster = k.pbr('pc-plaster', X.plaster(0xe9dfc9, 153), 0.4);
    const caen = k.pbr('pc-caen', X.marble(0xe8dcc0, 0xbfae8c, 153), 0.35, { roughness: 0.45 });
    const breche = k.pbr('pc-breche', X.marble(0x7c5a68, 0x3c2632, 154), 0.6, { roughness: 0.3 });
    const floorM = k.pbr('pc-floor', X.marble(0xd8cdb6, 0x8f846f, 155), 0.22, { roughness: 0.42 });
    const mosaic = k.pbr('pc-mosaic', X.minton(), 0.8, { roughness: 0.4 });
    const gilt = k.flat(0xc9a55a, 0.85, 0.35);
    const mirror = k.flat(0xd8d3c6, 1, 0.08);
    const sage = k.flat(0x93a386, 0, 0.85);
    const trellis = k.flat(0xf1ead6, 0, 0.6);
    const linen = k.flat(0xe9e5da, 0, 0.9);
    const cane = k.flat(0xc59c62, 0, 0.8, { side: T.DoubleSide });
    const silver = k.flat(0xd6d6d2, 1, 0.22);
    const lacquer = k.flat(0x0b0b0c, 0.3, 0.18);
    const pot = k.flat(0xb89a5c, 0.7, 0.4);
    const glass = k.glass(0xcfe3ea, 0.16, 0.05);
    const mounts: Mount[] = [];

    /* ---- floor: marble field with a mosaic border, and the lobby strip ---- */
    k.box(2 * W - 2.4, 0.2, Z1 - Z0 - 2.4, 0, -0.1, 0, floorM);
    for (const s of [-1, 1]) { k.box(1.2, 0.2, Z1 - Z0, s * (W - 0.6), -0.1, 0, mosaic); k.box(2 * W - 2.4, 0.2, 1.2, 0, -0.1, s * (Z1 - 0.6), mosaic); }
    k.box(2 * W, 0.2, ZL - Z1, 0, -0.1, (Z1 + ZL) / 2, floorM);

    /* ---- walls ---- */
    for (const s of [-1, 1]) k.box(0.4, H, ZL - Z0 + 0.4, s * (W + 0.2), H / 2, (Z0 + ZL) / 2, plaster);
    k.box(2 * W + 0.8, H, 0.4, 0, H / 2, Z0 - 0.2, plaster);
    /* the east wall to the lobby: one wide arch */
    k.arch(7, 5.2, 0.5, 0, 0, Z1 + 0.25, plaster, false, (2 * W) / 14);
    k.box(2 * W, H - 5.2 * 1.13, 0.5, 0, 5.2 * 1.13 + (H - 5.2 * 1.13) / 2, Z1 + 0.25, plaster);
    k.arch(7.1, 5.25, 0.62, 0, 0, Z1 + 0.25, gilt, false, 0.53);
    /* the lobby: a lower ceiling and the glass doors onto Fifth Avenue */
    k.box(2 * W, 0.3, ZL - Z1, 0, 6.15, (Z1 + ZL) / 2, plaster);
    k.box(2 * W, 0.6, 0.3, 0, 5.7, ZL, caen);
    k.box(2 * W, 5.4, 0.04, 0, 2.7, ZL, glass);
    for (let x = -W; x <= W + 0.01; x += 2.5) k.box(0.16, 5.4, 0.22, x, 2.7, ZL, lacquer);
    k.box(2 * W, 0.12, 0.22, 0, 4.3, ZL, lacquer);
    k.box(2 * W, 0.2, 0.3, 0, 0.1, ZL, lacquer);

    /* ---- the side walls: dado, pilasters, four gilded bays each, mirrors with trellis over them ---- */
    const bays = [-10.5, -6, -1.5, 3], pil = [-12.75, -8.25, -3.75, 0.75, 5.25];
    for (const s of [-1, 1]) {
      const wx = s * W, rot = s < 0 ? PI / 2 : -PI / 2;
      k.box(0.14, 1.0, Z1 - Z0, wx - s * 0.07, 0.5, 0, breche);
      k.box(0.2, 0.08, Z1 - Z0, wx - s * 0.1, 1.04, 0, gilt);
      k.box(0.3, 0.5, Z1 - Z0, wx - s * 0.15, 7.15, 0, caen);
      k.box(0.5, 0.18, Z1 - Z0, wx - s * 0.25, 7.45, 0, gilt);
      k.box(0.7, 0.3, Z1 - Z0, wx - s * 0.35, 7.7, 0, plaster);
      for (const z of pil) {
        k.box(0.3, 1.0, 1.0, wx - s * 0.15, 0.5, z, breche);
        k.box(0.26, 5.9, 0.8, wx - s * 0.13, 3.95, z, caen);
        k.box(0.34, 0.4, 1.0, wx - s * 0.17, 6.95, z, gilt);
        /* a sconce on every pilaster */
        k.beam(v(wx - s * 0.26, 4.3, z), v(wx - s * 0.6, 4.55, z), 0.025, gilt, 6);
        k.sphere(0.07, wx - s * 0.62, 4.6, z, k.glow(0x9a7448), 10);
      }
      for (const z of bays) {
        /* the gilt surround of the work */
        k.box(0.06, 0.1, 3.9, wx - s * 0.03, 4.2, z, gilt); k.box(0.06, 0.1, 3.9, wx - s * 0.03, 1.55, z, gilt);
        mounts.push({ position: v(wx - s * 0.08, 2.9, z), rotation: rot, target: v(s * 6.6, 3, z), width: 3.3, height: 2.3, style: 'gilt', wash: true });
        /* the arched mirror above, under its trellis */
        const mg = new T.Shape(); mg.moveTo(-1.55, 0); mg.lineTo(1.55, 0); mg.lineTo(1.55, 1.3); mg.absellipse(0, 1.3, 1.55, 0.9, 0, PI, false); mg.lineTo(-1.55, 0);
        const mm = k.mesh(new T.ShapeGeometry(mg, 24), mirror, wx - s * 0.03, 4.55, z); mm.rotation.y = rot;
        const fr = k.mesh(new T.TubeGeometry(new T.CatmullRomCurve3([v(-1.6, 0, 0), v(-1.6, 1.3, 0), ...Array.from({ length: 13 }, (_, i) => v(-Math.cos((i / 12) * PI) * 1.6, 1.3 + Math.sin((i / 12) * PI) * 0.95, 0)), v(1.6, 1.3, 0), v(1.6, 0, 0)]), 40, 0.06, 6), gilt, wx - s * 0.05, 4.55, z); fr.rotation.y = rot;
        lattice(k, 3.1, 1.3, 0.42, trellis, (u, vv) => v(wx - s * 0.07, 5.2 + vv, z + u), 0.035);
      }
      /* the east end of each side: a tall trellis panel on sage */
      k.box(0.06, 5.6, 8.2, wx - s * 0.03, 3.9, 9.6, sage);
      lattice(k, 8.2, 5.6, 0.55, trellis, (u, vv) => v(wx - s * 0.08, 3.9 + vv, 9.6 + u), 0.045);
      k.box(0.12, 0.12, 8.4, wx - s * 0.08, 6.75, 9.6, gilt); k.box(0.12, 0.12, 8.4, wx - s * 0.08, 1.05, 9.6, gilt);
      /* the lobby's end wall carries two works */
      mounts.push({ position: v(wx - s * 0.08, 2.8, (Z1 + ZL) / 2 + 0.1), rotation: rot, target: v(s * 6.6, 3, (Z1 + ZL) / 2 + 0.1), width: 2.4, height: 1.7, style: 'gilt', wash: true });
    }

    /* ---- the west wall: the four caryatids, two mirrors, the hero bay, the census frieze ---- */
    const FZ = Z0 + 0.4;
    k.box(2 * W, 1.0, 0.14, 0, 0.5, Z0 + 0.07, breche);
    for (const x of [-5.9, -2.9, 2.9, 5.9]) caryatid(k, x, FZ, caen, gilt);
    k.box(2 * W, 0.3, 0.5, 0, 5.62, Z0 + 0.25, caen);
    k.box(2 * W, 0.12, 0.56, 0, 5.8, Z0 + 0.28, gilt);
    k.box(2 * W, 0.5, 0.3, 0, 7.15, Z0 + 0.15, caen);
    k.box(2 * W, 0.18, 0.5, 0, 7.45, Z0 + 0.25, gilt);
    for (const s of [-1, 1]) {
      const mg = new T.Shape(); mg.moveTo(-1.0, 0); mg.lineTo(1.0, 0); mg.lineTo(1.0, 3.2); mg.absellipse(0, 3.2, 1.0, 0.7, 0, PI, false); mg.lineTo(-1.0, 0);
      k.mesh(new T.ShapeGeometry(mg, 20), mirror, s * 4.4, 1.15, Z0 + 0.03);
      k.box(2.2, 0.12, 0.1, s * 4.4, 1.12, Z0 + 0.06, gilt);
      mounts.push({ position: v(s * 8.1, 3.0, Z0 + 0.08), rotation: 0, target: v(s * 8.1, 3, Z0 + 3.5), width: 2.4, height: 1.8, style: 'gilt', wash: true });
    }
    mounts.push({ position: v(0, 3.05, Z0 + 0.08), rotation: 0, target: v(0, 3, Z0 + 4.2), width: 4.2, height: 3.0, style: 'gilt', wash: true });
    k.censusWall({ x: 0, y: 6.45, z: Z0 + 0.34, rotY: 0, cols: 22, rows: 2, tile: 0.44, gap: 0.04, start: ctx.wallStart(5300, 44), pieces: ctx.all, backing: k.flat(0x2a2620, 0.4, 0.6) });
    /* the east wall, either side of the arch */
    for (const s of [-1, 1]) mounts.push({ position: v(s * 7.2, 3.0, Z1 - 0.02), rotation: PI, target: v(s * 7.2, 3, Z1 - 3.5), width: 3.0, height: 2.1, style: 'gilt', wash: true });

    /* ---- the ceiling and the laylight ---- */
    const LZ = -0.5, LA = 6.6, LB = 11.2;
    {
      const sh = new T.Shape(); sh.moveTo(-W, Z0); sh.lineTo(W, Z0); sh.lineTo(W, Z1); sh.lineTo(-W, Z1); sh.closePath();
      const hole = new T.Path(); hole.absellipse(0, LZ, LA, LB, 0, PI * 2, true); sh.holes.push(hole);
      const cg = new T.ShapeGeometry(sh, 64); cg.rotateX(PI / 2);
      k.mesh(cg, plaster, 0, H, 0);
      const ring = (a: number, b: number, y: number, r: number) => k.curve(Array.from({ length: 64 }, (_, i) => { const t = (i / 64) * PI * 2; return v(Math.cos(t) * a, y, LZ + Math.sin(t) * b); }), r, gilt, 128, true);
      ring(LA, LB, H - 0.05, 0.12); ring(LA + 0.7, LB + 0.7, H - 0.04, 0.06);
      for (let i = 0; i < 28; i++) { const t = (i / 28) * PI * 2; k.bar(v(Math.cos(t) * (LA + 0.1), H - 0.06, LZ + Math.sin(t) * (LB + 0.1)), v(Math.cos(t) * (LA + 0.65), H - 0.06, LZ + Math.sin(t) * (LB + 0.65)), 0.1, 0.08, gilt); }
      const lay = new T.MeshBasicMaterial({ map: laylightTexture(), color: 0xd9cfb8, side: T.DoubleSide });
      const dome = k.mesh(new T.SphereGeometry(1, 64, 14, 0, PI * 2, 0, PI / 2), lay, 0, H, LZ); dome.scale.set(LA, 1.5, LB);
      /* the iron ribs that carry the glass */
      for (let j = 0; j < 16; j++) {
        const a = (j / 16) * PI * 2;
        k.curve(Array.from({ length: 9 }, (_, i) => { const b = (i / 8) * (PI / 2); return v(LA * Math.cos(a) * Math.sin(b) * 0.995, H + 1.5 * Math.cos(b) * 0.99, LZ + LB * Math.sin(a) * Math.sin(b) * 0.995); }), 0.05, k.flat(0x3e3526, 0.6, 0.5), 16);
      }
    }

    /* ---- the palms in their planters ---- */
    const frond = k.flat(0x3f6a3a, 0, 0.75, { side: T.DoubleSide }), stalk = k.flat(0x5a6a3a, 0, 0.8);
    const palm = (x: number, z: number, h = 5.4) => {
      k.lathe([[0, 0], [0.62, 0], [0.72, 0.12], [0.6, 0.35], [0.78, 0.9], [0.86, 1.0], [0, 1.0]], x, 0, z, pot, 20);
      k.cyl(0.7, 0.04, x, 0.99, z, k.flat(0x3a2c20, 0, 1));
      kentia(k, x, 0.95, z, h, Math.round(x * 7 + z * 3 + 500), frond, stalk);
      k.keepOut.push({ x, z, r: 1.0 });
    };
    for (const s of [-1, 1]) { for (const z of [-8.25, 0.75, 5.25]) palm(s * 8.7, z, 5.2 + rnd() * 0.8); palm(s * 8.6, -12.6, 5.8); palm(s * 8.6, 13.0, 5.6); }

    /* ---- the tea tables: white cloths, cane chairs, silver, and the people taking tea ---- */
    const tables: [number, number][] = [];
    for (const s of [-1, 1]) for (const z of [-10.5, -6, -1.5, 3, 7.5]) tables.push([s * 3.95, z]);
    tables.push([-4.2, 11.3]);
    const seats: number[] = [];
    for (const [tx, tz] of tables) {
      k.cyl(0.62, 0.05, tx, 0.76, tz, linen, 0.62, 28);
      k.cyl(0.62, 0.72, tx, 0.39, tz, linen, 0.7, 28);
      k.lathe([[0, 0], [0.09, 0], [0.11, 0.14], [0.08, 0.26], [0.02, 0.3], [0, 0.3]], tx + 0.12, 0.78, tz - 0.08, silver, 12);
      k.cyl(0.012, 0.42, tx - 0.15, 0.99, tz + 0.1, gilt, 0.012, 6);
      for (const [y, r] of [[0.84, 0.15], [0.98, 0.12], [1.12, 0.09]]) k.cyl(r, 0.012, tx - 0.15, y, tz + 0.1, k.flat(0xf4f1ea, 0, 0.5), r, 16);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * PI * 2 + (tx > 0 ? 0.5 : -0.5) + tz * 0.3, cx = tx + Math.cos(a) * 0.95, cz = tz + Math.sin(a) * 0.95;
        k.cyl(0.25, 0.08, cx, 0.46, cz, cane, 0.25, 14);
        const back = k.mesh(new T.CylinderGeometry(0.27, 0.27, 0.5, 14, 1, true, 0, PI), cane, cx, 0.78, cz);
        back.rotation.y = Math.atan2(tx - cx, tz - cz) + PI / 2;
        for (const d of [[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]]) k.cyl(0.018, 0.44, cx + d[0], 0.22, cz + d[1], cane, 0.018, 5);
        if (rnd() < 0.72) seats.push(cx, cz, Math.atan2(tx - cx, tz - cz));
      }
      k.keepOut.push({ x: tx, z: tz, r: 1.35 });
    }
    const NS = seats.length / 3;
    const guests = k.instances(figureGeo(0.19, 0.42, 0.98), new T.MeshStandardMaterial({ roughness: 0.85 }), Array.from({ length: NS }, () => new T.Matrix4()));
    guests.frustumCulled = false;
    {
      const c = new T.Color(), pal = [0x1d2230, 0xe6ddd0, 0x7a2e3a, 0x2c4a6a, 0xd9b8a8, 0x3a5a48, 0xefe8dc, 0x8a6a9a, 0x5a4636, 0xc4a260];
      for (let i = 0; i < NS; i++) guests.setColorAt(i, c.set(pal[Math.floor(rnd() * pal.length)]));
      if (guests.instanceColor) guests.instanceColor.needsUpdate = true;
      const m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), p = new T.Vector3(), sc = new T.Vector3(1, 1, 1);
      const ph = Array.from({ length: NS }, () => rnd() * 6.3);
      const place = (t: number) => {
        for (let i = 0; i < NS; i++) {
          const lean = 0.06 + 0.07 * Math.max(0, Math.sin(t * 0.5 + ph[i]));
          e.set(0, seats[i * 3 + 2], 0); q.setFromEuler(e);
          const fwd = lean * 0.5;
          p.set(seats[i * 3] + Math.sin(seats[i * 3 + 2]) * fwd, 0.44, seats[i * 3 + 1] + Math.cos(seats[i * 3 + 2]) * fwd);
          m.compose(p, q, sc); guests.setMatrixAt(i, m);
        }
        guests.instanceMatrix.needsUpdate = true;
      };
      place(0);
      if (!ctx.reduced) k.ticks.push(place);
    }
    /* the waiters working the aisle */
    if (!ctx.reduced) k.crowd([v(-1.9, 0, 11.5), v(-1.9, 0, -11.8), v(1.9, 0, -11.8), v(1.9, 0, 11.5)], 7, { seed: 153, speed: 0.75, spread: 0.5, closed: true, colors: [0x121214, 0x18181b, 0xe9e5dc] });
    else for (const [x, z] of [[-1.9, 2], [1.9, -6]]) figure(k, x, 0, z, 0x121214);
    /* the maitre d' at the podium by the arch */
    k.box(0.6, 1.1, 0.45, 3.4, 0.55, 12.6, k.flat(0x3a2418, 0.1, 0.4)); k.keepOut.push({ x: 3.6, z: 12.9, r: 0.8 });
    figure(k, 3.6, 0, 13.2, 0x121214, { rotY: PI });

    /* ---- the grand piano and the pianist ---- */
    {
      const PX = -7.3, PZ = 8.2;
      const ps = new T.Shape(); ps.moveTo(-0.75, 0); ps.lineTo(0.75, 0); ps.lineTo(0.75, 1.0); ps.bezierCurveTo(0.75, 1.9, 0.1, 1.6, 0.05, 2.3); ps.lineTo(-0.75, 2.3); ps.closePath();
      const pg = new T.ExtrudeGeometry(ps, { depth: 0.32, bevelEnabled: false, curveSegments: 16 }); pg.rotateX(PI / 2);
      const body = k.mesh(pg, lacquer, PX, 1.0, PZ); body.rotation.y = PI * 0.8;
      const lg = new T.ShapeGeometry(ps, 16); lg.rotateX(PI / 2); lg.translate(0.75, 0, 0); lg.rotateZ(0.55); lg.translate(-0.75, 0, 0); lg.rotateY(PI * 0.8);
      k.mesh(lg, k.flat(0x0b0b0c, 0.3, 0.18, { side: T.DoubleSide }), PX, 1.02, PZ);
      for (const [dx, dz] of [[-0.6, 0.1], [0.6, 0.1], [0, 1.9]]) { const l = new T.Vector3(dx, 0, dz).applyAxisAngle(new T.Vector3(0, 1, 0), PI * 0.8); k.cyl(0.07, 0.7, PX + l.x, 0.35, PZ + l.z, lacquer, 0.05, 8); }
      const kb = new T.Vector3(0, 0, -0.18).applyAxisAngle(new T.Vector3(0, 1, 0), PI * 0.8);
      const keys = k.box(1.5, 0.05, 0.2, PX + kb.x, 0.72, PZ + kb.z, k.flat(0xf2eee4, 0, 0.4)); keys.rotation.y = PI * 0.8;
      const bench = new T.Vector3(0, 0, -0.75).applyAxisAngle(new T.Vector3(0, 1, 0), PI * 0.8);
      k.box(0.9, 0.48, 0.38, PX + bench.x, 0.24, PZ + bench.z, lacquer).rotation.y = PI * 0.8;
      const pianist = new T.Group(); pianist.position.set(PX + bench.x, 0.48, PZ + bench.z); pianist.rotation.y = PI * 0.8 + PI;
      const pb = new T.Mesh(new T.CapsuleGeometry(0.2, 0.46, 3, 8), k.flat(0x111114, 0, 0.8)); pb.position.y = 0.43; pianist.add(pb);
      const ph = new T.Mesh(new T.SphereGeometry(0.125, 10, 8), k.flat(0x8d5a3b, 0, 0.7)); ph.position.y = 0.96; pianist.add(ph);
      k.add(pianist);
      if (!ctx.reduced) k.ticks.push((t) => { pianist.rotation.z = 0.06 * Math.sin(t * 1.9); pianist.rotation.x = 0.05 * Math.sin(t * 0.95 + 1); });
      k.keepOut.push({ x: PX, z: PZ + 0.6, r: 1.6 });
    }
    /* the tea station: a sideboard of silver urns and a pastry trolley */
    k.box(0.9, 1.0, 4.2, 8.9, 0.5, 9.8, k.flat(0x4a2e1e, 0.1, 0.45));
    k.box(1.0, 0.06, 4.3, 8.9, 1.03, 9.8, breche);
    for (const z of [8.3, 9.3, 10.3, 11.3]) k.lathe([[0, 0], [0.16, 0], [0.2, 0.22], [0.15, 0.42], [0.05, 0.5], [0.06, 0.56], [0, 0.58]], 8.9, 1.06, z, silver, 14);
    k.keepOut.push({ x: 8.9, z: 9.8, r: 1.2 }); k.keepOut.push({ x: 8.9, z: 11.2, r: 1.0 }); k.keepOut.push({ x: 8.9, z: 8.4, r: 1.0 });

    /* lights: warm pools under the glass, the hero lit */
    k.point(0, 6.6, -8, 0xffe2b0, 26, 16); k.point(0, 6.6, 1, 0xffe2b0, 26, 16); k.point(0, 6.2, 10, 0xffdcaa, 20, 14);
    k.spot(0, 7.6, -6.5, 0, 3, Z0, 0xfff0d6, 90, 0.42, 0.6, 16);

    /* ---- outside: Grand Army Plaza, the Pulitzer Fountain, Fifth Avenue, the GM Building ---- */
    {
      const paver = k.pbr('pc-pavers', X.pavers(0x9a948a, 153), 0.5);
      const granite = k.pbr('pc-granite', X.concrete(0xb3aca0, 153), 0.4);
      const asphalt = k.pbr('pc-asphalt', X.asphalt(0x2a2d31), 0.25);
      const bronze = k.flat(0x5a6a58, 0.7, 0.45);
      k.box(160, 0.2, 34, 0, -0.1, ZL + 17, paver);
      k.box(160, 0.2, 12, 0, -0.12, 57, asphalt);
      for (let x = -78; x < 80; x += 6) k.box(3, 0.02, 0.15, x, 0.01, 57, k.flat(0xe8e2c8));
      k.box(160, 0.2, 40, 0, -0.1, 83, paver);
      /* the fountain: a wide granite pool and the stacked basins, the figure of Abundance on top */
      const FX = 0, FZc = 34;
      k.lathe([[0, 0], [7.2, 0], [7.2, 0.7], [6.8, 0.7], [6.8, 0.35], [0, 0.35]], FX, 0, FZc, granite, 48);
      const pool = k.mesh(new T.CircleGeometry(6.8, 48).rotateX(-PI / 2), new T.MeshStandardMaterial({ color: 0x3c5a66, metalness: 0.05, roughness: 0.15, envMapIntensity: 0.25 }), FX, 0.5, FZc);
      void pool;
      k.lathe([[0, 0], [0.9, 0], [0.7, 1.2], [3.2, 1.6], [3.3, 1.9], [0.5, 1.9], [0.45, 2.9], [1.9, 3.2], [2.0, 3.45], [0.35, 3.45], [0.3, 4.3], [0.6, 4.4], [0, 4.4]], FX, 0.35, FZc, granite, 40);
      k.lathe([[0, 0], [0.35, 0], [0.28, 0.9], [0.22, 1.6], [0.26, 2.0], [0.14, 2.3], [0.16, 2.55], [0, 2.62]], FX, 4.75, FZc, bronze, 14);
      k.beam(v(FX + 0.15, 6.5, FZc), v(FX + 0.35, 7.4, FZc - 0.1), 0.06, bronze, 6);
      k.sphere(0.28, FX + 0.38, 7.5, FZc - 0.1, bronze, 10);
      /* water sheeting off the two basins and a jet in the pool */
      const drops = 220, dg = new T.SphereGeometry(0.06, 5, 4);
      const dm = new T.MeshBasicMaterial({ color: 0xdcecf2, transparent: true, opacity: 0.55, depthWrite: false });
      const water = k.instances(dg, dm, Array.from({ length: drops }, () => new T.Matrix4()));
      water.frustumCulled = false; water.castShadow = false;
      const dd = Array.from({ length: drops }, (_, i) => ({ a: rnd() * PI * 2, o: rnd(), top: i % 2 === 0 }));
      const m = new T.Matrix4(), p = new T.Vector3(), q = new T.Quaternion(), s1 = new T.Vector3(1, 2.2, 1);
      const place = (t: number) => {
        dd.forEach((d, i) => {
          const u = (t * 0.9 + d.o) % 1;
          const r0 = d.top ? 2.0 : 3.3, y0 = d.top ? 3.8 : 2.2, y1 = d.top ? 2.3 : 0.5, r1 = d.top ? 2.4 : 3.8;
          p.set(FX + Math.cos(d.a) * (r0 + (r1 - r0) * u), y0 - (y0 - y1) * u * u, FZc + Math.sin(d.a) * (r0 + (r1 - r0) * u));
          m.compose(p, q, s1); water.setMatrixAt(i, m);
        });
        water.instanceMatrix.needsUpdate = true;
      };
      place(0.3);
      if (!ctx.reduced) k.ticks.push(place);
      k.egg(v(FX, 3, FZc), { id: 'pulitzer-fountain', title: 'Facing the fountain', text: 'The hotel\'s main entrance faces the Pulitzer Fountain in the southern part of Grand Army Plaza. The Plaza\'s exterior was made a New York City landmark on December 9, 1969, its interior on July 12, 2005, and the building a National Historic Landmark on June 24, 1986.', clue: 'Look out through the Fifth Avenue doors at the water.', source: { name: 'The Plaza Hotel, Wikipedia', url: 'https://en.wikipedia.org/wiki/The_Plaza_Hotel' } }, { r: 5 });
      /* the plaza's trees */
      for (const [x, z] of [[-14, 26], [-22, 30], [-30, 25], [14, 26], [22, 30], [30, 25], [-18, 42], [18, 42], [-38, 40], [38, 40]]) k.tree(x, 0, z, { h: 5 + rnd() * 2, r: 2.4 + rnd(), seed: x * 3 + z, leaf: 0x557a44 });
      for (const x of [-9, 9]) { k.cyl(0.08, 4.2, x, 2.1, 46, lacquer, 0.06, 8); k.sphere(0.3, x, 4.4, 46, k.glow(0xfff0c8), 10); }
      /* across Fifth: a white tower in vertical stripes, and the glass cube in its plaza */
      const gm = k.pbr('pc-gm', X.windows(1531, 0.15, 0xd8d6d0, false), 0.08, { emissive: 0xffffff, emissiveIntensity: 0.25, roughness: 0.5, stretch: 0.3 });
      k.box(40, 210, 26, 10, 105, 100, gm);
      k.box(10, 10, 10, 0, 5, 72, glass);
      k.box(10.2, 0.2, 10.2, 0, 10, 72, k.flat(0xcfd6da, 0.9, 0.2));
      k.skyline({ z: 150, count: 18, spacing: 12, scale: 3.2, base: -2, seed: 153, lit: 0.2, tint: 0x8a8a86, glow: 0.4, x: 0 });
      for (const [x, w, h] of [[-50, 26, 70], [-24, 18, 45], [40, 24, 60], [62, 20, 90]]) k.box(w, h, 20, x, h / 2, 96, k.pbr('pc-mid' + x, X.windows(1532 + x, 0.2, 0x9a9488, true), 0.12, { emissive: 0xffffff, emissiveIntensity: 0.4, roughness: 0.6, stretch: 0.4 }));
      /* Fifth Avenue traffic, all heading downtown */
      const NC = 14, carG = mergeGeometries([new T.BoxGeometry(4.6, 0.8, 1.9).translate(0, 0.6, 0), new T.BoxGeometry(2.6, 0.6, 1.7).translate(-0.2, 1.3, 0)])!;
      const cars = k.instances(carG, new T.MeshStandardMaterial({ roughness: 0.4, metalness: 0.3 }), Array.from({ length: NC }, () => new T.Matrix4()));
      cars.frustumCulled = false;
      const cc = new T.Color(), cst = Array.from({ length: NC }, (_, i) => { cars.setColorAt(i, cc.set(i % 3 === 0 ? 0x1b1d22 : i % 5 === 0 ? 0xd8d8d8 : 0xf2b705)); return { lane: 53 + (i % 4) * 2.6, o: rnd() * 160, sp: 7 + rnd() * 4 }; });
      if (cars.instanceColor) cars.instanceColor.needsUpdate = true;
      const cm = new T.Matrix4(), cp = new T.Vector3(), cq = new T.Quaternion(), one = new T.Vector3(1, 1, 1);
      const drive = (t: number) => { cst.forEach((c, i) => { const x = 80 - ((((c.o + t * c.sp) % 160) + 160) % 160); cp.set(x, 0, c.lane); cm.compose(cp, cq, one); cars.setMatrixAt(i, cm); }); cars.instanceMatrix.needsUpdate = true; };
      drive(0);
      if (!ctx.reduced) k.ticks.push(drive);
      /* people crossing the plaza */
      if (!ctx.reduced) k.crowd([v(-40, 0, 22), v(-10, 0, 21), v(10, 0, 21), v(40, 0, 22)], 18, { seed: 1533, speed: 1.2, spread: 3 });
    }

    /* ---- eggs ---- */
    const wiki = { name: 'The Plaza Hotel, Wikipedia', url: 'https://en.wikipedia.org/wiki/The_Plaza_Hotel' };
    const plaza = { name: 'The Palm Court, The Plaza', url: 'https://www.theplazany.com/dining/the-palm-court/' };
    k.egg(v(0, H + 0.8, LZ), { id: 'palm-court-glass', title: 'The glass that came back', text: 'The Palm Court\'s stained glass ceiling was removed in a renovation in the 1940s and restored in the mid 2000s. The room was renovated again by the architect Thierry Despont, with a stained glass dome reminiscent of the original of 1907, ceiling high palms, trellis detailing and furniture with cane accents.', clue: 'Look straight up from the middle of the room.', source: wiki }, { r: 4 });
    k.egg(v(-2.9, 3.4, FZ + 0.4), { id: 'four-seasons', title: 'Four seasons', text: 'Four caryatids frame the wall mirrors of the Palm Court and represent the seasons. The walls are Caen stone and Breche Violette marble, over mosaic floors.', clue: 'Count the women holding up the west wall.', source: wiki }, { r: 2 });
    k.egg(v(-3.95, 1.1, -1.5), { id: 'afternoon-tea', title: 'Tea for Manhattan', text: 'The Plaza calls the Palm Court Manhattan\'s iconic destination for afternoon tea, served from a collection of 25 teas by Palais des Thes with sandwiches and pastries. A relaunch in 2013 added a grand bar. The room has been a setting for scenes in F. Scott Fitzgerald\'s The Great Gatsby.', clue: 'Sit down at a white cloth and look at the tiers.', source: plaza }, { r: 1.4 });
    k.egg(v(0, 5.4, Z1 + 0.3), { id: 'plaza-1907', title: 'October 1907', year: '1907', text: 'The Plaza opened on October 1, 1907, with 800 rooms, designed by Henry Janeway Hardenbergh; Warren and Wetmore added to it from 1919 to 1922. It is 18 stories and about 252 feet tall. Since the renovation of 2008 it has held 282 hotel rooms and 181 condominiums.', clue: 'Walk under the arch toward Fifth Avenue.', source: wiki }, { r: 2.4 });

    const spawn = v(0, 3, 12.2);
    return {
      mounts,
      spawn,
      look: v(0, 3.4, Z0),
      eye: 3,
      bounds: [-W + 0.6, W - 0.6, Z0 + 0.6, ZL - 0.6],
      style: 'gilt',
      ceiling: H,
      path: [v(0, 3, 12.2), v(0, 3, 5.25), v(-6.5, 3, 5.25), v(-6.5, 3, -12.5), v(0, 3, -12.5), v(6.5, 3, -12.5), v(6.5, 3, 5.25), v(0, 3, 5.25), v(0, 3, 15.6), v(0, 3, 12.2)],
    };
  },
};

/* A clock face with its numerals, painted once. */
function clockFace() {
  const c = mkCanvas(512, 512), g = c.getContext('2d')!;
  g.fillStyle = '#efe8d6'; g.beginPath(); g.arc(256, 256, 250, 0, PI * 2); g.fill();
  g.strokeStyle = '#1b1a18'; g.lineWidth = 10; g.stroke();
  g.fillStyle = '#1b1a18'; g.font = 'bold 54px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 1; i <= 12; i++) { const a = (i / 12) * PI * 2; g.fillText(String(i), 256 + Math.sin(a) * 190, 256 - Math.cos(a) * 190); }
  for (let i = 0; i < 60; i++) { const a = (i / 60) * PI * 2, r0 = i % 5 ? 228 : 218; g.lineWidth = i % 5 ? 3 : 7; g.beginPath(); g.moveTo(256 + Math.sin(a) * r0, 256 - Math.cos(a) * r0); g.lineTo(256 + Math.sin(a) * 240, 256 - Math.cos(a) * 240); g.stroke(); }
  return canvasTex(c);
}
/* Falling water: bright streaks on a transparent canvas, scrolled down a tube. */
function waterStreaks() {
  const c = mkCanvas(128, 256), g = c.getContext('2d')!, rnd = X.mulberry(154);
  g.clearRect(0, 0, 128, 256);
  for (let i = 0; i < 90; i++) { const x = rnd() * 128, y = rnd() * 256, h = 20 + rnd() * 80; const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, `rgba(235,245,250,${0.35 + rnd() * 0.5})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x, y, 1.5 + rnd() * 3, h); g.fillRect(x, y - 256, 1.5, h); }
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t;
}

/* ---------------- 154 CHELSEA MARKET ---------------- */
export const chelseamarket: RoomDef = {
  id: 'chelseamarket',
  name: 'The biscuit factory',
  area: 'CHELSEA MARKET / NINTH AVENUE',
  mood: 'Brick, pipes and lunch',
  color: '#9a4a32',
  daylit: true,
  description: 'The long concourse of Chelsea Market, cut through the back lots of the old National Biscuit Company bakery where the Oreo was first made in 1912. Water pours from an old pipe into a basin by the Ninth Avenue door, the ducts and pipes run overhead under the iron beams, the stalls are busy and the clock keeps New York time, and at the far end the High Line crosses Tenth Avenue with people walking on it. The New Yorkers hang on the brick piers between the shopfronts.',
  signatures: 'The long brick concourse from Ninth Avenue to Tenth, riveted iron beams and a timber deck overhead, exposed pipes and a galvanized duct, the waterfall pouring from an old iron pipe into its basin, pendant factory lamps, shopfronts with steel lintels and painted signs, the hanging double faced clock, the lunch crowd, and the High Line and Tenth Avenue through the far doors.',
  build(k, ctx) {
    k.sky({ top: 0x4f86d0, horizon: 0xcfdcea, ground: 0x7a746c, fog: 0.004, sun: { az: 3.7, el: 0.7, color: 0xfff2dc, size: 8 }, env: 0.45 });
    k.hemi(0xffe8cc, 0x8a8478, 1.1);
    k.sun(0xfff0d8, 2.2, -40, 80, -120, true, 70);
    const rnd = X.mulberry(1540);
    const W = 5, Z9 = 8.5, Z10 = -72, HB = 5.0, HC = 5.6, D = 9;
    const brick = k.pbr('cm-brick', X.brick(0x7a3e2c, 154), 0.5);
    const brickDark = k.pbr('cm-brick2', X.brick(0x4e2a20, 155), 0.5);
    const floorM = k.pbr('cm-floor', X.concrete(0x807970, 154), 0.3, { roughness: 0.7 });
    const deck = k.pbr('cm-deck', X.planks(0x4a3526, 8, 154), 0.35);
    const iron = k.pbr('cm-iron', X.steel(0x2e2c2a, true, 154), 0.6, { metalness: 0.5, roughness: 0.55 });
    const rust = k.flat(0x6a3a22, 0.4, 0.7);
    const galv = k.flat(0x9ea3a6, 0.8, 0.35);
    const pipeRed = k.flat(0x8a2a22, 0.3, 0.5), pipeGrey = k.flat(0x55595c, 0.5, 0.5), pipeCopper = k.flat(0xa0643a, 0.8, 0.35);
    const wood = k.flat(0x5a3a24, 0.1, 0.6);
    const steelCounter = k.flat(0xb8bcc0, 0.8, 0.3);
    const shopGlow = k.flat(0x2a1a10, 0, 0.8, { emissive: 0xffc890, emissiveIntensity: 0.55 });
    const glass = k.glass(0xcfe3ea, 0.14, 0.05);
    const goods = [0xc8902a, 0x9a2a2a, 0x3a6a3a, 0xe0d6b8, 0x5a3a8a, 0xd86a2a, 0x2a4a7a, 0xf0c060].map((c) => k.flat(c, 0, 0.7));
    const mounts: Mount[] = [];

    /* ---- the floor, the deck, the end walls ---- */
    k.box(2 * D, 0.2, Z9 - Z10, 0, -0.1, (Z9 + Z10) / 2, floorM);
    k.box(2 * D, 0.3, Z9 - Z10, 0, HC + 0.15, (Z9 + Z10) / 2, deck);
    /* Ninth Avenue: glass doors, the name over them, the census above */
    k.box(2 * W, HC, 0.4, 0, HC / 2, Z9 + 0.2, brick);
    k.box(5.2, 3.1, 0.5, 0, 1.55, Z9 + 0.2, k.flat(0xf2f0ea, 0, 0.3, { emissive: 0xfff6e8, emissiveIntensity: 0.6 }));
    for (const x of [-2.6, -1.3, 0, 1.3, 2.6]) k.box(0.1, 3.1, 0.56, x, 1.55, Z9 + 0.2, iron);
    k.box(5.4, 0.2, 0.56, 0, 3.15, Z9 + 0.2, iron);
    k.sign('CHELSEA MARKET', 5.4, 0.62, 0, 3.62, Z9 - 0.03, '#171514', '#e8dcc0', 104, PI, { border: true });
    k.censusWall({ x: 0, y: 4.62, z: Z9 - 0.04, rotY: PI, cols: 22, rows: 2, tile: 0.36, gap: 0.04, start: ctx.wallStart(5360, 44), pieces: ctx.all, backing: k.flat(0x1c1a18, 0.3, 0.7) });
    /* Tenth Avenue: the concourse opens full height onto the street and the High Line */
    for (const s of [-1, 1]) k.box(1.2, HC, 0.6, s * (W - 0.6), HC / 2, Z10 - 0.3, brick);
    k.box(2 * W, 0.4, 0.6, 0, HC - 0.2, Z10 - 0.3, iron);

    /* ---- the side walls: brick piers carrying the art, stalls between them ---- */
    const piers: Record<number, number[]> = { [-1]: [3, -7, -17, -27, -37, -47, -57, -67], [1]: [-2, -12, -22, -32, -42, -52, -62] };
    const stalls: Record<number, number[]> = { [-1]: [-2, -12, -22, -32, -42, -52, -62], [1]: [3, -7, -17, -27, -37, -47, -57, -67] };
    const names = ['BAKERY', 'FISH MARKET', 'TACOS', 'SPICES', 'BOOKS', 'CHEESE', 'FLOWERS', 'COFFEE', 'WINE', 'NOODLES', 'BUTCHER', 'LOBSTER', 'DONUTS', 'OLIVE OIL'];
    const signCols: [string, string][] = [['#1d3b2e', '#f0e2b8'], ['#6a1e1a', '#f4e6c8'], ['#141414', '#f2c14e'], ['#e8dcc0', '#2a1a12'], ['#23324a', '#f0e6d0']];
    let ni = 0;
    for (const s of [-1, 1]) {
      const rot = s < 0 ? PI / 2 : -PI / 2;
      for (const z of piers[s]) {
        k.box(D - W, HC, 4, s * (W + D) / 2, HC / 2, z, brick);
        k.box(0.14, 0.5, 4.1, s * (W + 0.03), 0.25, z, brickDark);
        mounts.push({ position: v(s * (W - 0.08), 2.75, z), rotation: rot, target: v(s * 1.6, 3, z), width: 2.9, height: 2.1, style: 'black', wash: true });
      }
      for (const z of stalls[s]) {
        /* the header over the opening, and its steel lintel */
        k.box(0.6, HC - 3.4, 6, s * (W + 0.3), 3.4 + (HC - 3.4) / 2, z, brick);
        k.box(0.7, 0.32, 6.1, s * (W + 0.3), 3.45, z, iron);
        k.box(0.3, HC, 6, s * (D + 0.15), HC / 2, z, brickDark);
        if (s > 0 && z === -7) continue;
        k.box(0.1, 3.2, 5.6, s * (D - 0.05), 1.8, z, shopGlow);
        /* counter, shelves, goods, and somebody behind the counter */
        k.box(0.8, 1.05, 5.2, s * (W + 1.0), 0.53, z, wood);
        k.box(0.9, 0.06, 5.3, s * (W + 1.0), 1.08, z, steelCounter);
        for (const y of [1.3, 2.0, 2.7]) {
          k.box(0.5, 0.05, 5.2, s * (D - 0.35), y, z, wood);
          for (let j = 0; j < 9; j++) { const w = 0.25 + rnd() * 0.3, h = 0.2 + rnd() * 0.35; k.box(0.3, h, w, s * (D - 0.35), y + 0.03 + h / 2, z - 2.3 + j * 0.56, goods[Math.floor(rnd() * goods.length)]); }
        }
        for (let j = 0; j < 16; j++) { const r = 0.06 + rnd() * 0.06; k.sphere(r, s * (W + 1.0) + (rnd() - 0.5) * 0.5, 1.11 + r * 0.8, z - 2.3 + j * 0.3, goods[Math.floor(rnd() * goods.length)], 8); }
        figure(k, s * (W + 2.1), 0, z - 1 + rnd() * 2, [0xe8e4da, 0x1c1c1e, 0x2a4a6a, 0x7a2a22][Math.floor(rnd() * 4)], { rotY: rot + PI / 2 });
        const name = names[ni % names.length], [bg, fg] = signCols[ni % signCols.length]; ni++;
        k.sign(name, 4.4, 0.62, s * (W - 0.02), 4.2, z, bg, fg, Math.floor(Math.min(118, 1024 / (0.62 * name.length))), rot, { border: true });
      }
      /* solid brick where the rhythm runs out at either end */
      const zs = [...piers[s].map((z) => [z - 2, z + 2]), ...stalls[s].map((z) => [z - 3, z + 3])].sort((a, b) => b[0] - a[0]);
      let top = Z9;
      for (const [lo, hi] of zs) { if (top > hi + 0.01) k.box(D - W, HC, top - hi, s * (W + D) / 2, HC / 2, (top + hi) / 2, brick); top = Math.min(top, lo); }
      if (top > Z10 + 0.01) k.box(D - W, HC, top - Z10, s * (W + D) / 2, HC / 2, (top + Z10) / 2, brick);
    }

    /* ---- overhead: iron beams, pipes, the duct, the pendant lamps ---- */
    for (let z = Z9 - 2; z > Z10; z -= 5) {
      k.box(2 * W + 0.4, 0.5, 0.12, 0, HB + 0.3, z, iron);
      k.box(2 * W + 0.4, 0.05, 0.36, 0, HB + 0.07, z, iron);
      for (const s of [-1, 1]) k.box(0.3, 0.8, 0.3, s * (W - 0.1), HB - 0.1, z, iron);
    }
    const run = (x: number, y: number, r: number, m: T.Material) => k.beam(v(x, y, Z9), v(x, y, Z10), r, m, 12);
    run(-3.9, 5.1, 0.11, pipeRed); run(-3.5, 5.28, 0.07, pipeCopper); run(-3.1, 5.12, 0.09, pipeGrey); run(-2.7, 5.3, 0.05, pipeCopper);
    run(3.3, 4.95, 0.42, galv);
    for (let z = Z9 - 1; z > Z10; z -= 3) k.box(0.95, 0.06, 0.08, 3.3, 5.35, z, iron);
    for (let z = Z9 - 9.5; z > Z10; z -= 5) {
      k.beam(v(0, HC, z), v(0, 4.1, z), 0.012, iron, 4);
      k.mesh(new T.ConeGeometry(0.34, 0.26, 18, 1, true), k.flat(0x2f4a3a, 0.5, 0.5, { side: T.DoubleSide }), 0, 4.0, z);
      k.sphere(0.09, 0, 3.9, z, k.glow(0xd9a860), 8);
    }
    for (const z of [1.5, -16, -33.5, -51, -63.5]) k.point(0, 3.8, z, 0xffd6a0, 42, 22);

    /* ---- the waterfall: an old iron pipe out of the back of its alcove, pouring into a basin ---- */
    {
      const AX = 7.1, AZ = -7;
      k.lathe([[0, 0], [2.0, 0], [2.0, 0.45], [1.75, 0.45], [1.75, 0.2], [0, 0.2]], AX, 0, AZ, k.pbr('cm-stone', X.concrete(0x6a645c, 155), 0.5), 36);
      k.mesh(new T.CircleGeometry(1.75, 36).rotateX(-PI / 2), new T.MeshStandardMaterial({ color: 0x2c3a3c, metalness: 0.05, roughness: 0.12, envMapIntensity: 0.3 }), AX, 0.35, AZ);
      for (let i = 0; i < 9; i++) { const a = rnd() * PI * 2, r = 0.6 + rnd() * 1.0; const o = k.mesh(new T.DodecahedronGeometry(0.22 + rnd() * 0.2, 0), k.flat(0x3a3834, 0, 0.9), AX + Math.cos(a) * r, 0.4, AZ + Math.sin(a) * r); o.rotation.set(rnd() * 3, rnd() * 3, 0); }
      k.beam(v(D, 3.1, AZ), v(AX + 0.3, 3.1, AZ), 0.3, rust, 14);
      k.sphere(0.34, AX, 3.05, AZ, rust, 14);
      k.beam(v(AX, 3.05, AZ), v(AX, 2.72, AZ), 0.3, rust, 14);
      k.torus(0.34, 0.06, AX, 2.74, AZ, rust, 24).rotation.x = PI / 2;
      k.torus(0.4, 0.05, 8.2, 3.1, AZ, iron, 20).rotation.y = PI / 2;
      const streak = waterStreaks();
      const fall = new T.MeshBasicMaterial({ map: streak, color: 0xe6f2f6, transparent: true, opacity: 0.85, depthWrite: false, side: T.DoubleSide });
      const col = k.mesh(new T.CylinderGeometry(0.26, 0.42, 2.35, 20, 1, true), fall, AX, 1.55, AZ, true);
      void col;
      const drops = 120, dg = new T.SphereGeometry(0.028, 5, 4);
      const water = k.instances(dg, new T.MeshBasicMaterial({ color: 0xdcecf2, transparent: true, opacity: 0.4, depthWrite: false }), Array.from({ length: drops }, () => new T.Matrix4()));
      water.frustumCulled = false; water.castShadow = false;
      const dd = Array.from({ length: drops }, () => ({ a: rnd() * PI * 2, o: rnd(), sp: 0.6 + rnd() * 1.2 }));
      const m = new T.Matrix4(), p = new T.Vector3(), q = new T.Quaternion(), one = new T.Vector3(1, 1, 1);
      const splash = (t: number) => {
        streak.offset.y = (t * 1.6) % 1;
        dd.forEach((d, i) => { const u = (t * 1.3 + d.o) % 1, r = 0.35 + u * d.sp; p.set(AX + Math.cos(d.a) * r, 0.4 + 0.9 * u * (1 - u) * 1.6, AZ + Math.sin(d.a) * r); m.compose(p, q, one); water.setMatrixAt(i, m); });
        water.instanceMatrix.needsUpdate = true;
      };
      splash(0.2);
      if (!ctx.reduced) k.ticks.push(splash);
    }

    /* ---- the hanging clock, keeping New York time on both faces ---- */
    {
      const CZ = -32, CY = 4.15;
      for (const x of [-0.35, 0.35]) k.beam(v(x, HB + 0.05, CZ), v(x * 0.6, CY + 0.6, CZ), 0.02, iron, 4);
      const body = k.cyl(0.66, 0.3, 0, CY, CZ, iron, 0.66, 32); body.rotation.x = PI / 2;
      const faceM = new T.MeshBasicMaterial({ map: clockFace(), color: 0xd8d2c4 });
      const hands: T.Mesh[][] = [];
      for (const s of [-1, 1]) {
        const f = k.mesh(new T.CircleGeometry(0.6, 32), faceM, 0, CY, CZ + s * 0.16, true); f.rotation.y = s > 0 ? 0 : PI;
        const hg = new T.BoxGeometry(0.05, 0.34, 0.015).translate(0, 0.15, 0), mg = new T.BoxGeometry(0.035, 0.5, 0.015).translate(0, 0.22, 0);
        const hh = k.mesh(hg, k.flat(0x111111), 0, CY, CZ + s * 0.175, true), mm = k.mesh(mg, k.flat(0x111111), 0, CY, CZ + s * 0.18, true);
        hh.rotation.y = mm.rotation.y = s > 0 ? 0 : PI;
        hands.push([hh, mm]);
      }
      const setTime = () => {
        let h = 12, mi = 0;
        try { const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })); h = d.getHours(); mi = d.getMinutes() + d.getSeconds() / 60; } catch { /* keep noon */ }
        for (const [hh, mm] of hands) { hh.rotation.z = -((h % 12) + mi / 60) / 12 * PI * 2 * (hh.rotation.y ? -1 : 1); mm.rotation.z = -(mi / 60) * PI * 2 * (mm.rotation.y ? -1 : 1); }
      };
      setTime();
      if (!ctx.reduced) k.ticks.push(setTime);
    }

    /* ---- the lunch crowd ---- */
    if (!ctx.reduced) k.crowd([v(0, 0, 7.5), v(0, 0, -20), v(0, 0, -45), v(0, 0, -71)], 46, { seed: 154, speed: 1.0, spread: 5.6 });
    else for (let i = 0; i < 14; i++) figure(k, (rnd() - 0.5) * 5, 0, -rnd() * 70, [0x24262c, 0x8a3a3a, 0x33477f, 0xd8d0c0][i % 4]);
    /* a few standing at the counters */
    for (const [x, z] of [[-4.3, -11.2], [-4.2, -12.9], [4.3, -27.5], [-4.3, -41.5], [4.2, -46.4], [4.3, -56.8]]) figure(k, x, 0, z, [0x2b5f6e, 0xc9a25a, 0x151517, 0x6a4a8a][Math.floor(rnd() * 4)], { rotY: x < 0 ? -PI / 2 : PI / 2 });
    for (const [x, z] of [[-4.3, -11.2], [-4.2, -12.9], [4.3, -27.5], [-4.3, -41.5], [4.2, -46.4], [4.3, -56.8]]) k.keepOut.push({ x, z, r: 0.5 });

    /* ---- outside the Tenth Avenue doors: the High Line crossing overhead, and the avenue ---- */
    {
      const pav = k.pbr('cm-pav', X.pavers(0x8d887e, 154), 0.5), asph = k.pbr('cm-asph', X.asphalt(0x26292d), 0.25);
      const hl = k.pbr('cm-hl', X.steel(0x3e4a44, true, 155), 0.4, { metalness: 0.4, roughness: 0.6 });
      k.box(160, 0.2, 8, 0, -0.1, Z10 - 4, pav);
      k.box(160, 0.2, 16, 0, -0.12, Z10 - 16, asph);
      for (let x = -78; x < 80; x += 6) for (const z of [Z10 - 12, Z10 - 20]) k.box(3, 0.02, 0.15, x, 0.01, z, k.flat(0xe8e2c8));
      k.box(160, 0.2, 10, 0, -0.1, Z10 - 29, pav);
      const HZ0 = Z10 - 5, HZ1 = Z10 - 14, HY = 5.3;
      for (const z of [HZ0, HZ1]) { k.box(160, 1.5, 0.5, 0, HY - 0.3, z, hl); k.box(160, 0.12, 0.8, 0, HY - 1.05, z, hl); k.box(160, 0.12, 0.8, 0, HY + 0.45, z, hl); }
      for (let z = HZ0 - 1.5; z > HZ1; z -= 1.5) k.box(160, 0.9, 0.18, 0, HY - 0.5, z, hl);
      k.box(160, 0.35, HZ0 - HZ1, 0, HY + 0.3, (HZ0 + HZ1) / 2, k.pbr('cm-hlpav', X.concrete(0xb0aa9e, 156), 0.5));
      for (let x = -77; x <= 77; x += 14) for (const z of [HZ0 - 0.4, HZ1 + 0.4]) { k.box(0.7, HY - 1, 0.7, x, (HY - 1) / 2, z, hl); k.box(1.1, 0.4, 1.1, x, 0.2, z, k.flat(0x55524c)); }
      for (const z of [HZ0 + 0.1, HZ1 - 0.1]) { k.box(160, 0.06, 0.06, 0, HY + 1.55, z, k.flat(0x2a302c, 0.6, 0.5)); for (let x = -78; x < 80; x += 1.2) k.box(0.04, 1.1, 0.04, x, HY + 1.0, z, k.flat(0x2a302c, 0.6, 0.5)); }
      /* the planting on the deck: grasses and a few young trees */
      const grass = k.flat(0x8a9a4a, 0, 0.95), grass2 = k.flat(0x6a7e3a, 0, 0.95);
      for (let x = -76; x < 76; x += 3.2) { const z = HZ1 + 1.1 + rnd() * 0.8; k.box(2.6, 0.5 + rnd() * 0.4, 1.6, x, HY + 0.7, z, rnd() > 0.5 ? grass : grass2); }
      for (const x of [-30, -12, 8, 26, 44]) k.tree(x, HY + 0.45, HZ1 + 1.6, { h: 3, r: 1.4, seed: x + 900, leaf: 0x6a8a44 });
      if (!ctx.reduced) k.crowd([v(-70, HY + 0.47, HZ0 - 3), v(0, HY + 0.47, HZ0 - 3.2), v(70, HY + 0.47, HZ0 - 3)], 24, { seed: 1541, speed: 1.0, spread: 2.2 });
      /* the far side of Tenth Avenue */
      for (const [x, w, h] of [[-44, 30, 26], [-12, 26, 34], [16, 24, 22], [44, 28, 40]]) k.box(w, h, 16, x, h / 2, Z10 - 42, k.pbr('cm-far' + x, X.windows(1542 + x, 0.2, 0x6a3a2a, true), 0.12, { emissive: 0xffffff, emissiveIntensity: 0.35, roughness: 0.7, stretch: 0.4 }));
      k.skyline({ z: Z10 - 110, count: 16, spacing: 11, scale: 3, base: -2, seed: 154, lit: 0.2, tint: 0x7a7a78, glow: 0.35 });
      /* Tenth Avenue traffic, heading uptown */
      const NC = 12, carG = mergeGeometries([new T.BoxGeometry(4.6, 0.8, 1.9).translate(0, 0.6, 0), new T.BoxGeometry(2.6, 0.6, 1.7).translate(-0.2, 1.3, 0)])!;
      const cars = k.instances(carG, new T.MeshStandardMaterial({ roughness: 0.4, metalness: 0.3 }), Array.from({ length: NC }, () => new T.Matrix4()));
      cars.frustumCulled = false;
      const cc = new T.Color(), cst = Array.from({ length: NC }, (_, i) => { cars.setColorAt(i, cc.set(i % 3 === 0 ? 0x1b1d22 : i % 4 === 0 ? 0xd8d8d8 : i % 2 ? 0xf2b705 : 0x5a1a1a)); return { lane: Z10 - 9.5 - (i % 4) * 3, o: rnd() * 160, sp: 6 + rnd() * 5 }; });
      if (cars.instanceColor) cars.instanceColor.needsUpdate = true;
      const cm = new T.Matrix4(), cp = new T.Vector3(), cq = new T.Quaternion(), one = new T.Vector3(1, 1, 1);
      const drive = (t: number) => { cst.forEach((c, i) => { cp.set(((((c.o + t * c.sp) % 160) + 160) % 160) - 80, 0, c.lane); cm.compose(cp, cq, one); cars.setMatrixAt(i, cm); }); cars.instanceMatrix.needsUpdate = true; };
      drive(0);
      if (!ctx.reduced) k.ticks.push(drive);
      k.egg(v(0, HY, (HZ0 + HZ1) / 2), { id: 'high-line-1934', title: 'Trains through the bakery', year: '1934', text: 'The elevated freight line was dedicated on June 29, 1934, the first part of the West Side Improvement to be finished. It ran straight into factories and warehouses so trains could load and unload inside them, the Nabisco plant here among them. The last train, in 1980, was three cars of frozen turkeys, and the first section of the park opened on June 8, 2009.', clue: 'Walk to the Tenth Avenue doors and look up at the people walking on the old tracks.', source: { name: 'High Line, Wikipedia', url: 'https://en.wikipedia.org/wiki/High_Line' } }, { r: 6 });
    }

    /* ---- eggs ---- */
    const wiki = { name: 'Chelsea Market, Wikipedia', url: 'https://en.wikipedia.org/wiki/Chelsea_Market' };
    k.egg(v(-6.5, 1.6, -2), { id: 'oreo-1912', title: 'Where the Oreo began', year: '1912', text: 'The Oreo Biscuit was first developed and produced by the National Biscuit Company early in 1912 at its factory here on Ninth Avenue between 15th and 16th Streets. The first one was sold on March 6, 1912, to a grocer in Hoboken, the name was trademarked on March 14, and in 2002 this block of Ninth Avenue was named Oreo Way.', clue: 'Start at the bakery by the Ninth Avenue door.', source: { name: 'Oreo, Wikipedia', url: 'https://en.wikipedia.org/wiki/Oreo' } }, { r: 2 });
    k.egg(v(-W, 3, -27), { id: 'nabisco-1898', title: 'The biscuit company', year: '1898', text: 'Bakeries began building on this block in the 1890s, and several of them merged into the National Biscuit Company in 1898. Most of the original buildings are heavy timber inside with brick facades, designed by the firm of Romeyn and Stever.', clue: 'Put a hand on the brick: the bakery is still holding the roof up.', source: wiki }, { r: 2.4 });
    k.egg(v(0, 4.15, -32), { id: 'concourse-1997', title: 'A street through the back lots', year: '1997', text: 'Irwin Cohen redeveloped the complex in the 1990s with the architect Jeff Vandeberg. The retail concourse was made by joining the old back lots of the separate buildings into one ground floor passage with entrances on Ninth and Tenth Avenues, finished in April 1997.', clue: 'Stand under the clock and look both ways down the passage.', source: wiki }, { r: 1.6 });
    k.egg(v(0, 3.6, Z9 - 0.2), { id: 'alphabet-2018', title: 'Sold upstairs', year: '2018', text: 'The complex is a retail concourse at ground level with offices above. In 2018 Alphabet, the parent company of Google, bought Chelsea Market for more than 2.4 billion dollars.', clue: 'Turn round and read the name over the Ninth Avenue doors.', source: wiki }, { r: 2 });

    return {
      mounts,
      spawn: v(0, 3, 6.2),
      look: v(0, 3.2, Z10),
      eye: 3,
      bounds: [-W + 0.6, W - 0.6, Z10 + 1.2, Z9 - 0.8],
      style: 'black',
      ceiling: HB,
      path: [v(0, 3, 6.2), v(0, 3, -12), v(0, 3, -32), v(0, 3, -52), v(0, 3, -70)],
    };
  },
};
