/* Rooms 17 to 21: Unisphere, Roosevelt Island Tram, the Cloisters, Navy Yard dry dock, Governors Island hills. */
import * as T from 'three';
import * as X from '../textures';
import { v } from '../kit';
import type { Kit, Mount } from '../kit';
import type { RoomDef } from './types';
import { liberty, LIBERTY_CREDIT } from './b';

const PI = Math.PI;

/* ---------------- THE BIG UPGRADE (2026-11-23, wave 1d): local helpers for rooms 17 to 21 ----------------
   Scanned Poly Haven CC0 sets live in assets/museum/tex/<room>/<name>_{c,n,r}.webp (1k, real tile size in
   metres); real models in assets/museum/props/<room>/. Everything here stays local to this file. */
const HAS_DOM = typeof window !== 'undefined' && typeof HTMLImageElement !== 'undefined';
const TX = 'assets/museum/tex/';
function texLoad(k: Kit, url: string, srgb: boolean, on: (t: T.Texture) => void) {
  if (!HAS_DOM) return;
  k.used.images.add(url);
  k.pending.push(new Promise<void>((res) => new T.TextureLoader().load(url, (t) => {
    t.colorSpace = srgb ? T.SRGBColorSpace : T.NoColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8;
    on(t); res();
  }, undefined, () => res())));
}
/* a scanned surface: tile is the real size of one texture repeat in metres (the kit projects world UVs) */
/* Until its colour map arrives a scanned surface is drawn at the tint times `mean` (about the brightness of
   the scan), so a slow load or a phone on a bad line sees stone coloured stone, not white walls; the tint
   goes back on with the map. */
function scan(k: Kit, room: string, name: string, tile: number, p: Partial<T.MeshStandardMaterialParameters> & { normal?: number; mean?: number } = {}) {
  const { normal = 1, mean = 0.42, ...rest } = p;
  const m = new T.MeshStandardMaterial({ roughness: 1, metalness: 0, normalScale: new T.Vector2(normal, normal), ...rest });
  const tint = m.color.clone();
  m.color.copy(tint).multiplyScalar(mean);
  m.userData.density = 1 / tile;
  const u = TX + room + '/' + name;
  texLoad(k, u + '_c.webp', true, (t) => { m.map = t; m.color.copy(tint); m.needsUpdate = true; });
  texLoad(k, u + '_n.webp', false, (t) => { m.normalMap = t; m.needsUpdate = true; });
  texLoad(k, u + '_r.webp', false, (t) => { m.roughnessMap = t; m.needsUpdate = true; });
  return m;
}
/* many copies of one real model as instanced meshes: one load, one draw call per sub mesh */
type Place = { x: number; y: number; z: number; ry?: number; s?: number };
function propMany(k: Kit, name: string, at: Place[], shadows = true) {
  if (!at.length) return;
  k.pending.push(Promise.resolve(k.prop(name, 0, -500, 0, { scale: 1 })).then((o) => {
    if (!o) return;
    o.updateMatrixWorld(true);
    const inv = o.matrixWorld.clone().invert(), up = new T.Vector3(0, 1, 0);
    const meshes: T.Mesh[] = [];
    o.traverse((c) => { if (c instanceof T.Mesh) meshes.push(c); });
    for (const me of meshes) {
      const local = new T.Matrix4().multiplyMatrices(inv, me.matrixWorld);
      const im = k.instances(me.geometry, me.material as T.Material, at.map((p) => new T.Matrix4().compose(new T.Vector3(p.x, p.y, p.z), new T.Quaternion().setFromAxisAngle(up, p.ry ?? 0), new T.Vector3().setScalar(p.s ?? 1)).multiply(local)));
      if (!shadows) im.castShadow = false;
    }
    o.visible = false;
  }).then(() => undefined));
}
/* a Firefly plate queued in FIREFLY_QUEUE.md: when the file exists it replaces the drawn placeholder; until
   then the request 404s quietly and the canvas stays. Not added to k.used, so the mint kit never asks for it. */
function swapIn(url: string, on: (t: T.Texture) => void) {
  if (!HAS_DOM) return;
  new T.TextureLoader().load(url, (t) => { t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; on(t); }, undefined, () => undefined);
}
/* Keep a see-through cut-out out of the engine's override passes (ambient occlusion renders every mesh as a
   solid quad with its own material, so a strip of floating letters would leave a grey box of shadow behind
   it). While a pass has an override material up, the object is collapsed to nothing for that draw. */
function noPost(o: T.Object3D) {
  const keep = new T.Matrix4(), zero = new T.Matrix4().makeScale(0, 0, 0);
  o.onBeforeRender = (_r, scene) => { if (scene.overrideMaterial) { keep.copy(o.matrixWorld); o.matrixWorld.copy(zero); } };
  o.onAfterRender = (_r, scene) => { if (scene.overrideMaterial) o.matrixWorld.copy(keep); };
  return o;
}
/* a canvas texture; in the node room checks there is no canvas, so the material stays plain */
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  if (!HAS_DOM) return null;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
/* Anamorphic floor painting: an upright picture w by h metres, standing d metres from the eye along dir,
   projected onto the plane y = floorY through the eye. From the eye it reads as a flat upright sign; from
   anywhere else it is a long smear on the ground. */
function anamorph(k: Kit, eye: T.Vector3, dir: T.Vector3, d: number, w: number, h: number, floorY: number | ((x: number) => number), tex: T.Texture | null, color = 0xffffff, opacity = 0.92) {
  const f = dir.clone().normalize(), right = new T.Vector3().crossVectors(f, new T.Vector3(0, 1, 0)).normalize(), up = new T.Vector3().crossVectors(right, f).normalize();
  const c = eye.clone().addScaledVector(f, d);
  const g = new T.PlaneGeometry(w, h, 48, 24), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const vp = c.clone().addScaledVector(right, p.getX(i)).addScaledVector(up, p.getY(i));
    if (typeof floorY === 'number') { const t = (floorY - eye.y) / (vp.y - eye.y), q = eye.clone().addScaledVector(vp.sub(eye), t); p.setXYZ(i, q.x, floorY + 0.015, q.z); continue; }
    /* a stepped surface y = floorY(x): march the ray until it passes under, then halve the step to the face,
       and lift the point a hair toward the eye so it never sinks into a tread or riser */
    const r = vp.sub(eye).normalize(), q = new T.Vector3();
    let a = 0, b = 0;
    for (let tt = 0.5; tt < 200; tt += 0.25) { q.copy(eye).addScaledVector(r, tt); if (q.y <= floorY(q.x)) { b = tt; break; } a = tt; }
    for (let j = 0; j < 22 && b; j++) { const m = (a + b) / 2; q.copy(eye).addScaledVector(r, m); if (q.y <= floorY(q.x)) b = m; else a = m; }
    q.copy(eye).addScaledVector(r, b - 0.02);
    p.setXYZ(i, q.x, q.y, q.z);
  }
  g.computeVertexNormals();
  const m = new T.MeshBasicMaterial({ color, ...(tex ? { map: tex } : {}), transparent: true, opacity, depthWrite: false, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 });
  const o = k.mesh(g, m, 0, 0, 0, true);
  o.renderOrder = 2;
  return o;
}

/* the coastlines for the Unisphere's steel continents, [longitude, latitude] in degrees, simplified by hand
   to the scale of a 120 foot globe (Sri Lanka is there because the 2010 tornado took it off the real one) */
const WORLD: [number, number][][] = [
  [[-168, 65], [-156, 71], [-130, 70], [-110, 73], [-95, 72], [-82, 73], [-78, 64], [-70, 62], [-64, 60], [-56, 52], [-60, 47], [-66, 45], [-70, 42], [-74, 40], [-76, 35], [-81, 31], [-80, 25], [-83, 29], [-90, 29], [-97, 26], [-97, 21], [-90, 21], [-87, 15], [-83, 9], [-79, 8], [-86, 13], [-92, 15], [-105, 20], [-110, 24], [-112, 31], [-118, 34], [-124, 40], [-124, 48], [-133, 56], [-148, 60], [-160, 58], [-165, 62]],
  [[-55, 60], [-42, 60], [-20, 70], [-20, 82], [-60, 82], [-72, 77], [-55, 68]],
  [[-79, 8], [-72, 12], [-60, 10], [-50, 0], [-35, -6], [-39, -14], [-48, -26], [-58, -38], [-65, -42], [-68, -52], [-74, -52], [-73, -40], [-71, -20], [-81, -5], [-78, 2]],
  [[-10, 36], [-9, 43], [-2, 44], [-5, 48], [2, 51], [8, 54], [10, 58], [5, 62], [15, 69], [28, 71], [40, 67], [60, 69], [80, 73], [100, 77], [120, 73], [140, 72], [160, 70], [180, 68], [180, 64], [170, 60], [160, 55], [156, 51], [142, 58], [135, 43], [128, 35], [122, 40], [120, 30], [110, 20], [106, 10], [100, 13], [98, 8], [103, 1], [100, 6], [95, 16], [90, 22], [80, 15], [77, 8], [72, 20], [66, 25], [57, 25], [52, 27], [48, 30], [56, 24], [59, 22], [52, 15], [43, 12], [39, 21], [34, 28], [35, 33], [36, 36], [27, 37], [26, 40], [23, 40], [20, 40], [16, 38], [12, 44], [8, 44], [3, 43], [0, 39]],
  [[-17, 15], [-10, 6], [-4, 5], [9, 4], [9, -1], [13, -12], [12, -18], [18, -34], [26, -34], [33, -26], [40, -15], [40, -4], [51, 12], [43, 12], [37, 22], [32, 31], [20, 32], [10, 37], [-6, 36], [-10, 30], [-17, 21]],
  [[114, -22], [122, -18], [131, -12], [137, -12], [142, -11], [146, -19], [153, -26], [150, -37], [144, -38], [135, -35], [129, -32], [115, -34]],
  [[-180, -70], [-120, -73], [-60, -64], [0, -70], [60, -67], [120, -66], [180, -70], [180, -90], [-180, -90]],
  [[-5, 50], [1, 51], [-2, 55], [-3, 58.5], [-6, 57], [-5, 54], [-3, 53]],
  [[130, 31], [135, 34], [140, 36], [142, 40], [141, 43], [145, 44], [141, 45], [139, 40], [136, 36], [132, 34]],
  [[44, -25], [47, -25], [50, -15], [48, -13]],
  [[109, 1], [118, 7], [119, 0], [116, -4], [110, -3]],
  [[95, 5], [106, -6], [104, -5], [95, 3]],
  [[131, -1], [141, -3], [150, -10], [141, -9], [137, -5]],
  [[172, -34], [178, -38], [174, -41], [167, -46], [171, -44]],
  [[79.8, 6], [82, 7.5], [80, 9.8]],
  [[-24, 64], [-14, 64], [-14, 66], [-22, 66.5]],
  [[-85, 22], [-74, 20], [-78, 22.5]],
];

