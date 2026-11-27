// THE GARDEN: the game. Ten players, three referees, two benches, two coaches and the baseline photographers, every one a
// jointed body (hips, chest, head, arms, legs) posed in code each frame and drawn as one InstancedMesh per body part, so
// thirty seven people cost sixteen draws. No faces and no real players: home whites against road reds, numbers only.
// The game runs itself: inbound, bring it up, swing it, shoot, rebound, the other way. The scoreboard reads its clock.
// With opts.replay (a timeline from sim/garden_sim.py, see replay.js) the same bodies play that game instead: positions,
// moves, the ball and the clock all come from the file, the players wear the two kits and carry MLow's flower heads.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { loadBodies, castCrowd } from './cast.js';

const HOOP = 12.755, RIMY = 3.05, BASE = 14.33, SIDE = 7.62;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = THREE.MathUtils.clamp;

// ---------- the body parts, each in its bone's space (limbs hang down -y from the joint, the body faces +z)
function taper(g, top, bot) { g.computeBoundingBox(); const b = g.boundingBox, p = g.attributes.position; for (let i = 0; i < p.count; i++) { const t = (p.getY(i) - b.min.y) / (b.max.y - b.min.y || 1), k = bot + (top - bot) * t; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } g.computeVertexNormals(); return g; }
const cap = (r, len, y, seg = 8) => new THREE.CapsuleGeometry(r, len, 3, seg).translate(0, y, 0);
const PARTS = [
  // name, bone, geometry, colour key
  ['shorts', 'hips', () => cap(0.165, 0.14, -0.02, 10).scale(1.12, 1, 0.78), 'shorts'],
  ['torso', 'chest', () => taper(cap(0.17, 0.36, 0.27, 12), 1.18, 0.86).scale(1, 1, 0.64), 'jersey'],
  ['neck', 'chest', () => new THREE.CylinderGeometry(0.052, 0.06, 0.14, 8).translate(0, 0.55, 0.01), 'skin'],
  ['head', 'head', () => mergeGeometries([new THREE.SphereGeometry(0.108, 14, 10).scale(1, 1.2, 1.08).translate(0, 0.12, 0.01),
    new THREE.SphereGeometry(0.03, 8, 6).scale(0.7, 1.1, 1).translate(0, 0.105, 0.118),                                   // the nose
    new THREE.SphereGeometry(0.075, 10, 6).scale(1.05, 0.75, 1).translate(0, 0.04, 0.035),                               // the jaw
    new THREE.SphereGeometry(0.026, 6, 5).scale(0.5, 1.2, 0.9).translate(0.105, 0.115, 0), new THREE.SphereGeometry(0.026, 6, 5).scale(0.5, 1.2, 0.9).translate(-0.105, 0.115, 0)]), 'skin'],
  ['hair', 'head', () => new THREE.SphereGeometry(0.114, 14, 6, 0, Math.PI * 2, 0, Math.PI * 0.5).scale(1, 1.15, 1.1).rotateX(-0.22).translate(0, 0.13, 0), 'hair'],
  ['upper', 'sh', () => taper(cap(0.056, 0.22, -0.15), 1.1, 0.85), 'arm'],
  ['fore', 'el', () => taper(cap(0.046, 0.2, -0.13), 1.05, 0.8), 'skin'],
  ['hand', 'hand', () => new THREE.SphereGeometry(0.05, 8, 6).scale(0.75, 1.4, 0.45).translate(0, -0.06, 0), 'skin'],
  ['thigh', 'hip', () => taper(cap(0.1, 0.26, -0.17, 10), 1.05, 0.9), 'thigh'],
  ['knee', 'knee', () => cap(0.062, 0.06, -0.03), 'shin'],
  ['shin', 'knee', () => taper(cap(0.056, 0.28, -0.17), 1, 0.78), 'shin'],
  ['sock', 'knee', () => new THREE.CylinderGeometry(0.05, 0.047, 0.18, 8).translate(0, -0.37, 0), 'sock'],
  ['shoe', 'ankle', () => new RoundedBoxGeometry(0.115, 0.1, 0.3, 2, 0.04).translate(0, -0.045, 0.06), 'shoe'],
];
const PAIRED = new Set(['sh', 'el', 'hand', 'hip', 'knee', 'ankle']);

function rig() {
  const root = new THREE.Object3D(), b = { root };
  const add = (n, p, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); (b[p] || p).add(o); b[n] = o; return o; };
  add('hips', root, 0, 1.0, 0); add('chest', 'hips', 0, 0.08, 0); add('head', 'chest', 0, 0.6, 0.01);
  for (const [s, k] of [[1, 'L'], [-1, 'R']]) {   // facing +z, the body's left is +x
    add('sh' + k, 'chest', s * 0.215, 0.5, 0); add('el' + k, 'sh' + k, 0, -0.3, 0); add('hand' + k, 'el' + k, 0, -0.27, 0);
    add('hip' + k, 'hips', s * 0.1, -0.05, 0); add('knee' + k, 'hip' + k, 0, -0.47, 0); add('ankle' + k, 'knee' + k, 0, -0.46, 0);
  }
  return b;
}
const LEG = { th: 0.47, sh: 0.46, an: 0.095, off: 0.05 };   // the people pass re-rigs these to the sculpted body
const legH = (t, k) => LEG.th * Math.cos(t) + LEG.sh * Math.cos(t + k) + LEG.an;

const SKIN = ['#f0cfb4', '#d9a882', '#b97d56', '#8d5a3b', '#6b4129', '#4a2c1b', '#c48c66', '#5e3a24'];
const HAIR = ['#120e0c', '#1c140f', '#2a1c12', '#3b2a1d', '#0d0b0a'];
const pick = (a) => a[(Math.random() * a.length) | 0];
const rnd = () => Math.random();

