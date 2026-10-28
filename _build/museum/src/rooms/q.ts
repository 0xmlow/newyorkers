/* Rooms 77 to 81: Ellis Island, the marathon start, the Halloween parade, Eastern Parkway, Manhattanhenge. */
import * as T from 'three';
import { personTag } from '../kit';
import * as X from '../textures';
import { v } from '../kit';
import type { Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront } from './f';
import { libertyFigure, LIBERTY_CREDIT } from './b';
import { standIn } from './heroes';

const PI = Math.PI;

/* ---------------- 77 ELLIS ISLAND ---------------- */
export const ellis: RoomDef = {
  id: 'ellis',
  name: 'The registry room',
  area: 'ELLIS ISLAND',
  mood: 'Arrival morning',
  color: '#c8a888',
  description: 'The ferry slip and the red brick palace with its four towers, then the great hall: the tiled vault, the flags, the long benches, the stair of separation, the works where the inspectors stood.',
  signatures: 'The French Renaissance main building in red brick and limestone with copper domed towers, the registry room with its Guastavino tile vault and three great arched windows, the iron railings, the American flags, the benches in rows.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad8, horizon: 0xf0e8dc, ground: 0x4a5a5c, fog: 0.0018, sun: { az: 2.2, el: 0.5, color: 0xfff6e8, size: 12 }, env: 1.0 });
    k.hemi(0xeef4ff, 0x3a4a48, 0.9);
    k.sun(0xfff0dc, 2.4, 60, 60, 60, true, 120);
    const brick = k.pbr('eiBrick', X.brick(0x8a4a3a, 231), 0.28),
      lime = k.pbr('eiLime', X.ashlar(0xd8d0bc, 232, 3), 0.22),
      tile = k.pbr('eiTile', X.brick(0xcbb894, 233), 0.16, { roughness: 0.55, stretch: 0.5, side: T.BackSide }),
      floorT = k.pbr('eiFloor', X.terrazzo(0xb8b0a0, 106), 0.4, { roughness: 0.4 }),
      copper = k.pbr('eiCopper', X.patina(0x5f9a8c), 0.6, { roughness: 0.6, metalness: 0.3 }),
      iron = k.flat(0x1a1c20, 0.7, 0.45),
      wood = k.pbr('eiBench', X.planks(0x6a4a30, 4, 234), 1.0),
      glass = k.glass(0xe8f4f8, 0.12, 0.04),
      redF = k.flat(0xb8202a, 0, 0.7), whiteF = k.flat(0xf4f0e8, 0, 0.7), blueF = k.flat(0x1d2f5c, 0, 0.7),
      dark = k.flat(0x1a1c20, 0.5, 0.6);
    // the harbor, the island, the ferry slip with a ferry arriving
    k.water({ y: -1.2, color: 0x30586a, w: 900, d: 900, amp: 1.2 });
    k.box(120, 2, 160, 0, -0.9, -20, k.pbr('eiGround', X.pavers(0x9a9a94, 107), 0.4));
    k.box(30, 1.6, 60, -75, -0.6, 20, k.pbr('eiSlip', X.concrete(0x8a8a84, 108), 0.3));
    for (let z = -8; z <= 48; z += 8) k.cyl(0.4, 4, -61, 0.6, z, iron, 0.4, 8);
    const ferry = new T.Group(); const hull = new T.Mesh(new T.BoxGeometry(9, 3, 30), k.flat(0xf1c531, 0.2, 0.6)); hull.position.y = 1.2; ferry.add(hull); const cab = new T.Mesh(new T.BoxGeometry(7, 3, 20), k.flat(0xe6e2da, 0.2, 0.6)); cab.position.y = 4.2; ferry.add(cab); k.add(ferry);
    if (!ctx.reduced) k.rider(ferry, k.spline([v(-66, -0.8, 20), v(-120, -0.8, 80), v(-200, -0.8, 40), v(-160, -0.8, -40), v(-90, -0.8, -20)], true), 3, 0);
    k.skyline({ z: -300, count: 40, spacing: 9, scale: 4.2, base: -1.2, seed: 235, lit: 0.25, glow: 0.5, tint: 0x6e7684, spires: true });
    /* 2026-10-28: the lathed cone across the water is the stand in for Gravity Jack's Liberty (CC BY 4.0, b.ts), credit by the spawn */
    { const lm = k.objects.length; k.lathe([[0, 0], [5, 0], [4.4, 6], [3.6, 18], [2.4, 26], [0, 27]], -160, 6, 140, copper, 24); libertyFigure(k, standIn(k, lm), -160, 6, 140, 27, [-4, 21]); }
    k.box(12, 14, 12, -160, -1, 140, lime);
    k.box(0.08, 0.9, 0.08, -12, 0.55, 18, iron); k.sign(LIBERTY_CREDIT, 3.4, 0.42, -12, 1.2, 18.05, '#2a3a36', '#e8e2d4', 46, 0);
    // the main building: brick with limestone trim, four corner towers with copper domes, three arched windows on the front
    const BX = 0, BZ = -20, BW = 60, BD = 30, BH = 21;
    k.box(BW, BH, BD, BX, BH / 2, BZ, brick);
    k.moulding([[0, 0], [0.9, 0], [1.0, 0.3], [0.6, 0.5], [0.8, 0.8], [0, 1.0]], BW + 0.4, BX, BH - 0.5, BZ + BD / 2 + 0.05, lime, 0);
    k.box(BW + 0.4, 2.4, BD + 0.4, BX, 1.2, BZ, lime);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x = BX + sx * (BW / 2 - 4), z = BZ + sz * (BD / 2 - 4); k.box(9, BH + 8, 9, x, (BH + 8) / 2, z, brick); k.box(9.4, 1.0, 9.4, x, BH + 7.6, z, lime); k.mesh(new T.SphereGeometry(4.6, 16, 10, 0, PI * 2, 0, PI / 2), copper, x, BH + 8, z); k.cyl(0.12, 3, x, BH + 13.6, z, copper, 0.02, 6); }
    for (let i = 0; i < 3; i++) { const x = BX - 14 + i * 14; k.arch(7, 11, 1.4, x, 4, BZ + BD / 2, lime, false, 0.8); k.box(6.2, 9.6, 0.1, x, 8.8, BZ + BD / 2 + 0.1, glass); k.box(6.4, 10, 0.16, x, 8.8, BZ + BD / 2 - 0.05, k.flat(0x1a1c20, 0.6, 0.4)); for (let r = 0; r < 3; r++) k.box(0.1, 9.6, 0.1, x - 2 + r * 2, 8.8, BZ + BD / 2 + 0.12, iron); }
    for (let i = 0; i < 3; i++) k.arch(2.6, 4, 2, BX - 8 + i * 8, 0, BZ + BD / 2 - 0.6, lime, false, 0.85);
    k.block(BX - BW / 2, BX - 9.4, BZ + BD / 2 - 0.8, BZ + BD / 2 + 0.6); k.block(BX - 6.6, BX - 1.4, BZ + BD / 2 - 0.8, BZ + BD / 2 + 0.6); k.block(BX + 1.4, BX + 6.6, BZ + BD / 2 - 0.8, BZ + BD / 2 + 0.6); k.block(BX + 9.4, BX + BW / 2, BZ + BD / 2 - 0.8, BZ + BD / 2 + 0.6);
    k.box(BW - 20, 3.2, 10, BX, 1.6, BZ + BD / 2 + 6, lime); for (let i = 0; i < 6; i++) k.box(20, 0.5, 1.2, BX, 0.25 + i * 0.5, BZ + BD / 2 + 12 - i * 1.0, lime);
    k.block(BX - 20, BX - 10, BZ + BD / 2, BZ + BD / 2 + 11); k.block(BX + 10, BX + 20, BZ + BD / 2, BZ + BD / 2 + 11);
    for (const s of [-1, 1]) { k.box(0.16, 8, 0.16, BX + s * 12, BH + 4, BZ + BD / 2 + 0.6, iron); for (let st = 0; st < 13; st++) k.box(3.2, 0.14, 0.02, BX + s * 12 + 1.6, BH + 7.9 - st * 0.14, BZ + BD / 2 + 0.7, st % 2 ? whiteF : redF); k.box(1.3, 0.98, 0.03, BX + s * 12 + 0.65, BH + 7.4, BZ + BD / 2 + 0.71, blueF); }
    k.sign('ELLIS ISLAND  ·  1892 TO 1954  ·  TWELVE MILLION', 12, 0.8, BX, BH - 2, BZ + BD / 2 + 0.06, 'transparent', '#e8dcc0', 70, 0);
    // the registry room: the whole first floor above the ground floor, a tile vault, three windows, benches, the stairs of separation
    const RY = 3.2, RW = BW - 4, RD = BD - 4;
    k.box(RW, 0.3, RD, BX, RY, BZ, floorT);
    for (let i = 0; i < 10; i++) k.box(6, 0.32, 1.0, BX, 0.16 + i * 0.32, BZ + BD / 2 - 1.2 - i * 1.0, floorT);
    /* The vault was a half circle 24 m high, which put the ceiling about 92 ft up and through the roof.
       The real registry room ceiling is 56 ft (17 m), so the vault is now a flattened arch: it springs
       4 m up and rises VF times its half span, its crown 17 m over the floor. */
    const VR = RW / 2 - 4, VF = 13 / VR;
    const vg = new T.CylinderGeometry(VR, VR, RD - 2, 32, 1, true, 0, PI); vg.rotateX(PI / 2); vg.rotateZ(PI / 2); vg.scale(1, VF, 1);
    const vault = k.mesh(vg, tile, BX, RY + 4, BZ);
    const tileF = k.pbr('eiTileF', X.brick(0xcbb894, 233), 0.16, { roughness: 0.55, stretch: 0.5 });
    for (let j = 0; j < 12; j++) { const a0 = (j / 12) * PI, a1 = ((j + 1) / 12) * PI; const x0 = Math.cos(a0) * VR, y0 = Math.sin(a0) * VR * VF, x1 = Math.cos(a1) * VR, y1 = Math.sin(a1) * VR * VF; const seg = k.box(Math.hypot(x1 - x0, y1 - y0) + 0.05, 0.12, RD - 2, BX + (x0 + x1) / 2, RY + 4 + (y0 + y1) / 2, BZ, tileF); seg.rotation.z = Math.atan2(y1 - y0, x1 - x0); }
    for (let i = 0; i <= 6; i++) { const z = BZ - (RD - 2) / 2 + i * ((RD - 2) / 6); const pts: T.Vector3[] = []; for (let j = 0; j <= 16; j++) { const a = (j / 16) * PI; pts.push(v(BX + Math.cos(a) * (VR - 0.1), RY + 4 + Math.sin(a) * (VR - 0.1) * VF, z)); } k.curve(pts, 0.14, lime, 16); }
    for (const s of [-1, 1]) { k.box(0.6, 6, RD, BX + s * (RW / 2 - 4.2), RY + 3, BZ, brick); k.block(BX + s * (RW / 2 - 4.2) - 0.5, BX + s * (RW / 2 - 4.2) + 0.5, BZ - RD / 2, BZ + RD / 2); k.block(BX + s * (RW / 2 - 4.2), BX + s * (RW / 2 + 2), BZ - RD / 2, BZ + RD / 2); }
    k.block(BX - RW / 2, BX + RW / 2, BZ - RD / 2 - 0.6, BZ - RD / 2 + 0.6);
    for (let i = 0; i < 3; i++) { const x = BX - 14 + i * 14; k.point(x, RY + 8, BZ + 4, 0xfff0e0, 40, 24); }
    for (let r = 0; r < 6; r++) for (const s of [-1, 1]) { const x = BX + s * 9, z = BZ - 6 + r * 2.4; k.box(10, 0.1, 0.5, x, RY + 0.5, z, wood); k.box(10, 0.5, 0.06, x, RY + 0.75, z - 0.24, wood); for (const dx of [-4.8, 0, 4.8]) k.box(0.12, 0.5, 0.5, x + dx, RY + 0.25, z, iron); k.block(x - 5, x + 5, z - 0.4, z + 0.4); }
    for (let i = 0; i < 6; i++) k.box(0.06, 1.0, RD - 10, BX, RY + 0.5, BZ + 0 - 1, iron), void i;
    for (const s of [-1, 1]) { for (let st = 0; st < 12; st++) k.box(3, 0.3, 0.9, BX + s * 20, RY + 0.15 + st * 0.3, BZ - RD / 2 + 2 + st * 0.9, lime); k.rail(BX + s * 20 - s * 1.6, BZ - RD / 2 + 7, 11, iron, 1.0, 'z', 1.5); }
    for (const s of [-1, 1]) k.point(BX + s * 20, RY + 6, BZ - RD / 2 + 8, 0xfff0e0, 14, 10);
    k.censusWall({ x: BX, y: RY + 4.4, z: BZ - RD / 2 + 0.36, rotY: 0, cols: 40, rows: 6, tile: 0.55, gap: 0.05, start: ctx.wallStart(4400, 240), pieces: ctx.all, backing: dark });
    k.crowd([v(BX - 20, RY, BZ + 10), v(BX - 6, RY, BZ + 4), v(BX + 6, RY, BZ - 4), v(BX + 20, RY, BZ + 10)], 30, { seed: 90, speed: 0.3, spread: 2.2, animate: !ctx.reduced, colors: [0x24262c, 0x151517, 0x4a3a2a, 0x8a3a3a, 0x3a3a4a, 0xd8d0c0] });
    // the works: the inspectors' desks wall, between the benches on the side aisles, the side walls under the windows, the front
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = BZ - 8 + i * 6; mounts.push({ position: v(BX + s * (RW / 2 - 4.54), RY + 3.6, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(BX + s * (RW / 2 - 12), RY + 3, z), width: 4.2, height: 2.5, style: 'gilt', wash: true }); }
    for (let i = 0; i < 5; i++) { const x = BX - 16 + i * 8; mounts.push({ position: v(x, RY + 3.2, BZ - RD / 2 + 0.36), rotation: 0, target: v(x, RY + 2.5, BZ - 6), width: 2.4, height: 1.5, style: 'gilt', wash: false }); }
    k.box(RW - 10, 3, 0.5, BX, RY + 1.5, BZ - RD / 2 + 3, wood); k.block(BX - RW / 2 + 5, BX + RW / 2 - 5, BZ - RD / 2 + 2.6, BZ - RD / 2 + 3.4);
    for (let i = 0; i < 4; i++) { const x = BX - 12 + i * 8; mounts.push({ position: v(x, RY + 2.4, BZ - RD / 2 + 3.28), rotation: PI, target: v(x, RY + 2, BZ - 4), width: 3.2, height: 1.4, style: 'gilt', wash: false }); }
    for (let i = 0; i < 2; i++) { const x = BX - 20 + i * 40; mounts.push({ position: v(x + (i ? -3.6 : 3.6), 5, BZ + BD / 2 + 0.36), rotation: 0, target: v(x, 3, BZ + BD / 2 + 12), width: 4.2, height: 2.5, style: 'gilt', wash: false }); }
    // landmark eggs
    k.egg(v(BX, RY + 15, BZ), { id: 'ellis-vault', title: 'After Black Tom', year: '1916', text: 'In 1916 the Black Tom explosion collapsed the registry room roof. By 1918 it had been replaced with the arched ceiling of Guastavino tile that is still overhead. The room is 200 by 100 feet with a 56 foot ceiling.', clue: 'Stand in the middle of the hall and look up at the tiles.', source: { name: 'Ellis Island, Wikipedia', url: 'https://en.wikipedia.org/wiki/Ellis_Island' } }, { r: 2.4 });
    k.egg(v(BX, RY + 1.2, BZ + BD / 2 - 9.6), { id: 'ellis-sixseconds', title: 'Six seconds', text: 'Public Health Service doctors ran the line inspection as long lines moved through the registry room, and sometimes had only six seconds to scan each immigrant. They watched people climbing the stairs for a limp or laboured breathing. About ten percent were held for a fuller examination, and in the end all but one percent were allowed to enter.', clue: 'Stop at the top of the stairs where the doctors stood watching.', source: { name: 'Historic Medical Inspection, 2nd Floor, National Park Service', url: 'https://www.nps.gov/places/000/historic-medical-inspection-2nd-floor.htm' } }, { r: 1.6 });
    k.egg(v(BX + 9, RY + 1, BZ - 3.6), { id: 'ellis-benches', title: 'Benches for railings', year: '1911', text: 'A staircase from the first floor once rose into the middle of the registry room, and immigrants were steered through it by iron handrails. The staircase and the handrails were removed around 1911, and benches replaced the handrails.', clue: 'Sit on the long wooden benches in the middle of the hall.', source: { name: 'Ellis Island, Wikipedia', url: 'https://en.wikipedia.org/wiki/Ellis_Island' } }, { r: 1.6 });
    k.egg(v(-62, 1.4, 20), { id: 'ellis-annie', title: 'The first one through', year: '1892', text: 'The immigration station opened on January 1, 1892, and its first immigrant was Annie Moore, a 17 year old from Cork, Ireland. About 12 million immigrants passed through before the island closed on November 12, 1954.', clue: 'Look west from the plaza to the ferry slip where the boats came in.', source: { name: 'Ellis Island, Wikipedia', url: 'https://en.wikipedia.org/wiki/Ellis_Island' } }, { r: 2 });
    k.egg(v(BX, BH - 2, BZ + BD / 2 + 0.4), { id: 'ellis-fire', title: 'The building that burned', year: '1897', text: 'On June 15, 1897 a fire of unknown origin razed the first, wooden station. No one died, but immigration records going back to 1855 were destroyed. The present brick and limestone building opened on December 17, 1900, without ceremony, and processed 2,251 immigrants that day.', clue: 'Read the lettering high on the front of the building.', source: { name: 'Ellis Island, Wikipedia', url: 'https://en.wikipedia.org/wiki/Ellis_Island' } }, { r: 2 });
    k.egg(v(-22, 0.6, 40), { id: 'ellis-landfill', title: 'An island that grew', year: '1906', text: 'Ellis Island was almost doubled to 6 acres while the first station was built, then grew with landfill to 11 acres by the end of 1892, 14 acres by 1896 and 20.25 acres in 1906. Today it covers 27.5 acres.', clue: 'Walk to the far west corner of the plaza and look at the ground under you.', source: { name: 'Ellis Island, Wikipedia', url: 'https://en.wikipedia.org/wiki/Ellis_Island' } }, { r: 2 });
    return { mounts, spawn: v(-4, 3, BZ + BD / 2 + 26), look: v(BX, 14, BZ), eye: 3, bounds: [-RW / 2 + 4.6, RW / 2 - 4.6, BZ - RD / 2 + 1, BZ + BD / 2 + 40], style: 'gilt', floorY: (x, z) => { void x; if (z < BZ + BD / 2 - 0.4 && z > BZ + BD / 2 - 10.6) return Math.min(RY, ((BZ + BD / 2 - 0.4 - z) / 10) * RY); if (z <= BZ + BD / 2 - 10.6 && z > BZ - RD / 2) return RY; return 0; } };
  },
};

