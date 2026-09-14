/* Rooms 134 to 136: Essex Market, the Louis Armstrong House garden, Hamilton Grange.
   Landmark inspired exhibition adaptations, not measured reconstructions. Every one comes with its
   street and its skin: walk up from outside, read the building, then go in. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Kit, Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront } from './f';

const PI = Math.PI;
const UP = new T.Vector3(0, 1, 0);
const mat4 = (x: number, y: number, z: number, ry = 0, sx = 1, sy = 1, sz = 1) => new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromAxisAngle(UP, ry), new T.Vector3(sx, sy, sz));

/* Instanced meshes with a colour per instance: crates, produce, chairs. One draw for the lot. */
function coloured(k: Kit, g: T.BufferGeometry, m: T.Material, items: { m: T.Matrix4; c: number }[]) {
  const o = k.instances(g, m, items.map((i) => i.m));
  const c = new T.Color();
  items.forEach((i, j) => o.setColorAt(j, c.set(i.c)));
  if (o.instanceColor) o.instanceColor.needsUpdate = true;
  return o;
}

/* Pendant lamps that sway on their cords: one instanced cord, one shade and one bulb for the whole set. */
function pendants(k: Kit, hangs: T.Vector3[], drop: number, shade: T.Material, cord: T.Material, bulb: T.Material, animate: boolean, amp = 0.05) {
  const n = hangs.length, blank = () => hangs.map(() => new T.Matrix4());
  const cords = k.instances(new T.CylinderGeometry(0.012, 0.012, drop, 5), cord, blank());
  const shades = k.instances(new T.CylinderGeometry(0.1, 0.36, 0.3, 14, 1, true), shade, blank());
  const bulbs = k.instances(new T.SphereGeometry(0.07, 8, 6), bulb, blank());
  const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), s = new T.Vector3(1, 1, 1), ax = new T.Vector3(0, 0, 1);
  const place = (t: number) => {
    for (let i = 0; i < n; i++) {
      const a = amp * Math.sin(t * 1.1 + i * 0.9), h = hangs[i];
      q.setFromAxisAngle(ax, a);
      p.set((Math.sin(a) * drop) / 2, (-Math.cos(a) * drop) / 2, 0).add(h); m.compose(p, q, s); cords.setMatrixAt(i, m);
      p.set(Math.sin(a) * drop, -Math.cos(a) * drop, 0).add(h); m.compose(p, q, s); shades.setMatrixAt(i, m);
      p.set(Math.sin(a) * (drop + 0.08), -Math.cos(a) * (drop + 0.08), 0).add(h); m.compose(p, q, s); bulbs.setMatrixAt(i, m);
    }
    cords.instanceMatrix.needsUpdate = shades.instanceMatrix.needsUpdate = bulbs.instanceMatrix.needsUpdate = true;
  };
  place(0);
  if (animate) k.ticks.push((t) => place(t));
}

/* Steam or smoke: a handful of translucent puffs rising, spreading and fading out. */
function steam(k: Kit, x: number, y: number, z: number, n: number, animate: boolean, seed: number, tint = 0xffffff) {
  const m = new T.MeshBasicMaterial({ color: tint, transparent: true, opacity: 0.32, depthWrite: false });
  const o = k.instances(new T.SphereGeometry(0.1, 6, 5), m, Array.from({ length: n }, () => new T.Matrix4()));
  const rnd = X.mulberry(seed);
  const ph = Array.from({ length: n }, () => ({ o: rnd(), dx: (rnd() - 0.5) * 0.3, dz: (rnd() - 0.5) * 0.3 }));
  const mm = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), s = new T.Vector3();
  const place = (t: number) => {
    for (let i = 0; i < n; i++) {
      const u = (t * 0.3 + ph[i].o) % 1, sc = 0.5 + u * 2.4;
      p.set(x + ph[i].dx * (1 + u * 4), y + u * 1.8, z + ph[i].dz * (1 + u * 4)); s.set(sc, sc, sc);
      mm.compose(p, q, s); o.setMatrixAt(i, mm);
    }
    o.instanceMatrix.needsUpdate = true;
  };
  place(0);
  if (animate) k.ticks.push((t) => place(t));
}

/* A balustrade with a base height, for porches and decks that stand above the ground. */
function balustrade(k: Kit, x0: number, z0: number, x1: number, z1: number, y0: number, m: T.Material, h = 0.9, pitch = 1.1) {
  const a = v(x0, 0, z0), b = v(x1, 0, z1), n = Math.max(1, Math.round(a.distanceTo(b) / pitch));
  for (let i = 0; i <= n; i++) { const p = a.clone().lerp(b, i / n); k.box(0.06, h, 0.06, p.x, y0 + h / 2, p.z, m); }
  for (const yy of [h, h * 0.5]) k.beam(v(x0, y0 + yy, z0), v(x1, y0 + yy, z1), 0.035, m, 5);
}

/* A park bench built from static boxes so it merges into the room's draw calls (k.bench is fifteen meshes). */
function benchS(k: Kit, x: number, z: number, rotY: number, slats: T.Material, frame: T.Material, len = 2.2, y0 = 0) {
  const c = Math.cos(rotY), s = Math.sin(rotY);
  const mk = (w: number, h: number, d: number, px: number, py: number, pz: number, m: T.Material) => { const o = k.box(w, h, d, x + px * c + pz * s, y0 + py, z - px * s + pz * c, m); o.rotation.y = rotY; };
  for (let j = 0; j < 4; j++) mk(0.12, 0.05, len, j * 0.15 - 0.22, 0.62, 0, slats);
  for (let j = 0; j < 3; j++) mk(0.05, 0.13, len, 0.42 + j * 0.02, 0.85 + j * 0.15, 0, slats);
  for (const dz of [-len / 2 + 0.2, len / 2 - 0.2]) { mk(0.72, 0.06, 0.07, 0.05, 0.6, dz, frame); mk(0.06, 0.6, 0.07, -0.28, 0.3, dz, frame); mk(0.06, 0.6, 0.07, 0.38, 0.3, dz, frame); mk(0.06, 0.65, 0.07, 0.46, 0.95, dz, frame); }
  k.keepOut.push({ x, z, r: 0.9 });
}

