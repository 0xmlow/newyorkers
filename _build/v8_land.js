/* ================================================================
   v8 LANDMARKS AND WATER  ·  2026-11-21
   The last boxes on the island were the ones that move or float: the ferry, the sailboats, the cars on the freeway
   loop, and the toll plaza they drive through. They are lofted now (a hull is a run of cross sections, not a cube),
   and the ferry is a double ended harbour boat with two decks, window bands that light at night, railings, two
   wheelhouses and a funnel. The lighthouse gets a gallery, a mullioned lantern and a rod; SUMMER.JPG gets striped
   canvas umbrellas and chairs; the toll gets a canopy, lights, rumble strips and road barriers; a sea marker and a
   tall ship stand out in the harbour. New props are Poly Haven CC0.
   The functions here are declarations on purpose: the older builders in island.html call them while they run, before
   this part of the file is reached, so they may only use what island.html has already made.
   ================================================================ */

// a hull as cross sections along z. halfW(zn) and the rest are functions of zn in [-1, 1] (+1 is the bow)
function v8Loft(L, o) {
  const NS = o.ns || 44, NK = o.nk || 9, pos = [], col = [], idx = [], deckL = [], deckR = [];
  const c = new THREE.Color();
  for (let i = 0; i <= NS; i++) {
    const zn = -1 + 2 * i / NS, z = zn * L / 2, hw = o.halfW(zn), yd = o.deck(zn), yb = o.keel(zn);
    for (let j = -NK; j <= NK; j++) {
      const t = 1 - Math.abs(j) / NK, s = j < 0 ? -1 : 1;           // t = 1 at the deck edge, 0 at the keel
      const x = s * hw * (1 - Math.pow(1 - t, o.round || 2.4)), y = yb + (yd - yb) * Math.pow(t, o.lift || 1);
      pos.push(x, y, z); o.paint(y, zn, c); col.push(c.r, c.g, c.b);
      if (j === -NK) deckL.push(new V3(x, y, z)); if (j === NK) deckR.push(new V3(x, y, z));
    }
  }
  const W = 2 * NK + 1;
  for (let i = 0; i < NS; i++) for (let j = 0; j < W - 1; j++) { const a = i * W + j, b = a + W; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  // close the two ends with a fan to the keel point of that section
  [0, NS].forEach(i => { const base = i * W, k = base + NK; for (let j = 0; j < W - 1; j++) if (base + j !== k && base + j + 1 !== k) idx.push(k, base + j, base + j + 1); });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  // the deck, stitched between the two gunwales
  const dp = [], di = []; deckL.forEach((p, i) => { dp.push(p.x, p.y - 0.02, p.z, deckR[i].x, deckR[i].y - 0.02, deckR[i].z); if (i) { const a = (i - 1) * 2; di.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } });
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); dg.setIndex(di); dg.computeVertexNormals();
  const uv = []; for (let i = 0; i < dp.length; i += 3) uv.push(dp[i] / 2.2, dp[i + 2] / 2.2); dg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return { hull: g, deck: dg, edgeL: deckL, edgeR: deckR };
}
// a stadium (rounded both ends) prism, lying flat: width w across x, length l along z, from y0 up by h
function v8Stadium(w, l, h, r) {
  r = Math.min(r === undefined ? w / 2 : r, w / 2); const s = new THREE.Shape(), hx = w / 2, hz = l / 2;
  s.moveTo(-hx + r, -hz); s.lineTo(hx - r, -hz); s.quadraticCurveTo(hx, -hz, hx, -hz + r); s.lineTo(hx, hz - r); s.quadraticCurveTo(hx, hz, hx - r, hz);
  s.lineTo(-hx + r, hz); s.quadraticCurveTo(-hx, hz, -hx, hz - r); s.lineTo(-hx, -hz + r); s.quadraticCurveTo(-hx, -hz, -hx + r, -hz);
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 10 }); g.rotateX(-PI / 2); return g;   // shape y becomes -z, the extrusion goes up
}
function v8StadiumPath(w, l, r, n) { const s = new THREE.Shape(), hx = w / 2, hz = l / 2; r = Math.min(r, hx);
  s.moveTo(-hx + r, -hz); s.lineTo(hx - r, -hz); s.quadraticCurveTo(hx, -hz, hx, -hz + r); s.lineTo(hx, hz - r); s.quadraticCurveTo(hx, hz, hx - r, hz);
  s.lineTo(-hx + r, hz); s.quadraticCurveTo(-hx, hz, -hx, hz - r); s.lineTo(-hx, -hz + r); s.quadraticCurveTo(-hx, -hz, -hx + r, -hz);
  return s.getSpacedPoints(n).map(p => new V3(p.x, 0, -p.y)); }
