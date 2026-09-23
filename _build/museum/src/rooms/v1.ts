/* 137 to 139: three rooms built around motion rather than around a wall.
   The fish market before dawn, Mott Street at full volume, and the house that never closes.
   Everything that moves here is either instanced or a single group on k.ticks, so a room
   with a thousand moving things still costs a handful of draw calls. */
import * as T from 'three';
import * as X from '../textures';
import { v, type Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront } from './f';
const PI = Math.PI;
type K = Parameters<RoomDef['build']>[0];

/* Cold vapour, steam, smoke: translucent puffs that rise, spread and fade, one draw call for the lot. */
function vapour(k: K, pts: T.Vector3[], perPt: number, p: { rise?: number; spread?: number; size?: number; opacity?: number; colour?: number; seed?: number; speed?: number; animate: boolean }) {
  const { rise = 1.4, spread = 0.5, size = 0.1, opacity = 0.2, colour = 0xffffff, seed = 1, speed = 0.28, animate } = p;
  const n = pts.length * perPt, rnd = X.mulberry(seed);
  const o = k.instances(new T.SphereGeometry(size, 6, 5), new T.MeshBasicMaterial({ color: colour, transparent: true, opacity, depthWrite: false }), Array.from({ length: n }, () => new T.Matrix4()));
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

/* A flock on a ring: bodies lean into the turn, wings beat by scaling across the span. */
function flock(k: K, p: { x: number; y: number; z: number; r: number; n: number; speed?: number; colour?: number; seed?: number; animate: boolean }) {
  const { x, y, z, r, n, speed = 0.22, colour = 0xd8dde2, seed = 3, animate } = p;
  const rnd = X.mulberry(seed);
  const body = new T.ConeGeometry(0.12, 0.62, 5); body.rotateX(PI / 2);
  const wing = new T.BoxGeometry(1.15, 0.03, 0.26);
  const bodies = k.instances(body, k.flat(colour, 0, 0.8), Array.from({ length: n }, () => new T.Matrix4()));
  const wings = k.instances(wing, k.flat(colour, 0, 0.85), Array.from({ length: n }, () => new T.Matrix4()));
  bodies.frustumCulled = wings.frustumCulled = false;
  const st = Array.from({ length: n }, () => ({ a: rnd() * PI * 2, rr: r * (0.6 + rnd() * 0.7), yy: y + (rnd() - 0.5) * 2.4, w: 0.7 + rnd() * 0.7, f: rnd() * PI * 2 }));
  const m = new T.Matrix4(), q = new T.Quaternion(), pos = new T.Vector3(), sc = new T.Vector3(), up = new T.Vector3(0, 1, 0);
  const place = (t: number) => {
    st.forEach((b, i) => {
      const a = b.a + t * speed * b.w;
      pos.set(x + Math.cos(a) * b.rr, b.yy + Math.sin(t * 0.7 + b.f) * 0.25, z + Math.sin(a) * b.rr);
      q.setFromAxisAngle(up, -a + PI / 2);
      sc.set(1, 1, 1);
      m.compose(pos, q, sc);
      bodies.setMatrixAt(i, m);
      sc.set(1, 1, 0.35 + 0.65 * Math.abs(Math.sin(t * 6 + b.f)));
      m.compose(pos, q, sc);
      wings.setMatrixAt(i, m);
    });
    bodies.instanceMatrix.needsUpdate = wings.instanceMatrix.needsUpdate = true;
  };
  place(0);
  if (animate) k.ticks.push(place);
}

/* ---------------- 137 THE NEW FULTON FISH MARKET ---------------- */
export const fultonfish: RoomDef = {
  id: 'fultonfish',
  name: 'Four in the morning',
  area: 'THE NEW FULTON FISH MARKET / HUNTS POINT',
  mood: 'Cold store, before dawn',
  color: '#7fb2c8',
  daylit: false,
  description: 'The hour the city eats by and never sees: a refrigerated hall the length of three blocks, ice going down in mountains, forklifts running the centre aisle with their beacons turning, gulls working the rafters, and the buyers walking the row in headlamps and parkas. The New Yorkers hang on the stall fronts, at the height of a chalked price.',
  signatures: 'The 400,000 square foot cold hall at Hunts Point, the numbered bays and their roll up doors, stainless display tables banked with crushed ice, waxed boxes stacked to the ceiling, hanging scales, chalkboards, forklift beacons, the truck apron outside, and the gulls that came with the market from South Street.',
  build(k, ctx) {
    k.sky({ top: 0x090f1c, horizon: 0x16243a, ground: 0x090b0f, fog: 0.005, stars: 420, env: 0.4 });
    k.hemi(0xbcd2e2, 0x2a3038, 1.5);
    k.sun(0xaebfe4, 0.4, -50, 46, 70, true, 90);
    const floor = k.pbr('fmFloor', X.concrete(0x6e7378, 11), 0.5, { roughness: 0.34, metalness: 0.2 }),
      apron = k.pbr('fmApron', X.asphalt(0x1f2328), 0.11, { roughness: 0.5, metalness: 0.15 }),
      wallT = k.pbr('fmWall', X.subwayTile(0xdfe4e4, 0x39413f), 0.85, { roughness: 0.3 }),
      panel = k.pbr('fmPanel', X.steel(0x9aa3ab), 0.5, { metalness: 0.7, roughness: 0.38 }),
      steel = k.flat(0xc3cad0, 0.85, 0.3),
      dark = k.flat(0x161a1f, 0.4, 0.6),
      blue = k.flat(0x2c5f7c, 0.2, 0.6),
      wax = k.flat(0xe6e2d6, 0, 0.75),
      waxB = k.flat(0xcfd8de, 0, 0.7),
      ice = k.flat(0xdff0f6, 0.1, 0.22, { emissive: 0x2a4a5a, emissiveIntensity: 0.35 }),
      fish = k.flat(0xa9b6bd, 0.55, 0.32),
      tube = k.glow(0xeaf4ff),
      amber = k.glow(0xffae2a),
      red = k.glow(0xff3b2a);
    /* the hall: 52 metres across, 90 long, ten to the trusses */
    const HX = 26, Z0 = 32, Z1 = -58, H = 10;
    k.box(HX * 2, 0.3, Z0 - Z1, 0, -0.15, (Z0 + Z1) / 2, floor);
    k.box(HX * 2, 0.4, Z0 - Z1, 0, H + 0.2, (Z0 + Z1) / 2, panel);
    k.box(0.4, H, Z0 - Z1, -HX, H / 2, (Z0 + Z1) / 2, wallT);
    k.box(0.4, H, Z0 - Z1, HX, H / 2, (Z0 + Z1) / 2, wallT);
    k.box(HX * 2, H, 0.4, 0, H / 2, Z1, wallT);
    k.block(-HX - 0.4, -HX + 0.4, Z1, Z0);
    k.block(HX - 0.4, HX + 0.4, Z1, Z0);
    k.block(-HX, HX, Z1 - 0.4, Z1 + 0.4);
    /* trusses and the light rows: three runs of fluorescent, two of them with a tube on the way out */
    const flicker: T.MeshBasicMaterial[] = [];
    for (let z = Z0 - 4; z > Z1; z -= 7.5) {
      k.bar(v(-HX, H - 0.5, z), v(HX, H - 0.5, z), 0.26, 0.5, dark);
      for (const x of [-18, -6, 6, 18]) k.beam(v(x, H - 0.75, z), v(x, H - 0.05, z + 3.4), 0.05, dark, 5);
    }
    for (const x of [-16, 0, 16]) {
      for (let z = Z0 - 3; z > Z1 + 2; z -= 5) {
        const t = k.mesh(new T.BoxGeometry(1.5, 0.1, 3.1), new T.MeshBasicMaterial({ color: 0xeaf4ff }), x, H - 1.1, z, true);
        k.box(1.7, 0.16, 3.3, x, H - 1.0, z, dark);
        if (Math.abs(z + 23) < 3 || Math.abs(z - 12) < 3) flicker.push(t.material as T.MeshBasicMaterial);
      }
      for (let z = Z0 - 6; z > Z1 + 2; z -= 13) k.point(x, H - 2.2, z, 0xdfeaf6, 90, 34);
    }
    if (!ctx.reduced && flicker.length) {
      const rnd = X.mulberry(88);
      k.ticks.push((t) => { const beat = Math.sin(t * 17.3) * Math.sin(t * 2.7) + rnd() * 0.2; flicker.forEach((m, i) => { m.opacity = i % 2 ? (beat > 0.55 ? 0.25 : 1) : (beat > 0.8 ? 0.15 : 1); m.transparent = true; }); });
    }
    k.plane(HX * 2 - 2, Z0 - Z1 - 4, 0, 0.02, (Z0 + Z1) / 2, k.glow(0x6f97ae, 0.1), 0, -PI / 2);
    /* the stalls: nineteen bays a side, tables banked with ice, boxes to the ceiling, a scale on a spring */
    const vapourPts: T.Vector3[] = [];
    const scales: T.Group[] = [];
    const boxM: T.Matrix4[] = [], iceM: T.Matrix4[] = [], fishM: T.Matrix4[] = [];
    const mk = (x: number, y: number, z: number, ry = 0, s = 1) => new T.Matrix4().compose(v(x, y, z), new T.Quaternion().setFromAxisAngle(v(0, 1, 0), ry), v(s, s, s));
    const rnd = X.mulberry(404);
    for (const side of [-1, 1]) {
      const fx = side * 9.6;
      k.box(0.5, H, Z0 - Z1 - 2, fx + side * 0.25, H / 2, (Z0 + Z1) / 2 - 1, panel);
      k.block(side > 0 ? 9.6 : -HX, side > 0 ? HX : -9.6, Z1, Z0 - 2);
      for (let i = 0; i < 12; i++) {
        const z = Z0 - 6 - i * 7.2;
        if (z < Z1 + 3) break;
        /* the bay: a numbered roll up door in the stall front, a table of ice, boxes behind */
        k.sign(String(101 + i + (side > 0 ? 20 : 0)), 1.1, 0.8, fx - side * 0.02, 6.5, z, '#0d1116', '#e8eef2', 150, side > 0 ? -PI / 2 : PI / 2);
        k.box(0.3, 4.3, 5.4, fx - side * 0.06, 2.3, z, dark);
        k.box(1.6, 1.0, 4.6, fx - side * 1.0, 0.5, z, steel);
        k.box(2.0, 0.1, 5.0, fx - side * 1.1, 1.05, z, k.flat(0xd6dde2, 0.9, 0.22));
        for (let j = 0; j < 7; j++) iceM.push(mk(fx - side * (0.5 + rnd() * 1.4), 1.14 + rnd() * 0.12, z - 2.1 + j * 0.7, rnd() * 3, 0.5 + rnd() * 0.45));
        for (let j = 0; j < 5; j++) fishM.push(mk(fx - side * (0.6 + rnd() * 1.2), 1.26, z - 1.8 + j * 0.9, rnd() * 3));
        for (let c = 0; c < 4; c++) for (let r2 = 0; r2 < 4 + (i % 3); r2++) boxM.push(mk(fx - side * (3.2 + c * 0.95), 0.2 + r2 * 0.32, z - 1.8 + (c % 2) * 0.85, 0));
        vapourPts.push(v(fx - side * 1.1, 1.2, z));
        /* the hanging scale, swinging on its spring */
        const sc = new T.Group(); sc.position.set(fx - side * 1.9, 3.2, z + 1.6);
        const dial = new T.Mesh(new T.CylinderGeometry(0.34, 0.34, 0.12, 16), k.flat(0xe8e4d8, 0.3, 0.5)); dial.rotation.z = PI / 2; sc.add(dial);
        const panHook = new T.Mesh(new T.BoxGeometry(0.04, 0.5, 0.04), steel); panHook.position.y = -0.4; sc.add(panHook);
        const pan = new T.Mesh(new T.CylinderGeometry(0.34, 0.28, 0.1, 14), steel); pan.position.y = -0.68; sc.add(pan);
        k.add(sc); scales.push(sc);
        k.beam(v(fx - side * 1.9, 3.5, z + 1.6), v(fx - side * 1.9, H - 1.4, z + 1.6), 0.02, steel, 4);
        k.sign('MKT PRICE', 1.5, 0.42, fx - side * 0.24, 2.9, z + 3.0, '#10161a', '#dfe7c8', 60, side > 0 ? -PI / 2 : PI / 2);
      }
    }
    k.instances(new T.BoxGeometry(0.82, 0.3, 0.58), wax, boxM.filter((_, i) => i % 2 === 0));
    k.instances(new T.BoxGeometry(0.82, 0.3, 0.58), waxB, boxM.filter((_, i) => i % 2 === 1));
    k.instances(new T.BoxGeometry(0.84, 0.05, 0.6), k.flat(0x2a4a6a, 0, 0.7), boxM.map((m2) => m2.clone().multiply(new T.Matrix4().makeTranslation(0, 0.17, 0))));
    k.instances(new T.IcosahedronGeometry(0.16, 0), ice, iceM);
    const fishG = new T.CapsuleGeometry(0.1, 0.36, 2, 6); fishG.rotateZ(PI / 2);
    k.instances(fishG, fish, fishM);
    if (!ctx.reduced) {
      vapour(k, vapourPts, 3, { rise: 1.1, spread: 0.7, size: 0.13, opacity: 0.13, colour: 0xcfe6f2, seed: 17, speed: 0.2, animate: true });
      k.ticks.push((t) => scales.forEach((s, i) => { s.rotation.z = Math.sin(t * 1.4 + i) * 0.045; }));
    }
    /* the aisle: painted lanes, drains, a hose coiled on the wall, puddles that take the light */
    const lane = k.flat(0xd8c24a, 0, 0.6);
    for (const x of [-8.2, 8.2]) k.box(0.14, 0.012, Z0 - Z1 - 6, x, 0.01, (Z0 + Z1) / 2, lane);
    for (let z = Z0 - 10; z > Z1 + 4; z -= 12) { k.box(0.7, 0.02, 0.7, 0, 0.005, z, dark); k.plane(3.4, 4.6, 2.4, 0.013, z + 3, k.glow(0x9fc6da, 0.16), 0, -PI / 2); }
    /* the truck apron beyond the doors, the trucks, the sodium lamps, the Bronx behind them */
    k.box(HX * 2 + 24, 0.3, 26, 0, -0.16, Z0 + 13, apron);
    for (const x of [-20, -7, 7, 20]) {
      k.box(0.3, 7.6, 6.4, x, 3.8, Z0 - 0.1, panel);
      k.box(7.0, 0.5, 0.4, x, 7.8, Z0 - 0.1, dark);
    }
    k.box(HX * 2, 2.2, 0.5, 0, 9, Z0, panel);
    k.sign('THE NEW FULTON FISH MARKET  ·  HUNTS POINT', 26, 1.5, 0, 9.05, Z0 + 0.3, '#0e1a24', '#cfe3ee', 62);
    for (const x of [-22, 0, 22]) { k.lamp(x, Z0 + 22, 8.5, dark, 0xffb24a, 60); }
    for (const x of [-12, 12]) k.point(x, 7.4, Z0 + 5, 0xffc880, 60, 26);
    for (let i = 0; i < 5; i++) {
      const x = -24 + i * 12, z = Z0 + 9 + (i % 2) * 3;
      k.box(3.0, 3.4, 9.5, x, 2.3, z, i % 2 ? k.flat(0xd8d6ce, 0.3, 0.5) : k.flat(0x8ea7b4, 0.3, 0.5));
      k.box(2.9, 2.0, 2.6, x, 1.6, z - 6.0, dark);
      for (const s of [-1, 1]) for (const dz of [-5.6, 2.2, 4.0]) k.cyl(0.52, 0.34, x + s * 1.45, 0.52, z + dz, dark, 0.52, 10);
      k.box(0.2, 0.3, 0.9, x - 1.5, 3.6, z + 4.6, red);
    }
    k.skyline({ z: Z0 + 120, count: 24, spacing: 11, scale: 2.4, base: 0, seed: 41, lit: 0.22, rows: 2, tint: 0x1b2734 });
    /* the forklifts: three of them running the aisle, beacons turning, forks loaded */
    const lifts: { beacon: T.Mesh; g: T.Group }[] = [];
    for (let i = 0; i < 3; i++) {
      const g = new T.Group();
      const cage = new T.Mesh(new T.BoxGeometry(1.5, 1.2, 2.3), k.flat(0xd8a520, 0.4, 0.5)); cage.position.y = 0.85; g.add(cage);
      const mast = new T.Mesh(new T.BoxGeometry(1.2, 2.5, 0.16), dark); mast.position.set(0, 1.4, 1.25); g.add(mast);
      for (const s of [-0.42, 0.42]) { const fk = new T.Mesh(new T.BoxGeometry(0.12, 0.08, 1.2), steel); fk.position.set(s, 0.36, 1.85); g.add(fk); }
      const load = new T.Mesh(new T.BoxGeometry(1.1, 0.9, 1.1), wax); load.position.set(0, 0.85, 1.85); g.add(load);
      for (const s of [-0.7, 0.7]) for (const dz of [-0.8, 0.8]) { const w = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, 0.2, 10), dark); w.rotation.z = PI / 2; w.position.set(s, 0.3, dz); g.add(w); }
      const driver = new T.Mesh(new T.CapsuleGeometry(0.19, 0.5, 3, 7), k.flat(0x22303c, 0, 0.85)); driver.position.set(0, 1.85, -0.2); g.add(driver);
      const head = new T.Mesh(new T.SphereGeometry(0.13, 9, 7), k.flat(0xd8b088, 0, 0.7)); head.position.set(0, 2.25, -0.2); g.add(head);
      const beacon = new T.Mesh(new T.SphereGeometry(0.15, 9, 7), amber); beacon.position.set(0, 2.05, 0.9); g.add(beacon);
      k.add(g);
      const lane = i % 2 ? 6.6 : -6.6;
      const route = k.spline([v(lane, 0, Z0 - 4), v(lane, 0, Z1 + 8), v(lane * 0.4, 0, Z1 + 4), v(-lane * 0.4, 0, Z1 + 6), v(-lane, 0, Z1 + 10), v(-lane, 0, Z0 - 6), v(0, 0, Z0 + 2)], true);
      k.rider(g, route, 4.2 + i * 0.7, i * 40);
      lifts.push({ beacon, g });
    }
    if (!ctx.reduced) k.ticks.push((t) => lifts.forEach((l, i) => { l.beacon.scale.setScalar(0.7 + 0.7 * Math.abs(Math.sin(t * 3 + i * 2))); }));
    /* the gulls, the buyers, the porters */
    if (!ctx.reduced) {
      flock(k, { x: 0, y: H - 2.6, z: -10, r: 13, n: 14, speed: 0.3, seed: 9, animate: true });
      flock(k, { x: 4, y: 4.5, z: Z0 + 14, r: 10, n: 8, speed: 0.4, seed: 12, animate: true });
      k.crowd([v(4.5, 0, Z0 - 8), v(4.5, 0, Z1 + 8)], 12, { seed: 31, speed: 0.55, spread: 1.6, colors: [0x1d242c, 0x3b4a2a, 0xd8d2c4, 0x5a2a2a, 0x2a4458] });
      k.crowd([v(-4.5, 0, Z1 + 10), v(-4.5, 0, Z0 - 6)], 10, { seed: 33, speed: 0.5, spread: 1.4 });
    }
    /* the works: the stall fronts down both sides, then the end wall */
    const mounts: Mount[] = [];
    for (let i = 0; i < 11; i++) {
      const z = Z0 - 9.5 - i * 7.2;
      if (z < Z1 + 6) break;
      for (const side of [-1, 1]) mounts.push({ position: v(side * 9.3, 3.6, z), rotation: side > 0 ? -PI / 2 : PI / 2, target: v(side * 4.4, 3, z), width: 3.0, height: 2.0, style: 'steel', wash: true });
    }
    for (const x of [-6.4, 0, 6.4]) mounts.push({ position: v(x, 3.4, Z1 + 0.32), rotation: 0, target: v(x, 3, Z1 + 5.5), width: 3.4, height: 2.2, style: 'steel', wash: true });
    /* the census on the tile, north end, where the buyers queue for the scale */
    k.censusWall({ x: -14, y: 4.2, z: Z1 + 0.33, rotY: 0, cols: 18, rows: 5, tile: 0.6, gap: 0.05, start: ctx.wallStart(1200, 90), pieces: ctx.all, backing: panel });
    /* what the market knows about itself */
    k.egg(v(0, 2.6, Z0 - 1), { id: 'moved-2005', title: 'The market moves north', year: '2005', text: 'On November 14, 2005 the Fulton Fish Market left the South Street Seaport after 183 years and opened in this refrigerated hall at Hunts Point in the Bronx. About 650 workers came with it.', clue: 'Read the band over the doors, then ask how old the name on it is.', source: { name: 'Fulton Fish Market, Wikipedia', url: 'https://en.wikipedia.org/wiki/Fulton_Fish_Market' } }, { r: 2.4 });
    k.egg(v(-9.0, 1.4, Z0 - 13), { id: 'since-1822', title: 'A market since 1822', year: '1822', text: 'The fish market began in 1822 as one wing of the Fulton Market, selling alongside produce and meat at the foot of Fulton Street on the East River.', clue: 'The oldest thing in this building is not in this building. It is the name.', source: { name: 'Fulton Fish Market, Wikipedia', url: 'https://en.wikipedia.org/wiki/Fulton_Fish_Market' } }, { r: 1.8 });
    k.egg(v(9.0, 1.4, Z0 - 20), { id: 'the-cold-hall', title: 'Four hundred thousand square feet', year: '2005', text: 'The Hunts Point building cost about 85 million dollars and covers roughly 400,000 square feet, climate controlled from end to end. The old market had no refrigeration at all.', clue: 'Feel the temperature of the room, then look for what it cost.', source: { name: 'Fulton Fish Market, Wikipedia', url: 'https://en.wikipedia.org/wiki/Fulton_Fish_Market' } }, { r: 1.8 });
    k.egg(v(0, 1.6, -30), { id: 'second-to-toyosu', title: 'Second only to Tokyo', year: '2012', text: 'By volume this is the largest fish market in the United States and second in the world only to Tokyo. In 2012 it moved about 200 million pounds of seafood in a year, worth close to a billion dollars.', clue: 'Stand in the middle of the aisle and count the bays both ways.', source: { name: 'Fulton Fish Market, Wikipedia', url: 'https://en.wikipedia.org/wiki/Fulton_Fish_Market' } }, { r: 2.6 });
    k.egg(v(-6.6, 1.2, -44), { id: 'the-fires', title: 'It kept burning down', year: '1835 to 1995', text: 'The old market on South Street came through fires in 1835, 1845, 1918 and 1995, and went back to work each time. The 1995 fire was the one that made the move to the Bronx feel inevitable.', clue: 'Every hall like this one has a hose on the wall. Ask it why.', source: { name: 'Fulton Fish Market, Wikipedia', url: 'https://en.wikipedia.org/wiki/Fulton_Fish_Market' } }, { r: 2 });
    k.egg(v(6.6, 1.2, -50), { id: 'thirty-eight-houses', title: 'Thirty eight houses under one roof', text: 'The market is not one business. It is a cooperative of wholesale houses, around thirty eight of them, each with its own bays, its own buyers and its own hour of the night.', clue: 'The numbers on the stall fronts are not decoration.', source: { name: 'NYC Food Policy Center, Hunts Point Distribution Center', url: 'https://www.nycfoodpolicy.org/hunts-point-distribution-center-brief-overview-spotlight-produce-market/' } }, { r: 2 });
    return { mounts, spawn: v(0, 3, Z0 - 8), look: v(0, 3.2, Z0 - 40), eye: 3, bounds: [-8.9, 8.9, Z1 + 3, Z0 + 20], style: 'steel' };
  },
};

