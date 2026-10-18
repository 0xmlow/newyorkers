import * as T from 'three';
import { prop, tex, pbr } from '../core/assets';
import { box, sign, v3, seeded } from '../core/kit';
import { drips, addThreshold, INK } from '../core/mlow';
import { clickables } from '../core/hang';
import { ORIGINS, type Ctx, type Room } from '../core/room';

// APARTMENT 5A: THE 900 SQUARE FOOT STUDIO, an Ames room. Built as an ordinary rectangular room, then every vertex is
// pushed along its own line of sight from the peephole: P' = E + (P - E) s(x), s = 1.15 - 0.15 x. From the peephole
// nothing has moved, so the room reads as a perfect rectangle; in fact the far left corner is 1.6 times further away
// than it looks and the far right 0.7 times. Two identical bronze figures stand in the two far corners: from the door
// one is a giant and one is tiny. Walk in and the floor tilts under you. Physical geometry, not a shader.
// Local: the peephole E at (0, 1.6, 0) looking -z. The rectangle: x -3 .. 3, y 0 .. 3, z -1.1 .. -8.

const E = new T.Vector3(0, 1.6, 0);
const s = (x: number) => 1.15 - 0.15 * x;
const warp = (p: T.Vector3) => p.sub(E).multiplyScalar(s(p.x + 0)).add(E);
function warpGeo(geo: T.BufferGeometry, place: T.Matrix4) {
  const p = geo.attributes.position, v = new T.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).applyMatrix4(place);
    const k = s(v.x); v.sub(E).multiplyScalar(k).add(E);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}
/** A plane in the rectangle (centre, size, facing), subdivided and warped. */
function wplane(parent: T.Object3D, mat: T.Material, c: T.Vector3, w: number, h: number, rot: T.Euler, seg = 24) {
  const geo = new T.PlaneGeometry(w, h, seg, seg);
  const mesh = new T.Mesh(warpGeo(geo, new T.Matrix4().compose(c, new T.Quaternion().setFromEuler(rot), v3(1, 1, 1))), mat);
  mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function wbox(parent: T.Object3D, mat: T.Material, c: T.Vector3, w: number, h: number, d: number) {
  const geo = new T.BoxGeometry(w, h, d, 6, 6, 6);
  const mesh = new T.Mesh(warpGeo(geo, new T.Matrix4().makeTranslation(c.x, c.y, c.z)), mat);
  mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh;
}

function checker() {
  const c = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d')!;
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#0e1424' : '#e9e6df'; x.fillRect(i * 128, j * 128, 128, 128); }
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = T.RepeatWrapping; return t;
}
/** Wallpaper: regular stripes (they are what tells the eye the room is square) under a hand drawn MLow contour field. */
function wallpaper(seed: number) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d')!, rnd = seeded(seed);
  x.fillStyle = '#081a44'; x.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 32; i++) { x.fillStyle = i % 2 ? '#0b2258' : '#071637'; x.fillRect(i * 32, 0, 32, 512); }
  // contour lines: iso lines of a sum of bumps, drawn by marching the field row by row
  const bumps = Array.from({ length: 9 }, () => [rnd() * 1024, rnd() * 512, 80 + rnd() * 220, rnd() < 0.5 ? 1 : -1]);
  const f = (px: number, py: number) => bumps.reduce((a, [bx, by, r, sg]) => a + sg * Math.exp(-((px - bx) ** 2 + (py - by) ** 2) / (r * r)), 0) + Math.sin(px * 0.004 + py * 0.006) * 0.3;
  const img = x.getImageData(0, 0, 1024, 512), d = img.data;
  for (let py = 0; py < 512; py++) for (let px = 0; px < 1024; px++) {
    const v = f(px, py) * 9, fr = Math.abs(v - Math.round(v));
    if (fr < 0.06) { const i = (py * 1024 + px) * 4, k = 1 - fr / 0.06, cy = Math.round(v) % 3 === 0;
      d[i] = d[i] * (1 - k) + (cy ? 0 : 41) * k; d[i + 1] = d[i + 1] * (1 - k) + (cy ? 229 : 98) * k; d[i + 2] = d[i + 2] * (1 - k) + 255 * k; }
  }
  x.putImageData(img, 0, 0);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t;
}

