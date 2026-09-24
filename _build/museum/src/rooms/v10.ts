/* 156 to 158: three Manhattan synagogues, built the way a respectful visitor would photograph them.
   Temple Emanu-El on Fifth Avenue at 65th Street, Kehilath Jeshurun on East 85th Street and the Jewish
   Center on West 86th Street. House of worship rules: no likeness of any real person, no sacred text
   (tablets and doors are blank or carry abstract marks), and the New Yorkers hang only where a
   congregation honestly shows art: the vestibule, the lobby, the museum galleries, the school corridor,
   the social hall. Each sanctuary is the view you walk into, with its eternal light lit. */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as X from '../textures';
import { v, type Mount } from '../kit';
import type { RoomDef } from './types';
const PI = Math.PI;
type K = Parameters<RoomDef['build']>[0];
const one = new T.Vector3(1, 1, 1);

/* a texture painted once on a canvas */
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat = false) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) t.wrapS = t.wrapT = T.RepeatWrapping;
  return t;
}
/* a small figure with a head, as one merged geometry for instancing */
function figureGeo(r = 0.2, len = 0.82, headY = 1.35) {
  const body = new T.CapsuleGeometry(r, len, 3, 8); body.translate(0, r + len / 2, 0);
  const head = new T.SphereGeometry(r * 0.62, 10, 8); head.translate(0, headY, 0);
  return mergeGeometries([body.toNonIndexed(), head.toNonIndexed()])!;
}
/* a standing figure that never moves, batched with everything else of its colour */
function figure(k: K, x: number, y: number, z: number, coat: number, p: { h?: number; rotY?: number } = {}) {
  const { h = 1, rotY = 0 } = p;
  const body = k.mesh(new T.CapsuleGeometry(0.2, 0.82 * h, 3, 8), k.flat(coat, 0, 0.85), x, y + 0.61 * h, z);
  body.rotation.y = rotY;
  k.mesh(new T.SphereGeometry(0.125, 10, 8), k.flat(0xc8a284, 0, 0.7), x, y + (1.22 * h + 0.13), z);
  return body;
}
type Hole = { cx: number; y0: number; w: number; h: number; square?: boolean; circle?: boolean };
/* a wall w wide, h tall and depth thick, centred on x = 0 and z = 0, with round headed or square openings */
function holed(w: number, h: number, depth: number, holes: Hole[]) {
  const s = new T.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.closePath();
  for (const o of holes) {
    const p = new T.Path(), a = o.w / 2;
    if (o.circle) { p.absarc(o.cx, o.y0 + o.h / 2, a, 0, PI * 2, false); s.holes.push(p); continue; }
    p.moveTo(o.cx - a, o.y0);
    if (o.square) { p.lineTo(o.cx - a, o.y0 + o.h); p.lineTo(o.cx + a, o.y0 + o.h); }
    else { const ys = o.y0 + o.h - a; p.lineTo(o.cx - a, ys); p.absarc(o.cx, ys, a, PI, 0, true); }
    p.lineTo(o.cx + a, o.y0); p.closePath();
    s.holes.push(p);
  }
  const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 18 });
  g.translate(0, 0, -depth / 2);
  return g;
}
/* the flat ring between two round headed outlines: a mosaic band round an arch */
function archRing(wo: number, ho: number, wi: number, hi: number, y0 = 0) {
  const s = new T.Shape(), ao = wo / 2, ai = wi / 2;
  s.moveTo(-ao, y0); s.lineTo(-ao, y0 + ho - ao); s.absarc(0, y0 + ho - ao, ao, PI, 0, true); s.lineTo(ao, y0);
  s.lineTo(ai, y0); s.lineTo(ai, y0 + hi - ai); s.absarc(0, y0 + hi - ai, ai, 0, PI, false); s.lineTo(-ai, y0); s.closePath();
  return new T.ShapeGeometry(s, 24);
}
/* stained glass: small irregular panes in deep colours, lead between them, a column of roundels */
function stainedGlass(seed: number, w: number, h: number, pal: number[], roundel = '#d8b848') {
  return canvasTex(w, h, (g) => {
    const rnd = X.mulberry(seed);
    g.fillStyle = '#0c0a0c'; g.fillRect(0, 0, w, h);
    const cell = 16;
    for (let y = 0; y < h; y += cell) for (let x = 0; x < w; x += cell) {
      const c = pal[Math.floor(rnd() * pal.length)], jx = (rnd() - 0.5) * 6, jy = (rnd() - 0.5) * 6, k2 = 0.75 + rnd() * 0.35;
      g.fillStyle = `rgb(${(((c >> 16) & 255) * k2) | 0},${(((c >> 8) & 255) * k2) | 0},${((c & 255) * k2) | 0})`;
      g.beginPath(); g.moveTo(x + 2 + jx, y + 2); g.lineTo(x + cell - 2, y + 2 + jy); g.lineTo(x + cell - 2 - jx, y + cell - 2); g.lineTo(x + 2, y + cell - 2 - jy); g.closePath(); g.fill();
    }
    /* small rosettes of lighter glass on a lead lattice, not pictures */
    const n = Math.max(2, Math.round(h / w) + 1);
    for (let i = 0; i < n; i++) {
      const cy = (h * (i + 0.6)) / (n + 0.2), cx = w / 2, r = w * 0.17;
      g.fillStyle = '#0c0a0c'; g.beginPath(); g.arc(cx, cy, r + 5, 0, PI * 2); g.fill();
      for (let q = 0; q < 8; q++) { const a = (q / 8) * PI * 2; g.fillStyle = q % 2 ? roundel : '#e8dcb8'; g.beginPath(); g.arc(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55, r * 0.4, 0, PI * 2); g.fill(); }
      g.fillStyle = i % 2 ? '#1c3a8a' : '#7a1a22'; g.beginPath(); g.arc(cx, cy, r * 0.3, 0, PI * 2); g.fill();
    }
    g.strokeStyle = '#0c0a0c'; g.lineWidth = 3; for (let y = h / 8; y < h; y += h / 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = '#0c0a0c'; g.fillRect(0, 0, w, 6); g.fillRect(0, h - 6, w, 6); g.fillRect(0, 0, 6, h); g.fillRect(w - 6, 0, 6, h);
  });
}
/* gold glass tesserae with a few coloured ones: tiles every four metres on world sized shape UVs */
function tesserae(seed: number, base: [number, number, number], accents: string[]) {
  const t = canvasTex(256, 256, (g) => {
    const rnd = X.mulberry(seed);
    g.fillStyle = '#1a140c'; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 8) for (let x = 0; x < 256; x += 8) {
      const k2 = 0.78 + rnd() * 0.4;
      g.fillStyle = rnd() < 0.05 ? accents[Math.floor(rnd() * accents.length)] : `rgb(${(base[0] * k2) | 0},${(base[1] * k2) | 0},${(base[2] * k2) | 0})`;
      g.fillRect(x + 1 + (rnd() - 0.5), y + 1 + (rnd() - 0.5), 6.4, 6.4);
    }
  }, true);
  t.repeat.set(0.25, 0.25);
  return t;
}
/* pews in banks: returns the seats so figures can sit in them */
function pews(k: K, banks: [number, number][], zFrom: number, zTo: number, pitch: number, oak: T.Material, oakDark: T.Material, block = true, y = 0) {
  const pew = mergeGeometries([new T.BoxGeometry(1, 0.08, 0.42).translate(0, 0.46, 0), new T.BoxGeometry(1, 0.55, 0.06).translate(0, 0.78, 0.22), new T.BoxGeometry(1, 0.2, 0.05).translate(0, 0.25, -0.2)].map((g) => g.toNonIndexed()))!;
  const end = new T.BoxGeometry(0.07, 1.05, 0.62).translate(0, 0.52, 0.05);
  const pm: T.Matrix4[] = [], em: T.Matrix4[] = [], seats: [number, number][] = [];
  const q = new T.Quaternion(), p = new T.Vector3(), sc = new T.Vector3();
  for (let z = zFrom; z > zTo; z -= pitch) for (const [xa, xb] of banks) {
    p.set((xa + xb) / 2, y, z); sc.set(xb - xa, 1, 1); pm.push(new T.Matrix4().compose(p, q, sc));
    for (const xe of [xa, xb]) { p.set(xe, y, z); em.push(new T.Matrix4().compose(p, q, one)); }
    for (let x = xa + 0.35; x < xb - 0.3; x += 0.6) seats.push([x, z]);
  }
  k.instances(pew, oak, pm); k.instances(end, oakDark, em);
  if (block) for (const [xa, xb] of banks) k.block(xa - 0.1, xb + 0.1, zTo + pitch * 0.5 - 0.4, zFrom + 0.4);
  return seats;
}
/* anonymous people sitting in pews, facing -z; floor y given */
function seated(k: K, seats: [number, number][], n: number, seed: number, y = 0, rotY = PI) {
  const rnd = X.mulberry(seed), N = Math.min(n, seats.length);
  const fig = k.instances(figureGeo(0.18, 0.46, 1.0), new T.MeshStandardMaterial({ roughness: 0.9 }), Array.from({ length: N }, () => new T.Matrix4()));
  const c = new T.Color(), pal = [0x1c232c, 0x2a2a34, 0x3a2e2a, 0xe8e2d4, 0x2a3f6a, 0x4a2a2a, 0x3a4a3a, 0x6a6a70, 0xb8a890];
  const used = new Set<number>(), q = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), rotY), p = new T.Vector3();
  for (let i = 0; i < N; i++) {
    let j = Math.floor(rnd() * seats.length); while (used.has(j)) j = (j + 7) % seats.length; used.add(j);
    p.set(seats[j][0], y + 0.5, seats[j][1] + 0.02);
    fig.setMatrixAt(i, new T.Matrix4().compose(p, q, new T.Vector3(1, 0.92, 1))); fig.setColorAt(i, c.set(pal[Math.floor(rnd() * pal.length)]));
  }
  fig.instanceMatrix.needsUpdate = true; if (fig.instanceColor) fig.instanceColor.needsUpdate = true;
  return fig;
}
/* the eternal light: a bronze lamp on a chain with a steady flame that breathes a little */
function nerTamid(k: K, x: number, y: number, z: number, top: number, bronze: T.Material, reduced: boolean, s = 1) {
  k.lathe([[0.02, -0.35 * s], [0.22 * s, -0.2 * s], [0.34 * s, 0], [0.3 * s, 0.12 * s], [0.18 * s, 0.16 * s]], x, y, z, bronze, 16);
  k.torus(0.3 * s, 0.03 * s, x, y + 0.02, z, bronze, 20).rotation.x = PI / 2;
  const glow = k.mesh(new T.SphereGeometry(0.2 * s, 12, 10), new T.MeshBasicMaterial({ color: 0xff7a30 }), x, y + 0.02, z, true);
  k.mesh(new T.SphereGeometry(0.34 * s, 12, 10), new T.MeshBasicMaterial({ color: 0xff8a40, transparent: true, opacity: 0.25, blending: T.AdditiveBlending, depthWrite: false }), x, y + 0.02, z, true);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * PI * 2; k.beam(v(x + Math.cos(a) * 0.3 * s, y + 0.1 * s, z + Math.sin(a) * 0.3 * s), v(x, y + 1.1 * s, z), 0.012, bronze, 4); }
  k.beam(v(x, y + 1.1 * s, z), v(x, top, z), 0.02, bronze, 4);
  const l = k.point(x, y - 0.2, z, 0xff8a40, 10 * s, 9 * s);
  if (!reduced) k.ticks.push((t) => { const f = 0.9 + 0.1 * Math.sin(t * 5.3) * Math.sin(t * 2.1 + 1); l.intensity = 10 * s * f; glow.scale.setScalar(0.96 + 0.06 * f); });
  return glow;
}
/* cabs and cars along a street on x, one instanced mesh */
function traffic(k: K, n: number, lanes: number[], dir: number, span: number, y: number, seed: number, reduced: boolean) {
  const cars = k.instances(new T.BoxGeometry(4.4, 1.45, 1.9), new T.MeshStandardMaterial({ roughness: 0.45, metalness: 0.3 }), Array.from({ length: n }, () => new T.Matrix4()));
  const tops = k.instances(new T.BoxGeometry(2.3, 0.6, 1.7), new T.MeshStandardMaterial({ roughness: 0.2, metalness: 0.5, color: 0x1a2028 }), Array.from({ length: n }, () => new T.Matrix4()));
  cars.frustumCulled = tops.frustumCulled = false;
  const rnd = X.mulberry(seed), c = new T.Color();
  const st = Array.from({ length: n }, (_, i) => ({ s: rnd() * span, lane: lanes[i % lanes.length], v: 6 + rnd() * 5 }));
  st.forEach((_, i) => cars.setColorAt(i, c.set(i % 3 !== 2 ? 0xf2c21a : [0x1c1e22, 0xe8e8e8, 0x2a3a5a, 0x6a1a1a][i % 4])));
  if (cars.instanceColor) cars.instanceColor.needsUpdate = true;
  const m = new T.Matrix4();
  const place = (_t: number, dt: number) => {
    st.forEach((a, i) => {
      a.s = (a.s + a.v * Math.min(dt, 0.1)) % span; const x = dir * (a.s - span / 2);
      m.makeTranslation(x, y + 0.85, a.lane); cars.setMatrixAt(i, m);
      m.makeTranslation(x - dir * 0.2, y + 1.85, a.lane); tops.setMatrixAt(i, m);
    });
    cars.instanceMatrix.needsUpdate = tops.instanceMatrix.needsUpdate = true;
  };
  place(0, 0); if (!reduced) k.ticks.push(place);
}
/* pigeons on a pavement: they peck, shuffle and every so often hop */
function pigeons(k: K, spots: [number, number][], y: number, seed: number, reduced: boolean) {
  const body = mergeGeometries([new T.SphereGeometry(0.13, 8, 6).scale(1, 0.8, 1.5).toNonIndexed(), new T.SphereGeometry(0.07, 8, 6).translate(0, 0.1, 0.16).toNonIndexed()])!;
  const o = k.instances(body, k.flat(0x6a6e78, 0, 0.8), spots.map(() => new T.Matrix4()));
  o.frustumCulled = false;
  const rnd = X.mulberry(seed), ph = spots.map(() => ({ p: rnd() * 10, a: rnd() * PI * 2 }));
  const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), up = new T.Vector3(0, 1, 0);
  const place = (t: number) => {
    spots.forEach(([x, z], i) => {
      const a = ph[i], hop = Math.max(0, Math.sin(t * 0.7 + a.p) - 0.93) * 6, peck = Math.max(0, Math.sin(t * 4 + a.p * 3)) * 0.05;
      q.setFromAxisAngle(up, a.a + Math.sin(t * 0.3 + a.p) * 1.2);
      p.set(x + Math.sin(t * 0.2 + a.p) * 0.4, y + 0.1 + hop - peck, z + Math.cos(t * 0.17 + a.p) * 0.4);
      m.compose(p, q, one); o.setMatrixAt(i, m);
    });
    o.instanceMatrix.needsUpdate = true;
  };
  place(0); if (!reduced) k.ticks.push(place);
}
const wallBlock = (k: K, x0: number, x1: number, z0: number, z1: number) => k.block(Math.min(x0, x1), Math.max(x0, x1), Math.min(z0, z1), Math.max(z0, z1));

