/* 155: Brooklyn Public Library, Central Library, at Grand Army Plaza.
   The building is shaped like an open book: a concave limestone front that follows the oval of the plaza,
   two long wings running back along Flatbush Avenue and Eastern Parkway, and in the middle the tall bronze
   entrance screen with its fifteen gilded panels between two pylons carrying gilded reliefs. The figures
   on the screen and the pylons are simple relief forms, not copies of the sculptures. The visitor stands
   on the forecourt below the terrace; the lobby behind the screen is the second space. The Arch and the
   Bailey Fountain stand across the plaza behind the visitor. Moving things are instanced rigs or single
   groups on k.ticks, and nothing moves when ctx.reduced is set. */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as X from '../textures';
import { v, type Mount } from '../kit';
import type { RoomDef } from './types';
const PI = Math.PI;
const one = new T.Vector3(1, 1, 1);

/* a small figure with a head, as one merged geometry for instancing */
function figureGeo(r = 0.2, len = 0.82, headY = 1.35) {
  const body = new T.CapsuleGeometry(r, len, 3, 8); body.translate(0, r + len / 2, 0);
  const head = new T.SphereGeometry(r * 0.62, 10, 8); head.translate(0, headY, 0);
  return mergeGeometries([body, head])!;
}
const part = (w: number, h: number, d: number, x: number, y: number, z: number, rz = 0) => { const g = new T.BoxGeometry(w, h, d); g.rotateZ(rz); g.translate(x, y, z); return g; };

/* A relief figure in the round of a panel: a head, a robed body, two arms and the thing it carries
   (a book, a staff, a lamp, a globe, a scroll, a bird). Built flat on the xy plane, facing +z, feet at 0.
   These stand in for the sculptures on the screen; they are forms, not likenesses. */
function reliefGeo(seed: number, s: number) {
  const r = X.mulberry(seed), gs: T.BufferGeometry[] = [];
  const body = Math.floor(r() * 5), lean = (r() - 0.5) * 0.25;
  const head = (x: number, y: number, k = 1) => { const g = new T.SphereGeometry(0.11 * s * k, 10, 8); g.scale(1, 1.15, 0.6); g.translate(x, y, 0.02 * s); gs.push(g); };
  const arm = (ang: number, sx: number, sy = 0.97, len = 0.42) => { const g = new T.BoxGeometry(0.08 * s, len * s, 0.07 * s); g.translate(0, -len * 0.5 * s, 0); g.rotateZ(ang * sx); g.translate(sx * 0.21 * s, sy * s, 0.03 * s); gs.push(g); };
  const attribute = (hx: number, hy: number) => {
    const kind = Math.floor(r() * 6);
    if (kind === 0) gs.push(part(0.28 * s, 0.2 * s, 0.05 * s, hx, hy, 0.06 * s, 0.2));
    else if (kind === 1) gs.push(part(0.05 * s, 1.35 * s, 0.05 * s, hx, 0.68 * s, 0.05 * s));
    else if (kind === 2) { const g = new T.SphereGeometry(0.1 * s, 8, 6); g.translate(hx, hy + 0.08 * s, 0.05 * s); gs.push(g, part(0.04 * s, 0.14 * s, 0.04 * s, hx, hy - 0.03 * s, 0.05 * s)); }
    else if (kind === 3) { const g = new T.SphereGeometry(0.15 * s, 10, 8); g.scale(1, 1, 0.5); g.translate(hx, hy + 0.1 * s, 0.05 * s); gs.push(g); }
    else if (kind === 4) gs.push(part(0.07 * s, 0.36 * s, 0.07 * s, hx, hy, 0.06 * s, 1.2));
    else gs.push(part(0.2 * s, 0.07 * s, 0.05 * s, hx + 0.05 * s, hy + 0.1 * s, 0.05 * s, 0.4), part(0.2 * s, 0.07 * s, 0.05 * s, hx - 0.08 * s, hy + 0.12 * s, 0.05 * s, -0.5));
  };
  if (body === 0 || body === 1) {
    /* a robed figure, standing, one arm raised with its attribute */
    const robe = new T.CylinderGeometry(0.2 * s, 0.3 * s, 0.95 * s, 4, 1); robe.rotateY(PI / 4); robe.scale(1, 1, 0.35); robe.rotateZ(lean * 0.5); robe.translate(0, 0.48 * s, 0); gs.push(robe);
    gs.push(part(0.46 * s, 0.14 * s, 0.1 * s, lean * 0.3 * s, 0.98 * s, 0)); head(lean * 0.4 * s, 1.18 * s);
    const a1 = -0.3 - r() * 1.9; arm(a1, 1); arm(0.2 + r() * 0.9, -1);
    attribute(0.21 * s + Math.sin(a1) * 0.42 * s, 0.97 * s - Math.cos(a1) * 0.42 * s);
  } else if (body === 2) {
    /* a striding figure in a short tunic */
    gs.push(part(0.1 * s, 0.5 * s, 0.07 * s, -0.12 * s, 0.25 * s, 0.03 * s, -0.3), part(0.1 * s, 0.5 * s, 0.07 * s, 0.1 * s, 0.25 * s, 0.03 * s, 0.25));
    const t = new T.CylinderGeometry(0.17 * s, 0.24 * s, 0.5 * s, 4, 1); t.rotateY(PI / 4); t.scale(1, 1, 0.35); t.translate(0, 0.7 * s, 0); gs.push(t);
    gs.push(part(0.42 * s, 0.12 * s, 0.1 * s, 0, 0.98 * s, 0)); head(0.03 * s, 1.17 * s);
    const a1 = -1.2 - r() * 0.9; arm(a1, 1); arm(-0.6 - r() * 0.6, -1);
    attribute(0.21 * s + Math.sin(a1) * 0.42 * s, 0.97 * s - Math.cos(a1) * 0.42 * s);
  } else if (body === 3) {
    /* a seated figure reading, on a block */
    gs.push(part(0.5 * s, 0.34 * s, 0.1 * s, 0, 0.17 * s, 0));
    const t = new T.CylinderGeometry(0.17 * s, 0.25 * s, 0.55 * s, 4, 1); t.rotateY(PI / 4); t.scale(1, 1, 0.35); t.translate(-0.05 * s, 0.62 * s, 0); gs.push(t);
    gs.push(part(0.36 * s, 0.1 * s, 0.08 * s, 0.14 * s, 0.4 * s, 0.05 * s), part(0.09 * s, 0.34 * s, 0.07 * s, 0.3 * s, 0.22 * s, 0.05 * s));
    head(0.02 * s, 1.02 * s); gs.push(part(0.3 * s, 0.22 * s, 0.05 * s, 0.2 * s, 0.72 * s, 0.08 * s, -0.5));
    arm(-0.9, 1, 0.84, 0.36);
  } else {
    /* a beast: the animals of the stories, a long body on four legs, head up */
    gs.push(part(0.8 * s, 0.32 * s, 0.1 * s, 0, 0.55 * s, 0));
    for (const dx of [-0.3, -0.18, 0.18, 0.3]) gs.push(part(0.08 * s, 0.4 * s, 0.07 * s, dx * s, 0.2 * s, 0.03 * s));
    gs.push(part(0.14 * s, 0.34 * s, 0.09 * s, 0.42 * s, 0.78 * s, 0.01 * s, -0.5), part(0.26 * s, 0.14 * s, 0.09 * s, 0.56 * s, 0.94 * s, 0.01 * s, 0.1));
    gs.push(part(0.05 * s, 0.34 * s, 0.05 * s, -0.46 * s, 0.6 * s, 0.03 * s, 0.9));
    if (r() > 0.5) { gs.push(part(0.3 * s, 0.1 * s, 0.1 * s, -0.05 * s, 0.76 * s, 0.03 * s)); const t = new T.CylinderGeometry(0.1 * s, 0.13 * s, 0.34 * s, 4, 1); t.translate(-0.05 * s, 0.98 * s, 0); gs.push(t); head(-0.05 * s, 1.24 * s, 0.9); }
  }
  /* a ground line under the feet */
  gs.push(part(0.8 * s, 0.05 * s, 0.08 * s, 0, 0.02 * s, 0));
  const flat = gs.map((g) => (g.index ? g.toNonIndexed() : g));
  flat.forEach((g) => { if (!g.attributes.uv) g.setAttribute('uv', new T.Float32BufferAttribute(new Array(g.attributes.position.count * 2).fill(0), 2)); });
  return mergeGeometries(flat)!;
}

