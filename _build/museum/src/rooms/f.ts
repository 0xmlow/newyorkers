/* Rooms 22 to 26: the Chrysler lobby and crown, the Flatiron prow, the Bleachers, the Deli Counter, Washington Square.
   Every interior comes with its street and its skin: walk in from outside. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Kit, Mount } from '../kit';
import type { RoomDef, RoomCtx } from './types';
import { billboard, scan, glbs, carBox, fireflyPlate } from './a';
import { hero, heroInstances, standIn, hide } from './heroes';

const PI = Math.PI;

/* ---------- THE BIG UPGRADE, wave 2a (2026-11-23): local helpers for rooms 22, 23, 25, 26 ----------
   Scans, models and Firefly plates go through the wave 1 helpers in a.ts (scan, glbs, fireflyPlate, carBox). What is
   here is local: signs in the house fonts (Archivo Expanded, Archivo Narrow, JetBrains Mono, Permanent Marker, the
   woff2 files the gardens already ship), canvas painted surfaces, a scanned street, and anamorphic floor art that can
   face any way. All of it runs in node too, where the audits build rooms against a stub canvas. */
const FONTS: Record<string, string> = {
  'W2 Archivo Expanded': 'assets/gardens/fonts/ArchivoExpanded.woff2',
  'W2 Archivo Narrow': 'assets/gardens/fonts/ArchivoNarrow-700.woff2',
  'W2 JetBrains Mono': 'assets/gardens/fonts/JetBrainsMono.woff2',
  'W2 Permanent Marker': 'assets/gardens/fonts/PermanentMarker-400.woff2',
};
const fontReady = new Map<string, Promise<void>>();
function houseFont(family: string): Promise<void> {
  if (typeof FontFace === 'undefined' || typeof document === 'undefined' || !(document as Document).fonts) return Promise.resolve();
  let p = fontReady.get(family);
  if (!p) {
    p = new FontFace(family, `url(${FONTS[family]})`).load().then((f) => { (document.fonts as unknown as { add(f: FontFace): void }).add(f); }).catch(() => {});
    fontReady.set(family, p);
  }
  return p;
}
type Paint = (g: CanvasRenderingContext2D, w: number, h: number) => void;
/* A canvas texture painted now with fallback fonts and again once the house fonts it names arrive. */
export function paintTex(w: number, h: number, paint: Paint, fonts: string[] = [], srgb = true) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const t = new T.CanvasTexture(c);
  if (srgb) t.colorSpace = T.SRGBColorSpace;
  t.anisotropy = 8;
  const run = () => { const g = c.getContext('2d')!; g.clearRect(0, 0, w, h); paint(g, w, h); t.needsUpdate = true; };
  run();
  if (fonts.length) void Promise.all(fonts.map(houseFont)).then(run);
  return t;
}
/* Set the font, shrunk until `text` fits `max` pixels. */
export function fit(g: CanvasRenderingContext2D, text: string, family: string, size: number, max: number, weight = '700') {
  const f = (s: number) => `${weight} ${s}px "${family}", "Helvetica Neue", Arial, sans-serif`;
  g.font = f(size);
  const w = g.measureText(text).width;
  if (w > max) { size *= max / w; g.font = f(size); }
  return size;
}
/* A sign in a house font: one line, fitted to the plate, on a coloured ground or none. */
export function hsign(k: Kit, text: string, w: number, h: number, x: number, y: number, z: number, rotY: number, o: { fg: string; bg?: string; font?: string; border?: string; size?: number; lit?: boolean }) {
  const W = 1024, H = Math.max(64, Math.round((W * h) / w)), fam = o.font ?? 'W2 Archivo Expanded';
  const t = paintTex(W, H, (g) => {
    if (o.bg) { g.fillStyle = o.bg; g.fillRect(0, 0, W, H); }
    if (o.border) { g.strokeStyle = o.border; g.lineWidth = Math.max(3, H * 0.05); g.strokeRect(H * 0.09, H * 0.09, W - H * 0.18, H - H * 0.18); }
    const s = fit(g, text, fam, H * (o.size ?? 0.6), W * (o.border ? 0.84 : 0.92));
    g.fillStyle = o.fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, W / 2, H / 2 + s * 0.05);
  }, [fam]);
  const m = o.lit === false ? new T.MeshStandardMaterial({ map: t, transparent: !o.bg, roughness: 0.6 }) : new T.MeshBasicMaterial({ map: t, transparent: !o.bg });
  const s = k.mesh(new T.PlaneGeometry(w, h), m, x, y, z, true);
  s.rotation.y = rotY;
  return s;
}
/* Anamorphic floor art (ON LOCATION rule 9): a picture laid flat, stretched so that from the eye at (ex, eh, ez) looking
   along `yaw` (0 is -z, as the camera) it stands up as a board W wide and H tall whose foot is D ahead. A floor point at
   distance d carries board height y where d = D * eh / (eh - y). */
export function anamorphTex(k: Kit, tex: T.Texture, ex: number, ez: number, eh: number, floor: number, yaw: number, D: number, W: number, H: number, opacity = 0.92) {
  const rows = 40, g = new T.BufferGeometry(), pos: number[] = [], uv: number[] = [], idx: number[] = [], h = eh - floor;
  for (let i = 0; i <= rows; i++) {
    const vv = i / rows, d = (D * h) / (h - vv * H), half = ((W / 2) * d) / D;
    pos.push(-half, 0, -d, half, 0, -d);
    uv.push(0, vv, 1, vv);
    if (i < rows) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new T.MeshBasicMaterial({ map: tex, transparent: true, opacity, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const o = k.mesh(g, m, ex, floor + 0.014, ez, true);
  o.rotation.y = yaw;
  return o;
}
/* Lexington, Fifth, Houston: the shared street() with scanned asphalt, pavement and granite kerbs. */
function scanStreet(k: Kit, room: string, p: { w: number; len: number; z: number; x?: number; walk?: number }) {
  const { w, len, z, x = 0, walk = 5 } = p;
  const asphalt = scan(k, room, 'asphalt_02', 3, () => X.asphalt(0x24282d), { color: 0x9a9a9a, roughness: 0.9 }),
    pav = scan(k, room, room === 'chrysler' ? 'concrete_floor_02' : 'asphalt_02', 2, () => X.pavers(0x8e8b84, 5), { color: room === 'chrysler' ? 0xb8b4aa : 0xd8d2c6 }),
    granite = k.pbr('curbS', X.ashlar(0x8a8a86, 4, 2), 0.35),
    white = k.flat(0xdedbd2, 0, 0.7),
    yellow = k.flat(0xe6a626, 0, 0.6);
  k.box(w, 0.3, len, x, -0.15, z, asphalt);
  for (const s of [-1, 1]) {
    k.box(walk, 0.28, len, x + s * (w / 2 + walk / 2), 0.0, z, pav);
    k.box(0.3, 0.32, len, x + s * (w / 2 + 0.1), 0.02, z, granite);
  }
  for (const dx of [-0.14, 0.14]) k.box(0.09, 0.012, len - 6, x + dx, 0.01, z, yellow);
  for (let cz = z + len / 2 - 6; cz > z - len / 2; cz -= 28) for (let cx = -w / 2 + 1.2; cx <= w / 2 - 1; cx += 1.2) k.box(0.62, 0.014, 2.8, x + cx, 0.012, cz, white);
}
const rib0 = (k: Kit) => k.flat(0xf2f5f7, 1, 0.12);
/* Recolour a loaded model's materials (shared by its clones): bright steel, white marble, painted iron. */
function steelUp(o: T.Object3D, color: number, metalness = 0.92, roughness = 0.22, keepMap = true) {
  o.traverse((c) => {
    if (c instanceof T.Mesh) for (const m of [c.material].flat() as T.MeshStandardMaterial[]) {
      m.color.setHex(color); m.metalness = metalness; m.roughness = roughness; m.metalnessMap = null;
      if (!keepMap) m.map = null;
      m.needsUpdate = true;
    }
  });
}
/* The Chrysler lobby's lotus doors: a fan of pale veneers opening up from the sill under brass palm fronds. */
const lotusDoor: Paint = (g, w, h) => {
  const bg = g.createLinearGradient(0, 0, w, 0); bg.addColorStop(0, '#2e1a10'); bg.addColorStop(0.5, '#4a2c18'); bg.addColorStop(1, '#2e1a10');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.globalAlpha = 0.18; g.strokeStyle = '#1a0e08';
  for (let x = 4; x < w; x += 7) { g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 6, h * 0.3, x - 6, h * 0.7, x + 3, h); g.stroke(); }
  g.globalAlpha = 1;
  const cx = w / 2, by = h * 0.9, petals = 13;
  for (let i = 0; i < petals; i++) {
    const a = -PI * 0.92 + (i / (petals - 1)) * PI * 0.84, len = h * (0.5 + 0.18 * Math.sin((i / (petals - 1)) * PI));
    g.save(); g.translate(cx, by); g.rotate(a + PI / 2);
    g.fillStyle = i % 2 ? '#c8935a' : '#a8703c';
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(w * 0.07, -len * 0.55, 0, -len); g.quadraticCurveTo(-w * 0.07, -len * 0.55, 0, 0); g.fill();
    g.strokeStyle = '#e8c477'; g.lineWidth = 1.6; g.stroke();
    g.restore();
  }
  g.strokeStyle = '#e8c477'; g.lineWidth = 3;
  for (let i = 0; i < 5; i++) { const y = h * (0.06 + i * 0.035); g.beginPath(); g.moveTo(w * 0.12 + i * 6, y); g.lineTo(cx, y + 18); g.lineTo(w * 0.88 - i * 6, y); g.stroke(); }
  g.fillStyle = '#d6b066'; g.fillRect(cx - 2, 0, 4, h);
  g.strokeRect(6, 6, w - 12, h - 12);
};
/* The Chrysler lobby ceiling until the Firefly mural: a deco sunburst in ochre, umber and gold leaf. */
const decoCeiling: Paint = (g, w, h) => {
  const bg = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, h * 0.6); bg.addColorStop(0, '#d9a85a'); bg.addColorStop(0.6, '#8a5a2e'); bg.addColorStop(1, '#4a2e1a');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * PI * 2; g.fillStyle = i % 2 ? 'rgba(244,214,140,0.22)' : 'rgba(60,32,16,0.18)';
    g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + Math.cos(a) * h, h / 2 + Math.sin(a) * h); g.lineTo(w / 2 + Math.cos(a + PI / 72) * h, h / 2 + Math.sin(a + PI / 72) * h); g.fill();
  }
  g.strokeStyle = '#e8c477'; g.lineWidth = 6; g.strokeRect(14, 14, w - 28, h - 28); g.lineWidth = 2; g.strokeRect(30, 30, w - 60, h - 60);
  for (let y = 60; y < h - 40; y += 48) for (const x of [44, w - 44]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + (x < w / 2 ? 14 : -14), y + 24); g.lineTo(x, y + 48); g.stroke(); }
};
/* Pressed tin, a 24 inch panel: a raised square, a medallion and corner fans, shaded as if lit from the window. */
const pressedTin: Paint = (g, w, h) => {
  g.fillStyle = '#b9b4aa'; g.fillRect(0, 0, w, h);
  const bevel = (x: number, y: number, ww: number, hh: number, d: number) => {
    g.fillStyle = '#e8e4da'; g.fillRect(x, y, ww, d); g.fillRect(x, y, d, hh);
    g.fillStyle = '#7e786e'; g.fillRect(x, y + hh - d, ww, d); g.fillRect(x + ww - d, y, d, hh);
  };
  bevel(10, 10, w - 20, h - 20, 8);
  bevel(48, 48, w - 96, h - 96, 6);
  const cx = w / 2, cy = h / 2;
  for (let r = 150; r > 20; r -= 26) {
    const gr = g.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    gr.addColorStop(0, '#efebe2'); gr.addColorStop(1, '#8a8478');
    g.fillStyle = gr; g.beginPath();
    for (let i = 0; i <= 16; i++) { const a = (i / 16) * PI * 2, rr = r * (i % 2 ? 0.86 : 1); g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    g.fill();
  }
  for (const [x, y] of [[48, 48], [w - 48, 48], [48, h - 48], [w - 48, h - 48]]) {
    for (let i = 0; i < 5; i++) { g.strokeStyle = i % 2 ? '#e4e0d6' : '#837d72'; g.lineWidth = 5; g.beginPath(); g.arc(x, y, 18 + i * 9, 0, PI * 2); g.stroke(); }
  }
};
/* The Houston Street wall: an old painted sign, faded into the brick. */
const ghostSign: Paint = (g, w, h) => {
  g.fillStyle = 'rgba(236,226,204,0.85)';
  g.fillRect(30, 30, w - 60, 8); g.fillRect(30, h - 38, w - 60, 8);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  fit(g, 'APPETIZING', 'W2 Archivo Expanded', 190, w * 0.9, '800'); g.fillText('APPETIZING', w / 2, h * 0.34);
  fit(g, 'SMOKED FISH  .  LOX  .  HERRING', 'W2 Archivo Expanded', 64, w * 0.86, '700'); g.fillText('SMOKED FISH  .  LOX  .  HERRING', w / 2, h * 0.66);
  fit(g, 'SINCE 1914', 'W2 Archivo Expanded', 44, w * 0.5, '700'); g.fillText('SINCE 1914', w / 2, h * 0.83);
  /* the wear: brick shows through */
  const rnd = X.mulberry(1914);
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 900; i++) { g.globalAlpha = 0.25 + rnd() * 0.5; g.fillRect(rnd() * w, rnd() * h, 6 + rnd() * 40, 3 + rnd() * 10); }
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
};
/* A doorway into a stockroom that is barely there: built as a ten metre room seen from four metres away, squeezed
   into `depth`. Every row u of the virtual room is scaled by s = E / (E + u) toward a vanishing point at head height. */
