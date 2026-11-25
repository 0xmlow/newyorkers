/* 142 to 146: five more rooms whose subject is motion.
   A night session at Arthur Ashe, the Central Park carousel at full turn, the big window at the
   New York Aquarium, Astoria Pool in July, and the rink and the tree at Rockefeller Center.
   Every moving thing is either one instanced rig updated in place or a single group on k.ticks,
   so a room with six thousand spectators still costs a handful of draw calls. */
import * as T from 'three';
import { personTag, boxCrowdTag } from '../kit';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as X from '../textures';
import { v, type Mount } from '../kit';
import type { RoomDef } from './types';
import { hero, heroInstances } from './heroes';
import { hsign, paintTex, anamorphTex } from './f';
const PI = Math.PI;
type K = Parameters<RoomDef['build']>[0];

/* translucent puffs that rise, spread and fade: spray, steam, bubbles */
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
  personTag(body, 'auto', 1.25); for (let i = k.objects.indexOf(body) + 1; i < k.objects.length; i++) personTag(k.objects[i], 'part'); return body;
}
/* a small figure with a colour and a head, as one merged geometry for instancing */
function figureGeo(r = 0.2, len = 0.82, headY = 1.35) {
  const body = new T.CapsuleGeometry(r, len, 3, 8); body.translate(0, r + len / 2, 0);
  const head = new T.SphereGeometry(r * 0.62, 10, 8); head.translate(0, headY, 0);
  return personTag(mergeGeometries([body, head])!, 'auto');
}
const one = new T.Vector3(1, 1, 1);

/* ---------- THE BIG UPGRADE, wave 8a (2026-11-24): helpers for rooms 142 to 146 ----------
   The wave 7 pattern kept local: Poly Haven scans from assets/museum/tex/<room>/ that wear a set colour until all their
   maps land, real models from assets/museum/props/<room>/ fitted once and placed (seven or more as instanced parts, glass
   stripped of transmission and shadows), house font signs and floor type. Safe in node: the audit builds with no DOM. */
const W8_DOM = typeof window !== 'undefined' && typeof document !== 'undefined' && typeof HTMLImageElement !== 'undefined';
const w8L = W8_DOM ? new T.TextureLoader() : null;
const w8S = new Map<string, { s: X.Surface; ready: Promise<unknown> }>();
function w8Scan(k: K, room: string, id: string, metres: number, paint: () => X.Surface, p: Partial<T.MeshStandardMaterialParameters> & { normal?: number } = {}, wait = 0x777777, tag = '') {
  if (!w8L) return k.pbr(`w8-${room}-${id}${tag}`, paint(), 1 / metres, p);
  let e = w8S.get(`${room}/${id}`);
  if (!e) {
    const low = k.o.quality !== 'high', waits: Promise<unknown>[] = [];
    const ld = (suf: string, srgb: boolean) => {
      let done: () => void = () => {};
      waits.push(new Promise<void>((r) => (done = r)));
      const t = w8L.load(`assets/museum/tex/${room}/${id}_${suf}.webp`, () => done(), undefined, () => done());
      t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8;
      if (srgb) t.colorSpace = T.SRGBColorSpace;
      return t as unknown as T.CanvasTexture;
    };
    e = { s: { map: ld('c', true), normalMap: ld('n', false), roughnessMap: low ? undefined : ld('r', false) }, ready: Promise.all(waits) };
    w8S.set(`${room}/${id}`, e);
  }
  k.pending.push(e.ready);
  const m = k.pbr(`w8-${room}-${id}${tag}`, e.s, 1 / metres, p);
  if (!m.userData.w8) {
    m.userData.w8 = true;
    const maps = { map: m.map, normalMap: m.normalMap, roughnessMap: m.roughnessMap }, tint = m.color.clone();
    m.map = m.normalMap = m.roughnessMap = null; m.color.set(wait);
    void e.ready.then(() => { Object.assign(m, maps); m.color.copy(tint); m.needsUpdate = true; });
  }
  return m;
}
/* A real model fitted once and set at every [x, y, z, rotY, scale?]; seven or more become instanced parts. `then`
   gets the clones (empty when instanced) or, with `live`, the instancer so a tick can move them. */
type W8Ins = ReturnType<typeof heroInstances>;
function w8Place(k: K, name: string, fit: Parameters<typeof hero>[2], at: number[][], tweak?: (o: T.Object3D) => void, then?: (os: T.Object3D[], ins?: W8Ins) => void, inst = 6) {
  if (!at.length || !W8_DOM) return;
  void hero(k, name, fit).then((h) => {
    if (!h || !k.live) return;
    h.traverse((c) => { if (!(c instanceof T.Mesh)) return; c.castShadow = false; for (const m of (Array.isArray(c.material) ? c.material : [c.material]) as T.MeshPhysicalMaterial[]) if (m.transmission > 0) { m.transmission = 0; m.transparent = true; m.opacity = 0.35; m.depthWrite = false; } });
    if (tweak) tweak(h);
    if (at.length > inst) {
      const ins = heroInstances(k, h, at.length), m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(0, 0, 0, 'YXZ');
      at.forEach(([x, y, z, r, s = 1], i) => ins.setAt(i, m.compose(new T.Vector3(x, y, z), q.setFromEuler(e.set(0, r, 0, 'YXZ')), new T.Vector3(s, s, s))));
      ins.commit(); for (const p of ins.parts) p.im.castShadow = false; then?.([], ins); return;
    }
    const os = at.map(([x, y, z, r, s = 1], i) => { const c = i ? h.clone() : h; c.position.set(x, y, z); c.rotation.set(0, r, 0); c.scale.setScalar(s); k.add(c); return c; });
    then?.(os);
  });
}
/* Recolour every material of a loaded model (clones, so the cache stays clean). */
function w8Tint(o: T.Object3D, hex: number, rough = 0.6, metal = 0.2, keepMap = true) {
  const cache = new Map<T.Material, T.Material>();
  o.traverse((c) => { if (!(c instanceof T.Mesh)) return; const src = c.material as T.MeshStandardMaterial; let m = cache.get(src); if (!m) { const n = src.clone(); n.color.setHex(hex); n.roughness = rough; n.metalness = metal; if (!keepMap) n.map = null; m = n; cache.set(src, m); } c.material = m; });
}
function w8Sign(k: K, text: string, w: number, h: number, x: number, y: number, z: number, rotY: number, fg: string, bg: string, font = 'W2 Archivo Expanded', lit = false, size = 0.6, border?: string) {
  if (!W8_DOM) return k.box(w, h, 0.02, x, y, z, k.flat(0x333333));
  return hsign(k, text, w, h, x, y, z, rotY, { fg, bg: bg || undefined, font, lit, size, border });
}
/* Floor lettering for the one illusion a room, `colors` per letter. Null in node. */
function w8Type(text: string, colors: string[], w = 1024, h = 256, font = 'W2 Archivo Expanded') {
  if (!W8_DOM) return null;
  return paintTex(w, h, (g) => {
    g.textBaseline = 'middle';
    let s = h * 0.8; g.font = `800 ${s}px "${font}", Arial, sans-serif`;
    let tw = g.measureText(text).width; if (tw > w * 0.94) { s *= (w * 0.94) / tw; g.font = `800 ${s}px "${font}", Arial, sans-serif`; tw = g.measureText(text).width; }
    let x = (w - tw) / 2, n = 0;
    for (const ch of text) { g.fillStyle = colors[n++ % colors.length]; g.fillText(ch, x, h / 2); x += g.measureText(ch).width; if (ch === ' ') n--; }
  }, [font]);
}
/* Many copies of one box as a single instanced draw: [x, y, z, rotY?, sx?, sy?, sz?] each. */
function w8Boxes(k: K, w: number, h: number, d: number, m: T.Material, at: number[][]) {
  if (!at.length) return null;
  const q = new T.Quaternion(), up = new T.Vector3(0, 1, 0);
  return k.instances(new T.BoxGeometry(w, h, d), m, at.map(([x, y, z, r = 0, sx = 1, sy = 1, sz = 1]) => new T.Matrix4().compose(new T.Vector3(x, y, z), q.setFromAxisAngle(up, r), new T.Vector3(sx, sy, sz))));
}

