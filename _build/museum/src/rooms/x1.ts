/* 112 to 116: five working worlds, speculative interiors built around real New York systems.
   The pneumatic tube mail (1897 to 1953), a Seventh Avenue cutting loft, the West 47th Street
   diamond exchange, the Con Edison district steam system (since 1882) and a Newspaper Row press
   floor around 1890. Every one has its street and its door, a floor you believe, a ceiling with
   light in it, the machines of its trade, at least two ticks of life and 18 to 24 New Yorkers. */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as X from '../textures';
import { v } from '../kit';
import type { Kit, Mount } from '../kit';
import type { RoomDef, RoomCtx } from './types';

const PI = Math.PI;

/* ---------- shared street furniture: every interior here has its door on +z ---------- */
/* A cross street running along x at z: asphalt, both sidewalks, curbs, lane dashes, crosswalks. */
function avenue(k: Kit, z: number, len = 130, w = 16, walk = 5) {
  const asphalt = k.pbr('xwAsphalt', X.asphalt(0x24282d), 0.11, { roughness: 0.62, metalness: 0.12 }),
    pav = k.pbr('xwWalk', X.pavers(0x8e8b84, 5), 0.42),
    curb = k.pbr('xwCurb', X.ashlar(0x8a8a86, 4, 2), 0.35),
    white = k.flat(0xdedbd2, 0, 0.7),
    yellow = k.flat(0xe6a626, 0, 0.6);
  k.box(len, 0.3, w, 0, -0.15, z, asphalt);
  for (const s of [-1, 1]) {
    k.box(len, 0.28, walk, 0, 0, z + s * (w / 2 + walk / 2), pav);
    k.box(len, 0.32, 0.3, 0, 0.02, z + s * (w / 2 + 0.1), curb);
  }
  for (const dz of [-0.14, 0.14]) k.box(len - 6, 0.012, 0.09, 0, 0.01, z + dz, yellow);
  for (const cx of [-32, 0, 32]) for (let cz = -w / 2 + 1.2; cz <= w / 2 - 1; cz += 1.2) k.box(2.8, 0.014, 0.62, cx, 0.012, z + cz, white);
}

/* A row of brick neighbours along x whose fronts face -z, lit windows, shop fronts, fascia signs. */
function frontage(k: Kit, p: { z: number; count: number; seed: number; h?: [number, number]; x0?: number; signs?: string[]; night?: boolean }) {
  const { z, count, seed, h = [14, 24], x0 = 0, signs = [], night = false } = p;
  const rnd = X.mulberry(seed);
  const bricks = [k.pbr('xwBrickA', X.brick(0x6b4437, 21), 0.28), k.pbr('xwBrickB', X.brick(0x4f3b36, 22), 0.28), k.pbr('xwStone', X.ashlar(0xb9ad97, 23, 3), 0.22)];
  const cornice = k.pbr('xwCornice', X.plaster(0xb8ad9a, 3), 0.6),
    glassDark = k.glass(0x9fc4d8, 0.35, 0.08),
    warm = k.glow(0xffd28a),
    iron = k.flat(0x1f262b, 0.75, 0.45),
    shop = k.glow(0xfff0cc),
    dark = k.flat(0x15171b, 0.3, 0.7);
  for (let b = 0; b < count; b++) {
    const x = x0 + (b - (count - 1) / 2) * 10,
      hh = h[0] + Math.floor(rnd() * (h[1] - h[0])),
      m = bricks[Math.floor(rnd() * 3)];
    k.box(9.9, hh, 12, x, hh / 2, z + 6, m);
    k.moulding([[0, 0], [0.7, 0], [0.8, 0.2], [0.5, 0.35], [0.6, 0.55], [0.25, 0.75], [0, 0.85]], 10, x, hh - 0.5, z - 0.05, cornice, PI / 2);
    for (let y = 6.4; y < hh - 1.5; y += 2.7) for (const dx of [-3, 0, 3]) {
      k.box(1.35, 1.9, 0.2, x + dx, y, z + 0.06, cornice);
      k.box(1.1, 1.65, 0.05, x + dx, y, z - 0.06, rnd() > (night ? 0.4 : 0.72) ? warm : glassDark);
      k.box(0.05, 1.7, 0.05, x + dx, y, z - 0.1, iron);
    }
    k.box(7.6, 2.8, 0.1, x, 2.0, z - 0.06, shop);
    k.box(8.2, 0.9, 0.3, x, 4.1, z - 0.1, dark);
    if (signs[b]) k.sign(signs[b], 7.8, 0.7, x, 4.1, z - 0.27, '#15171b', '#f2e6c8', 84, PI, { border: true });
    if (rnd() > 0.5) k.prop('fire_escape', x, 6.6 + rnd() * 3, z - 1.05, { height: 3.2, rotY: 0 });
    if (rnd() > 0.6) k.prop('water_tower', x + 2, hh, z + 6, { height: 5 });
  }
}

/* A front wall on z with a real opening: two side pieces and a header, blocks under both sides. */
function frontWall(k: Kit, p: { z: number; w: number; h: number; door: number; doorH: number; m: T.Material; thick?: number; x?: number }) {
  const { z, w, h, door, doorH, m, thick = 0.5, x = 0 } = p;
  const side = (w - door) / 2;
  for (const s of [-1, 1]) {
    k.box(side, h, thick, x + s * (door / 2 + side / 2), h / 2, z, m);
    k.block(x + (s > 0 ? door / 2 : -w / 2), x + (s > 0 ? w / 2 : -door / 2), z - thick, z + thick);
  }
  k.box(door + 0.4, h - doorH, thick, x, doorH + (h - doorH) / 2, z, m);
}

/* A front wall on z with a door and a shop window each side, all real openings; the glass sits in the wall plane. */
function glazedFront(k: Kit, p: { z: number; w: number; h: number; door: number; doorH: number; win: [number, number]; winY: [number, number]; m: T.Material; glass: T.Material; iron: T.Material; thick?: number }) {
  const { z, w, h, door, doorH, win, winY, m, glass, iron, thick = 0.5 } = p;
  const [w0, w1] = win, [y0, y1] = winY, ww = w1 - w0, wh = y1 - y0, wc = (w0 + w1) / 2, yc = (y0 + y1) / 2;
  k.box(w, y0, thick, 0, y0 / 2, z, m);
  k.box(w, h - y1, thick, 0, y1 + (h - y1) / 2, z, m);
  k.box(door + 0.4, y1 - doorH, thick, 0, doorH + (y1 - doorH) / 2, z, m);
  for (const s of [-1, 1]) {
    k.box(w0 - door / 2, y1 - y0, thick, s * (door / 2 + (w0 - door / 2) / 2), yc, z, m);
    k.box(w / 2 - w1, y1 - y0, thick, s * (w1 + (w / 2 - w1) / 2), yc, z, m);
    k.box(ww, wh, 0.08, s * wc, yc, z, glass);
    for (const dx of [-ww / 3, 0, ww / 3]) k.box(0.1, wh, thick + 0.1, s * wc + dx, yc, z, iron);
    k.box(ww, 0.1, thick + 0.1, s * wc, yc, z, iron);
    k.box(ww + 0.3, 0.24, thick + 0.2, s * wc, y0 - 0.06, z, iron);
    k.block(s > 0 ? door / 2 : -w / 2, s > 0 ? w / 2 : -door / 2, z - thick, z + thick);
  }
}

/* A clock that keeps New York time: hour and minute from the museum clock, a second hand that ticks. */
function clock(k: Kit, ctx: RoomCtx, x: number, y: number, z: number, rotY: number, r: number, face: T.Material, rim: T.Material, hands: T.Material) {
  const g = new T.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  const dial = new T.Mesh(new T.CircleGeometry(r, 40), face);
  dial.position.z = 0.03;
  g.add(dial);
  const ring = new T.Mesh(new T.TorusGeometry(r, r * 0.06, 8, 40), rim);
  ring.position.z = 0.04;
  g.add(ring);
  const ticks = new T.InstancedMesh(new T.BoxGeometry(r * 0.03, r * 0.12, 0.02), hands, 12);
  const m = new T.Matrix4(), q = new T.Quaternion(), ax = new T.Vector3(0, 0, 1);
  for (let t = 0; t < 12; t++) {
    const a = (t * PI) / 6;
    q.setFromAxisAngle(ax, -a);
    m.compose(v(Math.sin(a) * r * 0.86, Math.cos(a) * r * 0.86, 0.05), q, v(1, t % 3 === 0 ? 1.8 : 1, 1));
    ticks.setMatrixAt(t, m);
  }
  g.add(ticks);
  const hand = (len: number, w: number) => {
    const p = new T.Group();
    const h = new T.Mesh(new T.BoxGeometry(w, len, 0.02), hands);
    h.position.y = len * 0.4;
    p.add(h);
    p.position.z = 0.07;
    g.add(p);
    return p;
  };
  const hr = hand(r * 0.55, r * 0.05), mn = hand(r * 0.82, r * 0.035), sec = hand(r * 0.86, r * 0.012);
  const h0 = Number(k.o && k.o.hour), hour = Number.isFinite(h0) ? h0 : 12;
  const set = (t: number) => {
    hr.rotation.z = -((hour % 12) / 12) * 2 * PI - (t / 43200) * 2 * PI;
    mn.rotation.z = -(hour % 1) * 2 * PI - (t / 3600) * 2 * PI;
    sec.rotation.z = -(Math.floor(t) % 60 / 60) * 2 * PI;
  };
  set(0);
  k.add(g);
  if (!ctx.reduced) k.ticks.push((t) => set(t));
  return g;
}

