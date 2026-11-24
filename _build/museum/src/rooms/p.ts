/* Rooms 72 to 76: the Dakota, the Garden, the Temple of Dendur, the sculpture garden, the Whitney terraces. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront, hsign, paintTex, anamorphTex } from './f';
import { standIn, hide, hero, heroInstances } from './heroes';
import { fireflyPlate } from './a';
import type { Kit } from '../kit';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const PI = Math.PI;

/* ---------- THE BIG UPGRADE, wave 4c (2026-11-24): helpers for the Garden, Dendur, the sculpture garden, the Whitney ----------
   The same pattern as wave 3d (m.ts), kept local to this file. Scanned CC0 surfaces (Poly Haven, assets/museum/tex/<room>/)
   wear a sensible colour until all three maps land; real models from assets/museum/props/<room>/ are fitted once and set
   many times. Safe in node: the audit builds these rooms with no DOM, so a scan falls back to its painted surface. */
const HAS_DOM = typeof window !== 'undefined' && typeof HTMLImageElement !== 'undefined';
const texL = HAS_DOM ? new T.TextureLoader() : null;
const w4c = new Map<string, { s: X.Surface; ready: Promise<unknown> }>();
function sc(k: Kit, room: string, id: string, metres: number, paint: () => X.Surface, p: Partial<T.MeshStandardMaterialParameters> & { normal?: number } = {}, wait = 0x888888, boost = 1) {
  if (!texL) return k.pbr(`w4c-${room}-${id}`, paint(), 1 / metres, p);
  let e = w4c.get(`${room}/${id}`);
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
    e = { s: { map: one('c', true), normalMap: one('n', false), roughnessMap: low ? undefined : one('r', false) }, ready: Promise.all(waits) };
    w4c.set(`${room}/${id}`, e);
  }
  k.pending.push(e.ready);
  const m = k.pbr(`w4c-${room}-${id}-${metres}-${(p.color as number | undefined) ?? 0}-${boost}`, e.s, 1 / metres, p);
  if (!m.userData.w4c) {
    m.userData.w4c = true;
    const maps = { map: m.map, normalMap: m.normalMap, roughnessMap: m.roughnessMap }, tint = m.color.clone().multiplyScalar(boost);
    m.map = m.normalMap = m.roughnessMap = null;
    m.color.set(wait);
    void e.ready.then(() => { Object.assign(m, maps); m.color.copy(tint); m.needsUpdate = true; });
  }
  return m;
}
/* A real model fitted once and set at every [x, y, z, rotY, scale?]; seven or more become instanced parts (one draw each). */
function many(k: Kit, name: string, fit: Parameters<typeof hero>[2], at: number[][], tweak?: (o: T.Object3D) => void) {
  if (!at.length) return;
  void hero(k, name, fit).then((h) => {
    if (!h || !k.live) return;
    if (tweak) tweak(h);
    if (at.length > 6) {
      const ins = heroInstances(k, h, at.length), m = new T.Matrix4(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0);
      at.forEach(([x, y, z, r, s = 1], i) => ins.setAt(i, m.compose(new T.Vector3(x, y, z), q.setFromAxisAngle(up, r), new T.Vector3(s, s, s))));
      ins.commit();
      return;
    }
    at.forEach(([x, y, z, r, s = 1], i) => { const c = i ? h.clone() : h; c.position.set(x, y, z); c.rotation.y = r; c.scale.setScalar(s); k.add(c); });
  });
}
/* Recolour every material of a loaded model (bronze, patina, blackened steel) without touching the source cache. */
function tint(o: T.Object3D, hex: number, rough = 0.5, metal = 0.6) {
  const cache = new Map<T.Material, T.Material>();
  o.traverse((c) => { if (!(c instanceof T.Mesh)) return; const src = c.material as T.MeshStandardMaterial; let m = cache.get(src); if (!m) { const n = src.clone(); n.color.setHex(hex); n.roughness = rough; n.metalness = metal; m = n; cache.set(src, m); } c.material = m; });
}
/* Painted lettering for an anamorphic floor piece, in a house font. */
function floorType(text: string, fg: string, w = 1024, h = 256, font = 'W2 Archivo Expanded') {
  return paintTex(w, h, (g) => { g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; let s = h * 0.8; g.font = `800 ${s}px "${font}", Arial, sans-serif`; const tw = g.measureText(text).width; if (tw > w * 0.94) { s *= (w * 0.94) / tw; g.font = `800 ${s}px "${font}", Arial, sans-serif`; } g.fillText(text, w / 2, h / 2); }, [font]);
}

/* ---------------- 72 THE DAKOTA ---------------- */
export const dakota: RoomDef = {
  id: 'dakota',
  name: 'The courtyard and the mosaic',
  area: 'THE DAKOTA',
  mood: 'December dusk',
  color: '#c8b090',
  description: 'Seventy second and Central Park West: the gabled fortress of an apartment house, the carriage arch into its courtyard, and across the street the round mosaic in the park with its one word, the works on the courtyard walls.',
  signatures: 'The sandstone and brick block with its gables, dormers and iron railings, the deep arched carriage entrance with the sentry box, the square inner courtyard with two fountains, the teardrop park across the avenue with the black and white mosaic ringed with flowers.',
  build(k, ctx) {
    k.sky({ top: 0x3a4a86, horizon: 0xf0b890, ground: 0x2a2a30, fog: 0.0024, sun: { az: 4.75, el: 0.06, color: 0xffb070, size: 20 }, haze: 0.4, stars: 120, env: 0.8 });
    k.hemi(0xffdcc0, 0x2a2c34, 0.7);
    k.sun(0xffc08a, 1.8, -70, 16, -20, true, 90);
    const stone = k.pbr('dkStone', X.ashlar(0xb8a888, 206, 3), 0.22),
      brick = k.pbr('dkBrick', X.brick(0x8a5a48, 207), 0.28),
      slate = k.pbr('dkSlate', X.steel(0x3a3a40, false, 208), 0.4, { metalness: 0.2, roughness: 0.8 }),
      iron = k.flat(0x1a1c20, 0.7, 0.45),
      cobble = k.pbr('dkCobble', X.cobble(0x6f6c68, 96), 0.9),
      lawn = k.pbr('dkLawn', X.grass(0x3a5a2a, 97), 0.06),
      pave = k.pbr('dkPave', X.pavers(0x8e8b84, 98), 0.4),
      black = k.flat(0x141416, 0, 0.5), white = k.flat(0xf4f0e8, 0, 0.5),
      glass = k.glass(0xffe0b0, 0.3, 0.1), waterM = k.flat(0x88aacc, 0.3, 0.2, { transparent: true, opacity: 0.6 }),
      warm = k.glow(0xffd8a0);
    // the avenue, the park across it, the block
    street(k, { w: 24, len: 160, z: 0, x: 0 });
    k.box(160, 0.4, 200, 100, -0.2, 0, lawn);
    k.rail(18, 0, 160, iron, 1.0, 'z', 2.4);
    k.block(17.6, 18.4, -80, -6); k.block(17.6, 18.4, 6, 80);
    const rnd = X.mulberry(72);
    for (let i = 0; i < 40; i++) { const x = 24 + rnd() * 80, z = -90 + rnd() * 180; if (Math.hypot(x - 34, z) < 14) continue; k.tree(x, 0, z, { kind: 'bare', h: 8 + rnd() * 6, r: 3 + rnd() * 2, seed: i }); }
    for (const z of [-60, -20, 20, 60]) for (const s of [-1, 1]) k.lamp(s * 13.5, z, 6.2, iron, 0xffd9a8, 30);
    // the building: a square block around a courtyard, gables and dormers, the carriage arch on 72nd
    const BX = -34, BZ = 0, BW = 44, BH = 30;
    for (const [x, z, w, d] of [[BX, BZ - BW / 2 + 5, BW, 10], [BX, BZ + BW / 2 - 5, BW, 10], [BX - BW / 2 + 5, BZ, 10, BW - 20], [BX + BW / 2 - 5, BZ, 10, BW - 20]]) { k.box(w, BH, d, x, BH / 2, z, brick); k.box(w + 0.4, 3, d + 0.4, x, 1.5, z, stone); k.box(w + 0.4, 0.8, d + 0.4, x, BH - 0.4, z, stone); }
    for (let i = 0; i < 5; i++) { const z = BZ - 16 + i * 8; const g = k.mesh(new T.ConeGeometry(4, 6, 4), slate, BX + BW / 2 - 5, BH + 3, z); g.rotation.y = PI / 4; k.box(1.2, 3, 1.2, BX + BW / 2 - 2, BH + 1.5, z + 3, brick); }
    for (let f = 0; f < 7; f++) for (let i = 0; i < 9; i++) { const y = 4 + f * 3.6, z = BZ - 18 + i * 4.5; k.box(0.16, 2.2, 1.4, BX + BW / 2 + 0.02, y, z, stone); k.box(0.06, 1.9, 1.1, BX + BW / 2 + 0.1, y, z, rnd() > 0.6 ? warm : glass); if (f % 2 === 0) { k.box(0.6, 0.06, 1.6, BX + BW / 2 + 0.4, y - 1.1, z, iron); for (let b = -0.7; b <= 0.7; b += 0.2) k.box(0.03, 0.6, 0.03, BX + BW / 2 + 0.7, y - 0.8, z + b, iron); } }
    k.block(BX - BW / 2 - 0.5, BX + BW / 2 + 0.5, BZ - BW / 2 - 0.5, BZ - BW / 2 + 10.5); k.block(BX - BW / 2 - 0.5, BX + BW / 2 + 0.5, BZ + BW / 2 - 10.5, BZ + BW / 2 + 0.5);
    k.block(BX - BW / 2 - 0.5, BX - BW / 2 + 10.5, BZ - BW / 2, BZ + BW / 2); k.block(BX + BW / 2 - 10.5, BX + BW / 2 + 0.5, BZ - BW / 2, BZ + BW / 2);
    const AZ = BZ + BW / 2 - 5;
    k.arch(5, 7, 10, BX, 0, AZ, stone, false, 0.85).rotation.y = 0;
    k.box(1.6, 2.4, 1.6, BX + 3.6, 1.2, AZ + 5.4, stone); k.box(1.4, 1.6, 0.1, BX + 3.6, 1.5, AZ + 6.2, glass); k.point(BX + 3.6, 2.2, AZ + 6.4, 0xffd8a0, 8, 5);
    k.box(6, 0.3, 12, BX, 0.05, AZ, cobble);
    k.sign('THE DAKOTA  ·  1884', 4.6, 0.6, BX, 7.6, AZ + 5.05, 'transparent', '#e8dcc0', 70, 0);
    for (let i = 0; i < 4; i++) k.point(BX, 5.5, AZ - 4 + i * 2.8, 0xffd8a0, 10, 6);
    // the courtyard: cobbles, two fountains, lamps, the doors to the four corner entrances
    const CW = BW - 20;
    k.box(CW, 0.3, CW, BX, 0.05, BZ, cobble);
    for (const dz of [-5, 5]) { k.mesh(new T.CylinderGeometry(2.4, 2.6, 0.7, 24), stone, BX, 0.35, BZ + dz); k.mesh(new T.CylinderGeometry(2.1, 2.1, 0.2, 24), waterM, BX, 0.75, BZ + dz); const j = k.mesh(new T.CylinderGeometry(0.06, 0.16, 2.2, 6), waterM, BX, 1.8, BZ + dz, true); if (!ctx.reduced) k.ticks.push((t) => { j.scale.y = 0.8 + 0.3 * Math.sin(t * 1.6 + dz); }); k.keepOut.push({ x: BX, z: BZ + dz, r: 2.8 }); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { k.lamp(BX + sx * 7, BZ + sz * 7, 3.6, iron, 0xffd9a8, 20); k.arch(2, 3.4, 0.6, BX + sx * (CW / 2 - 0.1), 0, BZ + sz * 6, stone, false, 0.8).rotation.y = PI / 2; }
    for (let f = 0; f < 7; f++) for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const y = 4 + f * 3.6, z = BZ - 8 + i * 4; k.box(0.16, 2.2, 1.4, BX + s * (CW / 2 + 0.02), y, z, stone); k.box(0.06, 1.9, 1.1, BX + s * (CW / 2 - 0.05), y, z, rnd() > 0.5 ? warm : glass); }
    k.point(BX, 8, BZ, 0xffd8a0, 30, 20);
    // the mosaic across the avenue: the round of black and white with the word, the ring of flowers, the benches
    const MX = 34, MZ = 0;
    k.mesh(new T.CylinderGeometry(6, 6.2, 0.3, 48), pave, MX, 0.1, MZ);
    k.mesh(new T.CylinderGeometry(2.6, 2.6, 0.02, 48), white, MX, 0.27, MZ);
    k.mesh(new T.RingGeometry(2.6, 3.0, 48), black, MX, 0.28, MZ).rotation.x = -PI / 2;
    for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; k.mesh(new T.RingGeometry(0.4, 0.6, 12), black, MX + Math.cos(a) * 2.1, 0.285, MZ + Math.sin(a) * 2.1).rotation.x = -PI / 2; }
    k.sign('IMAGINE', 2.4, 0.5, MX, 0.29, MZ, 'transparent', '#141416', 70, 0);
    const word = k.objects[k.objects.length - 1]; word.rotation.set(-PI / 2, 0, 0);
    for (let i = 0; i < 30; i++) { const a = (i / 30) * PI * 2; k.sphere(0.14, MX + Math.cos(a) * 2.8, 0.36, MZ + Math.sin(a) * 2.8, [k.flat(0xe83a3a, 0, 0.7), k.flat(0xf1c531, 0, 0.7), k.flat(0xf4f0e8, 0, 0.7)][i % 3], 6); }
    for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2; k.bench(MX + Math.cos(a) * 8, MZ + Math.sin(a) * 8, -a + PI / 2, k.pbr('dkBench', X.planks(0x6a5a45, 3, 209), 1.2), iron, 2.2); }
    k.keepOut.push({ x: MX, z: MZ, r: 3.4 });
    k.box(16, 0.3, 0.1, MX - 8 - 4, 0.05, MZ, pave); k.box(6, 0.3, 40, MX - 14, 0.05, MZ, pave);
    k.crowd([v(MX - 14, 0, -30), v(MX - 14, 0, 30)], 12, { seed: 82, speed: 0.5, spread: 1.6, animate: !ctx.reduced, colors: [0x24262c, 0x8a3a3a, 0x151517, 0xd8d0c0] });
    k.crowd([v(-6, 0, -70), v(-6, 0, 70)], 20, { seed: 83, speed: 1.0, spread: 2.4, animate: !ctx.reduced });
    k.censusWall({ x: BX, y: 3.6, z: BZ - CW / 2 + 0.36, rotY: 0, cols: 22, rows: 4, tile: 0.5, gap: 0.05, start: ctx.wallStart(2200, 88), pieces: ctx.all, backing: iron });
    // the works: the courtyard walls at ground level, the carriage arch, the park benches' backs face the mosaic
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = BZ - 9 + i * 6; mounts.push({ position: v(BX + s * (CW / 2 - 0.34), 2.2, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(BX, 2, z), width: 3.2, height: 1.9, style: 'gilt', wash: true }); }
    for (let i = 0; i < 4; i++) { const x = BX - 9 + i * 6; if (Math.abs(x - BX) < 2) continue; mounts.push({ position: v(x, 2.2, BZ + CW / 2 - 0.34), rotation: PI, target: v(x, 2, BZ), width: 3.2, height: 1.9, style: 'gilt', wash: true }); }
    for (let i = 0; i < 3; i++) { const z = AZ - 3 + i * 3; for (const s of [-1, 1]) mounts.push({ position: v(BX + s * 2.42, 2.4, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(BX, 2, z), width: 1.8, height: 1.4, style: 'black', wash: false }); }
    for (let i = 0; i < 4; i++) { const z = -60 + i * 40; if (Math.abs(z) < 12) continue; k.box(0.3, 3, 4.6, 18.4, 1.9, z, iron); mounts.push({ position: v(18.2, 2.0, z), rotation: PI / 2, target: v(8, 2, z), width: 4.2, height: 2.5, style: 'black', wash: false }); }
    return { mounts, spawn: v(14, 3, 44), look: v(BX + 6, 18, BZ + 6), eye: 3, bounds: [BX - CW / 2 + 0.6, 60, -80, 80], style: 'gilt' };
  },
};