/* ---------------- 142 THE NIGHT SESSION ---------------- */
export const arthurashe: RoomDef = {
  id: 'arthurashe',
  name: 'The night session',
  area: 'ARTHUR ASHE STADIUM / FLUSHING MEADOWS',
  mood: 'Deuce, under the open roof',
  color: '#2f6fd6',
  daylit: false,
  description: 'The largest tennis stadium in the world at nine at night in the first week of September: the roof open to the sky, twenty three thousand people in the bowl, a plane on its way down to LaGuardia, and two players trading ground strokes on the blue court while the wave goes round. The New Yorkers hang courtside on the wall at the foot of the lower bowl, where the sponsor boards would be, lit by the same lights as the match.',
  signatures: 'The 1997 bowl by Rossetti with its 23,771 seats, the 2016 retractable roof and its octagonal truss ring, the electric blue court inside the lines and green outside, the net and the chair umpire, line judges and ball kids, the two big screens, the light ring under the roof, and the approach path to LaGuardia overhead.',
  build(k, ctx) {
    k.sky({ top: 0x05070f, horizon: 0x101828, ground: 0x05070a, fog: 0.0022, stars: 700, env: 0.5 });
    k.hemi(0x8aa0d0, 0x1a1c22, 1.15);
    k.sun(0xffffff, 0.3, 40, 90, 20, true, 80);
    /* 2026-11-24 wave 8a: the court, the walls and the concourse are Poly Haven scans (tex/arthurashe/); the courtside wall is
       the tournament's dark navy, not grey, with a running LED ribbon on top and a kick board at the foot */
    const blue = k.flat(0x1f4fae, 0, 0.78), green = k.flat(0x3f7f4c, 0, 0.82),
      line = k.flat(0xe8ecf0, 0, 0.8),
      seat = k.flat(0x1e4494, 0, 0.8), seatUp = k.flat(0x14295a, 0, 0.85), riser = k.flat(0x3a3f48, 0, 0.9),
      wall = w8Scan(k, 'arthurashe', 'concrete_wall_006', 2.5, () => X.concrete(0x23305a, 31), { color: 0x34487e, roughness: 0.75 }, 0x1e2a4a),
      aisle = w8Scan(k, 'arthurashe', 'concrete_floor_02', 3, () => X.concrete(0x55585e, 32), { color: 0x8a8c92, roughness: 0.8 }, 0x4a4c52),
      white = k.flat(0xe8ecf0, 0.1, 0.5), steel = k.flat(0x9aa4ae, 0.8, 0.35), dark = k.flat(0x0e1117, 0.3, 0.7), navy = k.flat(0x0f1a36, 0.2, 0.6),
      truss = k.flat(0x8f98a4, 0.75, 0.4), fabric = k.flat(0xd8dde4, 0, 0.9, { side: T.DoubleSide, transparent: true, opacity: 0.86 }),
      netTex = W8_DOM ? paintTex(512, 64, (g) => { g.clearRect(0, 0, 512, 64); g.strokeStyle = 'rgba(20,24,28,0.95)'; g.lineWidth = 1.6; for (let x = 0; x <= 512; x += 6) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 64); g.stroke(); } for (let y = 0; y <= 64; y += 6) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); } }) : null,
      net = netTex ? new T.MeshStandardMaterial({ map: netTex, transparent: true, alphaTest: 0.05, side: T.DoubleSide, roughness: 0.9 }) : k.flat(0x101418, 0, 0.9, { transparent: true, opacity: 0.6, side: T.DoubleSide });
    if (netTex) { netTex.wrapS = T.RepeatWrapping; netTex.repeat.set(4, 1); }
    /* the court: Laykold, blue inside the lines, green to the run off */
    k.box(30, 0.1, 50, 0, -0.06, 0, aisle);
    k.box(20, 0.1, 40, 0, -0.04, 0, green);
    k.box(11, 0.1, 23.8, 0, -0.03, 0, blue);
    const L = (w: number, d: number, x: number, z: number) => k.box(w, 0.012, d, x, 0.026, z, line);
    L(11, 0.1, 0, 11.9); L(11, 0.1, 0, -11.9);
    for (const x of [-5.45, 5.45, -4.1, 4.1]) L(0.1, 23.8, x, 0);
    L(8.2, 0.1, 0, 6.4); L(8.2, 0.1, 0, -6.4); L(0.1, 12.8, 0, 0); L(0.1, 0.3, 0, 11.75); L(0.1, 0.3, 0, -11.75);
    /* the net: square posts in court green, a mesh you can see through, the white band and the centre strap */
    for (const x of [-6.4, 6.4]) { k.box(0.09, 1.07, 0.09, x, 0.535, 0, k.flat(0x1f4a2a, 0.3, 0.5)); k.cyl(0.05, 0.08, x, 1.1, 0, steel); }
    k.plane(12.8, 0.95, 0, 0.5, 0, net);
    k.box(12.8, 0.07, 0.04, 0, 0.94, 0, white);
    k.box(0.05, 0.9, 0.04, 0, 0.45, 0, white);
    k.box(12.8, 0.03, 0.03, 0, 0.04, 0, dark);
    k.block(-10, 10, -20, 20);
    /* the wall at the foot of the bowl: three and a half metres of it, where the works hang */
    for (const s of [-1, 1]) { k.box(0.6, 3.6, 51.2, s * 14.5, 1.8, 0, wall); k.box(0.7, 0.12, 51.2, s * 14.5, 3.66, 0, steel); k.box(31.2, 3.6, 0.6, 0, 1.8, s * 24.8, wall); k.box(31.2, 0.12, 0.7, 0, 3.66, s * 24.8, steel); k.box(0.64, 0.5, 51.2, s * 14.5, 0.25, 0, navy); k.box(31.2, 0.5, 0.64, 0, 0.25, s * 24.8, navy); }
    /* the LED ribbon along the top of the courtside wall: one canvas, scrolling, house type */
    {
      const rib = W8_DOM ? paintTex(2048, 64, (g) => { g.fillStyle = '#050a18'; g.fillRect(0, 0, 2048, 64); g.textBaseline = 'middle'; g.font = '800 40px "W2 Archivo Expanded", Arial, sans-serif'; const parts = ['ARTHUR ASHE STADIUM', 'NIGHT SESSION', 'QUIET PLEASE', 'NEW YORKERS BY MLOW', 'FLUSHING MEADOWS']; let x = 20; let i = 0; while (x < 2048) { const t = parts[i++ % parts.length]; g.fillStyle = i % 2 ? '#f2f6ff' : '#ffd23a'; g.fillText(t, x, 34); x += g.measureText(t).width + 30; g.fillStyle = '#2f62c4'; g.fillRect(x, 22, 24, 24); x += 54; } }, ['W2 Archivo Expanded']) : null;
      const ribM = rib ? new T.MeshBasicMaterial({ map: rib, toneMapped: false }) : k.flat(0x102040);
      if (rib) { rib.wrapS = T.RepeatWrapping; rib.repeat.set(2.6, 1); }
      const ribG = new T.PlaneGeometry(28.4, 0.42); { const uv = ribG.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * (28.4 / 51.2)); }
      for (const s of [-1, 1]) { k.mesh(new T.PlaneGeometry(51.2, 0.42), ribM, s * 14.18, 3.36, 0, true).rotation.y = -s * PI / 2; k.mesh(ribG, ribM, 0, 3.36, s * 24.48, true).rotation.y = s > 0 ? PI : 0; }
      if (rib && !ctx.reduced) k.ticks.push((t) => { rib.offset.x = (t * 0.035) % 1; });
    }
    k.block(14.2, 15.5, -25.5, 25.5); k.block(-15.5, -14.2, -25.5, 25.5); k.block(-15.5, 15.5, 24.5, 25.5); k.block(-15.5, 15.5, -25.5, -24.5);
    /* the lower bowl: twenty two rows on a rising ring, and a spectator in every seat */
    const ROWS = 22, seatsPos: number[] = [], seatsAng: number[] = [];
    /* 2026-11-24 wave 8a: stepped aisles cut through the rows (no seats in them), concrete treads and a rail down each */
    const AZ = [-19, -7, 7, 19], AX = [-10, 0, 10], inAisle = (u: number, list: number[]) => list.some((a) => Math.abs(u - a) < 0.75);
    const treads: number[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const o = 15.2 + r * 0.95, oz = 25.5 + r * 0.95, y = 3.6 + r * 0.5;
      for (const s of [-1, 1]) {
        k.box(0.95, 0.5, oz * 2 + 0.95, s * o, y - 0.25, 0, r % 2 ? seat : riser);
        k.box(o * 2 + 0.95, 0.5, 0.95, 0, y - 0.25, s * oz, r % 2 ? seat : riser);
        for (let z = -oz + 0.6; z < oz - 0.4; z += 0.72) { if (inAisle(z, AZ)) continue; seatsPos.push(s * o, y, z); seatsAng.push(Math.atan2(z, s * o)); }
        for (let x = -o + 1.2; x < o - 1.0; x += 0.72) { if (inAisle(x, AX)) continue; seatsPos.push(x, y, s * oz); seatsAng.push(Math.atan2(s * oz, x)); }
        for (const z of AZ) treads.push([s * o, y - 0.24, z, 0]);
        for (const x of AX) treads.push([x, y - 0.24, s * oz, PI / 2]);
      }
    }
    w8Boxes(k, 0.97, 0.52, 1.3, aisle, treads);
    for (const s of [-1, 1]) {
      for (const z of AZ) k.beam(v(s * 15.2, 4.6, z), v(s * (15.2 + (ROWS - 1) * 0.95), 4.6 + (ROWS - 1) * 0.5, z), 0.025, steel, 5);
      for (const x of AX) k.beam(v(x, 4.6, s * 25.5), v(x, 4.6 + (ROWS - 1) * 0.5, s * (25.5 + (ROWS - 1) * 0.95)), 0.025, steel, 5);
    }
    /* the promenade, the ring of suites (glass, lit, people at the rail), then the upper deck climbing to the light ring */
    const pO = 15.2 + ROWS * 0.95, pY = 3.6 + ROWS * 0.5, SU = 4.2;
    for (const s of [-1, 1]) { k.box(3.4, 0.6, (25.5 + ROWS * 0.95) * 2 + 3.4, s * (pO + 1.7), pY - 0.3, 0, riser); k.box((pO + 1.7) * 2 + 3.4, 0.6, 3.4, 0, pY - 0.3, s * (25.5 + ROWS * 0.95 + 1.7), riser); }
    {
      const suites = k.pbr('aaSuites', X.windows(97, 0.78, 0x18202c, false), 0.25, { emissive: 0xffffff, emissiveIntensity: 1.25, roughness: 0.25, metalness: 0.4, stretch: 0.6 });
      const oz0 = 25.5 + ROWS * 0.95;
      for (const s of [-1, 1]) {
        k.box(0.3, SU, oz0 * 2 + 6.8, s * (pO + 3.25), pY + SU / 2, 0, suites); k.box(pO * 2 + 6.8, SU, 0.3, 0, pY + SU / 2, s * (oz0 + 3.25), suites);
        k.box(0.5, 0.35, oz0 * 2 + 6.8, s * (pO + 3.1), pY + SU + 0.1, 0, white); k.box(pO * 2 + 6.8, 0.35, 0.5, 0, pY + SU + 0.1, s * (oz0 + 3.1), white);
        k.box(0.06, 1.05, oz0 * 2 + 3.4, s * (pO + 0.1), pY + 0.52, 0, k.glass(0xb8d8ff, 0.18, 0.05)); k.box(pO * 2 + 3.4, 1.05, 0.06, 0, pY + 0.52, s * (oz0 + 0.1), k.glass(0xb8d8ff, 0.18, 0.05));
      }
    }
    for (let r = 0; r < 18; r++) {
      const o = pO + 3.4 + r * 1.1, oz = 25.5 + ROWS * 0.95 + 3.4 + r * 1.1, y = pY + SU + 0.3 + r * 0.95;
      for (const s of [-1, 1]) { k.box(1.1, 0.95, oz * 2 + 1.1, s * o, y - 0.47, 0, seatUp); k.box(o * 2 + 1.1, 0.95, 1.1, 0, y - 0.47, s * oz, seatUp); }
    }
    const topO = pO + 3.4 + 18 * 1.1, topY = pY + SU + 0.3 + 18 * 0.95;
    /* the crowd: one instanced figure per lower seat, coloured, and it does the wave */
    const N = seatsPos.length / 3;
    /* 2026-11-24 wave 8a: a 32 triangle seated body instead of the capsule, tagged as a box crowd: the nearest sections
       become the seated cast, the far keep these boxes in their shirt colours (it was 3.5M triangles, every seat a cast body) */
    const seatedGeo = (() => { const b = new T.BoxGeometry(0.42, 0.6, 0.3); b.translate(0, 0.3, 0); const sh = new T.BoxGeometry(0.5, 0.14, 0.32); sh.translate(0, 0.62, 0); const h = new T.IcosahedronGeometry(0.115, 0); h.translate(0, 0.84, 0.02); return mergeGeometries([b.toNonIndexed(), sh.toNonIndexed(), h])!; })();
    const crowd = k.instances(seatedGeo, new T.MeshStandardMaterial({ roughness: 0.9 }), Array.from({ length: N }, () => new T.Matrix4()));
    crowd.frustumCulled = false; crowd.castShadow = crowd.receiveShadow = false; boxCrowdTag(crowd, 0, 1.2);
    k.ticks.push(() => { crowd.castShadow = false; });   // something after the build turns it back on; six thousand boxes in the shadow pass
    {
      const rnd = X.mulberry(97), c = new T.Color(), pal = [0x1c232c, 0xe8e2d4, 0x2a3f6a, 0x8a2a2a, 0xd8c04a, 0x3a5a3a, 0xf0f0f0, 0x6a4a8a, 0x2b5f6e, 0xd07a3a];
      const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), sc = new T.Vector3(), up = new T.Vector3(0, 1, 0);
      const hs = new Float32Array(N), ph = new Float32Array(N);
      for (let i = 0; i < N; i++) { crowd.setColorAt(i, c.set(pal[Math.floor(rnd() * pal.length)])); hs[i] = 0.85 + rnd() * 0.3; ph[i] = rnd() * 6.3; }
      if (crowd.instanceColor) crowd.instanceColor.needsUpdate = true;
      let cheer = 0;
      const place = (t: number) => {
        const waveOn = t % 46 < 16, wa = waveOn ? t * 1.1 : 0;
        const jump = cheer > 0 ? cheer : 0;
        for (let i = 0; i < N; i++) {
          const x = seatsPos[i * 3], y = seatsPos[i * 3 + 1], z = seatsPos[i * 3 + 2];
          let lift = jump * 0.22 * (0.6 + 0.4 * Math.sin(ph[i] * 3));
          if (waveOn) { const d = Math.cos(seatsAng[i] - wa); lift += 0.55 * Math.pow(Math.max(0, d), 12); }
          p.set(x, y + lift, z);
          q.setFromAxisAngle(up, Math.atan2(-x, -z));
          sc.set(1, hs[i] + 0.35 * lift, 1);
          m.compose(p, q, sc);
          crowd.setMatrixAt(i, m);
        }
        crowd.instanceMatrix.needsUpdate = true;
      };
      place(0);
      if (!ctx.reduced) k.ticks.push((t, dt) => { cheer = Math.max(0, cheer - dt * 1.4); place(t); });
      (k as unknown as { __cheer?: () => void }).__cheer = () => { cheer = 1; };
    }
    /* the roof: an octagon of steel trusses, the fabric panels drawn back, the sky in the middle.
       2026-11-24 wave 8a: the solid white beams became open lattice trusses (two chords, posts and diagonals, all one
       instanced draw) in painted steel, with real flood light banks (Poly Haven CC0) hung under the inner ring */
    const RY = topY + 8, R1 = topO + 20, R0 = 27;
    const oct = (r: number, i: number) => v(Math.cos((i / 8) * PI * 2 + PI / 8) * r, 0, Math.sin((i / 8) * PI * 2 + PI / 8) * r);
    const webs: T.Matrix4[] = [], wq = new T.Quaternion(), wy = new T.Vector3(0, 1, 0), ws = new T.Vector3();
    const web = (p0: T.Vector3, p1: T.Vector3, r = 1) => { const d = p1.clone().sub(p0), L = d.length(); wq.setFromUnitVectors(wy, d.normalize()); webs.push(new T.Matrix4().compose(p0.clone().add(p1).multiplyScalar(0.5), wq, ws.set(r, L, r))); };
    const lattice = (p0: T.Vector3, p1: T.Vector3, h: number, chord: number) => {
      const up = v(0, h / 2, 0);
      k.bar(p0.clone().add(up), p1.clone().add(up), chord, chord, truss); k.bar(p0.clone().sub(up), p1.clone().sub(up), chord, chord, truss);
      const n = Math.max(2, Math.round(p0.distanceTo(p1) / (h * 1.1)));
      for (let j = 0; j <= n; j++) {
        const u = j / n, q0 = p0.clone().lerp(p1, u);
        web(q0.clone().sub(up), q0.clone().add(up));
        if (j < n) { const q1 = p0.clone().lerp(p1, (j + 1) / n); web(j % 2 ? q0.clone().add(up) : q0.clone().sub(up), j % 2 ? q1.clone().sub(up) : q1.clone().add(up)); }
      }
    };
    for (let i = 0; i < 8; i++) {
      const a = oct(R1, i), b = oct(R1, (i + 1) % 8), c = oct(R0, i), d = oct(R0, (i + 1) % 8);
      lattice(v(a.x, RY, a.z), v(b.x, RY, b.z), 3.4, 0.7);
      lattice(v(c.x, RY + 3, c.z), v(d.x, RY + 3, d.z), 2.4, 0.5);
      lattice(v(a.x, RY + 0.5, a.z), v(c.x, RY + 3, c.z), 2.6, 0.5);
      k.box(2.4, 6, 2.4, a.x, RY - 6, a.z, truss);
    }
    { const o = k.instances(new T.CylinderGeometry(0.11, 0.11, 1, 6), truss, webs); o.castShadow = false; }
    /* the flood light banks: sixteen hung from the inner ring, turned to the court and tipped down */
    if (W8_DOM) void hero(k, 'arthurashe/ph_flood_lights', { width: 4.2 }).then((h) => {
      if (!h || !k.live) return;
      h.traverse((c) => { if (c instanceof T.Mesh) c.castShadow = false; });
      const ins = heroInstances(k, h, 16), m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(0, 0, 0, 'YXZ');
      for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2 + PI / 16, r = R0 + 1.5; ins.setAt(i, m.compose(v(Math.cos(a) * r, RY + 0.3, Math.sin(a) * r), q.setFromEuler(e.set(-0.75, Math.atan2(-Math.cos(a), -Math.sin(a)), 0, 'YXZ')), one)); }
      ins.commit(); for (const p of ins.parts) p.im.castShadow = false;
    });
    { const g = new T.RingGeometry(R0 + 1, R1 + 3, 64, 1); g.rotateX(-PI / 2); k.mesh(g, fabric, 0, RY + 1.2, 0); }
    /* the outer wall of the bowl from the top row to the roof, and the light ring */
    for (let i = 0; i < 8; i++) {
      const a = oct(topO + 6, i), b = oct(topO + 6, (i + 1) % 8);
      k.bar(v(a.x, topY - 6, a.z), v(b.x, topY - 6, b.z), 14, 1.2, wall);
    }
    for (let i = 0; i < 64; i++) { const a = (i / 64) * PI * 2, r = topO + 2; k.box(2.2, 0.5, 0.6, Math.cos(a) * r, topY + 3.5, Math.sin(a) * r, k.glow(0xfff7e0, 0.9)).rotation.y = -a; }
    for (const [x, z] of [[-30, -40], [30, -40], [-30, 40], [30, 40], [-44, 0], [44, 0]]) k.spot(x, topY + 3, z, 0, 0, 0, 0xfff4e0, 820, 0.42, 0.6, 140);
    k.point(0, 20, 0, 0xfff0d8, 150, 60);
    /* the big screens, one at each end of the upper deck */
    k.sign('US OPEN  ·  NIGHT SESSION  ·  6  4    5  5', 18, 6, 0, topY + 0.5, -(topO + 5.4), '#08101e', '#f0f4ff', 66, 0);
    k.sign('ARTHUR ASHE STADIUM  ·  FLUSHING MEADOWS  ·  40  30', 18, 6, 0, topY + 0.5, topO + 5.4, '#08101e', '#f0f4ff', 62, PI);
    /* the officials: the chair, six line judges, four ball kids */
    k.box(0.9, 0.5, 0.9, -7.6, 2.0, 0, dark); for (const dx of [-0.4, 0.4]) for (const dz of [-0.4, 0.4]) k.cyl(0.03, 2.0, -7.6 + dx, 1.0, dz, steel);
    k.box(0.9, 0.7, 0.08, -7.6, 2.6, -0.42, dark);
    figure(k, -7.6, 2.25, 0, 0x1c2a4a, { h: 0.9 });
    k.cyl(0.02, 1.4, -7.6, 3.4, 0, steel); k.cyl(0.6, 0.12, -7.6, 4.1, 0, white, 0.05, 12);
    for (const [x, z, ry] of [[-7.5, 12.5, PI / 2], [7.5, 12.5, -PI / 2], [-7.5, -12.5, PI / 2], [7.5, -12.5, -PI / 2], [-3.4, 21.5, PI], [3.4, -21.5, 0]]) figure(k, x, 0, z, 0x1c2a4a, { rotY: ry });
    for (const [x, z] of [[-6.9, 0.9], [6.9, -0.9], [-4.2, 20.5], [4.2, -20.5]]) figure(k, x, 0, z, 0x2a5db8, { h: 0.8, crouch: 0.55 });
    /* 2026-11-24 wave 8a: the chair gets its ladder, its navy side panels and the scoreboard clock at its foot; the
       players' benches and the towel boxes either side of it */
    for (let y = 0.35; y < 1.8; y += 0.3) k.box(0.06, 0.04, 0.62, -8.08, y, 0, steel);
    for (const dz of [-0.31, 0.31]) k.box(0.05, 1.85, 0.05, -8.08, 0.92, dz, steel);
    for (const dz of [-0.47, 0.47]) k.box(0.9, 0.55, 0.04, -7.6, 1.55, dz, navy);
    w8Sign(k, 'SHOT CLOCK  25', 1.2, 0.36, -7.6, 0.45, 0.48, 0, '#ff3a2a', '#050608', 'W2 JetBrains Mono', true, 0.62);
    for (const z of [-2.6, 2.6]) { k.box(0.55, 0.45, 2.2, -8.6, 0.23, z, navy); k.box(0.12, 0.5, 2.2, -8.85, 0.7, z, navy); k.box(0.5, 0.6, 0.5, -8.4, 0.3, z + (z > 0 ? 1.6 : -1.6), k.flat(0x1a2d5a, 0.1, 0.6)); }
    k.keepOut.push({ x: -8.4, z: 2.6, r: 1.4 }, { x: -8.4, z: -2.6, r: 1.4 });
    /* the one illusion: QUIET PLEASE painted long across the run off, so it stands up off the court only from the door */
    { const tx = w8Type('QUIET PLEASE', ['#f4f6fa'], 1024, 160); if (tx) { anamorphTex(k, tx, 12, 2, 3, 0, 0.7086, 7.2, 5.6, 1.0, 0.85); } }
    k.egg(v(10.2, 0.4, -2.2), { id: 'quiet-please', title: 'Quiet please', text: 'The two words on the floor are painted long and thin, stretched along your line of sight, so they only stand up straight from the spot where you came in. Walk a step and they fall flat. It is the trick of Holbein\'s skull in The Ambassadors, 1533, and of every bicycle lane arrow and every word painted on a road: drawn for the eye of someone coming towards it.', clue: 'Go back to the door and read the floor again.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 2.4 });
    /* the players and the ball: a rally that never ends, with a point every few strokes */
    const ball = k.mesh(new T.SphereGeometry(0.075, 8, 6), k.glow(0xd8ff2a), 0, 1, 12, true);
    const mkPlayer = (shirt: number, z: number) => {
      const g = new T.Group(); g.position.set(0, 0, z);
      const body = new T.Mesh(new T.CapsuleGeometry(0.24, 0.66, 3, 8), k.flat(shirt, 0, 0.85)); body.position.y = 0.92; g.add(personTag(body, 'auto', 1.25));
      const head = new T.Mesh(new T.SphereGeometry(0.16, 10, 8), k.flat(0xc8a284, 0, 0.7)); head.position.y = 1.56; g.add(personTag(head, 'part'));
      const band = new T.Mesh(new T.CylinderGeometry(0.17, 0.17, 0.06, 10), k.flat(0xf4f4f4, 0, 0.8)); band.position.y = 1.6; g.add(band);
      for (const dx of [-0.12, 0.12]) { const leg = new T.Mesh(new T.CylinderGeometry(0.08, 0.07, 0.62, 8), k.flat(0xf0f0f0, 0, 0.8)); leg.position.set(dx, 0.31, 0); g.add(leg); }
      const arm = new T.Group(); arm.position.set(0.34, 1.25, 0); g.add(arm);
      const upper = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.5, 6), k.flat(0xc8a284, 0, 0.7)); upper.position.y = -0.25; arm.add(upper);
      const handle = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 0.5, 6), dark); handle.position.set(0, -0.55, 0.2); handle.rotation.x = -0.9; arm.add(handle);
      const hoop = new T.Mesh(new T.TorusGeometry(0.19, 0.02, 6, 16), k.flat(0x2a2a2a, 0.5, 0.4)); hoop.position.set(0, -0.72, 0.62); hoop.rotation.x = -0.9 + PI / 2; arm.add(hoop);
      const strings = new T.Mesh(new T.CircleGeometry(0.18, 16), k.flat(0xf0f0f0, 0, 0.9, { transparent: true, opacity: 0.35, side: T.DoubleSide })); strings.position.copy(hoop.position); strings.rotation.copy(hoop.rotation); arm.add(strings);
      k.add(g);
      return { g, arm, swing: 0, tx: 0 };
    };
    const A = mkPlayer(0xe83a5a, 13.5), B = mkPlayer(0xf0e04a, -13.5);
    if (!ctx.reduced) {
      const rnd = X.mulberry(1997);
      /* one stroke: from the hitter to a bounce in the far court, then up to the receiver's racket */
      const st = { from: A, to: B, t0: 0, bx: 2, bz: -7, hx: 0, hz: -13.5, sx: 0, sz: 13.5, hits: 0 };
      const T1 = 0.95, T2 = 0.55;
      const plan = (t: number) => {
        const side = st.to === A ? 1 : -1;
        st.sx = st.from.g.position.x; st.sz = st.from.g.position.z;
        st.bx = (rnd() - 0.5) * 8; st.bz = side * (4 + rnd() * 7);
        st.hx = st.bx + (rnd() - 0.5) * 1.2; st.hz = side * 13.5;
        st.to.tx = st.hx; st.t0 = t;
        st.from.swing = 1;
      };
      plan(0);
      k.ticks.push((t, dt) => {
        const age = t - st.t0;
        if (age < T1) { const u = age / T1; ball.position.set(st.sx + (st.bx - st.sx) * u, 1.05 * (1 - u) + 2.0 * 4 * u * (1 - u), st.sz + (st.bz - st.sz) * u); }
        else if (age < T1 + T2) { const u = (age - T1) / T2; ball.position.set(st.bx + (st.hx - st.bx) * u, 1.1 * u + 1.1 * 4 * u * (1 - u), st.bz + (st.hz - st.bz) * u); }
        else {
          st.hits++;
          const f = st.from; st.from = st.to; st.to = f;
          if (st.hits % 9 === 0) { (k as unknown as { __cheer?: () => void }).__cheer?.(); }
          plan(t);
        }
        for (const pl of [A, B]) {
          const dx = pl.tx - pl.g.position.x; pl.g.position.x += Math.sign(dx) * Math.min(Math.abs(dx), 5.5 * Math.min(dt, 0.1));
          pl.g.position.y = Math.abs(dx) > 0.2 ? 0.06 * Math.abs(Math.sin(t * 9)) : 0;
          pl.swing = Math.max(0, pl.swing - dt * 2.4);
          pl.arm.rotation.x = -0.4 + 1.4 * Math.sin(pl.swing * PI);
          pl.arm.rotation.y = 0.5 * pl.swing;
          pl.g.rotation.y = pl === A ? PI : 0;
        }
      });
      /* the plane, on the approach to LaGuardia, every half minute or so */
      const jet = new T.Group();
      const fus = new T.Mesh(new T.CylinderGeometry(0.9, 0.9, 16, 10), k.flat(0xe8ecf0, 0.3, 0.5)); fus.rotation.x = PI / 2; jet.add(fus);
      const nose = new T.Mesh(new T.SphereGeometry(0.9, 10, 8), k.flat(0xe8ecf0, 0.3, 0.5)); nose.position.z = 8; jet.add(nose);
      const wing = new T.Mesh(new T.BoxGeometry(18, 0.22, 2.6), k.flat(0xd8dde4, 0.3, 0.5)); wing.position.set(0, -0.3, -1); jet.add(wing);
      const tail = new T.Mesh(new T.BoxGeometry(0.2, 3.4, 2.4), k.flat(0xd83a2a, 0.2, 0.6)); tail.position.set(0, 1.6, -7); jet.add(tail);
      const hst = new T.Mesh(new T.BoxGeometry(6, 0.16, 1.6), k.flat(0xd8dde4, 0.3, 0.5)); hst.position.set(0, 0.4, -7.4); jet.add(hst);
      const red = new T.Mesh(new T.SphereGeometry(0.25, 6, 5), k.glow(0xff2a2a)); red.position.set(-9, -0.3, -1); jet.add(red);
      const grn = new T.Mesh(new T.SphereGeometry(0.25, 6, 5), k.glow(0x2aff5a)); grn.position.set(9, -0.3, -1); jet.add(grn);
      const strobe = new T.Mesh(new T.SphereGeometry(0.35, 6, 5), k.glow(0xffffff)); strobe.position.set(0, -1.0, 0); jet.add(strobe);
      k.add(jet);
      const route = k.spline([v(-320, 96, 300), v(0, 92, 90), v(320, 84, -140), v(300, 160, -520), v(-300, 170, -520)], true);
      k.rider(jet, route, 38, 0);
      k.ticks.push((t) => { strobe.visible = (t * 2) % 1 < 0.08; });
    }
    /* the works: courtside, on the wall at the foot of the bowl */
    const mounts: Mount[] = [];
    for (const z of [-15, -9, -3, 3, 9, 15]) for (const s of [-1, 1]) mounts.push({ position: v(s * 14.18, 2.4, z), rotation: s > 0 ? -PI / 2 : PI / 2, target: v(s * 11.6, 2.4, z), width: 2.6, height: 1.8, style: 'steel', wash: true });
    for (const x of [-8, 0, 8]) for (const s of [-1, 1]) mounts.push({ position: v(x, 2.4, s * 24.48), rotation: s > 0 ? PI : 0, target: v(x, 2.4, s * 21.8), width: 2.6, height: 1.8, style: 'steel', wash: true });
    k.censusWall({ x: -14.18, y: 2.2, z: 20.5, rotY: PI / 2, cols: 10, rows: 5, tile: 0.5, gap: 0.04, start: ctx.wallStart(4400, 50), pieces: ctx.all, backing: wall });
    k.censusWall({ x: 14.18, y: 2.2, z: -20.5, rotY: -PI / 2, cols: 10, rows: 5, tile: 0.5, gap: 0.04, start: ctx.wallStart(4460, 50), pieces: ctx.all, backing: wall });
    /* what the bowl knows */
    const src = { name: 'Arthur Ashe Stadium, Wikipedia', url: 'https://en.wikipedia.org/wiki/Arthur_Ashe_Stadium' };
    k.egg(v(0, 1.2, 0), { id: 'opened-1997', title: 'Opening night', year: '1997', text: 'The stadium opened on August 25, 1997. The first match here was Tamarine Tanasugarn of Thailand against Chanda Rubin of the United States, which Tanasugarn won in two sets, and Whitney Houston sang at the opening ceremony.', clue: 'Stand at the net and think about who hit the first ball over it.', source: src }, { r: 3 });
    k.egg(v(12, 2.2, 22), { id: 'largest', title: 'Twenty three thousand seven hundred and seventy one', text: 'With 23,771 seats this is the largest tennis stadium in the world. It opened with 22,547 and grew when the roof went on. Rossetti designed the bowl; it cost about 254 million dollars to build.', clue: 'Count the seats. Give up. Count the rows instead.', source: src }, { r: 2.6 });
    k.egg(v(0, RY - 2, 0), { id: 'roof-2016', title: 'The roof that opens', year: '2016', text: 'The retractable roof was finished in 2016 as part of a 550 million dollar renovation of the tennis centre; the roof itself cost about 150 million. It is two fabric panels of about 800 tons each, and tonight they are open.', clue: 'Look straight up at the one part of the building that moves.', source: src }, { r: 6 });
    k.egg(v(-12, 2, -22), { id: 'arthur-ashe', title: 'The name over the door', year: '1968', text: 'Arthur Ashe, 1943 to 1993, won the first US Open in 1968, the first in which professionals could compete, and the stadium carries his name.', clue: 'The whole building is named for one match in 1968.', source: src }, { r: 2.6 });
    k.egg(v(0, 0.4, -6), { id: 'blue-2005', title: 'Why the court is blue', year: '2005', text: 'The surface is Laykold, which replaced DecoTurf in 2005: electric blue inside the lines and light green outside them, so the ball reads on television.', clue: 'Look down at the colour of the ground and ask when it changed.', source: src }, { r: 3 });
    return { mounts, spawn: v(12, 3, 2), look: v(0, 2.4, -12), eye: 3, bounds: [-13.9, 13.9, -24.1, 24.1], style: 'steel' };
  },
};