/* ---------------- 78 THE MARATHON ---------------- */
export const marathon: RoomDef = {
  id: 'marathon',
  name: 'Mile one',
  area: 'THE VERRAZZANO',
  mood: 'First Sunday in November',
  color: '#3a8ad8',
  description: 'The upper deck of the bridge at the start: fifty thousand runners pouring over the crest toward Brooklyn, the harbor on both sides, the towers, the fireboat below, the works on the tower legs.',
  signatures: 'The two steel towers rising from the Narrows, the upper roadway packed curb to curb with runners in colour, the cables sweeping down, the fireboat spraying, Fort Wadsworth at the Staten Island end, Bay Ridge ahead, helicopters.',
  build(k, ctx) {
    k.sky({ top: 0x5f8fd0, horizon: 0xe8ecf0, ground: 0x2c3a44, fog: 0.0014, sun: { az: 2.3, el: 0.45, color: 0xfff4e6, size: 12 }, env: 1.0 });
    k.hemi(0xeef4ff, 0x2a323a, 0.95);
    k.sun(0xfff0dc, 2.4, 80, 60, 40, true, 120);
    const steel = k.pbr('vzSteel', X.steel(0x8a8e94, true, 236), 0.6, { metalness: 0.7, roughness: 0.45 }),
      asphalt = k.pbr('vzRoad', X.asphalt(0x2a2d31), 0.11),
      cable = k.flat(0x3a3a3c, 0.6, 0.55),
      white = k.flat(0xf4f0e8, 0, 0.6), blueL = k.flat(0x1e56b4, 0, 0.6),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      water = k.flat(0x88aacc, 0.3, 0.2, { transparent: true, opacity: 0.6 });
    const RIVER = -70, TZ = [-90, 90];
    // the Narrows, both shores, the fort, Bay Ridge, the fireboat
    k.water({ y: RIVER, color: 0x30506a, w: 800, d: 900, amp: 1.4 });
    k.box(300, 8, 120, 0, RIVER + 4, 230, k.pbr('vzShore', X.grass(0x4a6a3a, 109), 0.06));
    k.box(300, 8, 120, 0, RIVER + 4, -230, k.pbr('vzShoreS', X.grass(0x4a6a3a, 110), 0.06));
    k.skyline({ z: 260, count: 30, spacing: 10, scale: 1.6, base: RIVER + 8, seed: 237, lit: 0.2, glow: 0.4, tint: 0x8a7a6e, rows: 1 });
    k.mesh(new T.CylinderGeometry(18, 20, 10, 8), k.pbr('vzFort', X.ashlar(0x7a7268, 238, 2), 0.2), -60, RIVER + 13, -200);
    k.skyline({ z: -420, count: 40, spacing: 9, scale: 3.6, base: RIVER, seed: 239, lit: 0.2, glow: 0.4, tint: 0x7a8494, x: 140, rows: 1, spires: true });
    const boat = new T.Group(); const bh = new T.Mesh(new T.BoxGeometry(6, 2.4, 20), k.flat(0xc62828, 0.2, 0.6)); bh.position.y = 1; boat.add(bh); const bc = new T.Mesh(new T.BoxGeometry(4, 2.4, 8), white); bc.position.set(0, 3.2, 0); boat.add(bc); for (let i = 0; i < 3; i++) { const jet = new T.Mesh(new T.CylinderGeometry(0.1, 0.6, 14, 6), water); jet.position.set(-2 + i * 2, 9, -2); jet.rotation.z = (i - 1) * 0.5; boat.add(jet); } k.add(boat);
    if (!ctx.reduced) k.rider(boat, k.spline([v(-80, RIVER + 0.3, 20), v(0, RIVER + 0.3, 50), v(80, RIVER + 0.3, 20), v(0, RIVER + 0.3, -10)], true), 2.5, 0);
    const heli = new T.Group(); const hb = new T.Mesh(new T.BoxGeometry(2.4, 2, 6), dark); heli.add(hb); const rotor = new T.Mesh(new T.BoxGeometry(0.3, 0.06, 10), dark); rotor.position.y = 1.4; heli.add(rotor); k.add(heli);
    if (!ctx.reduced) { k.rider(heli, k.spline([v(-120, 60, -60), v(60, 70, -120), v(140, 55, 60), v(-40, 65, 120)], true), 14, 0); k.ticks.push((t) => { rotor.rotation.y = t * 20; }); }
    // the bridge: two towers, the upper deck, the main cables and suspenders
    k.box(36, 3, 600, 0, -1.5, 0, steel);
    k.box(32, 0.3, 600, 0, 0.1, 0, asphalt);
    // the upper deck carries seven lanes, so six dashed lines
    for (let z = -290; z <= 290; z += 8) for (let l = 1; l < 7; l++) k.box(0.2, 0.012, 3, -16 + l * (32 / 7), 0.28, z, white);
    for (const s of [-1, 1]) { k.box(1.2, 1.2, 600, s * 16.6, 0.6, 0, k.pbr('vzCurb', X.concrete(0x9a9a94, 111), 0.3)); k.rail(s * 16.6, 0, 600, dark, 1.2, 'z', 3); k.block(s * 16.6 - 1, s * 16.6 + 1, -300, 300); }
    for (const tz of TZ) { for (const s of [-1, 1]) { k.box(6, 130, 8, s * 14, RIVER + 65, tz, steel); for (let y = 10; y < 130; y += 24) k.box(28, 4, 8, 0, RIVER + y, tz, steel); } k.box(34, 6, 10, 0, RIVER + 132, tz, steel); k.block(-17, -11, tz - 4.5, tz + 4.5); k.block(11, 17, tz - 4.5, tz + 4.5); }
    const sag = (z: number, z0: number, z1: number, top: number, low: number) => { const t = (z - z0) / (z1 - z0); return low + (top - low) * (2 * t - 1) ** 2; };
    // four main cables, a pair on each side
    for (const x of [-15.6, -14.4, 14.4, 15.6]) { const mid: T.Vector3[] = []; for (let z = TZ[0]; z <= TZ[1]; z += 6) mid.push(v(x, sag(z, TZ[0], TZ[1], RIVER + 132, 3.5), z)); k.curve(mid, 0.4, cable, 30); for (let z = TZ[0] + 6; z < TZ[1]; z += 6) k.beam(v(x, sag(z, TZ[0], TZ[1], RIVER + 132, 3.5), z), v(x, 0.6, z), 0.05, cable, 3); for (const d of [-1, 1]) { const back: T.Vector3[] = []; for (let i = 0; i <= 10; i++) back.push(v(x, RIVER + 132 - (i / 10) ** 1.2 * (RIVER + 132 - 1), (d < 0 ? TZ[0] : TZ[1]) + d * i * 20)); k.curve(back, 0.4, cable, 10); for (let i = 1; i < 10; i++) k.beam(v(x, RIVER + 132 - (i / 10) ** 1.2 * (RIVER + 132 - 1), (d < 0 ? TZ[0] : TZ[1]) + d * i * 20), v(x, 0.6, (d < 0 ? TZ[0] : TZ[1]) + d * i * 20), 0.05, cable, 3); } }
    // the runners: a river of figures pouring toward Brooklyn, the start banner behind, the timing mats
    const lanes = [-12, -8, -4, 0, 4, 8, 12];
    lanes.forEach((x, i) => k.crowd([v(x, 0.3, -280), v(x + (i % 2 ? 1 : -1), 0.3, 0), v(x, 0.3, 280)], 60, { seed: 91 + i, speed: 3.2, spread: 3.6, animate: !ctx.reduced, colors: [0xf4f0e8, 0xf08a2a, 0x3a8ad8, 0xd83a6a, 0xf1c531, 0x3aa06a, 0x24262c, 0x8a3ad8, 0xe83a3a] }));
    k.box(34, 0.02, 2, 0, 0.3, -200, blueL); k.box(34, 0.02, 2, 0, 0.3, 60, blueL);
    for (const s of [-1, 1]) k.box(0.3, 8, 0.3, s * 15, 4, -200, steel); k.box(30.6, 1.6, 0.3, 0, 8, -200, dark);
    k.sign('START  ·  26.2 MILES  ·  FIVE BOROUGHS', 28, 1.4, 0, 8, -199.8, '#1a1c20', '#f4f0e8', 120, 0, { border: true });
    for (const s of [-1, 1]) k.box(0.3, 8, 0.3, s * 15, 4, 60, steel); k.box(30.6, 1.6, 0.3, 0, 8, 59.8, dark);
    k.sign('MILE 1  ·  WELCOME TO BROOKLYN', 28, 1.4, 0, 8, 59.6, '#1a1c20', '#f1c531', 120, PI, { border: true });
    k.censusWall({ x: -15.98, y: 2.6, z: 0, rotY: PI / 2, cols: 40, rows: 3, tile: 0.55, gap: 0.05, start: ctx.wallStart(6200, 120), pieces: ctx.all, backing: dark });
    k.box(0.3, 5, 24, -16.2, 2.5, 0, dark);
    // the works: on the tower legs at deck level both sides of both towers, on the curb line light boxes
    const mounts: Mount[] = [];
    for (const tz of TZ) for (const s of [-1, 1]) for (const d of [-1, 1]) mounts.push({ position: v(s * 10.95, 4, tz + d * 4.02), rotation: d > 0 ? 0 : PI, target: v(s * 4, 3, tz + d * 14), width: 4.6, height: 2.7, style: 'steel', wash: false });
    for (let i = 0; i < 10; i++) { const z = -180 + i * 40; const s = i % 2 ? 1 : -1; if (Math.abs(z - TZ[0]) < 8 || Math.abs(z - TZ[1]) < 8) continue; k.box(0.3, 3.2, 4.6, s * 15.9, 2.6, z, dark); mounts.push({ position: v(s * 15.72, 2.7, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 2.5, z), width: 4.2, height: 2.5, style: 'steel', wash: false }); }
    // landmark eggs
    k.egg(v(-11.5, 3, TZ[1] - 5), { id: 'marathon-curvature', title: 'Towers that lean apart', year: '1964', text: 'The two towers are 693 feet tall and not parallel: their tops are one and five eighths inches farther apart than their bases, to allow for the curvature of the Earth.', clue: 'Stand at the foot of the Brooklyn tower and look up its leg.', source: { name: 'Verrazzano Narrows Bridge, Wikipedia', url: 'https://en.wikipedia.org/wiki/Verrazzano-Narrows_Bridge' } }, { r: 1.8 });
    k.egg(v(-15, 4.6, 0), { id: 'marathon-cables', title: '142,520 miles of wire', text: 'The bridge hangs from four main cables, each 36 inches across. Each cable holds 26,108 wires, and all the wire together runs 142,520 miles.', clue: 'At mid span, find where the main cables dip lowest beside the railing.', source: { name: 'Verrazzano Narrows Bridge, Wikipedia', url: 'https://en.wikipedia.org/wiki/Verrazzano-Narrows_Bridge' } }, { r: 1.6 });
    k.egg(v(0, 8, -199.6), { id: 'marathon-1970', title: '127 runners in the park', year: '1970', text: 'The first New York City Marathon, on September 13, 1970, ran laps of Central Park: 127 runners started and 55 finished. The course first covered all five boroughs in 1976, for the bicentennial. The 2012 race was cancelled after Hurricane Sandy.', clue: 'Look up at the start banner.', source: { name: 'New York City Marathon, Wikipedia', url: 'https://en.wikipedia.org/wiki/New_York_City_Marathon' } }, { r: 2 });
    k.egg(v(-4, 1.5, -120), { id: 'marathon-decks', title: 'Both decks, closed', text: 'The race starts at Fort Wadsworth on Staten Island. The bridge is closed to traffic and runners use both sides of the upper level and the westbound lower level. In 2025 the race had 59,135 finishers, the largest marathon anywhere in the world.', clue: 'Run with the crowd on the upper deck.', source: { name: 'New York City Marathon, Wikipedia', url: 'https://en.wikipedia.org/wiki/New_York_City_Marathon' } }, { r: 2 });
    k.egg(v(12, 1.2, 24), { id: 'marathon-summer', title: 'Twelve feet lower in summer', text: 'The steel cables expand in the heat, so the upper roadway hangs about 12 feet lower in summer than in winter. Ships pass with 228 feet of clearance at mean high water.', clue: 'Look over the railing at mid span and down to the water.', source: { name: 'Verrazzano Narrows Bridge, Wikipedia', url: 'https://en.wikipedia.org/wiki/Verrazzano-Narrows_Bridge' } }, { r: 1.6 });
    k.egg(v(0, 8, 59.6), { id: 'marathon-zz', title: 'The second z', year: '2018', text: 'The upper deck opened on November 21, 1964, and its 4,260 foot main span was the longest suspension span in the world until the Humber Bridge in 1981. The name was spelled with one z until a 2018 state law added the second one.', clue: 'Read the mile one banner over the road.', source: { name: 'Verrazzano Narrows Bridge, Wikipedia', url: 'https://en.wikipedia.org/wiki/Verrazzano-Narrows_Bridge' } }, { r: 2 });
    return { mounts, spawn: v(-14, 3, -170), look: v(0, 30, 90), eye: 3, bounds: [-15.4, 15.4, -260, 260], style: 'steel' };
  },
};

