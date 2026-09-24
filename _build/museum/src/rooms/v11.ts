/* 159 and 160: two Chabad places, built the way a respectful visitor would photograph them.
   770 Eastern Parkway with its three brick gables on the Parkway, and the study hall below it;
   the Ohel at Montefiore Cemetery, reached from the visitor center on Francis Lewis Boulevard.
   No likeness of any person, no lettered scripture, no art in a sanctuary or at the grave. */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as X from '../textures';
import { v, type Mount } from '../kit';
import type { RoomDef } from './types';
const PI = Math.PI;
type K = Parameters<RoomDef['build']>[0];

/* ---------- shared helpers ---------- */
/* a person in three instanced parts, so a coat, a face and a hat can each take their own colour */
const FS = 1.15;
function bodyGeo() { const g = new T.CapsuleGeometry(0.2, 0.82, 3, 8); g.translate(0, 0.61, 0); return g; }
function headGeo() { const g = new T.SphereGeometry(0.125, 8, 6); g.translate(0, 1.35, 0); return g; }
function hatGeo() {
  const brim = new T.CylinderGeometry(0.2, 0.2, 0.018, 9); brim.translate(0, 1.43, 0);
  const crown = new T.CylinderGeometry(0.12, 0.13, 0.15, 8); crown.translate(0, 1.51, 0);
  return mergeGeometries([brim, crown])!;
}
type Person = { x: number; y: number; z: number; yaw: number; coat: number; skin: number; hat: boolean; ph: number; sway: number };
/* many people in place: seated, standing, swaying over their books. One draw call per part. */
function people(k: K, list: Person[], animate: boolean) {
  const n = list.length, mk = () => Array.from({ length: n }, () => new T.Matrix4());
  const body = k.instances(bodyGeo(), new T.MeshStandardMaterial({ roughness: 0.85 }), mk());
  const head = k.instances(headGeo(), new T.MeshStandardMaterial({ roughness: 0.7 }), mk());
  const hat = k.instances(hatGeo(), new T.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.6 }), mk());
  body.frustumCulled = head.frustumCulled = hat.frustumCulled = false;
  shadeless.push(body, head, hat);
  const c = new T.Color();
  list.forEach((p, i) => { body.setColorAt(i, c.set(p.coat)); head.setColorAt(i, c.set(p.skin)); });
  if (body.instanceColor) body.instanceColor.needsUpdate = true;
  if (head.instanceColor) head.instanceColor.needsUpdate = true;
  const m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(0, 0, 0, 'YXZ'), pos = new T.Vector3(), s = new T.Vector3(FS, FS, FS), zero = new T.Vector3(0, 0, 0);
  const place = (t: number) => {
    list.forEach((p, i) => {
      e.set(p.sway * Math.sin(t * 2.1 + p.ph), p.yaw, 0);
      q.setFromEuler(e); pos.set(p.x, p.y, p.z);
      m.compose(pos, q, s); body.setMatrixAt(i, m); head.setMatrixAt(i, m);
      if (!p.hat) m.compose(pos, q, zero);
      hat.setMatrixAt(i, m);
    });
    body.instanceMatrix.needsUpdate = head.instanceMatrix.needsUpdate = hat.instanceMatrix.needsUpdate = true;
  };
  place(0);
  if (animate) k.ticks.push(place);
}
/* meshes and materials that live indoors, where the sun never reaches: no shadow casting, which halves their cost */
const shadeless: T.Object3D[] = [];
function noShadowsFor(k: K, mats: T.Material[]) {
  const set = new Set(mats); let done = false;
  k.ticks.push(() => {
    if (done) return; done = true;
    k.scene.traverse((o) => { if (o instanceof T.Mesh && !Array.isArray(o.material) && set.has(o.material)) o.castShadow = false; });
    for (const o of shadeless.splice(0)) o.castShadow = false;
  });
}
const SKINS = [0xf1d3b5, 0xe9c2a0, 0xc8a284, 0xa77653, 0x8d5a3b, 0x5a3a26];

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat = false) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) t.wrapS = t.wrapT = T.RepeatWrapping;
  return t;
}
/* rows of book spines on shelves, no lettering */
function spines(seed: number) {
  return canvasTex(512, 512, (g) => {
    const r = X.mulberry(seed), pal = ['#3a1e1a', '#1e2a3a', '#2a2a2a', '#5a3a1e', '#1e3a2a', '#6a1e22', '#2a1e3a', '#8a6a3a', '#141414'];
    g.fillStyle = '#2a1c12'; g.fillRect(0, 0, 512, 512);
    for (let row = 0; row < 4; row++) {
      const y0 = row * 128 + 10, y1 = row * 128 + 118;
      for (let x = 2; x < 510;) {
        const w = 8 + r() * 14, h = (y1 - y0) * (0.72 + r() * 0.28);
        g.fillStyle = pal[Math.floor(r() * pal.length)]; g.fillRect(x, y1 - h, w - 1, h);
        g.fillStyle = 'rgba(210,170,90,0.55)'; g.fillRect(x + 1, y1 - h + 10, w - 3, 2); g.fillRect(x + 1, y1 - 14, w - 3, 2);
        x += w;
      }
      g.fillStyle = '#4a3222'; g.fillRect(0, y1, 512, 10);
    }
  }, true);
}
function pointed(p: T.Path, cx: number, y0: number, w: number, h: number) {
  const a = w / 2, rise = Math.min(h - 0.01, a * 1.1), c = (rise * rise - a * a) / (2 * a), R = a + c, ys = y0 + h - rise;
  const apexL = Math.atan2(rise, -c), apexR = Math.atan2(rise, c);
  p.moveTo(cx - a, y0); p.lineTo(cx - a, ys);
  p.absarc(cx + c, ys, R, PI, apexL, true);
  p.absarc(cx - c, ys, R, apexR, 0, true);
  p.lineTo(cx + a, y0);
  return p;
}
type Hole = { cx: number; y0: number; w: number; h: number; pointed?: boolean };
/* a wall with its openings cut through, one extrusion, base at y 0, centred on x, depth on z */
function holedWall(w: number, h: number, depth: number, holes: Hole[]) {
  const s = new T.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.closePath();
  for (const o of holes) {
    const p = new T.Path();
    if (o.pointed) pointed(p, o.cx, o.y0, o.w, o.h);
    else { p.moveTo(o.cx - o.w / 2, o.y0); p.lineTo(o.cx + o.w / 2, o.y0); p.lineTo(o.cx + o.w / 2, o.y0 + o.h); p.lineTo(o.cx - o.w / 2, o.y0 + o.h); p.closePath(); }
    s.holes.push(p);
  }
  const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 10 });
  g.translate(0, 0, -depth / 2);
  return g;
}
/* a triangular gable, or a roof prism when deep */
function gableGeo(w: number, h: number, depth: number) {
  const s = new T.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
  const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: false });
  g.translate(0, 0, -depth / 2);
  return g;
}
/* a park bench along x, merged with everything else of its material; face +1 looks toward +z */
function parkBench(k: K, x: number, z: number, face: number, slats: T.Material, frame: T.Material, len = 2.4) {
  for (let j = 0; j < 4; j++) k.box(len, 0.05, 0.12, x, 0.62, z + face * (j * 0.15 - 0.22), slats);
  for (let j = 0; j < 3; j++) k.box(len, 0.13, 0.05, x, 0.85 + j * 0.15, z - face * (0.42 + j * 0.02), slats);
  for (const dx of [-len / 2 + 0.2, len / 2 - 0.2]) { k.box(0.07, 0.06, 0.72, x + dx, 0.6, z - face * 0.05, frame); k.box(0.07, 0.6, 0.06, x + dx, 0.3, z + face * 0.28, frame); k.box(0.07, 1.25, 0.06, x + dx, 0.62, z - face * 0.42, frame); }
  k.keepOut.push({ x, z, r: 0.9 });
}
/* cars on a road running along x: one instanced mesh, wrapping at the ends */
function traffic(k: K, lanes: { z: number; dir: number; n: number; speed: number }[], seed: number, animate: boolean, span = 80) {
  const b = new T.BoxGeometry(4.3, 0.8, 1.8); b.translate(0, 0.7, 0);
  const c = new T.BoxGeometry(2.3, 0.62, 1.62); c.translate(-0.2, 1.4, 0);
  const w = new T.BoxGeometry(3.4, 0.55, 1.9); w.translate(0, 0.3, 0);
  const g = mergeGeometries([b, c, w])!;
  const cars: { lane: number; x: number; v: number }[] = [];
  const r = X.mulberry(seed);
  lanes.forEach((l, li) => { for (let i = 0; i < l.n; i++) cars.push({ lane: li, x: -span + (i + r() * 0.6) * ((2 * span) / l.n), v: l.speed * (0.85 + r() * 0.3) }); });
  const o = k.instances(g, new T.MeshStandardMaterial({ roughness: 0.35, metalness: 0.4 }), cars.map(() => new T.Matrix4()));
  o.frustumCulled = false;
  const pal = [0xf2c21a, 0x1a1c20, 0xe8e8e8, 0x8a9098, 0x2a3a5a, 0x7a1e1e, 0xf2c21a, 0x3a3e44];
  const col = new T.Color(), m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), one = new T.Vector3(1, 1, 1), up = new T.Vector3(0, 1, 0);
  cars.forEach((cc, i) => o.setColorAt(i, col.set(pal[Math.floor(r() * pal.length)])));
  if (o.instanceColor) o.instanceColor.needsUpdate = true;
  const place = (_t: number, dt: number) => {
    cars.forEach((cc, i) => {
      const l = lanes[cc.lane];
      cc.x += l.dir * cc.v * Math.min(dt, 0.1);
      if (cc.x > span) cc.x -= 2 * span; else if (cc.x < -span) cc.x += 2 * span;
      q.setFromAxisAngle(up, l.dir > 0 ? 0 : PI);
      p.set(cc.x, -0.1, l.z); m.compose(p, q, one); o.setMatrixAt(i, m);
    });
    o.instanceMatrix.needsUpdate = true;
  };
  place(0, 0);
  if (animate) k.ticks.push(place);
}

