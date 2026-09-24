/* 149 and 150: two views every New Yorker has taken a picture of.
   Washington Street in DUMBO, where the Manhattan Bridge tower stands at the end of a brick canyon with
   the Empire State Building caught in its legs, and Bow Bridge over the Lake in Central Park, with
   the rowboats underneath and the San Remo over the trees. Moving things are instanced rigs or single
   groups on k.ticks, and nothing moves when ctx.reduced is set. */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as X from '../textures';
import { v, type Mount } from '../kit';
import type { RoomDef } from './types';
const PI = Math.PI;
type K = Parameters<RoomDef['build']>[0];
const one = new T.Vector3(1, 1, 1);

/* a standing figure that never moves: batched with everything else of its colour */
function figure(k: K, x: number, y: number, z: number, coat: number, p: { h?: number; rotY?: number; crouch?: number; skin?: number } = {}) {
  const { h = 1, rotY = 0, crouch = 1, skin = 0xc8a284 } = p;
  const body = k.mesh(new T.CapsuleGeometry(0.2, 0.82 * h * crouch, 3, 8), k.flat(coat, 0, 0.85), x, y + 0.61 * h * crouch, z);
  body.rotation.y = rotY;
  k.mesh(new T.SphereGeometry(0.125, 10, 8), k.flat(skin, 0, 0.7), x, y + (1.22 * h * crouch + 0.13), z);
  return body;
}
/* a small figure with a colour and a head, as one merged geometry for instancing */
function figureGeo(r = 0.2, len = 0.82, headY = 1.35) {
  const body = new T.CapsuleGeometry(r, len, 3, 8); body.translate(0, r + len / 2, 0);
  const head = new T.SphereGeometry(r * 0.62, 10, 8); head.translate(0, headY, 0);
  return mergeGeometries([body, head])!;
}
const part = (w: number, h: number, d: number, x: number, y: number, z: number, rz = 0) => { const g = new T.BoxGeometry(w, h, d); g.rotateZ(rz); g.translate(x, y, z); return g; };

/* A warehouse facade painted once on a canvas: brick in courses, segmental arched windows with
   painted frames and six over six sash, stone sills. One tile is four bays by four floors, sixteen
   metres square, so the kit's world projection (density 1/16) lays it on any box at true scale. */
const loftCache = new Map<string, X.Surface>();
function loftSurface(key: string, p: { brick: number; frame: string; seed: number; lit?: number; tall?: boolean }) {
  const hit = loftCache.get(key); if (hit) return hit;
  const S = 512, B = 128, rnd = X.mulberry(p.seed), lit = p.lit ?? 0.3;
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = S; return c; };
  const c = mk(), e = mk(), g = c.getContext('2d')!, ge = e.getContext('2d')!;
  const base = new T.Color(p.brick);
  const tone = (s: number) => base.clone().multiplyScalar(s).getStyle();
  g.fillStyle = tone(1.35); g.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y += 4) { const off = (y / 4) % 2 ? 6 : 0; for (let x = -6; x < S; x += 12) { g.fillStyle = tone(0.78 + rnd() * 0.38); g.fillRect(x + off, y, 11, 3); } }
  ge.fillStyle = '#000'; ge.fillRect(0, 0, S, S);
  for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) {
    const x0 = q * B + (p.tall ? 34 : 28), w = p.tall ? 60 : 72, bot = S - r * B - 20, top = bot - (p.tall ? 86 : 78), cx = x0 + w / 2;
    /* the brick arch over the window, then the glass under it */
    g.fillStyle = tone(0.62); g.beginPath(); g.ellipse(cx, top, w / 2 + 7, 15, 0, PI, 2 * PI); g.fill(); g.fillRect(x0 - 7, top - 1, w + 14, 3);
    const glass = g.createLinearGradient(0, top - 10, 0, bot); glass.addColorStop(0, '#5d6b78'); glass.addColorStop(0.45, '#26303a'); glass.addColorStop(1, '#161c22');
    g.fillStyle = glass; g.beginPath(); g.moveTo(x0, bot); g.lineTo(x0, top); g.ellipse(cx, top, w / 2, 9, 0, PI, 2 * PI); g.lineTo(x0 + w, bot); g.closePath(); g.fill();
    g.strokeStyle = p.frame; g.lineWidth = 5; g.stroke();
    g.lineWidth = 2; g.beginPath();
    for (const f of [1 / 3, 2 / 3]) { g.moveTo(x0 + w * f, top - 6); g.lineTo(x0 + w * f, bot); }
    for (const f of [0.25, 0.5, 0.75]) { const y = top + (bot - top) * f; g.moveTo(x0, y); g.lineTo(x0 + w, y); }
    g.stroke();
    g.fillStyle = '#cdc3ae'; g.fillRect(x0 - 8, bot, w + 16, 6);
    if (rnd() < lit) { ge.fillStyle = rnd() > 0.3 ? '#ffc98a' : '#fff0d0'; ge.beginPath(); ge.moveTo(x0, bot); ge.lineTo(x0, top); ge.ellipse(cx, top, w / 2, 9, 0, PI, 2 * PI); ge.lineTo(x0 + w, bot); ge.closePath(); ge.fill(); }
  }
  /* a stone band at every floor line, and weathering running down from the sills */
  g.fillStyle = tone(0.7); for (let r = 0; r < 4; r++) g.fillRect(0, S - r * B - 3, S, 3);
  g.globalAlpha = 0.08; for (let i = 0; i < 40; i++) { g.fillStyle = rnd() > 0.5 ? '#000' : '#fff'; g.fillRect(rnd() * S, rnd() * S, 2 + rnd() * 6, 20 + rnd() * 60); } g.globalAlpha = 1;
  const tex = (cv: HTMLCanvasElement, srgb: boolean) => { const t = new T.CanvasTexture(cv); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = T.SRGBColorSpace; return t; };
  const s: X.Surface = { map: tex(c, true), emissiveMap: tex(e, true) };
  loftCache.set(key, s);
  return s;
}

