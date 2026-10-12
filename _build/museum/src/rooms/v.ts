/* Rooms 102 to 106: the New-York Historical Society, Dia Chelsea, a West 24th Street gallery block, Fotografiska, MoMA PS1. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront } from './f';
import { mlowBanner, blossomFlag, donorWall, eyeMedallion, wordmarkRelief, eyeMonument, blossomGarden, INK, CLOUD, ELECTRIC, CYAN } from './brand';

const PI = Math.PI;

/* ---------------- 102 THE HISTORICAL SOCIETY ---------------- */
export const nyhistorical: RoomDef = {
  id: 'nyhistorical',
  name: 'The oldest museum in the city',
  area: 'NEW-YORK HISTORICAL SOCIETY',
  mood: 'Central Park West, a school morning',
  color: '#c8b898',
  description: 'The granite temple front across from the park, the great hall of the city\'s history with its wall of lamps, the library above, the works among the relics.',
  signatures: 'The Roman Eclectic granite facade with its Ionic columns and bronze doors, the entrance hall with the mural and the wall of Tiffany lamps upstairs, the Luce Center of open storage, the reading room with green shaded lamps.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad8, horizon: 0xeef0ec, ground: 0x6a6a66, fog: 0.002, sun: { az: 2.8, el: 0.7, color: 0xfff6e8, size: 12 }, env: 0.95 });
    k.hemi(0xf2f6ff, 0x5a5a58, 0.9);
    k.sun(0xfff2dc, 2.2, 40, 70, 40, true, 90);
    const granite = k.pbr('nyhGranite', X.ashlar(0xb8b0a0, 312, 3), 0.22), marble = k.pbr('nyhMarble', X.marble(0xe0dcd2, 0x9a948a, 22), 0.5, { roughness: 0.3 }),
      floorT = k.pbr('nyhFloor', X.terrazzo(0xc0b8a8, 176), 0.4, { roughness: 0.3 }), oak = k.pbr('nyhOak', X.planks(0x5a3a26, 4, 313, 0.15), 1.4), dark = k.flat(0x1a1c20, 0.5, 0.6),
      glass = k.glass(0xdcecf6, 0.14, 0.04), bronze = k.flat(0x4a3a28, 0.8, 0.4), lampGlass = k.glow(0xffc880), greenG = k.glow(0x4ad86a), white = k.pbr('nyhWhite', X.plaster(0xf4f4f2, 177), 0.4);
    street(k, { w: 24, len: 160, z: 40, x: 0 });
    k.box(160, 0.4, 200, 100, -0.2, 0, k.pbr('nyhLawn', X.grass(0x4a6a3a, 178), 0.06)); k.rail(18, 0, 160, dark, 1.0, 'z', 2.4); k.block(17.6, 18.4, -80, 80);
    const rnd = X.mulberry(102); for (let i = 0; i < 30; i++) k.tree(24 + rnd() * 60, 0, -80 + rnd() * 160, { h: 8 + rnd() * 6, r: 3 + rnd() * 2, leaf: 0x4a7a3c, seed: i, species: i % 3 ? 'elm' : 'oak' });
    const BX = -30, BZ = 0, BW = 36, BD = 50;
    k.box(BW, 20, BD, BX, 10, BZ, granite);
    k.moulding([[0, 0], [1.0, 0], [1.1, 0.3], [0.7, 0.5], [0.9, 0.9], [0, 1.1]], BD + 0.4, BX + BW / 2 + 0.05, 19.4, BZ, granite, PI / 2);
    // the 1908 York and Sawyer front: a rusticated base with a ledge at the second floor, eight three quarter engaged Ionic columns standing on it, plain end pavilions
    k.box(0.8, 0.5, 30, BX + BW / 2 + 0.3, 6.0, BZ, granite);
    for (let i = 0; i < 8; i++) { const z = BZ - 14 + i * 4; k.column(BX + BW / 2 + 0.3, 6.25, z, 10.6, 0.7, granite, false); k.prop('ionic_capital', BX + BW / 2 + 0.3, 16.85, z, { height: 1.1 }); }
    k.box(1.4, 1.4, 31, BX + BW / 2 + 0.4, 18.3, BZ, granite);
    for (const s of [-1, 1]) k.box(0.8, 19, 7.6, BX + BW / 2 + 0.4, 9.5, BZ + s * 21.2, granite);
    k.arch(3, 5.6, 2, BX + BW / 2, 0, BZ, granite, false, 0.85).rotation.y = PI / 2; k.box(0.2, 5, 2.8, BX + BW / 2 + 0.5, 2.5, BZ, bronze);
    k.block(BX + BW / 2 - 0.6, BX + BW / 2 + 0.8, BZ - BD / 2, BZ - 1.6); k.block(BX + BW / 2 - 0.6, BX + BW / 2 + 0.8, BZ + 1.6, BZ + BD / 2);
    for (let i = 0; i < 10; i++) k.box(1.0, 0.3, 14, BX + BW / 2 + 3 + i * 1.0, 0.15 + (9 - i) * 0.3, BZ, granite);
    for (let f = 0; f < 3; f++) for (let i = 0; i < 7; i++) { const y = 3.2 + f * 4.6, z = BZ - 12 + i * 4; if (f === 0 && Math.abs(z) < 3) continue; k.box(0.16, 2.6, 1.8, BX + BW / 2 + 0.02, y, z, marble); k.box(0.06, 2.2, 1.4, BX + BW / 2 + 0.1, y, z, glass); }
    for (const s of [-1, 1]) for (let f = 0; f < 3; f++) { const y = 3.2 + f * 4.6; k.box(0.06, 2.0, 1.4, BX + BW / 2 + 0.82, y, BZ + s * 21.2, glass); }
    k.sign('NEW-YORK HISTORICAL SOCIETY  ·  1804', 12, 0.7, BX + BW / 2 + 1.12, 18.3, BZ, 'transparent', '#3a3020', 70, PI / 2);
    mlowBanner(k, BX + BW / 2 + 0.85, 10, BZ - 21.2, PI / 2, 3.2, true); blossomFlag(k, BX + BW / 2 + 0.85, 10, BZ + 21.2, PI / 2, 2.8, 7, 'ink');
    k.egg(v(BX + BW / 2 + 1.3, 18.3, BZ), { id: 'nyhistorical-hyphen', title: 'The hyphen they would not give up', year: '1945', text: 'The hyphen in New-York was standard spelling in 1804, and the New York Times kept it in its masthead until the 1890s. In 1945 a councilman objected to it on a subway ad, the Chief Magistrate called it a sneaky gremlin, and the City Council tried to legislate it away. The librarians and curators refused, and the name stays carved in the stone. The staff softball team is called The Hyphens.', clue: 'Read the name cut into the stone over the columns.', source: { name: 'Top 10 Secrets of the New-York Historical Society, Untapped New York', url: 'https://untappedcities.com/2019/06/24/top-10-secrets-of-the-new-york-historical-society/' } }, { r: 1.8 });
    k.egg(v(BX + BW / 2 + 1.0, 7.8, BZ - 8), { id: 'nyhistorical-tricorne', title: 'A Picasso through the window', year: '2015', text: 'The largest artwork here is Picasso\'s Le Tricorne, a 19 by 20 foot stage curtain painted for a 1919 Ballets Russes production, the largest Picasso painting in America. It hung in the Four Seasons restaurant in the Seagram Building from 1957 for six decades. After its removal in 2015 and conservation in Williamstown, a crane lifted it in a 23 foot tube through a second floor window.', clue: 'Look up at the second floor windows on Central Park West.', source: { name: 'Top 10 Secrets of the New-York Historical Society, Untapped New York', url: 'https://untappedcities.com/2019/06/24/top-10-secrets-of-the-new-york-historical-society/' } }, { r: 1.6 });
    k.egg(v(BX + BW / 2 + 1.5, 1.8, BZ - BD / 2 - 0.5), { id: 'nyhistorical-douglass', title: 'Douglass on the 77th Street steps', text: 'A life size bronze of the abolitionist Frederick Douglass stands atop the staircase at the West 77th Street entrance, the work of the sculptor Ivan Schwartz and StudioEIS in Brooklyn. He holds two books in his left hand and gazes into the distance. A life size bronze of Abraham Lincoln stands on the Central Park West side.', clue: 'Walk to the north corner of the building, where 77th Street meets the park.', source: { name: 'Frederick Douglass (New York, New York), Contemporary Monuments to the Slave Past', url: 'https://mail.slaverymonuments.org/items/show/1193' } }, { r: 1.6 });
    // the entrance hall and the great hall, the wall of Tiffany lamps on the mezzanine, the reading room lamps
    const IW = BW - 1.2, ID = BD - 1.2;
    k.box(IW, 0.3, ID, BX, 0.15, BZ, floorT);
    k.block(BX - IW / 2 - 0.6, BX - IW / 2 + 0.2, BZ - ID / 2, BZ + ID / 2); k.block(BX - IW / 2, BX + IW / 2, BZ - ID / 2 - 0.6, BZ - ID / 2 + 0.2); k.block(BX - IW / 2, BX + IW / 2, BZ + ID / 2 - 0.2, BZ + ID / 2 + 0.6);
    for (const s of [-1, 1]) k.box(0.3, 8, ID, BX + s * (IW / 2 - 0.2), 4, BZ, marble);
    k.box(IW, 8, 0.3, BX, 4, BZ - ID / 2 + 0.2, marble); k.box(IW, 8, 0.3, BX, 4, BZ + ID / 2 - 0.2, marble);
    k.box(IW, 0.4, ID, BX, 12.4, BZ, dark);
    k.box(IW, 0.4, 8, BX, 8, BZ - ID / 2 + 4, oak); k.box(8, 0.4, ID, BX - IW / 2 + 4, 8, BZ, oak); k.box(0.06, 1.0, ID, BX - IW / 2 + 8, 8.7, BZ, bronze); k.box(IW, 0.06, 1.0, BX, 8.7, BZ - ID / 2 + 8, bronze).rotation.x = PI / 2;
    for (let i = 0; i < 20; i++) k.box(2.4, 0.4, 0.9, BX + IW / 2 - 1.5, 0.2 + i * 0.4, BZ + ID / 2 - 2 - i * 0.9, marble);
    k.block(BX + IW / 2 - 2.8, BX + IW / 2 - 0.3, BZ - ID / 2, BZ + ID / 2 - 1.5);
    k.box(IW - 3, 0.4, 3, BX - 1.5, 8, BZ + ID / 2 - 1.5, oak); k.block(BX - IW / 2, BX + IW / 2 - 3, BZ + ID / 2 - 3, BZ + ID / 2);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 3; j++) { const x = BX - IW / 2 + 1 + j * 2.4, z = BZ - 16 + i * 4.6; k.box(0.3, 0.3, 0.3, x, 8.4 + 0.6, z, oak); k.mesh(new T.ConeGeometry(0.42, 0.4, 12, 1, true), lampGlass, x, 9.5, z).rotation.x = PI; k.cyl(0.04, 0.5, x, 9.2, z, bronze, 0.04, 6); k.point(x, 9.3, z, 0xffc880, 3, 3); }
    for (let i = 0; i < 4; i++) { const z = BZ - 12 + i * 8; k.box(6, 0.1, 1.6, BX + 2, 0.9, z, oak); for (const dx of [-2.6, 2.6]) k.box(0.12, 0.85, 1.4, BX + 2 + dx, 0.45, z, oak); k.keepOut.push({ x: BX + 2, z, r: 3.2 }); for (const dx of [-1.6, 1.6]) { k.cyl(0.03, 0.5, BX + 2 + dx, 1.2, z, bronze, 0.03, 6); k.cyl(0.24, 0.2, BX + 2 + dx, 1.5, z, greenG, 0.18, 12); k.point(BX + 2 + dx, 1.4, z, 0xc8ffc0, 6, 4); } }
    eyeMedallion(k, BX + 10, 0.16, BZ, 2.2);
    donorWall(k, BX, 4.6, BZ - ID / 2 + 0.36, 0, 10, false);
    k.egg(v(BX - IW / 2 + 3.4, 9.6, BZ), { id: 'nyhistorical-tiffany', title: 'One collector\'s lamps', year: '1935', text: 'The Society owns 132 Tiffany lamps, all from a single gift by the collector Dr. Egon Neustadt, about half of his collection. He and his wife bought their first lamp in 1935 from an antique store in Greenwich Village. Many shades were cut in the women\'s glass cutting department Louis C. Tiffany set up in 1892 after a strike by the men\'s union, run by Clara Wolcott Driscoll.', clue: 'Climb to the mezzanine and walk the row of glowing shades.', source: { name: 'Top 10 Secrets of the New-York Historical Society, Untapped New York', url: 'https://untappedcities.com/2019/06/24/top-10-secrets-of-the-new-york-historical-society/' } }, { r: 1.8 });
    k.egg(v(BX - 8, 2.2, BZ - 8), { id: 'nyhistorical-audubon', title: 'Every Audubon watercolor', text: 'The Society holds all 435 of John James Audubon\'s surviving preparatory watercolors for The Birds of America. Its museum also predates the Metropolitan Museum of Art by nearly 70 years.', clue: 'Find the glass case on the floor of the great hall.', source: { name: 'New-York Historical Society, Wikipedia', url: 'https://en.wikipedia.org/wiki/New-York_Historical_Society' } }, { r: 1.4 });
    k.egg(v(BX - 6, 2.4, BZ + 12), { id: 'nyhistorical-time-capsule', title: 'The capsule nobody opened', year: '1914', text: 'In 1914 the Lower Wall Street Business Men\'s Association sealed a bronze box, which former mayor Seth Low hammered shut and handed to the Society\'s president. It was meant to be opened in 1974, but a cataloguing error hid it until the 1990s. It was finally opened on October 8, 2014, and held a New York Herald of May 15, 1914 and a 1914 almanac.', clue: 'Look by the globe stand in the great hall.', source: { name: 'Top 10 Secrets of the New-York Historical Society, Untapped New York', url: 'https://untappedcities.com/2019/06/24/top-10-secrets-of-the-new-york-historical-society/' } }, { r: 1.4 });
    k.prop('equestrian', BX + 8, 0.15, BZ - 14, { height: 4, keepOut: 2 }); k.prop('globe_stand', BX - 6, 0.15, BZ + 12, { height: 2.0, keepOut: 1 }); k.prop('vitrine', BX - 8, 0.15, BZ - 8, { height: 1.7, keepOut: 1.2 });
    for (let i = 0; i < 4; i++) k.point(BX, 7.4, BZ - 16 + i * 10, 0xfff0dc, 22, 14);
    k.crowd([v(-2, 0, 20), v(BX + 12, 0.15, BZ + 2), v(BX + 4, 0.15, BZ - 8), v(BX - 6, 0.15, BZ + 6)], 14, { seed: 140, speed: 0.35, spread: 2, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a, 0x33477f] });
    k.censusWall({ x: BX + IW / 2 - 0.36, y: 4.2, z: BZ - 8, rotY: -PI / 2, cols: 30, rows: 5, tile: 0.5, gap: 0.05, start: ctx.wallStart(4500, 150), pieces: ctx.all, backing: dark });
    // the works: the marble walls of the great hall, the mezzanine backs, the reading room's end wall
    const mounts: Mount[] = [];
    for (let i = 0; i < 5; i++) { const z = BZ - 18 + i * 8; mounts.push({ position: v(BX - IW / 2 + 0.38, 3.4, z), rotation: PI / 2, target: v(BX, 2.8, z), width: 4.4, height: 2.6, style: 'gilt', wash: true }); }
    for (const x of [-10, 0, 10]) mounts.push({ position: v(BX + x, 3.4, BZ + ID / 2 - 0.38), rotation: PI, target: v(BX + x, 2.8, BZ), width: 4.4, height: 2.6, style: 'gilt', wash: true });
    for (const x of [-10, 0, 10]) mounts.push({ position: v(BX + x, 10.4, BZ - ID / 2 + 0.38), rotation: 0, target: v(BX + x, 9, BZ - 8), width: 4.4, height: 2.6, style: 'gilt', wash: false });
    for (let i = 0; i < 3; i++) { const z = BZ + 4 + i * 6; mounts.push({ position: v(BX + IW / 2 - 0.38, 3.4, z), rotation: -PI / 2, target: v(BX, 2.8, z), width: 3.6, height: 2.2, style: 'gilt', wash: true }); }
    for (let i = 0; i < 3; i++) { const z = -30 + i * 30; k.box(0.3, 3, 4.6, 18.4, 1.9, z, dark); mounts.push({ position: v(18.2, 2.0, z), rotation: PI / 2, target: v(8, 2, z), width: 4.2, height: 2.5, style: 'black', wash: false }); }
    return { mounts, spawn: v(2, 3, 22), look: v(BX + BW / 2, 12, BZ), eye: 3, bounds: [BX - IW / 2 + 0.8, 40, BZ - ID / 2 + 1, 60], style: 'gilt', floorY: (x, z) => { if (x > BX + IW / 2 - 2.8 && x < BX + IW / 2 - 0.3 && z < BZ + ID / 2 - 1.5 && z > BZ + ID / 2 - 20) return Math.min(7.8, ((BZ + ID / 2 - 1.5 - z) / 18) * 7.8); if (((x > BX - IW / 2 && x < BX - IW / 2 + 8) || (z > BZ - ID / 2 && z < BZ - ID / 2 + 8) || (z > BZ + ID / 2 - 3 && x < BX + IW / 2 - 3)) && x > BX - IW / 2 && x < BX + IW / 2 - 2.8 && z > BZ - ID / 2 && z < BZ + ID / 2) return 8.2; return 0; } };
  },
};

