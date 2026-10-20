// THE EVICTION, room by room: one building in Williamsburg under the J, and the year it was emptied.
// Each room is 20 m along x and 16 m deep; the north side opens onto its plate.
// lights: [x, y, z, colour, intensity, distance] in room coordinates (x from the room's west wall).
// h: the ceiling height of an indoor room (the engine default is H_IN). Tenements are low.
// `film` keeps its name from ON LOCATION (main.js reads it): here it is the address or the painting.
export const W = 20, D = 16, H_IN = 6;
export const PORTAL = { dist: 8, w: 12, h: 4.4 };   // the plate camera stands 8 m back from a 12 m opening

export const ROOMS = [
  { id: 'street', music: 'el', name: 'Broadway under the J', film: 'Marcy Avenue, Williamsburg, Brooklyn', kicker: 'Wait for the train. Everything that leaves 4F ends up on this curb.', plate: 'street', video: 'street', far: 60, tear: 2.2,
    floor: 'asphalt', floorTint: 0x6a6c76, wall: 'brick', outdoor: true, sound: 'el', fog: 0x0a0c14, fogD: 0.012, sky: 0x05070d, frame: 'black', post: { grain: 0.08 },
    hemi: [0x8aa0d8, 0x2a1a10, 0.36], env: 0.35,
    lights: [[10, 6.6, -2, 0xffa040, 26, 22], [17, 3.4, 1, 0xff4fa3, 10, 12], [3, 3.4, 2, 0x22d3ee, 8, 12]] },
  { id: 'vestibule', music: 'stair', name: 'The Vestibule', film: 'A walk up, 1911, five floors, no lift', kicker: 'Twenty mailboxes. Look through the peephole of 1A.', plate: 'vestibule', far: 26, tear: 2.4, h: 4.2,
    floor: 'tile', floorTint: 0xe8e2d4, wall: 'plaster', ceil: 'plaster', wallTint: 0x9a9480, sound: 'tenement', fog: 0x0e0a08, fogD: 0.014, sky: 0x060403, frame: 'oak',
    hemi: [0xffe0b0, 0x201810, 0.24], env: 0.25,
    lights: [[10, 3.6, 1, 0xffc070, 16, 14], [4, 3.4, 4, 0xffb060, 6, 10], [16, 3.4, -4, 0xffd090, 7, 12]] },
  { id: 'hallway', music: 'dread', name: 'The Fourth Floor', film: 'The Eviction, New Yorker No. 47', kicker: 'There is somebody at the end of the hall. He only moves when you are not looking.', plate: 'hallway', far: 30, tear: 2.4, h: 3.0, noRope: true, edge: true,
    floor: 'concrete', floorTint: 0x3a4460, wall: 'plaster', ceil: 'concrete', wallTint: 0x2a3050, sound: 'hall', fog: 0x060a18, fogD: 0.02, sky: 0x03050c, frame: 'black', post: { grain: 0.12 },
    hemi: [0x9fb8ff, 0x10081a, 0.22], env: 0.25,
    lights: [[10, 2.85, -3, 0xe8f4ff, 16, 14], [10, 2.85, 4, 0xe8f4ff, 12, 12], [13.6, 2.2, -3, 0x3b82f6, 8, 9]] },
  { id: 'apartment', music: 'musicbox', name: '4F', film: 'A railroad apartment, October 2026 to October 2027', kicker: 'Stand on the mark and look in. Tear a page off the calendar and something leaves.', plate: 'window', noPlate: true, wallFrom: 'hallway', far: 70, tear: 2.4, noRope: true, h: 4.2,
    floor: 'planks', floorTint: 0x6a4a30, wall: 'plaster', ceil: 'plaster', wallTint: 0x6a6050, sound: 'flat', fog: 0x0a0806, fogD: 0.008, sky: 0x05060a, frame: 'oak',
    hemi: [0xffd8a8, 0x1a1008, 0.3], env: 0.3,
    lights: [[10, 3.0, -0.6, 0xffc888, 10, 9], [10, 2.4, -6.2, 0x6a90ff, 8, 9], [10, 3.8, 5.0, 0xffd090, 10, 12]] },
  { id: 'landlord', music: 'villain', name: 'The Management Office', film: 'The Landlord, New Yorker No. 39', kicker: 'Walk up to the desk. He gets bigger the closer you come.', plate: 'landlord', far: 24, tear: 2.4,
    floor: 'planks', floorTint: 0x3a2618, wall: 'plaster', ceil: 'plaster', wallTint: 0x4a3020, sound: 'office', fog: 0x0e0806, fogD: 0.016, sky: 0x060302, frame: 'gilt', post: { grain: 0.1 },
    hemi: [0xffd8a0, 0x180c06, 0.22], env: 0.25,
    lights: [[10, 2.6, -4.6, 0x9aff9a, 9, 9], [5, 5, 2, 0xffb070, 10, 14], [15, 5, 2, 0xff8050, 8, 14]] },
  { id: 'court', music: 'docket', name: 'Housing Court, 141 Livingston Street', film: 'Brooklyn, every weekday at nine thirty', kicker: 'The window gets no closer until you take a number.', plate: 'court', far: 40, tear: 2.4, h: 4.6,
    floor: 'linoleum', floorTint: 0xb8b8a8, wall: 'plaster', ceil: 'plaster', wallTint: 0xb0b89a, sound: 'court', fog: 0x1a1c18, fogD: 0.008, sky: 0x0e100c, frame: 'steel',
    hemi: [0xf0fff0, 0x303428, 0.55], env: 0.4,
    lights: [[6, 4.2, -1, 0xf4fff0, 16, 16], [14, 4.2, -1, 0xf4fff0, 16, 16], [10, 4.2, 5, 0xf4fff0, 12, 14]] },
  { id: 'roof', music: 'tarbeach', name: 'Tar Beach', film: 'The roof over 4F, looking at the bridge', kicker: 'Open the coop. The pigeons know a shape you know.', plate: 'roof', video: 'roof', far: 70, tear: 9, low: true, noRope: true,
    floor: 'tar', floorTint: 0x8a8c94, wall: 'brick', outdoor: true, sound: 'roof', fog: 0x0a1020, fogD: 0.006, sky: 0x060a18, frame: 'black',
    hemi: [0x9ab0e8, 0x201810, 0.42], env: 0.4,
    lights: [[10, 7, -3, 0xbcd0ff, 18, 26], [4, 2.8, 3, 0xffc070, 8, 10], [16, 2.8, 3, 0xffc070, 8, 10]] },
  { id: 'penthouse', music: 'trio', name: 'The Penthouse', film: 'The Landlord at home, 57th Street, the ninetieth floor', kicker: 'Rent is due on the first. Walk across the painting over the fire.', plate: 'penthouse', noPlate: true, noNorth: true, noRope: true, h: 6.4,
    floor: 'marble', floorTint: 0x1a1a1e, wall: 'plaster', wallTint: 0x15151a, sound: 'office', fog: 0x0a0a12, fogD: 0.002, sky: 0x05060c, frame: 'gilt', post: { grain: 0.05 },
    hemi: [0xc8d0ff, 0x1a1208, 0.45], env: 0.45,
    lights: [[10, 4.4, -1.6, 0xffe2b0, 16, 18], [10, 1.0, 6.6, 0xff8a3a, 7, 9], [17, 3.0, -3.0, 0xd8e4ff, 8, 12]] },   // by the "Dynamic NFTs with New Yorkers assets" session: r_penthouse.js
];