/* ---------------- 134 ESSEX MARKET ---------------- */
export const essex: RoomDef = {
  id: 'essexmarket',
  name: 'The city at the counter',
  area: 'ESSEX MARKET / ESSEX CROSSING',
  mood: 'Saturday at noon',
  color: '#b8c7b8',
  description: 'Essex Street at Delancey, then the glass hall under its folded white ceiling: vendor islands under swaying pendants, fish on ice, the butcher, the coffee bar and its chalkboard, an escalator up to the long shared table on the mezzanine, the works on every stall front.',
  signatures: 'The 2019 hall at Essex Crossing: a tall glazed street edge with the tower above, a folded plate ceiling with light in the folds, terrazzo, vendor islands and pendants, a moving escalator to the mezzanine, the communal table, the Delancey Street subway stair on the corner.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad0, horizon: 0xe8e6e0, ground: 0x5a5a55, fog: 0.0022, sun: { az: 4.4, el: 0.62, color: 0xfff4e6, size: 12 }, env: 0.9 });
    k.hemi(0xf6f0e6, 0x4a4038, 0.85);
    k.sun(0xfff0d8, 1.9, -40, 60, 24, true, 90);
    const an = !ctx.reduced;
    const terr = k.pbr('esxTerrazzo', X.terrazzo(0xcfc9bb, 141), 0.5, { roughness: 0.35 }),
      plaster = k.pbr('esxPlaster', X.plaster(0xf0efea, 142), 0.3),
      conc = k.pbr('esxConcrete', X.concrete(0xa8a49c, 143), 0.4, { roughness: 0.8 }),
      steelD = k.flat(0x2a2e33, 0.7, 0.45),
      steelL = k.flat(0xb9bec4, 0.85, 0.3),
      glass = k.glass(0xdcecf2, 0.14, 0.05),
      wood = k.pbr('esxWood', X.planks(0x9a7a52, 5, 144), 1.2, { roughness: 0.55 }),
      dark = k.pbr('esxDarkWood', X.planks(0x3a2a20, 4, 145), 1.4, { roughness: 0.5 }),
      white = k.flat(0xe9e6df, 0.05, 0.5),
      ice = white,
      marble = k.pbr('esxMarble', X.marble(0xe8e4dc, 0x9a948a, 15), 0.6, { roughness: 0.25 }),
      tower = k.pbr('esxTower', X.windows(146, 0.3, 0x4a5a6a, false), 0.12, { emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.4, metalness: 0.5, stretch: 0.42 }),
      warm = k.glow(0xffe7c8),
      strip = k.glow(0xfff6e6),
      orange = k.flat(0xff6b00, 0, 0.6),
      black = k.flat(0x141414, 0.2, 0.6),
      tint = k.flat(0xffffff, 0, 0.8),
      fishM = steelL,
      meat = k.flat(0x9a2a2a, 0, 0.6),
      salmon = meat,
      cheese = k.flat(0xe8d090, 0, 0.6),
      green = k.flat(0x2f5a3a, 0.2, 0.6),
      bloom = [k.flat(0xd83a6a, 0, 0.8), k.flat(0xf1c531, 0, 0.8), k.flat(0xe8e2f0, 0, 0.8), k.flat(0x8a3ad8, 0, 0.8)];
    const rnd = X.mulberry(147);
    // Essex Street: the block, Delancey crossing on the corner, the subway stair, lamps, trees, the crowd
    street(k, { w: 18, len: 130, z: 0 });
    k.box(120, 0.03, 22, 0, 0.15, 40, k.pbr('asphaltS', X.asphalt(0x24282d), 0.11, { roughness: 0.62, metalness: 0.12 }));
    blockFront(k, { x: -14, z0: 26, count: 6, face: 1, seed: 148, h: [14, 22] });
    blockFront(k, { x: -14, z0: 100, count: 6, face: 1, seed: 149, h: [14, 22] });
    blockFront(k, { x: 14, z0: -30, count: 5, face: -1, seed: 150, h: [12, 18] });
    blockFront(k, { x: 14, z0: 100, count: 6, face: -1, seed: 151, h: [14, 20] });
    k.skyline({ z: -175, count: 20, spacing: 8, scale: 1.8, base: 0, seed: 152, lit: 0.2, glow: 0.4, tint: 0x7d8490, rows: 1 });
    k.skyline({ z: 205, count: 20, spacing: 8, scale: 1.8, base: 0, seed: 153, lit: 0.2, glow: 0.4, tint: 0x7d8490, rows: 1 });
    k.prop('hydrant', -10.6, 0, -6, { height: 1.1, keepOut: 0.5 });
    k.prop('mailbox', 10.8, 0, 30, { height: 1.5, rotY: -PI / 2, keepOut: 0.6 });
    for (const [x, z] of [[-10.6, -18], [-10.6, 14], [10.6, -18], [10.6, 34]]) k.lamp(x, z, 6, steelD, 0xffd9a8, 26);
    for (const z of [-12, 4, 18]) k.tree(-11.6, 0, z, { h: 6, r: 2.6, seed: 154 + z });
    k.tree(11.6, 0, -30, { h: 6, r: 2.6, seed: 155 });
    k.box(3, 0.05, 5, -11.5, 0.16, 24, black);
    k.rail(-13.1, 24, 5, green, 1.0, 'z', 1.0); k.rail(-9.9, 24, 5, green, 1.0, 'z', 1.0); k.rail(-11.5, 21.5, 3.2, green, 1.0, 'x', 1.0);
    k.cyl(0.06, 3.2, -9.9, 1.6, 26.5, green, 0.06, 8); k.sphere(0.22, -9.9, 3.35, 26.5, k.glow(0x4ad07a), 10); k.point(-9.9, 3.3, 26.5, 0x6af09a, 6, 5);
    k.sign('DELANCEY ST  ·  ESSEX ST', 2.6, 0.5, -11.5, 2.3, 26.6, '#1a3a2a', '#f4f2ea', 90, 0, { border: true, double: true });
    k.sign('F  J  M  Z', 2.0, 0.5, -11.5, 1.8, 26.6, '#1a3a2a', '#f4f2ea', 110, 0, { double: true });
    k.block(-13.2, -9.8, 21.4, 26.6);
    k.crowd([v(-11.6, 0, -60), v(-11.6, 0, 60)], 14, { seed: 156, speed: 1.0, spread: 1.6, animate: an });
    k.crowd([v(11.6, 0, -60), v(11.6, 0, 60)], 16, { seed: 157, speed: 0.9, spread: 1.6, animate: an });
    // the market: the hall's box, the tower over it, the glass front on Essex Street with the door at the middle
    const FX = 14, W = 36, D = 44, H = 11, BX = FX + W;
    k.box(W, 0.3, D, FX + W / 2, 0, 0, terr);
    k.box(0.4, H, D, BX - 0.2, H / 2, 0, plaster); k.block(BX - 0.6, BX + 2, -D / 2, D / 2);
    for (const s of [-1, 1]) { k.box(W, H, 0.4, FX + W / 2, H / 2, s * (D / 2 - 0.2), plaster); k.block(FX, BX, s * D / 2 - 0.6, s * D / 2 + 0.6); }
    k.box(W + 0.4, 1.6, D + 0.4, FX + W / 2, H + 0.8, 0, steelD);
    k.box(W - 3, 62, D - 2, FX + W / 2 + 1.5, H + 1.6 + 31, 0, tower);
    k.box(W - 2.6, 0.8, D - 1.6, FX + W / 2 + 1.5, H + 1.6 + 62.2, 0, steelD);
    for (const s of [-1, 1]) { k.box(0.12, H - 0.3, D / 2 - 2.4, FX, (H - 0.3) / 2 + 0.3, s * (D / 4 + 1.2), glass); }
    k.block(FX - 0.3, FX + 0.3, -D / 2, -2.4); k.block(FX - 0.3, FX + 0.3, 2.4, D / 2);
    k.box(0.12, H - 3.6, 4.8, FX, 3.6 + (H - 3.6) / 2, 0, glass);
    for (let z = -D / 2; z <= D / 2; z += 4.4) if (Math.abs(z) > 2.6) k.box(0.22, H, 0.16, FX, H / 2, z, steelD);
    for (const z of [-2.4, 2.4]) k.box(0.26, 3.7, 0.26, FX, 1.85, z, steelD);
    k.box(0.2, 0.16, D, FX, 3.6, 0, steelD); k.box(0.2, 0.5, D, FX, 0.4, 0, steelD); k.box(0.26, 0.3, 5, FX, 3.6, 0, steelD);
    k.box(0.14, 1.5, 11, FX - 0.1, 7.4, 0, black);
    k.sign('ESSEX MARKET', 9.5, 1.2, FX - 0.2, 7.4, 0, 'transparent', '#f4f2ea', 130, -PI / 2);
    const can = k.box(4.2, 0.14, 12, FX - 2.1, 4.75, 0, steelD); can.rotation.z = 0.08;
    k.sign('ESSEX MARKET  ·  SINCE 1940  ·  ESSEX CROSSING', 6.5, 0.5, FX - 4.3, 4.4, 0, '#141414', '#f4f2ea', 80, -PI / 2, { border: true });
    for (const z of [-5, 5]) k.beam(v(FX - 4, 4.4, z), v(FX - 0.1, 7.0, z), 0.04, steelD, 5);
    // the folded ceiling: alternating tilted plates, a steel beam and a light strip in every valley
    const NP = 10, PW = D / NP;
    for (let i = 0; i < NP; i++) {
      const z = -D / 2 + PW * (i + 0.5);
      const pnl = k.box(W - 0.8, 0.12, PW + 0.12, FX + W / 2, 10.2, z, plaster); pnl.rotation.x = i % 2 ? 0.26 : -0.26;
      if (i % 2 && i < NP - 1) { const zv = z + PW / 2; k.box(W - 1, 0.28, 0.28, FX + W / 2, 9.78, zv, steelD); k.box(W - 1.4, 0.06, 0.18, FX + W / 2, 9.6, zv, strip); }
    }
    for (const [x, z] of [[FX + 11, -12.5], [FX + 11, 12.5], [FX + 23, -12.5], [FX + 23, 12.5]]) { k.cyl(0.32, 9.7, x, 4.85, z, steelL, 0.32, 14); k.keepOut.push({ x, z, r: 0.6 }); }
    // the vendor islands: a counter, a marble top, a steel frame carrying the boards the works hang on, pendants, wares
    const hangs: T.Vector3[] = [], crates: { m: T.Matrix4; c: number }[] = [], produce: { m: T.Matrix4; c: number }[] = [];
    const mounts: Mount[] = [];
    const island = (x: number, z: number, name: string, kind: number) => {
      k.box(6, 1.0, 3.0, x, 0.65, z, wood);
      k.box(6.2, 0.08, 3.2, x, 1.19, z, marble);
      k.block(x - 3.1, x + 3.1, z - 1.6, z + 1.6);
      for (const dx of [-2.9, 2.9]) for (const dz of [-1.4, 1.4]) k.box(0.1, 4.6, 0.1, x + dx, 2.45, z + dz, steelD);
      for (const dz of [-1.5, 1.5]) k.box(6, 0.16, 0.06, x, 4.6, z + dz, steelD);
      k.box(6, 0.06, 3.0, x, 4.68, z, steelD);
      for (const dz of [-1.5, 1.5]) {
        k.box(4.8, 1.75, 0.08, x, 3.75, z + dz * 1.02, white);
        k.sign(name, 3.4, 0.42, x, 2.55, z + dz * 1.04, '#f4f2ea', '#1a1a1a', 84, dz > 0 ? 0 : PI, { border: true });
        mounts.push({ position: v(x, 3.75, z + dz * 1.06), rotation: dz > 0 ? 0 : PI, target: v(x, 3, z + dz * (dz * Math.sign(z) > 0 ? 2.7 : 4.6)), width: 4.4, height: 1.55, style: 'none', wash: false });
      }
      for (const dx of [-2, 0, 2]) hangs.push(v(x + dx, 4.6, z));
      k.point(x, 3.3, z, 0xffe6c0, 14, 8);
      if (kind === 0) for (let i = 0; i < 12; i++) { const cx = x - 2.5 + (i % 6) * 1.0, cz = z - 0.7 + Math.floor(i / 6) * 1.4; crates.push({ m: mat4(cx, 1.4, cz, (rnd() - 0.5) * 0.3), c: [0x8a6a3a, 0xb8a070, 0x2f5a3a][i % 3] }); for (let j = 0; j < 8; j++) produce.push({ m: mat4(cx - 0.3 + (j % 4) * 0.2, 1.62, cz - 0.12 + Math.floor(j / 4) * 0.24), c: [0xd83a2a, 0x2f7a3a, 0xf1c531, 0xe87a2a, 0x8a3ad8][Math.floor(rnd() * 5)] }); }
      if (kind === 1) { k.box(0.04, 0.04, 5.6, x, 3.4, z, steelL); for (let i = 0; i < 11; i++) { const cx = x - 2.5 + i * 0.5; k.cyl(0.11, 0.7 + rnd() * 0.4, cx, 2.9, z + (i % 2 ? 0.5 : -0.5), meat, 0.09, 8); k.beam(v(cx, 3.4, z + (i % 2 ? 0.5 : -0.5)), v(cx, 3.3, z + (i % 2 ? 0.5 : -0.5)), 0.02, steelL, 3); } for (let i = 0; i < 7; i++) k.cyl(0.28, 0.2, x - 2.4 + i * 0.8, 1.33, z + 0.7, cheese, 0.28, 12); for (let i = 0; i < 4; i++) k.mesh(new T.SphereGeometry(0.3, 10, 8), cheese, x - 1.8 + i * 1.2, 1.5, z - 0.7).scale.set(1, 1.4, 1); }
      if (kind === 2) for (let i = 0; i < 10; i++) { const cx = x - 2.4 + (i % 5) * 1.2, cz = z + (i < 5 ? -0.8 : 0.8); k.cyl(0.24, 0.5, cx, 1.48, cz, steelL, 0.2, 10); for (let j = 0; j < 6; j++) k.sphere(0.13, cx + (rnd() - 0.5) * 0.4, 1.85 + rnd() * 0.2, cz + (rnd() - 0.5) * 0.4, bloom[(i + j) % 4], 6); }
      if (kind === 3) for (let i = 0; i < 8; i++) { const cx = x - 2.4 + (i % 4) * 1.6, cz = z + (i < 4 ? -0.7 : 0.7); k.box(1.2, 0.3, 0.9, cx, 1.38, cz, wood); for (let j = 0; j < 4; j++) k.mesh(new T.SphereGeometry(0.16, 8, 6), cheese, cx - 0.4 + j * 0.27, 1.62, cz).scale.set(1, 0.7, 2); }
      if (kind === 4) for (let i = 0; i < 16; i++) { const cx = x - 2.6 + (i % 8) * 0.75, cz = z + (i < 8 ? -0.7 : 0.7); k.cyl(0.18, 0.28, cx, 1.37, cz, steelL, 0.18, 10); k.mesh(new T.ConeGeometry(0.16, 0.22, 10), [meat, bloom[1], green, bloom[0]][i % 4], cx, 1.62, cz); }
      if (kind === 5) { k.box(3.2, 0.1, 1.4, x + 1, 1.28, z, steelL); k.box(2.2, 0.5, 1.2, x - 1.6, 1.48, z, steelD); steam(k, x + 1, 1.5, z, 10, an, 159 + kind); k.point(x + 1, 1.7, z, 0xffb060, 5, 3); }
    };
    island(18.5, -7, 'GREENMARKET PRODUCE', 0); island(26, -7, 'CHEESE  ·  CHARCUTERIE', 1); island(33.5, -7, 'FLOWERS  ·  PLANTS', 2);
    island(18.5, 7, 'BAKERY  ·  BIALYS', 3); island(26, 7, 'SPICES  ·  TEAS', 4); island(33.5, 7, 'TACOS  ·  TORTAS', 5);
    coloured(k, new T.BoxGeometry(0.7, 0.4, 0.5), tint, crates);
    coloured(k, new T.SphereGeometry(0.09, 7, 6), tint, produce);
    pendants(k, hangs, 1.4, k.flat(0x1e2226, 0.4, 0.5, { side: T.DoubleSide }), steelD, warm, an);
    // the back counters under the mezzanine: fish on ice, the butcher with the rail of hams
    const back = (z0: number, z1: number, name: string, fish: boolean) => {
      const zc = (z0 + z1) / 2, len = z1 - z0;
      k.box(2.0, 1.0, len, BX - 10, 0.65, zc, white);
      k.box(2.2, 0.06, len + 0.2, BX - 10, 1.18, zc, steelL);
      const gl = k.box(0.06, 0.95, len, BX - 11.02, 1.7, zc, glass); gl.rotation.z = -0.32;
      k.sign(name, 4.6, 0.56, BX - 11.06, 4.2, zc, '#141414', '#f4f2ea', 80, -PI / 2, { border: true });
      for (const dz of [-len / 4, len / 4]) k.point(BX - 10, 3.4, zc + dz, 0xffe6c0, 16, 9);
      if (fish) { k.box(1.6, 0.16, len - 0.4, BX - 10, 1.28, zc, ice); for (let i = 0; i < 22; i++) { const cz = z0 + 0.5 + i * ((len - 1) / 21), m = k.mesh(new T.SphereGeometry(0.11, 8, 6), i % 5 === 2 ? salmon : fishM, BX - 10.4 + (i % 2) * 0.8, 1.4, cz); m.scale.set(1, 0.5, 2.6); m.rotation.y = (rnd() - 0.5) * 0.6; } }
      else { k.box(0.04, 0.04, len - 1, BX - 9.2, 3.9, zc, steelL); for (let i = 0; i < 10; i++) { const cz = z0 + 0.9 + i * ((len - 1.8) / 9); k.mesh(new T.SphereGeometry(0.2, 8, 6), meat, BX - 9.2, 3.35, cz).scale.set(1, 1.8, 1); k.beam(v(BX - 9.2, 3.9, cz), v(BX - 9.2, 3.7, cz), 0.015, steelL, 3); } for (let i = 0; i < 8; i++) k.box(0.5, 0.18, 0.35, BX - 10.4 + (i % 2) * 0.8, 1.3, z0 + 1 + i * 1.8, i % 3 ? meat : salmon); }
    };
    back(-19, -3, 'FISH  ·  SHELLFISH  ·  ON ICE', true);
    back(3, 19, 'BUTCHER  ·  CHARCUTERIE', false);
    k.block(BX - 11.2, BX - 8.6, -20, 20);
    // the mezzanine: a concrete slab on the back third, a glass rail, the long shared table, stools, pendants, the works on a hanging board
    k.box(10, 0.3, D, BX - 5, 5.0, 0, conc);
    k.box(0.2, 0.5, D - 4, BX - 9.9, 4.9, 0, steelD);
    k.box(0.06, 1.05, D - 4.8, BX - 9.5, 5.7, 0, glass); k.box(0.08, 0.08, D - 4.8, BX - 9.5, 6.25, 0, steelL);
    for (let z = -19.2; z <= 19.2; z += 2.4) k.box(0.08, 1.1, 0.08, BX - 9.5, 5.7, z, steelD);
    k.box(0.1, 1.8, 40, BX - 11.0, 4.1, 0, white);
    for (const z of [-15, -5, 5, 15]) mounts.push({ position: v(BX - 11.08, 4.15, z), rotation: -PI / 2, target: v(BX - 17, 3, Math.abs(z) < 6 ? Math.sign(z) * 4.4 : z), width: 3.2, height: 1.5, style: 'black', wash: false });
    k.box(1.6, 0.1, 30, BX - 3.5, 5.9, 0, wood);
    for (const z of [-14, -7, 0, 7, 14]) k.box(1.2, 0.75, 0.12, BX - 3.5, 5.52, z, steelD);
    const stools: T.Matrix4[] = [];
    for (let z = -14; z <= 14; z += 1.6) for (const dx of [-1.25, 1.25]) stools.push(mat4(BX - 3.5 + dx, 5.45, z));
    k.instances(new T.CylinderGeometry(0.18, 0.16, 0.62, 10), steelD, stools);
    k.block(BX - 5.4, BX - 1.6, -15.5, 15.5);
    pendants(k, [-12, -6, 0, 6, 12].map((z) => v(BX - 3.5, 9.5, z)), 1.1, k.flat(0x1e2226, 0.4, 0.5, { side: T.DoubleSide }), steelD, warm, an, 0.03);
    for (const z of [-10, 0, 10]) k.point(BX - 4, 8.6, z, 0xffe6c0, 16, 10);
    k.censusWall({ x: BX - 0.45, y: 8.15, z: 0, rotY: -PI / 2, cols: 36, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(6000, 144), pieces: ctx.all, backing: steelD });
    k.sign('ESSEX MARKET  ·  THE CITY AT THE COUNTER', 8, 0.5, BX - 0.45, 6.55, 0, 'transparent', '#e8e2d0', 70, -PI / 2);
    k.crowd([v(43, 5, -19), v(43, 5, 19)], 6, { seed: 160, speed: 0.4, spread: 1.0, animate: an });
    // the stair on the south wall and the escalator on the north, both rising fourteen metres to the mezzanine
    for (let i = 0; i < 20; i++) { const top = (i + 1) * 0.25; k.box(0.7, top, 1.8, 26.35 + i * 0.7, top / 2, -21, terr); }
    const bal = k.box(14.9, 1.0, 0.04, 33, 3.0, -20.05, glass); bal.rotation.z = 0.343;
    const rl = k.box(14.9, 0.08, 0.08, 33, 3.55, -20.05, steelL); rl.rotation.z = 0.343;
    for (let x = 27; x <= 39; x += 2) k.box(0.05, 1.0, 0.05, x, (5 * (x - 26)) / 14 + 0.5, -20.05, steelD);
    k.block(26, 40, -20.3, -19.85);
    k.sign('"MEZZANINE"', 2.2, 0.5, 25.2, 2.6, -21.7, 'transparent', '#1a1a1a', 110, 0);
    const EZ = 21;
    const truss = k.box(14.9, 0.6, 1.6, 33, 2.05, EZ, steelD); truss.rotation.z = 0.343;
    for (const dz of [-0.75, 0.75]) { const b = k.box(14.9, 1.0, 0.05, 33, 3.05, EZ + dz, glass); b.rotation.z = 0.343; const r = k.box(14.9, 0.08, 0.1, 33, 3.6, EZ + dz, black); r.rotation.z = 0.343; }
    const steps = k.instances(new T.BoxGeometry(0.62, 0.24, 1.3), steelL, Array.from({ length: 22 }, () => new T.Matrix4()));
    const knobs = k.instances(new T.BoxGeometry(0.3, 0.06, 0.12), orange, Array.from({ length: 16 }, () => new T.Matrix4()));
    const em = new T.Matrix4(), eq = new T.Quaternion(), ep = new T.Vector3(), es = new T.Vector3(1, 1, 1);
    const esc = (t: number) => {
      for (let i = 0; i < 22; i++) { const d = (i * 0.64 + t * 0.55) % 14.08; ep.set(26 + d, (d / 14) * 5 - 0.12, EZ); em.compose(ep, eq, es); steps.setMatrixAt(i, em); }
      for (let i = 0; i < 16; i++) { const d = (i * 1.76 + t * 0.55) % 14.08; ep.set(26 + d, (d / 14) * 5 + 1.12, EZ + (i % 2 ? 0.75 : -0.75)); em.compose(ep, eq, es); knobs.setMatrixAt(i, em); }
      steps.instanceMatrix.needsUpdate = knobs.instanceMatrix.needsUpdate = true;
    };
    esc(0); if (an) k.ticks.push(esc);
    k.block(26, 40, 20.0, 20.5);
    // the coffee bar in the north west corner: the counter, the back bar, the machine and its steam, the chalkboard
    k.box(7, 1.1, 0.8, 19, 0.7, 15, dark); k.box(7.2, 0.06, 1.0, 19, 1.28, 15, marble); k.block(15.4, 22.6, 14.5, 15.5);
    k.box(7, 1.0, 0.7, 19, 0.65, 21.3, dark); k.box(7, 0.06, 0.7, 19, 1.18, 21.3, marble);
    k.box(0.9, 0.55, 0.6, 17.5, 1.5, 21.2, steelL); k.box(0.3, 0.2, 0.3, 17.5, 1.88, 21.2, steelD); steam(k, 17.5, 1.95, 21.0, 10, an, 161);
    for (let i = 0; i < 12; i++) k.cyl(0.05, 0.08, 19.4 + (i % 6) * 0.35, 1.25, 21.1 + Math.floor(i / 6) * 0.25, white, 0.04, 8);
    k.sign('COFFEE  ·  EGG CREAMS  ·  BIALYS', 5.2, 0.6, 17.8, 3.95, 21.74, '#1c221c', '#e8e2d0', 84, PI, { border: true });
    k.sign('ESPRESSO 3.50   CORTADO 4.50   DRIP 2.75   EGG CREAM 4   BIALY 2', 5.2, 0.5, 17.8, 3.3, 21.74, '#1c221c', '#cfd8c8', 52, PI);
    for (let i = 0; i < 5; i++) { const x = 16 + i * 1.5; k.cyl(0.16, 0.7, x, 0.5, 14.2, steelD, 0.14, 10); k.keepOut.push({ x, z: 14.2, r: 0.4 }); }
    k.point(19, 3.6, 18, 0xffe0b0, 14, 9);
    for (const x of [21, 24.2]) mounts.push({ position: v(x, 4.3, D / 2 - 0.26), rotation: PI, target: v(x, 3, 11.5), width: 2.8, height: 1.7, style: 'black', wash: true });
    // the cafe corner on the south side: marble tables under the works on the wall, and the wall above the stair
    for (const [x, z] of [[17, -15], [21, -15], [17, -19], [21, -19]]) { k.cyl(0.05, 0.72, x, 0.5, z, steelD, 0.05, 8); k.cyl(0.45, 0.04, x, 0.88, z, marble, 0.45, 18); k.keepOut.push({ x, z, r: 0.9 }); }
    for (const x of [18, 23]) mounts.push({ position: v(x, 4.3, -D / 2 + 0.26), rotation: 0, target: v(x, 3, -12.5), width: 3.6, height: 2.0, style: 'black', wash: true });
    for (const x of [30, 36]) mounts.push({ position: v(x, 6.6, -D / 2 + 0.26), rotation: 0, target: v(x, 3, -12.5), width: 3.6, height: 2.0, style: 'black', wash: true });
    for (const z of [-16, 16]) for (const x of [20, 30]) k.point(x, 8.8, z, 0xfff0dc, 20, 14);
    k.crowd([v(16, 0, 0), v(22.2, 0, 2), v(22.2, 0, 14), v(29.8, 0, 14), v(29.8, 0, 1), v(37.6, 0, 0), v(37.6, 0, -14), v(22.2, 0, -14), v(22.2, 0, -2)], 16, { seed: 162, speed: 0.5, spread: 1.4, animate: an, closed: true });
    return {
      mounts, spawn: v(-1, 3, 3), look: v(24, 4.2, -1), eye: 3, bounds: [-13.4, BX - 0.6, -D / 2 + 0.6, 60], style: 'black',
      floorY: (x, z) => {
        if (x >= 40) return x <= 50 ? 5 : 0;
        if (x > 26 && x < 40 && (Math.abs(z + 21) < 1.2 || Math.abs(z - EZ) < 1.0)) return (5 * (x - 26)) / 14;
        return 0;
      },
    };
  },
};

