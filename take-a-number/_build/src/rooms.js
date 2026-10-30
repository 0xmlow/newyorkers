// TAKE A NUMBER: a museum of New York lines. Eight rooms, each a line the city stands in, from the ticket machine at
// the DMV to the front of the line at Grand Central. Each is 20 m along x and 16 m deep; the north side opens onto its
// plate. `film` is the line and the wait. lights: [x, y, z, colour, intensity, distance].
export const W = 20, D = 16, H_IN = 6;
export const PORTAL = { dist: 8, w: 12, h: 4.4 };

export const ROOMS = [
  { id: 'ticket', lvl: 'A', music: 'hold', name: 'Take a Number', film: 'The DMV, Jamaica, Queens, now serving 4', kicker: 'Take a ticket. Your number is real. The number being served is also real. They will never meet. Keep the ticket.', plate: 'ticket', far: 40, tear: 2.2, plateTint: 0xd8dce0,
    floor: 'terrazzo', floorTint: 0xb8b8b0, wall: 'plaster', ceil: 'plaster', wallTint: 0xc8c4b0, ceilTint: 0xe8e6e0, sound: 'lobby', fog: 0x101010, fogD: 0.008, sky: 0x0a0a0a, frame: 'black', post: { sat: 0.8, vig: 0.36, grain: 0.04 },
    hemi: [0xf0f4ff, 0x2a2a28, 0.55], env: 0.4,
    lights: [[5, 5.6, -2, 0xf4f8ff, 22, 18], [15, 5.6, -2, 0xf4f8ff, 22, 18], [10, 2.6, 4, 0xffe0b0, 8, 12]] },
  { id: 'market', lvl: 'B', music: 'aisle', name: 'The Line for the Line', film: "A Trader Joe's, Union Square, forty minutes", kicker: 'The line wraps the whole store. Walk forward and the aisle moves with you. Walking backwards is the only way out.', plate: 'market', far: 34, tear: 2.2,
    floor: 'terrazzo', floorTint: 0xd0c8b0, wall: 'planks', ceil: 'plaster', wallTint: 0xb08a58, ceilTint: 0xf0ece0, sound: 'lobby', fog: 0x121210, fogD: 0.007, sky: 0x0c0c0a, frame: 'oak',
    hemi: [0xfff4e0, 0x2a2418, 0.55], env: 0.4,
    lights: [[5, 5.6, -2, 0xfff4e0, 22, 18], [15, 5.6, -2, 0xfff4e0, 22, 18], [10, 2.6, 4, 0xffd090, 8, 12]] },
  { id: 'club', lvl: 'C', music: 'velvet', name: 'The Rope', film: 'A club on West 54th, 1977, you are not on the list', kicker: 'The bouncer only lets the line move while you are not looking at him. Look at him and nobody moves. Do not look at him.', plate: 'club', far: 30, tear: 2.4,
    floor: 'asphalt', floorTint: 0x3a3a44, wall: 'brick', ceil: 'concrete', wallTint: 0x4a3a44, ceilTint: 0x1a1a22, sound: 'walking', fog: 0x0c0810, fogD: 0.012, sky: 0x06040a, frame: 'black', post: { bloom: 0.9, vig: 0.4, ca: 0.005 },
    hemi: [0xff80c0, 0x100818, 0.35], env: 0.3,
    lights: [[5, 5.2, -2, 0xff4fa3, 18, 16], [15, 5.2, -2, 0x22d3ee, 18, 16], [10, 2.4, 4, 0xffd090, 8, 12]] },
  { id: 'deli', lvl: 'D', music: 'deli', name: 'Hold the Ticket', film: "A deli on Houston Street, lose the ticket and it's fifty dollars", kicker: 'They hand you a ticket at the door. The cutter takes your order. Lose the ticket and the cashier charges fifty. There is a man by the pickles.', plate: 'deli', far: 34, tear: 2.2,
    floor: 'terrazzo', floorTint: 0xc8b890, wall: 'plaster', ceil: 'plaster', wallTint: 0xe0d0a0, ceilTint: 0xe8e0c8, sound: 'lobby', fog: 0x141008, fogD: 0.009, sky: 0x0c0a06, frame: 'oak', post: { grain: 0.05, vig: 0.34 },
    hemi: [0xfff0c8, 0x2a2010, 0.52], env: 0.4,
    lights: [[5, 5.6, -2, 0xfff0c8, 22, 18], [15, 5.6, -2, 0xfff0c8, 22, 18], [10, 2.6, 4, 0xffc070, 8, 12]] },
  { id: 'drop', lvl: 'E', music: 'drop', name: 'The Drop', film: 'A shop on Lafayette, Thursday 11 am, sold out at 11:01', kicker: 'The line moves only when you stand still. The stock drops every ten seconds. The resale table is right there and it is ten times the price.', plate: 'drop', far: 36, tear: 2.2, spawn: [12.6, 5.8],
    floor: 'concrete', floorTint: 0xd8d8d8, wall: 'plaster', ceil: 'plaster', wallTint: 0xf4f4f4, ceilTint: 0xf8f8f8, sound: 'lobby', fog: 0x161616, fogD: 0.006, sky: 0x0e0e0e, frame: 'black',
    hemi: [0xffffff, 0x2a2a2a, 0.62], env: 0.45,
    lights: [[5, 5.6, -2, 0xffffff, 24, 18], [15, 5.6, -2, 0xffffff, 24, 18], [10, 2.6, 4, 0xffe0e0, 8, 12]] },
  { id: 'santa', lvl: 'F', music: 'sleigh', name: 'The Maze', film: "Santaland, Herald Square, the line is the attraction", kicker: 'Santaland is a maze. The exit door sends you back to the entrance twice. The third time it lets you through. The elf knows.', plate: 'santa', far: 36, tear: 2.2, plateTint: 0xe0e0e0,
    floor: 'terrazzo', floorTint: 0xa02020, wall: 'plaster', ceil: 'plaster', wallTint: 0x2a6a3a, ceilTint: 0xf0e8e0, sound: 'lobby', fog: 0x100c0c, fogD: 0.009, sky: 0x0a0808, frame: 'gilt', post: { bloom: 0.4, vig: 0.34, sat: 0.9 },
    hemi: [0xfff0d0, 0x2a1810, 0.5], env: 0.35,
    lights: [[5, 5.4, -2, 0xffd0a0, 20, 18], [15, 5.4, -2, 0xa0ffb0, 20, 18], [10, 2.6, 4, 0xffe0c0, 8, 12]] },
  { id: 'bathroom', lvl: 'G', music: 'bar', name: 'The Bathroom Line', film: 'A bar on Avenue A, Saturday, 1 am, one stall', kicker: 'The door is occupied while you look at it. Walk away and it opens. Turn around and somebody is in there again. The hand dryer has been counted.', plate: 'bathroom', far: 30, tear: 2.4,
    floor: 'planks', floorTint: 0x5a4030, wall: 'brick', ceil: 'planks', wallTint: 0x6a3a30, ceilTint: 0x3a2a20, sound: 'apartment', fog: 0x100806, fogD: 0.012, sky: 0x0a0604, frame: 'black', post: { grain: 0.06, vig: 0.42 },
    hemi: [0xffc080, 0x1a1008, 0.34], env: 0.3,
    lights: [[5, 4.8, -2, 0xffa050, 16, 16], [15, 4.8, -2, 0xff6040, 14, 16], [10, 2.6, 4, 0xffe0b0, 8, 12]] },
  { id: 'front', lvl: 'H', music: 'arrival', name: 'The Front of the Line', film: 'Grand Central, the board, your number is up', kicker: 'The board lists every line in the museum. Stand on the gold star under the clock and your number comes up. Finally. Keep the ticket.', plate: 'front', far: 46, tear: 2.0,
    floor: 'marble', floorTint: 0xd8d0b8, wall: 'ashlar', ceil: 'plaster', wallTint: 0xd0c0a0, ceilTint: 0x6a8aa8, sound: 'lobby', fog: 0x14120c, fogD: 0.006, sky: 0x0c0a08, frame: 'gilt', post: { bloom: 0.45, vig: 0.3 }, tall: 7,
    hemi: [0xfff4d8, 0x2a2418, 0.55], env: 0.45,
    lights: [[6, 6.4, -1, 0xfff0c8, 26, 20], [14, 6.4, -1, 0xfff0c8, 26, 20], [10, 3, 4, 0xffe0b0, 8, 12]] },
];