/* ---------------- 103 DIA CHELSEA ---------------- */
export const diachelsea: RoomDef = {
  id: 'diachelsea',
  name: 'The long light',
  area: 'DIA CHELSEA',
  mood: 'Twenty second Street, grey day',
  color: '#a8a8a0',
  description: 'The brick warehouses on West 22nd, the sawtooth roofs, then the joined galleries: bare brick and concrete under skylights the length of a block, the works given all the room they want.',
  signatures: 'Three adjoining industrial buildings, one of them the old Alcamo Marble Works, joined into one behind three new brick fronts, the single storey galleries under banks of skylights, the poured floors, the basalt stones and trees of Beuys\'s 7000 Oaks on the sidewalk, the High Line passing behind.',
  build(k, ctx) {
    k.sky({ top: 0x9aa4ac, horizon: 0xd8dcd8, ground: 0x5a5e58, fog: 0.003, sun: { az: 3.1, el: 0.6, color: 0xf0f0e8, size: 10 }, haze: 0.7, env: 0.7 });
    k.hemi(0xe8ecf0, 0x4a4a48, 0.9);
    k.sun(0xf4f0e8, 1.0, 20, 60, 30, false, 60);
    const brick = k.pbr('diaBrick', X.brick(0x8a5a48, 314), 0.28), brickW = k.pbr('diaBrickW', X.brick(0xe8e4dc, 315), 0.28, { roughness: 0.9 }),
      floorC = k.pbr('diaFloor', X.concrete(0xb8b4ac, 179), 0.3, { roughness: 0.6 }), glass = k.glass(0xe8f4f8, 0.1, 0.03), steel = k.flat(0x3a3a3c, 0.6, 0.55), dark = k.flat(0x1a1c20, 0.5, 0.6), scrim = k.glow(0xf8f8f4, 0.9);
    street(k, { w: 16, len: 160, z: 20, x: 0 });
    blockFront(k, { x: 12, z0: 100, count: 12, face: -1, seed: 316, h: [10, 18] });
    for (let z = 90; z > -70; z -= 12) for (const x of [-30, -24]) k.box(0.9, 8, 0.9, x, 4, z, steel);
    k.box(12, 0.8, 170, -27, 8.2, 10, steel); k.box(6, 0.2, 170, -27, 8.7, 10, k.pbr('diaDeck', X.boardwalk(0x9a8a70), 0.5));
    k.crowd([v(-27, 8.8, 90), v(-27, 8.8, -70)], 12, { seed: 141, speed: 0.8, spread: 2.4, animate: !ctx.reduced });
    // the three garages joined: brick fronts with loading doors, sawtooth roofs, one long interior
    const GX = -10, GZ = -20, GW = 22, GD = 60;
    // three new brick fronts, distinct but related, one per building; the middle one is the old Alcamo Marble Works
    const brickM = k.pbr('diaBrickM', X.brick(0x6a4a3e, 353), 0.28);
    for (let i = 0; i < 3; i++) { const fw = (GW + 2) / 3; k.box(fw, 9 + (i === 1 ? 0.8 : 0), 0.6, GX - (GW + 2) / 2 + fw * (i + 0.5), 4.5 + (i === 1 ? 0.4 : 0), GZ + GD / 2 + 0.3, [brick, brickM, brickW][i]); }
    // Joseph Beuys, 7000 Oaks: a basalt stone stood beside each tree along the block, a mix of street species
    const basalt = k.pbr('diaBasalt', X.ashlar(0x3c3e40, 354, 1), 0.3, { roughness: 0.85 });
    const oaks: [number, 'pear' | 'ginkgo' | 'linden' | 'oak' | 'plane' | 'locust'][] = [[14, 'ginkgo'], [22, 'linden'], [30, 'oak'], [40, 'pear'], [52, 'plane'], [64, 'locust']];
    for (const [z, sp] of oaks) { k.tree(-11.4, 0.14, z, { h: 7, r: 2.4, seed: z, species: sp }); k.cyl(0.28, 1.25, -10.3, 0.75, z + 0.6, basalt, 0.32, 6); k.keepOut.push({ x: -11.4, z, r: 0.8 }, { x: -10.3, z: z + 0.6, r: 0.5 }); }
    k.box(0.6, 9, GD, GX - GW / 2, 4.5, GZ, brick); k.box(0.6, 9, GD, GX + GW / 2, 4.5, GZ, brick); k.box(GW, 9, 0.6, GX, 4.5, GZ - GD / 2, brick);
    for (let i = 0; i < 6; i++) { const z = GZ + GD / 2 - 5 - i * 10; const saw = k.box(GW + 1, 0.4, 10, GX, 9.5 + 1.2, z, k.pbr('diaRoof', X.steel(0x6a6f76, false, 317), 0.5)); saw.rotation.x = 0.3; k.box(GW + 1, 3.2, 0.1, GX, 10.6, z - 5, glass); }
    k.box(6, 5, 0.3, GX, 2.5, GZ + GD / 2 + 0.3, glass); k.block(GX - GW / 2 - 1, GX - 3.2, GZ + GD / 2 - 0.2, GZ + GD / 2 + 0.8); k.block(GX + 3.2, GX + GW / 2 + 1, GZ + GD / 2 - 0.2, GZ + GD / 2 + 0.8);
    for (const dx of [-8, 8]) { k.box(4, 4, 0.2, GX + dx, 2, GZ + GD / 2 + 0.62, steel); for (let i = 0; i < 6; i++) k.box(4, 0.06, 0.02, GX + dx, 0.4 + i * 0.66, GZ + GD / 2 + 0.74, dark); }
    k.sign('DIA  ·  CHELSEA', 5, 0.7, GX, 7.4, GZ + GD / 2 + 0.62, 'transparent', '#1a1c20', 80, 0);
    mlowBanner(k, GX - 9.5, 6.2, GZ + GD / 2 + 0.9, 0, 2.4, false); blossomFlag(k, GX + 9.5, 6.2, GZ + GD / 2 + 0.9, 0, 2.2, 3, 'cloud');
    const IW = GW - 1.2, ID = GD - 1.2;
    k.box(IW, 0.3, ID, GX, 0.15, GZ, floorC);
    k.block(GX - IW / 2 - 0.6, GX - IW / 2 + 0.2, GZ - ID / 2, GZ + ID / 2); k.block(GX + IW / 2 - 0.2, GX + IW / 2 + 0.6, GZ - ID / 2, GZ + ID / 2); k.block(GX - IW / 2, GX + IW / 2, GZ - ID / 2 - 0.6, GZ - ID / 2 + 0.2);
    for (let i = 0; i < 6; i++) { const z = GZ + ID / 2 - 5 - i * 10; k.mesh(new T.PlaneGeometry(IW - 2, 8), scrim, GX, 9.2, z).rotation.x = PI / 2; k.point(GX, 8, z, 0xf8f8f4, 30, 20); }
    for (const z of [GZ + 10, GZ - 10]) { k.box(IW - 6, 5, 0.4, GX, 2.5, z, brickW); k.block(GX - IW / 2 + 3, GX + IW / 2 - 3, z - 0.4, z + 0.4); }
    for (const [x, z, p] of [[GX - 5, GZ + 20, 'noguchi_stone_2'], [GX + 5, GZ, 'noguchi_stone_3'], [GX, GZ - 22, 'noguchi_stone_1']] as const) k.prop(p, x, 0.15, z, { height: 2.6, keepOut: 1.6 });
    eyeMedallion(k, GX, 0.16, GZ + 24, 1.8);
    k.egg(v(-10.3, 1.9, 22.6), { id: 'diachelsea-7000-oaks', title: 'A stone for every tree', year: '1988', text: 'In 1988 Dia installed five basalt columns, each paired with a tree, outside its first Chelsea building, an extension of Joseph Beuys\'s 7000 Oaks. A 1996 expansion brought the block to 37 pairs, and one more pair was added in the 2021 renovation, making 38. The trees are not all oaks: Callery pear, hackberry, ginkgo, pagoda tree, zelkova, linden, pin oak, sycamore and honeylocust.', clue: 'Look at the dark stone standing beside each street tree.', source: { name: 'Dia Chelsea, Wikipedia', url: 'https://en.wikipedia.org/wiki/Dia_Chelsea' } }, { r: 1.4 });
    k.egg(v(GX, 6.4, GZ + GD / 2 + 1.0), { id: 'diachelsea-alcamo', title: 'The marble works in the middle', year: '2011', text: 'The middle of the three buildings was the Alcamo Marble Works, which Dia bought in June 2011 for $11.5 million and called a strategic purchase. It opened as a gallery in 2012 with Thomas Hirschhorn\'s Timeline: Work in Public Space. It sits between the buildings at 535 and 545 West 22nd Street.', clue: 'Find the middle of the three brick fronts.', source: { name: 'Dia Chelsea, Wikipedia', url: 'https://en.wikipedia.org/wiki/Dia_Chelsea' } }, { r: 1.6 });
    k.egg(v(GX + 8, 6.0, GZ + GD / 2 + 1.0), { id: 'diachelsea-serra', title: 'Where the ellipses first stood', year: '1997', text: 'Dia bought 545 West 22nd Street in 1992 and opened it in 1997 with Richard Serra\'s Torqued Ellipses, huge curved steel works that now stand at Dia Beacon. By 2011 the building was leased to Pace Gallery, and it came back to Dia in 2015 with a La Monte Young and Marian Zazeela show.', clue: 'Look at the end brick front of the three.', source: { name: 'Dia Chelsea, Wikipedia', url: 'https://en.wikipedia.org/wiki/Dia_Chelsea' } }, { r: 1.6 });
    k.egg(v(GX, 9.6, GZ + 5), { id: 'diachelsea-skylights', title: 'One storey, all daylight', year: '2021', text: 'Architecture Research Office joined the three buildings into 32,500 square feet, with about 20,000 square feet of exhibition space at street level. They kept the natural light of the single storey galleries by retaining the skylights, and designed three new brick facades as an ensemble of distinct but related buildings. Every artist in the first exhibitions was a woman, opening with Lucy Raven.', clue: 'Look straight up at the light coming through the roof.', source: { name: 'Dia Chelsea reopens to the public following two year renovation, Wallpaper', url: 'https://wallpaper.com/art/dia-chelsea-new-york-reopening' } }, { r: 1.8 });
    k.egg(v(11.4, 3.0, 20), { id: 'diachelsea-548', title: 'The first art museum in Chelsea', year: '1987', text: 'Across the street, the four storey brick warehouse at 548 West 22nd Street opened in October 1987 as the Dia Center for the Arts, the first art museum in Chelsea. For years Dia and the Kitchen were the only art institutions in the neighborhood. Attendance grew from about 16,000 a year to about 60,000, Dia closed it in 2004 citing crowds the building could not handle, and sold it in 2007 for $38.55 million.', clue: 'Look across the street at the brick building facing Dia.', source: { name: 'Dia Chelsea, Wikipedia', url: 'https://en.wikipedia.org/wiki/Dia_Chelsea' } }, { r: 1.6 });
    k.egg(v(11.4, 9.0, 18), { id: 'diachelsea-graham-roof', title: 'A mirror on the roof', year: '1991', text: 'From 1991 to 2004 the roof of 548 West 22nd Street held Dan Graham\'s Rooftop Urban Park Project. Its centerpiece was Two-Way Mirror Cylinder Inside Cube, a pavilion of one way glass, beside a shed for watching video art. It was taken apart when the building closed in 2004.', clue: 'Look up at the roofline of the building across the street.', source: { name: 'Dia Chelsea, Wikipedia', url: 'https://en.wikipedia.org/wiki/Dia_Chelsea' } }, { r: 1.6 });
    donorWall(k, GX, 4.4, GZ - ID / 2 + 0.36, 0, 9, true);
    k.crowd([v(GX - 8, 0.15, GZ + 24), v(GX + 6, 0.15, GZ + 6), v(GX - 6, 0.15, GZ - 8), v(GX + 4, 0.15, GZ - 24)], 12, { seed: 142, speed: 0.3, spread: 2, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da] });
    k.censusWall({ x: GX + IW / 2 - 0.36, y: 4.4, z: GZ - 18, rotY: -PI / 2, cols: 30, rows: 6, tile: 0.5, gap: 0.05, start: ctx.wallStart(1100, 180), pieces: ctx.all, backing: dark });
    // the works: few and large, on the long walls and both faces of the two cross walls
    const mounts: Mount[] = [];
    for (let i = 0; i < 4; i++) { const z = GZ + 22 - i * 14; mounts.push({ position: v(GX - IW / 2 + 0.38, 3.4, z), rotation: PI / 2, target: v(GX, 2.6, z), width: 6.4, height: 3.6, style: 'none', wash: true }); }
    for (let i = 0; i < 2; i++) { const z = GZ + 20 - i * 14 - 6; mounts.push({ position: v(GX + IW / 2 - 0.38, 3.4, z), rotation: -PI / 2, target: v(GX, 2.6, z), width: 6.4, height: 3.6, style: 'none', wash: true }); }
    for (const z of [GZ + 10, GZ - 10]) for (const s of [-1, 1]) mounts.push({ position: v(GX, 2.8, z + s * 0.22), rotation: s > 0 ? 0 : PI, target: v(GX, 2.6, z + s * 8), width: 5.6, height: 3.2, style: 'none', wash: true });
    for (const x of [-6, 6]) mounts.push({ position: v(GX + x, 3.4, GZ - ID / 2 + 0.38), rotation: 0, target: v(GX + x, 2.6, GZ - 10), width: 5, height: 3, style: 'none', wash: true });
    return { mounts, spawn: v(-6, 3, 26), look: v(GX, 5.5, GZ + GD / 2), eye: 3, bounds: [GX - IW / 2 + 0.8, 10, GZ - ID / 2 + 1, 30], style: 'none' };
  },
};

