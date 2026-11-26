// THE GARDEN: the bowl. Stepped concrete rows round the stadium shaped floor, about 14,000 seats in one draw,
// a crowd of eye flower New Yorkers in two draws, the wave and the phone lights done in the vertex shader.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { seatedGeometry, peopleMaterial, peopleMesh } from './people.js';
const PHONE = matchMedia('(pointer:coarse)').matches;
import { LOW, UP, CLUB, BACK, BACK_TOP, stadiumPoint, perimeter, inTunnel, TUN_H, TUNNELS, TUN_W, FL, FR } from './layout.js';

const SEAT_W = 0.56;
export function buildBowl(scene, tex, U) {
  const g = new THREE.Group(); scene.add(g);
  // 1. the rows: one strip of treads and risers per row, cut where a tunnel runs under a low row
  const rows = [];
  for (let r = 0; r < LOW.rows; r++) rows.push({ d: LOW.d0 + r * LOW.depth, depth: LOW.depth, y: (r + 1) * LOW.rise, yp: r * LOW.rise, up: false, r });
  for (let r = 0; r < UP.rows; r++) rows.push({ d: UP.d0 + r * UP.depth, depth: UP.depth, y: UP.y0 + (r + 1) * UP.rise, yp: r === 0 ? UP.y0 : UP.y0 + r * UP.rise, up: true, r });
  const T = { pos: [], uv: [], nor: [] }, Rz = { pos: [], uv: [], nor: [] }; let pos, uv, nor; const N = 320;
  const quad = (a, b, c, d, n, us) => { for (const p of [a, b, c, a, c, d]) pos.push(...p); for (let i = 0; i < 6; i++) nor.push(...n); uv.push(...us); };
  const use = (o) => { pos = o.pos; uv = o.uv; nor = o.nor; };
  for (const row of rows) {
    for (let i = 0; i < N; i++) {
      const s0 = i / N, s1 = (i + 1) / N, P0 = stadiumPoint(s0, row.d), P1 = stadiumPoint(s1, row.d), Q0 = stadiumPoint(s0, row.d + row.depth), Q1 = stadiumPoint(s1, row.d + row.depth);
      const mx = (P0[0] + Q1[0]) / 2, mz = (P0[1] + Q1[1]) / 2; if (inTunnel(mx, mz) && row.y < TUN_H + 0.3) continue;
      const L = perimeter(row.d) / N, u0 = i * L / 2, u1 = u0 + L / 2;
      use(T); quad([P0[0], row.y, P0[1]], [P1[0], row.y, P1[1]], [Q1[0], row.y, Q1[1]], [Q0[0], row.y, Q0[1]], [0, 1, 0], [u0, 0, u1, 0, u1, 0.4, u0, 0, u1, 0.4, u0, 0.4]);
      const n = [-(P0[2] + P1[2]) / 2, 0, -(P0[3] + P1[3]) / 2];
      use(Rz); quad([P1[0], row.yp, P1[1]], [P0[0], row.yp, P0[1]], [P0[0], row.y, P0[1]], [P1[0], row.y, P1[1]], n, [u1, 0, u0, 0, u0, 0.3, u1, 0, u0, 0.3, u1, 0.3]);
    }
  }
  const geo = (o) => { const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(o.pos, 3)); rg.setAttribute('normal', new THREE.Float32BufferAttribute(o.nor, 3)); rg.setAttribute('uv', new THREE.Float32BufferAttribute(o.uv, 2)); return rg; };
  const conc = new THREE.MeshStandardMaterial({ map: tex.concrete, normalMap: tex.concreteN, roughnessMap: tex.concreteR, color: 0x5d6270, roughness: 0.9, side: THREE.DoubleSide });
  g.add(new THREE.Mesh(geo(T), conc));
  g.add(new THREE.Mesh(geo(Rz), new THREE.MeshStandardMaterial({ color: 0x15171e, roughness: 0.7, side: THREE.DoubleSide })));
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
  // 4. seats in radial sections: aisles every 8 m down the long sides and every 30 degrees round the ends
  const AX = [-12, -4, 4, 12], AP = [-Math.PI / 3, -Math.PI / 6, 0, Math.PI / 6, Math.PI / 3];
  const aisleGap = (x, z, d) => { if (Math.abs(x) <= FL) return Math.min(...AX.map((a) => Math.abs(x - a))); const ph = Math.atan2(z, Math.abs(x) - FL); return Math.min(...AP.map((a) => Math.abs(ph - a))) * (FR + d); };
  const seatPos = [];
  rows.forEach((row) => {
    const dd = row.d + 0.45, n = Math.floor(perimeter(dd) / SEAT_W);
    for (let i = 0; i < n; i++) {
      const P = stadiumPoint(i / n, dd); if (inTunnel(P[0], P[1]) && row.y < TUN_H + 0.3) continue;
      if (aisleGap(P[0], P[1], dd) < 0.62) continue;
      seatPos.push([P[0], row.y, P[1], Math.atan2(-P[2], -P[3]), row.up]);
    }
  });
  const rb = (w, h, d, r) => new RoundedBoxGeometry(w, h, d, 2, r);
  const seatG = mergeGeometries([rb(0.47, 0.07, 0.42, 0.03).translate(0, 0.44, 0.02), rb(0.47, 0.54, 0.06, 0.03).rotateX(-0.16).translate(0, 0.74, -0.22),
    new THREE.BoxGeometry(0.05, 0.62, 0.5).translate(0.265, 0.31, -0.02), new THREE.BoxGeometry(0.06, 0.04, 0.34).translate(0.265, 0.64, 0.0)].map((g) => { g.deleteAttribute('uv'); return g.index ? g.toNonIndexed() : g; }));
  const seats = new THREE.InstancedMesh(seatG, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.72, metalness: 0.0 }), seatPos.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1), c = new THREE.Color();
  seatPos.forEach((s, i) => { q.setFromEuler(e.set(0, s[3], 0)); m4.compose(new THREE.Vector3(s[0], s[1], s[2]), q, one); seats.setMatrixAt(i, m4); seats.setColorAt(i, c.setHSL(0.63, 0.28, s[4] ? 0.035 : 0.045 + Math.random() * 0.006)); });
  g.add(seats);
  // the aisles: a half step in each, a lit nosing, a handrail down the middle
  const aisles = []; for (const s of [-1, 1]) { for (const x of AX) aisles.push((d) => [x, s * (FR + d), 0, -s]); for (const ph of AP) aisles.push((d) => { const R = FR + d; return [s * (FL + R * Math.cos(ph)), R * Math.sin(ph), -s * Math.cos(ph), -Math.sin(ph)]; }); }
  const stepM = [], noseM = [];
  for (const A of aisles) for (const row of rows) { const [x, z, nx, nz] = A(row.d + row.depth * 0.75); const rise = row.y - row.yp; if (inTunnel(x, z) && row.y < TUN_H + 0.3) continue; const yaw = Math.atan2(nx, nz);
    q.setFromEuler(e.set(0, yaw, 0)); stepM.push(new THREE.Matrix4().compose(new THREE.Vector3(x, row.y + rise / 4, z), q, new THREE.Vector3(1.05, rise / 2, row.depth / 2)));
    const [x2, z2] = A(row.d + 0.02); noseM.push(new THREE.Matrix4().compose(new THREE.Vector3(x2, row.y + 0.004, z2), q, new THREE.Vector3(1, 1, 1))); }
  const steps = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0, 0), conc, stepM.length); stepM.forEach((m, i) => steps.setMatrixAt(i, m)); g.add(steps);
  const noses = new THREE.InstancedMesh(new THREE.BoxGeometry(1.0, 0.012, 0.05), new THREE.MeshBasicMaterial({ color: 0xb7c4e8, toneMapped: false }), noseM.length); noseM.forEach((m, i) => noses.setMatrixAt(i, m)); g.add(noses);
  const railG = [];
  const tube = (A, B, r) => { const L = A.distanceTo(B); const cg = new THREE.CylinderGeometry(r, r, L, 6); cg.translate(0, L / 2, 0); cg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize())); cg.translate(A.x, A.y, A.z); cg.deleteAttribute('uv'); return cg; };
  for (const A of aisles) for (const [r0, r1] of [[2, LOW.rows - 1], [UP.rows + LOW.rows - 13, rows.length - 1]]) {
    const a = rows[r0], b = rows[r1]; const [x0, z0] = A(a.d + 0.2), [x1, z1] = A(b.d + 0.2); if (inTunnel(x0, z0) || inTunnel(x1, z1)) continue;
    const P0 = new THREE.Vector3(x0, a.y + 0.92, z0), P1 = new THREE.Vector3(x1, b.y + 0.92, z1); railG.push(tube(P0, P1, 0.024));
    for (let k = r0; k <= r1; k += 3) { const rw = rows[k]; const [xp, zp] = A(rw.d + 0.2); railG.push(tube(new THREE.Vector3(xp, rw.y, zp), new THREE.Vector3(xp, rw.y + 0.92 + (k - r0) / (r1 - r0) * 0.0, zp), 0.02)); }
  }
  // the front of the upper bowl: glass on a steel shoe; the front of the lower bowl: a padded wall with an LED strip
  { const p = [], M = 360; for (let i = 0; i < M; i++) { const A = stadiumPoint(i / M, UP.d0 + 0.05), B = stadiumPoint((i + 1) / M, UP.d0 + 0.05);
      railG.push(tube(new THREE.Vector3(A[0], CLUB.y1 + 1.05, A[1]), new THREE.Vector3(B[0], CLUB.y1 + 1.05, B[1]), 0.03)); } }
  g.add(new THREE.Mesh(mergeGeometries(railG), new THREE.MeshStandardMaterial({ color: 0xaab2c4, metalness: 0.9, roughness: 0.28 })));
  band(UP.d0 + 0.05, CLUB.y1, CLUB.y1 + 1.02, new THREE.MeshPhysicalMaterial({ color: 0xcfe0ff, transparent: true, opacity: 0.14, roughness: 0.05, depthWrite: false, side: THREE.DoubleSide }), 1);
  band(LOW.d0 - 0.06, 0, 1.0, new THREE.MeshStandardMaterial({ color: 0x0b0d14, roughness: 0.75 }), 1);
  U.ribbonLow = band(LOW.d0 - 0.1, 0.22, 0.82, new THREE.MeshBasicMaterial({ color: 0x9aa6c8, map: tex.fascia, toneMapped: false }), 30);
  // the crowd: nine in ten seats taken, seated people coloured as a winter crowd
  const ppl = seatPos.filter(() => Math.random() < (PHONE ? 0.6 : 0.9));
  const waveU = { uWave: { value: 0 }, uWaveOn: { value: 0 }, uT: { value: 0 } };
  g.add(peopleMesh(seatedGeometry, peopleMaterial(waveU), ppl, { chunks: 48, near: 20 }));
  // 5. phone lights for the concert: one point per person, twinkling, off until the house goes dark
  const pp = new Float32Array(ppl.length * 3), ph = new Float32Array(ppl.length);
  ppl.forEach((s, i) => { pp[i * 3] = s[0] + Math.sin(s[3]) * 0.32; pp[i * 3 + 1] = s[1] + 1.12; pp[i * 3 + 2] = s[2] + Math.cos(s[3]) * 0.32; ph[i] = Math.random() * 6.28; });
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('aPh', new THREE.BufferAttribute(ph, 1));
  const phoneU = { uT: waveU.uT, uOn: { value: 0 }, uPx: { value: 1 } };
  const phones = new THREE.Points(pg, new THREE.ShaderMaterial({ uniforms: phoneU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'attribute float aPh; uniform float uT,uOn,uPx; varying float vA; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); gl_Position = projectionMatrix * mv; float tw = 0.55 + 0.45 * sin(uT * 1.7 + aPh * 3.0); vA = uOn * tw * step(0.35, fract(aPh * 7.13)); gl_PointSize = uPx * 140.0 / -mv.z; }',
    fragmentShader: 'varying float vA; void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c); float a = smoothstep(0.5, 0.0, d); a = a * a * vA; if (a < 0.01) discard; gl_FragColor = vec4(vec3(0.85, 0.93, 1.0) * a * 1.6, a); }' }));
  phones.frustumCulled = false; g.add(phones);
  U.wave = waveU; U.phones = phoneU; U.crowdN = ppl.length; U.seatN = seatPos.length; U.ppl = ppl; U.peopleWave = waveU;
  return g;
}