/* ---------------- 156 TEMPLE EMANU-EL ---------------- */
export const templeemanuel: RoomDef = {
  id: 'templeemanuel',
  name: 'Temple Emanu-El',
  area: 'TEMPLE EMANU-EL / FIFTH AVENUE AT 65TH STREET',
  mood: 'Late afternoon, a gold arch and one red light',
  color: '#b89a5a',
  daylit: false,
  description: 'Just inside the bronze doors on Fifth Avenue, under the gallery, with the sanctuary opening ahead: one of the largest synagogue halls in the world, a painted coffered ceiling a hundred feet up, tall windows down both walls and, at the far end, the great arch in gold mosaic round the ark with the eternal light burning in front of it. The New Yorkers hang in the vestibule and in the museum galleries off it, never in the hall; Central Park is across the avenue behind you.',
  signatures: 'The limestone front on Fifth Avenue with its great recessed arch and arched window over three bronze doors, the vestibule under the gallery, the sanctuary with its coffered ceiling and stained glass, the mosaic arch round the ark, the eternal light, the bimah and the organ pipes, the domed Beth-El Chapel with its Tiffany windows, the Bernard Museum of Judaica, and yellow cabs going down Fifth beside the Central Park wall.',
  build(k, ctx) {
    k.sky({ top: 0x4f86cc, horizon: 0xe6dccb, ground: 0x6a6660, fog: 0.0022, sun: { az: -0.5, el: 0.55, color: 0xffe8c8, size: 7 }, env: 0.35 });
    k.hemi(0xf4e6d0, 0x5a4c3e, 0.55);
    k.sun(0xffe6c4, 2.6, -30, 45, 70, true, 70);
    const lime = k.pbr('teLime', X.ashlar(0xd6cab0, 156, 6), 0.5, { normal: 0.45, roughness: 0.85 }),
      limeDark = k.pbr('teLime2', X.ashlar(0xb4a688, 157, 4), 0.55, { normal: 0.4 }),
      wallM = k.pbr('teWall', X.plaster(0xcbb48e, 158), 0.25, { roughness: 0.9 }),
      stoneIn = k.pbr('teStoneIn', X.ashlar(0xbfa780, 159, 5), 0.6, { normal: 0.35, roughness: 0.8 }),
      marbleF = k.pbr('teFloor', X.marble(0xc9bca4, 0x8a7a64, 160), 0.25, { roughness: 0.35 }),
      marbleDark = k.pbr('teFloor2', X.marble(0x5a3a30, 0x2a1a16, 161), 0.4, { roughness: 0.3 }),
      carpet = k.pbr('teCarpet', X.carpet(0x5a1a22, 0x9a7a3a), 0.6, { roughness: 1 }),
      oak = k.pbr('teOak', X.planks(0x5a3a22, 5, 162), 0.8, { roughness: 0.6 }), oakDark = k.flat(0x3a2616, 0, 0.6),
      bronze = k.flat(0x7a5a2e, 0.9, 0.38), gilt = k.pbr('teGilt', X.gilt(), 2, { metalness: 0.9, roughness: 0.3 }),
      dark = k.flat(0x14100c, 0, 0.9), iron = k.flat(0x1c1a18, 0.6, 0.5),
      galleryWall = k.flat(0x33403f, 0, 0.9), oakFloor = k.pbr('teMuseumFloor', X.planks(0x8a6a48, 7, 163), 0.7, { roughness: 0.55 }),
      pave = k.pbr('tePave', X.pavers(0x9a948a, 164), 0.5), asphalt = k.pbr('teAsph', X.asphalt(), 0.2),
      parkStone = k.pbr('teParkWall', X.ashlar(0x8a8274, 165, 3), 0.5), grass = k.pbr('teGrass', X.grass(0x4a6a3a, 166), 0.3);
    const SX = 12, Z_V = -1.2, Z_S = -8, Z_E = -52, H = 31, BAL = 6.2;

    /* ---- the street: pavement, Fifth Avenue going downtown, the Central Park wall and its trees ---- */
    k.box(80, 0.3, 6, -8, -0.15, 3, pave);
    k.box(80, 0.2, 15, -8, -0.25, 13.5, asphalt);
    for (let x = -46; x < 30; x += 6) k.box(3, 0.02, 0.15, x, -0.14, 13.5, k.flat(0xd8d2c0, 0, 0.8));
    k.box(80, 0.3, 4, -8, -0.15, 23, pave);
    k.box(80, 1.2, 0.6, -8, 0.6, 25.3, parkStone); k.box(80, 0.15, 0.8, -8, 1.25, 25.3, limeDark);
    k.box(80, 0.4, 30, -8, -0.1, 41, grass);
    for (let i = 0; i < 16; i++) k.tree(-44 + i * 5 + (i % 2) * 1.6, 0, 29 + (i % 3) * 4.5, { h: 6 + (i % 4), r: 3 + (i % 3) * 0.6, seed: 156 + i, leaf: [0x3f6b3e, 0x4a7a3a, 0x5a7a34][i % 3] });
    for (const x of [-26, -6, 10]) k.lamp(x, 5.3, 5.2, iron, 0xffe0b0, 10);
    /* 65th Street along the south wall, and the neighbours */
    k.box(3, 0.3, 60, 14.8, -0.15, -24, pave); k.box(10, 0.2, 90, 21, -0.25, -18, asphalt);
    const flats = k.pbr('teFlats', X.windows(156, 0.25, 0xb8ae98, true), 0.12, { stretch: 0.45, roughness: 0.8 });
    k.box(16, 50, 44, -39.5, 25, -21, flats); k.box(20, 46, 60, 36, 23, -22, flats);
    k.box(16.4, 0.6, 44.4, -39.5, 50.3, -21, limeDark); k.box(20.4, 0.6, 60.4, 36, 46.3, -22, limeDark);

    /* ---- the Fifth Avenue front: a projecting limestone block with the great recessed arch ---- */
    { const o = k.mesh(holed(26.6, 33, 2.5, [{ cx: 0, y0: 0.02, w: 14, h: 27.5 }]), lime, 0, 0, 1.25); void o; }
    /* the gable and a Romanesque corbel table under it */
    { const g = new T.Shape(); g.moveTo(-13.6, 0); g.lineTo(13.6, 0); g.lineTo(0, 4.6); g.closePath(); const gg = new T.ExtrudeGeometry(g, { depth: 2.6, bevelEnabled: false }); gg.translate(0, 0, -1.3); k.mesh(gg, lime, 0, 33, 1.2); }
    k.box(27.4, 0.5, 2.9, 0, 32.9, 1.25, limeDark);
    k.arcade(26.4, 1.3, 0.3, 22, 0.8, 1.05, 0, 31.2, 2.62, limeDark);
    /* the arch mouldings: three receding rings round the recess */
    for (let i = 0; i < 3; i++) { const g = archRing(14 + 1.2 - i * 0.4, 27.5 + 0.6 - i * 0.2, 14 - i * 0.4 + 0.2, 27.5 - i * 0.2, 0); k.mesh(g, i % 2 ? limeDark : lime, 0, 0, 2.52 - i * 0.02).scale.z = 1; }
    for (const s of [-1, 1]) { k.column(s * 7.4, 0, 2.3, 18.5, 0.42, limeDark); }
    /* the back of the recess: three doors, a carved band, the great window */
    k.mesh(holed(26.6, 33, 1.2, [{ cx: -4.4, y0: 0.02, w: 2.4, h: 4.8, square: true }, { cx: 0, y0: 0.02, w: 2.4, h: 4.8, square: true }, { cx: 4.4, y0: 0.02, w: 2.4, h: 4.8, square: true }, { cx: 0, y0: 9.5, w: 11, h: 16.5 }]), lime, 0, 0, -0.6);
    k.box(13.6, 1.3, 0.3, 0, 6.2, 0.12, limeDark);
    for (const cx of [-4.4, 0, 4.4]) { k.box(3.1, 0.35, 0.35, cx, 5.0, 0.1, limeDark); for (const s of [-1, 1]) k.box(0.3, 4.9, 0.3, cx + s * 1.35, 2.45, 0.1, limeDark); }
    const winTex = stainedGlass(1560, 352, 528, [0xc89a3a, 0xb8782a, 0x2a4a98, 0x1c3a7a, 0x8a1a22, 0xd8c890, 0x3a6a4a]);
    const winM = new T.MeshBasicMaterial({ map: winTex, side: T.DoubleSide, color: 0xd8d0c4 });
    k.plane(11, 16.5, 0, 9.5 + 8.25, -0.6, winM);
    for (const x of [-2.75, 0, 2.75]) k.box(0.28, 16.5, 0.5, x, 9.5 + 8.25, -0.6, limeDark);
    for (const y of [13.5, 17.5]) k.box(11, 0.26, 0.5, 0, y, -0.6, limeDark);
    k.torus(2.4, 0.16, 0, 20.5, -0.6, limeDark, 40);
    /* the bronze doors, open: two leaves each, one on the centre door swinging slowly on its hinge */
    const leaves: T.Object3D[] = [];
    for (const cx of [-4.4, 0, 4.4]) for (const s of [-1, 1]) {
      const g = new T.Group(); g.position.set(cx + s * 1.2, 0, 0.05); g.rotation.y = s * 1.35;
      const leaf = new T.Mesh(new T.BoxGeometry(1.2, 4.7, 0.12), bronze); leaf.position.set(-s * 0.6, 2.35, 0); g.add(leaf);
      for (const y of [1.2, 2.4, 3.6]) { const p = new T.Mesh(new T.BoxGeometry(0.9, 0.05, 0.16), gilt); p.position.set(-s * 0.6, y, 0); g.add(p); }
      k.add(g); leaves.push(g);
    }
    if (!ctx.reduced) k.ticks.push((t) => { leaves[2].rotation.y = -0.95 - 0.4 * Math.sin(t * 0.35); });
    k.sign('TEMPLE EMANU-EL', 3.6, 0.5, 9.4, 3.2, 2.55, '#2a2218', '#d8c89a', 110);
    /* the north wing on Fifth: lower, arched windows, the chapel dome showing over it */
    k.mesh(holed(17.7, 17, 1.2, [0, 1, 2, 3].map((i) => ({ cx: -6.6 + i * 4.4, y0: 7, w: 2.2, h: 6 }))), lime, -22.15, 0, -0.6);
    for (let i = 0; i < 4; i++) k.plane(2.2, 6, -28.75 + i * 4.4, 10, -0.6, winM);
    k.box(18.2, 0.5, 1.8, -22.15, 17.1, -0.4, limeDark);
    k.cyl(5.6, 3, -22, 17.5, -27.5, lime, 5.6, 24);
    k.mesh(new T.SphereGeometry(5.4, 24, 10, 0, PI * 2, 0, PI / 2), k.flat(0x6a8a7a, 0.4, 0.5), -22, 19, -27.5);
    k.box(18.6, 0.8, 39, -22.15, 16.6, -19.1, limeDark);
    /* the south flank on 65th Street and the roof over the hall */
    k.box(2 * SX + 3, 1.2, Z_V - Z_E + 5, 0, H + 0.8, (Z_V + Z_E) / 2 - 1.5, dark);

    /* ---- the vestibule under the gallery ---- */
    k.box(2 * SX + 1, 0.3, Z_V - Z_S + 0.2, 0, -0.15, (Z_V + Z_S) / 2, marbleF);
    k.box(2 * SX + 1, 0.6, -Z_S + Z_V + 0.6 + 7.3, 0, BAL + 0.3, (Z_V - 15.5) / 2, stoneIn);
    k.plane(2 * SX, Z_V - Z_S, 0, BAL - 0.01, (Z_V + Z_S) / 2, k.flat(0xd8c8a8, 0, 0.9), 0, PI / 2);
    for (let z = -2; z > -8; z -= 1.9) k.box(2 * SX, 0.25, 0.3, 0, BAL - 0.13, z, gilt);
    k.mesh(holed(2 * SX + 1, BAL, 0.6, [{ cx: 0, y0: 0.02, w: 5.6, h: 5.6 }]), stoneIn, 0, 0, Z_S - 0.3);
    k.mesh(archRing(6.4, 6.0, 5.6, 5.6, 0), gilt, 0, 0.02, Z_S + 0.02);
    for (const sx of [-1, 1]) k.box(SX - 2.3, 0.9, 0.12, sx * (SX + 3.3) / 2, 0.45, Z_S + 0.06, limeDark);
    for (const x of [-6.55, 6.55]) k.box(0.8, BAL, 0.3, x, BAL / 2, Z_S + 0.12, limeDark);
    for (const x of [-9, -3, 3, 9]) { k.beam(v(x, BAL, -4.6), v(x, BAL - 1.2, -4.6), 0.015, bronze, 4); k.sphere(0.32, x, BAL - 1.45, -4.6, k.glow(0xffd8a0), 12); }
    for (const x of [-6, 6]) k.point(x, 4.6, -4.6, 0xffd8a8, 16, 12);
    /* the south end of the vestibule: a plain stone wall for two works */
    /* the north end: the door to the museum */
    k.box(0.9, 4.2, 0.3, -12.5, 2.1, -3.35, limeDark); k.box(0.9, 4.2, 0.3, -12.5, 2.1, -6.65, limeDark); k.box(0.9, 0.4, 3.6, -12.5, 4.2, -5, limeDark);
    k.sign('BERNARD MUSEUM OF JUDAICA', 3.2, 0.34, -11.95, 4.75, -5, '#2a2218', '#d8c89a', 60, PI / 2);

    /* ---- the sanctuary ---- */
    k.box(2 * SX, 0.3, Z_S - Z_E, 0, -0.15, (Z_S + Z_E) / 2, marbleF);
    k.box(2.4, 0.02, -15.5 - Z_E - 10, 0, 0.01, (-15.5 + Z_E + 10) / 2, carpet);
    for (const s of [-1, 1]) {
      const wzc = (Z_V + Z_E) / 2 - 1.5, holes: Hole[] = [-14, -22, -30, -38, -46].map((z) => ({ cx: wzc - z, y0: 10.5, w: 3.6, h: 13 }));
      if (s < 0) holes.push({ cx: wzc + 5, y0: 0.02, w: 3, h: 4, square: true });
      const w = k.mesh(holed(Z_V - Z_E + 3, H, 1, holes), wallM, s * (SX + 0.5), 0, wzc);
      w.rotation.y = PI / 2;
      k.box(0.3, 8, Z_S - Z_E, s * (SX - 0.1), 4, (Z_S + Z_E) / 2, stoneIn);
      k.box(0.6, 0.5, Z_S - Z_E, s * (SX - 0.2), 8.2, (Z_S + Z_E) / 2, limeDark);
      k.box(0.8, 0.9, Z_S - Z_E, s * (SX - 0.25), 27.6, (Z_S + Z_E) / 2, limeDark);
      for (const z of [-10, -18, -26, -34, -42, -50]) k.box(0.5, 27, 0.9, s * (SX - 0.35), 13.5, z, stoneIn);
    }
    const glassPal = [[0x2a4a98, 0x1c3a7a, 0xc89a3a, 0x8a1a22, 0xd8c890, 0x3a6a4a], [0xc89a3a, 0xb8782a, 0x2a4a98, 0x8a1a22, 0x5a2a6a, 0xd8c890], [0x1c3a7a, 0x2a5aa8, 0x3a7a8a, 0xc89a3a, 0x8a1a22]];
    const glassM = [0, 1, 2].map((i) => new T.MeshBasicMaterial({ map: stainedGlass(1570 + i, 176, 528, glassPal[i]), side: T.DoubleSide, color: 0xd0c8c0 }));
    for (const s of [-1, 1]) [-14, -22, -30, -38, -46].forEach((z, i) => k.plane(3.6, 13, s * (SX + 0.5), 10.5 + 6.5, z, glassM[(i + (s > 0 ? 1 : 0)) % 3], PI / 2));
    /* the coffered ceiling: deep blue coffers, red rosettes, gilt ribs */
    const coffer = canvasTex(256, 256, (g) => {
      g.fillStyle = '#6a4a28'; g.fillRect(0, 0, 256, 256);
      g.fillStyle = '#b8903a'; g.fillRect(10, 10, 236, 236);
      g.fillStyle = '#1e2a52'; g.fillRect(26, 26, 204, 204);
      g.fillStyle = '#2a3a6a'; g.fillRect(44, 44, 168, 168);
      g.strokeStyle = '#c8a048'; g.lineWidth = 4; g.strokeRect(58, 58, 140, 140);
      g.fillStyle = '#8a2a22'; g.beginPath(); for (let q = 0; q < 16; q++) { const a = (q / 16) * PI * 2, rr = q % 2 ? 26 : 50; g.lineTo(128 + Math.cos(a) * rr, 128 + Math.sin(a) * rr); } g.closePath(); g.fill();
      g.fillStyle = '#d8b050'; g.beginPath(); g.arc(128, 128, 16, 0, PI * 2); g.fill();
    }, true);
    coffer.repeat.set(8, 15);
    k.plane(2 * SX, Z_V - Z_E, 0, H, (Z_V + Z_E) / 2, new T.MeshStandardMaterial({ map: coffer, roughness: 0.8, emissive: 0xffffff, emissiveMap: coffer, emissiveIntensity: 0.22 }), 0, PI / 2);
    for (let z = -4; z > Z_E; z -= 6) k.box(2 * SX, 0.9, 0.7, 0, H - 0.45, z, gilt);
    /* the gallery over the vestibule: tiered seats and a gilt parapet */
    k.box(2 * SX, 1.5, 0.4, 0, BAL + 0.75 + 0.6, -15.5, oakDark); k.box(2 * SX, 0.2, 0.6, 0, BAL + 1.6 + 0.6, -15.5, gilt); k.box(2 * SX, 0.12, 0.44, 0, BAL + 0.75, -15.5, gilt);
    for (let x = -10.5; x <= 10.5; x += 1.5) k.box(1.1, 0.9, 0.06, x, BAL + 1.35, -15.28, oak);
    k.plane(2 * SX, 7.5, 0, BAL - 0.01, -11.75, k.flat(0xd8c8a8, 0, 0.9), 0, PI / 2);
    for (let z = -9.5; z > -15.5; z -= 2) k.box(2 * SX, 0.25, 0.3, 0, BAL - 0.13, z, gilt);
    for (let i = 0; i < 6; i++) k.box(2 * SX, 0.5 + i * 0.5, 1.2, 0, BAL + 0.6 + (0.5 + i * 0.5) / 2, -14.4 + i * 1.3, oakDark);
    /* the east wall with the great arch, the mosaic round it, the niche and the ark */
    const BIM = 1.6, AW = 13, AH = 24, ZN = Z_E - 3.2;
    k.mesh(holed(2 * SX + 1, H, 0.8, [{ cx: 0, y0: BIM, w: AW, h: AH }]), wallM, 0, 0, Z_E - 0.4);
    const goldT = tesserae(1580, [214, 168, 72], ['#2a4a98', '#8a1a22', '#e8dcc0']);
    const goldM = new T.MeshStandardMaterial({ map: goldT, metalness: 0.55, roughness: 0.35, emissive: 0xffffff, emissiveMap: goldT, emissiveIntensity: 0.16, side: T.DoubleSide });
    const blueT = tesserae(1581, [36, 60, 140], ['#d8a848', '#e8dcc0', '#8a1a22']);
    const blueM = new T.MeshStandardMaterial({ map: blueT, metalness: 0.2, roughness: 0.45, emissive: 0xffffff, emissiveMap: blueT, emissiveIntensity: 0.18, side: T.DoubleSide });
    const redT = tesserae(1582, [150, 34, 34], ['#d8a848', '#2a4a98']);
    const redM = new T.MeshStandardMaterial({ map: redT, metalness: 0.2, roughness: 0.45, emissive: 0xffffff, emissiveMap: redT, emissiveIntensity: 0.18, side: T.DoubleSide });
    k.mesh(archRing(AW + 5.2, AH + 2.6, AW + 3.6, AH + 1.8, BIM), goldM, 0, 0, Z_E + 0.03);
    k.mesh(archRing(AW + 3.6, AH + 1.8, AW + 2.2, AH + 1.1, BIM), blueM, 0, 0, Z_E + 0.04);
    k.mesh(archRing(AW + 2.2, AH + 1.1, AW + 1.2, AH + 0.6, BIM), redM, 0, 0, Z_E + 0.05);
    k.mesh(archRing(AW + 1.2, AH + 0.6, AW, AH, BIM), goldM, 0, 0, Z_E + 0.06);
    /* the niche: side walls, a half dome vault and a back wall, all in gold */
    const spring = BIM + AH - AW / 2;
    k.plane(AW, AH + 1, 0, BIM + (AH + 1) / 2, ZN, goldM);
    for (const s of [-1, 1]) k.plane(ZN - Z_E - 0.4 < 0 ? Z_E - ZN : 3.2, spring - BIM, s * AW / 2, (spring + BIM) / 2, (Z_E + ZN) / 2 - 0.2, goldM, -s * PI / 2);
    { const g = new T.CylinderGeometry(AW / 2, AW / 2, Z_E - ZN, 32, 1, true, PI / 2, PI); g.rotateX(PI / 2); k.mesh(g, goldM, 0, spring, (Z_E + ZN) / 2 - 0.2); }
    k.box(AW, 0.1, Z_E - ZN, 0, BIM, (Z_E + ZN) / 2, marbleDark);
    /* the ark: a marble frame, bronze doors with an abstract lattice, columns and a crowning arch */
    const AZ = ZN + 0.4;
    k.box(7.2, 10, 0.8, 0, BIM + 5, AZ, marbleDark);
    k.box(4.2, 7.2, 0.3, 0, BIM + 0.4 + 3.6, AZ + 0.5, bronze);
    for (let i = 1; i < 6; i++) k.box(4.2, 0.06, 0.36, 0, BIM + 0.4 + i * 1.2, AZ + 0.52, gilt);
    for (const x of [-1.4, 0, 1.4]) k.box(0.06, 7.2, 0.36, x, BIM + 0.4 + 3.6, AZ + 0.52, gilt);
    k.mesh(archRing(7.6, 4.4, 5.4, 3.3, 0), gilt, 0, BIM + 9.4, AZ + 0.45);
    for (const s of [-1, 1]) k.column(s * 4.6, BIM, AZ + 0.8, 10.5, 0.35, marbleDark, false, gilt);
    for (let i = 0; i < 4; i++) k.box(10 - i * 0.6, 0.25, 0.9 - i * 0.1, 0, BIM - 0.12 + i * 0.25 + 0.25, AZ + 1.4 - i * 0.2, marbleF);
    /* the organ pipes either side of the arch, high up */
    {
      const pm: T.Matrix4[] = [], q = new T.Quaternion(), p = new T.Vector3(), sc = new T.Vector3();
      for (const s of [-1, 1]) for (let j = 0; j < 9; j++) { const h = 7 - Math.abs(j - 4) * 0.8; p.set(s * (9.2 + j * 0.3), 14 + h / 2, Z_E + 0.4); sc.set(1, h, 1); pm.push(new T.Matrix4().compose(p, q, sc)); }
      k.instances(new T.CylinderGeometry(0.12, 0.12, 1, 10), k.flat(0xc8b890, 1, 0.3), pm);
      for (const s of [-1, 1]) { k.box(3.6, 0.6, 0.8, s * 10.4, 13.7, Z_E + 0.4, oakDark); k.box(3.8, 0.4, 0.9, s * 10.4, 21.8, Z_E + 0.4, oakDark); }
    }
    /* the bimah: a broad marble platform, steps, two reading desks, candelabra */
    k.box(2 * SX, BIM, 9.6, 0, BIM / 2, Z_E + 4.8, marbleF);
    for (let i = 0; i < 4; i++) k.box(2 * SX - 2, (i + 1) * BIM / 4, 0.45, 0, (i + 1) * BIM / 8, Z_E + 9.6 + (3 - i) * 0.45 + 0.2, marbleF);
    k.box(2 * SX - 2, 0.9, 0.14, 0, BIM + 0.45, Z_E + 9.4, bronze);
    for (const s of [-1, 1]) {
      k.box(1.6, 1.2, 0.9, s * 3.4, BIM + 0.6, Z_E + 6, oak); k.box(1.8, 0.1, 1.1, s * 3.4, BIM + 1.25, Z_E + 6, oakDark).rotation.x = -0.2;
      const cx = s * 8, cz = Z_E + 5;
      k.cyl(0.07, 3, cx, BIM + 1.5, cz, bronze, 0.1, 8); k.cyl(0.4, 0.2, cx, BIM + 0.1, cz, bronze, 0.5, 12);
      for (let a = 1; a <= 3; a++) { const pts = Array.from({ length: 9 }, (_, i) => { const u = (i / 8) * PI; return v(cx - Math.cos(u) * a * 0.35, BIM + 2.2 - Math.sin(u) * a * 0.35 + a * 0.35, cz); }); k.curve(pts, 0.035, bronze, 12); }
      for (let a = -3; a <= 3; a++) k.sphere(0.07, cx + a * 0.35, BIM + 3.05, cz, k.glow(0xffc070), 8);
    }
    nerTamid(k, 0, 8.6, Z_E + 1.4, BIM + AH - 0.4, bronze, ctx.reduced, 1.4);
    /* lighting: a warm spot on the arch, lanterns down the hall, low fill */
    k.spot(0, H - 2, -30, 0, 10, Z_E, 0xffe2b0, 600, 0.5, 0.6, 60);
    k.point(0, 12, Z_E + 2, 0xffd49a, 60, 22);
    {
      const lantern = mergeGeometries([new T.TorusGeometry(1.4, 0.08, 6, 24).rotateX(PI / 2).toNonIndexed(), new T.TorusGeometry(0.9, 0.06, 6, 20).rotateX(PI / 2).translate(0, -0.6, 0).toNonIndexed(), new T.CylinderGeometry(0.3, 0.5, 0.8, 10).translate(0, -1, 0).toNonIndexed()])!;
      const lm: T.Matrix4[] = [], gm: T.Matrix4[] = [];
      for (const z of [-20, -30, -40]) for (const x of [-6, 6]) {
        lm.push(new T.Matrix4().makeTranslation(x, 14, z)); gm.push(new T.Matrix4().makeTranslation(x, 13.2, z));
        k.beam(v(x, 14, z), v(x, H, z), 0.03, iron, 4);
      }
      k.instances(lantern, bronze, lm); k.instances(new T.SphereGeometry(0.42, 12, 8), k.glow(0xffc880), gm);
      for (const z of [-20, -34]) for (const x of [-6, 6]) k.point(x, 12.5, z, 0xffcf96, 55, 22);
    }
    k.point(0, 4.5, -11.5, 0xffd8a8, 18, 12);
    /* the pews, and a scatter of people sitting quietly */
    const seats = pews(k, [[-10.2, -1.3], [1.3, 10.2]], -17, -38.5, 1.0, oak, oakDark);
    seated(k, seats, 46, 1563);

    /* ---- the Bernard Museum of Judaica: galleries off the vestibule ---- */
    const MX0 = -30.4, MX1 = -13, MZ0 = Z_V, MZ1 = -17;
    k.box(MX1 - MX0 + 0.6, 0.3, MZ0 - MZ1, (MX0 + MX1) / 2, -0.15, (MZ0 + MZ1) / 2, oakFloor);
    k.box(MX1 - MX0 + 0.6, 0.2, MZ0 - MZ1, (MX0 + MX1) / 2, 5.3, (MZ0 + MZ1) / 2, galleryWall);
    k.box(0.4, 5.2, MZ0 - MZ1, MX0 - 0.2, 2.6, (MZ0 + MZ1) / 2, galleryWall);
    k.box(0.1, 5.2, 10.4, -13.05, 2.6, -11.8, galleryWall); k.box(0.1, 5.2, 2.2, -13.05, 2.6, -2.3, galleryWall);
    k.plane(MX1 - MX0, MZ0 - MZ1, (MX0 + MX1) / 2, 5.19, (MZ0 + MZ1) / 2, k.flat(0x22282a, 0, 0.9), 0, PI / 2);
    k.box(MX1 - MX0, 5.2, 0.3, (MX0 + MX1) / 2, 2.6, Z_V - 0.1, galleryWall);
    k.mesh(holed(MX1 - MX0 + 0.4, 5.2, 0.5, [{ cx: -22 - (MX0 + MX1) / 2, y0: 0.02, w: 3, h: 3.6, square: true }]), galleryWall, (MX0 + MX1) / 2, 0, MZ1 - 0.3);
    for (let z = -3; z > -16; z -= 3.2) k.box(0.1, 0.1, 0.1, -21.7, 5.1, z, iron);
    for (const x of [-27, -22, -17]) k.box(0.06, 0.06, 14, x, 5.05, -9, iron);
    k.box(7.0, 9, 0.05, -26.9, 4.5, MZ1 - 0.58, stoneIn); k.box(7.6, 9, 0.05, -16.8, 4.5, MZ1 - 0.58, stoneIn); k.box(2.8, 5.4, 0.05, -22, 6.3, MZ1 - 0.58, stoneIn);
    for (const [x, z] of [[-27.5, -4.2], [-27.5, -8.6], [-27.5, -13], [-16.2, -4.2], [-16.2, -13], [-21.5, -4.2], [-21.5, -13.6]]) k.point(x, 4.6, z, 0xfff0dc, 16, 9);
    k.sign('BERNARD MUSEUM OF JUDAICA', 5, 0.42, -21.5, 4.4, -1.62, '#33403f', '#d8c89a', 60, PI);
    /* the partition in the middle of the gallery */
    k.box(0.4, 3.6, 3.6, -21.5, 1.8, -9, galleryWall); wallBlock(k, -21.8, -21.2, -10.9, -7.1);
    /* vitrines of silver: cups, lamps, a tall case, candelabra, on plinths under glass */
    const silver = k.flat(0xd8d8dc, 1, 0.22), glassM2 = k.glass(0xdfeaf0, 0.14, 0.05);
    const vitrine = (x: number, z: number, kind: number) => {
      k.box(1.4, 1.0, 1.0, x, 0.5, z, k.flat(0x2a2622, 0, 0.8));
      k.box(1.4, 1.0, 1.0, x, 1.5, z, glassM2);
      if (kind === 0) { k.lathe([[0, 0], [0.12, 0], [0.04, 0.05], [0.03, 0.2], [0.12, 0.28], [0.13, 0.42]], x - 0.3, 1.0, z, silver); k.lathe([[0, 0], [0.1, 0], [0.03, 0.05], [0.03, 0.16], [0.1, 0.24], [0.1, 0.34]], x + 0.3, 1.0, z, silver); }
      else if (kind === 1) { k.cyl(0.22, 0.7, x, 1.35, z, silver, 0.22, 16); k.sphere(0.22, x, 1.72, z, silver, 12); k.cyl(0.03, 0.3, x, 1.95, z, gilt, 0.05, 6); }
      else { k.cyl(0.03, 0.55, x, 1.28, z, silver, 0.05, 6); for (let a = -3; a <= 3; a++) k.cyl(0.018, 0.18 + (3 - Math.abs(a)) * 0.06, x + a * 0.08, 1.5 + (3 - Math.abs(a)) * 0.03, z, silver, 0.018, 5); k.box(0.62, 0.03, 0.05, x, 1.5, z, silver); }
      k.point(x, 2.3, z, 0xfff2dc, 3, 3);
      k.keepOut.push({ x, z, r: 1.1 });
    };
    vitrine(-21.5, -4.2, 0); vitrine(-21.5, -13.6, 1);
    const caseM = { x: -21.5, z: -13.6 };

    /* ---- the Beth-El Chapel behind the museum: two domes, Tiffany windows, its own light ---- */
    const CZ0 = MZ1 - 0.6, CZ1 = -38, CX0 = MX0, CX1 = -13;
    k.box(CX1 - CX0, 0.3, CZ0 - CZ1, (CX0 + CX1) / 2, -0.15, (CZ0 + CZ1) / 2, marbleF);
    k.box(0.5, 9, CZ0 - CZ1, CX1 + 0.1, 4.5, (CZ0 + CZ1) / 2, stoneIn);
    k.box(CX1 - CX0, 9, 0.5, (CX0 + CX1) / 2, 4.5, CZ1, stoneIn);
    k.mesh(holed(CZ0 - CZ1, 9, 0.5, [0, 1, 2].map((i) => ({ cx: -6 + i * 6, y0: 2.2, w: 2.6, h: 6 }))), stoneIn, CX0 + 0.1, 0, (CZ0 + CZ1) / 2).rotation.y = PI / 2;
    const tiffT = stainedGlass(1590, 176, 400, [0x6a8a4a, 0x8aa85a, 0xc8b86a, 0xd8c890, 0x4a7a8a, 0xa87a3a, 0xe8dcb8], '#e8d8a0');
    const tiffM = new T.MeshBasicMaterial({ map: tiffT, side: T.DoubleSide, color: 0xe8e0d0 });
    [0, 1, 2].forEach((i) => k.plane(2.6, 6, CX0 + 0.1, 5.2, (CZ0 + CZ1) / 2 + 6 - i * 6, tiffM, PI / 2));
    {
      const cs = new T.Shape(), hw = (CX1 - CX0) / 2, hd = (CZ0 - CZ1) / 2, cxm = (CX0 + CX1) / 2, czm = (CZ0 + CZ1) / 2;
      cs.moveTo(-hw, -hd); cs.lineTo(hw, -hd); cs.lineTo(hw, hd); cs.lineTo(-hw, hd); cs.closePath();
      for (const dx of [-26.0, -17.4]) { const hp = new T.Path(); hp.absarc(dx - cxm, 0, 4.0, 0, PI * 2, false); cs.holes.push(hp); }
      const cg = new T.ShapeGeometry(cs, 32); cg.rotateX(PI / 2);
      k.mesh(cg, k.flat(0xd8c8a8, 0, 0.9, { side: T.DoubleSide }), cxm, 9.0, czm);
    }
    /* the domes are painted sky, unlit, so the shadow map cannot draw on them */
    const domeT = canvasTex(64, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#8fb4c8'); gr.addColorStop(1, '#3e5a6a'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); });
    const domeM = new T.MeshBasicMaterial({ map: domeT, side: T.DoubleSide });
    for (const dx of [-26.0, -17.4]) {
      const dome = k.lathe(Array.from({ length: 13 }, (_, q) => [4.0 * Math.cos((q / 12) * PI / 2), 4.0 * Math.sin((q / 12) * PI / 2)]), dx, 9.0, (CZ0 + CZ1) / 2, domeM, 28);
      void dome;
      k.torus(4.0, 0.18, dx, 9.0, (CZ0 + CZ1) / 2, gilt, 40).rotation.x = PI / 2;
      k.point(dx, 7, (CZ0 + CZ1) / 2, 0xffd8a8, 18, 12);
    }
    /* the chapel ark on the east wall and its eternal light */
    k.box(0.5, 5, 3, CX1 - 0.4, 2.5 + 0.6, -27.5, marbleDark); k.box(0.2, 3.6, 2, CX1 - 0.7, 2.8, -27.5, bronze);
    for (let i = 0; i < 3; i++) k.box(1.6 - i * 0.4, 0.2, 6 - i * 0.8, CX1 - 0.8 - (2 - i) * 0.4, 0.1 + i * 0.2, -27.5, marbleF);
    nerTamid(k, CX1 - 2.2, 5.2, -27.5, 9.2, bronze, ctx.reduced, 0.8);
    /* the chapel benches face east, toward its ark */
    {
      const pew = mergeGeometries([new T.BoxGeometry(1, 0.08, 0.42).translate(0, 0.46, 0), new T.BoxGeometry(1, 0.55, 0.06).translate(0, 0.78, 0.22), new T.BoxGeometry(1, 0.2, 0.05).translate(0, 0.25, -0.2)].map((g) => g.toNonIndexed()))!;
      const q = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), -PI / 2), pm: T.Matrix4[] = [], cs2: [number, number][] = [];
      for (let x = -28.6; x < -17.4; x += 1.15) for (const [za, zb] of [[-20.8, -26.2], [-28.8, -34.2]]) { pm.push(new T.Matrix4().compose(v(x, 0, (za + zb) / 2), q, v(za - zb, 1, 1))); for (let z = zb + 0.35; z < za - 0.3; z += 0.6) cs2.push([x, z]); }
      k.instances(pew, oak, pm);
      for (const [za, zb] of [[-20.8, -26.2], [-28.8, -34.2]]) wallBlock(k, -29, -17.2, zb - 0.1, za + 0.1);
      const f = seated(k, cs2.map(([x, z]) => [x, z] as [number, number]), 9, 1570, 0, -PI / 2); void f;
    }

    /* ---- people: the avenue, visitors walking the hall, two in the museum ---- */
    pigeons(k, [[-18, 4.2], [-17, 3.6], [-16.2, 4.6], [12, 4.4], [13, 3.9], [-4, 21.8], [-3, 22.6]], 0, 1564, ctx.reduced);
    traffic(k, 12, [8.5, 12, 15.5, 19], 1, 120, -0.2, 1565, ctx.reduced);
    if (!ctx.reduced) {
      k.crowd([v(-30, 0, 4.2), v(14, 0, 4.2)], 12, { seed: 1566, speed: 1.1, spread: 2.2 });
      k.crowd([v(-30, 0, 22.8), v(14, 0, 22.8)], 8, { seed: 1567, speed: 1.1, spread: 1.4 });
      k.crowd([v(0, 0, -2.6), v(0, 0, -39.6), v(11, 0, -39.6), v(11, 0, -12), v(0, 0, -12)], 4, { seed: 1568, speed: 0.45, spread: 0.6, closed: true });
      k.crowd([v(-17, 0, -6.4), v(-26, 0, -6.4), v(-26, 0, -11.6), v(-17, 0, -11.6)], 4, { seed: 1569, speed: 0.35, spread: 0.5, closed: true });
    }
    figure(k, -11, 0, -12.5, 0x1c2230, { rotY: PI / 2 });

    /* ---- the works: the vestibule and the museum, never the hall ---- */
    const mounts: Mount[] = [];
    for (const x of [-8.9, -4.4, 4.4, 8.9]) mounts.push({ position: v(x, 2.8, Z_S + 0.2), rotation: 0, target: v(x, 2.8, -4.0), width: 2.4, height: 1.8, style: 'gilt', wash: true });
    for (const z of [-2.9, -6.3]) mounts.push({ position: v(SX - 0.12, 2.8, z), rotation: -PI / 2, target: v(8.2, 2.8, z), width: 2.3, height: 1.7, style: 'gilt', wash: true });
    for (const z of [-4.2, -8.6, -13]) mounts.push({ position: v(MX0 + 0.08, 2.5, z), rotation: PI / 2, target: v(MX0 + 3.8, 2.5, z), width: 2.4, height: 1.8, style: 'white', wash: true });
    for (const x of [-27.2, -16.2]) mounts.push({ position: v(x, 2.5, Z_V - 0.3), rotation: PI, target: v(x, 2.5, Z_V - 4.2), width: 2.4, height: 1.8, style: 'white', wash: true });
    for (const x of [-27.8, -16]) mounts.push({ position: v(x, 2.5, MZ1 + 0.02), rotation: 0, target: v(x, 2.5, MZ1 + 3.8), width: 2.2, height: 1.7, style: 'white', wash: true });
    mounts.push({ position: v(-21.28, 2.3, -9), rotation: PI / 2, target: v(-17.6, 2.3, -9), width: 2.4, height: 1.8, style: 'white', wash: true });
    mounts.push({ position: v(-21.72, 2.3, -9), rotation: -PI / 2, target: v(-25.4, 2.3, -9), width: 2.4, height: 1.8, style: 'white', wash: true });
    k.censusWall({ x: -13.24, y: 2.7, z: -12.6, rotY: -PI / 2, cols: 12, rows: 5, tile: 0.44, gap: 0.04, start: ctx.wallStart(1500, 60), pieces: ctx.all, backing: k.flat(0x2a2622, 0, 0.8) });

    /* ---- what the building knows ---- */
    const bld = { name: 'Temple Emanu-El of New York (1930), Wikipedia', url: 'https://en.wikipedia.org/wiki/Temple_Emanu-El_of_New_York_(1930)' };
    const cong = { name: 'Congregation Emanu-El of New York, Wikipedia', url: 'https://en.wikipedia.org/wiki/Congregation_Emanu-El_of_New_York' };
    k.egg(v(0, 2, -30), { id: 'seats-2500', title: 'Bigger than the cathedral', year: '1930', text: 'The hall seats 2,500, more than St. Patrick\'s Cathedral further down Fifth Avenue, which makes it one of the largest synagogues in the world. Its vast load bearing masonry walls carry the steel beams of the roof.', clue: 'Count the pews. Then keep counting.', source: bld, room: 'stpatricks' }, { r: 3 });
    k.egg(v(0, BIM + AH + 1, Z_E + 0.2), { id: 'meiere-mosaics', title: 'The gold round the arch', text: 'The mosaics were made by Hildreth Meière (1892 to 1961). The building\'s style is argued over: some call it Romanesque Revival, others Moorish Revival with Art Deco ornament.', clue: 'Look up the arch to where the gold meets the red.', source: bld }, { r: 3.5 });
    k.egg(v(CX0 + 0.3, 5.2, -27.5), { id: 'tiffany-windows', title: 'Windows from the old temple', year: '1868', text: 'The stained glass in the chapel was designed by Louis Comfort Tiffany for the congregation\'s 1868 Moorish Revival temple at 43rd Street and Fifth Avenue. That building was demolished in 1927; the windows came uptown.', clue: 'The chapel windows are older than the chapel.', source: cong }, { r: 2.4 });
    k.egg(v(caseM.x, 1.5, caseM.z), { id: 'bernard-museum', title: 'Silver from Calcutta', text: 'The Bernard Museum of Judaica shows objects from the histories of Temple Emanu-El and of Temple Beth-El, which merged with it in 1927, among them silver, a large collection of menorahs, and an 1891 Torah case of silver, copper and gilt from Calcutta, made by silversmiths in China for a congregation of Jews from Baghdad.', clue: 'The tall silver case in the museum travelled furthest.', source: { name: 'Bernard Museum of Judaica, Wikipedia', url: 'https://en.wikipedia.org/wiki/Bernard_Museum_of_Judaica' } }, { r: 1.4 });
    k.egg(v(0, 20, 1.5), { id: 'astor-site', title: 'Where Mrs. Astor lived', year: '1928 to 1930', text: 'The temple was designed by Robert D. Kohn with Charles Butler and Clarence Stein, and built from 1928 to 1929 on the former site of the Mrs. William B. Astor House. It was consecrated in 1930.', clue: 'Step outside and look up at the great arch.', source: bld }, { r: 4 });
    k.egg(v(10.5, 2.4, -4.6), { id: 'grand-and-clinton', title: 'Thirty three founders', year: '1845', text: 'The congregation was founded in April 1845 by 33 mainly German Jews meeting in a rented hall near Grand and Clinton Streets on the Lower East Side. It has occupied five buildings, and it is the oldest Reform congregation in New York City.', clue: 'Read the plain stone at the south end of the vestibule.', source: cong }, { r: 1.6 });

    /* ---- where the visitor cannot go ---- */
    const WZ0 = Z_V - 0.05, WZ1 = 0.05;
    wallBlock(k, -31, -5.6, WZ0, WZ1); wallBlock(k, -3.2, -1.2, WZ0, WZ1); wallBlock(k, 1.2, 3.2, WZ0, WZ1); wallBlock(k, 5.6, 13.4, WZ0, WZ1);
    wallBlock(k, -13.4, -7.1, 0, 2.55); wallBlock(k, 7.1, 13.4, 0, 2.55);
    wallBlock(k, -13.2, -12.0, -56, -6.6); wallBlock(k, -13.2, -12.0, -3.4, Z_V);
    wallBlock(k, 11.9, 13.4, -56, Z_V);
    wallBlock(k, -12, -2.85, Z_S - 0.65, Z_S + 0.05); wallBlock(k, 2.85, 12, Z_S - 0.65, Z_S + 0.05);
    wallBlock(k, -12, 12, -56, -40.5);
    wallBlock(k, MX0 - 1, -23.4, MZ1 - 0.65, MZ1 + 0.05); wallBlock(k, -20.6, -12, MZ1 - 0.65, MZ1 + 0.05);
    wallBlock(k, MX0 - 1, -12, -56, CZ1 + 0.3);
    wallBlock(k, CX1 - 1.8, CX1, CZ1, CZ0);
    for (const [x, z] of [[7.4, 2.3], [-7.4, 2.3]]) k.keepOut.push({ x, z, r: 0.7 });
    return { mounts, spawn: v(0, 3, -1.9), look: v(0, 7.5, -50), eye: 3, bounds: [MX0 + 0.1, 15.4, -41, 24.4], style: 'gilt' };
  },
};

