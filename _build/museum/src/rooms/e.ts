/* Rooms 17 to 21: Unisphere, Roosevelt Island Tram, the Cloisters, Navy Yard dry dock, Governors Island hills. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Kit, Mount } from '../kit';
import type { RoomDef } from './types';
import { liberty } from './b';

const PI = Math.PI;

/* ---------------- 17 UNISPHERE ---------------- */
export const unisphere: RoomDef = {
  id: 'unisphere',
  name: 'The boroughs in orbit',
  area: 'FLUSHING MEADOWS',
  mood: 'Worlds within worlds',
  color: '#a5cfdf',
  description: 'The steel globe over its fountain basin, orbit rings, radial panels of New Yorkers around the promenade.',
  signatures: 'The open steel lattice globe with continents in relief, three orbit rings, the circular fountain basin, the pavilion towers beyond.',
  build(k, ctx) {
    k.sky({ top: 0x5f9ad8, horizon: 0xdbe9f0, ground: 0x55704a, fog: 0.002, sun: { az: 2.6, el: 0.75, color: 0xfff6e2, size: 14 }, env: 1.0 });
    k.hemi(0xeaf4ff, 0x3c5a34, 0.9);
    k.sun(0xfff4dc, 2.5, 30, 60, 30, true, 70);
    const steel = k.pbr('sphereSteel', X.steel(0xb8bec4, false, 11), 0.6, { metalness: 0.9, roughness: 0.3 }),
      lawn = k.pbr('lawnU', X.grass(0x4f7a3e, 4), 0.15),
      pav = k.pbr('pavU', X.pavers(0xa9a79c, 9), 0.3),
      granite = k.pbr('basin', X.ashlar(0x8c8c88, 8, 3), 0.3),
      water = k.flat(0x2f6a7c, 0.6, 0.15, { transparent: true, opacity: 0.9 }),
      dark = k.flat(0x2b2f33, 0.6, 0.5),
      glow = k.glow(0xe4f6ff);
    const C = v(0, 0, -30), R = 22;
    k.box(400, 0.4, 400, 0, -0.3, -40, lawn);
    k.mesh(new T.RingGeometry(17.5, 27, 96), pav, C.x, 0.02, C.z).rotation.x = -PI / 2;
    k.mesh(new T.CylinderGeometry(17.5, 17.5, 1.0, 96), granite, C.x, 0.5, C.z);
    k.mesh(new T.CylinderGeometry(16.6, 16.6, 1.0, 96), water, C.x, 0.55, C.z);
    k.keepOut.push({ x: C.x, z: C.z, r: 18.2 });
    // the globe: meridians, parallels, continents, orbits
    const G = 11, GY = 15;
    /* the globe leans 23.5 degrees, the tilt of the Earth's axis; every part of it is turned about its centre */
    const TILT = new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), (23.5 * PI) / 180);
    const GC = v(C.x, GY, C.z);
    const tilt = (o: T.Object3D) => { o.position.sub(GC).applyQuaternion(TILT).add(GC); o.quaternion.premultiply(TILT); return o; };
    for (let j = -5; j <= 5; j++) { const t = (j * PI) / 12, r = G * Math.cos(t); const ring = k.torus(r, 0.07, C.x, GY + G * Math.sin(t), C.z, steel, 72); ring.rotation.x = PI / 2; tilt(ring); }
    for (let j = 0; j < 12; j++) { const ring = k.torus(G, 0.07, C.x, GY, C.z, steel, 72); ring.rotation.y = (j * PI) / 12; tilt(ring); }
    const lands: T.Object3D[] = [];
    const rnd = X.mulberry(17);
    for (const [lat, lon, sx, sy] of [[0.7, -1.6, 2.6, 1.6], [0.2, -1.2, 1.2, 1.2], [-0.4, -1.0, 1.1, 2.2], [0.55, 0.15, 1.6, 1.4], [0.75, 1.1, 3.0, 1.4], [-0.15, 0.35, 1.5, 2.4], [-0.7, 2.2, 1.4, 0.9], [-0.05, 1.9, 0.9, 0.7]]) {
      const pos = v(C.x + Math.cos(lat) * Math.cos(lon) * G, GY + Math.sin(lat) * G, C.z + Math.cos(lat) * Math.sin(lon) * G).sub(GC).applyQuaternion(TILT).add(GC);
      const g = new T.IcosahedronGeometry(1, 2), pa = g.attributes.position;
      for (let i = 0; i < pa.count; i++) { const s = 0.8 + rnd() * 0.4; pa.setXYZ(i, pa.getX(i) * s, pa.getY(i) * s, pa.getZ(i) * s); }
      g.computeVertexNormals();
      const o = k.mesh(g, steel, pos.x, pos.y, pos.z);
      o.scale.set(sx, sy, 0.16);
      o.lookAt(C.x, GY, C.z);
      lands.push(o);
    }
    /* three orbit rings, believed to stand for Gagarin, Glenn and Telstar */
    const orbits: T.Object3D[] = [];
    for (let j = 0; j < 3; j++) { const ring = k.torus(G + 1.8 + j * 0.4, 0.1, C.x, GY, C.z, steel, 96); ring.rotation.x = 0.45 + j * 0.5; ring.rotation.y = j * 0.9; orbits.push(ring); }
    k.lathe([[3.2, 0], [3.2, 0.5], [1.4, 0.8], [1.0, 3.2], [0.6, 3.6]], C.x, 0.9, C.z, dark, 24);
    k.beam(v(C.x, 4.4, C.z), v(C.x + 3.5, GY - 8, C.z + 2), 0.25, dark, 8);
    k.beam(v(C.x, 4.4, C.z), v(C.x - 3.5, GY - 8, C.z + 2), 0.25, dark, 8);
    k.beam(v(C.x, 4.4, C.z), v(C.x, GY - 8, C.z - 4), 0.25, dark, 8);
    /* 48 fountainheads round the pool edge */
    for (let j = 0; j < 48; j++) { const t = (j * PI) / 24; k.curve([v(C.x + Math.cos(t) * 15, 0.9, C.z + Math.sin(t) * 15), v(C.x + Math.cos(t) * 12, 4.5, C.z + Math.sin(t) * 12), v(C.x + Math.cos(t) * 9, 1.2, C.z + Math.sin(t) * 9)], 0.04, glow, 12); }
    // the park axes, allees of trees, the pavilion towers, the far city
    /* the walks radiate north, northeast, southeast and south from the globe (north is minus z) */
    for (const a of [PI * 1.5, PI * 1.75, PI / 4, PI / 2]) {
      k.box(120, 0.1, 6, C.x + Math.cos(a) * 60, 0.03, C.z + Math.sin(a) * 60, pav).rotation.y = -a;
      for (let d = 30; d <= 90; d += 8) for (const s of [-1, 1]) { const x = C.x + Math.cos(a) * d + Math.sin(a) * s * 6, z = C.z + Math.sin(a) * d - Math.cos(a) * s * 6; k.tree(x, 0, z, { kind: 'column', h: 6, r: 2, leaf: 0x3f6b3a, seed: Math.round(d + s) }); }
    }
    /* the New York State Pavilion stands south of the Unisphere: its towers and the Tent of Tomorrow */
    for (const [x, z, h] of [[-14, 44, 26], [-8, 54, 18], [-20, 58, 22]]) { k.cyl(1.6, h as number, x as number, (h as number) / 2, z as number, dark, 1.2, 16); k.cyl(7, 0.8, x as number, h as number, z as number, steel, 7, 24); k.torus(7, 0.25, x as number, (h as number) + 0.5, z as number, dark, 32).rotation.x = PI / 2; }
    for (let j = 0; j < 16; j++) { const t = (j * PI) / 8; k.beam(v(24, 0, 60), v(24 + Math.cos(t) * 14, 9, 60 + Math.sin(t) * 14), 0.2, dark, 6); }
    k.torus(14, 0.35, 24, 9, 60, dark, 48).rotation.x = PI / 2;
    k.skyline({ z: -260, count: 30, spacing: 9, scale: 1.5, base: -2, seed: 30, lit: 0.1, glow: 0.2, tint: 0x9aa0a8, rows: 1 });
    k.prop('lamppost', C.x + 26, 0, C.z + 4, { height: 6 });
    k.prop('lamppost', C.x - 26, 0, C.z - 4, { height: 6 });
    k.prop('buoy', C.x + 12, 0.5, C.z - 4, { height: 1.8 });
    k.prop('mailbox', C.x + 25, 0, C.z - 14, { height: 1.5 });
    // the census at the entrance to the promenade
    k.censusWall({ x: 0, y: 3.0, z: 12.4, rotY: PI, cols: 26, rows: 4, tile: 0.58, gap: 0.05, start: ctx.wallStart(6200 > ctx.all.length - 104 ? 4800 : 6200, 104), pieces: ctx.all, backing: granite });
    for (const x of [-8.5, 8.5]) k.box(0.4, 4, 3, x, 2, 12.4, granite);
    k.box(17.4, 0.4, 3, 0, 4.2, 12.4, granite);
    // the route: a full circle around the basin, works facing inward on the outer ring and outward on the basin rim
    const path = Array.from({ length: 361 }, (_, i) => { const t = PI / 2 + (i / 360) * PI * 2; return v(C.x + Math.cos(t) * R, 3, C.z + Math.sin(t) * R); });
    const mounts: Mount[] = [];
    for (let i = 0; i < 16; i++) {
      const t = PI / 2 + ((i + 0.5) / 16) * PI * 2, rr = 25.6;
      const x = C.x + Math.cos(t) * rr, z = C.z + Math.sin(t) * rr;
      k.box(6.2, 4.4, 0.4, 0, 0, 0, granite).position.set(x, 2.4, z);
      const last = k.objects[k.objects.length - 1];
      last.rotation.y = -t - PI / 2;
      k.box(6.6, 0.3, 1.0, 0, 0, 0, granite).position.set(x, 0.15, z);
      k.objects[k.objects.length - 1].rotation.y = -t - PI / 2;
      mounts.push({ position: v(x - Math.cos(t) * 0.25, 2.8, z - Math.sin(t) * 0.25), rotation: -t - PI / 2, target: v(C.x + Math.cos(t) * R, 3, C.z + Math.sin(t) * R), width: 5.2, height: 3.0, style: 'steel', wash: false });
    }
    for (let i = 0; i < 8; i++) {
      /* The basin rim, outside the globe. At 17.55 this ring sat inside the
         Unisphere's own 18.2 keep out, so all eight works were embedded in the
         sculpture: you walked the promenade at radius 22 and saw panels buried
         in the steel. 19 clears the globe and leaves three metres to the path. */
      const t = PI / 2 + ((i + 0.5) / 8) * PI * 2, rr = 19;
      const x = C.x + Math.cos(t) * rr, z = C.z + Math.sin(t) * rr;
      mounts.push({ position: v(x, 2.4, z), rotation: -t + PI / 2, target: v(C.x + Math.cos(t) * R, 3, C.z + Math.sin(t) * R), width: 3.6, height: 2.2, style: 'steel', wash: false });
      k.box(4.2, 3.4, 0.3, 0, 0, 0, granite).position.set(x - Math.cos(t) * 0.2, 1.9, z - Math.sin(t) * 0.2);
      k.objects[k.objects.length - 1].rotation.y = -t - PI / 2;
    }
    // easter eggs: the tilt, the orbits, the Mohawk light, the lost island, the old foundation, the grass in Antarctica
    const W = { name: 'Unisphere, Wikipedia', url: 'https://en.wikipedia.org/wiki/Unisphere' };
    k.egg(v(C.x, GY, C.z), { id: 'unisphere-tilt', title: 'Earth from 4,000 miles', year: '1964', text: 'The Unisphere is tilted at 23.5 degrees, the angle of the Earth\'s own axis. Seen from the edge of the reflecting pool it shows the planet as it would look from about 4,000 miles away. The steel globe is 120 feet across and weighs 700,000 pounds.', clue: 'Stand back on the promenade and look at the lean of the whole globe.', source: W }, { r: 3.0 });
    k.egg(orbits[1], { id: 'unisphere-orbits', title: 'Three orbits, not twelve', text: 'The three steel rings are believed to trace the orbits of Yuri Gagarin, John Glenn and the Telstar satellite. The first plan had a ring for each of about a dozen satellites, cut to three because it looked better.', clue: 'Follow the rings that loop round the globe.', source: W }, { r: 2.0 });
    k.egg(lands[0], { id: 'unisphere-kahnawake', title: 'A light for the ironworkers', text: 'At the 1964 fair, lights on the globe marked the world\'s capitals. One more light marks the Kahnawake reserve, placed at the request of the Mohawk ironworkers who wanted their work on the structure honoured.', clue: 'Find North America on the globe and look for the extra light.', source: W }, { r: 2.0 });
    k.egg(lands[4], { id: 'unisphere-sri-lanka', title: 'Blown off the world', year: '2010', text: 'In the September 2010 tornadoes that hit Brooklyn and Queens, the wind tore the steel landmass for Sri Lanka clean off the globe. It was put back the next year.', clue: 'Look at Asia, down near the tip of India.', source: W }, { r: 2.0 });
    k.egg(v(C.x, 2.4, C.z), { id: 'unisphere-perisphere-piles', title: 'Standing on the Perisphere', text: 'The globe stands on a 20 foot inverted tripod, over a foundation of 528 creosoted Douglas fir piles first driven for the Perisphere of the 1939 World\'s Fair. About 600 more piles were added.', clue: 'Look at the three legged base under the globe.', source: W }, { r: 2.4 });
    k.egg(v(C.x, 5.0, C.z - 4.4), { id: 'unisphere-antarctica-grass', title: 'Grass in Antarctica', year: '2009', text: 'Local papers reported in 2009 that grass had started growing inside the steel landmass for Antarctica. Around the pool, 48 pairs of fountainheads were brought back in a $2 million restoration in 2010.', clue: 'Look under the globe, at the very bottom of the world.', source: W }, { r: 2.0 });
    return { mounts, spawn: path[0].clone(), look: v(path[40].x * 0.6 + C.x * 0.4, 7, path[40].z * 0.6 + C.z * 0.4), eye: 3, bounds: [-40, 40, -70, 14], path, style: 'steel' };
  },
};

