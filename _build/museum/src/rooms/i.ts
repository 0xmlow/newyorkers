/* Rooms 37 to 41: the Vessel, Little Island, the Cathedral, Queensboro Plaza, a Bushwick rooftop. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Kit, Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront } from './f';
import { hero } from './heroes';

const PI = Math.PI;

/* ---------------- 37 THE VESSEL ---------------- */
export const vessel: RoomDef = {
  id: 'vessel',
  name: 'The climb',
  area: 'HUDSON YARDS',
  mood: 'Copper noon',
  color: '#c98a5a',
  description: 'A vase of interlocking staircases in copper steel, climbed one landing at a time, the works on every parapet, the towers all around.',
  signatures: 'The widening honeycomb of landings and flights, the copper coloured cladding, the plaza and its glass towers, the river and the rail yards below.',
  build(k, ctx) {
    k.sky({ top: 0x6fa0d6, horizon: 0xe6ebee, ground: 0x6a6a66, fog: 0.0022, sun: { az: 3.0, el: 1.05, color: 0xfff6e8, size: 12 }, env: 1.0 });
    k.hemi(0xf2f6ff, 0x4a4a48, 0.95);
    k.sun(0xfff4e8, 2.6, 30, 80, -20, true, 90);
    const copper = k.pbr('vesselCopper', X.steel(0xa8623a, false, 61), 0.5, { metalness: 0.9, roughness: 0.32 }),
      copperD = k.pbr('vesselCopperD', X.steel(0x7a4428, false, 62), 0.5, { metalness: 0.9, roughness: 0.4 }),
      tread = k.pbr('vesselTread', X.steel(0x6a6c70, true, 63), 0.9, { metalness: 0.7, roughness: 0.5 }),
      plaza = k.pbr('yardsPlaza', X.pavers(0x9a9a94, 23), 0.3),
      glassT = k.pbr('yardsGlass', X.windows(64, 0.18, 0x7a98ad, false), 0.11, { emissive: 0xffffff, emissiveIntensity: 0.4, roughness: 0.2, metalness: 0.6, stretch: 0.42 }),
      glass = k.glass(0xdcecf6, 0.12, 0.04),
      green = k.flat(0x4a7a3c, 0, 0.9);
    // the plaza, the towers, the yards and the river
    k.box(200, 0.4, 200, 0, -0.2, 0, plaza);
    for (const [x, z, w, h] of [[-70, -40, 34, 160], [70, -50, 30, 130], [-60, 70, 28, 110], [80, 60, 40, 200], [0, -110, 44, 180]]) k.box(w as number, h as number, w as number, x as number, (h as number) / 2, z as number, glassT);
    k.box(400, 0.3, 120, 0, -8, 200, k.pbr('yardsRail', X.steel(0x4a4c50, true, 65), 0.3));
    k.water({ y: -4, color: 0x2e4a5c, w: 400, d: 300, x: -260, z: 0, amp: 1.0 });
    for (let i = 0; i < 14; i++) k.tree(-30 + (i % 7) * 10, 0, 40 + Math.floor(i / 7) * 12, { kind: 'column', h: 5, r: 1.8, leaf: 0x4a7a3c, seed: i });
    k.box(40, 0.6, 12, 0, 0.3, 46, green);
    k.skyline({ z: 180, count: 30, spacing: 8, scale: 2.6, base: -2, seed: 103, lit: 0.15, glow: 0.35, tint: 0x6e7684, rows: 1 });
    // the vessel: sixteen levels of landings, each level wider, flights between them
    const LEVELS = 16, STEP = 3.1, path: T.Vector3[] = [];
    const rad = (L: number) => 7 + 15 * Math.pow(L / (LEVELS - 1), 1.35);
    const count = (L: number) => 6 + Math.floor(L / 2) * 2;
    const landings: T.Vector3[][] = [];
    for (let L = 0; L < LEVELS; L++) {
      const r = rad(L), n = count(L), y = L * STEP, ring: T.Vector3[] = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * PI * 2 + (L % 2) * (PI / n);
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        ring.push(v(x, y, z));
        const plat = k.mesh(new T.CylinderGeometry(2.2, 2.2, 0.3, 6), tread, x, y, z);
        plat.rotation.y = a;
        const rim = k.mesh(new T.CylinderGeometry(2.4, 2.4, 1.1, 6, 1, true), copper, x, y + 0.6, z);
        rim.rotation.y = a;
        const under = k.mesh(new T.CylinderGeometry(2.4, 1.2, 1.6, 6), copperD, x, y - 0.95, z);
        under.rotation.y = a;
        if (L > 0) {
          const below = landings[L - 1];
          let best = below[0], bd = Infinity;
          for (const b of below) { const d = b.distanceToSquared(v(x, y, z)); if (d < bd) { bd = d; best = b; } }
          const dir = v(x, y, z).sub(best);
          const len = dir.length();
          const flight = k.mesh(new T.BoxGeometry(1.6, 0.3, len - 3.6), tread, 0, 0, 0);
          flight.position.copy(best).add(dir.clone().multiplyScalar(0.5));
          flight.lookAt(v(x, y, z));
          const railL = k.mesh(new T.BoxGeometry(0.06, 1.0, len - 3.6), copper, 0, 0, 0);
          railL.position.copy(flight.position).add(v(0, 0.6, 0));
          railL.lookAt(v(x, y + 0.6, z));
          railL.translateX(0.85);
          const railR = k.mesh(new T.BoxGeometry(0.06, 1.0, len - 3.6), copper, 0, 0, 0);
          railR.position.copy(flight.position).add(v(0, 0.6, 0));
          railR.lookAt(v(x, y + 0.6, z));
          railR.translateX(-0.85);
        }
      }
      landings.push(ring);
    }
    // the guided climb: from landing to landing, spiralling up
    let cur = landings[0][0];
    path.push(cur.clone().add(v(0, 0, 0)));
    for (let L = 1; L < LEVELS; L++) {
      const ring = landings[L];
      let best = ring[0], bd = Infinity;
      const want = Math.atan2(cur.z, cur.x) + 0.45;
      for (const b of ring) { const d = Math.abs(Math.atan2(Math.sin(Math.atan2(b.z, b.x) - want), Math.cos(Math.atan2(b.z, b.x) - want))); if (d < bd) { bd = d; best = b; } }
      const steps = 10;
      for (let s = 1; s <= steps; s++) path.push(cur.clone().lerp(best, s / steps));
      cur = best;
    }
    const top = LEVELS * STEP;
    /* easter eggs, on landings along the guided climb */
    const WV = { name: 'Vessel (structure), Wikipedia', url: 'https://en.wikipedia.org/wiki/Vessel_(structure)' };
    const at = (L: number) => path[Math.min(path.length - 1, L * 10)].clone().add(v(0, 1.3, 0));
    k.egg(v(0, 1.6, 9.5), { id: 'vessel-numbers', title: '2,500 steps', year: '2019', text: 'Vessel is 16 storeys and 150 feet of connected staircases: 154 flights, about 2,500 steps and 80 landings, clad in copper coloured steel. It is 50 feet wide at the base and 150 feet wide at the top, holds 1,000 people at a time, and opened on March 15, 2019.', clue: 'Stand at the foot of the stairs and look straight up.', source: WV }, { r: 1.6 });
    k.egg(at(3), { id: 'vessel-stepwells', title: 'Stepwells and a stair in a skip', text: 'The steps are modelled on Indian stepwells. Thomas Heatherwick also traced the design to his childhood, when he fell in love with an old discarded flight of wooden stairs.', clue: 'Pause on a landing three flights up.', source: WV }, { r: 1.6 });
    k.egg(at(6), { id: 'vessel-monfalcone', title: 'Made in Italy, by sea', year: '2017', text: 'The structure came in 75 pieces, assembled in Monfalcone, Italy, shipped by sea and offloaded on the Hudson River. The first 10 pieces went up in April 2017, the other 65 arrived in five batches, and it topped out that December.', clue: 'Halfway up, look out toward the river it came in on.', source: WV }, { r: 1.6 });
    k.egg(at(9), { id: 'vessel-name', title: 'A placeholder name', text: 'Vessel was meant to be only a temporary name during construction, with a permanent one to come later; before that the Hudson Yards website called it the Hudson Yards Staircase. After it opened, the developer asked the public to suggest a name.', clue: 'Keep climbing; look for the glint about nine landings up.', source: WV }, { r: 1.6 });
    k.egg(at(12), { id: 'vessel-photos', title: 'Who owns your photo', text: 'When it opened, Hudson Yards claimed to own any photo visitors took of Vessel. After the criticism that followed, it quickly stopped claiming to own other people\'s pictures.', clue: 'High on the climb, stop and take a picture of the void.', source: WV }, { r: 1.6 });
    k.egg(at(15), { id: 'vessel-shawarma', title: 'The giant shawarma', text: 'Commentators nicknamed it the Giant Shawarma; Fortune called it Manhattan\'s answer to the Eiffel Tower. Its projected cost rose from $75 million to an estimated $150 to $200 million, which Heatherwick put down to the complexity of the steel pieces.', clue: 'Climb all the way to the top landing.', source: WV }, { r: 1.6 });
    k.mesh(new T.CylinderGeometry(rad(LEVELS - 1) + 2.2, rad(LEVELS - 1) + 2.2, 0.8, 48, 1, true), copper, 0, top - STEP + 1.4, 0);
    k.mesh(new T.CylinderGeometry(7.2, 7.2, 0.6, 32), tread, 0, -0.3, 0);
    k.mesh(new T.CylinderGeometry(6.4, 6.4, 0.3, 32), glass, 0, top - STEP + 0.6, 0);
    for (let L = 0; L < LEVELS; L += 3) k.point(0, L * STEP + 2, 0, 0xfff0e0, 20, 26);
    // the works: one on the inner parapet of a landing on every other level, facing the void
    const mounts: Mount[] = [];
    for (let L = 1; L < LEVELS; L++) {
      const ring = landings[L];
      const pick = L % 2 ? ring[Math.floor(ring.length / 3)] : ring[Math.floor(ring.length * 0.7)];
      const a = Math.atan2(pick.z, pick.x);
      const px = pick.x - Math.cos(a) * 2.3, pz = pick.z - Math.sin(a) * 2.3;
      mounts.push({ position: v(px, pick.y + 1.4, pz), rotation: -a + PI / 2, target: v(pick.x + Math.cos(a) * 0.8, pick.y + 2.1, pick.z + Math.sin(a) * 0.8), width: 2.6, height: 1.5, style: 'steel', wash: false, lookAt: v(px, pick.y + 1.4, pz) });
      if (L % 3 === 0) {
        const other = ring[(Math.floor(ring.length / 3) + Math.floor(ring.length / 2)) % ring.length];
        const b = Math.atan2(other.z, other.x);
        mounts.push({ position: v(other.x - Math.cos(b) * 2.3, other.y + 1.4, other.z - Math.sin(b) * 2.3), rotation: -b + PI / 2, target: v(other.x + Math.cos(b) * 0.8, other.y + 2.1, other.z + Math.sin(b) * 0.8), width: 2.6, height: 1.5, style: 'steel', wash: false });
      }
    }
    for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2; const x = Math.cos(a) * 30, z = Math.sin(a) * 30; k.box(0.4, 4.2, 5.4, 0, 0, 0, copper).position.set(x, 2.1, z); k.objects[k.objects.length - 1].rotation.y = -a - PI / 2; mounts.push({ position: v(x - Math.cos(a) * 0.25, 2.6, z - Math.sin(a) * 0.25), rotation: -a - PI / 2, target: v(Math.cos(a) * 25, 3, Math.sin(a) * 25), width: 4.6, height: 2.7, style: 'steel', wash: false }); }
    k.censusWall({ x: 0, y: 2.6, z: 44, rotY: PI, cols: 26, rows: 3, tile: 0.6, gap: 0.05, start: ctx.wallStart(5000, 78), pieces: ctx.all, backing: copperD });
    const climb = [v(0, 2.1, 30), v(0, 2.1, 18), v(0, 2.1, 9), ...path.map((p) => p.clone().add(v(0, 2.1, 0)))];
    return { mounts, spawn: climb[0].clone(), look: v(0, 22, 0), eye: 2.1, bounds: [-40, 40, -40, 48], path: climb, style: 'steel' };
  },
};