/* ---------------- 138 MOTT STREET, LUNAR NEW YEAR ---------------- */
export const lunarnewyear: RoomDef = {
  id: 'lunarnewyear',
  name: 'The lion comes down Mott Street',
  area: 'CHINATOWN / MOTT STREET',
  mood: 'Confetti, drums, first day',
  color: '#d8342c',
  daylit: false,
  description: 'The narrowest parade in New York: a lion at every doorway, a dragon the length of half a block, confetti coming down like weather and not stopping, drums off the brick, lanterns strung overhead, and the whole street shoulder to shoulder in red. The New Yorkers hang on the shutters and the gates, at eye level, where the crowd is.',
  signatures: 'The Mott Street canyon of five storey tenements with fire escapes, bilingual vertical signs, roll down shutters, red lanterns strung across the roadway, lion dance teams working doorway to doorway, a dragon on poles, drums and cymbals, and confetti ankle deep by afternoon.',
  build(k, ctx) {
    k.sky({ top: 0x86b3dc, horizon: 0xe8e0cf, ground: 0x4c4740, fog: 0.0035, sun: { az: 1.5, el: 0.5, color: 0xfff2d8, size: 13 }, env: 0.95 });
    k.hemi(0xfff0e2, 0x4a4238, 1.0);
    k.sun(0xfff0cc, 2.0, 30, 44, 30, true, 70);
    const red = k.flat(0xb4201e, 0.1, 0.6),
      gold = k.flat(0xd8a828, 0.7, 0.35),
      dark = k.flat(0x1a1d22, 0.3, 0.7),
      shutter = k.pbr('cnShutter', X.steel(0x7f868c), 1.6, { metalness: 0.6, roughness: 0.45 }),
      awning = k.flat(0x1d4a35, 0, 0.75),
      paper = k.glow(0xff5a3c, 0.95),
      cream = k.flat(0xf0e6cc, 0, 0.8);
    street(k, { w: 9, len: 110, z: -6, x: 0, walk: 4.6 });
    blockFront(k, { x: 9.2, z0: 42, count: 12, face: -1, seed: 55, h: [15, 22] });
    blockFront(k, { x: -9.2, z0: 44, count: 12, face: 1, seed: 56, h: [14, 21] });
    k.skyline({ z: -90, count: 18, spacing: 10, scale: 2.2, base: 0, seed: 58, lit: 0.18, rows: 1 });
    /* storefronts: awnings, shutters, vertical signs, the gate the works hang on */
    const names = ['FOOK SING', 'GOLDEN PALACE', 'HOP LEE', 'MEI LAI WAH', 'WO HOP', 'TAI PAN', 'NOM WAH', 'SUN SAI GAI', 'WING ON', 'KAM MAN', 'LUNG MOON', 'SHUN LEE'];
    for (const side of [-1, 1]) {
      for (let i = 0; i < 10; i++) {
        const z = 34 - i * 8, x = side * 9.1;
        k.box(0.5, 4.4, 7.2, x + side * 0.25, 2.2, z, shutter);
        k.box(2.4, 0.16, 7.4, x - side * 1.1, 4.6, z, awning);
        k.box(0.2, 0.5, 7.4, x - side * 2.2, 4.45, z, dark);
        k.sign(names[(i + (side > 0 ? 0 : 6)) % names.length], 5.6, 0.62, x - side * 0.02, 5.25, z, '#b4201e', '#f4e2b0', 62, side > 0 ? -PI / 2 : PI / 2);
        k.box(0.36, 3.2, 0.56, x - side * 0.3, 8.2, z + 2.6, red);
        k.sign('OPEN  ·  ALL DAY', 0.5, 3.0, x - side * 0.52, 8.2, z + 2.6, '#b4201e', '#f4e2b0', 52, side > 0 ? -PI / 2 : PI / 2);
        for (const dz of [-2.2, 2.2]) { k.cyl(0.26, 0.42, x - side * 1.6, 4.0, z + dz, paper, 0.26, 12); k.point(x - side * 1.6, 3.9, z + dz, 0xff6a3a, 6, 5); }
      }
    }
    /* lanterns on strings across the roadway, and the banner over the parade */
    const lanternGroups: T.Group[] = [];
    for (let i = 0; i < 10; i++) {
      const z = 32 - i * 8;
      const g = new T.Group(); g.position.set(0, 8.4, z);
      const wire = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([v(-9, 0.5, 0), v(0, -0.5, 0), v(9, 0.5, 0)]), 12, 0.02, 5), dark); g.add(wire);
      for (let j = -3; j <= 3; j++) {
        const lx = j * 2.4, dy = -0.5 + Math.abs(j) * 0.11;
        const body = new T.Mesh(new T.SphereGeometry(0.42, 12, 9), paper); body.scale.set(1, 0.8, 1); body.position.set(lx, dy - 0.5, 0); g.add(body);
        const cap = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.1, 10), gold); cap.position.set(lx, dy - 0.14, 0); g.add(cap);
        const tass = new T.Mesh(new T.ConeGeometry(0.1, 0.34, 7), gold); tass.position.set(lx, dy - 1.0, 0); g.add(tass);
      }
      k.add(g); lanternGroups.push(g);
      if (i % 3 === 0) k.point(0, 7.6, z, 0xff7a4a, 24, 14);
    }
    k.box(0.3, 1.4, 17, 0, 10.6, 12, red);
    k.sign('LUNAR NEW YEAR  ·  MOTT STREET  ·  GUNG HAY FAT CHOY', 16, 1.2, 0.2, 10.6, 12, '#b4201e', '#f4e2b0', 58, -PI / 2, { double: true });
    /* the drums, at the kerb, sticks going */
    const sticks: T.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const x = -6.4, z = 16 - i * 3.4;
      k.cyl(0.62, 0.9, x, 0.85, z, red, 0.62, 16);
      k.cyl(0.6, 0.06, x, 1.33, z, cream, 0.6, 16);
      for (const s of [-1, 1]) { const st = new T.Mesh(new T.BoxGeometry(0.04, 0.04, 0.7), cream); st.position.set(x + s * 0.34, 1.7, z - 0.4); k.add(st); sticks.push(st); }
    }
    if (!ctx.reduced) k.ticks.push((t) => sticks.forEach((s, i) => { s.rotation.x = -0.6 + 0.6 * Math.abs(Math.sin(t * 5.2 + (i % 2) * PI)); }));
    /* confetti: five hundred paper squares falling, tumbling, respawning above the roofline */
    if (!ctx.reduced) {
      const n = 520, rnd = X.mulberry(77);
      const cols = [0xd8342c, 0xf0c22a, 0xf5efe2, 0xe07a2a, 0xc8306a];
      const conf = k.instances(new T.PlaneGeometry(0.16, 0.16), new T.MeshBasicMaterial({ color: 0xffffff, side: T.DoubleSide }), Array.from({ length: n }, () => new T.Matrix4()));
      conf.frustumCulled = false;
      const c = new T.Color();
      for (let i = 0; i < n; i++) conf.setColorAt(i, c.set(cols[Math.floor(rnd() * cols.length)]));
      if (conf.instanceColor) conf.instanceColor.needsUpdate = true;
      const st = Array.from({ length: n }, () => ({ x: (rnd() - 0.5) * 17, z: 38 - rnd() * 76, y: rnd() * 16, v: 0.9 + rnd() * 1.5, s: rnd() * 6, w: 1.6 + rnd() * 3 }));
      const m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), pos = new T.Vector3(), one = new T.Vector3(1, 1, 1);
      k.ticks.push((t, dt) => {
        const d = Math.min(dt, 0.1);
        for (let i = 0; i < n; i++) {
          const a = st[i];
          a.y -= a.v * d;
          if (a.y < 0.06) { a.y = 15 + rnd() * 3; a.x = (rnd() - 0.5) * 17; a.z = 38 - rnd() * 76; }
          pos.set(a.x + Math.sin(t * 0.9 + a.s) * 0.5, a.y, a.z + Math.cos(t * 0.7 + a.s) * 0.4);
          e.set(t * a.w + a.s, t * a.w * 0.7, t * 0.5);
          q.setFromEuler(e);
          m.compose(pos, q, one);
          conf.setMatrixAt(i, m);
        }
        conf.instanceMatrix.needsUpdate = true;
      });
      k.ticks.push((t) => lanternGroups.forEach((g, i) => { g.rotation.z = Math.sin(t * 0.8 + i * 0.6) * 0.045; }));
    }
    /* the lions: two teams, working up the street, heads bobbing, jaws going */
    const lionParts: { head: T.Group; jaw: T.Mesh; body: T.Group; phase: number }[] = [];
    for (let i = 0; i < 2; i++) {
      const g = new T.Group();
      const head = new T.Group(); head.position.y = 1.85;
      const skull = new T.Mesh(new T.SphereGeometry(0.5, 14, 11), i ? k.flat(0xd8b428, 0.4, 0.5) : k.flat(0xc8202a, 0.2, 0.6)); skull.scale.set(1, 0.85, 1.1); head.add(skull);
      const horn = new T.Mesh(new T.ConeGeometry(0.14, 0.45, 8), gold); horn.position.set(0, 0.6, 0.05); head.add(horn);
      for (const s of [-1, 1]) { const eye = new T.Mesh(new T.SphereGeometry(0.16, 10, 8), cream); eye.position.set(s * 0.3, 0.2, 0.52); head.add(eye); const pup = new T.Mesh(new T.SphereGeometry(0.07, 8, 6), dark); pup.position.set(s * 0.3, 0.2, 0.64); head.add(pup); }
      const jaw = new T.Mesh(new T.BoxGeometry(0.8, 0.18, 0.62), cream); jaw.position.set(0, -0.36, 0.28); head.add(jaw);
      const mane = new T.Mesh(new T.TorusGeometry(0.54, 0.13, 8, 18), i ? red : gold); mane.position.z = -0.1; head.add(mane);
      g.add(head);
      const body = new T.Group();
      for (let s = 0; s < 5; s++) { const w = 0.82 - s * 0.1; const cloth = new T.Mesh(new T.BoxGeometry(w, 0.56 - s * 0.05, 0.44), i ? k.flat(0xd8b428, 0.3, 0.6) : k.flat(0xc8202a, 0.15, 0.65)); cloth.position.set(0, 1.28 - s * 0.09, -0.62 - s * 0.48); body.add(cloth); }
      g.add(body);
      for (const dz of [0.2, -2.4]) for (const s of [-0.26, 0.26]) { const leg = new T.Mesh(new T.CapsuleGeometry(0.13, 0.7, 3, 6), dark); leg.position.set(s, 0.55, dz); g.add(leg); }
      k.add(g);
      const lane = i ? 2.2 : -2.2;
      const route = k.spline([v(lane, 0, 34), v(lane + 1.4, 0, 22), v(lane - 1.2, 0, 10), v(lane + 1.0, 0, -4), v(lane - 1.4, 0, -18), v(lane, 0, -32), v(lane + 1.2, 0, -46), v(lane, 0, 40)], true);
      k.rider(g, route, 2.1 + i * 0.4, i * 30);
      lionParts.push({ head, jaw, body, phase: i * 2.1 });
    }
    if (!ctx.reduced) k.ticks.push((t) => lionParts.forEach((l) => {
      l.head.position.y = 1.85 + Math.sin(t * 3.2 + l.phase) * 0.28;
      l.head.rotation.z = Math.sin(t * 1.7 + l.phase) * 0.22;
      l.jaw.rotation.x = -0.5 * Math.abs(Math.sin(t * 4.4 + l.phase));
      l.body.rotation.y = Math.sin(t * 2.4 + l.phase) * 0.12;
    }));
    /* the dragon: fourteen segments on poles, each one riding the same curve a beat behind */
    const segs: T.Group[] = [];
    const dragonRoute = k.spline([v(0, 0, 40), v(2.4, 0, 24), v(-2.2, 0, 8), v(2.2, 0, -8), v(-2.4, 0, -24), v(2.0, 0, -40), v(0, 0, -54), v(-2.2, 0, 44)], true);
    for (let i = 0; i < 10; i++) {
      const g = new T.Group();
      const hoop = new T.Mesh(new T.SphereGeometry(i === 0 ? 0.44 : 0.27, 12, 9), i === 0 ? k.flat(0x1fa06a, 0.4, 0.45) : (i % 2 ? k.flat(0x2ab884, 0.4, 0.45) : k.flat(0xf0c22a, 0.5, 0.4)));
      hoop.scale.set(1.25, 0.85, 1); hoop.position.y = 3.25; g.add(hoop);
      if (i === 0) { for (const s of [-1, 1]) { const horn = new T.Mesh(new T.ConeGeometry(0.08, 0.38, 6), gold); horn.position.set(s * 0.24, 3.75, 0); horn.rotation.z = s * 0.35; g.add(horn); } const snout = new T.Mesh(new T.BoxGeometry(0.4, 0.24, 0.56), red); snout.position.set(0, 3.2, 0.56); g.add(snout); }
      const pole = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 2.1, 6), dark); pole.position.y = 2.1; g.add(pole);
      const carrier = new T.Mesh(new T.CapsuleGeometry(0.2, 0.62, 3, 7), i % 2 ? k.flat(0xd8342c, 0, 0.8) : k.flat(0xf0e2c0, 0, 0.8)); carrier.position.y = 0.72; g.add(carrier);
      const head2 = new T.Mesh(new T.SphereGeometry(0.13, 9, 7), k.flat(0xd8b088, 0, 0.7)); head2.position.y = 1.2; g.add(head2);
      k.add(g); segs.push(g);
      k.rider(g, dragonRoute, 3.4, -i * 3.4);
    }
    if (!ctx.reduced) k.ticks.push((t) => segs.forEach((g, i) => { g.children[0].position.y = 3.25 + Math.sin(t * 2.6 - i * 0.7) * 0.36; }));
    /* firecracker strings: two hanging runs that go off, flash, smoke, and reload */
    const crackers: { light: T.PointLight; sparks: T.InstancedMesh; at: T.Vector3 }[] = [];
    for (const at of [v(-5.2, 0, 4), v(5.2, 0, -14)]) {
      k.beam(v(at.x, 6.4, at.z), v(at.x, 1.2, at.z), 0.05, red, 5);
      for (let j = 0; j < 22; j++) k.cyl(0.05, 0.16, at.x + (j % 2 ? 0.1 : -0.1), 1.4 + j * 0.22, at.z, red, 0.05, 6);
      const light = new T.PointLight(0xffd6a0, 0, 16, 2);
      light.position.set(at.x, 2.4, at.z);
      k.add(light);
      const sparks = k.instances(new T.SphereGeometry(0.05, 5, 4), new T.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0.9, depthWrite: false }), Array.from({ length: 40 }, () => new T.Matrix4()));
      sparks.frustumCulled = false;
      crackers.push({ light, sparks, at });
      k.keepOut.push({ x: at.x, z: at.z, r: 0.8 });
    }
    if (!ctx.reduced) {
      const rnd = X.mulberry(303);
      const m = new T.Matrix4(), q = new T.Quaternion(), pos = new T.Vector3(), one = new T.Vector3(1, 1, 1), zero = new T.Vector3(0.001, 0.001, 0.001);
      k.ticks.push((t) => {
        crackers.forEach((c, ci) => {
          const cyc = (t * 0.55 + ci * 0.5) % 1;
          const live = cyc < 0.38;
          c.light.intensity = live ? 30 + 90 * Math.abs(Math.sin(t * 34 + ci)) : 0;
          for (let i = 0; i < 40; i++) {
            if (!live) { m.compose(pos.set(0, -50, 0), q, zero); c.sparks.setMatrixAt(i, m); continue; }
            const u = (cyc / 0.38 + i * 0.023) % 1;
            const a = i * 2.39 + ci;
            pos.set(c.at.x + Math.cos(a) * u * 2.2, 1.2 + (1 - u) * 3.6 + Math.sin(a * 3) * 0.4, c.at.z + Math.sin(a) * u * 2.2);
            m.compose(pos, q, one);
            c.sparks.setMatrixAt(i, m);
          }
          c.sparks.instanceMatrix.needsUpdate = true;
        });
        void rnd;
      });
      vapour(k, [v(-5.2, 1.4, 4), v(5.2, 1.4, -14)], 10, { rise: 3.4, spread: 1.5, size: 0.2, opacity: 0.12, colour: 0xd8d0c4, seed: 5, speed: 0.16, animate: true });
    }
    /* the crowd: both kerbs, four deep, and the ones who stepped into the road */
    if (!ctx.reduced) {
      k.crowd([v(6.4, 0, 40), v(6.4, 0, -46)], 30, { seed: 61, speed: 0.25, spread: 2.6, colors: [0xb4201e, 0xd8342c, 0x1d242c, 0xf0e2c0, 0xd8a828, 0x2a3f6a] });
      k.crowd([v(-6.4, 0, -46), v(-6.4, 0, 40)], 30, { seed: 62, speed: 0.22, spread: 2.6, colors: [0xb4201e, 0x8a1a18, 0x24303c, 0xefe6d2, 0xd8a828] });
      k.crowd([v(3.6, 0, 38), v(-3.6, 0, -44)], 12, { seed: 63, speed: 0.6, spread: 1.4 });
    }
    /* the works: on the shutters, both sides, at the height the crowd stands */
    const mounts: Mount[] = [];
    for (let i = 0; i < 9; i++) {
      const z = 32 - i * 8;
      for (const side of [-1, 1]) mounts.push({ position: v(side * 8.82, 2.6, z), rotation: side > 0 ? -PI / 2 : PI / 2, target: v(side * 6.2, 3, z), width: 2.6, height: 1.8, style: 'black', wash: false });
    }
    for (let i = 0; i < 4; i++) { const z = 28 - i * 8; for (const side of [-1, 1]) mounts.push({ position: v(side * 8.82, 2.6, z - 3.4), rotation: side > 0 ? -PI / 2 : PI / 2, target: v(side * 6.2, 3, z - 3.4), width: 2.2, height: 1.6, style: 'black', wash: false }); }
    k.censusWall({ x: 0, y: 5.4, z: -50, rotY: 0, cols: 16, rows: 4, tile: 0.58, gap: 0.05, start: ctx.wallStart(2000, 64), pieces: ctx.all, backing: shutter });
    k.box(11, 5.6, 0.4, 0, 5.4, -50.25, dark);
    k.block(-11, 11, -50.6, -49.9);
    /* the street's own history */
    k.egg(v(0, 3.2, 12), { id: 'first-parade', title: 'The parade is younger than it looks', year: '1996', text: 'Better Chinatown USA held the first Chinatown Lunar New Year Parade and Festival in 1996. The neighbourhood had marked the new year for well over a century before that, in family associations and at the temples, without a permit or a route.', clue: 'Read the banner over the road, then ask how old it is.', source: { name: 'Better Chinatown USA', url: 'https://betterchinatown.com/lny-parade/' } }, { r: 3 });
    k.egg(v(-5.2, 2.2, 4), { id: 'firecracker-ceremony', title: 'The Firecracker Ceremony', year: '1998', text: 'The New Year Firecracker Ceremony began in 1998 at Mott and Bayard Streets. The crowds on that corner grew so large that the ceremony was moved, first to Chatham Square and then to Sara D. Roosevelt Park.', clue: 'Something on a string here is about to make the loudest sound in the room.', source: { name: 'Asian American Arts Alliance, Firecracker Ceremony', url: 'https://www.aaartsalliance.org/events/28th-new-year-firecracker-ceremony-cultural-festival' } }, { r: 1.6 });
    k.egg(v(2.2, 2.6, -18), { id: 'the-route', title: 'Down Mott, east on East Broadway', text: 'The parade forms on Mott Street at Hester and works south, then east on East Broadway and up Forsyth to Grand, a route that stays inside the oldest streets of the neighbourhood rather than taking an avenue.', clue: 'Follow the lion. It is not improvising the way it goes.', source: { name: 'Better Chinatown USA', url: 'https://betterchinatown.com/lny-parade/' } }, { r: 2.4 });
    k.egg(v(-6.4, 1.6, 16), { id: 'the-drums', title: 'The drum is the instruction', text: 'A lion does not follow the music, it follows the drum. The drummer calls the lion awake, sends it to each doorway for the lettuce and the red envelope, and tells it when to bow before it moves on.', clue: 'Stand by the skins and watch the head, not the sticks.', source: { name: 'Better Chinatown USA', url: 'https://betterchinatown.com/' } }, { r: 2 });
    k.egg(v(5.4, 4.2, 26), { id: 'the-lanterns', title: 'Red overhead, all week', text: 'The lanterns go up across the roadway before the parade and stay up through the fifteen days of the new year, ending at the Lantern Festival on the first full moon.', clue: 'Look straight up in the middle of the road.', source: { name: 'NYC Tourism, Lunar New Year', url: 'https://www.nyctourism.com/events/lunar-new-year-parade-festival/' } }, { r: 3 });
    return { mounts, spawn: v(0, 3, 36), look: v(0, 3.4, 8), eye: 3, bounds: [-8.2, 8.2, -47, 40], style: 'black' };
  },
};