/* ---------------- 18 ROOSEVELT ISLAND TRAM ---------------- */
export const tram: RoomDef = {
  id: 'tram',
  name: 'Suspended New York',
  area: 'ROOSEVELT ISLAND TRAM',
  mood: 'Above the East River',
  color: '#eaa58a',
  description: 'The Manhattan tram station high over Second Avenue, a red cabin docked and open, the bridge and river below.',
  signatures: 'The red glazed cabin under its hanger arm, the cable wheel machinery, the Queensboro Bridge cantilever alongside, the river far below.',
  build(k, ctx) {
    k.sky({ top: 0x6b7fb5, horizon: 0xf2b997, ground: 0x2a2e3a, fog: 0.0018, sun: { az: 4.6, el: 0.1, color: 0xffb37a, size: 24 }, haze: 0.35, env: 0.9 });
    k.hemi(0xffd8c4, 0x2a3040, 0.7);
    k.sun(0xffb98a, 2.0, -70, 20, -40, true, 70);
    const red = k.pbr('tramRed', X.steel(0xb52a2a, false, 12), 0.5, { metalness: 0.4, roughness: 0.4 }),
      steel = k.pbr('tramSteel', X.steel(0x3a4148, true, 13), 0.5, { metalness: 0.75, roughness: 0.45 }),
      concrete = k.pbr('platformT', X.concrete(0x9a9a94, 8), 0.35),
      glass = k.glass(0xbfdbe6, 0.16, 0.05),
      dark = k.flat(0x1a1d22, 0.6, 0.5),
      street = k.pbr('streetT', X.asphalt(0x22262b), 0.11),
      brick = k.pbr('brickT', X.brick(0x5e463d, 9), 0.28);
    const H = 0; // platform level; the street is thirty below
    // the station: platform, canopy, back wall of works, machinery house
    k.box(10, 0.6, 46, 0, H - 0.3, -12, concrete);
    k.box(1.0, 9, 46, 5.0, H + 4.5, -12, brick);
    k.box(14, 0.5, 48, -1, H + 9, -12, k.pbr('canopy', X.steel(0x6a7076, false, 18), 0.5, { metalness: 0.6, roughness: 0.5 }));
    for (let z = 8; z > -34; z -= 6) { k.box(0.4, 9, 0.4, 4.2, H + 4.5, z, steel); k.box(0.4, 9, 0.4, -7.6, H + 4.5, z, steel); k.box(13, 0.4, 0.4, -1.7, H + 8.8, z, steel); k.box(3, 0.1, 0.4, 0, H + 8.4, z, k.glow(0xfff0dc)); k.point(0, H + 8, z, 0xfff0dc, 20, 14); }
    k.box(0.06, 1.1, 46, -3.8, H + 0.55, -12, k.flat(0xf1c531, 0, 0.5));
    k.box(9, 12, 10, -1, H + 6, -42, steel);
    for (const x of [-4, 2]) { k.torus(3, 0.3, x, H + 10, -36.9, dark, 32); k.torus(2.4, 0.12, x, H + 10, -36.9, k.flat(0x8a8f96, 0.8, 0.3), 32); for (let j = 0; j < 8; j++) { const a = (j * PI) / 4; k.beam(v(x, H + 10, -36.8), v(x + Math.cos(a) * 2.9, H + 10 + Math.sin(a) * 2.9, -36.8), 0.08, dark, 5); } }
    k.sign('ROOSEVELT ISLAND TRAMWAY  ·  MANHATTAN STATION', 8, 0.7, -1, H + 7.6, -36.9, '#8e3d3c', '#ffffff', 70, 0, { border: true });
    k.box(10, 4, 1, 0, H + 2, 12, brick);
    k.censusWall({ x: 0, y: H + 5.4, z: -36.95, rotY: 0, cols: 12, rows: 3, tile: 0.6, gap: 0.05, start: ctx.wallStart(3600, 36), pieces: ctx.all, backing: dark });
    // the docked cabin: red frame, glass, open doors onto the platform
    const cx = -8.2;
    k.box(5, 0.3, 14, cx, H + 0.0, -10, steel);
    k.box(5.2, 0.28, 14.2, cx, H + 3.55, -10, red);
    k.rounded(5.4, 0.3, 14.4, cx, H + 3.85, -10, red, 0.2);
    for (const s of [-1, 1]) {
      k.box(0.12, 1.0, 14, cx + s * 2.5, H + 0.65, -10, red);
      k.box(0.05, 2.3, 14, cx + s * 2.5, H + 2.3, -10, glass);
      for (let z = -3.2; z > -17; z -= 2.3) k.box(0.1, 3.4, 0.12, cx + s * 2.5, H + 1.85, z, red);
    }
    for (const z of [-3, -17]) { k.box(5, 1.0, 0.12, cx, H + 0.65, z, red); k.box(5, 2.3, 0.05, cx, H + 2.3, z, glass); for (let x = -2; x <= 2; x += 1) k.box(0.12, 3.4, 0.1, cx + x, H + 1.85, z, red); }
    k.block(cx - 2.8, cx - 2.3, -17.2, -2.8);
    k.block(cx - 2.8, cx + 2.8, -17.4, -16.8);
    k.block(cx - 2.8, cx + 2.8, -3.2, -2.6);
    k.block(cx + 2.3, cx + 2.8, -17.2, -12.6);
    k.block(cx + 2.3, cx + 2.8, -7.4, -2.8);
    k.beam(v(cx, H + 3.9, -10), v(cx, H + 8.6, -10), 0.22, red, 8);
    k.box(0.5, 0.5, 6, cx, H + 8.8, -10, dark);
    for (const dz of [-2.4, 2.4]) k.torus(0.5, 0.12, cx, H + 9.5, -10 + dz, dark, 20);
    for (const x of [cx - 0.35, cx + 0.35]) k.beam(v(x, H + 9.5, 40), v(x, H + 9.5, -260), 0.05, dark, 5);
    k.sign('ROOSEVELT ISLAND', 3, 0.4, cx, H + 3.3, -2.9, '#8e3d3c', '#ffffff', 90, 0);
    /* the Manhattan towers on the line: one between First and Second Avenues, the tallest at York Avenue.
       Tapered steel legs either side of the cables, a cross head carrying the sheaves */
    const towers: T.Object3D[] = [];
    for (const [tz, top] of [[-62, H + 11], [-108, H + 11]] as const) {
      for (const s of [-1, 1]) towers.push(k.beam(v(cx + s * 7, H - 30, tz), v(cx + s * 4.2, top, tz), 0.55, steel, 8));
      k.beam(v(cx - 7, H - 30, tz), v(cx + 4.2, top - 14, tz), 0.18, steel, 6); k.beam(v(cx + 7, H - 30, tz), v(cx - 4.2, top - 14, tz), 0.18, steel, 6);
      k.box(10, 1.0, 1.6, cx, top + 0.5, tz, steel);
      for (const dx of [-0.35, 0.35]) k.torus(0.45, 0.1, cx + dx, H + 9.5 + 0.45, tz, dark, 16).rotation.y = PI / 2;
    }
    // a second cabin riding the cable out over the river
    const far = new T.Group();
    const fb = new T.Mesh(new T.BoxGeometry(5, 3.6, 14), red);
    far.add(fb);
    const fg = new T.Mesh(new T.BoxGeometry(5.05, 2.2, 14.05), glass);
    fg.position.y = 0.4;
    far.add(fg);
    const arm = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 5, 8), red);
    arm.position.y = 4.3;
    far.add(arm);
    far.position.set(cx, H + 3.4, -80);
    k.add(far);
    if (!ctx.reduced) k.ticks.push((t) => { far.position.z = -60 - ((Math.sin(t * 0.05) + 1) / 2) * 160; });
    // the river, the bridge alongside, the streets below, the island and the far city
    k.box(200, 0.3, 200, -20, H - 30, -20, street);
    k.water({ y: H - 31, color: 0x2d4a5c, w: 500, d: 500, x: -60, z: -220, amp: 1.2 });
    k.box(80, 2, 160, -60, H - 30, -200, k.pbr('quayT', X.pavers(0x6f716c, 10), 0.2));
    for (let i = 0; i < 12; i++) k.box(6, 10 + (i % 3) * 5, 8, -75 + (i % 4) * 8, H - 24 + (i % 3) * 2.5, -140 - i * 12, brick);
    for (const s of [-1, 1]) for (let b = 0; b < 6; b++) { const z = 30 - b * 16, h = 20 + (b % 3) * 12; k.box(12, h, 12, 22 + s * 0, H - 30 + h / 2, z, brick); }
    // Queensboro: two cantilever towers and truss webs along the cable line
    for (const z of [-40, -130]) { for (const x of [-26, -14]) k.box(1.2, 44, 1.6, x, H - 30 + 22, z, steel); k.box(13, 1.2, 1.6, -20, H + 14, z, steel); k.box(13, 1.2, 1.6, -20, H - 2, z, steel); }
    for (let z = 30; z > -200; z -= 4) { for (const x of [-26, -14]) { k.beam(v(x, H - 2, z), v(x, H + 2 + Math.abs(Math.sin(z * 0.03)) * 8, z), 0.12, steel, 5); } k.beam(v(-26, H + 2 + Math.abs(Math.sin(z * 0.03)) * 8, z), v(-14, H + 2 + Math.abs(Math.sin((z - 4) * 0.03)) * 8, z - 4), 0.09, steel, 5); k.box(14, 0.5, 4, -20, H - 2.5, z, steel); }
    for (let z = 30; z > -200; z -= 4) k.beam(v(-26, H - 2, z), v(-14, H - 2, z - 4), 0.07, steel, 4);
    k.skyline({ z: -260, count: 30, spacing: 8, scale: 2.4, base: H - 30, seed: 33, lit: 0.35, glow: 0.9, tint: 0x3a4250, x: -60 });
    k.skyline({ z: 60, count: 24, spacing: 8, scale: 2.8, base: H - 30, seed: 34, lit: 0.4, glow: 1.0, tint: 0x2f3744, x: 60, rows: 1 });
    k.prop('lantern', 3.6, H, -20, { height: 1.0 });
    k.prop('mailbox', 3.6, H, 2, { height: 1.5, rotY: -PI / 2, keepOut: 0.6 });
    k.bench(3.2, -8, PI, k.pbr('benchT', X.planks(0x6a4a30, 3, 9), 1.2), dark, 2.4);
    k.bench(3.2, -26, PI, k.pbr('benchT', X.planks(0x6a4a30, 3, 9), 1.2), dark, 2.4);
    // the works: the station's back wall, the cabin's end walls, the machinery house
    const mounts: Mount[] = [];
    for (let i = 0; i < 10; i++) { const z = 6 - i * 4.2; mounts.push({ position: v(4.45, H + 3.4, z), rotation: -PI / 2, target: v(0.4, 3, z), width: 3.8, height: 2.2, style: 'steel' }); }
    for (const [z, rot, tz] of [[-3.06, PI, -6.5], [-16.94, 0, -13.5]] as const) mounts.push({ position: v(cx, H + 2.1, z), rotation: rot, target: v(cx, 3, tz), width: 3.6, height: 2.0, style: 'steel', wash: false });
    for (const x of [-3.6, 1.6]) mounts.push({ position: v(x, H + 3.2, -36.95), rotation: 0, target: v(x, 3, -31), width: 4.4, height: 2.5, style: 'steel' });
    mounts.push({ position: v(-1, H + 6.2, -36.95), rotation: 0, target: v(-1, 3, -30), width: 4.4, height: 2.5, style: 'steel' });
    for (const [z0, z1] of [[9.5, -1.5], [-18.5, -30.5]]) {
      const zc = (z0 + z1) / 2, len = z0 - z1;
      k.box(0.3, 4.6, len, -5.2, 2.3, zc, steel);
      k.box(0.34, 0.2, len + 0.2, -5.2, 4.7, zc, red);
      for (const z of [zc + len / 4, zc - len / 4]) mounts.push({ position: v(-5.02, 2.9, z), rotation: PI / 2, target: v(-1.2, 3, z), width: 4.2, height: 2.4, style: 'steel' });
    }
    // easter eggs: the temporary tram, the bridge, the tall tower, the long wait, the building that never came, King Kong
    const W = { name: 'Roosevelt Island Tramway, Wikipedia', url: 'https://en.wikipedia.org/wiki/Roosevelt_Island_Tramway' };
    k.egg(v(cx, H + 3.3, -2.6), { id: 'tram-temporary', title: 'Only until the subway came', year: '1976', text: 'The tram opened on May 17, 1976, meant as a temporary way across until the subway reached Roosevelt Island. The subway came, and the tram stayed. It carried 1.25 million riders in its first year.', clue: 'Look at the sign on the end of the docked cabin.', source: W }, { r: 1.4 });
    k.egg(v(-20, H + 4, -40), { id: 'tram-beside-the-bridge', title: 'Hiding beside the bridge', text: 'The tram runs right alongside the Queensboro Bridge, on purpose: keeping the cables next to the bridge was meant partly to stop planes at low altitude from flying into them.', clue: 'Look across at the steel trusses of the bridge running beside the cables.', source: W }, { r: 3.0 });
    k.egg(towers[3], { id: 'tram-york-tower', title: '250 feet at York Avenue', text: 'The tallest of the line\'s three towers stands at York Avenue, 250 feet above the ground. Even at the lowest point of the ride the cabin floors are 135 feet above the East River, and the whole crossing takes three to four minutes at up to 17 miles an hour.', clue: 'Find the second steel tower out along the cables, at the river\'s edge.', source: W }, { r: 3.0 });
    k.egg(v(cx, H + 9.5, -40), { id: 'tram-stranded', title: 'Eleven hours over the river', year: '2006', text: 'On April 18, 2006, the tram broke down over the East River, trapping 69 people for up to eleven hours. Rescuers brought them down in cages that hold fourteen passengers each. The 2010 rebuild gave each cabin its own haul cable, so the two now run independently.', clue: 'Follow the cables out past the end of the platform.', source: W }, { r: 2.0 });
    k.egg(v(0, H + 0.2, -20), { id: 'tram-deck-for-a-tower', title: 'Built to carry a skyscraper', text: 'The concrete deck of the Manhattan terminal was engineered to hold a 32 or 35 story building on top. The building was never put up.', clue: 'Look at the concrete platform under your feet.', source: W }, { r: 1.8 });
    k.egg(v(cx, H + 8.6, -10), { id: 'tram-kong', title: 'King Kong\'s favourite ride', text: 'The tram has played itself in Nighthawks, Léon: The Professional, Spider-Man and Dark Water. At Universal Studios Florida, the Kongfrontation ride (1990 to 2002) had a model King Kong attacking a model of the Roosevelt Island tram.', clue: 'Look up at the hanger arm above the docked cabin.', source: W }, { r: 1.4 });
    return { mounts, spawn: v(1.2, 3, 9), look: v(-4, 3, -20), eye: 3, bounds: [-10.9, 3.6, -33, 10.5], style: 'steel' };
  },
};

