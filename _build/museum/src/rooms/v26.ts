/* 183: THE HONORARIES. Room 28 (g.ts) is the early sketch of the same place; this is its full build. Stanford White's Hall of Fame for Great Americans at University Heights in
   the Bronx (dedicated May 30, 1901), and the Gould Memorial Library it wraps, rebuilt as the house of
   every honorary New Yorker MLow has painted. Not census pieces: the honoraries hang from their own
   atlases (honor_atlas.py writes assets/museum/honor/), one frame per portrait, and a tap on one opens
   the honoree's card (main.ts openHonor) instead of a census record.

   Frame: the rotunda is at the origin. -x is west (the passage, then the middle of the colonnade and the
   Harlem River beyond it), +x east, -z north, +z south.
     The rotunda: sixteen freestanding green Connemara marble columns, a sixteen sided drum hung in
       oxblood damask, two galleries with iron railings and glass floors, a coffered saucer dome to 22.3 m
       with the Tiffany laylight in its eye. The drum carries the salon hang in three tiers: 3 by 3 under
       the first gallery, 3 by 4 under each of the others. Bay 2, which the visitor arrives facing, starts with MLow.
     The passage: a Guastavino vaulted hall from the rotunda door west to the colonnade, where the
       census hangs in the museum's ordinary mounts (Bronx pieces first, by the room's place hang).
     The colonnade: limestone columns, a granite parapet and a Guastavino vault, curving round the
       rotunda, open to the west. Each bay holds two portraits on the back wall, a large one at eye level
       over a Tiffany style bronze tablet with the names, a smaller one above. It is as long as the
       honoraries need: 630 feet, the real length, for today's count.
   The thing to do: the roll call. Stand on the bronze laurel in the middle of the rotunda and the dome
   calls a name: a beam comes down through the laylight onto one portrait and the card says who it is.
   Real New York time: the sun crosses the colonnade from the west in the afternoon, the laylight
   dims at dusk, the picture lights and the lanterns carry the night.
   The cutout visitors other rooms use are left out on Astra's call: painted figures broke the photoreal stone.
   Materials are Patina PBR sets on FLORA (colour, normal, roughness), the river view and the laylight
   are Nano Banana Pro, capitals, lamps and the laurel pedestal are Tripo H3.1. Art direction and the
   critique of every shot by GPT-6 Astra. Nobody's likeness is modelled: the portraits are the paintings. */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as X from '../textures';
import { v, type Mount, type FrameStyle } from '../kit';
import type { RoomDef } from './types';
import { HONOR_N, HONOR_PER, HONOR_COLS, HONOR_CAT_NAMES } from '../honor';
const PI = Math.PI, TAU = PI * 2;
type K = Parameters<RoomDef['build']>[0];
type C = Parameters<RoomDef['build']>[1];
const UP = new T.Vector3(0, 1, 0);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const smooth = (t: number) => { t = clamp01(t); return t * t * (3 - 2 * t); };
type Museum = { camera?: T.Camera; kit?: unknown; openHonor?: (e: unknown) => void };
const museum = (): Museum | undefined => (typeof window === 'undefined' ? undefined : (window as unknown as { __museum?: Museum }).__museum);
const HAS_DOM = typeof window !== 'undefined' && typeof document !== 'undefined';
const PH = 'assets/museum/photos/honoraries/';
const HON = 'assets/museum/honor/';

/* ---------------- dimensions ---------------- */
const NB = 16, R = 15, DA = TAU / NB;            // drum: 16 facets, apothem 15 m
const COL_R = 10.8, GAL = [5.0, 10.4], GAL_IN = 13.5;
const CORNICE = 15.2, DOME_R = 11, DOME_TOP = 22.3, OCULUS = 3.5;
const EYE = 1.9;
const PASS_W = 2.2;                              // passage half width
const C_PITCH = 2.3, C_DEPTH = 4.4, C_SPRING = 3.7; // colonnade bay pitch at the back wall, walk width, vault springing
const bayAng = (b: number) => PI + b * DA;       // facet b faces the centre from direction bayAng; b 0 is the west door
const dir = (a: number) => v(Math.cos(a), 0, Math.sin(a));

/* the rotunda tiers, in a facet's own frame: u along the wall, y up. w is the painting's width */
const TIERS = [
  { cols: 3, rows: 3, w: 1.25, y0: 1.55, dy: 1.07, cls: 0 },
  { cols: 3, rows: 4, w: 1.12, y0: 6.45, dy: 0.96, cls: 1 },
  { cols: 3, rows: 4, w: 1.12, y0: 11.75, dy: 0.95, cls: 1 },
];
const U_PITCH = [1.6, 1.52, 1.52];
/* the visitor arrives in the south east of the rotunda looking north west, at bay 2, where MLow hangs.
   (Arriving from the door put the kit's house banner in the middle of the passage.) */
const HERO = 2;
type Slot = { p: T.Vector3; ry: number; w: number; cls: number; bay: number; tier: number; lit?: boolean };

/* ---------------- the hang plan: every slot in hang order ---------------- */
function plan(n: number) {
  const rot: Slot[] = [];
  for (let s = 0; s < NB; s++) {
    const b = (HERO + s) % NB, a = bayAng(b), nrm = dir(a).negate(), tan = v(-Math.sin(a), 0, Math.cos(a));
    const ry = Math.atan2(nrm.x, nrm.z);
    TIERS.forEach((t, ti) => {
      if (b === 0 && ti === 0) return;           // the door
      for (let r = t.rows - 1; r >= 0; r--) for (let c = 0; c < t.cols; c++) {
        const u = (c - (t.cols - 1) / 2) * U_PITCH[ti], y = t.y0 + r * t.dy;
        const p = dir(a).multiplyScalar(R - 0.02).addScaledVector(tan, u).setY(y);
        rot.push({ p, ry, w: t.w, cls: t.cls, bay: b, tier: ti, lit: ti === 0 && r === t.rows - 1 });
      }
    });
  }
  /* slot 0 is the hero: the middle of the first tier on the bay the visitor arrives facing */
  const hc = dir(bayAng(HERO)).multiplyScalar(R - 0.02);
  const hero = rot.findIndex((s) => s.bay === HERO && s.tier === 0 && Math.abs(s.p.y - (TIERS[0].y0 + TIERS[0].dy)) < 0.01 && Math.hypot(s.p.x - hc.x, s.p.z - hc.z) < 0.01);
  if (hero > 0) rot.unshift(rot.splice(hero, 1)[0]);
  const rem = Math.max(0, n - rot.length), bays = Math.max(24, Math.ceil(rem / 2) + (Math.ceil(rem / 2) % 2));
  /* the colonnade grows with the honoraries: keep its arc under 224 degrees by pushing it out */
  const span = 3.9, gapW = 6.0;
  const rIn = Math.max(46, (bays * C_PITCH + gapW) / span);
  const dPhi = C_PITCH / rIn, gap = gapW / rIn, half = bays / 2;
  const col: Slot[] = [], bayPhi: number[] = [];
  for (let j = 0; j < half; j++) for (const side of [1, -1]) bayPhi.push(PI + side * (gap / 2 + (j + 0.5) * dPhi));
  /* order: outward from the passage, alternating sides, lower then upper */
  for (const phi of bayPhi) {
    const nrm = dir(phi), ry = Math.atan2(nrm.x, nrm.z);
    const base = dir(phi).multiplyScalar(rIn + 0.02);
    col.push({ p: base.clone().setY(1.78), ry, w: 1.5, cls: 2, bay: -1, tier: 3, lit: true });
    col.push({ p: base.clone().setY(3.12), ry, w: 1.04, cls: 3, bay: -1, tier: 4 });
  }
  const phiMin = PI - (gap / 2 + half * dPhi), phiMax = PI + (gap / 2 + half * dPhi);
  return { slots: rot.concat(col).slice(0, Math.max(n, 0)), rotN: rot.length, bayPhi, rIn, dPhi, gap, phiMin, phiMax, bays };
}

/* ---------------- materials from the FLORA Patina sets ---------------- */
function texLoad(k: K, url: string, srgb: boolean, on: (t: T.Texture) => void) {
  if (!HAS_DOM) return;
  k.used.images.add(url);
  k.pending.push(new Promise<void>((res) => new T.TextureLoader().load(url, (t) => {
    t.colorSpace = srgb ? T.SRGBColorSpace : T.NoColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8;
    on(t); res();
  }, undefined, () => res())));
}
/* name: the set in photos/honoraries (name_c, name_n, name_r .webp). tile: metres per repeat for the
   kit's world projection; 0 when the geometry carries its own UVs */
function pmat(k: K, name: string, tile: number, p: Partial<T.MeshStandardMaterialParameters> & { normal?: number; maps?: 'cnr' | 'cn' | 'c'; rep?: [number, number] } = {}) {
  const { normal = 1, maps = 'cnr', rep, ...rest } = p;
  const on = (t: T.Texture) => { if (rep) t.repeat.set(rep[0], rep[1]); };
  const m = new T.MeshStandardMaterial({ roughness: 1, metalness: 0, normalScale: new T.Vector2(normal, normal), ...rest });
  if (tile) m.userData.density = 1 / tile;
  texLoad(k, PH + name + '_c.webp', true, (t) => { on(t); m.map = t; m.needsUpdate = true; });
  if (maps.includes('n')) texLoad(k, PH + name + '_n.webp', false, (t) => { on(t); m.normalMap = t; m.needsUpdate = true; });
  if (maps.includes('r')) texLoad(k, PH + name + '_r.webp', false, (t) => { on(t); m.roughnessMap = t; m.needsUpdate = true; });
  return m;
}
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  if (!HAS_DOM) return new T.Texture();
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

