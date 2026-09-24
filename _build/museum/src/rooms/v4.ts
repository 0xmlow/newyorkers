/* 147 and 148: two Midtown rooms on the same few blocks of Fifth Avenue.
   The open air deck on the eighty sixth floor of the Empire State Building at golden hour, with the
   Art Deco lobby a lift ride below it, and the nave of St. Patrick's Cathedral with its rose window,
   its baldachin and a few hundred candles. The city around the deck is real geography out to about
   eight kilometres: anything past eight hundred metres is pulled in toward the visitor along its own
   line of sight and shrunk by the same factor, so from the deck it subtends exactly the angle it
   would, and the camera's far plane never cuts the horizon. */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as X from '../textures';
import { v, type Mount } from '../kit';
import type { RoomDef } from './types';
const PI = Math.PI;
type K = Parameters<RoomDef['build']>[0];
const one = new T.Vector3(1, 1, 1);

/* translucent puffs that rise, spread and fade: dust in a light beam, steam */
function vapour(k: K, pts: T.Vector3[], perPt: number, p: { rise?: number; spread?: number; size?: number; opacity?: number; colour?: number; seed?: number; speed?: number; animate: boolean; additive?: boolean }) {
  const { rise = 1.4, spread = 0.5, size = 0.1, opacity = 0.2, colour = 0xffffff, seed = 1, speed = 0.28, animate, additive = false } = p;
  const n = pts.length * perPt, rnd = X.mulberry(seed);
  const o = k.instances(new T.SphereGeometry(size, 6, 5), new T.MeshBasicMaterial({ color: colour, transparent: true, opacity, depthWrite: false, blending: additive ? T.AdditiveBlending : T.NormalBlending }), Array.from({ length: n }, () => new T.Matrix4()));
  o.frustumCulled = false;
  const ph = Array.from({ length: n }, (_, i) => ({ b: pts[i % pts.length], o: rnd(), dx: (rnd() - 0.5) * spread, dz: (rnd() - 0.5) * spread }));
  const m = new T.Matrix4(), q = new T.Quaternion(), pos = new T.Vector3(), s = new T.Vector3();
  const place = (t: number) => {
    ph.forEach((a, i) => {
      const u = (t * speed + a.o) % 1, sc = 0.6 + u * 2.4;
      pos.set(a.b.x + a.dx * (1 + u * 3), a.b.y + u * rise, a.b.z + a.dz * (1 + u * 3));
      s.setScalar(sc * (1 - u * 0.35));
      m.compose(pos, q, s);
      o.setMatrixAt(i, m);
    });
    o.instanceMatrix.needsUpdate = true;
  };
  place(0.4);
  if (animate) k.ticks.push(place);
  return o;
}
/* a standing figure that never moves: batched with everything else of its colour */
function figure(k: K, x: number, y: number, z: number, coat: number, p: { h?: number; rotY?: number; crouch?: number } = {}) {
  const { h = 1, rotY = 0, crouch = 1 } = p;
  const body = k.mesh(new T.CapsuleGeometry(0.2, 0.82 * h * crouch, 3, 8), k.flat(coat, 0, 0.85), x, y + 0.61 * h * crouch, z);
  body.rotation.y = rotY;
  k.mesh(new T.SphereGeometry(0.125, 10, 8), k.flat(0xc8a284, 0, 0.7), x, y + (1.22 * h * crouch + 0.13), z);
  return body;
}
/* a small figure with a head, as one merged geometry for instancing */
function figureGeo(r = 0.2, len = 0.82, headY = 1.35) {
  const body = new T.CapsuleGeometry(r, len, 3, 8); body.translate(0, r + len / 2, 0);
  const head = new T.SphereGeometry(r * 0.62, 10, 8); head.translate(0, headY, 0);
  return mergeGeometries([body, head])!;
}
/* a texture painted once on a canvas; UVs are kept because the material carries no density */
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat = false) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) t.wrapS = t.wrapT = T.RepeatWrapping;
  return t;
}
const hex = (n: number) => '#' + n.toString(16).padStart(6, '0');

