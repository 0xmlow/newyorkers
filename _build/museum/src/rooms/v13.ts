/* 124 rebuilt and 164: the Eldridge Street Synagogue as restored, and Gramercy Park with its key.
   Eldridge Street: the 1887 front on a street of tenements, the museum on the lower level where the
   New Yorkers hang, a stair up into the sanctuary under its painted stars, and the 2010 east window
   lit over the ark. No work hangs in the sanctuary. Gramercy Park: the locked park seen through its
   fence, the works hung on the railings and under the awnings, and a brass key that opens the gate. */
import * as T from 'three';
import { personTag } from '../kit';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as X from '../textures';
import { v, type Mount } from '../kit';
import type { RoomDef } from './types';
import { followInstances, hero, heroInstances } from './heroes';
import { street, blockFront, hsign, paintTex, anamorphTex } from './f';
import { fireflyPlate } from './a';
import { standIn as g9StandIn, hide as g9Hide } from './heroes'; // wave 9a, gramercy only
const PI = Math.PI;
type K = Parameters<RoomDef['build']>[0];

/* a five pointed star in the xy plane, facing +z */
function starGeo(r: number, inner = 0.42) {
  const s = new T.Shape();
  for (let i = 0; i < 10; i++) { const a = (i / 10) * PI * 2 + PI / 2, rr = i % 2 ? r * inner : r; i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  s.closePath();
  return new T.ShapeGeometry(s);
}
/* a six pointed star outline (two triangles), flat, facing +z */
function hexGeo(r: number, depth = 0.04) {
  return mergeGeometries([0, PI].map((rot) => { const s = new T.Shape(), hole = new T.Path(); for (let i = 0; i < 3; i++) { const a = rot + (i / 3) * PI * 2 + PI / 2; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); i ? hole.lineTo(Math.cos(a) * r * 0.66, Math.sin(a) * r * 0.66) : hole.moveTo(Math.cos(a) * r * 0.66, Math.sin(a) * r * 0.66); } s.closePath(); hole.closePath(); s.holes.push(hole); return new T.ExtrudeGeometry(s, { depth, bevelEnabled: false }); }))!;
}
/* a horseshoe arch moulding: a torus arc wider than a half circle, standing in the yz plane */
function horseshoe(k: K, x: number, y: number, z: number, r: number, tube: number, m: T.Material, rotY = PI / 2, arc = PI * 1.3) {
  const h = k.mesh(new T.TorusGeometry(r, tube, 8, 40, arc), m, x, y, z);
  h.rotation.y = rotY; h.rotateZ(PI / 2 - arc / 2);
  return h;
}
/* an arched window pane: a rectangle with a round head, as one flat shape facing +z */
function archPane(w: number, h: number, horseshoeHead = false) {
  const s = new T.Shape(), r = w / 2;
  s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, h - r);
  if (horseshoeHead) s.absarc(0, h - r, r * 1.08, -0.35, PI + 0.35, false); else s.absarc(0, h - r, r, 0, PI, false);
  s.lineTo(-r, 0);
  return new T.ShapeGeometry(s, 16);
}
/* a small figure: capsule and head, merged, for instancing */
function figureGeo(r = 0.2, len = 0.82, headY = 1.35) {
  const body = new T.CapsuleGeometry(r, len, 3, 8); body.translate(0, r + len / 2, 0);
  const head = new T.SphereGeometry(r * 0.62, 10, 8); head.translate(0, headY, 0);
  return personTag(mergeGeometries([body, head])!, 'auto');
}
/* pigeons pecking in a few spots: one instanced mesh, heads bobbing, a hop now and then */
function pigeons(k: K, reduced: boolean, spots: T.Vector3[], n: number, seed: number) {
  const g = new T.SphereGeometry(0.11, 7, 5); g.scale(1, 0.8, 1.6);
  const o = k.instances(g, k.flat(0x6d7078, 0.1, 0.8), Array.from({ length: n }, () => new T.Matrix4()));
  o.frustumCulled = false;
  const rnd = X.mulberry(seed), st = Array.from({ length: n }, (_, i) => ({ b: spots[i % spots.length], dx: (rnd() - 0.5) * 2.2, dz: (rnd() - 0.5) * 2.2, a: rnd() * 6.3, ph: rnd() * 10 }));
  const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), s = new T.Vector3(1, 1, 1), e = new T.Euler();
  const place = (t: number) => {
    st.forEach((a, i) => {
      const hop = Math.max(0, Math.sin(t * 0.7 + a.ph)) > 0.97 ? 0.12 : 0, peck = 0.25 * Math.max(0, Math.sin(t * 5 + a.ph));
      p.set(a.b.x + a.dx + Math.sin(t * 0.1 + a.ph) * 0.3, a.b.y + 0.12 + hop, a.b.z + a.dz); e.set(peck, a.a + Math.sin(t * 0.3 + a.ph) * 0.8, 0); q.setFromEuler(e);
      m.compose(p, q, s); o.setMatrixAt(i, m);
    });
    o.instanceMatrix.needsUpdate = true;
  };
  place(0); if (!reduced) k.ticks.push(place);
  followInstances(k, o, 'pigeon', { height: 0.28 }, new T.Matrix4().makeTranslation(0, -0.1, 0)); // 2026-10-28: pigeon.glb, as v22.ts
}
/* cars on a lane: boxes with a cabin, driving along z and wrapping */
function cars(k: K, reduced: boolean, lanes: { x: number; dir: 1 | -1; n: number; y?: number }[], len: number, seed: number, cols = [0xf0c22a, 0x1c1e24, 0xd8dadc, 0x5a6a7a, 0x8a1e22, 0x2a3a5a]) {
  const total = lanes.reduce((a, l) => a + l.n, 0);
  const bodyG = mergeGeometries([new T.BoxGeometry(1.8, 0.7, 4.3).translate(0, 0.55, 0), new T.BoxGeometry(1.6, 0.55, 2.2).translate(0, 1.15, -0.2)])!;
  const body = k.instances(bodyG, new T.MeshStandardMaterial({ roughness: 0.4, metalness: 0.3 }), Array.from({ length: total }, () => new T.Matrix4()));
  const wheelG = mergeGeometries([-1.4, 1.4].flatMap((z) => [-0.85, 0.85].map((x) => new T.CylinderGeometry(0.33, 0.33, 0.22, 10).rotateZ(PI / 2).translate(x, 0.33, z))))!;
  const wheels = k.instances(wheelG, k.flat(0x111214, 0, 0.8), Array.from({ length: total }, () => new T.Matrix4()));
  body.frustumCulled = wheels.frustumCulled = false;
  const rnd = X.mulberry(seed), c = new T.Color();
  const st: { x: number; dir: number; s: number; v: number; y: number }[] = [];
  lanes.forEach((l) => { for (let i = 0; i < l.n; i++) st.push({ x: l.x, dir: l.dir, s: (i / l.n) * len + rnd() * 6, v: 5 + rnd() * 3, y: l.y ?? 0 }); });
  st.forEach((_, i) => body.setColorAt(i, c.set(cols[Math.floor(rnd() * cols.length)])));
  if (body.instanceColor) body.instanceColor.needsUpdate = true;
  const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), one = new T.Vector3(1, 1, 1), up = new T.Vector3(0, 1, 0);
  const place = (_t: number, dt: number) => {
    st.forEach((a, i) => { a.s = (a.s + a.v * Math.min(dt, 0.1)) % len; p.set(a.x, a.y, a.dir * (a.s - len / 2)); q.setFromAxisAngle(up, a.dir > 0 ? 0 : PI); m.compose(p, q, one); body.setMatrixAt(i, m); wheels.setMatrixAt(i, m); });
    body.instanceMatrix.needsUpdate = wheels.instanceMatrix.needsUpdate = true;
  };
  place(0, 0); if (!reduced) k.ticks.push(place);
  return st;
}

/* ---------- THE BIG UPGRADE, wave 7a (2026-11-24): helpers for Eldridge Street only ----------
   Poly Haven scans from assets/museum/tex/eldridge/ wearing a set colour until all three maps land, real models fitted
   once and placed (seven or more as instanced parts), house font signs. All of it a no-op on canvas in node. */
const W7E_DOM = typeof window !== 'undefined' && typeof document !== 'undefined' && typeof HTMLImageElement !== 'undefined';
const w7eL = W7E_DOM ? new T.TextureLoader() : null;
const w7eS = new Map<string, { s: X.Surface; ready: Promise<unknown> }>();
function w7eScan(k: K, id: string, metres: number, paint: () => X.Surface, p: Partial<T.MeshStandardMaterialParameters> & { normal?: number } = {}, wait = 0x777777, tag = '') {
  if (!w7eL) return k.pbr(`w7e-${id}${tag}`, paint(), 1 / metres, p);
  let e = w7eS.get(id);
  if (!e) {
    const low = k.o.quality !== 'high', waits: Promise<unknown>[] = [];
    const one = (suf: string, srgb: boolean) => {
      let done: () => void = () => {};
      waits.push(new Promise<void>((r) => (done = r)));
      const t = w7eL.load(`assets/museum/tex/eldridge/${id}_${suf}.webp`, () => done(), undefined, () => done());
      t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8;
      if (srgb) t.colorSpace = T.SRGBColorSpace;
      return t as unknown as T.CanvasTexture;
    };
    e = { s: { map: one('c', true), normalMap: one('n', false), roughnessMap: low ? undefined : one('r', false) }, ready: Promise.all(waits) };
    w7eS.set(id, e);
  }
  k.pending.push(e.ready);
  const m = k.pbr(`w7e-${id}${tag}`, e.s, 1 / metres, p);
  if (!m.userData.w7e) {
    m.userData.w7e = true;
    const maps = { map: m.map, normalMap: m.normalMap, roughnessMap: m.roughnessMap }, tint = m.color.clone();
    m.map = m.normalMap = m.roughnessMap = null; m.color.set(wait);
    void e.ready.then(() => { Object.assign(m, maps); m.color.copy(tint); m.needsUpdate = true; });
  }
  return m;
}
function w7ePlace(k: K, name: string, fit: Parameters<typeof hero>[2], at: number[][], tweak?: (o: T.Object3D) => void, then?: (os: T.Object3D[]) => void) {
  if (!at.length) return;
  void hero(k, name, fit).then((h) => {
    if (!h || !k.live) return;
    h.traverse((c) => { if (!(c instanceof T.Mesh)) return; c.castShadow = false; for (const m of (Array.isArray(c.material) ? c.material : [c.material]) as T.MeshPhysicalMaterial[]) if (m.transmission > 0) { m.transmission = 0; m.transparent = true; m.opacity = 0.35; m.depthWrite = false; } });
    if (tweak) tweak(h);
    if (at.length > 6) {
      const ins = heroInstances(k, h, at.length), m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(0, 0, 0, 'YXZ');
      at.forEach(([x, y, z, r, s = 1], i) => ins.setAt(i, m.compose(new T.Vector3(x, y, z), q.setFromEuler(e.set(0, r, 0, 'YXZ')), new T.Vector3(s, s, s))));
      ins.commit(); then?.([]); return;
    }
    const os = at.map(([x, y, z, r, s = 1], i) => { const c = i ? h.clone() : h; c.position.set(x, y, z); c.rotation.set(0, r, 0); c.scale.setScalar(s); k.add(c); return c; });
    then?.(os);
  });
}
function w7eSign(k: K, text: string, w: number, h: number, x: number, y: number, z: number, rotY: number, fg: string, bg: string, font = 'W2 Archivo Expanded', lit = false, size = 0.6) {
  if (!W7E_DOM) return k.box(w, h, 0.02, x, y, z, k.flat(0x333333));
  return hsign(k, text, w, h, x, y, z, rotY, { fg, bg: bg || undefined, font, lit, size });
}
const W7E_HIDDEN = new T.MeshBasicMaterial({ visible: false });
/* Ground floor shops along a row of tenements whose fronts face `face` (+1 looks to +x) at x: glass, a lit interior,
   an awning, a fascia sign in the house lettering. */
function w7eShops(k: K, x: number, face: 1 | -1, zs: number[], names: string[], seed: number, awning = true) {
  const rnd = X.mulberry(seed), glass = k.glass(0x2a3440, 0.55, 0.06), lit = k.glow(0xffe2b0, 0.5), bulk = k.flat(0x1c2024, 0.4, 0.5);
  const cols = [0xb8262a, 0x1d5a3a, 0xe0a020, 0x1d2a5a, 0x8a1a4a, 0x2a2a2a];
  zs.forEach((z, i) => {
    const w = 6.6, fx = x + face * 0.06, c = cols[Math.floor(rnd() * cols.length)];
    k.box(0.12, 0.6, w, fx, 0.3, z, bulk);
    k.box(0.05, 2.4, w, fx, 1.8, z, glass);
    k.box(0.02, 2.2, w - 0.3, fx - face * 0.3, 1.8, z, lit);
    for (const dz of [-w / 2, w / 2]) k.box(0.16, 3.2, 0.14, fx + face * 0.02, 1.6, z + dz, bulk);
    k.box(0.22, 1.25, w + 0.6, fx + face * 0.08, 3.62, z, k.flat(c, 0.1, 0.7));
    w7eSign(k, names[i % names.length], w - 0.4, 0.62, fx + face * 0.21, 3.62, z, face > 0 ? PI / 2 : -PI / 2, '#f6f0e4', '', 'W2 Archivo Expanded', false, 0.62);
    if (!awning) return;
    const a = k.box(1.5, 0.05, w + 0.2, fx + face * 0.75, 2.95, z, k.flat(c, 0, 0.85)); a.rotation.z = -face * 0.4;
    k.box(0.03, 0.26, w + 0.2, fx + face * 1.45, 2.6, z, k.flat(c, 0, 0.85));
  });
}

