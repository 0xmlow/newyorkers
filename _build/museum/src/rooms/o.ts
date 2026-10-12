/* Rooms 67 to 71: balloon inflation night, Christopher Street, the San Gennaro feast, the Chelsea Hotel, the Strand. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront } from './f';

const PI = Math.PI;

/* ---------------- 67 BALLOON NIGHT ---------------- */
export const balloons: RoomDef = {
  id: 'balloons',
  name: 'The night before the parade',
  area: 'CENTRAL PARK WEST',
  mood: 'Inflation night',
  color: '#f0a0c0',
  description: 'The blocks beside the museum the night before Thanksgiving: giant balloons under their nets, the crews, the crowd shuffling past under the streetlights, the works on the barricade walls.',
  signatures: 'The pink granite Roosevelt Memorial front with its four columns and four figures on the parapet, the side streets closed off, enormous character balloons lying on their sides under cargo nets and sandbags, helium trucks, police barricades, families in coats, bare trees in the park.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x101a34, horizon: 0x4a4a68, ground: 0x0e1018, fog: 0.0024, stars: 220, env: 0.6 });
    k.hemi(0xd8e0ff, 0x1a1418, 0.55);
    k.sun(0xc8d0ff, 0.4, -60, 60, 40, false, 90);
    const asphalt = k.pbr('bnRoad', X.asphalt(0x24282d), 0.11),
      granite = k.pbr('bnGranite', X.ashlar(0xc6a090, 184, 3), 0.22), /* Pope's facade is pink granite */
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      steel = k.flat(0x8c98a4, 0.9, 0.3),
      net = k.flat(0xe8e0c0, 0, 0.9, { transparent: true, opacity: 0.35, wireframe: true }),
      sand = k.flat(0xd8c8a0, 0, 0.9),
      warm = k.glow(0xffd8a0),
      lawn = k.pbr('bnLawn', X.grass(0x2a4a2a, 88), 0.06),
      cat = k.flat(0xf08a2a, 0, 0.6), catD = k.flat(0x1a1a1a, 0, 0.6),
      star = k.flat(0xf1c531, 0, 0.5),
      dino = k.flat(0x3aa06a, 0, 0.6),
      fish = k.flat(0x3a8ad8, 0, 0.6),
      pink = k.flat(0xf05aa0, 0, 0.6),
      white = k.flat(0xf4f0e8, 0, 0.6);
    // the avenue and the two side streets closed off, the museum front, the park across
    street(k, { w: 24, len: 200, z: 0, x: 0 });
    for (const z of [-40, 40]) { k.box(80, 0.3, 16, -60, -0.15, z, asphalt); for (const s of [-1, 1]) k.box(80, 0.28, 4, -60, 0, z + s * 10, k.pbr('bnWalk', X.pavers(0x8e8b84, 89), 0.42)); }
    k.box(60, 30, 40, -60, 15, 0, granite);
    for (let i = 0; i < 4; i++) k.column(-31, 0, -9 + i * 6, 14, 1.0, granite, true);
    k.box(4, 3, 30, -31, 15.5, 0, granite); /* the entablature runs along the front, over the columns */
    /* no pediment on the Roosevelt Memorial: a parapet, and over each of the four columns a standing figure (Audubon,
       Boone, Lewis and Clark on the real front), kept generic here */
    k.box(4, 2.2, 30, -31, 18.1, 0, granite);
    for (let i = 0; i < 4; i++) { const z = -9 + i * 6; k.box(1.4, 0.4, 1.4, -31, 19.4, z, granite); k.box(0.9, 2.4, 0.7, -31, 20.8, z, granite); k.sphere(0.36, -31, 22.3, z, granite, 10); }
    for (let i = 0; i < 12; i++) k.box(30, 0.34, 1.0, -31 + 3 + i * 0.6, 0.17 + i * 0.34, 0, granite);
    k.block(-95, -25, -22, 22);
    k.sign('THE MUSEUM  ·  NATURAL HISTORY  ·  BALLOON NIGHT', 12, 0.8, -28.9, 15.5, 0, 'transparent', '#f4e4b0', 70, PI / 2);
    k.box(160, 0.4, 200, 60 + 40, -0.2, 0, lawn);
    const rnd = X.mulberry(67);
    for (let i = 0; i < 40; i++) k.tree(30 + rnd() * 100, 0, -90 + rnd() * 180, { kind: 'bare', h: 8 + rnd() * 6, r: 3 + rnd() * 2, seed: i, species: 'elm' }); /* American elms line the park side of Central Park West */
    k.rail(18, 0, 200, dark, 1.0, 'z', 2.4);
    k.block(17.6, 18.4, -100, 100);
    for (const z of [-80, -40, 0, 40, 80]) for (const s of [-1, 1]) k.lamp(s * 13.5, z, 6.2, dark, 0xffd9a8, 30);
    blockFront(k, { x: -100, z0: 100, count: 12, face: 1, seed: 185, h: [18, 34] });
    // the balloons: five giants on their sides under nets, sandbags round each, a helium truck per balloon
    const balloon = (x: number, z: number, kind: number) => {
      const g = new T.Group(); g.position.set(x, 0, z);
      const add = (geo: T.BufferGeometry, m: T.Material, px: number, py: number, pz: number, sx = 1, sy = 1, sz = 1) => { const mm = new T.Mesh(geo, m); mm.position.set(px, py, pz); mm.scale.set(sx, sy, sz); mm.castShadow = ctx.quality === 'high'; g.add(mm); return mm; };
      if (kind === 0) { add(new T.SphereGeometry(5, 20, 14), cat, 0, 4.2, 0, 1.6, 0.85, 1); add(new T.SphereGeometry(3.4, 18, 12), cat, 7, 3.6, 0, 1, 0.9, 1); add(new T.ConeGeometry(1.2, 2.4, 6), cat, 6, 6.6, -1.8); add(new T.ConeGeometry(1.2, 2.4, 6), cat, 6, 6.6, 1.8); add(new T.SphereGeometry(0.5, 8, 6), catD, 9.6, 4.2, -1.2); add(new T.SphereGeometry(0.5, 8, 6), catD, 9.6, 4.2, 1.2); add(new T.CylinderGeometry(0.5, 0.8, 8, 8), cat, -8, 2.2, 2).rotation.z = 1.2; }
      if (kind === 1) { for (let i = 0; i < 5; i++) { const a = (i / 5) * PI * 2 + PI / 2; add(new T.ConeGeometry(2.4, 7, 5), star, Math.cos(a) * 3.6, 3.6, Math.sin(a) * 3.6 * 0.3 + 0, 1, 1, 0.5).rotation.set(0, 0, -a + PI / 2); } add(new T.SphereGeometry(3.6, 16, 12), star, 0, 3.6, 0, 1, 1, 0.55); }
      if (kind === 2) { add(new T.SphereGeometry(4.6, 20, 14), dino, 0, 4, 0, 1.9, 0.8, 1); add(new T.CylinderGeometry(1.4, 2.4, 9, 10), dino, -11, 3, 0).rotation.z = PI / 2 - 0.2; add(new T.CylinderGeometry(1.2, 1.8, 7, 10), dino, 9, 5, 0).rotation.z = -1.1; add(new T.SphereGeometry(2, 12, 10), dino, 12, 7.6, 0); for (let i = 0; i < 6; i++) add(new T.ConeGeometry(0.6, 1.6, 5), k.flat(0x2a7a4a, 0, 0.6), -6 + i * 2.4, 7.4, 0); }
      if (kind === 3) { add(new T.SphereGeometry(4, 20, 14), fish, 0, 3.4, 0, 2.2, 0.85, 1); add(new T.ConeGeometry(3, 5, 4), fish, -10.5, 3.4, 0, 1, 1, 0.4).rotation.z = PI / 2; add(new T.SphereGeometry(0.7, 8, 6), white, 6.5, 4.6, -2); add(new T.SphereGeometry(0.7, 8, 6), white, 6.5, 4.6, 2); for (let i = 0; i < 5; i++) add(new T.TorusGeometry(1.2 + i * 0.1, 0.16, 6, 12), white, -2 + i * 2, 3.4, 0, 1, 1, 1).rotation.y = PI / 2; }
      if (kind === 4) { add(new T.SphereGeometry(4.2, 20, 14), pink, 0, 3.8, 0, 1.3, 0.9, 1); add(new T.SphereGeometry(3, 16, 12), pink, 6, 4.4, 0); add(new T.SphereGeometry(1.4, 12, 8), pink, 7.6, 7.2, -2.2); add(new T.SphereGeometry(1.4, 12, 8), pink, 7.6, 7.2, 2.2); add(new T.SphereGeometry(0.4, 8, 6), catD, 9, 4.8, -1); add(new T.SphereGeometry(0.4, 8, 6), catD, 9, 4.8, 1); add(new T.SphereGeometry(0.9, 8, 6), white, 9.4, 3.6, 0); }
      k.add(g);
      k.mesh(new T.SphereGeometry(kind === 1 ? 5.8 : 8.2, 12, 8), net, x + (kind === 2 || kind === 3 ? 1 : 2), 3.8, z).scale.set(kind === 2 ? 1.9 : 1.5, 0.75, 1.1);
      for (let i = 0; i < 14; i++) { const a = (i / 14) * PI * 2; const rx = (kind === 2 ? 14 : 11) * Math.cos(a) + 1, rz = 7 * Math.sin(a); k.box(0.7, 0.35, 0.45, x + rx, 0.18, z + rz, sand).rotation.y = a; }
      k.keepOut.push({ x: x + 1, z, r: kind === 2 ? 14 : 11 });
      return g;
    };
    const set = [balloon(-60, -40, 0), balloon(-60, 40, 2), balloon(-36, -40, 1), balloon(-34, 40, 3), balloon(-84, 40, 4)];
    if (!ctx.reduced) k.ticks.push((t) => set.forEach((g, i) => { g.position.y = 0.15 * Math.sin(t * 0.8 + i * 1.3); g.rotation.z = 0.01 * Math.sin(t * 0.5 + i); }));
    for (const [x, z] of [[-86, -40], [-8, 40]]) { k.box(2.6, 3.2, 8, x, 1.6, z, white); k.box(2.6, 2.4, 2.4, x, 1.2, z + 5, dark); for (const dx of [-1.1, 1.1]) for (const dz of [-2.6, 3.4]) k.cyl(0.5, 0.4, x + dx, 0.5, z + dz, dark, 0.5, 12).rotation.z = PI / 2; k.keepOut.push({ x, z, r: 4.5 }); k.beam(v(x + 1.3, 1.4, z), v(x + 6, 0.4, z - 4), 0.05, dark, 4); }
    for (let x = -95; x <= -25; x += 4) for (const z of [-32, -48, 32, 48]) { k.box(2.2, 1.0, 0.06, x, 0.55, z, dark); for (const dx of [-1.05, 1.05]) k.box(0.06, 1.05, 0.06, x + dx, 0.52, z, dark); }
    k.block(-96, -24, -33, -31); k.block(-96, -24, -49, -47); k.block(-96, -24, 31, 33); k.block(-96, -24, 47, 49);
    // the crowd shuffles the loop: avenue, side street, avenue
    k.crowd([v(6, 0, -70), v(6, 0, -30), v(-90, 0, -30), v(-90, 0, 30), v(6, 0, 30), v(6, 0, 70), v(-4, 0, 70), v(-4, 0, -70)], 60, { seed: 71, speed: 0.6, spread: 3, animate: !ctx.reduced, closed: true, colors: [0x24262c, 0x8a3a3a, 0x33477f, 0x151517, 0xc9a25a, 0x6a4a8a, 0xd8d0c0] });
    k.censusWall({ x: -24.66, y: 3.2, z: 0, rotY: PI / 2, cols: 22, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(7800, 88), pieces: ctx.all, backing: dark });
    k.box(0.4, 6, 14, -24.9, 3, 0, dark);
    const MP = 'https://en.wikipedia.org/wiki/Macy%27s_Thanksgiving_Day_Parade', AM = 'https://en.wikipedia.org/wiki/American_Museum_of_Natural_History';
    k.egg(set[0], { id: 'balloons-felix', title: 'Felix on sticks', year: '1927', text: 'The first parade, in 1924, had live animals borrowed from the Central Park Zoo. In 1927 the first balloon, a Felix the Cat, replaced them, filled with air and held up on sticks. Macy\'s switched to helium the next year.', clue: 'Find the cat lying on its side under its net.', source: { name: 'Macy\'s Thanksgiving Day Parade, Wikipedia', url: MP } });
    k.egg(set[1], { id: 'balloons-reward', title: 'Let go on purpose', year: '1928', text: 'In 1928 Tony Sarg released five balloons into the sky with a reward for whoever brought one back: $100, cut to $50 the next year. In 1931 an aviator cut a dragon balloon down in midair for a $25 reward, and a blue hippo was never found. The releases ended in 1932 after a novice pilot nearly crashed chasing one.', clue: 'Look at the dinosaur on 81st Street.', source: { name: 'Macy\'s Thanksgiving Day Parade, Wikipedia', url: MP } });
    k.egg(v(-86, 2.2, -36), { id: 'balloons-rubber', title: 'Rubber for the war', year: '1942', text: 'The parade did not run from 1942 to 1944, because the rubber and helium were needed for the war effort. It came back in 1945.', clue: 'Find the helium truck at the far end of 77th Street.', source: { name: 'Macy\'s Thanksgiving Day Parade, Wikipedia', url: MP } }, { r: 1.8 });
    k.egg(v(13.5, 5.6, -40), { id: 'balloons-wind', title: 'The wind law', year: '1997', text: 'After a Cat in the Hat balloon hit a lamppost in 1997 and badly injured a parade goer, the city passed a law: no full size balloons if sustained winds pass 23 mph or gusts pass 35 mph. Each character balloon is handled by 90 people.', clue: 'Look at the lampposts along the avenue.', source: { name: 'Macy\'s Thanksgiving Day Parade, Wikipedia', url: MP } }, { r: 1.4 });
    k.egg(v(-31, 20.8, 3), { id: 'balloons-explorers', title: 'Four on the parapet', year: '1936', text: 'The museum\'s Central Park West front is the Theodore Roosevelt Memorial by John Russell Pope, pink granite modelled on Roman arches, dedicated in 1936. Figures of Audubon, Boone, Lewis and Clark by James Earle Fraser stand over the four columns, each column 48 feet tall.', clue: 'Look up at the top of the four columns.', source: { name: 'American Museum of Natural History, Wikipedia', url: AM } }, { r: 2.0 });
    k.egg(v(-20, 1.0, 0), { id: 'balloons-statue', title: 'The statue that left', year: '2022', text: 'Fraser\'s bronze equestrian statue of Roosevelt stood on these steps until January 2022. The museum removed it because of the way it placed a Native American and an African American figure beside him, and lent it to the Theodore Roosevelt Presidential Library in North Dakota.', clue: 'Stand at the foot of the museum steps, where the bronze rider used to be.', source: { name: 'American Museum of Natural History, Wikipedia', url: AM } }, { r: 0.9 });
    // the works: light boxes along the barricade lines on both side streets, the park fence, the museum steps
    const mounts: Mount[] = [];
    for (let i = 0; i < 6; i++) { const x = -90 + i * 12; for (const [z, rot] of [[-30.8, 0], [30.8, PI]] as const) { k.box(4.6, 3.2, 0.4, x, 2.0, z + (rot ? 0.3 : -0.3), dark); mounts.push({ position: v(x, 2.1, z + (rot ? 0.08 : -0.08)), rotation: rot, target: v(x, 2, rot ? z - 8 : z + 8), width: 4.2, height: 2.5, style: 'black', wash: true }); } }
    for (let i = 0; i < 6; i++) { const z = -60 + i * 24; k.box(0.3, 3.0, 4.2, 18.4, 1.9, z, dark); mounts.push({ position: v(18.2, 2.0, z), rotation: -PI / 2 + PI, target: v(8, 2, z), width: 3.6, height: 2.1, style: 'black', wash: true }); }
    for (let i = 0; i < 2; i++) { const z = -14 + i * 28; mounts.push({ position: v(-30.6, 6, z), rotation: PI / 2, target: v(-16, 3, z), width: 4.4, height: 2.6, style: 'steel', wash: true }); }
    return { mounts, spawn: v(6, 3, -66), look: v(-50, 6, -40), eye: 3, bounds: [-96, 17, -96, 96], style: 'black' };
  },
};