/* ---------------- 143 FIFTY SEVEN HORSES ---------------- */
export const carousel: RoomDef = {
  id: 'carousel',
  name: 'Fifty seven horses',
  area: 'THE CENTRAL PARK CAROUSEL / MID PARK AT 64TH',
  mood: 'Three quarter time, all afternoon',
  color: '#d84a3a',
  description: 'A 1908 carousel found in a Coney Island trolley terminal and set down in Central Park in 1951 under an octagon of brick: fifty seven hand carved horses, two chariots, a band organ playing waltzes, and a quarter of a million riders a year. The New Yorkers hang on the six brick walls around the turning platform and outside on the two that face the path, so the horses pass every one of them once a minute.',
  signatures: 'The brick pavilion with its eight sides, arched entrances and pyramid roof, the turning platform with three rows of jumpers and standers, the poles, the sweeps, the rounding board of bulbs and mirrors, the centre drum with the A. Ruth & Sohn band organ, the ticket booth, and the park path and plane trees around it.',
  build(k, ctx) {
    k.sky({ top: 0x5a8fd8, horizon: 0xdbe8f2, ground: 0x4a6a3a, fog: 0.004, sun: { az: 3.9, el: 0.5, color: 0xfff2d8, size: 9 }, env: 0.75 });
    k.hemi(0xcfe0ff, 0x4a5a3a, 1.3);
    k.sun(0xfff0d8, 2.2, 30, 60, 20, true, 50);
    /* 2026-11-24 wave 8a: the brick, the floor, the platform boards and the boarded ceiling are Poly Haven scans (tex/carousel/) */
    const brick = w8Scan(k, 'carousel', 'red_brick_03', 2.2, () => X.brick(0x8a4a3a, 41), { color: 0xd8b0a0, roughness: 0.85 }, 0x7a4a3a),
      brickDark = w8Scan(k, 'carousel', 'red_brick_03', 2.2, () => X.brick(0x6a3a2e, 42), { color: 0x9c7468, roughness: 0.85 }, 0x5a3a2e, 'd'),
      floor = w8Scan(k, 'carousel', 'brick_pavement_02', 2.4, () => X.pavers(0x8a8478, 43), { color: 0xc8bcb0, roughness: 0.8 }, 0x7a7068),
      grass = k.pbr('cpGrass', X.grass(0x4b6b3a, 44), 0.35, { roughness: 1 }),
      path = w8Scan(k, 'carousel', 'brick_pavement_02', 2.8, () => X.pavers(0x9a948a, 45), { color: 0xb8aca0, roughness: 0.8 }, 0x8a8278, 'p'),
      planks = w8Scan(k, 'carousel', 'oak_wood_planks', 1.6, () => X.planks(0x8a6a44, 8, 46), { color: 0xc89a6a, roughness: 0.5 }, 0x7a5a3a),
      roof = w8Scan(k, 'carousel', 'roof_planks', 2.0, () => X.planks(0x4a3d34, 8, 47), { color: 0xb08868, roughness: 0.85, side: T.DoubleSide }, 0x4a3d34), wood = k.flat(0x5a4632, 0, 0.8), white = k.flat(0xf2efe6, 0, 0.6),
      red = k.flat(0xb8222a, 0.1, 0.5), cream = k.flat(0xf4e8c8, 0.05, 0.5), gilt = k.pbr('cpGilt', X.gilt(), 2, { metalness: 0.85, roughness: 0.32 }),
      brass = k.flat(0xc9a25a, 0.9, 0.35), glass = k.glass(0xcfe6f2, 0.3, 0.1), iron = k.flat(0x1c1e22, 0.6, 0.45),
      canopy = k.flat(0xb8222a, 0.05, 0.6, { side: T.DoubleSide }), stripe = k.flat(0xf4e8c8, 0.05, 0.6, { side: T.DoubleSide });
    /* the park: grass, the path ring, plane trees, benches, a booth by the front door */
    k.box(200, 0.3, 200, 0, -0.16, 0, grass);
    k.cyl(24, 0.08, 0, -0.02, 0, path, 24, 40);
    const A = 14, R = A / Math.cos(PI / 8);
    k.cyl(R + 0.4, 0.14, 0, 0.0, 0, floor, R + 0.4, 8);
    const rnd = X.mulberry(1908);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2 + rnd() * 0.3, r = 27 + rnd() * 10; k.tree(Math.cos(a) * r, 0, Math.sin(a) * r, { h: 8 + rnd() * 4, r: 3.6 + rnd() * 1.6, kind: 'round', seed: i, leaf: 0x2f5a2a, species: i % 3 ? 'plane' : 'elm' }); }
    /* 2026-11-24 wave 8a: Central Park's own slatted benches and its lampposts, real models (our cast, tex/props carousel) */
    { const bAt: number[][] = [], lAt: number[][] = [];
      for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2 + 0.5; bAt.push([Math.cos(a) * 21.5, 0, Math.sin(a) * 21.5, -a - PI / 2]); k.keepOut.push({ x: Math.cos(a) * 21.5, z: Math.sin(a) * 21.5, r: 1.1 }); }
      for (let i = 0; i < 4; i++) { const a = (i / 4) * PI * 2 + PI / 4; lAt.push([Math.cos(a) * 22.5, 0, Math.sin(a) * 22.5, 0]); k.point(Math.cos(a) * 22.5, 3.9, Math.sin(a) * 22.5, 0xffd7a0, k.night > 0.5 ? 70 : 20, 14); k.keepOut.push({ x: Math.cos(a) * 22.5, z: Math.sin(a) * 22.5, r: 0.4 }); }
      w8Place(k, 'carousel/cp_bench', { width: 2.2 }, bAt); w8Place(k, 'carousel/cp_gaslamp', { height: 4.2 }, lAt); void wood; }
    /* the pavilion: eight sides, two of them open, six carrying the works; a clerestory over each solid wall */
    const faces: { a: number; c: T.Vector3; tg: T.Vector3; open: boolean }[] = [];
    for (let i = 0; i < 8; i++) {
      const a = PI / 8 + (i * PI) / 4, c = v(Math.cos(a), 0, Math.sin(a)), tg = v(-Math.sin(a), 0, Math.cos(a)), open = i === 0 || i === 4;
      faces.push({ a, c, tg, open });
      const W = 2 * A * Math.tan(PI / 8), rot = -a - PI / 2;
      if (!open) {
        k.box(W, 3.8, 0.5, c.x * A, 1.9, c.z * A, brick).rotation.y = rot;
        k.box(W, 1.1, 0.12, c.x * A, 4.35, c.z * A, glass).rotation.y = rot;
        for (let s = -W / 2 + 1.45; s < W / 2; s += 1.45) k.box(0.14, 1.1, 0.4, c.x * A + tg.x * s, 4.35, c.z * A + tg.z * s, brickDark).rotation.y = rot;
        k.box(W, 0.36, 0.6, c.x * A, 5.08, c.z * A, brickDark).rotation.y = rot;
        for (let s = -W / 2 + 0.6; s <= W / 2 - 0.6; s += 1.1) k.keepOut.push({ x: c.x * A + tg.x * s, z: c.z * A + tg.z * s, r: 0.85 });
      } else {
        const arch = k.arch(5.6, 4.2, 0.5, c.x * A, 0, c.z * A, brick, false, W / (2 * 5.6));
        arch.rotation.y = rot;
        k.box(W, 0.36, 0.6, c.x * A, 5.08, c.z * A, brickDark).rotation.y = rot;
        for (const s of [-5.2, -4.2, -3.3, 3.3, 4.2, 5.2]) k.keepOut.push({ x: c.x * A + tg.x * s, z: c.z * A + tg.z * s, r: 0.9 });
      }
    }
    for (let j = 0; j < 8; j++) { const a = (j * PI) / 4; k.box(1.3, 5.7, 1.3, Math.cos(a) * R, 2.85, Math.sin(a) * R, brickDark).rotation.y = -a; k.keepOut.push({ x: Math.cos(a) * R, z: Math.sin(a) * R, r: 1.0 }); }
    k.cyl(R + 2.4, 0.5, 0, 5.5, 0, wood, R + 2.4, 8);
    k.cyl(R + 2.6, 6.2, 0, 5.75 + 3.1, 0, roof, 0.7, 8);
    for (let j = 0; j < 8; j++) { const a = (j * PI) / 4; k.beam(v(Math.cos(a) * (R + 2.2), 5.8, Math.sin(a) * (R + 2.2)), v(0, 11.9, 0), 0.16, wood, 6); }
    k.cyl(2.4, 2.2, 0, 12.9, 0, white, 2.4, 8);
    for (let j = 0; j < 8; j++) { const a = (j * PI) / 4 + PI / 8; k.box(1.2, 1.3, 0.1, Math.cos(a) * 2.25, 12.9, Math.sin(a) * 2.25, glass).rotation.y = PI / 2 - a; }
    k.cyl(2.9, 1.8, 0, 14.9, 0, roof, 0.15, 8);
    for (let j = 0; j < 4; j++) { const a = (j * PI) / 2 + PI / 4; k.point(Math.cos(a) * 8.5, 7.2, Math.sin(a) * 8.5, 0xffe4b8, k.night > 0.5 ? 160 : 75, 26); }
    k.point(0, 4.9, 0, 0xffe4b8, k.night > 0.5 ? 90 : 50, 16);
    /* the ticket booth outside the front arch, and the line for it */
    const f0 = faces[0];
    k.box(2.2, 2.7, 2.0, f0.c.x * 19.5 + f0.tg.x * 3.5, 1.35, f0.c.z * 19.5 + f0.tg.z * 3.5, brick).rotation.y = -f0.a - PI / 2;
    k.box(2.5, 0.3, 2.3, f0.c.x * 19.5 + f0.tg.x * 3.5, 2.85, f0.c.z * 19.5 + f0.tg.z * 3.5, red).rotation.y = -f0.a - PI / 2;
    k.keepOut.push({ x: f0.c.x * 19.5 + f0.tg.x * 3.5, z: f0.c.z * 19.5 + f0.tg.z * 3.5, r: 1.8 });
    { const f = faces[0], rot = PI / 2 - f.a; w8Sign(k, 'THE CENTRAL PARK CAROUSEL', 8.6, 0.72, f.c.x * (A + 0.32), 5.08, f.c.z * (A + 0.32), rot, '#f4e8c8', '#8a1a1a', 'W2 Archivo Expanded', false, 0.56, '#c9a25a');
      w8Sign(k, 'MICHAEL FRIEDSAM MEMORIAL CAROUSEL', 2.6, 0.5, f.c.x * (A + 0.27) + f.tg.x * 4.3, 2.4, f.c.z * (A + 0.27) + f.tg.z * 4.3, rot, '#2a1a0a', '#b08a4a', 'W2 Archivo Narrow', false, 0.42, '#6a4a2a'); }
    k.sign('TICKETS', 1.4, 0.4, f0.c.x * 18.35 + f0.tg.x * 3.5, 2.3, f0.c.z * 18.35 + f0.tg.z * 3.5, '#f4e8c8', '#8a1a1a', 150, PI / 2 - f0.a + PI);
    if (!ctx.reduced) {
      k.crowd([v(f0.c.x * 19 + f0.tg.x * 1.2, 0, f0.c.z * 19 + f0.tg.z * 1.2), v(f0.c.x * 17 + f0.tg.x * 0.4, 0, f0.c.z * 17 + f0.tg.z * 0.4), v(f0.c.x * 15.2, 0, f0.c.z * 15.2), v(f0.c.x * 11.5, 0, f0.c.z * 11.5)], 12, { seed: 12, speed: 0.12, spread: 0.9, colors: [0xe83a5a, 0x3a8ae8, 0xf0d24a, 0x2a2a34, 0xe8e2d4, 0x8a4ad8] });
      k.crowd(Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * PI * 2; return v(Math.cos(a) * 23, 0, Math.sin(a) * 23); }), 22, { seed: 13, speed: 0.4, spread: 1.6, closed: true });
    }
    /* the carousel itself: one group that turns, everything on it instanced */
    const rig = new T.Group(); k.add(rig);
    const PR = 8.3;
    const plat = new T.Mesh(new T.CylinderGeometry(PR, PR, 0.36, 48), planks); plat.position.y = 0.32; rig.add(plat);
    const rim = new T.Mesh(new T.CylinderGeometry(PR + 0.08, PR + 0.08, 0.42, 48, 1, true), red); rim.position.y = 0.32; rig.add(rim);
    const step = new T.Mesh(new T.CylinderGeometry(PR + 0.5, PR + 0.5, 0.16, 48), wood); step.position.y = 0.08; rig.add(step);
    k.keepOut.push({ x: 0, z: 0, r: PR + 0.9 });
    /* the horse, once: boxes for the body, neck, head, legs and tail, merged into one geometry */
    const part = (w: number, h: number, d: number, x: number, y: number, z: number, rz = 0) => { const g = new T.BoxGeometry(w, h, d); g.rotateZ(rz); g.translate(x, y, z); return g; };
    const horseGeo = mergeGeometries([
      part(1.35, 0.5, 0.42, 0, 1.05, 0), part(0.5, 0.6, 0.28, 0.62, 1.42, 0, -0.6), part(0.5, 0.24, 0.24, 0.98, 1.66, 0, 0.25),
      part(0.08, 0.16, 0.06, 0.92, 1.84, 0.08), part(0.08, 0.16, 0.06, 0.92, 1.84, -0.08),
      part(0.12, 0.62, 0.12, 0.5, 0.55, 0.14, 0.55), part(0.12, 0.62, 0.12, 0.5, 0.55, -0.14, 0.55),
      part(0.12, 0.62, 0.12, -0.5, 0.55, 0.14, -0.55), part(0.12, 0.62, 0.12, -0.5, 0.55, -0.14, -0.55),
      part(0.55, 0.12, 0.1, -0.88, 1.15, 0, 0.5),
    ])!;
    const saddleGeo = mergeGeometries([part(0.55, 0.12, 0.5, 0, 1.33, 0), part(0.5, 0.06, 0.06, 0.6, 1.62, 0, -0.6)])!;
    const chariotGeo = mergeGeometries([part(1.6, 0.6, 0.9, 0, 0.55, 0), part(0.14, 0.7, 0.9, -0.8, 1.05, 0), part(1.2, 0.08, 0.5, 0.1, 0.9, 0)])!;
    const NH = 57, rows = [7.0, 5.6, 4.2], per = [21, 19, 17];
    const horses = new T.InstancedMesh(horseGeo, new T.MeshStandardMaterial({ roughness: 0.5 }), NH);
    const saddles = new T.InstancedMesh(saddleGeo, new T.MeshStandardMaterial({ roughness: 0.5 }), NH);
    const poles = new T.InstancedMesh(new T.CylinderGeometry(0.035, 0.035, 5.2, 6), brass, NH);
    const riders = new T.InstancedMesh(figureGeo(0.13, 0.38, 0.86), new T.MeshStandardMaterial({ roughness: 0.85 }), NH);
    const chariots = new T.InstancedMesh(chariotGeo, gilt, 2);
    for (const o of [horses, saddles, poles, riders, chariots]) { o.frustumCulled = false; rig.add(o); }
    const hs: { a: number; r: number; jump: boolean; ph: number; rider: boolean; chariot: boolean }[] = [];
    {
      const c = new T.Color(), coats = [0xf4f0e8, 0xd8b070, 0x1c1a1c, 0x8a8a90, 0x8a4a2a, 0xe8d8c8, 0x5a3a2a, 0xc8c0b8], tack = [0xb8222a, 0x2a4a9a, 0x1f6a3a, 0xc9a25a, 0x6a2a8a], coats2 = [0xe83a5a, 0x3a8ae8, 0xf0d24a, 0x2a2a34, 0xe8e2d4, 0x8a4ad8, 0xff8c3b];
      let i = 0, standers = 0, ch = 0;
      rows.forEach((r, ri) => {
        for (let j = 0; j < per[ri]; j++) {
          const a = (j / per[ri]) * PI * 2 + ri * 0.11;
          const chariot = ri === 0 && (j === 5 || j === 16) && ch < 2;
          const stand = ri === 1 && j % 4 === 0 && standers < 5;
          if (stand) standers++;
          if (chariot) ch++;
          hs.push({ a, r, jump: !stand && !chariot, ph: rnd() * PI * 2, rider: rnd() > 0.45, chariot });
          horses.setColorAt(i, c.set(coats[i % coats.length])); saddles.setColorAt(i, c.set(tack[i % tack.length])); riders.setColorAt(i, c.set(coats2[Math.floor(rnd() * coats2.length)]));
          i++;
        }
      });
      const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), up = new T.Vector3(0, 1, 0);
      hs.forEach((h, i) => { q.setFromAxisAngle(up, -h.a - PI / 2); p.set(Math.cos(h.a) * h.r, 0.5 + 2.6, Math.sin(h.a) * h.r); m.compose(p, q, one); poles.setMatrixAt(i, m); });
      let ci = 0;
      hs.forEach((h) => { if (h.chariot) { q.setFromAxisAngle(up, -h.a - PI / 2); p.set(Math.cos(h.a) * h.r, 0.5, Math.sin(h.a) * h.r); m.compose(p, q, one); chariots.setMatrixAt(ci++, m); } });
      chariots.instanceMatrix.needsUpdate = poles.instanceMatrix.needsUpdate = true;
      if (horses.instanceColor) horses.instanceColor.needsUpdate = true;
      if (saddles.instanceColor) saddles.instanceColor.needsUpdate = true;
      if (riders.instanceColor) riders.instanceColor.needsUpdate = true;
      const hide = new T.Vector3(0.0001, 0.0001, 0.0001);
      /* 2026-10-28: the carved hero horse (h_carousel_horse, as v16.ts) instanced on the rig, one draw per part for all
         57; the box horses, saddles and plain poles go when it loads (it carries its own brass pole), riders stay */
      let steeds: ReturnType<typeof heroInstances> | null = null;
      const hq = new T.Quaternion(), hm = new T.Matrix4();
      const place = (t: number) => {
        hs.forEach((h, i) => {
          q.setFromAxisAngle(up, -h.a - PI / 2);
          const bob = h.jump ? 0.34 * Math.sin(t * 2.6 + h.ph) : 0;
          p.set(Math.cos(h.a) * h.r, 0.5 + bob, Math.sin(h.a) * h.r);
          m.compose(p, q, h.chariot ? hide : one); horses.setMatrixAt(i, m); saddles.setMatrixAt(i, m);
          if (steeds) { hq.setFromAxisAngle(up, -h.a); steeds.setAt(i, hm.compose(p, hq, h.chariot ? hide : one)); }
          p.y += h.chariot ? 0.6 : steeds ? 1.12 : 1.42;
          m.compose(p, q, h.rider ? one : hide); riders.setMatrixAt(i, m);
        });
        horses.instanceMatrix.needsUpdate = saddles.instanceMatrix.needsUpdate = riders.instanceMatrix.needsUpdate = true;
        steeds?.commit();
      };
      place(0);
      if (!ctx.reduced) k.ticks.push(place);
      void hero(k, 'h_carousel_horse_lo', { height: 1.95 }).then((g) => {
        if (!g) return;
        steeds = heroInstances(k, g, NH);
        for (const pt of steeds.parts) { rig.add(pt.im); pt.im.castShadow = false; } // 57 carved horses: their shadow pass would double the room
        horses.visible = saddles.visible = poles.visible = false;
        place(0);
      });
    }
    /* the top: canopy, rounding board, sweeps, a ring of chasing bulbs */
    const cone = new T.Mesh(new T.CylinderGeometry(0.4, 9.4, 2.7, 24, 1, true), canopy); cone.position.y = 6.35; rig.add(cone);
    for (let j = 0; j < 12; j++) { const st = new T.Mesh(new T.CylinderGeometry(0.4, 9.45, 2.7, 24, 1, true, (j / 12) * PI * 2, PI / 12), stripe); st.position.y = 6.36; rig.add(st); }
    /* 2026-11-24 wave 8a: the rounding board is painted, not plain red: scrolls, gilt cartouches and oval scenes round the
       ring, a stand in for the Firefly panels queued (ff_carousel_rounding.webp swaps in when it exists) */
    const boardTex = W8_DOM ? paintTex(2048, 128, (g) => {
      g.fillStyle = '#9a1c24'; g.fillRect(0, 0, 2048, 128);
      for (let j = 0; j < 8; j++) {
        const x0 = j * 256, cx = x0 + 128;
        g.strokeStyle = '#e9c46a'; g.lineWidth = 5; g.beginPath(); g.ellipse(cx, 64, 70, 44, 0, 0, PI * 2); g.stroke();
        const gr = g.createLinearGradient(cx, 24, cx, 104); gr.addColorStop(0, j % 2 ? '#8fc1e8' : '#f2c48a'); gr.addColorStop(0.6, j % 2 ? '#d8ecf6' : '#f8e2b8'); gr.addColorStop(1, j % 2 ? '#5a8a4a' : '#6a8a5a');
        g.fillStyle = gr; g.beginPath(); g.ellipse(cx, 64, 66, 40, 0, 0, PI * 2); g.fill();
        g.fillStyle = '#4a6a3a'; g.beginPath(); g.ellipse(cx - 20, 92, 40, 14, 0, 0, PI * 2); g.ellipse(cx + 26, 96, 34, 10, 0, 0, PI * 2); g.fill();
        g.strokeStyle = '#e9c46a'; g.lineWidth = 3;
        for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(cx + sx * 74, 64); g.bezierCurveTo(cx + sx * 96, 20, cx + sx * 118, 30, cx + sx * 112, 58); g.bezierCurveTo(cx + sx * 108, 84, cx + sx * 92, 76, cx + sx * 98, 64); g.stroke(); }
        g.fillStyle = '#e9c46a'; g.fillRect(x0, 4, 256, 6); g.fillRect(x0, 118, 256, 6);
      }
    }) : null;
    const boardM = boardTex ? new T.MeshStandardMaterial({ map: boardTex, roughness: 0.45, metalness: 0.1, side: T.DoubleSide }) : canopy;
    if (boardTex) { boardTex.wrapS = T.RepeatWrapping; boardTex.repeat.set(2, 1); if (w8L) w8L.load('assets/museum/tex/carousel/ff_carousel_rounding.webp', (t) => { if (!k.live) return; t.colorSpace = T.SRGBColorSpace; t.wrapS = T.RepeatWrapping; t.repeat.set(2, 1); boardM.map = t; boardM.needsUpdate = true; }, undefined, () => {}); }
    const board = new T.Mesh(new T.CylinderGeometry(9.5, 9.5, 0.95, 32, 1, true), boardM); board.position.y = 5.0; rig.add(board);
    for (const y of [4.55, 5.45]) { const tr = new T.Mesh(new T.TorusGeometry(9.52, 0.05, 6, 64), gilt); tr.rotation.x = PI / 2; tr.position.y = y; rig.add(tr); }
    for (let j = 0; j < 16; j++) { const a = (j / 16) * PI * 2; const mir = new T.Mesh(new T.PlaneGeometry(0.9, 0.6), k.flat(0xdfe8f0, 1, 0.08)); mir.position.set(Math.cos(a) * 9.53, 5.0, Math.sin(a) * 9.53); mir.rotation.y = PI / 2 - a; rig.add(mir); }
    for (let j = 0; j < 16; j++) {
      const a = (j / 16) * PI * 2, aa = v(Math.cos(a) * 2.5, 6.9, Math.sin(a) * 2.5), bb = v(Math.cos(a) * 9.3, 5.4, Math.sin(a) * 9.3);
      const sw = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, aa.distanceTo(bb), 6), brass); sw.position.copy(aa).add(bb).multiplyScalar(0.5); sw.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), bb.clone().sub(aa).normalize()); rig.add(sw);
    }
    /* bulbs down every sweep and round the canopy's eaves, all on the rig, one draw */
    { const at: T.Matrix4[] = []; for (let j = 0; j < 16; j++) { const a = (j / 16) * PI * 2 + PI / 16; for (let u = 0.15; u < 0.96; u += 0.12) { const r = 2.5 + (9.3 - 2.5) * u, y = 6.9 + (5.4 - 6.9) * u - 0.14; at.push(new T.Matrix4().makeTranslation(Math.cos(a) * r, y, Math.sin(a) * r)); } } const sb = new T.InstancedMesh(new T.SphereGeometry(0.075, 6, 5), new T.MeshBasicMaterial({ color: 0xffe2a0 }), at.length); at.forEach((m, i) => sb.setMatrixAt(i, m)); sb.frustumCulled = false; rig.add(sb); }
    const NB = 96;
    const bulbs = new T.InstancedMesh(new T.SphereGeometry(0.1, 6, 5), new T.MeshBasicMaterial({ color: 0xffffff }), NB);
    { const m = new T.Matrix4(), c = new T.Color(); for (let j = 0; j < NB; j++) { const a = (j / NB) * PI * 2; m.setPosition(Math.cos(a) * 9.58, 5.62, Math.sin(a) * 9.58); bulbs.setMatrixAt(j, m); bulbs.setColorAt(j, c.set(0xffd27a)); } bulbs.instanceMatrix.needsUpdate = true; }
    bulbs.frustumCulled = false; rig.add(bulbs);
    /* the centre: a drum that stays put, with the band organ facing the front door */
    k.cyl(2.5, 4.3, 0, 2.15, 0, cream);
    /* the one illusion: a zoetrope band round the top of the drum. Twelve frames of a galloping horse painted side by side
       and stepped one frame at a time, so a horse that is only ever twelve still pictures runs round the drum */
    if (W8_DOM) {
      const F = 12, zt = paintTex(1536, 128, (g) => {
        g.fillStyle = '#1a0e08'; g.fillRect(0, 0, 1536, 128);
        for (let f = 0; f < F; f++) {
          const cx = f * 128 + 64, ph = (f / F) * PI * 2, lift = 6 * Math.abs(Math.sin(ph));
          g.fillStyle = '#f4e8c8'; g.strokeStyle = '#f4e8c8'; g.lineCap = 'round';
          g.beginPath(); g.ellipse(cx, 62 - lift, 30, 13, 0, 0, PI * 2); g.fill();
          g.lineWidth = 9; g.beginPath(); g.moveTo(cx + 22, 56 - lift); g.lineTo(cx + 36, 36 - lift); g.stroke();
          g.beginPath(); g.ellipse(cx + 42, 34 - lift, 11, 6, -0.5, 0, PI * 2); g.fill();
          g.lineWidth = 4; g.beginPath(); g.moveTo(cx - 28, 58 - lift); g.quadraticCurveTo(cx - 44, 60 - lift + 8 * Math.sin(ph), cx - 46, 76 - lift); g.stroke();
          g.lineWidth = 6;
          const leg = (x: number, a: number) => { g.beginPath(); g.moveTo(cx + x, 70 - lift); const kx = cx + x + Math.sin(a) * 14, ky = 86 - lift; g.lineTo(kx, ky); g.lineTo(kx + Math.sin(a + 0.8) * 10, 104 - lift * 0.5); g.stroke(); };
          leg(18, ph); leg(12, ph + 0.7); leg(-18, ph + PI); leg(-24, ph + PI + 0.7);
          g.fillStyle = '#c9a25a'; g.fillRect(f * 128, 0, 3, 128); g.fillRect(f * 128, 0, 128, 4); g.fillRect(f * 128, 124, 128, 4);
        }
      }, []);
      zt.wrapS = T.RepeatWrapping; zt.repeat.set(1 / F * 6, 1);
      const zm = new T.MeshBasicMaterial({ map: zt, side: T.DoubleSide });
      const zband = k.mesh(new T.CylinderGeometry(2.56, 2.56, 0.5, 48, 1, true), zm, 0, 3.86, 0, true);
      zband.material = zm;
      if (!ctx.reduced) k.ticks.push((t) => { zt.offset.x = (Math.floor(t * 12) % F) / F; });
    } else k.cyl(2.56, 0.5, 0, 3.86, 0, cream);
    k.egg(v(Math.cos(faces[2].a) * 10.2, 3.6, Math.sin(faces[2].a) * 10.2), { id: 'zoetrope', title: 'The horse that only seems to run', year: '1834', text: 'The band round the top of the drum is a zoetrope: twelve still drawings of one horse at twelve moments of its stride, shown one after another fast enough that your eye fills the gaps and sees it gallop. William Horner described the device in 1834. In 1878 Eadweard Muybridge photographed a running horse with a row of cameras to settle whether all four hooves leave the ground at once; they do.', clue: 'Look over the horses at the top of the drum in the middle and count the frames.', source: { name: 'Zoetrope, Wikipedia', url: 'https://en.wikipedia.org/wiki/Zoetrope' } }, { r: 2.4 });
    k.cyl(2.72, 0.3, 0, 4.45, 0, gilt);
    k.cyl(2.72, 0.2, 0, 0.42, 0, gilt);
    for (let j = 0; j < 8; j++) { const a = (j * PI) / 4 + PI / 8; k.box(1.5, 2.4, 0.08, Math.cos(a) * 2.53, 2.3, Math.sin(a) * 2.53, red).rotation.y = PI / 2 - a; k.box(1.2, 2.0, 0.06, Math.cos(a) * 2.58, 2.3, Math.sin(a) * 2.58, k.flat(0xdfe8f0, 1, 0.08)).rotation.y = PI / 2 - a; }
    const oa = f0.a, oc = v(Math.cos(oa), 0, Math.sin(oa)), ot = v(-Math.sin(oa), 0, Math.cos(oa));
    k.box(2.8, 2.6, 0.5, oc.x * 2.7, 1.8, oc.z * 2.7, gilt).rotation.y = PI / 2 - oa;
    k.box(2.9, 0.3, 0.6, oc.x * 2.7, 3.2, oc.z * 2.7, red).rotation.y = PI / 2 - oa;
    for (let j = 0; j < 9; j++) { const s = (j - 4) * 0.26, h = 0.7 + 0.5 * Math.abs(Math.cos(j * 0.9)); k.cyl(0.055, h, oc.x * 2.98 + ot.x * s, 2.1 + h / 2, oc.z * 2.98 + ot.z * s, brass); }
    const ringer = (s: number) => {
      const g = new T.Group(); g.position.set(oc.x * 3.05 + ot.x * s, 0.95, oc.z * 3.05 + ot.z * s); g.rotation.y = PI / 2 - oa;
      const b = new T.Mesh(new T.CapsuleGeometry(0.12, 0.34, 3, 8), k.flat(0x2a4a9a, 0, 0.7)); b.position.y = 0.3; g.add(b);
      const hd = new T.Mesh(new T.SphereGeometry(0.1, 8, 6), k.flat(0xe9c2a0, 0, 0.7)); hd.position.y = 0.66; g.add(hd);
      const arm = new T.Group(); arm.position.set(0.14, 0.5, 0); g.add(arm);
      const ar = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 0.36, 5), k.flat(0x2a4a9a, 0, 0.7)); ar.position.y = 0.18; arm.add(ar);
      const bell = new T.Mesh(new T.CylinderGeometry(0.08, 0.05, 0.1, 10), brass); bell.position.y = 0.4; arm.add(bell);
      k.add(g); return arm;
    };
    const arms = [ringer(-1.05), ringer(1.05)];
    k.egg(v(oc.x * 3.2, 2.0, oc.z * 3.2), { id: 'organ', title: 'The band organ', text: 'The music is a 52 keyless A. Ruth & Sohn Model 33 band organ, playing waltzes, marches and polkas from perforated card, the way it has since the carousel came to the park.', clue: 'Find the pipes in the middle and the two who ring the bells.', source: { name: 'Central Park Carousel, Wikipedia', url: 'https://en.wikipedia.org/wiki/Central_Park_Carousel' } }, { r: 2 });
    /* the turn: five and a half times a minute, bulbs chasing, bells on the downbeat */
    if (!ctx.reduced) {
      const c = new T.Color();
      k.ticks.push((t) => {
        rig.rotation.y = t * 0.34;
        const step = Math.floor(t * 6);
        for (let j = 0; j < NB; j++) bulbs.setColorAt(j, c.set((j + step) % 3 === 0 ? 0xfff2c0 : (j + step) % 3 === 1 ? 0xffb43a : 0x5a3a1a));
        if (bulbs.instanceColor) bulbs.instanceColor.needsUpdate = true;
        const beat = (t * 3) % 3;
        arms[0].rotation.z = beat < 1 ? -0.9 * Math.sin(beat * PI) : 0;
        arms[1].rotation.z = beat >= 1 && beat < 2 ? 0.9 * Math.sin((beat - 1) * PI) : 0;
      });
    }
    /* the works: two on the inside of each brick wall, two more on the outside of the side walls */
    const mounts: Mount[] = [];
    for (const f of faces) {
      if (f.open) continue;
      for (const s of [-2.9, 2.9]) mounts.push({ position: v(f.c.x * (A - 0.27) + f.tg.x * s, 2.1, f.c.z * (A - 0.27) + f.tg.z * s), rotation: -f.a - PI / 2, target: v(f.c.x * (A - 3.6) + f.tg.x * s, 2.1, f.c.z * (A - 3.6) + f.tg.z * s), width: 2.4, height: 1.7, style: 'gilt', wash: true });
    }
    for (const fi of [2, 6]) { const f = faces[fi]; for (const s of [-2.9, 2.9]) mounts.push({ position: v(f.c.x * (A + 0.27) + f.tg.x * s, 2.1, f.c.z * (A + 0.27) + f.tg.z * s), rotation: PI / 2 - f.a, target: v(f.c.x * (A + 3.6) + f.tg.x * s, 2.1, f.c.z * (A + 3.6) + f.tg.z * s), width: 2.4, height: 1.7, style: 'gilt', wash: true }); }
    { const f = faces[4]; k.censusWall({ x: f.c.x * (A - 0.32), y: 4.4, z: f.c.z * (A - 0.32), rotY: -f.a - PI / 2, cols: 22, rows: 3, tile: 0.3, gap: 0.03, start: ctx.wallStart(4520, 66), pieces: ctx.all, backing: brickDark }); }
    /* what the horses know */
    const src = { name: 'Central Park Carousel, Wikipedia', url: 'https://en.wikipedia.org/wiki/Central_Park_Carousel' };
    k.egg(v(Math.cos(faces[1].a) * 10.5, 1.6, Math.sin(faces[1].a) * 10.5), { id: 'stein-goldstein-1908', title: 'Fifty seven, carved by hand', year: '1908', text: 'Solomon Stein and Harry Goldstein made the carousel in 1908. It carries 57 hand carved horses, 52 jumpers and 5 standers, and two chariots.', clue: 'Count the horses that do not go up and down. There are five.', source: src }, { r: 2.6 });
    k.egg(v(0, 0.6, 0), { id: 'mule-1871', title: 'The mule under the floor', year: '1871', text: 'The first carousel on this spot, in 1871, was powered by a mule or a horse walking under the platform, told to start and stop by the operator tapping his foot on the boards.', clue: 'The oldest engine here was alive, and it worked in the dark.', source: src }, { r: 3.2 });
    k.egg(v(Math.cos(faces[3].a) * 10.5, 1.6, Math.sin(faces[3].a) * 10.5), { id: 'fires', title: 'Twice burned', year: '1924 and 1950', text: 'The two carousels that followed the mule powered one were both destroyed by fire, in 1924 and again in 1950.', clue: 'Brick walls, this time.', source: src }, { r: 2.6 });
    k.egg(v(Math.cos(faces[5].a) * 10.5, 1.6, Math.sin(faces[5].a) * 10.5), { id: 'coney-terminal', title: 'Found in a trolley barn', year: '1951', text: 'This carousel first ran in a trolley terminal in Coney Island, Brooklyn, until the 1940s. It was found there and moved to Central Park in 1951, with a new building put up around it.', clue: 'The horses commuted here from Brooklyn.', source: src }, { r: 2.6 });
    k.egg(v(Math.cos(faces[7].a) * 10.5, 1.6, Math.sin(faces[7].a) * 10.5), { id: 'riders', title: 'A quarter of a million a year', text: 'Open seven days a week when the weather allows, the carousel takes around 250,000 riders a year. Its official name is the Michael Friedsam Memorial Carousel.', clue: 'The name on the plaque is not Stein or Goldstein.', source: src }, { r: 2.6 });
    return { mounts, spawn: v(f0.c.x * 11.5, 3, f0.c.z * 11.5), look: v(0, 3.2, 0), eye: 3, bounds: [-19, 19, -19, 19], style: 'gilt' };
  },
};