/* ---------------- 38 LITTLE ISLAND ---------------- */
export const littleisland: RoomDef = {
  id: 'littleisland',
  name: 'The tulips',
  area: 'LITTLE ISLAND',
  mood: 'Golden hour on the river',
  color: '#a8c4a0',
  description: 'A park held over the Hudson on concrete tulips, rolling lawns and an amphitheatre facing the water, the works set into the slopes.',
  signatures: 'The field of pot shaped concrete piles of varying height, the undulating planted topography, the amphitheatre bowl toward the river, the bridges from the esplanade.',
  build(k, ctx) {
    k.sky({ top: 0x6c8fc4, horizon: 0xf2c08c, ground: 0x4a5040, fog: 0.0024, sun: { az: 4.75, el: 0.14, color: 0xffb870, size: 24 }, haze: 0.4, env: 0.9 });
    k.hemi(0xffe4c8, 0x3a4a34, 0.8);
    k.sun(0xffc890, 2.4, -80, 24, 0, true, 100);
    const conc = k.pbr('tulipConc', X.concrete(0xb9b6ad, 24), 0.25, { roughness: 0.8 }),
      lawn = k.pbr('islandLawn', X.grass(0x4a7a38, 25), 0.15),
      gravel = k.pbr('islandPath', X.cobble(0xa39a86, 26), 1.1),
      timber = k.pbr('amphTimber', X.planks(0x8a6a48, 4, 66), 0.9),
      glass = k.glass(0xdcecf6, 0.12, 0.04),
      steel = k.flat(0x9aa4ae, 0.85, 0.3),
      iron = k.flat(0x1f242a, 0.7, 0.45);
    const field = (x: number, z: number) => 4 + 5 * Math.exp(-((x + 18) ** 2 + (z + 22) ** 2) / 500) + 7 * Math.exp(-((x - 20) ** 2 + (z + 40) ** 2) / 700) + 2.5 * Math.sin(x * 0.12) * Math.cos(z * 0.1) - 4 * Math.exp(-((x - 6) ** 2 + (z + 46) ** 2) / 260);
    // the river and the esplanade
    k.water({ y: -0.6, color: 0x2e4e62, w: 500, d: 400, z: -60, amp: 1.2 });
    k.box(160, 1.0, 20, 0, 0.4, 24, k.pbr('esplanade', X.pavers(0x8e8b84, 27), 0.4));
    k.rail(0, 14.2, 160, iron, 1.1, 'x', 1.6);
    street(k, { w: 20, len: 160, z: 44, x: 0 });
    blockFront(k, { x: 30, z0: 100, count: 8, face: -1, seed: 71, h: [16, 30] });
    blockFront(k, { x: -30, z0: 100, count: 8, face: 1, seed: 72, h: [16, 30] });
    k.skyline({ z: 200, count: 30, spacing: 9, scale: 2.8, base: -2, seed: 104, lit: 0.2, glow: 0.4, tint: 0x6e7684 });
    // the tulips: a grid of piles under the island, each rising to the surface it carries
    const tulips: T.Matrix4[] = [];
    for (let x = -40; x <= 40; x += 7) for (let z = -66; z <= -4; z += 7) {
      if ((x / 44) ** 2 + ((z + 35) / 36) ** 2 > 1) continue;
      const h = field(x, z);
      tulips.push(new T.Matrix4().compose(v(x, h - 1.2, z), new T.Quaternion(), v(1, h + 2, 1)));
    }
    const tulip = new T.LatheGeometry([new T.Vector2(1.4, -1), new T.Vector2(1.0, 0), new T.Vector2(0.9, 0.5), new T.Vector2(1.6, 0.85), new T.Vector2(3.4, 1.0)].map((p) => p), 10);
    k.instances(tulip, conc, tulips);
    // the island surface: a heightfield clipped to an ellipse
    const g = new T.PlaneGeometry(96, 80, 96, 80);
    g.rotateX(-PI / 2);
    const pa = g.attributes.position;
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i) - 35; const e = (x / 46) ** 2 + ((z + 35) / 38) ** 2; pa.setXYZ(i, x, e < 1 ? field(x, z) : field(x, z) - 30 * (e - 1), z); }
    g.computeVertexNormals();
    k.mesh(g, lawn);
    // the amphitheatre: stepped timber seating facing the river, a stage at the water
    const AX = 6, AZ = -46;
    for (let i = 0; i < 9; i++) { const r = 6 + i * 2; const ring = k.mesh(new T.RingGeometry(r, r + 1.6, 48, 1, PI * 1.1, PI * 0.8), timber, AX, field(AX, AZ) - 3.2 + i * 0.7, AZ); ring.rotation.x = -PI / 2; }
    k.mesh(new T.CylinderGeometry(6, 6, 0.4, 32), timber, AX, field(AX, AZ) - 3.4, AZ);
    k.box(14, 6, 0.6, AX, field(AX, AZ) - 0.4, AZ - 6.4, conc);
    k.keepOut.push({ x: AX, z: AZ, r: 6.5 });
    // paths, railings, trees, the overlook rail at the highest point
    for (const [x0, z0, x1, z1] of [[0, 12, -18, -22], [-18, -22, 20, -40], [20, -40, 6, -52], [0, 12, 26, -20]]) {
      const n = 14;
      for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; k.box(2.6, 0.2, 3.2, x, field(x, z) + 0.05, z, gravel).rotation.y = Math.atan2(x1 - x0, z1 - z0); }
    }
    const rnd = X.mulberry(38);
    for (let i = 0; i < 34; i++) { const x = (rnd() - 0.5) * 80, z = -8 - rnd() * 56; if ((x / 42) ** 2 + ((z + 35) / 34) ** 2 > 1) continue; if (Math.hypot(x - AX, z - AZ) < 14) continue; k.tree(x, field(x, z) - 0.2, z, { kind: rnd() > 0.4 ? 'round' : 'column', h: 3 + rnd() * 3, r: 1.6 + rnd() * 1.6, leaf: 0x4a7a3c, seed: i }); }
    for (let i = 0; i < 24; i++) { const a = (i / 24) * PI * 2, x = Math.cos(a) * 43, z = -35 + Math.sin(a) * 35; k.box(0.06, 1.1, 0.06, x, field(x, z) + 0.55, z, steel); }
    const ox = 20, oz = -40;
    k.mesh(new T.CylinderGeometry(6, 6.4, 0.3, 24), gravel, ox, field(ox, oz) + 0.1, oz);
    for (let i = 0; i < 24; i++) { const a = (i / 24) * PI * 2; k.box(0.06, 1.1, 0.06, ox + Math.cos(a) * 5.8, field(ox, oz) + 0.7, oz + Math.sin(a) * 5.8, steel); }
    k.torus(5.8, 0.04, ox, field(ox, oz) + 1.25, oz, steel, 48).rotation.x = PI / 2;
    for (const [x, z] of [[-18, -22], [ox, oz]]) { k.prop('lantern', x + 2, field(x + 2, z) , z, { height: 0.9 }); }
    k.prop('buoy', -50, -0.4, -20, { height: 2.2 });
    k.prop('life_ring', 8, 1.6, 14.15, { height: 0.9, rotY: 0 });
    // the two bridges from the esplanade onto the island
    for (const x of [-14, 12]) { k.box(4, 0.4, 12, x, 2.4 + field(x, 0) / 2 - 1, 8, timber).rotation.x = -Math.atan2(field(x, 0) - 0.9, 12); k.rail(x - 1.9, 8, 12, steel, 1.0, 'z', 1.5); k.rail(x + 1.9, 8, 12, steel, 1.0, 'z', 1.5); }
    k.censusWall({ x: 0, y: 3.0, z: 15.4, rotY: 0, cols: 26, rows: 3, tile: 0.6, gap: 0.05, start: ctx.wallStart(6000, 78), pieces: ctx.all, backing: iron });
    // the works: glass panels along the paths, the amphitheatre's backdrop, the overlook ring
    const mounts: Mount[] = [];
    for (const [x0, z0, x1, z1, n] of [[0, 12, -18, -22, 4], [-18, -22, 20, -40, 5], [0, 12, 26, -20, 4]] as const) {
      const ang = Math.atan2(x1 - x0, z1 - z0);
      for (let i = 1; i <= n; i++) { const t = i / (n + 1), x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; const px = x + Math.cos(ang) * 2.4, pz = z - Math.sin(ang) * 2.4; const y = field(px, pz); k.box(0.16, 3.2, 4.4, 0, 0, 0, glass).position.set(px, y + 1.8, pz); k.objects[k.objects.length - 1].rotation.y = ang; mounts.push({ position: v(px - Math.cos(ang) * 0.12, y + 2.2, pz + Math.sin(ang) * 0.12), rotation: ang + PI / 2, target: v(x, field(x, z) + 3, z), width: 3.6, height: 2.1, style: 'steel', wash: false }); }
    }
    for (const dx of [-4.5, 0, 4.5]) mounts.push({ position: v(AX + dx, field(AX, AZ) - 0.2, AZ - 6.05), rotation: 0, target: v(AX + dx * 0.5, field(AX, AZ) + 1.4, AZ + 2), width: 4.2, height: 2.5, style: 'steel', wash: false });
    for (let i = 0; i < 4; i++) { const a = PI * 0.75 + (i / 3) * PI * 0.5; const x = ox + Math.cos(a) * 5.6, z = oz + Math.sin(a) * 5.6; mounts.push({ position: v(x, field(ox, oz) + 2.2, z), rotation: -a + PI / 2, target: v(ox, field(ox, oz) + 3, oz), width: 2.8, height: 1.7, style: 'steel', wash: false }); }
    return { mounts, spawn: v(-14, 3, 21), look: v(-6, 9, -34), eye: 3, bounds: [-42, 42, -66, 22], style: 'steel', floorY: (x, z) => { const e = (x / 46) ** 2 + ((z + 35) / 38) ** 2; if (z > 12) return 0.9 - 0.9; if (e < 1) return field(x, z) - 0.15; return 0; } };
  },
};

