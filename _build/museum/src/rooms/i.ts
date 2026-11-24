/* Rooms 37 to 41: the Vessel, Little Island, the Cathedral, Queensboro Plaza, a Bushwick rooftop. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Kit, Mount } from '../kit';
import type { RoomDef } from './types';
import { street, blockFront } from './f';
import { hero } from './heroes';
import { glbs, anamorph, fireflyPlate } from './a';

const PI = Math.PI;

/* ---------- THE BIG UPGRADE, wave 2d (2026-11-23): helpers for rooms 37, 39, 40 and 41 ----------
   A scanned CC0 surface (Poly Haven, 1k webp in assets/museum/tex/<room>/<name>_{c,n,r}.webp) laid in world space,
   `tile` metres a repeat. Until all three maps have arrived it is drawn flat at the tint times `mean` (about the
   brightness of the photo), so a slow line sees stone coloured stone, not white walls or a mirror floor; the maps go on
   together, because an unloaded roughness map samples as 0. In node (the audits) it is a plain material. */
const HAS_DOM = typeof window !== 'undefined' && typeof HTMLImageElement !== 'undefined';
const skinLoader = HAS_DOM ? new T.TextureLoader() : null;
const skinCache = new WeakMap<Kit, Map<string, T.MeshStandardMaterial>>();
export function skin(k: Kit, room: string, name: string, tile: number, p: Partial<T.MeshStandardMaterialParameters> & { normal?: number; mean?: number; rep?: number } = {}) {
  let cache = skinCache.get(k);
  if (!cache) { cache = new Map(); skinCache.set(k, cache); }
  const key = room + '/' + name + ':' + tile + ':' + JSON.stringify(p);
  const had = cache.get(key);
  if (had) return had;
  /* rep: vertical repeats per tile, for a photo whose rows were cropped and stretched to a square */
  const { normal = 1, mean = 0.3, rep = 1, ...rest } = p;
  const m = new T.MeshStandardMaterial({ roughness: 0.9, metalness: 0, normalScale: new T.Vector2(normal, normal), ...rest });
  m.userData.density = 1 / tile;
  cache.set(key, m);
  if (!skinLoader) return m;
  const tint = m.color.clone();
  m.color.copy(tint).multiplyScalar(mean);
  const one = (suf: string, srgb: boolean) => new Promise<T.Texture | null>((res) => {
    const url = `assets/museum/tex/${room}/${name}_${suf}.webp`;
    k.used.images.add(url);
    skinLoader.load(url, (t) => { t.colorSpace = srgb ? T.SRGBColorSpace : T.NoColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8; t.repeat.set(1, rep); res(t); }, undefined, () => res(null));
  });
  const all = Promise.all([one('c', true), one('n', false), k.o.quality === 'high' ? one('r', false) : Promise.resolve(null)]).then(([c, n, r]) => {
    if (!k.live) return;
    if (c) { m.map = c; m.color.copy(tint); }
    if (n) m.normalMap = n;
    if (r) m.roughnessMap = r;
    m.needsUpdate = true;
  });
  k.pending.push(all);
  return m;
}
/* A drawn canvas as a texture; null in node, where the room checks run without a canvas. */
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  if (!HAS_DOM) return null;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
/* A Firefly plate queued in FIREFLY_QUEUE.md: when the file lands at `url` it replaces the drawn stand in's map; until
   then the request 404s quietly. Not added to k.used, so the mint kit never asks for a file that may not exist. */
function swapIn(k: Kit, url: string, m: T.MeshBasicMaterial | T.MeshStandardMaterial) {
  skinLoader?.load(url, (t) => { if (!k.live) { t.dispose(); return; } t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; m.map = t; m.needsUpdate = true; }, undefined, () => undefined);
}
/* Stained glass drawn on a canvas: a rose of three rings of petals in leaded glass, and a pair of lancets. Stand ins
   for the Firefly plates; the colours follow Connick's blues and rubies. */
const GLASS = ['#1f3f9a', '#2a56c8', '#8a1f2a', '#c0342e', '#d8a23a', '#2a7a5a', '#5a2a8a', '#e8d8a8'];
function roseTex() {
  return canvasTex(1024, 1024, (g) => {
    const c = 512, rnd = X.mulberry(39);
    g.fillStyle = '#0c0c14'; g.fillRect(0, 0, 1024, 1024);
    g.save(); g.beginPath(); g.arc(c, c, 500, 0, PI * 2); g.clip();
    for (let i = 0; i < 1400; i++) { g.fillStyle = GLASS[Math.floor(rnd() * 3) % 2]; g.globalAlpha = 0.5 + rnd() * 0.5; const a = rnd() * PI * 2, r = rnd() * 500; g.fillRect(c + Math.cos(a) * r - 12, c + Math.sin(a) * r - 12, 24, 24); }
    g.globalAlpha = 1;
    const ring = (n: number, r0: number, r1: number, w: number, col: (i: number) => string) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * PI * 2; g.save(); g.translate(c, c); g.rotate(a);
        g.beginPath(); g.moveTo(r0, 0); g.quadraticCurveTo((r0 + r1) / 2, -w, r1, 0); g.quadraticCurveTo((r0 + r1) / 2, w, r0, 0);
        g.fillStyle = col(i); g.fill(); g.lineWidth = 7; g.strokeStyle = '#141018'; g.stroke(); g.restore();
      }
    };
    ring(32, 330, 495, 46, (i) => GLASS[[0, 2, 1, 3][i % 4]]);
    ring(16, 180, 330, 54, (i) => GLASS[[4, 5, 6, 2][i % 4]]);
    ring(8, 70, 180, 50, (i) => GLASS[[3, 1][i % 2]]);
    for (const r of [70, 180, 330, 495]) { g.beginPath(); g.arc(c, c, r, 0, PI * 2); g.lineWidth = 14; g.strokeStyle = '#2a2620'; g.stroke(); }
    g.beginPath(); g.arc(c, c, 62, 0, PI * 2); g.fillStyle = '#e8c868'; g.fill();
    g.restore();
  });
}
function lancetTex() {
  return canvasTex(256, 1024, (g) => {
    const rnd = X.mulberry(40);
    g.fillStyle = '#0c0c14'; g.fillRect(0, 0, 256, 1024);
    for (const x0 of [14, 134]) {
      g.save(); g.beginPath(); g.moveTo(x0, 1010); g.lineTo(x0, 160); g.quadraticCurveTo(x0, 30, x0 + 54, 14); g.quadraticCurveTo(x0 + 108, 30, x0 + 108, 160); g.lineTo(x0 + 108, 1010); g.closePath(); g.clip();
      for (let y = 0; y < 1024; y += 36) for (let x = x0; x < x0 + 108; x += 36) { g.fillStyle = GLASS[Math.floor(rnd() * 7)]; g.fillRect(x, y, 36, 36); }
      g.strokeStyle = '#141018'; g.lineWidth = 5;
      for (let y = 0; y < 1024; y += 36) { g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + 108, y); g.stroke(); }
      for (let x = x0; x < x0 + 108; x += 36) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1024); g.stroke(); }
      for (const y of [300, 620]) { g.beginPath(); g.arc(x0 + 54, y, 40, 0, PI * 2); g.fillStyle = '#e8d8a8'; g.fill(); g.stroke(); }
      g.restore();
    }
  });
}
/* A street or wayfinding totem: a dark slab on the ground with lettering on both faces. */
export function totem(k: Kit, lines: string[], x: number, z: number, rotY: number, y = 0, bg = '#1d2226', fg = '#f2efe6') {
  const h = 0.42 * lines.length + 0.5;
  k.box(0.9, h + 0.3, 0.22, x, y + (h + 0.3) / 2, z, k.flat(0x1d2226, 0.4, 0.5)).rotation.y = rotY;
  lines.forEach((t, i) => {
    const yy = y + h - 0.1 - i * 0.42;
    for (const s of [1, -1]) k.sign(t, 0.8, 0.36, x + Math.sin(rotY) * 0.115 * s, yy, z + Math.cos(rotY) * 0.115 * s, bg, fg, Math.min(110, Math.floor(1024 / (0.62 * t.length))), rotY + (s < 0 ? PI : 0));
  });
}

