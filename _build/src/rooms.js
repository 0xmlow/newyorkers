// THE LIGHTINGS: the city switches itself on for December. Nine rooms in walking order, from Fifth Avenue across from the
// plaza, through the Channel Gardens, the rink and the tree, up seventy floors, up Fifth to 59th Street and the menorah,
// over the bridge to the other largest menorah, into a Brooklyn window, and out to Dyker Heights. Each is 20 m along x and
// 16 m deep; the north side opens onto its plate (Krea, GPT Image 2.6, rebuilt as geometry from a depth map). Facts and
// kickers checked by GPT 6 Astra on FLORA (work/runs.json). One shared night: the tree you light and the night of Chanukah
// you choose follow you through every room (window.LIGHTINGS in build.js).
// lights: [x, y, z, colour, intensity, distance].
export const W = 20, D = 16, H_IN = 6;
export const PORTAL = { dist: 8, w: 12, h: 4.4 };

export const ROOMS = [
  { id: 'fifth', hdri: 'nightcity', floorKind: 'snowy', lvl: '1', music: 'carol',  name: 'The Show Across the Street', film: 'Fifth Avenue at 50th Street, most Decembers since 2004', kicker: 'Your spot is marked. A seasonal first.', plate: 'fifth', far: 44, tear: 1.6, outdoor: true,
    floor: 'acg_asphalt033', floorRep: 4, floorTint: 0x50505a, wall: 'ashlar', wallTint: 0x8a8478, sound: 'walking', fog: 0x0d1621, fogD: 0.008, sky: 0x09131f, frame: 'gilt', post: { bloom: 1.0, vig: 0.3 },
    hemi: [0xa8b8d0, 0x2a2018, 0.60], env: 0.17, night: true, snow: 500,
    lights: [[5, 6, -2, 0xffd8a0, 26, 22], [15, 6, -2, 0xffd8a0, 26, 22], [10, 4, 4, 0xfff0e0, 12, 16]] },
  { id: 'channel', hdri: 'nightcity', floorKind: 'snowy', lvl: '2', music: 'choir', name: 'The Channel Gardens', film: 'Rockefeller Center, the herald angels since 1954', kicker: 'Eleven introductions. One musician.', plate: 'channel', far: 60, tear: 1.25, outdoor: true, noRope: true, edge: true, openNorth: true, noPlate: true, isolate: true, rp: { dz: -28, tree: true, eastLip: true, gardens: [2, 60], railers: 10, skaters: 6, lights: 16000 },
    floor: 'acg_pavingstones128', floorRep: 3.2, floorTint: 0x6e6a64, wall: 'ashlar', wallTint: 0x9a9284, sound: 'walking', fog: 0x0d1621, fogD: 0.007, sky: 0x09131f, frame: 'gilt', post: { bloom: 1.1, vig: 0.3 },
    hemi: [0xa8b8d0, 0x2a2018, 0.56], env: 0.17, night: true, snow: 400,
    lights: [[4, 5, -3, 0xfff0d0, 34, 18], [16, 5, -3, 0xfff0d0, 34, 18], [10, 5, 3, 0xffe0b0, 24, 18]] },
  { id: 'rink', hdri: 'nightcity', floorKind: 'none', lvl: '3', music: 'aqua', name: 'The Rink', film: 'The sunken rink, opened Christmas Day 1936', kicker: 'Finally, a paper trail worth keeping.', plate: 'rink', far: 50, tear: 1.6, outdoor: true, ice: true, noRope: true, edge: true, noFloor: true, openNorth: true, noPlate: true, isolate: true, noArch: true, noFacade: true, wallH: 4.6, rp: { dz: 8, dy: 4.6, tree: true, iceFrom: -16, rinkWalls: true, terrace: [0.6, 22], gardens: [2, 40], railers: 10, skaters: 3, skc: -27, ska: 6, lights: 20000 },
    floor: 'concrete', floorTint: 0x8a8a90, wall: 'ashlar', wallTint: 0x8a8478, sound: 'walking', fog: 0x0d1621, fogD: 0.006, sky: 0x09131f, frame: 'gilt', post: { bloom: 1.1, vig: 0.28 },
    hemi: [0xb0c0d4, 0x203040, 0.64], env: 0.21, night: true, snow: 300,
    lights: [[4, 6, -2, 0xffe8c0, 22, 20], [16, 6, -2, 0xffe8c0, 22, 20], [10, 7, -6, 0xffd070, 16, 20]] },
  { id: 'tree', hdri: 'nightcity', floorKind: 'snowy', lvl: '4', music: 'carol', name: 'The Lighting', film: '30 Rockefeller Plaza, workers 1931, lit officially since 1933', kicker: 'We held. It happened.', plate: 'tree', far: 70, tear: 1.6, outdoor: true, noRope: true, edge: true, openNorth: true, noPlate: true, isolate: true, rp: { dz: -8, eastLip: true, railers: 12, skaters: 9 },
    floor: 'acg_pavingstones128', floorRep: 3.8, floorTint: 0x6e6a64, wall: 'ashlar', wallTint: 0x8a8478, sound: 'walking', fog: 0x0d1621, fogD: 0.005, sky: 0x09131f, frame: 'gilt', post: { bloom: 1.0, vig: 0.32 },
    hemi: [0xa0b0c8, 0x201810, 0.48], env: 0.16, night: true, snow: 600, tall: 30,
    lights: [[3, 6, 0, 0xffe0b0, 18, 18], [17, 6, 0, 0xffe0b0, 18, 18], [10, 6, 5, 0xfff0e0, 10, 14]] },
  { id: 'top', hdri: 'nightcity', floorKind: 'deck', lvl: '5', music: 'spa', name: 'Seventy Floors Up', film: 'The observation deck, opened 1933, reopened 2005', kicker: 'Same tree. Different rent.', plate: 'top', far: 120, tear: 3.0, flat: 110, outdoor: true, low: true, noRope: true,
    floor: 'planks', floorTint: 0x5a5048, wall: 'concrete', wallTint: 0x6a6a70, sound: 'walking', fog: 0x0d1621, fogD: 0.003, sky: 0x09131f, frame: 'steel', post: { bloom: 1.0, vig: 0.3 },
    hemi: [0xa8b8d0, 0x1a1a24, 0.56], env: 0.17, night: true, snow: 200,
    lights: [[4, 4, 2, 0xffe8d0, 14, 14], [16, 4, 2, 0xffe8d0, 14, 14], [10, 3, 4, 0xfff0e0, 8, 10]] },
  { id: 'menorah', hdri: 'nightcity', floorKind: 'snowy', lvl: '6', music: 'hora', name: 'Fifth and Fifty Ninth', film: 'Grand Army Plaza, Manhattan, lit here since 1977', kicker: 'Finally, a lift that improves your evening.', plate: 'menorah', far: 60, tear: 1.6, outdoor: true, noRope: true, edge: true, holdLift: false,
    floor: 'acg_pavingstones128', floorRep: 3.6, floorTint: 0x6e6a64, wall: 'ashlar', wallTint: 0x9a9080, sound: 'walking', fog: 0x0d1621, fogD: 0.006, sky: 0x09131f, frame: 'gilt', post: { bloom: 1.15, vig: 0.3 },
    hemi: [0xa8b8d0, 0x221a12, 0.56], env: 0.17, night: true, snow: 400, tall: 14,
    lights: [[4, 6, -1, 0xffe0b0, 20, 18], [16, 6, -1, 0xffe0b0, 20, 18], [10, 4, 5, 0xfff0e0, 10, 14]] },
  { id: 'market', hdri: 'nightcity', floorKind: 'snowy', lvl: '7', music: 'carol', name: 'The Holiday Market', film: 'Union Square, the holiday market, every December', kicker: 'Everything is handmade. The line is also handmade.', plate: 'market', far: 60, tear: 1.6, outdoor: true, noRope: true, edge: true,
    floor: 'acg_pavingstones150', floorRep: 2.4, floorTint: 0x76727c, wall: 'brick', wallTint: 0x8a7468, sound: 'walking', fog: 0x0d1621, fogD: 0.006, sky: 0x09131f, frame: 'oak', post: { bloom: 1.05, vig: 0.3 },
    hemi: [0xa8b8d0, 0x221a12, 0.56], env: 0.17, night: true, snow: 450,
    lights: [[4, 5, -1, 0xffd8a0, 18, 16], [16, 5, -1, 0xffd8a0, 18, 16], [10, 4, 4, 0xfff0e0, 10, 14]] },
  { id: 'brooklyn', hdri: 'cobblenight', floorKind: 'snowy', lvl: '8', music: 'hora', name: 'The Other Largest', film: 'Grand Army Plaza, Brooklyn, since 1985', kicker: 'Two boroughs. One number. Several opinions.', plate: 'brooklyn', far: 60, tear: 1.6, outdoor: true, noRope: true, edge: true,
    floor: 'acg_pavingstones150', floorRep: 2.2, floorTint: 0x76727c, wall: 'brick', wallTint: 0x8a7468, sound: 'walking', fog: 0x0d1621, fogD: 0.006, sky: 0x09131f, frame: 'oak', post: { bloom: 1.1, vig: 0.3 },
    hemi: [0xa8b8d0, 0x221a12, 0.56], env: 0.17, night: true, snow: 400, tall: 14,
    lights: [[4, 6, -1, 0xffe0b0, 20, 18], [16, 6, -1, 0xffe0b0, 20, 18], [10, 4, 5, 0xfff0e0, 10, 14]] },
  { id: 'window', hdri: 'xmasstudio', ceilH: 3.4, floorKind: 'apartment', lvl: '9', music: 'parlour', name: 'The Answering Windows', film: 'A Brooklyn apartment, the street side, eight nights', kicker: 'Someone across the street noticed.', plate: 'window', noPlate: true, isolate: true, matte: true, far: 90, tear: 3.0, flat: 70, noRope: true, edge: true,
    floor: 'acg_woodfloor051', floorRep: 2.2, floorTint: 0xb89878, wall: 'plaster', ceil: 'plaster', wallTint: 0xe6dcc8, ceilTint: 0xd8d0c0, sound: 'apartment', fog: 0x0d1621, fogD: 0.004, sky: 0x09131f, frame: 'oak', post: { bloom: 0.9, vig: 0.4, grain: 0.04 },
    hemi: [0xffd8a8, 0x2a1a10, 0.36], env: 0.35,
    lights: [[4.8, 1.7, -5.0, 0xffb878, 7, 8], [14.2, 2.1, 1.6, 0xffc890, 5, 9], [10, 2.2, -5.5, 0xffb060, 6, 9]] },
  { id: 'dyker', hdri: 'cobblenight', floorKind: 'snowy', lvl: '10', music: 'bells', name: 'Dyker Heights', film: 'Dyker Heights, Brooklyn, the competition since 1986', kicker: 'The quiet house has entered the competition.', plate: 'dyker', far: 50, tear: 1.6, outdoor: true, noRope: true, edge: true,
    floor: 'acg_asphalt033', floorRep: 4, floorTint: 0x50505a, wall: 'brick', wallTint: 0x7a6a60, sound: 'walking', fog: 0x0d1621, fogD: 0.006, sky: 0x09131f, frame: 'black', post: { bloom: 1.3, vig: 0.3 },
    hemi: [0xa0b0c8, 0x201810, 0.48], env: 0.16, night: true, snow: 500,
    lights: [[4, 5, -1, 0xffd8a0, 20, 18], [16, 5, -1, 0xffd8a0, 20, 18], [10, 4, 5, 0xfff0e0, 10, 14]] },
];