/* ---------------- 73 THE GARDEN ---------------- */
export const garden: RoomDef = {
  id: 'garden',
  name: "The world's most famous arena",
  area: 'MADISON SQUARE GARDEN',
  mood: 'Fourth quarter, two minutes',
  color: '#f0842a',
  description: 'Above the train hall, the round drum of the arena: the bowl in blue and orange, the cable ceiling, the scoreboard cube, a game on the floor, the works around the concourse.',
  signatures: 'The circular drum on Seventh Avenue, the bowl of orange and blue seats climbing to the suspended cable roof, the four sided scoreboard over centre court, the hardwood with its lines, the bridges hanging under the ceiling.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x14183a, horizon: 0x4a4060, ground: 0x0e0e12, fog: 0.003, stars: 120, env: 0.6 });
    k.hemi(0xffe4c8, 0x1a1418, 0.5);
    /* 2026-11-24 (wave 4c): the concrete, the drum's precast and the maple court are Poly Haven scans (CC0) now */
    const conc = sc(k, 'garden', 'concrete_floor_02', 3, () => X.concrete(0x8a8a86, 99), { color: 0x9a9894, roughness: 0.85 }, 0x5a5a58),
      drum = sc(k, 'garden', 'brushed_concrete', 4, () => X.concrete(0xb8b4ac, 100), { color: 0xd8d2c6, roughness: 0.8 }, 0x8a8782),
      floorH = sc(k, 'garden', 'wood_floor', 1.6, () => X.planks(0xd8b070, 6, 214, 0.15), { color: 0xffe0b0, roughness: 0.32 }, 0x9a7a4a),
      orange = k.flat(0xf08a2a, 0, 0.8), blue = k.flat(0x1e56b4, 0, 0.8),
      dark = k.flat(0x111216, 0.5, 0.7), steel = k.flat(0x8c98a4, 0.9, 0.3),
      white = k.flat(0xf4f0e8, 0, 0.6), glowW = k.glow(0xfff4e0), screen = k.glow(0x3a6aff, 0.9);
    // Seventh Avenue and the drum
    street(k, { w: 24, len: 160, z: 60, x: 0 });
    blockFront(k, { x: 40, z0: 140, count: 10, face: -1, seed: 215, h: [18, 40] });
    const R = 60;
    k.mesh(new T.CylinderGeometry(R, R, 26, 64, 1, true), drum, 0, 13, -20);
    k.mesh(new T.CylinderGeometry(R + 1, R + 1, 2, 64), conc, 0, 27, -20);
    for (let i = 0; i < 48; i++) { const a = (i / 48) * PI * 2; k.box(1.2, 26, 0.8, Math.cos(a) * (R + 0.3), 13, -20 + Math.sin(a) * (R + 0.3), conc).rotation.y = -a; }
    k.box(30, 8, 8, 0, 4, 44, dark);
    k.sign('MADISON SQUARE GARDEN', 26, 2.4, 0, 4.5, 48.05, '#111216', '#f4f0e8', 150, 0, { border: true });
    for (let i = 0; i < 6; i++) k.arch(2.6, 3.6, 4, -10 + i * 4, 0, 40, dark, false, 0.85);
    k.block(-R, -11.4, 39, 41); k.block(11.4, R, 39, 41);
    // the bowl: rings of seats climbing in two tiers, the concourse ring, the court in the middle
    const CX = 0, CZ = -20;
    k.box(120, 0.4, 120, CX, -0.2, CZ, conc);
    k.box(29, 0.1, 15.5, CX, 0.05, CZ, floorH);
    for (const [w, d, x, z] of [[28, 0.08, 0, 7.6], [28, 0.08, 0, -7.6], [0.08, 15.2, 14, 0], [0.08, 15.2, -14, 0], [0.08, 15.2, 0, 0]]) k.box(w as number, 0.01, d as number, CX + (x as number), 0.11, CZ + (z as number), white);
    for (const s of [-1, 1]) { k.box(4.9, 0.01, 5.8, CX + s * (14 - 2.9), 0.105, CZ, orange).rotation.y = PI / 2; k.torus(1.8, 0.03, CX + s * (14 - 5.8), 0.11, CZ, white, 32).rotation.x = PI / 2; }
    k.torus(1.8, 0.03, CX, 0.11, CZ, white, 32).rotation.x = PI / 2;
    for (const s of [-1, 1]) { const x = CX + s * (14 + 1.2); k.beam(v(x, 0, CZ), v(x, 3.4, CZ), 0.1, steel, 6); k.box(0.05, 1.05, 1.8, x - s * 1.2, 3.05, CZ, k.glass(0xffffff, 0.35, 0.05)); k.torus(0.23, 0.02, x - s * 1.5, 2.55, CZ, orange, 16).rotation.x = PI / 2; }
    /* The court used to be blocked, which put the twelve courtside works out of
       reach: they hang on the boards facing in, so the floor is the only place
       to see them from. Walking out onto the hardwood of the Garden is the
       whole idea of the room. Only the two hoop stanchions are kept clear. */
    for (const s of [-1, 1]) k.keepOut.push({ x: CX + s * 15.2, z: CZ, r: 1.2 });
    /* 2026-11-24 (wave 4c): every seat was a half metre cube. Now a seat pan and a reclined back,
       the back to the outside of the bowl (local +z is outward), still one instanced draw per colour. */
    const seatG = (() => { const pan = new T.BoxGeometry(0.48, 0.07, 0.42); pan.translate(0, 0.44, -0.02); const back = new T.BoxGeometry(0.46, 0.5, 0.06); back.rotateX(0.16); back.translate(0, 0.72, 0.2); [pan, back].forEach((g) => { g.deleteAttribute('uv'); g.deleteAttribute('normal'); }); const m = mergeGeometries([pan.toNonIndexed(), back.toNonIndexed()])!; m.computeVertexNormals(); return m; })();
    const lo: T.Matrix4[] = [], hi: T.Matrix4[] = [];
    for (let r = 0; r < 22; r++) { const rad = 18 + r * 0.9, y = 0.4 + r * 0.5; const n = Math.floor(rad * 6); for (let i = 0; i < n; i++) { const a = (i / n) * PI * 2; if (r > 12 && Math.abs(Math.sin(a)) < 0.06) continue; (r % 2 ? lo : hi).push(new T.Matrix4().compose(v(CX + Math.cos(a) * rad, y, CZ + Math.sin(a) * rad), new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), -a + PI / 2), v(1, 1, 1))); } k.mesh(new T.RingGeometry(rad - 0.45, rad + 0.45, 96), conc, CX, y - 0.05, CZ).rotation.x = -PI / 2; }
    k.instances(seatG, blue, lo); k.instances(seatG, orange, hi);
    for (let r = 0; r < 12; r++) { const rad = 40 + r * 0.9, y = 13 + r * 0.6; const n = Math.floor(rad * 5); const arr: T.Matrix4[] = []; for (let i = 0; i < n; i++) { const a = (i / n) * PI * 2; if (Math.abs(Math.sin(a)) < 0.05 || Math.abs(Math.cos(a)) < 0.05) continue; arr.push(new T.Matrix4().compose(v(CX + Math.cos(a) * rad, y, CZ + Math.sin(a) * rad), new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), -a + PI / 2), v(1, 1, 1))); } k.instances(seatG, r % 2 ? blue : orange, arr); k.mesh(new T.RingGeometry(rad - 0.45, rad + 0.45, 96), conc, CX, y - 0.05, CZ).rotation.x = -PI / 2; }
    k.mesh(new T.RingGeometry(38, 40.5, 96), conc, CX, 12.4, CZ).rotation.x = -PI / 2;
    k.mesh(new T.CylinderGeometry(39.6, 39.6, 3, 96, 1, true), dark, CX, 11, CZ);
    k.mesh(new T.RingGeometry(16.5, 18.5, 96), conc, CX, 0.05, CZ).rotation.x = -PI / 2;
    k.rail(0, 0, 0, steel, 1.0, 'x', 1);
    for (let i = 0; i < 64; i++) { const a = (i / 64) * PI * 2; k.box(0.06, 1.0, 0.06, CX + Math.cos(a) * 16.6, 0.5, CZ + Math.sin(a) * 16.6, steel); k.box(0.06, 1.0, 0.06, CX + Math.cos(a) * 38.2, 12.9, CZ + Math.sin(a) * 38.2, steel); }
    k.torus(16.6, 0.03, CX, 1.0, CZ, steel, 96).rotation.x = PI / 2; k.torus(38.2, 0.03, CX, 13.4, CZ, steel, 96).rotation.x = PI / 2;
    // the cable roof and the bridges, the cube over centre
    k.mesh(new T.CylinderGeometry(R - 1, R - 1, 0.5, 64), dark, CX, 30, CZ);
    for (let i = 0; i < 48; i++) { const a = (i / 48) * PI * 2; k.curve([v(CX + Math.cos(a) * (R - 2), 29.6, CZ + Math.sin(a) * (R - 2)), v(CX + Math.cos(a) * 25, 24, CZ + Math.sin(a) * 25), v(CX + Math.cos(a) * 4, 22.6, CZ + Math.sin(a) * 4)], 0.1, steel, 16); }
    for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; k.point(CX + Math.cos(a) * 30, 24, CZ + Math.sin(a) * 30, 0xfff0d8, 60, 40); k.box(1.6, 0.4, 1.0, CX + Math.cos(a) * 30, 25, CZ + Math.sin(a) * 30, glowW).rotation.y = -a; }
    /* The two Chase Bridges (2013) run parallel along the long sides of the court, hung from the
       roof on steel tube hangers. They used to be four diagonal beams crossing in an X. */
    const bridges: T.Mesh[] = [];
    for (const s of [-1, 1]) {
      const bz = CZ + s * 22;
      bridges.push(k.box(60, 1.4, 5.2, CX, 21, bz, steel));
      k.box(60, 1.1, 0.12, CX, 22.2, bz - 2.6, dark); k.box(60, 1.1, 0.12, CX, 22.2, bz + 2.6, dark);
      for (let i = 0; i < 12; i++) { const hx = CX - 27.5 + i * 5; k.box(0.18, 2.6, 0.18, hx, 23.5, bz - 2.4, steel); k.box(0.18, 2.6, 0.18, hx, 23.5, bz + 2.4, steel); }
    }
    const cube = new T.Group(); cube.position.set(CX, 15, CZ);
    for (let f = 0; f < 4; f++) { const face = new T.Mesh(new T.PlaneGeometry(9, 5), new T.MeshBasicMaterial({ color: 0x0a0a10 })); face.rotation.y = (f / 4) * PI * 2; face.position.set(Math.sin((f / 4) * PI * 2) * 4.6, 0, Math.cos((f / 4) * PI * 2) * 4.6); cube.add(face); }
    const frame = new T.Mesh(new T.BoxGeometry(9.4, 5.4, 9.4), dark); cube.add(frame);
    k.add(cube); k.beam(v(CX, 30, CZ), v(CX, 17.8, CZ), 0.2, steel, 8);
    if (!ctx.reduced) k.ticks.push((t) => { cube.rotation.y = t * 0.05; });
    /* the score is on the four video boards of the wave 4c pass below */
    // the game and the crowd, the concourse, the census as the ribbon board
    const players = k.crowd([v(CX - 12, 0.1, CZ - 5), v(CX + 12, 0.1, CZ + 5), v(CX - 12, 0.1, CZ + 5), v(CX + 12, 0.1, CZ - 5)], 10, { seed: 84, speed: 3.6, spread: 4, animate: !ctx.reduced, closed: true, colors: [0xf4f0e8, 0x1e56b4, 0xf4f0e8, 0xf08a2a] });
    void players;
    const ball = k.mesh(new T.SphereGeometry(0.12, 10, 8), orange, CX, 1, CZ, true);
    if (!ctx.reduced) k.ticks.push((t) => { ball.position.set(CX + Math.sin(t * 0.5) * 12, 0.9 + Math.abs(Math.sin(t * 4)) * 1.6, CZ + Math.cos(t * 0.35) * 5); });
    k.censusWall({ x: CX, y: 12, z: CZ, rotY: 0, cols: 1, rows: 1, tile: 0.01, gap: 0, start: 0, pieces: ctx.all.slice(0, 1), backing: dark });
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2 + PI / 8; const x = CX + Math.cos(a) * 39.4, z = CZ + Math.sin(a) * 39.4; k.censusWall({ x, y: 15.2, z, rotY: -a + PI / 2 + PI, cols: 12, rows: 2, tile: 0.55, gap: 0.05, start: ctx.wallStart(300 + i * 24, 24), pieces: ctx.all, backing: dark }); }
    k.crowd([v(CX - 17, 0.1, CZ - 10), v(CX + 17, 0.1, CZ + 10)], 8, { seed: 85, speed: 0.3, spread: 3, animate: !ctx.reduced });
    k.point(CX, 6, CZ, 0xfff4e0, 60, 30);
    // the works: the concourse ring wall between the vomitories, the courtside boards, the lobby
    const mounts: Mount[] = [];
    for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2 + PI / 12; const x = CX + Math.cos(a) * 41.2, z = CZ + Math.sin(a) * 41.2; if (Math.abs(a - PI / 2) < 0.3 || Math.abs(a - (3 * PI) / 2) < 0.3) continue; mounts.push({ position: v(x, 16.5, z), rotation: -a + PI / 2 + PI, target: v(CX + Math.cos(a) * 34, 15, CZ + Math.sin(a) * 34), width: 4.2, height: 2.5, style: 'steel', wash: true }); }
    for (let i = 0; i < 6; i++) { const x = CX - 12 + i * 4.8; for (const s of [-1, 1]) mounts.push({ position: v(x, 0.7, CZ + s * 8.2), rotation: s > 0 ? PI : 0, target: v(x, 1, CZ), width: 4.4, height: 1.0, style: 'none', wash: false }); }
    for (let i = 0; i < 3; i++) { const x = -8 + i * 8; mounts.push({ position: v(x, 3.4, 40.34), rotation: PI, target: v(x, 3, 30), width: 3.6, height: 2.1, style: 'steel', wash: true }); }
    /* ---- THE BIG UPGRADE, wave 4c (2026-11-24) ----
       The bowl read as seats floating in front of a white drum, with no risers, no people and a black box for a
       scoreboard. Now: the inside of the drum is the dark arena wall, every row stands on its concrete riser, a full
       house sits in the seats (and does the wave), the scoreboard is four lit video boards with a ring under it, a
       ribbon board runs round the fascia between the tiers, section numbers, courtside chairs and a scorer's table
       (Poly Haven, CC0), proper stanchions with padding and nets, and an anamorphic floor piece on the hardwood. */
    const riser = k.flat(0x2a2c31, 0.1, 0.85), padBlue = k.flat(0x1e4fa8, 0, 0.75);
    k.mesh(new T.CylinderGeometry(R - 1.2, R - 1.2, 30, 64, 1, true), k.flat(0x16171b, 0.2, 0.8, { side: T.BackSide }), CX, 15, CZ);
    for (let r = 0; r < 22; r++) { const rad = 18 + r * 0.9, y = 0.4 + r * 0.5; k.mesh(new T.CylinderGeometry(rad - 0.45, rad - 0.45, 0.5, 96, 1, true), riser, CX, y - 0.3, CZ); }
    for (let r = 0; r < 12; r++) { const rad = 40 + r * 0.9, y = 13 + r * 0.6; k.mesh(new T.CylinderGeometry(rad - 0.45, rad - 0.45, 0.6, 96, 1, true), riser, CX, y - 0.35, CZ); }
    k.mesh(new T.CylinderGeometry(51, 51, 9, 96, 1, true), riser, CX, 16.5, CZ);
    /* the full house: about six seats in ten taken, winter coats and orange and blue, one instanced draw; the wave goes round */
    { const torso = new T.CylinderGeometry(0.15, 0.2, 0.55, 5, 1, true); torso.translate(0, 0.28, 0); const head = new T.OctahedronGeometry(0.12, 0); head.translate(0, 0.68, 0);
      const strip = (g: T.BufferGeometry) => { const n = g.index ? g.toNonIndexed() : g.clone(); if (n.attributes.uv) n.deleteAttribute('uv'); return n; };
      const fanG = mergeGeometries([strip(torso), strip(head)])!;
      const rnd = X.mulberry(7314), keep = k.o.quality === 'high' ? 0.62 : 0.34, base: number[] = [];
      const mountA = Array.from({ length: 12 }, (_, i) => (i / 12) * PI * 2 + PI / 12);
      const ring = (rows: number, r0: number, y0: number, dy: number, skip: (a: number, r: number) => boolean) => { for (let r = 0; r < rows; r++) { const rad = r0 + r * 0.9, y = y0 + r * dy, n = Math.floor(rad * (r0 > 30 ? 5 : 6)); for (let i = 0; i < n; i++) { const a = (i / n) * PI * 2; if (skip(a, r) || rnd() > keep) continue; base.push(a, rad - 0.08, y + 0.36); } } };
      ring(22, 18, 0.4, 0.5, (a, r) => r > 12 && Math.abs(Math.sin(a)) < 0.06);
      ring(12, 40, 13, 0.6, (a, r) => Math.abs(Math.sin(a)) < 0.05 || Math.abs(Math.cos(a)) < 0.05 || (r < 6 && mountA.some((m) => Math.abs(Math.atan2(Math.sin(a - m), Math.cos(a - m))) < 0.07)));
      const N = base.length / 3, fans = k.instances(fanG, new T.MeshStandardMaterial({ roughness: 0.9 }), Array.from({ length: N }, () => new T.Matrix4()));
      fans.frustumCulled = false;
      const pal = [0x1e4fa8, 0xf08a2a, 0x1a1c22, 0x2a2e36, 0xe8e4da, 0x6a2a2a, 0x3a4a5a, 0x1e4fa8, 0x8a8a86, 0xf08a2a];
      const c = new T.Color(), m4 = new T.Matrix4();
      for (let i = 0; i < N; i++) fans.setColorAt(i, c.set(pal[Math.floor(rnd() * pal.length)]));
      const place = (t: number) => { const wa = (t * 0.45) % (PI * 2); for (let i = 0; i < N; i++) { const a = base[i * 3], d = Math.abs(Math.atan2(Math.sin(a - wa), Math.cos(a - wa))), lift = d < 0.3 ? (1 - d / 0.3) * 0.42 : 0; m4.makeTranslation(CX + Math.cos(a) * base[i * 3 + 1], base[i * 3 + 2] + lift, CZ + Math.sin(a) * base[i * 3 + 1]); fans.setMatrixAt(i, m4); } fans.instanceMatrix.needsUpdate = true; };
      place(-99); if (fans.instanceColor) fans.instanceColor.needsUpdate = true;
      if (!ctx.reduced) { let last = 0; k.ticks.push((t) => { if (t - last < 0.05) return; last = t; place(t); }); } }
    /* the stanchions: a padded base on the baseline, the arm, a framed glass board, the rim and a net */
    for (const s of [-1, 1]) { const bx = CX + s * 16.4; k.keepOut.push({ x: bx, z: CZ, r: 1.4 }); k.box(1.3, 1.1, 2.4, bx, 0.55, CZ, padBlue); k.box(1.32, 0.12, 2.42, bx, 1.12, CZ, k.flat(0xf08a2a, 0, 0.6)); k.box(0.36, 2.4, 0.36, bx, 2.2, CZ, padBlue);
      k.beam(v(bx, 3.3, CZ), v(CX + s * 14.25, 3.2, CZ), 0.09, k.flat(0x1a1c22, 0.6, 0.4), 6);
      for (const [w, h, y, z] of [[0.06, 1.1, 3.05, 0.92], [0.06, 1.1, 3.05, -0.92], [0.06, 0.06, 3.58, 0], [0.06, 0.06, 2.52, 0]] as [number, number, number, number][]) k.box(w, h, z === 0 ? 1.86 : 0.06, CX + s * 14.0, y, CZ + z, k.flat(0xf08a2a, 0.3, 0.5));
      const net = k.mesh(new T.CylinderGeometry(0.23, 0.14, 0.42, 12, 3, true), new T.MeshBasicMaterial({ color: 0xf4f4f0, wireframe: true, transparent: true, opacity: 0.85 }), CX + s * 13.7, 2.34, CZ, true); void net; }
    /* the scoreboard: four lit video boards with the score, the clock and a ring of LED under it */
    { const faces = ['HOME 98   VISITORS 97', '4TH   1:58', 'NEW YORKERS BY MLOW', 'THE GARDEN']; for (let f = 0; f < 4; f++) { const a = (f / 4) * PI * 2; hsign(k, faces[f], 8.6, 4.6, CX + Math.sin(a) * 4.72, 15, CZ + Math.cos(a) * 4.72, a, { fg: f % 2 ? '#f08a2a' : '#f4f0e8', bg: '#0b1230', border: '#1e4fa8', font: f === 1 ? 'W2 JetBrains Mono' : 'W2 Archivo Expanded', size: 0.34, lit: true }); }
      const ledT = paintTex(2048, 128, (g) => { g.fillStyle = '#05060a'; g.fillRect(0, 0, 2048, 128); g.fillStyle = '#f08a2a'; g.font = '800 82px "W2 Archivo Expanded", Arial, sans-serif'; g.textBaseline = 'middle'; g.fillText('DEFENSE', 120, 66); g.fillStyle = '#f4f0e8'; g.fillText('MAKE SOME NOISE', 1144, 66); }, ['W2 Archivo Expanded']);
      ledT.wrapS = T.RepeatWrapping; ledT.repeat.set(2, 1);
      k.mesh(new T.CylinderGeometry(5.6, 5.6, 0.9, 48, 1, true), new T.MeshBasicMaterial({ map: ledT, toneMapped: false }), CX, 12.1, CZ, true);
      k.torus(5.6, 0.08, CX, 12.6, CZ, k.flat(0x1a1c22, 0.6, 0.4), 48).rotation.x = PI / 2; k.torus(5.6, 0.08, CX, 11.6, CZ, k.flat(0x1a1c22, 0.6, 0.4), 48).rotation.x = PI / 2;
      if (!ctx.reduced) k.ticks.push((t) => { ledT.offset.x = (t * 0.04) % 1; }); }
    /* the ribbon board on the fascia between the tiers, read from every seat in the lower bowl, and the section numbers under it */
    { const rib = paintTex(4096, 128, (g) => { g.fillStyle = '#04050a'; g.fillRect(0, 0, 4096, 128); const items = ['THE WORLD\'S MOST FAMOUS ARENA', 'NEW YORKERS BY MLOW', 'SEVENTH AVENUE AND 33RD', 'THE CENSUS IS HANGING ON THE CONCOURSE']; let x = 30; g.textBaseline = 'middle'; g.font = '800 70px "W2 Archivo Expanded", Arial, sans-serif'; for (let i = 0; x < 4096; i++) { g.fillStyle = i % 2 ? '#f08a2a' : '#f4f0e8'; const s = items[i % items.length]; g.fillText(s, x, 66); x += g.measureText(s).width + 90; g.fillStyle = '#1e4fa8'; g.fillRect(x - 60, 40, 30, 50); } }, ['W2 Archivo Expanded']);
      rib.wrapS = T.RepeatWrapping; rib.repeat.set(-3, 1);
      k.mesh(new T.CylinderGeometry(39.5, 39.5, 1.0, 128, 1, true), new T.MeshBasicMaterial({ map: rib, side: T.BackSide, toneMapped: false }), CX, 11.55, CZ, true);
      if (!ctx.reduced) k.ticks.push((t) => { rib.offset.x = (t * 0.012) % 1; });
      for (let i = 0; i < 20; i++) { const a = (i / 20) * PI * 2 + 0.08, x = CX + Math.cos(a) * 39.45, z = CZ + Math.sin(a) * 39.45; hsign(k, String(101 + i), 1.4, 0.6, x, 10.35, z, Math.atan2(-Math.cos(a), -Math.sin(a)), { fg: '#f4f0e8', bg: '#1e4fa8', font: 'W2 Archivo Expanded', size: 0.7, lit: false }); } }
    /* the catwalk and light ring under the roof */
    k.torus(30, 0.35, CX, 25.4, CZ, k.flat(0x3a3e44, 0.6, 0.5), 96).rotation.x = PI / 2; k.torus(31.4, 0.12, CX, 26.2, CZ, k.flat(0x3a3e44, 0.6, 0.5), 96).rotation.x = PI / 2;
    for (let i = 0; i < 36; i++) { const a = (i / 36) * PI * 2; k.box(0.5, 0.5, 0.7, CX + Math.cos(a) * 30.7, 24.9, CZ + Math.sin(a) * 30.7, k.glow(0xfff2dc)).rotation.y = -a; }
    /* courtside: two rows of folding chairs behind the boards on both sidelines, and the scorer's table at centre (Poly Haven, CC0) */
    { const at: number[][] = []; /* the chair is 3,752 triangles: 26 of them, either side of the table and along the far sideline, not 130 */
      for (const s of [-1, 1]) for (const dz of s > 0 ? [9.1, 9.9] : [9.1]) for (let i = 0; i < (s > 0 ? 8 : 10); i++) { const x = s > 0 ? (i < 4 ? -1.9 - i * 0.72 : 1.9 + (i - 4) * 0.72) : -3.24 + i * 0.72; at.push([CX + x, 0.1, CZ + s * dz, s > 0 ? PI : 0]); }
      many(k, 'garden/ph_folding_chair_01', { height: 0.86 }, at, (o) => tint(o, 0x15161a, 0.55, 0.4));
      many(k, 'garden/ph_metal_office_desk', { width: 3.2 }, [[CX, 0.1, CZ + 9.4, PI]]); k.box(3.2, 0.7, 0.04, CX, 0.55, CZ + 8.9, k.flat(0x0b1230, 0, 0.6)); hsign(k, 'THE GARDEN', 3.0, 0.5, CX, 0.6, CZ + 8.86, PI, { fg: '#f08a2a', font: 'W2 Archivo Expanded', size: 0.6, lit: true }); }
    /* banners in the rafters: eight invented banners, painted here until the Firefly plates land (FIREFLY_QUEUE.md, garden) */
    { const words = [['NEW YORKERS', '1,111 COUNTED'], ['THE CENSUS', 'SOLD OUT'], ['BOWERY', 'ROOM ONE'], ['THE MARKS', 'BROKE THE SEAL'], ['MLOW', 'NEW YORK'], ['THE MUSEUM', 'ALL ROOMS'], ['SEVENTH AVE', '33RD STREET'], ['THE GARDEN', 'SINCE 1968']];
      words.forEach(([a, b], i) => { const t = paintTex(512, 1024, (g) => { g.fillStyle = i % 2 ? '#f08a2a' : '#1e4fa8'; g.fillRect(0, 0, 512, 1024); g.fillStyle = '#f4f0e8'; g.fillRect(24, 24, 464, 8); g.fillRect(24, 992, 464, 8); g.textAlign = 'center'; g.font = '800 64px "W2 Archivo Expanded", Arial, sans-serif'; g.fillText(a, 256, 380, 440); g.font = '700 46px "W2 JetBrains Mono", monospace'; g.fillText(b, 256, 520, 440); g.beginPath(); g.moveTo(140, 760); g.lineTo(372, 760); g.lineTo(256, 900); g.closePath(); g.fill(); }, ['W2 Archivo Expanded', 'W2 JetBrains Mono']);
        const x = CX - 24.5 + i * 7, z = CZ + (i % 2 ? 26 : -26); fireflyPlate(k, `assets/museum/tex/garden/ff_banner_${i + 1}.webp`, 3.2, 6.4, x, 22.5, z, i % 2 ? PI : 0, new T.MeshStandardMaterial({ map: t, roughness: 0.9, side: T.DoubleSide })); }); }
    /* the Seventh Avenue marquee: the big lit sign on its pylon, and a glass canopy over the doors */
    const MQX = 26, MQZ = 47, MQR = -0.9, mqs = Math.sin(MQR), mqc = Math.cos(MQR);
    k.box(1.2, 10, 1.2, MQX, 5, MQZ, k.flat(0x1a1c22, 0.6, 0.4)); k.box(9, 4.2, 0.6, MQX, 10.6, MQZ, k.flat(0x0b0c10, 0.4, 0.5)).rotation.y = MQR; k.block(MQX - 0.7, MQX + 0.7, MQZ - 0.7, MQZ + 0.7);
    hsign(k, 'TONIGHT  NEW YORKERS BY MLOW', 8.6, 1.6, MQX + mqs * 0.32, 11.4, MQZ + mqc * 0.32, MQR, { fg: '#f08a2a', bg: '#05060a', font: 'W2 Archivo Expanded', size: 0.5, lit: true });
    hsign(k, 'THE GARDEN', 8.6, 1.8, MQX + mqs * 0.32, 9.6, MQZ + mqc * 0.32, MQR, { fg: '#f4f0e8', bg: '#1e4fa8', font: 'W2 Archivo Expanded', size: 0.62, lit: true });
    k.box(26, 0.25, 4.2, 0, 4.6, 50.1, k.glass(0xcfe2ee, 0.35, 0.08)); for (const x of [-12.5, -4.2, 4.2, 12.5]) k.box(0.16, 4.6, 0.16, x, 2.3, 52, k.flat(0x8c98a4, 0.9, 0.3));
    /* the illusion (ON LOCATION rule 9): THE GARDEN painted flat on the hardwood, stretched so that from the baseline by the
       west basket it stands up off the floor like a board; walk onto the court and it smears into long paint */
    if (HAS_DOM) anamorphTex(k, floorType('THE GARDEN', '#f4f0e8', 1024, 372), CX - 17.2, CZ + 2.4, 3.1, 0.11, -PI / 2, 6, 3.8, 1.6, 0.85);
    k.egg(v(CX - 17.2, 1.6, CZ + 2.4), { id: 'garden-anamorph', title: 'Paint that stands up', text: 'THE GARDEN is painted flat across the hardwood and stretched along the court, so that from this one spot by the west basket it stands up off the floor like a board. Step out onto the court and it falls back into long smears of paint. The trick is anamorphosis, the same one that hides a skull across the floor of Hans Holbein\'s The Ambassadors of 1533.', clue: 'Stand on the baseline beside the west basket and look down the court.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.6 });
    // landmark eggs
    k.egg(v(CX, 22.6, CZ), { id: 'garden-wheel', title: 'A bicycle wheel on its side', year: '1968', text: 'The roof is a 404 foot steel cable suspension roof, likened when it opened to a bicycle wheel mounted horizontally on 48 steel columns. Its 48 zinc coated cables, each made of 271 steel wires, run from an unsupported hub to the rim, and the hub stays rigid only because the cables are in tension. Together they weigh 163 tons.', clue: 'Stand at centre court and look straight up at the hub where the cables meet.', source: { name: '40 years ago: America\'s largest cable suspension roof, New Steel Construction', url: 'https://www.newsteelconstruction.com/wp/40-year-ago-americas-largest-cable-suspension-roof-madison-square-gardens-new-york-city/' } }, { r: 3 });
    k.egg(bridges[1], { id: 'garden-bridges', title: 'Seats on a bridge', year: '2013', text: 'The two Chase Bridges hang from the ceiling on 24 steel tube hangers for the north bridge and 26 for the south. Each is 233 feet long and 22 feet wide, together they weigh 662 tons, and they seat 430 fans for Knicks and Rangers games.', clue: 'Look up at the long steel walkways hanging along both sides of the court.', source: { name: 'Garden bridges feature extra high tolls, ESPN New York', url: 'https://www.espn.com/blog/new-york/knicks/post/_/id/48765/garden-bridges-feature-extra-high-tolls' } });
    k.egg(v(CX - 17, 1.4, CZ), { id: 'garden-45ft', title: 'The floor is four storeys up', year: '1968', text: 'The arena floor of the 1968 Garden sits 45 feet above street level, with the railway and terminal of Penn Station underground below it. When it opened it had 20,234 seats, every one with a clear view of the floor.', clue: 'Lean on the rail at the edge of the court.', source: { name: '40 years ago: America\'s largest cable suspension roof, New Steel Construction', url: 'https://www.newsteelconstruction.com/wp/40-year-ago-americas-largest-cable-suspension-roof-madison-square-gardens-new-york-city/' } }, { r: 1.6 });
    k.egg(v(0, 2.2, 41.2), { id: 'garden-penn', title: 'The station it replaced', text: 'The Garden was one of the first arenas built above the platforms of an active railroad station. The above ground portions of the original Pennsylvania Station were torn down to make room for it, and the public outcry over that demolition led to the creation of the New York City Landmarks Preservation Commission.', clue: 'Stand in the arches of the entrance on Seventh Avenue.', source: { name: 'Madison Square Garden, Wikipedia', url: 'https://en.wikipedia.org/wiki/Madison_Square_Garden' } }, { r: 1.8 });
    k.egg(v(-9, 4.5, 48.4), { id: 'garden-fourth', title: 'The fourth Garden', year: '1879', text: 'This is the fourth venue to carry the name. The first two, opened in 1879 and 1890, stood near Madison Square, and the third, from 1925, was at Eighth Avenue and 50th Street. The current Garden opened on February 11, 1968, between Seventh and Eighth Avenues from 31st to 33rd Streets.', clue: 'Read the name over the entrance, and ask which Madison Square it means.', source: { name: 'Madison Square Garden, Wikipedia', url: 'https://en.wikipedia.org/wiki/Madison_Square_Garden' } }, { r: 1.8 });
    k.egg(v(CX + 13.8, 3.1, CZ), { id: 'garden-curry', title: 'The record three', year: '2021', text: 'The Garden is the oldest arena in the NBA. On December 14, 2021, Stephen Curry broke the NBA all time record for three point field goals here, and Billy Joel holds the arena record for concert appearances, 150 as of July 2024.', clue: 'Walk out to one of the two backboards.', source: { name: 'Madison Square Garden, Wikipedia', url: 'https://en.wikipedia.org/wiki/Madison_Square_Garden' } }, { r: 1.4 });
    return { mounts, spawn: v(-18, 3, 64), look: v(4, 12, 24), eye: 3, bounds: [-42, 42, CZ - 42, 68], style: 'steel', floorY: (x, z) => { const d = Math.hypot(x - CX, z - CZ); if (d > 38 && d < 41 && z < 30) return 12.4; if (d >= 18 && d <= 38 && z < 30) return 0.4 + Math.min(21, (d - 18) / 0.9) * 0.5; return 0; } };
  },
};