/* Indiana limestone laid in long smooth courses: the joints are fine and only a shade darker than
   the stone, the way they read on the library from the plaza. One tile is four metres square. */
let limeCache: X.Surface | null = null;
function limeSurface() {
  if (limeCache) return limeCache;
  const S = 512, rnd = X.mulberry(1941), c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d')!, base = new T.Color(0xdcd2ba);
  const tone = (f: number) => base.clone().multiplyScalar(f).getStyle();
  g.fillStyle = tone(1); g.fillRect(0, 0, S, S);
  const CH = S / 5;
  for (let r = 0; r < 5; r++) {
    let x = -rnd() * 80;
    while (x < S) {
      const w = 150 + rnd() * 110;
      g.fillStyle = tone(0.93 + rnd() * 0.1); g.fillRect(x, r * CH, w, CH);
      /* a soft cloud in each block */
      for (let i = 0; i < 6; i++) { g.globalAlpha = 0.05; g.fillStyle = rnd() > 0.5 ? '#fff' : '#6a5a40'; g.beginPath(); g.ellipse(x + rnd() * w, r * CH + rnd() * CH, 20 + rnd() * 40, 8 + rnd() * 16, 0, 0, PI * 2); g.fill(); }
      g.globalAlpha = 1;
      g.fillStyle = tone(0.8); g.fillRect(x, r * CH, 2, CH);
      x += w;
    }
    g.fillStyle = tone(0.8); g.fillRect(0, r * CH, S, 2);
  }
  /* weathering streaks, very faint */
  g.globalAlpha = 0.05; for (let i = 0; i < 40; i++) { g.fillStyle = '#4a4034'; g.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 3, 30 + rnd() * 90); } g.globalAlpha = 1;
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8; t.colorSpace = T.SRGBColorSpace;
  limeCache = { map: t };
  return limeCache;
}

