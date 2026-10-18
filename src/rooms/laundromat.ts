import * as T from 'three';
import { pbr, prop } from '../core/assets';
import { box, floorPlane, sign, v3, seeded, type Rect } from '../core/kit';
import { contour, drips, addThreshold, shared, INK } from '../core/mlow';
import { hang, poster, sticker } from '../core/hang';
import { ORIGINS, type Ctx, type Room } from '../core/room';

// SUDS & SPACE. A laundromat whose dryer windows each look into another room of the block, live (portholes are view
// only portals, see rooms/index.ts), and whose giant dryer at the back is a vortex tunnel: a 20 m drum that turns
// around a still steel bridge. Walk the bridge and the room seems to roll while you stand still (the funhouse vortex
// tunnel, online). At the far end a door lets out onto the roof. Local: front door at z = 0, room to z = -14,
// dryers on the left wall (x = -4.6), the drum from z = -14 to -34.

export const DRYERS = ['block', 'bodega', 'walkup', 'studio', 'subway', 'rooftop', 'laundromat'];

export function buildLaundromat(ctx: Ctx): Room {
  const O = ORIGINS.laundromat, g = new T.Group(); g.position.copy(O); ctx.scene.add(g);
  const rnd = seeded(71), art = ctx.m.art.laundromat, at = (x: number, y: number, z: number) => O.clone().add(v3(x, y, z));

  const floor = pbr('terrazzo', 0.8, { color: 0x8f8a80, roughness: 0.8 });
  const wall = contour(pbr('plaster', 2, { color: 0x7d8ca6 }), { coverage: 0.15, density: 14, glow: 1.2 });
  const steel = pbr('steel', 1, { metalness: 0.85, roughness: 0.32, color: 0xd5dae0 });
  floorPlane(g, 10, 15, floor, 0, 0, -7);
  box(g, 0.2, 3.6, 15, -5, 1.8, -7, wall); box(g, 0.2, 3.6, 15, 5, 1.8, -7, wall);
  box(g, 10.2, 0.2, 15, 0, 3.6, -7, new T.MeshStandardMaterial({ color: 0x3a4250, roughness: 0.9 }), false);
  box(g, 4.4, 3.6, 0.2, -2.8, 1.8, 0.1, wall); box(g, 4.4, 3.6, 0.2, 2.8, 1.8, 0.1, wall);
  // the back wall with the drum's round mouth cut in it
  const backS = new T.Shape(); backS.moveTo(-5, 0); backS.lineTo(5, 0); backS.lineTo(5, 3.6); backS.lineTo(-5, 3.6); backS.lineTo(-5, 0);
  const holeP = new T.Path(); holeP.absarc(0, 1.65, 1.45, 0, Math.PI * 2, false); backS.holes.push(holeP);
  const back = new T.Mesh(new T.ShapeGeometry(backS, 48), contour(pbr('plaster', 2, { color: 0x1a2a5a }), { coverage: 1, density: 12, glow: 2.0 }));
  back.position.set(0, 0, -14); g.add(back);
  const ring = new T.Mesh(new T.TorusGeometry(1.5, 0.12, 20, 96), steel); ring.position.set(0, 1.65, -13.95); g.add(ring);
  sign(g, ['THE BIG ONE', 'HEAVY DUTY . 80 LB . NO SHOES . NO PETS . NO PHYSICS'], 3.2, 0.5, v3(0, 3.25, -13.88), 0, { bg: '#06163a', ink: '#00e5ff', glow: 1.6 });
  drips(g, v3(-1.4, 3.0, -13.85), v3(1.4, 3.0, -13.85), 40, 77, 2.1);
  addThreshold(at(0, 1.65, -14), 3.4);

  // the dryers: a stack of seven on the left wall, upper row; their windows are the portholes (built in index.ts)
  const dryerFace = new T.MeshStandardMaterial({ color: 0xb9c0c9, metalness: 0.55, roughness: 0.3 });
  const dryers: T.Vector3[] = [];
  for (let i = 0; i < 7; i++) {
    const z = -1.8 - i * 1.5;
    box(g, 0.9, 1.15, 1.35, -4.5, 2.05, z, dryerFace); box(g, 0.9, 1.15, 1.35, -4.5, 0.8, z, dryerFace);
    const r = new T.Mesh(new T.TorusGeometry(0.34, 0.05, 14, 40), steel); r.position.set(-4.04, 2.05, z); r.rotation.y = Math.PI / 2; g.add(r);
    const r2 = new T.Mesh(new T.TorusGeometry(0.3, 0.05, 14, 40), steel); r2.position.set(-4.04, 0.8, z); r2.rotation.y = Math.PI / 2; g.add(r2);
    const glassLow = new T.Mesh(new T.CircleGeometry(0.29, 32), new T.MeshStandardMaterial({ color: 0x0b1530, roughness: 0.05, metalness: 0.3, emissive: 0x0a1a3a })); glassLow.position.set(-4.045, 0.8, z); glassLow.rotation.y = Math.PI / 2; g.add(glassLow);
    sign(g, [String(i + 1).padStart(2, '0') + ' . ' + DRYERS[i].toUpperCase()], 0.7, 0.13, v3(-4.04, 2.75, z), Math.PI / 2, { bg: '#0a0f1e', ink: '#00e5ff', glow: 1.4, font: 'Plex, monospace' });
    dryers.push(at(-4.03, 2.05 - 0.34, z));
  }
  // washers on the right wall, the folding table, the chairs, the change machine
  for (let i = 0; i < 6; i++) {
    const z = -2 - i * 1.6;
    box(g, 0.8, 1.0, 0.75, 4.55, 0.5, z, dryerFace);
    const d = new T.Mesh(new T.CircleGeometry(0.22, 28), new T.MeshStandardMaterial({ color: 0x1b3a7a, roughness: 0.1, emissive: 0x0a1f4a })); d.position.set(4.14, 0.62, z); d.rotation.y = -Math.PI / 2; g.add(d);
  }
  box(g, 1.1, 0.06, 3.6, 0.9, 0.9, -7.5, new T.MeshStandardMaterial({ color: 0xe9e6df, roughness: 0.5 }));
  box(g, 0.9, 0.86, 0.06, 0.9, 0.44, -9.2, new T.MeshStandardMaterial({ color: 0x4a4f58 }));
  const chair = new T.MeshStandardMaterial({ color: 0xff7a1a, roughness: 0.5 });
  for (let i = 0; i < 5; i++) { box(g, 0.48, 0.05, 0.45, 3.6, 0.46, -2.3 - i * 1.25, chair); box(g, 0.05, 0.45, 0.45, 3.85, 0.7, -2.3 - i * 1.25, chair); }
  box(g, 0.5, 1.7, 0.6, 4.6, 0.85, -12.6, new T.MeshStandardMaterial({ color: 0x9aa2ad, metalness: 0.6, roughness: 0.4 }));
  sign(g, ['CHANGE', 'ALSO DIMENSIONS'], 0.48, 0.3, v3(4.29, 1.4, -12.6), -Math.PI / 2, { bg: '#c8102e', ink: '#fff', glow: 1.2 });
  // folded laundry, as a stack of coloured slabs
  for (let i = 0; i < 6; i++) box(g, 0.38, 0.06, 0.3, 0.75 + (i % 2) * 0.35, 0.96 + Math.floor(i / 2) * 0.06, -7 - (i % 3) * 0.4, new T.MeshStandardMaterial({ color: [0xff2e63, 0x2962ff, 0xf0f4f8, 0x6f23a8, 0xffd84a, 0x00a86b][i], roughness: 0.9 }), false);
  // the hang: six over the washers, six on the bulletin wall by the door
  art.slice(0, 6).forEach((a, i) => hang(g, a, v3(4.88, 2.35, -2.3 - i * 1.85), -Math.PI / 2, 1.35, { frame: 'chrome' }));
  art.slice(6, 12).forEach((a, i) => hang(g, a, v3(i < 3 ? -1.4 - i * 1.25 : 1.4 + (i - 3) * 1.25, 2.55, 0.0), Math.PI, 1.05, { frame: 'chrome', label: false }));
  // the bulletin board: posters and stickers, the room for rent, the lost cat
  const cork = new T.MeshStandardMaterial({ color: 0x9a7448, roughness: 0.95 });
  box(g, 0.05, 1.3, 2.4, 4.88, 1.6, -12.7 + 3.0, cork);
  for (let i = 0; i < 3; i++) { const p = ctx.m.posters[(i * 13 + 7) % ctx.m.posters.length]; poster(g, p.f, p.ar, v3(4.84, 1.6, -10.6 + i * 0.75), -Math.PI / 2, 0.85, 80 + i); }
  const marks = ctx.m.stickers.filter((s) => s.kind === 'mark');
  for (let i = 0; i < 16; i++) { const s = marks[(i * 3 + 1) % marks.length]; sticker(g, s.f, s.ar, v3(-4.04, 0.2 + rnd() * 0.3, -1.4 - rnd() * 10), Math.PI / 2, 0.1 + rnd() * 0.08, (rnd() - 0.5) * 0.8); }
  sign(g, ['WASH . DRY . FOLD', 'THE DRYERS LOOK INTO OTHER ROOMS', 'PLEASE DO NOT CLIMB INTO THE DRYERS', 'EXCEPT THE BIG ONE'], 2.6, 1.3, v3(-1.6, 2.2, -0.12), Math.PI, { bg: '#f0f4f8', ink: '#06163a', align: 'left' });

  // the vortex: a drum 20 m long that spins around a still bridge
  const drumL = 20, drumR = 1.42;
  const drumMat = new T.ShaderMaterial({
    uniforms: { uTime: shared.time, uSpin: { value: 0 } }, side: T.BackSide,
    vertexShader: 'varying vec2 vUv; varying vec3 vP; void main(){ vUv = uv; vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform float uSpin; varying vec2 vUv; varying vec3 vP;
      void main(){
        float a = vUv.x * 6.2831853 + uSpin, z = vUv.y * 20.0;
        float spiral = fract((a / 6.2831853) * 6.0 + z * 0.35);
        float bands = smoothstep(0.0, 0.04, spiral) * smoothstep(0.5, 0.46, spiral);
        float rings = 1.0 - smoothstep(0.0, 0.05, abs(fract(z * 1.2 + sin(a * 3.0) * 0.15) - 0.5) - 0.42);
        vec3 navy = vec3(0.01, 0.03, 0.1), cob = vec3(0.16, 0.38, 1.0), cy = vec3(0.0, 0.9, 1.0), pk = vec3(1.0, 0.18, 0.39), bone = vec3(0.94, 0.96, 0.97);
        vec3 c = mix(navy, mix(cob, cy, 0.5 + 0.5 * sin(z * 0.6)), bands * 0.85);
        c = mix(c, bone, rings * 0.35);
        c += pk * smoothstep(0.92, 1.0, fract(a / 6.2831853 * 3.0 - z * 0.08)) * 0.8;
        gl_FragColor = vec4(c * 1.3, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const drum = new T.Mesh(new T.CylinderGeometry(drumR, drumR, drumL, 64, 20, true), drumMat);
  drum.rotation.x = Math.PI / 2; drum.position.set(0, 1.65, -14 - drumL / 2); g.add(drum);
  // the bridge: grating, two rails, still
  const grate = new T.MeshStandardMaterial({ color: 0x3a3f48, metalness: 0.8, roughness: 0.5 });
  box(g, 0.9, 0.06, drumL + 1.2, 0, 0.62, -14 - drumL / 2, grate);
  for (const x of [-0.45, 0.45]) { box(g, 0.04, 0.04, drumL + 1, x, 1.62, -14 - drumL / 2, steel, false); for (let z = -14.2; z > -34; z -= 1.5) box(g, 0.03, 1.0, 0.03, x, 1.12, z, steel, false); }
  // the far end: a small room with the roof door
  box(g, 3.2, 0.2, 3, 0, 0.52, -35.5, grate); box(g, 3.2, 3.2, 0.2, 0, 2.1, -37.1, wall);
  sign(g, ['ROOF . THIS WAY UP'], 1.4, 0.26, v3(0, 3.0, -36.98), 0, { bg: '#c8102e', ink: '#fff', glow: 1.2 });
  const endHole = new T.Mesh(new T.RingGeometry(drumR, 1.8, 48), new T.MeshStandardMaterial({ color: 0x0b1020 })); endHole.position.set(0, 1.65, -34.0); endHole.rotation.y = Math.PI; g.add(endHole);

  // light
  const tubes: [number, number][] = [[-2, -3], [2, -3], [-2, -8], [2, -8], [-2, -12], [2, -12]];
  for (const [x, z] of tubes) box(g, 0.12, 0.04, 1.5, x, 3.48, z, new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xeaf6ff, emissiveIntensity: 1.1 }), false);
  for (const z of [-3, -10]) { const l = new T.PointLight(0xeaf6ff, 7, 12, 1.6); l.position.set(0, 3.1, z); g.add(l); }
  const vl = new T.PointLight(0x2962ff, 12, 14, 1.4); vl.position.set(0, 2.2, -22); g.add(vl);
  g.add(new T.HemisphereLight(0xc8d6f0, 0x30302a, 0.32));
  addThreshold(at(0, 1.5, 0), 2.5);
  drips(g, v3(-0.6, 3.0, -0.12), v3(0.6, 3.0, -0.12), 16, 79, 1.5);
  void INK; void prop;

  let spin = 0;
  const walk: Rect[] = [[-4.0, -14.2, 4.1, 0.6], [-0.42, -35.2, 0.42, -13.6], [-1.5, -37.4, 1.5, -34.3]];
  const block: Rect[] = [[0.3, -9.35, 1.5, -5.6], [3.2, -8.3, 4.1, -1.6]];
  return {
    id: 'laundromat', name: 'Suds & Space', line: 'Wash. Dry. Fold. The dryers look into the other rooms. Climb into the big one.',
    origin: O, group: g,
    spawn: { at: at(1.6, 1.65, -1.2), look: at(-4, 1.8, -7) },
    views: [
      { name: 'The dryers', note: 'Each window is a live view into another room. Move your head.', at: at(-2.4, 1.65, -4.5), look: at(-4.0, 2.0, -6.0) },
      { name: 'The big one', note: 'Twenty metres of drum. It turns. You do not.', at: at(0, 1.65, -11), look: at(0, 1.65, -40) },
      { name: 'Inside the drum', note: 'Hold the rail. The bridge is perfectly still.', at: at(0, 1.65, -22), look: at(0, 1.65, -40) },
    ],
    doors: { street: { pos: at(0, 0, 0), rotY: Math.PI }, roof: { pos: at(0, 0.62, -36.95), rotY: 0 }, cam: { pos: at(0, 1.7, -0.6), rotY: Math.PI },
      ...Object.fromEntries(dryers.map((p, i) => [`dryer${i}`, { pos: p, rotY: Math.PI / 2 }])) },
    walk, block,
    bg: new T.Color(0x0a0f1c), fog: new T.FogExp2(0x0b1120, 0.01), exposure: 0.8,
    floorY: (x, z) => (z - O.z < -13.9 ? O.y + 0.65 : O.y),
    tick(_t, dt) { if (!ctx.still) { spin += dt * 0.9; drumMat.uniforms.uSpin.value = spin; } },
  };
}