// posts and a top rail along a polyline of points (world space), returned as meshes added to the scene
function v8Rail(pts, h, mat, closed, step) {
  step = step || 1.2; const P = [], m = new THREE.Matrix4();
  for (let i = 0; i < pts.length - (closed ? 0 : 1); i++) { const a = pts[i], b = pts[(i + 1) % pts.length], d = a.distanceTo(b), n = Math.max(1, Math.round(d / step)); for (let k = 0; k < n; k++) P.push(a.clone().lerp(b, k / n)); }
  if (!closed) P.push(pts[pts.length - 1].clone());
  const posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03, 0.03, h, 5), mat, P.length);
  P.forEach((p, i) => { m.makeTranslation(p.x, p.y + h / 2, p.z); posts.setMatrixAt(i, m); }); scene.add(posts);
  const top = pts.map(p => new V3(p.x, p.y + h, p.z)), mid = pts.map(p => new V3(p.x, p.y + h * 0.5, p.z));
  [top, mid].forEach((line, k) => { const cv = new THREE.CatmullRomCurve3(line, closed, 'catmullrom', 0.1); const t = new THREE.Mesh(new THREE.TubeGeometry(cv, Math.max(8, line.length * 3), k ? 0.018 : 0.035, 5, closed), mat); scene.add(t); });
  return posts;
}