/* ---------------- 124 ELDRIDGE STREET, REBUILT ---------------- */
export const eldridge2: RoomDef = {
  id: 'eldridge',
  name: 'An immigrant constellation',
  area: 'ELDRIDGE STREET SYNAGOGUE',
  mood: 'Painted stars, a window of blue glass',
  color: '#2f4f9a',
  description: 'The 1887 front of the Eldridge Street Synagogue on a Lower East Side street of tenements, with its horseshoe arches, twin towers and rose window. Go in by the museum doors in the towers: the New Yorkers hang on the lower level, and a stair climbs from there into the restored sanctuary, where gold stars cover the blue vaults, brass chandeliers hang over the pews and the round east window of 2010 glows above the ark.',
  signatures: 'The Moorish Revival front by Peter and Francis William Herter with its horseshoe arches, towers and rose window of twelve roundels, the Museum at Eldridge Street on the lower level, the sanctuary with its women\'s gallery on columns, painted stars on blue vaults, brass chandeliers, the central bimah and the carved walnut ark, the ner tamid, and the 2010 east window by Kiki Smith and Deborah Gans.',
  build(k, ctx) {
    k.sky({ top: 0x6f98d0, horizon: 0xe4e0d8, ground: 0x4a4a48, fog: 0.0026, sun: { az: 1.4, el: 0.5, color: 0xfff0d8, size: 12 }, env: 0.75 });
    k.hemi(0xe8ecff, 0x8a8478, 0.75);
    k.sun(0xffe8c8, 1.9, 50, 55, 25, true, 70);
    // 2026-11-24 wave 7a: brick, floors and plaster are Poly Haven scans (tex/eldridge/), the street too
    const brick = w7eScan(k, 'large_red_bricks', 2.6, () => X.brick(0x8e5f44, 1453), { color: 0xe0b098, roughness: 0.9 }, 0x8e5f44),
      stone = k.pbr('el2Stone', X.ashlar(0xd6c8aa, 1455, 3), 0.25),
      terra = k.flat(0xb87a56, 0, 0.72),
      terraDark = k.flat(0x8a5238, 0, 0.8),
      floorW = w7eScan(k, 'old_wood_floor', 2.2, () => X.planks(0x8a6844, 9, 1456), { color: 0xd8b088, roughness: 0.65 }, 0x8a6844),
      wallS = w7eScan(k, 'plastered_wall_04', 2.5, () => X.plaster(0xd8a882, 1457), { color: 0xe8b48a, roughness: 0.85 }, 0xd0a07a),
      wallL = w7eScan(k, 'plastered_wall_04', 2.5, () => X.plaster(0xe6ded0, 1458), { color: 0xf0e8da, roughness: 0.9 }, 0xe0d8ca, 'L'),
      vaultM = k.flat(0x1f3c86, 0, 0.9, { side: T.BackSide }),
      ceilM = k.flat(0x1f3c86, 0, 0.9),
      marbleCol = k.pbr('el2Marb', X.marble(0xcfb89a, 0x8a6a50, 1459), 0.8, { roughness: 0.4 }),
      walnut = k.pbr('el2Walnut', X.planks(0x4a2e1a, 3, 1460, 0.2), 1.6, { roughness: 0.45 }),
      pew = k.pbr('el2Pew', X.planks(0x6a4428, 4, 1461, 0.2), 1.4, { roughness: 0.5 }),
      gilt = k.pbr('el2Gilt', X.gilt(0xd0a852), 2, { metalness: 0.85, roughness: 0.3 }),
      brass = k.flat(0xc09a48, 0.85, 0.32),
      iron = k.flat(0x1f262b, 0.75, 0.45),
      dark = k.flat(0x16181c, 0.3, 0.7),
      /* 2026-11-24 wave 7a: the windows were black: leaded glass now, amber and cream quarries in a ruby and cobalt border,
         lit a little from inside so the front reads as stained glass from the street (ShapeGeometry UVs run in metres) */
      leaded = W7E_DOM ? (() => { const t = paintTex(256, 256, (g, w, h) => {
        g.fillStyle = '#1a1612'; g.fillRect(0, 0, w, h);
        const rs = X.mulberry(1887), cols = ['#d8a850', '#e8d0a0', '#c89040', '#f0e0b8'];
        for (let i = -1; i < 5; i++) for (let j = -1; j < 5; j++) { const cx = i * 64 + (j % 2 ? 32 : 0), cy = j * 64; g.fillStyle = cols[Math.floor(rs() * 4)]; g.beginPath(); g.moveTo(cx, cy - 30); g.lineTo(cx + 30, cy); g.lineTo(cx, cy + 30); g.lineTo(cx - 30, cy); g.closePath(); g.fill(); }
        g.fillStyle = '#8a1a24'; g.fillRect(0, 0, 18, h); g.fillRect(w - 18, 0, 18, h); g.fillStyle = '#2a4ab0'; g.fillRect(4, 0, 8, h); g.fillRect(w - 12, 0, 8, h);
      }); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(1.6, 1.6); return new T.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.45, roughness: 0.18, metalness: 0.1, side: T.DoubleSide }); })() : k.flat(0x2a3444, 0.5, 0.25),
      velvet = k.pbr('el2Velvet', X.velvet(0x6a1a28), 0.5, { roughness: 0.9 }),
      globe = k.glow(0xe8d2a8),
      starGold = new T.MeshBasicMaterial({ color: 0xf2c75a }),
      pane = [k.glow(0xd8a850), k.glow(0x3a5ad0), k.glow(0xb84040), k.glow(0x4a9a6a), k.glow(0x8a6ad0), k.glow(0xe8c070)];
    const FX = -8, FI = -8.6, SW = -16.5, EI = -31.4, ZI = 7.4, F0 = -1.2, S0 = 3.5, BY = S0 + 4.4, SY = 14.5, NR = 4.6;
    /* Eldridge Street: narrow, tenements shoulder to shoulder, the Manhattan Bridge side far off */
    { // the street in scans: asphalt, concrete flags, granite kerbs (street() of f.ts, re-laid here)
      const asphalt = w7eScan(k, 'asphalt_02', 4, () => X.asphalt(0x24282d), { color: 0x8c8c8c, roughness: 0.92 }, 0x3a3c40),
        pav = w7eScan(k, 'concrete_pavement', 2.2, () => X.pavers(0x8e8b84, 5), { color: 0xc8c2b6, roughness: 0.9 }, 0x8e8b84),
        granite = k.pbr('curbS', X.ashlar(0x8a8a86, 4, 2), 0.35), yellow = k.flat(0xe6a626, 0, 0.6), white = k.flat(0xdedbd2, 0, 0.7);
      k.box(9, 0.3, 130, 0, -0.15, 0, asphalt);
      for (const sd of [-1, 1]) { k.box(3.5, 0.28, 130, sd * 6.25, 0, 0, pav); k.box(0.3, 0.32, 130, sd * 4.6, 0.02, 0, granite); }
      for (const dx of [-0.14, 0.14]) k.box(0.09, 0.012, 124, dx, 0.01, 0, yellow);
      for (const cz of [59, 31, 3, -25, -53]) for (let cx = -3.3; cx <= 3.5; cx += 1.2) k.box(0.62, 0.014, 2.8, cx, 0.012, cz, white);
    }
    blockFront(k, { x: -8, z0: 44, count: 5, face: 1, seed: 1445, h: [15, 21] });
    blockFront(k, { x: -8, z0: -12, count: 5, face: 1, seed: 1446, h: [15, 21] });
    blockFront(k, { x: 8, z0: 44, count: 12, face: -1, seed: 1457, h: [15, 22] });
    { const names = ['FRUIT  ·  VEGETABLES', 'BAKERY', 'NOODLES', 'HARDWARE', 'TEA  ·  HERBS', 'LAUNDROMAT', 'FISH MARKET', 'DUMPLINGS', 'TAILOR', 'BARBER', 'TRAVEL', 'JEWELRY'];
      w7eShops(k, -8, 1, [44, 36, 28, 20, 12, -12, -20, -28, -36, -44], names, 1490, false);
      w7eShops(k, 8, -1, Array.from({ length: 12 }, (_, i) => 44 - i * 8), names.slice(5).concat(names.slice(0, 5)), 1491); }
    k.skyline({ z: -110, count: 20, spacing: 5, scale: 2.2, base: -1, seed: 1482, lit: 0.22, glow: 0.4, tint: 0x5e6674, rows: 2 });
    k.skyline({ z: 110, count: 20, spacing: 5, scale: 2.0, base: -1, seed: 1483, lit: 0.22, glow: 0.4, tint: 0x5e6674, rows: 1 });
    k.block(-60, -8, 7.4, 60); k.block(-60, -8, -60, -7.4);
    for (const z of [-24, 26]) k.prop('lamppost', 5.6, 0, z, { height: 6, keepOut: 0.5 });
    k.prop('lamppost', -5.6, 0, -20, { height: 6, keepOut: 0.5 });
    k.prop('hydrant', -5.4, 0, 12.6, { height: 1.1, keepOut: 0.5 });
    k.tree(5.9, 0, -9, { kind: 'round', h: 5.5, r: 2.2, seed: 1421, leaf: 0x3f6b36 });
    k.keepOut.push({ x: 5.9, z: -9, r: 0.6 });

    /* ---- the front: brick with terra cotta and stone, three doors on the stoop, the towers, the rose ---- */
    const faceX = FX + 0.02;
    k.box(0.6, 20.2, 9.9, FX - 0.3, 10.1, 0, brick);                                   // centre bay
    for (const s of [-1, 1]) {
      k.box(0.6, 18.5, 1.45, FX - 0.3, 9.25, s * 7.275, brick);                         // tower outer strip
      k.box(0.6, 15.3, 1.6, FX - 0.3, 3.2 + 7.65, s * 5.75, brick);                     // tower above the museum door
      k.box(1.0, 18.8, 0.5, FX + 0.1, 9.4, s * 3.75, brick);                            // tower buttress lines
      k.box(1.0, 18.8, 0.5, FX + 0.1, 9.4, s * 7.75, brick);
    }
    k.block(FX - 0.6, FX + 0.6, -8, -6.55); k.block(FX - 0.6, FX + 0.6, -4.95, 4.95); k.block(FX - 0.6, FX + 0.6, 6.55, 8);
    for (const y of [5.4, 10.6, 18.2]) k.box(0.9, 0.42, 16.4, FX + 0.1, y, 0, stone);                         // string courses
    k.moulding([[0, 0], [0.5, 0], [0.62, 0.18], [0.4, 0.34], [0.5, 0.5], [0, 0.6]], 16.6, FX + 0.05, 18.4, 0, terra, 0);
    /* the stoop and the three doors of the sanctuary */
    for (let i = 0; i < 8; i++) k.box(2.6 - i * 0.3, 0.2, 5.6, FX + 1.3 - i * 0.15 + 0.2, 0.1 + i * 0.2, 0, stone);
    k.block(FX, FX + 2.7, -2.9, 2.9); k.keepOut.push({ x: FX + 1.6, z: 0, r: 1.2 });
    for (const s of [-1, 1]) { k.box(2.8, 1.0, 0.3, FX + 1.4, 1.1, s * 2.95, stone); k.sphere(0.2, FX + 2.7, 1.8, s * 2.95, stone, 10); }
    const doorsY = 1.6;
    for (const [z, w, h] of [[0, 2.0, 3.4], [-2.4, 1.2, 2.6], [2.4, 1.2, 2.6]] as [number, number, number][]) {
      k.box(0.05, h, w, faceX, doorsY + h / 2, z, dark);
      horseshoe(k, faceX + 0.12, doorsY + h - w * 0.35, z, w * 0.58, 0.13, terra);
      k.box(0.3, 0.25, w + 0.5, faceX + 0.1, doorsY + 0.1, z, stone);
    }
    const leafG = new T.BoxGeometry(0.1, 2.9, 0.95); leafG.translate(0, 1.45, 0.475);
    const doorLeaf = new T.Mesh(leafG, walnut); doorLeaf.position.set(faceX + 0.08, doorsY, -0.95); k.add(doorLeaf);
    k.mesh(leafG, walnut, faceX + 0.08, doorsY, 0.95).rotation.y = PI;
    const hexM = hexGeo(0.26);
    for (const z of [-0.5, 0.5]) for (const y of [2.4, 3.6]) k.mesh(hexM, gilt, faceX + 0.16, doorsY + y - 1.6 + 0.8, z).rotation.y = PI / 2;
    /* the museum doors in the towers, open, at street level */
    for (const s of [-1, 1]) {
      const a = k.arch(1.6, 3.1, 0.7, FX - 0.3, 0, s * 5.75, stone, false, 0.62); a.rotation.y = PI / 2;
      horseshoe(k, faceX + 0.15, 2.2, s * 5.75, 1.0, 0.11, terra);
      k.sign('MUSEUM ENTRANCE', 1.8, 0.3, faceX + 0.2, 3.95, s * 5.75, '#1d2f5c', '#f4f0e8', 90, PI / 2);
    }
    /* the arcade of five horseshoe windows over the doors */
    const winG = archPane(0.95, 3.2, true);
    for (let i = 0; i < 5; i++) { const z = (i - 2) * 1.4; k.mesh(winG, leaded, faceX + 0.04, 6.4, z).rotation.y = PI / 2; horseshoe(k, faceX + 0.1, 6.4 + 3.2 - 0.5, z, 0.55, 0.07, terra); k.box(0.2, 3.2, 0.14, faceX + 0.1, 8.0, z + 0.7, stone); }
    k.box(0.2, 3.2, 0.14, faceX + 0.1, 8.0, -2.1, stone);
    /* tower windows, paired, and a small round window above */
    for (const s of [-1, 1]) {
      for (const dz of [-0.55, 0.55]) { k.mesh(archPane(0.75, 2.8, true), leaded, faceX + 0.04, 6.4, s * 5.75 + dz).rotation.y = PI / 2; horseshoe(k, faceX + 0.1, 6.4 + 2.8 - 0.4, s * 5.75 + dz, 0.43, 0.06, terra); }
      k.mesh(archPane(0.9, 3.4, true), leaded, faceX + 0.04, 11.6, s * 5.75).rotation.y = PI / 2;
      horseshoe(k, faceX + 0.1, 11.6 + 3.4 - 0.45, s * 5.75, 0.52, 0.07, terra);
      k.mesh(new T.CircleGeometry(0.55, 20), pane[1], faceX + 0.05, 16.2, s * 5.75).rotation.y = PI / 2;
      k.torus(0.6, 0.08, faceX + 0.08, 16.2, s * 5.75, terra, 24).rotation.y = PI / 2;
      /* the tower tops: a cornice, an open aedicule on little columns, a dome and a finial */
      const tz = s * 5.75, tx = FX - 2.1;
      k.box(4.6, 0.5, 4.8, tx, 18.75, tz, stone);
      for (const [dx, dz] of [[-1.6, -1.7], [1.6, -1.7], [-1.6, 1.7], [1.6, 1.7]]) k.cyl(0.16, 2.2, tx + dx, 20.1, tz + dz, stone, 0.16, 10);
      k.box(4.0, 0.35, 4.2, tx, 21.35, tz, stone);
      k.sphere(1.5, tx, 21.5, tz, terraDark, 14).scale.y = 0.8;
      k.cyl(0.05, 1.3, tx, 23.3, tz, brass, 0.05, 6);
      k.mesh(hexGeo(0.42, 0.05), gilt, tx, 24.2, tz).rotation.y = PI / 2;
      k.box(4.6, 18.5, 0.6, tx, 9.25, s * 7.7, brick);
    }
    /* the rose window: twelve roundels round a centre, inside a great horseshoe of terra cotta */
    const RY = 14.0;
    k.mesh(new T.CircleGeometry(3.0, 48), leaded, faceX + 0.04, RY, 0).rotation.y = PI / 2;
    k.mesh(new T.CircleGeometry(0.9, 24), pane[0], faceX + 0.07, RY, 0).rotation.y = PI / 2;
    for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; k.mesh(new T.CircleGeometry(0.5, 14), pane[[1, 0, 2, 3, 4, 5][i % 6]], faceX + 0.07, RY + Math.sin(a) * 2.15, Math.cos(a) * 2.15).rotation.y = PI / 2; k.beam(v(faceX + 0.09, RY + Math.sin(a) * 0.95, Math.cos(a) * 0.95), v(faceX + 0.09, RY + Math.sin(a) * 2.95, Math.cos(a) * 2.95), 0.05, stone, 5); }
    k.torus(3.05, 0.22, faceX + 0.1, RY, 0, stone, 48).rotation.y = PI / 2;
    horseshoe(k, faceX + 0.2, RY - 0.2, 0, 3.6, 0.3, terra, PI / 2, PI * 1.36);
    { const gable = new T.Shape(); gable.moveTo(-4.9, 0); gable.lineTo(4.9, 0); gable.lineTo(0, 2.4); gable.closePath(); const gg = new T.ExtrudeGeometry(gable, { depth: 0.6, bevelEnabled: false }); gg.translate(0, 0, -0.3); k.mesh(gg, brick, FX - 0.3, 20.2, 0).rotation.y = PI / 2; }
    k.cyl(0.05, 1.4, FX - 0.3, 23.2, 0, brass, 0.05, 6);
    k.mesh(hexGeo(0.5, 0.05), gilt, FX - 0.3, 24.2, 0).rotation.y = PI / 2;
    k.sign('KAHAL ADATH JESHURUN  1887', 5.4, 0.46, faceX + 0.36, 5.4, 0, 'transparent', '#3a2a1c', 72, PI / 2);
    k.sign('MUSEUM AT ELDRIDGE STREET', 3.4, 0.5, -4.7, 2.6, 9.9, '#1d2f5c', '#f4f0e8', 64, 0);
    k.cyl(0.05, 3.0, -4.7, 1.5, 9.9, iron, 0.05, 6);
    /* the roof over the whole house */
    k.box(24.2, 0.5, 16.4, (FX + EI) / 2 - 0.3, 20.3, 0, dark);
    for (const s of [-1, 1]) k.box(24, 20.5, 0.6, (FX + EI) / 2 - 0.3, 10.25, s * 7.7, brick);
    k.box(0.6, 20.5, 16.4, EI - 0.3, 10.25, 0, brick);
    k.rail(FX + 3.0, -5.6, 4.6, iron, 1.0, 'z', 0.5); k.rail(FX + 3.0, 5.6, 4.6, iron, 1.0, 'z', 0.5);
    k.block(FX + 2.9, FX + 3.1, 3.3, 7.9); k.block(FX + 2.9, FX + 3.1, -7.9, -3.3);

    /* ---- the lower level: the Museum at Eldridge Street, where the New Yorkers hang ---- */
    k.box(8.0, 0.3, 14.8, (FI + SW) / 2, F0 - 0.15, 0, floorW);
    { const ramp = k.box(1.9, 0.3, 14.8, FX - 0.9, -0.75, 0, floorW); ramp.rotation.z = Math.atan2(1.2, 1.8); }
    for (const s of [-1, 1]) k.box(6.6, 0.3, 5.85, (SW + FI - 1.4) / 2, S0 - 0.15, s * 4.47, wallL);
    k.box(1.4, 0.3, 14.8, FI - 0.7, S0 - 0.15, 0, wallL);
    for (const s of [-1, 1]) {
      k.box(6.5, S0 + 3.7 - F0, 0.3, (SW - 10) / 2, (F0 + S0 + 3.7) / 2, s * 1.55, wallL);            // the stair walls
      k.block(SW, -10, s > 0 ? 1.4 : -1.7, s > 0 ? 1.7 : -1.4);
      k.box(0.6, 20, 5.9, SW, (F0 + 18.8) / 2, s * 4.5, wallL);                                          // the wall between the levels
      k.block(SW - 0.3, SW + 0.3, s > 0 ? 1.4 : -7.5, s > 0 ? 7.5 : -1.4);
      k.box(8.0, 4.8, 0.05, (FI + SW) / 2, F0 + 2.4, s * 7.38, wallL);
      for (const x of [-10.6, -13.2, -15.6]) k.point(x, S0 - 1.0, s * 4.5, 0xffe2b8, 5, 7);
      k.box(7.9, 0.08, 0.2, (FI + SW) / 2, S0 - 0.45, s * 7.2, brass);
    }
    k.box(6.5, 0.3, 3.4, (SW - 10) / 2, S0 + 3.85, 0, wallL);
    for (let i = 0; i < 24; i++) { const x = -10 - (i + 0.5) * (6.5 / 24), y = F0 + (i + 1) * (4.7 / 24); k.box(6.5 / 24, y - F0, 2.8, x, (y + F0) / 2, 0, floorW); }
    k.sign('THE SANCTUARY', 2.4, 0.4, -10.3, 3.0, 0, '#1d2f5c', '#f4f0e8', 90, PI / 2);
    k.sign('MUSEUM AT ELDRIDGE STREET  LOWER LEVEL', 5.2, 0.42, FI - 0.06, 2.75, 3.7, '#1d2f5c', '#f4f0e8', 50, -PI / 2);
    /* a glass case and a bench in each gallery */
    for (const s of [-1, 1]) {
      k.box(1.0, 0.9, 0.7, -14.45, F0 + 0.45, s * 5.9, walnut);
      k.box(0.9, 0.5, 0.6, -14.45, F0 + 1.15, s * 5.9, k.glass(0xd8eef4, 0.18, 0.05));
      k.keepOut.push({ x: -14.45, z: s * 5.9, r: 0.65 });
    }
    k.box(0.5, 0.3, 0.4, -14.45, F0 + 0.95, -5.9, k.flat(0xe8dcc0, 0, 0.8));
    k.box(0.4, 0.06, 0.3, -14.45, F0 + 0.95, 5.9, k.flat(0x3a2a1c, 0, 0.8));
    /* ---- the works: the lower level galleries, and boards on the sidewalk outside ---- */
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) {
      for (const x of [-10.7, -12.95, -15.2]) mounts.push({ position: v(x, F0 + 1.9, s * 7.34), rotation: s > 0 ? PI : 0, target: v(x, F0 + 1.8, s * 4.2), width: 2.0, height: 1.7, style: 'gilt', wash: true });
      for (const x of [-12.1, -14.8]) mounts.push({ position: v(x, F0 + 1.9, s * 1.72), rotation: s > 0 ? 0 : PI, target: v(x, F0 + 1.8, s * 4.9), width: 2.0, height: 1.7, style: 'gilt', wash: true });
    }
    mounts.push({ position: v(SW + 0.32, F0 + 1.9, -4.5), rotation: PI / 2, target: v(SW + 3.6, F0 + 1.8, -4.5), width: 2.6, height: 1.9, style: 'gilt', wash: true });
    k.censusWall({ x: SW + 0.32, y: F0 + 1.8, z: 4.5, rotY: PI / 2, cols: 9, rows: 5, tile: 0.5, gap: 0.05, start: ctx.wallStart(7100, 45), pieces: ctx.all, backing: walnut });
    for (const z of [11.2, 16.8, 22.4, -11.2, -16.8]) {
      mounts.push({ position: v(-7.62, 1.95, z), rotation: PI / 2, target: v(-4.4, 1.8, z), width: 2.2, height: 1.9, style: 'black', wash: true });
      k.box(0.12, 2.3, 2.5, -7.8, 1.9, z, k.flat(0x1d2f5c, 0.1, 0.6));
    }

    /* ---- the sanctuary ---- */
    const NX0 = SW, NX1 = EI, NL = NX0 - NX1, NC = (NX0 + NX1) / 2;
    k.box(NL, 0.3, 14.8, NC, S0 - 0.15, 0, floorW);
    k.box(NL, SY - S0, 0.1, NC, (S0 + SY) / 2, 7.37, wallS); k.box(NL, SY - S0, 0.1, NC, (S0 + SY) / 2, -7.37, wallS);
    k.box(0.1, 20, 14.8, EI + 0.03, 10, 0, wallS);
    k.box(0.1, SY - S0 - 3.6, 2.9, SW - 0.33, S0 + 3.6 + (SY - S0 - 3.6) / 2, 0, wallS);
    k.box(0.1, 20 - SY, 14.8, SW - 0.33, (SY + 20) / 2, 0, wallS);
    /* the women's gallery on three sides: slab, painted front, lower columns, horseshoe arcade above */
    for (const s of [-1, 1]) {
      k.box(NL - 2.8, 0.35, 2.8, NC - 1.4, BY, s * 6.0, walnut);
      k.box(NL - 2.8, 1.2, 0.2, NC - 1.4, BY + 0.6, s * NR, wallS);
      k.moulding([[0, 0], [0.12, 0], [0.16, 0.06], [0.08, 0.12], [0, 0.16]], NL - 2.8, NC - 1.4, BY + 1.2, s * (NR - 0.1), gilt, s > 0 ? PI / 2 : -PI / 2);
      k.box(NL - 2.8, 0.14, 0.24, NC - 1.4, BY - 0.1, s * NR, gilt);
      k.arcade(NL - 2.8, SY - BY - 1.2, 0.3, 4, 2.2, SY - BY - 2.2, NC - 1.4, BY + 1.2, s * NR, wallS, 0);
      k.box(NL, 0.2, 2.8, NC, SY + 0.1, s * 6.0, ceilM);
      for (const x of [-19.3, -22.3, -25.35, -28.4]) { k.column(x, S0, s * NR, BY - S0 - 0.2, 0.24, marbleCol, false, gilt); k.keepOut.push({ x, z: s * NR, r: 0.5 }); }
    }
    k.box(2.8, 0.35, 9.2, SW - 1.4, BY, 0, walnut);
    k.box(0.2, 1.2, 9.2, SW - 2.8, BY + 0.6, 0, wallS);
    k.box(0.24, 0.14, 9.2, SW - 2.8, BY - 0.1, 0, gilt);
    for (const z of [-1.8, 1.8]) { k.column(SW - 2.8, S0, z, BY - S0 - 0.2, 0.24, marbleCol, false, gilt); k.keepOut.push({ x: SW - 2.8, z, r: 0.5 }); }
    k.box(2.8, 0.2, 14.8, SW - 1.4, SY + 0.1, 0, ceilM);
    /* plaster soffits under the galleries, and the sanctuary face of the west wall */
    for (const sd of [-1, 1]) { k.box(NL - 2.8, 0.05, 2.8, NC - 1.4, BY - 0.2, sd * 6.0, wallS); k.box(0.05, SY - S0, 5.9, SW - 0.32, (S0 + SY) / 2, sd * 4.5, wallS); }
    k.box(2.8, 0.05, 9.2, SW - 1.4, BY - 0.2, 0, wallS);
    for (const s of [-1, 1]) for (const x of [-19.3, -22.3, -25.35, -28.4]) k.cyl(0.2, SY - BY - 1.2, x, BY + 1.2 + (SY - BY - 1.2) / 2, s * NR, marbleCol, 0.2, 12);
    /* the vaults: a barrel down the nave and a cross barrel over the middle, blue, full of gold stars */
    const nave = k.mesh(new T.CylinderGeometry(NR, NR, NL - 2.8, 40, 1, true, 0, PI), vaultM, NC - 1.4, SY, 0); nave.rotation.z = PI / 2;
    const XC = -25.35, XR = 3.0;
    const cross = k.mesh(new T.CylinderGeometry(XR, XR, 14.8, 32, 1, true, PI / 2, PI), vaultM, XC, SY, 0); cross.rotation.x = PI / 2;
    for (const s of [-1, 1]) { const tymp = new T.Shape(); tymp.absarc(0, 0, XR, 0, PI, false); tymp.lineTo(XR, 0); const tm = k.mesh(new T.ShapeGeometry(tymp, 20), wallS, XC, SY, s * 7.36); if (s > 0) tm.rotation.y = PI; }
    {
      const sg = starGeo(0.2), mats: T.Matrix4[] = [], q = new T.Quaternion(), fwd = new T.Vector3(0, 0, 1), nrm = new T.Vector3(), rs = X.mulberry(1462), sc = new T.Vector3();
      for (let row = 0; row < 11; row++) for (let col = 0; col < 18; col++) {
        const th = ((row + 0.5) / 11) * PI, x = NX0 - 3.2 - col * ((NL - 3.4) / 18) + (rs() - 0.5) * 0.3;
        if (Math.abs(x - XC) < XR + 0.1) continue;
        nrm.set(0, -Math.sin(th), Math.cos(th)); q.setFromUnitVectors(fwd, nrm); sc.setScalar(0.8 + rs() * 0.5);
        mats.push(new T.Matrix4().compose(v(x, SY + Math.sin(th) * (NR - 0.05), -Math.cos(th) * (NR - 0.05)), q, sc));
      }
      for (let row = 0; row < 8; row++) for (let col = 0; col < 22; col++) {
        const th = ((row + 0.5) / 8) * PI, z = -7.1 + col * (14.2 / 21);
        if (Math.abs(z) < NR - 0.2 && Math.sin(th) * XR < NR * 0.9) continue;
        nrm.set(Math.cos(th), -Math.sin(th), 0); q.setFromUnitVectors(fwd, nrm); sc.setScalar(0.7 + rs() * 0.4);
        mats.push(new T.Matrix4().compose(v(XC - Math.cos(th) * (XR - 0.05), SY + Math.sin(th) * (XR - 0.05), z), q, sc));
      }
      const down = new T.Vector3(0, -1, 0);
      q.setFromUnitVectors(fwd, down);
      for (let i = 0; i < 90; i++) { const s = i % 2 ? 1 : -1, x = NX1 + 0.4 + rs() * (NL - 0.8), z = s * (NR + 0.3 + rs() * 2.4); if (Math.abs(x - XC) < XR) continue; mats.push(new T.Matrix4().compose(v(x, SY - 0.02, z), q, sc.setScalar(0.6 + rs() * 0.3))); }
      for (let i = 0; i < 30; i++) { const x = SW - 0.3 - rs() * 2.3, z = (rs() - 0.5) * 14; mats.push(new T.Matrix4().compose(v(x, SY - 0.02, z), q, sc.setScalar(0.6 + rs() * 0.3))); }
      k.instances(sg, starGold, mats);
      /* gilt ribs on the nave vault */
      for (const x of [-19.3, -22.3, -28.4, EI + 0.2]) k.curve(Array.from({ length: 21 }, (_, j) => { const t = (j / 20) * PI; return v(x, SY + Math.sin(t) * (NR - 0.08), -Math.cos(t) * (NR - 0.08)); }), 0.1, gilt, 20);
      for (const x of [XC - XR, XC + XR]) k.box(0.2, 0.2, 14.8, x, SY, 0, gilt);
      k.box(NL, 0.22, 0.22, NC, SY, NR, gilt); k.box(NL, 0.22, 0.22, NC, SY, -NR, gilt);
    }
    /* painted bands and the side windows of stained glass, on both levels */
    for (const s of [-1, 1]) {
      k.box(NL, 0.18, 0.06, NC, S0 + 3.3, s * 7.33, gilt);
      k.box(NL, 0.5, 0.06, NC, S0 + 0.25, s * 7.33, walnut);
      for (const x of [-20.8, -23.8, -27.0, -30.0]) {
        for (const [y, h, w] of [[S0 + 0.9, 2.6, 1.1], [BY + 1.3, 3.8, 1.3]] as [number, number, number][]) {
          const p = k.mesh(archPane(w, h), pane[(Math.round(-x) + (y > 6 ? 1 : 0)) % 2 ? 0 : 5], x, y, s * 7.3); if (s > 0) p.rotation.y = PI;
          const f = k.mesh(archPane(w * 0.45, h * 0.6), pane[1], x, y + h * 0.25, s * 7.28); if (s > 0) f.rotation.y = PI;
        }
      }
    }
    /* the west rose from the inside, over the gallery */
    k.mesh(new T.CircleGeometry(2.4, 40), leaded, SW - 0.36, 11.4, 0).rotation.y = -PI / 2;
    for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; k.mesh(new T.CircleGeometry(0.42, 14), pane[[1, 0, 2, 3, 4, 5][i % 6]], SW - 0.38, 11.4 + Math.sin(a) * 1.7, Math.cos(a) * 1.7).rotation.y = -PI / 2; }
    k.mesh(new T.CircleGeometry(0.7, 20), pane[0], SW - 0.38, 11.4, 0).rotation.y = -PI / 2;
    k.torus(2.45, 0.12, SW - 0.4, 11.4, 0, gilt, 40).rotation.y = PI / 2;
    /* the pews, facing east, in two banks and under the galleries */
    const pewRow = (x: number, z: number, len: number) => { k.box(0.5, 0.06, len, x, S0 + 0.48, z, pew); k.box(0.08, 0.62, len, x + 0.25, S0 + 0.8, z, pew); k.box(0.5, 0.45, 0.06, x, S0 + 0.24, z - len / 2 + 0.03, pew); k.box(0.5, 0.45, 0.06, x, S0 + 0.24, z + len / 2 - 0.03, pew); };
    const pewXs = [-19.9, -21.0, -26.8, -27.9];
    for (const x of pewXs) for (const s of [-1, 1]) pewRow(x, s * 2.95, 2.5);
    for (let x = -19.9; x > -29.5; x -= 1.1) for (const s of [-1, 1]) pewRow(x, s * 6.3, 2.0);
    for (const s of [-1, 1]) { k.block(-21.4, -19.5, s > 0 ? 1.65 : -4.25, s > 0 ? 4.25 : -1.65); k.block(-28.3, -26.4, s > 0 ? 1.65 : -4.25, s > 0 ? 4.25 : -1.65); k.block(-29.8, -19.5, s > 0 ? 5.2 : -7.4, s > 0 ? 7.4 : -5.2); }
    /* the floorboards, worn pale where people stood and swayed in front of each pew */
    const worn = k.flat(0xa88660, 0, 0.95);
    for (const x of pewXs) for (const s of [-1, 1]) k.plane(0.42, 2.1, x - 0.55, S0 + 0.012, s * 2.95, worn, 0, -PI / 2);
    /* the bimah in the middle: a raised platform, a turned rail, four brass lamps */
    const BX = XC;
    k.box(3.4, 0.8, 2.8, BX, S0 + 0.4, 0, walnut);
    for (const [dx, dz, w, d] of [[0, 1.4, 3.4, 0.08], [0, -1.4, 3.4, 0.08], [1.7, 0, 0.08, 2.8], [-1.7, 0, 0.08, 1.0]] as [number, number, number, number][]) k.box(w, 0.1, d, BX + dx, S0 + 1.75, dz, walnut);
    for (let i = 0; i < 22; i++) { const u = i / 21; k.cyl(0.035, 0.95, BX - 1.7 + u * 3.4, S0 + 1.27, 1.4, walnut, 0.035, 6); k.cyl(0.035, 0.95, BX - 1.7 + u * 3.4, S0 + 1.27, -1.4, walnut, 0.035, 6); }
    k.box(1.0, 1.1, 0.8, BX + 0.3, S0 + 1.35, 0, walnut);
    k.box(1.2, 0.06, 1.0, BX + 0.3, S0 + 1.95, 0, velvet);
    for (const [dx, dz] of [[-1.7, -1.4], [1.7, -1.4], [-1.7, 1.4], [1.7, 1.4]]) { k.cyl(0.06, 2.4, BX + dx, S0 + 2.0, dz, brass, 0.08, 8); k.sphere(0.12, BX + dx, S0 + 3.28, dz, globe, 12); }
    for (let i = 0; i < 4; i++) k.box(0.3, 0.2, 1.4, BX - 1.85 - i * 0.3, S0 + 0.1 + i * 0.2 - 0.6 + 0.6, 0, walnut).scale.y = 1;
    k.keepOut.push({ x: BX, z: 0, r: 2.25 });
    k.point(BX, S0 + 3.4, 0, 0xffe0b0, 12, 9);
    /* the ark on the east wall: carved walnut, a horseshoe crown, blank tablets on top, the curtain */
    const AX = EI + 0.9;
    k.box(2.4, 0.5, 8, EI + 1.2, S0 + 0.25, 0, walnut);
    for (let i = 0; i < 3; i++) k.box(0.35, 0.5 - i * 0.16, 6, EI + 2.55 + i * 0.35, S0 + (0.5 - i * 0.16) / 2, 0, walnut);
    k.block(EI - 0.2, EI + 3.4, -4.2, 4.2);
    k.box(1.4, 6.4, 4.4, AX, S0 + 0.5 + 3.2, 0, walnut);
    for (const s of [-1, 1]) { k.column(AX + 0.75, S0 + 0.5, s * 1.85, 5.4, 0.2, walnut, true, gilt); k.box(0.3, 0.9, 0.9, AX + 0.8, S0 + 6.4, s * 1.85, walnut); k.sphere(0.25, AX + 0.8, S0 + 7.2, s * 1.85, gilt, 10); }
    k.box(0.1, 3.6, 2.4, AX + 0.72, S0 + 3.0, 0, velvet);
    k.box(0.12, 0.2, 2.6, AX + 0.74, S0 + 4.85, 0, gilt);
    horseshoe(k, AX + 0.76, S0 + 5.4, 0, 1.4, 0.12, gilt);
    { const tab = new T.Shape(); tab.moveTo(-0.45, 0); tab.lineTo(0.45, 0); tab.lineTo(0.45, 0.8); tab.absarc(0, 0.8, 0.45, 0, PI, false); tab.lineTo(-0.45, 0); const tg = new T.ExtrudeGeometry(tab, { depth: 0.12, bevelEnabled: false }); for (const s of [-1, 1]) k.mesh(tg, stone, AX + 0.2, S0 + 7.1, s * 0.5).rotation.y = PI / 2; }
    k.box(0.9, 0.3, 2.4, AX + 0.2, S0 + 7.0, 0, gilt);
    /* the ner tamid, the eternal light, hanging in front of the ark */
    const NT = v(EI + 3.2, S0 + 5.2, 0);
    k.cyl(0.015, SY + 4 - NT.y, NT.x, (SY + 4 + NT.y) / 2, 0, brass, 0.015, 4);
    k.lathe([[0, -0.3], [0.2, -0.15], [0.26, 0.05], [0.2, 0.2], [0.08, 0.28]], NT.x, NT.y, 0, brass, 14);
    const flameM = new T.MeshBasicMaterial({ color: 0xff5a2a });
    const flame = k.mesh(new T.SphereGeometry(0.13, 10, 8), flameM, NT.x, NT.y + 0.1, 0, true);
    const ntLight = k.point(NT.x, NT.y, 0, 0xff7a3a, 14, 8);
    /* the east window of 2010: a yellow centre, blue glass round it, six and five pointed stars */
    const EW = v(EI + 0.1, 14.3, 0), ER = 2.9;
    k.mesh(new T.CircleGeometry(ER + 0.35, 56), gilt, EW.x, EW.y, 0).rotation.y = PI / 2;
    k.mesh(new T.CircleGeometry(ER, 56), k.glow(0x1e4ad8), EW.x + 0.02, EW.y, 0).rotation.y = PI / 2;
    k.mesh(new T.RingGeometry(ER * 0.55, ER * 0.95, 48), k.glow(0x2f66f0), EW.x + 0.03, EW.y, 0).rotation.y = PI / 2;
    k.mesh(new T.CircleGeometry(ER * 0.32, 32), k.glow(0xffd24a), EW.x + 0.04, EW.y, 0).rotation.y = PI / 2;
    k.mesh(hexGeo(ER * 0.3, 0.02), k.glow(0xfff2b0), EW.x + 0.05, EW.y, 0).rotation.y = PI / 2;
    {
      const rs = X.mulberry(2010), five = starGeo(0.13), six = hexGeo(0.14, 0.01), m5: T.Matrix4[] = [], m6: T.Matrix4[] = [], q = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), PI / 2);
      for (let i = 0; i < 90; i++) { const a = rs() * PI * 2, r = ER * (0.36 + 0.58 * Math.sqrt(rs())), p = v(EW.x + 0.06, EW.y + Math.sin(a) * r, Math.cos(a) * r), s = 0.7 + rs() * 0.8; (i % 2 ? m5 : m6).push(new T.Matrix4().compose(p, q, new T.Vector3(s, s, s))); }
      k.instances(five, k.glow(0xfff4c8), m5); k.instances(six, k.glow(0xe8f0ff), m6);
      for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; k.beam(v(EW.x + 0.07, EW.y + Math.sin(a) * ER * 0.32, Math.cos(a) * ER * 0.32), v(EW.x + 0.07, EW.y + Math.sin(a) * ER, Math.cos(a) * ER), 0.025, leaded, 4); }
    }
    k.point(EW.x + 3.5, EW.y, 0, 0x5a7aff, 70, 24);
    k.spot(EI + 12, SY + 2, 0, EW.x, EW.y, 0, 0xcfd8ff, 60, 0.3, 0.6, 20);
    /* the brass chandeliers: a great one under the crossing, smaller ones down the nave */
    const flameGlobes = new T.MeshBasicMaterial({ color: 0xffe2a8 });
    const chand = (x: number, z: number, top: number, drop: number, r: number, arms: number) => {
      const g = new T.Group(); g.position.set(x, top, z);
      const chain = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, drop, 5).translate(0, -drop / 2, 0), iron); g.add(chain);
      const metal: T.BufferGeometry[] = [[r, 0], [r * 0.62, 0.55], [r * 0.3, 1.0]].map(([rr, dy]) => new T.TorusGeometry(rr, 0.045, 6, 36).rotateX(PI / 2).translate(0, -drop + dy, 0));
      metal.push(new T.CylinderGeometry(0.06, 0.12, 1.6, 8).translate(0, -drop + 0.5, 0));
      for (let i = 0; i < arms; i++) { const a = (i / arms) * PI * 2; metal.push(new T.CylinderGeometry(0.02, 0.02, r, 4).rotateZ(PI / 2).translate(r / 2, -drop + 0.02, 0).rotateY(a)); }
      g.add(new T.Mesh(mergeGeometries(metal.map((m) => m.index ? m.toNonIndexed() : m))!, brass));
      const gl = mergeGeometries([[r, 0], [r * 0.62, 0.55]].flatMap(([rr, dy], lvl) => { const n = lvl ? Math.round(arms * 0.6) : arms; return Array.from({ length: n }, (_, i) => { const a = (i / n) * PI * 2 + lvl * 0.2; return new T.SphereGeometry(0.075, 8, 6).translate(Math.cos(a) * rr, -drop + dy + 0.14, Math.sin(a) * rr); }); }))!;
      g.add(new T.Mesh(gl, flameGlobes));
      const l = new T.PointLight(0xffd8a0, 26 * r, 14, 2); l.position.y = -drop + 0.3; g.add(l);
      k.add(g);
      /* 2026-11-24 wave 7a: a real model takes over from the code rings once it loads (the gilt one under the
         crossing, brass in the nave); the chain and the light stay */
      const big = r > 1.5, code = g.children.slice(1, 3);
      void hero(k, big ? 'eldridge/chandelier_gilt' : 'eldridge/chandelier_brass', { width: big ? 3.4 : 2.4 }).then((h) => {
        if (!h || !k.live) return;
        h.traverse((c) => { if (c instanceof T.Mesh) c.castShadow = false; });
        const hh = (h.userData.size as T.Vector3).y; h.position.y = -drop + 1.3 - hh; g.add(h); code.forEach((c) => (c.visible = false));
      });
      return g;
    };
    const chands = [chand(XC, 0, SY + XR, 7.0, 1.9, 18)];
    for (const x of [-20.8, -29.4]) chands.push(chand(x, 0, SY + NR, 9.6, 1.1, 10));
    for (const s of [-1, 1]) for (const x of [-21, -25.35, -29.5]) { const b = k.lathe([[0, 0], [0.14, 0.08], [0.18, 0.3]], x, BY - 0.6, s * 6.0, brass, 10); void b; k.sphere(0.16, x, BY - 0.62, s * 6.0, globe, 10); k.point(x, BY - 0.9, s * 6.0, 0xffe0b0, 5, 6); }
    k.point(-20, S0 + 4, 0, 0xffe2b8, 12, 12);
    k.point(-29, S0 + 4, 0, 0xffe2b8, 10, 12);
    /* one patch of wall left as it was found, dark with a century of soot */
    k.box(1.6, 1.3, 0.05, -20.3, S0 + 2.0, -7.33, k.flat(0x5a4636, 0, 0.95));
    /* motion: a door leaf that swings, the flame, visitors below the stars, people and cars in the street */
    if (!ctx.reduced) {
      k.ticks.push((t) => {
        doorLeaf.rotation.y = -0.9 * (0.5 - 0.5 * Math.cos(Math.min(1, Math.max(0, Math.sin(t * 0.18) * 1.6)) * PI));
        const f = 0.85 + 0.15 * Math.sin(t * 7.3) * Math.sin(t * 3.1 + 1);
        ntLight.intensity = 14 * f; flame.scale.set(1, 0.9 + 0.25 * f, 1);
        chands.forEach((g, i) => { g.rotation.z = Math.sin(t * 0.35 + i * 1.9) * 0.006; });
      });
      k.crowd([v(-18.6, S0, 0), v(-24.6 + 3.2, S0, 2.9 + 0.1), v(EI + 3.8, S0, 2.4), v(EI + 3.8, S0, -2.4), v(-24.6 + 3.2, S0, -2.9 - 0.1)], 6, { seed: 1466, speed: 0.22, spread: 0.3, closed: true, colors: [0x24262c, 0x3a3a4a, 0x6a4a3a, 0x8a3a3a, 0xd8d0c0] });
      k.crowd([v(-11, F0, 4.6), v(-15.2, F0, 5.0), v(-15.2, F0, -5.0), v(-11, F0, -4.6), v(-9.3, F0, 0)], 5, { seed: 1467, speed: 0.25, spread: 0.4, closed: true });
      k.crowd([v(6.2, 0, -50), v(6.2, 0, 44), v(-6.0, 0, 44), v(-6.0, 0, -50)], 22, { seed: 1468, speed: 0.9, spread: 1.4, closed: true });
    }
    cars(k, ctx.reduced, [{ x: 1.6, dir: -1, n: 4 }], 130, 1469);
    for (const z of [-30, -18, 20, 32]) { const g = new T.Group(); void g; k.box(1.8, 0.7, 4.3, 3.6, 0.55, z, k.flat([0x2a3a5a, 0xd8dadc, 0x1c1e24, 0x8a1e22][Math.abs(z) % 4], 0.3, 0.4)); k.box(1.6, 0.55, 2.2, 3.6, 1.15, z - 0.2, k.flat(0x1c2430, 0.5, 0.2)); k.block(2.6, 4.6, z - 2.2, z + 2.2); }
    pigeons(k, ctx.reduced, [v(-6.2, 0.14, 14), v(6.3, 0.14, -12), v(-6.0, 0.14, -24), v(6.3, 0.14, 20)], 14, 1464);
    /* 2026-11-24 wave 7a, the one trick: at the top of the stair a gold star of David stands up in the aisle, painted flat
       on the pine boards in the perspective of that one spot */
    if (W7E_DOM) {
      const t = paintTex(512, 512, (g, w, h) => {
        const r = w * 0.46, cx = w / 2, cy = h / 2, tri = (rot: number) => { g.beginPath(); for (let i = 0; i < 3; i++) { const a = rot + (i / 3) * PI * 2 - PI / 2; i ? g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r) : g.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); };
        g.lineJoin = 'miter'; g.lineWidth = w * 0.055;
        for (const rot of [0, PI]) { tri(rot); g.strokeStyle = '#7a5418'; g.lineWidth = w * 0.075; g.stroke(); }
        for (const rot of [0, PI]) { tri(rot); g.strokeStyle = '#e8c45a'; g.lineWidth = w * 0.05; g.stroke(); }
        g.fillStyle = '#2f4f9a'; g.beginPath(); g.arc(cx, cy, w * 0.07, 0, PI * 2); g.fill();
      });
      anamorphTex(k, t, SW - 0.5, 0, S0 + 3, S0, PI / 2, 2.6, 1.7, 1.7, 0.88);
    }
    k.egg(v(SW - 0.5, S0 + 1.2, 0), { id: 'star-in-the-aisle', title: 'The star in the aisle', year: 'an illusion', text: 'Stand at the top of the stair and a gold star of David stands up in the aisle in front of you. It is painted flat on the floorboards and stretched in the perspective of that one spot, the trick called anamorphosis. Walk towards it and it lies down.', clue: 'Climb the stair from the museum and stop at the top.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 0.8 });
    /* Firefly: the stencilled east wall round the ark (FIREFLY_QUEUE.md), invisible until the file lands */
    { const o = fireflyPlate(k, 'assets/museum/tex/eldridge/ff_east_wall_stencil.webp', 14.6, 7.4, EI + 0.09, S0 + 3.75, 0, PI / 2, W7E_HIDDEN); void o; }
    /* what the building knows */
    const src = { name: 'Eldridge Street Synagogue, Wikipedia', url: 'https://en.wikipedia.org/wiki/Eldridge_Street_Synagogue' };
    k.egg(v(faceX + 0.3, doorsY + 1.8, 0), { id: 'dedicated-1887', title: 'The crowd on the steps', year: '1887', text: 'Kahal Adath Jeshurun dedicated the synagogue on September 4, 1887. The congregation sent out thousands of invitations and the crowds reportedly overflowed onto the street. The brothers Peter and Francis William Herter designed it, and it cost $91,907.61.', clue: 'Stand at the foot of the stoop, where the crowd spilled out on the first day.', source: src }, { r: 1.8 });
    k.egg(v(faceX + 0.4, RY, 0), { id: 'rose-window', title: 'Twelve roundels', text: 'The rose window on the front contains a dozen roundels, which depict the Twelve Tribes of Israel.', clue: 'Count the circles in the wheel of glass over the street.', source: src }, { r: 3 });
    k.egg(v(-14.45, F0 + 1.3, -5.9), { id: 'closed-1954', title: 'Downstairs for half a century', year: '1954', text: 'As the congregation shrank, the main sanctuary closed completely in 1954, and the congregation held its services downstairs, on this lower level, for decades while the great room upstairs sat shut.', clue: 'The lower level kept the congregation going when the sanctuary could not.', source: src }, { r: 1.3 });
    k.egg(v(-20.3, S0 + 2.0, -7.2), { id: 'restoration-2007', title: 'Twenty years, twenty million', year: '2007', text: 'The Eldridge Street Project was founded in 1986 and the building was restored from 1989 to 2007, at a cost of about $20 million, with new plaster, stencilling and decorative painting. It was rededicated on December 2, 2007. Two pieces of wall were purposely never restored.', clue: 'Find the patch of wall that nobody cleaned.', source: src }, { r: 1.2 });
    k.egg(v(-21.6, S0 + 0.1, 2.95), { id: 'floorboards', title: 'Grooves in the floor', text: 'The wooden floor carries grooves worn by the congregants\' footsteps and by their swaying back and forth in prayer, and the restoration left them in place.', clue: 'Look down in front of the pews, where the wood has gone pale.', source: src }, { r: 1.1 });
    k.egg(v(EW.x + 0.4, EW.y, 0), { id: 'east-window', title: 'The window of stars', year: '2010', text: 'The round east window was designed by the artist Kiki Smith and the architect Deborah Gans and installed in October 2010. Its centre is yellow glass, surrounded by panes of blue, with six pointed stars of David and five pointed stars like those on the American flag, for the two cultures of the people who prayed here. It weighs about two tons.', clue: 'Face the ark and raise your eyes to the blue.', source: src }, { r: 3 });
    const floorY = (x: number, z: number) => {
      if (x >= FX) return 0;
      if (x > FX - 1.8) return (-1.2 * (FX - x)) / 1.8;
      if (x > SW) { if (Math.abs(z) < 1.4 && x < -10) return F0 + ((S0 - F0) * (-10 - x)) / 6.5; return F0; }
      return S0;
    };
    return { mounts, spawn: v(6.4, 3, 13), look: v(FX, 10.5, 1), eye: 3, floorY, bounds: [EI + 0.2, 7.6, -44, 44], style: 'gilt' };
  },
};

