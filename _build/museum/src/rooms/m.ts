/* Rooms 57 to 61: Rockaway Beach, Green-Wood, the Domino refinery, the Staten Island boat graveyard, the Intrepid. */
import * as T from 'three';
import { personTag } from '../kit';
import * as X from '../textures';
import { v } from '../kit';
import type { Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront } from './f';
import { hero, standIn, hide } from './heroes';

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
    for (let i = 0; i < 9; i++) { const g = new T.Group(); const board = new T.Mesh(new T.BoxGeometry(0.5, 0.08, 2.2), i % 2 ? white : orange); g.add(board); const body = new T.Mesh(new T.CapsuleGeometry(0.16, 0.5, 3, 6), dark); body.position.y = 0.45; g.add(personTag(body, 'seat', 1.5)); /* 2026-10-28: sitting on the board, waiting for a wave */ g.position.set(-80 + i * 20, -0.4, -150 - (i % 3) * 8); k.add(g); surfers.push(g); }
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
    const RW = 'https://en.wikipedia.org/wiki/Rockaway_Boardwalk', RN = 'Rockaway Boardwalk, Wikipedia';
    k.egg(v(40, 0.6, -6.8), { id: 'rockaway-sandy', title: 'Rebuilt in concrete', year: '2017', text: 'Hurricane Sandy destroyed much of the wooden boardwalk on October 29, 2012, worst between Beach 80th and 106th Streets. It was rebuilt in concrete for $274 million and finished in May 2017, on piles 30 feet apart driven up to 27 feet into the ground, with a sand retaining wall running underneath.', clue: 'Look over the ocean side rail of the boardwalk.', source: { name: RN, url: RW } }, { r: 1.6 });
    k.egg(v(-82, 0.9, 4.4), { id: 'rockaway-benches', title: 'The old boards', text: 'The modular benches on the new concrete boardwalk are made with wood saved from the old boardwalk that Sandy wrecked. Most of the boardwalk is 40 feet wide, with bump outs of 5 to 15 feet where there are stairs, ramps or benches.', clue: 'Sit on a bench under one of the shade shelters.', source: { name: RN, url: RW } }, { r: 1.4 });
    k.egg(v(0, 0.4, -150), { id: 'rockaway-surf', title: 'The only legal surf', text: 'The only beaches in New York City where surfing is legal are both on Rockaway Beach: Beach 67th to 69th Streets and Beach 87th to 92nd Streets.', clue: 'Watch the surfers waiting out past the break.', source: { name: RN, url: RW } }, { r: 3 });
    k.egg(v(-70, 3.1, -80), { id: 'rockaway-lifeguards', title: 'Half the city\'s lifeguards', year: '2005', text: 'In 2005, 500 of the city\'s 1,000 beach lifeguards worked at Rockaway Beach. In the 1950s its lifeguard force of 258 was one of the largest in the world.', clue: 'Find a numbered lifeguard chair on the sand.', source: { name: RN, url: RW } }, { r: 1.6 });
    k.egg(v(60, 3.4, 7.2), { id: 'rockaway-ramones', title: 'The song', year: '1977', text: 'The Ramones song Rockaway Beach of 1977 was inspired by this beach. It was the band\'s highest charting single, reaching number 66 on the Billboard Hot 100.', clue: 'Look up at the sign over the clam shack.', source: { name: RN, url: RW } }, { r: 1.6 });
    k.egg(v(0, 0.3, -12), { id: 'rockaway-1923', title: 'The first city boards', year: '1923', text: 'The first city owned stretch of boardwalk opened in Rockaway Park in May 1923: 31 feet wide, 4,500 feet long, built for $133,000. Robert Moses later demolished more than 700 buildings to clear land for the Shore Front Parkway, which opened in 1939.', clue: 'Walk down the steps from the boardwalk to the sand.', source: { name: RN, url: RW } }, { r: 1.6 });
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
    for (const x of [-12, 0, 12]) { k.box(5, 14, 6, x, 7, GZ, brown); k.mesh(new T.ConeGeometry(3.2, x === 0 ? 18 : 9, 4), brown, x, 14 + (x === 0 ? 9 : 4.5), GZ).rotation.y = PI / 4; for (let i = 0; i < 4; i++) { const a = (i / 4) * PI * 2 + PI / 4; k.mesh(new T.ConeGeometry(0.6, 2.4, 4), brown, x + Math.cos(a) * 2.2, 15, GZ + Math.sin(a) * 2.2); } }
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
    for (let i = 0; i < 60; i++) { const x = (rnd() - 0.5) * 230, z = -12 - rnd() * 210; if (dp.some((p) => Math.hypot(p.x - x, p.z - z) < 5)) continue; k.tree(x, H(x, z) - 0.2, z, { kind: rnd() > 0.5 ? 'round' : 'bare', h: 6 + rnd() * 7, r: 3 + rnd() * 3, leaf: [0xc88a3a, 0xb8602a, 0xe8b040, 0x6a8a3a][Math.floor(rnd() * 4)], seed: i, species: (['oak', 'maple', 'elm', 'ginkgo', 'linden', 'oak'] as const)[i % 6] }); }
    // the harbor from the high ground
    k.water({ y: -12, color: 0x30506a, w: 800, d: 300, z: -420, amp: 1 });
    k.skyline({ z: -520, count: 40, spacing: 9, scale: 3.6, base: -12, seed: 149, lit: 0.2, glow: 0.4, tint: 0x7a8494, rows: 1, spires: true });
    // the clock in the central tower, both faces
    const clock = k.mesh(new T.CylinderGeometry(1.5, 1.5, 6.3, 24), marble, 0, 11.5, GZ); clock.rotation.x = PI / 2;
    for (const s of [-1, 1]) { k.box(0.12, 1.1, 0.06, 0, 11.9, GZ + s * 3.2, iron); k.box(0.8, 0.12, 0.06, 0.35, 11.5, GZ + s * 3.2, iron); }
    // Battle Hill: the Altar to Liberty with Minerva, raising her arm toward the harbor
    const MX = 10, MZ = -150, MY = H(MX, MZ);
    k.box(3.4, 1.0, 2.2, MX, MY + 0.5, MZ, granite); k.box(2.4, 2.4, 1.6, MX, MY + 2.2, MZ, granite);
    k.cyl(0.45, 2.4, MX, MY + 4.6, MZ, bronze, 0.6, 10); k.sphere(0.32, MX, MY + 6.1, MZ, bronze, 8);
    k.beam(v(MX + 0.3, MY + 5.5, MZ), v(MX + 0.5, MY + 7.0, MZ - 0.6), 0.1, bronze, 5);
    k.keepOut.push({ x: MX, z: MZ, r: 2.2 });
    // Charlotte Canda's gothic monument beside the drive
    const cp = dp[44]; const CNX = cp.x + 6, CNZ = cp.z, CNY = H(CNX, CNZ);
    k.box(2.6, 1.0, 2.6, CNX, CNY + 0.5, CNZ, marble); k.box(1.8, 2.4, 1.8, CNX, CNY + 2.2, CNZ, marble);
    for (const [dx, dz] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) k.mesh(new T.ConeGeometry(0.25, 1.6, 4), marble, CNX + dx, CNY + 4.2, CNZ + dz);
    const canda = k.mesh(new T.ConeGeometry(0.9, 3.2, 4), marble, CNX, CNY + 5, CNZ); canda.rotation.y = PI / 4;
    k.keepOut.push({ x: CNX, z: CNZ, r: 1.8 });
    const GW = 'https://en.wikipedia.org/wiki/Green-Wood_Cemetery', GN = 'Green-Wood Cemetery, Wikipedia';
    k.egg(v(12, 13.5, GZ), { id: 'greenwood-parakeets', title: 'Parrots in the spires', text: 'Wild monk parakeets nest in the spires of the main gate. They most likely escaped from their shipping containers in transit and have lived here ever since.', clue: 'Look up at the twig nests in the side spires of the gate.', source: { name: GN, url: GW } }, { r: 2 });
    k.egg(clock, { id: 'greenwood-gate', title: 'Upjohn\'s gate', year: '1861', text: 'The Gothic Revival gate was designed by Richard Upjohn and built from 1861 to 1863, with the entrance opening in 1862. The sculpted panels are by John M. Moffitt, and the clock tower rises 100 or 106 feet, depending on the source.', clue: 'Look up at the clock in the middle tower.', source: { name: GN, url: GW } }, { r: 1.8 });
    k.egg(v(0, 9.2, GZ + 4.4), { id: 'greenwood-niagara', title: 'Second only to Niagara', year: '1860', text: 'In the early 1860s more than 500,000 people a year came to Green-Wood, a crowd second in New York State only to Niagara Falls. The cemetery was incorporated on April 18, 1838 and covers 478 acres, with about 570,000 interments as of 2024.', clue: 'Read the name over the gate.', source: { name: GN, url: GW } }, { r: 1.8 });
    k.egg(v(MX, MY + 5, MZ), { id: 'greenwood-minerva', title: 'Minerva faces Liberty', year: '1919', text: 'Battle Hill, about 216 feet up, is the highest point in Brooklyn, and a skirmish of the Battle of Long Island was fought here on August 27, 1776. In 1919 Frederick Ruckstull\'s Altar to Liberty: Minerva was put up at the top, facing the Statue of Liberty across the harbor.', clue: 'Climb to the highest ground and find the bronze figure facing the water.', source: { name: GN, url: GW } }, { r: 2 });
    k.egg(canda, { id: 'greenwood-canda', title: 'She designed it herself', text: 'Charlotte Canda, a 17 year old debutante, designed the Gothic monument that bears her name. Around it, the hills of monuments sit on glacial moraine, mostly the Harbor Hill Moraine, which also left the cemetery its ponds.', clue: 'Find the white gothic monument with the pinnacles beside the drive.', source: { name: GN, url: GW } }, { r: 1.8 });
    { const gp = dp[90]; const gx = gp.x - 4, gz = gp.z;
      k.box(0.9, 0.1, 2.4, gx, H(gx, gz) + 0.04, gz, k.flat(0x4a3a2a, 0, 1));
      k.egg(v(gx, H(gx, gz) + 0.5, gz), { id: 'greenwood-gravediggers', title: 'Four hours, by hand', text: 'Gravediggers at Green-Wood must pass a 40 day trial period, and must be able to dig a grave 3 by 8 by 5 feet by hand within four hours.', clue: 'Find the freshly turned earth beside the drive.', source: { name: GN, url: GW } }, { r: 1.6 }); }
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
    // the coal fired chimney, 155 ft, its top widened in curved brick in the 1920s
    const CHX = RX + RW / 2 + 8, CHZ = RZ + RD / 2 - 6;
    k.cyl(3.2, 44, CHX, 22, CHZ, brick, 3.8, 24);
    const chTop = k.mesh(new T.CylinderGeometry(3.7, 3.2, 3.2, 24), brickD, CHX, 45.6, CHZ);
    k.box(RW - 4, 0.4, RD - 4, RX, 0.2, RZ, k.pbr('domFloor', X.concrete(0x9a948a, 75), 0.3));
    // the glass vault within: a barrel of glass and steel ribs, set back from the brick, rising above the parapet
    const VB = 28;
    for (let j = 0; j < 16; j++) { const a0 = (j / 16) * PI, a1 = ((j + 1) / 16) * PI, am = (a0 + a1) / 2, r = RW / 2 - 6; const seg = k.box(2 * r * Math.sin((a1 - a0) / 2) + 0.05, 0.1, RD - 10, RX + Math.cos(am) * r, VB + Math.sin(am) * r, RZ, glass); seg.rotation.z = am + PI / 2; }
    for (let i = 0; i <= 12; i++) { const z = RZ - RD / 2 + 5 + i * ((RD - 10) / 12); const pts: T.Vector3[] = []; for (let j = 0; j <= 16; j++) { const a = (j / 16) * PI; pts.push(v(RX + Math.cos(a) * (RW / 2 - 6), VB + Math.sin(a) * (RW / 2 - 6), z)); } k.curve(pts, 0.14, steel, 16); }
    for (let j = 0; j <= 16; j += 2) { const a = (j / 16) * PI; k.box(0.16, 0.16, RD - 10, RX + Math.cos(a) * (RW / 2 - 6), VB + Math.sin(a) * (RW / 2 - 6), RZ, steel); }
    for (const s of [-1, 1]) { k.box(0.8, 6, RD - 10, RX + s * (RW / 2 - 6), 3, RZ, steel); k.box(0.3, VB - 6, RD - 10, RX + s * (RW / 2 - 6), 6 + (VB - 6) / 2, RZ, glass); for (let y = 9; y <= VB; y += 4.5) k.box(0.5, 0.3, RD - 10, RX + s * (RW / 2 - 6), y, RZ, steel); k.block(RX + s * (RW / 2 - 6) - 0.5, RX + s * (RW / 2 - 6) + 0.5, RZ - RD / 2 + 5, RZ + RD / 2 - 5); }
    for (let f = 1; f < 6; f++) { for (const s of [-1, 1]) k.box(6, 0.3, RD - 10, RX + s * (RW / 2 - 9), f * 4.5, RZ, deck); }
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
    const DW = 'https://en.wikipedia.org/wiki/Domino_Sugar_Refinery', DN = 'Domino Sugar Refinery, Wikipedia';
    k.egg(chTop, { id: 'domino-chimney', title: 'The coal chimney', text: 'The refinery burned coal and needed a 155 foot chimney. In the 1920s the top of it was enlarged with curved brick. The filter house beside it rises 13 storeys, 155 feet including the chimney.', clue: 'Look up to the top of the great brick chimney.', source: { name: DN, url: DW } }, { r: 3 });
    k.egg(v(RX, 25.9, RZ - RD / 2 - 0.8), { id: 'domino-three-quarters', title: 'Three quarters of the nation\'s sugar', year: '1881', text: 'By 1870 Williamsburg produced most of the sugar used in the United States. By 1881 the Havemeyer refinery alone processed about three fourths of all the refined sugar in the country. At its peak in 1919 it employed 4,500 people.', clue: 'Read the lettering high on the river front.', source: { name: DN, url: DW } }, { r: 2 });
    k.egg(v(RX, 4, RZ - RD / 2 - 1), { id: 'domino-fireproof', title: 'Too fireproof to insure', year: '1917', text: 'The rebuilt refinery was thought so fireproof that its owners did not insure it. In 1917 an explosion of ignited sugar dust killed between six and twelve workers, and more than 15,000 people gathered to watch the plant burn.', clue: 'Stand under the great arched doorway.', source: { name: DN, url: DW } }, { r: 1.8 });
    k.egg(v(RX - RW / 2 + 0.9, 13, RZ - 15), { id: 'domino-walls', title: 'Four foot walls', year: '1883', text: 'The refinery was rebuilt after a fire on January 8, 1882, and finished by July 1883 for $7 million. Its brick walls are 4 feet thick on the lower storeys and 2 feet thick higher up, around a block 250 by 150 feet and 10 storeys tall.', clue: 'Look at the depth of the window reveals inside the brick shell.', source: { name: DN, url: DW } }, { r: 2 });
    k.egg(v(RX, VB + 6, RZ), { id: 'domino-vault', title: 'A building inside a building', year: '2023', text: 'The Refinery reopened on September 27, 2023, converted to offices by Vishaan Chakrabarti of Practice for Architecture and Urbanism. A new glass structure with a barrel vault stands inside the landmarked brick shell, which the Landmarks Preservation Commission designated in 2007.', clue: 'Look up into the glass vault.', source: { name: DN, url: DW } }, { r: 3 });
    k.egg(v(-112, 0.6, 0), { id: 'domino-water', title: 'Two percent of Brooklyn\'s water', year: '1903', text: 'In 1903 the refinery alone was estimated to use two percent of Brooklyn\'s water supply. Domino Park opened along the river in June 2018 with pieces of the old factory machinery set into it.', clue: 'Walk to the river edge of the park.', source: { name: DN, url: DW } }, { r: 1.8 });
    k.censusWall({ x: RX, y: 4.2, z: RZ + RD / 2 - 0.66, rotY: PI, cols: 30, rows: 5, tile: 0.55, gap: 0.05, start: ctx.wallStart(6100, 150), pieces: ctx.all, backing: dark });
    // on the plain brick band between the second and third tiers of arches (tops at 24.8, next tier from 26): the arch frames stand
    // 0.7 proud of the wall, so a sign up among the top tier lost the letters behind them
    k.sign('DOMINO  ·  SUGAR  ·  1882', 10, 0.9, RX, 25.4, RZ - RD / 2 - 0.66, 'transparent', '#f4d8a8', 74, PI);
    // the works: the brick piers between the arches inside, the mezzanine edges, the walkway screens, the tank sides
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const z = RZ - RD / 2 + 10 + i * 10; mounts.push({ position: v(RX + s * (RW / 2 - 0.66), 3.6, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(RX + s * (RW / 2 - 8), 3, z), width: 4.4, height: 2.6, style: 'steel', wash: true }); }
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = RZ - 20 + i * 20; mounts.push({ position: v(RX + s * (RW / 2 - 6.42), 3.2, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(RX, 3, z), width: 3.6, height: 2.1, style: 'steel', wash: false }); }
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
    /* 2026-10-28: the box tugs and the ferry become h_tug_lo (h_tug cut to 9k triangles, ten of them) and h_ferry (made 2026-10-09), each clone's paint pulled
       toward the wreck's own rust, tilt and sink kept; the boxes stay as the stand in until the GLB loads. */
    const rusted = (g: T.Object3D, tint: number) => { const cache = new Map<T.Material, T.Material>(); g.traverse((o) => { if (!(o instanceof T.Mesh)) return; const src = o.material as T.MeshStandardMaterial; let m = cache.get(src); if (!m) { const c = src.clone(); c.color.setHex(tint); c.roughness = 0.88; c.metalness = 0.35; m = c; cache.set(src, m); } o.material = m; }); return g; };
    const wreckTint = [0xb0704a, 0x8a5a40, 0xc09a6a];
    void hero(k, 'h_tug_lo', { length: 18 }).then((h) => {
      if (!h) return;
      wrecks.forEach((w, i) => { for (const o of w.g.children) o.visible = false; const c = rusted(h.clone(), wreckTint[i % 3]); c.position.y = -0.7; w.g.add(c); });
    });
    for (const [x, z] of [[90, 40], [-100, 0], [30, -90]]) { const b = k.box(12, 3, 40, x, 0.2, z, rustD); b.rotation.set(0.05, rnd() * PI, 0.08); k.keepOut.push({ x, z, r: 20 }); }
    const FX = -20, FZ = -110, ferryMark = k.objects.length;
    k.box(16, 5, 60, FX, 0.4, FZ, paint).rotation.z = 0.12;
    k.box(14, 4, 50, FX, 5, FZ, white).rotation.z = 0.12;
    for (let i = 0; i < 12; i++) k.box(1.2, 1.2, 0.1, FX - 7.05, 5.2 + 0.12 * 0, FZ - 22 + i * 4, dark);
    k.box(8, 3, 8, FX, 8.5, FZ, white).rotation.z = 0.12;
    k.cyl(0.9, 4, FX, 11.5, FZ - 8, rustD, 1.0, 12);
    {
      const old = standIn(k, ferryMark);
      void hero(k, 'h_ferry', { length: 60 }).then((h) => { if (!h) return; hide(old); rusted(h, 0xc8a888); h.position.set(FX, -2.1, FZ); h.rotation.z = 0.12; k.add(h); });
    }
    /* The flagship is a 16 by 60 hull, but it carried a 32 metre circular keep
       out, wider than the wreck itself, which walled off the four works hung on
       its starboard flank: there was nowhere in sight of them to stand. A
       rectangle the shape of the hull lets the visitor walk alongside it. */
    k.block(FX - 9, FX + 9, FZ - 31, FZ + 31);
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
    // a long narrow grey navy hull among the tugs, a submarine chaser of the kind PC-1264 was
    const pcg = new T.Group(); pcg.position.set(84, -0.6, -24); pcg.rotation.set(0.04, 0.5, -0.1);
    { const navy = k.flat(0x6a6e70, 0.3, 0.8); const hb = new T.Mesh(new T.BoxGeometry(5.6, 3, 40), navy); hb.position.y = 1.2; pcg.add(hb); const bw = new T.Mesh(new T.ConeGeometry(2.8, 8, 4, 1), navy); bw.rotation.x = PI / 2; bw.rotation.y = PI / 4; bw.position.set(0, 1.2, 24); bw.scale.set(1, 1, 0.6); pcg.add(bw); const br = new T.Mesh(new T.BoxGeometry(3.4, 3, 6), navy); br.position.set(0, 4.2, 6); pcg.add(br); const ms = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 7, 6), rustD); ms.position.set(0, 8, 4); pcg.add(ms); }
    k.add(pcg); k.keepOut.push({ x: 84, z: -24, r: 12 });
    const BW = 'https://en.wikipedia.org/wiki/Arthur_Kill_ship_graveyard', BN = 'Arthur Kill ship graveyard, Wikipedia';
    k.egg(v(0, 1.2, 70), { id: 'boatgraveyard-witte', title: 'Witte\'s yard', year: '1930', text: 'The graveyard is a working marine scrapyard in Rossville, founded in the 1930s by John J. Witte, who ran it until his death in 1980. It is also called the Witte Marine Scrap Yard and the Tugboat Graveyard, and its official name since 2014 is the Donjon Iron and Metal Scrap Processing Facility.', clue: 'Look around the wooden dock where the route begins.', source: { name: BN, url: BW } }, { r: 1.8 });
    k.egg(wrecks[1].g, { id: 'boatgraveyard-count', title: 'Down from four hundred', text: 'About 100 boats and ships still lie here, down from a high of about 400. Most are cargo ships and tugboats from every decade of the twentieth century, left in the mud and shallows until they are cut up or salvaged. Some have called it an accidental marine museum.', clue: 'Paddle up to a rusted tug and count the hulls around it.', source: { name: BN, url: BW } }, { r: 3 });
    k.egg(pcg, { id: 'boatgraveyard-pc1264', title: 'The sub chaser', text: 'Among the historic vessels brought here was USS PC-1264, a submarine chaser and the first US Navy ship of World War II with a predominantly African American crew.', clue: 'Look for the long narrow grey hull, unlike the tugs.', source: { name: BN, url: BW } }, { r: 4 });
    k.egg(wrecks[0].g, { id: 'boatgraveyard-hewitt', title: 'The Slocum fireboat', year: '1904', text: 'The yard also took in the Fire Department fireboat Abram S. Hewitt, which served as the floating command post at the sinking of the General Slocum in 1904, a disaster that killed more than a thousand people.', clue: 'Find the first wreck you pass on the kayak route.', source: { name: BN, url: BW } }, { r: 3 });
    k.egg(v(FX, 11, FZ), { id: 'boatgraveyard-salt', title: 'On location', year: '2010', text: 'Scenes of the 2010 thriller Salt were filmed in the yard, and the documentary Graves of Arthur Kill was shot here in 2012. The site is posted with no trespassing signs, but marine historians, photographers and artists still find their way in.', clue: 'Look at the big white hulk listing at the far end.', source: { name: BN, url: BW } }, { r: 3 });
    k.censusWall({ x: FX - 7.1, y: 5.4, z: FZ, rotY: PI / 2, cols: 26, rows: 3, tile: 0.55, gap: 0.05, start: ctx.wallStart(4000, 78), pieces: ctx.all, backing: dark });
    // the works: on the wheelhouses facing the route, on the barge sides, the ferry's flank
    const mounts: Mount[] = [];
    for (const w of wrecks) { const near = kp.reduce((b, p) => (Math.hypot(p.x - w.x, p.z - w.z) < Math.hypot(b.x - w.x, b.z - w.z) ? p : b), kp[0]); const a = Math.atan2(near.x - w.x, near.z - w.z); const d = 3.2; mounts.push({ position: v(w.x + Math.sin(a) * d, 6.2, w.z + Math.cos(a) * d), rotation: a, target: v(near.x, 3, near.z), width: 3.0, height: 1.8, style: 'black', wash: false }); }
    for (const [x, z] of [[90, 40], [-100, 0], [30, -90]]) { const near = kp.reduce((b, p) => (Math.hypot(p.x - x, p.z - z) < Math.hypot(b.x - x, b.z - z) ? p : b), kp[0]); const a = Math.atan2(near.x - x, near.z - z); mounts.push({ position: v(x + Math.sin(a) * 6.2, 2.0, z + Math.cos(a) * 6.2), rotation: a, target: v(near.x, 2, near.z), width: 6, height: 3.4, style: 'none', wash: false }); }
    for (let i = 0; i < 4; i++) mounts.push({ position: v(FX + 7.4, 5.4, FZ - 18 + i * 12), rotation: PI / 2, target: v(FX + 16, 3, FZ - 18 + i * 12), width: 5, height: 3, style: 'none', wash: false });
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
    // the river, Pier 86 running out from the shore along the ship, the West Side behind the stern, New Jersey across
    // (the bow points out into the Hudson, west, along -z; Twelfth Avenue and the city lie off the stern at +z)
    k.water({ y: -8, color: 0x2e4a5c, w: 900, d: 760, x: 0, z: -220, amp: 1.2 });
    k.box(40, 8, 310, 60, -4, 5, pier);
    k.box(900, 8, 240, 0, -4, 280, pier);
    { const asph = k.pbr('asphaltS', X.asphalt(0x24282d), 0.11, { roughness: 0.62, metalness: 0.12 });
      k.box(900, 0.3, 30, 0, 0.05, 205, asph); for (const dz of [-0.14, 0.14]) k.box(880, 0.012, 0.09, 0, 0.21, 205 + dz, yellow); }
    k.skyline({ z: 275, count: 30, spacing: 8, scale: 2.6, base: 0, seed: 162, lit: 0.25, glow: 0.5, tint: 0x6a5a50, rows: 2 });
    k.skyline({ z: -620, count: 40, spacing: 9, scale: 2.4, base: -8, seed: 163, lit: 0.2, glow: 0.4, tint: 0x7a8494, rows: 1 });
    // Concorde G-BOAD on the pier, and the submarine Growler on the north side of the pier
    const concorde = new T.Group(); concorde.position.set(60, 0, 40); concorde.rotation.y = PI;
    { const cw = k.flat(0xf2f2ee, 0.2, 0.5); const fu = new T.Mesh(new T.CylinderGeometry(1.45, 1.3, 52, 14), cw); fu.rotation.x = PI / 2; fu.position.y = 4.2; concorde.add(fu);
      const no = new T.Mesh(new T.ConeGeometry(1.45, 8, 14), cw); no.rotation.x = PI / 2; no.position.set(0, 4.0, 30); no.rotation.z = 0; concorde.add(no);
      const dl = new T.Shape(); dl.moveTo(0, 10); dl.quadraticCurveTo(4, -2, 12.8, -18); dl.lineTo(12.8, -22); dl.lineTo(0, -22); dl.closePath();
      for (const sg of [-1, 1]) { const w = new T.Mesh(new T.ExtrudeGeometry(dl, { depth: 0.25, bevelEnabled: false }), cw); w.rotation.x = PI / 2; w.scale.x = sg; w.position.set(0, 3.2, 0); concorde.add(w); }
      const fin = new T.Mesh(new T.BoxGeometry(0.25, 8, 8), cw); fin.position.set(0, 8.5, -22); fin.rotation.x = -0.3; concorde.add(fin);
      for (const sg of [-1, 1]) { const nac = new T.Mesh(new T.BoxGeometry(2.4, 1.4, 10), k.flat(0xb8b8b4, 0.4, 0.5)); nac.position.set(sg * 4.5, 2.4, -15); concorde.add(nac); }
      for (const [dx, dz] of [[0, 18], [-4, -10], [4, -10]]) { const gr = new T.Mesh(new T.BoxGeometry(0.3, 2.4, 0.3), dark); gr.position.set(dx, 1.2, dz); concorde.add(gr); } }
    k.add(concorde);
    const growler = new T.Group(); growler.position.set(86, -8, -40);
    { const sub = k.flat(0x1e2226, 0.3, 0.7); const hb = new T.Mesh(new T.CylinderGeometry(2.8, 2.8, 86, 16), sub); hb.rotation.x = PI / 2; hb.position.y = 1.6; growler.add(hb); for (const sg of [-1, 1]) { const end = new T.Mesh(new T.SphereGeometry(2.8, 12, 8), sub); end.scale.z = 2.2; end.position.set(0, 1.6, sg * 43); growler.add(end); }
      const sail = new T.Mesh(new T.BoxGeometry(2, 5, 9), sub); sail.position.set(0, 6.4, 6); growler.add(sail);
      const hangarG = new T.Mesh(new T.CylinderGeometry(2.6, 2.6, 14, 14), sub); hangarG.rotation.x = PI / 2; hangarG.position.set(0, 4.4, 30); growler.add(hangarG); }
    k.add(growler);
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
    /* 2026-10-28: the orbiter is NASA 3D Resources' "Space Shuttle (D)" (public domain, github.com/nasa/NASA-3D-Resources),
       with the textures that carry the agency insignia, the flag and the lettering (wing tops, fuselage sides, tail,
       arrows) replaced by plain white in Blender, then prop_pass at 512 textures: h_shuttle_enterprise.glb. Fitted to
       the code shuttle's wingspan, nose to +z like it; the code shuttle stays until it loads. */
    void hero(k, 'h_shuttle_enterprise', { width: 23.8 }).then((h) => {
      if (!h) return;
      for (const o of shuttle.children) o.visible = false;
      /* the exported materials are physical (sheen, specular) and the plain white panels read blown out in the pavilion:
         each becomes a plain matte standard material, the untextured panels a shade of grey that reads white in that light */
      h.traverse((o) => { if (o instanceof T.Mesh) o.material = [o.material].flat().map((src) => { const s0 = src as T.MeshStandardMaterial; const m = new T.MeshStandardMaterial({ name: s0.name, map: s0.map, normalMap: s0.normalMap, color: s0.color.clone().multiplyScalar(/wing/.test(s0.name) ? (s0.map ? 0.5 : 0.3) : s0.map ? 0.85 : 0.62) /* the wing tops face the sun */, roughness: 0.85, metalness: 0, envMapIntensity: 0.4 }); return m; })[0]; });
      h.position.y = -2.6; shuttle.add(h);
    });
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
    // the kamikaze plaque set into the flight deck
    const plaque = k.box(1.2, 0.06, 0.8, -2, DY + 0.24, 40, k.flat(0x8a6a3a, 0.8, 0.35));
    const IW = 'https://en.wikipedia.org/wiki/Intrepid_Museum', IN = 'Intrepid Museum, Wikipedia';
    k.egg(plaque, { id: 'intrepid-kamikaze', title: 'The plaque in the deck', year: '1944', text: 'A plaque on the flight deck marks the spot where a kamikaze attack in 1944 killed 22 members of the crew. The carrier was towed to Pier 86 in June 1982 and opened as a museum on August 3, 1982, the second American carrier to become one, after the Yorktown.', clue: 'Look down at the brass plaque set into the flight deck.', source: { name: IN, url: IW } }, { r: 1.4 });
    k.egg(v(-4, DY + 6, PZ), { id: 'intrepid-enterprise', title: 'The shuttle that came by barge', year: '2012', text: 'The space shuttle Enterprise was flown to JFK in April 2012, brought up the river by barge in June and put on display on July 19, 2012. Three months later Hurricane Sandy damaged it, and the Space Shuttle Pavilion did not reopen until July 2013.', clue: 'Walk aft into the pavilion and look up at the shuttle.', source: { name: IN, url: IW } }, { r: 3 });
    k.egg(v(14, DY + 1.2, HL / 2 - 6), { id: 'intrepid-stuck', title: 'Stuck in the mud', year: '2006', text: 'When the museum closed for a refit in 2006, the first attempt to tow the ship to dry dock on November 6 failed: its propellers were stuck in the Hudson mud. Tugboats finally pulled it free on December 5, 2006, after the Navy and the Army Corps of Engineers had spent $3 million.', clue: 'Go to the stern rail and look down at the water.', source: { name: IN, url: IW } }, { r: 1.8 });
    k.egg(concorde, { id: 'intrepid-concorde', title: 'The record Concorde', year: '2003', text: 'The Concorde on the pier is G-BOAD, a former British Airways aircraft that arrived in November 2003. Of the 20 Concordes built, it flew the most hours, 23,397.', clue: 'Look across to the white delta winged airliner on the pier.', source: { name: IN, url: IW } }, { r: 5 });
    k.egg(growler, { id: 'intrepid-growler', title: 'Twenty at a time', year: '1989', text: 'The submarine Growler, a Grayback class boat that carried nuclear Regulus missiles, was towed here in late 1988 and opened in May 1989. It holds only about twenty visitors at once, and anyone under forty inches tall cannot go in.', clue: 'Look past the pier for the black submarine.', source: { name: IN, url: IW } }, { r: 5 });
    k.egg(v(-8, DY + 1.6, -60), { id: 'intrepid-stadium', title: 'A stadium on the deck', year: '1998', text: 'For the 1998 Goodwill Games the flight deck was turned into a stadium with 3,300 seats. After September 11, 2001, the museum served as temporary field headquarters for the FBI.', clue: 'Stand in the open middle of the flight deck.', source: { name: IN, url: IW } }, { r: 1.8 });
    k.censusWall({ x: -HW / 2 + 1.2, y: HY + 4.2, z: -70, rotY: PI / 2, cols: 40, rows: 5, tile: 0.55, gap: 0.05, start: ctx.wallStart(7200, 200), pieces: ctx.all, backing: dark });
    k.box(0.6, 8, 24, -HW / 2 + 1.0, HY + 4, -70, greyD);
    // the works: the island's port face, the hangar deck bays on both sides, the pavilion wall, the deck edge screens
    const mounts: Mount[] = [];
    for (let i = 0; i < 4; i++) { const z = IZ - 10 + i * 6.5; mounts.push({ position: v(IX - 4.05, DY + 4, z), rotation: -PI / 2, target: v(IX - 14, DY + 3, z), width: 4.4, height: 2.6, style: 'steel', wash: false }); }
    for (let i = 0; i < 4; i++) { const z = -100 + i * 20; for (const s of [-1, 1]) { k.box(0.4, 4.4, 5.4, s * (HW / 2 - 1.2), HY + 3.2, z, greyD); mounts.push({ position: v(s * (HW / 2 - 1.36), HY + 3.4, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, HY + 3, z), width: 4.6, height: 2.7, style: 'steel', wash: false }); } }
    for (let i = 0; i < 3; i++) { const z = PZ - 12 + i * 12; mounts.push({ position: v(-17.5, DY + 5, z), rotation: PI / 2, target: v(13, DY + 4, z), width: 5, height: 3, style: 'none', wash: false }); }
    for (let i = 0; i < 3; i++) { const z = -HL / 2 + 30 + i * 40; k.box(0.2, 3, 4.6, -HW / 2 - 11.2, DY + 1.8, z, dark); mounts.push({ position: v(-HW / 2 - 11.05, DY + 2, z), rotation: PI / 2, target: v(-8, DY + 2, z), width: 4.2, height: 2.5, style: 'steel', wash: false }); }
    return { mounts, spawn: v(-6, DY + 3, HL / 2 - 70), look: v(IX - 6, DY + 8, IZ - 70), eye: 3, bounds: [-HW / 2 - 12, HW / 2 + 4, -HL / 2 + 1, HL / 2 - 1], style: 'steel', floorY: (x, z) => { if (z > -18) return DY + 0.2; if (z > -44 && Math.abs(x) < 3.4) return DY + 0.2 - ((-18 - z) / 26) * (DY - HY - 0.1); return HY + 0.3; } };
  },
};
