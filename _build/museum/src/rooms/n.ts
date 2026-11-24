/* Rooms 62 to 66: Studio 8H, Carnegie Hall, the Village Vanguard, Rucker Park, 1520 Sedgwick Avenue.
   Fourth set: the cultural icons. Every room here is marked fresh in CURATION, so the walls show New Yorkers no other room has shown. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront, hsign, paintTex, anamorphTex } from './f';
import type { Kit } from '../kit';
import { hero, heroInstances } from './heroes';
import { anamorph, fireflyPlate } from './a';

const PI = Math.PI;

/* ---------- THE BIG UPGRADE, wave 4a (2026-11-24): helpers for rooms 62 to 66, also used by carnegie2 in up4.ts ----------
   Scanned CC0 surfaces (Poly Haven, assets/museum/tex/<room>/) that wear a sensible colour until all their maps land,
   real models from assets/museum/props/<room>/ placed many at once. Safe in node: the audit builds these rooms with no
   DOM, so a scan falls back to its painted surface and the loaders never resolve there. */
export const HAS_DOM4 = typeof window !== 'undefined' && typeof HTMLImageElement !== 'undefined';
const texL4 = HAS_DOM4 ? new T.TextureLoader() : null;
const w4 = new Map<string, { s: X.Surface; ready: Promise<unknown> }>();
export function scn(k: Kit, room: string, id: string, metres: number, paint: () => X.Surface, p: Partial<T.MeshStandardMaterialParameters> & { normal?: number } = {}, wait = 0x888888) {
  if (!texL4) return k.pbr(`w4a-${room}-${id}`, paint(), 1 / metres, p);
  let e = w4.get(`${room}/${id}`);
  if (!e) {
    const low = k.o.quality !== 'high', waits: Promise<unknown>[] = [];
    const one = (suf: string, srgb: boolean) => {
      let done: () => void = () => {};
      waits.push(new Promise<void>((r) => (done = r)));
      const t = texL4.load(`assets/museum/tex/${room}/${id}_${suf}.webp`, () => done(), undefined, () => done());
      t.wrapS = t.wrapT = T.RepeatWrapping;
      t.anisotropy = 8;
      if (srgb) t.colorSpace = T.SRGBColorSpace;
      return t as unknown as T.CanvasTexture;
    };
    e = { s: { map: one('c', true), normalMap: one('n', false), roughnessMap: low ? undefined : one('r', false) }, ready: Promise.all(waits) };
    w4.set(`${room}/${id}`, e);
  }
  k.pending.push(e.ready);
  const m = k.pbr(`w4a-${room}-${id}`, e.s, 1 / metres, p);
  if (!m.userData.w4a) {
    m.userData.w4a = true;
    const maps = { map: m.map, normalMap: m.normalMap, roughnessMap: m.roughnessMap }, tint = m.color.clone();
    m.map = m.normalMap = m.roughnessMap = null;
    m.color.set(wait);
    void e.ready.then(() => { Object.assign(m, maps); m.color.copy(tint); m.needsUpdate = true; });
  }
  return m;
}
/* A real model fitted once and set at every [x, y, z, rotY, scale?]; seven or more become instanced parts (one draw each). */
export function many(k: Kit, name: string, fit: Parameters<typeof hero>[2], at: number[][], tweak?: (o: T.Object3D) => void) {
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
/* Recolour every material of a loaded model without touching the source cache. */
export function retint(o: T.Object3D, hex: number, rough = 0.6, metal = 0.2) {
  const cache = new Map<T.Material, T.Material>();
  o.traverse((c) => { if (!(c instanceof T.Mesh)) return; const src = c.material as T.MeshStandardMaterial; let m = cache.get(src); if (!m) { const n = src.clone(); n.color.setHex(hex); n.roughness = rough; n.metalness = metal; m = n; cache.set(src, m); } c.material = m; });
}
/* Theatre lanterns hung from a grid: a can, a yoke and a lit lens per [x, y, z, yaw, tilt], three draws for any number. */
export function lanterns(k: Kit, at: number[][], body: T.Material, lens = 0xfff0d0) {
  const can = new T.CylinderGeometry(0.2, 0.24, 0.55, 12); can.rotateX(PI / 2);
  const yoke = new T.BoxGeometry(0.56, 0.05, 0.05); yoke.translate(0, 0.22, 0);
  const face = new T.CircleGeometry(0.19, 14); face.translate(0, 0, 0.28);
  const ms = at.map(([x, y, z, yaw, tilt]) => new T.Matrix4().compose(v(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(tilt, yaw, 0, 'YXZ')), v(1, 1, 1)));
  k.instances(can, body, ms); k.instances(yoke, body, ms); k.instances(face, k.glow(lens), ms);
}
/* The party flyer as an index card in marker: Cindy Campbell's card, lettered again in the house hand (canvas only). */
function flyer() {
  return paintTex(1024, 640, (g, w, h) => {
    g.fillStyle = '#f2ecd8'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(120,150,190,0.5)'; g.lineWidth = 3; for (let y = 120; y < h; y += 58) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.strokeStyle = 'rgba(200,60,60,0.55)'; g.beginPath(); g.moveTo(90, 0); g.lineTo(90, h); g.stroke();
    g.fillStyle = '#1a1a40'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const line = (t: string, y: number, s: number) => { g.font = `${s}px "W2 Permanent Marker", "Marker Felt", sans-serif`; g.fillText(t, w / 2 + 30, y); };
    line('A DJ KOOL HERC PARTY', 92, 62); line('BACK TO SCHOOL JAM', 212, 92); line('1520 SEDGWICK AVE', 330, 66); line('AUG 11TH  9PM TO 4AM', 430, 56); line('LADIES 25  FELLAS 50', 540, 60);
  }, ['W2 Permanent Marker']);
}
/* A floor stencil for an anamorphic piece in a house font (canvas only: call behind HAS_DOM4). */
export function floorWords(text: string, fg: string, w = 1024, h = 256, font = 'W2 Archivo Expanded') {
  return paintTex(w, h, (g) => { g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; let s = h * 0.8; g.font = `800 ${s}px "${font}", Arial, sans-serif`; const tw = g.measureText(text).width; if (tw > w * 0.94) { s *= (w * 0.94) / tw; g.font = `800 ${s}px "${font}", Arial, sans-serif`; } g.fillText(text, w / 2, h / 2); }, [font]);
}

/* ---------------- 62 STUDIO 8H ---------------- */
export const studio8h: RoomDef = {
  id: 'studio8h',
  name: 'Live from New York',
  area: 'STUDIO 8H',
  mood: 'Eleven thirty Saturday',
  color: '#e8b040',
  description: 'The lobby of the tower on the plaza, the elevator up, then the studio: the home base stage, the band stand, the cameras, the bleachers, the cue cards, the works on every set wall.',
  signatures: 'The art deco lobby with its grey Champlain marble and the sepia Sert mural on the ceiling, the studio floor with its brick home base arch and the musical guest stage, the boom cameras and the applause sign, the steep audience bleachers, the cue card easel.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x0e1424, horizon: 0x2a2a44, ground: 0x0a0a10, fog: 0.004, stars: 160, env: 0.5 });
    k.hemi(0xffe4c8, 0x14100c, 0.4);
    /* 2026-11-24 (wave 4a): scanned surfaces (Poly Haven, CC0) for every big one: grey veined marble on the lobby walls and a
       polished marble tile floor, red brick on home base, a sealed concrete studio deck, black painted boards on the studio
       walls, red velour on the bleachers. Each wears a dark version of its colour until its maps arrive. */
    const brick = scn(k, 'studio8h', 'red_brick_03', 2.2, () => X.brick(0x8a5a48, 164), { color: 0xc49482 }, 0x5a3a30),
      floorS = scn(k, 'studio8h', 'smooth_concrete_floor', 4, () => X.concrete(0x3a3a3c, 79), { color: 0x5e5e62, roughness: 0.55 }, 0x26262a),
      wallS = scn(k, 'studio8h', 'black_painted_planks', 2.4, () => X.planks(0x161618, 5, 165), { color: 0x3a3a40, roughness: 0.9 }, 0x121214),
      dark = k.flat(0x111216, 0.5, 0.7),
      steel = k.flat(0x8c98a4, 0.9, 0.3),
      black = k.flat(0x0a0a0c, 0.3, 0.8),
      wood = k.pbr('shWood', X.planks(0x6a4a30, 5, 165), 1.0),
      red = scn(k, 'studio8h', 'velour_velvet', 0.8, () => X.velvet(0x8a1a22), { color: 0xb8323a, roughness: 0.95 }, 0x4a1014),
      marble = scn(k, 'studio8h', 'marble_01', 2.4, () => X.marble(0x56585a, 0x9a9890, 13), { color: 0x9a948a, roughness: 0.3 }, 0x4a4844),
      lobbyF = scn(k, 'studio8h', 'marble_tiles', 2.4, () => X.marble(0x56585a, 0x9a9890, 13), { color: 0x8e8880, roughness: 0.22 }, 0x45423e),
      sert = scn(k, 'studio8h', 'white_plaster_02', 3, () => X.plaster(0x9a7a56, 168), { color: 0xb08c64, roughness: 0.8 }, 0x4a3a2a),
      gold = k.pbr('shGold', X.gilt(0xd0a852), 2, { metalness: 0.85, roughness: 0.3 }),
      bronze = k.pbr('shBronze', X.gilt(0x8a6638), 2, { metalness: 0.9, roughness: 0.42 }),
      blackM = k.flat(0x16161a, 0.1, 0.16),
      neon = k.glow(0xff4a3a),
      white = k.flat(0xf4f0e8, 0, 0.8);
    // the plaza and the lobby of the tower: dark marble, the Sert ceiling, the elevator bank
    const LZ = 20, LW = 30, LD = 24;
    k.box(120, 0.4, 60, 0, -0.2, LZ + 30, k.pbr('shPlaza', X.pavers(0x6a6a66, 80), 0.4));
    k.box(80, 200, 40, 0, 100, LZ - LD - 20, k.pbr('shTower', X.windows(166, 0.4, 0x6a6660, true), 0.12, { emissive: 0xffffff, emissiveIntensity: 0.9, stretch: 0.42 }));
    for (let x = -36; x <= 36; x += 6) k.box(1.0, 200, 0.6, x, 100, LZ + 0.2, k.pbr('shLime', X.ashlar(0xb8ad97, 167, 3), 0.22));
    k.box(LW, 0.3, LD, 0, 0.15, LZ - LD / 2, lobbyF);
    /* a black marble border round the floor, the deco way */
    for (const s of [-1, 1]) { k.box(0.5, 0.31, LD - 1, s * (LW / 2 - 0.9), 0.155, LZ - LD / 2, blackM); }
    for (const z of [LZ - 0.6, LZ - LD + 0.6]) k.box(LW - 1.3, 0.31, 0.5, 0, 0.155, z, blackM);
    for (const s of [-1, 1]) { k.box(0.6, 10, LD, s * LW / 2, 5, LZ - LD / 2, marble); k.block(s * LW / 2 - 0.5, s * LW / 2 + 0.5, LZ - LD, LZ); }
    /* the back of the lobby is marble now, not the tower's outside windows seen from within */
    k.box(LW, 10, 0.08, 0, 5, LZ - LD + 0.1, marble);   // in front of the tower's face at z -4, not in it
    /* the ceiling: Sert's 1941 sepia mural, painted plaster, not gold leaf. The plate is queued (FIREFLY_QUEUE.md, studio8h);
       the sepia plaster shows until it lands. A gilt frame and a stepped deco cornice run round it. */
    k.box(LW, 0.4, LD, 0, 10, LZ - LD / 2, sert);
    { const p = fireflyPlate(k, 'assets/museum/tex/studio8h/ff_sert_ceiling.webp', LW - 2.4, LD - 2.4, 0, 9.78, LZ - LD / 2, 0, sert); p.rotation.x = PI / 2; }
    const corn: [number, number][] = [[0, 0], [0.18, 0], [0.18, 0.16], [0.34, 0.16], [0.34, 0.32], [0.5, 0.32], [0.5, 0.5], [0, 0.5]];
    for (const s of [-1, 1]) k.moulding(corn, LD, s * (LW / 2 - 0.3), 9.3, LZ - LD / 2, gold, s < 0 ? 0 : PI);
    k.moulding(corn, LW, 0, 9.3, LZ - LD + 0.0, gold, -PI / 2);
    for (const s of [-1, 1]) k.box(0.3, 0.06, LD - 2.2, s * (LW / 2 - 1.2), 9.77, LZ - LD / 2, gold);
    for (const z of [LZ - 1.2, LZ - LD + 1.2]) k.box(LW - 2.1, 0.06, 0.3, 0, 9.77, z, gold);
    /* fluted marble pilasters with stepped gilt capitals between the works, and deco fan uplights on them */
    const fan = k.glow(0xffdcaa, 0.9);
    for (const s of [-1, 1]) for (const z of [19, 9, -1]) {
      const x = s * (LW / 2 - 0.55);
      k.box(0.5, 9.3, 1.1, x, 4.8, z, marble);
      for (const dz of [-0.32, 0, 0.32]) k.box(0.06, 7.6, 0.1, x - s * 0.26, 4.4, z + dz, blackM);
      for (let i = 0; i < 3; i++) k.box(0.62 + i * 0.12, 0.16, 1.2 + i * 0.16, x - s * (0.06 + i * 0.06), 8.6 + i * 0.16, z, gold);
      const f = k.mesh(new T.CylinderGeometry(0.42, 0.12, 0.6, 12, 1, true, 0, PI), fan, x - s * 0.28, 6.4, z, true); f.rotation.y = s < 0 ? PI / 2 : -PI / 2;
      k.point(x - s * 0.8, 7.2, z, 0xffdcaa, 6, 7);
    }
    /* the elevator bank: bronze frames, doors with a seam and chevron reliefs, and a floor dial over each whose needle climbs */
    const needles: T.Mesh[] = [];
    for (const x of [-9, 0, 9]) {
      const ez = LZ - LD + 0.1;
      k.box(3.3, 5.3, 0.3, x, 2.65, ez + 0.05, bronze);
      for (const dx of [-0.7, 0.7]) { k.box(1.36, 4.6, 0.08, x + dx, 2.4, ez + 0.24, dark); for (let c = 0; c < 4; c++) { const y = 1.0 + c * 1.0; for (const sx of [-1, 1]) { const b = k.box(0.62, 0.05, 0.03, x + dx + sx * 0.28, y, ez + 0.29, gold); b.rotation.z = sx * 0.5; } } }
      k.box(0.04, 4.6, 0.1, x, 2.4, ez + 0.28, gold);
      const dial = k.mesh(new T.RingGeometry(0.5, 0.62, 24, 1, 0, PI), gold, x, 5.75, ez + 0.22, true); void dial;
      k.mesh(new T.CircleGeometry(0.5, 24, 0, PI), k.flat(0xe8dcc0, 0, 0.5), x, 5.75, ez + 0.21, true);
      const n = k.mesh(new T.BoxGeometry(0.03, 0.46, 0.02), black, x, 5.75, ez + 0.24, true); n.geometry.translate(0, 0.23, 0); needles.push(n);
      k.point(x, 6, ez + 3, 0xffe6c0, 20, 12);
    }
    if (!ctx.reduced) k.ticks.push((t) => needles.forEach((n, i) => { n.rotation.z = (PI / 2) * Math.sin(t * 0.25 + i * 2.1); }));
    k.block(-LW / 2, LW / 2, LZ - LD - 0.5, LZ - LD + 0.5);
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) k.point(s * 8, 8, LZ - 3 - i * 6, 0xffe0b0, 18, 12);
    hsign(k, 'STUDIO 8H  EIGHTH FLOOR', 9, 0.6, 0, 7.6, LZ - LD + 0.32, 0, { fg: '#f4e4b0', font: 'W2 Archivo Expanded', size: 0.62 });
    hsign(k, 'THE MUSEUM TONIGHT', 6, 0.42, 0, 7.0, LZ - LD + 0.32, 0, { fg: '#d8c08a', font: 'W2 JetBrains Mono', size: 0.6 });
    // the studio: a big dark box with a lighting grid, reached through the elevator wall (a door in the middle)
    const SZ = LZ - LD, SW = 44, SD = 40, SH = 12;
    k.block(-LW / 2, -1.6, SZ - 0.6, SZ + 0.6); k.block(1.6, LW / 2, SZ - 0.6, SZ + 0.6);
    k.box(SW, 0.4, SD, 0, -0.2, SZ - SD / 2, floorS);
    for (const s of [-1, 1]) { k.box(0.6, SH, SD, s * SW / 2, SH / 2, SZ - SD / 2, wallS); k.block(s * SW / 2 - 0.5, s * SW / 2 + 0.5, SZ - SD, SZ); }
    k.box(SW, SH, 0.6, 0, SH / 2, SZ - SD, wallS);
    k.box(SW, SH, 0.3, 0, SH / 2, SZ - 0.5, wallS);
    k.block(-SW / 2, SW / 2, SZ - SD - 0.5, SZ - SD + 0.5);
    k.box(SW, 0.4, SD, 0, SH, SZ - SD / 2, black);
    for (let x = -SW / 2 + 2; x < SW / 2; x += 3) k.box(0.12, 0.12, SD, x, SH - 1.4, SZ - SD / 2, steel);
    for (let z = SZ - 2; z > SZ - SD; z -= 3) k.box(SW, 0.12, 0.12, 0, SH - 1.4, z, steel);
    // home base: the brick arch with the band stand at left, the guest stage at right
    const HX = 0, HZ = SZ - SD + 6;
    k.box(14, 8, 1.0, HX, 4, HZ - 3, brick);
    k.arch(6, 7, 1.2, HX, 0, HZ - 3, brick, false, 0.85);
    /* the window in the arch: a night street seen through it (queued plate; a deep blue night until it lands) */
    fireflyPlate(k, 'assets/museum/tex/studio8h/ff_homebase_window.webp', 4.6, 5.6, HX, 3.1, HZ - 2.44, 0, k.glow(0x1c2a48), true);
    for (const dx of [-1.15, 0, 1.15]) k.box(0.08, 5.6, 0.06, HX + dx, 3.1, HZ - 2.4, dark);
    for (const y of [1.6, 3.1, 4.6]) k.box(4.6, 0.08, 0.06, HX, y, HZ - 2.4, dark);
    k.moulding([[0, 0], [0.3, 0], [0.3, 0.2], [0.15, 0.3], [0, 0.32]], 14.4, HX, 8.0, HZ - 2.5, brick, -PI / 2);
    k.box(14, 0.4, 8, HX, 0.2, HZ + 1, wood);
    k.block(HX - 7, HX + 7, HZ - 3.6, HZ - 2.4);
    k.box(10, 0.6, 6, -16, 0.3, HZ + 2, black);
    for (let i = 0; i < 5; i++) { k.cyl(0.05, 1.1, -19 + i * 1.5, 0.85, HZ + 1, steel, 0.05, 6); k.box(0.5, 0.35, 0.3, -19 + i * 1.5, 1.4, HZ + 1, black); }
    k.cyl(0.3, 0.5, -14, 1.2, HZ + 3.5, steel, 0.3, 12); k.cyl(0.28, 0.02, -14, 1.5, HZ + 3.5, gold, 0.28, 16);
    k.block(-21, -11, HZ - 1, HZ + 5);
    k.box(12, 0.6, 8, 16, 0.3, HZ + 2, black);
    k.cyl(0.05, 1.6, 16, 1.4, HZ + 4, steel, 0.05, 6); k.cyl(0.08, 0.2, 16, 2.3, HZ + 4, black, 0.08, 8);
    k.block(10, 22, HZ - 2, HZ + 6);
    /* the studio cameras on pedestals: a three wheeled base, a column, the steering ring, the body with its lens hood, the
       prompter glass, the pan bars, and the red tally lit on the camera that is on air */
    const tallies: T.Mesh[] = [];
    for (const [x, z, yaw] of [[-6, HZ + 12, 0.25], [6, HZ + 12, -0.25], [0, HZ + 18, 0]]) {
      const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = yaw; k.add(g);
      const put = (geo: T.BufferGeometry, m: T.Material, px: number, py: number, pz: number, rx = 0) => { const o = new T.Mesh(geo, m); o.position.set(px, py, pz); o.rotation.x = rx; g.add(o); return o; };
      for (let i = 0; i < 3; i++) { const a = (i / 3) * PI * 2; const leg = put(new T.BoxGeometry(0.12, 0.1, 0.8), steel, Math.sin(a) * 0.4, 0.18, Math.cos(a) * 0.4); leg.rotation.y = a; put(new T.CylinderGeometry(0.09, 0.09, 0.08, 10), black, Math.sin(a) * 0.78, 0.09, Math.cos(a) * 0.78, PI / 2).rotation.z = a; }
      put(new T.CylinderGeometry(0.16, 0.2, 1.2, 12), steel, 0, 0.8, 0);
      put(new T.TorusGeometry(0.5, 0.03, 6, 24), steel, 0, 1.3, 0, PI / 2);
      put(new T.BoxGeometry(0.62, 0.62, 0.95), dark, 0, 1.75, 0);
      put(new T.CylinderGeometry(0.2, 0.24, 0.5, 14), black, 0, 1.72, -0.7, PI / 2);
      const pr = put(new T.BoxGeometry(0.66, 0.5, 0.02), k.glass(0xa8c8e8, 0.35, 0.05), 0, 1.78, -1.0); pr.rotation.x = 0.75;
      put(new T.BoxGeometry(0.72, 0.56, 0.04), black, 0, 1.78, -0.78);
      put(new T.BoxGeometry(0.4, 0.3, 0.3), black, 0, 2.2, 0.25);
      for (const sx of [-1, 1]) { const bar = put(new T.CylinderGeometry(0.025, 0.025, 0.9, 6), steel, sx * 0.34, 1.6, 0.75, PI / 2 - 0.4); bar.rotation.z = sx * 0.2; }
      tallies.push(put(new T.BoxGeometry(0.12, 0.08, 0.05), neon, 0, 2.08, -0.45));
      k.keepOut.push({ x, z, r: 1.2 });
    }
    if (!ctx.reduced) k.ticks.push((t) => { const on = Math.floor(t / 6) % 3; tallies.forEach((m, i) => { m.visible = i === on; }); });
    const boom = k.beam(v(-12, 3, HZ + 20), v(-4, 5, HZ + 8), 0.08, steel, 6); void boom;
    k.box(0.8, 0.8, 1.2, -4, 5, HZ + 8, black);
    for (let i = 0; i < 8; i++) k.spot(-14 + i * 4, SH - 1.6, HZ + 10, -14 + i * 4, 0, HZ + 1, 0xfff0d8, 160, 0.5, 0.6, 30);
    /* the grid is hung: forty lanterns pointed at home base and the two stages */
    { const at: number[][] = []; for (let x = -19; x <= 19; x += 3.8) for (const z of [HZ + 5, HZ + 11, HZ + 17]) at.push([x, SH - 1.75, z, PI, -0.7 - (z - HZ) * 0.02]); lanterns(k, at, k.flat(0x1a1a1e, 0.6, 0.45)); }
    /* real floor lights (Poly Haven flood_lights, CC0) washing the home base bricks */
    many(k, 'studio8h/ph_flood_double', { height: 1.56 }, [[-8.4, 0, HZ + 3.2, PI + 0.5], [8.4, 0, HZ + 3.2, PI - 0.5], [-4.6, 0.4, HZ + 4.3, PI + 0.2], [4.6, 0.4, HZ + 4.3, PI - 0.2]]);
    // the bleachers: six steep audience risers facing home base, the applause sign, the cue card easel
    const BZ = HZ + 24, ROWS = 6;
    for (let r = 0; r < ROWS; r++) { k.box(30, 0.6, 1.6, 0, 0.3 + r * 0.6, BZ + r * 1.6, dark); for (let x = -14; x <= 14; x += 0.7) { k.box(0.55, 0.5, 0.5, x, 0.85 + r * 0.6, BZ + r * 1.6 + 0.3, red); } }
    for (const s of [-1, 1]) { k.beam(v(s * 15.1, 1.2, BZ - 0.8), v(s * 15.1, 0.6 * ROWS + 1.2, BZ + ROWS * 1.6 - 0.8), 0.04, steel, 6); }
    k.block(-15.2, 15.2, BZ - 0.8, BZ + ROWS * 1.6 - 0.8);
    /* the audience monitors hung over the floor, facing the bleachers (Poly Haven Television_01, CC0) */
    for (const x of [-10, -3.5, 3.5, 10]) { k.beam(v(x, SH - 1.4, BZ - 3), v(x, 7.2, BZ - 3), 0.03, steel, 4); }
    many(k, 'studio8h/ph_Television_01', { height: 1.05 }, [[-10, 6.1, BZ - 3, 0], [-3.5, 6.1, BZ - 3, 0], [3.5, 6.1, BZ - 3, 0], [10, 6.1, BZ - 3, 0]]);
    k.box(6, 1.2, 0.2, -8, SH - 2.6, HZ + 3, dark);
    k.sign('APPLAUSE', 5.6, 1.0, -8, SH - 2.6, HZ + 3.12, '#14090a', '#ff4a4a', 120, 0, { border: true });
    const app = k.mesh(new T.BoxGeometry(5.8, 0.06, 0.06), neon, -8, SH - 2.0, HZ + 3.12, true);
    if (!ctx.reduced) k.ticks.push((t) => { (app.material as T.MeshBasicMaterial).opacity = Math.sin(t * 3) > 0 ? 1 : 0.1; });
    (app.material as T.MeshBasicMaterial).transparent = true;
    /* ON AIR over the studio door, lit, and the studio's name across the back wall over home base */
    k.box(2.6, 0.9, 0.3, 8, SH - 2.6, HZ + 3, dark);
    hsign(k, 'ON AIR', 2.4, 0.74, 8, SH - 2.6, HZ + 3.16, 0, { fg: '#ff3a2a', bg: '#1a0806', font: 'W2 Archivo Expanded', size: 0.66, border: '#ff3a2a' });
    hsign(k, 'STUDIO 8H', 12, 1.5, 0, SH - 2.4, SZ - SD + 0.32, 0, { fg: '#d8d2c4', font: 'W2 Archivo Expanded', size: 0.8, lit: false });
    k.box(0.06, 2.4, 0.06, 8, 1.2, HZ + 9, steel); k.box(0.06, 2.4, 0.06, 8.9, 1.2, HZ + 9, steel);
    k.box(1.4, 1.0, 0.04, 8.45, 2.0, HZ + 9, white);
    k.sign('LIVE FROM NEW YORK', 1.3, 0.5, 8.45, 2.0, HZ + 9.03, '#f4f0e8', '#14090a', 40, PI, { border: false });
    k.censusWall({ x: -SW / 2 + 0.34, y: 4.4, z: SZ - SD / 2, rotY: PI / 2, cols: 30, rows: 5, tile: 0.55, gap: 0.05, start: ctx.wallStart(7400, 150), pieces: ctx.all, backing: dark });
    k.crowd([v(-13, 0.6 * ROWS, BZ + (ROWS - 1) * 1.6), v(0, 0.6 * ROWS, BZ + (ROWS - 1) * 1.6), v(13, 0.6 * ROWS, BZ + (ROWS - 1) * 1.6)], 8, { seed: 62, speed: 0.15, spread: 1, animate: !ctx.reduced });
    /* the illusion (one per room): LIVE FROM NEW YORK is painted flat on the studio deck between the bleachers and the
       cameras, stretched so that from the top row it stands up as a card in the air. Anywhere else it is long smears. */
    const topZ = BZ + (ROWS - 1) * 1.6, topY = 0.6 * ROWS;
    anamorph(k, 'LIVE FROM NEW YORK', 0, topZ, topY + 3, 0.02, topZ - (BZ - 1.4), 8, 2.0, '#f4ead2', 150);
    k.egg(v(0, 0.4, BZ - 3.6), { id: 'studio8h-anamorph', title: 'A cue card on the floor', text: 'LIVE FROM NEW YORK is painted flat across the studio deck, stretched so that from the top row of the bleachers it stands up like a card held in the air. Step down and it falls back into long smears of paint. The trick is anamorphosis, the same one that hides a skull across the floor of Hans Holbein\'s The Ambassadors of 1533.', clue: 'Climb to the top row of the bleachers and look down at the floor.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.8 });
    /* Lee Lawrie's Wisdom over the entrance, and the eggs */
    k.sign('WISDOM AND KNOWLEDGE SHALL BE THE STABILITY OF THY TIMES', 16, 0.6, 0, 11.2, LZ + 0.75, '#1a1a1a', '#d8c08a', 60, 0, { border: false });
    const W8 = 'https://en.wikipedia.org/wiki/Studio_8H', SNL = 'https://en.wikipedia.org/wiki/Saturday_Night_Live', RCA = 'https://en.wikipedia.org/wiki/30_Rockefeller_Plaza';
    k.egg(v(0, 10.6, LZ + 0.9), { id: 'studio8h-wisdom', title: 'A voice from the clouds', year: '1933', text: 'The three arches of the main entrance carry Lee Lawrie\'s carving Wisdom, A Voice from the Clouds, with Sound to the left and Light to the right. The frieze quotes Isaiah 33:6: Wisdom and Knowledge shall be the stability of thy times.', clue: 'Look up over the entrance before you walk in.', source: { name: '30 Rockefeller Plaza, Wikipedia', url: RCA } }, { r: 1.6 });
    k.egg(v(0, 8.6, LZ - LD / 2), { id: 'studio8h-rivera', title: 'The mural that was destroyed', year: '1934', text: 'Diego Rivera\'s Man at the Crossroads was painted for this lobby and destroyed in 1934 over its communist imagery. Josep Maria Sert\'s American Progress, 50 by 17 feet, took its place in 1937, and in 1941 a sixth Sert mural, 100 by 50 feet, went onto the ceiling.', clue: 'Stand in the middle of the lobby and look at the ceiling.', source: { name: '30 Rockefeller Plaza, Wikipedia', url: RCA } }, { r: 1.8 });
    k.egg(v(0, 7, SZ - SD / 2), { id: 'studio8h-radio', title: 'The biggest radio studio on earth', year: '1933', text: 'Studio 8H was built in 1933 as the largest radio studio in the world, 132 by 78 feet and three storeys tall, big enough for a full orchestra. It was converted for television in 1950, mainly for the live Kraft Television Theatre.', clue: 'Look up at the lighting grid in the middle of the studio.', source: { name: 'Studio 8H, Wikipedia', url: W8 } }, { r: 1.8 });
    k.egg(v(-16, 1.6, HZ + 2), { id: 'studio8h-toscanini', title: 'Toscanini\'s room', year: '1937', text: 'In 1937 the studio became the home of Arturo Toscanini\'s NBC Symphony Orchestra. Samuel Barber\'s Adagio for Strings was first performed from this room.', clue: 'Find the band stand to the left of home base.', source: { name: 'Studio 8H, Wikipedia', url: W8 } }, { r: 1.0 });
    k.egg(v(HX, 2.4, HZ - 1.6), { id: 'studio8h-premiere', title: 'NBC\'s Saturday Night', year: '1975', text: 'The show premiered here on October 11, 1975, hosted by George Carlin, under the title NBC\'s Saturday Night. The studio, which had housed NBC\'s election and moon landing coverage, was revamped for the premiere at a cost of $250,000. In 1976 three episodes moved to NBC\'s Brooklyn studios because NBC News needed 8H for election night.', clue: 'Stand under the brick arch of home base.', source: { name: 'Saturday Night Live, Wikipedia', url: SNL } }, { r: 1.6 });
    k.egg(v(8.45, 2.0, HZ + 9.2), { id: 'studio8h-1129', title: 'Eleven twenty nine and thirty seconds', text: 'The show starts at 11:29:30 p.m. Eastern, not on the half hour. Before it, at 8:00 p.m., the cast plays the whole show to a different live audience as a dress rehearsal.', clue: 'Read the cue card on the easel by the cameras.', source: { name: 'Saturday Night Live, Wikipedia', url: SNL } }, { r: 1.4 });
    // the works: the set walls (home base flanks, the band and guest stage backdrops), the studio side walls, the lobby
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) mounts.push({ position: v(HX + s * 5.5, 5.2, HZ - 2.45), rotation: 0, target: v(HX + s * 4, 3, HZ + 8), width: 2.4, height: 2.6, style: 'black', wash: true });
    for (let i = 0; i < 3; i++) { const x = -20 + i * 4; k.box(3.6, 3.0, 0.3, x, 3.6, HZ - 2.4, brick); mounts.push({ position: v(x, 3.6, HZ - 2.2), rotation: 0, target: v(x, 2, HZ + 8), width: 3.2, height: 2.4, style: 'black', wash: true }); }
    for (let i = 0; i < 3; i++) { const x = 12 + i * 4; k.box(3.6, 3.0, 0.3, x, 3.6, HZ - 2.4, black); mounts.push({ position: v(x, 3.6, HZ - 2.2), rotation: 0, target: v(x, 2, HZ + 8), width: 3.2, height: 2.4, style: 'neon', wash: false }); }
    /* 2026-11-24: the first of these stood its viewer inside the guest stage; they start past it now */
    for (let i = 0; i < 4; i++) { const z = HZ + 8 + i * 5; mounts.push({ position: v(SW / 2 - 0.34, 4.0, z), rotation: -PI / 2, target: v(SW / 2 - 6, 3, z), width: 4.4, height: 2.6, style: 'steel', wash: true }); }
    /* the lobby's back wall: between the elevators now, not hung over their doors */
    for (const x of [-12.6, -4.5, 4.5, 12.6]) mounts.push({ position: v(x, 4.0, SZ + 0.26), rotation: 0, target: v(x, 3, SZ + 8), width: 3.4, height: 2.1, style: 'gilt', wash: true });
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const z = LZ - 6 - i * 10; mounts.push({ position: v(s * (LW / 2 - 0.34), 4.0, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 3, z), width: 4.4, height: 2.6, style: 'gilt', wash: true }); }
    return { mounts, spawn: v(0, 3, LZ + 12), look: v(0, 6, LZ - 12), eye: 3, bounds: [-SW / 2 + 1, SW / 2 - 1, SZ - SD + 1, LZ + 28], style: 'black', floorY: (x, z) => { if (z > BZ - 0.8 && z < BZ + ROWS * 1.6 - 0.8 && Math.abs(x) < 15.2) return Math.min(0.6 * ROWS, Math.floor((z - BZ + 0.8) / 1.6 + 1) * 0.6); return 0; } };
  },
};