/* Steam: one instanced cloud of crossed soft planes rising, spreading and fading from a point. */
function plume(k: Kit, ctx: RoomCtx, x: number, y: number, z: number, p: { n?: number; rise?: number; size?: number; speed?: number; seed?: number; drift?: number; opacity?: number } = {}) {
  const { n = 18, rise = 6, size = 1.2, speed = 0.22, seed = 1, drift = 0.6, opacity = 0.42 } = p;
  const g = mergeGeometries([new T.PlaneGeometry(1, 1), new T.PlaneGeometry(1, 1).rotateY(PI / 2)])!;
  const m = new T.MeshBasicMaterial({ map: X.pool(), color: 0xffffff, transparent: true, opacity, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
  const inst = new T.InstancedMesh(g, m, n);
  const rnd = X.mulberry(seed),
    ph = Array.from({ length: n }, () => rnd()),
    sx = Array.from({ length: n }, () => (rnd() - 0.5) * 2),
    sz = Array.from({ length: n }, () => (rnd() - 0.5) * 2);
  const mat = new T.Matrix4(), q = new T.Quaternion(), c = new T.Color();
  const place = (t: number) => {
    for (let i = 0; i < n; i++) {
      const u = (t * speed + ph[i]) % 1;
      const s = size * (0.5 + u * 2.2), fade = Math.min(1, u * 6) * (1 - u);
      mat.compose(v(x + sx[i] * drift * u * 2 + Math.sin(t + i) * 0.15, y + u * rise, z + sz[i] * drift * u * 2), q, v(s, s, s));
      inst.setMatrixAt(i, mat);
      inst.setColorAt(i, c.setScalar(fade));
    }
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  };
  place(0.4);
  k.add(inst);
  if (!ctx.reduced) k.ticks.push((t) => place(t));
  return inst;
}

/* A mount that faces its own viewing point. */
function facing(x: number, y: number, z: number, tx: number, tz: number, w: number, h: number, style: Mount['style'], wash = true): Mount {
  return { position: v(x, y, z), target: v(tx, 2.3, tz), rotation: Math.atan2(tx - x, tz - z), width: w, height: h, style, wash };
}

/* ---------------- 112 THE PNEUMATIC MAIL ---------------- */
export const pneumatic: RoomDef = {
  id: 'pneumatic',
  name: 'Letters through the void',
  area: 'THE PNEUMATIC TUBE MAIL, 1897 TO 1953',
  mood: 'Every letter in the city at thirty miles an hour',
  color: '#be854c',
  description: 'A brick sorting rotunda under a copper dome and a skylight, the cast iron tubes converging overhead with brass collars, capsules sliding through, sorting desks and mail sacks below. Portraits become letters to the city.',
  signatures: 'The circular brick rotunda and copper dome with an oculus, ten glass and iron tubes converging on a brass hub, brass capsule collars, radial oak sorting desks with canvas sacks, the departures board, the four faced station clock, a porch on the avenue.',
  build(k, ctx) {
    k.sky({ top: 0x6f9fd4, horizon: 0xe4e6e2, ground: 0x5a5a56, fog: 0.0028, sun: { az: 0.6, el: 0.9, color: 0xfff1d8, size: 14 }, env: 0.85 });
    k.hemi(0xfff0dc, 0x4a4238, 0.85);
    k.sun(0xfff0d4, 2.2, 8, 60, 6, true, 40);
    const R = 15, H = 8;
    const brick = k.pbr('pnBrick', X.brick(0x7a4c3a, 41), 0.28, { side: T.DoubleSide }),
      brickD = k.pbr('pnBrickD', X.brick(0x5c3a30, 42), 0.28),
      stone = k.pbr('pnStone', X.ashlar(0xb9ad97, 43, 3), 0.22),
      plaster = k.pbr('pnDome', X.plaster(0xe8e2d4, 44), 0.4, { side: T.BackSide }),
      copper = k.pbr('pnCopper', X.patina(0x5f9a8c), 0.5, { metalness: 0.4, roughness: 0.55 }),
      floorT = k.pbr('pnFloor', X.terrazzo(0xc9b8a2, 45), 0.35, { roughness: 0.35 }),
      oak = k.pbr('pnOak', X.planks(0x6a4a30, 5, 46), 1.2, { roughness: 0.55 }),
      brass = k.pbr('pnBrass', X.gilt(0xc9a55a), 2, { metalness: 0.85, roughness: 0.3 }),
      iron = k.flat(0x2a2e33, 0.7, 0.45),
      canvas = k.flat(0xb9a98a, 0, 0.95),
      paper = k.flat(0xefe9dc, 0, 0.9),
      tubeGlass = k.glass(0xbfd9e2, 0.35, 0.1),
      dark = k.flat(0x14161a, 0.3, 0.7),
      capsule = k.flat(0xd8b46a, 0.85, 0.3),
      shade = k.flat(0x1f5a3a, 0.3, 0.5),
      glowW = k.glow(0xfff0c8),
      pav = k.pbr('xwWalk', X.pavers(0x8e8b84, 5), 0.42);
    // the ground, the avenue and the neighbours: a station on the avenue with its own porch
    k.box(220, 0.3, 200, 0, -0.17, 20, pav);
    avenue(k, R + 15);
    frontage(k, { z: R + 28, count: 7, seed: 71, h: [14, 24], signs: ['POSTAL TELEGRAPH', 'CIGARS', '', 'LUNCH', '', 'STATIONERY', ''] });
    for (const x of [-16, 16]) k.lamp(x, R + 6.5, 5.5, iron, 0xffd9a8, 26);
    k.prop('mailbox', 6.5, 0, R + 6, { height: 1.5, rotY: PI, keepOut: 0.6 });
    k.prop('hydrant', -8, 0, R + 6.5, { height: 1.1, keepOut: 0.5 });
    // the drum: one brick cylinder with a gap for the door, a stone base and a cornice, blocks around the ring
    const gap = 0.16;
    k.mesh(new T.CylinderGeometry(R, R, H, 64, 1, true, gap, 2 * PI - 2 * gap), brick, 0, H / 2, 0);
    k.mesh(new T.CylinderGeometry(R + 0.35, R + 0.35, 1.2, 64, 1, true, gap, 2 * PI - 2 * gap), stone, 0, 0.6, 0);
    k.torus(R + 0.25, 0.45, 0, H, 0, stone, 64).rotation.x = PI / 2;
    k.mesh(new T.CylinderGeometry(R + 0.3, R + 0.3, 1.0, 64, 1, true), brickD, 0, H + 0.9, 0);
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * 2 * PI;
      if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.21) continue;
      const cx = Math.sin(a) * R, cz = Math.cos(a) * R;
      k.block(cx - 1.0, cx + 1.0, cz - 1.0, cz + 1.0);
    }
    k.cyl(R, 0.3, 0, -0.15, 0, floorT, R, 64);
    // the dome: plaster inside, copper outside, open at the oculus so the real sky comes through
    const oc = 0.24;
    const inner = k.mesh(new T.SphereGeometry(R, 48, 20, 0, 2 * PI, oc, PI / 2 - oc), plaster, 0, H, 0);
    inner.scale.set(1, 0.58, 1);
    const outer = k.mesh(new T.SphereGeometry(R + 0.4, 48, 20, 0, 2 * PI, oc, PI / 2 - oc), copper, 0, H, 0);
    outer.scale.set(1, 0.58, 1);
    const oy = H + 0.58 * R * Math.cos(oc), or = R * Math.sin(oc);
    k.torus(or, 0.22, 0, oy, 0, brass, 48).rotation.x = PI / 2;
    k.cyl(or, 0.08, 0, oy + 0.2, 0, tubeGlass, or, 40);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * 2 * PI, pts: T.Vector3[] = [];
      for (let j = 0; j <= 8; j++) { const th = oc + (PI / 2 - oc) * (j / 8); pts.push(v(Math.sin(th) * Math.cos(a) * (R - 0.25), H + 0.58 * Math.cos(th) * (R - 0.25), Math.sin(th) * Math.sin(a) * (R - 0.25))); }
      k.curve(pts, 0.14, copper, 16);
    }
    // the hub: a brass drum under the oculus, the drop tube down to the round sorting table at the centre
    k.cyl(3, 1.6, 0, 10.6, 0, brass, 3, 32);
    k.torus(3.05, 0.1, 0, 9.85, 0, iron, 32).rotation.x = PI / 2;
    k.torus(3.05, 0.1, 0, 11.35, 0, iron, 32).rotation.x = PI / 2;
    k.cyl(0.26, 8.6, 0, 5.5, 0, tubeGlass, 0.26, 16);
    for (const y of [2.2, 4.6, 7.0, 9.4]) k.torus(0.3, 0.06, 0, y, 0, brass, 16).rotation.x = PI / 2;
    k.cyl(2.3, 0.9, 0, 0.45, 0, oak, 2.3, 32);
    k.cyl(2.4, 0.08, 0, 0.94, 0, brass, 2.4, 32);
    k.keepOut.push({ x: 0, z: 0, r: 2.9 });
    for (let i = 0; i < 24; i++) { const a = (i / 24) * 2 * PI; k.box(0.5, 0.02, 0.36, Math.sin(a) * 1.7, 0.99, Math.cos(a) * 1.7, paper).rotation.y = a + (i % 3) * 0.2; }
    k.point(0, 9.4, 0, 0xffe6c0, 90, 30);
    for (let i = 0; i < 4; i++) { const a = (i + 0.5) * PI / 2, x = Math.sin(a) * 9, z = Math.cos(a) * 9; k.beam(v(x, 7.2, z), v(x, 12.4, z), 0.02, iron, 4); k.cyl(0.36, 0.28, x, 7.1, z, shade, 0.14, 14); k.cyl(0.14, 0.02, x, 6.98, z, glowW, 0.14, 10); k.point(x, 6.7, z, 0xffe6c0, 30, 16); }
    // ten sorting bays, none at the door and none at the departures board: desk, pigeonholes, lamp, sacks, the tube collar
    const bays = Array.from({ length: 10 }, (_, i) => ((i + 0.5) / 5) * PI);
    const collarG = new T.TorusGeometry(0.3, 0.06, 6, 16), collars: T.Matrix4[] = [];
    const cq = new T.Quaternion(), cz = new T.Vector3(0, 0, 1), cm = new T.Matrix4();
    const capG = new T.CapsuleGeometry(0.18, 0.42, 3, 10);
    capG.rotateX(PI / 2);
    bays.forEach((a, i) => {
      const sx = Math.sin(a), sz = Math.cos(a), rot = a;
      const at = (r: number) => [sx * r, sz * r] as const;
      let [x, z] = at(R - 1.1);
      k.box(3.6, 0.9, 0.9, x, 0.45, z, oak).rotation.y = rot;
      k.box(3.7, 0.06, 1.0, x, 0.93, z, brass).rotation.y = rot;
      for (const s of [-1.1, 1.1]) { const bx = x + Math.cos(a) * s, bz = z - Math.sin(a) * s; k.block(bx - 0.8, bx + 0.8, bz - 0.8, bz + 0.8); }
      [x, z] = at(R - 0.45);
      k.box(3.6, 1.1, 0.4, x, 1.55, z, oak).rotation.y = rot;
      for (let c = 0; c < 6; c++) for (let r = 0; r < 3; r++) { const ox = -1.45 + c * 0.58, oy = 1.15 + r * 0.34; const px = x + Math.cos(a) * ox + sx * 0.22, pz = z - Math.sin(a) * ox + sz * 0.22; k.box(0.5, 0.28, 0.06, px, oy, pz, dark).rotation.y = rot; }
      [x, z] = at(R - 1.3);
      k.cyl(0.03, 0.55, x + Math.cos(a) * 1.4, 1.25, z - Math.sin(a) * 1.4, brass, 0.03, 6);
      k.cyl(0.25, 0.18, x + Math.cos(a) * 1.4, 1.55, z - Math.sin(a) * 1.4, shade, 0.12, 12);
      k.cyl(0.12, 0.02, x + Math.cos(a) * 1.4, 1.47, z - Math.sin(a) * 1.4, glowW, 0.12, 10);
      k.point(x, 2.4, z, 0xffe6b8, 12, 7);
      [x, z] = at(R - 2.6);
      for (const s of [-1.3, 1.3]) { const bx = x + Math.cos(a) * s, bz = z - Math.sin(a) * s; k.lathe([[0, 0], [0.34, 0], [0.38, 0.5], [0.3, 0.9], [0.14, 1.05], [0.1, 1.15], [0, 1.15]], bx, 0, bz, canvas, 12); k.keepOut.push({ x: bx, z: bz, r: 0.5 }); }
      // the tube: from a brass collar in the wall up and over to the hub, capsules riding inside
      const [wx, wz] = at(R - 0.2), [hx, hz] = at(3.1);
      const pts = [v(wx, 6.3, wz), v(sx * (R - 3), 7.4, sz * (R - 3)), v(sx * 9, 9.6, sz * 9), v(hx, 10.6, hz)];
      const curve = k.spline(pts);
      k.mesh(new T.TubeGeometry(curve, 40, 0.24, 8), tubeGlass);
      for (let j = 0; j <= 10; j++) { const u = j / 10; const p = curve.getPointAt(u), tn = curve.getTangentAt(u); cq.setFromUnitVectors(cz, tn); cm.compose(p, cq, v(1, 1, 1)); collars.push(cm.clone()); }
      k.torus(0.55, 0.12, wx, 6.3, wz, brass, 24).rotation.y = a;
      const cap = new T.Mesh(capG, capsule);
      k.add(cap);
      if (!ctx.reduced) k.rider(cap, curve, 2.2 + (i % 3) * 0.6, i * 3.1);
    });
    k.instances(collarG, brass, collars);
    const dropCap = new T.Mesh(capG, capsule);
    dropCap.rotation.x = PI / 2;
    k.add(dropCap);
    if (!ctx.reduced) { const drop = k.spline([v(0, 9.8, 0), v(0, 1.3, 0), v(0.001, 1.3, 0), v(0.001, 9.8, 0)], true); k.rider(dropCap, drop, 3.2, 0); }
    // the departures board and the letters to the city on the far wall, a station clock hanging from the hub
    k.sign('DEPARTURES    GRAND CENTRAL 4 MIN    CITY HALL 2 MIN    BROOKLYN GPO 11 MIN    HARLEM 9 MIN    TIMES SQUARE 5 MIN', 8.4, 0.9, 0, 6.6, -R + 0.62, '#0b0b0e', '#ffd27a', 44, 0, { border: true });
    k.box(8.8, 1.3, 0.2, 0, 6.6, -R + 0.5, dark);
    k.censusWall({ x: 0, y: 3.95, z: -R + 0.55, rotY: 0, cols: 11, rows: 5, tile: 0.56, gap: 0.05, start: ctx.wallStart(1200, 55), pieces: ctx.all, backing: oak });
    k.sign('"LETTERS TO THE CITY"', 4, 0.36, 0, 2.15, -R + 0.62, 'transparent', '#f2e6c8', 60, 0);
    k.beam(v(0, 9.8, -7), v(0, 7.2, -7), 0.05, brass, 6);
    for (const f of [0, PI]) clock(k, ctx, 0, 6.5, -7 + Math.cos(f) * 0.42, f, 0.55, paper, brass, dark);
    k.box(1.3, 1.4, 0.8, 0, 6.5, -7, brass);
    // the inner ring: six oak letter racks facing the centre, the works on their faces
    const mounts: Mount[] = [];
    for (const a of [PI / 3, 2 * PI / 3, 4 * PI / 3, 5 * PI / 3]) {
      const x = Math.sin(a) * 7.5, z = Math.cos(a) * 7.5;
      k.box(3.2, 3.6, 0.5, x, 1.8, z, oak).rotation.y = a;
      k.box(3.4, 0.12, 0.7, x, 3.66, z, brass).rotation.y = a;
      k.block(x - 1.4, x + 1.4, z - 1.4, z + 1.4);
      for (let c = 0; c < 5; c++) for (let r = 0; r < 3; r++) { const ox = -1.2 + c * 0.6, oy = 1.0 + r * 0.42; k.box(0.5, 0.34, 0.06, x + Math.cos(a) * ox + Math.sin(a) * 0.27, oy, z - Math.sin(a) * ox + Math.cos(a) * 0.27, dark).rotation.y = a; }
      mounts.push(facing(x - Math.sin(a) * 0.3, 2.35, z - Math.cos(a) * 0.3, Math.sin(a) * 3.6, Math.cos(a) * 3.6, 2.8, 2.4, 'oak', false));
    }
    mounts.forEach((m) => { m.position.y = 3.65; m.height = 2.9; });
    // the works in the bays, over the pigeonholes, facing the floor of the rotunda
    for (const a of bays) mounts.push(facing(Math.sin(a) * (R - 0.42), 3.95, Math.cos(a) * (R - 0.42), Math.sin(a) * 10.5, Math.cos(a) * 10.5, 3.4, 2.7, 'black', true));
    // the porch on the avenue: brick piers, a stone header, the station name, two posters on the drum outside
    for (const s of [-1, 1]) { k.box(0.9, 5.2, 4.2, s * 2.9, 2.6, R + 1.6, brickD); k.block(s * 2.9 - 0.5, s * 2.9 + 0.5, R - 0.6, R + 3.7); }
    k.box(6.8, 1.6, 4.4, 0, 4.4, R + 1.6, stone);
    k.box(7.4, 0.5, 4.8, 0, 5.45, R + 1.6, stone);
    k.sign('PNEUMATIC MAIL   ·   STATION 4   ·   1897', 6.2, 0.7, 0, 4.4, R + 3.85, '#2a2420', '#f2e6c8', 70, 0, { border: true });
    k.sign('"SORTING"', 2.6, 0.4, 0, 5.9, R - 0.45, 'transparent', '#f2e6c8', 70, PI);
    k.point(0, 4.0, R + 2.2, 0xffe6c0, 24, 10);
    for (const s of [-1, 1]) { const a = s * 0.42; mounts.push(facing(Math.sin(a) * (R + 0.42), 3.8, Math.cos(a) * (R + 0.42), Math.sin(a) * (R + 5.5), Math.cos(a) * (R + 5.5), 3.2, 2.6, 'enamel', false)); }
    for (const s of [-1, 1]) mounts.push(facing(s * 2.42, 3.3, R + 1.6, -s * 1.0, R + 1.6, 2.4, 1.9, 'enamel', false));
    // sorters walking the ring, a clerk crossing to the table
    k.crowd(Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * 2 * PI; return v(Math.sin(a) * 11.2, 0, Math.cos(a) * 11.2); }), 12, { seed: 41, speed: 0.55, spread: 1.2, animate: !ctx.reduced, closed: true, colors: [0x2c3a5a, 0x24262c, 0x8a8478, 0x3a4a6a, 0xd8d0c0, 0x151517] });
    k.crowd([v(2, 0, 4.5), v(6, 0, 9), v(-4, 0, 9.5), v(-3.2, 0, 4)], 3, { seed: 42, speed: 0.5, spread: 0.6, animate: !ctx.reduced, colors: [0x2c3a5a, 0x24262c] });
    return { mounts, spawn: v(1.2, 2.3, R - 3.6), look: v(0.8, 3.6, -R + 2), eye: 2.3, bounds: [-R + 0.9, R - 0.9, -R + 0.9, R + 9.5], style: 'black' };
  },
};

