/* 122 and 123: Katz's and Barney Greengrass, rebuilt by hand after the first pass read as boxes. */
import * as T from 'three';
import * as X from '../textures';
import { v, type Mount, type FrameStyle } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront } from './f';
const PI = Math.PI;

/* Traffic: every car on the avenue is one instance of a body and one of a cabin, two draw calls for the lot.
   Lanes run along `axis` at a fixed cross position; dir +1 or -1 picks the direction of travel. */
function traffic(k: Parameters<RoomDef['build']>[0], lanes: { at: number; dir: number }[], axis: 'x' | 'z', len: number, perLane: number, animate: boolean, seed: number) {
  const rnd = X.mulberry(seed), n = lanes.length * perLane, blank = () => Array.from({ length: n }, () => new T.Matrix4());
  const body = k.instances(new T.BoxGeometry(1.9, 0.8, 4.4), k.flat(0xffffff, 0.5, 0.35), blank());
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
  description: 'The corner of Houston and Ludlow since 1888: the red sign band, salamis in the window, a ticket at the door, the long cutting counter with its numbered stations, and the wall of regulars, every one of them a painted New Yorker.',
  signatures: 'The corner sign band and neon, salamis hung in the windows, the ticket at the door, the numbered cutting stations, steam tables, the tin ceiling and ceiling fans, the photo wall of regulars, the table where Harry met Sally.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ed0, horizon: 0xe9e4d6, ground: 0x5b544a, fog: 0.0028, sun: { az: 0.9, el: 0.55, color: 0xfff0d2, size: 14 }, env: 0.9 });
    k.hemi(0xfff1dc, 0x4a423a, 0.9);
    k.sun(0xffefd0, 2.1, 34, 42, 26, true, 70);
    const tin = k.pbr('katzTin', X.ashlar(0xe3dfd4, 15, 6), 1.5, { metalness: 0.45, roughness: 0.45 }),
      tile = k.pbr('katzTile', X.subwayTile(0xf1eee4, 0x3a3a36), 1.0, { roughness: 0.28 }),
      floorT = k.pbr('katzTerrazzo', X.terrazzo(0xcfc6b4, 61), 1.6, { roughness: 0.5 }),
      plaster = k.pbr('katzPlaster', X.plaster(0xe8e0cc, 62), 2.2, { roughness: 0.9 }),
      wood = k.pbr('katzWood', X.planks(0x5e3f2a, 6, 63), 1.2, { roughness: 0.55 }),
      marble = k.pbr('katzMarble', X.marble(0xe9e5dd, 0x8f8a80, 64), 0.7, { roughness: 0.5 }),
      brick = k.pbr('katzBrick', X.brick(0x7a4a3c, 65), 0.28),
      steel = k.flat(0xc9ccd0, 0.85, 0.28),
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
    street(k, { w: 16, len: 130, z: 0, x: RX });
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
    for (let y = H + 4.2; y < H + 15; y += 3.4) for (let dz = -11; dz <= 11; dz += 3.6) { k.box(0.2, 2.1, 1.4, FX - 0.06, y, dz, k.flat(0xd6d1c3, 0, 0.8)); k.box(0.05, 1.8, 1.15, FX + 0.06, y, dz, y < H + 8 ? warm : glass); }
    k.prop('fire_escape', FX + 1.05, H + 3.2, -5, { height: 3.2, rotY: -PI / 2 });
    k.prop('fire_escape', FX + 1.05, H + 6.6, -5, { height: 3.2, rotY: -PI / 2 });
    k.prop('fire_escape', FX + 1.05, H + 9.9, 6, { height: 3.2, rotY: -PI / 2 });
    k.prop('water_tower', FX - 12, H + 16, -4, { height: 6 });
    // the sign band: KATZ'S DELICATESSEN in cream on red, wrapping the corner, with the neon over the door
    k.box(0.5, 2.4, D + 0.4, FX + 0.1, H + 1.6, 0, red);
    k.sign("KATZ’S DELICATESSEN", 22, 1.5, FX + 0.4, H + 1.85, -1, '#a8181c', '#f6e9c8', 54, PI / 2);
    k.sign('KNOWN AS THE BEST · SINCE 1888', 12, 0.55, FX + 0.4, H + 0.75, -1, '#a8181c', '#f6e9c8', 34, PI / 2);
    k.box(0.5, 2.4, 1.0, FX - 0.15, H + 1.6, D / 2 + 0.2, red);
    k.sign("KATZ’S", 5, 1.4, FX + 0.45, H + 4.4, 9.5, 'transparent', '#ff4a3a', 200, PI / 2);
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
    for (let i = 0; i < 12; i++) { const z = -12.4 + i * 1.05; if (z > -0.9 && z < 0.9) continue; k.cyl(0.16, 1.5 + (i % 3) * 0.25, FX - 0.7, 3.9, z, salami, 0.14, 8); k.beam(v(FX - 0.7, 4.7, z), v(FX - 0.7, 5.3, z), 0.02, steel, 4); }
    for (let i = 0; i < 5; i++) { const z = 1.2 + i * 1.05; k.cyl(0.16, 1.5 + (i % 3) * 0.25, FX - 0.7, 3.9, z, salami, 0.14, 8); k.beam(v(FX - 0.7, 4.7, z), v(FX - 0.7, 5.3, z), 0.02, steel, 4); }
    k.box(0.05, 0.05, D - 4, FX - 0.7, 5.3, -1, steel);
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
    for (const x of [-12, -2, 8]) for (const z of [-4, 6]) { k.cyl(0.02, 1.1, x, H - 0.55, z, dark, 0.02, 6); k.sphere(0.34, x, H - 1.2, z, warm, 14); k.point(x, H - 1.5, z, 0xffe0b8, 28, 16); }
    for (const x of [-14, -4, 6]) { const fan = new T.Group(); fan.position.set(x, H - 0.9, 1); for (let b = 0; b < 4; b++) { const bl = new T.Mesh(new T.BoxGeometry(1.5, 0.04, 0.32), k.flat(0x3a2a20, 0.2, 0.7)); bl.position.x = 0.85; const pivot = new T.Group(); pivot.rotation.y = (b * PI) / 2; pivot.add(bl); fan.add(pivot); } k.add(fan); k.cyl(0.05, 0.9, x, H - 0.45, 1, dark, 0.05, 6); if (!ctx.reduced) k.ticks.push((t) => { fan.rotation.y = t * 2.6; }); }
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
      for (let b = 0; b < 3; b++) k.cyl(0.13, 0.9, x - 0.5 + b * 0.5, 2.35, CZ - 2.2, salami, 0.11, 8);
    }
    k.box(0.05, 0.05, 0.05, 0, 0, 0, steel).visible = false;
    k.box(W - 6, 0.05, 0.05, FX - W / 2 - 2, 2.85, CZ - 2.2, steel);
    // the menu boards over the steam tables
    k.sign('PASTRAMI · CORNED BEEF · BRISKET · TONGUE · SALAMI · TURKEY', 14, 0.7, LX + 10, 5.5, -D / 2 + 0.35, '#111111', '#f6e9c8', 38, 0, { border: true });
    k.sign('KNISHES · HOT DOGS · MATZO BALL SOUP · EGG CREAMS · DR BROWN’S', 12, 0.6, FX - 12, 5.5, -D / 2 + 0.35, '#111111', '#f6e9c8', 36, 0, { border: true });
    // tables and chairs, and the one table everyone asks for
    const table = (x: number, z: number) => { k.box(1.6, 0.08, 1.1, x, 1.06, z, k.flat(0xf1ece2, 0, 0.5)); k.box(0.09, 1.0, 0.09, x - 0.6, 0.5, z - 0.4, dark); k.box(0.09, 1.0, 0.09, x + 0.6, 0.5, z + 0.4, dark); k.box(0.09, 1.0, 0.09, x - 0.6, 0.5, z + 0.4, dark); k.box(0.09, 1.0, 0.09, x + 0.6, 0.5, z - 0.4, dark); for (const s of [-1, 1]) { k.box(0.6, 0.08, 0.6, x + s * 1.2, 0.62, z, red); k.box(0.6, 0.55, 0.08, x + s * 1.48, 0.95, z, red); } k.keepOut.push({ x, z, r: 1.55 }); };
    for (const x of [-13, -8, -3, 2, 7]) for (const z of [-3.5, 2.5]) table(x, z);
    for (const x of [-13, -8, -3, 2]) table(x, 8.5);
    const harrySign = k.sign('WHERE HARRY MET SALLY · HOPE YOU HAVE WHAT SHE HAD!', 3.6, 0.55, -5, 4.3, 2.5, '#f6e9c8', '#7a1a1a', 60, 0, { border: true, double: true });
    k.beam(v(-5, 4.58, 2.5), v(-5, H, 2.5), 0.015, steel, 4);
    // the regulars: the photo wall becomes the census, floor to ceiling along the table wall
    k.censusWall({ x: LX + 10, y: 3.35, z: D / 2 - 0.34, rotY: PI, cols: 24, rows: 6, tile: 0.62, gap: 0.05, start: ctx.wallStart(2400, 144), pieces: ctx.all, backing: wood });
    // life: the counter line, the sidewalk, a neon that hums
    if (!ctx.reduced) {
      k.crowd([v(FX - 6, 0, CZ + 1.8), v(LX + 4, 0, CZ + 1.8)], 10, { seed: 19, speed: 0.12, spread: 0.5, colors: [0x2a2f3a, 0x6b4f3a, 0x8f2a2a, 0xd9cbb0, 0x3c5a7a] });
      k.crowd([v(RX - 10.5, 0, -60), v(RX - 10.5, 0, 60)], 16, { seed: 21, speed: 0.7, spread: 1.6 });
      k.crowd([v(RX + 10.5, 0, 60), v(RX + 10.5, 0, -60)], 12, { seed: 22, speed: 0.7, spread: 1.6 });
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
      k.crowd([v(LX + 4, 0, -11), v(FX - 6, 0, -11)], 6, { seed: 125, speed: 0.18, spread: 0.3, colors: [0xf4f2ec, 0xeeeae0, 0xe8e4da] });
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

/* ---------------- 123 BARNEY GREENGRASS ---------------- */
/* The store is MLow's own Blender model of the Amsterdam Avenue shop (assets/museum/props/barney_greengrass.glb),
   placed at 1.5 times life so it sits at museum scale. Blender x, y, z became x, height, -z; every number
   below is a Blender measurement times 1.5. The collision follows the real walls, the case and the tables. */
export const barney: RoomDef = {
  id: 'barney',
  name: 'Barney Greengrass: Sunday regulars',
  area: 'BARNEY GREENGRASS / UPPER WEST SIDE',
  mood: 'A table near the window',
  color: '#2f6b46',
  description: 'The Sturgeon King on Amsterdam Avenue since 1929: green awnings under the red and blue sign, sidewalk tables behind the green rail, the appetizing counter with its boards, and the dining room where the regulars now hang where the murals were.',
  signatures: 'The three green awnings and the sign band, the sidewalk rail, the terrazzo, the green wainscot and pale walls, the glass appetizing case with its caviar and herring boards, the pass through to the dining room, the wall clock, the pendant globes.',
  build(k, ctx) {
    k.sky({ top: 0x7fa9d8, horizon: 0xeae6dc, ground: 0x625a50, fog: 0.0026, sun: { az: 2.2, el: 0.5, color: 0xfff0d6, size: 14 }, env: 0.9 });
    k.hemi(0xfff3e2, 0x4d4640, 0.95);
    k.sun(0xffefd4, 1.6, 60, 52, 14, true, 70);
    const S = 1.5;
    const asphalt = k.pbr('asphaltS', X.asphalt(0x24282d), 0.11, { roughness: 0.62, metalness: 0.12 }),
      pav = k.pbr('sidewalkS', X.pavers(0x8e8b84, 5), 0.42),
      granite = k.pbr('curbS', X.ashlar(0x8a8a86, 4, 2), 0.35),
      white = k.flat(0xdedbd2, 0, 0.7),
      yellow = k.flat(0xe6a626, 0, 0.6),
      iron = k.flat(0x1f262b, 0.75, 0.45),
      warm = k.glow(0xffe1b8),
      green = k.flat(0x1a4a30, 0, 0.8);
    // the store itself: front on z = 0, the street at +z. The kit stands a prop on its bounding box, and this
    // model reaches 1.34 m below its own floor, so the floor is placed by hand at world zero.
    k.prop('barney_greengrass', 0, -1.34 * S, 0, { scale: S });
    // Amsterdam Avenue runs along x in front of the store: the far sidewalk, the road, the near sidewalk are in the model up to z = 17
    for (const s of [-1, 1]) { const x0 = s * 41; k.box(58, 0.28, 6.1, x0, 0.0, 3.4, pav); k.box(58, 0.3, 10.5, x0, -0.15, 11.75, asphalt); k.box(58, 0.3, 0.3, x0, 0.02, 6.55, granite); }
    k.box(150, 0.28, 6, 0, 0.0, 20.2, pav);
    k.box(150, 0.3, 0.3, 0, 0.02, 17.15, granite);
    for (const s of [-1, 1]) for (const dz of [-0.14, 0.14]) k.box(58, 0.012, 0.09, s * 41, 0.01, 11.75 + dz, yellow);
    for (const x of [-40, 40]) for (let z = 7.6; z < 16.5; z += 1.2) k.box(2.8, 0.014, 0.62, x, 0.012, z, white);
    // the neighbours: brownstone fronts beside the store, a taller block across the avenue
    const rnd = X.mulberry(88);
    const fronts = [k.pbr('nbBrickA', X.brick(0x6b4437, 21), 0.28), k.pbr('nbStone', X.ashlar(0xb9ad97, 23, 3), 0.22), k.pbr('nbBrickB', X.brick(0x4f3b36, 22), 0.28)];
    const cornice = k.pbr('nbCornice', X.plaster(0xb8ad9a, 3), 0.6), glassDark = k.glass(0x9fc4d8, 0.35, 0.08);
    const house = (x: number, z: number, w: number, d: number, hh: number, m: T.Material, face: number) => {
      k.box(w, hh, d, x, hh / 2, z, m);
      k.moulding([[0, 0], [0.7, 0], [0.8, 0.2], [0.5, 0.35], [0.6, 0.55], [0.25, 0.75], [0, 0.85]], w, x, hh - 0.5, z + face * d / 2, cornice, face > 0 ? PI / 2 : -PI / 2);
      for (let y = 3.4; y < hh - 1.5; y += 3.1) for (let dx = -w / 2 + 1.8; dx < w / 2 - 1; dx += 2.7) { k.box(1.35, 1.9, 0.2, x + dx, y, z + face * (d / 2 + 0.06), cornice); k.box(1.1, 1.65, 0.05, x + dx, y, z + face * (d / 2 + 0.12), rnd() > 0.7 ? warm : glassDark); }
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
    k.prop('utility_pole', 22, 0, 18.6, { height: 11 });
    // light: under the awnings, in the dining pendants, over the counter, on the boards
    for (const x of [-6, 0.5, 6]) k.point(x, 4.0, 1.4, 0xffe6c2, 14, 8);
    for (const z of [-4.5, -9, -13.5, -17.5]) k.point(-5.7, 4.3, z, 0xffe4bd, 9, 7);
    for (const z of [-3.5, -8.5, -13.5, -18]) k.point(3.5, 4.6, z, 0xfff0d8, 9, 7);
    for (const z of [-4, -7.5]) k.spot(-1.2, 5.0, z, -2.3, 3.2, z, 0xfff1d6, 30, 0.6, 0.6, 10);
    k.spot(3.3, 5.0, -17, 3.3, 3.6, -20.2, 0xfff1d6, 28, 0.7, 0.6, 10);
    // a hanging sturgeon sign on a chain that sways in the doorway draught
    const sway = new T.Group(); sway.position.set(1.8, 4.9, 0.9);
    const chain = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.5, 5), iron); chain.position.y = -0.25; sway.add(chain);
    const plate = k.sign('THE STURGEON KING', 1.9, 0.5, 0, 0, 0, '#1a4a30', '#f3ecd6', 84, 0, { border: true, double: true }); plate.position.set(0, -0.75, 0); k.scene.remove(plate); sway.add(plate);
    k.add(sway);
    if (!ctx.reduced) k.ticks.push((t) => { sway.rotation.z = Math.sin(t * 1.3) * 0.06; sway.rotation.x = Math.sin(t * 0.9 + 1) * 0.04; });
    // the clock on the dining room wall keeps New York time
    const hand = k.box(0.03, 0.42, 0.02, -7.2, 4.35, -20.05, iron), hand2 = k.box(0.03, 0.3, 0.02, -7.2, 4.35, -20.05, iron);
    if (!ctx.reduced) k.ticks.push((t) => { hand.rotation.z = -t * 0.35; hand2.rotation.z = -t * 0.03; });
    // collision: the real walls, the door gaps at the main door and the dining door, the partition with its pass through, the case, the shelves
    k.block(-9.3, -8.7, -20.8, 0.4); k.block(8.7, 9.3, -20.8, 0.4); k.block(-9.3, 9.3, -20.8, -20.1);
    k.block(-8.9, -6.7, -0.2, 0.55); k.block(-5.0, 0.35, -0.2, 0.55); k.block(3.25, 8.9, -0.2, 0.55);
    k.block(-2.7, -2.1, -9.85, -0.3); k.block(-2.7, -2.1, -20.2, -14.15);
    k.block(-1.45, 0.2, -9.7, -2.6); k.block(8.2, 8.9, -18.4, -8.3);
    for (const x of [-7.35, -4.05]) for (const z of [-5.25, -9.0, -12.75, -16.5]) k.keepOut.push({ x, z, r: 0.8 });
    for (const z of [-3.3, -7.05, -10.8, -14.55, -18.3]) k.keepOut.push({ x: 6.9, z, r: 0.75 });
    k.keepOut.push({ x: -8.3, z: -1.35, r: 0.5 });
    for (const x of [-6.2, -3.3, 1.2, 4.6, 7.2]) k.keepOut.push({ x, z: 4.2, r: 0.9 });
    // life: the avenue, the sidewalk tables, the line at the counter
    if (!ctx.reduced) {
      k.crowd([v(-70, 0, 3.6), v(70, 0, 3.6)], 14, { seed: 31, speed: 0.65, spread: 1.4 });
      k.crowd([v(70, 0, 20.4), v(-70, 0, 20.4)], 12, { seed: 32, speed: 0.6, spread: 1.6 });
      k.crowd([v(1.3, 0, -2.2), v(1.3, 0, -9.2)], 7, { seed: 33, speed: 0.1, spread: 0.45, colors: [0x2a2f3a, 0x6b4f3a, 0xd9cbb0, 0x3c5a7a, 0x8f6a2a] });
      k.crowd([v(-5.7, 0, -3), v(-5.7, 0, -18)], 5, { seed: 34, speed: 0.08, spread: 0.6, colors: [0x2a2f3a, 0x6b4f3a, 0xd9cbb0] });
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
    const rider = new T.Mesh(new T.CapsuleGeometry(0.19, 0.6, 3, 8), k.flat(0x8a2a2a, 0, 0.8)); rider.position.set(0, 1.25, -0.1); rider.rotation.x = 0.35; bike.add(rider);
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
    k.egg(v(-0.6, 1.7, -6.0), { id: 'sturgeon-for-fdr', title: 'Sturgeon for the President', year: '1939', text: 'For Thanksgiving in 1939 the store shipped an order of smoked sturgeon to President Franklin D. Roosevelt at Warm Springs, Georgia.', clue: 'The fish in the case behind the counter once filled a very important order.', source: bg }, { r: 1.1 });
    k.egg(v(-5.7, 1.5, -11.0), { id: 'dining-room', title: 'A room to sit down in', year: '1938', text: 'Barney Greengrass began as an appetizing store you carried home from. In 1938 it expanded and opened a restaurant section, and the tables here are where the regulars sit.', clue: 'The part of the store with chairs came later than the counter.', source: bg }, { r: 1.5 });
    k.egg(v(-7.2, 4.35, -20.0), { id: 'three-generations', title: 'Barney, Moe, Gary', year: '1955 and 1982', text: 'When Barney died in 1955 his son Moe took over, and Moe’s son Gary took the reins in 1982. The James Beard Foundation named it An American Classic in 2006, and the store turned 100 in 2008.', clue: 'The clock on the dining room wall has kept time for more than one generation.', source: bg }, { r: 0.8 });
    // the hang: the regulars where the murals were, the counter room above the shelves, the rear walls
    const mounts: Mount[] = [];
    const at = (x: number, y: number, z: number, tx: number, tz: number, w: number, h: number, style: FrameStyle = 'oak'): Mount => ({ position: v(x, y, z), rotation: Math.atan2(tx - x, tz - z), target: v(tx, 2.3, tz), width: w, height: h, style, wash: false });
    for (let i = 0; i < 6; i++) { const z = -2.6 - i * 3.05; mounts.push(at(-8.5, 3.2, z, -5.7, z, 2.3, 1.55)); }
    for (const z of [-15.6, -18.6]) mounts.push(at(-2.9, 3.1, z, -5.7, z, 2.2, 1.5));
    for (const z of [-2.3, -8.6]) mounts.push(at(-2.9, 3.15, z, -5.7, z, 2.0, 1.4));
    for (let i = 0; i < 5; i++) { const z = -3 - i * 3.5; mounts.push(at(8.5, 4.25, z, 5.3, z, 2.3, 1.35, 'black')); }
    for (const x of [0.4, 7.0]) mounts.push(at(x, 3.4, -19.9, x, -16.5, 2.2, 1.5));
    for (const z of [-15.6, -18.6]) mounts.push(at(-1.9, 3.1, z, 1.6, z, 2.2, 1.5));
    for (const x of [-6.4, 7.6]) mounts.push({ position: v(x, 3.2, 0.62), rotation: 0, target: v(x + 1.4, 2.3, 5.9), width: 2.0, height: 1.3, style: 'none', wash: false, lookAt: v(x, 3.2, 0) });
    return { mounts, spawn: v(2.5, 2.3, 17.8), look: v(0.5, 4.6, 0), eye: 2.3, bounds: [-13.5, 13.5, -19.7, 22.6], style: 'oak' };
  },
};
