/* 112 to 116: working worlds. Five speculative rooms built around real New York places: a Queens
   laundromat at 3 a.m., a Long Island City taxi garage at shift change, the 28th Street flower cold
   room before dawn, a Lower East Side handball court at golden hour, the Spring Street Salt Shed.
   Each carries its street, its envelope, its machines and its life, then hangs New Yorkers. */
import * as T from 'three';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as X from '../textures';
import { v, type Kit, type Mount } from '../kit';
import type { RoomDef, RoomCtx } from './types';
import { street, blockFront } from './f';
const PI = Math.PI;

/* a wall mount facing a viewing point on the floor */
function M(x: number, y: number, z: number, tx: number, tz: number, w: number, h: number, style: Mount['style'], wash = true): Mount {
  return { position: v(x, y, z), target: v(tx, 2.4, tz), rotation: Math.atan2(tx - x, tz - z), width: w, height: h, style, wash };
}
/* the same cab as static boxes merged into the room, for the ones that are parked; returns the roof light */
function cabStatic(k: Kit, x: number, y: number, z: number, ry: number, yellow: T.Material, glass: T.Material, dark: T.Material, light: T.Material) {
  const up = new T.Vector3(0, 1, 0);
  const at = (lx: number, ly: number, lz: number) => new T.Vector3(lx, ly, lz).applyAxisAngle(up, ry).add(new T.Vector3(x, y, z));
  const part = (w: number, h: number, d: number, lx: number, ly: number, lz: number, m: T.Material) => { const p = at(lx, ly, lz); const o = k.box(w, h, d, p.x, p.y, p.z, m); o.rotation.y = ry; return o; };
  part(1.9, 0.6, 4.7, 0, 0.65, 0, yellow); part(1.75, 0.62, 2.6, 0, 1.24, -0.2, yellow); part(1.78, 0.5, 2.5, 0, 1.22, -0.2, glass);
  part(1.95, 0.2, 0.2, 0, 0.45, 2.4, dark); part(1.95, 0.2, 0.2, 0, 0.45, -2.4, dark); part(1.7, 0.08, 4.5, 0, 0.32, 0, dark);
  const lp = at(0, 1.63, 0.2); const lamp = k.mesh(new T.BoxGeometry(0.7, 0.16, 0.22), light, lp.x, lp.y, lp.z, true); lamp.rotation.y = ry;
  return lamp;
}
/* a matrix for an instance */
function mat(x: number, y: number, z: number, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) {
  return new T.Matrix4().compose(v(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz)), v(sx, sy, sz));
}
/* a part: geometry, material, offset, rotation. Moving machines are merged per material, so a train or a
   loader costs one draw call per material rather than one per box; still ones go to the kit's static merge. */
type Part = [T.BufferGeometry, T.Material, number, number, number, number?, number?, number?];
function merged(parts: Part[]) {
  const g = new T.Group(), by = new Map<T.Material, T.BufferGeometry[]>();
  for (const [geo, m, x, y, z, rx = 0, ry = 0, rz = 0] of parts) {
    const gg = geo.index ? geo.toNonIndexed() : geo;
    gg.applyMatrix4(mat(x, y, z, ry, 1, 1, 1, rx, rz));
    if (!by.has(m)) by.set(m, []);
    by.get(m)!.push(gg);
  }
  for (const [m, list] of by) { const geo = mergeGeometries(list); if (geo) g.add(new T.Mesh(geo, m)); }
  return g;
}
function placeParts(k: Kit, parts: Part[], x: number, y: number, z: number, ry = 0) {
  const base = mat(x, y, z, ry);
  for (const [geo, m, px, py, pz, rx = 0, pry = 0, rz = 0] of parts) { geo.applyMatrix4(mat(px, py, pz, pry, 1, 1, 1, rx, rz)).applyMatrix4(base); k.mesh(geo, m); }
}
/* the yellow cab as parts, wheels included */
function cabParts(yellow: T.Material, glass: T.Material, dark: T.Material, rubber: T.Material): Part[] {
  const p: Part[] = [[new T.BoxGeometry(1.9, 0.6, 4.7), yellow, 0, 0.65, 0], [new T.BoxGeometry(1.75, 0.62, 2.6), yellow, 0, 1.24, -0.2], [new T.BoxGeometry(1.78, 0.5, 2.5), glass, 0, 1.22, -0.2], [new T.BoxGeometry(1.95, 0.2, 0.2), dark, 0, 0.45, 2.4], [new T.BoxGeometry(1.95, 0.2, 0.2), dark, 0, 0.45, -2.4], [new T.BoxGeometry(1.7, 0.08, 4.5), dark, 0, 0.32, 0]];
  for (const [dx, dz] of [[-0.8, 1.5], [0.8, 1.5], [-0.8, -1.5], [0.8, -1.5]]) p.push([new T.CylinderGeometry(0.32, 0.32, 0.22, 12), rubber, dx, 0.32, dz, 0, 0, PI / 2]);
  return p;
}
/* a canvas drawn by hand, for the signs the kit's one line sign cannot draw */
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
/* a round route bullet, the way the subway draws its lines */
function bullet(k: Kit, text: string, bg: string, r: number, x: number, y: number, z: number, rotY: number) {
  const t = canvasTex(256, 256, (g) => { g.fillStyle = bg; g.beginPath(); g.arc(128, 128, 124, 0, PI * 2); g.fill(); g.fillStyle = '#ffffff'; g.font = '700 180px Helvetica Neue, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 138); });
  const o = k.mesh(new T.CircleGeometry(r, 32), new T.MeshBasicMaterial({ map: t, transparent: true }), x, y, z, true);
  o.rotation.y = rotY;
  return o;
}
/* a sign that reads the right way from both sides: one canvas on two planes back to back, one draw call */
function twoFaced(k: Kit, tex: T.Texture, w: number, h: number, x: number, y: number, z: number, rotY: number) {
  const m = new T.MeshBasicMaterial({ map: tex, transparent: true });
  const g = merged([[new T.PlaneGeometry(w, h), m, 0, 0, 0.02], [new T.PlaneGeometry(w, h), m, 0, 0, -0.02, 0, PI, 0]]);
  g.position.set(x, y, z); g.rotation.y = rotY;
  k.add(g);
  return g;
}
/* world scaled UVs for a textured box that moves, which the kit's static projection never sees */
function boxUV(g: T.BufferGeometry, density: number) {
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i));
    if (ny >= nx && ny >= nz) uv.setXY(i, p.getX(i) * density, p.getZ(i) * density);
    else if (nx >= nz) uv.setXY(i, p.getZ(i) * density, p.getY(i) * density);
    else uv.setXY(i, p.getX(i) * density, p.getY(i) * density);
  }
  uv.needsUpdate = true;
  return g;
}
/* a yellow cab from primitives: body, cabin, glass, bumpers, roof light. Wheels are the caller's instances. */
function cab(k: Kit, yellow: T.Material, glass: T.Material, dark: T.Material, light: T.Material) {
  const g = new T.Group();
  const add = (geo: T.BufferGeometry, m: T.Material, x: number, y: number, z: number) => { const o = new T.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; };
  add(new T.BoxGeometry(1.9, 0.6, 4.7), yellow, 0, 0.65, 0);
  add(new T.BoxGeometry(1.75, 0.62, 2.6), yellow, 0, 1.24, -0.2);
  add(new T.BoxGeometry(1.78, 0.5, 2.5), glass, 0, 1.22, -0.2);
  add(new T.BoxGeometry(1.95, 0.2, 0.2), dark, 0, 0.45, 2.4);
  add(new T.BoxGeometry(1.95, 0.2, 0.2), dark, 0, 0.45, -2.4);
  add(new T.BoxGeometry(1.7, 0.08, 4.5), dark, 0, 0.32, 0);
  const lamp = add(new T.BoxGeometry(0.7, 0.16, 0.22), light, 0, 1.63, 0.2);
  g.userData.lamp = lamp;
  return g;
}

