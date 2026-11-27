// THE GARDEN: the building round the bowl. The drum, the roof of 48 cables, the scoreboard, the two hanging bridges,
// the concourse with its hang and its pieces, the escalators down to Seventh Avenue, the street, the floors' furniture.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { STREET, DRUM_IN, DRUM_OUT, ROOF_RIM, HUB_R, BACK, BACK_TOP, LIFTS, BRIDGE, ENTRY, entryY, sd, FL, FR, stadiumPoint } from './layout.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export function put(o, p) { if (p.position) o.position.copy(p.position); if (p.rotation) o.rotation.copy(p.rotation); return o; }

export function cylWall(r, y0, y1, mat, { a0 = 0, a1 = Math.PI * 2, seg = 160, rep = 1, inside = true, gap = null, v = [0, 1] } = {}) {
  const p = [], u = [], idx = []; let n = 0;
  for (let i = 0; i <= seg; i++) { const a = a0 + (a1 - a0) * i / seg; p.push(Math.cos(a) * r, y0, Math.sin(a) * r, Math.cos(a) * r, y1, Math.sin(a) * r); u.push(i / seg * rep, v[0], i / seg * rep, v[1]); n++; }
  for (let i = 0; i < seg; i++) {
    const am = a0 + (a1 - a0) * (i + 0.5) / seg; if (gap && gap(am)) continue;
    const a = i * 2; inside ? idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2) : idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2)); g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}
const entryGap = (r) => (a) => Math.abs(Math.sin(a) * r) < ENTRY.w + 0.6 && Math.cos(a) > 0;