/* ---- the census ferry: a double ended harbour boat ---- */
function v8Ferry(fx, fz, L, Wd) {
  const orange = new THREE.Color(0xf26a1b), boot = new THREE.Color(0x1d1d1f), anti = new THREE.Color(0x7a2418), trim = new THREE.Color(0xf4f1ea);
  [orange, boot, anti, trim].forEach(c => c.convertSRGBToLinear());   // vertex colours are linear in r128
  const H = v8Loft(L, {
    halfW: zn => Wd / 2 * (0.3 + 0.7 * Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(zn), 3.2)))),
    deck: zn => 2.2 + 0.55 * zn * zn, keel: zn => -1.1 + 0.9 * Math.pow(Math.abs(zn), 4), round: 3.2,
    paint: (y, zn, c) => c.copy(y < 0.12 ? anti : y < 0.42 ? boot : (y > 1.55 && y < 1.72) ? trim : orange)
  });
  const paint = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.15, side: THREE.DoubleSide });
  const hull = new THREE.Mesh(H.hull, paint); hull.position.set(fx, 0, fz); hull.castShadow = hull.receiveShadow = true; scene.add(hull);
  const deckM = new THREE.MeshStandardMaterial({ color: 0x8c8f91, roughness: 0.8, metalness: 0.2, side: THREE.DoubleSide });
  const deck = new THREE.Mesh(H.deck, deckM); deck.position.copy(hull.position); deck.receiveShadow = true; scene.add(deck);
  const white = new THREE.MeshStandardMaterial({ color: 0xf3f1ec, roughness: 0.38, metalness: 0.08 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x223038, roughness: 0.06, metalness: 0.8, emissive: 0xffc98a, emissiveIntensity: 0.05 });
  (window.__v8glass || (window.__v8glass = [])).push(glass);
  const add = (g, mat, y) => { const m = new THREE.Mesh(g, mat); m.position.set(fx, y, fz); m.castShadow = m.receiveShadow = true; scene.add(m); return m; };
  // main deckhouse, the window band wrapped round it, the overhanging upper deck, the upper house, the roof
  add(v8Stadium(Wd - 1.2, L - 6, 3.0), white, 2.2);
  add(v8Stadium(Wd - 1.16, L - 5.96, 0.95), glass, 3.25);
  add(v8Stadium(Wd - 0.3, L - 4.0, 0.22), white, 5.2);
  add(v8Stadium(Wd - 2.6, L - 12, 2.4), white, 5.42);
  add(v8Stadium(Wd - 2.56, L - 11.96, 0.8), glass, 6.15);
  add(v8Stadium(Wd - 1.9, L - 10, 0.2), white, 7.82);
  // upper deck stanchions under the overhang, railings on both decks
  const steel = new THREE.MeshStandardMaterial({ color: 0xe9e6df, roughness: 0.35, metalness: 0.5 });
  v8StadiumPath(Wd - 0.5, L - 4.2, (Wd - 0.5) / 2, 64).forEach((p, i) => { if (i % 4 === 0) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.0, 6), steel); s.position.set(fx + p.x, 3.7, fz + p.z); scene.add(s); } });
  v8Rail(v8StadiumPath(Wd - 0.45, L - 4.15, (Wd - 0.45) / 2, 70).map(p => new V3(fx + p.x, 5.42, fz + p.z)), 1.0, steel, true);
  const gun = H.edgeR.concat(H.edgeL.slice().reverse()).filter((p, i) => i % 2 === 0).map(p => new V3(fx + p.x * 0.97, p.y, fz + p.z * 0.995));
  v8Rail(gun, 1.0, steel, true, 1.1);
  // two wheelhouses, one at each end: the boat never turns round
  [-1, 1].forEach(s => { const z = fz + s * (L / 2 - 9.6);
    const wh = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.7, 2.2), white); wh.position.set(fx, 8.02 + 0.85, z); wh.castShadow = true; scene.add(wh);
    const wg = new THREE.Mesh(new THREE.BoxGeometry(3.64, 0.7, 2.24), glass); wg.position.set(fx, 8.02 + 1.05, z); scene.add(wg);
    const rf = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.12, 2.8), white); rf.position.set(fx, 8.02 + 1.76, z); rf.castShadow = true; scene.add(rf);
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 5), steel); ant.position.set(fx + 1.4, 10.9, z); scene.add(ant); });
  // the funnel: an oval stack, orange with a black top
  const fun = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, 3.4, 24), new THREE.MeshStandardMaterial({ color: 0xf26a1b, roughness: 0.4 })); fun.scale.set(1, 1, 1.7); fun.position.set(fx, 8.02 + 1.7, fz + 3); fun.castShadow = true; scene.add(fun);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.63, 0.6, 24), new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.7 })); top.scale.set(1, 1, 1.7); top.position.set(fx, 8.02 + 3.4 + 0.2, fz + 3); scene.add(top);
  // mast with a radar bar and a flag
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 5, 6), steel); mast.position.set(fx, 10.5, fz - 3); scene.add(mast);
  const radar = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.2), steel); radar.position.set(fx, 11.6, fz - 3); scene.add(radar); (window.__v8spin || (window.__v8spin = [])).push(radar);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.8, 6, 1), new THREE.MeshStandardMaterial({ color: 0x2962ff, side: THREE.DoubleSide, roughness: 0.8 })); flag.position.set(fx, 12.6, fz - 3 - 0.65); flag.rotation.y = PI / 2; scene.add(flag); (window.__v8flags || (window.__v8flags = [])).push(flag);
  return hull;
}