/* ---------------- geometry helpers ---------------- */
function flip(g: T.BufferGeometry) {
  const idx = g.index;
  if (idx) for (let i = 0; i < idx.count; i += 3) { const a = idx.getX(i + 1); idx.setX(i + 1, idx.getX(i + 2)); idx.setX(i + 2, a); }
  const n = g.attributes.normal;
  if (n) for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i));
  return g;
}
/* a curved wall face between angles a0 and a1 (x = r cos a, z = r sin a), facing the centre when inward */
function arcWall(r: number, y0: number, y1: number, a0: number, a1: number, seg: number, inward: boolean) {
  const g = new T.CylinderGeometry(r, r, y1 - y0, seg, 1, true, PI / 2 - a1, a1 - a0);
  g.translate(0, (y0 + y1) / 2, 0);
  return inward ? flip(g) : g;
}
/* a flat ring sector facing up (or down) */
function arcRing(r0: number, r1: number, y: number, a0: number, a1: number, seg: number, down = false) {
  const g = new T.RingGeometry(r0, r1, seg, 1, -a1, a1 - a0);
  g.rotateX(-PI / 2);
  g.translate(0, y, 0);
  return down ? flip(g) : g;
}
/* a closed curved slab: parapets, entablatures, gallery fascias */
function arcSlab(r0: number, r1: number, y0: number, y1: number, a0: number, a1: number, seg: number) {
  const parts = [arcWall(r1, y0, y1, a0, a1, seg, false), arcWall(r0, y0, y1, a0, a1, seg, true), arcRing(r0, r1, y1, a0, a1, seg), arcRing(r0, r1, y0, a0, a1, seg, true)];
  for (const a of [a0, a1]) {
    const e = new T.PlaneGeometry(r1 - r0, y1 - y0); e.rotateY(-a + (a === a0 ? PI / 2 : -PI / 2));
    const c = dir(a).multiplyScalar((r0 + r1) / 2); e.translate(c.x, (y0 + y1) / 2, c.z); parts.push(e);
  }
  const m = mergeGeometries(parts.map((g) => g.toNonIndexed()));
  parts.forEach((g) => g.dispose());
  return m;
}
/* a picture frame as one swept profile: [offset out from the sight edge, height off the wall], both
   scaled. Corners mitre themselves because every loop is a rectangle. UVs run along the moulding */
function frameGeo(w: number, h: number, prof: [number, number][]) {
  const pos: number[] = [], uv: number[] = [];
  const loops = prof.map(([o, z]) => [[-w / 2 - o, -h / 2 - o, z], [w / 2 + o, -h / 2 - o, z], [w / 2 + o, h / 2 + o, z], [-w / 2 - o, h / 2 + o, z]]);
  let vAcc = 0;
  for (let i = 0; i < loops.length - 1; i++) {
    const A = loops[i], B = loops[i + 1], dv = Math.hypot(prof[i + 1][0] - prof[i][0], prof[i + 1][1] - prof[i][1]) / 0.05;
    for (let s = 0; s < 4; s++) {
      const a0 = A[s], a1 = A[(s + 1) % 4], b0 = B[s], b1 = B[(s + 1) % 4];
      const L = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]) / 0.3;
      pos.push(...a0, ...a1, ...b1, ...a0, ...b1, ...b0);
      uv.push(0, vAcc, L, vAcc, L, vAcc + dv, 0, vAcc, L, vAcc + dv, 0, vAcc + dv);
    }
    vAcc += dv;
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}
/* four profiles (Astra: real bevels, a stepped rabbet, a projecting lip), as [offset, height] in metres */
const PROF: [number, number][][] = [
  /* 0 rotunda first tier: a broad gilt cassetta with a bead and a torus */
  [[-0.004, 0.034], [0.006, 0.05], [0.016, 0.056], [0.024, 0.048], [0.034, 0.062], [0.05, 0.072], [0.075, 0.078], [0.1, 0.07], [0.118, 0.058], [0.13, 0.04], [0.13, 0.0]],
  /* 1 the upper tiers: narrower, flatter, reads from the floor */
  [[-0.004, 0.032], [0.008, 0.05], [0.02, 0.054], [0.04, 0.066], [0.066, 0.06], [0.085, 0.045], [0.09, 0.0]],
  /* 2 the colonnade's eye level works: a deep gilt ogee */
  [[-0.004, 0.036], [0.008, 0.055], [0.02, 0.06], [0.03, 0.052], [0.045, 0.07], [0.07, 0.09], [0.1, 0.098], [0.13, 0.088], [0.15, 0.068], [0.16, 0.045], [0.16, 0.0]],
  /* 3 the colonnade's upper works: dark walnut with a gilt sight edge (the slip is its first step) */
  [[-0.004, 0.032], [0.01, 0.046], [0.018, 0.046], [0.03, 0.06], [0.06, 0.066], [0.075, 0.05], [0.08, 0.0]],
];
const LIP = [0.13, 0.09, 0.16, 0.08];
const ART_Z = 0.03, STANDOFF = 0.022;

/* the sun over New York in this frame: rises east (+x), stands south (+z) at noon, sets west (-x) */
function sunDir(h: number) {
  const s = (h - 6.6) / 11.4;
  if (s <= 0 || s >= 1) return { d: v(0.3, 0.85, 0.4).normalize(), day: 0 };
  const el = Math.sin(PI * s) * 0.7 + 0.05, a = PI * s;
  return { d: v(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el) * 0.8).normalize(), day: smooth(Math.sin(PI * s) * 4) };
}
function propMany(k: K, name: string, at: { x: number; y: number; z: number; ry?: number; s?: number }[], height: number, onReady?: (ims: T.InstancedMesh[]) => void) {
  void Promise.resolve(k.prop(name, 0, -500, 0, { height })).then((o: T.Object3D | null) => {
    if (!o || !(o as T.Object3D).isObject3D) return;
    o.updateMatrixWorld(true);
    const lift = new T.Matrix4().makeTranslation(0, 500, 0), ims: T.InstancedMesh[] = [];
    const parts: { g: T.BufferGeometry; m: T.Material; local: T.Matrix4 }[] = [];
    o.traverse((c) => { if (c instanceof T.Mesh) parts.push({ g: c.geometry, m: c.material as T.Material, local: c.matrixWorld.clone().premultiply(lift) }); });
    k.scene.remove(o); k.dynamic.delete(o);
    for (const p of parts) ims.push(k.instances(p.g, p.m, at.map((a) => new T.Matrix4().compose(v(a.x, a.y, a.z), new T.Quaternion().setFromAxisAngle(UP, a.ry ?? 0), v(a.s ?? 1, a.s ?? 1, a.s ?? 1)).multiply(p.local))));
    onReady?.(ims);
  });
}

type HonorRow = { id: string; n: string; h: string; t: string; c: string; l: string; ar: number; b?: string };