/* ---------------- 155 THE GOLDEN BOOK ---------------- */
export const brooklyncentral: RoomDef = {
  id: 'brooklyncentral',
  name: 'The golden book',
  area: 'BROOKLYN PUBLIC LIBRARY / GRAND ARMY PLAZA',
  mood: 'Afternoon on the library steps',
  color: '#c9a24a',
  description: 'The Central Library of the Brooklyn Public Library at Grand Army Plaza, the limestone building shaped like an open book, seen from the forecourt with its tall bronze entrance screen and its fifteen gilded panels shining in the middle of the curve. People sit on the steps, pigeons work the forecourt, traffic runs round the plaza behind you toward the Arch and the Bailey Fountain. The New Yorkers hang on the granite base of the curved front along the terrace, and inside, on the blond oak of the lobby.',
  signatures: 'The concave Indiana limestone front following the oval of the plaza, the gray granite base, the two tall pylons with their gilded reliefs, the bronze screen with fifteen gilded panels over the doors, BROOKLYN PUBLIC LIBRARY cut above the entrance, the terrace with its three stairways, lamps and planting beds, the long wings with tall slot windows running down Flatbush Avenue and Eastern Parkway, the lobby in terrazzo and blond oak, and across the plaza the Bailey Fountain and the Soldiers\' and Sailors\' Arch.',
  build(k, ctx) {
    k.sky({ top: 0x4f86d0, horizon: 0xd3dfea, ground: 0x7a746c, fog: 0.0012, sun: { az: 2.2, el: 0.62, color: 0xfff2dc, size: 8 }, env: 0.8 });
    k.hemi(0xd6e4ff, 0x8a8478, 1.15);
    k.sun(0xfff0d8, 2.5, 60, 85, 70, true, 80);
    const lime = k.pbr('bcLime', limeSurface(), 0.25, { roughness: 0.85 }),
      limeSmooth = k.pbr('bcLimeS', X.plaster(0xd6ccb2, 312), 0.2, { roughness: 0.8 }),
      granite = k.pbr('bcGranite', X.ashlar(0x8c8883, 313, 4), 0.3, { roughness: 0.6 }),
      pave = k.pbr('bcPave', X.pavers(0x9e978a, 314), 0.45, { roughness: 0.85 }),
      terr = k.pbr('bcTerrace', X.pavers(0xaaa393, 315), 0.5, { roughness: 0.8 }),
      road = k.pbr('bcRoad', X.asphalt(0x2c3034), 0.1, { roughness: 0.9 }),
      lawn = k.pbr('bcLawn', X.grass(0x557a3e, 316), 0.3, { roughness: 1 }),
      bronze = k.flat(0x3a3024, 0.75, 0.45),
      bronzeDark = k.flat(0x221c16, 0.6, 0.5),
      gold = k.pbr('bcGold', X.gilt(0xd8b056), 2, { metalness: 0.9, roughness: 0.26 }),
      slot = k.flat(0x1f262c, 0.55, 0.22, { emissive: 0xffc98a, emissiveIntensity: 0.02 + 0.28 * k.night }),
      iron = k.flat(0x1e2226, 0.6, 0.45), hedge = k.flat(0x46703a, 0, 0.95), soil = k.pbr('bark', X.bark(), 0.7, { roughness: 1 });

    /* everybody who stands or sits still, gathered into two instanced meshes at the end */
    const noShadow: T.Object3D[] = [];
    const standers: [number, number, number, number, number][] = [], sitters: [number, number, number, number, number][] = [];
    /* ---- the plan: the front is an arc of a circle centred out in the plaza, so it is concave toward you ---- */
    const CZ = 10, R = 40, TH_END = 0.93, TOP = 24.6, BASE = 5.7, TER = 1.2;
    const P = (r: number, th: number) => v(r * Math.sin(th), 0, CZ - r * Math.cos(th));
    const polar = (x: number, z: number) => ({ r: Math.hypot(x, z - CZ), th: Math.atan2(x, CZ - z) });
    const arcBox = (r0: number, r1: number, th: number, dth: number, y0: number, y1: number, m: T.Material) => {
      const c = P((r0 + r1) / 2, th), w = Math.abs(dth) * Math.max(r0, r1) + 0.04;
      const o = k.box(w, y1 - y0, r1 - r0, c.x, (y0 + y1) / 2, c.z, m); o.rotation.y = -th; return o;
    };
    const PORT = 0.2; /* half angle of the portico opening */
    /* the wings leave the ends of the curve along the two avenues: WD runs down the avenue, WO faces the street */
    const WD = (s: number) => v(s * 0.8, 0, -0.6), WO = (s: number) => v(s * 0.6, 0, 0.8);
    const wpt = (s: number, a: number, b: number) => P(41.2, s * TH_END).addScaledVector(WD(s), a).addScaledVector(WO(s), b);

    /* ---- the ground: forecourt, the plaza, the roads ---- */
    k.box(420, 0.3, 480, 0, -0.15, 100, lawn);
    k.box(160, 0.06, 32, 0, 0.03, 0, pave);
    {
      /* the traffic ring round Grand Army Plaza, then the island inside it */
      const ring = new T.RingGeometry(80, 97, 72, 1); ring.rotateX(-PI / 2); const ro = k.mesh(ring, road, 0, 0.07, 112); ro.scale.set(0.7, 1, 1);
      const isl = new T.CircleGeometry(80, 72); isl.rotateX(-PI / 2); const io = k.mesh(isl, lawn, 0, 0.1, 112); io.scale.set(0.7, 1, 1);
      const walk = new T.RingGeometry(75, 80, 72, 1); walk.rotateX(-PI / 2); const wo = k.mesh(walk, pave, 0, 0.12, 112); wo.scale.set(0.7, 1, 1);
      /* Flatbush Avenue and Eastern Parkway running away along the wings */
      for (const s of [-1, 1]) {
        const d = WD(s), c = wpt(s, 95, 14), w = wpt(s, 95, 3.2);
        const o = k.box(18, 0.1, 190, c.x, 0.06, c.z, road); o.rotation.y = Math.atan2(d.x, d.z);
        const w2 = k.box(6.4, 0.14, 190, w.x, 0.07, w.z, pave); w2.rotation.y = Math.atan2(d.x, d.z);
      }
      /* the curb line and a painted crosswalk on the near side of the ring */
      k.box(150, 0.16, 0.4, 0, 0.08, 15.4, granite);
      for (let i = 0; i < 9; i++) k.box(0.6, 0.02, 5, -4 + i * 1.0, 0.13, 18.6, limeSmooth);
    }

    /* ---- the terrace: a crescent raised 1.2 m, with three stairways (north, northwest, southwest) ---- */
    const TR0 = 26, NS = 0.31, SIDE0 = 0.8, SIDE1 = 0.92;
    for (let th = -SIDE0; th < SIDE0 - 1e-6; th += 0.04) arcBox(TR0, 41.9, th + 0.02, 0.04, 0, TER, terr);
    /* the central stairway: four steps down the front of the curve */
    for (let i = 0; i < 4; i++) for (let th = -NS; th < NS - 1e-6; th += 0.04) arcBox(TR0 - 0.75 * (i + 1), TR0 - 0.75 * i, th + 0.02, 0.04, 0, TER - 0.3 * (i + 1) + 0.001, granite);
    /* the side stairways, stepping down round the ends of the curve */
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const th0 = SIDE0 + i * 0.03; arcBox(TR0, 41.9, s * (th0 + 0.015), 0.03, 0, TER - 0.3 * (i + 1) + 0.001, granite); }
    /* the retaining wall and coping along the front edge, where there is no stair */
    for (const s of [-1, 1]) for (let th = NS; th < SIDE0 - 1e-6; th += 0.04) { arcBox(TR0 - 0.35, TR0, s * (th + 0.02), 0.04, 0, TER + 0.45, granite); }
    /* planting beds below the wall: soil, a low hedge, and a black iron fence */
    for (const s of [-1, 1]) for (let th = NS + 0.02; th < SIDE0 - 0.02; th += 0.04) {
      arcBox(TR0 - 3, TR0 - 0.35, s * (th + 0.02), 0.04, 0, 0.35, soil);
      arcBox(TR0 - 2.3, TR0 - 0.6, s * (th + 0.02), 0.04, 0.3, 1.05, hedge);
      arcBox(TR0 - 3.05, TR0 - 2.95, s * (th + 0.02), 0.04, 0.9, 0.96, iron);
    }
    for (const s of [-1, 1]) for (let th = NS + 0.02; th <= SIDE0 - 0.02; th += 0.02) { const p = P(TR0 - 3, s * th); k.box(0.04, 0.9, 0.04, p.x, 0.45, p.z, iron); }
    /* the lamps: bronze posts on granite capstones, at the heads of the stairs */
    const lampAt: T.Vector3[] = [];
    for (const s of [-1, 1]) { lampAt.push(P(TR0 - 3.3, s * (NS + 0.035))); lampAt.push(P(TR0 + 0.6, s * (SIDE0 - 0.02))); lampAt.push(P(41.2, s * (SIDE1 + 0.02))); }
    for (const p of lampAt) {
      const y0 = polar(p.x, p.z).r > TR0 && Math.abs(polar(p.x, p.z).th) < SIDE0 ? TER : 0;
      k.box(1.1, 1.3, 1.1, p.x, y0 + 0.65, p.z, granite); k.box(1.25, 0.18, 1.25, p.x, y0 + 1.36, p.z, granite);
      k.cyl(0.09, 3.6, p.x, y0 + 3.2, p.z, bronze, 0.13, 10);
      k.mesh(new T.SphereGeometry(0.34, 14, 10), k.flat(0xfff4dc, 0, 0.3, { emissive: 0xffe2b0, emissiveIntensity: 0.25 + 1.2 * k.night }), p.x, y0 + 5.2, p.z);
      k.cyl(0.36, 0.14, p.x, y0 + 4.95, p.z, bronze, 0.2, 12);
      k.keepOut.push({ x: p.x, z: p.z, r: 0.9 });
      if (k.night > 0.4) k.point(p.x, y0 + 5.2, p.z, 0xffd9a0, 22, 12);
    }

    /* ---- the curved front: granite base, limestone above, slot windows, cornice ---- */
    const DT = 0.02;
    for (const s of [-1, 1]) for (let th = PORT; th < TH_END - 1e-6; th += DT) {
      const t = s * (th + DT / 2);
      arcBox(40, 41.2, t, DT, 0, BASE, granite);
      arcBox(40.05, 41.2, t, DT, BASE, TOP, lime);
    }
    /* above the portico the front runs straight across */
    for (let th = -PORT; th < PORT - 1e-6; th += DT) arcBox(40, 41.2, th + DT / 2, DT, 16.4, TOP, lime);
    /* cornice and parapet */
    for (let th = -TH_END; th < TH_END - 1e-6; th += 0.04) { arcBox(39.6, 41.3, th + 0.02, 0.04, TOP - 1.1, TOP - 0.5, limeSmooth); arcBox(40.2, 41.3, th + 0.02, 0.04, TOP - 0.5, TOP + 0.9, lime); }
    /* a band where the granite meets the limestone */
    for (let th = -TH_END; th < TH_END - 1e-6; th += 0.04) if (Math.abs(th + 0.02) > PORT) arcBox(39.85, 40.05, th + 0.02, 0.04, BASE - 0.25, BASE + 0.05, limeSmooth);
    /* the tall slot windows: four storeys of glass in bronze, in the upper wall away from the entrance */
    for (const s of [-1, 1]) for (let th = 0.36; th < TH_END - 0.03; th += 0.075) {
      const t = s * th;
      arcBox(39.9, 40.1, t, 0.034, 7.2, 21.2, slot);
      for (const y of [10.7, 14.2, 17.7]) arcBox(39.82, 39.95, t, 0.036, y - 0.25, y + 0.25, bronze);
      arcBox(39.8, 40.0, t, 0.04, 6.9, 7.2, limeSmooth);
    }
    /* inscription panels flanking the portico: cut lines in smooth stone, too far up to read */
    for (const s of [-1, 1]) {
      arcBox(39.92, 40.06, s * 0.27, 0.12, 7.4, 13.8, limeSmooth);
      for (let i = 0; i < 12; i++) arcBox(39.88, 39.93, s * 0.27, 0.1 - (i % 4 === 3 ? 0.035 : 0), 13.2 - i * 0.46, 13.28 - i * 0.46, granite);
    }

    /* ---- the portico: two pylons with gilded reliefs, the bronze screen, the name cut above ---- */
    const PX = 7.5, PW = 2.8, PH = 15.2, PZ0 = -32.1, PZ1 = -27.4;
    for (const s of [-1, 1]) {
      k.box(PW, PH, PZ1 - PZ0, s * PX, TER + PH / 2, (PZ0 + PZ1) / 2, lime);
      k.box(PW + 0.3, 0.6, PZ1 - PZ0 + 0.3, s * PX, TER + PH + 0.3, (PZ0 + PZ1) / 2, limeSmooth);
      k.box(PW + 0.2, 1.1, PZ1 - PZ0 + 0.2, s * PX, TER + 0.55, (PZ0 + PZ1) / 2, granite);
      /* seven relief panels stacked up the front face, each framed in a thin gilt line */
      for (let i = 0; i < 7; i++) {
        const y = TER + 2.1 + i * 1.8, zf = PZ1 + 0.02;
        k.box(2.1, 1.62, 0.06, s * PX, y + 0.8, zf, limeSmooth);
        for (const [w, h, dx, dy] of [[2.1, 0.06, 0, 0], [2.1, 0.06, 0, 1.6], [0.06, 1.62, -1.02, 0.8], [0.06, 1.62, 1.02, 0.8]]) k.box(w, h, 0.05, s * PX + dx, y + dy, zf + 0.04, gold);
        const g = reliefGeo(400 + i * 7 + (s > 0 ? 3 : 0), 1.25); k.mesh(g, gold, s * PX - 0.1, y + 0.1, zf + 0.06);
      }
      /* the inner faces of the pylons carry reliefs too, toward the doors */
      for (let i = 0; i < 5; i++) { const g = reliefGeo(600 + i * 5 + (s > 0 ? 2 : 0), 1.3); const o = k.mesh(g, gold, s * (PX - PW / 2 - 0.03), TER + 2.4 + i * 2.4, -29.8); o.rotation.y = -s * PI / 2; }
      k.block(s * PX - PW / 2 - 0.3, s * PX + PW / 2 + 0.3, PZ0, PZ1 + 0.4);
    }
    const SZ = -31.8, SW = 12.2, DOORTOP = TER + 4.4;
    /* the lower screen: bronze posts and three open doorways into the lobby */
    for (const [x0, x1] of [[-6.1, -4.8], [-2.4, -1.2], [1.2, 2.4], [4.8, 6.1]]) { k.box(x1 - x0, DOORTOP - TER, 0.5, (x0 + x1) / 2, (TER + DOORTOP) / 2, SZ, bronze); k.block(x0, x1, SZ - 0.4, SZ + 0.4); }
    for (const x of [-3.6, 0, 3.6]) {
      k.box(2.4, 0.22, 0.6, x, DOORTOP - 0.11, SZ, gold);
      for (const s of [-1, 1]) k.box(0.1, DOORTOP - TER, 0.62, x + s * 1.17, (TER + DOORTOP) / 2, SZ, gold);
    }
    /* the panel field: five across, three high, gilded frames on dark bronze, a figure in each */
    const PY0 = DOORTOP, CW = 2.2, CH = 2.5, GB = 0.18;
    k.box(SW, 3 * CH + 4 * GB, 0.4, 0, PY0 + (3 * CH + 4 * GB) / 2, SZ - 0.1, bronzeDark);
    for (let c = 0; c <= 5; c++) k.box(GB, 3 * CH + 4 * GB, 0.2, -SW / 2 + GB / 2 + c * (CW + GB) + 0.01, PY0 + (3 * CH + 4 * GB) / 2, SZ + 0.2, gold);
    for (let r = 0; r <= 3; r++) k.box(SW, GB, 0.2, 0, PY0 + GB / 2 + r * (CH + GB), SZ + 0.2, gold);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) {
      const x = -SW / 2 + GB + CW / 2 + c * (CW + GB) + 0.01, y = PY0 + GB + r * (CH + GB);
      k.box(CW - 0.2, CH - 0.2, 0.05, x, y + CH / 2, SZ + 0.13, bronze);
      k.mesh(reliefGeo(100 + r * 11 + c * 3, 1.72), gold, x, y + 0.2, SZ + 0.16);
    }
    /* over the panels, a band of small gilded stars, then the name in the stone */
    const TOPSCR = PY0 + 3 * CH + 4 * GB;
    k.box(SW, 0.5, 0.3, 0, TOPSCR + 0.25, SZ + 0.05, bronzeDark);
    for (let i = 0; i < 17; i++) k.mesh(new T.OctahedronGeometry(0.16, 0), gold, -5.6 + i * 0.7, TOPSCR + 0.25, SZ + 0.22);
    const LZ = -31.1;
    k.box(SW + 0.2, 16.4 + 0.02 - (TOPSCR + 0.5), 1.8, 0, (TOPSCR + 0.5 + 16.42) / 2, LZ - 0.2, limeSmooth);
    k.sign('BROOKLYN PUBLIC LIBRARY', 11.4, 0.95, 0, TOPSCR + 1.55, LZ + 0.72, 'transparent', '#cfa75a', 64, 0);
    /* the soffit of the recess, and the floor inside the screen */
    k.box(SW, 0.3, 4.6, 0, 16.3, -29.8, limeSmooth);

    /* ---- the wings, long and straight, down Flatbush Avenue and Eastern Parkway ---- */
    for (const s of [-1, 1]) {
      const c0 = P(41.2, s * TH_END), d = WD(s), n = WO(s).negate();
      const L = 110, D = 12, yaw = -Math.atan2(d.z, d.x);
      const at = (a: number, b: number) => c0.clone().addScaledVector(d, a).addScaledVector(n, b);
      const put = (w: number, h: number, dd: number, a: number, b: number, y: number, m: T.Material) => { const p = at(a, b); const o = k.box(w, h, dd, p.x, y, p.z, m); o.rotation.y = yaw; return o; };
      /* the wing proper starts a little way back, so its inner side stays behind the curve; a thin return joins it to the corner */
      const slab = (a0: number, a1: number, dd: number) => {
        const la = a1 - a0, am = (a0 + a1) / 2;
        put(la, BASE, dd, am, dd / 2, BASE / 2, granite); put(la, TOP - BASE, dd, am, dd / 2, (TOP + BASE) / 2, lime);
        put(la, 0.6, dd + 0.8, am, dd / 2 - 0.4, TOP - 0.8, limeSmooth); put(la, 1.4, 0.8, am, 0.4, TOP + 0.2, lime);
      };
      slab(0, 8.4, 1.5); slab(8, L, D);
      for (let a = 4; a < L - 2; a += 3.4) { put(1.3, 14, 0.2, a, -0.08, 14.2, slot); for (const y of [10.7, 14.2, 17.7]) put(1.35, 0.5, 0.26, a, -0.1, y, bronze); }
      /* the corner where the curve turns into the wing */
      const cc = P(40.6, s * (TH_END + 0.01)); k.box(2.4, TOP + 0.9, 2.4, cc.x, (TOP + 0.9) / 2, cc.z, lime);
    }
    /* the roof over the whole mass, so nothing shows behind the parapet from the plaza */
    k.box(80, 0.4, 40, 0, TOP - 0.2, -52, limeSmooth);

    /* ---- the lobby: terrazzo, blond oak to six metres, plaster above, bronze trim, a long light ---- */
    const LX = 18, LZ0 = -32.4, LZ1 = -50.4, LH = 12;
    {
      const floor = k.pbr('bcTerrazzo', X.terrazzo(0xcdc4b0, 317), 0.4, { roughness: 0.4 }),
        oak = k.pbr('bcOak', X.planks(0xc9ad84, 3, 318, 0.12), 0.2, { roughness: 0.55 }),
        plas = k.pbr('bcPlaster', X.plaster(0xeee7d8, 319), 0.25, { roughness: 0.9 }),
        brass = k.flat(0xb89a5a, 0.85, 0.3);
      k.box(LX * 2 + 1, 0.3, LZ0 - LZ1 + 3, 0, TER - 0.15, (LZ0 + LZ1) / 2 + 1.2, floor);
      /* back and side walls: oak below, plaster above */
      k.box(LX * 2 + 0.8, 6, 0.3, 0, TER + 3, LZ1 - 0.15, oak); k.box(LX * 2 + 0.8, LH - 6, 0.3, 0, TER + 6 + (LH - 6) / 2, LZ1 - 0.15, plas);
      for (const s of [-1, 1]) { k.box(0.3, 6, LZ0 - LZ1, s * (LX + 0.15), TER + 3, (LZ0 + LZ1) / 2, oak); k.box(0.3, LH - 6, LZ0 - LZ1, s * (LX + 0.15), TER + 6 + (LH - 6) / 2, (LZ0 + LZ1) / 2, plas); }
      /* the front wall inside the screen */
      for (const s of [-1, 1]) { k.box(LX - 6.1, LH, 0.3, s * (6.1 + (LX - 6.1) / 2), TER + LH / 2, LZ0 + 0.15, plas); k.box(LX - 6.1, 6, 0.1, s * (6.1 + (LX - 6.1) / 2), TER + 3, LZ0 - 0.05, oak); }
      k.box(SW, LH - (TOPSCR - TER), 0.3, 0, TOPSCR + (LH - (TOPSCR - TER)) / 2, LZ0 + 0.15, plas);
      /* bronze band at the top of the oak, and a brass rail at the foot */
      k.box(LX * 2 + 0.6, 0.16, 0.12, 0, TER + 6.05, LZ1 + 0.05, brass);
      for (const s of [-1, 1]) k.box(0.12, 0.16, LZ0 - LZ1, s * (LX - 0.05), TER + 6.05, (LZ0 + LZ1) / 2, brass);
      /* ceiling in plaster with three long coffers and their lights */
      k.box(LX * 2 + 0.8, 0.4, LZ0 - LZ1 + 0.6, 0, TER + LH + 0.2, (LZ0 + LZ1) / 2, plas);
      for (const x of [-9, 0, 9]) { k.box(5.4, 0.3, LZ0 - LZ1 - 3, x, TER + LH - 0.1, (LZ0 + LZ1) / 2, brass); k.box(4.6, 0.06, LZ0 - LZ1 - 4, x, TER + LH - 0.28, (LZ0 + LZ1) / 2, k.glow(0xfff1d8, 0.92)); }
      k.point(-8, TER + 9, -41, 0xffe6c0, 60, 26); k.point(8, TER + 9, -41, 0xffe6c0, 60, 26); k.point(0, TER + 8, -36, 0xffe6c0, 30, 18);
      /* the information desk, a curve of oak with a brass top */
      { const deskWood = oak;
        for (let i = 0; i < 12; i++) { const a = PI * (0.18 + (i + 0.5) * (0.64 / 12)), x = Math.cos(a) * 4.2, z = -40.5 + Math.sin(a) * 4.2;
          const o = k.box(1.18, 1.1, 0.5, x, TER + 0.55, z, deskWood); o.rotation.y = -a + PI / 2; const t = k.box(1.22, 0.06, 0.66, x, TER + 1.13, z, brass); t.rotation.y = -a + PI / 2; } }
      for (let i = -1; i <= 1; i++) { const a = PI / 2 + i * 0.5; k.keepOut.push({ x: Math.cos(a) * 4.2, z: -40.5 + Math.sin(a) * 4.2, r: 1.6 }); }
      k.keepOut.push({ x: 0, z: -40.5, r: 3.4 });
      standers.push([0.6, TER, -41.7, 0, 0x2b3a4e], [-1.4, TER, -41.5, 0.3, 0x6a3a2a]);
      k.sign('CENTRAL LIBRARY', 7, 0.8, 0, TER + 7.0, LZ1 + 0.02, 'transparent', '#8a6a34', 100, 0);
      /* benches along the sides, oak */
      for (const s of [-1, 1]) for (const z of [-38.5, -43.5]) { k.box(0.8, 0.45, 3, s * (LX - 3.6), TER + 0.25, z, oak); k.block(s * (LX - 3.6) - 0.5, s * (LX - 3.6) + 0.5, z - 1.6, z + 1.6); }
      sitters.push([-(LX - 3.6), TER + 0.35, -38, PI / 2, 0x3a5a3a], [LX - 3.6, TER + 0.35, -44, -PI / 2, 0x8a2a3a]);
    }

    /* ---- across the plaza: the Bailey Fountain and the Soldiers' and Sailors' Arch ---- */
    {
      const fz = 62, water = k.flat(0x6a8ea8, 0.2, 0.15, { transparent: true, opacity: 0.8 });
      k.cyl(12, 0.9, 0, 0.45, fz, granite, 12.4, 48); k.cyl(11.4, 0.1, 0, 0.9, fz, water, 11.4, 48);
      k.cyl(3.4, 3.2, 0, 1.6, fz, granite, 4.2, 16);
      /* the bronze group on the rock: a standing figure, two reclining, a prow */
      k.mesh(new T.CapsuleGeometry(0.7, 2.6, 4, 10), bronze, 0, 5.6, fz);
      k.sphere(0.55, 0, 7.8, fz, bronze, 10);
      for (const s of [-1, 1]) { const o = k.mesh(new T.CapsuleGeometry(0.6, 2.4, 4, 10), bronze, s * 2.2, 3.7, fz + 0.6); o.rotation.z = s * 1.1; }
      k.box(1.2, 1.2, 3.6, 0, 3.6, fz - 2.6, bronze);
      const jm = k.flat(0xe6f0f6, 0.1, 0.2, { transparent: true, opacity: 0.55 });
      const NJ = 17, jets = k.instances(new T.CylinderGeometry(0.06, 0.2, 1, 6), jm, Array.from({ length: NJ }, () => new T.Matrix4()));
      jets.frustumCulled = false;
      const jm4 = new T.Matrix4(), js = new T.Vector3(), jp = new T.Vector3(), jq = new T.Quaternion();
      const placeJets = (t: number) => {
        for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2, h = 3.2 * (0.75 + 0.25 * Math.sin(t * 1.7 + i * 0.8)); jp.set(Math.cos(a) * 7.5, 0.9 + h / 2, fz + Math.sin(a) * 7.5); js.set(1, h, 1); jets.setMatrixAt(i, jm4.compose(jp, jq, js)); }
        const h = 5 * (0.85 + 0.15 * Math.sin(t * 2.3)); jp.set(0, 8.2 + h / 2, fz); js.set(2, h, 2); jets.setMatrixAt(16, jm4.compose(jp, jq, js));
        jets.instanceMatrix.needsUpdate = true;
      };
      placeJets(0);
      if (!ctx.reduced) k.ticks.push(placeJets);
      /* hedges and trees round the fountain */
      for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; if (Math.abs(Math.cos(a)) < 0.35) continue; k.tree(Math.cos(a) * 22, 0, fz + Math.sin(a) * 18, { kind: 'round', h: 10 + (i % 3), r: 4.5, seed: 500 + i, leaf: 0x557a40 }); }
      /* the Arch: granite piers, the round opening, the attic and the bronze quadriga */
      const AZ = 150, f = 1.3, arch = k.pbr('bcArch', X.ashlar(0x9f988a, 321, 4), 0.18), A = (w: number, h: number, d: number, x: number, y: number, z: number, m: T.Material) => k.box(w * f, h * f, d * f, x * f, y * f, AZ + z * f, m);
      for (const s of [-1, 1]) { A(8, 21, 10, s * 10, 10.5, 0, arch); for (const d of [-1, 1]) k.column((s * 10 + d * 2.6) * f, 3 * f, AZ - 5.6 * f, 14 * f, 0.7 * f, arch, true); A(3.4, 3, 1.6, s * 10, 1.5, -5.6, arch); }
      k.arch(12 * f, 18 * f, 10 * f, 0, 0, AZ, arch, false, 0.8 * f);
      A(28, 6, 10.4, 0, 24, 0, arch); A(29, 0.9, 11, 0, 27.4, 0, arch);
      /* the quadriga: four horses abreast, the chariot, Columbia standing in it with two winged Victories */
      for (let i = 0; i < 4; i++) { A(1.1, 1.6, 3.4, -3 + i * 2, 29.3, -1.2, bronze); A(0.8, 1.3, 0.9, -3 + i * 2, 30.4, -2.9, bronze); for (const dz of [-2.4, 0]) for (const dx of [-0.3, 0.3]) A(0.25, 1.6, 0.25, -3 + i * 2 + dx, 28.6, -1.2 + dz, bronze); }
      A(4, 2.2, 2.6, 0, 29.3, 1.6, bronze); k.cyl(0.55 * f, 3 * f, 0, 31.9 * f, AZ + 1.6 * f, bronze, 0.4 * f, 8); k.sphere(0.5 * f, 0, 34 * f, AZ + 1.6 * f, bronze, 8); k.beam(v(0, 33 * f, AZ + 1.6 * f), v(0.8 * f, 36 * f, AZ + 1.6 * f), 0.1 * f, bronze, 4);
      for (const s of [-1, 1]) { k.mesh(new T.CapsuleGeometry(0.5 * f, 1.6 * f, 4, 8), bronze, s * 3.2 * f, 32 * f, AZ + 3.2 * f); A(2.6, 0.2, 1, s * 4.2, 33.2, 3.2, bronze); }
      k.block(-26 * f, 26 * f, AZ - 12, AZ + 12);
      /* the oval of trees round the plaza, and the buildings beyond it */
      for (let i = 0; i < 44; i++) { const a = (i / 44) * PI * 2; const x = Math.cos(a) * 0.7 * 102, z = 112 + Math.sin(a) * 102; if (z < 30 || Math.abs(x) < 22) continue; k.tree(x, 0, z, { kind: 'round', h: 13 + (i % 4), r: 5.5, seed: 700 + i, leaf: 0x46703a }); }
      for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; const x = Math.cos(a) * 0.7 * 66, z = 112 + Math.sin(a) * 66; if (Math.abs(x) < 22) continue; k.tree(x, 0, z, { kind: 'round', h: 11, r: 5, seed: 800 + i, leaf: 0x557a40 }); }
      const apt = k.pbr('bcApt', X.windows(322, 0.25, 0x8a6e58, true), 0.12, { emissive: 0xffffff, emissiveIntensity: 0.05 + 0.9 * k.night, roughness: 0.8, stretch: 0.5 }),
        aptB = apt;
      const rnd = X.mulberry(1941);
      for (let i = 0; i < 18; i++) { const a = PI * (0.12 + (i / 17) * 0.76); const x = Math.cos(a) * 0.7 * 150, z = 112 + Math.sin(a) * 150, h = 18 + rnd() * 26; const o = k.box(22 + rnd() * 10, h, 18, x, h / 2, z, i % 2 ? apt : aptB); o.rotation.y = -Math.atan2(x, z - 112) + PI; }
      /* Prospect Park on the far side of Flatbush: a mass of trees */
      for (let i = 0; i < 30; i++) { const p = wpt(1, 8 + rnd() * 120, 28 + rnd() * 50), x = p.x, z = p.z; k.tree(x, 0, z, { kind: 'round', h: 12 + rnd() * 6, r: 6 + rnd() * 2, seed: 900 + i, leaf: [0x46703a, 0x557a40][i % 2] }); }
      /* across Eastern Parkway, apartment houses */
      for (let i = 0; i < 7; i++) { const p = wpt(-1, 10 + i * 17, 36 + (i % 2) * 6), h = 20 + rnd() * 18; const o = k.box(24, h, 15, p.x, h / 2, p.z, apt); o.rotation.y = Math.atan2(0.8, -0.6) * -1; }
    }
    /* London planes on the forecourt edge */
    for (const x of [-56, -46, -36, -26, 26, 36, 46, 56]) { k.tree(x, 0, 11, { kind: 'round', h: 12, r: 5, seed: 1000 + x, leaf: 0x557a40 }); k.box(1.6, 0.12, 1.6, x, 0.08, 11, soil); if (Math.abs(x) < 38) k.keepOut.push({ x, z: 11, r: 0.8 }); }

    /* ---- traffic round the plaza: cars, cabs and a bus, one instanced mesh ---- */
    {
      const carGeo = mergeGeometries([part(1.85, 0.8, 4.5, 0, 0.62, 0), part(1.6, 0.62, 2.4, 0, 1.3, -0.2)])!;
      const NC = 30, cars = k.instances(carGeo, new T.MeshStandardMaterial({ roughness: 0.35, metalness: 0.4 }), Array.from({ length: NC }, () => new T.Matrix4()));
      cars.frustumCulled = false; noShadow.push(cars);
      const rnd = X.mulberry(1892), c = new T.Color(), pal = [0xf2c21a, 0xf2c21a, 0xf2c21a, 0x1c1e22, 0xe8e8e4, 0x8a1c22, 0x2a4a78, 0x9aa0a8, 0x2a2c30, 0x3a5a48];
      const st = Array.from({ length: NC }, (_, i) => ({ a: (i / NC) * PI * 2 + rnd() * 0.1, lane: i % 2, w: 0.075 + rnd() * 0.02 }));
      for (let i = 0; i < NC; i++) cars.setColorAt(i, c.set(pal[Math.floor(rnd() * pal.length)]));
      if (cars.instanceColor) cars.instanceColor.needsUpdate = true;
      const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), up = new T.Vector3(0, 1, 0);
      const place = (t: number) => {
        st.forEach((s, i) => {
          const a = s.a + t * s.w, rr = s.lane ? 84 : 91, x = Math.cos(a) * rr * 0.7, z = 112 + Math.sin(a) * rr;
          const dx = -Math.sin(a) * rr * 0.7, dz = Math.cos(a) * rr;
          p.set(x, 0.07, z); q.setFromAxisAngle(up, Math.atan2(dx, dz)); m.compose(p, q, one); cars.setMatrixAt(i, m);
        });
        cars.instanceMatrix.needsUpdate = true;
      };
      place(0);
      if (!ctx.reduced) k.ticks.push(place);
      /* the bus on Flatbush, coming and going past the library */
      const bus = new T.Group();
      const bb = new T.Mesh(new T.BoxGeometry(2.6, 3.0, 12.2), k.flat(0xe8ecee, 0.3, 0.4)); bb.position.y = 1.7; bus.add(bb);
      const bw = new T.Mesh(new T.BoxGeometry(2.64, 1.0, 11.4), k.flat(0x1a2530, 0.4, 0.2)); bw.position.y = 2.3; bus.add(bw);
      const bs = new T.Mesh(new T.BoxGeometry(2.65, 0.35, 12.25), k.flat(0x1f5aa8, 0.2, 0.5)); bs.position.y = 1.0; bus.add(bs);
      k.add(bus);
      const d = WD(1), b0 = wpt(1, -6, 10.5), b1 = wpt(1, 180, 10.5);
      if (!ctx.reduced) k.rider(bus, k.spline([b0, b1, wpt(1, 184, 16), wpt(1, -10, 16)], true, 0.1), 9, 0);
      else { bus.position.copy(b0).addScaledVector(d, 50); bus.rotation.y = Math.atan2(d.x, d.z); }
    }

    /* ---- people: sitting on the steps and the coping, walking in and out, crossing the forecourt ---- */
    {
      const rnd = X.mulberry(1997), pal = [0x24262c, 0x8a3a3a, 0x33477f, 0xd8d0c0, 0x4a6a3a, 0x151517, 0xc9a25a, 0x6a4a8a, 0xe6e2da, 0x2b5f6e];
      const col = () => pal[Math.floor(rnd() * pal.length)];
      /* on the central steps, facing the plaza */
      for (let i = 0; i < 4; i++) for (let j = 0; j < 7; j++) { if (rnd() < 0.45) continue; const th = -NS + 0.03 + rnd() * (2 * NS - 0.06), p = P(TR0 - 0.75 * i - 0.4, th); sitters.push([p.x, TER - 0.3 * i - 0.05, p.z, -th + PI, col()]); }
      /* on the coping of the terrace wall */
      for (const s of [-1, 1]) for (let j = 0; j < 9; j++) { if (rnd() < 0.3) continue; const th = s * (NS + 0.05 + rnd() * (SIDE0 - NS - 0.1)), p = P(TR0 - 0.2, th); sitters.push([p.x, TER + 0.25, p.z, -th + PI, col()]); }
      /* a few standing on the terrace, reading, talking */
      for (const [x, z, c, ry] of [[-4.5, -24.5, 0x2a2a34, 0.4], [-3.9, -25.1, 0xe8e2d4, -2.4], [9.5, -22.6, 0x8a3a3a, 2.8], [-15.5, -18.6, 0x33477f, 0.2], [17, -16.8, 0x151517, -0.6]] as [number, number, number, number][]) { standers.push([x, TER, z, ry, c]); k.keepOut.push({ x, z, r: 0.5 }); }
      const up = new T.Vector3(0, 1, 0), c = new T.Color();
      for (const [list, geo] of [[sitters, figureGeo(0.19, 0.36, 0.9)], [standers, figureGeo(0.2, 0.82, 1.35)]] as [typeof sitters, T.BufferGeometry][]) {
        const o = k.instances(geo, new T.MeshStandardMaterial({ roughness: 0.85 }), list.map(([x, y, z, ry]) => new T.Matrix4().compose(v(x, y, z), new T.Quaternion().setFromAxisAngle(up, ry), one)));
        list.forEach((f, i) => o.setColorAt(i, c.set(f[4]))); if (o.instanceColor) o.instanceColor.needsUpdate = true;
      }
      if (!ctx.reduced) {
        const cr = [k.crowd([v(-62, 0.03, 6.5), v(0, 0.03, 7.5), v(62, 0.03, 6.5)], 22, { seed: 155, speed: 1.0, spread: 3 }),
          k.crowd([v(-3, 0.03, 9), v(-2, 0.03, -10), v(-1, 0.03, -12.8), v(-0.5, TER, -16.8), v(0, TER, -28), v(0, TER, -34.2), v(-6, TER, -35), v(-9, TER, -44), v(-3, TER, -47), v(-6, TER, -36), v(0, TER, -33.2)], 22, { seed: 156, speed: 0.9, spread: 1.4 }),
          k.crowd([v(-12, TER, -34.6), v(12, TER, -34.6), v(12, TER, -48.4), v(-12, TER, -48.4)], 8, { seed: 159, speed: 0.6, spread: 1.6, closed: true })];
        for (const c of cr) noShadow.push(c.head);
      }
    }
    /* ---- pigeons on the forecourt: they peck, and now and then the whole flock goes up and round ---- */
    {
      const NP = 22, pg = k.instances(mergeGeometries([part(0.13, 0.12, 0.28, 0, 0.14, 0), part(0.08, 0.08, 0.09, 0, 0.24, 0.14), part(0.17, 0.05, 0.22, 0, 0.17, -0.02), part(0.06, 0.03, 0.14, 0, 0.16, -0.18)])!, k.flat(0x7c7e86, 0, 0.8), Array.from({ length: NP }, () => new T.Matrix4()));
      pg.frustumCulled = false; noShadow.push(pg);
      const rnd = X.mulberry(2002), ps = Array.from({ length: NP }, () => ({ x: 5 + rnd() * 9, z: -6 + rnd() * 8, ph: rnd() * 6.3, ry: rnd() * 6.3 }));
      const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), e = new T.Euler();
      const place = (t: number) => {
        const cyc = ((t % 38) + 38) % 38, fly = cyc > 30 ? Math.sin(((cyc - 30) / 8) * PI) : 0;
        ps.forEach((b, i) => {
          const a = t * 1.3 + b.ph;
          const peck = fly > 0.02 ? 0 : 0.06 * Math.max(0, Math.sin(t * 5 + b.ph));
          p.set(b.x + fly * Math.cos(a) * 9, fly * (7 + (i % 4)), b.z + fly * Math.sin(a) * 9);
          e.set(peck * 4, fly > 0.02 ? -a : b.ry + 0.3 * Math.sin(t * 0.5 + b.ph), 0); q.setFromEuler(e);
          m.compose(p, q, one); pg.setMatrixAt(i, m);
        });
        pg.instanceMatrix.needsUpdate = true;
      };
      place(0);
      if (!ctx.reduced) k.ticks.push(place);
    }
    /* light on the screen at night, and the lobby glowing through the doors */
    if (k.night > 0.3) { k.spot(0, 15, -12, 0, 8, SZ, 0xffe2b0, 140, 0.36, 0.7, 45); for (const x of [-PX, PX]) k.spot(x * 1.6, 14, -14, x, 8, PZ1, 0xffe2b0, 70, 0.3, 0.7, 35); k.point(0, TER + 3, -33.5, 0xffe2b8, 40, 12); }
    k.point(0, TER + 3.5, -30.2, 0xffe8c8, 10 + 20 * k.night, 8);

    /* small movers and far things stay out of the shadow pass; the kit turns shadows on at batch time, so switch them off on the first frame */
    { let done = false; k.ticks.push(() => { if (done) return; done = true; for (const o of noShadow) o.castShadow = false; }); }

    /* ---- the works: on the granite of the curved front along the terrace, and on the oak of the lobby ---- */
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (const th of [0.27, 0.405, 0.54, 0.675]) {
      const t = s * th, p = P(39.92, t), q = P(35.6, t);
      mounts.push({ position: v(p.x, TER + 2.6, p.z), rotation: -t, target: v(q.x, TER + 2.6, q.z), width: 4.2, height: 2.9, style: 'gilt', wash: true });
    }
    /* in the lobby, in walking order: down the left wall, across the back, up the right */
    const lobbyM = (x: number, z: number, rot: number, tx: number, tz: number, w: number, h: number) => mounts.push({ position: v(x, TER + 3.1, z), rotation: rot, target: v(tx, TER + 2.6, tz), width: w, height: h, style: 'gilt', wash: true });
    for (const z of [-35.2, -41, -46.8]) lobbyM(-(LX - 0.03), z, PI / 2, -(LX - 4.4), z, 3.6, 2.6);
    for (const x of [-13.5, -4.5, 4.5, 13.5]) lobbyM(x, LZ1 + 0.03, 0, x, LZ1 + 4.2, 3.8, 2.7);
    for (const z of [-46.8, -41, -35.2]) lobbyM(LX - 0.03, z, -PI / 2, LX - 4.4, z, 3.6, 2.6);
    k.censusWall({ x: 0, y: TER + 9.3, z: LZ1 + 0.05, rotY: 0, cols: 20, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(7500, 80), pieces: ctx.all, backing: bronzeDark });

    /* ---- where the visitor can walk: the curve and the building behind it are solid ---- */
    for (const s of [-1, 1]) for (let th = PORT - 0.01; th <= TH_END + 0.02; th += 0.018) { const p = P(41, s * th); k.keepOut.push({ x: p.x, z: p.z, r: 1.05 }); }
    /* the edge of the terrace where there is no stair: the planting beds */
    for (const s of [-1, 1]) for (let th = NS + 0.02; th <= SIDE0 - 0.01; th += 0.04) { const p = P(TR0 - 1.7, s * th); k.keepOut.push({ x: p.x, z: p.z, r: 1.5 }); }
    const zArc = (x: number) => CZ - Math.sqrt(R * R - x * x);
    for (const s of [-1, 1]) {
      for (let x0 = 6.1; x0 < 36; x0 += 2) {
        const x1 = x0 + 2, zTop = zArc(Math.max(x0 - 0.2, 0)) - 0.9, zBot = x0 < LX + 0.5 ? LZ0 + 0.1 : -80;
        if (zTop > zBot) k.block(Math.min(s * x0, s * x1), Math.max(s * x0, s * x1), zBot, zTop);
      }
      k.block(Math.min(s * (LX - 0.1), s * 40), Math.max(s * (LX - 0.1), s * 40), -80, LZ0 + 0.3);
    }
    /* the fountain of the lobby desk is handled by keepOut above; the back wall */
    k.block(-40, 40, -80, LZ1 + 0.2);
    /* the floor: forecourt at 0, terrace at 1.2, the stairs between */
    const floorY = (x: number, z: number) => {
      if (z < LZ0 + 0.6) return TER;
      const { r, th } = polar(x, z), a = Math.abs(th);
      if (r >= TR0 && a <= SIDE0) return TER;
      if (r >= TR0 && a > SIDE0 && a < SIDE1 + 0.02) return TER * Math.max(0, Math.min(1, (SIDE1 + 0.02 - a) / (SIDE1 + 0.02 - SIDE0)));
      if (r >= TR0 - 3 && r < TR0 && a <= NS) return TER * Math.max(0, (r - (TR0 - 3)) / 3);
      return 0;
    };

    /* ---- what the building knows ---- */
    const wiki = { name: 'Central Library (Brooklyn Public Library), Wikipedia', url: 'https://en.wikipedia.org/wiki/Central_Library_(Brooklyn_Public_Library)' };
    const bpl = { name: 'Central Library, Brooklyn Public Library', url: 'https://www.bklynlibrary.org/locations/central' };
    k.egg(v(0, TOP + 1, -34), { id: 'open-book', title: 'Shaped like an open book', year: '1941', text: 'Raymond F. Almirall designed a Beaux-Arts library here in 1911; only the Flatbush Avenue wing was built before money ran out, and the design was scrapped. Alfred Morton Githens and Francis Keally redesigned it in Art Deco in 1935, and the building, meant to look like an open book seen from the air, opened on February 1, 1941.', clue: 'Look at it from above in your head: the spine is where you are standing, the pages run down the two avenues.', source: wiki }, { r: 6 });
    k.egg(v(0, PY0 + 4, SZ + 0.4), { id: 'screen-fifteen', title: 'Fifteen gilded panels', text: 'The bronze entrance screen is 40 feet tall and split into fifteen square gilded panels, each showing a character from literature, by the sculptors Thomas Hudson Jones and C. Paul Jennewein. The library describes them as famous characters and authors from American literature.', clue: 'Count the squares over the doors. Each one is somebody from a book.', source: wiki }, { r: 4 });
    k.egg(v(-PX, TER + 9, PZ1 + 0.3), { id: 'pylons', title: 'The evolution of art and science', text: 'The 50 foot entry portico is set into a concave facade that reflects the oval of Grand Army Plaza. The columns either side of the screen carry gilded bas-reliefs by Jennewein which, in the library\'s words, depict the evolution of art and science.', clue: 'Read the pylon from the bottom up.', source: bpl }, { r: 2.5 });
    { const p = lampAt[0]; k.egg(v(p.x, TER + 1.4, p.z), { id: 'capstones', title: 'Words under the lamps', text: 'Three stairways, from the north, the northwest and the southwest, climb to the terrace, with small planting beds and metal fences between them. The granite capstones below the lamps carry inscriptions by Raymond Ingersoll, and the main entrance faces the Soldiers\' and Sailors\' Arch across the plaza.', clue: 'Turn round at the top of the steps. What is the door looking at?', source: wiki }, { r: 1.4 }); }
    k.egg(v(0, TER + 7.4, LZ1 + 0.3), { id: 'lobby-2021', title: 'A million and a half books behind the door', year: '2021', text: 'The Central Library has about 350,000 square feet on four storeys and holds over 1.7 million items. A renovation finished in 2021 redid the interior in a style close to the original, with light terrazzo floors, blond oak and metal accents. It became a city landmark on June 17, 1997.', clue: 'Look down at the floor and along the walls: the lobby is dressed the way it was in 1941.', source: wiki }, { r: 3 });

    /* the route: up the steps, out along the left of the terrace and back, out along the right and back,
       through the middle door, and round the lobby. Resampled every 0.6 m so walking it has an even pace. */
    const E = 3, ext = (th: number) => P(35.6, th).setY(TER + E);
    const route = [v(0, E, -4), v(0, E, -11.5), v(0, TER + E, -17.5), P(31, -0.12).setY(TER + E), ext(-0.27), ext(-0.405), ext(-0.54), ext(-0.675), P(31, -0.12).setY(TER + E), v(0, TER + E, -21),
      P(31, 0.12).setY(TER + E), ext(0.27), ext(0.405), ext(0.54), ext(0.675), P(31, 0.12).setY(TER + E), v(0, TER + E, -23), v(0, TER + E, -30), v(0, TER + E, -34),
      v(-LX + 4.4, TER + E, -35.2), v(-LX + 4.4, TER + E, -41), v(-LX + 4.4, TER + E, -46.2), v(-4.5, TER + E, -46.2), v(4.5, TER + E, -46.2), v(LX - 4.4, TER + E, -46.2), v(LX - 4.4, TER + E, -41), v(LX - 4.4, TER + E, -35.2), v(0, TER + E, -34)];
    const path: T.Vector3[] = [];
    for (let i = 0; i < route.length - 1; i++) { const a = route[i], b = route[i + 1], n = Math.max(1, Math.round(a.distanceTo(b) / 0.6)); for (let j = 0; j < n; j++) path.push(a.clone().lerp(b, j / n)); }
    path.push(route[route.length - 1].clone());
    return { mounts, spawn: v(0, E, -4), look: v(0, 9, -30), eye: E, floorY, path, bounds: [-35, 35, LZ1 + 0.4, 14.5], style: 'gilt' };
  },
};
