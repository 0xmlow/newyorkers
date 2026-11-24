/* Rooms 12 to 16: Bethesda Arcade, the Oculus, the Guggenheim spiral, the Rose Reading Room, the Apollo. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Kit, Mount } from '../kit';
import { corridorMounts } from './types';
import { hero, standIn, hide } from './heroes';
import type { RoomDef } from './types';

const PI = Math.PI;

/* ================= THE BIG UPGRADE, wave 1c (2026-11-23): helpers local to this file =================
   Scanned CC0 surfaces from Poly Haven (1k, 512 on phones) in assets/museum/tex/<room>/, GLB heroes from
   assets/museum/props fitted with heroes.ts, and one trick per room: an anamorphic floor (Bethesda), an
   anamorphic sculpture (the Oculus) and the Fraser spiral (the Guggenheim). Every GLB hero has its code built
   stand in built first and hidden only when the model lands, so a failed load leaves the room as it was. */
const inBrowser = typeof window !== 'undefined';
const scanTex = new WeakMap<Kit, Map<string, T.Texture>>();
const scanMats = new WeakMap<Kit, Map<string, T.MeshStandardMaterial>>();
/* one texture per file per room build, held by pending so an export waits for it */
function texOf(k: Kit, url: string, srgb: boolean, wrap = true) {
  let c = scanTex.get(k);
  if (!c) { c = new Map(); scanTex.set(k, c); }
  let t = c.get(url);
  if (!t) {
    let done = () => {};
    k.pending.push(new Promise<void>((res) => { done = res; }));
    t = new T.TextureLoader().load(url, () => done(), undefined, () => done());
    if (wrap) t.wrapS = t.wrapT = T.RepeatWrapping;
    t.anisotropy = 8;
    if (srgb) t.colorSpace = T.SRGBColorSpace;
    k.used.images.add(url);
    c.set(url, t);
  }
  return t;
}
type ScanP = Partial<T.MeshStandardMaterialParameters> & { normal?: number };
/* A scanned surface: colour, normal and roughness at one tile every `metres`, laid in world space by the
   kit's static merge (so only for static meshes). `color` tints the photo and may go above 1 to lift it. */
function scan(k: Kit, room: string, id: string, metres: number, p: ScanP = {}) {
  let c = scanMats.get(k);
  if (!c) { c = new Map(); scanMats.set(k, c); }
  const key = [room, id, metres, JSON.stringify(p)].join(':');
  let m = c.get(key);
  if (!m) {
    const { normal = 1, ...rest } = p;
    m = new T.MeshStandardMaterial({ roughness: 1, metalness: 0, ...rest });
    m.normalScale.set(normal, normal);
    if (inBrowser) {
      const q = k.o.quality === 'high' ? '' : '_s', base = `assets/museum/tex/${room}/${id}_`;
      m.map = texOf(k, `${base}c${q}.jpg`, true);
      m.normalMap = texOf(k, `${base}n${q}.jpg`, false);
      m.roughnessMap = texOf(k, `${base}r${q}.jpg`, false);
    }
    m.userData.density = 1 / metres;
    c.set(key, m);
  }
  return m;
}
type Spot = { x: number; y: number; z: number; ry?: number };
/* Load a GLB hero once and set a copy at every spot; `dress` may retint its materials. */
function heroes(k: Kit, name: string, fit: Parameters<typeof hero>[2], spots: Spot[], dress?: (m: T.MeshStandardMaterial) => void) {
  return hero(k, name, fit).then((g) => {
    if (!g || !k.live) return null;
    if (dress) g.traverse((c) => { if (c instanceof T.Mesh) for (const m of Array.isArray(c.material) ? c.material : [c.material]) dress(m as T.MeshStandardMaterial); });
    return spots.map((s, i) => {
      const o = i === spots.length - 1 ? g : g.clone();
      o.position.set(s.x, s.y, s.z);
      o.rotation.y = s.ry ?? 0;
      k.add(o);
      return o;
    });
  });
}
/* Anamorphosis on a floor: an upright picture w by h centred on `c` and square to the eye, projected from
   `eye` onto the plane y = fy. It stands up from that one spot and smears from every other. Subdivided so the
   texture stays true under the projection. */
function anamorphFloor(k: Kit, eye: T.Vector3, c: T.Vector3, w: number, h: number, fy: number, mat: T.Material, seg = 24) {
  const g = new T.PlaneGeometry(w, h, seg, seg);
  const f = c.clone().sub(eye).normalize();
  const right = new T.Vector3().crossVectors(f, new T.Vector3(0, 1, 0)).normalize();
  const up = new T.Vector3().crossVectors(right, f).normalize();
  const pa = g.attributes.position as T.BufferAttribute, P = new T.Vector3();
  for (let i = 0; i < pa.count; i++) {
    P.copy(c).addScaledVector(right, pa.getX(i)).addScaledVector(up, pa.getY(i));
    const s = (eye.y - fy) / (eye.y - P.y);
    pa.setXYZ(i, eye.x + (P.x - eye.x) * s, fy, eye.z + (P.z - eye.z) * s);
  }
  g.computeVertexNormals();
  return k.mesh(g, mat, 0, 0, 0, true);
}
/* Anamorphosis in the air: shards scattered at random depths along the rays from `eye` through a silhouette
   (`poly`, in -1..1) set square to the eye at `c`, `span` metres to a side. From that eye they close up into the
   shape; from anywhere else they are a cloud. One draw call. */
function anamorphCloud(k: Kit, eye: T.Vector3, c: T.Vector3, span: number, poly: number[][], n: number, kmin: number, kmax: number, size: number, mat: T.Material, seed: number) {
  const rnd = X.mulberry(seed);
  const inside = (x: number, y: number) => {
    let a = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) a = !a;
    }
    return a;
  };
  const f = c.clone().sub(eye).normalize();
  const right = new T.Vector3().crossVectors(f, new T.Vector3(0, 1, 0)).normalize();
  const up = new T.Vector3().crossVectors(right, f).normalize();
  const ms: T.Matrix4[] = [], P = new T.Vector3(), Q = new T.Vector3(), look = new T.Matrix4(), roll = new T.Matrix4(), sc = new T.Matrix4();
  for (let tries = 0; ms.length < n && tries < n * 40; tries++) {
    const x = rnd() * 2 - 1, y = rnd() * 2 - 1;
    if (!inside(x, y)) continue;
    P.copy(c).addScaledVector(right, x * span).addScaledVector(up, y * span);
    const kk = kmin + (kmax - kmin) * rnd();
    Q.copy(eye).addScaledVector(P.sub(eye), kk);
    look.lookAt(Q, eye, new T.Vector3(0, 1, 0));
    roll.makeRotationZ(rnd() * PI * 2);
    const s = size * kk * (0.75 + rnd() * 0.5);
    sc.makeScale(s, s, s);
    ms.push(new T.Matrix4().copy(look).multiply(roll).multiply(sc).setPosition(Q));
  }
  const tri = new T.BufferGeometry();
  tri.setAttribute('position', new T.Float32BufferAttribute([0, 1, 0, -0.87, -0.5, 0, 0.87, -0.5, 0], 3));
  tri.computeVertexNormals();
  const o = k.instances(tri, mat, ms);
  o.castShadow = false;
  return o;
}
/* The Fraser spiral (James Fraser, 1908): concentric rings drawn in a twisted black and white cord over a
   chequer that turns as it goes in. The rings read as one spiral winding to the centre. */