/* ---------------- 17 UNISPHERE ---------------- */
export const unisphere: RoomDef = {
  id: 'unisphere',
  name: 'The boroughs in orbit',
  area: 'FLUSHING MEADOWS',
  mood: 'Worlds within worlds',
  color: '#a5cfdf',
  description: 'The steel globe over its fountain basin, orbit rings, radial panels of New Yorkers around the promenade.',
  signatures: 'The open steel lattice globe with continents in relief, three orbit rings, the circular fountain basin, the pavilion towers beyond.',
  build(k, ctx) {
    k.sky({ top: 0x3f78c0, horizon: 0xbcd2e2, ground: 0x55704a, fog: 0.0014, sun: { az: 2.6, el: 0.75, color: 0xfff6e2, size: 14 }, env: 1.0 });
    k.hemi(0xeaf4ff, 0x8a8478, 0.75);
    k.sun(0xfff4dc, 2.5, 30, 60, 30, true, 70);
    /* 2026-11-23: scanned CC0 surfaces (Poly Haven) at their real size: hex pavers, flamed granite, the
       pale blue painted pool, lawn. The basin is now hollow: a floor, a coping and a sheet
       of water you can see the jets and the pool floor through. */
    const steel = k.pbr('sphereSteel', X.steel(0xb8bec4, false, 11), 0.6, { metalness: 0.9, roughness: 0.3 }),
      lawn = scan(k, 'unisphere', 'grass', 2.0, { color: 0x94b47c }),
      pav = scan(k, 'unisphere', 'hexpave', 1.6, { color: 0xaaa69e }),
      granite = scan(k, 'unisphere', 'granite', 2.3, { color: 0xb2aea6, roughness: 0.8 }),
      poolFloor = scan(k, 'unisphere', 'poolfloor', 2.0, { color: 0x5f8fa0 }),
      water = new T.MeshPhysicalMaterial({ color: 0x2f6878, metalness: 0.05, roughness: 0.06, transparent: true, opacity: 0.78, depthWrite: false }),
      dark = k.flat(0x2b2f33, 0.6, 0.5),
      glow = k.glow(0xe4f6ff);
    const C = v(0, 0, -30), R = 22;
    k.box(400, 0.4, 400, 0, -0.3, -40, lawn);
    k.mesh(new T.RingGeometry(17.5, 27, 96), pav, C.x, 0.02, C.z).rotation.x = -PI / 2;
    /* the basin: floor, coping wall with a rounded lip, a sheet of water */
    k.mesh(new T.CircleGeometry(16.7, 96), poolFloor, C.x, 0.12, C.z).rotation.x = -PI / 2;
    k.lathe([[16.6, 0.1], [16.6, 0.95], [16.75, 1.05], [17.35, 1.05], [17.55, 0.92], [17.55, 0.0]], C.x, 0, C.z, granite, 96);
    k.mesh(new T.CircleGeometry(16.6, 96), water, C.x, 0.78, C.z, true).rotation.x = -PI / 2;
    k.keepOut.push({ x: C.x, z: C.z, r: 18.2 });
    // the globe: meridians, parallels, continents, orbits
    const G = 11, GY = 15;
    /* the globe leans 23.5 degrees, the tilt of the Earth's axis; every part of it is turned about its centre */
    const TILT = new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), (23.5 * PI) / 180);
    const GC = v(C.x, GY, C.z);
    const tilt = (o: T.Object3D) => { o.position.sub(GC).applyQuaternion(TILT).add(GC); o.quaternion.premultiply(TILT); return o; };
    for (let j = -5; j <= 5; j++) { const t = (j * PI) / 12, r = G * Math.cos(t); const ring = k.torus(r, 0.07, C.x, GY + G * Math.sin(t), C.z, steel, 72); ring.rotation.x = PI / 2; tilt(ring); }
    for (let j = 0; j < 12; j++) { const ring = k.torus(G, 0.07, C.x, GY, C.z, steel, 72); ring.rotation.y = (j * PI) / 12; tilt(ring); }
    /* The continents (2026-11-23): one steel shell cut by a map of the real coastlines, in place of eight
       blobs. A world outline drawn in longitude and latitude becomes the alpha of a sphere just outside the
       lattice, so the land reads as plate steel on the grid, as on the real globe. The globe is turned so the
       Americas face the arrival; SPIN is that turn, and `onGlobe` places a point by latitude and longitude. */
    const SPIN = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), -0.35);
    const onGlobe = (lat: number, lon: number, r = G + 0.06) => {
      const ph = ((lon + 180) / 360) * PI * 2, th = ((90 - lat) * PI) / 180;
      return v(-r * Math.cos(ph) * Math.sin(th), r * Math.cos(th), r * Math.sin(ph) * Math.sin(th)).applyQuaternion(SPIN).applyQuaternion(TILT).add(GC);
    };
    const landTex = canvasTex(2048, 1024, (g) => {
      g.fillStyle = '#000'; g.fillRect(0, 0, 2048, 1024); g.fillStyle = '#fff';
      for (const poly of WORLD) { g.beginPath(); poly.forEach(([lo, la], i) => { const x = ((lo + 180) / 360) * 2048, y = ((90 - la) / 180) * 1024; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath(); g.fill(); }
    });
    if (landTex) {
      landTex.colorSpace = T.NoColorSpace;
      /* brushed stainless: a streaked grain running along the latitudes drives colour and roughness, full
         metal, so the plates take the sky and the sun the way the real globe does instead of reading as grey card */
      const brush = canvasTex(2048, 1024, (g) => { const rn = X.mulberry(7); g.fillStyle = '#9aa0a6'; g.fillRect(0, 0, 2048, 1024); for (let i = 0; i < 9000; i++) { const y = rn() * 1024, l = 120 + rn() * 900, c = 130 + Math.floor(rn() * 110); g.fillStyle = `rgba(${c},${c + 4},${c + 8},${0.05 + rn() * 0.12})`; g.fillRect(rn() * 2048, y, l, 1 + rn() * 1.6); } });
      const plate = new T.MeshStandardMaterial({ color: 0xe6eaee, metalness: 0.82, roughness: 0.42, alphaMap: landTex, alphaTest: 0.5, side: T.DoubleSide, envMapIntensity: 1.35, ...(brush ? { map: brush, roughnessMap: brush } : {}) });
      const shell = k.mesh(new T.SphereGeometry(G + 0.06, 96, 48), plate, GC.x, GC.y, GC.z, true);
      shell.quaternion.copy(TILT).multiply(SPIN);
      const inner = k.mesh(new T.SphereGeometry(G - 0.04, 96, 48), plate, GC.x, GC.y, GC.z, true);
      inner.quaternion.copy(shell.quaternion);
    }
    /* three orbit rings, believed to stand for Gagarin, Glenn and Telstar */
    const orbits: T.Object3D[] = [];
    for (let j = 0; j < 3; j++) { const ring = k.torus(G + 1.8 + j * 0.4, 0.1, C.x, GY, C.z, steel, 96); ring.rotation.x = 0.45 + j * 0.5; ring.rotation.y = j * 0.9; orbits.push(ring); }
    k.lathe([[3.2, 0], [3.2, 0.5], [1.4, 0.8], [1.0, 3.2], [0.6, 3.6]], C.x, 0.9, C.z, dark, 24);
    k.beam(v(C.x, 4.4, C.z), v(C.x + 3.5, GY - 8, C.z + 2), 0.25, dark, 8);
    k.beam(v(C.x, 4.4, C.z), v(C.x - 3.5, GY - 8, C.z + 2), 0.25, dark, 8);
    k.beam(v(C.x, 4.4, C.z), v(C.x, GY - 8, C.z - 4), 0.25, dark, 8);
    /* 48 fountainheads round the pool edge, arcing in toward the globe, and a ring of 24 upright jets that
       hide the pedestal, as on the real basin. The faint arcs are the water's body; the droplets that run
       along them every frame are what make it read as water and not wire. */
    const jetMat = new T.MeshBasicMaterial({ color: 0xf2fbff, transparent: true, opacity: 0.22, depthWrite: false });
    const arcs: { a: T.Vector3; b: T.Vector3; h: number }[] = [];
    for (let j = 0; j < 48; j++) { const t = (j * PI) / 24; arcs.push({ a: v(C.x + Math.cos(t) * 15.6, 0.8, C.z + Math.sin(t) * 15.6), b: v(C.x + Math.cos(t) * 8.6, 0.8, C.z + Math.sin(t) * 8.6), h: 4.6 }); }
    for (let j = 0; j < 24; j++) { const t = (j * PI) / 12 + 0.13; const a = v(C.x + Math.cos(t) * 4.6, 0.8, C.z + Math.sin(t) * 4.6); arcs.push({ a, b: v(C.x + Math.cos(t) * 5.6, 0.8, C.z + Math.sin(t) * 5.6), h: 7.5 }); }
    const arcAt = (q: { a: T.Vector3; b: T.Vector3; h: number }, u: number, out: T.Vector3) => out.lerpVectors(q.a, q.b, u).setY(0.8 + 4 * q.h * u * (1 - u));
    for (const q of arcs) { const pts = Array.from({ length: 13 }, (_, i) => arcAt(q, i / 12, new T.Vector3())); noPost(k.mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 20, q.h > 5 ? 0.06 : 0.035, 5), jetMat, 0, 0, 0, true)); }
    for (const q of arcs) { const n = k.mesh(new T.CylinderGeometry(0.09, 0.14, 0.25, 8), dark, q.a.x, 0.86, q.a.z); void n; }
    { const DROPS = 14, total = arcs.length * DROPS;
      /* points, not meshes: a few hundred droplets for the cost of one draw, and no shadow or occlusion pass */
      const pos = new T.BufferAttribute(new Float32Array(total * 3), 3), pg = new T.BufferGeometry();
      pg.setAttribute('position', pos);
      const drop = new T.Points(pg, new T.PointsMaterial({ color: 0xffffff, size: 0.16, sizeAttenuation: true, transparent: true, opacity: 0.7, depthWrite: false }));
      drop.frustumCulled = false;
      const P = new T.Vector3();
      const place = (t: number) => { let i = 0; for (const q of arcs) for (let d = 0; d < DROPS; d++, i++) { const u = (d / DROPS + t * (q.h > 5 ? 0.55 : 0.4)) % 1; arcAt(q, u, P); pos.setXYZ(i, P.x, P.y, P.z); } pos.needsUpdate = true; };
      place(0.3);
      k.add(drop);
      if (!ctx.reduced) k.ticks.push((t) => place(t));
    }
    /* the floodlights on the coping that light the globe after dark */
    for (let j = 0; j < 2; j++) { const t = PI / 4 + (j * PI); k.prop('unisphere/flood_lights', C.x + Math.cos(t) * 18.9, 0, C.z + Math.sin(t) * 18.9, { scale: 0.62, rotY: -t - PI / 2 }); }
    // the park axes, allees of trees, the pavilion towers, the far city
    /* the walks radiate north, northeast, southeast and south from the globe (north is minus z) */
    for (const a of [PI * 1.5, PI * 1.75, PI / 4, PI / 2]) {
      k.box(120, 0.1, 6, C.x + Math.cos(a) * 60, 0.03, C.z + Math.sin(a) * 60, pav).rotation.y = -a;
      for (let d = 30; d <= 90; d += 8) for (const s of [-1, 1]) { const x = C.x + Math.cos(a) * d + Math.sin(a) * s * 6, z = C.z + Math.sin(a) * d - Math.cos(a) * s * 6; k.tree(x, 0, z, { kind: 'column', h: 6, r: 2, leaf: 0x3f6b3a, seed: Math.round(d + s) }); }
    }
    /* the New York State Pavilion stands south of the Unisphere: its towers and the Tent of Tomorrow */
    for (const [x, z, h] of [[-14, 44, 26], [-8, 54, 18], [-20, 58, 22]]) { k.cyl(1.6, h as number, x as number, (h as number) / 2, z as number, dark, 1.2, 16); k.cyl(7, 0.8, x as number, h as number, z as number, steel, 7, 24); k.torus(7, 0.25, x as number, (h as number) + 0.5, z as number, dark, 32).rotation.x = PI / 2; }
    for (let j = 0; j < 16; j++) { const t = (j * PI) / 8; k.beam(v(24, 0, 60), v(24 + Math.cos(t) * 14, 9, 60 + Math.sin(t) * 14), 0.2, dark, 6); }
    k.torus(14, 0.35, 24, 9, 60, dark, 48).rotation.x = PI / 2;
    k.skyline({ z: -260, count: 30, spacing: 9, scale: 1.5, base: -2, seed: 30, lit: 0.1, glow: 0.2, tint: 0x9aa0a8, rows: 1 });
    /* the promenade furniture: park lamps outside the ring of panels, slatted benches in the gaps between them */
    propMany(k, 'lamppost', Array.from({ length: 8 }, (_, i) => { const t = PI / 2 + ((i + 0.5) / 8) * PI * 2; return { x: C.x + Math.cos(t) * 30, y: 0, z: C.z + Math.sin(t) * 30, s: 1.3 }; }));
    propMany(k, 'unisphere/modular_street_seating', Array.from({ length: 8 }, (_, i) => { const t = PI / 2 + ((2 * i + 1) / 16) * PI * 2; return { x: C.x + Math.cos(t) * 26.4, y: 0, z: C.z + Math.sin(t) * 26.4, ry: -t + PI / 2, s: 0.78 }; }));
    k.prop('mailbox', C.x + 25, 0, C.z - 14, { height: 1.5 });
    /* the park's own signs: the plaque on a granite plinth at the arrival, the name over the gateway */
    { const sx = 6.2, sz = -10.6, ry = Math.atan2(0 - sx, -8 - sz);
      const pl = k.box(2.6, 1.1, 0.5, sx, 0.55, sz, granite); pl.rotation.y = ry;
      const face = k.box(2.4, 1.3, 0.12, sx, 1.55, sz, k.flat(0x2d3a32, 0.6, 0.4)); face.rotation.set(-0.35, ry, 0, 'YXZ');
      const fo = v(Math.sin(ry), 0, Math.cos(ry)).multiplyScalar(0.08);
      const s1 = k.sign('UNISPHERE', 2.1, 0.34, sx + fo.x, 1.86, sz + fo.z, '#2d3a32', '#e9dfb8', 150, ry); s1.rotation.set(-0.35, ry, 0, 'YXZ');
      const s2 = k.sign('1964 NEW YORK WORLD\'S FAIR  ·  GILMORE D. CLARKE  ·  U.S. STEEL', 2.2, 0.16, sx + fo.x, 1.58, sz + fo.z, '#2d3a32', '#c9c2a4', 28, ry); s2.rotation.set(-0.35, ry, 0, 'YXZ');
      const s3 = k.sign('140 FEET HIGH  ·  120 FEET ACROSS  ·  700,000 POUNDS OF STAINLESS STEEL', 2.2, 0.14, sx + fo.x, 1.36, sz + fo.z, '#2d3a32', '#c9c2a4', 22, ry); s3.rotation.set(-0.35, ry, 0, 'YXZ');
      k.keepOut.push({ x: sx, z: sz, r: 1.5 }); }
    k.sign('FLUSHING MEADOWS CORONA PARK', 12, 0.62, 0, 4.85, 12.2, 'transparent', '#e9e4d8', 58, PI);
    /* THE TRICK, an anamorphic sculpture: the fair's theme cut into strips that float at different depths
       over the basin. From the arrival they line up into one sentence; two steps aside they scatter. */
    { const eye = v(0, 3, -8), aim = v(-8.5, 5.4, -19.9).sub(eye).normalize();
      const right = new T.Vector3().crossVectors(aim, new T.Vector3(0, 1, 0)).normalize(), up = new T.Vector3().crossVectors(right, aim);
      const W = 6.6, H = 0.8, D0 = 10, N = 26, rnd = X.mulberry(64);
      const tex = canvasTex(2048, 256, (g) => { g.clearRect(0, 0, 2048, 256); let fs = 150; g.font = `900 ${fs}px "Archivo", "Arial Black", sans-serif`; fs = Math.floor(fs * Math.min(1, 1960 / g.measureText('PEACE THROUGH UNDERSTANDING').width)); g.font = `900 ${fs}px "Archivo", "Arial Black", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 12; g.strokeStyle = 'rgba(20,32,40,0.9)'; g.strokeText('PEACE THROUGH UNDERSTANDING', 1024, 132); g.fillStyle = '#f4efe2'; g.fillText('PEACE THROUGH UNDERSTANDING', 1024, 132); });
      const mat = new T.MeshBasicMaterial({ ...(tex ? { map: tex } : {}), color: tex ? 0xffffff : 0xf4efe2, transparent: true, alphaTest: 0.2, side: T.DoubleSide, depthWrite: true });
      const rod = k.flat(0x9aa2a8, 0.85, 0.3);
      for (let i = 0; i < N; i++) {
        const d = 6.5 + rnd() * 6.5, s = d / D0, x0 = -W / 2 + (i + 0.5) * (W / N);
        const g = new T.PlaneGeometry(W / N + 0.004, H);
        const uv = g.attributes.uv; for (let j = 0; j < uv.count; j++) uv.setX(j, (i + uv.getX(j)) / N);
        const c = eye.clone().addScaledVector(aim, D0).addScaledVector(right, x0);
        const p = eye.clone().addScaledVector(c.sub(eye), s);
        const o = noPost(k.mesh(g, mat, p.x, p.y, p.z, true));
        o.scale.setScalar(s);
        o.lookAt(eye);
        const bottom = p.clone().addScaledVector(up, -H * s / 2);
        if (bottom.y > 0.8) k.beam(v(bottom.x, 0.78, bottom.z), bottom, 0.012 * s, rod, 4);
      }
      k.egg(eye.clone().addScaledVector(aim, 11), { id: 'unisphere-peace', title: 'Peace through understanding', year: '1964', text: 'The 1964 to 1965 New York World\'s Fair was built around one theme, Peace Through Understanding, and the Unisphere was its symbol. Here the words are cut into strips hung at different depths over the basin: they only line up into a sentence from where you arrived.', clue: 'Go back to where you arrived and look across the water toward the globe.', source: { name: '1964 New York World\'s Fair, Wikipedia', url: 'https://en.wikipedia.org/wiki/1964_New_York_World%27s_Fair' } }, { r: 2.2 });
    }
    // the census at the entrance to the promenade
    k.censusWall({ x: 0, y: 3.0, z: 12.4, rotY: PI, cols: 26, rows: 4, tile: 0.58, gap: 0.05, start: ctx.wallStart(6200 > ctx.all.length - 104 ? 4800 : 6200, 104), pieces: ctx.all, backing: granite });
    for (const x of [-8.5, 8.5]) k.box(0.4, 4, 3, x, 2, 12.4, granite);
    k.box(17.4, 0.4, 3, 0, 4.2, 12.4, granite);
    // the route: a full circle around the basin, works facing inward on the outer ring and outward on the basin rim
    const path = Array.from({ length: 361 }, (_, i) => { const t = PI / 2 + (i / 360) * PI * 2; return v(C.x + Math.cos(t) * R, 3, C.z + Math.sin(t) * R); });
    const mounts: Mount[] = [];
    for (let i = 0; i < 16; i++) {
      const t = PI / 2 + ((i + 0.5) / 16) * PI * 2, rr = 25.6;
      const x = C.x + Math.cos(t) * rr, z = C.z + Math.sin(t) * rr;
      k.box(6.2, 4.4, 0.4, 0, 0, 0, granite).position.set(x, 2.4, z);
      const last = k.objects[k.objects.length - 1];
      last.rotation.y = -t - PI / 2;
      k.box(6.6, 0.3, 1.0, 0, 0, 0, granite).position.set(x, 0.15, z);
      k.objects[k.objects.length - 1].rotation.y = -t - PI / 2;
      mounts.push({ position: v(x - Math.cos(t) * 0.25, 2.8, z - Math.sin(t) * 0.25), rotation: -t - PI / 2, target: v(C.x + Math.cos(t) * R, 3, C.z + Math.sin(t) * R), width: 5.2, height: 3.0, style: 'steel', wash: false });
    }
    for (let i = 0; i < 8; i++) {
      /* The basin rim, outside the globe. At 17.55 this ring sat inside the
         Unisphere's own 18.2 keep out, so all eight works were embedded in the
         sculpture: you walked the promenade at radius 22 and saw panels buried
         in the steel. 19 clears the globe and leaves three metres to the path. */
      const t = PI / 2 + ((i + 0.5) / 8) * PI * 2, rr = 19;
      const x = C.x + Math.cos(t) * rr, z = C.z + Math.sin(t) * rr;
      mounts.push({ position: v(x, 2.4, z), rotation: -t + PI / 2, target: v(C.x + Math.cos(t) * R, 3, C.z + Math.sin(t) * R), width: 3.6, height: 2.2, style: 'steel', wash: false });
      k.box(4.2, 3.4, 0.3, 0, 0, 0, granite).position.set(x - Math.cos(t) * 0.2, 1.9, z - Math.sin(t) * 0.2);
      k.objects[k.objects.length - 1].rotation.y = -t - PI / 2;
    }
    // easter eggs: the tilt, the orbits, the Mohawk light, the lost island, the old foundation, the grass in Antarctica
    const W = { name: 'Unisphere, Wikipedia', url: 'https://en.wikipedia.org/wiki/Unisphere' };
    k.egg(v(C.x, GY, C.z), { id: 'unisphere-tilt', title: 'Earth from 4,000 miles', year: '1964', text: 'The Unisphere is tilted at 23.5 degrees, the angle of the Earth\'s own axis. Seen from the edge of the reflecting pool it shows the planet as it would look from about 4,000 miles away. The steel globe is 120 feet across and weighs 700,000 pounds.', clue: 'Stand back on the promenade and look at the lean of the whole globe.', source: W }, { r: 3.0 });
    k.egg(orbits[1], { id: 'unisphere-orbits', title: 'Three orbits, not twelve', text: 'The three steel rings are believed to trace the orbits of Yuri Gagarin, John Glenn and the Telstar satellite. The first plan had a ring for each of about a dozen satellites, cut to three because it looked better.', clue: 'Follow the rings that loop round the globe.', source: W }, { r: 2.0 });
    /* the extra light on the globe, at the Kahnawake reserve near Montreal */
    const kah = onGlobe(45.4, -73.7, G + 0.2);
    k.sphere(0.16, kah.x, kah.y, kah.z, k.glow(0xfff0c8), 8);
    k.egg(kah, { id: 'unisphere-kahnawake', title: 'A light for the ironworkers', text: 'At the 1964 fair, lights on the globe marked the world\'s capitals. One more light marks the Kahnawake reserve, placed at the request of the Mohawk ironworkers who wanted their work on the structure honoured.', clue: 'Find North America on the globe and look for the extra light.', source: W }, { r: 2.0 });
    k.egg(onGlobe(7.9, 80.7), { id: 'unisphere-sri-lanka', title: 'Blown off the world', year: '2010', text: 'In the September 2010 tornadoes that hit Brooklyn and Queens, the wind tore the steel landmass for Sri Lanka clean off the globe. It was put back the next year.', clue: 'Look at Asia, down near the tip of India.', source: W }, { r: 2.0 });
    k.egg(v(C.x, 2.4, C.z), { id: 'unisphere-perisphere-piles', title: 'Standing on the Perisphere', text: 'The globe stands on a 20 foot inverted tripod, over a foundation of 528 creosoted Douglas fir piles first driven for the Perisphere of the 1939 World\'s Fair. About 600 more piles were added.', clue: 'Look at the three legged base under the globe.', source: W }, { r: 2.4 });
    k.egg(v(C.x, 5.0, C.z - 4.4), { id: 'unisphere-antarctica-grass', title: 'Grass in Antarctica', year: '2009', text: 'Local papers reported in 2009 that grass had started growing inside the steel landmass for Antarctica. Around the pool, 48 pairs of fountainheads were brought back in a $2 million restoration in 2010.', clue: 'Look under the globe, at the very bottom of the world.', source: W }, { r: 2.0 });
    return { mounts, spawn: path[0].clone(), look: v(path[40].x * 0.6 + C.x * 0.4, 7, path[40].z * 0.6 + C.z * 0.4), eye: 3, bounds: [-40, 40, -70, 14], path, style: 'steel' };
  },
};

/* ---------------- 18 ROOSEVELT ISLAND TRAM ---------------- */
export const tram: RoomDef = {
  id: 'tram',
  name: 'Suspended New York',
  area: 'ROOSEVELT ISLAND TRAM',
  mood: 'Above the East River',
  color: '#eaa58a',
  description: 'The Manhattan tram station high over Second Avenue, a red cabin docked and open, the bridge and river below.',
  signatures: 'The red glazed cabin under its hanger arm, the cable wheel machinery, the Queensboro Bridge cantilever alongside, the river far below.',
  build(k, ctx) {
    k.sky({ top: 0x6b7fb5, horizon: 0xf2b997, ground: 0x2a2e3a, fog: 0.0018, sun: { az: 4.6, el: 0.1, color: 0xffb37a, size: 24 }, haze: 0.35, env: 0.9 });
    k.hemi(0xffd8c4, 0x2a3040, 0.7);
    k.sun(0xffb98a, 2.0, -70, 20, -40, true, 70);
    /* 2026-11-23: scanned CC0 surfaces at real size (worn platform concrete, red brick, painted and rusted
       steel, the ribbed canopy deck, a tactile warning strip), a built ceiling of purlins, cable trays and
       hung signs, real fixtures, and the King Kong ghost in the cabin glass. */
    const red = scan(k, 'tram', 'paint', 2.0, { color: 0xd23a30, metalness: 0.35, roughness: 0.5, normal: 0.35 }),
      steel = scan(k, 'tram', 'towersteel', 2.2, { color: 0x77828c, metalness: 0.55, roughness: 0.7 }),
      concrete = scan(k, 'tram', 'platform', 3.0, { color: 0xd6d2ca }),
      glass = k.glass(0xbfdbe6, 0.16, 0.05),
      dark = k.flat(0x1a1d22, 0.6, 0.5),
      street = k.pbr('streetT', X.asphalt(0x22262b), 0.11),
      brick = scan(k, 'tram', 'brick', 1.4, { color: 0xe0d2c8 }),
      deck = scan(k, 'tram', 'paint', 1.0, { color: 0x9aa3aa, metalness: 0.5, roughness: 0.55 }),
      tactile = scan(k, 'tram', 'tactile', 0.6, { color: 0xffd23a, roughness: 0.6 }),
      grate = scan(k, 'tram', 'grate', 0.5, { color: 0x8a8f94, metalness: 0.6, roughness: 0.6 });
    const H = 0; // platform level; the street is thirty below
    // the station: platform, canopy, back wall of works, machinery house
    k.box(10, 0.6, 46, 0, H - 0.3, -12, concrete);
    k.box(1.0, 9, 46, 5.0, H + 4.5, -12, brick);
    k.box(14, 0.5, 48, -1, H + 9, -12, deck);
    for (let z = 8; z > -34; z -= 6) { k.box(0.4, 9, 0.4, 4.2, H + 4.5, z, steel); k.box(0.4, 9, 0.4, -7.6, H + 4.5, z, steel); k.box(13, 0.4, 0.4, -1.7, H + 8.8, z, steel); k.box(3, 0.1, 0.4, 0, H + 8.4, z, k.glow(0xfff0dc)); k.point(0, H + 8, z, 0xfff0dc, 20, 14);
      for (const x of [4.2, -7.6]) { k.box(0.8, 0.06, 0.8, x, H + 0.03, z, steel); k.box(0.6, 0.5, 0.6, x, H + 8.45, z, steel); } }
    /* the ceiling: I beam purlins every metre and a half, two cable trays with conduit, the lamp housings */
    for (let z = 9.5; z > -34.5; z -= 1.5) { k.box(13.2, 0.26, 0.1, -1.7, H + 8.62, z, steel); k.box(13.2, 0.03, 0.22, -1.7, H + 8.5, z, steel); }
    for (const x of [-5.6, 2.6]) { k.box(0.5, 0.12, 46, x, H + 8.2, -12, grate); for (const dx of [-0.12, 0.08]) k.cyl(0.035, 46, x + dx, H + 8.3, -12, dark, 0.035, 6).rotation.x = PI / 2; for (let z = 8; z > -34; z -= 3) k.box(0.04, 0.4, 0.04, x, H + 8.4, z, dark); }
    for (let z = 8; z > -34; z -= 6) k.box(3.2, 0.18, 0.55, 0, H + 8.52, z, steel);
    k.box(0.06, 1.1, 46, -3.8, H + 0.55, -12, k.flat(0xf1c531, 0, 0.5));
    k.box(0.9, 0.02, 46, -3.3, H + 0.01, -12, tactile);
    /* the brick wall gets a steel base and a cap */
    k.box(0.12, 0.4, 46, 4.44, H + 0.2, -12, steel);
    k.box(0.4, 0.3, 46, 4.5, H + 7.85, -12, steel);
    k.box(9, 12, 10, -1, H + 6, -42, steel);
    for (const x of [-4, 2]) { k.torus(3, 0.3, x, H + 10, -36.9, dark, 32); k.torus(2.4, 0.12, x, H + 10, -36.9, k.flat(0x8a8f96, 0.8, 0.3), 32); for (let j = 0; j < 8; j++) { const a = (j * PI) / 4; k.beam(v(x, H + 10, -36.8), v(x + Math.cos(a) * 2.9, H + 10 + Math.sin(a) * 2.9, -36.8), 0.08, dark, 5); } }
    k.sign('ROOSEVELT ISLAND TRAMWAY  ·  MANHATTAN STATION', 8, 0.7, -1, H + 7.6, -36.9, '#8e3d3c', '#ffffff', 70, 0, { border: true });
    k.box(10, 4, 1, 0, H + 2, 12, brick);
    k.censusWall({ x: 0, y: H + 5.4, z: -36.95, rotY: 0, cols: 12, rows: 3, tile: 0.6, gap: 0.05, start: ctx.wallStart(3600, 36), pieces: ctx.all, backing: dark });
    // the docked cabin: red frame, glass, open doors onto the platform
    const cx = -8.2;
    k.box(5, 0.3, 14, cx, H + 0.0, -10, steel);
    k.box(5.2, 0.28, 14.2, cx, H + 3.55, -10, red);
    k.rounded(5.4, 0.3, 14.4, cx, H + 3.85, -10, red, 0.2);
    for (const s of [-1, 1]) {
      k.box(0.12, 1.0, 14, cx + s * 2.5, H + 0.65, -10, red);
      k.box(0.05, 2.3, 14, cx + s * 2.5, H + 2.3, -10, glass);
      for (let z = -3.2; z > -17; z -= 2.3) k.box(0.1, 3.4, 0.12, cx + s * 2.5, H + 1.85, z, red);
    }
    for (const z of [-3, -17]) { k.box(5, 1.0, 0.12, cx, H + 0.65, z, red); k.box(5, 2.3, 0.05, cx, H + 2.3, z, glass); for (let x = -2; x <= 2; x += 1) k.box(0.12, 3.4, 0.1, cx + x, H + 1.85, z, red); }
    k.block(cx - 2.8, cx - 2.3, -17.2, -2.8);
    k.block(cx - 2.8, cx + 2.8, -17.4, -16.8);
    k.block(cx - 2.8, cx + 2.8, -3.2, -2.6);
    k.block(cx + 2.3, cx + 2.8, -17.2, -12.6);
    k.block(cx + 2.3, cx + 2.8, -7.4, -2.8);
    k.beam(v(cx, H + 3.9, -10), v(cx, H + 8.6, -10), 0.22, red, 8);
    k.box(0.5, 0.5, 6, cx, H + 8.8, -10, dark);
    for (const dz of [-2.4, 2.4]) k.torus(0.5, 0.12, cx, H + 9.5, -10 + dz, dark, 20);
    for (const x of [cx - 0.35, cx + 0.35]) k.beam(v(x, H + 9.5, 40), v(x, H + 9.5, -260), 0.05, dark, 5);
    k.sign('ROOSEVELT ISLAND', 3, 0.4, cx, H + 3.3, -2.9, '#8e3d3c', '#ffffff', 90, 0);
    /* the Manhattan towers on the line: one between First and Second Avenues, the tallest at York Avenue.
       Tapered steel legs either side of the cables, a cross head carrying the sheaves */
    const towers: T.Object3D[] = [];
    for (const [tz, top] of [[-62, H + 11], [-108, H + 11]] as const) {
      for (const s of [-1, 1]) towers.push(k.beam(v(cx + s * 7, H - 30, tz), v(cx + s * 4.2, top, tz), 0.55, steel, 8));
      k.beam(v(cx - 7, H - 30, tz), v(cx + 4.2, top - 14, tz), 0.18, steel, 6); k.beam(v(cx + 7, H - 30, tz), v(cx - 4.2, top - 14, tz), 0.18, steel, 6);
      k.box(10, 1.0, 1.6, cx, top + 0.5, tz, steel);
      for (const dx of [-0.35, 0.35]) k.torus(0.45, 0.1, cx + dx, H + 9.5 + 0.45, tz, dark, 16).rotation.y = PI / 2;
    }
    // a second cabin riding the cable out over the river
    const far = new T.Group();
    const fb = new T.Mesh(new T.BoxGeometry(5, 3.6, 14), red);
    far.add(fb);
    const fg = new T.Mesh(new T.BoxGeometry(5.05, 2.2, 14.05), glass);
    fg.position.y = 0.4;
    far.add(fg);
    const arm = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 5, 8), red);
    arm.position.y = 4.3;
    far.add(arm);
    far.position.set(cx, H + 3.4, -80);
    k.add(far);
    if (!ctx.reduced) k.ticks.push((t) => { far.position.z = -60 - ((Math.sin(t * 0.05) + 1) / 2) * 160; });
    // the river, the bridge alongside, the streets below, the island and the far city
    k.box(200, 0.3, 200, -20, H - 30, -20, street);
    k.water({ y: H - 31, color: 0x2d4a5c, w: 500, d: 500, x: -60, z: -220, amp: 1.2 });
    k.box(80, 2, 160, -60, H - 30, -200, k.pbr('quayT', X.pavers(0x6f716c, 10), 0.2));
    for (let i = 0; i < 12; i++) k.box(6, 10 + (i % 3) * 5, 8, -75 + (i % 4) * 8, H - 24 + (i % 3) * 2.5, -140 - i * 12, brick);
    for (const s of [-1, 1]) for (let b = 0; b < 6; b++) { const z = 30 - b * 16, h = 20 + (b % 3) * 12; k.box(12, h, 12, 22 + s * 0, H - 30 + h / 2, z, brick); }
    // Queensboro: two cantilever towers and truss webs along the cable line
    for (const z of [-40, -130]) { for (const x of [-26, -14]) k.box(1.2, 44, 1.6, x, H - 30 + 22, z, steel); k.box(13, 1.2, 1.6, -20, H + 14, z, steel); k.box(13, 1.2, 1.6, -20, H - 2, z, steel); }
    for (let z = 30; z > -200; z -= 4) { for (const x of [-26, -14]) { k.beam(v(x, H - 2, z), v(x, H + 2 + Math.abs(Math.sin(z * 0.03)) * 8, z), 0.12, steel, 5); } k.beam(v(-26, H + 2 + Math.abs(Math.sin(z * 0.03)) * 8, z), v(-14, H + 2 + Math.abs(Math.sin((z - 4) * 0.03)) * 8, z - 4), 0.09, steel, 5); k.box(14, 0.5, 4, -20, H - 2.5, z, steel); }
    for (let z = 30; z > -200; z -= 4) k.beam(v(-26, H - 2, z), v(-14, H - 2, z - 4), 0.07, steel, 4);
    k.skyline({ z: -260, count: 30, spacing: 8, scale: 2.4, base: H - 30, seed: 33, lit: 0.35, glow: 0.9, tint: 0x3a4250, x: -60 });
    k.skyline({ z: 60, count: 24, spacing: 8, scale: 2.8, base: H - 30, seed: 34, lit: 0.4, glow: 1.0, tint: 0x2f3744, x: 60, rows: 1 });
    k.prop('lantern', 3.6, H, -20, { height: 1.0 });
    k.prop('mailbox', 3.6, H, 2, { height: 1.5, rotY: -PI / 2, keepOut: 0.6 });
    /* real fixtures (Poly Haven CC0): slatted seating, cameras on the columns, the extinguisher and the
       power boxes on the brick, condensers on the machinery house roof, the fare turnstiles at the back */
    for (const z of [-8, -26]) k.prop('tram/modular_street_seating', 3.55, H, z, { scale: 0.66, rotY: -PI / 2, keepOut: 1.3 });
    for (const z of [2, -16, -28]) k.prop('tram/security_camera_01', 3.95, H + 7.2, z, { scale: 1.4, rotY: PI });
    k.prop('tram/korean_fire_extinguisher_01', 4.3, H, -14.2, { scale: 1.3, rotY: -PI / 2 });
    for (const z of [-3.2, -21.8]) k.prop('tram/power_box_01', 4.28, H + 1.2, z, { scale: 1.6, rotY: -PI / 2 });
    for (const x of [-4, 1.5]) k.prop('tram/exterior_aircon_unit', x, H + 12, -40, { scale: 1.3 });
    for (let i = 0; i < 4; i++) k.prop('penn_turnstile', -2.4 + i * 1.3, H, 10.95, { height: 1.05, rotY: PI });
    /* the signs a rider reads: board here, the fare, the yellow line, the next cabins */
    k.sign('TRAM TO ROOSEVELT ISLAND  ·  BOARD HERE', 6, 0.5, -1.2, H + 7.25, -1, '#1f2329', '#ffffff', 44, 0, { double: true });
    k.box(0.04, 0.9, 0.04, -3.6, H + 7.9, -1, dark); k.box(0.04, 0.9, 0.04, 1.2, H + 7.9, -1, dark);
    k.sign('PLEASE WAIT BEHIND THE YELLOW LINE', 3.2, 0.32, 4.44, H + 1.0, -11, '#f1c531', '#1a1a1a', 48, -PI / 2);
    k.sign('ONE SUBWAY FARE  ·  EVERY 7 TO 15 MINUTES  ·  ABOUT FOUR MINUTES ACROSS', 7.6, 0.34, 4.44, H + 6.6, -11, '#1f2329', '#e8e4da', 24, -PI / 2);
    { const board = canvasTex(1024, 384, (g) => { g.fillStyle = '#0b0d10'; g.fillRect(0, 0, 1024, 384); g.font = '700 54px "JetBrains Mono", monospace'; g.fillStyle = '#ffb020'; g.fillText('NEXT CABIN   ROOSEVELT IS', 40, 96); g.fillText('BOARDING     NOW', 40, 190); g.fillStyle = '#ffd37a'; g.fillText('FOLLOWING    7 MIN', 40, 284); g.fillStyle = '#3a3f46'; g.fillRect(0, 330, 1024, 4); });
      k.box(3.4, 1.35, 0.25, -1.2, H + 6.2, -24, dark);
      for (const f of [1, -1]) { const b = k.mesh(new T.PlaneGeometry(3.2, 1.2), new T.MeshBasicMaterial({ ...(board ? { map: board } : {}), color: board ? 0xffffff : 0x2a2418 }), -1.2, H + 6.2, -24 + f * 0.13, true); b.rotation.y = f > 0 ? 0 : PI; }
      k.box(0.05, 2.2, 0.05, -2.5, H + 7.9, -24, dark); k.box(0.05, 2.2, 0.05, 0.1, H + 7.9, -24, dark); }
    /* THE TRICK, a Pepper's ghost: King Kong in the cabin glass. Like a reflection it only shows at a
       glancing angle: look down the platform at the cabin and he is there, walk up to the door and he goes. */
    { const kong = canvasTex(512, 512, (g) => {
        g.clearRect(0, 0, 512, 512); g.fillStyle = 'rgba(220,235,255,0.95)';
        const e = (x: number, y: number, rx: number, ry: number, r = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, r, 0, PI * 2); g.fill(); };
        e(256, 360, 150, 150); e(256, 205, 70, 66); e(256, 238, 46, 30); e(170, 300, 90, 70, -0.5); e(342, 300, 90, 70, 0.5);
        g.beginPath(); g.moveTo(330, 280); g.lineTo(430, 120); g.lineTo(470, 140); g.lineTo(390, 320); g.closePath(); g.fill();
        g.beginPath(); g.moveTo(182, 290); g.lineTo(110, 470); g.lineTo(60, 470); g.lineTo(130, 280); g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,90,70,0.95)'; g.fillRect(405, 64, 92, 56); g.fillStyle = 'rgba(220,235,255,0.95)'; g.fillRect(447, 30, 6, 36);
        g.fillStyle = 'rgba(0,0,0,1)'; g.globalCompositeOperation = 'destination-out'; e(232, 196, 10, 7); e(280, 196, 10, 7); g.globalCompositeOperation = 'source-over';
        const fade = g.createLinearGradient(0, 380, 0, 512); fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = fade; g.fillRect(0, 380, 512, 132); g.globalCompositeOperation = 'source-over'; });
      const gm = new T.MeshBasicMaterial({ ...(kong ? { map: kong } : {}), transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, color: 0x9fb4c8 });
      const ghost = noPost(k.mesh(new T.PlaneGeometry(4.6, 4.6), gm, -6.9, H + 2.0, -10.5, true));
      swapIn(TX + 'tram/kong_ghost.webp', (t) => { gm.map = t; gm.needsUpdate = true; });
      ghost.rotation.y = PI / 2;
      const to = new T.Vector3();
      const np = ghost.onBeforeRender;
      ghost.onBeforeRender = (r, sc, cam, g, m, gr) => { np.call(ghost, r, sc, cam, g, m, gr); to.subVectors(ghost.position, cam.position).normalize(); const c = Math.abs(to.x); gm.opacity = kong ? 0.85 * Math.max(0, Math.min(1, (0.75 - c) / 0.35)) : 0; };
      k.egg(v(-5.6, H + 2.2, -10.5), { id: 'tram-ghost-kong', title: 'A ghost in the glass', year: '1862', text: 'The Kong in the cabin window is a Pepper\'s ghost, the stage trick of a figure reflected in a sheet of glass at an angle, named for John Henry Pepper, who made it famous in London in 1862. Like any reflection he only shows at a glancing angle: from down the platform he is there, at the cabin door he is gone.', clue: 'Stand back down the platform and look at the cabin windows at an angle.', source: { name: 'Pepper\'s ghost, Wikipedia', url: 'https://en.wikipedia.org/wiki/Pepper%27s_ghost' } }, { r: 1.6 }); }
    // the works: the station's back wall, the cabin's end walls, the machinery house
    const mounts: Mount[] = [];
    for (let i = 0; i < 10; i++) { const z = 6 - i * 4.2; mounts.push({ position: v(4.45, H + 3.4, z), rotation: -PI / 2, target: v(0.4, 3, z), width: 3.8, height: 2.2, style: 'steel' }); }
    for (const [z, rot, tz] of [[-3.06, PI, -6.5], [-16.94, 0, -13.5]] as const) mounts.push({ position: v(cx, H + 2.1, z), rotation: rot, target: v(cx, 3, tz), width: 3.6, height: 2.0, style: 'steel', wash: false });
    for (const x of [-3.6, 1.6]) mounts.push({ position: v(x, H + 3.2, -36.95), rotation: 0, target: v(x, 3, -31), width: 4.4, height: 2.5, style: 'steel' });
    mounts.push({ position: v(-1, H + 6.2, -36.95), rotation: 0, target: v(-1, 3, -30), width: 4.4, height: 2.5, style: 'steel' });
    for (const [z0, z1] of [[9.5, -1.5], [-18.5, -30.5]]) {
      const zc = (z0 + z1) / 2, len = z0 - z1;
      k.box(0.3, 4.6, len, -5.2, 2.3, zc, steel);
      k.box(0.34, 0.2, len + 0.2, -5.2, 4.7, zc, red);
      for (const z of [zc + len / 4, zc - len / 4]) mounts.push({ position: v(-5.02, 2.9, z), rotation: PI / 2, target: v(-1.2, 3, z), width: 4.2, height: 2.4, style: 'steel' });
    }
    // easter eggs: the temporary tram, the bridge, the tall tower, the long wait, the building that never came, King Kong
    const W = { name: 'Roosevelt Island Tramway, Wikipedia', url: 'https://en.wikipedia.org/wiki/Roosevelt_Island_Tramway' };
    k.egg(v(cx, H + 3.3, -2.6), { id: 'tram-temporary', title: 'Only until the subway came', year: '1976', text: 'The tram opened on May 17, 1976, meant as a temporary way across until the subway reached Roosevelt Island. The subway came, and the tram stayed. It carried 1.25 million riders in its first year.', clue: 'Look at the sign on the end of the docked cabin.', source: W }, { r: 1.4 });
    k.egg(v(-20, H + 4, -40), { id: 'tram-beside-the-bridge', title: 'Hiding beside the bridge', text: 'The tram runs right alongside the Queensboro Bridge, on purpose: keeping the cables next to the bridge was meant partly to stop planes at low altitude from flying into them.', clue: 'Look across at the steel trusses of the bridge running beside the cables.', source: W }, { r: 3.0 });
    k.egg(towers[3], { id: 'tram-york-tower', title: '250 feet at York Avenue', text: 'The tallest of the line\'s three towers stands at York Avenue, 250 feet above the ground. Even at the lowest point of the ride the cabin floors are 135 feet above the East River, and the whole crossing takes three to four minutes at up to 17 miles an hour.', clue: 'Find the second steel tower out along the cables, at the river\'s edge.', source: W }, { r: 3.0 });
    k.egg(v(cx, H + 9.5, -40), { id: 'tram-stranded', title: 'Eleven hours over the river', year: '2006', text: 'On April 18, 2006, the tram broke down over the East River, trapping 69 people for up to eleven hours. Rescuers brought them down in cages that hold fourteen passengers each. The 2010 rebuild gave each cabin its own haul cable, so the two now run independently.', clue: 'Follow the cables out past the end of the platform.', source: W }, { r: 2.0 });
    k.egg(v(0, H + 0.2, -20), { id: 'tram-deck-for-a-tower', title: 'Built to carry a skyscraper', text: 'The concrete deck of the Manhattan terminal was engineered to hold a 32 or 35 story building on top. The building was never put up.', clue: 'Look at the concrete platform under your feet.', source: W }, { r: 1.8 });
    k.egg(v(cx, H + 8.6, -10), { id: 'tram-kong', title: 'King Kong\'s favourite ride', text: 'The tram has played itself in Nighthawks, Léon: The Professional, Spider-Man and Dark Water. At Universal Studios Florida, the Kongfrontation ride (1990 to 2002) had a model King Kong attacking a model of the Roosevelt Island tram.', clue: 'Look up at the hanger arm above the docked cabin.', source: W }, { r: 1.4 });
    return { mounts, spawn: v(1.2, 3, 9), look: v(-4, 3, -20), eye: 3, bounds: [-10.9, 3.6, -33, 10.5], style: 'steel' };
  },
};

/* ---------------- 19 THE CLOISTERS ---------------- */
export const cloisters: RoomDef = {
  id: 'cloisters',
  name: 'The quiet city',
  area: 'THE CLOISTERS',
  mood: 'Garden light',
  color: '#c5b991',
  description: 'Paired stone columns around a planted garth, terracotta roofs, the works hung in the shade of the covered walks.',
  signatures: 'Arcades of paired columns with carved capitals, a quartered herb garden with a central fountain, terracotta tiled lean to roofs.',
  build(k, ctx) {
    k.sky({ top: 0x7ea7d3, horizon: 0xe9e6dc, ground: 0x59614a, fog: 0.003, sun: { az: 2.0, el: 0.6, color: 0xfff1d6, size: 14 }, env: 0.85 });
    k.hemi(0xf4f2e8, 0x4a4a38, 0.85);
    k.sun(0xfff0d4, 2.2, 20, 40, 20, true, 50);
    /* 2026-11-23: scanned CC0 surfaces at real size: coursed medieval limestone, the worn monastery floor,
       clay roof tiles, pink veined marble for the Cuxa columns and fountain, a stone garden path, forest
       soil in the beds; exposed rafters and wall plates under every roof; real herbs, pots, lanterns and an
       oak door; and a trompe l'oeil chapel painted in the north arch. */
    const stone = scan(k, 'cloisters', 'wall', 2.0, { color: 0xf4eee2 }),
      pink = scan(k, 'cloisters', 'marble', 1.2, { color: 0xf6dcd2, roughness: 0.55 }),
      walk = scan(k, 'cloisters', 'floor', 1.8, { color: 0xe4dccc }),
      terracotta = scan(k, 'cloisters', 'roof', 2.0, { color: 0xf0d2c0 }),
      soil = scan(k, 'cloisters', 'soil', 3.0, { color: 0xb8a890 }),
      path = scan(k, 'cloisters', 'path', 1.8, { color: 0xe8e0d0 }),
      beam = scan(k, 'cloisters', 'beam', 2.0, { color: 0x9a8270 }),
      dark = k.flat(0x2b2620, 0.3, 0.7),
      water = k.flat(0x37646a, 0.5, 0.2, { transparent: true, opacity: 0.9 }),
      lawn = scan(k, 'cloisters', 'grass', 2.0, { color: 0xc0d8a8 });
    const Cz = -22, S = 15;
    k.box(64, 0.4, 64, 0, -0.2, Cz, walk);
    k.box(2 * S - 6, 0.3, 2 * S - 6, 0, 0.02, Cz, soil);
    // four arcaded walks with paired columns, lean to roofs and a solid outer wall
    for (const side of [0, 1, 2, 3]) {
      const a = (side * PI) / 2;
      const rot = new T.Matrix4().makeRotationY(a);
      const place = (x: number, z: number) => v(x, 0, z).applyMatrix4(rot).add(v(0, 0, Cz));
      for (let i = 0; i < 6; i++) {
        const t = -S + 2.5 + i * 5;
        for (const d of [-0.42, 0.42]) { const p = place(t, S + d); k.column(p.x, 0, p.z, 4.6, 0.22, pink, false, stone); }
      }
      const wall = place(0, S);
      const arcade = k.arcade(2 * S + 2, 6.6, 0.9, 6, 3.6, 5.2, wall.x, 0, wall.z, stone, a, false);
      void arcade;
      const back = place(0, S + 6);
      const bw = k.box(2 * S + 12, 8, 1.0, back.x, 4, back.z, stone);
      bw.rotation.y = a;
      const roof = place(0, S + 3);
      const rf = k.box(2 * S + 12, 0.3, 7.2, roof.x, 7.6, roof.z, terracotta);
      rf.rotation.set(0, a, 0);
      rf.rotateX(-0.28);
      for (let j = -S - 5; j <= S + 5; j += 1.1) { const p = place(j, S + 3); const tile = k.box(0.5, 0.25, 7.2, p.x, 7.75, p.z, terracotta); tile.rotation.set(0, a, 0); tile.rotateX(-0.28); }
      const fl = place(0, S + 3);
      const floor = k.box(2 * S + 12, 0.3, 6.4, fl.x, 0.05, fl.z, walk);
      floor.rotation.y = a;
      for (let j = 0; j < 3; j++) { const p = place(-S + 5 + j * 10, S + 5.5); k.point(p.x, 4.6, p.z, 0xfff0d6, 12, 12); }
      /* the open timber roof: a rafter every 1.1 m under the tiles, wall plates on both sides, corbels */
      for (let j = -S - 5; j <= S + 5; j += 1.1) { const p = place(j, S + 3); const r = k.box(0.2, 0.26, 7.0, p.x, 7.3, p.z, beam); r.rotation.set(0, a, 0); r.rotateX(-0.28); }
      for (const [d, y] of [[S + 5.3, 8.2], [S + 0.4, 6.5]] as const) { const p = place(0, d); const wp = k.box(2 * S + 11, 0.36, 0.4, p.x, y, p.z, beam); wp.rotation.y = a; }
      for (let j = -S - 3; j <= S + 3; j += 2.2) { const p = place(j, S + 5.3); const c = k.box(0.3, 0.4, 0.5, p.x, 7.8, p.z, stone); c.rotation.y = a; }
      /* a lantern hung on a chain in every bay of the walk */
      for (let j = 0; j < 3; j++) { const p = place(-S + 5 + j * 10, S + 3); k.prop('cloisters/lantern_chandelier_01', p.x, 4.55, p.z, { scale: 1.25 }); k.box(0.03, 1.5, 0.03, p.x, 6.4, p.z, dark); }
    }
    const herbs: Place[][] = [[], [], [], [], []];
    // the garth: crossed paths make four quadrants, each a grass plot with a pruned fruit tree, flowers and herbs at the edges
    for (const s of [-1, 1]) { k.box(2 * S - 6, 0.12, 1.6, 0, 0.1, Cz + s * 0, path); k.box(1.6, 0.12, 2 * S - 6, s * 0, 0.1, Cz, path); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const bx = sx * 6.6, bz = Cz + sz * 6.6;
      k.box(10, 0.4, 10, bx, 0.2, bz, lawn);
      k.box(10.4, 0.5, 0.3, bx, 0.25, bz - 5.1, stone);
      k.box(10.4, 0.5, 0.3, bx, 0.25, bz + 5.1, stone);
      k.box(0.3, 0.5, 10.4, bx - 5.1, 0.25, bz, stone);
      k.box(0.3, 0.5, 10.4, bx + 5.1, 0.25, bz, stone);
      /* the herb borders: real plants (Poly Haven scans) in a band of soil round each plot */
      for (const [w, d] of [[10, 0.9], [0.9, 10]] as const) for (const o of [-4.55, 4.55]) k.box(w, 0.06, d, bx + (w < 1 ? o : 0), 0.41, bz + (w < 1 ? 0 : o), soil);
      const rnd = X.mulberry(sx * 3 + sz * 7 + 40);
      for (let i = 0; i < 16; i++) { const e = i % 4, u = -3.6 + ((i >> 2) + rnd() * 0.4) * 2.3, w = (e === 0 ? -1 : e === 1 ? 1 : 0) * 4.55, q = (e === 2 ? -1 : e === 3 ? 1 : 0) * 4.55;
        herbs[i % 5].push({ x: bx + (w || u), y: 0.42, z: bz + (q || u), ry: (e < 2 ? PI / 2 : 0) + (rnd() - 0.5) * 0.3, s: 1.5 + rnd() * 0.5 }); }
      /* the Met keeps a pollarded crabapple in each plot; the kit has no apple, pear is the nearest rosaceous form */
      k.tree(bx, 0.3, bz, { kind: 'round', h: 3.4, r: 1.7, leaf: 0x4f7a3c, seed: sx + sz * 2, species: 'pear' });
      k.keepOut.push({ x: bx, z: bz, r: 5.6 });
    }
    ['cloisters/shrub_03', 'cloisters/nettle_plant', 'cloisters/periwinkle_plant', 'cloisters/celandine_01', 'cloisters/fern_02'].forEach((n, i) => propMany(k, n, herbs[i], false));
    /* clay pots and a jar at the corners of the walks, a well bucket by the fountain, the oak door at the way in */
    propMany(k, 'cloisters/planter_pot_clay', [[-S - 2.6, Cz - S - 2.6], [S + 2.6, Cz - S - 2.6], [-S - 2.6, Cz + S + 2.6], [S + 2.6, Cz + S + 2.6], [-S - 4.6, Cz - S - 2.6], [S + 4.6, Cz + S + 2.6]].map(([x, z], i) => ({ x, y: 0.2, z, ry: i, s: 3.6 })));
    propMany(k, 'cloisters/antique_ceramic_vase_01', [[-S - 4.6, Cz + S + 4.6], [S + 4.6, Cz - S - 4.6]].map(([x, z]) => ({ x, y: 0.2, z, s: 3.2 })));
    k.prop('cloisters/wooden_bucket_01', 2.6, 0.15, Cz + 1.4, { scale: 1.6, rotY: 0.4 });
    k.prop('cloisters/large_castle_door', 0, 0.2, Cz + S + 5.25, { scale: 1.42, rotY: PI });
    k.prop('cloisters/gothic_statue', -13, 0.2, Cz + 13, { scale: 1.3, rotY: PI * 0.75 });
    /* the eight sided fountain at the crossing, in the same pink marble as the columns */
    const fountain = k.lathe([[2.0, 0], [2.0, 0.3], [0.5, 0.5], [0.3, 1.4], [1.2, 1.6], [1.2, 1.9], [0.25, 2.0], [0.2, 2.6], [0.5, 2.8]], 0, 0, Cz, pink, 8);
    fountain.rotation.y = PI / 8;
    k.cyl(1.15, 0.05, 0, 1.7, Cz, water, 1.15, 8);
    k.keepOut.push({ x: 0, z: Cz, r: 2.3 });
    for (const [x, z] of [[-13, Cz - 13], [13, Cz + 13]]) k.prop('lantern', x, 0, z, { height: 1.0 });
    k.prop('tree', 13, 0, Cz - 13, { height: 4.2 });
    for (const x of [-9, 9]) k.prop('quiet_bench', x, 0.2, Cz + S + 3, { height: 0.65, keepOut: 1.7 });
    // the chapel wall with the census, the entrance passage
    k.box(2 * S + 12, 12, 1.0, 0, 6, Cz - S - 6.4, stone);
    k.arch(4, 8, 1.2, 0, 0, Cz - S - 6.4, stone, true, 0.7);
    k.censusWall({ x: 0, y: 9.4, z: Cz - S - 5.85, rotY: 0, cols: 26, rows: 3, tile: 0.55, gap: 0.05, start: ctx.wallStart(2900, 78), pieces: ctx.all, backing: dark });
    k.sign('FORT TRYON  ·  THE CUXA CLOISTER', 7, 0.6, 0, 11.4, Cz - S - 5.85, '#6b5334', '#f4e6c8', 80, 0, { border: true });
    /* THE TRICK, trompe l'oeil: the north arch opens on the Fuentidueña chapel, a barrel vault running back
       to a lit apse. It is paint on the wall, drawn to one vanishing point at eye height, so from the garth
       it reads as a room and from the side it is flat. */
    { const PW = 1024, PH = 1440, vx = PW / 2, vy = PH * 0.462, ZT = Cz - S - 5.44;
      const tl = canvasTex(PW, PH, (g) => {
        const sky = g.createLinearGradient(0, 0, 0, PH); sky.addColorStop(0, '#3a2c22'); sky.addColorStop(0.62, '#7a6248'); sky.addColorStop(1, '#4a3a2c'); g.fillStyle = sky; g.fillRect(0, 0, PW, PH);
        const depth = (f: number) => ({ l: vx - (vx) * f, r: vx + (PW - vx) * f, t: vy - vy * f, b: vy + (PH - vy) * f });
        /* the floor and walls, coursed toward the vanishing point */
        g.strokeStyle = 'rgba(30,20,14,0.55)'; g.lineWidth = 3;
        for (let i = 0; i <= 14; i++) { const yy = PH - i * 40; g.beginPath(); g.moveTo(0, yy * 0 + PH - i * (PH - vy) / 14); g.lineTo(vx, vy); g.stroke(); void yy; }
        for (let i = 1; i <= 22; i++) { const f = Math.pow(0.86, i), d = depth(f); g.beginPath(); g.moveTo(d.l, d.b); g.lineTo(d.r, d.b); g.stroke(); g.beginPath(); g.moveTo(d.l, d.b); g.lineTo(d.l, d.t + (d.r - d.l) * 0.5); g.moveTo(d.r, d.b); g.lineTo(d.r, d.t + (d.r - d.l) * 0.5); g.stroke(); }
        /* the barrel vault: transverse arches, lighter as they recede into the light of the apse */
        for (let i = 0; i <= 9; i++) { const f = Math.pow(0.8, i), d = depth(f), w = (d.r - d.l) / 2, spring = d.t + w; g.lineWidth = Math.max(4, 46 * f); g.strokeStyle = `rgba(${150 + i * 9},${118 + i * 8},${86 + i * 7},1)`; g.beginPath(); g.arc(vx, spring, w, PI, 0); g.stroke(); g.beginPath(); g.moveTo(d.l, spring); g.lineTo(d.l, d.b); g.moveTo(d.r, spring); g.lineTo(d.r, d.b); g.stroke(); }
        /* the apse: a half dome, a lit window, the altar */
        const f = Math.pow(0.8, 10), d = depth(f), w = (d.r - d.l) / 2;
        const glow = g.createRadialGradient(vx, d.t + w * 0.9, 4, vx, d.t + w * 0.9, w * 2.2); glow.addColorStop(0, 'rgba(255,236,190,1)'); glow.addColorStop(0.5, 'rgba(220,170,110,0.85)'); glow.addColorStop(1, 'rgba(120,90,60,0)');
        g.fillStyle = glow; g.beginPath(); g.arc(vx, d.t + w, w, PI, 0); g.lineTo(d.r, d.b); g.lineTo(d.l, d.b); g.closePath(); g.fill();
        g.fillStyle = '#fff6dc'; g.beginPath(); g.arc(vx, d.t + w * 0.95, w * 0.14, PI, 0); g.lineTo(vx + w * 0.14, d.t + w * 1.5); g.lineTo(vx - w * 0.14, d.t + w * 1.5); g.closePath(); g.fill();
        g.fillStyle = '#5a4434'; g.fillRect(vx - w * 0.5, d.b - w * 0.42, w, w * 0.42);
        g.strokeStyle = '#c8a870'; g.lineWidth = 3; g.beginPath(); g.moveTo(vx, d.b - w * 0.42); g.lineTo(vx, d.b - w * 0.78); g.moveTo(vx - w * 0.12, d.b - w * 0.66); g.lineTo(vx + w * 0.12, d.b - w * 0.66); g.stroke();
        /* shade at the edges, so the painted walls meet the real arch in shadow */
        const side = g.createLinearGradient(0, 0, PW, 0); side.addColorStop(0, 'rgba(0,0,0,0.55)'); side.addColorStop(0.18, 'rgba(0,0,0,0)'); side.addColorStop(0.82, 'rgba(0,0,0,0)'); side.addColorStop(1, 'rgba(0,0,0,0.55)'); g.fillStyle = side; g.fillRect(0, 0, PW, PH);
      });
      const pm = new T.MeshStandardMaterial({ ...(tl ? { map: tl } : {}), color: tl ? 0xffffff : 0x6b5440, roughness: 0.9, emissive: 0xffffff, ...(tl ? { emissiveMap: tl } : {}), emissiveIntensity: tl ? 0.35 : 0 });
      const pt = k.mesh(new T.PlaneGeometry(3.7, 5.2), pm, 0, 2.8, ZT, true);
      k.arch(3.6, 4.9, 0.36, 0, 0.2, ZT + 0.2, stone, false, 0.7);
      swapIn(TX + 'cloisters/apse_trompe.webp', (t) => { pm.map = t; pm.emissiveMap = t; pm.emissiveIntensity = 0.35; pm.color.set(0xffffff); pm.needsUpdate = true; });
      void pt;
      k.sign('THE FUENTIDUEÑA APSE  ·  SEGOVIA, ABOUT 1175 TO 1200', 1.4, 0.2, 2.95, 1.7, ZT + 0.03, '#efe4cc', '#4a3a2a', 22, 0);
      k.sign('CUXA CLOISTER  ·  CAPITALS IN PINK LANGUEDOC MARBLE', 1.4, 0.2, -2.95, 1.7, ZT + 0.03, '#efe4cc', '#4a3a2a', 22, 0);
      k.egg(v(0, 3.0, ZT + 0.5), { id: 'cloisters-trompe', title: 'A chapel in paint', text: 'The chapel through this arch is a trompe l\'oeil, painting that fools the eye, drawn to a single vanishing point at the height of your eyes. The real Fuentidueña apse at the Cloisters was shipped from Spain in 839 crates; this one is three millimetres deep. Step to one side and it goes flat.', clue: 'Walk into the north walk and look at the arch in the chapel wall, then step sideways.', source: { name: 'Trompe-l\'œil, Wikipedia', url: 'https://en.wikipedia.org/wiki/Trompe-l%27%C5%93il' } }, { r: 1.8 });
    }
    for (const s of [-1, 1]) k.box(4, 6, 8, s * 3.5, 3, Cz + S + 8, stone);
    // the works in the shade of each walk, on the outer walls between the bays
    const mounts: Mount[] = [];
    for (const side of [0, 1, 2, 3]) {
      const a = (side * PI) / 2, rot = new T.Matrix4().makeRotationY(a);
      const place = (x: number, y: number, z: number) => v(x, y, z).applyMatrix4(rot).add(v(0, 0, Cz));
      for (let i = 0; i < 5; i++) {
        const t = -S + 3 + i * 6;
        if (side === 2 && i === 2) continue;
        if (side === 0 && i === 2) continue;
        const p = place(t, 2.9, S + 5.45), tgt = place(t, 3, S + 2.4);
        mounts.push({ position: p, rotation: PI + a, target: tgt, width: 4.4, height: 2.6, style: 'oak', wash: true });
      }
    }
    /* 2026-11-23: the two chapel wall mounts at x 6 and -6 stood behind the north walk's own back wall, in the
       same spots as two walk mounts, so their works were never seen; they are gone */
    // easter eggs: the marble, the price, the fountain, the chapel in crates, the cliffs across the river, the unicorn's tree
    const W = { name: 'The Cloisters, Wikipedia', url: 'https://en.wikipedia.org/wiki/The_Cloisters' };
    k.egg(v(-7.5, 2.6, Cz + S), { id: 'cloisters-cuxa-marble', title: 'Old stone, new walls', year: '878', text: 'The walls of the Cuxa Cloister are modern, but its capitals and columns are original, cut from pink Languedoc marble from the Pyrenees. They came from the monastery of Saint Michel de Cuxa, founded in 878, which was abandoned in 1791; its roof fell in 1835 and its bell tower in 1839.', clue: 'Look closely at the pink, mottled marble of the paired columns.', source: W }, { r: 1.4 });
    k.egg(v(0, 3.4, Cz + S + 5.3), { id: 'cloisters-barnard-price', title: 'Bought by the cloister', text: 'The sculptor and collector George Grey Barnard reportedly paid $100,000 for the Cuxa cloister, and $25,000 each for the Trie and Bonnefont buildings. John D. Rockefeller Jr. bought Barnard\'s whole collection for around $700,000 and kept him on as an advisor.', clue: 'Find the old oak door in the middle of the south walk.', source: W }, { r: 1.6 });
    k.egg(v(0, 2.6, Cz), { id: 'cloisters-lilies-and-roses', title: 'Eight sides, guessed plants', text: 'An eight sided fountain stands where the two garden walks cross. Nobody can know exactly what grew here in the Middle Ages: the oldest plan of the original monastery describes lilies and roses, and today\'s planting is a best approximation by botanists of the medieval garden.', clue: 'Walk to the fountain at the crossing of the paths and count its sides.', source: W }, { r: 1.8 });
    k.egg(v(0, 5.6, Cz - S - 5.2), { id: 'cloisters-839-crates', title: 'A chapel in 839 crates', year: '1961', text: 'The museum\'s largest room holds a Romanesque apse from a church at Fuentidueña, near Segovia in Spain, built about 1175 to 1200. Rockefeller acquired it in 1931; it was taken apart into almost 3,300 blocks, shipped to New York in 839 crates, rebuilt in the late 1940s and opened in 1961.', clue: 'Find the painted arch in the middle of the north walk.', source: W }, { r: 1.8 });
    k.egg(v(-S - 5.3, 6.2, Cz), { id: 'cloisters-palisades', title: 'He bought the view', year: '1933', text: 'Rockefeller bought the clifftops of the New Jersey Palisades across the Hudson over several years, and in 1933 gave several hundred acres of them to the Palisades Interstate Park Commission so they would stay free of development.', clue: 'On the west walk, look up at the wall that faces the river.', source: W }, { r: 1.8 });
    k.egg(v(13, 2.2, Cz - 13), { id: 'cloisters-unicorn-medlar', title: 'The unicorn\'s tree', text: 'The Unicorn Tapestries, woven around 1495 to 1505, were bought by Rockefeller in 1922 for about a million dollars and given to the museum. In the Bonnefont Cloister garden grows a medlar tree of the kind woven into the tapestries.', clue: 'Find the small tree in the corner of the garth.', source: W }, { r: 1.6 });
    return { mounts, spawn: v(0, 3, Cz + S - 2.5), look: v(0, 2.6, Cz), eye: 3, bounds: [-S - 5, S + 5, Cz - S - 5, Cz + S + 6], style: 'oak' };
  },
};

/* ---------------- 20 BROOKLYN NAVY YARD ---------------- */
export const navyyard: RoomDef = {
  id: 'navyyard',
  name: 'The dry dock cathedral',
  area: 'BROOKLYN NAVY YARD',
  mood: 'Industrial dusk',
  color: '#d4ae78',
  description: 'A stepped granite dry dock, a rusted hull on the blocks, monumental works hung from the gantry over the void.',
  signatures: 'Stepped granite altar walls of the dock, keel blocks and rails on the floor, lattice gantry cranes, the caisson gate to the river.',
  build(k, ctx) {
    k.sky({ top: 0x3a4658, horizon: 0xd9905e, ground: 0x2a2a2c, fog: 0.0025, sun: { az: 4.3, el: 0.08, color: 0xff9a55, size: 22 }, haze: 0.35, env: 0.7 });
    k.hemi(0xe6c8b0, 0x2a2c30, 0.6);
    k.sun(0xffb070, 1.8, -60, 18, -20, true, 80);
    /* 2026-11-23: the dock was under the floor. A quay slab covered the whole basin so the room was a
       paved yard with a ghost of a dock below it; now the basin is open, stepped granite down to a floor
       twelve metres below, with the quays either side and a wooden sailing ship on the keel blocks at the
       river end (a Poly Haven CC0 scan standing in for the frigates and ships of the line the dock was built
       for). Surfaces are scanned at real size: granite ashlar, hangar concrete, rusted and painted steel,
       corrugated iron and the brick of Building 92. */
    const granite = scan(k, 'navyyard', 'ashlar', 2.3, { color: 0xcfcdc8 }),
      quay = scan(k, 'navyyard', 'quay', 2.0, { color: 0xc8c4bc }),
      rust = scan(k, 'navyyard', 'rust', 2.2, { color: 0xc89a80, metalness: 0.4, roughness: 0.85 }),
      steel = scan(k, 'navyyard', 'gantry', 2.2, { color: 0x6a747c, metalness: 0.55, roughness: 0.7 }),
      yellow = k.pbr('gantryY', X.steel(0xd9a12a, false, 16), 0.6, { metalness: 0.5, roughness: 0.5 }),
      timber = k.pbr('keel', X.planks(0x4a3a2c, 3, 18), 1.0),
      corr = scan(k, 'navyyard', 'corr', 2.7, { color: 0xa0a6ac, metalness: 0.45, roughness: 0.6 }),
      shedBrick = scan(k, 'navyyard', 'brick', 1.5, { color: 0xe2d0c4 }),
      dark = k.flat(0x1a1c20, 0.6, 0.5);
    /* Dry Dock 1 was built to take a vessel 320 feet long (about 98 m), so the basin runs 100 m from head to caisson */
    const L = 100, ZC = 10 - L / 2, D = 12, FW = 4.5, SW = 1.3, EDGE = FW + 5 * SW + 0.2;
    // the quays either side and the head, the floor of the dock, the stepped granite altars between them
    for (const s of [-1, 1]) k.box(19, 0.6, L + 30, s * (EDGE + 9.5), -0.3, ZC - 6, quay);
    k.box(18, 0.6, 2 * FW, 0, -D - 0.3, ZC, granite);
    k.box(2 * FW, 0.6, L, 0, -D - 0.3, ZC, granite);
    for (const s of [-1, 1]) for (let step = 0; step < 6; step++) { const x0 = FW + step * SW, x1 = EDGE + 1.2, y = -D + step * 2; k.box(x1 - x0, 2.01, L, s * (x0 + x1) / 2, y + 1, ZC, granite); k.box(0.08, 0.06, L, s * (x0 + 0.04), y + 2.0, ZC, k.flat(0x6c6a66, 0.1, 0.8)); }
    k.box(60, D, 8, 0, -D / 2, ZC + L / 2 + 4, granite);
    for (const x of [-3.4, -1.8, 1.8, 3.4]) k.box(0.14, 0.14, L, x, -D + 0.07, ZC, dark);
    for (let z = 6; z > ZC - L / 2; z -= 3) k.box(3.4, 1.2, 1.2, 0, -D + 0.6, z, timber);
    /* the open basin is not floor: the visitor walks the quays and the head of the dock */
    k.block(-EDGE, EDGE, ZC - L / 2 - 2.2, ZC + L / 2);
    k.keepOut.push({ x: 17, z: 0, r: 0.7 });     // the bell post
    for (const z of [-8, -32]) k.keepOut.push({ x: 15.6, z, r: 1.5 });   // the quay benches
    // the ship on the blocks, shored from the altars with timber
    const SHIP_Z = -71.5;
    k.prop('navyyard/dutch_ship_medium', 0, -D + 1.2, SHIP_Z, { scale: 1.45, rotY: PI / 2 });
    for (let z = SHIP_Z + 14; z > SHIP_Z - 15; z -= 4.5) for (const s of [-1, 1]) k.beam(v(s * (FW + 2 * SW - 0.2), -D + 4.05, z), v(s * 3.1, -D + 6.6, z), 0.16, timber, 6);
    const shipAt = v(4.2, -D + 6, SHIP_Z);
    k.spot(EDGE + 1, 7, SHIP_Z + 12, 0, -D + 8, SHIP_Z, 0xffe2b8, 260, 0.45, 0.6, 60);
    /* THE TRICK, an anamorphic painting across the east altars of the dock: yellow letters broken over six
       granite steps, treads and risers, that stand up straight and flat only from the head of the dock,
       where you arrive */
    { const eye = v(-13, 3, 10), aim = v(9.4, -4.6, -27).sub(eye);
      const altar = (x: number) => { const ax = Math.abs(x); return ax < FW ? -D : ax >= EDGE - 0.2 ? 0 : -D + 2 + 2 * Math.floor((ax - FW) / SW); };
      const tex = canvasTex(1024, 384, (g) => { g.clearRect(0, 0, 1024, 384); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#f3c033'; let fs = 170; g.font = `900 ${fs}px "Archivo", "Arial Black", sans-serif`; fs = Math.floor(fs * Math.min(1, 960 / g.measureText('DRY DOCK 1').width)); g.font = `900 ${fs}px "Archivo", "Arial Black", sans-serif`; g.fillText('DRY DOCK 1', 512, 130); g.font = '700 110px "Archivo", "Arial Black", sans-serif'; g.fillText('1851', 512, 300); g.fillRect(150, 228, 724, 10); });
      anamorph(k, eye, aim, 12, 3.7, 1.36, altar, tex, 0xffffff, 0.95);
      k.egg(v(7.5, -5, -27), { id: 'navyyard-anamorph', title: 'Letters that stand up', year: '1533', text: 'The yellow letters are painted in pieces across the granite steps of the east wall, stretched and broken so they only read as one flat sign from the head of the dock, where you arrived. The trick is anamorphosis: Hans Holbein hid a stretched skull across the floor of The Ambassadors in 1533 that only snaps into shape from one side of the painting.', clue: 'Go back to where you arrived and look across the dock at the east steps.', source: { name: 'Anamorphosis, Wikipedia', url: 'https://en.wikipedia.org/wiki/Anamorphosis' } }, { r: 2.4 }); }
    // the workshop on the west quay: real kit (Poly Haven CC0)
    k.prop('navyyard/portable_welding_cart', -16.2, 0, -20, { scale: 1.5, rotY: 0.6, keepOut: 0.8 });
    k.prop('navyyard/old_military_compressor', -16.4, 0, -24.5, { scale: 1.5, rotY: 0.1, keepOut: 1.2 });
    propMany(k, 'navyyard/propane_tank', [[-17, -22.2], [-16.5, -22.6], [-17.1, -27.4]].map(([x, z], i) => ({ x, y: 0, z, ry: i, s: 1.6 })));
    propMany(k, 'navyyard/wooden_military_crate', [{ x: -16.4, y: 0, z: -29.5, ry: 0.1, s: 1.5 }, { x: -16.4, y: 0.69, z: -29.5, ry: -0.15, s: 1.5 }, { x: -16.6, y: 0, z: -31.4, ry: 1.4, s: 1.5 }]);
    for (const z of [-29.5, -31.4]) k.keepOut.push({ x: -16.4, z, r: 1.1 });
    k.prop('navyyard/hand_truck', -15.4, 0, -33.2, { scale: 1.5, rotY: -0.5, keepOut: 0.6 });
    k.prop('navyyard/lifebuoy', -14.2, 1.0, ZC - L / 2 - 0.6, { scale: 1.4 });
    for (const s of [-1, 1]) k.prop('navyyard/flood_lights', s * (EDGE + 1.6), 0, SHIP_Z + 10, { scale: 0.55, rotY: s * PI / 2, keepOut: 1.2 });
    // the yard's signs: the date cut in the head wall, the yard on the gantry, the edge warning
    k.sign('DRY DOCK NO. 1  ·  1840 TO 1851', 14, 0.9, 0, -2.2, ZC + L / 2 - 0.02, '#8f8a80', '#3a3630', 54, PI);
    for (const s of [-1, 1]) { k.box(0.08, 1.3, 0.08, s * (EDGE + 0.4), 0.65, 6.6, dark); for (const f of [1, -1]) k.sign('DANGER  ·  KEEP CLEAR OF DOCK EDGE', 2.2, 0.36, s * (EDGE + 0.4) - s * f * 0.05, 1.2, 6.6, '#f1c531', '#111111', 48, (s < 0 ? PI / 2 : -PI / 2) + (f < 0 ? PI : 0)); }
    // gantries: two portal cranes and a longitudinal beam carrying the monumental works
    for (const z of [-6, -50]) {
      for (const s of [-1, 1]) { k.box(1.2, 22, 1.4, s * 20, 11, z, yellow); for (let y = 1; y < 21; y += 2.2) { k.beam(v(s * 20 - 0.5, y, z), v(s * 20 + 0.5, y + 2.2, z), 0.07, steel, 5); k.beam(v(s * 20 + 0.5, y, z), v(s * 20 - 0.5, y + 2.2, z), 0.07, steel, 5); } k.box(3, 0.6, 3, s * 20, 0.3, z, steel); }
      for (const y of [21.5, 24]) k.box(42, 0.5, 0.6, 0, y, z, yellow);
      for (let x = -20; x < 20; x += 2.5) { k.beam(v(x, 21.5, z), v(x + 2.5, 24, z), 0.09, steel, 5); k.beam(v(x, 24, z), v(x + 2.5, 21.5, z), 0.09, steel, 5); }
      k.box(3, 1.6, 2.2, 6, 25.6, z, corr);
      k.beam(v(0, 21.4, z), v(0, 14, z), 0.05, dark, 4);
      k.torus(0.6, 0.12, 0, 13.4, z, yellow, 20);
    }
    /* the hanging beam stops short of the ship's masts */
    for (const y of [19, 20.5]) k.box(0.6, 0.5, 60, 0, y, -26, yellow);
    for (let z = 4; z > -56; z -= 2.5) { k.beam(v(0, 19, z), v(0, 20.5, z - 2.5), 0.08, steel, 5); }
    for (const [z, r] of [[-6.7, 0], [-5.3, PI]] as const) k.sign('U.S. NAVY YARD  ·  NEW YORK', 14, 1.6, 0, 22.75, z, '#1d2a3a', '#f0e6c8', 64, r);
    // sheds along the quay, the caisson gate and the river beyond
    for (let b = 0; b < 4; b++) {
      const z = 2 - b * 18;
      k.box(6, 8, 16, 21.5, 4, z, corr);
      k.mesh(new T.CylinderGeometry(3.2, 3.2, 16.4, 16, 1, false, 0, PI), corr, 21.5, 8, z).rotation.set(0, 0, PI / 2);
      k.box(0.4, 8.4, 16.4, 18.4, 4, z, shedBrick);
      for (let y = 2.5; y < 7; y += 2) for (let dz = -6; dz <= 6; dz += 3) k.box(0.1, 1.2, 1.6, 18.15, y, z + dz, k.glow(0xffd0a0));
    }
    k.sign('BUILDING 92  ·  DRY DOCK 1', 8, 0.8, 18.1, 7.2, -20, '#2a2e33', '#f4d38a', 90, -PI / 2, { border: true });
    k.box(2 * EDGE + 0.4, D + 4, 2.4, 0, -D / 2 + 1, ZC - L / 2 - 1, rust);
    for (let x = -9; x <= 9; x += 3) k.box(0.4, D + 4, 0.4, x, -D / 2 + 1, ZC - L / 2 + 0.3, steel);
    k.water({ y: -1.6, color: 0x24404e, w: 400, d: 300, z: ZC - L / 2 - 160, amp: 1 });
    k.box(60, 3, 60, 0, -1.5, ZC - L / 2 - 30, quay);
    for (const [x, z] of [[-30, -100], [36, -120], [0, -140]]) { k.box(1.2, 30, 1.4, x, 15, z, yellow); k.box(26, 0.8, 0.8, x + 8, 29, z, yellow); k.beam(v(x + 8, 29, z), v(x + 18, 22, z), 0.08, steel, 5); }
    k.skyline({ z: -190, count: 32, spacing: 7, scale: 2.4, base: -2, seed: 40, lit: 0.4, glow: 1.2, tint: 0x33394a });
    k.prop('hook', -14, 0, 4, { height: 2.2 });
    k.prop('cleat', 16, 0, -10, { height: 0.6 });
    k.prop('cleat', -16, 0, -30, { height: 0.6 });
    k.prop('buoy', 16.5, 0, -46, { height: 2.0, keepOut: 0.9 });
    k.prop('lobster_trap', -16, 0, 2, { height: 1.0, rotY: 0.5 });
    k.prop('bell', 17, 1.8, 0, { height: 0.9 });
    k.box(0.25, 1.8, 0.25, 17, 0.9, 0, dark);
    for (const s of [-1, 1]) k.rail(s * (EDGE + 0.15), ZC, L, dark, 1.1, 'z', 2);
    for (const z of [4, -20, -44]) for (const s of [-1, 1]) { k.prop('lamppost', s * 15.5, 0, z, { height: 6.5, keepOut: 0.45 }); k.point(s * 15.5, 6, z, 0xffd0a0, 26, 15); }
    for (const z of [-8, -32]) k.bench(15.6, z, PI, k.pbr('benchN', X.planks(0x5d4939, 3, 19), 1.2), dark, 2.6);
    k.censusWall({ x: 18.15, y: 4.2, z: 20, rotY: -PI / 2, cols: 14, rows: 4, tile: 0.62, gap: 0.05, start: ctx.wallStart(1000, 56), pieces: ctx.all, backing: dark });
    // the works: eight monumental hangs from the gantry, twelve along the sheds
    const mounts: Mount[] = [];
    for (let i = 0; i < 8; i++) {
      const s = i % 2 ? 1 : -1, z = 0 - i * 7.6;
      for (const dx of [-3.5, 3.5]) k.beam(v(dx, 19, z), v(dx, 12.4, z), 0.03, dark, 4);
      mounts.push({ position: v(0, 8.8, z), rotation: s < 0 ? PI / 2 : -PI / 2, target: v(s * -15.2, 3, z), width: 9.6, height: 6.4, style: 'steel', wash: false, lookAt: v(0, 8.8, z) });
      k.box(0.14, 7.2, 10.4, 0, 8.8, z, dark);
    }
    for (let i = 0; i < 12; i++) { const z = 8 - i * 6; if (z > 6) continue; mounts.push({ position: v(18.1, 3.4, z), rotation: -PI / 2, target: v(13.6, 3, z), width: 4.8, height: 2.8, style: 'steel' }); }
    for (let i = 0; i < 2; i++) mounts.push({ position: v(-18.1, 3.4, -10 - i * 30), rotation: PI / 2, target: v(-13.6, 3, -10 - i * 30), width: 4.8, height: 2.8, style: 'steel' });
    for (let i = 0; i < 2; i++) k.box(0.4, 6, 8, -18.4, 3, -10 - i * 30, corr);
    // easter eggs: the engineer, the Maine granite, the arch under the floor, the caisson, the Monitor myth, the prison ships
    const HDC = { name: 'Dry Dock 1, Historic Districts Council', url: 'https://hdc.org/buildings/dry-dock-1/' };
    const AIT = { name: 'Brooklyn Navy Yard, Invention and Technology', url: 'https://www.inventionandtech.com/node/85452' };
    k.egg(v(-9.2, -4, -10), { id: 'navyyard-mcalpine', title: 'Springs under the dock', year: '1851', text: 'Dry Dock 1, built from 1840 to 1851, was the first permanent dry dock in the area and is still in use. Its engineer, William J. McAlpine, had to beat a failing cofferdam and floods from underground springs, and the walls are faced with some 23,000 yards of granite.', clue: 'Look down the stepped granite walls on the west side.', source: HDC }, { r: 2.0 });
    k.egg(v(0, -6, ZC + L / 2 - 0.5), { id: 'navyyard-maine-granite', title: 'Floated down from Maine', text: 'The Navy decided in 1841 to build its first dry dock here, New York\'s first too. Great blocks of granite were floated down from Maine and laid on a cement and flagstone foundation, and the job took ten years and three million dollars. It was made to take a ship 320 feet long with a 21 foot draft.', clue: 'Look at the granite head wall at the landward end of the dock.', source: AIT }, { r: 2.2 });
    k.egg(v(0, -D + 0.4, -60), { id: 'navyyard-inverted-arch', title: 'An arch upside down', text: 'The flat floor of the dock, thirty feet wide, sits on a great inverted arch of stone. The arch pushes back against the water pressure trying to lift the floor from below.', clue: 'Look down at the floor of the dock, under the hanging works.', source: HDC }, { r: 2.0 });
    k.egg(v(0, -4, ZC - L / 2 + 0.6), { id: 'navyyard-caisson', title: 'A gate that sinks', text: 'The caisson across the mouth dates from the 1920s. To flood the dock, water is pumped into the caisson until it sinks and lets the river in; to empty the 610,000 gallon stone tub takes more than two hours. Gulls flock in to eat the fish left stranded on the granite.', clue: 'Walk to the far end and look at the steel gate to the river.', source: AIT }, { r: 2.2 });
    k.egg(shipAt, { id: 'navyyard-monitor-myth', title: 'Not built here', year: '1862', text: 'Almost anyone at the Navy Yard will tell you the ironclad Monitor was built right here in Dry Dock 1. It was not: the Monitor was built in Greenpoint and only fitted out at the yard.', clue: 'Look at the ship on the keel blocks at the river end of the dock.', source: AIT }, { r: 2.0 });
    k.egg(v(-14, 2, ZC - L / 2 - 3), { id: 'navyyard-prison-ships', title: 'The prison ships of Wallabout Bay', year: '1783', text: 'During the Revolutionary War the British held American prisoners on ships moored in Wallabout Bay, where the yard now stands. Some 12,000 were said to have died by 1783, remembered by the Prison Ship Martyrs\' Monument in Fort Greene Park. Yard workers later dug up a skeleton thought to be one of them.', clue: 'Stand at the river end of the quay and look out over the water.', source: { name: 'Brooklyn Navy Yard, Wikipedia', url: 'https://en.wikipedia.org/wiki/Brooklyn_Navy_Yard' } }, { r: 2.0 });
    return { mounts, spawn: v(-13, 3, 10), look: v(0, -3, -42), eye: 3, bounds: [-17.2, 17.2, ZC - L / 2 - 1, 12], style: 'steel' };
  },
};

/* ---------------- 21 GOVERNORS ISLAND HILLS ---------------- */
export function hill(x: number, z: number) {
  return 9 * Math.exp(-((z + 34) ** 2) / 320 - (x * x) / 300) + 2.2 * Math.exp(-((z + 8) ** 2) / 160 - (x * x) / 400) + 1.4 * Math.exp(-((x - 22) ** 2) / 200 - ((z + 20) ** 2) / 300);
}
export const governors: RoomDef = {
  id: 'governors',
  name: 'The harbor observatory',
  area: 'GOVERNORS ISLAND HILLS',
  mood: 'A rising horizon',
  color: '#a7c496',
  description: 'A winding path climbing the Hills to an overlook, works set into the slope like wind screens, the harbor all around.',
  signatures: 'Sculpted grass hills with a switchback gravel path, granite scramble blocks, the long slide, Liberty and the lower Manhattan skyline across the water.',
  build(k, ctx) {
    k.sky({ top: 0x6c9dd0, horizon: 0xe4ecec, ground: 0x4e6e5a, fog: 0.0022, sun: { az: 1.4, el: 0.5, color: 0xfff4de, size: 14 }, haze: 0.2, env: 0.9 });
    k.hemi(0xeaf3ff, 0x3a5a3a, 0.9);
    k.sun(0xfff2da, 2.4, 40, 50, 30, true, 80);
    /* 2026-11-23: scanned CC0 surfaces at real size (lawn, the gravel of the path, flamed granite, the dock
       decking), the Scramble as real scanned boulders, grass and shrubs along the climb, picnic tables at the
       landing, channel markers in the harbour, the park's wayfinding, and a ring on the summit that Liberty
       fits inside from one spot. */
    const lawn = scan(k, 'governors', 'grass', 2.0, { color: 0xb8d49c }),
      gravel = scan(k, 'governors', 'gravel', 2.25, { color: 0xe8e0d0 }),
      granite = k.pbr('scramble', X.ashlar(0x8a8a86, 12, 2), 0.35),
      paving = scan(k, 'governors', 'granite', 1.9, { color: 0xc4ccd4 }),
      steel = k.flat(0xb9bec4, 0.8, 0.35),
      timber = k.pbr('benchGI', X.planks(0x8a6a48, 3, 20), 1.2),
      dark = k.flat(0x2a2c30, 0.5, 0.5);
    // the terrain
    const g = new T.PlaneGeometry(140, 150, 110, 110);
    g.rotateX(-PI / 2);
    const pa = g.attributes.position;
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i) - 24; pa.setXYZ(i, x, hill(x, z) - 0.1, z); }
    g.computeVertexNormals();
    k.mesh(g, lawn);
    k.water({ y: -1.4, color: 0x2f5468, w: 600, d: 600, z: -60, amp: 1.2 });
    // the path
    const path = Array.from({ length: 221 }, (_, i) => { const u = i / 220, z = 10 - u * 58, x = Math.sin(u * PI * 2.2) * 6.5 * (1 - u * 0.3); return v(x, hill(x, z) + 2.4, z); });
    const pg: number[] = [], ix: number[] = [];
    for (let i = 0; i < path.length; i++) { const p = path[i]; for (const s of [-1, 1]) pg.push(p.x + s * 1.7, hill(p.x + s * 1.7, p.z) + 0.03, p.z); if (i < path.length - 1) { const n = i * 2; ix.push(n, n + 1, n + 2, n + 1, n + 3, n + 2); } }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pg, 3));
    geo.setIndex(ix);
    geo.computeVertexNormals();
    k.mesh(geo, gravel);
    // granite scramble, benches, trees, the slide
    const rnd = X.mulberry(21);
    /* the Scramble: the old seawall's granite, as scanned boulders half sunk in the slope */
    const rocks: Place[][] = [[], [], []];
    for (let i = 0; i < 40; i++) { const x = (rnd() - 0.5) * 60, z = -10 - rnd() * 44; if (Math.abs(x - Math.sin(((10 - z) / 58) * PI * 2.2) * 6.5) < 3.5) continue; const s = 0.6 + rnd() * 1.2; rocks[i % 3].push({ x, y: hill(x, z) - 0.25 * s, z, ry: rnd() * PI * 2, s: s * 1.3 }); k.keepOut.push({ x, z, r: s * 1.1 }); }
    ['governors/namaqualand_boulder_04', 'governors/namaqualand_boulder_02', 'governors/namaqualand_boulder_05'].forEach((n, i) => propMany(k, n, rocks[i]));
    /* tall grass and low shrubs along the edges of the climb */
    { const grass: Place[] = [], shrubs: Place[] = [];
      for (let i = 4; i < path.length - 30; i += 7) { const p = path[i], q = path[i + 1], ry = Math.atan2(-(q.z - p.z), q.x - p.x); for (const s of [-1, 1]) { const nx = -(q.z - p.z), nz = q.x - p.x, nl = Math.hypot(nx, nz) || 1, ox = (nx / nl) * s * (2.3 + rnd()), oz = (nz / nl) * s * (2.3 + rnd()); (i % 2 ? grass : shrubs).push({ x: p.x + ox, y: hill(p.x + ox, p.z + oz) - 0.05, z: p.z + oz, ry: ry + (rnd() - 0.5) * 0.6, s: 1.5 + rnd() * 0.6 }); } }
      propMany(k, 'governors/grass_medium_01', grass, false); propMany(k, 'governors/shrub_03', shrubs, false); }
    for (let i = 0; i < 34; i++) { const x = (rnd() - 0.5) * 100, z = -rnd() * 70 + 6; if (Math.abs(x) < 9 && z > -60) continue; k.tree(x, hill(x, z) - 0.1, z, { kind: rnd() > 0.5 ? 'round' : 'column', h: 3 + rnd() * 3, r: 1.4 + rnd() * 1.4, leaf: 0x3f6f38, seed: i }); }
    for (const i of [30, 90, 150]) { const p = path[i]; k.bench(p.x + 2.6, p.z, PI / 2, timber, dark, 2.2); k.bench(p.x + 2.6, p.z, PI / 2, timber, dark, 2.2).position.y = hill(p.x + 2.6, p.z); }
    /* Slide Hill has four slides built into its slope, the longest 57 feet */
    let slide: T.Vector3[] = [];
    for (const [dz, len] of [[0, 16], [2.4, 12], [4.8, 9], [-2.4, 7]]) {
      const sl: T.Vector3[] = [];
      for (let i = 0; i <= 30; i++) { const u = i / 30, x = 12 + u * len, z = -34 + dz + Math.sin(u * PI) * 6 * (len / 16) - u * 10 * (len / 16); sl.push(v(x, hill(x, z) + 0.5 + (1 - u) * 0.6, z)); }
      k.curve(sl, 0.55, steel, 40);
      for (let i = 0; i <= 30; i += 5) { const p = sl[i]; k.beam(v(p.x, hill(p.x, p.z), p.z), v(p.x, p.y, p.z), 0.1, dark, 6); }
      if (dz === 0) slide = sl;
    }
    /* Discovery Hill carries Rachel Whiteread's Cabin: a concrete cast of the inside of a wooden shed */
    const cabX = 22, cabZ = -20, cabY = hill(cabX, cabZ);
    const cabin = k.box(3.2, 2.6, 4.2, cabX, cabY + 1.3, cabZ, k.pbr('whitereadConcrete', X.concrete(0xa8a59c, 23), 0.4));
    k.keepOut.push({ x: cabX, z: cabZ, r: 2.8 });
    // the overlook at the summit: a granite platform and rail, with works as wind screens
    const top = path[195];
    const ty = hill(top.x, top.z);
    k.mesh(new T.CylinderGeometry(7, 7.6, 0.6, 32), paving, top.x, ty + 0.05, top.z);
    for (let j = 0; j < 32; j++) { const a = (j * PI) / 16; if (Math.abs(a - PI / 2) < 0.5) continue; k.box(0.06, 1.1, 0.06, top.x + Math.cos(a) * 6.6, ty + 0.9, top.z + Math.sin(a) * 6.6, steel); }
    k.torus(6.6, 0.05, top.x, ty + 1.45, top.z, steel, 48).rotation.x = PI / 2;
    for (const [x, z] of [[top.x + 3, top.z - 3], [top.x - 3, top.z + 3]]) { k.plinth(x, z, 1.2, 0.8, 1.2, granite); k.objects[k.objects.length - 2].position.y = ty + 0.4; k.objects[k.objects.length - 1].position.y = ty + 0.84; }
    k.prop('bell', top.x + 3, ty + 0.9, top.z - 3, { height: 0.9 });
    k.prop('buoy', top.x - 3, ty + 0.9, top.z + 3, { height: 1.4 });
    /* THE TRICK, forced perspective: a bronze ring on a post at the summit. Stand on the plate and the
       Statue of Liberty, a mile of harbour away, fits exactly inside it. */
    { const L = v(-90, 12.1, -60), d = v(L.x - top.x, 0, L.z - top.z).normalize();
      const S0 = v(top.x + d.x * 2.0, ty, top.z + d.z * 2.0), E = v(S0.x, ty + 2.4, S0.z), toL = L.clone().sub(E), dist = toL.length(); toL.normalize();
      const rc = E.clone().addScaledVector(toL, 1.4), rr = 1.4 * Math.tan(Math.atan(14.4 / dist));
      const bronze = k.flat(0x8a6a3a, 0.85, 0.35);
      const ring = k.torus(rr, 0.016, rc.x, rc.y, rc.z, bronze, 40);
      ring.lookAt(E);
      k.beam(v(rc.x, ty + 0.3, rc.z), v(rc.x, rc.y - rr, rc.z), 0.03, bronze, 8);
      k.cyl(0.16, 0.3, rc.x, ty + 0.45, rc.z, granite, 0.2, 16);
      k.keepOut.push({ x: rc.x, z: rc.z, r: 0.35 });
      const plate = k.mesh(new T.CircleGeometry(0.45, 32), k.flat(0xc09a58, 0.7, 0.35), S0.x, ty + 0.37, S0.z);
      plate.rotation.x = -PI / 2;
      const st = k.sign('STAND HERE', 0.8, 0.16, S0.x, ty + 0.38, S0.z, 'transparent', '#f0e0b8', 120, 0, { double: true });
      st.rotation.set(-PI / 2, 0, Math.atan2(d.x, d.z) + PI);
      k.egg(rc, { id: 'governors-ring', title: 'Liberty in a ring', text: 'Stand on the bronze plate and the Statue of Liberty, across the water on Liberty Island, fits exactly inside this small bronze ring. It is forced perspective, the trick that makes something far away look small enough to hold.', clue: 'On the summit, find the small bronze ring on a post and stand on the plate behind it.', source: { name: 'Forced perspective, Wikipedia', url: 'https://en.wikipedia.org/wiki/Forced_perspective' } }, { r: 0.8 }); }
    // the dock at the start, with the census on the ferry shed
    k.box(30, 1.2, 12, 0, -0.6, 18, scan(k, 'governors', 'deck', 1.8, { color: 0xd8ccbc }));
    for (const x of [-10.5, 10.5]) k.prop('governors/wooden_picnic_table', x, 0, 15.6, { scale: 1.35, rotY: PI / 2, keepOut: 2.0 });
    /* the park's wayfinding at the foot of the climb */
    { const p = path[16], wx = p.x + 3.4, wz = p.z, wy = hill(wx, wz);
      k.box(0.12, 2.6, 0.12, wx, wy + 1.3, wz - 0.7, dark); k.box(0.12, 2.6, 0.12, wx, wy + 1.3, wz + 0.7, dark);
      k.box(0.1, 1.5, 1.8, wx, wy + 1.85, wz, k.flat(0x2f4a3a, 0.2, 0.6));
      k.sign('THE HILLS', 1.6, 0.32, wx - 0.06, wy + 2.4, wz, '#2f4a3a', '#f0f4e8', 150, -PI / 2);
      k.sign('OUTLOOK HILL  ·  70 FT', 1.6, 0.2, wx - 0.06, wy + 2.05, wz, '#2f4a3a', '#cfe3c4', 56, -PI / 2);
      k.sign('DISCOVERY HILL  ·  39 FT', 1.6, 0.2, wx - 0.06, wy + 1.8, wz, '#2f4a3a', '#cfe3c4', 52, -PI / 2);
      k.sign('SLIDE HILL  ·  THE SLIDES', 1.6, 0.2, wx - 0.06, wy + 1.55, wz, '#2f4a3a', '#cfe3c4', 52, -PI / 2);
      k.sign('GRASSY HILL  ·  26 FT', 1.6, 0.2, wx - 0.06, wy + 1.3, wz, '#2f4a3a', '#cfe3c4', 56, -PI / 2);
      k.keepOut.push({ x: wx, z: wz, r: 1.0 }); }
    k.box(18, 6, 1, 0, 3, 23.5, k.pbr('shedG', X.steel(0x60686e, false, 22), 0.8, { metalness: 0.5, roughness: 0.5 }));
    k.censusWall({ x: 0, y: 3.0, z: 22.95, rotY: PI, cols: 22, rows: 4, tile: 0.6, gap: 0.05, start: ctx.wallStart(200, 88), pieces: ctx.all, backing: dark });
    k.sign('GOVERNORS ISLAND  ·  THE HILLS', 7, 0.6, 0, 5.5, 22.9, '#2f4a3a', '#f0f4e8', 80, PI, { border: true });
    k.prop('life_ring', -9.05, 1.4, 20, { height: 0.9, rotY: PI / 2 });
    k.prop('cleat', 8, 0, 14, { height: 0.5 });
    k.prop('lamppost', -6, 0, 14, { height: 6, keepOut: 0.5 });
    // the harbour: Liberty to the west, lower Manhattan ahead, Brooklyn to the east
    liberty(k, -90, -1.5, -60, 1.4, [0, 0]);
    /* the credit her model's licence asks for, on a low post at the west edge of the path, the side she stands on */
    { const p = path[16], cx = p.x - 2.5, cy = hill(cx, p.z); k.box(0.08, 0.8, 0.08, cx - 0.05, cy + 0.4, p.z, dark); k.sign(LIBERTY_CREDIT, 3.4, 0.42, cx, cy + 0.95, p.z, '#2f4a3a', '#f0f4e8', 46, PI / 2); }
    k.box(60, 4, 40, -90, -1.5, -62, k.pbr('libIsland', X.ashlar(0x6f7566, 4, 3), 0.1));
    k.skyline({ z: -190, count: 34, spacing: 6.5, scale: 1.9, base: -1.5, seed: 44, lit: 0.22, glow: 0.5, tint: 0x6e7684 });
    k.skyline({ z: -215, count: 30, spacing: 9, scale: 3, base: -1.5, seed: 45, lit: 0.15, glow: 0.4, tint: 0x7d8490, rows: 1 });
    k.skyline({ z: -90, count: 16, spacing: 7, scale: 1.4, base: -1.5, seed: 46, lit: 0.2, glow: 0.4, tint: 0x6b5f57, x: 110, rows: 1 });
    propMany(k, 'governors/lateral_sea_marker', [[-40, -110], [60, -95], [-20, -140]].map(([x, z], i) => ({ x, y: -1.9, z, ry: i * 1.3, s: 1.1 })));
    // the works along the climb and around the overlook
    const mounts: Mount[] = [];
    for (let i = 0; i < 16; i++) {
      const p = path[10 + i * 11], s = i % 2 ? 1 : -1, x = p.x + s * 3.6, y = hill(x, p.z);
      k.box(0.3, 3.6, 5.4, x, y + 1.8, p.z, granite);
      k.box(0.8, 0.2, 5.8, x, y + 0.1, p.z, granite);
      mounts.push({ position: v(x - s * 0.2, y + 2.6, p.z), rotation: s < 0 ? PI / 2 : -PI / 2, target: p.clone(), width: 4.4, height: 2.6, style: 'steel', wash: false });
    }
    for (let j = 0; j < 4; j++) {
      const a = PI * 0.9 + (j / 3) * PI * 1.2, x = top.x + Math.cos(a) * 6.4, z = top.z + Math.sin(a) * 6.4;
      k.box(0.3, 3.4, 4.6, 0, 0, 0, granite).position.set(x, ty + 1.7, z);
      k.objects[k.objects.length - 1].rotation.y = -a - PI / 2;
      mounts.push({ position: v(x - Math.cos(a) * 0.25, ty + 2.4, z - Math.sin(a) * 0.25), rotation: -a - PI / 2, target: v(top.x, ty + 2.4, top.z), width: 4.0, height: 2.4, style: 'steel', wash: false });
    }
    // easter eggs: the summit, the old seawall, the slides, the cabin, the made land, the first flight over the water
    const W = { name: 'Governors Island, Wikipedia', url: 'https://en.wikipedia.org/wiki/Governors_Island' };
    const BDC = { name: 'The Hills of Governors Island reach completion one year ahead of schedule, BD+C', url: 'https://www.bdcnetwork.com/building-sector-reports/sports-and-recreational-facilities/news/55160345/the-hills-of-governors-island-reach-completion-one-year-ahead-of-schedule' };
    const ML = { name: 'New Hills to see New York, Metalocus', url: 'https://metalocus.es/en/news/new-hills-see-new-york-completed-governors-island-hills-west8' };
    k.egg(v(top.x, ty + 2.2, top.z), { id: 'governors-outlook-hill', title: 'Seventy feet of made hill', year: '2016', text: 'The Hills opened in July 2016, a year ahead of schedule. There are four: Grassy Hill at 26 feet, Slide Hill at 36, Discovery Hill at 39 and Outlook Hill, the tallest, at 70 feet. The gaps between them were shaped to hide and then reveal the harbour views.', clue: 'Climb to the round granite overlook at the summit.', source: ML }, { r: 2.0 });
    { const sp = path[120]; k.egg(v(sp.x - 4.5, hill(sp.x - 4.5, sp.z) + 1.2, sp.z), { id: 'governors-scramble', title: 'Climbing the old seawall', year: '1905', text: 'The Scramble on Outlook Hill is built from granite blocks of the seawall the Army set in the harbour when it expanded the island in 1905.', clue: 'Look for the rough granite blocks scattered on the slope beside the path.', source: BDC }, { r: 2.0 }); }
    k.egg(slide[3], { id: 'governors-slides', title: 'The longest slide in the city', text: 'Slide Hill has four slides built into its slope. The longest runs 57 feet, the longest slide in New York City.', clue: 'Find the steel chutes running down the east flank.', source: BDC }, { r: 1.8 });
    k.egg(cabin, { id: 'governors-cabin', title: 'A shed turned inside out', text: 'On Discovery Hill sits Cabin by the British artist Rachel Whiteread: a concrete cast of the inside of a wooden, New England style shed. Bronze casts of discarded objects lie scattered around it in the grass.', clue: 'Look for the grey concrete hut on the hill to the east.', source: ML }, { r: 2.4 });
    k.egg(v(path[2].x + 2.5, hill(path[2].x + 2.5, path[2].z) + 0.8, path[2].z), { id: 'governors-made-land', title: 'Standing on fill', text: 'About 103 of the island\'s 172 acres are fill, added in the early 1900s to the south of the original island. The Hills stand on that made land, at its southern tip.', clue: 'Look at the ground at the foot of the path, where the climb begins.', source: W }, { r: 1.8 });
    k.egg(v(-14, 1.2, 14), { id: 'governors-wright-flight', title: 'Over the water', year: '1909', text: 'In October 1909 Wilbur Wright took off from Governors Island, flew over the west side of Manhattan and came back to the island.', clue: 'Stand at the edge of the dock and look across the harbour toward Manhattan.', source: W }, { r: 2.0 });
    return { mounts, spawn: path[0].clone(), look: path[8].clone(), eye: 2.4, bounds: [-60, 60, -70, 22], path, style: 'steel' };
  },
};