export function buildStudio(ctx: Ctx): Room {
  const O = ORIGINS.studio, g = new T.Group(); g.position.copy(O); ctx.scene.add(g);
  const at = (x: number, y: number, z: number) => O.clone().add(v3(x, y, z));
  const art = ctx.m.art.studio;
  const X0 = -3, X1 = 3, Z0 = -1.1, Z1 = -8, H = 3, W = X1 - X0, D = Z0 - Z1;

  const floorT = checker(); floorT.repeat.set(3, 3.5);
  const floorM = new T.MeshStandardMaterial({ map: floorT, roughness: 0.25, metalness: 0.05 });
  const wallL = new T.MeshStandardMaterial({ map: wallpaper(3), roughness: 0.7 });
  const wallR = new T.MeshStandardMaterial({ map: wallpaper(9), roughness: 0.7 });
  const wallB = new T.MeshStandardMaterial({ map: wallpaper(17), roughness: 0.7 });
  const ceilM = new T.MeshStandardMaterial({ color: 0x0a0f1e, roughness: 0.9 });
  wplane(g, floorM, v3(0, 0, (Z0 + Z1) / 2), W, D, new T.Euler(-Math.PI / 2, 0, 0), 32);
  wplane(g, ceilM, v3(0, H, (Z0 + Z1) / 2), W, D, new T.Euler(Math.PI / 2, 0, 0), 16);
  wplane(g, wallL, v3(X0, H / 2, (Z0 + Z1) / 2), D, H, new T.Euler(0, Math.PI / 2, 0), 32);
  wplane(g, wallR, v3(X1, H / 2, (Z0 + Z1) / 2), D, H, new T.Euler(0, -Math.PI / 2, 0), 32);
  wplane(g, wallB, v3(0, H / 2, Z1), W, H, new T.Euler(0, 0, 0), 32);
  // the front wall with its doorway, so the peephole looks through a door into the room
  const front = new T.MeshStandardMaterial({ color: 0x0b1230, roughness: 0.8 });
  wplane(g, front, v3(-1.85, H / 2, Z0), 2.3, H, new T.Euler(0, Math.PI, 0), 12);
  wplane(g, front, v3(1.85, H / 2, Z0), 2.3, H, new T.Euler(0, Math.PI, 0), 12);
  wplane(g, front, v3(0, 2.65, Z0), 1.4, 0.7, new T.Euler(0, Math.PI, 0), 8);
  // the corridor from the door to the peephole: a short ordinary hall
  const hall = pbr('plaster', 1.5, { color: 0x1c2240 });
  box(g, 0.1, 2.9, 1.95, -0.75, 1.45, -0.35, hall); box(g, 0.1, 2.9, 1.95, 0.75, 1.45, -0.35, hall);
  box(g, 1.6, 0.1, 1.95, 0, 2.95, -0.35, hall, false);
  const hallFloor = new T.Mesh(new T.PlaneGeometry(1.5, 1.6), pbr('planks', 0.8, { color: 0x4a3324 })); hallFloor.rotation.x = -Math.PI / 2; hallFloor.position.set(0, 0, -0.3); g.add(hallFloor);

  // the window on the back wall: the skyline, lit
  const winM = new T.MeshBasicMaterial({ map: tex('plates/skyline.jpg'), toneMapped: false, color: new T.Color(0.75, 0.75, 0.8) });
  wplane(g, winM, v3(0.9, 1.75, Z1 + 0.02), 1.3, 1.6, new T.Euler(), 8);
  wbox(g, new T.MeshStandardMaterial({ color: 0xe9e6df }), v3(0.9, 0.93, Z1 + 0.1), 1.5, 0.06, 0.2);
  // furniture, all warped with the room: the Murphy bed half down, the radiator, the kitchen with the tub in it
  const wood = new T.MeshStandardMaterial({ color: 0x5a3b26, roughness: 0.6 }), white = new T.MeshStandardMaterial({ color: 0xe9eef5, roughness: 0.3 });
  wbox(g, wood, v3(-2.75, 1.2, -4.6), 0.4, 2.4, 1.4);
  wbox(g, white, v3(-1.9, 0.35, -4.6), 1.9, 0.3, 1.3);
  wbox(g, new T.MeshStandardMaterial({ color: 0xc9a050, metalness: 0.9, roughness: 0.3 }), v3(2.6, 0.45, -5.0), 0.25, 0.9, 1.2);
  wbox(g, white, v3(2.35, 0.32, -2.6), 0.7, 0.64, 1.5);
  wbox(g, new T.MeshStandardMaterial({ color: 0x9fd0ff, roughness: 0.05, transparent: true, opacity: 0.7 }), v3(2.35, 0.6, -2.6), 0.56, 0.02, 1.34);
  sign(g, ['TUB IN THE KITCHEN', 'A NEW YORK CLASSIC'], 0.9, 0.3, warp(v3(2.95, 1.3, -2.6)), -Math.PI / 2, { bg: '#f0f4f8', ink: '#06163a' });
  // the two figures: identical, unscaled, standing on the warped floor in the far corners
  const left = warp(v3(-2.35, 0, -7.35)), right = warp(v3(2.35, 0, -7.35));
  const fl = prop('bronze_figure', 1.75); fl.position.copy(left); fl.rotation.y = 0.4; g.add(fl);
  const fr = prop('bronze_figure', 1.75); fr.position.copy(right); fr.rotation.y = -0.4; g.add(fr);
  // the New Yorkers on the walls, warped with the walls, so from the peephole they hang straight
  const place = (i: number): [T.Vector3, T.Euler] => {
    if (i < 3) return [v3(X0 + 0.02, 1.6, -2.4 - i * 1.9), new T.Euler(0, Math.PI / 2, 0)];
    if (i < 5) return [v3(-1.6 + (i - 3) * 4.6, 1.75, Z1 + 0.02), new T.Euler()];
    return [v3(X1 - 0.02, 1.6, -2.6 - (i - 5) * 1.6 - (i > 5 ? 0.8 : 0)), new T.Euler(0, -Math.PI / 2, 0)];
  };
  art.slice(0, 8).forEach((a, i) => {
    if (i === 6) return; // the right wall's middle is the radiator
    const [c, r] = place(i), w = 1.25, h = w / a.ar;
    const fm = wplane(g, new T.MeshStandardMaterial({ color: 0x0d0f14, roughness: 0.4, metalness: 0.4 }), c.clone(), w + 0.1, h + 0.1, r, 6);
    fm.position.add(new T.Vector3(0, 0, 0.004).applyEuler(r));
    const am = wplane(g, new T.MeshBasicMaterial({ map: tex(a.f), toneMapped: false }), c.clone().add(new T.Vector3(0, 0, 0.012).applyEuler(r)), w, h, r, 10);
    clickables.push({ mesh: am, piece: a, view: () => ({ at: at(0, 1.6, 0), look: am.geometry.boundingSphere ? am.localToWorld(am.geometry.boundingSphere.center.clone()) : at(0, 1.6, -4) }) });
    am.geometry.computeBoundingSphere();
  });
  // paint at the threshold, and one pendant
  drips(g, v3(-0.65, 2.9, -1.05), v3(0.65, 2.9, -1.05), 16, 61, 0.5);
  addThreshold(at(0, 1.4, -1.1), 2.2);
  const pend = new T.PointLight(0xffd9a0, 18, 14, 1.4); pend.position.copy(warp(v3(0, 2.6, -4.5))); pend.castShadow = true; pend.shadow.mapSize.set(1024, 1024); g.add(pend);
  const bulb = new T.Mesh(new T.SphereGeometry(0.09, 16, 12), new T.MeshStandardMaterial({ emissive: 0xffd9a0, emissiveIntensity: 5, color: 0xffffff }));
  bulb.position.copy(pend.position); g.add(bulb);
  g.add(new T.HemisphereLight(0x8aa0e0, 0x2a2018, 0.5));
  sign(g, ['5A'], 0.25, 0.15, v3(0.42, 2.1, 0.55), Math.PI, { bg: '#c9a050', ink: '#1a1208' });

  // where you can stand: invert the warp (x' = x s(x) is a quadratic in x) and test the rectangle
  const unwarp = (lx: number, lz: number) => {
    // solve 0.15 x^2 - 1.15 x + x' = 0 for the root near the room, then z = z' / s
    const xr = (1.15 - Math.sqrt(Math.max(0, 1.3225 - 0.6 * lx))) / 0.3;
    return { x: xr, z: lz / s(xr), k: s(xr) };
  };
  void INK;
  return {
    id: 'studio', name: 'Apartment 5A', line: 'Nine hundred square feet. Spacious from one angle. Stand at the peephole.',
    origin: O, group: g,
    spawn: { at: at(0, 1.6, 0), look: at(0, 1.45, -6) },
    views: [
      { name: 'The peephole', note: 'From here it is a square room. One of them is a giant.', at: at(0, 1.6, 0), look: at(0, 1.45, -6) },
      { name: 'The left corner', note: 'Walk to the left corner. Everything gets bigger, including you.', at: O.clone().add(warp(v3(-2.2, 1.6, -5.4))), look: O.clone().add(warp(v3(2.4, 1.2, -7))) },
      { name: 'The right corner', note: 'And the other corner. The ceiling is lower than it looks.', at: O.clone().add(warp(v3(2.0, 1.6, -5.2))), look: O.clone().add(warp(v3(-2.4, 1.2, -7.4))) },
    ],
    doors: { walkup: { pos: at(0, 0, 0.55), rotY: Math.PI }, cam: { pos: at(0, 1.7, 0.3), rotY: Math.PI } },
    walk: [[-0.7, -1.3, 0.7, 0.6]], block: [],
    bg: new T.Color(0x02040c), fog: new T.FogExp2(0x02040c, 0.01), exposure: 1.0,
    floorY(x, z) {
      const lx = x - O.x, lz = z - O.z;
      if (lz > -0.95) return O.y;
      const u = unwarp(lx, lz);
      return O.y + E.y - E.y * u.k; // the warped floor under the visitor
    },
    tick() {},
    // standing: the hall, or inside the rectangle once un warped
    stand: (lx: number, lz: number) => {
      if (lz > -1.0) return Math.abs(lx) < 0.55 && lz < 0.9 && lz > -1.2;
      const u = unwarp(lx, lz);
      return u.x > X0 + 0.35 && u.x < X1 - 0.35 && u.z < Z0 - 0.15 && u.z > Z1 + 0.35 && !(u.x < -0.8 && u.z < -3.8 && u.z > -5.4) && !(u.x > 1.9 && u.z > -3.5);
    },
  };
}