export function buildGame(parent, tex, opts = {}) {
  const phone = !!opts.phone, figs = [], R = opts.replay || null;
  const mk = (kind, team, col, num, scale) => { const f = { kind, team, col, num, b: rig(), pos: V(), vel: V(), tgt: V(), yaw: 0, look: null, ph: Math.random() * 6, crouch: 0, jumpY: 0, act: 'run', actT: 0, maxSp: 6.8, s: scale };
    f.b.root.scale.setScalar(scale); figs.push(f); return f; };
  const HOME = { jersey: '#f2f4f8', shorts: '#f2f4f8', thigh: '#f2f4f8', sock: '#f2f4f8', shoe: '#1b1d24', num: '#1d428a', edge: '#f58426' };
  const ROAD = { jersey: '#a3202b', shorts: '#a3202b', thigh: '#a3202b', sock: '#141414', shoe: '#efefef', num: '#f6f3ea', edge: '#1a1214' };
  const NUMS = [['3', '5', '11', '23', '30'], ['0', '7', '13', '21', '34']];
  const T = [[], []];
  for (let t = 0; t < 2; t++) for (let i = 0; i < 5; i++) { const sk = pick(SKIN); T[t].push(mk('player', t, { ...(t ? ROAD : HOME), skin: sk, arm: sk, shin: sk, hair: pick(HAIR) }, NUMS[t][i], [0.94, 0.97, 1.0, 1.04, 1.07][i])); T[t][i].role = i; T[t][i].maxSp = 7.4 - i * 0.25; }
  const refs = []; for (let i = 0; i < 3; i++) { const sk = pick(SKIN); refs.push(mk('ref', -1, { jersey: '#8d929c', shorts: '#16171b', thigh: '#16171b', shin: '#16171b', sock: '#16171b', shoe: '#0c0c0c', skin: sk, arm: sk, hair: pick(HAIR), num: '#111', edge: '#e8e8e8' }, ['14', '27', '45'][i], 0.92)); refs[i].maxSp = 6.2; }
  // the benches: seven a side in warm up tops, on the folding chairs either side of the scorer's table; a coach each, standing
  const bench = [];
  for (let t = 0; t < 2; t++) for (let i = 0; i < 7; i++) { const sk = pick(SKIN), c = t ? { jersey: '#7d1720', shorts: '#a3202b', thigh: '#a3202b', sock: '#141414', shoe: '#efefef' } : { jersey: '#1d428a', shorts: '#f2f4f8', thigh: '#f2f4f8', sock: '#f2f4f8', shoe: '#1b1d24' };
    const f = mk('bench', t, { ...c, skin: sk, arm: t ? '#7d1720' : '#1d428a', shin: sk, hair: pick(HAIR) }, null, 0.97 + Math.random() * 0.08); f.act = 'sit';
    const x = t ? 6.9 + i * 1.1 : -12.9 + i * 1.1; f.pos.set(x, 0, -9.12); f.yaw = 0; bench.push(f); }
  const coaches = [];
  for (let t = 0; t < 2; t++) { const sk = pick(SKIN), suit = t ? '#26282f' : '#1b2233'; const f = mk('coach', t, { jersey: suit, shorts: suit, thigh: suit, shin: suit, sock: suit, shoe: '#0a0a0a', skin: sk, arm: suit, hair: pick(['#b8b4ac', '#2a1c12', '#8a8780']) }, null, 0.93);
    f.act = 'coach'; f.pos.set(t ? 5.6 : -5.6, 0, -8.35); f.home = f.pos.clone(); coaches.push(f); }
  // courtside: the front row in the folding chairs, in coats and the odd home jersey; they stand when the home side scores
  const COAT = ['#1d2230', '#262a33', '#3c414c', '#14161c', '#5b6170', '#28324a', '#3a2f2a', '#7d7f86', '#d8dadf', '#8a2b2b', '#1d428a', '#f2f4f8'];
  const PANT = ['#1a1c22', '#23262e', '#2c3442', '#3b4a63', '#4a4136', '#15171b'];
  (opts.fans || []).forEach(([x, z, yaw]) => { const sk = pick(SKIN), coat = pick(COAT), pant = pick(PANT);
    const f = mk('fan', 0, { jersey: coat, shorts: pant, thigh: pant, shin: pant, sock: pant, shoe: Math.random() < 0.4 ? '#e8e8e8' : '#141414', skin: sk, arm: coat, hair: Math.random() < 0.15 ? pick(['#1d428a', '#f58426', '#0f1a33']) : pick(['#120e0c', '#2a1c12', '#5a4030', '#8a6a42', '#b8b4ac', '#c9a870']) }, null, 0.9 + Math.random() * 0.12);
    f.act = 'sit'; f.pos.set(x, 0, z); f.yaw = yaw; f.ph = Math.random() * 6; });
  // the photographers: kneeling on the baseline either side of each stanchion, all in black
  const photo = [];
  if (!phone) for (const s of [-1, 1]) for (const z of [-5.6, -4.1, -2.6, 2.6, 4.1, 5.6]) { const sk = pick(SKIN); const f = mk('photo', -1, { jersey: '#121316', shorts: '#16171b', thigh: '#16171b', shin: '#16171b', sock: '#16171b', shoe: '#0c0c0c', skin: sk, arm: '#121316', hair: pick(HAIR) }, null, 0.93);
    f.act = 'kneel'; f.pos.set(s * 15.35, 0, z + (Math.random() - 0.5) * 0.4); f.yaw = s > 0 ? -Math.PI / 2 - (z * 0.05) : Math.PI / 2 + z * 0.05; photo.push(f); }

  // ---------- the instanced parts
  const g = new THREE.Group(); parent.add(g); const N = figs.length;
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0 });
  let meshes = PARTS.map(([name, bone, geo, key]) => { const paired = PAIRED.has(bone), m = new THREE.InstancedMesh(geo(), mat, N * (paired ? 2 : 1));
    m.frustumCulled = false; m.castShadow = true; m.receiveShadow = true; m.userData = { bone, key, paired }; g.add(m);
    const c = new THREE.Color(); figs.forEach((f, i) => { c.set(f.col[key]).convertSRGBToLinear(); if (paired) { m.setColorAt(i * 2, c); m.setColorAt(i * 2 + 1, c); } else m.setColorAt(i, c); });
    m.instanceColor.needsUpdate = true; return m; });
  // jersey numbers, front and back, from one atlas of 8 x 4 cells
  const atlas = document.createElement('canvas'); atlas.width = 1024; atlas.height = 512; const ax = atlas.getContext('2d'); const cells = [];
  figs.forEach((f) => { if (!f.num) return cells.push(null); const i = cells.filter(Boolean).length, cx = (i % 8) * 128, cy = ((i / 8) | 0) * 128;
    ax.font = '96px Anton, Impact, sans-serif'; ax.textAlign = 'center'; ax.textBaseline = 'middle'; ax.lineJoin = 'round'; ax.lineWidth = 12; ax.strokeStyle = f.col.edge; ax.strokeText(f.num, cx + 64, cy + 70); ax.fillStyle = f.col.num; ax.fillText(f.num, cx + 64, cy + 70);
    cells.push([(i % 8) / 8, 1 - (((i / 8) | 0) + 1) / 4]); });
  const at = new THREE.CanvasTexture(atlas); at.colorSpace = THREE.SRGBColorSpace; at.anisotropy = 4;
  const numMat = new THREE.MeshStandardMaterial({ map: at, transparent: true, alphaTest: 0.3, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2 });
  numMat.onBeforeCompile = (sh) => { sh.vertexShader = 'attribute vec2 aOff;\n' + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n vMapUv = vMapUv * vec2(0.125, 0.25) + aOff;'); };
  const numGeo = new THREE.PlaneGeometry(0.22, 0.22); const off = new Float32Array(N * 4);
  figs.forEach((f, i) => { const c = cells[i] || [0, 0]; off.set([c[0], c[1], c[0], c[1]], i * 4); });
  numGeo.setAttribute('aOff', new THREE.InstancedBufferAttribute(off.slice(), 2));
  const numbers = new THREE.InstancedMesh(numGeo, numMat, N * 2); numbers.frustumCulled = false; g.add(numbers);
  const nf = new THREE.Matrix4().makeTranslation(0, 0.36, 0.118), nb = new THREE.Matrix4().makeRotationY(Math.PI).premultiply(new THREE.Matrix4().makeTranslation(0, 0.37, -0.118)).multiply(new THREE.Matrix4().makeScale(1.35, 1.35, 1));
  // the photographers' cameras: a body and a long lens at the face
  const camGeo = new THREE.BoxGeometry(0.15, 0.11, 0.1).translate(0, 0.12, 0.17); const lens = new THREE.CylinderGeometry(0.045, 0.05, 0.26, 10).rotateX(Math.PI / 2).translate(0, 0.11, 0.34);
  const cams = new THREE.InstancedMesh(mergeTwo(camGeo, lens), new THREE.MeshStandardMaterial({ color: 0x0b0b0d, roughness: 0.35, metalness: 0.4 }), Math.max(1, photo.length)); cams.frustumCulled = false; g.add(cams);
  // the ball
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 16), new THREE.MeshStandardMaterial({ map: tex.ball, roughness: 0.62 })); ball.castShadow = true; g.add(ball);

  // ---------- the game
  const G = { off: 0, phase: 'tip', t: 0, holder: null, flight: null, score: [0, 0], clock: 720, q: 1, shot: 24, passes: 0, need: 3, next: 0, set: 0, mirror: 1, loose: null, final: 0, onScore: null, cheerT: 0 };
  const dir = (team) => (team === 0 ? 1 : -1);
  const SETS = [
    [[7.9, 0], [6.0, 5.4], [6.0, -5.4], [1.6, 2.6], [1.0, -1.6]], [[7.6, 1.5], [1.1, 6.5], [3.5, -5.9], [4.6, 2.4], [2.2, -2.0]],
    [[6.5, -3.2], [7.0, 4.0], [1.2, -6.5], [4.4, -2.4], [1.4, 2.0]], [[8.2, -0.6], [4.8, 5.8], [1.0, -6.6], [5.2, -1.8], [2.6, 1.6]],
    [[7.4, 2.6], [2.6, -6.2], [6.3, -4.6], [3.9, 2.7], [1.3, -1.2]],
  ];
  const spot = (team, i) => { const [u, v] = SETS[G.set][i]; return V(dir(team) * (BASE - u), 0, v * G.mirror); };
  const basket = (team) => V(dir(team) * HOOP, 0, 0);
  // the tip: both centres at centre court, everyone on the circle
  function tip() { G.phase = 'tip'; G.t = 0; G.holder = null; G.flight = null; G.loose = null; ball.position.set(0, 2.2, 0);
    for (let t = 0; t < 2; t++) T[t].forEach((f, i) => { const a = [0, 0.9, -0.9, 0.5, -0.5][i], r = i === 4 ? 0.45 : 3.2; f.pos.set(-dir(t) * (r * Math.cos(a)), 0, r * Math.sin(a) * (i === 4 ? 0 : 1.4)); f.tgt.copy(f.pos); f.vel.set(0, 0, 0); });
    refs.forEach((r, i) => { r.pos.set([0, -6, 6][i], 0, [8.2, -8.2, -8.2][i]); r.tgt.copy(r.pos); }); }
  tip();
  function give(f) { G.holder = f; G.flight = null; G.loose = null; f.act = 'hold'; f.actT = 0; }
  function flyBall(from, to, T, h, then) { G.flight = { p0: from.clone(), p1: to.clone(), T, t: 0, h, then }; G.holder = null; }
  const hand = (f, y = 1.3) => V(f.pos.x + Math.sin(f.yaw) * 0.35 * f.s, y * f.s, f.pos.z + Math.cos(f.yaw) * 0.35 * f.s);
  function newPossession(team, inboundFrom) {
    G.off = team; G.shot = 24; G.passes = 0; G.need = 2 + ((Math.random() * 3) | 0); G.set = (Math.random() * SETS.length) | 0; G.mirror = Math.random() < 0.5 ? 1 : -1;
    if (inboundFrom) { G.phase = 'inbound'; G.t = 0; const inb = T[team][4], d = -dir(team);
      G.inb = inb; ball.position.set(d * HOOP, 0.3, 0); G.loose = { p: V(d * HOOP, 0.12, 0.3), v: V(), mode: 'roll' }; G.holder = null; }
    else { G.phase = 'advance'; G.t = 0; }
  }
  function shoot(f) { const b = basket(G.off), d = Math.hypot(f.pos.x - b.x, f.pos.z - b.z);
    G.phase = 'shot'; G.t = 0; f.act = 'shoot'; f.actT = 0; G.shooter = f; G.three = d > 7.1 || (Math.abs(f.pos.z) > 6.4 && Math.abs(f.pos.x) > BASE - 4.3);
    G.make = Math.random() < (d < 2.2 ? 0.62 : G.three ? 0.4 : 0.48); G.shotD = d; }
  function release(f) { const r = V(dir(G.off) * HOOP, RIMY + 0.08, 0), d = G.shotD, from = hand(f, 2.55 + f.jumpY / f.s);
    if (G.make) flyBall(from, r, 0.62 + d * 0.055, 1.1 + d * 0.16, () => { // through the net and down
      if (opts.sound) opts.sound.swish(); flyBall(r, V(r.x - dir(G.off) * 0.2, 0.12, 0.1), 0.42, 0, () => {});
      const pts = G.three ? 3 : 2; G.score[G.off] += pts; G.cheerT = 2.2; if (opts.onScore) opts.onScore(G.off, pts); newPossession(1 - G.off, true); });
    else { const miss = V(r.x - dir(G.off) * (0.1 + Math.random() * 0.25), RIMY + 0.12, (Math.random() - 0.5) * 0.4);
      flyBall(from, miss, 0.62 + d * 0.055, 1.1 + d * 0.16, () => { if (opts.sound) opts.sound.clank(); G.shot = 24;
        const a = Math.random() * Math.PI - Math.PI / 2, rr = 1.4 + Math.random() * 3; const land = V(r.x - dir(G.off) * Math.cos(a) * rr, 0.12, Math.sin(a) * rr * 1.2);
        land.x = clamp(land.x, -BASE + 0.4, BASE - 0.4); land.z = clamp(land.z, -SIDE + 0.4, SIDE - 0.4);
        flyBall(miss, V(land.x, 1.2, land.z), 0.75, 1.3, () => { G.phase = 'rebound'; G.loose = { p: V(land.x, 1.2, land.z), v: V((land.x - miss.x) * 0.3, 0, (land.z - miss.z) * 0.3), vy: -1, mode: 'bounce' }; }); }); }
  }

  // ---------- each frame
  const tmp = V(), e = new THREE.Euler(), m4 = new THREE.Matrix4(), zero = new THREE.Matrix4().makeScale(0, 0, 0);
  function steer(f, dt) {
    tmp.subVectors(f.tgt, f.pos); tmp.y = 0; const d = tmp.length(), sp = d > 0.08 ? Math.min(f.maxSp, d * 2.4) : 0;
    if (d > 0.001) tmp.multiplyScalar(sp / d); f.vel.lerp(tmp, Math.min(1, dt * 3.6)); f.pos.addScaledVector(f.vel, dt);
  }
  function separate() { const on = T[0].concat(T[1], refs); for (let i = 0; i < on.length; i++) for (let j = i + 1; j < on.length; j++) { const a = on[i], b = on[j], dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, d = Math.hypot(dx, dz); if (d > 0.001 && d < 0.62) { const k = (0.62 - d) / d * 0.5; a.pos.x -= dx * k; a.pos.z -= dz * k; b.pos.x += dx * k; b.pos.z += dz * k; } } }
  function face(f, dt, look) { let want = f.yaw; const sp = Math.hypot(f.vel.x, f.vel.z);
    if (look && (sp < 2.2 || f.act === 'defend')) want = Math.atan2(look.x - f.pos.x, look.z - f.pos.z); else if (sp > 0.4) want = Math.atan2(f.vel.x, f.vel.z);
    let dd = want - f.yaw; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); f.yaw += dd * Math.min(1, dt * 7); }

  function pose(f, dt, t) {
    const b = f.b, sp = Math.hypot(f.vel.x, f.vel.z) / f.s; f.actT += dt;
    f.ph += dt * Math.PI * 2 * (sp > 0.2 ? 0.9 + sp * 0.13 : 0); const s = Math.sin(f.ph), amp = sp > 0.2 ? clamp(0.18 + sp * 0.1, 0, 0.95) : 0;
    let crouch = 0.06, lean = 0.04 + sp * 0.025, tL = -s * amp, tR = s * amp, kL = 0.12 + amp * 1.25 * Math.max(0, Math.sin(f.ph + 1.4)), kR = 0.12 + amp * 1.25 * Math.max(0, Math.sin(f.ph + 1.4 + Math.PI));
    let aL = s * amp * 0.95, aR = -s * amp * 0.95, eL = -(0.3 + sp * 0.12), eR = eL, zL = 0.1, zR = -0.1, jump = 0, hipY = null, headX = 0;
    const act = f.act;
    if (act === 'defend') { crouch = 0.42; zL = 0.75 + Math.sin(t * 5 + f.ph) * 0.12; zR = -zL; aL = aR = -0.35; eL = eR = -0.5; lean = 0.22; }
    if (act === 'hold') { aL = aR = -0.75; eL = eR = -1.0; zL = -0.15; zR = 0.15; crouch = 0.22; lean = 0.15; if (f.actT > 0.45) f.act = 'dribble'; }
    if (act === 'dribble') { crouch = 0.2 + (sp < 1 ? 0.12 : 0); f.dr = (f.dr || 0) + dt * Math.PI * 2 * (1.7 + sp * 0.12); aR = -0.45 - sp * 0.04; eR = -0.55 + 0.38 * Math.sin(f.dr); zR = -0.22; aL = -0.25 + s * amp * 0.5; lean = 0.12 + sp * 0.03; }
    if (act === 'shoot') { const k = f.actT; crouch = k < 0.28 ? 0.38 * Math.sin(k / 0.28 * Math.PI / 2) : Math.max(0, 0.38 - (k - 0.28) * 3);
      jump = k > 0.28 && k < 0.9 ? 0.5 * Math.sin((k - 0.28) / 0.62 * Math.PI) : 0; const up = clamp((k - 0.12) / 0.3, 0, 1);
      aR = -0.7 - up * 2.2; eR = -1.0 - up * 0.7 + clamp((k - 0.5) / 0.12, 0, 1) * 1.5; aL = -0.7 - up * 2.0; eL = -1.2; zL = -0.25 * up; zR = 0.05; lean = 0.02; headX = -0.25 * up;
      if (k > 0.5 && !f.released) { f.released = true; if (!R) release(f); } if (k > 1.3) { f.act = 'run'; f.released = false; } }
    if (act === 'ftshoot') { const k = f.actT; crouch = k < 0.3 ? 0.3 * Math.sin(k / 0.3 * Math.PI / 2) : Math.max(0, 0.3 - (k - 0.3) * 2.5); jump = k > 0.3 && k < 0.7 ? 0.07 * Math.sin((k - 0.3) / 0.4 * Math.PI) : 0;
      const up = clamp((k - 0.1) / 0.32, 0, 1); aR = -0.7 - up * 2.2; eR = -1.0 - up * 0.7 + clamp((k - 0.48) / 0.12, 0, 1) * 1.5; aL = -0.7 - up * 1.9; eL = -1.2; zL = -0.25 * up; lean = 0.02; headX = -0.2 * up; }
    if (act === 'layup') { const k = f.actT; jump = k > 0.12 && k < 0.95 ? 0.62 * Math.sin((k - 0.12) / 0.83 * Math.PI) : 0; const up = clamp((k - 0.05) / 0.35, 0, 1);
      aR = -0.6 - up * 2.5; eR = -0.6 + up * 0.45; aL = -0.5 - up * 0.9; eL = -0.9; tL = -1.1 * up; kL = 1.5 * up; crouch = k < 0.12 ? 0.3 : 0; lean = 0.05; headX = -0.3 * up; }
    if (act === 'dunk') { const k = f.actT; jump = k > 0.1 && k < 1.05 ? 0.9 * Math.sin((k - 0.1) / 0.95 * Math.PI) : 0; const up = clamp((k - 0.02) / 0.3, 0, 1), slam = clamp((k - 0.42) / 0.12, 0, 1);
      aR = -0.6 - up * 2.5 + slam * 1.1; eR = -0.3 + slam * 0.3; aL = -0.6 - up * 2.3 + slam * 0.6; eL = -0.3; tL = tR = -0.5 * up; kL = kR = 0.9 * up; crouch = k < 0.1 ? 0.4 : 0; lean = -0.05 + slam * 0.2; headX = -0.25 * up; }
    if (act === 'contest') { const k = f.actT; jump = k < 0.7 ? 0.42 * Math.sin(k / 0.7 * Math.PI) : 0; aL = -2.9; aR = -2.8; eL = eR = -0.1; zL = 0.15; zR = -0.15; crouch = k < 0.08 ? 0.3 : 0; lean = -0.05; }
    if (act === 'signal') { aL = aR = -2.85; eL = eR = -0.15; zL = 0.25; zR = -0.25; crouch = 0.02; lean = -0.04; }
    if (act === 'jump') { const k = f.actT; jump = k < 0.8 ? 0.62 * Math.sin(k / 0.8 * Math.PI) : 0; aL = -2.9; aR = -3.0; eL = eR = -0.15; crouch = k < 0.1 ? 0.3 : 0; if (k > 0.95) f.act = 'run'; }
    if (act === 'pass') { const k = f.actT; aL = aR = -1.1 + Math.min(1, k / 0.18) * -0.3; eL = eR = -0.9 + Math.min(1, k / 0.18) * 0.8; zL = -0.1; zR = 0.1; if (k > 0.35) f.act = 'run'; }
    if (act === 'sit') { hipY = 0.56; tL = tR = -1.52 + Math.sin(f.ph) * 0.03; kL = kR = 1.45; lean = -0.05; aL = aR = -0.45; eL = eR = -0.95; zL = 0.1; zR = -0.1;
      if (f.kind === 'fan' && Math.sin(f.ph * 7.3) > 0.8) { aR = -1.25; eR = -1.6; zR = 0.3; headX = 0.35; }
      if (G.cheerT > 0 && f.team === G.lastTeam && (f.kind !== 'fan' || Math.sin(f.ph * 3.1) > -0.4)) { hipY = null; tL = tR = 0; kL = kR = 0.05; aL = aR = -2.6 - Math.sin(t * 9 + f.ph) * 0.2; eL = eR = -0.3; zL = 0.25; zR = -0.25; } }
    if (act === 'coach') { crouch = 0.05 + Math.max(0, Math.sin(t * 0.4 + f.ph)) * 0.25; aL = aR = -0.5; eL = eR = -1.75; zL = -0.35; zR = 0.35; lean = crouch * 0.5;
      if (Math.sin(t * 0.23 + f.ph) > 0.85) { aR = -1.4; eR = -0.2; zR = -0.1; } }
    if (act === 'kneel') { hipY = 0.66; tL = -1.35; kL = 1.4; tR = 0.12; kR = 1.75; lean = 0.08 + Math.sin(t * 0.3 + f.ph) * 0.06; aL = aR = -1.25; eL = eR = -1.45; zL = -0.38; zR = 0.38; headX = 0.05; }
    tL -= crouch * 0.95; tR -= crouch * 0.95; kL += crouch * 1.7; kR += crouch * 1.7; lean += crouch * 0.38;
    b.hipL.rotation.set(tL, 0, 0.02); b.hipR.rotation.set(tR, 0, -0.02); b.kneeL.rotation.x = kL; b.kneeR.rotation.x = kR;
    b.ankleL.rotation.x = act === 'kneel' ? 0 : -(tL + kL) * 0.85; b.ankleR.rotation.x = act === 'kneel' ? -0.6 : -(tR + kR) * 0.85;
    b.shL.rotation.set(aL, 0, zL); b.shR.rotation.set(aR, 0, zR); b.elL.rotation.x = eL; b.elR.rotation.x = eR;
    b.chest.rotation.set(lean, act === 'dribble' ? -0.18 : Math.sin(f.ph) * amp * 0.12, 0); b.head.rotation.x = headX - lean * 0.5;
    const flight = sp > 3.5 ? Math.max(0, -Math.cos(f.ph * 2)) * 0.05 : 0;
    b.hips.position.y = hipY !== null ? hipY : Math.max(legH(tL, kL), legH(tR, kR)) + LEG.off + flight;
    f.jumpY = jump * f.s; b.root.position.set(f.pos.x, jump * f.s, f.pos.z); b.root.rotation.y = f.yaw;
    b.root.updateMatrixWorld(true);
  }

  function update(dt, t) {
    if (!g.parent || !g.parent.visible) return;
    dt = Math.min(dt, 0.05);
    if (R) return replayUpdate(dt, t);
    G.t += dt; G.cheerT = Math.max(0, G.cheerT - dt);
    if (!G.final) { G.clock -= dt; G.shot = Math.max(0, G.shot - (G.phase === 'tip' ? 0 : dt)); if (G.clock <= 0) { if (G.q < 4) { G.q++; G.clock = 720; if (opts.sound) opts.sound.horn(); } else { G.final = 8; G.clock = 0; if (opts.sound) opts.sound.horn(); } } }
    else { G.final -= dt; if (G.final <= 0) { G.final = 0; G.score = [0, 0]; G.q = 1; G.clock = 720; tip(); } }
    const off = T[G.off], def = T[1 - G.off], bk = basket(G.off);
    // the ball handler and the phase
    if (G.phase === 'tip') { if (G.t < 1.0) ball.position.set(0, 2.2 + G.t * 2.2, 0); else if (G.t < 1.5) { if (T[0][4].act !== 'jump') { T[0][4].act = 'jump'; T[1][4].act = 'jump'; T[0][4].actT = T[1][4].actT = 0; } } if (G.t > 1.5) { const w = Math.random() < 0.5 ? 0 : 1; T[w][4].act = 'run'; T[1 - w][4].act = 'run'; flyBall(ball.position.clone(), hand(T[w][0]), 0.5, 0.4, () => { give(T[w][0]); newPossession(w, false); }); G.phase = 'loosetip'; } }
    if (G.phase === 'inbound') { const inb = G.inb, pg = off[0], d = -dir(G.off);
      if (G.holder !== inb) { if (G.loose && !G.flight) { inb.tgt.set(G.loose.p.x, 0, G.loose.p.z); if (inb.pos.distanceTo(inb.tgt) < 0.9) { give(inb); G.loose = null; } } }
      else inb.tgt.set(d * (BASE + 0.6), 0, 1.2);
      pg.tgt.set(d * (BASE - 3.5), 0, -2.2);
      if (G.holder === inb && (inb.pos.distanceTo(inb.tgt) < 0.6 || G.t > 4.5)) { inb.act = 'pass'; inb.actT = 0; flyBall(hand(inb), hand(pg), 0.45, 0.4, () => { give(pg); G.phase = 'advance'; G.t = 0; }); G.phase = 'inflight'; }
      off.forEach((f, i) => { if (f !== inb && f !== pg) f.tgt.copy(spot(G.off, i)).lerp(V(0, 0, f.tgt.z), 0.45); }); }
    if (G.phase === 'advance') { const h = G.holder; if (h) { h.tgt.copy(spot(G.off, h.role)); if (h.pos.distanceTo(h.tgt) < 1.2 || G.t > 6) { G.phase = 'half'; G.t = 0; G.next = 0.9 + Math.random() * 1.2; } }
      off.forEach((f, i) => { if (f !== h) f.tgt.copy(spot(G.off, i)); }); }
    if (G.phase === 'half') { const h = G.holder; off.forEach((f, i) => { if (f !== h || true) f.tgt.copy(spot(G.off, i)); });
      if (h && G.t > G.next && h.act !== 'hold') {
        if (G.passes >= G.need || G.shot < 5) shoot(h);
        else { const others = off.filter((f) => f !== h); const to = others[(Math.random() * others.length) | 0]; h.act = 'pass'; h.actT = 0; G.passes++;
          if (Math.random() < 0.6) { G.set = (G.set + 1 + ((Math.random() * (SETS.length - 1)) | 0)) % SETS.length; }
          flyBall(hand(h), hand(to), 0.25 + h.pos.distanceTo(to.pos) / 13, 0.25, () => { give(to); G.phase = 'half'; G.t = 0; G.next = 0.8 + Math.random() * 1.4; }); G.phase = 'inflight'; } } }
    if (G.phase === 'shot') { off.forEach((f, i) => { if (f !== G.shooter) f.tgt.copy(spot(G.off, i)).lerp(bk, i >= 3 ? 0.45 : 0.1); }); }
    if (G.phase === 'rebound' && G.loose) { const all = off.concat(def); let best = null, bd = 1e9; for (const f of all) { const d = f.pos.distanceTo(V(G.loose.p.x, 0, G.loose.p.z)) - (f.role >= 3 ? 0.6 : 0) + (all.indexOf(f) < 5 ? 0.5 : 0); if (d < bd) { bd = d; best = f; } }
      all.forEach((f) => { if (f.role >= 3 || f === best) f.tgt.set(G.loose.p.x, 0, G.loose.p.z); });
      if (best && best.pos.distanceTo(V(G.loose.p.x, 0, G.loose.p.z)) < 0.7 && G.loose.p.y < 2.4) { const team = best.team; give(best); if (team !== G.off) newPossession(team, false); else { G.phase = 'half'; G.t = 0; G.next = 0.8; G.passes = G.need - 1; } } }
    // the defence: between each man and the rim, closer on the ball
    if (G.phase !== 'tip' && G.phase !== 'loosetip') def.forEach((f, i) => { if (G.phase === 'rebound' && (f.role >= 3)) return; const o = off[i], d = o.pos.distanceTo(bk), k = o === G.holder ? 0.95 : 1.6;
      f.tgt.copy(o.pos).addScaledVector(tmp.subVectors(bk, o.pos).setY(0).normalize(), Math.min(k, d * 0.4)); if (f.act !== 'shoot') f.act = d < 9 ? 'defend' : 'run'; });
    // the referees: lead on the baseline, trail at the top, centre opposite
    const dd = dir(G.off); refs[0].tgt.set(dd * (BASE + 0.9), 0, -3.5); refs[1].tgt.set(dd * 2.5, 0, SIDE + 0.3); refs[2].tgt.set(dd * 7.5, 0, -SIDE - 0.3);
    // move and pose everyone
    for (const f of T[0].concat(T[1], refs)) { if (f.act !== 'shoot') steer(f, dt); else f.vel.multiplyScalar(0.8); }
    separate();
    const look = G.holder ? G.holder.pos : ball.position;
    for (const f of T[0].concat(T[1], refs)) { if (f.act === 'defend' || f.kind === 'ref') face(f, dt, look); else face(f, dt, G.holder === f ? bk : look); if (f.act === 'run' && f === G.holder) f.act = 'dribble'; if (f.act === 'dribble' && f !== G.holder) f.act = 'run'; if (f.act === 'defend' && f.team === G.off) f.act = 'run'; }
    sideline(dt, t);
    figs.forEach((f) => pose(f, dt, t));
    // the ball
    if (G.flight) { const F = G.flight; F.t += dt; const k = Math.min(1, F.t / F.T); ball.position.lerpVectors(F.p0, F.p1, k); ball.position.y += 4 * F.h * k * (1 - k); ball.rotation.x -= dt * 8;
      if (k >= 1) { G.flight = null; F.then(); } }
    else if (G.holder) { const h = G.holder, b = h.b;
      if (h.act === 'dribble') { const bounce = Math.abs(Math.cos((h.dr || 0) / 2)); b.handR.getWorldPosition(tmp); ball.position.set(tmp.x + Math.sin(h.yaw) * 0.12, 0.12 + (tmp.y - 0.2) * bounce, tmp.z + Math.cos(h.yaw) * 0.12); ball.rotation.x += dt * 6; }
      else if (h.act === 'shoot' && !h.released) { b.handR.getWorldPosition(tmp); ball.position.set(tmp.x + Math.sin(h.yaw) * 0.06, tmp.y + 0.12, tmp.z + Math.cos(h.yaw) * 0.06); }
      else { b.chest.getWorldPosition(tmp); ball.position.set(tmp.x + Math.sin(h.yaw) * 0.34 * h.s, tmp.y + 0.28 * h.s, tmp.z + Math.cos(h.yaw) * 0.34 * h.s); } }
    else if (G.loose) { const L = G.loose; if (L.mode === 'bounce') { L.vy -= 9.8 * dt; L.p.addScaledVector(L.v, dt); L.p.y += L.vy * dt; if (L.p.y < 0.12) { L.p.y = 0.12; L.vy = Math.abs(L.vy) * 0.62; L.v.multiplyScalar(0.8); if (L.vy < 0.4) { L.vy = 0; L.mode = 'roll'; } } } else L.p.addScaledVector(L.v, dt), L.v.multiplyScalar(0.97); ball.position.copy(L.p); }
    writeInstances();
  }
  function sideline(dt, t) { // the coaches pace, the front row follows the ball, the photographers shift
    for (const f of coaches) { f.tgt.set(f.home.x + Math.sin(t * 0.17 + f.ph) * 1.2, 0, f.home.z); steer(f, dt); f.maxSp = 0.8; face(f, dt, ball.position); }
    for (const f of figs) if (f.kind === 'fan') { const w = Math.atan2(ball.position.x - f.pos.x, ball.position.z - f.pos.z); let d = w - f.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); f.b.head.rotation.y = clamp(d, -1.1, 1.1) * 0.9; }
    for (const f of photo) { if (rnd() < dt * 0.3) f.yaw += (rnd() - 0.5) * 0.3; }
  }
  function writeInstances() {
    meshes.forEach((m) => { const { bone, paired, list } = m.userData;
      (list || figs).forEach((f, i) => { if (paired) { m.setMatrixAt(i * 2, f.b[bone + 'L'].matrixWorld); m.setMatrixAt(i * 2 + 1, f.b[bone + 'R'].matrixWorld); } else m.setMatrixAt(i, f.b[bone].matrixWorld); });
      m.instanceMatrix.needsUpdate = true; });
    figs.forEach((f, i) => { if (!f.num) { numbers.setMatrixAt(i * 2, zero); numbers.setMatrixAt(i * 2 + 1, zero); return; } m4.multiplyMatrices(f.b.chest.matrixWorld, nf); numbers.setMatrixAt(i * 2, m4); m4.multiplyMatrices(f.b.chest.matrixWorld, nb); numbers.setMatrixAt(i * 2 + 1, m4); });
    numbers.instanceMatrix.needsUpdate = true;
    if (!UP) { photo.forEach((f, i) => cams.setMatrixAt(i, f.b.head.matrixWorld)); cams.instanceMatrix.needsUpdate = true; }
    if (flowers) writeFlowers();
    if (UP) UP.heads.forEach((h) => { h.userData.list.forEach((f, i) => { m4.multiplyMatrices(f.b.head.matrixWorld, UP.hoff); h.setMatrixAt(i, m4); }); h.instanceMatrix.needsUpdate = true; });
  }
  // ---------- the people pass: the sculpted bodies and their clothes replace the capsules once loaded (?capsules keeps them)
  let UP = null;
  const colOf = (f, k) => f.col[k] || (k === 'edge' ? f.col.jersey : k === 'edge2' ? (f.col.edge || f.col.shorts) : k === 'arm' ? f.col.skin : k === 'shin' ? f.col.skin : f.col.jersey);
  function upgrade(B) {
    const r = B.rig;
    for (const f of figs) { const b = f.b; b.hips.position.set(...r.hips); b.chest.position.set(...r.chest); b.head.position.set(...r.head);
      for (const [s, k] of [[1, 'L'], [-1, 'R']]) { b['sh' + k].position.set(s * r.sh[0], r.sh[1], r.sh[2]); b['el' + k].position.set(...r.el); b['hand' + k].position.set(...r.hand);
        b['hip' + k].position.set(s * r.hip[0], r.hip[1], r.hip[2]); b['knee' + k].position.set(...r.knee); b['ankle' + k].position.set(...r.ankle); } }
    LEG.th = -r.knee[1]; LEG.sh = -r.ankle[1]; LEG.an = 0.107; LEG.off = -r.hip[1];
    const skinM = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0 }), clothM = new THREE.MeshPhysicalMaterial({ roughness: 0.74, metalness: 0, sheen: 0.25, sheenRoughness: 0.8 });
    const nm = [], seated = new Set(['fan', 'photo']);
    for (const set of ['jersey', 'suit']) {
      const list = figs.filter((f) => !seated.has(f.kind) && ((set === 'suit') === (f.kind === 'ref' || f.kind === 'coach'))); if (!list.length) continue;
      for (const p of B.sets[set]) { const paired = PAIRED.has(p.bone), m = new THREE.InstancedMesh(p.geo, ['skin', 'arm', 'shin'].includes(p.key) ? skinM : clothM, list.length * (paired ? 2 : 1));
        m.frustumCulled = false; m.castShadow = true; m.receiveShadow = true; m.userData = { bone: p.bone, key: p.key, paired, list }; g.add(m); nm.push(m);
        const c = new THREE.Color(); list.forEach((f, i) => { c.set(colOf(f, p.key)).convertSRGBToLinear(); if (paired) { m.setColorAt(i * 2, c); m.setColorAt(i * 2 + 1, c); } else m.setColorAt(i, c); }); m.instanceColor.needsUpdate = true; } }
    meshes.forEach((m) => { m.visible = false; m.count = 0; }); meshes = nm;
    // the photographers' cameras sit at the seated cast's face (Astra 7: no dark blocks left floating on the court)
    photo.forEach((f, i) => { const fwd = V(Math.sin(f.yaw), 0, Math.cos(f.yaw)); m4.compose(V(f.pos.x + fwd.x * 0.3, 0.5, f.pos.z + fwd.z * 0.3), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, f.yaw, 0)), V(1, 1, 1)); cams.setMatrixAt(i, m4); }); cams.instanceMatrix.needsUpdate = true;
    // a NEW YORKERS flower head on every neck, as in the Cycles build; the old petal heads go
    const who = figs.filter((f) => !seated.has(f.kind)), heads = B.heads.map((geo, k) => { const list = who.filter((f, i) => (i * 5 + 2) % B.heads.length === k);
      const m = new THREE.InstancedMesh(geo, B.headMat, Math.max(1, list.length)); m.count = list.length; m.frustumCulled = false; m.castShadow = true; m.userData.list = list; g.add(m); return m; });
    if (flowers) { flowers.pm.visible = flowers.em.visible = false; flowers = null; }
    UP = { heads, hoff: new THREE.Matrix4().makeTranslation(0, -0.02, 0) };
    // the front row and the photographers: the cast, seated, the same figures as the bowl
    const fl = figs.filter((f) => f.kind === 'fan').map((f) => [f.pos.x, 0, f.pos.z, f.yaw]);
    const pl = photo.map((f) => [f.pos.x, -0.36, f.pos.z, f.yaw]);
    const extras = [];
    if (fl.length) extras.push(castCrowd(fl, { near: 30 }));
    if (pl.length) extras.push(castCrowd(pl, { near: 30, poses: ['sit_lean', 'sit_leanL', 'sit_leanR'] }));
    Promise.all(extras).then((cs) => { cs.forEach((c) => g.add(c.mesh)); if (opts.onCast) cs.forEach((c) => opts.onCast(c)); });
  }
  if (!new URLSearchParams(location.search).has('capsules')) loadBodies().then(upgrade).catch((e) => console.warn('bodies', e));
  // ---------- the replay: a game from sim/garden_sim.py drives the same bodies
  let flowers = null;
  const RS = { tau: opts.t0 || 0, speed: 1, manual: false, last: -1, seg: -1, off: V(), prev: V(), slots: [] };
  const playersOf = (a) => (a < 5 ? T[0][a] : a < 10 ? T[1][a - 5] : refs[a - 10]);
  function paint(f, i0) { const c = new THREE.Color(); meshes.forEach((m) => { const { key, paired, list } = m.userData; const i = list ? list.indexOf(f) : i0; if (i < 0) return; c.set(colOf(f, key)).convertSRGBToLinear(); if (paired) { m.setColorAt(i * 2, c); m.setColorAt(i * 2 + 1, c); } else m.setColorAt(i, c); m.instanceColor.needsUpdate = true; }); }
  function setNum(i, cell) { const A = numGeo.attributes.aOff, a = A.array; a.set([cell[0], cell[1]], i * 4); a.set([cell[0], cell[1]], i * 4 + 2); A.needsUpdate = true; }
  function setupReplay() {
    const D = R.D, kits = D.teams.map((tm) => tm.kit), cellOf = {};
    G.names = D.teams.map((tm) => tm.name); G.kits = kits; G.ids = D.teams.map((tm) => tm.id);
    // one atlas cell per roster number of both sides, then the referees
    ax.clearRect(0, 0, 1024, 512); let n = 0;
    const draw = (txt, fill, edge) => { const cx = (n % 8) * 128, cy = ((n / 8) | 0) * 128; ax.font = '96px Anton, Impact, sans-serif'; ax.textAlign = 'center'; ax.textBaseline = 'middle'; ax.lineJoin = 'round'; ax.lineWidth = 10; ax.strokeStyle = edge; ax.strokeText(txt, cx + 64, cy + 70); ax.fillStyle = fill; ax.fillText(txt, cx + 64, cy + 70); const c = [(n % 8) / 8, 1 - (((n / 8) | 0) + 1) / 4]; n++; return c; };
    D.teams.forEach((tm, ti) => tm.roster.forEach((p) => { cellOf[p.id] = draw(String(p.number), tm.kit.num, tm.kit.trim); }));
    refs.forEach((f, i) => setNum(figs.indexOf(f), draw(f.num, '#111', '#e8e8e8')));
    at.needsUpdate = true; RS.cellOf = cellOf;
    // the benches in warm up tops of their side
    bench.forEach((f) => { const k = kits[f.team]; f.col = { ...f.col, jersey: k.warm, arm: k.warm, shorts: k.shorts, thigh: k.shorts, sock: k.sock, shoe: k.shoe }; paint(f, figs.indexOf(f)); });
    // flower heads: eight petals round an eye that follows the ball (astra D: separate eye and flower controls)
    const petal = [], cast = D.cast || [];
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; petal.push(new THREE.SphereGeometry(1, 10, 6).scale(0.075, 0.13, 0.035).translate(0, 0.165, 0).rotateZ(a)); }
    for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * Math.PI * 2; petal.push(new THREE.SphereGeometry(1, 8, 5).scale(0.06, 0.1, 0.03).translate(0, 0.13, -0.02).rotateZ(a)); }
    const pg = mergeGeometries(petal.map((q) => q.toNonIndexed()));
    const eyeC = document.createElement('canvas'); eyeC.width = 256; eyeC.height = 128; const ex = eyeC.getContext('2d');
    ex.fillStyle = '#f6f8fc'; ex.fillRect(0, 0, 256, 128); ex.fillStyle = '#2962ff'; ex.beginPath(); ex.ellipse(64, 64, 20, 22, 0, 0, 7); ex.fill();
    ex.fillStyle = '#05060f'; ex.beginPath(); ex.ellipse(64, 64, 9, 10, 0, 0, 7); ex.fill(); ex.fillStyle = '#fff'; ex.beginPath(); ex.arc(59, 58, 3.5, 0, 7); ex.fill();
    const et = new THREE.CanvasTexture(eyeC); et.colorSpace = THREE.SRGBColorSpace;
    const who = figs.filter((f) => f.kind === 'player' || f.kind === 'bench');
    const pm = new THREE.InstancedMesh(pg, new THREE.MeshStandardMaterial({ roughness: 0.55, emissive: 0xffffff, emissiveIntensity: 0.06 }), who.length);
    const em = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 20, 14), new THREE.MeshStandardMaterial({ map: et, roughness: 0.25 }), who.length);
    pm.frustumCulled = em.frustumCulled = false; pm.castShadow = true; g.add(pm, em);
    const c = new THREE.Color(); who.forEach((f, i) => { const pc = cast.length ? cast[(i * 7 + 3) % cast.length].flower : '#ff4fa3'; f.flower = pc; c.set(pc).convertSRGBToLinear(); pm.setColorAt(i, c); });
    pm.instanceColor.needsUpdate = true;
    flowers = { who, pm, em, head: meshes.find((m) => m.userData.bone === 'head' && m.geometry.attributes.position.count > 200), hair: meshes[PARTS.findIndex((p) => p[0] === 'hair')] };
    G.score = [0, 0]; G.final = 0;
  }
  const fm = new THREE.Matrix4(), fo = new THREE.Matrix4().makeTranslation(0, 0.17, 0.03), inv = new THREE.Matrix4(), lv = V(), eq = new THREE.Quaternion(), ee = new THREE.Euler();
  function writeFlowers() {
    if (UP) return;
    const { who, pm, em } = flowers, headM = meshes[PARTS.findIndex((p) => p[0] === 'head')], hairM = meshes[PARTS.findIndex((p) => p[0] === 'hair')];
    who.forEach((f, i) => { const fi = figs.indexOf(f); headM.setMatrixAt(fi, zero); hairM.setMatrixAt(fi, zero);
      fm.multiplyMatrices(f.b.head.matrixWorld, fo); pm.setMatrixAt(i, fm);
      // the eye turns toward the ball inside the flower, at most about 35 degrees
      inv.copy(fm).invert(); lv.copy(ball.position).applyMatrix4(inv);
      ee.set(clamp(-Math.atan2(lv.y, Math.hypot(lv.x, lv.z)), -0.6, 0.6), clamp(Math.atan2(lv.x, lv.z), -0.6, 0.6), 0, 'YXZ'); eq.setFromEuler(ee);
      m4.compose(V(0, 0, 0.02), eq, V(1, 1, 1)); m4.premultiply(fm); em.setMatrixAt(i, m4); });
    pm.instanceMatrix.needsUpdate = true; em.instanceMatrix.needsUpdate = true;
  }
  const _a = [0, 0, 0], _v = [0, 0], _b = [0, 0, 0];
  const SHOOTS = new Set(['shoot', 'layup', 'dunk', 'ftshoot']), ONE = new Set(['shoot', 'layup', 'dunk', 'ftshoot', 'jump', 'contest', 'pass', 'signal']);
  function replayUpdate(dt, t) {
    if (!RS.manual) RS.tau += dt * RS.speed;
    const tau = RS.tau, jump = Math.abs(tau - RS.last) > 0.5 || RS.last < 0, gdt = jump ? 1 / 60 : Math.max(0, tau - RS.last);
    // who is on the floor
    const L = R.lineupAt(tau);
    for (let a = 0; a < 10; a++) { const pid = L[a < 5 ? 0 : 1][a % 5]; if (RS.slots[a] === pid) continue; RS.slots[a] = pid;
      const f = playersOf(a), p = R.P[pid], k = R.D.teams[p.team].kit, fi = figs.indexOf(f);
      f.pid = pid; f.col = { jersey: k.jersey, shorts: k.shorts, thigh: k.shorts, sock: k.sock, shoe: k.shoe, skin: p.skin, arm: p.skin, shin: p.skin, hair: '#111', num: k.num, edge: k.trim };
      f.s = p.height / 1.95; f.b.root.scale.setScalar(f.s); paint(f, fi); setNum(fi, RS.cellOf[pid]);
      if (flowers) { const c = new THREE.Color(p.flower).convertSRGBToLinear(); flowers.pm.setColorAt(flowers.who.indexOf(f), c); flowers.pm.instanceColor.needsUpdate = true; } }
    // everyone on the court from the timeline
    for (let a = 0; a < 13; a++) { const f = playersOf(a); R.actor(tau, a, _a); R.velocity(tau, a, _v);
      f.pos.set(_a[0], 0, _a[1]); f.yaw = _a[2]; f.vel.set(_v[0], 0, _v[1]);
      const [t0, act] = R.actAt(tau, a); f.act = act === 'run' ? 'run' : act; f.actT = ONE.has(act) ? tau - t0 - gdt : 1; f.released = false; }
    const { seg, i: si } = R.segAt(tau); let holder = null;
    if (seg.k === 'h') { holder = playersOf(seg.a); if (!SHOOTS.has(holder.act)) holder.act = seg.s === 'hold' || seg.s === 'shoot' ? 'hold' : 'dribble'; }
    for (let a = 0; a < 10; a++) { const f = playersOf(a); if (f !== holder && f.act === 'run' && f.team !== R.offAt(tau) && Math.hypot(f.vel.x, f.vel.z) < 3.5) { const [t0, act] = R.actAt(tau, a); if (act === 'defend') f.act = 'defend'; } }
    // the clocks and the score, read from the same record as the scoreboard
    const c = R.clockAt(tau); G.clock = c.clock; G.q = c.q; G.shot = c.shot < 0 ? 0 : c.shot; G.score = R.scoreAt(tau); G.off = R.offAt(tau); G.final = R.finalAt(tau) ? 1 : 0;
    const ls = R.lastScore(tau); G.cheerT = ls && tau - ls.t < 2.4 ? 2.4 - (tau - ls.t) : 0; if (ls) G.lastTeam = ls.team;
    if (!RS.manual && !jump && ls && ls.t > RS.last && ls.t <= tau) { if (opts.sound) opts.sound.swish(); if (opts.onScore) opts.onScore(ls.team, ls.pts); }
    G.tau = tau;
    sideline(dt, t);
    for (const f of figs) { const court = f.kind === 'player' || f.kind === 'ref'; pose(f, court ? gdt : dt, court ? tau : t); }
    // the ball: in a hand from the rig, otherwise its flight from the file
    if (seg.k === 'h') { const h = holder, b = h.b;
      if (h.act === 'dribble') { const bounce = Math.abs(Math.cos((h.dr || 0) / 2)); b.handR.getWorldPosition(tmp); ball.position.set(tmp.x + Math.sin(h.yaw) * 0.12, 0.12 + (tmp.y - 0.2) * bounce, tmp.z + Math.cos(h.yaw) * 0.12); ball.rotation.x += gdt * 6; }
      else if (SHOOTS.has(h.act)) { b.handR.getWorldPosition(tmp); ball.position.set(tmp.x + Math.sin(h.yaw) * 0.06, tmp.y + 0.12, tmp.z + Math.cos(h.yaw) * 0.06); }
      else { b.chest.getWorldPosition(tmp); ball.position.set(tmp.x + Math.sin(h.yaw) * 0.34 * h.s, tmp.y + 0.28 * h.s, tmp.z + Math.cos(h.yaw) * 0.34 * h.s); } }
    else { R.evalSeg(seg, tau, _b); ball.position.set(_b[0], _b[1], _b[2]); if (seg.k === 'f') ball.rotation.x -= gdt * 15; }
    // no teleports at a catch or a release: carry the old position in and let it fade over a few hundredths
    if (si !== RS.seg) { if (!jump && RS.seg >= 0) RS.off.copy(RS.prev).sub(ball.position); else RS.off.set(0, 0, 0); RS.seg = si; }
    RS.off.multiplyScalar(Math.exp(-gdt / 0.06)); ball.position.add(RS.off); RS.prev.copy(ball.position);
    RS.last = tau;
    writeInstances();
  }
  if (R) setupReplay();
  G.lastTeam = 0; const prevOn = opts.onScore; opts.onScore = (team, pts) => { G.lastTeam = team; if (prevOn) prevOn(team, pts); };
  return { G, update, group: g, ball, R, RS, figs, actorFig: playersOf };
}
function mergeTwo(a, b) { // two plain geometries with position and normal only, one index
  const ga = a.toNonIndexed(), gb = b.toNonIndexed(); const out = new THREE.BufferGeometry();
  for (const k of ['position', 'normal']) { const A = ga.attributes[k].array, B = gb.attributes[k].array, C = new Float32Array(A.length + B.length); C.set(A); C.set(B, A.length); out.setAttribute(k, new THREE.BufferAttribute(C, 3)); }
  return out;
}