/* ---------------- 79 THE HALLOWEEN PARADE ---------------- */
export const halloween: RoomDef = {
  id: 'halloween',
  name: 'Sixth Avenue after dark',
  area: 'THE VILLAGE HALLOWEEN PARADE',
  mood: 'October 31, eight p.m.',
  color: '#f08a2a',
  description: 'The avenue closed from Spring to 16th: giant puppets swaying over the crowd, skeletons on poles, drummers, fifty thousand marchers in costume and two million watching, the works lit on the building fronts.',
  signatures: 'Enormous rod puppets carried above the marchers, skeleton banners, drum corps, floats with lit skulls, spectators ten deep behind barricades, the avenue lit orange from end to end, the Jefferson Market clock tower.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x0e0a1c, horizon: 0x3a1a34, ground: 0x0a0a0e, fog: 0.003, stars: 220, env: 0.55 });
    k.hemi(0xffb070, 0x1a1418, 0.5);
    const dark = k.flat(0x1a1c20, 0.5, 0.6),
      black = k.flat(0x0a0a0c, 0.3, 0.8),
      orange = k.glow(0xff8a2a), purple = k.glow(0x8a3ad8), green = k.glow(0x4ad86a),
      bone = k.flat(0xf4f0e8, 0, 0.7),
      sheet = k.flat(0xf4f0e8, 0, 0.9, { side: T.DoubleSide }),
      brick = k.pbr('hwBrick', X.brick(0x8a4a3a, 240), 0.28),
      steel = k.flat(0x8c98a4, 0.9, 0.3),
      cloth = [k.flat(0xf08a2a, 0, 0.8), k.flat(0x8a3ad8, 0, 0.8), k.flat(0x3aa06a, 0, 0.8), k.flat(0xe83a3a, 0, 0.8)];
    // the avenue, the blocks, the courthouse tower
    street(k, { w: 24, len: 200, z: 0, x: 0 });
    blockFront(k, { x: -13, z0: 100, count: 24, face: 1, seed: 241, h: [12, 22] });
    blockFront(k, { x: 13, z0: 100, count: 24, face: -1, seed: 242, h: [12, 22] });
    k.box(10, 40, 10, -22, 20, -60, brick); k.mesh(new T.ConeGeometry(7, 10, 6), k.pbr('hwSlate', X.steel(0x3a3a40, false, 243), 0.4), -22, 45, -60); k.mesh(new T.CircleGeometry(2, 24), k.glow(0xffe8b0), -16.95, 32, -60).rotation.y = PI / 2;
    for (let z = 90; z >= -90; z -= 20) for (const s of [-1, 1]) { k.lamp(s * 13.5, z, 6.2, dark, 0xff9a50, 30); for (let i = 0; i < 6; i++) k.sphere(0.12, s * 13.4, 4 + i * 0.5, z + 1 + (i % 2) * 0.4, i % 2 ? orange : purple, 5); }
    for (let z = 96; z >= -96; z -= 2.4) for (const s of [-1, 1]) { k.box(2.2, 1.0, 0.06, s * 11.5, 0.55, z, steel); for (const dx of [-1.05, 1.05]) k.box(0.06, 1.05, 0.06, s * 11.5 + dx, 0.52, z, steel); }
    // the puppets: rod puppets on poles carried up the avenue, swaying; skeleton banners; a float with a skull
    const puppet = (kind: number) => { const g = new T.Group(); const pole = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 7, 6), dark); pole.position.y = 3.5; g.add(pole); const body = new T.Mesh(new T.ConeGeometry(1.8, 4, 8, 1, true), cloth[kind % 4]); body.position.y = 6.2; g.add(body); const head = new T.Mesh(new T.SphereGeometry(0.9, 12, 8), bone); head.position.y = 8.8; g.add(head); const e1 = new T.Mesh(new T.SphereGeometry(0.2, 6, 5), black); e1.position.set(-0.3, 8.9, 0.8); g.add(e1); const e2 = e1.clone(); e2.position.x = 0.3; g.add(e2); for (const s of [-1, 1]) { const arm = new T.Mesh(new T.CylinderGeometry(0.12, 0.2, 3.4, 6), cloth[(kind + 1) % 4]); arm.position.set(s * 2.2, 7.4, 0); arm.rotation.z = s * 1.1; g.add(arm); const hand = new T.Mesh(new T.SphereGeometry(0.35, 8, 6), bone); hand.position.set(s * 3.6, 8.4, 0); g.add(hand); } return g; };
    const puppets: T.Group[] = [];
    for (let i = 0; i < 7; i++) { const g = puppet(i); g.position.set(-6 + (i % 3) * 6, 0, -80 + i * 24); k.add(g); puppets.push(g); }
    if (!ctx.reduced) k.ticks.push((t, dt) => puppets.forEach((g, i) => { g.position.z -= 0.9 * Math.min(dt, 0.1); if (g.position.z < -100) g.position.z = 100; g.rotation.z = 0.18 * Math.sin(t * 1.2 + i); g.rotation.x = 0.1 * Math.sin(t * 0.9 + i * 2); }));
    const skel = (x: number, z: number) => { const g = new T.Group(); const pole = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 5, 6), dark); pole.position.y = 2.5; g.add(pole); const skull = new T.Mesh(new T.SphereGeometry(0.4, 10, 8), bone); skull.position.y = 5.2; g.add(skull); const ribs = new T.Mesh(new T.BoxGeometry(0.9, 1.4, 0.3), bone); ribs.position.y = 4.2; g.add(ribs); for (const s of [-1, 1]) { const a = new T.Mesh(new T.BoxGeometry(0.14, 1.4, 0.14), bone); a.position.set(s * 0.7, 4.4, 0); a.rotation.z = s * 0.6; g.add(a); const l = new T.Mesh(new T.BoxGeometry(0.14, 1.4, 0.14), bone); l.position.set(s * 0.3, 2.8, 0); g.add(l); } g.position.set(x, 0, z); k.add(g); return g; };
    const skels: T.Group[] = []; for (let i = 0; i < 12; i++) skels.push(skel(-9 + (i % 4) * 6, 60 - i * 14));
    if (!ctx.reduced) k.ticks.push((t, dt) => skels.forEach((g, i) => { g.position.z -= 0.9 * Math.min(dt, 0.1); if (g.position.z < -100) g.position.z = 100; g.rotation.y = 0.4 * Math.sin(t * 2 + i); g.children.forEach((c, j) => { if (j >= 3) c.rotation.z = (j % 2 ? 1 : -1) * 0.6 * Math.sin(t * 3 + i + j); }); }));
    const float = new T.Group(); const bed = new T.Mesh(new T.BoxGeometry(5, 1.4, 11), black); bed.position.y = 0.9; float.add(bed); const skull = new T.Mesh(new T.SphereGeometry(2.4, 16, 12), bone); skull.position.set(0, 4.2, 0); float.add(skull); const jaw = new T.Mesh(new T.BoxGeometry(2.4, 1.2, 1.6), bone); jaw.position.set(0, 2.4, 1.2); float.add(jaw); for (const s of [-1, 1]) { const eye = new T.Mesh(new T.SphereGeometry(0.6, 10, 8), orange); eye.position.set(s * 0.9, 4.6, 2.1); float.add(eye); } for (let i = 0; i < 12; i++) { const b = new T.Mesh(new T.SphereGeometry(0.14, 6, 5), i % 2 ? orange : green); b.position.set(-2.4 + (i % 6) * 0.96, 1.7, i < 6 ? 5.5 : -5.5); float.add(b); } float.position.set(0, 0, 20); k.add(float);
    const eyeL = k.point(0, 5, 22, 0xff8a2a, 40, 20);
    if (!ctx.reduced) k.ticks.push((t, dt) => { float.position.z -= 0.9 * Math.min(dt, 0.1); if (float.position.z < -100) float.position.z = 100; eyeL.position.z = float.position.z + 2; eyeL.intensity = 30 + 20 * Math.sin(t * 5); });
    const drums = k.crowd([v(-3, 0, 100), v(-3, 0, -100)], 12, { seed: 98, speed: 0.9, spread: 3, animate: !ctx.reduced, colors: [0x151517, 0xe83a3a, 0x151517] });
    void drums;
    k.crowd([v(0, 0, 100), v(0, 0, -100)], 60, { seed: 99, speed: 0.9, spread: 8, animate: !ctx.reduced, colors: [0xf08a2a, 0x8a3ad8, 0x3aa06a, 0xe83a3a, 0x151517, 0xf4f0e8, 0xf1c531] });
    k.crowd([v(-12.8, 0, 100), v(-12.8, 0, -100)], 50, { seed: 100, speed: 0.1, spread: 1.8, animate: !ctx.reduced, colors: [0x24262c, 0x151517, 0xf08a2a, 0x8a3ad8] });
    k.crowd([v(12.8, 0, 100), v(12.8, 0, -100)], 50, { seed: 101, speed: 0.1, spread: 1.8, animate: !ctx.reduced, colors: [0x24262c, 0x151517, 0xf08a2a, 0x3aa06a] });
    for (let i = 0; i < 40; i++) { const rnd = X.mulberry(79 + i); const x = -10 + rnd() * 20, z = -90 + rnd() * 180; const gh = k.mesh(new T.ConeGeometry(0.5, 1.4, 8, 1, true), sheet, x, 9 + rnd() * 4, z, true); gh.userData.p = rnd() * 6; if (!ctx.reduced) k.ticks.push((t) => { gh.position.y = 9 + 2 * Math.sin(t * 0.7 + gh.userData.p); gh.position.x = x + Math.sin(t * 0.4 + gh.userData.p) * 2; }); }
    k.censusWall({ x: -12.66, y: 3.4, z: 0, rotY: PI / 2, cols: 40, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(6600, 160), pieces: ctx.all, backing: dark });
    k.box(0.3, 6, 24, -12.9, 3, 0, dark);
    for (let z = 80; z >= -80; z -= 40) k.point(0, 10, z, 0xff9a50, 40, 30);
    // the works: lit on the building fronts above the crowd both sides, the barricade light boxes
    const mounts: Mount[] = [];
    for (let i = 0; i < 12; i++) { const z = 88 - i * 16; const s = i % 2 ? 1 : -1; if (s < 0 && Math.abs(z) < 14) continue; k.box(0.2, 3.4, 4.8, s * 12.7, 6.0, z, dark); mounts.push({ position: v(s * 12.55, 6.0, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 3, z), width: 4.2, height: 2.6, style: 'neon', wash: true }); }
    for (let i = 0; i < 6; i++) { const z = 70 - i * 28; const s = i % 2 ? 1 : -1; k.box(0.14, 2.2, 3.2, s * 11.3, 1.9, z, dark); mounts.push({ position: v(s * 11.2, 2.0, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(0, 2, z), width: 2.8, height: 1.7, style: 'black', wash: false }); }
    for (let i = 0; i < 4; i++) { const x = -8 + i * 5.4; mounts.push({ position: v(x, 4, -99.66), rotation: 0, target: v(x, 3, -90), width: 4.4, height: 2.6, style: 'neon', wash: true }); }
    k.box(26, 10, 0.6, 0, 5, -100, brick); k.block(-13, 13, -100.6, -99.4);
    // landmark eggs
    k.egg(v(0, 8, 70), { id: 'halloween-ralphlee', title: 'A puppeteer\'s idea', year: '1974', text: 'The parade was started by the puppeteer and mask maker Ralph Lee on October 31, 1974, in Greenwich Village. Large puppets carried by hundreds of volunteers are still its signature, and Processional Arts Workshop have been its official puppet designers since 1998.', clue: 'Look up at the first giant puppet coming up the avenue.', source: { name: 'Village Halloween Parade, Wikipedia', url: 'https://en.wikipedia.org/wiki/Village_Halloween_Parade' } }, { r: 2.4 });
    k.egg(v(10.6, 1.2, 40), { id: 'halloween-nighttime', title: 'Just show up', text: 'It is billed as the largest Halloween parade in the world and the only major nighttime parade in the United States, with about 50,000 costumed marchers and 2 million spectators. Anyone in costume can join at the start without registering or paying.', clue: 'Lean on the barricade with the spectators.', source: { name: 'Village Halloween Parade, Wikipedia', url: 'https://en.wikipedia.org/wiki/Village_Halloween_Parade' } }, { r: 1.6 });
    k.egg(v(-13.5, 6.2, 10), { id: 'halloween-sandy', title: 'The year the lights went out', year: '2012', text: 'The parade was cancelled in 2012 after Hurricane Sandy left Greenwich Village without electricity, and again in 2020 because of the pandemic.', clue: 'Find a streetlamp on the west side of the avenue.', source: { name: 'Village Halloween Parade, Wikipedia', url: 'https://en.wikipedia.org/wiki/Village_Halloween_Parade' } }, { r: 1.6 });
    k.egg(v(-3, 2.4, -20), { id: 'halloween-bands', title: 'Fifty bands', text: 'More than 50 marching bands play the parade each year. It usually steps off at 7 PM on Halloween night and lasts two to three hours.', clue: 'Walk with the drummers in the middle of the avenue.', source: { name: 'Village Halloween Parade, Wikipedia', url: 'https://en.wikipedia.org/wiki/Village_Halloween_Parade' } }, { r: 2 });
    k.egg(v(-8, 3, 96), { id: 'halloween-route', title: 'Spring to 16th', text: 'The parade runs up Sixth Avenue from Spring Street to 16th Street, about 1.4 miles, with Jeanne Fleming as its artistic and producing director.', clue: 'Turn around at the south end of the avenue where it begins.', source: { name: 'Village Halloween Parade, Wikipedia', url: 'https://en.wikipedia.org/wiki/Village_Halloween_Parade' } }, { r: 2 });
    k.egg(v(-16.9, 32, -60), { id: 'halloween-oljeff', title: 'Ol\' Jeff', year: '1877', text: 'The clock tower belongs to the Jefferson Market Library, built from 1874 to 1877 as a courthouse to a design by Frederick Clarke Withers. It held the country\'s first night court and became a library in 1967. Its fire bell, Ol\' Jeff, regained its voice in 1996 after 135 years of silence and strikes the hours from 9 am to 10 pm.', clue: 'Look west over the rooftops for the clock tower.', source: { name: 'Jefferson Market Library, Wikipedia', url: 'https://en.wikipedia.org/wiki/Jefferson_Market_Library' } }, { r: 2.4 });
    return { mounts, spawn: v(6, 3, 92), look: v(-2, 8, -20), eye: 3, bounds: [-11, 11, -98, 98], style: 'neon' };
  },
};

