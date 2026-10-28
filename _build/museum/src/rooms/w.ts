/* Rooms 107 to 111: the Noguchi Museum, Socrates Sculpture Park, the Brooklyn Museum's court, Pioneer Works, the Bronx Museum. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront } from './f';
import { libertyFigure, LIBERTY_CREDIT } from './b';
import { standIn } from './heroes';
import { mlowBanner, blossomFlag, donorWall, eyeMedallion, wordmarkRelief, eyeMonument, blossomGarden, INK, CLOUD, ELECTRIC, CYAN } from './brand';

const PI = Math.PI;

/* ---------------- 107 THE NOGUCHI MUSEUM ---------------- */
export const noguchi: RoomDef = {
  id: 'noguchi',
  name: 'The stone garden',
  area: 'THE NOGUCHI MUSEUM',
  mood: 'Vernon Boulevard, still',
  color: '#8a8a80',
  description: 'A block of industrial Queens, the concrete block building and the walled garden: basalt and granite standing in gravel under a katsura tree, the open air gallery, the works among the stones.',
  signatures: 'The 1920s brick photoengraving plant and its concrete block addition, the open roofed first gallery, the garden paved with granite railway stones, stones among bamboo, katsura, black pines and cherries, The Well of six sided basalt, the paper lanterns hung inside, the raw light.',
  build(k, ctx) {
    k.sky({ top: 0x8fa8c8, horizon: 0xe8e8e2, ground: 0x6a6a66, fog: 0.0024, sun: { az: 3.3, el: 0.6, color: 0xf6f4ee, size: 12 }, haze: 0.4, env: 0.9 });
    k.hemi(0xeef0f4, 0x5a5a58, 0.9);
    k.sun(0xf8f4ec, 1.8, 20, 60, 30, true, 70);
    const block = k.pbr('ngBlock', X.concrete(0x9a9a94, 186), 0.4, { roughness: 0.9 }), brick = k.pbr('ngBrick2', X.brick(0x6a5a4a, 333), 0.28), gravel = k.pbr('ngGravel', X.cobble(0xb8b4a8, 187), 1.4, { roughness: 1 }),
      floorC = k.pbr('ngFloorC', X.concrete(0xb8b4ac, 188), 0.3, { roughness: 0.7 }), dark = k.flat(0x1a1c20, 0.5, 0.6), paper = k.glow(0xfff4e0, 0.9), bamboo = k.flat(0x8aa06a, 0, 0.8), water = k.flat(0x2a3a44, 0.2, 0.1, { transparent: true, opacity: 0.85 });
    street(k, { w: 16, len: 140, z: 36, x: 0 });
    blockFront(k, { x: 30, z0: 100, count: 8, face: -1, seed: 334, h: [8, 14] });
    k.water({ y: -1.4, color: 0x2e4a5c, w: 400, d: 400, x: -200, z: 0, amp: 1 });
    k.skyline({ z: 0, count: 20, spacing: 7, scale: 4.2, base: -1.4, seed: 335, lit: 0.2, glow: 0.4, tint: 0x6e7684, x: -480, spires: true });
    // the building: a two storey block and brick factory with the corner gallery open to the sky, the garden walled beside it
    const BX = -18, BZ = -6, BW = 30, BD = 26;
    k.box(BW, 9, BD, BX, 4.5, BZ, block);
    k.box(BW + 0.4, 3, BD + 0.4, BX, 1.5, BZ, brick);
    const OX = BX + BW / 2 - 6, OZ = BZ + BD / 2 - 6;
    k.box(12, 9.4, 12, OX, 4.7, OZ, k.flat(0, 0, 1, { transparent: true, opacity: 0 }));
    for (const s of [-1, 1]) { k.box(0.5, 9, 12, OX + s * 6, 4.5, OZ, block); }
    k.block(BX - BW / 2, BX + BW / 2, BZ + BD / 2 - 0.6, BZ + BD / 2 + 0.6);
    k.block(BX - BW / 2 - 0.5, BX - BW / 2 + 0.5, BZ - BD / 2, BZ + BD / 2); k.block(BX + BW / 2 - 0.5, BX + BW / 2 + 0.5, BZ - BD / 2, BZ + BD / 2); k.block(BX - BW / 2, BX + BW / 2, BZ - BD / 2 - 0.5, BZ - BD / 2 + 0.5);
    k.box(4, 4, 0.3, BX + 4, 2, BZ + BD / 2 + 0.3, k.glass(0xdcecf6, 0.14, 0.04)); k.block(BX - BW / 2, BX + 2, BZ + BD / 2 - 0.5, BZ + BD / 2 + 0.7); k.block(BX + 6, BX + BW / 2, BZ + BD / 2 - 0.5, BZ + BD / 2 + 0.7);
    k.sign('THE NOGUCHI MUSEUM', 5, 0.5, BX + 4, 5.2, BZ + BD / 2 + 0.36, 'transparent', '#1a1c20', 60, 0);
    k.egg(v(BX + 4, 6.2, BZ + BD / 2 + 0.8), { id: 'noguchi-living-artist', title: 'A museum by its own artist', year: '1985', text: 'In 1974 Noguchi bought a photogravure plant and a gas station across the street from the studio where he had lived and worked since 1961. The museum opened seasonally in 1985, the first museum of its kind established by a living artist in America.', clue: 'Read the name over the entrance.', source: { name: 'Noguchi Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/Noguchi_Museum' } }, { r: 1.6 });
    mlowBanner(k, BX - 8, 5.2, BZ + BD / 2 + 0.6, 0, 2.4, false);
    const IW = BW - 1.2, ID = BD - 1.2;
    k.box(IW, 0.3, ID, BX, 0.15, BZ, floorC);
    k.box(IW, 0.4, ID, BX, 9, BZ, dark);
    for (let i = 0; i < 6; i++) { const x = BX - 10 + (i % 3) * 8, z = BZ - 8 + Math.floor(i / 3) * 10; k.mesh(new T.SphereGeometry(0.7, 12, 8), paper, x, 6.5, z).scale.set(1, 1.3, 1); k.cyl(0.01, 2, x, 8, z, dark, 0.01, 4); k.point(x, 6, z, 0xfff4e0, 12, 8); }
    k.box(0.4, 9, 12, OX - 6, 4.5, OZ, block); k.box(12, 9, 0.4, OX, 4.5, OZ - 6, block);
    k.block(OX - 6.4, OX - 5.6, OZ - 6, OZ + 6); k.block(OX - 6, OX + 6, OZ - 6.4, OZ - 5.6);
    for (const [x, z, p, h] of [[BX - 8, BZ - 4, 'noguchi_stone_1', 2.6], [BX, BZ + 4, 'noguchi_stone_2', 3.0], [BX + 6, BZ - 6, 'noguchi_stone_3', 3.4], [BX - 4, BZ + 8, 'noguchi_stone_2', 2.2]] as const) k.prop(p, x, 0.15, z, { height: h, keepOut: 1.8 });
    k.prop('noguchi_stone_3', OX, 0.15, OZ, { height: 3.6, keepOut: 2 }); k.box(10, 0.2, 10, OX, 0.1, OZ, gravel);
    k.egg(v(OX + 3, 2.4, OZ + 3), { id: 'noguchi-sunnyside', title: 'The years in Sunnyside', year: '2004', text: 'A $13.5 million master plan was approved in 1999, and while the building was rebuilt the museum moved temporarily to Sunnyside, Queens. It was chartered in February 2004 and came home in June 2004; a second $8 million stabilization project started in September 2008. Socrates Sculpture Park is one block away.', clue: 'Stand in the gallery with no roof.', source: { name: 'Noguchi Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/Noguchi_Museum' } }, { r: 1.6 });
    k.egg(v(BX - 8, 3.4, BZ - 4), { id: 'noguchi-backwards', title: 'A visit that runs backwards', text: 'The galleries hold about 250 sculptures across two floors and twelve galleries. The visit begins with his late work, upright monoliths of granite and basalt, and moves back in time, so the early portrait busts and theater set objects wait at the rear of the second floor.', clue: 'Start at the tall dark stones in the first gallery.', source: { name: 'A Refuge From the Gallery Hunters, The Christian Science Monitor', url: 'https://www.csmonitor.com/1991/1016/16181.html' } }, { r: 1.6 });
    // the garden: gravel, stones, the katsura, bamboo along the wall, the water stone
    const GX = 14, GZ = -6, GW = 26, GD = 30;
    k.box(GW, 0.3, GD, GX, 0.15, GZ, k.pbr('ngRailStone', X.pavers(0x8e8a82, 356), 0.7, { roughness: 0.95 }));
    for (const s of [-1, 1]) { k.box(0.6, 4, GD, GX + s * GW / 2, 2, GZ, block); k.block(GX + s * GW / 2 - 0.6, GX + s * GW / 2 + 0.6, GZ - GD / 2, GZ + GD / 2); }
    k.box(GW, 4, 0.6, GX, 2, GZ - GD / 2, block); k.block(GX - GW / 2, GX + GW / 2, GZ - GD / 2 - 0.6, GZ - GD / 2 + 0.6);
    k.box(GW, 4, 0.6, GX, 2, GZ + GD / 2, block); k.block(GX - GW / 2, GX - 1.4, GZ + GD / 2 - 0.6, GZ + GD / 2 + 0.6); k.block(GX + 1.4, GX + GW / 2, GZ + GD / 2 - 0.6, GZ + GD / 2 + 0.6);
    const rnd = X.mulberry(107);
    for (const [x, z, p, h] of [[GX - 8, GZ - 8, 'noguchi_stone_1', 3.0], [GX + 6, GZ - 2, 'noguchi_stone_3', 4.0], [GX - 4, GZ + 6, 'noguchi_stone_2', 2.4], [GX + 8, GZ + 10, 'noguchi_stone_1', 2.0], [GX - 9, GZ + 12, 'noguchi_stone_2', 2.8]] as const) k.prop(p, x, 0.15, z, { height: h, keepOut: 2 });
    k.tree(GX + 2, 0.15, GZ + 2, { kind: 'round', h: 9, r: 6, leaf: 0x8a9a5a, seed: 3 });
    for (const [x, z, sp, h] of [[GX + 9, GZ - 11, 'pine', 6], [GX - 10, GZ + 2, 'pine', 5], [GX + 3, GZ - 12, 'cherry', 5]] as const) { k.tree(x, 0.15, z, { h, r: 2.4, seed: x + z, species: sp }); k.keepOut.push({ x, z, r: 1.0 }); }
    k.egg(v(GX + 2, 3.2, GZ + 2), { id: 'noguchi-tree-of-heaven', title: 'The tree he would not cut', year: '2008', text: 'For decades the center of the garden was a 60 foot Tree of Heaven, about 75 years old, which predated the museum and which Noguchi spared when he bought the property. It was cut down in March 2008. Its wood went to the Detroit Tree of Heaven Woodshop, which made it into benches and sculptures.', clue: 'Stand under the big tree in the middle of the garden.', source: { name: 'Noguchi Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/Noguchi_Museum' } }, { r: 1.8 });
    for (let i = 0; i < 40; i++) { const z = GZ - GD / 2 + 1 + rnd() * (GD - 2); k.cyl(0.04, 4 + rnd() * 2, GX + GW / 2 - 1 - rnd() * 1.2, 2.2, z, bamboo, 0.035, 6); }
    // The Well, 1982: a six sided basalt block, water rising through its flat top and sliding evenly down every side
    k.mesh(new T.CylinderGeometry(1.2, 1.25, 0.9, 6), k.flat(0x2e2f31, 0, 0.9), GX - 6, 0.6, GZ - 2); k.mesh(new T.CylinderGeometry(1.21, 1.21, 0.04, 6), water, GX - 6, 1.06, GZ - 2); k.keepOut.push({ x: GX - 6, z: GZ - 2, r: 1.6 });
    const sheet = k.mesh(new T.CylinderGeometry(1.22, 1.27, 0.9, 6, 1, true), k.flat(0x8ab0c4, 0.4, 0.05, { transparent: true, opacity: 0.25 }), GX - 6, 0.6, GZ - 2, true);
    if (!ctx.reduced) k.ticks.push((t) => { (sheet.material as T.MeshStandardMaterial).opacity = 0.2 + 0.08 * Math.sin(t * 3); });
    k.egg(v(GX - 6, 1.6, GZ - 2), { id: 'noguchi-the-well', title: 'A basin that gives water away', year: '1982', text: 'The Well is a six sided basalt fountain from 1982, a variation on the Japanese tsukubai, the stone basin at a tea garden. Water rises through its flat top and flows evenly over every side. A traditional tsukubai collects water; Noguchi\'s releases it.', clue: 'Find the dark stone that is always wet.', source: { name: 'A Refuge From the Gallery Hunters, The Christian Science Monitor', url: 'https://www.csmonitor.com/1991/1016/16181.html' } }, { r: 1.4 });
    blossomGarden(k, GX, 0.15, GZ + GD / 2 - 6, 3.4, 1.4);
    for (const x of [GX - 8, GX + 8]) k.prop('museum_bench', x, 0.15, GZ - GD / 2 + 3, { height: 0.5, keepOut: 1.4 });
    k.egg(v(GX - 8, 1.0, GZ - GD / 2 + 3), { id: 'noguchi-railway-stones', title: 'Railway stones underfoot', text: 'The garden is paved with granite railway stones, and the low benches are granite and travertine that Noguchi made in the 1960s. The plantings he chose include katsura, Japanese black pines, cherry trees and bamboo.', clue: 'Sit on a low stone bench at the back of the garden.', source: { name: 'A Refuge From the Gallery Hunters, The Christian Science Monitor', url: 'https://www.csmonitor.com/1991/1016/16181.html' } }, { r: 1.4 });
    donorWall(k, GX, 2.6, GZ - GD / 2 + 0.42, 0, 8, false);
    eyeMedallion(k, BX + 4, 0.16, BZ + 6, 1.4);
    k.crowd([v(BX + 4, 0, BZ + BD / 2 + 8), v(BX, 0.15, BZ), v(OX, 0.15, OZ + 3), v(GX - 6, 0.15, GZ + 8), v(GX + 6, 0.15, GZ - 8)], 10, { seed: 152, speed: 0.25, spread: 1.6, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da] });
    k.censusWall({ x: BX - IW / 2 + 0.36, y: 4.6, z: BZ, rotY: PI / 2, cols: 24, rows: 4, tile: 0.5, gap: 0.05, start: ctx.wallStart(5200, 96), pieces: ctx.all, backing: dark });
    // the works: the concrete walls of the galleries, few and quiet, and the garden walls
    const mounts: Mount[] = [];
    for (let i = 0; i < 3; i++) { const z = BZ - 8 + i * 8; mounts.push({ position: v(BX - IW / 2 + 0.38, 3.2, z), rotation: PI / 2, target: v(BX, 2.6, z), width: 3.6, height: 2.4, style: 'none', wash: true }); }
    for (const x of [-10, -2]) mounts.push({ position: v(BX + x, 3.2, BZ - ID / 2 + 0.38), rotation: 0, target: v(BX + x, 2.6, BZ), width: 3.6, height: 2.4, style: 'none', wash: true });
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = GZ - 10 + i * 8; mounts.push({ position: v(GX + s * (GW / 2 - 0.38), 2.0, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(GX, 1.8, z), width: 3.2, height: 2.0, style: 'none', wash: false }); }
    mounts.push({ position: v(OX - 5.7, 3.2, OZ), rotation: PI / 2, target: v(OX, 2.6, OZ), width: 4.4, height: 2.8, style: 'none', wash: true });
    mounts.push({ position: v(OX, 3.2, OZ - 5.7), rotation: 0, target: v(OX, 2.6, OZ), width: 4.4, height: 2.8, style: 'none', wash: true });
    for (const x of [-6, 6]) mounts.push({ position: v(GX + x, 2.4, GZ - GD / 2 + 0.38), rotation: 0, target: v(GX + x, 2, GZ), width: 3.6, height: 2.2, style: 'none', wash: true });
    return { mounts, spawn: v(GX + 8, 3, GZ + GD / 2 - 2), look: v(GX - GW / 2 + 1, 2.4, GZ - 4), eye: 3, bounds: [BX - IW / 2 + 0.8, GX + GW / 2 - 0.8, BZ - BD / 2 + 1, 34], style: 'none' };
  },
};

