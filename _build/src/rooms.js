// SAME DIFFERENCE, room by room: a museum of New Yorkers who sound the same. Every room is one way of making a
// diptych move: where you stand, what you do, the light, the clock, a sound, a train.
// Each room is 20 m along x and 16 m deep; its north side opens onto a photograph of the real place, turned into depth
// (plate), the ON LOCATION and ON RECORD way. The trick lives on the south and side walls so the plate stays clear.
// `closed` fills the north opening for the one room that is its own place (the inside of the 6 train).
// lights: [x, y, z, colour, intensity, distance] in room coordinates (x from the room's west wall).
// `film` keeps its name from ON LOCATION (main.js reads it): here it is the frame the room is built on.
export const W = 20, D = 16, H_IN = 6;
export const PORTAL = { dist: 8, w: 12, h: 4.4 };

const ROOM = { noRope: true, noBoxes: true };
export const ROOMS = [
  { ...ROOM, id: 'platform', plate: 'platform', far: 60, tear: 2.4, music: 'el', name: 'Coming // Going', film: 'Lenticular, a subway platform', kicker: 'Walk past a picture one way, then the other. Stand dead centre and you get both.', h: 4.6,
    floor: 'concrete', floorTint: 0x8a8a84, wall: 'plaster', ceil: 'concrete', wallTint: 0xd8d4c8, sound: 'el', fog: 0x0c0c10, fogD: 0.01, sky: 0x06060a, frame: 'black',
    hemi: [0xf0f4ff, 0x302820, 0.5], env: 0.35,
    lights: [[5, 4.2, -3, 0xf4f8ff, 16, 14], [15, 4.2, -3, 0xf4f8ff, 16, 14], [10, 4.2, 4, 0xfff0d8, 14, 14]] },
  { ...ROOM, id: 'departures', plate: 'departures', far: 70, tear: 2.4, music: 'swing', name: 'Departures', film: 'Split flap, the main concourse', kicker: 'Every board flips on its own clock. Click one to flip it now. On the New York hour, they all go.', h: 7,
    floor: 'marble', floorTint: 0xd8cdb4, wall: 'plaster', ceil: 'plaster', wallTint: 0xc8b48a, sound: 'court', fog: 0x14100a, fogD: 0.006, sky: 0x0a0806, frame: 'gilt',
    hemi: [0xffe8c0, 0x2a2014, 0.5], env: 0.45,
    lights: [[5, 6.2, -2, 0xffd8a0, 18, 18], [15, 6.2, -2, 0xffd8a0, 18, 18], [10, 6.2, 4, 0xffe0b0, 16, 16]] },
  { ...ROOM, id: 'deli', plate: 'deli', far: 26, tear: 2.4, music: 'shop', name: 'Open // Closed', film: 'Two sided signs, a deli on the corner', kicker: 'Every sign hangs on a string with a word on each side. Walk by fast and they spin.', h: 4.8,
    floor: 'tile', floorTint: 0xf0ece0, wall: 'plaster', ceil: 'plaster', wallTint: 0xe8e0c8, sound: 'tenement', fog: 0x100c08, fogD: 0.01, sky: 0x080604, frame: 'steel',
    hemi: [0xfff4e0, 0x302418, 0.55], env: 0.4,
    lights: [[6, 3.7, 0, 0xfff8e8, 14, 12], [14, 3.7, 0, 0xfff8e8, 14, 12], [10, 3.2, -6, 0xffd090, 8, 10]] },
  { ...ROOM, id: 'interrogation', plate: 'interrogation', far: 26, tear: 2.4, fixZ: [-4.6, 1.0, 5.0], music: 'dread', name: 'The Two Way Mirror', film: 'Light, a precinct interview room', kicker: 'Your side lit: the glass is a mirror. Their side lit: you see who is really in there. The switch is by the door.', h: 3.6,
    floor: 'linoleum', floorTint: 0x8a9488, wall: 'plaster', ceil: 'plaster', wallTint: 0x6a7468, sound: 'hall', fog: 0x080a08, fogD: 0.016, sky: 0x040504, frame: 'steel', post: { grain: 0.1 },
    hemi: [0xe0f0e0, 0x1a201a, 0.42], env: 0.3,
    lights: [[10, 3.3, 4, 0xf0fff0, 18, 12], [4, 3.3, 5, 0xf0fff0, 10, 9], [16, 3.3, 5, 0xf0fff0, 10, 9]] },
  { ...ROOM, id: 'whisper', plate: 'whisper', far: 40, tear: 2.4, music: 'trio', name: 'The Whispering Gallery', film: 'Sound, under the vaults by the Oyster Bar', kicker: 'Whisper into a corner. Your word arrives in the opposite corner, said like a New Yorker.', h: 8, noCeil: true,
    floor: 'terrazzo', floorTint: 0xc8b090, wall: 'plaster', wallTint: 0xc8a878, sound: 'court', fog: 0x120c06, fogD: 0.008, sky: 0x0a0604, frame: 'gilt',
    hemi: [0xffd8a0, 0x201408, 0.45], env: 0.4,
    lights: [[5, 5.5, 0, 0xffc880, 16, 14], [15, 5.5, 0, 0xffc880, 16, 14], [10, 2.6, 6.6, 0xffe0b0, 8, 10]] },
  { ...ROOM, id: 'henge', plate: 'henge', far: 120, tear: 2.2, music: 'tarbeach', name: 'Manhattanhenge', film: 'New York time, 42nd Street at sundown', kicker: 'The sun sets down the middle of the street. Its shadow turns one word into the other.', outdoor: true,
    floor: 'asphalt', floorTint: 0x5a5c66, wall: 'brick', sound: 'el', fog: 0x2a1408, fogD: 0.008, sky: 0x1a0c06, frame: 'black', post: { grain: 0.06 },
    hemi: [0xffb070, 0x1a1020, 0.4], env: 0.35,
    lights: [[18, 3, 0, 0xff9040, 22, 30], [4, 5, -4, 0xffd0a0, 6, 14], [4, 5, 4, 0xffd0a0, 6, 14]] },
  { ...ROOM, id: 'subway', noPlate: true, closed: true, music: 'break', name: 'The Tunnel Blink', film: 'Light and a train, the 6 between stations', kicker: 'When the lights go out in the tunnel, every picture in the car becomes the other word.', h: 3.4,
    floor: 'terrazzo', floorTint: 0x7a7a80, wall: 'concrete', ceil: 'concrete', wallTint: 0x1a1a20, sound: 'el', fog: 0x060608, fogD: 0.02, sky: 0x020203, frame: 'steel',
    hemi: [0xe8f0ff, 0x101014, 0.3], env: 0.3,
    lights: [[5, 2.2, 3.8, 0xf0f6ff, 9, 8], [10, 2.2, 3.8, 0xf0f6ff, 9, 8], [15, 2.2, 3.8, 0xf0f6ff, 9, 8]] },
  { ...ROOM, id: 'doors', plate: 'doors', far: 26, tear: 2.4, music: 'break', name: 'Stand Clear of the Closing Doors', film: 'Physics, a mezzanine of subway doors', kicker: 'Ding dong: the doors close and the two New Yorkers meet as one picture. Click one as it closes and somebody holds it.', h: 4.8,
    floor: 'terrazzo', floorTint: 0x8a8a90, wall: 'plaster', ceil: 'concrete', wallTint: 0xd8d4c8, sound: 'el', fog: 0x0a0a0c, fogD: 0.01, sky: 0x050506, frame: 'steel',
    hemi: [0xf0f4ff, 0x282420, 0.5], env: 0.35,
    lights: [[5, 3.9, -3, 0xf4f8ff, 14, 14], [15, 3.9, -3, 0xf4f8ff, 14, 14], [10, 3.9, 4, 0xf4f8ff, 14, 14]] },
  { ...ROOM, id: 'shop', plate: 'shop', far: 60, tear: 2.4, music: 'parlour', name: 'The Gift Shop', film: 'One // Won, the posters and a scratch off', kicker: 'Scratch the ticket on the counter. Every poster on the wall is a pair.', h: 5.2,
    floor: 'planks', floorTint: 0x8a6440, wall: 'plaster', ceil: 'plaster', wallTint: 0x24242a, sound: 'office', fog: 0x0a0a0c, fogD: 0.008, sky: 0x050506, frame: 'black',
    hemi: [0xfff0d8, 0x1a1410, 0.45], env: 0.4,
    lights: [[5, 4.0, 0, 0xfff0d8, 14, 14], [15, 4.0, 0, 0xfff0d8, 14, 14], [10, 4.0, 5, 0xffe0c0, 10, 12]] },
];