/* ---------------- 19 THE CLOISTERS ---------------- */
export const cloisters: RoomDef = {
  id: 'cloisters',
  name: 'The quiet city',
  area: 'THE CLOISTERS',
  mood: 'Garden light',
  color: '#c5b991',
  description: 'Paired stone columns around a planted garth, terracotta roofs, the works hung in the shade of the covered walks.',
  signatures: 'Arcades of paired columns with carved capitals, a quartered herb garden with a central fountain, terracotta tiled lean to roofs.',
  build(k, ctx) {
    k.sky({ top: 0x7ea7d3, horizon: 0xe9e6dc, ground: 0x59614a, fog: 0.003, sun: { az: 2.0, el: 0.6, color: 0xfff1d6, size: 14 }, env: 0.85 });
    k.hemi(0xf4f2e8, 0x4a4a38, 0.85);
    k.sun(0xfff0d4, 2.2, 20, 40, 20, true, 50);
    const stone = k.pbr('cloisterStone', X.ashlar(0xc9bb9c, 9, 4), 0.3),
      pink = k.pbr('cuxa', X.marble(0xd9b8a8, 0xa0786a, 6), 0.4, { roughness: 0.5 }),
      walk = k.pbr('walkStone', X.pavers(0xa59d8c, 10), 0.32),
      terracotta = k.pbr('terracotta', X.boardwalk(0xb0603e), 0.5, { roughness: 0.85 }),
      soil = k.flat(0x4a3a2c, 0, 1),
      herb = k.flat(0x62803f, 0, 0.95),
      herb2 = k.flat(0x8a9a5c, 0, 0.95),
      dark = k.flat(0x2b2620, 0.3, 0.7),
      water = k.flat(0x37646a, 0.5, 0.2, { transparent: true, opacity: 0.9 }),
      lawn = k.pbr('cuxaLawn', X.grass(0x5a7d3e, 6), 0.2);
    const Cz = -22, S = 15;
    k.box(64, 0.4, 64, 0, -0.2, Cz, walk);
    k.box(2 * S - 6, 0.3, 2 * S - 6, 0, 0.02, Cz, soil);
    // four arcaded walks with paired columns, lean to roofs and a solid outer wall
    for (const side of [0, 1, 2, 3]) {
      const a = (side * PI) / 2;
      const rot = new T.Matrix4().makeRotationY(a);
      const place = (x: number, z: number) => v(x, 0, z).applyMatrix4(rot).add(v(0, 0, Cz));
      for (let i = 0; i < 6; i++) {
        const t = -S + 2.5 + i * 5;
        for (const d of [-0.42, 0.42]) { const p = place(t, S + d); k.column(p.x, 0, p.z, 4.6, 0.22, pink, false, stone); }
      }
      const wall = place(0, S);
      const arcade = k.arcade(2 * S + 2, 6.6, 0.9, 6, 3.6, 5.2, wall.x, 0, wall.z, stone, a, false);
      void arcade;
      const back = place(0, S + 6);
      const bw = k.box(2 * S + 12, 8, 1.0, back.x, 4, back.z, stone);
      bw.rotation.y = a;
      const roof = place(0, S + 3);
      const rf = k.box(2 * S + 12, 0.3, 7.2, roof.x, 7.6, roof.z, terracotta);
      rf.rotation.set(0, a, 0);
      rf.rotateX(-0.28);
      for (let j = -S - 5; j <= S + 5; j += 1.1) { const p = place(j, S + 3); const tile = k.box(0.5, 0.25, 7.2, p.x, 7.75, p.z, terracotta); tile.rotation.set(0, a, 0); tile.rotateX(-0.28); }
      const fl = place(0, S + 3);
      const floor = k.box(2 * S + 12, 0.3, 6.4, fl.x, 0.05, fl.z, walk);
      floor.rotation.y = a;
      for (let j = 0; j < 3; j++) { const p = place(-S + 5 + j * 10, S + 5.5); k.point(p.x, 4.6, p.z, 0xfff0d6, 12, 12); }
    }
    // the garth: crossed paths make four quadrants, each a grass plot with a pruned fruit tree, flowers and herbs at the edges
    for (const s of [-1, 1]) { k.box(2 * S - 6, 0.12, 1.6, 0, 0.1, Cz + s * 0, walk); k.box(1.6, 0.12, 2 * S - 6, s * 0, 0.1, Cz, walk); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const bx = sx * 6.6, bz = Cz + sz * 6.6;
      k.box(10, 0.4, 10, bx, 0.2, bz, lawn);
      k.box(10.4, 0.5, 0.3, bx, 0.25, bz - 5.1, stone);
      k.box(10.4, 0.5, 0.3, bx, 0.25, bz + 5.1, stone);
      k.box(0.3, 0.5, 10.4, bx - 5.1, 0.25, bz, stone);
      k.box(0.3, 0.5, 10.4, bx + 5.1, 0.25, bz, stone);
      const rnd = X.mulberry(sx * 3 + sz * 7 + 40);
      for (let i = 0; i < 34; i++) { const e = rnd() * 4, u = -4.3 + rnd() * 8.6, w = (e < 1 ? -1 : e < 2 ? 1 : 0) * 4.3, q = (e >= 2 && e < 3 ? -1 : e >= 3 ? 1 : 0) * 4.3; k.sphere(0.25 + rnd() * 0.3, bx + (w || u), 0.55, bz + (q || (w ? u : 0)), i % 3 ? herb : herb2, 7); }
      /* the Met keeps a pollarded crabapple in each plot; the kit has no apple, pear is the nearest rosaceous form */
      k.tree(bx, 0.3, bz, { kind: 'round', h: 3.4, r: 1.7, leaf: 0x4f7a3c, seed: sx + sz * 2, species: 'pear' });
      k.keepOut.push({ x: bx, z: bz, r: 5.6 });
    }
    /* the eight sided fountain at the crossing, in the same pink marble as the columns */
    const fountain = k.lathe([[2.0, 0], [2.0, 0.3], [0.5, 0.5], [0.3, 1.4], [1.2, 1.6], [1.2, 1.9], [0.25, 2.0], [0.2, 2.6], [0.5, 2.8]], 0, 0, Cz, pink, 8);
    fountain.rotation.y = PI / 8;
    k.cyl(1.15, 0.05, 0, 1.7, Cz, water, 1.15, 8);
    k.keepOut.push({ x: 0, z: Cz, r: 2.3 });
    for (const [x, z] of [[-13, Cz - 13], [13, Cz + 13]]) k.prop('lantern', x, 0, z, { height: 1.0 });
    k.prop('tree', 13, 0, Cz - 13, { height: 4.2 });
    k.prop('tree', -13, 0, Cz + 13, { height: 4.2 });
    for (const x of [-9, 9]) k.prop('quiet_bench', x, 0.2, Cz + S + 3, { height: 0.65, keepOut: 1.7 });
    // the chapel wall with the census, the entrance passage
    k.box(2 * S + 12, 12, 1.0, 0, 6, Cz - S - 6.4, stone);
    k.arch(4, 8, 1.2, 0, 0, Cz - S - 6.4, stone, true, 0.7);
    k.censusWall({ x: 0, y: 9.4, z: Cz - S - 5.85, rotY: 0, cols: 26, rows: 3, tile: 0.55, gap: 0.05, start: ctx.wallStart(2900, 78), pieces: ctx.all, backing: dark });
    k.sign('FORT TRYON  ·  THE CUXA CLOISTER', 7, 0.6, 0, 11.4, Cz - S - 5.85, '#6b5334', '#f4e6c8', 80, 0, { border: true });
    for (const s of [-1, 1]) k.box(4, 6, 8, s * 3.5, 3, Cz + S + 8, stone);
    // the works in the shade of each walk, on the outer walls between the bays
    const mounts: Mount[] = [];
    for (const side of [0, 1, 2, 3]) {
      const a = (side * PI) / 2, rot = new T.Matrix4().makeRotationY(a);
      const place = (x: number, y: number, z: number) => v(x, y, z).applyMatrix4(rot).add(v(0, 0, Cz));
      for (let i = 0; i < 5; i++) {
        const t = -S + 3 + i * 6;
        if (side === 2 && i === 2) continue;
        if (side === 0 && i === 2) continue;
        const p = place(t, 2.9, S + 5.45), tgt = place(t, 3, S + 2.4);
        mounts.push({ position: p, rotation: PI + a, target: tgt, width: 4.4, height: 2.6, style: 'oak', wash: true });
      }
    }
    for (const s of [-1, 1]) mounts.push({ position: v(s * 6, 3.0, Cz - S - 5.85), rotation: 0, target: v(s * 6, 3, Cz - S + 3), width: 4.4, height: 2.6, style: 'oak', wash: true });
    // easter eggs: the marble, the price, the fountain, the chapel in crates, the cliffs across the river, the unicorn's tree
    const W = { name: 'The Cloisters, Wikipedia', url: 'https://en.wikipedia.org/wiki/The_Cloisters' };
    k.egg(v(-7.5, 2.6, Cz + S), { id: 'cloisters-cuxa-marble', title: 'Old stone, new walls', year: '878', text: 'The walls of the Cuxa Cloister are modern, but its capitals and columns are original, cut from pink Languedoc marble from the Pyrenees. They came from the monastery of Saint Michel de Cuxa, founded in 878, which was abandoned in 1791; its roof fell in 1835 and its bell tower in 1839.', clue: 'Look closely at the pink, mottled marble of the paired columns.', source: W }, { r: 1.4 });
    k.egg(v(0, 3.4, Cz + S + 5.3), { id: 'cloisters-barnard-price', title: 'Bought by the cloister', text: 'The sculptor and collector George Grey Barnard reportedly paid $100,000 for the Cuxa cloister, and $25,000 each for the Trie and Bonnefont buildings. John D. Rockefeller Jr. bought Barnard\'s whole collection for around $700,000 and kept him on as an advisor.', clue: 'Find the bare stretch of wall in the middle of the south walk.', source: W }, { r: 1.6 });
    k.egg(v(0, 2.6, Cz), { id: 'cloisters-lilies-and-roses', title: 'Eight sides, guessed plants', text: 'An eight sided fountain stands where the two garden walks cross. Nobody can know exactly what grew here in the Middle Ages: the oldest plan of the original monastery describes lilies and roses, and today\'s planting is a best approximation by botanists of the medieval garden.', clue: 'Walk to the fountain at the crossing of the paths and count its sides.', source: W }, { r: 1.8 });
    k.egg(v(0, 5.0, Cz - S - 5.8), { id: 'cloisters-839-crates', title: 'A chapel in 839 crates', year: '1961', text: 'The museum\'s largest room holds a Romanesque apse from a church at Fuentidueña, near Segovia in Spain, built about 1175 to 1200. Rockefeller acquired it in 1931; it was taken apart into almost 3,300 blocks, shipped to New York in 839 crates, rebuilt in the late 1940s and opened in 1961.', clue: 'Stand in the arch of the chapel wall at the north end.', source: W }, { r: 1.8 });
    k.egg(v(-S - 5.3, 6.2, Cz), { id: 'cloisters-palisades', title: 'He bought the view', year: '1933', text: 'Rockefeller bought the clifftops of the New Jersey Palisades across the Hudson over several years, and in 1933 gave several hundred acres of them to the Palisades Interstate Park Commission so they would stay free of development.', clue: 'On the west walk, look up at the wall that faces the river.', source: W }, { r: 1.8 });
    k.egg(v(13, 2.2, Cz - 13), { id: 'cloisters-unicorn-medlar', title: 'The unicorn\'s tree', text: 'The Unicorn Tapestries, woven around 1495 to 1505, were bought by Rockefeller in 1922 for about a million dollars and given to the museum. In the Bonnefont Cloister garden grows a medlar tree of the kind woven into the tapestries.', clue: 'Find the small tree in the corner of the garth.', source: W }, { r: 1.6 });
    return { mounts, spawn: v(0, 3, Cz + S - 2.5), look: v(0, 2.6, Cz), eye: 3, bounds: [-S - 5, S + 5, Cz - S - 5, Cz + S + 6], style: 'oak' };
  },
};