/* ---------------- 108 SOCRATES SCULPTURE PARK ---------------- */
export const socrates: RoomDef = {
  id: 'socrates',
  name: 'Sculpture on the river',
  area: 'SOCRATES SCULPTURE PARK',
  mood: 'Wind off Hallets Cove',
  color: '#7aa07a',
  description: 'The reclaimed lot on the East River: big sculpture on the lawn, the cove and the island across the water, kayaks pulled up, the works standing in the open air.',
  signatures: 'The open waterfront lawn with monumental outdoor sculpture, the wooden studio shed and gate of found steel, the rocky shore and kayak launch, Roosevelt Island and the Manhattan skyline across the river.',
  build(k, ctx) {
    k.sky({ top: 0x5f94d8, horizon: 0xeef0ec, ground: 0x5a6a5a, fog: 0.0018, sun: { az: 4.0, el: 0.55, color: 0xfff4e6, size: 12 }, env: 1.0 });
    k.hemi(0xf2f6ff, 0x4a5a48, 0.95);
    k.sun(0xfff0dc, 2.4, -50, 60, 30, true, 100);
    const lawn = k.pbr('scLawn', X.grass(0x4a7a3a, 189), 0.06), gravel = k.pbr('scGravel', X.cobble(0xa39a86, 190), 1.1), steel = k.pbr('scSteel', X.steel(0x6a4a2a, true, 336), 0.5, { metalness: 0.6, roughness: 0.7 }),
      wood = k.pbr('scWood', X.planks(0x8a6a48, 5, 337), 1.0), dark = k.flat(0x1a1c20, 0.5, 0.6), rock = k.pbr('scRock', X.ashlar(0x6a6a64, 338, 1), 0.12, { roughness: 0.95 }), white = k.flat(0xf4f0e8, 0.05, 0.6);
    k.box(160, 0.4, 120, 0, -0.2, 0, lawn);
    k.water({ y: -1.6, color: 0x2e4a5c, w: 600, d: 400, x: -250, z: 0, amp: 1.2 });
    for (let i = 0; i < 30; i++) { const rnd = X.mulberry(108 + i); k.mesh(new T.DodecahedronGeometry(0.8 + rnd() * 1.4, 0), rock, -76 + rnd() * 6, -0.6 + rnd() * 0.6, -60 + i * 4); }
    k.egg(v(-70, 1.2, -20), { id: 'socrates-sunswick', title: 'A creek under your feet', text: 'The park sits atop the mouth of Sunswick Creek, which is buried beneath it. Before the park the ground was an abandoned landfill and an illegal dumpsite on Gibbs Point in Astoria.', clue: 'Walk to the rocks at the water\'s edge.', source: { name: 'Socrates Sculpture Park, Wikipedia', url: 'https://en.wikipedia.org/wiki/Socrates_Sculpture_Park' } }, { r: 1.6 });
    k.egg(v(-66, 2.4, 20), { id: 'socrates-hell-gate', title: 'Looking at Hell Gate', text: 'The park looks across the East River at Hell Gate and the northern end of Roosevelt Island. Since it began, the park has shown work by more than one thousand artists, most of it large sculpture that could not fit indoors.', clue: 'Stand near the shore and look out over the river.', source: { name: 'Socrates Sculpture Park, Six to Celebrate, Historic Districts Council', url: 'https://6tocelebrate.org/site/socrates-sculpture-park/' } }, { r: 1.6 });
    k.skyline({ z: 0, count: 24, spacing: 7, scale: 4.4, base: -1.6, seed: 339, lit: 0.2, glow: 0.4, tint: 0x6e7684, x: -420, spires: true });
    k.box(40, 6, 200, -150, 1, 0, k.pbr('scIsland', X.grass(0x4a6a3a, 191), 0.06)); for (let i = 0; i < 6; i++) k.box(12, 30 + i * 4, 12, -150, 15 + i * 2, -80 + i * 32, k.pbr('scTowers', X.windows(340, 0.3, 0x8a8478, true), 0.12, { emissive: 0xffffff, emissiveIntensity: 0.4, stretch: 0.42 }));
    street(k, { w: 16, len: 140, z: 0, x: 88 });
    blockFront(k, { x: 100, z0: 60, count: 10, face: -1, seed: 341, h: [8, 14] });
    // the gate of found steel, the studio shed, the gravel path
    for (const s of [-1, 1]) { k.box(1.2, 6, 1.2, 76, 3, s * 4, steel); }
    k.box(10, 1.2, 1.2, 76, 6.6, 0, steel); k.sign('SOCRATES SCULPTURE PARK', 8, 0.8, 75.35, 6.6, 0, 'transparent', '#f4f0e8', 70, -PI / 2);
    k.block(60, 78, 4.6, 60); k.block(60, 78, -60, -4.6);
    // the entrance billboard on Vernon Boulevard, an artwork of its own since 1999, changed once or twice a year
    for (const z of [-15.5, -8.5]) k.box(0.4, 7.6, 0.4, 78.6, 3.8, z, steel);
    k.box(0.3, 4.2, 8.4, 78.6, 5.6, -12, dark); k.box(0.06, 3.8, 8.0, 78.8, 5.6, -12, k.flat(0xe8c43a, 0, 0.6));
    k.egg(v(77.6, 5.6, -12), { id: 'socrates-billboard', title: 'The billboard is a sculpture', year: '1999', text: 'The big billboard at the entrance has been an ongoing installation since 1999, with one or two new works a year that point to the shows inside. It was first built by Ross H. Radtke, a neighbor and volunteer mechanical engineer.', clue: 'Look at the billboard on its posts beside the gate.', source: { name: 'Socrates Sculpture Park, Wikipedia', url: 'https://en.wikipedia.org/wiki/Socrates_Sculpture_Park' } }, { r: 1.8 });
    k.egg(v(75.4, 7.6, 0), { id: 'socrates-name', title: 'Why Socrates', text: 'The coalition that made the park named it after the Greek philosopher Socrates, who lived from 469 to 399 B.C., and in honor of the large Greek community of neighboring Astoria.', clue: 'Read the name over the steel gate.', source: { name: 'Socrates Sculpture Park, Six to Celebrate, Historic Districts Council', url: 'https://6tocelebrate.org/site/socrates-sculpture-park/' } }, { r: 1.6 });
    k.box(6, 0.3, 140, 40, 0.05, 0, gravel);
    k.box(14, 6, 10, 50, 3, -40, wood); k.mesh(new T.ConeGeometry(10, 3, 4), k.flat(0x4a4a48, 0, 0.9), 50, 7.5, -40).rotation.y = PI / 4; k.block(43, 57, -45, -35);
    mlowBanner(k, 42.8, 3.6, -40, -PI / 2, 2.8, true);
    // the big sculptures: the Blender kit's bronzes and stones at outdoor scale, the eye monument, the blossom garden
    k.egg(v(-10, 3, -16), { id: 'socrates-di-suvero', title: 'Made by sculptors, from a dump', year: '1986', text: 'The sculptor Mark di Suvero created the park on the old dump in 1986. It is about four acres, the largest outdoor space in New York City dedicated to showing sculpture, and about 89,000 people visit a year. In 2018 Virginia Overton became the first woman to have a solo exhibition here.', clue: 'Stand under the tall hanging mobile on the lawn.', source: { name: 'Socrates Sculpture Park, Wikipedia', url: 'https://en.wikipedia.org/wiki/Socrates_Sculpture_Park' } }, { r: 1.6 });
    k.egg(v(40, 1.6, -64), { id: 'socrates-1998', title: 'Saved from a marina', year: '1998', text: 'For its first 14 years the park had only temporary city park status on a short term lease. When a developer moved to build luxury apartments and a marina on the site, Mayor Rudolph Giuliani made it a permanent city park in 1998.', clue: 'Find the long dark wall at the far end of the gravel path.', source: { name: 'Socrates Sculpture Park, Wikipedia', url: 'https://en.wikipedia.org/wiki/Socrates_Sculpture_Park' } }, { r: 1.6 });
    k.prop('mobile', -10, 0, -20, { height: 12, keepOut: 1 }).then((o) => { if (o && !ctx.reduced) k.ticks.push((t) => { o.rotation.y = t * 0.06; }); });
    k.prop('bronze_figure', 10, 0, 10, { height: 7, keepOut: 2 });
    k.prop('noguchi_stone_3', -30, 0, 20, { height: 6, keepOut: 3 }); k.prop('noguchi_stone_1', -40, 0, -30, { height: 5, keepOut: 3 });
    k.prop('armillary', 20, 0, -30, { height: 6, keepOut: 2 });
    k.prop('equestrian', 0, 0, 40, { height: 6, rotY: PI / 2, keepOut: 3 });
    eyeMonument(k, -20, 0, 50, PI * 0.9, 8);
    blossomGarden(k, 30, 0, 44, 7, 3.2);
    for (const [x, z] of [[-60, 30], [-60, -10]]) { k.box(0.7, 0.3, 3.4, x, 0.2, z, k.flat([0xe84a2a, 0xf1c531][z > 0 ? 0 : 1], 0.1, 0.5)); k.keepOut.push({ x, z, r: 1.8 }); }
    for (let i = 0; i < 6; i++) { const rnd = X.mulberry(120 + i); k.tree(-20 + rnd() * 80, 0, -55 + rnd() * 110, { kind: 'round', h: 6 + rnd() * 4, r: 3 + rnd() * 2, leaf: 0x4a7a3c, seed: i }); }
    k.crowd([v(40, 0, 60), v(30, 0, 20), v(-10, 0, 0), v(-40, 0, -20), v(10, 0, -50), v(40, 0, -30)], 22, { seed: 153, speed: 0.4, spread: 3, animate: !ctx.reduced, closed: true });
    donorWall(k, 40, 2.4, -70 + 0.42, 0, 10, false); k.box(12, 4, 0.6, 40, 2, -70, dark);
    k.censusWall({ x: 40, y: 2.0, z: 69.58, rotY: PI, cols: 30, rows: 3, tile: 0.55, gap: 0.05, start: ctx.wallStart(6000, 90), pieces: ctx.all, backing: dark }); k.box(18, 4, 0.6, 40, 2, 70, dark);
    // the works: free standing steel frames across the lawn, each facing the path, plus the shed and the gate flanks
    const mounts: Mount[] = [];
    for (let i = 0; i < 12; i++) { const rnd = X.mulberry(160 + i); const x = -50 + (i % 4) * 26 + (rnd() - 0.5) * 6, z = -45 + Math.floor(i / 4) * 40 + (rnd() - 0.5) * 8; const rot = Math.atan2(40 - x, -z) + (rnd() - 0.5) * 0.6; const f = k.box(5, 3.4, 0.2, x, 2.2, z, steel); f.rotation.y = rot; for (const dx of [-2.3, 2.3]) k.box(0.2, 4.4, 0.2, x + Math.cos(rot) * dx, 2.2, z - Math.sin(rot) * dx, steel); k.keepOut.push({ x, z, r: 2.8 }); mounts.push({ position: v(x + Math.sin(rot) * 0.12, 2.3, z + Math.cos(rot) * 0.12), rotation: rot, target: v(x + Math.sin(rot) * 8, 2.3, z + Math.cos(rot) * 8), width: 4.4, height: 2.7, style: 'steel', wash: false }); }
    for (let i = 0; i < 3; i++) { const z = -44 + i * 4; mounts.push({ position: v(42.9, 2.6, z), rotation: -PI / 2 + PI, target: v(36, 2.4, z), width: 3.2, height: 2.0, style: 'steel', wash: false }); }
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = s * (10 + i * 10); k.box(0.2, 3.2, 4.6, 75.8, 2.0, z, steel); mounts.push({ position: v(75.68, 2.1, z), rotation: -PI / 2, target: v(57, 2, z), width: 4.2, height: 2.5, style: 'steel', wash: false }); }
    return { mounts, spawn: v(70, 3, 0), look: v(-20, 6, 0), eye: 3, bounds: [-70, 76, -68, 68], style: 'steel' };
  },
};