/* ---------------- 135 THE LOUIS ARMSTRONG HOUSE ---------------- */
export const armstrong: RoomDef = {
  id: 'armstronggarden',
  name: 'The garden listens',
  area: 'LOUIS ARMSTRONG HOUSE / CORONA',
  mood: 'A Queens afternoon',
  color: '#bc9c79',
  description: '107th Street in Corona: the brick house with its stoop, then the garden behind the fence, the trellis, the koi pond, the brick barbecue, a trumpet on a plinth and a record turning on the patio, the neighbours passing, the 7 train on the elevated a few blocks off, the works hung on the fence, the trellis and the house wall.',
  signatures: 'The two storey brick house Louis and Lucille bought in 1943 on a block of houses like it, the stoop, the side garden Lucille planted with its trellis, koi pond and brick barbecue, wind chimes, utility poles, the elevated 7 train on the horizon.',
  build(k, ctx) {
    k.sky({ top: 0x4f8cd0, horizon: 0xd2dde6, ground: 0x5a5a55, fog: 0.0018, sun: { az: 1.2, el: 0.6, color: 0xfff4e6, size: 12 }, haze: 0.1, env: 0.9 });
    k.hemi(0xfff3e0, 0x4a4238, 0.9);
    k.sun(0xfff0d8, 2.2, 40, 50, -30, true, 80);
    const an = !ctx.reduced;
    const brick = k.pbr('laBrick', X.brick(0x8a4a3a, 171), 0.28),
      tan = k.pbr('laTan', X.brick(0xb99a72, 172), 0.28),
      siding = k.pbr('laSiding', X.plaster(0xdad6cc, 173), 0.5),
      trim = k.flat(0xf1eee4, 0, 0.6),
      lime = k.pbr('laLime', X.ashlar(0xc8c0b0, 174, 2), 0.5),
      pav = k.pbr('laBluestone', X.pavers(0x6f7478, 175), 0.5),
      lawn = k.pbr('laLawn', X.grass(0x4a7a3a, 176), 0.2),
      fence = k.pbr('laFence', X.planks(0x8a6a48, 4, 177, 0.3), 1.0),
      iron = k.flat(0x1f242a, 0.75, 0.45),
      glass = k.glass(0xbfd6e2, 0.3, 0.08),
      warm = k.glow(0xffd8a0),
      door = k.pbr('laDoor', X.planks(0x3a2418, 3, 178), 1.2),
      water = k.flat(0x1f4a4a, 0.3, 0.15, { transparent: true, opacity: 0.85 }),
      rock = k.pbr('laRock', X.ashlar(0x8a8378, 179, 1), 0.5, { roughness: 0.95 }),
      brass = k.flat(0xd8b048, 0.95, 0.25),
      vine = k.flat(0x3f6f38, 0, 0.95),
      wisteria = k.flat(0x8a6ad8, 0, 0.9),
      hydrangea = k.flat(0x6a7ad8, 0, 0.9),
      lily = k.flat(0x2f6a3a, 0, 0.9),
      steelD = k.flat(0x2a2e33, 0.7, 0.45),
      steelL = k.flat(0xb9bec4, 0.85, 0.3),
      vinyl = k.flat(0x111111, 0.2, 0.4),
      label = k.flat(0xc82a2a, 0, 0.6),
      koiO = k.flat(0xe86a20, 0, 0.5),
      koiW = k.flat(0xf0ece0, 0, 0.5);
    const rnd = X.mulberry(180);
    // 107th Street: a block of modest houses, stoops, utility poles, street trees, the neighbours out walking
    street(k, { w: 12, len: 120, z: 0, walk: 4 });
    const house = (fx: number, z: number, face: 1 | -1, w: number, m: T.Material, h: number, i: number) => {
      const d = 12, cx = fx - (face * d) / 2, fxx = fx + face * 0.09;
      k.box(d, h, w, cx, h / 2, z, m);
      k.box(d + 0.2, 0.3, w + 0.2, cx, h + 0.1, z, lime);
      for (let f = 0; f < 2; f++) { const y = 2.5 + f * 3.1; for (const dz of [-w / 4, w / 4]) { k.box(0.16, 1.9, 1.2, fxx, y, z + dz, trim); k.box(0.06, 1.6, 0.95, fx + face * 0.2, y, z + dz, (i + f) % 3 === 0 ? warm : glass); } }
      const dz = w / 2 - 1.3;
      k.box(0.2, 2.3, 1.1, fxx, 2.45, z + dz, door);
      for (let s = 0; s < 4; s++) { const hh = 1.4 - s * 0.35; k.box(0.4, hh, 1.5, fx + face * (0.2 + s * 0.4), hh / 2 + 0.14, z + dz, lime); }
      k.rail(fx + face * 2.6, z, w - 0.4, iron, 0.9, 'z', 1.2);
    };
    const mats = [brick, tan, siding];
    for (let i = 0; i < 9; i++) house(-13, -40 + i * 9.5, 1, 8.6, mats[i % 3], 7.2 + (i % 2) * 0.6, i);
    for (let i = 0; i < 4; i++) house(13, 8.5 + i * 9.5, -1, 8.6, mats[(i + 1) % 3], 7.2 + (i % 2) * 0.6, i + 9);
    for (let i = 0; i < 3; i++) house(13, -25.5 - i * 9.5, -1, 8.6, mats[(i + 2) % 3], 7.2 + (i % 2) * 0.6, i + 13);
    k.block(-25.2, -12.8, -46, 42); k.block(-10.6, -10.2, -46, 42);
    k.block(12.8, 33.5, 3.8, 42); k.block(10.2, 10.6, 3.8, 42);
    k.block(12.8, 37.2, -50, -20.25); k.block(10.2, 10.6, -50, -20.25);
    for (const z of [-36, -22, -8, 6, 20, 34]) k.tree(-8.6, 0, z, { h: 6 + (z % 3), r: 2.8, seed: 181 + z });
    for (const z of [-30, 12, 26]) k.tree(8.6, 0, z, { h: 6, r: 2.8, seed: 190 + z });
    k.prop('utility_pole', -9.3, 0, -14, { height: 9, keepOut: 0.4 }); k.prop('utility_pole', 9.3, 0, 22, { height: 9, keepOut: 0.4 }); k.prop('utility_pole', -9.3, 0, 30, { height: 9, keepOut: 0.4 });
    k.prop('hydrant', 9.4, 0, -24, { height: 1.1, keepOut: 0.5 });
    k.lamp(-9.2, 2, 6, iron, 0xffd9a8, 24); k.lamp(9.2, -34, 6, iron, 0xffd9a8, 24);
    k.crowd([v(-8.2, 0, -52), v(-8.2, 0, 52)], 10, { seed: 182, speed: 0.8, spread: 1.2, animate: an });
    k.crowd([v(8.2, 0, -52), v(8.2, 0, 52)], 10, { seed: 183, speed: 0.7, spread: 1.2, animate: an });
    k.skyline({ z: -180, count: 18, spacing: 9, scale: 1.2, base: 0, seed: 184, lit: 0.15, glow: 0.3, tint: 0x8a8690, rows: 1 });
    // the 7 train on the elevated, a few blocks north, passing every couple of minutes
    k.box(300, 1.4, 7, 0, 8.4, 78, steelD);
    for (let x = -144; x <= 144; x += 12) for (const dz of [-2.6, 2.6]) k.cyl(0.4, 8, x, 4, 78 + dz, steelD, 0.4, 10);
    for (const dz of [-1, 1]) k.box(300, 0.1, 0.1, 0, 9.15, 78 + dz, steelL);
    const train = new T.Group();
    for (const dz of [-15.2, 0, 15.2]) { const car = new T.Mesh(new T.BoxGeometry(2.9, 3.0, 14.4), steelL); car.position.set(0, 0, dz); train.add(car); const win = new T.Mesh(new T.BoxGeometry(2.96, 0.9, 13.6), warm); win.position.set(0, 0.5, dz); train.add(win); }
    const band = new T.Mesh(new T.BoxGeometry(2.98, 0.3, 45.2), k.flat(0x8a2a9a, 0.2, 0.6)); band.position.y = -0.3; train.add(band);
    k.add(train);
    const route: T.Vector3[] = [];
    for (let x = -280; x <= 280; x += 40) route.push(v(x, 10.6, 78));
    route.push(v(320, 10.6, 90), v(320, 10.6, 520), v(-320, 10.6, 520), v(-320, 10.6, 90));
    if (an) k.rider(train, k.spline(route, true), 13, 200); else train.position.set(-40, 10.6, 78);
    // the house at 34-56: red brick, two storeys, the stoop up to the door, the forecourt fence
    const HX = 13, HZ0 = -4.5, HZ1 = 3.5, HW = HZ1 - HZ0, HZ = (HZ0 + HZ1) / 2, HH = 7.6;
    k.box(14, HH, HW, HX + 7, HH / 2, HZ, brick);
    k.box(14.2, 0.35, HW + 0.2, HX + 7, HH + 0.12, HZ, lime);
    k.box(14, 0.6, HW, HX + 7, HH + 0.55, HZ, brick);
    k.box(0.16, 0.5, HW + 0.1, HX - 0.05, 4.05, HZ, lime);
    for (const [y, zs] of [[2.7, [-2.6, -0.6]], [5.8, [-2.6, -0.5, 1.6]]] as [number, number[]][]) for (const z of zs) { k.box(0.16, 1.9, 1.2, HX - 0.09, y, z, trim); k.box(0.06, 1.6, 0.95, HX - 0.2, y, z, y > 4 ? warm : glass); k.box(0.2, 0.12, 1.4, HX - 0.1, y - 1.05, z, lime); }
    k.box(0.2, 2.3, 1.2, HX - 0.09, 2.5, 1.8, door);
    k.box(0.02, 0.3, 0.5, HX - 0.21, 3.35, 1.8, k.flat(0xd8b048, 0.9, 0.3));
    k.sign('34-56', 0.5, 0.2, HX - 0.23, 3.35, 1.8, 'transparent', '#1a1a1a', 90, -PI / 2);
    k.prop('stoop', HX - 1.25, 0, 1.8, { height: 1.5, rotY: -PI / 2 });
    for (const s of [-1, 1]) k.rail(HX - 1.3, 1.8 + s * 0.75, 2.2, iron, 0.9, 'x', 1.0);
    k.box(2.4, 0.06, HW, HX - 1.4, 0.16, HZ, pav);
    k.rail(10.6, HZ, HW, iron, 0.9, 'z', 0.8);
    k.block(HX, HX + 14, HZ0, HZ1); k.block(10.4, 10.8, HZ0, HZ1 + 0.1);
    k.sign('LOUIS ARMSTRONG HOUSE MUSEUM  ·  NATIONAL HISTORIC LANDMARK', 2.6, 0.5, 10.45, 1.5, -5.5, '#3a2a1a', '#f4ecd8', 60, -PI / 2, { border: true });
    k.box(0.06, 1.7, 0.06, 10.55, 0.85, -5.5, iron);
    // the garden lot: lawn, the bluestone patio and path, the fences and the garage wall the census hangs on
    k.box(22.4, 0.28, 24, 21.8, 0.0, -8.25, lawn);
    k.box(12, 0.06, 9, 20, 0.16, -10.5, pav);
    k.box(3.6, 0.06, 2.4, 12.3, 0.16, -11.5, pav);
    k.box(2.0, 0.06, 5, 27.5, 0.16, -8.5, pav);
    k.rail(10.6, -16.55, 6.9, iron, 1.6, 'z', 0.5); k.rail(10.6, -7.2, 5.4, iron, 1.6, 'z', 0.5);
    for (const z of [-13.1, -9.9]) { k.box(0.44, 2.0, 0.44, 10.6, 1.0, z, brick); k.box(0.56, 0.12, 0.56, 10.6, 2.05, z, lime); }
    k.sign('"GARDEN"', 1.2, 0.3, 10.34, 1.55, -9.9, 'transparent', '#1a1a1a', 100, -PI / 2);
    k.block(10.4, 10.8, -20.3, -13.0); k.block(10.4, 10.8, -10.0, HZ0);
    k.box(22.4, 3.4, 0.12, 21.8, 1.84, -20, fence); for (let x = 11; x <= 33; x += 2.2) k.box(0.16, 3.6, 0.16, x, 1.94, -20, fence);
    k.block(10.4, 33.2, -20.3, -19.7);
    k.box(4, 5.4, 12, 35, 2.7, -14, tan); k.box(4.4, 0.3, 12.4, 35, 5.5, -14, lime);
    k.block(32.8, 37.2, -20.3, -7.8);
    k.box(0.12, 3.4, 11.8, 33, 1.84, -2.1, fence); for (let z = -7.8; z <= 3.8; z += 2.2) k.box(0.16, 3.6, 0.16, 33, 1.94, z, fence);
    k.block(32.8, 33.2, -8, 3.9);
    k.box(6, 3.0, 0.12, 30, 1.64, 3.6, fence);
    k.block(26.8, 33.2, 3.4, 3.8);
    k.censusWall({ x: 32.93, y: 4.4, z: -14, rotY: -PI / 2, cols: 22, rows: 2, tile: 0.45, gap: 0.04, start: ctx.wallStart(3300, 44), pieces: ctx.all, backing: iron });
    k.sign('CORONA  ·  107TH STREET  ·  THE NEIGHBOURS', 5, 0.36, 32.93, 5.15, -14, 'transparent', '#f4ecd8', 60, -PI / 2);
    // the trellis over the patio: posts, beams, slats, the lattice on the west end, vines and wisteria hanging through
    for (const x of [17, 21, 25]) for (const z of [-13, -8]) { k.box(0.16, 2.95, 0.16, x, 1.62, z, fence); k.keepOut.push({ x, z, r: 0.3 }); }
    for (const z of [-13, -8]) k.box(8.6, 0.16, 0.18, 21, 3.05, z, fence);
    for (let x = 17.2; x <= 25; x += 0.5) k.box(0.08, 0.06, 5.4, x, 3.16, -10.5, fence);
    for (let i = 0; i < 7; i++) { k.box(0.04, 2.6, 0.04, 17, 1.5, -12.6 + i * 0.75, fence); k.box(0.04, 0.04, 4.8, 17, 0.4 + i * 0.4, -10.5, fence); }
    for (let i = 0; i < 16; i++) { const x = 17.3 + rnd() * 7.4, z = -12.8 + rnd() * 4.6; k.mesh(new T.SphereGeometry(0.28 + rnd() * 0.22, 7, 5), vine, x, 3.3 + rnd() * 0.3, z); if (rnd() > 0.4) k.mesh(new T.SphereGeometry(0.14, 6, 4), wisteria, x, 2.75 + rnd() * 0.3, z); }
    for (let i = 0; i < 8; i++) { k.sphere(0.26, 17.1, 1.0 + i * 0.24, -12.6 + i * 0.6, vine, 6); }
    // string lights along the trellis beams, lamps on the gate piers, a floodlight on the census wall, the back door light
    for (let i = 0; i < 15; i++) for (const z of [-13.12, -7.88]) k.sphere(0.045, 17.3 + i * 0.52, 2.92, z, warm, 6);
    for (const x of [18.5, 23.5]) k.point(x, 2.8, -10.5, 0xffd9a0, 14, 9);
    for (const z of [-13.1, -9.9]) { k.sphere(0.15, 10.6, 2.32, z, warm, 10); k.point(10.6, 2.3, z, 0xffd9a0, 10, 7); }
    k.box(0.3, 0.2, 0.4, 32.75, 5.25, -14, iron); k.point(32.0, 5.0, -14, 0xfff0d0, 18, 11);
    k.sphere(0.12, HX + 14.2, 3.2, -0.5, warm, 8); k.point(HX + 14.6, 3.2, -0.5, 0xffd9a0, 8, 6);
    k.point(20.5, 2.6, -15.4, 0xffe0b0, 4, 5);
    for (const x of [16, 23, 30]) k.point(x, 3.6, -18.6, 0xffe6c8, 10, 8);
    k.point(29, 0.05, -12, 0x70d0c8, 6, 5);
    // the koi pond: an oval of dark water inside a rim of stones, lily pads, four koi on their round
    const PX = 29, PZ = -12;
    const pond = k.cyl(2.6, 0.2, PX, 0.06, PZ, water, 2.6, 28); pond.scale.z = 0.75;
    k.cyl(2.7, 0.1, PX, -0.02, PZ, k.flat(0x0e2020, 0, 0.9), 2.7, 28).scale.z = 0.75;
    for (let i = 0; i < 20; i++) { const a = (i / 20) * PI * 2, s = 0.45 + rnd() * 0.35; const r = k.box(s * 1.4, s * 0.7, s, PX + Math.cos(a) * 2.8, 0.14 + s * 0.3, PZ + Math.sin(a) * 2.1, rock); r.rotation.y = a + (rnd() - 0.5); }
    for (let i = 0; i < 7; i++) k.cyl(0.22 + rnd() * 0.1, 0.02, PX + (rnd() - 0.5) * 3.6, 0.17, PZ + (rnd() - 0.5) * 2.6, lily, 0.22, 10);
    k.keepOut.push({ x: PX, z: PZ, r: 3.3 });
    const swim = k.spline([v(PX + 1.6, 0.1, PZ), v(PX + 0.8, 0.1, PZ + 1.0), v(PX - 1.2, 0.1, PZ + 0.9), v(PX - 1.7, 0.1, PZ - 0.2), v(PX - 0.6, 0.1, PZ - 1.0), v(PX + 1.0, 0.1, PZ - 0.8)], true);
    for (let i = 0; i < 4; i++) { const f = new T.Mesh(new T.SphereGeometry(0.15, 8, 6), i % 2 ? koiW : koiO); f.scale.set(1, 0.5, 2.4); k.add(f); if (an) k.rider(f, swim, 0.3 + i * 0.05, i * 2.1); else { swim.getPointAt(i / 4, f.position); } }
    // the barbecue, the bench, the trumpet on its plinth, the record player, the wind chimes, hydrangeas and shrubs
    k.box(1.6, 1.0, 1.2, 14.6, 0.64, -17.5, brick); k.box(1.7, 0.08, 1.3, 14.6, 1.18, -17.5, lime);
    for (let i = 0; i < 6; i++) k.box(1.3, 0.03, 0.03, 14.6, 1.24, -17.95 + i * 0.18, iron);
    k.box(0.6, 2.2, 0.6, 15.1, 2.0, -18.1, brick);
    steam(k, 15.1, 3.15, -18.1, 8, an, 185, 0xd8d8d0);
    k.block(13.6, 15.5, -18.5, -16.8);
    benchS(k, 24.5, -17.2, PI / 2, fence, iron, 2.2, 0.14);
    k.plinth(20.5, -16.6, 0.8, 1.15, 0.8, lime);
    const bell = k.lathe([[0.03, 0], [0.045, 0.3], [0.06, 0.5], [0.12, 0.66], [0.3, 0.78], [0.31, 0.8]], 20.75, 1.62, -16.6, brass, 24); bell.rotation.z = -PI / 2;
    k.beam(v(20.0, 1.62, -16.6), v(20.8, 1.62, -16.6), 0.02, brass, 8);
    k.torus(0.15, 0.017, 20.35, 1.62, -16.6, brass, 24);
    k.beam(v(20.05, 1.62, -16.6), v(20.6, 1.5, -16.6), 0.016, brass, 6);
    for (const dx of [0.28, 0.38, 0.48]) k.cyl(0.03, 0.16, 20.0 + dx, 1.68, -16.6, brass, 0.03, 10);
    k.cyl(0.035, 0.08, 19.96, 1.62, -16.6, brass, 0.02, 8).rotation.z = PI / 2;
    k.sign('SATCHMO  ·  1901 TO 1971  ·  HE LIVED HERE FROM 1943', 1.2, 0.18, 20.5, 0.9, -16.18, 'transparent', '#1a1a1a', 46, 0);
    k.box(0.8, 0.06, 0.6, 15.6, 0.74, -8.6, fence); for (const [dx, dz] of [[-0.35, -0.25], [0.35, -0.25], [-0.35, 0.25], [0.35, 0.25]]) k.box(0.05, 0.7, 0.05, 15.6 + dx, 0.4, -8.6 + dz, fence);
    k.box(0.52, 0.08, 0.42, 15.6, 0.81, -8.6, k.pbr('laPlayer', X.planks(0x6a4a2a, 3, 186), 2.0));
    const disc = new T.Group(); disc.position.set(15.55, 0.865, -8.6);
    disc.add(new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 0.012, 24), vinyl));
    const lab = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.014, 16), label); disc.add(lab);
    k.add(disc); if (an) k.ticks.push((t) => { disc.rotation.y = t * 3.5; });
    k.beam(v(15.82, 0.9, -8.42), v(15.62, 0.88, -8.6), 0.008, steelL, 5); k.cyl(0.02, 0.05, 15.82, 0.87, -8.42, steelL, 0.02, 8);
    k.keepOut.push({ x: 15.6, z: -8.6, r: 0.7 });
    const chime = new T.Group(); chime.position.set(25, 2.95, -10.5);
    chime.add(new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 0.02, 12), fence));
    const tubes = new T.InstancedMesh(new T.CylinderGeometry(0.012, 0.012, 1, 6), steelL, 5);
    for (let i = 0; i < 5; i++) { const a = (i / 5) * PI * 2, L = 0.3 + i * 0.07; tubes.setMatrixAt(i, mat4(Math.cos(a) * 0.09, -0.2 - L / 2, Math.sin(a) * 0.09, 0, 1, L, 1)); }
    tubes.instanceMatrix.needsUpdate = true; chime.add(tubes);
    const clap = new T.Mesh(new T.SphereGeometry(0.03, 8, 6), fence); clap.position.y = -0.55; chime.add(clap);
    k.add(chime); if (an) k.ticks.push((t) => { chime.rotation.z = 0.14 * Math.sin(t * 1.7); chime.rotation.x = 0.09 * Math.sin(t * 1.3 + 1); });
    for (let i = 0; i < 6; i++) k.sphere(0.42, 14.5 + i * 2.3, 0.5, -5.2, hydrangea, 7);
    for (let i = 0; i < 6; i++) k.sphere(0.5, 14.5 + i * 2.3, 0.32, -5.2, vine, 7);
    for (let i = 0; i < 9; i++) k.mesh(new T.SphereGeometry(0.5 + rnd() * 0.3, 7, 5), vine, 12 + i * 2.4, 0.5, -19.2);
    k.tree(30, 0, -18.2, { h: 3.4, r: 2.2, leaf: 0x8a2a2a, seed: 187 });
    k.tree(30.5, 0, 1.4, { h: 7, r: 3.2, seed: 188 });
    k.tree(31.2, 0, -6.2, { h: 4.5, r: 2.0, seed: 189 });
    k.crowd([v(12.2, 0, -11.5), v(16.5, 0, -11), v(21, 0, -9.6), v(26, 0, -14), v(23, 0, -18.6), v(15.8, 0, -14.2)], 6, { seed: 190, speed: 0.35, spread: 0.8, animate: an, closed: true });
    // the works: the south fence, the garage wall, the rear fence, the house walls, the trellis lattice, the front
    const mounts: Mount[] = [];
    for (let i = 0; i < 6; i++) { const x = 13.2 + i * 3.5; mounts.push({ position: v(x, 2.95, -19.86), rotation: 0, target: v(x, 3, i < 4 ? -14.5 : -16.5), width: 2.6, height: 1.5, style: 'white', wash: false }); }
    for (const z of [-18, -14.5, -11]) mounts.push({ position: v(32.86, 2.95, z), rotation: -PI / 2, target: v(25, 3, z), width: 2.6, height: 1.5, style: 'white', wash: false });
    for (const z of [-5, 1]) mounts.push({ position: v(32.86, 2.95, z), rotation: -PI / 2, target: v(28.5, 3, z), width: 2.4, height: 1.5, style: 'white', wash: false });
    for (const x of [15, 18.5, 22, 25.5]) mounts.push({ position: v(x, 3.5, HZ0 + 0.14), rotation: PI, target: v(x, 3, -9.5), width: 2.6, height: 1.6, style: 'black', wash: false });
    for (const z of [-11.75, -9.25]) mounts.push({ position: v(16.9, 2.1, z), rotation: -PI / 2, target: v(12.6, 3, z), width: 2.0, height: 1.3, style: 'oak', wash: false });
    for (const z of [-2.5, 1.5]) mounts.push({ position: v(HX + 14.14, 3.5, z), rotation: PI / 2, target: v(31, 3, z), width: 2.4, height: 1.5, style: 'black', wash: false });
    mounts.push({ position: v(HX - 0.14, 3.6, -1.5), rotation: -PI / 2, target: v(7, 3, -1.5), width: 2.0, height: 1.4, style: 'black', wash: false });
    mounts.push({ position: v(30, 2.9, 3.46), rotation: PI, target: v(30, 3, -1.5), width: 2.4, height: 1.4, style: 'white', wash: false });
    return { mounts, spawn: v(2.5, 3, -11.5), look: v(19, 3.4, -10.2), eye: 3, bounds: [-9.9, 32.6, -46, 42], style: 'white' };
  },
};