/* ---------------- 39 THE CATHEDRAL ---------------- */
export const cathedral: RoomDef = {
  id: 'cathedral',
  name: 'The unfinished nave',
  area: 'ST. JOHN THE DIVINE',
  mood: 'Candlelight',
  color: '#b8a8c8',
  description: 'Amsterdam Avenue, the great west front, then a nave the length of two blocks under a rose window, chapels in the apse, candles everywhere.',
  signatures: 'The unfinished gothic west front with its portal and rose window, a nave of pointed arcades and clerestory, the ribbed vault, the seven chapels of the apse, the great organ.',
  build(k, ctx) {
    k.sky({ top: 0x2a3454, horizon: 0x8a8ca8, ground: 0x2a2a30, fog: 0.004, sun: { az: 4.6, el: 0.12, color: 0xffc090, size: 16 }, stars: 200, env: 0.6 });
    k.hemi(0xd8d0e8, 0x2a2430, 0.55);
    k.sun(0xffd8b0, 1.2, -50, 30, 30, true, 100);
    const stone = k.pbr('cathStone', X.ashlar(0xb9b0a0, 67, 3), 0.18),
      stoneD = k.pbr('cathStoneD', X.ashlar(0x8a8478, 68, 3), 0.18),
      floorS = k.pbr('cathFloor', X.pavers(0x8a8478, 28), 0.3, { roughness: 0.5 }),
      oak = k.pbr('choirOak', X.planks(0x4a3020, 4, 69), 1.2, { roughness: 0.5 }),
      pipe = k.flat(0xb8a878, 0.8, 0.35),
      glow = k.glow(0xffd8a0),
      flame = k.glow(0xffb060),
      pane = [k.glow(0x3a5ad8), k.glow(0xd83a3a), k.glow(0xd8b83a), k.glow(0x3ad87a), k.glow(0x8a3ad8)];
    // Amsterdam Avenue and the west front
    street(k, { w: 20, len: 120, z: 40, x: 0 });
    blockFront(k, { x: -40, z0: 80, count: 6, face: 1, seed: 73, h: [14, 20] });
    const FX = 0, FZ = 6, NW = 32, NL = 80, NH = 36;
    k.box(NW + 20, 44, 6, FX, 22, FZ + 3, stoneD);
    /* The two west towers were never finished, and the south one stands about 50 ft taller than the north. The front
       faces west onto Amsterdam Avenue, so south is +x here; the tall stump used to be on the north (-x) side. */
    k.box(12, 46, 10, FX - NW / 2 - 4, 23, FZ + 3, stoneD);
    k.box(12, 61, 10, FX + NW / 2 + 4, 30.5, FZ + 3, stoneD);
    k.arch(8, 16, 6.4, FX, 0, FZ + 3, stone, true, 0.9);
    for (let i = 0; i < 5; i++) k.arch(8 + i * 1.6, 16 + i * 1.4, 0.4, FX, 0, FZ + 6.2 + i * 0.4, stone, true, 0.62);
    k.block(FX - NW / 2 - 10, FX - 4.4, FZ, FZ + 6);
    k.block(FX + 4.4, FX + NW / 2 + 10, FZ, FZ + 6);
    for (let i = 0; i < 3; i++) k.box(NW + 30, 0.12, 1.2 + i * 1.2, FX, 0.3 - i * 0.12, FZ + 6.6 + i * 0.6, stone);
    // the rose window on the west front, glowing inward and outward
    const RY = 30, ZOUT = FZ + 6.04, ZIN = FZ - 0.04;
    for (const [zz, ry] of [[ZOUT, 0], [ZIN, PI]] as const) {
      k.mesh(new T.CircleGeometry(6.6, 48), stoneD, FX, RY, zz).rotation.y = ry;
      k.torus(6.4, 0.45, FX, RY, zz, stone, 48);
      for (let ring = 0; ring < 3; ring++) { const n = 8 + ring * 8, r = 1.6 + ring * 1.7; for (let i = 0; i < n; i++) { const a = (i / n) * PI * 2; k.mesh(new T.CircleGeometry(0.62 - ring * 0.08, 8), pane[(i + ring) % 5], FX + Math.cos(a) * r, RY + Math.sin(a) * r, zz + (ry ? -0.03 : 0.03)).rotation.y = ry; } }
      k.mesh(new T.CircleGeometry(0.9, 16), glow, FX, RY, zz + (ry ? -0.03 : 0.03)).rotation.y = ry;
    }
    k.point(FX, RY, FZ - 8, 0xbfa0ff, 60, 40);
    // the nave: arcades of pointed arches, clerestory, the ribbed vault, the floor
    k.box(NW + 20, 0.4, NL + 12, FX, -0.2, FZ - NL / 2, floorS);
    for (const s of [-1, 1]) {
      k.arcade(NL, 16, 1.6, 8, 5.2, 14, FX + s * NW / 2, 0, FZ - NL / 2, stone, PI / 2, true);
      k.box(1.6, 12, NL, FX + s * NW / 2, 22, FZ - NL / 2, stone);
      for (let i = 0; i < 8; i++) { const z = FZ - 5 - i * 10; k.box(0.08, 8, 3.2, FX + s * NW / 2, 24, z, pane[i % 5]); k.column(FX + s * (NW / 2 - 1.4), 0.1, z + 5, 15.6, 0.8, stone, true, stoneD); }
      k.box(0.6, 10, NL, FX + s * (NW / 2 + 10), 5, FZ - NL / 2, stone);
      k.box(10, 0.6, NL, FX + s * (NW / 2 + 5), 10, FZ - NL / 2, stoneD);
      k.block(FX + s * (NW / 2 + 10) - 0.4, FX + s * (NW / 2 + 10) + 0.4, FZ - NL, FZ);
    }
    for (let i = 0; i <= 8; i++) {
      const z = FZ - i * 10;
      const pts = Array.from({ length: 25 }, (_, j) => { const t = (j / 24) * PI; return v(FX + Math.cos(t) * NW / 2, NH - 8 + Math.sin(t) * 9 * (1 + 0.25 * Math.sin(t)), z); });
      k.curve(pts, 0.32, stoneD, 24);
      if (i < 8) { k.curve([v(FX - NW / 2, NH - 8, z), v(FX, NH + 1.5, z - 5), v(FX + NW / 2, NH - 8, z - 10)], 0.22, stoneD, 24); k.curve([v(FX + NW / 2, NH - 8, z), v(FX, NH + 1.5, z - 5), v(FX - NW / 2, NH - 8, z - 10)], 0.22, stoneD, 24); }
    }
    const vaultG = new T.BufferGeometry(), vp: number[] = [], vi: number[] = [];
    for (const z of [FZ + 2, FZ - NL - 2]) for (let j = 0; j <= 24; j++) { const t = (j / 24) * PI; vp.push(FX + Math.cos(t) * (NW / 2 + 0.6), NH - 8 + Math.sin(t) * 9.4 * (1 + 0.25 * Math.sin(t)), z); }
    for (let j = 0; j < 24; j++) vi.push(j, j + 25, j + 1, j + 1, j + 25, j + 26);
    vaultG.setAttribute('position', new T.Float32BufferAttribute(vp, 3));
    vaultG.setIndex(vi);
    vaultG.computeVertexNormals();
    k.mesh(vaultG, k.pbr('vaultStone', X.plaster(0xd8d0c0, 37), 0.2, { side: T.DoubleSide, roughness: 0.9 }));
    // the crossing and the apse of seven chapels, the choir and the organ
    const CZ = FZ - NL;
    /* The apse. It used to be a half cylinder on the -x side (thetaStart PI) with its seven chapel drums standing
       inside the east end of the nave (z > CZ) and a block over the space behind. The real east end is a choir ringed
       by eight granite columns about 54 ft tall, an ambulatory, and the seven Chapels of the Tongues radiating
       beyond it. So: the choir wall now sits on the east (-z) side and only above the ambulatory, the eight granite
       columns carry it, and the chapels open off an ambulatory whose outer wall lines up with the aisle walls. */
    const AR = NW / 2 + 11, granite = k.pbr('cathGranite', X.ashlar(0x6c6a6e, 81, 2), 0.3, { roughness: 0.45 });
    k.mesh(new T.CylinderGeometry(NW / 2 + 2, NW / 2 + 2, 16, 32, 1, true, PI / 2, PI), stone, FX, 22, CZ);
    k.mesh(new T.SphereGeometry(NW / 2 + 2, 32, 12, PI, PI, 0, PI / 2), k.pbr('vaultStone', X.plaster(0xd8d0c0, 37), 0.2, { side: T.DoubleSide, roughness: 0.9 }), FX, 30, CZ);
    k.mesh(new T.CylinderGeometry(AR, AR, 14, 40, 1, true, PI / 2, PI), stoneD, FX, 7, CZ);
    { const g = new T.RingGeometry(NW / 2 + 1.4, AR, 40, 1, PI, PI); g.rotateX(PI / 2); k.mesh(g, k.pbr('vaultStone', X.plaster(0xd8d0c0, 37), 0.2, { side: T.DoubleSide, roughness: 0.9 }), FX, 14, CZ); }
    for (let j = 0; j <= 7; j++) { const a = PI + (j / 7) * PI; k.column(FX + Math.cos(a) * (NW / 2 - 0.5), 0.1, CZ + Math.sin(a) * (NW / 2 - 0.5), 14, 0.85, granite, false, stone); k.keepOut.push({ x: FX + Math.cos(a) * (NW / 2 - 0.5), z: CZ + Math.sin(a) * (NW / 2 - 0.5), r: 1.2 }); }
    for (let i = 0; i < 7; i++) {
      const a = PI + ((i + 0.5) / 7) * PI, ca = Math.cos(a), sa = Math.sin(a);
      const cx = FX + ca * (NW / 2 + 6), cz = CZ + sa * (NW / 2 + 6), open = Math.atan2(-ca, -sa);
      k.mesh(new T.CylinderGeometry(4.4, 4.4, 12, 16, 1, true, open + 0.8, PI * 2 - 1.6), stone, cx, 6, cz);
      k.mesh(new T.SphereGeometry(4.4, 16, 8, 0, PI * 2, 0, PI / 2), stoneD, cx, 12, cz);
      k.arch(3.2, 8, 1.2, FX + ca * (NW / 2 + 1.6), 0, CZ + sa * (NW / 2 + 1.6), stone, true, 0.7).rotation.y = Math.atan2(ca, sa);
      k.point(cx, 5, cz, 0xffc890, 14, 8);
      for (let c = 0; c < 6; c++) { const fa = (c / 6) * PI * 2; k.cyl(0.05, 0.4, cx + Math.cos(fa) * 1.6, 1.1, cz + Math.sin(fa) * 1.6, k.flat(0xf4e8d0, 0, 0.6), 0.05, 6); k.sphere(0.07, cx + Math.cos(fa) * 1.6, 1.36, cz + Math.sin(fa) * 1.6, flame, 6); }
      k.keepOut.push({ x: cx, z: cz, r: 1.9 });
    }
    /* the square corners behind the round ambulatory wall */
    for (const s of [-1, 1]) k.keepOut.push({ x: FX + s * (NW / 2 + 9), z: CZ - AR + 2, r: 10.5 });
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { k.box(1.2, 2.2, 2.6, FX + s * 7, 1.1, CZ + 14 - i * 3, oak); k.box(1.2, 1.4, 2.6, FX + s * 7.6, 2.9, CZ + 14 - i * 3, oak); k.keepOut.push({ x: FX + s * 7, z: CZ + 14 - i * 3, r: 1.8 }); }
    for (const s of [-1, 1]) for (let i = 0; i < 14; i++) { const h = 4 + Math.abs(7 - i) * 0.6; k.cyl(0.32, h, FX + s * (NW / 2 - 4) + s * 0, 16 + h / 2, CZ + 8 + i * 0.9 - 6, pipe, 0.28, 10); }
    k.box(NW / 2, 1.2, 14, FX, 15.4, CZ + 8, oak);
    k.box(6, 1.2, 4, FX, 0.6, CZ + 2, stone);
    k.box(6.4, 0.2, 4.4, FX, 1.3, CZ + 2, k.flat(0xf4f0e8, 0, 0.8));
    for (let c = 0; c < 8; c++) { k.cyl(0.06, 0.9, FX - 2.4 + c * 0.7, 1.85, CZ + 0.4, k.flat(0xf4e8d0, 0, 0.6), 0.06, 6); k.sphere(0.08, FX - 2.4 + c * 0.7, 2.36, CZ + 0.4, flame, 6); }
    k.keepOut.push({ x: FX, z: CZ + 2, r: 4 });
    if (!ctx.reduced) { const flames: T.Object3D[] = []; k.scene.traverse((o) => { if (o instanceof T.Mesh && o.material === flame) flames.push(o); }); k.ticks.push((t) => flames.forEach((f, i) => { const s = 0.85 + 0.3 * Math.abs(Math.sin(t * 7 + i * 1.7)); f.scale.set(s, s * 1.4, s); })); }
    for (let i = 0; i < 8; i++) { const z = FZ - 5 - i * 10; k.point(FX, 14, z, 0xffd8a8, 30, 22); for (const s of [-1, 1]) { k.beam(v(FX + s * 8, NH - 6, z), v(FX + s * 8, 9, z), 0.03, oak, 4); k.torus(0.9, 0.05, FX + s * 8, 9, z, pipe, 20).rotation.x = PI / 2; for (let c = 0; c < 8; c++) { const a = (c / 8) * PI * 2; k.sphere(0.08, FX + s * 8 + Math.cos(a) * 0.9, 9.1, z + Math.sin(a) * 0.9, flame, 6); } } }
    for (let i = 0; i < 12; i++) for (const s of [-1, 1]) { k.box(5, 0.9, 0.4, FX + s * 6, 0.45, FZ - 14 - i * 4.5, oak); k.box(5, 0.08, 1.6, FX + s * 6, 0.9, FZ - 14 - i * 4.5 + 0.8, oak); k.block(FX + s * 6 - 2.5, FX + s * 6 + 2.5, FZ - 14 - i * 4.5 - 0.4, FZ - 14 - i * 4.5 + 1.6); }
    k.censusWall({ x: FX, y: 20, z: FZ - 0.08, rotY: PI, cols: 28, rows: 4, tile: 0.7, gap: 0.05, start: ctx.wallStart(800, 112), pieces: ctx.all, backing: stoneD });
    k.sign('THE CATHEDRAL CHURCH OF ST. JOHN THE DIVINE', 12, 0.8, FX, 23.2, FZ - 0.1, 'transparent', '#e8dcc0', 70, PI);
    k.sign('THE CATHEDRAL CHURCH OF ST. JOHN THE DIVINE', 14, 0.9, FX, 20, FZ + 6.1, 'transparent', '#e8dcc0', 70, 0);
    /* easter eggs */
    const WC = { name: 'Cathedral of Saint John the Divine, Wikipedia', url: 'https://en.wikipedia.org/wiki/Cathedral_of_Saint_John_the_Divine' };
    k.egg(v(FX + NW / 2 + 4, 4, FZ + 8.6), { id: 'cath-unfinished', title: 'St. John the Unfinished', year: '1892', text: 'The cornerstone was laid on December 27, 1892, and the building has been called St. John the Unfinished ever since. The two west towers were planned to reach about 266 feet and were never finished; the south tower stands about 50 feet taller than the north.', clue: 'Stand on Amsterdam Avenue and compare the two towers of the west front.', source: WC }, { r: 1.6 });
    k.egg(v(FX, RY - 8, FZ - 1.2), { id: 'cath-rose', title: '10,000 pieces of glass', text: 'The great rose window is 40 feet across and made of 10,000 pieces of glass by Charles Connick. It is called the largest rose window in the United States.', clue: 'Turn back at the crossing and look up at the west wall.', source: WC }, { r: 1.6 });
    k.egg(v(FX - NW / 2 - 5, 1.6, FZ - 30), { id: 'cath-poets', title: 'Poets\' Corner', year: '1985', text: 'Poets\' Corner is in the Arts Bay on the north side of the nave, dedicated in 1985. Its first inductees were Emily Dickinson, Washington Irving and Walt Whitman, and the poets in residence and electors since have included 17 United States Poets Laureate.', clue: 'Walk down the north aisle, under the arcade on your left as you face the altar.', source: WC }, { r: 1.6 });
    k.egg(v(FX + NW / 2 - 4, 16.5, CZ + 8), { id: 'cath-organ', title: 'The State Trumpet', year: '1910', text: 'The Great Organ was built by Ernest M. Skinner in 1906 to 1910 and now has 8,514 pipes. Its State Trumpet does not sit with the rest: it is under the rose window, about 500 feet to the west, so it sounds from the far end of the nave.', clue: 'Find the organ pipes above the choir.', source: WC }, { r: 1.6 });
    { const a = PI + (4 / 7) * PI; k.egg(v(FX + Math.cos(a) * (NW / 2 - 0.5), 4, CZ + Math.sin(a) * (NW / 2 - 0.5) + 1.2), { id: 'cath-columns', title: 'Eight granite columns', year: '1911', text: 'Eight granite columns ring the choir, each about 54 feet tall, made in two sections weighing 130 short tons together. The choir was consecrated in 1911, and the crossing in front of it was installed in 1909 under a Guastavino tile dome 93 feet across.', clue: 'Walk behind the altar to the ring of dark columns.', source: WC }, { r: 1.6 }); }
    { const a = PI + (3.5 / 7) * PI; k.egg(v(FX + Math.cos(a) * (NW / 2 + 6), 2.4, CZ + Math.sin(a) * (NW / 2 + 6)), { id: 'cath-tongues', title: 'Chapels of the Tongues', text: 'The seven chapels around the ambulatory are the Chapels of the Tongues, each devoted to a major immigrant group when the apse was finished. The three to the south were for the Latin races, the three to the north for the Germanic races, and the seventh, St. Savior, for immigrants from Africa and Asia. St. Savior holds a bronze three panel altarpiece with gold leaf by Keith Haring, designed just before his death.', clue: 'Walk around the ambulatory into the chapel at the far east end.', source: WC }, { r: 1.6 }); }
    // the works: the side aisles under the arcades, the seven chapels, flanking the west door
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 7; i++) { const z = FZ - 10 - i * 10; mounts.push({ position: v(FX + s * (NW / 2 + 9.66), 3.8, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(FX + s * (NW / 2 + 4), 3, z), width: 4.6, height: 2.7, style: 'gilt', wash: true }); }
    for (let i = 0; i < 7; i++) { const a = PI + ((i + 0.5) / 7) * PI, ca = Math.cos(a), sa = Math.sin(a); const cx = FX + ca * (NW / 2 + 6), cz = CZ + sa * (NW / 2 + 6); mounts.push({ position: v(cx + ca * 3.9, 4.2, cz + sa * 3.9), rotation: Math.atan2(-ca, -sa), target: v(cx - ca * 2.6, 3, cz - sa * 2.6), width: 3.4, height: 2.0, style: 'gilt', wash: false }); }
    for (const s of [-1, 1]) mounts.push({ position: v(FX + s * 12, 4, FZ - 0.2), rotation: PI, target: v(FX + s * 12, 3, FZ - 6), width: 4.6, height: 2.7, style: 'gilt' });
    return { mounts, spawn: v(0, 3, 46), look: v(0, 24, FZ + 6), eye: 3, bounds: [-NW / 2 - 9, NW / 2 + 9, CZ - NW / 2 - 10.6, 52], style: 'gilt' };
  },
};