/* a New York rowhouse front, painted once: three bays, four storeys, lintels, a cornice line, a door at stoop height */
function rowhouseTex(seed: number, body: string, trim: string, storeys = 4) {
  return canvasTex(384, 768, (g) => {
    const rnd = X.mulberry(seed), W = 384, Hh = 768;
    g.fillStyle = body; g.fillRect(0, 0, W, Hh);
    for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(0,0,0,${0.03 + rnd() * 0.05})`; g.fillRect(rnd() * W, rnd() * Hh, 2 + rnd() * 6, 1 + rnd() * 2); }
    g.fillStyle = trim; g.fillRect(0, 0, W, 34); g.fillRect(0, 34, W, 8);
    const floorH = (Hh - 60) / storeys;
    for (let f = 0; f < storeys; f++) {
      const y0 = 60 + f * floorH;
      for (let b = 0; b < 3; b++) {
        if (f === storeys - 1 && b === 0) continue;
        const x = 34 + b * 118, wy = y0 + floorH * 0.18, wh = floorH * 0.58;
        g.fillStyle = trim; g.fillRect(x - 8, wy - 12, 76, 12); g.fillRect(x - 4, wy + wh, 68, 7);
        const lit = rnd() < 0.25;
        g.fillStyle = lit ? '#c8a878' : '#1e2630'; g.fillRect(x, wy, 60, wh);
        g.fillStyle = lit ? '#e8d0a0' : '#34404c'; g.fillRect(x + 4, wy + 4, 24, wh / 2 - 6); g.fillRect(x + 32, wy + 4, 24, wh / 2 - 6);
        g.fillStyle = trim; g.fillRect(x + 28, wy, 4, wh); g.fillRect(x, wy + wh / 2 - 2, 60, 4);
      }
    }
    /* the parlour floor door, up the stoop */
    const dy = 60 + (storeys - 1) * floorH;
    g.fillStyle = trim; g.fillRect(24, dy + 10, 80, floorH - 10);
    g.fillStyle = '#3a2418'; g.fillRect(34, dy + 22, 60, floorH - 22);
    g.fillStyle = '#c8a860'; g.fillRect(84, dy + floorH * 0.6, 5, 5);
  });
}
/* a row of rowhouses facing +z (dir 1) or -z (dir -1), front at z, from x0 for n houses of width w */
function rowhouses(k: K, x0: number, n: number, w: number, z: number, dir: number, seed: number, mats: T.Material[], h = 17) {
  const brown = k.flat(0x4a3024, 0, 0.9), cornice = k.flat(0x2a2420, 0.2, 0.7), stoop = k.flat(0x5a4032, 0, 0.9), iron = k.flat(0x1a1a1a, 0.5, 0.5);
  for (let i = 0; i < n; i++) {
    const x = x0 + (i + 0.5) * w, hh = h + ((i * 7 + seed) % 3) * 0.9;
    k.box(w, hh, 12, x, hh / 2, z - dir * 6.05, brown);
    k.plane(w, hh, x, hh / 2, z + dir * 0.01, mats[(i + seed) % mats.length], dir > 0 ? 0 : PI);
    k.box(w + 0.1, 0.7, 0.6, x, hh - 0.35, z + dir * 0.3, cornice);
    /* the stoop: steps up to the parlour door, iron railings */
    const sx = x - w * 0.5 + 1.55 * (w / 6);
    for (let s = 0; s < 6; s++) k.box(1.7, 0.6 * (s + 1), 0.45, sx, 0.3 * (s + 1), z + dir * (0.225 + (5 - s) * 0.45), stoop);
    for (const e of [-0.9, 0.9]) k.bar(v(sx + e, 1.0, z + dir * 2.7), v(sx + e, 4.2, z + dir * 0.2), 0.05, 0.05, iron);
  }
  k.block(x0, x0 + n * w, Math.min(z, z - dir * 12.1), Math.max(z, z - dir * 12.1) + (dir > 0 ? 3 : 0));
}

/* ---------------- 157 KEHILATH JESHURUN ---------------- */
export const kehilathjeshurun: RoomDef = {
  id: 'kehilathjeshurun',
  name: 'Kehilath Jeshurun',
  area: 'KEHILATH JESHURUN / EAST 85TH STREET',
  mood: 'A school afternoon on a rowhouse street',
  color: '#a8876a',
  daylit: true,
  description: 'East 85th Street between Park and Lexington, from the pavement opposite: the 1902 limestone front of Kehilath Jeshurun between brownstones, children from the Ramaz school next door going by in twos, and New Yorkers stood along the kerb on the synagogue side. Through the doors are the lobby and the school corridor, where more of them hang, and the sanctuary with its galleries on columns, forty stained glass windows and the eternal light over the ark.',
  signatures: 'The limestone front with its round arched windows, pilasters and balustraded roofline, the three doors, the brownstone stoops and street trees of East 85th, the Ramaz lower school next door and its corridor, the lobby, the sanctuary with the U shaped gallery on columns, two tiers of stained glass, a central bimah with a brass rail, the ark under a round window, and the eternal light.',
  build(k, ctx) {
    k.sky({ top: 0x5a8fd0, horizon: 0xdce4ea, ground: 0x6a6660, fog: 0.004, sun: { az: -1.9, el: 0.7, color: 0xfff0d8, size: 7 }, env: 0.5 });
    k.hemi(0xeef2f8, 0x8a8478, 0.9);
    k.sun(0xfff0d8, 2.4, -70, 60, 30, true, 60);
    const lime = k.pbr('kjLime', X.ashlar(0xd8ccb2, 170, 5), 0.32, { normal: 0.4, roughness: 0.85 }),
      limeDark = k.pbr('kjLime2', X.ashlar(0xbcae92, 171, 4), 0.45, { normal: 0.4 }),
      pave = k.pbr('kjPave', X.pavers(0x9a968e, 172), 0.5), asphalt = k.pbr('kjAsph', X.asphalt(), 0.2),
      schoolBrick = k.pbr('kjBrick', X.brick(0x8a5a44, 173), 0.7, { normal: 0.5 }),
      plaster = k.pbr('kjPlaster', X.plaster(0xe8dcc4, 174), 0.3, { roughness: 0.9 }),
      marbleF = k.pbr('kjFloor', X.marble(0xd8d0c0, 0x8a8478, 175), 0.3, { roughness: 0.35 }),
      marbleDark = k.pbr('kjMarble2', X.marble(0x6a5048, 0x3a2a24, 176), 0.4, { roughness: 0.3 }),
      terrazzo = k.pbr('kjTerr', X.terrazzo(0xcfc8b8, 177), 0.5, { roughness: 0.5 }),
      oak = k.pbr('kjOak', X.planks(0x6a4428, 5, 178), 0.8, { roughness: 0.6 }), oakDark = k.flat(0x3a2616, 0, 0.6),
      carpet = k.pbr('kjCarpet', X.carpet(0x2a3a6a, 0xb89a4a), 0.6, { roughness: 1 }),
      brass = k.flat(0xc8a048, 0.9, 0.3), gilt = k.pbr('kjGilt', X.gilt(), 2, { metalness: 0.9, roughness: 0.3 }),
      iron = k.flat(0x1a1a1a, 0.6, 0.5), dark = k.flat(0x14100c, 0, 0.9), cream = k.flat(0xefe6d4, 0, 0.85);
    const FW = 11, ZL = -7.5, ZS0 = -8.1, ZS1 = -36, H = 16, GY = 5.2, CX = 7.5;

    /* ---- the street: two pavements, the roadway going west, trees, parked cars ---- */
    const floorY = (_x: number, z: number) => (z > 5.2 && z < 14.8 ? -0.18 : 0);
    k.box(90, 0.3, 5.2, -4, -0.15, 2.6, pave); k.box(90, 0.3, 4.8, -4, -0.15, 17.2, pave);
    k.box(90, 0.2, 9.6, -4, -0.28, 10, asphalt);
    for (const z of [5.2, 14.8]) k.box(90, 0.2, 0.25, -4, -0.08, z, limeDark);
    for (const [x, z] of [[-17, 4.4], [-6.5, 4.4], [15, 4.4], [26, 4.4], [-24, 15.6], [-9, 15.6], [8, 15.6], [22, 15.6]]) { k.tree(x, 0, z, { h: 6.5, r: 2.4, seed: 157 + x, leaf: 0x4a7a3a }); k.box(1.4, 0.06, 1.4, x, 0.01, z, k.flat(0x3a2e24, 0, 1)); k.keepOut.push({ x, z, r: 0.7 }); }
    {
      const parked = [[-30, 6.4, 0x2a3a5a], [-22.5, 6.4, 0x8a8a8a], [-14, 6.4, 0x1c1e22], [20, 6.4, 0xe8e8e8], [28, 6.4, 0x5a1a1a], [-26, 13.6, 0xd8d0c0], [-12, 13.6, 0x2a4a3a], [4, 13.6, 0x1c1e22], [12, 13.6, 0x6a6a70], [26, 13.6, 0x2a3a5a]] as [number, number, number][];
      const body = k.instances(new T.BoxGeometry(4.4, 1.2, 1.9), new T.MeshStandardMaterial({ roughness: 0.45, metalness: 0.3 }), parked.map(([x, z]) => new T.Matrix4().makeTranslation(x, 0.5, z)));
      const c = new T.Color(); parked.forEach(([, , col], i) => body.setColorAt(i, c.set(col))); if (body.instanceColor) body.instanceColor.needsUpdate = true;
      k.instances(new T.BoxGeometry(2.4, 0.6, 1.7), k.flat(0x1a2028, 0.5, 0.2), parked.map(([x, z]) => new T.Matrix4().makeTranslation(x - 0.2, 1.4, z)));
    }
    for (const x of [-20, 4, 24]) k.lamp(x, 4.7, 5.6, iron, 0xffe0b0, 8);
    /* the rowhouses either side of the synagogue and all along the north side */
    const texs = [rowhouseTex(1571, '#6a4434', '#8a6a54'), rowhouseTex(1572, '#5a3a2e', '#7a5a48'), rowhouseTex(1573, '#8a5a44', '#c8b8a0'), rowhouseTex(1574, '#b8a88a', '#8a7a64')].map((t) => new T.MeshStandardMaterial({ map: t, roughness: 0.85 }));
    rowhouses(k, -41, 5, 6, 0, 1, 1, texs);
    rowhouses(k, -41, 6, 6, 19.4, -1, 3, texs);
    rowhouses(k, 16, 4, 6, 19.4, -1, 5, texs);
    /* the Ramaz middle school across the street: modern brick and glass */
    k.box(21, 22, 14, 5.5, 11, 26.4, schoolBrick);
    k.plane(21, 22, 5.5, 11, 19.38, k.pbr('kjSchoolWin', X.windows(1575, 0.3, 0x3a4450, true), 0.18, { stretch: 0.6, roughness: 0.5 }), PI);
    k.box(21, 0.8, 0.6, 5.5, 3.6, 19.1, k.flat(0x2a2a2a, 0.4, 0.5));
    k.block(-5, 16, 19.4, 34);

    /* ---- the 1902 front: limestone, pilasters, three doors, round arched windows, a balustrade ---- */
    const fH = 17;
    k.mesh(holed(2 * FW, fH, 1, [
      { cx: -3.2, y0: 0.02, w: 2.2, h: 4.4 }, { cx: 0, y0: 0.02, w: 2.4, h: 4.8 }, { cx: 3.2, y0: 0.02, w: 2.2, h: 4.4 },
      { cx: 0, y0: 6.6, w: 5.2, h: 8.4 }, { cx: -4.3, y0: 7.2, w: 2, h: 6 }, { cx: 4.3, y0: 7.2, w: 2, h: 6 },
      { cx: -8.8, y0: 7.2, w: 1.8, h: 5 }, { cx: 8.8, y0: 7.2, w: 1.8, h: 5 },
    ]), lime, 0, 0, -0.5);
    for (const x of [-10.7, -6.6, 6.6, 10.7]) { k.box(0.8, fH - 0.6, 0.45, x, (fH - 0.6) / 2, 0.2, limeDark); k.box(1.0, 0.5, 0.55, x, fH - 0.85, 0.2, limeDark); }
    k.box(2 * FW + 0.8, 0.7, 0.9, 0, fH, 0.2, limeDark);
    k.box(2 * FW + 0.4, 0.3, 0.6, 0, 5.9, 0.12, limeDark);
    for (let i = 0; i < 44; i++) k.box(0.18, 0.22, 0.2, -10.75 + i * 0.5, fH - 0.46, 0.55, limeDark);
    /* the balustrade and a raised blank panel over the centre */
    k.box(2 * FW + 0.6, 0.25, 0.7, 0, fH + 0.45, 0.1, limeDark); k.box(2 * FW + 0.6, 0.25, 0.7, 0, fH + 1.55, 0.1, limeDark);
    {
      const bal = mergeGeometries([new T.CylinderGeometry(0.1, 0.14, 0.85, 8).toNonIndexed(), new T.SphereGeometry(0.13, 8, 6).translate(0, 0.1, 0).toNonIndexed()])!;
      const bm: T.Matrix4[] = [];
      for (let x = -10.9; x <= 10.9; x += 0.42) if (Math.abs(x) > 2.8) bm.push(new T.Matrix4().makeTranslation(x, fH + 1.0, 0.1));
      k.instances(bal, lime, bm);
    }
    k.box(5.6, 2.8, 0.8, 0, fH + 1.9, 0.1, lime); k.box(6, 0.35, 0.95, 0, fH + 3.4, 0.1, limeDark);
    k.mesh(archRing(6.2, 9.0, 5.2, 8.4, 0), limeDark, 0, 6.6, 0.02);
    for (const cx of [-4.3, 4.3]) k.mesh(archRing(2.6, 6.3, 2, 6, 0), limeDark, cx, 7.2, 0.02);
    for (const cx of [-3.2, 0, 3.2]) k.mesh(archRing(cx === 0 ? 3.0 : 2.8, cx === 0 ? 5.2 : 4.8, cx === 0 ? 2.4 : 2.2, cx === 0 ? 4.8 : 4.4, 0), limeDark, cx, 0.02, 0.02);
    k.sign('CONGREGATION KEHILATH JESHURUN', 9.4, 0.5, 0, 5.62, 0.44, '#c8bca0', '#5a4a36', 52);
    const glassPal = [[0x2a4a98, 0x1c3a7a, 0xc89a3a, 0x8a1a22, 0xd8c890, 0x3a6a4a], [0x3a6aa8, 0xc8a84a, 0x6a2a6a, 0xd8c890, 0x2a6a5a, 0x9a3a2a]];
    const gM = [0, 1].map((i) => new T.MeshBasicMaterial({ map: stainedGlass(1576 + i, 176, 480, glassPal[i]), side: T.DoubleSide, color: 0xc8c0b8 }));
    /* from the street the glass reads dark, as real stained glass does by day */
    const gOut = gM.map((m) => new T.MeshStandardMaterial({ map: m.map, color: 0x8a8480, roughness: 0.15, metalness: 0.3, emissive: 0xffffff, emissiveMap: m.map, emissiveIntensity: 0.12, side: T.DoubleSide }));
    k.plane(5.2, 8.4, 0, 6.6 + 4.2, -0.5, gOut[0]);
    for (const cx of [-4.3, 4.3]) k.plane(2, 6, cx, 10.2, -0.5, gOut[1]);
    for (const cx of [-8.8, 8.8]) k.plane(1.8, 5, cx, 9.7, -0.5, gOut[1]);
    for (const x of [-1.5, 1.5]) k.box(0.2, 8.4, 0.3, x, 10.8, -0.5, limeDark);
    /* the doors: oak, the centre pair open */
    const leaves: T.Object3D[] = [];
    for (const [cx, w] of [[-3.2, 2.2], [0, 2.4], [3.2, 2.2]] as [number, number][]) for (const s of [-1, 1]) {
      const g = new T.Group(); g.position.set(cx + s * w / 2, 0, -0.2); g.rotation.y = cx === 0 ? s * 1.4 : 0;
      const leaf = new T.Mesh(new T.BoxGeometry(w / 2, 3.6, 0.1), oak); leaf.position.set(-s * w / 4, 1.8, 0); g.add(leaf);
      const p2 = new T.Mesh(new T.BoxGeometry(w / 2 - 0.25, 1.2, 0.14), oakDark); p2.position.set(-s * w / 4, 2.2, 0); g.add(p2);
      k.add(g); if (cx !== 0) leaves.push(g);
    }
    for (const cx of [-3.2, 3.2]) { k.box(2.2, 0.8, 0.1, cx, 4.0, -0.2, gOut[0]); }
    if (!ctx.reduced) k.ticks.push((t) => { const a = Math.max(0, Math.sin(t * 0.22)) ** 3; leaves[1].rotation.y = 1.3 * a; });

    /* ---- the Ramaz lower school next door: brick, six storeys, its own door ---- */
    k.mesh(holed(21, 22, 0.8, [{ cx: 6, y0: 0.02, w: 2.4, h: 3.2, square: true }]), schoolBrick, 21.5, 0, -0.4);
    k.plane(19, 17, 21.5, 13.5, 0.02, k.pbr('kjSchoolWin2', X.windows(1577, 0.35, 0x3a4450, true), 0.22, { stretch: 0.6, roughness: 0.5 }));
    k.box(21, 0.5, 1.4, 21.5, 3.6, 0.5, k.flat(0x2a2a2a, 0.4, 0.5));
    k.sign('RAMAZ', 3.2, 0.6, 27.5, 4.2, 1.22, '#1c2a44', '#e8e2d4', 150);

    /* ---- the lobby behind the doors ---- */
    k.box(2 * FW, 0.3, -ZL, 0, -0.15, ZL / 2, terrazzo);
    k.plane(2 * FW, -ZL - 1, 0, 5.0, (ZL - 1) / 2, cream, 0, PI / 2);
    for (const x of [-6, 0, 6]) { k.cyl(0.55, 0.1, x, 4.95, -4.2, brass, 0.55, 20); k.cyl(0.45, 0.05, x, 4.88, -4.2, k.glow(0xfff0d8), 0.45, 20); }
    for (const x of [-6, 6]) k.point(x, 4.2, -4.2, 0xfff0dc, 18, 12);
    k.box(0.4, 5, -ZL - 1, -FW + 0.2, 2.5, (ZL - 1) / 2, plaster);
    k.mesh(holed(-ZL - 1, 5, 0.4, [{ cx: -0.05, y0: 0.02, w: 2.4, h: 3.2, square: true }]), plaster, FW - 0.2, 0, (ZL - 1) / 2).rotation.y = PI / 2;
    k.mesh(holed(2 * FW, 5, 0.6, [{ cx: -4, y0: 0.02, w: 2.2, h: 3.6 }, { cx: 0, y0: 0.02, w: 2.2, h: 3.6 }, { cx: 4, y0: 0.02, w: 2.2, h: 3.6 }]), plaster, 0, 0, ZL - 0.3);
    for (const s of [-1, 1]) k.box(6.2, 5, 0.04, s * 7.5, 2.5, -1.02, plaster); for (const sx of [-1, 1]) k.box(FW - 1.2, 1.0, 0.06, sx * (FW + 1.2) / 2, 0.5, -1.06, oak); k.box(0.06, 1.0, -ZL - 1, -FW + 0.43, 0.5, (ZL - 1) / 2, oak);
    for (const [a, b] of [[-FW, -5.1], [-2.9, -1.1], [1.1, 2.9], [5.1, FW]]) k.box(b - a, 1.0, 0.06, (a + b) / 2, 0.5, ZL + 0.03, oak);
    k.sign('SANCTUARY', 2.2, 0.3, 0, 4.25, ZL + 0.02, '#e8dcc4', '#5a4a36', 120);
    k.sign('RAMAZ LOWER SCHOOL', 2.4, 0.26, FW - 0.42, 3.55, -4.0, '#1c2a44', '#e8e2d4', 80, -PI / 2);
    /* a security desk by the door, a guard, a bench */
    k.box(2.4, 1.1, 0.8, 8.2, 0.55, -2.4, oakDark); k.box(2.5, 0.06, 0.9, 8.2, 1.12, -2.4, marbleDark); k.keepOut.push({ x: 8.2, z: -2.4, r: 1.3 });
    figure(k, 8.2, 0, -3.3, 0x1c2230, { rotY: PI });

    /* ---- the school corridor ---- */
    const CX0 = FW + 0.2, CX1 = 31.6, CZ0 = -1.2, CZ1 = -8, CH = 3.9;
    k.box(CX1 - CX0, 0.3, CZ0 - CZ1, (CX0 + CX1) / 2, -0.15, (CZ0 + CZ1) / 2, k.pbr('kjSchoolFloor', X.terrazzo(0xb8c0c4, 179), 0.6, { roughness: 0.45 }));
    k.plane(CX1 - CX0, CZ0 - CZ1, (CX0 + CX1) / 2, CH, (CZ0 + CZ1) / 2, k.flat(0xf2f0ea, 0, 0.9), 0, PI / 2);
    const schoolWall = k.flat(0xcfc6b2, 0, 0.9), stripe = k.flat(0x2a4a8a, 0, 0.7);
    k.box(26.3 - CX0, CH, 0.3, (CX0 + 26.3) / 2, CH / 2, CZ0 + 0.15, schoolWall); k.box(CX1 - 28.7, CH, 0.3, (28.7 + CX1) / 2, CH / 2, CZ0 + 0.15, schoolWall); k.box(2.4, CH - 3.2, 0.3, 27.5, 3.2 + (CH - 3.2) / 2, CZ0 + 0.15, schoolWall);
    k.box(20.4, 18, 19, 21.8, 13, -10.6, schoolBrick);
    k.box(CX1 - CX0, CH, 0.3, (CX0 + CX1) / 2, CH / 2, CZ1 - 0.15, schoolWall);
    k.box(0.3, CH, CZ0 - CZ1, CX1 + 0.15, CH / 2, (CZ0 + CZ1) / 2, schoolWall);
    for (const z of [CZ0 + 0.01, CZ1 - 0.01]) k.box(CX1 - CX0, 0.18, 0.02, (CX0 + CX1) / 2, 1.05, z + (z > -4 ? -0.3 : 0.3), stripe);
    for (let x = CX0 + 2; x < CX1; x += 4) { k.box(1.6, 0.06, 0.4, x, CH - 0.04, (CZ0 + CZ1) / 2, k.glow(0xf4f8ff)); }
    for (const x of [16, 24]) k.point(x, 3.2, (CZ0 + CZ1) / 2, 0xfff4e4, 6, 10);
    /* classroom doors down the south side, coat hooks, a line of cubbies at the end */
    for (const x of [13.4, 18.1, 22.7, 27.4]) { k.box(1.1, 2.4, 0.08, x, 1.2, CZ1 + 0.02, k.flat(0x6a4a2a, 0, 0.6)); k.box(0.3, 0.5, 0.09, x + 0.2, 1.8, CZ1 + 0.03, k.glass(0xcfe0ea, 0.5, 0.1)); }

    /* ---- the sanctuary ---- */
    k.box(2 * FW, 0.3, ZS0 - ZS1, 0, -0.15, (ZS0 + ZS1) / 2, marbleF);
    k.box(2, 0.02, ZS0 - ZS1 - 2, 0, 0.01, (ZS0 + ZS1) / 2, carpet);
    const winZ = [-12, -17, -22, -27, -32];
    for (const s of [-1, 1]) {
      const zc = (ZS0 + ZS1) / 2, holes: Hole[] = [];
      for (const z of winZ) { holes.push({ cx: zc - z, y0: 1.4, w: 1.5, h: 3.0 }); holes.push({ cx: zc - z, y0: 7.2, w: 2.1, h: 5.4 }); }
      k.mesh(holed(ZS0 - ZS1 + 1.2, H, 0.8, holes), plaster, s * (FW + 0.4), 0, zc).rotation.y = PI / 2;
      winZ.forEach((z, i) => { k.plane(1.5, 3, s * (FW + 0.4), 2.9, z, gM[(i + (s > 0 ? 1 : 0)) % 2], PI / 2); k.plane(2.1, 5.4, s * (FW + 0.4), 9.9, z, gM[(i + (s > 0 ? 0 : 1)) % 2], PI / 2); });
    }
    /* the ark wall: a round window, the ark in marble with columns and a pediment, steps */
    k.mesh(holed(2 * FW + 1.6, H + 2, 0.8, [{ cx: 0, y0: 9.2, w: 4.4, h: 4.4, circle: true }]), plaster, 0, 0, ZS1 - 0.4);
    const roseT = canvasTex(512, 512, (g) => {
      g.fillStyle = '#0c0a0c'; g.fillRect(0, 0, 512, 512);
      const rnd = X.mulberry(1579), C = 256;
      for (let ring = 0; ring < 4; ring++) { const r0 = 30 + ring * 56, r1 = r0 + 50, n = 8 * (ring + 1); for (let i = 0; i < n; i++) { const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2, pk = rnd(); g.fillStyle = pk < 0.45 ? '#2a4aa8' : pk < 0.65 ? '#c89a3a' : pk < 0.8 ? '#8a1a22' : '#d8d0b8'; g.beginPath(); g.arc(C, C, r1 - 4, a0 + 0.03, a1 - 0.03); g.arc(C, C, r0 + 4, a1 - 0.03, a0 + 0.03, true); g.closePath(); g.fill(); } }
      g.strokeStyle = '#0c0a0c'; g.lineWidth = 10; for (const r of [30, 254]) { g.beginPath(); g.arc(C, C, r, 0, PI * 2); g.stroke(); }
    });
    k.mesh(new T.CircleGeometry(2.2, 40), new T.MeshBasicMaterial({ map: roseT, color: 0xe0d8d0 }), 0, 11.4, ZS1 - 0.4);
    k.torus(2.3, 0.14, 0, 11.4, ZS1 + 0.02, gilt, 40);
    const AZ = ZS1 + 0.6;
    for (let i = 0; i < 4; i++) k.box(9 - i * 1.2, 0.25 * (i + 1), 1.2, 0, 0.125 * (i + 1), AZ + 2.6 - i * 0.6, marbleF);
    k.box(5.4, 6.4, 0.9, 0, 1.0 + 3.2, AZ, marbleDark);
    k.box(3.0, 4.4, 0.2, 0, 1.0 + 2.4, AZ + 0.5, oak);
    for (const [x, w] of [[-0.75, 1.3], [0.75, 1.3]] as [number, number][]) { k.box(w - 0.2, 3.8, 0.06, x, 3.4, AZ + 0.62, k.flat(0x5a3418, 0, 0.5)); for (const y of [2.2, 3.4, 4.6]) k.box(w - 0.5, 0.05, 0.08, x, y, AZ + 0.64, gilt); }
    for (const s of [-1, 1]) k.column(s * 3.1, 1.0, AZ + 0.7, 6.2, 0.26, marbleF, true, gilt);
    { const pd = new T.Shape(); pd.moveTo(-3.6, 0); pd.lineTo(3.6, 0); pd.lineTo(0, 1.5); pd.closePath(); const pg = new T.ExtrudeGeometry(pd, { depth: 0.6, bevelEnabled: false }); pg.translate(0, 0, -0.3); k.mesh(pg, marbleF, 0, 7.4, AZ + 0.6); k.box(7.4, 0.3, 1.0, 0, 7.3, AZ + 0.6, gilt); }
    nerTamid(k, 0, 5.4, AZ + 2.6, H, brass, ctx.reduced, 1);
    k.spot(0, H - 1.5, -22, 0, 3, AZ, 0xffe6c0, 320, 0.4, 0.6, 30);
    /* the galleries: a U on columns, panelled fronts with a brass rail, seats stepping back */
    const colGeo = mergeGeometries([new T.CylinderGeometry(0.26, 0.3, 1, 14).toNonIndexed()])!;
    const cm: T.Matrix4[] = [];
    for (const s of [-1, 1]) for (const z of [-12.2, -17, -22, -27, -32]) { cm.push(new T.Matrix4().compose(v(s * CX, GY / 2, z), new T.Quaternion(), v(1, GY, 1))); cm.push(new T.Matrix4().compose(v(s * CX, GY + 0.5 + (H - 3 - GY - 0.5) / 2, z), new T.Quaternion(), v(0.85, H - 3 - GY - 0.5, 0.85))); k.keepOut.push({ x: s * CX, z, r: 0.45 }); }
    k.instances(colGeo, cream, cm);
    for (const s of [-1, 1]) {
      k.box(FW - CX + 0.4, 0.45, 24.4, s * (CX + FW) / 2, GY + 0.22, (ZS0 - 32.5) / 2, cream);
      k.box(0.25, 1.2, 24.4, s * (CX - 0.1), GY + 1.05, (ZS0 - 32.5) / 2, oak);
      k.box(0.3, 0.1, 24.4, s * (CX - 0.1), GY + 1.7, (ZS0 - 32.5) / 2, brass);
      for (let i = 0; i < 3; i++) k.box(FW - CX - 0.8 - i * 0.9 + 0.4, 0.4 * (i + 1), 24, s * (FW - 0.2 - (FW - CX - 0.8 - i * 0.9) / 2), GY + 0.45 + 0.2 * (i + 1), -20.5, oakDark);
    }
    k.box(2 * CX, 0.45, 4, 0, GY + 0.22, ZS0 - 2, cream); k.box(2 * CX, 1.2, 0.25, 0, GY + 1.05, ZS0 - 4, oak); k.box(2 * CX, 0.1, 0.3, 0, GY + 1.7, ZS0 - 4, brass);
    /* the ceiling: flat over the galleries, a painted barrel vault over the centre with gilt ribs */
    for (const s of [-1, 1]) k.plane(FW - CX, ZS0 - ZS1, s * (CX + FW) / 2, H - 3, (ZS0 + ZS1) / 2, cream, 0, PI / 2);
    { const g = new T.CylinderGeometry(CX, CX, ZS0 - ZS1, 36, 1, true, PI / 2, PI); g.rotateX(PI / 2); g.scale(1, 0.55, 1); k.mesh(g, k.flat(0xa8c0d4, 0, 0.85, { side: T.DoubleSide, emissive: 0x2a3a4a, emissiveIntensity: 0.25 }), 0, H - 3, (ZS0 + ZS1) / 2); }
    for (const z of [-8.3, -12.2, -17, -22, -27, -32, -35.8]) k.curve(Array.from({ length: 13 }, (_, i) => { const a = (i / 12) * PI; return v(-Math.cos(a) * (CX - 0.05), H - 3 + Math.sin(a) * CX * 0.55 - 0.05, z); }), 0.1, gilt, 24);
    k.box(2 * FW + 1, 0.6, 36, 0, H + 1.6, -18.25, dark);
    for (const s of [-1, 1]) k.box(0.4, 12, 6.6, s * (FW + 0.2), 11, -4.3, plaster);
    k.box(2 * FW, 0.6, 0.6, 0, H - 3, ZS0, gilt);
    /* the chandelier over the bimah */
    k.beam(v(0, H + 1, -22), v(0, 11.4, -22), 0.03, brass, 4);
    k.torus(1.6, 0.07, 0, 11.2, -22, brass, 32).rotation.x = PI / 2; k.torus(1.0, 0.06, 0, 10.6, -22, brass, 24).rotation.x = PI / 2;
    { const bm: T.Matrix4[] = []; for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; bm.push(new T.Matrix4().makeTranslation(Math.cos(a) * 1.6, 11.4, -22 + Math.sin(a) * 1.6)); } k.instances(new T.SphereGeometry(0.1, 8, 6), k.glow(0xffe0a8), bm); }
    k.point(0, 10.8, -22, 0xffdcaa, 50, 20);
    for (const z of [-13, -30]) for (const x of [-9.2, 9.2]) k.point(x, 3.8, z, 0xffe4bc, 10, 9);
    /* the bimah in the middle: a raised platform, brass rail, a reading table */
    k.box(4.4, 0.8, 4.4, 0, 0.4, -20, marbleF); k.box(4.6, 0.1, 4.6, 0, 0.82, -20, marbleDark);
    for (const [a, b] of [[v(-2.1, 1.8, -17.9), v(2.1, 1.8, -17.9)], [v(-2.1, 1.8, -22.1), v(-0.6, 1.8, -22.1)], [v(0.6, 1.8, -22.1), v(2.1, 1.8, -22.1)], [v(-2.1, 1.8, -17.9), v(-2.1, 1.8, -22.1)], [v(2.1, 1.8, -17.9), v(2.1, 1.8, -22.1)]] as [T.Vector3, T.Vector3][]) { k.beam(a, b, 0.04, brass, 6); k.beam(a.clone().setY(0.85), a, 0.03, brass, 6); }
    k.box(1.8, 1.0, 1.1, 0, 1.3, -20, oak); k.box(2.0, 0.08, 1.3, 0, 1.84, -20, carpet).rotation.x = -0.18;
    for (const s of [-1, 1]) { k.cyl(0.05, 1.6, s * 1.6, 1.6, -18.2, brass, 0.05, 8); k.sphere(0.18, s * 1.6, 2.5, -18.2, k.glow(0xfff0d0), 10); }
    wallBlock(k, -2.5, 2.5, -22.6, -17.4);
    /* the pews, facing the ark, either side of the bimah; people in some of them and in the gallery */
    const seats = [...pews(k, [[-6.8, -1.2], [1.2, 6.8]], -11.6, -16.4, 0.95, oak, oakDark), ...pews(k, [[-6.8, -2.9], [2.9, 6.8]], -17.6, -22.4, 0.95, oak, oakDark), ...pews(k, [[-6.8, -1.2], [1.2, 6.8]], -23.6, -31.8, 0.95, oak, oakDark)];
    seated(k, seats, 34, 1580);
    for (const s of [-1, 1]) for (const [x, top] of [[8.4, GY + 0.85], [9.3, GY + 1.25]]) { const gs: [number, number][] = []; for (let z = -10.5; z > -31.5; z -= 0.75) gs.push([s * x, z]); seated(k, gs, 7, 1581 + s * 7 + x, top - 0.45, -s * PI / 2); }

    /* ---- people on the street: children in twos, congregants arriving, a teacher ---- */
    pigeons(k, [[-12, 17.8], [-11, 18.4], [9, 2.2], [10.2, 2.8], [-26, 2.4]], 0, 1582, ctx.reduced);
    traffic(k, 5, [9.8], -1, 110, -0.18, 1583, ctx.reduced);
    if (!ctx.reduced) {
      k.crowd([v(34, 0, 3.0), v(-40, 0, 3.0)], 16, { seed: 1584, speed: 0.9, spread: 0.8, scale: 0.72, colors: [0xd84a3a, 0x3a7ad8, 0xe8c83a, 0x2a2a34, 0xe8e2d4, 0x4a9a5a, 0x8a4ac8] });
      k.crowd([v(-40, 0, 16.0), v(34, 0, 16.0)], 9, { seed: 1585, speed: 1.1, spread: 1.4 });
      k.crowd([v(-3, 0, 17), v(-1, 0, 12), v(0, 0, 5.5), v(0, 0, -3), v(0, 0, -9.5), v(-9.4, 0, -10.5), v(-9.4, 0, -31.6)], 5, { seed: 1586, speed: 0.55, spread: 0.5, colors: [0x1c232c, 0x2a2a34, 0x3a2e2a, 0x2a3f6a, 0x151517] });
      k.crowd([v(12.5, 0, -4.6), v(31, 0, -4.6)], 7, { seed: 1587, speed: 0.8, spread: 2.2, scale: 0.7, colors: [0xd84a3a, 0x3a7ad8, 0xe8c83a, 0x4a9a5a, 0x8a4ac8] });
    }
    figure(k, 23, 0, 2.2, 0x2a3f6a, { rotY: PI / 2 });

    /* ---- the works: along the kerb on the synagogue side, the lobby, the school corridor ---- */
    const mounts: Mount[] = [];
    const boardM = k.flat(0x2a2a2a, 0.5, 0.5);
    for (const x of [-9.4, -5.6, 5.6, 9.4]) {
      k.box(2.7, 2.1, 0.12, x, 2.55, 2.3, k.flat(0x1a1c20, 0.2, 0.6));
      for (const e of [-1.2, 1.2]) k.box(0.08, 3.4, 0.08, x + e, 1.7, 2.3, boardM);
      k.box(2.5, 0.06, 0.6, x, 0.03, 2.3, boardM);
      mounts.push({ position: v(x, 2.55, 2.38), rotation: 0, target: v(x, 2.55, 6.2), width: 2.3, height: 1.7, style: 'black', wash: true });
      k.block(x - 1.3, x + 1.3, 2.1, 2.5);
    }
    for (const x of [-7.4, 7.4]) mounts.push({ position: v(x, 2.5, -1.12), rotation: PI, target: v(x, 2.5, -4.8), width: 2.2, height: 1.6, style: 'oak', wash: true });
    for (const x of [-7.6, 7.6]) mounts.push({ position: v(x, 2.5, ZL + 0.08), rotation: 0, target: v(x, 2.5, -3.9), width: 2.2, height: 1.6, style: 'oak', wash: true });
    for (const z of [-2.6, -5.6]) mounts.push({ position: v(-FW + 0.47, 2.5, z), rotation: PI / 2, target: v(-FW + 4.2, 2.5, z), width: 2.0, height: 1.5, style: 'oak', wash: true });
    for (const x of [15.6, 20.4, 25.2]) mounts.push({ position: v(x, 2.2, CZ0 - 0.02), rotation: PI, target: v(x, 2.2, -4.8), width: 2.2, height: 1.6, style: 'white', wash: true });
    for (const x of [15.8, 20.4, 25.0]) mounts.push({ position: v(x, 2.3, CZ1 + 0.02), rotation: 0, target: v(x, 2.3, -4.4), width: 1.7, height: 1.3, style: 'white', wash: true });
    k.censusWall({ x: CX1 - 0.02, y: 2.0, z: -4.6, rotY: -PI / 2, cols: 11, rows: 5, tile: 0.44, gap: 0.04, start: ctx.wallStart(1900, 55), pieces: ctx.all, backing: k.flat(0x2a4a8a, 0, 0.7) });

    /* ---- what the building knows ---- */
    const kj = { name: 'Congregation Kehilath Jeshurun, Wikipedia', url: 'https://en.wikipedia.org/wiki/Congregation_Kehilath_Jeshurun' };
    const rz = { name: 'Ramaz School, Wikipedia', url: 'https://en.wikipedia.org/wiki/Ramaz_School' };
    k.egg(v(0, fH + 1.9, 0.6), { id: 'anshe-jeshurun', title: 'Founded as Anshe Jeshurun', year: '1872 and 1902', text: 'The congregation was founded in 1872 as Anshe Jeshurun. In 1902 it built this neoclassical, Romanesque building in limestone on East 85th Street. It is a Modern Orthodox synagogue.', clue: 'Look up at the blank panel on the roofline.', source: kj }, { r: 2.6 });
    k.egg(v(-FW - 0.2, 9.9, -22), { id: 'forty-windows', title: 'Forty windows, half remade', year: '2011', text: 'The sanctuary has forty stained glass windows. A fire in July 2011, during minor renovations, destroyed nearly half of them, and they were recreated using historical and forensic analysis. The congregation prayed at the 92nd Street Y while the building was restored.', clue: 'Count the windows, top tier and bottom, both sides.', source: kj }, { r: 2.2 });
    k.egg(v(8.2, 1.4, -2.4), { id: 'one-front-door', title: 'One front door for two institutions', year: '2016', text: 'The $21 million rebuild after the fire gave the synagogue and the school a central entry with a single security point, an expanded lobby, and a new two storey, 8,000 square foot education and fitness wing above the synagogue. It won a Building Design+Construction Gold Award in 2016.', clue: 'Ask at the desk inside the door.', source: kj }, { r: 1.5 });
    k.egg(v(CX1 - 0.3, 3.2, -2.3), { id: 'ramaz-1937', title: 'A school named for initials', year: '1937', text: 'Ramaz was founded in 1937 with the synagogue\'s backing. Its name is made from the initials of Rabbi Moses Zevulun Margolies. Classes were once held in the synagogue\'s own vestry rooms.', clue: 'The end of the school corridor.', source: rz }, { r: 1.4 });
    k.egg(v(22.7, 1.4, CZ1 + 0.3), { id: 'gym-to-chapel', title: 'A gym became a chapel', year: '2018', text: 'In the same rebuild the lower school\'s gymnasium was turned into a chapel, which won an award from the American Institute of Architects in 2018. The congregation also added a scholar\'s library and an enlarged rooftop play terrace.', clue: 'One of the classroom doors in the school corridor.', source: kj }, { r: 2.4 });

    /* ---- where the visitor cannot go ---- */
    wallBlock(k, -FW - 0.2, -1.2, -1.05, 0.45); wallBlock(k, 1.2, FW + 0.6, -1.05, 0.45);
    wallBlock(k, -FW - 0.6, -FW + 0.4, ZS1 - 1, -1);
    wallBlock(k, FW - 0.4, FW + 0.6, -2.95, -1); wallBlock(k, FW - 0.4, FW + 0.6, ZS1 - 1, -5.45);
    wallBlock(k, -FW, -5.1, ZL - 0.65, ZL + 0.05); wallBlock(k, -2.9, -1.1, ZL - 0.65, ZL + 0.05); wallBlock(k, 1.1, 2.9, ZL - 0.65, ZL + 0.05); wallBlock(k, 5.1, FW, ZL - 0.65, ZL + 0.05);
    wallBlock(k, -FW, FW, ZS1 - 2, AZ + 3.0);
    wallBlock(k, FW + 0.6, 26.2, -1.25, 0.5); wallBlock(k, 28.8, 33, -1.25, 0.5);
    wallBlock(k, FW + 0.6, 33, -40, CZ1 - 0.05);
    wallBlock(k, CX1, 33, CZ1, CZ0);
    return { mounts, spawn: v(-4, 3, 17.2), look: v(1.5, 6.8, 0), eye: 3, floorY, bounds: [-40, 33, ZS1 + 0.5, 18.8], style: 'oak' };
  },
};

export const jewishcenter: RoomDef = {
  id: 'jewishcenter',
  name: 'The Jewish Center',
  area: 'THE JEWISH CENTER / WEST 86TH STREET',
  mood: 'Shul, school and swimming pool in one tall house',
  color: '#8a7a5c',
  daylit: true,
  description: 'Inside the doors of the tall Neo-Classical house on West 86th Street that members call the first shul with a pool: New Yorkers on the lobby walls, a grand stair rising straight ahead to the sanctuary, whose eternal light you can see from the door, and a stair on the right going down to the pool, where the lanes are never empty. The social hall opens on the left.',
  signatures: 'The tall front on West 86th Street with its limestone base, columns and three arched windows under brick storeys, the lobby, the grand stair to the sanctuary foyer, the sanctuary with its women\'s gallery, coffered ceiling and laylight, the ark and the eternal light, the social hall with its stage, and the swimming pool downstairs with swimmers in the lanes.',
  build(k, ctx) {
    k.sky({ top: 0x5a8fd0, horizon: 0xdce4ea, ground: 0x6a6660, fog: 0.004, sun: { az: 2.6, el: 0.8, color: 0xfff0d8, size: 7 }, env: 0.5 });
    k.hemi(0xeef2f8, 0x8a8478, 0.85);
    k.sun(0xfff0d8, 2.4, 40, 60, 70, true, 60);
    const lime = k.pbr('jcLime', X.ashlar(0xd8ccb4, 180, 5), 0.32, { normal: 0.4, roughness: 0.85 }),
      limeDark = k.pbr('jcLime2', X.ashlar(0xbcae92, 181, 4), 0.45, { normal: 0.4 }),
      brick = k.pbr('jcBrick', X.brick(0x9a6a4e, 182), 0.8, { normal: 0.5 }),
      pave = k.pbr('jcPave', X.pavers(0x9a968e, 183), 0.5), asphalt = k.pbr('jcAsph', X.asphalt(), 0.2),
      plaster = k.pbr('jcPlaster', X.plaster(0xf0e2c4, 184), 0.3, { roughness: 0.9 }),
      marbleF = k.pbr('jcFloor', X.marble(0xd8d0c0, 0x8a8478, 185), 0.3, { roughness: 0.35 }),
      marbleDark = k.pbr('jcMarble2', X.marble(0x4a5a58, 0x2a3432, 186), 0.4, { roughness: 0.3 }),
      parquet = k.pbr('jcParquet', X.planks(0x8a5a34, 8, 187), 0.9, { roughness: 0.45 }),
      oak = k.pbr('jcOak', X.planks(0x5a3a22, 5, 188), 0.8, { roughness: 0.6 }), oakDark = k.flat(0x3a2616, 0, 0.6),
      carpet = k.pbr('jcCarpet', X.carpet(0x6a1a22, 0xb89a4a), 0.6, { roughness: 1 }),
      tile = k.pbr('jcTile', X.subwayTile(0xe8eef0, 0x8a9aa0), 2.4, { roughness: 0.3 }),
      tileBlue = k.pbr('jcTileB', X.subwayTile(0x3a7aa8, 0x2a4a60), 2.4, { roughness: 0.3 }),
      brass = k.flat(0xc8a048, 0.9, 0.3), gilt = k.pbr('jcGilt', X.gilt(), 2, { metalness: 0.9, roughness: 0.3 }),
      iron = k.flat(0x1a1a1a, 0.6, 0.5), dark = k.flat(0x14100c, 0, 0.9), cream = k.flat(0xefe6d4, 0, 0.85);
    const FW = 12, ZL = -10, SY = 4.5, ZF0 = -17, ZF1 = -20.5, ZS1 = -46, HS = 16.5, PX0 = 17.5, PY = -4.5;

    /* ---- the floors: street, lobby, the grand stair up, the stair down to the pool ---- */
    const floorY = (x: number, z: number) => {
      if (z > 5 && z < 16) return -0.18;
      if (x > 12.5 && z < -0.9) return x < PX0 ? (PY * (x - 12.5)) / (PX0 - 12.5) : PY;
      if (Math.abs(x) <= 3.4 && z <= ZL && z > ZF0) return (SY * (ZL - z)) / (ZL - ZF0);
      if (z <= ZF0 && Math.abs(x) < 12.4) return SY;
      return 0;
    };

    /* ---- West 86th Street ---- */
    k.box(100, 0.3, 5, 0, -0.15, 2.5, pave); k.box(100, 0.3, 4.5, 0, -0.15, 18.25, pave);
    k.box(100, 0.2, 11, 0, -0.28, 10.5, asphalt);
    for (const z of [5, 16]) k.box(100, 0.2, 0.25, 0, -0.08, z, limeDark);
    for (let x = -46; x < 46; x += 6) k.box(3, 0.02, 0.15, x, -0.17, 10.5, k.flat(0xe8d24a, 0, 0.8));
    for (const [x, z] of [[-18, 4.2], [-7.5, 4.2], [16, 4.2], [27, 4.2], [-22, 16.8], [-8, 16.8], [9, 16.8], [24, 16.8]]) { k.tree(x, 0, z, { h: 7, r: 2.5, seed: 158 + x, leaf: 0x4a7a3a }); k.keepOut.push({ x, z, r: 0.7 }); }
    for (const x of [-26, 6, 30]) k.lamp(x, 4.6, 5.6, iron, 0xffe0b0, 8);
    const texs = [rowhouseTex(1581, '#6a4434', '#8a6a54'), rowhouseTex(1582, '#b8a88a', '#8a7a64'), rowhouseTex(1583, '#5a3a2e', '#7a5a48'), rowhouseTex(1584, '#8a5a44', '#c8b8a0')].map((t) => new T.MeshStandardMaterial({ map: t, roughness: 0.85 }));
    rowhouses(k, -46, 7, 6, 20.5, -1, 2, texs);
    rowhouses(k, 16, 5, 6, 20.5, -1, 4, texs);
    /* the neighbours on the Center's side: prewar apartment houses, taller and plainer */
    const apt = k.pbr('jcApt', X.windows(1585, 0.3, 0xb8a488, true), 0.14, { stretch: 0.5, roughness: 0.8 });
    const apt2 = k.pbr('jcApt2', X.windows(1586, 0.3, 0x9a7a60, true), 0.14, { stretch: 0.5, roughness: 0.8 });
    k.box(28, 44, 30, -26.5, 22, -14.5, apt); k.box(28.4, 1, 30.4, -26.5, 44.5, -14.5, limeDark);
    k.box(26, 36, 30, 25.5, 18, -14.5, apt2); k.box(26.4, 1, 30.4, 25.5, 36.5, -14.5, limeDark);
    for (const x of [-26.5, 25.5]) k.box(x < 0 ? 28 : 26, 4.2, 0.4, x, 2.1, 0.2, limeDark);
    k.box(10, 58, 24, 5.5, 29, 32.5, k.pbr('jcTower', X.windows(1587, 0.2, 0x8a8074, true), 0.12, { stretch: 0.5 }));

    /* ---- the front: a limestone base with columns and three arched windows, brick storeys above ---- */
    const BASE = 17, TOP = 40;
    k.mesh(holed(2 * FW, BASE, 1, [
      { cx: 0, y0: 0.02, w: 3.6, h: 5.4 }, { cx: -6.6, y0: 1.3, w: 2.2, h: 3.0, square: true }, { cx: 6.6, y0: 1.3, w: 2.2, h: 3.0, square: true },
      { cx: -6, y0: 7.2, w: 3.2, h: 8.4 }, { cx: 0, y0: 7.2, w: 3.2, h: 8.4 }, { cx: 6, y0: 7.2, w: 3.2, h: 8.4 },
    ]), lime, 0, 0, -0.5);
    const upper: Hole[] = [];
    for (let r = 0; r < 6; r++) for (const cx of [-8.4, -4.2, 0, 4.2, 8.4]) upper.push({ cx, y0: 1.2 + r * 3.7, w: 1.7, h: 2.3, square: true });
    k.mesh(holed(2 * FW, TOP - BASE, 1, upper), brick, 0, BASE, -0.5);
    k.plane(2 * FW - 0.2, TOP - BASE, 0, BASE + (TOP - BASE) / 2, -0.8, k.pbr('jcUpperWin', X.windows(1588, 0.35, 0x2a3440, true), 0.3, { emissive: 0xffffff, emissiveIntensity: 0.6, roughness: 0.3 }));
    for (const r of [0, 1, 2, 3, 4, 5]) k.box(2 * FW - 1, 0.18, 0.3, 0, BASE + 1.1 + r * 3.7, 0.08, limeDark);
    k.box(2 * FW + 0.8, 1.1, 1.3, 0, BASE, 0.1, limeDark);
    k.box(2 * FW + 1.2, 1.2, 1.6, 0, TOP, 0.1, limeDark); k.box(2 * FW + 0.4, 0.5, 1.2, 0, TOP - 0.8, 0.05, lime);
    for (let i = 0; i < 50; i++) k.box(0.2, 0.26, 0.26, -12.25 + i * 0.5, TOP - 0.45, 0.7, limeDark);
    k.box(2 * FW, TOP - BASE, 50, 0, BASE + (TOP - BASE) / 2, -26, brick);
    for (const x of [-9, -3, 3, 9]) k.column(x, 6.2, 0.35, 10.2, 0.42, lime, true, limeDark);
    k.box(2 * FW + 0.4, 0.5, 1.1, 0, 6.0, 0.1, limeDark); k.box(2 * FW + 0.4, 0.8, 1.1, 0, 16.6, 0.1, limeDark);
    for (const cx of [-6, 0, 6]) k.mesh(archRing(3.8, 8.7, 3.2, 8.4, 0), limeDark, cx, 7.2, 0.02);
    k.mesh(archRing(4.4, 5.8, 3.6, 5.4, 0), limeDark, 0, 0.02, 0.02);
    k.sign('THE JEWISH CENTER', 7, 0.6, 0, 6.65, 0.7, '#c8bca0', '#4a3e2e', 62);
    const glassOut = new T.MeshStandardMaterial({ map: stainedGlass(1589, 176, 480, [0x3a5a8a, 0xc8a84a, 0xd8c890, 0x5a7a6a, 0x8a3a2a]), color: 0x8a8480, roughness: 0.15, metalness: 0.3, side: T.DoubleSide });
    for (const cx of [-6, 0, 6]) k.plane(3.2, 8.4, cx, 11.4, -0.5, glassOut);
    const darkGlass = k.flat(0x1a2228, 0.6, 0.15);
    for (const cx of [-6.6, 6.6]) k.plane(2.2, 3.0, cx, 2.8, -0.7, darkGlass);
    /* the doors: bronze and glass, one swinging now and then */
    const leaves: T.Object3D[] = [];
    for (const s of [-1, 1]) {
      const g = new T.Group(); g.position.set(s * 1.8, 0, -0.3); g.rotation.y = s * 1.2;
      const leaf = new T.Mesh(new T.BoxGeometry(1.8, 3.6, 0.1), k.flat(0x3a2e22, 0.6, 0.4)); leaf.position.set(-s * 0.9, 1.8, 0); g.add(leaf);
      const pane = new T.Mesh(new T.BoxGeometry(1.2, 2.2, 0.12), k.glass(0xcfe0ea, 0.3, 0.1)); pane.position.set(-s * 0.9, 2.0, 0); g.add(pane);
      k.add(g); leaves.push(g);
    }
    if (!ctx.reduced) k.ticks.push((t) => { leaves[1].rotation.y = 0.3 + 0.9 * Math.abs(Math.sin(t * 0.25)); });

    /* ---- the lobby ---- */
    k.box(2 * FW, 0.3, -ZL + 1, 0, -0.15, ZL / 2, marbleF);
    k.box(3.2, 0.02, -ZL - 1, 0, 0.01, (ZL - 1) / 2, carpet);
    const LH = 4.8;
    const lobbyC = canvasTex(256, 256, (g) => { g.fillStyle = '#d8c8a4'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#f2e8d4'; g.fillRect(16, 16, 224, 224); g.strokeStyle = '#b8903a'; g.lineWidth = 6; g.strokeRect(40, 40, 176, 176); g.fillStyle = '#b8903a'; g.beginPath(); g.arc(128, 128, 14, 0, PI * 2); g.fill(); }, true);
    lobbyC.repeat.set(7, 3);
    k.plane(2 * FW - 1, -ZL - 1, 0, LH, (ZL - 1) / 2, new T.MeshStandardMaterial({ map: lobbyC, roughness: 0.85, emissive: 0xffffff, emissiveMap: lobbyC, emissiveIntensity: 0.12 }), 0, PI / 2);
    for (const x of [-9, -4.5, 4.5, 9]) k.box(0.22, 0.2, -ZL - 1, x, LH - 0.1, (ZL - 1) / 2, gilt);
    for (const s of [-1, 1]) k.box(0.1, 0.24, -ZL - 1, s * (FW - 1.05), LH - 0.4, (ZL - 1) / 2, gilt);
    for (const s of [-1, 1]) k.bench(s * 5.2, -6.2, s > 0 ? -PI / 2 : PI / 2, oak, brass, 2.2);
    for (const s of [-1, 1]) k.box(6.2, LH, 0.05, s * 8.4, LH / 2, -1.02, plaster);
    for (const s of [-1, 1]) {
      const w = k.mesh(holed(-ZL - 1, LH, 1, [{ cx: 0, y0: 0.02, w: 2.6, h: 3.4 }]), plaster, s * (FW - 0.5), 0, (ZL - 1) / 2);
      w.rotation.y = PI / 2;
      k.box(0.06, 1.0, -ZL - 1, s * (FW - 1.03), 0.5, (ZL - 1) / 2, oak);
    }
    k.mesh(holed(2 * FW, LH, 0.6, [{ cx: 0, y0: 0.02, w: 6.4, h: LH - 0.1, square: true }]), plaster, 0, 0, ZL - 0.3);
    for (const sx of [-1, 1]) k.box(FW - 3.2, 1.0, 0.06, sx * (FW + 3.2) / 2, 0.5, ZL + 0.03, oak);
    for (const x of [-6.5, 6.5]) { k.beam(v(x, LH, -4.5), v(x, LH - 0.9, -4.5), 0.02, brass, 4); k.torus(0.6, 0.05, x, LH - 0.95, -4.5, brass, 20).rotation.x = PI / 2; k.sphere(0.3, x, LH - 1.1, -4.5, k.glow(0xffe8c0), 12); }
    for (const x of [-6, 6]) k.point(x, 3.6, -4.5, 0xffe4c0, 18, 12);
    k.sign('SOCIAL HALL', 2.4, 0.3, -FW + 1.02, 3.75, -5.5, '#3a2e22', '#e8dcc4', 110, PI / 2);
    k.sign('POOL', 1.4, 0.3, FW - 1.02, 3.75, -5.5, '#1c3a5a', '#e8f0f4', 150, -PI / 2);
    k.sign('SANCTUARY', 2.6, 0.32, 0, 5.5, ZL - 0.62, '#3a2e22', '#e8dcc4', 120);

    /* ---- the grand stair and the sanctuary foyer ---- */
    const NST = 14;
    for (let i = 0; i < NST; i++) { const h = (SY * (i + 1)) / NST, z = ZL - ((i + 0.5) * (ZL - ZF0)) / NST; k.box(6.4, h, (ZF0 - ZL) / -NST + 0.02, 0, h / 2, z, marbleF); k.box(3.2, 0.02, (ZF0 - ZL) / -NST, 0, h + 0.01, z, carpet); }
    for (const s of [-1, 1]) {
      k.box(0.6, 10, ZL - ZF0, s * 3.5, 5, (ZL + ZF0) / 2, plaster);
      k.beam(v(s * 3.1, 1.0, ZL - 0.2), v(s * 3.1, SY + 1.0, ZF0), 0.05, brass, 6);
    }
    k.plane(2 * FW, ZL - ZF1, 0, 9.8, (ZL + ZF1) / 2, cream, 0, PI / 2);
    k.box(2 * FW, 0.4, ZF0 - ZF1, 0, SY - 0.2, (ZF0 + ZF1) / 2, marbleF);
    for (const s of [-1, 1]) k.box(FW - 3.8, 5.4, 0.4, s * (FW + 3.8) / 2, SY + 2.7, ZF0 + 0.2, plaster);
    for (const s of [-1, 1]) k.box(0.4, 5.4, ZF0 - ZF1, s * (FW - 0.3), SY + 2.7, (ZF0 + ZF1) / 2, plaster);
    k.mesh(holed(2 * FW, 5.4, 0.6, [{ cx: -5.4, y0: 0.02, w: 2.2, h: 3.6 }, { cx: 0, y0: 0.02, w: 3.2, h: 4.4 }, { cx: 5.4, y0: 0.02, w: 2.2, h: 3.6 }]), plaster, 0, SY, ZF1 - 0.3);
    k.mesh(archRing(3.8, 4.7, 3.2, 4.4, 0), gilt, 0, SY + 0.02, ZF1 + 0.02);
    k.point(0, SY + 4.2, (ZF0 + ZF1) / 2, 0xffe4c0, 16, 12);
    k.sphere(0.4, 0, 9.2, (ZF0 + ZF1) / 2, k.glow(0xffe8c0), 12);

    /* ---- the sanctuary, a storey up ---- */
    k.box(2 * FW, 0.4, ZF1 - ZS1, 0, SY - 0.2, (ZF1 + ZS1) / 2, marbleF);
    k.box(2.2, 0.02, ZF1 - ZS1 - 3, 0, SY + 0.01, (ZF1 + ZS1) / 2, carpet);
    const bays = [-25, -30, -35, -40];
    for (const s of [-1, 1]) {
      k.box(0.8, HS - SY, ZF1 - ZS1, s * (FW - 0.1), (HS + SY) / 2, (ZF1 + ZS1) / 2, plaster);
      for (const z of [...bays.map((b) => b + 2.5), -22.6]) k.box(0.9, HS - SY - 0.8, 0.9, s * (FW - 0.7), (HS + SY) / 2 - 0.4, z, cream);
    }
    /* blind arches with stained glass lit from lightwells behind */
    const sgM = [0, 1].map((i) => new T.MeshBasicMaterial({ map: stainedGlass(1590 + i, 176, 480, i ? [0x3a5a8a, 0xc8a84a, 0xd8c890, 0x5a7a6a, 0x8a3a2a] : [0x2a4a98, 0xc89a3a, 0x8a1a22, 0xd8c890, 0x3a6a4a]), color: 0xd0c8c0, side: T.DoubleSide }));
    for (const s of [-1, 1]) bays.forEach((z, i) => { k.plane(2.4, 5.6, s * (FW - 0.52), SY + 7.8, z, sgM[(i + (s > 0 ? 1 : 0)) % 2], -s * PI / 2); k.mesh(archRing(3.0, 6.0, 2.4, 5.6, 0), cream, s * (FW - 0.5), SY + 5.0, z).rotation.y = -s * PI / 2; });
    /* the women's gallery: a U on columns, panelled front with a brass rail */
    const GY = SY + 4.4, GX = 8.2;
    for (const s of [-1, 1]) {
      k.box(FW - GX, 0.45, 21.5, s * (FW + GX) / 2, GY, -31.25, cream);
      k.box(0.22, 1.1, 18, s * GX, GY + 0.75, -33, oak);
      k.box(0.3, 0.08, 18, s * GX, GY + 1.33, -33, brass);
      for (const z of [-25, -30, -35, -40]) { k.cyl(0.24, GY - SY, s * GX, (GY + SY) / 2, z, cream, 0.28, 14); k.keepOut.push({ x: s * GX, z, r: 0.45 }); }
    }
    k.box(2 * GX, 0.45, 3.5, 0, GY, ZF1 - 1.75, cream); k.box(2 * GX, 1.1, 0.22, 0, GY + 0.75, ZF1 - 3.5, oak); k.box(2 * GX, 0.08, 0.3, 0, GY + 1.33, ZF1 - 3.5, brass);
    /* the coffered ceiling with its laylight */
    const coffer = canvasTex(256, 256, (g) => {
      g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, 256, 256);
      g.fillStyle = '#c8b890'; g.fillRect(14, 14, 228, 228);
      g.fillStyle = '#f0e8d4'; g.fillRect(34, 34, 188, 188);
      g.strokeStyle = '#b8903a'; g.lineWidth = 5; g.strokeRect(52, 52, 152, 152);
      g.fillStyle = '#b8903a'; g.beginPath(); g.arc(128, 128, 20, 0, PI * 2); g.fill();
    }, true);
    coffer.repeat.set(6, 6);
    k.plane(2 * FW, ZF1 - ZS1, 0, HS, (ZF1 + ZS1) / 2, new T.MeshStandardMaterial({ map: coffer, roughness: 0.85, emissive: 0xffffff, emissiveMap: coffer, emissiveIntensity: 0.15 }), 0, PI / 2);
    { const lay = new T.MeshBasicMaterial({ map: stainedGlass(1592, 256, 512, [0xd8c890, 0xe8dcb8, 0xc8a84a, 0x8aa8c8, 0xd8d0c0]), color: 0xf0e8d8 }); const o = k.mesh(new T.CircleGeometry(1, 48), lay, 0, HS - 0.05, -33); o.rotation.x = PI / 2; o.scale.set(5, 8, 1); const tr = k.torus(1, 0.03, 0, HS - 0.08, -33, gilt, 48); tr.rotation.x = PI / 2; tr.scale.set(5.1, 8.1, 1); }
    k.box(2 * FW + 1, 0.6, ZF0 - ZS1 + 1, 0, HS + 0.5, (ZF0 + ZS1) / 2, dark);
    /* the ark wall: Ionic columns, a pediment, oak doors, the eternal light */
    k.box(2 * FW, HS - SY, 0.8, 0, (HS + SY) / 2, ZS1 - 0.4, plaster);
    const AZ = ZS1 + 0.5;
    for (let i = 0; i < 4; i++) k.box(10 - i * 1.4, 0.25 * (i + 1), 1.1, 0, SY + 0.125 * (i + 1), AZ + 3.0 - i * 0.55, marbleF);
    k.box(6.4, 7.4, 0.8, 0, SY + 1 + 3.7, AZ, marbleDark);
    k.box(3.2, 4.8, 0.2, 0, SY + 1 + 2.6, AZ + 0.45, oak);
    for (const x of [-0.8, 0.8]) for (const y of [2.2, 3.4, 4.6]) k.box(1.1, 0.05, 0.06, x, SY + 1 + y - 0.6, AZ + 0.57, gilt);
    for (const s of [-1, 1]) k.column(s * 3.6, SY + 1, AZ + 0.7, 7.2, 0.3, cream, true, gilt);
    { const pd = new T.Shape(); pd.moveTo(-4.4, 0); pd.lineTo(4.4, 0); pd.lineTo(0, 1.7); pd.closePath(); const pg = new T.ExtrudeGeometry(pd, { depth: 0.7, bevelEnabled: false }); pg.translate(0, 0, -0.35); k.mesh(pg, cream, 0, SY + 8.6, AZ + 0.6); k.box(9, 0.4, 1.1, 0, SY + 8.45, AZ + 0.6, gilt); }
    nerTamid(k, 0, SY + 6.6, AZ + 3.0, HS, brass, ctx.reduced, 1);
    k.spot(0, HS - 1, -30, 0, SY + 4, AZ, 0xffe6c0, 170, 0.45, 0.6, 30);
    /* the bimah in the middle, the pews round it, people in some */
    k.box(4.2, 0.8, 4.2, 0, SY + 0.4, -32, marbleF);
    for (const [a, b] of [[v(-2, SY + 1.8, -30), v(2, SY + 1.8, -30)], [v(-2, SY + 1.8, -34), v(2, SY + 1.8, -34)], [v(-2, SY + 1.8, -30), v(-2, SY + 1.8, -31.2)], [v(-2, SY + 1.8, -32.8), v(-2, SY + 1.8, -34)], [v(2, SY + 1.8, -30), v(2, SY + 1.8, -34)]] as [T.Vector3, T.Vector3][]) { k.beam(a, b, 0.04, brass, 6); k.beam(a.clone().setY(SY + 0.85), a, 0.03, brass, 6); }
    k.box(1.8, 1.0, 1.1, 0, SY + 1.3, -32, oak);
    wallBlock(k, -2.4, 2.4, -34.4, -29.6);
    {
      const seats = [...pews(k, [[-7.4, -1.2], [1.2, 7.4]], -24.6, -28.8, 0.95, oak, oakDark, true, SY), ...pews(k, [[-7.4, -2.8], [2.8, 7.4]], -29.8, -34.2, 0.95, oak, oakDark, true, SY), ...pews(k, [[-7.4, -1.2], [1.2, 7.4]], -35.2, -41.6, 0.95, oak, oakDark, true, SY)];
      seated(k, seats, 30, 1593, SY);
      for (const s of [-1, 1]) { k.box(0.5, 0.45, 20, s * 9.6, GY + 0.45, -31.5, oakDark); const gs: [number, number][] = []; for (let z = -22; z > -41; z -= 0.75) gs.push([s * 9.6, z]); seated(k, gs, 9, 1600 + s, GY + 0.2, -s * PI / 2); }
    }
    /* chandeliers under the gallery and a big one before the ark */
    for (const z of [-26, -38]) { k.beam(v(0, HS, z), v(0, HS - 3, z), 0.03, brass, 4); k.torus(1.3, 0.06, 0, HS - 3.1, z, brass, 28).rotation.x = PI / 2; k.sphere(0.5, 0, HS - 3.3, z, k.glow(0xffe0b0), 12); k.point(0, HS - 3.6, z, 0xffdcaa, 40, 18); }
    for (const z of [-27, -38]) for (const x of [-10, 10]) k.point(x, SY + 3, z, 0xffe4bc, 8, 8);

    /* ---- the social hall off the lobby ---- */
    const HX0 = -30, HX1 = -12.5, HZ0 = -1, HZ1 = -18, HH = 5.5;
    k.box(HX1 - HX0, 0.3, HZ0 - HZ1, (HX0 + HX1) / 2, -0.15, (HZ0 + HZ1) / 2, parquet);
    k.plane(HX1 - HX0, HZ0 - HZ1, (HX0 + HX1) / 2, HH, (HZ0 + HZ1) / 2, cream, 0, PI / 2);
    const hallWall = k.flat(0xd8cdb4, 0, 0.9);
    k.box(HX1 - HX0, HH, 0.3, (HX0 + HX1) / 2, HH / 2, HZ0 - 0.15, hallWall);
    k.box(HX1 - HX0, HH, 0.3, (HX0 + HX1) / 2, HH / 2, HZ1 + 0.15, hallWall);
    k.box(0.3, HH, HZ0 - HZ1, HX0 + 0.15, HH / 2, (HZ0 + HZ1) / 2, hallWall);
    k.box(0.1, HH, 11, HX1 - 0.05, HH / 2, -12.5, hallWall); k.box(0.1, HH, 3.2, HX1 - 0.05, HH / 2, -2.6, hallWall); k.box(0.1, HH - 3.4, 2.6, HX1 - 0.05, 3.4 + (HH - 3.4) / 2, -5.5, hallWall);
    for (let x = HX0 + 3; x < HX1; x += 4) k.box(0.4, 0.4, HZ0 - HZ1, x, HH - 0.2, (HZ0 + HZ1) / 2, cream);
    /* the stage at the west end, its curtain drawn back */
    k.box(3.4, 1.0, 13, HX0 + 1.7 + 0.3, 0.5, (HZ0 + HZ1) / 2, oak);
    for (const s of [-1, 1]) k.box(0.5, 4.2, 2.2, HX0 + 3.2, 3.1, (HZ0 + HZ1) / 2 + s * 5.6, k.flat(0x6a1a22, 0, 0.95));
    k.box(0.5, 0.8, 13.2, HX0 + 3.2, HH - 0.4, (HZ0 + HZ1) / 2, k.flat(0x6a1a22, 0, 0.95));
    wallBlock(k, HX0, HX0 + 3.8, HZ1, HZ0);
    /* round tables laid for a kiddush, chairs round them */
    const tables: [number, number][] = [[-24, -7.8], [-18.6, -7.8], [-24, -11.4], [-18.6, -11.4]];
    const chairM: T.Matrix4[] = [];
    for (const [x, z] of tables) {
      k.cyl(0.9, 0.06, x, 0.78, z, k.flat(0xf4f0e8, 0, 0.8), 0.9, 24); k.cyl(0.08, 0.75, x, 0.38, z, iron, 0.1, 8);
      for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2; chairM.push(new T.Matrix4().compose(v(x + Math.cos(a) * 1.25, 0, z + Math.sin(a) * 1.25), new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), -a - PI / 2), one)); }
      k.keepOut.push({ x, z, r: 1.6 });
    }
    k.instances(mergeGeometries([new T.BoxGeometry(0.45, 0.05, 0.45).translate(0, 0.46, 0).toNonIndexed(), new T.BoxGeometry(0.45, 0.5, 0.04).translate(0, 0.72, -0.21).toNonIndexed(), new T.CylinderGeometry(0.02, 0.02, 0.46, 5).translate(0.18, 0.23, 0.18).toNonIndexed(), new T.CylinderGeometry(0.02, 0.02, 0.46, 5).translate(-0.18, 0.23, 0.18).toNonIndexed()])!, k.flat(0xb8903a, 0.6, 0.4), chairM);
    for (const [x, z] of [[-24, -9.6], [-18.6, -9.6], [-15, -4.4]]) { k.beam(v(x, HH, z), v(x, HH - 1, z), 0.02, brass, 4); k.sphere(0.45, x, HH - 1.3, z, k.glow(0xffe8c0), 12); k.point(x, HH - 1.6, z, 0xffe4c0, 16, 12); }
    figure(k, -15.5, 0, -9.5, 0x2a2a34, { rotY: PI / 2 }); figure(k, -21.3, 0, -14.8, 0x6a2a2a); figure(k, -27, 1.0, -9.5, 0x1c232c, { rotY: -PI / 2 });

    /* ---- the stair down and the pool ---- */
    const PX1 = 38, PZ0 = -1, PZ1 = -22, PH = -0.4;
    for (let i = 0; i < 12; i++) { const x0 = 12.5 + (i * (PX0 - 12.5)) / 12, y = (PY * (i + 1)) / 12; k.box((PX0 - 12.5) / 12 + 0.02, 0.2, 3.0, x0 + (PX0 - 12.5) / 24, y + 0.1 - 0.2, -5.5, k.pbr('jcStep', X.terrazzo(0xc8d0d4, 189), 0.6)); k.box((PX0 - 12.5) / 12, y - PY, 3.0, x0 + (PX0 - 12.5) / 24, (y + PY) / 2 - 0.2, -5.5, tile); }
    for (const z of [-3.85, -7.15]) k.box(PX0 - 12.5, LH - PY, 0.3, (12.5 + PX0) / 2, (LH + PY) / 2, z, tile);
    k.plane(PX0 - 12.5, 3.3, (12.5 + PX0) / 2, LH, -5.5, cream, 0, PI / 2);
    for (const z of [-4.2, -6.8]) k.beam(v(12.6, 1.0, z), v(PX0, PY + 1.0, z), 0.04, k.flat(0xd8dce0, 1, 0.25), 6);
    k.box(PX1 - PX0, 0.3, PZ0 - PZ1, (PX0 + PX1) / 2, PY - 2.15, (PZ0 + PZ1) / 2, tileBlue);
    const deck = k.pbr('jcDeck', X.subwayTile(0xd8dcd8, 0x9aa4a4), 3, { roughness: 0.5 });
    const PPX0 = 19.5, PPX1 = 36.5, PPZ0 = -6, PPZ1 = -17;
    k.box(PX1 - PX0, 0.3, PZ0 - PPZ0, (PX0 + PX1) / 2, PY - 0.15, (PZ0 + PPZ0) / 2, deck);
    k.box(PX1 - PX0, 0.3, PPZ1 - PZ1, (PX0 + PX1) / 2, PY - 0.15, (PPZ1 + PZ1) / 2, deck);
    k.box(PPX0 - PX0, 0.3, PPZ0 - PPZ1, (PX0 + PPX0) / 2, PY - 0.15, (PPZ0 + PPZ1) / 2, deck);
    k.box(PX1 - PPX1, 0.3, PPZ0 - PPZ1, (PPX1 + PX1) / 2, PY - 0.15, (PPZ0 + PPZ1) / 2, deck);
    for (const z of [PPZ0 + 0.1, PPZ1 - 0.1]) k.box(PPX1 - PPX0, 1.9, 0.2, (PPX0 + PPX1) / 2, PY - 1.1, z, tileBlue);
    for (const x of [PPX0 - 0.1, PPX1 + 0.1]) k.box(0.2, 1.9, PPZ0 - PPZ1, x, PY - 1.1, (PPZ0 + PPZ1) / 2, tileBlue);
    for (let i = 0; i < 4; i++) k.box(PPX1 - PPX0 - 2, 0.02, 0.25, (PPX0 + PPX1) / 2, PY - 1.95, PPZ0 - 2.2 * (i + 1), k.flat(0x1a2a4a, 0, 0.6));
    const water = k.water({ y: PY - 0.25, color: 0x2a8ab0, w: PPX1 - PPX0, d: PPZ0 - PPZ1, x: (PPX0 + PPX1) / 2, z: (PPZ0 + PPZ1) / 2, amp: 0.12 });
    { const m = water.material as T.MeshStandardMaterial; m.metalness = 0.05; m.envMapIntensity = 0.25; m.roughness = 0.12; m.transparent = true; m.opacity = 0.82; }
    for (let i = 1; i < 5; i++) { const z = PPZ0 - 2.2 * i; k.curve([v(PPX0, PY - 0.22, z), v((PPX0 + PPX1) / 2, PY - 0.25, z), v(PPX1, PY - 0.22, z)], 0.05, k.flat(i % 2 ? 0xd83a3a : 0xf0f0f0, 0, 0.5), 16); }
    k.box(PX1 - PX0, PH - PY, 0.3, (PX0 + PX1) / 2, (PH + PY) / 2, PZ0 - 0.15, tile);
    k.box(PX1 - PX0, PH - PY, 0.3, (PX0 + PX1) / 2, (PH + PY) / 2, PZ1 + 0.15, tile);
    k.box(0.3, PH - PY, PZ0 - PZ1, PX1 + 0.15, (PH + PY) / 2, (PZ0 + PZ1) / 2, tile);
    k.box(0.3, PH - PY, 2.85, PX0 - 0.15, (PH + PY) / 2, (PZ0 - 3.85) / 2, tile); k.box(0.3, PH - PY, 14.85, PX0 - 0.15, (PH + PY) / 2, (PZ1 - 7.15) / 2, tile); k.box(0.3, LH - PH, 3.3, PX0 - 0.15, (LH + PH) / 2, -5.5, tile);
    k.box(PX1 - PX0, 0.8, 0.05, (PX0 + PX1) / 2, PY + 0.4, PZ0 - 0.31, tileBlue); k.box(PX1 - PX0, 0.8, 0.05, (PX0 + PX1) / 2, PY + 0.4, PZ1 + 0.31, tileBlue);
    k.plane(PX1 - PX0, PZ0 - PZ1, (PX0 + PX1) / 2, PH, (PZ0 + PZ1) / 2, k.flat(0xe8eef0, 0, 0.8), 0, PI / 2);
    for (let x = PX0 + 2.5; x < PX1; x += 5) for (const z of [-4, -11.5, -19]) k.box(1.4, 0.05, 1.4, x, PH - 0.03, z, k.glow(0xf0f8ff));
    for (const x of [22, 30]) for (const z of [-7, -16]) k.point(x, PH - 0.8, z, 0xe8f4ff, 22, 14);
    k.point(28, PY - 1.2, -11.5, 0x4ac8ff, 12, 12);
    k.sign('THE JEWISH CENTER POOL', 6, 0.5, (PX0 + PX1) / 2, PY + 3.0, PZ1 + 0.32, '#1c3a5a', '#e8f0f4', 64);
    /* the lifeguard's chair and a bench */
    k.box(0.1, 1.8, 0.1, 37, PY + 0.9, -11, k.flat(0xf0f0f0, 0, 0.5)); k.box(0.7, 0.1, 0.7, 37, PY + 1.8, -11.5, k.flat(0xf0f0f0, 0, 0.5));
    figure(k, 37, PY + 1.85, -11.5, 0xd83a3a, { rotY: -PI / 2, h: 0.7 });
    /* swimmers doing lengths, one per lane, turning at the walls */
    {
      const n = 5, sw = k.instances(mergeGeometries([new T.CapsuleGeometry(0.2, 0.9, 3, 8).rotateZ(PI / 2).toNonIndexed(), new T.SphereGeometry(0.14, 10, 8).translate(0.72, 0.06, 0).toNonIndexed(), new T.BoxGeometry(0.9, 0.06, 0.14).translate(0.9, 0.12, 0.2).toNonIndexed()])!, new T.MeshStandardMaterial({ roughness: 0.6 }), Array.from({ length: n }, () => new T.Matrix4()));
      sw.frustumCulled = false;
      const c = new T.Color(), caps = [0xd83a3a, 0x3a7ad8, 0xe8c83a, 0xf0f0f0, 0x1a1a1a];
      for (let i = 0; i < n; i++) sw.setColorAt(i, c.set(caps[i]));
      if (sw.instanceColor) sw.instanceColor.needsUpdate = true;
      const len = PPX1 - PPX0 - 2.4, m = new T.Matrix4(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0), p = new T.Vector3();
      const place = (t: number) => {
        for (let i = 0; i < n; i++) {
          const sp = 0.9 + i * 0.12, u = ((t * sp) / len + i * 0.37) % 2, dir = u < 1 ? 1 : -1, f = u < 1 ? u : 2 - u;
          p.set(PPX0 + 1.2 + f * len, PY - 0.3 + 0.04 * Math.sin(t * 6 + i), PPZ0 - 1.1 - 2.2 * i);
          q.setFromAxisAngle(up, dir > 0 ? 0 : PI); m.compose(p, q, one); sw.setMatrixAt(i, m);
        }
        sw.instanceMatrix.needsUpdate = true;
      };
      place(3); if (!ctx.reduced) k.ticks.push(place);
    }
    wallBlock(k, PPX0 - 0.3, PPX1 + 0.3, PPZ1 - 0.3, PPZ0 + 0.3);

    /* ---- people: the street, the lobby, the stair, the sanctuary ---- */
    pigeons(k, [[-12, 2.2], [-11, 2.8], [12, 18.6], [13, 18.2], [-30, 3]], 0, 1594, ctx.reduced);
    traffic(k, 7, [8, 13], 1, 120, -0.18, 1595, ctx.reduced);
    if (!ctx.reduced) {
      k.crowd([v(-46, 0, 2.6), v(46, 0, 2.6)], 12, { seed: 1596, speed: 1.1, spread: 1.8 });
      k.crowd([v(-46, 0, 18.3), v(46, 0, 18.3)], 8, { seed: 1597, speed: 1.1, spread: 1.4 });
      k.crowd([v(0, 0, 2.2), v(0, 0, -6), v(0, 0, ZL - 0.4), v(0, SY, ZF0 - 0.3), v(0, SY, -22.4), v(-9.8, SY, -23), v(-9.8, SY, -42.5)], 5, { seed: 1598, speed: 0.55, spread: 0.5, colors: [0x1c232c, 0x2a2a34, 0x3a2e2a, 0x2a3f6a, 0xe8e2d4] });
      k.crowd([v(-9, 0, -5.5), v(-16, 0, -5.4), v(-16, 0, -14.8), v(-26, 0, -14.8)], 4, { seed: 1599, speed: 0.5, spread: 0.6 });
    }
    figure(k, 9.6, 0, -2.2, 0x1c2230, { rotY: PI });

    /* ---- the works: lobby, sanctuary foyer, social hall ---- */
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (const z of [-2.7, -8.3]) mounts.push({ position: v(s * (FW - 1.08), 2.5, z), rotation: -s * PI / 2, target: v(s * (FW - 4.8), 2.5, z), width: 2.3, height: 1.7, style: 'gilt', wash: true });
    for (const x of [-7.4, 7.4]) mounts.push({ position: v(x, 2.5, ZL + 0.08), rotation: 0, target: v(x, 2.5, -6.2), width: 2.6, height: 1.9, style: 'gilt', wash: true });
    for (const s of [-1, 1]) mounts.push({ position: v(s * (FW - 0.52), SY + 2.5, (ZF0 + ZF1) / 2), rotation: -s * PI / 2, target: v(s * (FW - 4.3), SY + 2.5, (ZF0 + ZF1) / 2), width: 2.2, height: 1.6, style: 'gilt', wash: true });
    for (const x of [-7.8, 7.8]) mounts.push({ position: v(x, SY + 2.5, ZF0 - 0.02), rotation: PI, target: v(x, SY + 2.5, ZF1 + 0.4), width: 2.4, height: 1.7, style: 'gilt', wash: true });
    for (const x of [-25.6, -20.6, -15.6]) mounts.push({ position: v(x, 2.6, HZ0 - 0.32), rotation: PI, target: v(x, 2.6, -4.9), width: 2.4, height: 1.8, style: 'oak', wash: true });
    for (const x of [-25.6, -20.6, -15.6]) mounts.push({ position: v(x, 2.6, HZ1 + 0.32), rotation: 0, target: v(x, 2.6, -14.3), width: 2.4, height: 1.8, style: 'oak', wash: true });
    mounts.push({ position: v(HX1 - 0.12, 2.6, -13.2), rotation: -PI / 2, target: v(-16.1, 2.6, -13.2), width: 2.4, height: 1.8, style: 'oak', wash: true });
    k.censusWall({ x: HX0 + 0.35, y: 3.6, z: (HZ0 + HZ1) / 2, rotY: PI / 2, cols: 14, rows: 4, tile: 0.5, gap: 0.05, start: ctx.wallStart(2100, 56), pieces: ctx.all, backing: k.flat(0x2a2622, 0, 0.8) });

    /* ---- what the house knows ---- */
    const wp = { name: 'Jewish Center (Manhattan), Wikipedia', url: 'https://en.wikipedia.org/wiki/Jewish_Center_(Manhattan)' };
    const jch = { name: 'The Jewish Center, JC History', url: 'https://www.jewishcenter.org/history.html' };
    k.egg(v(28, PY, -11.5), { id: 'shul-with-a-pool', title: 'The first shul with a pool', text: 'The Jewish Center was the first synagogue in America built to be not only a spiritual home for its members but a cultural, social and recreational one too. Its members call it, affectionately, the first shul with a pool.', clue: 'Take the stair on the right, all the way down.', source: wp }, { r: 3 });
    k.egg(v(0, 6.6, 0.8), { id: 'unfinished-building', title: 'Services in an unfinished house', year: '1918', text: 'In January 1918 the first services were held in the new, still unfinished building on West 86th Street, between Amsterdam and Columbus Avenues.', clue: 'Step outside and read the name over the door.', source: jch }, { r: 2.4 });
    k.egg(v(-27.5, 1.6, -9.5), { id: 'a-center', title: 'More than a place to pray', text: 'Rabbi Mordecai Kaplan conceived of a Jewish Center that would bring Jews together for social, cultural and recreational purposes in addition to worship.', clue: 'The stage in the social hall.', source: jch }, { r: 1.8 });
    k.egg(v(9.6, 1.6, -2.2), { id: 'from-85th-street', title: 'Two founders from across the park', text: 'Two immigrant clothing manufacturers, Joseph H. Cohen and William Fischman, had moved to the Upper West Side after a long affiliation with Congregation Kehilath Jeshurun on the East Side, and set out to build a traditional Orthodox synagogue in their new neighbourhood.', clue: 'Ask the man by the door where the founders came from.', source: jch, room: 'kehilathjeshurun' }, { r: 1.4 });
    k.egg(v(0, SY + 8, -33), { id: 'along-the-subway', title: 'A neighbourhood along the new subway', text: 'The synagogue was founded in 1918 by Jews moving into the Upper West Side, a neighbourhood then just being built along the new IRT subway line, where there was no Ashkenazi synagogue to meet their needs. The tall Neo-Classical building holds social halls, classrooms, auditoriums and offices as well as the main sanctuary.', clue: 'Look up at the laylight over the sanctuary.', source: wp }, { r: 3 });

    /* ---- where the visitor cannot go ---- */
    wallBlock(k, -FW - 0.2, -1.8, -1.05, 0.45); wallBlock(k, 1.8, FW + 0.2, -1.05, 0.45);
    wallBlock(k, -46, -FW - 0.2, -1.05, 0.45); wallBlock(k, FW + 0.2, 46, -1.05, 0.45);
    wallBlock(k, -FW - 0.5, -FW + 1.0, -4.2, -1); wallBlock(k, -FW - 0.5, -FW + 1.0, ZL - 0.1, -6.8);
    wallBlock(k, FW - 1.0, FW + 0.5, -4.2, -1); wallBlock(k, FW - 1.0, FW + 0.5, ZL - 0.1, -6.8);
    wallBlock(k, -FW, -3.2, ZL - 0.65, ZL + 0.05); wallBlock(k, 3.2, FW, ZL - 0.65, ZL + 0.05);
    wallBlock(k, -FW, -3.4, ZF0 + 0.1, ZL); wallBlock(k, 3.4, FW, ZF0 + 0.1, ZL);
    wallBlock(k, -FW, -6.5, ZF1 - 0.65, ZF1 + 0.05); wallBlock(k, -4.3, -1.6, ZF1 - 0.65, ZF1 + 0.05); wallBlock(k, 1.6, 4.3, ZF1 - 0.65, ZF1 + 0.05); wallBlock(k, 6.5, FW, ZF1 - 0.65, ZF1 + 0.05);
    wallBlock(k, -FW - 0.5, -FW + 0.5, ZS1 - 1, ZF0 + 0.1); wallBlock(k, FW - 0.5, FW + 0.5, ZS1 - 1, ZF0 + 0.1);
    wallBlock(k, -FW, FW, ZS1 - 1, AZ + 3.4);
    wallBlock(k, -46, HX0 + 0.3, -60, 0.45); wallBlock(k, HX0, -FW - 0.5, -60, HZ1 + 0.3); wallBlock(k, HX0, -FW - 0.5, HZ0 - 0.3, 0.45);
    wallBlock(k, FW + 0.5, PX0, -60, -7.0); wallBlock(k, FW + 0.5, PX0, -4.0, 0.45);
    wallBlock(k, PX0, 46, -60, PZ1 + 0.3); wallBlock(k, PX0, 46, PZ0 - 0.3, 0.45); wallBlock(k, PX1 - 0.3, 46, -60, 0.45);
    return { mounts, spawn: v(0, 3, -1.6), look: v(0, 4.4, -40), eye: 3, floorY, bounds: [HX0 + 0.3, PX1 - 0.3, ZS1 + 0.5, 20], style: 'gilt' };
  },
};