/* ---------------- 147 THE EIGHTY SIXTH FLOOR ---------------- */
export const empirestate: RoomDef = {
  id: 'empirestate',
  name: 'The eighty sixth floor',
  area: 'EMPIRE STATE BUILDING / 34TH STREET',
  mood: 'Golden hour, a thousand and fifty feet up',
  color: '#c9a54a',
  daylit: false,
  description: 'The open air terrace that wraps the eighty sixth floor, a thousand and fifty feet over Fifth Avenue at golden hour: the steel fence curling in over the parapet, the coin binoculars, the mast climbing to the antenna behind you, and the whole island laid out below, Midtown and the Chrysler to the north, the Hudson on fire to the west, the East River and Queens to the east. The New Yorkers hang on the limestone of the enclosed observatory between its windows, and more hang a lift ride down, in the Art Deco lobby under the gold and aluminium ceiling.',
  signatures: 'The 86th floor terrace with its limestone parapet and curved steel fence, the coin operated binoculars, the enclosed observatory, the mooring mast with its aluminium fins, the 102nd floor drum and the antenna, the Chrysler Building, One Vanderbilt and Grand Central below it, Hudson Yards, Madison Square Garden, Central Park and Billionaires\' Row, One World Trade Center downtown, both rivers with their boats, and the lobby with its ceiling and the aluminium relief of the building.',
  build(k, ctx) {
    /* golden hour in late September: the sun going down over New Jersey, a little south of the cross streets */
    const SUN = 2 * PI - 0.5;
    k.sky({ top: 0x2a5fb0, horizon: 0xf4c898, ground: 0x9a8a7c, fog: 0.00044, sun: { az: SUN, el: 0.16, color: 0xffc070, size: 14 }, haze: 0.3, env: 0.75 });
    k.hemi(0xc4d6f0, 0x8a8478, 0.8);
    k.sun(0xffd4a0, 3.4, -250, 110, 140, true, 36);
    const EYE = 3, R0 = 800, C = 0.05;
    const warpS = (x: number, z: number) => { const r = Math.hypot(x, z); return r <= R0 ? 1 : (R0 + (r - R0) * C) / r; };
    const W = (x: number, y: number, z: number) => { const s = warpS(x, z); return v(x * s, EYE + (y - EYE) * s, z * s); };
    const GY = -320;

    const lime = k.pbr('esLime', X.ashlar(0xcfc3aa, 81, 6), 0.22, { normal: 0.35 }), limeDark = k.pbr('esLime2', X.ashlar(0xa89a82, 82, 4), 0.5),
      deckFloor = k.pbr('esDeck', X.pavers(0x9a8e80, 83), 0.9, { roughness: 0.85 }),
      alu = k.flat(0xd8dade, 0.85, 0.32), steelDark = k.flat(0x2a2d31, 0.7, 0.45), dark = k.flat(0x14171b, 0.3, 0.7),
      darkGlass = k.flat(0x2a3848, 0.85, 0.12, { emissive: 0xffc890, emissiveIntensity: 0.05 }), brass = k.flat(0xc9a25a, 0.9, 0.3),
      tar = k.flat(0x3a3836, 0, 0.95), gravel = k.flat(0x6e6a64, 0, 0.95), roofGreen = k.flat(0x4a5a44, 0, 0.95), roofLight = k.flat(0x9a948a, 0, 0.9);

    /* ---------- the ground: a painted map of the harbour, true geography, drawn once ---------- */
    const AV = [-1850, -1620, -1340, -1060, -780, -500, -220, 64, 190, 315, 440, 565, 760, 955];
    const zSt = (n: number) => -33 - (n - 34) * 80.6;
    const xw = (z: number) => (z < 3000 ? -1900 : z < 5600 ? -1900 + ((z - 3000) / 2600) * 1000 : -900);
    const xe = (z: number) => {
      if (z < -6000) return 700;
      if (z < 1000) return 1150;
      if (z < 2800) return 1500;
      if (z < 4400) return 1500 - ((z - 2800) / 1600) * 800;
      if (z < 5600) return 700 - ((z - 4400) / 1200) * 800;
      return -100;
    };
    const land = (x: number, z: number): 'm' | 'p' | 'w' | 'b' => {
      if (z < 5750 && x > xw(z) && x < xe(z)) {
        if (x > -850 && x < 0 && z > -6100 && z < -2000) return 'p';
        if (x > -220 && x < -30 && z > -673 && z < -513) return 'p';
        if (x > 64 && x < 190 && z > 607 && z < 847) return 'p';
        return 'm';
      }
      if (x < -3300 && z < 6500) return 'b';
      if (z < 1500 && x > xe(z) + 450) return 'b';
      if (z >= 1500 && z < 6200 && x > xe(z) + 400) return 'b';
      if (z >= 6200 && x > 700 + (z - 6200) * 0.35) return 'b';
      if (Math.hypot(x - 300, z - 6700) < 320) return 'b';
      if (x > xe(z) + 130 && x < xe(z) + 300 && z > -4500 && z < -1100) return 'b';
      return 'w';
    };
    {
      const SZ = 1024, EXT = 9000;
      const col = canvasTex(SZ, SZ, (g) => {
        const img = g.createImageData(SZ, SZ);
        const rnd = X.mulberry(711);
        for (let j = 0; j < SZ; j++) for (let i = 0; i < SZ; i++) {
          const x = (i / SZ) * 2 * EXT - EXT, z = (j / SZ) * 2 * EXT - EXT, t = land(x, z), o = (j * SZ + i) * 4, n = 0.92 + rnd() * 0.12;
          const c = t === 'w' ? [70, 92, 112] : t === 'p' ? [64, 92, 52] : t === 'm' ? [88, 86, 84] : [102, 96, 88];
          img.data[o] = c[0] * n; img.data[o + 1] = c[1] * n; img.data[o + 2] = c[2] * n; img.data[o + 3] = 255;
        }
        g.putImageData(img, 0, 0);
      });
      col.flipY = false;
      const rm = canvasTex(SZ, SZ, (g) => {
        const img = g.createImageData(SZ, SZ);
        for (let j = 0; j < SZ; j++) for (let i = 0; i < SZ; i++) {
          const x = (i / SZ) * 2 * EXT - EXT, z = (j / SZ) * 2 * EXT - EXT, w = land(x, z) === 'w', o = (j * SZ + i) * 4;
          img.data[o] = 0; img.data[o + 1] = w ? 70 : 250; img.data[o + 2] = w ? 150 : 0; img.data[o + 3] = 255;
        }
        g.putImageData(img, 0, 0);
      });
      rm.flipY = false; rm.colorSpace = T.NoColorSpace;
      /* a polar grid in true coordinates, every vertex pulled in by the warp */
      const RINGS = 70, SEG = 160, pos: number[] = [], uv: number[] = [], idx: number[] = [];
      const rr = (i: number) => (i === 0 ? 0 : 40 * Math.pow(8400 / 40, (i - 1) / (RINGS - 1)));
      for (let i = 0; i <= RINGS; i++) for (let j = 0; j <= SEG; j++) {
        const a = (j / SEG) * PI * 2, r = rr(i), x = Math.cos(a) * r, z = Math.sin(a) * r, p = W(x, GY, z);
        pos.push(p.x, p.y, p.z); uv.push((x + EXT) / (2 * EXT), (z + EXT) / (2 * EXT));
      }
      for (let i = 0; i < RINGS; i++) for (let j = 0; j < SEG; j++) { const a = i * (SEG + 1) + j, b = a + SEG + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      k.scene.add(new T.Mesh(g, new T.MeshStandardMaterial({ map: col, roughnessMap: rm, metalnessMap: rm, roughness: 1, metalness: 1, envMapIntensity: 1.1 })));
    }

    /* ---------- the city: every block of the grid, lots on each, true heights ---------- */
    const facadeSurf = [X.windows(41, 0.06, 0x8a5a48, true), X.windows(42, 0.07, 0xb8ae9c, true), X.windows(43, 0.05, 0x4a6a8a, false), X.windows(44, 0.08, 0x62666e, true)];
    const bandOf = (s: number) => (s > 0.75 ? 1 : s > 0.4 ? 0.5 : s > 0.22 ? 0.28 : s > 0.13 ? 0.16 : 0.1);
    const facade = (kind: number, s: number, glow = 0) => { const b = bandOf(s); return k.pbr('esF' + kind + '_' + b + '_' + glow, facadeSurf[kind], 0.1 / b, { emissive: 0xffffff, emissiveIntensity: 0.4 + glow, roughness: kind === 2 ? 0.25 : 0.8, metalness: kind === 2 ? 0.55 : 0, stretch: 0.25 }); };
    const roofs = [tar, gravel, roofLight, tar, roofGreen];
    /* the city is thousands of boxes: build them as bare side and roof quads, one mesh per material,
       kept out of the kit's batch so they never enter the shadow pass */
    const city = new Map<T.Material, { p: number[]; n: number[]; u: number[] }>();
    const buf = (m: T.Material) => { let b = city.get(m); if (!b) { b = { p: [], n: [], u: [] }; city.set(m, b); } return b; };
    const quad = (m: T.Material, q: number[][], nx: number, ny: number, nz: number, dens: number, ax: 0 | 2) => {
      const b = buf(m);
      for (const i of [0, 1, 2, 0, 2, 3]) { const [x, y, z] = q[i]; b.p.push(x, y, z); b.n.push(nx, ny, nz); b.u.push((ny ? x : ax === 0 ? x : z) * dens, (ny ? z : y) * dens); }
    };
    const cityBox = (w: number, h: number, d: number, cx: number, cy: number, cz: number, side: T.Material, top: T.Material | null) => {
      const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2, z0 = cz - d / 2, z1 = cz + d / 2, dn = ((side as T.MeshStandardMaterial).userData?.density as number) || 0.1;
      quad(side, [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], 0, 0, 1, dn, 0);
      quad(side, [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], 0, 0, -1, dn, 0);
      quad(side, [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], 1, 0, 0, dn, 2);
      quad(side, [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], -1, 0, 0, dn, 2);
      quad(top ?? side, [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], 0, 1, 0, dn, 0);
    };
    /* a building in true coordinates: base on the ground, its roof, sometimes a setback or a water tower */
    const bld = (x: number, z: number, w: number, d: number, h: number, kind: number, rnd: () => number) => {
      const s = warpS(x, z), c = W(x, GY + h / 2, z), mat = facade(kind, s);
      const roof = roofs[Math.floor(rnd() * roofs.length)];
      cityBox(w * s, h * s, d * s, c.x, c.y, c.z, mat, roof);
      if (h > 90 && rnd() > 0.45) { const h2 = h * (0.12 + rnd() * 0.18), c2 = W(x, GY + h + h2 / 2, z); cityBox(w * 0.62 * s, h2 * s, d * 0.62 * s, c2.x, c2.y, c2.z, mat, tar); }
      else if (s === 1 && h < 60 && Math.hypot(x, z) < 520 && rnd() > 0.6) {
        /* a water tower on a near roof */
        const tx = x + (rnd() - 0.5) * w * 0.5, tz = z + (rnd() - 0.5) * d * 0.5;
        k.cyl(1.9, 4, tx, GY + h + 4, tz, k.flat(0x6a4a34, 0, 0.9), 1.9, 8);
        k.cyl(2.1, 1.6, tx, GY + h + 6.8, tz, k.flat(0x4a3a2c, 0, 0.9), 0.1, 8);
        k.box(3.2, 2, 3.2, tx, GY + h + 1, tz, steelDark);
      }
    };
    const skip = (x: number, z: number) => Math.abs(x) < 70 && Math.abs(z) < 34;
    {
      const rnd = X.mulberry(1931);
      const heightAt = (x: number, z: number) => {
        const r = rnd();
        if (z < -2000) return x > -1000 && x < 200 ? 30 + r * 40 : 35 + r * 70 + (z > -2300 ? 60 * r * r : 0);
        if (z < -330) { if (z > -760 && x > 120 && x < 700) return 30 + r * r * 110; return x < -1100 ? 30 + r * 60 : 40 + r * r * 210 + (r > 0.94 ? 40 : 0); }
        if (z < 700) return x < -1300 ? 25 + r * 50 : 22 + r * r * 120 + (r > 0.92 ? 60 : 0);
        if (z < 2000) return 18 + r * 45 + (r > 0.95 ? 60 : 0);
        if (z < 3700) return 12 + r * 28;
        if (z < 4300) return 25 + r * 70;
        return x < 700 && x > -800 ? 60 + r * 150 : 25 + r * 60;
      };
      /* Manhattan: avenues and streets north of Houston, a looser weave below it */
      for (let n = 1; n < 190; n++) {
        const z0 = zSt(n + 1) + 9, z1 = zSt(n) - 9, zc = (z0 + z1) / 2, dd = z1 - z0;
        if (zc < -9000) break;
        for (let a = 0; a < AV.length - 1; a++) {
          const xa = Math.max(AV[a] + 15, xw(zc) + 20), xb = Math.min(AV[a + 1] - 15, xe(zc) - 20);
          if (xb - xa < 20) continue;
          const xm = (xa + xb) / 2, r = Math.hypot(xm, zc);
          if (land(xm, zc) !== 'm') continue;
          const lots = r < 1300 ? Math.max(2, Math.round((xb - xa) / 32)) : r < 3500 ? 2 : 1;
          const half = r < 1300;
          for (let l = 0; l < lots; l++) {
            const lx0 = xa + ((xb - xa) * l) / lots, lx1 = xa + ((xb - xa) * (l + 1)) / lots, lx = (lx0 + lx1) / 2;
            if (skip(lx, zc)) continue;
            const rows = half ? [[z0 + dd * 0.25, dd * 0.48], [z0 + dd * 0.75, dd * 0.48]] : [[zc, dd]];
            for (const [lz, ld] of rows) {
              if (skip(lx, lz)) continue;
              const h = heightAt(lx, lz);
              bld(lx, lz, lx1 - lx0 - 2.5, ld - 2, h, h > 110 ? (rnd() > 0.5 ? 2 : 3) : rnd() > 0.55 ? 0 : 1, rnd);
            }
          }
        }
      }
      for (let z = 2750; z < 5750; z += 110) for (let x = -1800; x < 1500; x += 120) {
        const jx = x + (rnd() - 0.5) * 40, jz = z + (rnd() - 0.5) * 40;
        if (land(jx, jz) !== 'm' || land(jx + 40, jz) !== 'm' || land(jx - 40, jz) !== 'm') continue;
        const h = heightAt(jx, jz);
        bld(jx, jz, 60 + rnd() * 30, 60 + rnd() * 30, h, h > 110 ? 2 : Math.floor(rnd() * 2), rnd);
      }
      /* the other shores: Queens, Brooklyn and New Jersey, lower and looser, with their own clusters */
      for (let z = -8200; z < 8200; z += 190) for (let x = -8200; x < 8200; x += 190) {
        const jx = x + (rnd() - 0.5) * 60, jz = z + (rnd() - 0.5) * 60;
        if (Math.hypot(jx, jz) > 8200 || land(jx, jz) !== 'b' || land(jx + 70, jz) !== 'b' || land(jx - 70, jz) !== 'b') continue;
        const lic = jx > 1600 && jx < 2400 && jz > -1100 && jz < 300, bk = jx > 1300 && jx < 2300 && jz > 4900 && jz < 6300, jc = jx < -3300 && jx > -4300 && jz > 3400 && jz < 5600;
        const h = lic || bk || jc ? 40 + rnd() * 140 : 8 + rnd() * 18;
        bld(jx, jz, 70 + rnd() * 50, 70 + rnd() * 50, h, h > 60 ? 2 + Math.floor(rnd() * 2) : Math.floor(rnd() * 2) * 3 % 4, rnd);
      }
    }
    /* ---------- the landmarks, each at its true corner ---------- */
    const glassBlue = (s: number) => k.pbr('esGl' + bandOf(s), X.windows(51, 0.2, 0x40607e, false), 0.12 / bandOf(s), { emissive: 0xffffff, emissiveIntensity: 0.6, metalness: 0.6, roughness: 0.2, stretch: 0.3 });
    const steelBright = k.flat(0xe4e6ea, 1, 0.22);
    /* a tapering tower of stacked tiers, true coordinates */
    const tower = (x: number, z: number, tiers: [number, number, number][], mat: (s: number) => T.Material, cap?: { h: number; r: number; m: T.Material }) => {
      const s = warpS(x, z); let y = GY;
      for (const [w, d, h] of tiers) { const c = W(x, y + h / 2, z); cityBox(w * s, h * s, d * s, c.x, c.y, c.z, mat(s), tar); y += h; }
      if (cap) { const c = W(x, y + cap.h / 2, z); k.cyl(cap.r * s, cap.h * s, c.x, c.y, c.z, cap.m, 0.05 * s * cap.r, 8); }
      return y;
    };
    const blue = (s: number) => glassBlue(s), limeF = (s: number) => facade(1, s), darkF = (s: number) => facade(3, s);
    /* One Vanderbilt: a tapering glass tower at Madison and 42nd, taller than where you stand */
    { const t = tower(250, -620, [[62, 52, 140], [54, 46, 110], [46, 38, 80], [36, 30, 60], [24, 20, 26]], blue); const c = W(250, t + 5, -620); k.cyl(3, 10, c.x, c.y, c.z, steelBright, 0.4, 8); }
    /* Bank of America Tower at Sixth and 42nd, with its spire */
    tower(-190, -650, [[60, 50, 200], [48, 40, 60], [34, 28, 28]], blue, { h: 78, r: 1.4, m: steelBright });
    /* MetLife over Grand Central: the broad slab across Park Avenue */
    tower(315, -880, [[92, 44, 30], [88, 40, 216]], darkF);
    k.box(90, 34, 60, 315, GY + 17, -700, lime);
    /* the Times building on Eighth */
    tower(-780, -600, [[58, 48, 228]], blue, { h: 90, r: 1.2, m: steelDark });
    /* the Chrysler Building, Lexington and 42nd: shaft, the terraced crown of arches, the needle */
    {
      const CX = 480, CZ = -660, s = 1, crownY = GY + 224;
      const shaft = facade(3, s, 0.2);
      k.box(62 * s, 60 * s, 62 * s, CX * s, GY + 30, CZ * s, shaft);
      k.box(40 * s, 164 * s, 40 * s, CX * s, GY + 60 + 82, CZ * s, shaft);
      for (let i = 0; i < 7; i++) {
        const w = 32 - i * 4.1, y = crownY + i * 8.2;
        k.box(w, 8.4, w, CX, y + 4.2, CZ, steelBright);
        for (let f = 0; f < 4; f++) {
          const arc = new T.Mesh(new T.TorusGeometry(w * 0.48, 0.45, 5, 20, PI), steelBright);
          const a = (f * PI) / 2; arc.position.set(CX + Math.sin(a) * (w / 2 + 0.3), y + 3, CZ + Math.cos(a) * (w / 2 + 0.3)); arc.rotation.y = a; k.scene.add(arc); k.objects.push(arc);
          for (let tri = -2; tri <= 2; tri++) { const tw = new T.Mesh(new T.ConeGeometry(0.9, 2.2, 3), k.glow(0xffe2b0, 0.9)); tw.position.set(CX + Math.sin(a) * (w / 2 + 0.35) + Math.cos(a) * tri * w * 0.16, y + 3.4, CZ + Math.cos(a) * (w / 2 + 0.35) - Math.sin(a) * tri * w * 0.16); k.scene.add(tw); k.objects.push(tw); }
        }
      }
      k.cyl(2.4, 40, CX, crownY + 7 * 8.2 + 20, CZ, steelBright, 0.1, 8);
      for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) k.box(3, 3, 3, CX + dx * 20, GY + 224 - 30, CZ + dz * 20, steelBright);
    }
    /* Grand Central's roof, the library and Bryant Park stay low; Madison Square Garden is a drum */
    { const c = W(-640, GY + 24, 130); k.cyl(70, 48, c.x, c.y, c.z, facade(3, 1), 70, 40); k.cyl(72, 2, c.x, GY + 49, c.z, gravel, 72, 40); }
    k.box(110, 30, 60, -60, GY + 15, -590, lime);
    /* Hudson Yards on the far West Side, and the Edge sticking out of 30 */
    {
      const hy: [number, number, number, number, number][] = [[-1520, 130, 58, 52, 387], [-1410, 250, 50, 44, 268], [-1500, -110, 52, 46, 308], [-1300, 20, 60, 50, 300], [-1180, -60, 60, 60, 303], [-1100, -40, 54, 54, 300]];
      hy.forEach(([x, z, w, d, h], i) => tower(x, z, [[w, d, h * 0.55], [w * 0.9, d * 0.88, h * 0.3], [w * 0.74, d * 0.74, h * 0.15]], i % 2 ? darkF : blue));
      const s = warpS(-1520, 130), c = W(-1520 + 38, GY + 344, 130); k.box(26 * s, 3 * s, 16 * s, c.x, c.y, c.z, steelBright);
    }
    /* Billionaires' Row on 57th, and the Park beyond it */
    {
      const row: [number, number, number, number][] = [[-700, -1870, 472, 40], [-180, -1880, 435, 20], [320, -1885, 426, 29], [-420, -1880, 306, 40], [-130, -1600, 320, 32], [-600, -1960, 290, 36]];
      row.forEach(([x, z, h, w], i) => tower(x, z, [[w, w, h * 0.9], [w * 0.8, w * 0.8, h * 0.1]], i === 2 ? limeF : i % 2 ? darkF : blue));
    }
    /* Downtown: One World Trade Center and its neighbours */
    {
      const s = warpS(-700, 4700);
      const c0 = W(-700, GY + 30, 4700);
      k.box(62 * s, 60 * s, 62 * s, c0.x, c0.y, c0.z, glassBlue(s));
      const g = new T.CylinderGeometry(19 * Math.SQRT2, 44, 357, 4, 1); g.rotateY(PI / 4);
      const c1 = W(-700, GY + 60 + 178, 4700); const m = k.mesh(g, glassBlue(s), c1.x, c1.y, c1.z); m.scale.setScalar(s);
      const c2 = W(-700, GY + 417 + 62, 4700); k.cyl(0.8 * s, 124 * s, c2.x, c2.y, c2.z, steelBright, 1.6 * s, 8);
      for (const [x, z, h] of [[-800, 4600, 380], [-600, 4550, 298], [-760, 4450, 228], [-560, 4850, 250], [-400, 5000, 290], [-300, 4900, 240], [-200, 5200, 280]]) tower(x, z, [[50, 46, h]], blue);
    }
    /* Across the rivers: Long Island City, Downtown Brooklyn, Jersey City */
    for (const [x, z, h] of [[2100, -700, 237], [2300, -600, 200], [2000, -300, 180], [1900, 5600, 325], [1700, 5400, 220], [-3500, 4500, 270], [-3400, 4700, 238], [-3600, 4200, 210]]) tower(x, z, [[44, 40, h]], blue);
    /* the Flatiron's wedge and the Met Life clock tower on Madison Square */
    { const sh = new T.Shape(); sh.moveTo(-40, 30); sh.lineTo(40, 30); sh.lineTo(0, -45); sh.closePath(); const g = new T.ExtrudeGeometry(sh, { depth: 87, bevelEnabled: false }); g.rotateX(-PI / 2); k.mesh(g, facade(1, 1), -60, GY, 820); k.box(40, 1, 30, -60, GY + 87.5, 830, tar); }
    tower(130, 770, [[40, 40, 180]], limeF); { const c = W(130, GY + 196, 770); k.cyl(24, 32, c.x, c.y, c.z, k.flat(0xc9a25a, 0.8, 0.35), 0.5, 4).rotation.y = PI / 4; }

    for (const [m, b] of city) {
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(b.p, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(b.n, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(b.u, 2)); g.computeBoundingSphere();
      k.scene.add(new T.Mesh(g, m));
    }
    /* ---------- the building under your feet: podium, shaft, setbacks, the 86th floor ---------- */
    const esb = k.pbr('esShaft', X.windows(45, 0.18, 0xb3a58c, true), 0.1, { emissive: 0xffffff, emissiveIntensity: 0.5, roughness: 0.75, stretch: 0.25 });
    k.box(129, 22, 57, 0, GY + 11, 0, esb); k.box(130, 1, 58, 0, GY + 22.5, 0, tar);
    k.box(58, 246, 44, 0, GY + 22 + 123, 0, esb);
    for (const s of [-1, 1]) { k.box(8, 246, 30, s * 31, GY + 22 + 123, 0, esb); k.box(30, 246, 6, 0, GY + 22 + 123, s * 23.5, esb); }
    k.box(59, 1, 45, 0, -52.5, 0, tar);
    k.box(40, 33, 32, 0, -35.5, 0, esb); k.box(41, 1, 33, 0, -19.5, 0, tar);
    k.box(30.4, 18.6, 24.4, 0, -9.7, 0, esb);
    /* the deck: a floor ring, the parapet, the fence curling inward */
    k.box(30, 0.4, 24, 0, -0.2, 0, deckFloor);
    for (const s of [-1, 1]) { k.box(0.6, 1.3, 24.6, s * 15, 0.65, 0, lime); k.box(30.6, 1.3, 0.6, 0, 0.65, s * 12, lime); k.box(0.8, 0.14, 24.8, s * 15, 1.37, 0, limeDark); k.box(30.8, 0.14, 0.8, 0, 1.37, s * 12, limeDark); }
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { k.box(1.5, 2.1, 1.5, sx * 14.85, 1.05, sz * 11.85, limeDark); k.box(1.2, 0.3, 1.2, sx * 14.85, 2.25, sz * 11.85, lime); k.box(0.7, 0.5, 0.7, sx * 14.85, 2.65, sz * 11.85, limeDark); }
    {
      /* one bar, merged: up from the coping, then curving in toward the terrace */
      const bar = new T.TubeGeometry(new T.CatmullRomCurve3([v(0, 1.44, 0), v(0, 3.1, 0), v(0, 3.7, 0.22), v(0, 4.0, 0.66), v(0, 4.08, 1.05)]), 7, 0.013, 4);
      const pts: T.Matrix4[] = [], q = new T.Quaternion(), up = new T.Vector3(0, 1, 0), p = new T.Vector3();
      const run = (x0: number, z0: number, x1: number, z1: number, inward: number) => {
        const L = Math.hypot(x1 - x0, z1 - z0), n = Math.floor(L / 0.24);
        q.setFromAxisAngle(up, inward);
        for (let i = 0; i <= n; i++) { p.set(x0 + ((x1 - x0) * i) / n, 0, z0 + ((z1 - z0) * i) / n); pts.push(new T.Matrix4().compose(p, q, one)); }
      };
      run(-14.0, -11.85, 14.0, -11.85, 0); run(-14.0, 11.85, 14.0, 11.85, PI); run(-14.85, -11.0, -14.85, 11.0, PI / 2); run(14.85, -11.0, 14.85, 11.0, -PI / 2);
      k.instances(bar, steelDark, pts);
      for (const y of [1.9, 3.4]) for (const s of [-1, 1]) { k.box(0.06, 0.06, 22, s * 14.85, y, 0, steelDark); k.box(28, 0.06, 0.06, 0, y, s * 11.85, steelDark); }
      for (let i = -4; i <= 4; i++) { for (const s of [-1, 1]) { k.box(0.08, 2.7, 0.08, i * 2.9, 2.75, s * 11.85, steelDark); } }
      for (let i = -3; i <= 3; i++) { for (const s of [-1, 1]) { k.box(0.08, 2.7, 0.08, s * 14.85, 2.75, i * 2.9, steelDark); } }
    }
    /* the coin binoculars, on posts along the parapet */
    const bino = (x: number, z: number, face: number) => {
      const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = face;
      const post = new T.Mesh(new T.CylinderGeometry(0.08, 0.13, 1.1, 10), steelDark); post.position.y = 0.55; g.add(post);
      const head = new T.Mesh(new T.CapsuleGeometry(0.2, 0.34, 3, 10), k.flat(0x5a7e9e, 0.5, 0.4)); head.rotation.x = PI / 2; head.position.set(0, 1.3, 0.05); g.add(head);
      for (const s of [-1, 1]) { const e = new T.Mesh(new T.CylinderGeometry(0.075, 0.09, 0.3, 10), dark); e.rotation.x = PI / 2; e.position.set(s * 0.1, 1.33, 0.36); g.add(e); const l = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.12, 10), steelDark); l.rotation.x = PI / 2; l.position.set(s * 0.1, 1.33, -0.34); g.add(l); }
      const box = new T.Mesh(new T.BoxGeometry(0.26, 0.24, 0.2), k.flat(0x5a7e9e, 0.5, 0.4)); box.position.set(0, 1.0, 0.02); g.add(box);
      k.add(g); k.keepOut.push({ x, z, r: 0.42 });
    };
    for (const x of [-12.6, -6.3, -2.1, 2.1, 6.3, 12.6]) { bino(x, -11.25, PI); bino(x, 11.25, 0); }
    for (const z of [-2.2, 2.2, 6.9]) { bino(-14.25, z, -PI / 2); bino(14.25, z, PI / 2); }
    /* the enclosed observatory: limestone and glass, the lift door on the south side */
    const LY = -40;
    const CW = 22, CD = 16;
    k.box(CW, 4.6, 0.5, 0, 2.3, -CD / 2 + 0.25, lime); k.box(0.5, 4.6, CD, -CW / 2 + 0.25, 2.3, 0, lime); k.box(0.5, 4.6, CD, CW / 2 - 0.25, 2.3, 0, lime);
    k.box(CW / 2 - 1.3, 4.6, 0.5, -(CW / 4 + 0.65), 2.3, CD / 2 - 0.25, lime); k.box(CW / 2 - 1.3, 4.6, 0.5, CW / 4 + 0.65, 2.3, CD / 2 - 0.25, lime); k.box(2.6, 1.5, 0.5, 0, 3.85, CD / 2 - 0.25, lime);
    k.box(CW + 0.6, 0.5, CD + 0.6, 0, 4.85, 0, limeDark); k.box(CW - 0.4, 0.3, CD - 0.4, 0, 4.4, 0, tar);
    /* windows between the works */
    const win = (x: number, z: number, alongX: boolean, out: number) => {
      const ox = alongX ? 0 : out * 0.03, oz = alongX ? out * 0.03 : 0, ox2 = alongX ? 0 : out * 0.05, oz2 = alongX ? out * 0.05 : 0;
      k.box(alongX ? 1.3 : 0.06, 3.0, alongX ? 0.06 : 1.3, x + ox, 2.0, z + oz, darkGlass);
      k.box(alongX ? 0.06 : 0.1, 3.0, alongX ? 0.1 : 0.06, x + ox2, 2.0, z + oz2, alu);
      for (const y of [3.56, 0.46]) k.box(alongX ? 1.5 : 0.1, 0.12, alongX ? 0.1 : 1.5, x + ox2, y, z + oz2, alu);
    };
    for (const x of [-10.3, -6.3, -2.1, 2.1, 6.3, 10.3]) win(x, -CD / 2, true, -1);
    for (const x of [-10.3, -6.3, -2.15, 2.15, 6.3, 10.3]) win(x, CD / 2, true, 1);
    for (const z of [-6.8, -2.25, 2.25, 6.8]) { win(-CW / 2, z, false, -1); win(CW / 2, z, false, 1); }
    k.box(CW + 0.2, 0.3, CD + 0.2, 0, 0.15, 0, limeDark);
    /* the lift: brass frame, the car lit inside, the sign over the door */
    k.box(0.25, 3.1, 0.7, -1.3, 1.55, CD / 2, brass); k.box(0.25, 3.1, 0.7, 1.3, 1.55, CD / 2, brass); k.box(2.85, 0.3, 0.7, 0, 3.1, CD / 2, brass);
    k.box(2.4, 3.0, 0.08, 0, 1.5, CD / 2 - 2.2, k.flat(0x9a7a4a, 0.8, 0.3)); for (const s of [-1, 1]) k.box(0.08, 3.0, 2.2, s * 1.2, 1.5, CD / 2 - 1.1, k.flat(0x6a4a2e, 0.2, 0.5));
    k.box(2.4, 0.06, 2.2, 0, 3.0, CD / 2 - 1.1, k.glow(0xffe0b0));
    k.point(0, 2.6, CD / 2 - 0.8, 0xffd8a0, 8, 5);
    k.sign('LOBBY', 2.6, 0.5, 0, 3.55, CD / 2 + 0.36, '#1a1612', '#e8c878', 150, 0);
    /* ---------- the mast: setbacks, aluminium fins, the 102nd floor drum, the antenna ---------- */
    const mastLime = k.pbr('esMast', X.ashlar(0xd2c6ae, 84, 8), 0.4, { emissive: 0xffe2b0, emissiveIntensity: 0.06 });
    k.box(16, 5, 12, 0, 7.4, 0, mastLime); k.box(16.6, 0.4, 12.6, 0, 10, 0, limeDark);
    k.box(11.5, 5, 9.5, 0, 12.4, 0, mastLime);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const b = k.bar(v(sx * 7.2, 5, sz * 5.4), v(sx * 3.4, 34, sz * 3.4), 1.2, 0.9, alu); void b; }
    {
      const oct = (r: number, h: number, y: number, m: T.Material) => { const o = k.cyl(r, h, 0, y + h / 2, 0, m, r, 8); o.rotation.y = PI / 8; return o; };
      oct(5.2, 20, 14.9, mastLime); oct(4.4, 14, 34.9, mastLime); oct(3.6, 5, 48.9, mastLime);
      for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; k.bar(v(Math.cos(a) * 5.25, 15, Math.sin(a) * 5.25), v(Math.cos(a) * 4.45, 34.9, Math.sin(a) * 4.45), 0.35, 0.5, alu); k.bar(v(Math.cos(a) * 4.45, 34.9, Math.sin(a) * 4.45), v(Math.cos(a) * 3.65, 48.9, Math.sin(a) * 3.65), 0.3, 0.45, alu); }
      k.cyl(3.2, 4.2, 0, 56, 0, k.glass(0xcfe4f0, 0.5, 0.1), 3.2, 16); k.cyl(3.4, 0.3, 0, 53.9, 0, alu, 3.4, 16); k.cyl(3.4, 0.3, 0, 58.2, 0, alu, 3.4, 16);
      k.cyl(3.2, 3, 0, 59.8, 0, alu, 0.8, 16);
      k.cyl(0.8, 26, 0, 74, 0, k.flat(0xb8bcc2, 0.8, 0.4), 0.5, 8); k.cyl(0.45, 36, 0, 105, 0, k.flat(0xb8bcc2, 0.8, 0.4), 0.22, 8);
      for (const y of [66, 80, 88]) k.cyl(1.2, 0.4, 0, y, 0, steelDark, 1.2, 10);
    }
    const beacons = [60.5, 87, 123].map((y) => k.mesh(new T.SphereGeometry(0.45, 8, 6), k.glow(0xff2a1a), 0, y, 0, true));
    /* golden hour floodlights starting to come up on the mast */
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) k.spot(sx * 9, 5.2, sz * 7, 0, 40, 0, 0xffe2b0, 220, 0.3, 0.6, 70);
    k.point(0, 3.2, -10, 0xffe6c0, 6, 10); k.point(0, 3.2, 10, 0xffe6c0, 6, 10);

    /* ---------- things that move ---------- */
    if (!ctx.reduced) {
      /* the terrace crowd walking the loop, and tourists at the fence */
      k.crowd([v(-12.9, 0, -9.9), v(12.9, 0, -9.9), v(12.9, 0, 9.9), v(-12.9, 0, 9.9)], 34, { seed: 86, speed: 0.45, spread: 1.4, closed: true, colors: [0x1c232c, 0xd82a3a, 0xe8e2d4, 0x2a5fb8, 0x2a8a4a, 0xf0c22a, 0x8a4ad8, 0x3a3a3a, 0xf4f0e8] });
      /* yellow cabs and cars on Fifth, Madison, Sixth, 34th and 33rd, a thousand feet down */
      const lanes: { a: T.Vector3; b: T.Vector3 }[] = [
        { a: v(58, 0, -780), b: v(58, 0, 780) }, { a: v(70, 0, -780), b: v(70, 0, 780) },
        { a: v(186, 0, 780), b: v(186, 0, -780) }, { a: v(196, 0, 780), b: v(196, 0, -780) },
        { a: v(-224, 0, 780), b: v(-224, 0, -780) }, { a: v(-214, 0, 780), b: v(-214, 0, -780) },
        { a: v(-780, 0, -36), b: v(780, 0, -36) }, { a: v(780, 0, -30), b: v(-780, 0, -30) }, { a: v(780, 0, 33), b: v(-780, 0, 33) },
        { a: v(-500, 0, -780), b: v(-500, 0, 780) }, { a: v(440, 0, 780), b: v(440, 0, -780) },
      ];
      const NC = 190, cars = k.instances(new T.BoxGeometry(2.0, 1.6, 4.8), new T.MeshStandardMaterial({ roughness: 0.5, metalness: 0.3 }), Array.from({ length: NC }, () => new T.Matrix4()));
      cars.frustumCulled = false;
      const rnd = X.mulberry(34), c = new T.Color(), pal = [0xf2c21a, 0xf2c21a, 0xf2c21a, 0x1c1e22, 0xe8e8e8, 0x2a3a5a, 0x8a1a1a, 0x9aa0a8];
      const st = Array.from({ length: NC }, (_, i) => ({ l: i % lanes.length, s: rnd(), v: (9 + rnd() * 5) / 1560 }));
      for (let i = 0; i < NC; i++) cars.setColorAt(i, c.set(pal[Math.floor(rnd() * pal.length)]));
      if (cars.instanceColor) cars.instanceColor.needsUpdate = true;
      const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), up = new T.Vector3(0, 1, 0);
      k.ticks.push((t, dt) => {
        for (let i = 0; i < NC; i++) {
          const a = st[i], L = lanes[a.l];
          const light = Math.floor(t / 22) % 2 === (Math.abs(L.a.x - L.b.x) > 1 ? 0 : 1);
          const u0 = a.s, block = (u0 * 20) % 1;
          if (!(light && block > 0.88)) a.s = (a.s + a.v * Math.min(dt, 0.1)) % 1;
          p.lerpVectors(L.a, L.b, a.s); p.y = GY + 0.9;
          q.setFromAxisAngle(up, Math.atan2(L.b.x - L.a.x, L.b.z - L.a.z));
          m.compose(p, q, one); cars.setMatrixAt(i, m);
        }
        cars.instanceMatrix.needsUpdate = true;
      });
      /* boats on both rivers and a helicopter on the Hudson, all in true coordinates and pulled in by the warp */
      const boat = (len: number, hull: number, cabin: number) => { const g = new T.Group(); const h = new T.Mesh(new T.BoxGeometry(len * 0.28, len * 0.1, len), k.flat(hull, 0.1, 0.6)); h.position.y = len * 0.05; g.add(h); const cb = new T.Mesh(new T.BoxGeometry(len * 0.22, len * 0.1, len * 0.5), k.flat(cabin, 0.1, 0.6)); cb.position.y = len * 0.14; g.add(cb); k.add(g); return g; };
      const riv = (pts: [number, number][], y: number) => k.spline(pts.map(([x, z]) => W(x, y, z)));
      const wake = (g: T.Object3D, len: number) => { const w = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false })); w.rotation.x = -PI / 2; w.scale.set(len * 0.3, len * 1.6, 1); w.position.set(0, 0.2, -len * 1.2); g.add(w); };
      [[-2500, -6000, -2600, 6000], [-2300, 6000, -2200, -6000], [-2700, -2000, -2600, 5500]].forEach(([x0, z0, x1, z1], i) => {
        const g = boat(70 - i * 12, 0xe8e8e8, i === 1 ? 0x2a2a2a : 0xd8a040); const s = warpS((x0 + x1) / 2, 0); g.scale.setScalar(s); wake(g, 70 - i * 12);
        k.rider(g, riv([[x0, z0], [(x0 + x1) / 2 + 80, (z0 + z1) / 2], [x1, z1], [(x0 + x1) / 2 - 80, (z0 + z1) / 2]], GY + 0.5), 5 + i, i * 300);
      });
      [[1380, -5000, 1340, 1400], [1600, 2400, 1250, -4000]].forEach(([x0, z0, x1, z1], i) => {
        const g = boat(55, i ? 0xd84a2a : 0xf0f0f0, 0x2a3a5a); g.scale.setScalar(warpS(x0, 0)); wake(g, 55);
        k.rider(g, riv([[x0, z0], [x1 + 60, (z0 + z1) / 2], [x1, z1], [x0 - 60, (z0 + z1) / 2]], GY + 0.5), 5, i * 200);
      });
      {
        const heli = new T.Group(); const body = new T.Mesh(new T.CapsuleGeometry(1.4, 3, 3, 8), k.flat(0x2a2a30, 0.4, 0.5)); body.rotation.x = PI / 2; heli.add(body);
        const tail = new T.Mesh(new T.BoxGeometry(0.4, 0.4, 7), k.flat(0x2a2a30, 0.4, 0.5)); tail.position.z = -5; heli.add(tail);
        const rotor = new T.Mesh(new T.BoxGeometry(11, 0.1, 0.4), dark); rotor.position.y = 1.6; heli.add(rotor);
        const blink = new T.Mesh(new T.SphereGeometry(0.4, 6, 5), k.glow(0xff3a2a)); blink.position.y = -1.4; heli.add(blink);
        heli.scale.setScalar(warpS(-2300, 0) * 1.6); k.add(heli);
        k.rider(heli, k.spline([[-1900, -2500], [-2400, 1500], [-2900, 4200], [-2300, 5200], [-2000, 1500], [-1700, -1500]].map(([x, z]) => W(x, GY + 220, z)), true), 11, 0);
        k.ticks.push((t) => { rotor.rotation.y = t * 30; blink.visible = (t * 1.5) % 1 < 0.15; });
      }
      /* an airliner crossing high over Queens toward LaGuardia */
      {
        const jet = new T.Group();
        const fus = new T.Mesh(new T.CylinderGeometry(2, 2, 38, 8), k.flat(0xe8ecf0, 0.3, 0.5)); fus.rotation.x = PI / 2; jet.add(fus);
        const wing = new T.Mesh(new T.BoxGeometry(36, 0.5, 5), k.flat(0xd8dde4, 0.3, 0.5)); jet.add(wing);
        const fin = new T.Mesh(new T.BoxGeometry(0.4, 7, 5), k.flat(0x2a4a9a, 0.3, 0.5)); fin.position.set(0, 3.5, -16); jet.add(fin);
        jet.scale.setScalar(0.3); k.add(jet);
        k.rider(jet, k.spline([W(-6000, 900, -6000), W(0, 800, -6500), W(6000, 700, -5000), W(6500, 900, 2000), W(0, 1000, 6000), W(-6500, 1000, 0)], true), 22, 0);
      }
      /* pigeons riding the updraft round the mast */
      const NB = 14, birds = k.instances(new T.ConeGeometry(0.16, 0.7, 3).rotateX(PI / 2), k.flat(0x3a3c42, 0, 0.8), Array.from({ length: NB }, () => new T.Matrix4()));
      birds.frustumCulled = false;
      const bs = Array.from({ length: NB }, (_, i) => ({ r: 14 + (i % 5) * 4, y: 8 + (i % 7) * 3, w: 0.25 + (i % 3) * 0.07, ph: i * 0.9 }));
      const bm = new T.Matrix4(), bq = new T.Quaternion(), bp = new T.Vector3(), be = new T.Euler(), bsc = new T.Vector3();
      k.ticks.push((t) => {
        bs.forEach((b, i) => { const a = b.ph + t * b.w; bp.set(Math.cos(a) * b.r, b.y + 1.5 * Math.sin(t * 0.7 + i), Math.sin(a) * b.r); be.set(0, -a, 0.4 + 0.25 * Math.sin(t * 9 + i)); bq.setFromEuler(be); bsc.set(1.6 + 0.8 * Math.abs(Math.sin(t * 9 + i)), 1, 1); bm.compose(bp, bq, bsc); birds.setMatrixAt(i, bm); });
        birds.instanceMatrix.needsUpdate = true;
        beacons.forEach((b, i) => { b.visible = (t * 0.8 + i * 0.33) % 1 < 0.5; });
      });
    }
    /* tourists at the fence who have stopped walking */
    for (const [x, z, r, c] of [[-4.2, -10.9, PI, 0xd82a3a], [4.3, -10.95, PI, 0x2a5fb8], [9.1, -10.9, PI, 0xe8e2d4], [13.9, -3.5, -PI / 2, 0x3a3a3a], [-13.9, 4.4, PI / 2, 0xf0c22a], [-9.0, 10.9, 0, 0x2a8a4a], [12.6, -10.5, PI, 0x8a4ad8]] as [number, number, number, number][]) figure(k, x, 0, z, c, { rotY: r });

    /* ---------- the lobby, a lift ride down: gold and aluminium ceiling, marble, the relief ---------- */
    const HX = 10.4, HZ = 3.8, HH = 9.6;
    {
      const marbleLow = k.pbr('esMarbleLo', X.marble(0x6a4a34, 0x3a2418, 85), 0.9, { roughness: 0.18 }),
        marbleHi = k.pbr('esMarbleHi', X.marble(0xc8a878, 0x8a6a48, 86), 0.8, { roughness: 0.22 }),
        floorM = k.pbr('esTerr', X.terrazzo(0x8a7a64, 87), 0.4, { roughness: 0.3 }), gilt = k.pbr('esGilt', X.gilt(), 1.5, { metalness: 0.9, roughness: 0.3 });
      k.box(2 * HX + 1, 0.4, 2 * HZ + 8.5, 0, LY - 0.2, 2, floorM);
      /* the floor inlay: a band of dark marble down the middle with brass lines */
      k.box(2 * HX - 1, 0.02, 1.6, 0, LY + 0.01, 0, k.flat(0x3a2a22, 0.1, 0.2)); for (const s of [-1, 1]) k.box(2 * HX - 1, 0.025, 0.06, 0, LY + 0.015, s * 0.85, brass);
      for (const s of [-1, 1]) {
        k.box(2 * HX, 3.6, 0.4, 0, LY + 1.8, s * (HZ + 0.2), marbleLow);
        k.box(2 * HX, HH - 3.6, 0.4, 0, LY + 3.6 + (HH - 3.6) / 2, s * (HZ + 0.2), marbleHi);
        k.box(2 * HX, 0.16, 0.5, 0, LY + 3.62, s * (HZ + 0.15), brass);
        k.box(0.4, HH, 2 * HZ + 0.8, s * (HX + 0.2), LY + HH / 2, 0, marbleHi);
        k.box(0.5, 3.6, 2 * HZ + 0.8, s * (HX + 0.15), LY + 1.8, 0, marbleLow);
        /* pilasters: fluted aluminium strips between the bays */
        for (const x of [-9, -3, 3, 9]) { k.box(0.9, HH - 0.4, 0.14, x, LY + (HH - 0.4) / 2, s * (HZ - 0.05), marbleHi); for (const dx of [-0.3, 0, 0.3]) k.box(0.06, HH - 0.6, 0.06, x + dx, LY + (HH - 0.4) / 2, s * (HZ - 0.14), alu); }
      }
      /* the south wall has the lift vestibule cut into it: walls either side of the passage */
      for (const s of [-1, 1]) { k.box(0.3, 4, 3.8, s * 1.35, LY + 2, HZ + 1.9, marbleLow); }
      k.box(2.9, HH - 4, 0.3, 0, LY + 4 + (HH - 4) / 2, HZ + 0.1, marbleHi);
      k.box(2.7, 0.2, 3.8, 0, LY + 4.05, HZ + 1.9, gilt);
      /* the lift doors at the back of the vestibule: aluminium with a sunburst */
      k.box(2.4, 3.6, 0.1, 0, LY + 1.8, 7.7, k.flat(0xc8ccd2, 0.9, 0.28)); k.box(0.04, 3.6, 0.12, 0, LY + 1.8, 7.68, dark);
      k.sign('86  OBSERVATORY', 2.4, 0.42, 0, LY + 3.8, 7.6, '#15110d', '#e8c878', 110, PI);
      k.point(0, LY + 3.4, 5.6, 0xffd8a0, 10, 6);
      /* the ceiling: a painted field of gold and aluminium, suns, rays, gears and orbits */
      const ceil = canvasTex(2048, 768, (g) => {
        const W2 = 2048, H2 = 768;
        const bg = g.createLinearGradient(0, 0, 0, H2); bg.addColorStop(0, '#6a4a22'); bg.addColorStop(0.5, '#8a6230'); bg.addColorStop(1, '#6a4a22'); g.fillStyle = bg; g.fillRect(0, 0, W2, H2);
        const gold = (a: number) => `rgba(236,196,108,${a})`, silver = (a: number) => `rgba(214,218,224,${a})`;
        g.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
          const cx = 205 + i * 410, cy = H2 / 2;
          for (let r = 0; r < 48; r++) { const a = (r / 48) * PI * 2; g.strokeStyle = r % 2 ? gold(0.9) : silver(0.8); g.beginPath(); g.moveTo(cx + Math.cos(a) * 60, cy + Math.sin(a) * 60); g.lineTo(cx + Math.cos(a) * (r % 4 === 0 ? 330 : 240), cy + Math.sin(a) * (r % 4 === 0 ? 330 : 240)); g.stroke(); }
          g.fillStyle = gold(1); g.beginPath(); g.arc(cx, cy, 58, 0, PI * 2); g.fill();
          g.strokeStyle = silver(1); g.lineWidth = 8; for (const rr of [90, 150]) { g.beginPath(); g.arc(cx, cy, rr, 0, PI * 2); g.stroke(); }
          g.lineWidth = 3;
          /* a gear on the ring */
          const gx = cx + (i % 2 ? 150 : -150), gy = cy + (i % 2 ? -150 : 150);
          g.fillStyle = silver(0.95); g.beginPath(); for (let tI = 0; tI < 32; tI++) { const a = (tI / 32) * PI * 2, rr = tI % 2 ? 44 : 56; g.lineTo(gx + Math.cos(a) * rr, gy + Math.sin(a) * rr); } g.closePath(); g.fill(); g.fillStyle = '#6a4a22'; g.beginPath(); g.arc(gx, gy, 18, 0, PI * 2); g.fill();
        }
        /* chevrons and stars along the borders */
        for (let x = 0; x < W2; x += 64) { g.fillStyle = gold(0.95); g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 32, 40); g.lineTo(x + 64, 0); g.fill(); g.beginPath(); g.moveTo(x, H2); g.lineTo(x + 32, H2 - 40); g.lineTo(x + 64, H2); g.fill(); }
        for (let i = 0; i < 90; i++) { const x = (i * 197) % W2, y = 60 + ((i * 131) % (H2 - 120)); g.fillStyle = silver(0.9); g.fillRect(x - 2, y - 8, 4, 16); g.fillRect(x - 8, y - 2, 16, 4); }
      });
      k.plane(2 * HX, 2 * HZ, 0, LY + HH - 0.02, 0, new T.MeshStandardMaterial({ map: ceil, metalness: 0.75, roughness: 0.32, emissive: 0xffffff, emissiveMap: ceil, emissiveIntensity: 0.28 }), 0, PI / 2);
      for (let i = 0; i <= 4; i++) k.box(0.3, 0.4, 2 * HZ, -HX + i * (2 * HX / 4), LY + HH - 0.2, 0, gilt);
      for (const s of [-1, 1]) k.box(2 * HX, 0.4, 0.3, 0, LY + HH - 0.2, s * (HZ - 0.15), gilt);
      /* the two chandeliers put back in 2009 */
      for (const x of [-5, 5]) {
        k.cyl(0.03, 2.2, x, LY + HH - 1.1, 0, brass);
        for (let j = 0; j < 4; j++) k.cyl(0.7 - j * 0.14, 0.34, x, LY + HH - 2.4 - j * 0.38, 0, k.glow(0xc8a060), 0.8 - j * 0.14, 16);
        k.cyl(0.9, 0.08, x, LY + HH - 2.2, 0, brass, 0.9, 16);
        k.point(x, LY + HH - 3.6, 0, 0xffd8a0, 30, 16);
      }
      for (const x of [-9, 9]) k.point(x, LY + 5.5, 0, 0xffd8a0, 18, 9);
      for (let x = -6; x <= 6; x += 6) for (const s of [-1, 1]) k.box(0.3, 0.9, 0.12, x + 3, LY + 5.2, s * (HZ - 0.08), k.glow(0xb89058));
      /* the west end: the aluminium relief of the building, rays from the spire, the sun behind it, the desk */
      const RX = -HX + 0.05;
      k.box(0.1, 8.4, 6.2, RX + 0.02, LY + 4.9, 0, k.flat(0x2a1c14, 0.2, 0.3));
      k.box(0.14, 8.6, 0.22, RX + 0.06, LY + 4.9, 3.1, gilt); k.box(0.14, 8.6, 0.22, RX + 0.06, LY + 4.9, -3.1, gilt); k.box(0.14, 0.22, 6.4, RX + 0.06, LY + 9.1, 0, gilt); k.box(0.14, 0.22, 6.4, RX + 0.06, LY + 0.7, 0, gilt);
      const aluBright = k.flat(0xb8bcc4, 0.7, 0.38);
      k.cyl(1.2, 0.12, RX + 0.12, LY + 7.4, 0, k.flat(0xa8843a, 0.8, 0.4), 1.2, 32).rotation.z = PI / 2;
      for (let i = 0; i < 28; i++) { const a = (i / 28) * PI * 2; k.bar(v(RX + 0.16, LY + 7.4 + Math.sin(a) * 1.3, Math.cos(a) * 1.3), v(RX + 0.16, LY + 7.4 + Math.sin(a) * 1.55, Math.cos(a) * 2.85), 0.035, 0.05, aluBright); }
      {
        /* the silhouette as built, without the antenna: podium, shaft, setbacks, mast */
        const sh = new T.Shape(), pts: [number, number][] = [[-2.2, 0], [2.2, 0], [2.2, 0.5], [1.3, 0.5], [1.3, 4.6], [0.95, 4.6], [0.95, 5.3], [0.7, 5.3], [0.7, 5.6], [0.45, 5.6], [0.45, 6.2], [0.3, 6.2], [0.18, 6.9], [0.06, 7.1], [-0.06, 7.1], [-0.18, 6.9], [-0.3, 6.2], [-0.45, 6.2], [-0.45, 5.6], [-0.7, 5.6], [-0.7, 5.3], [-0.95, 5.3], [-0.95, 4.6], [-1.3, 4.6], [-1.3, 0.5], [-2.2, 0.5]];
        sh.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) sh.lineTo(p[0], p[1]); sh.closePath();
        const g = new T.ExtrudeGeometry(sh, { depth: 0.16, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 });
        const o = k.mesh(g, aluBright, RX + 0.1, LY + 1.0, 0); o.rotation.y = PI / 2;
        for (let i = -4; i <= 4; i++) k.box(0.05, 3.9, 0.04, RX + 0.3, LY + 3.35, i * 0.28, k.flat(0x8a8c90, 1, 0.3));
      }
      k.box(1.2, 1.1, 4.4, RX + 2.6, LY + 0.55, 0, marbleLow); k.box(1.4, 0.08, 4.6, RX + 2.6, LY + 1.14, 0, brass);
      figure(k, RX + 3.6, LY, -0.8, 0x1a2230, { rotY: -PI / 2 });
      k.point(RX + 4, LY + 6, 0, 0xfff0d8, 10, 9);
      /* the east end: the Fifth Avenue doors under the transom window, light coming in from the street */
      const transom = canvasTex(512, 512, (g) => {
        g.fillStyle = '#ffe8c0'; g.fillRect(0, 0, 512, 512);
        g.strokeStyle = '#3a2a1a'; g.lineWidth = 10;
        for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 512); g.stroke(); }
        for (let j = 0; j <= 8; j++) { g.beginPath(); g.moveTo(0, j * 64); g.lineTo(512, j * 64); g.stroke(); }
        g.lineWidth = 6; for (let i = -8; i < 8; i++) { g.beginPath(); g.moveTo(256, 512); g.lineTo(256 + i * 64, 0); g.stroke(); }
      });
      k.plane(6.2, 4.8, HX - 0.06, LY + 6.7, 0, new T.MeshBasicMaterial({ map: transom }), -PI / 2);
      k.box(0.2, 0.3, 6.6, HX - 0.1, LY + 4.2, 0, gilt);
      for (const z of [-2.1, 0, 2.1]) { k.box(0.1, 3.4, 1.7, HX - 0.08, LY + 1.7, z, k.flat(0xfff0d0, 0, 1, { emissive: 0xfff0d0, emissiveIntensity: 0.9 })); k.box(0.12, 3.6, 0.1, HX - 0.1, LY + 1.8, z - 0.9, brass); }
      k.point(HX - 1.5, LY + 3, 0, 0xfff0d8, 30, 10);
      if (!ctx.reduced) k.crowd([v(-7, LY, 1.2), v(8.5, LY, 1.0), v(8.5, LY, -1.2), v(-7, LY, -1.0)], 14, { seed: 31, speed: 0.55, spread: 1.0, closed: true });
    }

    /* ---------- the works ---------- */
    const mounts: Mount[] = [];
    for (const x of [-8.4, -4.2, 0, 4.2, 8.4]) mounts.push({ position: v(x, 2.0, -CD / 2 - 0.02), rotation: PI, target: v(x, 2.0, -10.3), width: 2.3, height: 1.65, style: 'steel', wash: true });
    for (const x of [-8.4, -4.2, 4.2, 8.4]) mounts.push({ position: v(x, 2.0, CD / 2 + 0.02), rotation: 0, target: v(x, 2.0, 10.3), width: 2.3, height: 1.65, style: 'steel', wash: true });
    for (const z of [-4.5, 0, 4.5]) { mounts.push({ position: v(CW / 2 + 0.02, 2.0, z), rotation: PI / 2, target: v(13.2, 2.0, z), width: 2.3, height: 1.65, style: 'steel', wash: true }); mounts.push({ position: v(-CW / 2 - 0.02, 2.0, z), rotation: -PI / 2, target: v(-13.2, 2.0, z), width: 2.3, height: 1.65, style: 'steel', wash: true }); }
    for (const x of [-6, 0, 6]) mounts.push({ position: v(x, LY + 2.3, -HZ + 0.02), rotation: 0, target: v(x, LY + 2.3, -0.6), width: 2.4, height: 1.7, style: 'gilt', wash: true });
    for (const x of [-6, 6]) mounts.push({ position: v(x, LY + 2.3, HZ - 0.02), rotation: PI, target: v(x, LY + 2.3, 0.6), width: 2.4, height: 1.7, style: 'gilt', wash: true });
    k.censusWall({ x: 0, y: LY + 6.3, z: -HZ + 0.03, rotY: 0, cols: 30, rows: 4, tile: 0.5, gap: 0.04, start: ctx.wallStart(5100, 120), pieces: ctx.all });

    /* ---------- what the building knows ---------- */
    const src = { name: 'Empire State Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/Empire_State_Building' };
    k.egg(v(-10.4, 2.0, -11.3), { id: 'chrysler-race', title: 'Four feet taller than the Chrysler', year: '1929', text: 'The plans put an observation deck on the 86th floor roof at 1,050 feet, higher than the Chrysler Building\'s deck on its 71st floor. That made the Empire State only four feet taller than the Chrysler at 1,046, and John Raskob worried Chrysler might hide a rod in its spire and push it up at the last minute, so in December 1929 the plans grew a crown and a mast.', clue: 'Find the steel needle to the north east and stand where you can look it in the eye.', source: src }, { r: 2.6 });
    k.egg(v(0, 40, 0), { id: 'mooring-mast', title: 'A dock for airships', year: '1931', text: 'The mast above the 86th floor is a hollow steel shaft 158 feet tall, fitted with elevators. It was meant as a mooring mast for zeppelins, tied up at the height of a 106th floor, with ticket offices and waiting rooms on the 86th. The plan was dropped when it was clear the winds up here made it impossible.', clue: 'Look straight up at the part of the building that was meant for passengers who never came.', source: src }, { r: 7 });
    k.egg(v(2.4, 1.6, 9.4), { id: 'run-up', title: 'One thousand five hundred and seventy six steps', year: '1978', text: 'Every year since 1978 the Empire State Building Run-Up races from the street to this deck: 1,050 feet of vertical climb and 1,576 steps.', clue: 'The lift is the easy way up. Stand by its door and count the other way.', source: src }, { r: 2.4 });
    k.egg(v(-HX + 1.4, LY + 3.2, 2.6), { id: 'relief', title: 'The building on its own wall', text: 'At the west end of the lobby, behind the desk, is an aluminium relief of the skyscraper as it was first built, without its antenna, with rays running out from the spire and the sun behind it. The lobby ceiling once carried an Art Deco mural of the sky and the machine age, and the lobby was brought back to its first glory in a 2009 renovation that also hung two chandeliers the building was meant to open with.', clue: 'Take the lift down and walk to the end where the building meets itself.', source: src }, { r: 3 });
    k.egg(v(1.0, LY + 2.2, 5.2), { id: '410-days', title: 'Four hundred and ten days', year: '1931', text: 'Construction started on March 17, 1930. The frame was finished on April 11, 1931, twelve days ahead of schedule and 410 days after work began, and the building opened on May 1, 1931. Al Smith drove the last rivet, and it was solid gold.', clue: 'The lift door knows how long it all took to build.', source: src }, { r: 2.4 });

    const floorY = (x: number, z: number) => {
      if (Math.abs(x) < HX + 0.05 && Math.abs(z) < HZ + 0.05) return LY;
      if (Math.abs(x) < 1.25 && z >= HZ && z < 7.5) return LY;
      return 0;
    };
    /* the core is solid at the deck and holds the lobby below: one set of blocks serves both floors */
    k.block(-CW / 2, CW / 2, -CD / 2, -HZ); k.block(-CW / 2, -1.2, HZ, CD / 2); k.block(1.2, CW / 2, HZ, CD / 2);
    k.block(-CW / 2, -HX, -HZ, HZ); k.block(HX, CW / 2, -HZ, HZ);
    return { mounts, spawn: v(9.4, 3, -9.1), look: v(330, -50, -600), eye: 3, floorY, bounds: [-14.6, 14.6, -11.6, 11.6], style: 'steel' };
  },
};