/* ---------------- 113 THE CUTTING LOFT ---------------- */
export const garment: RoomDef = {
  id: 'garment',
  name: 'The pattern cathedral',
  area: 'SEVENTH AVENUE CUTTING LOFT, 1920S TO 1950S',
  mood: 'North light, the last fitting',
  color: '#baa9cc',
  description: 'A sawtooth roofed loft off Seventh Avenue: north light through industrial glazing on long cutting tables, bolt racks, dress forms, a Singer row, a freight elevator, a rack rolling the aisle. The New Yorkers hang on the brick piers and over the tables.',
  signatures: 'Six sawtooth bays of north facing glazing, cast iron columns on a maple floor, two rows of long cutting tables under hanging work panels, bolt racks by colour, the Singer row with bobbing needles, rolling garment racks, dress forms, the freight elevator gate, garment racks on the sidewalk outside.',
  build(k, ctx) {
    k.sky({ top: 0x7ea6d6, horizon: 0xe6e6e2, ground: 0x5e5a54, fog: 0.0028, sun: { az: 3.2, el: 0.75, color: 0xfff1d8, size: 14 }, env: 0.9 });
    k.hemi(0xfff2e0, 0x4a4238, 0.9);
    k.sun(0xfff4e6, 1.9, 6, 42, -70, true, 70);
    const W = 30, D = 52, FZ = 14, ZB = FZ - D;
    const brick = k.pbr('gmBrick', X.brick(0x8a5a44, 51), 0.28),
      brickD = k.pbr('gmBrickD', X.brick(0x5e3e34, 52), 0.28),
      maple = k.pbr('gmFloor', X.planks(0xb08a5a, 8, 53), 0.32, { roughness: 0.6 }),
      bone = k.pbr('gmRoof', X.plaster(0xe4dfd2, 54), 0.5, { side: T.DoubleSide }),
      oakT = k.pbr('gmOak', X.planks(0x7a5638, 4, 55), 1.4, { roughness: 0.5 }),
      steel = k.pbr('gmSteel', X.steel(0x4a525a, true, 56), 0.4, { metalness: 0.7, roughness: 0.45 }),
      iron = k.flat(0x22262b, 0.7, 0.45),
      ironG = k.flat(0x2e4a3a, 0.5, 0.5),
      glass = k.glass(0xdfeeff, 0.2, 0.06),
      linen = k.flat(0xe6dcc8, 0, 0.95),
      paper = k.flat(0xf1ecdf, 0, 0.9),
      black = k.flat(0x111214, 0.4, 0.5),
      chrome = k.flat(0xc9ccd0, 0.9, 0.25),
      red = k.glow(0xff4a3a),
      glowW = k.glow(0xfff1d0),
      pav = k.pbr('xwWalk', X.pavers(0x8e8b84, 5), 0.42);
    // the block: the sidewalk, Seventh Avenue and the lofts across the street
    k.box(220, 0.3, 200, 0, -0.17, 20, pav);
    avenue(k, FZ + 13);
    frontage(k, { z: FZ + 26, count: 7, seed: 81, h: [18, 30], signs: ['S. KLEIN   BETTER DRESSES', 'BUTTONS  ·  TRIM', 'PLEATING', '', 'FURS', 'ZIPPERS', 'MFG'] });
    for (const x of [-18, 18]) k.lamp(x, FZ + 6.5, 5.5, iron, 0xffd9a8, 26);
    k.prop('hydrant', -9, 0, FZ + 6.5, { height: 1.1, keepOut: 0.5 });
    // the shell: brick long walls, the far wall, the front wall with a real door and two shop windows, the maple floor
    k.box(W, 0.3, D, 0, -0.15, FZ - D / 2, maple);
    for (const s of [-1, 1]) {
      k.box(0.5, 3.0, D, s * W / 2, 1.5, FZ - D / 2, brick);
      k.box(0.5, 4.4, D, s * W / 2, 8.8, FZ - D / 2, brick);
      for (let i = 0; i <= 6; i++) k.box(0.5, 3.6, 4.3, s * W / 2, 4.8, FZ - i * (D / 6), brick);
      k.block(s * W / 2 - 0.5, s * W / 2 + 0.5, ZB - 0.5, FZ + 0.5);
    }
    k.box(W, 11, 0.5, 0, 5.5, ZB, brick);
    k.block(-W / 2, W / 2, ZB - 0.5, ZB + 0.5);
    glazedFront(k, { z: FZ, w: W, h: 11, door: 3.6, doorH: 3.4, win: [4.5, 10.5], winY: [1.0, 4.2], m: brick, glass, iron });
    for (const s of [-1, 1]) { const leaf = k.box(1.7, 3.2, 0.1, 0, 1.7, 0, oakT); leaf.rotation.y = s * 1.45; leaf.position.set(s * (1.8 + 0.85 * Math.cos(1.45)), 1.7, FZ - 0.35 - 0.85 * Math.sin(1.45)); }
    for (const s of [-1, 1]) { k.box(12, 16, 60, s * (W / 2 + 9), 8, FZ - D / 2, k.pbr('gmNeighbour', X.windows(59, 0.3, 0x5a4a40, true), 0.11, { emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.6, stretch: 0.42 })); }
    k.sign('MLOW & DAUGHTERS   ·   CUTTING   ·   7TH FLOOR', 7, 0.8, 0, 6.2, FZ + 0.32, '#1e1a18', '#f2e6c8', 72, 0, { border: true });
    k.sign('"FREIGHT"', 2.4, 0.4, 0, 4.2, ZB + 0.32, 'transparent', '#f2e6c8', 70, 0);
    // the sawtooth roof: six bays, each a sloped plaster soffit rising north and a vertical glazed face at the ridge
    const bay = D / 6, rise = 3, slope = Math.atan2(rise, bay), L = Math.hypot(bay, rise);
    const mull: T.Matrix4[] = [];
    for (let i = 0; i < 6; i++) {
      const zTop = FZ - i * bay, zBot = zTop - bay;
      const roof = k.box(W, 0.2, L, 0, 7 + rise / 2, (zTop + zBot) / 2, bone);
      roof.rotation.x = slope;
      k.box(W, rise + 0.2, 0.08, 0, 7 + rise / 2, zBot, glass);
      for (let x = -W / 2 + 1.5; x < W / 2; x += 1.5) mull.push(new T.Matrix4().makeTranslation(x, 7 + rise / 2, zBot));
      k.box(W, 0.12, 0.12, 0, 7 + rise / 2, zBot, iron);
      k.box(W, 0.3, 0.3, 0, 7, zBot, steel);
      for (const s of [-1, 1]) k.beam(v(s * 8.5, 6.9, zBot), v(s * 8.5, 7 + rise, zBot - 0.05), 0.08, steel, 6);
    }
    k.instances(new T.BoxGeometry(0.08, rise + 0.2, 0.12), iron, mull);
    // cast iron columns in the side aisles, the brick piers between the windows, the industrial windows
    for (const s of [-1, 1]) for (let i = 1; i < 6; i++) {
      const z = FZ - i * bay;
      k.column(s * 8.5, 0, z, 7, 0.22, ironG, false);
      k.keepOut.push({ x: s * 8.5, z, r: 0.5 });
      k.box(0.3, 7, 1.0, s * (W / 2 - 0.35), 3.5, z, brickD);
    }
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) {
      const z = FZ - (i + 0.5) * bay;
      k.box(0.08, 3.6, 4.4, s * W / 2, 4.8, z, glass);
      for (const dz of [-1.5, 0, 1.5]) k.box(0.6, 3.6, 0.1, s * W / 2, 4.8, z + dz, iron);
      for (const dy of [-1.2, 0, 1.2]) k.box(0.6, 0.1, 4.4, s * W / 2, 4.8 + dy, z, iron);
    }
    // the cutting tables: two rows, paper, bolts and patterns on top, work panels hanging over them
    const tables: [number, number][] = [[-5.5, -9], [5.5, -9], [-5.5, -27], [5.5, -27]];
    const boltG = new T.CylinderGeometry(0.14, 0.14, 1.3, 10);
    boltG.rotateZ(PI / 2);
    const boltColors = [0x8a2a2a, 0x2a3a6a, 0x3a5a3a, 0xd8c8a0, 0x6a2a5a, 0x1a1a1c, 0xc9a25a, 0x2b5f6e, 0x9a6a3a, 0xe6e2da, 0x4a4a8a, 0xb0304a];
    const bolts: T.Matrix4[] = [], boltCol: number[] = [];
    const rnd = X.mulberry(57);
    const mounts: Mount[] = [];
    tables.forEach(([x, z], i) => {
      k.box(3, 0.08, 14, x, 0.9, z, oakT);
      k.box(2.8, 0.82, 13.6, x, 0.45, z, oakT);
      k.block(x - 1.6, x + 1.6, z - 7.2, z + 7.2);
      k.box(1.6, 0.02, 12, x + 0.3, 0.95, z, paper);
      for (let j = 0; j < 5; j++) { bolts.push(new T.Matrix4().makeTranslation(x - 0.9 + (j % 2) * 0.3, 1.08, z - 5 + j * 2.4)); boltCol.push(boltColors[Math.floor(rnd() * boltColors.length)]); }
      k.cyl(0.18, 2.2, x + 1.1, 1.1, z - 6.4, paper, 0.18, 10).rotation.z = PI / 2;
      // the hanging panel: a linen faced board on two rods, a work on each face
      k.box(4.6, 2.9, 0.16, x, 3.6, z, oakT);
      for (const dz of [-1.8, 1.8]) k.beam(v(x, 5.05, z + dz), v(x, 7, z + dz), 0.03, iron, 5);
      const inner = x < 0 ? 1 : -1;
      mounts.push(facing(x + inner * 0.1, 3.6, z, x + inner * 4.3, z, 3.6, 2.5, 'oak', false));
      mounts.push(facing(x - inner * 0.1, 3.6, z, x - inner * 5.2, z, 3.6, 2.5, 'oak', false));
      void i;
    });
    const boltInst = k.instances(boltG, k.flat(0xffffff, 0, 0.9), bolts);
    const cc = new T.Color();
    boltCol.forEach((c, i) => boltInst.setColorAt(i, cc.set(c)));
    // the bolt racks on the west wall: shelves by colour
    const rackBolts: T.Matrix4[] = [], rackCol: number[] = [];
    for (let s = 0; s < 2; s++) {
      const z0 = -4 - s * 20;
      for (const y of [0.4, 1.1, 1.8]) k.box(0.9, 0.06, 12, -13.9, y, z0 - 6, oakT);
      for (const dz of [0, 6, 12]) k.box(0.9, 2.2, 0.08, -13.9, 1.1, z0 - dz, oakT);
      k.block(-14.5, -13.4, z0 - 12.2, z0 + 0.2);
      for (const y of [0.55, 1.25, 1.95]) for (let j = 0; j < 30; j++) { rackBolts.push(new T.Matrix4().makeTranslation(-13.9, y, z0 - 0.3 - j * 0.39)); rackCol.push(boltColors[Math.floor(rnd() * boltColors.length)]); }
    }
    const rackInst = k.instances(boltG, k.flat(0xffffff, 0, 0.9), rackBolts);
    rackCol.forEach((c, i) => rackInst.setColorAt(i, cc.set(c)));
    // the Singer row on the east wall: a bench, eight machine heads, the needle bars bobbing
    k.box(0.9, 0.06, 20, 12.9, 0.78, -19, oakT);
    for (const z of [-9.5, -19, -28.5]) for (const dx of [-0.35, 0.35]) k.box(0.06, 0.76, 0.06, 12.9 + dx, 0.39, z, iron);
    k.block(12.3, 13.5, -29.2, -8.8);
    const needles: T.Matrix4[] = [];
    for (let i = 0; i < 8; i++) {
      const z = -10.5 + i * 2.4;
      k.box(0.18, 0.12, 0.5, 12.9, 0.87, z, black);
      k.box(0.14, 0.14, 0.42, 12.9, 1.13, z, black);
      k.box(0.14, 0.32, 0.14, 12.9, 0.97, z + 0.16, black);
      k.cyl(0.14, 0.03, 12.9, 1.02, z - 0.28, chrome, 0.14, 14).rotation.x = PI / 2;
      k.cyl(0.2, 0.2, 12.3, 0.55, z, oakT, 0.2, 10);
      k.keepOut.push({ x: 12.3, z, r: 0.4 });
      needles.push(new T.Matrix4().makeTranslation(12.9, 1.02, z + 0.16));
    }
    const needleInst = k.instances(new T.CylinderGeometry(0.012, 0.012, 0.22, 5), chrome, needles);
    if (!ctx.reduced) { const nm = new T.Matrix4(); k.ticks.push((t) => { for (let i = 0; i < 8; i++) { nm.makeTranslation(12.9, 1.0 + 0.05 * Math.sin(t * 14 + i * 1.7), -10.5 + i * 2.4 + 0.16); needleInst.setMatrixAt(i, nm); } needleInst.instanceMatrix.needsUpdate = true; }); }
    // dress forms about the floor, a rack parked by the door, one rolling the aisle, one on the sidewalk
    const form = (x: number, z: number) => {
      k.lathe([[0, 0.9], [0.05, 0.9], [0.05, 1.0], [0.17, 1.02], [0.21, 1.22], [0.23, 1.4], [0.19, 1.56], [0.21, 1.7], [0.17, 1.84], [0.07, 1.9], [0, 1.9]], x, 0, z, linen, 16);
      for (let j = 0; j < 3; j++) { const a = (j / 3) * 2 * PI; k.beam(v(x, 0.9, z), v(x + Math.cos(a) * 0.32, 0, z + Math.sin(a) * 0.32), 0.015, iron, 5); }
      k.keepOut.push({ x, z, r: 0.5 });
    };
    for (const [x, z] of [[-10.5, 1], [10.5, 0], [-10.5, -17.5], [10.5, -35], [-2.2, -35.5], [2.6, 2]]) form(x, z);
    const garmentG = new T.BoxGeometry(0.46, 1.1, 0.05);
    garmentG.translate(0, -0.6, 0);
    const rack = (n: number) => {
      const g = new T.Group();
      const mk = (geo: T.BufferGeometry, m: T.Material, x: number, y: number, z: number) => { const o = new T.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; };
      mk(new T.CylinderGeometry(0.025, 0.025, 1.8, 8).rotateZ(PI / 2), chrome, 0, 1.75, 0);
      for (const s of [-0.85, 0.85]) { mk(new T.CylinderGeometry(0.025, 0.025, 1.75, 8), chrome, s, 0.9, 0); mk(new T.BoxGeometry(0.06, 0.06, 0.7), chrome, s, 0.06, 0); }
      const inst = new T.InstancedMesh(garmentG, k.flat(0xffffff, 0, 0.9), n);
      for (let i = 0; i < n; i++) { inst.setMatrixAt(i, new T.Matrix4().makeTranslation(-0.7 + (i / (n - 1)) * 1.4, 1.72, 0)); inst.setColorAt(i, cc.set(boltColors[Math.floor(rnd() * boltColors.length)])); }
      g.add(inst);
      k.add(g);
      return g;
    };
    rack(12).position.set(8, 0, 6);
    k.keepOut.push({ x: 8, z: 6, r: 1.1 });
    const roller = rack(14);
    const outside = rack(14);
    if (!ctx.reduced) {
      k.rider(roller, k.spline([v(0, 0, 4), v(0, 0, -35.5), v(4, 0, -37), v(10, 0, -36), v(10, 0, 5), v(4, 0, 7)], true), 0.9, 20);
      k.rider(outside, k.spline([v(-45, 0, FZ + 3.2), v(45, 0, FZ + 3.2), v(45, 0, FZ + 22.5), v(-45, 0, FZ + 22.5)], true), 1.2, 40);
    } else { roller.position.set(0, 0, -20); outside.position.set(10, 0, FZ + 3.2); }
    // the freight elevator on the far wall: a steel gate in a recess, its warning bulb
    k.box(4.4, 3.8, 0.1, 0, 1.9, ZB + 0.3, steel);
    for (let i = -1.9; i <= 1.9; i += 0.38) k.box(0.05, 3.6, 0.06, i, 1.8, ZB + 0.38, iron);
    for (const s of [-1, 1]) k.box(0.6, 3.8, 0.7, s * 2.5, 1.9, ZB + 0.3, brickD);
    k.box(5.6, 0.6, 0.7, 0, 3.9, ZB + 0.3, brickD);
    const bulb = k.sphere(0.12, 0, 4.55, ZB + 0.55, red, 10);
    if (!ctx.reduced) k.ticks.push((t) => { bulb.visible = Math.sin(t * 4) > -0.2; });
    k.point(0, 4.3, ZB + 1.2, 0xff6a5a, 10, 6);
    // ceiling fans, pendant lamps down both aisles and warm light at the tables
    for (const z of [-8, -20, -32]) {
      const blades = mergeGeometries(Array.from({ length: 4 }, (_, b) => new T.BoxGeometry(1.5, 0.04, 0.32).translate(0.85, 0, 0).rotateY((b * PI) / 2)))!;
      const fan = new T.Mesh(blades, k.flat(0x3a2a20, 0.2, 0.7));
      fan.position.set(0, 6.3, z);
      k.add(fan);
      k.cyl(0.14, 0.7, 0, 6.65, z, iron, 0.06, 10);
      if (!ctx.reduced) k.ticks.push((t) => { fan.rotation.y = t * 2.6; });
    }
    const shades: T.Matrix4[] = [], bulbs: T.Matrix4[] = [];
    for (const x of [-10.5, 10.5]) for (let i = 0; i < 6; i++) { const z = FZ - (i + 0.5) * bay; shades.push(new T.Matrix4().makeTranslation(x, 4.6, z)); bulbs.push(new T.Matrix4().makeTranslation(x, 4.45, z)); k.beam(v(x, 4.6, z), v(x, 7, z), 0.015, iron, 4); if (i % 2 === 0) k.point(x, 4.3, z, 0xffe6c0, 22, 13); }
    k.instances(new T.ConeGeometry(0.34, 0.26, 14, 1, true), ironG, shades);
    k.instances(new T.SphereGeometry(0.07, 8, 6), glowW, bulbs);
    for (const z of [-9, -27]) k.point(0, 5.5, z, 0xfff0d8, 26, 16);
    // cutters and finishers moving between the tables
    k.crowd([v(0, 0, 3), v(0, 0, -17), v(-9.5, 0, -18.5), v(-9.5, 0, -2), v(9.5, 0, -2), v(9.5, 0, -20), v(0, 0, -19), v(0, 0, -36)], 12, { seed: 58, speed: 0.6, spread: 1.4, animate: !ctx.reduced, colors: [0x24262c, 0x8a3a3a, 0x33477f, 0xd8d0c0, 0xe6e2da, 0x151517, 0x6a4a8a] });
    // the works on the brick piers between the windows, the front wall and the far wall
    for (const s of [-1, 1]) for (let i = 1; i < 6; i++) { const z = FZ - i * bay; mounts.push(facing(s * (W / 2 - 0.55), 3.8, z, s * (W / 2 - 5.5), z, 3.6, 2.7, 'black', false)); }
    for (const s of [-1, 1]) mounts.push(facing(s * 7.5, 7.4, FZ - 0.32, s * 7.5, FZ - 7, 4.8, 2.7, 'black', false));
    for (const s of [-1, 1]) mounts.push(facing(s * 8, 4.2, ZB + 0.32, s * 8, ZB + 7, 4.8, 3.2, 'black', false));
    return { mounts, spawn: v(0, 2.3, 10), look: v(0, 3.8, -36), eye: 2.3, bounds: [-13.6, 13.6, ZB + 0.9, FZ + 11], style: 'black' };
  },
};