function backRoom(k: Kit, cx: number, zBack: number, w0: number, h0: number, depth: number) {
  const E = 4, U = 10, rows = 14, sEnd = E / (E + U), vy = 2.0, z0 = zBack + depth;
  const at = (u: number) => { const s = E / (E + u); return { s, z: z0 - (depth - 0.06) * (1 - s) / (1 - sEnd), half: (w0 / 2) * s, floor: vy * (1 - s), ceil: vy + (h0 - vy) * s }; };
  const checker = paintTex(256, 1024, (g, w, h) => { const n = 4, m = rows * 2; for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { g.fillStyle = (i + j) % 2 ? '#1c1c1c' : '#e8e2d6'; g.fillRect((i * w) / n, (j * h) / m, w / n + 1, h / m + 1); } });
  const tiles = paintTex(256, 1024, (g, w, h) => { g.fillStyle = '#eeebe2'; g.fillRect(0, 0, w, h); g.fillStyle = '#b8b2a6'; for (let j = 0; j < rows * 2; j++) g.fillRect(0, (j * h) / (rows * 2), w, 3); for (let i = 1; i < 6; i++) g.fillRect((i * w) / 6, 0, 3, h); g.fillStyle = '#1f4a3a'; g.fillRect(0, h * 0.995, w, 6); });
  const strip = (edge: (a: ReturnType<typeof at>) => [T.Vector3, T.Vector3], tex: T.Texture, tint = 0xffffff) => {
    const pos: number[] = [], uv: number[] = [], idx: number[] = [];
    for (let r = 0; r <= rows; r++) {
      const u = (r / rows) * U, a = at(u), [p, q] = edge(a);
      pos.push(p.x, p.y, p.z, q.x, q.y, q.z); uv.push(0, r / rows, 1, r / rows);
      if (r < rows) { const o = r * 2; idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3); }
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    return k.mesh(g, new T.MeshStandardMaterial({ map: tex, color: tint, roughness: 0.5, side: T.DoubleSide }), 0, 0, 0, true);
  };
  strip((a) => [v(cx - a.half, a.floor, a.z), v(cx + a.half, a.floor, a.z)], checker);
  strip((a) => [v(cx - a.half, a.ceil, a.z), v(cx + a.half, a.ceil, a.z)], tiles, 0x9a968c);
  strip((a) => [v(cx - a.half, a.floor, a.z), v(cx - a.half, a.ceil, a.z)], tiles);
  strip((a) => [v(cx + a.half, a.floor, a.z), v(cx + a.half, a.ceil, a.z)], tiles);
  /* shelves of cans down both walls, and a lit door at the far end */
  const shelf = k.flat(0x6a4a30, 0, 0.6), can = [0xc8a24a, 0x8a2a2a, 0x2a5a8a, 0xe8e2d4];
  for (let r = 1; r < 9; r++) {
    const a = at(r * 1.1), b = at(r * 1.1 + 0.9);
    for (const sd of [-1, 1]) for (const lv of [0.7, 1.4, 2.1]) {
      const y = a.floor + lv * a.s, x = cx + sd * (a.half - 0.18 * a.s);
      k.box(0.34 * a.s, 0.04 * a.s, Math.abs(a.z - b.z), x, y, (a.z + b.z) / 2, shelf);
      k.box(0.22 * a.s, 0.22 * a.s, Math.abs(a.z - b.z) * 0.8, x, y + 0.13 * a.s, (a.z + b.z) / 2, k.flat(can[(r + lv * 10) % 4], 0.3, 0.4));
    }
  }
  const e = at(U);
  k.box(e.half * 1.3, (e.ceil - e.floor) * 0.86, 0.02, cx, e.floor + (e.ceil - e.floor) * 0.43, e.z - 0.01, k.glow(0xffe2b0));
  k.point(cx, 2.2, zBack + 0.4, 0xffe2b0, 5, 3);
  /* the doorframe at the front */
  const frame = k.flat(0x1f4a3a, 0.1, 0.35);
  for (const sd of [-1, 1]) k.box(0.16, h0 + 0.1, 0.18, cx + sd * (w0 / 2 + 0.08), (h0 + 0.1) / 2, z0, frame);
  k.box(w0 + 0.32, 0.16, 0.18, cx, h0 + 0.08, z0, frame);
}
/* A Victory for the arch's spandrel: a winged figure in low relief, light from the upper left, until Firefly's. */
const victoryRelief: Paint = (g, w, h) => {
  g.fillStyle = '#e4dfd4'; g.fillRect(0, 0, w, h);
  const shade = (path: () => void, lift: number) => { g.save(); g.translate(-lift, -lift); g.fillStyle = '#f6f2ea'; path(); g.fill(); g.restore(); g.save(); g.translate(lift, lift); g.fillStyle = '#b7b0a2'; path(); g.fill(); g.restore(); g.fillStyle = '#e8e3d8'; path(); g.fill(); };
  shade(() => { g.beginPath(); g.moveTo(w * 0.3, h * 0.55); g.bezierCurveTo(w * 0.5, h * 0.1, w * 0.85, h * 0.05, w * 0.98, h * 0.08); g.bezierCurveTo(w * 0.8, h * 0.25, w * 0.75, h * 0.45, w * 0.45, h * 0.62); g.closePath(); }, 5);
  shade(() => { g.beginPath(); g.ellipse(w * 0.32, h * 0.42, w * 0.07, h * 0.08, 0, 0, PI * 2); }, 4);
  shade(() => { g.beginPath(); g.moveTo(w * 0.26, h * 0.5); g.bezierCurveTo(w * 0.2, h * 0.7, w * 0.05, h * 0.85, w * 0.02, h * 0.98); g.lineTo(w * 0.4, h * 0.98); g.bezierCurveTo(w * 0.42, h * 0.8, w * 0.42, h * 0.65, w * 0.4, h * 0.5); g.closePath(); }, 5);
  shade(() => { g.beginPath(); g.moveTo(w * 0.36, h * 0.48); g.lineTo(w * 0.7, h * 0.3); g.lineTo(w * 0.72, h * 0.34); g.lineTo(w * 0.4, h * 0.54); g.closePath(); }, 3);
  g.strokeStyle = '#a8a092'; g.lineWidth = 3;
  for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(w * (0.5 + i * 0.05), h * (0.5 - i * 0.04)); g.quadraticCurveTo(w * (0.6 + i * 0.04), h * (0.3 - i * 0.02), w * (0.62 + i * 0.04), h * (0.12 - i * 0.004)); g.stroke(); }
};
/* A green New York street sign pair on a pole: two blades, one each way. */
function streetSign(k: Kit, x: number, z: number, a: string, b: string, rotY = 0) {
  const pole = k.flat(0x2c3a30, 0.5, 0.5);
  k.cyl(0.06, 3.6, x, 1.8, z, pole, 0.07, 8);
  const s1 = hsign(k, a, 1.5, 0.26, x, 3.42, z, rotY, { fg: '#f4f6f2', bg: '#1d6b45', font: 'W2 Archivo Narrow', border: '#f4f6f2', size: 0.62 });
  const s2 = hsign(k, a, 1.5, 0.26, x, 3.42, z, rotY + PI, { fg: '#f4f6f2', bg: '#1d6b45', font: 'W2 Archivo Narrow', border: '#f4f6f2', size: 0.62 });
  const s3 = hsign(k, b, 1.5, 0.26, x, 3.12, z, rotY + PI / 2, { fg: '#f4f6f2', bg: '#1d6b45', font: 'W2 Archivo Narrow', border: '#f4f6f2', size: 0.62 });
  const s4 = hsign(k, b, 1.5, 0.26, x, 3.12, z, rotY - PI / 2, { fg: '#f4f6f2', bg: '#1d6b45', font: 'W2 Archivo Narrow', border: '#f4f6f2', size: 0.62 });
  void s1; void s2; void s3; void s4;
  k.keepOut.push({ x, z, r: 0.3 });
}

/* ---------- shared street furniture for the exterior rooms ---------- */
export function street(k: Kit, p: { w: number; len: number; z: number; x?: number; walk?: number; night?: boolean; curbs?: boolean }) {
  const { w, len, z, x = 0, walk = 5, curbs = true } = p;
  const asphalt = k.pbr('asphaltS', X.asphalt(0x24282d), 0.11, { roughness: 0.62, metalness: 0.12 }),
    pav = k.pbr('sidewalkS', X.pavers(0x8e8b84, 5), 0.42),
    granite = k.pbr('curbS', X.ashlar(0x8a8a86, 4, 2), 0.35),
    white = k.flat(0xdedbd2, 0, 0.7),
    yellow = k.flat(0xe6a626, 0, 0.6);
  k.box(w, 0.3, len, x, -0.15, z, asphalt);
  for (const s of [-1, 1]) {
    k.box(walk, 0.28, len, x + s * (w / 2 + walk / 2), 0.0, z, pav);
    if (curbs) k.box(0.3, 0.32, len, x + s * (w / 2 + 0.1), 0.02, z, granite);
  }
  for (const dx of [-0.14, 0.14]) k.box(0.09, 0.012, len - 6, x + dx, 0.01, z, yellow);
  for (let cz = z + len / 2 - 6; cz > z - len / 2; cz -= 28) for (let cx = -w / 2 + 1.2; cx <= w / 2 - 1; cx += 1.2) k.box(0.62, 0.014, 2.8, x + cx, 0.012, cz, white);
}

/* A city block of brick and glass neighbours, with lit windows, along one side of a street. */
export function blockFront(k: Kit, p: { x: number; z0: number; count: number; depth?: number; face: 1 | -1; seed?: number; h?: [number, number] }) {
  const { x, z0, count, depth = 9, face, seed = 1, h = [14, 26] } = p;
  const rnd = X.mulberry(seed);
  const bricks = [k.pbr('nbBrickA', X.brick(0x6b4437, 21), 0.28), k.pbr('nbBrickB', X.brick(0x4f3b36, 22), 0.28), k.pbr('nbStone', X.ashlar(0xb9ad97, 23, 3), 0.22), k.pbr('nbGlass', X.windows(24, 0.25, 0x51697a, false), 0.12, { emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.4, metalness: 0.5, stretch: 0.42 })];
  const cornice = k.pbr('nbCornice', X.plaster(0xb8ad9a, 3), 0.6),
    glassDark = k.glass(0x9fc4d8, 0.35, 0.08),
    warm = k.glow(0xffd28a),
    iron = k.flat(0x1f262b, 0.75, 0.45);
  for (let b = 0; b < count; b++) {
    const z = z0 - b * 8,
      hh = h[0] + Math.floor(rnd() * (h[1] - h[0])),
      m = bricks[Math.floor(rnd() * bricks.length)];
    k.box(depth, hh, 7.9, x - face * depth / 2, hh / 2, z, m);
    if (m !== bricks[3]) {
      k.moulding([[0, 0], [0.7, 0], [0.8, 0.2], [0.5, 0.35], [0.6, 0.55], [0.25, 0.75], [0, 0.85]], 8.1, x - face * 0.05, hh - 0.5, z, cornice, face > 0 ? 0 : PI);
      for (let y = 3.2; y < hh - 1.5; y += 2.7) for (const dz of [-2.6, 0, 2.6]) {
        k.box(0.2, 1.9, 1.35, x - face * 0.06, y, z + dz, cornice);
        k.box(0.05, 1.65, 1.1, x + face * 0.06, y, z + dz, rnd() > 0.72 ? warm : glassDark);
        k.box(0.05, 1.7, 0.05, x + face * 0.1, y, z + dz, iron);
      }
      if (rnd() > 0.5) k.prop('fire_escape', x + face * 1.05, 6.6 + rnd() * 3, z, { height: 3.2, rotY: face > 0 ? -PI / 2 : PI / 2 });
      if (rnd() > 0.6) k.prop('water_tower', x - face * (depth / 2), hh, z + 1.5, { height: 5 });
    }
  }
}