/* ================================================================== */
/* ---------------- 183 THE HONORARIES ---------------- */
export const honoraries: RoomDef = {
  id: 'honoraries',
  name: 'The honoraries',
  area: 'HALL OF FAME FOR GREAT AMERICANS, UNIVERSITY HEIGHTS / THE BRONX',
  mood: 'Green marble, gold frames and every face MLow has honoured',
  color: '#b59655',
  daylit: true,
  description: 'Stanford White\'s Hall of Fame for Great Americans, the 630 foot colonnade on the heights over the Harlem River, and the Gould Memorial Library it wraps, rebuilt as the house of every honorary New Yorker MLow has painted. Under the coffered dome and its Tiffany laylight, sixteen green Connemara marble columns ring a drum hung floor to ceiling with portraits in three tiers. A vaulted passage of census works leads west to the colonnade, where each bay holds two more over a bronze tablet with the names, and the river and the Palisades lie beyond the parapet. Stand on the bronze laurel in the middle of the rotunda and the dome calls a name.',
  signatures: 'Sixteen freestanding green Connemara marble columns with gilt Corinthian capitals, the sixteen sided drum in oxblood damask with a salon hang in three tiers, two galleries with iron railings and glass floors, the coffered saucer dome with gilt rosettes, the round Tiffany laylight in its eye, reading tables with green glass lamps, the bronze laurel in the floor that calls the roll, the Guastavino vaulted passage, the curving colonnade of limestone columns with a granite parapet and herringbone tile vault, Tiffany style bronze tablets under every bay, brass picture lights, the laurel pedestal at the end of the walk, the Harlem River, Inwood Hill and the Palisades to the west.',
  build(k, ctx) {
    const P = plan(HONOR_N);
    const { slots, rIn, bayPhi, dPhi, gap, phiMin, phiMax } = P;
    const rCol = rIn + C_DEPTH, rOut = rCol + 0.75;
    const hour0 = typeof k.o.hour === 'number' && Number.isFinite(k.o.hour) ? k.o.hour : 16;
    const sun0 = sunDir(hour0);

    /* ---- sky, sun, the shared light ---- */
    k.sky({ top: 0x6f9ccf, horizon: 0xf2dcc4, ground: 0x5f6650, fog: 0.0011, sun: { az: 1.9, el: 0.35, color: 0xffe6c8, size: 8 }, haze: 0.35, env: 0.45 });
    k.hemi(0xc6d9ea, 0x77705f, 0.55);
    const sunL = k.sun(0xfff0d5, 2.3 * (0.2 + 0.8 * sun0.day), sun0.d.x * 120, sun0.d.y * 120, sun0.d.z * 120, true, 34);
    /* the shadow camera follows the visitor instead of covering 120 m of colonnade at one resolution */
    let sunD = sun0.d;
    const placeSun = () => {
      const c = museum()?.camera?.position || v(-12, 0, 0);
      const fx = Math.round(c.x / 4) * 4, fz = Math.round(c.z / 4) * 4;
      sunL.target?.position?.set(fx, 0, fz);   /* the audit's stub kit hands back lights without targets */
      sunL.position?.set(fx + sunD.x * 120, sunD.y * 120, fz + sunD.z * 120);
      sunL.target?.updateMatrixWorld?.();
    };
    placeSun();
    if (!ctx.reduced) { let acc = 10; k.ticks.push((t, dt) => { acc += dt; if (acc < 0.4) return; acc = 0; const s = sunDir((hour0 + t / 3600) % 24); sunD = s.d; sunL.intensity = 2.3 * (0.2 + 0.8 * s.day) * (1 - 0.6 * k.night); placeSun(); }); }

    /* ---- materials ---- */
    const marble = pmat(k, 'connemara', 1.6, { roughness: 0.6, normal: 0.25 });
    const floorM = pmat(k, 'floor', 2.4, { roughness: 0.7, normal: 0.3, color: 0xcdc7bb });
    const damask = pmat(k, 'damask', 0.9, { roughness: 0.9, normal: 0.6 });
    const plaster = pmat(k, 'plaster', 3.0, { roughness: 0.92, normal: 0.25 });
    const plasterUV = pmat(k, 'plaster', 0, { roughness: 0.92, normal: 0.25 });
    const lime = pmat(k, 'limestone', 2.0, { roughness: 1, normal: 0.6 });
    const ashlar = pmat(k, 'ashlar', 3.0, { roughness: 1, normal: 0.6, color: 0xd6cdbd });
    const guast = pmat(k, 'guastavino', 0, { roughness: 1, normal: 0.5 });
    const granite = pmat(k, 'granite', 0.7, { roughness: 0.7, normal: 0.5, color: 0xc4c0bc });
    const roof = pmat(k, 'rooftile', 1.2, { roughness: 0.8, normal: 0.7 });
    const bronze = pmat(k, 'bronze', 0.6, { roughness: 0.5, metalness: 0.75, normal: 0.5 });
    const giltUV = pmat(k, 'gilt', 0, { roughness: 0.52, metalness: 0.85, normal: 0.5, color: 0xd8b878, side: T.DoubleSide });
    const gilt = pmat(k, 'gilt', 0.3, { roughness: 0.4, metalness: 0.9, normal: 0.4, color: 0xd8b878 });
    const pavers = pmat(k, 'pavers', 2.0, { roughness: 0.8, normal: 0.6 });
    const walnut = pmat(k, 'walnut', 1.2, { roughness: 0.5, normal: 0.3 });
    const walnutUV = pmat(k, 'walnut', 0, { roughness: 0.5, normal: 0.3, side: T.DoubleSide });
    const iron = k.flat(0x30332f, 0.35, 0.55);
    const blackMarble = k.flat(0x1b1c1e, 0.1, 0.22);
    const glassFloor = k.glass(0xb6c6bb, 0.28, 0.2);

    /* ---- collision: the plan rasterised into blocks ---- */
    const angIn = (x: number, z: number) => { let a = Math.atan2(z, x); if (a < 0) a += TAU; return a >= phiMin && a <= phiMax; };
    const walkable = (x: number, z: number) => {
      const r = Math.hypot(x, z);
      return r < GAL_IN - 0.15
        || (Math.abs(z) < PASS_W - 0.35 && x < -12 && x > -rIn - 0.6)
        || (r > rIn + 0.45 && r < rCol - 0.5 && angIn(x, z));
    };
    const BOUNDS: [number, number, number, number] = [-rOut - 1, Math.max(16, -rOut * Math.cos(phiMax - PI) + 2), -rOut - 1, rOut + 1];
    {
      const G = 0.4, [x0, x1, z0, z1] = BOUNDS;
      for (let z = z0; z < z1; z += G) {
        let run: number | null = null;
        for (let x = x0; x <= x1 + 1e-6; x += G) {
          const solid = x <= x1 - 1e-6 && !walkable(x + G / 2, z + G / 2);
          if (solid && run === null) run = x;
          if (!solid && run !== null) { k.block(run, x, z, Math.min(z + G, z1)); run = null; }
        }
      }
    }

    /* ================= THE ROTUNDA ================= */
    /* floor: Carrara slabs, a black and a green ring, the laurel in the middle */
    k.mesh(new T.CircleGeometry(R + 0.4, 64).rotateX(-PI / 2), floorM);
    for (const [r0, r1, m] of [[9.2, 9.5, blackMarble], [9.5, 10.1, marble], [10.1, 10.25, blackMarble], [2.6, 2.75, blackMarble], [1.45, 1.55, blackMarble]] as [number, number, T.Material][]) k.mesh(arcRing(r0, r1, 0.004, 0, TAU, 96), m);
    const laurelT = canvasTex(1024, 1024, (g) => {
      const c = 512; g.fillStyle = '#2a1d12'; g.beginPath(); g.arc(c, c, 510, 0, TAU); g.fill();
      const ring = (r: number, col: string, lw: number) => { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.arc(c, c, r, 0, TAU); g.stroke(); };
      ring(492, '#b48a4e', 18); ring(300, '#b48a4e', 10);
      for (let i = 0; i < 64; i++) {
        const a = (i / 64) * TAU, rr = 400, side = i % 2 ? 1 : -1;
        g.save(); g.translate(c + Math.cos(a) * rr, c + Math.sin(a) * rr); g.rotate(a + side * 0.5);
        const gr = g.createLinearGradient(-40, 0, 40, 0); gr.addColorStop(0, '#6f5130'); gr.addColorStop(0.5, '#e0bd7c'); gr.addColorStop(1, '#6f5130');
        g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, 54, 17, 0, 0, TAU); g.fill(); g.restore();
      }
      g.fillStyle = '#c9a160'; g.font = '700 74px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('HONORARY', c, c - 52); g.fillText('NEW YORKERS', c, c + 46);
      g.font = '500 30px Georgia, serif'; g.fillStyle = '#a8865a'; g.fillText('STAND HERE AND THE DOME CALLS A NAME', c, c + 150);
    });
    const laurel = new T.Mesh(new T.CircleGeometry(1.45, 64).rotateX(-PI / 2), new T.MeshStandardMaterial({ map: laurelT, metalness: 0.75, roughness: 0.4 }));
    laurel.position.y = 0.006; k.add(laurel);

    /* the drum: 16 damask facets, walnut wainscot, ivory pilasters at the corners */
    const facetW = 2 * R * Math.tan(PI / NB);
    for (let b = 0; b < NB; b++) {
      const a = bayAng(b), c = dir(a), ry = Math.atan2(-c.x, -c.z);
      const put = (w: number, h: number, d: number, u: number, y: number, rr: number, m: T.Material) => {
        const p = c.clone().multiplyScalar(rr).addScaledVector(v(-Math.sin(a), 0, Math.cos(a)), u);
        const o = k.box(w, h, d, p.x, y, p.z, m); o.rotation.y = ry; return o;
      };
      if (b === 0) {
        /* the west door: 4 m opening, a limestone architrave and a pediment over it */
        const side = (facetW - 4.2) / 2;
        for (const s of [-1, 1]) put(side, CORNICE, 0.3, s * (2.1 + side / 2), CORNICE / 2, R + 0.15, damask);
        put(4.2, CORNICE - 5.2, 0.3, 0, 5.2 + (CORNICE - 5.2) / 2, R + 0.15, damask);
        for (const s of [-1, 1]) put(0.42, 5.4, 0.4, s * 2.22, 2.7, R - 0.05, lime);
        put(4.9, 0.5, 0.45, 0, 5.45, R - 0.05, lime);
        put(5.3, 0.18, 0.6, 0, 5.78, R - 0.12, lime);
      } else {
        put(facetW, CORNICE, 0.3, 0, CORNICE / 2, R + 0.15, damask);
        put(facetW, 0.86, 0.06, 0, 0.43, R - 0.02, walnut);           // wainscot
        put(facetW, 0.07, 0.12, 0, 0.88, R - 0.04, gilt);               // its gilt rail
      }
      /* the pilaster at the facet's corner (between b and b+1) */
      const ac = a + DA / 2, cc = dir(ac).multiplyScalar(R / Math.cos(PI / NB) - 0.1), pry = Math.atan2(-cc.x, -cc.z);
      const pil = k.box(0.85, CORNICE, 0.4, cc.x, CORNICE / 2, cc.z, plaster); pil.rotation.y = pry;
      for (const y of [0.25, CORNICE - 0.35]) { const cap = k.box(1.05, y < 1 ? 0.5 : 0.7, 0.55, cc.x, y, cc.z, plaster); cap.rotation.y = pry; }
      for (const y of GAL) { const cap = k.box(1.0, 0.35, 0.5, cc.x, y + 0.3, cc.z, plaster); cap.rotation.y = pry; }
    }
    /* the frieze and cornice at the top of the drum, then the ring ceiling over the galleries */
    k.mesh(arcWall(R - 0.05, CORNICE, CORNICE + 0.8, 0, TAU, 64, true), plaster);
    k.mesh(arcSlab(R - 0.5, R + 0.1, CORNICE + 0.8, CORNICE + 1.05, 0, TAU, 64), plaster);
    k.mesh(arcRing(DOME_R, R + 0.2, CORNICE + 1.05, 0, TAU, 64, true), plaster);
    const friezeT = canvasTex(4096, 128, (g) => {
      g.fillStyle = '#e7dcc6'; g.fillRect(0, 0, 4096, 128);
      g.fillStyle = '#8a6a3a'; g.font = '600 64px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const line = 'THE CITY KEEPS ITS OWN  ·  ONE ARTIST, EVERY FACE ON THESE WALLS  ·  HONORARY NEW YORKERS BY MLOW  ·  ';
      g.fillText(line, 2048, 68, 4000);
      g.fillStyle = '#b8955a'; g.fillRect(0, 6, 4096, 4); g.fillRect(0, 118, 4096, 4);
    });
    friezeT.wrapS = T.RepeatWrapping; friezeT.repeat.set(-2, 1);   /* negative: an inward facing cylinder reads its texture mirrored */
    const frieze = new T.Mesh(arcWall(R - 0.12, CORNICE + 0.12, CORNICE + 0.72, 0, TAU, 96, true), new T.MeshStandardMaterial({ map: friezeT, roughness: 0.8 }));
    k.add(frieze);

    /* the galleries: an iron frame and a glass floor at 5.0 and 10.1, a railing on the inner edge */
    for (const y of GAL) {
      k.mesh(arcSlab(GAL_IN, R - 0.1, y - 0.42, y - 0.02, 0, TAU, 96), iron);
      const gl = new T.Mesh(arcRing(GAL_IN + 0.1, R - 0.2, y + 0.01, 0, TAU, 96), glassFloor); k.add(gl); gl.renderOrder = 3;
      k.mesh(arcSlab(GAL_IN - 0.06, GAL_IN + 0.06, y + 1.02, y + 1.1, 0, TAU, 128), bronze);
      k.mesh(arcSlab(GAL_IN - 0.03, GAL_IN + 0.03, y + 0.06, y + 0.14, 0, TAU, 128), iron);
    }
    {
      /* the railing: four cast iron panels (Tripo) on each facet of each gallery */
      const rails: { x: number; y: number; z: number; ry: number }[] = [];
      const chord = 2 * GAL_IN * Math.tan(PI / NB);
      for (const y of GAL) for (let b = 0; b < NB; b++) {
        const a = bayAng(b), c = dir(a).multiplyScalar(GAL_IN), tan = v(-Math.sin(a), 0, Math.cos(a));
        for (let i = 0; i < 4; i++) { const p = c.clone().addScaledVector(tan, (i - 1.5) * (chord / 4)); rails.push({ x: p.x, y: y + 0.02, z: p.z, ry: -a }); }
      }
      propMany(k, 'hf_railing', rails, 1.02, (ims) => ims.forEach((m) => { m.castShadow = false; }));
    }
    /* sixteen Connemara columns, a gilt Corinthian capital on each (Tripo), an entablature ring over them */
    const colH = CORNICE - 1.35;
    const capsAt: { x: number; y: number; z: number; ry: number }[] = [];
    for (let i = 0; i < NB; i++) {
      const a = bayAng(i) + DA / 2, p = dir(a).multiplyScalar(COL_R);
      k.box(1.25, 0.32, 1.25, p.x, 0.16, p.z, lime);
      k.lathe([[0.62, 0], [0.6, 0.08], [0.55, 0.14], [0.58, 0.2], [0.52, 0.3]], p.x, 0.32, p.z, lime, 28);
      k.lathe([[0.52, 0], [0.53, colH * 0.33], [0.5, colH * 0.7], [0.45, colH - 0.62]], p.x, 0.62, p.z, marble, 32);
      k.lathe([[0.5, 0], [0.5, 0.06], [0.46, 0.12]], p.x, colH, p.z, gilt, 28);
      capsAt.push({ x: p.x, y: colH + 0.1, z: p.z, ry: a });
      k.keepOut.push({ x: p.x, z: p.z, r: 0.85 });
    }
    k.mesh(arcSlab(COL_R - 0.7, COL_R + 0.7, CORNICE - 0.15, CORNICE + 1.05, 0, TAU, 96), plaster);
    k.mesh(arcSlab(COL_R - 0.82, COL_R + 0.82, CORNICE + 0.95, CORNICE + 1.2, 0, TAU, 96), plaster);
    /* the capital: a lathe bell straight away, the Tripo model over it when it lands */
    const bells: T.Mesh[] = [];
    for (const c of capsAt) bells.push(k.lathe([[0.45, 0], [0.5, 0.4], [0.62, 0.9], [0.8, 1.15], [0.8, 1.25]], c.x, c.y, c.z, gilt, 20));
    propMany(k, 'hf_capital', capsAt.map((c) => ({ ...c, y: c.y - 0.02 })), 1.3);

    /* the dome: a saucer shell, coffers from ribs, gilt rosettes, the Tiffany laylight in the eye */
    {
      const Rs = (DOME_R * DOME_R + (DOME_TOP - CORNICE - 1.2) ** 2) / (2 * (DOME_TOP - CORNICE - 1.2)), cy = DOME_TOP - Rs;
      const t0 = Math.asin(OCULUS / Rs), t1 = Math.asin(DOME_R / Rs);
      const shell = flip(new T.SphereGeometry(Rs, 72, 18, 0, TAU, t0, t1 - t0)); shell.translate(0, cy, 0);
      k.mesh(shell, plaster);
      const RINGS = 6, MER = 28;
      const at = (th: number, ph: number, inset: number) => { const r = Rs - inset; return v(Math.sin(th) * Math.cos(ph) * r, cy + Math.cos(th) * r, Math.sin(th) * Math.sin(ph) * r); };
      const ribs: T.BufferGeometry[] = [];
      for (let i = 0; i <= RINGS; i++) {
        const th = t0 + ((t1 - t0) * i) / RINGS, p = at(th, 0, 0.12);
        const tor = new T.TorusGeometry(Math.hypot(p.x, p.z), 0.11 + 0.04 * (i / RINGS), 6, 96); tor.rotateX(PI / 2); tor.translate(0, p.y, 0); ribs.push(tor);
      }
      for (let j = 0; j < MER; j++) {
        const ph = (j / MER) * TAU, pts: T.Vector3[] = [];
        for (let s = 0; s <= 12; s++) pts.push(at(t0 + ((t1 - t0) * s) / 12, ph, 0.12));
        ribs.push(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 12, 0.12, 5));
      }
      const rib = mergeGeometries(ribs.map((g) => g.toNonIndexed())); ribs.forEach((g) => g.dispose());
      k.mesh(rib, plasterUV);
      const ros: T.Matrix4[] = [];
      for (let i = 0; i < RINGS; i++) for (let j = 0; j < MER; j++) {
        const th = t0 + ((t1 - t0) * (i + 0.5)) / RINGS, ph = ((j + 0.5) / MER) * TAU, p = at(th, ph, 0.06), s = 0.55 + 0.55 * (i / RINGS);
        const nrm = p.clone().sub(v(0, cy, 0)).normalize();
        ros.push(new T.Matrix4().compose(p, new T.Quaternion().setFromUnitVectors(v(0, 1, 0), nrm.negate()), v(s, s * 0.45, s)));
      }
      k.instances(new T.SphereGeometry(0.16, 10, 6), gilt, ros);
      /* the laylight: unlit, its brightness follows the sky */
      const sky = (1 - k.night) * (1 - 0.45 * k.dusk);
      const tm = new T.MeshBasicMaterial({ color: new T.Color(0.25, 0.27, 0.3).lerp(new T.Color(1.15, 1.1, 0.98), sky), toneMapped: false, side: T.DoubleSide });
      texLoad(k, PH + 'tiffany.webp', true, (t) => { t.wrapS = t.wrapT = T.ClampToEdgeWrapping; tm.map = t; tm.needsUpdate = true; });
      const disc = new T.Mesh(new T.CircleGeometry(OCULUS + 0.05, 64).rotateX(PI / 2), tm); disc.position.y = DOME_TOP - 0.02; k.add(disc);
      const ringO = new T.Mesh(new T.TorusGeometry(OCULUS + 0.05, 0.16, 8, 72).rotateX(PI / 2), bronze); ringO.position.y = DOME_TOP - 0.1; k.add(ringO);
      /* a faint shaft from the eye by day */
      if (sky > 0.3) {
        const shaftT = canvasTex(64, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,240,205,0.9)'); gr.addColorStop(1, 'rgba(255,240,205,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); });
        const shaft = new T.Mesh(new T.CylinderGeometry(OCULUS * 0.95, OCULUS * 1.6, DOME_TOP - 0.3, 48, 1, true), new T.MeshBasicMaterial({ map: shaftT, transparent: true, opacity: 0.07 * sky, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
        shaft.position.y = (DOME_TOP - 0.3) / 2; shaft.renderOrder = 4; k.add(shaft);
      }
      k.point(0, DOME_TOP - 2.5, 0, 0xe5ecdf, (46 + 10 * k.dusk) * sky + 4, 26, 1.3);
    }
    /* gallery and floor light: warm, and stronger after dark */
    for (let i = 0; i < 3; i++) { const p = dir((i / 3) * TAU + 0.5).multiplyScalar(9); k.point(p.x, 7.4, p.z, 0xffd39d, 18 + 50 * Math.max(k.night, k.dusk * 0.6), 17, 1.4); }

    /* reading tables with green glass lamps, between the door and the laurel and beyond it */
    const lampsAt: { x: number; y: number; z: number; ry: number }[] = [];
    for (const tz of [-6.2, 6.2]) {
      k.lathe([[0.55, 0], [0.4, 0.08], [0.18, 0.2], [0.14, 0.66], [0.3, 0.72]], 0, 0, tz, walnut, 24);
      k.cyl(2.0, 0.07, 0, 0.76, tz, walnut, 2.0, 48);
      k.mesh(new T.TorusGeometry(2.0, 0.035, 8, 64).rotateX(PI / 2).translate(0, 0.76, tz), gilt);
      k.keepOut.push({ x: 0, z: tz, r: 2.55 });
      for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + PI / 4; lampsAt.push({ x: Math.cos(a) * 1.35, y: 0.795, z: tz + Math.sin(a) * 1.35, ry: -a }); }
    }
    propMany(k, 'hf_lamp', lampsAt, 0.52);
    for (const l of lampsAt) {
      const glow = new T.Mesh(new T.SphereGeometry(0.09, 10, 6), k.glow(0xbfffd0, 0.35 + 0.5 * k.night)); glow.position.set(l.x, l.y + 0.38, l.z); k.add(glow);
    }
    k.point(0, 1.8, -6.2, 0xffe0a8, 10 + 30 * k.night, 7, 1.6);
    k.point(0, 1.8, 6.2, 0xffe0a8, 10 + 30 * k.night, 7, 1.6);
    /* benches facing the walls, between columns */
    for (const b of [3, 5, 11, 13]) { const a = bayAng(b), p = dir(a).multiplyScalar(12.2); k.bench(p.x, p.z, Math.atan2(p.x, p.z) + PI / 2, walnut, bronze, 2.4); }

    /* ================= THE PASSAGE ================= */
    const pX0 = -R - 0.2, pX1 = -rIn - 0.1, pL = pX0 - pX1, pMid = (pX0 + pX1) / 2;
    k.box(pL, 0.04, PASS_W * 2, pMid, 0.0, 0, floorM);
    for (const s of [-1, 1]) {
      k.box(pL, 3.4, 0.4, pMid, 1.7, s * (PASS_W + 0.2), ashlar);
      k.box(pL, 0.9, 0.06, pMid, 0.45, s * (PASS_W - 0.01), lime);
    }
    {
      const vault = flip(new T.CylinderGeometry(PASS_W, PASS_W, pL, 32, 1, true, 0, PI));
      vault.rotateZ(PI / 2);
      /* UVs: herringbone runs along the passage */
      const pos = vault.attributes.position, uv = vault.attributes.uv as T.BufferAttribute;
      for (let i = 0; i < pos.count; i++) { const y = pos.getY(i), z = pos.getZ(i); uv.setXY(i, pos.getX(i) / 0.9, (Math.atan2(y, z) * PASS_W) / 0.9); }
      vault.translate(pMid, 3.4, 0);
      k.mesh(vault, guast);
      for (let x = pX0 - 3.2; x > pX1 + 1; x -= 6.5) {
        const arch = new T.TorusGeometry(PASS_W - 0.05, 0.16, 8, 32, PI); arch.rotateY(PI / 2); arch.translate(x, 3.4, 0);
        k.mesh(arch, lime);
        for (const s of [-1, 1]) k.box(0.5, 3.4, 0.25, x, 1.7, s * (PASS_W - 0.08), lime);
      }
    }
    const mounts: Mount[] = [];
    for (let i = 0; i < 4; i++) {
      const x = pX0 - 6.45 - i * 6.5;
      if (x < pX1 + 2.5) break;
      for (const s of [-1, 1]) mounts.push({ position: v(x, 2.0, s * (PASS_W - 0.04)), rotation: s < 0 ? 0 : PI, target: v(x, 1.8, -s * 1.5), width: 4.2, height: 2.6, style: 'gilt', wash: true });
    }
    for (let i = 0; i < 3; i++) k.point(pX0 - 3.2 - i * 9.5, 3.9, 0, 0xffe2b8, 6 + 16 * k.night, 9, 1.6);

    /* ================= THE COLONNADE ================= */
    const seg = Math.max(64, Math.round((phiMax - phiMin) * 40));
    const a0 = phiMin - 0.004, a1 = phiMax + 0.004;
    k.mesh(arcRing(rIn - 0.2, rOut, 0.0, a0, a1, seg), pavers);
    /* the back wall (the library's retaining wall), the door to the passage cut in the middle */
    const dGap = gap / 2;
    for (const [b0, b1] of [[a0, PI - dGap], [PI + dGap, a1]]) {
      k.mesh(arcSlab(rIn - 0.6, rIn, 0, C_SPRING + C_DEPTH / 2 + 0.6, b0, b1, seg), ashlar);
      k.mesh(arcSlab(rIn - 0.02, rIn + 0.06, 0, 0.75, b0, b1, seg), granite);
    }
    k.mesh(arcSlab(rIn - 0.6, rIn, 4.6, C_SPRING + C_DEPTH / 2 + 0.6, PI - dGap, PI + dGap, 8), ashlar);
    for (const s of [-1, 1]) { const p = dir(PI + s * dGap).multiplyScalar(rIn + 0.05); const pl = k.box(0.6, 4.6, 0.5, p.x, 2.3, p.z, lime); pl.rotation.y = -PI / 2 - s * dGap; }
    /* the vault: a curved barrel from the back wall to the column line, Guastavino herringbone */
    {
      const rm = rIn + C_DEPTH / 2, a = C_DEPTH / 2, NS = seg, NP = 14;
      const pos: number[] = [], uv: number[] = [], idx: number[] = [];
      for (let i = 0; i <= NS; i++) {
        const ph = a0 + ((a1 - a0) * i) / NS, d = dir(ph);
        for (let j = 0; j <= NP; j++) {
          const ps = (j / NP) * PI, r = rm - a * Math.cos(ps), y = C_SPRING + a * Math.sin(ps);
          pos.push(d.x * r, y, d.z * r); uv.push((ph * rm) / 0.9, (ps * a) / 0.9);
        }
      }
      for (let i = 0; i < NS; i++) for (let j = 0; j < NP; j++) { const A = i * (NP + 1) + j, B = A + NP + 1; idx.push(A, A + 1, B, B, A + 1, B + 1); }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      const mid = g.attributes.normal; let sy = 0; for (let i = 0; i < mid.count; i++) sy += mid.getY(i);
      if (sy > 0) flip(g);
      k.mesh(g, guast);
    }
    /* outer entablature over the columns, a red tile roof edge, the granite parapet */
    k.mesh(arcSlab(rCol - 0.42, rCol + 0.42, C_SPRING - 0.1, C_SPRING + C_DEPTH / 2 + 0.25, a0, a1, seg), lime);
    k.mesh(arcSlab(rCol - 0.5, rCol + 0.62, C_SPRING + C_DEPTH / 2 + 0.25, C_SPRING + C_DEPTH / 2 + 0.45, a0, a1, seg), lime);
    {
      const y0 = C_SPRING + C_DEPTH / 2 + 0.45, NS = seg, pos: number[] = [], idx: number[] = [], uv: number[] = [];
      for (let i = 0; i <= NS; i++) {
        const ph = a0 + ((a1 - a0) * i) / NS, d = dir(ph);
        for (const [r, y] of [[rIn - 0.6, y0 + 2.3], [rCol + 0.8, y0 - 0.05]]) { pos.push(d.x * r, y, d.z * r); uv.push((ph * rCol) / 1.2, (r - rIn) / 1.2); }
      }
      for (let i = 0; i < NS; i++) { const A = i * 2; idx.push(A, A + 1, A + 2, A + 2, A + 1, A + 3); }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      let sy = 0; const nn = g.attributes.normal; for (let i = 0; i < nn.count; i++) sy += nn.getY(i);
      if (sy < 0) flip(g);
      const roofUV = pmat(k, 'rooftile', 0, { roughness: 0.8, normal: 0.7 });
      k.mesh(g, roofUV);
    }
    k.mesh(arcSlab(rCol - 0.24, rCol + 0.24, 0, 0.95, a0, a1, seg), granite);
    k.mesh(arcSlab(rCol - 0.3, rCol + 0.3, 0.95, 1.08, a0, a1, seg), granite);
    k.mesh(arcSlab(rCol + 0.24, rOut, -0.6, 0.02, a0, a1, seg), granite);
    /* columns at every bay line, transverse arches over the walk, pilasters on the back wall */
    const POD = 1.08;   /* the columns stand on the granite parapet */
    const colG = mergeGeometries([
      new T.BoxGeometry(0.7, 0.2, 0.7).translate(0, POD + 0.1, 0).toNonIndexed(),
      new T.LatheGeometry([[0.33, 0], [0.33, 0.07], [0.28, 0.12], [0.27, 0.18]].map(([x, y]) => new T.Vector2(x, y)), 20).translate(0, POD + 0.2, 0).toNonIndexed(),
      new T.CylinderGeometry(0.235, 0.265, C_SPRING - 0.73 - POD, 24, 1).translate(0, POD + 0.38 + (C_SPRING - 0.73 - POD) / 2, 0).toNonIndexed(),
      new T.LatheGeometry([[0.24, 0], [0.3, 0.1], [0.34, 0.2], [0.34, 0.26]].map(([x, y]) => new T.Vector2(x, y)), 20).translate(0, C_SPRING - 0.35, 0).toNonIndexed(),
      new T.BoxGeometry(0.82, 0.14, 0.82).translate(0, C_SPRING - 0.03, 0).toNonIndexed(),
    ]);
    const colLime = pmat(k, 'limestone', 0, { roughness: 1, normal: 0.8, rep: [1, 2] });
    {
      const cm: T.Matrix4[] = [], q = new T.Quaternion();
      const lines: number[] = [];
      for (const s of [1, -1]) for (let j = 0; j <= P.bays / 2; j++) lines.push(PI + s * (gap / 2 + j * dPhi));
      for (const ph of lines) {
        const c = dir(ph).multiplyScalar(rCol);
        cm.push(new T.Matrix4().compose(v(c.x, 0, c.z), q.setFromAxisAngle(UP, -ph), v(1, 1, 1)));
        const arch = new T.TorusGeometry(C_DEPTH / 2, 0.15, 6, 24, PI); arch.rotateY(-ph); const m = dir(ph).multiplyScalar(rIn + C_DEPTH / 2); arch.translate(m.x, C_SPRING, m.z);
        k.mesh(arch, lime);
        const w = dir(ph).multiplyScalar(rIn + 0.1); const pil = k.box(0.42, C_SPRING, 0.22, w.x, C_SPRING / 2, w.z, lime); pil.rotation.y = -ph + PI / 2;
        k.keepOut.push({ x: c.x, z: c.z, r: 0.5 });
      }
      k.instances(colG, colLime, cm);
    }
    /* lanterns over the walk every fourth bay; two point lights follow the visitor along them */
    const lanterns: T.Vector3[] = [];
    bayPhi.forEach((ph, i) => { if (i % 8 < 2) { const p = dir(ph).multiplyScalar(rIn + C_DEPTH / 2); lanterns.push(v(p.x, C_SPRING + 0.6, p.z)); } });
    {
      const lg = mergeGeometries([new T.CylinderGeometry(0.16, 0.12, 0.42, 8).toNonIndexed(), new T.ConeGeometry(0.2, 0.18, 8).translate(0, 0.3, 0).toNonIndexed(), new T.CylinderGeometry(0.01, 0.01, 1.2, 4).translate(0, 0.98, 0).toNonIndexed()]);
      k.instances(lg, bronze, lanterns.map((p) => new T.Matrix4().makeTranslation(p.x, p.y, p.z)));
      k.instances(new T.SphereGeometry(0.11, 10, 6), k.glow(0xffd9a0, 0.4 + 0.6 * Math.max(k.night, k.dusk)), lanterns.map((p) => new T.Matrix4().makeTranslation(p.x, p.y - 0.02, p.z)));
      const lit = 3 + 11 * Math.max(k.night, k.dusk * 0.7);
      const pts = [k.point(lanterns[0]?.x ?? -rIn, C_SPRING, lanterns[0]?.z ?? 0, 0xffd1a0, lit, 11, 1.5), k.point(lanterns[1]?.x ?? -rIn, C_SPRING, lanterns[1]?.z ?? 0, 0xffd1a0, lit, 11, 1.5)];
      let acc = 1;
      k.ticks.push((_t, dt) => {
        acc += dt; if (acc < 0.5) return; acc = 0;
        const c = museum()?.camera?.position; if (!c) return;
        const near = lanterns.map((p, i) => ({ i, d: p.distanceToSquared(c) })).sort((a, b) => a.d - b.d);
        pts.forEach((l, j) => { const p = lanterns[near[j]?.i ?? 0]; if (p) l.position.set(p.x, p.y - 0.3, p.z); });
      });
    }

    /* ================= OUTSIDE ================= */
    /* the river view: Nano Banana Pro's Harlem River, Inwood Hill and the Palisades on a far arc,
       its ends faded into the sky */
    {
      /* the photograph covers 2.3 radians; past its edges it is reflected, so the river view runs the whole
         way round the colonnade with no seam (the reflections meet behind the rotunda, where nobody looks) */
      const span = 2.3, Rp = 420, H = (Rp * span) / 2.68, top = 18 + 0.36 * H, bot = top - H;
      const angs = new Set<number>();
      for (let i = 0; i <= 240; i++) angs.add((i / 240) * TAU);
      for (let f = -3; f <= 3; f++) { const a = PI + span / 2 + f * span; if (a > 0 && a < TAU) angs.add(a); }
      const list = [...angs].sort((x, y) => x - y);
      const fold = (a: number) => { let d = (a - PI + span / 2) / span; d = ((d % 2) + 2) % 2; return d > 1 ? 2 - d : d; };
      const pos: number[] = [], uv: number[] = [], idx: number[] = [];
      list.forEach((a, i) => { const d = dir(a); const u = 1 - fold(a); pos.push(d.x * Rp, bot, d.z * Rp, d.x * Rp, top, d.z * Rp); uv.push(u, 0, u, 1); if (i) { const A = (i - 1) * 2; idx.push(A, A + 2, A + 1, A + 1, A + 2, A + 3); } });
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      g.computeVertexNormals();   /* the occlusion pass reads normals; a mesh without them comes out black */
      const tint = new T.Color(1, 1, 1).lerp(new T.Color(1.0, 0.82, 0.68), k.dusk * 0.6).lerp(new T.Color(0.07, 0.09, 0.16), Math.min(1, k.night * 1.4));
      const pm = new T.MeshBasicMaterial({ color: tint, side: T.DoubleSide, depthWrite: false, fog: false });
      texLoad(k, PH + 'panorama.webp', true, (t) => { t.wrapS = t.wrapT = T.ClampToEdgeWrapping; pm.map = t; pm.needsUpdate = true; });
      const pano = new T.Mesh(g, pm); pano.renderOrder = -5; k.add(pano);
      /* the far bank's lights after dark */
      if (k.night > 0.3) {
        const rnd = X.mulberry(317), pts: number[] = [];
        for (let i = 0; i < 900; i++) { const ph = rnd() * TAU, d = dir(ph), r = Rp - 4; pts.push(d.x * r, top - H * (0.4 + rnd() * 0.2), d.z * r); }
        const pg = new T.BufferGeometry(); pg.setAttribute('position', new T.Float32BufferAttribute(pts, 3));
        k.add(new T.Points(pg, new T.PointsMaterial({ color: 0xffd9a0, size: 1.6, sizeAttenuation: true, transparent: true, opacity: 0.85 * k.night, fog: false, depthWrite: false })));
      }
    }

    /* ================= THE HANG ================= */
    hangHonor(k, ctx, slots, giltUV, walnutUV, bronze);
    colonnadeTablets(k, slots, P.rotN, bronze);
    namePlates(k, slots);

    /* the laurel pedestal at each end of the walk (Tripo), the end walls */
    const ends = [phiMin + 0.006, phiMax - 0.006];
    for (const ph of ends) {
      const p = dir(ph).multiplyScalar(rIn + C_DEPTH / 2);
      const w = k.mesh(arcSlab(rIn - 0.6, rOut, 0, C_SPRING + C_DEPTH / 2 + 0.45, ph - 0.004, ph + 0.004, 2), ashlar);
      void w;
      const toward = ph < PI ? 1 : -1, q = dir(ph + toward * (1.4 / (rIn + C_DEPTH / 2))).multiplyScalar(rIn + C_DEPTH / 2);
      void p;
      propMany(k, 'hf_pedestal', [{ x: q.x, y: 0, z: q.z, ry: -ph + (toward > 0 ? 0 : PI) }], 2.1);
      k.keepOut.push({ x: q.x, z: q.z, r: 0.7 });
    }

    /* no painted visitors here: Astra's critique, they read as illustration against the photographed stone */

    /* ================= THE ROLL CALL ================= */
    rollCall(k, ctx, slots);

    /* ================= EGGS ================= */
    const HOF = { name: 'Hall of Fame for Great Americans, Wikipedia', url: 'https://en.wikipedia.org/wiki/Hall_of_Fame_for_Great_Americans' };
    const GML = { name: 'Gould Memorial Library, Wikipedia', url: 'https://en.wikipedia.org/wiki/Gould_Memorial_Library' };
    const mid = dir(PI + gap / 2 + 3.5 * dPhi).multiplyScalar(rIn + 2.2);
    k.egg(v(mid.x, 2.2, mid.z), { id: 'honoraries-colonnade', title: 'The first hall of fame', year: '1901', text: 'The Hall of Fame for Great Americans was designed by Stanford White of McKim, Mead and White and dedicated on May 30, 1901. Its open air colonnade, 630 feet long, curves round the back of the library on the heights over the Harlem River, and it was built to hide the library\'s retaining wall.', clue: 'Walk the curve to the west.', source: HOF }, { r: 1.6 });
    const tb = dir(bayPhi[1] ?? PI).multiplyScalar(rIn + 0.1);
    k.egg(v(tb.x, 0.95, tb.z), { id: 'honoraries-tablets', title: 'Tiffany\'s tablets', text: 'Each honoree in the colonnade has a bronze tablet designed by Louis Comfort Tiffany, about 13 inches tall and 7 feet wide, with the name, the dates, what they did and a quotation.', clue: 'Read under the portraits on the back wall of the colonnade.', source: HOF }, { r: 0.9 });
    const ped = dir(phiMax - 0.006 - 1.4 / (rIn + C_DEPTH / 2)).multiplyScalar(rIn + C_DEPTH / 2);
    k.egg(v(ped.x, 1.6, ped.z), { id: 'honoraries-busts', title: 'Four busts never made', year: '1976', text: 'By the last election, in 1976, the Hall had chosen 102 honorees, and 96 bronze busts stand in the colonnade. Busts of Louis Brandeis, Clara Barton, Luther Burbank and Andrew Carnegie were never made.', clue: 'The laurel at the end of the walk, waiting for a head.', source: HOF }, { r: 1.2 });
    const cc = dir(bayAng(4) + DA / 2).multiplyScalar(COL_R);
    k.egg(v(cc.x, 2.6, cc.z), { id: 'honoraries-connemara', title: 'Green from Galway', text: 'The reading room of the Gould Memorial Library is ringed by sixteen freestanding columns of green Connemara marble, each 3 feet 5 inches across. Stanford White designed the library; it was built from 1895 to 1900.', clue: 'Put a hand on a green column.', source: GML }, { r: 1.0 });
    k.egg(v(0, DOME_TOP - 1.5, 0), { id: 'honoraries-laylight', title: 'The eye of the dome', text: 'The library\'s plaster dome is divided into coffers whose rosettes grow smaller toward the top, where a Tiffany glass skylight, originally 23 feet across, is now sealed. The dome rises about 70 feet above the floor.', clue: 'Stand on the laurel and look straight up.', source: GML }, { r: 3.4 });
    const gl = dir(bayAng(6)).multiplyScalar(GAL_IN + 0.6);
    k.egg(v(gl.x, GAL[0] + 0.02, gl.z), { id: 'honoraries-glassfloor', title: 'A floor of glass', text: 'Around the reading room the Gould Memorial Library has four levels of balconies. The second level has an iron frame with a glass floor.', clue: 'Look up under the first gallery.', source: GML }, { r: 1.2 });
    k.egg(v(pX0 - 1.2, 4.6, 0), { id: 'honoraries-landmark', title: 'Landmarked inside and out', year: '1981', text: 'New York City made the library\'s facade a landmark on February 15, 1966, and its interior on August 11, 1981. It became a National Historic Landmark on October 16, 2012.', clue: 'The door between the rotunda and the passage.', source: GML }, { r: 1.4 });
    const vt = dir(PI - gap / 2 - 6.5 * dPhi).multiplyScalar(rIn + C_DEPTH / 2);
    k.egg(v(vt.x, C_SPRING + 1.9, vt.z), { id: 'honoraries-guastavino', title: 'Tile overhead, stone underfoot', text: 'The colonnade\'s ceiling is Guastavino tile under a roof of red Spanish tile. Its parapets are Massachusetts granite; its pedestals and columns are Indiana limestone.', clue: 'Look up in the colonnade.', source: HOF }, { r: 1.6 });

    const spawn = v(5.95, EYE, 5.95), look = v(-9, 3.6, -9);
    return { mounts, spawn, look, eye: EYE, bounds: BOUNDS, style: 'gilt' as FrameStyle };
  },
};