/* ---------------- 114 THE DIAMOND EXCHANGE ---------------- */
export const diamond: RoomDef = {
  id: 'diamondexchange',
  name: 'Forty-seven facets',
  area: 'WEST 47TH STREET, THE DIAMOND DISTRICT',
  mood: 'Midnight appraisal',
  color: '#a6d7e7',
  daylit: false,
  description: 'An exchange floor off West 47th Street: dealer booths under green glass shades, loupes and scales, chandeliers turning, jewel niches with lit velvet, a vault standing open on a wall of safe deposit boxes. The New Yorkers hang in gilt, like gems.',
  signatures: 'Two aisles of dealer booths with banker\'s lamps and glass cases, the central spine of booths back to back, arched jewel niches in red velvet along both walls, two crystal chandeliers turning, walnut panelling and a coffered ceiling, the round vault door open on the safe deposit wall, the lit street of DIAMONDS signs outside.',
  build(k, ctx) {
    k.sky({ top: 0x090d1a, horizon: 0x2a2436, ground: 0x0a0a0e, fog: 0.004, stars: 220, env: 0.4 });
    k.hemi(0xdfe4ff, 0x1a1418, 0.62);
    k.sun(0xb8c6ff, 0.5, -30, 50, 20, false, 60);
    const W = 26, D = 44, FZ = 10, ZB = FZ - D, H = 6.6;
    const walnut = k.pbr('dxWalnut', X.planks(0x3e2618, 5, 61), 1.2, { roughness: 0.45 }),
      cream = k.pbr('dxCream', X.plaster(0xe8dcc8, 62), 0.4),
      carpet = k.pbr('dxCarpet', X.carpet(0x1e3a2e, 0xc79a4a), 0.5),
      velvet = k.pbr('dxVelvet', X.velvet(0x8a1a22), 0.4, { roughness: 0.95 }),
      velvetK = k.pbr('dxVelvetK', X.velvet(0x141418), 0.4, { roughness: 0.95 }),
      brass = k.pbr('dxBrass', X.gilt(0xc9a55a), 2, { metalness: 0.85, roughness: 0.3 }),
      steel = k.pbr('dxSteel', X.steel(0x8a9098, true, 63), 0.3, { metalness: 0.9, roughness: 0.3 }),
      stone = k.pbr('dxStone', X.ashlar(0xb0a898, 64, 3), 0.22),
      dark = k.flat(0x121216, 0.5, 0.7),
      glass = k.glass(0xdcecf2, 0.16, 0.05),
      chrome = k.flat(0xc9ccd0, 0.9, 0.25),
      leather = k.flat(0x2a1a14, 0.1, 0.7),
      stoneW = k.glow(0xffffff),
      shadeGlow = new T.MeshBasicMaterial({ color: 0xcfffd0 }),
      crystal = k.flat(0xf4f8ff, 0.2, 0.05, { transparent: true, opacity: 0.85 }),
      warm = k.glow(0xffe6b8),
      white = k.glow(0xf6f6ff),
      pav = k.pbr('xwWalk', X.pavers(0x8e8b84, 5), 0.42);
    // 47th Street after dark: the lit block across the way, the lamps, the exchange front
    k.box(220, 0.3, 200, 0, -0.17, 20, pav);
    avenue(k, FZ + 13, 130, 14);
    frontage(k, { z: FZ + 25, count: 7, seed: 91, h: [14, 22], night: true, signs: ['DIAMONDS', 'WE BUY GOLD', 'JEWELRY EXCHANGE', 'LOUPES  ·  SCALES', 'DIAMONDS', 'WATCHES', 'APPRAISALS'] });
    for (const x of [-20, -7, 7, 20]) k.lamp(x, FZ + 6.5, 5.5, dark, 0xfff4e0, 34);
    k.box(W + 2, 16, 12, 0, 8, FZ - 5.5, stone);
    for (let y = 9; y < 15; y += 2.7) for (let x = -10; x <= 10; x += 4) { k.box(1.35, 1.9, 0.2, x, y, FZ + 0.66, cream); k.box(1.1, 1.65, 0.05, x, y, FZ + 0.78, warm); }
    k.sign('DIAMOND EXCHANGE', 12, 1.3, 0, 7.4, FZ + 0.82, '#0b0b10', '#f6f6ff', 150, 0, { border: true });
    k.box(12.4, 0.06, 0.06, 0, 6.6, FZ + 0.86, white);
    k.box(12.4, 0.06, 0.06, 0, 8.2, FZ + 0.86, white);
    for (const x of [-4, 0, 4]) k.point(x, 7.2, FZ + 2.4, 0xf6f6ff, 20, 10);
    for (const s of [-1, 1]) { k.box(7, 3, 0.1, s * 8, 2.3, FZ + 0.72, glass); k.box(6.6, 0.9, 1.2, s * 8, 1.3, FZ + 0.2, velvetK); for (let j = 0; j < 5; j++) k.sphere(0.08, s * 8 - 2.4 + j * 1.2, 1.85, FZ + 0.3, stoneW, 6); k.point(s * 8, 3.2, FZ + 0.6, 0xffffff, 14, 5); }
    // the shell: carpet, walnut dado, cream upper walls, the coffered ceiling, the front wall with the door
    k.box(W, 0.3, D, 0, -0.15, FZ - D / 2, carpet);
    for (const s of [-1, 1]) { k.box(0.5, H, D, s * W / 2, H / 2, FZ - D / 2, cream); k.box(0.2, 2.4, D, s * (W / 2 - 0.3), 1.2, FZ - D / 2, walnut); k.block(s * W / 2 - 0.6, s * W / 2 + 0.6, ZB - 0.5, FZ + 0.5); }
    frontWall(k, { z: FZ, w: W, h: H, door: 3.6, doorH: 3.2, m: cream });
    k.box(W, 1.2, 0.2, 0, 0.6, FZ - 0.3, walnut);
    k.box(W, 0.4, D, 0, H + 0.2, FZ - D / 2, cream);
    for (let z = FZ - 2; z > ZB; z -= 4) k.box(W, 0.4, 0.3, 0, H - 0.2, z, walnut);
    for (const x of [-8.5, -4.25, 0, 4.25, 8.5]) k.box(0.3, 0.4, D, x, H - 0.2, FZ - D / 2, walnut);
    k.moulding([[0, 0], [0.3, 0], [0.34, 0.1], [0.2, 0.2], [0.26, 0.32], [0, 0.4]], D, W / 2 - 0.26, H - 0.5, FZ - D / 2, brass, PI);
    k.moulding([[0, 0], [0.3, 0], [0.34, 0.1], [0.2, 0.2], [0.26, 0.32], [0, 0.4]], D, -W / 2 + 0.26, H - 0.5, FZ - D / 2, brass, 0);
    // the booths: five a side against the walls, a spine of four a side back to back down the middle
    const stones: T.Matrix4[] = [];
    const booth = (x: number, z: number, face: 1 | -1, len: number) => {
      k.box(1.0, 0.9, len, x, 0.45, z, walnut);
      k.box(1.1, 0.06, len + 0.1, x, 0.93, z, brass);
      k.box(1.0, 0.5, len - 0.2, x, 1.21, z, glass);
      k.box(0.9, 0.06, len - 0.4, x, 0.99, z, velvetK);
      for (let j = 0; j < Math.floor(len * 2); j++) stones.push(new T.Matrix4().makeTranslation(x - 0.25 + (j % 3) * 0.25, 1.04, z - len / 2 + 0.4 + j * 0.5));
      const lx = x - face * 0.25, lz = z + len / 2 - 0.7;
      k.cyl(0.03, 0.42, lx, 1.17, lz, brass, 0.03, 6);
      k.cyl(0.08, 0.06, lx, 0.99, lz, brass, 0.12, 10);
      k.box(0.48, 0.14, 0.2, lx, 1.42, lz, k.flat(0x1f5a3a, 0.3, 0.4)).rotation.z = 0;
      const gl = k.box(0.46, 0.05, 0.18, lx, 1.34, lz, shadeGlow);
      void gl;
      const sx = x - face * 0.25, sz = z - len / 2 + 0.9;
      k.cyl(0.02, 0.5, sx, 1.21, sz, brass, 0.02, 6);
      k.box(0.5, 0.02, 0.02, sx, 1.46, sz, brass);
      for (const d of [-0.22, 0.22]) k.cyl(0.07, 0.015, sx + d, 1.3, sz, brass, 0.07, 10);
      k.cyl(0.05, 0.6, x + face * 0.95, 0.3, z, chrome, 0.05, 8);
      k.cyl(0.22, 0.1, x + face * 0.95, 0.65, z, leather, 0.22, 12);
      k.keepOut.push({ x: x + face * 0.95, z, r: 0.35 });
    };
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const z = 3 - i * 6.2; booth(s * 11.5, z, s < 0 ? 1 : -1, 5.4); }
    for (const s of [-1, 1]) { k.block(s > 0 ? 10.4 : -12.6, s > 0 ? 12.6 : -10.4, -31.2, 6.2); }
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = -8.5 - i * 5.8; booth(s * 1.7, z, s < 0 ? -1 : 1, 5.0); }
    k.box(0.5, 5.6, 22, 0, 2.8, -17, walnut);
    for (let z = -6.3; z >= -28; z -= 5.4) k.box(0.7, 5.6, 0.3, 0, 2.8, z, brass);
    k.box(0.9, 0.3, 22.4, 0, 5.6, -17, brass);
    k.block(-2.5, 2.5, -28.6, -5.4);
    k.instances(new T.SphereGeometry(0.03, 6, 5), stoneW, stones);
    // the jewel niches: arched recesses in red velvet over each wall booth, lit from inside, the works framed in gilt
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) {
      const z = 3 - i * 6.2, x = s * (W / 2 - 0.26);
      const a = k.arch(3.2, 3.8, 0.5, x, 2.0, z, walnut, false, 0.72);
      a.rotation.y = PI / 2;
      k.box(0.2, 3.5, 3.0, x + s * 0.25, 3.7, z, velvet);
      k.point(x - s * 0.9, 5.4, z, 0xffe0b0, 9, 4);
      mounts.push(facing(x - s * 0.06, 3.8, z, s * 7, z, 2.8, 2.5, 'gilt', true));
    }
    // the spine: gilt works back to back above the central booths, a pair at its ends facing the door and the vault
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = -8.5 - i * 5.8; mounts.push(facing(s * 0.32, 3.9, z, s * 6.5, z, 3.0, 2.7, 'gilt', true)); }
    mounts.push(facing(0, 3.9, -5.7, 0, 0, 2.2, 2.7, 'gilt', true));
    mounts.push(facing(0, 3.9, -28.3, 0, -32, 2.2, 2.7, 'gilt', true));
    for (const s of [-1, 1]) mounts.push(facing(s * 7.5, 3.9, FZ - 0.32, s * 7.5, FZ - 6, 3.6, 2.6, 'gilt', true));
    // the vault: the far wall, the round door swung open, the safe deposit wall carrying the census
    k.box(W, H, 0.6, 0, H / 2, ZB, cream);
    k.block(-W / 2, -2.6, ZB - 0.6, ZB + 0.6);
    k.block(2.6, W / 2, ZB - 0.6, ZB + 0.6);
    for (const s of [-1, 1]) { k.box(0.6, H, 6.6, s * 3.2, H / 2, ZB - 3.3, steel); k.block(s * 3.2 - 0.4, s * 3.2 + 0.4, ZB - 6.6, ZB); }
    k.box(7, 0.6, 7, 0, H - 0.3, ZB - 3.3, steel);
    k.box(7, 0.3, 7, 0, -0.15, ZB - 3.3, steel);
    k.box(6.2, H, 0.5, 0, H / 2, ZB - 6.6, steel);
    k.block(-3.5, 3.5, ZB - 7, ZB - 6.3);
    k.torus(2.5, 0.28, 0, 2.6, ZB, steel, 40).rotation.y = 0;
    const door = new T.Group();
    door.position.set(2.6, 2.6, ZB + 0.3);
    door.rotation.y = -1.15;
    const dm = (g: T.BufferGeometry, m: T.Material, x: number, y: number, z: number) => { const o = new T.Mesh(g, m); o.position.set(x, y, z); door.add(o); return o; };
    dm(new T.CylinderGeometry(2.3, 2.3, 0.6, 40).rotateX(PI / 2), steel, -2.4, 0, 0);
    const wheelParts: T.BufferGeometry[] = [new T.TorusGeometry(0.9, 0.07, 8, 32)];
    for (let j = 0; j < 6; j++) wheelParts.push(new T.CylinderGeometry(0.04, 0.04, 1.8, 6).rotateZ((j / 6) * PI));
    for (let j = 0; j < 12; j++) { const a = (j / 12) * 2 * PI; wheelParts.push(new T.CylinderGeometry(0.16, 0.16, 0.5, 8).rotateX(PI / 2).translate(Math.cos(a) * 2.05, Math.sin(a) * 2.05, -0.4)); }
    dm(mergeGeometries(wheelParts)!, chrome, -2.4, 0, 0.45);
    k.add(door);
    k.block(1.8, 5.2, ZB - 0.2, ZB + 3.2);
    k.censusWall({ x: 0, y: 3.1, z: ZB - 6.3, rotY: 0, cols: 10, rows: 8, tile: 0.5, gap: 0.06, start: ctx.wallStart(3300, 80), pieces: ctx.all, backing: steel });
    k.sign('"SAFE DEPOSIT"', 3, 0.36, 0, 5.75, ZB - 6.3, 'transparent', '#f2e6c8', 60, 0);
    k.point(0, 5.4, ZB - 3.3, 0xffffff, 26, 9);
    k.point(0, 5.4, ZB + 2.5, 0xffe6c0, 20, 10);
    // two chandeliers turning, the banker's lamps breathing, warm light down both aisles
    for (const cx of [-6.5, 6.5]) {
      const z = -15;
      const ch = new T.Group();
      ch.position.set(cx, 5.6, z);
      const rings = mergeGeometries([new T.TorusGeometry(1.4, 0.05, 6, 40).rotateX(PI / 2).translate(0, -0.5, 0), new T.TorusGeometry(1.0, 0.05, 6, 32).rotateX(PI / 2).translate(0, -0.9, 0), new T.TorusGeometry(0.6, 0.05, 6, 24).rotateX(PI / 2).translate(0, -1.25, 0)])!;
      ch.add(new T.Mesh(rings, brass));
      const drops: T.Matrix4[] = [];
      const cr = X.mulberry(65 + z);
      for (let j = 0; j < 140; j++) { const tier = j % 3, r = [1.4, 1.0, 0.6][tier], y = [-0.5, -0.9, -1.25][tier], a = cr() * 2 * PI; drops.push(new T.Matrix4().makeTranslation(Math.cos(a) * r, y - 0.1 - cr() * 0.5, Math.sin(a) * r)); }
      const di = new T.InstancedMesh(new T.OctahedronGeometry(0.06, 0), crystal, drops.length);
      drops.forEach((m, i) => di.setMatrixAt(i, m));
      ch.add(di);
      k.add(ch);
      k.cyl(0.03, 0.5, cx, 6.35, z, brass, 0.03, 6);
      k.point(cx, 4.6, z, 0xfff2d8, 40, 18);
      if (!ctx.reduced) k.ticks.push((t) => { ch.rotation.y = t * 0.12; });
    }
    if (!ctx.reduced) k.ticks.push((t) => { const f = 0.82 + 0.1 * Math.sin(t * 3.1) + 0.08 * Math.sin(t * 7.7 + 1); shadeGlow.color.setRGB(0.81 * f, 1.0 * f, 0.82 * f); });
    for (const s of [-1, 1]) for (const z of [-4, -14, -24, -32]) k.point(s * 6.5, 5.4, z, 0xffe6c0, 24, 14);
    k.point(0, 5, 4, 0xffe6c0, 22, 12);
    // dealers on the floor
    k.crowd([v(6.3, 0, 6), v(6.3, 0, -31), v(-6.3, 0, -31), v(-6.3, 0, 6)], 14, { seed: 66, speed: 0.55, spread: 2.0, animate: !ctx.reduced, closed: true, colors: [0x111113, 0x1a1a1f, 0x24262c, 0x2b2b35, 0x0d0d10, 0x3a3a42] });
    return { mounts, spawn: v(0, 2.3, 5.5), look: v(0, 3.4, -30), eye: 2.3, bounds: [-11.8, 11.8, ZB - 6.2, FZ + 11], style: 'gilt' };
  },
};

