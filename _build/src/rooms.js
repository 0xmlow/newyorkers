// The night, in order. Each room is 20 m along x and 16 m deep; the north side opens onto its plate.
// lights: [x, y, z, colour, intensity, distance] in room coordinates (x from the room's west wall).
export const W = 20, D = 16, H_IN = 6;
export const PORTAL = { dist: 8, w: 12, h: 4.4 };   // the plate camera stands 8 m back from a 12 m opening

export const ROOMS = [
  { id: 'street', mural: true, name: 'The Avenue, 3 a.m.', kicker: 'Left off the count, pasted up anyway', plate: 'street', far: 70, tear: 2, count: 24,
    floor: 'asphalt', wall: 'brick', outdoor: true, sound: 'street', fog: 0x0b0d14, fogD: 0.012, sky: 0x070912,
    hemi: [0x5d6f9a, 0x2a1d10, 0.14], env: 0.2,
    lights: [[4, 5, -4, 0xffa040, 26, 22], [16, 5, 2, 0x8fb4ff, 14, 20], [10, 4, 6, 0xffc58a, 10, 18]] },
  { id: 'deli', mural: true, name: 'The Uncounted Deli', kicker: 'Take a number. Nobody picks.', plate: 'deli', far: 26, tear: 2.6, count: 24,
    floor: 'terrazzo', wall: 'plaster', ceil: 'plaster', sound: 'deli', fog: 0x10120c, fogD: 0.01, sky: 0x0a0b08,
    hemi: [0xd8f0d0, 0x40382a, 0.22], env: 0.23,
    lights: [[6, 5.6, -2, 0xd8ffe4, 22, 18], [14, 5.6, 2, 0xfff1d0, 18, 18], [10, 5.6, 6, 0xd8ffe4, 12, 16]] },
  { id: 'subway', mural: true, name: 'Uncounted St Station', kicker: 'Stand clear of the closing doors', plate: 'subway', far: 80, count: 26, tear: 3.2,
    floor: 'concrete', wall: 'tile', ceil: 'steel', sound: 'subway', fog: 0x0a0c0c, fogD: 0.014, sky: 0x050606,
    hemi: [0xe0f0ff, 0x1a1a14, 0.2], env: 0.18,
    lights: [[5, 5.4, -3, 0xe8f4ff, 22, 18], [15, 5.4, 1, 0xe8f4ff, 20, 18], [10, 5.4, 6, 0xfff0d0, 10, 16]] },
  { id: 'archive', mural: true, name: 'Department of the Uncounted', kicker: 'Census records, not counted', plate: 'archive', far: 60, tear: 2, count: 26,
    floor: 'marble', wall: 'plaster', ceil: 'plaster', wallTint: 0xb8b090, sound: 'archive', fog: 0x1a140a, fogD: 0.012, sky: 0x120e08,
    hemi: [0xffe2b0, 0x302010, 0.2], env: 0.2,
    lights: [[5, 5, -2, 0xffcf8a, 24, 18], [15, 5, 2, 0xffcf8a, 20, 18], [10, 3, 5, 0x9cff9c, 4, 8]] },
  { id: 'alley', mural: true, name: 'Off Canal, 2 a.m.', kicker: 'Three cards. Nobody picks. Not even MLow.', plate: 'alley', far: 50, tear: 2, count: 24,
    floor: 'cobble', wall: 'brick', outdoor: true, sound: 'alley', fog: 0x140a0e, fogD: 0.014, sky: 0x08060a,
    hemi: [0xff6a7a, 0x0a2a2a, 0.18], env: 0.23,
    lights: [[4, 4, -3, 0xff3048, 26, 16], [16, 4, -1, 0x30e0d0, 20, 16], [10, 4, 5, 0xffb070, 10, 16]] },
  { id: 'theater', mural: true, name: 'The Uncounted Theatre', kicker: 'Nine era closers, one night only', plate: 'theater', far: 40, closers: true,
    floor: 'planks', wall: 'velvet', ceil: 'plaster', sound: 'theater', fog: 0x140806, fogD: 0.008, sky: 0x0a0402,
    hemi: [0xffc080, 0x300808, 0.16], env: 0.23,
    lights: [[10, 5.5, 5, 0xfff0d8, 30, 20], [3, 4, 0, 0xff8040, 10, 14], [17, 4, 0, 0xff8040, 10, 14]] },
  { id: 'roof', mural: true, name: 'The Roof', kicker: 'Break the seal. Last call.', plate: 'roof', far: 160, count: 26, tear: 1.8,
    floor: 'concrete', wall: 'brick', outdoor: true, low: true, sound: 'roof', fog: 0x0a1020, fogD: 0.006, sky: 0x0a1020,
    hemi: [0x7f9cd8, 0x20160c, 0.22], env: 0.27,
    lights: [[10, 4, 4, 0xffd9a0, 18, 20], [3, 3, -4, 0xffd9a0, 8, 12], [17, 3, -4, 0xffd9a0, 8, 12]] },
];
