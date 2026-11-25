/* 122 and 123: Katz's and Barney Greengrass, rebuilt by hand after the first pass read as boxes. */
import * as T from 'three';
import { personTag } from '../kit';
import * as X from '../textures';
import { v, type Mount, type FrameStyle } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront, hsign, paintTex, anamorphTex } from './f';
import { fireflyPlate } from './a';
import { hero, heroInstances } from './heroes';
import { BARNEY_ART } from './barney_art';
const PI = Math.PI;
type K7 = Parameters<RoomDef['build']>[0];

/* ---------- THE BIG UPGRADE, wave 7a (2026-11-24): helpers for Katz's and Barney Greengrass ----------
   Scanned CC0 surfaces (Poly Haven, assets/museum/tex/<room>/<id>_{c,n,r}.webp) that wear a set colour until all
   three maps land; real models from assets/museum/props/<room>/ fitted once and placed many times (seven or more
   become instanced parts); house font signs. Safe in node: the audit builds these rooms with no DOM, so a scan falls
   back to its painted surface, no canvas is touched and the loaders never resolve. */
const W7_DOM = typeof window !== 'undefined' && typeof document !== 'undefined' && typeof HTMLImageElement !== 'undefined';
const w7L = W7_DOM ? new T.TextureLoader() : null;
const w7S = new Map<string, { s: X.Surface; ready: Promise<unknown> }>();
function w7Scan(k: K7, room: string, id: string, metres: number, paint: () => X.Surface, p: Partial<T.MeshStandardMaterialParameters> & { normal?: number } = {}, wait = 0x777777, tag = '') {
  if (!w7L) return k.pbr(`w7a-${room}-${id}${tag}`, paint(), 1 / metres, p);
  let e = w7S.get(`${room}/${id}`);
  if (!e) {
    const low = k.o.quality !== 'high', waits: Promise<unknown>[] = [];
    const one = (suf: string, srgb: boolean) => {
      let done: () => void = () => {};
      waits.push(new Promise<void>((r) => (done = r)));
      const t = w7L.load(`assets/museum/tex/${room}/${id}_${suf}.webp`, () => done(), undefined, () => done());
      t.wrapS = t.wrapT = T.RepeatWrapping;
      t.anisotropy = 8;
      if (srgb) t.colorSpace = T.SRGBColorSpace;
      return t as unknown as T.CanvasTexture;
    };
    e = { s: { map: one('c', true), normalMap: one('n', false), roughnessMap: low ? undefined : one('r', false) }, ready: Promise.all(waits) };
    w7S.set(`${room}/${id}`, e);
  }
  k.pending.push(e.ready);
  const m = k.pbr(`w7a-${room}-${id}${tag}`, e.s, 1 / metres, p);
  if (!m.userData.w7a) {
    m.userData.w7a = true;
    const maps = { map: m.map, normalMap: m.normalMap, roughnessMap: m.roughnessMap }, tint = m.color.clone();
    m.map = m.normalMap = m.roughnessMap = null;
    m.color.set(wait);
    void e.ready.then(() => { Object.assign(m, maps); m.color.copy(tint); m.needsUpdate = true; });
  }
  return m;
}
/* Glass in a Poly Haven model comes as KHR transmission (the room drawn twice a frame): plain transparency instead,
   and props cast no shadows (they doubled the triangles in wave 6). */
function w7Solid(o: T.Object3D, shadow = false) {
  o.traverse((c) => { if (!(c instanceof T.Mesh)) return; c.castShadow = shadow; for (const m of (Array.isArray(c.material) ? c.material : [c.material]) as T.MeshPhysicalMaterial[]) if (m.transmission > 0) { m.transmission = 0; m.transparent = true; m.opacity = 0.35; m.depthWrite = false; } });
}
/* One real model fitted once (heroes.ts: centred on x and z, standing on y) and set at every [x, y, z, rotY, scale?]. */
function w7Place(k: K7, name: string, fit: Parameters<typeof hero>[2], at: number[][], tweak?: (o: T.Object3D) => void, then?: (os: T.Object3D[]) => void) {
  if (!at.length) return;
  void hero(k, name, fit).then((h) => {
    if (!h || !k.live) return;
    w7Solid(h);
    if (tweak) tweak(h);
    if (at.length > 6) {
      const ins = heroInstances(k, h, at.length), m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(0, 0, 0, 'YXZ');
      at.forEach(([x, y, z, r, s = 1], i) => ins.setAt(i, m.compose(new T.Vector3(x, y, z), q.setFromEuler(e.set(0, r, 0, 'YXZ')), new T.Vector3(s, s, s))));
      ins.commit();
      then?.([]);
      return;
    }
    const os = at.map(([x, y, z, r, s = 1], i) => { const c = i ? h.clone() : h; c.position.set(x, y, z); c.rotation.set(0, r, 0); c.scale.setScalar(s); k.add(c); return c; });
    then?.(os);
  });
}
/* A sign in a house font, lit (neon, a light box) or not; a grey card in node. */
function w7Sign(k: K7, text: string, w: number, h: number, x: number, y: number, z: number, rotY: number, fg: string, bg: string, font = 'W2 Archivo Expanded', lit = false, border?: string, size = 0.6) {
  if (!W7_DOM) return k.box(w, h, 0.02, x, y, z, k.flat(0x333333));
  return hsign(k, text, w, h, x, y, z, rotY, { fg, bg: bg || undefined, font, lit, border, size });
}
/* Neon: the lettering twice, a wide soft halo under a crisp tube, both additive, on no ground. */
function w7Neon(k: K7, text: string, w: number, h: number, x: number, y: number, z: number, rotY: number, color: string, font = 'W2 Archivo Expanded') {
  if (!W7_DOM) return k.box(w, h, 0.02, x, y, z, k.glow(0xff4a3a));
  const W = 1024, H = Math.max(64, Math.round((W * h) / w));
  const t = paintTex(W, H, (g) => {
    g.textAlign = 'center'; g.textBaseline = 'middle';
    let s = H * 0.66; g.font = `800 ${s}px "${font}", Arial, sans-serif`;
    const tw = g.measureText(text).width; if (tw > W * 0.9) { s *= (W * 0.9) / tw; g.font = `800 ${s}px "${font}", Arial, sans-serif`; }
    g.shadowColor = color; g.shadowBlur = H * 0.22; g.lineJoin = 'round';
    g.strokeStyle = color; g.lineWidth = Math.max(4, s * 0.09); g.strokeText(text, W / 2, H / 2);
    g.shadowBlur = H * 0.08; g.strokeStyle = '#fff6ee'; g.lineWidth = Math.max(2, s * 0.035); g.strokeText(text, W / 2, H / 2);
  }, [font]);
  const o = k.mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }), x, y, z, true);
  o.rotation.y = rotY;
  return o;
}
const W7_HIDDEN = new T.MeshBasicMaterial({ visible: false });
/* A Firefly plate (FIREFLY_QUEUE.md) invisible until its file exists. */
function w7Plate(k: K7, url: string, w: number, h: number, x: number, y: number, z: number, rotY: number, lit = false) {
  return fireflyPlate(k, url, w, h, x, y, z, rotY, W7_HIDDEN, lit);
}
/* Painted lettering for an anamorphic floor piece, `colors` per letter. Null in node. */
function w7Type(text: string, colors: string[], w = 1024, h = 256, font = 'W2 Archivo Expanded') {
  if (!W7_DOM) return null;
  return paintTex(w, h, (g) => {
    g.textBaseline = 'middle';
    let s = h * 0.8; g.font = `800 ${s}px "${font}", Arial, sans-serif`;
    let tw = g.measureText(text).width; if (tw > w * 0.94) { s *= (w * 0.94) / tw; g.font = `800 ${s}px "${font}", Arial, sans-serif`; tw = g.measureText(text).width; }
    let x = (w - tw) / 2, n = 0;
    for (const ch of text) { g.fillStyle = colors[n++ % colors.length]; g.fillText(ch, x, h / 2); x += g.measureText(ch).width; if (ch === ' ') n--; }
  }, [font]);
}
/* A hanging salami: a lathe sausage in a cured skin (deep red, white fat flecks, the string netting), tied at the top. */
function w7SalamiGeo(len: number, r: number) {
  const pts: T.Vector2[] = [];
  for (let i = 0; i <= 10; i++) { const u = i / 10, y = -u * len, rr = r * Math.pow(Math.sin(Math.min(1, u * 1.08 + 0.04) * PI), 0.32) * (1 - 0.12 * u); pts.push(new T.Vector2(Math.max(0.004, rr), y)); }
  return new T.LatheGeometry(pts, 8);
}
/* A street along z at x in scanned asphalt, concrete pavement and granite kerbs, lane paint and crossings. */
function w7Street(k: K7, room: string, p: { w: number; len: number; z: number; x: number; walk?: number }) {
  const { w, len, z, x, walk = 5 } = p;
  const asphalt = w7Scan(k, room, 'asphalt_02', 4, () => X.asphalt(0x24282d), { color: 0x8c8c8c, roughness: 0.92 }, 0x3a3c40),
    pav = w7Scan(k, room, 'concrete_pavement', 2.2, () => X.pavers(0x8e8b84, 5), { color: 0xc8c2b6, roughness: 0.9 }, 0x8e8b84),
    granite = k.pbr('curbS', X.ashlar(0x8a8a86, 4, 2), 0.35),
    white = k.flat(0xdedbd2, 0, 0.7), yellow = k.flat(0xe6a626, 0, 0.6);
  k.box(w, 0.3, len, x, -0.15, z, asphalt);
  for (const s of [-1, 1]) { k.box(walk, 0.28, len, x + s * (w / 2 + walk / 2), 0.0, z, pav); k.box(0.3, 0.32, len, x + s * (w / 2 + 0.1), 0.02, z, granite); }
  for (const dx of [-0.14, 0.14]) k.box(0.09, 0.012, len - 6, x + dx, 0.01, z, yellow);
  for (let cz = z + len / 2 - 6; cz > z - len / 2; cz -= 28) for (let cx = -w / 2 + 1.2; cx <= w / 2 - 1; cx += 1.2) k.box(0.62, 0.014, 2.8, x + cx, 0.012, cz, white);
  // the sidewalk is laid in five foot flags: dark joints every 1.5 m read as the real pour
  const joints: T.Matrix4[] = [];
  for (const s of [-1, 1]) for (let cz = z - len / 2; cz < z + len / 2; cz += 1.52) joints.push(new T.Matrix4().compose(v(x + s * (w / 2 + walk / 2), 0.142, cz), new T.Quaternion(), v(walk, 1, 1)));
  k.instances(new T.BoxGeometry(1, 0.004, 0.025), k.flat(0x55524c, 0, 0.95), joints);
}
function w7SalamiMat(k: K7) {
  if (!W7_DOM) return k.flat(0x6e241f, 0.05, 0.65);
  const t = paintTex(256, 512, (g, w, h) => {
    const rnd = X.mulberry(1888);
    g.fillStyle = '#5e1c18'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2400; i++) { g.fillStyle = rnd() > 0.55 ? `rgba(240,214,196,${0.25 + rnd() * 0.5})` : `rgba(120,30,26,${0.3 + rnd() * 0.4})`; g.beginPath(); g.arc(rnd() * w, rnd() * h, 0.8 + rnd() * 2.6, 0, PI * 2); g.fill(); }
    g.fillStyle = 'rgba(235,228,214,0.18)'; for (let i = 0; i < 260; i++) g.fillRect(rnd() * w, rnd() * h, 6 + rnd() * 12, 3 + rnd() * 5);   // the white bloom of the dry cure
    g.strokeStyle = 'rgba(232,220,196,0.85)'; g.lineWidth = 2.2;                                                                          // the string net
    for (let y = -h; y < h * 2; y += 34) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + 70); g.stroke(); g.beginPath(); g.moveTo(0, y + 70); g.lineTo(w, y); g.stroke(); }
  });
  return new T.MeshStandardMaterial({ map: t, roughness: 0.62, metalness: 0 });
}

/* Traffic: every car on the avenue is one instance of a body and one of a cabin, two draw calls for the lot.
   Lanes run along `axis` at a fixed cross position; dir +1 or -1 picks the direction of travel. */
function traffic(k: Parameters<RoomDef['build']>[0], lanes: { at: number; dir: number }[], axis: 'x' | 'z', len: number, perLane: number, animate: boolean, seed: number) {
  const rnd = X.mulberry(seed), n = lanes.length * perLane, blank = () => Array.from({ length: n }, () => new T.Matrix4());
  const body = k.instances(new T.BoxGeometry(1.9, 0.8, 4.4), k.flat(0xffffff, 0.5, 0.35), blank());
  body.userData.car = true; // 2026-10-28: the kit swaps every body, cab yellow or not, for a real car (kit.ts swapCabs, ?cars=old)
  const cab = k.instances(new T.BoxGeometry(1.7, 0.62, 2.2), k.flat(0x1a2530, 0.6, 0.15), blank());
  const wg = new T.CylinderGeometry(0.34, 0.34, 2.02, 12); wg.rotateZ(PI / 2);
  const wheels = k.instances(wg, k.flat(0x111111, 0.1, 0.8), Array.from({ length: n * 2 }, () => new T.Matrix4()));
  const cols = [0xf2c21b, 0xf2c21b, 0x1f2a36, 0xd8d8d4, 0x8a1c1c, 0x3a4a5a, 0x5a6a7a, 0xf2c21b];
  const c = new T.Color(), st = Array.from({ length: n }, (_, i) => ({ lane: lanes[i % lanes.length], s: rnd() * len, v: 5 + rnd() * 4 }));
  st.forEach((_, i) => body.setColorAt(i, c.set(cols[Math.floor(rnd() * cols.length)])));
  if (body.instanceColor) body.instanceColor.needsUpdate = true;
  const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), one = new T.Vector3(1, 1, 1), up = new T.Vector3(0, 1, 0);
  const place = (_t: number, dt: number) => {
    st.forEach((a, i) => {
      a.s = (a.s + a.v * Math.min(dt, 0.1)) % len;
      const d = (a.s - len / 2) * a.lane.dir;
      q.setFromAxisAngle(up, axis === 'z' ? (a.lane.dir > 0 ? 0 : PI) : (a.lane.dir > 0 ? PI / 2 : -PI / 2));
      for (const w of [0, 1]) { const off = (w ? 1.4 : -1.4) * a.lane.dir; if (axis === 'z') p.set(a.lane.at, 0.34, d + off); else p.set(d + off, 0.34, a.lane.at); m.compose(p, q, one); wheels.setMatrixAt(i * 2 + w, m); }
      if (axis === 'z') p.set(a.lane.at, 0.72, d); else p.set(d, 0.72, a.lane.at);
      m.compose(p, q, one); body.setMatrixAt(i, m);
      p.y = 1.42; if (axis === 'z') p.z -= 0.3 * a.lane.dir; else p.x -= 0.3 * a.lane.dir;
      m.compose(p, q, one); cab.setMatrixAt(i, m);
    });
    body.instanceMatrix.needsUpdate = cab.instanceMatrix.needsUpdate = wheels.instanceMatrix.needsUpdate = true;
  };
  place(0, 0);
  if (animate) k.ticks.push(place);
}