/* ---------------- 68 CHRISTOPHER STREET ---------------- */
export const stonewall: RoomDef = {
  id: 'stonewall',
  name: 'Christopher Street',
  area: 'SHERIDAN SQUARE',
  mood: 'The last Sunday in June',
  color: '#e83a8a',
  description: 'The little brick bar with its arched windows, the park across the street with the white figures, the banners on every building, the march coming down Christopher with its floats.',
  signatures: 'The two storey front, brick below and stucco above, the storefront window between two arched doors and the neon in the window, the triangular park with its benches and the four white sculptures, rainbow flags on the fire escapes, floats and marchers filling the narrow street, confetti in the air.',
  build(k, ctx) {
    k.sky({ top: 0x5f94d8, horizon: 0xf0e8e0, ground: 0x6a6660, fog: 0.002, sun: { az: 3.3, el: 0.85, color: 0xfff6e8, size: 12 }, env: 1.0 });
    k.hemi(0xf6f6ff, 0x5a5048, 0.95);
    k.sun(0xfff2dc, 2.4, 20, 80, 30, true, 90);
    const brick = k.pbr('swBrick', X.brick(0x8a4a3a, 186), 0.28),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      white = k.flat(0xf4f0e8, 0, 0.6),
      iron = k.flat(0x1f242a, 0.7, 0.45),
      neon = k.glow(0xff4a6a),
      lawn = k.pbr('swLawn', X.grass(0x4a7a3a, 90), 0.06),
      wood = k.pbr('swBench', X.planks(0x6a5a45, 3, 187), 1.2),
      rainbow = [0xe40303, 0xff8c00, 0xffed00, 0x008026, 0x24408e, 0x732982].map((c) => k.flat(c, 0, 0.7));
    // the street bending past the park, the low brick blocks with fire escapes, flags everywhere
    street(k, { w: 12, len: 140, z: 0, x: 0 });
    k.box(12, 0.3, 60, -14, -0.15, -50, k.pbr('asphaltS', X.asphalt(0x24282d), 0.11));
    blockFront(k, { x: -11, z0: 60, count: 6, face: 1, seed: 188, h: [10, 14] });
    blockFront(k, { x: 11, z0: 60, count: 5, face: -1, seed: 189, h: [10, 16] });
    blockFront(k, { x: 11, z0: -10, count: 8, face: -1, seed: 190, h: [10, 14] });
    for (let i = 0; i < 24; i++) { const s = i % 2 ? 1 : -1; const z = 56 - i * 4.6; const x = s * 10.2; for (let c = 0; c < 6; c++) k.box(0.05, 0.16, 1.0, x + s * 0.05, 7.5 - c * 0.16, z, rainbow[c]); }
    const BX = -11, BZ = -4;
    k.box(12, 9, 10, BX - 6, 4.5, BZ, brick);
    /* the real front: brick at street level, stucco above, a wide storefront window between two arched entrances,
       three windows on the second floor (two 1840s stables refaced together in 1930) */
    const swGlass = k.glass(0xffe0c0, 0.35, 0.1);
    k.box(0.1, 5.2, 10, BX + 0.05, 6.4, BZ, k.pbr('swStucco', X.plaster(0xd8cfc0, 186), 0.3));
    for (const dz of [-3.4, 3.4]) { k.arch(1.8, 3.2, 0.4, BX + 0.1, 0.8, BZ + dz, dark, false, 0.8).rotation.y = PI / 2; k.box(0.1, 2.4, 1.4, BX + 0.16, 2.2, BZ + dz, swGlass); }
    k.box(0.14, 2.4, 4.0, BX + 0.12, 2.0, BZ, dark); k.box(0.1, 2.0, 3.6, BX + 0.18, 2.0, BZ, swGlass);
    for (const dz of [-3.4, 0, 3.4]) { k.box(0.12, 1.9, 1.3, BX + 0.1, 7.0, BZ + dz, dark); k.box(0.1, 1.6, 1.0, BX + 0.14, 7.0, BZ + dz, swGlass); }
    k.mesh(new T.BoxGeometry(0.06, 0.5, 1.2), neon, BX + 0.24, 2.4, BZ + 0.6);
    k.sign('STONEWALL INN', 3.6, 0.7, BX + 0.16, 5.2, BZ, '#1a1c20', '#f4f0e8', 70, PI / 2, { border: true });
    k.block(BX - 12.5, BX + 0.4, BZ - 5.5, BZ + 5.5);
    for (let c = 0; c < 6; c++) k.box(0.1, 0.3, 4.2, BX + 0.18, 7.2 - c * 0.3, BZ, rainbow[c]);
    k.point(BX + 1, 2.6, BZ + 0.6, 0xff6a8a, 12, 6);
    // the park: a triangle with lawn, benches, the four white figures on their bases
    const P = [v(2, 0, -8), v(28, 0, -40), v(2, 0, -44)];
    const tri = new T.Shape(); tri.moveTo(P[0].x, -P[0].z); tri.lineTo(P[1].x, -P[1].z); tri.lineTo(P[2].x, -P[2].z); tri.closePath();
    const lg = new T.ExtrudeGeometry(tri, { depth: 0.3, bevelEnabled: false }); lg.rotateX(-PI / 2); k.mesh(lg, lawn, 0, 0.02, 0);
    for (let i = 0; i < 3; i++) { const a = P[i], b = P[(i + 1) % 3]; const len = a.distanceTo(b), m = a.clone().lerp(b, 0.5); const f = k.box(0.06, 1.1, len, m.x, 0.55, m.z, iron); f.rotation.y = Math.atan2(b.x - a.x, b.z - a.z); for (let t = 0; t < 1; t += 0.06) { const p = a.clone().lerp(b, t); k.box(0.06, 1.2, 0.06, p.x, 0.6, p.z, iron); } }
    /* The park used to be sealed, which put the works on its own railings
       out of reach: they face in, so the lawn is the only floor they can be
       seen from. */
    const fig = (x: number, z: number, seated: boolean) => { k.box(0.6, seated ? 0.9 : 1.7, 0.4, x, seated ? 0.95 : 1.35, z, white); k.sphere(0.2, x, seated ? 1.6 : 2.4, z, white, 10); if (seated) k.box(0.6, 0.3, 0.9, x, 0.6, z + 0.3, white); };
    k.bench(8, -20, 0.6, wood, iron, 2.0); fig(7.6, -20.4, true); fig(8.6, -20.4, true);
    fig(12, -16, false); fig(12.8, -15.2, false);
    /* General Sheridan in bronze (1936) at the point of the park, a generic figure on a granite pedestal */
    const bronze = k.flat(0x3a4a3c, 0.6, 0.5);
    k.box(1.4, 1.8, 1.4, 4.6, 0.9, -12.5, k.flat(0x8a8680, 0, 0.8)); k.box(0.7, 1.9, 0.5, 4.6, 2.75, -12.5, bronze); k.sphere(0.22, 4.6, 3.9, -12.5, bronze, 10); k.keepOut.push({ x: 4.6, z: -12.5, r: 1.1 });
    const SNM = 'https://en.wikipedia.org/wiki/Stonewall_National_Monument', SWI = 'https://en.wikipedia.org/wiki/Stonewall_Inn';
    k.egg(v(BX + 0.4, 7.0, BZ - 3.4), { id: 'stonewall-stables', title: 'Two stables', year: '1843', text: 'The Stonewall began as two horse stables, No. 51 built in 1843 and No. 53 in 1846. In 1930 the architect William Bayard Willis joined and refaced them, and the third storey of No. 51 came off.', clue: 'Look at the second floor windows over the bar.', source: { name: 'Stonewall Inn, Wikipedia', url: SWI } }, { r: 1.4 });
    k.egg(v(BX + 0.5, 2.0, BZ + 3.4), { id: 'stonewall-raid', title: 'One twenty in the morning', year: '1969', text: 'The bar opened as a gay bar on March 18, 1967, bought for $3,500 by men tied to the Genovese family, and ran as a members only club because it had no liquor licence. The police raid that started the uprising came at about 1:20 a.m. on June 28, 1969, and the unrest ran until July 3.', clue: 'Stand at the arched door of the bar.', source: { name: 'Stonewall Inn, Wikipedia', url: SWI } }, { r: 1.0 });
    k.egg(v(BX + 0.5, 5.2, BZ), { id: 'stonewall-register', title: 'One in seventy thousand', year: '1999', text: 'When the site joined the National Register of Historic Places in 1999 it was the first listing, out of more than 70,000 at the time, dedicated only to LGBT history. It became a National Historic Landmark in 2000, a city landmark in 2015 and a national monument on June 24, 2016.', clue: 'Read the sign over the storefront.', source: { name: 'Stonewall National Monument, Wikipedia', url: SNM } }, { r: 1.4 });
    k.egg(v(8.1, 1.4, -20.4), { id: 'stonewall-segal', title: 'Gay Liberation', year: '1992', text: 'George Segal\'s white figures, two men standing and two women seated on a bench, were placed in the park in 1992. A near identical cast stands at Stanford University.', clue: 'Sit down on the bench with the white figures.', source: { name: 'Stonewall National Monument, Wikipedia', url: SNM } }, { r: 1.4 });
    k.egg(v(4.6, 3.2, -12.5), { id: 'stonewall-farm', title: 'A tobacco farm and a fire', year: '1835', text: 'The little park was once part of a tobacco farm that Wouter van Twiller worked from 1633 to 1638. The Great Fire of 1835 swept the block, which was then condemned and made a park. The bronze of General Philip Sheridan here dates from 1936.', clue: 'Find the bronze general at the point of the park.', source: { name: 'Stonewall National Monument, Wikipedia', url: SNM } }, { r: 1.4 });
    k.egg(v(BX + 0.4, 2.4, BZ - 7), { id: 'stonewall-station', title: 'The station changed its name', year: '2024', text: 'The monument\'s visitor centre opened next door at 51 Christopher Street on June 28, 2024, the first official national visitor centre for the LGBTQ+ experience. The same day the Christopher Street Sheridan Square subway station was renamed Christopher Street Stonewall.', clue: 'Look at the door just south of the bar.', source: { name: 'Stonewall National Monument, Wikipedia', url: SNM } }, { r: 1.4 });
    for (let i = 0; i < 6; i++) k.tree(6 + i * 3.4, 0, -14 - i * 4.4, { kind: 'round', h: 5 + (i % 3), r: 2.6, leaf: 0x4a7a3c, seed: i });
    // the march: floats on the street with dancers, marchers on both sides, confetti drifting down
    const floats: T.Group[] = [];
    for (let i = 0; i < 3; i++) { const g = new T.Group(); const bed = new T.Mesh(new T.BoxGeometry(4.6, 1.4, 10), k.flat([0xe83a8a, 0x3a8ad8, 0xf1c531][i], 0.1, 0.6)); bed.position.y = 0.9; g.add(bed); const cab = new T.Mesh(new T.BoxGeometry(2.4, 2.2, 2.4), white); cab.position.set(0, 2.3, 5.8); g.add(cab); for (let c = 0; c < 6; c++) { const band = new T.Mesh(new T.BoxGeometry(4.7, 0.2, 10.1), rainbow[c]); band.position.y = 0.3 + c * 0.22; g.add(band); } for (let d = 0; d < 6; d++) { const dancer = new T.Mesh(new T.CapsuleGeometry(0.2, 0.8, 3, 8), [white, k.flat(0x151517, 0, 0.8), rainbow[d]][d % 3]); dancer.position.set(-1.6 + (d % 3) * 1.6, 2.2, -3 + Math.floor(d / 3) * 4); g.add(dancer); } const arch = new T.Mesh(new T.TorusGeometry(2.4, 0.25, 8, 24, PI), rainbow[i]); arch.position.set(0, 1.6, -2); g.add(arch); g.position.set(0, 0, -60 + i * 50); k.add(g); floats.push(g); }
    if (!ctx.reduced) k.ticks.push((t, dt) => floats.forEach((g, i) => { g.position.z += 1.4 * Math.min(dt, 0.1); if (g.position.z > 80) g.position.z = -70; g.children.forEach((c, j) => { if (j >= 8 && j < 14) c.position.y = 2.2 + 0.25 * Math.abs(Math.sin(t * 4 + j + i)); }); }));
    k.crowd([v(-4.5, 0, -70), v(-4.5, 0, 70)], 40, { seed: 72, speed: 1.3, spread: 1.6, animate: !ctx.reduced, colors: [0xe40303, 0xff8c00, 0xffed00, 0x008026, 0x24408e, 0x732982, 0xf4f0e8, 0x151517] });
    k.crowd([v(4.5, 0, -70), v(4.5, 0, 70)], 40, { seed: 73, speed: 1.3, spread: 1.6, animate: !ctx.reduced, colors: [0xe40303, 0xff8c00, 0xffed00, 0x008026, 0x24408e, 0x732982, 0xf4f0e8, 0x151517] });
    k.crowd([v(-8.6, 0, 60), v(-8.6, 0, -60)], 24, { seed: 74, speed: 0.2, spread: 1.2, animate: !ctx.reduced });
    k.crowd([v(8.6, 0, 60), v(8.6, 0, 0)], 16, { seed: 75, speed: 0.2, spread: 1.2, animate: !ctx.reduced });
    const conf: T.Matrix4[] = []; const rnd = X.mulberry(68);
    for (let i = 0; i < 500; i++) conf.push(new T.Matrix4().compose(v((rnd() - 0.5) * 24, rnd() * 14, (rnd() - 0.5) * 120), new T.Quaternion(), v(1, 1, 1)));
    const confetti = k.instances(new T.PlaneGeometry(0.12, 0.12), k.flat(0xffffff, 0, 0.8, { side: T.DoubleSide, vertexColors: false }), conf);
    const cc = new T.Color(); for (let i = 0; i < 500; i++) confetti.setColorAt(i, cc.set([0xe40303, 0xff8c00, 0xffed00, 0x008026, 0x24408e, 0x732982][i % 6]));
    if (!ctx.reduced) { const m = new T.Matrix4(), p = new T.Vector3(), q = new T.Quaternion(), s = new T.Vector3(1, 1, 1); k.ticks.push((t, dt) => { for (let i = 0; i < 500; i++) { confetti.getMatrixAt(i, m); p.setFromMatrixPosition(m); p.y -= (0.5 + (i % 5) * 0.2) * Math.min(dt, 0.1); p.x += Math.sin(t * 2 + i) * 0.01; if (p.y < 0.1) p.y = 14; q.setFromEuler(new T.Euler(t * 2 + i, t + i, 0)); m.compose(p, q, s); confetti.setMatrixAt(i, m); } confetti.instanceMatrix.needsUpdate = true; }); }
    k.censusWall({ x: 10.66, y: 3.4, z: -30, rotY: -PI / 2, cols: 30, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(600, 120), pieces: ctx.all, backing: dark });
    // the works: banners across the street between the fire escapes, the park fence, the bar's flank
    const mounts: Mount[] = [];
    for (let i = 0; i < 8; i++) { const z = 50 - i * 12; const s = i % 2 ? 1 : -1; k.box(0.14, 3.0, 4.2, s * 10.5, 4.6, z, dark); mounts.push({ position: v(s * 10.4, 4.6, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 3, z), width: 3.6, height: 2.4, style: 'none', wash: false }); }
    for (let i = 0; i < 5; i++) { const t = 0.12 + i * 0.19; const p = P[0].clone().lerp(P[1], t); const ang = Math.atan2(P[1].x - P[0].x, P[1].z - P[0].z); mounts.push({ position: v(p.x - Math.cos(ang) * 0.3, 1.6, p.z + Math.sin(ang) * 0.3), rotation: ang - PI / 2, target: v(p.x - Math.cos(ang) * 6, 2, p.z + Math.sin(ang) * 6), width: 2.6, height: 1.6, style: 'white', wash: false }); k.box(2.9, 1.9, 0.1, p.x, 1.6, p.z, white).rotation.y = ang; }
    for (let i = 0; i < 4; i++) { const z = -38 + i * 3; mounts.push({ position: v(2.2, 1.6, z), rotation: -PI / 2, target: v(-3, 2, z), width: 2.4, height: 1.5, style: 'white', wash: false }); k.box(0.1, 1.9, 2.7, 2.05, 1.6, z, white); }
    for (let i = 0; i < 3; i++) { const z = BZ - 12 - i * 5; k.box(0.2, 3, 4.2, -10.7, 2.6, z, dark); mounts.push({ position: v(-10.55, 2.6, z), rotation: PI / 2, target: v(-4, 2.5, z), width: 3.6, height: 2.1, style: 'none', wash: false }); }
    return { mounts, spawn: v(-8.2, 3, 46), look: v(-1, 4, -20), eye: 3, /* stonewall: three works run east along Christopher Street to x 25 */ bounds: [-10, 32, -70, 66], style: 'white' };
  },
};