export function buildWorld(scene, tex, U) {
  const W = new THREE.Group(); scene.add(W);
  const conc = new THREE.MeshStandardMaterial({ map: tex.concrete, normalMap: tex.concreteN, color: 0x9aa0b4, roughness: 0.92 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x0c1022, roughness: 0.7 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x8a93a8, metalness: 0.85, roughness: 0.35 });
  // ---- the drum: inside face above the bowl, the concourse wall with its hang, and outside the ribbed precast skin
  const innerMat = new THREE.MeshStandardMaterial({ map: tex.concrete2, color: 0x4a5272, roughness: 0.95, side: THREE.DoubleSide });
  W.add(cylWall(DRUM_IN, 7.2, ROOF_RIM, innerMat, { rep: 60, seg: 320 }));
  W.add(cylWall(DRUM_IN, 0, 7.2, innerMat, { rep: 60, seg: 320, gap: entryGap(DRUM_IN) }));
  // outside: the ribbed precast skin with the Firefly drum mural, cut where the escalator hall comes through
  const H = ROOF_RIM + 2 - STREET, vCut = (8 - STREET) / H;
  const outMat = new THREE.MeshStandardMaterial({ map: tex.concrete, normalMap: tex.concreteN, color: 0x8c909a, roughness: 0.85, side: THREE.DoubleSide });
  W.add(cylWall(DRUM_OUT, 8, ROOF_RIM + 2, outMat, { rep: 9, seg: 320, inside: false, v: [vCut, 1] }));
  W.add(cylWall(DRUM_OUT, STREET, 8, outMat, { rep: 9, seg: 320, inside: false, v: [0, vCut], gap: entryGap(DRUM_OUT) }));
  // the thickness of the drum at the cut, and a lintel over it
  for (const s of [-1, 1]) { const j = new THREE.Mesh(new THREE.BoxGeometry(DRUM_OUT - DRUM_IN + 0.6, 8 - STREET, 0.3), conc); j.position.set((DRUM_IN + DRUM_OUT) / 2, (8 + STREET) / 2, s * (ENTRY.w + 0.7)); W.add(j); }
  // vertical precast fins round the outside, 96 of them
  const fins = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, ROOF_RIM + 2 - STREET, 1.1), new THREE.MeshStandardMaterial({ map: tex.concrete, color: 0xc4c8d4, roughness: 0.8 }), 96);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), one = V(1, 1, 1);
  for (let i = 0; i < 96; i++) { const a = i / 96 * Math.PI * 2; q.setFromAxisAngle(V(0, 1, 0), -a); m4.compose(V(Math.cos(a) * (DRUM_OUT + 0.5), (ROOF_RIM + 2 + STREET) / 2, Math.sin(a) * (DRUM_OUT + 0.5)), q, one); fins.setMatrixAt(i, Math.abs(Math.sin(a) * DRUM_OUT) < ENTRY.w + 1 && Math.cos(a) > 0 ? new THREE.Matrix4().makeScale(0, 0, 0) : m4); }
  W.add(fins);
  // a crown band at the top of the drum, lit
  W.add(cylWall(DRUM_OUT + 1.1, ROOF_RIM - 1, ROOF_RIM + 2.2, new THREE.MeshBasicMaterial({ map: tex.fascia, color: 0xffffff, toneMapped: false }), { rep: 14, inside: false }));
  // ---- the concourse: floor, ceiling at 7 m, the mural band, the hang
  const cfloor = new THREE.Mesh(ringShape(DRUM_IN, BACK, 0.01), new THREE.MeshStandardMaterial({ map: tex.concrete2, color: 0x5a5d66, roughness: 0.2, metalness: 0.0 })); W.add(cfloor);
  // concession stands on the bowl side of the concourse: steel counters, lit menu boards, a header and a hood light
  { const steelS = new THREE.MeshStandardMaterial({ color: 0xb8bcc6, metalness: 0.85, roughness: 0.32 }), black = new THREE.MeshStandardMaterial({ color: 0x0d0e12, roughness: 0.5 });
    const R = FR + BACK + 0.5, spots = [[12.5, -R, 0, -1], [-12.5, -R, 0, -1], [12.5, R, 0, 1], [-12.5, R, 0, 1]];
    for (const sx of [1, -1]) for (const an of [-0.62, 0.62]) spots.push([sx * (FL + R * Math.cos(an)), R * Math.sin(an), sx * Math.cos(an), Math.sin(an)]);
    spots.forEach((P, i) => {
      const [x, z, nx, nz] = P, yaw = Math.atan2(nx, nz), st = new THREE.Group(); st.position.set(x, 0, z); st.rotation.y = yaw; W.add(st);
      const ctr = new THREE.Mesh(new THREE.BoxGeometry(6, 1.05, 0.75), steelS); ctr.position.set(0, 0.525, 1.3); st.add(ctr);
      const kick = new THREE.Mesh(new THREE.BoxGeometry(6.02, 0.15, 0.77), black); kick.position.set(0, 0.075, 1.3); st.add(kick);
      const back = new THREE.Mesh(new THREE.BoxGeometry(6.4, 3.2, 0.3), black); back.position.set(0, 1.6, 0.05); st.add(back);
      const menu = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 1.8), new THREE.MeshBasicMaterial({ map: tex.menus[i % tex.menus.length], toneMapped: false, color: 0xd8d8d8 })); menu.position.set(0, 2.15, 0.21); st.add(menu);
      const hood = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.25, 1.6), black); hood.position.set(0, 3.3, 0.9); st.add(hood);
      const hl = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.12), new THREE.MeshBasicMaterial({ color: 0xffe2b8, toneMapped: false })); hl.rotation.x = Math.PI / 2; hl.position.set(0, 3.17, 1.4); st.add(hl);
      const cooler = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.9, 0.6), new THREE.MeshStandardMaterial({ color: 0x1a1c22, emissive: 0xcfe6ff, emissiveIntensity: 0.25, roughness: 0.2 })); cooler.position.set(2.3, 0.95, 0.5); st.add(cooler);
    }); }
  const ceil = new THREE.Mesh(ringShape(DRUM_IN, BACK, 7.2), new THREE.MeshStandardMaterial({ color: 0x0f1330, roughness: 0.9, side: THREE.DoubleSide })); W.add(ceil);
  const top = new THREE.Mesh(ringShape(DRUM_IN, BACK, BACK_TOP), new THREE.MeshStandardMaterial({ color: 0x0b0e22, roughness: 0.9, side: THREE.DoubleSide })); W.add(top);
  // the mural: four Firefly panels, 12 x 3 m each, round the concourse wall above the hang, repeated
  const muralMats = tex.murals.map((t) => new THREE.MeshStandardMaterial({ map: t, roughness: 0.85, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.32, side: THREE.DoubleSide }));
  const PAN = 33; for (let i = 0; i < PAN; i++) { const a0 = i / PAN * Math.PI * 2 + 0.02, a1 = (i + 1) / PAN * Math.PI * 2 - 0.02; const am = (a0 + a1) / 2; if (Math.cos(am) > 0 && Math.abs(Math.sin(am) * DRUM_IN) < ENTRY.w + 7) continue;
    W.add(cylWall(DRUM_IN - 0.04, 3.9, 6.9, muralMats[i % muralMats.length], { a0, a1, seg: 12 })); }
  // the concourse side of the bowl: an LED ribbon at head height and above it the murals again, so both walls are painted
  { const p = [], u = [], M = 360, y0 = 3.9, y1 = 6.9; for (let i = 0; i <= M; i++) { const P = stadiumPoint(i / M, BACK + 0.06); p.push(P[0], y0, P[1], P[0], y1, P[1]); u.push(i / M * 26, 0, i / M * 26, 1); }
    const idx = []; for (let i = 0; i < M; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); bg.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2)); bg.setIndex(idx); bg.computeVertexNormals();
    const mt = tex.murals[2].clone(); mt.wrapS = THREE.RepeatWrapping; mt.needsUpdate = true;
    W.add(new THREE.Mesh(bg, new THREE.MeshStandardMaterial({ map: mt, roughness: 0.85, emissive: 0xffffff, emissiveMap: mt, emissiveIntensity: 0.32, side: THREE.DoubleSide })));
    const p2 = [], u2 = []; for (let i = 0; i <= M; i++) { const P = stadiumPoint(i / M, BACK + 0.08); p2.push(P[0], 3.35, P[1], P[0], 3.75, P[1]); u2.push(i / M * 40, 0, i / M * 40, 1); }
    const bg2 = new THREE.BufferGeometry(); bg2.setAttribute('position', new THREE.Float32BufferAttribute(p2, 3)); bg2.setAttribute('uv', new THREE.Float32BufferAttribute(u2, 2)); bg2.setIndex(idx); bg2.computeVertexNormals();
    const ft = tex.fascia.clone(); ft.wrapS = THREE.RepeatWrapping; ft.needsUpdate = true; U.ribbon3 = ft;
    W.add(new THREE.Mesh(bg2, new THREE.MeshBasicMaterial({ map: ft, side: THREE.DoubleSide, toneMapped: false }))); }
  // ceiling light strips, radial
  const strips = new THREE.InstancedMesh(new THREE.BoxGeometry(5.5, 0.06, 0.22), new THREE.MeshBasicMaterial({ color: 0xdfe8ff, toneMapped: false }), 120);
  for (let i = 0; i < 120; i++) { const a = i / 120 * Math.PI * 2, r = DRUM_IN - 3.6; q.setFromAxisAngle(V(0, 1, 0), -a); m4.compose(V(Math.cos(a) * r, 7.1, Math.sin(a) * r), q, one); strips.setMatrixAt(i, m4); }
  W.add(strips);
  // ---- the roof: a compression ring on the drum, a tension ring over centre court, 48 cables in two layers, the deck above
  const hub = new THREE.Mesh(new THREE.TorusGeometry(HUB_R, 0.55, 12, 48), steel); hub.rotation.x = Math.PI / 2; hub.position.y = ROOF_RIM - 1.2; W.add(hub);
  const hub2 = hub.clone(); hub2.position.y = ROOF_RIM - 4.4; W.add(hub2);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(DRUM_IN, 0.9, 10, 160), conc); rim.rotation.x = Math.PI / 2; rim.position.y = ROOF_RIM; W.add(rim);
  const cab = []; for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    for (const [y0, y1] of [[ROOF_RIM + 0.4, ROOF_RIM - 1.2], [ROOF_RIM - 0.6, ROOF_RIM - 4.4]]) { const A = V(c * DRUM_IN, y0, s * DRUM_IN), B = V(c * HUB_R, y1, s * HUB_R); const L = A.distanceTo(B);
      const cg = new THREE.CylinderGeometry(0.09, 0.09, L, 6); cg.translate(0, L / 2, 0); cg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), B.clone().sub(A).normalize())); cg.translate(A.x, A.y, A.z); cab.push(cg); }
    // a strut between the two layers every so often
    for (const t of [0.3, 0.55, 0.8]) { const r = DRUM_IN + (HUB_R - DRUM_IN) * t, ya = ROOF_RIM + 0.4 + (-1.6) * t, yb = ROOF_RIM - 0.6 + (-3.8) * t; const sg = new THREE.CylinderGeometry(0.06, 0.06, ya - yb, 5); sg.translate(c * r, (ya + yb) / 2, s * r); cab.push(sg); } }
  W.add(new THREE.Mesh(mergeGeometries(cab), steel));
  // the ceiling: the underside of the cable roof, a shallow dish of dark acoustic panels between the 48 lines, the
  // ribs picked out pale the way the house lights catch them, two catwalk rings and a ring of sports lights
  { const R = DRUM_IN - 0.5, M = 96, RS = 28, yAt = (r) => ROOF_RIM + 1.2 - (1 - r / R) * 5.2;
    const p = [], u = [], idx = []; for (let j = 0; j <= RS; j++) { const r = HUB_R + (R - HUB_R) * j / RS; for (let i = 0; i <= M; i++) { const a = i / M * Math.PI * 2; p.push(Math.cos(a) * r, yAt(r), Math.sin(a) * r); u.push(0.5 + Math.cos(a) * r / (2 * R), 0.5 + Math.sin(a) * r / (2 * R)); } }
    for (let j = 0; j < RS; j++) for (let i = 0; i < M; i++) { const a = j * (M + 1) + i, b = a + M + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); cg.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2)); cg.setIndex(idx); cg.computeVertexNormals();
    const cv = document.createElement('canvas'); cv.width = cv.height = 2048; const x = cv.getContext('2d'); x.fillStyle = '#16181f'; x.fillRect(0, 0, 2048, 2048); x.translate(1024, 1024);
    const k = 1024 / R; for (let i = 0; i < 48 * 6; i++) { const a = i / 288 * Math.PI * 2; x.strokeStyle = i % 6 ? 'rgba(255,255,255,.035)' : 'rgba(200,206,220,.55)'; x.lineWidth = i % 6 ? 2 : 7; x.beginPath(); x.moveTo(Math.cos(a) * HUB_R * k, Math.sin(a) * HUB_R * k); x.lineTo(Math.cos(a) * R * k, Math.sin(a) * R * k); x.stroke(); }
    for (let r = HUB_R + 3; r < R; r += 2.6) { x.strokeStyle = 'rgba(255,255,255,.05)'; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, r * k, 0, 7); x.stroke(); }
    for (const r of [22, 38]) { x.strokeStyle = 'rgba(150,158,176,.6)'; x.lineWidth = 14; x.beginPath(); x.arc(0, 0, r * k, 0, 7); x.stroke(); }
    for (let i = 0; i < 6000; i++) { x.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`; x.fillRect((Math.random() - 0.5) * 2048, (Math.random() - 0.5) * 2048, 3, 3); }
    const ct = new THREE.CanvasTexture(cv); ct.colorSpace = THREE.SRGBColorSpace; ct.anisotropy = 8;
    W.add(new THREE.Mesh(cg, new THREE.MeshStandardMaterial({ map: ct, roughness: 0.95, side: THREE.DoubleSide })));
    U.ceilY = yAt;
    // catwalk rings with their lights: an LED sports fixture every 2 m on the inner ring, aimed at the floor
    const cwG = [], fx = [], fl = [];
    for (const r of [22, 38]) { const y = yAt(r) - 1.6; const t = new THREE.TorusGeometry(r, 0.12, 6, 160); t.rotateX(Math.PI / 2); t.translate(0, y, 0); cwG.push(t); const t2 = t.clone().translate(0, -0.9, 0); cwG.push(t2);
      const t3 = new THREE.TorusGeometry(r + 0.9, 0.08, 6, 160).rotateX(Math.PI / 2).translate(0, y - 0.45, 0); cwG.push(t3);
      for (let i = 0; i < 96; i++) { const a = i / 96 * Math.PI * 2; const h = new THREE.CylinderGeometry(0.03, 0.03, yAt(r) - y, 4).translate(Math.cos(a) * r, (yAt(r) + y) / 2, Math.sin(a) * r); cwG.push(h); }
      const n = r === 22 ? 64 : 80; for (let i = 0; i < n; i++) { const a = (i + 0.5) / n * Math.PI * 2; fx.push([Math.cos(a) * (r + 0.45), y - 1.25, Math.sin(a) * (r + 0.45), a, r]); } }
    W.add(new THREE.Mesh(mergeGeometries(cwG.map((g) => { g.deleteAttribute('uv'); return g; })), new THREE.MeshStandardMaterial({ color: 0x3a3f4c, metalness: 0.7, roughness: 0.5 })));
    const body = new THREE.InstancedMesh(new RoundedBoxGeometry(0.62, 0.32, 0.5, 2, 0.06), new THREE.MeshStandardMaterial({ color: 0x15171c, metalness: 0.5, roughness: 0.45 }), fx.length);
    const lens = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.52, 0.4), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), fx.length);
    const e = new THREE.Euler(0, 0, 0, 'YXZ');
    fx.forEach((f, i) => { const yaw = Math.atan2(-Math.cos(f[3]), -Math.sin(f[3])), tilt = Math.atan2(f[4], f[1]) * 0.55; q.setFromEuler(e.set(-(Math.PI / 2 - tilt) * 0 - tilt, yaw, 0)); m4.compose(V(f[0], f[1], f[2]), q, one); body.setMatrixAt(i, m4);
      const m5 = m4.clone().multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)).multiply(new THREE.Matrix4().makeTranslation(0, 0, 0.17)); lens.setMatrixAt(i, m5); });
    W.add(body, lens); U.fixLens = lens;
  }
  // the Firefly banners hang over the long sides; the retired numbers over the ends are banners.js
  tex.banners.forEach((t, i) => { for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 6.3), new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: 0.9, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.25 }));
    b.position.set((i - 1.5) * 7.5, ROOF_RIM - 8, s * 27); b.rotation.y = s > 0 ? Math.PI : 0; W.add(b); } });
  // ---- the scoreboard: four faces, the long ones the eye cam, the ends the score; a ring of LED top and bottom
  const sb = new THREE.Group(); sb.position.y = 21.5; W.add(sb);
  const sbBox = new THREE.Mesh(new THREE.BoxGeometry(12.6, 6.6, 8.6), dark); sb.add(sbBox);
  U.scoreCanvas = document.createElement('canvas'); U.scoreCanvas.width = 1024; U.scoreCanvas.height = 512; U.scoreTex = new THREE.CanvasTexture(U.scoreCanvas); U.scoreTex.colorSpace = THREE.SRGBColorSpace;
  U.camRT = new THREE.WebGLRenderTarget(768, 384); U.camRT.texture.colorSpace = THREE.SRGBColorSpace;
  U.camFrame = document.createElement('canvas'); U.camFrame.width = 768; U.camFrame.height = 384; U.camFrameTex = new THREE.CanvasTexture(U.camFrame);
  const faceMat = (t) => new THREE.MeshBasicMaterial({ map: t, toneMapped: false });
  for (const s of [-1, 1]) {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), faceMat(U.camRT.texture)); f.position.z = s * 4.32; if (s < 0) f.rotation.y = Math.PI; sb.add(f);
    const fr = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshBasicMaterial({ map: U.camFrameTex, transparent: true, toneMapped: false })); fr.position.z = s * 4.34; if (s < 0) fr.rotation.y = Math.PI; sb.add(fr);
    const e = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), faceMat(U.scoreTex)); e.position.x = s * 6.32; e.rotation.y = s * Math.PI / 2; sb.add(e);
  }
  for (const y of [3.75]) { const ring = new THREE.Mesh(new THREE.CylinderGeometry(7.8, 7.8, 0.9, 64, 1, true), new THREE.MeshBasicMaterial({ map: tex.fascia, side: THREE.DoubleSide, toneMapped: false })); ring.position.y = y; sb.add(ring); }
  for (const [x, z] of [[-4, -3], [4, -3], [-4, 3], [4, 3]]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, ROOF_RIM - 26), steel); c.position.set(x, (ROOF_RIM - 21.5 - 3.3) / 2 + 3.3, z); sb.add(c); }
  const under = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.3, 7.6), dark); under.position.y = -3.45; sb.add(under);
  // the bezels round each face, and a slanted lower ring of screen the way modern centre hung boards finish
  for (const s of [-1, 1]) { const bz = new THREE.Mesh(new THREE.BoxGeometry(12.5, 6.5, 0.12), new THREE.MeshStandardMaterial({ color: 0x050608, roughness: 0.35, metalness: 0.3 })); bz.position.z = s * 4.26; sb.add(bz);
    const bx = new THREE.Mesh(new THREE.BoxGeometry(0.12, 6.5, 8.5), bz.material); bx.position.x = s * 6.26; sb.add(bx); }
  const lowRing = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 5.4, 1.6, 64, 1, true), new THREE.MeshBasicMaterial({ map: tex.fascia, side: THREE.DoubleSide, toneMapped: false, color: 0xd0d8f0 })); lowRing.position.y = -4.4; sb.add(lowRing);
  const lowCap = new THREE.Mesh(new THREE.CircleGeometry(5.4, 48), dark); lowCap.rotation.x = Math.PI / 2; lowCap.position.y = -5.2; sb.add(lowCap);
  U.scoreboard = sb;
  // ---- the bridges: 233 feet long, 22 wide, hung on rods from the roof, a row of seats facing in
  for (const s of [-1, 1]) {
    const b = new THREE.Group(); b.position.set(0, BRIDGE.y, s * BRIDGE.z); W.add(b);
    const deckT = tex.planks || tex.steelC; const dk = new THREE.Mesh(new THREE.BoxGeometry(BRIDGE.half * 2, 0.5, BRIDGE.w * 2), new THREE.MeshStandardMaterial({ map: deckT, color: 0x6c6f78, metalness: 0.2, roughness: 0.7 })); dk.position.y = -0.25; b.add(dk);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(BRIDGE.half * 2, 1.1, 0.05), new THREE.MeshPhysicalMaterial({ color: 0xbfd8ff, transmission: 0.0, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0 })); glass.position.set(0, 0.55, -s * BRIDGE.w); b.add(glass);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(BRIDGE.half * 2, 0.08, 0.12), steel); rail.position.set(0, 1.12, -s * BRIDGE.w); b.add(rail);
    const rail2 = rail.clone(); rail2.position.z = s * BRIDGE.w; b.add(rail2);
    const glow = new THREE.Mesh(new THREE.BoxGeometry(BRIDGE.half * 2, 0.12, 0.12), new THREE.MeshBasicMaterial({ color: 0x2962ff, toneMapped: false })); glow.position.set(0, -0.52, -s * BRIDGE.w); b.add(glow);
    const hang = []; for (let i = 0; i < 25; i++) { const x = -BRIDGE.half + 0.5 + i * (BRIDGE.half * 2 - 1) / 24; for (const z of [-BRIDGE.w, BRIDGE.w]) { const h = new THREE.CylinderGeometry(0.06, 0.06, ROOF_RIM - BRIDGE.y + 1); h.translate(x, (ROOF_RIM - BRIDGE.y + 1) / 2, z); hang.push(h); } }
    b.add(new THREE.Mesh(mergeGeometries(hang), steel));
    U['bridge' + s] = b;
  }
  // the lifts and the catwalks out to the bridges
  for (const L of LIFTS) {
    const s = Math.sign(L.z), shaft = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, BRIDGE.y + 2, 24, 1, true), new THREE.MeshPhysicalMaterial({ color: 0x9fc0ff, transparent: true, opacity: 0.18, roughness: 0.1, side: THREE.DoubleSide })); shaft.position.set(L.x, (BRIDGE.y + 2) / 2, L.z); W.add(shaft);
    const ringL = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.06, 6, 48), new THREE.MeshBasicMaterial({ color: 0x22d3ee, toneMapped: false })); ringL.rotation.x = Math.PI / 2; ringL.position.set(L.x, 0.05, L.z); W.add(ringL);
    const car = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.2, 24), steel); car.position.set(L.x, 0.1, L.z); W.add(car); L.car = car;
    const len = Math.abs(L.z) + 2.4 - (BRIDGE.z - 1), cz = s * ((BRIDGE.z - 1) + len / 2);
    const cw = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.4, len), new THREE.MeshStandardMaterial({ map: tex.steelC, color: 0x9098b0, metalness: 0.6, roughness: 0.45 })); cw.position.set(L.x, BRIDGE.y - 0.2, cz); W.add(cw);
    for (const x of [-2.4, 2.4]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, len), steel); r.position.set(L.x + x, BRIDGE.y + 1.1, cz); W.add(r); }
    // the door in the back wall where the catwalk comes through, and the lift button
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 20), new THREE.MeshBasicMaterial({ color: 0x22d3ee, toneMapped: false })); btn.rotation.x = Math.PI / 2; btn.position.set(L.x + 2.6, 1.3, L.z); btn.rotation.z = Math.PI / 2; btn.rotation.y = Math.PI / 2; W.add(btn); L.btn = btn;
  }
  // ---- the way in: escalators from the street, a glass hall, the tower over it
  const hall = new THREE.Group(); W.add(hall);
  const escMat = new THREE.MeshStandardMaterial({ map: tex.steps, color: 0x707890, metalness: 0.6, roughness: 0.5 });
  for (const z of [-4.4, 0, 4.4]) {
    const len = Math.hypot(90 - 68, STREET), e = new THREE.Mesh(new THREE.BoxGeometry(len, 0.3, 1.6), escMat); e.position.set(79, STREET / 2 - 0.2, z); e.rotation.z = Math.atan2(-STREET, 90 - 68) * -1; hall.add(e);
    for (const dz of [-0.95, 0.95]) { const bal = new THREE.Mesh(new THREE.BoxGeometry(len, 1.0, 0.12), new THREE.MeshPhysicalMaterial({ color: 0xd8e6ff, transparent: true, opacity: 0.3, roughness: 0.05 })); bal.position.set(79, STREET / 2 + 0.4, z + dz); bal.rotation.z = e.rotation.z; hall.add(bal);
      const hr = new THREE.Mesh(new THREE.BoxGeometry(len, 0.1, 0.12), new THREE.MeshBasicMaterial({ color: 0x2962ff, toneMapped: false })); hr.position.set(79, STREET / 2 + 0.95, z + dz); hr.rotation.z = e.rotation.z; hall.add(hr); }
  }
  U.escMat = escMat;
  // the floor of the ramp hall, so you never see under it
  const rampG = new THREE.PlaneGeometry(1, 1, 40, 1); const rp = rampG.attributes.position;
  for (let i = 0; i < rp.count; i++) { const x = 66 + (rp.getX(i) + 0.5) * (92 - 66), z = rp.getY(i) * ENTRY.w * 2; rp.setXYZ(i, x, entryY(x) - 0.35, z); } rampG.computeVertexNormals();
  hall.add(new THREE.Mesh(rampG, new THREE.MeshStandardMaterial({ color: 0x1a2038, roughness: 0.8, side: THREE.DoubleSide })));
  for (const s of [-1, 1]) { const wall = new THREE.Mesh(new THREE.BoxGeometry(30, 22, 0.3), new THREE.MeshStandardMaterial({ map: tex.concrete, color: 0x6a7088, roughness: 0.9 })); wall.position.set(78, STREET + 11, s * (ENTRY.w + 0.15)); hall.add(wall); }
  const hallCeil = new THREE.Mesh(new THREE.BoxGeometry(30, 0.3, ENTRY.w * 2 + 0.6), dark); hallCeil.position.set(78, 7.4, 0); hall.add(hallCeil);
  const lights = new THREE.InstancedMesh(new THREE.BoxGeometry(0.2, 0.05, ENTRY.w * 1.8), new THREE.MeshBasicMaterial({ color: 0xe8f0ff, toneMapped: false }), 14);
  for (let i = 0; i < 14; i++) { const x = 66 + i * 2; m4.makeTranslation(x, Math.max(entryY(x) + 6.5, 7.2) > 7.25 ? 7.22 : 7.22, 0); lights.setMatrixAt(i, m4); } hall.add(lights);
  // the tower on Seventh Avenue over the entrance: a plain office slab, lit windows, the name across the canopy
  const tower = new THREE.Mesh(new THREE.BoxGeometry(18, 112, 64), new THREE.MeshStandardMaterial({ map: tex.windows, color: 0xffffff, emissive: 0xffffff, emissiveMap: tex.windows, emissiveIntensity: 0.16, roughness: 0.4, metalness: 0.3 }));
  tower.position.set(101, STREET + 10 + 56, 0); W.add(tower);
  tower.material.emissiveIntensity = 0.5; tower.material.metalness = 0.3; tower.material.roughness = 0.3;
  // the marquee: two big LED screens on the front of the podium over Seventh Avenue, showing the Firefly art
  for (const [z, t] of [[-17, tex.drum], [17, tex.stageLed]]) { const fr = new THREE.Mesh(new THREE.BoxGeometry(0.6, 9.4, 16.4), new THREE.MeshStandardMaterial({ color: 0x08090c, roughness: 0.4 })); fr.position.set(110.2, STREET + 19.5, z); W.add(fr);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), new THREE.MeshBasicMaterial({ map: t, toneMapped: false, color: 0xd0d0d0 })); scr.position.set(110.52, STREET + 19.5, z); scr.rotation.y = Math.PI / 2; W.add(scr); }
  const lobbyGlass = new THREE.Mesh(new THREE.BoxGeometry(0.1, 10, 64), new THREE.MeshBasicMaterial({ color: 0x9fc0ff, transparent: true, opacity: 0.05, depthWrite: false })); lobbyGlass.position.set(110.1, STREET + 5, 0); W.add(lobbyGlass);
  const lobbyCeil = new THREE.Mesh(new THREE.BoxGeometry(18.2, 0.4, 64.2), dark); lobbyCeil.position.set(101, STREET + 10, 0); W.add(lobbyCeil);
  const lobbyMat = new THREE.MeshStandardMaterial({ map: tex.concrete, color: 0x2a3050, roughness: 0.9 });
  for (const z of [-31.9, 31.9]) { const w = new THREE.Mesh(new THREE.BoxGeometry(18, 10, 0.3), lobbyMat); w.position.set(101, STREET + 5, z); W.add(w); }
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.3, 10, 64), lobbyMat); back.position.set(92, STREET + 5, 0); W.add(back);
  back.geometry = mergeGeometries([new THREE.BoxGeometry(0.3, 10, 32 - ENTRY.w).translate(0, 0, -(ENTRY.w + (32 - ENTRY.w) / 2)), new THREE.BoxGeometry(0.3, 10, 32 - ENTRY.w).translate(0, 0, ENTRY.w + (32 - ENTRY.w) / 2)]);
  U.canopy = new THREE.Mesh(new THREE.PlaneGeometry(40, 3.2), new THREE.MeshBasicMaterial({ map: tex.canopy, transparent: true, toneMapped: false })); U.canopy.position.set(110.3, STREET + 11.8, 0); U.canopy.rotation.y = Math.PI / 2; W.add(U.canopy);
  // the street: sidewalk, Seventh Avenue, the far side, Penn Station's stair
  const side = new THREE.Mesh(new THREE.PlaneGeometry(22, 200), new THREE.MeshStandardMaterial({ map: tex.pavers, color: 0x5c6274, roughness: 0.85 })); side.rotation.x = -Math.PI / 2; side.position.set(99 + 0, STREET, 0); W.add(side);
  side.geometry = new THREE.PlaneGeometry(40, 200); side.position.x = 108; tex.pavers.repeat.set(14, 70);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(26, 400), new THREE.MeshStandardMaterial({ map: tex.asphalt, color: 0x2e313a, roughness: 0.5, metalness: 0.1 })); road.rotation.x = -Math.PI / 2; road.position.set(141, STREET - 0.12, 0); W.add(road);
  const far = new THREE.Mesh(new THREE.PlaneGeometry(30, 400), new THREE.MeshStandardMaterial({ map: tex.pavers, color: 0x4e5466, roughness: 0.85 })); far.rotation.x = -Math.PI / 2; far.position.set(169, STREET, 0); W.add(far);
  const lanes = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.14, 3), new THREE.MeshBasicMaterial({ color: 0xe8e8e0 }), 160);
  for (let i = 0; i < 160; i++) { const l = i % 4, z = -200 + Math.floor(i / 4) * 10; m4.makeRotationX(-Math.PI / 2).setPosition(130.5 + (l + 1) * 4.4, STREET - 0.1, z); lanes.setMatrixAt(i, m4); } W.add(lanes);
  // the ground plane under everything else outside
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), new THREE.MeshStandardMaterial({ color: 0x101320, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.y = STREET - 0.2; W.add(ground);
  // Penn Station: the stair down on the sidewalk, lit from below
  const pennHole = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 6), new THREE.MeshBasicMaterial({ color: 0x000000 })); pennHole.position.set(122, STREET + 0.02, 34); W.add(pennHole);
  const pennGlow = new THREE.Mesh(new THREE.PlaneGeometry(3, 5.6), new THREE.MeshBasicMaterial({ map: tex.penn, toneMapped: false })); pennGlow.rotation.x = -Math.PI / 2; pennGlow.position.set(122, STREET + 0.08, 34); W.add(pennGlow);
  for (const dx of [-1.65, 1.65]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, 6), steel); r.position.set(122 + dx, STREET + 0.5, 34); W.add(r); }
  U.pennSign = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.9, 3.2), new THREE.MeshBasicMaterial({ map: tex.pennSign, toneMapped: false })); U.pennSign.position.set(122, STREET + 2.8, 30.6); U.pennSign.rotation.y = Math.PI / 2; W.add(U.pennSign);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4), steel); pole.position.set(122, STREET + 1.2, 30.6); W.add(pole);
  // the city round it: a few hundred lit towers, and the Empire State Building two blocks east and one north
  const city = []; const rnd = (a, b) => a + Math.random() * (b - a);
  for (let i = 0; i < 360; i++) { const a = Math.random() * Math.PI * 2, r = rnd(190, 700); const x = Math.cos(a) * r, z = Math.sin(a) * r; if (x > 100 && x < 200 && Math.abs(z) < 120) continue; const h = rnd(20, 140) * (r < 300 ? 0.8 : 1.3), w = rnd(16, 40), d = rnd(16, 40);
    const bg = new THREE.BoxGeometry(w, h, d); const uv = bg.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * w / 14, uv.getY(k) * h / 14); bg.translate(x, STREET + h / 2, z); city.push(bg); }
  for (let i = 0; i < 18; i++) { const z = -190 + i * 22; if (Math.abs(z) < 10) continue; const h = rnd(30, 90); const bg = new THREE.BoxGeometry(20, h, 18); const uv = bg.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * 20 / 14, uv.getY(k) * h / 14); bg.translate(196, STREET + h / 2, z); city.push(bg); }
  const cityMat = new THREE.MeshStandardMaterial({ map: tex.windowsCity, color: 0xffffff, emissive: 0xffffff, emissiveMap: tex.windowsCity, emissiveIntensity: 0.75, roughness: 0.6 });
  W.add(new THREE.Mesh(mergeGeometries(city), cityMat));
  const esb = new THREE.Group(); esb.position.set(560, STREET, -170); W.add(esb);
  const tiers = [[60, 120, 45], [44, 80, 38], [30, 60, 28], [20, 46, 20], [12, 20, 12], [7, 16, 7]]; let y = 0;
  tiers.forEach(([w, h, d], i) => { const bg = new THREE.BoxGeometry(w, h, d); const uv = bg.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * w / 10, uv.getY(k) * h / 10); const m = new THREE.Mesh(bg, i < 4 ? cityMat : new THREE.MeshBasicMaterial({ color: i === 4 ? 0x2962ff : 0xeef2f8, toneMapped: false })); m.position.y = y + h / 2; esb.add(m); y += h; });
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 2.4, 62, 8), new THREE.MeshBasicMaterial({ color: 0xff4fa3, toneMapped: false })); spire.position.y = y + 31; esb.add(spire);
  U.esb = esb;
  // taxis on Seventh Avenue, running downtown
  U.taxis = [];
  return W;
}
function ringShape(rOut, back, y) {
  const s = new THREE.Shape(); s.absarc(0, 0, rOut, 0, Math.PI * 2, false);
  const h = new THREE.Path(); const M = 200; for (let i = 0; i <= M; i++) { const P = stadiumPoint(i / M, back); i ? h.lineTo(P[0], -P[1]) : h.moveTo(P[0], -P[1]); } s.holes.push(h);
  const g = new THREE.ShapeGeometry(s, 64); g.rotateX(-Math.PI / 2); g.translate(0, y, 0);
  const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 4, p.getZ(i) / 4);
  return g;
}

// ---- each floor's furniture: hoops, boards and glass, the stage, the ring, the circus ring
export function buildModeSets(scene, tex, U, models) {
  const S = {}; const m4 = new THREE.Matrix4(); const steel = new THREE.MeshStandardMaterial({ color: 0x7c8498, metalness: 0.8, roughness: 0.3 });
  const blue = new THREE.MeshStandardMaterial({ color: 0x2962ff, roughness: 0.4 });
  const glassM = new THREE.MeshPhysicalMaterial({ color: 0xdaeaff, transparent: true, opacity: 0.16, roughness: 0.02, metalness: 0, depthWrite: false });
  // court: two stanchions, backboards, rims at 10 feet, a row of courtside chairs down each side, the benches
  { const g = new THREE.Group(); S.court = g; U.rims = [];
    // the stanchions, at NBA measure: backboard face 4 feet inside the baseline, rim 15 cm over its bottom edge, at 10 feet
    const pad = new THREE.MeshStandardMaterial({ color: 0x0f1a3a, roughness: 0.62 }), padHi = new THREE.MeshStandardMaterial({ color: 0x1d5fc9, roughness: 0.55 });
    const white = new THREE.MeshStandardMaterial({ color: 0xf4f6fa, roughness: 0.4 }), orange = new THREE.MeshStandardMaterial({ color: 0xff5a1f, metalness: 0.35, roughness: 0.38 });
    const netTex = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 128; const x = c.getContext('2d'); x.strokeStyle = '#fff'; x.lineWidth = 3;
      for (let i = -128; i < 256; i += 21) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 128, 128); x.stroke(); x.beginPath(); x.moveTo(i + 128, 0); x.lineTo(i, 128); x.stroke(); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1); return t; })();
    const clockTex = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#060606'; x.fillRect(0, 0, 256, 128); x.fillStyle = '#ff2a1a'; x.font = 'bold 96px "JetBrains Mono", monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = '#ff2a1a'; x.shadowBlur = 14; x.fillText('24', 128, 68); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    for (const s of [-1, 1]) {
      const st = new THREE.Group(); st.scale.x = s; g.add(st);   // built for the +x end, mirrored for the other
      const prof = new THREE.Shape(); prof.moveTo(14.55, 0); prof.lineTo(14.55, 0.32); prof.quadraticCurveTo(14.6, 0.42, 14.75, 0.48); prof.lineTo(15.55, 1.08); prof.quadraticCurveTo(15.65, 1.16, 15.8, 1.16); prof.lineTo(16.75, 1.16); prof.lineTo(16.75, 0); prof.lineTo(14.55, 0);
      const bg = new THREE.ExtrudeGeometry(prof, { depth: 1.5, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3, curveSegments: 8 }); bg.translate(0, 0, -0.75); st.add(new THREE.Mesh(bg, pad));
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.18, 1.62), padHi); stripe.position.set(14.535, 0.2, 0); st.add(stripe);
      const col = new THREE.Mesh(new RoundedBoxGeometry(0.42, 2.9, 0.5, 2, 0.08), pad); col.position.set(16.25, 2.55, 0); st.add(col);
      // the boom: a padded arm from the column top down to the back of the board
      const A = new THREE.Vector3(16.25, 3.9, 0), B = new THREE.Vector3(13.32, 3.45, 0), L = A.distanceTo(B);
      const boom = new THREE.Mesh(new RoundedBoxGeometry(L, 0.34, 0.34, 2, 0.08), pad); boom.position.copy(A).add(B).multiplyScalar(0.5); boom.rotation.z = Math.atan2(B.y - A.y, B.x - A.x) + Math.PI; st.add(boom);
      const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8), steel); brace.position.set(15.7, 3.0, 0); brace.rotation.z = 0.95; st.add(brace);
      // the board: tempered glass in a thin frame, the shooter's square, padding on the bottom edge, the shot clock on top
      const board = new THREE.Mesh(new THREE.BoxGeometry(0.035, 1.07, 1.83), glassM); board.position.set(13.11, 3.435, 0); st.add(board);
      const fr = (w, h, d, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), white); m.position.set(13.105, y, z); st.add(m); };
      fr(0.045, 0.05, 1.83, 3.945, 0); fr(0.045, 0.05, 1.83, 2.925, 0); fr(0.045, 1.07, 0.05, 3.435, 0.89); fr(0.045, 1.07, 0.05, 3.435, -0.89);
      fr(0.04, 0.05, 0.59, 3.05 + 0.45, 0); fr(0.04, 0.05, 0.59, 3.075, 0); fr(0.04, 0.45, 0.05, 3.275, 0.27); fr(0.04, 0.45, 0.05, 3.275, -0.27);
      const bpad = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.12, 1.9, 2, 0.04), pad); bpad.position.set(13.13, 2.86, 0); st.add(bpad);
      const sc = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.32, 0.6), new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.4 })); sc.position.set(13.16, 4.15, 0); st.add(sc);
      const scf = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.26), new THREE.MeshBasicMaterial({ map: clockTex, toneMapped: false })); scf.position.set(13.005, 4.15, 0); scf.rotation.y = -Math.PI / 2; st.add(scf);
      // the rim on its flex mount, and the net
      const mount = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.26), orange); mount.position.set(12.99, 3.0, 0); st.add(mount);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.2286, 0.0095, 10, 40), orange); rim.rotation.x = Math.PI / 2; rim.position.set(12.755, 3.05, 0); st.add(rim);
      const net = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.13, 0.42, 24, 1, true), new THREE.MeshStandardMaterial({ map: netTex, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.9 })); net.position.set(12.755, 2.835, 0); st.add(net);
      U.rims.push(new THREE.Vector3(s * 12.755, 3.05, 0));
      st.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
    }
    // the scorer's table at centre court on the near side: a long LED front, and the two benches either side
    const ledTex = tex.boards.clone(); ledTex.repeat.set(4, 1); ledTex.needsUpdate = true;
    const tbl = new THREE.Mesh(new THREE.BoxGeometry(9, 0.78, 0.8), new THREE.MeshStandardMaterial({ color: 0x101218, roughness: 0.4 })); tbl.position.set(0, 0.39, -9.6); g.add(tbl);
    const tfront = new THREE.Mesh(new THREE.PlaneGeometry(9, 0.62), new THREE.MeshBasicMaterial({ map: ledTex, toneMapped: false, color: 0xbfc8e0 })); tfront.position.set(0, 0.4, -9.19); g.add(tfront);
    const top = new THREE.Mesh(new THREE.BoxGeometry(9.1, 0.04, 0.86), new THREE.MeshStandardMaterial({ color: 0x2a2d36, roughness: 0.25, metalness: 0.4 })); top.position.set(0, 0.8, -9.6); g.add(top);
    // the baseline LED boards under each basket
    for (const s of [-1, 1]) { const bb = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.9, 10), new THREE.MeshStandardMaterial({ color: 0x0a0b10 })); bb.position.set(s * 18.2, 0.45, 0); g.add(bb);
      const bf = new THREE.Mesh(new THREE.PlaneGeometry(10, 0.78), new THREE.MeshBasicMaterial({ map: ledTex, toneMapped: false, color: 0xbfc8e0 })); bf.position.set(s * 17.99, 0.45, 0); bf.rotation.y = -s * Math.PI / 2; g.add(bf); }
    if (models.chair) for (const s of [-1, 1]) for (let i = 0; i < 26; i++) { if ((s < 0 && Math.abs(-14 + i * 1.1) < 5) || (s > 0 && Math.abs(-14 + i * 1.1) < 1.2)) continue; const c = models.chair.clone(); c.position.set(-14 + i * 1.1, 0, s * 9.1); c.rotation.y = s > 0 ? Math.PI : 0; g.add(c); }
    // a ball rack at centre court, the thing to click for a shot
    const rack = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.5), steel); rack.position.set(0, 0.45, 9.0); g.add(rack);
    for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 14), new THREE.MeshStandardMaterial({ map: tex.ball, roughness: 0.7 })); b.position.set(-0.36 + i * 0.36, 1.0, 9.0); b.userData.act = 'ball'; g.add(b); }
    U.rack = rack;
  }
  // ice: the boards, 200 x 85 feet with 28 foot corners, glass on top, nets, two benches
  { const g = new THREE.Group(); S.ice = g; const H = 30.5, Wd = 13, R = 8.5, pts = [];
    const rr = (cx, cz, a0) => { for (let k = 0; k <= 12; k++) { const a = a0 + k / 12 * Math.PI / 2; pts.push([cx + Math.cos(a) * R, cz + Math.sin(a) * R]); } };
    rr(H - R, Wd - R, 0); rr(-H + R, Wd - R, Math.PI / 2); rr(-H + R, -Wd + R, Math.PI); rr(H - R, -Wd + R, Math.PI * 1.5); pts.push(pts[0]);
    const bG = [], gG = [];
    for (let i = 0; i < pts.length - 1; i++) { const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], L = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(z1 - z0, x1 - x0);
      const b = new THREE.BoxGeometry(L, 1.07, 0.16); b.rotateY(-a); b.translate((x0 + x1) / 2, 0.535, (z0 + z1) / 2); bG.push(b);
      const gl = new THREE.BoxGeometry(L, 2.4, 0.03); gl.rotateY(-a); gl.translate((x0 + x1) / 2, 1.07 + 1.2, (z0 + z1) / 2); gG.push(gl); }
    g.add(new THREE.Mesh(mergeGeometries(bG), new THREE.MeshStandardMaterial({ map: tex.boards, color: 0xffffff, roughness: 0.5 })));
    g.add(new THREE.Mesh(mergeGeometries(gG), glassM));
    const cap = new THREE.Mesh(new THREE.TorusGeometry(1, 1, 1, 1), steel);
    for (const s of [-1, 1]) { const net = new THREE.Group(); net.position.set(s * (H - 3.35), 0, 0); g.add(net);
      const fr = new THREE.Mesh(new THREE.TorusGeometry(0.915, 0.03, 8, 24, Math.PI), new THREE.MeshStandardMaterial({ color: 0xd8202f, roughness: 0.4 })); fr.position.y = 0; fr.rotation.y = Math.PI / 2; net.add(fr);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.22, 1.83), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.6 })); mesh.position.set(s * 0.55, 0.61, 0); net.add(mesh); }
  }
  // stage: a deck at the Eighth Avenue end, the Firefly LED wall, a truss and moving beams, a piano and a mic
  { const g = new THREE.Group(); S.stage = g;
    const deck = new THREE.Mesh(new THREE.BoxGeometry(14, 1.8, 20), new THREE.MeshStandardMaterial({ color: 0x0a0b12, roughness: 0.4, metalness: 0.2 })); deck.position.set(-23, 0.9, 0); g.add(deck);
    const run = new THREE.Mesh(new THREE.BoxGeometry(16, 1.2, 3), deck.material); run.position.set(-8.5, 0.6, 0); g.add(run);
    const led = new THREE.Mesh(new THREE.PlaneGeometry(26, 14.6), new THREE.MeshBasicMaterial({ map: tex.stageLed, toneMapped: false })); led.position.set(-29.8, 9.2, 0); led.rotation.y = Math.PI / 2; g.add(led); U.led = led;
    const truss = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 24), steel); truss.position.set(-21, 15, 0); g.add(truss);
    const tr2 = truss.clone(); tr2.position.x = -14; g.add(tr2);
    U.beams = []; for (let i = 0; i < 10; i++) { const cone = new THREE.Mesh(new THREE.ConeGeometry(2.2, 16, 24, 1, true), new THREE.MeshBasicMaterial({ color: [0x2962ff, 0xff4fa3, 0x22d3ee][i % 3], transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
      cone.geometry.translate(0, -8, 0); const piv = new THREE.Group(); piv.position.set(i < 5 ? -21 : -14, 14.6, -10 + (i % 5) * 5); piv.add(cone); g.add(piv); U.beams.push(piv); }
    if (models.flood) { const f = models.flood.clone(); f.position.set(-17.5, 1.8, 7); f.rotation.y = -Math.PI / 2; g.add(f); const f2 = f.clone(); f2.position.z = -7; g.add(f2); }
    const mic = new THREE.Group(); mic.position.set(-17.5, 1.8, 0); g.add(mic);
    mic.add(put(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5), steel), { position: V(0, 0.75, 0) }));
    mic.add(put(new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6, roughness: 0.4 })), { position: V(0.03, 1.55, 0) }));
    mic.userData.act = 'mic'; mic.children.forEach((c) => (c.userData.act = 'mic'));
    // a floor crowd of 900 standing in front of the stage
    const fc = new THREE.Group(); g.add(fc); U.floorCrowdAt = fc;
  }
  // ring: a 20 foot ring on a 4 foot platform, three ropes, four posts, a light rig, ringside the bell on its table
  { const g = new THREE.Group(); S.ring = g;
    const plat = new THREE.Mesh(new THREE.BoxGeometry(7.4, 1.2, 7.4), new THREE.MeshStandardMaterial({ color: 0x0f1228, roughness: 0.7 })); plat.position.y = 0.6; g.add(plat);
    const can = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 7.2), new THREE.MeshStandardMaterial({ map: tex.ringCanvas, roughness: 0.9 })); can.rotation.x = -Math.PI / 2; can.position.y = 1.21; g.add(can);
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(7.5, 1.1, 7.5), new THREE.MeshStandardMaterial({ map: tex.skirt, roughness: 0.8 })); skirt.position.y = 0.55; g.add(skirt);
    for (const [x, z] of [[-3.2, -3.2], [3.2, -3.2], [3.2, 3.2], [-3.2, 3.2]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.5), steel); p.position.set(x, 1.95, z); g.add(p);
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.2, 0.28), new THREE.MeshStandardMaterial({ color: x > 0 && z < 0 ? 0xb3101a : x < 0 && z > 0 ? 0x1540d8 : 0xf2f2f2, roughness: 0.55 })); pad.position.set(x * 0.97, 1.95, z * 0.97); g.add(pad); }
    // four ropes at the real heights over the canvas, red, white, blue, white (as the Cycles ring)
    [0x9a0d16, 0xeef2f8, 0x1540d8, 0xeef2f8].forEach((col, k) => { const y = 1.21 + [0.46, 0.81, 1.17, 1.52][k]; const ropes = [];
      for (let i = 0; i < 4; i++) { const r = new THREE.CylinderGeometry(0.026, 0.026, 6.4, 8); r.rotateZ(Math.PI / 2); if (i % 2) r.rotateY(Math.PI / 2); const off = 3.2 * (i < 2 ? -1 : 1); r.translate(i % 2 ? off : 0, y, i % 2 ? 0 : off); ropes.push(r); }
      g.add(new THREE.Mesh(mergeGeometries(ropes), new THREE.MeshStandardMaterial({ color: col, roughness: 0.45 }))); });
    const rig = new THREE.Mesh(new THREE.BoxGeometry(9, 0.4, 9), steel); rig.position.y = 9; g.add(rig);
    const rigL = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22, 0.3, 0.3, 12), new THREE.MeshBasicMaterial({ color: 0xfff6e8, toneMapped: false }), 16);
    for (let i = 0; i < 16; i++) { const x = -4 + (i % 4) * 2.66, z = -4 + Math.floor(i / 4) * 2.66; m4.makeTranslation(x, 8.7, z); rigL.setMatrixAt(i, m4); } g.add(rigL);
    if (models.desk) { const d = models.desk.clone(); d.position.set(0, 0, 5.4); g.add(d); }
    if (models.bell) { const b = models.bell.clone(); b.position.set(0, 0.79, 5.3); b.rotation.y = Math.PI; b.traverse((o) => (o.userData.act = 'bell')); g.add(b); U.ringBell = b; }
    if (models.chair) for (let i = 0; i < 40; i++) { const side = i % 4, k = Math.floor(i / 4); const c = models.chair.clone(); const off = -4.5 + k * 1.0; const pos = [[off, -6.6], [6.6, off], [off, 6.9], [-6.6, off]][side]; if (side === 2 && Math.abs(off) < 1.6) continue; c.position.set(pos[0], 0, pos[1]); c.rotation.y = [0, -Math.PI / 2, Math.PI, Math.PI / 2][side]; g.add(c); }
  }
  // circus: the 42 foot ring, two trapeze rigs to the roof, and the carved elephant and the horse at life size, circling
  { const g = new THREE.Group(); S.circus = g;
    const curb = new THREE.Mesh(new THREE.TorusGeometry(6.65, 0.28, 10, 80), new THREE.MeshStandardMaterial({ color: 0xff4fa3, roughness: 0.5 })); curb.rotation.x = Math.PI / 2; curb.position.y = 0.28; g.add(curb);
    for (const s of [-1, 1]) { const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 22), steel); mast.position.set(s * 9, 11, 0); g.add(mast);
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4), steel); bar.rotation.z = Math.PI / 2; const sw = new THREE.Group(); sw.position.set(s * 4, 20, 0); g.add(sw);
      const r1 = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 5), steel); r1.position.y = -2.5; sw.add(r1); bar.position.y = -5; sw.add(bar); (U.swings = U.swings || []).push(sw); }
    const net = new THREE.Mesh(new THREE.PlaneGeometry(22, 6, 22, 6), new THREE.MeshBasicMaterial({ color: 0xeef2f8, wireframe: true, transparent: true, opacity: 0.35 })); net.rotation.x = -Math.PI / 2; net.position.y = 3.2; g.add(net);
    U.parade = [];
    if (models.elephant) { const e = models.elephant.clone(); g.add(e); U.parade.push({ o: e, r: 5.4, sp: 0.07, ph: 0 }); }
    if (models.horse) { const h = models.horse.clone(); g.add(h); U.parade.push({ o: h, r: 5.4, sp: 0.07, ph: Math.PI }); }
  }
  for (const k in S) { S[k].visible = false; S[k].userData.mode = k; scene.add(S[k]); }
  return S;
}