/* ---------------- 109 THE BROOKLYN MUSEUM ---------------- */
export const brooklynmuseum: RoomDef = {
  id: 'brooklynmuseum',
  name: 'The Beaux-Arts Court',
  area: 'THE BROOKLYN MUSEUM',
  mood: 'First Saturday',
  color: '#c8b8a0',
  description: 'The glass pavilion and the great stepped plaza with its fountain, then the third floor court: glass floor, columns on two levels, the skylight, the works around the balcony.',
  signatures: 'The McKim Mead and White facade with its six column Ionic portico, pediment and cornice figures, the 2004 glass entrance pavilion, the fanned plaza steps and the jet fountains, the Beaux-Arts Court with its translucent glass floor, arcaded gallery and skylight, the museum\'s Rodin bronzes.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad8, horizon: 0xeef0ec, ground: 0x6a6a66, fog: 0.0018, sun: { az: 3.0, el: 0.85, color: 0xfff6e8, size: 12 }, env: 1.0 });
    k.hemi(0xf2f6ff, 0x5a5a58, 0.95);
    k.sun(0xfff2dc, 2.4, 20, 90, 40, true, 120);
    const lime = k.pbr('bmLime', X.ashlar(0xd8d0bc, 342, 4), 0.25), glass = k.glass(0xdcecf6, 0x14 / 255 + 0.06, 0.04), steel = k.flat(0x8c98a4, 0.9, 0.3), dark = k.flat(0x1a1c20, 0.5, 0.6),
      floorG = k.flat(0xe8ecf0, 0.05, 0.3, { transparent: true, opacity: 0.85, emissive: 0xf0f4f8, emissiveIntensity: 0.25 }), plaster = k.pbr('bmPlaster', X.plaster(0xe8e2d4, 192), 0.3), waterM = k.flat(0x88aacc, 0.3, 0.2, { transparent: true, opacity: 0.6 }), bronze = k.flat(0x3a3028, 0.7, 0.45);
    street(k, { w: 30, len: 200, z: 60, x: 0 });
    blockFront(k, { x: 70, z0: 140, count: 10, face: -1, seed: 343, h: [12, 22] });
    k.box(120, 0.3, 40, 0, 0.05, 36, k.pbr('bmPlaza', X.pavers(0xb8b0a0, 193), 0.4));
    for (let i = 0; i < 8; i++) k.box(70 + i * 4, 0.3, 1.4, 0, 0.2 + i * 0.3, 30 - i * 1.4, lime);
    const jets: T.Mesh[] = []; for (let i = 0; i < 24; i++) { const x = -22 + i * 2; jets.push(k.mesh(new T.CylinderGeometry(0.06, 0.16, 3, 6), waterM, x, 1.6, 40, true)); }
    if (!ctx.reduced) k.ticks.push((t) => jets.forEach((j, i) => { j.scale.y = Math.max(0.05, Math.sin(t * 2 + i * 0.4)); }));
    const FZ = 16, FW = 100, FH = 24;
    k.box(FW, FH, 60, 0, FH / 2 + 2.4, FZ - 30, lime);
    // the central portico: six Ionic columns under a pediment (McKim, Mead and White, 1897)
    for (let i = 0; i < 6; i++) { const x = -20 + i * 8; k.column(x, 2.6, FZ + 1.4, 16.2, 1.1, lime, true); k.prop('ionic_capital', x, 18.8, FZ + 1.4, { height: 1.9 }); }
    k.box(FW, 2.6, 5, 0, 22, FZ + 1.4, lime);
    const ped = new T.Shape(); ped.moveTo(-27, 0); ped.lineTo(27, 0); ped.lineTo(0, 6.5); ped.closePath(); k.mesh(new T.ExtrudeGeometry(ped, { depth: 5, bevelEnabled: false }), lime, 0, 23.3, FZ - 1);
    for (let i = 0; i < 10; i++) { const x = -40 + i * 8.8; k.box(2.4, 5, 1.4, x, FH + 2.4 + 2.5, FZ - 30 + 30, lime); k.prop('bronze_figure', x, FH + 2.4 + 5, FZ, { height: 3 }); }
    k.box(40, 8, 14, 0, 4, FZ + 5, glass); for (let x = -20; x <= 20; x += 4) k.box(0.3, 8, 0.3, x, 4, FZ + 12, steel); k.box(42, 0.4, 16, 0, 8.2, FZ + 5, steel);
    k.box(6, 5, 0.2, 0, 2.5, FZ + 12, k.glass(0xdcecf6, 0.14, 0.04)); k.block(-50, -3, FZ + 11.6, FZ + 12.4); k.block(3, 50, FZ + 11.6, FZ + 12.4);
    k.sign('BROOKLYN MUSEUM', 16, 1.4, 0, 21.2, FZ + 4, 'transparent', '#3a3020', 110, 0);
    // Daniel Chester French's Brooklyn and Manhattan, moved here from the Manhattan Bridge approach in 1963
    for (const sx of [-1, 1]) { k.box(3.2, 2.4, 3.2, sx * 17, 1.2, 50, lime); k.keepOut.push({ x: sx * 17, z: 50, r: 2.4 }); k.prop('bronze_figure', sx * 17, 2.4, 50, { height: 3.4, rotY: 0 }); }
    k.egg(v(17, 4.2, 51.8), { id: 'brooklynmuseum-manhattan-bridge', title: 'Two statues from a bridge', year: '1963', text: 'The two big allegorical figures, Brooklyn and Manhattan, were designed by Daniel Chester French and made in 1916 for the Brooklyn approach of the Manhattan Bridge. They were moved to the museum in 1963. French also made the sculpture in the museum\'s pediment.', clue: 'Look at the two figures on their pedestals at the front of the plaza.', source: { name: 'Brooklyn Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn_Museum' } }, { r: 1.8 });
    k.egg(v(0, 27, FZ + 3), { id: 'brooklynmuseum-movie-set', title: 'A sixth of a museum', year: '1928', text: 'McKim, Mead and White planned a building many times this size; what stands is about one sixth of it, and the Daily News once compared it to a movie set because nothing was built behind the west wing. Of 80 cornice statues planned, construction stopped in 1928 with only 28 installed. Thirty figures survive today.', clue: 'Look up at the statues standing along the roofline.', source: { name: 'Brooklyn Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn_Museum' } }, { r: 2.0 });
    k.egg(v(-8, 4.4, FZ + 12.6), { id: 'brooklynmuseum-pavilion', title: 'Glass where the stairs were', year: '2004', text: 'James Polshek\'s glass entrance pavilion, with its four metal pylons and a semicircular plaza, was finished in April 2004 as part of a $63 million project that also air conditioned the whole building.', clue: 'Stand at the glass doors of the entrance pavilion.', source: { name: 'Brooklyn Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn_Museum' } }, { r: 1.6 });
    k.egg(v(-30, 2.6, 27), { id: 'brooklynmuseum-lost-staircase', title: 'The staircase they took away', year: '1935', text: 'The museum opened in 1897 with grand main steps on Eastern Parkway. NYC Parks approved removing the steps in May 1934 and a remodeled ground level entrance was dedicated on October 5, 1935; the National Register listing dates the removal to 1936 and 1937. The Eastern Parkway front is 510 feet wide.', clue: 'Climb the low steps at the edge of the plaza.', source: { name: 'Brooklyn Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn_Museum' } }, { r: 1.6 });
    mlowBanner(k, -22, 12, FZ + 4.2, 0, 3.6, true); blossomFlag(k, 22, 12, FZ + 4.2, 0, 3.0, 5, 'electric');
    // the lobby, the escalator ramp up, the court on the third floor with its glass floor and arcades
    k.box(38, 0.3, 24, 0, 0.15, FZ - 1, k.pbr('bmFloor', X.terrazzo(0xc8c0b0, 194), 0.4)); k.block(-19.4, -18.6, FZ - 13, FZ + 12); k.block(18.6, 19.4, FZ - 13, FZ + 12);
    for (let i = 0; i < 30; i++) k.box(4, 0.4, 1.0, 14, 0.2 + i * 0.4, FZ - 14 - i * 1.0, steel);
    k.block(11.8, 16.2, FZ - 44, FZ - 13.5);
    const CY = 12, CX = 0, CZ = FZ - 30, CW = 34, CD = 30;
    k.box(CW, 0.3, CD, CX, CY, CZ, floorG);
    k.box(CW + 8, 0.4, CD + 8, CX, CY - 0.3, CZ, plaster);
    for (const s of [-1, 1]) { k.box(0.6, 12, CD + 8, CX + s * (CW / 2 + 4), CY + 6, CZ, lime); k.block(CX + s * (CW / 2 + 4) - 0.6, CX + s * (CW / 2 + 4) + 0.6, CZ - CD / 2 - 4, CZ + CD / 2 + 4); }
    k.box(CW + 8, 12, 0.6, CX, CY + 6, CZ - CD / 2 - 4, lime); k.block(CX - CW / 2 - 4, CX + CW / 2 + 4, CZ - CD / 2 - 4.6, CZ - CD / 2 - 3.4);
    k.box(CW + 8, 12, 0.6, CX, CY + 6, CZ + CD / 2 + 4, lime); k.block(CX - CW / 2 - 4, 11.8, CZ + CD / 2 + 3.4, CZ + CD / 2 + 4.6); k.block(16.2, CX + CW / 2 + 4, CZ + CD / 2 + 3.4, CZ + CD / 2 + 4.6);
    for (const s of [-1, 1]) { k.arcade(CD, 5.6, 1.0, 5, 4.4, 4.6, CX + s * (CW / 2 + 0.5), CY, CZ, plaster, PI / 2, false); k.arcade(CD, 5.6, 1.0, 5, 4.4, 4.6, CX + s * (CW / 2 + 0.5), CY + 6, CZ, plaster, PI / 2, false); k.box(3.4, 0.4, CD + 8, CX + s * (CW / 2 + 2.2), CY + 6, CZ, plaster); k.box(3.4, 0.4, CD + 8, CX + s * (CW / 2 + 2.2), CY, CZ, plaster); }
    k.arcade(CW, 5.6, 1.0, 5, 5, 4.6, CX, CY, CZ - CD / 2 - 0.5, plaster, 0, false); k.arcade(CW, 5.6, 1.0, 5, 5, 4.6, CX, CY + 6, CZ - CD / 2 - 0.5, plaster, 0, false);
    k.box(CW + 8, 0.4, 3.4, CX, CY + 6, CZ - CD / 2 - 2.2, plaster); k.box(CW + 8, 0.4, 3.4, CX, CY, CZ - CD / 2 - 2.2, plaster);
    k.box(CW + 10, 0.4, CD + 10, CX, CY + 12, CZ, glass); for (let x = -CW / 2 - 4; x <= CW / 2 + 4; x += 3) k.box(0.2, 0.4, CD + 10, CX + x, CY + 12.1, CZ, steel);
    k.point(CX, CY + 9, CZ, 0xfff4e6, 100, 40); for (let i = 0; i < 4; i++) k.point(CX - 12 + i * 8, CY + 4, CZ, 0xfff4e6, 20, 14);
    for (const [x, z] of [[CX - 10, CZ - 8], [CX + 10, CZ + 8], [CX + 8, CZ - 10]]) k.prop('bronze_figure', x, CY + 0.15, z, { height: 2.8, keepOut: 1.2 });
    k.prop('vitrine', CX, CY + 0.15, CZ, { height: 1.7, keepOut: 1.2 });
    k.egg(v(CX, CY + 2.2, CZ), { id: 'brooklynmuseum-egypt', title: 'Nine Egyptians upstairs', text: 'The Egyptian collection spans more than 3,000 years and includes nine mummified Egyptians, the small figure known as the Bird Lady, and the Brooklyn Papyrus. The Wilbour Library of Egyptology came to the museum from the heirs of Charles Edwin Wilbour.', clue: 'Look into the glass case in the middle of the court.', source: { name: 'Brooklyn Museum, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn_Museum' } }, { r: 1.4 });
    k.egg(v(CX + 6, CY + 0.6, CZ - 4), { id: 'brooklynmuseum-glass-floor', title: 'A floor made of glass', year: '2008', text: 'The Beaux-Arts Court, two storeys high and colonnaded under a soaring skylight, has a central floor of about 10,000 square feet made of terrazzo and glass block. In 2008 the museum set out to replace the worn floor of the court with new terrazzo.', clue: 'Look down at the glowing floor of the court.', source: { name: 'The Newtown Bee, January 17, 2008', url: 'https://www.newtownbee.com/?p=88119' } }, { r: 1.6 });
    eyeMedallion(k, CX, CY + 0.16, CZ + 10, 2.2);
    donorWall(k, CX, CY + 3.6, CZ - CD / 2 - 3.58, 0, 10, false);
    wordmarkRelief(k, CX, CY + 9.4, CZ - CD / 2 - 3.56, 0, 6);
    k.crowd([v(0, 0, 50), v(0, 0, FZ + 16), v(-8, 0.15, FZ), v(8, 0.15, FZ - 8)], 24, { seed: 154, speed: 0.4, spread: 2.6, animate: !ctx.reduced, colors: [0x24262c, 0x8a3a3a, 0x33477f, 0xd8d0c0, 0x151517, 0xf08a2a] });
    k.crowd([v(CX - 12, CY + 0.15, CZ + 10), v(CX + 12, CY + 0.15, CZ - 10)], 10, { seed: 155, speed: 0.3, spread: 2, animate: !ctx.reduced });
    k.censusWall({ x: CX, y: CY + 3.6, z: CZ + CD / 2 + 3.58, rotY: PI, cols: 40, rows: 5, tile: 0.55, gap: 0.05, start: ctx.wallStart(1600, 200), pieces: ctx.all, backing: dark });
    // the works: the court's arcade bays on both levels, the end wall, the lobby
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = CZ - 9 + i * 6; mounts.push({ position: v(CX + s * (CW / 2 + 3.4), CY + 3.2, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(CX, CY + 2.6, z), width: 3.6, height: 2.4, style: 'gilt', wash: true }); mounts.push({ position: v(CX + s * (CW / 2 + 3.4), CY + 9.2, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(CX, CY + 8.6, z), width: 3.6, height: 2.4, style: 'gilt', wash: false }); }
    for (const x of [-10, 10]) mounts.push({ position: v(CX + x, CY + 3.4, CZ - CD / 2 - 3.58), rotation: 0, target: v(CX + x, CY + 2.6, CZ), width: 4.2, height: 2.6, style: 'gilt', wash: true });
    for (const x of [-12, 12]) mounts.push({ position: v(x, 3.4, FZ - 12.58), rotation: 0, target: v(x, 2.8, FZ), width: 4.4, height: 2.6, style: 'gilt', wash: true });
    k.box(38, 8, 0.6, 0, 4, FZ - 13, lime); k.block(-19, 11.4, FZ - 13.6, FZ - 12.4); k.block(16.6, 19, FZ - 13.6, FZ - 12.4);
    return { mounts, spawn: v(0, 3, 54), look: v(0, 14, FZ), eye: 3, bounds: [-CW / 2 - 3, CW / 2 + 3, CZ - CD / 2 - 3, 60], style: 'gilt', floorY: (x, z) => { if (x > 11.8 && x < 16.2 && z < FZ - 13.5 && z > FZ - 44) return Math.min(CY, ((FZ - 13.5 - z) / 30.5) * CY); if (z > FZ - 14 && z < FZ + 12 && Math.abs(x) < 19) return 0; if (Math.abs(x - CX) < CW / 2 + 3.4 && z > CZ - CD / 2 - 3.4 && z < CZ + CD / 2 + 3.4) return CY + 0.15; if (z > 20 && z < 31) return Math.max(0, 2.4 - ((z - 20) / 11) * 2.4) * 0; return 0; } };
  },
};