/* ---------------- 136 HAMILTON GRANGE ---------------- */
function grangeHill(x: number, z: number) {
  const u = Math.min(1, Math.max(0, (34 - x) / 42)), s = u * u * (3 - 2 * u);
  return 8.5 * s + Math.sin(z * 0.19 + x * 0.05) * Math.cos(x * 0.13) * 3.6 * s * (1 - s);
}
export const grange: RoomDef = {
  id: 'hamiltongrange',
  name: 'A house above the city',
  area: 'HAMILTON GRANGE / ST. NICHOLAS PARK',
  mood: 'Porch light',
  color: '#c2cab7',
  description: 'St. Nicholas Avenue, the park wall, then the climb: a gravel path switchbacking up the hill past the schist outcrop and the thirteen sweetgums to the pale yellow Federal house with its green shutters and wide piazza. Inside, the hall of miniatures and the two octagonal parlors, the piano, the dining table, a hearth lit for the afternoon, the works in gilt on the papered walls.',
  signatures: 'The 1802 country house moved into St. Nicholas Park in 2008: clapboard painted pale yellow, green shutters, a hipped roof with a balustrade, piazzas on two sides, the twin octagonal rooms with their mirrored doors, the thirteen sweetgum trees, the Manhattan schist outcrop, City College on the ridge behind.',
  build(k, ctx) {
    k.sky({ top: 0x4a86c8, horizon: 0xc9d9e6, ground: 0x4e6e5a, fog: 0.0014, sun: { az: 1.3, el: 0.42, color: 0xffe6c0, size: 16 }, haze: 0.1, env: 0.9 });
    k.hemi(0xeaf3ff, 0x3a5a3a, 0.9);
    k.sun(0xffe8c8, 2.3, 60, 42, 20, true, 100);
    const an = !ctx.reduced, H = grangeHill;
    const lawn = k.pbr('hgLawn', X.grass(0x4c7a3a, 191), 0.16),
      gravel = k.pbr('hgGravel', X.cobble(0xa8a08c, 192), 1.2, { roughness: 0.95 }),
      schist = k.pbr('hgSchist', X.ashlar(0x6f6f6a, 193, 1), 0.3, { roughness: 0.95 }),
      wall = k.pbr('hgWall', X.ashlar(0x7a7268, 194, 2), 0.4, { roughness: 0.9 }),
      clap = k.pbr('hgClap', X.plaster(0xe8d98c, 195), 0.5, { roughness: 0.75 }),
      shade = k.flat(0xb8a868, 0, 0.8),
      trim = k.flat(0xf4f1e6, 0, 0.6),
      shutter = k.flat(0x2f5a3a, 0.1, 0.6),
      stone = k.pbr('hgPlinth', X.ashlar(0x8a8478, 196, 3), 0.4),
      roof = k.pbr('hgRoof', X.steel(0x3a3a40, false, 197), 0.5, { metalness: 0.3, roughness: 0.6 }),
      pine = k.pbr('hgPine', X.planks(0xb8905a, 6, 198), 1.2, { roughness: 0.6 }),
      deck = pine,
      haint = k.flat(0xbcd4d8, 0, 0.7),
      paperS = k.pbr('hgPaperS', X.plaster(0xbfc48a, 200), 0.5),
      paperN = k.pbr('hgPaperN', X.plaster(0xd8b890, 201), 0.5),
      paperH = k.pbr('hgPaperH', X.plaster(0xdcd4c0, 202), 0.5),
      ceil = k.pbr('hgCeiling', X.plaster(0xefe9dc, 203), 0.4),
      carpet = k.pbr('hgCarpet', X.carpet(0x5a2a2a, 0xc79a4a), 0.4, { roughness: 0.95 }),
      mirror = k.flat(0xdde5ea, 1.0, 0.05),
      gilt = k.pbr('hgGilt', X.gilt(0xd0a852), 2, { metalness: 0.85, roughness: 0.3 }),
      marble = k.pbr('hgMarble', X.marble(0xe8e4dc, 0x8a8478, 16), 0.5, { roughness: 0.3 }),
      mahogany = k.pbr('hgMahogany', X.planks(0x4a2418, 3, 204), 1.6, { roughness: 0.45 }),
      black = k.flat(0x0a0a0a, 0, 1),
      ember = k.glow(0xff8a30),
      candle = k.glow(0xfff0c0),
      glassA = k.glass(0xffe0b0, 0.3, 0.1),
      iron = k.flat(0x1f242a, 0.75, 0.45),
      brickC = k.pbr('hgBrick', X.brick(0x8a4a3a, 205), 0.28),
      gothic = wall,
      bird = k.flat(0x1a1a1a, 0, 0.9, { side: T.DoubleSide });
    const rnd = X.mulberry(207);
    // the park: the hill, the avenue at its foot, the wall with its gate, the path winding up
    const tg = new T.PlaneGeometry(150, 170, 90, 100); tg.rotateX(-PI / 2);
    const pa = tg.attributes.position;
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i) - 30, z = pa.getZ(i); pa.setXYZ(i, x, H(x, z) - 0.12, z); }
    tg.computeVertexNormals();
    k.mesh(tg, lawn);
    const asph = k.pbr('asphaltS', X.asphalt(0x24282d), 0.11, { roughness: 0.62, metalness: 0.12 }), pav = k.pbr('sidewalkS', X.pavers(0x8e8b84, 5), 0.42), curb = stone;
    k.box(16, 0.3, 160, 48, -0.15, 0, asph);
    for (const x of [37.5, 58.5]) k.box(5, 0.28, 160, x, 0, 0, pav);
    for (const x of [40.1, 55.9]) k.box(0.3, 0.32, 160, x, 0.02, 0, curb);
    for (const dz of [-0.14, 0.14]) k.box(0.09, 0.012, 150, 48 + dz, 0.01, 0, k.flat(0xe6a626, 0, 0.6));
    blockFront(k, { x: 61, z0: 76, count: 19, face: -1, seed: 208, h: [16, 24] });
    for (const z of [-42, -14, 14, 42]) k.lamp(36.4, z, 6, iron, 0xffd9a8, 24);
    for (const z of [-56, -30, 30, 56]) k.tree(59, 0, z, { h: 6, r: 2.6, seed: 209 + z });
    for (const s of [-1, 1]) k.box(1.0, 1.5, 68, 34.5, 0.75, s * 36.6, wall);
    for (const s of [-1, 1]) { k.box(0.7, 1.9, 0.7, 34.5, 0.95, s * 2.55, stone); k.box(0.86, 0.12, 0.86, 34.5, 1.96, s * 2.55, stone); k.sphere(0.2, 34.5, 2.2, s * 2.55, stone, 10); }
    k.block(33.9, 35.1, -72, -2.2); k.block(33.9, 35.1, 2.2, 72);
    k.sign('HAMILTON GRANGE NATIONAL MEMORIAL  ·  ST. NICHOLAS PARK', 2.4, 0.5, 36.4, 1.6, 4.2, '#3a2a1a', '#f4ecd8', 54, PI / 2, { border: true, double: true });
    k.box(0.06, 1.8, 0.06, 36.4, 0.9, 4.2, iron);
    k.crowd([v(38.2, 0, -72), v(38.2, 0, 72)], 16, { seed: 210, speed: 0.9, spread: 1.4, animate: an });
    k.crowd([v(58.2, 0, -72), v(58.2, 0, 72)], 10, { seed: 211, speed: 0.9, spread: 1.4, animate: an });
    const path = Array.from({ length: 160 }, (_, i) => { const u = i / 159, x = 34 - u * 45.5, z = 11 * Math.sin(u * PI * 1.5) * (1 - u); return v(x, H(x, z), z); });
    const pg: number[] = [], ix: number[] = [];
    for (let i = 0; i < path.length; i++) { const p = path[i]; for (const s of [-1, 1]) pg.push(p.x + s * 0.2, H(p.x + s * 0.2, p.z + s * 1.3) + 0.05, p.z + s * 1.3); if (i < path.length - 1) { const n = i * 2; ix.push(n, n + 2, n + 1, n + 1, n + 2, n + 3); } }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pg, 3)); geo.setIndex(ix); geo.computeVertexNormals();
    k.mesh(geo, gravel);
    const nearPath = (x: number, z: number, r: number) => path.some((p) => Math.hypot(p.x - x, p.z - z) < r);
    k.crowd(path.filter((_, i) => i % 10 === 0), 12, { seed: 212, speed: 0.5, spread: 0.9, animate: an });
    for (const i of [50, 95, 135]) { const p = path[i], lx = p.x, lz = p.z + 2.2, ly = H(lx, lz); k.lathe([[0.2, 0], [0.2, 0.08], [0.1, 0.16], [0.06, 4.7], [0.09, 4.8], [0.04, 5]], lx, ly, lz, iron, 10); k.sphere(0.24, lx, ly + 5.15, lz, k.glow(0xffd7a0), 12); k.point(lx, ly + 5.1, lz, 0xffd7a0, 26, 16); k.keepOut.push({ x: lx, z: lz, r: 0.4 }); }
    for (const i of [60, 120]) { const p = path[i]; benchS(k, p.x, p.z - 2.4, 0, pine, iron, 2.2, H(p.x, p.z - 2.4)); }
    // the schist outcrop, the big park trees, the thirteen sweetgums, City College on the ridge behind
    for (let i = 0; i < 16; i++) { const x = 4 + rnd() * 18, z = -30 + rnd() * 14, s = 1.4 + rnd() * 2.6; if (nearPath(x, z, 3.5)) continue; const r = k.mesh(new T.DodecahedronGeometry(s, 0), schist, x, H(x, z) + s * 0.2, z); r.rotation.set(rnd() * 0.4, rnd() * PI, rnd() * 0.4); r.scale.set(1.3, 0.55, 1); }
    for (let i = 0; i < 12; i++) { const x = -2 + rnd() * 30, z = 8 + rnd() * 30, s = 0.6 + rnd() * 1.2; if (nearPath(x, z, 3) || Math.hypot(x - 27, z - 6.2) < 6) continue; const r = k.mesh(new T.DodecahedronGeometry(s, 0), schist, x, H(x, z) + s * 0.1, z); r.rotation.set(rnd() * 0.4, rnd() * PI, rnd() * 0.4); r.scale.set(1.3, 0.5, 1); }
    let planted = 0;
    while (planted < 30) { const x = -46 + rnd() * 78, z = -70 + rnd() * 140; if (Math.abs(x + 23) < 17 && Math.abs(z) < 19) continue; if (nearPath(x, z, 5)) continue; if (x > 30 && Math.abs(z) < 6) continue; k.tree(x, H(x, z) - 0.1, z, { kind: rnd() > 0.7 ? 'column' : 'round', h: 7 + rnd() * 5, r: 3 + rnd() * 2.4, leaf: [0x3f6f38, 0x4a7a3a, 0x6a7a2a][Math.floor(rnd() * 3)], seed: 213 + planted }); planted++; }
    for (let i = 0; i < 13; i++) { const a = PI * 0.55 + (i / 12) * PI * 0.9, x = -8 + 16 * Math.cos(a), z = 34 + 16 * Math.sin(a); k.tree(x, H(x, z) - 0.1, z, { kind: 'column', h: 7, r: 2.2, leaf: [0x3f6f38, 0x8a3a2a, 0xb8702a][i % 3], seed: 230 + i }); }
    k.box(70, 20, 16, -82, 8.5 + 10, -14, gothic); k.box(9, 46, 9, -82, 8.5 + 23, -14, gothic);
    k.mesh(new T.ConeGeometry(6.4, 10, 4), roof, -82, 8.5 + 51, -14).rotation.y = PI / 4;
    for (const dx of [-30, -15, 15, 30]) { k.box(3, 26, 3, -82 + dx, 8.5 + 13, -7, gothic); k.mesh(new T.ConeGeometry(2.1, 4, 4), roof, -82 + dx, 8.5 + 28, -7).rotation.y = PI / 4; }
    k.box(70, 3, 60, -82, 6, -50, lawn);
    // the house: a stone plinth, the main block in yellow clapboard, the two octagonal bays, the hipped roof with its balustrade
    const G = 8.5, FL = 9.4, WH = 7.2, RY = FL + WH, X0 = -33, X1 = -14, HZ = 11;
    k.box(22, 0.9, 23, -22, G + 0.45, 0, stone);
    k.box(18.4, 0.1, 21.6, -23.5, FL - 0.05, 0, pine);
    const lines = (x: number, z: number, len: number, rot: number, y0: number, h: number) => { for (let y = y0 + 0.22; y < y0 + h - 0.1; y += 0.22) { const o = k.box(len, 0.03, 0.03, x, y, z, shade); o.rotation.y = rot; } };
    const clapWall = (w: number, h: number, x: number, y: number, z: number, nx: number, nz: number) => { const o = k.box(w, h, 0.36, x, y, z, clap); const rot = Math.atan2(nx, nz); o.rotation.y = rot; lines(x + nx * 0.19, z + nz * 0.19, w, rot, y - h / 2, h); };
    clapWall(9.4, WH, X1 - 0.18, FL + WH / 2, 6.3, 1, 0); clapWall(9.4, WH, X1 - 0.18, FL + WH / 2, -6.3, 1, 0); clapWall(3.2, WH - 3.3, X1 - 0.18, FL + 3.3 + (WH - 3.3) / 2, 0, 1, 0);
    clapWall(9.4, WH, X0 + 0.18, FL + WH / 2, 6.3, -1, 0); clapWall(9.4, WH, X0 + 0.18, FL + WH / 2, -6.3, -1, 0); clapWall(3.2, WH - 3.3, X0 + 0.18, FL + 3.3 + (WH - 3.3) / 2, 0, -1, 0);
    for (const s of [-1, 1]) { clapWall(4.2, WH, X0 + 2.0, FL + WH / 2, s * (HZ - 0.18), 0, s); clapWall(3.4, WH, X1 - 1.6, FL + WH / 2, s * (HZ - 0.18), 0, s); }
    k.block(X1 - 0.4, X1, 1.6, HZ + 0.3); k.block(X1 - 0.4, X1, -HZ - 0.3, -1.6); k.block(X0, X0 + 0.4, 1.6, HZ + 0.3); k.block(X0, X0 + 0.4, -HZ - 0.3, -1.6);
    for (const s of [-1, 1]) { k.block(X0, X0 + 4.2, s * HZ - 0.4, s * HZ + 0.4); k.block(X1 - 3.4, X1, s * HZ - 0.4, s * HZ + 0.4); }
    const warmG = k.glow(0xffe2b8);
    const win = (x: number, y: number, z: number, nx: number, nz: number, shut = true, lit = false) => {
      const rot = Math.atan2(nx, nz), tx = nz, tz = -nx;
      const mk = (w: number, h: number, d: number, off: number, m: T.Material, dx = 0) => { const o = k.box(w, h, d, x + nx * off + tx * dx, y, z + nz * off + tz * dx, m); o.rotation.y = rot; return o; };
      mk(1.3, 2.2, 0.1, 0.05, trim); mk(1.0, 1.9, 0.06, 0.09, lit ? warmG : glassA); mk(0.04, 1.9, 0.02, 0.13, trim); mk(1.0, 0.04, 0.02, 0.13, trim);
      if (shut) for (const s of [-1, 1]) mk(0.5, 2.2, 0.08, 0.06, shutter, s * 0.92);
    };
    for (const z of [-8.2, -4.2, 4.2, 8.2]) { win(X1, FL + 1.9, z, 1, 0, true, Math.abs(z) < 5); win(X0, FL + 1.9, z, -1, 0, true, Math.abs(z) < 5); }
    for (const z of [-8.2, -4.2, 0, 4.2, 8.2]) { win(X1, FL + 5.3, z, 1, 0); win(X0, FL + 5.3, z, -1, 0); }
    for (const s of [-1, 1]) for (const x of [-31, -15.6]) for (const y of [FL + 1.9, FL + 5.3]) win(x, y, s * HZ, 0, s);
    for (const s of [-1, 1]) { const fan = k.mesh(new T.CircleGeometry(1.7, 24, 0, PI), glassA, s > 0 ? X1 + 0.02 : X0 - 0.02, FL + 3.3, 0); fan.rotation.y = s * PI / 2; const ring = k.mesh(new T.RingGeometry(1.7, 1.98, 24, 1, 0, PI), trim, s > 0 ? X1 + 0.03 : X0 - 0.03, FL + 3.3, 0); ring.rotation.y = s * PI / 2; k.box(0.1, 0.16, 3.6, s > 0 ? X1 + 0.04 : X0 - 0.04, FL + 3.3, 0, trim); for (const dz of [-1.75, 1.75]) k.box(0.1, 3.4, 0.2, s > 0 ? X1 + 0.04 : X0 - 0.04, FL + 1.65, dz, trim); }
    const rf = k.mesh(new T.ConeGeometry(14.6, 4.2, 4), roof, -23.5, RY + 2.1, 0); rf.rotation.y = PI / 4; rf.scale.z = 1.146;
    k.box(20.6, 0.3, 23.6, -23.5, RY + 0.12, 0, trim);
    k.box(19.6, 0.5, 22.6, -23.5, RY + 0.42, 0, roof);
    balustrade(k, X1 - 1.4, -HZ + 1.6, X1 - 1.4, HZ - 1.6, RY + 0.66, trim, 0.8, 1.2); balustrade(k, X0 + 1.4, -HZ + 1.6, X0 + 1.4, HZ - 1.6, RY + 0.66, trim, 0.8, 1.2);
    balustrade(k, X1 - 1.4, HZ - 1.6, X0 + 1.4, HZ - 1.6, RY + 0.66, trim, 0.8, 1.2); balustrade(k, X1 - 1.4, -HZ + 1.6, X0 + 1.4, -HZ + 1.6, RY + 0.66, trim, 0.8, 1.2);
    for (const x of [-18.5, -28.5]) k.box(1.2, 3.4, 2.2, x, RY + 2.2, 0, brickC);
    // the octagonal rooms: papered faces inside, clapboard outside on the faces that project, a ceiling, the mirrored doors
    const mounts: Mount[] = [];
    const octagon = (cx: number, cz: number, doorK: number, paper: T.Material, outer: number[], artK: number[]) => {
      const R = 6.1, A = R * Math.cos(PI / 8), Wf = 2 * R * Math.sin(PI / 8) + 0.3, EL = FL + 4.2;
      for (let kk = 0; kk < 8; kk++) {
        const a = (kk * PI) / 4, nx = Math.sin(a), nz = Math.cos(a), tx = nz, tz = -nx, fx = cx + nx * A, fz = cz + nz * A;
        const seg = (w: number, dx: number, h: number, y: number) => { const o = k.box(w, h, 0.24, fx + tx * dx, y, fz + tz * dx, paper); o.rotation.y = a; };
        if (kk === doorK) { const pw = (Wf - 3.2) / 2; for (const s of [-1, 1]) { seg(pw, s * (1.6 + pw / 2), 4.2, FL + 2.1); const bx = fx + tx * s * (1.6 + pw / 2), bz = fz + tz * s * (1.6 + pw / 2); k.block(bx - Math.abs(tx) * pw / 2 - 0.12, bx + Math.abs(tx) * pw / 2 + 0.12, bz - Math.abs(tz) * pw / 2 - 0.12, bz + Math.abs(tz) * pw / 2 + 0.12); } seg(3.4, 0, 1.0, FL + 3.7); }
        else { seg(Wf, 0, 4.2, FL + 2.1); for (const s of [-1, 0, 1]) { const bx = fx + tx * s * Wf / 3, bz = fz + tz * s * Wf / 3, hx = Math.abs(tx) * Wf / 6 + Math.abs(nx) * 0.12, hz = Math.abs(tz) * Wf / 6 + Math.abs(nz) * 0.12; k.block(bx - hx, bx + hx, bz - hz, bz + hz); } }
        if (outer.includes(kk)) { const ox = cx + nx * (A + 0.32), oz = cz + nz * (A + 0.32); const o = k.box(Wf + 0.4, WH, 0.32, ox, FL + WH / 2, oz, clap); o.rotation.y = a; lines(ox + nx * 0.17, oz + nz * 0.17, Wf + 0.4, a, FL, WH); for (const y of [FL + 1.9, FL + 5.3]) win(cx + nx * (A + 0.48), y, cz + nz * (A + 0.48), nx, nz, true, y < FL + 3); const bx = ox, bz = oz, hx = Math.abs(tx) * (Wf / 2 + 0.2) + Math.abs(nx) * 0.2, hz = Math.abs(tz) * (Wf / 2 + 0.2) + Math.abs(nz) * 0.2; k.block(bx - hx, bx + hx, bz - hz, bz + hz); if (kk !== doorK) win(cx + nx * (A - 0.12), FL + 1.9, cz + nz * (A - 0.12), -nx, -nz, false); }
        if (artK.includes(kk)) mounts.push({ position: v(fx - nx * 0.15, FL + 2.7, fz - nz * 0.15), rotation: a + PI, target: v(cx + nx * 3.2, FL + 3, cz + nz * 3.2), width: 2.4, height: 1.4, style: 'gilt', wash: true });
      }
      k.mesh(new T.CylinderGeometry(R + 0.4, R + 0.4, 0.16, 8), ceil, cx, EL + 0.08, cz).rotation.y = PI / 8;
      k.mesh(new T.CylinderGeometry(R + 0.6, R + 0.6, 0.9, 8), stone, cx, G + 0.45, cz).rotation.y = PI / 8;
      k.mesh(new T.CylinderGeometry(R + 0.7, R + 0.7, 0.5, 8), roof, cx, RY + 0.25, cz).rotation.y = PI / 8;
      k.mesh(new T.CylinderGeometry(R + 0.2, R + 0.2, 0.08, 8), carpet, cx, FL + 0.04, cz).rotation.y = PI / 8;
      const dn = doorK === 0 ? 1 : -1, dz = cz + dn * (A - 0.2);
      for (const s of [-1, 1]) { k.box(1.5, 3.2, 0.06, cx + s * 2.45, FL + 1.7, dz, mirror); k.box(1.62, 3.32, 0.04, cx + s * 2.45, FL + 1.7, dz + dn * 0.03, gilt); }
      k.point(cx, EL - 1.5, cz, 0xffe0b8, 9, 11);
      for (let j = 0; j < 8; j++) { const t = (j / 8) * PI * 2; k.sphere(0.05, cx + Math.cos(t) * 0.55, EL - 1.1, cz + Math.sin(t) * 0.55, candle, 6); }
      k.torus(0.55, 0.03, cx, EL - 1.15, cz, gilt, 32).rotation.x = PI / 2;
      k.beam(v(cx, EL - 1.15, cz), v(cx, EL, cz), 0.02, gilt, 6);
    };
    octagon(-23, -8, 0, paperS, [3, 4, 5], [1, 2, 6, 7]);
    octagon(-23, 8, 4, paperN, [7, 0, 1], [3, 2, 6, 5]);
    // the hall: papered walls with the two doorways, the runner, the miniatures, the lantern light
    for (const s of [-1, 1]) {
      k.box(8.0, 4.2, 0.3, -28.6, FL + 2.1, s * 2.0, paperH); k.block(-32.6, -24.6, s * 2.0 - 0.15, s * 2.0 + 0.15);
      k.box(7.0, 4.2, 0.3, -17.9, FL + 2.1, s * 2.0, paperH); k.block(-21.4, -14.4, s * 2.0 - 0.15, s * 2.0 + 0.15);
      k.box(3.2, 1.0, 0.3, -23, FL + 3.7, s * 2.0, paperH);
      for (const x of [-24.7, -21.3]) k.box(0.2, 4.2, 0.7, x, FL + 2.1, s * 2.2, paperH);
      k.box(3.6, 1.0, 0.7, -23, FL + 3.7, s * 2.2, paperH);
    }
    k.box(18.6, 0.16, 4.6, -23.5, FL + 4.28, 0, ceil);
    k.box(1.4, 0.02, 17.6, -23.5, FL + 0.01, 0, carpet);
    k.box(1.6, 0.08, 0.6, -30.8, FL + 0.9, -1.55, mahogany); for (const dx of [-0.7, 0.7]) k.cyl(0.04, 0.86, -30.8 + dx, FL + 0.43, -1.55, mahogany, 0.04, 8); k.keepOut.push({ x: -30.8, z: -1.55, r: 0.7 });
    k.sphere(0.06, -30.8, FL + 1.05, -1.55, candle, 6); k.point(-30.8, FL + 1.3, -1.55, 0xffe0b0, 6, 5);
    for (const x of [-27, -18]) { k.point(x, FL + 2.8, 0, 0xffe6c8, 7, 7); k.beam(v(x, FL + 4.2, 0), v(x, FL + 3.3, 0), 0.015, gilt, 5); k.box(0.36, 0.5, 0.36, x, FL + 3.05, 0, glassA); k.sphere(0.05, x, FL + 3.02, 0, candle, 6); }
    k.censusWall({ x: -17.9, y: FL + 2.5, z: 1.78, rotY: PI, cols: 12, rows: 3, tile: 0.45, gap: 0.04, start: ctx.wallStart(4000, 36), pieces: ctx.all, backing: gilt });
    for (const x of [-30.5, -27]) { mounts.push({ position: v(x, FL + 2.75, -1.79), rotation: 0, target: v(x, FL + 3, 0), width: 2.0, height: 1.3, style: 'gilt', wash: true }); mounts.push({ position: v(x, FL + 2.75, 1.79), rotation: PI, target: v(x, FL + 3, 0), width: 2.0, height: 1.3, style: 'gilt', wash: true }); }
    for (const x of [-19.6, -16.3]) mounts.push({ position: v(x, FL + 2.75, -1.79), rotation: 0, target: v(x, FL + 3, 0), width: 2.0, height: 1.3, style: 'gilt', wash: true });
    // the parlor: the hearth on the far face, the pianoforte; the dining room: the table, the chairs, the sideboard
    k.box(2.4, 1.5, 0.5, -23, FL + 0.75, -13.2, marble); k.box(1.4, 1.0, 0.3, -23, FL + 0.5, -13.0, black); k.box(2.8, 0.1, 0.62, -23, FL + 1.55, -13.2, marble);
    k.box(1.8, 1.6, 0.05, -23, FL + 2.5, -13.4, mirror); k.box(1.92, 1.72, 0.04, -23, FL + 2.5, -13.43, gilt);
    for (const dx of [-0.35, 0, 0.35]) k.sphere(0.12, -23 + dx, FL + 0.2, -13.0, ember, 6);
    const fire = k.point(-23, FL + 0.7, -12.6, 0xff9a40, 16, 8);
    if (an) k.ticks.push((t) => { fire.intensity = 14 + 4 * Math.sin(t * 13) + 3 * Math.sin(t * 7.3); });
    k.block(-24.3, -21.7, -13.7, -12.9);
    k.box(1.7, 0.4, 0.7, -27.4, FL + 0.75, -9.2, mahogany); for (const [dx, dz] of [[-0.75, -0.28], [0.75, -0.28], [-0.75, 0.28], [0.75, 0.28]]) k.cyl(0.04, 0.55, -27.4 + dx, FL + 0.28, -9.2 + dz, mahogany, 0.04, 8);
    k.box(1.4, 0.03, 0.14, -27.4, FL + 0.96, -8.78, trim); for (let i = 0; i < 12; i++) k.box(0.06, 0.02, 0.09, -28.05 + i * 0.118, FL + 0.985, -8.8, black);
    k.keepOut.push({ x: -27.4, z: -9.2, r: 1.3 });
    k.mesh(new T.CylinderGeometry(1.2, 1.2, 0.08, 24), mahogany, -23, FL + 0.78, 8).scale.set(1.5, 1, 1);
    k.lathe([[0.5, 0], [0.2, 0.1], [0.12, 0.6], [0.3, 0.72]], -23, FL, 8, mahogany, 12);
    const seats: T.Matrix4[] = [], backs: T.Matrix4[] = [];
    for (let i = 0; i < 8; i++) { const t = (i / 8) * PI * 2, cx = -23 + Math.cos(t) * 2.3, cz = 8 + Math.sin(t) * 1.75, ry = -t + PI / 2; seats.push(mat4(cx, FL + 0.47, cz, ry)); backs.push(mat4(cx + Math.cos(t) * 0.2, FL + 0.9, cz + Math.sin(t) * 0.2, ry)); }
    k.instances(new T.BoxGeometry(0.46, 0.06, 0.46), mahogany, seats); k.instances(new T.BoxGeometry(0.46, 0.9, 0.05), mahogany, backs);
    k.keepOut.push({ x: -23, z: 8, r: 2.7 });
    for (const dx of [-0.6, 0, 0.6]) { k.cyl(0.02, 0.3, -23 + dx, FL + 0.97, 8, gilt, 0.03, 8); k.sphere(0.04, -23 + dx, FL + 1.16, 8, candle, 6); }
    k.point(-23, FL + 1.4, 8, 0xffe0b0, 6, 5);
    k.box(2.2, 1.0, 0.6, -23, FL + 0.5, 13.1, mahogany); k.block(-24.2, -21.8, 12.7, 13.5);
    // the piazzas: decks, square columns, the roof with its haint blue ceiling, balustrades, the steps, the lantern that swings
    for (const s of [1, -1]) {
      const px = s > 0 ? -12.5 : -34.5, ex = s > 0 ? -10.9 : -36.1;
      k.box(3.2, 0.12, 22.6, px, FL - 0.06, 0, deck);
      for (const z of [-11, -7.5, -4, -2.3, 2.3, 4, 7.5, 11]) { k.box(0.3, 3.8, 0.3, ex + s * -0.25, FL + 1.9, z, trim); k.keepOut.push({ x: ex + s * -0.25, z, r: 0.3 }); }
      k.box(3.6, 0.28, 23.2, px - s * 0.1, FL + 3.85, 0, trim); k.box(3.2, 0.04, 22.6, px, FL + 3.7, 0, haint); k.box(3.8, 0.5, 23.4, px - s * 0.1, FL + 4.15, 0, roof);
      balustrade(k, ex + s * -0.15, 2.0, ex + s * -0.15, 11.1, FL, trim); balustrade(k, ex + s * -0.15, -11.1, ex + s * -0.15, -2.0, FL, trim);
      balustrade(k, ex + s * -0.15, 11.1, s > 0 ? X1 : X0, 11.1, FL, trim); balustrade(k, ex + s * -0.15, -11.1, s > 0 ? X1 : X0, -11.1, FL, trim);
      k.block(Math.min(ex, ex + s * -0.3), Math.max(ex, ex + s * -0.3), 2.0, 11.3); k.block(Math.min(ex, ex + s * -0.3), Math.max(ex, ex + s * -0.3), -11.3, -2.0);
      k.block(Math.min(ex, s > 0 ? X1 : X0), Math.max(ex, s > 0 ? X1 : X0), 10.9, 11.3); k.block(Math.min(ex, s > 0 ? X1 : X0), Math.max(ex, s > 0 ? X1 : X0), -11.3, -10.9);
      for (let i = 0; i < 3; i++) { const h = 0.9 - i * 0.3; k.box(0.5, h, 3.8, ex + s * (0.25 + i * 0.5), G + h / 2, 0, stone); }
    }
    for (const z of [-6.2, 6.2]) mounts.push({ position: v(X1 + 0.06, FL + 2.9, z), rotation: PI / 2, target: v(-12.5, FL + 3, z), width: 2.2, height: 1.5, style: 'oak', wash: false });
    for (const z of [-2.55, 2.55]) mounts.push({ position: v(X1 + 0.06, FL + 2.9, z), rotation: PI / 2, target: v(-12.5, FL + 3, z), width: 1.5, height: 1.5, style: 'oak', wash: false });
    for (const z of [-6.2, 6.2]) mounts.push({ position: v(X0 - 0.06, FL + 2.9, z), rotation: -PI / 2, target: v(-34.5, FL + 3, z), width: 2.2, height: 1.5, style: 'oak', wash: false });
    k.sign('"PIAZZA"', 1.6, 0.36, -10.7, FL + 3.55, 5.8, 'transparent', '#1a1a1a', 110, PI / 2);
    const pivot = new T.Group(); pivot.position.set(-12.5, FL + 3.66, 4.6);
    const chain = new T.Mesh(new T.CylinderGeometry(0.01, 0.01, 0.6, 5), iron); chain.position.y = -0.3; pivot.add(chain);
    const lamp = new T.PointLight(0xffd090, 10, 9, 2); lamp.position.y = -0.95; pivot.add(lamp);
    k.add(pivot);
    k.prop('lantern', 0, 0, 0, { height: 0.55 }).then((o) => { if (!o) return; pivot.add(o); o.position.set(0, -1.15, 0); });
    if (an) k.ticks.push((t) => { pivot.rotation.z = 0.18 * Math.sin(t * 1.9); pivot.rotation.x = 0.06 * Math.sin(t * 1.1); });
    // birds over the sweetgums
    const bg = new T.PlaneGeometry(0.55, 0.18); bg.rotateX(-PI / 2);
    const birds = k.instances(bg, bird, Array.from({ length: 7 }, () => new T.Matrix4()));
    const bm = new T.Matrix4(), bq = new T.Quaternion(), bp = new T.Vector3(), bs = new T.Vector3();
    const fly = (t: number) => { for (let i = 0; i < 7; i++) { const a = t * 0.25 + i * 0.9, r = 14 + (i % 3) * 3; bp.set(-8 + Math.cos(a) * r, 8.5 + 14 + Math.sin(a * 1.7 + i) * 2, 34 + Math.sin(a) * r); bq.setFromAxisAngle(UP, -a); bs.set(0.6 + 0.5 * Math.abs(Math.sin(t * 9 + i)), 1, 1); bm.compose(bp, bq, bs); birds.setMatrixAt(i, bm); } birds.instanceMatrix.needsUpdate = true; };
    fly(0); if (an) k.ticks.push(fly);
    const inHouse = (x: number, z: number) => (x > X0 && x < X1 && Math.abs(z) < HZ) || Math.hypot(x + 23, Math.abs(z) - 8) < 6.5 || (x >= X1 && x <= -10.9 && Math.abs(z) < 11.2) || (x >= -36.1 && x <= X0 && Math.abs(z) < 11.2);
    return {
      mounts, spawn: v(27, 3, 6.2), look: v(-20, 12.5, 0), eye: 3, bounds: [-46, 60.6, -72, 72], style: 'gilt',
      floorY: (x, z) => {
        if (inHouse(x, z)) return FL;
        if (x > -10.9 && x < -9.4 && Math.abs(z) < 1.9) return FL - ((x + 10.9) / 1.5) * (FL - G);
        if (x < -36.1 && x > -37.6 && Math.abs(z) < 1.9) return FL - ((-36.1 - x) / 1.5) * (FL - G);
        return H(x, z);
      },
    };
  },
};