/* ---------------- the portraits: frames, art from the atlases, shadows, picture lights ---------------- */
function hangHonor(k: K, ctx: C, slots: Slot[], giltUV: T.Material, walnutUV: T.Material, bronze: T.Material) {
  const low = ctx.quality === 'low';
  const n = slots.length, AR = 9 / 16;
  /* frames: one instanced draw per profile */
  const byCls: Map<number, T.Matrix4[]> = new Map(), clsSlots: Map<number, number[]> = new Map(), frames: T.InstancedMesh[] = [];
  const shadowM: T.Matrix4[] = [];
  const q = new T.Quaternion(), e = new T.Euler();
  slots.forEach((s) => {
    const nrm = v(Math.sin(s.ry), 0, Math.cos(s.ry));
    const m = new T.Matrix4().compose(s.p.clone().addScaledVector(nrm, STANDOFF), q.setFromEuler(e.set(0, s.ry, 0)), v(1, 1, 1));
    const a = byCls.get(s.cls) || []; a.push(m); byCls.set(s.cls, a);
    const si = clsSlots.get(s.cls) || []; si.push(slots.indexOf(s)); clsSlots.set(s.cls, si);
    const L = LIP[s.cls], w = s.w + L * 2 + 0.07, h = s.w * AR + L * 2 + 0.09;
    shadowM.push(new T.Matrix4().compose(s.p.clone().addScaledVector(nrm, 0.006).add(v(0, -0.025, 0)), q.clone(), v(w, h, 1)));
  });
  const W = [1.25, 1.12, 1.5, 1.04];
  for (const [cls, ms] of byCls) {
    const g = frameGeo(W[cls] + 0.006, W[cls] * AR + 0.006, PROF[cls]);
    const o = k.instances(g, cls === 3 ? walnutUV : giltUV, ms);
    o.receiveShadow = !low; o.castShadow = !low && cls >= 2;
    o.userData.frameSlots = clsSlots.get(cls); frames.push(o);
    if (cls === 3) {
      /* the gilt sight edge on the walnut frames */
      const sl = frameGeo(W[3] + 0.006, W[3] * AR + 0.006, [[-0.004, 0.034], [0.006, 0.046], [0.012, 0.046]]);
      k.instances(sl, giltUV, ms);
    }
  }
  /* the soft contact shadow every frame throws on the wall */
  const shT = canvasTex(128, 128, (g) => {
    const im = g.createImageData(128, 128);
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
      const dx = Math.max(0, Math.abs(x - 63.5) - 50) / 14, dy = Math.max(0, Math.abs(y - 63.5) - 50) / 14, d = Math.min(1, Math.hypot(dx, dy));
      const a = (1 - d) * (1 - d) * 0.62, i = (y * 128 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 0; im.data[i + 3] = a * 255;
    }
    g.putImageData(im, 0, 0);
  });
  const sh = k.instances(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: shT, transparent: true, depthWrite: false, color: 0x000000 }), shadowM);
  sh.castShadow = sh.receiveShadow = false; sh.renderOrder = 1;

  /* the paintings: quads grouped by atlas sheet, each quad's tile from its hang index */
  const groups = new Map<number, { pos: number[]; uv: number[]; idx: number[] }>();
  const G = HONOR_COLS, TW = 256 / 2048, TH = 144 / 2048, pad = 1.2 / 2048;
  slots.forEach((s, i) => {
    const a = Math.floor(i / HONOR_PER), local = i % HONOR_PER, col = local % G, row = Math.floor(local / G);
    const grp = groups.get(a) || { pos: [], uv: [], idx: [] }; groups.set(a, grp);
    const nrm = v(Math.sin(s.ry), 0, Math.cos(s.ry)), right = v(Math.cos(s.ry), 0, -Math.sin(s.ry));
    const c = s.p.clone().addScaledVector(nrm, STANDOFF + ART_Z), hw = s.w / 2 + 0.003, hh = (s.w * AR) / 2 + 0.003;
    const u0 = col * TW + pad, u1 = (col + 1) * TW - pad, v1 = 1 - row * TH - pad, v0 = 1 - (row + 1) * TH + pad;
    const corner = (sx: number, sy: number) => c.clone().addScaledVector(right, sx * hw).add(v(0, sy * hh, 0));
    for (const [sx, sy, uu, vv] of [[-1, 1, u0, v1], [-1, -1, u0, v0], [1, -1, u1, v0], [-1, 1, u0, v1], [1, -1, u1, v0], [1, 1, u1, v1]]) {
      const p = corner(sx, sy); grp.pos.push(p.x, p.y, p.z); grp.uv.push(uu, vv);
    }
    grp.idx.push(i);
  });
  const hits: (T.Mesh & { userData: { honor: unknown[] } })[] = [];
  for (const [a, grp] of groups) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(grp.pos, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(grp.uv, 2));
    g.computeVertexNormals();
    const m = new T.MeshBasicMaterial({ color: 0x1a1d24, toneMapped: false });
    const mesh = new T.Mesh(g, m) as unknown as T.Mesh & { userData: { honor: unknown[] } };
    mesh.userData.honor = grp.idx.map(() => null);
    (mesh.userData as { slots?: number[] }).slots = grp.idx;
    k.add(mesh); k.clickables.push(mesh); hits.push(mesh);
    texLoad(k, `${HON}a${a}${low ? 's' : ''}.webp`, true, (t) => {
      t.wrapS = t.wrapT = T.ClampToEdgeWrapping; t.anisotropy = 8;
      m.map = t; m.color.set(0xf2efe8); m.needsUpdate = true;
    });
  }
  /* hang.json carries who each portrait is; the cards and the roll call read it */
  if (HAS_DOM) {
    k.used.images.add(HON + 'hang.json');
    k.pending.push(fetch(HON + 'hang.json').then((r) => r.json()).then((rows: HonorRow[]) => {
      const cat = (c: string) => HONOR_CAT_NAMES[c] || '';
      for (const mesh of hits) {
        const ids = (mesh.userData as unknown as { slots: number[] }).slots;
        mesh.userData.honor = ids.map((i) => {
          const r = rows[i], s = slots[i]; if (!r || !s) return null;
          const nrm = v(Math.sin(s.ry), 0, Math.cos(s.ry));
          const back = s.tier >= 3 ? 2.0 : s.tier === 0 ? 1.9 : 2.6;
          return { ...r, cat: cat(r.c), at: s.p.clone().addScaledVector(nrm, back).setY(0), look: s.p.clone() };
        });
      }
      const entries: unknown[] = slots.map(() => null);
      for (const mesh of hits) (mesh.userData as unknown as { slots: number[] }).slots.forEach((i, j) => { entries[i] = mesh.userData.honor[j]; });
      (k as unknown as { honorEntries?: unknown[] }).honorEntries = entries;
      for (const f of frames) f.userData.honorFrames = (f.userData.frameSlots as number[]).map((i) => entries[i]);
      (k as unknown as { honorRows?: HonorRow[] }).honorRows = rows;
    }).catch(() => {}));
  }

  /* picture lights: a brass bar over the lit works, its warm pool on the wall below */
  const lit = slots.filter((s) => s.lit);
  const barM: T.Matrix4[] = [], poolM: T.Matrix4[] = [];
  for (const s of lit) {
    const nrm = v(Math.sin(s.ry), 0, Math.cos(s.ry)), h = s.w * AR, top = s.p.y + h / 2 + LIP[s.cls] + 0.1;
    barM.push(new T.Matrix4().compose(s.p.clone().addScaledVector(nrm, 0.16).setY(top), q.setFromEuler(e.set(0, s.ry, 0)).clone(), v(s.w * 0.62, 1, 1)));
    poolM.push(new T.Matrix4().compose(s.p.clone().addScaledVector(nrm, STANDOFF + 0.12).setY(s.p.y + 0.1), q.clone(), v(s.w * 1.35, h * 1.7, 1)));
  }
  const bar = mergeGeometries([
    new T.CylinderGeometry(0.035, 0.035, 1, 10).rotateZ(PI / 2).toNonIndexed(),
    new T.BoxGeometry(0.02, 0.2, 0.02).translate(0, 0.05, -0.08).rotateX(0.6).toNonIndexed(),
  ]);
  k.instances(bar, bronze, barM);
  const night = Math.max(k.night, k.dusk * 0.6);
  const poolMat = new T.MeshBasicMaterial({ map: X.pool(), color: 0xffd9a8, transparent: true, opacity: 0.06 + 0.16 * night, blending: T.AdditiveBlending, depthWrite: false });
  const pools = k.instances(new T.PlaneGeometry(1, 1), poolMat, poolM);
  pools.castShadow = pools.receiveShadow = false; pools.renderOrder = 2;

  /* up close, the full painting: within a few metres the 1280 px original replaces the atlas tile */
  if (HAS_DOM && !ctx.reduced) {
    const loader = new T.TextureLoader();
    const live = new Map<number, { mesh: T.Mesh; tex: T.Texture | null }>();
    const overlayGeo = new T.PlaneGeometry(1, 1);
    let acc = 0.5, rows: HonorRow[] | null = null;
    const MAX = low ? 3 : 8;
    (k as unknown as { honorForce?: Set<number> }).honorForce = new Set<number>();
    k.ticks.push((_t, dt) => {
      acc += dt; if (acc < 0.5) return; acc = 0;
      rows = rows || (k as unknown as { honorRows?: HonorRow[] }).honorRows || null;
      const c = museum()?.camera?.position; if (!c || !rows) return;
      const force = (k as unknown as { honorForce: Set<number> }).honorForce;
      const want = slots.map((s, i) => ({ i, d: s.p.distanceToSquared(c) - (force.has(i) ? 1e4 : 0) })).filter((x) => x.d < 30 || force.has(x.i)).sort((a, b) => a.d - b.d).slice(0, MAX).map((x) => x.i);
      for (const [i, o] of live) if (!want.includes(i)) { k.scene.remove(o.mesh); o.tex?.dispose(); (o.mesh.material as T.Material).dispose(); live.delete(i); }
      for (const i of want) {
        if (live.has(i) || !rows[i]) continue;
        const s = slots[i], nrm = v(Math.sin(s.ry), 0, Math.cos(s.ry));
        const mat = new T.MeshBasicMaterial({ color: 0xf2efe8, toneMapped: false, transparent: true, opacity: 0 });
        const mesh = new T.Mesh(overlayGeo, mat);
        const ar = rows[i].ar || 16 / 9, boxW = s.w, boxH = s.w * AR;
        const w = ar >= 16 / 9 - 0.03 ? boxW : boxH * ar, h = ar >= 16 / 9 - 0.03 ? boxH : boxH;
        mesh.scale.set(w, h, 1);
        mesh.position.copy(s.p).addScaledVector(nrm, STANDOFF + ART_Z + 0.002);
        mesh.rotation.y = s.ry; mesh.renderOrder = 3;
        mesh.userData.honor = [((k as unknown as { honorEntries?: unknown[] }).honorEntries || [])[i] || null];
        k.scene.add(mesh);
        const rec = { mesh, tex: null as T.Texture | null };
        live.set(i, rec);
        loader.load(`assets/honoraries/${rows[i].l}`, (t) => {
          if (!live.has(i) || live.get(i) !== rec) { t.dispose(); return; }
          t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; rec.tex = t; mat.map = t; mat.needsUpdate = true;
          let f = 0; const fade = setInterval(() => { f += 0.1; mat.opacity = Math.min(1, f); if (f >= 1) { mat.transparent = false; mat.needsUpdate = true; clearInterval(fade); } }, 30);
        });
      }
    });
    /* the originals belong to this room: let them go when the visitor leaves */
    const watch = setInterval(() => { if (museum()?.kit !== k) { for (const o of live.values()) { o.tex?.dispose(); (o.mesh.material as T.Material).dispose(); } live.clear(); clearInterval(watch); } }, 1000);
  }
}