/* ---------------- 110 PIONEER WORKS ---------------- */
export const pioneerworks: RoomDef = {
  id: 'pioneerworks',
  name: 'The ironworks in Red Hook',
  area: 'PIONEER WORKS',
  mood: 'Second Sunday, the garden open',
  color: '#a88a6a',
  description: 'Pioneer Street near the water: the 1866 iron works building, three storeys of open floor around the great hall, the garden with its kiln and stage, the works hung on brick under the trusses.',
  signatures: 'The long brick ironworks with its arched windows, the triple height main hall with balconies on three sides, the timber trusses, the garden of raised beds and a stage, the Statue and the harbor at the end of the street.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad8, horizon: 0xf0e4cc, ground: 0x6a6a66, fog: 0.002, sun: { az: 4.4, el: 0.4, color: 0xffe6c0, size: 14 }, env: 0.95 });
    k.hemi(0xfff0e0, 0x5a4a38, 0.9);
    k.sun(0xffe0b8, 2.2, -60, 40, 30, true, 100);
    const brick = k.pbr('pwBrick', X.brick(0x7a4a3a, 344), 0.28), brickIn = k.pbr('pwBrickIn', X.brick(0x9a6a58, 345), 0.28), timber = k.pbr('pwTimber', X.planks(0x6a4a30, 4, 346, 0.2), 0.9),
      floorW = k.pbr('pwFloor', X.planks(0x8a6a48, 8, 347, 0.2), 0.9, { roughness: 0.6 }), glass = k.glass(0xdcecf6, 0.14, 0.04), dark = k.flat(0x1a1c20, 0.5, 0.6), steel = k.flat(0x8c98a4, 0.9, 0.3), lawn = k.pbr('pwLawn', X.grass(0x4a7a3a, 195), 0.06), soil = k.flat(0x3a2a1a, 0, 1);
    street(k, { w: 14, len: 140, z: 30, x: 0 });
    blockFront(k, { x: 20, z0: 90, count: 10, face: -1, seed: 348, h: [8, 12] });
    k.water({ y: -1.6, color: 0x30506a, w: 600, d: 400, x: -260, z: 0, amp: 1.2 });
    /* 2026-10-28: the lathed cone across the water is the stand in for Gravity Jack's Liberty (CC BY 4.0, b.ts), credit by the spawn */
    { const lm = k.objects.length; k.lathe([[0, 0], [4, 0], [3.6, 5], [3, 14], [2, 22], [0, 23]], -220, 4, 40, k.pbr('pwCopper', X.patina(0x5f9a8c), 0.6), 24); libertyFigure(k, standIn(k, lm), -220, 4, 40, 23, [2, 22]); }
    k.box(10, 10, 10, -220, -1, 40, k.pbr('pwGranite', X.ashlar(0xa89c88, 349, 3), 0.25));
    k.box(0.08, 0.9, 0.08, 8, 0.45, 16, dark); k.sign(LIBERTY_CREDIT, 3.4, 0.42, 8, 1.1, 16.05, '#1a1c20', '#e8e2d4', 46, 0);
    k.skyline({ z: -200, count: 30, spacing: 9, scale: 3.8, base: -1.6, seed: 350, lit: 0.25, glow: 0.5, tint: 0x6e7684, x: -80, rows: 1, spires: true });
    // the ironworks: a long brick hall three storeys tall, arched windows, the great hall inside with balconies
    const BX = -22, BZ = -10, BW = 30, BD = 46, BH = 16;
    k.box(BW, BH, BD, BX, BH / 2, BZ, brick);
    for (let f = 0; f < 3; f++) for (let i = 0; i < 9; i++) { const y = 3 + f * 5, z = BZ - 20 + i * 5; k.arch(2.2, 3.8, 0.4, BX + BW / 2 + 0.05, y - 1.9, z, brickIn, false, 0.7).rotation.y = PI / 2; k.box(0.06, 3.2, 1.6, BX + BW / 2 + 0.1, y, z, glass); }
    k.arch(3.6, 5, 2, BX + BW / 2, 0, BZ + 14, brickIn, false, 0.85).rotation.y = PI / 2; k.block(BX + BW / 2 - 0.6, BX + BW / 2 + 0.6, BZ - BD / 2, BZ + 12); k.block(BX + BW / 2 - 0.6, BX + BW / 2 + 0.6, BZ + 16, BZ + BD / 2);
    k.sign('PIONEER WORKS  ·  1866', 6, 0.6, BX + BW / 2 + 0.06, 6.2, BZ + 14, 'transparent', '#f0e4c8', 70, PI / 2);
    k.egg(v(BX + BW / 2 + 1.0, 6.2, BZ + 14), { id: 'pioneerworks-pioneer-street', title: 'The street named after the works', year: '1866', text: 'Alexander Bass was 39 when he founded Pioneer Iron Works here in 1866, after training as a railroad machinist and engineering sugar mills in Cuba. Its ads in Scientific American read: Machinery for Sugar Houses and Plantations a Specialty. The street was called Williams Street until it was renamed Pioneer Street after the factory.', clue: 'Read the name over the arched door.', source: { name: 'A Lily Pad on the Muck, Pioneer Works Broadcast', url: 'https://pioneerworks.org/broadcast/on-the-waterfront-joshua-jelly-schapiro' } }, { r: 1.6 });
    mlowBanner(k, BX + BW / 2 + 0.5, 10, BZ + 4, PI / 2, 3.0, true); blossomFlag(k, BX + BW / 2 + 0.5, 10, BZ - 8, PI / 2, 2.6, 7, 'ink');
    const IW = BW - 1.2, ID = BD - 1.2;
    k.box(IW, 0.3, ID, BX, 0.15, BZ, floorW);
    k.block(BX - IW / 2 - 0.6, BX - IW / 2 + 0.2, BZ - ID / 2, BZ + ID / 2); k.block(BX - IW / 2, BX + IW / 2, BZ - ID / 2 - 0.6, BZ - ID / 2 + 0.2); k.block(BX - IW / 2, BX + IW / 2, BZ + ID / 2 - 0.2, BZ + ID / 2 + 0.6);
    k.box(IW, 0.4, ID, BX, BH - 0.4, BZ, dark);
    for (let i = 0; i <= 8; i++) { const z = BZ - ID / 2 + i * (ID / 8); k.box(IW, 0.4, 0.3, BX, BH - 0.8, z, timber); for (let j = 1; j < 6; j++) k.beam(v(BX - IW / 2 + j * (IW / 6), BH - 0.8, z), v(BX - IW / 2 + j * (IW / 6) + (j % 2 ? 2 : -2), BH - 3.6, z), 0.1, timber, 4); k.box(IW, 0.3, 0.3, BX, BH - 3.6, z, timber); }
    for (const y of [5, 10]) { for (const s of [-1, 1]) { k.box(4, 0.3, ID, BX + s * (IW / 2 - 2), y, BZ, floorW); k.box(0.06, 1.0, ID, BX + s * (IW / 2 - 4), y + 0.6, BZ, steel); } k.box(IW, 0.3, 4, BX, y, BZ - ID / 2 + 2, floorW); k.box(IW, 0.06, 0.06, BX, y + 1.1, BZ - ID / 2 + 4, steel); for (let z = -ID / 2; z <= ID / 2; z += 3) for (const s of [-1, 1]) k.box(0.06, 1.0, 0.06, BX + s * (IW / 2 - 4), y + 0.6, BZ + z, steel); for (let z = -18; z <= 18; z += 9) k.point(BX, y + 3.6, BZ + z, 0xffe0c0, 18, 12); }
    for (let i = 0; i < 26; i++) k.box(2.4, 0.38, 0.9, BX + IW / 2 - 1.5, 0.19 + i * 0.38, BZ + ID / 2 - 1.5 - i * 0.9, floorW);
    k.block(BX + IW / 2 - 2.8, BX + IW / 2 - 0.3, BZ - ID / 2, BZ + ID / 2 - 1);
    k.box(16, 0.8, 8, BX - 2, 0.4, BZ - ID / 2 + 6, timber); k.block(BX - 10, BX + 6, BZ - ID / 2 + 2, BZ - ID / 2 + 10);
    // the big round window high in the back wall
    k.mesh(new T.TorusGeometry(1.6, 0.22, 8, 32), brickIn, BX, 10.6, BZ - ID / 2 + 0.4); k.mesh(new T.CircleGeometry(1.5, 32), k.glow(0xeaf2ff, 0.8), BX, 10.6, BZ - ID / 2 + 0.36);
    k.egg(v(BX - IW / 2 + 1.2, 1.6, BZ + 6), { id: 'pioneerworks-no-foundation', title: 'Brick walls on mud', text: 'When the building was renovated, the excavators found no solid foundation at all, only soft gravel, sludge and oily mud, yet the engineers found the walls within a thumb\'s width of level. The method, as a builder put it: compact the dirt, slap some tar on timber, and up you go with the first course of brick.', clue: 'Put your hand on the long brick wall of the main hall.', source: { name: 'A Lily Pad on the Muck, Pioneer Works Broadcast', url: 'https://pioneerworks.org/broadcast/on-the-waterfront-joshua-jelly-schapiro' } }, { r: 1.6 });
    k.egg(v(BX, BH - 3.0, BZ - 6), { id: 'pioneerworks-old-growth', title: 'Forty foot pine', text: 'The beams overhead are old growth pine, some about 40 feet long and 16 inches across. The three storey building has heavy brick walls, and a west facing wall of windows lights the Main Hall, with a big round window at the top of the back wall.', clue: 'Look up into the timber trusses under the roof.', source: { name: 'A Lily Pad on the Muck, Pioneer Works Broadcast', url: 'https://pioneerworks.org/broadcast/on-the-waterfront-joshua-jelly-schapiro' } }, { r: 1.8 });
    k.egg(v(BX + IW / 2 - 2, 11.6, BZ - ID / 2 + 2), { id: 'pioneerworks-charred-beam', title: 'Still black from the fire', year: '1881', text: 'On October 27, 1881 a fire, probably from a malfunctioning furnace, devastated the iron works, took nearly an hour to put out and did about $60,000 of damage. It was rebuilt with insurance money, burned again in 1906 and was rebuilt again. A giant beam in the third floor Science Studios is still charred from the 19th century fires.', clue: 'Climb to the top balcony and look along the beams at the back.', source: { name: 'A Lily Pad on the Muck, Pioneer Works Broadcast', url: 'https://pioneerworks.org/broadcast/on-the-waterfront-joshua-jelly-schapiro' } }, { r: 1.6 });
    k.egg(v(BX + 6, 1.2, BZ + 4), { id: 'pioneerworks-sandy', title: 'Five feet of water', year: '2012', text: 'Dustin Yellin bought the building for $3.7 million and opened it to the public in 2012, at first under the name Intercourse. Then Hurricane Sandy put five feet of floodwater into the ground floor, the rebuilding had to start again, and the space reopened in 2013 as Pioneer Works.', clue: 'Look at the bottom of the walls on the ground floor.', source: { name: 'Pioneer Works, Wikipedia', url: 'https://en.wikipedia.org/wiki/Pioneer_Works' } }, { r: 1.6 });
    k.egg(v(BX, BH + 1.2, BZ + 8), { id: 'pioneerworks-telescope', title: 'An observatory on the roof', year: '1895', text: 'An 1895 telescope, nearly 16 feet long with a 12.5 inch lens, from the building\'s own era, is meant for a public observatory on the reinforced roof. The founder\'s son, William L. Bass, published a trilogy of astronomy books in 1928 that tried to debunk Einstein\'s relativity.', clue: 'Look up at the roof of the ironworks from the street.', source: { name: 'A Lily Pad on the Muck, Pioneer Works Broadcast', url: 'https://pioneerworks.org/broadcast/on-the-waterfront-joshua-jelly-schapiro' } }, { r: 1.8 });
    eyeMedallion(k, BX, 0.16, BZ + 12, 2);
    donorWall(k, BX, 3.6, BZ - ID / 2 + 0.36, 0, 10, false);
    k.prop('noguchi_stone_2', BX - 6, 0.15, BZ, { height: 2.6, keepOut: 1.6 }); k.prop('bronze_figure', BX + 6, 0.15, BZ - 8, { height: 3, keepOut: 1.2 });
    // the garden: raised beds, the kiln, a small stage, the blossom garden, the crowd
    const GX = 8, GZ = -30;
    k.box(36, 0.4, 30, GX, -0.2, GZ, lawn);
    for (let i = 0; i < 6; i++) { const x = GX - 12 + (i % 3) * 10, z = GZ - 8 + Math.floor(i / 3) * 10; k.box(5, 0.6, 1.6, x, 0.3, z, timber); k.box(4.8, 0.2, 1.4, x, 0.65, z, soil); for (let j = 0; j < 8; j++) k.sphere(0.25, x - 2 + j * 0.55, 0.9, z + (j % 2 ? 0.3 : -0.3), k.flat([0x4a7a3a, 0x6a9a4a, 0xe83a3a][j % 3], 0, 0.9), 6); k.keepOut.push({ x, z, r: 2.8 }); }
    k.cyl(1.2, 2.4, GX + 14, 1.2, GZ - 10, brick, 1.0, 12); k.cyl(0.4, 3, GX + 14, 3.8, GZ - 10, brick, 0.4, 10);
    k.box(8, 0.6, 6, GX + 10, 0.3, GZ + 10, timber); k.block(GX + 6, GX + 14, GZ + 7, GZ + 13);
    blossomGarden(k, GX - 6, 0, GZ + 8, 4, 1.6);
    k.crowd([v(4, 0, 20), v(BX + 12, 0.15, BZ + 14), v(BX + 4, 0.15, BZ), v(BX - 6, 0.15, BZ - 12), v(GX, 0, GZ), v(GX + 8, 0, GZ + 8)], 22, { seed: 156, speed: 0.35, spread: 2.4, animate: !ctx.reduced, closed: true, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a, 0xf08a2a, 0x3a8ad8] });
    k.censusWall({ x: BX - IW / 2 + 0.36, y: 8, z: BZ, rotY: PI / 2, cols: 40, rows: 6, tile: 0.55, gap: 0.05, start: ctx.wallStart(4100, 240), pieces: ctx.all, backing: dark });
    // the works: hung on the brick between the arches on the ground floor, on the balcony backs, and on the end wall high
    const mounts: Mount[] = [];
    for (let i = 0; i < 5; i++) { const z = BZ - 18 + i * 8; mounts.push({ position: v(BX - IW / 2 + 0.38, 3.2, z), rotation: PI / 2, target: v(BX, 2.6, z), width: 4.6, height: 2.7, style: 'black', wash: true }); }
    for (let i = 0; i < 4; i++) { const z = BZ - 12 + i * 8; mounts.push({ position: v(BX + IW / 2 - 3.2, 3.2, z), rotation: -PI / 2, target: v(BX, 2.6, z), width: 4.2, height: 2.6, style: 'black', wash: true }); }
    for (const y of [5, 10]) for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = BZ - 12 + i * 12; mounts.push({ position: v(BX + s * (IW / 2 - 0.38), y + 2.4, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(BX, y + 2, z), width: 3.2, height: 2.0, style: 'black', wash: false }); }
    for (const x of [-8, 8]) mounts.push({ position: v(BX + x, 10, BZ - ID / 2 + 0.38), rotation: 0, target: v(BX + x, 6, BZ), width: 6, height: 3.6, style: 'none', wash: true });
    return { mounts, spawn: v(2, 3, 22), look: v(BX + BW / 2, 8, BZ + 4), eye: 3, bounds: [BX - IW / 2 + 0.8, 26, BZ - ID / 2 + 1, 40], style: 'black', floorY: (x, z) => { if (x > BX + IW / 2 - 2.8 && x < BX + IW / 2 - 0.3 && z < BZ + ID / 2 - 1 && z > BZ + ID / 2 - 26) { const t = (BZ + ID / 2 - 1 - z) / 25; return t <= 0.5 ? t * 20 : 5 + (t - 0.5) * 20 * 0 + Math.min(5, (t - 0.5) * 20); } if ((x < BX - IW / 2 + 4 || (x > BX + IW / 2 - 4 && x <= BX + IW / 2 - 2.8)) && z > BZ - ID / 2 && z < BZ + ID / 2 - 1) return 5.3; if (z > BZ - ID / 2 && z < BZ - ID / 2 + 4 && x > BX - IW / 2 && x < BX + IW / 2) return 5.3; return 0; } };
  },
};

