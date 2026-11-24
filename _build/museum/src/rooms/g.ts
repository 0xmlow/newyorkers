/* Rooms 27 to 31: the Prospect Park Boathouse, the Hall of Fame colonnade, the TWA Flight Center, Snug Harbor, Wollman Rink. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Kit, Mount } from '../kit';
import type { RoomDef } from './types';
import { billboard, scan, glbs, fireflyPlate, anamorph } from './a';
import { hero, heroInstances } from './heroes';

const PI = Math.PI;

/* ---------- THE BIG UPGRADE, wave 2b (2026-11-23): helpers for rooms 27 to 31 ----------
   Scans, models and plates come from a.ts (wave 1a). These stay local: a painted canvas that is null in node (the
   audits build rooms with no DOM), recoloured model sets, and an elliptical wall built as one solid. */
const HAS_DOM = typeof window !== 'undefined' && typeof document !== 'undefined' && typeof HTMLCanvasElement !== 'undefined';
function paintTex(w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void, srgb = true) {
  if (!HAS_DOM) return null;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  draw(cv.getContext('2d')!, w, h);
  const t = new T.CanvasTexture(cv);
  if (srgb) t.colorSpace = T.SRGBColorSpace;
  t.anisotropy = 8;
  t.wrapS = t.wrapT = T.RepeatWrapping;
  return t;
}
/* A model placed many times, every material run through `tint` first (bronze on a marble bust, say). Each spot is
   [x, y, z, rotY, scale]. Above `inst` copies it becomes instanced parts, one draw each. */
function models(k: Kit, name: string, fit: Parameters<typeof hero>[2], at: number[][], tint?: (m: T.MeshStandardMaterial) => void, inst = 6, then?: (os: T.Object3D[]) => void) {
  if (!at.length) return;
  void hero(k, name, fit).then((h) => {
    if (!h || !k.live) return;
    if (tint) h.traverse((c) => { if (c instanceof T.Mesh) for (const m of Array.isArray(c.material) ? c.material : [c.material]) if (m instanceof T.MeshStandardMaterial) { tint(m); m.needsUpdate = true; } });
    if (at.length > inst) {
      const ins = heroInstances(k, h, at.length), m = new T.Matrix4(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0);
      at.forEach(([x, y, z, r, s = 1], i) => ins.setAt(i, m.compose(new T.Vector3(x, y, z), q.setFromAxisAngle(up, r), new T.Vector3(s, s, s))));
      ins.commit();
      return;
    }
    const os = at.map(([x, y, z, r, s = 1], i) => { const c = i ? h.clone() : h; c.position.set(x, y, z); c.rotation.y = r; c.scale.multiplyScalar(s); k.add(c); return c; });
    then?.(os);
  });
}
const bronzeTint = (m: T.MeshStandardMaterial) => { m.color.setRGB(0.42, 0.29, 0.17); m.metalness = 0.85; m.roughness = 0.38; };
/* An elliptical wall of thickness `th` and height `h` standing on y0, centred (cx, cz): inner face, outer face, cap. */
function ellipseWall(k: Kit, rx: number, rz: number, cx: number, cz: number, y0: number, h: number, th: number, m: T.Material, n = 160) {
  const pos: number[] = [];
  const P = (i: number, off: number) => { const a = (i / n) * PI * 2, c = Math.cos(a), s = Math.sin(a), nx = c / rx, nz = s / rz, l = Math.hypot(nx, nz); return [cx + rx * c + (nx / l) * off, cz + rz * s + (nz / l) * off]; };
  const quad = (a: number[], b: number[], c: number[], d: number[]) => pos.push(...a, ...b, ...c, ...a, ...c, ...d);
  for (let i = 0; i < n; i++) {
    const [ix0, iz0] = P(i, 0), [ix1, iz1] = P(i + 1, 0), [ox0, oz0] = P(i, th), [ox1, oz1] = P(i + 1, th);
    quad([ix0, y0, iz0], [ix0, y0 + h, iz0], [ix1, y0 + h, iz1], [ix1, y0, iz1]);
    quad([ox1, y0, oz1], [ox1, y0 + h, oz1], [ox0, y0 + h, oz0], [ox0, y0, oz0]);
    quad([ix0, y0 + h, iz0], [ox0, y0 + h, oz0], [ox1, y0 + h, oz1], [ix1, y0 + h, iz1]);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(new Array((pos.length / 3) * 2).fill(0), 2));
  g.computeVertexNormals();
  return k.mesh(g, m);
}
/* A Greek temple pediment: a triangular gable `w` wide and `h` tall, `d` deep, with a raking cornice proud of it. */
function pediment(k: Kit, w: number, h: number, d: number, x: number, y: number, z: number, face: T.Material, cornice: T.Material) {
  const s = new T.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
  const g = new T.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
  g.translate(0, 0, -d / 2);
  k.mesh(g, face, x, y, z);
  const slope = Math.atan2(h, w / 2), len = Math.hypot(w / 2, h) + 0.5;
  for (const sx of [-1, 1]) { const c = k.box(len, 0.42, d + 0.5, x + (sx * w) / 4, y + h / 2 + 0.16, z, cornice); c.rotation.z = -sx * slope; }
  k.box(w + 0.8, 0.36, d + 0.5, x, y + 0.05, z, cornice);
}

/* A rowboat: hull, thwarts, oars. */
function rowboat(k: Kit, x: number, y: number, z: number, rotY: number, hull: T.Material, wood: T.Material) {
  const g = new T.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  const h = new T.Mesh(new T.SphereGeometry(1, 16, 8, 0, PI * 2, PI / 2, PI / 2), hull);
  h.scale.set(1.0, 0.6, 2.6);
  g.add(h);
  const rim = new T.Mesh(new T.TorusGeometry(1, 0.06, 6, 24), wood);
  rim.rotation.x = PI / 2;
  rim.scale.set(1, 2.6, 1);
  g.add(rim);
  for (const dz of [-1.2, 0, 1.2]) { const t = new T.Mesh(new T.BoxGeometry(1.8, 0.06, 0.3), wood); t.position.set(0, -0.15, dz); g.add(t); }
  for (const s of [-1, 1]) { const oar = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 3.2, 6), wood); oar.position.set(s * 1.6, 0.1, 0.2); oar.rotation.z = s * 1.2; oar.rotation.y = 0.3; g.add(oar); }
  k.add(g);
  return g;
}