/* ---------------- 20 BROOKLYN NAVY YARD ---------------- */
export const navyyard: RoomDef = {
  id: 'navyyard',
  name: 'The dry dock cathedral',
  area: 'BROOKLYN NAVY YARD',
  mood: 'Industrial dusk',
  color: '#d4ae78',
  description: 'A stepped granite dry dock, a rusted hull on the blocks, monumental works hung from the gantry over the void.',
  signatures: 'Stepped granite altar walls of the dock, keel blocks and rails on the floor, lattice gantry cranes, the caisson gate to the river.',
  build(k, ctx) {
    k.sky({ top: 0x3a4658, horizon: 0xd9905e, ground: 0x2a2a2c, fog: 0.0025, sun: { az: 4.3, el: 0.08, color: 0xff9a55, size: 22 }, haze: 0.35, env: 0.7 });
    k.hemi(0xe6c8b0, 0x2a2c30, 0.6);
    k.sun(0xffb070, 1.8, -60, 18, -20, true, 80);
    const granite = k.pbr('dockGranite', X.ashlar(0x8f8c84, 11, 3), 0.2),
      quay = k.pbr('quayN', X.pavers(0x7a7a76, 12), 0.3),
      rust = k.pbr('hullRust', X.steel(0x7a3f28, true, 14), 0.25, { metalness: 0.5, roughness: 0.7 }),
      steel = k.pbr('gantry', X.steel(0x3f4a52, true, 15), 0.6, { metalness: 0.75, roughness: 0.45 }),
      yellow = k.pbr('gantryY', X.steel(0xd9a12a, false, 16), 0.6, { metalness: 0.5, roughness: 0.5 }),
      timber = k.pbr('keel', X.planks(0x4a3a2c, 3, 18), 1.0),
      corr = k.pbr('shed', X.steel(0x5a6066, false, 17), 0.8, { metalness: 0.6, roughness: 0.5 }),
      dark = k.flat(0x1a1c20, 0.6, 0.5);
    /* Dry Dock 1 was built to take a vessel 320 feet long (about 98 m), so the basin runs 100 m from head to caisson */
    const L = 100, ZC = 10 - L / 2, D = 12;
    // the dock: stepped walls down to the floor, rails and keel blocks
    k.box(60, 0.6, L + 30, 0, -0.3, ZC - 6, quay);
    k.box(18, 0.6, L, 0, -D - 0.3, ZC, granite);
    for (const s of [-1, 1]) for (let step = 0; step < 6; step++) { const w = 1.4, x = s * (9 + step * w), y = -D + step * 2; k.box(w, 2 + 0.01, L, x, y + 1, ZC, granite); }
    k.box(60, D + 2, 8, 0, -D / 2, ZC + L / 2 + 4, granite);
    for (const x of [-4, -2.6, 2.6, 4]) k.box(0.14, 0.14, L, x, -D + 0.07, ZC, dark);
    for (let z = 6; z > ZC - L / 2; z -= 3) k.box(4, 1.2, 1.2, 0, -D + 0.6, z, timber);
    /* This used to block the whole dock, x -17.6 to 17.6 and z -64 to 10.6,
       which is every square metre of the room inside its own bounds. The
       visitor spawned at z 10, was shoved straight back out to z 10.6, and was
       left in a strip a metre and a half deep with all twenty one works
       unreachable behind them. The quay slab already covers the dock, so there
       is no void to fall into: what has to be blocked is only what stands up
       out of the yard. */
    k.block(-3.2, 3.2, -26.2, -17.8);            // the deckhouse on the hull's back
    k.block(-10.2, 10.2, ZC - L / 2 - 2.2, ZC - L / 2 + 0.2);   // the caisson gate at the river end
    k.keepOut.push({ x: 17, z: 0, r: 0.7 });     // the bell post
    for (const z of [-8, -32]) k.keepOut.push({ x: 15.6, z, r: 1.5 });   // the quay benches
    // the hull on the blocks
    const hull = k.mesh(new T.CylinderGeometry(6.5, 6.5, 40, 28, 1, false, 0, PI), rust, 0, -D + 2.4, -30);
    hull.rotation.set(0, 0, PI / 2);
    hull.rotateY(PI / 2);
    k.mesh(new T.CylinderGeometry(6.5, 6.5, 40, 28, 1, false, 0, PI), rust, 0, -D + 2.4, -30).rotation.set(PI / 2, 0, PI / 2);
    k.box(13, 1.6, 40, 0, -D + 9.4, -30, rust);
    k.box(6, 3, 8, 0, -D + 11.7, -22, corr);
    for (const z of [-14, -46]) k.mesh(new T.ConeGeometry(6.5, 8, 28), rust, 0, -D + 2.4, z).rotation.set(z > -30 ? -PI / 2 : PI / 2, 0, 0);
    k.prop('porthole', 6.55, -D + 5, -24, { height: 0.9, rotY: PI / 2 });
    k.prop('porthole', 6.55, -D + 5, -36, { height: 0.9, rotY: PI / 2 });
    k.prop('life_ring', 6.6, -D + 8.2, -30, { height: 1.0, rotY: PI / 2 });
    // gantries: two portal cranes and a longitudinal beam carrying the monumental works
    for (const z of [-6, -50]) {
      for (const s of [-1, 1]) { k.box(1.2, 22, 1.4, s * 20, 11, z, yellow); for (let y = 1; y < 21; y += 2.2) { k.beam(v(s * 20 - 0.5, y, z), v(s * 20 + 0.5, y + 2.2, z), 0.07, steel, 5); k.beam(v(s * 20 + 0.5, y, z), v(s * 20 - 0.5, y + 2.2, z), 0.07, steel, 5); } k.box(3, 0.6, 3, s * 20, 0.3, z, steel); }
      for (const y of [21.5, 24]) k.box(42, 0.5, 0.6, 0, y, z, yellow);
      for (let x = -20; x < 20; x += 2.5) { k.beam(v(x, 21.5, z), v(x + 2.5, 24, z), 0.09, steel, 5); k.beam(v(x, 24, z), v(x + 2.5, 21.5, z), 0.09, steel, 5); }
      k.box(3, 1.6, 2.2, 6, 25.6, z, corr);
      k.beam(v(0, 21.4, z), v(0, 14, z), 0.05, dark, 4);
      k.torus(0.6, 0.12, 0, 13.4, z, yellow, 20);
    }
    for (const y of [19, 20.5]) k.box(0.6, 0.5, L - 4, 0, y, ZC, yellow);
    for (let z = 4; z > ZC - L / 2 + 2; z -= 2.5) { k.beam(v(0, 19, z), v(0, 20.5, z - 2.5), 0.08, steel, 5); }
    // sheds along the quay, the caisson gate and the river beyond
    for (let b = 0; b < 4; b++) {
      const z = 2 - b * 18;
      k.box(6, 8, 16, 21.5, 4, z, corr);
      k.mesh(new T.CylinderGeometry(3.2, 3.2, 16.4, 16, 1, false, 0, PI), corr, 21.5, 8, z).rotation.set(0, 0, PI / 2);
      k.box(0.4, 8.4, 16.4, 18.4, 4, z, k.pbr('shedBrick', X.brick(0x5e4238, 10), 0.28));
      for (let y = 2.5; y < 7; y += 2) for (let dz = -6; dz <= 6; dz += 3) k.box(0.1, 1.2, 1.6, 18.15, y, z + dz, k.glow(0xffd0a0));
    }
    k.sign('BUILDING 92  ·  DRY DOCK 1', 8, 0.8, 18.1, 7.2, -20, '#2a2e33', '#f4d38a', 90, -PI / 2, { border: true });
    k.box(20, D + 4, 2.4, 0, -D / 2 + 1, ZC - L / 2 - 1, steel);
    for (let x = -9; x <= 9; x += 3) k.box(0.4, D + 4, 0.4, x, -D / 2 + 1, ZC - L / 2 + 0.3, dark);
    k.water({ y: -1.6, color: 0x24404e, w: 400, d: 300, z: ZC - L / 2 - 160, amp: 1 });
    k.box(60, 3, 60, 0, -1.5, ZC - L / 2 - 30, quay);
    for (const [x, z] of [[-30, -100], [36, -120], [0, -140]]) { k.box(1.2, 30, 1.4, x, 15, z, yellow); k.box(26, 0.8, 0.8, x + 8, 29, z, yellow); k.beam(v(x + 8, 29, z), v(x + 18, 22, z), 0.08, steel, 5); }
    k.skyline({ z: -190, count: 32, spacing: 7, scale: 2.4, base: -2, seed: 40, lit: 0.4, glow: 1.2, tint: 0x33394a });
    k.prop('hook', -14, 0, 4, { height: 2.2 });
    k.prop('cleat', 16, 0, -10, { height: 0.6 });
    k.prop('cleat', -16, 0, -30, { height: 0.6 });
    k.prop('buoy', 16.5, 0, -46, { height: 2.0, keepOut: 0.9 });
    k.prop('lobster_trap', -16, 0, 2, { height: 1.0, rotY: 0.5 });
    k.prop('bell', 17, 1.8, 0, { height: 0.9 });
    k.box(0.25, 1.8, 0.25, 17, 0.9, 0, dark);
    for (const s of [-1, 1]) k.rail(s * 17.3, ZC, L, dark, 1.1, 'z', 2);
    for (const z of [4, -20, -44]) for (const s of [-1, 1]) { k.prop('lamppost', s * 15.5, 0, z, { height: 6.5, keepOut: 0.45 }); k.point(s * 15.5, 6, z, 0xffd0a0, 26, 15); }
    for (const z of [-8, -32]) k.bench(15.6, z, PI, k.pbr('benchN', X.planks(0x5d4939, 3, 19), 1.2), dark, 2.6);
    k.censusWall({ x: 18.15, y: 4.2, z: 20, rotY: -PI / 2, cols: 14, rows: 4, tile: 0.62, gap: 0.05, start: ctx.wallStart(1000, 56), pieces: ctx.all, backing: dark });
    // the works: eight monumental hangs from the gantry, twelve along the sheds
    const mounts: Mount[] = [];
    for (let i = 0; i < 8; i++) {
      const s = i % 2 ? 1 : -1, z = 0 - i * 7.6;
      for (const dx of [-3.5, 3.5]) k.beam(v(dx, 19, z), v(dx, 12.4, z), 0.03, dark, 4);
      mounts.push({ position: v(0, 8.8, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * -15.2, 3, z), width: 9.6, height: 6.4, style: 'steel', wash: false, lookAt: v(0, 8.8, z) });
      k.box(0.14, 7.2, 10.4, 0, 8.8, z, dark);
    }
    for (let i = 0; i < 12; i++) { const z = 8 - i * 6; if (z > 6) continue; mounts.push({ position: v(18.1, 3.4, z), rotation: -PI / 2, target: v(13.6, 3, z), width: 4.8, height: 2.8, style: 'steel' }); }
    for (let i = 0; i < 2; i++) mounts.push({ position: v(-18.1, 3.4, -10 - i * 30), rotation: PI / 2, target: v(-13.6, 3, -10 - i * 30), width: 4.8, height: 2.8, style: 'steel' });
    for (let i = 0; i < 2; i++) k.box(0.4, 6, 8, -18.4, 3, -10 - i * 30, corr);
    // easter eggs: the engineer, the Maine granite, the arch under the floor, the caisson, the Monitor myth, the prison ships
    const HDC = { name: 'Dry Dock 1, Historic Districts Council', url: 'https://hdc.org/buildings/dry-dock-1/' };
    const AIT = { name: 'Brooklyn Navy Yard, Invention and Technology', url: 'https://www.inventionandtech.com/node/85452' };
    k.egg(v(-12, -4, -10), { id: 'navyyard-mcalpine', title: 'Springs under the dock', year: '1851', text: 'Dry Dock 1, built from 1840 to 1851, was the first permanent dry dock in the area and is still in use. Its engineer, William J. McAlpine, had to beat a failing cofferdam and floods from underground springs, and the walls are faced with some 23,000 yards of granite.', clue: 'Look down the stepped granite walls on the west side.', source: HDC }, { r: 2.0 });
    k.egg(v(0, -6, ZC + L / 2 - 0.5), { id: 'navyyard-maine-granite', title: 'Floated down from Maine', text: 'The Navy decided in 1841 to build its first dry dock here, New York\'s first too. Great blocks of granite were floated down from Maine and laid on a cement and flagstone foundation, and the job took ten years and three million dollars. It was made to take a ship 320 feet long with a 21 foot draft.', clue: 'Look at the granite head wall at the landward end of the dock.', source: AIT }, { r: 2.2 });
    k.egg(v(0, -D + 0.4, -60), { id: 'navyyard-inverted-arch', title: 'An arch upside down', text: 'The flat floor of the dock, thirty feet wide, sits on a great inverted arch of stone. The arch pushes back against the water pressure trying to lift the floor from below.', clue: 'Look at the floor of the dock beyond the bow of the hull.', source: HDC }, { r: 2.0 });
    k.egg(v(0, -4, ZC - L / 2 + 0.6), { id: 'navyyard-caisson', title: 'A gate that sinks', text: 'The caisson across the mouth dates from the 1920s. To flood the dock, water is pumped into the caisson until it sinks and lets the river in; to empty the 610,000 gallon stone tub takes more than two hours. Gulls flock in to eat the fish left stranded on the granite.', clue: 'Walk to the far end and look at the steel gate to the river.', source: AIT }, { r: 2.2 });
    k.egg(v(6.6, -D + 6.5, -30), { id: 'navyyard-monitor-myth', title: 'Not built here', year: '1862', text: 'Almost anyone at the Navy Yard will tell you the ironclad Monitor was built right here in Dry Dock 1. It was not: the Monitor was built in Greenpoint and only fitted out at the yard.', clue: 'Look at the rusted flank of the hull on the blocks.', source: AIT }, { r: 2.0 });
    k.egg(v(-14, 2, ZC - L / 2 - 3), { id: 'navyyard-prison-ships', title: 'The prison ships of Wallabout Bay', year: '1783', text: 'During the Revolutionary War the British held American prisoners on ships moored in Wallabout Bay, where the yard now stands. Some 12,000 were said to have died by 1783, remembered by the Prison Ship Martyrs\' Monument in Fort Greene Park. Yard workers later dug up a skeleton thought to be one of them.', clue: 'Stand at the river end of the quay and look out over the water.', source: { name: 'Brooklyn Navy Yard, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn_Navy_Yard' } }, { r: 2.0 });
    return { mounts, spawn: v(-13, 3, 10), look: v(0, 6, -30), eye: 3, bounds: [-17.2, 17.2, ZC - L / 2 - 1, 12], style: 'steel' };
  },
};

