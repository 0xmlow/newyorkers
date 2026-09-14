/* Procedural PBR surfaces for the museum. Every map is drawn on a canvas at load
   time, so the site ships no texture files and every surface tiles cleanly. */
import * as T from 'three';

export type Surface = {
  map: T.CanvasTexture;
  normalMap?: T.CanvasTexture;
  roughnessMap?: T.CanvasTexture;
  emissiveMap?: T.CanvasTexture;
};

const cache = new Map<string, Surface>();
/* Phones. Every surface is three or four canvases held in the cache for the life of the page,
   and iOS Safari refuses new canvases once the page holds about 384 MB of them, which reads as a
   room that never finishes building. On a low quality device surfaces are painted at half size
   (a quarter of the memory) and the cache keeps only what the current room touched. */
let scale = 1, trimming = false;
const touched = new Set<string>();
export function textureBudget(low: boolean) { scale = low ? 0.5 : 1; trimming = low; }
export function beginRoom() { touched.clear(); }
export function trimCache() {
  if (!trimming) return;
  for (const [key, s] of cache) {
    if (touched.has(key)) continue;
    for (const t of [s.map, s.normalMap, s.roughnessMap, s.emissiveMap]) {
      if (!t) continue;
      t.dispose();
      const c = t.image as HTMLCanvasElement | undefined;
      if (c && 'width' in c) c.width = c.height = 0;
    }
    cache.delete(key);
  }
}