/* ---------------- 27 PROSPECT PARK BOATHOUSE ---------------- */
export const boathouse: RoomDef = {
  id: 'boathouse',
  name: 'The Lullwater',
  area: 'PROSPECT PARK BOATHOUSE',
  mood: 'Late summer',
  color: '#a9c9b0',
  description: 'A white terracotta boathouse on the lake, its loggia hung with the census, rowboats drifting under the bridge.',
  signatures: 'The Beaux Arts loggia of five arches with a balustraded roof, the terrace over the water, the arched Lullwater bridge, rowboats and swans, the tree line closing the lake.',
  build(k, ctx) {
    k.sky({ top: 0x6f9fd2, horizon: 0xe9ebe2, ground: 0x4f6a48, fog: 0.003, sun: { az: 4.2, el: 0.5, color: 0xffe9c8, size: 16 }, haze: 0.2, env: 0.9 });
    k.hemi(0xf1f6ff, 0x3f5a38, 0.9);
    /* the real boathouse faces west over the Lullwater, sited for the sunset: the loggia here faces -z,
       so the late sun comes from -z and lights the arches (2026-10-09; it came from the side) */
    k.sun(0xffe6c4, 2.3, -15, 45, -45, true, 80);
    /* wave 2b: glazed white terracotta, the stone base, terrazzo, decking, lawn and the bridge abutments are Poly Haven scans */
    const terra = scan(k, 'boathouse', 'white_sandstone_blocks_02', 2.2, () => X.plaster(0xf0e9dc, 21), { color: new T.Color(1.42, 1.4, 1.34), roughness: 0.42 }),
      lime = scan(k, 'boathouse', 'stone_block_wall', 2.6, () => X.ashlar(0xd8d0bd, 22, 3), { color: new T.Color(1.2, 1.16, 1.08) }),
      tileRoof = k.pbr('greenTile', X.boardwalk(0x5e7a5a), 0.5, { roughness: 0.6 }),
      floorT = scan(k, 'boathouse', 'terrazzo_tiles', 1.6, () => X.terrazzo(0xd9d0be, 12), { color: new T.Color(1.15, 1.12, 1.06), roughness: 0.35 }),
      oak = scan(k, 'boathouse', 'wood_floor_deck', 2.5, () => X.planks(0x7a5a3a, 6, 33), { color: new T.Color(1.05, 0.95, 0.85) }),
      lawn = scan(k, 'boathouse', 'leafy_grass', 3, () => X.grass(0x4a7a3a, 14), { color: new T.Color(0.78, 1.12, 0.72) }),
      stoneB = scan(k, 'boathouse', 'stone_block_wall', 2.6, () => X.ashlar(0x8f8a7c, 23, 3), { color: new T.Color(0.95, 0.92, 0.88) }),
      hull = k.flat(0x3a6a8a, 0.2, 0.6),
      iron = k.flat(0x1f242a, 0.7, 0.45),
      white = k.flat(0xf4f2ea, 0, 0.6);
    // the lake and the lawns
    k.water({ y: -0.9, color: 0x2e5a4e, w: 300, d: 300, z: -80, amp: 0.7 });
    k.box(120, 1.2, 60, 0, -0.6, 22, lawn);
    k.box(140, 1.2, 40, -70, -0.6, -60, lawn);
    k.box(140, 1.2, 40, 70, -0.6, -60, lawn);
    const rnd = X.mulberry(27);
    for (let i = 0; i < 40; i++) { const x = (rnd() - 0.5) * 120, z = 30 + rnd() * 24; k.tree(x, 0, z, { kind: rnd() > 0.5 ? 'round' : 'column', h: 6 + rnd() * 5, r: 3 + rnd() * 2.6, leaf: 0x3f6b36, seed: i }); }
    for (let i = 0; i < 30; i++) { const s = i % 2 ? 1 : -1, x = s * (40 + rnd() * 40), z = -46 - rnd() * 30; k.tree(x, 0, z, { kind: 'round', h: 7 + rnd() * 5, r: 4 + rnd() * 3, leaf: 0x466f3a, seed: 100 + i, species: i % 3 ? 'willow' : 'oak' }); }
    // the boathouse: base, five arch loggia, balustrade roof, side pavilions
    const BZ = 8, BW = 30, BD = 12;
    k.box(BW + 4, 1.0, BD + 6, 0, 0.5, BZ, lime);
    k.box(BW, 0.4, BD, 0, 1.0, BZ, floorT);
    k.arcade(BW, 7.2, 1.2, 5, 4.6, 6.2, 0, 1.0, BZ - BD / 2, terra, 0, false);
    k.box(BW, 7.2, 0.6, 0, 4.6, BZ + BD / 2, terra);
    for (const s of [-1, 1]) k.box(0.6, 7.2, BD, s * BW / 2, 4.6, BZ, terra);
    k.block(-BW / 2 - 0.4, BW / 2 + 0.4, BZ + BD / 2 - 0.4, BZ + BD / 2 + 0.4);
    for (const s of [-1, 1]) k.block(s * BW / 2 - 0.4, s * BW / 2 + 0.4, BZ - BD / 2, BZ + BD / 2);
    for (let i = 0; i < 5; i++) { const cx = -BW / 2 + (BW / 5) * (i + 0.5); k.block(cx - 3, cx - 2.3, BZ - BD / 2 - 0.7, BZ - BD / 2 + 0.7); k.block(cx + 2.3, cx + 3, BZ - BD / 2 - 0.7, BZ - BD / 2 + 0.7); }
    k.box(BW + 1, 0.5, BD + 1, 0, 8.4, BZ, terra);
    k.moulding([[0, 0], [0.9, 0], [1.0, 0.25], [0.7, 0.45], [0.8, 0.7], [0.3, 0.9], [0, 1.0]], BW + 1.4, -BW / 2 - 0.6, 7.4, BZ, terra, 0);
    k.moulding([[0, 0], [0.9, 0], [1.0, 0.25], [0.7, 0.45], [0.8, 0.7], [0.3, 0.9], [0, 1.0]], BW + 1.4, BW / 2 + 0.6, 7.4, BZ, terra, PI);
    for (let x = -BW / 2; x <= BW / 2; x += 1.2) k.lathe([[0.16, 0], [0.16, 0.1], [0.08, 0.2], [0.13, 0.6], [0.08, 0.95], [0.18, 1.05]], x, 8.65, BZ - BD / 2 - 0.3, white, 10);
    k.box(BW + 1.2, 0.18, 0.5, 0, 9.75, BZ - BD / 2 - 0.3, white);
    k.box(BW + 2, 0.3, BD + 2, 0, 9.9, BZ + 0.6, tileRoof);
    for (const s of [-1, 1]) { k.box(8, 6, 8, s * (BW / 2 + 4), 4, BZ + 2, terra); k.mesh(new T.ConeGeometry(6, 3, 4), tileRoof, s * (BW / 2 + 4), 8.5, BZ + 2).rotation.y = PI / 4; }
    for (const x of [-9, -3, 3, 9]) k.point(x, 6.5, BZ, 0xfff0d6, 20, 14);
    // the terrace and dock over the water
    k.box(BW + 4, 0.4, 8, 0, 0.8, BZ - BD / 2 - 6, oak);
    k.rail(0, BZ - BD / 2 - 9.8, BW + 4, white, 1.1, 'x', 1.4);
    k.box(6, 0.3, 14, -12, 0.2, BZ - BD / 2 - 16, oak);
    for (let z = BZ - BD / 2 - 10; z > BZ - BD / 2 - 24; z -= 3) for (const dx of [-2.7, 2.7]) k.cyl(0.22, 3, -12 + dx, -1.2, z, oak, 0.22, 8);
    k.prop('life_ring', -14.9, 1.1, BZ - BD / 2 - 12, { height: 0.8, rotY: PI / 2 });
    k.prop('cleat', -10, 0.4, BZ - BD / 2 - 14, { height: 0.4 });
    k.prop('lantern', 14, 1.2, BZ - BD / 2 - 8, { height: 0.9 });
    k.prop('bell', 15.5, 2.4, BZ - BD / 2 - 8, { height: 0.8 });
    k.box(0.25, 2.4, 0.25, 15.5, 2.0, BZ - BD / 2 - 8, iron);
    // rowboats, swans, the Lullwater bridge
    const boats = [rowboat(k, -6, -0.7, -22, 0.4, hull, oak), rowboat(k, 10, -0.7, -34, -0.8, hull, oak), rowboat(k, -20, -0.7, -44, 1.9, hull, oak), rowboat(k, 4, -0.7, -56, 0.2, hull, oak)];
    /* 2026-10-01: the swans are the life kit's swan.glb; the squashed spheres they were are
       kept below, one flag away */
    const KIT_SWANS = true;
    const swans: T.Object3D[] = [];
    if (KIT_SWANS) {
      for (let i = 0; i < 6; i++) k.prop('swan', 14 + i * 3, -0.88, -30 - i * 4, { height: 1.15, rotY: 0.6 + i * 1.3 }).then((o) => { if (o) swans.push(o); });
    } else {
      for (let i = 0; i < 6; i++) { const s = k.mesh(new T.SphereGeometry(0.5, 10, 8), white, 14 + i * 3, -0.6, -30 - i * 4, true); s.scale.set(1, 0.7, 1.6); const n = k.mesh(new T.CylinderGeometry(0.06, 0.09, 0.9, 6), white, 14 + i * 3 + 0.5, -0.1, -30 - i * 4 - 0.6, true); n.rotation.x = 0.4; swans.push(s, n); }
    }
    if (!ctx.reduced) k.ticks.push((t) => { boats.forEach((b, i) => { b.position.x += Math.sin(t * 0.2 + i) * 0.004; b.rotation.y += Math.sin(t * 0.13 + i * 2) * 0.0008; b.position.y = -0.7 + Math.sin(t * 0.8 + i) * 0.04; }); swans.forEach((s, i) => { s.position.y += Math.sin(t * 1.1 + i) * 0.001; }); });
    const BRZ = -70;
    k.box(6, 1.2, 44, 34, 3.6, BRZ, stoneB);
    /* the Lullwater Bridge is cast iron (1890): two arched ribs with ring spandrels between stone abutments (it was a stone arch) */
    const ironG = k.flat(0x2c3a33, 0.65, 0.45);
    for (const rx of [31.4, 36.6]) {
      const rib: T.Vector3[] = []; for (let i = 0; i <= 16; i++) { const u = i / 16 - 0.5; rib.push(v(rx, 2.95 - 4.2 * (2 * u) ** 2, BRZ + u * 30)); }
      k.curve(rib, 0.32, ironG, 48);
      for (let j = -6; j <= 6; j++) { if (!j) continue; const u = j / 14, y0 = 2.95 - 4.2 * (2 * u) ** 2, rr = Math.max(0.25, (3.0 - y0) / 2 - 0.05); k.torus(rr, 0.07, rx, y0 + rr + 0.05, BRZ + u * 30, ironG, 18).rotation.y = PI / 2; }
      k.box(0.3, 0.5, 44, rx, 3.05, BRZ, ironG);
    }
    for (const dz of [-19, 19]) k.box(8, 5.4, 6, 34, 0.6, BRZ + dz, stoneB);
    k.rail(31.2, BRZ, 44, iron, 1.0, 'z', 1.5);
    k.rail(36.8, BRZ, 44, iron, 1.0, 'z', 1.5);
    k.skyline({ z: -220, count: 22, spacing: 8, scale: 1.6, base: -2, seed: 71, lit: 0.1, glow: 0.2, tint: 0x8a9096, rows: 1 });
    /* wave 2b: the Sansovino front built out. Tuscan columns paired against every pier, keystones over the arches,
       roundels in the spandrels, Central Park lamps on the terrace, a busker in the loggia, people on the terrace */
    const front = BZ - BD / 2 - 0.75;
    for (let j = 0; j <= 5; j++) { const xp = -BW / 2 + 6 * j; for (const dx of j === 0 ? [0.45] : j === 5 ? [-0.45] : [-0.55, 0.55]) { k.column(xp + dx, 1.0, front, 6.1, 0.3, terra, false); k.keepOut.push({ x: xp + dx, z: front, r: 0.45 }); } }
    for (let i = 0; i < 5; i++) { const cx = -BW / 2 + 6 * (i + 0.5); k.box(0.6, 1.0, 0.5, cx, 7.0, BZ - BD / 2 - 0.45, terra); }
    for (let j = 1; j <= 4; j++) { const r = k.cyl(0.55, 0.16, -BW / 2 + 6 * j, 6.55, BZ - BD / 2 - 0.42, k.flat(0x3e6e5a, 0.2, 0.35), 0.55, 24); r.rotation.x = PI / 2; k.torus(0.62, 0.06, -BW / 2 + 6 * j, 6.55, BZ - BD / 2 - 0.5, terra, 24); }
    const bLamps: number[][] = [];
    for (const x of [-18.5, 18.5]) { bLamps.push([x, 1.0, BZ - BD / 2 - 9.2, 0]); k.point(x, 5.0, BZ - BD / 2 - 9.2, 0xffe2b8, 16, 12); k.keepOut.push({ x, z: BZ - BD / 2 - 9.2, r: 0.4 }); }
    bLamps.push([-9.4, 0.5, BZ - BD / 2 - 23.4, 0]);
    models(k, 'boathouse/cp_gaslamp', { height: 4.4 }, bLamps);
    glbs(k, 'boathouse/cp_bench', { width: 2.2 }, [[-24, 0, BZ - 2, PI / 2], [24, 0, BZ - 2, -PI / 2]]);
    glbs(k, 'boathouse/crowd_folksinger', { height: 1.78 }, [[-9.2, 1.2, BZ - BD / 2 + 2.2, PI]]);
    glbs(k, 'boathouse/crowd_annieh_lite', { height: 1.7 }, [[13.4, 1.0, BZ - BD / 2 - 8.6, PI]]);
    glbs(k, 'boathouse/crowd_susan_lite', { height: 1.66 }, [[-12, 0.35, BZ - BD / 2 - 21.6, PI]]);
    k.crowd([v(-17, 1.0, -1.2), v(17, 1.0, -1.2), v(17, 1.0, -7), v(-17, 1.0, -7)], 9, { seed: 27, closed: true, spread: 1.2, speed: 0.8 });
    k.sign('BOATS  ·  THE LULLWATER', 4.2, 0.6, -12, 2.9, BZ - BD / 2 - 23.9, '#2f5a44', '#f4efe0', 56, 0, { border: true });
    /* the trick: LULLWATER painted flat on the terrace deck, stretched so that from the middle arch it stands upright */
    anamorph(k, 'LULLWATER', 0, BZ - BD / 2, 3, 1.02, 2.5, 7, 1.3, '#2f5a44', 190);
    /* Firefly queue: the Lullwater and its willows in late summer light, a painted backdrop past the far trees */
    fireflyPlate(k, 'assets/museum/tex/boathouse/ff_lullwater_backdrop.webp', 520, 110, 0, 38, -150, 0, new T.MeshBasicMaterial({ visible: false }), true);
    // the census in the boathouse's back room
    k.censusWall({ x: 0, y: 4.2, z: BZ + BD / 2 - 0.32, rotY: PI, cols: 30, rows: 4, tile: 0.62, gap: 0.05, start: ctx.wallStart(1400, 120), pieces: ctx.all, backing: oak });
    k.sign('PROSPECT PARK  ·  THE BOATHOUSE  ·  1905', 9, 0.7, 0, 7.6, BZ + BD / 2 - 0.32, '#3a5a48', '#f4efe0', 80, PI, { border: true });
    /* landmark eggs */
    const BSRC = { name: 'Building of the Day: Prospect Park Boathouse, Brownstoner', url: 'https://www.brownstoner.com/architecture/building-of-the-day-prospect-park-boathouse' };
    const PPSRC = { name: 'Prospect Park (Brooklyn), Wikipedia', url: 'https://en.wikipedia.org/wiki/Prospect_Park_(Brooklyn)' };
    k.egg(v(-BW / 2 + BW / 5, 3.5, BZ - BD / 2 - 0.6), { id: 'boathouse-sansovino', title: 'A Venetian library in terracotta', year: '1905', text: 'Helmle and Huberty based the design on the first floor of Jacopo Sansovino\'s Library of St. Mark in Venice, much simplified. The Venetian original is stone; this one is clad in gleaming white terracotta, which is why it glows in the sun.', clue: 'Put a hand on a pier of the arcade facing the water.', source: BSRC }, { r: 0.9 });
    k.egg(v(0, 1.6, BZ - BD / 2 - 9.2), { id: 'boathouse-sunset', title: 'Turned to face the sunset', text: 'The 1905 boathouse replaced one from 1876 that stood on piers and faced south. The new one faces west across the water, placed to catch the sunsets.', clue: 'Stand at the middle of the terrace rail and face the lake.', source: BSRC }, { r: 0.8 });
    k.egg(v(0, 7.6, BZ + BD / 2 - 0.6), { id: 'boathouse-48hours', title: 'Forty eight hours', year: '1964', text: 'In September 1964 the Parks Department was within forty eight hours of demolishing the boathouse. It survived, and pressure from the young historic preservation movement helped put it on the National Register of Historic Places in 1972.', clue: 'Read the sign over the census on the back wall.', source: { name: 'Prospect Park Boathouse, Wikipedia', url: 'https://en.wikipedia.org/wiki/Prospect_Park_Boathouse' } }, { r: 1.0 });
    k.egg(v(-BW / 2 + 0.6, 6.2, BZ + 1), { id: 'boathouse-audubon', title: 'The first urban Audubon', year: '2000', text: 'In 2000 the National Audubon Society signed a lease on the boathouse, making it the site of the nation\'s first urban Audubon center. Birders have recorded 298 species in Prospect Park over the years, 11 of them not seen in any other city park.', clue: 'Look high on the inside of the loggia\'s end wall.', source: PPSRC }, { r: 0.8 });
    k.egg(v(-12, 0.8, BZ - BD / 2 - 21.5), { id: 'boathouse-lake', title: 'Brooklyn\'s only lake', year: '1867', text: 'The water is all man made: one watercourse that runs through the park and empties into the 60 acre Prospect Lake, Brooklyn\'s only lake. It flows under the Lullwater and Terrace bridges on the way; Olmsted and Vaux laid it out for the park, which opened in 1867.', clue: 'Walk to the end of the dock.', source: PPSRC }, { r: 1.4 });
    k.egg(v(0, 1.4, BZ - BD / 2 - 3.2), { id: 'boathouse-anamorph', title: 'A name that stands up', text: 'LULLWATER is painted flat across the terrace deck, stretched so that from one spot it rises off the boards like a sign. Anywhere else it smears. The trick is anamorphosis; the best known early example is the skull in Hans Holbein\'s The Ambassadors (1533).', clue: 'Stand in the middle arch of the loggia and look out at the lake.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.2 });
    k.egg(v(20, -0.3, -38), { id: 'boathouse-launch', title: 'The electric launch', text: 'Early in the 20th century an electric launch took day trippers round the lake. The park now runs the Independence, a replica of that original electric boat.', clue: 'Look out past the rowboats to where the swans are.', source: PPSRC }, { r: 2.6 });
    // the works: inside the loggia, on the terrace screens, along the dock
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (const z of [BZ - 3.4, BZ + 2.4]) mounts.push({ position: v(s * (BW / 2 - 0.32), 3.6, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * (BW / 2 - 5), 3, z), width: 4.4, height: 2.6, style: 'oak' });
    for (let i = 0; i < 5; i++) { const cx = -BW / 2 + (BW / 5) * (i + 0.5); mounts.push({ position: v(cx, 8.9, BZ - BD / 2 - 1.1), rotation: PI, tilt: 0, target: v(cx, 3, BZ - BD / 2 - 6), width: 3.6, height: 2.0, style: 'white', wash: false }); }
    for (let i = 0; i < 6; i++) { const x = -15 + i * 6; k.box(4.6, 3.8, 0.4, x, 2.9, BZ - BD / 2 - 9.6, terra); k.box(5.0, 0.3, 0.6, x, 4.95, BZ - BD / 2 - 9.6, terra); mounts.push({ position: v(x, 3.2, BZ - BD / 2 - 9.38), rotation: 0, target: v(x, 3, BZ - BD / 2 - 5), width: 4.2, height: 2.5, style: 'white', wash: false }); }
    for (let i = 0; i < 4; i++) { const z = BZ - BD / 2 - 12 - i * 3.2; k.box(0.4, 3.4, 2.8, -14.8, 2.5, z, white); mounts.push({ position: v(-14.58, 2.8, z), rotation: PI / 2, target: v(-11.5, 3, z), width: 2.6, height: 1.9, style: 'white', wash: false }); }
    for (let i = 0; i < 3; i++) { const x = -10 + i * 10; mounts.push({ position: v(x, 3.6, BZ + BD / 2 - 0.34), rotation: PI, target: v(x, 3, BZ), width: 4.2, height: 2.4, style: 'oak' }); }
    return { mounts, spawn: v(0, 3, BZ - BD / 2 - 5), look: v(0, 5, BZ), eye: 3, bounds: [-40, 40, BZ - BD / 2 - 25, 50], style: 'oak' };
  },
};

/* ---------------- 28 THE HALL OF FAME ---------------- */
export const halloffame: RoomDef = {
  id: 'halloffame',
  name: 'The colonnade',
  area: 'HALL OF FAME FOR GREAT AMERICANS',
  mood: 'Bronze afternoon',
  color: '#c9b08a',
  description: 'A semicircular colonnade on a Bronx bluff, the census where the bronze busts stand, a domed library at its heart.',
  signatures: 'The open air Corinthian colonnade curving around the library, bust pedestals between the columns, the terraced site over the Harlem River, the green copper dome and portico.',
  build(k, ctx) {
    k.sky({ top: 0x7aa6d8, horizon: 0xe8e5dc, ground: 0x5a6350, fog: 0.0024, sun: { az: 4.4, el: 0.42, color: 0xffe4c0, size: 16 }, env: 0.9 });
    k.hemi(0xf4f3ea, 0x4a4a3a, 0.9);
    k.sun(0xffe2b8, 2.4, -50, 40, 20, true, 90);
    /* wave 2b: Indiana limestone, the stone floor, buff Roman brick on the library, Guastavino tile under the loggia
       roof and red Spanish tile over it are Poly Haven scans; the bronze tablets are dark statuary bronze */
    const lime = scan(k, 'halloffame', 'large_sandstone_blocks', 5, () => X.ashlar(0xc9bfa6, 24, 3), { color: new T.Color(1.85, 1.76, 1.56) }),
      tileF = scan(k, 'halloffame', 'stone_tiles', 2.2, () => X.subwayTile(0xd9c9a8, 0x7a6a50), { color: new T.Color(1.2, 1.14, 1.02), roughness: 0.5 }),
      bronze = k.flat(0x3e2c1c, 0.75, 0.42),
      copper = k.pbr('hofDome', X.patina(0x5f9a8c), 0.3, { metalness: 0.3, roughness: 0.6 }),
      brick = scan(k, 'halloffame', 'yellow_bricks', 1.7, () => X.brick(0xb89a6a, 34), { color: new T.Color(1.2, 1.08, 0.92) }),
      lawn = scan(k, 'halloffame', 'leafy_grass', 3, () => X.grass(0x4c7a3c, 15), { color: new T.Color(0.78, 1.12, 0.72) }),
      guastavino = scan(k, 'halloffame', 'herringbone_brick', 1.3, () => X.brick(0xc8a27a, 12), { color: new T.Color(1.45, 1.22, 0.98), side: T.DoubleSide }),
      roofTile = scan(k, 'halloffame', 'clay_roof_tiles', 2, () => X.brick(0x9a4632, 20), { color: new T.Color(1.15, 0.9, 0.8) }),
      iron = k.flat(0x1f242a, 0.7, 0.45),
      glow = k.glow(0xfff1d6);
    // the bluff, the river below, the far palisade
    k.box(200, 2, 200, 0, -1, -20, lawn);
    k.water({ y: -22, color: 0x2b4a5c, w: 500, d: 300, z: -230, amp: 0.8 });
    k.box(300, 20, 100, 0, -12, -160, k.pbr('bluff', X.ashlar(0x6f6a5c, 25, 3), 0.1));
    k.box(400, 26, 80, 0, -10, -330, k.pbr('palisade', X.ashlar(0x5a5e58, 26, 2), 0.08));
    k.skyline({ z: -300, count: 24, spacing: 9, scale: 1.4, base: -8, seed: 81, lit: 0.1, glow: 0.2, tint: 0x8a8e94, rows: 1 });
    // the colonnade: a semicircle of paired columns on a terrace, open to the river
    const R = 30, CZ = -50, HX = 0, HZ = CZ - R + 9;
    k.mesh(new T.RingGeometry(R - 5, R + 5, 96, 1, 0, PI), tileF, 0, 0.02, CZ).rotation.x = -PI / 2;
    k.mesh(new T.RingGeometry(R - 5.6, R - 5, 96, 1, 0, PI), lime, 0, 0.1, CZ).rotation.x = -PI / 2;
    k.mesh(new T.RingGeometry(R + 5, R + 5.6, 96, 1, 0, PI), lime, 0, 0.1, CZ).rotation.x = -PI / 2;
    const N = 26;
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * PI;
      for (const rr of [R - 3.6, R + 3.6]) {
        const x = Math.cos(t) * rr, z = CZ - Math.sin(t) * rr;
        k.column(x, 0.1, z, 9, 0.42, lime, true);
      }
    }
    for (let i = 0; i < N; i++) {
      const t0 = (i / N) * PI, t1 = ((i + 1) / N) * PI, tm = (t0 + t1) / 2;
      for (const rr of [R - 3.6, R + 3.6]) {
        const a = v(Math.cos(t0) * rr, 9.3, CZ - Math.sin(t0) * rr), b = v(Math.cos(t1) * rr, 9.3, CZ - Math.sin(t1) * rr);
        k.bar(a, b, 0.8, 1.2, lime);
      }
      const ax = Math.cos(tm) * R, az = CZ - Math.sin(tm) * R;
      k.box(7.4, 0.5, 0.8, 0, 0, 0, lime).position.set(ax, 9.9, az);
      k.objects[k.objects.length - 1].rotation.y = -tm + PI / 2;
    }
    k.mesh(new T.RingGeometry(R - 4.4, R + 4.4, 96, 1, 0, PI), lime, 0, 10.6, CZ).rotation.x = -PI / 2;
    /* the loggia roof is red Spanish tile, not copper (2026-10-09 truth pass); the copper is the library dome */
    k.mesh(new T.RingGeometry(R - 4.6, R + 4.6, 96, 1, 0, PI), roofTile, 0, 11.2, CZ).rotation.x = -PI / 2;
    /* the Guastavino tile ceiling of the loggia, a herringbone soffit over the walk, read from below */
    k.mesh(new T.RingGeometry(R - 4.2, R + 4.2, 96, 1, 0, PI), guastavino, 0, 9.72, CZ).rotation.x = -PI / 2;
    /* Samuel Yellin's iron gates at the two ends, with their inscriptions. The loggia opens west over
       the river (-z), so north is +x. */
    for (const [gx, words] of [[R, 'ENTER WITH JOY THAT THOSE WITHIN HAVE LIVED'], [-R, 'TAKE COUNSEL HERE OF BEAUTY, WISDOM, POWER']] as [number, string][]) {
      k.box(7.4, 0.5, 0.25, gx, 8.3, CZ + 0.3, iron);
      for (let j = 0; j < 9; j++) k.box(0.06, 1.0, 0.06, gx - 3.2 + j * 0.8, 7.6, CZ + 0.3, iron);
      k.sign(words, 7.2, 0.4, gx, 8.9, CZ + 0.45, '#2a2620', '#e8dcc0', 46, 0);
    }
    for (let i = 0; i < 12; i++) { const t = ((i + 0.5) / 12) * PI; k.point(Math.cos(t) * R, 8, CZ - Math.sin(t) * R, 0xfff0d8, 14, 14); }
    // the library at the centre: a rotunda with a green dome and a portico
    k.cyl(15, 12, 0, 6, CZ + 8, brick, 15, 48);
    k.cyl(16, 0.8, 0, 12.4, CZ + 8, lime, 16, 48);
    k.mesh(new T.SphereGeometry(15, 40, 20, 0, PI * 2, 0, PI / 2), copper, 0, 12.8, CZ + 8);
    k.lathe([[2, 0], [2, 0.3], [1.4, 0.5], [1.4, 3], [0.6, 4], [0.1, 4.6]], 0, 27.6, CZ + 8, lime, 20);
    for (let i = 0; i < 6; i++) k.column(-7.5 + i * 3, 0.1, CZ + 24, 10, 0.5, lime, true);
    k.box(20, 1.6, 6, 0, 10.8, CZ + 24.5, lime);
    k.mesh(new T.ConeGeometry(11, 4, 3), lime, 0, 13.6, CZ + 24.5).rotation.y = PI / 6;
    k.box(6, 7, 1.4, 0, 3.5, CZ + 23, k.pbr('hofDoor', X.planks(0x4a3020, 4, 35), 1.2));
    k.block(-15.5, 15.5, CZ - 7.5, CZ + 23.5);
    k.sign('THE HALL OF FAME  ·  1900', 10, 0.9, 0, 9.4, CZ + 27.6, '#5a4a30', '#f4efe0', 90, 0, { border: true });
    // the bust pedestals between the columns carry the census, one work on each
    const mounts: Mount[] = [];
    for (let i = 0; i < 24; i++) {
      const t = ((i + 0.5) / 24) * PI, x = Math.cos(t) * (R + 3.4), z = CZ - Math.sin(t) * (R + 3.4);
      k.lathe([[0.6, 0], [0.6, 0.2], [0.42, 0.3], [0.42, 1.4], [0.55, 1.5], [0.55, 1.6]], x, 0.1, z, lime, 16);
      k.box(0.14, 2.6, 4.2, 0, 0, 0, bronze).position.set(x, 3.0, z);
      k.objects[k.objects.length - 1].rotation.y = Math.atan2(-Math.sin(t), -Math.cos(t));
      k.keepOut.push({ x, z, r: 0.9 });
      mounts.push({ position: v(x + Math.cos(t) * -0.12, 3.0, z + Math.sin(t) * 0.12), rotation: Math.atan2(-Math.cos(t), Math.sin(t)), target: v(Math.cos(t) * (R - 1), 3, CZ - Math.sin(t) * (R - 1)), width: 3.8, height: 2.2, style: 'none', wash: false });
    }
    /* landmark eggs */
    const HSRC = { name: 'Hall of Fame for Great Americans, Wikipedia', url: 'https://en.wikipedia.org/wiki/Hall_of_Fame_for_Great_Americans' };
    const ped = (i: number, y: number) => { const t = ((i + 0.5) / 24) * PI; return v(Math.cos(t) * (R + 2.7), y, CZ - Math.sin(t) * (R + 2.7)); };
    k.egg(v(R, 8.6, CZ + 0.4), { id: 'halloffame-first', title: 'The first hall of fame', year: '1901', text: 'This was the first hall of fame in the United States, designed by Stanford White and dedicated on 30 May 1901. Helen Gould gave $100,000 for it in March 1900; by the end of that year the cost had nearly doubled to $200,000. Samuel Yellin made the iron gates at either end.', clue: 'Read the inscription over the north gate.', source: HSRC }, { r: 1.4 });
    k.egg(v(0, 1.2, CZ - R - 4.9), { id: 'halloffame-wall', title: 'A retaining wall in disguise', text: 'The site falls away steeply to the west, and the 630 foot loggia partly hides the retaining wall that holds up the library above it. It was built as 500 feet, with a 130 foot annex added later, and its parapets are Massachusetts granite, its columns and pedestals Indiana limestone, its ceiling Guastavino tile.', clue: 'Look over the parapet at the outside of the curve.', source: HSRC }, { r: 1.2 });
    k.egg(ped(5, 0.8), { id: 'halloffame-missing', title: 'Four who never got a bust', text: 'The hall has places for 102 bronze busts of its 102 honorees, but as of 2017 only 96 were there. Louis Brandeis, Clara Barton, Luther Burbank and Andrew Carnegie were elected and never sculpted, for lack of money. The last honorees were elected in 1976.', clue: 'Look at the foot of the pedestals, where the names would be.', source: HSRC }, { r: 0.7 });
    k.egg(ped(18, 0.8), { id: 'halloffame-lafayette', title: 'The one foreigner', text: 'The Marquis de Lafayette\'s is the only bust here of a man who was not a citizen, though he was given honorary American citizenship. In 1918 the whole colonnade was turned into a barracks with beds for 600 soldiers.', clue: 'Check the foot of a pedestal on the south side of the curve.', source: HSRC }, { r: 0.7 });
    k.egg(v(-R, 8.6, CZ + 0.4), { id: 'halloffame-tiffany', title: 'Plaques by Tiffany', text: 'Louis Comfort Tiffany designed the honorees\' plaques, each about 13 inches tall and 7 feet wide. The south gate is lettered Take counsel here of Beauty, Wisdom, Power.', clue: 'Read the inscription over the south gate.', source: HSRC }, { r: 1.4 });
    k.egg(v(HX, 2.4, HZ), { id: 'halloffame-hollow', title: 'The bust that watches you', text: 'One bronze here is hollow, and you are looking into the back of its face. The brain will not read a face as concave, so it turns the hollow into a nose and cheeks, and because the depth is reversed the face seems to swing round and follow you as you walk past. It is the hollow face illusion.', clue: 'Walk slowly past the bust on the lawn that says look again.', source: { name: 'Hollow-Face illusion, Wikipedia', url: 'https://en.wikipedia.org/wiki/Hollow-Face_illusion' } }, { r: 1.0 });
    k.egg(v(0, 22, CZ + 8), { id: 'halloffame-gould', title: 'The dome over the library', year: '1900', text: 'The Gould Memorial Library at the centre has a dome of copper tiles over a coffered plaster dome, and a round reading room ringed by 16 green Connemara marble columns and lit by Tiffany glass. Helen Gould paid for it in her father Jay Gould\'s memory, at first anonymously. It has been in films including A Beautiful Mind.', clue: 'Look up at the copper dome.', source: { name: 'Gould Memorial Library, Wikipedia', url: 'https://en.wikipedia.org/wiki/Gould_Memorial_Library' } }, { r: 8 });
    // benches, lamps, the inscription band, the census in the rotunda vestibule
    for (let i = 0; i < 6; i++) { const t = ((i + 0.5) / 6) * PI; k.bench(Math.cos(t) * (R - 8), CZ - Math.sin(t) * (R - 8), -t - PI / 2, k.pbr('benchH', X.planks(0x5d4939, 3, 36), 1.2), iron, 2.4); }
    const hofLamps: number[][] = [];
    for (const t of [0.2, 1.0, 2.1, 2.9]) { const x = Math.cos(t) * (R + 7), z = CZ - Math.sin(t) * (R + 7); hofLamps.push([x, 0, z, -t]); k.point(x, 4.6, z, 0xffe0b0, 22, 16); k.keepOut.push({ x, z, r: 0.4 }); }
    models(k, 'halloffame/cp_gaslamp', { height: 4.8 }, hofLamps);
    k.prop('tree', 24, 0, CZ + 20, { height: 6 });
    k.prop('tree', -24, 0, CZ + 20, { height: 6 });
    k.censusWall({ x: 0, y: 5.2, z: CZ + 22.3, rotY: 0, cols: 20, rows: 3, tile: 0.55, gap: 0.05, start: ctx.wallStart(700, 60), pieces: ctx.all, backing: lime });
    /* wave 2b: the busts. Twenty four bronzes on limestone pedestals along the inside of the walk, each turned to face
       the work hung where its own bust would stand; two models, one cast bronze and one marble scan recast in bronze */
    const bustA: number[][] = [], bustB: number[][] = [];
    for (let i = 0; i < 24; i++) {
      const t = ((i + 0.5) / 24) * PI, x = Math.cos(t) * (R - 2.6), z = CZ - Math.sin(t) * (R - 2.6);
      k.lathe([[0.42, 0], [0.42, 0.16], [0.32, 0.26], [0.3, 1.18], [0.4, 1.26], [0.4, 1.36]], x, 0.1, z, lime, 20);
      (i % 2 ? bustB : bustA).push([x, 1.46, z, t + PI]);
      k.keepOut.push({ x, z, r: 0.6 });
    }
    models(k, 'halloffame/nyb_th_bust', { height: 0.9 }, bustA);
    models(k, 'halloffame/ph_marble_bust_01', { height: 0.9 }, bustB, bronzeTint);
    /* the trick: one bust on the lawn is hollow, seen from inside, and its face turns to follow you as you pass */
    k.lathe([[0.62, 0], [0.62, 0.2], [0.48, 0.32], [0.45, 1.6], [0.6, 1.7], [0.6, 1.82]], HX, 0.1, HZ, lime, 24);
    models(k, 'halloffame/nyb_th_bust', { height: 1.25 }, [[HX, 1.92, HZ, PI / 2]], (m) => { m.side = T.BackSide; });
    k.keepOut.push({ x: HX, z: HZ, r: 0.9 });
    k.sign('LOOK AGAIN', 1.1, 0.24, HX, 1.25, HZ - 0.47, '#3e2c1c', '#e8d2a0', 40, PI);
    /* the Gould library's drum: limestone pilasters and tall windows round the buff brick */
    for (let i = 0; i < 20; i++) { const a = (i / 20) * PI * 2, x = Math.sin(a) * 15.15, z = CZ + 8 + Math.cos(a) * 15.15; const pl = k.box(1.1, 11.2, 0.5, x, 6.2, z, lime); pl.rotation.y = a; if (i % 2) { const w = k.box(1.6, 4.4, 0.3, Math.sin(a + PI / 20) * 15.05, 6.8, CZ + 8 + Math.cos(a + PI / 20) * 15.05, k.glass(0x2a3a44, 0.85, 0.1)); w.rotation.y = a + PI / 20; } }
    /* Samuel Yellin's iron lanterns at the two gates */
    for (const gx of [R, -R]) k.prop('halloffame/h_yellin_lantern', gx + (gx > 0 ? -3.6 : 3.6), 6.2, CZ + 0.5, { height: 1.4 });
    /* Firefly queue: the Harlem River and the Palisades beyond, a painted backdrop past the code palisade */
    fireflyPlate(k, 'assets/museum/tex/halloffame/ff_palisades_backdrop.webp', 640, 140, 0, 30, -360, 0, new T.MeshBasicMaterial({ visible: false }), true);
    return { mounts, spawn: v(Math.cos(0.12) * R, 3, CZ - Math.sin(0.12) * R), look: v(Math.cos(0.75) * R, 6, CZ - Math.sin(0.75) * R), eye: 3, bounds: [-40, 40, CZ - 36, CZ + 46], style: 'none' };
  },
};

/* ---------------- 29 TWA FLIGHT CENTER ---------------- */
export const twa: RoomDef = {
  id: 'twa',
  name: 'Departures, 1962',
  area: 'TWA FLIGHT CENTER',
  mood: 'Jet age',
  color: '#e07a7a',
  description: 'The swooping concrete terminal at the airport, a sunken red lounge, the flight tubes, a plane on the apron.',
  signatures: 'The winged concrete shell and its four vaults, the sunken conversation pit in red, the split flap board, the curved tube corridors, the airliner at the gate.',
  build(k, ctx) {
    k.sky({ top: 0x7fa8d8, horizon: 0xe8e6df, ground: 0x6d6b66, fog: 0.0026, sun: { az: 2.8, el: 0.8, color: 0xfff4e6, size: 14 }, env: 0.95 });
    k.hemi(0xf6f6f0, 0x5a5650, 0.9);
    k.sun(0xfff6ea, 2.4, 20, 60, 30, true, 90);
    /* wave 2b: Saarinen's building rebuilt. The spheres and the two arches (they read as a fast food sign) are gone. Four
       thin shells now meet over the hall with a skylight slot between each pair, the side shells lift like wings, four Y
       piers carry them, a glass skirt follows the shell's edge, the floor is the white penny tile and the lounge is a
       true sunken pit of red carpet with red velvet banquettes. The tubes are rebuilt with a forced perspective. */
    const concrete = scan(k, 'twa', 'white_plaster_02', 5, () => X.plaster(0xe9e6df, 31), { color: new T.Color(1.75, 1.73, 1.68), roughness: 0.85, normal: 0.5, side: T.DoubleSide }),
      tile = scan(k, 'twa', 'rounded_square_tiled_wall', 0.7, () => X.terrazzo(0xe3dfd6, 13), { color: new T.Color(1.12, 1.1, 1.06), roughness: 0.3 }),
      carpet = scan(k, 'twa', 'dirty_carpet', 1.6, () => X.velvet(0xb8202a), { color: new T.Color(1.7, 0.2, 0.22), roughness: 0.95, side: T.DoubleSide }),
      red = scan(k, 'twa', 'velour_velvet', 0.8, () => X.velvet(0xb8202a), { color: new T.Color(1.55, 0.16, 0.2), roughness: 0.8 }),
      redSolid = k.flat(0xb8202a, 0.1, 0.7),
      glass = k.glass(0xcfe6ef, 0.18, 0.05),
      steel = k.flat(0xc9ccd0, 0.85, 0.3),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      apron = scan(k, 'twa', 'hangar_concrete_floor', 4, () => X.concrete(0x8e8e88, 14), { color: new T.Color(1.05, 1.05, 1.02) }),
      white = k.flat(0xf2f2ee, 0.2, 0.5),
      sky = k.glow(0xe4f4ff);
    // the apron, the runway lights, the far terminals
    /* the apron stops round the pit so the sunken lounge can sink below it */
    k.box(400, 0.4, 230, 0, -0.2, -155, apron);
    k.box(400, 0.4, 40, 0, -0.2, 0, apron);
    k.box(190, 0.4, 20, -105, -0.2, -30, apron);
    k.box(190, 0.4, 20, 105, -0.2, -30, apron);
    for (let x = -120; x <= 120; x += 12) { k.sphere(0.25, x, 0.3, -180, k.glow(0x7ad0ff), 6); k.sphere(0.25, x, 0.3, -230, k.glow(0xffffff), 6); }
    k.skyline({ z: -300, count: 20, spacing: 14, scale: 1.2, base: -2, seed: 91, lit: 0.2, glow: 0.4, tint: 0x9a9ea6, rows: 1 });
    /* Firefly queue: Idlewild in 1962 at golden hour, far behind the apron */
    fireflyPlate(k, 'assets/museum/tex/twa/ff_airfield_backdrop.webp', 520, 130, 0, 52, -290, 0, new T.MeshBasicMaterial({ visible: false }), true);
    // the shell: four vaults over a centre at (0, -34); x = r cos f, z = -34 - r sin f, so f = 90 degrees is the airside
    const SR = 31, SC = -34, DEL = 0.018;
    const SH = (r: number, f: number) => { const q = Math.min(1, r / SR); return 8.6 + 8.5 * (1 - q * q) + 16 * q ** 4 * Math.cos(f) ** 2 + 4 * q ** 3 * Math.max(0, Math.sin(f)); };
    const XZ = (r: number, f: number): [number, number] => [r * Math.cos(f), SC - r * Math.sin(f)];
    for (let q = 0; q < 4; q++) {
      const f0 = PI / 4 + q * PI / 2 + DEL, f1 = f0 + PI / 2 - 2 * DEL, NR = 22, NF = 36, pos: number[] = [];
      const P = (i: number, j: number, dy: number) => { const r = 0.4 + (SR - 0.4) * (i / NR), f = f0 + (f1 - f0) * (j / NF), [x, z] = XZ(r, f); return [x, SH(r, f) - dy, z]; };
      const quad = (a: number[], b: number[], c: number[], d: number[]) => pos.push(...a, ...b, ...c, ...a, ...c, ...d);
      for (let i = 0; i < NR; i++) for (let j = 0; j < NF; j++) { quad(P(i, j, 0), P(i, j + 1, 0), P(i + 1, j + 1, 0), P(i + 1, j, 0)); quad(P(i, j, 0.55), P(i + 1, j, 0.55), P(i + 1, j + 1, 0.55), P(i, j + 1, 0.55)); }
      for (let j = 0; j < NF; j++) quad(P(NR, j, 0), P(NR, j + 1, 0), P(NR, j + 1, 0.55), P(NR, j, 0.55));
      for (const [j, i0] of [[0, 0], [NF, 0]]) for (let i = i0; i < NR; i++) quad(P(i, j, 0), P(i + 1, j, 0), P(i + 1, j, 0.55), P(i, j, 0.55));
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(new Array((pos.length / 3) * 2).fill(0), 2));
      g.computeVertexNormals();
      k.mesh(g, concrete);
      /* the skylight slot where this shell meets the next, glowing with the sky */
      const fs = f0 - DEL, sp: number[] = [];
      for (let i = 0; i < NR; i++) {
        const r0 = 0.4 + (SR - 0.4) * (i / NR), r1 = 0.4 + (SR - 0.4) * ((i + 1) / NR);
        const a = [...XZ(r0, fs - DEL)], b = [...XZ(r0, fs + DEL)], c = [...XZ(r1, fs + DEL)], d = [...XZ(r1, fs - DEL)];
        const y0 = SH(r0, fs) - 0.3, y1 = SH(r1, fs) - 0.3;
        sp.push(a[0], y0, a[1], b[0], y0, b[1], c[0], y1, c[1], a[0], y0, a[1], c[0], y1, c[1], d[0], y1, d[1]);
      }
      const sg = new T.BufferGeometry();
      sg.setAttribute('position', new T.Float32BufferAttribute(sp, 3));
      sg.computeVertexNormals();
      k.mesh(sg, sky, 0, 0, 0, true);
      /* a Y pier under the seam, outside the glass: a trunk that forks into two arms up to the shells' edges */
      const fork = v(...([XZ(28.6, fs)[0], 5.2, XZ(28.6, fs)[1]] as [number, number, number]));
      const foot = XZ(27.6, fs);
      k.curve([v(foot[0], 0, foot[1]), v((foot[0] + fork.x) / 2, 2.6, (foot[1] + fork.z) / 2), fork], 0.95, concrete, 12);
      for (const df of [-0.11, 0.11]) { const [ex, ez] = XZ(29.8, fs + df); k.curve([fork, v((fork.x + ex) / 2, (5.2 + SH(29.8, fs + df)) / 2, (fork.z + ez) / 2), v(ex, SH(29.8, fs + df) - 0.4, ez)], 0.6, concrete, 14); }
      k.sphere(1.05, fork.x, fork.y, fork.z, concrete, 16);
      k.keepOut.push({ x: foot[0], z: foot[1], r: 1.4 });
    }
    /* the glass skirt follows the shell's edge round the hall, open at the back where the flight wing wall stands */
    const GR = 26, gp: number[] = [];
    const GN = 96, ga = (i: number) => (125 + (290 * i) / GN) * (PI / 180);
    for (let i = 0; i < GN; i++) {
      const [x0, z0] = XZ(GR, ga(i)), [x1, z1] = XZ(GR, ga(i + 1)), h0 = SH(GR, ga(i)) - 0.55, h1 = SH(GR, ga(i + 1)) - 0.55;
      gp.push(x0, 0.2, z0, x1, 0.2, z1, x1, h1, z1, x0, 0.2, z0, x1, h1, z1, x0, h0, z0);
      if (i % 3 === 0) k.bar(v(x0, 0.2, z0), v(x0, h0, z0), 0.14, 0.32, white);
    }
    const gg = new T.BufferGeometry();
    gg.setAttribute('position', new T.Float32BufferAttribute(gp, 3));
    gg.computeVertexNormals();
    k.mesh(gg, glass, 0, 0, 0, true);
    // the floor: white penny tile on a disc with the pit cut out, and a strip back to the flight wing wall
    const fl = new T.Shape(); fl.absarc(0, -SC, GR + 1, 0, PI * 2, false);
    const hole = new T.Path(); hole.absarc(0, 30, 9.6, 0, PI * 2, true); fl.holes.push(hole);
    const flg = new T.ExtrudeGeometry(fl, { depth: 0.25, bevelEnabled: false, curveSegments: 48 });
    flg.rotateX(-PI / 2);
    k.mesh(flg, tile, 0, -0.05, 0);
    k.box(58, 0.25, 15.5, 0, 0.055, -52.75, tile);
    // the flight wing wall at the back: two tube mouths, the airside glazing above
    for (const [x0, x1] of [[-29, -16.5], [-11.5, 11.5], [16.5, 29]]) k.box(x1 - x0, 6.5, 0.8, (x0 + x1) / 2, 3.25, -60.5, concrete);
    for (const s of [-1, 1]) { k.box(5, 1.7, 0.8, s * 14, 5.65, -60.5, concrete); k.sign(s < 0 ? 'FLIGHT WING 1' : 'FLIGHT WING 2', 4.6, 0.6, s * 14, 5.4, -60.05, '#b8202a', '#f4f1ea', 60, 0); }
    k.box(58, 6.2, 0.2, 0, 9.6, -60.6, glass);
    for (let x = -28; x <= 28; x += 4) k.box(0.14, 6.2, 0.3, x, 9.6, -60.5, white);
    k.block(-29, 29, -61, -60);
    // the sunken lounge: three tiers of red carpet down to the pit floor, banquettes in red velvet, round tables
    k.lathe([[9.6, 0.2], [9.6, -0.38], [8.5, -0.38], [8.5, -0.96], [7.4, -0.96], [7.4, -1.6], [0.01, -1.6]], 0, 0, -30, carpet, 72);
    k.torus(9.62, 0.09, 0, 0.2, -30, white, 96).rotation.x = PI / 2;
    for (const [r, y] of [[9.15, -0.1], [8.05, -0.68], [6.95, -1.28]] as [number, number][]) {
      const seat = k.mesh(new T.TorusGeometry(r, 0.42, 10, 72, PI * 1.55), red, 0, y, -30);
      seat.rotation.set(PI / 2, 0, PI * 0.725);
      seat.scale.set(1, 1, 0.55);
    }
    models(k, 'twa/ph_coffee_table_round_01', { height: 0.5 }, [[-2.6, -1.6, -27.5, 0], [2.6, -1.6, -27.5, 0], [0, -1.6, -32.8, 0]]);
    k.keepOut.push({ x: 0, z: -30, r: 9.8 });
    k.point(0, 4, -30, 0xffe6cc, 26, 16);
    for (let i = 0; i < 8; i++) { const a = (i * PI) / 4; k.point(Math.cos(a) * 15, 6.5, -34 - Math.sin(a) * 15, 0xfff2e2, 46, 30); }
    k.point(0, 9, -34, 0xfff6ec, 60, 30);
    /* lounge chairs by the windows, luggage by the board, travellers walking round the pit */
    models(k, 'twa/ph_mid_century_lounge_chair', { height: 1.05 }, [[-17, 0.2, -16, 2.4], [-15, 0.2, -14.2, 2.7], [17, 0.2, -16, -2.4], [15, 0.2, -14.2, -2.7], [-21.5, 0.2, -24, 1.9], [21.5, 0.2, -24, -1.9]]);
    for (const [x, z] of [[-17, -16], [-15, -14.2], [17, -16], [15, -14.2], [-21.5, -24], [21.5, -24]]) k.keepOut.push({ x, z, r: 0.8 });
    models(k, 'twa/ph_vintage_suitcase', { width: 0.9 }, [[-5.6, 0.2, -10.4, 0.2], [-4.7, 0.2, -10.2, -0.1], [5.2, 0.2, -10.5, 0.3]]);
    k.crowd([v(-15, 0.2, -18), v(-16, 0.2, -36), v(0, 0.2, -46), v(16, 0.2, -36), v(15, 0.2, -18), v(0, 0.2, -12)], 18, { seed: 29, closed: true, spread: 2.2, speed: 1.0 });
    k.box(10, 4.2, 0.6, 0, 6, -12, dark);
    k.beam(v(-4, 8.2, -12), v(-4, 13, -12), 0.08, steel, 6);
    k.beam(v(4, 8.2, -12), v(4, 13, -12), 0.08, steel, 6);
    k.censusWall({ x: 0, y: 6.4, z: -11.68, rotY: 0, cols: 16, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(4800, 64), pieces: ctx.all, backing: dark });
    k.sign('DEPARTURES  ·  ALL NEW YORKERS  ·  ON TIME', 9.6, 0.5, 0, 8.4, -11.68, '#111', '#ffd27a', 60, 0);
    const boardRows = ctx.pieces.slice(80, 86);
    boardRows.forEach((p, j) => k.sign(`${String(p.n).padStart(4, '0')}   ${p.t.slice(0, 30).toUpperCase().padEnd(32, ' ')}  GATE ${1 + j}`, 9.6, 0.36, 0, 4.2 - j * 0.4, -11.68, '#111', '#e8e2c8', 44, 0, { align: 'left' } as never));
    // the tubes: two red carpeted flight tubes leaving the back wall; the trick is that they shrink as they go
    const flightTube = (s: number) => {
      const cur = new T.CatmullRomCurve3([v(s * 14, 0, -60.9), v(s * 15.5, 0, -74), v(s * 21, 0, -88), v(s * 30, 0, -100)]);
      const N = 36, M = 18, tp: number[] = [], cp: number[] = [];
      const ring = (u: number) => { const p = cur.getPointAt(u), t = cur.getTangentAt(u), side = v(-t.z, 0, t.x).normalize(), sc = 1 - 0.58 * u, W = 2.5 * sc, Hh = 4.6 * sc;
        return { p, side, sc, pts: Array.from({ length: M + 1 }, (_, j) => { const th = (PI * j) / M, cx = Math.cos(th), sy = Math.pow(Math.sin(th), 0.55); return p.clone().addScaledVector(side, cx * W).setY(0.22 + sy * Hh); }), W }; };
      for (let i = 0; i < N; i++) {
        const A = ring(i / N), B = ring((i + 1) / N);
        for (let j = 0; j < M; j++) { const a = A.pts[j], b = A.pts[j + 1], c = B.pts[j + 1], d = B.pts[j]; tp.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, a.x, a.y, a.z, c.x, c.y, c.z, d.x, d.y, d.z); }
        const a = A.p.clone().addScaledVector(A.side, -A.W * 0.92).setY(0.24), b = A.p.clone().addScaledVector(A.side, A.W * 0.92).setY(0.24), c = B.p.clone().addScaledVector(B.side, B.W * 0.92).setY(0.24), d = B.p.clone().addScaledVector(B.side, -B.W * 0.92).setY(0.24);
        cp.push(a.x, a.y, a.z, d.x, d.y, d.z, c.x, c.y, c.z, a.x, a.y, a.z, c.x, c.y, c.z, b.x, b.y, b.z);
      }
      for (const [arr, m] of [[tp, concrete], [cp, carpet]] as [number[], T.Material][]) { const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(arr, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(new Array((arr.length / 3) * 2).fill(0), 2)); g.computeVertexNormals(); k.mesh(g, m); }
      /* ceiling lights that come closer together as the tube narrows, the way a longer tube would look */
      for (let u = 0.02; u < 0.98; u += 0.075 * (1 - 0.58 * u)) { const R = ring(u); k.box(1.1 * R.sc, 0.05, 0.5 * R.sc, R.p.x, 0.2 + 4.55 * R.sc, R.p.z, k.glow(0xfff4e2)); }
      const end = ring(1);
      k.box(2.6 * end.sc * 2, 4.4 * end.sc, 0.1, end.p.x, 0.22 + 2.2 * end.sc, end.p.z - 0.05, k.glow(0xfff0dc, 0.95));
      k.point(s * 14.4, 3.4, -64, 0xfff0dc, 20, 14);
    };
    flightTube(-1);
    flightTube(1);
    // the airliner at the gate
    const px = 60, pz = -110;
    const fus = k.mesh(new T.CylinderGeometry(3.4, 3.4, 52, 24), white, px, 6, pz);
    fus.rotation.set(PI / 2, 0, 0.3);
    k.mesh(new T.SphereGeometry(3.4, 20, 12), white, px - Math.sin(0.3) * 26, 6, pz + Math.cos(0.3) * 26);
    k.mesh(new T.ConeGeometry(3.4, 10, 20), white, px + Math.sin(0.3) * 31, 6.8, pz - Math.cos(0.3) * 31).rotation.set(-PI / 2 + 0.15, 0, 0.3);
    /* 2026-10-09 truth pass: the plane at the TWA terminal today is Connie, a preserved Lockheed
       L-1649 Starliner, so the airliner is now a Starliner: straight wings, four engine nacelles,
       a triple tail. It was a swept wing twin jet. */
    for (const s of [-1, 1]) {
      const wing = k.mesh(new T.BoxGeometry(34, 0.8, 7), white, px + s * 17 * Math.cos(0.3), 4.6, pz + s * 17 * Math.sin(0.3)); wing.rotation.y = -0.3 - s * 0.06; wing.rotation.z = s * 0.06;
      for (const e of [7, 13]) { const eng = k.mesh(new T.CylinderGeometry(0.95, 0.8, 5, 14), steel, px + s * e * Math.cos(0.3) - Math.sin(0.3) * 2.4, 4.2, pz + s * e * Math.sin(0.3) + Math.cos(0.3) * 2.4); eng.rotation.set(PI / 2, 0, 0.3); }
    }
    const tailX = px + Math.sin(0.3) * 24, tailZ = pz - Math.cos(0.3) * 24;
    k.mesh(new T.BoxGeometry(18, 0.4, 3.4), white, tailX, 8.6, tailZ).rotation.y = -0.3;
    for (const o of [-9, 0, 9]) k.mesh(new T.BoxGeometry(0.5, o === 0 ? 5.2 : 4.6, 4.4), redSolid, tailX + o * Math.cos(0.3), 10.6, tailZ + o * Math.sin(0.3)).rotation.y = 0.3;
    k.box(52, 0.5, 1.2, px, 0.25, pz + 30, redSolid);
    for (let i = 0; i < 4; i++) k.cyl(0.9, 1.2, px - 12 + i * 8, 0.6, pz + 8, dark, 0.9, 12);
    /* landmark eggs */
    const TSRC = { name: 'TWA Flight Center, Wikipedia', url: 'https://en.wikipedia.org/wiki/TWA_Flight_Center' };
    k.egg(v(0, 14, -34), { id: 'twa-grapefruit', title: 'The grapefruit at breakfast', text: 'The roof is a thin concrete shell in four parts, carried on four Y shaped piers; it weighs 6,000 short tons and covers about an acre and a half. The final model for it may have been inspired by Eero Saarinen pressing down on the middle of a grapefruit at breakfast.', clue: 'Look up at the crown of the concrete shell.', source: TSRC }, { r: 4 });
    k.egg(v(0, 0.6, -30), { id: 'twa-opening', title: 'He never saw it open', year: '1962', text: 'Saarinen died in 1961. Passengers began using the unfinished terminal on 19 March 1962 and it was dedicated on 28 May 1962. Almost 58 million ceramic tiles line its walls and floors.', clue: 'Step down into the red sunken lounge.', source: TSRC }, { r: 1.6 });
    k.egg(v(0, 8.4, -11.3), { id: 'twa-solari', title: 'Made in Udine', text: 'The departures board is a split flap display made in Italy by Solari di Udine. It showed the flights when the terminal opened, and it was fully restored when the building became a hotel.', clue: 'Read the departures board over the lounge.', source: { name: 'TWA Hotel, Wikipedia', url: 'https://en.wikipedia.org/wiki/TWA_Hotel' } }, { r: 0.8 });
    k.egg(v(-14, 3.2, -61.2), { id: 'twa-tubes', title: 'The red tubes', text: 'The two flight tubes are covered passageways about 232 and 272 feet long, carpeted in red, that carried passengers from the main building out to the gates.', clue: 'Find the mouth of a flight tube at the back of the hall.', source: TSRC }, { r: 1.0 });
    k.egg(v(14, 2.4, -66), { id: 'twa-forced', title: 'Longer than it looks', text: 'These flight tubes cheat. The ceiling drops, the walls close in and the lights come closer together the further they go, so a short tube reads as the long walk out to the gate. It is forced perspective, the old stage and film trick of building the far end small.', clue: 'Stand at the mouth of Flight Wing 2 and look down the tube.', source: { name: 'Forced perspective, Wikipedia', url: 'https://en.wikipedia.org/wiki/Forced_perspective' } }, { r: 1.2 });
    k.egg(v(px, 6, pz), { id: 'twa-connie', title: 'Connie', text: 'The plane parked at the TWA Hotel is a preserved Lockheed L-1649 Starliner, fitted out inside as a cocktail lounge named Connie. The hotel opened on 15 May 2019 with 512 rooms and an infinity pool on the roof.', clue: 'Look out at the airliner on the apron.', source: { name: 'TWA Hotel, Wikipedia', url: 'https://en.wikipedia.org/wiki/TWA_Hotel' } }, { r: 8 });
    k.egg(v(0, 5, -8.4), { id: 'twa-landmark', title: 'Last flight, 2001', year: '1994', text: 'New York City made the terminal\'s headhouse a landmark, inside and out, in 1994. TWA sold its assets in October 2001 and American Airlines ran its last flights from here that December.', clue: 'Look at the glass wall where you walk in.', source: TSRC }, { r: 1.2 });
    // the works: around the drum's wall, the pit rim, the tube mouths
    const mounts: Mount[] = [];
    for (let i = 0; i < 12; i++) {
      const a = PI * 0.12 + (i / 11) * PI * 0.76, x = Math.cos(a) * 24.6, z = -34 - Math.sin(a) * 24.6;
      k.box(0.3, 4.2, 5.8, 0, 0, 0, white).position.set(x, 3, z);
      k.objects[k.objects.length - 1].rotation.y = Math.atan2(-Math.sin(a), -Math.cos(a));
      mounts.push({ position: v(x - Math.cos(a) * 0.2, 3.2, z + Math.sin(a) * 0.2), rotation: Math.atan2(-Math.cos(a), Math.sin(a)), target: v(Math.cos(a) * 19, 3, -34 - Math.sin(a) * 19), width: 4.8, height: 2.8, style: 'white', wash: false });
    }
    for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2; const x = Math.cos(a) * 11.5, z = -30 + Math.sin(a) * 11.5; k.box(0.3, 3, 4, 0, 0, 0, redSolid).position.set(x, 1.6, z); k.objects[k.objects.length - 1].rotation.y = -a; mounts.push({ position: v(x + Math.cos(a) * 0.2, 1.9, z + Math.sin(a) * 0.2), rotation: -a + PI / 2, target: v(Math.cos(a) * 15, 3, -30 + Math.sin(a) * 15), width: 3.6, height: 2.0, style: 'white', wash: false }); }
    for (const x of [-6.8, 6.8]) mounts.push({ position: v(x, 4.2, -11.68), rotation: 0, target: v(x, 3, -6), width: 4.4, height: 2.5, style: 'steel' });
    for (const s of [-1, 1]) mounts.push({ position: v(s * 26, 3.4, -59.7), rotation: 0, target: v(s * 22, 3, -50), width: 4.4, height: 2.5, style: 'white', wash: false });
    return { mounts, spawn: v(0, 3, 16), look: v(0, 9, -34), eye: 3, bounds: [-25, 25, -58, 20], style: 'white' };
  },
};

