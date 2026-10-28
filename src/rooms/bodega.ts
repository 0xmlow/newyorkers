import * as T from 'three';
import { pbr, prop } from '../core/assets';
import { box, floorPlane, sign, v3, seeded, type Rect } from '../core/kit';
import { contour, drips, addThreshold, INK } from '../core/mlow';
import { hang, poster, sticker } from '../core/hang';
import { plate } from '../core/plate';
import { ORIGINS, type Ctx, type Room } from '../core/room';

// INFINITY DELI & GROCERY. Nine metres of shopfront on the street; inside, one aisle, 260 metres of it, and then the
// ImageGen aisle as a depth plate so it never stops. Every product is an instance (one draw call per kind), the New
// Yorkers sit on the shelves between the chips and the cat food, and the paint creeps down the aisle from the door.
// Local: door at z = 0 looking -z; the counter by the door, the aisle x -1.2 .. 1.2 from z -6 to -262.

export function buildBodega(ctx: Ctx): Room {
  const O = ORIGINS.bodega, g = new T.Group(); g.position.copy(O); ctx.scene.add(g);
  const rnd = seeded(23), art = ctx.m.art.bodega, at = (x: number, y: number, z: number) => O.clone().add(v3(x, y, z));
  const L = 262;

  const floor = pbr('terrazzo', 1.2, { color: 0xb9b3a6, roughness: 0.35 });
  const wallM = contour(pbr('plaster', 2, { color: 0x31384a }), { coverage: 0.25, density: 10, glow: 1.7, ground: 0.6 });
  const ceil = new T.MeshStandardMaterial({ color: 0x15181f, roughness: 0.9 });
  floorPlane(g, 5, L + 8, floor, 0, 0, -L / 2 + 2);
  box(g, 0.2, 3.3, L + 8, -2.6, 1.65, -L / 2 + 2, wallM);
  box(g, 0.2, 3.3, L + 8, 2.6, 1.65, -L / 2 + 2, wallM);
  box(g, 5.4, 0.2, L + 8, 0, 3.3, -L / 2 + 2, ceil, false);
  // the front: glass, door, the street glow coming in
  box(g, 1.9, 3.3, 0.2, -1.65, 1.65, 0.1, wallM); box(g, 1.9, 3.3, 0.2, 1.65, 1.65, 0.1, wallM); box(g, 1.3, 1.0, 0.2, 0, 2.8, 0.1, wallM);

  // the counter, the register, the bagel, the cat
  const marble = pbr('marble', 1, { roughness: 0.2 });
  const wood = pbr('planks', 1, { color: 0x5a3b26 });
  box(g, 0.8, 1.05, 3.6, 1.95, 0.52, -2.6, wood);
  box(g, 0.9, 0.05, 3.7, 1.95, 1.07, -2.6, marble);
  const reg = prop('ph_cash_register', 0.42); reg.position.set(1.95, 1.1, -1.5); reg.rotation.y = -Math.PI / 2; g.add(reg);
  const bag = prop('barney_bagel', 0.45); bag.position.set(1.95, 1.1, -3.2); g.add(bag);
  // the cat: the orange tabby GLB (the one UNLICENSED and THE MARKS use), sitting up, 0.36 m. The code loaf stays as
  // the stand in and is hidden when the GLB lands, so a failed load leaves the old cat on the counter.
  const cat = new T.Group(), catLoaf = bodegaCat(); cat.add(catLoaf);
  cat.userData.dynamic = true; cat.position.set(1.95, 1.1, -2.4); cat.rotation.y = -1.9; g.add(cat);
  const catGlb = prop('cat', 0.36, () => { catLoaf.visible = false; }); catGlb.rotation.y = -0.9; cat.add(catGlb); // three quarters to the aisle
  // the coffee, in the cup
  const cup = new T.MeshStandardMaterial({ color: 0xe9eef5, roughness: 0.5 });
  for (let i = 0; i < 6; i++) { const c = new T.Mesh(new T.CylinderGeometry(0.045, 0.035, 0.13, 16), cup); c.position.set(1.75 + (i % 2) * 0.12, 1.16, -3.9 - Math.floor(i / 2) * 0.12); g.add(c); }
  sign(g, ['WE HAVE IT'], 1.1, 0.42, v3(2.48, 2.3, -1.8), -Math.PI / 2, { bg: '#f0f4f8', ink: '#c8102e', font: 'Archivo' });
  sign(g, ['CAT NOT FOR SALE'], 0.7, 0.2, v3(2.48, 1.55, -2.4), -Math.PI / 2, { bg: '#ffd84a', ink: '#06163a' });
  sign(g, ['BACON EGG AND CHEESE', 'ON A ROLL . $6.50', 'EVERYTHING BAGEL . $2.75', 'COFFEE . $1.75', 'A LITTLE MORE SPACE . FREE'], 1.4, 1.2, v3(2.48, 2.45, -3.8), -Math.PI / 2, { bg: '#0a0f1e', ink: '#ffd84a', glow: 1.4, align: 'left' });
  sign(g, ['LOTTO'], 0.8, 0.3, v3(-2.48, 2.6, -1.6), Math.PI / 2, { bg: '#c8102e', ink: '#fff', glow: 1.3 });

  // the shelves: two runs from z -6 to the end. units of 2 m, four tiers; products are instanced boxes and cans
  const shelfM = new T.MeshStandardMaterial({ color: 0xd9dde3, metalness: 0.6, roughness: 0.4 });
  const units = Math.floor((L - 8) / 2);
  const tiers = [0.18, 0.62, 1.06, 1.5];
  const uprights: T.Matrix4[] = [], boards: T.Matrix4[] = [];
  const m = new T.Matrix4(), q = new T.Quaternion();
  for (const s of [-1, 1]) for (let u = 0; u < units; u++) {
    const z = -7 - u * 2;
    m.compose(v3(s * 2.05, 0.95, z + 1), q, v3(0.06, 1.9, 0.06)); uprights.push(m.clone());
    for (const y of tiers) { m.compose(v3(s * 2.05, y, z), q, v3(1.05, 0.03, 1.98)); boards.push(m.clone()); }
  }
  const inst = (geo: T.BufferGeometry, mat: T.Material, list: T.Matrix4[]) => {
    const im = new T.InstancedMesh(geo, mat, list.length); list.forEach((x, i) => im.setMatrixAt(i, x)); im.receiveShadow = true; g.add(im); return im;
  };
  inst(new T.BoxGeometry(1, 1, 1), shelfM, uprights); inst(new T.BoxGeometry(1, 1, 1), shelfM, boards);
  // products: boxes (cereal, chips, detergent) and cans, coloured from a bodega palette, with a printed label stripe
  const pal = [0xc8102e, 0xffd84a, 0x2962ff, 0x00a86b, 0xff7a1a, 0xf0f4f8, 0x6f23a8, 0xff2e63, 0x0b2a66, 0x9b5e2a];
  const lab = document.createElement('canvas'); lab.width = 64; lab.height = 128; const lx = lab.getContext('2d')!;
  lx.fillStyle = '#fff'; lx.fillRect(0, 0, 64, 128); lx.fillStyle = 'rgba(0,0,0,0.35)'; lx.fillRect(0, 40, 64, 30); lx.fillStyle = 'rgba(255,255,255,0.8)'; lx.fillRect(8, 48, 48, 6); lx.fillRect(8, 58, 30, 4);
  const labT = new T.CanvasTexture(lab); labT.colorSpace = T.SRGBColorSpace;
  const prodM = new T.MeshStandardMaterial({ map: labT, roughness: 0.55 });
  const canM = new T.MeshStandardMaterial({ map: labT, roughness: 0.3, metalness: 0.5 });
  const boxes: [T.Matrix4, number][] = [], cans: [T.Matrix4, number][] = [];
  const artSlots = new Set<string>();
  art.forEach((_, i) => artSlots.add(`${i % 2 ? 1 : -1}:${2 + i * 2}`)); // every other unit near the door carries a New Yorker
  for (const s of [-1, 1]) for (let u = 0; u < units; u++) {
    const z0 = -7 - u * 2 - 0.95;
    for (let ti = 0; ti < tiers.length; ti++) {
      if (artSlots.has(`${s}:${u}`) && (ti === 2 || ti === 3)) continue;
      const y = tiers[ti] + 0.015;
      let z = z0 + 0.04;
      const kind = (u * 7 + ti * 3 + (s > 0 ? 1 : 0)) % 5;
      while (z < z0 + 1.9) {
        const col = pal[Math.floor(rnd() * pal.length)];
        if (kind === 0 || kind === 3) { // cans
          const r = 0.035 + rnd() * 0.012, h = 0.1 + rnd() * 0.06;
          for (let d = 0; d < 3; d++) { m.compose(v3(s * (2.05 - 0.14 - d * 0.12), y + h / 2, z + r), q, v3(r, h, r)); cans.push([m.clone(), col]); }
          z += r * 2 + 0.006;
        } else {
          const w = 0.06 + rnd() * 0.14, h = 0.16 + rnd() * 0.24, dd = 0.14 + rnd() * 0.14;
          m.compose(v3(s * (2.05 - 0.04 - dd / 2 - 0.1), y + h / 2, z + w / 2), q.setFromEuler(new T.Euler(0, s > 0 ? -Math.PI / 2 : Math.PI / 2, 0)), v3(w, h, dd));
          boxes.push([m.clone(), col]); q.identity();
          z += w + 0.008;
        }
      }
    }
  }
  const fill = (geo: T.BufferGeometry, mat: T.Material, list: [T.Matrix4, number][]) => {
    const im = new T.InstancedMesh(geo, mat, list.length), c = new T.Color();
    list.forEach(([x, col], i) => { im.setMatrixAt(i, x); im.setColorAt(i, c.setHex(col)); });
    g.add(im); return im;
  };
  fill(new T.BoxGeometry(1, 1, 1), prodM, boxes);
  fill(new T.CylinderGeometry(1, 1, 1, 8), canM, cans);

  // the New Yorkers on the shelves, at eye level, between the products
  art.forEach((a, i) => {
    const s = i % 2 ? 1 : -1, u = 2 + i * 2, z = -7 - u * 2;
    // angled toward the door like a display, so the aisle reads as a gallery from the entrance
    hang(g, a, v3(s * 1.2, 1.42, z), s > 0 ? -Math.PI / 2 + 0.55 : Math.PI / 2 - 0.55, 1.5, { frame: 'brass' });
  });
  // the long fluorescent run: tubes every 2.4 m, one instanced mesh, plus a few real lights near the door
  const tubes: T.Matrix4[] = [];
  for (let z = -1; z > -L; z -= 2.4) for (const x of [-0.6, 0.6]) { m.compose(v3(x, 3.17, z), q, v3(0.08, 0.05, 1.5)); tubes.push(m.clone()); }
  inst(new T.BoxGeometry(1, 1, 1), new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xeaf6ff, emissiveIntensity: 3.2 }), tubes);
  for (const z of [-2, -9, -18]) { const l = new T.PointLight(0xeaf6ff, 16, 12, 1.6); l.position.set(0, 2.9, z); g.add(l); }
  g.add(new T.HemisphereLight(0xdfe8ff, 0x3a3328, 0.95));
  // hanging aisle signs with distance markers
  const SIGNS = [['AISLE 1 OF 1', 'EVERYTHING'], ['OAT MILK', 'ALSO REGULAR MILK . ALSO A BOAT'], ['100 FT', 'KEEP GOING'], ['CAT FOOD', 'DOG FOOD . RAT FOOD (DO NOT ASK)'],
    ['500 FT', 'STILL THE SAME STORE'], ['PAPER TOWELS', 'AND THE LAST ROLL OF 1987'], ['1/4 MILE', 'NO WE DO NOT HAVE A BATHROOM'], ['THE BACK', 'IS FURTHER BACK'], ['1/2 MILE', 'WE HAVE IT. SOMEWHERE']];
  SIGNS.forEach((s, i) => {
    const z = -10 - i * 28;
    sign(g, s, 1.9, 0.5, v3(0, 2.65, z), 0, { bg: '#0b2a66', ink: '#f0f4f8', glow: 1.3 });
    box(g, 0.02, 0.4, 0.02, -0.7, 3.0, z, shelfM, false); box(g, 0.02, 0.4, 0.02, 0.7, 3.0, z, shelfM, false);
  });
  // paint creeps in from the street door and pools at the markers
  addThreshold(at(0, 1.5, 0), 3.2);
  for (let i = 1; i < 6; i++) addThreshold(at(0, 2.5, -40 * i), 5 + i * 2);
  drips(g, v3(-0.6, 2.75, -0.05), v3(0.6, 2.75, -0.05), 22, 31, 1.6);
  // wheatpaste and stickers on the cooler doors by the entrance
  const cool = new T.MeshStandardMaterial({ color: 0x0a1630, emissive: 0x0d2a5a, emissiveIntensity: 0.8, roughness: 0.15, metalness: 0.2 });
  box(g, 0.1, 2.3, 3.4, -2.45, 1.15, -3.2, cool);
  for (let i = 0; i < 3; i++) poster(g, ctx.m.posters[(i * 11 + 4) % ctx.m.posters.length].f, ctx.m.posters[(i * 11 + 4) % ctx.m.posters.length].ar, v3(-2.38, 1.55, -1.9 - i * 1.1), Math.PI / 2, 0.95, 40 + i);
  const marks = ctx.m.stickers.filter((s) => s.kind === 'mark');
  for (let i = 0; i < 14; i++) { const s = marks[(i * 5) % marks.length]; sticker(g, s.f, s.ar, v3(-2.38, 0.5 + rnd() * 1.9, -1.4 - rnd() * 3.6), Math.PI / 2, 0.12 + rnd() * 0.1, (rnd() - 0.5)); }
  // the aisle never ends: the ImageGen aisle as a depth plate past the last shelf
  const pl = plate(g, 'aisle_end', { tanH: 0.7, eye: 1.65, far: 160, tear: 3 }); pl.position.set(0, 0, -L + 6);

  const walk: Rect[] = [[-2.4, -L + 4, 2.4, 0.6]];
  const block: Rect[] = [[1.5, -4.5, 2.5, -0.7], [-2.6, -5, -2.3, -1.4]];
  for (const s of [-1, 1]) block.push([s > 0 ? 1.45 : -2.6, -L, s > 0 ? 2.6 : -1.45, -6]);
  return {
    id: 'bodega', name: 'Infinity Deli', line: 'Aisle 1 of 1. It goes back about a mile. They have it.',
    origin: O, group: g,
    spawn: { at: at(0, 1.65, -1.4), look: at(0, 1.6, -40) },
    views: [
      { name: 'The aisle', note: 'Nine metres wide outside. A mile deep inside. Rent is the same.', at: at(0, 1.65, -2), look: at(0, 1.5, -80) },
      { name: 'The cat', note: 'Not for sale. Has been asked.', at: at(0.6, 1.5, -2.6), look: at(1.95, 1.2, -2.4) },
      { name: 'The quarter mile', note: 'Still the same store. Look back at the door.', at: at(0, 1.65, -130), look: at(0, 1.6, 0) },
      { name: 'The back', note: 'The back is further back.', at: at(0, 1.65, -250), look: at(0, 1.6, -400) },
    ],
    doors: { street: { pos: at(0, 0, 0), rotY: Math.PI }, cam: { pos: at(0, 1.7, -0.5), rotY: Math.PI } },
    walk, block,
    bg: new T.Color(0x0b0f1c), fog: new T.FogExp2(0x1a2236, 0.006), exposure: 0.9,
    floorY: () => O.y,
    tick(t, _dt, _cam) { if (!ctx.still) catLoaf.children[0].rotation.y = Math.sin(t * 1.3) * 0.25; },
  };
}