/* ---------------- 69 THE FEAST ---------------- */
export const sangennaro: RoomDef = {
  id: 'sangennaro',
  name: 'The feast on Mulberry',
  area: 'THE FEAST OF SAN GENNARO',
  mood: 'Eleven nights in September',
  color: '#e8503a',
  description: 'Mulberry Street under the arches of lights, the zeppole stands, the sausage smoke, the saint carried down the block, the works between the strings of bulbs.',
  signatures: 'Arches of red white and green lights spanning the street block after block, food stands with striped awnings and steam, the tenements with fire escapes, the statue of the saint on his litter pinned with ribbons, the cannoli.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x14183a, horizon: 0x5a3a48, ground: 0x0e0e12, fog: 0.003, stars: 160, env: 0.6 });
    k.hemi(0xffe0c0, 0x1a1418, 0.5);
    const asphalt = k.pbr('sgRoad', X.asphalt(0x2a2a2e), 0.11),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      steel = k.flat(0x8c98a4, 0.9, 0.3),
      wood = k.pbr('sgWood', X.planks(0x8a6a48, 4, 191), 1.0),
      redS = k.flat(0xc62828, 0, 0.8), whiteS = k.flat(0xf4f0e8, 0, 0.8), greenS = k.flat(0x2e7d32, 0, 0.8),
      bulbR = k.glow(0xff4a3a), bulbW = k.glow(0xfff4d8), bulbG = k.glow(0x4ad86a),
      gold = k.pbr('sgGold', X.gilt(0xd0a852), 2, { metalness: 0.85, roughness: 0.3 }),
      steam = k.flat(0xffffff, 0, 1, { transparent: true, opacity: 0.25 }),
      pastry = k.flat(0xd8a860, 0, 0.8);
    // the street, the tenements
    street(k, { w: 10, len: 160, z: 0, x: 0, walk: 4 });
    blockFront(k, { x: -9, z0: 80, count: 20, face: 1, seed: 192, h: [12, 18] });
    blockFront(k, { x: 9, z0: 80, count: 20, face: -1, seed: 193, h: [12, 18] });
    k.skyline({ z: -200, count: 24, spacing: 10, scale: 3.0, base: -1, seed: 194, lit: 0.4, glow: 1.0, tint: 0x2a3244, rows: 1 });
    // the arches of light: every twelve metres a steel arch with three rows of bulbs
    const bulbs: T.Mesh[] = [];
    for (let z = 72; z >= -72; z -= 12) {
      const pts: T.Vector3[] = []; for (let i = 0; i <= 16; i++) { const a = (i / 16) * PI; pts.push(v(-Math.cos(a) * 8.5, 5 + Math.sin(a) * 4.4, z)); }
      k.curve(pts, 0.08, steel, 16);
      for (const s of [-1, 1]) k.box(0.16, 5.2, 0.16, s * 8.5, 2.6, z, steel);
      for (let row = 0; row < 3; row++) for (let i = 1; i < 16; i++) { const a = (i / 16) * PI; const r = 4.4 - row * 0.7; const b = k.mesh(new T.SphereGeometry(0.11, 6, 5), [bulbR, bulbW, bulbG][row], -Math.cos(a) * (8.5 - row * 0.9), 5 + Math.sin(a) * r - row * 0.2, z, true); bulbs.push(b); }
      k.point(0, 8, z, 0xffd8a0, 30, 16);
    }
    if (!ctx.reduced) k.ticks.push((t) => bulbs.forEach((b, i) => { const on = Math.sin(t * 5 + (i % 3) * 2.1) > -0.3; b.scale.setScalar(on ? 1 : 0.55); }));
    for (let z = 66; z >= -66; z -= 12) { for (let c = 0; c < 6; c++) k.box(0.04, 3, 0.04, -8.5 + 0.02, 6.5 + 0, z + 1 + c * 0.5, [redS, whiteS, greenS][c % 3]); }
    // the stands: striped awnings on both curbs, counters, steam, the goods
    const rnd = X.mulberry(69);
    for (let i = 0; i < 14; i++) {
      const s = i % 2 ? 1 : -1; const z = 60 - i * 9; const x = s * 6.2;
      k.box(3.2, 1.0, 2.4, x, 0.5, z, wood); k.box(3.4, 0.08, 2.6, x, 1.04, z, whiteS);
      for (const dx of [-1.5, 1.5]) for (const dz of [-1.1, 1.1]) k.box(0.06, 3.0, 0.06, x + dx, 1.5, z + dz, steel);
      for (let st = 0; st < 6; st++) k.box(3.6 / 6, 0.06, 3.0, x - 1.8 + 0.3 + st * 0.6, 3.05, z, [redS, whiteS, greenS][st % 3]);
      k.block(x - 1.7, x + 1.7, z - 1.3, z + 1.3);
      const kind = i % 4;
      if (kind === 0) { for (let j = 0; j < 12; j++) k.sphere(0.12, x - 1.2 + (j % 6) * 0.48, 1.2, z - 0.4 + Math.floor(j / 6) * 0.8, pastry, 6); const st = k.mesh(new T.SphereGeometry(0.9, 8, 6), steam, x, 2.0, z, true); st.userData.p = 0; if (!ctx.reduced) k.ticks.push((t) => { st.position.y = 1.6 + ((t * 0.3 + i) % 1) * 1.2; st.scale.setScalar(0.6 + ((t * 0.3 + i) % 1)); (st.material as T.MeshStandardMaterial).opacity = 0.3 * (1 - ((t * 0.3 + i) % 1)); }); }
      if (kind === 1) { for (let j = 0; j < 8; j++) k.cyl(0.08, 0.7, x - 1.2 + j * 0.34, 1.1, z + 0.3, k.flat(0x8a3a2a, 0, 0.7), 0.08, 8).rotation.z = PI / 2; k.box(2.4, 0.3, 1.0, x, 1.2, z - 0.4, dark); }
      if (kind === 2) { for (let j = 0; j < 10; j++) k.cyl(0.12, 0.5, x - 1.2 + j * 0.27, 1.16, z, k.flat(0xf4e8d0, 0, 0.6), 0.12, 8).rotation.z = PI / 2; }
      if (kind === 3) { for (let j = 0; j < 6; j++) { const c = k.flat([0xe83a3a, 0xf1c531, 0x3aa06a, 0x3a8ad8][j % 4], 0, 0.6); k.sphere(0.3, x - 1.2 + j * 0.5, 4.2 + (j % 2) * 0.4, z, c, 8); k.beam(v(x - 1.2 + j * 0.5, 3.1, z), v(x - 1.2 + j * 0.5, 3.9 + (j % 2) * 0.4, z), 0.01, whiteS, 3); } }
      k.sign(['ZEPPOLE', 'SAUSAGE & PEPPERS', 'CANNOLI', 'BALLOONS  ·  GAMES'][kind], 3.2, 0.5, x, 3.5, z + (s > 0 ? -1.55 : 1.55), '#c62828', '#f4f0e8', 60, s > 0 ? PI : 0, { border: true });
      k.point(x, 2.6, z, 0xffe0b0, 8, 5);
    }
    // the procession: the saint on his litter carried down the middle, the band ahead, the crowd all round
    const litter = new T.Group();
    const base = new T.Mesh(new T.BoxGeometry(2.2, 0.4, 2.6), gold); base.position.y = 1.6; litter.add(base);
    /* the saint is carried as a half figure bust in bishop's robes and mitre, not a full standing statue */
    const saint = new T.Mesh(new T.CapsuleGeometry(0.5, 0.5, 4, 10), k.flat(0xf4e8d0, 0, 0.6)); saint.position.y = 2.35; litter.add(saint);
    const head = new T.Mesh(new T.SphereGeometry(0.26, 12, 10), k.flat(0xe8d4b8, 0, 0.6)); head.position.y = 3.25; litter.add(head);
    const mitre = new T.Mesh(new T.ConeGeometry(0.24, 0.6, 6), gold); mitre.position.y = 3.75; litter.add(mitre);
    for (let i = 0; i < 30; i++) { const rib = new T.Mesh(new T.PlaneGeometry(0.16, 0.7 + (i % 3) * 0.3), k.flat([0x3aa06a, 0xf4f0e8, 0xe83a3a][i % 3], 0, 0.8, { side: T.DoubleSide })); const a = (i / 30) * PI * 2; rib.position.set(Math.cos(a) * 0.7, 2.4 + (i % 4) * 0.25, Math.sin(a) * 0.7); rib.rotation.y = -a; litter.add(rib); }
    for (const dx of [-1.2, 1.2]) for (const dz of [-1.5, 1.5]) { const bearer = new T.Mesh(new T.CapsuleGeometry(0.2, 0.9, 3, 8), k.flat(0xf4f0e8, 0, 0.8)); bearer.position.set(dx, 0.9, dz); litter.add(bearer); const pole = new T.Mesh(new T.BoxGeometry(0.08, 0.08, 3.4), wood); pole.position.set(dx, 1.5, 0); litter.add(pole); }
    k.add(litter);
    if (!ctx.reduced) k.rider(litter, k.spline([v(0, 0, 76), v(0.4, 0, 0), v(0, 0, -76), v(-14, 0, -90), v(14, 0, -90)], true), 0.7, 60);
    if (!ctx.reduced) k.ticks.push((t) => { litter.position.y = 0.08 * Math.sin(t * 3); });
    k.crowd([v(-3.2, 0, -70), v(-3.2, 0, 70)], 40, { seed: 76, speed: 0.5, spread: 1.4, animate: !ctx.reduced });
    k.crowd([v(3.2, 0, -70), v(3.2, 0, 70)], 40, { seed: 77, speed: 0.5, spread: 1.4, animate: !ctx.reduced });
    k.crowd([v(0, 0, 60), v(0, 0, -60)], 20, { seed: 78, speed: 0.4, spread: 1.6, animate: !ctx.reduced });
    k.censusWall({ x: -8.66, y: 3.2, z: 0, rotY: PI / 2, cols: 30, rows: 3, tile: 0.55, gap: 0.05, start: ctx.wallStart(1400, 90), pieces: ctx.all, backing: dark });
    k.box(0.3, 5, 18, -8.9, 3, 0, dark);
    k.sign('FESTA  ·  SAN GENNARO  ·  MULBERRY STREET', 10, 0.8, 0, 9.2, 78, '#c62828', '#f4f0e8', 90, PI, { border: true });
    k.box(11, 1.0, 0.3, 0, 9.2, 78.2, dark);
    const FSG = 'https://en.wikipedia.org/wiki/Feast_of_San_Gennaro', MUL = 'https://en.wikipedia.org/wiki/Mulberry_Street_(Manhattan)';
    k.egg(v(0, 8.4, 77.6), { id: 'sangennaro-1926', title: 'One day became eleven', year: '1926', text: 'Immigrants from Naples first held the feast on Mulberry Street in 1926. It began as a one day religious observance and grew into an eleven day festival.', clue: 'Read the big FESTA sign at the north end.', source: { name: 'Feast of San Gennaro, Wikipedia', url: FSG } }, { r: 1.8 });
    k.egg(v(0, 3, 70), { id: 'sangennaro-ribbons', title: 'Money on the ribbons', text: 'Donations are pinned to the ribbon streamers that hang from the statue, and the money went to poorer residents of the neighbourhood. The Grand Procession starts at 2 p.m. on the last Saturday, after a Mass at the Church of the Most Precious Blood.', clue: 'Wait under the first arch for the saint to be carried past.', source: { name: 'Feast of San Gennaro, Wikipedia', url: FSG } }, { r: 1.8 });
    k.egg(v(-6.2, 1.6, 42), { id: 'sangennaro-vesuvius', title: 'The blood and the volcano', year: '1631', text: 'Saint Januarius\'s feast day is September 19, the date of his martyrdom in 305. His blood is said to liquefy three times a year, one of them on December 16, for the day he is believed to have helped end the eruption of Vesuvius in 1631.', clue: 'Find the cannoli stand on the west curb.', source: { name: 'Feast of San Gennaro, Wikipedia', url: FSG } }, { r: 1.0 });
    k.egg(v(-8.4, 3, 30), { id: 'sangennaro-bend', title: 'Slaughter-house Street', year: '1755', text: 'Mulberry Street is on maps from at least 1755 and is named for the mulberry trees that once lined Mulberry Bend. During the Revolution it was often called Slaughter-house Street, after a slaughterhouse that was cleared away in the summer of 1784.', clue: 'Look at the tenement fronts on the west side.', source: { name: 'Mulberry Street (Manhattan), Wikipedia', url: MUL } }, { r: 1.6 });
    k.egg(v(0, 7.2, -79), { id: 'sangennaro-church', title: 'A church of their own', text: 'The Church of the Most Precious Blood, at 113 Baxter Street, was built by Italians who were not allowed to worship in the main churches of the area. The procession sets out from its Mass.', clue: 'Look up at the brick wall at the south end of the feast.', source: { name: 'Mulberry Street (Manhattan), Wikipedia', url: MUL } }, { r: 1.0 });
    k.egg(v(8.4, 3, -36), { id: 'sangennaro-bank', title: 'Bankers of Mulberry Street', year: '1896', text: 'The Italian American Museum is at 155 Mulberry Street, in the building of the old immigrant bank Banca Stabile. In 1896 the New York Times reported that there were more bankers among the Italians than among any other foreigners in the city except the Germans.', clue: 'Look at the tenements on the east side, south of the stands.', source: { name: 'Mulberry Street (Manhattan), Wikipedia', url: MUL } }, { r: 1.6 });
    // the works: hung from the arches on both sides, on the stand backs, on the tenement stoops
    const mounts: Mount[] = [];
    for (let i = 0; i < 12; i++) { const z = 66 - i * 12; const s = i % 2 ? 1 : -1; k.box(0.12, 2.2, 3.0, s * 7.9, 5.6, z, dark); mounts.push({ position: v(s * 7.8, 5.6, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 3, z), width: 2.6, height: 1.8, style: 'none', wash: false }); k.beam(v(s * 7.9, 6.8, z), v(s * 8.5, 7.6, z), 0.02, steel, 3); }
    for (let i = 0; i < 7; i++) { const s = i % 2 ? 1 : -1; const z = 60 - i * 18; const x = s * 8.66; mounts.push({ position: v(x, 2.0, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * 4, 2, z), width: 2.4, height: 1.6, style: 'black', wash: false }); }
    for (let i = 0; i < 3; i++) { const x = -5 + i * 5; mounts.push({ position: v(x, 3.4, -79.66), rotation: 0, target: v(x, 3, -70), width: 4.2, height: 2.5, style: 'black', wash: true }); }
    k.box(18, 8, 0.6, 0, 4, -80, k.pbr('sgEnd', X.brick(0x6a4436, 195), 0.28)); k.block(-9, 9, -80.6, -79.4);
    return { mounts, spawn: v(1.5, 3, 72), look: v(0, 5, -20), eye: 3, bounds: [-8.4, 8.4, -79, 78], style: 'black' };
  },
};

