// N3W YORKERS SPACE PROGRAM: the only way out of a lease. Eight rooms from mission control in a Queens parking lot to
// splashdown off the Staten Island Ferry. Each is 20 m along x and 16 m deep; the north side opens onto its plate.
// `film` is the place and the hour on the mission clock. lights: [x, y, z, colour, intensity, distance].
export const W = 20, D = 16, H_IN = 6;
export const PORTAL = { dist: 8, w: 12, h: 4.4 };

export const ROOMS = [
  { id: 'control', lvl: 'T-10', music: 'control', name: 'Mission Control', film: 'Floyd Bennett Field, Brooklyn, T minus ten', kicker: 'The city has a space program now. It is funded by the fare hike. The countdown only runs while nobody is watching it.', plate: 'control', far: 40, tear: 2.2, plateTint: 0xb8c8e0,
    floor: 'concrete', floorTint: 0x8a8e98, wall: 'concrete', ceil: 'steel', wallTint: 0x7a8090, ceilTint: 0xa0a4ac, sound: 'lobby', fog: 0x080a12, fogD: 0.01, sky: 0x05060c, frame: 'steel', post: { grain: 0.04, vig: 0.36, ca: 0.004 },
    hemi: [0xc0d8ff, 0x101420, 0.46], env: 0.35, crowd: 'suits', spawn: [10, 4.4],
    lights: [[5, 5.6, -2, 0xd8e8ff, 22, 18], [15, 5.6, -2, 0xd8e8ff, 22, 18], [10, 2.6, 4, 0x40ff90, 8, 12]] },
  { id: 'pad', lvl: 'T-0', music: 'launch', name: 'The Launch Pad', film: 'Rockaway Beach, Queens, T minus zero', kicker: 'The rocket is on the beach because the beach was free. Walk up to it. Keep walking. The pad gets no closer and the lens gets wider.', plate: 'pad', far: 70, tear: 2.0,
    outdoor: true, floor: 'asphalt', floorTint: 0x6a6a6e, wall: 'concrete', wallTint: 0x8a8880, sound: 'walking', fog: 0x1a2030, fogD: 0.005, sky: 0x0c1020, frame: 'steel', post: { bloom: 0.6, vig: 0.3, heat: 0.3 },
    hemi: [0xffd8c0, 0x202830, 0.5], env: 0.5, noRope: true, edge: true, crowd: 'walkers',
    lights: [[4, 3.2, -3, 0xffb060, 14, 14], [16, 3.2, -3, 0xffb060, 14, 14], [10, 2.4, 4, 0xffffff, 10, 12]] },
  { id: 'capsule', lvl: 'LEO', music: 'orbit', name: 'The Capsule', film: 'Low Earth orbit, a retired R46 car, hour one', kicker: 'The capsule is a subway car because the subway car was free. Gravity is off. Stand clear of the closing airlock.', plate: 'capsule', far: 30, tear: 2.4, plateTint: 0xc8d0e0,
    floor: 'steel', floorTint: 0x8a8c92, wall: 'steel', ceil: 'steel', wallTint: 0xa0a4ac, ceilTint: 0x80848c, sound: 'apartment', fog: 0x06080e, fogD: 0.012, sky: 0x03040a, frame: 'steel', post: { bloom: 0.3, vig: 0.4, ca: 0.005 },
    hemi: [0xe0f0ff, 0x101418, 0.5], env: 0.4, holdLift: true, crowd: 'night', spawn: [10, 4.2],
    lights: [[5, 5.6, -2, 0xffffff, 20, 18], [15, 5.6, -2, 0xffffff, 20, 18], [10, 3, 4, 0x80c0ff, 8, 12]] },
  { id: 'moon', lvl: 'LUNA', music: 'moon', name: 'The Moon', film: 'The Sea of Tranquility, formerly the Sheep Meadow, day one', kicker: 'One sixth gravity. Jump. The lander is parked on the wrong side of the crater and the sweeper comes at 9.', plate: 'moon', far: 80, tear: 2.0,
    outdoor: true, floor: 'concrete', floorTint: 0x9a9a98, wall: 'concrete', wallTint: 0x6a6a68, sound: 'walking', fog: 0x101010, fogD: 0.004, sky: 0x020204, frame: 'steel', post: { sat: 0.25, vig: 0.4, grain: 0.05 },
    hemi: [0xffffff, 0x202020, 0.55], env: 0.5, noRope: true, edge: true, holdLift: true, noFloor: true, crowd: 'walkers',
    lights: [[10, 7, -4, 0xffffff, 30, 26], [4, 2.2, 5, 0xc0c0ff, 6, 10], [16, 2.2, 5, 0xc0c0ff, 6, 10]] },
  { id: 'mars', lvl: 'MARS', music: 'mars', name: 'Mars, the Bodega', film: 'Gale Crater, a corner, eight minutes behind', kicker: 'Everything you click answers three seconds late. Light delay. We trimmed it from eight minutes. The coffee is still a dollar.', plate: 'mars', far: 60, tear: 2.0,
    outdoor: true, floor: 'cobble', floorTint: 0xb86a40, wall: 'brick', wallTint: 0x8a4a30, sound: 'walking', fog: 0x2a1008, fogD: 0.007, sky: 0x1a0804, frame: 'oak', post: { heat: 0.5, vig: 0.3, grain: 0.05 },
    hemi: [0xffb080, 0x301008, 0.5], env: 0.4, noRope: true, edge: true, crowd: 'walkers',
    lights: [[5, 4.6, -2, 0xffa060, 20, 18], [15, 4.6, -2, 0xffa060, 20, 18], [10, 2.6, 4, 0xfff0d0, 10, 12]] },
  { id: 'hubble', lvl: 'HST', music: 'peep', name: 'The Hubble Room', film: 'A courtyard in the Village, every window, night', kicker: 'A two billion dollar telescope pointed at a courtyard. Press Z. One of the windows is doing something wrong.', plate: 'hubble', far: 36, tear: 2.2,
    outdoor: true, low: false, floor: 'planks', floorTint: 0x7a6048, wall: 'brick', wallTint: 0x7a5a48, sound: 'apartment', fog: 0x0a0c14, fogD: 0.009, sky: 0x06080e, frame: 'black', post: { grain: 0.05, vig: 0.4 },
    hemi: [0xb0c0ff, 0x181410, 0.4], env: 0.35, noRope: true, edge: true, crowd: 'night',
    lights: [[4, 3.4, -2, 0xffd8a0, 12, 14], [16, 3.4, -2, 0xffd8a0, 12, 14], [10, 2.6, 4, 0xa0b0ff, 8, 12]] },
  { id: 'belt', lvl: 'DSN', music: 'belt', name: 'The Asteroid Belt', film: "Flushing Meadows, the World's Fair, far side", kicker: 'Two dishes talk across the fairground. Whisper into one. Catch what comes out of the sky before it catches you.', plate: 'belt', far: 70, tear: 2.0,
    outdoor: true, floor: 'pavers', floorTint: 0x8a8a90, wall: 'concrete', wallTint: 0x6a6a70, sound: 'walking', fog: 0x08080c, fogD: 0.005, sky: 0x030306, frame: 'steel', post: { bloom: 0.5, vig: 0.3 },
    hemi: [0xa0b0ff, 0x101018, 0.42], env: 0.5, noRope: true, edge: true, crowd: 'walkers',
    lights: [[4, 3.4, -4, 0xc0d0ff, 14, 16], [16, 3.4, -4, 0xc0d0ff, 14, 16], [10, 2.4, 4, 0xffd090, 8, 12]] },
  { id: 'splash', lvl: 'HOME', music: 'parade', name: 'Splashdown', film: 'Off the Staten Island Ferry, the harbor, home', kicker: 'The capsule came down next to the ferry. The ferry did not stop. Keep pace with the parade and the city throws the paper.', plate: 'splash', far: 70, tear: 2.0,
    outdoor: true, floor: 'boardwalk', floorTint: 0x9a7a58, wall: 'steel', wallTint: 0xd06a30, sound: 'walking', fog: 0x203040, fogD: 0.004, sky: 0x1a2a40, frame: 'steel', post: { bloom: 0.3, vig: 0.25 },
    hemi: [0xffe8d0, 0x203040, 0.6], env: 0.6, noRope: true, edge: true, noFloor: true, crowd: 'dressy', spawn: [10, 4.6],
    lights: [[4, 3.4, -3, 0xffffff, 12, 14], [16, 3.4, -3, 0xffffff, 12, 14], [10, 2.4, 4, 0xffd090, 8, 12]] },
];