/* ---------- THE BIG UPGRADE, wave 9a (2026-11-24): helpers for Gramercy Park only ----------
   Poly Haven scans from assets/museum/tex/gramercy/ in a set colour until the maps land, models fitted once and
   placed (more than six as instanced parts). A no-op on canvas in node. */
const G9_DOM = typeof window !== 'undefined' && typeof document !== 'undefined' && typeof HTMLImageElement !== 'undefined';
const g9L = G9_DOM ? new T.TextureLoader() : null;
const g9S = new Map<string, { s: X.Surface; ready: Promise<unknown> }>();
function g9Scan(k: K, id: string, metres: number, paint: () => X.Surface, p: Partial<T.MeshStandardMaterialParameters> & { normal?: number } = {}, wait = 0x777777, tag = '') {
  if (!g9L) return k.pbr(`g9-${id}${tag}`, paint(), 1 / metres, p);
  let e = g9S.get(id);
  if (!e) {
    const low = k.o.quality !== 'high', waits: Promise<unknown>[] = [];
    const one = (suf: string, srgb: boolean) => {
      let done: () => void = () => {};
      waits.push(new Promise<void>((r) => (done = r)));
      const t = g9L.load(`assets/museum/tex/gramercy/${id}_${suf}.webp`, () => done(), undefined, () => done());
      t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8;
      if (srgb) t.colorSpace = T.SRGBColorSpace;
      return t as unknown as T.CanvasTexture;
    };
    e = { s: { map: one('c', true), normalMap: one('n', false), roughnessMap: low ? undefined : one('r', false) }, ready: Promise.all(waits) };
    g9S.set(id, e);
  }
  k.pending.push(e.ready);
  const m = k.pbr(`g9-${id}${tag}`, e.s, 1 / metres, p);
  if (!m.userData.g9) {
    m.userData.g9 = true;
    const maps = { map: m.map, normalMap: m.normalMap, roughnessMap: m.roughnessMap }, tint = m.color.clone();
    m.map = m.normalMap = m.roughnessMap = null; m.color.set(wait);
    void e.ready.then(() => { Object.assign(m, maps); m.color.copy(tint); m.needsUpdate = true; });
  }
  return m;
}
function g9Place(k: K, name: string, fit: Parameters<typeof hero>[2], at: number[][], tweak?: (o: T.Object3D) => void, then?: (os: T.Object3D[]) => void) {
  if (!at.length) return;
  void hero(k, name, fit).then((h) => {
    if (!h || !k.live) return;
    h.traverse((c) => { if (!(c instanceof T.Mesh)) return; c.castShadow = false; for (const m of (Array.isArray(c.material) ? c.material : [c.material]) as T.MeshPhysicalMaterial[]) if (m.transmission > 0) { m.transmission = 0; m.transparent = true; m.opacity = 0.35; m.depthWrite = false; } });
    if (tweak) tweak(h);
    if (at.length > 6) {
      const ins = heroInstances(k, h, at.length), m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(0, 0, 0, 'YXZ');
      at.forEach(([x, y, z, r, s = 1], i) => ins.setAt(i, m.compose(new T.Vector3(x, y, z), q.setFromEuler(e.set(0, r, 0, 'YXZ')), new T.Vector3(s, s, s))));
      ins.commit(); then?.([]); return;
    }
    const os = at.map(([x, y, z, r, s = 1], i) => { const c = i ? h.clone() : h; c.position.set(x, y, z); c.rotation.set(0, r, 0); c.scale.setScalar(s); k.add(c); return c; });
    then?.(os);
  });
}
/* wave 9a triangle pass (lead note): the debug counter runs 2.5 to 3x the scene because of the sun's shadow pass. Once the
   kit has swapped in its cars and figures, stop shadows from instanced crowds of small things (fence bars, bars of gold,
   planting, pigeons, the cab models the kit lays on traffic, the crowd figures) and from trees further than `near`
   metres from the point given. The built architecture keeps its shadows. */
