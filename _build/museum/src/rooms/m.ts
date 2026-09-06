/* Rooms 57 to 61: Rockaway Beach, Green-Wood, the Domino refinery, the Staten Island boat graveyard, the Intrepid. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront } from './f';

const PI = Math.PI;

/* ---------------- 57 ROCKAWAY BEACH ---------------- */
export const rockaway: RoomDef = {
  id: 'rockaway',
  name: 'Surf at the end of the A',
  area: 'ROCKAWAY BEACH',
  mood: 'Sunrise swell',
  color: '#f0c890',
  description: 'The concrete boardwalk, the lifeguard chairs, the surfers waiting in the swell, the A train rolling in on the trestle behind the dunes, the works on the beach shacks.',
  signatures: 'The long new concrete boardwalk with its curved shade shelters, the numbered lifeguard chairs, the dune grass and fences, the surf break at the jetties, the elevated A train and the low bungalows.',
  build(k, ctx) {
    k.sky({ top: 0x6a9ad8, horizon: 0xffd8a8, ground: 0x9a8a70, fog: 0.0016, sun: { az: 1.55, el: 0.1, color: 0xffc080, size: 22 }, haze: 0.4, env: 0.95 });
    k.hemi(0xfff0e0, 0x6a5a48, 0.9);
    k.sun(0xffc890, 2.4, 90, 18, -20, true, 120);
    const conc = k.pbr('rbBoardwalk', X.concrete(0xc8c0b0, 69), 0.3, { roughness: 0.85 }),
      sand = k.pbr('rbSand', X.concrete(0xe3d5b0, 70), 0.08, { roughness: 1 }),
      wood = k.pbr('rbWood', X.planks(0xd8c8a8, 4, 142, 0.3), 0.8),
      white = k.flat(0xf4f0e8, 0, 0.7),
      orange = k.flat(0xf08a2a, 0, 0.7),
      steel = k.flat(0x8c98a4, 0.9, 0.3),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      iron = k.flat(0x2a2e32, 0.7, 0.45),
      foam = k.flat(0xffffff, 0, 0.6, { transparent: true, opacity: 0.7 }),
      grassM = k.flat(0xb8a868, 0, 0.9);
    // the beach and the ocean with a breaking line of foam that rolls in, the jetties
    k.box(400, 0.4, 120, 0, -0.2, -70, sand);
    k.water({ y: -0.6, color: 0x2a6a7a, w: 600, d: 300, z: -260, amp: 1.6 });
    const foamLines: T.Mesh[] = [];
    for (let i = 0; i < 4; i++) { const f = k.mesh(new T.BoxGeometry(320, 0.1, 2.4 + i * 0.8), foam, 0, -0.4, -140 - i * 14, true); foamLines.push(f); }
    if (!ctx.reduced) k.ticks.push((t) => foamLines.forEach((f, i) => { const u = ((t * 0.12 + i * 0.25) % 1); f.position.z = -190 + u * 60; (f.material as T.MeshStandardMaterial).opacity = 0.8 * (1 - u) * Math.min(1, u * 4); f.scale.x = 0.7 + 0.3 * Math.sin(t * 0.5 + i); }));
    for (const x of [-120, 120]) for (let i = 0; i < 14; i++) k.box(3, 1.4, 5, x + (i % 2) * 1.2, 0.2, -110 - i * 6, k.pbr('rbJetty', X.ashlar(0x5a5650, 143, 1), 0.2));
    const surfers: T.Group[] = [];
    for (let i = 0; i < 9; i++) { const g = new T.Group(); const board = new T.Mesh(new T.BoxGeometry(0.5, 0.08, 2.2), i % 2 ? white : orange); g.add(board); const body = new T.Mesh(new T.CapsuleGeometry(0.16, 0.5, 3, 6), dark); body.position.y = 0.45; g.add(body); g.position.set(-80 + i * 20, -0.4, -150 - (i % 3) * 8); k.add(g); surfers.push(g); }
    if (!ctx.reduced) k.ticks.push((t) => surfers.forEach((g, i) => { g.position.y = -0.4 + 0.5 * Math.sin(t * 0.9 + i); g.rotation.x = 0.15 * Math.sin(t * 0.9 + i + 1); }));
    // the boardwalk, the shade shelters, the dunes with their fences and grass
    k.box(400, 0.5, 14, 0, 0.25, 0, conc);
    for (const s of [-1, 1]) k.rail(0, s * 6.8, 400, steel, 1.05, 'x', 2.4);
    for (let i = 0; i < 5; i++) { const x = -160 + i * 80; for (let j = 0; j <= 16; j++) { const a = (j / 16) * PI; const slat = k.box(0.5, 0.06, 9, x + Math.cos(a) * 5.6, 4.6 + Math.sin(a) * 2.6, 0, wood); slat.rotation.z = a - PI / 2 + PI / 2 * 0; slat.rotation.z = Math.atan2(Math.cos(a) * 2.6, -Math.sin(a) * 5.6); } for (const dx of [-4.6, 4.6]) for (const dz of [-3.4, 3.4]) k.box(0.3, 4.4, 0.3, x + dx, 2.7, dz, steel); k.bench(x - 2, 4.4, 0, wood, iron, 2.4); k.bench(x + 2, 4.4, 0, wood, iron, 2.4); }
    for (let i = 0; i < 12; i++) k.box(2.4, 0.3, 1.0, 0, 0.25 - i * 0.04, -7.5 - i * 1.0, conc);
    for (let x = -190; x <= 190; x += 1.4) { for (const z of [-12, -22]) k.box(0.08, 1.1, 0.08, x, 0.55, z, wood); k.box(1.4, 0.03, 0.03, x + 0.7, 0.9, -12, wood); }
    const rnd = X.mulberry(57);
    for (let i = 0; i < 400; i++) { const x = -190 + rnd() * 380, z = -13 - rnd() * 8; if (Math.abs(x) < 2) continue; k.beam(v(x, 0, z), v(x + (rnd() - 0.5) * 0.4, 0.5 + rnd() * 0.5, z + (rnd() - 0.5) * 0.4), 0.015, grassM, 3); }
    // lifeguard chairs, the beach shacks, people
    for (let i = 0; i < 5; i++) { const x = -140 + i * 70, z = -80; for (const dx of [-0.9, 0.9]) for (const dz of [-0.6, 0.6]) k.beam(v(x + dx * 1.4, 0, z + dz * 1.4), v(x + dx, 2.6, z + dz), 0.06, white, 4); k.box(2.0, 0.1, 1.4, x, 2.6, z, white); k.box(2.0, 0.9, 0.1, x, 3.1, z - 0.65, white); k.box(0.1, 0.9, 1.4, x - 0.95, 3.1, z, orange); k.box(0.1, 0.9, 1.4, x + 0.95, 3.1, z, orange); k.sign(String(i * 20 + 90), 0.8, 0.5, x, 3.1, z - 0.72, '#f4f0e8', '#f08a2a', 60, PI); k.keepOut.push({ x, z, r: 1.6 }); }
    for (let i = 0; i < 3; i++) { const x = -60 + i * 60; k.box(10, 3.6, 6, x, 1.8 + 0.5, 10.5, i % 2 ? white : k.flat(0x3a8ab0, 0, 0.7)); k.box(11, 0.3, 7, x, 4.2, 10.5, wood); k.box(8, 1.0, 0.3, x, 2.0, 7.4, wood); k.block(x - 5, x + 5, 7.3, 13.6); k.sign(['TACOS  ·  ICED COFFEE', 'SURF RENTAL', 'CLAMS  ·  BEER'][i], 6, 0.7, x, 3.4, 7.3, '#1a1c20', '#f4f0e8', 70, PI, { border: true }); }
    k.crowd([v(-190, 0.5, 2), v(-80, 0.5, 1), v(0, 0.5, 2), v(80, 0.5, 1), v(190, 0.5, 2)], 40, { seed: 58, speed: 1.0, spread: 6, animate: !ctx.reduced, colors: [0xf4f0e8, 0xf08a2a, 0x3a8ab0, 0xd83a6a, 0x24262c, 0xf1c531] });
    k.crowd([v(-100, 0, -40), v(-40, 0, -60), v(20, 0, -50), v(80, 0, -66)], 20, { seed: 59, speed: 0.5, spread: 8, animate: !ctx.reduced, colors: [0xf4f0e8, 0xf08a2a, 0x3a8ab0, 0xd83a6a, 0xf1c531] });
    // the A train on its trestle behind the boardwalk, the bungalows
    const TZ = 40, TY = 8;
    for (let x = -200; x <= 200; x += 12) k.box(1.0, TY, 1.0, x, TY / 2, TZ, iron);
    k.box(420, 1.0, 6, 0, TY + 0.5, TZ, k.pbr('rbTrestle', X.steel(0x3a4048, true, 144), 0.6, { metalness: 0.7 }));
    for (const dx of [-1.5, 1.5]) k.box(420, 0.14, 0.12, 0, TY + 1.07, TZ + dx, k.flat(0x8a8a90, 0.8, 0.4));
    const train = new T.Group();
    for (let c = 0; c < 6; c++) { const m = new T.Mesh(new T.BoxGeometry(15, 3.2, 2.7), k.pbr('carQ', X.steel(0x9aa5ab, false, 73), 0.35, { metalness: 0.9, roughness: 0.3 })); m.position.set(c * 16, 1.6, 0); train.add(m); const stripe = new T.Mesh(new T.BoxGeometry(15, 0.3, 2.72), k.flat(0x1e56b4, 0.3, 0.5)); stripe.position.set(c * 16, 2.9, 0); train.add(stripe); }
    train.position.set(-260, TY + 1.1, TZ);
    k.add(train);
    if (!ctx.reduced) k.ticks.push((t) => { train.position.x = -300 + ((t * 9) % 620); });
    for (let i = 0; i < 20; i++) { const x = -200 + i * 21 + (i % 2) * 4; k.box(8, 4.5, 8, x, 2.25, 62, [k.flat(0xe6e2da, 0, 0.8), k.flat(0xb8d0e0, 0, 0.8), k.flat(0xe8c8a0, 0, 0.8)][i % 3]); k.mesh(new T.ConeGeometry(6.4, 2.6, 4), k.flat(0x4a4a48, 0, 0.9), x, 5.8, 62).rotation.y = PI / 4; }
    k.skyline({ z: -600, count: 20, spacing: 14, scale: 1.0, base: -0.6, seed: 145, lit: 0.1, glow: 0.2, tint: 0xa8a8b0, rows: 1 });
    k.censusWall({ x: 0, y: 2.8, z: 13.6, rotY: PI, cols: 30, rows: 3, tile: 0.55, gap: 0.05, start: ctx.wallStart(3300, 90), pieces: ctx.all, backing: dark });
    k.box(18, 5, 0.4, 0, 2.6, 13.8, white);
    // the works: the shack fronts, the shelter posts, panels on the dune fence line, the lifeguard chair backs
    const mounts: Mount[] = [];
    for (let i = 0; i < 3; i++) { const x = -60 + i * 60; for (const dx of [-3, 3]) mounts.push({ position: v(x + dx, 2.2, 7.28), rotation: PI, target: v(x + dx, 2, 0), width: 3.0, height: 1.8, style: 'white', wash: false }); }
    for (let i = 0; i < 5; i++) { const x = -160 + i * 80; for (const s of [-1, 1]) { k.box(0.16, 2.2, 3.4, x + s * 5.4, 2.4, 0, white); mounts.push({ position: v(x + s * 5.3, 2.5, 0), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(x, 2.5, 0), width: 3.0, height: 1.8, style: 'white', wash: false }); } }
    for (let i = 0; i < 6; i++) { const x = -125 + i * 50; k.box(3.6, 2.4, 0.16, x, 1.7, -7.2, wood); mounts.push({ position: v(x, 1.8, -7.1), rotation: 0, target: v(x, 2, 0), width: 3.2, height: 1.9, style: 'white', wash: false }); }
    return { mounts, spawn: v(12, 3.5, 4), look: v(12, 1.5, -160), eye: 3, bounds: [-190, 190, -100, 7], style: 'white', floorY: (x, z) => { void x; if (z > -7.5 && z < 7) return 0.5; if (z <= -7.5 && z > -19.5) return Math.max(0, 0.5 - ((-7.5 - z) / 12) * 0.5); return 0; } };
  },
};