export function mulberry(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Periodic value noise. The lattice is 256 wide and wraps, so any integer
   frequency tiles perfectly across the canvas. */
function lattice(seed: number) {
  const r = mulberry(seed),
    N = 256,
    g = new Float32Array(N * N);
  for (let i = 0; i < g.length; i++) g[i] = r();
  return (x: number, y: number) => {
    const xi = Math.floor(x),
      yi = Math.floor(y),
      fx = x - xi,
      fy = y - yi,
      sx = fx * fx * (3 - 2 * fx),
      sy = fy * fy * (3 - 2 * fy),
      x0 = xi & 255,
      x1 = (xi + 1) & 255,
      y0 = (yi & 255) * N,
      y1 = ((yi + 1) & 255) * N;
    const a = g[y0 + x0],
      b = g[y0 + x1],
      c = g[y1 + x0],
      d = g[y1 + x1];
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}
const noise = lattice(7),
  noise2 = lattice(99);
function fbm(x: number, y: number, oct = 4, n = noise) {
  let a = 0,
    amp = 0.5,
    f = 1;
  for (let o = 0; o < oct; o++) {
    a += amp * n(x * f, y * f);
    f *= 2;
    amp *= 0.5;
  }
  return a;
}
const hash = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
type RGB = [number, number, number];
const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
export const hex = (h: number): RGB => [(h >> 16) & 255, (h >> 8) & 255, h & 255];

type Sample = { c: RGB; h: number; r: number; e?: number };
type Painter = (u: number, v: number) => Sample;

/* Paint one tileable surface: colour, height (turned into a normal map) and
   roughness. Optional emissive channel for lit windows and signs. */
function paint(
  key: string,
  size: number,
  fn: Painter,
  opts: { normalScale?: number; emissive?: boolean; repeat?: [number, number] } = {},
): Surface {
  touched.add(key);
  const hit = cache.get(key);
  if (hit) return hit;
  size = Math.max(64, Math.round(size * scale));
  const map = document.createElement('canvas'),
    rough = document.createElement('canvas'),
    norm = document.createElement('canvas'),
    emis = opts.emissive ? document.createElement('canvas') : null;
  for (const c of [map, rough, norm, emis]) if (c) c.width = c.height = size;
  const mc = map.getContext('2d')!,
    rc = rough.getContext('2d')!,
    nc = norm.getContext('2d')!,
    ec = emis?.getContext('2d');
  const mi = mc.createImageData(size, size),
    ri = rc.createImageData(size, size),
    ni = nc.createImageData(size, size),
    ei = ec?.createImageData(size, size);
  const height = new Float32Array(size * size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const s = fn(x / size, y / size),
        i = (y * size + x) * 4;
      mi.data[i] = s.c[0];
      mi.data[i + 1] = s.c[1];
      mi.data[i + 2] = s.c[2];
      mi.data[i + 3] = 255;
      const r = Math.round(clamp01(s.r) * 255);
      ri.data[i] = ri.data[i + 1] = ri.data[i + 2] = r;
      ri.data[i + 3] = 255;
      height[y * size + x] = s.h;
      if (ei) {
        const e = clamp01(s.e || 0);
        ei.data[i] = s.c[0] * e;
        ei.data[i + 1] = s.c[1] * e;
        ei.data[i + 2] = s.c[2] * e;
        ei.data[i + 3] = 255;
      }
    }
  const k = (opts.normalScale ?? 1) * size * 0.02;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const l = height[y * size + ((x + size - 1) % size)],
        r = height[y * size + ((x + 1) % size)],
        u = height[((y + size - 1) % size) * size + x],
        d = height[((y + 1) % size) * size + x];
      let nx = (l - r) * k,
        ny = (d - u) * k,
        nz = 1;
      const len = Math.hypot(nx, ny, nz);
      nx /= len;
      ny /= len;
      nz /= len;
      const i = (y * size + x) * 4;
      ni.data[i] = (nx * 0.5 + 0.5) * 255;
      ni.data[i + 1] = (ny * 0.5 + 0.5) * 255;
      ni.data[i + 2] = (nz * 0.5 + 0.5) * 255;
      ni.data[i + 3] = 255;
    }
  mc.putImageData(mi, 0, 0);
  rc.putImageData(ri, 0, 0);
  nc.putImageData(ni, 0, 0);
  if (ec && ei) ec.putImageData(ei, 0, 0);
  const wrap = (c: HTMLCanvasElement, srgb: boolean) => {
    const t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.anisotropy = 8;
    if (srgb) t.colorSpace = T.SRGBColorSpace;
    if (opts.repeat) t.repeat.set(opts.repeat[0], opts.repeat[1]);
    return t;
  };
  const out: Surface = {
    map: wrap(map, true),
    normalMap: wrap(norm, false),
    roughnessMap: wrap(rough, false),
    emissiveMap: emis ? wrap(emis, true) : undefined,
  };
  cache.set(key, out);
  return out;
}

/* ---------- the surfaces ---------- */

export function brick(tint = 0x6b4034, seed = 1) {
  const base = hex(tint);
  return paint(`brick${tint}${seed}`, 512, (u, v) => {
    const rows = 12,
      cols = 6;
    const row = Math.floor(v * rows),
      off = row % 2 ? 0.5 : 0,
      cu = (u * cols + off) % 1,
      cv = (v * rows) % 1;
    const col = Math.floor(u * cols + off);
    const mortar = cu < 0.06 || cv < 0.12;
    const id = hash(col + seed * 13, row);
    const grit = fbm(u * 32, v * 32, 3);
    if (mortar) {
      const g = 96 + grit * 50;
      return { c: [g, g - 6, g - 12], h: 0, r: 0.95 };
    }
    const shade = 0.72 + id * 0.45 + (grit - 0.5) * 0.25;
    const c = mix(base, [base[0] * 0.55, base[1] * 0.55, base[2] * 0.6], id > 0.8 ? 0.5 : 0);
    return {
      c: [c[0] * shade, c[1] * shade, c[2] * shade],
      h: 0.8 + grit * 0.2,
      r: 0.85 + grit * 0.1,
    };
  });
}

export function ashlar(tint = 0xb8ad97, seed = 2, courses = 5) {
  const base = hex(tint);
  return paint(`ashlar${tint}${seed}${courses}`, 512, (u, v) => {
    const rows = courses,
      cols = 3;
    const row = Math.floor(v * rows),
      off = row % 2 ? 0.5 : 0,
      cu = (u * cols + off) % 1,
      cv = (v * rows) % 1,
      col = Math.floor(u * cols + off);
    const id = hash(col * 3 + seed, row * 7 + seed);
    const joint = cu < 0.025 || cv < 0.05;
    const vein = fbm(u * 6 + id, v * 6, 4, noise2);
    const grain = fbm(u * 48, v * 48, 3);
    if (joint) return { c: [78, 74, 66], h: 0, r: 0.95 };
    const shade = 0.9 + (id - 0.5) * 0.16 + (vein - 0.5) * 0.18 + (grain - 0.5) * 0.08;
    const edge = Math.min(cu - 0.025, cv - 0.05, 1 - cu, 1 - cv) * 12;
    return {
      c: [base[0] * shade, base[1] * shade, base[2] * shade],
      h: 0.7 + Math.min(1, edge) * 0.3 + grain * 0.05,
      r: 0.8,
    };
  });
}

export function subwayTile(tint = 0xe8e6da, grout = 0x3a3d3a) {
  const base = hex(tint),
    g = hex(grout);
  return paint(`tile${tint}${grout}`, 512, (u, v) => {
    const rows = 8,
      cols = 4;
    const row = Math.floor(v * rows),
      off = row % 2 ? 0.5 : 0,
      cu = (u * cols + off) % 1,
      cv = (v * rows) % 1,
      col = Math.floor(u * cols + off);
    const id = hash(col, row);
    if (cu < 0.04 || cv < 0.08) return { c: g, h: 0, r: 0.9 };
    const bulge = Math.sin(cu * Math.PI) * Math.sin(cv * Math.PI);
    const shade = 0.93 + id * 0.08;
    return {
      c: [base[0] * shade, base[1] * shade, base[2] * shade],
      h: 0.6 + bulge * 0.4,
      r: 0.18 + (1 - bulge) * 0.1,
    };
  });
}

export function terrazzo(tint = 0xd9d3c4, seed = 3) {
  const base = hex(tint),
    chips: RGB[] = [
      [70, 70, 74],
      [190, 160, 120],
      [120, 130, 140],
      [210, 205, 195],
      [140, 90, 70],
    ];
  return paint(`terrazzo${tint}${seed}`, 512, (u, v) => {
    let c: RGB = base,
      h = 0.5,
      r = 0.35;
    for (let s = 0; s < 3; s++) {
      const f = 24 + s * 20;
      const n = noise2(u * f + seed * 5 + s * 40, v * f + s * 17);
      if (n > 0.78 - s * 0.03) {
        c = chips[Math.floor(hash(Math.floor(u * f), Math.floor(v * f) + s) * chips.length)];
        h = 0.55;
        r = 0.3;
      }
    }
    const grain = fbm(u * 64, v * 64, 2);
    return { c: [c[0] * (0.95 + grain * 0.1), c[1] * (0.95 + grain * 0.1), c[2] * (0.95 + grain * 0.1)], h, r };
  });
}

export function marble(tint = 0xe6e2da, vein = 0x8d8a80, seed = 4) {
  const base = hex(tint),
    vc = hex(vein);
  return paint(`marble${tint}${vein}${seed}`, 512, (u, v) => {
    const warp = fbm(u * 4 + seed, v * 4, 4, noise2);
    const line = Math.abs(Math.sin((u * 3 + v * 2 + warp * 4) * Math.PI));
    const veinAmt = Math.pow(1 - line, 14) * 0.8 + Math.pow(1 - Math.abs(Math.sin((v * 5 - u + warp * 3) * Math.PI)), 20) * 0.5;
    const cloud = fbm(u * 8, v * 8, 4) * 0.12;
    const c = mix(base, vc, clamp01(veinAmt));
    return {
      c: [c[0] * (0.94 + cloud), c[1] * (0.94 + cloud), c[2] * (0.94 + cloud)],
      h: 0.5 - veinAmt * 0.1,
      r: 0.22,
    };
  });
}

export function planks(tint = 0x7d5b3d, boards = 6, seed = 5, gapDark = 0.35) {
  const base = hex(tint);
  return paint(`planks${tint}${boards}${seed}`, 512, (u, v) => {
    const b = Math.floor(u * boards),
      cu = (u * boards) % 1,
      id = hash(b + seed, seed),
      gap = cu < 0.03,
      grain = fbm(u * 6 + id * 30, v * 90 + id * 10, 3, noise2),
      ring = Math.sin((v * 40 + grain * 6 + id * 9) * 0.9) * 0.5 + 0.5;
    if (gap) return { c: [base[0] * gapDark, base[1] * gapDark, base[2] * gapDark], h: 0, r: 0.9 };
    const shade = 0.78 + id * 0.3 + ring * 0.12 + (grain - 0.5) * 0.2;
    return {
      c: [base[0] * shade, base[1] * shade, base[2] * shade],
      h: 0.7 + ring * 0.2 + grain * 0.1,
      r: 0.6 + ring * 0.2,
    };
  });
}

export function boardwalk(tint = 0x8a6a48) {
  const base = hex(tint);
  return paint(`boardwalk${tint}`, 512, (u, v) => {
    const boards = 10;
    const b = Math.floor(v * boards),
      cv = (v * boards) % 1,
      id = hash(b, 3),
      gap = cv < 0.06,
      grain = fbm(u * 60 + id * 20, v * 4, 3, noise2);
    if (gap) return { c: [30, 26, 22], h: 0, r: 0.95 };
    const nail = ((u * 2) % 1 < 0.04 && cv > 0.45 && cv < 0.55) ? 1 : 0;
    const shade = 0.75 + id * 0.35 + (grain - 0.5) * 0.3;
    return {
      c: nail ? [70, 70, 72] : [base[0] * shade, base[1] * shade, base[2] * shade],
      h: 0.65 + grain * 0.2 + nail * 0.15,
      r: 0.75,
    };
  });
}

export function steel(tint = 0x3a444c, rivets = true, seed = 6) {
  const base = hex(tint);
  return paint(`steel${tint}${rivets}${seed}`, 512, (u, v) => {
    const scratch = Math.pow(fbm(u * 3, v * 60 + seed, 3, noise2), 3);
    const wear = fbm(u * 10, v * 10, 4);
    let h = 0.5 + wear * 0.05,
      r = 0.42 + wear * 0.25 + scratch * 0.2;
    let c: RGB = [base[0] * (0.85 + wear * 0.3), base[1] * (0.85 + wear * 0.3), base[2] * (0.85 + wear * 0.3)];
    if (rivets) {
      const gx = (u * 8) % 1,
        gy = (v * 8) % 1,
        d = Math.hypot(gx - 0.5, gy - 0.5);
      const edge = Math.abs(gx - 0.02) < 0.01 || Math.abs(gy - 0.02) < 0.01;
      if (d < 0.06) {
        h = 0.5 + Math.sqrt(Math.max(0, 1 - (d / 0.06) ** 2)) * 0.5;
        r = 0.35;
      } else if (edge) {
        h = 0.4;
        c = [c[0] * 0.8, c[1] * 0.8, c[2] * 0.8];
      }
    }
    const rust = fbm(u * 5 + 30, v * 5, 4, noise2) > 0.62 ? (fbm(u * 5 + 30, v * 5, 4, noise2) - 0.62) * 2 : 0;
    c = mix(c, [120, 66, 36], rust);
    return { c, h, r: r + rust * 0.4 };
  });
}

export function concrete(tint = 0x9c9a92, seed = 7) {
  const base = hex(tint);
  return paint(`concrete${tint}${seed}`, 512, (u, v) => {
    const a = fbm(u * 12 + seed, v * 12, 4),
      b = fbm(u * 60, v * 60, 3, noise2),
      pour = Math.abs(Math.sin(v * Math.PI * 2)) < 0.02 ? 0.85 : 1;
    const shade = (0.86 + (a - 0.5) * 0.24 + (b - 0.5) * 0.12) * pour;
    return { c: [base[0] * shade, base[1] * shade, base[2] * shade], h: 0.5 + b * 0.1, r: 0.88 };
  });
}

export function pavers(tint = 0x8f8b82, seed = 8) {
  const base = hex(tint);
  return paint(`pavers${tint}${seed}`, 512, (u, v) => {
    const n = 6;
    const cu = (u * n) % 1,
      cv = (v * n) % 1,
      col = Math.floor(u * n),
      row = Math.floor(v * n),
      id = hash(col + seed, row),
      joint = cu < 0.05 || cv < 0.05,
      grain = fbm(u * 40, v * 40, 3);
    if (joint) return { c: [60, 58, 54], h: 0, r: 0.95 };
    const shade = 0.82 + id * 0.3 + (grain - 0.5) * 0.15;
    return { c: [base[0] * shade, base[1] * shade, base[2] * shade], h: 0.7 + grain * 0.15, r: 0.8 };
  });
}

export function cobble(tint = 0x6f6c68, seed = 9) {
  const base = hex(tint);
  return paint(`cobble${tint}${seed}`, 512, (u, v) => {
    const n = 8;
    const row = Math.floor(v * n),
      off = row % 2 ? 0.5 : 0,
      cu = (u * n + off) % 1,
      cv = (v * n) % 1,
      col = Math.floor(u * n + off),
      id = hash(col + seed, row),
      dome = Math.sin(cu * Math.PI) * Math.sin(cv * Math.PI);
    if (dome < 0.25) return { c: [40, 38, 36], h: 0, r: 0.95 };
    const shade = 0.75 + id * 0.4 + dome * 0.15;
    return { c: [base[0] * shade, base[1] * shade, base[2] * shade], h: dome, r: 0.55 + (1 - dome) * 0.3 };
  });
}

export function asphalt(tint = 0x24282d) {
  const base = hex(tint);
  return paint(`asphalt${tint}`, 512, (u, v) => {
    const g = fbm(u * 90, v * 90, 3, noise2),
      patch = fbm(u * 5, v * 5, 3),
      crack = Math.pow(1 - Math.abs(Math.sin((u * 2 + fbm(u * 3, v * 3, 3) * 3) * Math.PI)), 40);
    const shade = 0.75 + g * 0.5 + (patch - 0.5) * 0.3 - crack * 0.5;
    return { c: [base[0] * shade, base[1] * shade, base[2] * shade], h: 0.5 + g * 0.1 - crack * 0.3, r: 0.62 + patch * 0.2 };
  });
}

export function velvet(tint = 0x7a1f2b) {
  const base = hex(tint);
  return paint(`velvet${tint}`, 256, (u, v) => {
    const fold = Math.sin(u * Math.PI * 12) * 0.5 + 0.5,
      g = fbm(u * 30, v * 30, 3);
    const shade = 0.7 + fold * 0.45 + (g - 0.5) * 0.15;
    return { c: [base[0] * shade, base[1] * shade, base[2] * shade], h: fold, r: 1 };
  });
}

export function patina(tint = 0x5f9a8c) {
  const base = hex(tint);
  return paint(`patina${tint}`, 512, (u, v) => {
    const a = fbm(u * 6, v * 6, 4),
      b = fbm(u * 24, v * 24, 3, noise2);
    const c = mix(base, [92, 70, 52], clamp01((a - 0.55) * 3));
    const shade = 0.85 + (b - 0.5) * 0.3;
    return { c: [c[0] * shade, c[1] * shade, c[2] * shade], h: 0.5 + b * 0.1, r: 0.6 + a * 0.3 };
  });
}

export function gilt(tint = 0xd0a852) {
  const base = hex(tint);
  return paint(`gilt${tint}`, 256, (u, v) => {
    const g = fbm(u * 20, v * 20, 3),
      leaf = hash(Math.floor(u * 8), Math.floor(v * 8));
    const shade = 0.88 + (g - 0.5) * 0.2 + leaf * 0.08;
    return { c: [base[0] * shade, base[1] * shade, base[2] * shade], h: 0.5 + g * 0.05, r: 0.28 + g * 0.15 };
  });
}

export function carpet(tint = 0x3b2540, accent = 0xc79a4a) {
  const base = hex(tint),
    ac = hex(accent);
  return paint(`carpet${tint}${accent}`, 512, (u, v) => {
    const d = Math.abs(((u * 4) % 1) - 0.5) + Math.abs(((v * 4) % 1) - 0.5);
    const ring = Math.abs(d - 0.32) < 0.03 || d < 0.05;
    const fuzz = fbm(u * 80, v * 80, 2, noise2);
    const c = ring ? ac : base;
    const shade = 0.85 + fuzz * 0.3;
    return { c: [c[0] * shade, c[1] * shade, c[2] * shade], h: 0.5 + fuzz * 0.1, r: 1 };
  });
}

/* Encaustic ceiling tile: the Bethesda arcade's patterned field, drawn as a
   rosette repeat rather than a photograph of the real Minton tiles. */
export function minton() {
  return paint('minton', 512, (u, v) => {
    const cu = (u * 2) % 1,
      cv = (v * 2) % 1,
      dx = cu - 0.5,
      dy = cv - 0.5,
      d = Math.hypot(dx, dy),
      ang = Math.atan2(dy, dx),
      petal = Math.abs(Math.cos(ang * 4)) * 0.22 + 0.08;
    let c: RGB = [182, 120, 78],
      h = 0.5;
    if (Math.abs(dx) < 0.02 || Math.abs(dy) < 0.02) {
      c = [212, 196, 150];
      h = 0.45;
    }
    if (d < petal) {
      c = [58, 96, 100];
      h = 0.55;
    }
    if (d < 0.06) c = [214, 176, 96];
    const corner = Math.min(cu, 1 - cu) < 0.09 && Math.min(cv, 1 - cv) < 0.09;
    if (corner) c = [64, 92, 96];
    const g = fbm(u * 40, v * 40, 2);
    return { c: [c[0] * (0.92 + g * 0.16), c[1] * (0.92 + g * 0.16), c[2] * (0.92 + g * 0.16)], h, r: 0.35 };
  });
}

export function grass(tint = 0x4b6b3a, seed = 10) {
  const base = hex(tint);
  return paint(`grass${tint}${seed}`, 512, (u, v) => {
    const a = fbm(u * 8 + seed, v * 8, 4),
      b = fbm(u * 70, v * 70, 3, noise2),
      dry = clamp01((a - 0.55) * 2.5);
    const c = mix(base, [140, 128, 70], dry);
    const shade = 0.75 + b * 0.5;
    return { c: [c[0] * shade, c[1] * shade, c[2] * shade], h: 0.5 + b * 0.3, r: 0.95 };
  });
}

export function bark(tint = 0x5a4634) {
  const base = hex(tint);
  return paint(`bark${tint}`, 256, (u, v) => {
    const g = fbm(u * 24, v * 4, 4, noise2);
    const shade = 0.6 + g * 0.7;
    return { c: [base[0] * shade, base[1] * shade, base[2] * shade], h: g, r: 0.95 };
  });
}

export function plaster(tint = 0xe4ded2, seed = 11) {
  const base = hex(tint);
  return paint(`plaster${tint}${seed}`, 512, (u, v) => {
    const a = fbm(u * 10 + seed, v * 10, 4),
      b = fbm(u * 50, v * 50, 2, noise2);
    const shade = 0.9 + (a - 0.5) * 0.12 + (b - 0.5) * 0.06;
    return { c: [base[0] * shade, base[1] * shade, base[2] * shade], h: 0.5 + a * 0.1, r: 0.85 };
  });
}

export function stars(density = 0.0016, seed = 12) {
  return paint(`stars${density}${seed}`, 1024, (u, v) => {
    const cell = 64;
    const cx = Math.floor(u * cell),
      cy = Math.floor(v * cell),
      id = hash(cx + seed, cy),
      sx = hash(cx, cy + 40),
      sy = hash(cx + 7, cy + 3),
      d = Math.hypot((u * cell) % 1 - sx, (v * cell) % 1 - sy);
    const on = id < density * 500 ? Math.max(0, 1 - d / (0.05 + id * 0.1)) : 0;
    const glow = Math.pow(on, 2);
    return { c: [40 + glow * 215, 60 + glow * 195, 90 + glow * 165], h: 0.5, r: 1, e: glow };
  }, { emissive: true });
}

/* Building facades for the skylines. The emissive channel carries the lit
   windows so towers glow at night without extra lights. */
export function windows(seed = 13, lit = 0.35, tint = 0x2a3542, warm = true) {
  const base = hex(tint);
  return paint(`windows${seed}${lit}${tint}${warm}`, 256, (u, v) => {
    const cols = 6,
      rows = 12;
    const cu = (u * cols) % 1,
      cv = (v * rows) % 1,
      col = Math.floor(u * cols),
      row = Math.floor(v * rows),
      id = hash(col + seed * 17, row + seed);
    const inWin = cu > 0.22 && cu < 0.78 && cv > 0.2 && cv < 0.7;
    if (!inWin) {
      const g = fbm(u * 20, v * 20, 2);
      return { c: [base[0] * (0.85 + g * 0.3), base[1] * (0.85 + g * 0.3), base[2] * (0.85 + g * 0.3)], h: 0.6, r: 0.8, e: 0 };
    }
    if (id < lit) {
      const w = hash(row, col + 5);
      const c: RGB = warm ? [255, 214 - w * 50, 150 - w * 60] : [200, 230, 255];
      return { c, h: 0.4, r: 0.3, e: 0.75 + w * 0.25 };
    }
    return { c: [50, 70, 90], h: 0.4, r: 0.15, e: 0 };
  }, { emissive: true });
}

/* Soft radial light pool used as a wall wash behind each framed work. */
export function pool(): T.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!,
    grad = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255,255,255,0.55)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.14)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  return t;
}