function g9ShadowTrim(k: K, cx: number, cz: number, near = 24) {
  if (!G9_DOM) return;
  const run = () => {
    if (!k.live) return;
    k.scene.traverse((o) => {
      const m = o as T.Mesh; if (!m.isMesh || !m.castShadow) return;
      const mat = (Array.isArray(m.material) ? m.material[0] : m.material) as T.Material | undefined, nm = (mat && mat.name) || '';
      if ((m as T.InstancedMesh).isInstancedMesh || nm.startsWith('tripo_') || nm.startsWith('MLOW_')) { m.castShadow = false; return; }
      if (/leaf|bark|twig/.test(nm)) { const p = new T.Vector3(); m.getWorldPosition(p); if (Math.hypot(p.x - cx, p.z - cz) > near) m.castShadow = false; }
    });
  };
  for (const ms of [1500, 5000, 12000]) setTimeout(run, ms);
}
function g9Sign(k: K, text: string, w: number, h: number, x: number, y: number, z: number, rotY: number, fg: string, bg: string, font = 'W2 Archivo Expanded', size = 0.6, border?: string) {
  if (!G9_DOM) return k.box(w, h, 0.02, x, y, z, k.flat(0x333333));
  return hsign(k, text, w, h, x, y, z, rotY, { fg, bg: bg || undefined, font, size, border });
}