/* ---------------- 74 THE TEMPLE OF DENDUR ---------------- */
export const dendur: RoomDef = {
  id: 'dendur',
  name: 'The temple by the window',
  area: 'THE TEMPLE OF DENDUR',
  mood: 'Snow light through glass',
  color: '#d8c8a0',
  description: 'The great sloped glass wall on the park, the pool standing in for the Nile, the sandstone gate and temple on their platform, the works along the granite walls of the wing.',
  signatures: 'The Sackler wing with its tilted wall of glass and the park beyond, the reflecting pool with its edge of black granite, the temple and its pylon gateway raised on a stone platform, the sloped granite walls of the hall, the sunlight sliding across the floor.',
  build(k, ctx) {
    k.sky({ top: 0x9ab0c8, horizon: 0xe8e8e4, ground: 0x6a6a68, fog: 0.002, sun: { az: 3.6, el: 0.55, color: 0xfff4e6, size: 12 }, haze: 0.5, env: 0.95 });
    k.hemi(0xeef4ff, 0x4a4a48, 0.9);
    k.sun(0xfff0dc, 2.2, 60, 60, 30, true, 90);
    /* 2026-11-24 (wave 4c): the hall's granite, its floor, the temple's Nubian sandstone and the snow are Poly Haven scans (CC0) */
    const granite = sc(k, 'dendur', 'granite_tile', 3.2, () => X.ashlar(0x7a7268, 216, 3), { color: 0xd8cfc0, roughness: 0.6 }, 0x8a847a, 1.25),
      floorG = sc(k, 'dendur', 'granite_tile', 2.4, () => X.terrazzo(0xa8a49a, 101), { color: 0xc8c2b8, roughness: 0.32 }, 0x8a867e),
      sandstone = sc(k, 'dendur', 'large_sandstone_blocks', 3.2, () => X.ashlar(0xc8a878, 217, 2), { color: 0xf6dcae, roughness: 0.88 }, 0xa08560, 1.9),
      water = k.flat(0x1a2a34, 0.2, 0.1, { transparent: true, opacity: 0.85 }),
      glass = k.glass(0xe8f4f8, 0.1, 0.03),
      steel = k.flat(0x8c98a4, 0.9, 0.3),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      snow = sc(k, 'dendur', 'snow_02', 4, () => X.plaster(0xf4f4f8, 102), { color: 0xe8ecf2, roughness: 0.9 }, 0xc8ccd2);
    // the park outside under snow, the wing's glass wall sloping out over it
    k.box(300, 0.4, 200, 0, -0.2, -140, snow);
    const rnd = X.mulberry(74);
    for (let i = 0; i < 50; i++) k.tree((rnd() - 0.5) * 240, 0, -60 - rnd() * 120, { kind: 'bare', h: 8 + rnd() * 6, r: 3 + rnd() * 2, seed: i });
    k.skyline({ z: -320, count: 26, spacing: 10, scale: 2.8, base: -1, seed: 218, lit: 0.25, glow: 0.5, tint: 0x8a8e96, rows: 1, spires: true });
    const HW = 60, HD = 50, HH = 16;
    k.box(HW, 0.4, HD, 0, -0.2, 0, floorG);
    for (const s of [-1, 1]) { const w = k.box(0.8, HH, HD, s * HW / 2, HH / 2, 0, granite); w.rotation.z = -s * 0.12; k.block(s * HW / 2 - 1.2, s * HW / 2 + 1.2, -HD / 2, HD / 2); }
    k.box(HW, HH, 0.8, 0, HH / 2, HD / 2, granite); k.block(-HW / 2, -2, HD / 2 - 0.6, HD / 2 + 0.6); k.block(2, HW / 2, HD / 2 - 0.6, HD / 2 + 0.6);
    /* the ceiling was a dark slab: it is the wing's skylight of stippled glass on a steel grid, the light coming through it */
    k.box(HW + 2, 0.3, HD + 2, 0, HH + 0.5, 0, k.flat(0xdfe4e6, 0, 0.9, { emissive: 0xd8e0e6, emissiveIntensity: 0.45 }));
    for (let x = -HW / 2; x <= HW / 2 + 0.01; x += 3) k.box(0.22, 0.7, HD + 2, x, HH, 0, steel);
    for (let z = -HD / 2; z <= HD / 2 + 0.01; z += 3) k.box(HW + 2, 0.5, 0.18, 0, HH + 0.05, z, steel);
    const gw = k.mesh(new T.PlaneGeometry(HW, HH + 3), glass, 0, HH / 2 - 0.4, -HD / 2 - 1.6); gw.rotation.x = -0.18;
    for (let x = -HW / 2; x <= HW / 2; x += 3) { const m = k.box(0.24, HH + 3, 0.24, x, HH / 2 - 0.4, -HD / 2 - 1.6, steel); m.rotation.x = -0.18; }
    for (let y = 2; y < HH + 2; y += 3) { const m = k.box(HW, 0.16, 0.16, 0, y, -HD / 2 - 1.6 + (HH / 2 - 0.4 - y) * 0.18, steel); void m; }
    k.block(-HW / 2, HW / 2, -HD / 2 - 2.6, -HD / 2 - 1.0);
    // the pool, the platform, the gate and the temple
    k.box(HW - 8, 0.3, 14, 0, 0.1, -HD / 2 + 10, k.flat(0x141416, 0.1, 0.4));
    /* the Nile: real water now, not a tinted slab */
    k.water({ y: 0.3, color: 0x14242c, w: HW - 9, d: 13, x: 0, z: -HD / 2 + 10, amp: 0.015 }); void water;
    k.block(-HW / 2 + 4, HW / 2 - 4, -HD / 2 + 9, -HD / 2 + 17);
    const PX = 0, PZ = 0;
    k.box(30, 1.2, 22, PX, 0.6, PZ, sandstone);
    k.box(30.4, 0.3, 22.4, PX, 1.3, PZ, k.pbr('tdPlat', X.ashlar(0x8a8478, 219, 3), 0.25));
    for (let i = 0; i < 4; i++) k.box(30, 0.3, 1.0, PX, 0.15 + i * 0.3, PZ + 11 + 3 - i * 1.0, sandstone);
    k.box(4, 8, 2.4, PX - 4, 5.4, PZ + 6, sandstone); k.box(4, 8, 2.4, PX + 4, 5.4, PZ + 6, sandstone); k.box(12, 1.2, 2.6, PX, 9.9, PZ + 6, sandstone);
    k.box(4, 2.0, 2.4, PX, 8.4, PZ + 6, sandstone); // a square headed portal under the lintel, as Egyptian gates are, not a round arch
    /* The temple at its real size, 13 m long, 6.6 m wide, 4.9 m high, its front at PZ + 2. The pronaos
       front has two columns with composite lotus capitals, half height screen walls and a square door. */
    const temple = k.box(6.6, 4.9, 13, PX, 1.45 + 2.45, PZ - 4.5, sandstone);
    k.box(7.0, 0.5, 13.4, PX, 1.45 + 4.9 + 0.25, PZ - 4.5, sandstone);
    for (const s of [-1, 1]) {
      k.cyl(0.36, 3.7, PX + s * 1.6, 1.45 + 1.85, PZ + 2.5, sandstone);
      k.cyl(0.38, 0.8, PX + s * 1.6, 1.45 + 4.1, PZ + 2.5, sandstone, 0.62);
      k.box(0.95, 1.9, 0.3, PX + s * 2.65, 1.45 + 0.95, PZ + 2.5, sandstone);
    }
    k.box(1.6, 3.1, 0.08, PX, 1.45 + 1.55, PZ + 2.05, dark);
    const reliefs: T.Mesh[] = [];
    /* 2026-11-24 (wave 4c): the reliefs were twelve 60 cm squares. They are three registers of sunk relief down each wall now:
       offering scenes of a king before tall gods, hieroglyph columns between, painted here as a stand in until the
       Firefly plate lands (FIREFLY_QUEUE.md, dendur ff_relief.webp swaps in by itself) */
    const reliefMats = [0, 1, 2].map((v0) => { const t = HAS_DOM ? paintTex(1024, 216, (g) => {
      const R = X.mulberry(900 + v0); g.fillStyle = '#c9a676'; g.fillRect(0, 0, 1024, 216);
      for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${R() > 0.5 ? '90,64,36' : '240,214,170'},${0.05 + R() * 0.08})`; g.fillRect(R() * 1024, R() * 216, 2 + R() * 6, 1 + R() * 3); }
      const cut = (f: () => void) => { g.save(); g.translate(2, 2); g.fillStyle = 'rgba(70,48,26,0.55)'; f(); g.restore(); g.fillStyle = 'rgba(214,184,138,1)'; f(); };
      const fig = (x: number, h: number, dir: number, crown: number) => cut(() => { g.beginPath(); g.ellipse(x, 200 - h + 16, 11, 14, 0, 0, PI * 2); g.fill(); g.fillRect(x - 13, 200 - h + 30, 26, h * 0.42); g.beginPath(); g.moveTo(x - 15, 200 - h + 30 + h * 0.42); g.lineTo(x + 15, 200 - h + 30 + h * 0.42); g.lineTo(x + 10, 200); g.lineTo(x - 10, 200); g.closePath(); g.fill(); g.fillRect(x + dir * 8, 200 - h + 40, dir * 34, 7); if (crown === 1) { g.fillRect(x - 7, 200 - h - 14, 14, 18); } else if (crown === 2) { g.beginPath(); g.arc(x, 200 - h - 6, 10, 0, PI * 2); g.fill(); g.fillRect(x - 12, 200 - h - 4, 24, 6); } else { g.beginPath(); g.moveTo(x - 8, 200 - h + 4); g.lineTo(x, 200 - h - 22); g.lineTo(x + 8, 200 - h + 4); g.fill(); } });
      const glyphs = (x: number) => cut(() => { for (let y = 18; y < 196; y += 22) { const k2 = Math.floor(R() * 5); if (k2 === 0) { g.beginPath(); g.arc(x, y + 8, 7, 0, PI * 2); g.fill(); } else if (k2 === 1) { g.fillRect(x - 9, y + 4, 18, 5); g.fillRect(x - 2, y, 4, 16); } else if (k2 === 2) { g.beginPath(); g.moveTo(x - 9, y + 14); g.quadraticCurveTo(x, y - 4, x + 9, y + 14); g.fill(); } else if (k2 === 3) { g.fillRect(x - 8, y + 2, 16, 4); g.fillRect(x - 8, y + 10, 16, 4); } else { g.beginPath(); g.ellipse(x, y + 8, 5, 9, 0.5, 0, PI * 2); g.fill(); } } });
      g.fillStyle = 'rgba(90,64,36,0.6)'; g.fillRect(0, 6, 1024, 3); g.fillRect(0, 205, 1024, 3);
      for (let sc0 = 0; sc0 < 3; sc0++) { const x0 = 40 + sc0 * 330; fig(x0 + 70, 150, 1, (sc0 + v0) % 3); fig(x0 + 190, 168, -1, (sc0 + v0 + 1) % 3); fig(x0 + 250, 164, -1, (sc0 + v0 + 2) % 3); glyphs(x0 + 20); glyphs(x0 + 130); glyphs(x0 + 300); }
    }) : null; return t ? new T.MeshStandardMaterial({ map: t, roughness: 0.92, color: 0xffffff }) : k.flat(0xa88860, 0, 0.9); });
    texL?.load('assets/museum/tex/dendur/ff_relief.webp', (t) => { if (!k.live) return; t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; for (const m of reliefMats) if (m instanceof T.MeshStandardMaterial) { m.map = t; m.needsUpdate = true; } }, undefined, () => {});
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const r = k.box(0.04, 1.08, 5.0, PX + s * 3.33, 2.35 + (i % 3) * 1.25, PZ - 8.3 + Math.floor(i / 3) * 5.4, reliefMats[(i + (s > 0 ? 1 : 0)) % 3]); if (s < 0) r.rotation.y = PI; reliefs.push(r); }
    k.block(PX - 15.4, PX + 15.4, PZ - 11.4, PZ + 11.4);
    k.point(PX, 12, PZ - 4, 0xffe8d0, 30, 24);
    k.point(PX, 3, PZ + 12, 0xffe8d0, 10, 8);
    const sunPatch = k.mesh(new T.PlaneGeometry(14, 30), k.glow(0xfff0d8, 0.12), 0, 0.02, 4); sunPatch.rotation.x = -PI / 2; (sunPatch.material as T.MeshBasicMaterial).transparent = true;
    if (!ctx.reduced) k.ticks.push((t) => { sunPatch.position.x = -18 + ((t * 0.4) % 36); });
    k.crowd([v(-22, 0, 18), v(-10, 0, -14), v(12, 0, -14), v(22, 0, 18)], 14, { seed: 86, speed: 0.4, spread: 2, animate: !ctx.reduced, colors: [0x24262c, 0x8a3a3a, 0x151517, 0xd8d0c0, 0x33477f] });
    k.censusWall({ x: 0, y: 4.6, z: HD / 2 - 0.42, rotY: PI, cols: 40, rows: 5, tile: 0.55, gap: 0.05, start: ctx.wallStart(4200, 200), pieces: ctx.all, backing: dark });
    k.sign('THE TEMPLE OF DENDUR  ·  15 BC  ·  GIVEN 1965', 12, 0.7, 0, 8.4, HD / 2 - 0.42, 'transparent', '#e8dcc0', 70, PI);
    // the works: the sloped granite walls of the hall on both sides, the platform's edge screens, the glass wall piers
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const z = -18 + i * 8; mounts.push({ position: v(s * (HW / 2 - 0.9), 3.8, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * (HW / 2 - 10), 3, z > -16.5 && z < -7.5 ? -7.2 : z) /* wave 4c: the spot in front of the work at z -10 stood in the pool */, width: 4.6, height: 2.7, style: 'steel', wash: true }); }
    for (let i = 0; i < 4; i++) { const x = -12 + i * 8; k.box(3.6, 2.4, 0.2, x, 2.4, PZ + 11.5, sandstone); mounts.push({ position: v(x, 2.5, PZ + 11.62), rotation: 0, target: v(x, 2.5, PZ + 20), width: 3.2, height: 1.9, style: 'none', wash: false }); }
    for (let i = 0; i < 4; i++) { const x = -21 + i * 14; mounts.push({ position: v(x, 4.0, -HD / 2 + 2.6), rotation: 0, target: v(x, 3, -HD / 2 + 6), width: 3.2, height: 4.0, style: 'steel', wash: false }); k.box(0.3, 5, 0.3, x - 1.8, 2.5, -HD / 2 + 2.4, steel); k.box(0.3, 5, 0.3, x + 1.8, 2.5, -HD / 2 + 2.4, steel); }
    /* ---- THE BIG UPGRADE, wave 4c (2026-11-24) ----
       The temple and gate were plain boxes. Egyptian buildings end in a cavetto cornice (the flared gorge) over a torus
       roll that also runs down every corner, and carry the winged sun disk over each door: all built now, on the temple
       and on the gate. Papyrus at the edge of the Nile, the hall's benches, the gallery sign, and a ghost on the water. */
    const gorge: [number, number][] = [[0, 0], [0.14, 0], [0.24, 0.12], [0.36, 0.34], [0.46, 0.62], [0.5, 0.78], [0, 0.78]];
    const cornice = (x: number, y: number, z: number, len: number, rot: number) => k.moulding(gorge, len, x, y, z, sandstone, rot);
    const roll = (x: number, y: number, z: number, len: number, along: 'x' | 'y' | 'z') => { const m = k.mesh(new T.CylinderGeometry(0.13, 0.13, len, 10), sandstone, x, y, z); if (along === 'x') m.rotation.z = PI / 2; if (along === 'z') m.rotation.x = PI / 2; return m; };
    { const ty = 1.45 + 4.9, tz0 = PZ - 11, tz1 = PZ + 2;
      cornice(PX + 3.3, ty - 0.02, PZ - 4.5, 13.2, 0); cornice(PX - 3.3, ty - 0.02, PZ - 4.5, 13.2, PI); cornice(PX, ty - 0.02, tz1, 6.8, -PI / 2); cornice(PX, ty - 0.02, tz0, 6.8, PI / 2);
      for (const sx of [-1, 1]) for (const z of [tz0, tz1]) roll(PX + sx * 3.32, 1.45 + 2.45, z, 4.9, 'y');
      for (const sx of [-1, 1]) roll(PX + sx * 3.36, ty - 0.12, PZ - 4.5, 13.1, 'z'); roll(PX, ty - 0.12, tz1 + 0.04, 6.7, 'x');
      const gz = PZ + 6; cornice(PX, 10.5, gz + 1.3, 12.2, -PI / 2); cornice(PX, 10.5, gz - 1.3, 12.2, PI / 2); for (const sx of [-1, 1]) { cornice(PX + sx * 6, 10.5, gz, 2.6, sx > 0 ? 0 : PI); for (const sz of [-1, 1]) roll(PX + sx * 6.02, 5.9, gz + sz * 1.22, 9.0, 'y'); }
      /* the winged sun disk over the gate and over the temple door */
      const disk = HAS_DOM ? paintTex(1024, 220, (g) => { g.fillStyle = 'rgba(0,0,0,0)'; g.fillRect(0, 0, 1024, 220); const cut = (dx: number, dy: number, c: string) => { g.fillStyle = c; g.beginPath(); g.arc(512 + dx, 110 + dy, 62, 0, PI * 2); g.fill(); for (const s2 of [-1, 1]) { g.beginPath(); g.moveTo(512 + dx + s2 * 58, 80 + dy); for (let f = 0; f <= 8; f++) g.lineTo(512 + dx + s2 * (70 + f * 52), 74 + dy + f * 4 + (f % 2) * 8); g.lineTo(512 + dx + s2 * 490, 110 + dy); for (let f = 8; f >= 0; f--) g.lineTo(512 + dx + s2 * (70 + f * 50), 146 + dy - f * 2); g.closePath(); g.fill(); } for (const s2 of [-1, 1]) { g.beginPath(); g.ellipse(512 + dx + s2 * 74, 168 + dy, 14, 40, 0, 0, PI * 2); g.fill(); } }; cut(3, 3, 'rgba(70,48,26,0.6)'); cut(0, 0, '#d9bd8c'); }) : null;
      if (disk) { const dm = new T.MeshStandardMaterial({ map: disk, transparent: true, roughness: 0.9, alphaTest: 0.05 }); k.mesh(new T.PlaneGeometry(5.2, 1.12), dm, PX, 9.9, gz + 1.32); k.mesh(new T.PlaneGeometry(2.6, 0.56), dm, PX, 1.45 + 3.55, tz1 + 0.53); } }
    /* papyrus in the shallows along the Nile's south edge: stems and umbels, two instanced draws */
    { const R = X.mulberry(7409), stems: T.Matrix4[] = [], heads: T.Matrix4[] = [], q = new T.Quaternion(), e = new T.Euler();
      for (let c = 0; c < 9; c++) { const cx = -22 + c * 5.5 + (R() - 0.5) * 1.5, cz = -HD / 2 + 15.6; if (Math.abs(cx) < 3) continue; for (let j = 0; j < 16; j++) { const h = 1.2 + R() * 1.1, lx = cx + (R() - 0.5) * 1.1, lz = cz + (R() - 0.5) * 0.8; e.set((R() - 0.5) * 0.3, 0, (R() - 0.5) * 0.3); q.setFromEuler(e); stems.push(new T.Matrix4().compose(v(lx, 0.3, lz), q, v(1, h, 1))); const top = v(0, h, 0).applyQuaternion(q); heads.push(new T.Matrix4().compose(v(lx + top.x, 0.3 + top.y, lz + top.z), q, v(1, 1, 1))); } }
      const sg = new T.CylinderGeometry(0.008, 0.014, 1, 4); sg.translate(0, 0.5, 0); k.instances(sg, k.flat(0x5a7a3a, 0, 0.8), stems);
      const hg = new T.ConeGeometry(0.12, 0.16, 9, 1, true); hg.rotateX(PI); hg.translate(0, 0.1, 0); k.instances(hg, k.flat(0x7a9a46, 0, 0.85, { side: T.DoubleSide }), heads); }
    for (const x of [-18, -9, 9, 18]) k.bench(x, 16.5, 0, k.pbr('tdBench', X.planks(0x5a4a3a, 3, 741), 1.2), k.flat(0x2a2c30, 0.6, 0.4), 2.6);
    hsign(k, 'GALLERY 131', 2.6, 0.42, -16, 3.3, HD / 2 - 0.42, PI, { fg: '#e8dcc0', font: 'W2 JetBrains Mono', size: 0.7, lit: false });
    hsign(k, 'EGYPTIAN ART  THE TEMPLE OF DENDUR', 4.2, 0.3, -16, 2.85, HD / 2 - 0.42, PI, { fg: '#b8ac94', font: 'W2 Archivo Expanded', size: 0.6, lit: false });
    /* the illusion: a Pepper's ghost on the Nile. A real boat (Poly Haven ship_pinnace, CC0) rides the pool as a faint see
       through figure, the way the stage ghost is a lit figure reflected in glass; it is there only while you stand at the
       water and thins away as you step back toward the temple. */
    const ghost = new T.Group(); ghost.position.set(7, 0.32, -HD / 2 + 9.6); ghost.rotation.y = PI / 2 + 0.12; k.add(ghost);
    const ghostMats: T.MeshBasicMaterial[] = [];
    void hero(k, 'dendur/ph_ship_pinnace', { length: 7.5 }).then((h) => { if (!h || !k.live) return; h.traverse((c) => { if (c instanceof T.Mesh) { const m = new T.MeshBasicMaterial({ color: 0x9fb4bc, transparent: true, opacity: 0, depthWrite: false, fog: false }); ghostMats.push(m); c.material = m; } }); ghost.add(h); });
    if (HAS_DOM) k.ticks.push((t) => { const cam = (window as unknown as { __museum?: { camera?: T.Camera } }).__museum?.camera; if (!cam || !ghostMats.length) return; const d = Math.hypot(cam.position.x - 7, cam.position.z - (-HD / 2 + 9.6)); const o = 0.42 * Math.max(0, Math.min(1, 1 - (d - 9) / 14)); for (const m of ghostMats) m.opacity = o; ghost.visible = o > 0.004; if (!ctx.reduced) { ghost.position.y = 0.32 + 0.04 * Math.sin(t * 0.9); ghost.position.x = 7 + 2.5 * Math.sin(t * 0.05); } });
    k.egg(v(7, 1.2, -HD / 2 + 9.6), { id: 'dendur-ghost', title: 'A boat on the Nile', text: 'Stand at the edge of the pool and a boat rides the water as a ghost, there and see through; step back toward the temple and it is gone. It works the way the stage trick called Pepper\'s ghost works, a lit figure seen in glass at an angle, first shown in London in 1862 and still used in theatres and museums.', clue: 'Walk to the edge of the pool by the glass wall and watch the water.', source: { name: 'Pepper\'s ghost, Wikipedia', url: 'https://en.wikipedia.org/wiki/Pepper%27s_ghost' } }, { r: 2 });
    // landmark eggs
    k.egg(temple, { id: 'dendur-crates', title: '661 crates', year: '1968', text: 'The temple and its gate are built of 661 sandstone blocks weighing 640 tons. They crossed the Atlantic packed in 661 crates aboard the freighter SS Concordia Star and reached New York on August 29, 1968, and the move cost $9.5 million. Rebuilding inside the Met began in July 1975 and the exhibit opened on September 27, 1978.', clue: 'Look at the blocks of the temple, each one numbered once for the voyage.', source: { name: 'Temple of Dendur, Wikipedia', url: 'https://en.wikipedia.org/wiki/Temple_of_Dendur' } });
    k.egg(reliefs[0], { id: 'dendur-graffiti', title: 'Leonardo 1820', year: '1820', text: 'The walls carry three layers of graffiti. The earliest, in colloquial Egyptian script, dates to 10 BC, Coptic Christian inscriptions date to about 400 AD when the temple was briefly a church, and nineteenth century travellers carved their names, among them Leonardo 1820.', clue: 'Read the outside walls of the temple closely at eye height.', source: { name: 'The top 10 secrets of the Temple of Dendur, Untapped New York', url: 'https://untappedcities.com/2022/11/15/secrets-temple-of-dendur-nyc-met-museum/' } }, { r: 1.6 });
    k.egg(reliefs[8], { id: 'dendur-augustus', title: 'Augustus as pharaoh', year: '15 BC', text: 'The temple was commissioned by the emperor Augustus and built by Gaius Petronius, the Roman governor of Egypt. Its reliefs show Augustus dressed as a pharaoh making offerings to Isis, Osiris and Horus, and it was dedicated to Isis and to Pedesi and Pihor, two deified sons of a Nubian chieftain.', clue: 'Find the carved panels on the far side of the temple.', source: { name: 'Temple of Dendur, Wikipedia', url: 'https://en.wikipedia.org/wiki/Temple_of_Dendur' } }, { r: 1.6 });
    k.egg(v(0, 0.6, -HD / 2 + 10), { id: 'dendur-nile', title: 'The Nile and the cliffs', year: '1978', text: 'Kevin Roche, John Dinkeloo and associates designed the wing to mimic the temple\'s setting in Egypt: the reflecting pool stands for the Nile and the sloping wall for the cliffs of its old site. The glass of the ceiling is stippled to diffuse the light the way it falls in Egypt, and the hall is lined with granite rather than sandstone, for durability.', clue: 'Stand at the edge of the pool by the glass.', source: { name: 'The top 10 secrets of the Temple of Dendur, Untapped New York', url: 'https://untappedcities.com/2022/11/15/secrets-temple-of-dendur-nyc-met-museum/' } }, { r: 2.2 });
    k.egg(v(-6, 3, PZ + 14), { id: 'dendur-derby', title: 'The Dendur Derby', year: '1967', text: 'Egypt gave the temple to the United States in 1965, and the scramble to host it was called the Dendur Derby. Cairo, Illinois and Memphis, Tennessee bid and lost, and plans for the Smithsonian and the Museum of Fine Arts in Boston were dropped over fears the sandstone would deteriorate. President Johnson awarded it to the Met in 1967.', clue: 'Stand at the foot of the platform steps, where the bidders would have stood.', source: { name: 'The top 10 secrets of the Temple of Dendur, Untapped New York', url: 'https://untappedcities.com/2022/11/15/secrets-temple-of-dendur-nyc-met-museum/' } }, { r: 1.8 });
    k.egg(v(PX, 7, PZ + 6), { id: 'dendur-1994', title: 'Thirty feet back', year: '1994', text: 'Until 1994 visitors could only look at the temple from a distance, and guests at private parties were kept at least 30 feet from the entrance. Conservators cleaned grease and grime from the blocks in 2017, and the whole temple can be seen from above in the Japanese art reading room, Gallery 232, on the second floor.', clue: 'Look up at the gateway in front of the temple.', source: { name: 'The top 10 secrets of the Temple of Dendur, Untapped New York', url: 'https://untappedcities.com/2022/11/15/secrets-temple-of-dendur-nyc-met-museum/' } }, { r: 1.8 });
    return { mounts, spawn: v(-10, 3, HD / 2 - 6), look: v(PX, 6, PZ - 10), eye: 3, bounds: [-HW / 2 + 2, HW / 2 - 2, -HD / 2 + 3, HD / 2 - 1], style: 'steel', floorY: (x, z) => (Math.abs(x - PX) < 15 && z > PZ - 11 && z < PZ + 11 ? 1.45 : Math.abs(x - PX) < 15 && z >= PZ + 11 && z < PZ + 14.5 ? Math.max(0, 1.45 - ((z - PZ - 11) / 3.5) * 1.45) : 0) };
  },
};

/* ---------------- 75 THE SCULPTURE GARDEN ---------------- */
export const moma: RoomDef = {
  id: 'moma',
  name: 'The garden on 54th',
  area: 'THE SCULPTURE GARDEN',
  mood: 'First warm Friday',
  color: '#8ab0a8',
  description: 'The marble court between the towers: two long pools, the birches and the weeping beech, the bronze figures on their plinths, the glass galleries looking in, the works on the garden walls.',
  signatures: 'The sunken marble court with two rectangular pools crossed by narrow bridges, groves of birches and a weeping beech, bronzes on low plinths, the tall aluminium screen to the street, the glass curtain walls of the galleries above.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad8, horizon: 0xeef0ec, ground: 0x6a6a66, fog: 0.002, sun: { az: 3.4, el: 0.8, color: 0xfff6e8, size: 12 }, env: 1.0 });
    k.hemi(0xf2f6ff, 0x5a5a58, 0.95);
    k.sun(0xfff2dc, 2.4, 20, 80, 20, true, 80);
    /* 2026-10-28: the marble tint was 0xd8d4cc and under the noon sun the floor read as snow; now about 0.65 albedo */
    /* 2026-11-24 (wave 4c): the court's Georgia marble and the granite are Poly Haven scans (CC0), still about 0.65 albedo */
    const marble = sc(k, 'moma', 'marble_01', 2.2, () => X.marble(0xa8a49c, 0x77736a, 15), { color: 0xb8b4ac, roughness: 0.3 }, 0x8a8680),
      granite = sc(k, 'moma', 'granite_wall', 3, () => X.ashlar(0x6a6a66, 220, 3), { color: 0x8a8884, roughness: 0.7 }, 0x5a5a58),
      water = k.flat(0x1e3a44, 0.2, 0.1, { transparent: true, opacity: 0.85 }),
      glass = k.glass(0xdcecf6, 0.14, 0.04),
      steel = k.flat(0x8c98a4, 0.9, 0.3),
      bronze = k.flat(0x3a3028, 0.7, 0.45),
      white = k.flat(0xd8d4cc, 0.05, 0.6),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      pave = k.pbr('mmPave', X.terrazzo(0xc8c4bc, 103), 0.5, { roughness: 0.3 }),
      birchBark = k.flat(0xe8e4dc, 0, 0.9), birchLeaf = k.flat(0x8ab04a, 0, 0.9);
    // 54th Street and the granite wall, the museum's glass flanks, the towers over it
    const GW = 60, GD = 34, GZ = 8;
    /* 2026-10-28: 54th Street was laid with street(), which only runs along z, so a road with its double yellow line
       ran north to south straight through the sunken garden and buried the plinths. It now runs east to west, north
       of the garden's screen: a pavement, the roadway and the far pavement. */
    { const asph = k.pbr('asphaltS', X.asphalt(0x24282d), 0.11, { roughness: 0.62, metalness: 0.12 }), pav = k.pbr('sidewalkS', X.pavers(0x8e8b84, 5), 0.42), yl = k.flat(0xe6a626, 0, 0.6);
      k.box(140, 0.28, 5, 0, 0, GZ + 3, pav); k.box(140, 0.3, 20, 0, -0.15, GZ + 15.5, asph); k.box(140, 0.28, 5, 0, 0, GZ + 28, pav);
      for (const dz of [-0.14, 0.14]) k.box(134, 0.012, 0.09, 0, 0.01, GZ + 15.5 + dz, yl); }
    blockFront(k, { x: -46, z0: 90, count: 10, face: 1, seed: 221, h: [18, 40] });
    // the north edge on 54th Street: since 2004 a 14 foot aluminium screen, before that an 18 foot grey brick wall with ivy
    k.box(GW + 8, 4.6, 0.8, 0, 2.3, GZ, k.flat(0xb8bec4, 0.85, 0.35));
    k.block(-GW / 2 - 4, -2.4, GZ - 0.6, GZ + 0.6); k.block(2.4, GW / 2 + 4, GZ - 0.6, GZ + 0.6);
    k.box(4, 3.4, 0.2, 0, 1.7, GZ, steel); k.box(3.2, 3.0, 0.05, 0, 1.7, GZ, glass);
    k.box(GW, 0.3, GD, 0, -0.85, GZ - GD / 2, marble);
    for (let i = 0; i < 4; i++) k.box(8, 0.3, 1.2, 0, -0.15 - i * 0.25, GZ - 1.2 - i * 1.2, marble);
    for (const s of [-1, 1]) { k.box(0.6, 30, GD, s * (GW / 2 + 0.3), 14, GZ - GD / 2, glass); for (let z = GZ; z > GZ - GD; z -= 4) k.box(0.4, 30, 0.4, s * (GW / 2 + 0.3), 14, z, steel); for (let y = 4; y < 30; y += 4.5) k.box(0.4, 0.4, GD, s * (GW / 2 + 0.3), y, GZ - GD / 2, steel); k.block(s * GW / 2 - 0.4, s * GW / 2 + 1, GZ - GD, GZ); for (let y = 2.5; y < 28; y += 4.5) for (let z = GZ - 3; z > GZ - GD; z -= 6) k.point(s * (GW / 2 - 2), y, z, 0xfff0e0, 6, 6); }
    k.box(GW + 2, 20, 0.8, 0, 10, GZ - GD, glass); for (let x = -GW / 2; x <= GW / 2; x += 4) k.box(0.4, 20, 0.4, x, 10, GZ - GD, steel);
    k.block(-GW / 2, GW / 2, GZ - GD - 0.6, GZ - GD + 0.6);
    for (const [x, z, w, h] of [[-50, -60, 30, 120], [40, -70, 34, 160], [0, -90, 40, 200]]) k.box(w as number, h as number, w as number, x as number, (h as number) / 2, z as number, k.pbr('mmTower', X.windows(222, 0.25, 0x6a7a8a, false), 0.11, { emissive: 0xffffff, emissiveIntensity: 0.4, roughness: 0.3, metalness: 0.6, stretch: 0.42 }));
    // the pools with their bridges, the trees, the bronzes on plinths, the benches
    const Y = -0.85;
    for (const [x, len] of [[-12, 29], [17, 15]]) { k.box(len as number, 0.2, 5, x as number, Y + 0.05, GZ - GD / 2 + 2, k.flat(0x141416, 0.1, 0.4)); k.water({ y: Y + 0.2, color: 0x1c323c, w: (len as number) - 0.6, d: 4.4, x: x as number, z: GZ - GD / 2 + 2, amp: 0.03 }); void water; k.block((x as number) - (len as number) / 2, (x as number) + (len as number) / 2, GZ - GD / 2 - 0.5, GZ - GD / 2 + 4.5); }
    for (const x of [-20, -6, 17]) { k.box(1.6, 0.14, 5.2, x, Y + 0.32, GZ - GD / 2 + 2, marble); k.keepOut.splice(0, 0); }
    k.block(-26.5, -21, GZ - GD / 2 - 0.5, GZ - GD / 2 + 4.5); k.block(-19, -7, GZ - GD / 2 - 0.5, GZ - GD / 2 + 4.5); k.block(-5, 2.5, GZ - GD / 2 - 0.5, GZ - GD / 2 + 4.5); k.block(9.5, 16, GZ - GD / 2 - 0.5, GZ - GD / 2 + 4.5); k.block(18, 24.5, GZ - GD / 2 - 0.5, GZ - GD / 2 + 4.5);
    const rnd = X.mulberry(75);
    /* 2026-10-28: the birch grove was code: a white stick and four green spheres each, the blob trees in the shots. It is
       now the tree kit (instanced photo trees; no birch in the kit, so the fine leaved honey locust), same places;
       the old calls to rnd() are kept so everything seeded after it lands where it did. */
    for (let i = 0; i < 14; i++) { const x = -26 + rnd() * 52, z = GZ - GD + 3 + rnd() * 8, h = 6 + rnd() * 3; for (let j = 0; j < 4; j++) { rnd(); rnd(); rnd(); rnd(); } k.tree(x, Y, z, { species: 'locust', h: h * 0.75, r: 1.6, seed: 75 + i }); k.keepOut.push({ x, z, r: 0.4 }); }
    void birchBark; void birchLeaf;
    k.tree(-22, Y, GZ - 8, { kind: 'round', h: 6, r: 5, leaf: 0x5a3a4a, seed: 9 });
    const plinths: [number, number][] = [[-4, GZ - 8], [8, GZ - 8], [0, GZ - 24], [24, GZ - 12], [-26, GZ - 22]];
    /* 2026-10-28: the torus knots and box figures on the plinths are the stand ins for the kit's own sculpture props, a
       bronze figure, two Noguchi stones and the equestrian; hidden when each loads. */
    /* 2026-11-24 (wave 4c): the plinths carry real models now, no code sculpture: two of MLow's Blossom icons cast in bronze
       (his own marks, from the brand kit), a scanned basalt (Poly Haven moon_rock_01, CC0) standing for a carved stone, a
       bronze horse and a bronze whale (Poly Haven, CC0). No real artist's work is reproduced. */
    const garden: [string, number][] = [['blossom_03', 2.2], ['moma/ph_moon_rock_01', 1.1], ['moma/ph_horse_statue_01', 1.9], ['blossom_06', 2.0], ['moma/ph_bronze_whale_statue', 1.3]];
    const labels = ['MLOW  BLOSSOM III  2026  BRONZE', 'UNTITLED STONE  BASALT', 'HORSE  CAST BRONZE', 'MLOW  BLOSSOM VI  2026  BRONZE', 'WHALE  CAST BRONZE'];
    plinths.forEach(([x, z], i) => { k.box(1.6, 0.5, 1.6, x, Y + 0.25, z, white); hsign(k, labels[i], 1.5, 0.12, x, Y + 0.34, z + 0.81, 0, { fg: '#2a2a2a', font: 'W2 Archivo Expanded', size: 0.62, lit: false }); const sm = k.objects.length; if (i % 2) { k.mesh(new T.TorusKnotGeometry(0.5, 0.16, 64, 10), bronze, x, Y + 1.4, z); } else { k.box(0.5, 1.7, 0.4, x, Y + 1.35, z, bronze); k.sphere(0.22, x, Y + 2.4, z, bronze, 10); k.box(0.16, 0.9, 0.16, x + 0.4, Y + 1.4, z, bronze).rotation.z = -0.6; } k.keepOut.push({ x, z, r: 1.3 }); const old = standIn(k, sm); void Promise.resolve(k.prop(garden[i][0], x, Y + 0.5, z, { height: garden[i][1], rotY: [0.4, 0, PI / 2, 1.2, 2.2][i] })).then((o) => { if (!o) return; hide(old); if (garden[i][0].startsWith('blossom')) tint(o, 0x5a3e24, 0.32, 0.9); else if (i === 2) tint(o, 0x4a3a2a, 0.38, 0.85); }); });
    for (const x of [-10, 4, 18]) k.bench(x, GZ - 3, 0, k.pbr('mmBench', X.planks(0x4a4a48, 3, 223), 1.2), steel, 2.4);
    k.crowd([v(-24, Y, GZ - 4), v(-4, Y, GZ - 12), v(10, Y, GZ - 26), v(26, Y, GZ - 6)], 20, { seed: 87, speed: 0.4, spread: 2, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a, 0x33477f] });
    k.censusWall({ x: 0, y: 2.0, z: GZ - 0.42, rotY: PI, cols: 40, rows: 3, tile: 0.55, gap: 0.05, start: ctx.wallStart(5300, 120), pieces: ctx.all, backing: granite });
    // the works: the granite street wall, the glass flanks at garden level, the far glass wall
    const mounts: Mount[] = [];
    for (let i = 0; i < 5; i++) { const x = -24 + i * 12; if (Math.abs(x) < 3) continue; mounts.push({ position: v(x, Y + 3.0, GZ - 0.42), rotation: PI, target: v(x, Y + 2, GZ - 8), width: 4.2, height: 2.5, style: 'white', wash: true }); }
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = GZ - 5 - i * 8; k.box(0.2, 3.2, 4.4, s * (GW / 2 - 0.6), Y + 2.0, z, white); mounts.push({ position: v(s * (GW / 2 - 0.72), Y + 2.1, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * (GW / 2 - 8), Y + 2, z > -9.6 && z < -4.4 ? -3.9 : z) /* wave 4c: this spot stood in a pool */, width: 4.0, height: 2.4, style: 'white', wash: true }); }
    for (let i = 0; i < 6; i++) { const x = -25 + i * 10; k.box(4.4, 3.2, 0.2, x, Y + 2.0, GZ - GD + 0.6, white); mounts.push({ position: v(x, Y + 2.1, GZ - GD + 0.72), rotation: 0, target: v(x, Y + 2, GZ - GD + 8), width: 4.0, height: 2.4, style: 'white', wash: true }); }
    /* ---- THE BIG UPGRADE, wave 4c (2026-11-24) ----
       The illusion (ON LOCATION rule 9): an invented sculpture by MLow, ONLY FROM HERE, three weathering steel beams that
       meet at right angles and never close. From one bronze disc set in the marble they line up into an impossible
       triangle; take a step and the corner opens. It is the trick of the Penrose triangle built in the round: the three
       beams run along three perpendicular axes, and the line from the first corner to the last points straight at the disc. */
    { const L = 1.5, th = 0.24, ex = 4, ez = GZ - 20, eye = Y + 3, P0 = v(10, Y + 1.75, GZ - 25.5);
      const u = v(ex, eye, ez).sub(P0).normalize(), q0 = new T.Quaternion().setFromUnitVectors(v(1, 1, 1).normalize(), u);
      let best = 0, bestMin = -9;
      for (let f = 0; f < 63; f++) { const q = new T.Quaternion().setFromAxisAngle(u, f * 0.1).multiply(q0); const a = v(1, 0, 0).applyQuaternion(q), b = v(0, 1, 0).applyQuaternion(q); const mn = Math.min(a.y, a.y + b.y); if (mn > bestMin) { bestMin = mn; best = f * 0.1; } }
      const q = new T.Quaternion().setFromAxisAngle(u, best).multiply(q0), sculpt = new T.Group(); sculpt.position.copy(P0); sculpt.quaternion.copy(q);
      const corten = k.flat(0x7a4026, 0.35, 0.7);
      for (const [w, h, d, x, y, z] of [[L + th, th, th, L / 2, 0, 0], [th, L + th, th, L, L / 2, 0], [th, th, L + th, L, L, L / 2]]) { const b = new T.Mesh(new T.BoxGeometry(w, h, d), corten); b.position.set(x, y, z); b.castShadow = true; sculpt.add(b); }
      k.add(sculpt); sculpt.updateMatrixWorld(true);
      const bb = new T.Box3().setFromObject(sculpt), top = bb.min.y;
      k.box(1.3, top - Y, 1.3, P0.x, (top + Y) / 2, P0.z, white); k.keepOut.push({ x: P0.x, z: P0.z, r: 1.4 }); k.keepOut.push({ x: (bb.min.x + bb.max.x) / 2, z: (bb.min.z + bb.max.z) / 2, r: 1.3 });
      hsign(k, 'MLOW  ONLY FROM HERE  2026  WEATHERING STEEL', 1.25, 0.1, P0.x + Math.sign(u.x) * 0.66, Y + 0.32, P0.z, Math.sign(u.x) * PI / 2, { fg: '#2a2a2a', font: 'W2 Archivo Expanded', size: 0.6, lit: false });
      const disc = k.mesh(new T.CircleGeometry(0.32, 28), k.flat(0x8a6a3a, 0.85, 0.35), ex, Y + 0.012, ez); disc.rotation.x = -PI / 2;
      const dt = k.sign('STAND HERE', 0.5, 0.1, ex, Y + 0.016, ez + 0.02, 'transparent', '#2a2418', 60, 0); dt.rotation.set(-PI / 2, 0, Math.atan2(P0.x - ex, -(P0.z - ez)));
      k.egg(sculpt, { id: 'moma-impossible', title: 'Only from here', text: 'Three steel beams meet at right angles and never close, yet from the bronze disc in the marble they make a closed triangle whose every corner is a right angle, which no solid can be. It is the Penrose triangle, drawn by the mathematician Roger Penrose and his father Lionel in 1958 after a design by Oscar Reutersvard, here built in the round the way the Impossible Triangle sculpture in Perth was in 1999: it closes from one spot only.', clue: 'Find the bronze disc in the marble and look at the rusted steel from there; then take one step.', source: { name: 'Penrose triangle, Wikipedia', url: 'https://en.wikipedia.org/wiki/Penrose_triangle' } }, { r: 2 }); }
    /* the galleries behind the glass flanks: white rooms you can see into, MLow's own canvases painted on their walls by
       Firefly when the queue runs (FIREFLY_QUEUE.md, moma ff_gallery_*.webp); a pale wall until then */
    for (const s of [-1, 1]) for (let fl = 0; fl < 3; fl++) fireflyPlate(k, `assets/museum/tex/moma/ff_gallery_${fl + 1}.webp`, GD - 2, 4, s * (GW / 2 + 3.2), 2.2 + fl * 4.5, GZ - GD / 2, s < 0 ? PI / 2 : -PI / 2, k.flat(0xe4e2dc, 0, 0.9));
    for (const s of [-1, 1]) for (let fl = 0; fl < 3; fl++) k.box(3, 0.2, GD, s * (GW / 2 + 1.8), 0.1 + fl * 4.5, GZ - GD / 2, k.flat(0x8a7a62, 0, 0.6));
    hsign(k, 'THE ABBY ALDRICH ROCKEFELLER SCULPTURE GARDEN', 9, 0.34, 0, 4.0, GZ - 0.42, PI, { fg: '#1a1c20', font: 'W2 Archivo Expanded', size: 0.62, lit: false });
    hsign(k, 'WEST 54TH STREET', 3.2, 0.5, -20, 3.4, GZ + 0.42, 0, { fg: '#f4f0e8', bg: '#1f6b3a', border: '#f4f0e8', font: 'W2 Archivo Narrow', size: 0.62, lit: false });
    // landmark eggs
    k.egg(v(14, 2.6, GZ - 0.6), { id: 'moma-screen', title: 'The wall that was brick', year: '2004', text: 'Philip Johnson\'s garden was screened from West 54th Street by an 18 foot grey brick wall grown with climbing ivy. When the garden was recreated after the museum\'s 2000 to 2004 expansion, the wall was replaced by a 14 foot aluminium screen.', clue: 'Turn back to the street side and look at the tall screen.', source: { name: 'Abby Aldrich Rockefeller Sculpture Garden, The Cultural Landscape Foundation', url: 'https://www.tclf.org/landscapes/abby-aldrich-rockefeller-sculpture-garden' } }, { r: 1.8 });
    k.egg(v(-6, Y + 0.6, GZ - GD / 2 + 2), { id: 'moma-marble', title: 'Vermont, then Georgia', year: '1953', text: 'Johnson and James Fanning paved the 1953 garden in long rectilinear slabs of Vermont marble, with two water channels spanned by marble platforms and the lower terrace sunk two feet below grade. The restoration kept his plan but used a lighter Georgia marble.', clue: 'Step onto the marble platform that crosses the long pool.', source: { name: 'Abby Aldrich Rockefeller Sculpture Garden, The Cultural Landscape Foundation', url: 'https://www.tclf.org/landscapes/abby-aldrich-rockefeller-sculpture-garden' } }, { r: 1.6 });
    k.egg(v(-22, Y + 3.5, GZ - 8), { id: 'moma-beech', title: 'Beeches for cryptomerias', year: '1964', text: 'The first lower terrace was planted with cryptomeria and birch. When the garden was enlarged to the east in 1964, the landscape architects Zion and Breen unified the planting by replacing the cryptomerias with weeping beeches and adding weeping birches.', clue: 'Find the low dark crowned tree near the street wall.', source: { name: 'Abby Aldrich Rockefeller Sculpture Garden, The Cultural Landscape Foundation', url: 'https://www.tclf.org/landscapes/abby-aldrich-rockefeller-sculpture-garden' } }, { r: 2.2 });
    k.egg(v(-26, Y + 2, GZ - 3), { id: 'moma-hornbeams', title: 'The dining terrace', year: '1953', text: 'The garden is about half an acre on two levels and is approached from the west. Its western upper platform was a dining terrace shaded by eight hornbeams.', clue: 'Walk to the west end of the court.', source: { name: 'Abby Aldrich Rockefeller Sculpture Garden, The Cultural Landscape Foundation', url: 'https://www.tclf.org/landscapes/abby-aldrich-rockefeller-sculpture-garden' } }, { r: 1.8 });
    k.egg(v(0, Y + 1.4, GZ - 16), { id: 'moma-tinguely', title: 'The machine that destroyed itself', year: '1960', text: 'On March 17, 1960, Jean Tinguely\'s Homage to New York gave its first and only performance in this garden: a machine of bicycle wheels, a weather balloon, a piano, a bassinet and a toilet, all painted white, built to destroy itself. Many of its parts came from junk shops and garbage dumps in New Jersey and New York.', clue: 'Stand in the open middle of the court between the plinths.', source: { name: 'Homage to New York, Wikipedia', url: 'https://en.wikipedia.org/wiki/Homage_to_New_York' } }, { r: 2 });
    k.egg(v(0, Y + 1.4, GZ - 24), { id: 'moma-1953', title: 'Built with the West Wing', year: '1953', text: 'The garden was conceived at the same time as Johnson\'s West Wing annex for the museum. Work began in spring 1952 and was finished in April 1953, and it has held loans as varied as Calder\'s Black Widow, Caro\'s Midday and Picasso\'s She Goat.', clue: 'Find the plinth deepest in the garden, by the glass.', source: { name: 'Abby Aldrich Rockefeller Sculpture Garden, Wikipedia', url: 'https://en.wikipedia.org/wiki/Abby_Aldrich_Rockefeller_Sculpture_Garden' } }, { r: 1.6 });
    return { mounts, spawn: v(0, 3, GZ - 1.2), look: v(3, 0, GZ - 30), eye: 3, bounds: [-GW / 2 + 1, GW / 2 - 1, GZ - GD + 1.2, GZ + 30], style: 'white', floorY: (x, z) => { void x; if (z < GZ - 0.6 && z > GZ - 5.4) return Math.max(Y, -((GZ - 0.6 - z) / 4.8) * 0.85); if (z <= GZ - 5.4) return Y; return 0; } };
  },
};

/* ---------------- 76 THE WHITNEY ---------------- */
export const whitney: RoomDef = {
  id: 'whitney',
  name: 'The terraces over the High Line',
  area: 'THE WHITNEY',
  mood: 'Blue afternoon on the river',
  color: '#a8c0d0',
  description: 'Gansevoort Street where the High Line ends: the stepped museum, its outdoor stairs and terraces climbing the east face, the largest column free gallery inside, the river and the works on both.',
  signatures: 'The asymmetric stack of steel and glass with cantilevered terraces stepping down toward the High Line, the outside steel stairs between them, the vast open gallery with its sawtooth skylights, the Hudson and the piers to the west, the cobbled meatpacking streets.',
  build(k, ctx) {
    /* wave 4c: the room was one white glare (a pale horizon, a full env and white glass boxes); a deeper sky and less fill */
    k.sky({ top: 0x3f78c8, horizon: 0xc8d6e2, ground: 0x5a5a58, fog: 0.0014, sun: { az: 4.2, el: 0.5, color: 0xfff4e6, size: 12 }, haze: 0.2, env: 0.8 });
    k.hemi(0xe4eeff, 0x4a4a48, 0.75);
    k.sun(0xfff0dc, 2.4, -60, 60, 30, true, 100);
    /* 2026-11-24 (wave 4c): the building is clad in pale blue grey steel, not white glass; the terraces are concrete pavers,
       the galleries reclaimed pine, Gansevoort is Belgian block. All Poly Haven scans (CC0) */
    const steel = sc(k, 'whitney', 'metal_plate', 2.4, () => X.steel(0xb8bcc0, false, 224), { color: 0x8e989f, metalness: 0.2, roughness: 0.55 }, 0x6a747c),
      steelD = k.flat(0x3c4146, 0.45, 0.6),
      glass = k.glass(0x9ab4c4, 0.32, 0.05),
      deck = sc(k, 'whitney', 'concrete_pavers', 2.2, () => X.boardwalk(0x9a8a70), { color: 0xc8c4bc, roughness: 0.8 }, 0x8a8782),
      floorG = sc(k, 'whitney', 'wood_floor', 1.4, () => X.planks(0xb8a888, 8, 226, 0.1), { color: 0xf0d8b0, roughness: 0.45 }, 0x9a8462),
      cobble = sc(k, 'whitney', 'square_cobblestone', 2, () => X.cobble(0x6f6c68, 104), { color: 0xa8a49c, roughness: 0.9 }, 0x5a5856),
      white = k.flat(0xeceae4, 0.05, 0.7),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      rail = k.flat(0x8c98a4, 0.9, 0.3);
    // the cobbled street, the river and the piers to the west, the High Line arriving from the north
    k.box(200, 0.4, 200, 0, -0.2, 0, cobble);
    k.water({ y: -1.4, color: 0x2e4a5c, w: 500, d: 500, x: -220, z: 0, amp: 1.0 });
    k.box(24, 1, 90, -80, -0.5, -20, k.pbr('whPier', X.concrete(0x8a8a84, 105), 0.3));
    for (const z of [-60, 10]) { k.box(14, 8, 30, -80, 4, z, k.pbr('whShed', X.steel(0x9a9e9a, true, 227), 0.6)); k.mesh(new T.CylinderGeometry(7, 7, 30, 16, 1, false, 0, PI), k.pbr('whShed', X.steel(0x9a9e9a, true, 227), 0.6), -80, 8, z).rotation.set(PI / 2, 0, PI / 2); }
    blockFront(k, { x: 40, z0: 100, count: 8, face: -1, seed: 228, h: [10, 18] });
    blockFront(k, { x: 40, z0: -20, count: 6, face: -1, seed: 229, h: [10, 16] });
    k.skyline({ z: -260, count: 26, spacing: 10, scale: 3.2, base: -1, seed: 230, lit: 0.25, glow: 0.5, tint: 0x6e7684, rows: 1, spires: true });
    const HY = 8;
    for (let z = 40; z <= 140; z += 12) for (const x of [10, 20]) k.box(0.9, HY, 0.9, x, HY / 2, z, steelD);
    k.box(12, 0.8, 110, 15, HY, 90, steelD); k.box(6, 0.2, 110, 15, HY + 0.5, 90, deck);
    for (let z = 40; z <= 140; z += 6) k.box(0.06, 1.2, 0.06, 12.4, HY + 1.1, z, rail), k.box(0.06, 1.2, 0.06, 17.6, HY + 1.1, z, rail);
    // the museum: a stack of blocks stepping back from the High Line, terraces on each step, the outdoor stairs
    const MX = -20, MZ = 0;
    const blocks: [number, number, number, number][] = [[46, 12, 46, 0], [40, 10, 40, 12], [34, 10, 32, 22], [28, 10, 26, 32]];
    blocks.forEach(([w, h, d, y], i) => { k.box(w, h, d, MX - (46 - w) / 2, y + h / 2, MZ, i ? steel : glass); for (let yy = y + 2; yy < y + h; yy += 3.4) k.box(w + 0.1, 0.24, d + 0.1, MX - (46 - w) / 2, yy, MZ, steelD); for (let xx = -w / 2; xx <= w / 2; xx += 4) k.box(0.24, h, 0.24, MX - (46 - w) / 2 + xx, y + h / 2, MZ + d / 2 + 0.05, steelD); });
    const terraces: [number, number, number, number][] = [];
    for (let i = 1; i < blocks.length; i++) { const [w, , d, y] = blocks[i]; const [pw] = blocks[i - 1]; const tx = MX - (46 - pw) / 2 + pw / 2 - (pw - w) / 4 + (pw - w) / 4; const tw = (pw - w) / 1 + 0; void tx; void tw; const ex = MX + pw / 2 - (46 - pw) / 2; terraces.push([ex - (pw - w) / 2, y, (pw - w), d]); k.box(pw - w, 0.3, d, ex - (pw - w) / 2, y + 0.15, MZ, deck); k.rail(ex - 0.2, MZ, d, rail, 1.05, 'z', 2); k.rail(ex - (pw - w) / 2, MZ + d / 2 - 0.2, pw - w, rail, 1.05, 'x', 2); k.rail(ex - (pw - w) / 2, MZ - d / 2 + 0.2, pw - w, rail, 1.05, 'x', 2); }
    for (let i = 0; i < 3; i++) { const [x0, y0, w0] = terraces[i]; const y1 = i + 1 < terraces.length ? terraces[i + 1][1] : y0 + 10; const sx = x0 - w0 / 2 + 1.2; for (let s = 0; s < 20; s++) k.box(1.8, 0.25, 0.8, sx, y0 + 0.5 + s * ((y1 - y0) / 20), MZ - blocks[i + 1][2] / 2 + 2 + s * 1.0, steelD); k.rail(sx - 1.0, MZ - blocks[i + 1][2] / 2 + 12, 20, rail, 1.0, 'z', 2.5); }
    for (let s = 0; s < 24; s++) k.box(3, 0.5, 1.2, MX + 23 + 2, 0.25 + s * 0.5, MZ + 23 - s * 1.0 - 0, steelD);
    k.block(MX - 23, MX + 23, MZ - 23, MZ - 22); k.block(MX - 23, MX - 22, MZ - 23, MZ + 23); k.block(MX - 23, MX + 23, MZ + 22, MZ + 23);
    k.sign('THE WHITNEY  ·  GANSEVOORT', 8, 0.7, MX, 11, MZ + 23.1, 'transparent', '#1a1c20', 70, 0);
    // the big gallery inside the ground block: sawtooth skylights, the works on white walls
    const GW = 44, GD = 44, GH = 11;
    k.box(GW, 0.3, GD, MX, 0.15, MZ, floorG);
    for (const s of [-1, 1]) k.box(0.6, GH, GD, MX + s * GW / 2, GH / 2, MZ, white);
    k.box(GW, GH, 0.6, MX, GH / 2, MZ - GD / 2, white);
    k.box(GW, GH, 0.6, MX, GH / 2, MZ + GD / 2, white);
    k.block(MX - GW / 2, MX + 3, MZ + GD / 2 - 0.6, MZ + GD / 2 + 0.6); k.block(MX + 7, MX + GW / 2, MZ + GD / 2 - 0.6, MZ + GD / 2 + 0.6);
    for (let x = MX - GW / 2; x < MX + GW / 2; x += 6) { const saw = k.box(6, 0.3, GD, x + 3, GH + 1.5, MZ, white); saw.rotation.z = 0.35; k.box(0.1, 3.6, GD, x + 6, GH + 1.8, MZ, glass); }
    for (let x = MX - 16; x <= MX + 16; x += 8) for (let z = MZ - 14; z <= MZ + 14; z += 14) k.point(x, GH - 1, z, 0xfff4ec, 22, 14);
    for (let i = 0; i < 3; i++) { k.box(0.6, 6, 10, MX - 12 + i * 12, 3, MZ - 6 + (i % 2) * 8, white); k.block(MX - 12.4 + i * 12, MX - 11.6 + i * 12, MZ - 11 + (i % 2) * 8, MZ - 1 + (i % 2) * 8); }
    k.censusWall({ x: MX, y: 4.6, z: MZ - GD / 2 + 0.34, rotY: 0, cols: 40, rows: 6, tile: 0.55, gap: 0.05, start: ctx.wallStart(5900, 240), pieces: ctx.all, backing: dark });
    k.crowd([v(MX - 18, 0, MZ + 18), v(MX - 6, 0, MZ - 10), v(MX + 8, 0, MZ + 6), v(MX + 18, 0, MZ - 14)], 18, { seed: 88, speed: 0.4, spread: 2, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a] });
    k.crowd([v(15, HY + 0.6, 140), v(15, HY + 0.6, 42)], 16, { seed: 89, speed: 0.8, spread: 2.4, animate: !ctx.reduced });
    // the works: the gallery's free standing walls and long walls, the terraces' glass screens facing the river
    const mounts: Mount[] = [];
    for (let i = 0; i < 3; i++) { const x = MX - 12 + i * 12, z = MZ - 6 + (i % 2) * 8; for (const s of [-1, 1]) mounts.push({ position: v(x + s * 0.34, 3.2, z), rotation: s < 0 ? -PI / 2 : PI / 2, target: v(x + s * 6, 3, z), width: 4.6, height: 2.7, style: 'white', wash: true }); }
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = MZ - 14 + i * 14; mounts.push({ position: v(MX + s * (GW / 2 - 0.34), 3.4, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(MX + s * (GW / 2 - 8), 3, z), width: 5.2, height: 3.0, style: 'white', wash: true }); }
    for (let i = 0; i < 3; i++) { const x = MX - 14 + i * 14; if (i === 1) continue; mounts.push({ position: v(x, 3.4, MZ + GD / 2 - 0.34), rotation: PI, target: v(x, 3, MZ + 8), width: 5.2, height: 3.0, style: 'white', wash: true }); }
    terraces.forEach(([x0, y, w0, d], i) => { for (let j = 0; j < 2; j++) { const z = MZ - d / 4 + j * (d / 2); const px = x0 + w0 / 2 - 0.8; k.box(0.12, 2.4, 3.4, px, y + 1.6, z, white); mounts.push({ position: v(px - 0.1, y + 1.7, z), rotation: -PI / 2, target: v(x0 - 4, y + 2, z), width: 3.0, height: 1.8, style: 'white', wash: false }); } void i; });
    const tY = (x: number, z: number) => { for (const [x0, y, w0, d] of terraces) if (Math.abs(x - x0) < w0 / 2 && Math.abs(z - MZ) < d / 2) return y + 0.3; return -1; };
    /* ---- THE BIG UPGRADE, wave 4c (2026-11-24) ----
       The stack read as white glass boxes in a white sky. Now the floors above the lobby are steel with long window bands
       to the river and the High Line, the terraces are furnished (Poly Haven cafe sets and planters, CC0) and carry an
       outdoor show of MLow's Blossom icons in bronze, the largo has its benches, the big gallery has its title wall and
       benches, a mural wall across the street waits for its Firefly plate, and the gallery floor carries the room's trick. */
    /* the gallery's outer faces read as a white box through the lobby glass: they wear the steel skin outside */
    for (const s of [-1, 1]) k.box(0.08, 11.6, 45, MX + s * 22.36, 5.8, MZ, steel);
    k.box(45, 11.6, 0.08, MX, 5.8, MZ - 22.36, steel); k.box(21, 11.6, 0.08, MX - 11.5, 5.8, MZ + 22.36, steel); k.box(13, 11.6, 0.08, MX + 15.5, 5.8, MZ + 22.36, steel); k.box(4.2, 7.4, 0.08, MX + 5, 7.9, MZ + 22.36, steel);
    blocks.forEach(([w, h, d, y], i) => { if (!i) return; const cx = MX - (46 - w) / 2; for (let yy = y + 1.4; yy < y + h - 1; yy += 3.4) { k.box(0.12, 1.5, d * 0.86, cx + w / 2 + 0.08, yy + 0.8, MZ, glass); k.box(0.12, 1.5, d * 0.86, cx - w / 2 - 0.08, yy + 0.8, MZ, glass); k.box(w * 0.8, 1.5, 0.12, cx, yy + 0.8, MZ + d / 2 + 0.08, glass); } });
    k.box(48, 1.2, 12, MX + 6, 12.6, MZ + 28, steelD); k.box(46, 0.12, 0.3, MX + 6, 12.0, MZ + 33.9, k.flat(0xfff2dc, 0, 0.5, { emissive: 0xfff2dc, emissiveIntensity: 0.6 }));
    hsign(k, 'WHITNEY MUSEUM OF AMERICAN ART', 14, 0.9, MX + 4, 2.9, MZ + 23.42, 0, { fg: '#1a1c20', font: 'W2 Archivo Expanded', size: 0.6, lit: false });
    many(k, 'whitney/ph_modular_street_seating', { width: 4.3 }, [[MX - 8, 0.02, MZ + 30, 0], [MX + 14, 0.02, MZ + 32, 0.1], [MX + 2, 0.02, MZ + 36, -0.05]]);
    for (const [x, z] of [[MX - 8, MZ + 30], [MX + 14, MZ + 32], [MX + 2, MZ + 36]]) k.keepOut.push({ x, z, r: 1.6 });
    terraces.forEach(([x0, y, w0, d], i) => {
      /* the planter is 8,094 triangles: one to a terrace, at the river end */
      many(k, 'whitney/ph_planter_box_01', { width: 1.8 }, [[x0 + w0 / 2 - 0.7, y + 0.3, MZ - d / 2 + 1.4, PI / 2]]);
      if (i === 0) { many(k, 'whitney/ph_outdoor_table_chair_set_01', { length: 1.8 }, [[x0 - 1.5, y + 0.3, MZ + d / 2 - 2.6, 0.3], [x0 + 1.6, y + 0.3, MZ + d / 2 - 2.2, -0.2], [x0, y + 0.3, MZ + d / 2 - 6, 0.1]]); }
      else { const name = i === 1 ? 'blossom_01' : 'blossom_04'; /* no keepOut: keep outs are flat, and one up here would close the gallery floor below */ void Promise.resolve(k.prop(name, x0, y + 0.3, MZ - d / 2 + 3.2, { height: 2.4, rotY: PI / 2 })).then((o) => { if (o) tint(o, 0x5a3e24, 0.32, 0.9); }); k.box(1.4, 0.3, 3.6, x0, y + 0.45, MZ - d / 2 + 3.2, k.flat(0x3a3c40, 0.3, 0.6)); hsign(k, i === 1 ? 'MLOW  BLOSSOM I  2026  BRONZE' : 'MLOW  BLOSSOM IV  2026  BRONZE', 1.3, 0.12, x0 + 0.72, y + 0.5, MZ - d / 2 + 3.2, PI / 2, { fg: '#e8e4dc', font: 'W2 Archivo Expanded', size: 0.6, lit: false }); }
      hsign(k, `TERRACE ${5 + i}`, 2.2, 0.36, x0 - w0 / 2 + 0.2, y + 2.6, MZ + d / 2 - 1.5, PI / 2, { fg: '#1a1c20', font: 'W2 Archivo Expanded', size: 0.7, lit: false });
    });
    /* the big gallery: its ceiling is a white plane hung with a grid of black lighting tracks and cans, as the Whitney's
       galleries are (it hid nothing before: the sawtooth boxes read as white smears from inside) */
    k.box(GW - 0.6, 0.25, GD - 0.6, MX, GH - 0.1, MZ, white);
    { const tr: T.Matrix4[] = [], cans: T.Matrix4[] = [], one = new T.Vector3(1, 1, 1), q = new T.Quaternion(); for (let x = MX - GW / 2 + 2; x < MX + GW / 2 - 1; x += 3) { tr.push(new T.Matrix4().compose(v(x, GH - 0.3, MZ), q, one)); for (let z = MZ - GD / 2 + 3; z < MZ + GD / 2 - 2; z += 4.5) cans.push(new T.Matrix4().compose(v(x, GH - 0.55, z), q, one)); }
      k.instances(new T.BoxGeometry(0.08, 0.06, GD - 1.4), k.flat(0x141518, 0.5, 0.5), tr); k.instances(new T.CylinderGeometry(0.09, 0.11, 0.3, 10), k.flat(0x141518, 0.6, 0.4), cans); }
    /* the big gallery: the title wall of the show, benches down the middle */
    hsign(k, 'NEW YORKERS', 6, 0.62, MX - 12 - 0.32, 5.5, MZ - 6, -PI / 2, { fg: '#1a1c20', font: 'W2 Archivo Expanded', size: 0.8, lit: false });
    hsign(k, 'BY MLOW  THE CENSUS OF A CITY', 6, 0.26, MX - 12 - 0.32, 4.96, MZ - 6, -PI / 2, { fg: '#4a4c50', font: 'W2 JetBrains Mono', size: 0.6, lit: false });
    for (const [x, z] of [[MX + 6, MZ - 12], [MX - 6, MZ + 12]]) k.bench(x, z, PI / 2, k.pbr('whBench', X.planks(0x8a6a48, 3, 742), 1.2), k.flat(0x2a2c30, 0.6, 0.4), 2.6);
    /* the mural wall across the street, where the museum's outdoor commissions go up: MLow's painted wall, a sign board until the Firefly plate lands */
    { k.box(1.2, 16, 18, 38.6, 8, 4, k.pbr('whMuralBrick', X.brick(0x7a4a3a, 743), 0.28)); k.block(37.9, 39.3, -5, 13);
      const board = HAS_DOM ? paintTex(1024, 768, (g) => { g.fillStyle = '#f2eee4'; g.fillRect(0, 0, 1024, 768); g.fillStyle = '#1e4fa8'; g.fillRect(0, 520, 1024, 248); g.fillStyle = '#1a1c20'; g.textAlign = 'center'; g.font = '800 132px "W2 Archivo Expanded", Arial, sans-serif'; g.fillText('NEW', 512, 200); g.fillText('YORKERS', 512, 350, 980); g.fillStyle = '#f2eee4'; g.font = '700 70px "W2 JetBrains Mono", monospace'; g.fillText('BY MLOW', 512, 660); }, ['W2 Archivo Expanded', 'W2 JetBrains Mono']) : null;
      fireflyPlate(k, 'assets/museum/tex/whitney/ff_mural_wall.webp', 16, 12, 37.96, 8.5, 4, -PI / 2, board ? new T.MeshStandardMaterial({ map: board, roughness: 0.9 }) : white); }
    /* the illusion: NEW YORKERS painted flat on the gallery floor, stretched so that from the doors on Gansevoort it stands up off the
       pine like a wall label; walk in and it smears into long paint (anamorphosis) */
    if (HAS_DOM) anamorphTex(k, floorType('NEW YORKERS', '#1a1c20', 1024, 300), MX + 5, MZ + GD / 2 - 2.2, 3.0, 0.31, 0, 5, 3, 1.8, 0.9);
    k.egg(v(MX + 5, 1.6, MZ + GD / 2 - 2.2), { id: 'whitney-anamorph', title: 'The label on the floor', text: 'NEW YORKERS is painted flat across the pine and stretched toward the far wall, so that from the doors it stands up off the floor like a wall label; walk into the gallery and it falls back into long smears of paint. The trick is anamorphosis, the same one that hides a skull across the floor of Hans Holbein\'s The Ambassadors of 1533.', clue: 'Stand just inside the doors from Gansevoort Street and look across the gallery floor.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.6 });
    // landmark eggs
    k.egg(v(MX, 3, MZ + 10), { id: 'whitney-gallery', title: 'No columns', year: '2015', text: 'The special exhibitions gallery is approximately 18,000 square feet, the largest column free museum gallery in New York City. The building holds about 50,000 square feet of indoor galleries in all.', clue: 'Stand in the middle of the big gallery and look for a column.', source: { name: 'The Building, Whitney Museum of American Art', url: 'https://www.whitney.org/about/our-building' } }, { r: 2 });
    k.egg(v(terraces[0][0], terraces[0][1] + 1.6, MZ), { id: 'whitney-terraces', title: 'Galleries outdoors', year: '2015', text: 'The museum has 13,000 square feet of outdoor exhibition space and terraces facing the High Line. An outdoor staircase links the decks on floors five through eight, so you can climb the building outside.', clue: 'Climb to the lowest terrace on the High Line side.', source: { name: 'The Building, Whitney Museum of American Art', url: 'https://www.whitney.org/about/our-building' } }, { r: 2 });
    k.egg(v(MX + 5, 2.4, MZ + 26), { id: 'whitney-largo', title: 'The largo', year: '2015', text: 'The dramatically cantilevered entrance on Gansevoort Street shelters an 8,500 square foot outdoor plaza the architects call the largo, a public space by the southern entrance of the High Line.', clue: 'Stand in front of the entrance on Gansevoort Street.', source: { name: 'The Building, Whitney Museum of American Art', url: 'https://www.whitney.org/about/our-building' } }, { r: 2 });
    k.egg(v(MX - GW / 2 + 1.2, 2.6, MZ + 14), { id: 'whitney-flooddoor', title: 'A door from a destroyer', year: '2012', text: 'Hurricane Sandy flooded the half built museum with more than five million gallons of water in 2012. Inside the river facade now stands a watertight door 14 feet tall and 27 feet wide, weighing 15,500 pounds, designed by engineers who work on Navy destroyers, part of a system that protects against a flood level of 16.5 feet.', clue: 'Go to the wall that faces the Hudson.', source: { name: 'How the Whitney installed an invisible flood barrier after Hurricane Sandy, 6sqft', url: 'https://www.6sqft.com/how-the-whitney-installed-an-invisible-flood-barrier-after-hurricane-sandy/' } }, { r: 1.8 });
    k.egg(v(MX + GW / 2 - 1.2, 2.6, MZ - 18), { id: 'whitney-elevators', title: 'Elevators as art', year: '2015', text: 'The building\'s four elevators were designed by the late artist Richard Artschwager. The building also has a 170 seat theater with views of the Hudson River.', clue: 'Find the corner of the gallery farthest from the river and the street.', source: { name: 'The Building, Whitney Museum of American Art', url: 'https://www.whitney.org/about/our-building' } }, { r: 1.6 });
    k.egg(v(MX, 11, MZ + 23.4), { id: 'whitney-breuer', title: 'From Madison Avenue', year: '2015', text: 'From 1966 to 2014 the Whitney lived at 945 Madison Avenue, in the building by Marcel Breuer and Hamilton P. Smith. The Renzo Piano building at 99 Gansevoort Street opened on May 1, 2015, and cost $422 million.', clue: 'Read the name high on the street front.', source: { name: 'Whitney Museum of American Art, Wikipedia', url: 'https://en.wikipedia.org/wiki/Whitney_Museum_of_American_Art' } }, { r: 1.8 });
    return { mounts, spawn: v(16, 3, 40), look: v(MX, 16, MZ), eye: 3, bounds: [MX - GW / 2 + 1, 24, MZ - GD / 2 + 1, 140], style: 'white', floorY: (x, z) => { if (x > 12 && x < 18 && z > 40) return HY + 0.6; if (x > MX + 23.5 && x < MX + 26.5 && z > MZ - 1 && z < MZ + 24) return Math.min(12, ((MZ + 23 - z) / 24) * 12); const t = tY(x, z); if (t >= 0) return t; return 0; } };
  },
};
