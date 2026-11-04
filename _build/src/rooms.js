// TEN STYLES. ONE CITY.: ten galleries of three rooms, in walking order. Room A rebuilds a real moment an artist (or the
// art) had in New York; room B is a real part of the city wrapped in that artist's art overnight. Each room is 20 m along
// x and 16 m deep; the north side opens onto its plate (FLORA, rebuilt as geometry from a depth map). `film` is the
// place and the year. Room C (`show`) is THE SHOW: a real New York exhibition of the artist rebuilt as a hall that hangs
// twenty eight of the restyled New Yorkers and a vault of every one. `g` is the gallery (its style, and the art on the walls). lights: [x, y, z, colour, intensity, distance].
export const W = 20, D = 16, H_IN = 6;
export const PORTAL = { dist: 8, w: 12, h: 4.4 };

const IN = { fog: 0x101010, fogD: 0.008, sky: 0x0a0a0a };
const L2 = (c, i = 20) => [[5, 5.6, -2, c, i, 18], [15, 5.6, -2, c, i, 18], [10, 3.2, 4, 0xfff0d8, 8, 12]];
// room C, THE SHOW: a hall that exists to hang the art. Three lights over the hang, warm, and a cooler one at the vault
const SHOW = (c, i = 16) => [[5, 4.6, -1, c, i * 1.2, 18], [15, 4.6, -1, c, i * 1.2, 18], [10, 4.2, 4.5, 0xfff4e4, 12, 14]];
// the line under every title on every wall, gallery by gallery
export const LABEL = { kusama: 'Portrait by MLow, restyled in Kusama\'s dots', basquiat: 'Portrait by MLow, restyled in Basquiat\'s hand', haring: 'Portrait by MLow, restyled in Haring\'s line',
  hokusai: 'Portrait by MLow, restyled as a Hokusai print', lichtenstein: 'Portrait by MLow, restyled in Lichtenstein\'s dots', dali: 'Portrait by MLow, restyled through Dali',
  warhol: 'Portrait by MLow, restyled as a Warhol screen', vangogh: 'Portrait by MLow, restyled in Van Gogh\'s colour', picasso: 'Portrait by MLow, restyled through Picasso', banksy: 'Portrait by MLow, restyled in stencil' };
export const ARTIST = { kusama: 'Yayoi Kusama', basquiat: 'Jean-Michel Basquiat', haring: 'Keith Haring', hokusai: 'Hokusai', lichtenstein: 'Roy Lichtenstein', dali: 'Salvador Dali', warhol: 'Andy Warhol', vangogh: 'Vincent van Gogh', picasso: 'Pablo Picasso', banksy: 'Banksy' };
const OUT = (c, i = 8) => [[5, 5.0, -2, c, i, 16], [15, 5.0, -2, c, i, 16]];