/* ---------------- 80 EASTERN PARKWAY ---------------- */
export const easternparkway: RoomDef = {
  id: 'easternparkway',
  name: 'The parkway on Labor Day',
  area: 'GRAND ARMY PLAZA',
  mood: 'Carnival Monday',
  color: '#f1c531',
  description: 'The triumphal arch at the head of the parkway, the museum and the library beside it, the West Indian parade coming up under the elms: feathered masqueraders, sound trucks, flags of every island, the works on the arch.',
  signatures: 'The Soldiers and Sailors arch with its bronze quadriga, the oval plaza with the fountain, the columned Beaux Arts museum, the library shaped like an open book with its gilded doorway, the six lane parkway with elm malls, the costumes and the trucks.',
  build(k, ctx) {
    k.sky({ top: 0x5f94d8, horizon: 0xf0ecdc, ground: 0x5a5a48, fog: 0.0018, sun: { az: 3.1, el: 0.95, color: 0xfff6e8, size: 12 }, env: 1.0 });
    k.hemi(0xf6f6ff, 0x5a5048, 1.0);
    k.sun(0xfff2dc, 2.6, 10, 90, 40, true, 120);
    const granite = k.pbr('epGranite', X.ashlar(0xa8a090, 244, 3), 0.22),
      lime = k.pbr('epLime', X.ashlar(0xd8d0bc, 245, 3), 0.22),
      bronze = k.flat(0x3a4a3a, 0.7, 0.45),
      gold = k.pbr('epGold', X.gilt(0xd0a852), 2, { metalness: 0.85, roughness: 0.3 }),
      lawn = k.pbr('epLawn', X.grass(0x4a7a3a, 112), 0.06),
      asphalt = k.pbr('epRoad', X.asphalt(0x2a2d31), 0.11),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      feathers = [0xf1c531, 0xe83a3a, 0x3a8ad8, 0x3aa06a, 0xf05aa0, 0xf08a2a, 0x8a3ad8, 0xf4f0e8].map((c) => k.flat(c, 0, 0.7));
    // the plaza oval, the arch, the fountain, the museum and the library, the parkway with its elm malls
    k.box(300, 0.4, 300, 0, -0.2, 0, lawn);
    k.mesh(new T.CylinderGeometry(50, 50, 0.5, 64), asphalt, 0, 0.05, -20).scale.set(1, 1, 0.8);
    k.mesh(new T.CylinderGeometry(30, 30, 0.6, 64), k.pbr('epPave', X.pavers(0x9a9a94, 113), 0.4), 0, 0.15, -20).scale.set(1, 1, 0.8);
    const AX = 0, AZ = -20;
    /* The arch is 80 ft (24 m) high with a 50 ft (15 m) by 35 ft opening, so the piers, attic and
       cornice are cut down from a 31 m top to 24 m, and MacMonnies' quadriga sits on the cornice. */
    const DY = -6.5;
    for (const s of [-1, 1]) { k.box(8, 24 + DY + 0.5, 8, AX + s * 9, (24 + DY + 0.5) / 2, AZ, granite); k.box(8.6, 1.2, 8.6, AX + s * 9, 24.6 + DY, AZ, granite); }
    k.arch(10, 15.2, 8, AX, 0, AZ, granite, false, 0.8);
    k.box(26, 6, 8, AX, 27 + DY, AZ, granite);
    k.box(27, 0.8, 9, AX, 30.4 + DY, AZ, lime);
    for (let i = 0; i < 4; i++) k.box(1.2, 2.2, 3, AX - 6 + i * 4, 32 + DY, AZ - 1, bronze); const quad = k.box(4, 3, 3, AX, 32.4 + DY, AZ + 1, bronze); k.cyl(0.4, 2, AX, 34.4 + DY, AZ + 1, bronze, 0.3, 8); k.sphere(0.5, AX, 35.6 + DY, AZ + 1, bronze, 8); k.beam(v(AX, 35.6 + DY, AZ + 1), v(AX + 3, 37 + DY, AZ + 1), 0.08, bronze, 4);
    k.block(AX - 13, AX - 5, AZ - 4, AZ + 4); k.block(AX + 5, AX + 13, AZ - 4, AZ + 4);
    k.sign('TO THE DEFENDERS OF THE UNION  ·  1861  ·  1865', 16, 0.8, AX, 29.4 + DY, AZ + 4.06, 'transparent', '#e8dcc0', 70, 0);
    k.point(AX, 12, AZ, 0xfff0e0, 20, 16);
    k.mesh(new T.CylinderGeometry(6, 6.4, 0.9, 32), granite, 0, 0.45, -60); k.mesh(new T.CylinderGeometry(5.4, 5.4, 0.3, 32), k.flat(0x88aacc, 0.3, 0.2, { transparent: true, opacity: 0.6 }), 0, 0.95, -60); k.keepOut.push({ x: 0, z: -60, r: 6.6 });
    const jets: T.Mesh[] = []; for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; jets.push(k.mesh(new T.CylinderGeometry(0.05, 0.14, 4, 6), k.flat(0x88aacc, 0.3, 0.2, { transparent: true, opacity: 0.6 }), Math.cos(a) * 3, 3, -60 + Math.sin(a) * 3, true)); }
    if (!ctx.reduced) k.ticks.push((t) => jets.forEach((j, i) => { j.scale.y = 0.6 + 0.4 * Math.sin(t * 1.4 + i); }));
    /* The Brooklyn Museum and the Central Library are both on the south side of Eastern Parkway
       (minus x here, with the parkway running east along plus z). The museum used to stand on the
       north side facing the plaza; it now fronts the parkway further east, its colonnade facing north. */
    const MX = -60, MZ = 110;
    const museum = k.box(40, 22, 50, MX, 11, MZ, lime); for (let i = 0; i < 8; i++) k.column(MX + 20.5, 0, MZ - 22 + i * 6.3, 16, 1.0, lime, true); k.box(4, 3, 52, MX + 20.5, 17.5, MZ, lime); k.mesh(new T.SphereGeometry(10, 24, 12, 0, PI * 2, 0, PI / 2), k.flat(0x5a6a5a, 0.3, 0.6), MX, 22, MZ); k.block(MX - 20, MX + 22, MZ - 26, MZ + 26);
    k.sign('BROOKLYN MUSEUM', 10, 1.0, MX + 22.6, 19.6, MZ, 'transparent', '#5a5040', 90, PI / 2);
    const LX = -60, LZ = 30;
    const book = new T.Shape(); book.moveTo(-24, -14); book.lineTo(24, -14); book.lineTo(4, 14); book.lineTo(-4, 14); book.closePath();
    const bg = new T.ExtrudeGeometry(book, { depth: 16, bevelEnabled: false }); bg.rotateX(-PI / 2); k.mesh(bg, lime, LX, 0, LZ + 14);
    k.box(6, 14, 0.8, LX, 7, LZ - 14 + 0.2, gold); for (let i = 0; i < 12; i++) k.box(0.8, 0.8, 0.2, LX - 2 + (i % 4) * 1.3, 3 + Math.floor(i / 4) * 3, LZ - 14 - 0.3, gold);
    k.block(LX - 25, LX + 25, LZ - 15, LZ + 15);
    k.sign('BROOKLYN PUBLIC LIBRARY', 10, 1.0, LX, 15, LZ - 14 - 0.4, 'transparent', '#5a5040', 90, PI);
    k.box(40, 0.3, 200, 0, 0.05, 120, asphalt);
    for (const s of [-1, 1]) { k.box(10, 0.3, 200, s * 26, 0.05, 120, k.pbr('epMall', X.pavers(0x8e8b84, 114), 0.42)); for (let z = 30; z < 220; z += 14) k.tree(s * 26, 0, z, { kind: 'round', h: 12, r: 6, leaf: 0x4a7a3c, seed: z, species: 'elm' }); } /* Olmsted planted elms along the main road */
    for (const s of [-1, 1]) for (let z = 30; z < 220; z += 2.4) { k.box(2.2, 1.0, 0.06, s * 20.5, 0.55, z, dark); }
    // the parade: masqueraders in feathers and a sound truck rolling up the parkway toward the arch, flags on the malls
    const mas = (x: number, z: number, i: number) => { const g = new T.Group(); const body = new T.Mesh(new T.CapsuleGeometry(0.22, 0.9, 3, 8), k.flat(0x4a2a1a, 0, 0.8)); body.position.y = 0.9; g.add(personTag(body, 'auto', 1.25)); const head = new T.Mesh(new T.SphereGeometry(0.14, 8, 6), k.flat(0x5a3a26, 0, 0.7)); head.position.y = 1.7; g.add(personTag(head, 'part')); const n = 14 + (i % 3) * 6; for (let f = 0; f < n; f++) { const a = -PI * 0.15 + (f / (n - 1)) * PI * 1.3; const plume = new T.Mesh(new T.ConeGeometry(0.16, 2.4 + (f % 3) * 0.6, 5), feathers[(i + f) % 8]); plume.position.set(Math.cos(a) * 1.8, 1.6 + Math.sin(a) * 1.8, -0.4); plume.rotation.z = -a + PI / 2; g.add(plume); } for (let f = 0; f < 8; f++) { const a = (f / 8) * PI * 2; const p2 = new T.Mesh(new T.ConeGeometry(0.1, 1.2, 5), feathers[(i + f + 3) % 8]); p2.position.set(Math.cos(a) * 0.4, 2.0, Math.sin(a) * 0.4); p2.rotation.z = -Math.cos(a) * 0.5; p2.rotation.x = Math.sin(a) * 0.5; g.add(p2); } g.position.set(x, 0, z); k.add(g); return g; };
    const dancers: T.Group[] = []; for (let i = 0; i < 12; i++) dancers.push(mas(-14 + (i % 4) * 9.3, 60 + Math.floor(i / 4) * 16, i));
    if (!ctx.reduced) k.ticks.push((t, dt) => dancers.forEach((g, i) => { g.position.z -= 0.9 * Math.min(dt, 0.1); if (g.position.z < -14) g.position.z = 210; g.rotation.y = Math.sin(t * 2 + i) * 0.6; g.position.y = 0.15 * Math.abs(Math.sin(t * 4 + i)); }));
    const truck = new T.Group(); const cabT = new T.Mesh(new T.BoxGeometry(2.6, 2.6, 3), k.flat(0xe83a3a, 0.2, 0.6)); cabT.position.set(0, 1.6, 6); truck.add(cabT); const bedT = new T.Mesh(new T.BoxGeometry(2.6, 1.2, 10), dark); bedT.position.set(0, 0.8, -1); truck.add(bedT); for (let i = 0; i < 8; i++) { const sp = new T.Mesh(new T.BoxGeometry(1.1, 1.1, 1.1), k.flat(0x0a0a0c, 0.3, 0.8)); sp.position.set(-0.75 + (i % 2) * 1.5, 2 + Math.floor(i / 2) * 1.15, -3 + (i % 2) * 0); truck.add(sp); const cone = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.05, 14), k.flat(0x2a2a2e, 0.4, 0.5)); cone.position.set(-0.75 + (i % 2) * 1.5, 2 + Math.floor(i / 2) * 1.15, -2.42); cone.rotation.x = PI / 2; truck.add(cone); } for (let i = 0; i < 4; i++) { const fl = new T.Mesh(new T.PlaneGeometry(0.8, 0.5), feathers[i], ); fl.position.set(-1.2 + i * 0.8, 6.4, -1); truck.add(fl); const pole = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 3, 4), dark); pole.position.set(-1.6 + i * 0.8, 5.2, -1); truck.add(pole); } truck.position.set(0, 0, 120); k.add(truck);
    if (!ctx.reduced) k.ticks.push((_t, dt) => { truck.position.z -= 0.9 * Math.min(dt, 0.1); if (truck.position.z < -14) truck.position.z = 210; truck.children.forEach((c, j) => { if (j >= 2 && j < 18 && j % 2 === 1) { const s = 1 + 0.06 * Math.max(0, Math.sin(_t * 7 + j)); c.scale.set(s, s, 1); } }); });
    k.crowd([v(-8, 0, 210), v(-8, 0, -12)], 40, { seed: 102, speed: 0.9, spread: 5, animate: !ctx.reduced, colors: [0xf1c531, 0xe83a3a, 0x3a8ad8, 0x3aa06a, 0xf05aa0, 0xf08a2a, 0xf4f0e8, 0x151517] });
    k.crowd([v(8, 0, 210), v(8, 0, -12)], 40, { seed: 103, speed: 0.9, spread: 5, animate: !ctx.reduced, colors: [0xf1c531, 0xe83a3a, 0x3a8ad8, 0x3aa06a, 0xf05aa0, 0xf08a2a, 0xf4f0e8, 0x151517] });
    for (const s of [-1, 1]) k.crowd([v(s * 23, 0, 210), v(s * 23, 0, 30)], 50, { seed: 104 + s, speed: 0.15, spread: 3, animate: !ctx.reduced });
    for (const s of [-1, 1]) for (let z = 40; z < 220; z += 28) { k.box(0.06, 5, 0.06, s * 21.5, 2.5, z, dark); k.box(1.4, 0.9, 0.02, s * 21.5 + s * 0.7, 4.6, z, feathers[(z / 28) % 8 | 0]); }
    k.censusWall({ x: AX, y: 5.4, z: AZ - 4.06, rotY: 0, cols: 20, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(5100, 80), pieces: ctx.all, backing: dark });
    // the works: the arch piers on both faces, the museum colonnade, the library front, the mall screens
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (const d of [-1, 1]) mounts.push({ position: v(AX + s * 9, 5, AZ + d * 4.06), rotation: d > 0 ? 0 : PI, target: v(AX + s * 4, 3, AZ + d * 16), width: 5, height: 3, style: 'gilt', wash: true });
    for (const s of [-1, 1]) mounts.push({ position: v(AX + s * 4.94, 4.4, AZ), rotation: s < 0 ? -PI / 2 : PI / 2, target: v(AX, 3, AZ), width: 3.4, height: 2.0, style: 'gilt', wash: false });
    for (let i = 0; i < 4; i++) { const z = MZ - 18 + i * 12; mounts.push({ position: v(MX + 21.66, 4, z), rotation: PI / 2, target: v(MX + 34, 3, z), width: 4.6, height: 2.7, style: 'steel', wash: true }); }
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const x = LX + s * (8 + i * 8); mounts.push({ position: v(x, 4, LZ - 14 - 0.36), rotation: PI, target: v(x, 3, LZ - 28), width: 4.4, height: 2.6, style: 'gilt', wash: true }); }
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = 50 + i * 40; k.box(0.3, 3.2, 4.6, s * 25, 2.0, z, dark); mounts.push({ position: v(s * (25 - s * 0.18), 2.1, z), rotation: s < 0 ? -PI / 2 : PI / 2, target: v(s * 12, 2, z), width: 4.2, height: 2.5, style: 'black', wash: false }); }
    // landmark eggs
    k.egg(v(AX, 16, AZ + 4.2), { id: 'easternparkway-arch', title: 'Eighty feet of granite', year: '1892', text: 'John H. Duncan won the design competition for the Soldiers\' and Sailors\' Arch. Its cornerstone was laid on October 30, 1889 and it was dedicated on October 21, 1892. It stands 80 feet high on a footprint of 80 by 50 feet, with an opening 50 feet tall and 35 feet wide, darker Quincy granite at the base and lighter granite above.', clue: 'Stand under the arch and look up at the top of the opening.', source: { name: 'Soldiers\' and Sailors\' Arch, Wikipedia', url: 'https://en.wikipedia.org/wiki/Soldiers%27_and_Sailors%27_Arch' } }, { r: 2.4 });
    k.egg(v(AX - 4.6, 8.4, AZ), { id: 'easternparkway-reliefs', title: 'A painter\'s horses', year: '1895', text: 'Inside the archway, bronze reliefs show Lincoln and Grant on horseback. The painter Thomas Eakins designed the horses and William Rudolf O\'Donovan the riders; the reliefs are dated 1893 to 1894 and were installed in 1895.', clue: 'Look at the inner walls of the archway, above the works.', source: { name: 'Soldiers\' and Sailors\' Arch, Wikipedia', url: 'https://en.wikipedia.org/wiki/Soldiers%27_and_Sailors%27_Arch' } }, { r: 1.6 });
    k.egg(quad, { id: 'easternparkway-quadriga', title: 'Stairs inside the piers', year: '1898', text: 'Each abutment hides a spiral stairway of iron steps leading to an observation deck on the roof, and the room in the attic over the opening was planned as a war museum. Frederick MacMonnies\' quadriga on top, about 25 feet tall, was in place by the end of 1898.', clue: 'Look up at the chariot on top of the arch.', source: { name: 'Soldiers\' and Sailors\' Arch, Wikipedia', url: 'https://en.wikipedia.org/wiki/Soldiers%27_and_Sailors%27_Arch' } }, { r: 2.6 });
    k.egg(v(-26, 4, 72), { id: 'easternparkway-first', title: 'The first parkway', year: '1874', text: 'Frederick Law Olmsted and Calvert Vaux built Eastern Parkway from 1870 to 1874, and the city credits it as the world\'s first parkway. Olmsted planted elms along the main road and mostly maples on the service roads, about 1,100 trees in all, and it became a scenic landmark on August 22, 1978.', clue: 'Walk the south mall under the elms.', source: { name: 'Eastern Parkway, Wikipedia', url: 'https://en.wikipedia.org/wiki/Eastern_Parkway' } }, { r: 2.2 });
    k.egg(v(0, 0.8, 150), { id: 'easternparkway-subway', title: 'Two decks of subway below', year: '1920', text: 'The IRT Eastern Parkway Line runs under the parkway; it opened in 1920 and most of its tunnel is double decked. On Labor Day the West Indian Day Parade fills the road above with an estimated one to three million people.', clue: 'Stand in the middle of the parkway with the parade.', source: { name: 'Eastern Parkway, Wikipedia', url: 'https://en.wikipedia.org/wiki/Eastern_Parkway' } }, { r: 2 });
    k.egg(v(0, 2.4, -60), { id: 'easternparkway-fountain', title: 'The fourth fountain', year: '1932', text: 'Olmsted and Vaux put the Fountain of the Golden Spray here in 1867. It was followed by a lighted fountain in 1873 and an exhibition fountain from 1897 to 1915, before the Bailey Fountain arrived in 1932; it was renovated in 2006.', clue: 'Walk past the arch to the fountain.', source: { name: 'Grand Army Plaza, Wikipedia', url: 'https://en.wikipedia.org/wiki/Grand_Army_Plaza' } }, { r: 2.2 });
    return { mounts, spawn: v(-6, 3, 60), look: v(AX, 20, AZ), eye: 3, /* easternparkway: six works stand out along the parkway at x 52 to 78, well outside the old strip */ bounds: [-84, 84, -70, 200], style: 'gilt' };
  },
};