/* ---------------- 21 GOVERNORS ISLAND HILLS ---------------- */
export function hill(x: number, z: number) {
  return 9 * Math.exp(-((z + 34) ** 2) / 320 - (x * x) / 300) + 2.2 * Math.exp(-((z + 8) ** 2) / 160 - (x * x) / 400) + 1.4 * Math.exp(-((x - 22) ** 2) / 200 - ((z + 20) ** 2) / 300);
}
export const governors: RoomDef = {
  id: 'governors',
  name: 'The harbor observatory',
  area: 'GOVERNORS ISLAND HILLS',
  mood: 'A rising horizon',
  color: '#a7c496',
  description: 'A winding path climbing the Hills to an overlook, works set into the slope like wind screens, the harbor all around.',
  signatures: 'Sculpted grass hills with a switchback gravel path, granite scramble blocks, the long slide, Liberty and the lower Manhattan skyline across the water.',
  build(k, ctx) {
    k.sky({ top: 0x6c9dd0, horizon: 0xe4ecec, ground: 0x4e6e5a, fog: 0.0022, sun: { az: 1.4, el: 0.5, color: 0xfff4de, size: 14 }, haze: 0.2, env: 0.9 });
    k.hemi(0xeaf3ff, 0x3a5a3a, 0.9);
    k.sun(0xfff2da, 2.4, 40, 50, 30, true, 80);
    const lawn = k.pbr('lawnG', X.grass(0x4c7a3a, 6), 0.18),
      gravel = k.pbr('gravel', X.cobble(0xa8a08c, 7), 1.2, { roughness: 0.95 }),
      granite = k.pbr('scramble', X.ashlar(0x8a8a86, 12, 2), 0.35),
      steel = k.flat(0xb9bec4, 0.8, 0.35),
      timber = k.pbr('benchGI', X.planks(0x8a6a48, 3, 20), 1.2),
      dark = k.flat(0x2a2c30, 0.5, 0.5);
    // the terrain
    const g = new T.PlaneGeometry(140, 150, 110, 110);
    g.rotateX(-PI / 2);
    const pa = g.attributes.position;
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i) - 24; pa.setXYZ(i, x, hill(x, z) - 0.1, z); }
    g.computeVertexNormals();
    k.mesh(g, lawn);
    k.water({ y: -1.4, color: 0x2f5468, w: 600, d: 600, z: -60, amp: 1.2 });
    // the path
    const path = Array.from({ length: 221 }, (_, i) => { const u = i / 220, z = 10 - u * 58, x = Math.sin(u * PI * 2.2) * 6.5 * (1 - u * 0.3); return v(x, hill(x, z) + 2.4, z); });
    const pg: number[] = [], ix: number[] = [];
    for (let i = 0; i < path.length; i++) { const p = path[i]; for (const s of [-1, 1]) pg.push(p.x + s * 1.7, hill(p.x + s * 1.7, p.z) + 0.03, p.z); if (i < path.length - 1) { const n = i * 2; ix.push(n, n + 1, n + 2, n + 1, n + 3, n + 2); } }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pg, 3));
    geo.setIndex(ix);
    geo.computeVertexNormals();
    k.mesh(geo, gravel);
    // granite scramble, benches, trees, the slide
    const rnd = X.mulberry(21);
    for (let i = 0; i < 40; i++) { const x = (rnd() - 0.5) * 60, z = -10 - rnd() * 44; if (Math.abs(x - Math.sin(((10 - z) / 58) * PI * 2.2) * 6.5) < 3.5) continue; const s = 0.6 + rnd() * 1.2; k.box(s * 1.6, s, s * 1.2, x, hill(x, z) + s * 0.35, z, granite).rotation.y = rnd() * PI; }
    for (let i = 0; i < 34; i++) { const x = (rnd() - 0.5) * 100, z = -rnd() * 70 + 6; if (Math.abs(x) < 9 && z > -60) continue; k.tree(x, hill(x, z) - 0.1, z, { kind: rnd() > 0.5 ? 'round' : 'column', h: 3 + rnd() * 3, r: 1.4 + rnd() * 1.4, leaf: 0x3f6f38, seed: i }); }
    for (const i of [30, 90, 150]) { const p = path[i]; k.bench(p.x + 2.6, p.z, PI / 2, timber, dark, 2.2); k.bench(p.x + 2.6, p.z, PI / 2, timber, dark, 2.2).position.y = hill(p.x + 2.6, p.z); }
    /* Slide Hill has four slides built into its slope, the longest 57 feet */
    let slide: T.Vector3[] = [];
    for (const [dz, len] of [[0, 16], [2.4, 12], [4.8, 9], [-2.4, 7]]) {
      const sl: T.Vector3[] = [];
      for (let i = 0; i <= 30; i++) { const u = i / 30, x = 12 + u * len, z = -34 + dz + Math.sin(u * PI) * 6 * (len / 16) - u * 10 * (len / 16); sl.push(v(x, hill(x, z) + 0.5 + (1 - u) * 0.6, z)); }
      k.curve(sl, 0.55, steel, 40);
      for (let i = 0; i <= 30; i += 5) { const p = sl[i]; k.beam(v(p.x, hill(p.x, p.z), p.z), v(p.x, p.y, p.z), 0.1, dark, 6); }
      if (dz === 0) slide = sl;
    }
    /* Discovery Hill carries Rachel Whiteread's Cabin: a concrete cast of the inside of a wooden shed */
    const cabX = 22, cabZ = -20, cabY = hill(cabX, cabZ);
    const cabin = k.box(3.2, 2.6, 4.2, cabX, cabY + 1.3, cabZ, k.pbr('whitereadConcrete', X.concrete(0xa8a59c, 23), 0.4));
    k.keepOut.push({ x: cabX, z: cabZ, r: 2.8 });
    // the overlook at the summit: a granite platform and rail, with works as wind screens
    const top = path[195];
    const ty = hill(top.x, top.z);
    k.mesh(new T.CylinderGeometry(7, 7.6, 0.6, 32), granite, top.x, ty + 0.05, top.z);
    for (let j = 0; j < 32; j++) { const a = (j * PI) / 16; if (Math.abs(a - PI / 2) < 0.5) continue; k.box(0.06, 1.1, 0.06, top.x + Math.cos(a) * 6.6, ty + 0.9, top.z + Math.sin(a) * 6.6, steel); }
    k.torus(6.6, 0.05, top.x, ty + 1.45, top.z, steel, 48).rotation.x = PI / 2;
    for (const [x, z] of [[top.x + 3, top.z - 3], [top.x - 3, top.z + 3]]) { k.plinth(x, z, 1.2, 0.8, 1.2, granite); k.objects[k.objects.length - 2].position.y = ty + 0.4; k.objects[k.objects.length - 1].position.y = ty + 0.84; }
    k.prop('bell', top.x + 3, ty + 0.9, top.z - 3, { height: 0.9 });
    k.prop('buoy', top.x - 3, ty + 0.9, top.z + 3, { height: 1.4 });
    // the dock at the start, with the census on the ferry shed
    k.box(30, 1.2, 12, 0, -0.6, 18, k.pbr('dockG', X.planks(0x6a5a45, 6, 21), 0.5));
    k.box(18, 6, 1, 0, 3, 23.5, k.pbr('shedG', X.steel(0x60686e, false, 22), 0.8, { metalness: 0.5, roughness: 0.5 }));
    k.censusWall({ x: 0, y: 3.0, z: 22.95, rotY: PI, cols: 22, rows: 4, tile: 0.6, gap: 0.05, start: ctx.wallStart(200, 88), pieces: ctx.all, backing: dark });
    k.sign('GOVERNORS ISLAND  ·  THE HILLS', 7, 0.6, 0, 5.5, 22.9, '#2f4a3a', '#f0f4e8', 80, PI, { border: true });
    k.prop('life_ring', -9.05, 1.4, 20, { height: 0.9, rotY: PI / 2 });
    k.prop('cleat', 8, 0, 14, { height: 0.5 });
    k.prop('lamppost', -6, 0, 14, { height: 6, keepOut: 0.5 });
    // the harbour: Liberty to the west, lower Manhattan ahead, Brooklyn to the east
    liberty(k, -90, -1.5, -60, 1.4);
    k.box(60, 4, 40, -90, -1.5, -62, k.pbr('libIsland', X.ashlar(0x6f7566, 4, 3), 0.1));
    k.skyline({ z: -190, count: 34, spacing: 6.5, scale: 1.9, base: -1.5, seed: 44, lit: 0.22, glow: 0.5, tint: 0x6e7684 });
    k.skyline({ z: -215, count: 30, spacing: 9, scale: 3, base: -1.5, seed: 45, lit: 0.15, glow: 0.4, tint: 0x7d8490, rows: 1 });
    k.skyline({ z: -90, count: 16, spacing: 7, scale: 1.4, base: -1.5, seed: 46, lit: 0.2, glow: 0.4, tint: 0x6b5f57, x: 110, rows: 1 });
    for (const [x, z] of [[-40, -110], [60, -95], [-20, -140]]) k.prop('buoy', x, -1.2, z, { height: 2.4 });
    // the works along the climb and around the overlook
    const mounts: Mount[] = [];
    for (let i = 0; i < 16; i++) {
      const p = path[10 + i * 11], s = i % 2 ? 1 : -1, x = p.x + s * 3.6, y = hill(x, p.z);
      k.box(0.3, 3.6, 5.4, x, y + 1.8, p.z, granite);
      k.box(0.8, 0.2, 5.8, x, y + 0.1, p.z, granite);
      mounts.push({ position: v(x - s * 0.2, y + 2.6, p.z), rotation: s < 0 ? PI / 2 : -PI / 2, target: p.clone(), width: 4.4, height: 2.6, style: 'steel', wash: false });
    }
    for (let j = 0; j < 4; j++) {
      const a = PI * 0.9 + (j / 3) * PI * 1.2, x = top.x + Math.cos(a) * 6.4, z = top.z + Math.sin(a) * 6.4;
      k.box(0.3, 3.4, 4.6, 0, 0, 0, granite).position.set(x, ty + 1.7, z);
      k.objects[k.objects.length - 1].rotation.y = -a - PI / 2;
      mounts.push({ position: v(x - Math.cos(a) * 0.25, ty + 2.4, z - Math.sin(a) * 0.25), rotation: -a - PI / 2, target: v(top.x, ty + 2.4, top.z), width: 4.0, height: 2.4, style: 'steel', wash: false });
    }
    // easter eggs: the summit, the old seawall, the slides, the cabin, the made land, the first flight over the water
    const W = { name: 'Governors Island, Wikipedia', url: 'https://en.wikipedia.org/wiki/Governors_Island' };
    const BDC = { name: 'The Hills of Governors Island reach completion one year ahead of schedule, BD+C', url: 'https://www.bdcnetwork.com/building-sector-reports/sports-and-recreational-facilities/news/55160345/the-hills-of-governors-island-reach-completion-one-year-ahead-of-schedule' };
    const ML = { name: 'New Hills to see New York, Metalocus', url: 'https://metalocus.es/en/news/new-hills-see-new-york-completed-governors-island-hills-west8' };
    k.egg(v(top.x, ty + 2.2, top.z), { id: 'governors-outlook-hill', title: 'Seventy feet of made hill', year: '2016', text: 'The Hills opened in July 2016, a year ahead of schedule. There are four: Grassy Hill at 26 feet, Slide Hill at 36, Discovery Hill at 39 and Outlook Hill, the tallest, at 70 feet. The gaps between them were shaped to hide and then reveal the harbour views.', clue: 'Climb to the round granite overlook at the summit.', source: ML }, { r: 2.0 });
    { const sp = path[120]; k.egg(v(sp.x - 4.5, hill(sp.x - 4.5, sp.z) + 1.2, sp.z), { id: 'governors-scramble', title: 'Climbing the old seawall', year: '1905', text: 'The Scramble on Outlook Hill is built from granite blocks of the seawall the Army set in the harbour when it expanded the island in 1905.', clue: 'Look for the rough granite blocks scattered on the slope beside the path.', source: BDC }, { r: 2.0 }); }
    k.egg(slide[3], { id: 'governors-slides', title: 'The longest slide in the city', text: 'Slide Hill has four slides built into its slope. The longest runs 57 feet, the longest slide in New York City.', clue: 'Find the steel chutes running down the east flank.', source: BDC }, { r: 1.8 });
    k.egg(cabin, { id: 'governors-cabin', title: 'A shed turned inside out', text: 'On Discovery Hill sits Cabin by the British artist Rachel Whiteread: a concrete cast of the inside of a wooden, New England style shed. Bronze casts of discarded objects lie scattered around it in the grass.', clue: 'Look for the grey concrete hut on the hill to the east.', source: ML }, { r: 2.4 });
    k.egg(v(path[2].x + 2.5, hill(path[2].x + 2.5, path[2].z) + 0.8, path[2].z), { id: 'governors-made-land', title: 'Standing on fill', text: 'About 103 of the island\'s 172 acres are fill, added in the early 1900s to the south of the original island. The Hills stand on that made land, at its southern tip.', clue: 'Look at the ground at the foot of the path, where the climb begins.', source: W }, { r: 1.8 });
    k.egg(v(-14, 1.2, 14), { id: 'governors-wright-flight', title: 'Over the water', year: '1909', text: 'In October 1909 Wilbur Wright took off from Governors Island, flew over the west side of Manhattan and came back to the island.', clue: 'Stand at the edge of the dock and look across the harbour toward Manhattan.', source: W }, { r: 2.0 });
    return { mounts, spawn: path[0].clone(), look: path[8].clone(), eye: 2.4, bounds: [-60, 60, -70, 22], path, style: 'steel' };
  },
};