/* ---------------- 58 GREEN-WOOD ---------------- */
export const greenwood: RoomDef = {
  id: 'greenwood',
  name: 'The gothic gate',
  area: 'GREEN-WOOD CEMETERY',
  mood: 'Autumn gold',
  color: '#c8a050',
  description: 'The brownstone gothic gate with its parrots, then the hills of the old cemetery: monuments, mausoleums, the harbor glimpsed from the highest ground, the works on the vault doors.',
  signatures: 'The 1861 brownstone gatehouse with three spires and the monk parakeet nests, rolling glacial hills of obelisks and angels, granite mausoleums set into slopes, ancient trees in fall color, the harbor view from Battle Hill.',
  build(k, ctx) {
    k.sky({ top: 0x6a94cc, horizon: 0xf4dcb0, ground: 0x4a4a38, fog: 0.002, sun: { az: 4.0, el: 0.4, color: 0xffe0b0, size: 14 }, env: 0.95 });
    k.hemi(0xf6f0e6, 0x3a3a2a, 0.9);
    k.sun(0xffe0b8, 2.2, -40, 40, 50, true, 120);
    const brown = k.pbr('gwBrownstone', X.ashlar(0x6a4a3a, 146, 3), 0.2, { roughness: 0.9 }),
      granite = k.pbr('gwGranite', X.ashlar(0x8a8a86, 147, 2), 0.25),
      marble = k.pbr('gwMarble', X.marble(0xd8d4cc, 0x9a948a, 12), 0.5),
      lawn = k.pbr('gwLawn', X.grass(0x5a7a3a, 71), 0.06),
      pathM = k.pbr('gwPath', X.asphalt(0x3a3a3c), 0.11),
      iron = k.flat(0x1f242a, 0.7, 0.45),
      bronze = k.flat(0x4a5a4a, 0.6, 0.5),
      greenP = k.flat(0x5ad84a, 0, 0.8),
      twig = k.flat(0x6a5a3a, 0, 0.9);
    const rnd = X.mulberry(58);
    // the hills: a lawn plane with a heightfield of glacial knolls, the winding drive
    const H = (x: number, z: number) => 3 * Math.exp(-((x - 30) ** 2 + (z + 60) ** 2) / 900) + 6 * Math.exp(-((x + 40) ** 2 + (z + 90) ** 2) / 1600) + 9 * Math.exp(-((x - 10) ** 2 + (z + 150) ** 2) / 2200) + 1.5 * Math.sin(x * 0.05) * Math.cos(z * 0.06);
    const g = new T.PlaneGeometry(240, 240, 96, 96); g.rotateX(-PI / 2); g.translate(0, 0, -90);
    const pa = g.attributes.position; for (let i = 0; i < pa.count; i++) pa.setY(i, H(pa.getX(i), pa.getZ(i)) - 0.05); g.computeVertexNormals();
    k.mesh(g, lawn);
    const drive = [v(0, 0, 8), v(0, 0, -10), v(-8, 0, -30), v(-4, 0, -55), v(10, 0, -75), v(0, 0, -100), v(-14, 0, -120), v(-4, 0, -140), v(12, 0, -152)];
    const dc = k.spline(drive, false, 0.5); const dp = dc.getSpacedPoints(160);
    for (let i = 0; i < dp.length - 1; i++) { const a = dp[i], b = dp[i + 1]; const m = a.clone().lerp(b, 0.5); const seg = k.box(4.6, 0.12, a.distanceTo(b) + 0.4, m.x, H(m.x, m.z) + 0.02, m.z, pathM); seg.rotation.y = Math.atan2(b.x - a.x, b.z - a.z); }
    // the gate: three spired brownstone gothic, two arched carriage ways, the parakeet nests in the spires
    const GZ = 0;
    k.box(34, 8, 8, 0, 4, GZ, brown);
    for (const x of [-12, 0, 12]) { k.box(5, 14, 6, x, 7, GZ, brown); k.mesh(new T.ConeGeometry(3.2, x === 0 ? 14 : 9, 4), brown, x, 14 + (x === 0 ? 7 : 4.5), GZ).rotation.y = PI / 4; for (let i = 0; i < 4; i++) { const a = (i / 4) * PI * 2 + PI / 4; k.mesh(new T.ConeGeometry(0.6, 2.4, 4), brown, x + Math.cos(a) * 2.2, 15, GZ + Math.sin(a) * 2.2); } }
    for (const x of [-6, 6]) { k.arch(5, 6.5, 8, x, 0, GZ, brown, true, 0.85); }
    k.block(-17, -8.6, GZ - 4, GZ + 4); k.block(-3.4, 3.4, GZ - 4, GZ + 4); k.block(8.6, 17, GZ - 4, GZ + 4);
    for (const x of [-12, 12]) for (let i = 0; i < 3; i++) { const a = (i / 3) * PI * 2; k.mesh(new T.SphereGeometry(0.8, 8, 6), twig, x + Math.cos(a) * 2.6, 13 + i * 0.6, GZ + Math.sin(a) * 2.6).scale.set(1, 0.7, 1); for (let j = 0; j < 3; j++) k.sphere(0.1, x + Math.cos(a) * 2.6 + (rnd() - 0.5) * 1.2, 13.8 + i * 0.6, GZ + Math.sin(a) * 2.6 + (rnd() - 0.5), greenP, 5); }
    const birds: T.Mesh[] = [];
    for (let i = 0; i < 10; i++) { const b = k.mesh(new T.ConeGeometry(0.12, 0.5, 4), greenP, 0, 16, GZ, true); b.rotation.x = PI / 2; birds.push(b); }
    if (!ctx.reduced) k.ticks.push((t) => birds.forEach((b, i) => { const a = t * 0.6 + i * 0.63; const r = 8 + 4 * Math.sin(t * 0.3 + i); b.position.set(Math.cos(a) * r, 15 + 2 * Math.sin(t + i), GZ + Math.sin(a) * r); b.rotation.y = -a; }));
    k.box(60, 0.3, 12, 0, 0.05, GZ + 12, k.pbr('gwCobble', X.cobble(0x6f6c68, 72), 0.9));
    street(k, { w: 16, len: 100, z: GZ + 26, x: 0 });
    blockFront(k, { x: 40, z0: GZ + 70, count: 6, face: -1, seed: 148, h: [10, 16] });
    k.sign('GREEN-WOOD  ·  1838', 8, 0.8, 0, 9.2, GZ + 4.1, 'transparent', '#e8dcc0', 80, 0);
    // the monuments: instanced obelisks and headstones on the slopes, angels and urns, mausoleums cut into hills
    const obeliskG = new T.ConeGeometry(0.28, 4, 4); obeliskG.translate(0, 2, 0);
    const stoneG = new T.BoxGeometry(0.7, 1.0, 0.12); stoneG.translate(0, 0.5, 0);
    const ob: T.Matrix4[] = [], st: T.Matrix4[] = [];
    for (let i = 0; i < 900; i++) { const x = (rnd() - 0.5) * 220, z = -12 - rnd() * 200; const near = dp.some((p) => Math.hypot(p.x - x, p.z - z) < 3.4); if (near) continue; const y = H(x, z); const q = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), rnd() * 0.4 - 0.2); if (rnd() < 0.15) ob.push(new T.Matrix4().compose(v(x, y, z), q, new T.Vector3(1, 0.7 + rnd() * 0.8, 1))); else st.push(new T.Matrix4().compose(v(x, y, z), q, new T.Vector3(0.8 + rnd() * 0.5, 0.7 + rnd() * 0.6, 1))); }
    k.instances(obeliskG, granite, ob); k.instances(stoneG, marble, st);
    for (let i = 0; i < 8; i++) { const x = (rnd() - 0.5) * 160, z = -30 - rnd() * 140; const y = H(x, z); k.box(1.2, 1.2, 1.2, x, y + 0.6, z, granite); k.mesh(new T.ConeGeometry(0.5, 1.6, 8), marble, x, y + 2.0, z); k.sphere(0.36, x, y + 3.0, z, marble, 8); k.keepOut.push({ x, z, r: 1.2 }); }
    const vaults: [number, number, number][] = [];
    for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2 + 0.3; const x = Math.cos(a) * (40 + (i % 3) * 20), z = -90 + Math.sin(a) * (40 + (i % 3) * 20); const y = H(x, z); const rot = Math.atan2(-x, -(z + 90)); k.box(5, 4.2, 5, x, y + 2.1, z, granite).rotation.y = rot; k.mesh(new T.ConeGeometry(3.8, 1.6, 4), granite, x, y + 5.0, z).rotation.y = rot + PI / 4; for (const s of [-1, 1]) { const c = k.column(0, 0, 0, 3.6, 0.3, granite, true); c.position.set(x + Math.cos(rot) * s * 1.8 + Math.sin(rot) * 2.6, y, z - Math.sin(rot) * s * 1.8 + Math.cos(rot) * 2.6); } k.keepOut.push({ x, z, r: 3.4 }); vaults.push([x, z, rot]); }
    for (let i = 0; i < 60; i++) { const x = (rnd() - 0.5) * 230, z = -12 - rnd() * 210; if (dp.some((p) => Math.hypot(p.x - x, p.z - z) < 5)) continue; k.tree(x, H(x, z) - 0.2, z, { kind: rnd() > 0.5 ? 'round' : 'bare', h: 6 + rnd() * 7, r: 3 + rnd() * 3, leaf: [0xc88a3a, 0xb8602a, 0xe8b040, 0x6a8a3a][Math.floor(rnd() * 4)], seed: i }); }
    // the harbor from the high ground
    k.water({ y: -12, color: 0x30506a, w: 800, d: 300, z: -420, amp: 1 });
    k.skyline({ z: -520, count: 40, spacing: 9, scale: 3.6, base: -12, seed: 149, lit: 0.2, glow: 0.4, tint: 0x7a8494, rows: 1, spires: true });
    k.censusWall({ x: 0, y: 4.2, z: GZ - 4.1, rotY: PI, cols: 26, rows: 3, tile: 0.55, gap: 0.05, start: ctx.wallStart(3800, 78), pieces: ctx.all, backing: iron });
    k.crowd(dp.filter((_, i) => i % 20 === 0).map((p) => v(p.x + 1.5, H(p.x, p.z), p.z)), 12, { seed: 60, speed: 0.6, spread: 1.4, animate: !ctx.reduced, colors: [0x24262c, 0x151517, 0x8a3a3a, 0x3a1a2a] });
    // the works: the vault doors (bronze framed), the gate's inner arcade, along the drive on granite stands
    const mounts: Mount[] = [];
    for (const [x, z, rot] of vaults) { const fx = x + Math.sin(rot) * 2.56, fz = z + Math.cos(rot) * 2.56; mounts.push({ position: v(fx, H(x, z) + 2.0, fz), rotation: rot, target: v(x + Math.sin(rot) * 10, H(x, z) + 2, z + Math.cos(rot) * 10), width: 2.2, height: 2.6, style: 'black', wash: false }); }
    for (let i = 0; i < 6; i++) { const p = dp[20 + i * 22]; const s = i % 2 ? 1 : -1; const x = p.x + s * 3.4, z = p.z; const y = H(x, z); k.box(3.2, 2.4, 0.3, x, y + 1.6, z, granite); mounts.push({ position: v(x, y + 1.7, z + 0.18), rotation: 0, target: v(p.x, y + 2, p.z + 4), width: 2.8, height: 1.7, style: 'black', wash: false }); }
    for (const x of [-6, 6]) mounts.push({ position: v(x, 4.6, GZ - 4.1), rotation: PI, target: v(x, 3, GZ - 12), width: 3.6, height: 2.1, style: 'black', wash: false });
    for (const x of [-16.8, 16.8]) mounts.push({ position: v(x, 4.0, GZ), rotation: x < 0 ? -PI / 2 : PI / 2, target: v(x * 1.6, 3, GZ), width: 4.2, height: 2.5, style: 'black', wash: false });
    return { mounts, spawn: v(0, 3, GZ + 34), look: v(0, 10, GZ), eye: 3, bounds: [-110, 110, -210, GZ + 38], style: 'black', floorY: (x, z) => (z < GZ - 4 ? H(x, z) : 0) };
  },
};