/* Steam off a hot table: translucent puffs rising and spreading, one draw. */
function steamZ(k: Parameters<RoomDef['build']>[0], pts: T.Vector3[], perPt: number, animate: boolean, seed: number) {
  const n = pts.length * perPt, rnd = X.mulberry(seed);
  const o = k.instances(new T.SphereGeometry(0.09, 6, 5), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, depthWrite: false }), Array.from({ length: n }, () => new T.Matrix4()));
  const ph = Array.from({ length: n }, (_, i) => ({ b: pts[i % pts.length], o: rnd(), dx: (rnd() - 0.5) * 0.5, dz: (rnd() - 0.5) * 0.3 }));
  const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), s = new T.Vector3();
  const place = (t: number) => {
    ph.forEach((a, i) => { const u = (t * 0.28 + a.o) % 1, sc = 0.6 + u * 2.2; p.set(a.b.x + a.dx * (1 + u * 3), a.b.y + u * 1.4, a.b.z + a.dz * (1 + u * 3)); s.setScalar(sc * (1 - u * 0.3)); m.compose(p, q, s); o.setMatrixAt(i, m); });
    o.instanceMatrix.needsUpdate = true;
  };
  place(0.5);
  if (animate) k.ticks.push(place);
}

/* ---------------- 122 KATZ'S DELICATESSEN ---------------- */
export const katz: RoomDef = {
  id: 'katz',
  name: "Katz’s: The portrait lunch",
  area: "KATZ’S DELICATESSEN / LOWER EAST SIDE",
  mood: 'Houston Street, lunchtime',
  color: '#b8262a',
  description: 'The corner of Houston and Ludlow since 1888: the red sign band, salamis in the window, a ticket at the door, the long cutting counter with its numbered stations, and the wall of regulars, every one of them a New Yorker.',
  signatures: 'The corner sign band and neon, salamis hung in the windows, the ticket at the door, the numbered cutting stations, steam tables, the tin ceiling and ceiling fans, the photo wall of regulars, the table where Harry met Sally.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ed0, horizon: 0xe9e4d6, ground: 0x5b544a, fog: 0.0028, sun: { az: 0.9, el: 0.55, color: 0xfff0d2, size: 14 }, env: 0.9 });
    k.hemi(0xfff1dc, 0x4a423a, 0.9);
    k.sun(0xffefd0, 2.1, 34, 42, 26, true, 70);
    // 2026-11-24 wave 7a: the brick, floor, tile, panelling, counter wood and steel are Poly Haven scans (tex/katz/)
    const tin = k.pbr('katzTin', X.ashlar(0xe3dfd4, 15, 6), 1.5, { metalness: 0.45, roughness: 0.45 }),
      tile = w7Scan(k, 'katz', 'long_white_tiles', 1.2, () => X.subwayTile(0xf1eee4, 0x3a3a36), { color: 0xf4f0e6, roughness: 0.3 }, 0xe8e4da),
      floorT = w7Scan(k, 'katz', 'terrazzo_tiles', 1.8, () => X.terrazzo(0xcfc6b4, 61), { color: 0xe2d8c4, roughness: 0.45 }, 0xbdb3a0),
      plaster = k.pbr('katzPlaster', X.plaster(0xe8e0cc, 62), 2.2, { roughness: 0.9 }),
      wood = w7Scan(k, 'katz', 'wood_table_worn', 1.6, () => X.planks(0x5e3f2a, 6, 63), { color: 0x8a5a3a, roughness: 0.55 }, 0x4e3424),
      panel = w7Scan(k, 'katz', 'dark_paneled_wood', 2.0, () => X.planks(0x5e3f2a, 6, 66), { color: 0xb08a6a, roughness: 0.5 }, 0x4a3020),
      marble = k.pbr('katzMarble', X.marble(0xe9e5dd, 0x8f8a80, 64), 0.7, { roughness: 0.5 }),
      brick = w7Scan(k, 'katz', 'red_brick_03', 2.4, () => X.brick(0x7a4a3c, 65), { color: 0xd8b0a0, roughness: 0.9 }, 0x6e3e32),
      steel = w7Scan(k, 'katz', 'metal_plate', 1.4, () => X.steel(0xc9ccd0), { color: 0xd8dce0, metalness: 0.85, roughness: 0.3 }, 0xb8bcc0),
      red = k.flat(0xa8181c, 0.1, 0.6),
      cream = k.flat(0xf3ead4, 0, 0.8),
      dark = k.flat(0x1e1a18, 0.2, 0.7),
      salami = k.flat(0x6e241f, 0.05, 0.65),
      glass = k.glass(0xdcecf2, 0.16, 0.05),
      neon = k.glow(0xff4a3a),
      neonW = k.glow(0xfff2d8),
      warm = k.glow(0xffe4bc);
    // Houston Street runs along z at x = 26; the store holds the corner lot west of the sidewalk.
    const RX = 26;
    w7Street(k, 'katz', { w: 16, len: 130, z: 0, x: RX });
    blockFront(k, { x: RX + 13, z0: 52, count: 13, face: -1, seed: 71, h: [14, 24] });
    blockFront(k, { x: 13, z0: 50, count: 4, face: 1, seed: 72, h: [14, 20] });
    blockFront(k, { x: 13, z0: -19, count: 5, face: 1, seed: 73, h: [13, 19] });
    k.skyline({ z: -230, count: 26, spacing: 10, scale: 3.2, base: 0, seed: 74, lit: 0.3, rows: 2 });
    for (const z of [30, -30]) k.lamp(RX - 10.6, z, 6.2, k.flat(0x1f262b, 0.75, 0.45), 0xffd9a8, 26);
    k.prop('hydrant', RX - 10.9, 0, 20, { height: 1.1, keepOut: 0.5 });
    k.prop('mailbox', RX - 10.9, 0, -22, { height: 1.5, rotY: PI / 2, keepOut: 0.6 });
    k.prop('utility_pole', RX + 10.6, 0, 6, { height: 11 });
    k.prop('tree', RX - 10.7, 0, 38, { height: 6, keepOut: 0.7 });
    // the building: three floors of red brick over the store, fire escapes, the corner sign band
    const FX = 13, W = 33, D = 28, H = 6.6;
    k.box(W, 16, D, FX - W / 2, H + 8, 0, brick);
    k.box(W, H + 0.4, 0.4, FX - W / 2, H / 2, D / 2 + 0.35, brick);
    k.box(W, H + 0.4, 0.4, FX - W / 2, H / 2, -D / 2 - 0.35, brick);
    k.box(0.4, H + 0.4, D + 1.2, FX - W - 0.35, H / 2, 0, brick);
    k.moulding([[0, 0], [0.7, 0], [0.8, 0.2], [0.5, 0.35], [0.6, 0.55], [0.25, 0.75], [0, 0.85]], D, FX - 0.05, H + 15.5, 0, k.pbr('nbCornice', X.plaster(0xb8ad9a, 3), 0.6), 0);
    // 2026-11-24 wave 7a: the upper windows read as windows (they were blank cream panels): dark sash glass in a cream
    // frame, a stone sill and a brick soldier lintel, some lit from inside
    { const pane = k.flat(0x1a2430, 0.7, 0.12), frame = k.flat(0xe6e0d2, 0, 0.7), sill = k.flat(0xb8b0a0, 0, 0.85), lin = k.flat(0x6a3a2e, 0, 0.9), rw = X.mulberry(65);
      for (let y = H + 4.2; y < H + 15; y += 3.4) for (let dz = -11; dz <= 11; dz += 3.6) {
        k.box(0.12, 2.1, 1.4, FX + 0.02, y, dz, frame); k.box(0.04, 1.86, 1.16, FX + 0.09, y, dz, rw() > 0.86 ? k.glow(0xb88a58) : pane);
        k.box(0.06, 0.05, 1.16, FX + 0.11, y, dz, frame);
        k.box(0.28, 0.12, 1.7, FX + 0.12, y - 1.12, dz, sill); k.box(0.16, 0.3, 1.6, FX + 0.06, y + 1.2, dz, lin);
      } void glass; }
    // 2026-11-24 wave 7a budget pass: these four were 145k triangles in the sun's shadow pass alone; they cast none now
    const noShadow = (o: T.Object3D | null) => o?.traverse((c) => { c.castShadow = false; });
    void k.prop('fire_escape', FX + 1.05, H + 3.2, -5, { height: 3.2, rotY: -PI / 2 }).then(noShadow);
    void k.prop('fire_escape', FX + 1.05, H + 6.6, -5, { height: 3.2, rotY: -PI / 2 }).then(noShadow);
    void k.prop('fire_escape', FX + 1.05, H + 9.9, 6, { height: 3.2, rotY: -PI / 2 }).then(noShadow);
    void k.prop('water_tower', FX - 12, H + 16, -4, { height: 6 }).then(noShadow);
    // the sign band: KATZ'S DELICATESSEN in cream on red, wrapping the corner, with the neon over the door
    // 2026-11-24 wave 7a: a deep box sign in the house lettering (our type, the deli's colours), a running border of
    // bulbs, and a blade sign on the corner stacked letter over letter in red neon
    k.box(0.9, 2.5, D + 0.6, FX + 0.3, H + 1.6, 0, red);
    for (const y of [H + 0.38, H + 2.82]) k.box(1.0, 0.12, D + 0.7, FX + 0.32, y, 0, cream);
    w7Sign(k, 'KATZ’S DELICATESSEN', 24, 1.45, FX + 0.77, H + 2.0, -0.4, PI / 2, '#f6e9c8', '', 'W2 Archivo Expanded', false, undefined, 0.78);
    w7Sign(k, 'KNOWN AS THE BEST  ·  SINCE 1888', 13, 0.5, FX + 0.77, H + 0.86, -0.4, PI / 2, '#f6e9c8', '', 'W2 Archivo Expanded', false, undefined, 0.7);
    k.box(0.9, 2.5, 1.0, FX - 0.15, H + 1.6, D / 2 + 0.3, red);
    {
      const ev: T.Matrix4[] = [], od: T.Matrix4[] = [], one = v(1, 1, 1), q = new T.Quaternion();
      let n = 0; for (const y of [H + 0.5, H + 2.7]) for (let z = -D / 2 - 0.1; z <= D / 2 + 0.2; z += 0.42) (n++ % 2 ? od : ev).push(new T.Matrix4().compose(v(FX + 0.8, y, z), q, one));
      const bulbA = new T.MeshBasicMaterial({ color: 0xfff0c8 }), bulbB = new T.MeshBasicMaterial({ color: 0x6a5a40 }), bg = new T.SphereGeometry(0.075, 5, 3);
      k.instances(bg, bulbA, ev).castShadow = false; k.instances(bg, bulbB, od).castShadow = false;
      if (!ctx.reduced) { let ph = -1; k.ticks.push((t) => { const p = Math.floor(t * 2.6) % 2; if (p === ph) return; ph = p; bulbA.color.setHex(p ? 0x6a5a40 : 0xfff0c8); bulbB.color.setHex(p ? 0xfff0c8 : 0x6a5a40); }); }
      // the blade on the corner of Ludlow: a red box standing proud of the brick, KATZ'S down both faces
      const bz = D / 2 - 0.5, bx = FX + 1.05, by0 = H + 3.3;
      k.box(1.7, 6.4, 0.46, bx, by0 + 3.1, bz, red);
      k.box(1.78, 0.1, 0.5, bx, by0 - 0.06, bz, cream); k.box(1.78, 0.1, 0.5, bx, by0 + 6.32, bz, cream);
      for (const [dx, dy] of [[-0.6, 0], [0.6, 0], [0, -0.4]]) k.beam(v(FX, by0 + 1 + dy, bz + dx * 0.3), v(bx + 0.8, by0 + 0.4 + dy, bz), 0.025, k.flat(0x1f262b, 0.75, 0.45), 4);
      'KATZ’S'.split('').forEach((ch, i) => { for (const sd of [-1, 1]) { const o = w7Neon(k, ch, 1.3, 1.0, bx, by0 + 5.65 - i * 1.02, bz + sd * 0.24, sd > 0 ? 0 : PI, '#ff3020'); void o; } });
      k.point(bx, by0 + 3, bz + 1.6, 0xff4a3a, 30, 12);
    }
    w7Neon(k, 'KATZ’S', 5, 1.4, FX + 0.5, H + 4.4, 9.5, PI / 2, '#ff3a2a');
    const neonTube = k.box(0.08, 0.14, 5.6, FX + 0.42, H + 3.5, 9.5, neon);
    k.point(FX + 1.4, H + 4.2, 9.5, 0xff6a5a, 46, 16);
    // the storefront: two salami windows and the corner door on Houston
    k.box(0.4, 0.9, D, FX, 0.45, 0, wood);
    k.box(0.35, H - 0.9, 1.4, FX, H / 2 + 0.45, -D / 2 + 0.7, wood);
    k.box(0.35, H - 0.9, 1.4, FX, H / 2 + 0.45, 0, wood);
    k.box(0.35, H - 0.9, 1.4, FX, H / 2 + 0.45, 6.6, wood);
    k.box(0.12, 4.6, 12.2, FX, 3.2, -6.7, glass);
    k.box(0.12, 4.6, 5.2, FX, 3.2, 3.3, glass);
    k.box(0.35, H - 5.4, 12.2, FX, H - 0.6, -6.7, wood);
    k.box(0.35, H - 5.4, 5.2, FX, H - 0.6, 3.3, wood);
    k.block(FX - 0.3, FX + 0.3, -D / 2, 7.3);
    // the door: 3.6 m clear, a header, a brass push bar, the ticket sign
    k.box(0.35, 1.6, 4.4, FX, H - 0.8, 9.5, wood);
    k.box(0.35, H, 1.0, FX, H / 2, 12.2, wood);
    k.block(FX - 0.3, FX + 0.3, 11.7, D / 2);
    k.box(0.06, 3.9, 1.1, FX + 0.05, 2.0, 7.9, glass);
    k.box(0.06, 3.9, 1.1, FX + 0.05, 2.0, 11.1, glass);
    k.sign('PLEASE DON’T LOSE YOUR TICKET', 3.4, 0.5, FX - 0.5, 4.9, 9.5, '#f3ead4', '#7a1a1a', 74, -PI / 2, { border: true });
    const ticketBox = k.box(0.5, 0.6, 0.4, FX - 1.2, 1.35, 12.6, red);
    k.box(0.1, 0.1, 0.5, FX - 1.0, 1.7, 12.6, steel);
    k.keepOut.push({ x: FX - 1.2, z: 12.6, r: 0.5 });
    // salamis in the windows, hung from a steel rail, the famous shipping sign between them
    // 2026-11-24 wave 7a: the windows packed the way the real ones are, two rails of cured salamis in their string
    // nets, a hundred of them in one draw, and a neon in each window in our lettering
    const salamiGeo = w7SalamiGeo(1.0, 0.13), salamiMat = w7SalamiMat(k), salMs: T.Matrix4[] = [], strMs: T.Matrix4[] = [];
    const srs = X.mulberry(1888);
    const hang = (x: number, z: number, top: number, len: number, rail = 5.3, r = 1) => { salMs.push(new T.Matrix4().compose(v(x, top, z), new T.Quaternion().setFromEuler(new T.Euler((srs() - 0.5) * 0.06, srs() * PI, (srs() - 0.5) * 0.06)), v(r * (0.9 + srs() * 0.25), len, r * (0.9 + srs() * 0.25)))); strMs.push(new T.Matrix4().compose(v(x, (top + rail) / 2, z), new T.Quaternion(), v(1, rail - top, 1))); };
    for (const [z0, z1] of [[-12.7, -1.0], [1.0, 5.7]]) for (const [x, off] of [[FX - 0.5, 0]]) for (let z = z0 + off; z <= z1; z += 0.34) hang(x, z + (srs() - 0.5) * 0.06, 4.95 - srs() * 0.25, 1.0 + srs() * 0.6);
    k.box(0.05, 0.05, D - 4, FX - 0.5, 5.3, -1, steel);
    w7Neon(k, 'PASTRAMI', 3.4, 0.8, FX - 0.18, 2.05, -9.6, PI / 2, '#ff3a2a');
    w7Neon(k, 'CORNED BEEF', 3.6, 0.7, FX - 0.18, 2.05, -3.7, PI / 2, '#3aa8ff');
    w7Neon(k, 'HOT DOGS', 3.0, 0.7, FX - 0.18, 2.05, 3.3, PI / 2, '#ffc83a');
    const armySign = k.sign('SEND A SALAMI TO YOUR BOY IN THE ARMY', 6.6, 0.7, FX - 0.42, 5.75, -6.7, '#1f4a3a', '#f3ead4', 66, -PI / 2, { double: true });
    // the room: terrazzo, tile to the dado, cream plaster above, tin overhead, three fans
    k.box(W, 0.3, D, FX - W / 2, -0.15, 0, floorT);
    k.box(W, 0.3, D, FX - W / 2, H, 0, tin);
    const LX = FX - W;
    k.box(0.3, H, D, LX + 0.15, H / 2, 0, plaster);
    k.box(0.3, 1.9, D, LX + 0.16, 0.95, 0, tile);
    k.box(W, H, 0.3, FX - W / 2, H / 2, -D / 2 + 0.15, plaster);
    k.box(W, 1.9, 0.3, FX - W / 2, 0.95, -D / 2 + 0.16, tile);
    k.box(W, H, 0.3, FX - W / 2, H / 2, D / 2 - 0.15, plaster);
    k.box(W, 1.9, 0.3, FX - W / 2, 0.95, D / 2 - 0.16, tile);
    k.block(LX - 0.3, LX + 0.3, -D / 2, D / 2);
    k.block(LX, FX, -D / 2 - 0.3, -D / 2 + 0.3);
    k.block(LX, FX, D / 2 - 0.3, D / 2 + 0.3);
    // 2026-11-24 wave 7a: the globes and fans are real models now (w7Katz); the lamps' light stays here
    for (const x of [-12, -2, 8]) for (const z of [-4, 6]) k.point(x, H - 1.5, z, 0xffe0b8, 28, 16);
    // the counter along the back: the long cutting counter, steam tables, the numbered stations, the salami rail
    const CZ = -9.4;
    k.box(W - 6, 1.15, 1.3, FX - W / 2 - 2, 0.58, CZ, wood);
    k.box(W - 5.8, 0.12, 1.5, FX - W / 2 - 2, 1.2, CZ, marble);
    k.box(W - 6, 0.7, 1.0, FX - W / 2 - 2, 1.62, CZ - 0.1, glass);
    k.box(W - 6, 0.06, 1.2, FX - W / 2 - 2, 2.0, CZ - 0.1, steel);
    k.block(LX + 3, FX - 5, CZ - 0.8, CZ + 0.8);
    for (let x = LX + 4; x < FX - 5; x += 3.3) k.point(x, 1.5, CZ, 0xfff0d0, 1.6, 2.2);
    k.box(W - 6, 1.1, 1.6, FX - W / 2 - 2, 0.55, -D / 2 + 1.4, steel);
    k.box(W - 6, 0.08, 1.7, FX - W / 2 - 2, 1.14, -D / 2 + 1.4, k.flat(0xd8dadc, 0.9, 0.2));
    k.block(LX + 3, FX - 5, -D / 2, -D / 2 + 2.2);
    for (let i = 0; i < 7; i++) {
      const x = LX + 5 + i * 3.7;
      k.sign(String(i + 1), 0.9, 0.9, x, 4.3, CZ - 1.4, '#7a1a1a', '#f6e9c8', 160, 0, { double: true });
      k.beam(v(x, 4.75, CZ - 1.4), v(x, H, CZ - 1.4), 0.015, steel, 4);
      k.box(3.2, 0.14, 0.9, x, 3.6, CZ - 0.6, warm);
      k.point(x, 3.3, CZ - 0.4, 0xffe8c8, 5, 6);

    }
    k.box(0.05, 0.05, 0.05, 0, 0, 0, steel).visible = false;
    k.box(W - 6, 0.05, 0.05, FX - W / 2 - 2, 2.85, CZ - 2.2, steel);
    for (let x = LX + 3.6; x < FX - 5.4; x += 1.1) hang(x, CZ - 2.2 + (srs() - 0.5) * 0.08, 2.72 - srs() * 0.1, 0.7 + srs() * 0.45, 2.85, 0.85);
    k.instances(salamiGeo, salamiMat, salMs).castShadow = false;
    k.instances(new T.CylinderGeometry(0.006, 0.006, 1, 3), k.flat(0xe8dcc4, 0, 0.9), strMs).castShadow = false;
    void salami;
    // the menu boards over the steam tables
    k.sign('PASTRAMI · CORNED BEEF · BRISKET · TONGUE · SALAMI · TURKEY', 14, 0.7, LX + 10, 5.5, -D / 2 + 0.35, '#111111', '#f6e9c8', 38, 0, { border: true });
    k.sign('KNISHES · HOT DOGS · MATZO BALL SOUP · EGG CREAMS · DR BROWN’S', 12, 0.6, FX - 12, 5.5, -D / 2 + 0.35, '#111111', '#f6e9c8', 36, 0, { border: true });
    // tables and chairs, and the one table everyone asks for
    // 2026-11-24 wave 7a: the tables and chairs are the real models from the ON LOCATION deli set (w7Katz places them)
    const table = (x: number, z: number) => { k.keepOut.push({ x, z, r: 1.55 }); };
    for (const x of [-13, -8, -3, 2, 7]) for (const z of [-3.5, 2.5]) table(x, z);
    for (const x of [-13, -8, -3, 2]) table(x, 8.5);
    const harrySign = k.sign('WHERE HARRY MET SALLY · HOPE YOU HAVE WHAT SHE HAD!', 3.6, 0.55, -5, 4.3, 2.5, '#f6e9c8', '#7a1a1a', 60, 0, { border: true, double: true });
    k.beam(v(-5, 4.58, 2.5), v(-5, H, 2.5), 0.015, steel, 4);
    // the regulars: the photo wall becomes the census, floor to ceiling along the table wall
    k.censusWall({ x: LX + 10, y: 3.35, z: D / 2 - 0.34, rotY: PI, cols: 24, rows: 6, tile: 0.62, gap: 0.05, start: ctx.wallStart(2400, 144), pieces: ctx.all, backing: wood });
    // life: the counter line, the sidewalk, a neon that hums
    if (!ctx.reduced) {
      k.crowd([v(FX - 6, 0, CZ + 1.8), v(LX + 4, 0, CZ + 1.8)], 6, { seed: 19, speed: 0.12, spread: 0.5, colors: [0x2a2f3a, 0x6b4f3a, 0x8f2a2a, 0xd9cbb0, 0x3c5a7a] });
      k.crowd([v(RX - 8.7, 0, -60), v(RX - 8.7, 0, 60)], 4, { seed: 21, speed: 0.7, spread: 1.6 });
      // 2026-11-24 budget pass: the far sidewalk walkers (round the spawn) are gone; the line and the near walk stay
      let hum = 0; k.ticks.push((t) => { hum = 0.86 + 0.14 * Math.sin(t * 9.1) * Math.sin(t * 0.7); (neonTube.material as T.MeshBasicMaterial).opacity = hum; });
    }
    // the painted sign on the Ludlow side of the building, where the signmaker put exactly what he was told
    const thatsAll = k.sign('KATZ’S  THAT’S ALL!', 10, 2.0, FX - 5.6, H + 11.2, D / 2 + 0.07, 'transparent', '#f1e6c8', 250, 0);
    // the carving stations: a pastrami on every board, a stack of slices, and at station 4 a carver's knife at work
    const crust = k.flat(0x4a1e14, 0, 0.85), pink = k.flat(0xc2605a, 0, 0.6), board = k.flat(0xd9c7a0, 0, 0.8);
    let curePastrami: T.Mesh | null = null;
    for (let i = 0; i < 7; i++) {
      const x = LX + 5 + i * 3.7;
      k.box(0.9, 0.05, 0.5, x, 1.29, CZ - 0.25, board);
      const slab = k.box(0.55, 0.22, 0.3, x - 0.1, 1.42, CZ - 0.25, crust);
      if (i === 3) curePastrami = slab;
      for (let s = 0; s < 4; s++) k.box(0.02, 0.16, 0.26, x + 0.24 + s * 0.035, 1.39, CZ - 0.25, pink);
    }
    const knife = new T.Group(); knife.position.set(LX + 5 + 3 * 3.7 + 0.2, 1.62, CZ - 0.25);
    const blade = new T.Mesh(new T.BoxGeometry(0.02, 0.07, 0.42), steel); blade.position.z = 0.05; knife.add(blade);
    const grip = new T.Mesh(new T.BoxGeometry(0.035, 0.05, 0.14), dark); grip.position.z = -0.22; knife.add(grip);
    k.add(knife);
    // the table things: a plate of pickles on every table, a mustard bottle, all instanced
    const tables: [number, number][] = [];
    for (const x of [-13, -8, -3, 2, 7]) for (const z of [-3.5, 2.5]) tables.push([x, z]);
    for (const x of [-13, -8, -3, 2]) tables.push([x, 8.5]);
    const mk = (x: number, y: number, z: number, ry = 0) => new T.Matrix4().compose(v(x, y, z), new T.Quaternion().setFromAxisAngle(v(0, 1, 0), ry), v(1, 1, 1));
    k.instances(new T.CylinderGeometry(0.17, 0.14, 0.03, 16), cream, tables.map(([x, z]) => mk(x - 0.35, 1.12, z)));
    const pick: T.Matrix4[] = [];
    tables.forEach(([x, z], i) => { for (let j = 0; j < 3; j++) { const m = mk(x - 0.4 + j * 0.06, 1.16, z + (j - 1) * 0.05, 0.4 * j + i); m.multiply(new T.Matrix4().makeRotationX(PI / 2)); pick.push(m); } });
    k.instances(new T.CapsuleGeometry(0.035, 0.12, 2, 6), k.flat(0x4f6a2a, 0, 0.5), pick);
    k.instances(new T.CylinderGeometry(0.04, 0.045, 0.22, 8), k.flat(0xe0b020, 0, 0.5), tables.map(([x, z]) => mk(x + 0.45, 1.21, z - 0.2)));
    // the door on Houston swings in and out with the lunch crowd
    const door = new T.Group(); door.position.set(FX - 0.05, 0, 8.45);
    const leaf = new T.Mesh(new T.BoxGeometry(0.06, 3.9, 1.5), glass); leaf.position.set(0, 2.0, 0.75); door.add(leaf);
    const rim = new T.Mesh(new T.BoxGeometry(0.08, 0.2, 1.5), wood); rim.position.set(0, 0.1, 0.75); door.add(rim);
    const push = new T.Mesh(new T.BoxGeometry(0.1, 0.06, 1.1), k.flat(0xc9a24a, 0.9, 0.3)); push.position.set(-0.08, 1.9, 0.8); door.add(push);
    k.add(door);
    // life: Houston Street traffic, steam off the tables, the carvers moving along behind the counter
    traffic(k, [{ at: RX - 4.6, dir: -1 }, { at: RX - 1.2, dir: 1 }], 'z', 130, 4, !ctx.reduced, 123);
    steamZ(k, Array.from({ length: 7 }, (_, i) => v(LX + 5 + i * 3.7, 1.25, -D / 2 + 1.4)), 4, !ctx.reduced, 124);
    if (!ctx.reduced) {
      k.crowd([v(LX + 4, 0, -11), v(FX - 6, 0, -11)], 3, { seed: 125, speed: 0.18, spread: 0.3, colors: [0xf4f2ec, 0xeeeae0, 0xe8e4da] });
      k.ticks.push((t) => { const c = t * 5.2; knife.position.x = LX + 5 + 3 * 3.7 + 0.2 + Math.sin(c) * 0.05; knife.position.y = 1.62 - Math.max(0, Math.sin(c + PI / 2)) * 0.08; });
      k.ticks.push((t) => { const u = (t % 9) / 9, o = u < 0.12 ? u / 0.12 : u < 0.4 ? 1 : u < 0.55 ? 1 - (u - 0.4) / 0.15 : 0; door.rotation.y = -o * o * (3 - 2 * o) * 1.25; });
    }
    // landmark eggs
    const src = { name: 'Katz’s Delicatessen, Our Story', url: 'https://katzsdelicatessen.com/our-story' }, wiki = { name: 'Katz’s Delicatessen, Wikipedia', url: 'https://en.wikipedia.org/wiki/Katz%27s_Delicatessen' };
    void armySign;
    k.egg(v(FX - 0.6, 4.3, -6.7), { id: 'army-salami', title: 'A salami for your boy in the army', year: 'World War II', text: 'During World War II the three sons of the owners were all serving in the armed forces. The family kept sending them food from the deli, and the habit became the store’s slogan. It still hangs in the window.', clue: 'Between the hanging salamis there is a message for someone a long way from home.', source: src }, { r: 1.6 });
    k.egg(ticketBox, { id: 'the-ticket', title: 'Don’t lose your ticket', text: 'At the door everyone is handed a printed, numbered ticket. Each counter adds what you took, and you pay on the way out. Lose it and a surcharge lands on your bill, a rule meant to stop people swapping a big ticket for a small one.', clue: 'The first thing Katz’s gives you is by the door, and you must not lose it.', source: wiki }, { r: 0.8 });
    k.egg(harrySign, { id: 'harry-met-sally', title: 'Where Harry met Sally', year: '1989', text: 'The famous deli scene in the 1989 film When Harry Met Sally was shot here. The table where Meg Ryan and Billy Crystal sat is marked with a sign hung over it.', clue: 'One table in this room is more famous than all the others. Look for what hangs above it.', source: wiki }, { r: 1.4 });
    k.egg(thatsAll, { id: 'thats-all', title: 'Katz’s, that’s all', text: 'When a signmaker asked partner Harry Tarowsky what the sign should say, he answered: Katz’s, that’s all. The signmaker painted exactly that, and it is still on the side of the building.', clue: 'Walk up the sidewalk and read the side of the building, high above the corner.', source: wiki }, { r: 3 });
    if (curePastrami) k.egg(curePastrami, { id: 'thirty-day-cure', title: 'Thirty days in the cure', text: 'Katz’s says its pastrami and corned beef can take up to a full 30 days to cure. Commercial corned beef is often pumped with brine to cure in 36 hours.', clue: 'Watch the knife at the fourth station, and ask how long that meat has been waiting.', source: src }, { r: 0.9 });
    w7Katz(k, ctx, { FX, W, D, H, LX, CZ, RX, tables, panel, wood, cream: k.flat(0xf3ead4, 0, 0.8), wiki });
    // the hang
    const mounts: Mount[] = [];
    const at = (x: number, y: number, z: number, tx: number, tz: number, w: number, h: number, style: FrameStyle = 'black', wash = false): Mount => ({ position: v(x, y, z), rotation: Math.atan2(tx - x, tz - z), target: v(tx, 3, tz), width: w, height: h, style, wash });
    for (let i = 0; i < 5; i++) { const z = -6 + i * 4.3; mounts.push(at(LX + 0.34, 3.6, z, LX + 4.6, z, 3.4, 2.1, 'oak')); }
    for (const x of [FX - 9, FX - 5]) mounts.push(at(x, 3.7, D / 2 - 0.34, x, D / 2 - 6, 3.2, 2.0, 'oak'));
    for (let i = 0; i < 4; i++) { const x = LX + 6 + i * 6.4; mounts.push(at(x, 4.35, -D / 2 + 0.34, x, CZ + 2.5, 3.0, 1.8, 'black')); }
    for (let i = 0; i < 5; i++) { const x = LX + 5.5 + i * 4.6; mounts.push(at(x, 1.72, CZ + 0.68, x, CZ + 4, 1.7, 0.95, 'none')); }
    for (const z of [-11, -7.4, -3.8, 3.3]) mounts.push({ position: v(FX + 0.34, 3.1, z), rotation: PI / 2, target: v(FX + 3.6, 3, z), width: 2.4, height: 1.5, style: 'none', wash: false, lookAt: v(FX, 3.1, z) });
    return { mounts, spawn: v(RX + 9.5, 3, 15), look: v(FX - 1, 5.2, 5), eye: 3, bounds: [LX + 0.6, RX + 12.4, -D / 2 + 0.6, 44], style: 'oak' };
  },
};