/* ---------------- 40 QUEENSBORO PLAZA ---------------- */
export const queensboro: RoomDef = {
  id: 'queensboro',
  name: 'The elevated',
  area: 'QUEENSBORO PLAZA',
  mood: 'Rush hour',
  color: '#a0a8d8',
  description: 'An elevated platform over the plaza, trains rolling through on two levels, Manhattan across the river, the census on the platform walls.',
  signatures: 'The double deck steel viaduct, curving tracks and platform canopies, the bridge and the skyline to the west, the glass towers of Long Island City, the traffic under the el.',
  build(k, ctx) {
    k.sky({ top: 0x2c4a86, horizon: 0xf0a878, ground: 0x2a2a32, fog: 0.0026, sun: { az: 4.7, el: 0.08, color: 0xffa868, size: 20 }, haze: 0.4, env: 0.85 });
    k.hemi(0xffd8c0, 0x2a2e3a, 0.7);
    k.sun(0xffb890, 1.8, -70, 22, 10, true, 90);
    const steel = k.pbr('elSteel', X.steel(0x3a4048, true, 70), 0.6, { metalness: 0.75, roughness: 0.45 }),
      green = k.pbr('elGreen', X.steel(0x2a4a3a, false, 71), 0.6, { metalness: 0.5, roughness: 0.5 }),
      conc = k.pbr('platformQ', X.concrete(0x9a9a94, 29), 0.35),
      canopy = k.pbr('canopyQ', X.steel(0x6a6f76, false, 72), 0.5, { metalness: 0.6, roughness: 0.5 }),
      yellow = k.flat(0xf1c531, 0, 0.55),
      silver = k.pbr('carQ', X.steel(0x9aa5ab, false, 73), 0.35, { metalness: 0.9, roughness: 0.3 }),
      purple = k.flat(0x7a3a9a, 0.3, 0.5),
      glassDark = k.glass(0x1a2a33, 0.6, 0.1),
      glassT = k.pbr('licGlass', X.windows(74, 0.3, 0x6a88a0, false), 0.11, { emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.3, metalness: 0.5, stretch: 0.42 }),
      warm = k.glow(0xffe0b0);
    const PY = 9;
    // the plaza below: two wide avenues crossing under the structure
    street(k, { w: 30, len: 200, z: -20, x: 0 });
    const cross = k.mesh(new T.BoxGeometry(200, 0.3, 24), k.pbr('asphaltS', X.asphalt(0x24282d), 0.11), 0, -0.15, 0);
    void cross;
    blockFront(k, { x: -40, z0: 60, count: 8, face: 1, seed: 74, h: [14, 20] });
    for (const [x, z, w, h] of [[50, 60, 26, 90], [60, -40, 30, 120], [-60, -70, 24, 70]]) k.box(w as number, h as number, w as number, x as number, (h as number) / 2, z as number, glassT);
    for (const z of [30, -10, -50]) for (const s of [-1, 1]) k.lamp(s * 17, z, 7, k.flat(0x1f262b, 0.75, 0.45), 0xffd9a8, 30);
    // the viaduct: columns, girders, two levels of track, the platform between the tracks on the lower level
    for (let z = 60; z > -100; z -= 12) for (const x of [-9, 9]) { k.box(1.0, PY - 1, 1.0, x, (PY - 1) / 2, z, green); k.box(1.6, 0.4, 1.6, x, 0.2, z, green); k.box(20, 1.2, 1.0, 0, PY - 1.4, z, green); for (let y = 1; y < PY - 2; y += 1.4) k.box(0.4, 0.06, 0.06, x, y, z + 0.5, warm); }
    k.box(22, 0.8, 170, 0, PY - 0.8, -20, steel);
    for (const x of [-6.5, 6.5]) { k.box(3, 0.3, 170, x, PY - 0.25, -20, k.pbr('ballastQ', X.cobble(0x3a3a3a, 3), 0.9)); for (const dx of [-0.7, 0.7]) k.box(0.1, 0.16, 170, x + dx, PY - 0.02, -20, k.flat(0x8a8a90, 0.8, 0.4)); }
    k.box(6, 0.4, 150, 0, PY - 0.2, -20, conc);
    for (const s of [-1, 1]) { k.box(0.3, 0.05, 146, s * 2.6, PY + 0.02, -20, yellow); }
    k.block(-30, -3.2, -96, 56);
    k.block(3.2, 30, -96, 56);
    for (let z = 50; z > -90; z -= 8) { k.box(0.3, 3.4, 0.3, 0, PY + 1.7, z, steel); k.box(6.4, 0.2, 2.4, 0, PY + 3.4, z, canopy); k.box(2, 0.06, 0.3, 0, PY + 3.2, z, warm); k.point(0, PY + 3, z, 0xffe8c8, 14, 10); }
    k.box(6.4, 0.2, 148, 0, PY + 3.5, -20, canopy);
    // the upper level: a second pair of tracks on taller columns, the N and W run above
    for (let z = 60; z > -100; z -= 12) for (const x of [-11, 11]) k.box(0.9, 8, 0.9, x, PY + 4, z, green);
    k.box(26, 0.8, 170, 0, PY + 8.2, -20, steel);
    for (const x of [-8, 8]) { k.box(3, 0.3, 170, x, PY + 8.75, -20, k.pbr('ballastQ', X.cobble(0x3a3a3a, 3), 0.9)); }
    k.box(12.8, 0.5, 150, 0, PY + 8.85, -20, conc);
    for (const s of [-1, 1]) k.box(0.3, 0.05, 146, s * 6.1, PY + 9.12, -20, yellow);
    for (let z = 50; z > -90; z -= 16) { k.box(0.3, 3.2, 0.3, 0, PY + 10.7, z, steel); }
    k.box(7, 0.2, 148, 0, PY + 12.4, -20, canopy);
    // stairs from the plaza to the platform at the south end
    for (let i = 0; i < 24; i++) k.box(2.4, 0.375, 0.9, 0, 0.19 + i * 0.375, 56 - i * 0.9, conc);
    for (const s of [-1, 1]) k.box(0.1, 1.1, 22, s * 1.25, PY / 2 + 0.6, 45.5, steel).rotation.x = Math.atan2(PY, 21.6);
    // trains: a 7 rolling through the lower level, an N above, both on loops
    /* The real station: two levels, one island platform on each, the 7 and the N and W side by side on both, the
       only cross platform transfer between A and B Division trains in the system. Upper level to Queens, lower to
       Manhattan. The upper level had no platform here, and both trains wore the 7's purple. */
    const yellow2 = k.flat(0xf1c531, 0.3, 0.5);
    const car = (m: T.Material, len: number, band: T.Material = purple) => { const g = new T.Group(); const body = new T.Mesh(new T.BoxGeometry(2.7, 3.4, len), m); body.position.y = 1.9; g.add(body); for (let i = -len / 2 + 2; i < len / 2; i += 3) { for (const s of [-1, 1]) { const w = new T.Mesh(new T.PlaneGeometry(1.8, 1.2), glassDark); w.position.set(s * 1.36, 2.4, i); w.rotation.y = s * PI / 2; g.add(w); } } const stripe = new T.Mesh(new T.BoxGeometry(2.72, 0.24, len), band); stripe.position.y = 3.3; g.add(stripe); return g; };
    const train7 = new T.Group();
    for (let c = 0; c < 4; c++) { const cc = car(silver, 14); cc.position.z = c * 15; train7.add(cc); }
    train7.position.set(-6.5, PY, -60);
    k.add(train7);
    const trainN = new T.Group();
    for (let c = 0; c < 3; c++) { const cc = car(silver, 14, yellow2); cc.position.z = c * 15; trainN.add(cc); }
    trainN.position.set(8, PY + 9, 40);
    k.add(trainN);
    /* 2026-10-28: each box car becomes the hero car (h_subway_car_lo, as in the subway room). The coloured band stays
       on top of it, purple for the 7 and yellow for the N, so the lines still read. A failed load keeps the boxes. */
    void hero(k, 'h_subway_car_lo', { box: [2.66, 3.6, 13.8] }).then((h) => {
      if (!h) return;
      let n = 0;
      for (const tr of [train7, trainN]) for (const cc of tr.children) {
        cc.children.forEach((m, j) => { if (j < cc.children.length - 1) m.visible = false; });
        const c = n++ ? h.clone() : h; c.position.y = 0.05; cc.add(c);
      }
    });
    if (!ctx.reduced) k.ticks.push((t) => { const p = (t * 9) % 260; train7.position.z = -150 + p; const q = (t * 6 + 60) % 260; trainN.position.z = 110 - q; });
    // the river and Manhattan to the west, the bridge, the tower with the crown far off
    k.water({ y: -1.5, color: 0x2e4a60, w: 400, d: 500, x: -220, z: -20, amp: 1.0 });
    k.skyline({ z: -20, count: 22, spacing: 7, scale: 3.4, base: -1.5, seed: 105, lit: 0.45, glow: 1.3, tint: 0x2a3244, x: -440 });
    for (const z of [-40, -150]) { for (const x of [-140, -128]) k.box(1.2, 44, 1.6, x, 20, z, steel); k.box(14, 1.2, 1.6, -134, 30, z, steel); }
    for (let z = 30; z > -200; z -= 4) { k.box(14, 0.5, 4, -134, 12, z, steel); k.beam(v(-140, 12, z), v(-128, 12, z - 4), 0.07, steel, 4); k.beam(v(-140, 12, z), v(-140, 14 + Math.abs(Math.sin(z * 0.03)) * 10, z), 0.1, steel, 5); }
    // the census as the big billboard on the building facing the platform
    k.box(24, 30, 10, 34, 15, -30, k.pbr('licBrick', X.brick(0x5e463d, 75), 0.28));
    k.censusWall({ x: 28.95, y: PY + 6, z: -30, rotY: -PI / 2, cols: 22, rows: 5, tile: 0.8, gap: 0.06, start: ctx.wallStart(6900, 110), pieces: ctx.all, backing: k.flat(0x14161a, 0.5, 0.6) });
    k.sign('QUEENSBORO PLAZA  ·  7  N  W', 8, 0.9, 0, PY + 4.4, 50, '#0f1a1c', '#f9f8e9', 90, PI, { border: true });
    /* easter eggs */
    const WQ = { name: 'Queensboro Plaza station, Wikipedia', url: 'https://en.wikipedia.org/wiki/Queensboro_Plaza_station' };
    k.egg(v(0, PY + 2.2, 10), { id: 'qp-cross-platform', title: 'Across the platform', text: 'Queensboro Plaza is the only station in the whole system with cross platform transfers between A Division trains, the 7, and B Division trains, the N and W. Each level has one island platform: the 7 on one side, the Astoria trains on the other.', clue: 'Stand in the middle of the platform between the two tracks.', source: WQ }, { r: 1.6 });
    k.egg(v(0, PY + 7.2, -10), { id: 'qp-two-levels', title: 'Up to Queens, down to Manhattan', text: 'This is a two level station with four tracks and an island platform on each level. Trains heading into Queens stop on the upper level and trains heading for Manhattan on the lower. The only exits run through a mezzanine below the lower level.', clue: 'Look up through the canopy at the level above.', source: WQ }, { r: 1.6 });
    k.egg(v(10.5, PY + 0.8, -40), { id: 'qp-eight-tracks', title: 'Half a station', year: '1964', text: 'It was built as an eight track station, four tracks on each of two levels, 840 feet long in all. The northern half closed in the late 1940s when the track layout was greatly simplified, and the abandoned structure was torn down in 1964; only the original southern side remains.', clue: 'Look past the edge of the deck at the empty air beside the station.', source: WQ }, { r: 1.6 });
    k.egg(v(0, PY + 3.4, 49), { id: 'qp-opened', title: '1916 and 1917', year: '1916', text: 'The Flushing Line platforms opened on November 16, 1916, and the Astoria Line on February 1, 1917. The two lines east of here were shared by the IRT and BMT until 1949, with separate stopping marks and separate entrances, so riders could not transfer free.', clue: 'Read the station sign at the top of the stairs.', source: WQ }, { r: 1.6 });
    k.egg(v(-3, PY + 2.4, -70), { id: 'qp-bridge', title: 'Over the bridge', year: '1942', text: 'Astoria trains once skipped the tunnel and ran over the Queensboro Bridge to the Second Avenue elevated line in Manhattan, a service that lasted until 1942. Because the platforms were built to IRT size, the BMT ran its own elevated cars here and riders changed at Queensboro Plaza.', clue: 'Walk to the far end of the platform and look toward the bridge.', source: WQ }, { r: 1.6 });
    k.egg(v(-2.6, PY + 1.2, 26), { id: 'qp-apes', title: 'Underground, in the movies', text: 'In Beneath the Planet of the Apes the station appears as an underground ruin, though it is an elevated station with no tilework at all. It also turns up in an episode of Seinfeld as the site of a gyro stall.', clue: 'Look for the glint near the platform edge, where a lost astronaut might stand.', source: WQ }, { r: 1.6 });
    k.prop('mailbox', -16, 0, 14, { height: 1.5, rotY: PI / 2 });
    k.prop('hydrant', 16, 0, -6, { height: 1.1 });
    // the works: on the canopy posts facing the platform, on the back walls of the canopy, under the el
    const mounts: Mount[] = [];
    for (let i = 0; i < 12; i++) { const z = 44 - i * 8; const s = i % 2 ? 1 : -1; k.box(0.2, 3, 4.2, s * 2.9, PY + 1.8, z - 4, steel); mounts.push({ position: v(s * 2.78, PY + 2.0, z - 4), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * -0.5, PY + 3, z - 4), width: 3.6, height: 2.1, style: 'steel', wash: false }); }
    for (let i = 0; i < 6; i++) { const z = 30 - i * 14; mounts.push({ position: v(0, PY + 2.9, z), rotation: 0, target: v(0, PY + 3, z + 5), width: 2.6, height: 1.5, style: 'steel', wash: false, lookAt: v(0, PY + 2.9, z) }); k.box(3, 1.9, 0.12, 0, PY + 2.9, z - 0.1, steel); }
    for (const x of [-14, 14]) for (const z of [20, -20]) { k.box(4.6, 4, 0.4, x, 2, z, steel); mounts.push({ position: v(x, 2.6, z + 0.22), rotation: 0, target: v(x, 3, z + 5), width: 4.2, height: 2.5, style: 'steel', wash: false }); }
    return { mounts, spawn: v(0, 3, 60), look: v(0, PY + 3, 0), eye: 3, bounds: [-18, 18, -92, 62], style: 'steel', floorY: (x, z) => { if (Math.abs(x) < 3.2 && z <= 56 && z > -96) return z > 34.4 ? Math.max(0, ((56 - z) / 21.6) * PY) : PY; return 0; } };
  },
};