/* Tiffany style bronze tablets under the colonnade's eye level works: the name below, the name above */
function colonnadeTablets(k: K, slots: Slot[], from: number, bronze: T.Material) {
  const lows = slots.map((s, i) => ({ s, i })).filter((x) => x.i >= from && x.s.tier === 3);
  if (!lows.length) return;
  const PER = 2, TWpx = 1024, THpx = 112, rows = Math.ceil(lows.length / PER);
  const pos: number[] = [], uv: number[] = [];
  lows.forEach(({ s }, j) => {
    const nrm = v(Math.sin(s.ry), 0, Math.cos(s.ry)), right = v(Math.cos(s.ry), 0, -Math.sin(s.ry));
    const c = s.p.clone().addScaledVector(nrm, 0.06).setY(0.98), hw = 0.82, hh = 0.09;   /* in front of the backing box's face */
    const col = j % PER, row = Math.floor(j / PER), u0 = col / PER, u1 = (col + 1) / PER, v1 = 1 - row / rows, v0 = 1 - (row + 1) / rows;
    for (const [sx, sy, uu, vv] of [[-1, 1, u0, v1], [-1, -1, u0, v0], [1, -1, u1, v0], [-1, 1, u0, v1], [1, -1, u1, v0], [1, 1, u1, v1]]) {
      const p = c.clone().addScaledVector(right, sx * hw).add(v(0, sy * hh, 0)); pos.push(p.x, p.y, p.z); uv.push(uu, vv);
    }
    const bw = s.p.clone().addScaledVector(nrm, 0.03);   /* backing face at 0.055 m, the lettering at 0.06 */
    const back = k.box(1.74, 0.24, 0.05, bw.x, 0.98, bw.z, bronze); back.rotation.y = s.ry;
  });
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
  const m = new T.MeshStandardMaterial({ color: 0x5a3f28, metalness: 0.45, roughness: 0.5 });
  k.add(new T.Mesh(g, m));
  if (!HAS_DOM) return;
  void fetch(HON + 'hang.json').then((r) => r.json()).then((all: HonorRow[]) => {
    if (!k.live) return;
    const c = document.createElement('canvas'); c.width = TWpx * PER; c.height = THpx * rows;
    const g2 = c.getContext('2d')!;
    lows.forEach(({ i }, j) => {
      const x = (j % PER) * TWpx, y = Math.floor(j / PER) * THpx, lo = all[i], up = all[i + 1];
      const gr = g2.createLinearGradient(x, y, x, y + THpx); gr.addColorStop(0, '#5e432a'); gr.addColorStop(0.5, '#4a3320'); gr.addColorStop(1, '#3a2716');
      g2.fillStyle = gr; g2.fillRect(x, y, TWpx, THpx);
      g2.strokeStyle = '#a7834f'; g2.lineWidth = 4; g2.strokeRect(x + 8, y + 8, TWpx - 16, THpx - 16);
      const txt = (s: string, ty: number, size: number, col: string) => {
        g2.font = `600 ${size}px Georgia, serif`; g2.textAlign = 'center'; g2.textBaseline = 'middle';
        g2.fillStyle = '#20160c'; g2.fillText(s, x + TWpx / 2 + 2, y + ty + 2, TWpx - 60);
        g2.fillStyle = col; g2.fillText(s, x + TWpx / 2, y + ty, TWpx - 60);
      };
      const both = (r: HonorRow) => [r.n, r.t].map((x) => (x || '').trim()).filter(Boolean).join('  ·  ').toUpperCase();
      if (lo) txt(both(lo), 44, 34, '#e3c58e');
      if (up && slots[i + 1]?.tier === 4) txt(`ABOVE  ·  ${both(up)}`, 82, 22, '#c4a370');
    });
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
    m.map = t; m.color.set(0xffffff); m.needsUpdate = true;
  }).catch(() => {});
}