/* ---------------- 63 CARNEGIE HALL ---------------- */
export const carnegie: RoomDef = {
  id: 'carnegie',
  name: 'The horseshoe',
  area: 'CARNEGIE HALL',
  mood: 'Concert black',
  color: '#c8a070',
  description: 'Fifty seventh Street, the Italianate brick front, then the hall: five curved tiers in cream and gold around the stage, the works in the boxes, practice, practice, practice.',
  signatures: 'The brown brick and terracotta facade with its arched windows, the cream and gold horseshoe auditorium with five levels curving to the stage, the red seats, the plain proscenium and the organ grille, the dressing room corridor.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x141a2e, horizon: 0x4a4050, ground: 0x0e0e12, fog: 0.003, stars: 140, env: 0.55 });
    k.hemi(0xffe4c8, 0x1a1418, 0.45);
    const brick = k.pbr('chBrick', X.brick(0x6a4436, 168), 0.28),
      terra = k.pbr('chTerra', X.ashlar(0xb89a7a, 169, 3), 0.2),
      cream = k.pbr('chCream', X.plaster(0xe8dcc8, 81), 0.35),
      gold = k.pbr('chGold', X.gilt(0xd0a852), 2, { metalness: 0.85, roughness: 0.3 }),
      red = k.pbr('chSeats', X.velvet(0x9a1a22), 0.4, { roughness: 0.95 }),
      carpet = k.pbr('chCarpet', X.carpet(0x6a1a22, 0xc79a4a), 0.5),
      stage = k.pbr('chStage', X.planks(0xb89a6a, 6, 170), 1.2, { roughness: 0.6 }),
      dark = k.flat(0x121216, 0.5, 0.7),
      glass = k.glass(0xffe0b0, 0.3, 0.1),
      warm = k.glow(0xffe0b0);
    // 57th Street and the corner facade
    street(k, { w: 22, len: 140, z: 30, x: 0 });
    blockFront(k, { x: -40, z0: 90, count: 8, face: 1, seed: 171, h: [18, 34] });
    const FZ = 8;
    k.box(60, 30, 60, 0, 15, FZ - 30, brick);
    for (let t = 0; t < 3; t++) for (let i = 0; i < 7; i++) { const x = -24 + i * 8, y = 6 + t * 8; k.arch(3, 5.6, 1.2, x, y - 2.8, FZ + 0.3, terra, false, 0.75); k.box(2.6, 4.8, 0.1, x, y - 0.4, FZ + 0.4, glass); }
    k.moulding([[0, 0], [0.9, 0], [1.0, 0.3], [0.6, 0.5], [0.8, 0.8], [0, 1.0]], 60.4, 0, 29, FZ + 0.05, terra, 0);
    k.box(12, 26, 12, 30, 43, FZ - 6, brick);
    for (let i = 0; i < 3; i++) k.arch(2.8, 6, 3, 0, 0, FZ - 1, terra, false, 0.85), k.arch(2.8, 6, 3, -8 + i * 8, 0, FZ - 1, terra, false, 0.85);
    k.block(-30, -9.4, FZ - 1.5, FZ + 1.5); k.block(-6.6, -1.4, FZ - 1.5, FZ + 1.5); k.block(1.4, 6.6, FZ - 1.5, FZ + 1.5); k.block(9.4, 30, FZ - 1.5, FZ + 1.5);
    k.box(24, 1.6, 6, 0, 8, FZ + 2.6, dark);
    k.sign('CARNEGIE HALL', 10, 1.2, 0, 8, FZ + 5.62, '#14090a', '#f4e4b0', 130, 0, { border: true });
    for (let i = 0; i < 6; i++) k.point(-10 + i * 4, 7, FZ + 4, 0xffe0b0, 10, 8);
    // the hall: a horseshoe of five tiers around the parquet, the stage at the far end
    const CZ = FZ - 30, R = 22;
    k.box(70, 0.3, 66, 0, 0.15, CZ - 2, carpet);
    k.mesh(new T.CylinderGeometry(R + 4, R + 4, 30, 48, 1, true, 0, PI), cream, 0, 15, CZ);
    k.box(2 * (R + 4), 30, 0.6, 0, 15, CZ - R - 3.5, cream);
    for (const s of [-1, 1]) { k.box(0.6, 30, R + 4, s * (R + 4), 15, CZ - (R + 4) / 2 - 1, cream); k.block(s * (R + 4) - 0.6, s * (R + 4) + 0.6, CZ - R - 4, CZ); }
    k.block(-R - 4, R + 4, CZ - R - 4, CZ - R - 3);
    k.mesh(new T.CylinderGeometry(R + 5, R + 5, 0.6, 48, 1, false, 0, PI), dark, 0, 30, CZ);
    k.box(2 * (R + 5), 0.6, R + 6, 0, 30, CZ - (R + 6) / 2, dark);
    for (let tier = 0; tier < 5; tier++) {
      const y = 4.5 + tier * 4.6, rr = R - 1 - tier * 0.4;
      const ring = k.mesh(new T.RingGeometry(rr - 3.4, rr, 48, 1, 0, PI), tier % 2 ? cream : gold, 0, y, CZ); ring.rotation.x = -PI / 2;
      const front = k.mesh(new T.CylinderGeometry(rr - 3.4, rr - 3.4, 1.1, 48, 1, true, 0, PI), gold, 0, y + 0.55, CZ);
      void front;
      for (const s of [-1, 1]) { k.box(3.4, 0.3, R + 2, s * (rr - 1.7), y, CZ - (R + 2) / 2, tier % 2 ? cream : gold); k.box(0.3, 1.1, R + 2, s * (rr - 3.4), y + 0.55, CZ - (R + 2) / 2, gold); }
      for (let i = 0; i < 12; i++) { const a = (i / 11) * PI; k.point(Math.cos(a) * (rr - 2), y + 3, CZ + Math.sin(a) * (rr - 2) * 0, 0xffe6c0, 5, 5); }
      for (let i = 0; i < 24; i++) { const a = ((i + 0.5) / 24) * PI; k.box(0.5, 0.5, 0.5, Math.cos(a) * (rr - 1.7), y + 0.45, CZ + Math.sin(a) * (rr - 1.7), red).rotation.y = -a; }
    }
    const seatG = new T.BoxGeometry(0.5, 0.55, 0.5); seatG.translate(0, 0.28, 0);
    const seats: T.Matrix4[] = [];
    for (let r = 0; r < 14; r++) { const z = CZ - 20 + r * 1.6; const half = 8 + Math.min(8, r); for (let x = -half; x <= half; x += 0.65) { if (Math.abs(x) < 1) continue; seats.push(new T.Matrix4().compose(v(x, 0.3 + r * 0.1, z), new T.Quaternion(), v(1, 1, 1))); } k.box(2 * half + 1, 0.2, 1.6, 0, 0.2 + r * 0.1, z, carpet); }
    k.instances(seatG, red, seats);
    k.block(-18, -1, CZ - 21, CZ + 2); k.block(1, 18, CZ - 21, CZ + 2);
    const SZ = CZ - R;
    k.box(26, 1.4, 12, 0, 0.7, SZ + 3, stage);
    k.box(2 * (R + 3), 10, 0.6, 0, 25, SZ - 3, cream);
    k.box(30, 26, 0.6, 0, 13, SZ - 3.02, gold);
    for (let i = 0; i < 24; i++) k.cyl(0.14, 6 + Math.abs(12 - i) * 0.3, -11.5 + i, 18, SZ - 2.6, k.flat(0xb8a878, 0.8, 0.35), 0.12, 8);
    for (let i = 0; i < 9; i++) { k.cyl(0.06, 1.1, -8 + i * 2, 1.95, SZ + 3 + (i % 2) * 1.2, dark, 0.06, 6); k.box(0.8, 0.5, 0.05, -8 + i * 2, 2.6, SZ + 3 + (i % 2) * 1.2, dark).rotation.x = -0.3; }
    k.cyl(0.3, 0.3, 0, 1.55, SZ + 7, dark, 0.3, 12); k.box(1.0, 0.8, 0.05, 0, 2.2, SZ + 7.2, dark).rotation.x = -0.4;
    k.keepOut.push({ x: 0, z: SZ + 5, r: 12 });
    for (let i = 0; i < 6; i++) k.spot(-10 + i * 4, 26, SZ + 12, -10 + i * 4, 1.4, SZ + 4, 0xfff0d8, 140, 0.4, 0.6, 40);
    k.point(0, 26, CZ - 8, 0xffe6c0, 120, 60);
    k.censusWall({ x: 0, y: 14, z: SZ - 2.7, rotY: 0, cols: 26, rows: 8, tile: 0.55, gap: 0.05, start: ctx.wallStart(7100, 208), pieces: ctx.all, backing: gold });
    k.crowd([v(-12, 0.3, CZ - 18), v(12, 0.3, CZ - 18)], 6, { seed: 63, speed: 0.2, spread: 2, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0x1a1a1a] });
    // the works: the box fronts of the first two tiers, the stage flanks, the corridor behind the parquet, the lobby
    const mounts: Mount[] = [];
    for (let tier = 0; tier < 2; tier++) { const y = 4.5 + tier * 4.6, rr = R - 1 - tier * 0.4; for (let i = 0; i < 5; i++) { const a = ((i + 0.5) / 5) * PI; const x = Math.cos(a) * (rr - 3.6), z = CZ + Math.sin(a) * (rr - 3.6); mounts.push({ position: v(x, y + 0.6, z), rotation: -a + PI / 2 + PI, target: v(0, 2, CZ - 6), width: 2.6, height: 0.9, style: 'gilt', wash: false }); } }
    for (const s of [-1, 1]) mounts.push({ position: v(s * 14.5, 6, SZ - 2.7), rotation: 0, target: v(s * 8, 3, SZ + 10), width: 5, height: 5.6, style: 'gilt', wash: true });
    for (let i = 0; i < 4; i++) { const x = -12 + i * 8; mounts.push({ position: v(x, 3.4, CZ + 2.6), rotation: PI, target: v(x, 2, CZ - 6), width: 4.2, height: 2.5, style: 'gilt', wash: true }); }
    k.box(70, 6, 0.6, 0, 3, CZ + 3, cream); k.block(-35, -1.6, CZ + 2.5, CZ + 3.5); k.block(1.6, 35, CZ + 2.5, CZ + 3.5);
    for (let i = 0; i < 4; i++) { const x = -18 + i * 12; mounts.push({ position: v(x, 3.4, FZ - 3.4), rotation: PI, target: v(x, 2, FZ - 12), width: 4.2, height: 2.5, style: 'gilt', wash: true }); }
    k.box(70, 6, 0.6, 0, 3, FZ - 3, cream); k.block(-35, -1.6, FZ - 3.5, FZ - 2.5); k.block(1.6, 35, FZ - 3.5, FZ - 2.5);
    return { mounts, spawn: v(-8, 3, FZ + 26), look: v(0, 10, FZ), eye: 3, bounds: [-30, 30, SZ + 6, FZ + 32], style: 'gilt', floorY: (x, z) => { void x; if (z > CZ - 21 && z < CZ + 2) return Math.max(0, Math.min(1.3, (z - (CZ - 21)) / 1.6 * 0.1)); return 0; } };
  },
};