/* ---------------- 104 THE GALLERY BLOCK ---------------- */
export const chelseablock: RoomDef = {
  id: 'chelseablock',
  name: 'Thursday openings on 24th',
  area: 'WEST 24TH STREET',
  mood: 'Six to eight, plastic cups',
  color: '#f4f4f0',
  description: 'The block of white cubes between Tenth and Eleventh: garage doors rolled up, the crowds spilling onto the sidewalk with their wine, three galleries open in a row, the works inside each.',
  signatures: 'The low former garages turned galleries with roll up fronts, white cube interiors under fluorescent grids, the desks with the price lists, the crowd on the sidewalk at an opening, the High Line at the corner and the river at the end of the street.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x1a2446, horizon: 0x6a5a70, ground: 0x14141a, fog: 0.0024, stars: 200, env: 0.7 });
    k.hemi(0xd8e0ff, 0x1a1418, 0.55);
    const white = k.pbr('cbWhite', X.plaster(0xf6f6f4, 180), 0.4, { roughness: 0.9 }), floorC = k.pbr('cbFloor', X.concrete(0xb8b4ac, 181), 0.3, { roughness: 0.6 }),
      brick = k.pbr('cbBrick', X.brick(0x6a4a3a, 318), 0.28), glass = k.glass(0xdcecf6, 0.14, 0.04), dark = k.flat(0x1a1c20, 0.5, 0.6), steel = k.flat(0x8c98a4, 0.9, 0.3), tube = k.glow(0xf0f4ff), wood = k.pbr('cbDesk', X.planks(0xe8e0d0, 4, 319, 0.1), 1.0);
    street(k, { w: 16, len: 160, z: 0, x: 0 });
    blockFront(k, { x: 12, z0: 80, count: 14, face: -1, seed: 320, h: [10, 16] });
    k.water({ y: -1.6, color: 0x24405a, w: 300, d: 300, z: -190, amp: 0.8 });
    k.skyline({ z: -260, count: 20, spacing: 10, scale: 1.4, base: -1.6, seed: 321, lit: 0.4, glow: 0.9, tint: 0x3a3a48, rows: 1 });
    // three galleries in a row on the west side, doors rolled up, each a white cube of a different depth
    const galleries: [number, number, number, string][] = [[36, 16, 22, 'GALLERY ONE'], [8, 14, 26, 'GALLERY TWO'], [-22, 18, 20, 'GALLERY THREE']];
    const mounts: Mount[] = [];
    galleries.forEach(([z, w, d, name], gi) => {
      const x = -8 - d / 2;
      k.box(d + 1.2, 7, w + 1.2, x, 3.5, z, brick);
      k.box(d, 0.3, w, x, 0.15, z, floorC);
      for (const s of [-1, 1]) { k.box(d, 6, 0.3, x, 3, z + s * (w / 2 - 0.15), white); k.block(x - d / 2, x + d / 2, z + s * (w / 2 - 0.6), z + s * (w / 2 + 0.6)); }
      k.box(0.3, 6, w, x - d / 2 + 0.15, 3, z, white); k.block(x - d / 2 - 0.6, x - d / 2 + 0.6, z - w / 2, z + w / 2);
      k.box(d, 0.4, w, x, 6, z, dark);
      for (let i = -d / 2 + 3; i < d / 2; i += 4) for (let j = -w / 2 + 3; j < w / 2; j += 4) { k.box(1.2, 0.08, 0.1, x + i, 5.85, z + j, tube); if ((i + j) % 8 === 0) k.point(x + i, 5.2, z + j, 0xf0f4ff, 10, 8); }
      k.box(0.3, 7, 3, -8, 3.5, z - w / 2 + 1.5, brick); k.box(0.3, 7, 3, -8, 3.5, z + w / 2 - 1.5, brick);
      k.box(w - 6, 0.6, 0.3, -8, 6.3, z, steel); for (let i = 0; i < 8; i++) k.box(w - 6, 0.06, 0.04, -8, 6.0 - i * 0.04, z, dark);
      k.block(-8.6, -7.4, z - w / 2, z - w / 2 + 3); k.block(-8.6, -7.4, z + w / 2 - 3, z + w / 2);
      k.sign(name, w - 6, 0.6, -7.84, 6.7, z, '#f6f6f4', '#0d0d0d', 60, PI / 2);
      k.box(2.4, 0.9, 1.0, x - d / 2 + 2, 0.45, z - w / 2 + 2, wood); k.keepOut.push({ x: x - d / 2 + 2, z: z - w / 2 + 2, r: 1.5 });
      k.prop('rope_stanchion', -9.5, 0.15, z, { height: 1.0 });
      if (gi === 0) k.egg(v(-8, 5.6, z), { id: 'chelseablock-garage-doors', title: 'Why the galleries live in garages', text: 'Barbara Gladstone moved her gallery from SoHo to an empty garage building at 515 West 24th Street during the 1990s, part of the new community forming in Chelsea. She liked garages for their convenient doors, which make it easy to move big works in and out, and for their column free floors.', clue: 'Look up at the rolled up door over the entrance.', source: { name: 'Repurposed parking spaces and garages in New York City, Untapped New York', url: 'https://untappedcities.com/2013/07/23/repurposed-parking-spaces-garages-in-new-york-city-the-exley-antique-garage-barcade-the-park/3/' } }, { r: 1.6 });
      if (gi === 1) k.egg(v(x, 4.4, z), { id: 'chelseablock-gagosian-1999', title: 'A hangar for one sculpture', year: '1999', text: 'In September 1999 Gagosian moved from SoHo to West 24th Street, into a 25,000 square foot space designed by Richard Gluckman. That November Richard Serra showed his monumental sculpture Switch there, the kind of work only a room this size could hold. Gluckman also designed a second Gagosian on West 21st Street in 2006.', clue: 'Stand in the middle of the second white cube.', source: { name: 'Gagosian, Wikipedia', url: 'https://en.wikipedia.org/wiki/Gagosian_Gallery' } }, { r: 1.6 });
      if (gi === 2) k.egg(v(x - d / 2 + 2, 1.5, z - w / 2 + 2), { id: 'chelseablock-pioneers', title: 'Two pioneers on the block', year: '1987', text: 'When the Dia Center for the Arts opened on West 22nd Street in October 1987 it was the first art museum in Chelsea. Through the 1980s and early 1990s Dia and the Kitchen were the only arts institutions in the neighborhood, before the SoHo dealers followed them west.', clue: 'Find the front desk in the third gallery.', source: { name: 'Dia Chelsea, Wikipedia', url: 'https://en.wikipedia.org/wiki/Dia_Chelsea' } }, { r: 1.4 });
      const n = Math.floor((d - 4) / 4.4);
      for (const s of [-1, 1]) for (let i = 0; i < n; i++) { const wx = x - d / 2 + 3 + i * ((d - 4) / n) + 1; mounts.push({ position: v(wx, 3.0, z + s * (w / 2 - 0.32)), rotation: s > 0 ? PI : 0, target: v(wx, 2.6, z), width: 3.6, height: 2.4, style: gi === 1 ? 'none' : 'white', wash: true }); }
      mounts.push({ position: v(x - d / 2 + 0.32, 3.0, z), rotation: PI / 2 + PI, target: v(x, 2.6, z), width: Math.min(6, w - 4), height: 3.2, style: 'none', wash: true });
      k.crowd([v(x - d / 2 + 3, 0.15, z - w / 2 + 3), v(x + d / 2 - 3, 0.15, z), v(x - d / 2 + 3, 0.15, z + w / 2 - 3)], 10, { seed: 143 + gi, speed: 0.25, spread: 1.6, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a, 0x0d0d0d] });
    });
    k.crowd([v(-6, 0, 60), v(-6, 0, -40)], 40, { seed: 146, speed: 0.2, spread: 3, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0x0d0d0d, 0xe6e2da, 0x8a3a3a] });
    k.crowd([v(4, 0, 70), v(4, 0, -60)], 20, { seed: 147, speed: 0.9, spread: 2, animate: !ctx.reduced });
    for (const z of [60, 20, -20, -60]) for (const s of [-1, 1]) k.lamp(s * 9.5, z, 6, dark, 0xffd9a8, 24);
    eyeMonument(k, -6, 0, -46, PI, 4.2);
    // the High Line crosses 24th Street mid block on its steel bridge, planted on top
    k.box(48, 1.2, 8, -4, 8.2, -53, dark); k.box(48, 0.5, 0.5, -4, 9.0, -57, steel); k.box(48, 0.5, 0.5, -4, 9.0, -49, steel);
    k.box(46, 0.3, 6, -4, 8.95, -53, k.flat(0x4a6a3a, 0, 0.9));
    for (const x of [-10.6, 10.6]) for (const z of [-56, -50]) { k.box(0.6, 7.6, 0.6, x, 3.8, z, dark); k.keepOut.push({ x, z, r: 0.7 }); }
    k.egg(v(0, 7.2, -53), { id: 'chelseablock-high-line', title: 'The freight line overhead', text: 'The elevated freight line through West Chelsea fell out of use between the 1960s and 1980, and in the early 2000s it was turned into a park in the air, a rails to trails greenway. The zoning changes that came with it set off a construction boom in the neighborhood around the galleries.', clue: 'Look up at the steel bridge crossing the street.', source: { name: 'Chelsea, Manhattan, Wikipedia', url: 'https://en.wikipedia.org/wiki/Chelsea,_Manhattan' } }, { r: 1.8 });
    k.egg(v(-6, 2.2, 44), { id: 'chelseablock-gasoline-alley', title: 'Before the galleries: Gasoline Alley', text: 'West Chelsea was once known as Gasoline Alley, a manufacturing district of garages, warehouses and freight terminals. In the late 1990s galleries began leaving SoHo for it, pushed out by rising rents and upscale retailers who wanted the same large airy spaces. Today the neighborhood has more than 200 galleries, and part of West Chelsea became a historic district in 2008.', clue: 'Stand on the sidewalk between the first two galleries.', source: { name: 'Chelsea, Manhattan, Wikipedia', url: 'https://en.wikipedia.org/wiki/Chelsea,_Manhattan' } }, { r: 1.6 });
    k.egg(v(4, 1.2, -30), { id: 'chelseablock-sandy', title: 'When the river came in', year: '2012', text: 'In October 2012 Hurricane Sandy flooded the gallery district, which runs from about 18th to 29th Street between Tenth Avenue and the West Side Highway. Thousands of artworks were destroyed, and basement storage was hit hardest: one dealer on 27th Street lost hundreds of thousands of dollars of art. Some galleries could not reopen until the new year.', clue: 'Look down the street toward the river at the end of the block.', source: { name: 'Chelsea art galleries destroyed by Sandy, ABC7 New York', url: 'https://abc7ny.com/archive/8882764/' } }, { r: 1.6 });
    mlowBanner(k, -7.6, 4.4, 50, PI / 2, 2.6, true);
    blossomFlag(k, -7.6, 4.4, -36, PI / 2, 2.4, 5, 'electric');
    k.censusWall({ x: 7.66, y: 3.2, z: 0, rotY: -PI / 2, cols: 40, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(5800, 160), pieces: ctx.all, backing: dark });
    k.box(0.3, 5, 24, 7.9, 2.5, 0, dark);
    for (let i = 0; i < 3; i++) { const z = 56 - i * 56; k.box(0.3, 3.2, 4.6, 7.8, 2.2, z, dark); mounts.push({ position: v(7.62, 2.3, z), rotation: -PI / 2, target: v(0, 2.5, z), width: 4.2, height: 2.5, style: 'black', wash: false }); }
    return { mounts, spawn: v(2, 3, 62), look: v(-10, 4, 0), eye: 3, bounds: [-34, 7, -70, 70], style: 'white' };
  },
};