/* ---------------- 159 SEVEN SEVENTY ---------------- */
export const chabad770: RoomDef = {
  id: 'chabad770',
  name: 'Seven seventy',
  area: '770 EASTERN PARKWAY / CROWN HEIGHTS',
  mood: 'Afternoon on the Parkway, the hall below full',
  color: '#9a4a3a',
  daylit: true,
  description: 'The red brick house on Eastern Parkway with its three gables, built in 1920 as a doctor\'s office and bought by Chabad Lubavitch in 1940, now copied in dozens of cities round the world. Across the service road the Parkway malls run under the plane trees with their benches, and down the stair the great study hall is full: students learning in pairs at long tables, the tiered stands along the wall, the lamp lit before the ark. The New Yorkers stand on boards along the sidewalk and hang in the entrance hall and on the stair, never in the hall itself.',
  signatures: 'The three storey Gothic Revival front of 1920 by Edwin Kline in red brick with stone trim and three gables, the stoop and the pointed arch door, the low building next door over the synagogue, Eastern Parkway by Olmsted and Vaux with its service road, malls, benches and plane trees, the stair down to the study hall with its long tables and benches, the tiered stands, the bimah, the ark and the eternal light, and the shelves of books.',
  build(k, ctx) {
    k.sky({ top: 0x4a86d0, horizon: 0xc4d8ea, ground: 0x8a8478, fog: 0.0024, sun: { az: 2.6, el: 0.7, color: 0xfff2dc, size: 8 }, env: 0.7 });
    k.hemi(0xdce8ff, 0x8a8478, 1.15);
    k.sun(0xfff0d8, 2.3, -40, 70, 60, true, 80);
    const brick = k.pbr('c7Brick', X.brick(0x7e3a2a, 71), 0.9, { roughness: 0.9 }),
      stone = k.pbr('c7Stone', X.ashlar(0xd8cbb0, 72, 4), 0.45, { roughness: 0.8 }),
      slate = k.flat(0x3c3a3c, 0.1, 0.8), glass = k.glass(0x8aa2b4, 0.55, 0.08), backing = k.flat(0x2a2320, 0, 0.9),
      walk = k.pbr('c7Walk', X.pavers(0x9e9a90, 73), 0.45), mall = k.pbr('c7Mall', X.pavers(0x85827a, 74), 0.8),
      road = k.pbr('c7Road', X.asphalt(0x2c2f33), 0.2), curb = k.flat(0xaaa69c, 0, 0.8), iron = k.flat(0x1a1c1e, 0.6, 0.45),
      grass = k.pbr('c7Grass', X.grass(0x4e6a3a, 75), 0.4, { roughness: 1 }),
      aptA = k.pbr('c7AptA', X.windows(31, 0.06, 0x6e3c2e, false), 0.13, { emissive: 0xffffff, emissiveIntensity: 0.08 + 1.4 * k.night, roughness: 0.8, stretch: 0.5 }),
      aptB = k.pbr('c7AptB', X.windows(32, 0.06, 0x8a6a4e, false), 0.13, { emissive: 0xffffff, emissiveIntensity: 0.08 + 1.4 * k.night, roughness: 0.8, stretch: 0.5 }),
      annexM = k.pbr('c7Annex', X.brick(0xb09a7a, 76), 0.9), roofTop = k.flat(0x2e2e30, 0.1, 0.9),
      terr = k.pbr('c7Terr', X.terrazzo(0xcdc4ae, 77), 1.4, { roughness: 0.5 }), plaster = k.pbr('c7Plas', X.plaster(0xe6decb, 78), 0.4),
      wood = k.pbr('c7Wood', X.planks(0x5c3c26, 6, 79), 0.7, { roughness: 0.7 }), darkWood = k.flat(0x3a2618, 0, 0.6),
      hallFloor = k.pbr('c7HFloor', X.terrazzo(0xb8ae9a, 80), 1.2, { roughness: 0.85 }), hallWall = k.pbr('c7HWall', X.plaster(0xe0d6c0, 81), 0.35),
      tableTop = k.flat(0xa88a62, 0, 0.55), bench = k.flat(0x4a3020, 0, 0.7), book = k.flat(0xe8e0cc, 0, 0.9), bookDark = k.flat(0x3a2a22, 0, 0.8),
      velvet = k.pbr('c7Velvet', X.velvet(0x1c2858), 1.2), gold = k.flat(0xc8a24a, 0.85, 0.35), fluor = k.glow(0xf6f4ea),
      shelfM = new T.MeshStandardMaterial({ map: spines(770), roughness: 0.8 }), board = k.flat(0x1c1e22, 0.2, 0.6), post = k.flat(0x24282e, 0.7, 0.4);

    /* ----- Eastern Parkway: sidewalk, service road, the mall, the main road, the far mall and the far side ----- */
    k.box(140, 0.2, 6, 0, -0.1, -7, walk);                 // sidewalk z -10 .. -4
    k.box(140, 0.2, 6, 0, -0.22, -1, road);                // service road -4 .. 2
    k.box(140, 0.24, 0.3, 0, -0.08, -4, curb); k.box(140, 0.24, 0.3, 0, -0.08, 2, curb);
    k.box(140, 0.2, 6, 0, -0.1, 5, mall);                  // the mall 2 .. 8
    for (const z of [2.6, 7.4]) k.box(140, 0.06, 0.9, 0, 0.02, z, grass);
    k.box(140, 0.24, 0.3, 0, -0.08, 8, curb);
    k.box(140, 0.2, 14, 0, -0.22, 15, road);               // the main road 8 .. 22
    for (let x = -66; x < 70; x += 6) { k.box(3, 0.012, 0.14, x, -0.11, 15, k.flat(0xe8e2c8, 0, 0.8)); }
    k.box(140, 0.2, 6, 0, -0.1, 25, mall); k.box(140, 0.24, 0.3, 0, -0.08, 22, curb); k.box(140, 0.24, 0.3, 0, -0.08, 28, curb);
    k.box(140, 0.2, 6, 0, -0.22, 31, road); k.box(140, 0.2, 5, 0, -0.1, 36.5, walk);
    /* the far side: prewar apartment houses facing the Parkway */
    { const r = X.mulberry(77); let x = -66; while (x < 66) { const w = 14 + r() * 10, h = 16 + r() * 8; k.box(w - 0.4, h, 14, x + w / 2, h / 2, 46, r() > 0.5 ? aptA : aptB); k.box(w, 0.8, 14.4, x + w / 2, h + 0.4, 46, roofTop); x += w; } }
    /* plane trees down both malls and along the sidewalk */
    const rt = X.mulberry(1874);
    for (let x = -42; x <= 42; x += 7) {
      for (const z of [2.6, 7.4, 22.6]) { if (x === 0 && z === 2.6) continue; k.tree(x + (rt() - 0.5) * 1.2, 0, z, { h: 9.5 + rt() * 2, r: 3.0 + rt() * 0.8, kind: 'round', seed: Math.round(x * 3 + z), leaf: [0x3f6a34, 0x4a7236, 0x36602e][Math.floor(rt() * 3)] }); if (z < 10) k.keepOut.push({ x, z, r: 0.45 }); }
    }
    /* benches facing the walk on the near mall, and lamp posts */
    const slat = k.flat(0x3e5a3a, 0, 0.7);
    for (const x of [-24, -16, -4, 10, 18, 26]) parkBench(k, x, 3.25, 1, slat, iron);
    for (const x of [-20, 14]) parkBench(k, x, 6.75, -1, slat, iron);
    for (const x of [-28, -7, 6, 28]) { k.lathe([[0.16, 0], [0.16, 0.1], [0.07, 0.3], [0.05, 4.2], [0.08, 4.4]], x, 0, -4.4, iron, 8); k.sphere(0.26, x, 4.6, -4.4, k.glow(0xfff0c8), 10); k.keepOut.push({ x, z: -4.4, r: 0.35 }); }

    /* ----- 770: the house, x -9 .. 9, front at z -10 ----- */
    const HF = -10, HD = 14, WALL = 0.5;
    const holes: Hole[] = [{ cx: 0, y0: 1.2, w: 2.3, h: 3.2, pointed: true }];
    for (const x of [-6.6, -4.4, 4.4, 6.6]) holes.push({ cx: x, y0: 2.0, w: 1.5, h: 2.3, pointed: true });
    for (const x of [-6.6, -4.4, -1.1, 1.1, 4.4, 6.6]) { holes.push({ cx: x, y0: 5.4, w: 1.5, h: 2.1 }); holes.push({ cx: x, y0: 8.3, w: 1.5, h: 1.7 }); }
    k.mesh(holedWall(18, 10.5, WALL, holes), brick, 0, 0, HF - WALL / 2);
    /* glass in the openings, the interior behind the upper floors kept dark */
    for (const s of [-1, 1]) k.plane(7.2, 3.2, s * 4.9, 2.8, HF - 0.3, glass);
    k.box(17.4, 5.4, 0.1, 0, 7.6, HF - 0.8, backing);
    k.plane(17, 5.2, 0, 7.6, HF - 0.3, glass);
    /* stone: the water table, band courses, window surrounds, mullions and the door surround */
    k.box(18.4, 1.2, 0.3, 0, 0.6, HF + 0.12, stone);
    for (const y of [4.85, 7.85, 10.5]) k.box(18.4, 0.26, 0.26, 0, y, HF + 0.1, stone);
    for (const hh of holes) {
      if (hh.pointed && hh.cx === 0) continue;
      k.box(hh.w + 0.4, 0.16, 0.3, hh.cx, hh.y0 - 0.06, HF + 0.12, stone);
      k.box(0.12, hh.h - 0.1, 0.12, hh.cx, hh.y0 + hh.h / 2, HF - 0.25, stone);
      if (!hh.pointed) { k.box(hh.w + 0.3, 0.2, 0.2, hh.cx, hh.y0 + hh.h + 0.1, HF + 0.06, stone); k.box(hh.w, 0.08, 0.1, hh.cx, hh.y0 + hh.h * 0.62, HF - 0.25, stone); }
      else k.box(hh.w, 0.08, 0.1, hh.cx, hh.y0 + hh.h * 0.45, HF - 0.25, stone);
    }
    { const s = new T.Shape(); pointed(s, 0, 0, 3.3, 3.8); s.lineTo(1.65, 0); const hole = new T.Path(); pointed(hole, 0, 0, 2.3, 3.2); s.holes.push(hole); const g = new T.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: false, curveSegments: 10 }); k.mesh(g, stone, 0, 1.2, HF - 0.05); }
    k.box(1.4, 0.4, 0.1, 0, 5.2, HF + 0.08, stone);
    k.sign('770', 1.2, 0.34, 0, 5.2, HF + 0.14, '#d8cbb0', '#3a2a22', 190, 0);
    /* the three gables, with their stone copings and a small window each */
    for (const gx of [-6, 0, 6]) {
      k.mesh(gableGeo(6, 3.9, WALL), brick, gx, 10.5, HF - WALL / 2);
      const L = Math.hypot(3, 3.9), ang = Math.atan2(3.9, 3);
      for (const s of [-1, 1]) { const o = k.box(L + 0.3, 0.3, 0.7, gx + s * 1.5, 12.45, HF - 0.2, stone); o.rotation.z = -s * ang; }
      k.box(0.5, 0.5, 0.5, gx, 14.45, HF - 0.2, stone);
      { const s = new T.Shape(); pointed(s, 0, 0, 0.9, 1.3); s.lineTo(0.45, 0); k.mesh(new T.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: false }), backing, gx, 11.0, HF + 0.02); }
      k.box(1.2, 0.14, 0.26, gx, 10.95, HF + 0.1, stone);
    }
    /* sides, back, and the pitched slate roof behind the gables */
    for (const s of [-1, 1]) k.box(WALL, 10.5, HD, s * 8.75, 5.25, HF - HD / 2, brick);
    k.mesh(holedWall(18, 10.5, WALL, [{ cx: 0, y0: 0, w: 6, h: 4.6 }]), brick, 0, 0, HF - HD + WALL / 2);
    for (const s of [-1, 1]) { const L = Math.hypot(HD / 2, 4), o = k.box(18.6, 0.3, L + 0.4, 0, 10.5 + 2, HF - HD / 2 + s * HD / 4, slate); o.rotation.x = s * Math.atan2(4, HD / 2); }
    for (const s of [-1, 1]) k.mesh(gableGeo(HD, 4, 0.5), brick, s * 8.75, 10.5, HF - HD / 2).rotation.y = PI / 2;
    for (const [x, z] of [[-5, -17], [5, -21]]) k.box(1.2, 2.4, 1.2, x, 14.2, z, brick);
    /* the stoop: five stone steps up to the door, cheek walls and iron rails */
    for (let i = 0; i < 5; i++) k.box(4.4, 0.24 * (i + 1), 0.6, 0, 0.12 * (i + 1), -7.3 - i * 0.6, stone);
    k.box(4.4, 1.2, 0.6, 0, 0.6, HF + 0.2, stone);
    for (const s of [-1, 1]) { k.box(0.5, 1.5, 3.2, s * 2.45, 0.75, -8.5, stone); k.beam(v(s * 2.2, 1.0, -7.1), v(s * 2.2, 2.2, -9.9), 0.035, iron); for (const z of [-7.1, -9.9]) k.beam(v(s * 2.2, z < -8 ? 1.2 : 0, z), v(s * 2.2, z < -8 ? 2.2 : 1.0, z), 0.03, iron); }
    k.block(-2.95, -2.2, -10, -6.9); k.block(2.2, 2.95, -10, -6.9);
    /* the door: two oak leaves, one standing open, one swinging on its own as people come and go */
    const leafGeo = new T.BoxGeometry(1.1, 3.0, 0.08); leafGeo.translate(0.55, 1.5, 0);
    const leafL = new T.Mesh(leafGeo, wood), leafR = new T.Mesh(leafGeo, wood);
    leafL.position.set(-1.12, 1.2, HF - 0.35); leafL.rotation.y = 1.35; k.add(leafL);
    const hinge = new T.Group(); hinge.position.set(1.12, 1.2, HF - 0.35); hinge.rotation.y = PI; hinge.add(leafR); k.add(hinge);
    k.block(-8.75, -1.2, HF - 0.55, HF + 0.05); k.block(1.2, 8.75, HF - 0.55, HF + 0.05);

    /* ----- the low building next door, over the synagogue (784 and 788) ----- */
    k.box(28, 8.2, 22, 23.2, 4.1, -21, annexM);
    k.box(28.4, 0.6, 22.4, 23.2, 8.4, -21, stone);
    for (let i = 0; i < 7; i++) { const x = 11.6 + i * 3.9; const wm = k.flat(0x283038, 0.6, 0.18); k.box(2.2, 2.6, 0.1, x, 5.4, -9.95, wm); k.box(2.2, 2.2, 0.1, x, 1.9, -9.95, wm); k.box(2.5, 0.14, 0.24, x, 4.05, -9.9, stone); k.box(2.5, 0.14, 0.24, x, 0.75, -9.9, stone); }
    k.box(28, 0.4, 0.3, 23.2, 3.6, -9.9, stone);
    /* the neighbour to the west: a prewar apartment house */
    k.box(34, 18, 20, -26.3, 9, -20, aptA); k.box(34.4, 0.8, 20.4, -26.3, 18.4, -20, roofTop);
    k.box(34, 1.4, 0.3, -26.3, 0.7, -9.9, stone);
    k.block(-45, -8.0, -36, -9.95); k.block(8.0, 45, -36, -9.95);

    /* ----- the entrance hall inside the door: floor 1.2, ceiling 4.6 ----- */
    const LY = 1.2;
    k.box(17.4, 0.2, 11.6, 0, LY - 0.1, -16.2, terr);
    k.box(17.5, 0.3, 14, 0, 4.75, -17, plaster);
    for (const s of [-1, 1]) { k.box(0.06, 3.4, 11.6, s * 8.47, LY + 1.7, -16.2, plaster); k.box(0.1, 1.0, 11.6, s * 8.42, LY + 0.5, -16.2, wood); }
    k.box(17.4, 3.4, 0.06, 0, LY + 1.7, HF - 0.53, plaster);
    for (const s of [-1, 1]) { k.box(5.6, 3.4, 0.3, s * 5.85, LY + 1.7, -22, plaster); k.box(5.6, 1.0, 0.1, s * 5.85, LY + 0.5, -21.8, wood); }
    for (const [x, z] of [[-4, -13], [4, -13], [-4, -19], [4, -19]]) { k.box(1.2, 0.08, 0.3, x, 4.56, z, fluor); }
    k.point(0, 4.0, -13, 0xfff2dc, 10, 14); k.point(0, 4.0, -19, 0xfff2dc, 10, 14);
    /* a bench and a coat rack by the door, doors to the side rooms (no frames on them) */
    k.box(0.5, 0.5, 3.4, -7.9, LY + 0.25, -12.6, bench); k.keepOut.push({ x: -7.9, z: -12.6, r: 0.5 });
    for (const [x, z] of [[8.4, -11.6], [-8.4, -20.4]]) k.box(0.1, 2.6, 1.2, x * 0.99, LY + 1.3, z, darkWood);

    /* ----- the stair down, x -3 .. 3, z -22 .. -36, 1.2 to -4.5 ----- */
    const HY = -4.5, fStair = (z: number) => LY + ((z + 22) * (LY - HY)) / 14;
    for (let i = 0; i < 28; i++) { const z0 = -22 - i * 0.5, y = fStair(z0 - 0.5); k.box(6, 0.22, 0.5, 0, y - 0.11, z0 - 0.25, stone); }
    for (const s of [-1, 1]) {
      k.box(0.3, 11, 14, s * 3.15, -0.7, -29, plaster);
      k.beam(v(s * 2.85, LY + 1.0, -22), v(s * 2.85, HY + 1.0, -36), 0.04, gold);
    }
    { const c = k.mesh(new T.PlaneGeometry(6.6, Math.hypot(14, LY - HY) + 0.6), plaster, 0, fStair(-29) + 3.4, -29); c.rotation.x = PI / 2 - Math.atan2(LY - HY, 14); }
    for (let i = 0; i < 4; i++) { const z = -24 - i * 3.6, f = k.box(1.2, 0.08, 0.3, 0, fStair(z) + 3.38, z, fluor); f.rotation.x = -Math.atan2(LY - HY, 14); }
    k.point(0, fStair(-27) + 2.6, -27, 0xfff2dc, 5, 9); k.point(0, fStair(-33) + 2.6, -33, 0xfff2dc, 5, 9);
    k.block(-8.0, -3, -36, -22); k.block(3, 8.0, -36, -22);

    /* ----- the study hall: x -22 .. 24, z -36 .. -68, floor -4.5, ceiling 1.5 ----- */
    const HX0 = -22, HX1 = 24, HZ0 = -36, HZ1 = -68, HC = 1.5;
    k.box(HX1 - HX0, 0.3, HZ0 - HZ1, (HX0 + HX1) / 2, HY - 0.15, (HZ0 + HZ1) / 2, hallFloor);
    k.box(HX1 - HX0 + 1, 0.4, HZ0 - HZ1 + 1, (HX0 + HX1) / 2, HC + 0.2, (HZ0 + HZ1) / 2, hallWall);
    for (const [x0, x1] of [[HX0, -3.3], [3.3, HX1]]) k.box(x1 - x0, HC - HY, 0.4, (x0 + x1) / 2, (HC + HY) / 2, HZ0 + 0.2, hallWall);
    k.box(6.6, HC - (HY + 3.4), 0.4, 0, (HC + HY + 3.4) / 2, HZ0 + 0.2, hallWall);
    k.box(HX1 - HX0, HC - HY, 0.4, (HX0 + HX1) / 2, (HC + HY) / 2, HZ1 - 0.2, hallWall);
    for (const x of [HX0 - 0.2, HX1 + 0.2]) k.box(0.4, HC - HY, HZ0 - HZ1, x, (HC + HY) / 2, (HZ0 + HZ1) / 2, hallWall);
    /* wood wainscot all round */
    k.box(HX1 - HX0, 1.2, 0.1, (HX0 + HX1) / 2, HY + 0.6, HZ1 + 0.05, wood);
    k.box(0.1, 1.2, HZ0 - HZ1, HX1 - 0.05, HY + 0.6, (HZ0 + HZ1) / 2, wood);
    /* the fluorescent strips in rows across the ceiling, and the light they give */
    for (let x = -18; x <= 21; x += 6) for (let z = -39; z >= -65; z -= 4.5) k.box(0.3, 0.08, 2.4, x, HC - 0.04, z, fluor);
    for (const [x, z] of [[-12, -44], [10, -44], [-12, -60], [10, -60], [0, -52], [20, -52]]) k.point(x, HC - 0.9, z, 0xf4f1e6, 20, 22);
    /* columns */
    for (const x of [-4.4, 4.4, 19.6]) for (const z of [-46.75, -60.25]) { k.box(0.7, HC - HY, 0.7, x, (HC + HY) / 2, z, hallWall); k.box(0.74, 1.2, 0.74, x, HY + 0.6, z, wood); k.keepOut.push({ x, z, r: 0.6 }); }
    /* books: shelves down the east wall and either side of the stair */
    const shelf = (w: number, x: number, z: number, rotY: number) => { const o = k.box(w, 3.2, 0.5, x, HY + 1.6, z, darkWood); o.rotation.y = rotY; const f = k.mesh(new T.PlaneGeometry(w - 0.2, 3.0), shelfM, x + Math.sin(rotY) * 0.26, HY + 1.6, z + Math.cos(rotY) * 0.26); f.rotation.y = rotY; };
    for (let z = -39; z >= -65; z -= 4.3) shelf(4, HX1 - 0.3, z, -PI / 2);
    for (const x of [-18, -12, -7, 8, 13, 19]) shelf(4.6, x, HZ0 - 0.3, PI);
    k.block(HX1 - 0.6, HX1, HZ1, HZ0);
    /* the ark on the south wall, curtained in plain blue velvet, and the eternal light before it */
    k.box(12, 0.6, 4, 0, HY + 0.3, HZ1 + 2, stone);
    for (let i = 0; i < 2; i++) k.box(4, 0.3, 0.5, 0, HY + 0.15 + i * 0.3 - 0.0, HZ1 + 4.25 - i * 0.5, stone);
    k.box(6.2, 4.6, 1.2, 0, HY + 0.6 + 2.3, HZ1 + 0.7, darkWood);
    k.box(4.2, 3.4, 0.1, 0, HY + 0.6 + 2.0, HZ1 + 1.32, velvet);
    k.box(4.2, 0.14, 0.12, 0, HY + 0.6 + 0.4, HZ1 + 1.35, gold); k.box(4.2, 0.14, 0.12, 0, HY + 0.6 + 3.6, HZ1 + 1.35, gold);
    for (const s of [-1, 1]) { k.box(0.14, 3.34, 0.12, s * 2.04, HY + 2.6, HZ1 + 1.35, gold); k.cyl(0.24, 4.6, s * 2.8, HY + 2.9, HZ1 + 1.4, wood, 0.24, 12); }
    k.box(6.8, 0.5, 1.6, 0, HY + 5.35, HZ1 + 0.8, darkWood);
    k.block(-6, 6, HZ1, HZ1 + 3.8);
    const nerY = HY + 4.6, nerZ = HZ1 + 3.4;
    k.beam(v(0, HC, nerZ), v(0, nerY + 0.3, nerZ), 0.012, gold, 4);
    k.lathe([[0.02, 0], [0.2, 0.08], [0.24, 0.26], [0.18, 0.34]], 0, nerY - 0.1, nerZ, gold, 14);
    const ner = k.sphere(0.13, 0, nerY + 0.12, nerZ, k.glow(0xff7a2a), 10);
    const nerL = k.point(0, nerY, nerZ + 0.3, 0xff9a4a, 9, 8);
    /* the bimah in the middle: a raised platform with its rail and the reading desk */
    const BZ = -51.5;
    k.box(4.4, 0.7, 4.4, 0, HY + 0.35, BZ, wood);
    for (const s of [-1, 1]) { k.box(4.4, 0.1, 0.1, 0, HY + 1.7, BZ + s * 2.15, darkWood); k.box(0.1, 0.1, 4.4, s * 2.15, HY + 1.7, BZ, darkWood); }
    for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2, rr = 2.15; const x = Math.max(-rr, Math.min(rr, Math.cos(a) * rr * 1.5)), z = Math.max(-rr, Math.min(rr, Math.sin(a) * rr * 1.5)); k.box(0.08, 1.0, 0.08, x, HY + 1.2, BZ + z, darkWood); }
    { const d = k.box(2.2, 0.1, 1.2, 0, HY + 1.85, BZ, darkWood); d.rotation.x = -0.25; k.box(1.8, 1.1, 0.9, 0, HY + 1.25, BZ, darkWood); }
    k.keepOut.push({ x: 0, z: BZ, r: 3.1 });
    /* the tiered stands along the west wall */
    const tiers = 5;
    for (let t = 0; t < tiers; t++) { const x0 = HX0 + (tiers - 1 - t) * 1.1; k.box(1.1, 0.5 * (t + 1), 26, x0 + 0.55, HY + 0.25 * (t + 1), -52, wood); }
    k.block(HX0, HX0 + tiers * 1.1 + 0.3, -65, -39);
    /* the long tables and their benches, with open books */
    const rows = [-40, -44.5, -49, -53.5, -58, -62.5], segs: [number, number][] = [[-15.2, -4.6], [4.6, 18.6]];
    const who: Person[] = [], rp = X.mulberry(5770);
    const coats = [0x141518, 0x141518, 0x1a1b20, 0x1a1b20, 0xe6e4de, 0x2a2c32];
    for (const z of rows) for (const [x0, x1] of segs) {
      const cx = (x0 + x1) / 2, L = x1 - x0;
      if (Math.abs(z - BZ) < 3 && x0 < 0 && x1 > 0) continue;
      k.box(L, 0.08, 1.0, cx, HY + 0.78, z, tableTop); k.box(L - 0.4, 0.7, 0.2, cx, HY + 0.38, z, darkWood);
      for (const s of [-1, 1]) k.box(L, 0.45, 0.38, cx, HY + 0.22, z + s * 0.85, bench);
      k.block(x0 - 0.2, x1 + 0.2, z - 1.15, z + 1.15);
      for (let x = x0 + 0.5; x < x1 - 0.3; x += 0.85) {
        const pair = rp() < 0.72;
        for (const s of [-1, 1]) {
          if (pair) who.push({ x: x + (rp() - 0.5) * 0.1, y: HY - 0.32, z: z + s * 0.86, yaw: s > 0 ? PI : 0, coat: coats[Math.floor(rp() * coats.length)], skin: SKINS[Math.floor(rp() * 4)], hat: rp() < 0.6, ph: rp() * 6.3, sway: 0.07 + rp() * 0.06 });
        }
        if (pair || rp() < 0.3) { const bk = k.box(0.5, 0.03, 0.34, x, HY + 0.835, z + (rp() - 0.5) * 0.3, book); bk.rotation.y = (rp() - 0.5) * 0.3; }
        if (rp() < 0.35) k.box(0.3, 0.26, 0.2, x + 0.3, HY + 0.95, z, bookDark);
      }
    }
    /* standing on the stands, and a few at the bimah and the shelves */
    for (let t = 0; t < tiers; t++) { const x = HX0 + (tiers - 1 - t) * 1.1 + 0.55; for (let z = -64; z < -40; z += 0.75) if (rp() < 0.55) who.push({ x, y: HY + 0.5 * (t + 1), z: z + (rp() - 0.5) * 0.2, yaw: -PI / 2 + (rp() - 0.5) * 0.4, coat: coats[Math.floor(rp() * 4)], skin: SKINS[Math.floor(rp() * 4)], hat: rp() < 0.8, ph: rp() * 6.3, sway: 0.03 }); }
    for (const [x, z] of [[-1.2, BZ + 0.6], [1.0, BZ - 0.7], [21.8, -45], [22.2, -57], [-2.6, -38.5]]) who.push({ x, y: HY + (Math.abs(z - BZ) < 1 ? 0.7 : 0), z, yaw: rp() * PI, coat: 0x141518, skin: SKINS[Math.floor(rp() * 4)], hat: true, ph: rp() * 6.3, sway: 0.05 });
    /* on the street: people on the sidewalk and the stoop, a few on the benches */
    for (const [x, z, yaw] of [[-24, 3.5, PI], [-23.4, 3.5, PI], [10.4, 3.5, PI], [18.2, 3.5, PI], [14.4, 6.5, 0]] as [number, number, number][]) who.push({ x, y: -0.35, z, yaw, coat: [0x3a4a6a, 0x8a3a3a, 0xd8d0c0, 0x2a2a2a, 0x4a6a3a][Math.floor(rp() * 5)], skin: SKINS[Math.floor(rp() * 6)], hat: false, ph: rp() * 6, sway: 0 });
    people(k, who, !ctx.reduced);
    k.crowd([v(-3.2, HY, -37.5), v(-3.4, HY, -44), v(-3.2, HY, -50), v(3.4, HY, -56), v(3.2, HY, -63)], 7, { seed: 7, speed: 0.8, spread: 0.6, scale: FS, colors: [0x141518, 0x1a1b20, 0x141518], animate: !ctx.reduced });
    k.crowd([v(21.5, HY, -38), v(21.5, HY, -66)], 4, { seed: 8, speed: 0.7, spread: 0.4, scale: FS, colors: [0x141518, 0x1a1b20], animate: !ctx.reduced });
    k.crowd([v(-44, 0, -6.2), v(-3.6, 0, -6.2), v(0, 0, -6.6), v(0, 1.2, -10.4), v(0, 1.2, -15), v(3, 1.2, -19)], 7, { seed: 9, speed: 0.9, spread: 0.7, scale: FS, colors: [0x141518, 0x1a1b20, 0x2a2c32, 0xe6e4de], animate: !ctx.reduced });
    k.crowd([v(-60, 0, -5.2), v(60, 0, -5.2)], 16, { seed: 10, speed: 1.1, spread: 1.4, scale: FS, animate: !ctx.reduced });
    k.crowd([v(-60, 0, 5.0), v(60, 0, 5.0)], 12, { seed: 11, speed: 1.0, spread: 1.2, scale: FS, animate: !ctx.reduced });
    /* traffic on the service road (one way) and both directions on the main road */
    traffic(k, [{ z: -1.2, dir: 1, n: 5, speed: 6 }, { z: 10.8, dir: -1, n: 6, speed: 11 }, { z: 13.6, dir: -1, n: 5, speed: 9 }, { z: 16.6, dir: 1, n: 5, speed: 10 }, { z: 19.4, dir: 1, n: 6, speed: 12 }, { z: 32, dir: -1, n: 4, speed: 6 }], 770, !ctx.reduced);
    /* pigeons: some on the sidewalk pecking, a small flock wheeling over the mall */
    {
      const pg = (() => { const b = new T.SphereGeometry(0.13, 6, 5); b.scale(1, 0.8, 1.5); const h = new T.SphereGeometry(0.07, 6, 5); h.translate(0, 0.1, 0.17); const w = new T.BoxGeometry(0.5, 0.02, 0.14); w.translate(0, 0.02, -0.02); return mergeGeometries([b, h, w])!; })();
      const N = 22, o = k.instances(pg, new T.MeshStandardMaterial({ color: 0x7a7e88, roughness: 0.8 }), Array.from({ length: N }, () => new T.Matrix4()));
      o.frustumCulled = false;
      const rr = X.mulberry(3), birds = Array.from({ length: N }, (_, i) => ({ fly: i < 9, x: -12 + rr() * 24, z: i % 2 ? -6 + rr() * 1.5 : 4 + rr() * 2, ph: rr() * 6.3 }));
      const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), e = new T.Euler(), one = new T.Vector3(1, 1, 1);
      const place = (t: number) => {
        birds.forEach((b, i) => {
          if (b.fly) { const a = t * 0.45 + b.ph * 0.25; p.set(-2 + Math.cos(a) * 14 + Math.sin(b.ph) * 1.5, 7 + Math.sin(t * 0.6 + b.ph) * 1.2, 1 + Math.sin(a) * 8); e.set(0, -a, Math.sin(t * 9 + b.ph) * 0.25); }
          else { p.set(b.x + Math.sin(t * 0.2 + b.ph) * 0.6, 0.12 + Math.max(0, Math.sin(t * 3 + b.ph)) * 0.02, b.z); e.set(Math.max(0, Math.sin(t * 2.3 + b.ph)) * 0.5, b.ph, 0); }
          q.setFromEuler(e); m.compose(p, q, one); o.setMatrixAt(i, m);
        });
        o.instanceMatrix.needsUpdate = true;
      };
      place(0);
      if (!ctx.reduced) k.ticks.push(place);
    }
    /* the door that swings, and the eternal light that breathes a little */
    if (!ctx.reduced) k.ticks.push((t) => {
      const u = (t % 14) / 14, open = u < 0.1 ? u / 0.1 : u < 0.45 ? 1 : u < 0.6 ? 1 - (u - 0.45) / 0.15 : 0;
      hinge.rotation.y = PI - open * 1.25;
      const f = 1 + 0.06 * Math.sin(t * 7.3) + 0.04 * Math.sin(t * 13.1);
      ner.scale.setScalar(f); nerL.intensity = 9 * f;
    });

    /* ----- the works ----- */
    const mounts: Mount[] = [];
    /* boards on the sidewalk, standing clear of the house fronts, facing the Parkway */
    for (const s of [-1, 1]) for (const ax of [13, 17.8, 22.6, 27.4, 32.2]) {
      const x = s * ax;
      for (const dx of [-1.25, 1.25]) k.box(0.1, 3.0, 0.1, x + dx, 1.5, -8.7, post);
      k.box(2.8, 2.2, 0.1, x, 2.05, -8.7, board);
      k.block(x - 1.45, x + 1.45, -8.95, -8.45);
      mounts.push({ position: v(x, 2.05, -8.62), rotation: 0, target: v(x, 2.05, -5.4), width: 2.3, height: 1.6, style: 'black', wash: true });
    }
    /* the entrance hall: three on the east wall, one each side of the stair opening */
    for (const z of [-13.2, -16.6, -20.0]) mounts.push({ position: v(8.4, LY + 1.95, z), rotation: -PI / 2, target: v(5.2, LY + 1.95, z), width: 2.1, height: 1.5, style: 'oak', wash: true });
    for (const s of [-1, 1]) mounts.push({ position: v(s * 5.85, LY + 1.95, -21.83), rotation: 0, target: v(s * 5.85, LY + 1.95, -18.6), width: 2.1, height: 1.5, style: 'oak', wash: true });
    k.censusWall({ x: -8.42, y: LY + 2.1, z: -16.4, rotY: PI / 2, cols: 14, rows: 5, tile: 0.46, gap: 0.04, start: ctx.wallStart(2700, 70), pieces: ctx.all, backing: darkWood });
    /* down the stair, two each side */
    for (const s of [-1, 1]) for (const z of [-26, -31.5]) mounts.push({ position: v(s * 2.98, fStair(z) + 1.9, z), rotation: s > 0 ? -PI / 2 : PI / 2, target: v(0, fStair(z) + 1.9, z), width: 1.7, height: 1.25, style: 'oak', wash: true });

    /* ----- what the house knows ----- */
    const src = { name: '770 Eastern Parkway, Wikipedia', url: 'https://en.wikipedia.org/wiki/770_Eastern_Parkway' };
    k.egg(v(-6.6, 6.5, -9.7), { id: 'kline-1920', title: 'A doctor\'s office in 1920', year: '1920', text: 'The house was built in 1920 to a design by the architect Edwin Kline, in the Collegiate Gothic Revival style, and it was first a medical office.', clue: 'Look at the windows with the pointed tops and ask who drew them.', source: src }, { r: 1.8 });
    k.egg(v(0, 2.8, -9.8), { id: 'bought-1940', title: 'Bought in 1940', year: '1940', text: 'In 1940 the building was bought by Agudas Chasidei Chabad for the Chabad Lubavitch movement, as a home for Rabbi Yosef Yitzchak Schneersohn on his arrival in the United States that year. Through the 1940s it became the movement\'s centre: synagogue, yeshiva and offices.', clue: 'Climb the stoop and stop at the door.', source: src }, { r: 1.3 });
    k.egg(v(0, 12.6, -9.9), { id: 'replicas', title: 'The same front, far from here', year: '1986', text: 'Over 55 buildings round the world copy this one, most of them borrowing the three gables. The first was built in Kfar Chabad, Israel, in 1986; others stand in Los Angeles, Melbourne, Jerusalem, Chicago, Buenos Aires and Milan.', clue: 'Count the peaks on the roofline.', source: { name: '770 Eastern Parkway replicas, Wikipedia', url: 'https://en.wikipedia.org/wiki/770_Eastern_Parkway_replicas' } }, { r: 1.8 });
    k.egg(v(-4, 0.8, 3.25), { id: 'first-parkway', title: 'The first parkway', year: '1870', text: 'Frederick Law Olmsted and Calvert Vaux laid out Eastern Parkway, built between 1870 and 1874 and credited as the world\'s first parkway: a main road and two service roads separated by landscaped malls, first planted with 1,100 trees. It became a city scenic landmark in 1978.', clue: 'Sit on the bench and look at the trees in their rows.', source: { name: 'Eastern Parkway, Wikipedia', url: 'https://en.wikipedia.org/wiki/Eastern_Parkway' } }, { r: 1.2 });
    k.egg(v(HX0 + 2.8, HY + 2.8, -52), { id: 'under-784', title: 'The hall under the neighbours', year: '1960', text: 'The main synagogue is underground and counts as part of 770, though it lies mostly under 784 and 788 Eastern Parkway. The first annex was added in 1960, with more expansions in the late 1960s and the mid 1970s. It is at once a place of daily prayer, a study hall and the assembly hall for Chabad gatherings called farbrengens.', clue: 'Stand at the stands and work out whose building is overhead.', source: src }, { r: 2.4 });
    k.egg(v(-9.9, HY + 1.2, -44.5), { id: 'yeshiva', title: 'A thousand students', text: 'The yeshiva here has approximately 1,000 students, and much of their learning happens at these tables, in pairs.', clue: 'Find two people reading the same page.', source: src }, { r: 2 });

    /* ----- where you can walk: the street floor, the stoop, the hall at 1.2, the stair, the study hall ----- */
    const floorY = (x: number, z: number) => {
      if (z < HZ0) return HY;
      if (z < -22) return Math.abs(x) < 3.4 ? fStair(z) : LY;
      if (z < HF) return LY;
      if (z < -7 && Math.abs(x) < 2.3) return (LY * (-7 - z)) / 3;
      return 0;
    };
    k.block(-45, HX0, HZ1 - 2, HZ0); k.block(HX1, 45, HZ1 - 2, HZ0);
    noShadowsFor(k, [hallFloor, hallWall, tableTop, bench, book, bookDark, velvet, gold, shelfM, darkWood, terr, plaster]);
    return { mounts, spawn: v(3.5, 2.3, 6.9), look: v(-0.5, 6.4, -10), eye: 2.3, floorY, bounds: [-38, 38, HZ1 + 0.4, 7.8], style: 'black' };
  },
};