/* ---------------- 144 OCEAN WONDERS ---------------- */
export const sharks: RoomDef = {
  id: 'sharks',
  name: 'Ocean Wonders',
  area: 'NEW YORK AQUARIUM / CONEY ISLAND',
  mood: 'Blue, and something circling',
  color: '#1f7fc8',
  daylit: false,
  description: 'The oldest aquarium in the country, on the boardwalk since 1957, and its biggest room since the hurricane: seven hundred and eighty four thousand gallons behind one long window, a wreck on the sand, sand tigers circling, rays flying over the glass tunnel, and a school of silver that turns as one. The New Yorkers hang on the dark wall opposite the window, lit by the water.',
  signatures: 'The long acrylic window into Ocean Wonders: Sharks!, the walk through tunnel, the shipwreck and the reef, sand tiger sharks, cownose rays and a bait ball, light rays and caustics on the sand, bubbles from the aerators, and the dark hall with its benches facing the water.',
  build(k, ctx) {
    k.sky({ top: 0x03111f, horizon: 0x0a2a48, ground: 0x02090f, fog: 0.016, stars: 0, env: 0.35 });
    k.hemi(0x3a80c0, 0x061018, 1.4);
    k.sun(0x9ad0ff, 0.9, 10, 40, -20, false);
    /* 2026-11-24 wave 8a: the tank sand, the hall's terrazzo and its board formed walls are Poly Haven scans (tex/sharks/) */
    const sand = w8Scan(k, 'sharks', 'coast_sand_01', 3, () => X.concrete(0xb8a88a, 51), { color: 0x9ab0b8, roughness: 1 }, 0x6a7a80), rock = k.flat(0x3e4a52, 0, 0.95), rock2 = k.flat(0x5a5248, 0, 0.95),
      hallFloor = w8Scan(k, 'sharks', 'terrazzo_tiles', 2.4, () => X.terrazzo(0x2a2f36, 52), { color: 0x4a5462, roughness: 0.35 }, 0x22272e),
      hallWall = w8Scan(k, 'sharks', 'concrete_wall_008', 3, () => X.plaster(0x1c2430, 53), { color: 0x34445a, roughness: 0.9 }, 0x1c2430),
      dark = k.flat(0x0b0e14, 0.3, 0.7), glass = k.glass(0x8fd4ff, 0.14, 0.05), rust = k.flat(0x4a3428, 0.3, 0.9), wood = k.flat(0x3a2e24, 0, 0.8), silver = k.flat(0xc8d2dc, 0.6, 0.35),
      sharkSkin = k.flat(0x6b7480, 0.1, 0.8), raySkin = k.flat(0x4a4038, 0.05, 0.85);
    /* the hall: forty six metres of dark floor, the glass on one side, the works on the other */
    k.box(46.5, 0.3, 9.5, 1, -0.15, 4.5, hallFloor);
    k.box(46.5, 0.4, 9.5, 1, 7.2, 4.5, dark);
    k.box(46.5, 7, 0.5, 1, 3.5, 9.25, hallWall);
    k.box(0.5, 7, 9.5, -22.25, 3.5, 4.5, hallWall);
    k.box(0.5, 7, 8.5, 24.25, 3.5, 5.25, hallWall);
    k.block(-23, 25, 9, 10); k.block(-23, -22, 0, 10); k.block(24, 25, 0.5, 10);
    k.block(-40, 20, -40, 0.5); k.block(24, 40, -40, 0.5); k.block(19, 25, -17, -16);
    for (const x of [-16, -6, 4, 14]) k.bench(x, 5.6, PI / 2, wood, dark, 2.4);
    k.box(41.8, 0.05, 0.12, -1.1, 0.02, 0.62, k.glow(0x6ac8ff, 0.7));
    k.sign('OCEAN WONDERS:  SHARKS!', 9, 0.8, 1, 6.4, 8.95, 'transparent', '#bfe3ff', 58, PI);
    /* the window: five panels of acrylic in a black frame, the sill at the floor */
    k.plane(41.8, 6.6, -1.1, 3.3, 0.02, glass);
    for (let i = 0; i <= 5; i++) k.box(0.3, 6.8, 0.4, -22 + i * 8.36, 3.4, 0, dark);
    k.box(42.4, 0.4, 0.5, -1.1, 6.8, 0, dark);
    k.box(42.4, 0.5, 0.7, -1.1, 0.25, 0.2, dark);
    /* the tunnel at the east end: down a ramp and into the tank under a half pipe of acrylic */
    const floorY = (x: number, z: number) => (x > 20 && z < 0 ? -3 * Math.min(1, -z / 4) : 0);
    k.box(4.4, 0.3, 14.2, 22, -3.15, -9.1, hallFloor);
    { const rp = k.box(4.4, 0.3, 5.1, 22, -1.5, -2, hallFloor); rp.rotation.x = Math.atan2(3, 4); }
    for (const x of [19.85, 24.15]) k.plane(4.4, 6.5, x, 0.2, -2, glass, PI / 2);
    { const g = new T.CylinderGeometry(2.45, 2.45, 14, 24, 1, true, PI / 2, PI); g.rotateX(PI / 2); k.mesh(g, glass, 22, -3, -9); }
    k.box(4.9, 0.3, 0.4, 22, -3.1, -16.1, dark);
    k.plane(4.6, 2.5, 22, -1.75, -16.05, glass);
    /* the tank: sand, rock, coral, weed, the wreck, and the light coming down through the water */
    k.box(90, 0.4, 50, 0, -4.2, -25, sand);
    /* 2026-11-24 wave 8a: the tank is closed, as it is in the building: a back and sides in a deep water gradient and a
       rippling surface overhead, so the water reads blue at any hour instead of the day sky showing through */
    {
      const g = new T.BoxGeometry(92, 14, 50), col: number[] = [], pa = g.attributes.position, top = new T.Color(0x3a8ab8), bot = new T.Color(0x031426), c = new T.Color();
      for (let i = 0; i < pa.count; i++) { c.copy(bot).lerp(top, Math.max(0, Math.min(1, (pa.getY(i) + 7) / 14)) ** 1.6); col.push(c.r, c.g, c.b); }
      g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
      const tank = k.mesh(g, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false }), 0, 2.6, -25.2, true); tank.castShadow = false; tank.receiveShadow = false;
      const surf = W8_DOM ? paintTex(256, 256, (q) => { q.fillStyle = '#2f7fb0'; q.fillRect(0, 0, 256, 256); const r = X.mulberry(5); q.strokeStyle = 'rgba(170,220,250,0.22)'; q.lineWidth = 2; for (let i = 0; i < 40; i++) { const x = r() * 256, y = r() * 256, w = 12 + r() * 30; q.beginPath(); q.ellipse(x, y, w, w * 0.6, r() * 3, 0, PI * 2); q.stroke(); } }) : null;
      if (surf) { surf.wrapS = surf.wrapT = T.RepeatWrapping; surf.repeat.set(10, 6); const sm = new T.MeshBasicMaterial({ map: surf, side: T.DoubleSide, fog: false, transparent: true, opacity: 0.75 }); const o = k.mesh(new T.PlaneGeometry(90, 48), sm, 0, 8.6, -25.2, true); o.rotation.x = PI / 2; if (!ctx.reduced) k.ticks.push((t) => { surf.offset.set(t * 0.01, Math.sin(t * 0.3) * 0.02); }); }
    }
    /* reef beds of real coast rock (Poly Haven CC0) behind the code boulders, and the wreck: a three master on her side */
    w8Place(k, 'sharks/ph_coast_rocks_01', { width: 34 }, [[-18, -4.3, -38, 0.3]], (h) => w8Tint(h, 0x5a6a72, 0.95, 0));
    w8Place(k, 'sharks/ph_coast_rocks_02', { width: 30 }, [[20, -4.3, -40, 2.1]], (h) => w8Tint(h, 0x5a6268, 0.95, 0));
    w8Place(k, 'sharks/ph_dutch_ship_medium', { width: 15 }, [[-14, -4.9, -24, 0.35]], (h) => { h.traverse((c) => { if (c instanceof T.Mesh && /sails/.test((c.material as T.Material).name)) c.visible = false; }); w8Tint(h, 0x5a6a62, 0.95, 0.05); }, (os) => { for (const o of os) { o.rotation.set(0.05, 0.35, 0.42); } });
    const rnd = X.mulberry(1896);
    const rocks: { x: number; y: number; z: number; r: number }[] = [];
    for (let i = 0; i < 26; i++) {
      const r = 0.8 + rnd() * 2.2, x = -36 + rnd() * 70, z = -5 - rnd() * 34;
      if (Math.abs(x - 22) < 4.5 && z > -18) continue;
      const o = k.sphere(r, x, -4 + r * 0.45, z, rnd() > 0.5 ? rock : rock2, 10); o.scale.set(1 + rnd() * 0.6, 0.6, 1 + rnd() * 0.5);
      rocks.push({ x, y: -4 + r * 0.45, z, r });
    }
    {
      const coral = k.instances(new T.ConeGeometry(0.16, 0.6, 5), new T.MeshStandardMaterial({ roughness: 0.8 }), Array.from({ length: 220 }, () => new T.Matrix4()));
      const c = new T.Color(), pal = [0xff7a3a, 0xff3a8a, 0xb84aff, 0xffd23a, 0x3affc8], m = new T.Matrix4(), p = new T.Vector3(), q = new T.Quaternion(), s = new T.Vector3();
      for (let i = 0; i < 220; i++) {
        const rk = rocks[i % rocks.length], a = rnd() * PI * 2, rr = rnd() * rk.r * 0.9;
        p.set(rk.x + Math.cos(a) * rr, rk.y + rk.r * 0.55 * Math.sqrt(Math.max(0, 1 - (rr / rk.r) ** 2)), rk.z + Math.sin(a) * rr);
        q.setFromEuler(new T.Euler((rnd() - 0.5) * 0.6, rnd() * 6, (rnd() - 0.5) * 0.6)); s.setScalar(0.7 + rnd() * 1.4);
        m.compose(p, q, s); coral.setMatrixAt(i, m); coral.setColorAt(i, c.set(pal[i % pal.length]));
      }
      coral.instanceMatrix.needsUpdate = true; if (coral.instanceColor) coral.instanceColor.needsUpdate = true;
      const weed = k.instances(new T.BoxGeometry(0.12, 3.2, 0.03), k.flat(0x2a6a3a, 0, 0.9, { side: T.DoubleSide }), Array.from({ length: 140 }, () => new T.Matrix4()));
      weed.frustumCulled = false;
      const ws = Array.from({ length: 140 }, () => ({ x: -38 + rnd() * 74, z: -6 - rnd() * 32, ph: rnd() * 6, h: 0.6 + rnd() * 0.9, ry: rnd() * 6 }));
      const e = new T.Euler();
      const place = (t: number) => { ws.forEach((w, i) => { e.set(0, w.ry, 0.22 * Math.sin(t * 0.9 + w.ph)); q.setFromEuler(e); p.set(w.x, -4 + 1.6 * w.h, w.z); s.set(1, w.h, 1); m.compose(p, q, s); weed.setMatrixAt(i, m); }); weed.instanceMatrix.needsUpdate = true; };
      place(0); if (!ctx.reduced) k.ticks.push(place);
    }
    {
      /* 2026-11-24 wave 8a: the code hull and ribs went; the wreck is the model above. Its spill of ribs stays, half buried */
      for (let i = 0; i < 4; i++) k.torus(1.6, 0.1, -6.5 + i * 1.4, -4.1, -21 + i * 0.4, rust, 14).rotation.set(0.2, 0.35, 0.5);
    }
    const rays: T.Mesh[] = [];
    for (let i = 0; i < 18; i++) {
      const x = -30 + i * 3.4 + rnd() * 2, z = -8 - rnd() * 18;
      const r = k.mesh(new T.PlaneGeometry(0.8 + rnd() * 0.6, 16), new T.MeshBasicMaterial({ color: 0x9fdcff, transparent: true, opacity: 0.03 + rnd() * 0.03, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }), x, 2, z, true);
      r.rotation.set(0.35 + rnd() * 0.2, 0, 0); rays.push(r);
    }
    const caus: T.Mesh[] = [];
    for (let i = 0; i < 5; i++) { const w = k.wash(-30 + i * 15, -3.94, -16 - (i % 2) * 8, 0, 16, 16, 0x9fdcff, 0.16); w.rotation.set(-PI / 2, 0, i); caus.push(w); }
    for (let i = 0; i < 6; i++) k.point(-30 + i * 12, 3, -14, 0x5ab8ff, 140, 30);
    k.point(22, 2, -9, 0x8ad0ff, 60, 14);
    k.point(1, 5.5, 5, 0x2a4a6a, 30, 20); k.point(-14, 5.5, 5, 0x3a5a7a, 26, 16); k.point(16, 5.5, 5, 0x3a5a7a, 26, 16);
    /* bubbles from the aerators on the sand */
    if (!ctx.reduced) vapour(k, [v(-24, -4, -14), v(-2, -4, -30), v(12, -4, -12), v(30, -4, -26)], 26, { rise: 11, spread: 0.6, size: 0.06, opacity: 0.35, colour: 0xdff4ff, seed: 7, speed: 0.16, animate: true });
    /* the sharks: seven sand tigers on closed splines, tails working, never touching the glass */
    const sharkHero = W8_DOM ? hero(k, 'sharks/ph_bronze_shark_statue', { length: 4.2 }).then((h) => { if (h) { w8Tint(h, 0x9a9488, 0.55, 0.05); h.traverse((c) => { if (c instanceof T.Mesh) c.castShadow = false; }); } return h; }) : null;
    const rayHero = W8_DOM ? hero(k, 'sharks/ph_bronze_ray_statue', { width: 3.4 }).then((h) => { if (h) { w8Tint(h, 0x6a6052, 0.6, 0.05); h.traverse((c) => { if (c instanceof T.Mesh) c.castShadow = false; }); } return h; }) : null;
    const mkShark = (scale: number) => {
      const g = new T.Group();
      const bg = new T.LatheGeometry([[0.02, -2.0], [0.15, -1.5], [0.3, -0.6], [0.37, 0.2], [0.31, 1.0], [0.18, 1.6], [0.03, 2.1]].map((p) => new T.Vector2(p[0], p[1])), 14); bg.rotateX(PI / 2);
      g.add(new T.Mesh(bg, sharkSkin));
      const dorsal = new T.Mesh(new T.BoxGeometry(0.06, 0.62, 0.7), sharkSkin); dorsal.position.set(0, 0.55, 0.15); dorsal.rotation.x = 0.35; g.add(dorsal);
      const dorsal2 = new T.Mesh(new T.BoxGeometry(0.05, 0.3, 0.4), sharkSkin); dorsal2.position.set(0, 0.36, -1.1); dorsal2.rotation.x = 0.35; g.add(dorsal2);
      for (const s of [-1, 1]) { const pec = new T.Mesh(new T.BoxGeometry(0.95, 0.05, 0.5), sharkSkin); pec.position.set(s * 0.55, -0.08, 0.5); pec.rotation.y = -s * 0.45; pec.rotation.z = s * 0.25; g.add(pec); }
      const tail = new T.Group(); tail.position.set(0, 0, -1.7); g.add(tail);
      const fin = new T.Mesh(new T.BoxGeometry(0.05, 1.15, 0.55), sharkSkin); fin.position.set(0, 0.15, -0.4); fin.rotation.x = 0.5; tail.add(fin);
      g.scale.setScalar(scale);
      k.add(g);
      /* 2026-11-24 wave 8a: the sand tiger is a real model (Poly Haven bronze shark, CC0, its stand cut off) in a sand tiger's
         brown grey; the code body hides when it lands, the group still rides and turns */
      if (sharkHero) void sharkHero.then((h) => { if (!h || !k.live) return; for (const ch of g.children) ch.visible = false; const c = h.clone(); c.position.y = -0.35; g.add(c); });
      return { g, tail };
    };
    const routes = [
      [v(-30, -1, -8), v(-10, 0, -30), v(15, -1, -34), v(28, 1, -14), v(10, -0.5, -4), v(-12, 0.5, -5)],
      [v(20, 2.2, -6), v(30, 1.4, -20), v(8, 3, -28), v(-20, 2.5, -24), v(-32, 1.5, -10), v(-8, 2.6, -5)],
      [v(24, -2, -12), v(24, -2.4, -24), v(0, -1.8, -36), v(-24, -2.5, -26), v(-26, -1.6, -10), v(-2, -2.2, -6)],
      [v(0, 4, -6), v(26, 3.5, -10), v(30, 4.5, -30), v(-10, 5, -34), v(-30, 4, -20)],
      [v(22, 0.5, -20), v(22, 0.8, -8), v(30, 1.2, -4), v(36, 0.6, -18), v(30, 0.4, -30)],
    ];
    if (!ctx.reduced) {
      const sh = [1.9, 1.5, 1.7, 1.3, 1.6, 1.45, 1.8].map((s, i) => { const o = mkShark(s); const r = routes[i % routes.length]; k.rider(o.g, k.spline(r, true), 1.3 + (i % 3) * 0.4, i * 17); return o; });
      const mkRay = () => {
        const g = new T.Group();
        const body = new T.Mesh(new T.SphereGeometry(0.34, 10, 8), raySkin); body.scale.set(1, 0.45, 1.6); g.add(body);
        const shape = (s: number) => { const sp = new T.Shape(); sp.moveTo(0, 0.7); sp.lineTo(s * 1.8, -0.1); sp.lineTo(0, -0.8); sp.closePath(); const gg = new T.ShapeGeometry(sp); gg.rotateX(PI / 2); return gg; };
        const wings = [-1, 1].map((s) => { const w = new T.Mesh(shape(s), k.flat(0x4a4038, 0.05, 0.85, { side: T.DoubleSide })); g.add(w); return w; });
        const tl = new T.Mesh(new T.CylinderGeometry(0.02, 0.05, 1.8, 5), raySkin); tl.rotation.x = PI / 2; tl.position.z = -1.6; g.add(tl);
        g.scale.setScalar(1.3); k.add(g);
        if (rayHero) void rayHero.then((h) => { if (!h || !k.live) return; for (const ch of g.children) ch.visible = false; g.add(h.clone()); });
        return { g, wings };
      };
      const rs = [0, 1, 2].map((i) => { const o = mkRay(); k.rider(o.g, k.spline([v(-20 + i * 8, 3.5, -6), v(10 + i * 6, 4.5, -12), v(18, 3.2, -26), v(-16, 2.8, -28), v(-34, 3.8, -14)], true), 1.1 + i * 0.2, i * 30); return o; });
      /* the bait ball: four hundred silver fish around a point that rides its own loop */
      const NF = 420, school = k.instances(new T.SphereGeometry(0.09, 5, 4), silver, Array.from({ length: NF }, () => new T.Matrix4()));
      school.frustumCulled = false;
      const lead = new T.Object3D(); k.add(lead);
      k.rider(lead, k.spline([v(-6, 2, -12), v(12, 1.5, -22), v(4, 3, -32), v(-22, 2.5, -30), v(-30, 1.2, -14)], true), 1.6, 0);
      const off = Array.from({ length: NF }, () => { const a = rnd() * PI * 2, b = Math.acos(2 * rnd() - 1), r = Math.cbrt(rnd()) * 3.2; return v(Math.sin(b) * Math.cos(a) * r, Math.cos(b) * r * 0.55, Math.sin(b) * Math.sin(a) * r); });
      const m = new T.Matrix4(), p = new T.Vector3(), s = new T.Vector3(1, 0.6, 2.4), q = new T.Quaternion();
      k.ticks.push((t) => {
        sh.forEach((o, i) => { o.tail.rotation.y = 0.42 * Math.sin(t * 3.0 + i * 1.3); o.g.rotation.z = 0.06 * Math.sin(t * 1.5 + i); });
        rs.forEach((o, i) => { o.wings[0].rotation.z = 0.5 * Math.sin(t * 1.8 + i); o.wings[1].rotation.z = -0.5 * Math.sin(t * 1.8 + i); });
        q.copy(lead.quaternion);
        for (let i = 0; i < NF; i++) { const o = off[i], w = 1 + 0.18 * Math.sin(t * 1.3 + i); p.set(lead.position.x + o.x * w, lead.position.y + o.y * w, lead.position.z + o.z * w); m.compose(p, q, s); school.setMatrixAt(i, m); }
        school.instanceMatrix.needsUpdate = true;
        rays.forEach((r, i) => { r.rotation.z = 0.08 * Math.sin(t * 0.5 + i); (r.material as T.MeshBasicMaterial).opacity = 0.028 + 0.028 * (0.5 + 0.5 * Math.sin(t * 0.8 + i * 1.7)); });
        caus.forEach((c, i) => { c.position.x += 0.004 * Math.sin(t * 0.4 + i); c.position.z += 0.004 * Math.cos(t * 0.3 + i); c.rotation.z = i + t * 0.02; });
      });
    } else { mkShark(1.7).g.position.set(-6, 1, -12); }
    /* 2026-11-24 wave 8a: species panels along the sill, lit from inside, in the house type; a painted plate over the west
       wall waits for its Firefly mural (ff_sharks_boardwalk.webp) */
    for (const [x, t] of [[-17, 'SAND TIGER SHARK  CARCHARIAS TAURUS'], [-6, 'COWNOSE RAY  RHINOPTERA BONASUS'], [5, 'ATLANTIC MENHADEN  THE BAIT BALL'], [14, 'THE WRECK  AND THE REEF']] as [number, string][]) {
      const sg = w8Sign(k, t, 3.2, 0.34, x, 0.62, 0.62, 0, '#bfe3ff', '#06121e', 'W2 JetBrains Mono', true, 0.5); sg.rotation.x = -0.9;
    }
    if (W8_DOM) { const ph = k.mesh(new T.PlaneGeometry(8.6, 2.6), k.flat(0x10202e, 0, 0.9), -21.98, 5.45, 4.6, true); ph.rotation.y = PI / 2; w8L?.load('assets/museum/tex/sharks/ff_sharks_boardwalk.webp', (t) => { if (!k.live) return; t.colorSpace = T.SRGBColorSpace; ph.material = new T.MeshStandardMaterial({ map: t, roughness: 0.85 }); }, undefined, () => {}); }
    /* the one illusion: the gallons written down the tunnel floor, long and thin, upright only from the top of the ramp */
    { const tx = w8Type('784,000 GALLONS', ['#bfe3ff']); if (tx) anamorphTex(k, tx, 22, -0.3, 3, -3, 0, 7.2, 3.4, 0.9, 0.85); }
    k.egg(v(22, -2.4, -12.5), { id: 'gallons-floor', title: 'Written for one eye', text: 'The words on the tunnel floor are painted long and thin along the way you walk, so that from the top of the ramp they stand up as if on a sign, and from anywhere else they lie flat. It is anamorphosis, the trick of Holbein\'s skull in The Ambassadors, 1533. The number is the real one: Ocean Wonders holds 784,000 gallons.', clue: 'Read the floor of the tunnel from the top of the ramp, then walk down it.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 2.4 });
    /* the works: the dark wall, and the two short walls */
    const mounts: Mount[] = [];
    for (const x of [-19.5, -14.5, -9.5, -4.5, 0.5, 5.5, 10.5, 15.5]) mounts.push({ position: v(x, 3.0, 8.98), rotation: PI, target: v(x, 3, 6.0), width: 2.6, height: 1.8, style: 'black', wash: true });
    for (const z of [3, 6.5]) { mounts.push({ position: v(-21.98, 3.0, z), rotation: PI / 2, target: v(-19, 3, z), width: 2.2, height: 1.55, style: 'black', wash: true }); mounts.push({ position: v(23.98, 3.0, z), rotation: -PI / 2, target: v(21, 3, z), width: 2.2, height: 1.55, style: 'black', wash: true }); }
    k.censusWall({ x: 20.6, y: 3.3, z: 8.96, rotY: PI, cols: 8, rows: 5, tile: 0.6, gap: 0.05, start: ctx.wallStart(4600, 40), pieces: ctx.all, backing: hallWall });
    /* what the water knows */
    const src = { name: 'New York Aquarium, Wikipedia', url: 'https://en.wikipedia.org/wiki/New_York_Aquarium' };
    k.egg(v(-14, 2.6, 4), { id: 'castle-garden-1896', title: 'It started at the Battery', year: '1896', text: 'The New York Aquarium opened in 1896 inside Castle Garden at the tip of Manhattan, the old immigration hall, and stayed there for forty five years.', clue: 'Before the boardwalk, the fish lived in a fort.', source: src }, { r: 2.6 });
    k.egg(v(4, 2.6, 4), { id: 'coney-1957', title: 'To Coney Island', year: '1957', text: 'The aquarium reopened on the boardwalk at Coney Island on June 6, 1957. It is the oldest continually operating aquarium in the United States and is run by the Wildlife Conservation Society.', clue: 'The oldest aquarium in the country is younger here than the Cyclone.', source: src }, { r: 2.6 });
    k.egg(v(22, -2, -9), { id: 'ocean-wonders-2018', title: 'Seven hundred and eighty four thousand gallons', year: '2018', text: 'Ocean Wonders: Sharks! broke ground in January 2014 and opened on June 30, 2018: 784,000 US gallons of water in a 57,000 square foot building, the first major exhibit to open here after Hurricane Sandy.', clue: 'Walk down the ramp until the water is over your head.', source: src }, { r: 2.6 });
    k.egg(v(-14, -2.5, -23), { id: 'sandy-2012', title: 'The night of the storm', year: '2012', text: 'Hurricane Sandy flooded the aquarium in October 2012. Staff who stayed on the site through the storm saved about 80 percent of the animals. The last of the damage was repaired in July 2022.', clue: 'Look at the wreck on the sand and think about what a real storm did to this building.', source: src }, { r: 6 });
    k.egg(v(-4, 6.2, 8.4), { id: 'species-266', title: 'Two hundred and sixty six', text: 'On its fourteen acres the aquarium keeps 266 species of aquatic wildlife.', clue: 'The sign on the wall names one exhibit. The building holds hundreds of species.', source: src }, { r: 2.6 });
    return { mounts, spawn: v(-8, 3, 6), look: v(-6, 2.5, -14), eye: 3, floorY, bounds: [-21.6, 23.9, -15.6, 8.6], style: 'black' };
  },
};

