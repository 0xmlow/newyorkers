/* Upgrade batch six (2026-10-01): the statue herself.

   liberty2 (up1.ts) rebuilt the island, the pedestal and the climb, but the figure
   was still made in code: a lathed cone for the robe, a squashed sphere for the
   shoulders, two beams for an arm. From the dock it read as a green traffic cone
   with a torch. MLow's ruling: replace it with a real model.

   The figure is now "Statue Of Liberty" by Gravity Jack, sculpted in ZBrush and
   textured in Substance Painter, CC BY 4.0:
   https://sketchfab.com/3d-models/statue-of-liberty-84094e8d5e724b5c882cf576ca12e44e
   The licence asks for credit, which is the plaque on the walk up from the dock.
   assets/museum/props/liberty_statue.glb is that model with its six 2k textures cut
   to 1k (13 MB to 2 MB) and a hole cut in her plinth slab where the stair comes up.

   She is 45.7 units heel to flame, the hand built figure was 45, so she goes in at
   scale 1 turned a quarter (rotY -PI/2) to face the dock. Everything on the island
   and inside the pedestal is liberty2's, untouched. What changed is inside her: the
   old helix narrowed from 4.4 to 1 and would have come straight through the robe.
   The inside of the model was measured in Blender, height by height, as the
   widest circle that fits within the shell (BODY below). The stair is now a tight
   spiral of radius 1.85 round Eiffel's pylon, which is close to the real one, up to
   the shoulders, then a straight climb up the neck to a platform in the head.

   Not reproduced: the crown windows are painted on the texture, not cut, so the
   harbour cannot be seen through them from inside. */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as X from '../textures';
import { v, type Mount } from '../kit';
import type { RoomDef } from './types';
const PI = Math.PI;
type K = Parameters<RoomDef['build']>[0];
const ONE = new T.Vector3(1, 1, 1);

function hollowBox(k: K, w: number, h: number, d: number, x: number, y: number, z: number, m: T.Material, t: number) {
  k.box(w, h, t, x, y, z - d / 2 + t / 2, m);
  k.box(w, h, t, x, y, z + d / 2 - t / 2, m);
  k.box(t, h, d - t * 2, x - w / 2 + t / 2, y, z, m);
  k.box(t, h, d - t * 2, x + w / 2 - t / 2, y, z, m);
}
function figureGeo(r = 0.2, len = 0.82, headY = 1.35) {
  const body = new T.CapsuleGeometry(r, len, 3, 8); body.translate(0, r + len / 2, 0);
  const head = new T.SphereGeometry(r * 0.62, 8, 6); head.translate(0, headY, 0);
  return mergeGeometries([body, head])!;
}
/* The inside of the model, measured: height above her plinth, the centre of the
   widest circle that fits inside the copper at that height (room x, z), its radius. */
const BODY: [number, number, number, number][] = [
  [1.5, 0.45, -2.0, 2.7], [3, 0.5, -2.1, 2.85], [5, 0.5, -1.8, 2.85], [7, 0.9, -1.45, 2.85],
  [9, 1.0, -1.0, 3.1], [12, 1.3, -0.7, 3.3], [15, 1.3, -0.2, 3.15], [18, 1.1, 0.2, 3.05],
  [21, 0.9, 0.1, 3.1], [24, 0.9, 0.0, 2.99], [25.5, 0.4, 0.3, 2.75], [26.5, 0.6, -0.1, 2.2],
];
function body(h: number) {
  if (h <= BODY[0][0]) return { x: BODY[0][1], z: BODY[0][2], r: BODY[0][3] };
  for (let i = 1; i < BODY.length; i++) if (h <= BODY[i][0]) {
    const a = BODY[i - 1], b = BODY[i], u = (h - a[0]) / (b[0] - a[0]);
    return { x: a[1] + (b[1] - a[1]) * u, z: a[2] + (b[2] - a[2]) * u, r: a[3] + (b[3] - a[3]) * u };
  }
  const l = BODY[BODY.length - 1]; return { x: l[1], z: l[2], r: l[3] };
}
/* the room in her head, measured the same way, and her flame */
const HEAD = { x: 1.3, z: -0.65, floor: 30.6, r: 1.15 };
const FLAME = { x: -2.85, top: 45.67, z: 3.45 };