/* ---------------- 149 WASHINGTON STREET ---------------- */
export const dumbo: RoomDef = {
  id: 'dumbo',
  name: 'Washington Street',
  area: 'DUMBO / WASHINGTON STREET',
  mood: 'Everybody stops for the same picture',
  color: '#b0533a',
  description: 'The corner of Washington and Water in DUMBO, where the old warehouse street runs down to the East River and the Manhattan Bridge tower stands at the end of it with the Empire State Building caught between its legs. Trains rumble across overhead, Jane\'s Carousel turns in its glass box at the water, and somebody is always in the middle of the cobbles taking the picture. The New Yorkers hang on the brick under the old loading dock canopies, where a gallery in this neighbourhood would hang them.',
  signatures: 'The Belgian block cobbles with the old Jay Street rails, red brick warehouse lofts with arched windows and steel canopies on both sides, the blue steel Manhattan Bridge tower and its trussed deck, B D N and Q trains crossing, the Empire State Building framed in the gap, Jane\'s Carousel in its Jean Nouvel pavilion, Brooklyn Bridge Park, the East River, the Brooklyn Bridge to the west and the photographers in the street.',
  build(k, ctx) {
    k.sky({ top: 0x4f86d0, horizon: 0xcfdcea, ground: 0x7a746c, fog: 0.0006, sun: { az: 3.7, el: 0.7, color: 0xfff2dc, size: 8 }, env: 0.75 });
    k.hemi(0xd6e4ff, 0x8a8478, 1.2);
    k.sun(0xfff0d8, 2.3, 50, 110, 40, true, 90);
    const cobble = k.pbr('dCobble', X.cobble(0x6c655e, 149), 0.42, { roughness: 0.95 }), walk = k.pbr('dWalk', X.concrete(0xa8a298, 150), 0.35),
      granite = k.pbr('dGranite', X.ashlar(0x9a958c, 151, 3), 0.3), pave = k.pbr('dPave', X.pavers(0x9c968a, 152), 0.5), grass = k.pbr('dGrass', X.grass(0x4d6c3c, 153), 0.3, { roughness: 1 }),
      loftA = k.pbr('dLoftA', loftSurface('a', { brick: 0x8a3e2c, frame: '#1f2a24', seed: 11 }), 1 / 16, { emissive: 0xffffff, emissiveIntensity: 0.02 + 0.3 * k.night, roughness: 0.9 }),
      loftB = k.pbr('dLoftB', loftSurface('b', { brick: 0x9a5a3e, frame: '#e8e2d2', seed: 12, tall: true }), 1 / 16, { emissive: 0xffffff, emissiveIntensity: 0.02 + 0.3 * k.night, roughness: 0.9 }),
      loftC = k.pbr('dLoftC', loftSurface('c', { brick: 0x6e3226, frame: '#3a4a3a', seed: 13 }), 1 / 16, { emissive: 0xffffff, emissiveIntensity: 0.02 + 0.3 * k.night, roughness: 0.9 }),
      loftD = k.pbr('dLoftD', loftSurface('d', { brick: 0xa8704e, frame: '#20242a', seed: 14, tall: true }), 1 / 16, { emissive: 0xffffff, emissiveIntensity: 0.02 + 0.3 * k.night, roughness: 0.9 }),
      cornice = k.flat(0x3a332e, 0.2, 0.8), canopy = k.flat(0x1c1f22, 0.6, 0.5), iron = k.flat(0x22262a, 0.6, 0.45), rail = k.flat(0x6a625a, 0.85, 0.4),
      blue = k.flat(0x7fa6c4, 0.45, 0.5), blueDark = k.flat(0x5f86a6, 0.45, 0.55), stone = k.pbr('dPier', X.ashlar(0x8f877a, 154, 5), 0.2), cable = k.flat(0x55626e, 0.6, 0.5),
      glass = k.glass(0xdcecf4, 0.16, 0.05), white = k.flat(0xf0ece2, 0, 0.6), dark = k.flat(0x14171b, 0.3, 0.6), gilt = k.pbr('dGilt', X.gilt(), 2, { metalness: 0.85, roughness: 0.32 }),
      cream = k.flat(0xf2e6c8, 0.05, 0.5, { side: T.DoubleSide }), gold = k.flat(0xc9a25a, 0.9, 0.35);

    /* the street: Belgian block from wall to wall, granite curbs, bluestone sidewalks */
    k.box(260, 0.3, 190, 0, -0.15, -5, cobble);
    for (const s of [-1, 1]) {
      for (const [z0, z1] of [[8, 60], [-55, -8]]) { k.box(3, 0.14, z1 - z0, s * 7.5, 0.07, (z0 + z1) / 2, walk); k.box(0.3, 0.16, z1 - z0, s * 6.1, 0.08, (z0 + z1) / 2, granite); }
      k.box(71, 0.14, 2.4, s * 44.5, 0.07, 7.2, walk); k.box(71, 0.14, 2.4, s * 44.5, 0.07, -7.2, walk); k.box(71, 0.14, 2.4, s * 44.5, 0.07, -56.2, walk);
    }
    /* the Jay Street Connecting Railroad, still in the cobbles: along Plymouth and curving up Washington */
    for (const g of [-0.72, 0.72]) {
      k.curve([v(-80, 0.02, -60 + g), v(-20, 0.02, -60 + g), v(-4, 0.02, -58 + g), v(0 + g, 0.02, -46), v(0 + g, 0.02, -20), v(0 + g, 0.02, 6)], 0.055, rail, 90);
      k.curve([v(-4, 0.02, -58 + g), v(20, 0.02, -60 + g), v(80, 0.02, -60 + g)], 0.055, rail, 40);
    }
    /* the lofts: brick boxes with the facade painted on, a cornice, a steel loading dock canopy at the street */
    const loft = (x0: number, x1: number, z0: number, z1: number, h: number, m: T.Material, canopies: ('e' | 'w' | 'n' | 's')[] = []) => {
      k.box(x1 - x0, h, z1 - z0, (x0 + x1) / 2, h / 2, (z0 + z1) / 2, m);
      k.box(x1 - x0 + 0.7, 0.9, z1 - z0 + 0.7, (x0 + x1) / 2, h - 0.2, (z0 + z1) / 2, cornice);
      k.box(x1 - x0 - 0.4, 0.3, z1 - z0 - 0.4, (x0 + x1) / 2, h + 0.1, (z0 + z1) / 2, dark);
      for (const c of canopies) {
        if (c === 'e') k.box(2.2, 0.16, z1 - z0 - 2, x1 + 1.1, 4.6, (z0 + z1) / 2, canopy);
        if (c === 'w') k.box(2.2, 0.16, z1 - z0 - 2, x0 - 1.1, 4.6, (z0 + z1) / 2, canopy);
        if (c === 'n') k.box(x1 - x0 - 2, 0.16, 2.2, (x0 + x1) / 2, 4.6, z0 - 1.1, canopy);
        if (c === 's') k.box(x1 - x0 - 2, 0.16, 2.2, (x0 + x1) / 2, 4.6, z1 + 1.1, canopy);
      }
      k.block(x0 - 0.2, x1 + 0.2, z0 - 0.2, z1 + 0.2);
    };
    /* north of Water Street, the block that frames the picture */
    loft(-80, -9, -31, -8, 30, loftA, ['e', 's']);
    loft(-80, -9, -55, -31, 24, loftD, ['e', 'n']);
    loft(9, 80, -30, -8, 34, loftB, ['w', 's']);
    loft(9, 80, -55, -30, 27, loftC, ['w', 'n']);
    /* south of Water Street, behind the visitor */
    loft(-80, -9, 8, 60, 26, loftC, ['n']);
    loft(9, 80, 8, 60, 22, loftA, ['n']);
    /* the far ends of Water Street and the corners of the park */
    loft(-120, -80, -30, 40, 20, loftB); loft(80, 120, -30, 40, 24, loftD);
    loft(30, 80, -100, -66, 18, loftA);
    /* the ground floors, painted dark the way the galleries and shops on this street paint them, with a shop window here and there */
    {
      const band = k.pbr('dBand', X.brick(0x2a2c2e, 157), 0.9, { roughness: 0.7 }), shop = k.glass(0x3a4a55, 0.85, 0.06);
      for (const sx of [-1, 1]) {
        for (const [z0, z1] of [[-55, -8], [8, 60]]) k.box(0.1, 4.5, z1 - z0, sx * 8.96, 2.25, (z0 + z1) / 2, band);
        for (const zf of [-7.94, 7.94, -55.06]) k.box(71, 4.5, 0.1, sx * 44.5, 2.25, zf, band);
        for (const z of [-30, -52, 20, 34, 48]) k.box(0.06, 3.0, 3.2, sx * 8.9, 1.9, z, shop);
        for (const x of [36, 50, 64]) k.box(3.2, 3.0, 0.06, sx * x, 1.9, -7.9, shop);
      }
      if (k.night > 0.3) for (const [x, z] of [[-8.4, -30], [8.4, -52], [-8.4, 34], [8.4, 20]]) k.point(x, 2.4, z, 0xffd6a0, 30, 7);
    }
    /* the canopies hang from tie rods, so the sidewalk under them stays clear */
    for (const s of [-1, 1]) for (let z = -52; z <= -11; z += 6.8) k.beam(v(s * 9, 7.2, z), v(s * 6.95, 4.66, z), 0.035, canopy, 5);
    /* the park at the water: lawn, granite, the rail at the edge, trees */
    k.box(128, 0.12, 34, 5, 0.06, -83, pave);
    k.box(22, 0.14, 16, 6, 0.08, -80, grass); k.box(14, 0.14, 12, 22, 0.08, -86, grass);
    k.box(160, 3.2, 3, 0, -1.5, -101.5, granite);
    for (let x = -64; x <= 64; x += 2) k.box(0.08, 1.1, 0.08, x, 0.55, -100.4, iron);
    k.box(130, 0.08, 0.12, 0, 1.12, -100.4, iron); k.box(130, 0.05, 0.05, 0, 0.6, -100.4, iron);
    k.block(-90, 90, -110, -100.1);
    { const rnd = X.mulberry(2007); for (const [x, z] of [[14, -72], [22, -76], [18, -92], [26, -86], [-10, -96], [-13, -68]]) k.tree(x, 0, z, { h: 7 + rnd() * 3, r: 3 + rnd() * 1.4, kind: 'round', seed: x * 3 + z, leaf: 0x46703a }); }
    for (const [x, z] of [[14, -72], [22, -76], [18, -92], [26, -86], [-10, -96], [-13, -68]]) k.keepOut.push({ x, z, r: 0.7 });
    for (const [x, z, ry] of [[0, -97, 0], [8, -97, 0], [18, -97, 0], [-10, -97, 0]]) k.bench(x, z, ry, k.flat(0x6a4a32, 0, 0.8), iron, 2.2);
    for (const [x, z] of [[-7.9, 20], [7.9, 36], [-7.9, -20], [7.9, -42], [-7.9, -50], [12, -68], [-18, -68], [26, -96]]) k.lamp(x, z, 4.6, iron, 0xffd7a0, k.night > 0.5 ? 60 : 12);
    /* street signs at the corner */
    k.cyl(0.06, 3.6, 7.6, 1.8, 7.6, k.flat(0x2a5a3a, 0.4, 0.5));
    k.sign('WASHINGTON ST', 1.9, 0.3, 7.6, 3.3, 7.6, '#1f6b3a', '#ffffff', 110, PI / 2, { double: true });
    k.sign('WATER ST', 1.4, 0.3, 7.6, 3.62, 7.6, '#1f6b3a', '#ffffff', 150, 0, { double: true });

    /* ---- the Manhattan Bridge: Brooklyn tower in the river at the end of the street, deck, cables ---- */
    const TH = 0.35, cs = Math.cos(TH), sn = Math.sin(TH), TX = 0, TZ = -178;
    const W = (lx: number, ly: number, lz: number) => v(TX + lx * cs + lz * sn, ly, TZ - lx * sn + lz * cs);
    const tb = (w: number, h: number, d: number, lx: number, ly: number, lz: number, m: T.Material) => { const p = W(lx, ly, lz); const o = k.box(w, h, d, p.x, p.y, p.z, m); o.rotation.y = TH; return o; };
    const DECK = 40, LOW = 31, ZM = -451, ZB = 230, ZMA = -690;
    for (const tz of [0, ZM]) {
      tb(46, 9, 16, 0, 2.5, tz, stone);
      for (const s of [-1, 1]) {
        tb(5.2, 44, 8.4, s * 17, 22, tz, blue);
        tb(4.2, 56, 6.6, s * 17, 72, tz, blue);
        tb(0.5, 52, 7.0, s * 17 + s * 2.2, 72, tz, blueDark);
        tb(5.6, 3, 8.6, s * 17, 44.5, tz, blueDark);
        /* the crown over each leg: saddle house, arched cap, ball finial */
        tb(6, 5, 8.4, s * 17, 101, tz, blueDark);
        const f = W(s * 17, 106.5, tz); k.sphere(1.5, f.x, f.y, f.z, blue, 12); k.cyl(0.9, 2.5, f.x, 104.5, f.z, blueDark, 1.4, 10);
      }
      /* the bracing between the legs above the deck; below it the tower is open, which is where the Empire State Building shows */
      for (const y of [48, 64, 80, 96]) tb(30, 1.6, 2.2, 0, y, tz, blueDark);
      for (const [y0, y1] of [[48, 64], [64, 80], [80, 96]]) for (const s of [-1, 1]) {
        const a = W(-15 * s, y0, tz), b = W(15 * s, y1, tz); k.bar(a, b, 0.9, 1.4, blue);
      }
      tb(30, 5, 2.4, 0, 92, tz, blue);
    }
    /* four stiffening trusses, the roadway and the lower level where the trains run */
    const TRX = [-19, -9.5, 9.5, 19], L0 = ZMA, L1 = ZB;
    for (const lx of TRX) { tb(0.9, 0.9, L1 - L0, lx, DECK, (L0 + L1) / 2, blueDark); tb(0.9, 0.9, L1 - L0, lx, LOW, (L0 + L1) / 2, blueDark); }
    tb(38, 0.6, L1 - L0, 0, DECK - 0.4, (L0 + L1) / 2, k.flat(0x4a525a, 0.3, 0.8));
    tb(38, 0.5, L1 - L0, 0, LOW + 0.2, (L0 + L1) / 2, k.flat(0x5a6670, 0.3, 0.8));
    {
      const NT = Math.floor((L1 - L0) / 7.5), n = NT * TRX.length;
      const diag = k.instances(new T.BoxGeometry(0.45, 1, 0.45), blue, Array.from({ length: n * 2 }, () => new T.Matrix4()));
      const m = new T.Matrix4(), q = new T.Quaternion(), s = new T.Vector3(), up = new T.Vector3(0, 1, 0);
      let i = 0;
      for (const lx of TRX) for (let j = 0; j < NT; j++) {
        const z0 = L0 + j * 7.5, z1 = z0 + 7.5, flip = j % 2 === 0;
        const a = W(lx, flip ? LOW : DECK, z0), b = W(lx, flip ? DECK : LOW, z1);
        q.setFromUnitVectors(up, b.clone().sub(a).normalize()); s.set(1, a.distanceTo(b), 1); m.compose(a.clone().add(b).multiplyScalar(0.5), q, s); diag.setMatrixAt(i++, m);
        const c = W(lx, (LOW + DECK) / 2, z0); q.identity(); s.set(1, DECK - LOW, 1); m.compose(c, q, s); diag.setMatrixAt(i++, m);
      }
      diag.instanceMatrix.needsUpdate = true;
    }
    /* the main cables and their suspenders */
    const cabY = (lz: number) => {
      if (lz > 0) return 97 - (lz / ZB) * 50;
      if (lz < ZM) return 97 - ((ZM - lz) / (ZM - ZMA)) * 50;
      const u = lz / ZM; return 45 + 52 * Math.pow(2 * u - 1, 2);
    };
    const CX = [-17.6, -16.4, 16.4, 17.6];
    for (const lx of CX) { const pts: T.Vector3[] = []; for (let lz = ZB; lz >= ZMA; lz -= 15) pts.push(W(lx, cabY(lz), lz)); k.curve(pts, 0.42, cable, 140); }
    {
      const zs: number[] = []; for (let lz = ZB - 8; lz > ZMA + 8; lz -= 7.5) if (Math.abs(lz) > 5 && Math.abs(lz - ZM) > 5) zs.push(lz);
      const sus = k.instances(new T.CylinderGeometry(0.07, 0.07, 1, 4), cable, Array.from({ length: zs.length * 2 }, () => new T.Matrix4()));
      const m = new T.Matrix4(), s = new T.Vector3(); let i = 0;
      for (const lz of zs) for (const lx of [-17, 17]) { const top = cabY(lz), h = top - DECK; s.set(1, h, 1); m.compose(W(lx, DECK + h / 2, lz), new T.Quaternion(), s); sus.setMatrixAt(i++, m); }
      sus.instanceMatrix.needsUpdate = true;
    }
    /* at night the necklace: a lamp every fifteen metres along the outer cables */
    if (k.night > 0.3) {
      const pts: T.Vector3[] = []; for (const lx of [-17.6, 17.6]) for (let lz = ZB - 10; lz > ZMA + 10; lz -= 15) pts.push(W(lx, cabY(lz) + 0.5, lz));
      k.instances(new T.SphereGeometry(0.45, 6, 5), k.glow(0xfff2d0), pts.map((p) => new T.Matrix4().setPosition(p)));
    }
    /* the Brooklyn anchorage, granite, off to the right behind the lofts */
    { const a = W(0, 22, ZB + 12); const o = k.box(50, 48, 36, a.x, a.y - 2, a.z, stone); o.rotation.y = TH; }
    /* ---- the river, Manhattan, the Empire State Building in the gap, the Brooklyn Bridge to the west ---- */
    { const w = k.water({ y: -2, color: 0x2f4d5e, w: 1500, d: 1000, x: 0, z: -600, amp: 0.45 }); const wm = w.material as T.MeshStandardMaterial; wm.metalness = 0.08; wm.roughness = 0.32; wm.envMapIntensity = 0.35; }
    k.skyline({ z: -640, count: 44, spacing: 13, scale: 1.1, base: -2, x: -120, seed: 9, lit: 0.25, tint: 0x4e5258, rows: 2 });
    k.skyline({ z: -610, count: 16, spacing: 12, scale: 2.3, base: -2, x: -520, seed: 4, lit: 0.3, tint: 0x46505a, rows: 2 });
    {
      const esb = k.pbr('dEsb', X.windows(33, 0.2, 0x6e6a62, true), 0.3, { emissive: 0xffffff, emissiveIntensity: 0.1 + 1.6 * k.night, roughness: 0.7, stretch: 0.6 }), mast = k.flat(0x77736a, 0.5, 0.5);
      /* true to its proportions, scaled so all of it sits under the lower deck the way it does in the photograph */
      const EX = 8, EZ = -960, B0 = -2, f = 0.235;
      const tier = (w: number, d: number, y0: number, y1: number) => k.box(w * f, (y1 - y0) * f, d * f, EX, B0 + ((y0 + y1) / 2) * f, EZ, esb);
      tier(94, 62, 0, 25); tier(58, 40, 25, 320); tier(46, 32, 320, 340); tier(36, 25, 340, 352); tier(26, 19, 352, 373);
      k.cyl(8 * f, 12 * f, EX, B0 + 379 * f, EZ, mast, 11 * f, 12);
      k.cyl(2.4 * f, 36 * f, EX, B0 + 403 * f, EZ, mast, 6 * f, 10);
      k.cyl(0.6 * f, 22 * f, EX, B0 + 432 * f, EZ, mast, 1.6 * f, 6);
      if (k.night > 0.3) { k.box(27 * f, 22 * f, 20 * f, EX, B0 + 362 * f, EZ, k.glow(0xffd9a0, 0.5)); }
    }
    {
      /* the Brooklyn Bridge: a granite tower with two pointed arches, its cables sweeping to Manhattan */
      const bb = k.pbr('dBb', X.ashlar(0xb5a48a, 155, 6), 0.12);
      const BX = -420, BZ = -150;
      k.box(42, 84, 34, BX, 40, BZ, bb).rotation.y = TH;
      for (const s of [-1, 1]) { const o = k.box(12, 36, 36, BX + s * 9.4 * cs, 58, BZ - s * 9.4 * sn, k.flat(0x2a3440, 0, 0.9)); o.rotation.y = TH; }
      k.box(44, 5, 36, BX, 83, BZ, k.flat(0x8f8068, 0, 0.9)).rotation.y = TH;
      for (const lx of [-18, 18]) { const pts: T.Vector3[] = []; for (let i = 0; i <= 20; i++) { const u = i / 20, lz = -u * 486; pts.push(v(BX + lx * cs + lz * sn, 45 + 38 * Math.pow(2 * u - 1, 2), BZ - lx * sn + lz * cs)); } k.curve(pts, 0.5, cable, 40); }
      const deckC = v(BX - 243 * sn, 38, BZ - 243 * cs); k.box(26, 3, 700, deckC.x, deckC.y, deckC.z + 60, k.flat(0x3a3a3c, 0.3, 0.8)).rotation.y = TH;
    }
    /* ---- Jane's Carousel in its glass box at the water ---- */
    const CXp = -28, CZp = -82;
    k.box(24, 0.4, 24, CXp, 0.2, CZp, granite);
    k.box(24.6, 0.5, 24.6, CXp, 9.25, CZp, k.flat(0x2a2d31, 0.4, 0.6));
    k.box(23.6, 0.1, 23.6, CXp, 8.97, CZp, k.flat(0x8a8680, 0.2, 0.8));
    for (const s of [-1, 1]) { k.plane(23.2, 8.6, CXp, 4.7, CZp + s * 11.6, glass, s > 0 ? 0 : PI); k.plane(23.2, 8.6, CXp + s * 11.6, 4.7, CZp, glass, s * PI / 2); }
    for (let i = 0; i <= 8; i++) { const o = -11.6 + i * 2.9; for (const s of [-1, 1]) { k.box(0.1, 8.6, 0.14, CXp + o, 4.7, CZp + s * 11.6, iron); k.box(0.14, 8.6, 0.1, CXp + s * 11.6, 4.7, CZp + o, iron); } }
    k.block(CXp - 12.2, CXp + 12.2, CZp - 12.2, CZp + 12.2);
    const rig = new T.Group(); rig.position.set(CXp, 0.4, CZp); k.add(rig);
    {
      const PR = 7.2, planks = k.pbr('dPlank', X.planks(0x8a6a44, 8, 156), 0.9, { roughness: 0.55 });
      const plat = new T.Mesh(new T.CylinderGeometry(PR, PR, 0.36, 40), planks); plat.position.y = 0.2; rig.add(plat);
      const rim = new T.Mesh(new T.CylinderGeometry(PR + 0.06, PR + 0.06, 0.4, 40, 1, true), gilt); rim.position.y = 0.2; rig.add(rim);
      const horseGeo = mergeGeometries([
        part(1.3, 0.48, 0.4, 0, 1.0, 0), part(0.48, 0.58, 0.26, 0.6, 1.38, 0, -0.6), part(0.48, 0.22, 0.22, 0.95, 1.6, 0, 0.25),
        part(0.12, 0.6, 0.12, 0.48, 0.52, 0.13, 0.55), part(0.12, 0.6, 0.12, 0.48, 0.52, -0.13, 0.55),
        part(0.12, 0.6, 0.12, -0.48, 0.52, 0.13, -0.55), part(0.12, 0.6, 0.12, -0.48, 0.52, -0.13, -0.55), part(0.5, 0.12, 0.1, -0.85, 1.1, 0, 0.5),
      ])!;
      const rows = [6.2, 5.0, 3.8], per = [18, 16, 14], NH = 48;
      const horses = new T.InstancedMesh(horseGeo, new T.MeshStandardMaterial({ roughness: 0.45 }), NH);
      const poles = new T.InstancedMesh(new T.CylinderGeometry(0.035, 0.035, 4.6, 6), gold, NH);
      const riders = new T.InstancedMesh(figureGeo(0.13, 0.38, 0.86), new T.MeshStandardMaterial({ roughness: 0.85 }), NH);
      for (const o of [horses, poles, riders]) { o.frustumCulled = false; rig.add(o); }
      const rnd = X.mulberry(1922), c = new T.Color(), coats = [0xf4f0e8, 0xe8d8b8, 0xd8b070, 0x8a8a90, 0x1c1a1c, 0xf0e6d0], shirts = [0xe83a5a, 0x3a8ae8, 0xf0d24a, 0x2a2a34, 0xe8e2d4, 0x8a4ad8];
      const hs: { a: number; r: number; jump: boolean; ph: number; rider: boolean }[] = [];
      let i = 0;
      rows.forEach((r, ri) => { for (let j = 0; j < per[ri]; j++) { const stand = i % 8 === 0 || i % 8 === 3 || i % 8 === 5; hs.push({ a: (j / per[ri]) * PI * 2 + ri * 0.13, r, jump: !stand, ph: rnd() * 6.3, rider: rnd() > 0.5 }); horses.setColorAt(i, c.set(coats[i % coats.length])); riders.setColorAt(i, c.set(shirts[Math.floor(rnd() * shirts.length)])); i++; } });
      if (horses.instanceColor) horses.instanceColor.needsUpdate = true; if (riders.instanceColor) riders.instanceColor.needsUpdate = true;
      const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), up = new T.Vector3(0, 1, 0), hide = new T.Vector3(0.0001, 0.0001, 0.0001);
      hs.forEach((h, j) => { q.setFromAxisAngle(up, -h.a - PI / 2); p.set(Math.cos(h.a) * h.r, 2.6, Math.sin(h.a) * h.r); m.compose(p, q, one); poles.setMatrixAt(j, m); });
      poles.instanceMatrix.needsUpdate = true;
      const place = (t: number) => {
        hs.forEach((h, j) => {
          q.setFromAxisAngle(up, -h.a - PI / 2); p.set(Math.cos(h.a) * h.r, 0.4 + (h.jump ? 0.3 * Math.sin(t * 2.6 + h.ph) : 0), Math.sin(h.a) * h.r);
          m.compose(p, q, one); horses.setMatrixAt(j, m); p.y += 1.38; m.compose(p, q, h.rider ? one : hide); riders.setMatrixAt(j, m);
        });
        horses.instanceMatrix.needsUpdate = riders.instanceMatrix.needsUpdate = true;
      };
      place(0);
      const cone = new T.Mesh(new T.CylinderGeometry(0.4, 8.3, 2.2, 24, 1, true), cream); cone.position.y = 5.6; rig.add(cone);
      const board = new T.Mesh(new T.CylinderGeometry(8.35, 8.35, 0.9, 32, 1, true), cream); board.position.y = 4.4; rig.add(board);
      for (const y of [3.95, 4.85]) { const tr = new T.Mesh(new T.TorusGeometry(8.37, 0.05, 6, 64), gilt); tr.rotation.x = PI / 2; tr.position.y = y; rig.add(tr); }
      const NB = 80, bulbs = new T.InstancedMesh(new T.SphereGeometry(0.09, 6, 5), new T.MeshBasicMaterial({ color: 0xffe0a0 }), NB);
      { const mm = new T.Matrix4(); for (let j = 0; j < NB; j++) { const a = (j / NB) * PI * 2; mm.setPosition(Math.cos(a) * 8.42, 4.4, Math.sin(a) * 8.42); bulbs.setMatrixAt(j, mm); } }
      bulbs.frustumCulled = false; rig.add(bulbs);
      const drum = new T.Mesh(new T.CylinderGeometry(2.1, 2.1, 3.8, 16), k.flat(0xb8322a, 0.1, 0.5)); drum.position.y = 2.2; rig.add(drum);
      if (!ctx.reduced) k.ticks.push((t) => { rig.rotation.y = t * 0.33; place(t); });
      k.point(CXp, 6.4, CZp, 0xffe4b8, k.night > 0.5 ? 110 : 25, 18);
    }
    /* ---- the trains: B, D, N and Q on the lower level, one each way ---- */
    const mkTrain = (lx: number, dir: number, off: number) => {
      const g = new T.Group(), bodies: T.BufferGeometry[] = [], wins: T.BufferGeometry[] = [];
      for (let i = 0; i < 8; i++) { const z = i * 18.6; bodies.push(part(3.0, 3.5, 18, 0, 1.75, z)); wins.push(part(3.04, 0.95, 16.6, 0, 2.3, z)); }
      g.add(new T.Mesh(mergeGeometries(bodies)!, k.flat(0xc8ccd0, 0.8, 0.35)));
      g.add(new T.Mesh(mergeGeometries(wins)!, k.flat(0x1a2028, 0.3, 0.3)));
      const lamp = new T.Mesh(new T.BoxGeometry(2.2, 0.3, 0.1), k.glow(0xfff2c8)); lamp.position.set(0, 1.2, dir > 0 ? -9.05 : 9.05 + 7 * 18.6); g.add(lamp);
      g.rotation.y = TH; k.add(g);
      const span = ZB + 60 - (ZMA - 160), len = 8 * 18.6;
      const place = (t: number) => {
        const u = ((t * 16 + off) % span + span) % span;
        const lz = dir > 0 ? ZB + 60 - u : ZMA - 160 + u - len;
        const p = W(lx, LOW + 0.5, lz); g.position.copy(p);
        g.visible = lz < ZB + 20 && lz + len > ZMA;
      };
      place(0);
      if (!ctx.reduced) k.ticks.push(place);
    };
    mkTrain(14.2, 1, 0); mkTrain(-14.2, -1, 300);
    /* ---- a ferry on the river, gulls over the water ---- */
    if (!ctx.reduced) {
      const f = new T.Group();
      const hull = new T.Mesh(new T.BoxGeometry(8, 2.4, 26), k.flat(0xf2f2ee, 0.1, 0.5)); hull.position.y = 1.2; f.add(hull);
      const band = new T.Mesh(new T.BoxGeometry(8.05, 0.5, 26.05), k.flat(0x1f5aa8, 0.1, 0.5)); band.position.y = 0.6; f.add(band);
      const cabin = new T.Mesh(new T.BoxGeometry(6.6, 2.4, 16), k.flat(0xe8ecef, 0.1, 0.5)); cabin.position.set(0, 3.6, -1); f.add(cabin);
      const win = new T.Mesh(new T.BoxGeometry(6.7, 0.9, 15), k.flat(0x1a2530, 0.4, 0.2)); win.position.set(0, 3.9, -1); f.add(win);
      const top = new T.Mesh(new T.BoxGeometry(4, 1.2, 5), k.flat(0xf08a2a, 0.1, 0.5)); top.position.set(0, 5.4, 2); f.add(top);
      k.add(f);
      k.rider(f, k.spline([v(-500, -2, -250), v(0, -2, -262), v(500, -2, -250), v(520, -2, -300), v(0, -2, -312), v(-520, -2, -300)], true), 7, 200);
      const NG = 14, gulls = k.instances(mergeGeometries([part(1.4, 0.05, 0.3, 0, 0, 0), part(0.2, 0.18, 0.5, 0, 0, 0)])!, k.flat(0xf4f4f0, 0, 0.8), Array.from({ length: NG }, () => new T.Matrix4()));
      gulls.frustumCulled = false;
      const gs = Array.from({ length: NG }, (_, i) => ({ cx: -30 + (i % 5) * 18, cz: -120 - (i % 3) * 30, r: 10 + (i % 4) * 5, h: 18 + (i % 6) * 4, w: 0.2 + (i % 3) * 0.06, ph: i * 1.3 }));
      const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), e = new T.Euler();
      k.ticks.push((t) => { gs.forEach((g, i) => { const a = t * g.w + g.ph; p.set(g.cx + Math.cos(a) * g.r, g.h + Math.sin(t * 0.7 + i), g.cz + Math.sin(a) * g.r); e.set(0, -a, 0.3 * Math.sin(t * 5 + i)); q.setFromEuler(e); m.compose(p, q, one); gulls.setMatrixAt(i, m); }); gulls.instanceMatrix.needsUpdate = true; });
    }
    /* ---- the people: the picture takers in the middle of the street, a couple in their wedding clothes, everyone else walking ---- */
    const phone = k.flat(0x101214, 0.5, 0.3);
    for (const [x, z, c] of [[-1.6, -2.5, 0x2a2a34], [1.3, -4.2, 0xe8e2d4], [0.2, -6.0, 0x8a3a3a], [-2.9, -5.2, 0x33477f], [2.8, -1.8, 0x151517], [-0.6, -9.5, 0xc9a25a]] as [number, number, number][]) {
      figure(k, x, 0, z, c, { rotY: 0 });
      k.box(0.08, 0.15, 0.015, x + 0.05, 1.42, z - 0.3, phone);
      k.keepOut.push({ x, z, r: 0.5 });
    }
    { /* the couple, and their photographer crouched in front of them */
      const x = 1.4, z = -21;
      k.mesh(new T.ConeGeometry(0.62, 1.35, 16), k.flat(0xf6f4ee, 0, 0.7), x, 0.68, z); k.mesh(new T.CapsuleGeometry(0.17, 0.35, 3, 8), k.flat(0xf6f4ee, 0, 0.7), x, 1.45, z); k.sphere(0.12, x, 1.8, z, k.flat(0xe9c2a0, 0, 0.7), 10);
      figure(k, x + 0.62, 0, z, 0x16181c, { skin: 0x8d5a3b });
      figure(k, x + 0.3, 0, z + 4.2, 0x2a2a34, { crouch: 0.62 }); k.box(0.16, 0.12, 0.12, x + 0.3, 1.0, z + 3.9, phone);
      for (const [px, pz, r] of [[x, z, 0.8], [x + 0.62, z, 0.5], [x + 0.3, z + 4.2, 0.6]]) k.keepOut.push({ x: px, z: pz, r });
    }
    if (!ctx.reduced) {
      k.crowd([v(-7.4, 0.14, 40), v(-7.4, 0.14, -10), v(-7.4, 0.14, -54), v(-10, 0.1, -62), v(-2, 0.1, -72), v(8, 0.1, -95)], 16, { seed: 149, speed: 0.9, spread: 1.4 });
      k.crowd([v(7.4, 0.14, 40), v(7.4, 0.14, -10), v(7.4, 0.14, -54), v(12, 0.1, -64), v(28, 0.1, -66)], 14, { seed: 150, speed: 0.85, spread: 1.4 });
      k.crowd([v(-70, 0.1, 7.2), v(-10, 0.1, 7.2), v(10, 0.1, 5), v(70, 0.1, 7.2)], 12, { seed: 151, speed: 1.0, spread: 1.2 });
      k.crowd([v(-44, 0.1, -64), v(-14, 0.1, -66), v(0, 0.1, -96), v(-44, 0.1, -97)], 14, { seed: 152, speed: 0.7, spread: 2.2, closed: true });
    }
    /* ---- the works: on the brick under the canopies, and on the Water Street corners ---- */
    const mounts: Mount[] = [];
    const M = (x: number, z: number, rot: number, w = 2.6, h = 1.8, y = 2.55) => mounts.push({ position: v(x, y, z), rotation: rot, target: v(x + Math.sin(rot) * 3.4, 2.6, z + Math.cos(rot) * 3.4), width: w, height: h, style: 'black', wash: true });
    for (const z of [-14, -21.5, -38, -46]) { M(-8.78, z, PI / 2); M(8.78, z, -PI / 2); }
    for (const x of [-15, -24, 15, 24]) M(x, -7.78, 0);
    for (const x of [-16, 16]) M(x, 7.78, PI);
    for (const x of [16, 24]) M(x, -55.22, PI);
    k.censusWall({ x: -24, y: 2.6, z: -55.22, rotY: PI, cols: 16, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(3400, 64), pieces: ctx.all, backing: dark });
    /* ---- what the street knows ---- */
    const src = { name: 'DUMBO, Brooklyn, Wikipedia', url: 'https://en.wikipedia.org/wiki/Dumbo,_Brooklyn' };
    k.egg(v(7.6, 3.3, 7.6), { id: 'dumbo-1978', title: 'A name to keep the developers away', year: '1978', text: 'The acronym arose in 1978, Down Under the Manhattan Bridge Overpass, coined by new residents who believed such an unattractive name would help deter developers. The neighbourhood became the city\'s 90th historic district on December 18, 2007.', clue: 'Read the street sign and ask who named the neighbourhood, and why they wanted it to sound bad.', source: src }, { r: 1.6 });
    k.egg(v(-9.2, 7.5, -44), { id: 'gair-box', title: 'The cardboard box', text: 'The cardboard box was invented in the Robert Gair building on Washington Street by Robert Gair, a Scottish emigrant. Because of his fame the area was known for a long time as Gairsville.', clue: 'Every parcel on every doorstep in the city starts on this street.', source: src }, { r: 3 });
    k.egg(v(0, 0.3, -40), { id: 'jay-street-rails', title: 'The rails in the cobbles', year: '1957', text: 'The Jay Street Connecting Railroad ran from yards under the Manhattan and Brooklyn Bridges to the buildings near the waterfront here from around 1904 until 1957. The city finished a 108 million dollar rehabilitation of the cobblestone streets of DUMBO and Vinegar Hill in 2025.', clue: 'Look down: something ran on this street before the cars did.', source: src }, { r: 2.6 });
    { const e = W(0, 70, 0); k.egg(e, { id: 'manhattan-bridge-1909', title: 'The bridge that tilted', year: '1909', text: 'The Manhattan Bridge opened on December 31, 1909, designed by Leon Moisseiff, with a main span of 1,480 feet. It carries the B, D, N and Q trains on its lower level, and their uneven weight made the deck twist by up to eight feet each time a train crossed, which took a reconstruction from 1982 to 2004 to fix.', clue: 'Wait for a train and watch the deck. It holds still now.', source: { name: 'Manhattan Bridge, Wikipedia', url: 'https://en.wikipedia.org/wiki/Manhattan_Bridge' } }, { r: 12 }); }
    k.egg(v(CXp + 12.4, 3, CZp), { id: 'janes-carousel', title: 'Jane\'s Carousel', year: '1922', text: 'The carousel was built in 1922 by the Philadelphia Toboggan Company for Idora Park in Youngstown, Ohio. Jane and David Walentas bought it at auction in 1984 for 385,000 dollars, and it opened here on September 16, 2011, in a pavilion by the French architect Jean Nouvel: 48 carved horses, 30 jumpers and 18 standers, and two chariots.', clue: 'The horses came from Ohio. Count the ones that do not jump.', source: { name: 'Jane\'s Carousel, Wikipedia', url: 'https://en.wikipedia.org/wiki/Jane%27s_Carousel' } }, { r: 3 });
    return { mounts, spawn: v(0, 3, 5), look: v(0, 14, -178), eye: 3, bounds: [-46, 44, -99.5, 26], style: 'black' };
  },
};