/* ---------------- 22 THE CHRYSLER BUILDING ---------------- */
export const chrysler: RoomDef = {
  id: 'chrysler',
  name: 'The crown and the lobby',
  area: 'THE CHRYSLER BUILDING',
  mood: 'Deco at dusk',
  color: '#d9c48a',
  description: 'Lexington Avenue under the steel crown, then the red marble lobby with its painted ceiling and inlaid elevator doors.',
  signatures: 'The terraced steel crown with triangular windows and its needle, eagle gargoyles at the setbacks, the red Moroccan marble lobby with a ceiling mural and lotus elevator doors.',
  build(k, ctx) {
    k.sky({ top: 0x2a3d6e, horizon: 0xe8a877, ground: 0x2a2a30, fog: 0.0026, sun: { az: 4.6, el: 0.09, color: 0xffb070, size: 20 }, haze: 0.35, stars: 120, env: 0.8 });
    k.hemi(0xffdcc0, 0x2a2c34, 0.7);
    k.sun(0xffc08a, 2.0, -60, 26, -30, true, 90);
    /* 2026-11-23: the lobby's Rouge Flamme and amber onyx are a Poly Haven marble scan (marble_01, CC0) tinted, at its
       real 1.5 m slab; the floor is a scanned travertine tile (floor_tiles_02) at 4 m */
    const marbleRed = scan(k, 'chrysler', 'marble_01', 1.5, () => X.marble(0x8a3a3a, 0xd9b090, 7), { color: 0xa8402f, roughness: 0.22 }),
      onyx = scan(k, 'chrysler', 'marble_01', 1.5, () => X.marble(0x3a2a22, 0xc9a25a, 8), { color: 0x6a4a2a, roughness: 0.18 }, 1.2),
      brass = k.pbr('brassC', X.gilt(0xc9a55a), 2, { metalness: 0.85, roughness: 0.28 }),
      steelCrown = k.pbr('crownSteel', X.steel(0xc7ccd2, false, 25), 0.35, { metalness: 0.95, roughness: 0.22 }),
      facade = k.pbr('chryslerBrick', X.windows(26, 0.4, 0x6b655c, true), 0.12, { emissive: 0xffffff, emissiveIntensity: 1.0, roughness: 0.6, stretch: 0.42 }),
      wood = k.pbr('lotusWood', X.planks(0x5a3a26, 6, 27), 1.4, { roughness: 0.5 }),
      floorM = scan(k, 'chrysler', 'floor_tiles_02', 4, () => X.terrazzo(0xd4bc8a, 9), { color: 0xd8b48a, roughness: 0.3 }),
      dark = k.flat(0x1a1a1c, 0.5, 0.6),
      glow = k.glow(0xfff0c8),
      glass = k.glass(0xcfe0e8, 0.18, 0.06);
    // Lexington Avenue and the neighbours
    scanStreet(k, 'chrysler', { w: 20, len: 120, z: -20 });
    blockFront(k, { x: -15, z0: 30, count: 9, face: 1, seed: 41, h: [16, 30] });
    blockFront(k, { x: 15, z0: 30, count: 3, face: -1, seed: 42, h: [14, 22] });
    for (const z of [26, 6, -46]) for (const s of [-1, 1]) k.lamp(s * 11.6, z, 6.2, dark, 0xffd9a8, 30);
    k.prop('hydrant', 12, 0, 16, { height: 1.1, keepOut: 0.5 });
    k.prop('mailbox', -12, 0, -8, { height: 1.5, rotY: PI / 2, keepOut: 0.6 });
    // the tower: a setback base on the east side of the avenue, the crown far above
    const TX = 32, TZ = -18;
    k.box(34, 62, 34, TX, 31, TZ, facade);
    for (let i = 0; i < 4; i++) k.box(30 - i * 3, 14, 30 - i * 3, TX, 62 + 7 + i * 14, TZ, facade);
    for (let i = 0; i < 4; i++) k.box(31 - i * 3, 0.8, 31 - i * 3, TX, 62 + i * 14, TZ, steelCrown);
    /* 2026-11-23 (wave 2a): the 31st floor is a frieze of chrome hubcaps on dark brick with winged caps at the
       corners, the 61st floor carries four steel eagles (real models, Nirosta bright), and the crown is built the way
       it is: seven tiers of crossed barrel vaults, each face a semicircle ringed with triangular windows, stepping up
       and in to the needle. The old crown was seven hemispheres. */
    const capCorner = v(TX - 15, 62.5, TZ + 15);
    const eagleCorner = v(TX - 10.5, 118.2, TZ + 10.5);
    const frieze = k.flat(0x2a2a2e, 0.2, 0.6), hubcap = k.flat(0xe9edf0, 1, 0.16);
    {
      const caps: T.Matrix4[] = [], q = new T.Quaternion(), one = v(1, 1, 1);
      for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][]) {
        k.box(nz ? 30.4 : 0.3, 1.6, nz ? 0.3 : 30.4, TX + nx * 15.1, 63.6, TZ + nz * 15.1, frieze);
        q.setFromUnitVectors(v(0, 1, 0), v(nx, 0, nz));
        for (let i = -9; i <= 9; i++) caps.push(new T.Matrix4().compose(v(TX + nx * 15.28 + (nz ? i * 1.5 : 0), 63.6, TZ + nz * 15.28 + (nx ? i * 1.5 : 0)), q, one));
      }
      k.instances(new T.CylinderGeometry(0.5, 0.56, 0.16, 20), hubcap, caps);
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(2.2, 0.9, 2.2, TX + sx * 15.6, 62.9, TZ + sz * 15.6, steelCrown);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(2.4, 1.0, 2.4, TX + sx * 11.3, 118.5, TZ + sz * 11.3, steelCrown);
    /* both sets of birds are one model: the Penn Station eagle (the museum's own kit), made bright steel */
    const birds: [number, number, number, number][] = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      birds.push([TX + sx * 11.4, 119, TZ + sz * 11.4, Math.atan2(sx, sz)]);
      birds.push([TX + sx * 15.7, 63.35, TZ + sz * 15.7, Math.atan2(sx, sz)]);
    }
    glbs(k, 'chrysler/penn_eagle', { height: 3.4 }, birds, (os) => steelUp(os[0], 0xe4e8ec), 10);
    const cy = 118;
    {
      /* a flat triangular window in the face plane, its point out along the arc's radius */
      const tri = new T.ShapeGeometry(new T.Shape([new T.Vector2(-0.42, -0.7), new T.Vector2(0.42, -0.7), new T.Vector2(0, 0.8)])), rib = k.flat(0xf2f5f7, 1, 0.12);
      const skin = k.pbr('crownSteel2', X.steel(0xe2e7eb, false, 25), 0.35, { metalness: 0.72, roughness: 0.2 }), basis = new T.Matrix4();
      for (let i = 0; i < 7; i++) {
        const r = 10.3 - i * 1.32, ys = cy + i * 4.6;
        k.box(2 * r, 4.6, 2 * r, TX, ys - 2.3, TZ, skin);
        for (const turn of [0, PI / 2]) {
          const vault = k.mesh(new T.CylinderGeometry(r, r, 2 * r, 36, 1, false, 0, PI), skin, TX, ys, TZ);
          vault.rotation.set(0, turn, PI / 2);
        }
        for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][]) {
          const lx = -nz, lz = nx;   // the face's own right hand, so arcs run across it
          const ring = k.mesh(new T.TorusGeometry(r, 0.16, 6, 36, PI), rib, TX + nx * (r + 0.04), ys, TZ + nz * (r + 0.04));
          ring.rotation.y = Math.atan2(nx, nz);
          const n = 7 + Math.round(r * 0.5);
          for (let j = 0; j < n; j++) {
            const a = 0.16 + ((PI - 0.32) * j) / (n - 1), rr = r - 0.95, dir = v(Math.cos(a) * lx, Math.sin(a), Math.cos(a) * lz);
            const w = k.mesh(tri, glow, TX + nx * (r + 0.06) + dir.x * rr, ys + dir.y * rr, TZ + nz * (r + 0.06) + dir.z * rr);
            const n3 = v(nx, 0, nz);
            w.quaternion.setFromRotationMatrix(basis.makeBasis(dir.clone().cross(n3), dir, n3));
          }
        }
      }
    }
    k.point(TX, cy + 30, TZ, 0xfff0c8, 400, 120);
    /* the needle: 185 feet of it, hoisted out of the crown in ninety minutes */
    k.lathe([[1.5, 0], [1.25, 3], [0.7, 10], [0.28, 20], [0.04, 31], [0, 32]], TX, cy + 29.5, TZ, rib0(k), 12);
    // the lobby: a wedge of red marble on the ground floor, doors onto the avenue
    const LX = 15.3, LZ = -18;
    k.box(0.6, 12, 40, LX, 6, LZ, marbleRed);
    k.block(LX - 0.4, LX + 17, LZ - 20.5, LZ - 19.6);
    k.block(LX - 0.4, LX + 17, LZ + 19.6, LZ + 20.5);
    k.block(LX + 16.6, LX + 17.4, LZ - 20, LZ + 20);
    for (const z of [LZ - 20, LZ + 20]) k.box(17, 12, 0.6, LX + 8.5, 6, z, marbleRed);
    k.box(0.6, 12, 40, LX + 17, 6, LZ, marbleRed);
    // the entrance: two revolving door bays cut in the avenue wall
    for (const dz of [-6, 6]) {
      k.box(0.8, 5, 4.2, LX, 2.5, LZ + dz, glass);
      k.box(0.1, 5.2, 0.3, LX, 2.6, LZ + dz - 2.2, brass);
      k.box(0.1, 5.2, 0.3, LX, 2.6, LZ + dz + 2.2, brass);
      k.box(0.1, 0.3, 4.6, LX, 5.2, LZ + dz, brass);
    }
    k.block(LX - 0.4, LX + 0.4, LZ - 20, LZ - 8.2);
    k.block(LX - 0.4, LX + 0.4, LZ - 3.8, LZ + 3.8);
    k.block(LX - 0.4, LX + 0.4, LZ + 8.2, LZ + 20);
    k.box(18, 0.4, 41, LX + 8.5, -0.2, LZ, floorM);
    k.box(18, 0.5, 41, LX + 8.5, 12, LZ, onyx);
    /* the middle beam crossed the ceiling work; only the outer two stay, and the light */
    for (const dz of [-14, 0, 14]) { if (dz) { k.box(17, 0.3, 0.6, LX + 8.5, 11.5, LZ + dz, brass); k.box(3.6, 0.06, 0.3, LX + 8.5, 11.33, LZ + dz, glow); } k.point(LX + 8.5, 10.5, LZ + dz, 0xffe0b0, 40, 18); }
    // lotus elevator doors on the back wall, the mural framed overhead
    /* 2026-11-23: each door wears the lotus: a fan of pale inlaid wood opening upward from the sill with brass palm
       fronds over it, painted here until the Firefly marquetry plate (FIREFLY_QUEUE.md) drops in by file name */
    const lotusMat = new T.MeshStandardMaterial({ map: paintTex(256, 512, lotusDoor), roughness: 0.38, metalness: 0.15 });
    for (let i = 0; i < 4; i++) {
      const z = LZ - 12 + i * 8;
      k.rounded(2.6, 4.6, 0.12, LX + 16.6, 2.4, z, wood, 0.05);
      fireflyPlate(k, 'assets/museum/tex/chrysler/ff_lotus_door.webp', 2.5, 4.5, LX + 16.52, 2.4, z, -PI / 2, lotusMat);
      for (const s2 of [-1, 1]) { k.box(0.14, 5.2, 0.22, LX + 16.5, 2.6, z + s2 * 1.45, brass); k.box(0.1, 5.6, 0.12, LX + 16.48, 2.8, z + s2 * 1.66, brass); }
      k.box(0.14, 0.24, 3.1, LX + 16.5, 5.15, z, brass);
      /* the stepped deco overdoor */
      for (let st = 0; st < 3; st++) k.box(0.12, 0.22, 2.4 - st * 0.7, LX + 16.48, 5.45 + st * 0.22, z, st === 2 ? glow : brass);
    }
    /* ---- THE BIG UPGRADE, wave 2a (2026-11-23): the lobby built, the avenue furnished ---- */
    {
      const blackM = k.flat(0x121012, 0.1, 0.14), x0 = LX + 0.3, x1 = LX + 16.7, z0 = LZ - 19.7, z1 = LZ + 19.7;
      /* amber onyx pilasters with stepped brass capitals, placed between the works */
      const pil = (x: number, z: number, nx: number, nz: number) => {
        const w = 0.9, d = 0.36, along = nx !== 0;
        k.box(along ? d : w, 10.6, along ? w : d, x + nx * d / 2, 5.3, z + nz * d / 2, onyx);
        k.box(along ? d + 0.08 : w + 0.12, 0.32, along ? w + 0.12 : d + 0.08, x + nx * d / 2, 0.16, z + nz * d / 2, brass);
        for (let st = 0; st < 3; st++) { const ww = w + 0.15 + st * 0.22, dd = d + 0.06 + st * 0.06; k.box(along ? dd : ww, 0.24, along ? ww : dd, x + nx * dd / 2, 10.7 + st * 0.24, z + nz * dd / 2, brass); }
      };
      for (const x of [LX + 1.0, LX + 8.5, LX + 16.0]) { pil(x, z0, 0, 1); pil(x, z1, 0, -1); }
      for (const dz of [-8, 8, -18.8, 18.8]) pil(x1, LZ + dz, -1, 0);
      for (const dz of [-12, 0, 12, -18.8, 18.8]) pil(x0, LZ + dz, 1, 0);
      /* the cornice: a brass band and a black step all round, the skirting in black marble */
      for (const [x, z, w, d] of [[(x0 + x1) / 2, z0 + 0.1, x1 - x0, 0.22], [(x0 + x1) / 2, z1 - 0.1, x1 - x0, 0.22], [x0 + 0.1, LZ, 0.22, z1 - z0], [x1 - 0.1, LZ, 0.22, z1 - z0]] as [number, number, number, number][]) {
        k.box(w, 0.34, d, x, 11.25, z, brass);
        k.box(w + (d < 1 ? 0 : 0.12), 0.2, d + (d < 1 ? 0.12 : 0), x, 11.5, z, blackM);
        k.box(w, 0.28, d, x, 0.14, z, blackM);
      }
      /* the painted ceiling: a deco sunburst in ochre and umber round the ceiling work, until Firefly's mural lands */
      const ceilMat = new T.MeshStandardMaterial({ map: paintTex(512, 1232, decoCeiling), roughness: 0.82 });
      const ceil = fireflyPlate(k, 'assets/museum/tex/chrysler/ff_lobby_ceiling.webp', 16.4, 39.4, LX + 8.5, 11.72, LZ, 0, ceilMat);
      ceil.rotation.x = PI / 2;
      /* a brass border inlaid in the travertine, a metre in from the walls */
      for (const [x, z, w, d] of [[(x0 + x1) / 2, z0 + 1.1, x1 - x0 - 2.2, 0.08], [(x0 + x1) / 2, z1 - 1.1, x1 - x0 - 2.2, 0.08], [x0 + 1.1, LZ, 0.08, z1 - z0 - 2.2], [x1 - 1.1, LZ, 0.08, z1 - z0 - 2.2]] as [number, number, number, number][]) k.box(w, 0.012, d, x, 0.006, z, brass);
      /* torcheres against the pilasters (the museum's own deco floor lamp) */
      const tor: [number, number, number, number][] = [[LX + 8.5, 0, z0 + 0.75, 0], [LX + 8.5, 0, z1 - 0.75, 0], [x1 - 0.75, 0, LZ - 8, 0], [x1 - 0.75, 0, LZ + 8, 0]];
      glbs(k, 'chrysler/torchere', { height: 2.7 }, tor);
      for (const [x, , z] of tor) { k.point(x, 2.9, z, 0xffd7a0, 14, 7); k.keepOut.push({ x, z, r: 0.45 }); }
      /* one of the 61st floor eagles, brought down to eye level on a black marble plinth */
      const EX = LX + 12, EZ = LZ - 8;
      k.box(1.5, 1.2, 1.5, EX, 0.6, EZ, blackM);
      k.box(1.62, 0.1, 1.62, EX, 1.2, EZ, brass);
      k.keepOut.push({ x: EX, z: EZ, r: 1.2 });
      glbs(k, 'chrysler/penn_eagle', { height: 2.3 }, [[EX, 1.25, EZ, -PI / 2]], (os) => steelUp(os[0], 0xe8ecf0, 0.95, 0.16));
      hsign(k, 'THE EAGLE  .  61ST FLOOR  .  NIROSTA STEEL', 1.3, 0.16, EX - 0.76, 0.86, EZ, -PI / 2, { fg: '#d9b86a', font: 'W2 JetBrains Mono' });
      k.spot(EX - 3, 7, EZ, EX, 1.8, EZ, 0xfff0d8, 60, 0.35, 0.6, 14);
      /* the trick: LOOK UP inlaid in the floor, flat and stretched, standing up as a sign from the brass star by the door */
      const look = paintTex(1024, 330, (g, w, h) => {
        const s0 = fit(g, 'LOOK UP', 'W2 Archivo Expanded', h * 0.78, w * 0.9, '800');
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.lineWidth = s0 * 0.06; g.strokeStyle = '#3a2410'; g.strokeText('LOOK UP', w / 2, h / 2);
        const gr = g.createLinearGradient(0, h * 0.2, 0, h * 0.8); gr.addColorStop(0, '#f6dc94'); gr.addColorStop(0.5, '#c9973e'); gr.addColorStop(1, '#8a5f22');
        g.fillStyle = gr; g.fillText('LOOK UP', w / 2, h / 2);
      }, ['W2 Archivo Expanded']);
      anamorphTex(k, look, LX + 1.6, LZ, 3, 0, -PI / 2, 7, 6, 1.5, 0.95);
      k.mesh(new T.RingGeometry(0.18, 0.3, 8), brass, LX + 1.6, 0.012, LZ).rotation.x = -PI / 2;
      k.egg(v(LX + 10, 0.4, LZ), { id: 'chrysler-anamorph', title: 'Letters that stand up', year: '1533', text: 'From the brass star just inside the doors the letters in the floor stand upright and tell you where to look. It is anamorphosis, a picture stretched so it only comes right from one spot; the most famous is the long skull across the foot of Hans Holbein the Younger\'s The Ambassadors, painted in 1533.', clue: 'Stand on the brass star inside the doors and read the floor.', source: { name: 'The Ambassadors (Holbein), Wikipedia', url: 'https://en.wikipedia.org/wiki/The_Ambassadors_(Holbein)' } }, { r: 1.6 });
      /* the avenue doors: black granite portals with the triangular deco heads, the name in brass over them */
      for (const dz of [-6, 6]) {
        const zc = LZ + dz;
        for (const s2 of [-1, 1]) { k.box(0.5, 7.0, 0.7, LX - 0.5, 3.5, zc + s2 * 2.75, blackM); k.box(0.3, 7.6, 0.45, LX - 0.65, 3.8, zc + s2 * 3.25, blackM); }
        const tri = new T.Shape(); tri.moveTo(-3.5, 0); tri.lineTo(3.5, 0); tri.lineTo(0, 4.4); tri.closePath();
        const hole = new T.Path(); hole.moveTo(-2.6, 0.35); hole.lineTo(2.6, 0.35); hole.lineTo(0, 3.6); hole.closePath(); tri.holes.push(hole);
        const head = k.mesh(new T.ExtrudeGeometry(tri, { depth: 0.4, bevelEnabled: false }), blackM, LX - 0.55, 5.1, zc);
        head.rotation.y = -PI / 2;
        const pane = new T.Shape(); pane.moveTo(-2.6, 0.35); pane.lineTo(2.6, 0.35); pane.lineTo(0, 3.6); pane.closePath();
        const g2 = k.mesh(new T.ShapeGeometry(pane), k.glow(0xffe2a8, 0.85), LX - 0.36, 5.1, zc);
        g2.rotation.y = -PI / 2;
        for (let r = 0; r < 7; r++) { const a = 0.35 + (r / 6) * (PI - 0.7); k.beam(v(LX - 0.4, 5.45, zc), v(LX - 0.4, 5.45 + Math.sin(a) * 3.0, zc + Math.cos(a) * 2.6), 0.035, brass, 4); }
        k.box(0.2, 0.3, 7.2, LX - 0.5, 5.0, zc, brass);
      }
      hsign(k, 'CHRYSLER BUILDING', 9, 0.95, LX - 0.62, 10.7, LZ, -PI / 2, { fg: '#e4c27a', bg: '#141012', font: 'W2 Archivo Expanded', size: 0.66 });
      hsign(k, '405 LEXINGTON AVENUE', 4.6, 0.36, LX - 0.62, 9.9, LZ, -PI / 2, { fg: '#c9a55a', font: 'W2 JetBrains Mono' });
      /* the avenue: cabs and cars (cast by the kit as real models), a newsstand, the corner sign */
      for (const [x, z, paint, r] of [[8.7, -30, 0xf3b81c, PI], [8.7, -44, 0x1d1f22, PI], [3.2, -16, 0xf3b81c, PI], [-3.2, -40, 0xf3b81c, 0], [-3.2, -58, 0x8a1c1c, 0], [8.7, -58, 0xf3b81c, PI]] as [number, number, number, number][]) {
        carBox(k, x, z, r, paint);
        k.keepOut.push({ x, z: z - 1.4, r: 1.0 }, { x, z: z + 1.4, r: 1.0 }, { x, z, r: 1.0 });
      }
      glbs(k, 'chrysler/penn_newsstand', { height: 2.6 }, [[-12.7, 0.14, -32, PI / 2]]);
      k.keepOut.push({ x: -12.7, z: -32, r: 1.3 });
      hsign(k, 'NEWS  .  PAPERS  .  MAGAZINES', 2.2, 0.3, -11.6, 2.95, -32, PI / 2, { fg: '#f2e6c8', bg: '#7a1c1c', font: 'W2 Archivo Narrow' });
      streetSign(k, -10.5, 31, 'LEXINGTON AV', 'E 42 ST', PI / 2);
    }
    /* landmark eggs, every fact from the Chrysler Building article on Wikipedia */
    const CSRC = { name: 'Chrysler Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/Chrysler_Building' };
    k.egg(v(TX, cy + 56, TZ), { id: 'chrysler-spire', title: 'The needle in the attic', year: '1929', text: 'Van Alen had the spire built in secret inside the building\'s frame and delivered in four sections. On 23 October 1929 the bottom section was hoisted and lowered into the 66th floor, and within 90 minutes the rest was raised and riveted in place. It pushed the tower past every rival, and it stayed the tallest building in the world for 11 months, until the Empire State Building opened.', clue: 'Look all the way up, to the needle on top of the crown.', source: CSRC }, { r: 9 });
    k.egg(eagleCorner, { id: 'chrysler-eagles', title: 'Eagles at the 61st floor', text: 'The steel birds leaning out from the corners at the foot of the crown are eagles, on the 61st floor, a nod to the national bird. About fifty metal ornaments project from the corners on five floors of the tower.', clue: 'Find the four steel birds at the corners where the crown begins.', source: CSRC }, { r: 5 });
    k.egg(capCorner, { id: 'chrysler-hubcaps', title: 'A car company\'s gargoyles', text: 'The 31st floor setback carries replicas of the 1929 Chrysler radiator caps, a frieze of hubcaps and fenders, and bonnet ornaments shaped like Mercury\'s winged helmet. The building was an advertisement for the cars, and the first two floors once held the Chrysler Salon showroom.', clue: 'Look at the corners of the first big setback above the street.', source: CSRC }, { r: 5 });
    k.egg(v(TX, cy + 14, TZ), { id: 'chrysler-crownlight', title: '580 tubes in the triangles', year: '1981', text: 'The crown is seven radiating terraced arches clad in Nirosta stainless steel, 18 percent chromium and 8 percent nickel. The lights in its triangular windows, 580 fluorescent tubes, were first switched on in September 1981, half a century after the building opened.', clue: 'Watch the lit triangles in the arches of the crown.', source: CSRC }, { r: 12 });
    k.egg(v(LX + 3.2, 11.2, LZ + 17.5), { id: 'chrysler-mural', title: 'The ceiling they covered up', text: 'Edward Trumbull\'s ceiling mural, Transport and Human Endeavor, measures 110 by 67 feet. It was covered up during a renovation in the late 1970s and only restored later, under Tishman Speyer. The lobby and the facade became city landmarks in September 1978.', clue: 'Stand in the lobby and look up at the corner of the painted ceiling.', source: CSRC }, { r: 1.4 });
    k.egg(v(LX + 16.3, 2.4, LZ + 4), { id: 'chrysler-lotus', title: 'Thirty two lotus doors', text: 'The building runs 32 elevators in four banks, 28 of them for passengers. Their doors are cut in a lotus pattern of steel and wood, which from outside the cars look like tall fans set off by metallic palm fronds.', clue: 'Walk to the elevator doors on the back wall of the lobby.', source: CSRC }, { r: 1.4 });
    k.sign('LEXINGTON AVENUE  ·  1930', 6, 0.5, LX + 16.6, 7.4, LZ, '#4a1e1e', '#e8cfa0', 80, -PI / 2, { border: true });
    k.censusWall({ x: LX + 16.62, y: 9.3, z: LZ, rotY: -PI / 2, cols: 30, rows: 3, tile: 0.55, gap: 0.05, start: ctx.wallStart(6600, 90), pieces: ctx.all, backing: onyx });
    // the works: deco black frames on the marble, the mural on the ceiling, display cases outside
    const mounts: Mount[] = [];
    for (let i = 0; i < 6; i++) {
      const z = LZ - 15 + i * 6;
      mounts.push({ position: v(LX + 0.32, 3.4, z), rotation: PI / 2, target: v(LX + 5, 3, z), width: 4.6, height: 2.7, style: 'black' });
    }
    for (const z of [LZ - 19.68, LZ + 19.68]) for (const x of [LX + 4.5, LX + 12.5]) mounts.push({ position: v(x, 3.4, z), rotation: z < LZ ? 0 : PI, target: v(x, 3, z < LZ ? z + 5 : z - 5), width: 4.6, height: 2.7, style: 'black' });
    for (let i = 0; i < 3; i++) mounts.push({ position: v(LX + 16.66, 3.4, LZ - 16 + i * 16), rotation: -PI / 2, target: v(LX + 11, 3, LZ - 16 + i * 16), width: 4.6, height: 2.7, style: 'black' });
    mounts.push({ position: v(LX + 8.5, 11.55, LZ), rotation: 0, tilt: PI / 2, target: v(LX + 8.5, 3, LZ + 6), lookAt: v(LX + 8.5, 11.6, LZ), width: 15, height: 8.4, style: 'gilt', wash: false });
    for (let i = 0; i < 4; i++) {
      const z = 20 - i * 10;
      k.box(3, 4.4, 0.6, -11.9, 2.2, z, dark);
      mounts.push({ position: v(-11.55, 2.7, z), rotation: PI / 2, target: v(-7, 3, z), width: 2.6, height: 3.2, style: 'neon', wash: false });
    }
    for (let i = 0; i < 4; i++) {
      const z = LZ + 26 + i * 8;
      k.box(0.6, 4.4, 4.2, 14.9, 2.2, z, marbleRed);
      mounts.push({ position: v(14.55, 2.7, z), rotation: -PI / 2, target: v(9, 3, z), width: 3.6, height: 2.6, style: 'black' });
    }
    return { mounts, spawn: v(-6, 3, 26), look: v(TX, 60, TZ), eye: 3, bounds: [-12.2, LX + 16.6, -60, 32], style: 'black' };
  },
};