function fraserTex(rings = 11) {
  if (!inBrowser) return null;
  const S = 1024, R = S / 2, cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  if (!g) return null;
  const sector = (r0: number, r1: number, a0: number, a1: number) => { g.beginPath(); g.arc(R, R, r1, a0, a1); g.arc(R, R, r0, a1, a0, true); g.closePath(); g.fill(); };
  g.fillStyle = '#b9a47c';
  g.fillRect(0, 0, S, S);
  const step = R / rings;
  for (let i = 0; i < rings; i++) {
    const n = 24, off = i * (PI / 22);
    for (let j = 0; j < n; j++) {
      g.fillStyle = (i + j) % 2 ? '#d8c7a0' : '#8f7b58';
      sector(i * step, (i + 1) * step, off + (j * 2 * PI) / n, off + ((j + 1) * 2 * PI) / n);
    }
  }
  for (let i = 1; i < rings; i++) {
    const rr = i * step, w = step * 0.42, segs = Math.max(12, Math.round((2 * PI * rr) / (w * 1.15))), d = (2 * PI) / segs, skew = (w * 0.9) / rr;
    for (let j = 0; j < segs; j++) {
      const a = j * d;
      g.fillStyle = j % 2 ? '#f7f1e3' : '#1b1814';
      g.beginPath();
      g.moveTo(R + Math.cos(a) * (rr - w / 2), R + Math.sin(a) * (rr - w / 2));
      g.lineTo(R + Math.cos(a + skew) * (rr + w / 2), R + Math.sin(a + skew) * (rr + w / 2));
      g.lineTo(R + Math.cos(a + skew + d) * (rr + w / 2), R + Math.sin(a + skew + d) * (rr + w / 2));
      g.lineTo(R + Math.cos(a + d) * (rr - w / 2), R + Math.sin(a + d) * (rr - w / 2));
      g.closePath();
      g.fill();
    }
  }
  const t = new T.CanvasTexture(cv);
  t.colorSpace = T.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
const ANAMORPH = { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' };

/* ---------------- 12 BETHESDA ARCADE ---------------- */
export const bethesda: RoomDef = {
  id: 'bethesda',
  name: 'The painted threshold',
  area: 'BETHESDA ARCADE',
  mood: 'Morning in the park',
  color: '#c4ad83',
  description: 'Sandstone arches under a patterned tile ceiling, the fountain and its bronze angel on the terrace beyond the far arch, rowboats out on the Lake.',
  signatures: 'The encaustic tile ceiling in coffers, the sandstone arcade with carved niches, the Angel of the Waters over the fountain, the carved balustrades, park lamps and benches on the brick terrace, rowboats on the Lake.',
  build(k, ctx) {
    k.sky({ top: 0x7fa6d6, horizon: 0xe6ecea, ground: 0x4f5a44, fog: 0.003, sun: { az: 1.0, el: 0.55, color: 0xfff3d8, size: 14 }, env: 0.85 });
    k.hemi(0xf0f4ff, 0x4a4a3a, 0.85);
    k.sun(0xfff0d0, 2.2, 30, 40, 40, true, 70);
    const B = 'bethesda';
    /* 2026-11-23: scanned sandstone ashlar (Poly Haven sandstone_blocks_08) and herringbone brick for the Esplanade */
    const sand = scan(k, B, 'sandstone_blocks_08', 2.8, { color: new T.Color(1.2, 1.06, 0.86), normal: 1.3 }),
      sandDark = scan(k, B, 'sandstone_blocks_08', 2.8, { color: new T.Color(0.9, 0.78, 0.6), normal: 1.3 }),
      tile = k.pbr('minton', X.minton(), 0.55, { roughness: 0.35 }),
      floor = scan(k, B, 'sandstone_blocks_08', 4.4, { color: new T.Color(0.84, 0.8, 0.74), normal: 0.8, roughness: 0.85 }),
      water = k.flat(0x3a6a72, 0.6, 0.15, { transparent: true, opacity: 0.9 }),
      bronze = k.pbr('bronze', X.patina(0x4f7d6e), 0.5, { metalness: 0.4, roughness: 0.5 }),
      grass = k.pbr('lawnB', X.grass(0x4f7a3e, 3), 0.15),
      opal = k.glow(0xfff1d6),
      brickM = scan(k, B, 'herringbone_brick', 1.5, { color: new T.Color(1.6, 1.22, 1.0), normal: 1.1 }),
      pad = k.flat(0x3f6a34, 0, 0.8),
      hull = k.flat(0x2f5a3c, 0.1, 0.55), oarWood = k.flat(0x8a6a44, 0, 0.6), lampGlow = k.glow(0xffe4ae);
    const L = 44, ZC = 10 - L / 2;
    /* 2026-11-23 Firefly: a real Minton encaustic tile plate replaces the canvas pattern once it loads, same tiling */
    {
      const mt = tile as T.MeshStandardMaterial, was = mt.map;
      k.pending.push(new T.TextureLoader().loadAsync(`assets/museum/tex/bethesda/minton_ceiling${ctx.quality === 'low' ? '_s' : ''}.jpg`).then((t) => {
        if (!k.live) return;
        t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8;
        if (was) { t.repeat.copy(was.repeat); t.offset.copy(was.offset); }
        mt.map = t; mt.needsUpdate = true;
      }).catch(() => undefined));
    }
    // the arcade: three aisles, two rows of columns, groin vault bays and tile coffers
    k.box(26, 0.4, L + 4, 0, -0.2, ZC, floor);
    for (const s of [-1, 1]) {
      k.arcade(L + 4, 9.2, 1.4, 8, 3.2, 6.4, s * 12.4, 0, ZC, sand, PI / 2, false);
      k.box(1.4, 9.2, L + 4, s * 13.9, 4.6, ZC, sandDark);
      for (let z = 8; z > ZC - L / 2; z -= 5.5) k.column(s * 4.2, 0, z, 8.2, 0.42, sand, false, sandDark);
      for (let z = 8; z > ZC - L / 2; z -= 5.5) {
        k.arch(3.6, 8.4, 0.5, s * 4.2, 0, z - 2.75, sand, false, 0.6).rotation.y = PI / 2;
      }
      /* a carved cornice runs the length of the arcade under the tiles, and a base course along the side walls */
      k.moulding([[0, 0], [0.22, 0], [0.26, 0.1], [0.46, 0.26], [0.5, 0.44], [0, 0.44]], L + 4, s * 11.7, 8.3, ZC, sandDark, s > 0 ? PI : 0);
      k.moulding([[0, 0], [0.12, 0], [0.12, 0.42], [0.06, 0.5], [0, 0.5]], L + 4, s * 13.2, 0, ZC, sandDark, s > 0 ? PI : 0);
    }
    for (let z = 8; z > ZC - L / 2 - 1; z -= 5.5) {
      k.arch(7.4, 8.6, 0.6, 0, 0, z, sand, false, 0.62);
      for (const s of [-1, 1]) k.arch(7.4, 8.6, 0.6, s * 8.3, 0, z, sand, false, 0.55);
    }
    for (let x = -11; x <= 11; x += 2.2) for (let z = 9; z > ZC - L / 2 - 1; z -= 2.2) {
      k.rounded(2.0, 0.12, 2.0, x, 8.75, z, tile, 0.02);
      k.box(2.2, 0.16, 0.16, x, 8.72, z + 1.1, sandDark);
      k.box(0.16, 0.16, 2.2, x + 1.1, 8.72, z, sandDark);
    }
    k.box(28, 0.5, L + 4, 0, 9.1, ZC, sandDark);
    for (let z = 6, i = 0; z > ZC - L / 2; z -= 11, i++) { k.point(0, 7.2, z, 0xfff0d6, 26, 20); k.torus(0.5, 0.05, 0, 7.6, z, bronze, 20).rotation.x = PI / 2; for (let j = 0; j < 6; j++) { const a = (j * PI) / 3; k.sphere(0.1, Math.cos(a) * 0.5, 7.6, z + Math.sin(a) * 0.5, opal, 6); } k.beam(v(0, 8.7, z), v(0, 7.65, z), 0.02, bronze, 4); }
    // the entrance stair up to the Mall behind the visitor, with the census on its wall
    for (let i = 0; i < 8; i++) k.box(26, 0.4, 1.2, 0, 0.2 + i * 0.4, 12 + i * 1.2, sand);
    k.box(26, 10, 1.4, 0, 5, 22.5, sand);
    k.censusWall({ x: 0, y: 6.4, z: 21.75, rotY: PI, cols: 28, rows: 3, tile: 0.62, gap: 0.05, start: ctx.wallStart(1500, 84), pieces: ctx.all, backing: sandDark });
    k.sign('BETHESDA TERRACE  ·  THE ARCADE', 8, 0.7, 0, 9.2, 21.7, '#6b5334', '#f4e6c8', 90, PI, { border: true });
    /* THE TRICK: two words set in brass into the arcade floor, drawn for the eye of a visitor arriving at the foot
       of the stair. From there they stand up off the stone; one step to the side and they smear flat. */
    const eye0 = v(0, 3, 10);
    const lookUp = new T.MeshStandardMaterial({ map: X.signText('LOOK UP', 1024, 440, 'transparent', '#5a3d1c', 230, {}), transparent: true, metalness: 0.55, roughness: 0.38, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    const floorWords = anamorphFloor(k, eye0, v(0, 1.08, 0), 2.9, 1.22, 0.012, lookUp);
    // the terrace, fountain and lake beyond the last arch
    const tz = ZC - L / 2 - 2, fz = tz - 16;
    /* the Esplanade is paved in brick, laid herringbone, not bluestone */
    k.box(60, 0.4, 40, 0, -0.2, tz - 20, brickM);
    k.cyl(9.5, 0.9, 0, 0.45, fz, sand, 9.5, 64);
    k.cyl(8.8, 0.9, 0, 0.5, fz, water, 8.8, 64);
    k.sign('ANGEL OF THE WATERS  ·  EMMA STEBBINS  ·  1873', 3.4, 0.34, 0, 0.5, fz + 9.52, '#3d3322', '#d8bf86', 36, 0, { border: true });
    /* stand in: the lathe fountain and its box wings, hidden when the cast fountain and the bronze angel land */
    const mark = k.objects.length;
    k.lathe([[3.4, 0], [3.4, 0.3], [1.2, 0.5], [0.8, 2.2], [2.6, 2.4], [2.6, 2.7], [0.5, 2.9], [0.4, 4.4], [1.5, 4.6], [1.5, 4.8], [0.3, 5], [0.3, 6]], 0, 0.9, fz, sand, 40);
    k.lathe([[0.9, 0], [0.8, 0.6], [0.55, 2.2], [0.5, 3.4], [0.36, 4.2]], 0, 6.9, fz, bronze, 16);
    k.sphere(0.42, 0, 11.6, fz, bronze, 12);
    for (const s of [-1, 1]) { const o = k.mesh(new T.BoxGeometry(2.6, 0.14, 1.2), bronze, s * 1.4, 9.8, fz - 0.4); o.rotation.z = s * 0.5; }
    const fountainStand = standIn(k, mark);
    /* the four cherubs under the upper basin: Temperance, Purity, Health and Peace */
    const cherubs: T.Object3D[] = [];
    for (let j = 0; j < 4; j++) { const a = PI / 4 + (j * PI) / 2; cherubs.push(k.lathe([[0.3, 0], [0.32, 0.35], [0.22, 0.7], [0.12, 0.82], [0.2, 0.98], [0.16, 1.15], [0, 1.22]], Math.cos(a) * 1.75, 1.2, fz + Math.sin(a) * 1.75, bronze, 12)); }
    /* the hero: the cast fountain (our own Tripo model, already in the kit) with the angel in bronze patina on top,
       Angel of the Waters is about 8 feet; the stand in hides only when both are in */
    void Promise.all([
      heroes(k, 'cp_fountain', { height: 7.4 }, [{ x: 0, y: 0.62, z: fz }]),
      heroes(k, 'bethesda/angel', { height: 2.8 }, [{ x: 0, y: 7.7, z: fz, ry: -PI / 2 }], (m) => { m.color = new T.Color(0x86a892); m.metalness = 0.5; m.roughness = 0.45; }),
    ]).then(([f, a]) => { if (f && a) hide(fountainStand); });
    /* water lilies in the lower pool, after Samuel Parsons\' 1891 illustration */
    { const rl = X.mulberry(73); for (let j = 0; j < 22; j++) { const a = rl() * PI * 2, r = 4.2 + rl() * 4; k.cyl(0.35 + rl() * 0.3, 0.03, Math.cos(a) * r, 0.96, fz + Math.sin(a) * r, pad, undefined, 10); } }
    for (let j = 0; j < 16; j++) { const a = (j * PI) / 8; k.curve([v(Math.cos(a) * 8, 0.6, fz + Math.sin(a) * 8), v(Math.cos(a) * 6.5, 2.8, fz + Math.sin(a) * 6.5), v(Math.cos(a) * 4.5, 0.9, fz + Math.sin(a) * 4.5)], 0.03, k.glow(0xdff4ff), 12); }
    k.keepOut.push({ x: 0, z: fz, r: 10.2 });
    /* the balustrades: the kit's carved balustrade GLB along both sides of the terrace, the lathe run as stand in */
    const balMark = k.objects.length;
    for (const s of [-1, 1]) for (let i = 0; i < 10; i++) k.lathe([[0.22, 0], [0.2, 0.1], [0.1, 0.16], [0.14, 0.5], [0.1, 0.85], [0.26, 0.95]], s * 22, 0, tz - 4 - i * 3.4, sand, 10);
    for (const s of [-1, 1]) k.box(0.5, 0.2, 34, s * 22, 1.05, tz - 19, sand);
    const balStand = standIn(k, balMark);
    const balSpots: Spot[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 12; i++) balSpots.push({ x: s * 22, y: 0, z: tz - 3.4 - i * 2.85, ry: PI / 2 });
    void heroes(k, 'balustrade', { width: 2.85 }, balSpots).then((o) => { if (o) hide(balStand); });
    /* Central Park lamps round the fountain plaza and benches along the lake edge, from the kit's own GLBs */
    const lamps: Spot[] = [];
    for (const s of [-1, 1]) for (const z of [tz - 10.5, tz - 22]) lamps.push({ x: s * 11, y: 0, z });
    for (const s of [-1, 1]) lamps.push({ x: s * 5.5, y: 0, z: tz - 27.4 });
    void heroes(k, 'cp_gaslamp', { height: 4.1 }, lamps);
    for (const p of lamps) { k.sphere(0.15, p.x, 3.62, p.z, lampGlow, 10); k.keepOut.push({ x: p.x, z: p.z, r: 0.4 }); }
    void heroes(k, 'cp_bench', { width: 2.0 }, [-10, -2.6, 2.6, 10].map((x) => ({ x, y: 0, z: tz - 27.2 })));
    for (const x of [-10, -2.6, 2.6, 10]) k.block(x - 1.05, x + 1.05, tz - 27.6, tz - 26.8);
    /* the park's own wayfinding post at the lake steps, green with white letters */
    k.cyl(0.06, 3.0, 15.5, 1.5, tz - 25, k.flat(0x1f3a2a, 0.4, 0.5), 0.06, 8);
    ['THE LAKE', 'BOW BRIDGE', 'THE RAMBLE'].forEach((w, i) => k.sign(w, 1.5, 0.3, 15.5, 2.65 - i * 0.38, tz - 24.94, '#1f4a32', '#f2efe2', 96, 0));
    k.water({ y: -0.6, color: 0x2e5a5a, w: 260, d: 200, z: tz - 130, amp: 0.6 });
    k.box(120, 1, 30, 0, -0.5, tz - 40, floor);
    const rnd = X.mulberry(12);
    for (let i = 0; i < 26; i++) k.tree((rnd() - 0.5) * 120, -0.2, tz - 46 - rnd() * 24, { kind: 'round', h: 5 + rnd() * 3, r: 3 + rnd() * 2, leaf: 0x3f6b36, seed: i });
    for (const x of [-30, 30]) k.tree(x, -0.2, tz - 8, { kind: 'round', h: 7, r: 4.2, leaf: 0x4a7a3c });
    k.box(0.5, 0.2, 60, 0, 0.1, tz - 20, grass);
    k.skyline({ z: tz - 200, count: 30, spacing: 8, scale: 2.4, base: -4, seed: 24, lit: 0.1, glow: 0.2, tint: 0x9a9890, rows: 1 });
    /* rowboats out on the Lake, each with a rower, drifting a slow loop */
    const lake = k.spline([v(-30, -0.55, tz - 64), v(-6, -0.55, tz - 58), v(26, -0.55, tz - 66), v(34, -0.55, tz - 88), v(6, -0.55, tz - 96), v(-28, -0.55, tz - 86)], true);
    for (let b = 0; b < 5; b++) {
      const boat = new T.Group();
      const h = new T.Mesh(new T.SphereGeometry(1, 16, 6, 0, PI * 2, PI / 2, PI / 2), hull);
      h.scale.set(0.72, 0.42, 2.1);
      h.rotation.x = PI;
      h.position.y = 0.3;
      const seat = new T.Mesh(new T.BoxGeometry(1.3, 0.06, 0.32), oarWood); seat.position.y = 0.26;
      const rower = new T.Mesh(new T.CapsuleGeometry(0.2, 0.5, 3, 8), k.flat([0xb33a3a, 0x2f4f7f, 0xe8e2d4, 0x3a3a3a, 0xc9a25a][b], 0, 0.8)); rower.position.y = 0.72;
      const head = new T.Mesh(new T.SphereGeometry(0.13, 10, 8), k.flat(0xc8a284, 0, 0.7)); head.position.y = 1.18;
      const oars = new T.Mesh(new T.BoxGeometry(3.4, 0.05, 0.08), oarWood); oars.position.y = 0.5;
      boat.add(h, seat, rower, head, oars);
      k.add(boat);
      if (ctx.reduced) lake.getPointAt(b / 5, boat.position);
      else { k.rider(boat, lake, 0.9 + b * 0.08, (b * lake.getLength()) / 5); k.ticks.push((t) => { oars.rotation.y = 0.35 * Math.sin(t * 1.6 + b); }); }
    }
    /* people: down the arcade and round the fountain */
    k.crowd([v(-1.5, 0, -14), v(1.5, 0, -24), v(-1, 0, tz + 3), v(6, 0, tz - 6)], 10, { seed: 121, spread: 4, speed: 1.0, animate: !ctx.reduced });
    k.crowd(Array.from({ length: 12 }, (_, i) => v(Math.cos((i * PI) / 6) * 11.6, 0, fz + Math.sin((i * PI) / 6) * 11.6)), 16, { seed: 122, spread: 1.6, speed: 0.9, closed: true, animate: !ctx.reduced });
    // the works: framed in the side niches, then on the terrace balustrades
    const mounts: Mount[] = corridorMounts({ pairs: 8, x: 12.0, z0: 5.25, pitch: 5.5, y: 3.5, width: 5.0, height: 2.9, inset: 5.4, style: 'gilt' });
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) {
      /* the second pair stands wider: its viewing spot used to fall inside the fountain's keep out (2026-11-23) */
      const z = tz - 6 - i * 9, wx = i ? 15.5 : 12.6;
      k.box(0.5, 4.2, 5.6, s * wx, 2.4, z, sand);
      k.moulding([[0, 0], [0.4, 0], [0.4, 0.15], [0.25, 0.25], [0, 0.25]], 6, s * wx - s * 0.25, 4.5, z, sand, s > 0 ? PI : 0);
      mounts.push({ position: v(s * (wx - 0.3), 2.6, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * (wx - 5.1), 3, z), width: 4.4, height: 2.6, style: 'gilt', wash: false });
    }
    for (const s of [-1, 1]) mounts.push({ position: v(s * 8.3, 3.3, tz + 0.05), rotation: 0, target: v(s * 6.4, 3, tz + 6), width: 4.4, height: 2.6, style: 'gilt', wash: false });
    // easter eggs: the ceiling, the road overhead, the angel, the cherubs, the carvings, the words in the floor
    const CPC = { name: 'Bethesda Terrace, Central Park Conservancy', url: 'https://www.centralparknyc.org/locations/bethesda-terrace' };
    const WIKI = { name: 'Bethesda Terrace and Fountain, Wikipedia', url: 'https://en.wikipedia.org/wiki/Bethesda_Terrace_and_Fountain' };
    k.egg(v(0, 8.5, -6), { id: 'bethesda-minton-ceiling', title: 'A floor on the ceiling', text: 'The Arcade ceiling holds nearly 16,000 encaustic tiles made by Minton in Stoke-on-Trent, England, set in 49 panels. Encaustic tiles were normally laid as flooring, and the Conservancy calls this the only ceiling in the world made of them.', clue: 'Look straight up at the patterned coffers.', source: CPC }, { r: 1.8 });
    k.egg(v(-8, 8.5, -24), { id: 'bethesda-tiles-in-storage', title: 'Twenty years in boxes', year: '1984', text: 'Water and road salt seeping down from the drive above badly corroded the iron frame that held the tiles, so the 49 panels came down in the early 1980s and went into storage. Each panel carries more than 350 Moorish patterned tiles. Restorers later filled the losses by hand and keyed every tile to a new stainless steel backing.', clue: 'Find a coffer on the west side, halfway down the hall.', source: { name: 'Central Park\'s Bethesda Terrace Arcade, EverGreene Architectural Arts', url: 'https://evergreene.com/?p=9145' } }, { r: 1.8 });
    k.egg(v(0, 8.5, 8), { id: 'bethesda-hidden-bridge', title: 'The bridge in disguise', text: 'The Arcade sits under the 72nd Street Cross Drive. The carriage road above rests on a wrought iron box girder bridge, hidden under the sandstone cladding so the whole terrace reads as carved stone.', clue: 'Stand just inside the entrance and look at the ceiling over the stair.', source: WIKI }, { r: 1.8 });
    k.egg(v(0, 8.0, fz), { id: 'bethesda-angel-stebbins', title: 'The city\'s first woman sculptor', year: '1873', text: 'Angel of the Waters was designed by Emma Stebbins in 1868 and unveiled in 1873, making her the first woman to receive a public commission for a major work of art in New York City. It was the only statue the city paid for in the original park design. The angel holds a lily and blesses the water, after the angel of the biblical Pool of Bethesda.', clue: 'Look up at the winged figure on top of the fountain.', source: WIKI }, { r: 2.0 });
    k.egg(v(0, 2.4, fz + 2.2), { id: 'bethesda-four-cherubs', title: 'Four small virtues', text: 'Under the upper basin stand four cherubs, each about four feet tall, for Temperance, Purity, Health and Peace. The water lilies, lotus and papyrus in the pool around them follow an 1891 illustration by the park designer Samuel Parsons.', clue: 'Walk round the fountain and look below the upper basin.', source: WIKI }, { r: 1.6 });
    k.egg(v(19.6, 1.2, tz - 10), { id: 'bethesda-witch-on-a-broom', title: 'A witch in the balustrade', text: 'Jacob Wrey Mould carved the stairs and balustrades with the four seasons: lambs\' heads for spring, butterflies and berries for summer, holly and pine cones for autumn, firewood for winter. Look closer and there are ice skates, a rooster, and a witch riding a broomstick for Halloween.', clue: 'Follow the carved balustrade along the east side of the terrace.', source: WIKI }, { r: 1.6 });
    k.egg(floorWords, { id: 'bethesda-words-in-the-floor', title: 'Two words that stand up', text: 'The brass letters in the arcade floor are an anamorphosis: a picture drawn stretched so that it only comes right from one spot. Hans Holbein hid a skull that way across the foot of The Ambassadors in 1533. Here the spot is the foot of the stair, where you came in, and the words are an order.', clue: 'Walk back to the foot of the stair and look down the hall.', source: ANAMORPH }, { r: 2.4 });
    return { mounts, spawn: v(0, 3, 10), look: v(0, 4, -30), eye: 3, bounds: [-20, 20, tz - 26, 11], style: 'gilt' };
  },
};

/* ---------------- 13 THE OCULUS ---------------- */
/* Calatrava's dove, wings up, for the anamorphic sculpture (x right, y up, -1..1) */
const DOVE = [[-1, 0.82], [-0.74, 0.46], [-0.44, 0.2], [-0.18, 0.05], [-0.06, 0.24], [0.04, 0.42], [0.2, 0.4], [0.12, 0.28], [0.12, 0.08], [0.4, 0.26], [0.74, 0.5], [1, 0.86], [0.84, 0.44], [0.54, 0.12], [0.2, -0.12], [0.12, -0.36], [0.3, -0.72], [0, -0.56], [-0.26, -0.7], [-0.12, -0.32], [-0.26, -0.1], [-0.6, 0.06], [-0.9, 0.36]];
export const oculus: RoomDef = {
  id: 'oculus',
  name: 'White ribs, infinite city',
  area: 'THE OCULUS',
  mood: 'Pure daylight',
  color: '#c6e4ef',
  description: 'Tapered white ribs closing over a long skylight, marble underfoot, commuters crossing, a flag hung from the ribs, and the census standing on white fins in the light.',
  signatures: 'Paired tapering steel ribs meeting at a central skylight spine, a white marble hall full of commuters, two levels of shopfronts behind glass balconies, the transit signs, a flag hung high.',
  build(k, ctx) {
    k.sky({ top: 0x5f93d6, horizon: 0xe2eaf0, ground: 0xb8bcbd, fog: 0.0009, sun: { az: 3, el: 1.2, color: 0xffffff, size: 10 }, env: 1.0 });
    k.hemi(0xffffff, 0x9aa0a4, 1.0);
    k.sun(0xffffff, 2.6, 4, 70, -14, true, 60);
    const O = 'oculus';
    /* 2026-11-23: the ribs in scanned white stucco (their coating is bumpy up close, see the egg), the floor in a
       scanned stone block laid as the Lasa marble, desaturated toward white */
    const white = scan(k, O, 'white_stucco', 2.2, { color: new T.Color(1.12, 1.12, 1.1), roughness: 0.8, metalness: 0.05, normal: 1.6 }),
      marble = scan(k, O, 'marble_01', 3.2, { color: new T.Color(1.08, 1.08, 1.08), roughness: 0.3 }),
      glass = k.glass(0xdff0f8, 0.12, 0.05),
      steel = k.flat(0xd9dde0, 0.7, 0.35),
      shop = k.glow(0xffe9c8, 0.92), shopFrame = k.flat(0x24272b, 0.6, 0.4), soffit = k.glow(0xfff6e8);
    /* real hall: 350 ft long, 115 ft wide, 160 ft to the skylight; the section is taller than it is wide */
    const L = 92, ZC = 10 - L / 2;
    k.box(34, 0.4, L + 8, 0, -0.2, ZC, marble);
    for (let z = 14; z > ZC - L / 2 - 4; z -= 2) {
      const d = Math.abs(z - ZC) / (L / 2 + 4), h = 40 - 14 * d * d;
      for (const s of [-1, 1]) {
        const pts = [v(s * 17.5, 0, z), v(s * 16.5, 6, z), v(s * 12.5, h - 4, z), v(s * 5.5, h - 0.6, z), v(s * 0.9, h, z)];
        const tube = new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, 0.28, 8);
        const pa = tube.attributes.position;
        for (let i = 0; i < pa.count; i++) { const t = i / pa.count; const s2 = 1.6 - t * 1.1; const p = new T.CatmullRomCurve3(pts).getPoint(Math.min(1, Math.floor(i / 9) / 40)); pa.setXYZ(i, p.x + (pa.getX(i) - p.x) * s2, p.y + (pa.getY(i) - p.y) * s2, p.z + (pa.getZ(i) - p.z) * s2); }
        tube.computeVertexNormals();
        k.mesh(tube, white);
        k.box(0.6, 0.7, 1.6, s * 17.5, 0.35, z, white);
      }
      k.box(1.6, 0.08, 1.9, 0, h + 0.1, z, k.glow(0xffffff));
    }
    const shell = new T.BufferGeometry(), pos: number[] = [], idx: number[] = [], seg = 30;
    const zs = Array.from({ length: 50 }, (_, i) => 14 - i * 2.05);
    for (const z of zs) { const d = Math.abs(z - ZC) / (L / 2 + 4), h = 40 - 14 * d * d; for (let i = 0; i <= seg; i++) { const t = (i / seg) * PI; pos.push(Math.cos(t) * 17.4, Math.max(0, Math.sin(t) * h), z); } }
    for (let r = 0; r < zs.length - 1; r++) for (let i = 0; i < seg; i++) { const a = r * (seg + 1) + i; idx.push(a, a + 1, a + seg + 1, a + 1, a + seg + 2, a + seg + 1); }
    shell.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    shell.setIndex(idx);
    shell.computeVertexNormals();
    k.mesh(shell, glass);
    // mezzanines behind glass on both sides, lit soffits, and two levels of shopfronts behind them
    const SHOPS = ['NEWS', 'FLOWERS', 'COFFEE', 'SHOES', 'BOOKS', 'PHARMACY'];
    for (const s of [-1, 1]) {
      k.box(5, 0.5, L, s * 14.5, 6, ZC, white);
      k.box(0.08, 1.4, L, s * 12.05, 6.95, ZC, glass);
      for (let z = 12; z > ZC - L / 2; z -= 3) k.box(0.1, 1.4, 0.1, s * 12.05, 6.95, z, steel);
      k.box(0.12, 0.12, L, s * 12.05, 7.7, ZC, steel);
      k.box(5, 0.5, L, s * 14.5, 12, ZC, white);
      k.box(0.08, 1.4, L, s * 12.05, 12.95, ZC, glass);
      k.box(0.12, 0.12, L, s * 12.05, 13.7, ZC, steel);
      for (const y of [5.73, 11.73]) k.box(0.4, 0.03, L, s * 12.6, y, ZC, soffit);
      for (let z = 8; z > ZC - L / 2; z -= 8) { k.box(0.6, 12.5, 0.6, s * 12.3, 6.25, z, white); k.point(s * 10, 5, z, 0xffffff, 10, 14); }
      for (let z = 10, n = 0; z > ZC - L / 2 + 2; z -= 8, n++) for (const [y0, hh] of [[0.2, 5.1], [6.3, 5.2]]) {
        k.box(0.08, hh - 0.9, 7.2, s * 16.6, y0 + (hh - 0.9) / 2, z, shop);
        k.box(0.16, 0.8, 7.6, s * 16.5, y0 + hh - 0.45, z, shopFrame);
        for (const dz of [-3.7, 3.7]) k.box(0.18, hh, 0.36, s * 16.5, y0 + hh / 2, z + dz, shopFrame);
        if (n < 3 && y0 < 1) k.sign(SHOPS[n * 2 + (s > 0 ? 1 : 0)], 3.4, 0.56, s * 16.4, y0 + hh - 0.45, z, '#24272b', '#f3efe6', 120, s > 0 ? -PI / 2 : PI / 2);
      }
    }
    // the fins carrying the works, and the end walls
    const mounts: Mount[] = [];
    for (let i = 0; i < 5; i++) {
      const z = 0 - i * 12.5;
      for (const s of [-1, 1]) {
        k.box(0.5, 5.4, 7.4, s * 6.5, 2.7, z, white);
        k.box(1.4, 0.16, 7.8, s * 6.5, 0.08, z, marble);
        k.block(s * 6.5 - 1.0, s * 6.5 + 1.0, z - 4.2, z + 4.2);
        mounts.push({ position: v(s * 6.22, 3.0, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 1.6, 3, z), width: 5.4, height: 3.1, style: 'white', wash: false });
        mounts.push({ position: v(s * 6.78, 3.0, z), rotation: s < 0 ? -PI / 2 : PI / 2, target: v(s * 10.4, 3, z), width: 4.6, height: 2.7, style: 'white', wash: false });
      }
    }
    const ez = ZC - L / 2 - 3;
    k.box(36, 30, 1.2, 0, 15, ez, white);
    k.box(36, 30, 1.2, 0, 15, 15, white);
    k.censusWall({ x: 0, y: 9.6, z: ez + 0.65, rotY: 0, cols: 30, rows: 5, tile: 0.62, gap: 0.05, start: ctx.wallStart(0, 150), pieces: ctx.all, backing: k.flat(0xe9ebe9, 0, 0.6) });
    k.sign('WORLD TRADE CENTER  ·  OCULUS', 10, 0.8, 0, 14.4, ez + 0.65, '#e9ebe9', '#1a2530', 85, 0, { border: true });
    k.sign('THE CITY IS THE GALLERY', 10, 0.8, 0, 14.4, 14.35, '#e9ebe9', '#1a2530', 85, PI, { border: true });
    for (const x of [-6.5, 6.5]) mounts.push({ position: v(x, 3.4, ez + 0.65), rotation: 0, target: v(x, 3, ez + 7), width: 5.4, height: 3.1, style: 'white', wash: false });
    for (const x of [-6.5, 6.5]) mounts.push({ position: v(x, 3.4, 14.35), rotation: PI, target: v(x, 3, 8), width: 5.4, height: 3.1, style: 'white', wash: false });
    /* the transit signs hung over the far end of the hall, back to back, black with white letters */
    const ink = k.flat(0x111316, 0.3, 0.5);
    for (const [x, front, back] of [[-4.6, 'PATH TRAINS', 'FULTON STREET'], [4.6, 'SUBWAY  1  R  W  A  C  E', 'WORLD TRADE CENTER']] as const) {
      k.box(4.6, 0.86, 0.1, x, 5.4, -40, ink);
      k.sign(front, 4.4, 0.74, x, 5.4, -39.94, '#111316', '#f4f4f0', front.length > 12 ? 66 : 132, 0);
      k.sign(back, 4.4, 0.74, x, 5.4, -40.06, '#111316', '#f4f4f0', back.length > 14 ? 74 : 120, PI);
      for (const dx of [-1.8, 1.8]) k.beam(v(x + dx, 5.83, -40), v(x + dx, 9.5, -40), 0.025, steel, 5);
    }
    /* a flag hung from the ribs, as the hall has carried one (cloth plate, see FIREFLY_QUEUE: oculus/flag.jpg) */
    const flagMat = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, side: T.DoubleSide });
    if (inBrowser) flagMat.map = texOf(k, `assets/museum/tex/oculus/flag${k.o.quality === 'high' ? '' : '_s'}.jpg`, true, false);
    const flagG = new T.PlaneGeometry(15, 7.9, 30, 8);
    { const fp = flagG.attributes.position as T.BufferAttribute; for (let i = 0; i < fp.count; i++) fp.setZ(i, 0.22 * Math.sin(fp.getX(i) * 1.3) + 0.08 * Math.sin(fp.getX(i) * 3.1)); flagG.computeVertexNormals(); }
    const flag = k.mesh(flagG, flagMat, 11.2, 20.9, -34, true);
    flag.rotation.y = -PI / 2;
    k.box(0.16, 0.16, 15.6, 11.2, 24.9, -34, steel);
    for (const z of [-41.4, -26.6]) k.beam(v(11.2, 24.9, z), v(9.4, 33.5, z), 0.03, steel, 5);
    if (!ctx.reduced) k.ticks.push((t) => { flag.rotation.z = 0.02 * Math.sin(t * 0.5); });
    /* commuters crossing the hall, three streams */
    k.crowd([v(-1.5, 0, 12.5), v(1.5, 0, -20), v(-1, 0, ez + 4)], 34, { seed: 131, spread: 6, speed: 1.25, animate: !ctx.reduced });
    for (const s of [-1, 1]) k.crowd([v(s * 9.2, 0, 12), v(s * 9.2, 0, ez + 4)], 10, { seed: 132 + s, spread: 1.4, speed: 1.2, animate: !ctx.reduced });
    /* THE TRICK: Calatrava's dove of gold leaf shards. From the doors you come in by they close up into the bird
       hung in the hall; walk on and it comes apart into a cloud. */
    const eye0 = v(0, 3, 12), doveC = v(0, 9.6, -10);
    const leaf = new T.MeshStandardMaterial({ color: 0xe2b85e, metalness: 0.7, roughness: 0.28, side: T.DoubleSide, emissive: 0x6b4c12 });
    anamorphCloud(k, eye0, doveC, 6, DOVE, 780, 0.62, 1.7, 0.2, leaf, 13);
    // easter eggs: the light, the dove, the steel, the stone, the skin of the ribs, the roof that never opened
    const EWTC = { name: 'The Oculus Turns 10, Explore WTC', url: 'https://www.explorewtc.com/en/local/learn-about-wtc/articles/the-oculus-turns-10.html' };
    const UC = { name: '10 Things to Know About the Oculus, Untapped New York', url: 'https://untappedcities.com/2016/03/08/10-things-to-know-about-nycs-new-world-trade-center-transportation-hub-by-santiago-calatrava/' };
    k.egg(v(0, 0.4, ZC), { id: 'oculus-wedge-of-light', title: 'The Wedge of Light', text: 'The building is aligned with the angle of the sun on every September 11, from 8:46 in the morning, when the first plane struck, to 10:28, when the second tower fell. In that window the central skylight lays a beam of light along the floor.', clue: 'Stand in the middle of the hall, under the spine, and look down.', source: EWTC }, { r: 2.0 });
    k.egg(doveC, { id: 'oculus-dove', title: 'A dove let go', year: '2004', text: 'Santiago Calatrava\'s starting image, shown in his 2004 presentation, was a bird released from a child\'s hands. The white ribs are the wings. The gold dove hung in this hall is drawn the same way as the trick in the floor of Bethesda: it is scattered in depth and only comes together from one spot.', clue: 'Go back to the doors you came in by and look up the hall.', source: UC }, { r: 3.0 });
    k.egg(v(0, 38, -24), { id: 'oculus-wings-that-never-opened', title: 'The roof that stayed shut', text: 'The first design had a retractable roof whose wings would have opened up to 50 feet. After three years of debate it was dropped to cut costs, and only the skylight panels along the spine still retract.', clue: 'Look up at the long glass strip where the ribs meet.', source: UC }, { r: 2.4 });
    k.egg(v(16.4, 2.5, 4), { id: 'oculus-steel', title: 'Steel only four firms could make', text: 'About 11,500 tons of steel went into the Oculus, a specialised steel that only four firms in the world could make.', clue: 'Find where a rib comes down to the floor behind the columns.', source: EWTC }, { r: 1.8 });
    k.egg(v(-16.6, 3.5, -2), { id: 'oculus-stucco-ribs', title: 'Smooth from afar', text: 'From across the hall the ribs look as smooth as marble, but up close their fireproof coating has a bumpy, stucco like texture. In 2014 Calatrava\'s office put it down to money: the client would not pay for a smoother finish. The hub as a whole cost about $4 billion, twice its 2004 budget.', clue: 'Get close to the foot of a rib on the west side.', source: UC }, { r: 1.8 });
    k.egg(v(-8, 0.3, 6), { id: 'oculus-lasa-marble', title: 'A quarry\'s worth of Lasa', text: 'Much of the Oculus is clad in Lasa marble from northern Italy: about 40,000 square meters of it were shipped over for the floors and walls. On an average day up to 200,000 people walk across it.', clue: 'Look at the white stone floor near the entrance.', source: EWTC }, { r: 1.6 });
    return { mounts, spawn: v(0, 3, 12), look: v(0, 8, -40), eye: 3, bounds: [-11.2, 11.2, ez + 2, 13.6], style: 'white' };
  },
};