/* ---------------- 37 THE VESSEL ---------------- */
export const vessel: RoomDef = {
  id: 'vessel',
  name: 'The climb',
  area: 'HUDSON YARDS',
  mood: 'Copper noon',
  color: '#c98a5a',
  description: 'A vase of interlocking staircases in copper steel, climbed one landing at a time, the works on every parapet, the towers all around.',
  signatures: 'The widening honeycomb of landings and flights, the copper coloured cladding, the plaza and its glass towers, the river and the rail yards below.',
  build(k, ctx) {
    k.sky({ top: 0x6fa0d6, horizon: 0xe6ebee, ground: 0x6a6a66, fog: 0.0022, sun: { az: 3.0, el: 1.05, color: 0xfff6e8, size: 12 }, env: 1.0 });
    k.hemi(0xf2f6ff, 0x4a4a48, 0.95);
    k.sun(0xfff4e8, 2.6, 30, 80, -20, true, 90);
    /* THE BIG UPGRADE 2026-11-23 (wave 2d): scanned copper clad steel (Poly Haven metal_plate_02, polished to a mirror
       under every flight as on the real thing), scanned treads, the Public Square's big granite pavers and its lawn; plane
       trees in the planters, the square's modular seats and lamps as models; the Shed's quilted shell and the Edge's
       prow on 30 Hudson Yards; wayfinding totems; people on the square and on the climb; and LOOK UP painted long on
       the paving so that from the spawn it stands upright (the trick). */
    const copper = skin(k, 'vessel', 'copper', 1.6, { color: 0xe0946a, metalness: 0.85, roughness: 0.34 }),
      copperD = skin(k, 'vessel', 'copper', 1.6, { color: 0xc8805a, metalness: 1.0, roughness: 0.12, normal: 0.4 }),
      tread = skin(k, 'vessel', 'tread', 2.2, { color: 0x9a9894 }),
      plaza = skin(k, 'vessel', 'plaza', 3.2, { color: 0xd4d0c8, roughness: 0.75 }),
      granite = skin(k, 'vessel', 'plaza', 1.6, { color: 0x7c7a78, roughness: 0.6 }),
      glassT = k.pbr('yardsGlass', X.windows(64, 0.18, 0x7a98ad, false), 0.11, { emissive: 0xffffff, emissiveIntensity: 0.4, roughness: 0.2, metalness: 0.6, stretch: 0.42 }),
      glass = k.glass(0xdcecf6, 0.12, 0.04),
      green = skin(k, 'vessel', 'lawn', 2.4, { color: 0xb8d09a }),
      steelW = k.flat(0xdfe2e4, 0.6, 0.35);
    // the plaza, the towers, the yards and the river
    k.box(200, 0.4, 200, 0, -0.2, 0, plaza);
    for (const [x, z, w, h] of [[-70, -40, 34, 160], [70, -50, 30, 130], [-60, 70, 28, 110], [80, 60, 40, 200], [0, -110, 44, 180]]) k.box(w as number, h as number, w as number, x as number, (h as number) / 2, z as number, glassT);
    k.box(400, 0.3, 120, 0, -8, 200, k.pbr('yardsRail', X.steel(0x4a4c50, true, 65), 0.3));
    k.water({ y: -4, color: 0x2e4a5c, w: 400, d: 300, x: -260, z: 0, amp: 1.0 });
    k.box(40, 0.6, 12, 0, 0.3, 46, green);
    /* the granite rings the square is laid in, centred on the Vessel */
    for (const [r0, r1] of [[7.4, 8.4], [23.5, 24.3], [36.5, 37.3]]) { const g = new T.RingGeometry(r0, r1, 72, 1); g.rotateX(-PI / 2); k.mesh(g, granite, 0, 0.012, 0); }
    /* the planters: low granite drums with plane trees, between the six panels; trees on the lawn too */
    const trees: [number, number, number, number][] = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * PI * 2 + PI / 6, x = Math.cos(a) * 33, z = Math.sin(a) * 33;
      if (z > 36) continue;
      k.cyl(2.6, 0.7, x, 0.35, z, granite, 2.6, 28);
      k.cyl(2.4, 0.06, x, 0.71, z, k.flat(0x3a2e24, 0, 1), 2.4, 28);
      k.keepOut.push({ x, z, r: 3 });
      trees.push([x, 0.72, z, a * 3]);
    }
    for (let i = 0; i < 5; i++) trees.push([-16 + i * 8, 0.6, 46 + (i % 2 ? 2.5 : -2.5), i * 1.7]);
    glbs(k, 'vessel/tree_plane', { height: 8.5 }, trees);
    /* the square's seats (curved granite and timber benches stand in) and its lamps */
    const seats: [number, number, number, number][] = [];
    for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2 + PI / 6, x = Math.cos(a) * 26.5, z = Math.sin(a) * 26.5; seats.push([x, 0, z, -a + PI / 2]); k.keepOut.push({ x, z, r: 2.3 }); }
    glbs(k, 'vessel/modular_street_seating', { width: 4.3 }, seats);
    const lamps: [number, number, number, number][] = [];
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2 + PI / 8, x = Math.cos(a) * 38.6, z = Math.sin(a) * 38.6; lamps.push([x, 0, z, -a - PI / 2]); }
    glbs(k, 'vessel/street_lamp_02', { height: 5.2 }, lamps);
    /* the Shed, across the square to the west: a steel frame and its quilted ETFE shell, the arch on rails */
    {
      const SX = -66, SZ = 18, W = 30, H = 36, D = 44;
      const quilt = k.glass(0xf2f4f6, 0.55, 0.2);
      k.box(W, H, D, SX, H / 2, SZ, quilt);
      for (let i = 0; i <= 8; i++) { const z = SZ - D / 2 + (i / 8) * D; k.beam(v(SX + W / 2 + 0.2, 0, z), v(SX + W / 2 + 0.2, H, z), 0.22, steelW, 6); }
      for (let j = 1; j < 6; j++) k.beam(v(SX + W / 2 + 0.2, (j / 6) * H, SZ - D / 2), v(SX + W / 2 + 0.2, (j / 6) * H, SZ + D / 2), 0.16, steelW, 6);
      for (let i = 0; i < 8; i++) for (let j = 0; j < 6; j++) { const z0 = SZ - D / 2 + (i / 8) * D, y0 = (j / 6) * H; k.beam(v(SX + W / 2 + 0.25, y0, z0), v(SX + W / 2 + 0.25, y0 + H / 6, z0 + D / 8), 0.05, steelW, 4); k.beam(v(SX + W / 2 + 0.25, y0 + H / 6, z0), v(SX + W / 2 + 0.25, y0, z0 + D / 8), 0.05, steelW, 4); }
      for (const z of [SZ - D / 2 - 1, SZ + D / 2 + 1]) k.box(W + 20, 0.3, 0.6, SX - 10, 0.15, z, k.flat(0x4a4c50, 0.7, 0.5));
      /* a Firefly plate of the shell's pillows, queued; until it lands the frosted glass stays */
      fireflyPlate(k, 'assets/museum/tex/vessel/ff_shed_quilt.webp', D - 0.4, H - 0.4, SX + W / 2 + 0.3, H / 2, SZ, PI / 2, quilt);
    }
    /* the Edge: the triangular deck that juts from 30 Hudson Yards a hundred storeys up, glass walled */
    {
      const sh = new T.Shape(); sh.moveTo(-12, 0); sh.lineTo(12, 0); sh.lineTo(0, 22); sh.closePath();
      const g = new T.ExtrudeGeometry(sh, { depth: 1.6, bevelEnabled: false }); g.rotateX(PI / 2);
      k.mesh(g, k.flat(0x2a2e34, 0.6, 0.4), 0, 152, -88);
      const rail = new T.ExtrudeGeometry(sh, { depth: 2.4, bevelEnabled: false }); rail.rotateX(PI / 2);
      k.mesh(rail, k.glass(0x8aa4b4, 0.2, 0.05), 0, 154.4, -88).scale.set(0.98, 1, 0.98);
    }
    k.skyline({ z: 180, count: 30, spacing: 8, scale: 2.6, base: -2, seed: 103, lit: 0.15, glow: 0.35, tint: 0x6e7684, rows: 1 });
    // the vessel: sixteen levels of landings, each level wider, flights between them
    const LEVELS = 16, STEP = 3.1, path: T.Vector3[] = [];
    const rad = (L: number) => 7 + 15 * Math.pow(L / (LEVELS - 1), 1.35);
    const count = (L: number) => 6 + Math.floor(L / 2) * 2;
    const landings: T.Vector3[][] = [];
    for (let L = 0; L < LEVELS; L++) {
      const r = rad(L), n = count(L), y = L * STEP, ring: T.Vector3[] = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * PI * 2 + (L % 2) * (PI / n);
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        ring.push(v(x, y, z));
        const plat = k.mesh(new T.CylinderGeometry(2.2, 2.2, 0.3, 6), tread, x, y, z);
        plat.rotation.y = a;
        const rim = k.mesh(new T.CylinderGeometry(2.4, 2.4, 1.1, 6, 1, true), copper, x, y + 0.6, z);
        rim.rotation.y = a;
        const under = k.mesh(new T.CylinderGeometry(2.4, 1.2, 1.6, 6), copperD, x, y - 0.95, z);
        under.rotation.y = a;
        if (L > 0) {
          const below = landings[L - 1];
          let best = below[0], bd = Infinity;
          for (const b of below) { const d = b.distanceToSquared(v(x, y, z)); if (d < bd) { bd = d; best = b; } }
          const dir = v(x, y, z).sub(best);
          const len = dir.length();
          const flight = k.mesh(new T.BoxGeometry(1.6, 0.3, len - 3.6), tread, 0, 0, 0);
          flight.position.copy(best).add(dir.clone().multiplyScalar(0.5));
          flight.lookAt(v(x, y, z));
          const railL = k.mesh(new T.BoxGeometry(0.06, 1.0, len - 3.6), copper, 0, 0, 0);
          railL.position.copy(flight.position).add(v(0, 0.6, 0));
          railL.lookAt(v(x, y + 0.6, z));
          railL.translateX(0.85);
          const railR = k.mesh(new T.BoxGeometry(0.06, 1.0, len - 3.6), copper, 0, 0, 0);
          railR.position.copy(flight.position).add(v(0, 0.6, 0));
          railR.lookAt(v(x, y + 0.6, z));
          railR.translateX(-0.85);
        }
      }
      landings.push(ring);
    }
    // the guided climb: from landing to landing, spiralling up
    let cur = landings[0][0];
    path.push(cur.clone().add(v(0, 0, 0)));
    for (let L = 1; L < LEVELS; L++) {
      const ring = landings[L];
      let best = ring[0], bd = Infinity;
      const want = Math.atan2(cur.z, cur.x) + 0.45;
      for (const b of ring) { const d = Math.abs(Math.atan2(Math.sin(Math.atan2(b.z, b.x) - want), Math.cos(Math.atan2(b.z, b.x) - want))); if (d < bd) { bd = d; best = b; } }
      const steps = 10;
      for (let s = 1; s <= steps; s++) path.push(cur.clone().lerp(best, s / steps));
      cur = best;
    }
    const top = LEVELS * STEP;
    /* easter eggs, on landings along the guided climb */
    const WV = { name: 'Vessel (structure), Wikipedia', url: 'https://en.wikipedia.org/wiki/Vessel_(structure)' };
    const at = (L: number) => path[Math.min(path.length - 1, L * 10)].clone().add(v(0, 1.3, 0));
    k.egg(v(0, 1.6, 9.5), { id: 'vessel-numbers', title: '2,500 steps', year: '2019', text: 'Vessel is 16 storeys and 150 feet of connected staircases: 154 flights, about 2,500 steps and 80 landings, clad in copper coloured steel. It is 50 feet wide at the base and 150 feet wide at the top, holds 1,000 people at a time, and opened on March 15, 2019.', clue: 'Stand at the foot of the stairs and look straight up.', source: WV }, { r: 1.6 });
    k.egg(at(3), { id: 'vessel-stepwells', title: 'Stepwells and a stair in a skip', text: 'The steps are modelled on Indian stepwells. Thomas Heatherwick also traced the design to his childhood, when he fell in love with an old discarded flight of wooden stairs.', clue: 'Pause on a landing three flights up.', source: WV }, { r: 1.6 });
    k.egg(at(6), { id: 'vessel-monfalcone', title: 'Made in Italy, by sea', year: '2017', text: 'The structure came in 75 pieces, assembled in Monfalcone, Italy, shipped by sea and offloaded on the Hudson River. The first 10 pieces went up in April 2017, the other 65 arrived in five batches, and it topped out that December.', clue: 'Halfway up, look out toward the river it came in on.', source: WV }, { r: 1.6 });
    k.egg(at(9), { id: 'vessel-name', title: 'A placeholder name', text: 'Vessel was meant to be only a temporary name during construction, with a permanent one to come later; before that the Hudson Yards website called it the Hudson Yards Staircase. After it opened, the developer asked the public to suggest a name.', clue: 'Keep climbing; look for the glint about nine landings up.', source: WV }, { r: 1.6 });
    k.egg(at(12), { id: 'vessel-photos', title: 'Who owns your photo', text: 'When it opened, Hudson Yards claimed to own any photo visitors took of Vessel. After the criticism that followed, it quickly stopped claiming to own other people\'s pictures.', clue: 'High on the climb, stop and take a picture of the void.', source: WV }, { r: 1.6 });
    k.egg(at(15), { id: 'vessel-shawarma', title: 'The giant shawarma', text: 'Commentators nicknamed it the Giant Shawarma; Fortune called it Manhattan\'s answer to the Eiffel Tower. Its projected cost rose from $75 million to an estimated $150 to $200 million, which Heatherwick put down to the complexity of the steel pieces.', clue: 'Climb all the way to the top landing.', source: WV }, { r: 1.6 });
    k.mesh(new T.CylinderGeometry(rad(LEVELS - 1) + 2.2, rad(LEVELS - 1) + 2.2, 0.8, 48, 1, true), copper, 0, top - STEP + 1.4, 0);
    k.mesh(new T.CylinderGeometry(7.2, 7.2, 0.6, 32), tread, 0, -0.3, 0);
    k.mesh(new T.CylinderGeometry(6.4, 6.4, 0.3, 32), glass, 0, top - STEP + 0.6, 0);
    for (let L = 0; L < LEVELS; L += 3) k.point(0, L * STEP + 2, 0, 0xfff0e0, 20, 26);
    // the works: one on the inner parapet of a landing on every other level, facing the void
    const mounts: Mount[] = [];
    for (let L = 1; L < LEVELS; L++) {
      const ring = landings[L];
      const pick = L % 2 ? ring[Math.floor(ring.length / 3)] : ring[Math.floor(ring.length * 0.7)];
      const a = Math.atan2(pick.z, pick.x);
      const px = pick.x - Math.cos(a) * 2.3, pz = pick.z - Math.sin(a) * 2.3;
      mounts.push({ position: v(px, pick.y + 1.4, pz), rotation: -a + PI / 2, target: v(pick.x + Math.cos(a) * 0.8, pick.y + 2.1, pick.z + Math.sin(a) * 0.8), width: 2.6, height: 1.5, style: 'steel', wash: false, lookAt: v(px, pick.y + 1.4, pz) });
      if (L % 3 === 0) {
        const other = ring[(Math.floor(ring.length / 3) + Math.floor(ring.length / 2)) % ring.length];
        const b = Math.atan2(other.z, other.x);
        mounts.push({ position: v(other.x - Math.cos(b) * 2.3, other.y + 1.4, other.z - Math.sin(b) * 2.3), rotation: -b + PI / 2, target: v(other.x + Math.cos(b) * 0.8, other.y + 2.1, other.z + Math.sin(b) * 0.8), width: 2.6, height: 1.5, style: 'steel', wash: false });
      }
    }
    for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2; const x = Math.cos(a) * 30, z = Math.sin(a) * 30; k.box(0.4, 4.2, 5.4, 0, 0, 0, copper).position.set(x, 2.1, z); k.objects[k.objects.length - 1].rotation.y = -a - PI / 2; mounts.push({ position: v(x - Math.cos(a) * 0.25, 2.6, z - Math.sin(a) * 0.25), rotation: -a - PI / 2, target: v(Math.cos(a) * 25, 3, Math.sin(a) * 25), width: 4.6, height: 2.7, style: 'steel', wash: false }); }
    k.censusWall({ x: 0, y: 2.6, z: 44, rotY: PI, cols: 26, rows: 3, tile: 0.6, gap: 0.05, start: ctx.wallStart(5000, 78), pieces: ctx.all, backing: copperD });
    const climb = [v(0, 2.1, 30), v(0, 2.1, 18), v(0, 2.1, 9), ...path.map((p) => p.clone().add(v(0, 2.1, 0)))];
    /* wayfinding on the square, in the house type */
    totem(k, ['HUDSON YARDS', 'PUBLIC SQUARE', 'VESSEL'], 5.5, 33, 0);
    totem(k, ['THE HIGH LINE', 'W 30 ST', '10 AV'], -20, 30, PI / 5);
    totem(k, ['THE SHED', 'W 31 ST'], -34, 6, PI / 2);
    for (const [x, z, t, r] of [[38.5, 38.5, 'W 33 ST', -PI / 2], [-38.5, 38.5, '11 AV', 0]] as const) { k.box(0.1, 4.2, 0.1, x, 2.1, z, k.flat(0x22262a, 0.6, 0.5)); k.sign(t, 1.9, 0.38, x, 3.9, z, '#1f6a3a', '#ffffff', 92, r, { border: true, double: true }); }
    /* THE TRICK: LOOK UP painted long on the paving, foreshortened so that from the spawn it stands up as a sign */
    anamorph(k, 'LOOK UP', 0, 30, 2.1, 0, 8, 5.2, 1.4, '#f4efe4', 200);
    k.egg(v(0, 0.6, 19), { id: 'vessel-look-up', title: 'A sign that is not there', text: 'The words in front of you are painted flat on the paving and stretched some sixteen metres long. From the foot of the square they foreshorten into an upright sign, the street painter\'s anamorphic trick; take a step to either side and they fall flat. Vessel plays the same game with its own mirrored undersides, which turn the climbers into a kaleidoscope overhead.', clue: 'Walk onto the letters and watch them collapse.', source: WV }, { r: 2.4 });
    /* people: the square, and a line climbing */
    if (!ctx.reduced) {
      k.crowd(Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * PI * 2; return v(Math.cos(a) * 21, 0, Math.sin(a) * 21); }), 26, { seed: 37, speed: 0.6, spread: 3.2, closed: true });
      k.crowd([v(-30, 0, 40), v(0, 0, 34), v(30, 0, 40)], 10, { seed: 38, speed: 0.7, spread: 2 });
      k.crowd(path.slice(0, 80), 14, { seed: 39, speed: 0.35, spread: 0.5 });
    }
    return { mounts, spawn: climb[0].clone(), look: v(0, 22, 0), eye: 2.1, bounds: [-40, 40, -40, 48], path: climb, style: 'steel' };
  },
};