/** The stand in bodega cat: a loaf with ears and a tail, orange tabby. Shown only until cat.glb arrives. */
function bodegaCat() {
  const g = new T.Group(), fur = new T.MeshStandardMaterial({ color: 0xd8873a, roughness: 0.85 }), dark = new T.MeshStandardMaterial({ color: 0x1a120c });
  const tail = new T.Group(); g.add(tail);
  const body = new T.Mesh(new T.CapsuleGeometry(0.11, 0.2, 6, 12), fur); body.rotation.z = Math.PI / 2; body.position.y = 0.11; g.add(body);
  const head = new T.Mesh(new T.SphereGeometry(0.085, 16, 12), fur); head.position.set(0.19, 0.18, 0); g.add(head);
  for (const z of [-0.045, 0.045]) {
    const e = new T.Mesh(new T.ConeGeometry(0.03, 0.06, 4), fur); e.position.set(0.19, 0.27, z); g.add(e);
    const eye = new T.Mesh(new T.SphereGeometry(0.012, 8, 6), new T.MeshStandardMaterial({ color: 0x9fd86a, emissive: 0x3a6a10 })); eye.position.set(0.265, 0.19, z * 0.8); g.add(eye);
  }
  const tl = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([v3(-0.2, 0.08, 0), v3(-0.3, 0.12, 0.08), v3(-0.32, 0.25, 0.12), v3(-0.28, 0.32, 0.05)]), 16, 0.022, 8), fur);
  tail.add(tl);
  const nose = new T.Mesh(new T.SphereGeometry(0.01, 6, 4), dark); nose.position.set(0.275, 0.17, 0); g.add(nose);
  g.traverse((o) => { if ((o as T.Mesh).isMesh) o.castShadow = true; });
  void INK;
  return g;
}
