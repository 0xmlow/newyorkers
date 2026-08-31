"use strict";
/* Glitch families v2: the XCOPY / STILL WAITING school.
   Every family rides the escalation arc: the loop opens legible, corruption
   collapses the signal mid loop, then it melts back clean for a seamless
   restart. Params written {a: calm, b: peak} follow the arc every frame;
   {pick:[...]} chooses per seed; plain numbers get ±20% seeded jitter.
   frames / delayCs / maxColors / arcPow ranges are sampled per seed so no
   two pieces share tempo, palette depth, or collapse curve.
   tag = the bare second sentence used in variant metadata descriptions. */

const FAMILIES = [

  /* hard flicker, invert flashes, big block tears, starved palette */
  { key: 'XCOPY_STROBE', name: 'XCOPY Strobe', tag: 'The flash is the message.',
    frames: [12, 15], delayCs: [9, 11], maxColors: [28, 56], arc: 'burst', arcPow: [1.8, 3.0],
    fx: [
      ['blocks',   { cells: 10, amt: {a:0.03, b:0.85}, split: 0.7, spd: 10, esc: 0 }],
      ['rgbshift', { amt: {a:0.002, b:0.03}, ang: 0, pulse: 0.8 }],
      ['jpeg',     { crush: {a:0.05, b:0.75}, block: 1 }],
      ['strobe',   { rate: {pick:[2,3,4]}, duty: 0.16, mode: {pick:[0,0,0,3]} }],
      ['scan',     { count: 300, amt: 0.22, spd: 1 }],
    ] },

  /* the house STILL WAITING escalation: datamosh ramp into total collapse */
  { key: 'SIGNAL_COLLAPSE', name: 'Signal Collapse', tag: 'It held the frame as long as it could.',
    frames: [16, 20], delayCs: [8, 9], maxColors: [130, 170], arc: 'ramp', arcPow: [1.2, 2.2],
    fx: [
      ['mosh',     { amt: {a:0.04, b:0.8}, cells: 22, drift: {a:0.05, b:0.7}, spd: 12, esc: 0 }],
      ['blocks',   { cells: 16, amt: {a:0, b:0.55}, split: 0.5, spd: 10, esc: 0 }],
      ['vhs',      { bleed: {a:0.12, b:0.8}, track: {a:0.05, b:0.7}, grain: 0.3 }],
      ['rgbshift', { amt: {a:0.002, b:0.02}, ang: 0, pulse: 0.5 }],
    ] },

  /* a tube dying in public: warp, rolling bands, phosphor, bloom */
  { key: 'CRT_EXHUMED', name: 'CRT Exhumed', tag: 'The tube never forgave the city.',
    frames: [18, 22], delayCs: [8, 9], maxColors: [90, 140], arc: 'burst', arcPow: [1.4, 2.4],
    fx: [
      ['adjust',    { hue: 0, spin: 0, sat: 1.15, bri: 1.2, con: 1.3 }],
      ['badtv',     { warp: {a:0.04, b:0.55}, jit: {a:0.08, b:0.6}, band: {a:0.15, b:0.85}, roll: 1 }],
      ['interlace', { shift: {a:0.004, b:0.05}, rowh: 2, inv: 0 }],
      ['crt',       { curve: 0.35, mask: 0.24, vig: 0.28 }],
      ['glow',      { th: 0.6, rad: 3, amt: 0.5 }],
    ] },

  /* exhumed tape: tracking loss, color bleed, dropout bursts, echo */
  { key: 'VHS_GRAVE', name: 'VHS Grave', tag: 'Nobody rewound it.',
    frames: [16, 20], delayCs: [9, 10], maxColors: [110, 150], arc: 'ramp', arcPow: [1.3, 2.4],
    fx: [
      ['vhs',      { bleed: {a:0.2, b:0.9}, track: {a:0.1, b:0.85}, grain: {a:0.1, b:0.32} }],
      ['noise',    { amt: {a:0.03, b:0.28}, size: 1, col: 0, spd: 12 }],
      ['smear',    { th: 0.75, len: {a:0.02, b:0.24}, ang: 0.25 }],
      ['ghost',    { amt: {a:0.2, b:0.6}, zoom: 0.08, dx: 0, dy: 0 }],
      ['vignette', { amt: 0.45, round: 0.5, soft: 0.5 }],
    ] },

  /* 1 bit and gameboy dither, XCOPY texture, block tears in the collapse */
  { key: 'DITHER_PUNK', name: 'Dither Punk', tag: 'Two colors were enough.',
    frames: [12, 16], delayCs: [9, 11], maxColors: [12, 28], arc: 'burst', arcPow: [1.8, 3.0],
    fx: [
      ['dither',   { algo: {pick:[1,2,3,5]}, pal: {pick:[0,1,1,2,4]}, levels: {pick:[2,2,3]}, scale: {pick:[2,3,4]} }],
      ['blocks',   { cells: 12, amt: {a:0, b:0.6}, split: 0.6, spd: 10, esc: 0 }],
      ['rgbshift', { amt: {a:0.002, b:0.022}, ang: 0, pulse: 0.7 }],
      ['scan',     { count: 260, amt: 0.2, spd: 1 }],
    ] },

  /* rhythmic riot: slice storms and crushed jpeg gated by hue snap strobe */
  { key: 'DATA_RIOT', name: 'Data Riot', tag: 'The packet loss won.',
    frames: [14, 18], delayCs: [8, 10], maxColors: [64, 128], arc: 'burst', arcPow: [1.2, 2.0],
    fx: [
      ['mosh',   { amt: {a:0.12, b:0.6}, cells: 28, drift: 0.4, spd: 14, esc: 0 }],
      ['slices', { bands: 30, prob: {a:0.08, b:0.6}, mag: {a:0.02, b:0.18}, spd: 10 }],
      ['jpeg',   { crush: {a:0.15, b:0.7}, block: 1 }],
      ['strobe', { rate: {pick:[2,3]}, duty: 0.12, mode: 3 }],
    ] },

  /* surveillance feed losing its subject: REC hud, ghost echo, static */
  { key: 'GHOST_FEED', name: 'Ghost Feed', tag: 'The camera kept watching.',
    frames: [16, 20], delayCs: [9, 10], maxColors: [100, 140], arc: 'ramp', arcPow: [1.4, 2.6],
    fx: [
      ['camhud',   { style: {pick:[0,1,2]}, col: {pick:[0,1,2]}, amt: 0.95 }],
      ['ghost',    { amt: {a:0.25, b:0.75}, zoom: {a:0.04, b:0.3}, dx: 0, dy: 0 }],
      ['noise',    { amt: {a:0.03, b:0.16}, size: 1, col: 0, spd: 14 }],
      ['rgbshift', { amt: {a:0.002, b:0.012}, ang: 0.25, pulse: 0.4 }],
      ['scan',     { count: 240, amt: 0.28, spd: 1 }],
    ] },

  /* the brand itself is the corruption: eye and blossom storm in the tears */
  { key: 'EYE_STORM', name: 'Eye Storm', tag: 'The eye multiplies when the signal breaks.',
    frames: [16, 20], delayCs: [8, 9], maxColors: [90, 140], arc: 'burst', arcPow: [1.5, 2.6],
    fx: [
      ['adjust',     { hue: 0, spin: 0, sat: 1.2, bri: 1.1, con: 1.2 }],
      ['slices',     { bands: 26, prob: {a:0.06, b:0.5}, mag: {a:0.015, b:0.14}, spd: 9 }],
      ['brandhaunt', { dens: {a:0.15, b:0.95}, size: 0.24, split: {a:0.003, b:0.02},
                       jit: {a:0.006, b:0.09}, amt: {a:0.15, b:1}, spd: {pick:[5,6,8]}, mode: {pick:[0,0,1,2]} }],
      ['rgbshift',   { amt: {a:0.003, b:0.018}, ang: 0, pulse: 0.6 }],
    ] },
];

/* pool of light finisher effects a token can gain as a seeded bonus */
const BONUS_POOL = ['rgbshift', 'noise', 'scan', 'vignette', 'interlace', 'ripple'];

/* proportional per token jitter applied to each tuned scalar param */
const JITTER = 0.2;