/* ---------------- 38 LITTLE ISLAND ---------------- */
export const littleisland: RoomDef = {
  id: 'littleisland',
  name: 'The tulips',
  area: 'LITTLE ISLAND',
  mood: 'Golden hour on the river',
  color: '#a8c4a0',
  description: 'A park held over the Hudson on concrete tulips, rolling lawns and an amphitheatre facing the water, the works set into the slopes.',
  signatures: 'The field of pot shaped concrete piles of varying height, the undulating planted topography, the amphitheatre bowl toward the river, the bridges from the esplanade.',
  build(k, ctx) {
    k.sky({ top: 0x6c8fc4, horizon: 0xf2c08c, ground: 0x4a5040, fog: 0.0024, sun: { az: 4.75, el: 0.14, color: 0xffb870, size: 24 }, haze: 0.4, env: 0.9 });
    k.hemi(0xffe4c8, 0x3a4a34, 0.8);
    k.sun(0xffc890, 2.4, -80, 24, 0, true, 100);
    const conc = k.pbr('tulipConc', X.concrete(0xb9b6ad, 24), 0.25, { roughness: 0.8 }),
      lawn = k.pbr('islandLawn', X.grass(0x4a7a38, 25), 0.15),
      gravel = k.pbr('islandPath', X.cobble(0xa39a86, 26), 1.1),
      timber = k.pbr('amphTimber', X.planks(0x8a6a48, 4, 66), 0.9),
      glass = k.glass(0xdcecf6, 0.12, 0.04),
      steel = k.flat(0x9aa4ae, 0.85, 0.3),
      iron = k.flat(0x1f242a, 0.7, 0.45);
    const field = (x: number, z: number) => 4 + 5 * Math.exp(-((x + 18) ** 2 + (z + 22) ** 2) / 500) + 7 * Math.exp(-((x - 20) ** 2 + (z + 40) ** 2) / 700) + 2.5 * Math.sin(x * 0.12) * Math.cos(z * 0.1) - 4 * Math.exp(-((x - 6) ** 2 + (z + 46) ** 2) / 260);
    // the river and the esplanade
    k.water({ y: -0.6, color: 0x2e4e62, w: 500, d: 400, z: -60, amp: 1.2 });
    k.box(160, 1.0, 20, 0, 0.4, 24, k.pbr('esplanade', X.pavers(0x8e8b84, 27), 0.4));
    k.rail(0, 14.2, 160, iron, 1.1, 'x', 1.6);
    street(k, { w: 20, len: 160, z: 44, x: 0 });
    blockFront(k, { x: 30, z0: 100, count: 8, face: -1, seed: 71, h: [16, 30] });
    blockFront(k, { x: -30, z0: 100, count: 8, face: 1, seed: 72, h: [16, 30] });
    k.skyline({ z: 200, count: 30, spacing: 9, scale: 2.8, base: -2, seed: 104, lit: 0.2, glow: 0.4, tint: 0x6e7684 });
    // the tulips: a grid of piles under the island, each rising to the surface it carries
    const tulips: T.Matrix4[] = [];
    for (let x = -40; x <= 40; x += 7) for (let z = -66; z <= -4; z += 7) {
      if ((x / 44) ** 2 + ((z + 35) / 36) ** 2 > 1) continue;
      const h = field(x, z);
      tulips.push(new T.Matrix4().compose(v(x, h - 1.2, z), new T.Quaternion(), v(1, h + 2, 1)));
    }
    const tulip = new T.LatheGeometry([new T.Vector2(1.4, -1), new T.Vector2(1.0, 0), new T.Vector2(0.9, 0.5), new T.Vector2(1.6, 0.85), new T.Vector2(3.4, 1.0)].map((p) => p), 10);
    k.instances(tulip, conc, tulips);
    // the island surface: a heightfield clipped to an ellipse
    const g = new T.PlaneGeometry(96, 80, 96, 80);
    g.rotateX(-PI / 2);
    const pa = g.attributes.position;
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i) - 35; const e = (x / 46) ** 2 + ((z + 35) / 38) ** 2; pa.setXYZ(i, x, e < 1 ? field(x, z) : field(x, z) - 30 * (e - 1), z); }
    g.computeVertexNormals();
    k.mesh(g, lawn);
    // the amphitheatre: stepped timber seating facing the river, a stage at the water
    const AX = 6, AZ = -46;
    for (let i = 0; i < 9; i++) { const r = 6 + i * 2; const ring = k.mesh(new T.RingGeometry(r, r + 1.6, 48, 1, PI * 1.1, PI * 0.8), timber, AX, field(AX, AZ) - 3.2 + i * 0.7, AZ); ring.rotation.x = -PI / 2; }
    k.mesh(new T.CylinderGeometry(6, 6, 0.4, 32), timber, AX, field(AX, AZ) - 3.4, AZ);
    k.box(14, 6, 0.6, AX, field(AX, AZ) - 0.4, AZ - 6.4, conc);
    k.keepOut.push({ x: AX, z: AZ, r: 6.5 });
    // paths, railings, trees, the overlook rail at the highest point
    for (const [x0, z0, x1, z1] of [[0, 12, -18, -22], [-18, -22, 20, -40], [20, -40, 6, -52], [0, 12, 26, -20]]) {
      const n = 14;
      for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; k.box(2.6, 0.2, 3.2, x, field(x, z) + 0.05, z, gravel).rotation.y = Math.atan2(x1 - x0, z1 - z0); }
    }
    const rnd = X.mulberry(38);
    for (let i = 0; i < 34; i++) { const x = (rnd() - 0.5) * 80, z = -8 - rnd() * 56; if ((x / 42) ** 2 + ((z + 35) / 34) ** 2 > 1) continue; if (Math.hypot(x - AX, z - AZ) < 14) continue; k.tree(x, field(x, z) - 0.2, z, { kind: rnd() > 0.4 ? 'round' : 'column', h: 3 + rnd() * 3, r: 1.6 + rnd() * 1.6, leaf: 0x4a7a3c, seed: i }); }
    for (let i = 0; i < 24; i++) { const a = (i / 24) * PI * 2, x = Math.cos(a) * 43, z = -35 + Math.sin(a) * 35; k.box(0.06, 1.1, 0.06, x, field(x, z) + 0.55, z, steel); }
    const ox = 20, oz = -40;
    k.mesh(new T.CylinderGeometry(6, 6.4, 0.3, 24), gravel, ox, field(ox, oz) + 0.1, oz);
    for (let i = 0; i < 24; i++) { const a = (i / 24) * PI * 2; k.box(0.06, 1.1, 0.06, ox + Math.cos(a) * 5.8, field(ox, oz) + 0.7, oz + Math.sin(a) * 5.8, steel); }
    k.torus(5.8, 0.04, ox, field(ox, oz) + 1.25, oz, steel, 48).rotation.x = PI / 2;
    for (const [x, z] of [[-18, -22], [ox, oz]]) { k.prop('lantern', x + 2, field(x + 2, z) , z, { height: 0.9 }); }
    k.prop('buoy', -50, -0.4, -20, { height: 2.2 });
    k.prop('life_ring', 8, 1.6, 14.15, { height: 0.9, rotY: 0 });
    // the two bridges from the esplanade onto the island
    for (const x of [-14, 12]) { k.box(4, 0.4, 12, x, 2.4 + field(x, 0) / 2 - 1, 8, timber).rotation.x = -Math.atan2(field(x, 0) - 0.9, 12); k.rail(x - 1.9, 8, 12, steel, 1.0, 'z', 1.5); k.rail(x + 1.9, 8, 12, steel, 1.0, 'z', 1.5); }
    k.censusWall({ x: 0, y: 3.0, z: 15.4, rotY: 0, cols: 26, rows: 3, tile: 0.6, gap: 0.05, start: ctx.wallStart(6000, 78), pieces: ctx.all, backing: iron });
    // the works: glass panels along the paths, the amphitheatre's backdrop, the overlook ring
    const mounts: Mount[] = [];
    for (const [x0, z0, x1, z1, n] of [[0, 12, -18, -22, 4], [-18, -22, 20, -40, 5], [0, 12, 26, -20, 4]] as const) {
      const ang = Math.atan2(x1 - x0, z1 - z0);
      for (let i = 1; i <= n; i++) { const t = i / (n + 1), x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; const px = x + Math.cos(ang) * 2.4, pz = z - Math.sin(ang) * 2.4; const y = field(px, pz); k.box(0.16, 3.2, 4.4, 0, 0, 0, glass).position.set(px, y + 1.8, pz); k.objects[k.objects.length - 1].rotation.y = ang; mounts.push({ position: v(px - Math.cos(ang) * 0.12, y + 2.2, pz + Math.sin(ang) * 0.12), rotation: ang + PI / 2, target: v(x, field(x, z) + 3, z), width: 3.6, height: 2.1, style: 'steel', wash: false }); }
    }
    for (const dx of [-4.5, 0, 4.5]) mounts.push({ position: v(AX + dx, field(AX, AZ) - 0.2, AZ - 6.05), rotation: 0, target: v(AX + dx * 0.5, field(AX, AZ) + 1.4, AZ + 2), width: 4.2, height: 2.5, style: 'steel', wash: false });
    for (let i = 0; i < 4; i++) { const a = PI * 0.75 + (i / 3) * PI * 0.5; const x = ox + Math.cos(a) * 5.6, z = oz + Math.sin(a) * 5.6; mounts.push({ position: v(x, field(ox, oz) + 2.2, z), rotation: -a + PI / 2, target: v(ox, field(ox, oz) + 3, oz), width: 2.8, height: 1.7, style: 'steel', wash: false }); }
    return { mounts, spawn: v(-14, 3, 21), look: v(-6, 9, -34), eye: 3, bounds: [-42, 42, -66, 22], style: 'steel', floorY: (x, z) => { const e = (x / 46) ** 2 + ((z + 35) / 38) ** 2; if (z > 12) return 0.9 - 0.9; if (e < 1) return field(x, z) - 0.15; return 0; } };
  },
};