/* ---------------- 164 GRAMERCY PARK ---------------- */
export const gramercy: RoomDef = {
  id: 'gramercy',
  name: 'The locked park',
  area: 'GRAMERCY PARK',
  mood: 'Behind the railings, a key away',
  color: '#3f5a3a',
  daylit: true,
  description: 'The last private park in Manhattan, two acres of gravel paths, planting and old trees behind a locked iron fence, with Edwin Booth on his pedestal in the middle. The New Yorkers hang on the railings facing the street, under the hotel awning and on the fronts of the clubs on Gramercy Park South. Only the houses round the square hold keys, and somewhere on this block one is waiting to be found: find it and the gate opens.',
  signatures: 'The locked iron fence with its spear points and gates, the gravel paths and planting, Edmond T. Quinn\'s statue of Edwin Booth, the National Arts Club in the Tilden mansion and The Players on Gramercy Park South, the Gramercy Park Hotel and its awning, 34 and 36 Gramercy Park East, the brownstones with iron porches on the west side, and the key.',
  build(k, ctx) {
    k.sky({ top: 0x6a9ad6, horizon: 0xdfe6ee, ground: 0x4a4a48, fog: 0.0028, sun: { az: 2.3, el: 0.62, color: 0xfff2dc, size: 12 }, env: 0.8 });
    k.hemi(0xeef2ff, 0x8a8478, 0.9);
    k.sun(0xfff0d8, 2.2, 40, 70, -30, true, 110);
    const PXf = 68, PZf = 25, SWk = 3.5, RD = 10, SW2 = 4;
    const NZ = PZf + SWk + RD + SW2, EXb = PXf + SWk + RD + SW2;         // building lines: 42.5 and 85.5
    /* wave 9a: Poly Haven scans for the street, the pavements, kerbs, gravel paths, lawns, granite and brownstone */
    const asphalt = g9Scan(k, 'asph', 3.2, () => X.asphalt(0x2a2d31), { color: 0x9a9a9a, roughness: 0.85 }, 0x2a2d31),
      pave = g9Scan(k, 'walk', 2.4, () => X.pavers(0x9a968c, 1641), { color: 0xd8d2c6 }, 0x9a968c),
      curb = g9Scan(k, 'granite', 1.2, () => X.ashlar(0x8a8a86, 1642, 2), { color: 0xc8c4bc }, 0x8a8a86, '-k'),
      gravel = g9Scan(k, 'gravel', 2.0, () => X.concrete(0xb8ab92, 1643), { color: 0xe6dcc6, roughness: 0.95 }, 0xb8ab92),
      lawn = g9Scan(k, 'grass', 2.4, () => X.grass(0x3f5f32, 1644), { color: 0xa8b890 }, 0x3f5f32),
      bed = k.flat(0x2e4424, 0, 0.95),
      iron = k.flat(0x16201c, 0.6, 0.45),
      brass = k.flat(0xd0a850, 0.9, 0.28, { emissive: 0x3a2a08, emissiveIntensity: 0.4 }),
      bronze = k.flat(0x3e5a4c, 0.7, 0.5),
      granite = g9Scan(k, 'granite', 1.8, () => X.ashlar(0x9a968e, 1645, 3), { color: 0xc8c2b8 }, 0x9a968e),
      brown = g9Scan(k, 'brown', 2.4, () => X.ashlar(0x6a4a3a, 1646, 7), { color: 0xa88070 }, 0x6a4a3a),
      brownDk = g9Scan(k, 'brown', 2.4, () => X.ashlar(0x57392c, 1647, 7), { color: 0x8a6658 }, 0x57392c, '-d'),
      redBrick = g9Scan(k, 'brick', 1.6, () => X.brick(0x8a3e2c, 1648), { color: 0xd89a88 }, 0x8a3e2c),
      tanBrick = k.pbr('grTan', X.brick(0xa88a6a, 1649), 0.3),
      hotelBrick = k.pbr('grHotel', X.brick(0x7a4636, 1650), 0.3),
      lime = k.pbr('grLime', X.ashlar(0xd8d0bc, 1651, 4), 0.3),
      terra = k.pbr('grTerra', X.ashlar(0xe8e2d4, 1652, 6), 0.35),
      cornice = k.flat(0xcfc6b2, 0, 0.7),
      glassM = k.flat(0x1e2a36, 0.6, 0.18),
      warm = k.glow(0xffd28a),
      awningM = k.flat(0x1d3a2a, 0, 0.9),
      boardM = k.flat(0x1c2a22, 0.3, 0.6),
      white = k.flat(0xe8e4dc, 0, 0.7);
    /* ---- streets and sidewalks all round the square ---- */
    k.box(260, 0.1, 200, 0, -0.05, 0, asphalt);
    const side = (x0: number, x1: number, z0: number, z1: number) => k.box(x1 - x0, 0.3, z1 - z0, (x0 + x1) / 2, 0, (z0 + z1) / 2, pave);
    for (const s of [-1, 1]) {
      side(-PXf - SWk, PXf + SWk, s > 0 ? PZf : -PZf - SWk, s > 0 ? PZf + SWk : -PZf);                  // along the fence, north and south
      side(s > 0 ? PXf : -PXf - SWk, s > 0 ? PXf + SWk : -PXf, -PZf, PZf);                              // along the fence, east and west
      side(-EXb - 20, -8, s > 0 ? NZ - SW2 : -NZ, s > 0 ? NZ : -NZ + SW2); side(8, EXb + 20, s > 0 ? NZ - SW2 : -NZ, s > 0 ? NZ : -NZ + SW2);   // building side
      side(s > 0 ? EXb - SW2 : -EXb, s > 0 ? EXb : -EXb + SW2, -NZ, NZ);
      k.box(0.3, 0.32, (PZf + SWk) * 2, s * (PXf + SWk), 0.02, 0, curb); k.box((PXf + SWk) * 2, 0.32, 0.3, 0, 0.02, s * (PZf + SWk), curb);
      for (const sx of [-1, 1]) { side(sx > 0 ? 8 - 0.01 : -8 - 4, sx > 0 ? 12 : -8 + 0.01, s > 0 ? NZ : -NZ - 90, s > 0 ? NZ + 90 : -NZ); }
    }
    /* crosswalk stripes at the four corners */
    for (const [cx, cz, along] of [[-PXf - 5, 33.5, 'z'], [PXf + 5, 33.5, 'z'], [-PXf - 5, -33.5, 'z'], [PXf + 5, -33.5, 'z']] as [number, number, string][]) for (let i = -4; i <= 4; i++) k.box(along === 'z' ? 3 : 0.6, 0.02, along === 'z' ? 0.6 : 3, cx, 0.01, cz + i * 1.1, white);
    /* ---- the park: lawns and beds, gravel paths, a plinth and the statue ---- */
    k.box(PXf * 2, 0.3, PZf * 2, 0, 0.0, 0, lawn);
    const path = (w: number, d: number, x: number, z: number, ry = 0) => { const o = k.box(w, 0.04, d, x, 0.17, z, gravel); o.rotation.y = ry; return o; };
    path(PXf * 2 - 6, 2.6, 0, PZf - 3.2); path(PXf * 2 - 6, 2.6, 0, -PZf + 3.2); path(2.6, PZf * 2 - 6, PXf - 3.2, 0); path(2.6, PZf * 2 - 6, -PXf + 3.2, 0);
    path(2.4, PZf * 2, 0, 0); path(PXf * 2, 2.4, 0, 0);
    { const ring = new T.RingGeometry(6.2, 8.6, 48); ring.rotateX(-PI / 2); ring.scale(1.6, 1, 1); k.mesh(ring, gravel, 0, 0.2, 0); }
    for (const [x, z] of [[-34, 0], [34, 0]]) { const r = new T.CircleGeometry(4.2, 32); r.rotateX(-PI / 2); k.mesh(r, gravel, x, 0.2, z); }
    /* the planting: low beds of green along the fence and round the oval */
    { const g = new T.IcosahedronGeometry(0.9, 1); const ms: T.Matrix4[] = []; const rs = X.mulberry(1653);
      for (let x = -PXf + 1.2; x < PXf - 1; x += 1.3) for (const s of [-1, 1]) { if (Math.abs(x) < 2.6) continue; ms.push(new T.Matrix4().compose(v(x, 0.4, s * (PZf - 1.2)), new T.Quaternion(), v(0.8 + rs() * 0.5, 0.6 + rs() * 0.4, 0.9))); }
      for (let z = -PZf + 1.2; z < PZf - 1; z += 1.3) for (const s of [-1, 1]) { if (Math.abs(z) < 2.6) continue; ms.push(new T.Matrix4().compose(v(s * (PXf - 1.2), 0.4, z), new T.Quaternion(), v(0.9, 0.6 + rs() * 0.4, 0.8 + rs() * 0.5))); }
      for (let i = 0; i < 40; i++) { const a = (i / 40) * PI * 2; if (Math.abs(Math.sin(a)) < 0.15 || Math.abs(Math.cos(a)) < 0.1) continue; ms.push(new T.Matrix4().compose(v(Math.cos(a) * 9.6 * 1.6, 0.35, Math.sin(a) * 9.6), new T.Quaternion(), v(0.8, 0.5 + rs() * 0.3, 0.8))); }
      k.instances(g, bed, ms); }
    /* trees: old planes and elms over the lawns, clear of the paths */
    const trees: [number, number][] = [];
    { const rs = X.mulberry(1654); let tries = 0;
      while (trees.length < 36 && tries++ < 2000) {
        const x = (rs() - 0.5) * (PXf * 2 - 8), z = (rs() - 0.5) * (PZf * 2 - 8);
        if (Math.abs(z) < 2.6 || Math.abs(x) < 2.6 || Math.abs(Math.abs(z) - (PZf - 3.2)) < 2.4 || Math.abs(Math.abs(x) - (PXf - 3.2)) < 2.4) continue;
        if ((x / 1.6) ** 2 + z ** 2 < 11 ** 2) continue;
        if (Math.hypot(Math.abs(x) - 34, z) < 5.5) continue;
        if (trees.some(([a, b]) => Math.hypot(a - x, b - z) < 6.5)) continue;
        trees.push([x, z]);
      }
      trees.forEach(([x, z], i) => { k.tree(x, 0.15, z, { h: 6 + rs() * 4, r: 3 + rs() * 1.8, seed: 1660 + i, leaf: [0x3f6a34, 0x4a7438, 0x5a7a30, 0x6a7c34][i % 4] }); k.keepOut.push({ x, z, r: 0.6 }); });
      for (const x of [-PXf - 1.6, PXf + 1.6]) for (let z = -18; z <= 18; z += 12) { k.tree(x, 0.15, z, { h: 7, r: 2.6, seed: 1720 + z, leaf: 0x4f7438 }); k.keepOut.push({ x, z, r: 0.5 }); }
      for (const z of [-PZf - 1.6, PZf + 1.6]) for (let x = -52.5; x <= 53; x += 15) { k.tree(x, 0.15, z, { h: 7, r: 2.6, seed: 1740 + x, leaf: 0x4f7438 }); k.keepOut.push({ x, z, r: 0.5 }); }
    }
    /* Edwin Booth on his pedestal, in bronze, as Hamlet */
    k.box(3.2, 0.5, 3.2, 0, 0.4, 0, granite); k.box(2.2, 2.2, 2.2, 0, 1.75, 0, granite); k.box(2.6, 0.35, 2.6, 0, 3.0, 0, granite);
    const booth = new T.Group(); booth.position.set(0, 3.18, 0); booth.rotation.y = 0.25; k.add(booth);
    { const bz = k.flat(0x3e5a4c, 0.7, 0.5), add = (g: T.BufferGeometry, x: number, y: number, z: number, rx = 0, rz = 0) => { const o = new T.Mesh(g, bz); o.position.set(x, y, z); o.rotation.set(rx, 0, rz); booth.add(o); return o; };
      add(new T.BoxGeometry(0.9, 0.12, 0.7), 0, 0.06, 0);
      add(new T.CylinderGeometry(0.1, 0.08, 0.95, 8), -0.12, 0.6, 0.02, 0, 0.04); add(new T.CylinderGeometry(0.1, 0.08, 0.95, 8), 0.13, 0.6, -0.05, -0.12, -0.03);
      add(new T.CylinderGeometry(0.2, 0.17, 0.75, 10), 0, 1.45, 0);
      add(new T.SphereGeometry(0.2, 10, 8), 0, 1.78, 0).scale.set(1.25, 0.6, 0.9);
      add(new T.CylinderGeometry(0.055, 0.06, 0.12, 8), 0, 1.93, 0);
      add(new T.SphereGeometry(0.12, 12, 10), 0, 2.06, 0.02).scale.set(0.9, 1.1, 1);
      add(new T.CylinderGeometry(0.05, 0.045, 0.62, 6), 0.2, 1.6, 0.14, -1.1, 0.5);
      add(new T.CylinderGeometry(0.05, 0.045, 0.7, 6), -0.26, 1.42, 0.02, 0, -0.18);
      add(new T.CylinderGeometry(0.24, 0.5, 1.75, 14, 1, true, PI * 0.55, PI * 0.9), 0, 1.0, -0.02);
      booth.updateMatrixWorld(true);
      const parts = booth.children.map((c) => { const g = ((c as T.Mesh).geometry.index ? (c as T.Mesh).geometry.toNonIndexed() : (c as T.Mesh).geometry.clone()); g.applyMatrix4(c.matrix); return g; });
      booth.clear(); booth.add(new T.Mesh(mergeGeometries(parts)!, k.flat(0x3e5a4c, 0.7, 0.5, { side: T.DoubleSide })));
    }
    k.keepOut.push({ x: 0, z: 0, r: 2.6 });
    /* wave 9a: a cast figure on the pedestal in place of the code built one, in the same bronze (a stand in for Quinn's Booth) */
    g9Place(k, 'gramercy/cp_statue', { height: 2.3 }, [[0, 3.18, 0, 0.25]], (h) => h.traverse((c) => { if (c instanceof T.Mesh) c.material = k.flat(0x4a6656, 0.75, 0.42); }), () => { for (const c of booth.children) c.visible = false; });
    /* benches along the oval and the paths, the Fantasy Fountain's basin at the east end */
    const slat = k.pbr('grSlat', X.planks(0x6a4a2c, 5, 1655, 0.2), 1.4), benchIron = k.flat(0x1c2420, 0.5, 0.5);
    /* park benches as static boxes, so twelve of them cost two draw calls, not a hundred and fifty */
    const bench = (x: number, z: number, ry: number) => {
      const c = Math.cos(ry), sn = Math.sin(ry), P = (lx: number, lz: number) => [x + lx * c + lz * sn, z - lx * sn + lz * c];
      const bx = (w: number, h: number, d: number, lx: number, y: number, lz: number, m: T.Material) => { const [px, pz] = P(lx, lz); k.box(w, h, d, px, y, pz, m).rotation.y = ry; };
      for (let j = 0; j < 4; j++) bx(0.12, 0.05, 2.2, j * 0.15 - 0.22, 0.62, 0, slat);
      for (let j = 0; j < 3; j++) bx(0.05, 0.13, 2.2, 0.42 + j * 0.02, 0.85 + j * 0.15, 0, slat);
      for (const dz of [-0.9, 0.9]) { bx(0.72, 0.06, 0.07, 0.05, 0.6, dz, benchIron); bx(0.06, 0.6, 0.07, -0.28, 0.3, dz, benchIron); bx(0.06, 0.6, 0.07, 0.38, 0.3, dz, benchIron); bx(0.06, 0.65, 0.07, 0.46, 0.95, dz, benchIron); }
      k.keepOut.push({ x, z, r: 0.9 });
    };
    /* wave 9a: the twelve benches are the museum's Central Park bench model, instanced; the box benches stand in */
    const benchAt: number[][] = [];
    for (const a of [0.5, 2.64, 3.64, 5.78]) benchAt.push([Math.cos(a) * 10.4 * 1.55, Math.sin(a) * 10.4, -a + PI]);
    for (const x of [-50, -20, 20, 50]) for (const s of [-1, 1]) benchAt.push([x, s * (PZf - 5.0), s > 0 ? PI / 2 : -PI / 2]);
    const benchMark = k.objects.length;
    for (const [x, z, ry] of benchAt) bench(x, z, ry);
    const benchOld = g9StandIn(k, benchMark);
    g9Place(k, 'gramercy/cp_bench', { width: 2.2 }, benchAt.map(([x, z, ry]) => [x, 0.15, z, ry - PI / 2]), undefined, () => g9Hide(benchOld));
    k.cyl(3.0, 0.5, 34, 0.4, 0, granite, 3.0, 28); k.cyl(2.6, 0.1, 34, 0.62, 0, k.flat(0x3a5a6a, 0.5, 0.15), 2.6, 28); k.cyl(0.25, 1.6, 34, 1.2, 0, bronze, 0.3, 10); k.keepOut.push({ x: 34, z: 0, r: 3.4 });
    for (const [x, z] of [[-34, 0]]) { k.lathe([[0, 0], [0.5, 0], [0.3, 0.3], [0.7, 0.9], [0.8, 1.2], [0.5, 1.3], [0, 1.3]], x, 0.3, z, granite, 16); k.keepOut.push({ x, z, r: 1.2 }); }
    /* ---- the fence: iron bars with spear points on a granite curb, posts with urns, four gates ---- */
    k.box(PXf * 2 + 0.6, 0.35, 0.5, 0, 0.18, PZf, granite); k.box(PXf * 2 + 0.6, 0.35, 0.5, 0, 0.18, -PZf, granite);
    k.box(0.5, 0.35, PZf * 2, PXf, 0.18, 0, granite); k.box(0.5, 0.35, PZf * 2, -PXf, 0.18, 0, granite);
    const FH = 2.4, barMs: T.Matrix4[] = [], tipMs: T.Matrix4[] = [], I4 = new T.Quaternion(), one3 = v(1, 1, 1);
    const run = (ax: 'x' | 'z', c: number, a0: number, a1: number) => { for (let a = a0 + 0.07; a < a1; a += 0.14) { const p = ax === 'x' ? v(a, 0.35 + FH / 2, c) : v(c, 0.35 + FH / 2, a); barMs.push(new T.Matrix4().compose(p, I4, one3)); tipMs.push(new T.Matrix4().compose(p.clone().setY(0.35 + FH + 0.08), I4, one3)); } };
    for (const s of [-1, 1]) { run('x', s * PZf, -PXf, -1.1); run('x', s * PZf, 1.1, PXf); run('z', s * PXf, -PZf, -1.1); run('z', s * PXf, 1.1, PZf); }
    k.instances(new T.BoxGeometry(0.035, FH, 0.035), iron, barMs);
    k.instances(new T.ConeGeometry(0.05, 0.2, 4), iron, tipMs);
    for (const s of [-1, 1]) for (const y of [0.55, FH + 0.1]) { k.box(PXf * 2, 0.06, 0.06, 0, y, s * PZf, iron); k.box(0.06, 0.06, PZf * 2, s * PXf, y, 0, iron); }
    const postAt = (x: number, z: number) => { k.box(0.28, FH + 0.3, 0.28, x, 0.35 + (FH + 0.3) / 2, z, iron); k.lathe([[0, 0], [0.16, 0], [0.12, 0.1], [0.2, 0.3], [0.1, 0.42], [0.04, 0.55], [0, 0.6]], x, 0.35 + FH + 0.3, z, iron, 10); };
    for (let x = -PXf; x <= PXf + 0.01; x += 8.5) for (const s of [-1, 1]) if (Math.abs(x) > 1.5) postAt(x, s * PZf);
    for (let z = -PZf; z <= PZf + 0.01; z += 8.33) for (const s of [-1, 1]) if (Math.abs(z) > 1.5) postAt(s * PXf, z);
    for (const s of [-1, 1]) for (const g of [-1.1, 1.1]) { postAt(g, s * PZf); postAt(s * PXf, g); }
    /* the fence is solid everywhere except the north gate, which is held shut by keep outs the key removes */
    for (const s of [-1, 1]) {
      k.block(-PXf - 0.3, -1.1, s * PZf - 0.3, s * PZf + 0.3); k.block(1.1, PXf + 0.3, s * PZf - 0.3, s * PZf + 0.3);
      k.block(s * PXf - 0.3, s * PXf + 0.3, -PZf - 0.3, -1.1); k.block(s * PXf - 0.3, s * PXf + 0.3, 1.1, PZf + 0.3);
    }
    k.block(-1.2, 1.2, -PZf - 0.3, -PZf + 0.3); k.block(PXf - 0.3, PXf + 0.3, -1.2, 1.2); k.block(-PXf - 0.3, -PXf + 0.3, -1.2, 1.2);
    const gateKO = [-0.8, -0.27, 0.27, 0.8].map((x) => ({ x, z: PZf, r: 0.62 }));
    gateKO.forEach((o) => k.keepOut.push(o));
    const leafGeo = (() => { const gs: T.BufferGeometry[] = []; for (let a = 0.07; a < 1.05; a += 0.14) { gs.push(new T.BoxGeometry(0.035, FH, 0.035).translate(a, FH / 2, 0)); gs.push(new T.ConeGeometry(0.05, 0.2, 4).translate(a, FH + 0.08, 0)); } for (const y of [0.2, 1.2, FH - 0.1]) gs.push(new T.BoxGeometry(1.05, 0.06, 0.06).translate(0.525, y, 0)); return mergeGeometries(gs.map((g) => g.index ? g.toNonIndexed() : g))!; })();
    const gate = (x: number, z: number, ry: number) => { const g = new T.Group(); g.position.set(x, 0.35, z); g.rotation.y = ry; const leaf = new T.Mesh(leafGeo, iron); g.add(leaf); k.add(g); return g; };
    const northL = gate(-1.08, PZf, 0), northR = gate(1.08, PZf, PI);
    gate(-1.08, -PZf, 0); gate(1.08, -PZf, PI); gate(PXf, -1.08, -PI / 2); gate(PXf, 1.08, PI / 2);
    const westL = gate(-PXf, -1.08, -PI / 2), westR = gate(-PXf, 1.08, PI / 2);
    for (const [x, z, ry] of [[0, PZf + 0.1, 0], [-PXf - 0.1, 0, -PI / 2]] as [number, number, number][]) k.sign('GRAMERCY PARK  PRIVATE', 1.5, 0.22, x, 1.55, z + (ry === 0 ? 0.02 : 0), '#1c2a22', '#e8dcb8', 60, ry, { double: true });
    /* the lock on the north gate */
    k.box(0.16, 0.24, 0.12, 0, 1.35, PZf + 0.07, brass);
    /* ---- the buildings round the square ---- */
    type Side = 'n' | 's' | 'e' | 'w';
    const winMs: T.Matrix4[] = [], litMs: T.Matrix4[] = [], sillMs: T.Matrix4[] = [];
    const rsW = X.mulberry(1656);
    const place = (sd: Side, a: number, y: number, out: number) => sd === 'n' ? v(a, y, NZ - out) : sd === 's' ? v(a, y, -NZ + out) : sd === 'e' ? v(EXb - out, y, a) : v(-EXb + out, y, a);
    const rotOf = (sd: Side) => sd === 'n' ? PI : sd === 's' ? 0 : sd === 'e' ? -PI / 2 : PI / 2;
    const bldg = (sd: Side, a0: number, a1: number, h: number, m: T.Material, p: { fh?: number; pitch?: number; base?: number; cornice?: boolean; depth?: number } = {}) => {
      const { fh = 3.3, pitch = 2.6, base = 3.6, depth = 16 } = p;
      const len = a1 - a0, c = (a0 + a1) / 2;
      if (sd === 'n') k.box(len, h, depth, c, h / 2, NZ + depth / 2, m); else if (sd === 's') k.box(len, h, depth, c, h / 2, -NZ - depth / 2, m);
      else if (sd === 'e') k.box(depth, h, len, EXb + depth / 2, h / 2, c, m); else k.box(depth, h, len, -EXb - depth / 2, h / 2, c, m);
      if (p.cornice !== false) { const o = place(sd, c, h - 0.3, -0.35); const cb = k.box(sd === 'n' || sd === 's' ? len + 0.4 : 0.9, 0.6, sd === 'n' || sd === 's' ? 0.9 : len + 0.4, o.x, o.y, o.z, cornice); void cb; }
      const q = new T.Quaternion().setFromAxisAngle(v(0, 1, 0), rotOf(sd)), sc = v(1, 1, 1);
      const n = Math.max(1, Math.floor((len - 1) / pitch));
      for (let y = base; y < h - 2; y += fh) for (let i = 0; i < n; i++) {
        const a = a0 + (len - (n - 1) * pitch) / 2 + i * pitch;
        (rsW() < 0.18 ? litMs : winMs).push(new T.Matrix4().compose(place(sd, a, y + 0.9, 0.04), q, sc));
        sillMs.push(new T.Matrix4().compose(place(sd, a, y + 1.95, 0.12), q, sc));
      }
    };
    /* north: brownstones, the Gramercy Park Hotel, Lexington Avenue, apartment houses */
    for (let i = 0; i < 6; i++) bldg('n', -104 + i * 8.5, -95.5 + i * 8.5, 16 + (i % 3), i % 2 ? brown : brownDk, { fh: 3.4, pitch: 2.4, base: 2.2 });
    bldg('n', -53, -8, 56, hotelBrick, { fh: 3.2, pitch: 2.8, base: 9.5 });
    k.box(45, 9, 0.5, -30.5, 4.5, NZ + 0.2, lime);
    for (let i = 0; i < 12; i++) { const x = -51 + i * 3.8; if (Math.abs(x + 20) < 2 || Math.abs(x + 45.5) < 2.6 || Math.abs(x + 11.5) < 2.6) continue; const a = k.mesh(archPane(2.2, 5.2), glassM, x, 1.3, NZ - 0.06); a.rotation.y = PI; }
    bldg('n', 8, 34, 44, tanBrick, { fh: 3.1 }); bldg('n', 34, 60, 36, lime, { fh: 3.3 }); bldg('n', 60, 104, 24, redBrick, { fh: 3.2 });
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const h = 20 + ((i * 7) % 5) * 6; k.box(14, h, 12, s * 16, h / 2, NZ + 12 + i * 13, [tanBrick, redBrick, brown][i % 3]); k.box(14, h, 12, s * 16, h / 2, -NZ - 12 - i * 13, [redBrick, lime, brownDk][i % 3]); }
    /* south: brownstones, the National Arts Club, The Players, Irving Place, apartment houses */
    for (let i = 0; i < 6; i++) bldg('s', -104 + i * 8.5, -95.5 + i * 8.5, 16 + ((i + 1) % 3), i % 2 ? brownDk : brown, { fh: 3.4, pitch: 2.4, base: 2.2 });
    bldg('s', -53, -40, 20, brown, { fh: 3.6, pitch: 2.4, base: 2.4 });
    bldg('s', -8.5, -8, 20, brown, { cornice: false });
    bldg('s', 8, 40, 48, tanBrick, { fh: 3.1 }); bldg('s', 40, 70, 40, lime, { fh: 3.2 }); bldg('s', 70, 104, 22, redBrick, { fh: 3.3 });
    /* the National Arts Club: the Tilden mansion, Victorian Gothic in brownstone, two bays and pointed windows */
    const NAC0 = -40, NAC1 = -24, PL0 = -24, PL1 = -8.5;
    k.box(NAC1 - NAC0, 19, 18, (NAC0 + NAC1) / 2, 9.5, -NZ - 9, brownDk);
    for (const x of [-36.5, -27.5]) {
      k.box(4.2, 11, 1.4, x, 5.5 + 1.2, -NZ + 0.7, brown);
      for (const dx of [-1.2, 0, 1.2]) k.mesh(archPane(0.9, 2.6), glassM, x + dx, 7.2, -NZ + 1.42);
      k.box(4.4, 0.5, 1.6, x, 12.4, -NZ + 0.7, cornice);
    }
    for (const y of [3.2, 7.2, 11.4, 15.2]) for (const dx of [-32, -30.5]) { k.mesh(archPane(0.9, 2.6), glassM, dx, y, -NZ + 0.03); }
    for (let i = 0; i < 5; i++) k.box(2.6, 0.24, 0.5, -32, 0.12 + i * 0.24, -NZ + 3.3 - i * 0.5, lime);
    k.box(1.8, 3.0, 0.1, -32, 2.7, -NZ + 0.03, k.flat(0x3a2418, 0, 0.6));
    k.sign('THE NATIONAL ARTS CLUB', 3.0, 0.3, -32, 4.7, -NZ + 0.06, '#1c1a18', '#e8d8b0', 56, 0);
    k.block(-33.5, -30.5, -NZ, -NZ + 3.6);
    /* The Players: a brownstone with its two storey porch of columns and an iron balcony */
    k.box(PL1 - PL0, 17, 18, (PL0 + PL1) / 2, 8.5, -NZ - 9, brown);
    k.box(13, 0.4, 2.4, (PL0 + PL1) / 2, 7.2, -NZ + 1.2, lime);
    for (let i = 0; i < 6; i++) k.column(PL0 + 1.5 + i * 2.5, 0.15, -NZ + 2.2, 7.0, 0.2, lime, false, lime);
    for (let i = 0; i < 7; i++) k.box(0.05, 1.0, 0.05, PL0 + 0.9 + i * 2.2, 7.9, -NZ + 2.3, iron);
    k.box(13, 0.06, 0.06, (PL0 + PL1) / 2, 8.4, -NZ + 2.3, iron);
    for (const y of [3.0, 9.4, 12.8]) for (let i = 0; i < 4; i++) k.mesh(archPane(1.0, 2.4), glassM, PL0 + 2.4 + i * 3.4, y, -NZ + 0.03);
    k.sign('THE PLAYERS', 2.2, 0.3, (PL0 + PL1) / 2, 6.6, -NZ + 2.45, '#1c1a18', '#e8d8b0', 90, 0);
    for (let i = 0; i < 6; i++) k.keepOut.push({ x: PL0 + 1.5 + i * 2.5, z: -NZ + 2.2, r: 0.45 });
    for (const x of [PL0 + 2.4, PL1 - 2.4]) { k.cyl(0.05, 2.2, x, 1.25, -NZ + 3.4, iron, 0.05, 6); k.sphere(0.18, x, 2.5, -NZ + 3.4, warm, 10); k.keepOut.push({ x, z: -NZ + 3.4, r: 0.4 }); }
    /* east: 34 Gramercy Park East in red brick, 36 in white terra cotta, their neighbours */
    bldg('e', 30, 60, 26, brownDk, { fh: 3.3 });
    bldg('e', 10, 30, 34, redBrick, { fh: 3.2, pitch: 2.4 });
    { const tx = EXb + 1.2, tz = 28.2; k.cyl(2.4, 36, tx, 18, tz, redBrick, 2.4, 16); const cone = k.mesh(new T.ConeGeometry(2.8, 5, 16), k.flat(0x3a4a48, 0.4, 0.6), tx, 38.5, tz); void cone; }
    k.sign('34', 0.8, 0.5, EXb - 0.05, 3.4, 20, '#e8dcc0', '#3a2418', 300, -PI / 2);
    bldg('e', -12, 10, 44, terra, { fh: 3.4, pitch: 2.2 });
    for (let z = -11; z <= 9; z += 2.2) { const o = place('e', z, 22, -0.25); k.box(0.5, 43, 0.35, o.x, 21.5, o.z, terra); }
    for (let z = -10; z <= 8; z += 4.4) { const o = place('e', z, 45.4, -0.2); const sp = k.mesh(new T.ConeGeometry(0.5, 2.6, 4), terra, o.x, 45.3, o.z); void sp; }
    k.sign('36', 0.8, 0.5, EXb - 0.05, 3.4, -1, '#2a2a2a', '#f0ece0', 300, -PI / 2);
    bldg('e', -60, -12, 30, tanBrick, { fh: 3.1 });
    /* west: the Greek Revival row with its cast iron porches */
    for (let i = 0; i < 10; i++) {
      const z0 = -48 + i * 9.6, z1 = z0 + 9.6;
      bldg('w', z0, z1, 15 + (i % 3), i % 2 ? redBrick : brownDk, { fh: 3.5, pitch: 2.6, base: 2.4 });
      if (i === 5 || i === 6) {
        const zc = (z0 + z1) / 2, px = -EXb + 1.6;
        for (const y of [0.15, 3.7]) { k.box(3.2, 0.12, 8.8, -EXb + 1.6, y + 3.4, zc, iron); for (let j = 0; j < 6; j++) { k.box(0.1, 3.4, 0.1, px + 1.4, y + 1.7, zc - 4.2 + j * 1.68, iron); } }
        for (let j = 0; j < 18; j++) { const a = k.torus(0.22, 0.025, px + 1.45, 3.0, zc - 4.2 + j * 0.5, iron, 10); a.rotation.y = PI / 2; }
        for (let j = 0; j < 18; j++) { const a = k.torus(0.22, 0.025, px + 1.45, 6.5, zc - 4.2 + j * 0.5, iron, 10); a.rotation.y = PI / 2; }
        k.block(-EXb, -EXb + 3.3, z0 + 0.2, z1 - 0.2);
      }
    }
    k.sign('3', 0.5, 0.5, -EXb + 0.05, 3.2, -48 + 5 * 9.6 + 4.8, '#e8dcc0', '#3a2418', 300, PI / 2);
    k.sign('4', 0.5, 0.5, -EXb + 0.05, 3.2, -48 + 6 * 9.6 + 4.8, '#e8dcc0', '#3a2418', 300, PI / 2);
    k.instances(new T.BoxGeometry(1.1, 1.8, 0.12), glassM, winMs);
    k.instances(new T.BoxGeometry(1.1, 1.8, 0.12), warm, litMs);
    k.instances(new T.BoxGeometry(1.4, 0.2, 0.3), cornice, sillMs);
    k.skyline({ z: -170, count: 30, spacing: 9, scale: 2.2, base: -1, seed: 1657, lit: 0.2, glow: 0.3, tint: 0x6a7280, rows: 2 });
    k.skyline({ z: 170, count: 30, spacing: 9, scale: 2.4, base: -1, seed: 1658, lit: 0.2, glow: 0.3, tint: 0x6a7280, rows: 2, spires: true });
    /* ---- the hotel awning, the doorman's desk, and the key on its hook ---- */
    const AWX = -20;
    k.box(3.4, 0.08, 3.9, AWX, 3.3, NZ - 1.95, awningM);
    k.sign('GRAMERCY PARK HOTEL', 3.4, 0.36, AWX, 3.1, NZ - 3.92, '#1d3a2a', '#e8dcb8', 70, PI);
    for (const dx of [-1.6, 1.6]) { k.cyl(0.04, 3.3, AWX + dx, 1.65, NZ - 3.85, brass, 0.04, 6); k.keepOut.push({ x: AWX + dx, z: NZ - 3.85, r: 0.3 }); }
    k.box(2.4, 3.0, 0.1, AWX, 1.6, NZ - 0.02, k.flat(0x2a1a12, 0.2, 0.4));
    k.box(2.0, 2.6, 0.05, AWX, 1.45, NZ - 0.06, k.glass(0xf0d8a0, 0.35, 0.1));
    fireflyPlate(k, 'assets/museum/tex/gramercy/ff_hotel_lobby.webp', 1.9, 2.5, AWX, 1.45, NZ - 0.078, PI, k.glass(0xf0d8a0, 0.0, 0.1)); // wave 9a
    k.point(AWX, 3.0, NZ - 2, 0xffd9a0, 10, 7);
    const DX = AWX + 2.2, DZ = NZ - 2.3;
    k.box(0.7, 1.15, 0.5, DX, 0.72, DZ, k.pbr('grDesk', X.planks(0x4a2e1a, 3, 1659, 0.2), 1.6, { roughness: 0.45 }));
    k.box(0.8, 0.06, 0.6, DX, 1.32, DZ, brass);
    k.keepOut.push({ x: DX, z: DZ, r: 0.6 });
    k.box(0.05, 0.05, 0.08, DX, 1.12, DZ - 0.28, brass);
    const key = new T.Group(); key.position.set(DX, 1.02, DZ - 0.31);
    { const bow = new T.Mesh(new T.TorusGeometry(0.075, 0.02, 8, 20), brass); bow.position.y = 0.06; key.add(bow);
      const shaft = new T.Mesh(new T.CylinderGeometry(0.014, 0.014, 0.22, 8), brass); shaft.position.y = -0.12; key.add(shaft);
      for (const [y, w] of [[-0.2, 0.06], [-0.16, 0.045]]) { const bit = new T.Mesh(new T.BoxGeometry(w, 0.025, 0.012), brass); bit.position.set(w / 2, y, 0); key.add(bit); }
      const tag = new T.Mesh(new T.BoxGeometry(0.1, 0.06, 0.005), k.flat(0x9a1e22, 0, 0.6)); tag.position.set(0, 0.17, 0); key.add(tag);
      key.scale.setScalar(1.6); }
    k.add(key);
    /* the doorman, in a long coat and cap, standing by the door */
    { const g = new T.Group(); g.position.set(AWX - 1.4, 0.15, NZ - 1.4);
      const body = new T.Mesh(new T.CapsuleGeometry(0.22, 0.95, 3, 8), k.flat(0x1a2a24, 0, 0.8)); body.position.y = 0.72; g.add(personTag(body, 'auto', 1.25));
      const head = new T.Mesh(new T.SphereGeometry(0.13, 10, 8), k.flat(0xc8a284, 0, 0.7)); head.position.y = 1.46; g.add(personTag(head, 'part'));
      const cap = new T.Mesh(new T.CylinderGeometry(0.15, 0.14, 0.08, 12), k.flat(0x1a2a24, 0, 0.8)); cap.position.y = 1.58; g.add(personTag(cap, 'part'));
      k.add(g); k.keepOut.push({ x: AWX - 1.4, z: NZ - 1.4, r: 0.45 }); }
    /* ---- the works: on the railings facing the street, under the awnings, on the club fronts ---- */
    const mounts: Mount[] = [];
    const board = (x: number, z: number, ry: number) => { const b = k.box(2.5, 1.95, 0.06, x, 1.45, z, boardM); b.rotation.y = ry; };
    for (const x of [-42, -30, -9, 9, 30, 42]) { board(x, PZf + 0.1, 0); mounts.push({ position: v(x, 1.45, PZf + 0.16), rotation: 0, target: v(x, 1.6, PZf + 3.0), width: 2.3, height: 1.8, style: 'black', wash: true }); }
    for (const z of [-12, 12]) { board(-PXf - 0.1, z, PI / 2); mounts.push({ position: v(-PXf - 0.16, 1.45, z), rotation: -PI / 2, target: v(-PXf - 3.0, 1.6, z), width: 2.3, height: 1.8, style: 'black', wash: true }); }
    for (const z of [-12, 12]) { board(PXf + 0.1, z, PI / 2); mounts.push({ position: v(PXf + 0.16, 1.45, z), rotation: PI / 2, target: v(PXf + 3.0, 1.6, z), width: 2.3, height: 1.8, style: 'black', wash: true }); }
    for (const x of [-45.5, -11.5]) mounts.push({ position: v(x, 4.0, NZ - 0.28), rotation: PI, target: v(x, 1.8, NZ - 3.4), width: 2.6, height: 2.0, style: 'gilt', wash: true });
    for (const x of [-36.5, -27.5]) mounts.push({ position: v(x, 3.3, -NZ + 1.44), rotation: 0, target: v(x, 1.8, -NZ + 4.4), width: 2.4, height: 1.9, style: 'gilt', wash: true });
    for (const x of [PL0 + 2.75, PL1 - 2.75]) mounts.push({ position: v(x, 4.4, -NZ + 0.06), rotation: 0, target: v(x, 1.8, -NZ + 3.6), width: 2.2, height: 1.8, style: 'gilt', wash: true });
    k.censusWall({ x: 30, y: 1.35, z: -PZf - 0.16, rotY: PI, cols: 20, rows: 3, tile: 0.5, gap: 0.05, start: ctx.wallStart(6800, 60), pieces: ctx.all, backing: boardM });
    k.box(11.2, 1.9, 0.06, 30, 1.35, -PZf - 0.1, boardM);
    /* ---- motion: cars round the square, walkers, a dog, leaves, pigeons, a resident at the west gate ---- */
    {
      const L = { x: PXf + SWk + RD / 2, z: PZf + SWk + RD / 2 - 1.5 };
      const per = 4 * (L.x + L.z);
      const at = (s: number, p: T.Vector3) => { s = ((s % per) + per) % per; const W = 2 * L.x, H = 2 * L.z; if (s < W) { p.set(-L.x + s, 0, L.z); return 0; } s -= W; if (s < H) { p.set(L.x, 0, L.z - s); return 1; } s -= H; if (s < W) { p.set(L.x - s, 0, -L.z); return 2; } s -= W; p.set(-L.x, 0, -L.z + s); return 3; };
      const N = 12, bodyG = mergeGeometries([new T.BoxGeometry(1.8, 0.7, 4.3).translate(0, 0.55, 0), new T.BoxGeometry(1.6, 0.55, 2.2).translate(0, 1.15, -0.2)])!;
      const body = k.instances(bodyG, new T.MeshStandardMaterial({ roughness: 0.4, metalness: 0.3 }), Array.from({ length: N }, () => new T.Matrix4()));
      body.frustumCulled = false;
      const c = new T.Color(), rs = X.mulberry(1661), st = Array.from({ length: N }, (_, i) => ({ s: (i / N) * per, v: 6 + rs() * 3 }));
      const pal = [0xf0c22a, 0xf0c22a, 0x1c1e24, 0xd8dadc, 0x5a6a7a, 0x8a1e22, 0x2a3a5a];
      st.forEach((_, i) => body.setColorAt(i, c.set(pal[i % pal.length]))); if (body.instanceColor) body.instanceColor.needsUpdate = true;
      const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), up = v(0, 1, 0), one = v(1, 1, 1);
      const heads = [PI / 2, PI, -PI / 2, 0];
      const placeC = (_t: number, dt: number) => { st.forEach((a, i) => { a.s += a.v * Math.min(dt, 0.1); const side = at(a.s, p); q.setFromAxisAngle(up, heads[side]); m.compose(p, q, one); body.setMatrixAt(i, m); }); body.instanceMatrix.needsUpdate = true; };
      placeC(0, 0); if (!ctx.reduced) k.ticks.push(placeC);
    }
    if (!ctx.reduced) {
      const coats = [0x1c232c, 0x6a4a3a, 0x2a3f6a, 0xd8d0c0, 0x3a3a3a, 0x8a2a2a, 0x4a5a3a];
      const ringR = (ox: number, oz: number) => [v(-ox, 0.15, oz), v(ox, 0.15, oz), v(ox, 0.15, -oz), v(-ox, 0.15, -oz)];
      k.crowd(ringR(PXf + 1.8, PZf + 1.8), 16, { seed: 1662, speed: 0.8, spread: 1.0, closed: true, colors: coats });
      k.crowd(ringR(EXb - 2, NZ - 2), 26, { seed: 1663, speed: 0.9, spread: 1.4, closed: true, colors: coats });
      /* the dog walker: a figure and a dog on a lead, round the fence */
      const w = new T.Group(), person = new T.Mesh(figureGeo(0.2, 0.8, 1.32), k.flat(0x6a3a2a, 0, 0.8)); w.add(person);
      const dog = new T.Group(); const db = new T.Mesh(new T.CapsuleGeometry(0.14, 0.45, 3, 8), k.flat(0xc89a5a, 0, 0.85)); db.rotation.x = PI / 2; db.position.y = 0.35; dog.add(db);
      const dh = new T.Mesh(new T.SphereGeometry(0.12, 8, 6), k.flat(0xc89a5a, 0, 0.85)); dh.position.set(0, 0.5, 0.35); dog.add(dh);
      for (const [dx, dz] of [[-0.09, -0.18], [0.09, -0.18], [-0.09, 0.18], [0.09, 0.18]]) { const l = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.26, 5), k.flat(0xc89a5a, 0, 0.85)); l.position.set(dx, 0.13, dz); dog.add(l); }
      dog.position.set(0.5, 0, 1.4); w.add(dog);
      /* 2026-10-28: the kit's dog.glb on the lead (as v19.ts), the capsule dog the stand in */
      k.prop('dog', 0, 0, 0, { height: 0.55 }).then((d) => { if (!d) return; k.scene.remove(d); d.position.set(0, 0, 0); d.rotation.y = 0; dog.children.forEach((c) => { c.visible = false; }); dog.add(d); });
      const lead = new T.Mesh(new T.CylinderGeometry(0.008, 0.008, 1.5, 4), iron); lead.position.set(0.3, 0.75, 0.7); lead.rotation.x = 1.1; w.add(lead);
      k.add(w);
      k.rider(w, k.spline(ringR(PXf + 2.2, PZf + 2.4).map((p) => p.setY(0.15)), true, 0.1), 1.1, 20);
      k.ticks.push((t) => { db.position.y = 0.35 + Math.abs(Math.sin(t * 9)) * 0.03; dog.rotation.y = Math.sin(t * 0.7) * 0.25; });
      /* leaves coming down over the park */
      const NLv = 70, lg = new T.PlaneGeometry(0.14, 0.1), leaves = k.instances(lg, k.flat(0x8a8a2a, 0, 0.9, { side: T.DoubleSide }), Array.from({ length: NLv }, () => new T.Matrix4()));
      leaves.frustumCulled = false;
      const rl = X.mulberry(1664), ls = Array.from({ length: NLv }, (_, i) => { const tr = trees[i % trees.length]; return { x: tr[0] + (rl() - 0.5) * 5, z: tr[1] + (rl() - 0.5) * 5, h: 6 + rl() * 4, ph: rl(), sp: 0.04 + rl() * 0.04 }; });
      const lc = new T.Color(); ls.forEach((_, i) => leaves.setColorAt(i, lc.set([0xb8a03a, 0x9a8a2a, 0x6a8a30, 0xc07a2a][i % 4]))); if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
      const lm = new T.Matrix4(), lq = new T.Quaternion(), lp = new T.Vector3(), le = new T.Euler(), l1 = v(1, 1, 1);
      k.ticks.push((t) => { ls.forEach((a, i) => { const u = (t * a.sp + a.ph) % 1; lp.set(a.x + Math.sin(t * 1.3 + i) * 0.6 + u * 2, a.h * (1 - u) + 0.2, a.z + Math.cos(t * 1.1 + i) * 0.6); le.set(t * 2 + i, t * 1.4 + i, 0); lq.setFromEuler(le); lm.compose(lp, lq, l1); leaves.setMatrixAt(i, lm); }); leaves.instanceMatrix.needsUpdate = true; });
      /* a resident lets themselves in at the west gate, walks in, and comes back out */
      const res = new T.Group(); const rb = new T.Mesh(figureGeo(0.2, 0.84, 1.36), k.flat(0x2a3f5a, 0, 0.8)); res.add(rb); k.add(res);
      k.ticks.push((t) => {
        const u = (t % 60) / 60, x = u < 0.5 ? -PXf - 2.6 + (u / 0.5) * 16 : -PXf - 2.6 + ((1 - u) / 0.5) * 16;
        res.position.set(x, 0.15, 0.4); res.rotation.y = u < 0.5 ? PI / 2 : -PI / 2;
        const near = Math.max(0, 1 - Math.abs(x + PXf) / 2.2);
        westL.rotation.y = -PI / 2 + near * 1.4; westR.rotation.y = PI / 2 - near * 1.4;
      });
    }
    pigeons(k, ctx.reduced, [v(-10, 0.2, -8), v(18, 0.2, 9), v(-40, 0.2, 3), v(40, 0.2, -PZf + 3), v(-30, 0.15, PZf + 1.6), v(24, 0.15, -PZf - 1.8)], 24, 1665);
    /* wave 9a: Poly Haven's cast iron street lamp at every corner and along the square, each with its own light */
    { const lampAt = [[-PXf - 1.8, 30], [PXf + 1.8, -30], [-60, PZf + 3.2], [60, -PZf - 3.2], [-10, NZ - 3.2], [30, -NZ + 3.2], [-36, PZf + 3.2], [36, PZf + 3.2], [-36, -PZf - 3.2], [-PXf - 1.8, -30], [PXf + 1.8, 30]];
      for (const [x, z] of lampAt) { k.keepOut.push({ x, z, r: 0.4 }); k.point(x, 4.3, z, 0xffd7a0, 6, 14); }
      g9Place(k, 'gramercy/street_lamp_lo', { height: 4.6 }, lampAt.map(([x, z]) => [x, 0.15, z, 0])); }
    k.keepOut.push({ x: -5.6, z: 28.0, r: 0.45 }, { x: -24, z: 41.6, r: 0.5 });
    g9Place(k, 'gramercy/hydrant', { height: 0.8 }, [[-5.6, 0.15, 28.0, 0]]);
    g9Place(k, 'gramercy/mailbox', { height: 1.3 }, [[-24, 0.15, 41.6, PI]]);
    /* the corner signs, white on green */
    for (const [x, z, a, b] of [[-8.6, 28.1, 'LEXINGTON AV', 'GRAMERCY PARK N'], [8.6, -28.1, 'IRVING PL', 'GRAMERCY PARK S']] as [number, number, string, string][]) {
      k.cyl(0.06, 2.98, x, 1.64, z, k.flat(0x2c3a30, 0.5, 0.5), 0.07, 8); k.keepOut.push({ x, z, r: 0.3 });
      for (const r0 of [0, PI]) g9Sign(k, a, 1.5, 0.26, x, 3.55, z, r0, '#f4f6f2', '#1d6b45', 'W2 Archivo Narrow', 0.62, '#f4f6f2');
      for (const r0 of [PI / 2, -PI / 2]) g9Sign(k, b, 1.6, 0.26, x, 3.25, z, r0, '#f4f6f2', '#1d6b45', 'W2 Archivo Narrow', 0.62, '#f4f6f2');
    }
    /* the illusion: a chalk key drawn long and thin across Gramercy Park North, which stands up as a key only from
       under the hotel awning, where the real one hangs */
    if (G9_DOM) {
      const chalk = paintTex(512, 1024, (g) => {
        g.clearRect(0, 0, 512, 1024);
        g.strokeStyle = 'rgba(250,246,230,0.95)'; g.lineCap = 'round'; g.lineJoin = 'round';
        g.lineWidth = 26; g.beginPath(); g.ellipse(256, 210, 150, 150, 0, 0, PI * 2); g.stroke();
        g.lineWidth = 18; g.beginPath(); g.ellipse(256, 210, 70, 70, 0, 0, PI * 2); g.stroke();
        g.lineWidth = 34; g.beginPath(); g.moveTo(256, 360); g.lineTo(256, 930); g.stroke();
        g.lineWidth = 26; g.beginPath(); g.moveTo(256, 820); g.lineTo(400, 820); g.lineTo(400, 880); g.lineTo(330, 880); g.moveTo(256, 920); g.lineTo(380, 920); g.lineTo(380, 970); g.stroke();
        g.strokeStyle = 'rgba(240,200,80,0.9)'; g.lineWidth = 10; g.beginPath(); g.ellipse(256, 210, 112, 112, 0, 0, PI * 2); g.stroke();
        g.fillStyle = 'rgba(200,40,40,0.85)'; g.fillRect(168, 40, 176, 70);
        g.fillStyle = 'rgba(250,246,230,0.95)'; g.font = 'bold 44px "W2 JetBrains Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('No. 39', 256, 76);
      }, ['W2 JetBrains Mono']);
      const yaw = Math.atan2(-20, 14.5);
      anamorphTex(k, chalk, -20, NZ - 3.0, 0.15 + 3, 0.0, yaw, 4, 1.5, 2.2, 0.9);
      k.box(0.9, 0.012, 0.9, -20, 0.16, NZ - 3.0, k.flat(0xf0ead8, 0, 0.9));
    }
    /* ---- what the square knows ---- */
    const src = { name: 'Gramercy Park, Wikipedia', url: 'https://en.wikipedia.org/wiki/Gramercy_Park' };
    const keyEgg = k.egg(key, { id: 'the-key', title: 'Two keys to a lot', text: 'Since December 31, 1831 the park has been held in common by the owners of the 39 buildings round it, and two keys are allocated to each of the original lots. In 2012 there were 383 keys in circulation, each individually numbered and coded, and the Medeco locks are changed every year. A key cost $350 in 2008, with a $1,000 fee for a lost one. The Gramercy Park Hotel holds twelve. This one opens the north gate.', clue: 'Only the houses round the square hold keys. Ask at the door with the awning across from the gate.', source: src }, { r: 0.9 });
    k.egg(v(-20, 0.6, NZ - 3.0), { id: 'gramercy-chalk-key', title: 'A key that stands up', text: 'The key chalked across the road is an anamorphosis, a picture stretched so far that it only looks right from one place. Pavement artists draw them this way so a flat drawing seems to rise off the street. Stand on the chalk square under the hotel awning and the key stands upright; anywhere else it is a long smear on the asphalt.', clue: 'Find the chalk square on the pavement under the green awning and look back toward the gate.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.2 });
    k.egg(v(-PXf - 0.2, 1.5, 0), { id: 'ruggles-1831', title: 'Laid out in 1831', year: '1831', text: 'Samuel B. Ruggles created the park in 1831, about two acres of it, and it was enclosed by a fence in 1833. By 1839 the paths had been laid out and the trees and shrubs planted. It is still locked, and still opens to the public on Christmas Eve.', clue: 'Read the plaque on the west gate, the one a resident uses.', source: src }, { r: 1.2 });
    k.egg(booth, { id: 'booth-1918', title: 'Edwin Booth, in bronze', year: '1918', text: 'The statue in the middle of the park is of the actor Edwin Booth, one of the neighbourhood\'s most famous residents, by the sculptor Edmond T. Quinn. It was dedicated on November 13, 1918.', clue: 'Find the gate open and walk to the figure in the middle.', source: src }, { r: 1.6 });
    k.egg(v(-32, 6.2, -NZ + 0.5), { id: 'tilden-mansion', title: 'The Tilden mansion', text: 'The National Arts Club occupies No. 15 Gramercy Park South, a Victorian Gothic mansion that belonged to Samuel J. Tilden and was remodelled for him by Calvert Vaux.', clue: 'Look for the brownstone with two bay windows and pointed arches on the south side.', source: src }, { r: 2.0 });
    k.egg(v((PL0 + PL1) / 2, 8.6, -NZ + 2.3), { id: 'the-players', title: 'A deed on New Year\'s Eve', year: '1888', text: 'The Players, at No. 16 Gramercy Park South, was founded by Edwin Booth, who turned over the deed to the building on New Year\'s Eve 1888. Stanford White renovated it.', clue: 'The man on the pedestal in the park gave away the house with the porch.', source: src }, { r: 2.0 });
    k.egg(v(EXb - 0.4, 6, 20), { id: 'first-apartments', title: 'The oldest co op in the city', year: '1883', text: 'Nos. 34 and 36 Gramercy Park East are two of the first apartment buildings in New York, designed in 1883 and 1905, and No. 34 is the oldest existing co-operative apartment building in the city.', clue: 'Cross to the east side and find the red brick house with the round tower.', source: src }, { r: 2.2 });
    /* the key opens the gate: poll the egg, take the gate's keep outs out of play, swing the leaves in */
    /* main.ts sets egg.found through markEggs, and does not run ticks at all for reduced motion, so the
       unlock hangs on the property itself: the keep outs go the moment the key is found (or on arrival,
       for a visitor who found it before), and the tick only animates the swing. */
    let unlocked = false, opened = -1, found = keyEgg.found;
    const swing = (e: number) => { northL.rotation.y = -1.75 * e; northR.rotation.y = PI + 1.75 * e; };
    const unlock = () => { if (unlocked) return; unlocked = true; for (const o of gateKO) { const i = k.keepOut.indexOf(o); if (i >= 0) k.keepOut.splice(i, 1); } if (ctx.reduced) swing(1); };
    Object.defineProperty(keyEgg, 'found', { get: () => found, set: (f: boolean) => { found = f; if (f) unlock(); }, configurable: true, enumerable: true });
    k.ticks.push((t) => {
      if (!unlocked) return;
      if (opened < 0) opened = t;
      const u = Math.min(1, (t - opened) / 1.8); swing(u * u * (3 - 2 * u));
    });
    g9ShadowTrim(k, -15, 29.8, 18);
    return { mounts, spawn: v(-15, 3, 29.8), look: v(6, 1.6, 8), eye: 3, bounds: [-EXb + 2, EXb - 2, -NZ + 1, NZ - 1], style: 'black' };
  },
};