/* ---------------- 105 FOTOGRAFISKA ---------------- */
export const fotografiska: RoomDef = {
  id: 'fotografiska',
  name: 'The mission house',
  area: 'FOTOGRAFISKA',
  mood: 'Park Avenue South, after nine',
  color: '#8a4a5a',
  description: 'The Flemish Revival landmark at 22nd Street, six floors of limestone over a granite base, dark galleries where the photographs glow, the bar upstairs, the works lit like prints in the dark.',
  signatures: 'The 1894 Church Missions House in Indiana limestone over a granite ground floor, its corner tourelles running the full height, the second floor arcade and the round arched fifth floor, the black painted galleries with spot lit photographs, the wide stair, the restaurant and the bar upstairs.',
  daylit: false,
  build(k, ctx) {
    k.sky({ top: 0x101426, horizon: 0x4a3a48, ground: 0x0a0a0e, fog: 0.0028, stars: 180, env: 0.55 });
    k.hemi(0xffd8c0, 0x14100c, 0.4);
    const brick = k.pbr('ftLime', X.ashlar(0xc9bfa8, 322, 3), 0.24), terra = k.pbr('ftTerra', X.ashlar(0xb89a7a, 323, 3), 0.2), black = k.pbr('ftBlack', X.plaster(0x141416, 182), 0.4, { roughness: 0.95 }),
      floorD = k.pbr('ftFloor', X.planks(0x2a2420, 6, 324, 0.2), 0.9, { roughness: 0.6 }), glass = k.glass(0xffe0b0, 0.3, 0.1), warm = k.glow(0xffd8a0, 0.85), dark = k.flat(0x1a1c20, 0.5, 0.6), gold = k.pbr('ftGold', X.gilt(0xd0a852), 2, { metalness: 0.85, roughness: 0.3 });
    street(k, { w: 26, len: 160, z: 36, x: 0 });
    blockFront(k, { x: 50, z0: 130, count: 12, face: -1, seed: 325, h: [18, 40] });
    blockFront(k, { x: -50, z0: 130, count: 12, face: 1, seed: 326, h: [18, 40] });
    const BX = 0, BZ = -10, BW = 30, BD = 30, BH = 26;
    k.box(BW, BH, BD, BX, BH / 2, BZ, brick);
    k.moulding([[0, 0], [1.0, 0], [1.1, 0.3], [0.7, 0.5], [0.9, 0.9], [0, 1.1]], BW + 0.4, BX, BH - 0.6, BZ + BD / 2 + 0.05, terra, 0);
    // granite ground storey, corner tourelles the full height with conical caps
    k.box(BW + 0.3, 4.2, BD + 0.3, BX, 2.1, BZ, k.pbr('ftGranite', X.ashlar(0x8a8680, 355, 2), 0.3));
    for (const sx of [-1, 1]) { k.cyl(1.5, BH + 1, BX + sx * (BW / 2 - 0.4), (BH + 1) / 2, BZ + BD / 2 - 0.4, brick, 1.5, 16); k.mesh(new T.ConeGeometry(1.7, 4, 16), k.flat(0x3a3e44, 0.3, 0.6), BX + sx * (BW / 2 - 0.4), BH + 3, BZ + BD / 2 - 0.4); k.keepOut.push({ x: BX + sx * (BW / 2 - 0.4), z: BZ + BD / 2 - 0.4, r: 1.8 }); }
    for (let f = 0; f < 6; f++) for (let i = 0; i < 5; i++) { const y = 3 + f * 4, x = BX - 10 + i * 5; if (f === 0) continue; if (f === 1) { k.arch(4.2, 3.6, 0.5, x, y - 1.6, BZ + BD / 2 + 0.05, terra, false, 0.6); k.box(3.8, 3.0, 0.06, x, y + 0.2, BZ + BD / 2 + 0.1, glass); continue; } if (f === 4) { k.arch(2.4, 3.6, 0.5, x, y - 1.2, BZ + BD / 2 + 0.05, terra, false, 0.75); k.box(2.0, 3.0, 0.06, x, y + 0.4, BZ + BD / 2 + 0.1, glass); } else { k.box(2.2, 2.8, 0.16, x, y, BZ + BD / 2 + 0.02, terra); k.box(1.8, 2.4, 0.06, x, y, BZ + BD / 2 + 0.1, f % 2 ? warm : k.flat(0x0a0a0c, 0, 0.9)); } }
    for (let i = 0; i < 4; i++) k.point(BX - 9 + i * 6, 2.2, BZ + BD / 2 + 2.5, 0xffc890, 30, 22);
    for (const x of [-16, 16]) { k.cyl(0.08, 5, x, 2.5, BZ + BD / 2 + 6, dark, 0.08, 8); k.sphere(0.3, x, 5.2, BZ + BD / 2 + 6, k.glow(0xffe0b0, 1.2)); k.point(x, 5.2, BZ + BD / 2 + 6, 0xffe0b0, 25, 20); }
    k.arch(3.2, 5, 3, BX, 0, BZ + BD / 2, terra, false, 0.85); k.block(-BW / 2, -1.8, BZ + BD / 2 - 0.6, BZ + BD / 2 + 0.6); k.block(1.8, BW / 2, BZ + BD / 2 - 0.6, BZ + BD / 2 + 0.6);
    k.sign('FOTOGRAFISKA  ·  NEW YORK', 8, 0.7, BX, 6.4, BZ + BD / 2 + 0.06, 'transparent', '#f0e4c8', 70, 0);
    k.egg(v(BX + BW / 2 - 0.4, 14, BZ + BD / 2 + 1.4), { id: 'fotografiska-steel', title: 'A steel frame in a stone coat', year: '1894', text: 'Behind the limestone is a self supporting steel superstructure filled with brick, with terracotta fireproofing and an elevator from the start. It predates the American Surety Building, usually called the first New York skyscraper with an all steel superstructure, by two years. The cornerstone was laid on October 3, 1892.', clue: 'Look up the round corner tower on the right.', source: { name: 'Church Missions House, Wikipedia', url: 'https://en.wikipedia.org/wiki/Church_Missions_House' } }, { r: 1.8 });
    k.egg(v(BX, 19.4, BZ + BD / 2 + 1.0), { id: 'fotografiska-haarlem', title: 'A Dutch town hall on Park Avenue South', text: 'The architects Robert W. Gibson and Edward J. Neville Stent drew on the town halls of Haarlem and medieval Amsterdam. The AIA Guide called the front equal to buildings of the Flemish and Dutch Renaissance. The round arched openings on the fifth floor suggest a medieval triforium, and the central gable carries a stone cross and a statue of St. Paul.', clue: 'Look up at the row of round arches near the top of the front.', source: { name: 'Church Missions House, Wikipedia', url: 'https://en.wikipedia.org/wiki/Church_Missions_House' } }, { r: 1.8 });
    k.egg(v(BX - 3, 2.2, BZ + BD / 2 + 2.4), { id: 'fotografiska-charity-row', title: 'Charity Row', text: 'The building was part of Charity Row, three blocks of charity headquarters. The New York Society for the Prevention of Cruelty to Children, the Xavier Society for the Blind, United Cerebral Palsy of New York City and the Russell Sage Foundation all had offices here. The Federation of Protestant Welfare Agencies bought it in 1963.', clue: 'Stand at the arched entrance on the avenue.', source: { name: 'Church Missions House, Wikipedia', url: 'https://en.wikipedia.org/wiki/Church_Missions_House' } }, { r: 1.6 });
    k.egg(v(BX + 3, 2.2, BZ + BD / 2 + 2.4), { id: 'fotografiska-281', title: 'They called it 281', year: '1935', text: 'Built for the Episcopal Church\'s Domestic and Foreign Missionary Society, the house was its headquarters for much of the 20th century and hosted the annual House of Bishops. Episcopalians simply called it 281, after the address. Women were first invited to the National Council\'s meetings here in 1935.', clue: 'Read the street number by the door.', source: { name: 'Church Missions House, Wikipedia', url: 'https://en.wikipedia.org/wiki/Church_Missions_House' } }, { r: 1.6 });
    mlowBanner(k, BX - 11, 12, BZ + BD / 2 + 0.6, 0, 3.0, true); blossomFlag(k, BX + 11, 12, BZ + BD / 2 + 0.6, 0, 2.6, 5, 'ink');
    // inside: two black galleries stacked, the stair, the prints spot lit, the bar level with arched windows
    const IW = BW - 1.2, ID = BD - 1.2;
    for (const [y, m] of [[0, black], [5, black], [10, black]] as const) { k.box(IW, 0.3, ID, BX, y + 0.15, BZ, y === 10 ? k.pbr('ftBar', X.planks(0x6a4a30, 6, 327), 1.0) : floorD); k.box(IW, 0.4, ID, BX, y + 4.6, BZ, dark); for (const s of [-1, 1]) k.box(0.3, 4.6, ID, BX + s * (IW / 2 - 0.2), y + 2.3, BZ, m); k.box(IW, 4.6, 0.3, BX, y + 2.3, BZ - ID / 2 + 0.2, m); void m; }
    k.block(BX - IW / 2 - 0.6, BX - IW / 2 + 0.2, BZ - ID / 2, BZ + ID / 2); k.block(BX + IW / 2 - 0.2, BX + IW / 2 + 0.6, BZ - ID / 2, BZ + ID / 2); k.block(BX - IW / 2, BX + IW / 2, BZ - ID / 2 - 0.6, BZ - ID / 2 + 0.2);
    for (let f = 0; f < 2; f++) { const y0 = f * 5; for (let i = 0; i < 14; i++) k.box(2.4, 0.36, 0.9, BX + IW / 2 - 1.5, y0 + 0.18 + i * 0.36, BZ + ID / 2 - 1.5 - i * 0.9, floorD); }
    k.block(BX + IW / 2 - 2.8, BX + IW / 2 - 0.3, BZ - ID / 2, BZ + ID / 2 - 1);
    for (let f = 0; f < 2; f++) { const y0 = f * 5; k.box(0.3, 4, 8, BX - 2, y0 + 2.2, BZ - 2, black); k.block(BX - 2.4, BX - 1.6, BZ - 6, BZ + 2); }
    k.box(8, 1.1, 1.0, BX - 4, 10.7, BZ - ID / 2 + 3, k.pbr('ftBarTop', X.marble(0x2a2a2e, 0x6a6a6e, 23), 0.5)); k.block(BX - 8, BX, BZ - ID / 2 + 2.4, BZ - ID / 2 + 3.6);
    for (let i = 0; i < 12; i++) k.cyl(0.05, 0.3, BX - 7.5 + i * 0.6, 11.4, BZ - ID / 2 + 3, [gold, k.flat(0x8a3a3a, 0, 0.5), glass][i % 3], 0.04, 8);
    for (let i = 0; i < 4; i++) { k.cyl(0.04, 0.7, BX + 4 + (i % 2) * 3, 10.5, BZ - 4 + Math.floor(i / 2) * 5, dark, 0.04, 6); k.cyl(0.4, 0.04, BX + 4 + (i % 2) * 3, 10.87, BZ - 4 + Math.floor(i / 2) * 5, k.flat(0x2a2a2e, 0.3, 0.5), 0.4, 14); k.keepOut.push({ x: BX + 4 + (i % 2) * 3, z: BZ - 4 + Math.floor(i / 2) * 5, r: 0.6 }); }
    for (let i = 0; i < 5; i++) k.point(BX - 10 + i * 5, 13, BZ + ID / 2 - 3, 0xffd8a0, 10, 8);
    k.egg(v(BX - 4, 12.2, BZ - ID / 2 + 3), { id: 'fotografiska-last-call', title: 'Last call on Park Avenue South', year: '2024', text: 'Fotografiska New York opened here in December 2019, with a 150 seat restaurant, Veronika, on the second floor that kept some of the old stained glass, and a bar in the former chapel. In 2024 the museum announced it would move to a larger space; the restaurant and the chapel bar closed in mid June, and the galleries closed on 29 September with Vivian Maier and Bruce Gilden on the walls.', clue: 'Lean on the bar upstairs.', source: { name: 'Fotografiska museum in New York is closing and relocating, The Art Newspaper', url: 'https://www.theartnewspaper.com/2024/05/24/fotografiska-museum-new-york-closing-relocating' } }, { r: 1.6 });
    k.egg(v(BX + 8, 2.4, BZ - 8), { id: 'fotografiska-delvey', title: 'The tenant who never was', text: 'Anna Sorokin, who called herself Anna Delvey, was a contender to lease this building for her proposed foundation. She was later indicted for fraud, and the building\'s fame grew again after the Netflix series Inventing Anna.', clue: 'Search the ground floor gallery, away from the stair.', source: { name: 'Church Missions House, Wikipedia', url: 'https://en.wikipedia.org/wiki/Church_Missions_House' } }, { r: 1.4 });
    eyeMedallion(k, BX, 0.16, BZ + 8, 1.6);
    donorWall(k, BX, 3.0, BZ - ID / 2 + 0.38, 0, 9, false);
    k.crowd([v(2, 0, 30), v(BX + 4, 0.15, BZ + 6), v(BX - 8, 0.15, BZ - 2), v(BX + 4, 0.15, BZ - 10)], 12, { seed: 148, speed: 0.3, spread: 1.8, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0x0d0d0d, 0x8a3a3a] });
    k.crowd([v(BX - 8, 10.15, BZ + 8), v(BX + 8, 10.15, BZ - 6)], 8, { seed: 149, speed: 0.25, spread: 1.6, animate: !ctx.reduced });
    k.censusWall({ x: BX - IW / 2 + 0.38, y: 7.4, z: BZ, rotY: PI / 2, cols: 30, rows: 4, tile: 0.5, gap: 0.05, start: ctx.wallStart(2700, 120), pieces: ctx.all, backing: dark });
    // the works: spot lit in the dark on every wall of both galleries, each with its own spot
    const mounts: Mount[] = [];
    for (let f = 0; f < 2; f++) { const y = f * 5 + 2.6; for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = BZ - 10 + i * 6.5; if (s > 0 && z > BZ) continue; mounts.push({ position: v(BX + s * (IW / 2 - 0.38), y, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(BX, y - 0.4, z), width: 3.0, height: 2.0, style: 'black', wash: false }); k.spot(BX + s * (IW / 2 - 4), y + 2.0, z, BX + s * (IW / 2 - 0.4), y, z, 0xfff0d8, 40, 0.5, 0.6, 8); } for (const x of [-9, -3, 3, 9]) { mounts.push({ position: v(BX + x, y, BZ - ID / 2 + 0.38), rotation: 0, target: v(BX + x, y - 0.4, BZ), width: 3.0, height: 2.0, style: 'black', wash: false }); k.spot(BX + x, y + 2.0, BZ - ID / 2 + 4, BX + x, y, BZ - ID / 2 + 0.4, 0xfff0d8, 40, 0.5, 0.6, 8); } for (const s of [-1, 1]) mounts.push({ position: v(BX - 2 + s * 0.22, y, BZ - 2), rotation: s < 0 ? -PI / 2 : PI / 2, target: v(BX - 2 + s * 5, y - 0.4, BZ - 2), width: 3.2, height: 2.2, style: 'black', wash: false }); }
    return { mounts, spawn: v(-4, 3, 28), look: v(BX, 12, BZ + BD / 2), eye: 3, bounds: [BX - IW / 2 + 0.8, IW / 2 - 0.8, BZ - ID / 2 + 1, 40], style: 'black', floorY: (x, z) => { for (const f of [0, 1]) { const y0 = f * 5; if (x > BX + IW / 2 - 2.8 && x < BX + IW / 2 - 0.3 && z < BZ + ID / 2 - 1 && z > BZ + ID / 2 - 14) { const t = (BZ + ID / 2 - 1 - z) / 13; if (f === 0 && t <= 1) return t * 5; } } if (x > BX + IW / 2 - 2.8 && x < BX + IW / 2 - 0.3 && z <= BZ + ID / 2 - 14 && z > BZ + ID / 2 - 27) { const t = (BZ + ID / 2 - 14 - z) / 13; return 5 + Math.min(1, t) * 5; } if (x > BX + IW / 2 - 2.8 && x < BX + IW / 2 - 0.3 && z <= BZ + ID / 2 - 27) return 10.15; return 0; } };
  },
};