/* ---- a car: lower body with a bevel, a glass greenhouse, a roof panel, four wheels, lamps ---- */
function v8Car(color) {
  const V8CAR = window.__v8car || (window.__v8car = {});
  if (!V8CAR.body) {
    const s = new THREE.Shape(); // side profile, z forward, y up, body only to the beltline
    [[-2.0, 0.12], [1.95, 0.12], [2.08, 0.42], [2.0, 0.66], [1.1, 0.8], [-1.2, 0.82], [-1.98, 0.74], [-2.08, 0.4]].forEach(([z, y], i) => i ? s.lineTo(z, y) : s.moveTo(z, y));
    const bg = new THREE.ExtrudeGeometry(s, { depth: 1.56, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.08, bevelSegments: 3, curveSegments: 4 });
    bg.rotateY(-PI / 2); bg.translate(0.78, 0, 0); V8CAR.body = bg;
    const gsh = new THREE.Shape(); [[-1.25, 0.86], [1.0, 0.86], [0.42, 1.32], [-0.72, 1.34], [-1.32, 0.88]].forEach(([z, y], i) => i ? gsh.lineTo(z, y) : gsh.moveTo(z, y));
    const gg = new THREE.ExtrudeGeometry(gsh, { depth: 1.5, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 1 }); gg.rotateY(-PI / 2); gg.translate(0.75, 0, 0); V8CAR.glass = gg;
    V8CAR.roof = new THREE.BoxGeometry(1.5, 0.06, 1.2); V8CAR.roof.translate(0, 1.37, -0.15);
    V8CAR.wheel = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 16); V8CAR.wheel.rotateZ(PI / 2);
    V8CAR.hub = new THREE.CylinderGeometry(0.2, 0.2, 0.26, 10); V8CAR.hub.rotateZ(PI / 2);
    V8CAR.rub = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.9 }); V8CAR.alloy = new THREE.MeshStandardMaterial({ color: 0xb8bcc0, roughness: 0.3, metalness: 0.9 });
    V8CAR.glassM = new THREE.MeshStandardMaterial({ color: 0x1a232a, roughness: 0.05, metalness: 0.85 });
    V8CAR.head = new THREE.MeshBasicMaterial({ color: 0xfff4dc }); V8CAR.tail = new THREE.MeshBasicMaterial({ color: 0xc81818 }); V8CAR.lamp = new THREE.BoxGeometry(0.36, 0.12, 0.05);
  }
  const g = new THREE.Group(), lift = 0.66;
  const paint = new THREE.MeshStandardMaterial({ color, roughness: 0.28, metalness: 0.55 });
  const b = new THREE.Mesh(V8CAR.body, paint); b.position.y = lift + 0.08; g.add(b);
  const gl = new THREE.Mesh(V8CAR.glass, V8CAR.glassM); gl.position.y = lift + 0.08; g.add(gl);
  const rf = new THREE.Mesh(V8CAR.roof, paint); rf.position.y = lift + 0.08; g.add(rf);
  [[-0.86, 1.3], [0.86, 1.3], [-0.86, -1.35], [0.86, -1.35]].forEach(([x, z]) => { const w = new THREE.Mesh(V8CAR.wheel, V8CAR.rub); w.position.set(x, lift + 0.34, z); g.add(w); const h = new THREE.Mesh(V8CAR.hub, V8CAR.alloy); h.position.copy(w.position); g.add(h); });
  [-0.58, 0.58].forEach(x => { const h = new THREE.Mesh(V8CAR.lamp, V8CAR.head); h.position.set(x, lift + 0.62, 2.17); g.add(h); const t = new THREE.Mesh(V8CAR.lamp, V8CAR.tail); t.position.set(x, lift + 0.66, -2.17); g.add(t); });
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

