"use strict";
/* Glitch families for the headless NEW YORKERS variant run.
   Each family is a curated MOSH LAB chain in stage order, tuned to read as
   "glitch in the matrix" while keeping the source piece legible.
   tag = the bare second sentence used in variant metadata descriptions. */

const FAMILIES = [
  { key: 'MATRIX_RAIN', name: 'Matrix Rain', loop: 3.0, tag: 'The code was always falling.',
    fx: [
      ['overlay',  { dens: 0.55, size: 0.4, spd: 8, col: 4, amt: 0.85 }],
      ['rgbshift', { amt: 0.006, ang: 0, pulse: 0.5 }],
      ['scan',     { count: 260, amt: 0.3, spd: 1 }],
      ['ghost',    { amt: 0.45, zoom: 0.15, dx: 0, dy: 0 }],
    ] },
  { key: 'DATAMOSH_DRIFT', name: 'Datamosh Drift', loop: 2.5, tag: 'The frame never recovered.',
    fx: [
      ['mosh',   { amt: 0.3, cells: 20, drift: 0.3, spd: 12, esc: 0.6 }],
      ['blocks', { cells: 14, amt: 0.22, split: 0.5, spd: 10, esc: 0.5 }],
      ['jpeg',   { crush: 0.35, block: 1 }],
    ] },
  { key: 'VHS_MIDNIGHT', name: 'VHS Midnight', loop: 3.0, tag: 'Tracking never came back.',
    fx: [
      ['vhs',      { bleed: 0.6, track: 0.5, grain: 0.4 }],
      ['badtv',    { warp: 0.3, jit: 0.35, band: 0.6, roll: 1 }],
      ['noise',    { amt: 0.18, size: 1, col: 0.2, spd: 12 }],
      ['vignette', { amt: 0.5, round: 0.5, soft: 0.5 }],
    ] },
  { key: 'CRT_WAKE', name: 'CRT Wake', loop: 2.5, tag: 'The tube hums back.',
    fx: [
      ['adjust',    { hue: 0, spin: 0, sat: 1.15, bri: 1.2, con: 1.25 }],
      ['interlace', { shift: 0.014, rowh: 2, inv: 0 }],
      ['rgbshift',  { amt: 0.005, ang: 0.25, pulse: 0.4 }],
      ['crt',       { curve: 0.3, mask: 0.2, vig: 0.22 }],
      ['scan',      { count: 220, amt: 0.16, spd: 1 }],
    ] },
  { key: 'PRISM_DRIFT', name: 'Prism Drift', loop: 3.0, tag: 'Light split on arrival.',
    fx: [
      ['wave',     { amp: 0.008, freq: 4, cyc: 1, vert: 0.3 }],
      ['prism',    { spread: 0.25, axis: 0.2, cyc: 1 }],
      ['rgbshift', { amt: 0.004, ang: 0.5, pulse: 0.6 }],
    ] },
  { key: 'MELTDOWN', name: 'Meltdown', loop: 3.5, tag: 'The paint kept moving.',
    fx: [
      ['wobble', { amp: 0.1, kx: 1, ky: 2 }],
      ['smear',  { th: 0.68, len: 0.13, ang: 0.25 }],
      ['glow',   { th: 0.6, rad: 3, amt: 0.5 }],
    ] },
  { key: 'LED_BODEGA', name: 'LED Bodega', loop: 2.0, tag: 'Every corner is a screen.',
    fx: [
      ['adjust',  { hue: 0, spin: 0, sat: 1.2, bri: 1.3, con: 1.2 }],
      ['ledwall', { cells: 150, gap: 0.14, glow: 1.7 }],
      ['sharpen', { amt: 0.8 }],
    ] },
  { key: 'PETAL_STATIC', name: 'Petal Static', loop: 3.5, tag: 'The garden broke through.',
    fx: [
      ['petals', { dens: 0.55, size: 0.45, fall: 1, amt: 0.9 }],
      ['noise',  { amt: 0.08, size: 1, col: 0, spd: 10 }],
      ['ghost',  { amt: 0.3, zoom: 0.08, dx: 0, dy: 0 }],
    ] },
  { key: 'CRYSTAL_FREEZE', name: 'Crystal Freeze', loop: 2.5, tag: 'The signal shattered clean.',
    fx: [
      ['crystals', { cells: 110, jit: 0.45, edge: 0.12 }],
      ['slices',   { bands: 22, prob: 0.28, mag: 0.05, spd: 8 }],
      ['rgbshift', { amt: 0.005, ang: 0, pulse: 0.3 }],
    ] },
  { key: 'DEEP_SIGNAL', name: 'Deep Signal', loop: 2.5, tag: 'Fried at the source.',
    fx: [
      ['deepfry',  { amt: 0.42 }],
      ['halftone', { scale: 84, ang: 0.125, ink: 0.5, mix: 0.4 }],
      ['badtv',    { warp: 0.2, jit: 0.25, band: 0.4, roll: 1 }],
    ] },
];

/* pool of light finisher effects a token can gain as a seeded bonus */
const BONUS_POOL = ['rgbshift', 'noise', 'scan', 'vignette', 'interlace', 'ripple'];

/* proportional per token jitter applied to each tuned scalar param */
const JITTER = 0.2;