/* ---------------- 112 THE LAUNDROMAT ---------------- */
export const laundry: RoomDef = {
  id: 'laundry',
  name: 'Spin cycle for a sleepless city',
  area: 'ROOSEVELT AVENUE, JACKSON HEIGHTS',
  mood: 'Three in the morning',
  color: '#85b9bf',
  daylit: false,
  description: 'A 24 hour laundromat under the 7 train at 3 a.m.: a horseshoe of washers and stacked dryers turning behind round glass, folding tables down the middle, fluorescent light on the sidewalk, the works on enamel panels above the machines.',
  signatures: 'The yellow and red LAVANDERIA sign, the OPEN 24 HOURS neon in the window, the horseshoe of front loaders with drums turning, rolling wire baskets, orange plastic chairs at the window, the change machine and the soap vending wall, the TV on its bracket, the el across the avenue.',
  build(k, ctx) {
    k.sky({ top: 0x070a16, horizon: 0x1c2236, ground: 0x07080c, fog: 0.0035, stars: 320, env: 0.45 });
    k.hemi(0xb8c4e0, 0x141218, 0.42);
    k.sun(0x9fb0e0, 0.35, -40, 50, 30, false, 60);
    const floorT = k.pbr('lauFloor', X.terrazzo(0xb9b4a6, 401), 1.3, { roughness: 0.5 }),
      wall = k.pbr('lauWall', X.plaster(0xcfe0d6, 402), 0.5, { roughness: 0.9 }),
      dado = k.pbr('lauDado', X.subwayTile(0xdad5c4, 0x6a6a62), 0.9, { roughness: 0.3 }),
      ceil = k.pbr('lauCeil', X.plaster(0xf2f1ec, 404), 0.8, { roughness: 0.95, emissive: 0x8a9098, emissiveIntensity: 0.4 }),
      brick = k.pbr('lauBrick', X.brick(0x8a5a48, 405), 0.28),
      cornice = k.pbr('nbCornice', X.plaster(0xb8ad9a, 3), 0.6),
      gate = k.pbr('lauGate', X.steel(0x6a7078, false, 406), 0.5, { metalness: 0.7, roughness: 0.5, stretch: 0.25 }),
      enamel = k.flat(0xe8e9e5, 0.15, 0.35),
      chrome = k.flat(0xcfd3d6, 0.9, 0.22),
      glass = k.glass(0xa8c4d0, 0.28, 0.05),
      drum = k.flat(0x24272b, 0.5, 0.5),
      paddle = k.flat(0x9aa0a6, 0.8, 0.3),
      laminate = k.flat(0xefece2, 0, 0.5),
      orange = k.flat(0xe2622a, 0, 0.6),
      wire = k.flat(0xd8dce0, 0.8, 0.35, { transparent: true, opacity: 0.5 }),
      dark = k.flat(0x1c1f24, 0.4, 0.6),
      blue = k.flat(0x2a4aa8, 0.2, 0.5),
      tube = k.glow(0xeef4ff),
      warm = k.glow(0xffd28a),
      glassDark = k.glass(0x9fc4d8, 0.35, 0.08),
      iron = k.flat(0x1f262b, 0.75, 0.45),
      steel = k.flat(0x5a6470, 0.8, 0.4),
      neonRed = k.glow(0xff4a3a);
    // the avenue: Roosevelt under the el, the block across, the neighbours, a cab going by
    street(k, { w: 16, len: 130, z: 0 });
    blockFront(k, { x: -13, z0: 52, count: 13, face: 1, seed: 411, h: [10, 16] });
    blockFront(k, { x: 13, z0: 52, count: 4, face: -1, seed: 412, h: [10, 16] });
    blockFront(k, { x: 13, z0: -20, count: 5, face: -1, seed: 413, h: [10, 16] });
    for (const s of [-1, 1]) { k.box(9, 6, 7, 17.5, 3, s * 12.5, brick); k.box(0.12, 3.6, 5.6, 13.02, 1.8, s * 12.5, gate); k.moulding([[0, 0], [0.5, 0], [0.55, 0.2], [0.3, 0.4], [0, 0.5]], 7, 12.95, 5.5, s * 12.5, cornice, 0); }
    k.skyline({ z: -140, count: 14, spacing: 8, scale: 1.3, base: -2, seed: 414, lit: 0.3, glow: 0.8, tint: 0x2a3040, rows: 1 });
    // the el: the Flushing line carried over Roosevelt Avenue the whole length of the block and on into the night
    const EL0 = -200, EL1 = 170, ELc = (EL0 + EL1) / 2, ELn = EL1 - EL0;
    let elCol: T.Mesh | null = null;
    for (const z of [-190, -166, -142, -118, -94, -70, -46, -22, 12, 36, 60, 84, 108, 132, 156]) {
      for (const x of [-6.5, 6.5]) { const c = k.cyl(0.45, 8.9, x, 4.45, z, steel, 0.45, 10); if (z === 12 && x > 0) elCol = c; k.box(1.2, 0.3, 1.2, x, 0.15, z, dark); k.keepOut.push({ x, z, r: 0.7 }); }
      k.box(14.2, 1.0, 0.8, 0, 8.9, z, steel);
    }
    k.box(1.0, 1.4, ELn, -6.5, 9.6, ELc, steel); k.box(1.0, 1.4, ELn, 6.5, 9.6, ELc, steel); k.box(14, 0.5, ELn, 0, 10.4, ELc, dark);
    for (let z = EL1 - 2; z > EL0; z -= 2.4) k.box(15, 0.14, 0.35, 0, 10.75, z, iron);
    for (const s of [-1, 1]) k.box(0.08, 1.1, ELn, s * 7.4, 11.3, ELc, iron);
    for (const x of [-3.1, -1.7, 1.7, 3.1]) k.box(0.1, 0.12, ELn, x, 10.88, ELc, chrome);
    for (const z of [26, -26]) for (const s of [-1, 1]) k.lamp(s * 10.5, z, 6.5, iron, 0xffd9a8, 26);
    k.prop('hydrant', -10.6, 0, 8, { height: 1.1, keepOut: 0.5 });
    k.prop('mailbox', 10.7, 0, -14, { height: 1.5, rotY: PI / 2, keepOut: 0.6 });
    k.prop('utility_pole', 10.4, 0, 22, { height: 9, keepOut: 0.5 });
    k.prop('storm_drain', -8.6, 0.02, 30, { height: 0.08 });
    // the building: brick above the storefront, apartment windows, the neighbours' gates
    const SX = 13, W = 26, D = 18, H = 4.6;
    k.box(W, 10.1, D, SX + W / 2, H + 0.3 + 5.05, 0, brick);
    k.moulding([[0, 0], [0.7, 0], [0.8, 0.2], [0.5, 0.35], [0.6, 0.55], [0.25, 0.75], [0, 0.85]], D + 0.2, SX - 0.05, H + 9.5, 0, cornice, 0);
    for (let y = H + 3.2; y < H + 9; y += 2.7) for (let dz = -7.5; dz <= 7.5; dz += 3) { k.box(0.2, 1.9, 1.35, SX - 0.06, y, dz, cornice); k.box(0.05, 1.65, 1.1, SX + 0.06, y, dz, (dz + y) % 5 < 2 ? warm : glassDark); k.box(0.05, 1.7, 0.05, SX + 0.1, y, dz, iron); }
    k.prop('fire_escape', SX - 1.05, H + 2.6, -3, { height: 3.2, rotY: PI / 2 });
    k.prop('fire_escape', SX - 1.05, H + 5.3, -3, { height: 3.2, rotY: PI / 2 });
    k.prop('water_tower', SX + 18, H + 10.4, 4, { height: 5 });
    // the storefront: sill wall, big windows, the door, the bulkhead, the sign, the neon
    for (const s of [-1, 1]) { const zc = s * (1.6 + (D / 2 - 1.6) / 2), zw = D / 2 - 1.6; k.box(0.3, 0.9, zw, SX, 0.45, zc, dado); k.box(0.1, 2.3, zw, SX, 2.05, zc, glass); k.block(SX - 0.3, SX + 0.3, s > 0 ? 1.6 : -D / 2, s > 0 ? D / 2 : -1.6); }
    k.box(0.3, H - 3.2, D, SX, 3.2 + (H - 3.2) / 2, 0, wall);
    for (const z of [-1.7, 1.7]) k.box(0.12, 3.2, 0.12, SX, 1.6, z, iron);
    k.box(0.06, 0.06, 3.3, SX, 3.15, 0, iron);
    k.box(0.4, 1.1, D + 0.6, SX - 0.2, 5.3, 0, k.flat(0xf6d24a, 0, 0.5));
    k.sign('LAVANDERIA  ·  WASH  DRY  FOLD  ·  OPEN 24 HOURS', 17.6, 0.95, SX - 0.42, 5.3, 0, '#f4cf3c', '#b41d1d', 88, -PI / 2, { border: true });
    for (let i = 0; i < 5; i++) k.point(SX - 1.2, 5.0, -7 + i * 3.5, 0xffe08a, 10, 7);
    const neon = k.sign('OPEN  24  HRS', 2.6, 0.7, SX - 0.16, 2.6, 5.4, 'transparent', '#ff4a3a', 150, -PI / 2);
    const neonL = k.point(SX - 0.8, 2.6, 5.4, 0xff5a4a, 14, 6);
    k.box(0.04, 0.04, 2.8, SX - 0.14, 2.2, 5.4, neonRed);
    if (!ctx.reduced) k.ticks.push((t) => { const on = Math.sin(t * 2.6) > -0.6 && Math.sin(t * 17.1) > -0.92; neon.visible = on; neonL.intensity = on ? 14 : 2; });
    // the box: floor, walls, ceiling with the troffer grid, one tube that will not settle
    k.box(W, 0.3, D, SX + W / 2, -0.15, 0, floorT);
    k.box(W, 0.3, D, SX + W / 2, H + 0.15, 0, ceil);
    for (const s of [-1, 1]) { k.box(W, H, 0.3, SX + W / 2, H / 2, s * D / 2, wall); k.box(W, 1.2, 0.06, SX + W / 2, 0.6, s * (D / 2 - 0.18), dado); k.block(SX, SX + W, s > 0 ? D / 2 - 0.3 : -D / 2 - 0.3, s > 0 ? D / 2 + 0.3 : -D / 2 + 0.3); }
    k.box(0.3, H, D, SX + W, H / 2, 0, wall); k.block(SX + W - 0.3, SX + W + 0.3, -D / 2, D / 2);
    for (let x = SX + 3; x < SX + W - 1; x += 3.5) for (const z of [-6, -2, 2, 6]) if (!(x > 19 && x < 21 && z === -2)) k.box(1.2, 0.05, 0.32, x, H - 0.03, z, tube);
    for (const x of [SX + 4, SX + 13, SX + 22]) for (const z of [-4, 4]) k.point(x, H - 0.5, z, 0xe6f0ff, 13, 12);
    const flick = k.mesh(new T.BoxGeometry(1.2, 0.05, 0.32), k.glow(0xeef4ff), 20, H - 0.03, -2, true);
    const flickL = k.point(20, H - 0.5, -2, 0xe6f0ff, 10, 8);
    if (!ctx.reduced) k.ticks.push((t) => { const on = Math.sin(t * 9.3) * Math.sin(t * 2.1) > -0.35 || Math.sin(t * 31) > 0.97; flick.visible = on; flickL.intensity = on ? 10 : 0; });
    // the horseshoe: front loaders along the back, stacked dryers down both sides, every drum a window
    type Machine = { c: T.Vector3; q: T.Quaternion; d: number; tall: boolean; run: number };
    const machines: Machine[] = [];
    for (let i = 0; i < 20; i++) machines.push({ c: v(SX + W - 0.55, 0.55, -7.6 + i * 0.8), q: new T.Quaternion().setFromEuler(new T.Euler(0, -PI / 2, 0)), d: 0.4, tall: false, run: i % 5 < 2 ? 0.8 + (i % 3) * 0.4 : 0 });
    for (const s of [-1, 1]) for (let i = 0; i < 26; i++) machines.push({ c: v(SX + 2.6 + i * 0.85, 1.0, s * (D / 2 - 0.6)), q: new T.Quaternion().setFromEuler(new T.Euler(0, s > 0 ? PI : 0, 0)), d: 0.425, tall: true, run: (i + (s > 0 ? 1 : 0)) % 5 < 2 ? 0.6 + (i % 4) * 0.3 : 0 });
    const bodies: T.Matrix4[] = [], rings: T.Matrix4[] = [], glassM: T.Matrix4[] = [], drums: T.Matrix4[] = [], panels: T.Matrix4[] = [];
    type Port = { m: Machine; y: number };
    const ports: Port[] = [];
    const off = (m: Machine, lx: number, ly: number, lz: number) => v(lx, ly, lz).applyQuaternion(m.q).add(m.c);
    for (const m of machines) {
      bodies.push(new T.Matrix4().compose(m.c, m.q, v(0.78, m.tall ? 2.0 : 1.1, m.d * 2)));
      const ys = m.tall ? [-0.45, 0.5] : [0.05];
      for (const y of ys) { ports.push({ m, y }); const at = (dz: number) => new T.Matrix4().compose(off(m, 0, y, m.d + dz), m.q, v(1, 1, 1)); drums.push(at(0.012)); glassM.push(at(0.055)); rings.push(at(0.05)); }
      panels.push(new T.Matrix4().compose(off(m, 0, m.tall ? 0.93 : 0.47, m.d + 0.01), m.q, v(1, 1, 1)));
    }
    k.instances(new T.BoxGeometry(1, 1, 1), enamel, bodies);
    k.instances(new T.CircleGeometry(0.25, 18), drum, drums);
    k.instances(new T.CircleGeometry(0.255, 18), glass, glassM);
    k.instances(new T.TorusGeometry(0.265, 0.035, 8, 26), chrome, rings);
    k.instances(new T.BoxGeometry(0.6, 0.08, 0.02), dark, panels);
    const coins: T.Matrix4[] = []; for (const m of machines) coins.push(new T.Matrix4().compose(off(m, 0.24, m.tall ? 0.78 : 0.33, m.d + 0.02), m.q, v(1, 1, 1)));
    k.instances(new T.BoxGeometry(0.12, 0.09, 0.03), chrome, coins);
    k.block(SX + W - 1.0, SX + W, -D / 2, D / 2);
    for (const s of [-1, 1]) k.block(SX + 2.0, SX + W, s > 0 ? D / 2 - 1.1 : -D / 2, s > 0 ? D / 2 : -D / 2 + 1.1);
    // the drums that are running: paddles and a tumbling load, one instanced mesh each
    const running = ports.filter((p) => p.m.run > 0);
    const padG = new T.BoxGeometry(0.04, 0.2, 0.02), loadG = new T.SphereGeometry(0.05, 7, 5);
    const pads = k.instances(padG, paddle, running.flatMap(() => [new T.Matrix4(), new T.Matrix4(), new T.Matrix4()]));
    const loads = k.instances(loadG, k.flat(0xffffff, 0, 0.8), running.flatMap(() => [new T.Matrix4(), new T.Matrix4(), new T.Matrix4()]));
    const loadCols = [0xd23a2a, 0x2a4aa8, 0xf0e8d8, 0x3a8a4a, 0xe6b23a, 0x1a1a1e, 0xd88ab0];
    const cc = new T.Color();
    running.forEach((_, i) => { for (let j = 0; j < 3; j++) loads.setColorAt(i * 3 + j, cc.set(loadCols[(i * 3 + j) % loadCols.length])); });
    const spin = new T.Quaternion(), qq = new T.Quaternion(), mm = new T.Matrix4(), one = v(1, 1, 1), zAxis = v(0, 0, 1);
    const placeDrums = (t: number) => {
      running.forEach((p, i) => {
        const a = t * p.m.run * 2.2 + i * 0.7;
        for (let j = 0; j < 3; j++) {
          const ang = a + j * (PI * 2 / 3);
          spin.setFromAxisAngle(zAxis, ang - PI / 2); qq.copy(p.m.q).multiply(spin);
          mm.compose(off(p.m, Math.cos(ang) * 0.15, p.y + Math.sin(ang) * 0.15, p.m.d + 0.03), qq, one); pads.setMatrixAt(i * 3 + j, mm);
          const la = ang + 0.9, lr = 0.06 + 0.07 * Math.abs(Math.sin(t * 1.3 + j));
          mm.compose(off(p.m, Math.cos(la) * lr, p.y + Math.min(0.12, Math.sin(la) * lr + 0.03), p.m.d + 0.028), p.m.q, one); loads.setMatrixAt(i * 3 + j, mm);
        }
      });
      pads.instanceMatrix.needsUpdate = loads.instanceMatrix.needsUpdate = true;
    };
    placeDrums(0);
    if (!ctx.reduced) k.ticks.push((t) => placeDrums(t));
    // the middle: two folding tables, rolling baskets, a bench of orange chairs at the window
    for (const x of [SX + 9, SX + 17]) { k.box(1.1, 0.06, 5, x, 0.9, 0, laminate); k.box(1.0, 0.84, 4.9, x, 0.42, 0, k.flat(0xd8d3c4, 0, 0.6)); k.block(x - 0.6, x + 0.6, -2.5, 2.5); k.box(0.5, 0.18, 0.7, x - 0.2, 1.02, -1.2, blue); k.box(0.6, 0.12, 0.5, x + 0.1, 0.99, 1.4, k.flat(0xf0e8d8, 0, 0.8)); }
    for (const [bx, bz] of [[SX + 6.4, -3.4], [SX + 13, 3.6], [SX + 20.5, -3.6], [SX + 11.2, -3.9]]) { k.box(0.62, 0.7, 0.9, bx, 0.6, bz, wire); for (const dx of [-0.31, 0.31]) for (const dz of [-0.45, 0.45]) k.cyl(0.04, 0.24, bx + dx, 0.12, bz + dz, dark, 0.04, 8); k.box(0.66, 0.03, 0.94, bx, 0.96, bz, chrome); k.keepOut.push({ x: bx, z: bz, r: 0.55 }); }
    const seats: T.Matrix4[] = [], backs: T.Matrix4[] = [], legs: T.Matrix4[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = s * (3.2 + i * 0.95), x = SX + 1.1; seats.push(mat(x, 0.46, z, PI / 2)); backs.push(mat(x - 0.2, 0.78, z, PI / 2, 1, 1, 1, 0, 0.18)); for (const dx of [-0.18, 0.18]) for (const dz of [-0.18, 0.18]) legs.push(mat(x + dx, 0.22, z + dz)); k.keepOut.push({ x, z, r: 0.4 }); }
    k.instances(new T.BoxGeometry(0.46, 0.05, 0.46), orange, seats); k.instances(new T.BoxGeometry(0.46, 0.5, 0.05), orange, backs); k.instances(new T.CylinderGeometry(0.014, 0.014, 0.44, 5), chrome, legs);
    // the change machine, the soap wall, the TV on its bracket, the attendant's counter
    k.box(0.7, 1.8, 0.5, SX + 1.0, 0.9, -D / 2 + 1.0, blue); k.box(0.5, 0.35, 0.02, SX + 1.0, 1.4, -D / 2 + 1.26, k.glow(0xdbe6ff)); k.sign('CHANGE', 0.6, 0.18, SX + 1.0, 1.05, -D / 2 + 1.26, '#0d0d0d', '#f4cf3c', 90, 0); k.keepOut.push({ x: SX + 1.0, z: -D / 2 + 1.0, r: 0.6 });
    k.box(1.3, 1.9, 0.42, SX + 1.0, 0.95, D / 2 - 1.0, enamel); k.box(1.1, 1.3, 0.04, SX + 1.0, 1.1, D / 2 - 1.22, glass);
    const soaps: T.Matrix4[] = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) soaps.push(mat(SX + 0.55 + c * 0.22, 0.65 + r * 0.38, D / 2 - 1.1));
    const soapM = k.instances(new T.BoxGeometry(0.14, 0.24, 0.1), k.flat(0xffffff, 0, 0.6), soaps); soaps.forEach((_, i) => soapM.setColorAt(i, cc.set([0xe0402a, 0x2a5ac8, 0xf2b52a, 0x3aa05a, 0xf0f0e8][i % 5])));
    k.sign('SOAP  ·  BLEACH  ·  SOFTENER', 1.2, 0.16, SX + 1.0, 1.82, D / 2 - 1.22, '#0d0d0d', '#eef4ff', 80, 0);
    k.keepOut.push({ x: SX + 1.0, z: D / 2 - 1.0, r: 0.8 });
    const tv = k.mesh(new T.BoxGeometry(0.06, 0.62, 1.05), k.glow(0x8ab0ff), SX + 0.72, 3.75, 0, true); tv.rotation.z = -0.15;
    k.box(0.5, 0.7, 1.15, SX + 0.45, 3.75, 0, dark); k.beam(v(SX + 0.15, H - 0.05, 0), v(SX + 0.45, 4.15, 0), 0.03, chrome, 5);
    if (!ctx.reduced) { let last = 0; k.ticks.push((t) => { if (t - last > 0.35 + Math.abs(Math.sin(t)) * 0.6) { last = t; (tv.material as T.MeshBasicMaterial).color.set([0x8ab0ff, 0xdfe8ff, 0x5a7ad0, 0xffd8a0, 0xb0c8ff][Math.floor(t * 7) % 5]); } }); }
    k.box(2.2, 1.05, 0.7, SX + W - 2.4, 0.52, -D / 2 + 2.2, laminate); k.sign('DROP OFF  ·  WASH & FOLD  ·  $1.25 / LB', 2.0, 0.22, SX + W - 2.4, 0.8, -D / 2 + 2.56, '#0d0d0d', '#f4cf3c', 60, 0); k.keepOut.push({ x: SX + W - 2.4, z: -D / 2 + 2.2, r: 1.3 });
    k.sign('"FOLD"', 1.4, 0.36, SX + 13, H - 0.4, 0, 'transparent', '#0d0d0d', 120, -PI / 2, { double: true });
    // the people: two night shift figures inside, walkers under the el, a cab on the avenue
    k.crowd([v(SX + 4, 0, -5), v(SX + 12, 0, -3.2), v(SX + 21, 0, 3.2), v(SX + 6, 0, 5.4)], 3, { seed: 411, speed: 0.22, spread: 0.6, animate: !ctx.reduced, colors: [0x24262c, 0x8a3a3a, 0xd8d0c0] });
    k.crowd([v(-10.5, 0, 55), v(-10.5, 0, -55)], 5, { seed: 412, speed: 0.8, spread: 1.6, animate: !ctx.reduced });
    k.crowd([v(10.6, 0, 55), v(10.6, 0, 16)], 2, { seed: 413, speed: 0.7, spread: 1.2, animate: !ctx.reduced });
    const taxi = cab(k, k.flat(0xf2c230, 0.2, 0.45), glassDark, dark, k.glow(0xfff0c0));
    { const wm = new T.InstancedMesh(new T.CylinderGeometry(0.32, 0.32, 0.22, 12), dark, 4); [[-0.8, 1.5], [0.8, 1.5], [-0.8, -1.5], [0.8, -1.5]].forEach(([dx, dz], i) => wm.setMatrixAt(i, mat(dx, 0.32, dz, 0, 1, 1, 1, 0, PI / 2))); wm.instanceMatrix.needsUpdate = true; taxi.add(wm); }
    k.add(taxi);
    k.rider(taxi, k.spline([v(-4, 0, 62), v(-4, 0, -62), v(-1, 0, -66), v(4, 0, -62), v(4, 0, 62), v(1, 0, 66)], true), 8);
    // the 7 itself: two trains of five stainless cars, one on each track, their windows lit
    const carBody = k.flat(0xb8bec4, 0.8, 0.3), carWin = k.glow(0xfff2d6), carDark = k.flat(0x2a2e34, 0.5, 0.6);
    const train = () => { const parts: Part[] = []; for (let i = 0; i < 5; i++) { const z = (i - 2) * 15.6; parts.push([new T.BoxGeometry(2.7, 3.0, 15.2), carBody, 0, 2.0, z], [new T.BoxGeometry(2.74, 0.62, 13.8), carWin, 0, 2.35, z], [new T.BoxGeometry(2.3, 0.5, 14.6), carDark, 0, 0.3, z]); } return k.add(merged(parts)); };
    const trains = [train(), train()], runL = ELn - 100;
    const runTrains = (t: number) => trains.forEach((g, i) => { const u = (t * 11 + i * runL * 0.55) % runL; g.position.set(i ? 2.4 : -2.4, 10.8, i ? EL0 + 50 + u : EL1 - 50 - u); });
    runTrains(3);
    if (!ctx.reduced) k.ticks.push((t) => runTrains(t));
    // the route bullet on the girder, a garden apartment gate across the avenue, the plaza sign at the curb
    const seven = bullet(k, '7', '#b933ad', 0.55, 5.96, 9.6, 3.2, -PI / 2);
    const gx = -11.6, gz = -18, hedge = k.flat(0x2f5a32, 0, 0.9);
    for (const dz of [-1.6, 1.6]) { k.box(0.7, 2.8, 0.7, gx, 1.4, gz + dz, brick); k.box(0.85, 0.2, 0.85, gx, 2.9, gz + dz, cornice); k.keepOut.push({ x: gx, z: gz + dz, r: 0.55 }); }
    k.curve([v(gx, 2.7, gz - 1.25), v(gx, 3.5, gz), v(gx, 2.7, gz + 1.25)], 0.05, iron, 16);
    for (const s of [-1, 1]) { const zc = gz + s * 4.4; k.box(0.05, 0.08, 5.0, gx, 1.15, zc, iron); for (let i = 0; i < 13; i++) k.box(0.04, 1.2, 0.04, gx, 0.6, gz + s * (2.0 + i * 0.4), iron); k.box(1.1, 0.8, 5.0, gx - 0.75, 0.4, zc, hedge); k.block(gx - 0.1, gx + 0.1, zc - 2.5, zc + 2.5); }
    k.tree(-12.3, 0, gz, { h: 5.2, r: 2.2, seed: 415, leaf: 0x3a6a3a }); k.keepOut.push({ x: -12.3, z: gz, r: 0.5 });
    k.cyl(0.05, 3.9, 9.3, 1.95, -6.4, k.flat(0x1f5a3a, 0.4, 0.5), 0.05, 8); k.keepOut.push({ x: 9.3, z: -6.4, r: 0.35 });
    const plaza = k.sign('37 RD  ·  DIVERSITY PLAZA', 2.6, 0.36, 9.3, 3.6, -5.0, '#1f6a3a', '#f4f4ee', 64, -PI / 2, { border: true, double: true });
    // a wall clock over the change machine, stuck near three, its second hand still going
    const CKX = SX + 1.0, CKY = 2.62, CKZ = -D / 2 + 0.17;
    const face = k.cyl(0.26, 0.04, CKX, CKY, CKZ, enamel, 0.26, 24); face.rotation.x = PI / 2;
    k.torus(0.27, 0.025, CKX, CKY, CKZ + 0.01, dark, 32);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; const tk = k.box(0.018, i % 3 ? 0.035 : 0.06, 0.01, CKX + Math.sin(a) * 0.21, CKY + Math.cos(a) * 0.21, CKZ + 0.025, dark); tk.rotation.z = -a; }
    const hand = (len: number, w: number, a: number, m: T.Material, dyn: boolean) => { const g = new T.BoxGeometry(w, len, 0.008); g.translate(0, len * 0.42, 0); const o = k.mesh(g, m, CKX, CKY, CKZ + (dyn ? 0.04 : 0.032), dyn); o.rotation.z = -a; return o; };
    hand(0.13, 0.022, PI / 2 + 0.06, dark, false); hand(0.2, 0.014, (7 / 60) * PI * 2, dark, false);
    const second = hand(0.22, 0.006, 0, k.flat(0xc83a2a, 0, 0.6), true);
    if (!ctx.reduced) k.ticks.push((t) => { second.rotation.z = -Math.floor(t) * (PI / 30); });
    // a rolling cart making the rounds of the aisle, a bundle in it and two shirts on its pole
    const cart = k.add(merged([[new T.BoxGeometry(0.62, 0.6, 0.9), wire, 0, 0.62, 0], [new T.BoxGeometry(0.66, 0.03, 0.94), chrome, 0, 0.93, 0], [new T.BoxGeometry(0.03, 0.9, 0.03), chrome, 0, 1.38, -0.43], [new T.BoxGeometry(0.03, 0.9, 0.03), chrome, 0, 1.38, 0.43], [new T.BoxGeometry(0.03, 0.03, 0.9), chrome, 0, 1.82, 0], [new T.SphereGeometry(0.26, 8, 6), blue, 0, 0.72, 0.1], [new T.BoxGeometry(0.03, 0.55, 0.36), laminate, 0, 1.5, -0.15], [new T.BoxGeometry(0.03, 0.55, 0.36), orange, 0, 1.5, 0.2], ...[[-0.28, -0.4], [0.28, -0.4], [-0.28, 0.4], [0.28, 0.4]].map(([dx, dz]): Part => [new T.CylinderGeometry(0.05, 0.05, 0.04, 8), dark, dx, 0.07, dz, 0, 0, PI / 2])]));
    if (!ctx.reduced) k.rider(cart, k.spline([v(17, 0, -5.3), v(35, 0, -5.3), v(36.3, 0, 0), v(35, 0, 5.3), v(17, 0, 5.3), v(15.9, 0, 0)], true), 0.55);
    else cart.position.set(17, 0, -5.3);
    // the rack of finished orders by the drop off, a wet floor sign, jugs on the folding tables
    k.box(1.8, 0.03, 0.03, SX + 20.6, 1.75, -7.2, chrome); for (const dx of [-0.9, 0.9]) k.box(0.03, 1.75, 0.03, SX + 20.6 + dx, 0.875, -7.2, chrome);
    const shirts: T.Matrix4[] = []; for (let i = 0; i < 7; i++) shirts.push(mat(SX + 19.9 + i * 0.22, 1.42, -7.2));
    const shirtM = k.instances(new T.BoxGeometry(0.03, 0.62, 0.42), k.flat(0xffffff, 0, 0.8), shirts); shirts.forEach((_, i) => shirtM.setColorAt(i, cc.set([0xf0e8d8, 0x2a4aa8, 0x9a2a2a, 0xd8d0c0, 0x3a3a40, 0xe6b23a, 0xf4f4f0][i])));
    k.keepOut.push({ x: SX + 20.6, z: -7.2, r: 0.9 });
    for (const s of [-1, 1]) { const p = k.box(0.42, 0.62, 0.02, SX + 4.6, 0.3, -1.0 + s * 0.1, k.flat(0xf2c230, 0, 0.5)); p.rotation.x = s * 0.18; } k.keepOut.push({ x: SX + 4.6, z: -1.0, r: 0.4 });
    for (const [jx, jz, c] of [[SX + 9.2, 1.9, 0xe0402a], [SX + 8.8, 2.1, 0x2a5ac8], [SX + 17.3, -1.8, 0xf2b52a], [SX + 16.8, -2.0, 0x3aa05a]]) k.cyl(0.09, 0.28, jx, 1.07, jz, k.flat(c, 0, 0.5), 0.1, 10);
    // dryer exhaust breathing out of the vents above the sign into the cold
    for (const z of [-6, 6]) k.box(0.3, 0.3, 0.5, SX - 0.15, 6.35, z, chrome);
    const puffN = 36, puffP = new Float32Array(puffN * 3), puffC = new Float32Array(puffN * 3), puffG = new T.BufferGeometry();
    puffG.setAttribute('position', new T.BufferAttribute(puffP, 3)); puffG.setAttribute('color', new T.BufferAttribute(puffC, 3)); puffG.boundingSphere = new T.Sphere(v(SX - 1, 8.5, 0), 10);
    k.add(new T.Points(puffG, new T.PointsMaterial({ size: 1.3, map: X.pool(), vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending })));
    const puff = (t: number) => { for (let i = 0; i < puffN; i++) { const u = (t * 0.2 + i / puffN) % 1, z = i % 2 ? 6 : -6, b = 0.5 * (1 - u) * Math.min(1, u * 6); puffP.set([SX - 0.45 - u * 1.2, 6.4 + u * 4.2, z + Math.sin(t * 0.6 + i) * 0.5 * u], i * 3); puffC.set([b, b, b * 1.06], i * 3); } puffG.attributes.position.needsUpdate = puffG.attributes.color.needsUpdate = true; };
    puff(1.7);
    if (!ctx.reduced) k.ticks.push((t) => puff(t));
    // a souvenir from the end of the line, turning on the drop off counter
    const globe = k.add(merged([[new T.SphereGeometry(0.15, 14, 10), k.flat(0xc8ccd2, 0.9, 0.25, { wireframe: true }), 0, 0.3, 0], [new T.TorusGeometry(0.21, 0.007, 6, 36), chrome, 0, 0.3, 0, PI / 2 - 0.35, 0, 0.25], [new T.TorusGeometry(0.22, 0.007, 6, 36), chrome, 0, 0.3, 0, PI / 2 + 0.3, 0.9, 0], [new T.TorusGeometry(0.2, 0.007, 6, 36), chrome, 0, 0.3, 0, 0.4, 1.9, 0], [new T.CylinderGeometry(0.015, 0.05, 0.16, 8), chrome, 0, 0.08, 0], [new T.CylinderGeometry(0.12, 0.13, 0.02, 18), dark, 0, 0.01, 0]]));
    globe.position.set(SX + W - 1.7, 1.05, -D / 2 + 2.2);
    if (!ctx.reduced) k.ticks.push((t) => { globe.rotation.y = t * 0.3; });
    // the landmarks this avenue is built on
    k.egg(elCol ?? v(6.5, 4.45, 12), { id: 'el', title: 'The el over Roosevelt Avenue', year: '1917', text: 'The Flushing line opened on April 21, 1917, running trains from Queensboro Plaza out along Roosevelt Avenue to Alburtis Avenue, today 103rd Street, Corona Plaza. By January 1928 it reached Main Street, Flushing.', clue: 'Look up at the steel that carries the whole avenue on its shoulders.', source: { name: 'nycsubway.org', url: 'https://www.nycsubway.org/wiki/IRT_Flushing_Line' } });
    k.egg(seven, { id: 'express', title: 'The International Express', year: '1999', text: 'The 7 runs through so many immigrant neighbourhoods that it earned the nickname the International Express. In 1999 the White House designated the line a National Millennium Trail.', clue: 'A purple circle on the girder speaks every language on this avenue.', source: { name: 'QNS', url: 'https://qns.com/2000/01/the-community-of-flushing/' } });
    k.egg(v(gx, 1.8, gz), { id: 'garden', title: 'The garden apartment', year: '1917', text: 'The Queensboro Corporation coined the term garden apartment in 1917 for its first big Jackson Heights complex, planned around shared gardens. In 1993 the Landmarks Preservation Commission made about 36 blocks of the neighbourhood a historic district, then only the second in Queens.', clue: 'Across the avenue, a gate opens onto green that nobody owns alone.', source: { name: 'Jackson Heights Beautification Group', url: 'https://www.jhbg.org/history-of-jackson-heights' } }, { r: 1.8 });
    k.egg(plaza, { id: 'plaza', title: 'Diversity Plaza', year: '2012', text: 'In fall 2012 the city closed 37th Road to cars between Broadway and 74th Street and opened an interim plaza, now the public square of Jackson Heights. Rebuilt in permanent materials, it reopened in summer 2018.', clue: 'A green street sign at the curb points to the square everyone shares.', source: { name: 'NYC Street Design Manual', url: 'https://www.nycstreetdesign.info/studies/diversity-plaza' } });
    k.egg(globe, { id: 'unisphere', title: 'The globe at the end of the line', year: '1964', room: 'unisphere', text: "Out along the 7, in Flushing Meadows Corona Park, stands the Unisphere, the stainless steel Earth commissioned for the 1964 to 1965 World's Fair. It was designated an official city landmark in 1995.", clue: 'Someone left a tiny world on the drop off counter.', source: { name: 'NYC Parks', url: 'https://www.nycgovparks.org/parks/flushing-meadows-corona-park/highlights/12761' } });
    // the hang: enamel panels above the dryers and the washers, the community board over the window, the census as the notice wall
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const x = SX + 3.5 + i * 4.0; mounts.push(M(x, 3.35, s * (D / 2 - 0.2), x, s * 3.0, 3.4, 1.9, 'enamel', true)); }
    for (const z of [-6.2, 6.2]) mounts.push(M(SX + W - 0.2, 3.3, z, SX + W - 5, z, 3.6, 2.0, 'enamel', true));
    for (const z of [-7.2, -2.4, 2.4, 7.2]) mounts.push(M(SX + 0.2, 3.9, z, SX + 5.5, z, Math.abs(z) > 5 ? 2.8 : 3.0, 1.3, 'enamel', false));
    k.censusWall({ x: SX + W - 0.2, y: 3.3, z: 0, rotY: -PI / 2, cols: 12, rows: 3, tile: 0.5, gap: 0.05, start: ctx.wallStart(6200, 36), pieces: ctx.all, backing: dark });
    return { mounts, spawn: v(4.0, 2.8, 0), look: v(SX + W, 3.2, 0), eye: 2.8, bounds: [-12.4, SX + W - 0.5, -50, 50], style: 'enamel' };
  },
};