/* ---------------- 70 THE CHELSEA HOTEL ---------------- */
export const chelseahotel: RoomDef = {
  id: 'chelseahotel',
  name: 'The lobby of the hotel',
  area: 'THE CHELSEA HOTEL',
  mood: 'Room rate paid in paintings',
  color: '#b8483a',
  description: 'Twenty third Street under the iron balconies, the lobby hung floor to ceiling with the art residents left instead of rent, the stair climbing up through the building, the works in every frame.',
  signatures: 'The red brick front with white stone bands and flowered iron balconies on floors two to eight, eleven storeys high, the neon vertical sign, the lobby with its fireplace and salon hang, the famous open stair with iron balusters climbing through the building, the corridors of numbered doors.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad0, horizon: 0xe8e6e0, ground: 0x5a5a55, fog: 0.0022, sun: { az: 3.7, el: 0.7, color: 0xfff4e6, size: 12 }, env: 0.85 });
    k.hemi(0xfff0dc, 0x3a3020, 0.6);
    k.sun(0xfff0d8, 1.6, 30, 60, 40, true, 70);
    const brick = k.pbr('chlBrick', X.brick(0x8a3a2e, 196), 0.28),
      iron = k.flat(0x1a1c20, 0.7, 0.45),
      cream = k.pbr('chlPlaster', X.plaster(0xe0d4c0, 91), 0.3),
      wood = k.pbr('chlWood', X.planks(0x4a2e1c, 5, 197), 1.2, { roughness: 0.5 }),
      floorT = k.pbr('chlFloor', X.terrazzo(0xb8a890, 92), 0.4, { roughness: 0.4 }),
      marble = k.pbr('chlMarble', X.marble(0xd8cfb8, 0x8a7a5a, 14), 0.4),
      neon = k.glow(0xff3a3a),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      glass = k.glass(0xffe0b0, 0.3, 0.1);
    // 23rd Street and the twelve storey front with its balconies
    street(k, { w: 24, len: 140, z: 30, x: 0 });
    blockFront(k, { x: -50, z0: 90, count: 10, face: 1, seed: 198, h: [14, 26] });
    const FZ = 8, W = 40, H = 46;
    k.box(W, H, 40, 0, H / 2, FZ - 20, brick);
    /* eleven storeys on the front; the flowered iron balconies run on floors two to eight only; white stone bands */
    for (let f = 1; f < 11; f++) { const y = 2 + f * 3.8; k.box(W, 0.3, 0.2, 0, y - 0.2, FZ + 0.1, cream); for (let i = 0; i < 7; i++) { const x = -16 + i * 5.3; if (f <= 7) { k.box(3.2, 0.12, 1.2, x, y, FZ + 0.6, iron); for (let b = -1.4; b <= 1.4; b += 0.28) k.box(0.03, 0.9, 0.03, x + b, y + 0.5, FZ + 1.15, iron); k.box(3.2, 0.04, 0.04, x, y + 0.95, FZ + 1.15, iron); } k.box(2.0, 2.6, 0.1, x, y + 1.5, FZ + 0.06, glass); k.box(2.4, 2.9, 0.16, x, y + 1.5, FZ + 0.02, cream); } }
    const brassP = k.pbr('chlBrass', X.gilt(0xc9a55a), 2, { metalness: 0.85, roughness: 0.35 });
    for (const sx of [-1, 1]) for (let r = 0; r < 3; r++) k.box(0.7, 0.45, 0.04, sx * 2.9, 1.3 + r * 0.6, FZ + 0.04, brassP);
    k.moulding([[0, 0], [0.9, 0], [1.0, 0.3], [0.6, 0.5], [0.8, 0.8], [0, 1.0]], W + 0.4, 0, H - 0.5, FZ + 0.05, cream, 0);
    for (let i = 0; i < 12; i++) { const ch = 'HOTEL CHELSEA'[i]; const y = 40 - i * 2.4; k.box(2.2, 2.4, 1.0, -W / 2 - 1.2, y, FZ + 1.2, dark); if (ch !== ' ') { k.sign(ch, 1.8, 2.0, -W / 2 - 1.2, y, FZ + 1.72, '#14090a', '#ff4a4a', 140, 0, { border: false }); } }
    k.mesh(new T.BoxGeometry(0.08, 30, 0.08), neon, -W / 2 - 2.3, 26, FZ + 1.2); k.mesh(new T.BoxGeometry(0.08, 30, 0.08), neon, -W / 2 - 0.1, 26, FZ + 1.2);
    k.arch(3.6, 5.2, 4, 0, 0, FZ - 1.6, marble, false, 0.85);
    k.box(6, 1.2, 4, 0, 5.4, FZ + 1.2, dark);
    k.sign('CHELSEA', 5, 0.9, 0, 5.4, FZ + 3.22, '#14090a', '#f4e4b0', 100, 0, { border: true });
    k.block(-W / 2, -1.8, FZ - 0.5, FZ + 0.5); k.block(1.8, W / 2, FZ - 0.5, FZ + 0.5);
    // the lobby: a tall salon with the fireplace, the desk, the stair rising in the well behind
    const LW = 22, LD = 24, LZ = FZ, LH = 8;
    k.box(LW, 0.3, LD, 0, 0.15, LZ - LD / 2, floorT);
    for (const s of [-1, 1]) { k.box(0.6, LH, LD, s * LW / 2, LH / 2, LZ - LD / 2, cream); k.block(s * LW / 2 - 0.5, s * LW / 2 + 0.5, LZ - LD, LZ); }
    k.box(LW, LH, 0.6, 0, LH / 2, LZ - LD, cream);
    k.block(-LW / 2, -2.4, LZ - LD - 0.5, LZ - LD + 0.5); k.block(2.4, LW / 2, LZ - LD - 0.5, LZ - LD + 0.5);
    k.box(LW, 0.4, LD, 0, LH, LZ - LD / 2, k.pbr('chlCeiling', X.plaster(0xd8d0c0, 93), 0.4));
    k.box(4.6, 4, 0.8, -LW / 2 + 0.7, 2, LZ - 12, marble).rotation.y = 0;
    k.box(2.2, 2.0, 0.3, -LW / 2 + 0.9, 1.0, LZ - 12, dark); k.point(-LW / 2 + 1.4, 1.2, LZ - 12, 0xff9a40, 14, 6);
    k.box(6, 1.1, 1.2, 4, 0.55, LZ - 4, wood); k.box(6.2, 0.1, 1.4, 4, 1.12, LZ - 4, marble); k.block(1, 7, LZ - 4.8, LZ - 3.2);
    for (const [x, z] of [[-4, LZ - 6], [4, LZ - 14], [-3, LZ - 18]]) { k.box(2.4, 0.5, 1.0, x, 0.55, z, k.pbr('chlVelvet', X.velvet(0x6a2a3a), 0.4)); k.box(2.4, 0.6, 0.3, x, 1.0, z - 0.4, k.pbr('chlVelvet', X.velvet(0x6a2a3a), 0.4)); k.keepOut.push({ x, z, r: 1.6 }); }
    for (let i = 0; i < 3; i++) k.point(-6 + i * 6, LH - 1.5, LZ - 8 - (i % 2) * 8, 0xffe6c0, 24, 14);
    // the stair well: a square well with the open stair climbing ten flights, the iron balusters, landings you can reach
    const SX = 0, SZ = LZ - LD - 6, SW = 8;
    k.box(SW + 2, 60, SW + 2, SX, 30, SZ, brick);
    const well = k.mesh(new T.BoxGeometry(SW, 60, SW), k.pbr('chlWell', X.plaster(0xe0d4c0, 91), 0.3, { side: T.BackSide }), SX, 30, SZ); void well;
    k.block(SX - SW / 2 - 1, SX + SW / 2 + 1, SZ - SW / 2 - 1, SZ - SW / 2 + 0.2);
    k.block(SX - SW / 2 - 1, SX - SW / 2 + 0.2, SZ - SW / 2, SZ + SW / 2); k.block(SX + SW / 2 - 0.2, SX + SW / 2 + 1, SZ - SW / 2, SZ + SW / 2);
    const flights: [number, number, number, number][] = [];
    for (let f = 0; f < 4; f++) {
      const y0 = f * 3.8; const side = f % 4;
      for (let i = 0; i < 12; i++) { const t = i / 12; const y = y0 + i * (3.8 / 12); let x = 0, z = 0; if (side === 0) { x = SX + SW / 2 - 0.9; z = SZ + SW / 2 - 0.6 - t * (SW - 1.2); } else if (side === 1) { x = SX + SW / 2 - 0.6 - t * (SW - 1.2); z = SZ - SW / 2 + 0.9; } else if (side === 2) { x = SX - SW / 2 + 0.9; z = SZ - SW / 2 + 0.6 + t * (SW - 1.2); } else { x = SX - SW / 2 + 0.6 + t * (SW - 1.2); z = SZ + SW / 2 - 0.9; } k.box(side % 2 ? 0.6 : 1.6, 0.16, side % 2 ? 1.6 : 0.6, x, y + 0.08, z, wood); if (i % 2 === 0) k.box(0.03, 0.95, 0.03, x + (side === 0 ? -0.7 : side === 2 ? 0.7 : 0), y + 0.55, z + (side === 1 ? 0.7 : side === 3 ? -0.7 : 0), iron); }
      flights.push([side, y0, 0, 0]);
    }
    for (let f = 1; f <= 4; f++) { const y = f * 3.8; k.box(SW, 0.2, 1.6, SX, y, SZ + SW / 2 - 0.8, wood); k.box(1.6, 0.2, SW, SX + SW / 2 - 0.8, y, SZ, wood); k.box(SW, 0.2, 1.6, SX, y, SZ - SW / 2 + 0.8, wood); k.box(1.6, 0.2, SW, SX - SW / 2 + 0.8, y, SZ, wood); k.point(SX, y + 2.2, SZ, 0xffe6c0, 12, 8); }
    for (let y = 0; y < 60; y += 6) k.point(SX, y + 3, SZ, 0xffe6c0, 8, 8);
    k.censusWall({ x: 0, y: 4.4, z: LZ - LD + 0.34, rotY: 0, cols: 18, rows: 6, tile: 0.5, gap: 0.05, start: ctx.wallStart(6700, 108), pieces: ctx.all, backing: dark });
    k.crowd([v(-6, 0, LZ - 3), v(6, 0, LZ - 20)], 6, { seed: 79, speed: 0.3, spread: 1.6, animate: !ctx.reduced });
    const HC = 'https://en.wikipedia.org/wiki/Hotel_Chelsea';
    k.egg(v(2.9, 1.9, FZ + 0.3), { id: 'chelsea-plaques', title: 'The brass plaques', text: 'Brass plaques beside the main entrance remember the people who lived here. The roll of residents runs from Mark Twain and Dylan Thomas to Arthur Miller, Leonard Cohen, Patti Smith and Arthur C. Clarke.', clue: 'Read the brass plaques beside the front door.', source: { name: 'Hotel Chelsea, Wikipedia', url: HC } }, { r: 1.2 });
    k.egg(v(-16, 2 + 3.8 * 2 + 0.6, FZ + 1.3), { id: 'chelsea-balconies', title: 'Flowers in iron', year: '1986', text: 'The flower ornamented iron balconies on floors two to eight were made by J.B. and J.M. Cornell. In 1986 one of them fell from the facade and injured two people walking below.', clue: 'Look up at the balconies from the sidewalk.', source: { name: 'Hotel Chelsea, Wikipedia', url: HC } }, { r: 1.6 });
    k.egg(v(14, 12, FZ + 0.6), { id: 'chelsea-tallest', title: 'Three feet of wall', year: '1884', text: 'Philip Hubert\'s building opened in 1884 as one of the first Victorian Gothic buildings in the city and its tallest apartment building, about 180 feet. Its masonry walls are about three feet thick at the base, and it was among the first in the city with duplex and penthouse apartments.', clue: 'Stand back on 23rd Street and take in the whole front.', source: { name: 'Hotel Chelsea, Wikipedia', url: HC } }, { r: 2.0 });
    k.egg(v(-LW / 2 + 1.3, 2.6, LZ - 11.8), { id: 'chelsea-rent', title: 'Paid in paintings', text: 'The manager Stanley Bard sometimes took a resident\'s paintings in place of unpaid rent and hung them in the lobby, which is how the lobby filled with art.', clue: 'Look at the salon hang on the lobby wall by the fireplace.', source: { name: 'Hotel Chelsea, Wikipedia', url: HC } }, { r: 0.8 });
    k.egg(v(4, 1.6, LZ - 4), { id: 'chelsea-titanic', title: 'Guests off the Titanic', year: '1912', text: 'After the Titanic sank in 1912, several of the people who survived it were given rooms at the hotel.', clue: 'Ask at the front desk.', source: { name: 'Hotel Chelsea, Wikipedia', url: HC } }, { r: 1.2 });
    k.egg(v(SX, 2 * 3.8 + 2.6, SZ), { id: 'chelsea-skylight', title: 'The skylight', text: 'The central stair was lit from a skylight on the roof and was meant for guests. Its walls were once lined with photographs of the residents. The skylight was sealed in the early 1950s.', clue: 'Climb the stair and look up the middle of the well.', source: { name: 'Hotel Chelsea, Wikipedia', url: HC } }, { r: 1.6 });
    // the works: a salon hang, floor to ceiling on both lobby walls, the stair well walls at every landing, the street front
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) for (let row = 0; row < 2; row++) { const z = LZ - 4 - i * 5.2; if (s < 0 && i === 1 && row === 0) continue; mounts.push({ position: v(s * (LW / 2 - 0.34), 2.4 + row * 2.9, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 2.5, z), width: 3.6, height: row ? 1.9 : 2.2, style: row ? 'oak' : 'gilt', wash: row === 0 }); }
    for (let f = 1; f <= 3; f++) { const y = f * 3.8 + 1.8; mounts.push({ position: v(SX, y, SZ - SW / 2 + 0.22), rotation: 0, target: v(SX, y, SZ), width: 3.0, height: 1.7, style: 'gilt', wash: false }); mounts.push({ position: v(SX - SW / 2 + 0.22, y, SZ), rotation: PI / 2, target: v(SX, y, SZ), width: 3.0, height: 1.7, style: 'gilt', wash: false }); }
    for (let i = 0; i < 2; i++) { const x = -10 + i * 20; mounts.push({ position: v(x, 3.4, FZ + 0.34), rotation: 0, target: v(x, 3, FZ + 10), width: 4.2, height: 2.5, style: 'black', wash: false }); }
    const stairY = (x: number, z: number) => { const dx = x - SX, dz = z - SZ; const inWell = Math.abs(dx) < SW / 2 && Math.abs(dz) < SW / 2; if (!inWell) return -1; const onE = dx > SW / 2 - 1.7, onW = dx < -SW / 2 + 1.7, onN = dz < -SW / 2 + 1.7, onS = dz > SW / 2 - 1.7; const per = 3.8; if (onE && !onN) return Math.min(per, ((SZ + SW / 2 - 0.6 - z) / (SW - 1.2)) * per); if (onN) return per + Math.min(per, ((SX + SW / 2 - 0.6 - x) / (SW - 1.2)) * per); if (onW) return 2 * per + Math.min(per, ((z - (SZ - SW / 2 + 0.6)) / (SW - 1.2)) * per); if (onS) return 3 * per + Math.min(per, ((x - (SX - SW / 2 + 0.6)) / (SW - 1.2)) * per); return -2; };
    k.block(SX - SW / 2 + 1.7, SX + SW / 2 - 1.7, SZ - SW / 2 + 1.7, SZ + SW / 2 - 1.7);
    return { mounts, spawn: v(-16, 3, FZ + 30), look: v(-8, 18, FZ), eye: 3, bounds: [-LW / 2 + 0.6, LW / 2 - 0.6, SZ - SW / 2 + 0.4, FZ + 36], style: 'gilt', floorY: (x, z) => { const y = stairY(x, z); return y >= 0 ? y : 0; } };
  },
};