/* ---------------- 39 THE CATHEDRAL ---------------- */
export const cathedral: RoomDef = {
  id: 'cathedral',
  name: 'The unfinished nave',
  area: 'ST. JOHN THE DIVINE',
  mood: 'Candlelight',
  color: '#b8a8c8',
  description: 'Amsterdam Avenue, the great west front, then a nave the length of two blocks under a rose window, chapels in the apse, candles everywhere.',
  signatures: 'The unfinished gothic west front with its portal and rose window, a nave of pointed arcades and clerestory, the ribbed vault, the seven chapels of the apse, the great organ.',
  build(k, ctx) {
    k.sky({ top: 0x2a3454, horizon: 0x8a8ca8, ground: 0x2a2a30, fog: 0.004, sun: { az: 4.6, el: 0.12, color: 0xffc090, size: 16 }, stars: 200, env: 0.6 });
    k.hemi(0xd8d0e8, 0x2a2430, 0.55);
    k.sun(0xffd8b0, 1.2, -50, 30, 30, true, 100);
    /* THE BIG UPGRADE 2026-11-23 (wave 2d): scanned stone (Poly Haven castle_brick_02_white and large_sandstone_blocks),
       a marble floor, granite for the eight choir columns, dark oak, plastered vaults; the rose window and the clerestory
       lancets drawn as leaded glass (Firefly plates queued), the clerestory glass brought out of the wall it was buried
       in; real pews with ends and backs; Gothic lanterns as models down the nave; brass candlesticks on the altar and
       two statues at the crossing; street signs; and the cathedral's nickname painted on the floor so it stands up for
       anyone who has just come in through the west door (the trick). */
    /* 2026-11-24: the ashlar photo carried a cornice band across its top and a dark plinth across its foot, so every
       3.2 m tile laid a pair of dark stripes up the west front and the towers. The photo is cropped to the four clean
       courses between them (rows 198 to 822 of 1024, mortar line to mortar line) and stretched to a square; `rep`
       squeezes it back, so courses are about 0.5 m and blocks 0.6 to 1.2 m long. The walls of the nave use the same
       limestone ashlar now, in a paler tint, instead of the small brick that read as a brick church. */
    const stone = skin(k, 'cathedral', 'ashlar', 3.2, { color: 0xf2ebe0, rep: 1.64, normal: 0.7 }),
      stoneD = skin(k, 'cathedral', 'ashlar', 3.2, { color: 0xcfc6b8, rep: 1.64, normal: 0.7 }),
      floorS = skin(k, 'cathedral', 'floor', 2.4, { color: 0xd8d2c8, roughness: 0.45 }),
      oak = skin(k, 'cathedral', 'oak', 1.4, { color: 0xa88866, roughness: 0.55 }),
      vault = skin(k, 'cathedral', 'vault', 3.5, { color: 0xeae2d4, side: T.DoubleSide }),
      pipe = k.flat(0xb8a878, 0.8, 0.35),
      glow = k.glow(0xffd8a0),
      flame = k.glow(0xffb060),
      pane = [k.glow(0x3a5ad8), k.glow(0xd83a3a), k.glow(0xd8b83a), k.glow(0x3ad87a), k.glow(0x8a3ad8)];
    // Amsterdam Avenue and the west front
    street(k, { w: 20, len: 120, z: 40, x: 0 });
    blockFront(k, { x: -40, z0: 80, count: 6, face: 1, seed: 73, h: [14, 20] });
    const FX = 0, FZ = 6, NW = 32, NL = 80, NH = 36;
    k.box(NW + 20, 44, 6, FX, 22, FZ + 3, stoneD);
    /* The two west towers were never finished, and the south one stands about 50 ft taller than the north. The front
       faces west onto Amsterdam Avenue, so south is +x here; the tall stump used to be on the north (-x) side. */
    k.box(12, 46, 10, FX - NW / 2 - 4, 23, FZ + 3, stoneD);
    k.box(12, 61, 10, FX + NW / 2 + 4, 30.5, FZ + 3, stoneD);
    k.arch(8, 16, 6.4, FX, 0, FZ + 3, stone, true, 0.9);
    for (let i = 0; i < 5; i++) k.arch(8 + i * 1.6, 16 + i * 1.4, 0.4, FX, 0, FZ + 6.2 + i * 0.4, stone, true, 0.62);
    k.block(FX - NW / 2 - 10, FX - 4.4, FZ, FZ + 6);
    k.block(FX + 4.4, FX + NW / 2 + 10, FZ, FZ + 6);
    for (let i = 0; i < 3; i++) k.box(NW + 30, 0.12, 1.2 + i * 1.2, FX, 0.3 - i * 0.12, FZ + 6.6 + i * 0.6, stone);
    // the rose window on the west front, glowing inward and outward
    const RY = 30, ZOUT = FZ + 6.04, ZIN = FZ - 0.04;
    /* the rose: leaded glass drawn on a canvas until the Firefly plate lands; lit from behind, so it glows both ways */
    const roseM = new T.MeshBasicMaterial({ map: roseTex(), color: 0xffffff, side: T.DoubleSide });
    swapIn(k, 'assets/museum/tex/cathedral/ff_rose.webp', roseM);
    for (const [zz, ry] of [[ZOUT, 0], [ZIN, PI]] as const) {
      k.mesh(new T.CircleGeometry(6.6, 48), stoneD, FX, RY, zz).rotation.y = ry;
      k.torus(6.4, 0.45, FX, RY, zz, stone, 48);
      k.torus(6.0, 0.16, FX, RY, zz + (ry ? -0.08 : 0.08), stoneD, 48);
      k.mesh(new T.CircleGeometry(6.0, 64), roseM, FX, RY, zz + (ry ? -0.04 : 0.04), true).rotation.y = ry;
      for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; k.beam(v(FX + Math.cos(a) * 1.0, RY + Math.sin(a) * 1.0, zz + (ry ? -0.1 : 0.1)), v(FX + Math.cos(a) * 5.9, RY + Math.sin(a) * 5.9, zz + (ry ? -0.1 : 0.1)), 0.06, stoneD, 5); }
    }
    void pane; void glow;
    k.point(FX, RY, FZ - 8, 0xbfa0ff, 60, 40);
    const lancetM = new T.MeshBasicMaterial({ map: lancetTex(), color: 0xd8d0e0 });
    swapIn(k, 'assets/museum/tex/cathedral/ff_lancet.webp', lancetM);
    // the nave: arcades of pointed arches, clerestory, the ribbed vault, the floor
    k.box(NW + 20, 0.4, NL + 12, FX, -0.2, FZ - NL / 2, floorS);
    for (const s of [-1, 1]) {
      k.arcade(NL, 16, 1.6, 8, 5.2, 14, FX + s * NW / 2, 0, FZ - NL / 2, stone, PI / 2, true);
      k.box(1.6, 12, NL, FX + s * NW / 2, 22, FZ - NL / 2, stone);
      /* the clerestory lancets: they were a box buried inside the 1.6 m wall; now leaded glass on its inner face, in a reveal */
      for (let i = 0; i < 8; i++) { const z = FZ - 5 - i * 10; const lw = k.mesh(new T.PlaneGeometry(3.2, 8), lancetM, FX + s * (NW / 2 - 0.82), 24, z, true); lw.rotation.y = -s * PI / 2; for (const dz of [-1.75, 1.75]) k.box(0.5, 8.6, 0.3, FX + s * (NW / 2 - 0.95), 24, z + dz, stoneD); k.box(0.5, 0.4, 3.8, FX + s * (NW / 2 - 0.95), 19.8, z, stoneD); k.box(0.5, 0.5, 3.8, FX + s * (NW / 2 - 0.95), 28.2, z, stoneD); k.column(FX + s * (NW / 2 - 1.4), 0.1, z + 5, 15.6, 0.8, stone, true, stoneD); }
      k.box(0.6, 10, NL, FX + s * (NW / 2 + 10), 5, FZ - NL / 2, stone);
      k.box(10, 0.6, NL, FX + s * (NW / 2 + 5), 10, FZ - NL / 2, stoneD);
      k.block(FX + s * (NW / 2 + 10) - 0.4, FX + s * (NW / 2 + 10) + 0.4, FZ - NL, FZ);
    }
    for (let i = 0; i <= 8; i++) {
      const z = FZ - i * 10;
      const pts = Array.from({ length: 25 }, (_, j) => { const t = (j / 24) * PI; return v(FX + Math.cos(t) * NW / 2, NH - 8 + Math.sin(t) * 9 * (1 + 0.25 * Math.sin(t)), z); });
      k.curve(pts, 0.32, stoneD, 24);
      if (i < 8) { k.curve([v(FX - NW / 2, NH - 8, z), v(FX, NH + 1.5, z - 5), v(FX + NW / 2, NH - 8, z - 10)], 0.22, stoneD, 24); k.curve([v(FX + NW / 2, NH - 8, z), v(FX, NH + 1.5, z - 5), v(FX - NW / 2, NH - 8, z - 10)], 0.22, stoneD, 24); }
    }
    const vaultG = new T.BufferGeometry(), vp: number[] = [], vi: number[] = [];
    for (const z of [FZ + 2, FZ - NL - 2]) for (let j = 0; j <= 24; j++) { const t = (j / 24) * PI; vp.push(FX + Math.cos(t) * (NW / 2 + 0.6), NH - 8 + Math.sin(t) * 9.4 * (1 + 0.25 * Math.sin(t)), z); }
    for (let j = 0; j < 24; j++) vi.push(j, j + 25, j + 1, j + 1, j + 25, j + 26);
    vaultG.setAttribute('position', new T.Float32BufferAttribute(vp, 3));
    vaultG.setIndex(vi);
    vaultG.computeVertexNormals();
    k.mesh(vaultG, vault);
    // the crossing and the apse of seven chapels, the choir and the organ
    const CZ = FZ - NL;
    /* The apse. It used to be a half cylinder on the -x side (thetaStart PI) with its seven chapel drums standing
       inside the east end of the nave (z > CZ) and a block over the space behind. The real east end is a choir ringed
       by eight granite columns about 54 ft tall, an ambulatory, and the seven Chapels of the Tongues radiating
       beyond it. So: the choir wall now sits on the east (-z) side and only above the ambulatory, the eight granite
       columns carry it, and the chapels open off an ambulatory whose outer wall lines up with the aisle walls. */
    const AR = NW / 2 + 11, granite = skin(k, 'cathedral', 'granite', 2, { color: 0x9a96a0, roughness: 0.4 });
    k.mesh(new T.CylinderGeometry(NW / 2 + 2, NW / 2 + 2, 16, 32, 1, true, PI / 2, PI), stone, FX, 22, CZ);
    k.mesh(new T.SphereGeometry(NW / 2 + 2, 32, 12, PI, PI, 0, PI / 2), vault, FX, 30, CZ);
    k.mesh(new T.CylinderGeometry(AR, AR, 14, 40, 1, true, PI / 2, PI), stoneD, FX, 7, CZ);
    { const g = new T.RingGeometry(NW / 2 + 1.4, AR, 40, 1, PI, PI); g.rotateX(PI / 2); k.mesh(g, vault, FX, 14, CZ); }
    for (let j = 0; j <= 7; j++) { const a = PI + (j / 7) * PI; k.column(FX + Math.cos(a) * (NW / 2 - 0.5), 0.1, CZ + Math.sin(a) * (NW / 2 - 0.5), 14, 0.85, granite, false, stone); k.keepOut.push({ x: FX + Math.cos(a) * (NW / 2 - 0.5), z: CZ + Math.sin(a) * (NW / 2 - 0.5), r: 1.2 }); }
    for (let i = 0; i < 7; i++) {
      const a = PI + ((i + 0.5) / 7) * PI, ca = Math.cos(a), sa = Math.sin(a);
      const cx = FX + ca * (NW / 2 + 6), cz = CZ + sa * (NW / 2 + 6), open = Math.atan2(-ca, -sa);
      k.mesh(new T.CylinderGeometry(4.4, 4.4, 12, 16, 1, true, open + 0.8, PI * 2 - 1.6), stone, cx, 6, cz);
      k.mesh(new T.SphereGeometry(4.4, 16, 8, 0, PI * 2, 0, PI / 2), stoneD, cx, 12, cz);
      k.arch(3.2, 8, 1.2, FX + ca * (NW / 2 + 1.6), 0, CZ + sa * (NW / 2 + 1.6), stone, true, 0.7).rotation.y = Math.atan2(ca, sa);
      k.point(cx, 5, cz, 0xffc890, 14, 8);
      for (let c = 0; c < 6; c++) { const fa = (c / 6) * PI * 2; k.cyl(0.05, 0.4, cx + Math.cos(fa) * 1.6, 1.1, cz + Math.sin(fa) * 1.6, k.flat(0xf4e8d0, 0, 0.6), 0.05, 6); k.sphere(0.07, cx + Math.cos(fa) * 1.6, 1.36, cz + Math.sin(fa) * 1.6, flame, 6); }
      k.keepOut.push({ x: cx, z: cz, r: 1.9 });
    }
    /* the square corners behind the round ambulatory wall */
    for (const s of [-1, 1]) k.keepOut.push({ x: FX + s * (NW / 2 + 9), z: CZ - AR + 2, r: 10.5 });
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { k.box(1.2, 2.2, 2.6, FX + s * 7, 1.1, CZ + 14 - i * 3, oak); k.box(1.2, 1.4, 2.6, FX + s * 7.6, 2.9, CZ + 14 - i * 3, oak); k.keepOut.push({ x: FX + s * 7, z: CZ + 14 - i * 3, r: 1.8 }); }
    for (const s of [-1, 1]) for (let i = 0; i < 14; i++) { const h = 4 + Math.abs(7 - i) * 0.6; k.cyl(0.32, h, FX + s * (NW / 2 - 4) + s * 0, 16 + h / 2, CZ + 8 + i * 0.9 - 6, pipe, 0.28, 10); }
    k.box(NW / 2, 1.2, 14, FX, 15.4, CZ + 8, oak);
    k.box(6, 1.2, 4, FX, 0.6, CZ + 2, stone);
    k.box(6.4, 0.2, 4.4, FX, 1.3, CZ + 2, k.flat(0xf4f0e8, 0, 0.8));
    for (let c = 0; c < 8; c++) { k.cyl(0.06, 0.9, FX - 2.4 + c * 0.7, 1.85, CZ + 0.4, k.flat(0xf4e8d0, 0, 0.6), 0.06, 6); k.sphere(0.08, FX - 2.4 + c * 0.7, 2.36, CZ + 0.4, flame, 6); }
    k.keepOut.push({ x: FX, z: CZ + 2, r: 4 });
    if (!ctx.reduced) { const flames: T.Object3D[] = []; k.scene.traverse((o) => { if (o instanceof T.Mesh && o.material === flame) flames.push(o); }); k.ticks.push((t) => flames.forEach((f, i) => { const s = 0.85 + 0.3 * Math.abs(Math.sin(t * 7 + i * 1.7)); f.scale.set(s, s * 1.4, s); })); }
    /* the nave's hanging lights: Gothic lanterns (Poly Haven lantern_chandelier_01, CC0) on long chains, sixteen of them */
    const lanterns: [number, number, number, number][] = [];
    for (let i = 0; i < 8; i++) { const z = FZ - 5 - i * 10; k.point(FX, 14, z, 0xffd8a8, 30, 22); for (const s of [-1, 1]) { k.beam(v(FX + s * 8, NH - 6, z), v(FX + s * 8, 10.3, z), 0.03, pipe, 4); lanterns.push([FX + s * 8, 8.6, z, i * 0.4]); k.point(FX + s * 8, 8.9, z, 0xffc890, 3, 6); } }
    glbs(k, 'cathedral/lantern_chandelier', { height: 1.8 }, lanterns);
    /* the pews: seat, back, kneeler and two carved ends each, in oak */
    for (let i = 0; i < 12; i++) for (const s of [-1, 1]) {
      const z = FZ - 14 - i * 4.5, x = FX + s * 6;
      k.box(5, 0.07, 0.52, x, 0.46, z + 0.62, oak);
      k.box(5, 0.82, 0.06, x, 0.86, z + 0.92, oak);
      k.box(5, 0.06, 0.12, x, 1.24, z + 0.94, oak);
      k.box(5, 0.12, 0.22, x, 0.14, z + 0.1, oak);
      for (const e of [-1, 1]) { k.box(0.08, 1.05, 0.8, x + e * 2.52, 0.52, z + 0.62, oak); k.cyl(0.4, 0.08, x + e * 2.52, 1.05, z + 0.62, oak, 0.4, 14).rotation.z = PI / 2; }
      k.block(x - 2.6, x + 2.6, z - 0.4, z + 1.6);
    }
    k.censusWall({ x: FX, y: 20, z: FZ - 0.08, rotY: PI, cols: 28, rows: 4, tile: 0.7, gap: 0.05, start: ctx.wallStart(800, 112), pieces: ctx.all, backing: stoneD });
    k.sign('THE CATHEDRAL CHURCH OF ST. JOHN THE DIVINE', 12, 0.8, FX, 23.2, FZ - 0.1, 'transparent', '#e8dcc0', 70, PI);
    k.sign('THE CATHEDRAL CHURCH OF ST. JOHN THE DIVINE', 14, 0.9, FX, 20, FZ + 6.1, 'transparent', '#e8dcc0', 70, 0);
    /* easter eggs */
    const WC = { name: 'Cathedral of Saint John the Divine, Wikipedia', url: 'https://en.wikipedia.org/wiki/Cathedral_of_Saint_John_the_Divine' };
    k.egg(v(FX + NW / 2 + 4, 4, FZ + 8.6), { id: 'cath-unfinished', title: 'St. John the Unfinished', year: '1892', text: 'The cornerstone was laid on December 27, 1892, and the building has been called St. John the Unfinished ever since. The two west towers were planned to reach about 266 feet and were never finished; the south tower stands about 50 feet taller than the north.', clue: 'Stand on Amsterdam Avenue and compare the two towers of the west front.', source: WC }, { r: 1.6 });
    k.egg(v(FX, RY - 8, FZ - 1.2), { id: 'cath-rose', title: '10,000 pieces of glass', text: 'The great rose window is 40 feet across and made of 10,000 pieces of glass by Charles Connick. It is called the largest rose window in the United States.', clue: 'Turn back at the crossing and look up at the west wall.', source: WC }, { r: 1.6 });
    k.egg(v(FX - NW / 2 - 5, 1.6, FZ - 30), { id: 'cath-poets', title: 'Poets\' Corner', year: '1985', text: 'Poets\' Corner is in the Arts Bay on the north side of the nave, dedicated in 1985. Its first inductees were Emily Dickinson, Washington Irving and Walt Whitman, and the poets in residence and electors since have included 17 United States Poets Laureate.', clue: 'Walk down the north aisle, under the arcade on your left as you face the altar.', source: WC }, { r: 1.6 });
    k.egg(v(FX + NW / 2 - 4, 16.5, CZ + 8), { id: 'cath-organ', title: 'The State Trumpet', year: '1910', text: 'The Great Organ was built by Ernest M. Skinner in 1906 to 1910 and now has 8,514 pipes. Its State Trumpet does not sit with the rest: it is under the rose window, about 500 feet to the west, so it sounds from the far end of the nave.', clue: 'Find the organ pipes above the choir.', source: WC }, { r: 1.6 });
    { const a = PI + (4 / 7) * PI; k.egg(v(FX + Math.cos(a) * (NW / 2 - 0.5), 4, CZ + Math.sin(a) * (NW / 2 - 0.5) + 1.2), { id: 'cath-columns', title: 'Eight granite columns', year: '1911', text: 'Eight granite columns ring the choir, each about 54 feet tall, made in two sections weighing 130 short tons together. The choir was consecrated in 1911, and the crossing in front of it was installed in 1909 under a Guastavino tile dome 93 feet across.', clue: 'Walk behind the altar to the ring of dark columns.', source: WC }, { r: 1.6 }); }
    { const a = PI + (3.5 / 7) * PI; k.egg(v(FX + Math.cos(a) * (NW / 2 + 6), 2.4, CZ + Math.sin(a) * (NW / 2 + 6)), { id: 'cath-tongues', title: 'Chapels of the Tongues', text: 'The seven chapels around the ambulatory are the Chapels of the Tongues, each devoted to a major immigrant group when the apse was finished. The three to the south were for the Latin races, the three to the north for the Germanic races, and the seventh, St. Savior, for immigrants from Africa and Asia. St. Savior holds a bronze three panel altarpiece with gold leaf by Keith Haring, designed just before his death.', clue: 'Walk around the ambulatory into the chapel at the far east end.', source: WC }, { r: 1.6 }); }
    /* brass candlesticks on the altar, two statues on plinths before the choir (Poly Haven, CC0) */
    glbs(k, 'cathedral/brass_candleholders', { width: 1.2 }, [[FX - 2.2, 1.4, CZ + 2.6, 0], [FX + 2.2, 1.4, CZ + 2.6, 0]]);
    for (const s of [-1, 1]) { k.box(1.6, 2.2, 1.6, FX + s * 11, 1.1, CZ + 18, stoneD); k.box(1.9, 0.2, 1.9, FX + s * 11, 2.3, CZ + 18, stone); k.keepOut.push({ x: FX + s * 11, z: CZ + 18, r: 1.4 }); }
    glbs(k, 'cathedral/gothic_statue', { height: 2.0 }, [[FX - 11, 2.4, CZ + 18, PI / 2], [FX + 11, 2.4, CZ + 18, -PI / 2]]);
    /* signs: the corner of Amsterdam Avenue and 112th Street, Poets' Corner in the north aisle */
    for (const [x, t, r] of [[-12, 'AMSTERDAM AV', 0], [-12, 'W 112 ST', PI / 2]] as const) k.sign(t, 2.4, 0.42, x, r ? 4.15 : 4.6, 30.2, '#1f6a3a', '#ffffff', 90, r, { border: true, double: true });
    k.box(0.1, 4.6, 0.1, -12, 2.3, 30.2, k.flat(0x22262a, 0.6, 0.5));
    totem(k, ['ST. JOHN THE DIVINE', 'ALL ARE WELCOME', 'OPEN DAILY'], 9, 18, 0);
    k.sign("POETS' CORNER", 3.4, 0.5, FX - NW / 2 - 9.7, 6.4, FZ - 29, '#2a2420', '#e8dcc0', 96, PI / 2, { border: true });
    /* THE TRICK: the nickname painted long on the floor inside the west door, so that from the door it stands upright */
    anamorph(k, 'ST. JOHN THE UNFINISHED', FX, FZ - 3, 3, 0, 4.5, 4.4, 1.1, '#e6d6b0', 72);
    k.egg(v(FX, 0.8, FZ - 5), { id: 'cath-floor-sign', title: 'A sign painted on the floor', text: 'The nickname at your feet is painted flat and stretched out along the floor, so that only from just inside the west door does it stand up and read. Move a step and it collapses into smears on the marble. The building it names has been called St. John the Unfinished since its cornerstone went down in 1892.', clue: 'Come in through the west door and read the floor.', source: WC }, { r: 2 });
    // the works: the side aisles under the arcades, the seven chapels, flanking the west door
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 7; i++) { const z = FZ - 10 - i * 10; mounts.push({ position: v(FX + s * (NW / 2 + 9.66), 3.8, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(FX + s * (NW / 2 + 4), 3, z), width: 4.6, height: 2.7, style: 'gilt', wash: true }); }
    for (let i = 0; i < 7; i++) { const a = PI + ((i + 0.5) / 7) * PI, ca = Math.cos(a), sa = Math.sin(a); const cx = FX + ca * (NW / 2 + 6), cz = CZ + sa * (NW / 2 + 6); mounts.push({ position: v(cx + ca * 3.9, 4.2, cz + sa * 3.9), rotation: Math.atan2(-ca, -sa), target: v(cx - ca * 2.6, 3, cz - sa * 2.6), width: 3.4, height: 2.0, style: 'gilt', wash: false }); }
    for (const s of [-1, 1]) mounts.push({ position: v(FX + s * 12, 4, FZ - 0.2), rotation: PI, target: v(FX + s * 12, 3, FZ - 6), width: 4.6, height: 2.7, style: 'gilt' });
    return { mounts, spawn: v(0, 3, 46), look: v(0, 24, FZ + 6), eye: 3, bounds: [-NW / 2 - 9, NW / 2 + 9, CZ - NW / 2 - 10.6, 52], style: 'gilt' };
  },
};