/* ---- a sloop: lofted hull with a transom, a mast, a boom, a full main and a jib with some belly ---- */
function v8Sail(a, b, c, belly, mat) {
  // a triangle subdivided so it can billow; a = tack, b = head, c = clew
  const N = 8, pos = [], idx = [];
  for (let i = 0; i <= N; i++) for (let j = 0; j <= N - i; j++) { const u = i / N, v = j / N, w = 1 - u - v;
    const p = new V3().addScaledVector(a, w).addScaledVector(b, u).addScaledVector(c, v); p.x += belly * Math.sin(PI * (1 - u)) * Math.sin(PI * Math.min(1, (v + 0.15) / (1 - u + 0.15))) * (1 - u); pos.push(p.x, p.y, p.z); }
  let k = 0; const row = []; for (let i = 0; i <= N; i++) { row.push(k); k += N - i + 1; }
  for (let i = 0; i < N; i++) for (let j = 0; j < N - i; j++) { const p = row[i] + j, q = row[i + 1] + j; idx.push(p, p + 1, q); if (j < N - i - 1) idx.push(p + 1, q + 1, q); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.castShadow = true; return m;
}
function v8Sloop(i) {
  const g = new THREE.Group(), dark = i % 2 === 1;
  const hc = new THREE.Color(dark ? 0xf4f2ec : 0x14233f), bt = new THREE.Color(0x8a1f1f), wl = new THREE.Color(0xd8d4c8); [hc, bt, wl].forEach(c => c.convertSRGBToLinear());
  const H = v8Loft(6.4, { ns: 26, nk: 6,
    halfW: zn => 1.15 * (zn > 0 ? Math.sqrt(Math.max(0, 1 - zn * zn)) : 0.62 + 0.38 * (1 - zn * zn)),
    deck: zn => 0.85 + 0.18 * zn * zn + 0.06 * zn, keel: zn => -0.35 + 0.55 * Math.pow(Math.max(0, zn), 2) + 0.2 * Math.max(0, -zn), round: 2,
    paint: (y, zn, c) => c.copy(y < 0.0 ? bt : y < 0.08 ? wl : hc) });
  const hull = new THREE.Mesh(H.hull, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, metalness: 0.1, side: THREE.DoubleSide })); g.add(hull);
  g.add(new THREE.Mesh(H.deck, new THREE.MeshStandardMaterial({ color: 0xb08a5a, roughness: 0.7, side: THREE.DoubleSide })));
  const cab = new THREE.Mesh(v8Stadium(1.3, 2.0, 0.4, 0.5), new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.4 })); cab.position.set(0, 0.95, -0.2); g.add(cab);
  const al = new THREE.MeshStandardMaterial({ color: 0xc9cdd1, roughness: 0.3, metalness: 0.85 });
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 8.4, 6), al); mast.position.set(0, 0.95 + 4.2, 0.6); g.add(mast);
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.9, 6), al); boom.rotation.x = PI / 2; boom.position.set(0, 1.85, 0.6 - 1.45); g.add(boom);
  const cloth = new THREE.MeshStandardMaterial({ color: i === 2 ? 0x2962ff : i === 4 ? 0xff6b00 : 0xf7f5ee, roughness: 0.75, side: THREE.DoubleSide });
  const main = v8Sail(new V3(0, 1.9, 0.55), new V3(0, 9.1, 0.58), new V3(0, 1.9, -2.3), 0.5, cloth); g.add(main);
  const jib = v8Sail(new V3(0, 1.0, 3.1), new V3(0, 8.0, 0.75), new V3(0, 1.3, -0.4), 0.38, cloth); g.add(jib);
  const stay = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 7.6, 3), al); stay.position.set(0, 4.6, 1.95); stay.rotation.x = -0.31; g.add(stay);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.userData.sails = [main, jib];
  return g;
}

/* ================= from here on, the parts that run after island.html has built everything ================= */
const LAND = { flags: [], tall: null };