/* ---------------- 148 THE NAVE ON FIFTH ---------------- */
/* the outline of a pointed arch as a path: equilateral when h allows, springing at y0 + h - rise */
function pointed(p: T.Path, cx: number, y0: number, w: number, h: number) {
  const a = w / 2, rise = Math.min(h - 0.01, a * 1.5), c = (rise * rise - a * a) / (2 * a), R = a + c, ys = y0 + h - rise;
  const apexL = Math.atan2(rise, -c), apexR = Math.atan2(rise, c);
  p.moveTo(cx - a, y0); p.lineTo(cx - a, ys);
  p.absarc(cx + c, ys, R, PI, apexL, true);
  p.absarc(cx - c, ys, R, apexR, 0, true);
  p.lineTo(cx + a, y0);
  return p;
}
/* a solid wall with pointed and round openings cut through it, as one extrusion */
function holedWall(w: number, h: number, depth: number, holes: ({ kind: 'pointed'; cx: number; y0: number; w: number; h: number } | { kind: 'round'; cx: number; cy: number; r: number })[]) {
  const s = new T.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.closePath();
  for (const o of holes) {
    const p = new T.Path();
    if (o.kind === 'pointed') pointed(p, o.cx, o.y0, o.w, o.h); else p.absarc(o.cx, o.cy, o.r, 0, PI * 2, false);
    s.holes.push(p);
  }
  const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 14 });
  g.translate(0, 0, -depth / 2);
  return g;
}
/* the underside of a pointed barrel vault: span 2a, rise r, extruded along z for len */
function vaultGeo(a: number, rise: number, len: number, over = 2) {
  const c = (rise * rise - a * a) / (2 * a), R = a + c, s = new T.Shape();
  s.moveTo(-a, 0); s.absarc(c, 0, R, PI, Math.atan2(rise, -c), true); s.absarc(-c, 0, R, Math.atan2(rise, c), 0, true);
  s.lineTo(a, rise + over); s.lineTo(-a, rise + over); s.closePath();
  const g = new T.ExtrudeGeometry(s, { depth: len, bevelEnabled: false, curveSegments: 20 });
  g.translate(0, 0, -len / 2);
  return { g, prof: (x: number) => Math.sqrt(Math.max(0, R * R - (Math.abs(x) + c) ** 2)) };
}
/* stained glass: small irregular panes in deep colours, lead between them, medallions and a border */
function stainedGlass(seed: number, w: number, h: number, pal: number[]) {
  return canvasTex(w, h, (g) => {
    const rnd = X.mulberry(seed);
    g.fillStyle = '#0c0a0c'; g.fillRect(0, 0, w, h);
    const cell = 18;
    for (let y = 0; y < h; y += cell) for (let x = 0; x < w; x += cell) {
      const c = pal[Math.floor(rnd() * pal.length)], jx = (rnd() - 0.5) * 6, jy = (rnd() - 0.5) * 6, k2 = 0.75 + rnd() * 0.35;
      const r = ((c >> 16) & 255) * k2, gg = ((c >> 8) & 255) * k2, b = (c & 255) * k2;
      g.fillStyle = `rgb(${r | 0},${gg | 0},${b | 0})`;
      g.beginPath(); g.moveTo(x + 2 + jx, y + 2); g.lineTo(x + cell - 2, y + 2 + jy); g.lineTo(x + cell - 2 - jx, y + cell - 2); g.lineTo(x + 2, y + cell - 2 - jy); g.closePath(); g.fill();
    }
    /* medallions: quatrefoils of lighter glass with a star at the centre */
    const n = Math.max(2, Math.round(h / w) + 2);
    for (let i = 0; i < n; i++) {
      const cy = (h * (i + 0.6)) / (n + 0.4), cx = w / 2, r = w * 0.2;
      for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) { g.fillStyle = '#0c0a0c'; g.beginPath(); g.arc(cx + dx * r * 0.55, cy + dy * r * 0.55, r * 0.62, 0, PI * 2); g.fill(); }
      for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) { g.fillStyle = i % 2 ? '#a82a2a' : '#2a4ab8'; g.beginPath(); g.arc(cx + dx * r * 0.55, cy + dy * r * 0.55, r * 0.52, 0, PI * 2); g.fill(); }
      g.fillStyle = '#d8b848'; g.beginPath(); for (let q = 0; q < 16; q++) { const a = (q / 16) * PI * 2, rr = q % 2 ? r * 0.22 : r * 0.5; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.closePath(); g.fill();
      g.fillStyle = i % 2 ? '#2a6a4a' : '#8a1a22'; g.beginPath(); g.arc(cx, cy, r * 0.14, 0, PI * 2); g.fill();
    }
    g.fillStyle = '#0c0a0c'; g.fillRect(0, 0, w, 7); g.fillRect(0, h - 7, w, 7); g.fillRect(0, 0, 7, h); g.fillRect(w - 7, 0, 7, h);
    for (let y = 10; y < h - 10; y += 22) for (const x of [9, w - 25]) { g.fillStyle = (y / 22) % 2 < 1 ? '#8a1a22' : '#b89a3a'; g.fillRect(x, y, 16, 18); }
    g.strokeStyle = '#0c0a0c'; g.lineWidth = 4; for (let y = h / 6; y < h; y += h / 6) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  });
}