export const ROOMS = [
  // THE STYLE MACHINE: the way in. One New Yorker, ten hands: 219 of MLow's portraits exist in all ten styles; pick one,
  // press an artist, and watch it change; hang your own wall.
  { id: 'machine', g: 'machine', lvl: '0', hdri: 'day', floorKind: 'gallery', music: 'ticker', name: 'The Style Machine', film: 'One New Yorker, ten hands', noRope: true,
    floor: 'terrazzo', floorTint: 0x2a2a30, ceil: 'plaster', ceilTint: 0x1a1a1e, wall: 'plaster', wallTint: 0x34343e, sound: 'lobby', ...IN, fog: 0x0a0a0e, frame: 'black', post: { bloom: 0.6 }, hemi: [0xffffff, 0x202028, 0.75], env: 0.55,
    lights: [[5, 5.4, -1, 0xff4fa3, 14, 16], [15, 5.4, -1, 0x22d3ee, 14, 16], [10, 4.6, 4, 0xfff4e4, 10, 14]] },
  // KUSAMA
  { id: 'kusama_a', g: 'kusama', lvl: '1A', hdri: 'day', sun: [0xfff4e4, 1.4, -18, 30, 14], outdoor: true, floorKind: 'dots', music: 'council', name: 'Anatomic Explosion', film: 'Wall Street, November 1968', plate: 'kusama_a', far: 44, tear: 1.6,
    floor: 'cobble', floorTint: 0x8a8480, wall: 'ashlar', wallTint: 0xc0b8a8, sound: 'walking', fog: 0xd8d4c8, fogD: 0.006, sky: 0xd0d8e4, frame: 'black', hemi: [0xfff8ec, 0x60605a, 0.9], env: 0.55, lights: OUT(0xfff4e0) },
  { id: 'kusama_b', g: 'kusama', lvl: '1B', hdri: 'golden', sun: [0xffd8a8, 1.6, -30, 18, 10], outdoor: true, floorKind: 'dots', music: 'lounge', name: 'Chelsea, Dotted', film: 'West 22nd Street, Chelsea, the morning after', plate: 'kusama_b', far: 44, tear: 1.5,
    floor: 'pavers', floorTint: 0x9a8278, wall: 'brick', wallTint: 0x9a7060, sound: 'walking', fog: 0xe0c8b0, fogD: 0.005, sky: 0xe8c8a0, frame: 'black', golden: true, hemi: [0xffe8c8, 0x6a5848, 0.95], env: 0.6, lights: OUT(0xffd8b0, 10) },
  { id: 'kusama_c', g: 'kusama', show: true, lvl: '1C', hdri: 'day', floorKind: 'gallery', music: 'choir', name: 'One Thousand Boats', film: 'Gertrude Stein Gallery, 1963, and the mirror rooms after', plate: 'kusama_c', far: 30, tear: 2.2,
    floor: 'concrete', floorTint: 0xb8b8b8, ceil: 'plaster', ceilTint: 0xf4f4f4, wallTint: 0xffffff, sound: 'walking', ...IN, fog: 0x101010, frame: 'black', hemi: [0xffffff, 0x303030, 0.7], env: 0.5, lights: SHOW(0xfff6ec) },
  { id: 'kusama_d', g: 'kusama', lvl: '1D', hdri: 'day', floorKind: 'gallery', music: 'choir', name: "Self-Obliteration", film: 'Hold still and the dots take you', noRope: true, impossible: true,
    floor: 'concrete', floorTint: 0xf4f4f4, ceil: 'plaster', ceilTint: 0xffffff, wall: 'plaster', wallTint: 0xffffff, sound: 'walking', ...IN, frame: 'black', post: { bloom: 0.55 }, hemi: [0xffffff, 0x202020, 0.7], env: 0.45, lights: SHOW(0xffffff) },
  // BASQUIAT
  { id: 'basquiat_a', g: 'basquiat', lvl: '2A', hdri: 'night', outdoor: true, floorKind: 'street', music: 'lost', name: 'SAMO Was Here', film: 'Prince Street, SoHo, 1979', plate: 'basquiat_a', far: 40, tear: 1.6,
    floor: 'asphalt', floorTint: 0x4a4a4e, wall: 'brick', wallTint: 0x6a5a50, sound: 'walking', fog: 0x141418, fogD: 0.01, sky: 0x0a0a10, frame: 'black', night: true, post: { grain: 0.06, vig: 0.35 }, hemi: [0xd0c8ff, 0x1a1418, 0.55], env: 0.4,
    lights: [[5, 5.5, -2, 0xffb060, 18, 16], [15, 5.5, -2, 0xffb060, 18, 16], [10, 3, 4, 0xffe0b0, 8, 12]] },
  { id: 'basquiat_b', g: 'basquiat', lvl: '2B', hdri: 'day', sun: [0xfff0dc, 1.4, 24, 26, 14], outdoor: true, floorKind: 'street', music: 'parlour', name: 'Great Jones, Crowned', film: 'Great Jones Street, NoHo, the morning after', plate: 'basquiat_b', far: 40, tear: 1.6,
    floor: 'pavers', floorTint: 0x8a8278, wall: 'brick', wallTint: 0x8a6a58, sound: 'walking', fog: 0xd8d0c0, fogD: 0.006, sky: 0xd0d4dc, frame: 'oak', hemi: [0xfff4e4, 0x5a5448, 0.9], env: 0.55, lights: OUT(0xfff0d8) },
  { id: 'basquiat_c', g: 'basquiat', show: true, lvl: '2C', hangOpts: { noLabel: true }, hdri: 'day', floorKind: 'gallery', music: 'lost', name: 'The Floor Below', film: 'Annina Nosei Gallery, 100 Prince Street, March 1982', plate: 'basquiat_c', far: 28, tear: 2.2, noFloor: true,
    floor: 'planks', floorTint: 0x9a7a58, ceil: 'plaster', ceilTint: 0xf0ece4, wallTint: 0xffffff, sound: 'walking', ...IN, fog: 0x121010, frame: 'oak', hemi: [0xfff4e4, 0x2a241c, 0.65], env: 0.45, lights: SHOW(0xffe8c8, 18) },
  { id: 'basquiat_d', g: 'basquiat', darkRoom: true, lvl: '2D', hdri: 'day', floorKind: 'gallery', music: 'lost', name: "Gray's Anatomy", film: 'The book he was given at seven', noRope: true, impossible: true,
    floor: 'concrete', floorTint: 0x2a2622, ceil: 'plaster', ceilTint: 0x1e1c1a, wall: 'plaster', wallTint: 0x1e1c1a, sound: 'walking', ...IN, frame: 'black', post: { bloom: 0.55 }, hemi: [0xffffff, 0x202020, 0.7], env: 0.45, lights: SHOW(0xffe8c8) },
  // HARING
  { id: 'haring_a', g: 'haring', noMural: true, lvl: '3A', hdri: 'day', ceilH: 4.6, ceilImg: 'subway', ceilRep: 3, floorKind: 'subway', music: 'drip', name: 'Black Paper', film: 'Times Square station, 1982', plate: 'haring_a', far: 30, tear: 2.2,
    floor: 'concrete', floorTint: 0x8a8a86, wall: 'terrazzo', ceil: 'concrete', wallTint: 0xd8dccc, sound: 'lobby', ...IN, frame: 'steel', post: { grain: 0.05, vig: 0.3 }, hemi: [0xeaf4ff, 0x1a1c18, 0.5], env: 0.35, lights: L2(0xf4fff4, 22) },
  { id: 'haring_b', g: 'haring', lvl: '3B', hdri: 'day', sun: [0xfffaf0, 2.0, 16, 36, 20], outdoor: true, floorKind: 'court', music: 'showtime', name: 'Harlem, Outlined', film: 'Harlem River Drive at 128th Street, 1986', plate: 'haring_b', far: 44, tear: 1.6,
    floor: 'asphalt', floorTint: 0x7a6a5a, wall: 'concrete', wallTint: 0xd8c8a8, sound: 'walking', fog: 0xd8e8f8, fogD: 0.004, sky: 0x9ec8f0, frame: 'black', summer: true, post: { bloom: 0.5 }, hemi: [0xffffff, 0x807050, 1.05], env: 0.65, lights: OUT(0xfff8e8) },
  { id: 'haring_c', g: 'haring', show: true, lvl: '3C', hdri: 'day', floorKind: 'gallery', music: 'showtime', name: 'Pop Shop', film: '292 Lafayette Street, April 1986', plate: 'haring_c', far: 28, tear: 2.2,
    floor: 'concrete', floorTint: 0xa8a8a4, ceil: 'plaster', ceilTint: 0xffffff, wallTint: 0xffffff, sound: 'lobby', ...IN, frame: 'black', hemi: [0xffffff, 0x2a2a2a, 0.75], env: 0.5, lights: SHOW(0xffffff, 18) },
  { id: 'haring_d', g: 'haring', darkRoom: true, lvl: '3D', hdri: 'day', floorKind: 'gallery', music: 'showtime', name: "Draw With Your Feet", film: 'The floor is the black paper', noRope: true, impossible: true,
    floor: 'asphalt', floorTint: 0x101012, ceil: 'plaster', ceilTint: 0x15151a, wall: 'plaster', wallTint: 0x15151a, sound: 'walking', ...IN, frame: 'black', post: { bloom: 0.55 }, hemi: [0xffffff, 0x202020, 0.7], env: 0.45, lights: SHOW(0xffffff) },
  // HOKUSAI
  { id: 'hokusai_a', g: 'hokusai', lvl: '4A', hdri: 'golden', ceilH: 5.2, ceilImg: 'met', ceilRep: 4, ceilGlow: 0.2, floorKind: 'marble', music: 'spa', name: 'Under Low Light', film: 'The Japanese galleries, the Met, Fifth Avenue', plate: 'hokusai_a', far: 28, tear: 2.2,
    floor: 'planks', floorTint: 0x8a7258, wall: 'plaster', ceil: 'plaster', wallTint: 0xd8ccb4, sound: 'walking', fog: 0x0c0a08, fogD: 0.01, sky: 0x080604, frame: 'oak', post: { vig: 0.45 }, hemi: [0xffe8c8, 0x1a140c, 0.35], env: 0.3,
    lights: [[6, 4.8, -1, 0xffd8a0, 10, 12], [14, 4.8, -1, 0xffd8a0, 10, 12], [10, 3, 4, 0xffe8c0, 5, 10]] },
  { id: 'hokusai_b', g: 'hokusai', lvl: '4B', hdri: 'day', sun: [0xdce4ee, 0.7, 20, 30, 10], outdoor: true, floorKind: 'wet', music: 'aqua', name: 'The Great Surge', film: 'The Battery, October 29, 2012', plate: 'hokusai_b', far: 48, tear: 1.6,
    floor: 'pavers', floorTint: 0x6a6c70, wall: 'ashlar', wallTint: 0x8a8a88, sound: 'walking', fog: 0xa8b4bc, fogD: 0.009, sky: 0x9aa8b4, frame: 'oak', overcast: true, hemi: [0xdce4f0, 0x4a5058, 0.85], env: 0.5, lights: OUT(0xe8f0ff) },
  { id: 'hokusai_c', g: 'hokusai', show: true, lvl: '4C', hdri: 'golden', floorKind: 'marble', music: 'spa', name: 'The Unrolled City', film: 'Thirty six views, unrolled', plate: 'hokusai_c', far: 30, tear: 2.2,
    floor: 'planks', floorTint: 0x8a7258, ceil: 'plaster', ceilTint: 0xe8dcc4, wallTint: 0xf4ecdc, sound: 'walking', ...IN, fog: 0x0c0a08, frame: 'oak', post: { vig: 0.35 }, hemi: [0xffe8c8, 0x1a140c, 0.45], env: 0.35, lights: SHOW(0xffdcb0, 14) },
  { id: 'hokusai_d', g: 'hokusai', lvl: '4D', hdri: 'day', floorKind: 'gallery', music: 'choir', name: "Under the Wave", film: 'Fuji is the smallest thing in the picture', noRope: true, impossible: true,
    floor: 'concrete', floorTint: 0xd8ccb0, ceil: 'plaster', ceilTint: 0xeee4cc, wall: 'plaster', wallTint: 0xeee4cc, sound: 'walking', ...IN, frame: 'black', post: { bloom: 0.55 }, hemi: [0xffffff, 0x202020, 0.7], env: 0.45, lights: SHOW(0xfff4e0) },
  // LICHTENSTEIN
  { id: 'lichtenstein_a', g: 'lichtenstein', lvl: '5A', hdri: 'day', ceilH: 4.4, ceil: 'plaster', ceilTint: 0xf4f0e8, floorKind: 'apartment', music: 'parlour', name: 'Look, Castelli', film: '4 East 77th Street, February 1962', plate: 'lichtenstein_a', far: 26, tear: 2.2,
    floor: 'planks', floorTint: 0xa08a68, wall: 'plaster', wallTint: 0xf4f0e6, sound: 'apartment', ...IN, fog: 0x14120e, frame: 'black', hemi: [0xfffaf0, 0x2a2620, 0.6], env: 0.4, lights: L2(0xfff8ec, 18) },
  { id: 'lichtenstein_b', g: 'lichtenstein', lvl: '5B', hdri: 'day', sun: [0xfffaf0, 1.8, -20, 34, 16], outdoor: true, floorKind: 'street', music: 'ticker', name: 'Times Square, Inked', film: 'Times Square, the morning after', plate: 'lichtenstein_b', far: 44, tear: 1.6,
    floor: 'asphalt', floorTint: 0x5a5c66, wall: 'brick', wallTint: 0xc8b8a0, sound: 'walking', fog: 0xdce8f4, fogD: 0.004, sky: 0xb8d8f4, frame: 'black', summer: true, post: { bloom: 0.4 }, hemi: [0xffffff, 0x706458, 1.0], env: 0.6, lights: OUT(0xffffff) },
  { id: 'lichtenstein_c', g: 'lichtenstein', show: true, lvl: '5C', hdri: 'day', floorKind: 'gallery', music: 'parlour', name: 'Please Enter Frame', film: 'The Guggenheim, 1993, as one of his Interiors', plate: 'lichtenstein_c', far: 28, tear: 2.2,
    floor: 'terrazzo', floorTint: 0xe8e4dc, ceil: 'plaster', ceilTint: 0xffffff, wallTint: 0xffffff, sound: 'apartment', ...IN, frame: 'black', hemi: [0xffffff, 0x303030, 0.8], env: 0.5, lights: SHOW(0xffffff, 16) },
  { id: 'lichtenstein_d', g: 'lichtenstein', lvl: '5D', hdri: 'day', floorKind: 'gallery', music: 'showtime', name: "POW Room", film: 'Click anything', noRope: true, impossible: true,
    floor: 'concrete', floorTint: 0xf0f0f0, ceil: 'plaster', ceilTint: 0xffffff, wall: 'plaster', wallTint: 0xffffff, sound: 'walking', ...IN, frame: 'black', post: { bloom: 0.55 }, hemi: [0xffffff, 0x202020, 0.7], env: 0.45, lights: SHOW(0xffffff) },
  // DALI
  { id: 'dali_a', g: 'dali', lvl: '6A', hdri: 'night', outdoor: true, floorKind: 'wet', music: 'lounge', name: 'The Tub Went Through', film: 'Bonwit Teller, Fifth Avenue, March 1939', plate: 'dali_a', far: 30, tear: 2.0,
    floor: 'pavers', floorTint: 0x5a5658, wall: 'ashlar', wallTint: 0x9a9080, sound: 'walking', fog: 0x0e0c10, fogD: 0.01, sky: 0x08060a, frame: 'gilt', night: true, post: { grain: 0.05, vig: 0.4 }, hemi: [0xc8c0ff, 0x18141a, 0.5], env: 0.4,
    lights: [[5, 5, -2, 0xffd0a0, 16, 16], [15, 5, -2, 0xffd0a0, 16, 16], [10, 3, -5, 0xffe8d0, 14, 12]] },
  { id: 'dali_b', g: 'dali', lvl: '6B', hdri: 'golden', sun: [0xffc890, 1.8, -30, 14, 6], outdoor: true, floorKind: 'sand', music: 'saint', name: 'Dream of Venus', film: 'Flushing Meadows, the World\'s Fair, 1939', plate: 'dali_b', far: 48, tear: 1.5,
    floor: 'pavers', floorTint: 0xc8a878, wall: 'plaster', wallTint: 0xd8b890, sound: 'walking', fog: 0xe8c898, fogD: 0.005, sky: 0xf0c890, noFloor: true, frame: 'gilt', golden: true, hemi: [0xffe0b8, 0x6a5040, 0.95], env: 0.6, lights: OUT(0xffd090, 10) },
  { id: 'dali_c', g: 'dali', show: true, lvl: '6C', hangOpts: { seg: 14 }, hdri: 'golden', floorKind: 'gallery', music: 'saint', name: 'Please Hold Shape', film: 'The Museum of Modern Art, 1941', plate: 'dali_c', far: 30, tear: 2.2,
    floor: 'planks', floorTint: 0xa88a60, ceil: 'plaster', ceilTint: 0xf0e8d8, wallTint: 0xffffff, sound: 'walking', ...IN, fog: 0x14100a, frame: 'gilt', hemi: [0xffe8c8, 0x2a2010, 0.6], env: 0.45, lights: SHOW(0xffe0b8, 16) },
  { id: 'dali_d', g: 'dali', lvl: '6D', hdri: 'day', floorKind: 'gallery', music: 'choir', name: "The Elastic Corridor", film: 'Walk in and the room stretches, time slows', noRope: true, impossible: true,
    floor: 'concrete', floorTint: 0xb89a70, ceil: 'plaster', ceilTint: 0xd8c4a0, wall: 'plaster', wallTint: 0xd8c4a0, sound: 'walking', ...IN, frame: 'black', post: { bloom: 0.55 }, hemi: [0xffffff, 0x202020, 0.7], env: 0.45, lights: SHOW(0xffe0b0) },
  // WARHOL
  { id: 'warhol_a', g: 'warhol', lvl: '7A', hdri: 'night', ceilH: 4.6, ceilImg: 'foil', ceilRep: 3, ceilGlow: 0.25, floorKind: 'factory', music: 'ticker', name: 'The Silver Factory', film: '231 East 47th Street, 1964', plate: 'warhol_a', far: 24, tear: 2.4,
    floor: 'concrete', floorTint: 0x8a8a8c, wall: 'steel', ceil: 'plaster', wallTint: 0xd0d4d8, sound: 'apartment', ...IN, frame: 'steel', post: { bloom: 0.5, grain: 0.05 }, hemi: [0xf0f4ff, 0x202024, 0.55], env: 0.6, lights: L2(0xf4f8ff, 20) },
  { id: 'warhol_b', g: 'warhol', lvl: '7B', hdri: 'night', outdoor: true, floorKind: 'wet', music: 'showtime', name: 'Empire, Eight Hours', film: 'West 34th Street, 1964 and every night since', plate: 'warhol_b', far: 48, tear: 1.6,
    floor: 'asphalt', floorTint: 0x3a3c46, wall: 'brick', wallTint: 0x4a4a52, sound: 'walking', fog: 0x101018, fogD: 0.01, sky: 0x08080e, frame: 'black', night: true, post: { bloom: 0.9 }, hemi: [0xc0c0ff, 0x1a1020, 0.5], env: 0.5,
    lights: [[5, 7, -2, 0xff60c0, 22, 20], [15, 7, -2, 0x40c0ff, 22, 20], [10, 3, 4, 0xffffff, 10, 14]] },
  { id: 'warhol_c', g: 'warhol', show: true, lvl: '7C', hdri: 'day', floorKind: 'apartment', music: 'ticker', name: 'Retirement Looks Busy', film: 'Leo Castelli Gallery, April 1966', plate: 'warhol_c', far: 28, tear: 2.2,
    floor: 'planks', floorTint: 0xb09068, ceil: 'plaster', ceilTint: 0xffffff, wallTint: 0xffffff, sound: 'apartment', ...IN, frame: 'steel', post: { bloom: 0.35 }, hemi: [0xffffff, 0x302a20, 0.75], env: 0.6, lights: SHOW(0xfffaf0, 16) },
  { id: 'warhol_d', g: 'warhol', lvl: '7D', hdri: 'day', floorKind: 'gallery', music: 'ticker', name: "Fifteen Minutes", film: 'The camera is already running', noRope: true, impossible: true,
    floor: 'concrete', floorTint: 0xc0c0c8, ceil: 'plaster', ceilTint: 0xd8d8e0, wall: 'plaster', wallTint: 0xd8d8e0, sound: 'walking', ...IN, frame: 'black', post: { bloom: 0.55 }, hemi: [0xffffff, 0x202020, 0.7], env: 0.45, lights: SHOW(0xffffff) },
  // VAN GOGH
  { id: 'vangogh_a', g: 'vangogh', lvl: '8A', hdri: 'day', ceilH: 5.0, ceilImg: 'moma', ceilRep: 4, ceilGlow: 0.5, floorKind: 'gallery', music: 'choir', name: 'The Crowd of Phones', film: 'The fifth floor, MoMA, since 1941', plate: 'vangogh_a', far: 26, tear: 2.2,
    floor: 'planks', floorTint: 0xb0a088, wall: 'plaster', ceil: 'plaster', wallTint: 0xf4f2ec, sound: 'walking', ...IN, fog: 0x141414, frame: 'oak', hemi: [0xffffff, 0x2a2a2a, 0.7], env: 0.45, lights: L2(0xfffaf0, 18) },
  { id: 'vangogh_b', g: 'vangogh', lvl: '8B', hdri: 'night', outdoor: true, floorKind: 'cobble', music: 'aqua', name: 'Starry DUMBO', film: 'Washington Street, DUMBO, tonight', plate: 'vangogh_b', far: 48, tear: 1.6,
    floor: 'cobble', floorTint: 0x5a5a6a, wall: 'brick', wallTint: 0x5a4a48, sound: 'walking', fog: 0x0c1430, fogD: 0.008, sky: 0x0a1030, frame: 'gilt', night: true, post: { bloom: 0.8 }, hemi: [0x8aa0ff, 0x1a1820, 0.6], env: 0.45,
    lights: [[5, 5, -2, 0xffd060, 16, 16], [15, 5, -2, 0xffd060, 16, 16], [10, 3, 4, 0xffe8a0, 8, 12]] },
  { id: 'vangogh_c', g: 'vangogh', show: true, lvl: '8C', hdri: 'golden', floorKind: 'gallery', music: 'choir', name: 'Perspective Is Relative', spawn: [10, 6.8], film: 'MoMA, 11 West 53rd Street, November 1935', far: 26, tear: 2.2, noRope: true,
    floor: 'planks', floorTint: 0xb0905c, ceil: 'plaster', ceilTint: 0xe8c890, wallTint: 0xffffff, sound: 'walking', ...IN, fog: 0x141008, frame: 'gilt', hemi: [0xfff0d0, 0x2a2010, 0.65], env: 0.45, lights: SHOW(0xffe4b0, 16) },
  { id: 'vangogh_d', g: 'vangogh', darkRoom: true, lvl: '8D', hdri: 'day', floorKind: 'gallery', music: 'choir', name: "Stir the Sky", film: 'Walk and the stars follow', noRope: true, impossible: true,
    floor: 'concrete', floorTint: 0x10142a, ceil: 'plaster', ceilTint: 0x0a0e22, wall: 'plaster', wallTint: 0x0a0e22, sound: 'walking', ...IN, frame: 'black', post: { bloom: 0.55 }, hemi: [0xffffff, 0x202020, 0.7], env: 0.45, lights: SHOW(0xc8d4ff) },
  // PICASSO
  { id: 'picasso_a', g: 'picasso', lvl: '9A', hdri: 'golden', ceilH: 5.0, ceil: 'plaster', ceilTint: 0xd8c8a8, floorKind: 'apartment', music: 'lounge', name: 'The Curtain', film: 'The Four Seasons, Seagram Building, 1959 to 2014', plate: 'picasso_a', far: 26, tear: 2.2,
    floor: 'terrazzo', floorTint: 0xb0a080, wall: 'planks', wallTint: 0x8a6a48, sound: 'apartment', ...IN, fog: 0x18120a, frame: 'gilt', hemi: [0xffe8c0, 0x2a2010, 0.5], env: 0.45,
    lights: [[6, 4.6, -1, 0xffd8a0, 16, 14], [14, 4.6, -1, 0xffd8a0, 16, 14], [10, 2.6, 4, 0xffe0b0, 8, 10]] },
  { id: 'picasso_b', g: 'picasso', lvl: '9B', hdri: 'day', sun: [0xffffff, 1.4, 10, 34, 16], outdoor: true, floorKind: 'snow', music: 'carol', name: 'Rockefeller, Cubed', film: 'Rockefeller Plaza, the morning after', plate: 'picasso_b', far: 48, tear: 1.6,
    floor: 'pavers', floorTint: 0x8a8c96, wall: 'ashlar', wallTint: 0xb0a898, sound: 'walking', fog: 0xdce4f0, fogD: 0.005, sky: 0xd8e4f4, frame: 'gilt', winter: true, hemi: [0xffffff, 0x60646a, 1.0], env: 0.6, lights: OUT(0xffffff) },
  { id: 'picasso_c', g: 'picasso', show: true, lvl: '9C', hdri: 'day', floorKind: 'gallery', music: 'lounge', name: 'Three Sides Minimum', film: 'Picasso: Forty Years of His Art, MoMA, November 1939', plate: 'picasso_c', far: 30, tear: 2.2,
    floor: 'planks', floorTint: 0xa88a64, ceil: 'plaster', ceilTint: 0xf4f0e8, wallTint: 0xffffff, sound: 'walking', ...IN, frame: 'gilt', hemi: [0xffffff, 0x2a2620, 0.7], env: 0.5, lights: SHOW(0xfff4e0, 16) },
  { id: 'picasso_d', g: 'picasso', lvl: '9D', hdri: 'day', floorKind: 'gallery', music: 'lost', name: "Every Side at Once", film: 'A painting made live from a sculpture', noRope: true, impossible: true,
    floor: 'concrete', floorTint: 0x8a7a66, ceil: 'plaster', ceilTint: 0xc8bca8, wall: 'plaster', wallTint: 0xc8bca8, sound: 'walking', ...IN, frame: 'black', post: { bloom: 0.55 }, hemi: [0xffffff, 0x202020, 0.7], env: 0.45, lights: SHOW(0xfff0dc) },
  // BANKSY
  { id: 'banksy_a', g: 'banksy', lvl: '10A', hdri: 'golden', sun: [0xffe0b0, 1.5, -26, 20, 12], outdoor: true, floorKind: 'park', music: 'bodega', name: 'Sixty Dollars', film: 'Central Park, October 12, 2013', plate: 'banksy_a', far: 44, tear: 1.5,
    floor: 'pavers', floorTint: 0x8a8478, wall: 'ashlar', wallTint: 0x8a8878, sound: 'walking', fog: 0xd0c8a8, fogD: 0.006, sky: 0xd8d0b8, frame: 'black', golden: true, hemi: [0xfff4e0, 0x5a6a48, 0.9], env: 0.6, lights: OUT(0xfff0d0) },
  { id: 'banksy_b', g: 'banksy', lvl: '10B', hdri: 'night', outdoor: true, floorKind: 'wet', music: 'lost', name: 'Better Out Than In', film: 'The Meatpacking District, October 2013', plate: 'banksy_b', far: 44, tear: 1.6,
    floor: 'cobble', floorTint: 0x3a3a40, wall: 'brick', wallTint: 0x3a3634, sound: 'walking', fog: 0x08080a, fogD: 0.02, sky: 0x050506, frame: 'black', night: true, post: { grain: 0.07, vig: 0.5 }, hemi: [0x8090b0, 0x0a0a0c, 0.26], env: 0.2,
    lights: [[5, 5, -2, 0xffa050, 4, 10], [15, 5, -2, 0xffa050, 4, 10]] },
  { id: 'banksy_c', g: 'banksy', show: true, lvl: '10C', hdri: 'golden', ceilH: 4.6, floorKind: 'apartment', music: 'bodega', name: 'Nothing Stays Priced', film: 'A Housing Works thrift shop, October 2013', plate: 'banksy_c', far: 28, tear: 2.2,
    floor: 'planks', floorTint: 0xb08a5c, ceil: 'plaster', ceilTint: 0xd8d0c0, wallTint: 0xffffff, sound: 'apartment', ...IN, fog: 0x14100c, frame: 'oak', hemi: [0xfff0d8, 0x2a2018, 0.6], env: 0.4, lights: SHOW(0xffe4c0, 14) },
  { id: 'banksy_d', g: 'banksy', darkRoom: true, lvl: '10D', hdri: 'day', floorKind: 'gallery', music: 'lost', name: "Only When You're Not Looking", film: 'Look away', noRope: true, impossible: true,
    floor: 'asphalt', floorTint: 0x2a2a2c, ceil: 'plaster', ceilTint: 0x5a4a40, wall: 'brick', wallTint: 0x5a4a40, sound: 'walking', ...IN, frame: 'black', post: { bloom: 0.55 }, hemi: [0xffffff, 0x202020, 0.7], env: 0.45, lights: SHOW(0xffd8a0) },
  // THE FINALE: Luna Luna, the 1987 Hamburg art amusement park, revived at The Shed in 2024. Four of the ten made rides.
  { id: 'luna_luna', g: 'luna', lvl: 'FIN', hdri: 'night', floorKind: 'gallery', music: 'showtime', name: 'Luna Luna', film: 'The Shed, Hudson Yards, 2024, after Hamburg, 1987', plate: 'luna_luna', far: 34, tear: 2.0, noRope: true, edge: true,
    floor: 'concrete', floorTint: 0x6a6a70, ceil: 'steel', ceilTint: 0x3a3a40, wallTint: 0x8a8a90, wall: 'concrete', sound: 'walking', fog: 0x0a0812, fogD: 0.012, sky: 0x06050a, frame: 'black', post: { bloom: 0.7 }, hemi: [0xffd8b0, 0x1a1420, 0.55], env: 0.4,
    lights: [[5, 5.4, -2, 0xffc880, 22, 18], [15, 5.4, -2, 0xff80c0, 22, 18], [10, 4.4, 4, 0xfff0d8, 10, 14]] },
];