/* ---------------- 64 THE VILLAGE VANGUARD ---------------- */
export const vanguard: RoomDef = {
  id: 'vanguard',
  name: 'The wedge downstairs',
  area: 'THE VILLAGE VANGUARD',
  mood: 'Second set',
  color: '#c83a3a',
  description: 'The red awning on Seventh Avenue South, the narrow stair down, the triangular room: fourteen feet of stage, the piano, the drums, the photographs, the works between them.',
  signatures: 'The red canopy and the steep staircase, the wedge shaped basement with the stage in the point, the red walls hung with photographs of the players, the tiny round tables and bentwood chairs, the kitchen door that never opens.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x101426, horizon: 0x3a3048, ground: 0x0a0a0e, fog: 0.004, stars: 100, env: 0.5 });
    k.hemi(0xffd8c0, 0x14100c, 0.35);
    /* 2026-11-24 (wave 4a): scanned red plaster on the walls (Poly Haven red_plaster_weathered, CC0), old boards on the floor,
       dark wood on the stair and the bandstand */
    const redW = scn(k, 'vanguard', 'red_plaster_weathered', 2.2, () => X.plaster(0x8a1a1e, 82), { color: 0xd89a92, roughness: 0.9 }, 0x4a1214),
      redC = k.flat(0xb8202a, 0.1, 0.7),
      floorW = scn(k, 'vanguard', 'old_wooden_floor_02', 2.4, () => X.planks(0x3a2a1c, 5, 172, 0.4), { color: 0x9a8070 }, 0x2a1e14),
      dark = k.flat(0x111216, 0.5, 0.7),
      black = k.flat(0x0a0a0c, 0.3, 0.8),
      gloss = k.flat(0x08080a, 0.25, 0.14),
      brass = k.pbr('vvBrass', X.gilt(0xc9a55a), 2, { metalness: 0.85, roughness: 0.3 }),
      wood = scn(k, 'vanguard', 'dark_wood', 1.6, () => X.planks(0x5a3a26, 4, 173), { color: 0xa08068 }, 0x2a1a10),
      white = k.flat(0xf4f0e8, 0, 0.8),
      warm = k.glow(0xffd8a0),
      glass = k.glass(0xffe0b0, 0.3, 0.1);
    // Seventh Avenue South at night, the low buildings, the awning and the stair
    street(k, { w: 22, len: 140, z: 40, x: 0 });
    blockFront(k, { x: -12, z0: 100, count: 14, face: 1, seed: 174, h: [10, 18] });
    blockFront(k, { x: 12, z0: 100, count: 14, face: -1, seed: 175, h: [10, 16] });
    for (const z of [80, 40, 0]) for (const s of [-1, 1]) k.lamp(s * 11.6, z, 6.2, dark, 0xffd9a8, 26);
    const AX = -12.5, AZ = 20;
    /* the red canopy on its two brass poles, with a scalloped valance */
    const aw = k.box(3.6, 0.14, 3.0, AX + 1.8, 3.6, AZ - 1.2, redC); aw.rotation.z = 0.12;
    for (let dz = -1.35; dz <= 1.36; dz += 0.3) { const sc = k.mesh(new T.CylinderGeometry(0.15, 0.15, 0.04, 10, 1, false, 0, PI), redC, AX + 3.62, 3.1, AZ - 1.2 + dz, true); sc.rotation.set(PI / 2, 0, PI / 2); }
    k.box(0.04, 0.5, 3.0, AX + 3.62, 3.28, AZ - 1.2, redC);
    for (const dz of [-1.4, 1.4]) k.box(0.06, 3.3, 0.06, AX + 3.6, 1.65, AZ - 1.2 + dz, brass);
    k.sign('VILLAGE VANGUARD', 2.9, 0.42, AX + 3.66, 3.28, AZ - 1.2, '#b8202a', '#f4f0e8', 56, PI / 2, { border: false });
    k.sign('VILLAGE VANGUARD', 4.6, 0.7, -11.9, 5.4, AZ - 1.2, '#b8202a', '#f4f0e8', 70, PI / 2, { border: true });
    hsign(k, 'TONIGHT  TWO SETS  8:30  10:30', 2.2, 0.34, -11.92, 2.1, AZ + 1.4, PI / 2, { fg: '#f4f0e8', bg: '#1a1416', font: 'W2 JetBrains Mono', size: 0.5, lit: false });
    k.point(AX + 2, 3.2, AZ, 0xff8a6a, 16, 8);
    // the stair down: a straight flight from the sidewalk into the ground, walled in red
    /* fifteen steps down, the count every guide gives for the Vanguard stair */
    const SY = -5.2, STEPS = 15;
    for (let i = 0; i < STEPS; i++) k.box(1.6, 0.34, 0.7, AX + 1.2, -0.17 - i * (5.2 / STEPS) * 1, AZ - 1 - i * 0.7, wood);
    k.box(1.6, 0.3, 3.4, AX + 1.2, SY - 0.15, AZ - 12.3, wood);
    for (const s of [-1, 1]) k.box(0.3, 8, 13, AX + 1.2 + s * 1.0, -2, AZ - 6.5, redW);
    for (const s of [-1, 1]) k.beam(v(AX + 1.2 + s * 0.78, 0.8, AZ - 1), v(AX + 1.2 + s * 0.78, SY + 0.8 + 0.3, AZ - 11), 0.025, brass, 6);
    k.box(2.3, 0.3, 13, AX + 1.2, 2.6, AZ - 6.5, dark);
    k.block(AX - 0.2, AX + 0.1, AZ - 14, AZ + 0.5); k.block(AX + 2.3, AX + 2.6, AZ - 14, AZ + 0.5);
    k.box(60, 0.4, 40, AX, -0.2, AZ - 20, dark);
    // the wedge: a triangle in plan, stage in the point, tables on the floor, the kitchen door
    const P0 = v(AX + 1.2, SY, AZ - 14), P1 = v(AX - 10, SY, AZ - 40), P2 = v(AX + 16, SY, AZ - 40);
    const tri = new T.Shape(); tri.moveTo(P0.x, -P0.z); tri.lineTo(P1.x, -P1.z); tri.lineTo(P2.x, -P2.z); tri.closePath();
    const fg = new T.ExtrudeGeometry(tri, { depth: 0.3, bevelEnabled: false }); fg.rotateX(-PI / 2); k.mesh(fg, floorW, 0, SY - 0.3, 0);
    const cg = new T.ExtrudeGeometry(tri, { depth: 0.3, bevelEnabled: false }); cg.rotateX(-PI / 2); k.mesh(cg, dark, 0, SY + 3.4, 0);
    const wallAlong = (a: T.Vector3, b: T.Vector3) => { const len = a.distanceTo(b), m = a.clone().lerp(b, 0.5); const w = k.box(0.4, 3.6, len, m.x, SY + 1.8, m.z, redW); w.rotation.y = Math.atan2(b.x - a.x, b.z - a.z); for (let t = 0.1; t < 0.95; t += 0.1) { const p = a.clone().lerp(b, t); k.keepOut.push({ x: p.x, z: p.z, r: 0.9 }); } return w; };
    wallAlong(P0, P1); wallAlong(P0, P2); wallAlong(P1, P2);
    /* a black skirting and a dark picture rail round the red, and three dark beams across the low ceiling */
    for (const [a, b] of [[P0, P1], [P0, P2], [P1, P2]] as const) { const len = a.distanceTo(b), m = a.clone().lerp(b, 0.5), ang = Math.atan2(b.x - a.x, b.z - a.z); for (const [y, h] of [[SY + 0.12, 0.24], [SY + 2.62, 0.06]]) { const o = k.box(0.48, h, len - 0.8, m.x, y, m.z, black); o.rotation.y = ang; } }
    for (let i = 1; i <= 3; i++) { const z = P0.z - i * 6.5, t = (P0.z - z) / (P0.z - P1.z); const xa = P0.x + (P1.x - P0.x) * t, xb = P0.x + (P2.x - P0.x) * t; k.box(xb - xa, 0.3, 0.36, (xa + xb) / 2, SY + 3.25, z, wood); }
    k.block(P1.x - 1, P2.x + 1, P1.z - 1, P1.z + 0.3);
    k.box(6, 0.5, 4, AX + 3, SY + 0.25, AZ - 37.5, wood);
    k.block(AX, AX + 6, AZ - 39.5, AZ - 35.5);
    /* the bandstand: a grand piano with its lid up, a drum kit, a bass on its side; code built until a CC0 model exists
       (queued in FIREFLY_QUEUE.md as 3D). The old boxes and brass cans are gone. */
    const ST = SY + 0.5;
    {
      const g = new T.Group(); g.position.set(AX + 0.6, ST, AZ - 38.8); g.rotation.y = -0.35; k.add(g);
      const plan = new T.Shape(); plan.moveTo(0, 0); plan.lineTo(1.48, 0); plan.lineTo(1.48, 0.42); plan.bezierCurveTo(1.48, 1.1, 0.7, 0.95, 0.5, 1.95); plan.lineTo(0.0, 1.95); plan.closePath();
      const caseG = new T.ExtrudeGeometry(plan, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2 }); caseG.rotateX(PI / 2); caseG.translate(-0.74, 0.98, -0.2);
      g.add(new T.Mesh(caseG, gloss));
      const lidG = new T.ExtrudeGeometry(plan, { depth: 0.025, bevelEnabled: false }); lidG.rotateX(PI / 2);
      const lid = new T.Mesh(lidG, gloss); const hinge = new T.Group(); hinge.position.set(-0.74, 1.0, -0.2); hinge.rotation.z = 0.62; hinge.add(lid); g.add(hinge);
      const stick = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.85, 5), gloss); stick.position.set(0.25, 1.3, 0.75); stick.rotation.z = -0.5; g.add(stick);
      for (const [lx, lz] of [[-0.6, 0.05], [0.6, 0.05], [-0.4, 1.6]]) { const leg = new T.Mesh(new T.CylinderGeometry(0.05, 0.04, 0.68, 8), gloss); leg.position.set(lx, 0.34, lz); g.add(leg); }
      const keys = new T.Mesh(new T.BoxGeometry(1.4, 0.04, 0.2), white); keys.position.set(0, 0.72, -0.3); g.add(keys);
      for (let i = 0; i < 36; i++) { if ([1, 4, 8, 11, 15, 18, 22, 25, 29, 32].includes(i % 36) || i % 7 === 2 || i % 7 === 6) continue; const bk = new T.Mesh(new T.BoxGeometry(0.022, 0.03, 0.12), gloss); bk.position.set(-0.68 + i * 0.039, 0.75, -0.34); g.add(bk); }
      const cheek = new T.Mesh(new T.BoxGeometry(1.52, 0.12, 0.3), gloss); cheek.position.set(0, 0.68, -0.3); g.add(cheek);
      const desk = new T.Mesh(new T.BoxGeometry(0.8, 0.26, 0.02), gloss); desk.position.set(0, 1.05, -0.05); desk.rotation.x = -0.25; g.add(desk);
      const bench = new T.Mesh(new T.BoxGeometry(0.8, 0.48, 0.36), gloss); bench.position.set(0, 0.24, -0.85); g.add(bench);
    }
    {
      const g = new T.Group(); g.position.set(AX + 5.0, ST, AZ - 38.2); g.rotation.y = 0.3; k.add(g);
      const shell = k.flat(0x6a1a1e, 0.3, 0.35), head = k.flat(0xe8e2d4, 0, 0.6), chrome = k.flat(0xc8ccd0, 1, 0.22), bronzeC = k.flat(0xb8893a, 1, 0.3);
      const drum = (r: number, d: number, x: number, y: number, z: number, side = false) => { const s = new T.Mesh(new T.CylinderGeometry(r, r, d, 20), shell); const h1 = new T.Mesh(new T.CylinderGeometry(r * 0.98, r * 0.98, d + 0.01, 20), head); h1.scale.set(1, 1.0, 1); const o = new T.Group(); o.add(s); o.position.set(x, y, z); if (side) o.rotation.x = PI / 2; const ring = new T.Mesh(new T.TorusGeometry(r, 0.012, 4, 20), chrome); ring.rotation.x = PI / 2; ring.position.y = d / 2; o.add(ring, h1); g.add(o); h1.visible = false; const top = new T.Mesh(new T.CircleGeometry(r * 0.97, 20), head); top.rotation.x = -PI / 2; top.position.y = d / 2 + 0.002; o.add(top); return o; };
      drum(0.28, 0.36, 0, 0.29, 0, true);
      drum(0.14, 0.12, -0.4, 0.62, -0.25);
      drum(0.12, 0.2, -0.12, 0.78, -0.08).rotation.x = -0.3;
      drum(0.12, 0.2, 0.18, 0.78, -0.08).rotation.x = -0.3;
      drum(0.19, 0.38, 0.55, 0.36, -0.3);
      for (const [x, y, z, r] of [[-0.62, 1.15, -0.05, 0.2], [0.55, 1.25, 0.05, 0.25], [-0.7, 0.86, -0.4, 0.17]]) { const st = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, y, 5), chrome); st.position.set(x, y / 2, z); g.add(st); const cy = new T.Mesh(new T.CylinderGeometry(r, r * 0.9, 0.012, 20), bronzeC); cy.position.set(x, y, z); cy.rotation.z = 0.12; g.add(cy); }
      const stool = new T.Mesh(new T.CylinderGeometry(0.17, 0.17, 0.55, 12), black); stool.position.set(0, 0.28, -0.75); g.add(stool);
    }
    {
      const g = new T.Group(); g.position.set(AX + 7.6, ST, AZ - 37.0); g.rotation.set(0, -0.5, 0.18); k.add(g);
      const body = new T.Mesh(new T.SphereGeometry(0.36, 16, 12), k.flat(0x5a2e16, 0.1, 0.35)); body.scale.set(1, 1.45, 0.42); body.position.y = 0.6; g.add(body);
      const neck = new T.Mesh(new T.BoxGeometry(0.07, 1.05, 0.05), black); neck.position.y = 1.5; g.add(neck);
      const pin = new T.Mesh(new T.CylinderGeometry(0.01, 0.01, 0.2, 4), k.flat(0xc8ccd0, 1, 0.3)); pin.position.y = 0.1; g.add(pin);
    }
    k.cyl(0.05, 1.6, AX + 3, SY + 1.3, AZ - 36, dark, 0.05, 6); k.cyl(0.08, 0.2, AX + 3, SY + 2.15, AZ - 36, black, 0.08, 8);
    k.spot(AX + 3, SY + 3.2, AZ - 30, AX + 3, SY + 0.5, AZ - 37, 0xffd8a0, 80, 0.5, 0.7, 14);
    k.spot(AX + 8, SY + 3.2, AZ - 31, AX + 1, SY + 0.8, AZ - 38.5, 0xffc890, 50, 0.4, 0.7, 14);
    /* the tables: small round tops on one leg (Poly Haven round_wooden_table_01, CC0), cane chairs (gallinera_chair, CC0),
       a candle on each. The white tops bloomed under their own lamps; the wood does not. */
    const rnd = X.mulberry(64);
    const tables: number[][] = [], chairs: number[][] = [];
    for (let i = 0; i < 14; i++) { const t = 0.25 + (i % 4) * 0.2, u = 0.2 + Math.floor(i / 4) * 0.22; const p = P0.clone().lerp(P1.clone().lerp(P2, t), u); tables.push([p.x, SY, p.z, rnd() * PI]); k.cyl(0.025, 0.08, p.x, SY + 0.77, p.z, k.flat(0x2a2a2a, 0.2, 0.3), 0.04, 8); k.cyl(0.012, 0.03, p.x, SY + 0.83, p.z, warm, 0.006, 6); k.point(p.x, SY + 1.0, p.z, 0xffc890, 1.2, 2.2); k.keepOut.push({ x: p.x, z: p.z, r: 0.6 }); for (let c = 0; c < 2; c++) { const a = rnd() * PI * 2; chairs.push([p.x + Math.cos(a) * 0.68, SY, p.z + Math.sin(a) * 0.68, Math.atan2(-Math.cos(a), -Math.sin(a))]); } }
    many(k, 'vanguard/ph_round_wooden_table_01', { height: 0.74 }, tables, (h) => h.scale.multiplyScalar(1));
    many(k, 'vanguard/ph_gallinera_chair', { height: 0.88 }, chairs);
    /* a caged lamp over each table row, hung from the beams */
    many(k, 'vanguard/ph_caged_hanging_light', { width: 0.5 }, [0, 1, 2].map((i) => { const z = P0.z - (i + 1) * 6.5 + 0.6; return [AX + 1.6, SY + 2.72, z, 0]; }));
    k.box(1.0, 2.4, 0.1, AX + 13, SY + 1.2, AZ - 39.7, k.flat(0x8a6a48, 0, 0.7)); k.box(0.3, 0.3, 0.02, AX + 13.2, SY + 1.6, AZ - 39.64, glass);
    hsign(k, 'KITCHEN', 0.9, 0.2, AX + 13, SY + 2.55, AZ - 39.6, 0, { fg: '#f4f0e8', bg: '#1a1416', font: 'W2 Archivo Expanded', size: 0.55, lit: false });
    k.point(AX + 2, SY + 3, AZ - 22, 0xff9a70, 10, 10);
    k.point(AX - 2, SY + 3, AZ - 32, 0xff9a70, 10, 10);
    k.crowd([v(AX + 1.2, SY, AZ - 16), v(AX + 4, SY, AZ - 26), v(AX + 8, SY, AZ - 34)], 4, { seed: 64, speed: 0.2, spread: 1, animate: !ctx.reduced, colors: [0x151517, 0x24262c] });
    k.censusWall({ x: AX + 1.2, y: 1.6, z: AZ - 13.8, rotY: 0, cols: 6, rows: 3, tile: 0.4, gap: 0.04, start: ctx.wallStart(6400, 18), pieces: ctx.all, backing: dark });
    /* the illusion: a Pepper's ghost. A horn player stands on the empty end of the bandstand as a faint blue figure, the way
       the stage ghost is a lit figure reflected in angled glass. He is there from the foot of the stair and fades away as
       you walk up to the stand. */
    {
      const ghost = new T.Group(); ghost.position.set(AX + 3.2, ST, AZ - 38.6); ghost.rotation.y = 0.15; k.add(ghost);
      const gm = new T.MeshBasicMaterial({ color: 0x7fa8d8, transparent: true, opacity: 0.4, depthWrite: false, blending: T.AdditiveBlending, fog: false });
      const add = (geo: T.BufferGeometry, x: number, y: number, z: number, rx = 0, rz = 0) => { const o = new T.Mesh(geo, gm); o.position.set(x, y, z); o.rotation.set(rx, 0, rz); ghost.add(o); };
      add(new T.CapsuleGeometry(0.2, 0.75, 4, 10), 0, 0.98, 0);
      for (const dx of [-0.1, 0.1]) add(new T.CapsuleGeometry(0.075, 0.7, 3, 8), dx, 0.4, 0);
      add(new T.SphereGeometry(0.13, 12, 10), 0, 1.68, 0.02);
      add(new T.CylinderGeometry(0.13, 0.1, 0.05, 12), 0, 1.82, 0.02);
      add(new T.TorusGeometry(0.16, 0.035, 6, 14, PI * 1.2), 0.12, 1.0, 0.22, 0, -0.4);
      add(new T.CylinderGeometry(0.02, 0.06, 0.62, 8), 0.24, 1.32, 0.24, 0, 0.5);
      add(new T.CylinderGeometry(0.11, 0.035, 0.16, 12), 0.04, 0.82, 0.3, PI / 2.4, 0);
      for (const s of [-1, 1]) add(new T.CapsuleGeometry(0.05, 0.42, 3, 6), s * 0.2, 1.18, 0.16, -0.9, s * 0.3);
      if (HAS_DOM4) k.ticks.push((t) => { const cam = (window as unknown as { __museum?: { camera?: T.Camera } }).__museum?.camera; if (!cam) return; const d = Math.hypot(cam.position.x - ghost.position.x, cam.position.z - ghost.position.z); const o = 0.42 * Math.max(0, Math.min(1, (d - 4.5) / 9)) * (0.85 + 0.15 * Math.sin(t * 2.2)); gm.opacity = o; ghost.visible = o > 0.004; });
    }
    const VW = 'https://en.wikipedia.org/wiki/Village_Vanguard';
    k.egg(v(AX + 3.2, SY + 1.4, AZ - 38.6), { id: 'vanguard-ghost', title: 'The man who is not there', text: 'The horn player at the end of the bandstand is a ghost: a faint figure that is there from the foot of the stair and thins to nothing as you walk up to him. It is the effect John Henry Pepper made famous on the London stage in 1862, a lit figure shown to the audience as a reflection in a sheet of angled glass, so he seems to stand in the room with the players.', clue: 'Look at the bandstand from the bottom of the stair, then walk toward it.', source: { name: 'Pepper\'s ghost, Wikipedia', url: 'https://en.wikipedia.org/wiki/Pepper%27s_ghost' } }, { r: 1.0 });
    k.egg(v(AX + 1.2, 0.8, AZ + 0.3), { id: 'vanguard-stairs', title: 'A staircase and a chute', text: 'You reach the room by walking fifteen steps down what Steinway\'s writer called a cross between a staircase and a chute. The room officially seats one hundred twenty three people.', clue: 'Count the steps on the way down.', source: { name: 'Village Vanguard, Steinway and Sons', url: 'https://www.steinway.com/news/features/village-vanguard' } }, { r: 0.8 });
    k.egg(v(AX + 1.2, SY + 3.0, AZ - 15), { id: 'vanguard-triangle', title: 'The Golden Triangle', year: '1935', text: 'Max Gordon moved here from Charles Street after being refused a cabaret licence, into a speakeasy basement called the Golden Triangle, shaped like an isosceles triangle. He wanted two johns, two exits, and rent under $100 a month. The club opened on February 22, 1935, with poetry and folk music; jazz took top billing only in 1957.', clue: 'Stand at the foot of the stair and look at the shape of the room.', source: { name: 'Village Vanguard, Wikipedia', url: VW } }, { r: 0.8 });
    k.egg(v(AX + 0.6, SY + 1.4, AZ - 38.8), { id: 'vanguard-monk', title: 'Nobody came', year: '1948', text: 'Thelonious Monk opened at the Vanguard on September 14, 1948, and by the club\'s own history nobody came.', clue: 'Find the piano on the stand.', source: { name: 'Village Vanguard, Wikipedia', url: VW } }, { r: 0.8 });
    k.egg(v(AX + 5, SY + 1.2, AZ - 38.2), { id: 'vanguard-live', title: 'Live at the Village Vanguard', year: '1957', text: 'Sonny Rollins cut three LPs here on November 3, 1957. In 1961 John Coltrane recorded 22 songs over four nights, released as five titles, and Bill Evans recorded his trio the same year. Blue Note\'s Bruce Lundvall said the words Live at the Village Vanguard on a cover help a record sell.', clue: 'Look at the drum kit on the stand.', source: { name: 'Village Vanguard, Wikipedia', url: VW } }, { r: 0.8 });
    k.egg(v(AX + 3, SY + 2.15, AZ - 36), { id: 'vanguard-monday', title: 'Monday nights', year: '1966', text: 'The Thad Jones and Mel Lewis Orchestra played its first night at the club on Monday, February 7, 1966, and the tape of it came out as the album Opening Night. That evening began a fifty year tradition of Monday nights for the big band, which later became the Mel Lewis Jazz Orchestra and then the Vanguard Jazz Orchestra.', clue: 'Look at the microphone at the front of the stand.', source: { name: 'Opening Night (album), Wikipedia', url: 'https://en.wikipedia.org/wiki/Opening_Night_(album)' } }, { r: 0.5 });
    k.egg(v(AX + 2, 3.0, AZ - 1.2), { id: 'vanguard-lorraine', title: 'Closed for one day', year: '1989', text: 'Max Gordon died on May 11, 1989. His wife Lorraine Gordon closed the club for one day, reopened it the next, and ran it until her death on June 9, 2018, at 95.', clue: 'Look under the awning on Seventh Avenue South.', source: { name: 'Village Vanguard, Wikipedia', url: VW } }, { r: 1.2 });
    // the works: along both long red walls where the photographs hang, small and close, plus the back wall and the stair
    /* 2026-11-24: the long wall works faced out of the room, through the red plaster; they face in now, on the room side */
    const mounts: Mount[] = [];
    const photos: number[][] = [];
    for (const [a, b, sgn] of [[P0, P1, 1], [P0, P2, -1]] as const) { const ang = Math.atan2(b.x - a.x, b.z - a.z); const nx = -Math.cos(ang) * sgn, nz = Math.sin(ang) * sgn; for (let i = 0; i < 7; i++) { const t = 0.12 + i * 0.12; const p = a.clone().lerp(b, t); mounts.push({ position: v(p.x + nx * 0.24, SY + 1.7, p.z + nz * 0.24), rotation: ang + (sgn > 0 ? -PI / 2 : PI / 2), target: (() => { for (const d of [3.4, 2.6, 4.2, 2.0, 4.8]) { const tx = p.x + nx * d, tz = p.z + nz * d; if (tables.every(([qx, , qz]) => Math.hypot(tx - qx, tz - qz) > 0.8)) return v(tx, SY + 1.5, tz); } return v(p.x + nx * 3.4, SY + 1.5, p.z + nz * 3.4); })(), width: 1.3, height: 1.0, style: 'black', wash: false }); for (const [dt, y] of [[0, 2.72], [0.06, 2.0], [0.06, 2.75]]) { const q = a.clone().lerp(b, t + dt); photos.push([q.x + nx * 0.22, SY + y - 0.25, q.z + nz * 0.22, ang + (sgn > 0 ? -PI / 2 : PI / 2)]); } } }
    /* the photographs of the players in black frames between and over the works (Poly Haven hanging_picture_frame, CC0) */
    many(k, 'vanguard/ph_hanging_picture_frame_01', { height: 0.5 }, photos.filter((_, i) => i % 2 === 0).map(([x, y, z, r]) => [x, y, z, r + PI]));   // this frame's face is its -z side
    many(k, 'vanguard/ph_hanging_picture_frame_03', { height: 0.42 }, photos.filter((_, i) => i % 2 === 1));
    for (const x of [-19, -15.2, -4.4, -0.6]) mounts.push({ position: v(x, SY + 2.0, P1.z + 0.24), rotation: 0, target: v(x, SY + 1.5, P1.z + 6), width: 1.8, height: 1.2, style: 'black', wash: false });
    for (let i = 0; i < 4; i++) { const z = AZ - 4 - i * 2.6; const y = -0.17 - ((AZ - 1 - z) / 0.7) * (5.2 / STEPS) + 1.6; mounts.push({ position: v(AX + 0.42, y, z), rotation: PI / 2, target: v(AX + 1.2, y, z), width: 0.9, height: 0.7, style: 'black', wash: false }); }
    const stairY = (z: number) => { const i = (AZ - 1 - z) / 0.7; return -Math.min(STEPS, Math.max(0, i)) * (5.2 / STEPS); };
    return { mounts, spawn: v(AX + 8, 3, AZ + 6), look: v(AX + 1, 3, AZ - 4), eye: 3, bounds: [AX - 11, AX + 17, AZ - 41, AZ + 30], style: 'black', floorY: (x, z) => { if (x > AX - 0.2 && x < AX + 2.6 && z < AZ + 0.5 && z > AZ - 14) return stairY(z); if (z <= AZ - 14 && z > P1.z) return SY; return 0; } };
  },
};