export const stpatricks: RoomDef = {
  id: 'stpatricks',
  name: 'The nave on Fifth',
  area: "ST. PATRICK'S CATHEDRAL / FIFTH AVENUE",
  mood: 'Late morning, candles and colour',
  color: '#b8864a',
  daylit: false,
  description: 'The Gothic Revival nave on Fifth Avenue at eleven in the morning: thirty two white columns, rib vaults a hundred feet up, sun coming through the south clerestory in coloured shafts, the bronze baldachin over the high altar, the rose window and the great organ over the open doors, and a few hundred candles going in the transepts. The New Yorkers hang along the side aisles where the Stations of the Cross would be, under the windows, and at the ends of the transepts.',
  signatures: 'The nave by James Renwick Jr. with its clustered marble columns and pointed arcades, the triforium and clerestory, the rib vaults with their bosses, the stained glass lancets, the 26 foot rose window by Charles Connick over the Gallery Organ, the bronze baldachin on four piers over the grey white marble high altar, the altar rail, the pews, the hanging lanterns, racks of votive candles, and the bronze doors open to Fifth Avenue with Atlas and Rockefeller Center across the street.',
  build(k, ctx) {
    k.sky({ top: 0x4f88d0, horizon: 0xd8e4ee, ground: 0x6a6660, fog: 0.0016, sun: { az: 1.2, el: 0.9, color: 0xfff4e0, size: 8 }, env: 0.3 });
    k.hemi(0xf4e6d0, 0x5a4c3e, 0.62);
    /* the sun from the south, high: through the south clerestory and aisle windows onto the north side */
    k.sun(0xfff0d8, 3.2, 70, 62, 6, true, 70);
    const stone = k.pbr('spStone', X.plaster(0xe2d8c4, 91), 0.25, { normal: 0.5, roughness: 0.85 }), pierM = k.pbr('spPier', X.marble(0xe6e0d4, 0xb8b2a6, 90), 0.3, { roughness: 0.4 }),
      stoneDark = k.pbr('spStone2', X.ashlar(0xb8ad98, 92, 4), 0.35, { normal: 0.4 }),
      vaultM = k.pbr('spVault', X.plaster(0xe2d6bc, 93), 0.25, { roughness: 0.9 }),
      marbleF = k.pbr('spFloor', X.marble(0xcfc8ba, 0x8a8478, 94), 0.22, { roughness: 0.35 }),
      marbleDark = k.pbr('spFloor2', X.marble(0x6a4a44, 0x3a2622, 95), 0.4, { roughness: 0.3 }),
      altarM = k.pbr('spAltar', X.marble(0xe2ded6, 0x9a968e, 96), 0.5, { roughness: 0.25 }),
      oak = k.pbr('spOak', X.planks(0x5a3a22, 5, 97), 0.8, { roughness: 0.6 }), oakDark = k.flat(0x3a2616, 0, 0.6),
      bronze = k.flat(0x7a5a2e, 0.9, 0.38), gilt = k.pbr('spGilt', X.gilt(), 2, { metalness: 0.9, roughness: 0.3 }),
      pipeM = k.flat(0xc8ccd0, 1, 0.25), dark = k.flat(0x0e0c0c, 0, 0.9), iron = k.flat(0x1c1a18, 0.6, 0.5);
    const NX = 7, AX = 14.5, Z0 = 42, ZX = -7, ZC = -21, ZE = -46, TX = 26;
    const SPRING = 24, APEX = 33, ARC_H = 15, TRI_H = 3, CLR_H = SPRING - ARC_H - TRI_H;
    /* floors: the nave, the crossing and transepts, a darker band down the centre aisle */
    k.box(2 * AX, 0.3, Z0 - ZC + 1, 0, -0.15, (Z0 + ZC) / 2, marbleF);
    k.box(2 * TX, 0.3, ZX - ZC, 0, -0.15, (ZX + ZC) / 2, marbleF);
    k.box(2.6, 0.02, Z0 - ZC - 1, 0, 0.01, (Z0 + ZC) / 2, marbleDark);
    for (const s of [-1, 1]) k.box(0.08, 0.025, Z0 - ZC - 1, s * 1.35, 0.015, (Z0 + ZC) / 2, gilt);
    /* the nave arcades: pointed arches on clustered columns, triforium, clerestory */
    const bays = (z0: number, z1: number, n: number) => Array.from({ length: n }, (_, i) => z0 + ((z1 - z0) * (i + 0.5)) / n);
    const naveBays = bays(Z0, ZX, 7), chancelBays = bays(ZC, ZE, 3);
    const runWalls = (za: number, zb: number, n: number) => {
      const len = za - zb, zc = (za + zb) / 2, pitch = len / n;
      for (const s of [-1, 1]) {
        k.arcade(len, ARC_H, 0.9, n, pitch - 1.5, 13.5, s * NX, 0, zc, stone, PI / 2, true);
        k.arcade(len, TRI_H, 0.7, n * 4, pitch / 4 - 0.5, 2.5, s * NX, ARC_H, zc, stoneDark, PI / 2, true);
        k.box(0.3, TRI_H, len, s * (NX + 0.7), ARC_H + TRI_H / 2, zc, dark);
        k.arcade(len, CLR_H, 0.9, n, pitch - 2.6, CLR_H - 0.5, s * NX, ARC_H + TRI_H, zc, stone, PI / 2, true);
        k.box(1.1, 0.35, len, s * NX, ARC_H + 0.1, zc, stoneDark);
        k.box(1.1, 0.3, len, s * NX, ARC_H + TRI_H, zc, stoneDark);
      }
    };
    runWalls(Z0, ZX, 7); runWalls(ZC, ZE, 3);
    /* the columns: a marble drum five feet across with eight shafts, a capital at thirty five feet, shafts on up to the vault */
    const pierGeo = (() => {
      const parts: T.BufferGeometry[] = [];
      const core = new T.CylinderGeometry(0.76, 0.76, 10.7, 16); core.translate(0, 5.35, 0); parts.push(core);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2, sh = new T.CylinderGeometry(0.15, 0.15, 10.7, 8); sh.translate(Math.cos(a) * 0.8, 5.35, Math.sin(a) * 0.8); parts.push(sh); }
      const base = new T.CylinderGeometry(1.15, 1.25, 0.7, 16); base.translate(0, 0.35, 0); parts.push(base);
      const cap = new T.CylinderGeometry(1.2, 0.95, 0.9, 16); cap.translate(0, 10.7 - 0.2, 0); parts.push(cap);
      return mergeGeometries(parts.map((p) => p.toNonIndexed()))!;
    })();
    const shaftGeo = (() => { const parts: T.BufferGeometry[] = []; for (const dz of [-0.35, 0, 0.35]) { const sh = new T.CylinderGeometry(0.13, 0.13, SPRING - 10.7, 8); sh.translate(0, 10.7 + (SPRING - 10.7) / 2, dz); parts.push(sh.toNonIndexed()); } return mergeGeometries(parts)!; })();
    const piers: [number, number][] = [];
    for (let i = 0; i <= 7; i++) for (const s of [-1, 1]) piers.push([s * NX, Z0 - i * 7]);
    for (let i = 0; i <= 3; i++) for (const s of [-1, 1]) piers.push([s * NX, ZC - (i * (ZC - ZE)) / 3]);
    for (const [x, z] of piers) {
      if (z === Z0 || z === ZE) continue;
      k.mesh(pierGeo, pierM, x, 0, z); k.mesh(shaftGeo, pierM, x - Math.sign(x) * 0.55, 0, z);
      k.keepOut.push({ x, z, r: 1.15 });
    }
    /* the vaults: nave and chancel along z, transepts along x, aisles low on either side */
    const nv = vaultGeo(NX, APEX - SPRING, Z0 - ZE, 3); k.mesh(nv.g, vaultM, 0, SPRING, (Z0 + ZE) / 2);
    { const tv = vaultGeo(NX, APEX - SPRING, 2 * TX, 3); const o = k.mesh(tv.g, vaultM, 0, SPRING, (ZX + ZC) / 2); o.rotation.y = PI / 2; }
    const av = vaultGeo((AX - 0.4 - NX - 0.45) / 2, 4.2, Z0 - ZE, 2);
    const av2 = vaultGeo((AX - 0.4 - NX - 0.45) / 2, 4.2, ZC - ZE, 2), avN = vaultGeo((AX - 0.4 - NX - 0.45) / 2, 4.2, Z0 - ZX, 2);
    for (const s of [-1, 1]) { k.mesh(avN.g, vaultM, s * (NX + 0.45 + (AX - 0.4 - NX - 0.45) / 2), 10.8, (Z0 + ZX) / 2); k.mesh(av2.g, vaultM, s * (NX + 0.45 + (AX - 0.4 - NX - 0.45) / 2), 10.8, (ZC + ZE) / 2); }
    /* ribs: transverse arches at every column, diagonals across each bay, the ridge, gilt bosses */
    const ribM = stoneDark, boss = gilt;
    const arcPts = (z: number) => Array.from({ length: 13 }, (_, i) => { const x = -NX + (i / 12) * 2 * NX; return v(x, SPRING + nv.prof(x) - 0.12, z); });
    const diag = (z0: number, z1: number, sgn: number) => Array.from({ length: 13 }, (_, i) => { const u = i / 12, x = sgn * (-NX + u * 2 * NX); return v(x, SPRING + nv.prof(x) - 0.15, z0 + (z1 - z0) * u); });
    const ribZ = [Z0 - 0.8, ...Array.from({ length: 7 }, (_, i) => Z0 - (i + 1) * 7), ZC, ...[1, 2, 3].map((i) => ZC - (i * (ZC - ZE)) / 3)];
    for (const z of ribZ) k.curve(arcPts(z), 0.2, ribM, 24);
    for (let i = 0; i < ribZ.length - 1; i++) { const a = ribZ[i], b = ribZ[i + 1]; k.curve(diag(a, b, 1), 0.14, ribM, 20); k.curve(diag(a, b, -1), 0.14, ribM, 20); k.sphere(0.45, 0, APEX - 0.35, (a + b) / 2, boss, 10); }
    k.box(0.22, 0.22, Z0 - ZE, 0, APEX - 0.2, (Z0 + ZE) / 2, ribM);
    for (const s of [-1, 1]) for (const z of [...naveBays.map((z) => z + 3.5), ZX]) { const ax0 = NX + 0.45, ax1 = AX - 0.4, am = (ax0 + ax1) / 2; k.curve(Array.from({ length: 9 }, (_, i) => { const x = -((ax1 - ax0) / 2) + (i / 8) * (ax1 - ax0); return v(s * (am + x), 10.8 + av.prof(x) - 0.1, z); }), 0.12, ribM, 16); }
    /* the transept ribs */
    for (const x of [-TX + 0.9, -19.5, -13, 13, 19.5, TX - 0.9]) k.curve(Array.from({ length: 13 }, (_, i) => { const z = -NX + (i / 12) * 2 * NX; return v(x, SPRING + nv.prof(z) - 0.12, (ZX + ZC) / 2 + z); }), 0.2, ribM, 24);
    /* roofs over the vaults, so no daylight leaks in except through glass */
    k.box(2 * NX + 1.8, 0.6, Z0 - ZE + 2, 0, APEX + 3.4, (Z0 + ZE) / 2, dark);
    k.box(2 * TX + 2, 0.6, 2 * NX + 1.8, 0, APEX + 3.4, (ZX + ZC) / 2, dark);
    for (const s of [-1, 1]) k.box(AX - NX + 1.2, 0.5, Z0 - ZE + 2, s * (NX + AX) / 2, 17.6, (Z0 + ZE) / 2, dark);
    /* the aisle walls: a plain dado for the works, tall windows above */
    const AW_LOW = 4.4, AW_H = 17.4 - AW_LOW;
    for (const s of [-1, 1]) {
      k.box(0.8, AW_LOW, Z0 - ZX, s * AX, AW_LOW / 2, (Z0 + ZX) / 2, stone);
      k.arcade(Z0 - ZX, AW_H, 0.8, 7, 3.0, 8.2, s * AX, AW_LOW, (Z0 + ZX) / 2, stone, PI / 2, true);
      k.box(0.8, AW_LOW, ZC - ZE, s * AX, AW_LOW / 2, (ZC + ZE) / 2, stone);
      k.arcade(ZC - ZE, AW_H, 0.8, 3, 3.4, 8.2, s * AX, AW_LOW, (ZC + ZE) / 2, stone, PI / 2, true);
      k.box(1.0, 0.3, Z0 - ZX, s * (AX - 0.1), AW_LOW, (Z0 + ZX) / 2, stoneDark);
    }
    /* stained glass in every opening */
    const pals = [[0x1c3a8a, 0x1c3a8a, 0x2a4aa8, 0x8a1a22, 0xa8781e, 0x2a6a3a, 0x5a2a7a, 0xb8b08a], [0x8a1a22, 0x9a2a1e, 0x1c3a8a, 0xb88a2a, 0x2a6a3a, 0xd0c090], [0x2a4aa8, 0x1c3a8a, 0x3a7a8a, 0xa8781e, 0x8a1a22, 0xc8b890]];
    const glassMats = [0, 1, 2, 3].map((i) => new T.MeshBasicMaterial({ map: stainedGlass(300 + i, 192, 512, pals[i % 3]), side: T.DoubleSide, color: 0xe8e0d8, transparent: true, opacity: 0.97 }));
    const bigGlass = new T.MeshBasicMaterial({ map: stainedGlass(310, 384, 768, pals[0]), side: T.DoubleSide, color: 0xe8e0d8, transparent: true, opacity: 0.97 });
    naveBays.forEach((z, i) => { for (const s of [-1, 1]) { k.plane(3.0, 8.2, s * AX, AW_LOW + 4.1, z, glassMats[(i + (s > 0 ? 0 : 2)) % 4], PI / 2); k.plane(7 - 2.6, CLR_H - 0.5, s * NX, ARC_H + TRI_H + (CLR_H - 0.5) / 2, z, glassMats[(i + 1 + (s > 0 ? 0 : 2)) % 4], PI / 2); } });
    chancelBays.forEach((z, i) => { for (const s of [-1, 1]) k.plane(3.4, 8.2, s * AX, AW_LOW + 4.1, z, glassMats[(i + 3) % 4], PI / 2); for (const s of [-1, 1]) k.plane((ZC - ZE) / 3 - 2.6, CLR_H - 0.5, s * NX, ARC_H + TRI_H + (CLR_H - 0.5) / 2, z, glassMats[(i + 2) % 4], PI / 2); });
    /* the west wall: the doors, the rose window, the organ gallery */
    const ROSE_Y = 23.6, ROSE_R = 3.95;
    { const g = holedWall(2 * AX + 0.8, APEX + 1, 1.6, [{ kind: 'pointed', cx: 0, y0: 0, w: 5.2, h: 9.6 }, { kind: 'round', cx: 0, cy: ROSE_Y, r: ROSE_R }]); k.mesh(g, stone, 0, 0, Z0 + 0.4); }
    const rose = canvasTex(1024, 1024, (g) => {
      const C = 512;
      g.fillStyle = '#0c0a0c'; g.fillRect(0, 0, 1024, 1024);
      const bg = g.createRadialGradient(C, C, 20, C, C, 500); bg.addColorStop(0, '#2a4ab8'); bg.addColorStop(1, '#10205a'); g.fillStyle = bg; g.beginPath(); g.arc(C, C, 500, 0, PI * 2); g.fill();
      const rnd = X.mulberry(26);
      for (let ring = 0; ring < 5; ring++) {
        const r0 = 60 + ring * 88, r1 = r0 + 80, n = 8 * (ring + 1);
        for (let i = 0; i < n; i++) {
          const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2, pick = rnd();
          g.fillStyle = pick < 0.5 ? '#2340a8' : pick < 0.68 ? '#8a1a22' : pick < 0.8 ? '#2a7a4a' : pick < 0.92 ? '#c09a30' : '#d8d0b8';
          g.beginPath(); g.arc(C, C, r1 - 6, a0 + 0.02, a1 - 0.02); g.arc(C, C, r0 + 6, a1 - 0.02, a0 + 0.02, true); g.closePath(); g.fill();
        }
      }
      /* sixteen petals of tracery over the rings */
      g.strokeStyle = '#0c0a0c'; g.lineWidth = 16;
      for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; g.beginPath(); g.moveTo(C + Math.cos(a) * 60, C + Math.sin(a) * 60); g.lineTo(C + Math.cos(a) * 500, C + Math.sin(a) * 500); g.stroke(); }
      g.lineWidth = 10;
      for (let i = 0; i < 16; i++) { const a = ((i + 0.5) / 16) * PI * 2; g.beginPath(); g.arc(C + Math.cos(a) * 400, C + Math.sin(a) * 400, 88, 0, PI * 2); g.stroke(); }
      for (const r of [60, 230, 500]) { g.lineWidth = r === 500 ? 26 : 14; g.beginPath(); g.arc(C, C, r, 0, PI * 2); g.stroke(); }
      g.fillStyle = '#c09a30'; g.beginPath(); g.arc(C, C, 52, 0, PI * 2); g.fill();
    });
    { const m = new T.MeshBasicMaterial({ map: rose, side: T.DoubleSide, color: 0xf0e8e0, transparent: true, opacity: 0.98 }); const o = k.mesh(new T.CircleGeometry(ROSE_R + 0.05, 48), m, 0, ROSE_Y, Z0 + 0.4); o.rotation.y = PI; }
    k.torus(ROSE_R + 0.15, 0.25, 0, ROSE_Y, Z0 - 0.45, stoneDark, 48);
    /* the gallery and the Gallery Organ: two towers of pipes and a low flat between them, in carved oak */
    const GY = 9.4, GZ = Z0 - 5.6;
    k.box(2 * NX - 1.6, 0.6, Z0 - GZ, 0, GY - 0.3, (Z0 + GZ) / 2, oakDark);
    k.arcade(2 * NX - 1.6, 1.3, 0.25, 14, 0.62, 1.05, 0, GY, GZ + 0.1, oak, 0, true);
    k.box(2 * NX - 1.4, 0.18, 0.4, 0, GY + 1.35, GZ + 0.1, gilt);
    k.box(2 * NX - 1.6, 0.9, 0.3, 0, GY - 0.9, GZ + 0.1, oak);
    for (const s of [-1, 1]) {
      k.box(3.6, 11.5, 2.4, s * 4.6, GY + 5.75, Z0 - 2.2, oakDark);
      for (let j = 0; j < 4; j++) k.cyl(0.22, 1.6, s * (3.2 + j * 0.9), GY + 12.3, Z0 - 1.0, oak, 0.02, 6);
    }
    {
      const pipes: T.Matrix4[] = [], m = new T.Vector3(), q = new T.Quaternion(), sc = new T.Vector3();
      const add = (x: number, y0: number, h: number, z: number) => { m.set(x, y0 + h / 2, z); sc.set(1, h, 1); pipes.push(new T.Matrix4().compose(m, q, sc)); };
      for (const s of [-1, 1]) for (let j = 0; j < 9; j++) { const x = s * (3.05 + j * 0.39), h = 9.8 - Math.abs(j - 4) * 0.9; add(x, GY + 0.9, h, Z0 - 0.95); }
      for (let j = 0; j < 15; j++) { const x = -2.35 + j * 0.335, h = 3.6 + 2.2 * Math.sin((j / 14) * PI); add(x, GY + 1.3, h, Z0 - 1.2); }
      const o = k.instances(new T.CylinderGeometry(0.15, 0.15, 1, 10), pipeM, pipes); void o;
      k.box(5.4, 0.3, 1.2, 0, GY + 1.2, Z0 - 1.2, oakDark);
    }
    /* the sanctuary: steps, the altar rail, the high altar, the baldachin on four bronze piers */
    k.box(2 * NX - 0.9, 0.9, ZC - ZE, 0, 0.45, (ZC + ZE) / 2, altarM);
    for (let i = 0; i < 3; i++) k.box(2 * NX - 0.9, 0.3, 0.45, 0, 0.15 + i * 0.3, ZC + 0.9 - i * 0.45, altarM);
    k.box(2 * NX - 1.2, 0.95, 0.35, 0, 0.47, ZC + 1.6, altarM);
    for (let x = -5.9; x <= 5.9; x += 0.5) { if (Math.abs(x) < 0.9) continue; k.cyl(0.07, 0.75, x, 0.4, ZC + 1.6, altarM, 0.1, 8); }
    k.box(2 * NX - 1.2, 0.12, 0.5, 0, 1.0, ZC + 1.6, altarM);
    const ALZ = -33;
    for (let i = 0; i < 3; i++) k.box(6.4 - i * 0.9, 0.25, 5.2 - i * 0.7, 0, 0.9 + 0.12 + i * 0.25, ALZ, altarM);
    k.box(3.4, 1.1, 1.3, 0, 1.65 + 0.55, ALZ, altarM); k.box(3.6, 0.12, 1.45, 0, 2.8, ALZ, altarM);
    for (let i = 0; i < 6; i++) { const x = -1.4 + i * 0.56; k.cyl(0.05, 0.9, x, 3.3, ALZ - 0.4, gilt, 0.07, 8); k.cyl(0.03, 0.35, x, 3.9, ALZ - 0.4, k.flat(0xf4efe4, 0, 0.6), 0.03, 6); }
    k.box(0.08, 1.2, 0.08, 0, 3.5, ALZ - 0.45, gilt); k.box(0.6, 0.08, 0.08, 0, 3.75, ALZ - 0.45, gilt);
    {
      const BW = 3.2, BH = 10.5, by = 0.9;
      for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { k.box(0.55, BH, 0.55, dx * BW, by + BH / 2, ALZ + dz * BW, bronze); k.cyl(0.3, 2.4, dx * BW, by + BH + 1.2 + 3.1, ALZ + dz * BW, gilt, 0.02, 6); }
      for (let f = 0; f < 4; f++) {
        const a = (f * PI) / 2, g = holedWall(2 * BW + 0.55, 4.2, 0.35, [{ kind: 'pointed', cx: 0, y0: 0, w: 2 * BW - 0.6, h: 3.9 }]);
        const o = k.mesh(g, bronze, Math.sin(a) * BW, by + BH - 4.2, ALZ + Math.cos(a) * BW); o.rotation.y = a;
        const gab = new T.Shape(); gab.moveTo(-BW - 0.3, 0); gab.lineTo(BW + 0.3, 0); gab.lineTo(0, 3.2); gab.closePath();
        const gg = new T.ExtrudeGeometry(gab, { depth: 0.2, bevelEnabled: false }); gg.translate(0, 0, -0.1);
        const go = k.mesh(gg, gilt, Math.sin(a) * BW, by + BH, ALZ + Math.cos(a) * BW); go.rotation.y = a;
      }
      /* the spire: open stages of bronze, narrowing, the figure of Christ the King on top */
      let y = by + BH, w = 2 * BW;
      for (let i = 0; i < 4; i++) {
        const h = 2.4 - i * 0.3; w *= 0.66;
        for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) k.box(0.22, h, 0.22, (dx * w) / 2, y + h / 2, ALZ + (dz * w) / 2, bronze);
        k.box(w + 0.3, 0.2, w + 0.3, 0, y + h, ALZ, gilt);
        y += h;
      }
      k.cyl(0.9, 3.4, 0, y + 1.7, ALZ, gilt, 0.05, 4).rotation.y = PI / 4;
      k.box(3.2, 0.25, 3.2, 0, by + BH - 0.1, ALZ, bronze);
      figure(k, 0, y + 3.4, ALZ, 0xc9a25a, { h: 0.55 });
      k.spot(0, APEX - 2, ALZ + 12, 0, 4, ALZ, 0xffe6c0, 700, 0.42, 0.6, 50);
      k.point(0, by + BH - 1.5, ALZ, 0xffd8a0, 30, 10);
    }
    /* the east end: a blind arcade, three lancets, the arch through to the Lady Chapel */
    { const g = holedWall(2 * AX + 0.8, APEX + 1, 1.2, [{ kind: 'pointed', cx: 0, y0: 0.9, w: 5.2, h: 13 }, { kind: 'pointed', cx: -3.4, y0: 15.5, w: 2.2, h: 8.5 }, { kind: 'pointed', cx: 0, y0: 15.5, w: 2.4, h: 10 }, { kind: 'pointed', cx: 3.4, y0: 15.5, w: 2.2, h: 8.5 }]); k.mesh(g, stone, 0, 0, ZE - 0.6); }
    for (const [x, w, h] of [[-3.4, 2.2, 8.5], [0, 2.4, 10], [3.4, 2.2, 8.5]]) k.plane(w, h, x, 15.5 + h / 2, ZE - 0.6, glassMats[(x + 4) % 4 | 0], 0);
    { const lc = k.flat(0x3a4058, 0, 0.9); for (const s of [-1, 1]) k.box(0.3, 13, 14, s * 2.9, 6.5, ZE - 8, lc); k.box(6, 0.3, 14, 0, 13, ZE - 8, lc); k.box(6, 13, 0.3, 0, 6.5, ZE - 15.2, lc); k.box(6, 0.3, 14, 0, 0.9, ZE - 8, marbleF); }
    k.plane(4.6, 9, 0, 6, ZE - 14.9, new T.MeshBasicMaterial({ map: stainedGlass(330, 256, 512, [0x2a4aa8, 0x1c3a8a, 0x3a5ac8, 0x8a1a22, 0xd0c090]), color: 0xd8e0f0 }), 0);
    k.point(0, 5, ZE - 6, 0x8aa8ff, 30, 16);
    /* the transept ends: a great window over a door, and the walls either side of the crossing */
    for (const s of [-1, 1]) {
      const g = holedWall(ZX - ZC + 1.6, APEX + 1, 1.6, [{ kind: 'pointed', cx: 0, y0: 12.5, w: 7.2, h: 14 }, { kind: 'pointed', cx: 0, y0: 0, w: 3, h: 5.6 }]);
      const o = k.mesh(g, stone, s * TX, 0, (ZX + ZC) / 2); o.rotation.y = PI / 2;
      k.plane(7.2, 14, s * (TX - 0.05), 12.5 + 7, (ZX + ZC) / 2, bigGlass, PI / 2);
      k.box(0.3, 5.6, 3, s * (TX + 0.5), 2.8, (ZX + ZC) / 2, k.flat(0xfff4e0, 0, 1, { emissive: 0xfff4e0, emissiveIntensity: 0.8 }));
      for (const z of [ZX, ZC]) { k.box(TX - AX + 0.8, SPRING, 0.8, s * (AX + TX) / 2, SPRING / 2, z + (z === ZX ? 0 : 0), stone); k.box(AX - NX - 0.4, SPRING - 15, 0.8, s * (NX + AX) / 2, 15 + (SPRING - 15) / 2, z, stone); }
      k.plane(3.4, 9, s * 20.2, 11, ZX - 0.41, glassMats[1], PI); k.plane(3.4, 9, s * 20.2, 11, ZC + 0.41, glassMats[2], 0);
    }
    /* the pews: oak, in four banks down the nave */
    {
      const pew = mergeGeometries([new T.BoxGeometry(1, 0.08, 0.42).translate(0, 0.46, 0), new T.BoxGeometry(1, 0.55, 0.06).translate(0, 0.78, 0.22), new T.BoxGeometry(1, 0.2, 0.05).translate(0, 0.25, -0.2)].map((g) => g.toNonIndexed()))!;
      const end = new T.BoxGeometry(0.07, 1.05, 0.62).translate(0, 0.52, 0.05);
      const pm: T.Matrix4[] = [], em: T.Matrix4[] = [], seats: [number, number][] = [];
      const q = new T.Quaternion(), p = new T.Vector3(), sc = new T.Vector3();
      for (let z = 34; z > -5; z -= 0.98) {
        for (const [xa, xb] of [[-6.1, -1.45], [1.45, 6.1], [-10.6, -8.1], [8.1, 10.6]]) {
          const len = xb - xa, xc = (xa + xb) / 2;
          p.set(xc, 0, z); sc.set(len, 1, 1); pm.push(new T.Matrix4().compose(p, q, sc));
          for (const xe of [xa, xb]) { p.set(xe, 0, z); em.push(new T.Matrix4().compose(p, q, one)); }
          for (let x = xa + 0.35; x < xb - 0.3; x += 0.6) seats.push([x, z]);
        }
      }
      k.instances(pew, oak, pm); k.instances(end, oakDark, em);
      for (const [xa, xb] of [[-6.1, -1.45], [1.45, 6.1], [-10.6, -8.1], [8.1, 10.6]]) k.block(xa - 0.1, xb + 0.1, -5.4, 34.4);
      /* people in the pews, praying or resting, and a few more standing */
      const rnd = X.mulberry(1879), N = 84, fig = k.instances(figureGeo(0.18, 0.46, 1.0), new T.MeshStandardMaterial({ roughness: 0.9 }), Array.from({ length: N }, () => new T.Matrix4()));
      const c = new T.Color(), pal = [0x1c232c, 0x2a2a34, 0x5a3a2a, 0xe8e2d4, 0x2a3f6a, 0x6a2a2a, 0x3a4a3a, 0x8a8a90, 0xc8b8a0];
      const used = new Set<number>();
      for (let i = 0; i < N; i++) {
        let j = Math.floor(rnd() * seats.length); while (used.has(j)) j = (j + 7) % seats.length; used.add(j);
        const [x, z] = seats[j];
        const kneel = rnd() > 0.7;
        p.set(x, kneel ? 0.15 : 0.5, z + (kneel ? -0.12 : 0.02)); q.setFromAxisAngle(new T.Vector3(0, 1, 0), PI); sc.set(1, kneel ? 1.05 : 0.92, 1);
        fig.setMatrixAt(i, new T.Matrix4().compose(p, q, sc)); fig.setColorAt(i, c.set(pal[Math.floor(rnd() * pal.length)]));
      }
      fig.instanceMatrix.needsUpdate = true; if (fig.instanceColor) fig.instanceColor.needsUpdate = true;
    }
    /* the lanterns, hung on long chains over the pews and the aisles */
    {
      const lantern = mergeGeometries([new T.CylinderGeometry(0.34, 0.26, 0.9, 8).toNonIndexed(), new T.ConeGeometry(0.45, 0.5, 8).translate(0, 0.7, 0).toNonIndexed(), new T.ConeGeometry(0.2, 0.4, 8).rotateX(PI).translate(0, -0.65, 0).toNonIndexed()])!;
      const glowG = new T.CylinderGeometry(0.28, 0.22, 0.75, 8);
      const lm: T.Matrix4[] = [], gm: T.Matrix4[] = [];
      for (const z of naveBays) for (const x of [-4, 4, -11.2, 11.2]) {
        const y = Math.abs(x) > 8 ? 8.6 : 9.2;
        lm.push(new T.Matrix4().makeTranslation(x, y, z)); gm.push(new T.Matrix4().makeTranslation(x, y, z));
        k.beam(v(x, y + 0.9, z), v(x, Math.abs(x) > 8 ? 10.8 + av.prof(Math.abs(x) - (NX + 0.45 + (AX - 0.4 - NX - 0.45) / 2)) - 0.2 : SPRING + nv.prof(x) - 0.2, z), 0.025, iron, 4);
      }
      k.instances(lantern, bronze, lm); k.instances(glowG, k.glow(0xffc070), gm);
      for (const z of [35, 21, 7]) for (const x of [-4, 4]) k.point(x, 8.2, z, 0xffc890, 40, 16);
    }
    /* votive candles in racks along the transept walls: red glass, each flame on its own breath */
    {
      const racks: [number, number, number][] = [];
      for (const s of [-1, 1]) { racks.push([s * 17.6, ZX - 1.0, PI]); racks.push([s * 22.4, ZX - 1.0, PI]); racks.push([s * 17.6, ZC + 1.0, 0]); }
      const cups: T.Matrix4[] = [], flames: T.Matrix4[] = [], base: number[] = [];
      const q = new T.Quaternion(), p = new T.Vector3(), vr = X.mulberry(88);
      for (const [x, z, ry] of racks) {
        const cs = Math.cos(ry), sn = Math.sin(ry), at = (lx: number, lz: number) => [x + lx * cs + lz * sn, z - lx * sn + lz * cs];
        for (let r = 0; r < 3; r++) { const [px, pz] = at(0, -r * 0.3); k.box(3.2, 0.12, 0.34, px, 0.8 + r * 0.22, pz, iron).rotation.y = ry; }
        for (const dx of [-1.55, 1.55]) { const [px, pz] = at(dx, -0.3); k.box(0.06, 1.25, 1.0, px, 0.62, pz, iron).rotation.y = ry; }
        k.keepOut.push({ x, z, r: 1.4 });
        for (let r = 0; r < 3; r++) for (let i = 0; i < 12; i++) {
          const lx = -1.4 + i * 0.255, ly = 0.92 + r * 0.22, lz = -r * 0.3;
          p.set(x + lx * cs + lz * sn, ly, z - lx * sn + lz * cs);
          cups.push(new T.Matrix4().compose(p, q, one));
          p.y += 0.12; flames.push(new T.Matrix4().compose(p, q, one)); base.push(vr() > 0.25 ? 1 : 0);
        }
      }
      const cupM = k.instances(new T.CylinderGeometry(0.05, 0.045, 0.1, 8), new T.MeshBasicMaterial({ color: 0xffffff }), cups);
      const flM = k.instances(new T.ConeGeometry(0.02, 0.08, 5), new T.MeshBasicMaterial({ color: 0xffffff }), flames);
      cupM.frustumCulled = flM.frustumCulled = false;
      const c = new T.Color(), rnd = X.mulberry(5), ph = cups.map(() => rnd() * 6.3);
      const glowFn = (t: number) => {
        for (let i = 0; i < cups.length; i++) {
          const f = base[i] ? 0.75 + 0.25 * Math.sin(t * 7.3 + ph[i]) * Math.sin(t * 3.1 + ph[i] * 2) : 0;
          cupM.setColorAt(i, c.setRGB(0.25 + 0.75 * f, 0.03 + 0.1 * f, 0.03));
          flM.setColorAt(i, c.setRGB(1.0 * f, 0.8 * f, 0.35 * f));
        }
        if (cupM.instanceColor) cupM.instanceColor.needsUpdate = true;
        if (flM.instanceColor) flM.instanceColor.needsUpdate = true;
      };
      glowFn(0);
      const lights = racks.filter((_, i) => i % 3 !== 1).map(([x, z]) => k.point(x, 1.9, z + (z > ZC + 5 ? -0.6 : 0.6), 0xff9a50, 7, 7));
      if (!ctx.reduced) k.ticks.push((t) => { glowFn(t); lights.forEach((l, i) => { l.intensity = 6 + 1.6 * Math.sin(t * 9 + i) * Math.sin(t * 4.3 + i * 2); }); });
    }
    /* light shafts from the south clerestory and the aisle windows, with dust turning in them */
    const shafts: T.Mesh[] = [];
    const shaftTex = canvasTex(64, 256, (g) => {
      const img = g.createImageData(64, 256);
      for (let j = 0; j < 256; j++) for (let i = 0; i < 64; i++) { const u = i / 63, vv = j / 255, a = Math.pow(Math.sin(u * PI), 2) * Math.pow(1 - vv, 0.7) * Math.min(1, vv * 8) * 255; const o = (j * 64 + i) * 4; img.data[o] = img.data[o + 1] = img.data[o + 2] = a; img.data[o + 3] = 255; }
      g.putImageData(img, 0, 0);
    });
    {
      const mk = (from: T.Vector3, to: T.Vector3, w: number, op: number) => {
        const L = from.distanceTo(to), g = new T.PlaneGeometry(w, L); g.rotateY(PI / 2);
        const m = new T.MeshBasicMaterial({ map: shaftTex, color: 0xffe8c0, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
        const o = k.mesh(g, m, (from.x + to.x) / 2, (from.y + to.y) / 2, (from.z + to.z) / 2, true);
        o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), from.clone().sub(to).normalize());
        shafts.push(o);
      };
      const dir = v(-70, -62, -6).normalize();
      naveBays.forEach((z) => { const from = v(NX, ARC_H + TRI_H + CLR_H / 2, z); const t = (from.y - 1) / -dir.y; mk(from, from.clone().addScaledVector(dir, t), 3.8, 0.22); });
      naveBays.forEach((z, i) => { if (i % 2) return; const from = v(AX, AW_LOW + 4, z); const t = (from.y - 0.2) / -dir.y; mk(from, from.clone().addScaledVector(dir, t), 2.6, 0.16); });
      if (!ctx.reduced) vapour(k, naveBays.map((z) => v(-1, 3, z - 0.3)), 14, { rise: 12, spread: 5, size: 0.025, opacity: 0.5, colour: 0xfff0d0, seed: 17, speed: 0.03, animate: true, additive: true });
    }
    /* the doors open to Fifth Avenue: steps, the street, cabs, Atlas and Rockefeller Center across the way */
    {
      const lime = k.pbr('spLime', X.ashlar(0xc8bea8, 98, 6), 0.3), asphalt = k.pbr('spAsph', X.asphalt(), 0.2), pave = k.pbr('spPave', X.pavers(0x9a948a, 99), 0.5);
      k.box(9, 0.3, 6, 0, -0.15, Z0 + 3.8, pave);
      for (let i = 0; i < 4; i++) k.box(30, 0.2, 0.5, 0, -0.1 - i * 0.2, Z0 + 5 + i * 0.5, lime);
      k.box(120, 0.3, 5, 0, -0.95, Z0 + 9, pave);
      k.box(120, 0.2, 24, 0, -1.0, Z0 + 23.5, asphalt);
      k.box(120, 0.3, 12, 0, -0.95, Z0 + 41.5, pave);
      k.box(80, 60, 20, 0, 29, Z0 + 58, k.pbr('spRock', X.windows(61, 0.2, 0xb8ae98, true), 0.1, { stretch: 0.3, roughness: 0.8 }));
      for (const s of [-1, 1]) k.box(30, 40, 30, s * 50, 19, Z0 + 48, lime);
      /* Atlas: the kneeling bronze, the sphere of rings on his shoulders, the granite plinth */
      k.box(4, 4.5, 4, 0, 1.3, Z0 + 43, k.flat(0x5a5652, 0, 0.7));
      const AT = k.flat(0x3a3020, 0.8, 0.4);
      { const b = k.mesh(new T.CapsuleGeometry(0.8, 2.4, 4, 10), AT, 0, 5.4, Z0 + 43); b.rotation.x = 0.35; k.sphere(0.5, 0, 7.4, Z0 + 42.6, AT, 10); }
      for (let i = 0; i < 5; i++) { const r = k.torus(3.2, 0.09, 0, 10.6, Z0 + 43, gilt, 40); r.rotation.set(i * 0.6, i * 0.7, 0.3); }
      k.beam(v(-3.4, 8, Z0 + 43), v(3.4, 13.2, Z0 + 43), 0.08, gilt, 6);
      if (!ctx.reduced) {
        const NC = 12, cabs = k.instances(new T.BoxGeometry(4.6, 1.5, 2), new T.MeshStandardMaterial({ roughness: 0.5, metalness: 0.3 }), Array.from({ length: NC }, () => new T.Matrix4()));
        cabs.frustumCulled = false;
        const rnd = X.mulberry(51), c = new T.Color();
        const st = Array.from({ length: NC }, (_, i) => ({ s: rnd() * 120, lane: Z0 + 14 + (i % 4) * 4.2, v: 7 + rnd() * 5 }));
        st.forEach((_, i) => cabs.setColorAt(i, c.set(i % 3 ? 0xf2c21a : [0x1c1e22, 0xe8e8e8, 0x2a3a5a][i % 3 === 0 ? (i / 3) % 3 | 0 : 0])));
        if (cabs.instanceColor) cabs.instanceColor.needsUpdate = true;
        const m = new T.Matrix4();
        const place = (_t: number, dt: number) => { st.forEach((a, i) => { a.s = (a.s + a.v * Math.min(dt, 0.1)) % 120; m.makeTranslation(60 - a.s, -0.1, a.lane); cabs.setMatrixAt(i, m); }); cabs.instanceMatrix.needsUpdate = true; };
        place(0, 0); k.ticks.push(place);
        k.crowd([v(-50, -0.8, Z0 + 9), v(50, -0.8, Z0 + 9)], 14, { seed: 61, speed: 1.1, spread: 2.5 });
        k.crowd([v(-50, -0.8, Z0 + 40), v(50, -0.8, Z0 + 40)], 12, { seed: 62, speed: 1.1, spread: 3 });
      }
      k.point(0, 6, Z0 - 1.5, 0xfff4e0, 18, 14);
    }
    /* people who came in off the avenue, walking the aisles */
    if (!ctx.reduced) {
      for (const s of [-1, 1]) k.crowd([v(s * 0.2, 0, 39.5), v(s * 0.2, 0, -5.9), v(s * 12.4, 0, -5.9), v(s * 12.4, 0, 39.5)], 9, { seed: 70 + s, speed: 0.4, spread: 0.9, closed: true, colors: [0x1c232c, 0x2a2a34, 0xe8e2d4, 0x2a3f6a, 0x6a2a2a, 0x3a4a3a, 0x8a8a90, 0xc8b8a0, 0xd82a3a] });
    }
    figure(k, 0, 1.9, ALZ - 1.2, 0xf0ece4, { rotY: 0, h: 0.95 });

    /* ---------- the works ---------- */
    const mounts: Mount[] = [];
    for (const z of naveBays) for (const s of [-1, 1]) mounts.push({ position: v(s * (AX - 0.42), 2.3, z), rotation: s > 0 ? -PI / 2 : PI / 2, target: v(s * 11.3, 2.3, z), width: 2.3, height: 1.65, style: 'gilt', wash: true });
    for (const s of [-1, 1]) mounts.push({ position: v(s * 10.8, 2.3, Z0 - 0.42), rotation: PI, target: v(s * 10.8, 2.3, 38.4), width: 2.3, height: 1.65, style: 'gilt', wash: true });
    for (const s of [-1, 1]) for (const z of [-9.9, -18.1]) mounts.push({ position: v(s * (TX - 0.82), 2.4, z), rotation: s > 0 ? -PI / 2 : PI / 2, target: v(s * (TX - 4), 2.4, z), width: 2.3, height: 1.65, style: 'gilt', wash: true });
    k.censusWall({ x: -21.5, y: 3.4, z: ZC + 0.42, rotY: 0, cols: 12, rows: 4, tile: 0.42, gap: 0.04, start: ctx.wallStart(5300, 48), pieces: ctx.all, backing: stoneDark });

    /* ---------- what the cathedral knows ---------- */
    const src = { name: "St. Patrick's Cathedral (Manhattan), Wikipedia", url: 'https://en.wikipedia.org/wiki/St._Patrick%27s_Cathedral_(Manhattan)' };
    k.egg(v(NX - 1, 3, 28), { id: 'cornerstone-1858', title: 'Twenty one years to open the doors', year: '1858', text: 'James Renwick Jr. drew the cathedral. The cornerstone was laid on August 15, 1858, work stopped in the early 1860s during the Civil War, and the cathedral was dedicated on May 25, 1879. The last stones of the spires went up in October 1888.', clue: 'Find the column nearest the door that holds up the first bay.', source: src }, { r: 2.6 });
    k.egg(v(0, ROSE_Y, Z0 - 1), { id: 'rose-window', title: 'Twenty six feet of blue', text: 'The rose window over the Fifth Avenue doors is 26 feet across and was designed by Charles Connick. It is blue, with red, green, white and gold panels.', clue: 'Turn your back on the altar and look up.', source: src }, { r: 5 });
    k.egg(v(-4.6, GY + 4, Z0 - 3), { id: 'organs', title: 'Nine thousand pipes', year: '1928 and 1930', text: 'The cathedral has two organs, both by George Kilgen & Son: the Chancel Organ, dedicated on January 30, 1928, and the Gallery Organ under the rose window, dedicated on February 11, 1930. Between them they have more than 9,000 pipes; the longest of the Gallery Organ\'s original pipes were 32 feet.', clue: 'The loudest thing in the building is above the door.', source: src }, { r: 3.5 });
    k.egg(v(0, 6, ALZ + 3.5), { id: 'baldachin', title: 'Bronze over marble', year: '1941', text: 'In 1941 an anonymous donor paid for a new high altar designed by Charles Maginnis, in grey white Italian marble, under a bronze baldachin. The baldachin stands on four piers and rises to a pinnacle with a statue of Christ the King.', clue: 'Four bronze legs, one figure at the very top.', source: src }, { r: 4 });
    k.egg(v(-NX + 1, 2, 7), { id: 'columns', title: 'Thirty two columns', text: 'Thirty two white marble columns divide the centre aisle from the side aisles. Each is five feet across, set up in sections of eight tons, and they rise 35 feet to the bottom of the arches that carry the nave ceiling.', clue: 'Put your hand on a column. It is five feet across.', source: src }, { r: 2.6 });
    k.egg(v(2.6, 2.5, Z0 + 0.4), { id: 'bronze-doors', title: 'Nine thousand two hundred pounds a door', year: '1949', text: 'The bronze doors on Fifth Avenue were blessed by Cardinal Spellman in December 1949. Each is 16.5 by 5.5 feet and weighs 9,200 pounds. They are usually left open to welcome visitors, with glass doors behind them to keep the heat in.', clue: 'The heaviest things you can walk through are standing open.', source: src }, { r: 2.4 });

    /* the sanctuary behind the rail, the gallery's footings and everything past the walls is out of bounds */
    k.block(-TX - 1, TX + 1, ZE - 20, ZC + 1.9);
    for (const s of [-1, 1]) { const a = s > 0 ? [AX - 0.4, TX + 1] : [-TX - 1, -AX + 0.4]; k.block(a[0], a[1], ZX + 0.4, Z0 + 1); }
    return { mounts, spawn: v(0, 3, 38.6), look: v(0, 8, -33), eye: 3, bounds: [-TX + 0.9, TX - 0.9, ZC + 0.5, Z0 - 0.9], style: 'gilt' };
  },
};