/* Gradient sky drawn as an equirectangular canvas: also feeds the PBR
   environment so metal and glass reflect the same evening. */
export function skyCanvas(
  top: number,
  horizon: number,
  ground: number,
  opts: { sun?: { az: number; el: number; color: number; size: number }; stars?: number; haze?: number } = {},
) {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 1024;
  const g = c.getContext('2d')!;
  g.scale(2, 2);
  const grad = g.createLinearGradient(0, 0, 0, 512);
  const h = (n: number) => '#' + n.toString(16).padStart(6, '0');
  grad.addColorStop(0, h(top));
  grad.addColorStop(0.42, h(horizon));
  grad.addColorStop(0.5, h(horizon));
  grad.addColorStop(0.56, h(ground));
  grad.addColorStop(1, h(ground));
  g.fillStyle = grad;
  g.fillRect(0, 0, 1024, 512);
  if (opts.haze) {
    const hz = g.createLinearGradient(0, 200, 0, 256);
    hz.addColorStop(0, 'rgba(255,255,255,0)');
    hz.addColorStop(1, `rgba(255,240,220,${opts.haze})`);
    g.fillStyle = hz;
    g.fillRect(0, 200, 1024, 56);
  }
  if (opts.stars) {
    const r = mulberry(21);
    for (let i = 0; i < opts.stars; i++) {
      const x = r() * 1024,
        y = r() * 230,
        s = r();
      g.fillStyle = `rgba(255,255,255,${0.2 + s * 0.6})`;
      const d = s > 0.96 ? 0.9 : 0.5;
      g.fillRect(x, y, d, d);
    }
  }
  if (opts.sun) {
    const x = ((opts.sun.az / (Math.PI * 2)) % 1 + 1) % 1 * 1024,
      y = 256 - (opts.sun.el / (Math.PI / 2)) * 256,
      col = h(opts.sun.color);
    const glow = g.createRadialGradient(x, y, 0, x, y, opts.sun.size * 6);
    glow.addColorStop(0, col);
    glow.addColorStop(0.15, col + 'aa');
    glow.addColorStop(1, col + '00');
    g.fillStyle = glow;
    g.fillRect(x - opts.sun.size * 6, y - opts.sun.size * 6, opts.sun.size * 12, opts.sun.size * 12);
    g.fillStyle = '#fff8e8';
    g.beginPath();
    g.arc(x, y, opts.sun.size, 0, Math.PI * 2);
    g.fill();
  }
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  t.mapping = T.EquirectangularReflectionMapping;
  return t;
}