/* ---------------- 145 THE FINEST IN THE WORLD ---------------- */
export const astoriapool: RoomDef = {
  id: 'astoriapool',
  name: 'The finest in the world',
  area: 'ASTORIA PARK POOL / QUEENS',
  mood: 'Ninety three degrees, everybody in',
  color: '#3ab6cc',
  description: 'Three hundred and thirty feet of water between two bridges, opened in the summer of 1936 and called the finest in the world by the man who paid for it. Lap swimmers, cannonballs, lifeguards on their chairs, the diving tower that outlived its pool, and Hell Gate to the north. The New Yorkers hang under the colonnade of the bathhouse, out of the sun, facing the water.',
  signatures: 'The WPA pool of 1936 at 330 by 165 feet, the brick and limestone bathhouse with its central block and colonnade, lane ropes and ladders, lifeguard chairs, the filled in diving pool and its 32 foot three tier concrete platform, the Hell Gate Bridge arch to the north and the RFK Bridge towers to the south, the East River and Manhattan beyond.',
  build(k, ctx) {
    k.sky({ top: 0x3f86d8, horizon: 0xb9d6ee, ground: 0x8a8478, fog: 0.0016, sun: { az: 3.5, el: 0.62, color: 0xfff4de, size: 9 }, env: 0.8 });
    k.hemi(0xd8e8ff, 0x8a8478, 1.25);
    k.sun(0xfff0d8, 2.4, 60, 90, -30, true, 90);
    /* 2026-11-24 wave 8a: deck, basin tile, the bathhouse brick and its limestone are Poly Haven scans (tex/astoriapool/) */
    const deck = w8Scan(k, 'astoriapool', 'concrete_pavement', 3, () => X.concrete(0xc9c4b8, 61), { color: 0xd8d2c4, roughness: 0.85 }, 0x8c887e),
      tile = w8Scan(k, 'astoriapool', 'square_tiles', 1.2, () => X.subwayTile(0xdfeef2, 0x9ab8c0), { color: 0xc8e4ec, roughness: 0.3 }, 0x8aa8b0),
      brick = w8Scan(k, 'astoriapool', 'brick_wall_02', 2.4, () => X.brick(0x8a4a3a, 62), { color: 0xd8a898, roughness: 0.85 }, 0x7a4a3a),
      stone = w8Scan(k, 'astoriapool', 'white_sandstone_blocks_02', 3, () => X.ashlar(0xd8cfb8, 63, 4), { color: 0xe8e0d0, roughness: 0.8 }, 0xa8a090), grass = k.pbr('apGrass', X.grass(0x4b6b3a, 64), 0.35, { roughness: 1 }),
      chrome = k.flat(0xd8dee4, 1.0, 0.18), white = k.flat(0xf2f4f0, 0.1, 0.5), red = k.flat(0xd83a2a, 0, 0.6), iron = k.flat(0x2a2e34, 0.6, 0.45), wood = k.flat(0x6a4a32, 0, 0.8),
      concrete = w8Scan(k, 'astoriapool', 'concrete_pavement', 2.2, () => X.concrete(0x9c9a92, 65), { color: 0xc4beb2, roughness: 0.85 }, 0x8a8880, 'c'), steelRed = k.flat(0x7a3a2a, 0.6, 0.55), dark = k.flat(0x161a22, 0.3, 0.7), glass = k.glass(0xcfe6f2, 0.35, 0.1);
    /* the park and the river: grass to the east, the bank and the water to the west, both bridges */
    /* the lawn, in four pieces around the deck so nothing lies under the water */
    k.box(171, 0.3, 420, 114.5, -0.18, 0, grass); k.box(31, 0.3, 420, -44.5, -0.18, 0, grass);
    k.box(58, 0.3, 150, 0, -0.18, 138, grass); k.box(58, 0.3, 150, 0, -0.18, -134, grass);
    k.box(6, 3.2, 420, -63, -1.6, 0, stone);
    k.water({ y: -2.8, color: 0x2b4d66, w: 300, d: 520, x: -215, z: 0, amp: 0.7 });
    {
      const facade = k.pbr('apWin', X.windows(23, 0.12, 0x6a7a8a, false), 0.11, { emissive: 0xffffff, emissiveIntensity: 0.5 + 2 * k.night, roughness: 0.6, stretch: 0.42 });
      const roof = k.flat(0x3a404a, 0.2, 0.85), rnd = X.mulberry(36);
      for (let row = 0; row < 2; row++) for (let i = 0; i < 28; i++) { const h = 18 + rnd() * 70, w = 9 + rnd() * 12, d = 9 + rnd() * 12, z = 190 - i * 14 - rnd() * 6, x = -330 - row * 34 - rnd() * 20; k.box(w, h, d, x, -2.8 + h / 2, z, facade); k.box(w + 0.4, 0.7, d + 0.4, x, -2.8 + h, z, roof); }
    }
    {
      /* Hell Gate: the steel arch between its stone towers, north of the park */
      const BZ = 120, xa = -70, xb = -250;
      for (const tx of [xa, xb]) { k.box(14, 40, 16, tx, 17, BZ, k.pbr('apTower', X.ashlar(0x6a5a4a, 66, 5), 0.3)); k.box(16, 4, 18, tx, 37, BZ, k.flat(0x4a3e34, 0, 0.9)); }
      const pts: T.Vector3[] = [], pts2: T.Vector3[] = [];
      for (let i = 0; i <= 40; i++) { const u = i / 40, x = xa + (xb - xa) * u; pts.push(v(x, 10 + 44 * Math.sin(u * PI), BZ - 5)); pts2.push(v(x, 10 + 44 * Math.sin(u * PI), BZ + 5)); }
      k.curve(pts, 1.1, steelRed, 60); k.curve(pts2, 1.1, steelRed, 60);
      for (let i = 1; i < 40; i++) { const u = i / 40, x = xa + (xb - xa) * u, y = 10 + 44 * Math.sin(u * PI); if (i % 2 === 0) { k.beam(v(x, y, BZ - 5), v(x, 20, BZ - 5), 0.3, steelRed, 5); k.beam(v(x, y, BZ + 5), v(x, 20, BZ + 5), 0.3, steelRed, 5); } }
      k.box(Math.abs(xb - xa) + 20, 2.2, 12, (xa + xb) / 2, 19, BZ, dark);
      /* the RFK, south: two towers and the sag of the main cables */
      const SZ = -130, ta = -80, tb = -240;
      for (const tx of [ta, tb]) { for (const dz of [-5, 5]) k.box(4, 68, 4, tx, 32, SZ + dz, k.flat(0x8a8f96, 0.5, 0.6)); k.box(6, 3, 14, tx, 30, SZ, k.flat(0x8a8f96, 0.5, 0.6)); k.box(6, 3, 14, tx, 60, SZ, k.flat(0x8a8f96, 0.5, 0.6)); }
      const cy = (x: number) => { if (x > ta) return 64 - ((x - ta) / 60) * 40; if (x < tb) return 64 - ((tb - x) / 60) * 40; const u = (x - tb) / (ta - tb); return 64 - 42 * Math.sin(u * PI); };
      for (const dz of [-5, 5]) { const c: T.Vector3[] = []; for (let i = 0; i <= 50; i++) { const x = ta + 40 - (i / 50) * 360; c.push(v(x, cy(x), SZ + dz)); } k.curve(c, 0.35, dark, 70); for (let i = 0; i <= 30; i++) { const x = tb + (i / 30) * (ta - tb); k.beam(v(x, cy(x), SZ + dz), v(x, 22, SZ + dz), 0.08, dark, 4); } }
      k.box(340, 2.4, 14, -160, 21, SZ, dark);
    }
    const rnd = X.mulberry(1936);
    for (let i = 0; i < 18; i++) { const x = 30 + rnd() * 30, z = -60 + rnd() * 120; k.tree(x, 0, z, { h: 7 + rnd() * 5, r: 3.2 + rnd() * 1.8, kind: 'round', seed: i, leaf: 0x2f5a2a, species: 'plane' }); }
    for (let i = 0; i < 6; i++) k.tree(-20 + i * 9, 0, 62, { h: 8, r: 3.6, kind: 'round', seed: 40 + i, leaf: 0x3a6a2a });
    /* the deck and the pool: a tiled basin four feet deep, the water riding on top */
    /* the deck in four strips, so the basin is a hole and not a slab */
    for (const s of [-1, 1]) { k.box(11.5, 0.24, 118, s * 23.25, -0.12, 4, deck); }
    k.box(35, 0.24, 25.5, 0, -0.12, -46.25, deck);
    k.box(35, 0.24, 29.5, 0, -0.12, 48.25, deck);
    k.box(34, 0.3, 67, 0, -1.4, 0, tile);
    for (const s of [-1, 1]) { k.box(0.5, 1.5, 67.5, s * 16.75, -0.65, 0, tile); k.box(34, 1.5, 0.5, 0, -0.65, s * 33.25, tile); k.box(1.2, 0.1, 69.4, s * 17.1, 0.05, 0, white); k.box(35.4, 0.1, 1.2, 0, 0.05, s * 33.6, white); }
    { const w = k.water({ y: -0.16, color: 0x2aa5bf, w: 33, d: 66, x: 0, z: 0, amp: 0.22 }); const wm = w.material as T.MeshStandardMaterial; wm.metalness = 0.05; wm.roughness = 0.35; wm.envMapIntensity = 0.25; wm.color.setHex(0x1f8ea6); }
    k.block(-17.6, 17.6, -34.1, 34.1);
    {
      const floats = k.instances(new T.SphereGeometry(0.13, 6, 5), new T.MeshStandardMaterial({ roughness: 0.6 }), Array.from({ length: 220 }, () => new T.Matrix4()));
      const m = new T.Matrix4(), c = new T.Color(); let i = 0;
      for (const x of [-5.5, 5.5]) for (let z = -32.5; z <= 32.5; z += 0.6) { if (i >= 220) break; m.setPosition(x, -0.1, z); floats.setMatrixAt(i, m); floats.setColorAt(i, c.set(Math.floor(z / 1.8) % 2 ? 0xe83a2a : 0xf4f4f0)); i++; }
      floats.instanceMatrix.needsUpdate = true; if (floats.instanceColor) floats.instanceColor.needsUpdate = true;
    }
    for (const s of [-1, 1]) for (const z of [-22, 0, 22]) { for (const dz of [-0.3, 0.3]) { k.beam(v(s * 16.9, -1.2, z + dz), v(s * 16.9, 0.9, z + dz), 0.04, chrome, 6); k.beam(v(s * 16.9, 0.9, z + dz), v(s * 17.7, 0.9, z + dz), 0.04, chrome, 6); k.beam(v(s * 17.7, 0.9, z + dz), v(s * 17.7, 0, z + dz), 0.04, chrome, 6); } for (let y = -0.9; y < 0.8; y += 0.4) k.box(0.08, 0.04, 0.6, s * 16.9, y, z, chrome); }
    /* lifeguard chairs, umbrellas, the guards */
    for (const [x, z] of [[-20.5, -18], [20.5, -18], [-20.5, 18], [20.5, 18]]) {
      for (const dx of [-0.45, 0.45]) for (const dz of [-0.4, 0.4]) k.box(0.08, 2.5, 0.08, x + dx, 1.25, z + dz, white);
      k.box(1.1, 0.1, 1.0, x, 2.5, z, white); k.box(1.1, 0.7, 0.08, x - Math.sign(x) * 0.5, 2.9, z, white);
      for (let y = 0.4; y < 2.4; y += 0.5) k.box(0.06, 0.06, 0.9, x + Math.sign(x) * 0.5, y, z, white);
      figure(k, x, 2.55, z, 0xd83a2a, { h: 0.9, rotY: x > 0 ? -PI / 2 : PI / 2 });
      k.cyl(0.03, 2.2, x, 3.6, z, chrome); k.cyl(1.5, 0.5, x, 4.75, z, x > 0 ? red : white, 0.05, 12);
      k.keepOut.push({ x, z, r: 1.4 });
    }
    /* the swimmers: sixty on their lengths, six kids who never stop jumping in */
    if (!ctx.reduced) {
      const NS = 60, swimGeo = (() => { const b = new T.CapsuleGeometry(0.17, 0.66, 3, 8); b.rotateX(PI / 2); const h = new T.SphereGeometry(0.12, 8, 6); h.translate(0, 0.08, 0.58); return mergeGeometries([b, h])!; })();
      const swim = k.instances(swimGeo, new T.MeshStandardMaterial({ roughness: 0.75 }), Array.from({ length: NS }, () => new T.Matrix4()));
      swim.frustumCulled = false;
      const c = new T.Color(), skins = [0xf1d3b5, 0xc8a284, 0x8d5a3b, 0x5a3a26, 0xe9c2a0, 0xa77653];
      const st = Array.from({ length: NS }, () => ({ x: -15 + rnd() * 30, z: -31 + rnd() * 62, d: rnd() > 0.5 ? 1 : -1, sp: 0.5 + rnd() * 0.7, ph: rnd() * 6 }));
      for (let i = 0; i < NS; i++) swim.setColorAt(i, c.set(skins[i % skins.length]));
      if (swim.instanceColor) swim.instanceColor.needsUpdate = true;
      const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), up = new T.Vector3(0, 1, 0);
      const wake = vapour(k, st.map((s) => v(s.x, -0.2, s.z)), 1, { rise: 0.1, spread: 0.5, size: 0.14, opacity: 0.35, colour: 0xffffff, seed: 3, speed: 0.9, animate: false });
      const wm = new T.Matrix4(), ws = new T.Vector3();
      k.ticks.push((t, dt) => {
        st.forEach((s, i) => {
          s.z += s.d * s.sp * Math.min(dt, 0.1);
          if (s.z > 31.5) { s.z = 31.5; s.d = -1; } else if (s.z < -31.5) { s.z = -31.5; s.d = 1; }
          p.set(s.x, -0.32 + 0.05 * Math.sin(t * 4 + s.ph), s.z);
          q.setFromAxisAngle(up, s.d > 0 ? 0 : PI);
          m.compose(p, q, one); swim.setMatrixAt(i, m);
          ws.setScalar(0.8 + 0.5 * Math.abs(Math.sin(t * 4 + s.ph)));
          p.set(s.x, -0.18, s.z - s.d * 0.7); wm.compose(p, q, ws); wake.setMatrixAt(i, wm);
        });
        swim.instanceMatrix.needsUpdate = wake.instanceMatrix.needsUpdate = true;
      });
      /* the jumpers: run, leap, splash, climb out at the ladder, run again */
      const jumpers = [0, 1, 2, 3, 4, 5].map((i) => {
        const s = i % 2 ? 1 : -1, z0 = -26 + (i % 3) * 20 + (i > 2 ? 8 : 0);
        const g = new T.Group();
        const b = new T.Mesh(new T.CapsuleGeometry(0.15, 0.5, 3, 8), k.flat([0xe83a5a, 0x3a8ae8, 0xf0d24a, 0x2aff9a, 0xff8c3b, 0xe8e2d4][i], 0, 0.8)); b.position.y = 0.4; g.add(b);
        const h = new T.Mesh(new T.SphereGeometry(0.1, 8, 6), k.flat(skins[(i * 2) % skins.length], 0, 0.7)); h.position.y = 0.82; g.add(h);
        k.add(g);
        const ring = k.mesh(new T.TorusGeometry(0.4, 0.07, 6, 24), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 }), s * 15.5, -0.14, z0, true); ring.rotation.x = -PI / 2;
        return { g, ring, s, z0, t0: -i * 1.1, x0: s * 20.5 };
      });
      k.ticks.push((t) => {
        for (const j of jumpers) {
          const T0 = 1.2, T1 = 0.75, T2 = 2.6, T3 = 1.4, cyc = T0 + T1 + T2 + T3, u = ((t - j.t0) % cyc + cyc) % cyc;
          const rm = j.ring.material as T.MeshBasicMaterial;
          if (u < T0) { const a = u / T0; j.g.position.set(j.x0 - j.s * 3.2 * a, 0.08 * Math.abs(Math.sin(a * 14)), j.z0); j.g.visible = true; rm.opacity = 0; }
          else if (u < T0 + T1) { const a = (u - T0) / T1; j.g.position.set(j.x0 - j.s * (3.2 + 2.4 * a), 1.6 * 4 * a * (1 - a) - 0.5 * a, j.z0); j.g.rotation.z = j.s * a * 2.2; }
          else if (u < T0 + T1 + T2) { const a = (u - T0 - T1) / T2; j.g.visible = false; j.g.rotation.z = 0; j.ring.scale.setScalar(0.3 + a * 3.4); rm.opacity = 0.7 * (1 - a); }
          else { const a = (u - T0 - T1 - T2) / T3; j.g.visible = true; j.g.rotation.z = 0; j.g.position.set(j.x0 * a + j.s * 16.9 * (1 - a), a < 0.5 ? -0.6 + 1.2 * a : 0, j.z0); rm.opacity = 0; }
          j.g.rotation.y = j.s > 0 ? PI / 2 : -PI / 2;
        }
      });
      k.crowd([v(21, 0, -40), v(21, 0, 40), v(-21, 0, 40), v(-21, 0, -40)], 30, { seed: 33, speed: 0.3, spread: 2.2, closed: true, colors: [0xe83a5a, 0x3a8ae8, 0xf0d24a, 0x2aff9a, 0xff8c3b, 0xe8e2d4, 0x2a2a34, 0xff5ab8] });
    }
    /* sunbathers on the lawn */
    for (let i = 0; i < 16; i++) {
      const x = 29 + rnd() * 16, z = -34 + rnd() * 68, col = [0xe83a5a, 0x3a8ae8, 0xf0d24a, 0x2aff9a, 0xff8c3b, 0xe8e2d4, 0xff5ab8][i % 7];
      k.box(1.9, 0.03, 0.9, x, 0.02, z, k.flat(col, 0, 0.9));
      const b = k.mesh(new T.CapsuleGeometry(0.17, 0.62, 3, 8), k.flat([0xf1d3b5, 0xc8a284, 0x8d5a3b, 0x5a3a26][i % 4], 0, 0.8), x + 0.2, 0.2, z); b.rotation.z = PI / 2;
      k.sphere(0.12, x - 0.72, 0.16, z, k.flat([0xf1d3b5, 0xc8a284, 0x8d5a3b, 0x5a3a26][i % 4], 0, 0.7), 8);
    }
    /* the bathhouse to the west: brick wings, a limestone centre, and the colonnade the works hang in */
    /* 2026-11-24 wave 8a: the bathhouse stands taller, as it does: brick wings with a row of tall windows in limestone
       surrounds over the colonnade and a stone coping; the limestone centre rises to fourteen and a half metres with
       Moderne fins either side of the census wall and the name cut in it */
    k.box(14, 10, 88, -35, 5, 0, brick);
    k.box(14.4, 0.45, 88.4, -35, 10.2, 0, stone);
    k.box(14.6, 14.5, 18, -35, 7.25, 0, stone);
    k.box(15, 0.8, 19, -35, 14.7, 0, k.flat(0x8a8078, 0, 0.9));
    { const win: number[][] = [], sur: number[][] = [], sill: number[][] = [];
      for (let i = 0; i < 13; i++) for (const s of [-1, 1]) { const z = s * (11.5 + i * 2.6); win.push([-27.97, 7.95, z]); sur.push([-27.9, 7.95, z]); sill.push([-27.8, 6.55, z]); }
      w8Boxes(k, 0.16, 2.6, 1.3, stone, sur); w8Boxes(k, 0.12, 2.36, 1.02, glass, win.map(([x, y, z]) => [x - 0.04, y, z])); w8Boxes(k, 0.4, 0.14, 1.5, stone, sill); }
    { const fins: number[][] = []; for (const z of [-8.4, -7.4, 7.4, 8.4]) fins.push([-27.45, 7.6, z]); w8Boxes(k, 0.6, 12.6, 0.36, stone, fins); }
    w8Sign(k, 'ASTORIA POOL', 9.6, 1.25, -27.66, 11.9, 0, PI / 2, '#5a4436', '', 'W2 Archivo Expanded', false, 0.78);
    w8Sign(k, 'CITY OF NEW YORK  DEPARTMENT OF PARKS  1936', 11, 0.42, -27.66, 10.9, 0, PI / 2, '#6a5444', '', 'W2 Archivo Narrow', false, 0.7);
    for (let i = 0; i <= 12; i++) k.column(-25, 0, -36 + i * 6, 5.2, 0.34, stone, false, stone);
    k.box(4.2, 0.4, 84, -26.3, 5.45, 0, stone);
    k.box(4.6, 0.3, 84.6, -26.3, 5.8, 0, k.flat(0x8a8078, 0, 0.9));
    for (const z of [-30, 30]) { k.arch(2.4, 3.4, 0.6, -28, 0, z, brick, false, 1.0).rotation.y = PI / 2; }
    k.block(-50, -27.6, -60, 60);
    for (let i = 0; i <= 12; i++) k.keepOut.push({ x: -25, z: -36 + i * 6, r: 0.55 });
    /* the diving pool, filled in, and the tower that stayed */
    k.box(24, 0.06, 12, 0, 0.02, 46, k.flat(0xd8d2c6, 0, 0.9));
    k.rail(-12.4, 46, 12, iron, 0.9, 'z', 1.5); k.rail(12.4, 46, 12, iron, 0.9, 'z', 1.5);
    k.box(2.6, 10.2, 3.2, 0, 5.1, 54.5, concrete);
    for (let i = 0; i < 3; i++) { const y = 3.2 + i * 3.3, len = 5 + i * 1.6; k.box(3.0 + i * 0.3, 0.38, len, 0, y, 53 - len / 2, concrete); k.rail(-1.4 - i * 0.15, 53 - len / 2, len, iron, 0.9, 'z', 1.2); k.rail(1.4 + i * 0.15, 53 - len / 2, len, iron, 0.9, 'z', 1.2); }
    k.box(1.2, 10.4, 0.6, 0, 5.2, 56.3, concrete);
    for (let i = 0; i < 16; i++) k.box(1.0, 0.08, 0.3, 0, 0.6 + i * 0.62, 56.05, iron);
    k.block(-1.6, 1.6, 52.5, 57);
    /* 2026-11-24 wave 8a: real lampposts (Poly Haven CC0) along the deck, life rings on posts by every chair, depth marks
       cut in the coping, the rules board by the gate */
    { const at: number[][] = []; for (let i = 0; i < 8; i++) { const x = i % 2 ? 22.5 : -22.5, z = -38 + Math.floor(i / 2) * 25; at.push([x, 0, z, x > 0 ? -PI / 2 : PI / 2]); k.point(x, 4.4, z, 0xffd7a0, k.night > 0.5 ? 60 : 18, 14); k.keepOut.push({ x, z, r: 0.45 }); } w8Place(k, 'astoriapool/ph_street_lamp_01', { height: 4.6 }, at); }
    { const at: number[][] = []; for (const [x, z] of [[-18.6, -24], [18.6, -24], [-18.6, 24], [18.6, 24], [-18.6, 0], [18.6, 0]]) { k.box(0.12, 1.6, 0.12, x, 0.8, z, white); at.push([x, 0.7, z + 0.09, x > 0 ? -PI / 2 : PI / 2]); k.keepOut.push({ x, z, r: 0.5 }); } w8Place(k, 'astoriapool/ph_lifebuoy', { height: 0.76 }, at); }
    for (const s of [-1, 1]) for (const z of [-28, -14, 0, 14, 28]) { const m = w8Sign(k, '4 FT', 1.1, 0.4, s * 18.0, 0.13, z, 0, '#1a3a5a', '', 'W2 Archivo Expanded', false, 0.8); m.rotation.set(-PI / 2, 0, -s * PI / 2); }
    k.box(0.1, 1.9, 0.1, 26.6, 0.95, -23, iron); k.box(0.1, 1.9, 0.1, 26.6, 0.95, -21, iron); k.keepOut.push({ x: 26.6, z: -22, r: 1.2 });
    w8Sign(k, 'POOL RULES  NO RUNNING  NO DIVING  SWIM AT LIFEGUARD STATIONS ONLY', 2.4, 1.3, 26.55, 1.6, -22, -PI / 2, '#f4f4f0', '#1e5a3a', 'W2 Archivo Narrow', false, 0.15, '#f4f4f0');
    /* the one illusion: NO DIVING laid long down the east deck, upright only from the gate, the diving tower in the distance */
    { const tx = w8Type('NO DIVING', ['#c8282a']); if (tx) anamorphTex(k, tx, 20, -30, 3, 0, 3.0, 8.0, 2.0, 0.8, 0.9); }
    k.egg(v(18.9, 0.4, -21.5), { id: 'no-diving', title: 'No diving, says the floor', text: 'The red words on the deck are drawn long and thin along your line of sight, so they stand up only from the gate where you came in; take a step and they lie down. It is anamorphosis, the trick of Holbein\'s skull in The Ambassadors, 1533. The joke is the tower at the far end: Astoria\'s diving pool was filled in between 2017 and 2019, and the platform was kept.', clue: 'Go back to the gate and read the deck.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 2.4 });
    {
      k.cyl(0.05, 12, 22, 6, -44, chrome, 0.03, 8);
      const flag = k.mesh(new T.PlaneGeometry(2.0, 1.3), k.flat(0xd83a2a, 0, 0.8, { side: T.DoubleSide }), 22, 11.2, -44, true);
      flag.geometry.translate(1.0, 0, 0);
      if (!ctx.reduced) k.ticks.push((t) => { flag.rotation.y = 0.9 + 0.35 * Math.sin(t * 2.2) + 0.12 * Math.sin(t * 5.1); flag.rotation.z = 0.06 * Math.sin(t * 3.3); });
    }
    /* the works: under the colonnade, facing the water */
    const mounts: Mount[] = [];
    for (let i = 0; i < 12; i++) { const z = -33 + i * 6; mounts.push({ position: v(-27.72, 2.7, z), rotation: PI / 2, target: v(-23.6, 2.7, z), width: 2.6, height: 1.8, style: 'white', wash: true }); }
    k.censusWall({ x: -27.62, y: 8.6, z: 0, rotY: PI / 2, cols: 22, rows: 5, tile: 0.5, gap: 0.04, start: ctx.wallStart(4700, 110), pieces: ctx.all, backing: stone });
    /* what the water knows */
    const src = { name: 'Astoria Park, Wikipedia', url: 'https://en.wikipedia.org/wiki/Astoria_Park' };
    k.egg(v(-27.4, 10.8, 0), { id: 'opened-1936', title: 'The finest in the world', year: '1936', text: 'The pool opened on July 2, 1936. Harry Hopkins, who ran the Works Progress Administration that paid for it, called it the finest in the world. It was the largest of the eleven WPA pools that opened across the city that summer.', clue: 'The date is on the bathhouse, above the columns.', source: src }, { r: 5 });
    k.egg(v(0, 0.4, 0), { id: 'largest', title: 'Three hundred and thirty by one sixty five', text: 'The main pool is 330 by 165 feet and four feet deep, a surface of 54,450 square feet. At its peak the pool area held 6,200 swimmers, 5,570 of them in the main pool alone.', clue: 'Stand at the rope in the middle and look both ways.', source: src }, { r: 5 });
    k.egg(v(0, 6.5, 54), { id: 'trials', title: 'Trials', year: '1936, 1952 and 1964', text: 'The pools here hosted the United States Olympic swimming and diving trials in 1936, in 1952 and in 1964.', clue: 'Climb the tower in your head and look down at where the water was.', source: src }, { r: 4 });
    k.egg(v(0, 0.6, 46), { id: 'diving-pool', title: 'The pool that is not there', year: '1980s', text: 'The diving pool was drained and fenced off in the 1980s and filled in altogether between 2017 and 2019. The diving platform stayed: 32 feet tall, three platforms cantilevered over each other.', clue: 'There is a tower for diving, and nothing to dive into.', source: src }, { r: 3.5 });
    k.egg(v(-20.5, 3.4, -18), { id: 'architects', title: 'Who drew it', text: 'John Hatton designed the pool complex, with Gregory Kiely on the details, to a common design for the eleven pools worked out by Robert Moses, Aymar Embury II and Gilmore D. Clarke. The pool was designated a city landmark in 2006.', clue: 'Ask the lifeguard on the south chair who built her chair.', source: src }, { r: 2.6 });
    k.egg(v(22, 2, -44), { id: 'two-bridges', title: 'Between two bridges', text: 'The RFK Bridge crosses over the south end of the park and the Hell Gate Bridge over the north, so the pool sits under the approaches of both.', clue: 'From the flagpole, one bridge is an arch and the other hangs from cables.', source: src }, { r: 3 });
    return { mounts, spawn: v(20, 3, -30), look: v(-12, 2.4, 14), eye: 3, bounds: [-26.9, 26.9, -45, 50], style: 'white' };
  },
};