/* ---------------- 113 THE TAXI GARAGE ---------------- */
export const taxi: RoomDef = {
  id: 'taxidispatch',
  name: 'Every light is a fare',
  area: 'VERNON BOULEVARD, LONG ISLAND CITY',
  mood: 'Five o\'clock shift change',
  color: '#e1b850',
  description: 'A medallion garage in Long Island City at the five o\'clock shift change: roll up doors open to the low sun, a fan of numbered dispatch bays, a cab on the lift, the dispatcher in a glass booth under the radio mast, the works hung one to a bay and along the medallion wall.',
  signatures: 'The corrugated roll up doors, the fan of yellow bay lines on an oil stained floor, hanging bay numbers, yellow cabs with their roof lights blinking, the hydraulic lift, tire stacks, the dispatch booth and its antenna, the Manhattan skyline at the end of the street across the river.',
  build(k, ctx) {
    k.sky({ top: 0x6f94c4, horizon: 0xf2c896, ground: 0x4a4038, fog: 0.0028, sun: { az: 3.3, el: 0.16, color: 0xffc08a, size: 22 }, haze: 0.5, env: 0.85 });
    k.hemi(0xe8ecff, 0x5a4a3a, 0.95);
    k.sun(0xffb073, 2.6, -34, 22, -90, false, 80);
    const conc = k.pbr('txFloor', X.concrete(0x8c8d89, 421), 0.3, { roughness: 0.75 }),
      brick = k.pbr('txBrick', X.brick(0x7a5040, 422), 0.28),
      block = k.pbr('txBlock', X.ashlar(0xb9b4a4, 423, 2), 0.55, { roughness: 0.95 }),
      corr = k.pbr('txDoor', X.steel(0x8a8e92, false, 424), 0.6, { metalness: 0.6, roughness: 0.5, stretch: 0.2 }),
      roofM = k.flat(0x2a2c30, 0.4, 0.7),
      steel = k.flat(0x4a525c, 0.8, 0.45),
      steelL = k.flat(0x9aa2aa, 0.85, 0.35),
      yellow = k.flat(0xf2c230, 0.2, 0.45),
      paint = k.flat(0xe6b81e, 0, 0.7),
      dark = k.flat(0x1c1f24, 0.4, 0.6),
      stain = k.flat(0x141416, 0.1, 0.9, { transparent: true, opacity: 0.32 }),
      glass = k.glass(0xcfe4ee, 0.22, 0.05),
      glassDark = k.glass(0x9fc4d8, 0.35, 0.08),
      red = k.flat(0xb8262a, 0.2, 0.5),
      rubber = k.flat(0x1a1a1c, 0.1, 0.9),
      warm = k.glow(0xffe0b0),
      sky = k.glow(0xffe9c8),
      cornice = k.pbr('nbCornice', X.plaster(0xb8ad9a, 3), 0.6);
    // the boulevard: low rise LIC on both sides, the East River and Manhattan at the end of the street
    street(k, { w: 18, len: 160, z: 0 });
    blockFront(k, { x: -14, z0: 60, count: 15, face: 1, seed: 421, h: [8, 14] });
    blockFront(k, { x: 13, z0: 60, count: 4, face: -1, seed: 422, h: [8, 14] });
    blockFront(k, { x: 13, z0: -34, count: 5, face: -1, seed: 423, h: [8, 14] });
    k.water({ y: -1.4, color: 0x2e4a62, w: 460, d: 220, z: -200, amp: 0.9 });
    k.box(60, 1.6, 6, 0, -0.6, -84, k.pbr('txBulk', X.ashlar(0x6a6a66, 425, 2), 0.4));
    k.skyline({ z: -280, count: 30, spacing: 8, scale: 2.4, base: -1.4, seed: 426, lit: 0.3, glow: 0.7, tint: 0x4a5060, rows: 2, spires: true });
    for (const z of [30, -30, -70]) for (const s of [-1, 1]) k.lamp(s * 11.5, z, 7, steel, 0xffd9a8, 20);
    k.prop('hydrant', -11.6, 0, 14, { height: 1.1, keepOut: 0.5 });
    k.prop('utility_pole', 11.4, 0, -26, { height: 9, keepOut: 0.5 });
    k.prop('utility_pole', -11.4, 0, 44, { height: 9, keepOut: 0.5 });
    // the side lot: chain link, two cabs waiting for their drivers
    const fence = k.flat(0x8c98a4, 0.9, 0.3, { transparent: true, opacity: 0.5 });
    k.box(0.03, 2.4, 8, 13.2, 1.2, 26, fence); for (let z = 22; z <= 30; z += 4) k.box(0.08, 2.5, 0.08, 13.2, 1.25, z, steelL); k.block(12.9, 13.5, 22, 30);
    k.box(12, 0.3, 8, 19, -0.15, 26, k.pbr('txLot', X.asphalt(0x2a2c30), 0.12));
    // the garage: a wide brick shed, four piers, three doors, one of them down
    const GX = 13, GW = 40, GD = 44, H = 7.6;
    k.box(GW, 0.3, GD, GX + GW / 2, -0.15, 0, conc);
    for (const s of [-1, 1]) { k.box(GW, H, 0.4, GX + GW / 2, H / 2, s * GD / 2, block); k.block(GX, GX + GW, s > 0 ? GD / 2 - 0.4 : -GD / 2 - 0.4, s > 0 ? GD / 2 + 0.4 : -GD / 2 + 0.4); }
    k.box(0.4, H, GD, GX + GW, H / 2, 0, block); k.block(GX + GW - 0.4, GX + GW + 0.4, -GD / 2, GD / 2);
    k.box(GW + 0.8, 0.5, GD + 0.8, GX + GW / 2, H + 0.25, 0, roofM);
    for (const [z0, z1] of [[-GD / 2, -15.2], [-8.8, -3.2], [3.2, 8.8], [15.2, GD / 2]]) { const zc = (z0 + z1) / 2, w = z1 - z0; k.box(0.5, H + 1.2, w, GX, (H + 1.2) / 2, zc, brick); k.box(0.56, 1.2, w, GX, 0.6, zc, paint); k.block(GX - 0.3, GX + 0.3, z0, z1); }
    for (const zc of [-12, 0, 12]) { k.box(0.5, H + 1.2 - 5.2, 6.4, GX, 5.2 + (H + 1.2 - 5.2) / 2, zc, brick); k.box(0.7, 0.5, 6.6, GX, 5.35, zc, steel); }
    for (const zc of [-18.6, -6, 6, 18.6]) { k.box(0.2, 1.3, 3.2, GX - 0.2, 7.0, zc, cornice); k.box(0.06, 1.1, 3.0, GX - 0.32, 7.0, zc, glassDark); }
    const door = k.mesh(boxUV(new T.BoxGeometry(0.16, 5.0, 6.3), 0.6), corr, GX + 0.1, 2.55, -12, true); k.block(GX - 0.3, GX + 0.3, -15.2, -8.8);
    // the down door rolls up for a cab now and then, and comes back down
    if (!ctx.reduced) k.ticks.push((t) => { const c = (t % 30) / 30, o = c < 0.1 ? c / 0.1 : c < 0.45 ? 1 : c < 0.55 ? 1 - (c - 0.45) / 0.1 : 0, s = 1 - 0.8 * o; door.scale.y = s; door.position.y = 5.05 - 2.5 * s; });
    k.moulding([[0, 0], [0.7, 0], [0.8, 0.2], [0.5, 0.35], [0.6, 0.55], [0.25, 0.75], [0, 0.85]], GD + 0.4, GX - 0.05, H + 0.9, 0, cornice, 0);
    k.box(0.3, 1.5, 24, GX - 0.25, H + 2.2, 0, dark);
    k.sign('L.I.C. CAB CORP.  ·  MEDALLION GARAGE  ·  DISPATCH 24 HRS', 22, 1.3, GX - 0.42, H + 2.2, 0, '#141416', '#f2c230', 88, -PI / 2, { border: true });
    for (let i = 0; i < 4; i++) k.point(GX - 1.4, H + 1.6, -9 + i * 6, 0xffd060, 12, 9);
    // the roof inside: trusses, three bands of skylight, hanging shades
    const chords: T.Matrix4[] = [], diags: T.Matrix4[] = [], shades: T.Matrix4[] = [];
    for (let i = 0; i < 5; i++) { const x = GX + 4 + i * 8; chords.push(mat(x, H - 1.3, 0), mat(x, H - 0.25, 0)); for (let j = 0; j < 22; j++) { const z = -GD / 2 + 1 + j * 2; diags.push(mat(x, H - 0.78, z + 1, 0, 1, 1, 1, (j % 2 ? 1 : -1) * 0.76)); } }
    k.instances(new T.BoxGeometry(0.18, 0.18, GD - 1), steel, chords);
    k.instances(new T.BoxGeometry(0.08, 1.9, 0.08), steel, diags);
    for (const x of [GX + 8, GX + 20, GX + 32]) k.box(6, 0.06, GD - 3, x, H - 0.02, 0, sky);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const x = GX + 6 + i * 9.5, z = -14 + j * 14; shades.push(mat(x, H - 2.3, z)); if ((i + j) % 2 === 0) k.point(x, H - 2.9, z, 0xffe6b0, 30, 22); }
    k.instances(new T.ConeGeometry(0.55, 0.5, 14, 1, true), steelL, shades);
    // the fan: seven bays on an arc, yellow lines to each, a number hanging over every one
    const CX = 28, R = 22;
    const bays: { x: number; z: number; th: number }[] = [];
    for (let i = 0; i < 7; i++) { const th = (-55 + i * 18.33) * PI / 180; bays.push({ x: CX + Math.cos(th) * R, z: Math.sin(th) * R, th }); }
    bays.forEach((b, i) => {
      const ry = -b.th + PI / 2;
      const panel = k.box(6.6, 5.2, 0.3, b.x, 2.6, b.z, block); panel.rotation.y = ry;
      const stripe = k.box(6.6, 1.0, 0.34, b.x, 0.5, b.z, paint); stripe.rotation.y = ry;
      const ux = -Math.sin(ry), uz = -Math.cos(ry);
      for (const s of [-1, 1]) { const px = b.x + Math.cos(ry) * s * 2.9 + ux * 4.2, pz = b.z - Math.sin(ry) * s * 2.9 + uz * 4.2; const line = k.box(0.12, 0.012, 8.4, px, 0.16, pz, paint); line.rotation.y = ry; }
      const sx = b.x + ux * 1.2, sz = b.z + uz * 1.2;
      k.box(0.06, 0.06, 1.2, sx, H - 0.9, sz, steel).rotation.y = ry;
      k.sign(String(i + 1), 0.9, 0.9, sx, H - 1.95, sz, '#f2c230', '#141416', 520, ry + PI, { border: true, double: true });
      for (let s = -2; s <= 2; s++) k.keepOut.push({ x: b.x + Math.cos(ry) * s * 1.4, z: b.z - Math.sin(ry) * s * 1.4, r: 0.95 });
    });
    for (const s of [-1, 1]) k.keepOut.push({ x: 39.5, z: s * 20.6, r: 1.4 });
    for (let i = 0; i < 9; i++) { const r = X.mulberry(431 + i); const o = k.mesh(new T.CircleGeometry(0.9 + r() * 1.2, 14), stain, GX + 6 + r() * 26, 0.02, -16 + r() * 32); o.rotation.x = -PI / 2; o.scale.x = 1.6; }
    // the machines: the lift with a cab up on it, tire stacks, the tool chest, drums of oil
    const cabYellow = yellow;
    const wheels: T.Matrix4[] = [];
    const park = (x: number, z: number, ry: number, y = 0) => { const lamp = cabStatic(k, x, y, z, ry, cabYellow, glassDark, dark, new T.MeshBasicMaterial({ color: 0xfff0c0 })); for (const [dx, dz] of [[-0.8, 1.5], [0.8, 1.5], [-0.8, -1.5], [0.8, -1.5]]) { const p = v(dx, 0.32 + y, dz).applyAxisAngle(v(0, 1, 0), ry).add(v(x, 0, z)); wheels.push(mat(p.x, p.y, p.z, ry, 1, 1, 1, 0, PI / 2)); } k.keepOut.push({ x, z, r: 2.6 }); return lamp; };
    const parked = [park(bays[1].x - Math.cos(bays[1].th) * 3.4, bays[1].z - Math.sin(bays[1].th) * 3.4, PI / 2 - bays[1].th), park(bays[3].x - 3.4, bays[3].z, PI / 2), park(bays[5].x - Math.cos(bays[5].th) * 3.4, bays[5].z - Math.sin(bays[5].th) * 3.4, PI / 2 - bays[5].th), park(20, 26, 0.1), park(24, 26, -0.1)];
    const LX = 24, LZ = -15;
    for (const s of [-1, 1]) { k.box(0.5, 4.6, 0.6, LX, 2.3, LZ + s * 1.55, red); k.box(0.8, 0.08, 0.9, LX, 0.04, LZ + s * 1.55, dark); }
    k.box(0.5, 0.3, 3.7, LX, 4.5, LZ, red);
    // the lift: a cab and its arms going up for the night mechanic, and coming down again
    const liftLamp = new T.MeshBasicMaterial({ color: 0xfff0c0 });
    const lift = k.add(merged([...cabParts(cabYellow, glassDark, dark, rubber), [new T.BoxGeometry(0.7, 0.16, 0.22), liftLamp, 0, 1.63, 0.2], ...[-1, 1].flatMap((s): Part[] => [[new T.BoxGeometry(1.05, 0.1, 0.16), steelL, s * 1.02, 0.2, 1.3], [new T.BoxGeometry(1.05, 0.1, 0.16), steelL, s * 1.02, 0.2, -1.3], [new T.BoxGeometry(0.34, 0.6, 0.3), steel, s * 1.55, 0.35, 0]])]));
    lift.rotation.y = PI / 2;
    const liftH = (t: number) => { const c = (t % 24) / 24, s = c < 0.18 ? c / 0.18 : c < 0.6 ? 1 : c < 0.78 ? 1 - (c - 0.6) / 0.18 : 0; return 0.1 + 1.8 * s * s * (3 - 2 * s); };
    lift.position.set(LX, liftH(8), LZ);
    if (!ctx.reduced) k.ticks.push((t) => { lift.position.y = liftH(t); });
    k.keepOut.push({ x: LX, z: LZ, r: 2.6 });
    parked.push(lift.children.find((c) => (c as T.Mesh).material === liftLamp) as T.Mesh<T.BufferGeometry, T.Material>);
    k.instances(new T.CylinderGeometry(0.32, 0.32, 0.22, 12), rubber, wheels);
    const tires: T.Matrix4[] = [];
    for (const [tx, tz, n] of [[30, -19.5, 5], [32, -19.5, 4], [34, -19.5, 6]]) for (let i = 0; i < n; i++) tires.push(mat(tx, 0.18 + i * 0.24, tz, 0, 1, 1, 1, PI / 2));
    k.instances(new T.TorusGeometry(0.33, 0.12, 8, 18), rubber, tires);
    for (const [tx, tz] of [[30, -19.5], [32, -19.5], [34, -19.5]]) k.keepOut.push({ x: tx, z: tz, r: 0.6 });
    k.box(1.4, 1.0, 0.6, 20, 0.5, -19.6, red); k.box(1.4, 0.05, 0.62, 20, 1.03, -19.6, dark); k.keepOut.push({ x: 20, z: -19.6, r: 0.9 });
    for (let i = 0; i < 4; i++) { k.cyl(0.3, 0.9, 36.5 + i * 0.7, 0.45, 20.5, i % 2 ? dark : k.flat(0x2a5aa8, 0.2, 0.6), 0.3, 12); }
    k.keepOut.push({ x: 37.5, z: 20.5, r: 1.6 });
    // the dispatcher: a glass booth on a step, the radio, the antenna up through the roof, a beacon on top
    const BX = 17.5, BZ = -17.5;
    k.box(4.4, 0.36, 3.6, BX, 0.18, BZ, block);
    k.box(4.0, 1.2, 3.2, BX, 0.96, BZ, dark); k.box(4.0, 1.6, 3.2, BX, 2.36, BZ, glass); k.box(4.2, 0.2, 3.4, BX, 3.26, BZ, dark);
    for (const [dx, dz] of [[-1.95, -1.55], [1.95, -1.55], [-1.95, 1.55], [1.95, 1.55]]) k.box(0.1, 2.9, 0.1, BX + dx, 1.8, BZ + dz, steelL);
    k.box(0.5, 0.3, 0.3, BX + 1.2, 1.7, BZ, dark); k.box(0.02, 0.18, 0.2, BX + 1.46, 1.72, BZ, k.glow(0x9ad0ff));
    k.point(BX, 2.4, BZ, 0xffd090, 8, 5);
    k.sign('"DISPATCH"', 2.6, 0.5, BX, 3.0, BZ + 1.62, 'transparent', '#f2c230', 120, 0);
    k.keepOut.push({ x: BX, z: BZ, r: 2.9 });
    k.beam(v(BX, 3.4, BZ), v(BX, 16, BZ), 0.09, steelL, 6);
    for (const y of [11, 13, 15]) k.box(1.6, 0.05, 0.05, BX, y, BZ, steelL);
    const beacon = k.mesh(new T.SphereGeometry(0.22, 10, 8), k.glow(0xff3a2a), BX, 16.2, BZ, true);
    const beaconL = k.point(BX, 16.2, BZ, 0xff3a2a, 30, 24);
    if (!ctx.reduced) k.ticks.push((t) => { const on = (t % 1.6) < 0.35; beacon.visible = on; beaconL.intensity = on ? 30 : 0; });
    // the shift board, the medallion wall, the works
    const board = k.sign('SHIFT CHANGE 5:00  ·  OUT 27  ·  IN 14', 5.6, 0.7, GX + 0.32, 6.4, -12, '#141416', '#f2c230', 88, PI / 2, { border: true });
    if (!ctx.reduced) { let out = 27, inn = 14, last = 0; k.ticks.push((t) => { if (t - last > 4.5) { last = t; if (Math.sin(t * 1.7) > 0) out++; else inn++; (board.material as T.MeshBasicMaterial).map = X.signText(`SHIFT CHANGE 5:00  ·  OUT ${out}  ·  IN ${inn}`, 1024, 128, '#141416', '#f2c230', 88, { border: true }); (board.material as T.MeshBasicMaterial).needsUpdate = true; } }); }
    k.censusWall({ x: 23, y: 3.4, z: -GD / 2 + 0.24, rotY: 0, cols: 14, rows: 4, tile: 0.5, gap: 0.05, start: ctx.wallStart(6400, 56), pieces: ctx.all, backing: dark });
    k.sign('THE MEDALLION WALL  ·  EVERY DRIVER ON THE FIVE O\'CLOCK', 7.6, 0.5, 23, 5.9, -GD / 2 + 0.24, 'transparent', '#f2c230', 60, 0);
    // the people: drivers waiting on their cabs, the sidewalk across the boulevard, a cab pulling in
    k.crowd([v(17, 0, -6), v(24, 0, 2), v(31, 0, -12), v(21, 0, -13)], 9, { seed: 427, speed: 0.3, spread: 1.4, animate: !ctx.reduced, colors: [0x24262c, 0x8a3a3a, 0x33477f, 0x151517, 0xc9a25a, 0x2b5f6e] });
    k.crowd([v(-11, 0, 60), v(-11, 0, -60)], 10, { seed: 428, speed: 0.9, spread: 1.6, animate: !ctx.reduced });
    const mover = cab(k, cabYellow, glassDark, dark, new T.MeshBasicMaterial({ color: 0xfff0c0 }));
    mover.add(new T.InstancedMesh(new T.CylinderGeometry(0.32, 0.32, 0.22, 12), rubber, 4));
    { const wm = mover.children[mover.children.length - 1] as T.InstancedMesh; [[-0.8, 1.5], [0.8, 1.5], [-0.8, -1.5], [0.8, -1.5]].forEach(([dx, dz], i) => wm.setMatrixAt(i, mat(dx, 0.32, dz, 0, 1, 1, 1, 0, PI / 2))); wm.instanceMatrix.needsUpdate = true; }
    k.add(mover);
    k.rider(mover, k.spline([v(-2, 0, 78), v(-2, 0, 30), v(3, 0, 19), v(9, 0, 14.5), v(16, 0, 13), v(28, 0, 12), v(41, 0, 7), v(44, 0, -4), v(37, 0, -9), v(26, 0, -5), v(19, 0, 5), v(15, 0, 10.4), v(9, 0, 11.5), v(2, 0, 24), v(-5, 0, 44), v(-5, 0, 96), v(-1, 0, 104), v(-2, 0, 96)], true), 6.5);
    const lamps = [mover.userData.lamp as T.Mesh, ...parked];
    if (!ctx.reduced) k.ticks.push((t) => lamps.forEach((l, i) => { (l.material as T.MeshBasicMaterial).color.set(Math.sin(t * 2.4 + i * 1.9) > 0.2 ? 0xfff0c0 : 0x6a5a30); }));
    // the medallion on the hood of the cab in bay four
    const medal = k.box(0.3, 0.02, 0.2, bays[3].x - 1.6, 0.965, bays[3].z, k.flat(0xd8dde2, 0.9, 0.25));
    // the time clock and card rack on the booth, where every shift starts and ends
    k.box(0.22, 0.5, 0.36, BX + 2.3, 1.6, BZ + 1.1, k.flat(0xd8d3c4, 0.2, 0.5)); k.box(0.06, 0.8, 0.5, BX + 2.24, 1.7, BZ + 0.3, steelL);
    k.box(0.02, 0.12, 0.26, BX + 2.42, 1.7, BZ + 1.1, dark);
    // Gantry Plaza at the end of the boulevard: the waterfront lawn and the Pepsi-Cola sign on its steel grid, lit red over the river
    const PX = -12, PZ = -87;
    k.box(44, 1.6, 8, PX, -0.6, PZ + 0.5, k.pbr('txBulk', X.ashlar(0x6a6a66, 425, 2), 0.4)); k.box(40, 0.1, 5, PX, 0.25, PZ + 2, k.pbr('txLawn', X.grass(0x4f7a3a, 429), 0.15));
    for (let i = 0; i <= 14; i++) k.box(0.18, 14.6, 0.18, PX - 21 + i * 3, 7.3, PZ, steel);
    for (const y of [0.4, 5.6, 9.8, 14.4]) k.box(42.4, 0.16, 0.16, PX, y, PZ, steel);
    for (let i = 0; i < 8; i++) k.box(0.5, 6, 0.5, PX - 19.6 + i * 5.6, 3, PZ + 0.5, steelL);
    const pepsiT = canvasTex(1024, 256, (g) => { g.font = 'italic 700 176px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.shadowColor = '#ff2a1a'; g.shadowBlur = 22; g.strokeStyle = '#ff6a50'; g.lineWidth = 10; g.strokeText('Pepsi=Cola', 512, 136); g.fillStyle = '#e0141c'; g.fillText('Pepsi=Cola', 512, 136); });
    const pepsi = twoFaced(k, pepsiT, 40, 10, PX, 9.6, PZ, PI);
    k.point(PX, 9, PZ + 4, 0xff3a2a, 60, 30);
    // upriver, the Queensboro Bridge striding over the East River on its stone piers
    const QX = 118, piers = [-92, -148, -186, -246, -290], deckY = 24, qb = k.flat(0x6a7078, 0.6, 0.5), pierStone = k.pbr('txPier', X.ashlar(0x9a9084, 427, 3), 0.25);
    for (const z of piers) { k.box(16, deckY + 1.4, 7, QX, deckY / 2 - 0.7, z, pierStone); for (const s of [-1, 1]) { k.box(1.4, 24, 1.4, QX + s * 6, deckY + 12, z, qb); k.cyl(0.05, 4, QX + s * 6, deckY + 26, z, qb, 0.8, 8); } k.box(13.4, 1.2, 1.2, QX, deckY + 23, z, qb); }
    k.box(12.4, 1.4, piers[0] - piers[4], QX, deckY, (piers[0] + piers[4]) / 2, dark);
    for (const s of [-1, 1]) k.box(0.4, 0.9, piers[0] - piers[4], QX + s * 6, deckY + 1.1, (piers[0] + piers[4]) / 2, qb);
    for (let i = 0; i < piers.length - 1; i++) {
      const z0 = piers[i], z1 = piers[i + 1], n = Math.max(4, Math.round(Math.abs(z1 - z0) / 6));
      const top = (u: number) => deckY + 7 + 16 * Math.abs(2 * u - 1) ** 1.6;
      for (const s of [-1, 1]) {
        const x = QX + s * 6;
        for (let j = 0; j < n; j++) {
          const u0 = j / n, u1 = (j + 1) / n, za = z0 + (z1 - z0) * u0, zb = z0 + (z1 - z0) * u1;
          k.beam(v(x, top(u0), za), v(x, top(u1), zb), 0.55, qb, 6);
          k.beam(v(x, top(u0) - 1.2, za), v(x, top(u1) - 1.2, zb), 0.3, qb, 6);
          k.beam(v(x, deckY + 0.6, zb), v(x, top(u1), zb), 0.2, qb, 5);
          k.beam(v(x, deckY + 0.6, j % 2 ? za : zb), v(x, top(j % 2 ? u1 : u0), j % 2 ? zb : za), 0.16, qb, 5);
        }
      }
    }
    const ramp = k.box(12, 1.2, 46, QX, 12, -70, dark); ramp.rotation.x = Math.atan2(24, 44);
    // a ferry crossing the river under the bridge
    const ferry = k.add(merged([[new T.BoxGeometry(6, 1.4, 22), k.flat(0xf2f2ee, 0.1, 0.5), 0, 0.3, 0], [new T.BoxGeometry(5.2, 1.8, 13), k.flat(0xe8ecee, 0.1, 0.4), 0, 1.9, -1], [new T.BoxGeometry(5.3, 0.7, 12.4), glassDark, 0, 2.1, -1], [new T.BoxGeometry(6.05, 0.3, 22.05), k.flat(0x1f5aa8, 0.2, 0.5), 0, 0.7, 0]]));
    ferry.rotation.y = PI / 2;
    const runFerry = (t: number) => ferry.position.set(((t * 6) % 480) - 240, -1.2, -168);
    runFerry(20);
    if (!ctx.reduced) k.ticks.push((t) => runFerry(t));
    // the history this garage runs on
    k.egg(medal, { id: 'medallion', title: 'The medallion', year: '1937', text: "In 1937 Mayor LaGuardia introduced the medallion system and hack licenses. In 1971 the Taxi and Limousine Commission was created out of the NYPD's Hack Bureau, and it still licenses every yellow cab.", clue: 'The license is not in the glovebox: look on the hood of the cab in bay four.', source: { name: 'Brownstoner', url: 'https://www.brownstoner.com/history/where-to-mister/' } });
    k.egg(parked[3], { id: 'rooflight', title: 'Lit means free', year: '2012', text: 'On November 29, 2012 the TLC simplified the roof light: an illuminated medallion number means the cab is available for a hail, a dark one means it is taken or off duty. The separate off duty light was eliminated.', clue: 'Watch the roofs of the cabs waiting in the side lot.', source: { name: 'NYC TLC, Industry Notice 12-56', url: 'https://www.nyc.gov/assets/tlc/downloads/pdf/archived_industry_notices/industry_notice_12_56.pdf' } });
    k.egg(v(LX, 2.8, LZ), { id: 'yellow', title: 'Why every cab is yellow', year: '1967', text: 'The first metered taxicabs appeared in New York City in 1907, and by 1913 the city set the fare at 50 cents a mile. All medallion cabs were painted yellow in 1967.', clue: 'The cab going up and down on the lift wears the colour of a rule.', source: { name: 'NYC Department of Records', url: 'https://www.nyc.gov/html/records/html/newsletter/june2012.html' } }, { r: 2.4 });
    k.egg(pepsi, { id: 'pepsi', title: 'The Pepsi-Cola sign', year: '1940', room: 'gantry', text: 'Built in 1940 on the roof of the Pepsi bottling plant, it was then the longest electric sign in New York State, its letters edged in red neon. It now stands a few feet from its first spot, in Gantry Plaza State Park, a city landmark since 2016.', clue: 'Walk to where the boulevard runs out of land; red script is waiting over the water.', source: { name: 'NYC Landmarks Preservation Commission', url: 'https://s-media.nyc.gov/agencies/lpc/lp/1653.pdf' } });
    k.egg(v(QX - 6, deckY + 14, -148), { id: 'queensboro', title: 'The Queensboro Bridge', year: '1901 to 1908', room: 'queensboro', text: 'Begun in 1901 and completed in 1908, with Henry Hornbostel as architect, the bridge crosses the East River by way of Roosevelt Island to 59th and 60th Streets in Manhattan. The city designated it a landmark on April 16, 1974.', clue: 'Upriver, steel lace strides over the water on stone legs.', source: { name: 'NYC Landmarks Preservation Commission', url: 'https://s-media.nyc.gov/agencies/lpc/lp/0828.pdf' } }, { r: 7 });
    const mounts: Mount[] = [];
    bays.forEach((b) => mounts.push(M(b.x - Math.cos(b.th) * 0.2, 3.35, b.z - Math.sin(b.th) * 0.2, b.x - Math.cos(b.th) * 7, b.z - Math.sin(b.th) * 7, 5.0, 2.7, 'steel', true)));
    for (const x of [17.5, 24, 30.5, 37]) mounts.push(M(x, 3.5, GD / 2 - 0.24, x, GD / 2 - 6, 4.6, 2.6, 'steel', true));
    for (const x of [30, 36.5]) mounts.push(M(x, 3.5, -GD / 2 + 0.24, x, -GD / 2 + 6, 4.6, 2.6, 'steel', true));
    for (const z of [-6, 6]) mounts.push(M(GX + 0.28, 3.0, z, GX + 6, z, 4.6, 2.4, 'steel', true));
    for (const z of [-18.6, 18.6]) mounts.push(M(GX + 0.28, 3.5, z, GX + (z < 0 ? 7.8 : 6), z, 5.6, 2.8, 'steel', true));
    mounts.push(M(GX + 0.28, 6.3, 0, GX + 8, 0, 5.6, 2.0, 'steel', true));
    mounts.push(M(BX, 5.2, -GD / 2 + 0.24, BX, -GD / 2 + 8.2, 4.0, 2.2, 'steel', true));
    return { mounts, spawn: v(-9.5, 3, 0), look: v(GX + 18, 4.2, 0), eye: 3, bounds: [-13.4, GX + GW - 0.6, -70, 70], style: 'steel' };
  },
};

/* ---------------- 114 THE FLOWER COLD ROOM ---------------- */
export const flowercold: RoomDef = {
  id: 'flowercold',
  name: 'Before the flowers wake',
  area: 'WEST 28TH STREET, THE FLOWER DISTRICT',
  mood: 'Four in the morning',
  color: '#abbba2',
  daylit: false,
  description: 'A wholesaler\'s cold room on West 28th Street before dawn: strip curtains at the door, steel racks of buckets, tulips and roses by the hundred under frost coloured light, cold air pooling on the wet floor, the works on white fins floating over the flowers.',
  signatures: 'The green awnings and sidewalk buckets of the wholesalers, the plastic strip curtain, insulated panel walls, black buckets on wire racks, tulips and roses in colour blocks, a hand truck of buckets rolling the aisle, the evaporator fans, the loading dock and the delivery van at the curb.',
  build(k, ctx) {
    k.sky({ top: 0x0a1130, horizon: 0x3c3458, ground: 0x08080c, fog: 0.0034, stars: 260, env: 0.4 });
    k.hemi(0xcfe0ff, 0x101418, 0.5);
    k.sun(0x8090c0, 0.25, -40, 40, 30, false, 60);
    const floorT = k.pbr('fcFloor', X.concrete(0x6e7478, 441), 0.3, { roughness: 0.32, metalness: 0.1 }),
      panel = k.pbr('fcPanel', X.steel(0xd6dce0, false, 442), 0.5, { metalness: 0.3, roughness: 0.55 }),
      panelD = k.pbr('fcPanelD', X.steel(0xb8c0c6, false, 443), 0.5, { metalness: 0.3, roughness: 0.6 }),
      brick = k.pbr('fcBrick', X.brick(0x6a4a40, 444), 0.28),
      cornice = k.pbr('nbCornice', X.plaster(0xb8ad9a, 3), 0.6),
      awning = k.pbr('fcAwning', X.velvet(0x1f5a3a), 0.5, { roughness: 0.9 }),
      awningR = k.pbr('fcAwningR', X.velvet(0x8a2a2a), 0.5, { roughness: 0.9 }),
      corr = k.pbr('fcDock', X.steel(0x7a8288, false, 445), 0.6, { metalness: 0.6, roughness: 0.5, stretch: 0.2 }),
      fin = k.flat(0xf2f5f7, 0, 0.9, { emissive: 0xbfd4e8, emissiveIntensity: 0.12 }),
      steel = k.flat(0x9aa2aa, 0.85, 0.35),
      wire = k.flat(0xb8bcc0, 0.8, 0.35),
      bucketM = k.flat(0x1c1e22, 0.05, 0.6),
      stemM = k.flat(0x3d7a3a, 0, 0.9),
      headM = k.flat(0xffffff, 0, 0.75, { emissive: 0xffffff, emissiveIntensity: 0.12 }),
      dark = k.flat(0x1c1f24, 0.4, 0.6),
      white = k.flat(0xe8ecee, 0.1, 0.5),
      rubber = k.flat(0x1a1a1c, 0.1, 0.9),
      glass = k.glass(0xcfe4ee, 0.24, 0.05),
      glassDark = k.glass(0x9fc4d8, 0.35, 0.08),
      strip = k.glass(0xd8ecf4, 0.22, 0.1),
      frost = k.glow(0xdff4ff),
      warm = k.glow(0xffd28a);
    // the street: wholesalers under awnings, buckets on the sidewalk, palms in pots, the van at the curb
    street(k, { w: 16, len: 130, z: 0 });
    blockFront(k, { x: -13, z0: 52, count: 13, face: 1, seed: 446, h: [12, 20] });
    blockFront(k, { x: 13, z0: 52, count: 4, face: -1, seed: 447, h: [12, 20] });
    blockFront(k, { x: 13, z0: -20, count: 5, face: -1, seed: 448, h: [12, 20] });
    const aw = (x: number, z: number, len: number, m: T.Material, face: 1 | -1) => { const a = k.mesh(new T.BoxGeometry(2.4, 0.1, len), m, x + face * 1.1, 3.6, z); a.rotation.z = face * 0.3; k.box(0.05, 0.4, len, x + face * 2.15, 3.15, z, m); };
    for (const z of [44, 28, 12, -20, -36]) aw(-13, z, 7.4, z % 3 ? awning : awningR, 1);
    for (const z of [28, -20, -36]) aw(13, z, 7.4, awning, -1);
    for (const [x, z] of [[-9.2, 40], [-9.2, 18], [-9.2, -26], [9.4, -22], [9.4, 24]]) k.prop('palm_urn', x, 0, z, { height: 3.0, keepOut: 0.7 });
    for (const z of [36, -44]) for (const s of [-1, 1]) k.lamp(s * 10.5, z, 6.5, dark, 0xffd9a8, 24);
    k.prop('hydrant', -10.6, 0, 4, { height: 1.1, keepOut: 0.5 });
    k.prop('mailbox', -10.7, 0, -14, { height: 1.5, rotY: -PI / 2, keepOut: 0.6 });
    k.box(2.3, 2.3, 4.8, 5.2, 1.55, 17.6, white); k.box(2.2, 1.5, 1.9, 5.2, 1.05, 21.0, white); k.box(2.1, 0.8, 0.1, 5.2, 1.4, 21.96, glassDark);
    for (const [dx, dz] of [[-0.95, 19.2], [0.95, 19.2], [-0.95, 15.6], [0.95, 15.6]]) { const w = k.cyl(0.36, 0.26, 5.2 + dx, 0.36, dz, rubber, 0.36, 12); w.rotation.z = PI / 2; }
    k.sign('28TH STREET WHOLESALE FLOWERS', 3.6, 0.5, 6.37, 2.0, 17.6, 'transparent', '#1f5a3a', 80, PI / 2);
    k.keepOut.push({ x: 5.2, z: 18.5, r: 2.6 });
    // the building: brick above, the shop, the loading dock beside it
    const SX = 13, W = 30, D = 16, H = 5.8;
    k.box(W, 11.7, D + 7, SX + W / 2, H + 0.3 + 5.85, 3.5, brick);
    k.moulding([[0, 0], [0.7, 0], [0.8, 0.2], [0.5, 0.35], [0.6, 0.55], [0.25, 0.75], [0, 0.85]], D + 7.2, SX - 0.05, H + 11.2, 3.5, cornice, 0);
    for (let y = H + 2.6; y < H + 11; y += 2.7) for (let dz = -6; dz <= 13; dz += 3.2) { k.box(0.2, 1.9, 1.35, SX - 0.06, y, dz, cornice); k.box(0.05, 1.65, 1.1, SX + 0.06, y, dz, (dz + y) % 7 < 2 ? warm : glassDark); }
    k.prop('fire_escape', SX - 1.05, H + 2.2, 6, { height: 3.2, rotY: PI / 2 });
    k.prop('fire_escape', SX - 1.05, H + 4.9, 6, { height: 3.2, rotY: PI / 2 });
    k.box(5, 1.2, 5.6, SX + 2.5, 0.6, 11.7, k.pbr('fcDockC', X.concrete(0x8a8c88, 449), 0.3)); k.box(0.4, 0.4, 3.6, SX - 0.15, 1.05, 11.7, rubber);
    k.box(0.16, 3.4, 4.6, SX + 0.08, 2.9, 11.7, corr); k.box(0.5, 1.2, 0.5, SX + 0.25, 4.9, 11.7, dark); k.block(SX - 0.3, SX + 5.2, 9, 14.6);
    k.sign('RECEIVING  ·  5 AM', 2.2, 0.32, SX - 0.02, 4.9, 11.7, '#0d0d0d', '#f4f0e8', 90, -PI / 2);
    aw(SX, 0, D - 1, awning, -1);
    k.box(0.3, 0.3, D, SX - 0.1, H - 0.15, 0, panel);
    const trade = k.sign('CUT FLOWERS  ·  WHOLESALE  ·  OPEN 5 AM  ·  TO THE TRADE', 13, 0.42, SX - 2.2, 3.15, 0, 'transparent', '#f4f0e8', 70, -PI / 2);
    for (let i = 0; i < 3; i++) k.point(SX - 1.6, 3.0, -5 + i * 5, 0xffe0a0, 8, 7);
    // the front: panel wall, a window of flowers, the strip curtain door with its header
    for (const s of [-1, 1]) { const z0 = s > 0 ? 1.7 : -D / 2, z1 = s > 0 ? D / 2 : -1.7, zc = (z0 + z1) / 2, w = z1 - z0; k.box(0.3, H, w, SX, H / 2, zc, panel); k.block(SX - 0.3, SX + 0.3, z0, z1); }
    k.box(0.34, 1.7, 3.6, SX, 2.05, 5.2, k.flat(0xdfe8ee, 0, 0.8, { emissive: 0xbfd0dc, emissiveIntensity: 0.6 })); k.box(0.12, 1.5, 3.4, SX - 0.14, 2.05, 5.2, glass);
    k.sign('ROSES  ·  TULIPS  ·  PEONIES  ·  RANUNCULUS  ·  BY THE BUNCH', 3.2, 0.34, SX - 0.22, 2.55, 5.2, 'transparent', '#1f5a3a', 60, -PI / 2);
    k.box(0.3, H - 3.2, 3.4, SX, 3.2 + (H - 3.2) / 2, 0, panel);
    for (const z of [-1.8, 1.8]) k.box(0.34, 3.3, 0.16, SX, 1.65, z, steel);
    k.box(0.36, 0.2, 3.6, SX, 3.25, 0, steel);
    k.sign('"COLD"', 1.6, 0.38, SX - 0.2, 3.8, 0, 'transparent', '#0d0d0d', 120, -PI / 2, { double: true });
    const strips = k.instances(new T.PlaneGeometry(0.3, 3.1), strip, Array.from({ length: 12 }, (_, i) => mat(SX, 1.6, -1.55 + i * 0.28 + (i % 2) * 0.02, PI / 2)));
    if (!ctx.reduced) { const mm = new T.Matrix4(); k.ticks.push((t) => { for (let i = 0; i < 12; i++) { mm.compose(v(SX + Math.sin(t * 1.3 + i * 0.7) * 0.05, 1.6, -1.55 + i * 0.28), new T.Quaternion().setFromEuler(new T.Euler(0, PI / 2, Math.sin(t * 1.1 + i) * 0.03)), v(1, 1, 1)); strips.setMatrixAt(i, mm); } strips.instanceMatrix.needsUpdate = true; }); }
    // the box: wet floor, insulated walls and ceiling, cold strips, the evaporator fans
    k.box(W, 0.3, D, SX + W / 2, -0.15, 0, floorT);
    k.box(W, 0.3, D, SX + W / 2, H + 0.15, 0, panelD);
    for (const s of [-1, 1]) { k.box(W, H, 0.3, SX + W / 2, H / 2, s * D / 2, panel); k.block(SX, SX + W, s > 0 ? D / 2 - 0.3 : -D / 2 - 0.3, s > 0 ? D / 2 + 0.3 : -D / 2 + 0.3); }
    k.box(0.3, H, D, SX + W, H / 2, 0, panel); k.block(SX + W - 0.3, SX + W + 0.3, -D / 2, D / 2);
    for (const z of [-5, 0, 5]) k.box(W - 3, 0.05, 0.22, SX + W / 2, H - 0.03, z, frost);
    for (const x of [SX + 5, SX + 15, SX + 25]) for (const z of [-4, 4]) k.point(x, H - 0.6, z, 0xd8ecff, 20, 14);
    const fans: T.Group[] = [];
    for (const z of [-4.5, 4.5]) { k.box(2.6, 1.0, 1.6, SX + W - 1.6, H - 0.5, z, white); for (const dx of [-0.65, 0.65]) { const g = new T.Group(); g.position.set(SX + W - 2.42, H - 0.5, z + dx); g.rotation.y = -PI / 2; for (let b = 0; b < 5; b++) { const bl = new T.Mesh(new T.BoxGeometry(0.1, 0.42, 0.02), steel); bl.position.y = 0.2; const pv = new T.Group(); pv.rotation.z = (b * PI * 2) / 5; pv.add(bl); g.add(pv); } k.add(g); fans.push(g); } }
    if (!ctx.reduced) k.ticks.push((t) => fans.forEach((g, i) => { g.rotation.z = t * (7 + i); }));
    // flowers: buckets on the floor islands and the wall racks, tulips and roses instanced by the hundred
    const buckets: T.Matrix4[] = [], stems: T.Matrix4[] = [], tulips: T.Matrix4[] = [], roses: T.Matrix4[] = [];
    const tcols: number[] = [], rcols: number[] = [], rnd = X.mulberry(451);
    const tulipCols = [0xe0222a, 0xf2b52a, 0xf4f0e8, 0xf06aa0, 0xff6a2a, 0x7a2aa0], roseCols = [0xb8101e, 0xf4d2dc, 0xf4f0e8, 0xf08a2a, 0xe63a7a, 0xf2e26a];
    let bi = 0;
    const bucket = (x: number, y: number, z: number, n: number) => {
      buckets.push(mat(x, y + 0.21, z));
      const tulip = bi++ % 2 === 0, col = tulip ? tulipCols[Math.floor(rnd() * tulipCols.length)] : roseCols[Math.floor(rnd() * roseCols.length)];
      for (let i = 0; i < n; i++) {
        const a = rnd() * PI * 2, r = rnd() * 0.11, h = 0.5 + rnd() * 0.16, lean = (rnd() - 0.5) * 0.25;
        const sx = x + Math.cos(a) * r, sz = z + Math.sin(a) * r;
        stems.push(mat(sx, y + 0.3 + h / 2, sz, 0, 1, h / 0.55, 1, lean, lean * 0.7));
        const top = mat(sx + lean * 0.3, y + 0.3 + h, sz + lean * 0.2, rnd() * PI * 2);
        if (tulip) { tulips.push(top); tcols.push(col); } else { roses.push(top); rcols.push(col); }
      }
    };
    const islands = [[SX + 7, SX + 10], [SX + 12, SX + 15], [SX + 17, SX + 20], [SX + 22, SX + 25]];
    for (const [x0, x1] of islands) { k.box(x1 - x0 + 0.2, 0.22, 2.6, (x0 + x1) / 2, 0.11, 0, k.pbr('fcPallet', X.planks(0x8a7a60, 3, 452), 1.2)); k.block(x0 - 0.1, x1 + 0.1, -1.3, 1.3); for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) bucket(x0 + 0.3 + i * 0.6, 0.22, -0.9 + j * 0.6, 7); }
    const posts: T.Matrix4[] = [];
    for (const s of [-1, 1]) {
      const zr = s * (D / 2 - 0.7);
      for (const y of [0.05, 1.05, 2.05]) k.box(W - 4, 0.04, 1.0, SX + W / 2, y, zr, wire);
      for (let x = SX + 2; x <= SX + W - 2; x += 2) for (const dz of [-0.45, 0.45]) posts.push(mat(x, 1.25, zr + dz));
      k.block(SX + 1.8, SX + W - 1.8, s > 0 ? zr - 0.6 : zr - 0.7, s > 0 ? zr + 0.7 : zr + 0.6);
      for (const y of [0.07, 1.07]) for (let x = SX + 2.4; x <= SX + W - 2.4; x += 0.6) bucket(x, y, zr + (y > 0.5 ? 0.1 : -0.1), 5);
    }
    k.instances(new T.BoxGeometry(0.05, 2.4, 0.05), steel, posts);
    for (const [x, z] of [[-9.6, 12], [-9.6, 12.7], [-9.6, 13.4], [-9.6, 42], [-9.6, 42.7], [9.4, -6], [9.4, -6.7], [9.4, -7.4], [9.4, 5.2], [9.4, 5.9], [9.4, -21], [9.4, -21.7], [-9.6, -28], [-9.6, -28.7]]) bucket(x, 0.28, z, 6);
    for (let i = 0; i < 6; i++) bucket(SX - 0.55, 0.0, 3.7 + i * 0.6, 6);
    k.keepOut.push({ x: SX - 0.55, z: 5.2, r: 1.2 });
    for (const x of [-9.6, 9.4]) for (const z of [12.7, 42.4, -6.7, 5.5, -21.4, -28.4]) k.keepOut.push({ x, z, r: 0.7 });
    k.instances(new T.CylinderGeometry(0.16, 0.13, 0.42, 10), bucketM, buckets);
    k.instances(new T.CylinderGeometry(0.006, 0.006, 0.55, 4), stemM, stems);
    const tulipG = new T.LatheGeometry([new T.Vector2(0.006, 0), new T.Vector2(0.045, 0.02), new T.Vector2(0.064, 0.09), new T.Vector2(0.04, 0.15), new T.Vector2(0.006, 0.17)], 6);
    const tulipMesh = k.instances(tulipG, headM, tulips), roseMesh = k.instances(new T.IcosahedronGeometry(0.055, 0), headM, roses);
    const cc = new T.Color();
    tcols.forEach((c, i) => tulipMesh.setColorAt(i, cc.set(c))); rcols.forEach((c, i) => roseMesh.setColorAt(i, cc.set(c)));
    // the fins: white panels floating over the aisle crossings, hung on rods, a work on each face
    const rods: T.Matrix4[] = [];
    const finsX = [SX + 6, SX + 11, SX + 16, SX + 21, SX + 26];
    for (const x of finsX) { k.box(0.12, 2.6, 4.4, x, 4.2, 0, fin); for (const dz of [-1.8, 1.8]) rods.push(mat(x, (H + 5.5) / 2, dz, 0, 1, H - 5.5, 1)); }
    k.instances(new T.BoxGeometry(0.03, 1, 0.03), steel, rods);
    // cold air on the floor: a drifting sheet of soft pools
    const fogM = new T.MeshBasicMaterial({ map: X.pool(), color: 0xa8cfe8, transparent: true, opacity: 0.22, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
    const fogN = 16, fogG = new T.PlaneGeometry(7, 5);
    const fogPos = Array.from({ length: fogN }, (_, i) => ({ x: SX + 3 + (i % 8) * 3.4, z: -5 + Math.floor(i / 8) * 8 + (i % 3) * 1.2, ph: i * 0.9 }));
    const fog = k.instances(fogG, fogM, fogPos.map((p) => mat(p.x, 0.3, p.z, 0, 1, 1, 1, -PI / 2)));
    if (!ctx.reduced) { const mm = new T.Matrix4(); k.ticks.push((t) => { fogPos.forEach((p, i) => { mm.compose(v(p.x + Math.sin(t * 0.18 + p.ph) * 1.6, 0.28 + Math.sin(t * 0.5 + p.ph) * 0.08, p.z + Math.cos(t * 0.13 + p.ph) * 1.0), new T.Quaternion().setFromEuler(new T.Euler(-PI / 2, 0, t * 0.05 + p.ph)), v(1 + 0.2 * Math.sin(t * 0.3 + p.ph), 1, 1)); fog.setMatrixAt(i, mm); }); fog.instanceMatrix.needsUpdate = true; }); }
    // the hand truck rolling the aisle, the two workers, the buyers on the street
    const truck = new T.Group();
    const tf = new T.Mesh(new T.BoxGeometry(0.55, 1.25, 0.04), steel); tf.position.set(0, 0.75, -0.2); tf.rotation.x = -0.35; truck.add(tf);
    const tb = new T.Mesh(new T.BoxGeometry(0.55, 0.03, 0.5), steel); tb.position.set(0, 0.12, 0.05); truck.add(tb);
    for (const dx of [-0.3, 0.3]) { const w = new T.Mesh(new T.CylinderGeometry(0.14, 0.14, 0.05, 10), rubber); w.rotation.z = PI / 2; w.position.set(dx, 0.14, -0.15); truck.add(w); }
    for (let i = 0; i < 3; i++) { const b = new T.Mesh(new T.CylinderGeometry(0.16, 0.13, 0.42, 10), bucketM); b.position.set(-0.17 + (i % 2) * 0.34, 0.35 + Math.floor(i / 2) * 0.45, 0.1); truck.add(b); const f = new T.Mesh(new T.ConeGeometry(0.2, 0.36, 8), k.flat([0xe0222a, 0xf4d2dc, 0xf2b52a][i], 0, 0.8)); f.position.set(b.position.x, b.position.y + 0.5, 0.1); truck.add(f); }
    k.add(truck);
    k.rider(truck, k.spline([v(SX + 4, 0, -3.6), v(SX + 27, 0, -3.6), v(SX + 28.5, 0, 0), v(SX + 27, 0, 3.6), v(SX + 4, 0, 3.6), v(SX + 3, 0, 0)], true), 0.75);
    k.crowd([v(SX + 3, 0, 3.4), v(SX + 14, 0, 3.6), v(SX + 26, 0, 3.4)], 2, { seed: 453, speed: 0.25, spread: 0.4, animate: !ctx.reduced, colors: [0x24262c, 0x1f5a3a] });
    k.crowd([v(-10.5, 0, 55), v(-10.5, 0, -55)], 6, { seed: 454, speed: 0.75, spread: 1.4, animate: !ctx.reduced });
    k.crowd([v(10.5, 0, 55), v(10.5, 0, 17)], 3, { seed: 455, speed: 0.7, spread: 1.0, animate: !ctx.reduced });
    // the block's own history: an old enamel blade across the street, and one window up there still playing
    const gutt = twoFaced(k, X.signText('GUTTMAN & RAYNOR  ·  EST. 1894', 1024, 256, '#1f4a30', '#efe6cc', 92, { border: true }), 3.6, 0.9, -11.1, 5.7, 4, 0);
    k.box(3.9, 0.05, 0.05, -11.05, 6.2, 4, dark);
    const tpT = canvasTex(256, 384, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 384); gr.addColorStop(0, '#ffd88a'); gr.addColorStop(1, '#d08a3a'); g.fillStyle = gr; g.fillRect(0, 0, 256, 384);
      g.fillStyle = '#1a1210'; g.fillRect(28, 236, 150, 130); g.fillRect(18, 222, 170, 18);
      g.fillStyle = '#f4ead0'; g.fillRect(62, 180, 62, 40); g.strokeStyle = '#5a4030'; g.lineWidth = 2; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(66, 186 + i * 7); g.lineTo(120, 186 + i * 7); g.stroke(); }
      g.fillStyle = '#b8862a'; g.font = '700 30px Georgia, serif'; g.textAlign = 'center'; g.fillText('SHEET MUSIC', 128, 70);
      g.strokeStyle = '#2a1a10'; g.lineWidth = 10; g.strokeRect(5, 5, 246, 374); g.fillStyle = '#2a1a10'; g.fillRect(0, 150, 256, 8);
    });
    const tpMat = new T.MeshBasicMaterial({ map: tpT });
    const tinpan = k.mesh(new T.PlaneGeometry(1.15, 1.72), tpMat, -12.88, 8.6, -4, true); tinpan.rotation.y = PI / 2;
    const player = k.add(merged([[new T.BoxGeometry(0.02, 0.5, 0.26), dark, 0, 0, 0], [new T.SphereGeometry(0.11, 10, 8), dark, 0, 0.36, 0]]));
    player.position.set(-12.86, 8.3, -3.72);
    const tpL = k.point(-11.8, 8.6, -4, 0xffc070, 8, 7);
    if (!ctx.reduced) k.ticks.push((t) => { const f = 0.84 + 0.16 * Math.sin(t * 3.1) * Math.sin(t * 7.7); tpMat.color.setScalar(f); tpL.intensity = 8 * f; player.position.y = 8.3 + Math.abs(Math.sin(t * 4.2)) * 0.05; player.rotation.x = Math.sin(t * 2.1) * 0.08; });
    // down the street, the Empire State Building over the rooftops, its crown lights turning
    const EX = -30, EZ = -230, esbM = k.pbr('fcEsb', X.windows(456, 0.3, 0x6a7078, true), 0.09, { emissive: 0xffffff, emissiveIntensity: 0.7, roughness: 0.6, stretch: 0.42 });
    k.box(50, 24, 40, EX, 12, EZ, esbM); k.box(34, 100, 24, EX, 74, EZ, esbM); k.box(26, 10, 18, EX, 129, EZ, esbM); k.box(20, 8, 14, EX, 138, EZ, esbM);
    const crowns = [0, 1, 2].map((i) => { const m = new T.MeshBasicMaterial({ color: 0xffffff }); const w = [14, 10, 6][i]; k.mesh(new T.BoxGeometry(w, 4, w * 0.72), m, EX, 144 + i * 4.2, EZ, true); return m; });
    k.cyl(1.2, 14, EX, 161, EZ, k.flat(0xcfd6dc, 0.6, 0.3), 3, 12); k.cyl(0.25, 18, EX, 177, EZ, steel, 0.4, 6);
    const palettes = [[0xffffff, 0xffffff, 0xffffff], [0xe0302a, 0xffffff, 0x2a5ad8], [0x3ad06a, 0x3ad06a, 0xffffff], [0xff7ab8, 0xff7ab8, 0xffffff], [0xffc040, 0xffffff, 0xffc040]];
    const lightESB = (t: number) => { const p = palettes[Math.floor(t / 7) % palettes.length]; crowns.forEach((m, i) => m.color.set(p[i])); };
    lightESB(0);
    if (!ctx.reduced) k.ticks.push((t) => lightESB(t));
    // the corner: the street sign pole at Seventh Avenue
    k.cyl(0.055, 4.3, -9.6, 2.15, -50.5, dark, 0.055, 8);
    const ave = twoFaced(k, X.signText('7 AV', 512, 128, '#1f6a3a', '#f4f4ee', 84, { border: true }), 1.5, 0.36, -8.85, 4.1, -50.5, 0);
    twoFaced(k, X.signText('W 28 ST', 512, 128, '#1f6a3a', '#f4f4ee', 76, { border: true }), 1.6, 0.36, -9.6, 3.66, -49.7, PI / 2);
    // Danish trolleys of potted plants on the sidewalk, and one being pushed from the van to the dock
    const pot = k.flat(0xb8663a, 0, 0.8), leafA = k.flat(0x3d7a3a, 0, 0.9), leafB = k.flat(0x5a8a3a, 0, 0.85);
    const trolley = (): Part[] => { const p: Part[] = [[new T.BoxGeometry(0.56, 0.05, 1.35), steel, 0, 0.18, 0]]; for (const dx of [-0.26, 0.26]) for (const dz of [-0.64, 0.64]) p.push([new T.BoxGeometry(0.03, 1.9, 0.03), steel, dx, 1.1, dz]); [0.6, 1.0, 1.4, 1.8].forEach((y, r) => { p.push([new T.BoxGeometry(0.56, 0.02, 1.35), steel, 0, y, 0]); for (let i = 0; i < 4; i++) { const dz = -0.48 + i * 0.32; p.push([new T.CylinderGeometry(0.1, 0.08, 0.16, 8), pot, 0, y + 0.09, dz], [new T.IcosahedronGeometry(0.15, 0), (i + r) % 2 ? leafA : leafB, 0, y + 0.3, dz]); } }); for (const dx of [-0.22, 0.22]) for (const dz of [-0.55, 0.55]) p.push([new T.CylinderGeometry(0.05, 0.05, 0.04, 8), rubber, dx, 0.06, dz, 0, 0, PI / 2]); return p; };
    for (const z of [-3.6, -10.6]) { placeParts(k, trolley(), 10.9, 0, z); k.keepOut.push({ x: 10.9, z, r: 0.8 }); }
    const hauler = k.add(merged([...trolley(), [new T.CapsuleGeometry(0.2, 0.8, 3, 8), k.flat(0x1f5a3a, 0, 0.8), 0, 1.0, -1.05], [new T.SphereGeometry(0.12, 10, 8), k.flat(0xc8a284, 0, 0.7), 0, 1.62, -1.05]]));
    const haul = k.spline([v(5.2, 0, 14.4), v(8.6, 0, 12.4), v(11.8, 0, 11.7)]);
    const haulAt = (t: number) => { const c = (t * 0.06) % 2, u = c < 1 ? c : 2 - c, s = u * u * (3 - 2 * u), d = c < 1 ? 1 : -1; haul.getPointAt(s, hauler.position); const tg = haul.getTangentAt(s); hauler.rotation.y = Math.atan2(tg.x * d, tg.z * d); };
    haulAt(7);
    if (!ctx.reduced) k.ticks.push((t) => haulAt(t));
    // the history of the block
    k.egg(trade, { id: 'bradshaw', title: 'The first wholesale houses', year: '1891', text: 'Wholesale cut flower companies began moving to 28th Street in the late 1870s. George E. Bradshaw and John R. Hartman opened one of the very first wholesale florist houses in 1891, at 53 West 28th Street.', clue: 'The trade announces itself in cream letters under the awning.', source: { name: "New York's Historic Floral District", url: 'https://www.flowermuseum.org/our-history' } });
    k.egg(gutt, { id: 'guttman', title: 'Guttman and Raynor', year: '1894', text: 'Guttman and Raynor, wholesale florists, set up at 101 West 28th Street in 1894. Soon the district counted over 200 wholesalers and suppliers, spread from 23rd Street to 34th Street.', clue: 'Across the street, an old enamel blade still takes orders.', source: { name: "New York's Historic Floral District", url: 'https://www.flowermuseum.org/our-history' } });
    k.egg(tinpan, { id: 'tinpan', title: 'Tin Pan Alley', year: '1893 to 1910', text: 'From 1893 to 1910 the rowhouses at 47 to 55 West 28th Street were home to sheet music publishers, and the din of their pianos gave the block its nickname. The Landmarks Preservation Commission designated all five on December 10, 2019.', clue: 'One lit window upstairs is louder than the rest.', source: { name: 'CityLand', url: 'https://www.citylandnyc.org/landmarks-approves-tin-pan-alley-designation/' } });
    k.egg(v(EX, 150, EZ), { id: 'empire', title: 'The Empire State Building', year: '1931', text: 'Six blocks north stands the Empire State Building, 102 stories, opened on May 1, 1931 after one year and 45 days of construction.', clue: 'Look down the street past the awnings for a crown that keeps changing colour.', source: { name: 'Empire State Building', url: 'https://www.esbnyc.com/about/history' } }, { r: 14 });
    k.egg(ave, { id: 'penn', title: 'The station that made the law', year: '1963', room: 'penn', text: 'A few blocks up Seventh Avenue stood Pennsylvania Station, opened in 1910. Its demolition began on October 28, 1963, and on April 15, 1965 Mayor Robert Wagner signed the Landmarks Law that created the Landmarks Preservation Commission.', clue: 'The street sign on the corner points the way to a famous loss.', source: { name: 'Museum of the City of New York', url: 'https://blog.mcny.org/2012/05/08/penn-station-and-the-rise-of-historic-preservation/' } });
    // the hang: both faces of every fin, the long walls above the racks, the order board at the back
    const mounts: Mount[] = [];
    finsX.forEach((x, i) => { mounts.push(M(x - 0.07, 4.2, 0, x - 5, 0, 4.2, 2.4, 'white', true)); if (i < finsX.length - 1) mounts.push(M(x + 0.07, 4.2, 0, x + 5, 0, 4.2, 2.4, 'white', true)); });
    for (const s of [-1, 1]) for (const x of [SX + 4, SX + 9.5, SX + 15, SX + 20.5, SX + 26]) mounts.push(M(x, 4.0, s * (D / 2 - 0.2), x, s * 3.5, 3.6, 2.2, 'steel', true));
    for (const z of [-5, 5]) mounts.push(M(SX + W - 0.2, 3.7, z, SX + W - 5, z, 3.6, 2.2, 'steel', true));
    k.censusWall({ x: SX + W - 0.2, y: 4.0, z: 0, rotY: -PI / 2, cols: 10, rows: 3, tile: 0.5, gap: 0.05, start: ctx.wallStart(6600, 30), pieces: ctx.all, backing: dark });
    k.sign('ORDERS  ·  TULIPS 120  ·  ROSES 300  ·  PEONIES SOLD OUT', 5.2, 0.4, SX + W - 0.2, 5.5, 0, 'transparent', '#dff4ff', 64, -PI / 2);
    return { mounts, spawn: v(1.5, 2.8, 0), look: v(SX + W, 3.2, 0), eye: 2.8, bounds: [-12.4, SX + W - 0.5, -50, 50], style: 'white' };
  },
};