/* ---------------- 59 THE DOMINO REFINERY ---------------- */
export const domino: RoomDef = {
  id: 'domino',
  name: 'The refinery',
  area: 'DOMINO PARK',
  mood: 'Industrial gold',
  color: '#d88a4a',
  description: 'The brick shell of the sugar refinery on the Williamsburg waterfront, a glass building grown inside it, the syrup tanks and gantry cranes in the park, the bridge and the skyline over the river.',
  signatures: 'The 1880s brick refinery with its round arched windows and the great smokestack, the modern glass vault rising within the shell, the elevated walkway over the park, the salvaged syrup tanks and cranes, the Williamsburg Bridge.',
  build(k, ctx) {
    k.sky({ top: 0x5a86c8, horizon: 0xf4c890, ground: 0x3a3a34, fog: 0.0018, sun: { az: 4.7, el: 0.18, color: 0xffc078, size: 20 }, haze: 0.4, env: 0.9 });
    k.hemi(0xffe4c8, 0x3a3028, 0.8);
    k.sun(0xffc890, 2.2, -80, 26, -20, true, 120);
    const brick = k.pbr('domBrick', X.brick(0x7a4a3a, 150), 0.28),
      brickD = k.pbr('domBrickD', X.brick(0x5a3a2e, 151), 0.28),
      glass = k.glass(0xdcecf6, 0.14, 0.04),
      steel = k.pbr('domSteel', X.steel(0x3a4048, true, 152), 0.6, { metalness: 0.7, roughness: 0.5 }),
      rust = k.pbr('domRust', X.steel(0x7a4a2a, true, 153), 0.5, { metalness: 0.5, roughness: 0.7 }),
      teal = k.flat(0x2a8a8a, 0.2, 0.6),
      pave = k.pbr('domPave', X.pavers(0x8e8b84, 73), 0.4),
      lawn = k.pbr('domLawn', X.grass(0x4a7a3a, 74), 0.06),
      deck = k.pbr('domDeck', X.boardwalk(0x8a6a48), 0.5),
      dark = k.flat(0x1a1c20, 0.5, 0.6);
    // the river and Manhattan, the bridge to the south, the park along the water
    k.water({ y: -1.6, color: 0x2e4a5c, w: 700, d: 500, x: -300, z: 0, amp: 1.0 });
    k.skyline({ z: 0, count: 20, spacing: 6, scale: 4.6, base: -1.6, seed: 154, lit: 0.4, glow: 1.0, tint: 0x3a4250, spires: true, x: -540 });
    for (const x of [-120, -240]) { for (const s of [-1, 1]) k.box(4, 60, 4, x, 28, 160 + s * 12, steel); k.box(30, 3, 4, x, 58, 160, steel); }
    for (let x = -300; x <= -40; x += 6) { k.box(6, 2, 24, x, 20, 160, steel); k.beam(v(x, 21, 148), v(x, 24 + Math.abs(Math.sin(x * 0.02)) * 30, 148), 0.08, steel, 4); }
    k.box(160, 0.4, 120, -40, -0.2, 40, lawn);
    k.box(160, 0.3, 14, -40, 0.05, -20, pave);
    k.box(14, 0.3, 120, -110, 0.05, 40, pave);
    // the refinery shell: a brick block with tiers of arched windows, the smokestack, the glass vault inside
    const RX = 20, RZ = 40, RW = 40, RD = 60, RH = 34;
    for (const s of [-1, 1]) { k.box(1.2, RH, RD, RX + s * RW / 2, RH / 2, RZ, brick); }
    k.box(RW, RH, 1.2, RX, RH / 2, RZ - RD / 2, brick);
    k.box(RW, RH, 1.2, RX, RH / 2, RZ + RD / 2, brick);
    for (let t = 0; t < 4; t++) { const y = 5 + t * 8; for (let i = 0; i < 6; i++) { const z = RZ - RD / 2 + 5 + i * 10; for (const s of [-1, 1]) { const a = k.arch(3, 6, 1.4, RX + s * RW / 2, y - 3, z, brickD, false, 0.7); a.rotation.y = PI / 2; k.box(0.1, 5.2, 2.6, RX + s * RW / 2, y - 0.4, z, glass); } } for (let i = 0; i < 4; i++) { const x = RX - RW / 2 + 5 + i * 10; for (const s of [-1, 1]) { k.arch(3, 6, 1.4, x, y - 3, RZ + s * RD / 2, brickD, false, 0.7); k.box(2.6, 5.2, 0.1, x, y - 0.4, RZ + s * RD / 2, glass); } } }
    k.moulding([[0, 0], [0.8, 0], [0.9, 0.3], [0.5, 0.5], [0.7, 0.8], [0, 1.0]], RW + 2, RX, RH - 0.5, RZ - RD / 2 - 0.05, brickD, 0);
    k.arch(6, 9, 1.4, RX, 0, RZ - RD / 2, brickD, false, 0.85);
    k.block(RX - RW / 2 - 0.6, RX - 3.2, RZ - RD / 2 - 0.6, RZ - RD / 2 + 0.6); k.block(RX + 3.2, RX + RW / 2 + 0.6, RZ - RD / 2 - 0.6, RZ - RD / 2 + 0.6);
    for (const s of [-1, 1]) k.block(RX + s * RW / 2 - 0.6, RX + s * RW / 2 + 0.6, RZ - RD / 2, RZ + RD / 2);
    k.block(RX - RW / 2, RX + RW / 2, RZ + RD / 2 - 0.6, RZ + RD / 2 + 0.6);
    k.cyl(3.2, 60, RX + RW / 2 + 8, 30, RZ + RD / 2 - 6, brick, 3.8, 24);
    k.box(RW - 4, 0.4, RD - 4, RX, 0.2, RZ, k.pbr('domFloor', X.concrete(0x9a948a, 75), 0.3));
    // the glass vault within: a barrel of glass and steel ribs, set back from the brick, rising above the parapet
    for (let j = 0; j < 16; j++) { const a0 = (j / 16) * PI, a1 = ((j + 1) / 16) * PI, am = (a0 + a1) / 2, r = RW / 2 - 6; const seg = k.box(2 * r * Math.sin((a1 - a0) / 2) + 0.05, 0.1, RD - 10, RX + Math.cos(am) * r, 14 + Math.sin(am) * r, RZ, glass); seg.rotation.z = am + PI / 2; }
    for (let i = 0; i <= 12; i++) { const z = RZ - RD / 2 + 5 + i * ((RD - 10) / 12); const pts: T.Vector3[] = []; for (let j = 0; j <= 16; j++) { const a = (j / 16) * PI; pts.push(v(RX + Math.cos(a) * (RW / 2 - 6), 14 + Math.sin(a) * (RW / 2 - 6), z)); } k.curve(pts, 0.14, steel, 16); }
    for (let j = 0; j <= 16; j += 2) { const a = (j / 16) * PI; k.box(0.16, 0.16, RD - 10, RX + Math.cos(a) * (RW / 2 - 6), 14 + Math.sin(a) * (RW / 2 - 6), RZ, steel); }
    for (const s of [-1, 1]) { k.box(0.8, 14, RD - 10, RX + s * (RW / 2 - 6), 7, RZ, steel); k.block(RX + s * (RW / 2 - 6) - 0.5, RX + s * (RW / 2 - 6) + 0.5, RZ - RD / 2 + 5, RZ + RD / 2 - 5); }
    for (let f = 1; f < 4; f++) { for (const s of [-1, 1]) k.box(6, 0.3, RD - 10, RX + s * (RW / 2 - 9), f * 4.5, RZ, deck); }
    for (let i = 0; i < 6; i++) k.point(RX, 12, RZ - 25 + i * 10, 0xffe0b8, 30, 20);
    // the park: the elevated walkway on the old crane rails, the syrup tanks, the gantry cranes, the lawn
    const WY = 6;
    k.box(4, 0.4, 100, -60, WY, 30, deck);
    for (let z = -16; z <= 76; z += 8) for (const s of [-1, 1]) k.cyl(0.3, WY, -60 + s * 1.6, WY / 2, z, teal, 0.3, 8);
    k.rail(-62, 30, 100, teal, 1.05, 'z', 2); k.rail(-58, 30, 100, teal, 1.05, 'z', 2);
    for (let i = 0; i < 16; i++) k.box(4, 0.375, 1.0, -60, 0.19 + i * 0.375, 82 + i * 1.0 - 0.5, deck);
    for (const [x, z] of [[-90, 10], [-90, 30], [-90, 50], [-40, 90]]) { k.cyl(3.6, 9, x, 4.5, z, rust, 3.6, 20); k.cyl(3.8, 0.4, x, 9.2, z, rust, 3.8, 20); k.keepOut.push({ x, z, r: 4 }); }
    for (const z of [-4, 64]) { for (const s of [-1, 1]) k.box(1.2, 18, 1.2, -76 + s * 6, 9, z, teal); k.box(30, 1.6, 1.4, -70, 18, z, teal); k.box(1.4, 1.6, 6, -60, 18, z, teal); k.beam(v(-60, 17, z), v(-60, 12, z), 0.06, dark, 3); k.box(1.6, 1.2, 1.6, -60, 11.4, z, dark); }
    k.crowd([v(-110, 0, -18), v(-80, 0, -18), v(-40, 0, -18), v(0, 0, -18), v(2, 0, 10), v(-30, 0, 40), v(-110, 0, 70)], 30, { seed: 61, speed: 0.9, spread: 5, animate: !ctx.reduced });
    k.crowd([v(-60, WY + 0.2, -18), v(-60, WY + 0.2, 30), v(-60, WY + 0.2, 78)], 10, { seed: 62, speed: 0.8, spread: 1.6, animate: !ctx.reduced });
    k.censusWall({ x: RX, y: 4.2, z: RZ + RD / 2 - 0.66, rotY: PI, cols: 30, rows: 5, tile: 0.55, gap: 0.05, start: ctx.wallStart(6100, 150), pieces: ctx.all, backing: dark });
    k.sign('DOMINO  ·  SUGAR  ·  1882', 10, 0.9, RX, RH - 3, RZ - RD / 2 - 0.66, 'transparent', '#f4d8a8', 90, PI);
    // the works: the brick piers between the arches inside, the mezzanine edges, the walkway screens, the tank sides
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const z = RZ - RD / 2 + 10 + i * 10; mounts.push({ position: v(RX + s * (RW / 2 - 0.66), 3.6, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(RX + s * (RW / 2 - 8), 3, z), width: 4.4, height: 2.6, style: 'steel', wash: true }); }
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = RZ - 20 + i * 20; mounts.push({ position: v(RX + s * (RW / 2 - 6.42), 3.2, z), rotation: s < 0 ? -PI / 2 : PI / 2, target: v(RX, 3, z), width: 3.6, height: 2.1, style: 'steel', wash: false }); }
    for (let i = 0; i < 4; i++) { const z = 0 + i * 20; k.box(0.16, 2.2, 3.4, -62.2, WY + 1.6, z, teal); mounts.push({ position: v(-62.1, WY + 1.7, z), rotation: PI / 2, target: v(-56, WY + 2, z), width: 3.0, height: 1.8, style: 'steel', wash: false }); }
    for (const [x, z] of [[-90, 10], [-90, 30], [-90, 50]]) mounts.push({ position: v(x + 3.66, 4.6, z), rotation: PI / 2, target: v(x + 12, 4, z), width: 3.2, height: 3.2, style: 'none', wash: false, lookAt: v(x + 3.66, 4.6, z) });
    return { mounts, spawn: v(RX - 6, 3, RZ - RD / 2 - 44), look: v(RX, 18, RZ), eye: 3, bounds: [-118, RX + RW / 2 - 1, RZ - RD / 2 - 50, RZ + RD / 2 - 1], style: 'steel', floorY: (x, z) => { if (Math.abs(x + 60) < 2 && z > -20 && z < 82) return WY + 0.2; if (Math.abs(x + 60) < 2 && z >= 82 && z < 98) return Math.max(0, WY - ((z - 82) / 16) * WY); return 0; } };
  },
};