/* Text plate in the site's caption style. */
export function plate(
  lines: { text: string; color: string; size: number; font?: string }[],
  w: number,
  h: number,
  bg = 'rgba(13,13,13,0.92)',
  border = 'rgba(240,244,248,0.28)',
) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  if (border) {
    g.fillStyle = border;
    g.fillRect(0, 0, w, 2);
  }
  let y = h * 0.16;
  for (const l of lines) {
    g.fillStyle = l.color;
    g.font = `${l.font || '500'} ${l.size}px ${l.font?.includes('serif') ? l.font : 'Menlo, Consolas, monospace'}`;
    g.textBaseline = 'top';
    g.fillText(l.text, w * 0.04, y, w * 0.92);
    y += l.size * 1.45;
  }
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function signText(
  text: string,
  w: number,
  h: number,
  bg: string,
  fg: string,
  size: number,
  opts: { border?: boolean; font?: string; align?: CanvasTextAlign } = {},
) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  if (opts.border) {
    g.strokeStyle = fg;
    g.lineWidth = Math.max(2, h * 0.03);
    g.strokeRect(h * 0.06, h * 0.06, w - h * 0.12, h - h * 0.12);
  }
  g.fillStyle = fg;
  g.font = `${opts.font || '700'} ${size}px ${opts.font?.includes('Georgia') ? 'Georgia, serif' : 'Helvetica Neue, Arial, sans-serif'}`;
  g.textAlign = opts.align || 'center';
  g.textBaseline = 'middle';
  g.fillText(text, opts.align === 'left' ? w * 0.05 : w / 2, h / 2, w * 0.92);
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
