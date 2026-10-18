import * as T from 'three';
import { pbr, prop } from '../core/assets';
import { box, floorPlane, sign, v3, seeded, type Rect } from '../core/kit';
import { contour, drips, eyeFlower, addThreshold, shared, INK } from '../core/mlow';
import { hang } from '../core/hang';
import { plate } from '../core/plate';
import { skyDome } from '../core/sky';
import { ORIGINS, type Ctx, type Room } from '../core/room';

// TAR BEACH. A tenement roof at night where the city does not stop at the horizon: it curls up in front of you and
// over your head like a rolled map, avenues and all, cabs running upside down, until the street above is the street
// behind you. Two thousand instanced buildings on the inside of a 170 m cylinder, their windows lit by a procedural
// shader; the Eye Flower sits where the city rolls round it. Behind you, over the parapet, the real block as a depth
// plate. Local: the roof is x -9 .. 9, z -9 .. 9 at y = 0; the city floor is 30 m down.

const R = 170, DOWN = 30;

export function buildRooftop(ctx: Ctx): Room {
  const O = ORIGINS.rooftop, g = new T.Group(); g.position.copy(O); ctx.scene.add(g);
  const rnd = seeded(113), art = ctx.m.art.rooftop, at = (x: number, y: number, z: number) => O.clone().add(v3(x, y, z));

  // ---------- the roof ----------
  const tar = pbr('asphalt', 1.5, { color: 0x2a2a30, roughness: 0.55 });
  const brick = contour(pbr('brick', 2, { color: 0x7d5c55 }), { coverage: 0.0, density: 9, glow: 2 });
  const cap = pbr('concrete', 1, { color: 0x9a948a });
  floorPlane(g, 18, 18, tar, 0, 0, 0);
  for (const [w, d, x, z] of [[18.4, 0.3, 0, -9.05], [18.4, 0.3, 0, 9.05], [0.3, 18.4, -9.05, 0], [0.3, 18.4, 9.05, 0]] as const) {
    box(g, w, 1.05, d, x, 0.52, z, brick); box(g, w + 0.1, 0.08, d + 0.12, x, 1.08, z, cap);
  }
  // the stair bulkhead (door down to the walk-up) and the laundry chute hut
  box(g, 3.2, 2.8, 2.6, -6.2, 1.4, 6.8, brick); box(g, 3.4, 0.15, 2.8, -6.2, 2.85, 6.8, cap);
  box(g, 2.4, 2.6, 2.2, 6.6, 1.3, 7.0, brick); box(g, 2.6, 0.15, 2.4, 6.6, 2.65, 7.0, cap);
  sign(g, ['STAIRS', 'TO THE FIFTH FLOOR'], 1.2, 0.36, v3(-6.2, 2.5, 5.48), 0, { bg: '#c8102e', ink: '#fff', glow: 1.2 });
  sign(g, ['LAUNDRY CHUTE', 'OUT ONLY'], 1.1, 0.34, v3(6.6, 2.3, 5.88), 0, { bg: '#2962ff', ink: '#fff', glow: 1.2 });
  // paint runs down the hut corners, not across the doorways (a doorway is a portal: whatever hangs in it shows on the far side)
  drips(g, v3(-7.82, 2.7, 5.6), v3(-7.82, 2.7, 6.6), 10, 117, 1.8); drips(g, v3(-4.58, 2.7, 5.6), v3(-4.58, 2.7, 6.6), 10, 119, 1.8); drips(g, v3(7.82, 2.5, 6.0), v3(7.82, 2.5, 7.0), 10, 118, 1.6);
  addThreshold(at(-6.2, 1.2, 5.5), 2.4); addThreshold(at(6.6, 1.2, 5.9), 2.4);
  // the water tower, the witness, the garden, the chairs, the string lights
  const wt = prop('water_tower', 8); wt.position.set(5.6, 0, -5.4); g.add(wt);
  const witness = prop('bronze_figure', 1.75); witness.position.set(0.4, 0, -7.6); witness.rotation.y = Math.PI; g.add(witness);
  for (const [n, x, z] of [['blossom_01', -7.3, -3], ['blossom_03', -7.3, 0.5], ['blossom_01', -7.3, 3.6]] as const) {
    box(g, 1.2, 0.5, 1.2, x, 0.25, z, pbr('planks', 0.6, { color: 0x5a3b26 }));
    const b = prop(n, 1.6); b.position.set(x, 0.5, z); g.add(b);
  }
  for (const [x, z] of [[-2.2, 2.5], [-0.6, 3.0], [2.4, 2.2]]) { const c = prop('quiet_bench', 0.85); c.position.set(x, 0, z); c.rotation.y = Math.PI + (rnd() - 0.5) * 0.6; g.add(c); }
  const bulbs: T.Matrix4[] = [], m = new T.Matrix4(), q = new T.Quaternion();
  for (let i = 0; i <= 40; i++) { const t = i / 40, x = -8.5 + t * 17, y = 3.2 - Math.sin(t * Math.PI) * 0.9 + Math.sin(t * Math.PI * 6) * 0.15; m.compose(v3(x, y, -1.5), q, v3(0.07, 0.07, 0.07)); bulbs.push(m.clone()); }
  const bl = new T.InstancedMesh(new T.SphereGeometry(1, 10, 8), new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffc27a, emissiveIntensity: 5 }), bulbs.length);
  bulbs.forEach((x, i) => bl.setMatrixAt(i, x)); g.add(bl);
  for (const x of [-9, 9]) box(g, 0.06, 3.4, 0.06, x * 0.97, 1.7, -1.5, new T.MeshStandardMaterial({ color: 0x15171c }), false);
  // the hang: billboard frames along the parapets, facing in
  art.forEach((a, i) => {
    const side = i < 5 ? 'L' : i < 10 ? 'R' : 'B';
    if (side === 'L') hang(g, a, v3(-8.85, 1.85, -6 + (i % 5) * 2.4).setY(1.9), Math.PI / 2, 1.7, { frame: 'black' });
    else if (side === 'R') hang(g, a, v3(8.85, 1.9, -6 + (i % 5) * 2.4), -Math.PI / 2, 1.7, { frame: 'black' });
    else hang(g, a, v3(-7.4 + (i - 10) * 2.15, 1.75, -8.85), 0, 1.6, { frame: 'black' });
  });
  for (const [x, z, ry] of [[-8.9, 0, Math.PI / 2], [8.9, 0, -Math.PI / 2]] as const) box(g, 0.1, 2.6, 12.5, x, 1.9, z, new T.MeshStandardMaterial({ color: 0x1a1d24, roughness: 0.6 }), false), void ry;
  box(g, 9.0, 2.4, 0.1, -4.2, 1.8, -8.92, new T.MeshStandardMaterial({ color: 0x1a1d24, roughness: 0.6 }), false);

  // ---------- the city that folds ----------
  // a cylinder of radius R along x; its bottom is the city floor DOWN metres below the roof, just past the parapet
  const ZC = -18, YC = R - DOWN; // axis at (y = YC, z = ZC)
  const cityMat = new T.ShaderMaterial({
    uniforms: T.UniformsUtils.merge([T.UniformsLib.fog, { uTime: shared.time }]), fog: true,
    vertexShader: /* glsl */ `attribute vec3 aSeed; varying vec3 vL; varying vec3 vN; varying vec3 vSeed; varying float vH;
      #include <fog_pars_vertex>
      void main(){ vL = position; vN = normal; vSeed = aSeed; vH = aSeed.z;
        vec4 mvPosition = viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `uniform float uTime; varying vec3 vL; varying vec3 vN; varying vec3 vSeed; varying float vH;
      #include <common>
      #include <fog_pars_fragment>
      float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){
        // a unit box scaled per instance: local y 0..1 up the building; windows on the side faces
        vec2 f = abs(vN.x) > 0.5 ? vec2(vL.z, vL.y) : vec2(vL.x, vL.y);
        vec2 cells = vec2(6.0 + vSeed.x * 8.0, vH * 0.33);
        vec2 c = floor((f + 0.5) * cells), u = fract((f + 0.5) * cells);
        float win = step(0.18, u.x) * step(u.x, 0.82) * step(0.25, u.y) * step(u.y, 0.8);
        float lit = step(0.7, h2(c + vSeed.xy * 31.0)) * (0.35 + 0.65 * h2(c * 1.7 + 3.0));
        vec3 warm = mix(vec3(1.0, 0.75, 0.45), vec3(0.6, 0.85, 1.0), h2(c + 7.0));
        vec3 col = vec3(0.014, 0.02, 0.04) + win * lit * warm * 0.62;
        col += vec3(0.16, 0.38, 1.0) * 0.6 * step(0.985, h2(vec2(c.y, vSeed.y * 9.0))) * (1.0 - win);
        if (vN.y > 0.5) col = vec3(0.02, 0.025, 0.04);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  const unit = new T.BoxGeometry(1, 1, 1); unit.translate(0, 0.5, 0);
  const B: { m: T.Matrix4; s: T.Vector3 }[] = [];
  const up = new T.Vector3(), pos = new T.Vector3(), quat = new T.Quaternion(), yAx = new T.Vector3(0, 1, 0);
  for (let row = 0; row < 120; row++) {           // rows around the cylinder, from just past the roof to overhead and behind
    const phi = -0.06 + row * 0.03;               // radians from the bottom of the cylinder
    if (phi > 3.3) break;
    const block = row % 4 === 3;                   // every fourth row is an avenue
    if (block) continue;
    for (let x = -260; x < 260; x += 14 + rnd() * 6) {
      if (Math.abs(x) < 26 && phi < 0.12) continue; // keep the ground just past our parapet clear
      const ang = phi;
      // point on the cylinder (inside surface) and the inward normal
      pos.set(x, YC - Math.cos(ang) * R, ZC - Math.sin(ang) * R);
      up.set(0, Math.cos(ang), Math.sin(ang));    // toward the axis
      quat.setFromUnitVectors(yAx, up);
      const h = 8 + Math.pow(rnd(), 2.2) * 70, w = 9 + rnd() * 7, d = 4.2 + rnd() * 1.5;
      const mm = new T.Matrix4().compose(pos, quat, v3(w, h, d));
      B.push({ m: mm, s: v3(rnd(), rnd(), h) });
    }
  }
  const city = new T.InstancedMesh(unit, cityMat, B.length);
  const seed = new Float32Array(B.length * 3);
  B.forEach((b, i) => { city.setMatrixAt(i, b.m); seed[i * 3] = b.s.x; seed[i * 3 + 1] = b.s.y; seed[i * 3 + 2] = b.s.z; });
  unit.setAttribute('aSeed', new T.InstancedBufferAttribute(seed, 3));
  city.frustumCulled = false; g.add(city);
  // the avenues: glowing strips on the cylinder, and cabs (points of light) running along them, upside down overhead
  const aves: T.Matrix4[] = [], cabs: { row: number; x: number; v: number }[] = [];
  for (let row = 3; row < 110; row += 4) {
    const ang = -0.06 + row * 0.03;
    if (ang > 3.3) break;
    pos.set(0, YC - Math.cos(ang) * (R - 0.2), ZC - Math.sin(ang) * (R - 0.2));
    quat.setFromUnitVectors(yAx, up.set(0, Math.cos(ang), Math.sin(ang)));
    aves.push(new T.Matrix4().compose(pos, quat, v3(520, 0.2, 3.2)));
    for (let k = 0; k < 18; k++) cabs.push({ row, x: -260 + rnd() * 520, v: (rnd() < 0.5 ? -1 : 1) * (8 + rnd() * 10) });
  }
  const aveM = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial({ color: 0x3a62d8 }), aves.length);
  aves.forEach((x, i) => aveM.setMatrixAt(i, x)); aveM.frustumCulled = false; g.add(aveM);
  const cabM = new T.InstancedMesh(new T.BoxGeometry(3.2, 1.4, 1.8), new T.MeshBasicMaterial({ color: 0xffd84a }), cabs.length);
  cabM.frustumCulled = false; g.add(cabM);
  const placeCabs = (t: number) => {
    cabs.forEach((c, i) => {
      const ang = -0.06 + c.row * 0.03, x = ((c.x + c.v * t + 260) % 520 + 520) % 520 - 260;
      pos.set(x, YC - Math.cos(ang) * (R - 0.9), ZC - Math.sin(ang) * (R - 0.9));
      quat.setFromUnitVectors(yAx, up.set(0, Math.cos(ang), Math.sin(ang)));
      m.compose(pos, quat, v3(1, 1, 1)); cabM.setMatrixAt(i, m);
    });
    cabM.instanceMatrix.needsUpdate = true;
  };
  placeCabs(0);
  // the Eye Flower, where the city rolls round it
  const flower = eyeFlower(26); flower.object.userData.dynamic = true; flower.object.position.set(0, YC - 50, ZC - 40); g.add(flower.object);
  addThreshold(at(0, YC - 50, ZC - 40), 40);
  // behind you, over the back parapet: the real street, as a depth plate
  const pl = plate(g, 'skyline', { tanH: 0.72, eye: 1.6 + DOWN, far: 220, tear: 3 }); pl.position.set(0, -DOWN, 9.5); pl.rotation.y = Math.PI;
  skyDome(g, 420, 0.6);

  // ---------- light ----------
  g.add(new T.HemisphereLight(0x4f6cc8, 0x20140c, 0.6));
  const moon = new T.DirectionalLight(0xb6c8ff, 1.2); moon.position.set(-8, 30, -30); moon.target.position.set(0, 0, 0); g.add(moon, moon.target);
  moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048); Object.assign(moon.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 80 }); moon.shadow.bias = -0.0005;
  const warm = new T.PointLight(0xffb36b, 14, 14, 1.6); warm.position.set(0, 3, -1.5); g.add(warm);
  void INK;

  const walk: Rect[] = [[-8.8, -8.8, 8.8, 8.8]];
  const block: Rect[] = [[-7.8, 5.8, -4.6, 8.8], [5.4, 6.2, 7.8, 8.8], [4.0, -7.0, 7.2, -3.8], [-7.9, -3.7, -6.7, 4.3], [0.1, -7.9, 0.7, -7.3]];
  return {
    id: 'rooftop', name: 'Tar beach', line: 'The city does not stop at the horizon. Look up.',
    origin: O, group: g,
    spawn: { at: at(0, 1.65, 3.8), look: at(0, 8, -40) },
    views: [
      { name: 'The fold', note: 'The street above you is the street behind you.', at: at(0, 1.65, 2), look: at(0, 60, -40) },
      { name: 'The witness', note: 'Someone was here first. They are still looking.', at: at(-2.4, 1.65, -5.6), look: at(0, 30, -60) },
      { name: 'Straight up', note: 'Cabs, upside down, on time.', at: at(0, 1.65, 0), look: at(0.5, 120, -18) },
      { name: 'Over the back', note: 'The real block, from the roof. It is still the same size.', at: at(0, 1.65, 7.6), look: at(0, -10, 60) },
    ],
    doors: { stairs: { pos: at(-6.2, 0, 5.48), rotY: Math.PI }, chute: { pos: at(6.6, 0, 5.88), rotY: Math.PI }, cam: { pos: at(0, 1.7, 6.5), rotY: Math.PI } },
    walk, block,
    bg: new T.Color(INK.void), fog: new T.FogExp2(0x070d24, 0.0015), exposure: 0.9, env: 0.3,
    floorY: () => O.y,
    tick(t, dt, cam) { if (!ctx.still) placeCabs(t); flower.tick(cam.position, t, dt, ctx.still); },
    interact(o) {
      let p: T.Object3D | null = o;
      while (p) { if (p === flower.object) { flower.blink(); return 'It blinked. The whole city moved a little.'; } p = p.parent; }
    },
  };
}