/* ---------------- 115 THE STEAM PLANT ---------------- */
export const steam: RoomDef = {
  id: 'steamworks',
  name: 'The city exhales',
  area: 'CON EDISON DISTRICT STEAM, SINCE 1882',
  mood: 'Pressure held',
  color: '#d18561',
  description: 'A cathedral scale boiler house on the East River: three riveted pressure vessels, a catwalk, valve wheels and gauges, steam leaking from the flanges, the orange and white stack through the high window. The New Yorkers hang on the boiler flanks and along the inspection wall.',
  signatures: 'Three riveted horizontal boilers with domed ends and steam drums, the raised catwalk with engineers on it, the long brick and steel inspection wall with caged bulbs, valve wheels and gauge dials, the firebox glow, instanced steam rising from the flanges, the banded stack and skyline through the end window, the shift board of time cards.',
  build(k, ctx) {
    k.sky({ top: 0x7aa2cf, horizon: 0xe0dfd8, ground: 0x4e4a46, fog: 0.0026, sun: { az: 3.9, el: 0.55, color: 0xfff0d8, size: 14 }, haze: 0.2, env: 0.8 });
    k.hemi(0xffeedd, 0x3a3230, 0.75);
    k.sun(0xfff0d8, 1.8, -50, 48, -30, true, 90);
    const W = 36, D = 70, FZ = 16, ZB = FZ - D, H = 20;
    const brick = k.pbr('stBrick', X.brick(0x5a3c32, 101), 0.28),
      steelR = k.pbr('stSteel', X.steel(0x4a4f56, true, 102), 0.4, { metalness: 0.75, roughness: 0.45 }),
      steelD = k.pbr('stSteelD', X.steel(0x2e3238, true, 103), 0.4, { metalness: 0.7, roughness: 0.5 }),
      boiler = k.pbr('stBoiler', X.steel(0x6b4a3c, true, 104), 0.5, { metalness: 0.65, roughness: 0.5 }),
      concrete = k.pbr('stFloor', X.concrete(0x8a8a84, 105), 0.35, { roughness: 0.8 }),
      grate = k.pbr('stGrate', X.steel(0x3a3e44, false, 106), 0.6, { metalness: 0.8, roughness: 0.5 }),
      iron = k.flat(0x22262b, 0.7, 0.45),
      brass = k.pbr('stBrass', X.gilt(0xc9a55a), 2, { metalness: 0.85, roughness: 0.3 }),
      red = k.flat(0x9a2a22, 0.4, 0.5),
      yellow = k.flat(0xe6a626, 0, 0.6),
      white = k.flat(0xf0efea, 0, 0.8),
      orange = k.flat(0xd8642a, 0, 0.7),
      glass = k.glass(0xdfeeff, 0.22, 0.06),
      dial = k.flat(0xf1ecdf, 0, 0.6),
      black = k.flat(0x111214, 0.4, 0.5),
      bulbGlow = new T.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.95 }),
      fire = new T.MeshBasicMaterial({ color: 0xff7a2a }),
      pav = k.pbr('xwWalk', X.pavers(0x8e8b84, 5), 0.42);
    // the block: the street, low warehouses across the way, the plant's own brick front and door
    k.box(220, 0.3, 220, 0, -0.17, 0, pav);
    avenue(k, FZ + 13, 130, 18);
    frontage(k, { z: FZ + 27, count: 7, seed: 111, h: [10, 16], signs: ['', 'MARINE SUPPLY', '', 'BOILER WORKS', '', 'TRUCKING', ''] });
    for (const x of [-22, 22]) k.lamp(x, FZ + 6.5, 5.5, iron, 0xffd9a8, 26);
    k.prop('utility_pole', 24, 0, FZ + 7, { height: 9, keepOut: 0.5 });
    // the shell: brick to six metres, riveted steel plate above, clerestories on both long walls, steel trusses
    k.box(W, 0.3, D, 0, -0.15, FZ - D / 2, concrete);
    for (const s of [-1, 1]) {
      k.box(0.6, 6, D, s * W / 2, 3, FZ - D / 2, brick);
      k.box(0.6, H - 6, D, s * W / 2, 6 + (H - 6) / 2, FZ - D / 2, steelD);
      k.block(s * W / 2 - 0.6, s * W / 2 + 0.6, ZB - 0.6, FZ + 0.6);
      for (let i = 0; i < 9; i++) { const z = FZ - (i + 0.5) * (D / 9); k.box(0.16, 5, 5.6, s * (W / 2 - 0.35), 13.5, z, glass); for (const dz of [-1.9, 0, 1.9]) k.box(0.2, 5, 0.1, s * (W / 2 - 0.35), 13.5, z + dz, iron); k.box(0.2, 0.1, 5.6, s * (W / 2 - 0.35), 13.5, z, iron); }
      for (let i = 0; i <= 9; i++) { const z = FZ - i * (D / 9); k.box(0.6, H, 0.8, s * (W / 2 - 0.5), H / 2, z, steelR); }
    }
    k.box(W, 0.4, D, 0, H + 0.2, FZ - D / 2, steelD);
    for (let i = 0; i <= 9; i++) { const z = FZ - i * (D / 9); k.box(W, 0.5, 0.5, 0, H - 0.4, z, steelR); for (let x = -W / 2 + 2; x < W / 2 - 2; x += 4) { k.bar(v(x, H - 0.6, z), v(x + 4, H - 2.4, z), 0.12, 0.12, steelR); k.bar(v(x, H - 2.4, z), v(x + 4, H - 0.6, z), 0.12, 0.12, steelR); } k.box(W, 0.3, 0.3, 0, H - 2.5, z, steelR); }
    frontWall(k, { z: FZ, w: W, h: H, door: 3.8, doorH: 4.2, m: brick });
    k.box(W, H - 6, 0.5, 0, 6 + (H - 6) / 2 + 0.01, FZ + 0.02, steelD);
    k.box(9, 6, 0.7, -10, 3, FZ, steelR);
    k.sign('CONSOLIDATED EDISON   ·   DISTRICT STEAM   ·   STATION 1882', 9, 0.9, 0, 5.4, FZ + 0.4, '#1a1c22', '#f2e6c8', 66, 0, { border: true });
    k.sign('"PRESSURE"', 2.6, 0.4, 0, 5.4, FZ - 0.32, 'transparent', '#f2e6c8', 70, PI);
    // the far wall: brick below, the great window above, the stack and the skyline beyond it
    k.box(W, 9, 0.6, 0, 4.5, ZB, brick);
    k.block(-W / 2, W / 2, ZB - 0.6, ZB + 0.6);
    for (const s of [-1, 1]) k.box((W - 22) / 2, H - 9, 0.6, s * (11 + (W - 22) / 4), 9 + (H - 9) / 2, ZB, steelD);
    k.box(22, 1.5, 0.6, 0, H - 0.75, ZB, steelD);
    k.box(22, 9.5, 0.14, 0, 13.75, ZB, glass);
    for (let x = -11; x <= 11; x += 2.2) k.box(0.14, 9.5, 0.24, x, 13.75, ZB, iron);
    for (let y = 9; y <= 19; y += 2.4) k.box(22, 0.14, 0.24, 0, y, ZB, iron);
    const bands = 6;
    for (let b = 0; b < bands; b++) k.cyl(3.2 - b * 0.12, 11, 0, ZB - 34 + 5.5 + b * 11, ZB - 40, b % 2 ? white : orange, 3.2 - (b + 1) * 0.12, 24);
    for (const s of [-1, 1]) k.cyl(2.2, 40, s * 9, ZB - 30, ZB - 44, brick, 2.2, 16);
    k.box(60, 22, 30, 0, 11, ZB - 44, brick);
    k.sphere(0.3, 0, ZB - 34 + 66.5, ZB - 40, k.glow(0xff3a2a), 8);
    plume(k, ctx, 0, ZB - 34 + 66, ZB - 40, { n: 26, rise: 30, size: 4, speed: 0.08, seed: 107, drift: 1.6, opacity: 0.5 });
    k.skyline({ z: ZB - 130, count: 26, spacing: 7, scale: 2.2, base: -4, seed: 108, lit: 0.3, x: 40 });
    k.water({ y: -0.6, color: 0x2a4d63, w: 400, d: 120, x: 0, z: ZB - 100, amp: 0.6 });
    // three boilers on the east side: riveted shells, domed ends, collars, steam drums, risers to the header, saddles
    const boilers = [-4, -22, -40];
    const wheelG = mergeGeometries([new T.TorusGeometry(0.5, 0.05, 6, 20), new T.BoxGeometry(0.06, 1.0, 0.06), new T.BoxGeometry(1.0, 0.06, 0.06), new T.BoxGeometry(0.06, 1.0, 0.06).rotateZ(PI / 4), new T.BoxGeometry(0.06, 1.0, 0.06).rotateZ(-PI / 4)])!;
    const wheels: T.Matrix4[] = [];
    const wq = new T.Quaternion();
    const gauges: T.Matrix4[] = [], needleBase: T.Vector3[] = [];
    const plumes: [number, number, number][] = [];
    for (const zc of boilers) {
      const shell = k.mesh(new T.CylinderGeometry(4.2, 4.2, 16, 36, 1, true).rotateX(PI / 2), boiler, 11, 5.2, zc);
      void shell;
      for (const e of [-8, 8]) k.sphere(4.2, 11, 5.2, zc + e, boiler, 24);
      for (const dz of [-6, -2, 2, 6]) k.torus(4.32, 0.12, 11, 5.2, zc + dz, steelR, 40);
      for (const dz of [-5, 5]) { k.box(6, 1.2, 1.6, 11, 0.6, zc + dz, brick); }
      k.block(6.6, 15.6, zc - 12.4, zc + 12.4);
      k.mesh(new T.CylinderGeometry(1.4, 1.4, 12, 20, 1, false).rotateX(PI / 2), boiler, 11, 10.4, zc);
      for (const dz of [-4, 0, 4]) k.cyl(0.5, 1.4, 11, 9.4, zc + dz, steelR, 0.5, 12);
      k.beam(v(11, 11.6, zc - 3), v(11, 16, zc - 3), 0.35, steelR, 10);
      k.beam(v(11, 16, zc - 3), v(6, 16, zc - 3), 0.35, steelR, 10);
      k.torus(0.55, 0.12, 11, 13.6, zc - 3, brass, 16).rotation.x = PI / 2;
      wq.setFromAxisAngle(new T.Vector3(0, 1, 0), PI / 2);
      wheels.push(new T.Matrix4().compose(v(10.4, 12.6, zc - 3), wq, v(1, 1, 1)));
      for (const dz of [-4.5, 4.5]) { k.beam(v(7.4, 3.2, zc + dz), v(5.8, 3.2, zc + dz), 0.14, brass, 8); wq.setFromAxisAngle(new T.Vector3(0, 1, 0), PI / 2); wheels.push(new T.Matrix4().compose(v(5.9, 3.2, zc + dz), wq, v(0.8, 0.8, 0.8))); }
      // the firebox: a slot of orange light at the base of the aisle flank
      k.box(3.2, 0.9, 0.3, 7.2, 0.9, zc, black);
      k.box(2.8, 0.5, 0.06, 7.0, 0.9, zc, fire);
      k.point(6.4, 0.9, zc, 0xff7a2a, 22, 8);
      // gauges on the flank plates, steam at the flanges
      gauges.push(new T.Matrix4().makeTranslation(6.45, 6.2, zc - 3.6), new T.Matrix4().makeTranslation(6.45, 6.2, zc + 3.6));
      needleBase.push(v(6.4, 6.2, zc - 3.6), v(6.4, 6.2, zc + 3.6));
      plumes.push([7.6, 9.6, zc - 3], [12.4, 11.6, zc + 4.5]);
    }
    k.instances(wheelG, red, wheels);
    const gaugeInst = k.instances(new T.CylinderGeometry(0.42, 0.42, 0.1, 24).rotateZ(PI / 2), dial, gauges);
    void gaugeInst;
    k.instances(new T.TorusGeometry(0.42, 0.04, 6, 24).rotateY(PI / 2), brass, gauges.map((m) => m.clone().multiply(new T.Matrix4().makeTranslation(-0.05, 0, 0))));
    const needles = new T.InstancedMesh(new T.BoxGeometry(0.02, 0.34, 0.02).translate(0, 0.12, 0), black, needleBase.length);
    const nq = new T.Quaternion(), nm = new T.Matrix4(), nx = new T.Vector3(1, 0, 0);
    const setNeedles = (t: number) => { needleBase.forEach((b, i) => { nq.setFromAxisAngle(nx, 0.9 + 0.5 * Math.sin(t * 0.7 + i * 1.9) + 0.03 * Math.sin(t * 9 + i)); nm.compose(b, nq, v(1, 1, 1)); needles.setMatrixAt(i, nm); }); needles.instanceMatrix.needsUpdate = true; };
    setNeedles(0);
    k.add(needles);
    if (!ctx.reduced) k.ticks.push((t) => setNeedles(t));
    plumes.forEach(([x, y, z], i) => plume(k, ctx, x, y, z, { n: 16, rise: 6 + (i % 2) * 2, size: 0.9, speed: 0.2 + (i % 3) * 0.04, seed: 120 + i, drift: 0.5 }));
    // the main steam header along the roof, the catwalk with its rails and hangers, the stair at the far end
    k.beam(v(6, 16, FZ - 2), v(6, 16, ZB + 2), 0.45, steelR, 12);
    for (let z = FZ - 6; z > ZB + 3; z -= 8) k.torus(0.55, 0.1, 6, 16, z, steelR, 16).rotation.x = PI / 2;
    const CW = 3.2;
    k.box(1.4, 0.12, D - 8, CW, 8.5, FZ - D / 2, grate);
    for (const s of [-0.7, 0.7]) { k.box(0.05, 0.05, D - 8, CW + s, 9.55, FZ - D / 2, iron); k.box(0.05, 0.05, D - 8, CW + s, 9.05, FZ - D / 2, iron); }
    for (let z = FZ - 4; z > ZB + 4; z -= 2.5) { for (const s of [-0.7, 0.7]) k.box(0.05, 1.05, 0.05, CW + s, 9.05, z, iron); k.beam(v(CW, 8.5, z), v(CW, H - 0.6, z), 0.04, iron, 5); }
    for (let i = 0; i < 12; i++) { const y = 0.7 * i, z = ZB + 4 + i * 0.7; k.box(1.2, 0.08, 0.7, CW, y + 0.35, z, grate); }
    k.box(0.05, 1.1, 8.4, CW - 0.7, 4.7, ZB + 8.2, iron);
    k.keepOut.push({ x: CW, z: ZB + 8, r: 1.4 });
    k.crowd([v(CW, 8.56, FZ - 5), v(CW, 8.56, ZB + 5)], 6, { seed: 109, speed: 0.45, spread: 0.5, animate: !ctx.reduced, colors: [0x2c3a5a, 0x3a3a3a, 0xd8d0c0, 0x8a6a3a] });
    // the inspection wall on the west: nine bays between steel pilasters, the works between the caged bulbs
    const bulbs: T.Matrix4[] = [], cages: T.Matrix4[] = [];
    const mounts: Mount[] = [];
    for (let i = 0; i < 9; i++) {
      const z = FZ - (i + 0.5) * (D / 9);
      mounts.push(facing(-W / 2 + 0.72, 3.9, z, -W / 2 + 6, z, 4.6, 2.8, 'steel', true));
      for (const dz of [-3.3, 3.3]) { bulbs.push(new T.Matrix4().makeTranslation(-W / 2 + 0.8, 5.6, z + dz)); cages.push(new T.Matrix4().makeTranslation(-W / 2 + 0.8, 5.6, z + dz)); }
      if (i % 2 === 0) k.point(-W / 2 + 3, 5.4, z, 0xffe0b8, 14, 10);
    }
    k.instances(new T.SphereGeometry(0.1, 8, 6), bulbGlow, bulbs);
    k.instances(new T.CylinderGeometry(0.16, 0.13, 0.36, 8, 1, true), iron, cages);
    if (!ctx.reduced) k.ticks.push((t) => { bulbGlow.opacity = 0.86 + 0.1 * Math.sin(t * 11) * Math.sin(t * 0.9) + 0.04 * Math.sin(t * 37); });
    k.box(0.06, 1.1, D - 4, -W / 2 + 4.2, 0.55, FZ - D / 2, yellow);
    for (let z = FZ - 3; z > ZB + 2; z -= 3) k.box(0.06, 1.1, 0.06, -W / 2 + 4.2, 0.55, z, iron);
    k.box(0.14, 0.02, D - 4, 0, 0.01, FZ - D / 2, yellow);
    // the works on the boiler flanks (riveted name plates), the end walls, the shift board by the door
    for (const zc of boilers) for (const dz of [-4, 4]) { k.box(0.16, 3.4, 4.2, 6.5, 3.9, zc + dz, steelR); mounts.push(facing(6.38, 3.9, zc + dz, 1.5, zc + dz, 3.6, 2.8, 'steel', true)); }
    mounts.push(facing(-14, 4.4, ZB + 0.36, -14, ZB + 7, 5.0, 3.4, 'steel', true));
    mounts.push(facing(0, 8.6, FZ - 0.32, 0, FZ - 8, 4.6, 3.0, 'steel', true));
    for (const s of [-1, 1]) mounts.push(facing(s * 6.5, 6.6, FZ - 0.32, s * 6.5, FZ - 7, 4.6, 3.0, 'steel', true));
    mounts.push(facing(W / 2 - 0.36, 3.9, 11.5, W / 2 - 6, 11.5, 4.2, 2.8, 'steel', true));
    k.censusWall({ x: 10.5, y: 3.4, z: FZ - 0.4, rotY: PI, cols: 14, rows: 5, tile: 0.5, gap: 0.05, start: ctx.wallStart(4400, 70), pieces: ctx.all, backing: steelD });
    k.sign('SHIFT BOARD   ·   PUNCH IN', 4.6, 0.5, 10.5, 5.35, FZ - 0.4, '#1a1c22', '#ffd27a', 70, PI, { border: true });
    // the control panel inside the door, the ground crew on the centre walk, warm light down the hall
    k.box(2.6, 2.0, 0.5, -13, 1.0, FZ - 2.2, steelD);
    k.box(2.4, 0.9, 0.06, -13, 1.5, FZ - 1.9, black);
    k.block(-14.4, -11.6, FZ - 2.6, FZ - 1.8);
    for (let j = 0; j < 4; j++) k.cyl(0.16, 0.04, -13.9 + j * 0.6, 1.55, FZ - 1.85, dial, 0.16, 16).rotation.x = PI / 2;
    for (let z = FZ - 8; z > ZB + 4; z -= 12) k.point(0, 12, z, 0xffe6c0, 64, 30);
    k.crowd([v(0, 0, FZ - 4), v(0, 0, ZB + 5), v(-9, 0, ZB + 6), v(-9, 0, FZ - 6)], 12, { seed: 110, speed: 0.6, spread: 1.6, animate: !ctx.reduced, closed: true, colors: [0x2c3a5a, 0x3a3a3a, 0x8a6a3a, 0xd8d0c0, 0x24262c, 0xe6a626] });
    return { mounts, spawn: v(0, 2.3, FZ - 4.5), look: v(0, 6, ZB), eye: 2.3, bounds: [-W / 2 + 1, W / 2 - 1, ZB + 1, FZ + 11], style: 'steel' };
  },
};