/* ---------------- 40 QUEENSBORO PLAZA ---------------- */
export const queensboro: RoomDef = {
  id: 'queensboro',
  name: 'The elevated',
  area: 'QUEENSBORO PLAZA',
  mood: 'Rush hour',
  color: '#a0a8d8',
  description: 'An elevated platform over the plaza, trains rolling through on two levels, Manhattan across the river, the census on the platform walls.',
  signatures: 'The double deck steel viaduct, curving tracks and platform canopies, the bridge and the skyline to the west, the glass towers of Long Island City, the traffic under the el.',
  build(k, ctx) {
    k.sky({ top: 0x2c4a86, horizon: 0xf0a878, ground: 0x2a2a32, fog: 0.0026, sun: { az: 4.7, el: 0.08, color: 0xffa868, size: 20 }, haze: 0.4, env: 0.85 });
    k.hemi(0xffd8c0, 0x2a2e3a, 0.7);
    k.sun(0xffb890, 1.8, -70, 22, 10, true, 90);
    /* THE BIG UPGRADE 2026-11-23 (wave 2d): scanned riveted steel in its old green paint (Poly Haven green_metal_rust,
       rusty_painted_metal), a worn concrete platform with the yellow tactile edge, corrugated canopies, real ballast; the
       viaduct's lattice girders and knee braces built; the blinding light strips under the canopy swapped for
       fluorescent fixtures (models); the wooden subway benches, the station clock, trash cans and turnstiles as models;
       the station signs with their line bullets; the census billboard pulled out of the building it was buried in; and
       the station's name painted on the plaza under the el so it hangs in the air from one spot (the trick). */
    const steel = skin(k, 'queensboro', 'steel', 2.2, { color: 0x9aa0a4, metalness: 0.35, roughness: 0.65 }),
      green = skin(k, 'queensboro', 'green', 2.0, { color: 0x8ab09a, metalness: 0.3, roughness: 0.6 }),
      conc = skin(k, 'queensboro', 'platform', 2.6, { color: 0xc4c0b8 }),
      canopy = skin(k, 'queensboro', 'canopy', 1.4, { color: 0xa4a8ac, metalness: 0.25, roughness: 0.65 }),
      yellow = skin(k, 'queensboro', 'tactile', 0.6, { color: 0xffd23a, roughness: 0.7 }),
      silver = k.pbr('carQ', X.steel(0x9aa5ab, false, 73), 0.35, { metalness: 0.9, roughness: 0.3 }),
      purple = k.flat(0x7a3a9a, 0.3, 0.5),
      glassDark = k.glass(0x1a2a33, 0.6, 0.1),
      glassT = k.pbr('licGlass', X.windows(74, 0.3, 0x6a88a0, false), 0.11, { emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.3, metalness: 0.5, stretch: 0.42 }),
      warm = k.glow(0xffe0b0);
    const PY = 9;
    // the plaza below: two wide avenues crossing under the structure
    street(k, { w: 30, len: 200, z: -20, x: 0 });
    const cross = k.mesh(new T.BoxGeometry(200, 0.3, 24), k.pbr('asphaltS', X.asphalt(0x24282d), 0.11), 0, -0.15, 0);
    void cross;
    blockFront(k, { x: -40, z0: 60, count: 8, face: 1, seed: 74, h: [14, 20] });
    for (const [x, z, w, h] of [[50, 60, 26, 90], [60, -40, 30, 120], [-60, -70, 24, 70]]) k.box(w as number, h as number, w as number, x as number, (h as number) / 2, z as number, glassT);
    for (const z of [30, -10, -50]) for (const s of [-1, 1]) k.lamp(s * 17, z, 7, k.flat(0x1f262b, 0.75, 0.45), 0xffd9a8, 30);
    // the viaduct: columns, girders, two levels of track, the platform between the tracks on the lower level
    const ballast = skin(k, 'queensboro', 'ballast', 1.4, { color: 0x8a867e });
    for (let z = 60; z > -100; z -= 12) for (const x of [-9, 9]) {
      k.box(1.0, PY - 1, 1.0, x, (PY - 1) / 2, z, green); k.box(1.6, 0.4, 1.6, x, 0.2, z, green); k.box(20, 1.2, 1.0, 0, PY - 1.4, z, green);
      /* built up column: flanges either side, a cap, and knee braces into the cross girder */
      for (const dz of [-0.55, 0.55]) k.box(1.2, PY - 1.6, 0.1, x, (PY - 1) / 2, z + dz, green);
      k.box(1.5, 0.3, 1.5, x, PY - 2.1, z, green);
      k.beam(v(x, PY - 4.2, z), v(x - Math.sign(x) * 2.6, PY - 2, z), 0.12, green, 5);
    }
    /* the lattice girders along both sides of the lower deck, bay by bay */
    for (const sx of [-11.1, 11.1]) {
      k.box(0.3, 0.3, 160, sx, PY - 0.5, -20, green); k.box(0.3, 0.3, 160, sx, PY - 2.4, -20, green);
      for (let z = 60; z > -100; z -= 2) k.beam(v(sx, PY - 2.4, z), v(sx, PY - 0.5, z - 2), 0.06, green, 4);
    }
    k.box(22, 0.8, 170, 0, PY - 0.8, -20, steel);
    for (const x of [-6.5, 6.5]) { k.box(3, 0.3, 170, x, PY - 0.25, -20, ballast); for (let z = 64; z > -104; z -= 0.75) k.box(2.5, 0.1, 0.22, x, PY - 0.06, z, k.flat(0x3a3028, 0, 0.95)); for (const dx of [-0.7, 0.7]) k.box(0.1, 0.16, 170, x + dx, PY + 0.04, -20, k.flat(0x8a8a90, 0.8, 0.4)); }
    k.box(6, 0.4, 150, 0, PY - 0.2, -20, conc);
    for (const s of [-1, 1]) { k.box(0.6, 0.03, 146, s * 2.68, PY + 0.015, -20, yellow); k.box(0.12, 0.42, 150, s * 3.0, PY - 0.2, -20, k.flat(0xd8d2c2, 0, 0.8)); }
    k.block(-30, -3.2, -96, 56);
    k.block(3.2, 30, -96, 56);
    const tubes: [number, number, number, number][] = [];
    /* the canopy sat at 3.4 m, level with the visitor's eye; it goes up to 4.6 so the signs and lights hang above it */
    const CY = PY + 4.6;
    for (let z = 50; z > -90; z -= 8) { k.box(0.3, CY - PY, 0.3, 0, (PY + CY) / 2, z, steel); k.box(6.4, 0.2, 2.4, 0, CY, z, canopy); for (const s of [-1, 1]) k.beam(v(0, CY - 0.8, z), v(s * 2.6, CY - 0.1, z), 0.06, steel, 4); if (z > -86) { tubes.push([0, CY - 0.12, z - 4, PI / 2]); k.point(0, CY - 0.5, z - 4, 0xeef4ff, 5, 9); } }
    void warm;
    glbs(k, 'queensboro/fluorescent', { width: 1.1 }, tubes);
    k.box(6.4, 0.2, 148, 0, CY + 0.1, -20, canopy);
    // the upper level: a second pair of tracks on taller columns, the N and W run above
    for (let z = 60; z > -100; z -= 12) for (const x of [-11, 11]) k.box(0.9, 8, 0.9, x, PY + 4, z, green);
    k.box(26, 0.8, 170, 0, PY + 8.2, -20, steel);
    for (const x of [-8, 8]) { k.box(3, 0.3, 170, x, PY + 8.75, -20, k.pbr('ballastQ', X.cobble(0x3a3a3a, 3), 0.9)); }
    k.box(12.8, 0.5, 150, 0, PY + 8.85, -20, conc);
    for (const s of [-1, 1]) k.box(0.3, 0.05, 146, s * 6.1, PY + 9.12, -20, yellow);
    for (let z = 50; z > -90; z -= 16) { k.box(0.3, 3.2, 0.3, 0, PY + 10.7, z, steel); }
    k.box(7, 0.2, 148, 0, PY + 12.4, -20, canopy);
    // stairs from the plaza to the platform at the south end
    for (let i = 0; i < 24; i++) k.box(2.4, 0.375, 0.9, 0, 0.19 + i * 0.375, 56 - i * 0.9, conc);
    for (const s of [-1, 1]) k.box(0.1, 1.1, 22, s * 1.25, PY / 2 + 0.6, 45.5, steel).rotation.x = Math.atan2(PY, 21.6);
    // trains: a 7 rolling through the lower level, an N above, both on loops
    /* The real station: two levels, one island platform on each, the 7 and the N and W side by side on both, the
       only cross platform transfer between A and B Division trains in the system. Upper level to Queens, lower to
       Manhattan. The upper level had no platform here, and both trains wore the 7's purple. */
    const yellow2 = k.flat(0xf1c531, 0.3, 0.5);
    const car = (m: T.Material, len: number, band: T.Material = purple) => { const g = new T.Group(); const body = new T.Mesh(new T.BoxGeometry(2.7, 3.4, len), m); body.position.y = 1.9; g.add(body); for (let i = -len / 2 + 2; i < len / 2; i += 3) { for (const s of [-1, 1]) { const w = new T.Mesh(new T.PlaneGeometry(1.8, 1.2), glassDark); w.position.set(s * 1.36, 2.4, i); w.rotation.y = s * PI / 2; g.add(w); } } const stripe = new T.Mesh(new T.BoxGeometry(2.72, 0.24, len), band); stripe.position.y = 3.3; g.add(stripe); return g; };
    const train7 = new T.Group();
    for (let c = 0; c < 4; c++) { const cc = car(silver, 14); cc.position.z = c * 15; train7.add(cc); }
    train7.position.set(-6.5, PY, -60);
    k.add(train7);
    const trainN = new T.Group();
    for (let c = 0; c < 3; c++) { const cc = car(silver, 14, yellow2); cc.position.z = c * 15; trainN.add(cc); }
    trainN.position.set(8, PY + 9, 40);
    k.add(trainN);
    /* 2026-10-28: each box car becomes the hero car (h_subway_car_lo, as in the subway room). The coloured band stays
       on top of it, purple for the 7 and yellow for the N, so the lines still read. A failed load keeps the boxes. */
    void hero(k, 'h_subway_car_lo', { box: [2.66, 3.6, 13.8] }).then((h) => {
      if (!h) return;
      let n = 0;
      for (const tr of [train7, trainN]) for (const cc of tr.children) {
        cc.children.forEach((m, j) => { if (j < cc.children.length - 1) m.visible = false; });
        const c = n++ ? h.clone() : h; c.position.y = 0.05; cc.add(c);
      }
    });
    if (!ctx.reduced) k.ticks.push((t) => { const p = (t * 9) % 260; train7.position.z = -150 + p; const q = (t * 6 + 60) % 260; trainN.position.z = 110 - q; });
    // the river and Manhattan to the west, the bridge, the tower with the crown far off
    k.water({ y: -1.5, color: 0x2e4a60, w: 400, d: 500, x: -220, z: -20, amp: 1.0 });
    k.skyline({ z: -20, count: 22, spacing: 7, scale: 3.4, base: -1.5, seed: 105, lit: 0.45, glow: 1.3, tint: 0x2a3244, x: -440 });
    for (const z of [-40, -150]) { for (const x of [-140, -128]) k.box(1.2, 44, 1.6, x, 20, z, steel); k.box(14, 1.2, 1.6, -134, 30, z, steel); }
    for (let z = 30; z > -200; z -= 4) { k.box(14, 0.5, 4, -134, 12, z, steel); k.beam(v(-140, 12, z), v(-128, 12, z - 4), 0.07, steel, 4); k.beam(v(-140, 12, z), v(-140, 14 + Math.abs(Math.sin(z * 0.03)) * 10, z), 0.1, steel, 5); }
    // the census as the big billboard on the building facing the platform
    /* the census billboard building: it was 24 wide along x and 10 deep, so the 19 m census wall at x 28.95 hung inside it.
       Turned, its face is at x 29 and the wall sits on it. Above it, a painted wall sign (Firefly plate, queued). */
    const lic = skin(k, 'queensboro', 'brick', 2.6, { color: 0xd8a088 });
    k.box(10, 30, 24, 34, 15, -30, lic);
    k.box(10.6, 0.8, 24.6, 34, 30.2, -30, k.flat(0x8a8278, 0, 0.8));
    fireflyPlate(k, 'assets/museum/tex/queensboro/ff_wall_sign.webp', 18, 6, 28.97, 23.2, -30, -PI / 2, lic);
    k.censusWall({ x: 28.95, y: PY + 6, z: -30, rotY: -PI / 2, cols: 22, rows: 5, tile: 0.8, gap: 0.06, start: ctx.wallStart(6900, 110), pieces: ctx.all, backing: k.flat(0x14161a, 0.5, 0.6) });
    k.sign('QUEENSBORO PLAZA  ·  7  N  W', 6.2, 0.7, 0, PY + 4.6 - 0.5, 54.3, '#0f1a1c', '#f9f8e9', 90, PI, { border: true, double: true });
    /* easter eggs */
    const WQ = { name: 'Queensboro Plaza station, Wikipedia', url: 'https://en.wikipedia.org/wiki/Queensboro_Plaza_station' };
    k.egg(v(0, PY + 2.2, 10), { id: 'qp-cross-platform', title: 'Across the platform', text: 'Queensboro Plaza is the only station in the whole system with cross platform transfers between A Division trains, the 7, and B Division trains, the N and W. Each level has one island platform: the 7 on one side, the Astoria trains on the other.', clue: 'Stand in the middle of the platform between the two tracks.', source: WQ }, { r: 1.6 });
    k.egg(v(0, PY + 7.2, -10), { id: 'qp-two-levels', title: 'Up to Queens, down to Manhattan', text: 'This is a two level station with four tracks and an island platform on each level. Trains heading into Queens stop on the upper level and trains heading for Manhattan on the lower. The only exits run through a mezzanine below the lower level.', clue: 'Look up through the canopy at the level above.', source: WQ }, { r: 1.6 });
    k.egg(v(10.5, PY + 0.8, -40), { id: 'qp-eight-tracks', title: 'Half a station', year: '1964', text: 'It was built as an eight track station, four tracks on each of two levels, 840 feet long in all. The northern half closed in the late 1940s when the track layout was greatly simplified, and the abandoned structure was torn down in 1964; only the original southern side remains.', clue: 'Look past the edge of the deck at the empty air beside the station.', source: WQ }, { r: 1.6 });
    k.egg(v(0, PY + 3.4, 49), { id: 'qp-opened', title: '1916 and 1917', year: '1916', text: 'The Flushing Line platforms opened on November 16, 1916, and the Astoria Line on February 1, 1917. The two lines east of here were shared by the IRT and BMT until 1949, with separate stopping marks and separate entrances, so riders could not transfer free.', clue: 'Read the station sign at the top of the stairs.', source: WQ }, { r: 1.6 });
    k.egg(v(-3, PY + 2.4, -70), { id: 'qp-bridge', title: 'Over the bridge', year: '1942', text: 'Astoria trains once skipped the tunnel and ran over the Queensboro Bridge to the Second Avenue elevated line in Manhattan, a service that lasted until 1942. Because the platforms were built to IRT size, the BMT ran its own elevated cars here and riders changed at Queensboro Plaza.', clue: 'Walk to the far end of the platform and look toward the bridge.', source: WQ }, { r: 1.6 });
    k.egg(v(-2.6, PY + 1.2, 26), { id: 'qp-apes', title: 'Underground, in the movies', text: 'In Beneath the Planet of the Apes the station appears as an underground ruin, though it is an elevated station with no tilework at all. It also turns up in an episode of Seinfeld as the site of a gyro stall.', clue: 'Look for the glint near the platform edge, where a lost astronaut might stand.', source: WQ }, { r: 1.6 });
    /* station furniture as models: the wooden benches, a trash can, the clock, the turnstiles at the stair foot */
    glbs(k, 'queensboro/pelham_bench', { width: 4.3 }, [[0, PY, -58, PI / 2], [0, PY, -74, PI / 2]]);
    for (const z of [-58, -74]) k.block(-0.4, 0.4, z - 2.2, z + 2.2);
    glbs(k, 'queensboro/metal_trash_can', { height: 0.95 }, [[0.9, PY, -61.4, PI / 2], [-0.9, PY, -70.6, -PI / 2]]);
    glbs(k, 'queensboro/pelham_clock', { height: 0.7 }, [[0, CY - 1.0, -50.2, 0]]);
    k.beam(v(0, CY - 0.1, -50.2), v(0, CY - 0.3, -50.2), 0.03, steel, 4);
    glbs(k, 'queensboro/turnstile', { height: 1.0 }, [[-2.4, 0, 57.5, 0], [-3.3, 0, 57.5, 0], [2.4, 0, 57.5, 0], [3.3, 0, 57.5, 0]]);
    for (const x of [-2.85, 2.85]) k.keepOut.push({ x, z: 57.5, r: 0.9 });
    /* the station signs: black bands with the name and the line bullets, hung from the canopy */
    const bullet = (x: number, y: number, z: number, rot: number, col: number, t: string) => { const c = k.mesh(new T.CircleGeometry(0.2, 24), k.flat(col, 0, 0.6), x, y, z, true); c.rotation.y = rot; k.sign(t, 0.36, 0.36, x + Math.sin(rot) * 0.01, y, z + Math.cos(rot) * 0.01, 'transparent', col === 0xfccc0a ? '#111111' : '#ffffff', 300, rot); };
    for (const z of [22, -10, -42, -66]) for (const r of [0, PI]) {
      const dz = r ? -0.05 : 0.05;
      k.sign('Queensboro Plaza', 3.0, 0.46, 0, CY - 0.75, z + dz, '#111111', '#ffffff', 112, r);
      [[0x9a38a8, '7'], [0xfccc0a, 'N'], [0xfccc0a, 'W']].forEach(([c, t], i) => bullet((r ? -1 : 1) * (1.8 + i * 0.46), CY - 0.75, z + dz * 1.4, r, c as number, t as string));
      k.box(6.0, 0.56, 0.06, 0, CY - 0.75, z, k.flat(0x111111, 0.3, 0.6));
      for (const sx of [-2.2, 2.2]) k.beam(v(sx, CY - 0.1, z), v(sx, CY - 0.47, z), 0.02, steel, 4);
    }
    for (const [z, t, r] of [[44, 'Manhattan bound  7  N  W', PI], [44, 'Exit to Queens Plaza', 0]] as const) k.sign(t, 4.4, 0.42, 0, CY - 0.6, z + (r ? -0.06 : 0.06), '#111111', '#ffffff', 80, r);
    k.box(4.6, 0.5, 0.08, 0, CY - 0.6, 44, k.flat(0x111111, 0.3, 0.6));
    /* THE TRICK, a Pepper's ghost: on the empty east track an old elevated car, drawn in cold light, shows only to
       someone standing square across from it on the platform; take a few steps either way and it is gone. The
       Astoria trains that once ran on from here over the bridge to the Second Avenue el used cars like it. */
    {
      const GZ = -74, ghostTex = canvasTex(1024, 270, (g) => {
        g.fillStyle = '#000'; g.fillRect(0, 0, 1024, 270);
        g.strokeStyle = '#9ec8ff'; g.fillStyle = 'rgba(120,170,255,0.16)'; g.lineWidth = 5;
        g.beginPath(); g.moveTo(40, 230); g.lineTo(40, 90); g.quadraticCurveTo(512, 20, 984, 90); g.lineTo(984, 230); g.closePath(); g.fill(); g.stroke();
        g.strokeRect(300, 46, 424, 26);
        for (let i = 0; i < 11; i++) { g.strokeRect(96 + i * 76, 110, 52, 62); }
        for (const x of [52, 920]) { g.strokeRect(x, 100, 52, 128); }
        g.lineWidth = 3; for (const x of [170, 300, 724, 854]) { g.beginPath(); g.arc(x, 246, 18, 0, PI * 2); g.stroke(); }
        g.beginPath(); g.moveTo(20, 236); g.lineTo(1004, 236); g.stroke();
      });
      const gm = new T.MeshBasicMaterial({ map: ghostTex, color: 0xffffff, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
      const ghost = k.mesh(new T.PlaneGeometry(15, 3.95), gm, 6.5, PY + 2.05, GZ, true);
      ghost.rotation.y = -PI / 2;
      const to = new T.Vector3();
      ghost.onBeforeRender = (_r, _s, cam) => { to.subVectors(ghost.position, cam.position); const d = to.length(); to.normalize(); const sq = Math.abs(to.x), near = Math.max(0, Math.min(1, (16 - d) / 6)); gm.opacity = 0.6 * near * Math.max(0, Math.min(1, (sq - 0.9) / 0.08)); };
      k.egg(v(1.6, PY + 1.6, GZ), { id: 'qp-ghost-el', title: 'The train that is not there', text: 'Stand square across from the empty east track and an old elevated car appears on it, drawn in cold light; walk a few steps along the platform and it is gone. It is a picture that only reads from one place, the stage trick called a Pepper\'s ghost. Until 1942 Astoria trains did not stop here: they ran on over the Queensboro Bridge to the Second Avenue el in Manhattan, on elevated cars of their own.', clue: 'Near the far end of the platform, stand still and face the empty track.', source: WQ }, { r: 2 });
    }
    k.prop('mailbox', -16, 0, 14, { height: 1.5, rotY: PI / 2 });
    k.prop('hydrant', 16, 0, -6, { height: 1.1 });
    // the works: on the canopy posts facing the platform, on the back walls of the canopy, under the el
    const mounts: Mount[] = [];
    for (let i = 0; i < 12; i++) { const z = 44 - i * 8; const s = i % 2 ? 1 : -1; k.box(0.2, 3, 4.2, s * 2.9, PY + 1.8, z - 4, steel); mounts.push({ position: v(s * 2.78, PY + 2.0, z - 4), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * -0.5, PY + 3, z - 4), width: 3.6, height: 2.1, style: 'steel', wash: false }); }
    for (let i = 0; i < 6; i++) { const z = 30 - i * 14; mounts.push({ position: v(0, PY + 2.9, z), rotation: 0, target: v(0, PY + 3, z + 5), width: 2.6, height: 1.5, style: 'steel', wash: false, lookAt: v(0, PY + 2.9, z) }); k.box(3, 1.9, 0.12, 0, PY + 2.9, z - 0.1, steel); }
    for (const x of [-14, 14]) for (const z of [20, -20]) { k.box(4.6, 4, 0.4, x, 2, z, steel); mounts.push({ position: v(x, 2.6, z + 0.22), rotation: 0, target: v(x, 3, z + 5), width: 4.2, height: 2.5, style: 'steel', wash: false }); }
    return { mounts, spawn: v(0, 3, 60), look: v(0, PY + 3, 0), eye: 3, bounds: [-18, 18, -92, 62], style: 'steel', floorY: (x, z) => { if (Math.abs(x) < 3.2 && z <= 56 && z > -96) return z > 34.4 ? Math.max(0, ((56 - z) / 21.6) * PY) : PY; return 0; } };
  },
};

/* ---------------- 41 A BUSHWICK ROOFTOP ---------------- */
export const bushwick: RoomDef = {
  id: 'bushwick',
  name: 'The roof',
  area: 'A BUSHWICK ROOFTOP',
  mood: 'The party at dusk',
  color: '#e8a04a',
  description: 'A tar roof above the murals, water towers and string lights, the neighbouring walls painted the size of buildings with the census.',
  signatures: 'The tar paper roof with bulkhead and water towers, the painted party walls of the surrounding lofts, string lights on posts, the el and the skyline at dusk, a projector on a bedsheet.',
  build(k, ctx) {
    k.sky({ top: 0x3a3f7e, horizon: 0xf2a070, ground: 0x2a2226, fog: 0.0028, sun: { az: 4.8, el: 0.05, color: 0xff9a55, size: 22 }, haze: 0.45, stars: 200, env: 0.8 });
    k.hemi(0xffc8b0, 0x2a2228, 0.7);
    k.sun(0xffa870, 1.6, -80, 16, 20, true, 90);
    /* THE BIG UPGRADE 2026-11-23 (wave 2d): the roof was drawn in brick; now scanned tarred gravel, two scanned bricks
       for the lofts, block parapets with a coping, weathered planks (Poly Haven, CC0); monobloc chairs, a sofa, milk crates
       of records, a speaker, a cooler and a film projector as models; HVAC, vents and a skylight built on the roof; the
       roof door's sign; string lights that read as bulbs, not blobs; a painted band of tags queued for Firefly; and
       BUSHWICK painted across the tar so that from where you arrive it stands up like a mural (the trick). */
    const tar = skin(k, 'bushwick', 'tar', 2.2, { color: 0x8c8882, roughness: 0.95 }),
      brick = skin(k, 'bushwick', 'brick', 2.4, { color: 0xd8b0a0 }),
      brick2 = skin(k, 'bushwick', 'brick2', 2.4, { color: 0xd0b8a8 }),
      parapet = skin(k, 'bushwick', 'parapet', 1.8, { color: 0xc4beb4 }),
      wood = skin(k, 'bushwick', 'wood', 1.3, { color: 0xc8aa8a }),
      iron = k.flat(0x1f242a, 0.75, 0.45),
      warm = k.glow(0xffc888),
      sheet = k.flat(0xf4f0e8, 0, 0.9, { side: T.DoubleSide });
    const RW = 30, RD = 44, RH = 14;
    // the roof itself on top of a loft building, the street twelve below
    /* the loft's brick box stopped exactly where the tar did, so the two fought and the roof read as brick */
    k.box(RW, RH - 0.4, RD, 0, (RH - 0.4) / 2 - RH, 0, brick);
    k.box(RW, 0.4, RD, 0, -0.2, 0, tar);
    for (const s of [-1, 1]) { k.box(0.6, 1.1, RD, s * (RW / 2 - 0.3), 0.55, 0, parapet); k.box(RW, 1.1, 0.6, 0, 0.55, s * (RD / 2 - 0.3), parapet); }
    k.box(6, 3.6, 5, -9, 1.8, -14, brick2);
    k.box(6.4, 0.3, 5.4, -9, 3.7, -14, parapet);
    k.box(1.4, 2.6, 0.3, -9, 1.3, -11.4, skin(k, 'bushwick', 'door', 1.4, { color: 0x7a828c, metalness: 0.4, roughness: 0.6 }));
    k.sign('EMERGENCY EXIT ONLY', 1.1, 0.26, -9, 2.1, -11.23, '#b0201c', '#ffffff', 84, 0);
    k.sign('ALARM WILL SOUND', 1.1, 0.2, -9, 1.82, -11.23, '#ffffff', '#b0201c', 90, 0);
    /* the parapet's coping, the roof's own clutter: a skylight, an HVAC unit, vent stacks, a drain */
    for (const sx of [-1, 1]) { k.box(0.8, 0.08, RD + 0.2, sx * (RW / 2 - 0.3), 1.14, 0, k.flat(0x9a968e, 0.4, 0.5)); k.box(RW + 0.2, 0.08, 0.8, 0, 1.14, sx * (RD / 2 - 0.3), k.flat(0x9a968e, 0.4, 0.5)); }
    k.box(3.2, 0.6, 2.2, 6, 0.3, -15.5, parapet);
    for (const sz of [-1, 1]) { const g = k.mesh(new T.BoxGeometry(3.2, 0.06, 1.3), k.glass(0xb8d0dc, 0.35, 0.1), 6, 0.95, -15.5 + sz * 0.55); g.rotation.x = sz * 0.5; }
    k.keepOut.push({ x: 6, z: -15.5, r: 2 });
    k.box(2.4, 1.6, 1.6, 12, 0.8, 4, k.flat(0x9aa0a4, 0.6, 0.45));
    k.box(2.2, 0.04, 1.4, 12, 1.62, 4, k.flat(0x2a2e32, 0.5, 0.6));
    k.cyl(0.5, 0.12, 12, 1.68, 4, k.flat(0x3a3e42, 0.7, 0.4), 0.5, 20);
    k.keepOut.push({ x: 12, z: 4, r: 1.6 });
    for (const [x, z, h] of [[-13, -20, 1.4], [-12.2, -20.4, 0.9], [13.5, 19, 1.8], [-4, 20, 1.1]]) { k.cyl(0.12, h, x, h / 2, z, k.flat(0x8a8e92, 0.8, 0.35), 0.12, 10); k.cyl(0.18, 0.12, x, h, z, k.flat(0x6a6e72, 0.8, 0.35), 0.18, 10); }
    k.block(-12.2, -5.8, -16.7, -11.3);
    k.prop('water_tower', 9, 0, -16, { height: 6.2, keepOut: 2.4 });
    k.prop('water_tower', -10, 0, 14, { height: 5.4, keepOut: 2.2 });
    k.prop('utility_pole', 13, -RH, 24, { height: 10 });
    /* the corner below: the Bushwick Collective's crossroads */
    k.sign('TROUTMAN ST', 2.4, 0.42, 13, -RH + 5.2, 24.3, '#1f6a3a', '#ffffff', 90, PI, { border: true });
    k.sign('ST NICHOLAS AV', 2.8, 0.42, 13.3, -RH + 5.7, 24, '#1f6a3a', '#ffffff', 90, PI / 2, { border: true });
    // string lights on posts, the folding chairs, the DJ table, the projector and the sheet
    for (const [x, z] of [[-12, -4], [12, -4], [-12, 10], [12, 10], [0, 18]]) { k.box(0.1, 3.4, 0.1, x, 1.7, z, iron); k.box(0.6, 0.6, 0.6, x, 0.3, z, parapet); }
    const bulbs: T.Mesh[] = [];
    for (const [a, b] of [[[-12, -4], [12, -4]], [[-12, 10], [12, 10]], [[-12, -4], [-12, 10]], [[12, -4], [12, 10]], [[-12, 10], [0, 18]], [[12, 10], [0, 18]]] as const) {
      for (let i = 0; i <= 12; i++) { const t = i / 12, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t, y = 3.3 - Math.sin(t * PI) * 0.5; bulbs.push(k.mesh(new T.SphereGeometry(0.045, 8, 6), warm, x, y - 0.08, z, true)); k.cyl(0.02, 0.08, x, y - 0.01, z, iron, 0.02, 6); }
      k.beam(v(a[0], 3.3, a[1]), v(b[0], 3.3, b[1]), 0.01, iron, 3);
    }
    for (const [x, z] of [[-6, 0], [6, 2], [0, 6], [-4, 12], [7, 12]]) k.point(x, 3, z, 0xffd8a0, 10, 9);
    if (!ctx.reduced) k.ticks.push((t) => bulbs.forEach((b, i) => { const s = 0.9 + 0.25 * Math.sin(t * 2.5 + i * 0.7); b.scale.setScalar(s); }));
    const rnd = X.mulberry(41);
    /* the chairs: white monobloc models, either side of the painted word so they do not stand on it */
    const chairs: [number, number, number, number][] = [];
    for (let i = 0; i < 12; i++) { const sd = i % 2 ? 1 : -1, x = sd * (3.8 + rnd() * 4.4), z = -2 + rnd() * 16, r = rnd() * PI * 2; chairs.push([x, 0, z, r]); k.keepOut.push({ x, z, r: 0.5 }); }
    glbs(k, 'bushwick/monobloc_chair', { height: 0.88 }, chairs);
    k.box(2.4, 0.9, 0.8, 0, 0.45, -6, wood);
    k.box(1.2, 0.1, 0.5, 0, 0.95, -6, k.flat(0x1a1a1c, 0.3, 0.5));
    k.keepOut.push({ x: 0, z: -6, r: 1.4 });
    glbs(k, 'bushwick/speaker', { width: 0.9 }, [[0.6, 0.9, -6.1, 0]]);
    glbs(k, 'bushwick/milkcrate', { height: 0.34 }, [[-1.7, 0, -6.2, 0.2], [-1.7, 0.34, -6.2, -0.1], [1.8, 0, -6.3, 0.4]]);
    glbs(k, 'bushwick/cooler', { height: 0.5 }, [[5.6, 0, 16.5, 0.3]]);
    glbs(k, 'bushwick/sofa', { width: 2.0 }, [[-6.5, 0, 17.4, 0]]);
    k.keepOut.push({ x: -6.5, z: 17.4, r: 1.3 }, { x: 5.6, z: 16.5, r: 0.5 });
    /* the projector on a stack of crates, pointed at the sheet */
    k.box(0.6, 1.4, 0.6, -2.6, 0.7, 15.6, wood);
    glbs(k, 'bushwick/projector', { height: 0.4 }, [[-2.6, 1.4, 15.6, PI]]);
    k.point(-2.6, 1.7, 16.2, 0xdff0ff, 6, 4);
    k.keepOut.push({ x: -2.6, z: 15.6, r: 0.6 });
    // the surrounding lofts: their party walls are the murals
    const walls: { x: number; z: number; rot: number; w: number; h: number }[] = [];
    for (const [x, z, w, h, rot] of [[-32, -6, 28, 26, PI / 2], [-32, 18, 22, 22, PI / 2], [30, -2, 30, 24, -PI / 2], [30, 20, 18, 20, -PI / 2], [0, -40, 34, 28, 0], [-24, -40, 14, 18, 0]] as const) {
      const b = k.box(rot === 0 ? w : 14, h + RH, rot === 0 ? 14 : w, x, (h + RH) / 2 - RH, z, walls.length % 2 ? brick : brick2);
      void b;
      walls.push({ x: x + (rot === PI / 2 ? 7.05 : rot === -PI / 2 ? -7.05 : 0), z: z + (rot === 0 ? 7.05 : 0), rot, w, h });
    }
    blockFront(k, { x: -RW / 2 - 40, z0: 40, count: 8, face: 1, seed: 80, h: [14, 22] });
    /* a band of tags under the east mural (Firefly plate, queued); invisible until the file lands */
    fireflyPlate(k, 'assets/museum/tex/bushwick/ff_tags.webp', 26, 2.8, 22.93, 1.6, -2, -PI / 2, brick);
    /* THE TRICK: BUSHWICK painted long across the tar, foreshortened so that from the spawn it stands up like a mural */
    anamorph(k, 'BUSHWICK', 0, 12, 3, 0, 7, 5, 1.5, '#ff5a8a', 200);
    /* easter eggs */
    const WB = { name: 'Bushwick, Brooklyn, Wikipedia', url: 'https://en.wikipedia.org/wiki/Bushwick,_Brooklyn' };
    k.egg(v(-9, 3.0, -11.2), { id: 'bw-boswijck', title: 'The neighbourhood in the woods', year: '1661', text: 'Peter Stuyvesant chartered the town in 1661 and named it Boswijck, neighbourhood in the woods in seventeenth century Dutch. The land had been deeded by the Lenape in 1638.', clue: 'Look over the steel door of the stair bulkhead.', source: WB }, { r: 1.6 });
    k.egg(v(9, 6.6, -16), { id: 'bw-brewers-row', title: 'Fourteen breweries in fourteen blocks', year: '1890', text: 'By 1890 Bushwick had 14 breweries in a 14 block stretch called Brewer\'s Row, and was known as the beer capital of the Northeast. Brewery owners built mansions along Bushwick and Irving Avenues. The last of them, Schaefer and Rheingold, closed in 1976.', clue: 'Climb your eyes up the water tower and think of beer.', source: WB }, { r: 1.6 });
    k.egg(v(9, 1.4, RD / 2 - 0.8), { id: 'bw-el', title: 'Brooklyn\'s first el', year: '1885', text: 'Brooklyn\'s first elevated line, the Lexington Avenue el, opened in 1885, and by the end of 1889 the Broadway and Myrtle Avenue els were complete. Today the J and Z run on the Jamaica Line over Broadway, the M on the Myrtle Avenue Line, and the L on the Canarsie Line.', clue: 'Lean on the parapet and watch the train on the el.', source: WB }, { r: 1.6 });
    k.egg(v(-9, 1.4, RD / 2 - 0.8), { id: 'bw-blackout', title: 'The night of July 13, 1977', year: '1977', text: 'In the citywide blackout of July 13, 1977, Bushwick suffered some of the worst damage and losses in the city. The Broadway shopping district under the el was heavily looted and burned, and afterwards its business vacancy rate reached 43 percent.', clue: 'Look down from the parapet toward Broadway and the el.', source: WB }, { r: 1.6 });
    k.egg(v(-24, 6, -6), { id: 'bw-collective', title: 'The Bushwick Collective', year: '2012', text: 'Joseph Ficalora, a Bushwick native, founded the Bushwick Collective in 2012 out of a mural painting jam, at the intersection of Troutman Street and St. Nicholas Avenue. His father\'s murder in 1991 marked him deeply. The collective now holds an annual block party of hip hop and graffiti that draws thousands.', clue: 'Face the biggest painted wall to the west.', source: { name: 'Bushwick Collective, Art in Context', url: 'https://artincontext.org/bushwick-collective/' } }, { r: 1.6 });
    k.egg(v(23.5, 6, -2), { id: 'bw-ten-muralists', title: 'A DJ and ten muralists', text: 'The collective\'s first party had a DJ and ten muralists. Within five years the walls around it had carried work by Nychos, D*Face, Logan Hicks, Joe Iurato, Li-Hill, Don Rimx, Daze, Dasic, COST and many more, block after block.', clue: 'Turn to the painted wall to the east.', source: { name: 'The Bushwick Collective Turns 5, Brooklyn Street Art', url: 'https://www.brooklynstreetart.com/2016/06/11/the-bushwick-collective-turns-5/' } }, { r: 1.6 });
    k.egg(v(0, 0.6, 3), { id: 'bw-painted-word', title: 'A word on the roof', text: 'The word in front of you is painted flat on the tar and stretched some seven metres long, so that only from the top of the stairs, where you arrived, does it stand up like a mural on a wall. It is the trick the 3D street painters bring to the Collective\'s block parties; walk onto it and it falls flat.', clue: 'Walk out onto the pink letters.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 2 });
    // the el a block away, a train crossing it now and then
    for (let x = -80; x <= 80; x += 12) { k.box(0.9, 8, 0.9, x, -RH + 4, 60, iron); }
    k.box(170, 0.8, 8, 0, -RH + 8.4, 60, k.pbr('elSteel', X.steel(0x3a4048, true, 70), 0.6, { metalness: 0.75, roughness: 0.45 }));
    const tr = new T.Group();
    for (let c = 0; c < 5; c++) { const m = new T.Mesh(new T.BoxGeometry(14, 3.2, 2.7), k.pbr('carQ', X.steel(0x9aa5ab, false, 73), 0.35, { metalness: 0.9, roughness: 0.3 })); m.position.x = c * 15; tr.add(m); for (let i = -5; i < 6; i += 3) { const w = new T.Mesh(new T.PlaneGeometry(1.8, 1.1), warm); w.position.set(c * 15 + i, 0.3, -1.36); w.rotation.y = PI; tr.add(w); } }
    tr.position.set(-100, -RH + 10.4, 60);
    k.add(tr);
    if (!ctx.reduced) k.ticks.push((t) => { tr.position.x = -140 + ((t * 8) % 280); });
    k.skyline({ z: -220, count: 30, spacing: 8, scale: 2.6, base: -RH, seed: 106, lit: 0.4, glow: 1.2, tint: 0x2a3244 });
    k.skyline({ z: 150, count: 24, spacing: 9, scale: 1.4, base: -RH, seed: 107, lit: 0.3, glow: 0.8, tint: 0x4a4048, rows: 1 });
    // the projector sheet carries the census tonight
    k.beam(v(-4, 0, RD / 2 - 1), v(-4, 4.4, RD / 2 - 1), 0.04, iron, 6);
    k.beam(v(4, 0, RD / 2 - 1), v(4, 4.4, RD / 2 - 1), 0.04, iron, 6);
    k.mesh(new T.PlaneGeometry(8, 4.6), sheet, 0, 2.2, RD / 2 - 1.02);
    k.censusWall({ x: 0, y: 2.2, z: RD / 2 - 1.08, rotY: PI, cols: 12, rows: 3, tile: 0.6, gap: 0.05, start: ctx.wallStart(7300, 36), pieces: ctx.all });
    // the works: the murals on the party walls, the bulkhead, screens on the parapet
    const mounts: Mount[] = [];
    /* 2026-11-23: every viewing spot now lies on the roof. The far mural's sat off the roof's edge, the bulkhead's two
       side works faced into the bulkhead, and the parapet screens' spots stood inside a water tower or the bulkhead;
       all were only reachable because the museum moved the visitor for them at runtime. */
    const onRoof = (x: number) => Math.max(-RW / 2 + 2, Math.min(RW / 2 - 2, x));
    for (const w of walls) { mounts.push({ position: v(w.x, RH * 0 + w.h / 2 - 2, w.z), rotation: w.rot, target: v(onRoof(w.rot === PI / 2 ? w.x + 12 : w.rot === -PI / 2 ? w.x - 12 : w.x), 3, w.rot === 0 ? w.z + 14 : w.z), width: w.w * 0.62, height: w.h * 0.55, style: 'none', wash: false }); }
    for (const [x, rot] of [[-12.05, -PI / 2], [-5.95, PI / 2]] as const) mounts.push({ position: v(x, 2.0, -14), rotation: rot, target: v(rot < 0 ? -13.6 : x + 4, 3, -14), width: 3.6, height: 2.1, style: 'black', wash: false });
    mounts.push({ position: v(-9, 2.0, -16.55), rotation: PI, target: v(-9, 3, -20), width: 3.6, height: 2.1, style: 'black', wash: false });
    for (let i = 0; i < 4; i++) { const z = -16 + i * 10; k.box(0.3, 3.2, 3.6, RW / 2 - 0.65, 2.2, z, iron); mounts.push({ position: v(RW / 2 - 0.82, 2.4, z), rotation: -PI / 2, target: v(RW / 2 - (z === -16 ? 2.4 : 5), 3, z), width: 3.2, height: 1.9, style: 'black', wash: false }); }
    for (let i = 0; i < 4; i++) { const z = -16 + i * 10; k.box(0.3, 3.2, 3.6, -RW / 2 + 0.65, 2.2, z, iron); mounts.push({ position: v(-RW / 2 + 0.82, 2.4, z), rotation: PI / 2, target: v(-RW / 2 + (z === -16 || z === 14 ? 2.4 : 5), 3, z), width: 3.2, height: 1.9, style: 'black', wash: false }); }
    return { mounts, spawn: v(0, 3, 12), look: v(-10, 8, -30), eye: 3, bounds: [-RW / 2 + 0.8, RW / 2 - 0.8, -RD / 2 + 0.8, RD / 2 - 1.6], style: 'black' };
  },
};