/* ---------------- 23 THE FLATIRON ---------------- */
export const flatiron: RoomDef = {
  id: 'flatiron',
  name: 'The prow',
  area: 'THE FLATIRON',
  mood: 'Noon on the wedge',
  color: '#c9b79a',
  description: 'The triangular building at the split of two avenues, a plaza of chairs at its point, a wedge shaped gallery inside the prow.',
  signatures: 'The triangular plan with its rounded point, limestone and terracotta tiers of bay windows, the pedestrian plaza with green chairs, the cast iron street clock, the park across the way.',
  build(k, ctx) {
    k.sky({ top: 0x6f9fd4, horizon: 0xe4ebee, ground: 0x6d6a62, fog: 0.0024, sun: { az: 3.2, el: 1.1, color: 0xfff6e8, size: 12 }, env: 0.95 });
    k.hemi(0xf1f6ff, 0x4a4a42, 0.9);
    k.sun(0xfff4e6, 2.6, 20, 70, -10, true, 90);
    /* 2026-11-23: the limestone, the plaza, the gallery's floor and walls are Poly Haven scans (CC0) at real size */
    const lime = scan(k, 'flatiron', 'white_sandstone_blocks_02', 2, () => X.ashlar(0xc8bda6, 12, 3), { color: 0xe6dccb }),
      terra = k.pbr('flatTerra', X.windows(28, 0.15, 0xb59f82, true), 0.11, { emissive: 0xffffff, emissiveIntensity: 0.45, roughness: 0.65, stretch: 0.42 }),
      plaza = scan(k, 'flatiron', 'gravel_embedded_concrete', 2, () => X.pavers(0x9a968c, 13), { color: 0xc4beb2 }),
      green = k.flat(0x3f6b3a, 0, 0.7),
      iron = k.flat(0x1f242a, 0.7, 0.45),
      oak = scan(k, 'flatiron', 'wood_floor', 1.7, () => X.planks(0x8a6a48, 8, 28), { color: 0xb49c86, roughness: 0.5 }),
      /* the gallery's walls stay gallery white: the plaster scan read olive under these lights */
      plaster = k.pbr('prowPlaster', X.plaster(0xe8e2d4, 16), 0.4),
      glass = k.glass(0xd7ecf3, 0.14, 0.06),
      lawn = k.pbr('lawnF', X.grass(0x4c7a3a, 7), 0.15),
      opal = k.glow(0xfff1d6);
    /* two avenues meeting: the prow points north (+z here) at Madison Square, so east is -x.
       2026-10-09 truth pass: Fifth Avenue runs straight up the west side (+x) and Broadway comes
       in on the diagonal from the east (-x); they were the other way round. */
    scanStreet(k, 'flatiron', { w: 16, len: 140, z: -30, x: 22 });
    const s2 = k.mesh(new T.BoxGeometry(16, 0.3, 140), scan(k, 'flatiron', 'asphalt_02', 3, () => X.asphalt(0x24282d), { color: 0x9a9a9a, roughness: 0.9 }), -22, -0.15, -30);
    s2.rotation.y = -0.2;
    k.box(70, 0.28, 30, 0, 0.0, 12, plaza);
    // the building: a triangular prism twenty floors high, rounded at the prow
    const H = 62, L = 60;
    const tri = new T.Shape();
    tri.moveTo(0, 0);
    tri.lineTo(-13, L);
    tri.lineTo(13, L);
    tri.closePath();
    const body = k.mesh(new T.ExtrudeGeometry(tri, { depth: H, bevelEnabled: false }), terra, 0, 0, -6);
    body.rotation.x = -PI / 2;
    k.cyl(2.2, H, 0, H / 2, -6.2, terra, 2.2, 24);
    /* The building footprint used to be blocked as one solid rectangle, which
       also sealed the wedge gallery inside it: seventeen of this room's twenty
       three works sat behind a wall the visitor could not pass, so they could
       never be stood in front of. Block the limestone either side of the two
       converging walls instead, in slabs, since blocks are axis aligned and the
       gallery is a triangle. halfAt is the inside face of the wall at a given z. */
    for (const y of [0, 12, 24, 36, 48]) {
      const band = k.mesh(new T.ExtrudeGeometry(tri, { depth: 0.6, bevelEnabled: false }), lime, 0, y + 11.4, -6);
      band.rotation.x = -PI / 2;
      band.scale.set(1.02, 1.02, 1);
    }
    const top = k.mesh(new T.ExtrudeGeometry(tri, { depth: 2.2, bevelEnabled: false }), lime, 0, H, -6);
    top.rotation.x = -PI / 2;
    top.scale.set(1.06, 1.06, 1);
    // the plaza: chairs, planters, the street clock, the park across Fifth
    const rnd = X.mulberry(23);
    /* 2026-10-28: the box chairs are the stand in for a real folding cafe chair, one chair from Poly Haven's Outdoor
       Table Chair Set 01 (James Ray Cock, CC0), its wood painted the plaza's green, one instanced draw for all 26; same
       places, same random turns. (Green Chair 01, the audit's pick, is a gothic upholstered armchair: wrong for a
       plaza, and it read black.) A failed load keeps the boxes. */
    const chairMark = k.objects.length, chairAt: [number, number, number][] = [];
    for (let i = 0; i < 26; i++) {
      const x = (rnd() - 0.5) * 30, z = 4 + rnd() * 18;
      const seat = k.box(0.5, 0.05, 0.5, x, 0.55, z, green);
      k.box(0.5, 0.6, 0.05, x, 0.85, z - 0.25, green);
      for (const dx of [-0.2, 0.2]) for (const dz of [-0.2, 0.2]) k.box(0.04, 0.55, 0.04, x + dx, 0.27, z + dz, iron);
      seat.rotation.y = rnd() * PI;
      chairAt.push([x, z, seat.rotation.y]);
      k.keepOut.push({ x, z, r: 0.5 });
    }
    {
      const old = standIn(k, chairMark);
      void hero(k, 'ph_folding_chair_01', { height: 0.88 }).then((h) => {
        if (!h) return;
        hide(old);
        h.traverse((c) => { if (c instanceof T.Mesh) for (const m of [c.material].flat() as T.MeshStandardMaterial[]) { m.color.setHex(0x8cc27a); m.metalness = 0; m.metalnessMap = null; m.needsUpdate = true; } });
        const ins = heroInstances(k, h, chairAt.length), m = new T.Matrix4(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0), one = new T.Vector3(1, 1, 1);
        chairAt.forEach(([x, z, r], i) => ins.setAt(i, m.compose(new T.Vector3(x, 0, z), q.setFromAxisAngle(up, r), one)));
        ins.commit();
      });
    }
    for (const x of [-16, 16]) { k.box(3, 0.8, 8, x, 0.4, 14, lime); k.tree(x, 0.8, 14, { kind: 'round', h: 3.2, r: 1.8, leaf: 0x4f7f3c, seed: x }); }
    /* the 1909 Fifth Avenue Building clock stands on the Fifth Avenue (west, +x) side */
    const CLX = 12, CLZ = 22;
    k.lathe([[0.5, 0], [0.5, 0.3], [0.2, 0.5], [0.16, 5.2], [0.4, 5.5], [0.4, 5.8]], CLX, 0, CLZ, iron, 16);
    /* 2026-11-23: the code faces are the stand in for a real four faced post clock head (the museum's own kit) */
    const clockMark = k.objects.length;
    for (const s of [-1, 1]) { const face = k.mesh(new T.CircleGeometry(0.9, 36), opal, CLX, 7, CLZ + s * 0.16); face.rotation.y = s > 0 ? 0 : PI; }
    k.torus(0.9, 0.08, CLX, 7, CLZ, iron, 36);
    {
      const old = standIn(k, clockMark);
      glbs(k, 'flatiron/moynihan_clock', { height: 2.6 }, [[CLX, 5.55, CLZ, 0]], () => hide(old));
    }
    k.keepOut.push({ x: CLX, z: CLZ, r: 0.8 });
    /* the Worth Monument: a 51 foot granite obelisk north of the building, where the avenues cross */
    const graniteW = scan(k, 'flatiron', 'granite_wall', 1.9, () => X.ashlar(0x9a958c, 46, 2), { color: 0xc8c4bc });
    k.box(2.4, 1.2, 2.4, 0, 0.6, 40, graniteW);
    k.box(1.7, 1.6, 1.7, 0, 2.0, 40, graniteW);
    k.lathe([[0.7, 0], [0.42, 8.2], [0.0, 9.0]], 0, 2.8, 40, graniteW, 4);
    k.rail(0, 40, 4.2, iron, 0.9, 'x', 1.2);
    k.box(120, 0.4, 60, 0, -0.2, 60, lawn);
    for (let i = 0; i < 24; i++) k.tree((rnd() - 0.5) * 100, -0.1, 36 + rnd() * 40, { kind: 'round', h: 5 + rnd() * 3, r: 3 + rnd() * 2, leaf: 0x3f6b36, seed: 100 + i });
    blockFront(k, { x: -36, z0: 20, count: 10, face: 1, seed: 43, h: [16, 30] });
    blockFront(k, { x: 36, z0: 20, count: 10, face: -1, seed: 44, h: [16, 30] });
    k.skyline({ z: -160, count: 30, spacing: 7, scale: 2.2, base: -2, seed: 45, lit: 0.15, glow: 0.3, tint: 0x7a7e86 });
    // inside the prow: a wedge gallery with the point glazed
    const halfAt = (z: number) => Math.max(0.6, -0.775 - 0.2132 * z);
    for (let z = -64; z < -12; z += 4) {
      const h = halfAt(z + 4);   // the narrow end of the slab, so the corridor is never wider than the room
      k.block(h, 14, z, z + 4);
      k.block(-14, -h, z, z + 4);
    }
    /* The point is where you come in, so it is a vestibule rather than a pinch:
       the limestone either side stops at 2.6 and the doorway between them is the
       full width of the nose. */
    k.block(2.6, 14, -12, -5.6);
    k.block(-14, -2.6, -12, -5.6);

    const wedge = new T.Shape();
    wedge.moveTo(0, 2.6);
    wedge.lineTo(-11.6, L - 1);
    wedge.lineTo(11.6, L - 1);
    wedge.closePath();
    const room = k.mesh(new T.ExtrudeGeometry(wedge, { depth: 0.4, bevelEnabled: false }), oak, 0, 0.0, -6);
    room.rotation.x = -PI / 2;
    const ceil = k.mesh(new T.ExtrudeGeometry(wedge, { depth: 0.4, bevelEnabled: false }), plaster, 0, 11.2, -6);
    ceil.rotation.x = -PI / 2;
    k.box(0.4, 11, 6, 0, 5.5, -9, glass);
    k.box(0.5, 11, L - 8, -6.9, 5.5, -36, plaster).rotation.y = 0.21;
    k.box(0.5, 11, L - 8, 6.9, 5.5, -36, plaster).rotation.y = -0.21;
    k.box(24, 11, 0.6, 0, 5.5, -65, plaster);
    for (const z of [-20, -34, -48]) { k.point(0, 9.5, z, 0xfff3e0, 34, 18); }
    /* The way in. There was no door here and nothing on the plaza to say the
       building holds fourteen works, so the prow read as scenery and the whole
       gallery went unvisited. A lit threshold, a canopy, a sign and a pair of
       ropes leading to it. */
    for (const sx of [-1, 1]) {
      k.box(0.5, 4.2, 0.5, sx * 2.35, 2.1, -6.2, lime);          // jambs
      k.prop('rope_stanchion', sx * 2.9, 0, -1.6, { height: 1.0, keepOut: 0.4 });
      k.prop('rope_stanchion', sx * 2.9, 0, 2.2, { height: 1.0, keepOut: 0.4 });
    }
    k.box(5.6, 0.7, 0.6, 0, 4.5, -6.2, lime);                    // lintel
    k.box(4.4, 4.0, 0.12, 0, 2.0, -6.3, k.glass(0x1b2228, 0.5, 0.08));  // the doors themselves
    for (const sx of [-1, 1]) k.box(0.1, 3.6, 0.06, sx * 0.16, 1.9, -6.22, iron);  // door stiles, so it reads as a way in
    k.box(6.4, 0.22, 3.2, 0, 4.7, -4.7, lime);                   // canopy over the door
    for (const sx of [-1, 1]) k.beam(v(sx * 2.9, 4.6, -3.2), v(sx * 2.6, 6.0, -6.0), 0.05, iron, 4);
    k.box(4.6, 0.06, 2.6, 0, 0.04, -4.4, k.flat(0x2a2a2c, 0.2, 0.9));   // threshold mat
    k.point(0, 3.4, -5.4, 0xffe6c0, 26, 12);                     // light spilling out of the point
    k.point(0, 4.2, -1.0, 0xfff0d8, 14, 9);
    /* The lettering goes on the canopy fascia, where someone walking up to the
       building actually looks. Above the canopy it was hidden by the canopy. */
    k.box(6.4, 0.86, 0.12, 0, 4.32, -3.16, lime);
    k.sign('THE PROW GALLERY', 5.4, 0.42, 0, 4.46, -3.08, 'transparent', '#f0e6d2', 62, 0);
    k.sign('FOURTEEN NEW YORKERS INSIDE  ·  FREE  ·  WALK IN', 5.8, 0.24, 0, 4.08, -3.08, 'transparent', '#c9b79a', 44, 0);
    /* And a board out on the plaza, turned at the visitor as they arrive. */
    const board = k.box(2.2, 2.6, 0.14, -4.6, 1.3, 6.0, lime); board.rotation.y = 0.5;
    k.sign('ART INSIDE', 1.8, 0.4, -4.53, 1.95, 6.06, 'transparent', '#1c1c1e', 56, 0.5);
    k.sign('THE PROW GALLERY', 1.9, 0.22, -4.53, 1.5, 6.06, 'transparent', '#4a4a4c', 44, 0.5);
    k.sign('FOURTEEN WORKS', 1.9, 0.2, -4.53, 1.16, 6.06, 'transparent', '#4a4a4c', 40, 0.5);
    // the works: the two long converging walls, the wide end, plaza screens outside
    const mounts: Mount[] = [];
    /* The two long walls are boxes at x = +/- 6.9, centred z = -36 and turned
       0.21 radians, so their inside face at a depth z is this. The old code
       guessed the half width from a fraction of L and put every one of the
       fourteen wedge works between two and three units outside the wall it was
       supposed to hang on, buried in the terracotta. */
    for (let i = 0; i < 7; i++) {
      const z = -10 - i * 7.4;
      const half = halfAt(z);
      for (const s of [-1, 1]) mounts.push({ position: v(s * (half - 0.3), 3.4, z), rotation: s < 0 ? PI / 2 + 0.21 : -PI / 2 - 0.21, target: v(s * Math.max(0.35, half * 0.4), 3, z), width: Math.min(4.4, half * 1.6), height: 2.6, style: 'white' });
    }
    for (const x of [-7, 0, 7]) mounts.push({ position: v(x, 3.4, -64.68), rotation: 0, target: v(x, 3, -58), width: 4.6, height: 2.7, style: 'white' });
    for (let i = 0; i < 6; i++) {
      const x = -15 + i * 6, z = 28;
      k.box(4.6, 4.2, 0.4, x, 2.1, z, lime);
      mounts.push({ position: v(x, 2.6, z - 0.22), rotation: PI, target: v(x, 3, z - 5), width: 4.2, height: 2.5, style: 'steel', wash: false });
    }
    /* ---- THE BIG UPGRADE, wave 2a (2026-11-23) ---- */
    {
      /* oriel bays: five a side between the 5th and 16th floors, the shallow bowed windows that ripple the long walls */
      const len = Math.hypot(13, 60), dx = 13 / len, dz = -60 / len;
      for (const s3 of [-1, 1]) {
        /* the side runs (s3 dx, dz) from the point; its outward normal is (s3 * -dz, dx) */
        const rot = Math.atan2(-dz, s3 * dx), nx = s3 * -dz, nz = dx;
        const at = (t: number, off: number): [number, number] => [s3 * 13 * t + nx * off, -6 - 60 * t + nz * off];
        for (const t of [0.3, 0.44, 0.58, 0.72, 0.86]) {
          const [bx, bz] = at(t, 0.45);
          k.box(3.0, 34, 0.9, bx, 31, bz, terra).rotation.y = rot;
          k.box(3.3, 0.5, 1.1, bx, 48.2, bz, lime).rotation.y = rot;
          k.box(3.3, 0.7, 1.1, bx, 13.8, bz, lime).rotation.y = rot;
        }
        /* a heavy cornice the length of each side, and a balustrade band two floors down */
        const [cx, cz] = at(0.5, 0.6), [bx2, bz2] = at(0.5, 0.25);
        k.box(len * 0.98, 1.4, 1.6, cx, H - 0.2, cz, lime).rotation.y = rot;
        k.box(len * 0.98, 0.5, 0.7, bx2, H - 7.2, bz2, lime).rotation.y = rot;
      }
      /* inside the prow: a beamed ceiling with schoolhouse pendants, an oak skirting and a picture rail */
      const beamM = k.flat(0xe9e4da, 0, 0.8), skirt = k.flat(0x3a2a1e, 0, 0.6), cord = k.flat(0x1c1c1c, 0.4, 0.5), globe = k.glow(0xfff1d8);
      for (let z = -14; z > -62; z -= 4) {
        const half = halfAt(z) + 0.4;
        k.box(half * 2, 0.45, 0.4, 0, 10.98, z, beamM);
        if (z % 8 === 2 || z === -14) for (const px of [-half * 0.35, half * 0.35]) { k.box(0.02, 1.0, 0.02, px, 10.3, z + 2, cord); k.sphere(0.22, px, 9.7, z + 2, globe, 12); }
      }
      for (const s3 of [-1, 1]) {
        const ry = -s3 * 0.21, lx = Math.cos(ry), lz = -Math.sin(ry);
        for (const [y, hgt, dep] of [[0.13, 0.26, 0.06], [5.6, 0.08, 0.05]] as [number, number, number][]) {
          const b = k.box(dep, hgt, L - 8, s3 * 6.9 - s3 * 0.28 * lx, y, -36 - s3 * 0.28 * lz, skirt); b.rotation.y = ry;
        }
      }
      /* the plaza: wooden planters with box hedges at the edges, a coffee cart, the corner signs */
      glbs(k, 'flatiron/ph_planter_box_01', { width: 2.6 }, [[-22, 0.14, 6, 0], [22, 0.14, 6, 0], [-26, 0.14, 16, PI / 2], [26, 0.14, 16, PI / 2]]);
      for (const [x, z] of [[-22, 6], [22, 6], [-26, 16], [26, 16]]) { k.tree(x, 1.2, z, { kind: 'round', h: 1.6, r: 0.9, leaf: 0x3d6a32, seed: x * 3 + z }); k.keepOut.push({ x, z, r: 1.4 }); }
      glbs(k, 'flatiron/nyb_coffeecart', { width: 2.2 }, [[-11, 0.14, 15, 0.5]]);
      k.keepOut.push({ x: -11, z: 15, r: 1.4 });
      streetSign(k, 13.6, 27, '5 AV', 'E 23 ST', 0);
      streetSign(k, -13.6, 27, 'BROADWAY', 'E 23 ST', 0);
      hsign(k, 'FLATIRON PLAZA', 3.2, 0.42, -4.53, 2.38, 6.06, 0.5, { fg: '#f2ede2', bg: '#1d4a32', font: 'W2 Archivo Expanded', size: 0.5 });
      /* traffic on both avenues, cast by the kit as real cabs and cars */
      for (const [x, z, paint, r] of [[18, -20, 0xf3b81c, 0], [26, -36, 0xf3b81c, 0], [18, -54, 0x2a3440, 0], [26, 6, 0xb8b8b4, 0], [-24, -20.2, 0xf3b81c, -0.2], [-27.6, -2, 0x1d1f22, -0.2], [-20.4, -44, 0xf3b81c, -0.2]] as [number, number, number, number][]) {
        carBox(k, x, z, r, paint);
        k.keepOut.push({ x, z: z - 1.4, r: 1.0 }, { x, z: z + 1.4, r: 1.0 }, { x, z, r: 1.0 });
      }
      /* the trick: 23 SKIDOO painted flat on the plaza, standing up as a board from where you arrive */
      const sk = paintTex(1024, 360, (g, w, h) => {
        fit(g, '23 SKIDOO', 'W2 Archivo Expanded', h * 0.8, w * 0.92, '800');
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = '#2f6b45'; g.fillText('23 SKIDOO', w / 2 + 8, h / 2 + 8);
        g.fillStyle = '#f3efe4'; g.fillText('23 SKIDOO', w / 2, h / 2);
      }, ['W2 Archivo Expanded']);
      anamorphTex(k, sk, 0, 22, 3, 0.14, 0, 8, 6.4, 1.6, 0.9);
      k.egg(v(0, 0.5, 11), { id: 'flatiron-anamorph', title: 'Paint that stands up', text: 'From where you arrive, the letters painted flat across the plaza stand upright like a board. Walk to one side and they collapse into long smears. Street painters call it 3D pavement art; the trick is anamorphosis, a picture stretched so it only comes right from one point, used since the Renaissance.', clue: 'Look back at the plaza paint from where you came in.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.6 });
    }
    const FSRC = { name: 'Flatiron Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/Flatiron_Building' };
    k.egg(v(0, 34, -5.5), { id: 'flatiron-tip', title: 'Six feet wide at the point', text: 'At its vertex the triangular tower is only about 6 feet wide, and the Broadway and Fifth Avenue walls meet at an angle of about 25 degrees. The steel frame was designed to stand four times the strongest wind the area was expected to see.', clue: 'Look up the rounded point of the building from the plaza.', source: FSRC }, { r: 3 });
    k.egg(v(0, 4.9, -3.6), { id: 'flatiron-cowcatcher', title: 'The cowcatcher', year: '1902', text: 'The one storey shop wrapped round the prow was 25 feet long and 13 feet tall, and New Yorkers called it the cowcatcher. United Cigar Stores leased it first, and Walgreens took it over in 1927.', clue: 'Stand under the canopy at the point of the building.', source: FSRC }, { r: 1.4 });
    k.egg(v(-6, 1.2, 12), { id: 'flatiron-skidoo', title: '23 skidoo', text: 'The wedge made famous winds at its point on 23rd Street. They raised women\'s skirts and scattered paper bills from pedestrians\' pocketbooks, and according to some accounts they gave New York the phrase 23 skidoo.', clue: 'Find the chairs on the plaza at the point, where the wind comes round.', source: FSRC }, { r: 1.6 });
    k.egg(v(0, H + 1, -30), { id: 'flatiron-folly', title: 'Burnham\'s Folly', year: '1905', text: 'The tower opened on 1 October 1902 as the Fuller Building, named for the builder George A. Fuller; only locals called it the Flatiron, and early on it was mocked as Burnham\'s Folly. It went up 20 storeys, 285 feet, and a penthouse that was never in the plans was filed in March 1905 for $10,000, bringing it to 22 storeys and 307 feet.', clue: 'Look at the very top of the building, above the cornice.', source: FSRC }, { r: 6 });
    k.egg(v(CLX, 7, CLZ), { id: 'flatiron-clock', title: 'The Fifth Avenue Building clock', year: '1909', text: 'The ornate cast iron street clock outside 200 Fifth Avenue was built by Hecla Iron Works in 1909 and still carries the building\'s original name, the Fifth Avenue Building. The clock itself became a designated New York City landmark in 1981.', clue: 'Find the iron street clock on the Fifth Avenue side of the plaza.', source: { name: 'Fifth Avenue Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/Fifth_Avenue_Building' } }, { r: 1.4 });
    k.egg(v(0, 6, 40), { id: 'flatiron-worth', title: 'A grave in the middle of Broadway', year: '1857', text: 'The 51 foot granite obelisk north of the Flatiron is the Worth Monument, and General William Jenkins Worth is buried under it, which may make him the only person of note buried in the middle of Broadway. His remains were escorted here on 25 November 1857, and the monument is the second oldest major monument in a New York City park.', clue: 'Look past the plaza for the obelisk where the avenues cross.', source: { name: 'Worth Monument, Flatiron NoMad Partnership', url: 'https://flatironnomad.nyc/history/worth-monument/' } }, { r: 3 });
    return { mounts, spawn: v(0, 3, 22), look: v(0, 4.2, -6), eye: 3, bounds: [-30, 30, -64, 30], style: 'white' };
  },
};

/* ---------------- 24 THE BLEACHERS ---------------- */
export const bleachers: RoomDef = {
  id: 'bleachers',
  name: 'Bottom of the ninth',
  area: 'THE BRONX BALLPARK',
  mood: 'Night game',
  color: '#9fb4d6',
  description: 'A ballpark bowl under the lights, the census hung along the outfield wall, the scoreboard running the lineup.',
  signatures: 'The white steel frieze around the upper deck, the limestone gate arches, the diamond and warning track, the outfield wall, the light towers, the bleachers.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x070a16, horizon: 0x1a2340, ground: 0x0a0d14, fog: 0.004, stars: 700, env: 0.45 });
    k.hemi(0xcfd8ff, 0x1c2a1a, 0.55);
    k.sun(0xffffff, 1.6, 40, 80, 40, true, 120);
    const grass = k.pbr('outfield', X.grass(0x2f6b34, 9), 0.2, { roughness: 0.95 }),
      grass2 = k.pbr('outfield2', X.grass(0x2a5f2f, 10), 0.2, { roughness: 0.95 }),
      dirt = k.pbr('infield', X.concrete(0x8a5a3c, 11), 0.3, { roughness: 1 }),
      lime = k.pbr('gateLime', X.ashlar(0xcfc6b0, 14, 3), 0.2),
      steelW = k.flat(0xe6e8e4, 0.6, 0.4),
      seat = k.flat(0x1a3f7a, 0.1, 0.7),
      seat2 = k.flat(0x2a5aa0, 0.1, 0.7),
      concrete = k.pbr('bowlConc', X.concrete(0x8c8c86, 12), 0.3),
      wall = k.pbr('outfieldWall', X.plaster(0x1f3f7a, 17), 0.5, { roughness: 0.8 }),
      dark = k.flat(0x14161a, 0.5, 0.6),
      glow = k.glow(0xfff6e0);
    // the field: home plate at the origin, the outfield wall an arc to the north
    k.box(220, 0.4, 220, 0, -0.2, -60, grass2);
    for (let i = 0; i < 14; i++) k.box(160, 0.02, 4, 0, 0.01, -14 - i * 8, i % 2 ? grass : grass2);
    const dia = k.mesh(new T.CylinderGeometry(19, 19, 0.06, 4), dirt, 0, 0.03, -19);
    dia.rotation.y = PI / 4;
    k.mesh(new T.RingGeometry(7, 9.5, 48, 1, 0, PI), dirt, 0, 0.04, -19).rotation.x = -PI / 2;
    k.mesh(new T.CircleGeometry(2.6, 24), dirt, 0, 0.05, -19).rotation.x = -PI / 2;
    for (const [x, z] of [[13.4, -19], [0, -32.4], [-13.4, -19]]) k.box(0.9, 0.12, 0.9, x, 0.1, z, steelW);
    k.box(1.2, 0.04, 1.2, 0, 0.07, -5.6, steelW);
    for (const s of [-1, 1]) k.box(0.12, 0.02, 110, 0, 0.06, -60, steelW).rotation.y = s * PI / 4;
    const R = 92;
    for (let i = 0; i <= 40; i++) {
      const t = PI * 0.25 + (i / 40) * PI * 0.5;
      const x = Math.cos(t) * R, z = -5 - Math.sin(t) * R;
      k.box(0.6, 3.2, 7.6, x, 1.6, z, wall).rotation.y = -t + PI / 2;
      k.box(0.8, 0.2, 7.8, x, 3.3, z, k.flat(0xf1c531, 0, 0.6)).rotation.y = -t + PI / 2;
      if (i % 5 === 0) k.box(0.6, 3.2, 7.6, x, 1.6, z, dark).rotation.y = -t + PI / 2;
    }
    k.mesh(new T.RingGeometry(R - 4, R + 0.5, 64, 1, PI * 0.25, PI * 0.5), dirt, 0, 0.03, -5).rotation.x = -PI / 2;
    // the bowl: tiers of seats climbing behind the outfield wall and along the lines
    const seats: T.Matrix4[] = [], seats2: T.Matrix4[] = [];
    for (let tier = 0; tier < 3; tier++) {
      const r0 = R + 6 + tier * 14, rows = 12;
      for (let row = 0; row < rows; row++) {
        const rr = r0 + row * 0.9, y = 3 + tier * 9 + row * 0.62;
        k.mesh(new T.RingGeometry(rr - 0.45, rr + 0.45, 96, 1, PI * 0.2, PI * 0.6), concrete, 0, y, -5).rotation.x = -PI / 2;
        for (let j = 0; j < 130; j++) {
          const t = PI * 0.2 + (j / 130) * PI * 0.6;
          const m = new T.Matrix4().compose(v(Math.cos(t) * rr, y + 0.45, -5 - Math.sin(t) * rr), new T.Quaternion().setFromEuler(new T.Euler(0, -t + PI / 2, 0)), v(1, 1, 1));
          (j % 7 === 0 ? seats2 : seats).push(m);
        }
      }
      k.mesh(new T.RingGeometry(r0 + 11.5, r0 + 13, 96, 1, PI * 0.2, PI * 0.6), steelW, 0, 3 + tier * 9 + 8.2, -5).rotation.x = -PI / 2;
    }
    k.instances(new T.BoxGeometry(0.6, 0.7, 0.55), seat, seats);
    k.instances(new T.BoxGeometry(0.6, 0.7, 0.55), seat2, seats2);
    // the frieze: white steel arches along the top of the upper deck
    const fr = R + 6 + 2 * 14 + 12;
    for (let j = 0; j < 30; j++) {
      const t0 = PI * 0.2 + (j / 30) * PI * 0.6, t1 = PI * 0.2 + ((j + 1) / 30) * PI * 0.6;
      const a = v(Math.cos(t0) * fr, 30, -5 - Math.sin(t0) * fr), b = v(Math.cos(t1) * fr, 30, -5 - Math.sin(t1) * fr);
      const mid = a.clone().lerp(b, 0.5).add(v(0, 3.6, 0));
      k.curve([a, mid, b], 0.22, steelW, 12);
      k.beam(a, a.clone().add(v(0, 4.4, 0)), 0.16, steelW, 6);
    }
    k.mesh(new T.RingGeometry(fr - 0.4, fr + 0.4, 96, 1, PI * 0.2, PI * 0.6), steelW, 0, 34.4, -5).rotation.x = -PI / 2;
    // light towers
    for (const t of [PI * 0.28, PI * 0.5, PI * 0.72]) {
      const x = Math.cos(t) * (fr + 4), z = -5 - Math.sin(t) * (fr + 4);
      k.box(1.2, 44, 1.2, x, 22, z, dark);
      k.box(9, 3.4, 0.6, x, 44, z, dark).rotation.y = -t + PI / 2;
      for (let i = -4; i <= 4; i++) for (const dy of [-1, 0, 1]) k.sphere(0.3, x + Math.sin(t) * i * 0.95, 44 + dy * 1.0, z + Math.cos(t) * i * 0.95, glow, 6);
      k.spot(x, 45, z, 0, 0, -30, 0xffffff, 2600, 0.55, 0.5, 220);
    }
    // the scoreboard over centre field: the lineup is the census
    const sz = -5 - R - 30;
    k.box(44, 18, 2, 0, 24, sz, dark);
    k.box(0.8, 24, 0.8, -18, 12, sz, dark);
    k.box(0.8, 24, 0.8, 18, 12, sz, dark);
    k.censusWall({ x: 0, y: 19.5, z: sz + 1.05, rotY: 0, cols: 34, rows: 5, tile: 1.1, gap: 0.08, start: ctx.wallStart(300, 170), pieces: ctx.all, backing: dark });
    k.sign('TONIGHT  ·  THE CENSUS  vs  THE CITY', 30, 2, 0, 31.5, sz + 1.05, '#0d1526', '#f4e9c4', 120, 0);
    const bill = billboard(k, ctx, 0, 40, 7, 0, 27.2, sz + 1.05, 0, dark);
    void bill;
    // the gate arches behind home plate, the dugouts, the bleachers' beer stand
    for (let i = 0; i < 7; i++) k.arch(4.6, 9, 2.4, -18 + i * 6, 0, 22, lime, false, 0.62);
    k.box(44, 1.4, 2.6, 0, 10.7, 22, lime);
    k.sign('THE BRONX  ·  GATE 4', 8, 0.9, 0, 12.2, 20.6, '#2a3a5a', '#f4e9c4', 100, PI, { border: true });
    for (const s of [-1, 1]) { k.box(10, 2.6, 4, s * 16, 1.3, 6, concrete); k.box(10, 0.3, 4.4, s * 16, 2.8, 6, dark); k.keepOut.push({ x: s * 16, z: 6, r: 6 }); }
    k.prop('captains_hat', 0, 0.9, 12, { height: 0.6 });
    k.plinth(0, 12, 1.4, 0.8, 1.4, lime);
    k.prop('bell', -6, 1.5, 14, { height: 0.9 });
    k.box(0.25, 1.5, 0.25, -6, 0.75, 14, dark);
    if (!ctx.reduced) {
      const boards = ctx.pieces.slice(60);
      let last = 0;
      k.ticks.push((t) => { if (t - last > 7 && bill) { last = t; const p = boards[Math.floor(t / 7) % boards.length]; import('../kit').then(({ loadThumb }) => loadThumb(ctx.thumb(p)).then((tex) => { if (!k.live) return; (bill.material as T.MeshBasicMaterial).map = tex; (bill.material as T.MeshBasicMaterial).needsUpdate = true; bill.userData.piece = p; })); } });
    }
    // the works: along the outfield wall, on the dugout roofs, at the gate
    const mounts: Mount[] = [];
    for (let i = 0; i < 16; i++) {
      const t = PI * 0.27 + (i / 15) * PI * 0.46;
      const x = Math.cos(t) * (R - 0.35), z = -5 - Math.sin(t) * (R - 0.35);
      mounts.push({ position: v(x, 2.0, z), rotation: -t - PI / 2, target: v(Math.cos(t) * (R - 7), 3, -5 - Math.sin(t) * (R - 7)), width: 5.8, height: 2.6, style: 'steel', wash: false });
    }
    for (const s of [-1, 1]) for (const dx of [-2.6, 2.6]) mounts.push({ position: v(s * 16 + dx, 4.4, 4.2), rotation: 0, target: v(s * 16 + dx, 3, -2), width: 4.4, height: 2.5, style: 'steel', wash: false });
    for (const x of [-12, 12]) mounts.push({ position: v(x, 4.2, 20.7), rotation: PI, target: v(x, 3, 15), width: 4.4, height: 2.5, style: 'black' });
    return { mounts, spawn: v(0, 3, 4), look: v(0, 8, -80), eye: 3, bounds: [-70, 70, -95, 18], style: 'steel' };
  },
};

/* ---------------- 25 THE DELI COUNTER ---------------- */
export const deli: RoomDef = {
  id: 'deli',
  name: 'Take a number',
  area: 'THE APPETIZING COUNTER',
  mood: 'Sunday morning',
  color: '#e9c46a',
  description: 'A Lower East Side corner store: neon over the awning, a tin ceiling, glass cases lit from inside, the census in every case and up on the photo wall.',
  signatures: 'The long glass and marble counter, smoked fish hanging on a rail, a pressed tin ceiling, the numbered ticket dispenser, the corner neon and awning, the photo wall.',
  build(k, ctx) {
    k.sky({ top: 0x7fa6d3, horizon: 0xe6e9e6, ground: 0x5f5a52, fog: 0.003, sun: { az: 1.0, el: 0.5, color: 0xfff1d8, size: 14 }, env: 0.9 });
    k.hemi(0xfff3e0, 0x4a4238, 0.85);
    k.sun(0xfff0d4, 2.0, 30, 40, 30, true, 60);
    /* 2026-11-23: pressed tin painted in the browser (24 inch panels), the rest Poly Haven scans (CC0) at real size:
       a checkerboard floor, white glazed wall tile, a marble counter, dark oak, the building's brick */
    const tinTex = paintTex(512, 512, pressedTin, [], true);
    tinTex.wrapS = tinTex.wrapT = T.RepeatWrapping;
    const tin = k.pbr('tinCeilingW2', { map: tinTex }, 1 / 1.22, { color: 0xf4f0e6, metalness: 0.55, roughness: 0.38 }),
      tile = scan(k, 'deli', 'long_white_tiles', 1.27, () => X.subwayTile(0xefece2, 0x2a2c2a), { color: 0xf6f4ee, roughness: 0.2 }),
      floorT = scan(k, 'deli', 'floor_tiles_06', 3, () => X.pavers(0x8a8478, 16), { color: 0xe2ddd2, roughness: 0.45 }),
      marble = scan(k, 'deli', 'marble_01', 1.5, () => X.marble(0xe8e4dc, 0x9a948a, 9), { color: 0xf2eee8, roughness: 0.2 }),
      wood = scan(k, 'deli', 'wood_floor', 1.7, () => X.planks(0x6a4a30, 5, 29), { color: 0x8a6448, roughness: 0.5 }),
      steel = k.flat(0xc8ccd0, 0.85, 0.3),
      brick = scan(k, 'deli', 'brick_wall_02', 2, () => X.brick(0x6b4a3d, 30), { color: 0xc8a89a }),
      awning = k.pbr('awning', X.velvet(0x8a2a2a), 0.5, { roughness: 0.9 }),
      glass = k.glass(0xdcecf2, 0.16, 0.05),
      salami = k.flat(0xb07a34, 0.15, 0.5),   /* 2026-10-09: golden smoked fish, not salami: an appetizing store sells fish and dairy, never meat */
      neon = k.glow(0xff5a4a),
      neonB = k.glow(0x7ad0ff),
      warm = k.glow(0xffe7c0);
    const SZ_BACK = 12 - 26;
    // the corner: Houston meets Orchard, the store on the corner lot
    scanStreet(k, 'deli', { w: 18, len: 110, z: -20 });
    const s2 = k.mesh(new T.BoxGeometry(110, 0.3, 14), k.pbr('asphaltS', X.asphalt(0x24282d), 0.11), 0, -0.15, 22);
    void s2;
    blockFront(k, { x: -14, z0: -2, count: 6, face: 1, seed: 51, h: [14, 20] });
    /* 2026-11-23: this block started at z -2 and so stood inside the store, a brick wall across the counter and the
       photo wall; it starts behind the store now */
    blockFront(k, { x: 14, z0: SZ_BACK - 6, count: 4, face: -1, seed: 52, h: [14, 20] });
    k.prop('hydrant', -10.8, 0, 8, { height: 1.1, keepOut: 0.5 });
    k.prop('mailbox', 10.8, 0, 2, { height: 1.5, rotY: -PI / 2, keepOut: 0.6 });
    for (const z of [10, -30]) for (const s of [-1, 1]) k.lamp(s * 10.5, z, 6, k.flat(0x1f262b, 0.75, 0.45), 0xffd9a8, 28);
    k.prop('tree', -10.6, 0, 16, { height: 5.5, keepOut: 0.6 });
    // the store: the corner building with the shop on the ground floor
    const SX = 14, SZ = 12, W = 22, D = 26;
    k.box(W, 14, D, SX + W / 2 - 0.5, 7 + 5.6, SZ - D / 2, brick);
    k.moulding([[0, 0], [0.7, 0], [0.8, 0.2], [0.5, 0.35], [0.6, 0.55], [0.25, 0.75], [0, 0.85]], D, SX - 0.05, 5.5, SZ - D / 2, k.pbr('nbCornice', X.plaster(0xb8ad9a, 3), 0.6), 0);
    for (let y = 8.6; y < 18; y += 2.7) for (let dz = -22; dz <= -3; dz += 3.2) { k.box(0.2, 1.9, 1.35, SX - 0.06, y, SZ + dz, k.flat(0xd6d1c3, 0, 0.8)); k.box(0.05, 1.65, 1.1, SX + 0.06, y, SZ + dz, y < 12 ? warm : glass); }
    k.prop('fire_escape', SX - 1.05, 7, SZ - 10, { height: 3.2, rotY: PI / 2 });
    k.prop('fire_escape', SX - 1.05, 9.8, SZ - 10, { height: 3.2, rotY: PI / 2 });
    // storefront: awning, big windows, the corner door, the neon
    const aw = k.box(0.1, 0.1, 0.1, 0, 0, 0, awning);
    aw.visible = false;
    const awn = k.mesh(new T.BoxGeometry(2.6, 0.12, D - 2), awning, SX - 1.3, 4.6, SZ - D / 2);
    awn.rotation.z = 0.35;
    for (let dz = -24; dz <= -2; dz += 2) k.box(0.05, 0.5, 0.06, SX - 2.5, 4.05, SZ + dz, awning);
    k.box(0.12, 3.2, D - 5, SX, 2.4, SZ - D / 2 - 1.5, glass);
    k.box(0.4, 0.9, D, SX, 0.45, SZ - D / 2, wood);
    k.block(SX - 0.3, SX + 0.3, SZ - D, SZ - 3.2);
    k.box(0.3, 3.4, 1.8, SX, 1.7, SZ - 1.6, wood);
    k.box(0.1, 2.6, 1.2, SX, 1.8, SZ - 1.6, glass);
    k.box(W, 3.4, 0.3, SX + W / 2, 1.7, SZ, brick);
    k.block(SX, SX + W, SZ - 0.3, SZ + 0.3);
    k.block(SX + W - 0.3, SX + W + 0.3, SZ - D, SZ);
    k.block(SX, SX + W, SZ - D - 0.3, SZ - D + 0.3);
    k.box(W, 0.3, D, SX + W / 2, 5.6, SZ - D / 2, tin);
    k.box(W, 0.3, D, SX + W / 2, -0.1, SZ - D / 2, floorT);
    k.box(0.3, 5.6, D, SX + W - 0.15, 2.8, SZ - D / 2, tile);
    k.box(W, 5.6, 0.3, SX + W / 2, 2.8, SZ - D + 0.15, tile);
    const sign = (txt: string, w: number, y: number, m: T.Material) => { for (let i = 0; i < txt.length; i++) { const cw = w / txt.length; k.box(0.06, 0.9, cw * 0.7, SX - 0.4, y, SZ - D / 2 + (i - txt.length / 2) * cw + cw / 2, m); } };
    sign('APPETIZING', 12, 7.2, neon);
    k.sign('APPETIZING  ·  SMOKED FISH  ·  SINCE 1914', 12, 1.0, SX - 0.45, 7.2, SZ - D / 2, 'transparent', '#ff5a4a', 110, PI / 2);
    k.box(0.06, 0.25, 8, SX - 0.4, 6.3, SZ - D / 2, neonB);
    k.point(SX - 1.5, 6.5, SZ - D / 2, 0xff6a5a, 40, 14);
    // inside: the long counter, cases lit from within, smoked fish on a rail, the ticket machine, fans
    const CX = SX + 6.5;
    k.box(1.2, 1.1, D - 6, CX, 0.55, SZ - D / 2, wood);
    k.box(1.4, 0.12, D - 5.6, CX, 1.16, SZ - D / 2, marble);
    k.box(1.2, 1.1, D - 6, CX, 1.75, SZ - D / 2, glass);
    k.box(1.3, 0.06, D - 5.8, CX, 2.32, SZ - D / 2, steel);
    k.block(CX - 0.8, CX + 0.8, SZ - D + 3, SZ - 3);
    for (let i = 0; i < 10; i++) { const z = SZ - D + 4 + i * 2; k.point(CX, 1.7, z, 0xfff0d0, 3, 2.2); }
    /* 2026-11-23: whole smoked whitefish and sides of salmon, hung by the tail, in place of the gold sticks */
    {
      const fishG = new T.LatheGeometry([[0, 0], [0.05, 0.04], [0.1, 0.16], [0.12, 0.32], [0.1, 0.48], [0.05, 0.62], [0.025, 0.7]].map(([a, b]) => new T.Vector2(a, b)), 10);
      fishG.scale(1, 1, 0.55);
      const tail = new T.ShapeGeometry(new T.Shape([new T.Vector2(0, 0.66), new T.Vector2(-0.13, 0.9), new T.Vector2(0.13, 0.9)]));
      const sideG = new T.BoxGeometry(0.34, 0.95, 0.05);
      const fishM: T.Matrix4[] = [], tailM: T.Matrix4[] = [], sideM: T.Matrix4[] = [], q = new T.Quaternion(), one = v(1, 1, 1);
      for (let i = 0; i < 14; i++) {
        const z = SZ - D + 2.5 + i * 1.5, sc = 1.3 + (i % 3) * 0.2;
        k.beam(v(CX + 1.6, 5.1, z), v(CX + 1.6, 5.5, z), 0.02, steel, 4);
        if (i % 3 === 1) sideM.push(new T.Matrix4().compose(v(CX + 1.6, 4.55, z), q.setFromAxisAngle(v(0, 1, 0), PI / 2), one));
        else {
          const m = new T.Matrix4().compose(v(CX + 1.6, 5.08 - 0.9 * sc * 0.55, z), q.setFromAxisAngle(v(0, 1, 0), PI / 2), v(sc * 0.55, sc * 0.55, sc * 0.55));
          fishM.push(m); tailM.push(m.clone());
        }
      }
      k.instances(fishG, k.flat(0xb8823e, 0.35, 0.32), fishM);
      k.instances(tail, k.flat(0x8a5a26, 0.2, 0.5, { side: T.DoubleSide }), tailM);
      k.instances(sideG, k.flat(0xe0784a, 0.05, 0.38), sideM);
    }
    k.box(0.06, 0.06, D - 4, CX + 1.6, 5.5, SZ - D / 2, steel);
    /* the fans are Poly Haven's Ceiling Fan (CC0) once it loads; the code fans stand in until then */
    const fans: T.Group[] = [];
    for (const z of [SZ - 7, SZ - 19]) { const fan = new T.Group(); fan.position.set(CX + 5, 5.2, z); for (let b = 0; b < 4; b++) { const bl = new T.Mesh(new T.BoxGeometry(1.4, 0.04, 0.3), k.flat(0x3a2a20, 0.2, 0.7)); bl.position.x = 0.8; const pivot = new T.Group(); pivot.rotation.y = (b * PI) / 2; pivot.add(bl); fan.add(pivot); } k.add(fan); fans.push(fan); if (!ctx.reduced) k.ticks.push((t) => { fan.rotation.y = t * 3; }); }
    void hero(k, 'deli/ph_ceiling_fan', { width: 1.8 }).then((h) => {
      if (!h || !k.live) return;
      const hh = (h.userData.size as T.Vector3).y;
      fans.forEach((f, i) => { f.clear(); const c2 = i ? h.clone() : h; c2.position.y = 0.4 - hh; f.add(c2); });
    });
    k.box(0.4, 0.5, 0.3, SX + 2, 1.4, SZ - 2.5, k.flat(0xb02a2a, 0.3, 0.5));
    k.box(0.1, 0.1, 0.1, SX + 2, 1.65, SZ - 2.5, steel);
    const served = k.sign('NOW SERVING  7541', 3.2, 0.7, SX + W / 2, 4.6, SZ - D + 0.32, '#111', '#ff5a4a', 120, 0);
    if (!ctx.reduced) { let n = 7541, last = 0; k.ticks.push((t) => { if (t - last > 5) { last = t; n++; (served.material as T.MeshBasicMaterial).map = X.signText('NOW SERVING  ' + n, 1024, 224, '#111', '#ff5a4a', 120); (served.material as T.MeshBasicMaterial).needsUpdate = true; } }); }
    k.box(6, 0.8, 0.4, SX + 13, 0.4, SZ - D + 0.4, wood);
    /* 2026-11-23: the three stools stood inside the counter, and one sat on a case work's viewing spot; they stand
       along the customer side now, between the cases */
    for (let i = 0; i < 3; i++) { const zs = SZ - D / 2 - 6 + i * 6; k.cyl(0.05, 0.75, CX - 2.1, 0.38, zs, steel, 0.05, 8); k.cyl(0.32, 0.06, CX - 2.1, 0.78, zs, k.flat(0xb02a2a, 0.3, 0.5), 0.32, 16); k.keepOut.push({ x: CX - 2.1, z: zs, r: 0.45 }); }
    /* ---- THE BIG UPGRADE, wave 2a (2026-11-23): the counter dressed, the room finished, the back room ---- */
    {
      const green = k.flat(0x1f4a3a, 0.1, 0.3), brass = k.flat(0xc9a55a, 0.85, 0.3), cream = k.flat(0xf3ede0, 0, 0.5);
      /* a green tile band and a cornice round the two tiled walls; a brass foot rail along the counter */
      k.box(0.04, 0.16, D, SX + W - 0.32, 1.06, SZ - D / 2, green);
      k.box(W, 0.16, 0.04, SX + W / 2, 1.06, SZ - D + 0.32, green);
      k.moulding([[0, 0], [0.22, 0], [0.26, 0.08], [0.16, 0.16], [0.2, 0.26], [0, 0.3]], D, SX + W - 0.3, 5.15, SZ - D / 2, cream, PI);
      k.moulding([[0, 0], [0.22, 0], [0.26, 0.08], [0.16, 0.16], [0.2, 0.26], [0, 0.3]], W, SX + W / 2, 5.15, SZ - D + 0.3, cream, -PI / 2);
      k.beam(v(CX - 0.72, 0.28, SZ - D + 3.2), v(CX - 0.72, 0.28, SZ - 3.2), 0.035, brass, 8);
      /* the back counter: the slicing boards, the register, a scale, jars and bagels */
      const BX = CX + 1.4;
      k.box(0.8, 1.0, 16, BX, 0.5, SZ - D / 2, wood);
      k.box(0.86, 0.06, 16.1, BX, 1.03, SZ - D / 2, marble);
      k.block(BX - 0.45, BX + 0.45, SZ - D / 2 - 8.1, SZ - D / 2 + 8.1);
      glbs(k, 'deli/ph_wooden_cutting_board', { width: 0.7 }, [[BX, 1.06, SZ - D / 2 - 5, PI / 2], [BX, 1.06, SZ - D / 2 - 1, PI / 2], [BX, 1.06, SZ - D / 2 + 3, PI / 2]]);
      glbs(k, 'deli/ph_cash_register', { height: 0.55 }, [[BX, 1.06, SZ - D / 2 + 6.6, -PI / 2]]);
      k.box(0.36, 0.1, 0.3, BX, 1.11, SZ - D / 2 + 1.2, steel); k.cyl(0.12, 0.05, BX, 1.32, SZ - D / 2 + 1.2, k.flat(0xf4f0e6, 0.1, 0.3), 0.12, 18).rotation.z = PI / 2;
      {
        const jar = new T.CylinderGeometry(0.09, 0.09, 0.24, 12), fill = [0xe8d8b0, 0xd9935a, 0xf2efe6, 0xa8b878, 0xe0c090], rnd = X.mulberry(25), byCol: T.Matrix4[][] = fill.map(() => []);
        for (let n = 0; n < 34; n++) byCol[n % fill.length].push(new T.Matrix4().makeTranslation(BX + (rnd() - 0.5) * 0.4, 1.18, SZ - D / 2 - 7.4 + n * 0.42 + (n > 16 ? 1.2 : 0)));
        byCol.forEach((ms, ci) => k.instances(jar, k.flat(fill[ci], 0, 0.25), ms));
        const bagel = new T.TorusGeometry(0.065, 0.032, 6, 12); bagel.rotateX(PI / 2);
        const bm: T.Matrix4[] = [];
        for (let n = 0; n < 40; n++) bm.push(new T.Matrix4().makeTranslation(BX - 0.18 + (n % 4) * 0.12, 1.1 + Math.floor(n / 20) * 0.05, SZ - D / 2 + 4.2 + Math.floor((n % 20) / 4) * 0.14));
        k.instances(bagel, k.flat(0xb8803c, 0, 0.6), bm);
      }
      /* the menu boards over the counter: white letters pressed into black felt */
      const items = [['NOVA SCOTIA SALMON', 'GASPE NOVA', 'BELLY LOX', 'SABLE'], ['WHITEFISH SALAD', 'PICKLED HERRING', 'SMOKED TROUT', 'KIPPERED SALMON'], ['SCALLION CREAM CHEESE', 'BIALYS  BAGELS', 'BABKA  RUGELACH', 'EGG CREAM']];
      items.forEach((rows, bi) => {
        const t = paintTex(768, 300, (g, w, h) => {
          g.fillStyle = '#121212'; g.fillRect(0, 0, w, h);
          g.globalAlpha = 0.12; g.fillStyle = '#fff'; for (let y = 6; y < h; y += 9) g.fillRect(0, y, w, 1); g.globalAlpha = 1;
          g.fillStyle = '#f2efe6'; g.textBaseline = 'middle';
          rows.forEach((r, ri) => { fit(g, r, 'W2 JetBrains Mono', 44, w * 0.9, '700'); g.textAlign = 'center'; g.fillText(r, w / 2, 44 + ri * 70); });
          g.strokeStyle = '#7a5a3a'; g.lineWidth = 12; g.strokeRect(0, 0, w, h);
        }, ['W2 JetBrains Mono']);
        const z = SZ - D / 2 - 6 + bi * 6;
        const b = k.mesh(new T.PlaneGeometry(2.6, 1.0), new T.MeshBasicMaterial({ map: t }), CX + 0.9, 3.9, z, true);
        b.rotation.y = -PI / 2;
        k.beam(v(CX + 0.9, 4.4, z - 1), v(CX + 0.9, 5.6, z - 1), 0.012, steel, 4); k.beam(v(CX + 0.9, 4.4, z + 1), v(CX + 0.9, 5.6, z + 1), 0.012, steel, 4);
      });
      /* pickle barrels by the far end, the wall clock, gold leaf on the window, the awning's valance */
      glbs(k, 'deli/nyb_katz_pickles', { height: 0.95 }, [[19.2, 0.0, SZ - D + 1.4, 0.4], [20.3, 0.0, SZ - D + 1.2, 2.2]]);
      for (const [x, z] of [[19.2, SZ - D + 1.4], [20.3, SZ - D + 1.2]]) k.keepOut.push({ x, z, r: 0.5 });
      glbs(k, 'deli/nyb_katz_clock', { height: 0.8 }, [[SX + W - 3, 3.8, SZ - D + 0.32, 0]]);
      hsign(k, 'SMOKED FISH  .  CAVIAR  .  BAGELS', 9, 0.32, SX - 0.08, 3.82, SZ - D / 2 - 1.5, -PI / 2, { fg: '#e6c06a', font: 'W2 Archivo Expanded' });
      hsign(k, 'APPETIZING  .  SMOKED FISH  .  CREAM CHEESE', 18, 0.4, SX - 2.58, 4.05, SZ - D / 2, -PI / 2, { fg: '#f6eedc', bg: '#7e2424', font: 'W2 Archivo Expanded', size: 0.55 });
      /* the ghost sign on the Houston Street wall, painted out and coming back through the brick, until Firefly's */
      const ghost = new T.MeshStandardMaterial({ map: paintTex(1024, 512, ghostSign, ['W2 Archivo Expanded']), transparent: true, opacity: 0.62, roughness: 0.95, depthWrite: false });
      fireflyPlate(k, 'assets/museum/tex/deli/ff_ghost_sign.webp', 18, 9, SX + W / 2, 12.6, SZ + 0.04, 0, ghost);
      /* the trick: a back room that is not there. The doorway is a metre and a quarter deep; the floor climbs, the
         ceiling drops, the walls close in and the shelves shrink, so it reads as ten metres of stockroom */
      backRoom(k, SX + W - 2.4, SZ - D + 0.3, 2.0, 3.0, 1.3);
      k.block(SX + W - 3.5, SX + W - 1.3, SZ - D, SZ - D + 1.7);
      k.egg(v(SX + W - 2.4, 1.6, SZ - D + 1.0), { id: 'deli-backroom', title: 'The stockroom that is not there', text: 'The doorway at the back leads into a room barely a metre deep. Its floor rises, its ceiling falls, its walls close in and its shelves shrink, so your eye reads distance that is not there. Theatre and film call it forced perspective; stage designers have built false depth this way since the Renaissance.', clue: 'Look through the lit doorway in the back corner, then walk up to it.', source: { name: 'Forced perspective, Wikipedia', url: 'https://en.wikipedia.org/wiki/Forced_perspective' } }, { r: 1.2 });
      hsign(k, 'EMPLOYEES ONLY', 1.6, 0.22, SX + W - 2.4, 3.3, SZ - D + 1.62, 0, { fg: '#f2efe6', bg: '#1f4a3a', font: 'W2 Archivo Narrow' });
    }
    /* landmark eggs: real New York appetizing history, each from its cited page */
    k.egg(v(CX + 1.6, 4.4, SZ - D / 2 + 1), { id: 'deli-nomeat', title: 'Fish and dairy, never meat', text: 'An appetizing store sells smoked and pickled fish, fish spreads, cream cheese and other dairy, and no meat. A kosher deli is the reverse: kashrut forbids selling meat and dairy together, so New York grew two kinds of shop.', clue: 'Look at what hangs on the rail over the counter.', source: { name: 'Appetizing store, Wikipedia', url: 'https://en.wikipedia.org/wiki/Appetizing_store' } }, { r: 1.3 });
    k.egg(v(SX - 0.6, 7.2, SZ - D / 2 - 3), { id: 'deli-fivehundred', title: 'Five hundred, then ten', text: 'About 500 appetizing stores were open in New York City in 1930, and a similar number in 1950. By 2015 fewer than ten were left. When Shelsky\'s opened in Cobble Hill in 2011, it was the first appetizing store in Brooklyn in 60 years.', clue: 'Read the neon over the awning from the street.', source: { name: 'Appetizing store, Wikipedia', url: 'https://en.wikipedia.org/wiki/Appetizing_store' } }, { r: 1.6 });
    k.egg(v(SX + W - 0.5, 5.0, SZ - 1.5), { id: 'deli-daughters', title: 'And Daughters', year: '1933', text: 'Joel Russ came from Strzyzow in Poland, carried mushrooms on his shoulders, then bought a pushcart, and in 1914 opened a shop on the Lower East Side; it moved to 179 East Houston Street in 1920 and is still there. In 1933 he made his daughters Hattie, Anne and Ida partners and renamed it Russ and Daughters, breaking the usual and Sons.', clue: 'Look at the top corner of the photo wall, where the family goes.', source: { name: 'Russ and Daughters, Wikipedia', url: 'https://en.wikipedia.org/wiki/Russ_%26_Daughters' } }, { r: 1.0 });
    k.egg(v(CX, 1.5, SZ - 2.1), { id: 'deli-sturgeon', title: 'The Sturgeon King', year: '1938', text: 'Barney Greengrass opened in 1908 at West 113th Street and St. Nicholas Avenue in Harlem and moved to Amsterdam Avenue at 86th Street in 1929. A man named James J. Frawley gave Greengrass the title the Sturgeon King in 1938, and the shop won a James Beard award in 2006.', clue: 'Find the near end of the glass cases.', source: { name: 'Barney Greengrass, Wikipedia', url: 'https://en.wikipedia.org/wiki/Barney_Greengrass' } }, { r: 0.9 });
    k.egg(v(CX, 1.5, SZ - D + 1.9), { id: 'deli-schmear', title: 'Philadelphia, New York', year: '1872', text: 'American cream cheese is a New York State invention: William A. Lawrence, a dairyman in Chester, New York, began making it in 1872 and was mass producing it by about 1873. In 1880 a New York distributor, Alvah Reynolds, sold it as Philadelphia Cream Cheese, though it was never made in Philadelphia.', clue: 'Go to the far end of the counter, where the cream cheese sits.', source: { name: 'Cream cheese, Wikipedia', url: 'https://en.wikipedia.org/wiki/Cream_cheese' } }, { r: 0.9 });
    k.egg(v(SX + 2, 1.5, SZ - 2.5), { id: 'deli-zabar', title: 'A stall in Brooklyn', year: '1934', text: 'Zabar\'s began in 1934, when Louis Zabar rented a stall in a farmers market in Brooklyn; with his wife Lillian he built it into the appetizing store at Broadway and 80th Street. By the mid 1990s it served about 35,000 customers a week.', clue: 'Take a number from the red machine by the door.', source: { name: 'Zabar\'s, Wikipedia', url: 'https://en.wikipedia.org/wiki/Zabar%27s' } }, { r: 0.8 });
    // the photo wall: the regulars, floor to ceiling
    k.censusWall({ x: SX + W - 0.32, y: 3.2, z: SZ - D / 2, rotY: -PI / 2, cols: 32, rows: 6, tile: 0.6, gap: 0.05, start: ctx.wallStart(2000, 192), pieces: ctx.all, backing: wood });
    // the works: above the counter on the tile, inside the cases, in the window
    const mounts: Mount[] = [];
    for (let i = 0; i < 10; i++) { const z = SZ - D + 4 + i * 2; mounts.push({ position: v(CX, 1.72, z), rotation: -PI / 2, target: v(CX - 3, 3, z), width: 1.7, height: 0.95, style: 'none', wash: false, lookAt: v(CX, 1.7, z) }); }
    for (let i = 0; i < 6; i++) { const z = SZ - D + 4 + i * 3.6; mounts.push({ position: v(SX + W - 0.34, 3.6, z), rotation: -PI / 2, target: v(SX + W - 5, 3, z), width: 3.2, height: 1.9, style: 'oak' }); }
    for (const x of [SX + 4, SX + 10, SX + 16]) mounts.push({ position: v(x, 3.5, SZ - D + 0.34), rotation: 0, target: v(x, 3, SZ - D + 5), width: 4.4, height: 2.6, style: 'oak' });
    /* 2026-11-23: the window works faced into the shop while their viewing spot is on the pavement; they face the street */
    for (const z of [SZ - 18, SZ - 12, SZ - 6]) mounts.push({ position: v(SX - 0.34, 2.6, z), rotation: -PI / 2, target: v(SX - 5, 3, z), width: 3.6, height: 2.1, style: 'black', wash: false });
    return { mounts, spawn: v(1, 3, -3), look: v(SX, 3.2, SZ - 11), eye: 3, bounds: [-10.4, SX + W - 0.6, SZ - D + 0.6, 18], style: 'oak' };
  },
};

/* ---------------- 26 WASHINGTON SQUARE ---------------- */
export const washington: RoomDef = {
  id: 'washington',
  name: 'Under the arch',
  area: 'WASHINGTON SQUARE',
  mood: 'Saturday afternoon',
  color: '#b9c8a4',
  description: 'The marble arch, the fountain plaza, chess tables under the trees, the works set on steel easels around the water.',
  signatures: 'The white marble arch with its relief panels and the avenue framed through it, the round fountain basin with a jet, the chess tables in the southwest corner, the red brick row houses on the north side.',
  build(k, ctx) {
    k.sky({ top: 0x6f9dd2, horizon: 0xe7ebe7, ground: 0x556546, fog: 0.0026, sun: { az: 1.2, el: 0.75, color: 0xfff3dc, size: 14 }, env: 0.95 });
    k.hemi(0xf0f6ff, 0x40503a, 0.95);
    k.sun(0xfff2d8, 2.5, 30, 60, 20, true, 90);
    /* 2026-11-23: the arch's coursed marble, the hexagonal park pavers, the granite, the lawn and the Row's brick are
       Poly Haven scans (CC0) at their real size */
    const marble = scan(k, 'washington', 'white_sandstone_blocks_02', 2, () => X.marble(0xece8e0, 0xb8b2a6, 10), { color: 0xf6f3ee, roughness: 0.5 }),
      hex = scan(k, 'washington', 'hexagonal_concrete_paving', 1.6, () => X.pavers(0x9a968c, 18), { color: 0xc8c4bc }),
      lawn = scan(k, 'washington', 'leafy_grass', 2, () => X.grass(0x4a7a3a, 12), { color: 0xb4c69a }),
      granite = scan(k, 'washington', 'granite_tile', 2.3, () => X.ashlar(0x8c8c88, 19, 3), { color: 0xd0ccc4 }),
      water = k.flat(0x3a6a78, 0.6, 0.15, { transparent: true, opacity: 0.9 }),
      iron = k.flat(0x1f242a, 0.7, 0.45),
      brickRow = scan(k, 'washington', 'red_brick_03', 1, () => X.brick(0x8a3f34, 31), { color: 0xd09888 }),
      stoneRow = k.pbr('rowStone', X.ashlar(0xb9ad97, 20, 3), 0.22),
      steel = k.flat(0x8c98a4, 0.9, 0.3),
      glow = new T.MeshBasicMaterial({ color: 0xeef8ff, transparent: true, opacity: 0.6, depthWrite: false });
    // the square: lawn, hex paving, paths radiating from the fountain
    k.box(160, 0.4, 160, 0, -0.2, -30, lawn);
    k.mesh(new T.CylinderGeometry(24, 24, 0.3, 64), hex, 0, 0.0, -30);
    for (const a of [0, PI / 4, PI / 2, (3 * PI) / 4]) { const p = k.box(5, 0.28, 130, 0, 0.0, -30, hex); p.rotation.y = a; }
    // the fountain
    k.mesh(new T.CylinderGeometry(11, 11.5, 0.9, 64), granite, 0, 0.45, -30);
    k.mesh(new T.CylinderGeometry(10.2, 10.2, 0.9, 64), water, 0, 0.5, -30);
    for (let i = 0; i < 4; i++) k.mesh(new T.CylinderGeometry(11 + i * 0.9, 11.5 + i * 0.9, 0.22, 64), granite, 0, 0.11 - i * 0.02, -30);
    const jets: T.Mesh[] = [];
    for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; const j = k.mesh(new T.CylinderGeometry(0.06, 0.16, 5, 6), glow, Math.cos(a) * 1.5, 3.4, -30 + Math.sin(a) * 1.5, true); jets.push(j); }
    const jet0 = k.mesh(new T.CylinderGeometry(0.1, 0.3, 8, 8), glow, 0, 4.9, -30, true);
    if (!ctx.reduced) k.ticks.push((t) => { jets.forEach((j, i) => { j.scale.y = 0.7 + 0.3 * Math.sin(t * 2 + i); j.position.y = 0.9 + 2.5 * j.scale.y; }); jet0.scale.y = 0.8 + 0.2 * Math.sin(t * 1.3); jet0.position.y = 0.9 + 4 * jet0.scale.y; });
    k.keepOut.push({ x: 0, z: -30, r: 12 });
    // the arch to the north, the avenue framed through it
    const AZ = 22;
    k.arch(9, 14, 5, 0, 0, AZ, marble, false, 0.7);
    for (const s of [-1, 1]) {
      k.box(5.8, 12, 5.2, s * 8.6, 6, AZ, marble);
      k.rounded(3.2, 4.2, 0.2, s * 8.6, 8.6, AZ + 2.7, k.flat(0xd9d4ca, 0, 0.7), 0.04);
      k.column(s * 6.2, 12.4, AZ + 2.4, 3.6, 0.22, marble, true);
      k.column(s * 11, 12.4, AZ + 2.4, 3.6, 0.22, marble, true);
    }
    /* 2026-10-09 truth pass: the real arch is 77 ft to the top over a 47 ft high, 30 ft wide opening,
       so the attic stands well above the vault. At this room's scale (the 9 wide opening is the 30 ft)
       the top belongs near 23; the attic was a thin band topping out near 19.5. */
    k.box(23, 6.2, 6, 0, 18.9, AZ, marble);
    k.box(23.6, 0.5, 6.4, 0, 16.0, AZ, marble);
    k.moulding([[0, 0], [0.9, 0], [1.0, 0.3], [0.6, 0.5], [0.7, 0.8], [0.3, 1.0], [0, 1.1]], 23.4, 0, 22.0, AZ + 3.0, marble, 0);
    k.sign('MDCCLXXXIX', 8, 0.9, 0, 19.4, AZ + 3.05, 'transparent', '#5a544a', 110, 0);
    k.block(-11.5, -3.9, AZ - 2.7, AZ + 2.7);
    k.block(3.9, 11.5, AZ - 2.7, AZ + 2.7);
    k.point(0, 10, AZ, 0xfff4e0, 30, 22);
    scanStreet(k, 'washington', { w: 14, len: 120, z: AZ + 70 });
    k.skyline({ z: 160, count: 26, spacing: 7, scale: 2.4, base: -2, seed: 61, lit: 0.12, glow: 0.3, tint: 0x7e8290, rows: 1 });
    // the Row on the north side, the university red brick south and east
    for (let i = 0; i < 10; i++) { const x = -45 + i * 10; if (Math.abs(x) < 16) continue; k.box(9.6, 16, 12, x, 8, AZ + 12, brickRow); k.box(9.8, 0.6, 12.4, x, 16, AZ + 12, stoneRow); for (let y = 3; y < 14; y += 3.2) for (const dx of [-3, 0, 3]) k.box(1.3, 2, 0.1, x + dx, y, AZ + 5.95, y < 6 ? k.glow(0xffe0b0) : k.glass(0x8fb0c0, 0.4, 0.1)); k.prop('stoop', x, 0, AZ + 5.2, { height: 2, rotY: PI }); }
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const z = -70 + i * 14; k.box(12, 22, 12, s * 62, 11, z, brickRow); }
    // trees, benches, chess tables, the players' corner, lamps
    const rnd = X.mulberry(26);
    for (let i = 0; i < 60; i++) { const a = rnd() * PI * 2, r = 38 + rnd() * 30, x = Math.cos(a) * r, z = -30 + Math.sin(a) * r; if (z > AZ - 8 && Math.abs(x) < 16) continue; if (Math.abs(x) < 4 || Math.abs(z + 30) < 4) continue; k.tree(x, 0, z, { kind: rnd() > 0.5 ? 'round' : 'column', h: 5 + rnd() * 4, r: 2.6 + rnd() * 2, leaf: 0x3f6b36, seed: i }); }
    /* the park benches: the code benches stand in until the cast iron model (the museum's own kit) arrives */
    const benches: T.Object3D[] = [], benchAt: [number, number, number, number][] = [];
    for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; benches.push(k.bench(Math.cos(a) * 20, -30 + Math.sin(a) * 20, -a + PI / 2, k.pbr('benchW', X.planks(0x5d4939, 3, 32), 1.2), iron, 2.4)); benchAt.push([Math.cos(a) * 20, 0.02, -30 + Math.sin(a) * 20, -a - PI / 2]); }
    glbs(k, 'washington/cp_bench', { width: 2.4 }, benchAt, () => hide(benches), 12);
    /* the chess tables are in the southwest corner; north is +z here, so west is +x (they were in the southeast) */
    const chessAt: [number, number, number, number][] = [];
    for (let i = 0; i < 8; i++) { const x = 26.5 + (i % 4) * 3.5, z = -62 + Math.floor(i / 4) * 4; k.cyl(0.32, 0.9, x, 0.45, z, granite, 0.32, 12); k.box(1.2, 0.08, 1.2, x, 0.94, z, granite); chessAt.push([x, 0.98, z, (i % 3) * 0.6]); for (const s of [-1, 1]) k.box(0.5, 0.06, 0.5, x + s * 0.9, 0.5, z, granite); k.keepOut.push({ x, z, r: 0.9 }); }
    for (const a of [0.4, 1.2, 2.0, 2.8, 3.6, 4.4, 5.2, 6.0]) k.lamp(Math.cos(a) * 26, -30 + Math.sin(a) * 26, 5.5, iron, 0xffe0b0, 24);
    k.prop('lamppost', 14, 0, AZ - 8, { height: 6 });
    k.prop('lamppost', -14, 0, AZ - 8, { height: 6 });
    k.prop('tree', 24, 0, -10, { height: 6, keepOut: 0.6 });
    // the census on a long low wall by the players' corner (moved with the tables to the southwest)
    k.censusWall({ x: 30, y: 2.0, z: -66, rotY: 0, cols: 28, rows: 3, tile: 0.6, gap: 0.05, start: ctx.wallStart(4000, 84), pieces: ctx.all, backing: granite });
    k.box(19, 0.6, 0.5, 30, 0.3, -66, granite);
    /* the Hangman's Elm, an English elm over 300 years old, in the northwest corner */
    k.tree(44, 0, 12, { h: 15, r: 7, species: 'elm', seed: 1679 });
    k.keepOut.push({ x: 44, z: 12, r: 1.0 });
    /* ---- THE BIG UPGRADE, wave 2a (2026-11-23) ---- */
    {
      /* Philip Martiny's keystone eagles, both faces (the Penn Station eagle from the museum's kit, in marble) */
      k.box(1.6, 2.0, 5.6, 0, 14.9, AZ, marble);
      glbs(k, 'washington/penn_eagle', { height: 1.9 }, [[0, 13.95, AZ - 2.95, PI], [0, 13.95, AZ + 2.95, 0]], (os) => steelUp(os[0], 0xf2efe8, 0, 0.6));
      for (const sz of [-1, 1]) k.box(1.3, 0.25, 0.6, 0, 13.85, AZ + sz * 2.75, marble);
      /* dentils under the cornice */
      { const dm: T.Matrix4[] = []; for (const sz of [-1, 1]) for (let x = -11.4; x <= 11.4; x += 0.42) dm.push(new T.Matrix4().makeTranslation(x, 15.6, AZ + sz * 3.12)); k.instances(new T.BoxGeometry(0.22, 0.3, 0.2), marble, dm); }
      /* the winged Victories in the spandrels, as relief plates until Firefly's carving lands */
      const vic = new T.MeshStandardMaterial({ map: paintTex(512, 512, victoryRelief), roughness: 0.7 });
      for (const sz of [-1, 1]) for (const sx of [-1, 1]) {
        const o = fireflyPlate(k, 'assets/museum/tex/washington/ff_spandrel_victory.webp', 3.0, 3.0, sx * 3.75, 13.1, AZ + sz * 2.54, sz < 0 ? PI : 0, vic);
        if (sx * sz > 0) o.scale.x = -1;
      }
      /* Washington at War and Washington at Peace stand in front of the piers on the Fifth Avenue face (stand in
         figures from the museum's kit, not likenesses of MacNeil's and Calder's statues) */
      for (const s3 of [-1, 1]) { k.box(3.4, 1.8, 2.0, s3 * 8.6, 0.9, AZ + 3.6, marble); k.block(s3 * 8.6 - 1.8, s3 * 8.6 + 1.8, AZ + 2.6, AZ + 4.7); }
      glbs(k, 'washington/cp_statue', { height: 4.4 }, [[-8.6, 1.8, AZ + 3.6, 0], [8.6, 1.8, AZ + 3.6, 0]], (os) => steelUp(os[0], 0xf4f1ea, 0, 0.55));
      /* the Row: white marble doorways, lintels, iron railings at the stoops */
      const trim = k.flat(0xece8de, 0, 0.6);
      for (let i = 0; i < 10; i++) {
        const x = -45 + i * 10; if (Math.abs(x) < 16) continue;
        k.box(2.0, 3.3, 0.3, x, 3.4, AZ + 5.9, trim); k.box(1.2, 2.5, 0.1, x, 3.2, AZ + 5.75, k.flat(0x1a1c1e, 0.2, 0.4));
        for (let y = 3; y < 14; y += 3.2) for (const dx of [-3, 0, 3]) { if (y < 6 && dx === 0) continue; k.box(1.6, 0.22, 0.2, x + dx, y + 1.12, AZ + 5.92, trim); k.box(1.5, 0.1, 0.25, x + dx, y - 1.05, AZ + 5.9, trim); }
        k.rail(x - 1.3, AZ + 4.4, 1.8, iron, 1.0, 'z', 0.3); k.rail(x + 1.3, AZ + 4.4, 1.8, iron, 1.0, 'z', 0.3);
      }
      /* the university's buildings east and west: windows, not blank brick */
      { const wm: T.Matrix4[] = [], lm: T.Matrix4[] = [], rnd = X.mulberry(2026);
        for (const s3 of [-1, 1]) for (let i = 0; i < 6; i++) { const z = -70 + i * 14; for (let y = 3; y < 21; y += 3.4) for (const dz of [-4, -1.3, 1.3, 4]) (rnd() > 0.8 ? lm : wm).push(new T.Matrix4().makeTranslation(s3 * 55.95, y, z + dz)); }
        k.instances(new T.BoxGeometry(0.12, 1.9, 1.3), k.flat(0x3a4a56, 0.6, 0.15), wm);
        k.instances(new T.BoxGeometry(0.12, 1.9, 1.3), k.glow(0xffe2b0), lm);
      }
      /* the chess corner: real chess sets on the granite, a sign, a hot dog cart by the fountain */
      glbs(k, 'washington/ph_chess_set', { width: 0.62 }, chessAt);
      glbs(k, 'washington/nyb_bobbyfischer_sign', { height: 1.5 }, [[24.2, 0.0, -56.2, -PI / 2]]);
      k.keepOut.push({ x: 24.2, z: -56.2, r: 0.6 });
      glbs(k, 'washington/hotdog', { height: 2.5 }, [[-17, 0.0, -9, 2.4]]);
      k.keepOut.push({ x: -17, z: -9, r: 1.3 });
      /* the trick: a chalk drawing on the path by the chess tables that stands up as a board from the chalk feet */
      const chalk = paintTex(1024, 360, (g, w, h) => {
        g.textAlign = 'center'; g.textBaseline = 'middle';
        fit(g, 'CHECKMATE', 'W2 Permanent Marker', h * 0.78, w * 0.92, '400');
        const cols = ['#f6d36b', '#7ad0ff', '#ff8fb0', '#a8f08a', '#ffffff'];
        g.lineWidth = 10; g.strokeStyle = 'rgba(30,40,60,0.55)'; g.strokeText('CHECKMATE', w / 2 + 10, h / 2 + 10);
        const gr = g.createLinearGradient(0, 0, w, 0); cols.forEach((c2, ci) => gr.addColorStop(ci / (cols.length - 1), c2));
        g.fillStyle = gr; g.fillText('CHECKMATE', w / 2, h / 2);
        const rnd = X.mulberry(7); g.globalCompositeOperation = 'destination-out';
        for (let n = 0; n < 2600; n++) { g.globalAlpha = 0.2 + rnd() * 0.5; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 5, 1 + rnd() * 2); }
        g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      }, ['W2 Permanent Marker']);
      anamorphTex(k, chalk, 31.5, -46, 3, 0, 0, 6, 4.6, 1.3, 0.9);
      const feet = paintTex(512, 256, (g, w, h) => { g.fillStyle = 'rgba(255,255,255,0.85)'; g.textAlign = 'center'; g.textBaseline = 'middle'; fit(g, 'STAND HERE', 'W2 Permanent Marker', 70, w * 0.9, '400'); g.fillText('STAND HERE', w / 2, h * 0.75); for (const fx of [-50, 50]) { g.beginPath(); g.ellipse(w / 2 + fx, h * 0.3, 22, 44, 0, 0, PI * 2); g.fill(); } });
      k.mesh(new T.PlaneGeometry(1.4, 0.7), new T.MeshBasicMaterial({ map: feet, transparent: true, depthWrite: false }), 31.5, 0.02, -45.6, true).rotation.x = -PI / 2;
      k.egg(v(31.5, 0.5, -54), { id: 'washington-chalk', title: 'The chalk that stands up', text: 'Stand on the chalk feet and the word drawn flat on the path rises off the ground. Pavement artists draw these stretched pictures so they only come right from one spot; the trick is anamorphosis, a picture distorted so it resolves from a single point of view.', clue: 'Find the chalk feet on the path by the chess tables and stand on them.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.6 });
    }
    /* landmark eggs */
    const ARCH = { name: 'Washington Square Arch, Wikipedia', url: 'https://en.wikipedia.org/wiki/Washington_Square_Arch' };
    k.egg(v(0, 20, AZ), { id: 'washington-arch', title: 'First in wood', year: '1895', text: 'A temporary arch of plaster and wood went up over Fifth Avenue in 1889 for the centennial of Washington\'s inauguration. Stanford White\'s permanent arch of white Tuckahoe marble, modelled on the Arch of Titus in Rome, followed and was dedicated in 1895: 77 feet high, its piers 30 feet apart. The flying figures in the spandrels are winged victories by Frederick MacMonnies, the keystone eagles are by Philip Martiny.', clue: 'Look up at the top of the arch.', source: ARCH }, { r: 3 });
    k.egg(v(-11.7, 1.0, AZ), { id: 'washington-coffin', title: 'A gravestone from 1803', text: 'Digging the foundation for the eastern pier, workers found human remains, a coffin and a gravestone dated 1803, about 10 feet below the ground.', clue: 'Stand at the foot of the eastern pier.', source: ARCH }, { r: 1.2 });
    k.egg(v(11.7, 2.0, AZ), { id: 'washington-republic', title: 'The republic on the roof', year: '1917', text: 'After dark on 23 January 1917, John Sloan, Marcel Duchamp, the poet Gertrude Drick and three actors slipped through a little door in the west pier, climbed the spiral stair and came out on top of the arch. They picnicked, fired cap pistols and declared the Free and Independent Republic of Washington Square; Sloan made an etching of it, Arch Conspirators.', clue: 'Find the door in the west pier.', source: { name: '100 Years Ago Today: Arch Conspirators, Washington Square Park Blog', url: 'https://www.washingtonsquareparkblog.com/2017/01/23/100-years-ago-today-arch-conspirators-free-and-independent-washington-square-park/' } }, { r: 1.2 });
    const WSP = { name: 'Washington Square Park, Wikipedia', url: 'https://en.wikipedia.org/wiki/Washington_Square_Park' };
    k.egg(v(-22, 0.6, -78), { id: 'washington-pottersfield', title: 'Twenty thousand underfoot', text: 'Before it was a park this was a potter\'s field, a burial ground for yellow fever victims and the city\'s poor, with an estimated 10,000 to 22,000 burials between 1789 and 1823. The remains of more than 20,000 people still rest under the square.', clue: 'Walk out onto the south lawn and look down.', source: WSP }, { r: 1.6 });
    k.egg(v(0, 3, -30), { id: 'washington-fountain', title: 'A fountain that moved', year: '2009', text: 'The first fountain here was finished in 1852 and replaced in 1872. A $2.5 million gift named it the Tisch Fountain in 2005, and the redesign that followed shifted it off its old centre so it lines up with the arch and Fifth Avenue.', clue: 'Look along Fifth Avenue through the arch to the fountain jet.', source: WSP }, { r: 2 });
    k.egg(v(44, 4, 12), { id: 'washington-elm', title: 'The tree nobody was hanged from', text: 'The Hangman\'s Elm in the northwest corner is an English elm, estimated in 1989 at 310 years old and considered the oldest tree in Manhattan. No public record exists of a hanging from it; the only recorded execution nearby was Rose Butler\'s, in 1820, about 500 feet away in the potter\'s field.', clue: 'Find the giant elm in the northwest corner of the park.', source: { name: 'Hangman\'s Elm, Wikipedia', url: 'https://en.wikipedia.org/wiki/Hangman%27s_Elm' } }, { r: 2.4 });
    const easelM = k.flat(0xe2ded6, 0.05, 0.65);
    // the works: steel easels around the fountain ring, the arch piers, plinths on the axes
    const mounts: Mount[] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * PI * 2 + PI / 24, r = 15.5, x = Math.cos(a) * r, z = -30 + Math.sin(a) * r;
      /* 2026-11-23: a slim board on two legs, not a slab that hid the fountain */
      k.box(0.12, 3.3, 5.3, 0, 0, 0, easelM).position.set(x, 2.6, z);
      k.objects[k.objects.length - 1].rotation.y = -a - PI / 2;
      for (const sd of [-1, 1]) { const tx = -Math.sin(a) * sd * 2.3, tz = Math.cos(a) * sd * 2.3; k.box(0.14, 1.0, 0.14, x + tx, 0.5, z + tz, iron); }
      k.box(1.0, 0.25, 6, 0, 0, 0, granite).position.set(x, 0.12, z);
      k.objects[k.objects.length - 1].rotation.y = -a - PI / 2;
      mounts.push({ position: v(x + Math.cos(a) * 0.2, 2.6, z + Math.sin(a) * 0.2), rotation: -a + PI / 2, target: v(Math.cos(a) * (r + 4.5), 3, -30 + Math.sin(a) * (r + 4.5)), width: 4.8, height: 2.8, style: 'steel', wash: false });
    }
    for (const s of [-1, 1]) { mounts.push({ position: v(s * 8.6, 3.2, AZ - 2.65), rotation: PI, target: v(s * 8.6, 3, AZ - 8), width: 4.6, height: 2.7, style: 'white', wash: false }); mounts.push({ position: v(s * 5.65, 3.2, AZ), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 1.2, 3, AZ), width: 3.6, height: 2.2, style: 'white', wash: false }); }
    for (const a of [PI / 4, (3 * PI) / 4, (5 * PI) / 4, (7 * PI) / 4]) { const x = Math.cos(a) * 34, z = -30 + Math.sin(a) * 34; k.box(0.4, 4, 5, 0, 0, 0, granite).position.set(x, 2, z); k.objects[k.objects.length - 1].rotation.y = -a - PI / 2; mounts.push({ position: v(x - Math.cos(a) * 0.25, 2.6, z - Math.sin(a) * 0.25), rotation: -a - PI / 2, target: v(Math.cos(a) * 29, 3, -30 + Math.sin(a) * 29), width: 4.4, height: 2.6, style: 'steel', wash: false }); }
    // Expanded south and west park rooms: additional art stays clear of the arch/fountain axis.
    for (const sx of [-1, 1]) {
      k.rail(sx * 53, -34, 102, iron, 1.05, 'z', 2);
      for (let i = 0; i < 4; i++) {
        const z = -73 + i * 18, x = sx * 46;
        const m: Mount = { position: v(x, 3.1, z), rotation: sx < 0 ? PI / 2 : -PI / 2, target: v(sx * 40, 3, z), width: 5.4, height: 3.2, style: 'steel', wash: false };
        const back = k.box(.3, 4.8, 6.1, x + sx * .2, 2.6, z, iron);
        void back; mounts.push(m);
      }
    }
    k.sign('THE PARK / THE PEOPLE', 8, .7, 0, 1.1, -84, '#26342c', '#ebe6da', 55);
    return { mounts, spawn: v(0, 3, 7), look: v(0, 9, AZ), eye: 3, bounds: [-58, 58, -95, AZ + 60], style: 'steel' };
  },
};
