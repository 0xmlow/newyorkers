// THE GARDEN: the bowl. Stepped concrete rows round the stadium shaped floor, about 14,000 seats in one draw,
// a crowd of eye flower New Yorkers in two draws, the wave and the phone lights done in the vertex shader.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { LOW, UP, CLUB, BACK, BACK_TOP, stadiumPoint, perimeter, inTunnel, TUN_H, TUNNELS, TUN_W, FL, FR } from './layout.js';

const SEAT_W = 0.56;
export function buildBowl(scene, tex, U) {
  const g = new THREE.Group(); scene.add(g);
  // 1. the rows: one strip of treads and risers per row, cut where a tunnel runs under a low row
  const rows = [];
  for (let r = 0; r < LOW.rows; r++) rows.push({ d: LOW.d0 + r * LOW.depth, depth: LOW.depth, y: (r + 1) * LOW.rise, yp: r * LOW.rise, up: false, r });
  for (let r = 0; r < UP.rows; r++) rows.push({ d: UP.d0 + r * UP.depth, depth: UP.depth, y: UP.y0 + (r + 1) * UP.rise, yp: r === 0 ? UP.y0 : UP.y0 + r * UP.rise, up: true, r });
  const pos = [], uv = [], nor = [], N = 320;
  const quad = (a, b, c, d, n, us) => { for (const p of [a, b, c, a, c, d]) pos.push(...p); for (let i = 0; i < 6; i++) nor.push(...n); uv.push(...us); };
  for (const row of rows) {
    for (let i = 0; i < N; i++) {
      const s0 = i / N, s1 = (i + 1) / N, P0 = stadiumPoint(s0, row.d), P1 = stadiumPoint(s1, row.d), Q0 = stadiumPoint(s0, row.d + row.depth), Q1 = stadiumPoint(s1, row.d + row.depth);
      const mx = (P0[0] + Q1[0]) / 2, mz = (P0[1] + Q1[1]) / 2; if (inTunnel(mx, mz) && row.y < TUN_H + 0.3) continue;
      const L = perimeter(row.d) / N, u0 = i * L / 2, u1 = u0 + L / 2;
      quad([P0[0], row.y, P0[1]], [P1[0], row.y, P1[1]], [Q1[0], row.y, Q1[1]], [Q0[0], row.y, Q0[1]], [0, 1, 0], [u0, 0, u1, 0, u1, 0.4, u0, 0, u1, 0.4, u0, 0.4]);
      const n = [-(P0[2] + P1[2]) / 2, 0, -(P0[3] + P1[3]) / 2];
      quad([P1[0], row.yp, P1[1]], [P0[0], row.yp, P0[1]], [P0[0], row.y, P0[1]], [P1[0], row.y, P1[1]], n, [u1, 0, u0, 0, u0, 0.3, u1, 0, u0, 0.3, u1, 0.3]);
    }
  }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); rg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); rg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  const conc = new THREE.MeshStandardMaterial({ map: tex.concrete, normalMap: tex.concreteN, roughnessMap: tex.concreteR, color: 0x8d93a6, roughness: 0.9, side: THREE.DoubleSide });
  g.add(new THREE.Mesh(rg, conc));
  // 2. the club level: a band of dark suite glass, and over it the LED ribbon (Firefly fascia) that runs right round
  const band = (d, y0, y1, mat, rep) => {
    const p = [], u = [], M = 360; for (let i = 0; i <= M; i++) { const P = stadiumPoint(i / M, d); p.push(P[0], y0, P[1], P[0], y1, P[1]); u.push(i / M * rep, 0, i / M * rep, 1); }
    const idx = []; for (let i = 0; i < M; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); bg.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2)); bg.setIndex(idx); bg.computeVertexNormals();
    const m = new THREE.Mesh(bg, mat); g.add(m); return m;
  };
  band(CLUB.d0, CLUB.y0, CLUB.y0 + 0.95, new THREE.MeshStandardMaterial({ color: 0x0a0e1e, roughness: 0.6 }), 1);
  U.ribbon = band(CLUB.d0 - 0.02, CLUB.y0 + 0.95, CLUB.y1, new THREE.MeshBasicMaterial({ color: 0xffffff, map: tex.fascia, side: THREE.DoubleSide, toneMapped: false }), 18);
  band(CLUB.d1, CLUB.y0, CLUB.y1, new THREE.MeshStandardMaterial({ color: 0x141a33, roughness: 0.3, metalness: 0.4 }), 1);
  // a ribbon also runs along the very top, under the roof
  U.ribbon2 = band(BACK - 0.05, BACK_TOP - 1.4, BACK_TOP, new THREE.MeshBasicMaterial({ color: 0xffffff, map: tex.fascia, side: THREE.DoubleSide, toneMapped: false }), 22);
  band(BACK, 0, BACK_TOP, new THREE.MeshStandardMaterial({ map: tex.concrete2, color: 0x6b7290, roughness: 0.95, side: THREE.DoubleSide }), 40);
  // 3. the tunnels: two walls and a lid, lit inside, a section number over each mouth
  const tunMat = new THREE.MeshStandardMaterial({ map: tex.concrete, color: 0x7d8398, roughness: 0.9, side: THREE.DoubleSide });
  for (const t of TUNNELS) {
    const len = BACK - LOW.d0 + 0.8, w = TUN_W * 2, cx = t.nz ? t.x : t.nx * (FL + FR + LOW.d0 + len / 2), cz = t.nz ? t.nz * (FR + LOW.d0 + len / 2) : 0;
    const box = (sx, sy, sz, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), tunMat); m.position.set(x, y, z); g.add(m); };
    if (t.nz) { box(0.3, TUN_H, len, cx - w / 2, TUN_H / 2, cz); box(0.3, TUN_H, len, cx + w / 2, TUN_H / 2, cz); box(w + 0.3, 0.3, len, cx, TUN_H + 0.15, cz); }
    else { box(len, TUN_H, 0.3, cx, TUN_H / 2, -w / 2); box(len, TUN_H, 0.3, cx, TUN_H / 2, w / 2); box(len, 0.3, w + 0.3, cx, TUN_H + 0.15, cz); }
  }
  // 4. seats and the crowd
  const seatPos = [];
  rows.forEach((row) => {
    const n = Math.floor(perimeter(row.d + 0.3) / SEAT_W);
    for (let i = 0; i < n; i++) {
      if (i % 16 === 0) continue;                       // the aisles
      const P = stadiumPoint(i / n, row.d + 0.3); if (inTunnel(P[0], P[1]) && row.y < TUN_H + 0.3) continue;
      seatPos.push([P[0], row.y, P[1], Math.atan2(-P[2], -P[3]), row.up]);
    }
  });
  const seatG = mergeGeometries([new THREE.BoxGeometry(0.48, 0.08, 0.44).translate(0, 0.42, 0.02), new THREE.BoxGeometry(0.48, 0.5, 0.07).translate(0, 0.68, -0.2), new THREE.BoxGeometry(0.06, 0.4, 0.06).translate(0, 0.2, 0)]);
  const seats = new THREE.InstancedMesh(seatG, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55 }), seatPos.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1), c = new THREE.Color();
  seatPos.forEach((s, i) => { q.setFromEuler(e.set(0, s[3], 0)); m4.compose(new THREE.Vector3(s[0], s[1], s[2]), q, one); seats.setMatrixAt(i, m4); seats.setColorAt(i, c.set(s[4] ? 0x1d3a9e : 0x2962ff).multiplyScalar(0.55)); });
  g.add(seats);
  // the crowd: three in four seats taken, a body and a flower head that faces the floor
  const ppl = seatPos.filter(() => Math.random() < 0.76);
  const body = mergeGeometries([new THREE.BoxGeometry(0.42, 0.56, 0.26).translate(0, 0.78, -0.06), new THREE.BoxGeometry(0.12, 0.42, 0.12).translate(-0.27, 0.72, 0), new THREE.BoxGeometry(0.12, 0.42, 0.12).translate(0.27, 0.72, 0)]);
  const head = new THREE.PlaneGeometry(0.46, 0.46).translate(0, 1.3, 0.02);
  const waveU = { uWave: { value: 0 }, uWaveOn: { value: 0 }, uT: { value: 0 } };
  const waveify = (mat, arms) => { mat.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, waveU);
    sh.vertexShader = 'uniform float uWave,uWaveOn,uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vec3 ip = vec3(instanceMatrix[3]); float th = atan(ip.z, ip.x); float dd = mod(th - uWave + 3.14159, 6.28318) - 3.14159;
      float up = uWaveOn * exp(-dd * dd * 26.0); transformed.y += up * 0.55 + sin(uT * 2.0 + ip.x * 0.7 + ip.z) * 0.015;
      ${arms ? 'if (abs(position.x) > 0.2) transformed.y += up * 0.45;' : ''}`); }; return mat; };
  const bodies = new THREE.InstancedMesh(body, waveify(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 }), true), ppl.length);
  const heads = new THREE.InstancedMesh(head, waveify(new THREE.MeshStandardMaterial({ map: tex.flower, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.7, emissive: 0xffffff, emissiveMap: tex.flower, emissiveIntensity: 0.12 }), false), ppl.length);
  const PAL = [0x2962ff, 0xff4fa3, 0x22d3ee, 0xeef2f8, 0x0d0d0d, 0xff6a3d, 0x7a4fd0, 0x1e8a5a, 0xd8d0c0, 0x3a3f58];
  const FLOWER = [0xffffff, 0xffd6ea, 0xc9f6ff, 0xdde4ff];
  ppl.forEach((s, i) => { q.setFromEuler(e.set(0, s[3], 0)); m4.compose(new THREE.Vector3(s[0], s[1], s[2]), q, one); bodies.setMatrixAt(i, m4); heads.setMatrixAt(i, m4);
    bodies.setColorAt(i, c.set(PAL[(Math.random() * PAL.length) | 0])); heads.setColorAt(i, c.set(FLOWER[(Math.random() * FLOWER.length) | 0])); });
  g.add(bodies, heads);
  // 5. phone lights for the concert: one point per person, twinkling, off until the house goes dark
  const pp = new Float32Array(ppl.length * 3), ph = new Float32Array(ppl.length);
  ppl.forEach((s, i) => { pp[i * 3] = s[0] - Math.sin(s[3]) * -0.25; pp[i * 3 + 1] = s[1] + 1.55; pp[i * 3 + 2] = s[2] - Math.cos(s[3]) * -0.25; ph[i] = Math.random() * 6.28; });
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('aPh', new THREE.BufferAttribute(ph, 1));
  const phoneU = { uT: waveU.uT, uOn: { value: 0 }, uPx: { value: 1 } };
  const phones = new THREE.Points(pg, new THREE.ShaderMaterial({ uniforms: phoneU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'attribute float aPh; uniform float uT,uOn,uPx; varying float vA; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); gl_Position = projectionMatrix * mv; float tw = 0.55 + 0.45 * sin(uT * 1.7 + aPh * 3.0); vA = uOn * tw * step(0.35, fract(aPh * 7.13)); gl_PointSize = uPx * 140.0 / -mv.z; }',
    fragmentShader: 'varying float vA; void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c); float a = smoothstep(0.5, 0.0, d); a = a * a * vA; if (a < 0.01) discard; gl_FragColor = vec4(vec3(0.85, 0.93, 1.0) * a * 1.6, a); }' }));
  phones.frustumCulled = false; g.add(phones);
  U.wave = waveU; U.phones = phoneU; U.crowdN = ppl.length; U.seatN = seatPos.length; U.ppl = ppl;
  return g;
}