/* ---------------- 41 A BUSHWICK ROOFTOP ---------------- */
export const bushwick: RoomDef = {
  id: 'bushwick',
  name: 'The roof',
  area: 'A BUSHWICK ROOFTOP',
  mood: 'The party at dusk',
  color: '#e8a04a',
  description: 'A tar roof above the murals, water towers and string lights, the neighbouring walls painted the size of buildings with the census.',
  signatures: 'The tar paper roof with bulkhead and water towers, the painted party walls of the surrounding lofts, string lights on posts, the el and the skyline at dusk, a projector on a bedsheet.',
  build(k, ctx) {
    k.sky({ top: 0x3a3f7e, horizon: 0xf2a070, ground: 0x2a2226, fog: 0.0028, sun: { az: 4.8, el: 0.05, color: 0xff9a55, size: 22 }, haze: 0.45, stars: 200, env: 0.8 });
    k.hemi(0xffc8b0, 0x2a2228, 0.7);
    k.sun(0xffa870, 1.6, -80, 16, 20, true, 90);
    const tar = k.pbr('tarRoof', X.asphalt(0x2c2c30), 0.2, { roughness: 0.85 }),
      brick = k.pbr('bwBrick', X.brick(0x6b4437, 76), 0.28),
      brick2 = k.pbr('bwBrick2', X.brick(0x8a6a58, 77), 0.28),
      parapet = k.pbr('bwParapet', X.concrete(0x8a8a82, 30), 0.4),
      wood = k.pbr('bwWood', X.planks(0x8a6a48, 5, 78), 1.0),
      iron = k.flat(0x1f242a, 0.75, 0.45),
      warm = k.glow(0xffd8a0),
      sheet = k.flat(0xf4f0e8, 0, 0.9, { side: T.DoubleSide });
    const RW = 30, RD = 44, RH = 14;
    // the roof itself on top of a loft building, the street twelve below
    k.box(RW, RH, RD, 0, RH / 2 - RH, 0, brick);
    k.box(RW, 0.4, RD, 0, -0.2, 0, tar);
    for (const s of [-1, 1]) { k.box(0.6, 1.1, RD, s * (RW / 2 - 0.3), 0.55, 0, parapet); k.box(RW, 1.1, 0.6, 0, 0.55, s * (RD / 2 - 0.3), parapet); }
    k.box(6, 3.6, 5, -9, 1.8, -14, brick2);
    k.box(6.4, 0.3, 5.4, -9, 3.7, -14, parapet);
    k.box(1.4, 2.6, 0.3, -9, 1.3, -11.4, k.pbr('bwDoor', X.steel(0x4a4a50, false, 79), 0.6, { metalness: 0.6 }));
    k.block(-12.2, -5.8, -16.7, -11.3);
    k.prop('water_tower', 9, 0, -16, { height: 6.2, keepOut: 2.4 });
    k.prop('water_tower', -10, 0, 14, { height: 5.4, keepOut: 2.2 });
    k.prop('utility_pole', 13, -RH, 24, { height: 10 });
    /* the corner below: the Bushwick Collective's crossroads */
    k.sign('TROUTMAN ST', 2.4, 0.42, 13, -RH + 5.2, 24.3, '#1f6a3a', '#ffffff', 90, PI, { border: true });
    k.sign('ST NICHOLAS AV', 2.8, 0.42, 13.3, -RH + 5.7, 24, '#1f6a3a', '#ffffff', 90, PI / 2, { border: true });
    // string lights on posts, the folding chairs, the DJ table, the projector and the sheet
    for (const [x, z] of [[-12, -4], [12, -4], [-12, 10], [12, 10], [0, 18]]) { k.box(0.1, 3.4, 0.1, x, 1.7, z, iron); k.box(0.6, 0.6, 0.6, x, 0.3, z, parapet); }
    const bulbs: T.Mesh[] = [];
    for (const [a, b] of [[[-12, -4], [12, -4]], [[-12, 10], [12, 10]], [[-12, -4], [-12, 10]], [[12, -4], [12, 10]], [[-12, 10], [0, 18]], [[12, 10], [0, 18]]] as const) {
      for (let i = 0; i <= 12; i++) { const t = i / 12, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t, y = 3.3 - Math.sin(t * PI) * 0.5; bulbs.push(k.mesh(new T.SphereGeometry(0.08, 6, 5), warm, x, y, z, true)); }
      k.beam(v(a[0], 3.3, a[1]), v(b[0], 3.3, b[1]), 0.01, iron, 3);
    }
    for (const [x, z] of [[-6, 0], [6, 2], [0, 6], [-4, 12], [7, 12]]) k.point(x, 3, z, 0xffd8a0, 10, 9);
    if (!ctx.reduced) k.ticks.push((t) => bulbs.forEach((b, i) => { const s = 0.9 + 0.25 * Math.sin(t * 2.5 + i * 0.7); b.scale.setScalar(s); }));
    const rnd = X.mulberry(41);
    for (let i = 0; i < 12; i++) { const x = -8 + rnd() * 16, z = -2 + rnd() * 16; const c = k.box(0.5, 0.05, 0.5, x, 0.55, z, k.flat(0x3a6ab0, 0, 0.7)); k.box(0.5, 0.6, 0.05, x, 0.85, z - 0.25, k.flat(0x3a6ab0, 0, 0.7)); for (const dx of [-0.2, 0.2]) for (const dz of [-0.2, 0.2]) k.box(0.04, 0.55, 0.04, x + dx, 0.27, z + dz, iron); c.rotation.y = rnd() * PI; k.keepOut.push({ x, z, r: 0.5 }); }
    k.box(2.4, 0.9, 0.8, 0, 0.45, -6, wood);
    k.box(1.2, 0.1, 0.5, 0, 0.95, -6, k.flat(0x1a1a1c, 0.3, 0.5));
    k.keepOut.push({ x: 0, z: -6, r: 1.4 });
    for (const s of [-1, 1]) { k.box(0.4, 1.2, 0.4, s * 1.8, 0.6, -6.6, k.flat(0x1a1a1c, 0.2, 0.7)); }
    k.box(0.4, 0.3, 0.5, -3, 1.6, 2, k.flat(0x2a2a2e, 0.4, 0.5));
    k.box(0.1, 0.8, 0.1, -3, 0.9, 2, iron);
    k.point(-3, 1.7, 2, 0xdff0ff, 6, 4);
    // the surrounding lofts: their party walls are the murals
    const walls: { x: number; z: number; rot: number; w: number; h: number }[] = [];
    for (const [x, z, w, h, rot] of [[-32, -6, 28, 26, PI / 2], [-32, 18, 22, 22, PI / 2], [30, -2, 30, 24, -PI / 2], [30, 20, 18, 20, -PI / 2], [0, -40, 34, 28, 0], [-24, -40, 14, 18, 0]] as const) {
      const b = k.box(rot === 0 ? w : 14, h + RH, rot === 0 ? 14 : w, x, (h + RH) / 2 - RH, z, walls.length % 2 ? brick : brick2);
      void b;
      walls.push({ x: x + (rot === PI / 2 ? 7.05 : rot === -PI / 2 ? -7.05 : 0), z: z + (rot === 0 ? 7.05 : 0), rot, w, h });
    }
    blockFront(k, { x: -RW / 2 - 40, z0: 40, count: 8, face: 1, seed: 80, h: [14, 22] });
    /* easter eggs */
    const WB = { name: 'Bushwick, Brooklyn, Wikipedia', url: 'https://en.wikipedia.org/wiki/Bushwick,_Brooklyn' };
    k.egg(v(-9, 3.0, -11.2), { id: 'bw-boswijck', title: 'The neighbourhood in the woods', year: '1661', text: 'Peter Stuyvesant chartered the town in 1661 and named it Boswijck, neighbourhood in the woods in seventeenth century Dutch. The land had been deeded by the Lenape in 1638.', clue: 'Look over the steel door of the stair bulkhead.', source: WB }, { r: 1.6 });
    k.egg(v(9, 6.6, -16), { id: 'bw-brewers-row', title: 'Fourteen breweries in fourteen blocks', year: '1890', text: 'By 1890 Bushwick had 14 breweries in a 14 block stretch called Brewer\'s Row, and was known as the beer capital of the Northeast. Brewery owners built mansions along Bushwick and Irving Avenues. The last of them, Schaefer and Rheingold, closed in 1976.', clue: 'Climb your eyes up the water tower and think of beer.', source: WB }, { r: 1.6 });
    k.egg(v(9, 1.4, RD / 2 - 0.8), { id: 'bw-el', title: 'Brooklyn\'s first el', year: '1885', text: 'Brooklyn\'s first elevated line, the Lexington Avenue el, opened in 1885, and by the end of 1889 the Broadway and Myrtle Avenue els were complete. Today the J and Z run on the Jamaica Line over Broadway, the M on the Myrtle Avenue Line, and the L on the Canarsie Line.', clue: 'Lean on the parapet and watch the train on the el.', source: WB }, { r: 1.6 });
    k.egg(v(-9, 1.4, RD / 2 - 0.8), { id: 'bw-blackout', title: 'The night of July 13, 1977', year: '1977', text: 'In the citywide blackout of July 13, 1977, Bushwick suffered some of the worst damage and losses in the city. The Broadway shopping district under the el was heavily looted and burned, and afterwards its business vacancy rate reached 43 percent.', clue: 'Look down from the parapet toward Broadway and the el.', source: WB }, { r: 1.6 });
    k.egg(v(-24, 6, -6), { id: 'bw-collective', title: 'The Bushwick Collective', year: '2012', text: 'Joseph Ficalora, a Bushwick native, founded the Bushwick Collective in 2012 out of a mural painting jam, at the intersection of Troutman Street and St. Nicholas Avenue. His father\'s murder in 1991 marked him deeply. The collective now holds an annual block party of hip hop and graffiti that draws thousands.', clue: 'Face the biggest painted wall to the west.', source: { name: 'Bushwick Collective, Art in Context', url: 'https://artincontext.org/bushwick-collective/' } }, { r: 1.6 });
    k.egg(v(23.5, 6, -2), { id: 'bw-ten-muralists', title: 'A DJ and ten muralists', text: 'The collective\'s first party had a DJ and ten muralists. Within five years the walls around it had carried work by Nychos, D*Face, Logan Hicks, Joe Iurato, Li-Hill, Don Rimx, Daze, Dasic, COST and many more, block after block.', clue: 'Turn to the painted wall to the east.', source: { name: 'The Bushwick Collective Turns 5, Brooklyn Street Art', url: 'https://www.brooklynstreetart.com/2016/06/11/the-bushwick-collective-turns-5/' } }, { r: 1.6 });
    // the el a block away, a train crossing it now and then
    for (let x = -80; x <= 80; x += 12) { k.box(0.9, 8, 0.9, x, -RH + 4, 60, iron); }
    k.box(170, 0.8, 8, 0, -RH + 8.4, 60, k.pbr('elSteel', X.steel(0x3a4048, true, 70), 0.6, { metalness: 0.75, roughness: 0.45 }));
    const tr = new T.Group();
    for (let c = 0; c < 5; c++) { const m = new T.Mesh(new T.BoxGeometry(14, 3.2, 2.7), k.pbr('carQ', X.steel(0x9aa5ab, false, 73), 0.35, { metalness: 0.9, roughness: 0.3 })); m.position.x = c * 15; tr.add(m); for (let i = -5; i < 6; i += 3) { const w = new T.Mesh(new T.PlaneGeometry(1.8, 1.1), warm); w.position.set(c * 15 + i, 0.3, -1.36); w.rotation.y = PI; tr.add(w); } }
    tr.position.set(-100, -RH + 10.4, 60);
    k.add(tr);
    if (!ctx.reduced) k.ticks.push((t) => { tr.position.x = -140 + ((t * 8) % 280); });
    k.skyline({ z: -220, count: 30, spacing: 8, scale: 2.6, base: -RH, seed: 106, lit: 0.4, glow: 1.2, tint: 0x2a3244 });
    k.skyline({ z: 150, count: 24, spacing: 9, scale: 1.4, base: -RH, seed: 107, lit: 0.3, glow: 0.8, tint: 0x4a4048, rows: 1 });
    // the projector sheet carries the census tonight
    k.beam(v(-4, 0, RD / 2 - 1), v(-4, 4.4, RD / 2 - 1), 0.04, iron, 6);
    k.beam(v(4, 0, RD / 2 - 1), v(4, 4.4, RD / 2 - 1), 0.04, iron, 6);
    k.mesh(new T.PlaneGeometry(8, 4.6), sheet, 0, 2.2, RD / 2 - 1.02);
    k.censusWall({ x: 0, y: 2.2, z: RD / 2 - 1.08, rotY: PI, cols: 12, rows: 3, tile: 0.6, gap: 0.05, start: ctx.wallStart(7300, 36), pieces: ctx.all });
    // the works: the murals on the party walls, the bulkhead, screens on the parapet
    const mounts: Mount[] = [];
    for (const w of walls) { mounts.push({ position: v(w.x, RH * 0 + w.h / 2 - 2, w.z), rotation: w.rot, target: v(w.rot === PI / 2 ? w.x + 12 : w.rot === -PI / 2 ? w.x - 12 : w.x, 3, w.rot === 0 ? w.z + 14 : w.z), width: w.w * 0.62, height: w.h * 0.55, style: 'none', wash: false }); }
    for (const [x, rot] of [[-12.05, PI / 2], [-5.95, -PI / 2]] as const) mounts.push({ position: v(x, 2.0, -14), rotation: rot, target: v(x + (rot > 0 ? -4 : 4), 3, -14), width: 3.6, height: 2.1, style: 'black', wash: false });
    mounts.push({ position: v(-9, 2.0, -16.55), rotation: PI, target: v(-9, 3, -20), width: 3.6, height: 2.1, style: 'black', wash: false });
    for (let i = 0; i < 4; i++) { const z = -16 + i * 10; k.box(0.3, 3.2, 3.6, RW / 2 - 0.65, 2.2, z, iron); mounts.push({ position: v(RW / 2 - 0.82, 2.4, z), rotation: -PI / 2, target: v(RW / 2 - 5, 3, z), width: 3.2, height: 1.9, style: 'black', wash: false }); }
    for (let i = 0; i < 4; i++) { const z = -16 + i * 10; k.box(0.3, 3.2, 3.6, -RW / 2 + 0.65, 2.2, z, iron); mounts.push({ position: v(-RW / 2 + 0.82, 2.4, z), rotation: PI / 2, target: v(-RW / 2 + 5, 3, z), width: 3.2, height: 1.9, style: 'black', wash: false }); }
    return { mounts, spawn: v(0, 3, 12), look: v(-10, 8, -30), eye: 3, bounds: [-RW / 2 + 0.8, RW / 2 - 0.8, -RD / 2 + 0.8, RD / 2 - 1.6], style: 'black' };
  },
};