/* ---------------- 111 THE BRONX MUSEUM ---------------- */
export const bronxmuseum: RoomDef = {
  id: 'bronxmuseum',
  name: 'The Concourse museum',
  area: 'THE BRONX MUSEUM OF THE ARTS',
  mood: 'Grand Concourse, Friday',
  color: '#c8a0b8',
  description: 'The Grand Concourse with its Art Deco apartment houses, the folded metal and glass front of the museum, the atrium and the galleries inside, the works of the borough on the walls.',
  signatures: 'The pleated aluminium and glass facade folding along the Concourse, the tall lobby with its stair, the flexible white galleries, the north wing courtyard, the Deco buildings across the boulevard with their casement corners.',
  build(k, ctx) {
    k.sky({ top: 0x6f9ad8, horizon: 0xf0e8dc, ground: 0x6a6a66, fog: 0.002, sun: { az: 3.5, el: 0.7, color: 0xfff6e8, size: 12 }, env: 0.95 });
    k.hemi(0xf6f6ff, 0x5a5048, 0.9);
    k.sun(0xfff2dc, 2.2, 30, 70, 40, true, 90);
    const alu = k.pbr('bxAlu', X.steel(0xc8ccd0, false, 351), 0.4, { metalness: 0.7, roughness: 0.4 }), glass = k.glass(0xdcecf6, 0.14, 0.04), white = k.pbr('bxWhite', X.plaster(0xf6f6f4, 196), 0.4, { roughness: 0.9 }),
      floorC = k.pbr('bxFloor', X.concrete(0xb8b4ac, 197), 0.3, { roughness: 0.6 }), dark = k.flat(0x1a1c20, 0.5, 0.6), steel = k.flat(0x8c98a4, 0.9, 0.3), brickD = k.pbr('bxDeco', X.brick(0xb89a78, 352), 0.28), cream = k.pbr('bxCream', X.plaster(0xe8dcc0, 198), 0.3);
    street(k, { w: 40, len: 200, z: 40, x: 0 });
    k.box(6, 0.4, 200, 0, 0.1, 40, k.pbr('bxMall', X.grass(0x3a5a2a, 199), 0.06)); for (let z = -40; z <= 120; z += 16) k.tree(0, 0.3, z, { kind: 'round', h: 6, r: 2.6, seed: z });
    k.egg(v(0, 2.2, 24), { id: 'bronxmuseum-champs-elysees', title: 'A Champs-Elysees for the Bronx', year: '1909', text: 'Louis Aloys Risse, an immigrant from Lorraine, conceived the Grand Concourse in 1890 and modeled it on the Champs-Elysees, only bigger: 180 feet wide for most of its length, originally three roadways split by tree lined dividers. It cost $14 million and opened to traffic in November 1909.', clue: 'Stand on the planted median in the middle of the boulevard.', source: { name: 'Grand Concourse (Bronx), Wikipedia', url: 'https://en.wikipedia.org/wiki/Grand_Concourse_(Bronx)' } }, { r: 1.6 });
    k.egg(v(27.6, 6, 70), { id: 'bronxmuseum-park-avenue', title: 'The Park Avenue of the middle class', text: 'By the mid 1930s almost 300 apartment buildings lined the Concourse, most of them five or six storeys. The 1939 WPA Guide called it the Park Avenue of middle class Bronx residents, and the stretch from 153rd to 167th Street became a city landmark district on October 25, 2011.', clue: 'Look across the boulevard at the apartment houses and their corner windows.', source: { name: 'Grand Concourse (Bronx), Wikipedia', url: 'https://en.wikipedia.org/wiki/Grand_Concourse_(Bronx)' } }, { r: 1.8 });
    for (let i = 0; i < 5; i++) { const z = 130 - i * 30; k.box(24, 22 + (i % 2) * 6, 26, 40, 11 + (i % 2) * 3, z, brickD); for (let f = 0; f < 6; f++) { k.box(2.4, 1.6, 2.4, 28.2, 3 + f * 3.4, z - 12.2, glass); k.box(0.3, 1.8, 3, 28.1, 3 + f * 3.4, z - 12, cream); } k.box(24.4, 0.6, 26.4, 40, 22.3 + (i % 2) * 6, z, cream); }
    // the museum: a pleated aluminium and glass front, the lobby atrium with a stair, two galleries
    const BX = -30, BZ = -6, BW = 34, BD = 34, BH = 14;
    k.box(BW, BH, BD, BX, BH / 2, BZ, white);
    for (let i = 0; i < 10; i++) { const z = BZ - 15 + i * 3.4; const p = k.box(0.3, BH, 3.6, BX + BW / 2 + 0.6 + (i % 2) * 0.8, BH / 2, z, i % 2 ? glass : alu); p.rotation.y = (i % 2 ? 1 : -1) * 0.4; }
    k.box(0.2, 5, 4, BX + BW / 2 + 0.2, 2.5, BZ + 14, glass); k.block(BX + BW / 2 - 0.6, BX + BW / 2 + 1.8, BZ - BD / 2, BZ + 12); k.block(BX + BW / 2 - 0.6, BX + BW / 2 + 1.8, BZ + 16, BZ + BD / 2);
    k.sign('THE BRONX MUSEUM OF THE ARTS', 10, 0.8, BX + BW / 2 + 1.5, 9, BZ, '#1a1c20', '#f4f0e8', 80, PI / 2, { border: true });
    k.egg(v(BX + BW / 2 + 2.6, 7.0, BZ - 10), { id: 'bronxmuseum-accordion', title: 'An accordion on the Concourse', year: '2006', text: 'The north wing by Arquitectonica opened in 2006 for $19 million and doubled the museum to 33,000 square feet. Its pleated aluminum facade is often compared to an accordion or a paper fan.', clue: 'Look along the folded metal and glass front.', source: { name: 'Bronx Museum of the Arts, Wikipedia', url: 'https://en.wikipedia.org/wiki/Bronx_Museum_of_the_Arts' } }, { r: 1.8 });
    k.egg(v(BX + BW / 2 + 2.2, 3.0, BZ - 16), { id: 'bronxmuseum-temporary-walls', title: 'Walls built to come down', text: 'The side walls of the 2006 north wing are temporary. They were designed to be removed if the site is later redeveloped with a residential high rise.', clue: 'Find the end of the folded front, where it meets the side wall.', source: { name: 'Bronx Museum of the Arts, Wikipedia', url: 'https://en.wikipedia.org/wiki/Bronx_Museum_of_the_Arts' } }, { r: 1.4 });
    k.egg(v(BX + BW / 2 + 2.2, 2.6, BZ + 14), { id: 'bronxmuseum-synagogue', title: 'The museum in a synagogue', year: '1961', text: 'The older half of the museum was built in 1961 for Young Israel of the Concourse, a congregation that began in a small synagogue on Walton Avenue and raised money for years to build here. The museum, which began life in the Bronx County Courthouse, moved in later.', clue: 'Stand at the glass entrance on the Concourse.', source: { name: '8 Architectural Gems Along the Grand Concourse, Untapped New York', url: 'https://untappedcities.com/2013/10/16/8-architectural-gems-along-the-bronx-grand-concourse-county-courthouse-post-office-loews-paradise-theater-poe-cottage/8/' } }, { r: 1.6 });
    mlowBanner(k, BX + BW / 2 + 1.9, 6, BZ + 8, PI / 2, 2.8, true); blossomFlag(k, BX + BW / 2 + 1.9, 6, BZ - 8, PI / 2, 2.4, 5, 'electric');
    const IW = BW - 1.2, ID = BD - 1.2;
    k.box(IW, 0.3, ID, BX, 0.15, BZ, floorC);
    k.block(BX - IW / 2 - 0.6, BX - IW / 2 + 0.2, BZ - ID / 2, BZ + ID / 2); k.block(BX - IW / 2, BX + IW / 2, BZ - ID / 2 - 0.6, BZ - ID / 2 + 0.2); k.block(BX - IW / 2, BX + IW / 2, BZ + ID / 2 - 0.2, BZ + ID / 2 + 0.6);
    k.box(IW, 0.4, ID, BX, BH - 0.4, BZ, dark);
    k.mesh(new T.PlaneGeometry(IW - 6, 10), k.glow(0xffffff, 0.9), BX, BH - 0.6, BZ + 6).rotation.x = PI / 2;
    for (let z = -12; z <= 12; z += 8) k.point(BX, BH - 3, BZ + z, 0xffffff, 26, 16);
    k.box(0.4, 8, ID - 12, BX - 4, 4, BZ - 4, white); k.block(BX - 4.4, BX - 3.6, BZ - ID / 2 + 6, BZ + 8);
    k.box(0.4, 8, 10, BX + 6, 4, BZ - 10, white); k.block(BX + 5.6, BX + 6.4, BZ - 15, BZ - 5);
    for (let i = 0; i < 20; i++) k.box(2.4, 0.36, 0.9, BX + IW / 2 - 1.5, 0.18 + i * 0.36, BZ + ID / 2 - 1.5 - i * 0.9, floorC);
    k.block(BX + IW / 2 - 2.8, BX + IW / 2 - 0.3, BZ - ID / 2, BZ + ID / 2 - 1);
    k.box(IW, 0.4, 8, BX, 7.4, BZ - ID / 2 + 4, floorC); k.box(0.1, 1.1, IW, BX, 8.1, BZ - ID / 2 + 8, glass);
    eyeMedallion(k, BX + 8, 0.16, BZ + 10, 2);
    donorWall(k, BX, 3.6, BZ - ID / 2 + 0.36, 0, 9, true);
    wordmarkRelief(k, BX, 6.4, BZ - ID / 2 + 0.38, 0, 5);
    k.prop('museum_bench', BX + 2, 0.15, BZ + 4, { height: 0.58, keepOut: 1.4 }); k.prop('vitrine', BX - 10, 0.15, BZ + 8, { height: 1.7, keepOut: 1.2 });
    k.egg(v(BX - 10, 2.2, BZ + 8), { id: 'bronxmuseum-courthouse', title: 'Born in a courthouse rotunda', year: '1971', text: 'The museum opened on May 11, 1971 in the first floor rotunda of the Bronx County Courthouse, at 161st Street on the Concourse, with 28 paintings lent from the Metropolitan Museum. Admission has been free every day since March 29, 2012, and the collection now holds more than 800 works.', clue: 'Look into the glass case in the lobby.', source: { name: 'Bronx Museum of the Arts, Wikipedia', url: 'https://en.wikipedia.org/wiki/Bronx_Museum_of_the_Arts' } }, { r: 1.4 });
    k.crowd([v(6, 0, 30), v(BX + 14, 0.15, BZ + 14), v(BX + 2, 0.15, BZ), v(BX - 10, 0.15, BZ - 10)], 14, { seed: 157, speed: 0.35, spread: 2, animate: !ctx.reduced, colors: [0x151517, 0x24262c, 0xe6e2da, 0x8a3a3a, 0xf08a2a] });
    k.crowd([v(-12, 0, 100), v(-12, 0, -20)], 20, { seed: 158, speed: 0.9, spread: 2.4, animate: !ctx.reduced });
    k.censusWall({ x: BX - IW / 2 + 0.36, y: 4.2, z: BZ + 6, rotY: PI / 2, cols: 30, rows: 5, tile: 0.5, gap: 0.05, start: ctx.wallStart(1200, 150), pieces: ctx.all, backing: dark });
    // the works: the two galleries' walls on both sides of the free walls, the mezzanine, the end wall
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = BZ - 10 + i * 5; mounts.push({ position: v(BX - 4 + s * 0.22, 3.0, z), rotation: s < 0 ? -PI / 2 : PI / 2, target: v(BX - 4 + s * 6, 2.6, z), width: 4.0, height: 2.4, style: 'white', wash: true }); }
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const z = BZ - 12 + i * 4.5; mounts.push({ position: v(BX + 6 + s * 0.22, 3.0, z), rotation: s < 0 ? -PI / 2 : PI / 2, target: v(BX + 6 + s * 5, 2.6, z), width: 3.6, height: 2.2, style: 'white', wash: true }); }
    for (const x of [-12, -2, 8]) mounts.push({ position: v(BX + x, 3.4, BZ + ID / 2 - 0.36), rotation: PI, target: v(BX + x, 2.6, BZ), width: 4.4, height: 2.6, style: 'white', wash: true });
    for (const x of [-10, 0, 10]) mounts.push({ position: v(BX + x, 10, BZ - ID / 2 + 0.36), rotation: 0, target: v(BX + x, 8.8, BZ - 4), width: 4.4, height: 2.6, style: 'white', wash: false });
    for (let i = 0; i < 3; i++) { const z = 100 - i * 40; k.box(0.3, 3.2, 4.6, 22, 2.2, z, dark); mounts.push({ position: v(21.82, 2.3, z), rotation: PI / 2, target: v(10, 2.5, z), width: 4.2, height: 2.5, style: 'black', wash: false }); }
    return { mounts, spawn: v(-7, 3, 14), look: v(BX + BW / 2, 7, BZ - 2), eye: 3, bounds: [BX - IW / 2 + 0.8, 24, BZ - ID / 2 + 1, 120], style: 'white', floorY: (x, z) => { if (x > BX + IW / 2 - 2.8 && x < BX + IW / 2 - 0.3 && z < BZ + ID / 2 - 1 && z > BZ + ID / 2 - 20) return Math.min(7.2, ((BZ + ID / 2 - 1 - z) / 19) * 7.2); if (x > BX + IW / 2 - 2.8 && x < BX + IW / 2 - 0.3 && z <= BZ + ID / 2 - 20) return 7.6; if (z > BZ - ID / 2 && z < BZ - ID / 2 + 8 && x > BX - IW / 2 && x < BX + IW / 2) return 7.6; return 0; } };
  },
};
