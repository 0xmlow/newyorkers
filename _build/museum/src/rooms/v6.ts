/* 151 and 152: the General Assembly Hall at the United Nations, and the yard in Owego.
   The yard is a gift room, rebuilt from photographs of Upstate Shredding: the canopy and its banner,
   the car mountain, the material handlers feeding the infeed, the shredder and its steam, the stackers
   pouring frag, the trucks, all in a sandy valley with wooded ridges on every side.
   Everything that moves is one group or one instanced rig on k.ticks. */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as X from '../textures';
import { v, type Mount } from '../kit';
import type { RoomDef } from './types';
const PI = Math.PI;
type K = Parameters<RoomDef['build']>[0];
const UP = new T.Vector3(0, 1, 0);

/* ---------- local helpers ---------- */

/* soft steam as camera facing points: a radial puff texture, rising, drifting with the wind, thinning out */
function steam(k: K, pts: T.Vector3[], n: number, p: { rise: number; spread: number; size: number; opacity: number; speed: number; seed: number; animate: boolean; colour?: number }) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d')!, gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const tex = new T.CanvasTexture(c);
  const geo = new T.BufferGeometry(), arr = new Float32Array(n * 3); geo.setAttribute('position', new T.BufferAttribute(arr, 3));
  const mat = new T.PointsMaterial({ map: tex, size: p.size, color: p.colour ?? 0xf6f6f4, transparent: true, opacity: p.opacity, depthWrite: false, sizeAttenuation: true });
  const o = new T.Points(geo, mat); o.frustumCulled = false; k.add(o);
  const rnd = X.mulberry(p.seed), ph = Array.from({ length: n }, (_, i) => ({ b: pts[i % pts.length], o: rnd(), dx: (rnd() - 0.5) * p.spread, dz: (rnd() - 0.5) * p.spread }));
  const place = (t: number) => {
    ph.forEach((a, i) => { const u = (t * p.speed + a.o) % 1; arr[i * 3] = a.b.x + a.dx * (1 + u * 4) + u * u * p.rise * 0.5; arr[i * 3 + 1] = a.b.y + u * p.rise; arr[i * 3 + 2] = a.b.z + a.dz * (1 + u * 4) - u * p.rise * 0.15; });
    geo.attributes.position.needsUpdate = true;
  };
  place(0.3);
  if (p.animate) k.ticks.push(place);
  return o;
}
/* a standing figure that never moves */
function figure(k: K, x: number, y: number, z: number, coat: number, p: { h?: number; rotY?: number } = {}) {
  const { h = 1, rotY = 0 } = p;
  const body = k.mesh(new T.CapsuleGeometry(0.2, 0.82 * h, 3, 8), k.flat(coat, 0, 0.85), x, y + 0.61 * h, z);
  body.rotation.y = rotY;
  k.mesh(new T.SphereGeometry(0.125, 10, 8), k.flat(0xc8a284, 0, 0.7), x, y + (1.22 * h + 0.13), z);
  k.mesh(new T.SphereGeometry(0.15, 10, 6, 0, PI * 2, 0, PI / 2), k.flat(0xf2f2ee, 0, 0.5), x, y + (1.22 * h + 0.17), z);
  return body;
}
/* geometry builders that return transformed pieces for merging */
function bx(w: number, h: number, d: number, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) {
  const g = new T.BoxGeometry(w, h, d);
  if (rx || ry || rz) g.applyMatrix4(new T.Matrix4().makeRotationFromEuler(new T.Euler(rx, ry, rz)));
  g.translate(x, y, z);
  return g;
}
function cyl(r: number, h: number, x: number, y: number, z: number, axis: 'x' | 'y' | 'z' = 'y', seg = 14, r2 = r) {
  const g = new T.CylinderGeometry(r2, r, h, seg);
  if (axis === 'x') g.rotateZ(PI / 2); else if (axis === 'z') g.rotateX(PI / 2);
  g.translate(x, y, z);
  return g;
}
function rod(a: T.Vector3, b: T.Vector3, r: number, seg = 5) {
  const g = new T.CylinderGeometry(r, r, a.distanceTo(b), seg, 1, true);
  const q = new T.Quaternion().setFromUnitVectors(UP, b.clone().sub(a).normalize());
  g.applyMatrix4(new T.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), q, new T.Vector3(1, 1, 1)));
  return g;
}
const merge = (gs: T.BufferGeometry[]) => mergeGeometries(gs.map((g) => (g.index ? g.toNonIndexed() : g)))!;
/* a steel lattice conveyor truss from a to b: four chords, verticals, diagonals, cross members */
function trussGeo(a: T.Vector3, b: T.Vector3, w: number, d: number, step = 2.2, rc = 0.11, rw = 0.05) {
  const dir = b.clone().sub(a).normalize(), side = new T.Vector3().crossVectors(dir, UP).normalize(), up = new T.Vector3().crossVectors(side, dir).normalize();
  const c = (p: T.Vector3, s: number, u: number) => p.clone().addScaledVector(side, s * w / 2).addScaledVector(up, u * d / 2);
  const gs: T.BufferGeometry[] = [];
  for (const s of [-1, 1]) for (const u of [-1, 1]) gs.push(rod(c(a, s, u), c(b, s, u), rc, 6));
  const L = a.distanceTo(b), n = Math.max(1, Math.round(L / step));
  for (let i = 0; i <= n; i++) {
    const p = a.clone().lerp(b, i / n);
    for (const s of [-1, 1]) gs.push(rod(c(p, s, -1), c(p, s, 1), rw));
    gs.push(rod(c(p, -1, -1), c(p, 1, -1), rw));
    if (i < n) { const q = a.clone().lerp(b, (i + 1) / n); for (const s of [-1, 1]) gs.push(rod(c(p, s, -1), c(q, s, 1), rw)); }
  }
  return merge(gs);
}
/* tileable value noise for canvas surfaces */
function tileNoise(seed: number, period: number) {
  const r = X.mulberry(seed), g = new Float32Array(period * period);
  for (let i = 0; i < g.length; i++) g[i] = r();
  return (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const P = period, x0 = ((xi % P) + P) % P, x1 = (x0 + 1) % P, y0 = ((yi % P) + P) % P, y1 = (y0 + 1) % P;
    const a = g[y0 * P + x0], b = g[y0 * P + x1], c = g[y1 * P + x0], d = g[y1 * P + x1];
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}
/* a colour only surface painted per pixel, in the X.Surface shape so k.pbr can project it in world space */
function canvasSurface(size: number, fn: (u: number, v: number) => [number, number, number]): X.Surface {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d')!, im = g.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const [r, gg, b] = fn(x / size, y / size), i = (y * size + x) * 4; im.data[i] = r; im.data[i + 1] = gg; im.data[i + 2] = b; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0);
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
  return { map: t } as X.Surface;
}
/* a photograph of the yard as a world space material: optionally cropped and mirror tiled so it repeats without seams */
function photo(k: K, file: string, density: number, p: { crop?: [number, number, number, number]; mirror?: boolean; color?: number; rough?: number; side?: T.Side } = {}) {
  const url = 'assets/museum/photos/weitsman/' + file;
  const m = new T.MeshStandardMaterial({ color: p.color ?? 0xffffff, roughness: p.rough ?? 0.92, metalness: 0, side: p.side ?? T.FrontSide });
  m.userData.density = density;
  k.pending.push(new Promise<void>((res) => {
    if (typeof Image === 'undefined') { res(); return; }
    const img = new Image();
    img.onload = () => {
      const [x0, y0, x1, y1] = p.crop ?? [0, 0, 1, 1];
      const sw = Math.round(img.width * (x1 - x0)), sh = Math.round(img.height * (y1 - y0)), sx = Math.round(img.width * x0), sy = Math.round(img.height * y0);
      const f = p.mirror ? 2 : 1, c = document.createElement('canvas'); c.width = sw * f; c.height = sh * f;
      const g = c.getContext('2d')!;
      for (let i = 0; i < f; i++) for (let j = 0; j < f; j++) { g.save(); g.translate(i ? sw * 2 : 0, j ? sh * 2 : 0); g.scale(i ? -1 : 1, j ? -1 : 1); g.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh); g.restore(); }
      const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
      m.map = t; m.needsUpdate = true; res();
    };
    img.onerror = () => res();
    img.src = url;
  }));
  k.used.images.add(url);
  return m;
}
/* a long painted banner at 4096 px, for text too long for k.sign; optional US flag at the right */
function banner(text: string, w: number, h: number, bg: string, fg: string, p: { font?: string; flag?: boolean; size?: number } = {}) {
  const W = 4096, H = Math.max(96, Math.round((W * h) / w)), c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(0, 0, W, H * 0.08); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, H * 0.92, W, H * 0.08);
  const flagW = p.flag ? H * 1.3 : 0;
  g.fillStyle = fg; g.font = `700 ${p.size ?? Math.round(H * 0.56)}px ${p.font ?? 'Georgia, "Times New Roman", serif'}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, (W - flagW * 1.3) / 2, H * 0.53, (W - flagW * 1.3) * 0.94);
  if (p.flag) {
    const fx = W - flagW * 1.15, fy = H * 0.2, fh = H * 0.6, fw = fh * 1.6;
    for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? '#f4f4f4' : '#b22234'; g.fillRect(fx, fy + (i * fh) / 13, fw, fh / 13 + 1); }
    g.fillStyle = '#3c3b6e'; g.fillRect(fx, fy, fw * 0.4, fh * (7 / 13));
    g.fillStyle = '#ffffff'; for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) g.fillRect(fx + fw * 0.04 + i * fw * 0.07, fy + fh * 0.05 + j * fh * 0.12, 3, 3);
  }
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
  return new T.MeshStandardMaterial({ map: t, roughness: 0.6, metalness: 0.1 });
}
/* a scrap heap as a height field: a broad dome with lumps, jagged at the surface; returns geometry and its height function */
function heap(cx: number, cz: number, rx: number, rz: number, h: number, seed: number, jag = 0.35, seg = 56) {
  const rnd = X.mulberry(seed);
  const bumps = Array.from({ length: 12 }, () => ({ x: (rnd() - 0.5) * 1.5 * rx, z: (rnd() - 0.5) * 1.5 * rz, r: (0.18 + rnd() * 0.3) * Math.min(rx, rz) * 1.6, a: (rnd() - 0.35) * h * 0.28 }));
  const H = (x: number, z: number) => {
    const lx = x - cx, lz = z - cz, d2 = (lx / rx) ** 2 + (lz / rz) ** 2;
    if (d2 >= 1) return -0.4;
    let y = h * Math.pow(1 - d2, 0.62);
    for (const b of bumps) { const e = ((lx - b.x) ** 2 + (lz - b.z) ** 2) / (b.r * b.r); if (e < 4) y += b.a * Math.exp(-e) * Math.min(1, (1 - d2) * 3); }
    return Math.max(0, y);
  };
  const g = new T.PlaneGeometry(rx * 2, rz * 2, seg, seg); g.rotateX(-PI / 2);
  const pa = g.attributes.position;
  for (let i = 0; i < pa.count; i++) {
    const x = pa.getX(i) + cx, z = pa.getZ(i) + cz, y = H(x, z);
    pa.setXYZ(i, x + (rnd() - 0.5) * jag, y > 0 ? y + (rnd() - 0.5) * jag * 2 : -0.4, z + (rnd() - 0.5) * jag);
  }
  const f = g.toNonIndexed(); g.dispose(); f.computeVertexNormals();
  return { g: f, H };
}
/* two link reach for a boom and stick: target is where the grapple hub should be, relative to the boom foot */
function reach(dx: number, dy: number, L1: number, L2: number) {
  let d = Math.hypot(dx, dy);
  d = Math.min(L1 + L2 - 0.05, Math.max(Math.abs(L1 - L2) + 0.05, d));
  const phi = Math.atan2(dy, dx), b = Math.acos(Math.min(1, Math.max(-1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
  const a1 = phi + b, ex = L1 * Math.cos(a1), ey = L1 * Math.sin(a1);
  const a2 = Math.atan2(Math.sin(phi) * d - ey, Math.cos(phi) * d - ex);
  return { a1, a2 };
}
const smooth = (x: number) => x * x * (3 - 2 * x);
/* a group that never moves, baked into world space static meshes so the kit batches it with everything else */
function bake(k: K, g: T.Object3D) {
  g.updateMatrixWorld(true);
  g.traverse((o) => { if (o instanceof T.Mesh && !(o instanceof T.InstancedMesh)) { const geo = (o.geometry as T.BufferGeometry).clone(); geo.applyMatrix4(o.matrixWorld); k.mesh(geo, o.material as T.Material); } });
}

/* ---------------- 151 THE GOLD WALL ---------------- */
/* the emblem: the world from above the North Pole, circles and meridians, inside two olive branches */
function emblemTexture() {
  const S = 1024, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d')!, C = S / 2;
  g.clearRect(0, 0, S, S);
  g.strokeStyle = '#fff4d6'; g.fillStyle = '#fff4d6'; g.lineWidth = 7;
  for (const r of [70, 140, 210, 280, 350]) { g.beginPath(); g.arc(C, C * 0.98, r, 0, PI * 2); g.stroke(); }
  for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; g.beginPath(); g.moveTo(C, C * 0.98); g.lineTo(C + Math.cos(a) * 350, C * 0.98 + Math.sin(a) * 350); g.stroke(); }
  /* the continents, simplified to soft lobes on the azimuthal disc */
  g.globalAlpha = 0.85;
  const rnd = X.mulberry(1945);
  for (const [a, r, s] of [[-2.2, 190, 90], [-1.2, 230, 80], [-0.3, 170, 70], [0.6, 250, 95], [1.5, 200, 70], [2.4, 260, 85], [3.0, 150, 60], [-2.8, 290, 55]] as const) {
    g.beginPath();
    for (let k = 0; k <= 24; k++) { const t = (k / 24) * PI * 2, rr = s * (0.7 + 0.5 * rnd()); const x = C + Math.cos(a) * r + Math.cos(t) * rr, y = C * 0.98 + Math.sin(a) * r + Math.sin(t) * rr * 0.8; if (k) g.lineTo(x, y); else g.moveTo(x, y); }
    g.closePath(); g.fill();
  }
  g.globalAlpha = 1;
  /* the olive branches, a leaf pair every few degrees up each side */
  g.lineWidth = 12;
  for (const s of [-1, 1]) {
    g.beginPath(); g.arc(C, C * 0.98, 420, PI / 2 + s * 0.25, PI / 2 + s * (PI - 0.2), s < 0); g.stroke();
    for (let k = 0; k < 18; k++) {
      const t = PI / 2 + s * (0.35 + k * 0.155), x = C + Math.cos(t) * 420, y = C * 0.98 + Math.sin(t) * 420;
      for (const o of [-1, 1]) { g.save(); g.translate(x, y); g.rotate(t + s * (PI / 2) + o * 0.55); g.beginPath(); g.ellipse(0, -30, 13, 32, 0, 0, PI * 2); g.fill(); g.restore(); }
    }
  }
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t;
}
/* a Leger: black drawn lines over flat fields of colour, never a copy, only the manner */
function legerTexture(pal: string[], seed: number) {
  const W = 1024, H = 768, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d')!, rnd = X.mulberry(seed);
  g.fillStyle = '#ece8de'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 9; i++) {
    g.fillStyle = pal[i % pal.length]; g.beginPath();
    const x = rnd() * W, y = rnd() * H, r = 90 + rnd() * 190;
    g.moveTo(x, y - r);
    g.bezierCurveTo(x + r * 1.2, y - r * (0.3 + rnd()), x + r * (0.4 + rnd()), y + r, x - r * 0.2, y + r * 0.8);
    g.bezierCurveTo(x - r * (0.8 + rnd()), y + r * 0.4, x - r, y - r * 0.6, x, y - r);
    g.fill();
  }
  g.strokeStyle = '#141414'; g.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    g.lineWidth = 10 + rnd() * 16; g.beginPath();
    const x = rnd() * W, y = rnd() * H;
    g.moveTo(x, y);
    g.bezierCurveTo(x + (rnd() - 0.5) * 700, y + (rnd() - 0.5) * 600, x + (rnd() - 0.5) * 700, y + (rnd() - 0.5) * 600, x + (rnd() - 0.5) * 500, y + (rnd() - 0.5) * 500);
    g.stroke();
  }
  for (let i = 0; i < 3; i++) { g.lineWidth = 12; g.beginPath(); g.arc(rnd() * W, rnd() * H, 40 + rnd() * 90, 0, PI * 2); g.stroke(); }
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t;
}
/* one seated person as a single geometry: body, head, and lap, for instancing */
function seatedGeo() {
  const body = new T.CapsuleGeometry(0.19, 0.42, 2, 6); body.translate(0, 0.62, 0);
  const head = new T.SphereGeometry(0.11, 7, 5); head.translate(0, 1.1, 0);
  const lap = new T.BoxGeometry(0.34, 0.14, 0.4); lap.translate(0, 0.42, 0.16);
  return merge([body, head, lap]);
}
export const unassembly: RoomDef = {
  id: 'unassembly',
  name: 'The gold wall',
  area: 'UNITED NATIONS / GENERAL ASSEMBLY HALL',
  mood: 'The General Debate, a speaker at the rostrum',
  color: '#d4a93a',
  daylit: false,
  description: 'The largest room at the United Nations, on the East River at Turtle Bay: eighteen hundred seats in curving tiers, every member state with six of them, facing the green rostrum and the gold wall with the emblem of the world seen from above the North Pole. Two murals by Fernand Leger face each other across the hall, which this room answers in its own flat colours, and the interpreters work behind glass on both sides. The New Yorkers hang on the wood panels of the side aisles and the back wall, where the delegations walk in.',
  signatures: 'The gold leaf wall and the UN emblem, the green serpentinite rostrum with the speaker\'s lectern below the President\'s desk, the shallow sky blue dome and its ring of lights, the curved tiers of delegate desks with beige and blue chairs, the interpreters\' booths in two rows, the two voting boards, and the two Leger murals, orange and grey on the left, blue and yellow on the right.',
  build(k, ctx) {
    k.sky({ top: 0x2a2620, horizon: 0x5a4a38, ground: 0x1a1612, fog: 0.004, stars: 0, env: 0.55 });
    k.hemi(0xfff0dc, 0x3a3026, 0.9);
    k.sun(0xfff4e0, 0.6, 10, 40, 30, true, 40);
    const R = ctx.reduced;
    /* the plan: the rostrum at z = -25, the walls splaying from half width 15 to 18 at the back */
    const Z0 = -25, Z1 = 25, HW = (z: number) => 15 + ((z - Z0) / (Z1 - Z0)) * 3, CZ = -40, RIN = 30, ROW = 1.8, NR = 16, TOP = 6.4;
    const floorY = (x: number, z: number) => { const d = Math.hypot(x, z - CZ); return d <= RIN ? 0 : d >= RIN + NR * ROW ? TOP : ((d - RIN) / (NR * ROW)) * TOP; };
    const wn = tileNoise(3, 16);
    const carpet = k.pbr('unCarpet', canvasSurface(256, (u, v) => { const n = wn(u * 16, v * 16), s = 0.85 + n * 0.25; return [34 * s, 62 * s, 88 * s]; }), 0.5, { roughness: 1 });
    const woodS = canvasSurface(256, (u, v) => { const s = 0.72 + 0.28 * Math.abs(Math.sin(u * PI * 12)) + (wn(u * 4, v * 32) - 0.5) * 0.12; return [148 * s, 100 * s, 62 * s]; });
    const wood = k.pbr('unWood', woodS, 0.5, { roughness: 0.55 }), deskWood = k.flat(0xb88a5a, 0.05, 0.5);
    const upper = k.pbr('unUpper', canvasSurface(256, (u, v) => { const s = 0.9 + (wn(u * 8, v * 8) - 0.5) * 0.1; return [150 * s, 164 * s, 172 * s]; }), 0.2, { roughness: 0.85 });
    const gold = k.pbr('unGold', X.gilt(0xc89a3a), 0.35, { metalness: 0.5, roughness: 0.66, envMapIntensity: 0.8 }), goldDark = k.flat(0xb0842c, 0.9, 0.35);
    const serp = k.pbr('unSerp', X.marble(0x2f5a44, 0x8ab89a, 17), 0.4, { roughness: 0.25 }), serpDark = k.flat(0x1f3f30, 0.1, 0.3);
    const ceiling = k.flat(0x3a3f47, 0.1, 0.8, { side: T.DoubleSide }), dome = k.flat(0x6f9cc8, 0, 0.9, { side: T.BackSide }), dark = k.flat(0x16181c, 0.3, 0.7);
    const beige = 0xd8c6a4, blueSeat = 0x2a4f8f, green = k.flat(0x2f6a4a, 0.05, 0.45);
    /* ---- floor: the well in front of the rostrum, the tiers rising in arcs, the back aisle ---- */
    k.box(40, 0.2, 52, 0, -0.1, 0, carpet);
    const tierMat = k.flat(0x1f3a52, 0, 0.95, { side: T.DoubleSide });
    for (let i = 0; i < NR; i++) {
      const r0 = RIN + i * ROW, y = ((i + 1) / NR) * TOP;
      const tread = new T.RingGeometry(r0, r0 + ROW, 56, 1, -PI / 2 - 0.5, 1.0); tread.rotateX(-PI / 2); k.mesh(tread, carpet, 0, y, CZ);
      const riser = new T.CylinderGeometry(r0, r0, y, 56, 1, true, -0.5, 1.0); k.mesh(riser, tierMat, 0, y / 2, CZ);
    }
    k.box(40, TOP, 8, 0, TOP / 2 - 0.01, 21, carpet);
    /* ---- the delegations: desks along each arc, three beige chairs behind, three blue for the alternates ---- */
    const desks: T.Matrix4[] = [], tops: T.Matrix4[] = [], chairs: T.Matrix4[] = [], chairC: number[] = [], plates: T.Matrix4[] = [], seatSpots: { p: T.Vector3; a: number; beige: boolean }[] = [];
    {
      const q = new T.Quaternion(), one = new T.Vector3(1, 1, 1);
      for (let i = 0; i < NR; i++) {
        const r0 = RIN + i * ROW, y = ((i + 1) / NR) * TOP, rd = r0 + 0.38;
        const step = 2.1 / rd;
        for (let a = -0.5 + step / 2; a < 0.5; a += step) {
          const x = Math.sin(a) * rd, z = CZ + Math.cos(a) * rd;
          if (Math.abs(x) < 1.8 || Math.abs(x) > HW(z) - 3.2 || z > 20.5) continue;
          q.setFromAxisAngle(UP, a);
          desks.push(new T.Matrix4().compose(v(x, y + 0.36, z), q, one));
          tops.push(new T.Matrix4().compose(v(x, y + 0.745, z), q, one));
          plates.push(new T.Matrix4().compose(v(Math.sin(a) * (rd - 0.18), y + 0.84, CZ + Math.cos(a) * (rd - 0.18)), q, one));
          for (const [dr, bg] of [[0.72, true], [1.35, false]] as const) for (const s of [-0.62, 0, 0.62]) {
            const aa = a + s / (r0 + dr), cx = Math.sin(aa) * (r0 + dr), cz = CZ + Math.cos(aa) * (r0 + dr);
            q.setFromAxisAngle(UP, aa + PI);
            chairs.push(new T.Matrix4().compose(v(cx, y, cz), q, one)); chairC.push(bg ? beige : blueSeat);
            seatSpots.push({ p: v(cx, y, cz), a: aa + PI, beige: bg });
          }
        }
      }
    }
    k.instances(new T.BoxGeometry(2.0, 0.72, 0.5), deskWood, desks);
    k.instances(new T.BoxGeometry(2.04, 0.03, 0.56), green, tops);
    k.instances(new T.BoxGeometry(0.34, 0.12, 0.04), k.flat(0xf2f2ee, 0, 0.5), plates);
    {
      const cg = merge([bx(0.5, 0.1, 0.48, 0, 0.45, 0), bx(0.5, 0.55, 0.08, 0, 0.75, 0.22), bx(0.08, 0.4, 0.08, 0, 0.2, 0)]);
      const cm = k.instances(cg, new T.MeshStandardMaterial({ roughness: 0.8 }), chairs);
      k.ticks.push(() => { cm.castShadow = false; });
      const c = new T.Color(); chairC.forEach((h, i) => cm.setColorAt(i, c.set(h))); if (cm.instanceColor) cm.instanceColor.needsUpdate = true;
    }
    /* the delegates: most beige chairs taken, some alternates behind; they shift and lean while the speaker talks */
    const people: { p: T.Vector3; a: number; ph: number }[] = [];
    { const rnd = X.mulberry(193); for (const s of seatSpots) if (rnd() < (s.beige ? 0.62 : 0.22)) people.push({ p: s.p, a: s.a + PI, ph: rnd() * 6.3 }); }
    const crowdM = k.instances(seatedGeo(), new T.MeshStandardMaterial({ roughness: 0.85 }), people.map(() => new T.Matrix4()));
    crowdM.frustumCulled = false; k.ticks.push(() => { crowdM.castShadow = false; });
    {
      const c = new T.Color(), rnd = X.mulberry(51), pal = [0x1c1f26, 0x23262e, 0x2e3440, 0x3a3a42, 0x1a2a44, 0x6a2a2a, 0xe8e0d0, 0x2a4a3a, 0x8a6a3a, 0x14161a, 0xd8a03a, 0x3a5a8a];
      people.forEach((_, i) => crowdM.setColorAt(i, c.set(pal[Math.floor(rnd() * pal.length)])));
      if (crowdM.instanceColor) crowdM.instanceColor.needsUpdate = true;
      const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), s = new T.Vector3(1, 1, 1), e = new T.Euler();
      const place = (t: number) => { people.forEach((o, i) => { const lean = 0.08 * Math.sin(t * 0.35 + o.ph) + (Math.sin(t * 0.13 + o.ph * 3) > 0.93 ? 0.25 : 0); e.set(lean, o.a + 0.15 * Math.sin(t * 0.21 + o.ph), 0); q.setFromEuler(e); p.copy(o.p); p.y += 0.02; m.compose(p, q, s); crowdM.setMatrixAt(i, m); }); crowdM.instanceMatrix.needsUpdate = true; };
      place(0); if (!R) k.ticks.push(place);
    }
    /* ---- the walls: fluted wood below, the booths and the murals above, splayed in plan ---- */
    const splay = Math.atan2(3, 50), WL = Math.hypot(3, 50), WH = 23;
    for (const s of [-1, 1]) {
      const cx = s * 16.5;
      k.box(0.6, 9.6, WL, cx + s * 0.3, 4.8, 0, wood).rotation.y = s * splay;
      k.box(0.6, WH - 9.6, WL, cx + s * 0.5, 9.6 + (WH - 9.6) / 2, 0, upper).rotation.y = s * splay;
      k.box(0.3, 0.3, WL, cx + s * 0.05, 9.65, 0, goldDark).rotation.y = s * splay;
      for (let zz = Z0; zz < Z1; zz += 5) k.block(s > 0 ? HW(zz) - 0.2 : -40, s > 0 ? 40 : -HW(zz) + 0.2, zz, zz + 5);
    }
    /* points on a side wall, and its inward facing rotation */
    const onWall = (s: number, z: number, inset = 0) => v(s * (HW(z) - inset), 0, z);
    const wallRot = (s: number) => (s > 0 ? splay - PI / 2 : PI / 2 - splay);
    /* the interpreters' booths: two rows of lit glass along the back half of each side wall */
    const boothGlass = k.flat(0x14181c, 0.7, 0.12, { emissive: 0xffb870, emissiveIntensity: 0.09 }), mullion = k.flat(0x2a2620, 0.5, 0.5);
    for (const s of [-1, 1]) for (const y of [11.2, 14.0]) for (let z = 9; z < 24; z += 2.4) {
      const p = onWall(s, z + 1.2, 0.05);
      const gl = k.box(0.08, 1.7, 2.2, p.x, y, p.z, boothGlass); gl.rotation.y = s * splay;
      const mu = k.box(0.14, 1.9, 0.14, p.x, y, p.z - 1.15, mullion); mu.rotation.y = s * splay;
    }
    for (const s of [-1, 1]) for (const y of [10.2, 12.8, 15.4]) { const p = onWall(s, 16.2, 0.1); const ledge = k.box(0.5, 0.18, 15.8, p.x, y, p.z, goldDark); ledge.rotation.y = s * splay; }
    /* the two Leger murals, across the hall from each other */
    for (const [s, pal, seed] of [[-1, ['#e8722a', '#9a9a96', '#f4f2ec', '#d8581c', '#6e6e6a'], 11], [1, ['#2a5fb8', '#f2c81c', '#f6f4ee', '#1c3f8a', '#e8b010'], 12]] as const) {
      const p = onWall(s, -4, 0.08);
      const mm = k.mesh(new T.PlaneGeometry(14, 9.2), new T.MeshStandardMaterial({ map: legerTexture([...pal], seed), roughness: 0.85 }), p.x, 14.4, p.z, true);
      mm.rotation.y = wallRot(s);
    }
    /* the voting boards near the front, a light for every name */
    const vbN = 2 * 4 * 50, vbM: T.Matrix4[] = [];
    for (const s of [-1, 1]) {
      const p = onWall(s, -19, 0.08);
      const bd = k.box(0.1, 6.2, 5.4, p.x, 7.2, p.z, dark); bd.rotation.y = s * splay;
      k.sign('VOTING', 2.2, 0.5, p.x - s * 0.12, 10.6, p.z, '#16181c', '#e8dcc0', 160, s > 0 ? -PI / 2 : PI / 2);
      for (let col = 0; col < 4; col++) for (let row = 0; row < 50; row++) {
        const z = p.z - 2.3 + col * 1.25 + 0.5, y = 4.6 + row * 0.108;
        const mm = new T.Matrix4().compose(v(p.x - s * 0.08, y, z + (p.x - s * 0.08 - p.x) * 0), new T.Quaternion(), v(0.04, 0.06, 0.18));
        vbM.push(mm);
      }
    }
    const vb = k.instances(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial({ color: 0xffffff }), vbM);
    vb.frustumCulled = false;
    { const c = new T.Color(), rnd = X.mulberry(9); const set = (t: number) => { const ph = Math.floor(t / 7); const r2 = X.mulberry(ph * 13 + 1); for (let i = 0; i < vbN; i++) { const x = r2(); vb.setColorAt(i, c.set(x < 0.62 ? 0x2aff6a : x < 0.8 ? 0xff3a2a : x < 0.9 ? 0xffd23a : 0x202420)); } if (vb.instanceColor) vb.instanceColor.needsUpdate = true; }; set(0); void rnd; if (!R) k.ticks.push(set); }
    /* the back wall, with the entrance doors at the ends of the back aisle */
    k.box(40, 9.6, 0.6, 0, 4.8, Z1 + 0.3, wood); k.box(40, WH - 9.6, 0.6, 0, 9.6 + (WH - 9.6) / 2, Z1 + 0.5, upper);
    for (let x = -12; x <= 12; x += 3) { const gl = k.box(2.6, 1.7, 0.08, x, 13.2, Z1 + 0.1, boothGlass); void gl; }
    for (const x of [-7.2, 7.2]) k.box(2.4, 3.2, 0.1, x, TOP + 1.6, Z1 - 0.02, k.flat(0x4a3424, 0.2, 0.5));
    k.block(-40, 40, Z1 - 0.1, 40);
    /* ---- the front: the gold wall, the emblem, the green rostrum ---- */
    k.box(40, WH, 0.6, 0, WH / 2, Z0 - 0.6, wood);
    k.box(18.5, 21, 0.4, 0, 10.5, Z0 - 0.15, gold);
    for (let x = -9; x <= 9.01; x += 0.75) k.box(0.1, 21, 0.14, x, 10.5, Z0 + 0.1, goldDark);
    for (const x of [-9.4, 9.4]) k.box(0.6, 21, 0.9, x, 10.5, Z0 + 0.1, goldDark);
    {
      const em = k.mesh(new T.PlaneGeometry(6.4, 6.4), new T.MeshStandardMaterial({ map: emblemTexture(), transparent: true, roughness: 0.45, metalness: 0.4, color: 0xf4e4c0 }), 0, 12.4, Z0 + 0.2, true);
      void em;
      /* the shields round the emblem, where the disc lights were before they were covered in gold leaf */
      for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2, d = k.cyl(0.46, 0.12, Math.cos(a) * 4.6, 12.4 + Math.sin(a) * 4.6, Z0 + 0.22, goldDark, 0.46, 16); d.rotation.x = PI / 2; }
    }
    k.box(40, 0.6, 12, 0, 0.3 - 0.3, Z0 + 3, carpet);
    /* the dais: the President's desk up top between the Secretary General and the Under Secretary General, the lectern below */
    k.box(18, 2.4, 5.5, 0, 1.2, Z0 + 2.8, serpDark);
    k.box(12, 1.1, 1.3, 0, 2.95, Z0 + 3.9, serp);
    k.box(12.3, 0.08, 1.5, 0, 3.55, Z0 + 3.9, k.flat(0x1a3a2a, 0.2, 0.2));
    for (const x of [-3.2, 0, 3.2]) { k.box(0.8, 1.6, 0.2, x, 3.3, Z0 + 2.3, k.flat(0x3a2418, 0.1, 0.6)); figure(k, x, 2.4, Z0 + 2.9, 0x1c1f26, { h: 0.85 }); }
    k.box(11, 1.4, 2.2, 0, 0.7, Z0 + 6.4, serp);
    k.box(3.4, 1.4, 1.5, 0, 2.1, Z0 + 7.2, serp);
    k.box(3.6, 0.08, 1.7, 0, 2.84, Z0 + 7.2, k.flat(0x1a3a2a, 0.2, 0.2));
    for (const x of [-1.3, 1.3]) { k.cyl(0.02, 0.6, x * 0.3, 3.1, Z0 + 7.5, k.flat(0x222222, 0.8, 0.3)); }
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) k.box(1.4, 0.24, 0.4, s * 7.5, 0.12 + i * 0.24, Z0 + 5.6 - i * 0.4, serpDark);
    k.block(-9.4, 9.4, Z0 - 1, Z0 + 8.2);
    /* the speaker at the lectern, turning to the hall and working with one hand */
    const spk = new T.Group(); spk.position.set(0, 1.4, Z0 + 6.3); k.add(spk);
    { const b = new T.Mesh(new T.CapsuleGeometry(0.22, 0.8, 3, 8), k.flat(0x1a1c22, 0, 0.8)); b.position.y = 0.62; spk.add(b); const h = new T.Mesh(new T.SphereGeometry(0.13, 10, 8), k.flat(0x8d5a3b, 0, 0.7)); h.position.y = 1.35; spk.add(h); }
    const spArm = new T.Group(); spArm.position.set(0.28, 1.12, 0); spk.add(spArm);
    { const a = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.55, 6), k.flat(0x1a1c22, 0, 0.8)); a.position.y = -0.26; spArm.add(a); }
    if (!R) k.ticks.push((t) => { spk.rotation.y = 0.35 * Math.sin(t * 0.23); spArm.rotation.x = -0.6 - 0.5 * Math.max(0, Math.sin(t * 1.7)) * (Math.sin(t * 0.4) > 0 ? 1 : 0.3); spArm.rotation.z = 0.2 * Math.sin(t * 1.1); });
    /* ---- the ceiling and the shallow dome with its ring of lights ---- */
    const DR = 17, DZ = -2, CY = 20.5;
    { const ring = new T.RingGeometry(DR, 60, 64, 1); ring.rotateX(PI / 2); k.mesh(ring, ceiling, 0, CY, DZ); }
    { const cap = new T.SphereGeometry(40, 64, 10, 0, PI * 2, 0, Math.asin(DR / 40)); k.mesh(cap, dome, 0, CY + 4.2 - 40, DZ); }
    k.torus(DR - 0.2, 0.28, 0, CY - 0.1, DZ, goldDark, 96).rotation.x = PI / 2;
    const ringLights: T.Matrix4[] = [];
    for (let i = 0; i < 72; i++) { const a = (i / 72) * PI * 2; ringLights.push(new T.Matrix4().compose(v(Math.cos(a) * (DR - 1.1), CY - 0.12, DZ + Math.sin(a) * (DR - 1.1)), new T.Quaternion(), v(1, 1, 1))); }
    for (let i = 0; i < 40; i++) { const a = (i / 40) * PI * 2; ringLights.push(new T.Matrix4().compose(v(Math.cos(a) * 9, CY + 2.9, DZ + Math.sin(a) * 9), new T.Quaternion(), v(0.8, 1, 0.8))); }
    k.instances(new T.CylinderGeometry(0.32, 0.32, 0.08, 12), k.glow(0xfff2d4), ringLights);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2; k.point(Math.cos(a) * 11, 17, DZ + Math.sin(a) * 11, 0xffe8c8, 140, 32); }
    k.spot(0, 18, Z0 + 16, 0, 11, Z0, 0xfff0d0, 160, 0.5, 0.7, 45);
    k.spot(0, 14, Z0 + 20, 0, 2.5, Z0 + 4, 0xfff4e0, 260, 0.35, 0.5, 40);
    k.point(0, 6, 8, 0xffe4c0, 120, 30); k.point(-12, 6, 0, 0xffe4c0, 60, 20); k.point(12, 6, 0, 0xffe4c0, 60, 20); k.point(0, 10, 20, 0xffe4c0, 80, 26);
    /* staff and delegates on the move: down the centre aisle, across the well, round the back */
    if (!R) {
      k.crowd([v(0, TOP, 22.5), v(0, 3.2, 5), v(0, 0, -12), v(8, 0, -14.5), v(12, 0, -12)], 7, { seed: 151, speed: 0.55, spread: 0.6, colors: [0x1c1f26, 0x2e3440, 0xe8e0d0, 0x6a2a2a] });
      k.crowd([v(-16, TOP, 22.5), v(16, TOP, 22.5)], 6, { seed: 152, speed: 0.6, spread: 1.2, colors: [0x1c1f26, 0x23262e, 0xd8a03a, 0x3a5a8a] });
    }
    /* the delegate sections are the seats: the visitor walks the aisles */
    for (const s of [-1, 1]) for (let z = -12.4; z < 18.6; z += 6.2) { const w = HW(z) - 3.3; k.block(s > 0 ? 1.7 : -w, s > 0 ? w : -1.7, z, z + 6.2); }
    /* ---- the works ---- */
    const mounts: Mount[] = [];
    for (const s of [-1, 1]) for (const z of [-15.3, -9.5, -3.5, 2.5, 8.5, 14.5, 20.2]) {
      const p = onWall(s, z, 0.02), tg = onWall(s, z, 2.6), fy = Math.max(floorY(p.x, p.z), floorY(tg.x, tg.z)) + 2.3;
      mounts.push({ position: v(p.x, fy, p.z), rotation: wallRot(s), target: v(tg.x, fy, tg.z), width: 2.4, height: 1.65, style: 'gilt', wash: true });
    }
    for (const x of [-15, -10.5, 10.5, 15]) mounts.push({ position: v(x, TOP + 2.4, Z1 - 0.02), rotation: PI, target: v(x, TOP + 2.4, Z1 - 2.6), width: 2.4, height: 1.65, style: 'gilt', wash: true });
    k.censusWall({ x: 0, y: TOP + 4.1, z: Z1 - 0.04, rotY: PI, cols: 14, rows: 4, tile: 0.62, gap: 0.05, start: ctx.wallStart(5151, 56), pieces: ctx.all, backing: wood });
    /* ---- what the hall knows ---- */
    const src = { name: 'United Nations General Assembly Building, Wikipedia', url: 'https://en.wikipedia.org/wiki/United_Nations_General_Assembly_Building' };
    k.egg(v(0, 12.4, Z0 + 1), { id: 'gold-wall', title: 'Gold over the lights', text: 'Behind the rostrum the UN emblem sits on a gold background. It was once ringed with disc shaped lights, but reporters could not get good photographs of the speakers against them, so the lights were covered with gold leaf.', clue: 'Look at the wall behind the speaker, and the round shapes around the emblem.', source: src }, { r: 4 });
    k.egg(v(0, 3.2, Z0 + 3.9), { id: 'serpentinite', title: 'The green desk', text: 'The rostrum is a green serpentinite desk for the President of the General Assembly, the Secretary General and the Under Secretary General.', clue: 'The stone is green, and three people sit behind it.', source: src }, { r: 3 });
    k.egg(v(-10, 14.4, -4), { id: 'leger-murals', title: 'Two murals by Leger', text: 'Fernand Leger designed the two murals on the side walls, each 30 feet high: the one on the left in orange, grey and white, the one on the right in blue, yellow and white. They were presented by the American Association for the United Nations on behalf of an anonymous donor.', clue: 'Two walls answer each other across the hall in colour.', source: src }, { r: 5 });
    k.egg(v(8, 2.5, 2), { id: 'six-seats', title: 'Six seats each', text: 'Each delegation has six seats in the hall: three beige chairs for full delegates and three blue seats for alternates. The delegations in the first row are drawn at random every year, and the rest follow in English alphabetical order. The hall seats 1,800.', clue: 'Count the chairs at any one desk, and look at their colours.', source: src }, { r: 3 });
    k.egg(v(0, CY + 2, DZ), { id: 'dedicated-1952', title: 'October 1952', year: '1952', text: 'The building was designed by the UN Headquarters Board of Design, which included Wallace Harrison, Oscar Niemeyer and Le Corbusier. It was dedicated on October 10, 1952, and the first session met here four days later. The hall is 165 feet long, 115 feet wide and 75 feet tall under its shallow dome.', clue: 'Look up at the dome.', source: src }, { r: 6 });
    return { mounts, spawn: v(0, TOP + 3, 22.4), look: v(0, 10, Z0), eye: 3, floorY, bounds: [-17.8, 17.8, -16.5, 24.4], style: 'gilt' };
  },
};

/* ---------------- 152 THE YARD IN OWEGO ---------------- */
export const weitsmanyard: RoomDef = {
  id: 'weitsmanyard',
  name: 'The yard in Owego',
  area: 'UPSTATE SHREDDING / OWEGO, NEW YORK',
  mood: 'Summer noon, the shredder running',
  color: '#f0b41c',
  description: 'Seventeen acres of sandy yard in the Tioga County Industrial Park, in a valley of wooded ridges three hours up from the city: the place a great deal of New York\'s scrap steel comes to be shredded and sent back out. A gift room for Adam Weitsman, who opened the yard in 1997 and collects MLow. The New Yorkers hang where a yard can carry them: on steel plates bolted to the canopy columns, on plate stood on end in the yard, on the scale house and on the flanks of the parked trailers.',
  signatures: 'The long blue canopy and its banner, the mountain of crushed cars under it, yellow material handlers with orange peel grapples, the infeed conveyor climbing to the Mega Shredder and its steam, blue radial stackers pouring frag into dark cones, the Ferrous Downstream System, green Macks with tipping trailers, a hydraulic tipper, the scale house, rail gondolas, and the ridges of the Southern Tier all round.',
  build(k, ctx) {
    k.sky({ top: 0x2c6fd0, horizon: 0xb4d0ec, ground: 0x7a6a52, fog: 0.0012, sun: { az: 2.6, el: 0.95, color: 0xfff6e2, size: 8 }, env: 0.8 });
    k.hemi(0xd6e6ff, 0x8a7458, 1.25);
    k.sun(0xfff2dc, 2.7, 70, 120, 80, true, 95);
    const R = ctx.reduced;
    /* ---- surfaces ---- */
    const dn = tileNoise(11, 16), dn2 = tileNoise(12, 64);
    const dirtS = canvasSurface(512, (u, v) => {
      const a = dn(u * 16, v * 16), b = dn2(u * 64, v * 64), track = Math.abs(Math.sin((u + 0.05 * dn(v * 16, 3)) * PI * 6)) > 0.985 ? 0.86 : 1;
      const s = (0.8 + a * 0.3 + (b - 0.5) * 0.2) * track, grit = b > 0.8 ? 0.7 : 1;
      return [168 * s * grit, 140 * s * grit, 104 * s * grit];
    });
    const fragGroundS = canvasSurface(256, (u, v) => { const a = dn(u * 16, v * 16), b = dn2(u * 64, v * 64), s = 0.6 + a * 0.3 + b * 0.3; return [104 * s, 94 * s, 82 * s]; });
    const ribs = (tint: number) => { const [r, g, b] = X.hex(tint); return canvasSurface(256, (u, v) => { const s = 0.78 + 0.22 * Math.abs(Math.sin(u * PI * 16)) + (dn(u * 16, v * 16) - 0.5) * 0.08 - (v > 0.97 ? 0.2 : 0); return [r * s, g * s, b * s]; }); };
    const dirt = k.pbr('wyDirt', dirtS, 0.06, { roughness: 1 }), fragGround = k.pbr('wyFragG', fragGroundS, 0.12, { roughness: 1 });
    const greyClad = k.pbr('wyGrey', ribs(0xb3b7ba), 0.25, { roughness: 0.6, metalness: 0.3 }), blueClad = k.pbr('wyBlueC', ribs(0x2f63a8), 0.25, { roughness: 0.55, metalness: 0.3 });
    const concrete = k.pbr('wyConc', X.concrete(0xa8a398, 72), 0.3), asphalt = k.pbr('wyAsph', X.asphalt(0x3a3b3c), 0.15);
    const yellow = k.flat(0xf1b407, 0.25, 0.5), cat = k.flat(0xe0a511, 0.25, 0.55), white = k.flat(0xf0f0ea, 0.2, 0.5), glassD = k.flat(0x33424f, 0.85, 0.1),
      dark = k.flat(0x2e3033, 0.5, 0.6), tyre = k.flat(0x161616, 0, 0.92), grab = k.flat(0x5a4c40, 0.7, 0.55), blue = k.flat(0x2a62ad, 0.35, 0.5),
      blueDeep = k.flat(0x1d4c8f, 0.35, 0.5), rail = k.flat(0xf2c200, 0.2, 0.5), mack = k.flat(0x1e4b37, 0.45, 0.4), chrome = k.flat(0xd4d8dc, 1, 0.22),
      rust = k.flat(0x6b3b24, 0.35, 0.85), rust2 = k.flat(0x57301e, 0.35, 0.85), tub = k.flat(0x1a1d22, 0.5, 0.5), belt = k.flat(0x1c1c1c, 0, 0.9), orange = k.flat(0xe0671d, 0.2, 0.6);
    const cars = photo(k, 'cars.jpg', 1 / 10), carsHeap = photo(k, 'cars.jpg', 1 / 8, { color: 0x8a8682 }), pile = photo(k, 'pile.jpg', 1 / 6, { crop: [0, 0, 1, 0.66], mirror: true, color: 0x8e8a86 }),
      frag = photo(k, 'frag.jpg', 1 / 3, { crop: [0, 0.1, 0.85, 1], mirror: true, color: 0x7a7672 }), carsI = photo(k, 'cars.jpg', 0, { rough: 0.6 }), cans = photo(k, 'cans.jpg', 1 / 4, { mirror: true }), briq = photo(k, 'briquettes.jpg', 1 / 3, { mirror: true });

    /* ---- the valley: yard floor, fields, the wooded ridges of the Southern Tier ---- */
    k.cyl(175, 0.3, 0, -0.15, 0, dirt, 175, 64);
    k.box(150, 0.32, 150, 0, -0.14, 0, dirt);
    k.box(12, 0.34, 170, 23, -0.13, 120, asphalt);
    {
      /* the ring of hills: low fields near the yard, ridges rising to a hundred metres and more, lower where the valley runs east and west */
      const n1 = tileNoise(21, 32), RS = 64, AS = 180, r0 = 150, r1 = 680;
      const pos: number[] = [], col: number[] = [], idx: number[] = [];
      const hAt = (r: number, a: number) => {
        const ridge = 60 + 70 * Math.pow(Math.abs(Math.sin(a)), 1.2) + 45 * (n1(a * 5.1, 3) - 0.5) + 25 * (n1(a * 13, 9) - 0.5);
        const rise = smooth(Math.min(1, Math.max(0, (r - 190) / 260)));
        return -0.2 + rise * ridge * (1 + 0.15 * (n1(a * 20, r * 0.02) - 0.5)) + (r > 190 ? 1.5 * n1(a * 40, r * 0.05) : 0);
      };
      const crowns = (() => {
        const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d')!, rr = X.mulberry(5);
        g.fillStyle = '#6e6e6e'; g.fillRect(0, 0, S, S);
        for (let i = 0; i < 1400; i++) {
          const x = rr() * S, y = rr() * S, r = 5 + rr() * 11, l = 90 + rr() * 120;
          for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
            const gr = g.createRadialGradient(x + ox - r * 0.3, y + oy - r * 0.3, 1, x + ox, y + oy, r);
            gr.addColorStop(0, `rgb(${l + 40},${l + 40},${l + 40})`); gr.addColorStop(0.7, `rgb(${l},${l},${l})`); gr.addColorStop(1, 'rgba(40,40,40,0)');
            g.fillStyle = gr; g.beginPath(); g.arc(x + ox, y + oy, r, 0, PI * 2); g.fill();
          }
        }
        const t = new T.CanvasTexture(cv); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8; return t;
      })();
      const c = new T.Color();
      for (let i = 0; i <= RS; i++) for (let j = 0; j < AS; j++) {
        const r = r0 + (r1 - r0) * Math.pow(i / RS, 1.35), a = (j / AS) * PI * 2, y = hAt(r, a);
        pos.push(Math.cos(a) * r, y, Math.sin(a) * r);
        const f = r < 200 ? 0 : 1, nn = n1(a * 30, r * 0.03);
        c.setHex(f ? 0x4a8a2c : 0x8aa85a).offsetHSL((nn - 0.5) * 0.03, 0, (nn - 0.5) * 0.08);
        col.push(c.r, c.g, c.b);
      }
      for (let i = 0; i < RS; i++) for (let j = 0; j < AS; j++) { const a = i * AS + j, b = i * AS + ((j + 1) % AS), c2 = (i + 1) * AS + j, d = (i + 1) * AS + ((j + 1) % AS); idx.push(a, b, c2, b, d, c2); }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
      { const tm2 = new T.MeshLambertMaterial({ vertexColors: true, map: crowns }); tm2.userData.density = 1 / 34; const tmesh = k.mesh(g, tm2); void tmesh; }
      /* the woods: thousands of leafy blobs on the slopes and a tree line round the yard */
      const rnd = X.mulberry(1997), tm: T.Matrix4[] = [], tc: number[] = [];
      const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), s = new T.Vector3();
      const put = (x: number, z: number, y: number, sz: number) => { q.setFromAxisAngle(UP, rnd() * 6); s.set(sz * (0.9 + rnd() * 0.4), sz * (0.8 + rnd() * 0.5), sz * (0.9 + rnd() * 0.4)); p.set(x, y + sz * 0.55, z); tm.push(new T.Matrix4().compose(p, q, s)); tc.push([0x2c5a14, 0x366a1a, 0x417a22, 0x24500f, 0x4d8426, 0x305e17][Math.floor(rnd() * 6)]); };
      for (let i = 0; i < 3300; i++) { const a = rnd() * PI * 2, r = 200 + Math.pow(rnd(), 0.9) * 380; put(Math.cos(a) * r, Math.sin(a) * r, hAt(r, a) - 2.5, 4 + rnd() * 3.5); }
      for (let i = 0; i < 1300; i++) {
        const a = rnd() * PI * 2, r = 112 + rnd() * 85, x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (Math.abs(x - 23) < 12 && z > 60) continue;
        put(x, z, (r > r0 ? hAt(r, a) : 0) + rnd() * 4, 3 + rnd() * 3);
      }
      void m;
      const trees = k.instances(new T.IcosahedronGeometry(1, 0), new T.MeshLambertMaterial(), tm);
      const cc = new T.Color(); tc.forEach((h, i) => trees.setColorAt(i, cc.set(h))); if (trees.instanceColor) trees.instanceColor.needsUpdate = true;
      k.ticks.push(() => { trees.castShadow = false; });
      /* power poles along the road */
      for (let z = 50; z < 170; z += 30) { k.cyl(0.18, 11, 31, 5.5, z, rust2, 0.14, 6); k.box(2.6, 0.2, 0.2, 31, 10.4, z, rust2); }
    }

    /* darker ground where the machines work: oil, frag and wet dirt in soft patches */
    {
      const rnd = X.mulberry(303);
      for (const [x, z, r] of [[-22, -18, 9], [2, -16, 8], [20, -13, 7], [-50, -12, 7], [58, -2, 8], [34, -24, 6]] as const) {
        const g = new T.CircleGeometry(r, 28); const pa = g.attributes.position;
        for (let i = 1; i < pa.count; i++) { const f = 0.7 + rnd() * 0.5; pa.setXY(i, pa.getX(i) * f, pa.getY(i) * f); }
        g.rotateX(-PI / 2); k.mesh(g, fragGround, x, 0.025 + rnd() * 0.01, z);
      }
    }
    /* ---- the canopy: sixty metres of blue steel over the car mountain, the banner on its face ---- */
    const CX0 = -52, CX1 = 8, CZ0 = -52, CZF = -22.5, CH = 15.5;
    const colsX = [-52, -37, -22, -7, 8];
    for (const x of colsX) for (const z of [CZF, CZ0]) k.box(1.2, CH, 1.2, x, CH / 2, z, blue);
    k.box(CX1 - CX0 + 2, 3.2, 1.0, (CX0 + CX1) / 2, CH + 1.6, CZF, blue);
    k.box(CX1 - CX0 + 2, 1.6, 1.0, (CX0 + CX1) / 2, CH + 0.8, CZ0, blue);
    for (const x of colsX) k.box(1.0, 1.6, CZF - CZ0, x, CH + 0.8, (CZF + CZ0) / 2, blue);
    k.box(CX1 - CX0 + 3, 0.35, CZF - CZ0 + 2, (CX0 + CX1) / 2, CH + 3.35, (CZF + CZ0) / 2 - 0.5, k.flat(0x55595e, 0.5, 0.6));
    k.mesh(trussGeo(v(CX0, CH + 1.6, (CZF + CZ0) / 2), v(CX1, CH + 1.6, (CZF + CZ0) / 2), 0.1, 1.4, 2.5, 0.09, 0.05), blueDeep);
    { const bn = k.mesh(new T.PlaneGeometry(CX1 - CX0 + 1.6, 2.9), banner("EAST COAST'S LARGEST PRIVATELY HELD SCRAP METAL PROCESSOR", CX1 - CX0 + 1.6, 2.9, '#1f56a6', '#f4f6fa', { flag: true }), (CX0 + CX1) / 2, CH + 1.6, CZF + 0.52, true); bn.castShadow = false; }
    for (const x of [-44, -14, 2]) { k.box(0.5, 0.3, 0.6, x, CH + 3.35, CZF + 0.4, dark); }
    /* the car mountain under it and spilling west, and the stepped stacks of flattened cars at the east end */
    const M1 = heap(-26, -38, 30, 15, 12.5, 7, 0.45), M2 = heap(-62, -34, 16, 14, 8, 8, 0.4), M3 = heap(-40, -60, 26, 10, 9, 9, 0.4);
    k.mesh(M1.g, carsHeap); k.mesh(M2.g, pile); k.mesh(M3.g, carsHeap);
    {
      /* flattened cars, doors, drums and sheet strewn over the mountain so its skyline is jagged */
      const rnd = X.mulberry(77), jm: T.Matrix4[] = [], jc: number[] = [];
      const pal = [0xffffff, 0xe0e0e0, 0xc8c8c8, 0xd8c8b8, 0xb8c0d0, 0xa8a8a8, 0xf0e8e0];
      for (const [M, cx, cz, rx, rz, n] of [[M1, -26, -38, 30, 15, 520], [M2, -62, -34, 16, 14, 160], [M3, -40, -60, 26, 10, 140]] as const) for (let i = 0; i < n; i++) {
        const a = rnd() * PI * 2, d = Math.sqrt(rnd()) * 0.97, x = cx + Math.cos(a) * rx * d, z = cz + Math.sin(a) * rz * d, y = M.H(x, z);
        if (y <= 0.2) continue;
        const L = 1.2 + rnd() * 3.2;
        jm.push(new T.Matrix4().compose(v(x, y + 0.15, z), new T.Quaternion().setFromEuler(new T.Euler((rnd() - 0.5) * 1.6, rnd() * 6, (rnd() - 0.5) * 1.6)), v(L, 0.25 + rnd() * 0.7, L * (0.35 + rnd() * 0.4))));
        jc.push(pal[Math.floor(rnd() * pal.length)]);
      }
      const jk = k.instances(new T.BoxGeometry(1, 1, 1), carsI, jm);
      const cc = new T.Color(); jc.forEach((h, i) => jk.setColorAt(i, cc.set(h))); if (jk.instanceColor) jk.instanceColor.needsUpdate = true;
    }
    for (const [w, h, d, x, z] of [[15, 12, 16, -1, -44], [15, 9, 5, -1, -34], [15, 6, 4, -1, -29.5], [15, 3, 3, -1, -26]]) k.box(w, h, d, x, h / 2, z, cars);
    k.box(10, 5, 8, -52, 2.5, -52, cars); k.box(8, 4, 8, 16, 2, -50, cars);
    /* the push wall of concrete blocks between the columns, with loose scrap at its foot */
    for (let i = 0; i < 4; i++) { const x0 = colsX[i] + 0.6, x1 = colsX[i + 1] - 0.6; for (let row = 0; row < 3; row++) for (let x = x0 + (row % 2 ? 0.8 : 0); x < x1 - 0.2; x += 1.6) { const w = Math.min(1.56, x1 - x); if (w > 0.3) k.box(w, 0.78, 0.8, x + w / 2, 0.4 + row * 0.8, CZF - 1.2, concrete); } }
    {
      const rnd = X.mulberry(55), n = 260, lm: T.Matrix4[] = [], lc: number[] = [];
      for (let i = 0; i < n; i++) {
        const x = CX0 + rnd() * (CX1 - CX0), z = CZF - 2.0 - rnd() * 3, sz = 0.3 + rnd() * 0.7;
        lm.push(new T.Matrix4().compose(v(x, sz * 0.3, z), new T.Quaternion().setFromEuler(new T.Euler(rnd() * 3, rnd() * 3, rnd() * 3)), v(sz * (1 + rnd()), sz * 0.5, sz)));
        lc.push([0x6a6e72, 0x8a8f94, 0x5a3a26, 0x9a2a2a, 0x2a4a8a, 0xd8d8d0, 0x3a3a3a][Math.floor(rnd() * 7)]);
      }
      const junk = k.instances(new T.BoxGeometry(1, 1, 1), new T.MeshStandardMaterial({ roughness: 0.7, metalness: 0.4 }), lm);
      const c = new T.Color(); lc.forEach((h, i) => junk.setColorAt(i, c.set(h))); if (junk.instanceColor) junk.instanceColor.needsUpdate = true;
    }
    k.block(CX0 - 12, CX1 + 12, -80, CZF - 0.2);
    for (const x of colsX) k.keepOut.push({ x, z: CZF, r: 1.2 });

    /* ---- the shredder plant: infeed trough and conveyor, the Mega Shredder, its tower and sheds ---- */
    const IA = v(22, 1.4, -19), IB = v(43, 13.5, -35);
    k.box(3.6, 3.2, 12, 20.3, 1.6, -16, concrete).rotation.y = -0.92; k.box(3.6, 3.2, 12, 24.8, 1.6, -21.6, concrete).rotation.y = -0.92;
    {
      const d = IB.clone().sub(IA), L = d.length(), mid = IA.clone().add(IB).multiplyScalar(0.5), q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 0, 1), d.clone().normalize());
      const b = k.mesh(new T.BoxGeometry(2.6, 0.35, L), belt, mid.x, mid.y, mid.z); b.quaternion.copy(q);
      for (const s of [-1, 1]) { const sw = k.mesh(new T.BoxGeometry(0.2, 1.4, L), concrete, 0, 0, 0); const off = new T.Vector3(s * 1.4, 0.55, 0).applyQuaternion(q); sw.position.copy(mid).add(off); sw.quaternion.copy(q); }
      const tr = k.mesh(trussGeo(IA.clone().add(v(0, -1.2, 0)), IB.clone().add(v(0, -1.2, 0)), 2.8, 1.6, 2.4), blue); void tr;
      for (let i = 1; i < 4; i++) { const p = IA.clone().lerp(IB, i / 4); k.box(0.5, p.y - 1.5, 0.5, p.x - 1.4, (p.y - 1.5) / 2, p.z, blue); k.box(0.5, p.y - 1.5, 0.5, p.x + 1.4, (p.y - 1.5) / 2, p.z, blue); }
    }
    /* the shredder: concrete base, the dark housing and hood, the blue tower with yellow stairs, grey sheds */
    k.box(12, 5, 11, 47, 2.5, -39, concrete);
    k.box(9, 6, 8, 47, 8, -39, k.flat(0x3c3f44, 0.6, 0.5));
    { const hood = k.box(7, 3, 6, 45.5, 12.2, -37.5, k.flat(0x4a4e54, 0.6, 0.5)); hood.rotation.x = -0.25; }
    k.box(8, 3, 9, 47, 12.5, -41, greyClad);
    {
      const TX = 55.5, TZ = -45, TW = 7, TH = 24;
      const gs: T.BufferGeometry[] = [];
      for (const dx of [-1, 1]) for (const dz of [-1, 1]) gs.push(bx(0.45, TH, 0.45, TX + (dx * TW) / 2, TH / 2, TZ + (dz * TW) / 2));
      for (let y = 4; y <= TH; y += 4) { for (const dz of [-1, 1]) gs.push(bx(TW, 0.35, 0.35, TX, y, TZ + (dz * TW) / 2)); for (const dx of [-1, 1]) gs.push(bx(0.35, 0.35, TW, TX + (dx * TW) / 2, y, TZ)); gs.push(bx(TW, 0.2, TW, TX, y - 0.1, TZ)); }
      for (let y = 0; y < TH; y += 4) for (const dz of [-1, 1]) gs.push(rod(v(TX - TW / 2, y, TZ + (dz * TW) / 2), v(TX + TW / 2, y + 4, TZ + (dz * TW) / 2), 0.12));
      k.mesh(merge(gs), blue);
      k.box(TW - 1, 6, TW - 1, TX, TH - 3, TZ, blueClad);
      k.box(TW, 0.4, TW, TX, TH + 0.2, TZ, k.flat(0x55595e, 0.5, 0.6));
      /* switchback stairs and handrails in safety yellow */
      const ys: T.BufferGeometry[] = [];
      for (let f = 0; f < TH / 4; f++) {
        const y0 = f * 4, dir = f % 2 ? -1 : 1, x0 = TX - TW / 2 - 1.2, za = TZ - dir * 2.8, zb = TZ + dir * 2.8;
        ys.push(rod(v(x0, y0, za), v(x0, y0 + 4, zb), 0.12, 4));
        for (let s = 0; s < 12; s++) ys.push(bx(1.0, 0.06, 0.28, x0, y0 + (s + 0.5) * (4 / 12), za + (zb - za) * ((s + 0.5) / 12)));
        ys.push(rod(v(x0 - 0.5, y0 + 1.0, za), v(x0 - 0.5, y0 + 5.0, zb), 0.035, 4));
        ys.push(bx(1.4, 0.1, 1.6, x0, y0 + 4, zb));
      }
      for (let y = 4; y <= TH; y += 4) { for (const dz of [-1, 1]) ys.push(bx(TW + 0.4, 0.06, 0.06, TX, y + 1.05, TZ + dz * (TW / 2 + 0.2))); ys.push(bx(0.06, 0.06, TW + 0.4, TX + TW / 2 + 0.2, y + 1.05, TZ)); }
      k.mesh(merge(ys), rail);
    }
    k.box(18, 10, 10, 50, 5, -54, greyClad); k.box(18.6, 0.5, 10.6, 50, 10.2, -54, blueDeep);
    k.box(9, 7, 8, 38, 3.5, -47, greyClad);
    /* the hydraulic room, blue and white, with its sign */
    k.box(8, 3.4, 5, 36.5, 1.7, -41, white); k.box(8.2, 1.1, 5.2, 36.5, 2.9, -41, blue);
    k.sign('HYDRAULIC ROOM', 5.6, 0.7, 36.5, 2.9, -38.37, '#2a62ad', '#ffffff', 90, 0);
    k.box(1.1, 2.2, 0.08, 38.5, 1.1, -38.46, k.flat(0xdadcd8, 0.3, 0.5));
    k.block(16, 64, -70, -12.5);
    /* the output conveyor and two blue radial stackers pouring frag into dark cones */
    k.mesh(trussGeo(v(50, 1.2, -33), v(55, 4.2, -25), 1.6, 1.0, 2), blue);
    k.box(1.4, 0.2, 9.8, 52.5, 2.9, -29, belt).rotation.set(0.33, 0.56, 0);
    const C1 = { x: 66, z: -11, r: 11, h: 9.5 }, C2 = { x: 76, z: -33, r: 12, h: 10.5 }, C3 = { x: 30, z: -8, r: 5, h: 3.8 };
    for (const [c, seed] of [[C1, 3], [C2, 4], [C3, 5]] as const) {
      const g = new T.ConeGeometry(c.r, c.h, 40, 8, true), pa = g.attributes.position, rnd = X.mulberry(seed);
      for (let i = 0; i < pa.count; i++) { const y = pa.getY(i); if (y < c.h / 2 - 0.1) { const f = 1 + (rnd() - 0.5) * 0.08; pa.setXYZ(i, pa.getX(i) * f, y + (rnd() - 0.5) * 0.25, pa.getZ(i) * f); } }
      g.computeVertexNormals();
      k.mesh(g, frag, c.x, c.h / 2 - 0.1, c.z);
      k.cyl(c.r + 3, 0.04, c.x, 0.03, c.z, fragGround, c.r + 3, 32);
    }
    k.block(57, 90, -50, 0);
    const stackers: { g: T.Group; head: T.Object3D; base: number; amp: number; ph: number; cone: typeof C1 }[] = [];
    for (const [px, pz, cone, amp, ph] of [[54, -24, C1, 0.14, 0], [57, -31, C2, 0.1, 2]] as const) {
      const g = new T.Group(); g.position.set(px, 0, pz);
      const dx = cone.x - px, dz = cone.z - pz, L = Math.hypot(dx, dz) + 1.2, base = Math.atan2(dx, dz), hy = cone.h + 3;
      const tr = new T.Mesh(trussGeo(v(0, 1.2, 0), v(0, hy, L), 1.3, 1.1, 2.1), blue); g.add(tr);
      const bl = new T.Mesh(new T.BoxGeometry(0.9, 0.12, Math.hypot(L, hy - 1.2)), belt); bl.position.set(0, (hy + 1.2) / 2 + 0.6, L / 2); bl.rotation.x = -Math.atan2(hy - 1.2, L); g.add(bl);
      const legs = new T.Mesh(merge([rod(v(-1.4, 0, L * 0.55), v(0, hy * 0.58, L * 0.55), 0.14, 6), rod(v(1.4, 0, L * 0.55), v(0, hy * 0.58, L * 0.55), 0.14, 6), cyl(0.5, 0.4, -1.4, 0.4, L * 0.55, 'x', 10), cyl(0.5, 0.4, 1.4, 0.4, L * 0.55, 'x', 10), bx(1.8, 1.4, 1.8, 0, 0.7, 0)]), blueDeep); g.add(legs);
      const head = new T.Object3D(); head.position.set(0, hy + 0.2, L + 0.3); g.add(head);
      g.rotation.y = base; k.add(g);
      stackers.push({ g, head, base, amp, ph, cone });
    }

    /* ---- the Ferrous Downstream System, the dome, the sheds, the rail siding ---- */
    {
      const fx = 28, fz = -62, fw = 26, fd = 14, fh = 12;
      k.box(fw, fh, fd, fx, fh / 2, fz, greyClad);
      for (let x = fx - fw / 2; x <= fx + fw / 2 + 0.01; x += fw / 4) k.box(0.7, fh + 0.4, 0.7, x, (fh + 0.4) / 2, fz + fd / 2 + 0.2, blue);
      k.box(fw + 1, 2.2, 0.8, fx, fh + 0.3, fz + fd / 2 + 0.3, blue);
      k.sign('FERROUS DOWNSTREAM SYSTEM', fw - 3, 1.6, fx, fh + 0.3, fz + fd / 2 + 0.72, '#2a62ad', '#f4f6fa', 64, 0);
      k.box(10, 7, 0.3, fx - 5, 3.5, fz + fd / 2 + 0.1, k.flat(0x1c2026, 0.3, 0.8));
      k.box(fw + 2, 0.6, fd + 2, fx, fh + 1.5, fz, blueDeep);
      k.box(14, 8, 10, fx + 16, 4, fz - 6, blueClad);
      /* roll off boxes of cans and briquettes from the nonferrous line */
      for (const [x, m] of [[fx - 9, cans], [fx - 3, briq], [fx + 8, cans]] as const) { k.box(2.5, 1.6, 6.5, x, 0.8, fz + fd / 2 + 6, blue); k.box(2.3, 0.05, 6.3, x, 1.58, fz + fd / 2 + 6, m); }
    }
    /* the white storage dome, west */
    { const g = new T.CylinderGeometry(11, 11, 34, 28, 1, true, -PI / 2, PI); g.rotateX(PI / 2); g.rotateY(PI / 2); k.mesh(g, k.flat(0xf2f2ee, 0.05, 0.75, { side: T.DoubleSide }), -92, 0, -30); k.box(0.3, 3, 22, -75, 1.5, -30, dark); }
    /* rail siding along the east edge with a line of gondolas */
    k.box(4, 0.3, 240, 84, 0.0, -20, k.flat(0x5a5048, 0, 1));
    for (const dx of [-0.72, 0.72]) k.box(0.1, 0.15, 240, 84 + dx, 0.22, -20, k.flat(0x6a625a, 0.8, 0.5));
    for (let z = -95; z < 60; z += 16.5) {
      k.box(3.2, 3.1, 15.4, 84, 2.35, z, z % 2 ? rust : rust2);
      k.box(2.9, 0.1, 15.1, 84, 3.6, z, frag);
      for (const dz of [-5.5, 5.5]) k.box(2.6, 0.6, 2.4, 84, 0.55, z + dz, dark);
      for (let r = -6; r <= 6; r += 2) k.box(3.3, 3.0, 0.14, 84, 2.35, z + r, rust2);
    }
    /* the blue offices by the gate and the main office to the south west */
    k.box(20, 7, 8, -40, 3.5, 37, blueClad); k.box(20.4, 0.5, 8.4, -40, 7.2, 37, k.flat(0xe8e8e2, 0.2, 0.6));
    for (let x = -48; x <= -32; x += 4) k.box(2.2, 1.4, 0.1, x, 5.2, 41.02, glassD);
    k.box(12, 4, 7, 60, 2, 34, blueClad); k.box(12.3, 0.4, 7.3, 60, 4.2, 34, white);
    k.block(-50.5, -29.5, 32.8, 44); k.block(53.5, 66.5, 30, 38);

    /* ---- the scale house and the truck scale with its yellow bollards ---- */
    k.box(4.6, 0.3, 18, 24, 0.12, 22, k.pbr('wyScale', X.steel(0x5a5e62, true, 5), 0.5, { metalness: 0.6, roughness: 0.5 }));
    const SH = { x: 31, z: 25 };
    k.box(6, 3.8, 10, SH.x, 1.9, SH.z, blueClad); k.box(6.4, 0.4, 10.4, SH.x, 3.95, SH.z, white);
    k.box(0.1, 1.2, 2.2, SH.x - 3.02, 2.3, SH.z - 3.9, glassD);
    k.block(SH.x - 3.2, SH.x + 3.2, SH.z - 5.2, SH.z + 5.2);
    for (const z of [13, 31]) for (const x of [20.6, 27.4]) {
      const gs = [bx(0.3, 3.2, 0.3, x - 0.6, 1.6, z), bx(0.3, 3.2, 0.3, x + 0.6, 1.6, z), bx(1.5, 0.3, 0.3, x, 3.1, z), bx(1.5, 0.3, 0.3, x, 1.6, z)];
      k.mesh(merge(gs), rail); k.keepOut.push({ x, z, r: 0.9 });
    }
    k.box(2.4, 0.08, 0.3, 24, 0.3, 12.8, rail);

    /* ---- trucks: the green Mack and the long dark tipping trailer, printed ---- */
    const trailerSide = (() => {
      const W = 2048, H = 400, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d')!;
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#20252c'); gr.addColorStop(1, '#0d1014'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(60,90,70,0.55)'; for (let i = 0; i < 40; i++) g.fillRect(560 + i * 34, 190 + Math.sin(i) * 20, 26, 120);
      for (let x = 0; x < W; x += 205) { g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(x, 0, 10, H); }
      g.fillStyle = '#f2f2f2'; g.font = '700 62px Georgia, serif'; g.textAlign = 'center'; g.fillText("THE EAST COAST'S LARGEST PRIVATELY HELD SCRAP METAL PROCESSOR", W / 2 + 120, 62, W * 0.78);
      g.font = '700 44px Helvetica Neue, Arial, sans-serif'; g.fillText('UPSTATESHREDDING.COM', W / 2 + 120, 384);
      g.fillStyle = '#e8e8e8'; g.font = '700 54px Georgia, serif'; g.fillText('UPSTATE', 190, 230); g.fillText('SHREDDING', 190, 290);
      g.beginPath(); g.arc(190, 130, 48, 0, PI * 2); g.fillStyle = '#2a62ad'; g.fill();
      const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
      return new T.MeshStandardMaterial({ map: t, roughness: 0.5, metalness: 0.3 });
    })();
    /* one trailer, nose at +z: a tub on a chassis with tandem axles */
    const trailerGeo = () => {
      const tubG = new T.CylinderGeometry(1.35, 1.35, 12.5, 20, 1, false, PI / 2, PI); tubG.rotateX(PI / 2); tubG.rotateZ(PI); tubG.translate(0, 2.9, 0);
      return { tub: merge([tubG, bx(2.7, 1.4, 12.5, 0, 3.55, 0), bx(2.8, 0.25, 0.3, 0, 4.3, 6.2), bx(2.8, 1.6, 0.25, 0, 3.4, -6.3)]), chassis: merge([bx(0.9, 0.35, 12, 0, 1.25, 0), bx(0.12, 1.2, 0.12, -0.8, 0.6, 4.4), bx(0.12, 1.2, 0.12, 0.8, 0.6, 4.4), bx(2.5, 0.25, 0.6, 0, 1.2, -4.6)]), wheels: merge([cyl(0.52, 2.5, 0, 0.52, -4.1, 'x', 16), cyl(0.52, 2.5, 0, 0.52, -5.3, 'x', 16)]) };
    };
    const TG = trailerGeo();
    const sidePlane = (g: T.Object3D, x: number) => { const p = new T.Mesh(new T.PlaneGeometry(12.4, 2.6), trailerSide); p.position.set(x, 3.25, 0); p.rotation.y = x > 0 ? PI / 2 : -PI / 2; g.add(p); };
    const mkTrailer = () => { const g = new T.Group(); g.add(new T.Mesh(TG.tub, tub)); g.add(new T.Mesh(TG.chassis, dark)); g.add(new T.Mesh(TG.wheels, tyre)); sidePlane(g, 1.37); sidePlane(g, -1.37); return g; };
    const cabGeo = { body: merge([bx(2.5, 2.1, 2.2, 0, 2.7, 0.2), bx(2.3, 1.2, 1.9, 0, 1.9, 2.2), bx(2.5, 0.9, 0.5, 0, 1.6, 3.3)]), frame: merge([bx(1.0, 0.4, 6, 0, 1.0, -0.5), bx(2.6, 0.3, 0.3, 0, 1.05, 3.5), bx(1.6, 0.25, 1.6, 0, 1.3, -2.6)]), wheels: merge([cyl(0.52, 2.4, 0, 0.52, 2.3, 'x', 16), cyl(0.52, 2.5, 0, 0.52, -2.0, 'x', 16), cyl(0.52, 2.5, 0, 0.52, -3.2, 'x', 16)]), chrome: merge([cyl(0.1, 2.6, 1.1, 3.3, -0.95), cyl(0.1, 2.6, -1.1, 3.3, -0.95), cyl(0.3, 1.0, 1.3, 1.0, 0.8, 'z', 10), bx(1.9, 0.9, 0.08, 0, 1.9, 3.56)]), glass: merge([bx(2.3, 0.8, 0.06, 0, 3.25, 1.32), bx(0.06, 0.8, 1.2, 1.27, 3.25, 0.6), bx(0.06, 0.8, 1.2, -1.27, 3.25, 0.6)]) };
    const mkTractor = () => { const g = new T.Group(); g.add(new T.Mesh(cabGeo.body, mack)); g.add(new T.Mesh(cabGeo.frame, dark)); g.add(new T.Mesh(cabGeo.wheels, tyre)); g.add(new T.Mesh(cabGeo.chrome, chrome)); g.add(new T.Mesh(cabGeo.glass, glassD)); const bea = new T.Mesh(new T.BoxGeometry(0.3, 0.15, 0.2), orange); bea.position.set(0, 3.85, 0.9); g.add(bea); return g; };
    /* two parked trailers on their landing legs: their flanks carry works */
    const parked: { x: number; z: number }[] = [{ x: 40, z: 13 }, { x: 49, z: 14 }];
    for (const p of parked) { const t = mkTrailer(); t.position.set(p.x, 0, p.z); bake(k, t); k.block(p.x - 1.5, p.x + 1.5, p.z - 6.4, p.z + 6.4); }
    { const t = mkTractor(); t.position.set(49, 0, 25); t.rotation.y = 0.2; bake(k, t); k.keepOut.push({ x: 49, z: 25, r: 3.5 }); }
    /* the hydraulic tipper: a trailer on the platform, lifted nose first until the load slides out the back */
    const TP = { x: -55, z: 4 };
    k.box(3.6, 0.6, 3.6, TP.x, 0.3, TP.z - 7.2, dark);
    const tip = new T.Group(); tip.position.set(TP.x, 0.9, TP.z - 7.2); k.add(tip);
    { const deck = new T.Mesh(merge([bx(3.4, 0.4, 16, 0, 0, 8), bx(0.3, 0.9, 16, -1.6, 0.4, 8), bx(0.3, 0.9, 16, 1.6, 0.4, 8)]), yellow); tip.add(deck); const tt = mkTrailer(); tt.position.set(0, -0.7, 7.6); tip.add(tt); }
    const ram = k.mesh(new T.CylinderGeometry(0.28, 0.28, 1, 10), chrome, TP.x, 0, TP.z + 4, true);
    k.mesh(new T.CylinderGeometry(0.45, 0.45, 3, 10), yellow, TP.x, 1.5, TP.z + 4);
    const H3pile = heap(TP.x, TP.z - 15, 6, 5, 3.2, 21, 0.3, 28); k.mesh(H3pile.g, pile);
    { const t = mkTractor(); t.position.set(TP.x + 3, 0, TP.z + 16); t.rotation.y = -0.4; bake(k, t); k.keepOut.push({ x: TP.x + 3, z: TP.z + 16, r: 3.5 }); }
    k.block(TP.x - 2.5, TP.x + 2.5, TP.z - 9, TP.z + 10);
    const pourN = 90, pour = k.instances(new T.IcosahedronGeometry(0.35, 0), new T.MeshStandardMaterial({ color: 0x7a7470, roughness: 0.7, metalness: 0.4 }), Array.from({ length: pourN }, () => new T.Matrix4()));
    pour.frustumCulled = false;
    /* the truck that comes and goes: in from the road, over the scale, round the yard, out again */
    const truck = new T.Group(); { const tr = mkTractor(); tr.position.z = 6.6; truck.add(tr); const tl = mkTrailer(); tl.position.z = -4.2; truck.add(tl); } k.add(truck);
    const route = k.spline([v(26, 0, 190), v(25, 0, 60), v(24, 0, 34), v(24, 0, 14), v(20, 0, 2), v(8, 0, -4), v(-8, 0, -3), v(-14, 0, 8), v(-6, 0, 16), v(8, 0, 18), v(15, 0, 32), v(18, 0, 70), v(20, 0, 190)], true);
    if (!R) k.rider(truck, route, 6.5, 120); else truck.position.set(24, 0, 22);

    /* ---- the material handlers: three long reach machines with orange peel grapples, on a loop ---- */
    type Handler = { turret: T.Group; boom: T.Group; stick: T.Group; grip: T.Group; tines: T.Object3D[]; load: T.Mesh; keys: number[][]; per: number; off: number };
    const handlers: Handler[] = [];
    const L1 = 11.5, L2 = 8.5, FOOT = v(0, 3.9, 1.3), HANG = 2.4;
    const hGeo = {
      under: merge([bx(2.8, 1.1, 5.2, 0, 1.15, 0), bx(4.6, 0.3, 0.5, 0, 0.9, 2.2), bx(4.6, 0.3, 0.5, 0, 0.9, -2.2), bx(0.5, 0.9, 0.6, 2.3, 0.45, 2.2), bx(0.5, 0.9, 0.6, -2.3, 0.45, 2.2), bx(0.5, 0.9, 0.6, 2.3, 0.45, -2.2), bx(0.5, 0.9, 0.6, -2.3, 0.45, -2.2), cyl(1.1, 0.5, 0, 1.9, 0, 'y', 16)]),
      wheels: merge([cyl(0.62, 0.55, 1.35, 0.62, 1.5, 'x', 14), cyl(0.62, 0.55, -1.35, 0.62, 1.5, 'x', 14), cyl(0.62, 0.55, 1.35, 0.62, -1.5, 'x', 14), cyl(0.62, 0.55, -1.35, 0.62, -1.5, 'x', 14)]),
      body: merge([bx(3.2, 1.7, 4.6, 0, 3.0, -0.6), bx(3.3, 1.5, 1.5, 0, 3.0, -3.3), bx(1.2, 2.2, 1.2, -0.9, 4.9, 0.9), bx(0.8, 0.8, 1.0, 0.2, 3.7, 1.3)]),
      cab: merge([bx(1.6, 0.3, 1.9, -0.9, 6.15, 1.0), bx(1.7, 0.25, 2.0, -0.9, 8.1, 1.0), bx(0.12, 1.7, 0.12, -1.7, 7.1, 1.95), bx(0.12, 1.7, 0.12, -0.1, 7.1, 1.95), bx(0.12, 1.7, 0.12, -1.7, 7.1, 0.05), bx(0.12, 1.7, 0.12, -0.1, 7.1, 0.05), bx(1.4, 1.7, 0.08, -0.9, 7.1, 0.02)]),
      glass: merge([bx(1.5, 1.6, 0.05, -0.9, 7.1, 1.97), bx(0.05, 1.6, 1.85, -1.72, 7.1, 1.0), bx(0.05, 1.6, 1.85, -0.08, 7.1, 1.0)]),
      rails: merge([bx(3.4, 0.05, 0.05, 0, 4.9, -3.9), bx(0.05, 0.05, 4.2, 1.65, 4.9, -1.8), bx(0.05, 0.6, 0.05, 1.65, 4.6, 0.2), bx(0.05, 0.6, 0.05, 1.65, 4.6, -3.9)]),
      boom: (() => { const g = merge([bx(0.9, 1.1, L1, 0, 0, L1 / 2), bx(0.7, 0.5, 2.2, 0, 0.8, L1 * 0.55)]); return g; })(),
      stick: merge([bx(0.6, 0.75, L2, 0, 0, L2 / 2), cyl(0.3, 0.9, 0, 0, 0, 'x', 10)]),
      cylG: merge([cyl(0.14, 5, 0, 0, 0, 'y', 8)]),
      hub: merge([cyl(0.12, HANG - 0.8, 0, -(HANG - 0.8) / 2, 0, 'y', 6), cyl(0.55, 0.9, 0, -(HANG - 0.6), 0, 'y', 12)]),
    };
    const tineGeo = merge([bx(0.2, 1.4, 0.3, 0, -0.7, 0.05), bx(0.2, 0.8, 0.28, 0, -1.55, -0.2, 0.55)]);
    const tineMesh = new T.InstancedMesh(tineGeo, grab, 15); tineMesh.frustumCulled = false; k.add(tineMesh);
    const mkHandler = (x: number, z: number, body: T.Material, keys: number[][], per: number, off: number) => {
      const base = new T.Group(); base.position.set(x, 0, z); k.add(base);
      base.add(new T.Mesh(hGeo.under, dark)); base.add(new T.Mesh(hGeo.wheels, tyre));
      const turret = new T.Group(); base.add(turret);
      for (const [g, m] of [[hGeo.body, body], [hGeo.cab, white], [hGeo.glass, glassD], [hGeo.rails, rail]] as const) turret.add(new T.Mesh(g, m));
      const boom = new T.Group(); boom.position.copy(FOOT); turret.add(boom);
      boom.add(new T.Mesh(hGeo.boom, body)); { const rm = new T.Mesh(merge([cyl(0.16, 5.5, 0, -0.85, 3.2, 'z', 8), cyl(0.11, 4.2, 0, 0.85, L1 - 2.4, 'z', 8)]), chrome); boom.add(rm); }
      const stick = new T.Group(); stick.position.set(0, 0, L1); boom.add(stick);
      stick.add(new T.Mesh(hGeo.stick, body));
      const grip = new T.Group(); grip.position.set(0, 0, L2); stick.add(grip);
      grip.add(new T.Mesh(hGeo.hub, grab));
      const tines: T.Object3D[] = [];
      for (let i = 0; i < 5; i++) { const a = new T.Object3D(); a.position.set(0, -(HANG - 0.2), 0); a.rotation.y = (i / 5) * PI * 2; grip.add(a); const b = new T.Object3D(); b.position.set(0, 0, 0.45); a.add(b); tines.push(b); }
      const load = new T.Mesh(new T.DodecahedronGeometry(0.95, 0), k.flat(0x6e6a66, 0.5, 0.6)); load.position.set(0, -(HANG + 0.7), 0); load.scale.set(1.2, 0.8, 1); grip.add(load);
      k.keepOut.push({ x, z, r: 4.2 });
      const h: Handler = { turret, boom, stick, grip, tines, load, keys, per, off };
      handlers.push(h);
      return h;
    };
    /* key frames: [time 0..1, x, y, z world target for the grapple hub, open 0..1, carrying 0/1] */
    const H1 = { x: 8, z: -9 }, H2 = { x: -30, z: -11 }, H3 = { x: 60, z: 4 };
    const kf = (pick: T.Vector3, drop: T.Vector3) => [
      [0.0, pick.x, pick.y + 5, pick.z, 1, 0], [0.12, pick.x, pick.y + 0.6, pick.z, 1, 0], [0.2, pick.x, pick.y + 0.6, pick.z, 0, 1],
      [0.32, pick.x, pick.y + 7, pick.z, 0, 1], [0.55, drop.x, drop.y + 5, drop.z, 0, 1], [0.62, drop.x, drop.y + 2, drop.z, 0, 1],
      [0.7, drop.x, drop.y + 2, drop.z, 1, 0], [0.8, drop.x, drop.y + 6, drop.z, 1, 0], [1.0, pick.x, pick.y + 5, pick.z, 1, 0],
    ];
    mkHandler(H1.x, H1.z, yellow, kf(v(1, 3.6, -27.5), v(22, 3.5, -18.5)), 17, 0);
    mkHandler(H2.x, H2.z, cat, kf(v(-30, M1.H(-30, -28.5) + 0.4, -28.5), v(-19, 2.5, -4)), 19, 7);
    mkHandler(H3.x, H3.z, yellow, kf(v(63, 5.5, -5), v(84, 3.6, 6)), 15, 3);
    const HX = heap(-19, -4, 5, 4, 2.4, 31, 0.3, 24); k.mesh(HX.g, pile); k.keepOut.push({ x: -19, z: -4, r: 5 }, { x: TP.x, z: TP.z - 15, r: 5.5 });
    { const rnd = X.mulberry(41), jm: T.Matrix4[] = []; for (const [Hh, cx, cz, rx, rz] of [[HX, -19, -4, 5, 4], [H3pile, TP.x, TP.z - 15, 6, 5]] as const) for (let i = 0; i < 70; i++) { const a = rnd() * PI * 2, d = Math.sqrt(rnd()) * 0.95, x = cx + Math.cos(a) * rx * d, z = cz + Math.sin(a) * rz * d; jm.push(new T.Matrix4().compose(v(x, Hh.H(x, z) + 0.1, z), new T.Quaternion().setFromEuler(new T.Euler(rnd() * 2, rnd() * 6, rnd() * 2)), v(0.6 + rnd() * 1.6, 0.2 + rnd() * 0.4, 0.4 + rnd() * 0.8))); } const jk2 = k.instances(new T.BoxGeometry(1, 1, 1), k.flat(0x6a6660, 0.5, 0.55), jm); void jk2; }
    const place = (h: Handler, bx0: number, bz0: number, t: number) => {
      const u = (((t + h.off) / h.per) % 1 + 1) % 1, K2 = h.keys;
      let i = 0; while (i < K2.length - 2 && u > K2[i + 1][0]) i++;
      const a = K2[i], b = K2[i + 1], f = smooth(Math.min(1, Math.max(0, (u - a[0]) / (b[0] - a[0]))));
      const lerp = (j: number) => a[j] + (b[j] - a[j]) * f;
      /* slew by angle, not by straight line, so the boom swings through its arc */
      const ya = Math.atan2(a[1] - bx0, a[3] - bz0), yb = Math.atan2(b[1] - bx0, b[3] - bz0);
      let dy = yb - ya; while (dy > PI) dy -= 2 * PI; while (dy < -PI) dy += 2 * PI;
      const yaw = ya + dy * f, ra = Math.hypot(a[1] - bx0, a[3] - bz0), rb = Math.hypot(b[1] - bx0, b[3] - bz0), r = ra + (rb - ra) * f, y = lerp(2);
      h.turret.rotation.y = yaw;
      const s = reach(r - FOOT.z, y + HANG - FOOT.y, L1, L2);
      h.boom.rotation.x = -s.a1; h.stick.rotation.x = -(s.a2 - s.a1); h.grip.rotation.x = s.a2;
      const open = lerp(4);
      h.tines.forEach((tn) => { tn.rotation.x = -(0.08 + 0.62 * open); });
      h.load.visible = lerp(5) > 0.5;
    };
    const pos3 = [H1, H2, H3];
    const tm = new T.Matrix4();
    const updTines = () => { let j = 0; handlers.forEach((h) => { h.turret.parent!.updateMatrixWorld(true); h.tines.forEach((tn) => { tineMesh.setMatrixAt(j++, tm.copy(tn.matrixWorld)); }); }); tineMesh.instanceMatrix.needsUpdate = true; };
    handlers.forEach((h, i) => place(h, pos3[i].x, pos3[i].z, 3));
    updTines();

    /* ---- the wheel loader, bucket up, shuttling at the feed pile ---- */
    const loader = new T.Group(); k.add(loader);
    loader.add(new T.Mesh(merge([bx(2.6, 1.5, 3.2, 0, 1.9, -1.4), bx(2.4, 1.2, 2.2, 0, 1.7, 1.3), bx(2.8, 0.8, 1.0, 0, 1.8, -3.2), bx(1.8, 0.3, 1.8, 0, 4.4, -0.2)]), cat));
    loader.add(new T.Mesh(merge([bx(1.8, 1.6, 1.7, 0, 3.4, -0.2)]), glassD));
    loader.add(new T.Mesh(merge([cyl(0.95, 0.7, 1.35, 0.95, 1.3, 'x', 16), cyl(0.95, 0.7, -1.35, 0.95, 1.3, 'x', 16), cyl(0.95, 0.7, 1.35, 0.95, -1.8, 'x', 16), cyl(0.95, 0.7, -1.35, 0.95, -1.8, 'x', 16)]), tyre));
    const arm = new T.Group(); arm.position.set(0, 2.3, 1.6); loader.add(arm);
    arm.add(new T.Mesh(merge([bx(0.3, 0.4, 3.2, 1.0, 0, 1.6), bx(0.3, 0.4, 3.2, -1.0, 0, 1.6), bx(2.0, 0.3, 0.3, 0, 0, 2.2)]), cat));
    const bucket = new T.Group(); bucket.position.set(0, 0, 3.2); arm.add(bucket);
    bucket.add(new T.Mesh(merge([bx(3.2, 0.12, 1.5, 0, -0.6, 0.6), bx(3.2, 1.3, 0.12, 0, 0, -0.1), bx(0.12, 1.2, 1.5, 1.6, -0.1, 0.6), bx(0.12, 1.2, 1.5, -1.6, -0.1, 0.6)]), grab));
    const LA = v(-26, 0, 13), LB = v(-21, 0, 1.5);
    const placeLoader = (t: number) => {
      const u = (t % 20) / 20, f = u < 0.5 ? smooth(u * 2) : smooth(2 - u * 2), p = LA.clone().lerp(LB, f);
      loader.position.copy(p); loader.rotation.y = Math.atan2(LB.x - LA.x, LB.z - LA.z);
      const lift = u > 0.35 && u < 0.65 ? smooth(Math.min(1, (0.15 - Math.abs(u - 0.5)) / 0.1)) : 0;
      arm.rotation.x = -0.1 - 0.75 * lift; bucket.rotation.x = 0.2 + 0.5 * lift;
    };
    placeLoader(6); k.keepOut.push({ x: (LA.x + LB.x) / 2, z: (LA.z + LB.z) / 2, r: 3 });

    /* ---- the moving parts: scrap on the infeed, frag off the stackers, steam off the mill ---- */
    const NI = 64, infeed = k.instances(new T.IcosahedronGeometry(0.55, 0), new T.MeshStandardMaterial({ roughness: 0.6, metalness: 0.45 }), Array.from({ length: NI }, () => new T.Matrix4()));
    infeed.frustumCulled = false;
    const NS = 70, fall = k.instances(new T.IcosahedronGeometry(0.16, 0), new T.MeshStandardMaterial({ color: 0x4a4540, roughness: 0.8, metalness: 0.4 }), Array.from({ length: NS * 2 }, () => new T.Matrix4()));
    fall.frustumCulled = false;
    {
      const rnd = X.mulberry(88), c = new T.Color(), pal = [0x7a7e82, 0x9a9ea2, 0x6b3b24, 0xa02a2a, 0x2a4a8a, 0xdcdcd4, 0x444444, 0x2e5a3a];
      for (let i = 0; i < NI; i++) infeed.setColorAt(i, c.set(pal[i % pal.length]));
      if (infeed.instanceColor) infeed.instanceColor.needsUpdate = true;
      const io = Array.from({ length: NI }, () => ({ o: rnd(), dx: (rnd() - 0.5) * 1.8, s: 0.6 + rnd() * 0.9, r: rnd() * 6 }));
      const fo = Array.from({ length: NS * 2 }, () => ({ o: rnd(), dx: (rnd() - 0.5) * 0.7, dz: (rnd() - 0.5) * 0.7 }));
      const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), s = new T.Vector3(), e = new T.Euler(), side = new T.Vector3().crossVectors(IB.clone().sub(IA).normalize(), UP).normalize(), hp = new T.Vector3();
      const Li = IA.distanceTo(IB);
      const tick = (t: number, dt: number) => {
        for (let i = 0; i < NI; i++) {
          const a = io[i], u = (t * 1.2 / Li + a.o) % 1;
          p.copy(IA).lerp(IB, u).addScaledVector(side, a.dx); p.y += 0.45;
          e.set(a.r + t * 0.1, a.r, 0); q.setFromEuler(e); s.set(a.s * 1.4, a.s * 0.6, a.s);
          m.compose(p, q, s); infeed.setMatrixAt(i, m);
        }
        infeed.instanceMatrix.needsUpdate = true;
        stackers.forEach((st, si) => {
          st.g.rotation.y = st.base + st.amp * Math.sin(t * 0.07 + st.ph);
          st.g.updateMatrixWorld(true); st.head.getWorldPosition(hp);
          for (let i = 0; i < NS; i++) {
            const a = fo[si * NS + i], u = (t * 0.9 + a.o) % 1, drop = hp.y - st.cone.h + 0.3;
            p.set(hp.x + a.dx * (1 + u), hp.y - u * u * drop, hp.z + a.dz * (1 + u) + u * 0.8);
            m.compose(p, q.identity(), s.setScalar(1)); fall.setMatrixAt(si * NS + i, m);
          }
        });
        fall.instanceMatrix.needsUpdate = true;
        handlers.forEach((h, i) => place(h, pos3[i].x, pos3[i].z, t));
        updTines();
        placeLoader(t);
        /* the tipper: forty second cycle, up to forty degrees, the load sliding out the back at the top */
        const cu = (t % 40) / 40, ang = cu < 0.35 ? smooth(cu / 0.35) : cu < 0.6 ? 1 : cu < 0.9 ? 1 - smooth((cu - 0.6) / 0.3) : 0, A = ang * 0.7;
        tip.rotation.x = -A;
        const top = v(TP.x, 0.9 + Math.sin(A) * 11.2, TP.z - 7.2 + Math.cos(A) * 11.2);
        ram.position.set(TP.x, (top.y + 0.5) / 2, (top.z + TP.z + 4) / 2); ram.scale.y = Math.max(0.3, top.y); ram.quaternion.setFromUnitVectors(UP, v(0, top.y, top.z - (TP.z + 4)).normalize());
        for (let i = 0; i < pourN; i++) {
          const a = fo[i], uu = (t * 0.7 + a.o) % 1;
          if (ang > 0.75) { p.set(TP.x + a.dx * 3, 1.6 - uu * uu * 1.4 + 0.2, TP.z - 8.2 - uu * 3.5 + a.dz * 2); s.setScalar(0.8 + a.o); }
          else { p.set(0, -50, 0); s.setScalar(0.001); }
          m.compose(p, q.identity(), s); pour.setMatrixAt(i, m);
        }
        pour.instanceMatrix.needsUpdate = true;
        void dt;
      };
      tick(3, 0);
      if (!R) k.ticks.push(tick);
    }
    steam(k, [v(22, 2, -19), v(-19, 2.5, -4)], 30, { rise: 5, spread: 3, size: 4, opacity: 0.18, seed: 7, speed: 0.12, animate: !R, colour: 0xc8b89c });
    steam(k, [v(46, 13, -38), v(48, 13.5, -39.5), v(45, 12.5, -40)], 90, { rise: 22, spread: 2.2, size: 7, opacity: 0.32, seed: 1997, speed: 0.07, animate: !R });
    /* four light towers: poles with a bank of floods, lit when the clock goes dark */
    for (const [x, z] of [[-40, -8], [-12, 22], [36, -4], [40, 34]] as const) {
      k.cyl(0.25, 22, x, 11, z, dark, 0.35, 8); k.box(3.2, 1.4, 0.6, x, 22.3, z, dark);
      for (const dx of [-1.1, 0, 1.1]) for (const dy of [-0.35, 0.35]) k.box(0.8, 0.5, 0.1, x + dx, 22.3 + dy, z + 0.33, k.night > 0.5 ? k.glow(0xfff4dc) : k.flat(0xd8dcdf, 0.3, 0.3));
      if (k.night > 0.3) k.spot(x, 22, z + 1, x * 0.6, 0, z - 14, 0xfff0d8, 1300 * k.night, 0.85, 0.6, 70);
      k.keepOut.push({ x, z, r: 0.8 });
    }
    /* the yard crew in hi vis, and a few walking the scale */
    for (const [x, z, c, r] of [[14, -14, 0xf2c300, 0.5], [18, -24, 0xff7a1a, 2.2], [-12, -16, 0xd8f02a, -0.4], [36, -36, 0xff7a1a, 0], [27, 18, 0xd8f02a, -1.2], [-44, 6, 0xf2c300, 0.8]] as const) figure(k, x, 0, z, c, { rotY: r });
    if (!R) k.crowd([v(28, 0, 14), v(28, 0, 34), v(20, 0, 38), v(12, 0, 30)], 5, { seed: 152, speed: 0.6, spread: 0.8, colors: [0xf2c300, 0xff7a1a, 0xd8f02a, 0x2a3a5a] });

    /* ---- the works: plates on the canopy columns, plate stood on end in the yard, the scale house, the trailer flanks ---- */
    const mounts: Mount[] = [];
    const plate = k.pbr('wyPlate', X.steel(0x4a4f55, true, 9), 0.5, { metalness: 0.6, roughness: 0.55 }), rustPlate = k.pbr('wyRustP', X.steel(0x6a4a36, false, 13), 0.35, { metalness: 0.4, roughness: 0.75 });
    for (const x of colsX) { k.box(3.4, 2.6, 0.14, x, 2.5, CZF + 0.68, plate); mounts.push({ position: v(x, 2.5, CZF + 0.8), rotation: 0, target: v(x, 2.5, CZF + 4.2), width: 2.6, height: 1.8, style: 'steel', wash: true }); }
    /* stood plate: an H beam frame with a sheet on each face */
    for (const [x, z, yaw] of [[-44, 12, 0.45], [-33, 19, 0.3], [-21, 25, 0.12]] as const) {
      const g = merge([bx(0.3, 4.2, 0.3, -2.2, 2.1, 0), bx(0.3, 4.2, 0.3, 2.2, 2.1, 0), bx(4.7, 0.3, 0.3, 0, 4.05, 0), bx(0.4, 0.2, 2.4, -2.2, 0.1, 0), bx(0.4, 0.2, 2.4, 2.2, 0.1, 0), rod(v(-2.2, 0.1, 1.1), v(-2.2, 2.2, 0), 0.07), rod(v(2.2, 0.1, 1.1), v(2.2, 2.2, 0), 0.07), rod(v(-2.2, 0.1, -1.1), v(-2.2, 2.2, 0), 0.07), rod(v(2.2, 0.1, -1.1), v(2.2, 2.2, 0), 0.07)]);
      const fr = k.mesh(g, dark, x, 0, z); fr.rotation.y = yaw;
      const pl = k.box(4.1, 3.0, 0.12, x, 2.25, z, rustPlate); pl.rotation.y = yaw;
      const n = v(Math.sin(yaw), 0, Math.cos(yaw));
      for (const s of [1, -1]) mounts.push({ position: v(x + n.x * s * 0.1, 2.2, z + n.z * s * 0.1), rotation: s > 0 ? yaw : yaw + PI, target: v(x + n.x * s * 3.6, 2.2, z + n.z * s * 3.6), width: 2.6, height: 1.8, style: 'steel', wash: true });
      k.block(x - 2.4, x + 2.4, z - 1.3, z + 1.3);
    }
    for (const z of [SH.z - 1.8, SH.z + 2.6]) mounts.push({ position: v(SH.x - 3.04, 2.0, z), rotation: -PI / 2, target: v(SH.x - 6.5, 2.0, z), width: 2.4, height: 1.65, style: 'steel', wash: true });
    for (const p of parked) for (const dz of [-3.2, 2.2]) mounts.push({ position: v(p.x - 1.42, 2.95, p.z + dz), rotation: -PI / 2, target: v(p.x - 4.6, 2.95, p.z + dz), width: 2.2, height: 1.5, style: 'black', wash: true });
    k.censusWall({ x: -40, y: 3.4, z: 32.9, rotY: PI, cols: 16, rows: 5, tile: 0.95, gap: 0.08, start: ctx.wallStart(5152, 80), pieces: ctx.all, backing: blueClad });

    /* ---- what the yard knows ---- */
    const wiki = { name: 'Upstate Shredding, Wikipedia', url: 'https://en.wikipedia.org/wiki/Upstate_Shredding' }, site = { name: 'Upstate Shredding, Weitsman Recycling', url: 'https://www.upstateshredding.com/' };
    k.egg(v(-40, 3, 32), { id: 'seventeen-acres-1997', title: 'Seventeen acres, 1997', year: '1997', text: 'Adam Weitsman opened Upstate Shredding in 1997 on a 17 acre site in the Tioga County Industrial Park in Owego, New York, after the state\'s Empire State Development fund put a million dollars behind it.', clue: 'The office by the gate knows when the yard began.', source: wiki }, { r: 3 });
    k.egg(v(46, 10, -38), { id: 'mega-shredder', title: 'Ten thousand horsepower', text: 'The mill at the top of the infeed is a 10,000 HP Riverside Engineering Mega Shredder, with a full nonferrous downstream line behind it to pull the other metals out of the frag.', clue: 'Follow the conveyor up to where the steam comes from.', source: site }, { r: 4 });
    k.egg(v(C1.x - 4, 4, C1.z + 4), { id: 'million-tons', title: 'A million tons', text: 'The company processes 1 million tons of ferrous and 250 million pounds of nonferrous scrap metal a year, across 15 locations in New York and Pennsylvania.', clue: 'The dark cones under the stackers are what a car becomes.', source: site }, { r: 4 });
    k.egg(v(-22, CH + 1.6, CZF + 1), { id: 'largest-private', title: 'Written on the canopy', year: '2016', text: 'Upstate Shredding calls itself the East Coast\'s largest privately held scrap metal processor. It was named the 2016 Platts Global Scrap Company of the Year, and American Metal Market\'s Scrap Company of the Year the same year.', clue: 'Read the banner over the car mountain.', source: site }, { r: 5 });
    k.egg(v(-33, 2.2, 19), { id: 'folk-art-1991', title: 'From Greenwich Village', year: '1991', text: 'Before the yard, Adam Weitsman worked at the Manhattan Art Gallery and in 1991 set up his own American Folk Art Gallery in Greenwich Village, then came home to Owego.', clue: 'The man who built this yard started out hanging pictures in the city.', source: wiki }, { r: 2.6 });

    return { mounts, spawn: v(6, 3, 30), look: v(4, 7, -30), eye: 3, bounds: [-60, 62, -21.5, 42], style: 'steel' };
  },
};