/* ---------------- 60 THE BOAT GRAVEYARD ---------------- */
export const boatgraveyard: RoomDef = {
  id: 'boatgraveyard',
  name: 'The ships in the marsh',
  area: 'THE ARTHUR KILL',
  mood: 'Fog on the kill',
  color: '#7a8a80',
  description: 'Staten Island\'s western shore: rusting hulls of tugs and ferries settled in the marsh grass, a kayak route through them, herons on the wrecks, the works on the wheelhouses.',
  signatures: 'Dozens of scuttled tugboats, barges and a ferry sunk to their decks in the tidal marsh, rust and peeling paint, cordgrass and mud at low tide, the New Jersey refineries and cranes across the water, fog.',
  build(k, ctx) {
    k.sky({ top: 0x9aa4ac, horizon: 0xc8ccc8, ground: 0x5a5e58, fog: 0.0035, sun: { az: 3.0, el: 0.5, color: 0xf0f0e8, size: 10 }, haze: 0.8, env: 0.6 });
    k.hemi(0xd8dce0, 0x3a4038, 0.8);
    k.sun(0xf4f0e8, 1.0, 20, 40, 20, true, 100);
    const rust = k.pbr('bgRust', X.steel(0x6a3a22, true, 155), 0.5, { metalness: 0.5, roughness: 0.8 }),
      rustD = k.pbr('bgRustD', X.steel(0x4a2a1a, true, 156), 0.5, { metalness: 0.4, roughness: 0.85 }),
      paint = k.pbr('bgPaint', X.steel(0x8a6a3a, false, 157), 0.6, { metalness: 0.3, roughness: 0.8 }),
      white = k.pbr('bgWhite', X.plaster(0xb8b4a8, 76), 0.4, { roughness: 0.9 }),
      wood = k.pbr('bgWood', X.planks(0x4a3a2a, 5, 158, 0.4), 1.0),
      mud = k.pbr('bgMud', X.concrete(0x4a4438, 77), 0.15, { roughness: 1 }),
      grassM = k.flat(0x8a8a58, 0, 0.9),
      yellow = k.flat(0xe8c040, 0, 0.6),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      heron = k.flat(0x8a8e92, 0, 0.8);
    const rnd = X.mulberry(60);
    // the kill: shallow water, mud flats, cordgrass, the industrial shore across
    k.water({ y: 0, color: 0x4a5e5a, w: 500, d: 500, amp: 0.3 });
    for (let i = 0; i < 14; i++) { const x = (rnd() - 0.5) * 200, z = (rnd() - 0.5) * 200; k.mesh(new T.CylinderGeometry(8 + rnd() * 10, 12 + rnd() * 12, 0.6, 12), mud, x, -0.1, z); }
    for (let i = 0; i < 1200; i++) { const x = (rnd() - 0.5) * 220, z = (rnd() - 0.5) * 220; if (Math.hypot(x, z) < 8) continue; k.beam(v(x, -0.2, z), v(x + (rnd() - 0.5) * 0.5, 0.6 + rnd() * 0.9, z + (rnd() - 0.5) * 0.5), 0.02, grassM, 3); }
    k.box(400, 4, 60, 0, 1, -170, mud);
    for (let i = 0; i < 10; i++) { const x = -160 + i * 36; k.cyl(6, 14 + (i % 3) * 6, x, 7 + (i % 3) * 3, -180, k.flat(0x8a8e90, 0.6, 0.5), 6, 16); if (i % 2) { k.box(1.2, 30, 1.2, x + 10, 15, -178, dark); k.box(20, 1, 1, x + 10, 30, -178, dark); } }
    k.cyl(1.4, 60, 60, 30, -190, k.flat(0x9a9a98, 0.5, 0.6), 1.8, 12); k.point(60, 61, -190, 0xff6a3a, 200, 60);
    // the wrecks: tugs, barges and one ferry, scattered and tilted, sunk to their decks
    const tug = (x: number, z: number, rot: number, tilt: number, mat: T.Material) => {
      const g = new T.Group(); g.position.set(x, -0.8, z); g.rotation.set(tilt, rot, tilt * 0.6);
      const hull = new T.Mesh(new T.BoxGeometry(6, 3.6, 18), mat); hull.position.y = 1.4; g.add(hull);
      const bow = new T.Mesh(new T.CylinderGeometry(3, 3, 3.6, 12, 1, false, 0, PI), mat); bow.position.set(0, 1.4, 9); bow.rotation.y = -PI / 2; g.add(bow);
      const house = new T.Mesh(new T.BoxGeometry(4.2, 2.6, 5), white); house.position.set(0, 4.5, -1); g.add(house);
      const wheel = new T.Mesh(new T.BoxGeometry(3.2, 2.2, 3.2), white); wheel.position.set(0, 6.9, -0.4); g.add(wheel);
      const stack = new T.Mesh(new T.CylinderGeometry(0.5, 0.6, 3.2, 10), rustD); stack.position.set(0, 7.2, -4); g.add(stack);
      for (const s of [-1, 1]) { const w = new T.Mesh(new T.PlaneGeometry(1.0, 0.8), dark); w.position.set(s * 1.61, 7.0, -0.4); w.rotation.y = s * PI / 2; g.add(w); }
      k.add(g); k.keepOut.push({ x, z, r: 9 });
      g.traverse((o) => { if (o instanceof T.Mesh) o.castShadow = ctx.quality === 'high'; });
      return g;
    };
    const wrecks: { x: number; z: number; rot: number; g: T.Group }[] = [];
    const spots: [number, number][] = [[-30, -20], [20, -36], [50, 10], [-60, 30], [10, 44], [-20, 70], [70, -60], [-80, -50], [40, 80], [-70, 90]];
    spots.forEach(([x, z], i) => { const rot = rnd() * PI * 2, tilt = (rnd() - 0.5) * 0.4; const g = tug(x, z, rot, tilt, [rust, rustD, paint][i % 3]); wrecks.push({ x, z, rot, g }); });
    for (const [x, z] of [[90, 40], [-100, 0], [30, -90]]) { const b = k.box(12, 3, 40, x, 0.2, z, rustD); b.rotation.set(0.05, rnd() * PI, 0.08); k.keepOut.push({ x, z, r: 20 }); }
    const FX = -20, FZ = -110;
    k.box(16, 5, 60, FX, 0.4, FZ, paint).rotation.z = 0.12;
    k.box(14, 4, 50, FX, 5, FZ, white).rotation.z = 0.12;
    for (let i = 0; i < 12; i++) k.box(1.2, 1.2, 0.1, FX - 7.05, 5.2 + 0.12 * 0, FZ - 22 + i * 4, dark);
    k.box(8, 3, 8, FX, 8.5, FZ, white).rotation.z = 0.12;
    k.cyl(0.9, 4, FX, 11.5, FZ - 8, rustD, 1.0, 12);
    k.keepOut.push({ x: FX, z: FZ, r: 32 });
    for (let i = 0; i < 12; i++) { const w = wrecks[i % wrecks.length]; const h = k.mesh(new T.CapsuleGeometry(0.12, 0.6, 3, 6), heron, w.x + (rnd() - 0.5) * 3, 8.6 + rnd() * 0.4, w.z + (rnd() - 0.5) * 3, true); void h; k.beam(v(h.position.x, h.position.y - 0.5, h.position.z), v(h.position.x, h.position.y - 1.1, h.position.z), 0.02, yellow, 3); k.mesh(new T.ConeGeometry(0.04, 0.4, 4), yellow, h.position.x, h.position.y + 0.35, h.position.z + 0.3).rotation.x = PI / 2; }
    const gulls: T.Mesh[] = [];
    for (let i = 0; i < 8; i++) { const b = k.mesh(new T.ConeGeometry(0.14, 0.6, 4), heron, 0, 14, 0, true); b.rotation.x = PI / 2; gulls.push(b); }
    if (!ctx.reduced) k.ticks.push((t) => gulls.forEach((b, i) => { const a = t * 0.25 + i * 0.8; const r = 30 + 10 * Math.sin(t * 0.1 + i); b.position.set(Math.cos(a) * r, 12 + 3 * Math.sin(t * 0.7 + i), Math.sin(a) * r - 20); b.rotation.y = -a; }));
    // the kayak route: a loop through the wrecks; the visitor paddles it
    const route = [v(0, 0, 60), v(-10, 0, 40), v(-42, 0, 10), v(-40, 0, -30), v(-5, 0, -42), v(30, 0, -14), v(30, 0, 30), v(6, 0, 60)];
    const kc = k.spline(route, true, 0.5); const kp = kc.getSpacedPoints(360);
    for (let i = 0; i < 360; i += 12) { const p = kp[i]; k.cyl(0.14, 0.8, p.x + 2.4, 0.3, p.z, yellow, 0.14, 8); k.cyl(0.14, 0.8, p.x - 2.4, 0.3, p.z, k.flat(0x2a6a2a, 0, 0.6), 0.14, 8); }
    const kayak = new T.Group(); const shellK = new T.Mesh(new T.BoxGeometry(0.7, 0.3, 3.4), k.flat(0xe84a2a, 0.1, 0.5)); shellK.position.y = 0.05; kayak.add(shellK); const paddle = new T.Mesh(new T.BoxGeometry(2.2, 0.04, 0.04), wood); paddle.position.set(0, 0.6, 0.4); kayak.add(paddle); k.add(kayak);
    if (!ctx.reduced) { k.rider(kayak, kc, 1.6, 180); k.ticks.push((t) => { paddle.rotation.z = 0.5 * Math.sin(t * 2); }); }
    for (const [x, z] of [[-30, -20], [-60, 30]]) k.prop('buoy', x + 12, -0.2, z, { height: 1.6 });
    k.prop('lobster_trap', 6, 0.1, 62, { height: 0.6 });
    k.prop('life_ring', 2, 1.4, 66, { height: 0.9 });
    k.box(8, 0.4, 10, 0, 0.2, 66, wood); k.box(6, 0.3, 30, 0, 0.15, 84, wood);
    k.censusWall({ x: FX - 7.1, y: 5.4, z: FZ, rotY: PI / 2, cols: 26, rows: 3, tile: 0.55, gap: 0.05, start: ctx.wallStart(4000, 78), pieces: ctx.all, backing: dark });
    // the works: on the wheelhouses facing the route, on the barge sides, the ferry's flank
    const mounts: Mount[] = [];
    for (const w of wrecks) { const near = kp.reduce((b, p) => (Math.hypot(p.x - w.x, p.z - w.z) < Math.hypot(b.x - w.x, b.z - w.z) ? p : b), kp[0]); const a = Math.atan2(near.x - w.x, near.z - w.z); const d = 3.2; mounts.push({ position: v(w.x + Math.sin(a) * d, 6.2, w.z + Math.cos(a) * d), rotation: a, target: v(near.x, 3, near.z), width: 3.0, height: 1.8, style: 'black', wash: false }); }
    for (const [x, z] of [[90, 40], [-100, 0], [30, -90]]) { const near = kp.reduce((b, p) => (Math.hypot(p.x - x, p.z - z) < Math.hypot(b.x - x, b.z - z) ? p : b), kp[0]); const a = Math.atan2(near.x - x, near.z - z); mounts.push({ position: v(x + Math.sin(a) * 6.2, 2.0, z + Math.cos(a) * 6.2), rotation: a, target: v(near.x, 2, near.z), width: 6, height: 3.4, style: 'none', wash: false }); }
    for (let i = 0; i < 4; i++) mounts.push({ position: v(FX + 7.4, 5.4, FZ - 18 + i * 12), rotation: -PI / 2, target: v(FX + 30, 3, FZ - 18 + i * 12), width: 5, height: 3, style: 'none', wash: false });
    for (let i = 0; i < 3; i++) { const z = 74 + i * 8; k.box(0.16, 2.2, 3.4, 3.2, 1.6, z, wood); mounts.push({ position: v(3.1, 1.7, z), rotation: -PI / 2, target: v(-2, 2, z), width: 3.0, height: 1.8, style: 'black', wash: false }); }
    const path = kp.map((p) => v(p.x, 1.4, p.z));
    return { mounts, spawn: path[0].clone(), look: v(-30, 6, -20), eye: 1.4, bounds: [-120, 120, -140, 100], path, style: 'black' };
  },
};