/* ---------------- 139 ENGINE COMPANY 55, BROOME STREET ---------------- */
export const enginecompany: RoomDef = {
  id: 'enginecompany',
  name: 'First due',
  area: 'ENGINE COMPANY 55 / 363 BROOME STREET',
  mood: 'The bell, then the doors',
  color: '#a8231f',
  description: 'A house that has been answering this corner since 1899: one bay, one rig, a brass pole through the ceiling, gear hanging ready in the order a person puts it on. Every twenty seconds the gong goes, the beacons start turning, and the door rolls up on Broome Street. The New Yorkers hang along the tiled bay walls, watching it happen.',
  signatures: 'R. H. Robertson\'s 1899 firehouse: brick and limestone with the company banner carved over a monumental arched apparatus bay, a copper mansard roof, oval windows in garlands, Guastavino glazed tile inside, the brass pole, turnout gear on hooks, the housewatch desk and the gong.',
  build(k, ctx) {
    k.sky({ top: 0x2a3d5e, horizon: 0xd88a52, ground: 0x2e2a26, fog: 0.004, sun: { az: 2.5, el: 0.08, color: 0xffb070, size: 20 }, env: 0.6 });
    k.hemi(0xe4e6ee, 0x2a2622, 0.95);
    k.sun(0xffb878, 1.5, -40, 16, 30, true, 60);
    const tile = k.pbr('ecTile', X.subwayTile(0xe8e2d2, 0x4a4238), 0.95, { roughness: 0.25 }),
      deck = k.pbr('ecDeck', X.terrazzo(0x9aa0a4, 22), 1.4, { roughness: 0.4, metalness: 0.18 }),
      lime = k.pbr('ecLime', X.ashlar(0xcfc6b2, 31, 5), 0.45),
      brick = k.pbr('ecBrick', X.brick(0x7d4236, 32), 0.3),
      copper = k.pbr('ecCopper', X.patina(0x4f8f7a), 0.7, { metalness: 0.6, roughness: 0.45 }),
      brass = k.flat(0xc79a36, 0.95, 0.22),
      steel = k.flat(0xb9c0c6, 0.8, 0.32),
      dark = k.flat(0x14171c, 0.35, 0.65),
      fireRed = k.flat(0x9c1a18, 0.35, 0.4),
      chrome = k.flat(0xe2e8ec, 1.0, 0.12),
      warm = k.glow(0xffe2b0),
      lamp = k.glow(0x9ad8a8),
      beaconRed = k.glow(0xff2a20);
    /* Broome Street, the neighbours, the corner */
    const RX = 22, FX = 13;
    street(k, { w: 14, len: 120, z: 0, x: RX });
    blockFront(k, { x: RX + 12, z0: 48, count: 12, face: -1, seed: 71, h: [15, 23] });
    blockFront(k, { x: FX, z0: 46, count: 4, face: 1, seed: 72, h: [16, 22] });
    blockFront(k, { x: FX, z0: -20, count: 4, face: 1, seed: 73, h: [15, 21] });
    k.skyline({ z: -140, count: 20, spacing: 10, scale: 2.4, base: 0, seed: 74, lit: 0.3, rows: 2 });
    for (const z of [26, -26]) k.lamp(RX - 9.2, z, 6.4, dark, 0xffd7a0, 26);
    k.prop('hydrant', RX - 9.4, 0, 9, { height: 1.1, keepOut: 0.5 });
    k.prop('utility_pole', RX + 9.2, 0, -6, { height: 11 });
    /* the house: 14 metres of frontage, arched bay, carved banner, mansard */
    const W = 27, D = 22, H = 6.8;
    k.box(W, 13, D, FX - W / 2, H + 6.5, 0, brick);
    k.box(0.6, H + 3.2, D, FX - 0.3, (H + 3.2) / 2, 0, lime);
    k.arch(6.4, 5.4, 0.8, FX - 0.15, 0, 0, lime, false, 0.9);
    k.box(W, 0.9, D + 0.6, FX - W / 2, H + 3.4, 0, lime);
    k.sign('ENGINE COMPANY 55', 7.6, 0.8, FX + 0.34, H + 3.4, 0, 'transparent', '#e6dcc4', 96, PI / 2);
    k.sign('363', 1.0, 0.7, FX + 0.34, 6.2, 4.6, 'transparent', '#e6dcc4', 130, PI / 2);
    for (const dz of [-7.2, -3.6, 3.6, 7.2]) {
      k.mesh(new T.SphereGeometry(0.95, 16, 12), lime, FX - 0.1, H + 5.6, dz, false).scale.set(0.22, 0.75, 1.0);
      k.mesh(new T.SphereGeometry(0.78, 14, 10), k.glass(0xc8dce8, 0.3, 0.1), FX + 0.06, H + 5.6, dz, false).scale.set(0.12, 0.7, 0.92);
    }
    for (let y = H + 8.6; y < H + 12; y += 3.0) for (const dz of [-7.2, -3.6, 0, 3.6, 7.2]) { k.box(0.22, 2.0, 1.25, FX - 0.06, y, dz, lime); k.box(0.06, 1.7, 1.0, FX + 0.06, y, dz, k.glass(0xa8c4d4, 0.4, 0.1)); }
    for (let i = 0; i < 7; i++) { const dz = -9 + i * 3; k.box(1.6, 3.4, 2.6, FX - 0.5, H + 14.6, dz, copper); }
    k.box(W, 0.7, D, FX - W / 2, H + 16.4, 0, copper);
    k.prop('fire_escape', FX + 1.05, H + 8.0, -9.6, { height: 3.2, rotY: -PI / 2 });
    /* the two red globes that mark a firehouse door, inside and out */
    for (const sz of [-1, 1]) {
      for (const dx of [0.45, -0.9]) {
        k.sphere(0.24, FX + dx, 4.4, sz * 3.9, k.glow(0xff2a20), 12);
        k.beam(v(FX + dx, 4.64, sz * 3.9), v(FX + dx, 5.1, sz * 3.9), 0.03, steel, 4);
      }
      k.point(FX - 0.9, 4.3, sz * 3.9, 0xff3a2a, 30, 12);
    }
    /* the bay: tile to the springing, terrazzo deck, the arch overhead */
    const LX = FX - W + 1;
    k.box(W - 1, 0.3, D, FX - (W - 1) / 2, -0.15, 0, deck);
    k.box(W - 1, 0.4, D, FX - (W - 1) / 2, H + 0.2, 0, tile);
    k.box(0.4, H, D, LX, H / 2, 0, tile);
    k.box(W, H, 0.4, FX - W / 2, H / 2, -D / 2, tile);
    k.box(W, H, 0.4, FX - W / 2, H / 2, D / 2, tile);
    k.block(LX - 0.4, LX + 0.4, -D / 2, D / 2);
    k.block(LX, FX, -D / 2 - 0.4, -D / 2 + 0.4);
    k.block(LX, FX, D / 2 - 0.4, D / 2 + 0.4);
    k.block(FX - 0.5, FX + 0.5, -D / 2, -3.4);
    k.block(FX - 0.5, FX + 0.5, 3.4, D / 2);
    for (const dz of [-7, 0, 7]) { k.box(1.3, 0.18, 1.3, FX - 8, H - 0.4, dz, warm); k.point(FX - 8, H - 1.0, dz, 0xffeedc, 22, 15); }
    for (const dz of [-7, 0, 7]) { k.box(1.3, 0.18, 1.3, FX - 17, H - 0.4, dz, warm); k.point(FX - 17, H - 1.0, dz, 0xffeedc, 20, 15); }
    /* the brass pole, its hole in the ceiling, the rail around it */
    k.cyl(0.09, H + 2.4, LX + 4.2, (H + 2.4) / 2, -7.4, brass, 0.09, 14);
    k.torus(0.75, 0.08, LX + 4.2, H + 0.05, -7.4, brass, 24);
    k.mesh(new T.CylinderGeometry(0.74, 0.74, 0.5, 20, 1, true), dark, LX + 4.2, H + 0.3, -7.4, false);
    k.keepOut.push({ x: LX + 4.2, z: -7.4, r: 0.9 });
    /* the rig: a pumper nine metres long, nose to the door, panels open, beacons on the cab */
    const rig = new T.Group(); rig.position.set(FX - 6.6, 0, 0);
    const body = new T.Mesh(new T.BoxGeometry(6.4, 1.9, 2.5), fireRed); body.position.set(-1.2, 1.5, 0); rig.add(body);
    const cab = new T.Mesh(new T.BoxGeometry(3.0, 1.7, 2.5), fireRed); cab.position.set(3.0, 1.75, 0); rig.add(cab);
    const glassCab = new T.Mesh(new T.BoxGeometry(0.1, 0.9, 2.3), k.glass(0x9fc4d8, 0.4, 0.08)); glassCab.position.set(4.52, 2.2, 0); rig.add(glassCab);
    const stripe = new T.Mesh(new T.BoxGeometry(9.4, 0.22, 2.56), k.flat(0xf0e8d0, 0.2, 0.5)); stripe.position.set(0.3, 1.1, 0); rig.add(stripe);
    for (const s of [-1, 1]) { const rail = new T.Mesh(new T.BoxGeometry(6.3, 0.08, 0.08), chrome); rail.position.set(-1.2, 2.55, s * 1.2); rig.add(rail); }
    const hosebed = new T.Mesh(new T.BoxGeometry(5.2, 0.5, 2.0), k.flat(0x2a4a68, 0, 0.8)); hosebed.position.set(-1.6, 2.7, 0); rig.add(hosebed);
    const ladder = new T.Mesh(new T.BoxGeometry(7.4, 0.12, 0.42), chrome); ladder.position.set(-1.0, 2.9, -1.18); rig.add(ladder);
    for (let i = 0; i < 9; i++) { const fold = new T.Mesh(new T.BoxGeometry(4.6, 0.12, 0.16), k.flat(0xd8d8d8, 0, 0.8)); fold.position.set(-1.6, 2.98 + (i % 3) * 0.13, -0.8 + i * 0.2); rig.add(fold); }
    for (const dx of [2.6, -1.2, -3.8]) for (const s of [-1, 1]) { const w = new T.Mesh(new T.CylinderGeometry(0.56, 0.56, 0.34, 14), dark); w.rotation.x = PI / 2; w.position.set(dx, 0.56, s * 1.22); rig.add(w); const hub = new T.Mesh(new T.CylinderGeometry(0.26, 0.26, 0.36, 12), chrome); hub.rotation.x = PI / 2; hub.position.set(dx, 0.56, s * 1.24); rig.add(hub); }
    const bumper = new T.Mesh(new T.BoxGeometry(0.4, 0.34, 2.6), chrome); bumper.position.set(4.7, 0.7, 0); rig.add(bumper);
    for (const s of [-1, 1]) {
      const pump = new T.Mesh(new T.BoxGeometry(2.2, 1.0, 0.12), chrome); pump.position.set(1.0, 1.55, s * 1.28); rig.add(pump);
      for (let g2 = 0; g2 < 4; g2++) { const dial = new T.Mesh(new T.CylinderGeometry(0.11, 0.11, 0.06, 10), k.flat(0xe8e2d0, 0.3, 0.4)); dial.rotation.x = PI / 2; dial.position.set(0.3 + g2 * 0.5, 1.8, s * 1.35); rig.add(dial); }
      for (let d2 = 0; d2 < 3; d2++) { const door = new T.Mesh(new T.BoxGeometry(1.5, 1.1, 0.08), k.flat(0x7c1412, 0.4, 0.4)); door.position.set(-1.6 - d2 * 1.6, 1.6, s * 1.3); rig.add(door); const handle = new T.Mesh(new T.BoxGeometry(1.2, 0.06, 0.06), chrome); handle.position.set(-1.6 - d2 * 1.6, 1.12, s * 1.37); rig.add(handle); }
      const intake = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 0.3, 12), chrome); intake.rotation.x = PI / 2; intake.position.set(1.0, 0.95, s * 1.3); rig.add(intake);
      const step = new T.Mesh(new T.BoxGeometry(5.6, 0.1, 0.45), chrome); step.position.set(-1.2, 0.86, s * 1.42); rig.add(step);
    }
    const dash = k.sign('55', 0.7, 0.55, FX - 3.55, 2.0, 1.29, 'transparent', '#f0e6c8', 150, 0); dash.position.z = 1.3;
    const dashB = k.sign('55', 0.7, 0.55, FX - 3.55, 2.0, -1.29, 'transparent', '#f0e6c8', 150, PI);
    void dash; void dashB;
    const deckLight = new T.Mesh(new T.BoxGeometry(0.5, 0.18, 0.3), warm); deckLight.position.set(-4.6, 2.6, 0); rig.add(deckLight);
    const beacons: T.Mesh[] = [];
    for (const s of [-1, 1]) { const b = new T.Mesh(new T.BoxGeometry(0.5, 0.22, 0.34), beaconRed); b.position.set(3.4, 2.72, s * 0.9); rig.add(b); beacons.push(b); }
    const bar = new T.Mesh(new T.BoxGeometry(1.7, 0.1, 0.3), dark); bar.position.set(3.4, 2.62, 0); rig.add(bar);
    const headA = new T.Mesh(new T.SphereGeometry(0.17, 10, 8), warm), headB = new T.Mesh(new T.SphereGeometry(0.17, 10, 8), warm);
    headA.position.set(4.6, 1.5, 0.8); headB.position.set(4.6, 1.5, -0.8); rig.add(headA); rig.add(headB);
    k.add(rig);
    k.block(FX - 12.2, FX - 1.4, -1.6, 1.6);
    const beaconLight = new T.PointLight(0xff3020, 0, 26, 2); beaconLight.position.set(FX - 3.2, 3.2, 0); k.add(beaconLight);
    const spill = k.wash(FX + 3.5, 0.06, 0, 0, 12, 14, 0xff3020, 0.0);
    spill.rotation.x = -PI / 2;
    /* the gear wall, the boots, the helmets, the housewatch desk, the gong */
    const coats: T.Group[] = [];
    for (let i = 0; i < 7; i++) {
      const z = -8.4 + i * 2.8, x = LX + 1.1;
      const g = new T.Group(); g.position.set(x, 3.1, z);
      const coat = new T.Mesh(new T.BoxGeometry(0.34, 1.5, 0.95), k.flat(0x2b3138, 0, 0.85)); g.add(coat);
      const band = new T.Mesh(new T.BoxGeometry(0.36, 0.16, 0.97), k.flat(0xd8e24a, 0.2, 0.5)); band.position.y = -0.3; g.add(band);
      k.add(g); coats.push(g);
      k.box(0.4, 0.5, 0.92, x, 0.25, z, k.flat(0x1a1c20, 0.2, 0.8));
      k.box(0.5, 0.26, 0.6, x, 4.3, z, i % 2 ? k.flat(0xd8d2c4, 0.2, 0.5) : k.flat(0x9c1a18, 0.2, 0.5));
      k.beam(v(x - 0.3, 4.0, z), v(x + 0.1, 4.0, z), 0.03, steel, 4);
    }
    k.block(LX, LX + 1.6, -10, 10);
    k.box(2.2, 1.1, 1.3, LX + 3.2, 0.55, 6.6, k.pbr('ecDesk', X.planks(0x6a4632, 6, 34), 1.4, { roughness: 0.5 }));
    k.box(0.28, 0.42, 0.3, LX + 3.2, 1.3, 6.6, lamp);
    k.point(LX + 3.2, 1.6, 6.6, 0x9ad8a8, 7, 5);
    k.keepOut.push({ x: LX + 3.2, z: 6.6, r: 1.5 });
    k.prop('bell', LX + 2.0, 4.4, 9.4, { height: 0.9 });
    const striker = k.mesh(new T.SphereGeometry(0.1, 9, 7), brass, LX + 2.6, 4.4, 9.4, true);
    k.sign('ENGINE 55  ·  IN SERVICE', 2.6, 0.45, LX + 0.42, 5.2, 4.0, '#14171c', '#e2d8bc', 62, PI / 2);
    k.sign('WE NEVER CLOSE', 2.2, 0.4, LX + 0.42, 4.6, 4.0, '#9c1a18', '#f0e2c0', 58, PI / 2);
    /* the door: a roller shutter that goes up on the run and comes back down after */
    const DH = 5.0, DW = 6.2;
    const slat = k.pbr('ecSlat', X.steel(0x8e9399), 3.2, { metalness: 0.55, roughness: 0.5 });
    const curtain = k.mesh(new T.BoxGeometry(0.16, DH, DW), slat, FX - 0.34, DH / 2, 0, true);
    k.cyl(0.42, DW + 0.5, FX - 0.34, DH + 0.5, 0, dark, 0.42, 12).rotation.x = PI / 2;
    /* the run cycle: gong, beacons, door, spill on the street, then quiet */
    if (!ctx.reduced) {
      k.ticks.push((t) => {
        const cyc = (t % 24) / 24;
        const open = cyc < 0.08 ? 0 : cyc < 0.2 ? (cyc - 0.08) / 0.12 : cyc < 0.62 ? 1 : cyc < 0.74 ? 1 - (cyc - 0.62) / 0.12 : 0;
        const alive = cyc > 0.02 && cyc < 0.78;
        const h = Math.max(0.04, DH * (1 - open));
        curtain.scale.y = h / DH;
        curtain.position.y = DH - h / 2;
        const turn = alive ? Math.abs(Math.sin(t * 5.2)) : 0;
        beacons[0].scale.setScalar(0.5 + turn * 1.1);
        beacons[1].scale.setScalar(0.5 + (1 - turn) * 1.1);
        beaconLight.intensity = alive ? 40 + 90 * turn : 0;
        (spill.material as T.MeshBasicMaterial).opacity = alive ? 0.12 + 0.3 * turn * open : 0;
        striker.position.z = 9.4 + (cyc < 0.06 ? Math.sin(t * 22) * 0.16 : 0);
        coats.forEach((g, i) => { g.rotation.z = Math.sin(t * 1.1 + i) * (alive ? 0.06 : 0.02); });
        headA.visible = headB.visible = alive;
      });
      k.crowd([v(RX - 9.0, 0, 40), v(RX - 9.0, 0, -40)], 14, { seed: 81, speed: 0.7, spread: 1.6 });
      k.crowd([v(RX + 9.0, 0, -40), v(RX + 9.0, 0, 40)], 10, { seed: 82, speed: 0.7, spread: 1.5 });
      vapour(k, [v(FX - 10.5, 1.0, -1.1)], 8, { rise: 2.6, spread: 0.7, size: 0.13, opacity: 0.09, colour: 0xc8ccd2, seed: 23, speed: 0.22, animate: true });
    }
    /* the works: both bay walls, facing the apparatus floor, and the back wall over the bench */
    const mounts: Mount[] = [];
    for (let i = 0; i < 6; i++) { const z = -8.6 + i * 3.4; mounts.push({ position: v(LX + 0.42, 3.4, z), rotation: PI / 2, target: v(LX + 4.6, 3, z), width: 2.4, height: 1.7, style: 'black', wash: true }); }
    for (const dz of [-1, 1]) for (let i = 0; i < 5; i++) { const x = FX - 3.6 - i * 3.8; mounts.push({ position: v(x, 3.5, dz * (D / 2 - 0.42)), rotation: dz > 0 ? PI : 0, target: v(x, 3, dz * 4.6), width: 2.8, height: 1.9, style: 'black', wash: true }); }
    k.censusWall({ x: LX + 6.5, y: 5.6, z: -D / 2 + 0.43, rotY: 0, cols: 16, rows: 3, tile: 0.55, gap: 0.05, start: ctx.wallStart(900, 48), pieces: ctx.all, backing: tile });
    /* what the house knows */
    k.egg(v(FX - 1.2, 5.2, 0), { id: 'robertson-1899', title: 'One firehouse, one architect', year: '1898 to 1899', text: 'R. H. Robertson drew this house in 1898 and it was finished in March 1899, eight months later. It was the only firehouse he ever designed, in a career otherwise spent on churches, offices and mansions.', clue: 'The name of the company is carved where a church would put a saint.', source: { name: 'Landmarks Preservation Commission, Fire Engine Company 55', url: 'https://s-media.nyc.gov/agencies/lpc/lp/1987.pdf' } }, { r: 2.2 });
    k.egg(v(FX - 8, 4.6, 6.4), { id: 'guastavino-tile', title: 'Tile you can hose down', text: 'The ground floor was lined with Guastavino glazed tile arches, handsome and, more to the point, washable. A firehouse floor gets hosed out after every run.', clue: 'Look up at the curve of the ceiling, then at what it is made of.', source: { name: 'Landmarks Preservation Commission, Fire Engine Company 55', url: 'https://s-media.nyc.gov/agencies/lpc/lp/1987.pdf' } }, { r: 2.6 });
    k.egg(v(LX + 4.2, 3.4, -7.4), { id: 'the-pole', title: 'The pole', text: 'The sliding pole is a New York idea carried everywhere: a firefighter beats the stairs by seconds, and seconds are the whole argument. The brass stays polished because hands are on it every day.', clue: 'The fastest way down is not the stairs.', source: { name: 'New York City Fire Museum', url: 'https://www.nycfiremuseum.org/' } }, { r: 1.4 });
    k.egg(v(LX + 2.0, 4.4, 9.4), { id: 'organized-1887', title: 'Organized 1887', year: '1887', text: 'Engine Company 55 was organized on June 4, 1887 at quarters on Lafayette Street, and moved into this purpose built house twelve years later. It has run out of this door ever since.', clue: 'Something brass by the desk is older than the building.', source: { name: 'Landmarks Preservation Commission, Fire Engine Company 55', url: 'https://s-media.nyc.gov/agencies/lpc/lp/1987.pdf' } }, { r: 1.6 });
    k.egg(v(LX + 1.1, 3.6, 0.6), { id: 'the-gear', title: 'Boots first', text: 'Gear hangs in the order a person puts it on, boots open under the coat, helmet above. Dressed from a dead sleep, a firefighter is on the rig in well under a minute.', clue: 'The wall is a set of instructions, read from the floor up.', source: { name: 'New York City Fire Museum', url: 'https://www.nycfiremuseum.org/' } }, { r: 2 });
    return { mounts, spawn: v(FX - 22, 3, -8.2), look: v(FX - 5, 3.2, 1.5), eye: 3, bounds: [LX + 1.8, RX + 6, -D / 2 + 1.0, D / 2 - 1.0], style: 'black' };
  },
};