/* ---------------- 106 MOMA PS1 ---------------- */
export const ps1: RoomDef = {
  id: 'ps1',
  name: 'The old school',
  area: 'MOMA PS1',
  mood: 'Warm Up Saturday',
  color: '#c8a888',
  description: 'The Romanesque public school in Long Island City, the concrete courtyard with its summer stage and the crowd, the classrooms turned galleries down long corridors, the boiler room, the works in the old school\'s bones.',
  signatures: 'The Victorian brick schoolhouse with its tower, the walled concrete courtyard with the summer installation and DJ stage, the long corridors of classrooms with their original wood and radiators, the sky room with the roof cut open.',
  build(k, ctx) {
    k.sky({ top: 0x5f94d8, horizon: 0xf0e8dc, ground: 0x6a6660, fog: 0.002, sun: { az: 3.0, el: 0.85, color: 0xfff6e8, size: 12 }, env: 1.0 });
    k.hemi(0xf6f6ff, 0x5a5048, 0.95);
    k.sun(0xfff2dc, 2.4, 20, 80, 30, true, 100);
    const brick = k.pbr('psBrick', X.brick(0x8a4a3a, 328), 0.28), conc = k.pbr('psConc', X.concrete(0x9a948a, 183), 0.3, { roughness: 0.85 }), floorW = k.pbr('psFloor', X.planks(0x8a6a48, 6, 329, 0.2), 0.9, { roughness: 0.6 }),
      white = k.pbr('psWhite', X.plaster(0xf6f6f4, 184), 0.4, { roughness: 0.9 }), dark = k.flat(0x1a1c20, 0.5, 0.6), glass = k.glass(0xdcecf6, 0.14, 0.04), steel = k.flat(0x8c98a4, 0.9, 0.3), pink = k.flat(0xf05aa0, 0, 0.7), radiator = k.flat(0xc8c0b0, 0.3, 0.6);
    street(k, { w: 20, len: 160, z: 46, x: 0 });
    blockFront(k, { x: 50, z0: 130, count: 10, face: -1, seed: 330, h: [10, 24] });
    for (const [x, z, w, h] of [[-70, -60, 30, 120], [60, -80, 34, 160]]) k.box(w as number, h as number, w as number, x as number, (h as number) / 2, z as number, k.pbr('licGlass', X.windows(74, 0.3, 0x6a88a0, false), 0.11, { emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.3, metalness: 0.5, stretch: 0.42 }));
    // the courtyard behind a concrete wall, the stage, the summer installation, the crowd
    const CX = 0, CZ = 10, CW = 50, CD = 34;
    k.box(CW, 0.4, CD, CX, -0.2, CZ, conc);
    for (const s of [-1, 1]) { k.box(0.6, 5, CD, CX + s * CW / 2, 2.5, CZ, conc); k.block(CX + s * CW / 2 - 0.6, CX + s * CW / 2 + 0.6, CZ - CD / 2, CZ + CD / 2); }
    for (const s of [-1, 1]) k.box(CW / 2 - 2.4, 5, 0.6, CX + s * (CW / 4 + 1.2), 2.5, CZ + CD / 2, conc); k.box(4.8, 1.4, 0.6, CX, 4.3, CZ + CD / 2, conc); k.block(CX - CW / 2, CX - 2.4, CZ + CD / 2 - 0.6, CZ + CD / 2 + 0.6); k.block(CX + 2.4, CX + CW / 2, CZ + CD / 2 - 0.6, CZ + CD / 2 + 0.6);
    // Eric Orr, Wall Slits, 1998: three vertical slits in the courtyard wall facing Jackson Avenue
    for (const x of [10.6, 11.5, 12.4]) k.box(0.14, 3.4, 0.7, CX + x, 2.3, CZ + CD / 2, dark);
    k.egg(v(CX + 11.5, 2.6, CZ + CD / 2 + 0.8), { id: 'ps1-wall-slits', title: 'Three cuts in the wall', year: '1998', text: 'The three narrow vertical slits in the courtyard wall facing Jackson Avenue are an artwork: Eric Orr\'s Wall Slits of 1998, meant to open the closed courtyard to the street. Most people walk past them on the way to the gate.', clue: 'Look along the outside of the courtyard wall, right of the gate.', source: { name: 'Artist Interventions, MoMA PS1', url: 'https://www.momaps1.org/programs/85-artist-interventions' } }, { r: 1.6 });
    k.box(16, 1.0, 8, CX + 12, 0.5, CZ - 8, dark); k.block(CX + 4, CX + 20, CZ - 12, CZ - 4);
    k.box(2.4, 0.9, 0.9, CX + 12, 1.45, CZ - 8, dark); for (const dx of [-3, 3]) k.box(1.0, 1.6, 0.8, CX + 12 + dx, 1.8, CZ - 8.4, dark);
    for (let i = 0; i < 5; i++) { const a = (i / 5) * PI * 2; const x = CX - 12 + Math.cos(a) * 6, z = CZ + 4 + Math.sin(a) * 6; k.beam(v(x, 0, z), v(CX - 12, 9, CZ + 4), 0.08, steel, 4); }
    const canopy = k.mesh(new T.ConeGeometry(9, 4, 5, 1, true), pink, CX - 12, 8, CZ + 4); canopy.rotation.x = PI; void canopy;
    if (!ctx.reduced) k.ticks.push((t) => { canopy.rotation.y = t * 0.1; canopy.scale.setScalar(1 + 0.03 * Math.sin(t)); });
    for (let i = 0; i < 6; i++) { const x = CX - 22 + i * 3, z = CZ + 12; k.cyl(0.05, 0.7, x, 0.35, z, steel, 0.05, 8); k.cyl(0.4, 0.04, x, 0.72, z, dark, 0.4, 14); k.keepOut.push({ x, z, r: 0.6 }); }
    eyeMonument(k, CX + 18, 0, CZ + 10, PI * 1.25, 4.6);
    blossomGarden(k, CX - 12, 0, CZ + 4, 4.4, 1.6);
    k.crowd([v(CX - 20, 0, CZ + 14), v(CX - 6, 0, CZ - 2), v(CX + 8, 0, CZ + 4), v(CX + 20, 0, CZ + 12)], 40, { seed: 150, speed: 0.3, spread: 3, animate: !ctx.reduced, closed: true, colors: [0xf08a2a, 0xf1c531, 0x3aa06a, 0xd83a6a, 0x24262c, 0xf4f0e8, 0x8a3ad8, 0x3a8ad8] });
    // the school: the brick block with its tower, the corridor of classrooms, the boiler room below
    const SX = 0, SZ = -30, SW = 50, SD = 30, SH = 18;
    k.box(SW, SH, SD, SX, SH / 2, SZ, brick);
    k.box(8, 10, 8, SX + SW / 2 - 6, SH + 5, SZ + SD / 2 - 6, brick); k.mesh(new T.ConeGeometry(6, 5, 4), k.pbr('psSlate', X.steel(0x3a3a40, false, 331), 0.4), SX + SW / 2 - 6, SH + 12.5, SZ + SD / 2 - 6).rotation.y = PI / 4;
    for (let f = 0; f < 3; f++) for (let i = 0; i < 10; i++) { const y = 3.6 + f * 5.2, x = SX - 22 + i * 4.8; k.arch(1.8, 3.6, 0.4, x, y - 1.8, SZ + SD / 2 + 0.05, k.pbr('psStone', X.ashlar(0xb8a890, 332, 3), 0.22), false, 0.7); k.box(1.4, 3, 0.06, x, y, SZ + SD / 2 + 0.1, glass); }
    k.arch(3, 4.6, 2, SX, 0, SZ + SD / 2, k.pbr('psStone', X.ashlar(0xb8a890, 332, 3), 0.22), false, 0.85); k.block(SX - SW / 2, SX - 1.8, SZ + SD / 2 - 0.6, SZ + SD / 2 + 0.6); k.block(SX + 1.8, SX + SW / 2, SZ + SD / 2 - 0.6, SZ + SD / 2 + 0.6);
    k.sign('PUBLIC SCHOOL 1  ·  1892  ·  MOMA PS1', 10, 0.7, SX, 16, SZ + SD / 2 + 0.06, 'transparent', '#e8dcc0', 70, 0);
    k.egg(v(SX, 2.8, SZ + SD / 2 + 1.0), { id: 'ps1-weiner-doors', title: 'Words on the front door', year: '1976', text: 'The text on the glass of the entrance doors is Lawrence Weiner\'s A bit of matter and a little bit more., first placed on the entrance and the back door in 1976 for the opening of the art center. After the 1997 renovation it was recreated on the front door windows. The art center opened in 1976 in a public school building from 1892.', clue: 'Read the glass of the front doors before you go in.', source: { name: 'Artist Interventions, MoMA PS1', url: 'https://www.momaps1.org/programs/85-artist-interventions' } }, { r: 1.4 });
    mlowBanner(k, SX - 16, 9, SZ + SD / 2 + 0.6, 0, 3.2, true); blossomFlag(k, SX + 16, 9, SZ + SD / 2 + 0.6, 0, 2.8, 5, 'electric');
    const HW = 4, HZ = SZ;
    k.box(HW, 0.3, SD - 1.2, SX, 0.15, HZ, floorW);
    const rooms: [number, number][] = [[-1, -4], [1, -4], [-1, 4], [1, 4], [-1, 12], [1, 12]];
    const mounts: Mount[] = [];
    rooms.forEach(([sx, dz], i) => { const rx = SX + sx * (HW / 2 + 5), rz = HZ - dz + 0; const rw = 10, rd = 7; k.box(rw, 0.3, rd, rx, 0.15, rz, floorW); k.box(rw, 0.4, rd, rx, 4.6, rz, dark); for (const s of [-1, 1]) { k.box(rw, 4.6, 0.3, rx, 2.3, rz + s * (rd / 2 - 0.15), i % 2 ? white : k.pbr('psGreen', X.plaster(0x8a9a7a, 185), 0.4)); k.block(rx - rw / 2, rx + rw / 2, rz + s * (rd / 2 - 0.4), rz + s * (rd / 2 + 0.4)); } k.box(0.3, 4.6, rd, rx + sx * (rw / 2 - 0.15), 2.3, rz, white); k.block(rx + sx * (rw / 2 - 0.4), rx + sx * (rw / 2 + 0.4), rz - rd / 2, rz + rd / 2); k.box(0.3, 4.6, 2, rx - sx * (rw / 2 - 0.15), 2.3, rz - rd / 2 + 1, white); k.box(0.3, 4.6, 2, rx - sx * (rw / 2 - 0.15), 2.3, rz + rd / 2 - 1, white); k.block(rx - sx * (rw / 2 + 0.4), rx - sx * (rw / 2 - 0.4), rz - rd / 2, rz - rd / 2 + 2); k.block(rx - sx * (rw / 2 + 0.4), rx - sx * (rw / 2 - 0.4), rz + rd / 2 - 2, rz + rd / 2); k.box(1.4, 0.8, 0.3, rx + sx * (rw / 2 - 0.4), 0.55, rz, radiator); k.point(rx, 4, rz, 0xfff4e8, 16, 10); k.box(1.2, 1.0, 0.1, rx + sx * (rw / 2 - 0.2), 2.6, rz - 2, glass); mounts.push({ position: v(rx + sx * (rw / 2 - 0.32), 2.6, rz + 1.5), rotation: sx < 0 ? PI / 2 : -PI / 2, target: v(rx, 2.4, rz + 1.5), width: 2.6, height: 1.8, style: 'white', wash: true }); for (const s of [-1, 1]) mounts.push({ position: v(rx, 2.6, rz + s * (rd / 2 - 0.32)), rotation: s > 0 ? PI : 0, target: v(rx, 2.4, rz), width: 4.4, height: 2.6, style: i % 2 ? 'white' : 'black', wash: true }); });
    for (const s of [-1, 1]) k.box(0.3, 4.6, SD - 1.2, SX + s * HW / 2, 2.3, HZ, white);
    k.box(1.6, 0.4, 1.6, -7, 4.5, HZ - 12, k.glow(0x9cc8f4, 1.0)); k.point(-7, 3.6, HZ - 12, 0xcfe4ff, 10, 6);
    k.egg(v(-7, 4.0, HZ - 12), { id: 'ps1-turrell-meeting', title: 'A classroom open to the sky', year: '1986', text: 'Upstairs on the third floor, James Turrell\'s Meeting cuts an opening in the ceiling of an old classroom so you sit and watch the sky. It was commissioned in 1976 and opened in 1986, and entered MoMA\'s collection in 2016. Its lights run on a program that times the sequence to the sun through the year.', clue: 'Look up at the pale square in the ceiling of a far classroom.', source: { name: 'Artist Interventions, MoMA PS1', url: 'https://www.momaps1.org/programs/85-artist-interventions' } }, { r: 1.4 });
    k.egg(v(-11.4, 1.8, HZ + 2.5), { id: 'ps1-saret-hole', title: 'A hole dug in the brick', year: '1976', text: 'Alan Saret\'s The Hole at P.S.1, Fifth Solar Chthonic Wall Temple is a carefully sized and shaped hole dug out of a brick wall on the third floor of the school. It dates from 1976, the year the art center opened, and the sunlight coming through it shapes the work.', clue: 'Search the outer brick wall of a classroom on the left.', source: { name: 'Artist Interventions, MoMA PS1', url: 'https://www.momaps1.org/programs/85-artist-interventions' } }, { r: 1.4 });
    k.egg(v(SX, 4.1, HZ), { id: 'ps1-exit-bulbs', title: 'Exit, on every bulb', year: '1976', text: 'Richard Artschwager painted the word Exit on each of the five bulbs lighting a ground floor corridor, a piece called Exit, Don\'t fight City Hall, made for the inaugural exhibition Rooms in 1976. His black oval blps also turn up in hallways and stairwells all over the building.', clue: 'Look up at the lights in the long corridor.', source: { name: 'Artist Interventions, MoMA PS1', url: 'https://www.momaps1.org/programs/85-artist-interventions' } }, { r: 1.6 });
    k.egg(v(SX + 1.0, 0.35, SZ + SD / 2 - 5), { id: 'ps1-rist-floor', title: 'A tiny video in the floor', year: '1994', text: 'Look down in the lobby: Pipilotti Rist\'s Selbstlos im Lavabad, Selfless in the Bath of Lava, is a small video embedded in a hole in the floor. Most visitors step right over it.', clue: 'Look at your feet just inside the front door.', source: { name: 'Artist Interventions, MoMA PS1', url: 'https://www.momaps1.org/programs/85-artist-interventions' } }, { r: 1.2 });
    k.box(HW, 0.4, SD - 1.2, SX, 4.6, HZ, dark); for (let z = -12; z <= 12; z += 6) k.point(SX, 4, HZ + z, 0xfff4e8, 12, 8);
    k.block(SX - SW / 2, SX + SW / 2, SZ - SD / 2 - 0.6, SZ - SD / 2 + 0.6);
    donorWall(k, SX, 3.4, SZ - SD / 2 + 0.62, 0, 4, false);
    eyeMedallion(k, SX, 0.16, HZ + SD / 2 - 3, 1.4);
    k.crowd([v(SX, 0.15, HZ + 12), v(SX, 0.15, HZ - 12)], 8, { seed: 151, speed: 0.3, spread: 1, animate: !ctx.reduced });
    k.censusWall({ x: SX, y: 2.6, z: SZ - SD / 2 + 0.66, rotY: 0, cols: 6, rows: 4, tile: 0.5, gap: 0.05, start: ctx.wallStart(4700, 24), pieces: ctx.all, backing: dark });
    for (let i = 0; i < 4; i++) { const x = CX - 18 + i * 12; k.box(4.6, 3.2, 0.3, x, 2.0, CZ + CD / 2 - 0.5, dark); mounts.push({ position: v(x, 2.1, CZ + CD / 2 - 0.68), rotation: PI, target: v(x, 2, CZ), width: 4.2, height: 2.5, style: 'black', wash: false }); }
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = CZ - 10 + i * 10; k.box(0.3, 3.2, 4.6, CX + s * (CW / 2 - 0.5), 2.0, z, dark); mounts.push({ position: v(CX + s * (CW / 2 - 0.68), 2.1, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(CX + s * 10, 2, z), width: 4.2, height: 2.5, style: 'black', wash: false }); }
    return { mounts, spawn: v(4, 3, 24), look: v(SX, 9, SZ + SD / 2), eye: 3, bounds: [-CW / 2 + 1, CW / 2 - 1, SZ - SD / 2 + 1, 52], style: 'white' };
  },
};