/* ---------------- 115 THE HANDBALL COURTS ---------------- */
export const handball: RoomDef = {
  id: 'handball',
  name: 'The fourth wall belongs to us',
  area: 'ALLEN STREET, LOWER EAST SIDE',
  mood: 'Golden hour, last game',
  color: '#96a7bd',
  description: 'Three one wall handball courts on the Lower East Side at golden hour, the walls scaled up to monuments: low sun raking the concrete, a blue ball between wall and hand, the crowd along the chain link, the tenements and their fire escapes behind, the works as a civic triptych on the walls and portraits along the fence.',
  signatures: 'Three sixteen foot walls with the court lines painted on, the short line and sidelines on asphalt, the chain link fence with its gate, the park benches and the trees, the open hydrant on the sidewalk, tenements with fire escapes behind the walls, a pickup game in the middle court.',
  build(k, ctx) {
    k.sky({ top: 0x5f86c0, horizon: 0xf4b978, ground: 0x4a4238, fog: 0.0026, sun: { az: 1.1, el: 0.12, color: 0xffb073, size: 22 }, haze: 0.6, env: 0.9 });
    k.hemi(0xdfe6ff, 0x5a4a3a, 0.8);
    k.sun(0xffb073, 2.7, 70, 15, -46, true, 90);
    const court = k.pbr('hbCourt', X.asphalt(0x2c3034), 0.15, { roughness: 0.9 }),
      wallC = k.pbr('hbWall', X.concrete(0xd6d0c0, 461), 0.22, { roughness: 0.85 }),
      wallB = k.pbr('hbWallB', X.concrete(0xb8b0a0, 462), 0.22, { roughness: 0.9 }),
      band = k.flat(0x2a4aa8, 0, 0.8),
      white = k.flat(0xf4f0e8, 0, 0.6),
      red = k.flat(0xc83a2a, 0, 0.8),
      fence = k.flat(0x8c98a4, 0.9, 0.3, { transparent: true, opacity: 0.5 }),
      steel = k.flat(0x8c98a4, 0.9, 0.3),
      dark = k.flat(0x1f242a, 0.7, 0.45),
      hex = k.pbr('hexPavers', X.pavers(0x9a968c, 18), 0.35),
      lawn = k.pbr('hbLawn', X.grass(0x4f7a3a, 463), 0.15),
      wood = k.pbr('hbSlat', X.planks(0x6a4a30, 3, 464), 1.2, { roughness: 0.6 }),
      green = k.flat(0x1f5a3a, 0, 0.7),
      water = k.flat(0xcfe8ff, 0.2, 0.2, { transparent: true, opacity: 0.7 }),
      ballM = k.flat(0x2a5ad8, 0, 0.5);
    // the block: Allen Street with its tenements across, the park strip, the tenement row behind the walls
    street(k, { w: 16, len: 150, z: 0, x: 21 });
    blockFront(k, { x: 34, z0: 64, count: 16, face: -1, seed: 465, h: [16, 24] });
    blockFront(k, { x: -26, z0: 32, count: 9, face: 1, seed: 466, h: [16, 22] });
    k.box(60, 0.3, 150, -12, -0.16, 0, hex);
    k.box(10, 0.34, 46, 3, -0.15, 0, hex);
    for (const s of [-1, 1]) k.box(10, 0.36, 24, 3, -0.14, s * 35, lawn);
    for (const z of [26, -26]) for (const s of [-1, 1]) k.lamp(s > 0 ? 12.5 : 29.5, z, 6.5, dark, 0xffd9a8, 20);
    k.prop('mailbox', 12.7, 0, 30, { height: 1.5, rotY: PI / 2, keepOut: 0.6 });
    for (const [x, z, sd] of [[6, -13, 1], [6, 13, 2], [6, -30, 3], [6, 30, 4]]) { k.tree(x, 0, z, { h: 5.5, r: 2.8, seed: sd, leaf: 0x4a7a3a }); k.keepOut.push({ x, z, r: 0.7 }); }
    for (const z of [-8, 8]) k.bench(4.6, z, PI / 2, wood, dark);
    k.prop('quiet_bench', 5.5, 0, -20, { height: 0.9, rotY: PI / 2, keepOut: 1.2 });
    k.prop('storm_drain', 12.2, 0.02, -2, { height: 0.08 });
    k.prop('utility_pole', 30.5, 0, -18, { height: 9, keepOut: 0.5 });
    // the open hydrant: a jet into the street
    k.prop('hydrant', 9.6, 0, -14, { height: 1.1, keepOut: 0.5 });
    // with a spray cap on it: a legal fan of water instead of a gusher
    const dropsN = 110, drops = k.instances(new T.SphereGeometry(0.06, 5, 4), water, Array.from({ length: dropsN }, () => new T.Matrix4()));
    const dq = new T.Quaternion(), d1 = v(1, 1, 1);
    const dropAt = (i: number, t: number, mm: T.Matrix4) => { const u = (t * 1.1 + i * 0.137) % 1, a = (((i * 0.618) % 1) - 0.5) * 1.6, r = 0.2 + u * 3.3; mm.compose(v(9.85 + Math.cos(a) * r, 0.72 + u * 1.7 - u * u * 2.3, -14 + Math.sin(a) * r), dq, d1); };
    { const mm = new T.Matrix4(); for (let i = 0; i < dropsN; i++) { dropAt(i, 0, mm); drops.setMatrixAt(i, mm); } }
    if (!ctx.reduced) { const mm = new T.Matrix4(); k.ticks.push((t) => { for (let i = 0; i < dropsN; i++) { dropAt(i, t, mm); drops.setMatrixAt(i, mm); } drops.instanceMatrix.needsUpdate = true; }); }
    k.box(3.6, 0.02, 4.4, 11.9, 0.02, -14, k.flat(0x1a2430, 0.3, 0.2, { transparent: true, opacity: 0.6 }));
    // the courts: asphalt, three monumental walls, the lines, the gaps closed with fence
    const WX = -16, WW = 12, WH = 9.6, GAP = 1.5;
    k.box(15.2, 0.32, 42, -9.4, -0.14, 0, court);
    const walls = [-(WW + GAP), 0, WW + GAP];
    let shortLine: T.Mesh | null = null;
    walls.forEach((zc, i) => {
      k.box(0.6, WH, WW, WX, WH / 2, zc, i === 1 ? wallC : wallB);
      k.box(0.64, 1.1, WW, WX, 0.55, zc, i === 1 ? band : red);
      k.box(0.66, 0.08, WW, WX, WH - 0.1, zc, white);
      const sl = k.box(0.12, 0.02, WW, WX + 9.7, 0.035, zc, red); if (i === 1) shortLine = sl;
      for (const s of [-1, 1]) k.box(13.6, 0.02, 0.06, WX + 7.1, 0.035, zc + s * WW / 2, white);
      for (let x = WX + 0.5; x < -2; x += 1.7) k.box(0.05, 0.02, 0.05, x, 0.035, zc, white);
    });
    k.box(0.5, WH, 42, WX - 0.6, WH / 2, 0, wallB);
    k.box(1.4, 0.4, 42, WX - 0.2, WH + 0.2, 0, dark);
    for (const zc of [-(WW / 2 + GAP / 2), WW / 2 + GAP / 2]) k.box(0.03, WH, GAP, WX + 0.3, WH / 2, zc, fence);
    k.block(WX - 1.2, WX + 0.35, -21.2, 21.2);
    k.sign('"WALL"', 1.6, 0.4, WX + 0.34, WH - 0.55, -4.6, 'transparent', '#0d0d0d', 120, PI / 2);
    // the chain link: front with the gate, both sides, posts and top rail
    const FX = -2, FZ = 21, FH = 4.2;
    for (const s of [-1, 1]) { const z0 = s > 0 ? 1.8 : -FZ, z1 = s > 0 ? FZ : -1.8; k.box(0.03, FH, z1 - z0, FX, FH / 2, (z0 + z1) / 2, fence); k.block(FX - 0.25, FX + 0.25, z0, z1); }
    for (const s of [-1, 1]) { k.box(FX - WX, FH, 0.03, (FX + WX) / 2, FH / 2, s * FZ, fence); k.block(WX, FX, s * FZ - 0.25, s * FZ + 0.25); k.box(FX - WX, 0.06, 0.06, (FX + WX) / 2, FH, s * FZ, steel); for (let x = WX; x <= FX; x += 3) k.box(0.08, FH + 0.2, 0.08, x, FH / 2 + 0.1, s * FZ, steel); }
    for (let z = -FZ; z <= FZ; z += 3) if (Math.abs(z) > 2) k.box(0.08, FH + 0.2, 0.08, FX, FH / 2 + 0.1, z, steel);
    for (const s of [-1, 1]) k.box(0.06, 0.06, FZ - 1.8, FX, FH, s * (FZ + 1.8) / 2, steel);
    for (const z of [-1.9, 1.9]) k.box(0.12, FH + 0.3, 0.12, FX, FH / 2 + 0.15, z, steel);
    k.box(4.2, 0.12, 0.12, FX, FH + 0.2, 0, steel);
    const parksSign = k.sign('NYC PARKS  ·  HANDBALL COURTS  ·  DUSK TO DAWN  ·  NO BIKES ON THE COURT', 3.4, 0.5, FX + 0.1, FH + 0.6, 0, '#1f5a3a', '#f4f0e8', 46, PI / 2, { border: true, double: true });
    k.box(0.06, 0.6, 3.6, FX, FH + 0.6, 0, green);
    for (const s of [-1, 1]) { k.beam(v(FX - 0.6, 0, s * (FZ - 0.6)), v(FX - 0.6, 11, s * (FZ - 0.6)), 0.14, steel, 8); k.box(0.5, 0.4, 0.9, FX - 0.9, 10.8, s * (FZ - 0.6), dark); k.box(0.3, 0.2, 0.7, FX - 1.15, 10.7, s * (FZ - 0.6), k.glow(0xfff4e0)); k.spot(FX - 0.9, 10.8, s * (FZ - 0.6), WX + 6, 0, s * 8, 0xfff0d8, 260, 0.75, 0.6, 40); k.keepOut.push({ x: FX - 0.6, z: s * (FZ - 0.6), r: 0.5 }); }
    // the game: a ball between wall and hand, two players, the crowd at the fence, pigeons
    const ball = k.mesh(new T.SphereGeometry(0.12, 10, 8), ballM, -8, 1, 0, true);
    k.rider(ball, k.spline([v(-7, 1.3, 11.9), v(-11, 3.6, 12.9), v(-15.3, 3.4, 13.9), v(-12, 2.6, 15.1), v(-8.5, 0.7, 14.7)], true), 9);
    k.crowd([v(-10, 0, 10), v(-13, 0, 15.7), v(-9.5, 0, 17.1)], 2, { seed: 467, speed: 2.0, spread: 1.0, animate: !ctx.reduced, colors: [0xf4f0e8, 0x2a5ad8] });
    k.crowd([v(-14, 0, 19.4), v(-4.5, 0, 19.6)], 8, { seed: 468, speed: 0.12, spread: 1.0, animate: !ctx.reduced });
    k.crowd([v(-14, 0, -19.4), v(-4.5, 0, -19.6)], 7, { seed: 469, speed: 0.12, spread: 1.0, animate: !ctx.reduced });
    k.crowd([v(10.5, 0, 60), v(10.5, 0, -60)], 9, { seed: 470, speed: 0.8, spread: 1.4, animate: !ctx.reduced });
    k.crowd([v(31.5, 0, 60), v(31.5, 0, -60)], 6, { seed: 471, speed: 0.8, spread: 1.4, animate: !ctx.reduced });
    const pigeons: T.Mesh[] = [];
    for (let i = 0; i < 7; i++) { const b = k.mesh(new T.ConeGeometry(0.09, 0.4, 4), dark, 0, 8, 0, true); b.rotation.x = PI / 2; pigeons.push(b); }
    if (!ctx.reduced) k.ticks.push((t) => pigeons.forEach((b, i) => { const a = t * 0.45 + i * 0.9, r = 9 + 3 * Math.sin(t * 0.2 + i); b.position.set(2 + Math.cos(a) * r, 7 + 2 * Math.sin(t * 0.8 + i), Math.sin(a) * r * 1.6); b.rotation.y = -a; }));
    // Allen Street's malls: the planted median NYC Parks keeps, trees, benches, the bike path down the middle
    k.box(5.4, 0.3, 150, 21, 0, 0, k.flat(0xa8a49a, 0, 0.85)); k.box(5.0, 0.3, 150, 21, 0.02, 0, hex); k.box(1.4, 0.01, 150, 22.5, 0.18, 0, k.flat(0x3a7a4a, 0, 0.8));
    for (let i = 0; i < 12; i++) if (i !== 9) k.tree(19.7, 0.17, -66 + i * 12, { h: 6, r: 2.4, seed: 490 + i, leaf: 0x4a7a3a });
    for (const z of [-48, -24, 24, 48]) k.bench(19.6, z, PI / 2, wood, dark);
    for (const dz of [-1.1, 1.1]) k.box(0.08, 2.2, 0.08, 18.9, 1.2, dz, dark);
    const malls = k.sign('ALLEN STREET MALLS', 2.4, 0.52, 18.84, 1.9, 0, '#1f5a3a', '#f4f0e8', 76, -PI / 2, { border: true });
    // up the street on the Houston corner, a red sign for lunch
    const katzSign = twoFaced(k, X.signText('KATZ’S  ·  DELICATESSEN', 1024, 256, '#a8181c', '#f6e9c8', 104, { border: true }), 5.6, 1.4, 30.6, 14, 62, 0);
    k.box(6.2, 0.08, 0.08, 30.9, 14.8, 62, dark); k.box(6.2, 0.08, 0.08, 30.9, 13.2, 62, dark); k.point(30.6, 13.2, 60.6, 0xff6a5a, 22, 14);
    // the tenement row behind the walls: one five storey walk up brought forward, with its cornice and fire escape
    const tenB = k.pbr('hbTen', X.brick(0x7e4a38, 472), 0.28), tenX = -25.7, tenH = 18.5, tGlass = k.glass(0x9fc4d8, 0.35, 0.08), tWarm = k.glow(0xffd8a0);
    k.box(0.6, tenH, 7.8, tenX, tenH / 2, 0, tenB);
    k.box(1.1, 0.9, 8.3, tenX + 0.35, tenH + 0.1, 0, k.flat(0x5e544a, 0.4, 0.6));
    k.box(0.1, 3.4, 7.6, tenX + 0.36, 1.9, 0, k.flat(0x2a2420, 0.3, 0.6));
    for (let f = 0; f < 5; f++) {
      const y = 4.4 + f * 2.9;
      [-2.6, 0, 2.6].forEach((dz, j) => { k.box(0.06, 1.7, 1.1, tenX + 0.32, y, dz, (f * 3 + j) % 4 === 1 ? tWarm : tGlass); k.box(0.14, 0.12, 1.3, tenX + 0.37, y - 0.92, dz, white); k.box(0.12, 0.2, 1.3, tenX + 0.36, y + 0.95, dz, white); });
      if (f > 0) { k.box(1.2, 0.06, 5.4, tenX + 0.95, y - 1.05, 0, dark); k.box(0.04, 0.9, 5.4, tenX + 1.53, y - 0.6, 0, dark); if (f < 4) k.beam(v(tenX + 1.15, y - 1.0, -2.3), v(tenX + 1.15, y + 1.85, 2.0), 0.03, dark, 4); }
    }
    // the flag over the park, waving
    const FPX = 7.6, FPZ = 2.6;
    k.cyl(0.06, 9.2, FPX, 4.6, FPZ, steel, 0.04, 8); k.sphere(0.13, FPX, 9.28, FPZ, k.flat(0xd0a852, 0.8, 0.3), 8); k.keepOut.push({ x: FPX, z: FPZ, r: 0.4 });
    const flagT = canvasTex(256, 136, (g) => { for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? '#f4f0e8' : '#b8262a'; g.fillRect(0, (i * 136) / 13, 256, 136 / 13 + 1); } g.fillStyle = '#2a3a78'; g.fillRect(0, 0, 104, 73); g.fillStyle = '#f4f0e8'; for (let r = 0; r < 9; r++) for (let c = 0; c < (r % 2 ? 5 : 6); c++) { g.beginPath(); g.arc(9 + c * 17 + (r % 2 ? 8.5 : 0), 5 + r * 7.8, 2.2, 0, PI * 2); g.fill(); } });
    const flagG = new T.PlaneGeometry(2.4, 1.28, 16, 6), fpos = flagG.attributes.position as T.BufferAttribute, fx0 = Float32Array.from(fpos.array as ArrayLike<number>);
    const flag = k.mesh(flagG, new T.MeshStandardMaterial({ map: flagT, side: T.DoubleSide, roughness: 0.8 }), FPX, 8.3, FPZ - 1.24, true);
    flag.rotation.y = PI / 2;
    const wave = (t: number) => { for (let i = 0; i < fpos.count; i++) { const x = fx0[i * 3] + 1.2; fpos.setZ(i, Math.sin(x * 2.6 - t * 5.5) * 0.13 * (x / 2.4) + Math.sin(fx0[i * 3 + 1] * 3 + t * 3) * 0.03 * (x / 2.4)); } fpos.needsUpdate = true; flagG.computeVertexNormals(); };
    wave(0);
    if (!ctx.reduced) k.ticks.push((t) => wave(t));
    // Allen Street traffic both ways around the malls, and a bike on the path down the middle
    const carGlass = k.glass(0x9fc4d8, 0.35, 0.08), carDark = k.flat(0x1c1f24, 0.4, 0.6), tire = k.flat(0x1a1a1c, 0.1, 0.9);
    const loop = k.spline([v(16.2, 0, 78), v(16.2, 0, -78), v(21, 0, -86), v(25.8, 0, -78), v(25.8, 0, 78), v(21, 0, 86)], true);
    const cars = [k.add(merged([...cabParts(k.flat(0xf2c230, 0.2, 0.45), carGlass, carDark, tire), [new T.BoxGeometry(0.7, 0.16, 0.22), k.glow(0xfff0c0), 0, 1.63, 0.2]])), k.add(merged(cabParts(k.flat(0x2a3a5a, 0.5, 0.35), carGlass, carDark, tire)))];
    cars.forEach((c, i) => { if (!ctx.reduced) k.rider(c, loop, 7 + i * 1.5, i * 160); else c.position.set(i ? 25.8 : 16.2, 0, i ? 30 : -24); });
    const bike = k.add(merged([[new T.TorusGeometry(0.33, 0.035, 6, 18), carDark, 0, 0.36, 0.52, 0, PI / 2, 0], [new T.TorusGeometry(0.33, 0.035, 6, 18), carDark, 0, 0.36, -0.52, 0, PI / 2, 0], [new T.BoxGeometry(0.05, 0.05, 1.0), k.flat(0x2a8ad8, 0.4, 0.4), 0, 0.62, 0], [new T.BoxGeometry(0.05, 0.4, 0.05), carDark, 0, 0.85, -0.25], [new T.CapsuleGeometry(0.19, 0.55, 3, 8), k.flat(0xc83a2a, 0, 0.8), 0, 1.35, -0.1, 0.35, 0, 0], [new T.SphereGeometry(0.12, 10, 8), k.flat(0x8d5a3b, 0, 0.7), 0, 1.86, 0.1]]));
    if (!ctx.reduced) k.rider(bike, k.spline([v(22.9, 0.17, 72), v(22.9, 0.17, -72), v(22.5, 0.17, -74), v(22.1, 0.17, -72), v(22.1, 0.17, 72), v(22.5, 0.17, 74)], true), 4.2);
    else bike.position.set(22.9, 0.17, 10);
    // the neighbourhood the game grew up in
    k.egg(shortLine ?? v(WX + 9.7, 0.1, 0), { id: 'shortline', title: 'The short line', text: 'A one wall court is a wall twenty feet wide and sixteen feet high, with the short line drawn sixteen feet out and the service zone behind it. Games are played to twenty one points, best two of three.', clue: 'The most important line on the court is not on the wall.', source: { name: 'NYC Parks', url: 'https://www.nycgovparks.org/parks/barrier-playground/history' } });
    k.egg(parksSign, { id: 'parks', title: 'Handball comes to the parks', year: '1948', text: 'Irish immigrants brought hard handball to New York in the late 19th century. NYC Parks began sponsoring citywide tournaments in 1948, the first at Heckscher Playground in Central Park, and in 2000 set out to renovate 1,500 of its 2,052 courts.', clue: 'Read the green sign over the gate before you play.', source: { name: 'NYC Parks', url: 'https://www.nycgovparks.org/parks/barrier-playground/history' } });
    k.egg(v(9.6, 0.6, -14), { id: 'spraycap', title: 'The spray cap', text: 'A hydrant fitted with a City approved spray cap releases only 20 to 25 gallons a minute; an illegally opened one pours out more than 1,000. Any adult 18 or over can request a spray cap free at the local firehouse.', clue: 'Somebody on the sidewalk made summer legal.', source: { name: 'NYC Department of Environmental Protection', url: 'https://www.nyc.gov/site/dep/news/26-018/dep-encourages-safe-hydrant-use-safeguard-water-pressure-during-historic-extreme-heatwave' } }, { r: 0.9 });
    k.egg(v(tenX + 0.5, 16.6, 0), { id: 'tenement', title: 'The tenements behind the wall', year: '1863', text: "Walk ups like this one line the blocks around Allen Street. One block over, 97 Orchard Street was built in 1863, and with 103 Orchard the Tenement Museum's two buildings were home to more than 15,000 immigrants from over 20 nations.", clue: 'Look over the top of the middle wall at the building with the heavy cornice.', source: { name: 'National Trust for Historic Preservation', url: 'https://savingplaces.org/places/tenement' } }, { r: 2.6 });
    k.egg(malls, { id: 'malls', title: 'The Allen Street Malls', year: '1929', text: 'The planted median down Allen Street is a park. NYC Parks has maintained the Allen Street Malls since August 1929, in eight sections from East Houston Street to East Broadway. The city named the street for William Henry Allen in 1817.', clue: 'Cross to the trees in the middle of the street.', source: { name: 'NYC Parks', url: 'https://www.nycgovparks.org/parks/allen-mall-one/history' } });
    k.egg(katzSign, { id: 'katz', title: 'Katz’s on the corner', year: '1888', room: 'katz', text: "Two blocks east, at 205 East Houston Street on the corner of Ludlow, Katz's Delicatessen has been feeding the Lower East Side since 1888.", clue: 'Up the street, a red sign promises lunch.', source: { name: "Katz's Delicatessen", url: 'https://katzsdelicatessen.com/' } });
    // the hang: the civic triptych, one monumental work and two flanking portraits per wall, portraits along the fence
    const mounts: Mount[] = [];
    walls.forEach((zc) => { mounts.push(M(WX + 0.34, 5.6, zc, WX + 9, zc, 7.0, 5.2, 'white', false)); for (const s of [-1, 1]) mounts.push(M(WX + 0.34, 3.3, zc + s * 4.8, WX + 6, zc + s * 4.8, 1.8, 2.0, 'white', false)); });
    for (const s of [-1, 1]) for (const x of [-14, -11, -8, -5]) mounts.push(M(x, 3.0, s * (FZ - 0.1), x, s * (FZ - 6), 2.6, 1.8, 'steel', false));
    for (const z of [-16, -11, -6, 6, 11, 16]) mounts.push(M(FX - 0.1, 3.0, z, FX - 6, z, 2.6, 1.8, 'steel', false));
    return { mounts, spawn: v(-3.4, 3, 0), look: v(WX, 5.0, 0), eye: 3, bounds: [WX + 0.6, 12.4, -24, 24], style: 'white' };
  },
};