/* ---------------- 14 THE GUGGENHEIM SPIRAL ---------------- */
export const guggenheim: RoomDef = {
  id: 'guggenheim',
  name: 'Endless ascent',
  area: 'THE GUGGENHEIM SPIRAL',
  mood: 'A continuous journey',
  color: '#e9debf',
  description: 'One helical ramp rising three turns under a radial skylight, its white parapet bands wrapping the void, a bronze horse and two marble heads on the rotunda floor, the works following the curve of the outer wall.',
  signatures: 'A continuous helical ramp widening as it rises, the solid banded parapets, the radial web walls between the bays, the lit cove under each turn, the ribbed circular skylight, the open rotunda void with its inlaid floor.',
  build(k, ctx) {
    k.sky({ top: 0xb9c6d2, horizon: 0xe9e4d6, ground: 0x8b8578, fog: 0.002, env: 0.9 });
    k.hemi(0xffffff, 0x8c867a, 1.0);
    k.sun(0xfff6e6, 1.8, 0, 60, 0, true, 40);
    const G = 'guggenheim';
    /* 2026-11-23: scanned plaster on every ramp surface and a scanned terrazzo on the rotunda floor */
    const cream = scan(k, G, 'plastered_wall_04', 3.2, { color: new T.Color(1.98, 1.92, 1.8), roughness: 0.92, normal: 0.8 }),
      floorM = scan(k, G, 'terrazzo_tiles', 2.2, { color: new T.Color(1.04, 0.98, 0.88), roughness: 0.42 }),
      dark = k.flat(0x2a2622, 0.3, 0.6),
      glass = k.glass(0xeaf3f8, 0.2, 0.05),
      brass = k.flat(0xb08a4a, 0.8, 0.35),
      cove = k.glow(0xfff2de),
      granite = k.flat(0x1c1b1a, 0.2, 0.35),
      wallWhite = k.flat(0xf3f0e8, 0, 0.85);
    const R = 10.5, RISE = 0.85, TURNS = 3, N = 300;
    const path = Array.from({ length: N + 1 }, (_, i) => { const t = (i / N) * PI * 2 * TURNS; return v(Math.cos(t) * R, 2.1 + t * RISE, Math.sin(t) * R); });
    k.mesh(new T.CylinderGeometry(16, 16, 0.4, 96), floorM, 0, -0.2, 0);
    // the ramp surface, outer wall bands and inner parapet as helical ribbons, textured in metres
    const inner = (t: number) => 8.6 - 1.6 * (t / (PI * 2 * TURNS));
    const UVM = 3.2;
    const ribbon = (r0: number | ((t: number) => number), r1: number | ((t: number) => number), y0: number, y1: number, m: T.Material, wall = false) => {
      const p: number[] = [], idx: number[] = [], uv: number[] = [];
      for (let i = 0; i <= N; i++) {
        const t = (i / N) * PI * 2 * TURNS, y = t * RISE, a0 = typeof r0 === 'number' ? r0 : r0(t), a1 = typeof r1 === 'number' ? r1 : r1(t);
        if (wall) { p.push(Math.cos(t) * a0, y + y0, Math.sin(t) * a0, Math.cos(t) * a0, y + y1, Math.sin(t) * a0); uv.push((t * a0) / UVM, (y + y0) / UVM, (t * a0) / UVM, (y + y1) / UVM); }
        else { p.push(Math.cos(t) * a0, y + y0, Math.sin(t) * a0, Math.cos(t) * a1, y + y1, Math.sin(t) * a1); uv.push((Math.cos(t) * a0) / UVM, (Math.sin(t) * a0) / UVM, (Math.cos(t) * a1) / UVM, (Math.sin(t) * a1) / UVM); }
        if (i < N) { const n = i * 2; idx.push(n, n + 2, n + 1, n + 1, n + 2, n + 3); }
      }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      g.computeVertexNormals();
      const mesh = k.mesh(g, m, 0, 0, 0, true);
      (mesh.material as T.Material).side = T.DoubleSide;
      return mesh;
    };
    ribbon(inner, 13.2, 0, 0, cream);
    /* the solid parapet on the atrium side is 36 inches high; seen from the rotunda it is one thick white band per
       turn, its face carried down over the edge of the ramp slab, with a shadow reveal under it */
    ribbon(inner, inner, 0, 0.92, cream, true);
    ribbon((t) => inner(t) - 0.32, (t) => inner(t) - 0.32, -1.05, 1.0, cream, true);
    ribbon((t) => inner(t) - 0.32, inner, 1.0, 0.92, cream);
    ribbon((t) => inner(t) - 0.33, (t) => inner(t) - 0.33, -1.06, -0.98, dark, true);
    ribbon(13.3, 13.3, -1.2, 5.4, cream, true);
    ribbon(14.0, 14.0, 5.4, 5.9, dark, true);
    /* a lit cove runs up under every turn along the outer wall */
    ribbon(13.24, 13.24, 5.12, 5.26, cove, true);
    /* the radial web walls that divide the ramp into bays, between the works (the works sit at 22.5 degrees off) */
    const TMAX = PI * 2 * TURNS;
    for (let j = 1; j * (PI / 4) < TMAX - 0.2; j++) { const t = j * (PI / 4); k.box(1.15, 5.2, 0.32, Math.cos(t) * 12.72, t * RISE + 2.6, Math.sin(t) * 12.72, cream).rotation.y = -t; }
    // the skylight with its radial ribs, the ground floor pieces, the entrance
    const top = 2 * PI * TURNS * RISE + 6.5;
    k.torus(15, 0.25, 0, top, 0, cream, 96).rotation.x = PI / 2;
    /* six hairpin spokes, so twelve ribs, divide the dome into twelve sections */
    for (let i = 0; i < 12; i++) { const t = (i * PI) / 6; k.beam(v(Math.cos(t) * 15, top, Math.sin(t) * 15), v(0, top + 4, 0), 0.12, cream, 8); }
    for (const r of [11, 7, 3.5]) k.torus(r, 0.1, 0, top + 4 - (r / 15) * 4 + 0.05, 0, cream, 64).rotation.x = PI / 2;
    /* the sky over the glass (a placeholder plate, see FIREFLY_QUEUE: guggenheim/skylight.jpg) */
    const skyMat = new T.MeshBasicMaterial({ color: 0xf6fbff, side: T.DoubleSide });
    if (inBrowser) skyMat.map = texOf(k, `assets/museum/tex/guggenheim/skylight${k.o.quality === 'high' ? '' : '_s'}.jpg`, true, false);
    k.mesh(new T.CircleGeometry(15, 64), skyMat, 0, top + 4.2, 0, true).rotation.x = PI / 2;
    k.mesh(new T.ConeGeometry(15, 4, 64, 1, true), glass, 0, top + 2, 0).rotation.x = PI;
    k.point(0, top - 4, 0, 0xffffff, 120, 60);
    k.mesh(new T.CylinderGeometry(15.5, 15.5, 1.4, 96, 1, true), cream, 0, top - 0.7, 0);
    /* the beige terrazzo floor is inlaid with metal circles */
    for (const rr of [4.6, 6.2, 7.6]) k.torus(rr, 0.035, 0, 0.005, 0, brass, 96).rotation.x = PI / 2;
    /* THE TRICK, in the middle of the rotunda floor: the Fraser spiral. Concentric rings that read as one spiral
       winding in, under a ramp that really does. Best seen from the second turn. */
    const fx = fraserTex();
    const fraser = k.mesh(new T.CircleGeometry(4.2, 96), new T.MeshStandardMaterial({ map: fx, color: fx ? 0xffffff : 0xb9a47c, roughness: 0.32, metalness: 0.05, polygonOffset: true, polygonOffsetFactor: -2 }), 0, 0.006, 0, true);
    fraser.rotation.x = -PI / 2;
    k.torus(4.22, 0.04, 0, 0.01, 0, brass, 96).rotation.x = PI / 2;
    /* on the rotunda floor: a cast bronze horse on black granite (Poly Haven horse_statue_01, a photogrammetry scan),
       two marble heads on plinths and the museum benches */
    k.plinth(-4.6, 3.4, 1.3, 1.0, 2.9, granite);
    void heroes(k, 'guggenheim/horse', { width: 2.7 }, [{ x: -4.6, y: 1.08, z: 3.4, ry: PI / 2 }]);
    k.spot(1, 15, 9, -4.6, 2.4, 3.4, 0xfff1d6, 140, 0.32, 0.6, 32);
    for (const [x, z] of [[3.6, -5.8], [-2.4, -6.4]]) k.plinth(x, z, 0.62, 1.25, 0.62, wallWhite);
    void heroes(k, 'guggenheim/bust', { height: 0.78 }, [{ x: 3.6, y: 1.29, z: -5.8, ry: -2.6 }, { x: -2.4, y: 1.29, z: -6.4, ry: 2.8 }]);
    void heroes(k, 'museum_bench', { width: 2.4 }, [{ x: 5.9, y: 0, z: 2.8, ry: PI / 2 + 0.45 }, { x: 0.4, y: 0, z: 6.6, ry: 0 }]);
    /* the exhibition title on a freestanding wall in the rotunda, black on white as the museum sets its titles */
    const tw = v(5.6, 0, -3.6), ta = Math.atan2(10.5 - tw.x, 0 - tw.z);
    k.box(3.2, 2.7, 0.14, tw.x, 1.35, tw.z, wallWhite).rotation.y = ta;
    const tn = v(Math.sin(ta), 0, Math.cos(ta));
    k.sign('NEW YORKERS', 2.8, 0.56, tw.x + tn.x * 0.075, 1.95, tw.z + tn.z * 0.075, '#f3f0e8', '#151515', 140, ta);
    k.sign('A CENSUS ON ONE RAMP  ·  MLOW', 2.8, 0.26, tw.x + tn.x * 0.075, 1.42, tw.z + tn.z * 0.075, '#f3f0e8', '#151515', 56, ta);
    k.block(tw.x - 1.0, tw.x + 1.0, tw.z - 1.0, tw.z + 1.0);
    k.point(0, 6, 0, 0xffffff, 40, 30);
    k.censusWall({ x: 0, y: 3.6, z: 13.15, rotY: PI, cols: 22, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(5600, 88), pieces: ctx.all, backing: dark });
    /* visitors on the ramp, walking up and down it */
    k.crowd(path.filter((_, i) => i % 10 === 0).map((p) => v(p.x * 1.06, p.y - 2.1, p.z * 1.06)), 18, { seed: 141, spread: 1.4, speed: 0.7, animate: !ctx.reduced });
    // the works along the outer wall, following the helix at eye height
    const mounts: Mount[] = [];
    for (let i = 0; i < 24; i++) {
      const t = ((i + 0.5) / 24) * PI * 2 * TURNS, rr = 13.1;
      mounts.push({ position: v(Math.cos(t) * rr, 2.7 + t * RISE, Math.sin(t) * rr), rotation: -t - PI / 2, target: v(Math.cos(t) * R, 2.1 + t * RISE, Math.sin(t) * R), width: 3.0, height: 2.9, style: 'white', wash: true });
    }
    // easter eggs: the ramp, the way down, the tilted wall, the dome, the floor, the architect, the spiral that is not
    const W = { name: 'Solomon R. Guggenheim Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/Solomon_R._Guggenheim_Museum' };
    const at = (t: number, r: number, dy: number) => v(Math.cos(t) * r, t * RISE + dy, Math.sin(t) * r);
    k.egg(at(0.9, 10.8, 0.3), { id: 'guggenheim-ramp-length', title: 'A quarter mile of floor', year: '1959', text: 'The ramp climbs six stories at a gentle five percent grade and runs 1,416 feet from bottom to top, in 70 sections. It is 25 feet wide at the bottom and 32 feet wide at the top. Frank Lloyd Wright wrote that he wanted a wheel chair going around and up and down.', clue: 'Look down at the ramp under your feet as you start to climb.', source: W }, { r: 1.6 });
    k.egg(at(TMAX - 0.4, 11, 1.4), { id: 'guggenheim-top-down', title: 'Start at the top', text: 'Under Wright\'s plan, visitors were meant to ride an elevator to the top of the building and walk down the ramp, not up it. Wright called the design an inverted ziggurat.', clue: 'Climb to the very end of the ramp, under the dome.', source: W }, { r: 1.6 });
    k.egg(at(PI * 2 + 0.39, 13.0, 2.6), { id: 'guggenheim-tilted-walls', title: 'Walls that lean back', text: 'The gallery walls along the ramp are not vertical: they are tilted at 97 degrees, under ceilings only 9.5 feet tall. The interior is plaster over concrete that was sprayed in layers onto plywood moulds.', clue: 'On the second turn, stand close to the outer wall between two works.', source: W }, { r: 1.6 });
    k.egg(v(0, top + 2.6, 0), { id: 'guggenheim-twelve-sections', title: 'Six hairpins, twelve panes', text: 'The domed skylight, now called the Lawson Johnston Family Oculus, rises about 95 feet over the rotunda. Six hairpin shaped spokes ring a round glass centre and divide the dome into twelve sections. The clerestory windows along the ramp were sealed when the building opened and only restored in 1992.', clue: 'Look straight up into the dome.', source: W }, { r: 2.4 });
    k.egg(v(6.2, 0.1, 0), { id: 'guggenheim-floor-circles', title: 'Circles in the floor', text: 'The ground floor of the rotunda is beige terrazzo inlaid with metal circles. Wright\'s name and the builder George N. Cohen\'s appear together on a tile on the outside of the building.', clue: 'Lean over the parapet and look at the rotunda floor.', source: W }, { r: 1.8 });
    k.egg(at(PI * 3, inner(PI * 3) + 0.2, 1.0), { id: 'guggenheim-protestant-barn', title: 'Six months short', year: '1959', text: 'Wright boasted that his museum would make the nearby Metropolitan Museum of Art look like a Protestant barn. It was his last major work: he died in April 1959, six months before it opened, and on its dedication day about 600 visitors an hour came through.', clue: 'Halfway up, rest your hands on the parapet over the void.', source: W }, { r: 1.6 });
    k.egg(fraser, { id: 'guggenheim-fraser-spiral', title: 'The spiral that is not there', year: '1908', text: 'The rings set into the middle of the rotunda floor are concentric circles. Drawn in a twisted black and white cord over a turning chequer, they read as a single spiral winding in to the centre, under a ramp that really does. It is the Fraser spiral illusion, published by the British psychologist James Fraser in 1908. Trace one ring with a finger and it closes on itself.', clue: 'From the second turn of the ramp, look down at the middle of the floor.', source: { name: 'Fraser spiral illusion, Wikipedia', url: 'https://en.wikipedia.org/wiki/Fraser_spiral_illusion' } }, { r: 2.6 });
    return { mounts, spawn: path[0].clone(), look: path[6].clone(), eye: 2.1, bounds: [-14, 14, -14, 14], path, style: 'white' };
  },
};