/* ---------------- 146 THE TREE AND THE RINK ---------------- */
export const rockcenter: RoomDef = {
  id: 'rockcenter',
  name: 'The tree and the rink',
  area: 'ROCKEFELLER PLAZA / THE RINK',
  mood: 'December, seven in the evening',
  color: '#d8a84a',
  daylit: false,
  description: 'The sunken rink at the foot of the Channel Gardens, Prometheus in gold over the fountain, forty flags going round the parapet, skaters below and a Norway spruce above them with fifty thousand lights on it. The New Yorkers hang along the shop fronts of the Channel Gardens, between the wire angels, and down on the rink level either side of the fountain.',
  signatures: 'The Channel Gardens sloping down from Fifth Avenue between the British Empire Building and La Maison Francaise, the trumpeting wire angels, the sunken rink with its flags and skaters, Paul Manship\'s gilded Prometheus and the fountain, the Christmas tree with its star, and 30 Rockefeller Plaza rising behind it.',
  build(k, ctx) {
    k.sky({ top: 0x05070f, horizon: 0x161a2c, ground: 0x05060a, fog: 0.0038, stars: 500, env: 0.45 });
    k.hemi(0x5a6a9a, 0x14161c, 1.4);
    k.sun(0xaebde8, 0.25, -60, 60, 30, true, 90);
    /* 2026-11-24 wave 8a: granite, the red granite wall, the limestone of the buildings and the esplanade pavers are Poly
       Haven scans (tex/rockcenter/), each in a set colour until its maps land */
    const granite = w8Scan(k, 'rockcenter', 'granite_tile_02', 2.4, () => X.ashlar(0x6a6a72, 71, 6), { color: 0x9c9ca4, roughness: 0.55 }, 0x5a5a62),
      pave = w8Scan(k, 'rockcenter', 'concrete_pavers', 2.0, () => X.pavers(0x77747a, 72), { color: 0xa8a49e, roughness: 0.7 }, 0x66635e),
      lime = w8Scan(k, 'rockcenter', 'white_sandstone_blocks_02', 3.2, () => X.ashlar(0xb9b2a2, 73, 5), { color: 0xd6cfbf, roughness: 0.8 }, 0x9c968a),
      ice = k.flat(0xb8cfe0, 0.3, 0.16, { emissive: 0x9fd0ff, emissiveIntensity: 0.04 }), dark = k.flat(0x0e1117, 0.3, 0.7), gilt = k.pbr('rcGilt', X.gilt(), 2, { metalness: 0.9, roughness: 0.28 }),
      green = k.flat(0x0f3a1c, 0, 0.95), brass = k.flat(0xc9a25a, 0.9, 0.35), white = k.flat(0xe8ecf0, 0.1, 0.5), redGran = w8Scan(k, 'rockcenter', 'granite_wall', 2.0, () => X.ashlar(0x5a2a2a, 74, 8), { color: 0xb0645a, roughness: 0.45 }, 0x4a2a28),
      wire = new T.MeshBasicMaterial({ color: 0xfff1cc, wireframe: true, transparent: true, opacity: 0.85 }), hedge = k.flat(0x1e3a22, 0, 0.95), iron = k.flat(0x1c1e22, 0.6, 0.45);
    /* the two levels: the esplanade at street level with a hole in it, the rink three and a half metres down */
    for (const [w, d, x, z] of [[30, 70, -35, 0], [50, 70, 45, 0], [40, 25, 0, -22.5], [40, 25, 0, 22.5]]) k.box(w, 0.4, d, x, -0.2, z, pave);
    k.box(40.5, 0.4, 20.5, 0, -3.7, 0, granite);
    for (const s of [-1, 1]) { k.box(0.5, 3.5, 20.5, s * 20, -1.75, 0, granite); for (const sx of [-1, 1]) k.box(14, 3.5, 0.5, sx * 13, -1.75, s * 10, granite); }
    const RA = Math.atan2(3.5, 6);
    for (const s of [-1, 1]) { const rp = k.box(12, 0.3, 6.95, 0, -1.75, s * 13, granite); rp.rotation.x = -s * RA; for (const sx of [-1, 1]) { const rw = k.box(0.4, 1.2, 6.95, sx * 6.2, -1.15, s * 13, granite); rw.rotation.x = -s * RA; } }
    for (const s of [-1, 1]) { k.box(0.4, 1.0, 20.8, s * 20.2, 0.5, 0, granite); for (const sx of [-1, 1]) k.box(14.4, 1.0, 0.4, sx * 13.2, 0.5, s * 10.2, granite); }
    k.block(19.8, 20.6, -10.4, 10.4); k.block(-20.6, -19.8, -10.4, 10.4);
    const blk = (x0: number, x1: number, z0: number, z1: number) => k.block(Math.min(x0, x1), Math.max(x0, x1), Math.min(z0, z1), Math.max(z0, z1));
    for (const s of [-1, 1]) { blk(-20.6, -6, s * 9.8, s * 10.4); blk(6, 20.6, s * 9.8, s * 10.4); blk(-6.6, -6, s * 10, s * 16.4); blk(6, 6.6, s * 10, s * 16.4); }
    const floorY = (x: number, z: number) => {
      if (Math.abs(x) < 20 && Math.abs(z) < 10) return -3.5;
      if (Math.abs(x) < 6 && Math.abs(z) >= 10 && Math.abs(z) <= 16) return -3.5 * (16 - Math.abs(z)) / 6;
      return 0;
    };
    /* the ice, its boards, and the skaters */
    { const g = new T.CircleGeometry(1, 56); g.rotateX(-PI / 2); const o = k.mesh(g, ice, 0, -3.46, 0); o.scale.set(16, 1, 7.5); }
    for (let j = 0; j < 56; j++) { const a = (j / 56) * PI * 2, x = Math.cos(a) * 16.2, z = Math.sin(a) * 7.7, tx = -Math.sin(a) * 16.2, tz = Math.cos(a) * 7.7; const b = k.box(Math.hypot(tx, tz) * (PI * 2 / 56) + 0.1, 0.9, 0.14, x, -3.05, z, white); b.rotation.y = -Math.atan2(tz, tx); }
    for (const x of [-8.5, 0, 8.5]) k.keepOut.push({ x, z: 0, r: 7.4 });
    if (!ctx.reduced) {
      const NS = 18, sk = k.instances(figureGeo(0.19, 0.74, 1.24), new T.MeshStandardMaterial({ roughness: 0.85 }), Array.from({ length: NS }, () => new T.Matrix4()));
      sk.frustumCulled = false;
      const rnd = X.mulberry(1936), c = new T.Color(), pal = [0xd82a3a, 0x1c232c, 0xe8e2d4, 0x2a5fb8, 0x2a8a4a, 0xf0c22a, 0x8a4ad8, 0xff8c3b];
      const st = Array.from({ length: NS }, () => { const rx = 2.5 + rnd() * 5, rz = 1.5 + rnd() * 3; return { cx: (rnd() - 0.5) * 2 * (15 - rx), cz: (rnd() - 0.5) * 2 * (6.8 - rz), rx, rz, w: (0.25 + rnd() * 0.3) * (rnd() > 0.5 ? 1 : -1), ph: rnd() * 6.3, h: 0.85 + rnd() * 0.3 }; });
      for (let i = 0; i < NS; i++) sk.setColorAt(i, c.set(pal[Math.floor(rnd() * pal.length)]));
      if (sk.instanceColor) sk.instanceColor.needsUpdate = true;
      const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), s = new T.Vector3(), e = new T.Euler();
      k.ticks.push((t) => {
        st.forEach((a, i) => {
          const th = a.w * t + a.ph, x = a.cx + a.rx * Math.cos(th), z = a.cz + a.rz * Math.sin(th);
          const vx = -a.rx * a.w * Math.sin(th), vz = a.rz * a.w * Math.cos(th);
          e.set(0, Math.atan2(vx, vz), 0.18 * Math.sign(a.w) * Math.sin(th * 2 + a.ph)); q.setFromEuler(e);
          p.set(x, -3.46 + 0.03 * Math.abs(Math.sin(t * 3 + a.ph)), z); s.set(1, a.h, 1);
          m.compose(p, q, s); sk.setMatrixAt(i, m);
        });
        sk.instanceMatrix.needsUpdate = true;
      });
      /* 2026-11-24 wave 8a: the skaters are the cast skater model from THE LIGHTINGS (one instanced draw), riding the
         stand ins' matrices; the capsules hide when it lands */
      if (W8_DOM) { const mk = new T.Matrix4(); sk.userData.person = undefined; (sk.geometry.userData as Record<string, unknown>).person = undefined; void hero(k, 'rockcenter/lt_skater', { height: 1.72 }).then((h) => { if (!h || !k.live) return; h.traverse((c) => { if (c instanceof T.Mesh) c.castShadow = false; }); const ins = heroInstances(k, h, NS); sk.visible = false; const copy = () => { for (let i = 0; i < NS; i++) { sk.getMatrixAt(i, mk); ins.setAt(i, mk); } ins.commit(); }; copy(); k.ticks.push(copy); }); }
    }
    /* the Zamboni, parked in its gate at the east end of the ice */
    w8Place(k, 'rockcenter/lt_zamboni', { length: 4.2 }, [[17.6, -3.5, 7.9, -PI / 2]]);
    k.keepOut.push({ x: 17.6, z: 7.9, r: 2.2 });
    /* the flags round the parapet: forty eight of them, each on its own pole, each on its own gust */
    {
      const poles: [number, number][] = [];
      for (let z = -9; z <= 9; z += 2) { poles.push([-20.9, z]); poles.push([20.9, z]); }
      for (let x = -19; x <= 19; x += 2) { if (Math.abs(x) < 7) continue; poles.push([x, -10.9]); poles.push([x, 10.9]); }
      const NFl = poles.length, fg = new T.PlaneGeometry(1.5, 1.0); fg.translate(0.75, 0, 0);
      const flags = k.instances(fg, new T.MeshStandardMaterial({ roughness: 0.95, side: T.DoubleSide }), Array.from({ length: NFl }, () => new T.Matrix4()));
      flags.frustumCulled = false;
      const c = new T.Color(), pal = [0x9a1e2a, 0x1e448a, 0x1e6a36, 0xb08a1e, 0x9a9a9a, 0x1c1c1c, 0xb8641e, 0x6a1e6a], rnd = X.mulberry(48);
      poles.forEach(([x, z], i) => { k.cyl(0.04, 5.6, x, 2.8, z, brass, 0.03, 6); flags.setColorAt(i, c.set(pal[Math.floor(rnd() * pal.length)])); });
      if (flags.instanceColor) flags.instanceColor.needsUpdate = true;
      const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), up = new T.Vector3(0, 1, 0);
      const place = (t: number) => { poles.forEach(([x, z], i) => { p.set(x, 5.0, z); q.setFromAxisAngle(up, 0.8 + 0.4 * Math.sin(t * 1.7 + i * 0.9) + 0.15 * Math.sin(t * 4.3 + i)); m.compose(p, q, one); flags.setMatrixAt(i, m); }); flags.instanceMatrix.needsUpdate = true; };
      place(0); if (!ctx.reduced) k.ticks.push(place);
    }
    /* Prometheus over the fountain, the red granite wall behind him */
    k.box(0.7, 6.4, 12, -20.35, -0.3, 0, redGran);
    k.box(8, 0.8, 3.2, -17.6, -3.1, 0, granite);
    k.box(7.6, 0.3, 2.8, -17.6, -2.72, 0, k.flat(0x2b4d66, 0.6, 0.2));
    /* 2026-11-24 wave 8a: Prometheus is a real model now (the rink Prometheus from the movie sets), gilded, flying over
       the fountain inside his ring of the zodiac; the ring carries its twelve signs as gilt studs */
    { const ring = k.torus(2.6, 0.16, -18.7, -0.2, 0, gilt, 64); ring.rotation.y = PI / 2; for (let j = 0; j < 12; j++) { const a = (j / 12) * PI * 2; k.sphere(0.22, -18.7, -0.2 + Math.sin(a) * 2.6, Math.cos(a) * 2.6, gilt, 8); } k.box(0.5, 1.6, 0.5, -18.9, -2.2, 0, redGran); }
    w8Place(k, 'rockcenter/nyb_rink_prometheus', { height: 3.4 }, [[-18.4, -1.6, 0, PI / 2]], (h) => { h.traverse((c) => { if (!(c instanceof T.Mesh)) return; const ms = Array.isArray(c.material) ? c.material : [c.material]; if (ms.some((m) => /nyb_/.test(m.name))) c.visible = false; }); w8Tint(h, 0xd8a640, 0.3, 0.92); });
    w8Sign(k, 'PROMETHEUS  TEACHER IN EVERY ART  BROUGHT THE FIRE  THAT HATH PROVED TO MORTALS  A MEANS TO MIGHTY ENDS', 11.4, 0.34, -19.98, 2.5, 0, PI / 2, '#e9c46a', '', 'W2 Archivo Expanded', false, 0.62);
    k.spot(-12, 2, 0, -18.3, -0.5, 0, 0xffd27a, 500, 0.5, 0.6, 20);
    if (!ctx.reduced) vapour(k, [v(-16.4, -2.7, -0.8), v(-16.4, -2.7, 0.8), v(-15.6, -2.7, 0)], 16, { rise: 2.6, spread: 0.5, size: 0.08, opacity: 0.3, colour: 0xe8f4ff, seed: 9, speed: 0.4, animate: true });
    /* the tree: seven tiers of spruce, three thousand lights that never all blink at once, the star */
    const TX = -28;
    k.cyl(0.6, 3, TX, 1.5, 0, k.flat(0x3a2a1c, 0, 0.9));
    k.box(6, 1.2, 6, TX, 0.6, 0, granite);
    k.keepOut.push({ x: TX, z: 0, r: 8.5 });
    const tiers: [number, number][] = [];
    /* 2026-10-28: tried the kit's pine (k.tree species pine) here; at 25 m it reads as a sparse scrub pine, not the
       dense Norway spruce, and the lights hang in its gaps, so the tiers stay until a spruce is made */
    for (let i = 0; i < 7; i++) { const r = 7.4 - i * 0.95, y = 1 + i * 3.3; tiers.push([r, y]); k.cyl(r, 5.2, TX, y + 2.6, 0, green, 0.3, 14); }
    /* 2026-11-24 wave 8a: a real spruce silhouette (Poly Haven fir_tree_01, CC0) over the dense tiers: two copies turned
       90 degrees apart so the branches close round, fitted to the envelope of the tiers */
    w8Place(k, 'rockcenter/ph_fir_tree_01', { box: [15.6, 25.6, 15.6] }, [[TX, 1.0, 0, 0], [TX, 1.0, 0, PI / 2]], (h) => w8Tint(h, 0x2c5a34, 0.9, 0));
    {
      const NL = 2000, rnd = X.mulberry(1933), c = new T.Color(), pal = [0xff3b3b, 0x3bff6a, 0x3b8cff, 0xffd23b, 0xffffff, 0xff8c3b];
      const lights = k.instances(new T.SphereGeometry(0.11, 5, 4), new T.MeshBasicMaterial({ color: 0xffffff }), Array.from({ length: NL }, () => new T.Matrix4()));
      lights.frustumCulled = false;
      const base = new Int32Array(NL), ph = new Float32Array(NL), m = new T.Matrix4();
      for (let i = 0; i < NL; i++) {
        const ti = Math.floor(rnd() * 7), [r0, y0] = tiers[ti], u = rnd(), r = r0 * (1 - u) + 0.3 * u, a = rnd() * PI * 2;
        m.setPosition(TX + Math.cos(a) * r * 1.02, y0 + u * 5.2, Math.sin(a) * r * 1.02); lights.setMatrixAt(i, m);
        base[i] = pal[Math.floor(rnd() * pal.length)]; ph[i] = rnd() * 6.3; lights.setColorAt(i, c.set(base[i]));
      }
      lights.instanceMatrix.needsUpdate = true; if (lights.instanceColor) lights.instanceColor.needsUpdate = true;
      lights.castShadow = false;   // 2026-11-24 wave 8a: three thousand bulbs in the shadow pass cost more than the tree
      if (!ctx.reduced) k.ticks.push((t) => { for (let i = 0; i < NL; i++) { const b = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2.1 + ph[i])); lights.setColorAt(i, c.set(base[i]).multiplyScalar(b)); } if (lights.instanceColor) lights.instanceColor.needsUpdate = true; });
      const star = new T.Group(); star.position.set(TX, tiers[6][1] + 5.9, 0); k.add(star);
      const spikes = new T.InstancedMesh(new T.ConeGeometry(0.09, 1, 5).translate(0, 0.5, 0), k.glow(0xfff6d8), 70);
      const q = new T.Quaternion(), s = new T.Vector3(), up = new T.Vector3(0, 1, 0), d = new T.Vector3(), zero = new T.Vector3();
      for (let i = 0; i < 70; i++) { d.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(); q.setFromUnitVectors(up, d); s.set(1, 0.7 + rnd() * 1.6, 1); m.compose(zero, q, s); spikes.setMatrixAt(i, m); }
      spikes.instanceMatrix.needsUpdate = true; star.add(spikes);
      const core = new T.Mesh(new T.IcosahedronGeometry(0.55, 1), k.glow(0xffffff)); star.add(core);
      k.point(TX, tiers[6][1] + 5.9, 0, 0xfff0c0, 260, 40);
      if (!ctx.reduced) k.ticks.push((t) => { star.rotation.y = t * 0.2; });
    }
    for (const [dy, dz] of [[6, 4], [13, -4], [19, 2]]) k.point(TX, dy, dz, 0xffd27a, 70, 18);
    /* 30 Rock behind the tree, the neighbours, Saks across the avenue */
    {
      const facade = (seed: number, lit: number) => k.pbr('rcWin' + seed, X.windows(seed, lit, 0x1c2430, true), 0.11, { emissive: 0xffffff, emissiveIntensity: 1.1, roughness: 0.6, stretch: 0.42 });
      k.box(30, 118, 26, -72, 59, 0, facade(31, 0.5)); k.box(38, 60, 26, -72, 30, 0, facade(32, 0.4)); k.box(24, 130, 18, -72, 65, 0, facade(33, 0.45));
      k.box(40, 22, 60, -60, 11, 46, lime); k.box(40, 22, 60, -60, 11, -46, lime);
      k.skyline({ z: -110, count: 26, spacing: 7, scale: 1.6, base: -1, seed: 5, lit: 0.45, x: 10, glow: 0.35 });
      k.skyline({ z: 110, count: 26, spacing: 7, scale: 1.6, base: -1, seed: 6, lit: 0.45, x: 10, glow: 0.35 });
      k.box(70, 36, 22, 96, 18, 0, facade(34, 0.7));
      k.box(70, 4, 24, 96, 2, 0, lime);
      k.box(24, 0.1, 140, 78, -0.15, 0, k.flat(0x1c1e24, 0, 0.9));
      /* 2026-11-24 wave 8a: six cabs on Fifth, not fourteen; the kit swaps each box for a 14k triangle taxi with shadows */
      const NCAB = 6;
      const cabs = k.instances(new T.BoxGeometry(1.6, 1.1, 3.6), k.flat(0xf0c22a, 0.2, 0.5), Array.from({ length: NCAB }, () => new T.Matrix4()));
      const tl = k.instances(new T.BoxGeometry(1.4, 0.2, 0.2), k.glow(0xff3322), Array.from({ length: NCAB }, () => new T.Matrix4()));
      cabs.frustumCulled = tl.frustumCulled = false;
      const rnd = X.mulberry(5), st = Array.from({ length: NCAB }, (_, i) => ({ s: rnd() * 140, x: 70 + (i % 3) * 4.2, v: 8 + rnd() * 6 })), m = new T.Matrix4();
      const place = (_t: number, dt: number) => { st.forEach((a, i) => { a.s = (a.s + a.v * Math.min(dt, 0.1)) % 140; m.setPosition(a.x, 0.55, 70 - a.s); cabs.setMatrixAt(i, m); m.setPosition(a.x, 0.7, 70 - a.s + 1.85); tl.setMatrixAt(i, m); }); cabs.instanceMatrix.needsUpdate = tl.instanceMatrix.needsUpdate = true; };
      place(0, 0); if (!ctx.reduced) k.ticks.push(place);
    }
    /* the Channel Gardens: two limestone bases with shop fronts, six beds down the middle, twelve wire angels */
    for (const s of [-1, 1]) {
      k.box(52, 26, 30, 45, 13, s * 23.5, lime);
      k.box(52, 4.4, 0.6, 45, 2.2, s * 8.7, dark);
      k.box(52.4, 0.5, 1.0, 45, 4.55, s * 8.5, brass);
      const win = k.instances(new T.BoxGeometry(1.3, 1.9, 0.12), new T.MeshBasicMaterial({ color: 0xffffff }), Array.from({ length: 72 }, () => new T.Matrix4()));
      const m = new T.Matrix4(), c = new T.Color(), rnd = X.mulberry(60 + s);
      for (let i = 0; i < 72; i++) { const f = Math.floor(i / 12), j = i % 12; m.setPosition(21 + j * 4.2, 7 + f * 3.4, s * 8.44); win.setMatrixAt(i, m); win.setColorAt(i, c.set(rnd() > 0.55 ? 0xffd9a0 : 0x0e1420)); }
      win.instanceMatrix.needsUpdate = true; if (win.instanceColor) win.instanceColor.needsUpdate = true;
      blk(20, 72, s * 8.4, s * 40);
    }
    /* 2026-11-24 wave 8a: the twelve herald angels are the wire angel model from THE LIGHTINGS, trumpets raised, in pairs
       facing across each bed; the beds are planted and edged in granite */
    const angelAt: number[][] = [];
    for (let i = 0; i < 6; i++) {
      const x = 27 + i * 7;
      k.box(4.2, 0.9, 3.2, x, 0.45, 0, granite); k.box(3.8, 0.9, 2.8, x, 1.35, 0, hedge);
      k.keepOut.push({ x, z: 0, r: 2.6 });
      k.point(x, 2.2, 0, 0xffe6b0, 40, 9);
      for (const s of [-1, 1]) angelAt.push([x, 1.8, s * 1.0, -PI / 2]);
    }
    w8Place(k, 'rockcenter/lt_angel', { height: 3.0 }, angelAt, (h) => h.traverse((c) => { if (c instanceof T.Mesh) { const m = (c.material as T.MeshStandardMaterial).clone(); m.emissive = new T.Color(0xfff1cc); m.emissiveIntensity = 0.16; m.emissiveMap = m.map; c.material = m; } }));
    void wire;
    /* 2026-11-24 wave 8a: real street lamps (Poly Haven CC0) round the rink, one instanced draw, each with its light */
    { const at: number[][] = []; for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { at.push([-17.5 + i * 7, 0, s * 16.5, s > 0 ? PI : 0]); k.point(-17.5 + i * 7, 4.2, s * 16.3, 0xffd7a0, 40, 12); k.keepOut.push({ x: -17.5 + i * 7, z: s * 16.5, r: 0.5 }); } w8Place(k, 'rockcenter/ph_street_lamp_01', { height: 4.8 }, at); void iron; }
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) k.spot(s * 22, 5, -6 + i * 4, 0, -3.4, 0, 0xdfeeff, 85, 0.5, 0.7, 40);
    /* 2026-11-24 wave 8a: built detail on the buildings. 30 Rock's limestone piers running the full height of its east face,
       the gilt screen over its door, the names of the two Channel Gardens buildings cut over their shop fronts, a granite
       marker at the Fifth Avenue end */
    {
      const piers: number[][] = []; for (let z = -12.25; z <= 12.3; z += 1.75) piers.push([-56.8, 59, z]);
      w8Boxes(k, 0.7, 118, 0.55, lime, piers);
      const piers2: number[][] = []; for (let z = -8; z <= 8.1; z += 2) piers2.push([-59.8, 65, z]);
      w8Boxes(k, 0.6, 130, 0.5, lime, piers2);
      k.box(0.4, 3.2, 10, -56.6, 7.2, 0, gilt); k.box(0.3, 4.6, 7, -56.6, 2.3, 0, k.glass(0xffe2a8, 0.5, 0.1));
      k.point(-54, 7, 0, 0xffd27a, 60, 12);
      w8Sign(k, 'BRITISH EMPIRE BUILDING', 22, 1.1, 45, 23.5, -8.42, 0, '#e9c46a', '', 'W2 Archivo Expanded', false, 0.7);
      w8Sign(k, 'LA MAISON FRANCAISE', 20, 1.1, 45, 23.5, 8.42, PI, '#e9c46a', '', 'W2 Archivo Expanded', false, 0.7);
      k.box(2.2, 1.2, 0.8, 67, 0.6, -5.6, granite); w8Sign(k, 'CHANNEL GARDENS', 2.0, 0.36, 67, 0.85, -5.18, 0, '#e9c46a', '#1c1c20', 'W2 Archivo Expanded', false, 0.5);
      k.keepOut.push({ x: 67, z: -5.6, r: 1.3 });
    }
    /* the one illusion: LIGHTS ON laid long down the garden path, in the tree's own colours; it stands up only from the
       spot by the angels where you came in */
    { const tx = w8Type('LIGHTS ON', ['#ff3b3b', '#3bff6a', '#3b8cff', '#ffd23b', '#ffffff', '#ff8c3b']); if (tx) anamorphTex(k, tx, 30.5, -5.2, 3, 0, PI / 2, 5.4, 3.6, 1.2, 0.9); }
    k.egg(v(24.6, 0.4, -5.2), { id: 'lights-on', title: 'Two words lying down', text: 'LIGHTS ON is painted long and thin down the path, stretched along your line of sight, so it only stands upright from the spot where you came in, between the angels. A step to the side and it falls flat on the stone. Artists have hidden pictures this way since the Renaissance; the word for it is anamorphosis.', clue: 'Walk back to the angels and read the ground.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 2.4 });
    /* 2026-11-24 wave 8a: the kit's taxis and the cast arrive after the build; once they land, none of them casts a shadow
       (the shadow pass drew every 14k triangle cab a second time). Checked for the first half minute, then dropped. */
    { let until = -1; const off = (t: number) => { if (until < 0) until = t + 30; if (t > until) return; k.scene.traverse((o) => { const me = o as T.Mesh; if (me.isMesh && (o.userData.cab || o.userData.cast || me.material instanceof T.MeshBasicMaterial)) o.castShadow = false; }); }; k.ticks.push((t) => { if (t <= until || until < 0) off(t); }); }
    /* people on the esplanade, in the gardens and on the rink level */
    if (!ctx.reduced) {
      const winter = [0x1c232c, 0xd82a3a, 0x2a2a34, 0xe8e2d4, 0x2a5fb8, 0x3a3a3a, 0x8a4a2a, 0xf0c22a];
      k.crowd([v(-24, 0, -13), v(24, 0, -13), v(24, 0, 13), v(-24, 0, 13)], 28, { seed: 51, speed: 0.28, spread: 3.4, closed: true, colors: winter });
      k.crowd([v(22, 0, -5.2), v(66, 0, -5.2)], 10, { seed: 52, speed: 0.4, spread: 2.0, colors: winter });
      k.crowd([v(22, 0, 5.2), v(66, 0, 5.2)], 10, { seed: 53, speed: 0.4, spread: 2.0, colors: winter });
      k.crowd([v(-18.5, -3.5, -8.6), v(18.5, -3.5, -8.6), v(18.5, -3.5, 8.6), v(-18.5, -3.5, 8.6)], 12, { seed: 54, speed: 0.2, spread: 1.2, closed: true, colors: winter });
    }
    /* the works: the shop fronts of the Channel Gardens, and either side of Prometheus down on the rink */
    const mounts: Mount[] = [];
    for (const x of [24, 31, 38, 45, 52, 59]) for (const s of [-1, 1]) mounts.push({ position: v(x, 2.2, s * 8.38), rotation: s > 0 ? PI : 0, target: v(x, 2.2, s * 5.2), width: 2.6, height: 1.8, style: 'gilt', wash: true });
    for (const z of [-7.2, 7.2]) mounts.push({ position: v(-19.73, -1.0, z), rotation: PI / 2, target: v(-16.4, -1.0, z), width: 2.4, height: 1.7, style: 'gilt', wash: true });
    k.censusWall({ x: 13, y: -1.7, z: -9.73, rotY: 0, cols: 18, rows: 5, tile: 0.4, gap: 0.03, start: ctx.wallStart(4820, 90), pieces: ctx.all, backing: granite });
    /* what the plaza knows */
    const src = { name: 'Rockefeller Center Christmas Tree, Wikipedia', url: 'https://en.wikipedia.org/wiki/Rockefeller_Center_Christmas_Tree' };
    k.egg(v(TX + 8.6, 1.4, 0), { id: 'workers-1931', title: 'The first tree was twenty feet', year: '1931', text: 'The first tree here was put up on Christmas Eve 1931 by the men building Rockefeller Center: a 20 foot balsam fir hung with strings of cranberries, garlands of paper and a few tin cans.', clue: 'Before the lights there were cranberries.', source: src }, { r: 3 });
    k.egg(v(TX, tiers[6][1] + 5.9, 0), { id: 'star-2018', title: 'Nine hundred pounds of star', year: '2018', text: 'The star on top, replaced in 2018, has 70 spikes and three million crystals and weighs 900 pounds.', clue: 'The heaviest thing on the tree is at the very top.', source: src }, { r: 5 });
    k.egg(v(-24, 1.6, 6), { id: 'spruce', title: 'Sixty nine to a hundred feet', text: 'The tree is usually a Norway spruce between 69 and 100 feet tall, wrapped in about 50,000 multicoloured LEDs. The tallest, in 1999, was a 100 foot spruce from Killingworth, Connecticut. Since 2007 each tree has been milled into lumber for Habitat for Humanity when it comes down.', clue: 'Fifty thousand of something, and none of them the same colour as the one next to it.', source: src }, { r: 3 });
    k.egg(v(0, -2.6, 0), { id: 'rink-1936', title: 'Ice, since 1936', year: '1936', text: 'The skating rink opened in the sunken plaza below the tree in 1936. The first official tree, 50 feet tall, had been lit three years earlier, in 1933, and Rockefeller Center called it a holiday beacon for New Yorkers and visitors alike.', clue: 'The oldest thing on the ice is the ice.', source: src }, { r: 8 });
    k.egg(v(45, 2.4, 0), { id: 'lighting-night', title: 'The Wednesday after Thanksgiving', text: 'The tree is lit in a public ceremony on the last Wednesday of November or the first Wednesday of December, after Thanksgiving, and comes down in the first days of January.', clue: 'Stand between the angels and face the tree. That is where everyone stands on the night.', source: src }, { r: 3 });
    return { mounts, spawn: v(30.5, 3, -5.2), look: v(TX, 10, 0), eye: 3, floorY, bounds: [-33, 68, -18, 18], style: 'gilt' };
  },
};