/* ---------------- 81 MANHATTANHENGE ---------------- */
export const manhattanhenge: RoomDef = {
  id: 'manhattanhenge',
  name: 'The sun down 42nd',
  area: 'MANHATTANHENGE',
  mood: 'Two minutes before it drops',
  color: '#ff9a40',
  description: 'Forty second Street looking west from Tudor City: the sun setting exactly down the axis of the grid, the canyon lit gold, the crowd on the overpass and in the crosswalks, the works catching the last light.',
  signatures: 'The Tudor City overpass packed with people, the Chrysler crown catching the sun to the north, the Grand Central viaduct, the canyon of 42nd running to the Hudson with the sun sitting in it, taxis stopped, every phone up.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x2a4a8a, horizon: 0xffb060, ground: 0x2a2226, fog: 0.0022, sun: { az: 4.712, el: 0.02, color: 0xffb040, size: 34 }, haze: 0.6, env: 0.9 });
    k.hemi(0xffc890, 0x2a2228, 0.7);
    k.sun(0xffa040, 3.2, -300, 6, 0, true, 160);
    const asphalt = k.pbr('mhRoad', X.asphalt(0x2a2d31), 0.11),
      facade = k.pbr('mhFacade', X.windows(246, 0.35, 0x6a6058, true), 0.12, { emissive: 0xffffff, emissiveIntensity: 0.6, roughness: 0.55, stretch: 0.42 }),
      facadeB = k.pbr('mhFacadeB', X.windows(247, 0.3, 0x4a5058, false), 0.12, { emissive: 0xffffff, emissiveIntensity: 0.5, roughness: 0.4, metalness: 0.4, stretch: 0.42 }),
      granite = k.pbr('mhGranite', X.ashlar(0x8a8480, 248, 2), 0.2),
      dark = k.flat(0x1a1c20, 0.5, 0.6),
      steel = k.flat(0x8c98a4, 0.9, 0.3),
      yellow = k.flat(0xf1c531, 0.2, 0.5),
      glow = k.glow(0xffe0a0),
      brick = k.pbr('mhTudor', X.brick(0x6a4a3a, 249), 0.28);
    // the canyon: 42nd Street running west along -x, the crosstown blocks both sides, the sun at the end
    const road = k.box(400, 0.3, 24, -150, -0.15, 0, asphalt); void road;
    for (const s of [-1, 1]) k.box(400, 0.28, 5, -150, 0, s * 14.5, k.pbr('mhWalk', X.pavers(0x8e8b84, 115), 0.42));
    for (let x = -30; x >= -340; x -= 30) for (const s of [-1, 1]) { const h = 40 + ((-x / 30) % 4) * 25; k.box(26, h, 30, x, h / 2, s * 32, ((-x / 30) % 2) ? facade : facadeB); k.box(27, 0.8, 31, x, h + 0.4, s * 32, dark); }
    /* 2026-10-28: this used to call k.lamp 24 times at height 0 and intensity 0, all at (+-13.5, 0): no light, but 24
       lathed stubs and glowing bulbs stacked on the pavement at one spot. The posts below are the lamps; they get their
       heads, lit by emission only (24 point lights would cost more than the canyon shows). */
    for (let x = -22; x >= -340; x -= 28) for (const s of [-1, 1]) { k.box(0.16, 7, 0.16, x, 3.5, s * 13.6, dark); k.box(0.9, 0.12, 0.16, x, 7.0, s * 13.2, dark); k.box(0.5, 0.14, 0.34, x, 6.9, s * 12.85, glow); }
    for (let x = -14; x >= -330; x -= 12) k.box(4, 0.012, 0.6, x - 150 + 150, 0.01, 0, yellow);
    const cars: T.Mesh[] = [];
    for (let i = 0; i < 24; i++) { const c = k.mesh(new T.BoxGeometry(4.2, 1.4, 1.8), i % 3 ? yellow : k.flat(0x1a1a1a, 0.4, 0.4), -20 - i * 13, 0.7, (i % 4 - 1.5) * 5, true); c.userData.car = true; cars.push(c); const l = new T.Mesh(new T.BoxGeometry(0.1, 0.2, 1.4), glow); l.position.set(2.1, 0, 0); c.add(l); }
    if (!ctx.reduced) k.ticks.push((t) => cars.forEach((c, i) => { c.position.x = -20 - i * 13 + Math.max(0, Math.sin(t * 0.2 + i)) * 0.6; }));
    // the sun itself: a disc down the axis, low, with a glow, and the crowd on the overpass in front
    k.mesh(new T.CircleGeometry(16, 48), k.glow(0xffc040), -380, 12, 0).rotation.y = PI / 2;
    k.mesh(new T.CircleGeometry(40, 48), k.glow(0xff9a40, 0.25), -382, 12, 0).rotation.y = PI / 2;
    (k.objects[k.objects.length - 1].material as T.MeshBasicMaterial).transparent = true;
    k.point(-360, 12, 0, 0xffa040, 600, 300);
    // Tudor City: the overpass over 42nd where the visitor stands, the brick towers either side
    const OY = 7;
    k.box(30, 1.2, 12, 8, OY - 0.6, 0, granite);
    k.box(30, 0.2, 12, 8, OY + 0.1, 0, k.pbr('mhPave', X.pavers(0x8e8b84, 116), 0.42));
    for (const s of [-1, 1]) { k.rail(8, s * 5.6, 30, steel, 1.1, 'x', 2); k.box(30, 0.2, 0.3, 8, OY + 1.1, s * 5.6, steel); k.block(-7, 23, s * 5.6 - 0.3, s * 5.6 + 0.3); }
    k.rail(-6.8, 0, 12, steel, 1.1, 'z', 2); k.block(-7.2, -6.4, -6, 6);
    k.arch(20, OY - 1, 12, 8, 0, 0, granite, false, 0.85).rotation.y = PI / 2;
    for (const s of [-1, 1]) { k.box(24, 50, 24, 24, 25, s * 24, brick); for (let f = 0; f < 12; f++) for (let i = 0; i < 4; i++) k.box(0.1, 2.2, 1.4, 12.02, 3 + f * 4, s * 24 - 6 + i * 4, k.glass(0xffe0b0, 0.3, 0.1)); k.box(26, 3, 26, 24, 51.5, s * 24, brick); }
    k.block(12, 36, 12, 36); k.block(12, 36, -36, -12);
    for (let i = 0; i < 14; i++) k.box(3, 0.5, 1.2, 22 + 0, 0.25 + i * 0.5, 6.6 + i * 1.2, granite);
    k.sign('TUDOR CITY  ·  MANHATTANHENGE  ·  8:12 PM', 8, 0.6, 8, OY + 3, -5.9, 'transparent', '#ffe0a0', 70, 0);
    const ph: T.Mesh[] = [];
    const crowd = k.crowd([v(-4, OY + 0.2, -4), v(20, OY + 0.2, -4), v(20, OY + 0.2, 4), v(-4, OY + 0.2, 4)], 40, { seed: 106, speed: 0.08, spread: 1.6, animate: !ctx.reduced, closed: true });
    void crowd;
    for (let i = 0; i < 24; i++) { const p = k.mesh(new T.BoxGeometry(0.16, 0.3, 0.02), glow, -2 + i, OY + 2.0, (i % 2 ? -1 : 1) * (1 + (i % 3)), true); p.rotation.y = PI / 2; ph.push(p); }
    if (!ctx.reduced) k.ticks.push((t) => ph.forEach((p, i) => { p.position.y = OY + 2.0 + 0.1 * Math.sin(t * 2 + i); }));
    k.crowd([v(-30, 0, 12.5), v(-300, 0, 12.5)], 40, { seed: 107, speed: 0.6, spread: 2, animate: !ctx.reduced });
    k.crowd([v(-30, 0, -12.5), v(-300, 0, -12.5)], 40, { seed: 108, speed: 0.6, spread: 2, animate: !ctx.reduced });
    k.crowd([v(-40, 0.3, -10), v(-40, 0.3, 10)], 30, { seed: 109, speed: 0.15, spread: 2, animate: !ctx.reduced });
    // the Chrysler crown catching the light to the north, the viaduct at Park
    /* the crown has seven radiating terraced arches, so seven tiers */
    for (let i = 0; i < 7; i++) { const r = 12 - i * 1.45, y = 150 + i * 5.2; const shell = k.mesh(new T.SphereGeometry(r, 24, 10, 0, PI * 2, 0, PI / 2), k.pbr('mhCrown', X.steel(0xc7ccd2, false, 250), 0.35, { metalness: 0.95, roughness: 0.22 }), -100, y, -110); shell.scale.y = 0.55; for (let j = 0; j < 16; j++) { const t = (j / 16) * PI * 2; k.mesh(new T.ConeGeometry(0.6, 2.2, 3), glow, -100 + Math.cos(t) * (r - 0.6), y + 1.6, -110 + Math.sin(t) * (r - 0.6)); } }
    k.box(30, 150, 30, -100, 75, -110, facade); k.beam(v(-100, 186, -110), v(-100, 210, -110), 0.5, steel, 8);
    k.box(20, 14, 1.6, -170, 8, 13, granite); k.box(20, 14, 1.6, -170, 8, -13, granite); k.box(20, 1.6, 28, -170, 15, 0, granite); k.arch(10, 12, 28, -170, 0, 0, granite, false, 0.85).rotation.y = PI / 2;
    k.censusWall({ x: 24, y: OY + 4.2, z: 11.98, rotY: PI, cols: 20, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(7900, 80), pieces: ctx.all, backing: dark });
    k.box(12, 6, 0.3, 24, OY + 4.2, 12.2, dark);
    // the works: on the overpass parapets facing in (they catch the sun), on the Tudor City walls, on the canyon fronts
    const mounts: Mount[] = [];
    for (let i = 0; i < 5; i++) { const x = -3 + i * 5.2; for (const s of [-1, 1]) { k.box(3.6, 1.4, 0.16, x, OY + 1.9, s * 5.5, dark); mounts.push({ position: v(x, OY + 1.9, s * 5.42), rotation: s > 0 ? PI : 0, target: v(x, OY + 2, 0), width: 3.2, height: 1.2, style: 'steel', wash: false }); } }
    for (let i = 0; i < 3; i++) { const x = 30 + i * 0; const z = -12 + 0.02; mounts.push({ position: v(14 + i * 6, OY + 4.5, z), rotation: 0, target: v(14 + i * 6, OY + 3, 0), width: 4.2, height: 2.5, style: 'steel', wash: false }); void x; }
    for (let i = 0; i < 3; i++) mounts.push({ position: v(14 + i * 6, OY + 4.5, 12 - 0.02), rotation: PI, target: v(14 + i * 6, OY + 3, 0), width: 4.2, height: 2.5, style: 'steel', wash: false });
    for (let i = 0; i < 6; i++) { const x = -40 - i * 30; const s = i % 2 ? 1 : -1; mounts.push({ position: v(x, 8, s * 16.98), rotation: s > 0 ? PI : 0, target: v(x, 4, 0), width: 5.6, height: 3.4, style: 'neon', wash: true }); }
    // landmark eggs
    k.egg(v(-6.4, OY + 1.6, 0), { id: 'manhattanhenge-tyson', title: 'Named after Stonehenge', year: '1997', text: 'The astrophysicist Neil deGrasse Tyson claims to have coined the name, by analogy with Stonehenge. He described the alignment in Natural History magazine in 1997, though not yet by that name.', clue: 'Lean on the west rail of the overpass and face the sun.', source: { name: 'Manhattanhenge, Wikipedia', url: 'https://en.wikipedia.org/wiki/Manhattanhenge' } }, { r: 1.6 });
    k.egg(v(-40, 0.8, 0), { id: 'manhattanhenge-29', title: 'Twenty nine degrees', year: '1811', text: 'The Commissioners\' Plan of 1811 laid the street grid rotated 29 degrees clockwise from true east west, so the sun sets straight down the cross streets when it sets at an azimuth of about 299 degrees: around May 28 and July 13. The sunrise lines up the other way around December 5 and January 8.', clue: 'Stand in the crosswalk in the middle of 42nd Street.', source: { name: 'Manhattanhenge, Wikipedia', url: 'https://en.wikipedia.org/wiki/Manhattanhenge' } }, { r: 2 });
    k.egg(v(-376, 12, 0), { id: 'manhattanhenge-fullsun', title: 'Full sun, half sun', text: 'On a full sun day the whole disc sits just above the New Jersey horizon between the buildings; on a half sun day it is partly cut by the horizon. The streets that frame it best are 14th, 23rd, 34th, 42nd and 57th.', clue: 'Look straight down the canyon at the sun.', source: { name: 'Manhattanhenge, Wikipedia', url: 'https://en.wikipedia.org/wiki/Manhattanhenge' } }, { r: 10 });
    k.egg(v(22, 3.5, 11), { id: 'manhattanhenge-overpass', title: 'Once a tunnel', year: '1952', text: 'Tudor City Place crosses 42nd Street on this overpass. It replaced an earlier tunnel in 1952, when 42nd Street was widened.', clue: 'Take the stairs down from the overpass.', source: { name: 'Tudor City, Wikipedia', url: 'https://en.wikipedia.org/wiki/Tudor_City' } }, { r: 1.8 });
    k.egg(v(12, 18, 18), { id: 'manhattanhenge-tudor', title: 'No windows to the east', year: '1927', text: 'The Fred F. French Company began Tudor City in 1926 and finished its first twelve buildings between 1927 and 1930, one of the first residential skyscraper complexes in the world. The towers had very few east facing windows, because First Avenue was lined with abattoirs, meatpacking houses and a gasworks.', clue: 'Look at the brick towers beside the overpass.', source: { name: 'Tudor City, Wikipedia', url: 'https://en.wikipedia.org/wiki/Tudor_City' } }, { r: 2.4 });
    k.egg(v(-100, 168, -110), { id: 'manhattanhenge-chrysler', title: 'The secret spire', year: '1929', text: 'William Van Alen had the Chrysler Building\'s spire built inside the frame so rivals could not learn how tall it would be. On October 23, 1929 it was hoisted into place and riveted within about 90 minutes, making the building, at 1,046 feet, the tallest in the world until the Empire State Building surpassed it on May 1, 1931.', clue: 'Look north to the steel crown catching the sun.', source: { name: 'Chrysler Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/Chrysler_Building' } }, { r: 10 });
    return { mounts, spawn: v(18, OY + 3, 0), look: v(-380, 10, 0), eye: 3, /* manhattanhenge: six works recede down the avenue to x -190, which is the whole point of the room and was entirely out of reach */ bounds: [-200, 22.6, -5.2, 5.2], style: 'steel', floorY: () => OY + 0.2 };
  },
};