/* ---------------- 71 THE STRAND ---------------- */
export const strand: RoomDef = {
  id: 'strand',
  name: 'Eighteen miles of books',
  area: 'THE STRAND',
  mood: 'Rainy Tuesday',
  color: '#c83a3a',
  description: 'Broadway and Twelfth in the rain, the dollar carts under the awning, then the aisles: tables of new arrivals, the tall stacks, the rare book room upstairs, the works on the end caps.',
  signatures: 'The red awning and the sidewalk carts of one dollar books, the ground floor of long tables and tall wooden stacks under fluorescent light, the tote bags, the staff picks wall, the rolling ladders, the rare book room with its leather and glass.',
  build(k, ctx) {
    k.sky({ top: 0x7a8494, horizon: 0xb8bcc0, ground: 0x4a4a48, fog: 0.004, sun: { az: 3.2, el: 0.6, color: 0xe8e8e8, size: 10 }, haze: 0.7, env: 0.6 });
    k.hemi(0xd8dce0, 0x3a3a38, 0.8);
    k.sun(0xe8e8e8, 0.8, 20, 60, 30, false, 60);
    const brick = k.pbr('stBrick', X.brick(0x6a4a3a, 199), 0.28),
      redA = k.flat(0xc62828, 0.1, 0.7),
      wood = k.pbr('stShelf', X.planks(0x5a3a26, 4, 200), 1.2, { roughness: 0.5 }),
      books = k.pbr('stBooks', X.planks(0x7a4a3a, 16, 201, 0.5), 0.3, { roughness: 0.8, stretch: 0.3 }),
      booksB = k.pbr('stBooksB', X.planks(0x3a4a6a, 16, 202, 0.5), 0.3, { roughness: 0.8, stretch: 0.3 }),
      floorW = k.pbr('stFloor', X.planks(0x8a7a5a, 6, 203, 0.3), 0.9),
      wet = k.pbr('stWet', X.asphalt(0x1e2226), 0.11, { roughness: 0.15, metalness: 0.3 }),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      white = k.flat(0xf4f0e8, 0, 0.6),
      glass = k.glass(0xdcecf6, 0.14, 0.04),
      tube = k.glow(0xf0f4ff),
      leather = k.pbr('stLeather', X.velvet(0x4a2a1a), 0.4, { roughness: 0.7 });
    // Broadway in the rain: wet asphalt, the corner building, the awning and the carts
    k.box(24, 0.3, 140, 0, -0.15, 30, wet);
    for (const s of [-1, 1]) k.box(5, 0.28, 140, s * 14.5, 0, 30, k.pbr('stWalk', X.pavers(0x6a6a66, 94), 0.42, { roughness: 0.3 }));
    blockFront(k, { x: 17, z0: 100, count: 10, face: -1, seed: 204, h: [14, 30] });
    const FX = -12, FZ = 8, BW = 34, BD = 40;
    /* 826 Broadway is an eleven storey steel framed store and loft building (Birkmire, 1902), not six */
    k.box(BW, 44, BD, FX - BW / 2 + 0.3, 22, FZ - BD / 2, brick);
    for (let t = 0; t < 9; t++) for (let i = 0; i < 6; i++) { const y = 6 + t * 4.4; k.box(2.4, 3.0, 0.1, FX + 0.06 - 1 + 0, y, FZ - 4 - i * 6, glass).rotation.y = PI / 2; k.box(2.8, 3.4, 0.16, FX - 0.02, y, FZ - 4 - i * 6, k.pbr('stLime', X.ashlar(0xb8ad97, 205, 3), 0.22)).rotation.y = PI / 2; }
    const aw = k.box(3.4, 0.12, 30, FX + 1.7, 3.8, FZ - 16, redA); aw.rotation.z = 0.14;
    for (let dz = -14; dz <= 14; dz += 2) k.box(0.05, 0.5, 0.06, FX + 3.4, 3.3, FZ - 16 + dz, redA);
    k.sign('STRAND  ·  18 MILES OF BOOKS', 8, 0.7, FX + 3.42, 3.3, FZ - 16, '#c62828', '#f4f0e8', 70, PI / 2, { border: false });
    for (let i = 0; i < 6; i++) { const z = FZ - 2 - i * 4.4; k.box(1.2, 0.9, 3.2, FX + 4.6, 0.65, z, wood); for (let j = 0; j < 20; j++) k.box(0.9, 0.24, 0.12, FX + 4.6, 1.22, z - 1.5 + j * 0.16, [books, booksB][j % 2]); for (const dz of [-1.4, 1.4]) k.cyl(0.14, 0.05, FX + 4.6, 0.15, z + dz, dark, 0.14, 10).rotation.z = PI / 2; k.keepOut.push({ x: FX + 4.6, z, r: 1.8 }); k.sign('$1', 0.8, 0.5, FX + 5.22, 0.9, z, '#f4f0e8', '#c62828', 60, PI / 2); }
    k.arch(3.2, 4, 1.4, FX, 0, FZ - 30, brick, false, 0.85).rotation.y = PI / 2;
    k.block(FX - 0.6, FX + 0.6, FZ - BD, FZ - 32); k.block(FX - 0.6, FX + 0.6, FZ - 28, FZ);
    // inside: the long floor, tables of new arrivals, the stacks, fluorescent tubes, the mezzanine rare book room
    const IX = FX - BW / 2 + 0.3, IZ = FZ - BD / 2, IW = BW - 1.2, ID = BD - 1.2;
    k.box(IW, 0.3, ID, IX, 0.15, IZ, floorW);
    k.box(IW, 0.4, ID, IX, 6.2, IZ, white);
    for (let x = IX - IW / 2 + 3; x < IX + IW / 2; x += 6) for (let z = IZ - ID / 2 + 4; z < IZ + ID / 2; z += 8) { k.box(1.4, 0.08, 0.12, x, 6.0, z, tube); k.point(x, 5.6, z, 0xf0f4ff, 14, 10); }
    const stacks = (x: number, z: number, len: number, rot: number) => { const s = k.box(0.6, 3.2, len, x, 1.6, z, wood); s.rotation.y = rot; for (const sgn of [-1, 1]) for (let sh = 0; sh < 5; sh++) { const b = k.box(0.28, 0.5, len - 0.2, x + (rot ? 0 : sgn * 0.42), 0.5 + sh * 0.62, z + (rot ? sgn * 0.42 : 0), sh % 2 ? books : booksB); b.rotation.y = rot; } for (let t = -len / 2; t <= len / 2; t += 1) k.keepOut.push({ x: x + (rot ? t : 0), z: z + (rot ? 0 : t), r: 0.8 }); };
    for (let i = 0; i < 5; i++) stacks(IX - IW / 2 + 4 + i * 5.2, IZ - 4, 14, 0);
    for (let i = 0; i < 4; i++) stacks(IX - IW / 2 + 6 + i * 6.5, IZ + 12, 6, PI / 2);
    for (let i = 0; i < 4; i++) { const x = IX - IW / 2 + 5 + i * 6.5, z = IZ + 6; k.box(3.2, 0.9, 1.4, x, 0.45, z, wood); for (let j = 0; j < 24; j++) k.box(0.4, 0.06 + (j % 3) * 0.02, 0.3, x - 1.3 + (j % 8) * 0.37, 0.95 + Math.floor(j / 8) * 0.05, z - 0.45 + Math.floor(j / 8) * 0.45, [books, booksB, k.flat(0xf1c531, 0, 0.7)][j % 3]); k.keepOut.push({ x, z, r: 2 }); }
    k.box(1.2, 4, 0.12, IX + IW / 2 - 0.7, 2.0, IZ - 10, wood); k.box(0.06, 4, 0.06, IX + IW / 2 - 0.4, 2.0, IZ - 10.5, dark); k.box(0.06, 4, 0.06, IX + IW / 2 - 0.4, 2.0, IZ - 9.5, dark); for (let r = 0; r < 8; r++) k.box(0.5, 0.04, 0.04, IX + IW / 2 - 0.4, 0.4 + r * 0.5, IZ - 10, dark);
    k.box(6, 1.0, 0.8, IX, 0.5, IZ - ID / 2 + 3, wood); k.block(IX - 3.2, IX + 3.2, IZ - ID / 2 + 2.4, IZ - ID / 2 + 3.6);
    for (let i = 0; i < 5; i++) k.box(0.3, 0.4, 0.05, IX - 2 + i * 1, 1.2, IZ - ID / 2 + 3, redA);
    const MY = 6.6, MX = IX - IW / 2 + 6, MZ = IZ - ID / 2 + 7;
    k.box(12, 0.3, 12, MX, MY, MZ, floorW);
    for (let i = 0; i < 20; i++) k.box(2.4, 0.33, 1.0, IX - IW / 2 + 1.6, 0.16 + i * 0.33, MZ + 8 + i * -0.4 + 8, wood);
    k.box(0.4, 3.6, 12, MX - 5.8, MY + 1.8, MZ, wood); k.box(12, 3.6, 0.4, MX, MY + 1.8, MZ - 5.8, wood);
    for (let sh = 0; sh < 5; sh++) { k.box(0.3, 0.5, 11, MX - 5.4, MY + 0.6 + sh * 0.6, MZ, leather); k.box(11, 0.5, 0.3, MX, MY + 0.6 + sh * 0.6, MZ - 5.4, leather); }
    k.box(4, 0.1, 1.6, MX + 1, MY + 0.9, MZ + 1, wood); k.box(4.2, 0.4, 1.8, MX + 1, MY + 1.1, MZ + 1, glass);
    k.rail(MX + 5.8, MZ, 12, dark, 1.0, 'z', 1.5); k.rail(MX, MZ + 5.8, 12, dark, 1.0, 'x', 1.5);
    k.point(MX, MY + 3, MZ, 0xffe6c0, 16, 10);
    k.box(12, 0.4, 12, MX, MY + 3.8, MZ, white);
    k.crowd([v(IX - 12, 0, IZ + 16), v(IX - 12, 0, IZ - 14), v(IX + 8, 0, IZ - 14), v(IX + 8, 0, IZ + 16)], 18, { seed: 80, speed: 0.4, spread: 1.6, animate: !ctx.reduced, closed: true });
    k.crowd([v(FX + 3, 0, FZ - 2), v(FX + 3, 0, FZ - 26)], 8, { seed: 81, speed: 0.5, spread: 1, animate: !ctx.reduced });
    k.censusWall({ x: IX - IW / 2 + 0.34, y: 3.4, z: IZ - 2, rotY: PI / 2, cols: 30, rows: 5, tile: 0.5, gap: 0.05, start: ctx.wallStart(200, 150), pieces: ctx.all, backing: dark });
    k.sign('STAFF PICKS  ·  THE NEW YORKERS', 8, 0.6, IX - IW / 2 + 0.34, 5.6, IZ - 2, 'transparent', '#f4f0e8', 70, PI / 2);
    const SB = 'https://en.wikipedia.org/wiki/Strand_Bookstore', LPC = 'https://home4.nyc.gov/site/lpc/about/pr2019/lpc-designates-7-broadway-buildings-south-ofunion-square-as-individual-landmarks.page';
    k.egg(v(FX + 1.0, 3, FZ - 30), { id: 'strand-bookrow', title: 'Six hundred dollars and a cot', year: '1927', text: 'Benjamin Bass opened the Strand in 1927 with $300 of his own and $300 borrowed, and slept on a cot in the shop. It stood on Fourth Avenue\'s Book Row, which then had 48 bookstores.', clue: 'Stop at the arched door on Broadway.', source: { name: 'Strand Bookstore, Wikipedia', url: SB } }, { r: 1.2 });
    k.egg(v(FX + 3.0, 3.9, FZ - 1.5), { id: 'strand-miles', title: 'More than eighteen miles', text: 'The slogan on the awning says eighteen miles of books, but the store now holds more than 23 miles. In the 1990s it held 2.5 million books, with the overflow in a warehouse in Sunset Park, Brooklyn.', clue: 'Look at the north end of the red awning.', source: { name: 'Strand Bookstore, Wikipedia', url: SB } }, { r: 0.9 });
    k.egg(v(MX + 1, MY + 1.4, MZ + 1), { id: 'strand-ulysses', title: 'The most expensive book in the house', text: 'In the 1990s the oldest book for sale was an edition of Magna Moralia at $4,500, and the most expensive was a copy of James Joyce\'s Ulysses at $38,000.', clue: 'Look in the glass case in the rare book room upstairs.', source: { name: 'Strand Bookstore, Wikipedia', url: SB } }, { r: 1.0 });
    k.egg(v(FX + 0.8, 16, FZ - 16), { id: 'strand-landmark', title: 'Steel behind the brick', year: '1902', text: 'The building is an eleven storey store and loft building designed by William H. Birkmire and finished in 1902, its steel frame an example of the new skyscraper engineering of its day. The Strand moved in from Book Row in 1956, and the city landmarked the building in 2019 over the owner\'s objection.', clue: 'Stand on Broadway and look up the front.', source: { name: 'LPC designates seven Broadway buildings, NYC Landmarks Preservation Commission', url: LPC } }, { r: 2.0 });
    k.egg(v(IX, 1.6, IZ - ID / 2 + 3), { id: 'strand-1996', title: 'Buying the building', year: '1996', text: 'Fred Bass took over in 1956, and in 1996 he bought the building for $8.2 million, when the Strand was the largest used bookstore in the world. His daughter Nancy Bass Wyden became sole owner after he died in 2018.', clue: 'Go to the counter at the back of the floor.', source: { name: 'Strand Bookstore, Wikipedia', url: SB } }, { r: 1.2 });
    k.egg(v(IX - IW / 2 + 5 + 2 * 6.5, 1.3, IZ + 6), { id: 'strand-mcfall', title: 'Forty three years on the floor', year: '2021', text: 'Ben McFall started at the Strand in 1978 and worked there until his death in December 2021, the longest serving bookseller in the store\'s history. The staff have been unionized for more than 35 years.', clue: 'Browse the new arrivals tables in the middle of the floor.', source: { name: 'Strand Bookstore, Wikipedia', url: SB } }, { r: 0.8 });
    // the works: the stack end caps facing the aisles, the back wall, the rare book room, the street front between the windows
    const mounts: Mount[] = [];
    for (let i = 0; i < 5; i++) { const x = IX - IW / 2 + 4 + i * 5.2; mounts.push({ position: v(x, 1.9, IZ - 4 + 7.22), rotation: 0, target: v(x, 2, IZ + 6), width: 1.6, height: 2.2, style: 'oak', wash: false }); mounts.push({ position: v(x, 1.9, IZ - 4 - 7.22), rotation: PI, target: v(x, 2, IZ - 16), width: 1.6, height: 2.2, style: 'oak', wash: false }); }
    for (let i = 0; i < 4; i++) { const x = IX - 10 + i * 7; mounts.push({ position: v(x, 3.6, IZ + ID / 2 - 0.34), rotation: PI, target: v(x, 2.5, IZ + 6), width: 3.6, height: 2.1, style: 'black', wash: true }); }
    for (let i = 0; i < 3; i++) { const z = MZ - 3.5 + i * 3.5; mounts.push({ position: v(MX - 5.58, MY + 2.2, z), rotation: PI / 2, target: v(MX, MY + 1.6, z), width: 2.4, height: 1.4, style: 'gilt', wash: false }); }
    for (let i = 0; i < 3; i++) { const z = FZ - 7 - i * 6; mounts.push({ position: v(FX + 0.42, 2.0, z - 3), rotation: PI / 2, target: v(FX + 6, 2, z - 3), width: 2.2, height: 1.4, style: 'black', wash: false }); }
    const mezz = (x: number, z: number) => Math.abs(x - MX) < 6 && Math.abs(z - MZ) < 6;
    return { mounts, spawn: v(-4, 3, FZ + 6), look: v(FX, 4, FZ - 20), eye: 3, bounds: [IX - IW / 2 + 0.6, 12, IZ - ID / 2 + 0.6, FZ + 30], style: 'oak', floorY: (x, z) => { if (mezz(x, z)) return MY + 0.15; if (x < IX - IW / 2 + 3.2 && x > IX - IW / 2 + 0.4 && z > MZ + 6 && z < MZ + 16.4) return Math.min(MY, ((MZ + 16.4 - z) / 10) * MY); return 0; } };
  },
};