/* ---------------- 61 THE INTREPID ---------------- */
export const intrepid: RoomDef = {
  id: 'intrepid',
  name: 'The flight deck',
  area: 'THE INTREPID',
  mood: 'Hudson wind',
  color: '#8a98a8',
  description: 'Pier 86: the aircraft carrier moored on the Hudson, the flight deck lined with aircraft, the island tower, the shuttle pavilion, the works below in the hangar deck.',
  signatures: 'The grey Essex class carrier with its angled flight deck and island superstructure, the jets and helicopters parked along the deck, the space shuttle pavilion aft, the hangar deck open below, the Hudson and New Jersey beyond.',
  build(k, ctx) {
    k.sky({ top: 0x5a8ccc, horizon: 0xe6eaea, ground: 0x4a5058, fog: 0.0016, sun: { az: 3.9, el: 0.6, color: 0xfff4e6, size: 12 }, env: 0.95 });
    k.hemi(0xe8f0ff, 0x3a4048, 0.9);
    k.sun(0xfff0dc, 2.4, -40, 70, 40, true, 140);
    const grey = k.pbr('carrierGrey', X.steel(0x6a7078, true, 159), 0.8, { metalness: 0.5, roughness: 0.6 }),
      greyD = k.pbr('carrierGreyD', X.steel(0x4a5058, true, 160), 0.8, { metalness: 0.5, roughness: 0.65 }),
      deck = k.pbr('flightDeck', X.asphalt(0x3a3d40), 0.2, { roughness: 0.9 }),
      hangar = k.pbr('hangarFloor', X.steel(0x5a5e64, false, 161), 0.6, { metalness: 0.4, roughness: 0.6 }),
      white = k.flat(0xf4f0e8, 0, 0.6),
      yellow = k.flat(0xf1c531, 0, 0.6),
      glass = k.glass(0x9fc4d8, 0.4, 0.08),
      jet = k.flat(0x8a9098, 0.6, 0.4),
      jetD = k.flat(0x3a4048, 0.6, 0.5),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      pier = k.pbr('pierConc', X.concrete(0x9a9a94, 78), 0.3);
    // the river, the pier, the West Side behind, New Jersey across
    k.water({ y: -8, color: 0x2e4a5c, w: 700, d: 500, x: -100, z: 0, amp: 1.2 });
    k.box(40, 8, 300, 60, -4, 0, pier);
    k.box(400, 0.4, 40, 60, -7.8, 170, pier);
    street(k, { w: 30, len: 300, z: 0, x: 110 });
    blockFront(k, { x: 130, z0: 140, count: 20, face: -1, seed: 162, h: [16, 40] });
    k.skyline({ z: 0, count: 20, spacing: 9, scale: 2.4, base: -8, seed: 163, lit: 0.2, glow: 0.4, tint: 0x7a8494, rows: 1, x: -540 });
    // the ship: hull, the flight deck with its angled extension, the island, the hangar deck open at the sides
    const HL = 260, HW = 28, DY = 12, HULLY = -8;
    k.box(HW, DY - HULLY, HL, 0, (DY + HULLY) / 2 - 1.6, 0, grey);
    k.mesh(new T.CylinderGeometry(HW / 2, HW / 2, DY - HULLY, 16, 1, false, 0, PI), grey, 0, (DY + HULLY) / 2 - 1.6, -HL / 2).rotation.set(0, PI, 0);
    // the deck in pieces, leaving a slot for the ramp down to the hangar between z -44 and -18
    for (const [cx, w, cz, d] of [[-4, HW + 16, 56, 148], [-4, HW + 16, -87, 86], [-14.75, 22.5, -31, 26], [10.75, 14.5, -31, 26]]) { k.box(w, 1.2, d, cx, DY - 0.6, cz, greyD); k.box(w, 0.2, d, cx, DY + 0.1, cz, deck); }
    const ang = new T.Shape(); ang.moveTo(-HW / 2 - 8, 0); ang.lineTo(-HW / 2 - 8, 60); ang.lineTo(-HW / 2 - 22, 110); ang.lineTo(-HW / 2 - 22, 140); ang.lineTo(-HW / 2 - 8, 140); ang.closePath();
    const angG = new T.ExtrudeGeometry(ang, { depth: 1.4, bevelEnabled: false }); angG.rotateX(-PI / 2); k.mesh(angG, deck, 0, DY - 1.2, 0);
    for (let z = -HL / 2 + 10; z < HL / 2; z += 10) k.box(0.3, 0.02, 4, -6, DY + 0.21, z, white);
    for (let z = -HL / 2 + 6; z < HL / 2; z += 5) k.box(0.4, 0.02, 2.4, -4, DY + 0.21, z, yellow).rotation.y = 0.18;
    for (const s of [-1, 1]) k.rail(s === -1 ? -HW / 2 - 12 : HW / 2 + 4, 0, HL, dark, 0.9, 'z', 3);
    k.block(-HW / 2 - 12.6, -HW / 2 - 11.4, -HL / 2, HL / 2); k.block(HW / 2 + 3.4, HW / 2 + 4.6, -HL / 2, HL / 2);
    k.block(-HW / 2 - 12, HW / 2 + 4, -HL / 2 - 0.6, -HL / 2 + 0.6); k.block(-HW / 2 - 12, HW / 2 + 4, HL / 2 - 0.6, HL / 2 + 0.6);
    const IX = HW / 2 - 2, IZ = 10;
    k.box(8, 12, 30, IX, DY + 6, IZ, grey);
    k.box(10, 4, 14, IX, DY + 14, IZ + 2, grey);
    k.box(6, 3, 10, IX, DY + 17.5, IZ + 2, glass);
    k.box(2, 22, 2, IX + 1, DY + 27, IZ - 6, greyD);
    for (let y = 0; y < 22; y += 4) k.box(6 - y * 0.15, 0.3, 0.3, IX + 1, DY + 16 + y, IZ - 6, dark);
    k.cyl(1.4, 10, IX - 1, DY + 22, IZ - 10, greyD, 1.6, 12);
    k.sign('THE INTREPID  ·  CV 11', 8, 0.9, IX - 4.05, DY + 8, IZ, '#4a5058', '#f4f0e8', 90, -PI / 2, { border: true });
    k.block(IX - 4.5, IX + 5, IZ - 15.5, IZ + 15.5);
    for (let i = 0; i < 6; i++) k.point(IX - 6, DY + 10, IZ - 12 + i * 5, 0xffe0b0, 12, 10);
    // aircraft: jets with swept wings along the starboard side, a helicopter, the shuttle in its pavilion aft
    const plane = (x: number, z: number, rot: number, scale = 1) => {
      const g = new T.Group(); g.position.set(x, DY + 0.2, z); g.rotation.y = rot; g.scale.setScalar(scale);
      const fus = new T.Mesh(new T.CylinderGeometry(0.9, 0.5, 14, 12), jet); fus.rotation.x = PI / 2; fus.position.y = 1.4; g.add(fus);
      const nose = new T.Mesh(new T.ConeGeometry(0.9, 3, 12), jet); nose.rotation.x = PI / 2; nose.position.set(0, 1.4, 8.5); g.add(nose);
      const wing = new T.Shape(); wing.moveTo(0, 2); wing.lineTo(6.5, -3); wing.lineTo(6.5, -4.5); wing.lineTo(0, -2); wing.closePath();
      for (const s of [-1, 1]) { const w = new T.Mesh(new T.ExtrudeGeometry(wing, { depth: 0.16, bevelEnabled: false }), jetD); w.rotation.x = PI / 2; w.scale.x = s; w.position.set(0, 1.3, 0); g.add(w); }
      const tail = new T.Mesh(new T.BoxGeometry(0.16, 3, 3), jetD); tail.position.set(0, 3, -6); g.add(tail);
      const canopy = new T.Mesh(new T.SphereGeometry(0.8, 10, 8), glass); canopy.scale.set(1, 0.7, 2); canopy.position.set(0, 2.2, 4); g.add(canopy);
      for (const [dx, dz] of [[0, 6], [-2, -1], [2, -1]]) { const gear = new T.Mesh(new T.BoxGeometry(0.2, 1.2, 0.2), dark); gear.position.set(dx, 0.6, dz); g.add(gear); }
      g.traverse((o) => { if (o instanceof T.Mesh) o.castShadow = ctx.quality === 'high'; });
      k.add(g); k.keepOut.push({ x, z, r: 7 * scale });
      return g;
    };
    for (let i = 0; i < 9; i++) plane(HW / 2 - 6, -HL / 2 + 20 + i * 14, i % 2 ? 0.5 : -0.4, 0.9 + (i % 3) * 0.1);
    for (let i = 0; i < 4; i++) plane(-HW / 2 - 14, 30 + i * 16, PI + 0.3, 0.8);
    const heli = new T.Group(); heli.position.set(-8, DY + 0.2, -90); const hb = new T.Mesh(new T.BoxGeometry(3, 3, 10), jet); hb.position.y = 1.8; heli.add(hb); const boom = new T.Mesh(new T.CylinderGeometry(0.4, 0.6, 8, 8), jet); boom.rotation.x = PI / 2; boom.position.set(0, 2.4, -8); heli.add(boom); const rotor = new T.Mesh(new T.BoxGeometry(0.3, 0.08, 16), jetD); rotor.position.y = 3.6; heli.add(rotor); const rotor2 = new T.Mesh(new T.BoxGeometry(16, 0.08, 0.3), jetD); rotor2.position.y = 3.62; heli.add(rotor2); k.add(heli); k.keepOut.push({ x: -8, z: -90, r: 6 });
    if (!ctx.reduced) k.ticks.push((t) => { rotor.rotation.y = t * 0.6; rotor2.rotation.y = t * 0.6; });
    const PZ = HL / 2 - 34;
    k.mesh(new T.CylinderGeometry(14, 14, 40, 24, 1, true, 0, PI), k.flat(0xe6e2da, 0.1, 0.6, { side: T.DoubleSide, transparent: true, opacity: 0.9 }), 0, DY, PZ).rotation.set(0, 0, PI / 2), void 0;
    const pav = k.objects[k.objects.length - 1]; pav.rotation.set(0, 0, PI / 2); pav.rotateX(PI / 2); pav.position.set(-4, DY, PZ);
    k.block(-18.5, 10.5, PZ - 20.5, PZ + 20.5);
    const shuttle = new T.Group(); shuttle.position.set(-4, DY + 3, PZ); const sf = new T.Mesh(new T.CylinderGeometry(2.4, 2.0, 24, 14), white); sf.rotation.x = PI / 2; shuttle.add(sf); const sn = new T.Mesh(new T.SphereGeometry(2.4, 12, 8), dark); sn.scale.set(1, 1, 1.4); sn.position.z = 12; shuttle.add(sn); const dw = new T.Shape(); dw.moveTo(0, 6); dw.lineTo(11, -10); dw.lineTo(11, -12); dw.lineTo(0, -12); dw.closePath(); for (const s of [-1, 1]) { const w = new T.Mesh(new T.ExtrudeGeometry(dw, { depth: 0.3, bevelEnabled: false }), white); w.rotation.x = PI / 2; w.scale.x = s; w.position.set(0, -1.4, 0); shuttle.add(w); } const st = new T.Mesh(new T.BoxGeometry(0.3, 7, 6), white); st.position.set(0, 4.5, -9); shuttle.add(st); for (let i = 0; i < 3; i++) { const e = new T.Mesh(new T.ConeGeometry(0.9, 2.2, 10, 1, true), jetD); e.rotation.x = -PI / 2; e.position.set([-1.4, 1.4, 0][i], [-0.6, -0.6, 1.4][i], -12.6); shuttle.add(e); } k.add(shuttle);
    for (const dz of [-12, 0, 12]) k.point(-4, DY + 10, PZ + dz, 0xfff0e0, 30, 20);
    // the hangar deck: the level below, open along both sides, reached by the aircraft elevator aft of the island
    const HY = DY - 8;
    k.box(HW - 2, 0.3, HL - 40, 0, HY, 0, hangar);
    k.box(HW - 2, 0.6, HL - 40, 0, HY - 0.3, 0, greyD);
    for (let z = -HL / 2 + 30; z < HL / 2 - 30; z += 12) for (const s of [-1, 1]) k.box(0.8, DY - HY - 0.6, 0.8, s * (HW / 2 - 1.4), (DY + HY) / 2 - 0.3, z, greyD);
    for (let z = -HL / 2 + 26; z < HL / 2 - 20; z += 24) k.point(0, DY - 1.5, z, 0xffe8d0, 30, 24);
    for (let i = 0; i < 24; i++) k.box(6, 0.4, 1.2, 0, DY - 0.2 - (i + 0.5) * (8 / 24), -18.6 - i * 1.08, greyD);
    for (const s of [-1, 1]) k.rail(s * 3.2, -31, 26, dark, 0.9, 'z', 2);
    k.block(-HW / 2 - 12, -3.4, -18.8, -17.6); k.block(3.4, HW / 2 + 4, -18.8, -17.6);
    k.block(-HW / 2 + 1, HW / 2 - 1, -111, -109);
    k.crowd([v(-8, DY + 0.2, -120), v(-6, DY + 0.2, -40), v(-8, DY + 0.2, 40), v(-6, DY + 0.2, 90)], 30, { seed: 63, speed: 0.9, spread: 4, animate: !ctx.reduced });
    k.crowd([v(0, HY + 0.3, -104), v(2, HY + 0.3, -75), v(0, HY + 0.3, -46)], 12, { seed: 64, speed: 0.8, spread: 3, animate: !ctx.reduced });
    k.censusWall({ x: -HW / 2 + 1.2, y: HY + 4.2, z: -70, rotY: PI / 2, cols: 40, rows: 5, tile: 0.55, gap: 0.05, start: ctx.wallStart(7200, 200), pieces: ctx.all, backing: dark });
    k.box(0.6, 8, 24, -HW / 2 + 1.0, HY + 4, -70, greyD);
    // the works: the island's port face, the hangar deck bays on both sides, the pavilion wall, the deck edge screens
    const mounts: Mount[] = [];
    for (let i = 0; i < 4; i++) { const z = IZ - 10 + i * 6.5; mounts.push({ position: v(IX - 4.05, DY + 4, z), rotation: -PI / 2, target: v(IX - 14, DY + 3, z), width: 4.4, height: 2.6, style: 'steel', wash: false }); }
    for (let i = 0; i < 4; i++) { const z = -100 + i * 20; for (const s of [-1, 1]) { k.box(0.4, 4.4, 5.4, s * (HW / 2 - 1.2), HY + 3.2, z, greyD); mounts.push({ position: v(s * (HW / 2 - 1.36), HY + 3.4, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, HY + 3, z), width: 4.6, height: 2.7, style: 'steel', wash: false }); } }
    for (let i = 0; i < 3; i++) { const z = PZ - 12 + i * 12; mounts.push({ position: v(-17.5, DY + 5, z), rotation: PI / 2, target: v(-8, DY + 4, z), width: 5, height: 3, style: 'none', wash: false }); }
    for (let i = 0; i < 3; i++) { const z = -HL / 2 + 30 + i * 40; k.box(0.2, 3, 4.6, -HW / 2 - 11.2, DY + 1.8, z, dark); mounts.push({ position: v(-HW / 2 - 11.05, DY + 2, z), rotation: PI / 2, target: v(-8, DY + 2, z), width: 4.2, height: 2.5, style: 'steel', wash: false }); }
    return { mounts, spawn: v(-6, DY + 3, HL / 2 - 70), look: v(IX - 6, DY + 8, IZ - 70), eye: 3, bounds: [-HW / 2 - 12, HW / 2 + 4, -HL / 2 + 1, HL / 2 - 1], style: 'steel', floorY: (x, z) => { if (z > -18) return DY + 0.2; if (z > -44 && Math.abs(x) < 3.4) return DY + 0.2 - ((-18 - z) / 26) * (DY - HY - 0.1); return HY + 0.3; } };
  },
};