/* ---- the toll plaza: a canopy, lights, glass booths, rumble strips, a striped arm ---- */
(function () {
  const g0 = ground(0, 100), steel = new THREE.MeshStandardMaterial({ color: 0xd8dadc, roughness: 0.35, metalness: 0.7 });
  const can = new THREE.Mesh(new THREE.BoxGeometry(16.4, 0.7, 10.4), new THREE.MeshStandardMaterial({ color: 0xf2f1ec, roughness: 0.5, metalness: 0.2 })); can.position.set(0, g0 + 6.4, 100); can.castShadow = can.receiveShadow = true; scene.add(can);
  const fas = new THREE.Mesh(new THREE.BoxGeometry(16.6, 0.36, 10.6), new THREE.MeshStandardMaterial({ color: 0x2962ff, roughness: 0.4, metalness: 0.3 })); fas.position.set(0, g0 + 6.0, 100); scene.add(fas);
  [[-7.6, 95.4], [7.6, 95.4], [-7.6, 104.6], [7.6, 104.6]].forEach(([x, z]) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 6.1, 14), steel); c.position.set(x, g0 + 3.05, z); c.castShadow = true; scene.add(c); post(x, z, 0.35); });
  // light panels under the canopy, on with the island's lamps
  const lp = new THREE.MeshBasicMaterial({ color: 0xfff3dc }); LAND.tollLight = lp;
  for (let i = -3; i <= 3; i++) [97, 100, 103].forEach(z => { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.5), lp); p.rotation.x = PI / 2; p.position.set(i * 2.1, g0 + 5.81, z); scene.add(p); });
  practical(0, g0 + 5.5, 100, 0xfff1d6, 18, 16);
  // the booths get glass on all four sides and a steel band
  const glass = new THREE.MeshStandardMaterial({ color: 0x2a3a42, roughness: 0.05, metalness: 0.8, emissive: 0xffd7a0, emissiveIntensity: 0.05 }); (window.__v8glass || (window.__v8glass = [])).push(glass);
  [-5.5, 5.5].forEach(x => { const gw = new THREE.Mesh(new THREE.BoxGeometry(2.06, 1.1, 3.06), glass); gw.position.set(x, g0 + 1.95, 100); scene.add(gw);
    const band = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.12, 3.1), steel); band.position.set(x, g0 + 1.35, 100); scene.add(band);
    const kerb = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.25, 4.6), new THREE.MeshStandardMaterial({ color: 0xe6c229, roughness: 0.7 })); kerb.position.set(x, g0 + 0.125, 100); kerb.receiveShadow = true; scene.add(kerb); });
  // the arm: red and white, with a counterweight
  if (tollArm) { const cv = document.createElement('canvas'); cv.width = 256; cv.height = 8; const c = cv.getContext('2d'); if (c && c.fillRect) for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#f4f2ee' : '#d22a1e'; c.fillRect(i * 32, 0, 32, 8); }
    const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; tollArm.children.forEach(o => { if (o.isMesh) o.material = new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 }); });
    const cw = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.45), new THREE.MeshStandardMaterial({ color: 0x2b2b2e, roughness: 0.6 })); cw.position.x = -0.5; tollArm.add(cw); }
  // rumble strips across both lanes, either side of the plaza
  const rs = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 0.025, 7.6), new THREE.MeshStandardMaterial({ color: 0xb9b3a0, roughness: 0.85 }), 24), m = new THREE.Matrix4(); let k = 0;
  [-1, 1].forEach(s => { for (let i = 0; i < 12; i++) { const a = PI / 2 + s * (0.11 + i * 0.006); m.compose(new V3(Math.cos(a) * 100, 0.685, Math.sin(a) * 100), QY(-a + PI / 2), new V3(1, 1, 1)); rs.setMatrixAt(k++, m); } });
  rs.receiveShadow = true; scene.add(rs);
})();
// toll and harbour props from Poly Haven, through the v7 prop loader
PROP_FILES.push('concrete_road_barrier', 'concrete_road_barrier_02', 'lateral_sea_marker', 'plastic_monobloc_chair_01', 'WetFloorSign_01', 'modular_street_seating', 'ship_pinnace');
[106.5, 108.2, 109.9].forEach((z, i) => { [-8.6, 8.6].forEach(x => prop(i % 2 ? 'concrete_road_barrier_02' : 'concrete_road_barrier', x, z, PI / 2, undefined, 1, true)); });
prop('WetFloorSign_01', 3.6, 102.6, 0.5, ground(3.6, 102.6), 1.6, false);
[-6.5, 6.5].forEach(x => prop('modular_street_seating', x, 131.5, x > 0 ? -PI / 2 : PI / 2, undefined, 1, true));
// SUMMER.JPG: chairs facing the boardwalk's art, two to an umbrella
for (let i = 0; i < 5; i++) { const ux = -60 + 4 + i * 6, uz = 49 - 3, g = ground(-44, 43) + 0.35; [-0.8, 0.8].forEach(o => prop('plastic_monobloc_chair_01', ux + o, uz + 1.2, PI + o * 0.3, g, 1, false)); }
// harbour: a sea marker either side of the ferry channel, and a tall ship at anchor
ARCH.marks = [[-14, 196], [26, 196]]; ARCH.tall = { x: -235, z: 150, s: 0.55 };