/* ---------------- 150 THE BRIDGE OVER THE LAKE ---------------- */
export const bowbridge: RoomDef = {
  id: 'bowbridge',
  name: 'The bridge over the Lake',
  area: 'BOW BRIDGE / CENTRAL PARK',
  mood: 'October, oars in the water',
  color: '#6f9a5a',
  description: 'Bow Bridge on an October afternoon, seen from the east arm of the Lake the way everyone photographs it: the cast iron span in cream, its eight urns, the willows on the banks and the Ramble going gold behind, rowboats from the Loeb Boathouse sliding under the arch, and the twin towers of the San Remo standing over the trees on Central Park West. The New Yorkers hang on painters\' easels along the banks and under the boathouse canopy, facing the paths.',
  signatures: 'Calvert Vaux and Jacob Wrey Mould\'s 1862 cast iron bridge with its shallow arch, interlocking circle railing and eight planting urns, the Lake and its schist shore, rowboats with rowers, mallards, weeping willows and autumn trees, the Ramble to the north and Cherry Hill to the south, the Loeb Boathouse and its dock, and the San Remo, the Dakota and the Central Park West skyline over the trees.',
  build(k, ctx) {
    k.sky({ top: 0x3f7fd6, horizon: 0xc4d8ec, ground: 0x6a6a58, fog: 0.0006, sun: { az: 2.3, el: 0.55, color: 0xfff0d6, size: 8 }, env: 0.7 });
    k.hemi(0xd8e6ff, 0x8a8478, 1.2);
    k.sun(0xfff0d6, 2.4, -70, 80, 70, true, 90);
    const grass = k.pbr('bbGrass', X.grass(0x5f7240, 161), 0.3, { roughness: 1 }), path = k.pbr('bbPath', X.asphalt(0x4c4c50), 0.4, { roughness: 0.9 }),
      schist = k.pbr('bbRock', X.concrete(0x6c6862, 162), 0.5, { roughness: 0.95 }), granite = k.pbr('bbAbut', X.ashlar(0x7a7266, 163, 4), 0.6),
      planks = k.pbr('bbDeck', X.planks(0x7a6450, 6, 164), 1.2, { roughness: 0.7 }), iron = k.flat(0xe6dfcc, 0.3, 0.5),
      post = k.flat(0x2c3a30, 0.5, 0.5), wood = k.flat(0x6a4a32, 0, 0.8), buff = k.pbr('bbHouse', X.brick(0xc8b08a, 165), 0.9), copper = k.flat(0x5d7f6e, 0.3, 0.6),
      glass = k.glass(0xcfe6f2, 0.3, 0.1), easelWood = k.flat(0x8a6a44, 0, 0.7), canvasBack = k.flat(0xe8e2d4, 0, 0.9), plant = k.flat(0x4a6a2e, 0, 0.9), bloom = k.flat(0xc8402a, 0, 0.8);
    /* ---- the Lake and its banks: water everywhere, land laid on top in pieces so none of it sits under the water ---- */
    { const w = k.water({ y: -1, color: 0x3a5446, w: 760, d: 720, x: 0, z: -200, amp: 0.12 }); const wm = w.material as T.MeshStandardMaterial; wm.metalness = 0.06; wm.roughness = 0.22; wm.envMapIntensity = 0.35; wm.color.setHex(0x34503f); }
    const land = (x0: number, x1: number, z0: number, z1: number) => k.box(x1 - x0, 1.6, z1 - z0, (x0 + x1) / 2, -0.8, (z0 + z1) / 2, grass);
    land(-400, -13, -40, -18); land(-400, -20, -18, 400); land(13, 400, -40, -18); land(20, 400, -18, 400); land(-20, 20, 4, 400);
    land(-400, -62, -128, -40); land(44, 400, -128, -40); land(-400, 400, -500, -128);
    k.block(-19.6, 19.6, -18, 3.6); k.block(-12.6, 12.6, -35.6, -18);
    /* the schist shore: boulders along every edge the visitor can see */
    {
      const rnd = X.mulberry(1858), pts: [number, number][] = [];
      for (let z = -38; z < -18; z += 2.2) { pts.push([-13 - rnd() * 0.6, z]); pts.push([13 + rnd() * 0.6, z]); }
      for (let z = -18; z < 4; z += 2.2) { pts.push([-20 - rnd() * 0.6, z]); pts.push([20 + rnd() * 0.6, z]); }
      for (let x = -20; x < 20; x += 2.2) if (x < -7 || x > 17) pts.push([x, 4 + rnd() * 0.5]);
      for (let x = -13; x > -62; x -= 2.6) pts.push([x, -40 - rnd() * 0.5]);
      for (let x = 13; x < 44; x += 2.6) pts.push([x, -40 - rnd() * 0.5]);
      for (let x = -62; x < 44; x += 3.2) pts.push([x, -128 + rnd() * 0.6]);
      const rocks = k.instances(new T.DodecahedronGeometry(1, 0), schist, pts.map(([x, z]) => { const s = 0.6 + rnd() * 0.9; return new T.Matrix4().compose(v(x, -0.7 + s * 0.3, z), new T.Quaternion().setFromEuler(new T.Euler(rnd() * 3, rnd() * 3, rnd() * 3)), v(s * 1.3, s * 0.7, s)); }));
      void rocks;
      for (let i = 0; i < 26; i++) { const x = 30 + rnd() * 40, z = -40 + rnd() * 50, s = 1 + rnd() * 2.2; const o = k.mesh(new T.DodecahedronGeometry(s, 0), schist, x, s * 0.25, z); o.scale.set(1.4, 0.55, 1.1); o.rotation.y = rnd() * 3; }
    }
    /* the paths: asphalt, the east shore, down each bank and onto the bridge */
    k.box(88, 0.05, 3, 0, 0.02, 7.6, path);
    for (const s of [-1, 1]) {
      k.box(3, 0.05, 36, s * 25, 0.02, -10.4, path);
      const a = v(s * 25, 0.02, -28), b = v(s * 13.3, 0.02, -38), c = a.clone().add(b).multiplyScalar(0.5);
      const o = k.box(3.4, 0.05, a.distanceTo(b) + 1.5, c.x, 0.02, c.z, path); o.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
      k.box(3, 0.05, 12, s * 38, 0.02, -38, path);
    }
    /* ---- Bow Bridge: one shallow cast iron arch, sixty feet clear, eighty seven feet long ---- */
    const HALF = 13.3, CROWN = 2.0, BZ = -38, HW = 2.1;
    const deckY = (x: number) => (Math.abs(x) < HALF ? CROWN * (1 - (x / HALF) ** 2) : 0);
    const soffit = (x: number) => -0.72 + (CROWN - 0.55 + 0.72) * Math.max(0, 1 - (x / 11.5) ** 2);
    for (let i = 0; i < 27; i++) { const x0 = -HALF + i * (2 * HALF / 27), x1 = x0 + 2 * HALF / 27, xm = (x0 + x1) / 2; const o = k.box(x1 - x0 + 0.04, 0.14, HW * 2, xm, deckY(xm) - 0.07, BZ, planks); o.rotation.z = Math.atan2(deckY(x1) - deckY(x0), x1 - x0); }
    {
      /* the two fascia girders: deck line on top, the arch below, the spandrel between */
      const sh = new T.Shape();
      sh.moveTo(-HALF - 0.3, -0.9);
      for (let i = 0; i <= 40; i++) { const x = -HALF - 0.3 + (i / 40) * (2 * HALF + 0.6); sh.lineTo(x, deckY(x) + 0.12); }
      sh.lineTo(HALF + 0.3, -0.9); sh.lineTo(11.5, -0.9);
      for (let i = 0; i <= 40; i++) { const x = 11.5 - (i / 40) * 23; sh.lineTo(x, soffit(x)); }
      sh.lineTo(-11.5, -0.9); sh.closePath();
      for (const s of [-1, 1]) { const g = new T.ExtrudeGeometry(sh, { depth: 0.22, bevelEnabled: false, curveSegments: 4 }); g.translate(0, 0, -0.11); k.mesh(g, iron, 0, 0, BZ + s * (HW + 0.05)); }
      /* ribs under the arch, and the rings and bosses in the spandrels */
      for (const dz of [-1.4, -0.47, 0.47, 1.4]) { const pts: T.Vector3[] = []; for (let i = 0; i <= 24; i++) { const x = -11.5 + (i / 24) * 23; pts.push(v(x, soffit(x) + 0.05, BZ + dz)); } k.curve(pts, 0.1, iron, 32); }
      for (const s of [-1, 1]) for (const x of [-9.6, -7.2, -4.8, -2.4, 0, 2.4, 4.8, 7.2, 9.6]) { const gap = deckY(x) - soffit(x), r = Math.min(0.42, gap * 0.36); if (r < 0.12) continue; const o = k.torus(r, 0.045, x, (deckY(x) + soffit(x)) / 2 + 0.03, BZ + s * (HW + 0.18), iron, 18); void o; k.sphere(r * 0.35, x, (deckY(x) + soffit(x)) / 2 + 0.03, BZ + s * (HW + 0.18), iron, 8); }
      /* the abutments in dressed stone, down into the water */
      for (const s of [-1, 1]) { k.box(2.6, 1.9, HW * 2 + 1.6, s * (HALF + 0.2), -0.95, BZ, granite); k.box(0.7, 1.9, 7, s * (HALF + 1.2), -0.95, BZ, granite); }
      /* the interlocking circles of the railing, both sides, following the deck */
      const ringPts: T.Vector3[] = [];
      for (const s of [-1, 1]) for (let x = -HALF + 0.3; x <= HALF - 0.3; x += 0.38) ringPts.push(v(x, deckY(x) + 0.42, BZ + s * HW));
      k.instances(new T.TorusGeometry(0.27, 0.028, 5, 14), iron, ringPts.map((p) => new T.Matrix4().setPosition(p)));
      for (const s of [-1, 1]) for (const dy of [0.12, 0.74]) { const pts: T.Vector3[] = []; for (let i = 0; i <= 30; i++) { const x = -HALF - 0.4 + (i / 30) * (2 * HALF + 0.8); pts.push(v(x, deckY(x) + dy, BZ + s * HW)); } k.curve(pts, dy > 0.5 ? 0.06 : 0.04, iron, 40); }
      /* eight urns: at each end, on the pedestal at the abutment and on the one where the railing flares out */
      const urn = [[0.0, 0], [0.16, 0.02], [0.1, 0.12], [0.14, 0.2], [0.36, 0.42], [0.42, 0.6], [0.44, 0.64], [0.0, 0.64]];
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const [px, pz] of [[HALF - 0.1, HW], [HALF + 1.6, HW + 0.9]]) {
        const x = sx * px, z = BZ + sz * pz, y0 = deckY(x);
        k.box(0.62, 1.05, 0.62, x, y0 + 0.52, z, iron);
        k.box(0.74, 0.08, 0.74, x, y0 + 1.07, z, iron);
        k.lathe(urn.map(([a, b]) => [a * 1.2, b * 1.2]), x, y0 + 1.11, z, iron, 14);
        const bush = k.sphere(0.5, x, y0 + 2.0, z, plant, 8); bush.scale.set(1, 0.7, 1);
        for (let j = 0; j < 5; j++) k.sphere(0.08, x + Math.cos(j * 1.3) * 0.4, y0 + 2.1 + (j % 2) * 0.1, z + Math.sin(j * 1.3) * 0.4, bloom, 6);
      }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const a = v(sx * HALF, 0.74, BZ + sz * HW), b = v(sx * (HALF + 1.6), 0.74, BZ + sz * (HW + 0.9)); k.beam(a, b, 0.05, iron, 6); k.beam(a.clone().setY(0.12), b.clone().setY(0.12), 0.04, iron, 6); }
    }
    /* ---- the willows on the banks: a crown and a curtain of hanging strands that moves in the wind ---- */
    const willows = [[-25, -17.5], [25.5, -17.5], [-29, 3], [29.5, 3.5], [-36, -27], [36, -30]];
    {
      const rnd = X.mulberry(1873), bark = k.pbr('bark', X.bark(), 0.7, { roughness: 1 });
      const strands: { x: number; y: number; z: number; L: number; ph: number }[] = [];
      for (const [wx, wz] of willows) {
        k.lathe([[0.5, 0], [0.34, 1], [0.28, 4.2], [0.18, 6.4]], wx, 0, wz, bark, 9);
        const cr = k.mesh(new T.IcosahedronGeometry(3.3, 1), k.flat(0x8a9a3e, 0, 0.95), wx, 6.6, wz); cr.scale.set(1, 0.55, 1);
        for (let i = 0; i < 80; i++) { const a = rnd() * PI * 2, rr = 1.4 + rnd() * 2.4, top = 7.4 - (rr / 3.8) * 1.6; strands.push({ x: wx + Math.cos(a) * rr, y: top, z: wz + Math.sin(a) * rr, L: 3.6 + rnd() * 2.6 * (rr / 3.8) + rnd(), ph: rnd() * 6.3 }); }
        k.keepOut.push({ x: wx, z: wz, r: 0.8 });
      }
      const sg = new T.BoxGeometry(0.16, 1, 0.05); sg.translate(0, -0.5, 0);
      const cur = k.instances(sg, new T.MeshStandardMaterial({ roughness: 0.9, side: T.DoubleSide }), strands.map(() => new T.Matrix4()));
      cur.frustumCulled = false;
      const c = new T.Color(), pal = [0x9aac44, 0xb0b84a, 0x7f9a3a, 0xc4b24a];
      strands.forEach((_, i) => cur.setColorAt(i, c.set(pal[i % pal.length])));
      if (cur.instanceColor) cur.instanceColor.needsUpdate = true;
      const m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), p = new T.Vector3(), sc = new T.Vector3();
      const place = (t: number) => { strands.forEach((s, i) => { e.set(0.08 * Math.sin(t * 0.9 + s.ph), s.ph, 0.1 * Math.sin(t * 0.7 + s.ph * 1.3)); q.setFromEuler(e); p.set(s.x, s.y, s.z); sc.set(1, s.L, 1); m.compose(p, q, sc); cur.setMatrixAt(i, m); }); cur.instanceMatrix.needsUpdate = true; };
      place(0);
      if (!ctx.reduced) k.ticks.push(place);
    }
    /* ---- autumn: the Ramble going gold to the north, Cherry Hill to the south, a wall of trees on the far shore ---- */
    {
      const rnd = X.mulberry(1859), fall = [0xc8641e, 0xd89a2a, 0x9a2a1e, 0x6a7a2e, 0xc8a22a, 0x4f6b34, 0xb84a1e, 0xe0b040];
      const tree = (x: number, z: number, h: number, r: number) => { k.tree(x, 0, z, { h, r, kind: 'round', seed: Math.round(x * 7 + z), leaf: fall[Math.floor(rnd() * fall.length)] }); k.keepOut.push({ x, z, r: 0.6 }); };
      for (let i = 0; i < 20; i++) tree(30 + rnd() * 50, -40 + rnd() * 52, 8 + rnd() * 5, 3.2 + rnd() * 1.8);
      for (let i = 0; i < 22; i++) tree(-30 - rnd() * 45, -40 + rnd() * 42, 7 + rnd() * 5, 3 + rnd() * 1.8);
      for (let i = 0; i < 12; i++) tree(-60 + rnd() * 120, 32 + rnd() * 40, 9 + rnd() * 5, 3.4 + rnd() * 2);
      for (let i = 0; i < 34; i++) { const x = -220 + i * 13 + rnd() * 6, z = -134 - rnd() * 40; k.tree(x, 0, z, { h: 13 + rnd() * 6, r: 5 + rnd() * 2.4, kind: 'round', seed: i + 300, leaf: fall[Math.floor(rnd() * fall.length)] }); }
      for (let i = 0; i < 12; i++) { const s = i % 2 ? 1 : -1; k.tree(s * (62 + rnd() * 50), 0, -48 - rnd() * 75, { h: 11 + rnd() * 5, r: 4.4 + rnd() * 2, kind: 'round', seed: i + 400, leaf: fall[Math.floor(rnd() * fall.length)] }); }
    }
    /* ---- Central Park West over the trees: the San Remo's twin temples, the Dakota's roofs, the rest of the wall ---- */
    {
      const limestone = k.pbr('bbCpw', X.windows(52, 0.15, 0xc9bda2, true), 0.14, { emissive: 0xffffff, emissiveIntensity: 0.08 + 1.8 * k.night, roughness: 0.75, stretch: 0.5 });
      const tan = k.pbr('bbCpw2', X.windows(53, 0.15, 0xa8907a, true), 0.14, { emissive: 0xffffff, emissiveIntensity: 0.08 + 1.8 * k.night, roughness: 0.75, stretch: 0.5 });
      const cap = k.flat(0xd8ccb0, 0.1, 0.7), slate = k.flat(0x4a5058, 0.2, 0.8);
      const SX = 22, SZ = -430;
      k.box(72, 60, 30, SX, 30, SZ, limestone);
      k.box(74, 1.4, 32, SX, 60.5, SZ, cap);
      for (const s of [-1, 1]) {
        const tx = SX + s * 20;
        k.box(15, 22, 15, tx, 71, SZ, limestone); k.box(12, 10, 12, tx, 87, SZ, limestone); k.box(12.8, 1, 12.8, tx, 92.4, SZ, cap);
        for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; k.cyl(0.32, 7.4, tx + Math.cos(a) * 4.8, 96.6, SZ + Math.sin(a) * 4.8, cap, 0.32, 8); }
        k.cyl(3.6, 7.4, tx, 96.6, SZ, k.flat(0x9a8f78, 0, 0.8), 3.6, 16);
        k.cyl(5.4, 1.2, tx, 100.9, SZ, cap, 5.4, 20);
        k.cyl(1.4, 2.6, tx, 102.8, SZ, cap, 5.0, 20);
        k.cyl(1.2, 5.4, tx, 106.8, SZ, cap, 1.4, 12);
        k.cyl(0.05, 5, tx, 112, SZ, cap, 1.2, 12);
      }
      /* the Dakota, low and steep roofed, to the south */
      k.box(62, 40, 62, -150, 20, -445, k.pbr('bbDak', X.windows(54, 0.12, 0xb89e72, true), 0.14, { emissive: 0xffffff, emissiveIntensity: 0.08 + 1.8 * k.night, roughness: 0.8, stretch: 0.5 }));
      { const r = k.cyl(44, 12, -150, 46, -445, slate, 30, 4); r.rotation.y = PI / 4; }
      for (const [dx, dz] of [[-24, -24], [24, -24], [-24, 24], [24, 24], [0, -30], [-30, 0]]) { k.cyl(2.2, 10, -150 + dx, 55, -445 + dz, slate, 0.2, 4); }
      const rnd = X.mulberry(1930);
      for (let x = -330; x <= 330; x += 26 + rnd() * 10) {
        if (Math.abs(x - SX) < 50 || Math.abs(x + 150) < 42) continue;
        const h = 40 + rnd() * 50, w = 20 + rnd() * 10;
        k.box(w, h, 26, x, h / 2, -440 - rnd() * 16, rnd() > 0.5 ? limestone : tan);
        k.box(w + 1, 1.2, 27, x, h + 0.6, -440, cap);
      }
      k.skyline({ z: -560, count: 30, spacing: 22, scale: 2.2, base: 0, seed: 71, lit: 0.2, tint: 0x8a8274, rows: 1, spires: false });
      k.skyline({ z: 520, count: 30, spacing: 22, scale: 2.4, base: 0, seed: 72, lit: 0.2, tint: 0x7a7468, rows: 1, spires: false });
    }
    /* ---- the Loeb Boathouse behind the visitor: buff brick, a copper roof, the canopy the works hang under ---- */
    {
      k.box(46, 5.6, 12, 15, 2.8, 22, buff);
      const rs = new T.Shape(); rs.moveTo(-6.8, 0); rs.lineTo(6.8, 0); rs.lineTo(0, 2.8); rs.closePath();
      const rg = new T.ExtrudeGeometry(rs, { depth: 47, bevelEnabled: false }); rg.translate(0, 0, -23.5); rg.rotateY(PI / 2);
      k.mesh(rg, copper, 15, 5.6, 22);
      k.box(46.6, 0.34, 5.6, 15, 4.4, 13.3, copper);
      k.box(46.6, 0.5, 0.12, 15, 4.2, 10.56, k.flat(0x2c3a30, 0.4, 0.6));
      for (const x of [-7.3, -1, 5, 11, 17, 23, 29, 35, 37.4]) { k.cyl(0.13, 4.3, x, 2.15, 10.9, post, 0.13, 10); k.keepOut.push({ x, z: 10.9, r: 0.45 }); }
      k.box(46, 0.7, 0.1, 15, 3.85, 15.96, glass);
      for (const x of [-7.9]) k.box(0.1, 0.7, 11, x, 3.85, 22, glass);
      k.sign('THE LOEB BOATHOUSE', 9, 0.5, 15, 4.2, 10.48, 'transparent', '#f2ead8', 80, PI);
      k.block(-8.2, 38.2, 15.8, 28.2);
      /* the dock, and two boats tied up at it */
      k.box(12, 0.25, 3.4, 10, -0.82, 2.3, planks);
      for (const x of [5.5, 14.5]) for (const z of [0.8, 3.8]) k.cyl(0.14, 1.4, x, -0.6, z, wood, 0.14, 8);
      k.lamp(-10, 6.3, 4.2, post, 0xffd7a0, k.night > 0.5 ? 60 : 12); k.lamp(10, 6.3, 4.2, post, 0xffd7a0, k.night > 0.5 ? 60 : 12);
      for (const [x, z] of [[-23.4, -7], [-23.4, -21], [23.4, -7], [23.4, -21], [-34, 6.2], [34, 6.2]]) k.lamp(x, z, 4.2, post, 0xffd7a0, k.night > 0.5 ? 60 : 12);
      for (const x of [-38, -30, 30, 38]) k.bench(x, 5.4, PI, wood, post, 2.2);
      if (k.night > 0.3) k.point(15, 3.6, 13, 0xffd7a0, 80, 18);
    }
    /* ---- the rowboats: green hulls, a rower facing the stern, a passenger, oars that sweep ---- */
    const mkBoat = (shirt: number, pass: number) => {
      const g = new T.Group();
      const bow = new T.ConeGeometry(0.64, 1.1, 4); bow.rotateY(PI / 4); bow.rotateX(PI / 2); bow.scale(1, 0.62, 1); bow.translate(0, 0.02, 2.05);
      const stern = new T.ConeGeometry(0.64, 0.5, 4); stern.rotateY(PI / 4); stern.rotateX(-PI / 2); stern.scale(1, 0.62, 1); stern.translate(0, 0.02, -1.75);
      g.add(new T.Mesh(mergeGeometries([new T.BoxGeometry(1.28, 0.44, 3.0), bow, stern])!, k.flat(0x2f5a3e, 0.2, 0.55)));
      g.add(new T.Mesh(mergeGeometries([part(1.1, 0.03, 2.9, 0, 0.21, 0), part(1.1, 0.08, 0.3, 0, 0.3, 0.3), part(1.1, 0.08, 0.3, 0, 0.3, -1.1)])!, k.flat(0xe8e0cc, 0, 0.7)));
      const body = (z: number) => { const b = new T.CapsuleGeometry(0.19, 0.42, 3, 8); b.translate(0, 0.72, z); return b; };
      const head = (z: number) => { const h = new T.SphereGeometry(0.12, 8, 6); h.translate(0, 1.2, z); return h; };
      g.add(new T.Mesh(body(0.3), k.flat(shirt, 0, 0.85))); g.add(new T.Mesh(body(-1.1), k.flat(pass, 0, 0.85)));
      g.add(new T.Mesh(mergeGeometries([head(0.3), head(-1.1)])!, k.flat(0xc8a284, 0, 0.7)));
      const oars = new T.Group(); oars.position.set(0, 0.62, 0.55); g.add(oars);
      for (const s of [-1, 1]) { const o = new T.Mesh(new T.BoxGeometry(2.6, 0.05, 0.05), k.flat(0xb89a6a, 0, 0.7)); o.position.x = s * 1.1; o.rotation.z = s * 0.34; oars.add(o); const bl = new T.Mesh(new T.BoxGeometry(0.5, 0.02, 0.16), k.flat(0xb89a6a, 0, 0.7)); bl.position.set(s * 2.25, -0.42, 0); oars.add(bl); }
      k.add(g);
      return { g, oars };
    };
    const boats: { g: T.Group; oars: T.Group; ph: number }[] = [];
    {
      const routes = [
        [v(6, -0.92, -2), v(-9, -0.92, -10), v(-7, -0.92, -24), v(-2, -0.92, -38), v(-10, -0.92, -58), v(-30, -0.92, -80), v(-48, -0.92, -66), v(-26, -0.92, -50), v(3, -0.92, -38), v(8, -0.92, -26), v(12, -0.92, -10)],
        [v(-10, -0.92, -60), v(20, -0.92, -70), v(30, -0.92, -96), v(0, -0.92, -112), v(-40, -0.92, -106), v(-50, -0.92, -78)],
        [v(0, -0.92, -5), v(10, -0.92, -11), v(6, -0.92, -22), v(-7, -0.92, -19), v(-10, -0.92, -8)],
      ];
      const spec: [number, number, number, number][] = [[0, 0xe83a5a, 0x3a8ae8, 0], [0, 0xf0d24a, 0x2a2a34, 80], [1, 0xe8e2d4, 0x8a3a3a, 0], [1, 0x2b5f6e, 0xd8c04a, 70], [2, 0x6a4a8a, 0xe8e2d4, 10], [0, 0x2a2a34, 0xff8c3b, 150]];
      spec.forEach(([ri, a, b, off], i) => { const bt = mkBoat(a, b); const cv = k.spline(routes[ri], true); if (ctx.reduced) { cv.getPointAt((off / cv.getLength()) % 1, bt.g.position); } else k.rider(bt.g, cv, 1.0 + (i % 3) * 0.15, off); boats.push({ ...bt, ph: i * 1.7 }); });
      /* the two tied up at the dock */
      for (const x of [7.2, 12.8]) { const bt = mkBoat(0xe8e2d4, 0xe8e2d4); bt.g.position.set(x, -0.95, 0.4); bt.g.rotation.y = PI / 2 + 0.05 * x; bt.g.children.slice(2, 6).forEach((c) => (c.visible = false)); }
      if (!ctx.reduced) k.ticks.push((t) => { for (const b of boats) { const u = t * 1.7 + b.ph; b.oars.rotation.y = 0.55 * Math.sin(u); b.oars.position.y = 0.62 + 0.1 * Math.cos(u); b.g.position.y = -0.95 + 0.03 * Math.sin(t * 1.4 + b.ph); } });
    }
    /* ---- mallards, paddling in slow circles ---- */
    {
      const ND = 22, rnd = X.mulberry(22);
      const bodyG = new T.SphereGeometry(0.17, 8, 6); bodyG.scale(0.85, 0.62, 1.5);
      const headG = new T.SphereGeometry(0.075, 8, 6);
      const bodies = k.instances(bodyG, new T.MeshStandardMaterial({ roughness: 0.8 }), Array.from({ length: ND }, () => new T.Matrix4()));
      const heads = k.instances(headG, new T.MeshStandardMaterial({ roughness: 0.6 }), Array.from({ length: ND }, () => new T.Matrix4()));
      bodies.frustumCulled = heads.frustumCulled = false;
      const c = new T.Color();
      const ds = Array.from({ length: ND }, (_, i) => { const lake = i % 3 === 0; return { cx: lake ? -20 + rnd() * 50 : -8 + rnd() * 16, cz: lake ? -58 - rnd() * 40 : -30 + rnd() * 28, r: 0.8 + rnd() * 2.6, w: (0.08 + rnd() * 0.12) * (rnd() > 0.5 ? 1 : -1), ph: rnd() * 6.3 }; });
      for (let i = 0; i < ND; i++) { const drake = i % 2 === 0; bodies.setColorAt(i, c.set(drake ? 0x8a8478 : 0x7a5a3a)); heads.setColorAt(i, c.set(drake ? 0x1f6a3a : 0x6a4a2a)); }
      if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true; if (heads.instanceColor) heads.instanceColor.needsUpdate = true;
      const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), up = new T.Vector3(0, 1, 0), hp = new T.Vector3();
      const place = (t: number) => {
        ds.forEach((d, i) => {
          const a = t * d.w + d.ph, dir = Math.sign(d.w);
          p.set(d.cx + Math.cos(a) * d.r, -0.93 + 0.015 * Math.sin(t * 3 + i), d.cz + Math.sin(a) * d.r);
          const yaw = Math.atan2(-Math.sin(a) * dir, Math.cos(a) * dir);
          q.setFromAxisAngle(up, yaw); m.compose(p, q, one); bodies.setMatrixAt(i, m);
          hp.set(0, 0.15, 0.2).applyQuaternion(q).add(p); m.compose(hp, q, one); heads.setMatrixAt(i, m);
        });
        bodies.instanceMatrix.needsUpdate = heads.instanceMatrix.needsUpdate = true;
      };
      place(0);
      if (!ctx.reduced) k.ticks.push(place);
    }
    /* ---- leaves coming down ---- */
    if (!ctx.reduced) {
      const NL = 160, rnd = X.mulberry(10);
      const leaves = k.instances(new T.PlaneGeometry(0.16, 0.11), new T.MeshStandardMaterial({ roughness: 0.8, side: T.DoubleSide }), Array.from({ length: NL }, () => new T.Matrix4()));
      leaves.frustumCulled = false;
      const c = new T.Color(), pal = [0xd8741e, 0xe0a82a, 0xa8321e, 0xc8a22a, 0x9aac44];
      const ls = Array.from({ length: NL }, (_, i) => { leaves.setColorAt(i, c.set(pal[i % pal.length])); return { x: -34 + rnd() * 68, z: -38 + rnd() * 42, h: 7 + rnd() * 5, sp: 0.5 + rnd() * 0.5, o: rnd(), ph: rnd() * 6.3 }; });
      if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
      const m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), p = new T.Vector3();
      k.ticks.push((t) => { ls.forEach((l, i) => { const u = (t * l.sp / l.h + l.o) % 1, y = l.h * (1 - u) - 0.9; p.set(l.x + 1.2 * Math.sin(t * 0.8 + l.ph) + u * 3, y, l.z + 0.8 * Math.cos(t * 0.6 + l.ph)); e.set(t * 1.3 + l.ph, t * 0.7, t * 1.9 + l.ph); q.setFromEuler(e); m.compose(p, q, one); leaves.setMatrixAt(i, m); }); leaves.instanceMatrix.needsUpdate = true; });
    }
    /* ---- the easels along the banks, where the painters set up to paint the bridge ---- */
    const mounts: Mount[] = [];
    const easel = (x: number, z: number, rot: number) => {
      const n = v(Math.sin(rot), 0, Math.cos(rot)), tt = v(Math.cos(rot), 0, -Math.sin(rot)), top = v(x - n.x * 0.1, 2.55, z - n.z * 0.1);
      for (const s of [-1, 1]) k.beam(top, v(x + tt.x * s * 0.55 + n.x * 0.28, 0, z + tt.z * s * 0.55 + n.z * 0.28), 0.03, easelWood, 5);
      k.beam(top, v(x - n.x * 0.85, 0, z - n.z * 0.85), 0.03, easelWood, 5);
      const shelf = k.box(1.5, 0.05, 0.14, x + n.x * 0.1, 1.15, z + n.z * 0.1, easelWood); shelf.rotation.y = rot;
      const back = k.box(1.62, 1.14, 0.04, x + n.x * 0.04, 1.75, z + n.z * 0.04, canvasBack); back.rotation.y = rot;
      mounts.push({ position: v(x + n.x * 0.08, 1.75, z + n.z * 0.08), rotation: rot, target: v(x + n.x * 3.4, 1.9, z + n.z * 3.4), width: 1.6, height: 1.1, style: 'oak', wash: false });
      k.keepOut.push({ x: x - n.x * 0.3, z: z - n.z * 0.3, r: 0.7 });
    };
    for (const z of [-3, -11]) { easel(-22.2, z, -PI / 2); easel(22.2, z, PI / 2); }
    for (const z of [-24, -31]) { easel(-15.2, z, -PI / 2); easel(15.2, z, PI / 2); }
    /* and under the boathouse canopy, facing the lake */
    for (const x of [-4, 2, 8, 20, 26, 32]) mounts.push({ position: v(x, 2.35, 15.9), rotation: PI, target: v(x, 2.4, 12.5), width: 2.4, height: 1.65, style: 'oak', wash: true });
    for (const z of [19.5, 24.5]) mounts.push({ position: v(-8.1, 2.35, z), rotation: -PI / 2, target: v(-11.5, 2.4, z), width: 2.4, height: 1.65, style: 'oak', wash: true });
    k.censusWall({ x: 14, y: 2.5, z: 15.9, rotY: PI, cols: 14, rows: 4, tile: 0.5, gap: 0.05, start: ctx.wallStart(3700, 56), pieces: ctx.all, backing: k.flat(0x2c3a30, 0.3, 0.7) });
    /* ---- people: painters at two easels, a couple on the bridge, walkers on every path ---- */
    figure(k, -23.6, 0, -9.6, 0x3a5a3a, { rotY: PI / 2 }); k.keepOut.push({ x: -23.6, z: -9.6, r: 0.4 });
    figure(k, 16.6, 0, -29.6, 0x8a3a3a, { rotY: -PI / 2 }); k.keepOut.push({ x: 16.6, z: -29.6, r: 0.4 });
    for (const [x, c] of [[-3.2, 0xe8e2d4], [-2.6, 0x2a2a34], [5.5, 0x8a4a2a]] as [number, number][]) { figure(k, x, deckY(x), BZ + HW - 0.45, c); k.keepOut.push({ x, z: BZ + HW - 0.45, r: 0.4 }); }
    if (!ctx.reduced) {
      const across: T.Vector3[] = [v(-38, 0, -34), v(-25, 0, -28), v(-16, 0, -36.8)];
      for (let i = 0; i <= 8; i++) { const x = -12 + i * 3; across.push(v(x, deckY(x), BZ + 0.6)); }
      across.push(v(16, 0, -36.8), v(25, 0, -28), v(38, 0, -34));
      k.crowd(across, 12, { seed: 150, speed: 0.8, spread: 1.4 });
      k.crowd([v(-25, 0, -26), v(-25, 0, 7.6), v(25, 0, 7.6), v(25, 0, -26)], 20, { seed: 151, speed: 0.9, spread: 1.6 });
      k.crowd([v(-44, 0, 7.6), v(44, 0, 7.6)], 8, { seed: 152, speed: 0.7, spread: 1.4 });
    }
    /* ---- what the Lake knows ---- */
    const src = { name: 'Bow Bridge (Central Park), Wikipedia', url: 'https://en.wikipedia.org/wiki/Bow_Bridge_(Central_Park)' };
    const lake = { name: 'The Lake and the Ramble, Wikipedia', url: 'https://en.wikipedia.org/wiki/The_Lake_(Central_Park)' };
    k.egg(v(0, 2.6, BZ), { id: 'bow-1862', title: 'Cast in the Bronx', year: '1862', text: 'Calvert Vaux and Jacob Wrey Mould designed the bridge, and it was completed in 1862. Janes, Kirtland and Company, the Bronx foundry that also built the dome of the United States Capitol, made the ironwork.', clue: 'Stand on the crown of the arch. The iron under your feet has a famous sibling in Washington.', source: src }, { r: 2.6 });
    k.egg(v(-HALF + 0.1, 2.2, BZ - HW), { id: 'bow-urns', title: 'Eight urns, one arch', text: 'The bridge is 87 feet long with a single 60 foot span. Its banister is a run of interlocking circles, with eight planting urns on decorative bas relief panels. It is the only one of the park\'s seven ornamental iron bridges that does not cross a bridle path.', clue: 'Count the urns. Then count the circles, if you have the afternoon.', source: src }, { r: 1.6 });
    k.egg(v(-2, -0.4, -10), { id: 'lake-1857', title: 'The first thing finished', year: '1857', text: 'The Lake covers 20 acres and was the first feature of Central Park to be completed. It opened to the public as an ice skating ground in December 1857.', clue: 'Before anyone rowed here, they skated.', source: lake }, { r: 3 });
    k.egg(v(15, 4.2, 10.5), { id: 'loeb-1954', title: 'The boathouse', year: '1954', text: 'The Loeb Boathouse on the eastern shore of the Lake was completed in 1954, paid for by the businessman Carl M. Loeb. It rents rowboats, and it has had a restaurant since 1983.', clue: 'Every boat on the water started at the dock behind you.', source: lake }, { r: 2.2 });
    k.egg(v(22, 100, -430), { id: 'san-remo-1930', title: 'Two temples on Central Park West', year: '1930', text: 'Emery Roth\'s San Remo was completed on September 21, 1930: 27 stories and 400 feet, the earliest apartment building on Central Park West built with twin towers. Each tower is topped by a Corinthian temple patterned after the Choragic Monument of Lysicrates in Athens. It became a city landmark in 1987.', clue: 'Look over the trees to the west for two little Greek temples in the sky.', source: { name: 'The San Remo, Wikipedia', url: 'https://en.wikipedia.org/wiki/The_San_Remo' } }, { r: 18 });
    const floorY = (x: number, z: number) => (z > BZ - HW - 0.5 && z < BZ + HW + 0.5 ? deckY(x) : 0);
    return { mounts, spawn: v(0, 3, 8), look: v(0, 3.4, BZ), eye: 3, floorY, bounds: [-45, 45, -40, 30], style: 'oak' };
  },
};