/* ---------------- 116 THE SALT SHED ---------------- */
export const salt: RoomDef = {
  id: 'saltvault',
  name: 'Winter stored as a mountain',
  area: 'SPRING STREET AND WEST STREET',
  mood: 'The city before snow',
  color: '#c6d4e1',
  description: 'The Spring Street Salt Shed: a faceted concrete crystal on the Hudson beside the sanitation garage in its skin of fins. Inside, five thousand tons of salt as a white mountain under the folded shell, plow blades against the wall, a loader idling, the works on the promenade around the pile.',
  signatures: 'The tilted concrete facets cantilevering over the base, the truck door on Spring Street, the garage next door wrapped in perforated fins, the Hudson and the Jersey shore behind, the salt cone with grains sliding, the yellow plow blades, a salt spreader rolling past on West Street, gulls.',
  build(k, ctx) {
    k.sky({ top: 0x6a9ad8, horizon: 0xe2e6ea, ground: 0x4a5058, fog: 0.0024, sun: { az: 1.3, el: 0.5, color: 0xfff1d8, size: 14 }, env: 0.9 });
    k.hemi(0xeef3ff, 0x4a4e52, 0.85);
    k.sun(0xfff0d4, 2.3, 40, 55, 30, false, 90);
    const conc = k.pbr('ssShell', X.concrete(0xb9b8b2, 471), 0.09, { roughness: 0.82, flatShading: true }),
      concIn = k.pbr('ssShellIn', X.concrete(0x8a8c8e, 471), 0.09, { roughness: 0.9, flatShading: true }),
      base = k.pbr('ssBase', X.concrete(0x8e8e8a, 472), 0.3, { roughness: 0.85 }),
      floorT = k.pbr('ssFloor', X.concrete(0x6a6c6a, 473), 0.3, { roughness: 0.5 }),
      apron = k.pbr('ssApron', X.pavers(0x8a8a86, 474), 0.4),
      saltM = k.pbr('ssSalt', X.plaster(0xf6f4ee, 475), 1.4, { roughness: 1, normal: 1.6 }),
      grain = k.flat(0xf8f7f2, 0, 0.9),
      garage = k.pbr('ssGarage', X.windows(476, 0.2, 0x3a4048, false), 0.12, { emissive: 0xffffff, emissiveIntensity: 0.6, roughness: 0.5, metalness: 0.4, stretch: 0.42 }),
      finM = k.flat(0xc8ccd0, 0.85, 0.35),
      steel = k.flat(0x6a727a, 0.8, 0.45),
      steelL = k.flat(0x9aa2aa, 0.85, 0.35),
      yellow = k.flat(0xf2b230, 0.2, 0.5),
      orange = k.flat(0xf07a20, 0.1, 0.6),
      whiteM = k.flat(0xe8ecee, 0.1, 0.5),
      dark = k.flat(0x1c1f24, 0.4, 0.6),
      rubber = k.flat(0x1a1a1c, 0.1, 0.9),
      glassDark = k.glass(0x9fc4d8, 0.35, 0.08),
      rail = k.flat(0x3a4048, 0.7, 0.45),
      gull = k.flat(0xf0f0ea, 0, 0.8);
    // West Street: the highway, the bikeway and the river on one side, the shed and the garage on the other
    street(k, { w: 22, len: 200, z: 0 });
    for (const dx of [-3.7, 3.7]) k.box(0.1, 0.012, 190, dx, 0.012, 0, k.flat(0xdedbd2, 0, 0.7));
    k.box(6, 0.3, 200, -19, -0.15, 0, k.pbr('ssBike', X.asphalt(0x2a3a3a), 0.11));
    k.rail(-22.2, 0, 200, rail, 1.1, 'z', 2.5);
    k.block(-22.6, -21.8, -100, 100);
    k.water({ y: -1.6, color: 0x2e4a62, w: 300, d: 420, x: -172, z: 0, amp: 1 });
    k.box(4, 2, 200, -24, -1, 0, k.pbr('ssBulk', X.ashlar(0x6a6a66, 477, 2), 0.4));
    k.skyline({ z: -300, count: 22, spacing: 9, scale: 1.9, base: -1.6, seed: 478, lit: 0.25, glow: 0.6, tint: 0x4a5060, rows: 1, x: -90 });
    k.skyline({ z: 300, count: 22, spacing: 9, scale: 2.1, base: -1.6, seed: 479, lit: 0.25, glow: 0.6, tint: 0x4a5060, rows: 1, x: 40 });
    blockFront(k, { x: 16, z0: -24, count: 6, face: -1, seed: 480, h: [12, 20] });
    for (const z of [40, -40]) for (const s of [-1, 1]) k.lamp(s * 13.5, z, 8, steel, 0xffd9a8, 22);
    k.box(46, 0.3, 100, 39, -0.14, 20, apron);
    // the sanitation garage: a long box wrapped in a double skin of fins
    const GZ0 = 25, GZ1 = 65, GH = 26;
    k.box(38, GH, GZ1 - GZ0, 37, GH / 2, (GZ0 + GZ1) / 2, garage);
    k.box(38.6, 0.6, GZ1 - GZ0 + 0.6, 37, GH + 0.3, (GZ0 + GZ1) / 2, dark);
    const fins: T.Matrix4[] = [];
    for (let z = GZ0 + 0.5; z < GZ1; z += 1.0) fins.push(mat(17.3, GH / 2 + 1, z, 0, 1, 1, 1, 0, 0.0));
    for (let x = 18.5; x < 56; x += 1.0) fins.push(mat(x, GH / 2 + 1, GZ0 - 0.7, PI / 2));
    k.instances(new T.BoxGeometry(0.12, GH - 3, 0.7), finM, fins);
    k.block(16.8, 56.5, GZ0 - 1, GZ1);
    const garageSign = k.sign('DSNY  ·  MANHATTAN DISTRICTS 1  2  5  GARAGE', 12, 0.7, 17.2, 5.0, 26, '#1c1f24', '#f0f0ea', 70, -PI / 2, { border: true });
    // the shed: a base of concrete walls with the truck door, and the crystal folded over it
    const BX0 = 17, BX1 = 53, BZ = 17, BH = 6.2;
    k.box(BX1 - BX0, 0.3, 2 * BZ, (BX0 + BX1) / 2, -0.15, 0, floorT);
    for (const [z0, z1] of [[-BZ, -4], [4, BZ]]) { k.box(0.4, BH, z1 - z0, BX0, BH / 2, (z0 + z1) / 2, base); k.block(BX0 - 0.3, BX0 + 0.3, z0, z1); }
    k.box(0.4, BH - 5.2, 8.4, BX0, 5.2 + (BH - 5.2) / 2, 0, base);
    k.box(0.6, 0.3, 8.6, BX0, 5.2, 0, steel);
    for (const z of [-4.1, 4.1]) k.box(0.5, 5.3, 0.2, BX0, 2.65, z, steel);
    for (const s of [-1, 1]) { k.box(BX1 - BX0, BH, 0.4, (BX0 + BX1) / 2, BH / 2, s * BZ, base); k.block(BX0, BX1, s > 0 ? BZ - 0.3 : -BZ - 0.3, s > 0 ? BZ + 0.3 : -BZ + 0.3); }
    k.box(0.4, BH, 2 * BZ, BX1, BH / 2, 0, base); k.block(BX1 - 0.3, BX1 + 0.3, -BZ, BZ);
    const shedSign = k.sign('SPRING STREET SALT SHED  ·  DSNY', 6.4, 0.5, BX0 - 0.22, 5.75, 0, 'transparent', '#f0f0ea', 70, -PI / 2);
    const pts: T.Vector3[] = [];
    for (const s of [-1, 1]) {
      pts.push(v(BX0 - 0.6, BH, s * (BZ + 0.6)), v(BX1 + 0.6, BH, s * (BZ + 0.6)), v(35, BH, s * (BZ + 1.2)));
      pts.push(v(13.5, 13, s * 19.5), v(56.5, 13, s * 19.5), v(35, 14, s * 21), v(24, 13.5, s * 20.2), v(46, 13.5, s * 20.2));
      pts.push(v(19, 19, s * 10), v(51, 19, s * 10), v(35, 20, s * 12));
    }
    pts.push(v(12.5, 14, -3), v(57.5, 13.5, 4), v(24, 24, -4), v(46, 23.5, 3), v(33, 28.5, -1), v(28, 22.5, 7), v(43, 22, -7), v(38, 26.5, 4));
    const hull = new ConvexGeometry(pts);
    const pa = hull.attributes.position, keep: number[] = [];
    for (let i = 0; i < pa.count; i += 3) {
      const a = v(pa.getX(i), pa.getY(i), pa.getZ(i)), b = v(pa.getX(i + 1), pa.getY(i + 1), pa.getZ(i + 1)), c = v(pa.getX(i + 2), pa.getY(i + 2), pa.getZ(i + 2));
      const n = b.clone().sub(a).cross(c.clone().sub(a));
      if (n.y > -0.9 * n.length()) keep.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    }
    const shell = new T.BufferGeometry();
    shell.setAttribute('position', new T.Float32BufferAttribute(keep, 3));
    shell.computeVertexNormals();
    k.mesh(shell, conc, 0, 0, 0);
    // the inside skin is the same hull wound the other way, so it is a true front face for every pass, the occlusion pass included
    const inner = new T.BufferGeometry();
    const flipped: number[] = [];
    for (let i = 0; i < keep.length; i += 9) flipped.push(keep[i], keep[i + 1], keep[i + 2], keep[i + 6], keep[i + 7], keep[i + 8], keep[i + 3], keep[i + 4], keep[i + 5]);
    inner.setAttribute('position', new T.Float32BufferAttribute(flipped, 3));
    inner.computeVertexNormals();
    k.mesh(inner, concIn, 0, 0, 0);
    // the salt: the mountain, the grains that keep sliding, the loader, the plow blades against the wall
    const CX = 36, CZ = -1, CR = 11, CH = 9;
    k.mesh(new T.ConeGeometry(CR, CH, 30, 1), saltM, CX, CH / 2, CZ);
    k.keepOut.push({ x: CX, z: CZ, r: CR + 0.5 });
    const grainsN = 320, grains = k.instances(new T.SphereGeometry(0.09, 5, 4), grain, Array.from({ length: grainsN }, () => new T.Matrix4()));
    const gr = X.mulberry(481), gs = Array.from({ length: grainsN }, () => ({ a: PI + (gr() - 0.5) * 1.6, u: gr(), sp: 0.05 + gr() * 0.08 }));
    const placeGrains = (t: number) => { const mm = new T.Matrix4(); gs.forEach((g, i) => { const u = (g.u + t * g.sp) % 1; mm.compose(v(CX + Math.cos(g.a) * (CR * u + 0.4), CH * (1 - u) + 0.12, CZ + Math.sin(g.a) * (CR * u + 0.4)), new T.Quaternion(), v(1, 1, 1)); grains.setMatrixAt(i, mm); }); grains.instanceMatrix.needsUpdate = true; };
    placeGrains(0);
    if (!ctx.reduced) k.ticks.push((t) => placeGrains(t));
    for (let i = 0; i < 40; i++) { const r = X.mulberry(482 + i); k.sphere(0.5 + r() * 0.9, CX + Math.cos(r() * PI * 2) * (CR + 0.6 + r() * 1.4), 0.1, CZ + Math.sin(r() * PI * 2) * (CR + 0.6 + r() * 1.4), saltM, 7); }
    const LX = 27, LZ = -13;
    // the loader: rolls up to the pile, lifts a bucket of salt, backs off, lowers again; its beacon turning
    const loaderBeacon = new T.MeshBasicMaterial({ color: 0xffa020 });
    const loader = k.add(merged([[new T.BoxGeometry(2.6, 1.6, 4.6), yellow, 0, 1.6, 0], [new T.BoxGeometry(2.2, 1.6, 1.8), glassDark, 0, 3.2, -0.4], [new T.BoxGeometry(2.3, 0.15, 1.9), yellow, 0, 4.05, -0.4], [new T.BoxGeometry(0.5, 0.12, 0.2), orange, 0, 4.2, 0.6], [new T.SphereGeometry(0.14, 8, 6), loaderBeacon, 0, 4.32, 0.6], ...[[-1.3, 1.4], [1.3, 1.4], [-1.3, -1.4], [1.3, -1.4]].map(([dx, dz]): Part => [new T.CylinderGeometry(0.8, 0.8, 0.6, 14), rubber, dx, 0.8, dz, 0, 0, PI / 2])]));
    const beaconMesh = loader.children.find((c) => (c as T.Mesh).material === loaderBeacon);
    const arm = new T.Group(); arm.position.set(0, 1.9, 1.8); loader.add(arm);
    arm.add(merged([[new T.BoxGeometry(0.4, 0.4, 3.0), yellow, 0, 0, 1.5], [new T.BoxGeometry(3.2, 1.3, 1.2), steel, 0, -0.5, 3.4]]));
    const loaderAt = (t: number) => { const c = (t % 14) / 14, f = c < 0.25 ? c / 0.25 : c < 0.45 ? 1 : c < 0.7 ? 1 - (c - 0.45) / 0.25 : 0; loader.position.set(LX, 0, LZ + 2.2 * f * f * (3 - 2 * f)); arm.rotation.x = c < 0.3 ? 0.15 + 0.5 * c : c < 0.5 ? 0.3 - 4 * (c - 0.3) : c < 0.9 ? -0.5 : -0.5 + 6.5 * (c - 0.9); };
    loaderAt(0);
    if (!ctx.reduced) k.ticks.push((t) => { loaderAt(t); if (beaconMesh) beaconMesh.visible = Math.sin(t * 6) > 0; });
    k.keepOut.push({ x: LX, z: LZ + 2.3, r: 3.4 });
    let blade: T.Mesh | null = null;
    for (let i = 0; i < 4; i++) { const x = 30 + i * 4.2; const bl = k.mesh(new T.CylinderGeometry(1.3, 1.3, 3.4, 12, 1, true, 0, PI * 0.5), k.flat(0xf2b230, 0.2, 0.5, { side: T.DoubleSide }), x, 1.7, -BZ + 1.1); bl.rotation.set(0.2, -PI * 0.6, PI / 2); if (i === 0) blade = bl; k.keepOut.push({ x, z: -BZ + 1.1, r: 1.5 }); }
    k.box(1.2, 1.0, 2.6, 19.2, 0.5, 15.0, orange); k.box(1.2, 1.0, 2.6, 20.6, 0.5, 15.0, orange); k.keepOut.push({ x: 19.9, z: 15.2, r: 1.4 });
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; k.point(CX + Math.cos(a) * 15.5, 4.6, CZ + Math.sin(a) * 14.5, 0xffc890, 16, 12); }
    for (const [x, z] of [[26, -8], [46, 8], [36, 12]]) k.point(x, 16, z, 0xdfe8ff, 30, 30);
    for (const z of [-9, 9]) { k.box(0.4, 0.3, 0.6, BX0 - 0.3, 5.4, z, dark); k.point(BX0 - 1.2, 5.2, z, 0xffc070, 26, 18); }
    k.sign('"SALT"', 2.0, 0.5, BX0 + 0.24, 5.6, 0, 'transparent', '#f0f0ea', 130, PI / 2);
    // the river life: gulls over the water, the spreader rolling down West Street, walkers on the bikeway
    const gulls: T.Mesh[] = [];
    for (let i = 0; i < 9; i++) { const b = k.mesh(new T.ConeGeometry(0.16, 0.7, 4), gull, 0, 14, 0, true); b.rotation.x = PI / 2; gulls.push(b); }
    if (!ctx.reduced) k.ticks.push((t) => gulls.forEach((b, i) => { const a = t * 0.22 + i * 0.7, r = 26 + 10 * Math.sin(t * 0.1 + i); b.position.set(-40 + Math.cos(a) * r, 10 + 4 * Math.sin(t * 0.6 + i), Math.sin(a) * r * 1.4); b.rotation.y = -a; }));
    const truck = new T.Group();
    const tadd = (geo: T.BufferGeometry, m: T.Material, x: number, y: number, z: number) => { const o = new T.Mesh(geo, m); o.position.set(x, y, z); truck.add(o); return o; };
    tadd(new T.BoxGeometry(2.5, 2.4, 5.6), whiteM, 0, 2.0, -1.2); tadd(new T.BoxGeometry(2.5, 2.2, 2.2), whiteM, 0, 1.9, 2.8); tadd(new T.BoxGeometry(2.4, 0.9, 0.1), glassDark, 0, 2.3, 3.92);
    tadd(new T.BoxGeometry(2.6, 0.3, 5.8), orange, 0, 1.4, -1.2); tadd(new T.BoxGeometry(3.4, 1.1, 0.5), yellow, 0, 0.6, 4.4);
    { const wm = new T.InstancedMesh(new T.CylinderGeometry(0.5, 0.5, 0.35, 12), rubber, 6); [[-1.1, 2.3], [1.1, 2.3], [-1.1, -1.6], [1.1, -1.6], [-1.1, -3.2], [1.1, -3.2]].forEach(([dx, dz], i) => wm.setMatrixAt(i, mat(dx, 0.5, dz, 0, 1, 1, 1, 0, PI / 2))); wm.instanceMatrix.needsUpdate = true; truck.add(wm); }
    const tl = new T.Mesh(new T.BoxGeometry(0.3, 0.2, 0.3), k.glow(0xffa020)); tl.position.set(0, 3.1, 2.8); truck.add(tl);
    k.add(truck);
    k.rider(truck, k.spline([v(-6, 0, 100), v(-6, 0, -100), v(-2, 0, -108), v(6, 0, -100), v(6, 0, 100), v(2, 0, 108)], true), 7);
    if (!ctx.reduced) k.ticks.push((t) => { tl.visible = Math.sin(t * 5) > -0.2; });
    k.crowd([v(-18, 0, 90), v(-18, 0, -90)], 12, { seed: 483, speed: 1.6, spread: 1.6, animate: !ctx.reduced });
    k.crowd([v(13.5, 0, 80), v(13.5, 0, -80)], 8, { seed: 484, speed: 0.9, spread: 1.4, animate: !ctx.reduced });
    k.crowd([v(21, 0, -13), v(24, 0, -8), v(22, 0, 2), v(20, 0, 12)], 5, { seed: 485, speed: 0.3, spread: 1.0, animate: !ctx.reduced, colors: [0xf07a20, 0x24262c, 0xf07a20, 0x33477f] });
    // the spreader's spinner throwing salt behind the truck as it rolls
    const sprayN = 70, spr = new Float32Array(sprayN * 3), sprG = new T.BufferGeometry();
    sprG.setAttribute('position', new T.BufferAttribute(spr, 3)); sprG.boundingSphere = new T.Sphere(v(0, 1, -5), 6);
    truck.add(new T.Points(sprG, new T.PointsMaterial({ color: 0xf4f2ea, size: 0.1 })));
    const sprayAt = (t: number) => { for (let i = 0; i < sprayN; i++) { const u = (t * 1.8 + i / sprayN) % 1, a = (((i * 0.618) % 1) - 0.5) * 2.6, r = 0.3 + u * 3.2; spr.set([Math.sin(a) * r, Math.max(0.05, 0.9 - u * 1.4), -4.4 - Math.cos(a) * r * 0.6], i * 3); } sprG.attributes.position.needsUpdate = true; };
    sprayAt(0);
    if (!ctx.reduced) k.ticks.push((t) => sprayAt(t));
    // the first snow coming in off the river, over the street and the bikeway
    const dot = canvasTex(32, 32, (g) => { const r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); });
    const flakesN = ctx.quality === 'high' ? 2400 : 1100, fl = new Float32Array(flakesN * 3), fr = X.mulberry(486);
    for (let i = 0; i < flakesN; i++) fl.set([-30 + fr() * 44, fr() * 34, -70 + fr() * 140], i * 3);
    const flG = new T.BufferGeometry(); flG.setAttribute('position', new T.BufferAttribute(fl, 3)); flG.boundingSphere = new T.Sphere(v(-8, 17, 0), 80);
    k.add(new T.Points(flG, new T.PointsMaterial({ map: dot, size: 0.16, transparent: true, opacity: 0.9, depthWrite: false })));
    if (!ctx.reduced) { const sp = Float32Array.from({ length: flakesN }, () => 0.6 + fr() * 0.9); k.ticks.push((t, dt) => { const d = Math.min(dt, 0.1); for (let i = 0; i < flakesN; i++) { let y = fl[i * 3 + 1] - sp[i] * d; if (y < 0) y += 34; fl[i * 3 + 1] = y; fl[i * 3] += Math.sin(t * 0.7 + i) * 0.25 * d; } flG.attributes.position.needsUpdate = true; }); }
    // the moat of textured glass paving the shed rises out of
    const moat = k.flat(0xcfe6ee, 0.1, 0.15, { emissive: 0x9fd0e8, emissiveIntensity: 0.45 });
    for (const [z0, z1] of [[-BZ - 1.4, -4.4], [4.4, BZ + 1.4]]) k.box(1.4, 0.06, z1 - z0, BX0 - 1.0, 0.03, (z0 + z1) / 2, moat);
    for (const s of [-1, 1]) k.box(BX1 - BX0 + 2.8, 0.06, 1.4, (BX0 + BX1) / 2, 0.03, s * (BZ + 1.0), moat);
    for (const z of [-7, 7]) for (let i = 0; i < 3; i++) k.cyl(0.02, 0.7, BX0 - 2.2 - i * 0.2, 0.35, z + i * 0.9 * Math.sign(z), orange, 0.2, 10);
    // a sanitation truck with its plow on, parked on Spring Street between the shed and the garage
    const TX = 27, TZ = 20.8;
    k.box(6.2, 2.6, 2.5, TX + 1.2, 1.9, TZ, whiteM); k.box(2.2, 2.2, 2.5, TX - 2.9, 1.8, TZ, whiteM); k.box(0.1, 0.9, 2.3, TX - 4.02, 2.3, TZ, glassDark); k.box(8.6, 0.3, 2.6, TX - 0.2, 0.75, TZ, dark);
    for (const dx of [-3, 1.2, 3.1]) for (const s of [-1, 1]) { const w = k.cyl(0.5, 0.35, TX + dx, 0.5, TZ + s * 1.1, rubber, 0.5, 12); w.rotation.x = PI / 2; }
    const plow = k.box(0.2, 1.1, 3.4, TX - 4.9, 0.7, TZ, orange); plow.rotation.y = 0.35;
    k.block(TX - 5.4, TX + 4.4, TZ - 1.5, TZ + 1.5);
    // downriver, the Holland Tunnel's ventilation building standing in the Hudson
    const HX = -52, HZ = -104, ventB = k.pbr('ssVent', X.brick(0xb48a62, 488), 0.28);
    k.box(26, 3.2, 18, HX, -0.2, HZ, base); k.box(16, 30, 11, HX, 16.4, HZ, ventB); k.box(12, 6, 8, HX, 34.4, HZ, ventB);
    for (const y of [6, 11, 16, 21, 26]) { k.box(16.12, 1.4, 7, HX, y, HZ, dark); k.box(10, 1.4, 11.12, HX, y, HZ, dark); }
    for (const dz of [-2, 2]) k.cyl(1.1, 5, HX, 39.9, HZ + dz, steel, 1.3, 12);
    k.box(14, 1.0, 3.2, -32, 0.4, HZ, base);
    // upriver, Pier 40 at West Houston Street, ball fields on its roof
    const P4X = -78, P4Z = 78, pierM = k.pbr('ssPier', X.windows(489, 0.15, 0x5a6470, false), 0.1, { roughness: 0.6, metalness: 0.3, stretch: 0.42 }), turf = k.flat(0x3d7a3a, 0, 0.9);
    k.box(80, 12, 80, P4X, 4.4, P4Z, pierM); k.box(80.4, 0.4, 80.4, P4X, 10.6, P4Z, dark);
    for (const dz of [-18, 18]) { k.box(70, 0.1, 32, P4X, 10.85, P4Z + dz, turf); k.box(0.3, 0.02, 32, P4X, 10.91, P4Z + dz, whiteM); k.box(70, 0.02, 0.3, P4X, 10.91, P4Z + dz - 15.8, whiteM); }
    k.box(16, 1.4, 16, -30, 0.1, P4Z, base);
    // south down West Street, One World Trade Center over everything
    const WTX = 40, WTZ = -430;
    k.box(24, 26, 24, WTX, 13, WTZ, k.flat(0x9fb6cc, 0.7, 0.18));
    k.mesh(new ConvexGeometry([v(-12, 26, -12), v(12, 26, -12), v(12, 26, 12), v(-12, 26, 12), v(-10.5, 228, 0), v(10.5, 228, 0), v(0, 228, -10.5), v(0, 228, 10.5)]), k.flat(0x9fb6cc, 0.7, 0.19), WTX, 0, WTZ);
    k.cyl(0.5, 62, WTX, 259, WTZ, steelL, 1.3, 8);
    // what this corner of the river is built on
    k.egg(shedSign, { id: 'shed', title: 'A crystal of salt', text: "Dattner Architects designed the shed with WXY for the Department of Sanitation. Its folded concrete, both structure and finish, rises nearly 70 feet out of a moat of textured glass paving and holds 5,000 tons of the city's road salt.", clue: 'The name is written over the truck door.', source: { name: 'Dattner Architects', url: 'https://www.dattner.com/projects/view/spring-street-salt-shed/' } });
    k.egg(garageSign, { id: 'garage', title: 'The garage in a veil', text: 'Across Spring Street, the Manhattan Districts 1, 2 and 5 Garage holds over 150 sanitation vehicles behind 2,600 perforated aluminum fins that cut glare and hide headlights from the neighbours. A 1.5 acre green roof tops it, and it is certified LEED Gold.', clue: 'Next door, thousands of fins keep a secret from the neighbours.', source: { name: 'Dattner Architects', url: 'https://www.dattner.com/projects/view/manhattan-districts-1-2-5-garage/' } });
    k.egg(blade ?? v(30, 1.7, -BZ + 1.1), { id: 'spreaders', title: 'Seven hundred spreaders', year: '2026', text: 'Before a snowstorm the Department of Sanitation gets 700 salt spreaders filled and ready to go. For a storm in February 2026 it also enlisted over 1,000 emergency snow shovelers.', clue: 'Walk in past the mountain to the yellow blades resting on the wall.', source: { name: 'NYC Department of Sanitation', url: 'https://www.nyc.gov/site/dsny/news/26-012/dsny-issues-snow-alert-sunday-february-22-2026-6-am' } });
    k.egg(v(HX + 8.2, 18, HZ), { id: 'holland', title: 'The tower that breathes', year: '1927', text: 'Downriver, the Holland Tunnel opened on November 13, 1927, the first mechanically ventilated underwater vehicular tunnel. Four ventilation buildings, two on each side of the Hudson, hold 84 fans that clear the fumes every 90 seconds. It became a National Historic Landmark in 1993.', clue: 'A brick tower stands in the river, breathing for the cars below.', source: { name: 'Port Authority of NY and NJ', url: 'https://portfolio.panynj.gov/2017/11/13/the-holland-at-90-a-drive-down-memory-lane/' } }, { r: 5 });
    k.egg(v(P4X + 40.5, 8, P4Z - 20), { id: 'pier40', title: 'Pier 40', year: '1962', text: 'Pier 40 at West Houston Street was built between 1958 and 1962 for the Holland America Line, the largest passenger and freight terminal in the Port of New York at the time. The Hudson River Park Act made it parkland in 1998.', clue: 'Upriver, a pier as big as a neighbourhood plays ball on its roof.', source: { name: 'Village Preservation', url: 'https://villagepreservation.org/2023/11/14/pier-40s-murals-illustrate-local-history/' } }, { r: 6 });
    k.egg(v(WTX, 150, WTZ + 14), { id: 'wtc', title: 'One World Trade Center', year: '2014', room: 'oculus', text: 'One World Trade Center rises 1,776 feet, a height that recalls the year of independence, and was completed in 2014 as the tallest building in the Western Hemisphere.', clue: 'Look south down West Street for the crystal that outgrew this one.', source: { name: 'SOM', url: 'https://www.som.com/projects/one-world-trade-center/' } }, { r: 16 });
    // the hang: the promenade walls around the mountain, the crew wall as the census
    const mounts: Mount[] = [];
    for (const z of [-10.5, 10.5]) mounts.push(M(BX0 + 0.24, 3.5, z, BX0 + 5, z, 5.0, 2.6, 'steel', true));
    for (const x of [20, 25.5, 31, 36.5, 42, 47.5]) mounts.push(M(x, 3.5, BZ - 0.24, x, BZ - 5, 4.6, 2.6, 'steel', true));
    for (const x of [21, 39, 45, 50.4]) mounts.push(M(x, 3.5, -BZ + 0.24, x, -BZ + (x === 39 ? 4 : 5), 4.6, 2.6, 'steel', true));
    for (const z of [-14.4, -9.6, -4.8, 0, 4.8, 9.6, 14.4]) mounts.push(M(BX1 - 0.24, 3.5, z, BX1 - 5, z, 4.2, 2.6, 'steel', true));
    k.censusWall({ x: 30, y: 3.6, z: -BZ + 0.24, rotY: 0, cols: 14, rows: 4, tile: 0.5, gap: 0.05, start: ctx.wallStart(6800, 56), pieces: ctx.all, backing: dark });
    k.sign('THE CREW  ·  SPRING STREET  ·  NIGHT PLOW', 6, 0.44, 30, 5.65, -BZ + 0.24, 'transparent', '#f0f0ea', 64, 0);
    return { mounts, spawn: v(-14, 3, 0), look: v(35, 10, 0), eye: 3, bounds: [-21.6, BX1 - 0.6, -70, 70], style: 'steel' };
  },
};