/* ---------------- 65 RUCKER PARK ---------------- */
export const rucker: RoomDef = {
  id: 'rucker',
  name: 'The court',
  area: 'RUCKER PARK',
  mood: 'Summer night game',
  color: '#f08a2a',
  description: 'One hundred fifty fifth and Frederick Douglass: the fenced court under the lights, the bleachers packed, a game moving, the river and the Bronx beyond, the works on the fence.',
  signatures: 'The full court inside a chain link fence, the aluminium bleachers along both sidelines, the light towers, the Polo Grounds Towers behind, the Harlem River and the Macombs Dam Bridge, a crowd three deep at the fence.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x101a32, horizon: 0x4a3a4c, ground: 0x0e1018, fog: 0.0018, stars: 200, env: 0.55 });
    k.hemi(0xd8e0ff, 0x1a1418, 0.5);
    k.sun(0xc8d0ff, 0.4, -60, 60, 40, false, 90);
    /* 2026-11-24 (wave 4a): the court is scanned asphalt painted green, the bleachers scanned plate, the walks scanned
       concrete (Poly Haven, CC0). The see through box fence is gone: real chain link panels and posts stand in its place. */
    const court = scn(k, 'rucker', 'asphalt_04', 3, () => X.asphalt(0x2a4a3a), { color: 0x5e8a6e, roughness: 0.85 }, 0x1e3428),
      key = k.flat(0xc85a2a, 0, 0.9),
      white = k.flat(0xf4f0e8, 0, 0.6),
      steel = k.flat(0x8c98a4, 0.9, 0.3),
      alu = scn(k, 'rucker', 'metal_plate', 1.2, () => X.steel(0xb8bcc0, false, 176), { color: 0xc8ccd0, metalness: 0.7, roughness: 0.45 }, 0x6a6e72),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      towers = k.pbr('rpTowers', X.windows(177, 0.5, 0x5a5048, true), 0.12, { emissive: 0xffffff, emissiveIntensity: 1.1, stretch: 0.42 }),
      orange = k.flat(0xe87a2a, 0, 0.7),
      pave = scn(k, 'rucker', 'concrete_pavement', 3, () => X.pavers(0x7a7a76, 83), { color: 0x9a9892 }, 0x4a4a46),
      glow = k.glow(0xfff0d8);
    // the block: the avenue, the towers, the river and the bridge behind
    street(k, { w: 20, len: 160, z: 0, x: 40 });
    k.box(160, 0.4, 120, -20, -0.2, 0, pave);
    for (const [x, z] of [[-60, 60], [-20, 70], [20, 70]]) k.box(22, 70, 22, x, 35, z, towers);
    k.water({ y: -3, color: 0x24405a, w: 400, d: 200, z: -140, amp: 0.8 });
    for (let x = -120; x <= 120; x += 40) { k.box(3, 20, 3, x, 7, -120, steel); }
    k.box(260, 1.5, 6, 0, 14, -120, steel);
    for (let x = -120; x <= 120; x += 6) k.beam(v(x, 14, -120), v(x + 3, 24 + Math.abs(Math.sin(x * 0.05)) * 6, -120), 0.08, steel, 4);
    k.skyline({ z: -260, count: 24, spacing: 12, scale: 1.6, base: -3, seed: 178, lit: 0.4, glow: 1.0, tint: 0x3a3a48, rows: 1 });
    // the court: asphalt, the lines, the keys, two hoops, the fence all round, four light towers
    const CW = 15, CL = 28;
    k.box(CW + 8, 0.2, CL + 8, 0, 0.05, 0, court);
    for (const [w, d, x, z] of [[CW, 0.06, 0, CL / 2], [CW, 0.06, 0, -CL / 2], [0.06, CL, CW / 2, 0], [0.06, CL, -CW / 2, 0], [CW, 0.06, 0, 0]]) k.box(w as number, 0.01, d as number, x as number, 0.16, z as number, white);
    for (const s of [-1, 1]) { k.box(4.9, 0.01, 5.8, 0, 0.155, s * (CL / 2 - 2.9), key); k.torus(1.8, 0.03, 0, 0.16, s * (CL / 2 - 5.8), white, 32).rotation.x = PI / 2; const arc = k.mesh(new T.RingGeometry(6.6, 6.7, 48, 1, s > 0 ? PI : 0, PI), white, 0, 0.16, s * (CL / 2 - 1.6)); arc.rotation.x = -PI / 2; }
    k.torus(1.8, 0.03, 0, 0.16, 0, white, 32).rotation.x = PI / 2;
    for (const s of [-1, 1]) { const z = s * (CL / 2 + 1.2); k.beam(v(0, 0, z), v(0, 3.4, z), 0.1, steel, 6); k.beam(v(0, 3.4, z), v(0, 3.4, z - s * 1.2), 0.08, steel, 4); k.box(1.8, 1.05, 0.05, 0, 3.05, z - s * 1.2, k.glass(0xffffff, 0.35, 0.05)); k.box(1.8, 0.06, 0.06, 0, 2.55, z - s * 1.2, white); k.torus(0.23, 0.02, 0, 3.05 - 0.5, z - s * 1.5, orange, 16).rotation.x = PI / 2; for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; k.beam(v(Math.cos(a) * 0.23, 2.55, z - s * 1.5 + Math.sin(a) * 0.23), v(Math.cos(a) * 0.1, 2.15, z - s * 1.5 + Math.sin(a) * 0.1), 0.006, white, 3); } k.keepOut.push({ x: 0, z, r: 0.5 }); }
    const FX = CW / 2 + 4, FZ = CL / 2 + 4;
    /* the fence: two rows of chain link panels on posts all the way round, the gate in the near end (Poly Haven
       modular_chainlink_fence, CC0), with a top rail */
    { const pan: number[][] = [], post: number[][] = [], PW = 1.91;
      for (const s of [-1, 1]) {
        for (let z = -FZ + PW / 2; z < FZ; z += PW) { for (const y of [0, 2.37]) pan.push([s * FX, y, z, PI / 2]); post.push([s * FX, 0, z - PW / 2, 0, 1]); }
        for (let x = -FX + PW / 2; x < FX; x += PW) { if (s < 0 && Math.abs(x) < 1.4) continue; for (const y of [0, 2.37]) pan.push([x, y, s * FZ, 0]); post.push([x - PW / 2, 0, s * FZ, 0, 1]); }
      }
      /* the wire's own alpha does not survive the 1k re-encode, so the diamond mesh is cut here with a drawn alpha map */
      const wire = HAS_DOM4 ? paintTex(64, 64, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineWidth = 7; g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w / 2, 0); g.lineTo(w, h / 2); g.lineTo(w / 2, h); g.closePath(); g.stroke(); }, [], false) : null;
      if (wire) { wire.wrapS = wire.wrapT = T.RepeatWrapping; wire.repeat.set(36, 44); }
      many(k, 'rucker/ph_fence_panel', { height: 2.37 }, pan, (h) => h.traverse((c) => { if (!(c instanceof T.Mesh) || !wire) return; const m = c.material as T.MeshStandardMaterial; if (!/wire/.test(m.name)) return; const n = m.clone(); n.alphaMap = wire; n.alphaTest = 0.5; n.transparent = false; n.side = T.DoubleSide; n.color.setHex(0xb8bec4); n.metalness = 0.7; n.roughness = 0.45; c.material = n; }));
      many(k, 'rucker/ph_fence_post', { height: 4.8 }, post);
      for (const s of [-1, 1]) { k.box(2 * FX, 0.06, 0.06, 0, 4.76, s * FZ, steel); k.box(0.06, 0.06, 2 * FZ, s * FX, 4.76, 0, steel); }
      for (const x of [-1.4, 1.4]) k.box(0.12, 4.8, 0.12, x, 2.4, -FZ, steel);
    }
    k.block(-FX - 0.2, -FX + 0.2, -FZ, FZ); k.block(FX - 0.2, FX + 0.2, -FZ, FZ); k.block(-FX, FX, FZ - 0.2, FZ + 0.2); k.block(-FX, -1.2, -FZ - 0.2, -FZ + 0.2); k.block(1.2, FX, -FZ - 0.2, -FZ + 0.2);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { k.beam(v(sx * (FX + 3), 0, sz * (FZ + 3)), v(sx * (FX + 3), 14, sz * (FZ + 3)), 0.25, steel, 8); for (let i = 0; i < 3; i++) k.box(0.6, 0.5, 0.3, sx * (FX + 3) - sx * 0.6 - i * sx * 0.7, 13.6, sz * (FZ + 3), glow).rotation.y = -sz * 0.3; k.spot(sx * (FX + 3), 14, sz * (FZ + 3), sx * 3, 0, sz * 6, 0xfff4e0, 400, 0.7, 0.6, 50); }
    /* real flood heads on the towers (Poly Haven flood_lights, CC0), three to a crossarm, aimed down at the court */
    { const at: number[][] = []; for (const sx of [-1, 1]) for (const sz of [-1, 1]) { k.box(3.4, 0.16, 0.16, sx * (FX + 3) - sx * 1.2, 13.2, sz * (FZ + 3), steel); for (let i = 0; i < 3; i++) at.push([sx * (FX + 3) - sx * (0.1 + i * 1.1), 13.25, sz * (FZ + 3) - sz * 0.1, sz > 0 ? PI : 0, 1]); }
      many(k, 'rucker/ph_flood_double', { height: 1.2 }, at); }
    // the bleachers along both sidelines, the crowd at the fence, the players
    for (const s of [-1, 1]) { for (let r = 0; r < 5; r++) { k.box(24, 0.06, 0.5, 0, 0.5 + r * 0.4, s * (FZ + 5.5 + r * 0.8), alu); k.box(24, 0.06, 0.4, 0, 0.3 + r * 0.4, s * (FZ + 5.2 + r * 0.8), alu); } k.block(-12, 12, s * (FZ + 5) - 2.6, s * (FZ + 5) + 2.6); }
    k.crowd([v(-12, 0.7, FZ + 6.8), v(0, 0.7, FZ + 7.2), v(12, 0.7, FZ + 6.8)], 26, { seed: 65, speed: 0.1, spread: 2.2, animate: !ctx.reduced });
    k.crowd([v(-12, 0.7, -FZ - 6.8), v(0, 0.7, -FZ - 7.2), v(12, 0.7, -FZ - 6.8)], 26, { seed: 66, speed: 0.1, spread: 2.2, animate: !ctx.reduced });
    k.crowd([v(FX + 0.8, 0, -FZ), v(FX + 0.8, 0, 0), v(FX + 0.8, 0, FZ)], 18, { seed: 67, speed: 0.15, spread: 1.4, animate: !ctx.reduced });
    const players = k.crowd([v(-4, 0.2, -10), v(3, 0.2, -2), v(-3, 0.2, 4), v(4, 0.2, 11)], 10, { seed: 68, speed: 3.2, spread: 3, animate: !ctx.reduced, colors: [0xf4f0e8, 0xf08a2a, 0xf4f0e8, 0x1e56b4] });
    void players;
    const ball = k.mesh(new T.SphereGeometry(0.12, 10, 8), orange, 0, 1, 0, true);
    if (!ctx.reduced) k.ticks.push((t) => { const u = (t * 0.25) % 1; ball.position.set(Math.sin(t * 0.7) * 5, 0.9 + Math.abs(Math.sin(t * 4)) * 1.6, -12 + u * 24); });
    k.censusWall({ x: -FX - 0.36, y: 2.4, z: 0, rotY: PI / 2, cols: 40, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(7600, 160), pieces: ctx.all, backing: dark });
    k.box(0.3, 5, 24, -FX - 0.6, 2.5, 0, dark);
    k.sign('RUCKER PARK  ·  155TH  ·  THE GAME IS TONIGHT', 8, 0.7, 0, 4.6, FZ + 0.08, 'transparent', '#f4f0e8', 70, PI);
    for (const s of [-1, 1]) for (let x = -11; x <= 11; x += 3.6) k.beam(v(x, 0, s * (FZ + 5.1)), v(x, 2.1, s * (FZ + 8.7)), 0.05, steel, 5);
    /* the park round the court: benches, cans and a hydrant on the walk (Poly Haven, CC0) */
    many(k, 'rucker/ph_trash_can', { height: 0.95 }, [[FX + 1.8, 0.05, -FZ - 1.5, 0.3], [-FX - 1.8, 0.05, FZ + 1.4, 1.2], [FX + 1.8, 0.05, FZ + 1.4, 2.0], [-FX - 4, 0.05, -FZ - 2, 0.8]]);
    many(k, 'rucker/ph_painted_wooden_bench', { height: 0.9 }, [[FX + 2.2, 0.05, -6, -PI / 2], [FX + 2.2, 0.05, 0, -PI / 2], [FX + 2.2, 0.05, 6, -PI / 2]]);
    many(k, 'rucker/ph_hydrant', { height: 0.8 }, [[28.6, 0.14, -18, PI / 2]]);
    for (const z of [-6, 0, 6]) k.keepOut.push({ x: FX + 2.2, z, r: 0.8 });
    /* signs: the Parks sign at the gate, the court's name on the fence, the house rule */
    for (const x of [-3.4, 3.4]) k.box(0.12, 2.8, 0.12, x, 1.4, -FZ - 1.2, k.flat(0x1f3a28, 0.4, 0.5));
    hsign(k, 'HOLCOMBE RUCKER PARK', 7, 0.8, 0, 2.6, -FZ - 1.12, PI, { fg: '#f4f0e8', bg: '#1f5a36', font: 'W2 Archivo Expanded', border: '#f4f0e8', size: 0.5 });
    hsign(k, 'DEPARTMENT OF PARKS AND RECREATION', 7, 0.36, 0, 2.04, -FZ - 1.12, PI, { fg: '#f4f0e8', bg: '#1f5a36', font: 'W2 Archivo Narrow', size: 0.55 });
    hsign(k, 'GREG MARIUS COURT', 6, 0.8, 0, 5.4, FZ, PI, { fg: '#f4f0e8', bg: '#1b2a4a', font: 'W2 Archivo Expanded', border: '#f08a2a', size: 0.55 });
    hsign(k, 'NO DUNKING ON THE RIMS', 3.2, 0.4, -6, 3.3, -FZ - 0.06, PI, { fg: '#c8202a', bg: '#f4f0e8', font: 'W2 Archivo Narrow', size: 0.6, lit: false });
    /* the handball wall past the far bleachers, its mural queued (FIREFLY_QUEUE.md, rucker); bare concrete until it lands */
    k.box(18, 5.2, 0.5, 0, 2.6, FZ + 12.6, pave);
    k.block(-9, 9, FZ + 12.3, FZ + 12.9);
    fireflyPlate(k, 'assets/museum/tex/rucker/ff_handball_mural.webp', 17, 4.6, 0, 2.7, FZ + 12.34, PI, k.flat(0x8a8780, 0, 0.9));
    /* the illusion: THE RUCK is painted flat on the court, stretched so that from the gate it stands up off the asphalt
       like a banner across the key. Walk onto the court and it lies back down into long smears of paint. */
    if (HAS_DOM4) anamorph(k, 'THE RUCK', 0, -FZ - 1.6, 3, 0.17, 7, 7, 1.7, '#f08a2a', 160);
    k.egg(v(0, 0.6, -FZ + 5), { id: 'rucker-anamorph', title: 'Paint that stands up', text: 'THE RUCK is painted flat on the court and stretched toward the far hoop, so that from the gate it stands up off the asphalt like a banner. Step onto the court and it falls back into long orange smears. The trick is anamorphosis, the same one that hides a skull across the floor of Hans Holbein\'s The Ambassadors of 1533.', clue: 'Stand at the gate under the Parks sign and look across the court.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.6 });
    const RW = 'https://en.wikipedia.org/wiki/Rucker_Park';
    k.egg(v(0, 3.4, -FZ - 0.4), { id: 'rucker-holcombe', title: 'Mr. Rucker\'s tournament', year: '1950', text: 'Holcombe Rucker, a teacher and city playground director, started what is believed to be New York City\'s first annual summer basketball tournament in 1950, to keep kids off the street. He helped his players win more than 700 athletic scholarships. He died in 1965, and the park was renamed for him in 1974.', clue: 'Look over the gate as you walk onto the court.', source: { name: 'Rucker Park, Wikipedia', url: RW } }, { r: 1.6 });
    k.egg(v(-14, 3, FZ + 3), { id: 'rucker-ps156', title: 'Under Coogan\'s Bluff', year: '1956', text: 'The court opened in 1956 as the P.S. 156 Playground, next to the school and just east of where the Polo Grounds stood, at the foot of Coogan\'s Bluff. Before that the land belonged to the 8th Avenue Railroad Company.', clue: 'Look past the far fence toward the towers.', source: { name: 'Rucker Park, Wikipedia', url: RW } }, { r: 1.8 });
    k.egg(v(0, 1.2, 0), { id: 'rucker-wilt', title: 'Wilt came first', year: '1957', text: 'Wilt Chamberlain first played here in 1957, one of the first professional stars to do it. In the late 1960s and early 1970s Kareem Abdul-Jabbar, Julius Erving and Nate Archibald played the summer league, and Erving made his early name dazzling the crowds on this court.', clue: 'Stand in the centre circle.', source: { name: 'Rucker Park, Wikipedia', url: RW } }, { r: 1.4 });
    k.egg(v(0, 1.4, FZ + 6.6), { id: 'rucker-ebc', title: 'The Entertainers Basketball Classic', year: '1982', text: 'After a quiet 1970s, Greg Marius brought the park back in 1982 with the Entertainers Basketball Classic. Fat Joe and Jay-Z each ran a team in it. In 2017 the court was renamed Greg Marius Court.', clue: 'Climb into the bleachers on the far sideline.', source: { name: 'Rucker Park, Wikipedia', url: RW } }, { r: 1.8 });
    k.egg(v(0, 3.05, CL / 2), { id: 'rucker-2021', title: 'New glass, new court', year: '2021', text: 'The park had $520,000 of renovations between August and October 2021, paid for partly by the National Basketball Players Association. In 2025 it was named a National Commemorative Site.', clue: 'Look at the backboard at the far end.', source: { name: 'Rucker Park, Wikipedia', url: RW } }, { r: 0.7 });
    k.egg(v(-FX - 0.5, 2.4, -6), { id: 'rucker-legends', title: 'Legends with no NBA card', text: 'Some of the biggest names on this court never played in the NBA or the ABA at all. Earl Manigault, Joe Hammond and Pee Wee Kirkland made their names here.', clue: 'Read the census wall along the fence.', source: { name: 'Rucker Park, Wikipedia', url: RW } }, { r: 1.6 });
    // the works: banners hung on the fence inside the court on the far side and both ends, the light tower bases
    const mounts: Mount[] = [];
    for (let i = 0; i < 6; i++) { const z = -15 + i * 6; mounts.push({ position: v(FX - 0.12, 2.2, z), rotation: -PI / 2, target: v(2.6, 2, z), width: 3.4, height: 2.0, style: 'steel', wash: false }); }
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const x = -7 + i * 7; if (s < 0 && i === 1) continue; mounts.push({ position: v(x, 2.2, s * (FZ - 0.12)), rotation: s > 0 ? PI : 0, target: v(x, 2, 0), width: 3.4, height: 2.0, style: 'steel', wash: false }); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { k.box(2.8, 3.2, 0.3, sx * (FX + 3), 1.8, sz * (FZ + 3) - sz * 1.6, dark); mounts.push({ position: v(sx * (FX + 3), 1.9, sz * (FZ + 3) - sz * 1.78), rotation: sz > 0 ? PI : 0, target: v(sx * 6, 2, sz * 8), width: 2.4, height: 1.5, style: 'black', wash: false }); }
    for (let i = 0; i < 5; i++) { const x = 30 + i * 6; k.box(3.6, 2.6, 0.2, x, 1.6, -14, dark); mounts.push({ position: v(x, 1.7, -13.88), rotation: 0, target: v(x, 2, -6), width: 3.2, height: 1.9, style: 'black', wash: false }); }
    return { mounts, spawn: v(0, 3, -FZ - 12), look: v(0, 3, 10), eye: 3, bounds: [-FX - 6, 60, -FZ - 16, FZ + 14], style: 'steel' };
  },
};