/* ---------------- 15 THE ROSE READING ROOM ---------------- */
export const library: RoomDef = {
  id: 'library',
  daylit: false,
  name: 'City of stories',
  area: 'NYPL ROSE READING ROOM',
  mood: 'Quiet afternoon',
  color: '#c4a47a',
  description: 'Long oak tables under bronze lamps, book galleries on the walls, and paintings set into the carved ceiling coffers.',
  signatures: 'Rows of reading tables with bronze lamps, two tier bookcase walls with a gallery, tall arched windows, a gilded coffered ceiling with painted panels.',
  build(k, ctx) {
    k.sky({ top: 0x9ab5d6, horizon: 0xf1e7d4, ground: 0x6b5f4d, fog: 0.004, sun: { az: 4.4, el: 0.4, color: 0xffe3b8, size: 16 }, env: 0.6 });
    k.hemi(0xfff0dc, 0x4a3b2a, 0.65);
    k.sun(0xffe0b8, 1.8, -40, 30, -10, true, 60);
    const oak = k.pbr('oakFloor', X.planks(0x7a5334, 8, 12), 0.6, { roughness: 0.55 }),
      oakDark = k.pbr('oakDark', X.planks(0x5c3d26, 4, 13), 1.0, { roughness: 0.5 }),
      plaster = k.pbr('plasterL', X.plaster(0xd9c9a8, 12), 0.4, { roughness: 0.8 }),
      gold = k.pbr('goldL', X.gilt(0xc9a552), 2, { metalness: 0.8, roughness: 0.35 }),
      bronze = k.flat(0x6b4f2a, 0.85, 0.35),
      books = k.pbr('books', X.planks(0x6a3a2a, 14, 15), 2.2, { roughness: 0.85 }),
      books2 = k.pbr('books2', X.planks(0x2f4a5a, 12, 16), 2.2, { roughness: 0.85 }),
      glass = k.glass(0xf3e9d3, 0.2, 0.1),
      opal = k.glow(0xfff1d2);
    const L = 76, ZC = 12 - L / 2, H = 16;
    k.box(30, 0.4, L + 4, 0, -0.2, ZC, oak);
    for (const s of [-1, 1]) {
      k.box(1.2, H, L + 4, s * 12.6, H / 2, ZC, plaster);
      // two tiers of bookcases with a gallery rail between
      for (let z = 10; z > ZC - L / 2; z -= 6.4) {
        for (const tier of [0, 1]) {
          const y0 = tier ? 5.6 : 0.3;
          if (tier === 0 && Math.abs((z - 3.2 - 2) % 6.4) < 0.1) { /* space for the framed works */ }
          for (let j = 0; j < 4; j++) k.box(0.5, 0.08, 6, s * 11.75, y0 + 0.4 + j * 1.05, z - 3.2, oakDark);
          for (let j = 0; j < 4; j++) k.box(0.3, 0.9, 5.7, s * 11.85, y0 + 0.88 + j * 1.05, z - 3.2, j % 2 ? books : books2);
          k.box(0.7, 4.6, 0.3, s * 11.7, y0 + 2.3, z, oakDark);
        }
        k.box(0.6, 0.12, 6.4, s * 11.5, 5.3, z - 3.2, oakDark);
        k.rail(s * 11.15, z - 3.2, 6.4, bronze, 0.9, 'z', 0.8);
        k.arch(3.8, 5, 0.3, s * 11.95, 10.4, z - 3.2, plaster, false, 0.62).rotation.y = s > 0 ? -PI / 2 : PI / 2;
        k.box(0.06, 4.2, 3.4, s * 11.9, 12.6, z - 3.2, glass);
        for (let dz = -1.2; dz <= 1.2; dz += 0.8) k.box(0.1, 4.2, 0.06, s * 11.88, 12.6, z - 3.2 + dz, bronze);
      }
      k.moulding([[0, 0], [0.8, 0], [0.85, 0.2], [0.6, 0.4], [0.7, 0.6], [0.3, 0.85], [0, 1]], L + 4, s * 12 - s * 0.02, H - 1.2, ZC, gold, s > 0 ? PI : 0);
    }
    // the coffered ceiling: gilt frames around painted panels, three carry works from the census
    k.box(30, 0.6, L + 4, 0, H + 0.3, ZC, plaster);
    const mounts: Mount[] = corridorMounts({ pairs: 10, x: 11.4, z0: 6.8, pitch: 6.4, y: 3.0, width: 4.4, height: 2.6, inset: 5, style: 'gilt', wash: false });
    for (let x = -8; x <= 8; x += 8) for (let z = 8; z > ZC - L / 2; z -= 8) {
      k.rounded(7.4, 0.4, 7.4, x, H - 0.2, z - 4, gold, 0.06);
      k.box(6.6, 0.1, 6.6, x, H - 0.35, z - 4, k.pbr('skyPanel', X.plaster(0xbfd3e6, 14), 0.3));
      k.torus(0.45, 0.05, x, H - 0.45, z - 4, gold, 16).rotation.x = PI / 2;
    }
    for (const z of [-4, -28, -52]) mounts.push({ position: v(0, H - 0.44, z), rotation: 0, tilt: PI / 2, target: v(0, 3, z + 5), lookAt: v(0, H - 0.5, z), width: 6.2, height: 3.6, style: 'gilt', wash: false });
    // tables, lamps, chairs
    for (const s of [-1, 1]) for (let z = 4; z > ZC - L / 2 + 4; z -= 7) {
      const x = s * 5.2;
      k.rounded(3.2, 0.14, 5.2, x, 1.05, z, oakDark);
      for (const dx of [-1.3, 1.3]) for (const dz of [-2.3, 2.3]) k.box(0.14, 1.0, 0.14, x + dx, 0.5, z + dz, oakDark);
      k.box(0.3, 0.6, 5.2, x, 1.4, z, oakDark);
      for (const dz of [-1.7, 0, 1.7]) {
        k.lathe([[0.22, 0], [0.22, 0.06], [0.05, 0.1], [0.05, 0.6], [0.3, 0.64]], x, 1.7, z + dz, bronze, 12);
        k.rounded(0.72, 0.22, 0.44, x, 2.42, z + dz, opal, 0.05);
        k.point(x, 2.2, z + dz, 0xffe0a8, 5, 4);
      }
      for (const dx of [-2.1, 2.1]) for (const dz of [-1.6, 0, 1.6]) { k.box(0.5, 0.06, 0.5, x + dx, 0.6, z + dz, oakDark); k.box(0.06, 1.0, 0.5, x + dx + (dx > 0 ? 0.22 : -0.22), 1.0, z + dz, oakDark); for (const lx of [-0.2, 0.2]) for (const lz of [-0.2, 0.2]) k.box(0.05, 0.6, 0.05, x + dx + lx, 0.3, z + dz + lz, oakDark); }
      k.block(x - 2.6, x + 2.6, z - 2.9, z + 2.9);
    }
    for (const z of [0, -24, -48]) k.point(0, 11, z, 0xffe8c8, 30, 24);
    // the delivery desk and the far wall, the card catalogue at the entrance
    const ez = ZC - L / 2 - 1;
    k.box(30, H, 1.2, 0, H / 2, ez, plaster);
    k.box(30, H, 1.2, 0, H / 2, 14.5, plaster);
    k.rounded(12, 1.3, 2.6, 0, 0.65, ez + 3.4, oakDark, 0.05);
    k.rounded(12.4, 0.12, 3, 0, 1.36, ez + 3.4, oakDark);
    k.keepOut.push({ x: 0, z: ez + 3.4, r: 6.8 });
    k.sign('ROSE MAIN READING ROOM', 9, 0.8, 0, 9, ez + 0.65, '#6b5334', '#f4e6c8', 90, 0, { border: true });
    k.censusWall({ x: 0, y: 5.6, z: ez + 0.65, rotY: 0, cols: 24, rows: 4, tile: 0.62, gap: 0.05, start: ctx.wallStart(4200, 96), pieces: ctx.all, backing: oakDark });
    k.censusWall({ x: 0, y: 3.8, z: 13.85, rotY: PI, cols: 28, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(4300, 112), pieces: ctx.all, backing: oakDark });
    for (const x of [-9.4, 9.4]) mounts.push({ position: v(x, 3.4, ez + 0.65), rotation: 0, target: v(x * 0.8, 3, ez + 8), width: 4.6, height: 2.7, style: 'gilt', wash: false });
    return { mounts, spawn: v(0, 3, 11), look: v(0, 5, -30), eye: 3, bounds: [-10.4, 10.4, ez + 2, 12.5], style: 'gilt' };
  },
};

