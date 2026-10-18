import * as T from 'three';
import { pbr, tex } from '../core/assets';
import { box, sign, v3, seeded, type Rect } from '../core/kit';
import { contour, drips, addThreshold } from '../core/mlow';
import { clickables } from '../core/hang';
import { ORIGINS, type Ctx, type Room } from '../core/room';
import type { Piece } from '../core/assets';

// 5 ELDRIDGE: THE WALK-UP. A tenement stair that only goes up. Two flights a floor around an open well; climb one
// floor and you are moved down one floor without a seam (the geometry repeats every 3 m), so it never ends. The
// paintings on the landings advance as you climb, so the stair is a gallery you climb through: 64 New Yorkers, six a
// floor. Every floor is the fifth floor. A Penrose stair is impossible as one object; online it is a translation.
// Local: landing x -2.2 .. 0, flight A up along z < 0 to the half landing x 4 .. 5.4, flight B back along z > 0.

const FH = 3, HALF = 1.5, RUN = 4;

export function buildWalkup(ctx: Ctx): Room {
  const O = ORIGINS.walkup, g = new T.Group(); g.position.copy(O); ctx.scene.add(g);
  const rnd = seeded(41), at = (x: number, y: number, z: number) => O.clone().add(v3(x, y, z));
  const pieces = ctx.m.art.walkup;
  let climbed = 0;

  const plaster = contour(pbr('plaster', 2, { color: 0x2b3350 }), { coverage: 1, density: 16, glow: 0.85, ground: 0.8, scale: 0.26 });
  const wains = pbr('planks', 0.8, { color: 0x3a2618, roughness: 0.6 });
  const marble = pbr('marble', 0.9, { color: 0xd8d4cc, roughness: 0.3 });
  const tile = pbr('terrazzo', 0.6, { color: 0x9c958a });
  const iron = new T.MeshStandardMaterial({ color: 0x0e0f12, metalness: 0.8, roughness: 0.4 });
  const doorM = pbr('planks', 0.6, { color: 0x2a1a12, roughness: 0.45 });
  const brass = new T.MeshStandardMaterial({ color: 0xc9a050, metalness: 1, roughness: 0.25 });
  const K = [-3, -2, -1, 0, 1, 2, 3];

  // walls, the full height of the shaft: plaster painted with the field, a wainscot, the end walls
  const top = K[K.length - 1] * FH + FH + 1, bot = K[0] * FH - 1, H = top - bot, yc = (top + bot) / 2;
  box(g, 7.8, H, 0.12, 1.6, yc, -1.56, plaster); box(g, 7.8, H, 0.12, 1.6, yc, 1.56, plaster);
  box(g, 0.12, H, 3.0, -2.26, yc, 0, plaster); box(g, 0.12, H, 3.0, 5.46, yc, 0, plaster);

  // steps across every copy: one instanced mesh for treads, one for risers, one for the balusters
  const tread: T.Matrix4[] = [], riser: T.Matrix4[] = [], bal: T.Matrix4[] = [], m = new T.Matrix4(), q = new T.Quaternion();
  const N = 9, rise = HALF / N, run = RUN / N;
  for (const k of K) {
    const y0 = k * FH;
    for (let i = 0; i < N; i++) {
      // flight A: x 0 .. 4 up, z -1.5 .. -0.32
      m.compose(v3(i * run + run / 2, y0 + (i + 1) * rise - 0.02, -1.0), q, v3(run + 0.02, 0.04, 1.0)); tread.push(m.clone());
      m.compose(v3(i * run, y0 + (i + 0.5) * rise, -1.0), q, v3(0.02, rise, 1.0)); riser.push(m.clone());
      // flight B: x 4 .. 0 up, z 0.32 .. 1.5
      m.compose(v3(RUN - (i * run + run / 2), y0 + HALF + (i + 1) * rise - 0.02, 1.0), q, v3(run + 0.02, 0.04, 1.0)); tread.push(m.clone());
      m.compose(v3(RUN - i * run, y0 + HALF + (i + 0.5) * rise, 1.0), q, v3(0.02, rise, 1.0)); riser.push(m.clone());
      for (const [x, y, z] of [[i * run + run / 2, y0 + (i + 1) * rise, -0.52], [RUN - (i * run + run / 2), y0 + HALF + (i + 1) * rise, 0.52]]) {
        m.compose(v3(x, y + 0.45, z), q, v3(0.022, 0.9, 0.022)); bal.push(m.clone());
      }
    }
    // landings and soffits
    box(g, 2.2, 0.16, 3.0, -1.1, y0 - 0.08, 0, tile, false);
    box(g, 1.4, 0.16, 3.0, 4.7, y0 + HALF - 0.08, 0, tile, false);
    // the soffit under each flight (so looking up the well shows stairs, not floating steps)
    const sa = box(g, 4.3, 0.12, 1.0, 2, y0 + HALF / 2 - 0.12, -1.0, plaster, false); sa.rotation.z = Math.atan2(HALF, RUN);
    const sb = box(g, 4.3, 0.12, 1.0, 2, y0 + HALF + HALF / 2 - 0.12, 1.0, plaster, false); sb.rotation.z = -Math.atan2(HALF, RUN);
    // handrails: a sloped bar each flight
    const ra = box(g, 4.35, 0.05, 0.06, 2, y0 + HALF / 2 + 0.92, -0.52, wains, false); ra.rotation.z = Math.atan2(HALF, RUN);
    const rb = box(g, 4.35, 0.05, 0.06, 2, y0 + HALF + HALF / 2 + 0.92, 0.52, wains, false); rb.rotation.z = -Math.atan2(HALF, RUN);
    // a newel post and the well rail at the half landing
    box(g, 0.08, 1.0, 0.08, 4.0, y0 + HALF + 0.5, -0.52, wains); box(g, 0.08, 1.0, 0.08, 4.0, y0 + HALF + 0.5, 0.52, wains);
    // wainscot strips along the flights
    const wa = box(g, 4.4, 0.9, 0.03, 2, y0 + HALF / 2 + 0.45, -1.49, wains, false); wa.rotation.z = Math.atan2(HALF, RUN);
    const wb = box(g, 4.4, 0.9, 0.03, 2, y0 + HALF + HALF / 2 + 0.45, 1.49, wains, false); wb.rotation.z = -Math.atan2(HALF, RUN);
    // apartment doors 5A and 5B on the landing, the roof door on the half landing
    for (const [z, n] of [[-0.72, '5A'], [0.72, '5B']] as const) {
      box(g, 0.08, 2.25, 0.98, -2.18, y0 + 1.13, z, doorM);
      box(g, 0.12, 0.1, 1.15, -2.17, y0 + 2.32, z, wains, false);
      sign(g, [n], 0.2, 0.12, v3(-2.12, y0 + 1.75, z), Math.PI / 2, { bg: '#c9a050', ink: '#1a1208' });
      const knob = new T.Mesh(new T.SphereGeometry(0.035, 12, 8), brass); knob.position.set(-2.11, y0 + 1.0, z + (z < 0 ? 0.36 : -0.36)); g.add(knob);
    }
    box(g, 0.08, 2.2, 1.0, 5.4, y0 + HALF + 1.1, 0, doorM);
    sign(g, ['ROOF', 'ALARM WILL NOT SOUND'], 0.7, 0.3, v3(5.35, y0 + HALF + 2.45, 0), -Math.PI / 2, { bg: '#c8102e', ink: '#fff', glow: 1.2 });
    // FLOOR 5, stencilled, every floor
    sign(g, ['5'], 1.2, 1.4, v3(-1.1, y0 + 1.6, 1.49), Math.PI, { ink: '#f0f4f8', font: 'Archivo' });
    sign(g, ['FLOOR 5'], 1.0, 0.24, v3(4.7, y0 + HALF + 1.3, -1.49), 0, { ink: '#ffd84a', font: 'Plex, monospace' });
    // the bare bulb on its cord, every landing
    const bulb = new T.Mesh(new T.SphereGeometry(0.06, 14, 10), new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffd9a0, emissiveIntensity: 6 }));
    bulb.position.set(-1.1, y0 + 2.55, 0); g.add(bulb);
    box(g, 0.01, 0.4, 0.01, -1.1, y0 + 2.8, 0, iron, false);
    drips(g, v3(-1.9, y0 + 2.9, -1.47), v3(-0.3, y0 + 2.9, -1.47), 10, 50 + k, 1.2);
    drips(g, v3(4.2, y0 + HALF + 2.9, 1.47), v3(5.2, y0 + HALF + 2.9, 1.47), 8, 70 + k, 1.6);
  }
  const instM = (list: T.Matrix4[], mat: T.Material) => { const im = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), mat, list.length); list.forEach((x, i) => im.setMatrixAt(i, x)); im.castShadow = true; im.receiveShadow = true; g.add(im); };
  instM(tread, marble); instM(riser, marble); instM(bal, iron);

  // the hang: six frames a floor on every copy; textures are reassigned as you climb
  type Slot = { mat: T.MeshBasicMaterial; k: number; i: number; mesh: T.Mesh; art: Piece | null };
  const slots: Slot[] = [];
  const frameM = new T.MeshStandardMaterial({ color: 0x0d0f14, metalness: 0.4, roughness: 0.45 });
  const SLOT_POS: [number, number, number, number][] = [ // x, y above the floor copy, z, rotY
    [-1.1, 1.62, -1.48, 0], [1.25, 0.47 + 1.55, -1.48, 0], [3.0, 1.13 + 1.55, -1.48, 0],
    [3.0, HALF + 0.38 + 1.55, 1.48, Math.PI], [1.25, HALF + 1.03 + 1.55, 1.48, Math.PI], [4.7, HALF + 1.5, 1.48, Math.PI],
  ];
  for (const k of K) SLOT_POS.forEach(([x, y, z, r], i) => {
    const grp = new T.Group(); grp.position.set(x, k * FH + y, z); grp.rotation.y = r; g.add(grp);
    const w = 1.05, h = w / 1.776;
    const f = new T.Mesh(new T.BoxGeometry(w + 0.1, h + 0.1, 0.05), frameM); f.position.z = 0.025; grp.add(f);
    const mat = new T.MeshBasicMaterial({ toneMapped: false, color: 0xffffff });
    const mesh = new T.Mesh(new T.PlaneGeometry(w, h), mat); mesh.position.z = 0.055; grp.add(mesh);
    const slot: Slot = { mat, k, i, mesh, art: null };
    slots.push(slot);
    const c = { mesh, piece: pieces[0], view: () => {
      const look = mesh.getWorldPosition(new T.Vector3());
      const atv = new T.Vector3(0, 0, 1.5).applyMatrix4(mesh.matrixWorld); atv.y = look.y - 0.1;
      return { at: atv, look };
    } };
    clickables.push(c);
    (slot as Slot & { c: typeof c }).c = c;
  });
  function rehang() {
    for (const s of slots) {
      const n = (((climbed + s.k) * 6 + s.i) % pieces.length + pieces.length) % pieces.length;
      const p = pieces[n];
      if (s.art === p) continue;
      s.art = p; s.mat.map = tex(p.f); s.mat.needsUpdate = true;
      (s as Slot & { c: { piece: Piece } }).c.piece = p;
    }
  }
  rehang();

  // light: the bulb you are under, and the shaft's own glow
  const l1 = new T.PointLight(0xffd9a0, 9, 8, 1.6); l1.position.set(-1.1, 2.4, 0); g.add(l1);
  const l2 = new T.PointLight(0xffd9a0, 7, 7, 1.6); l2.position.set(4.6, HALF + 2.2, 0); g.add(l2);
  const l3 = new T.PointLight(0x6f8cff, 6, 10, 1.4); l3.position.set(2, FH + 1.5, 0); g.add(l3);
  g.add(new T.HemisphereLight(0x5c6fb0, 0x2a1d14, 0.45));
  addThreshold(at(-2.2, 1.2, -0.72), 2.2); addThreshold(at(-2.2, 1.2, 0.72), 2.2); addThreshold(at(5.4, HALF + 1.2, 0), 2.6);
  addThreshold(at(2, 0, 0), 6);

  const LINES = ['Floor 5.', 'Still the fifth floor.', 'You have climbed {n} floors. This is the fifth.', 'The super says it is the fifth.', 'Floor 5. Again.', 'Every floor is the fifth floor.'];
  const walk: Rect[] = [[-2.6, -1.5, 0.05, 1.5], [-0.05, -1.5, RUN + 0.05, -0.48], [-0.05, 0.48, RUN + 0.05, 1.5], [RUN - 0.05, -1.5, 5.4, 1.5], [4.4, -0.55, 5.75, 0.55]];
  const h = (lx: number, lz: number) => lx <= 0 ? 0 : lx >= RUN ? HALF : lz < 0 ? (lx / RUN) * HALF : HALF + ((RUN - lx) / RUN) * HALF;
  void rnd;
  return {
    id: 'walkup', name: '5 Eldridge, the walk-up', line: 'Every floor is the fifth floor. The paintings change as you climb.',
    origin: O, group: g,
    spawn: { at: at(-1.3, 1.65, 0.7), look: at(4, 2.5, -1) },
    views: [
      { name: 'Up the well', note: 'Look up. It keeps going. So do the paintings.', at: at(0.45, 1.65, 0), look: at(2.6, 26, 0) },
      { name: 'Down the well', note: 'And down. Nobody has found the lobby.', at: at(0.45, 1.65, 0), look: at(2.6, -24, 0) },
      { name: 'The half landing', note: 'The roof door. The alarm will not sound.', at: at(4.4, HALF + 1.65, -0.9), look: at(5.4, HALF + 1.4, 0) },
      { name: 'Apartment 5A', note: 'A 900 square foot studio. Spacious from one angle.', at: at(-1.0, 1.65, -0.7), look: at(-2.2, 1.3, -0.72) },
    ],
    doors: { street: { pos: at(-2.13, 0, 0.72), rotY: Math.PI / 2 }, studio: { pos: at(-2.13, 0, -0.72), rotY: Math.PI / 2 },
      roof: { pos: at(5.35, HALF, 0), rotY: -Math.PI / 2 }, cam: { pos: at(-2.0, 1.7, 0), rotY: Math.PI / 2 } },
    walk, block: [[0.05, -0.45, RUN - 0.05, 0.45]],
    bg: new T.Color(0x05070f), fog: new T.FogExp2(0x070b1c, 0.075), exposure: 0.95,
    floorY(x, z, eyeY) {
      const lx = x - O.x, lz = z - O.z, feet = eyeY - O.y - 1.65, hh = h(lx, lz);
      return O.y + Math.round((feet - hh) / FH) * FH + hh;
    },
    carry(cam) {
      const feet = cam.position.y - O.y - 1.65;
      let dir = 0;
      if (feet >= FH - 0.01) dir = 1; else if (feet < -0.35) dir = -1;
      if (!dir) return;
      cam.position.y -= dir * FH; climbed += dir; rehang();
      if (dir > 0) return LINES[((climbed % LINES.length) + LINES.length) % LINES.length].replace('{n}', String(Math.abs(climbed)));
      return 'Down one floor. It is the fifth.';
    },
    hud: () => `FLOOR 5 . ${climbed >= 0 ? 'climbed' : 'descended'} ${Math.abs(climbed)} ${Math.abs(climbed) === 1 ? 'floor' : 'floors'}`,
    tick() {},
  };
}