/* ---------------- 116 NEWSPAPER ROW ---------------- */
export const newsprint: RoomDef = {
  id: 'newsprint',
  name: 'Tomorrow is wet ink',
  area: 'NEWSPAPER ROW PRESS FLOOR, ABOUT 1890',
  mood: 'The city goes to press',
  color: '#ded2b5',
  daylit: false,
  description: 'A Park Row press floor at night: giant paper reels turning, the web running through a line of presses, ink rollers, a composing room of type cases, the copy desk under green shades, a newsstand at the door and the World Building dome through the window. The New Yorkers hang along the press gallery.',
  signatures: 'Three paper reels on cradles feeding a moving web through four press units, ink rollers turning, cast iron columns and pendant lamps, the composing room with sloped type cases and the imposing stone, the copy desk, the ticking wall clock over the end window, the gilt World Building dome outside, the EXTRA newsstand on the sidewalk, the front page board of the census.',
  build(k, ctx) {
    k.sky({ top: 0x0a0e1c, horizon: 0x2c2634, ground: 0x0b0b0f, fog: 0.0035, stars: 260, env: 0.4 });
    k.hemi(0xe0dcff, 0x1a1410, 0.62);
    k.sun(0xb8c6ff, 0.45, 40, 50, -30, false, 70);
    const W = 34, D = 60, FZ = 14, ZB = FZ - D, H = 11;
    const brick = k.pbr('npBrick', X.brick(0x6a4a3c, 121), 0.28),
      planks = k.pbr('npFloor', X.planks(0x6a4a30, 7, 122, 0.4), 0.8, { roughness: 0.7 }),
      plaster = k.pbr('npPlaster', X.plaster(0xd8cfbb, 123), 0.4),
      ironG = k.pbr('npIron', X.steel(0x2e4a3a, true, 124), 0.5, { metalness: 0.6, roughness: 0.5 }),
      steel = k.flat(0x9aa0a6, 0.9, 0.3),
      iron = k.flat(0x22262b, 0.7, 0.45),
      ink = k.flat(0x0c0c10, 0.3, 0.35),
      oak = k.pbr('npOak', X.planks(0x5a3a22, 5, 125), 1.2, { roughness: 0.5 }),
      marble = k.pbr('npStone', X.marble(0xd8d4cc, 0x8d8a80, 126), 0.5, { roughness: 0.3 }),
      paper = k.flat(0xf1ecdf, 0, 0.9, { side: T.DoubleSide }),
      paperR = k.flat(0xe9e3d3, 0, 0.9),
      brass = k.pbr('npBrass', X.gilt(0xc9a55a), 2, { metalness: 0.85, roughness: 0.3 }),
      gilt = k.pbr('npGilt', X.gilt(0xd8b050), 1.5, { metalness: 0.6, roughness: 0.35, emissive: 0xc09a38, emissiveIntensity: 1.1 }),
      glass = k.glass(0xdfeeff, 0.2, 0.06),
      shadeG = k.flat(0x1f5a3a, 0.3, 0.4),
      glowW = k.glow(0xfff0c8),
      black = k.flat(0x111214, 0.4, 0.5),
      pav = k.pbr('xwWalk', X.pavers(0x8e8b84, 5), 0.42);
    // Park Row at night: the street, the neighbours, the newsstand on the sidewalk
    k.box(220, 0.3, 220, 0, -0.17, 0, pav);
    avenue(k, FZ + 13, 130, 16);
    frontage(k, { z: FZ + 26, count: 7, seed: 131, h: [16, 28], night: true, signs: ['THE SUN', 'PRINTERS  ·  ENGRAVERS', '', 'THE TRIBUNE', 'OYSTERS', '', 'TYPE FOUNDRY'] });
    for (const x of [-18, -4, 18]) k.lamp(x, FZ + 6.5, 5.5, iron, 0xffd9a8, 30);
    k.box(2.4, 2.2, 1.6, 7.5, 1.1, FZ + 3, oak);
    k.box(2.8, 0.1, 2.2, 7.5, 2.3, FZ + 2.9, k.pbr('npAwning', X.velvet(0x2a5a3a), 0.5, { roughness: 0.9 }));
    for (let j = 0; j < 8; j++) k.box(0.5, 0.12 + (j % 3) * 0.05, 0.36, 6.5 + (j % 4) * 0.55, 1.28, FZ + 2.4 + Math.floor(j / 4) * 0.4, paperR);
    k.sign('EXTRA   ·   THE WORLD   ·   2 CENTS', 2.6, 0.5, 7.5, 1.9, FZ + 2.18, '#1a1410', '#f2e6c8', 80, 0, { border: true });
    k.point(7.5, 2.4, FZ + 2.2, 0xffe6c0, 12, 5);
    k.keepOut.push({ x: 7.5, z: FZ + 2.9, r: 1.9 });
    // the shell: brick, a plaster frieze, the plank floor, cast iron columns, the front wall and door, the end window
    k.box(W, 0.3, D, 0, -0.15, FZ - D / 2, planks);
    for (const s of [-1, 1]) { k.box(0.5, H, D, s * W / 2, H / 2, FZ - D / 2, brick); k.block(s * W / 2 - 0.5, s * W / 2 + 0.5, ZB - 0.5, FZ + 0.5); k.box(0.2, 1.6, D, s * (W / 2 - 0.3), H - 1.2, FZ - D / 2, plaster); }
    k.box(W, 0.4, D, 0, H + 0.2, FZ - D / 2, plaster);
    for (let z = FZ - 4; z > ZB; z -= 4.25) k.box(W, 0.5, 0.5, 0, H - 0.25, z, oak);
    glazedFront(k, { z: FZ, w: W, h: H, door: 3.6, doorH: 3.4, win: [6.5, 11.5], winY: [1.1, 4.1], m: brick, glass, iron });
    k.sign('THE NEW YORK CENSUS   ·   PRESS ROOM   ·   EST. 1890', 8, 0.9, 0, 5.6, FZ + 0.32, '#1a1410', '#f2e6c8', 70, 0, { border: true });
    k.sign('"PRESS"', 2.2, 0.4, 0, 4.2, FZ - 0.32, 'transparent', '#f2e6c8', 70, PI);
    for (const s of [-1, 1]) for (let i = 1; i < 7; i++) { const z = FZ - i * (D / 7); k.column(s * 9.5, 0, z, H - 0.5, 0.26, ironG, false); k.keepOut.push({ x: s * 9.5, z, r: 0.55 }); }
    k.box(W, 3, 0.6, 0, 1.5, ZB, brick);
    for (const s of [-1, 1]) k.box((W - 14) / 2, H, 0.6, s * (7 + (W - 14) / 4), H / 2, ZB, brick);
    k.box(14, 0.8, 0.6, 0, H - 0.4, ZB, brick);
    k.block(-W / 2, W / 2, ZB - 0.6, ZB + 0.6);
    k.box(14, 7.6, 0.14, 0, 6.8, ZB, glass);
    for (let x = -7; x <= 7; x += 1.75) k.box(0.12, 7.6, 0.24, x, 6.8, ZB, iron);
    for (const y of [4.8, 6.6, 8.4]) k.box(14, 0.12, 0.24, 0, y, ZB, iron);
    clock(k, ctx, -11.5, 9.2, ZB + 0.36, 0, 0.72, paperR, brass, ink);
    // the World Building beyond the window, lit, its gilt dome; the rest of Park Row behind it
    k.box(16, 9.5, 16, 4, 4.75, ZB - 40, k.pbr('npWorld', X.windows(127, 0.45, 0x6a5a48, true), 0.11, { emissive: 0xffffff, emissiveIntensity: 1.6, roughness: 0.6, stretch: 0.42 }));
    k.cyl(6.2, 1.6, 4, 10.3, ZB - 40, k.flat(0xd8cfbb, 0, 0.8, { emissive: 0x8a7a5a, emissiveIntensity: 0.6 }), 6.2, 24);
    k.sphere(4.3, 4, 11.8, ZB - 40, gilt, 28);
    k.cyl(1.0, 2.4, 4, 17.2, ZB - 40, gilt, 0.8, 12);
    k.sphere(0.5, 4, 18.8, ZB - 40, k.glow(0xfff4d0), 8);
    k.point(4, 15, ZB - 33, 0xffe0a0, 120, 24);
    k.box(40, 6, 20, -26, 3, ZB - 44, brick);
    k.box(40, 8, 20, 34, 4, ZB - 46, brick);
    k.skyline({ z: ZB - 120, count: 24, spacing: 7, scale: 2, base: -4, seed: 128, lit: 0.4, x: -30, glow: 1.6 });
    // the press line east of the axis: three reels on cradles, four units with ink rollers, the web moving through them
    const PX = 4.2;
    const reelG = new T.CylinderGeometry(1.4, 1.4, 1.1, 32).rotateZ(PI / 2);
    const reels: T.Mesh[] = [];
    for (const z of [-1, -12.5, -24]) {
      const reel = new T.Mesh(reelG, paperR);
      reel.position.set(PX, 1.6, z);
      k.add(reel);
      reels.push(reel);
      k.cyl(0.08, 1.6, PX, 1.6, z, steel, 0.08, 8).rotation.z = PI / 2;
      for (const s of [-0.75, 0.75]) { k.box(0.16, 1.6, 0.5, PX + s, 0.8, z, ironG); }
      k.box(2.0, 0.3, 1.2, PX, 0.15, z, ironG);
    }
    const rollerG = new T.CylinderGeometry(0.34, 0.34, 3.2, 16).rotateZ(PI / 2);
    const rollers: T.Vector3[] = [], wheels: T.Vector3[] = [];
    const wheelG = mergeGeometries([new T.TorusGeometry(0.8, 0.07, 8, 28).rotateY(PI / 2), new T.BoxGeometry(0.08, 1.5, 0.08), new T.BoxGeometry(0.08, 1.5, 0.08).rotateX(PI / 3), new T.BoxGeometry(0.08, 1.5, 0.08).rotateX(-PI / 3)])!;
    for (let u = 0; u < 4; u++) {
      const z = -6 - u * 8;
      k.box(3.0, 0.24, 5.0, PX, 3.7, z, ironG);
      k.box(3.0, 0.4, 5.0, PX, 0.2, z, ironG);
      for (const s of [-1, 1]) for (const dz of [-2.2, 2.2]) k.box(0.22, 3.6, 0.22, PX + s * 1.35, 1.8, z + dz, ironG);
      for (const s of [-1, 1]) k.box(0.1, 1.3, 4.4, PX + s * 1.35, 1.05, z, ironG);
      k.box(1.2, 3.0, 4.2, PX, 1.9, z, ink);
      for (const [y, dz] of [[1.5, -1.3], [2.9, 0], [1.5, 1.3]]) rollers.push(v(PX, y, z + dz));
      wheels.push(v(PX - 1.55, 1.6, z + 1.2));
      k.cyl(0.2, 0.05, PX - 1.5, 2.9, z - 1.4, brass, 0.2, 16).rotation.z = PI / 2;
      k.point(PX - 3, 3.4, z, 0xffe6c0, 18, 9);
    }
    const rollerInst = k.instances(rollerG, ink, rollers.map((p) => new T.Matrix4().makeTranslation(p.x, p.y, p.z)));
    const wheelInst = k.instances(wheelG, ironG, wheels.map((p) => new T.Matrix4().makeTranslation(p.x, p.y, p.z)));
    k.block(PX - 1.9, PX + 1.9, -36, 0.9);
    const web = k.spline([v(PX, 3.0, -1.2), v(PX, 4.4, -3.5), v(PX, 4.4, -7), v(PX, 1.4, -10), v(PX, 4.4, -13), v(PX, 4.4, -15), v(PX, 1.4, -18), v(PX, 4.4, -21), v(PX, 4.4, -23), v(PX, 1.4, -26), v(PX, 4.4, -29), v(PX, 4.4, -31.5), v(PX, 3.2, -35.6), v(PX, 1.0, -36.2)]);
    k.box(2.2, 1.4, 2.0, PX, 0.7, -36.8, ironG);
    k.block(PX - 1.2, PX + 1.2, -38, -35.8);
    k.mesh(new T.TubeGeometry(web, 40, 0.02, 4), steel);
    const SL = 110, slatG = new T.PlaneGeometry(1.0, 0.6), webLen = web.getLength();
    const slats = new T.InstancedMesh(slatG, paper, SL);
    const sq = new T.Quaternion(), sm = new T.Matrix4(), sup = new T.Vector3(0, 1, 0), spos = new T.Vector3(), stan = new T.Vector3();
    const placeWeb = (t: number) => {
      for (let i = 0; i < SL; i++) {
        const u = ((i / SL) + (t * 2.4) / webLen) % 1;
        web.getPointAt(u, spos);
        web.getTangentAt(u, stan);
        sq.setFromUnitVectors(sup, stan);
        sm.compose(spos, sq, v(1, 1, 1));
        slats.setMatrixAt(i, sm);
      }
      slats.instanceMatrix.needsUpdate = true;
    };
    placeWeb(0);
    k.add(slats);
    if (!ctx.reduced) {
      const rm = new T.Matrix4(), rq = new T.Quaternion(), rx = new T.Vector3(1, 0, 0);
      k.ticks.push((t) => {
        placeWeb(t);
        for (const r of reels) r.rotation.x = -t * 1.7;
        rollers.forEach((p, i) => { rq.setFromAxisAngle(rx, t * 6 * (i % 2 ? -1 : 1)); rm.compose(p, rq, v(1, 1, 1)); rollerInst.setMatrixAt(i, rm); });
        rollerInst.instanceMatrix.needsUpdate = true;
        wheels.forEach((p, i) => { rq.setFromAxisAngle(rx, t * 2.2); rm.compose(p, rq, v(1, 1, 1)); wheelInst.setMatrixAt(i, rm); });
        wheelInst.instanceMatrix.needsUpdate = true;
      });
    }
    // the press gallery backing wall: a plaster wall behind the line, the composing room on its far side
    k.box(0.4, 6.4, 34, 7.2, 3.2, -18, plaster);
    k.box(0.5, 0.3, 34.4, 7.2, 6.5, -18, oak);
    k.block(6.9, 7.5, -35, -1);
    for (let i = 0; i < 10; i++) {
      const x = 9.5 + (i % 5) * 1.5, z = -4 - Math.floor(i / 5) * 30;
      k.box(1.2, 1.0, 0.9, x, 0.5, z, oak);
      const top = k.box(1.2, 0.08, 1.0, x, 1.1, z, oak);
      top.rotation.x = 0.3;
      for (let c = 0; c < 4; c++) k.box(0.02, 0.06, 0.9, x - 0.45 + c * 0.3, 1.16, z, black).rotation.x = 0.3;
      k.keepOut.push({ x, z, r: 0.8 });
    }
    k.box(3.4, 0.1, 2.2, 11, 0.9, -19, marble);
    k.box(3.0, 0.8, 1.8, 11, 0.45, -19, ironG);
    k.block(9.2, 12.8, -20.2, -17.8);
    k.box(3.5, 0.08, 2.4, 12.5, 0.78, 6, oak);
    for (const [dx, dz] of [[-1.5, -1], [1.5, -1], [-1.5, 1], [1.5, 1]]) k.box(0.1, 0.76, 0.1, 12.5 + dx, 0.38, 6 + dz, oak);
    k.block(10.6, 14.4, 4.6, 7.4);
    for (const dx of [-1, 1]) { k.cyl(0.03, 0.5, 12.5 + dx, 1.05, 6, brass, 0.03, 6); k.cyl(0.24, 0.16, 12.5 + dx, 1.36, 6, shadeG, 0.12, 12); k.cyl(0.12, 0.02, 12.5 + dx, 1.28, 6, glowW, 0.12, 10); }
    k.point(12.5, 2.2, 6, 0xffe6b8, 12, 7);
    for (let j = 0; j < 6; j++) k.box(0.36, 0.02 + (j % 2) * 0.03, 0.5, 11.2 + j * 0.45, 0.84, 6.4, paperR);
    // pendant lamps down both aisles, the composing room lit warm, the reels lit
    const shades: T.Matrix4[] = [], bulbs: T.Matrix4[] = [];
    for (const x of [-11, 0, 12.5]) for (let i = 0; i < 7; i++) { const z = FZ - (i + 0.5) * (D / 7); shades.push(new T.Matrix4().makeTranslation(x, 4.5, z)); bulbs.push(new T.Matrix4().makeTranslation(x, 4.35, z)); k.beam(v(x, 4.5, z), v(x, H, z), 0.015, iron, 4); if (i % 2 === 0 || x <= 0) k.point(x, 4.2, z, 0xffe6c0, 30, 15); }
    k.instances(new T.ConeGeometry(0.36, 0.28, 14, 1, true), shadeG, shades);
    k.instances(new T.SphereGeometry(0.07, 8, 6), glowW, bulbs);
    // pressmen and compositors, a runner to the door
    k.crowd([v(-12, 0, 8), v(-12, 0, -40), v(-7, 0, -42), v(-7, 0, 6)], 10, { seed: 132, speed: 0.55, spread: 1.4, animate: !ctx.reduced, closed: true, colors: [0x24262c, 0x3a3a3a, 0xd8d0c0, 0x8a6a3a, 0x151517, 0x6a4a3a] });
    k.crowd([v(1, 0, -32), v(1, 0, 8), v(0, 0, FZ + 3), v(-8, 0, FZ + 3.5)], 4, { seed: 133, speed: 1.6, spread: 0.6, animate: !ctx.reduced, colors: [0x8a6a3a, 0x3a3a3a] });
    k.crowd([v(11, 0, 0), v(15, 0, -12), v(10.5, 0, -24), v(15.5, 0, -30)], 6, { seed: 134, speed: 0.4, spread: 0.8, animate: !ctx.reduced, colors: [0x24262c, 0xd8d0c0, 0x3a3a3a] });
    // the works: the press gallery along the west wall, the backing wall's composing side, the end walls, the front page board
    const mounts: Mount[] = [];
    for (let i = 0; i < 7; i++) { const z = FZ - (i + 0.5) * (D / 7); mounts.push(facing(-W / 2 + 0.55, 3.9, z, -W / 2 + 6, z, 4.6, 2.9, 'oak', true)); }
    for (let i = 0; i < 4; i++) { const z = -5.5 - i * 8.2; mounts.push(facing(7.42, 3.9, z, 12.5, z, 4.6, 2.7, 'oak', true)); }
    for (let i = 0; i < 3; i++) { const z = -11 - i * 8; mounts.push(facing(W / 2 - 0.55, 3.9, z, W / 2 - 2.5, z, 4.2, 2.7, 'oak', true)); }
    for (const s of [-1, 1]) mounts.push(facing(s * 11.5, 5.5, ZB + 0.36, s * 11.5, ZB + 7, 5.4, 3.6, 'oak', true));
    for (const s of [-1, 1]) mounts.push(facing(s * 6.2, 7.2, FZ - 0.32, s * 6.2, FZ - 7, 4.2, 2.6, 'oak', true));
    k.censusWall({ x: W / 2 - 0.36, y: 3.8, z: 5.5, rotY: -PI / 2, cols: 14, rows: 5, tile: 0.5, gap: 0.05, start: ctx.wallStart(5500, 70), pieces: ctx.all, backing: oak });
    k.sign('TOMORROW\'S FRONT PAGES', 4.6, 0.5, W / 2 - 0.36, 5.75, 5.5, '#1a1410', '#f2e6c8', 70, -PI / 2, { border: true });
    return { mounts, spawn: v(-1, 2.3, 10), look: v(0, 4, ZB), eye: 2.3, bounds: [-W / 2 + 1, W / 2 - 1, ZB + 1, FZ + 11], style: 'oak' };
  },
};