/* The roll call: stand on the laurel and the dome calls a name. A beam from the laylight lands on one
   portrait, its original comes up in the frame, and a card says who it is. Every few seconds while you
   stay, another. */
function rollCall(k: K, ctx: C, slots: Slot[]) {
  if (!HAS_DOM || !slots.length) return;
  const beamGeo = new T.CylinderGeometry(0.05, 1, 1, 24, 1, true);
  beamGeo.translate(0, -0.5, 0); beamGeo.rotateX(-PI / 2);
  const bm = new T.MeshBasicMaterial({ color: 0xfff1cf, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
  const beam = new T.Mesh(beamGeo, bm); beam.renderOrder = 5; beam.visible = false; k.add(beam);
  const spot = k.spot(0, DOME_TOP - 1, 0, 0, 0, 0, 0xfff0d0, 0, 0.09, 0.5, 40);
  let caption: HTMLDivElement | null = null, onFor = 0, called = -1, glow = 0, next = 0;
  const say = (html: string) => {
    if (!caption) {
      caption = document.createElement('div');
      caption.style.cssText = 'position:fixed;left:50%;top:16%;transform:translateX(-50%);z-index:40;padding:12px 18px;background:rgba(20,14,8,.86);border:1px solid #b59655;color:#f2e6cc;font:13px/1.5 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.12em;text-align:center;opacity:0;transition:opacity .6s;cursor:pointer;max-width:80vw';
      document.body.appendChild(caption);
      const watch = setInterval(() => { if (museum()?.kit !== k) { caption?.remove(); caption = null; clearInterval(watch); } }, 800);
    }
    if (html) caption.innerHTML = html;
    caption.style.opacity = html ? '1' : '0';
    caption.style.pointerEvents = html ? 'auto' : 'none';
  };
  const rot = slots.map((s, i) => ({ s, i })).filter((x) => x.s.tier <= 2);
  k.ticks.push((_t, dt) => {
    const c = museum()?.camera?.position; if (!c) return;
    const on = Math.hypot(c.x, c.z) < 1.3;
    onFor = on ? onFor + dt : 0;
    if (on && onFor > 1.5 && onFor > next) {
      const rows = (k as unknown as { honorRows?: HonorRow[] }).honorRows;
      if (rows) {
        const pick = rot[Math.floor(Math.random() * rot.length)];
        called = pick.i; next = onFor + 9;
        const force = (k as unknown as { honorForce?: Set<number> }).honorForce; force?.clear(); force?.add(called);
        const r = rows[called], s = slots[called];
        const tgt = s.p.clone().addScaledVector(v(Math.sin(s.ry), 0, Math.cos(s.ry)), 0.1);
        const from = v(0, DOME_TOP - 0.6, 0), L = from.distanceTo(tgt);
        beam.position.copy(from); beam.lookAt(tgt); beam.scale.set(s.w * 0.75, s.w * 0.75, L); beam.visible = true;
        spot.position.copy(from); spot.target.position.copy(tgt); spot.target.updateMatrixWorld();
        spot.angle = Math.atan((s.w * 0.9) / L); glow = 0;
        const esc = (x: string) => x.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]!));
        say(`THE ROLL CALL<br><b style="font:600 22px Georgia,serif;letter-spacing:.04em;color:#e8c98a">${esc(r.n)}</b><br>${esc(r.t.toUpperCase())}${r.h ? ' · ' + esc(r.h) : ''}<br><span style="color:#b59655">TAP TO MEET THEM</span>`);
        const entry = ((k as unknown as { honorEntries?: unknown[] }).honorEntries || [])[called];
        if (caption) caption.onclick = () => { const m = museum(); if (m?.openHonor && entry) m.openHonor(entry); };
      }
    }
    if (!on) { next = 0; if (called >= 0) { called = -1; say(''); } }
    glow = called >= 0 ? Math.min(1, glow + dt * 0.8) : Math.max(0, glow - dt * 1.2);
    bm.opacity = 0.11 * glow; beam.visible = glow > 0.01;
    spot.intensity = 600 * glow;
  });
  void ctx;
}