/* ---------------- 66 1520 SEDGWICK AVENUE ---------------- */
export const sedgwick: RoomDef = {
  id: 'sedgwick',
  name: 'The rec room',
  area: '1520 SEDGWICK AVENUE',
  mood: 'August 1973',
  color: '#e0c030',
  description: 'The eighteen storey building over the Cross Bronx, the block party on the plaza, then the rec room downstairs: two turntables and a mixer, the speakers, the break, the works on the cinderblock.',
  signatures: 'The brown brick eighteen storey building at the top of the hill, the highway trench below, the lobby and the community room with its drop ceiling and cinderblock, two turntables on a folding table, a wall of speakers, a crowd in a circle around the floor.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x1a1a40, horizon: 0x8a5a60, ground: 0x0e0e12, fog: 0.0026, stars: 180, env: 0.6 });
    k.hemi(0xffd8c0, 0x1a1418, 0.5);
    k.sun(0xff9a60, 0.6, -80, 12, 40, true, 90);
    /* 2026-11-24 (wave 4a): scanned cinderblock, brown brick, old linoleum, acoustic plaster, pavers and road (Poly Haven,
       CC0), each in a dark version of its colour until its maps arrive */
    const brick = scn(k, 'sedgwick', 'brown_brick_02', 2.2, () => X.brick(0x6a4a3a, 179), { color: 0xb08a78 }, 0x3a2a22),
      cinder = scn(k, 'sedgwick', 'concrete_block_wall', 2.4, () => X.brick(0xb8b4a8, 180), { color: 0xd8d2c0, roughness: 0.95 }, 0x5a5850),
      floorT = k.pbr('sdFloor', X.terrazzo(0x8a8478, 84), 0.4, { roughness: 0.5 }),
      lino = scn(k, 'sedgwick', 'old_linoleum_flooring_01', 1.8, () => X.terrazzo(0x8a8478, 84), { color: 0xc8b8a0, roughness: 0.6 }, 0x4a4238),
      tile = scn(k, 'sedgwick', 'white_plaster_02', 1.2, () => X.plaster(0xd8d4c8, 85), { color: 0xe0dccf }, 0x6a6860),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      black = k.flat(0x0a0a0c, 0.3, 0.8),
      steel = k.flat(0x8c98a4, 0.9, 0.3),
      wood = k.pbr('sdWood', X.planks(0x8a6a48, 4, 181), 1.0),
      asphalt = scn(k, 'sedgwick', 'asphalt_02', 4, () => X.asphalt(0x2a2d31), { color: 0x8a8a8a, roughness: 0.9 }, 0x2a2a2a),
      pave = scn(k, 'sedgwick', 'concrete_pavers', 2.4, () => X.pavers(0x8e8b84, 86), { color: 0xb0aca4 }, 0x4a4844),
      warm = k.glow(0xffd8a0),
      neonR = k.glow(0xff3a5a),
      neonB = k.glow(0x3a8aff),
      towers = k.pbr('sdTowers', X.windows(182, 0.5, 0x6a5a48, true), 0.12, { emissive: 0xffffff, emissiveIntensity: 1.0, stretch: 0.42 });
    // the hill: the tower, the plaza in front, the highway trench with traffic below, the Bronx beyond
    k.box(120, 0.4, 60, 0, -0.2, 10, pave);
    /* eighteen floors, about 56 m, not a thirty storey slab */
    k.box(60, 56, 30, 0, 28, -25, towers);
    k.box(62, 4, 32, 0, 2, -25, brick);
    for (let i = 0; i < 3; i++) k.box(1.6, 3.6, 0.2, -6 + i * 6, 1.8, -9.8, k.glass(0xffe0b0, 0.3, 0.1));
    k.arch(3, 3.6, 2, 0, 0, -10, brick, false, 0.85);
    k.block(-31, -1.6, -10.5, -9.5); k.block(1.6, 31, -10.5, -9.5);
    k.sign('1520', 2, 0.9, 0, 4.4, -9.78, '#1a1c20', '#f4f0e8', 90, 0, { border: true });
    /* the front given depth: brick piers between the window bays and a brick spandrel at every floor, so the tower reads as
       a brick building with windows set back in it, not a lit picture of one */
    for (let x = -29.5; x <= 29.6; x += 3.1) k.box(0.7, 52, 0.5, x, 30, -9.85, brick);
    for (let y = 6.9; y < 56; y += 3.1) k.box(60, 0.7, 0.4, 0, y, -9.9, brick);
    k.box(61, 1.2, 1.2, 0, 56.4, -10, brick);
    k.box(300, 0.4, 40, 0, -12, 60, asphalt);
    for (let i = 0; i < 6; i++) k.box(300, 12, 3, 0, -6, 40 + i * 0, k.pbr('sdWall', X.concrete(0x8a8a82, 87), 0.3));
    for (let i = 0; i < 6; i++) k.box(300, 12, 3, 0, -6, 80, k.pbr('sdWall', X.concrete(0x8a8a82, 87), 0.3));
    const cars: T.Mesh[] = [];
    for (let i = 0; i < 20; i++) { const c = k.mesh(new T.BoxGeometry(4.2, 1.3, 1.8), k.flat([0xd8d0c0, 0x1a1a1a, 0xc62828, 0x2b4a8a][i % 4], 0.4, 0.4), -150 + i * 15, -11.2, 52 + (i % 2) * 8, true); c.userData.d = i % 2 ? 1 : -1; c.userData.car = true; cars.push(c); const l = new T.Mesh(new T.BoxGeometry(0.1, 0.2, 1.4), warm); l.position.set(c.userData.d * 2.1, 0, 0); c.add(l); }
    if (!ctx.reduced) k.ticks.push((_t, dt) => cars.forEach((c) => { c.position.x += c.userData.d * 14 * Math.min(dt, 0.1); if (c.position.x > 160) c.position.x = -160; if (c.position.x < -160) c.position.x = 160; }));
    k.rail(0, 39, 300, steel, 1.1, 'x', 2.5);
    k.block(-150, 150, 38.6, 39.6);
    k.skyline({ z: 200, count: 30, spacing: 10, scale: 1.8, base: -12, seed: 183, lit: 0.45, glow: 1.0, tint: 0x3a3040, rows: 1 });
    for (const [x, z] of [[-70, 10], [70, 10]]) k.box(24, 60, 24, x, 30, z - 30, towers);
    // the block party on the plaza: a DJ table under a lamp, speakers, the circle
    const PX = 18, PZ = 18;
    k.box(2.4, 0.9, 0.9, PX, 0.45, PZ, wood); k.box(1.0, 0.1, 0.9, PX - 0.6, 0.95, PZ, black); k.box(1.0, 0.1, 0.9, PX + 0.6, 0.95, PZ, black); k.keepOut.push({ x: PX, z: PZ, r: 1.6 });
    for (const dx of [-3, 3]) { k.box(1.0, 1.6, 0.8, PX + dx, 0.8, PZ - 0.4, black); k.cyl(0.3, 0.05, PX + dx, 1.1, PZ + 0.02, dark, 0.3, 14); k.keepOut.push({ x: PX + dx, z: PZ - 0.4, r: 0.8 }); }
    k.lamp(PX, PZ - 3, 6, dark, 0xffd9a8, 30);
    k.crowd([v(PX - 8, 0, PZ + 3), v(PX - 4, 0, PZ + 8), v(PX + 4, 0, PZ + 8), v(PX + 8, 0, PZ + 3)], 20, { seed: 69, speed: 0.4, spread: 2.4, animate: !ctx.reduced, colors: [0xf08a2a, 0xf1c531, 0x3a8ab0, 0xd83a6a, 0x24262c, 0xf4f0e8] });
    /* a real hydrant and a boombox on a milk crate by the party (Poly Haven, CC0), and the flyer on the building */
    many(k, 'sedgwick/ph_hydrant', { height: 0.85 }, [[-14, 0, 14, 0.4]]);
    k.keepOut.push({ x: -14, z: 14, r: 0.6 });
    many(k, 'sedgwick/ph_plastic_crate_01', { height: 0.34 }, [[PX + 5.2, 0, PZ + 0.6, 0.2], [PX - 5.2, 0, PZ + 0.4, -0.3], [PX - 5.2, 0.34, PZ + 0.4, 0.1]]);
    many(k, 'sedgwick/ph_boombox', { width: 0.6 }, [[PX + 5.2, 0.34, PZ + 0.6, PI + 0.2]]);
    k.keepOut.push({ x: PX + 5.2, z: PZ + 0.6, r: 0.6 }, { x: PX - 5.2, z: PZ + 0.4, r: 0.6 });
    if (HAS_DOM4) { const fl = flyer(); for (const [x, y, z, w] of [[8, 1.9, -8.97, 1.5]] as const) { const o = k.mesh(new T.PlaneGeometry(w, w * 0.62), new T.MeshStandardMaterial({ map: fl, roughness: 0.85 }), x, y, z, true); void o; } }
    /* a canopy over the front door, the way the building's entrance has one */
    k.box(6, 0.22, 2.6, 0, 3.9, -8.6, dark); for (const x of [-2.8, 2.8]) k.box(0.08, 3.9, 0.08, x, 1.95, -7.4, steel);
    k.prop('mailbox', 14, 0, 6, { height: 1.5, rotY: PI });
    // the rec room: down a short stair inside the lobby, cinderblock, drop ceiling, the setup on a folding table, the speaker wall
    const RY = -3.6, RX = 0, RZ = -30, RW = 26, RD = 20;
    /* the lobby floor has its stairwell cut out now, so the stair down is open from above */
    k.box(3.4, 0.3, 14, -13.3, 0.15, -17, floorT); k.box(23.4, 0.3, 14, 3.3, 0.15, -17, floorT); k.box(3.2, 0.3, 11.6, -10, 0.15, -15.8, floorT);
    for (const x of [-11.7, -8.3]) k.box(0.06, 1.0, 8.4, x, 0.8, -26, steel);
    for (let i = 0; i < 10; i++) k.box(3, 0.36, 0.8, -10, -0.18 - i * 0.36, -22 - i * 0.8, floorT);
    /* 2026-11-24: the old ceiling was a slab three metres thick that came down to 1.7 m over the floor, so the camera stood
       inside it. The room is 3.6 m clear now under a real drop ceiling, and the front wall has a door where the stair
       actually lands. */
    const CH = 3.6;
    k.box(RW, 0.3, RD, RX, RY - 0.15, RZ - 6, lino);
    k.box(RW, 0.2, RD - 4, RX, RY + CH + 0.1, RZ - 8, tile);
    k.box(1.2, 0.2, 4, RX - 12.4, RY + CH + 0.1, RZ + 2, tile); k.box(21.2, 0.2, 4, RX + 2.4, RY + CH + 0.1, RZ + 2, tile);
    { const tbar = k.flat(0xe8e4dc, 0.3, 0.5); for (let z = RZ - 16; z <= RZ + 0.1; z += 1.22) k.box(RW, 0.03, 0.03, RX, RY + CH - 0.02, z, tbar); for (let x = RX - RW / 2 + 0.61; x < RX + RW / 2; x += 0.61) k.box(0.03, 0.03, 16, x, RY + CH - 0.02, RZ - 8, tbar); }
    for (const s of [-1, 1]) { k.box(0.4, CH, RD, RX + s * RW / 2, RY + CH / 2, RZ - 6, cinder); k.block(RX + s * RW / 2 - 0.4, RX + s * RW / 2 + 0.4, RZ - 16, RZ + 4); }
    k.box(RW, CH, 0.4, RX, RY + CH / 2, RZ - 16, cinder); k.block(RX - RW / 2, RX + RW / 2, RZ - 16.4, RZ - 15.6);
    k.box(1.2, CH, 0.4, RX - 12.4, RY + CH / 2, RZ + 4, cinder); k.box(21.2, CH, 0.4, RX + 2.4, RY + CH / 2, RZ + 4, cinder);
    k.block(RX - RW / 2, -11.8, RZ + 3.6, RZ + 4.4); k.block(-8.2, RX + RW / 2, RZ + 3.6, RZ + 4.4);
    k.block(-30, -12, -26.4, -16); k.block(-8, 30, -26.4, -16);
    /* real ceiling fixtures in the drop ceiling (Poly Haven mounted_fluorescent_lights, CC0), with the light they give */
    { const at: number[][] = []; for (let x = -9.8; x <= 9.8; x += 4.9) for (let z = RZ - 13; z < RZ + 1; z += 4.4) { at.push([x, RY + CH - 0.06, z, 0]); } many(k, 'sedgwick/ph_mounted_fluorescent_lights', { width: 1.2 }, at); for (let x = -9.8; x <= 9.8; x += 9.8) for (let z = RZ - 13; z < RZ + 1; z += 8.8) k.point(x, RY + CH - 0.5, z, 0xeef2ff, 7, 9); }
    /* folding chairs along the walls, the way a rented community room is set (Poly Haven, CC0) */
    { const at: number[][] = []; for (let z = RZ - 13.5; z < RZ + 2; z += 1.5) { if (Math.abs(z - (RZ - 6)) < 0.5) continue; at.push([RX - RW / 2 + 0.7, RY, z, PI / 2]); } for (let x = -11; x < -3; x += 1.4) at.push([x, RY, RZ + 3.2, PI]); many(k, 'sedgwick/ph_folding_chair_01', { height: 0.86 }, at); }
    const TX = 0, TZ = RZ - 12;
    k.box(2.4, 0.06, 0.9, TX, RY + 0.85, TZ, wood); for (const dx of [-1, 1]) k.beam(v(TX + dx, RY, TZ), v(TX + dx, RY + 0.82, TZ), 0.03, steel, 4);
    const platters: T.Mesh[] = [];
    for (const dx of [-0.75, 0.75]) { k.box(0.55, 0.08, 0.5, TX + dx, RY + 0.92, TZ, black); const p = k.mesh(new T.CylinderGeometry(0.2, 0.2, 0.02, 24), dark, TX + dx, RY + 0.98, TZ, true); platters.push(p); k.box(0.02, 0.01, 0.16, TX + dx + 0.16, RY + 1.0, TZ - 0.12, steel).rotation.y = -0.6; }
    k.box(0.4, 0.06, 0.4, TX, RY + 0.92, TZ, black);
    for (const dx of [-0.75, 0.75]) { const arm = k.box(0.02, 0.02, 0.32, TX + dx + 0.2, RY + 1.04, TZ + 0.02, steel); arm.rotation.y = 0.35; }
    /* the amp beside the decks (Poly Haven vintage_radio_transceiver, CC0) and crates of records under the table */
    many(k, 'sedgwick/ph_vintage_radio_transceiver', { width: 0.5 }, [[TX + 1.55, RY + 0.88, TZ, PI]]);
    k.box(0.7, 0.06, 0.6, TX + 1.55, RY + 0.85, TZ, wood);
    many(k, 'sedgwick/ph_plastic_crate_01', { height: 0.3 }, [[TX - 0.7, RY, TZ + 0.1, 0.1], [TX + 0.2, RY, TZ + 0.1, -0.1], [TX - 0.25, RY + 0.3, TZ + 0.05, 0.3], [TX + 1.6, RY, TZ + 0.2, 0]]);
    { const rec = k.flat(0x0c0c0e, 0.2, 0.3); for (const [x, n] of [[TX - 0.7, 9], [TX + 0.2, 8], [TX + 1.6, 7]] as const) for (let i = 0; i < n; i++) k.box(0.31, 0.29, 0.004, x, RY + 0.17, TZ + 0.12 - 0.15 + i * 0.033, rec); }
    if (!ctx.reduced) k.ticks.push((_t, dt) => platters.forEach((p, i) => { p.rotation.y += dt * (i ? 3.5 : 3.49); }));
    k.keepOut.push({ x: TX, z: TZ, r: 1.5 });
    for (let i = 0; i < 6; i++) { const x = -6 + (i % 3) * 6, y = RY + 0.7 + Math.floor(i / 3) * 1.4; k.box(1.6, 1.3, 0.9, x, y, RZ - 15.3, black); k.cyl(0.45, 0.04, x, y, RZ - 14.84, dark, 0.45, 16); k.cyl(0.14, 0.06, x + 0.45, y + 0.4, RZ - 14.84, dark, 0.14, 12); k.keepOut.push({ x, z: RZ - 15.3, r: 1 }); }
    const cones = k.objects.filter((o) => o.geometry instanceof T.CylinderGeometry && Math.abs(o.position.z - (RZ - 14.84)) < 0.01 && o.position.y < RY + 3);
    if (!ctx.reduced) k.ticks.push((t) => cones.forEach((c, i) => { const s = 1 + 0.08 * Math.max(0, Math.sin(t * 8 + i)); c.scale.set(s, 1, s); }));
    for (let i = 0; i < 2; i++) { const l = k.point(-4 + i * 8, RY + 2.6, RZ - 4, i ? 0x3a8aff : 0xff3a5a, 20, 12); if (!ctx.reduced) k.ticks.push((t) => { l.intensity = 12 + 12 * Math.sin(t * 6 + i * 2); }); }
    k.mesh(new T.BoxGeometry(6, 0.06, 0.06), neonR, -6, RY + 3.0, RZ - 15.6); k.mesh(new T.BoxGeometry(6, 0.06, 0.06), neonB, 6, RY + 3.0, RZ - 15.6);
    k.crowd([v(-8, RY, RZ - 2), v(-8, RY, RZ - 10), v(0, RY, RZ - 8), v(8, RY, RZ - 10), v(8, RY, RZ - 2)], 22, { seed: 70, speed: 0.3, spread: 1.6, animate: !ctx.reduced, closed: true, colors: [0xf08a2a, 0xf1c531, 0x3a8ab0, 0xd83a6a, 0x24262c, 0xf4f0e8, 0x8a3ad8] });
    k.censusWall({ x: RX + RW / 2 - 0.42, y: RY + 1.6, z: RZ - 6, rotY: -PI / 2, cols: 30, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(7700, 120), pieces: ctx.all, backing: dark });
    hsign(k, 'SEDGWICK AVE  REC ROOM', 6, 0.5, RX + 2, RY + 3.2, RZ + 3.78, PI, { fg: '#f4e4b0', font: 'W2 Archivo Expanded', size: 0.6 });
    if (HAS_DOM4) k.mesh(new T.PlaneGeometry(1.3, 0.8), new T.MeshStandardMaterial({ map: flyer(), roughness: 0.85 }), -6.9, RY + 1.8, RZ + 3.79, true).rotation.y = PI;
    /* the illusion: BACK TO SCHOOL JAM is painted across the floor, stretched so that from the foot of the stair it stands
       up over the dance floor like a banner. From anywhere else it is long yellow smears on the lino. */
    if (HAS_DOM4) anamorphTex(k, floorWords('BACK TO SCHOOL JAM', '#f1c531'), -10, RZ + 0.5, RY + 3, RY + 0.012, -0.84, 4.2, 6.4, 1.35);
    k.egg(v(-4, RY + 0.4, RZ - 4), { id: 'sedgwick-anamorph', title: 'Words on the floor', text: 'BACK TO SCHOOL JAM is painted flat across the lino, stretched so that from the bottom of the stair it stands up over the dance floor like a banner hung in the air. Walk onto the floor and it lies back down into long yellow smears. The trick is anamorphosis, the same one that hides a skull across the floor of Hans Holbein\'s The Ambassadors of 1533.', clue: 'Stop at the bottom of the stair and look across the room toward the speakers.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 1.6 });
    const SW8 = 'https://en.wikipedia.org/wiki/1520_Sedgwick_Avenue';
    k.egg(v(TX, RY + 1.3, TZ), { id: 'sedgwick-party', title: 'Twenty five cents for the girls', year: '1973', text: 'On August 11, 1973, Cindy Campbell threw a back to school party in this building\'s recreation room, with her brother DJ Kool Herc on the turntables. She rented the room for $25 and charged 25 cents for women and 50 cents for men.', clue: 'Find the two turntables on the folding table.', source: { name: '1520 Sedgwick Avenue, Wikipedia', url: SW8 } }, { r: 1.4 });
    k.egg(v(-3, RY + 1.4, RZ - 14.4), { id: 'sedgwick-break', title: 'Two copies of the same record', year: '1973', text: 'Herc played two copies of the same record on two turntables, stretching the breakbeat at the start or in the middle of a song. At the same party Coke La Rock showed off his rapping.', clue: 'Stand in front of the speaker wall.', source: { name: '1520 Sedgwick Avenue, Wikipedia', url: SW8 } }, { r: 1.0 });
    k.egg(v(0, 4.4, -9.4), { id: 'sedgwick-building', title: 'One hundred two apartments', year: '1967', text: 'The building was completed in 1967: eighteen floors, 102 apartments, on the Cross Bronx Expressway in Morris Heights. It was a Mitchell Lama building, rent regulated for working families.', clue: 'Look at the number over the front door.', source: { name: '1520 Sedgwick Avenue, Wikipedia', url: SW8 } }, { r: 1.4 });
    k.egg(v(-2, RY + 1.6, RZ - 6), { id: 'sedgwick-claims', title: 'Everybody was there', text: 'The list of people who attended the party, or falsely claimed to, includes Grandmaster Flash, Afrika Bambaataa and KRS-One. Historians also note that hip hop grew up in several places in the 1970s; this room is one pivotal site, not the only birthplace.', clue: 'Join the circle on the rec room floor.', source: { name: '1520 Sedgwick Avenue, Wikipedia', url: SW8 } }, { r: 1.2 });
    k.egg(v(-10, 1.2, -18), { id: 'sedgwick-bethlehem', title: 'The Bethlehem of hip hop', year: '2007', text: 'On July 5, 2007, the New York State Office of Parks, Recreation and Historic Preservation recognized the building as the birthplace of hip hop. That year the owners moved to take it out of Mitchell Lama, and Herc, at a rally to save it, called it the Bethlehem of hip hop culture.', clue: 'Stop at the top of the stair down to the rec room.', source: { name: '1520 Sedgwick Avenue, Wikipedia', url: SW8 } }, { r: 1.4 });
    k.egg(v(14, 1.2, 6), { id: 'sedgwick-auction', title: 'Nobody else bid', year: '2011', text: 'After a 2008 sale meant to turn it market rate, the building declined. On November 7, 2011, Workforce Housing Advisors took title at a foreclosure auction where no one else bid, and residents who came to watch reportedly wept with joy.', clue: 'Find the mailbox on the plaza.', source: { name: '1520 Sedgwick Avenue, Wikipedia', url: SW8 } }, { r: 1.4 });
    // the works: the cinderblock walls of the rec room, taped up like flyers, the lobby, the plaza fence
    const mounts: Mount[] = [];
    for (let i = 0; i < 6; i++) { const z = RZ - 14 + i * 3; mounts.push({ position: v(RX - RW / 2 + 0.22, RY + 1.9, z), rotation: PI / 2, target: v(RX - 6, RY + 1.5, z), width: 2.4, height: 1.5, style: 'none', wash: false }); }
    for (const x of [-4.6, 0.8, 6.2, 11.2]) { mounts.push({ position: v(x, RY + 1.9, RZ + 3.78), rotation: PI, target: v(x, RY + 1.5, RZ - 4), width: 2.6, height: 1.6, style: 'none', wash: false }); }
    for (let i = 0; i < 3; i++) { const x = -8 + i * 8; mounts.push({ position: v(x, RY + 3.0, RZ - 15.78), rotation: 0, target: v(x, RY + 1.5, RZ - 8), width: 2.6, height: 0.8, style: 'none', wash: false }); }
    for (let i = 0; i < 4; i++) { const x = -12 + i * 8; mounts.push({ position: v(x, 2.6, -9.78), rotation: 0, target: v(x, 2, 0), width: 3.6, height: 2.1, style: 'black', wash: false }); }
    for (let i = 0; i < 4; i++) { const x = -40 + i * 8; k.box(3.6, 2.6, 0.2, x, 1.6, 30, dark); mounts.push({ position: v(x, 1.7, 29.88), rotation: PI, target: v(x, 2, 20), width: 3.2, height: 1.9, style: 'black', wash: false }); }
    return { mounts, spawn: v(-30, 3, 36), look: v(12, 5, 4), eye: 3, bounds: [-50, 50, RZ - 15.5, 38], style: 'black', floorY: (x, z) => { if (x > -11.6 && x < -8.4 && z < -21.6 && z > -30) return -Math.min(3.6, ((-21.6 - z) / 8) * 3.6); if (z < -16 && Math.abs(x) < RW / 2 && z > RZ - 16) return RY; return 0; } };
  },
};