/* THE BIG UPGRADE wave 7a, Katz's: the room round the hang. Real models from the ON LOCATION When Harry Met Sally
   set and Poly Haven (assets/museum/props/katz/), the line on Houston Street, the photo wall run up to the ceiling,
   and the one trick: the ticket rule painted flat on the terrazzo, standing up from just inside the door. */
function w7Katz(k: K7, ctx: Parameters<RoomDef['build']>[1], g: { FX: number; W: number; D: number; H: number; LX: number; CZ: number; RX: number; tables: [number, number][]; panel: T.Material; wood: T.Material; cream: T.Material; wiki: { name: string; url: string } }) {
  const { FX, D, H, LX, CZ, RX } = g;
  // the illusion: from the brass ring inside the door the floor reads DON'T LOSE YOUR TICKET, standing up
  const eye = v(FX - 1.5, 3, 9.5);
  { const t = w7Type('DON’T LOSE YOUR TICKET', ['#b8262a', '#b8262a', '#1e1a18'], 1024, 256); if (t) anamorphTex(k, t, eye.x, eye.z, eye.y, 0.0, PI / 2, 3.0, 3.8, 0.95, 0.9); }
  k.torus(0.3, 0.02, eye.x, 0.016, eye.z, k.flat(0xc9a24a, 0.9, 0.3), 24).rotation.x = PI / 2;
  k.egg(v(eye.x, 1.2, eye.z), { id: 'ticket-floor', title: 'The rule on the floor', year: 'an illusion', text: 'Stand on the brass ring just inside the door and the house rule stands up in front of you. It is painted flat on the terrazzo and stretched in the perspective of that one spot, the pavement artist\'s trick called anamorphosis. Take a step and the letters lie down again.', clue: 'A brass ring on the floor just inside the door.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 0.7 });
  // the line on Houston Street: brass posts and a red rope from the door up the sidewalk, people waiting
  const posts: T.Matrix4[] = [];
  for (let z = 11.8; z <= 27; z += 2.4) posts.push(new T.Matrix4().setPosition(FX + 3.6, 0.14, z));
  k.instances(new T.CylinderGeometry(0.04, 0.12, 1.0, 10).translate(0, 0.5, 0), k.flat(0xc9a24a, 0.9, 0.28), posts).castShadow = false;
  for (let z = 11.8; z < 26; z += 2.4) k.curve([v(FX + 3.6, 1.0, z), v(FX + 3.6, 0.78, z + 1.2), v(FX + 3.6, 1.0, z + 2.4)], 0.025, k.flat(0x8a1418, 0, 0.6), 8);
  if (!ctx.reduced) k.crowd([v(FX + 2.6, 0.14, 26), v(FX + 2.6, 0.14, 11.2)], 4, { seed: 1888, speed: 0.04, spread: 0.45, colors: [0x2a2f3a, 0x6b4f3a, 0x8f2a2a, 0xd9cbb0, 0x3c5a7a, 0x1e1e22] });
  k.sign('LINE STARTS HERE', 1.5, 0.3, FX + 3.6, 1.35, 27.2, '#8a1418', '#f6e9c8', 70, PI / 2, { double: true });
  // Firefly: the painted ghost sign on the Ludlow wall and the window of regulars' photos (FIREFLY_QUEUE.md)
  w7Plate(k, 'assets/museum/tex/katz/ff_ludlow_ghost_sign.webp', 12, 6, FX - 21, H + 8.2, D / 2 + 0.04, 0);
  w7Plate(k, 'assets/museum/tex/katz/ff_photo_wall.webp', 9.6, 1.2, LX + 0.33, 5.85, 1.5, PI / 2);
  // the deli's own furniture: the set's tables and chairs, pickle barrels by the counter, the clock over the door
  w7Place(k, 'katz/katz_table', { height: 1.1 }, g.tables.map(([x, z]) => [x, 0, z, PI / 2]));
  const chairs: number[][] = [];
  g.tables.forEach(([x, z]) => { chairs.push([x - 1.25, 0, z, PI / 2]); chairs.push([x + 1.25, 0, z, -PI / 2]); });
  w7Place(k, 'katz/katz_chair', { height: 1.35 }, chairs);
  w7Place(k, 'katz/katz_pickles', { height: 1.25 }, [[FX - 2.6, 0, -12.3, 0.4], [FX - 2.6, 0, -11.0, 2.1]]);
  for (const [x, z] of [[FX - 2.6, -12.3], [FX - 2.6, -11.0]]) k.keepOut.push({ x, z, r: 0.65 });
  w7Place(k, 'katz/katz_clock', { width: 0.9 }, [[FX - 0.3, 5.45, 9.5, -PI / 2]]);
  // the ceiling: three fans turning, six enamel shades where the globes hung
  w7Place(k, 'katz/ceiling_fan', { width: 2.4 }, [[-14, H - 0.85, 1, 0], [-4, H - 0.85, 1, 1], [6, H - 0.85, 1, 2]], undefined, (os) => {
    if (!ctx.reduced) k.ticks.push((t) => os.forEach((o, i) => { o.rotation.y = t * 2.6 + i; }));
  });
  const shades: number[][] = [];
  for (const x of [-12, -2, 8]) for (const z of [-4, 6]) shades.push([x, H - 1.35, z, 0]);
  w7Place(k, 'katz/industrial_lamp', { height: 1.35 }, shades);
  // the photo wall run up to the ceiling: framed pictures in a row along the top of the walls, two sizes alternating
  const fa: number[][] = [], fb: number[][] = [];
  let n = 0;
  for (const z of [-12.6, -11.7, -10.8, -9.9, -9.0, -8.1, -7.2, -6.3, -5.4, -4.5, 7.2, 8.1, 9.0, 9.9, 10.8, 11.7, 12.6]) (n++ % 2 ? fa : fb).push([LX + 0.32, 5.62 + (n % 3) * 0.08, z, PI / 2]);
  for (let x = LX + 1.0; x < FX - 0.6; x += 1.3) (n++ % 2 ? fa : fb).push([x, 5.62 + (n % 3) * 0.08, D / 2 - 0.32, PI]);
  w7Place(k, 'katz/katz_frame_a', { height: 0.6 }, fa);
  w7Place(k, 'katz/katz_frame_b', { height: 0.55 }, fb);
  // Sally, from MLow's cast, by the table everybody asks for
  w7Place(k, 'katz/sally', { height: 2.45 }, [[-6.4, 0, 5.4, 0.6]]);
  k.keepOut.push({ x: -6.4, z: 5.4, r: 0.5 });
  void RX; void CZ;
}

/* ---------------- 123 BARNEY GREENGRASS ---------------- */
/* The store is MLow's own Blender model of the Amsterdam Avenue shop (assets/museum/props/barney_greengrass.glb),
   placed at 1.5 times life so it sits at museum scale. Blender x, y, z became x, height, -z; every number
   below is a Blender measurement times 1.5. The collision follows the real walls, the case and the tables.
   2026-10-12: the front room was mirrored to match the shop (barney_mirror.py, the untouched model is kept in the
   collab kit): you come in off Amsterdam Avenue to the appetizing case along the right wall with the chalkboards
   behind it, a few small formica tables in front of it, the bakery shelves against the partition on the left,
   and the dining room through the doorway on the left, wallpapered with New Orleans since the 1950s. The regulars
   hang on the wallpaper; Moe's Chachkas, MLow's merch for the store, hangs in the front room, dithered. */
/* The Blender model paints most things one flat colour. retex() hangs the museum's CC0 photo surfaces on them by
   material name (colour, normal, roughness), tinted to the model's own colour, with a repeat guessed from what the
   material covers: boxes from Blender map 0 to 1 per face, so a floor needs many repeats and a jar needs one.
   It also hides the crude fish boxes in the case, which the photo cut outs replace. */
const SURF = 'assets/museum/surfaces/';
const KING_H = 970;   // king_cutout.png is 768 wide; its height is written here by hand after the cut (see barney_art.py's neighbour, the cut in the handoff)
const surfTex = new Map<string, T.Texture>();
function surf(file: string, srgb: boolean, rx: number, ry: number, base = SURF) {
  const key = `${base}${file}:${rx}:${ry}`; let t = surfTex.get(key);
  if (!t) { t = new T.TextureLoader().load(base + file); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; if (srgb) t.colorSpace = T.SRGBColorSpace; surfTex.set(key, t); }
  return t;
}
const RETEX: Record<string, { kind: string; rx: number; ry: number; tint?: number; rough?: number; metal?: number; normal?: number; scan?: string }> = {
  terrazzo: { kind: 'terrazzo', rx: 8, ry: 14, rough: 0.35, normal: 0.5 },
  wood_floor: { kind: 'planks', rx: 5, ry: 14, tint: 0xc9a27a, rough: 0.6 },
  rail_wood: { kind: 'planks', rx: 1, ry: 12, tint: 0xa8865f }, fan_wood: { kind: 'planks', rx: 1, ry: 1, tint: 0xa8865f },
  wood_dark: { kind: 'planks', rx: 2, ry: 8, tint: 0x6b4a33, rough: 0.55 }, frame_dark: { kind: 'planks', rx: 1, ry: 1, tint: 0x6b4a33 },
  shelf_w: { kind: 'planks', rx: 1, ry: 8, tint: 0xe8dcc4 },
  ceil_tin: { kind: 'steel', rx: 9, ry: 16, tint: 0xeae2d2, rough: 0.5, metal: 0.12, normal: 1.0 },
  wainscot: { kind: 'planks', rx: 12, ry: 1, tint: 0x2f6b46, rough: 0.5, normal: 0.6 },
  wall_green: { kind: 'plaster', rx: 10, ry: 2, tint: 0x6f8f70, rough: 0.9 }, partition: { kind: 'plaster', rx: 10, ry: 2, tint: 0x6f8f70, rough: 0.9 },
  cream: { kind: 'plaster', rx: 10, ry: 3, tint: 0xe8dcc2, rough: 0.9 },
  brick_flat: { kind: 'brick', rx: 6, ry: 3, tint: 0xa0533f }, sill: { kind: 'concrete', rx: 2, ry: 1 }, cornice: { kind: 'concrete', rx: 6, ry: 1 },
  // 2026-11-24 wave 7a: the model's own sidewalk and avenue wear the same Poly Haven scans as the blocks beside it
  sidewalk: { kind: 'concrete', rx: 10, ry: 3, tint: 0xc8c2b6, rough: 0.9, scan: 'concrete_pavement' }, curb: { kind: 'concrete', rx: 10, ry: 1, tint: 0x8a8782 }, asphalt: { kind: 'asphalt', rx: 6, ry: 3, tint: 0x8c8c8c, rough: 0.9, scan: 'asphalt_02' },
  case_white: { kind: 'marble', rx: 2, ry: 6, tint: 0xf1ede4, rough: 0.3, normal: 0.2 }, steel: { kind: 'steel', rx: 1, ry: 6, rough: 0.3, metal: 0.9 },
  formica: { kind: 'terrazzo', rx: 2, ry: 2, tint: 0xf0ece2, rough: 0.35, normal: 0.15 }, tbl_white: { kind: 'terrazzo', rx: 2, ry: 2, tint: 0xf0ece2, rough: 0.35, normal: 0.15 },
  cloth: { kind: 'plaster', rx: 2, ry: 2, tint: 0xf2eee6, rough: 0.9 }, chair_grn: { kind: 'patina', rx: 1, ry: 1, tint: 0x24513a, rough: 0.45, normal: 0.3 },
  beam: { kind: 'planks', rx: 4, ry: 1, tint: 0xd8cfbd }, clock_w: { kind: 'plaster', rx: 1, ry: 1, tint: 0xf4f1ea },
};
const GLASSY: Record<string, number> = { glass: 0.22, glass_cup: 0.3, curtain: 0.7 };
const HIDE = new Set(['M_Counter_salmon', 'M_Counter_whitefish', 'fish_2', 'M_Food_lox', 'M_Food_bagel', 'M_Food_latke', 'M_Food_plate_grn']);
/* The three chalkboards over the case. The model's own boards priced caviar by the ounce and little else; these
   are the store's real categories at prices a person pays at the counter in 2026, by the quarter pound where
   the real board sells by the quarter pound. Drawn as chalk on slate, cream for the items, the store's red for
   the headings. One canvas per board, assigned by the model's material name. */
const BOARDS: Record<string, { title: string; sub: string; items: [string, string][] }> = {
  img_chalk_0: { title: 'SMOKED FISH', sub: 'BY THE QUARTER POUND', items: [['Nova Scotia salmon', '18'], ['Scotch salmon', '19'], ['Gaspe salmon', '19'], ['Kippered salmon', '15'], ['Pastrami salmon', '17'], ['Gravlax', '17'], ['Sturgeon', '26'], ['Sable', '17'], ['Whitefish, by the piece', '14'], ['Smoked trout', '13'], ['Belly lox', '15'], ['Baked salmon', '15']] },
  img_chalk_1: { title: 'APPETIZING', sub: 'HERRING, SALADS, SPREADS', items: [['Matjes herring', '7.50'], ['Schmaltz herring', '7.50'], ['Pickled herring', '6.50'], ['Herring in cream sauce', '7.50'], ['Chopped herring', '9'], ['Whitefish salad', '11'], ['Baked salmon salad', '11'], ['Chopped liver', '9'], ['Egg salad', '6'], ['Cream cheese, plain', '4.50'], ['Vegetable cream cheese', '5'], ['Bagel · bialy · roll', '2.50']] },
  img_chalk_2: { title: 'SANDWICHES', sub: 'ON A BAGEL, BIALY OR ROLL  ·  OPEN FACE ADD 2.50', items: [['Nova and cream cheese', '21'], ['Sturgeon', '25'], ['Sturgeon and sable', '30'], ['Sable and cream cheese', '23'], ['Triple Decker No. 3', '29.50'], ['Whitefish salad', '17'], ['Chopped liver', '16'], ['Eggs with onions', '14'], ['Eggs with nova', '19'], ['Latkes, two', '9'], ['Cinnamon babka, slice', '6'], ['Fresh squeezed orange juice', '7']] },
};
const boardTex = new Map<string, T.CanvasTexture>();
function board(name: string) {
  let t = boardTex.get(name); if (t) return t;
  const b = BOARDS[name], W = 1024, H = 740, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = '#1c211e'; g.fillRect(0, 0, W, H);
  const rnd = X.mulberry(name.length * 7 + 3);                      // chalk dust and wiped ghosts
  for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(240,236,220,${0.02 + rnd() * 0.05})`; g.fillRect(rnd() * W, rnd() * H, 2 + rnd() * 5, 1 + rnd() * 2); }
  g.strokeStyle = '#d9c9a0'; g.lineWidth = 6; g.strokeRect(16, 16, W - 32, H - 32);
  g.textAlign = 'center'; g.fillStyle = '#e6b84a'; g.font = '700 74px Georgia, serif'; g.fillText(b.title, W / 2, 96);
  g.fillStyle = '#c9524a'; g.font = '700 26px Helvetica Neue, Arial, sans-serif'; g.fillText(b.sub, W / 2, 136);
  g.strokeStyle = '#c9524a'; g.lineWidth = 3; g.beginPath(); g.moveTo(80, 156); g.lineTo(W - 80, 156); g.stroke();
  g.font = '500 33px Helvetica Neue, Arial, sans-serif';
  b.items.forEach(([n, pr], i) => {
    const y = 206 + i * 46; g.fillStyle = '#f0ead8'; g.textAlign = 'left'; g.fillText(n, 72, y);
    g.textAlign = 'right'; g.fillStyle = '#f7e9b8'; g.fillText(pr, W - 72, y);
    g.strokeStyle = 'rgba(240,234,216,0.25)'; g.lineWidth = 2; g.setLineDash([3, 7]); g.beginPath(); g.moveTo(84 + g.measureText(n).width + 14, y - 8); g.lineTo(W - 84 - g.measureText(pr).width - 10, y - 8); g.stroke(); g.setLineDash([]);
  });
  t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; t.flipY = false; boardTex.set(name, t); return t;   // glTF textures map with flipY off, so must this one
}
function retex(o: T.Object3D) {
  o.traverse((c) => {
    if (!(c instanceof T.Mesh)) return;
    if (HIDE.has(c.name)) { c.visible = false; return; }
    const m = c.material as T.MeshStandardMaterial;
    // the model's glass carries its alpha in the colour factor without an alpha mode, so three draws it solid: the
    // case front was an opaque slab and nothing inside it could be seen
    if (m && GLASSY[m.name] !== undefined) { m.transparent = true; m.opacity = GLASSY[m.name]; m.depthWrite = false; m.needsUpdate = true; return; }
    if (m && BOARDS[m.name] && typeof document !== 'undefined') { m.map = board(m.name); m.color.set(0xffffff); m.roughness = 0.9; m.needsUpdate = true; return; }
    const r = m && RETEX[m.name];
    if (!r) return;
    if (r.scan) {
      const b = 'assets/museum/tex/barney/';
      m.map = surf(`${r.scan}_c.webp`, true, r.rx, r.ry, b); m.normalMap = surf(`${r.scan}_n.webp`, false, r.rx, r.ry, b); m.normalScale.setScalar(r.normal ?? 0.8); m.roughnessMap = surf(`${r.scan}_r.webp`, false, r.rx, r.ry, b);
    } else {
    m.map = surf(`${r.kind}_c_s.jpg`, true, r.rx, r.ry);
    m.normalMap = surf(`${r.kind}_n_s.jpg`, false, r.rx, r.ry); m.normalScale.setScalar(r.normal ?? 0.8);
    m.roughnessMap = surf(`${r.kind}_r_s.jpg`, false, r.rx, r.ry);
    }
    if (r.tint !== undefined) m.color.set(r.tint); else m.color.set(0xffffff);
    if (r.rough !== undefined) m.roughness = r.rough; if (r.metal !== undefined) m.metalness = r.metal;
    m.needsUpdate = true;
  });
}
export const barney: RoomDef = {
  id: 'barney',
  name: 'Barney Greengrass: Sunday regulars',
  area: 'BARNEY GREENGRASS / UPPER WEST SIDE',
  mood: 'A table near the window',
  color: '#2f6b46',
  description: 'The Sturgeon King on Amsterdam Avenue since 1929: green awnings under the red and blue sign, sidewalk tables behind the green rail, the appetizing case on the right as you come in with the chalkboards behind it, the bakery shelves opposite, and through the doorway on the left the dining room with its New Orleans wallpaper, where the regulars hang. Moe\'s Chachkas, the merch MLow drew for the store, covers the front room walls.',
  signatures: 'The three green awnings and the sign band, the sidewalk rail, the terrazzo, the glass appetizing case with its caviar and herring boards and the chalkboards over it, the formica tables, the bakery shelves, the doorway on the left, the faded New Orleans wallpaper, the green wainscot, the wall clock on New York time, the pendant globes.',
  build(k, ctx) {
    k.sky({ top: 0x7fa9d8, horizon: 0xeae6dc, ground: 0x625a50, fog: 0.0026, sun: { az: 2.2, el: 0.5, color: 0xfff0d6, size: 14 }, env: 0.9 });
    k.hemi(0xfff3e2, 0x4d4640, 0.95);
    k.sun(0xffefd4, 1.6, 60, 52, 14, true, 70);
    const S = 1.5;
    const asphalt = w7Scan(k, 'barney', 'asphalt_02', 4, () => X.asphalt(0x24282d), { color: 0x8c8c8c, roughness: 0.92 }, 0x3a3c40),
      pav = w7Scan(k, 'barney', 'concrete_pavement', 2.2, () => X.pavers(0x8e8b84, 5), { color: 0xc8c2b6, roughness: 0.9 }, 0x8e8b84),
      granite = k.pbr('curbS', X.ashlar(0x8a8a86, 4, 2), 0.35),
      white = k.flat(0xdedbd2, 0, 0.7),
      yellow = k.flat(0xe6a626, 0, 0.6),
      iron = k.flat(0x1f262b, 0.75, 0.45),
      warm = k.glow(0xffe1b8),
      green = k.flat(0x1a4a30, 0, 0.8);
    // the store itself: front on z = 0, the street at +z. The kit stands a prop on its bounding box, and this
    // model reaches 0.12 m below its own floor (the sidewalk slab), so the floor is placed by hand at world zero.
    // Before the 2026-10-12 mirror the figure was 1.34: a rotated lox slice's bounding box, not real geometry.
    k.prop('barney_greengrass', 0, -0.12 * S, 0, { scale: S }).then((o) => { if (o) retex(o); });
    // Amsterdam Avenue runs along x in front of the store: the far sidewalk, the road, the near sidewalk are in the model up to z = 17
    for (const s of [-1, 1]) { const x0 = s * 41; k.box(58, 0.28, 6.1, x0, 0.0, 3.4, pav); k.box(58, 0.3, 10.5, x0, -0.15, 11.75, asphalt); k.box(58, 0.3, 0.3, x0, 0.02, 6.55, granite); }
    k.box(150, 0.28, 6, 0, 0.0, 20.2, pav);
    k.box(150, 0.3, 0.3, 0, 0.02, 17.15, granite);
    for (const s of [-1, 1]) for (const dz of [-0.14, 0.14]) k.box(58, 0.012, 0.09, s * 41, 0.01, 11.75 + dz, yellow);
    for (const x of [-40, 40]) for (let z = 7.6; z < 16.5; z += 1.2) k.box(2.8, 0.014, 0.62, x, 0.012, z, white);
    // the neighbours: brownstone fronts beside the store, a taller block across the avenue
    const rnd = X.mulberry(88);
    // 2026-11-24 wave 7a: the neighbours in Poly Haven scans (red brick, brownstone, a darker brick), stone sills and
    // lintels at every window, and on the store's side a shop at the foot of each one: glass, a fabric awning, a fascia
    const fronts = [w7Scan(k, 'barney', 'red_brick_03', 2.4, () => X.brick(0x6b4437, 21), { color: 0xc89888 }, 0x6b4437), w7Scan(k, 'barney', 'red_sandstone_wall', 3, () => X.ashlar(0xb9ad97, 23, 3), { color: 0xb08878 }, 0x7a5444), w7Scan(k, 'barney', 'brick_wall_02', 2.4, () => X.brick(0x4f3b36, 22), { color: 0xa08070 }, 0x4f3b36)];
    const cornice = w7Scan(k, 'barney', 'white_plaster_rough_01', 2, () => X.plaster(0xb8ad9a, 3), { color: 0xc8bca8 }, 0xb8ad9a), glassDark = k.glass(0x9fc4d8, 0.35, 0.08);
    const shopGlass = k.glass(0x2a3440, 0.55, 0.06), shopLit = k.glow(0xffe2b0, 0.55), bulk = k.flat(0x1c2420, 0.4, 0.5);
    const shops = ['CLEANERS  ·  TAILOR', 'HARDWARE', 'PHARMACY', 'SHOE REPAIR', 'WINE AND SPIRITS', 'NEWS  ·  CIGARS'], awn = [0x1a4a30, 0x8a1a1a, 0x1d2a4a, 0x2a2a2a, 0x6a3a1a, 0x1a4a30];
    let shopN = 0;
    const house = (x: number, z: number, w: number, d: number, hh: number, m: T.Material, face: number) => {
      k.box(w, hh, d, x, hh / 2, z, m);
      k.moulding([[0, 0], [0.7, 0], [0.8, 0.2], [0.5, 0.35], [0.6, 0.55], [0.25, 0.75], [0, 0.85]], w, x, hh - 0.5, z + face * d / 2, cornice, face > 0 ? PI / 2 : -PI / 2);
      const fz = z + face * d / 2;
      for (let y = 5.2; y < hh - 1.5; y += 3.1) for (let dx = -w / 2 + 1.8; dx < w / 2 - 1; dx += 2.7) {
        k.box(1.35, 1.9, 0.2, x + dx, y, fz + face * 0.06, cornice); k.box(1.1, 1.65, 0.05, x + dx, y, fz + face * 0.19, rnd() > 0.7 ? warm : k.flat(0x1a2430, 0.7, 0.12)); void glassDark;
        k.box(1.6, 0.14, 0.32, x + dx, y - 1.0, fz + face * 0.14, cornice); k.box(1.55, 0.26, 0.24, x + dx, y + 1.08, fz + face * 0.1, cornice);
      }
      if (face > 0) {
        const sw = w - 1.6, sz = fz + 0.08, i = shopN++ % shops.length;
        k.box(sw, 0.6, 0.12, x, 0.3, sz + 0.02, bulk);
        k.box(sw, 2.5, 0.05, x, 1.85, sz, shopGlass);
        k.box(sw - 0.3, 2.3, 0.02, x, 1.85, sz - 0.25, shopLit);
        for (const dx of [-sw / 2, sw / 2, 0]) k.box(0.12, 3.2, 0.16, x + dx, 1.6, sz + 0.04, bulk);
        k.box(w - 0.6, 0.85, 0.18, x, 3.65, sz + 0.06, k.flat(awn[i], 0.1, 0.7));
        w7Sign(k, shops[i], w - 1.6, 0.62, x, 3.65, sz + 0.17, 0, '#f3ecd6', '', 'W2 Archivo Expanded', false, undefined, 0.62);
        const a = k.box(w - 1.0, 0.06, 1.6, x, 3.0, sz + 0.75, k.flat(awn[i], 0, 0.85)); a.rotation.x = -0.42;
        k.box(w - 1.0, 0.28, 0.03, x, 2.62, sz + 1.5, k.flat(awn[i], 0, 0.85));
      }
      if (rnd() > 0.5) k.prop('fire_escape', x, 6.6 + rnd() * 3, z + face * (d / 2 + 1.05), { height: 3.2, rotY: face > 0 ? 0 : PI });
      if (rnd() > 0.55) k.prop('water_tower', x + 2, hh, z - face * 1.5, { height: 5 });
    };
    for (const s of [-1, 1]) { house(s * 18.4, -10.2, 12.6, 21, 16 + Math.floor(rnd() * 4), fronts[0], 1); house(s * 31.2, -10.2, 12.6, 21, 15 + Math.floor(rnd() * 5), fronts[1], 1); house(s * 44, -10.2, 12.6, 21, 14 + Math.floor(rnd() * 4), fronts[2], 1); }
    for (let i = -5; i <= 5; i++) house(i * 13.2, 29.5, 13.0, 12, 18 + Math.floor(rnd() * 12), fronts[(i + 5) % 3], -1);
    k.skyline({ z: -260, count: 24, spacing: 12, scale: 3.4, base: 0, seed: 89, lit: 0.25, rows: 2 });
    for (const x of [-30, 30]) k.lamp(x, 18.4, 6.2, iron, 0xffd9a8, 26);
    k.prop('hydrant', 14, 0, 5.3, { height: 1.1, keepOut: 0.5 });
    k.prop('mailbox', -14, 0, 5.4, { height: 1.5, rotY: 0, keepOut: 0.6 });
    for (const x of [-9, 12]) k.prop('tree', x, 0, 19.2, { height: 6.2, keepOut: 0.7 });
    for (const x of [-10.8, 10.8, -26, 26]) { k.tree(x, 0, 5.9, { kind: 'round', h: 7.2, r: 2.1, seed: Math.round(x * 7), leaf: 0x3f6b36 }); k.keepOut.push({ x, z: 5.9, r: 0.6 }); }
    for (const x of [-12.8, 12.6, -30, 30]) k.prop('lamppost', x, 0.14, 6.05, { height: 6.4, keepOut: 0.4 });
    k.prop('utility_pole', 22, 0, 18.6, { height: 11 });
    // light: under the awnings, in the dining pendants, over the counter, on the boards
    for (const x of [-6, 0.5, 6]) k.point(x, 4.0, 1.4, 0xffe6c2, 14, 8);
    for (const z of [-4.5, -9, -13.5, -17.5]) k.point(-5.7, 4.3, z, 0xffe4bd, 9, 7);
    for (const z of [-3.5, -8.5, -13.5, -18]) k.point(3.5, 4.6, z, 0xfff0d8, 9, 7);
    for (const z of [-4, -7.5]) k.spot(7.4, 5.0, z, 8.8, 3.2, z, 0xfff1d6, 30, 0.6, 0.6, 10);
    k.spot(3.3, 5.0, -17, 3.3, 3.6, -20.2, 0xfff1d6, 28, 0.7, 0.6, 10);
    // a hanging sturgeon sign on a chain that sways in the doorway draught
    const sway = new T.Group(); sway.position.set(1.8, 4.9, 0.9);
    const chain = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.5, 5), iron); chain.position.y = -0.25; sway.add(chain);
    const plate = k.sign('THE STURGEON KING', 1.9, 0.5, 0, 0, 0, '#1a4a30', '#f3ecd6', 84, 0, { border: true, double: true }); plate.position.set(0, -0.75, 0); k.scene.remove(plate); sway.add(plate);
    k.add(sway);
    if (!ctx.reduced) k.ticks.push((t) => { sway.rotation.z = Math.sin(t * 1.3) * 0.06; sway.rotation.x = Math.sin(t * 0.9 + 1) * 0.04; });
    // the clock on the dining room wall keeps New York time
    const hand = k.box(0.03, 0.42, 0.02, -7.2, 4.35, -20.05, iron), hand2 = k.box(0.03, 0.3, 0.02, -7.2, 4.35, -20.05, iron);
    // New York time, read here rather than from data.ts so the headless audit (no window) can still load the room
    const ny = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const hourParam = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('hour') : null;
    const HOUR = hourParam ? Number(hourParam) : ny.getHours() + ny.getMinutes() / 60;
    const setClock = (t: number) => { const h = HOUR + t / 3600; hand.rotation.z = -(h % 1) * PI * 2; hand2.rotation.z = -((h % 12) / 12) * PI * 2; };
    setClock(0); if (!ctx.reduced) k.ticks.push(setClock);
    // collision: the real walls, the door gaps at the main door and the dining door, the partition with its pass through, the case, the shelves
    k.block(-9.3, -8.7, -20.8, 0.4); k.block(8.7, 9.3, -20.8, 0.4); k.block(-9.3, 9.3, -20.8, -20.1);
    k.block(-8.9, -6.7, -0.2, 0.55); k.block(-5.0, 0.35, -0.2, 0.55); k.block(3.25, 8.9, -0.2, 0.55);
    k.block(-2.7, -2.1, -9.85, -0.3); k.block(-2.7, -2.1, -20.2, -14.15);
    k.block(6.0, 8.9, -9.8, -2.5); k.block(-2.3, -1.6, -10.4, -0.4);
    for (const x of [-7.35, -4.05]) for (const z of [-5.25, -9.0, -12.75, -16.5]) k.keepOut.push({ x, z, r: 0.8 });
    for (const [x, z] of [[3.4, -3.3], [3.4, -6.9], [5.8, -18.45], [2.8, -18.45], [-0.2, -18.45]]) k.keepOut.push({ x, z, r: 0.8 });
    k.keepOut.push({ x: -8.3, z: -1.35, r: 0.5 });
    for (const x of [-6.2, -3.3, 1.2, 4.6, 7.2]) k.keepOut.push({ x, z: 4.2, r: 0.9 });
    // life: the avenue, the sidewalk tables, the line at the counter
    if (!ctx.reduced) {
      k.crowd([v(-70, 0, 3.6), v(70, 0, 3.6)], 10, { seed: 31, speed: 0.65, spread: 1.4, scale: 1.4 });
      k.crowd([v(70, 0, 20.4), v(-70, 0, 20.4)], 10, { seed: 32, speed: 0.6, spread: 1.6, scale: 1.4 });
    }
    // the avenue: a street sign on the corner post, a bike rack, a litter basket, all static and merged
    k.cyl(0.05, 3.4, -12.2, 1.7, 6.0, green, 0.05, 8);
    k.sign('AMSTERDAM AV', 1.6, 0.3, -12.2, 3.25, 6.0, '#1a5a3a', '#f4f4ee', 120, 0, { border: true, double: true });
    for (const x of [16.5, 17.7, 18.9]) k.torus(0.42, 0.03, x, 0.42, 5.6, iron, 18);
    k.cyl(0.28, 0.9, -16.5, 0.45, 5.7, k.flat(0x2a4a34, 0.4, 0.6), 0.24, 12);
    // Amsterdam Avenue runs one way: every lane of traffic goes the same direction
    traffic(k, [{ at: 8.9, dir: 1 }], 'x', 150, 5, !ctx.reduced, 231);
    // a cyclist working up the avenue by the curb
    const bike = new T.Group();
    for (const dz of [-0.55, 0.55]) { const w = new T.Mesh(new T.TorusGeometry(0.34, 0.035, 6, 18), iron); w.position.set(0, 0.36, dz); w.rotation.y = PI / 2; bike.add(w); }
    const frame = new T.Mesh(new T.BoxGeometry(0.05, 0.05, 1.1), k.flat(0x2d6fb8, 0.3, 0.5)); frame.position.y = 0.62; bike.add(frame);
    const rider = new T.Mesh(new T.CapsuleGeometry(0.19, 0.6, 3, 8), k.flat(0x8a2a2a, 0, 0.8)); rider.position.set(0, 0.95, -0.1); rider.rotation.x = 0.35; bike.add(personTag(rider, 'seat', 1.7));   // 2026-10-28: a seated cast rider
    k.add(bike);
    if (!ctx.reduced) k.rider(bike, k.spline([v(-75, 0, 7.4), v(75, 0, 7.4)]), 4.2, 20); else bike.position.set(-9, 0, 7.4);
    // pigeons working the sidewalk crumbs in front of the tables
    const NP = 9, prnd = X.mulberry(232);
    const pig = k.instances(new T.SphereGeometry(0.11, 8, 6), k.flat(0x7c7f86, 0.1, 0.8), Array.from({ length: NP }, () => new T.Matrix4()));
    const pst = Array.from({ length: NP }, () => ({ x: -9 + prnd() * 18, z: 5.6 + prnd() * 0.8, o: prnd() * 10, r: prnd() * PI * 2 }));
    const pm = new T.Matrix4(), pq = new T.Quaternion(), pp = new T.Vector3(), ps = new T.Vector3(1, 0.85, 1.7), yax = new T.Vector3(0, 1, 0);
    const peck = (t: number) => { pst.forEach((a, i) => { const u = t * 0.9 + a.o, hop = Math.max(0, Math.sin(u * 5)) * 0.06, dir = a.r + Math.sin(u * 0.3) * 1.5; pp.set(a.x + Math.sin(u * 0.21) * 1.2, 0.22 + hop, a.z + Math.cos(u * 0.17) * 0.3); pq.setFromAxisAngle(yax, dir); pm.compose(pp, pq, ps); pig.setMatrixAt(i, pm); }); pig.instanceMatrix.needsUpdate = true; };
    peck(0); if (!ctx.reduced) k.ticks.push(peck);
    // landmark eggs: the sign, the store's address, the case, the dining room, the clock
    const bg = { name: 'Barney Greengrass, Our History', url: 'https://www.barneygreengrass.com/pages/new-history' };
    k.egg(v(1.8, 4.15, 0.9), { id: 'sturgeon-king', title: 'The Sturgeon King', year: '1938', text: 'The store’s title was coined by James J. Frawley, a state senator and Tammany Hall leader. Barney Greengrass has been the Sturgeon King ever since, and the crown is on the sign.', clue: 'Something royal swings in the doorway draught.', source: bg }, { r: 0.9 });
    k.egg(v(0, 5.9, 0.9), { id: 'since-1908', title: 'Harlem first, then Amsterdam', year: '1908 and 1929', text: 'Barney Greengrass opened his first store in Harlem, at 113th Street and St. Nicholas Avenue, in 1908. In 1929 he moved it here, to 541 Amsterdam Avenue, where it has stayed.', clue: 'Read the name over the awnings from across the avenue.', source: bg }, { r: 2.2 });
    k.egg(v(7.0, 1.7, -6.0), { id: 'sturgeon-for-fdr', title: 'Sturgeon for the President', year: '1939', text: 'For Thanksgiving in 1939 the store shipped an order of smoked sturgeon to President Franklin D. Roosevelt at Warm Springs, Georgia.', clue: 'The fish in the case behind the counter once filled a very important order.', source: bg }, { r: 1.1 });
    k.egg(v(-5.7, 1.5, -11.0), { id: 'dining-room', title: 'A room to sit down in', year: '1938', text: 'Barney Greengrass began as an appetizing store you carried home from. In 1938 it expanded and opened a restaurant section, and the tables here are where the regulars sit.', clue: 'The part of the store with chairs came later than the counter.', source: bg }, { r: 1.5 });
    k.egg(v(-7.2, 4.35, -20.0), { id: 'three-generations', title: 'Barney, Moe, Gary', year: '1955 and 1982', text: 'When Barney died in 1955 his son Moe took over, and Moe’s son Gary took the reins in 1982. The James Beard Foundation named it An American Classic in 2006, and the store turned 100 in 2008.', clue: 'The clock on the dining room wall has kept time for more than one generation.', source: bg }, { r: 0.8 });
    // the dining room: the New Orleans wallpaper on every wall above the wainscot, the way it has been since the
    // 1950s (one photograph of a panel, mirrored end to end so it never shows a seam), and linoleum tile underfoot
    const paper = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0 });
    const paperUrl = 'assets/museum/barney/wallpaper.jpg';
    if (typeof window !== 'undefined') k.pending.push(new Promise<void>((res) => new T.TextureLoader().load(paperUrl, (t) => { t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.MirroredRepeatWrapping; t.anisotropy = 4; paper.map = t; paper.needsUpdate = true; res(); }, undefined, () => res())));
    k.used.images.add(paperUrl);
    // one printed panel is about 3.4 m by 1.9 m on the wall, so the carriages read at their real size
    const wp = (w: number, h: number, x: number, y: number, z: number, rotY: number) => {
      const g = new T.PlaneGeometry(w, h), uv = g.attributes.uv as T.BufferAttribute;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (w / 3.4), uv.getY(i) * (h / 1.875));
      const o = new T.Mesh(g, paper); o.position.set(x, y, z); o.rotation.y = rotY; k.add(o);
    };
    wp(19.8, 3.75, -8.84, 3.375, -10.35, PI / 2);        // the long left wall
    wp(6.45, 3.75, -5.62, 3.375, -20.18, 0);              // the back wall, over the old mural
    wp(9.4, 3.75, -2.66, 3.375, -5.15, -PI / 2);          // the partition, front of the doorway
    wp(6.1, 3.75, -2.66, 3.375, -17.2, -PI / 2);          // the partition, past the doorway
    k.box(6.45, 0.02, 19.8, -5.62, 0.012, -10.35, k.pbr('bgLino', X.terrazzo(0xcdbb97, 7), 0.6, { roughness: 0.5 }));
    // Moe's Chachkas on the front room walls: MLow's picks from the merch kit, dithered, a salon hang of small frames
    // the way the real walls are packed with framed pictures. Gary's likeness is the corrected one where MLow fixed it.
    const walnut = k.flat(0x2a1a12, 0.1, 0.7), matte = k.flat(0xefe6d2, 0, 0.95);
    const merch = (it: (typeof BARNEY_ART)[number], x: number, y: number, z: number, rotY: number, w: number, plateOn = true) => {
      const h = w / it.ar, g = new T.Group(); g.position.set(x, y, z); g.rotation.y = rotY;
      const fr = new T.Mesh(new T.BoxGeometry(w + 0.16, h + 0.16, 0.06), walnut); fr.position.z = -0.03; g.add(fr);
      const mt = new T.Mesh(new T.BoxGeometry(w + 0.08, h + 0.08, 0.02), matte); mt.position.z = 0.005; g.add(mt);
      const art = new T.Mesh(new T.PlaneGeometry(w, h), k.image(it.f, { roughness: 0.85 })); art.position.z = 0.02; g.add(art);
      const pw = Math.min(1.05, w * 0.95), ph = pw * 0.195;
      const plate = new T.Mesh(new T.PlaneGeometry(pw, ph), new T.MeshBasicMaterial({ map: X.plate([
        { text: `NO. ${String(it.n).padStart(3, '0')}  ·  MOE'S CHACHKAS`, color: '#00E5FF', size: 30 },
        { text: it.t, color: '#F0F4F8', size: 34, font: '700' },
        { text: it.m.toUpperCase() + (it.fix ? '  ·  GARY, LIKENESS CORRECTED' : ''), color: '#8899AA', size: 24 },
        { text: 'NEW YORKERS  x  BARNEY GREENGRASS  ·  BY MLOW', color: '#2962FF', size: 21 }], 1024, 200) }));
      plate.position.set(0, -h / 2 - 0.12 - ph / 2, 0.02); if (plateOn) g.add(plate);
      k.add(g);
    };
    const slots: [number, number, number, number, number, boolean][] = [];   // x, y, z, rotY, width, plate
    for (const x of [-1.3, -0.1, 1.1, 2.3, 3.5, 4.7]) slots.push([x, 2.35, -20.2, 0, 0.95, true]);          // back wall, lower row
    for (const x of [-1.3, -0.1, 3.5, 4.7]) slots.push([x, 4.15, -20.2, 0, 0.95, true]);                    // back wall, upper row, two either side of the logo (the logo sits at x 1.7, centred on the row and the sign)
    for (const y of [2.4, 4.1]) for (const z of [-11.0, -12.2]) slots.push([8.8, y, z, -PI / 2, 0.95, true]); // right wall past the case
    // behind the case, two tight rows of small frames on the dark panel under the chalkboards, the way the real
    // wall behind the counter is papered with pictures; too tight for plates, the titles are in the pictures
    for (const y of [2.95, 1.95]) for (let i = 0; i < 9; i++) slots.push([8.3, y, -1.9 - i * 0.8, -PI / 2, 0.62, false]);
    const shown = ctx.reduced ? Math.min(10, BARNEY_ART.length) : Math.min(slots.length, BARNEY_ART.length);
    for (let i = 0; i < shown; i++) { const [x, y, z, r, w, pl] = slots[i]; merch(BARNEY_ART[i], x, y, z, r, w, pl); }
    k.sign("MOE'S CHACHKAS", 3.0, 0.5, 1.7, 5.0, -20.17, '#1a4a30', '#f3ecd6', 110, 0, { border: true });
    k.sign('THE MERCH MLOW DREW FOR THE STORE  ·  FORTY THREE PICKS, DITHERED', 3.4, 0.17, 1.7, 4.68, -20.17, 'transparent', '#8899AA', 54, 0);
    // the store's own words on its walls: cash only, no reservations, the hours, take a number, the Beard medal,
    // and the films shot in the room, in the cream and deli red of the sign outside
    const cream = '#f3ecd6', red = '#8b1a1a';
    k.sign('CASH ONLY  ·  NO RESERVATIONS', 2.4, 0.36, 1.8, 3.95, -0.33, cream, red, 96, 0, { border: true });
    k.sign('STORE TUESDAY TO SUNDAY 8 TO 5  ·  RESTAURANT 8:30 TO 4, WEEKENDS TO 5  ·  CLOSED MONDAYS', 2.6, 0.16, 1.8, 2.75, 0.63, cream, '#1d2a4a', 44, 0, { border: true, double: true });
    k.sign('TAKE A NUMBER', 0.56, 0.2, 8.3, 2.0, -0.75, red, cream, 90, -PI / 2, { border: true });
    k.sign('PLEASE HAVE YOUR ORDER READY  ·  THE COUNTERMEN DO NOT WAIT', 1.9, 0.14, 8.3, 1.72, -5.0, 'transparent', cream, 50, -PI / 2);
    k.sign('JAMES BEARD FOUNDATION  ·  AMERICA\'S CLASSICS  ·  2006', 1.5, 0.22, -2.63, 2.35, -16.6, '#2a1a12', '#e8c56a', 60, -PI / 2, { border: true });
    const films = new T.Mesh(new T.PlaneGeometry(3.2, 0.62), new T.MeshBasicMaterial({ map: X.plate([
      { text: 'LIGHTS, CAMERA, STURGEON  ·  SHOT IN THIS ROOM', color: '#00E5FF', size: 30 },
      { text: "You've Got Mail  ·  Seinfeld  ·  30 Rock  ·  Deconstructing Harry  ·  Billions", color: '#F0F4F8', size: 34, font: '700' },
      { text: 'Revolutionary Road  ·  Extremely Loud and Incredibly Close  ·  Sex and the City  ·  Law and Order  ·  Smoke', color: '#8899AA', size: 24 },
      { text: 'The Angel Levine, 1969, with Moe Greengrass himself  ·  Vampire Weekend, Sunflower', color: '#2962FF', size: 21 }], 1024, 200) }));
    films.position.set(-5.6, 4.75, -20.14); k.add(films);
    // the real stories, where they happened
    const wsr = { name: 'Why the Upper West Side: Gary Greengrass, West Side Rag', url: 'https://www.westsiderag.com/2024/04/20/why-the-upper-west-side-gary-greengrass-its-the-hand-i-was-dealt' };
    const dt = { name: 'Diner Theory NYC, Barney Greengrass', url: 'https://dinertheory.substack.com/p/diner-theory-nyc-barney-greengrass' };
    const wk = { name: 'Barney Greengrass, Wikipedia', url: 'https://en.wikipedia.org/wiki/Barney_Greengrass' };
    k.egg(v(7.0, 1.6, -3.6), { id: 'hitchcock-sturgeon', title: 'Ten pounds for Hitchcock', year: 'the studio years', text: 'Alfred Hitchcock had ten pounds of fatty sturgeon flown to Hollywood. Lee Strasberg ordered nova and the clerk mentioned the identical order had just gone out to Meyer Lansky.', clue: 'The case end nearest the door has shipped to stranger addresses than yours.', source: bg }, { r: 0.9 });
    k.egg(v(7.0, 1.6, -8.6), { id: 'fish-not-hunts-point', title: 'Straight from the smokers', year: 'every week', text: 'Gary buys the fish directly from the smokehouses, not through Hunts Point. The herring sits in salt for about six months. His own order: whitefish, a piece not a salad, nova, vegetable cream cheese, tomato and onion on a toasted bialy.', clue: 'The far end of the case, where the herring is.', source: wsr }, { r: 0.9 });
    k.egg(v(1.8, 1.6, 0.2), { id: 'fedex-yom-kippur', title: 'The FedEx man', year: 'two days before Yom Kippur', text: 'A FedEx representative stations at the store two days before Yom Kippur to handle the nationwide shipping. Reminder letters go out a month ahead showing each customer their previous order, and once the cutoff dates arrive, the train leaves the station.', clue: 'Stand in the doorway in late September.', source: wsr }, { r: 0.9 });
    k.egg(v(3.4, 1.4, -3.3), { id: 'break-fast', title: 'Five hundred and fifty doorsteps', year: 'break fast, 2001', text: 'Monday morning to Tuesday evening with no sleep, over 550 homes across the city and the country fed in the same window. West Side Rag called it a military operation and a Broadway production.', clue: 'The first table inside the door is where the orders get checked.', source: wsr }, { r: 0.9 });
    k.egg(v(1.7, 4.9, -19.9), { id: 'moes-chachkas', title: 'Moe, fourth generation', year: 'born 2006', text: 'Named after his grandfather so the old business cards still work. His Knicks tee dressed the Neptune king in a Brunson jersey, a tiny run with a number only New Yorkers get, sold out online and restocked in store. The merch shelf is called Moe\'s Chachkas.', clue: 'Read the sign over the merch wall.', source: bg }, { r: 1.2 });
    k.egg(v(-8.4, 3.0, -8.0), { id: 'wallpaper-restored', title: 'Three painters, five days', year: 'the pandemic', text: 'The New Orleans wallpaper has been there since Gary was a kid, at least sixty years. During Covid three decorative painters took five days to restore it. Gary: it is like a comfortable shoe.', clue: 'Put your nose to the French Quarter.', source: wsr }, { r: 1.3 });
    k.egg(v(-5.5, 1.6, -14.0), { id: 'seinfeld-541', title: 'Number 541', year: 'the census', text: 'Jerry Seinfeld is a regular, and No. 541 in NEW YORKERS is Jerry Seinfeld. The store\'s address is 541 Amsterdam Avenue. Nobody planned that.', clue: 'A table in the back, where a regular would sit.', source: { name: 'No. 541, NEW YORKERS', url: 'https://n3wyorkers.com/n/541' } }, { r: 1.0 });
    k.egg(v(-2.6, 2.35, -16.6), { id: 'james-beard', title: 'An American Classic', year: '2006', text: 'The James Beard Foundation named Barney Greengrass an America\'s Classic in 2006. Zagat called it the city\'s number one deli for more than a decade, and the Financial Times put it among the fifty best food stores in the world in 2021.', clue: 'A small gold plate by the doorway in the dining room.', source: wk }, { r: 0.8 });
    k.egg(v(-1.9, 1.3, -5.0), { id: 'storage-closet', title: 'The front room is the stock room', year: 'any weekend', text: 'Diner Theory: shelves of dry goods line the walls, a relic of the early days, and the counter is often taken up by boxes of bulk ingredients. They still treat the front dining room like a storage closet. Sometimes you eat among the packages of crackers and matzoh.', clue: 'The bakery shelves opposite the case.', source: dt }, { r: 1.0 });
    k.egg(v(8.3, 2.0, -0.75), { id: 'take-a-number', title: 'Take a number', year: 'holiday weekends', text: 'On holiday weekends the counter runs a take a number ticket system. The countermen in white coats slice the nova into sheets you can read through. Weekend waits can pass thirty minutes, and lingering at a table is not encouraged.', clue: 'The little red sign by the register.', source: dt }, { r: 0.8 });
    // the food: a Trellis bagel on the front tables, the smoked fish as photo cut outs on a board and a tray in the case,
    // croissants and bagels on the bakery shelf. The crude fish boxes of the model are hidden by retex above.
    const card = (file: string, w: number, x: number, y: number, z: number, rotY: number, tilt: number) => {
      const o = new T.Mesh(new T.PlaneGeometry(w, w * 0.77), k.image(file, { roughness: 0.7 })); o.position.set(x, y, z); o.rotation.set(-PI / 2 + tilt, 0, rotY, 'ZYX'); k.add(o); return o;
    };
    k.prop('ph_wooden_cutting_board', 7.35, 1.44, -4.3, { height: 0.04, rotY: PI / 2 });
    card('assets/museum/barney/food_whitefish.png', 0.9, 7.35, 1.49, -4.3, 0, 0.28);
    card('assets/museum/barney/food_sturgeon.png', 1.0, 7.35, 1.47, -6.6, 0, 0.28);
    card('assets/museum/barney/food_sturgeon.png', 0.8, 7.35, 1.47, -8.6, PI, 0.28);
    // the register at the door end of the case, a Poly Haven CC0 model, with the sign every regular knows
    k.prop('ph_cash_register', 7.3, 1.43, -3.0, { height: 0.5, rotY: -PI / 2 });
    k.sign('CASH ONLY', 0.5, 0.2, 6.62, 1.58, -2.55, '#f3ecd6', '#8b1a1a', 120, -PI / 2 + 0.35, { border: true, double: true });
    k.sign('CASH ONLY', 0.9, 0.34, 8.3, 2.95, -1.0, '#8b1a1a', '#f3ecd6', 120, -PI / 2, { border: true });
    k.sign('WE DO NOT TAKE CARDS  ·  WE NEVER HAVE', 0.9, 0.12, 8.3, 2.7, -1.0, 'transparent', '#f3ecd6', 48, -PI / 2);
    // a bagel and lox on every table: the front room, the dining room, the sidewalk
    const tables: [number, number, number][] = [[3.4, 1.14, -3.3], [3.4, 1.14, -6.9], [5.8, 1.14, -18.45], [2.8, 1.14, -18.45], [-0.2, 1.14, -18.45],
      [-7.35, 1.16, -5.25], [-7.35, 1.16, -9.0], [-7.35, 1.16, -12.75], [-7.35, 1.16, -16.5], [-4.05, 1.16, -5.25], [-4.05, 1.16, -9.0], [-4.05, 1.16, -12.75], [-4.05, 1.16, -16.5],
      [-6.2, 1.17, 4.2], [-3.3, 1.17, 4.2], [1.2, 1.17, 4.2], [4.6, 1.17, 4.2], [7.2, 1.17, 4.2]];
    (ctx.reduced ? tables.slice(0, 4) : tables).forEach(([x, y, z], i) => k.prop('barney_bagel', x + ((i * 7) % 3 - 1) * 0.12, y, z + ((i * 5) % 3 - 1) * 0.1, { height: 0.3, rotY: i * 1.9 }));
    // the lox in the case: plates of it along the deck, the way the real case is a row of trays
    for (const [z, r] of [[-3.6, 0.4], [-5.4, 2.1], [-7.4, 3.6], [-9.0, 1.1]]) k.prop('barney_bagel', 7.4, 1.46, z, { height: 0.26, rotY: r });
    for (let i = 0; i < 4; i++) k.prop('ph_croissant', -1.86, 0.82, -1.6 - i * 0.42, { height: 0.09, rotY: i * 1.3 });
    // the bagel wall: a rack of cubbies on the bakery side, every one heaped with bagels. Each bagel is a torus wearing
    // a baked crust painted here (golden brown with a darker bloom, the blistered skin, sesame and poppy on the
    // everything ones), all of them one instanced draw call with a bump from the same canvas.
    const crust = (seeds: 'everything' | 'sesame' | 'plain' | 'pumpernickel') => {
      const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d')!; const rnd = X.mulberry(seeds.length * 31);
      const base = seeds === 'pumpernickel' ? '#4a2c1a' : '#c98a3f'; g.fillStyle = base; g.fillRect(0, 0, 512, 256);
      for (let i = 0; i < 900; i++) { const r = 4 + rnd() * 22, a = 0.05 + rnd() * 0.18; g.fillStyle = rnd() > 0.5 ? `rgba(120,60,20,${a})` : `rgba(240,200,120,${a * 0.8})`; g.beginPath(); g.ellipse(rnd() * 512, rnd() * 256, r, r * (0.5 + rnd()), rnd() * 3, 0, PI * 2); g.fill(); }
      g.fillStyle = 'rgba(90,40,15,0.35)'; g.fillRect(0, 150, 512, 106);                         // the darker, flatter underside
      if (seeds === 'everything' || seeds === 'sesame') for (let i = 0; i < (seeds === 'everything' ? 420 : 300); i++) {
        const x = rnd() * 512, y = rnd() * 150, t = rnd(); g.save(); g.translate(x, y); g.rotate(rnd() * PI);
        if (seeds === 'everything' && t < 0.3) { g.fillStyle = '#1a1420'; g.beginPath(); g.ellipse(0, 0, 2.2, 1.6, 0, 0, PI * 2); g.fill(); }     // poppy
        else if (seeds === 'everything' && t < 0.42) { g.fillStyle = '#e9e2cc'; g.fillRect(-4, -1.2, 8, 2.4); }                                    // onion flake
        else { g.fillStyle = '#f3e7c3'; g.beginPath(); g.ellipse(0, 0, 3.4, 2.1, 0, 0, PI * 2); g.fill(); g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(1, 0.6, 2.4, 1.3, 0, 0, PI * 2); g.fill(); }   // sesame
        g.restore();
      }
      const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 4;
      const b = new T.CanvasTexture(c); b.wrapS = b.wrapT = T.RepeatWrapping;
      return new T.MeshStandardMaterial({ map: t, bumpMap: b, bumpScale: 0.004, roughness: 0.72, metalness: 0 });
    };
    const bagelGeo = new T.TorusGeometry(0.085, 0.04, 10, 22);
    const kinds: ('everything' | 'sesame' | 'plain' | 'pumpernickel')[] = ['everything', 'sesame', 'plain', 'pumpernickel'];
    const rackX = -1.18, rackZ0 = -5.6, cubby = 0.6, rows = 3, cols = 6;                        // the rack stands proud of the shelves, its back hiding the goods behind it
    for (let r = 0; r <= rows; r++) k.box(0.5, 0.03, cols * cubby + 0.03, rackX - 0.25, 1.12 + r * cubby, rackZ0 - cols * cubby / 2, walnut);
    for (let cc = 0; cc <= cols; cc++) k.box(0.5, rows * cubby, 0.03, rackX - 0.25, 1.12 + rows * cubby / 2, rackZ0 - cc * cubby, walnut);
    k.box(0.03, rows * cubby, cols * cubby, rackX - 0.5, 1.12 + rows * cubby / 2, rackZ0 - cols * cubby / 2, walnut);
    const brnd = X.mulberry(77), perKind: T.Matrix4[][] = [[], [], [], []], bm = new T.Matrix4(), bq = new T.Quaternion(), bp = new T.Vector3(), bs = new T.Vector3(1, 1, 1), be = new T.Euler();
    for (let r = 0; r < rows; r++) for (let cc = 0; cc < cols; cc++) {
      const kind = (r * cols + cc) % 4, cz = rackZ0 - cc * cubby - cubby / 2, cy = 1.12 + r * cubby + 0.03;
      for (let i = 0; i < 11; i++) {                                                             // a heap: two layers lying flat, a few leaning at the front
        const layer = i < 5 ? 0 : i < 9 ? 1 : 2, lean = layer === 2;
        bp.set(rackX - 0.26 + (brnd() - 0.5) * 0.14 + (lean ? 0.1 : 0), cy + 0.04 + layer * 0.07 + (lean ? 0.06 : 0), cz + (brnd() - 0.5) * (lean ? 0.3 : 0.36));
        be.set(lean ? PI / 2 - 0.5 + (brnd() - 0.5) * 0.3 : PI / 2 + (brnd() - 0.5) * 0.25, 0, brnd() * PI * 2);
        bq.setFromEuler(be); bm.compose(bp, bq, bs); perKind[kind].push(bm.clone());
      }
    }
    perKind.forEach((ms, i) => { const im = new T.InstancedMesh(bagelGeo, crust(kinds[i]), ms.length); ms.forEach((m, j) => im.setMatrixAt(j, m)); im.castShadow = im.receiveShadow = true; k.add(im); });
    k.sign('BAGELS  ·  BIALYS  ·  BAKED HERE EVERY MORNING', 3.3, 0.22, rackX - 0.02, 1.12 + rows * cubby + 0.2, rackZ0 - cols * cubby / 2, '#1a4a30', '#f3ecd6', 70, PI / 2, { border: true });
    for (let cc = 0; cc < cols; cc++) k.sign(['EVERYTHING', 'SESAME', 'PLAIN', 'PUMPERNICKEL'][cc % 4] + '  2.50', cubby - 0.08, 0.07, rackX + 0.005, 1.12 + 0.05, rackZ0 - cc * cubby - cubby / 2, '#f3ecd6', '#8b1a1a', 44, PI / 2);
    for (let cc = 0; cc < cols; cc++) k.keepOut.push({ x: rackX - 0.2, z: rackZ0 - cc * cubby - cubby / 2, r: 0.5 });
    k.block(-2.3, rackX + 0.05, rackZ0 - cols * cubby - 0.05, rackZ0 + 0.05);
    // three optical illusions. 1: the Sturgeon King painted on the floor of the front room, stretched so that from
    // the ring just inside the door he stands upright in the aisle. Each vertex of an upright picture is pushed along
    // the line from the eye to the floor, so the floor carries the picture's perspective from that one spot. The
    // picture has to be something with an upright identity (a tray of fish lies flat however it is drawn).
    const eye = v(1.8, 2.3, -1.2);
    { const h = 1.15, w = h * 768 / KING_H, geo = new T.PlaneGeometry(w, h, 20, 24), pos = geo.attributes.position as T.BufferAttribute, cx = 1.6, cz = -7.2, cy = 0.1 + h / 2;
      for (let i = 0; i < pos.count; i++) { const px = cx + pos.getX(i), py = cy + pos.getY(i), pz = cz; const sc = (0.012 - eye.y) / (py - eye.y); pos.setXYZ(i, eye.x + (px - eye.x) * sc, 0.012, eye.z + (pz - eye.z) * sc); }
      geo.computeVertexNormals();
      const king = new T.Mesh(geo, k.image('assets/museum/barney/king_cutout.png', { roughness: 0.9 })); king.renderOrder = 2; k.add(king);
      k.torus(0.3, 0.02, eye.x, 0.015, eye.z, k.flat(0xe6b84a, 0.1, 0.5), 24).rotation.x = PI / 2;
      k.sign('STAND HERE  ·  LOOK DOWN THE ROOM', 0.9, 0.08, eye.x, 0.02, eye.z + 0.42, 'transparent', '#e6b84a', 40, 0).rotation.x = -PI / 2;
      k.egg(v(eye.x, 1.2, eye.z), { id: 'anamorphic-king', title: 'The king on the floor', year: 'an illusion', text: 'Stand on the gold ring and look down the aisle: the Sturgeon King, painted flat on the terrazzo, stands up in the room. The picture is drawn in the perspective of that one spot, the pavement artist\'s trick. Step off the ring and he lies down again.', clue: 'A gold ring on the floor just inside the door.', source: wk }, { r: 0.7 }); }
    // 2: the etched mirrors of the dining room, one of them an infinity mirror: stacked glowing frames fading into
    // the partition, a depth that is not there
    { const mx = -8.52, my = 2.7, mz = -4.12, mw = 0.62, mh = 0.84, mg = new T.Group(); mg.position.set(mx, my, mz); mg.rotation.y = PI / 2; k.add(mg);   // a shadow box proud of the wall, local +z faces into the room
      for (const [sx, sy, sw, sh] of [[0, mh / 2 + 0.04, mw + 0.16, 0.08], [0, -mh / 2 - 0.04, mw + 0.16, 0.08], [mw / 2 + 0.04, 0, 0.08, mh], [-mw / 2 - 0.04, 0, 0.08, mh]]) {
        const slat = new T.Mesh(new T.BoxGeometry(sw, sh, 0.34), walnut); slat.position.set(sx, sy, -0.14); mg.add(slat);   // a hollow box, the rings inside it
      }
      const back = new T.Mesh(new T.PlaneGeometry(mw, mh), k.flat(0x05070a, 0, 0.3)); back.position.z = -0.28; mg.add(back);
      for (let i = 0; i < 9; i++) { const f = 1 - i / 10, ring = new T.Mesh(new T.TorusGeometry(0.5, 0.02, 6, 4), new T.MeshBasicMaterial({ color: new T.Color(0xf7d98a).multiplyScalar(0.35 + 0.65 * f), transparent: true, opacity: 0.97 * f })); ring.scale.set(mw * f * 0.66, mh * f * 0.66, 1); ring.rotation.z = PI / 4; ring.position.z = 0.0 - i * 0.03; mg.add(ring); }
      k.egg(v(mx + 0.1, my, mz), { id: 'etched-mirror', title: 'The etched mirrors', year: 'the dining room', text: 'Formica tables, vintage linoleum, etched mirrors, white counters: Gary wants the place to work as a time capsule. One of these mirrors goes further back than the room does.', clue: 'The small mirror in the back of the dining room.', source: dt }, { r: 0.9 }); }
    // 3: cafe wall tiles along the foot of the shelves and the case: the rows are straight, the mortar makes them lean
    { const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d')!;
      g.fillStyle = '#8c8c86'; g.fillRect(0, 0, 512, 128);
      for (let r = 0; r < 4; r++) for (let i = -1; i < 9; i++) { g.fillStyle = (i + r) % 2 ? '#121212' : '#efeae0'; g.fillRect(i * 64 + (r % 2) * 24, r * 32 + 3, 62, 26); }
      const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8;
      const strip = (x: number, z: number, len: number) => { const tt = t.clone(); tt.needsUpdate = true; tt.repeat.set(len / 1.2, 1); const m = new T.Mesh(new T.PlaneGeometry(len, 0.3), new T.MeshStandardMaterial({ map: tt, roughness: 0.4 })); m.position.set(x, 0.013, z); m.rotation.set(-PI / 2, 0, PI / 2); k.add(m); };
      strip(-1.45, -5.4, 9.8); strip(5.95, -6.15, 6.9); }
    // the people: MLow's own ON LOCATION characters, standing and walking. Each model's front is along x,
    // so `face` turns it to +z for the rider, which steers along the tangent. They glide with a small bob:
    // the models are not rigged, and the walk is a slow shuffle, the way a queue moves.
    type Npc = { name: string; h: number; face: number };
    /* 2026-10-28: rendered from the front, every npc_ model has its face along its own +x, so a walker needs -PI/2 to
       face along the route; the +PI/2 walkers (the wiseguy, the maitre d') walked backwards. The standing figures keep
       their `face` as authored: their yaws were set against it and they read right in the room. */
    const WALK_FACE = -PI / 2;
    const cast: Record<string, Npc> = {
      bartender: { name: 'bartender', h: 2.55, face: PI / 2 }, maitre: { name: 'maitre', h: 2.55, face: PI / 2 }, clerk: { name: 'clerk', h: 2.5, face: -PI / 2 },
      wiseguy: { name: 'wiseguy', h: 2.6, face: PI / 2 }, broker: { name: 'broker', h: 2.6, face: -PI / 2 }, sonny: { name: 'sonny', h: 2.55, face: -PI / 2 },
      annieh: { name: 'annieh', h: 2.45, face: -PI / 2 }, workgirl: { name: 'workgirl', h: 2.45, face: -PI / 2 }, oscar: { name: 'oscar', h: 2.55, face: PI / 2 },
      felix: { name: 'felix', h: 2.55, face: -PI / 2 }, actress: { name: 'actress', h: 2.5, face: PI / 2 }, editor: { name: 'editor', h: 2.55, face: PI / 2 },
      cabbie: { name: 'cabbie', h: 2.55, face: PI / 2 }, hustler: { name: 'hustler', h: 2.6, face: -PI / 2 },
    };
    const stand = (c: Npc, x: number, z: number, yaw: number) => k.prop(`npc_${c.name}`, x, 0, z, { height: c.h, rotY: yaw + c.face, keepOut: 0.5 });
    const walk = (c: Npc, route: T.Vector3[], speed: number, offset: number, closed = true) =>
      k.prop(`npc_${c.name}`, route[0].x, 0, route[0].z, { height: c.h }).then((o) => {
        if (!o) return;
        const g = new T.Group(); k.scene.remove(o); o.position.set(0, 0, 0); o.rotation.y = WALK_FACE; g.add(o); k.add(g);
        const ph = offset * 1.7;
        if (ctx.reduced) { const p0 = route[0]; g.position.set(p0.x, 0, p0.z); return; }
        k.rider(g, k.spline(route, closed), speed, offset);
        k.ticks.push((t) => { o.position.y = Math.abs(Math.sin(t * 5.2 + ph)) * 0.035; o.rotation.z = Math.sin(t * 5.2 + ph) * 0.015; });
      });
    stand(cast.bartender, 7.9, -4.6, PI / 2);          // behind the case, facing the room
    stand(cast.clerk, 7.9, -3.4, PI / 2);              // at the register
    stand(cast.actress, -4.6, -6.4, 0.6);              // in the dining room
    if (!ctx.reduced) {                                 // a phone loads three people, a desktop the whole cast
      stand(cast.oscar, 2.6, -8.0, -0.4); stand(cast.felix, 4.2, -7.6, 2.6);   // the Odd Couple at the second table
      stand(cast.editor, -6.9, -11.2, -2.2);                                      // in the dining room
      stand(cast.cabbie, -2.9, 4.4, PI); stand(cast.hustler, 6.2, 4.3, 2.6);     // at the sidewalk tables
      // the queue at the case shuffles from the door to the far end and back round
      walk(cast.wiseguy, [v(5.4, 0, -1.6), v(5.4, 0, -9.0), v(4.4, 0, -9.4), v(4.4, 0, -2.0)], 0.22, 0);
      walk(cast.broker, [v(5.4, 0, -1.6), v(5.4, 0, -9.0), v(4.4, 0, -9.4), v(4.4, 0, -2.0)], 0.22, 7);
      walk(cast.workgirl, [v(5.4, 0, -1.6), v(5.4, 0, -9.0), v(4.4, 0, -9.4), v(4.4, 0, -2.0)], 0.22, 14);
      // the waiter works the doorway between the two rooms
      walk(cast.maitre, [v(0.4, 0, -12.0), v(-2.4, 0, -12.0), v(-5.2, 0, -9.5), v(-5.2, 0, -15.5), v(-2.4, 0, -12.2)], 0.5, 0);
      // regulars in and out of the door, up the avenue and back
      walk(cast.annieh, [v(1.8, 0, -4.0), v(1.8, 0, 2.5), v(-12, 0, 3.8), v(-24, 0, 3.6), v(-12, 0, 3.4), v(1.4, 0, 2.2)], 0.75, 0);
      walk(cast.sonny, [v(1.8, 0, 2.6), v(14, 0, 3.6), v(26, 0, 3.8), v(14, 0, 3.4), v(1.8, 0, 2.4), v(1.4, 0, -3.0)], 0.7, 9);
    }
    // the hang: the regulars on the wallpaper of the dining room, and the back of the front room
    const mounts: Mount[] = [];
    const at = (x: number, y: number, z: number, tx: number, tz: number, w: number, h: number, style: FrameStyle = 'oak'): Mount => ({ position: v(x, y, z), rotation: Math.atan2(tx - x, tz - z), target: v(tx, 2.3, tz), width: w, height: h, style, wash: false });
    for (let i = 0; i < 6; i++) { const z = -2.6 - i * 3.05; mounts.push(at(-8.5, 3.2, z, -5.7, z, 2.3, 1.55)); }
    for (const z of [-15.6, -18.6]) mounts.push(at(-2.9, 3.1, z, -5.7, z, 2.2, 1.5));
    for (const z of [-2.3, -8.6]) mounts.push(at(-2.9, 3.15, z, -5.7, z, 2.0, 1.4));
    for (const z of [-15.6, -18.6]) mounts.push(at(-1.9, 3.1, z, 1.6, z, 2.2, 1.5));
    for (const x of [-6.4, 7.6]) mounts.push({ position: v(x, 3.2, 0.62), rotation: 0, target: v(x + 1.4, 2.3, 5.9), width: 2.0, height: 1.3, style: 'none', wash: false, lookAt: v(x, 3.2, 0) });
    return { mounts, spawn: v(2.5, 2.3, 17.8), look: v(0.5, 4.6, 0), eye: 2.3, bounds: [-13.5, 13.5, -19.7, 22.6], style: 'oak' };
  },
};
