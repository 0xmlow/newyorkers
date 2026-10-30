// THE WRAPPED WING: the night the museum got M.Textured. Eight rooms of a great New York museum after closing, in
// walking order, from the paintings gallery the crew broke into to the conservation lab where the originals are kept.
// Each is 20 m along x and 16 m deep; the north side opens onto its plate. `film` is the gallery and the hour.
// lights: [x, y, z, colour, intensity, distance].
export const W = 20, D = 16, H_IN = 6;
export const PORTAL = { dist: 8, w: 12, h: 4.4 };

export const ROOMS = [
  { id: 'gallery', lvl: '823', music: 'heist', name: 'Gallery 823', film: 'European Paintings, 11:58 pm', kicker: 'The museum closed at nine. The wrap crew came in through the gift shop. You are holding the gun. Press F at anything.', plate: 'gallery', far: 40, tear: 2.2,
    floor: 'planks', floorTint: 0x8a7050, wall: 'plaster', ceil: 'plaster', wallTint: 0x7a2630, ceilTint: 0xe8e4dc, sound: 'lobby', fog: 0x0e0d0b, fogD: 0.009, sky: 0x080706, frame: 'gilt', post: { grain: 0.05, vig: 0.38 },
    hemi: [0xfff0d8, 0x1a1410, 0.4], env: 0.3,
    lights: [[5, 5.6, -2, 0xfff2d8, 22, 18], [15, 5.6, -2, 0xfff2d8, 22, 18], [10, 2.6, 4, 0xffb060, 10, 12]] },
  { id: 'dendur', lvl: '131', spawn: [10, 6.7], music: 'nile', name: 'The Temple', film: 'The Egyptian Wing, the pool, 12:20 am', kicker: 'A temple a country gave away, a pool that remembers, two sphinxes who do not. Look at the water.', plate: 'dendur', far: 50, tear: 2.0, plateTint: 0x9fb0c8,
    floor: 'marble', floorTint: 0xc8c0b0, wall: 'ashlar', ceil: 'plaster', wallTint: 0xb8a890, ceilTint: 0x9a9890, sound: 'walking', fog: 0x0a0c12, fogD: 0.007, sky: 0x06080c, frame: 'black', post: { bloom: 0.5, vig: 0.3 },
    hemi: [0xbfd0ff, 0x1a1810, 0.42], env: 0.4, noRope: true, edge: true,
    lights: [[10, 5.6, -3, 0xcfe0ff, 26, 20], [4, 3.6, 4, 0xffd090, 10, 12], [16, 3.6, 4, 0xffd090, 10, 12]] },
  { id: 'court', lvl: '162', music: 'marble', name: 'The Court', film: 'Greek and Roman, under the skylight, 12:45 am', kicker: 'Every god in here has been wrapped. There is one spot on the floor where it all lines up. Find the gold star.', plate: 'court', far: 46, tear: 2.0,
    floor: 'marble', floorTint: 0xd8d4cc, wall: 'ashlar', ceil: 'plaster', wallTint: 0xd0c8b8, ceilTint: 0xe8e4dc, sound: 'lobby', fog: 0x121210, fogD: 0.006, sky: 0x0c0c0a, frame: 'gilt', post: { bloom: 0.4 }, tall: 7,
    hemi: [0xfff8e8, 0x2a2820, 0.55], env: 0.45,
    lights: [[6, 6.4, -1, 0xfff8e8, 26, 20], [14, 6.4, -1, 0xfff8e8, 26, 20], [10, 3, 4, 0xffe0b0, 8, 12]] },
  { id: 'armor', lvl: '371', music: 'joust', name: 'Arms and Armor', film: 'The parade of knights, 1:10 am', kicker: 'Pick up the audio guide. It will tell you about every object in the hall. None of it is true.', plate: 'armor', far: 44, tear: 2.0,
    floor: 'planks', floorTint: 0x6a5038, wall: 'plaster', ceil: 'planks', wallTint: 0x8a2a2a, ceilTint: 0x5a4030, sound: 'walking', fog: 0x100a08, fogD: 0.01, sky: 0x0a0604, frame: 'oak', post: { grain: 0.05, vig: 0.4 },
    hemi: [0xffd8b0, 0x201008, 0.36], env: 0.3,
    lights: [[5, 5.4, -2, 0xffc890, 20, 18], [15, 5.4, -2, 0xffc890, 20, 18], [10, 3, 4, 0xffe0b0, 10, 12]] },
  { id: 'american', lvl: '700', music: 'parlor', name: 'The American Wing', film: 'A period room, the alarm, 1:40 am', kicker: 'Do not touch anything. Everything in here has been touched. The alarm has opinions.', plate: 'american', far: 38, tear: 2.2,
    floor: 'planks', floorTint: 0x9a7a58, wall: 'plaster', ceil: 'plaster', wallTint: 0x4a6a5a, ceilTint: 0xe0dcd0, sound: 'apartment', fog: 0x0e0e0c, fogD: 0.009, sky: 0x0a0a08, frame: 'gilt', post: { grain: 0.04, vig: 0.36 },
    hemi: [0xfff0d0, 0x2a2018, 0.42], env: 0.35,
    lights: [[5, 5.4, -2, 0xffe0b8, 18, 16], [15, 5.4, -2, 0xffe0b8, 18, 16], [10, 2.8, 4, 0xffd090, 10, 12]] },
  { id: 'shop', lvl: 'G', music: 'muzak', name: 'The Gift Shop', film: 'Exit through it, 2:05 am', kicker: 'Everything here is a wrapped version of something you cannot afford. The longer you look, the more it costs.', plate: 'shop', far: 36, tear: 2.2,
    floor: 'terrazzo', floorTint: 0xd0c8b8, wall: 'plaster', ceil: 'plaster', wallTint: 0xe8e4dc, ceilTint: 0xf0ece4, sound: 'lobby', fog: 0x161614, fogD: 0.006, sky: 0x0e0e0c, frame: 'black',
    hemi: [0xffffff, 0x2a2a28, 0.6], env: 0.45,
    lights: [[5, 4.1, -2, 0xffffff, 18, 16], [15, 4.1, -2, 0xffffff, 18, 16], [10, 3, 4, 0xfff0d0, 10, 12]] },   // the shop's ceiling is dropped to 4.4 m, the lights hang under it
  { id: 'roof', lvl: 'R', music: 'skyline', name: 'The Roof Garden', film: 'Over the park, the moon, 2:30 am', kicker: 'The roof garden closes at dusk. The moon does not. It is bigger near the skyline than overhead. Nobody knows why. Press Z.', plate: 'roof', far: 70, tear: 2.0,
    outdoor: true, floor: 'pavers', floorTint: 0x8a8a90, wall: 'ashlar', wallTint: 0x6a6660, sound: 'walking', fog: 0x0a0c16, fogD: 0.006, sky: 0x060810, frame: 'steel', post: { bloom: 0.6, vig: 0.3 },
    hemi: [0x8aa0ff, 0x101018, 0.4], env: 0.5, noRope: true, edge: true,
    lights: [[4, 3.4, -3, 0xffd8a0, 14, 14], [16, 3.4, -3, 0xffd8a0, 14, 14], [10, 2.4, 4, 0xc0d0ff, 8, 12]] },
  { id: 'lab', lvl: 'B', music: 'vault', name: 'The Conservation Lab', film: 'The vault under the museum, 3:00 am', kicker: 'The originals are kept down here, unwrapped, in the dark. The gun works backwards in this room. One of them was never original.', plate: 'lab', far: 36, tear: 2.0,
    floor: 'concrete', floorTint: 0x9a9a9a, wall: 'concrete', ceil: 'concrete', wallTint: 0xa8a8a8, ceilTint: 0x8a8a8a, sound: 'apartment', fog: 0x0c0e10, fogD: 0.01, sky: 0x08090c, frame: 'steel', post: { grain: 0.06, vig: 0.4, sat: 0.8 },
    hemi: [0xe0f0ff, 0x101418, 0.44], env: 0.35,
    lights: [[10, 5.6, -1, 0xf4f8ff, 26, 20], [4, 3.6, 4, 0xa0ffd0, 8, 12], [16, 3.6, 4, 0xa0ffd0, 8, 12]] },
];