/* A small bronze plate under every portrait with the honoree's name (the colonnade's eye level works have
   their Tiffany tablets instead). All names are drawn into one canvas sheet once hang.json arrives. */
function namePlates(k: K, slots: Slot[]) {
  const list = slots.map((s, i) => ({ s, i })).filter((x) => x.s.tier !== 3);
  if (!list.length) return;
  const PW = 256, PHt = 32, COLS = 8, rows = Math.ceil(list.length / COLS);
  const pos: number[] = [], uv: number[] = [];
  const AR = 9 / 16, PLATE_H = 0.058;
  list.forEach(({ s }, j) => {
    const nrm = v(Math.sin(s.ry), 0, Math.cos(s.ry)), right = v(Math.cos(s.ry), 0, -Math.sin(s.ry));
    const w = Math.min(0.5, s.w * 0.42), y = s.p.y - (s.w * AR) / 2 - LIP[s.cls] - 0.024 - PLATE_H / 2;
    const c = s.p.clone().addScaledVector(nrm, STANDOFF + 0.012).setY(y);
    const col = j % COLS, row = Math.floor(j / COLS), u0 = col / COLS, u1 = (col + 1) / COLS, v1 = 1 - row / rows, v0 = 1 - (row + 1) / rows;
    for (const [sx, sy, uu, vv] of [[-1, 1, u0, v1], [-1, -1, u0, v0], [1, -1, u1, v0], [-1, 1, u0, v1], [1, -1, u1, v0], [1, 1, u1, v1]]) {
      const p = c.clone().addScaledVector(right, sx * w / 2).add(v(0, sy * PLATE_H / 2, 0)); pos.push(p.x, p.y, p.z); uv.push(uu, vv);
    }
  });
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
  const m = new T.MeshStandardMaterial({ color: 0x4a3420, metalness: 0.6, roughness: 0.5 });
  const mesh = new T.Mesh(g, m); mesh.receiveShadow = true; k.add(mesh);
  if (!HAS_DOM) return;
  void fetch(HON + 'hang.json').then((r) => r.json()).then((all: HonorRow[]) => {
    if (!k.live) return;
    const c = document.createElement('canvas'); c.width = PW * COLS; c.height = PHt * rows;
    const g2 = c.getContext('2d')!;
    list.forEach(({ i }, j) => {
      const x = (j % COLS) * PW, y = Math.floor(j / COLS) * PHt, r = all[i];
      const gr = g2.createLinearGradient(x, y, x, y + PHt); gr.addColorStop(0, '#5e432a'); gr.addColorStop(1, '#33220f');
      g2.fillStyle = gr; g2.fillRect(x, y, PW, PHt);
      g2.strokeStyle = '#a7834f'; g2.lineWidth = 2; g2.strokeRect(x + 3, y + 3, PW - 6, PHt - 6);
      if (!r) return;
      g2.font = '700 17px Georgia, serif'; g2.textAlign = 'center'; g2.textBaseline = 'middle';
      g2.fillStyle = '#1c130a'; g2.fillText(r.n.toUpperCase(), x + PW / 2 + 1, y + PHt / 2 + 1, PW - 18);
      g2.fillStyle = '#ecd29a'; g2.fillText(r.n.toUpperCase(), x + PW / 2, y + PHt / 2, PW - 18);
    });
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
    m.map = t; m.color.set(0xffffff); m.needsUpdate = true;
  }).catch(() => {});
}