/* ---------------- 16 THE APOLLO ---------------- */
export const apollo: RoomDef = {
  id: 'apollo',
  daylit: false,
  name: 'After the applause',
  area: 'THE APOLLO',
  mood: 'From the stage',
  color: '#dc8c86',
  description: 'A velvet house, gilt boxes and balconies, a lit stage carrying three works the size of a curtain.',
  signatures: 'The proscenium arch with its gilt frame, curved balcony fronts, red velvet seats and drapes, footlights and the marquee lettering.',
  build(k, ctx) {
    k.sky({ top: 0x1a1016, horizon: 0x2c1a22, ground: 0x110a0e, fog: 0.008, env: 0.4 });
    k.hemi(0xffd4c0, 0x1a0a0e, 0.45);
    const velvet = k.pbr('velvet', X.velvet(0x7a1f2b), 0.6, { roughness: 1 }),
      velvetD = k.pbr('velvetD', X.velvet(0x4d1219), 0.6, { roughness: 1 }),
      carpet = k.pbr('carpet', X.carpet(0x3b1a22, 0xc79a4a), 0.4, { roughness: 1 }),
      gold = k.pbr('goldA', X.gilt(0xd2a94e), 2, { metalness: 0.85, roughness: 0.3 }),
      plaster = k.pbr('plasterA', X.plaster(0xd8c0a6, 15), 0.4, { roughness: 0.8 }),
      stageWood = k.pbr('stage', X.planks(0x3a2a1e, 10, 17), 0.6, { roughness: 0.6 }),
      dark = k.flat(0x14100f, 0.3, 0.7),
      warm = k.glow(0xffd9a0);
    const L = 62, ZC = 12 - L / 2, SZ = ZC - L / 2;
    k.box(30, 0.4, L + 4, 0, -0.2, ZC, carpet);
    for (const s of [-1, 1]) {
      k.box(1.2, 20, L + 4, s * 12.6, 10, ZC, plaster);
      // side boxes in gilt with velvet drapes, the framed works between them
      for (let z = 6; z > SZ + 8; z -= 6.4) {
        k.rounded(1.4, 0.4, 3.6, s * 11.4, 7.2, z - 3.2, gold, 0.1);
        k.box(1.2, 1.1, 3.6, s * 11.5, 7.9, z - 3.2, velvetD);
        k.moulding([[0, 0], [0.3, 0], [0.3, 0.12], [0.15, 0.2], [0, 0.2]], 3.6, s * 10.7 - s * 0.15, 8.4, z - 3.2, gold, s > 0 ? PI : 0);
        for (const dz of [-1.6, 1.6]) { const dr = k.mesh(new T.CylinderGeometry(0.45, 0.35, 5, 10, 1, true, 0, PI), velvet, s * 11.6, 11.5, z - 3.2 + dz); dr.rotation.y = s > 0 ? PI / 2 : -PI / 2; }
        k.column(s * 11.6, 0.2, z, 7, 0.28, plaster, true, gold);
        k.point(s * 10.8, 8.8, z - 3.2, 0xffc890, 8, 8);
      }
    }
    // seats in raked rows, split by the aisles
    for (let row = 0; row < 14; row++) {
      const z = 2 - row * 3.0, y = row * 0.16;
      for (let x = -9.6; x <= 9.6; x += 1.2) {
        if (Math.abs(x) < 2.1) continue;
        k.rounded(0.95, 0.9, 0.7, x, y + 0.9, z, velvet, 0.08);
        k.rounded(0.95, 0.5, 0.9, x, y + 0.5, z + 0.3, velvetD, 0.06);
        k.box(0.08, 0.5, 0.8, x - 0.5, y + 0.3, z + 0.2, gold);
      }
      k.box(24, 0.16, 3, 0, y - 0.08, z - 1.5, carpet);
    }
    k.block(-10.4, -2.0, SZ + 4, 4);
    k.block(2.0, 10.4, SZ + 4, 4);
    // the proscenium, curtains, footlights, the stage and its three works
    k.box(30, 3, 3, 0, 1.5, SZ + 2, stageWood);
    k.box(24, 30, 1.6, 0, 15, SZ - 6, dark);
    k.arch(20, 14, 1.6, 0, 0, SZ, gold, false, 0.75);
    k.moulding([[0, 0], [1.2, 0], [1.3, 0.3], [0.9, 0.6], [1.0, 0.9], [0.4, 1.2], [0, 1.3]], 28, 0, 15.6, SZ + 0.9, gold, 0);
    for (const s of [-1, 1]) for (let j = 0; j < 12; j++) { const x = s * (9.6 + j * 0.16); const dr = k.mesh(new T.CylinderGeometry(0.34, 0.28, 13, 8, 1, true), velvet, x, 8.4, SZ + 0.6); dr.rotation.y = 0; }
    for (let j = 0; j < 24; j++) { const x = -9.2 + j * 0.8; const sw = k.mesh(new T.CylinderGeometry(0.5, 0.42, 3.4, 8, 1, true), velvet, x, 13.2 - Math.abs(x) * 0.08, SZ + 0.7); sw.rotation.z = 0.15 * Math.sign(x); }
    for (let x = -10; x <= 10; x += 1.4) { k.sphere(0.12, x, 3.15, SZ + 3.3, warm, 6); }
    k.point(0, 6, SZ + 1, 0xffd0a0, 60, 30);
    k.spot(-8, 14, SZ + 16, -6, 6, SZ - 3, 0xff9a7a, 260, 0.45, 0.6, 50);
    k.spot(8, 14, SZ + 16, 6, 6, SZ - 3, 0x9ab6ff, 260, 0.45, 0.6, 50);
    k.spot(0, 16, SZ + 20, 0, 6, SZ - 3, 0xfff0d0, 320, 0.5, 0.5, 50);
    k.keepOut.push({ x: 0, z: SZ + 3.5, r: 1 });
    // the ceiling dome and chandelier, the marquee letters, the wall of fame in the lobby
    k.mesh(new T.SphereGeometry(11, 32, 16, 0, PI * 2, 0, PI / 2), plaster, 0, 19.5, -18).rotation.x = PI;
    k.torus(11, 0.3, 0, 19.6, -18, gold, 64).rotation.x = PI / 2;
    k.beam(v(0, 19.5, -18), v(0, 14.5, -18), 0.05, gold, 5);
    for (const [r, y] of [[1.6, 14.4], [1.1, 13.6], [0.6, 12.9]]) { k.torus(r, 0.05, 0, y, -18, gold, 24).rotation.x = PI / 2; for (let j = 0; j < 12; j++) { const a = (j * PI) / 6; k.sphere(0.12, Math.cos(a) * r, y - 0.15, -18 + Math.sin(a) * r, warm, 6); } }
    k.point(0, 13.2, -18, 0xffdfb0, 60, 30);
    k.sign('APOLLO', 8, 1.6, 0, 17.6, SZ + 1.05, '#5e2436', '#f2dca2', 190, 0, { border: true });
    k.box(30, 20, 1.2, 0, 10, 14.6, plaster);
    k.box(30, 20, 1.2, 0, 10, SZ - 8, dark);
    k.censusWall({ x: 0, y: 4.2, z: 13.95, rotY: PI, cols: 28, rows: 5, tile: 0.6, gap: 0.05, start: ctx.wallStart(900, 140), pieces: ctx.all, backing: gold });
    k.sign('WALL OF FAME  ·  AMATEUR NIGHT', 8, 0.7, 0, 8.4, 13.9, '#5e2436', '#f2dca2', 90, PI, { border: true });
    const mounts: Mount[] = corridorMounts({ pairs: 8, x: 11.9, z0: 2.8, pitch: 6.4, y: 3.6, width: 5.4, height: 3.1, inset: 3.2, style: 'gilt', wash: true });
    for (const m of mounts) m.target.x = Math.sign(m.position.x) * 9.2;
    for (const x of [-7.6, 0, 7.6]) mounts.push({ position: v(x, 8.2, SZ - 5.1), rotation: 0, target: v(x * 0.3, 3, SZ + 12), width: 7.2, height: 9.6, style: 'gilt', wash: false });
    return { mounts, spawn: v(0, 3, 10), look: v(0, 6, -40), eye: 3, bounds: [-10.4, 10.4, SZ + 4, 12.5], style: 'gilt' };
  },
};