/* ---------------- 45 THE CLIMB TO THE CROWN (batch six: the real figure) ---------------- */
export const liberty3: RoomDef = {
  id: 'liberty',
  name: 'The climb to the crown',
  area: 'LIBERTY ISLAND',
  mood: 'Harbor morning',
  color: '#7fb8a8',
  description: 'The eleven pointed star of the old fort, Hunt\'s pedestal on top of it, and then the spiral inside the copper: up the armature Eiffel built, past the works hung on the inner wall, to the room in her head under the seven rays of the crown. Ferries come and go below all morning and the gulls never land.',
  signatures: 'The eleven pointed star of Fort Wood, Richard Morris Hunt\'s granite pedestal, the green copper robe and the raised right arm with the torch, the seven rayed crown and its twenty five windows, the tablet reading JULY IV MDCCLXXVI held across her body, the broken chains at her feet, Eiffel\'s iron armature and the helix stair, and the harbour with its ferries and the city beyond.',
  build(k, ctx) {
    k.sky({ top: 0x3d7ec4, horizon: 0xc6dbea, ground: 0x4a5a5c, fog: 0.0009, sun: { az: 2.4, el: 0.5, color: 0xfff6e8, size: 10 }, env: 1.0 });
    k.hemi(0xd6e6ff, 0x6a6a5e, 0.8);
    k.sun(0xfff0dc, 2.3, 60, 70, 40, true, 130);
    const copper = k.pbr('lbCopper', X.patina(0x5f9a8c), 0.55, { roughness: 0.62, metalness: 0.25, side: T.DoubleSide }),
      copperIn = k.pbr('lbCopperIn', X.patina(0x4a7f74), 0.6, { roughness: 0.75, metalness: 0.2, side: T.BackSide }),
      granite = k.pbr('lbGranite', X.ashlar(0xa89c88, 88, 3), 0.24),
      fortS = k.pbr('lbFort', X.ashlar(0x7a7268, 89, 2), 0.2),
      iron = k.flat(0x3a2e26, 0.55, 0.62),
      ironL = k.flat(0x5a4a3e, 0.5, 0.6),
      tread = k.pbr('lbTread', X.steel(0x7a7c80, true, 90), 0.8, { metalness: 0.5, roughness: 0.5 }),
      glass = k.glass(0xe8f4f8, 0.1, 0.04),
      glowT = k.glow(0xffd070),
      lawn = k.pbr('lbLawn', X.grass(0x4b6b3a, 47), 0.07),
      paving = k.pbr('lbPath', X.pavers(0x9a9488, 49), 0.4),
      wood = k.flat(0x5a4632, 0, 0.8),
      hull = k.flat(0x1d2a33, 0.3, 0.6);
    /* the harbour, the island, the fort, the far shores */
    k.water({ y: -1.2, color: 0x2e5468, w: 1000, d: 1000, amp: 1.0 });
    k.mesh(new T.CylinderGeometry(70, 74, 2, 11), lawn, 0, -0.9, 0);
    { const star = new T.Shape();
      for (let i = 0; i < 22; i++) { const a = (i / 22) * PI * 2, r = i % 2 ? 24 : 34; if (i === 0) star.moveTo(Math.cos(a) * r, Math.sin(a) * r); else star.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      star.closePath();
      const g = new T.ExtrudeGeometry(star, { depth: 6, bevelEnabled: false }); g.rotateX(-PI / 2);
      k.mesh(g, fortS, 0, 0, 0);
    }
    /* the pedestal, hollow, because the stair goes up the middle of it */
    k.mesh(new T.CylinderGeometry(15, 16, 8, 8), granite, 0, 10, 0);
    hollowBox(k, 22, 18, 22, 0, 23, 0, granite, 1.1);
    for (let i = 0; i < 4; i++) hollowBox(k, 23 - i * 0.5, 0.8, 23 - i * 0.5, 0, 14.4 + i * 5.7, 0, granite, 1.1);
    hollowBox(k, 24, 2, 24, 0, 33, 0, granite, 1.1);
    hollowBox(k, 25.4, 1, 25.4, 0, 34.5, 0, granite, 1.2);
    for (let i = 0; i < 4; i++) { const a = i * PI / 2 + PI / 4; k.column(Math.cos(a) * 13, 14.8, Math.sin(a) * 13, 16, 1.1, granite, false, granite); }
    k.skyline({ z: -430, count: 44, spacing: 9, scale: 2.8, base: -1.2, seed: 112, lit: 0.3, glow: 0.7, tint: 0x6e7684, spires: true });
    k.skyline({ z: -330, count: 12, spacing: 12, scale: 0.9, base: -1.2, seed: 113, lit: 0.2, glow: 0.5, tint: 0x8a6a5a, rows: 1, x: -250 });
    /* the walk up from the dock: nothing on the sightline, she is the reason you came */
    k.box(9, 0.4, 44, 0, 1.0, 36, paving);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2, x = Math.cos(a) * 52, z = Math.sin(a) * 52 + 4; if (Math.abs(x) < 17 && z > -6) continue; k.tree(x, 1.0, z, { h: 6.5, r: 3.0, kind: 'round', seed: i, leaf: 0x30582c }); }
    for (const s of [-1, 1]) for (let i = 0; i < 5; i++) k.bench(s * 9, 44 - i * 7, s > 0 ? -PI / 2 : PI / 2, wood, iron, 2.2);
    { k.cyl(0.14, 20, 24, 11, 22, k.flat(0xd8d2c4, 0.4, 0.5), 0.1, 10);
      const flag = k.mesh(new T.PlaneGeometry(4.2, 2.6), k.flat(0xcf3a3a, 0, 0.85, { side: T.DoubleSide }), 24, 19.4, 22, true);
      flag.geometry.translate(2.1, 0, 0);
      if (!ctx.reduced) k.ticks.push((t) => { flag.rotation.y = 0.7 + 0.32 * Math.sin(t * 1.9) + 0.1 * Math.sin(t * 4.7); flag.rotation.z = 0.05 * Math.sin(t * 3.1); });
    }
    /* the dock and the ferries, one in and one out all morning */
    k.box(16, 1.4, 7, 0, 0.3, 62, wood);
    for (let i = 0; i < 6; i++) k.cyl(0.4, 6, -7 + i * 2.8, -1.5, 65, wood, 0.4, 8);
    if (!ctx.reduced) {
      for (let i = 0; i < 3; i++) {
        const g = new T.Group();
        const h = new T.Mesh(new T.BoxGeometry(9, 4.2, 34), hull); h.position.y = 1.4; g.add(h);
        const deck = new T.Mesh(new T.BoxGeometry(9.4, 0.4, 34), k.flat(0xd8d2c4, 0.2, 0.6)); deck.position.y = 3.6; g.add(deck);
        const cab = new T.Mesh(new T.BoxGeometry(7, 3.4, 16), k.flat(0xe8e2d4, 0.2, 0.6)); cab.position.set(0, 5.3, -2); g.add(cab);
        const stack = new T.Mesh(new T.CylinderGeometry(1.0, 1.1, 4, 10), k.flat(0x8a2a2a, 0.2, 0.7)); stack.position.set(0, 8.4, -4); g.add(stack);
        k.add(g);
        const route = k.spline([v(0, -0.6, 78), v(-90 - i * 30, -0.6, 92), v(-200, -0.6, -60), v(-60, -0.6, -150), v(90 + i * 20, -0.6, -60), v(60, -0.6, 92)], true);
        k.rider(g, route, 5 + i * 1.4, i * 120);
      }
      k.crowd([v(-6, 1.2, 58), v(-4, 1.2, 34), v(-2, 1.2, 20), v(0, 1.2, 13)], 22, { seed: 61, speed: 0.22, spread: 1.6, colors: [0xe83a5a, 0x3a8ae8, 0xf0d24a, 0x2a2a34, 0xe8e2d4, 0x8a4ad8, 0xff8c3b] });
      k.crowd([v(-40, 1.2, 30), v(0, 1.2, 46), v(40, 1.2, 30), v(46, 1.2, -6), v(0, 1.2, -30), v(-46, 1.2, -6)], 26, { seed: 62, speed: 0.4, spread: 3.0, closed: true });
      const NG = 26, bodyG = new T.ConeGeometry(0.16, 0.8, 5); bodyG.rotateX(PI / 2);
      const gulls = k.instances(bodyG, k.flat(0xdde2e6, 0, 0.85), Array.from({ length: NG }, () => new T.Matrix4()));
      const wings = k.instances(new T.BoxGeometry(1.5, 0.04, 0.34), k.flat(0xe8ecee, 0, 0.9), Array.from({ length: NG }, () => new T.Matrix4()));
      gulls.frustumCulled = wings.frustumCulled = false;
      const rnd = X.mulberry(9), st = Array.from({ length: NG }, () => ({ a: rnd() * PI * 2, r: 60 + rnd() * 70, y: 18 + rnd() * 40, w: 0.5 + rnd() * 0.6, f: rnd() * 6.3 }));
      const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), sc = new T.Vector3(), up = new T.Vector3(0, 1, 0);
      k.ticks.push((t) => {
        st.forEach((b, i) => {
          const a = b.a + t * 0.16 * b.w;
          p.set(Math.cos(a) * b.r, b.y + Math.sin(t * 0.6 + b.f) * 2.2, Math.sin(a) * b.r);
          q.setFromAxisAngle(up, -a + PI / 2);
          m.compose(p, q, ONE); gulls.setMatrixAt(i, m);
          sc.set(1, 1, 0.3 + 0.7 * Math.abs(Math.sin(t * 5 + b.f)));
          m.compose(p, q, sc); wings.setMatrixAt(i, m);
        });
        gulls.instanceMatrix.needsUpdate = wings.instanceMatrix.needsUpdate = true;
      });
    }
    /* The figure: Gravity Jack's model, at scale 1, a quarter turn to face the dock.
       Double sided, because the climb is inside her and the inside is copper too. */
    const SY = 35;
    k.prop('liberty_statue', 0, SY, 0, { scale: 1, rotY: -PI / 2 }).then((o) => {
      if (!o) return;
      o.traverse((c) => { if (c instanceof T.Mesh) for (const m of (Array.isArray(c.material) ? c.material : [c.material])) m.side = T.DoubleSide; });
    });
    /* the flame is painted gold on the model; the light comes from here */
    k.mesh(new T.SphereGeometry(0.42, 14, 10), glowT, FLAME.x, SY + FLAME.top - 0.9, FLAME.z);
    k.point(FLAME.x, SY + FLAME.top - 0.3, FLAME.z, 0xffd070, 300 + 1400 * k.night, 70);
    k.egg(v(7.9, SY + 21.9, -0.8), { id: 'the-tablet', title: 'What the tablet says', year: '1776', text: 'The tabula ansata in her left hand is inscribed JULY IV MDCCLXXVI, the fourth of July 1776, the date on the Declaration of Independence.', clue: 'She is carrying a book you can read from the ground, if you know Roman numerals.', source: { name: 'Statue of Liberty, Wikipedia', url: 'https://en.wikipedia.org/wiki/Statue_of_Liberty' } }, { r: 4.5 });
    /* the credit the model's licence asks for, on the walk up from the dock */
    k.sign('STATUE MODEL: GRAVITY JACK, CC BY 4.0', 3.4, 0.42, 4.75, 1.7, 50, '#22302e', '#e8e2d4', 46, -PI / 2);
    /* inside: the lobby, the shaft, the pylon, the helix and the crown platform.
       In the pedestal the stair is liberty2's, radius 6.5 at the same pitch, so the
       works hung there still meet the visitor where they did. From eight below her
       feet it pulls in to the measured axis of the figure and tightens to 1.85. */
    const helixTop = SY + 25, MTOP = SY + 31.9, lowPitch = (MTOP - 4) / 9;
    const axis = (y: number) => {
      const b = body(Math.max(2, y - SY)), rIn = Math.min(1.85, b.r - 1.0);
      if (y <= SY - 8) return { x: 0, z: 0, r: 6.5, pitch: lowPitch };
      if (y < SY - 0.5) { const u = T.MathUtils.smoothstep(y, SY - 8, SY - 0.5); return { x: b.x * u, z: b.z * u, r: 6.5 + (rIn - 6.5) * u, pitch: lowPitch + (4.2 - lowPitch) * u }; }
      return { x: b.x, z: b.z, r: rIn, pitch: 4.2 };
    };
    const helix: T.Vector3[] = [];
    { let a = 0; for (let y = 4; y <= helixTop; y += 0.05) { const c = axis(y); helix.push(v(c.x + Math.cos(a) * c.r, y, c.z + Math.sin(a) * c.r)); a += (0.05 / c.pitch) * PI * 2; } }
    const NS = 1100;
    const stair = k.spline(helix, false, 0.5);
    const sp = stair.getSpacedPoints(NS);
    { const treadG = new T.BoxGeometry(1.5, 0.08, 0.36), tm: T.Matrix4[] = [];
      const tan = new T.Vector3(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0), sc = new T.Vector3();
      for (let i = 0; i < NS; i += 2) { const p = sp[i]; stair.getTangentAt(i / NS, tan); q.setFromAxisAngle(up, Math.atan2(tan.x, tan.z)); sc.set(p.y > SY - 1 ? 1.1 / 1.5 : 1, 1, 1); tm.push(new T.Matrix4().compose(p.clone().add(v(0, -0.9, 0)), q, sc)); }
      k.instances(treadG, tread, tm);
    }
    k.curve(sp.filter((_, i) => i % 3 === 0).map((p) => p.clone().add(v(0, 0.1, 0))), 0.045, ironL, 360);
    /* Eiffel's pylon: straight up the pedestal, then following the figure's axis */
    k.cyl(0.7, SY - 12, 0, 4 + (SY - 12) / 2, 0, iron, 0.7, 12);
    { const pp: T.Vector3[] = []; for (let y = SY - 8; y <= helixTop - 1; y += 1) { const c = axis(y); pp.push(v(c.x, y, c.z)); } k.curve(pp, 0.45, iron, 60); }
    /* and his armature: sixteen ribs just inside the copper, hooped */
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * PI * 2, pts: T.Vector3[] = [];
      for (let h = 1.5; h <= 26.5; h += 1.5) { const b = body(h), rr = b.r - 0.35; pts.push(v(b.x + Math.cos(a) * rr, SY + h, b.z + Math.sin(a) * rr)); }
      k.curve(pts, 0.09, iron, 24);
    }
    for (let h = 2; h < 26; h += 3) { const b = body(h); k.torus(b.r - 0.35, 0.055, b.x, SY + h, b.z, iron, 26).rotation.x = PI / 2; }
    k.mesh(new T.CylinderGeometry(9.5, 9.5, SY - 4, 26, 1, true), k.pbr('lbInner', X.ashlar(0xb4ada0, 91, 3), 0.7, { side: T.BackSide }), 0, (SY + 4) / 2, 0);
    k.mesh(new T.CylinderGeometry(9.5, 9.5, 0.4, 26), k.pbr('lbFloor', X.terrazzo(0xb8b0a0, 48), 0.4), 0, 3.8, 0);
    k.arch(4, 6, 3, 0, 4, 11.5, granite, false, 0.7);
    k.block(-12, -2.2, 10, 12); k.block(2.2, 12, 10, 12);
    for (let i = 0; i < 12; i++) k.box(5, 0.34, 1.2, 0, 0.17 + i * 0.32, 22 - i * 1.0, granite);
    /* the shaft is lit like a stairwell: a lamp on the axis and a warm one at each work */
    for (let y = 7; y < helixTop; y += 6) { const c = axis(y); k.point(c.x, y, c.z, 0xffe8cc, y > SY ? 60 : 110, y > SY ? 14 : 26); }
    for (let y = 11; y < SY; y += 6) { const a = (y / (MTOP - 4)) * PI * 2 * 9 + 0.55; k.point(Math.cos(a) * 8.2, y + 1.6, Math.sin(a) * 8.2, 0xffdcae, 34, 11); }
    k.point(0, 6.4, 0, 0xffeed2, 150, 22);
    /* the climbers on the stair ahead of you */
    if (!ctx.reduced) {
      const NC = 16;
      const climbers = k.instances(figureGeo(0.17, 0.5, 1.05), new T.MeshStandardMaterial({ roughness: 0.88 }), Array.from({ length: NC }, () => new T.Matrix4()));
      climbers.frustumCulled = false;
      const rnd = X.mulberry(33), c = new T.Color(), pal = [0xe83a5a, 0x3a8ae8, 0xf0d24a, 0x2a2a34, 0xe8e2d4, 0x8a4ad8, 0xff8c3b, 0x2a8a4a];
      const off = Array.from({ length: NC }, () => rnd());
      for (let i = 0; i < NC; i++) climbers.setColorAt(i, c.set(pal[Math.floor(rnd() * pal.length)]));
      if (climbers.instanceColor) climbers.instanceColor.needsUpdate = true;
      const m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), tan = new T.Vector3(), up = new T.Vector3(0, 1, 0), sc = new T.Vector3();
      k.ticks.push((t) => {
        for (let i = 0; i < NC; i++) {
          const u = (off[i] + t * 0.006) % 1;
          stair.getPointAt(u, p); stair.getTangentAt(u, tan);
          q.setFromAxisAngle(up, Math.atan2(tan.x, tan.z));
          sc.set(1, 0.9 + 0.08 * Math.sin(t * 6 + i), 1);
          m.compose(p, q, sc); climbers.setMatrixAt(i, m);
        }
        climbers.instanceMatrix.needsUpdate = true;
      });
    }
    /* up the neck: a short steep stair from the top of the spiral to her head */
    const top = axis(helixTop), CY = SY + HEAD.floor;
    const neck = [v(top.x, helixTop, top.z), v(0.9, SY + 27.5, -0.3), v(1.1, SY + 29.3, -0.6), v(HEAD.x, CY, HEAD.z)];
    { const ns = k.spline(neck, false, 0.5);
      for (let i = 1; i < 18; i++) { const p = ns.getPointAt(i / 18); const r = k.box(0.9, 0.06, 0.28, p.x, p.y - 0.05, p.z, tread); r.rotation.y = 0.4; }
      k.curve(ns.getSpacedPoints(20).map((p) => p.clone().add(v(0.45, 0.9, 0))), 0.03, ironL, 40);
    }
    /* the crown: the platform inside her head */
    k.mesh(new T.CylinderGeometry(HEAD.r, HEAD.r, 0.2, 24), tread, HEAD.x, CY - 0.1, HEAD.z);
    k.torus(HEAD.r - 0.05, 0.04, HEAD.x, CY + 0.9, HEAD.z, iron, 26).rotation.x = PI / 2;
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2, r = HEAD.r - 0.05; k.beam(v(HEAD.x + Math.cos(a) * r, CY, HEAD.z + Math.sin(a) * r), v(HEAD.x + Math.cos(a) * r, CY + 0.9, HEAD.z + Math.sin(a) * r), 0.03, iron, 5); }
    k.point(HEAD.x, CY + 1.4, HEAD.z, 0xffe8cc, 7, 5);
    /* the works: the lobby wall, the inner wall of the pedestal, and two in her head.
       The pedestal mounts are liberty2's exactly. */
    const mounts: Mount[] = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * PI * 2 + PI / 8, r = 9.28;
      mounts.push({ position: v(Math.cos(a) * r, 7.0, Math.sin(a) * r), rotation: -a - PI / 2, target: v(Math.cos(a) * 4.6, 6.6, Math.sin(a) * 4.6), width: 3.4, height: 2.1, style: 'gilt', wash: true });
    }
    for (let i = 0; i < 14; i++) {
      const y = 10.5 + i * 1.6, a = (y / (MTOP - 4)) * PI * 2 * 9 + 0.55, r = 9.28;
      mounts.push({ position: v(Math.cos(a) * r, y, Math.sin(a) * r), rotation: -a - PI / 2, target: v(Math.cos(a) * 6.5, y, Math.sin(a) * 6.5), width: 2.2, height: 1.45, style: 'steel', wash: true });
    }
    for (const a of [PI * 1.2, PI * 1.8]) mounts.push({ position: v(HEAD.x + Math.cos(a) * 1.3, CY + 1.5, HEAD.z + Math.sin(a) * 1.3), rotation: -a - PI / 2, target: v(HEAD.x + Math.cos(a) * 0.3, CY + 1.5, HEAD.z + Math.sin(a) * 0.3), width: 0.7, height: 0.5, style: 'steel', wash: false });
    k.censusWall({ x: 0, y: 7.4, z: -9.24, rotY: 0, cols: 12, rows: 4, tile: 0.55, gap: 0.05, start: ctx.wallStart(300, 48), pieces: ctx.all, backing: iron });
    /* what the statue knows */
    const src = { name: 'Statue of Liberty, Wikipedia', url: 'https://en.wikipedia.org/wiki/Statue_of_Liberty' };
    k.egg(v(0, 3, 30), { id: 'dedicated-1886', title: 'The twenty eighth of October', year: '1886', text: 'The statue was dedicated on October 28, 1886. Frederic Auguste Bartholdi designed her; Gustave Eiffel built the iron framework that holds her up.', clue: 'Stand on the path and look up before you go inside.', source: src }, { r: 4.5 });
    k.egg(v(Math.cos(0.9) * 9.0, 6.6, Math.sin(0.9) * 9.0), { id: 'the-copper-skin', title: 'Thinner than two pennies', text: 'The copper skin is 0.094 inches thick, about 2.4 millimetres. She was reddish brown and shiny when she arrived; within twenty years the copper had oxidised to the green she is now.', clue: 'The whole figure is a sheet of metal you could bend in your hands, hung on iron.', source: src }, { r: 2.6 });
    k.egg(v(0, 24, 0), { id: 'the-armature', title: 'What Eiffel built', text: 'Inside the copper there is no stone at all: a central iron pylon with a lattice of bars springing off it, so the skin can move in the wind and in the heat without tearing. Eiffel drew it three years before he started his tower.', clue: 'Look up the middle of the shaft on the way past.', source: src }, { r: 5 });
    k.egg(v(HEAD.x, CY + 1.6, HEAD.z), { id: 'twenty-five-windows', title: 'Twenty five windows, seven rays', text: 'The crown has twenty five windows and seven rays. The rays have been read as the seven seas and the seven continents, though the research has never confirmed it.', clue: 'Count the openings around you, then count the spikes outside.', source: src }, { r: 3 });
    k.egg(v(0, 1.5, 44), { id: 'fort-wood', title: 'She stands in a fort', text: 'The eleven pointed star under the pedestal is Fort Wood, a working harbour battery. Richard Morris Hunt designed the pedestal to sit inside its walls.', clue: 'Walk up and look at the shape of the ground you are standing on.', source: src }, { r: 5 });
    k.egg(v(0.5, SY + 1.6, 3.6), { id: 'broken-chains', title: 'The chains nobody sees', text: 'A broken chain and shackle lie at her feet, marking the end of slavery after the Civil War. They are half hidden by the robe and almost impossible to see from the ground.', clue: 'Hardest egg on the island: look at her feet, not her face.', source: src }, { r: 3.6 });
    /* the route: up from the dock, into the lobby, the whole helix, the neck, the crown */
    const route = [v(0, 3, 58), v(0, 3, 44), v(0, 3, 30), v(0, 5.5, 18), v(0, 6.8, 12), v(0, 6.8, 4), v(3, 6.8, 0)];
    for (let i = 0; i <= NS; i += 3) route.push(sp[i].clone().add(v(0, 1.6, 0)));
    for (const p of neck.slice(1)) route.push(p.clone().add(v(0, 1.6, 0)));
    return { mounts, spawn: route[0].clone(), look: v(0, SY + 13, 0), eye: 3, bounds: [-64, 64, -64, 64], path: route, style: 'steel' };
  },
};