/* ---------------- 160 THE OHEL ---------------- */
/* a detached Queens house: two storeys, gable to the street */
function house(k: K, x: number, z: number, w: number, d: number, walls: T.Material, roof: T.Material, trim: T.Material, win: T.Material, face = 1) {
  const fz = z + face * (d / 2 + 0.03);
  k.box(w, 6, d, x, 3, z, walls);
  k.mesh(gableGeo(w + 0.8, 3, d + 0.8), roof, x, 6, z);
  for (const s of [-1, 1]) for (const y of [1.7, 4.6]) { k.box(1.3, 1.5, 0.08, x + s * w * 0.25, y, fz, win); k.box(1.5, 0.12, 0.16, x + s * w * 0.25, y - 0.8, fz + face * 0.03, trim); }
  k.box(1.2, 2.3, 0.08, x, 1.15, fz, win);
  k.box(2.6, 0.16, 1.4, x, 2.6, fz + face * 0.67, trim);
}
export const ohel: RoomDef = {
  id: 'ohel',
  name: 'The Ohel',
  area: 'THE OHEL / CAMBRIA HEIGHTS',
  mood: 'A quiet afternoon, candles lit',
  color: '#6f6a5e',
  daylit: true,
  description: 'The resting place of the sixth and seventh Lubavitcher Rebbes in Montefiore Cemetery, Queens, reached through a house on Francis Lewis Boulevard that has been a visitors center, open day and night, since 1995. Visitors write their notes at the tables, walk the covered path between the headstones, light candles on the shelves of the antechamber and stand at the stone enclosure open to the sky. The New Yorkers hang only in the house and along the covered walk; the enclosure is left as it is.',
  signatures: 'The visitors center in a two storey house on Francis Lewis Boulevard with its library and writing tables, the glass doors at the back, the covered walk through Montefiore Cemetery, rows of granite headstones behind an iron fence, the antechamber with its shelves of candles, the stone enclosure with its open roof, and traffic on the boulevard.',
  build(k, ctx) {
    k.sky({ top: 0x5a8ccc, horizon: 0xcfdbe6, ground: 0x8a8478, fog: 0.003, sun: { az: 2.2, el: 0.55, color: 0xfff0d8, size: 8 }, env: 0.6 });
    k.hemi(0xdfe6f2, 0x8a8478, 1.05);
    k.sun(0xfff0d8, 2.0, 50, 55, 40, true, 70);
    const grass = k.pbr('ohGrass', X.grass(0x55703e, 91), 0.35, { roughness: 1 }), walkM = k.pbr('ohWalk', X.pavers(0xa29e94, 92), 0.6),
      road = k.pbr('ohRoad', X.asphalt(0x2e3135), 0.2), curb = k.flat(0xaaa69c, 0, 0.8), iron = k.flat(0x1a1c1e, 0.6, 0.45),
      brick = k.pbr('ohBrick', X.brick(0x9a6a4e, 93), 0.9), siding = k.flat(0xe2ded2, 0, 0.8),
      shingle = k.flat(0x4a4448, 0.05, 0.9), trim = k.flat(0xf2f0ea, 0, 0.6), win = k.flat(0x2a323c, 0.6, 0.18),
      sideA = k.flat(0xcfc6b4, 0, 0.8), sideB = k.flat(0xa8b4b8, 0, 0.8), sideC = k.flat(0xd8c8a8, 0, 0.8),
      floorM = k.pbr('ohFloor', X.planks(0x8a6a4a, 6, 95), 0.8, { roughness: 0.6 }), plaster = k.pbr('ohPlas', X.plaster(0xece4d2, 96), 0.4),
      desk = k.flat(0x6a4a30, 0, 0.6), paper = k.flat(0xf4f0e6, 0, 0.9), chair = k.flat(0x3a2a20, 0, 0.7),
      shelfM = new T.MeshStandardMaterial({ map: spines(1995), roughness: 0.8 }), darkWood = k.flat(0x3a2618, 0, 0.6),
      stoneM = k.pbr('ohStone', X.ashlar(0x8e8c86, 97, 6), 0.9, { roughness: 0.9 }), gravel = k.pbr('ohGravel', X.concrete(0x8a867c, 98), 0.8),
      white = k.flat(0xf0eee8, 0, 0.7), canopy = k.flat(0xeae8e2, 0, 0.8, { side: T.DoubleSide, emissive: 0x4a4844 }), hedge = k.flat(0x2f4a2a, 0, 0.95), glass = k.glass(0xb0c4d0, 0.3, 0.08);

    /* ----- Francis Lewis Boulevard: sidewalk, road, the houses across ----- */
    k.box(90, 0.2, 83.5, 0, -0.12, -23.25, grass);
    k.box(90, 0.2, 3.5, 0, -0.1, 20.25, walkM);
    k.box(90, 0.2, 12, 0, -0.24, 28, road);
    for (const z of [22, 34]) k.box(90, 0.24, 0.3, 0, -0.08, z, curb);
    for (let x = -42; x < 45; x += 6) k.box(3, 0.012, 0.14, x, -0.13, 28, k.flat(0xe8d24a, 0, 0.8));
    k.box(90, 0.2, 3, 0, -0.1, 35.5, walkM); k.box(90, 0.2, 10, 0, -0.12, 42, grass);
    { const r = X.mulberry(160); for (let x = -40; x <= 40; x += 11) house(k, x + (r() - 0.5) * 2, 44, 8.5, 9, [sideA, sideB, sideC][Math.floor(r() * 3)], shingle, trim, win, -1); }
    for (const x of [-12, 12, -26, 26]) k.tree(x, 0, 19.2, { h: 5, r: 2.2, kind: 'round', seed: x + 40, leaf: 0x3f6a34 });
    for (const x of [-12, 12, -26, 26]) k.keepOut.push({ x, z: 19.2, r: 0.5 });
    k.sign('FRANCIS LEWIS BLVD', 2.4, 0.3, 9.6, 3.2, 20.6, '#1f6a3a', '#ffffff', 90, 0, { border: true, double: true });
    k.cyl(0.05, 3.4, 9.6, 1.7, 20.5, iron); k.keepOut.push({ x: 9.6, z: 20.5, r: 0.3 });
    /* the neighbours either side, and their back fences */
    house(k, -20, 8, 11, 12, sideA, shingle, trim, win); house(k, 20, 8, 11, 12, sideB, shingle, trim, win);
    house(k, -34, 8, 10, 12, sideC, shingle, trim, win); house(k, 34, 8, 10, 12, sideA, shingle, trim, win);
    for (const s of [-1, 1]) k.box(0.1, 1.8, 7, s * 9, 0.9, 5.5, white);
    traffic(k, [{ z: 24.6, dir: 1, n: 4, speed: 10 }, { z: 27.2, dir: 1, n: 3, speed: 12 }, { z: 29.2, dir: -1, n: 4, speed: 11 }, { z: 31.6, dir: -1, n: 3, speed: 9 }], 1601, !ctx.reduced, 60);

    /* ----- the visitors center: x -8 .. 8, z 2 .. 16, brick below and siding above ----- */
    const HZ0 = 2, HZ1 = 16, HX = 8, H1 = 3.6;
    k.box(16, 0.1, 14, 0, 0.0, 9, floorM);
    k.box(16.6, 0.3, 14.6, 0, H1 - 0.05, 9, plaster);
    k.box(16.6, 3.0, 14.6, 0, H1 + 1.5 + 0.1, 9, siding);
    k.mesh(gableGeo(17.6, 3.2, 15.6), shingle, 0, H1 + 3.1, 9);
    k.mesh(gableGeo(16.6, 2.9, 0.12), siding, 0, H1 + 3.1, HZ1 + 0.36);
    for (const s of [-1, 1]) { k.box(1.6, 1.4, 0.08, s * 4.2, H1 + 1.6, HZ1 + 0.34, win); k.box(1.8, 0.12, 0.16, s * 4.2, H1 + 0.84, HZ1 + 0.38, trim); }
    /* walls in brick, with plaster skins inside */
    const wallX = (x0: number, x1: number, z: number, y0 = 0, y1 = H1) => { k.box(x1 - x0, y1 - y0, 0.3, (x0 + x1) / 2, (y0 + y1) / 2, z, brick); k.box(x1 - x0, y1 - y0, 0.34, (x0 + x1) / 2, (y0 + y1) / 2, z, plaster); };
    for (const s of [-1, 1]) { k.box(0.3, H1, 14.6, s * (HX + 0.15), H1 / 2, 9, brick); k.box(0.06, H1 - 0.05, 14, s * (HX - 0.03), H1 / 2, 9, plaster); }
    wallX(-HX - 0.3, -1.0, HZ1 + 0.15); wallX(1.0, HX + 0.3, HZ1 + 0.15); wallX(-1.0, 1.0, HZ1 + 0.15, 2.7);
    wallX(-HX - 0.3, -2.5, HZ0 - 0.15); wallX(2.5, HX + 0.3, HZ0 - 0.15); wallX(-2.5, 2.5, HZ0 - 0.15, 3.0);
    wallX(-HX, -3.2, 9); wallX(3.2, HX, 9); wallX(-3.2, 3.2, 9, 2.9);
    /* the brick outside needs its own face over the plaster skin: a thin brick layer on the street and garden faces */
    for (const [x0, x1] of [[-HX - 0.3, -1.0], [1.0, HX + 0.3]]) k.box(x1 - x0, H1, 0.05, (x0 + x1) / 2, H1 / 2, HZ1 + 0.34, brick);
    k.box(2, H1 - 2.7, 0.05, 0, (H1 + 2.7) / 2, HZ1 + 0.34, brick);
    for (const [x0, x1] of [[-HX - 0.3, -2.5], [2.5, HX + 0.3]]) k.box(x1 - x0, H1, 0.05, (x0 + x1) / 2, H1 / 2, HZ0 - 0.34, brick);
    k.box(5, 0.6, 0.05, 0, 3.3, HZ0 - 0.34, brick);
    /* windows in the street front and the side walls */
    for (const s of [-1, 1]) { k.box(2.2, 1.6, 0.08, s * 4.8, 1.7, HZ1 + 0.38, win); k.box(2.5, 0.14, 0.24, s * 4.8, 0.85, HZ1 + 0.4, trim); }
    for (const s of [-1, 1]) for (const z of [5, 12.5]) k.box(0.06, 1.4, 1.8, s * (HX + 0.32), 1.8, z, win);
    /* the porch, the steps and the door standing open */
    k.box(3.6, 0.18, 2.2, 0, 2.95, HZ1 + 1.3, trim);
    for (const s of [-1, 1]) k.box(0.14, 2.9, 0.14, s * 1.6, 1.45, HZ1 + 2.2, trim);
    k.box(3.2, 0.12, 2.2, 0, 0.06, HZ1 + 1.3, curb);
    { const d = k.box(1.0, 2.6, 0.06, -1.0 + 0.1, 1.3, HZ1 - 0.35, darkWood); d.rotation.y = 1.3; d.position.set(-0.8, 1.3, HZ1 - 0.6); }
    k.sign('226-20', 0.9, 0.24, 1.75, 2.35, HZ1 + 0.4, '#f2f0ea', '#2a2a2a', 150, 0);
    k.box(1.2, 0.07, 3.5, 0, -0.01, HZ1 + 2.1, walkM);
    /* the back: glass doors folded open onto the covered walk */
    for (const s of [-1, 1]) { const g = k.box(1.2, 2.9, 0.05, s * 2.2, 1.45, HZ0 - 0.9, glass); g.rotation.y = s * 1.4; }
    /* the front room: the library shelves, the desk, a coat rack; the writing room: two long tables */
    for (const [x0, x1] of [[-7.6, -2.2], [2.2, 7.6]]) { const w = x1 - x0, cx = (x0 + x1) / 2; k.box(w, 2.6, 0.45, cx, 1.3, HZ1 - 0.28, darkWood); const f = k.mesh(new T.PlaneGeometry(w - 0.2, 2.4), shelfM, cx, 1.3, HZ1 - 0.52); f.rotation.y = PI; }
    k.block(-HX, -2.2, HZ1 - 0.6, HZ1); k.block(2.2, HX, HZ1 - 0.6, HZ1);
    k.box(2.4, 1.0, 0.8, -4.6, 0.5, 13.2, desk); k.box(2.5, 0.06, 0.9, -4.6, 1.03, 13.2, darkWood);
    k.block(-5.9, -3.3, 12.7, 13.7);
    for (const s of [-1, 1]) {
      const cx = s * 4.3;
      k.box(3.4, 0.07, 1.1, cx, 0.78, 4.6, desk); for (const dx of [-1.5, 1.5]) k.box(0.08, 0.75, 0.9, cx + dx, 0.38, 4.6, darkWood);
      for (let i = 0; i < 4; i++) for (const dz of [-0.85, 0.85]) k.box(0.5, 0.5, 0.5, cx - 1.2 + i * 0.8, 0.25, 4.6 + dz, chair);
      for (let i = 0; i < 6; i++) { const p = k.box(0.22, 0.01, 0.3, cx - 1.3 + i * 0.52, 0.82, 4.6 + (i % 2 ? 0.2 : -0.2), paper); p.rotation.y = (i % 3 - 1) * 0.2; }
      k.block(cx - 1.9, cx + 1.9, 3.6, 5.6);
      /* shelves of prayer books by the back wall */
      k.box(0.45, 2.4, 2.4, s * (HX - 0.26), 1.2, 3.6, darkWood);
      const f = k.mesh(new T.PlaneGeometry(2.2, 2.2), shelfM, s * (HX - 0.5), 1.2, 3.6); f.rotation.y = -s * PI / 2;
      k.block(s > 0 ? HX - 0.6 : -HX, s > 0 ? HX : -HX + 0.6, 2.2, 4.9);
    }
    for (const [x, z] of [[-4, 6], [4, 6], [-3, 12.5], [3, 12.5]]) { k.box(1.0, 0.06, 0.2, x, H1 - 0.22, z, k.glow(0xfff4e0)); }
    k.point(0, 2.7, 5.5, 0xffe6c4, 4, 10); k.point(0, 2.7, 12.5, 0xffe6c4, 4, 10);
    /* the people inside: writing at the tables, one at the desk */
    const who: Person[] = [], rp = X.mulberry(160);
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) for (const side of [-1, 1]) if (rp() < 0.6) who.push({ x: s * 4.3 - 1.2 + i * 0.8, y: -0.3, z: 4.6 + side * 0.85, yaw: side > 0 ? PI : 0, coat: [0x141518, 0x1a1b20, 0x3a3a44, 0x5a4a3a, 0xe6e4de][Math.floor(rp() * 5)], skin: SKINS[Math.floor(rp() * 6)], hat: rp() < 0.5, ph: rp() * 6.3, sway: 0.03 });
    who.push({ x: -4.6, y: 0, z: 12.4, yaw: PI, coat: 0x141518, skin: SKINS[1], hat: true, ph: 0, sway: 0.01 });
    people(k, who, !ctx.reduced);

    /* ----- the cemetery: grass, the iron fence, headstones in their rows, trees ----- */
    for (const [x0, x1] of [[-44, -2.6], [2.6, 44]]) {
      const L = x1 - x0, cx = (x0 + x1) / 2;
      for (const y of [0.25, 1.55]) k.box(L, 0.05, 0.05, cx, y, -3, iron);
      for (let x = x0 + 0.1; x < x1; x += 0.24) k.box(0.025, 1.7, 0.025, x, 0.85, -3, iron);
    }
    for (const s of [-1, 1]) { k.box(0.3, 2.2, 0.3, s * 2.75, 1.1, -3, stoneM); }
    {
      const tr: T.Matrix4[] = [], cols: number[] = [], r = X.mulberry(1908), pal = [0x7a7a78, 0x6a6a6c, 0x8a8480, 0x3a3a3c, 0x9a8a82, 0x5a5654];
      const q = new T.Quaternion(), e = new T.Euler(), p = new T.Vector3(), sc = new T.Vector3();
      for (let z = -5.5; z > -66; z -= 2.3) for (const s of [-1, 1]) for (let ax = 4.2; ax < 44; ax += 1.35) {
        const x = s * ax;
        if (ax < 9 && z < -25) continue;
        if (r() < 0.12) continue;
        const h = 0.7 + r() * 0.6, w = 0.55 + r() * 0.35;
        e.set((r() - 0.5) * 0.06, (r() - 0.5) * 0.08, (r() - 0.5) * 0.05); q.setFromEuler(e);
        p.set(x + (r() - 0.5) * 0.2, h / 2, z); sc.set(w, h, 0.2 + r() * 0.08);
        tr.push(new T.Matrix4().compose(p, q, sc)); cols.push(pal[Math.floor(r() * pal.length)]);
      }
      const stones = k.instances(new T.BoxGeometry(1, 1, 1), new T.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05 }), tr);
      const c = new T.Color(); cols.forEach((cc, i) => stones.setColorAt(i, c.set(cc))); if (stones.instanceColor) stones.instanceColor.needsUpdate = true;
    }
    { const r = X.mulberry(44); for (let i = 0; i < 16; i++) { const s = i % 2 ? 1 : -1, x = s * (10 + r() * 30), z = -8 - r() * 55; k.tree(x, 0, z, { h: 7 + r() * 4, r: 3 + r() * 1.2, kind: i % 5 === 0 ? 'column' : 'round', seed: i + 7, leaf: [0x3a6232, 0x46703a, 0x33582c][i % 3] }); } }

    /* ----- the covered walk: x -2.5 .. 2.5 from the back door to the antechamber ----- */
    const WZ0 = HZ0, WZ1 = -28;
    k.box(5, 0.08, WZ0 - WZ1, 0, 0.0, (WZ0 + WZ1) / 2, walkM);
    k.box(6.2, 0.1, WZ0 - WZ1 + 0.6, 0, 3.3, (WZ0 + WZ1) / 2, canopy);
    for (const s of [-1, 1]) k.box(0.12, 0.3, WZ0 - WZ1 + 0.6, s * 3.05, 3.15, (WZ0 + WZ1) / 2, white);
    for (let z = WZ0 - 1; z > WZ1; z -= 3) for (const s of [-1, 1]) k.box(0.1, 3.25, 0.1, s * 2.72, 1.62, z, white);
    for (const s of [-1, 1]) k.box(0.5, 0.8, WZ0 - WZ1 - 6, s * 3.2, 0.4, (WZ0 + WZ1) / 2 - 3, hedge);
    const panelZ = [-1, -6, -11, -16, -21];
    for (const z of panelZ) for (const s of [-1, 1]) k.box(0.08, 2.3, 2.7, s * 2.76, 1.55, z, white);

    /* ----- the Ohel: the antechamber with its candles, and the enclosure open to the sky ----- */
    const AZ0 = -28, AZ1 = -32, EZ1 = -44;
    for (const s of [-1, 1]) k.box(0.4, 3.4, AZ0 - AZ1 + 0.4, s * 4, 1.7, (AZ0 + AZ1) / 2, stoneM);
    k.box(2.0, 3.4, 0.4, -3.0, 1.7, AZ0, stoneM); k.box(2.0, 3.4, 0.4, 3.0, 1.7, AZ0, stoneM); k.box(4.0, 0.8, 0.4, 0, 3.0, AZ0, stoneM);
    k.box(8.8, 0.3, 4.8, 0, 3.55, (AZ0 + AZ1) / 2, stoneM);
    k.box(7.6, 0.06, 3.8, 0, 0.03, (AZ0 + AZ1) / 2, gravel);
    for (const s of [-1, 1]) { k.box(5, 3.6, 0.4, s * 3.5, 1.8, AZ1, stoneM); k.box(0.4, 3.6, AZ1 - EZ1, s * 6, 1.8, (AZ1 + EZ1) / 2, stoneM); }
    k.box(2, 0.9, 0.4, 0, 3.15, AZ1, stoneM);
    k.box(12.4, 3.6, 0.4, 0, 1.8, EZ1, stoneM);
    k.box(11.6, 0.06, AZ1 - EZ1 - 0.4, 0, 0.03, (AZ1 + EZ1) / 2, gravel);
    /* inside, seen only through the doorway: the low wall, and the notes left on the stone */
    for (const [w, d, x, z] of [[4.4, 0.3, 0, -35.6], [4.4, 0.3, 0, -40.4], [0.3, 4.8, -2.2, -38], [0.3, 4.8, 2.2, -38]] as number[][]) k.box(w, 0.7, d, x, 0.35, z, stoneM);
    {
      const r = X.mulberry(700), tr: T.Matrix4[] = [], q = new T.Quaternion(), e = new T.Euler(), p = new T.Vector3(), sc = new T.Vector3(1, 1, 1);
      for (let i = 0; i < 260; i++) { e.set((r() - 0.5) * 0.8, r() * PI, (r() - 0.5) * 0.8); q.setFromEuler(e); p.set((r() - 0.5) * 3.8, 0.1 + r() * 0.35, -38 + (r() - 0.5) * 4.2); tr.push(new T.Matrix4().compose(p, q, sc)); }
      k.instances(new T.BoxGeometry(0.12, 0.006, 0.09), new T.MeshStandardMaterial({ color: 0xf2eee4, roughness: 0.9 }), tr);
    }
    /* the candles on the shelves of the antechamber */
    const cups: T.Matrix4[] = [], flames: { x: number; y: number; z: number; ph: number }[] = [];
    { const r = X.mulberry(1950); for (const s of [-1, 1]) for (const y of [0.95, 1.45, 1.95]) { k.box(0.4, 0.05, 3.6, s * 3.6, y, (AZ0 + AZ1) / 2, darkWood); for (let z = AZ0 - 0.4; z > AZ1 + 0.3; z -= 0.21) { if (r() < 0.25) continue; const x = s * (3.55 + (r() - 0.5) * 0.12); cups.push(new T.Matrix4().makeTranslation(x, y + 0.08, z)); flames.push({ x, y: y + 0.18, z, ph: r() * 20 }); } } }
    const cupM = k.instances(new T.CylinderGeometry(0.045, 0.04, 0.11, 8), new T.MeshStandardMaterial({ color: 0xf0ece0, roughness: 0.3, transparent: true, opacity: 0.85 }), cups);
    void cupM;
    const fl = k.instances(new T.SphereGeometry(0.032, 6, 5), new T.MeshBasicMaterial({ color: 0xffe08a }), flames.map(() => new T.Matrix4()));
    fl.frustumCulled = false;
    const candleL = k.point(0, 1.8, (AZ0 + AZ1) / 2, 0xffa860, 7, 9, 2);
    {
      const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), s = new T.Vector3();
      const place = (t: number) => {
        flames.forEach((f, i) => { const k1 = 0.8 + 0.25 * Math.sin(t * 9 + f.ph) + 0.12 * Math.sin(t * 23 + f.ph * 2); s.set(k1, 1.4 + 0.4 * k1, k1); p.set(f.x, f.y, f.z); m.compose(p, q, s); fl.setMatrixAt(i, m); });
        fl.instanceMatrix.needsUpdate = true;
        candleL.intensity = 7 * (1 + 0.08 * Math.sin(t * 7.1) + 0.05 * Math.sin(t * 17.3));
      };
      place(0);
      if (!ctx.reduced) k.ticks.push(place);
    }
    /* a few visitors on the walk, slow; a couple passing on the boulevard */
    k.crowd([v(0, 0, 1.2), v(0, 0, -12), v(0, 0, -27.2)], 5, { seed: 16, speed: 0.4, spread: 1.4, scale: FS, colors: [0x141518, 0x1a1b20, 0x2a2c32, 0x3a3a44], animate: !ctx.reduced });
    k.crowd([v(-44, 0, 20.4), v(44, 0, 20.4)], 5, { seed: 17, speed: 1.0, spread: 1.2, scale: FS, animate: !ctx.reduced });

    /* ----- the works: in the house and along the covered walk, none facing the enclosure ----- */
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) mounts.push({ position: v(s * (HX - 0.08), 1.75, 7.2), rotation: s > 0 ? -PI / 2 : PI / 2, target: v(s * 4.8, 1.75, 7.2), width: 2.0, height: 1.4, style: 'oak', wash: true });
    for (const z of [11.2, 14.0]) mounts.push({ position: v(HX - 0.08, 1.75, z), rotation: -PI / 2, target: v(4.8, 1.75, z), width: 2.0, height: 1.4, style: 'oak', wash: true });
    for (const s of [-1, 1]) mounts.push({ position: v(s * 5.6, 1.75, 9.2), rotation: 0, target: v(s * 5.6, 1.75, 12.2), width: 2.0, height: 1.4, style: 'oak', wash: true });
    for (const z of panelZ) for (const s of [-1, 1]) mounts.push({ position: v(s * 2.7, 1.6, z), rotation: s > 0 ? -PI / 2 : PI / 2, target: v(-s * 0.3, 1.6, z), width: 2.1, height: 1.5, style: 'white', wash: true });
    k.censusWall({ x: -HX + 0.05, y: 1.95, z: 12.6, rotY: PI / 2, cols: 11, rows: 4, tile: 0.44, gap: 0.04, start: ctx.wallStart(3100, 44), pieces: ctx.all, backing: darkWood });

    /* ----- what the place knows: the house, the notes, the cemetery, the day, the open roof ----- */
    const src = { name: 'Ohel (Chabad), Wikipedia', url: 'https://en.wikipedia.org/wiki/Ohel_(Chabad)' };
    k.egg(v(-4.6, 1.2, 13.2), { id: 'visitors-center-1995', title: 'A house on the boulevard', year: '1995', text: 'In 1995 Lubavitcher Hasidim bought one of the houses along Francis Lewis Boulevard and made it a visitors center open twenty four hours a day, with a video room, a library, a small synagogue, a quiet room where visitors compose the prayers they will say at the Ohel, and refreshments.', clue: 'Ask at the desk how long the house has been open.', source: src }, { r: 1.2 });
    k.egg(v(4.3, 1.0, 4.6), { id: 'kvitlach', title: 'Notes by hand, by fax, by e-mail', text: 'Visitors write notes, kvitlach, to bring to the Ohel. More arrive from far away: the fax machine takes more than 700 a day and a computer about 400 e-mails. They are printed, torn into shreds and placed on the graves, and when the pile grows too high the shredded notes are burned.', clue: 'Sit at the table where people are writing.', source: src }, { r: 1.3 });
    k.egg(v(-2.75, 1.4, -3), { id: 'montefiore-1908', title: 'Montefiore Cemetery', year: '1908', text: 'The cemetery was founded in 1908, registered as the Springfield L. I. Cemetery Society, in Springfield Gardens, Queens. More than 150,000 people are buried here.', clue: 'Stop at the gate in the iron fence.', source: { name: 'Montefiore Cemetery, Wikipedia', url: 'https://en.wikipedia.org/wiki/Montefiore_Cemetery' } }, { r: 1.0 });
    k.egg(v(2.72, 2.4, -8), { id: 'gimmel-tammuz', title: 'Fifty thousand in one day', year: '1994', text: 'On Gimmel Tammuz, the anniversary of the death of Rabbi Menachem Mendel Schneerson in 1994, about 50,000 people make the pilgrimage along this path to the Ohel.', clue: 'Imagine this walk on its busiest day of the year.', source: src }, { r: 1.0 });
    k.egg(v(-2.72, 2.4, -23), { id: 'open-roof', title: 'Four walls and the sky', year: '1950', text: 'Rabbi Yosef Yitzchak Schneersohn was buried in this cemetery in 1950 and Rabbi Menachem Mendel Schneerson beside him in 1994. The graves are enclosed by four walls with an open roof, to avoid the problem of tumas meis, ritual impurity, for visiting kohanim, and a low wall round the graves keeps them at least 320 millimetres away. Visitors light candles on the shelves of the antechamber.', clue: 'Near the end of the walk, look at the roofline ahead.', source: src }, { r: 1.0 });

    noShadowsFor(k, [floorM, plaster, desk, paper, chair, shelfM, darkWood]);
    /* ----- where you can walk: the sidewalk, the house, the covered walk, the antechamber ----- */
    k.block(-45, -HX + 0.35, HZ0 - 0.4, HZ1 + 0.4); k.block(HX - 0.35, 45, HZ0 - 0.4, HZ1 + 0.4);
    k.block(-HX, -1.0, HZ1 - 0.1, HZ1 + 0.5); k.block(1.0, HX, HZ1 - 0.1, HZ1 + 0.5);
    k.block(-HX, -3.2, 8.8, 9.2); k.block(3.2, HX, 8.8, 9.2);
    k.block(-HX, -2.5, HZ0 - 0.5, HZ0 + 0.2); k.block(2.5, HX, HZ0 - 0.5, HZ0 + 0.2);
    k.block(-45, -2.35, WZ1, HZ0 - 0.4); k.block(2.35, 45, WZ1, HZ0 - 0.4);
    k.block(-45, -3.5, AZ1 - 2, WZ1); k.block(3.5, 45, AZ1 - 2, WZ1);
    k.block(-3.5, -1.9, WZ1 - 0.25, WZ1 + 0.25); k.block(1.9, 3.5, WZ1 - 0.25, WZ1 + 0.25);
    k.block(-45, -1.6, HZ1 + 0.4, 18.4); k.block(1.6, 45, HZ1 + 0.4, 18.4);
    return { mounts, spawn: v(0, 2.1, 14.6), look: v(0, 1.5, -30), eye: 2.1, bounds: [-30, 30, AZ1 + 0.4, 21.8], style: 'oak' };
  },
};