/* ---------------- 30 SNUG HARBOR ---------------- */
export const snug: RoomDef = {
  id: 'snug',
  name: 'The sailors\' rest',
  area: 'SNUG HARBOR',
  mood: 'Staten Island stillness',
  color: '#c9c3a4',
  description: 'Five Greek temples in a row on a Staten Island lawn, a hall of the census inside the main one, a walled scholar\'s garden behind.',
  signatures: 'The row of Greek Revival temple fronts with Ionic porticos, the long front lawn, the Music Hall, the Chinese Scholar\'s Garden with its pond, pavilion and moon gate.',
  build(k, ctx) {
    k.sky({ top: 0x7ea9d6, horizon: 0xe9ebe5, ground: 0x59684c, fog: 0.0026, sun: { az: 1.6, el: 0.7, color: 0xfff3dc, size: 14 }, env: 0.9 });
    k.hemi(0xf4f6ff, 0x455a3c, 0.9);
    k.sun(0xfff0d4, 2.4, 40, 60, 30, true, 100);
    /* wave 2b: Tuckahoe marble, stucco, the old plank floor, lawn, gravel, grey roof tile, the garden's pebble mosaic
       and its white walls are Poly Haven scans */
    const lime = scan(k, 'snug', 'marble_01', 2.6, () => X.ashlar(0xd6cdb6, 27, 3), { color: new T.Color(1.12, 1.1, 1.04), roughness: 0.55 }),
      plaster = scan(k, 'snug', 'white_stucco', 2.4, () => X.plaster(0xece6d8, 32), { color: new T.Color(1.22, 1.18, 1.1) }),
      floorW = scan(k, 'snug', 'old_wood_floor', 2.2, () => X.planks(0x8a6a48, 8, 37), { color: new T.Color(1.1, 1.0, 0.9) }),
      lawn = scan(k, 'snug', 'leafy_grass', 3, () => X.grass(0x4a7a3a, 16), { color: new T.Color(0.78, 1.12, 0.72) }),
      gravel = scan(k, 'snug', 'gravel_floor', 2, () => X.cobble(0xa8a08c, 8), { color: new T.Color(1.15, 1.12, 1.05) }),
      tileRoof = scan(k, 'snug', 'grey_roof_tiles', 2, () => X.boardwalk(0x5a5e66), { color: new T.Color(0.95, 0.97, 1.02) }),
      pebble = scan(k, 'snug', 'multicolored_pebble_floor', 1.6, () => X.cobble(0xa8a08c, 8), { color: new T.Color(1.1, 1.08, 1.02) }),
      gardenWall = scan(k, 'snug', 'white_plaster_rough_01', 2.4, () => X.plaster(0xece6d8, 32), { color: new T.Color(1.2, 1.18, 1.14) }),
      stoneG = k.pbr('gardenStone', X.ashlar(0x8f8a7c, 28, 3), 0.3),
      wood = k.pbr('pavilionWood', X.planks(0x7a3a2a, 4, 38), 1.2),
      water = k.flat(0x37646a, 0.5, 0.2, { transparent: true, opacity: 0.9 }),
      koi = k.flat(0xe07a2a, 0.1, 0.6),
      iron = k.flat(0x1f242a, 0.7, 0.45);
    // the lawn, the flagpole, the harbour beyond the trees
    k.box(220, 0.4, 220, 0, -0.2, -20, lawn);
    k.box(6, 0.2, 80, 0, 0.0, 30, gravel);
    k.cyl(0.08, 16, 10, 8, 40, iron, 0.05, 8);
    k.box(2.4, 1.4, 0.05, 11.2, 14.8, 40, k.flat(0xd8d8e0, 0, 0.8));
    const rnd = X.mulberry(30);
    for (let i = 0; i < 40; i++) { const x = (rnd() - 0.5) * 200, z = 46 + rnd() * 30; k.tree(x, 0, z, { kind: 'round', h: 7 + rnd() * 5, r: 4 + rnd() * 3, leaf: 0x3f6b36, seed: i }); }
    k.water({ y: -1.5, color: 0x3a5468, w: 400, d: 200, z: 170, amp: 0.8 });
    k.skyline({ z: 240, count: 22, spacing: 10, scale: 1.4, base: -2, seed: 92, lit: 0.1, glow: 0.2, tint: 0x8a8e96, rows: 1 });
    // five temple fronts in a row
    const temple = (x: number, w: number, d: number, main: boolean, cols?: number) => {
      const z = -6;
      k.box(w + 2, 1.2, d + 4, x, 0.6, z - d / 2, lime);
      k.box(w, 10, d, x, 6, z - d / 2 - 2, plaster);
      k.block(x - w / 2 - 0.3, x + w / 2 + 0.3, z - d - 2.3, z - 1.7);
      const n = cols ? cols - 1 : Math.round(w / 3.2);
      for (let i = 0; i <= n; i++) k.column(x - w / 2 + (w / n) * i, 1.2, z + 1.4, 9, 0.5, lime, true);
      k.box(w + 1.6, 1.4, 5, x, 10.9, z - 0.6, lime);
      /* a true pediment with raking cornices, and a gable roof of grey tile running back from it (it was a wedge) */
      pediment(k, w + 1.6, 3.0, 5, x, 11.6, z - 0.6, lime, lime);
      pediment(k, w + 0.6, 2.9, d + 2, x, 11.55, z - d / 2 - 1.2, tileRoof, tileRoof);
      if (main) { k.box(4, 6, 0.4, x, 3, z - 1.9, k.pbr('snugDoor', X.planks(0x4a3020, 4, 39), 1.2)); }
      return { x, z, w, d };
    };
    temple(-46, 16, 24, false);
    temple(-24, 18, 26, false);
    /* Building C, Lafever's 1833 centre building, has eight columns under its pediment (it had nine) */
    const main = temple(0, 24, 34, true, 8);
    temple(24, 18, 26, false);
    temple(46, 16, 24, false);
    // inside the main hall: a coffered ceiling, the census on the end wall, works on both long walls
    const MX = main.x, MZ = main.z - 2, MW = main.w, MD = main.d;
    k.box(MW - 0.6, 0.3, MD - 0.6, MX, 1.2, MZ - MD / 2, floorW);
    /* a built coffered ceiling: a plaster soffit, a grid of marble beams, a gilt rosette in each coffer, and a stained
       glass skylight in the middle (a Firefly plate; the painted stand in shows until it lands) */
    const gilt = k.flat(0xc9a25a, 0.8, 0.35);
    k.box(MW - 0.6, 0.25, MD - 0.6, MX, 10.35, MZ - MD / 2, plaster);
    for (let x = -12; x <= 12; x += 6) k.box(0.55, 0.75, MD - 0.6, MX + x, 9.9, MZ - MD / 2, lime);
    for (let z = -1; z > -MD + 1; z -= 6) k.box(MW - 0.6, 0.75, 0.55, MX, 9.9, MZ + z, lime);
    for (let x = -9; x <= 9; x += 6) for (let z = -4; z > -MD + 4; z -= 6) { if (Math.abs(x) < 4 && Math.abs(z + MD / 2) < 4) continue; k.cyl(0.55, 0.14, MX + x, 10.17, MZ + z, gilt, 0.35, 16); k.point(MX + x, 8.5, MZ + z, 0xfff2e0, 14, 12); }
    const domeStand = paintTex(512, 512, (c, w, h) => {
      c.fillStyle = '#1f3a5a'; c.fillRect(0, 0, w, h);
      const cols = ['#c9a25a', '#3f7fae', '#b8402a', '#e8dcb0', '#2f6a4a'];
      for (let r = 8; r > 0; r--) for (let i = 0; i < 16; i++) { c.fillStyle = cols[(r + i) % cols.length]; c.beginPath(); c.moveTo(w / 2, h / 2); c.arc(w / 2, h / 2, r * 30, (i / 16) * PI * 2, ((i + 1) / 16) * PI * 2); c.closePath(); c.fill(); c.strokeStyle = '#141414'; c.lineWidth = 3; c.stroke(); }
    });
    const dome = fireflyPlate(k, 'assets/museum/tex/snug/ff_dome_glass.webp', 5.4, 5.4, MX + 0, 10.2, MZ - MD / 2, 0, domeStand ? new T.MeshBasicMaterial({ map: domeStand }) : k.glow(0xe8dcb0), true);
    dome.rotation.x = PI / 2;
    k.point(MX, 8.8, MZ - MD / 2, 0xffe8c8, 26, 14);
    // cut a door in the front wall: the block list above sealed the whole footprint, reopen the door bay
    k.blocks = k.blocks.filter((b) => !(Math.abs(b.x0 - (MX - MW / 2 - 0.3)) < 0.01 && Math.abs(b.z1 - (main.z - 1.7)) < 0.01));
    /* wave 2b: these two were meant as the front wall either side of the door but ran the whole depth of the hall,
       which walled off both long walls of works (13 unreachable); now they are the front wall only */
    k.block(MX - MW / 2 - 0.3, MX - 2.2, MZ - 0.3, MZ + 0.3);
    k.block(MX + 2.2, MX + MW / 2 + 0.3, MZ - 0.3, MZ + 0.3);
    k.block(MX - MW / 2, MX + MW / 2, MZ - MD - 0.3, MZ - MD + 0.3);
    k.block(MX - MW / 2 - 0.3, MX - MW / 2 + 0.3, MZ - MD, MZ);
    k.block(MX + MW / 2 - 0.3, MX + MW / 2 + 0.3, MZ - MD, MZ);
    k.censusWall({ x: MX, y: 5.0, z: MZ - MD + 0.32, rotY: 0, cols: 26, rows: 4, tile: 0.62, gap: 0.05, start: ctx.wallStart(5200, 104), pieces: ctx.all, backing: lime });
    k.sign('SAILORS\' SNUG HARBOR  ·  1833', 8, 0.7, MX, 8.4, MZ - MD + 0.32, '#4a4a3a', '#f4efe0', 90, 0, { border: true });
    // the scholar's garden behind the row: wall, moon gate, pond, pavilion, rockery
    const GZ = -60, GW = 40, GD = 30;
    for (const s of [-1, 1]) k.box(0.6, 3.6, GD, s * GW / 2, 1.8, GZ - GD / 2, gardenWall);
    k.box(GW, 3.6, 0.6, 0, 1.8, GZ - GD, gardenWall);
    k.box(GW / 2 - 3, 3.6, 0.6, -GW / 4 - 1.5, 1.8, GZ, gardenWall);
    k.box(GW / 2 - 3, 3.6, 0.6, GW / 4 + 1.5, 1.8, GZ, gardenWall);
    /* the moon gate: a raised white panel with a true round opening and a stone rim */
    const mg = new T.Shape(); mg.moveTo(-3, 0); mg.lineTo(3, 0); mg.lineTo(3, 4.6); mg.lineTo(-3, 4.6); mg.closePath();
    const mh = new T.Path(); mh.absarc(0, 2.25, 2.05, 0, PI * 2, true); mg.holes.push(mh);
    const mgg = new T.ExtrudeGeometry(mg, { depth: 0.6, bevelEnabled: false, curveSegments: 40 }); mgg.translate(0, 0, -0.3);
    k.mesh(mgg, gardenWall, 0, 0, GZ);
    k.torus(2.05, 0.13, 0, 2.25, GZ + 0.31, stoneG, 48);
    k.torus(2.05, 0.13, 0, 2.25, GZ - 0.31, stoneG, 48);
    k.box(6.6, 0.3, 0.9, 0, 4.75, GZ, tileRoof);
    k.sign('SCHOLAR\'S GARDEN', 2.6, 0.42, 0, 4.0, GZ + 0.32, '#2a2a28', '#e8dcb0', 44, 0);
    for (const s of [-1, 1]) { k.block(s * GW / 2 - 0.4, s * GW / 2 + 0.4, GZ - GD, GZ); k.block(s > 0 ? 3 : -GW / 2, s > 0 ? GW / 2 : -3, GZ - 0.4, GZ + 0.4); }
    k.block(-GW / 2, GW / 2, GZ - GD - 0.4, GZ - GD + 0.4);
    for (const s of [-1, 1]) k.box(0.4, 0.4, GD + 1, s * GW / 2, 3.8, GZ - GD / 2, tileRoof);
    k.box(GW + 1, 0.4, 0.4, 0, 3.8, GZ - GD, tileRoof);
    k.box(GW, 0.4, GD, 0, -0.05, GZ - GD / 2, pebble);
    k.mesh(new T.CylinderGeometry(7, 7.5, 0.8, 32), stoneG, -6, 0.3, GZ - 16);
    k.mesh(new T.CylinderGeometry(6.4, 6.4, 0.8, 32), water, -6, 0.35, GZ - 16);
    k.keepOut.push({ x: -6, z: GZ - 16, r: 7.8 });
    const fish: T.Object3D[] = [];
    for (let i = 0; i < 8; i++) { const f = k.mesh(new T.SphereGeometry(0.22, 8, 6), koi, -6, 0.6, GZ - 16, true); f.scale.set(1, 0.5, 2); fish.push(f); }
    /* 2026-10-28: the kit's koi.glb takes the place of the squashed spheres; they swim the same circles, backs just
       breaking the surface (the pool top is at 0.75 at 0.9 opacity: the old spheres at 0.6 barely showed).
       A failed load leaves the spheres. */
    const swim = (t: number) => fish.forEach((f, i) => { const a = t * 0.3 + i; const r = 2 + (i % 4); f.position.set(-6 + Math.cos(a) * r, 0.6, GZ - 16 + Math.sin(a) * r); f.rotation.y = -a; });
    swim(0);
    void hero(k, 'koi', { length: 0.62 }).then((h) => {
      if (!h) return;
      fish.forEach((f, i) => { f.visible = false; const c = i ? h.clone() : h; c.position.set(0, -0.02, 0); const g = new T.Group(); g.add(c); k.add(g); g.position.copy(f.position); g.rotation.y = f.rotation.y; fish[i] = g; });
    });
    if (!ctx.reduced) k.ticks.push(swim);
    /* the rockery: scanned boulders stacked as the garden's bones of the earth (they were boxes) */
    const rocks: number[][][] = [[], [], []];
    for (let i = 0; i < 9; i++) { const s = 0.8 + rnd() * 1.4, x = 8 + rnd() * 8, z = GZ - 8 - rnd() * 14; rocks[i % 3].push([x, -0.1, z, rnd() * PI * 2, 0.7 + s * 0.4]); rnd(); }
    models(k, 'snug/namaqualand_boulder_04', { height: 2.2 }, rocks[0], (m) => m.color.setRGB(0.78, 0.8, 0.84));
    models(k, 'snug/namaqualand_boulder_02', { height: 1.3 }, rocks[1], (m) => m.color.setRGB(0.78, 0.8, 0.84));
    models(k, 'snug/namaqualand_boulder_05', { height: 1.0 }, rocks[2], (m) => m.color.setRGB(0.78, 0.8, 0.84));
    k.keepOut.push({ x: 12, z: GZ - 15, r: 6 });
    const PX = 10, PZ = GZ - 24;
    k.box(7, 0.6, 7, PX, 0.3, PZ, stoneG);
    for (const dx of [-2.8, 2.8]) for (const dz of [-2.8, 2.8]) k.cyl(0.18, 4, PX + dx, 2.6, PZ + dz, wood, 0.18, 10);
    k.mesh(new T.ConeGeometry(6, 2.6, 4), tileRoof, PX, 5.6, PZ).rotation.y = PI / 4;
    k.box(7.4, 0.3, 7.4, PX, 4.6, PZ, wood);
    for (let i = 0; i < 4; i++) k.tree(-14 + i * 10, 0, GZ - 26, { kind: 'round', h: 3.4, r: 1.9, leaf: 0x5a8a3a, seed: 200 + i });
    k.prop('lantern', -6, 1.0, GZ - 8, { height: 1.0 });
    k.prop('lantern', PX, 0.6, PZ + 4.2, { height: 1.0 });
    /* the pavilion: upturned eave tips, a finial, a tea table and stools inside */
    for (const dx of [-3.7, 3.7]) for (const dz of [-3.7, 3.7]) k.curve([v(PX + dx * 0.8, 4.75, PZ + dz * 0.8), v(PX + dx, 4.8, PZ + dz), v(PX + dx * 1.12, 5.4, PZ + dz * 1.12)], 0.12, wood, 8);
    k.lathe([[0.3, 0], [0.22, 0.3], [0.32, 0.6], [0.05, 1.2]], PX, 6.85, PZ, k.flat(0xc9a25a, 0.8, 0.35), 12);
    glbs(k, 'snug/ph_chinese_tea_table', { height: 0.72 }, [[PX, 0.6, PZ, 0]]);
    glbs(k, 'snug/ph_chinese_stool', { height: 0.66 }, [[PX - 1.1, 0.6, PZ, PI / 2], [PX + 1.1, 0.6, PZ, -PI / 2]]);
    /* a zigzag bridge of granite slabs across the pond */
    const zz = [[-13.2, GZ - 13.5], [-9.5, GZ - 15.5], [-6, GZ - 13], [-2.5, GZ - 15.8], [1.2, GZ - 13.8]];
    for (let i = 0; i < zz.length - 1; i++) { const [x0, z0] = zz[i], [x1, z1] = zz[i + 1]; const sl = k.box(Math.hypot(x1 - x0, z1 - z0) + 0.3, 0.22, 1.1, (x0 + x1) / 2, 0.95, (z0 + z1) / 2, stoneG); sl.rotation.y = -Math.atan2(z1 - z0, x1 - x0); }
    for (const [x, z] of zz) k.cyl(0.18, 1.1, x, 0.4, z, stoneG, 0.2, 8);
    /* the trick: the garden's back wall is painted with gate after gate going on for ever, on the moon gate's axis */
    const endless = paintTex(1024, 462, (c, w, h) => {
      const sky = c.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#bcd6e8'); sky.addColorStop(1, '#eef1ea'); c.fillStyle = sky; c.fillRect(0, 0, w, h);
      const vx = w / 2, vy = h * 0.47;
      for (let i = 7; i >= 0; i--) {
        const sc = Math.pow(0.66, i), ww = w * 0.98 * sc, hh = h * 1.05 * sc, x0 = vx - ww / 2, y0 = vy - hh * 0.52, cr = hh * 0.36, cy = y0 + hh * 0.5;
        c.fillStyle = '#3d6b35'; for (let t = 0; t < 4; t++) { c.beginPath(); c.arc(x0 + ww * (0.12 + t * 0.25), y0 + hh * 0.2, hh * 0.16, 0, PI * 2); c.fill(); }
        c.fillStyle = '#9a9488'; c.beginPath(); c.moveTo(vx - cr * 0.7, cy + cr); c.lineTo(vx + cr * 0.7, cy + cr); c.lineTo(vx + ww * 0.3, y0 + hh * 1.1); c.lineTo(vx - ww * 0.3, y0 + hh * 1.1); c.closePath(); c.fill();
        const shade = 238 - i * 14; c.fillStyle = `rgb(${shade},${shade - 4},${shade - 10})`;
        c.beginPath(); c.rect(x0, y0, ww, hh); c.arc(vx, cy, cr, 0, PI * 2, true); c.fill('evenodd');
        /* the reveal: the thickness of the wall seen inside the round opening, in shadow on the far side */
        const rv = c.createLinearGradient(vx - cr, cy - cr, vx + cr, cy + cr); rv.addColorStop(0, '#8a857a'); rv.addColorStop(1, '#4a463f');
        c.strokeStyle = rv; c.lineWidth = Math.max(2, 26 * sc); c.beginPath(); c.arc(vx, cy, cr - 13 * sc, 0, PI * 2); c.stroke();
        c.strokeStyle = '#3c3a35'; c.lineWidth = Math.max(1, 6 * sc); c.beginPath(); c.arc(vx, cy, cr, 0, PI * 2); c.stroke();
        c.fillStyle = '#4f535a'; c.fillRect(x0, y0, ww, Math.max(2, hh * 0.05));
      }
    });
    fireflyPlate(k, 'assets/museum/tex/snug/ff_endless_gates.webp', 9.6, 3.4, 0, 1.8, GZ - GD + 0.32, 0, endless ? new T.MeshStandardMaterial({ map: endless, roughness: 0.9 }) : gardenWall);
    /* on the front lawn: Randall in bronze on his pedestal, Central Park lamps along the walk, benches, an iron fence */
    k.box(2.2, 2.4, 2.2, 0, 1.2, 14, lime);
    k.box(2.6, 0.3, 2.6, 0, 2.45, 14, lime);
    models(k, 'snug/cp_statue', { height: 3.0 }, [[0, 2.6, 14, 0]], bronzeTint);
    k.keepOut.push({ x: 0, z: 14, r: 1.8 });
    const sLamps: number[][] = [];
    for (const z of [36, 24, 6]) for (const sx of [-4.2, 4.2]) { sLamps.push([sx, 0, z, 0]); k.point(sx, 4.3, z, 0xffe0b0, 16, 12); k.keepOut.push({ x: sx, z, r: 0.4 }); }
    models(k, 'snug/cp_gaslamp', { height: 4.6 }, sLamps);
    glbs(k, 'snug/cp_bench', { width: 2.2 }, [[-9, 0, 30, PI / 2], [9, 0, 30, -PI / 2], [-9, 0, 18, PI / 2], [9, 0, 18, -PI / 2]]);
    const iron2 = k.flat(0x161a1e, 0.6, 0.45);
    for (let x = -57; x <= 57; x += 1.5) { if (Math.abs(x) < 4) continue; k.box(0.08, 2.0, 0.08, x, 1.0, 43, iron2); k.mesh(new T.ConeGeometry(0.09, 0.25, 6), iron2, x, 2.1, 43); }
    for (const y of [0.4, 1.7]) for (const sx of [-1, 1]) k.box(53, 0.08, 0.08, sx * 30.5, y, 43, iron2);
    for (const sx of [-4.2, 4.2]) k.box(0.5, 2.8, 0.5, sx, 1.4, 43, lime);
    k.crowd([v(-2, 0, 40), v(-2, 0, 4), v(-30, 0, 2), v(-2, 0, 4), v(2, 0, 4), v(30, 0, 2), v(2, 0, 4), v(2, 0, 40)], 14, { seed: 30, closed: true, spread: 1.4, speed: 0.9 });
    k.sign('SAILORS\' SNUG HARBOR', 14, 0.9, MX, 10.9, -3.45, '#d6cfbe', '#5a5446', 70, 0);
    /* landmark eggs */
    const SSRC = { name: 'Snug Harbor Cultural Center, Wikipedia', url: 'https://en.wikipedia.org/wiki/Snug_Harbor_Cultural_Center' };
    k.egg(v(MX, 8.4, MZ - MD + 0.6), { id: 'snug-randall', title: 'Worn out sailors', year: '1801', text: 'Captain Robert Richard Randall died in 1801 and left his country manor for aged, decrepit and worn out sailors, a home he called Sailors\' Snug Harbor. Augustus Saint-Gaudens made a bronze statue of him, cast in 1884; the original was moved to Sea Level, North Carolina, in the 1980s and a replica stands here.', clue: 'Read the name over the census at the end of the hall.', source: SSRC }, { r: 0.9 });
    k.egg(v(0, 12.6, -3.8), { id: 'snug-buildingc', title: 'Thirty seven sailors', year: '1833', text: 'The centre temple, Building C, was finished in August 1833 and first housed 37 retired sailors. It is Minard Lafever\'s oldest surviving work, though he left the job abruptly and Samuel Thomson and Son finished it. Eight columns carry its pediment.', clue: 'Count the columns of the middle temple.', source: SSRC }, { r: 1.4 });
    k.egg(v(-24, 12.6, -3.8), { id: 'snug-landmarks', title: 'Among the first twenty', year: '1965', text: 'The five temple fronts, Buildings A to E, were built between 1831 and 1880. On 14 October 1965 they and the chapel were designated New York City landmarks, six of the city\'s first 20.', clue: 'Look at the pediment of the next temple along.', source: SSRC }, { r: 1.4 });
    k.egg(v(10, 8, 40), { id: 'snug-killvankull', title: 'On the Kill Van Kull', text: 'The campus sits on the Kill Van Kull, the strait along Staten Island\'s North Shore. It covers 83 acres today, cut down from the original 130, and a Greek Revival iron fence of 1842 runs round the property.', clue: 'Walk out to the flagpole and look toward the water.', source: SSRC }, { r: 1.4 });
    k.egg(v(0, 1.8, GZ - GD + 0.8), { id: 'snug-endless', title: 'The gate behind the gate', text: 'The far wall of the garden is painted, not built: a trompe l\'oeil of moon gates going on and on. Chinese gardens frame views through gates and windows so that a small walled garden feels larger than it is; this wall cheats the same way with paint.', clue: 'Step through the moon gate and look straight ahead.', source: { name: 'Trompe-l\'oeil, Wikipedia', url: 'https://en.wikipedia.org/wiki/Trompe-l%27%C5%93il' } }, { r: 1.4 });
    const GSRC = { name: 'New York Chinese Scholar\'s Garden, Wikipedia', url: 'https://en.wikipedia.org/wiki/New_York_Chinese_Scholar%27s_Garden' };
    k.egg(v(0, 3.3, GZ), { id: 'snug-suzhou', title: 'Built by forty from Suzhou', year: '1999', text: 'The Chinese Scholar\'s Garden was built by a team of 40 Chinese artists and artisans from Suzhou, with its materials shipped to Staten Island in the spring of 1998. It opened in June 1999. Frances Paulo Huber had seen the need for an authentic Chinese garden in 1984.', clue: 'Look at the top of the moon gate.', source: GSRC }, { r: 0.7 });
    k.egg(v(12, 2.4, GZ - 15), { id: 'snug-bones', title: 'The bones of the earth', text: 'The garden holds three ponds and a waterfall, two pavilions, and walls placed to frame each view. Its rocks are called the bones of the earth.', clue: 'Find the rockery by the pond.', source: GSRC }, { r: 1.4 });
    // the works: the main hall's long walls, between the portico columns, in the pavilion
    const mounts: Mount[] = [];
    for (let i = 0; i < 5; i++) { const z = MZ - 5 - i * 5.6; for (const s of [-1, 1]) mounts.push({ position: v(MX + s * (MW / 2 - 0.34), 3.6, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(MX + s * (MW / 2 - 5.5), 3, z), width: 4.4, height: 2.6, style: 'gilt' }); }
    for (const x of [-8, 8]) mounts.push({ position: v(MX + x, 4.6, MZ - MD + 0.34), rotation: 0, target: v(MX + x, 3, MZ - MD + 6), width: 4.4, height: 2.6, style: 'gilt' });
    for (const tx of [-46, -24, 24, 46]) { for (const dx of [-3.5, 3.5]) mounts.push({ position: v(tx + dx, 3.6, -7.66), rotation: 0, target: v(tx + dx, 3, -1), width: 3.6, height: 2.2, style: 'white', wash: false }); }
    for (const a of [0, (3 * PI) / 4, (5 * PI) / 4, (7 * PI) / 4]) { const x = PX + Math.cos(a) * 3.2, z = PZ + Math.sin(a) * 3.2; mounts.push({ position: v(x, 2.6, z), rotation: -a + PI / 2, target: v(PX + Math.cos(a) * 7, 3, PZ + Math.sin(a) * 7), width: 2.6, height: 1.6, style: 'oak', wash: false }); }
    return { mounts, spawn: v(0, 3, 26), look: v(0, 8, -6), eye: 3, bounds: [-58, 58, GZ - GD + 1, 44], style: 'gilt' };
  },
};

/* ---------------- 31 WOLLMAN RINK ---------------- */
export const wollman: RoomDef = {
  id: 'wollman',
  name: 'Ice under the towers',
  area: 'WOLLMAN RINK',
  mood: 'December night',
  color: '#bcd7ea',
  description: 'The rink in the southeast corner of the park, the works hung on the boards, skaters as light, snow falling on the skyline.',
  signatures: 'The oval rink below the outcrops, the Midtown towers rising over bare trees, the boards, the rental house and terrace, snow on every ledge.',
  build(k, ctx) {
    k.sky({ top: 0x0a1226, horizon: 0x2b3a5e, ground: 0x0c1018, fog: 0.004, stars: 500, env: 0.5 });
    k.hemi(0xc8d8ff, 0x1a2230, 0.6);
    k.sun(0xbfd0ff, 0.9, 30, 60, 20, true, 90);
    /* wave 2b: scanned snow, pavers and planks; the ice carries the night's skate marks; the boards are one continuous
       elliptical dasher wall with kick plate, cap rail and panels (the 64 boxes were set at the wrong angle and read as
       dominoes); real skaters, a Zamboni, Central Park lamps and benches, schist boulders */
    const iceMap = paintTex(1024, 1024, (c, w, h) => {
      c.fillStyle = '#dfeef7'; c.fillRect(0, 0, w, h);
      const r = X.mulberry(310);
      for (let i = 0; i < 1400; i++) {
        c.strokeStyle = `rgba(${r() > 0.7 ? '190,214,232' : '255,255,255'},${0.08 + r() * 0.22})`;
        c.lineWidth = 0.6 + r() * 1.6;
        c.beginPath(); c.ellipse(w / 2 + (r() - 0.5) * 300, h / 2 + (r() - 0.5) * 300, 80 + r() * 420, 60 + r() * 380, r() * 0.4, r() * PI * 2, r() * PI * 2 + 0.3 + r() * 1.4); c.stroke();
      }
      for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(255,255,255,${0.15 + r() * 0.2})`; c.beginPath(); c.ellipse(r() * w, r() * h, 6 + r() * 30, 3 + r() * 10, r() * PI, 0, PI * 2); c.fill(); }
    });
    const iceRough = paintTex(1024, 1024, (c, w, h) => {
      c.fillStyle = '#262626'; c.fillRect(0, 0, w, h);
      const r = X.mulberry(310);
      for (let i = 0; i < 1400; i++) { c.strokeStyle = `rgba(150,150,150,${0.2 + r() * 0.4})`; c.lineWidth = 0.6 + r() * 1.6; c.beginPath(); c.ellipse(w / 2 + (r() - 0.5) * 300, h / 2 + (r() - 0.5) * 300, 80 + r() * 420, 60 + r() * 380, r() * 0.4, r() * PI * 2, r() * PI * 2 + 0.3 + r() * 1.4); c.stroke(); }
    }, false);
    const ice = new T.MeshStandardMaterial({ color: iceMap ? 0xffffff : 0xd9eef8, map: iceMap, roughness: iceRough ? 1 : 0.1, roughnessMap: iceRough, metalness: 0.05, envMapIntensity: 1.3 }),
      board = k.flat(0xf3f3ee, 0, 0.32),
      kick = k.flat(0xe8b923, 0, 0.45),
      capRail = k.flat(0x1c2b46, 0.3, 0.4),
      snow = scan(k, 'wollman', 'snow_02', 3, () => X.plaster(0xeef2f8, 34), { color: new T.Color(1.35, 1.38, 1.45), roughness: 0.95 }),
      pav = scan(k, 'wollman', 'concrete_pavers', 2.6, () => X.pavers(0x6f6f6a, 20), { color: new T.Color(1.05, 1.05, 1.08) }),
      timber = scan(k, 'wollman', 'weathered_planks', 2.4, () => X.planks(0x6a4a30, 6, 40), { color: new T.Color(1.15, 0.95, 0.8) }),
      iron = k.flat(0x1f242a, 0.7, 0.45),
      warmGlass = k.glow(0xffd9a0, 0.9);
    // the rink: an oval of ice ringed by boards, a terrace to the south
    const RX = 26, RZ = 18;
    const oval = k.mesh(new T.CircleGeometry(1, 96), ice, 0, 0.05, -30);
    oval.scale.set(RX, RZ, 1);
    oval.rotation.x = -PI / 2;
    if (iceMap) { iceMap.repeat.set(2, 2); iceRough!.repeat.set(2, 2); }
    ellipseWall(k, RX + 0.15, RZ + 0.15, 0, -30, 0, 1.15, 0.2, board);
    ellipseWall(k, RX + 0.12, RZ + 0.12, 0, -30, 0, 0.26, 0.04, kick);
    ellipseWall(k, RX + 0.08, RZ + 0.08, 0, -30, 1.15, 0.08, 0.34, capRail);
    /* dasher panels on the inside of the boards, facing the ice */
    const panels = ['WOLLMAN RINK  1950', 'SKATE COUNTERCLOCKWISE', 'CENTRAL PARK', 'HOT COCOA AT THE HOUSE', 'NO HOCKEY STICKS', 'THE COUNT ON ICE', 'NEW YORKERS BY MLOW', 'MIND THE ZAMBONI', 'SKATE RENTAL  ALL DAY', 'CENTRAL PARK SOUTH'];
    panels.forEach((txt, i) => {
      const a = (i / panels.length) * PI * 2 + 0.17, c = Math.cos(a), s = Math.sin(a), nx = c / (RX + 0.1), nz = s / (RZ + 0.1), l = Math.hypot(nx, nz);
      k.sign(txt, 3.6, 0.5, (RX + 0.08) * c - (nx / l) * 0.03, 0.68, -30 + (RZ + 0.08) * s - (nz / l) * 0.03, i % 2 ? '#0d3b66' : '#f4f4ee', i % 2 ? '#f4f4ee' : '#0d3b66', 46, Math.atan2(-nx, -nz));
    });
    k.mesh(new T.RingGeometry(1, 1.5, 96), pav, 0, 0.01, -30).scale.set(RX + 0.5, RZ + 0.5, 1);
    k.objects[k.objects.length - 1].rotation.x = -PI / 2;
    k.box(70, 0.4, 24, 0, -0.2, 6, pav);
    // the rental house: planked, lit windows, a snowy roof, a canopy over the skate window
    k.box(24, 4.2, 10, 0, 2.1, 14, timber);
    k.box(25, 0.6, 11, 0, 4.4, 14, snow);
    k.box(25.4, 0.25, 11.4, 0, 4.05, 14, capRail);
    for (const x of [-10.5, -6.5, 6.5, 10.5]) { k.box(2.6, 1.5, 0.12, x, 2.2, 8.97, warmGlass); k.box(2.9, 0.14, 0.3, x, 1.42, 8.9, capRail); k.box(2.9, 0.14, 0.3, x, 2.98, 8.9, capRail); }
    k.box(10, 0.18, 2.4, 0, 4.0, 7.8, capRail);
    k.point(0, 3.4, 7.4, 0xffd9a0, 18, 10);
    k.sign('SKATE RENTAL  ·  HOT COCOA  ·  THE COUNT', 9, 0.8, 0, 3.2, 8.95, '#1a2230', '#ffe0a8', 80, PI, { border: true });
    k.sign('WOLLMAN RINK', 12, 1.5, 0, 5.6, 9.2, '#0d3b66', '#f4f4ee', 150, PI, { border: true });
    k.block(-12.5, 12.5, 9, 19.5);
    // the skaters: MLow's skater cast, gliding counterclockwise on loops of the ice; a Zamboni waiting at the gate
    const skaters: T.Object3D[] = [];
    const NS = 16, sk = Array.from({ length: NS }, (_, i) => ({ r: 0.3 + ((i * 7) % 11) / 11 * 0.55, sp: 0.16 + (i % 5) * 0.035, ph: i * 1.7, lean: 0.12 + (i % 3) * 0.05 }));
    const skate = (t: number) => skaters.forEach((o, i) => {
      const p = sk[i], a = t * p.sp + p.ph, x = Math.cos(a) * RX * p.r, z = -30 + Math.sin(a) * RZ * p.r;
      o.position.set(x + Math.sin(t * 0.6 + i) * 0.8, 0.06, z);
      o.rotation.set(0, Math.atan2(-RX * Math.sin(a), RZ * Math.cos(a)), 0);
      o.rotateZ(p.lean * (i % 2 ? 1 : -1) * (0.6 + 0.4 * Math.sin(t * 2.2 + i)));
    });
    models(k, 'wollman/lt_skater', { height: 1.7 }, sk.map(() => [0, -50, 0, 0]), undefined, NS + 1, (os) => { skaters.push(...os); skate(0); if (!ctx.reduced) k.ticks.push(skate); });
    glbs(k, 'wollman/lt_zamboni', { width: 3.6 }, [[RX + 3.6, 0, -25, PI / 2]]);
    k.keepOut.push({ x: RX + 3.6, z: -25, r: 2.4 });
    glbs(k, 'wollman/lt_snowman', { height: 1.9 }, [[-18, 0, 3.2, 0.4]]);
    k.keepOut.push({ x: -18, z: 3.2, r: 1 });
    /* people on the terrace, leaning on the boards to watch */
    const watch: [string, number][] = [['annieh', -14], ['cabbie', -9], ['loretta', 7], ['susan', 11], ['workgirl', 16], ['writer', -20]];
    for (const [n, x] of watch) { const z = -30 + RZ * Math.sqrt(Math.max(0, 1 - (x / RX) ** 2)) + 0.75; glbs(k, `wollman/crowd_${n}_lite`, { height: 1.72 }, [[x, 0, z, PI]]); }
    // snow falling: a cloud of points that recycles from the top
    const NPTS = 700, pos = new Float32Array(NPTS * 3), rnd = X.mulberry(31);
    for (let i = 0; i < NPTS; i++) { pos[i * 3] = (rnd() - 0.5) * 120; pos[i * 3 + 1] = rnd() * 40; pos[i * 3 + 2] = -30 + (rnd() - 0.5) * 120; }
    const pg = new T.BufferGeometry();
    pg.setAttribute('position', new T.BufferAttribute(pos, 3));
    const flakes = new T.Points(pg, new T.PointsMaterial({ color: 0xffffff, size: 0.18, transparent: true, opacity: 0.85 }));
    k.add(flakes);
    if (!ctx.reduced) k.ticks.push((t, dt) => { const a = pg.attributes.position as T.BufferAttribute; for (let i = 0; i < NPTS; i++) { let y = a.getY(i) - dt * (1.2 + (i % 3) * 0.5); if (y < 0) y = 40; a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(t + i) * dt * 0.3); } a.needsUpdate = true; });
    // the outcrops (Poly Haven boulders as schist), bare trees under snow, Central Park lamps, the towers of Midtown
    const crops: T.Vector3[] = [], big: number[][] = [], mid: number[][] = [];
    for (let i = 0; i < 10; i++) { const a = rnd() * PI * 2, r = 40 + rnd() * 20, x = Math.cos(a) * r, z = -30 + Math.sin(a) * r * 0.7; if (z > 0) continue; const s = 3 + rnd() * 4; (s > 5 ? big : mid).push([x, -0.4, z, rnd() * PI]); crops.push(v(x, s * 0.9, z)); }
    const schist = (m: T.MeshStandardMaterial) => m.color.setRGB(0.72, 0.74, 0.8);
    models(k, 'wollman/namaqualand_boulder_04', { width: 10 }, big, schist);
    models(k, 'wollman/namaqualand_boulder_02', { width: 9 }, mid, schist);
    for (let i = 0; i < 40; i++) { const a = rnd() * PI * 2, r = 34 + rnd() * 30, x = Math.cos(a) * r, z = -30 + Math.sin(a) * r * 0.8; if (z > 2 && Math.abs(x) < 40) continue; k.tree(x, 0, z, { kind: 'bare', h: 5 + rnd() * 4, r: 3 + rnd() * 2, seed: i }); }
    const lamps: [number, number, number, number][] = [];
    for (let i = 0; i < 10; i++) { const a = (i / 10) * PI * 2, x = Math.cos(a) * (RX + 5), z = -30 + Math.sin(a) * (RZ + 5); lamps.push([x, 0, z, -a]); k.point(x, 4.1, z, 0xffe0b0, 26, 16); k.keepOut.push({ x, z, r: 0.4 }); }
    glbs(k, 'wollman/cp_gaslamp', { height: 4.4 }, lamps, undefined, 12);
    glbs(k, 'wollman/cp_bench', { width: 2.2 }, [[-24, 0, 4.6, PI], [-28.5, 0, 4.6, PI], [31, 0, 1.6, PI], [35, 0, 1.6, PI]]);
    k.skyline({ z: 70, count: 30, spacing: 6.5, scale: 2.4, base: -2, seed: 93, lit: 0.55, glow: 1.6, tint: 0x232a3a });
    k.skyline({ z: 110, count: 26, spacing: 9, scale: 3.2, base: -2, seed: 94, lit: 0.45, glow: 1.3, tint: 0x2a3140, rows: 1 });
    /* Firefly queue: the towers of Central Park South at night over the bare trees, a plate far behind the code skyline */
    fireflyPlate(k, 'assets/museum/tex/wollman/ff_cps_backdrop.webp', 420, 105, 0, 46, 160, PI, new T.MeshBasicMaterial({ visible: false }), true);
    k.box(80, 0.4, 60, 0, -0.2, -80, snow);
    k.box(6, 3.5, 4, 19.6, 1.75, 4, k.flat(0xdedee0, 0.3, 0.5));
    k.box(3, 2, 3.6, 18.6, 4.4, 4, k.glass(0xbfd8e6, 0.4, 0.1));
    k.keepOut.push({ x: 19.6, z: 4, r: 3.3 });
    k.prop('lantern', -12, 0, 6, { height: 1.0 });
    k.prop('bell', 12, 1.6, 8, { height: 0.8 });
    k.box(0.25, 1.6, 0.25, 12, 0.8, 8, iron);
    k.censusWall({ x: 0, y: 2.6, z: 19.2, rotY: 0, cols: 22, rows: 3, tile: 0.6, gap: 0.05, start: ctx.wallStart(3300, 66), pieces: ctx.all, backing: timber });
    /* the trick: WOLLMAN painted into the ice, stretched so that from the boards where you come in it stands upright */
    anamorph(k, 'WOLLMAN', 0, -12, 3, 0.06, 8, 8, 2.0, '#0d3b66', 210);
    /* landmark eggs */
    const WSRC = { name: 'Wollman Rink, Wikipedia', url: 'https://en.wikipedia.org/wiki/Wollman_Rink' };
    const CPSRC = { name: 'Central Park, Wikipedia', url: 'https://en.wikipedia.org/wiki/Central_Park' };
    k.egg(v(11.3, 3.6, 8.6), { id: 'wollman-gift', title: 'Kate Wollman\'s $600,000', year: '1950', text: 'The rink opened on 21 December 1950. Kate Wollman gave $600,000 to build it.', clue: 'Look at the corner of the rental house front.', source: WSRC }, { r: 0.6 });
    k.egg(v(RX + 0.6, 1.4, -30), { id: 'wollman-pond', title: 'Skating on the Pond', text: 'The rink was made from the western part of the Pond, in the park\'s southeast corner. All of Central Park\'s eight lakes and ponds are artificial, made by damming natural seeps and flows. Pickleball courts went in at the rink in 2023 and became permanent the next year.', clue: 'Go to the far end of the boards.', source: CPSRC }, { r: 0.8 });
    k.egg(v(-RX - 0.6, 1.4, -30), { id: 'wollman-buckle', title: 'The floor that buckled', year: '1986', text: 'The rink closed in the winter of 1980 after its concrete floor buckled. A city plan to swap the old brine cooling for Freon was dropped in May 1986 in favour of brine in plastic pipes, and the rebuilt rink, which had been reckoned at two years\' work, was finished two months early and $750,000 under the estimate.', clue: 'Find the boards at the west end of the ice.', source: WSRC }, { r: 0.8 });
    k.egg(v(-12, 1.2, 6), { id: 'wollman-films', title: 'A movie rink', text: 'The rink has played itself in Love Story (1970), Carnal Knowledge (1971), Home Alone 2: Lost in New York (1992), The Devil\'s Own (1997), Serendipity (2001), Night at the Museum (2006), Limitless and Mr. Popper\'s Penguins (both 2011).', clue: 'Stand by the lantern on the terrace and watch the skaters.', source: WSRC }, { r: 0.8 });
    k.egg(v(12, 1.6, 8), { id: 'wollman-summer', title: 'An amusement park in summer', text: 'From 2003 to 2019 the rink became Victorian Gardens every summer, a seasonal amusement park for children open from late May to September.', clue: 'Ring the bell by the rental house.', source: WSRC }, { r: 0.8 });
    k.egg(v(0, 0.4, -27), { id: 'wollman-anamorph', title: 'Letters that stand up', text: 'The name painted into the ice is stretched down the rink so that from one spot at the boards it seems to stand upright, and from anywhere else it smears flat. The trick is anamorphosis; the famous early example is the skull across the floor of Hans Holbein\'s The Ambassadors (1533), which only takes shape from the side.', clue: 'Stand at the boards where you came in and look straight down the ice.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.6 });
    if (crops.length) k.egg(crops[0], { id: 'wollman-schist', title: 'The bedrock shows', text: 'The grey outcrops all over Central Park are Manhattan schist and Hartland schist, metamorphosed sedimentary rock exposed in outcrops across the park.', clue: 'Find a snowy outcrop of grey rock beyond the rink.', source: CPSRC }, { r: 3 });
    // the works: on the boards facing the ice, on the rental house, on the terrace
    const mounts: Mount[] = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * PI * 2 + PI / 16, x = Math.cos(a) * (RX + 0.3), z = -30 + Math.sin(a) * (RZ + 0.3);
      const rot = -Math.atan2(Math.sin(a) * RX, Math.cos(a) * RZ) + PI / 2;
      for (const d of [-1.3, 1.3]) k.box(0.08, 1.3, 0.08, x - Math.cos(a) * 0.42 + Math.cos(rot) * d, 1.8, z - Math.sin(a) * 0.42 - Math.sin(rot) * d, iron);
      mounts.push({ position: v(x - Math.cos(a) * 0.35, 2.4, z - Math.sin(a) * 0.35), rotation: rot + PI, target: v(Math.cos(a) * (RX - 5), 3, -30 + Math.sin(a) * (RZ - 4)), width: 3.6, height: 2.0, style: 'white', wash: false });
    }
    for (const x of [-8, 0, 8]) mounts.push({ position: v(x, 3.0, 8.95), rotation: PI, target: v(x, 3, 3), width: 4.4, height: 2.6, style: 'oak' });
    for (const x of [-26, 26]) { k.box(4.6, 4, 0.4, x, 2, 4, board); mounts.push({ position: v(x, 2.6, 3.78), rotation: PI, target: v(x, 3, -1), width: 4.2, height: 2.5, style: 'white', wash: false }); }
    return { mounts, spawn: v(0, 3, -12), look: v(0, 5, -64), eye: 3, bounds: [-40, 40, -66, 8], style: 'white', floorY: (x, z) => (((x / RX) ** 2 + ((z + 30) / RZ) ** 2) < 1 ? 0.05 : 0) };
  },
};