/* ---- SUMMER.JPG: the flat coloured cones become striped canvas umbrellas with ribs and a valance ---- */
(function () {
  const stripes = (a, b) => { const cv = document.createElement('canvas'); cv.width = 256; cv.height = 16; const c = cv.getContext('2d'); if (c && c.fillRect) for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? b : a; c.fillRect(i * 32, 0, 32, 16); } const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; return t; };
  const pal = [['#ff5a8a', '#fbf6ec'], ['#2fb8d0', '#fbf6ec']], ribM = new THREE.MeshStandardMaterial({ color: 0xe8e4da, roughness: 0.5, metalness: 0.4 });
  const cones = []; scene.children.forEach(o => { if (o.isMesh && o.geometry.type === 'ConeGeometry' && o.geometry.parameters.radius === 1.6 && Math.hypot(o.position.x + 44, o.position.z - 43) < 24) cones.push(o); });
  cones.forEach((o, i) => { const [a, b] = pal[i % 2], t = stripes(a, b), mat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.85, side: THREE.DoubleSide });
    const geo = new THREE.ConeGeometry(1.75, 0.62, 8, 1, true); const can = new THREE.Mesh(geo, mat); can.position.copy(o.position); can.position.y += 0.05; can.castShadow = true; scene.add(can);
    const val = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, 0.2, 8, 1, true), mat); val.position.set(o.position.x, o.position.y - 0.36, o.position.z); scene.add(val);
    for (let r = 0; r < 8; r++) { const an = r / 8 * PI * 2 + PI / 8, rib = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.85, 3), ribM); rib.position.set(o.position.x + Math.cos(an) * 0.87, o.position.y - 0.02, o.position.z + Math.sin(an) * 0.87); rib.lookAt(o.position.x + Math.cos(an) * 2, o.position.y - 0.33, o.position.z + Math.sin(an) * 2); rib.rotateX(PI / 2); scene.add(rib); }
    const fin = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), ribM); fin.position.set(o.position.x, o.position.y + 0.38, o.position.z); scene.add(fin);
    o.visible = false; });
  LAND.umbrellas = cones.length;
})();

/* ---- the lighthouse lantern: a gallery deck with a railing, mullions, a vent ball and a lightning rod ---- */
(function () {
  const { x, z } = LH, ty = LH.g + LH.H, steel = new THREE.MeshStandardMaterial({ color: 0xc9ccd0, roughness: 0.35, metalness: 0.85 });
  const gal = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.22, 40), MAT.graphite); gal.position.set(x, ty + 0.42, z); gal.castShadow = true; scene.add(gal);
  const ring = []; for (let i = 0; i < 48; i++) { const a = i / 48 * PI * 2; ring.push(new V3(x + Math.cos(a) * 3.45, ty + 0.53, z + Math.sin(a) * 3.45)); }
  v8Rail(ring, 1.05, steel, true, 0.7);
  const mul = new THREE.InstancedMesh(new THREE.BoxGeometry(0.09, 3.6, 0.09), MAT.graphite, 12), m = new THREE.Matrix4();
  for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; m.makeTranslation(x + Math.cos(a) * 2.22, ty + 2.4, z + Math.sin(a) * 2.22); mul.setMatrixAt(i, m); } scene.add(mul);
  [0.62, 4.2].forEach(dy => { const t = new THREE.Mesh(new THREE.TorusGeometry(2.23, 0.07, 6, 40), MAT.graphite); t.rotation.x = PI / 2; t.position.set(x, ty + dy, z); scene.add(t); });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), MAT.graphite); ball.position.set(x, ty + 5.85, z); scene.add(ball);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 2.6, 5), steel); rod.position.set(x, ty + 7.4, z); scene.add(rod);
  const red = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff2a1a })); red.position.set(x, ty + 8.75, z); scene.add(red); LAND.beacon = red;
})();

function landBuild() {
  // sea markers and the tall ship, built once the props are in
  const mk = ARCH.props.lateral_sea_marker, ts = ARCH.props.ship_pinnace; const mm = new THREE.Matrix4();
  LAND.floaters = [];
  if (mk) ARCH.marks.forEach(([x, z], i) => { const grp = new THREE.Group(); mk.parts.forEach(p => { const me = new THREE.Mesh(p.g, p.m); me.castShadow = true; grp.add(me); }); grp.position.set(x, -1.2, z); scene.add(grp); LAND.floaters.push({ g: grp, ph: i * 2.1, y: -1.2, amp: 0.25 }); });
  if (ts) { const grp = new THREE.Group(); ts.parts.forEach(p => { const me = new THREE.Mesh(p.g, p.m); me.castShadow = !isMobile; grp.add(me); }); grp.scale.setScalar(ARCH.tall.s); grp.rotation.y = 0.7; grp.position.set(ARCH.tall.x, -1.8, ARCH.tall.z); scene.add(grp); LAND.floaters.push({ g: grp, ph: 0.4, y: -1.8, amp: 0.3, roll: 0.025 }); }
}
function landFrame(dt) {
  const gl = window.__v8glass; if (gl) gl.forEach(m => { m.emissiveIntensity = 0.04 + 1.2 * L.lamps; });
  if (LAND.tollLight) LAND.tollLight.color.setScalar(0.55 + 0.45 * L.lamps);
  (window.__v8spin || []).forEach(r => { r.rotation.y += dt * 2.2; });
  (window.__v8flags || []).forEach((f, i) => { const p = f.geometry.attributes.position; for (let k = 0; k < p.count; k++) { const u = p.getX(k) + 0.65; p.setZ(k, Math.sin(T * 5 + u * 4 + i) * 0.12 * u); } p.needsUpdate = true; });
  if (LAND.beacon) LAND.beacon.visible = (T % 2) < 0.25;
  (LAND.floaters || []).forEach(f => { f.g.position.y = f.y + Math.sin(T * 0.8 + f.ph) * f.amp; f.g.rotation.z = Math.sin(T * 0.6 + f.ph) * (f.roll || 0.06); });
  if (typeof BOATS !== 'undefined') BOATS.forEach((b, i) => { const sd = b.g.userData.sails; if (sd) sd.forEach((s, k) => { s.scale.x = 1 + Math.sin(T * 1.7 + i + k) * 0.18 * Math.min(1.6, NAT.wind.value); }); });
}
window.__LAND = LAND;
