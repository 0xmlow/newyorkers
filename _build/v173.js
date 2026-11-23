/* ================================================================
   v173 THE LOOK: BUILT, NOT BOXED (2026-11-23)
   The island's buildings were boxes with dark rectangles laid on them: no depth, no stone, no roofline, and the
   walk up and the water tower building blank on three sides. They are rebuilt the way a New York builder of 1900
   would have finished them, out of real pieces that catch the sun and throw shadows:
   - every window sits in a deep reveal (jambs and a head standing proud of the brick), with a stone lintel above,
     a projecting stone sill below and a meeting rail across the glass; some carry a window AC unit;
   - stone belt courses mark the floors, a water table plinth runs along the foot of the wall;
   - the walk up gets a full cornice (frieze, a row of dentils, brackets and an overhanging crown) on all four sides,
     windows on the sides and back, and a black fire escape down its back with ladders between the landings;
   - the water tower building gets windows on every side and a dentil course under its parapet cap;
   - the bodega, the laundromat and the N3W DROP shop get a cornice and a plinth;
   - the market kiosks get painted tongue and groove board backs instead of a flat panel.
   Lit windows at night follow the lamps like v172's glows. Everything is instanced: a few dozen draw calls in all.
   ?facades=0 turns it off.
   ================================================================ */
const FAC = { parts: {}, lit: [], n: 0 };
window.__FAC = FAC;
const FAC_ON = LOOK.on && !/facades=0/.test(location.search);
const _fco = new THREE.Object3D(), _fcq = new THREE.Color();
const FACM = {
  stone: new THREE.MeshStandardMaterial({ color: 0xcfc3ae, roughness: 0.82 }),
  stoneD: new THREE.MeshStandardMaterial({ color: 0x8e8478, roughness: 0.9 }),
  frame: new THREE.MeshStandardMaterial({ color: 0xe8e2d6, roughness: 0.55 }),
  frameK: new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.5, metalness: 0.3 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x0f1318, roughness: 0.08, metalness: 0.6, envMapIntensity: 1.4 }),
  lit: new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 0.15, metalness: 0.2, emissive: 0xffc27a, emissiveIntensity: 0 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x141516, roughness: 0.55, metalness: 0.55 }),
  ac: new THREE.MeshStandardMaterial({ color: 0xbdb7aa, roughness: 0.6, metalness: 0.35 }),
  board: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78 }),
};
const FAC_BOX = new THREE.BoxGeometry(1, 1, 1);
// queue a unit box: c centre (world), s size, ry yaw, mat key, optional colour
function facPut(key, x, y, z, sx, sy, sz, ry, col) { (FAC.parts[key] = FAC.parts[key] || []).push([x, y, z, sx, sy, sz, ry || 0, col]); }
function facFlush() {
  Object.keys(FAC.parts).forEach(key => { const L0 = FAC.parts[key]; if (!L0.length) return; const im = new THREE.InstancedMesh(FAC_BOX, FACM[key], L0.length);
    L0.forEach((p, i) => { _fco.position.set(p[0], p[1], p[2]); _fco.rotation.set(0, p[6], 0); _fco.scale.set(p[3], p[4], p[5]); _fco.updateMatrix(); im.setMatrixAt(i, _fco.matrix); if (p[7] !== undefined) im.setColorAt(i, _fcq.set(p[7])); });
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.castShadow = key !== 'glass' && key !== 'lit'; im.receiveShadow = true; im.frustumCulled = false; scene.add(im); FAC[key + 'Mesh'] = im; FAC.n += L0.length; });
  FAC.parts = {};
}
// a face of a box building: centre cx,cz, outward normal (nx,nz), half depth hd to the face, face width fw
function facFace(cx, cz, nx, nz, hd) { const ry = Math.atan2(nx, nz), tx = nz, tz = -nx;
  return { ry, at: (u, y, w, sx, sy, sz, key, col) => facPut(key, cx + nx * (hd + w) + tx * u, y, cz + nz * (hd + w) + tz * u, sx, sy, sz, ry, col) }; }
// one window: u along the face, y centre, ww x wh, glass optional (when the old window plane is kept)
function facWindow(F, u, y, ww, wh, o) { o = o || {}; const fr = o.frame || 'frame';
  if (o.glass !== false) F.at(u, y, 0.015, ww, wh, 0.02, Math.random() < (o.litP == null ? 0.45 : o.litP) ? 'lit' : 'glass');
  F.at(u - ww / 2 - 0.05, y, 0.08, 0.1, wh + 0.1, 0.16, fr); F.at(u + ww / 2 + 0.05, y, 0.08, 0.1, wh + 0.1, 0.16, fr);
  F.at(u, y + wh / 2 + 0.05, 0.08, ww + 0.2, 0.1, 0.16, fr); F.at(u, y + 0.02, 0.05, ww, 0.06, 0.05, fr);
  if (o.lintel !== false) F.at(u, y + wh / 2 + 0.22, 0.09, ww + 0.46, 0.24, 0.18, 'stone');
  F.at(u, y - wh / 2 - 0.05, 0.11, ww + 0.34, 0.09, 0.24, 'stone');
  if (o.ac && Math.random() < o.ac) { F.at(u + (Math.random() - 0.5) * 0.2, y - wh / 2 + 0.3, 0.3, 0.68, 0.44, 0.56, 'ac'); F.at(u, y - wh / 2 + 0.12, 0.05, ww, 0.04, 0.1, 'frame'); }
}
// stone courses and a cornice round a w (x) by d (z) footprint
function facRing(cx, cz, w, d, fn) { [[1, 0, w / 2, d], [-1, 0, w / 2, d], [0, 1, d / 2, w], [0, -1, d / 2, w]].forEach(([nx, nz, hd, fw]) => fn(facFace(cx, cz, nx, nz, hd), fw)); }
function facCornice(cx, cz, w, d, top, o) { o = o || {}; const big = o.big !== false;
  facRing(cx, cz, w, d, (F, fw) => {
    if (big) F.at(0, top - 0.55, 0.04, fw + 0.08, 0.5, 0.08, 'stone');                                  // frieze
    const dy = top - (big ? 0.24 : 0.2); for (let u = -fw / 2 + 0.16; u <= fw / 2 - 0.12; u += 0.3) F.at(u, dy, 0.1, 0.14, 0.16, 0.2, 'stone');   // dentils
    if (big) for (let u = -fw / 2 + 0.3; u <= fw / 2 - 0.2; u += 1.15) F.at(u, top - 0.42, 0.2, 0.2, 0.55, 0.4, 'stone');                    // brackets
    F.at(0, top - 0.05, big ? 0.22 : 0.12, fw + (big ? 0.9 : 0.5), big ? 0.22 : 0.16, big ? 0.48 : 0.3, 'stone');                          // crown
    F.at(0, top + 0.08, big ? 0.3 : 0.16, fw + (big ? 1.0 : 0.56), 0.05, big ? 0.36 : 0.2, 'stoneD');
  });
}
function facPlinth(cx, cz, w, d, g, h, skip) { facRing(cx, cz, w, d, (F, fw) => F.at(0, g + h / 2, 0.04, fw + 0.08, h, 0.08, 'stoneD')); }
function facBelts(cx, cz, w, d, ys) { facRing(cx, cz, w, d, (F, fw) => ys.forEach(y => F.at(0, y, 0.05, fw + 0.1, 0.13, 0.1, 'stone'))); }

(function facades() {
  if (!FAC_ON) return;
  // ---- the walk up (v92): D 7 along x, W 8 along z, front on -x, four floors of 3.1 m, ground floor raised 1.4 m
  if (window.__BROWN && BROWN.H) { const x0 = BROWN_AT.x, z0 = BROWN_AT.z, g0 = BROWN.g0, H = BROWN.H, D = 7, W = 8;
    const winY = f => g0 + 1.9 + f * 3.1;
    const front = facFace(x0, z0, -1, 0, D / 2);   // u runs along +z
    for (let f = 0; f < 4; f++) for (let k = 0; k < 3; k++) { if (f === 0 && k === 0) continue; facWindow(front, -2.4 + k * 2.4, winY(f), 1.1, 1.9, { glass: false, ac: f > 0 ? 0.25 : 0 }); }
    // the door surround: pilasters and a hood on brackets
    front.at(-2.4 - 0.72, g0 + 2.55, 0.1, 0.24, 2.5, 0.2, 'stone'); front.at(-2.4 + 0.72, g0 + 2.55, 0.1, 0.24, 2.5, 0.2, 'stone');
    front.at(-2.4, g0 + 3.95, 0.2, 1.9, 0.18, 0.42, 'stone'); front.at(-2.4, g0 + 4.08, 0.22, 2.0, 0.08, 0.46, 'stoneD');
    const back = facFace(x0, z0, 1, 0, D / 2), sideN = facFace(x0, z0, 0, -1, W / 2), sideS = facFace(x0, z0, 0, 1, W / 2);
    for (let f = 0; f < 4; f++) { [-2.4, 0, 2.4].forEach(u => facWindow(back, u, winY(f), 1.0, 1.75, { ac: 0.3 })); [-1.7, 1.7].forEach(u => { facWindow(sideN, u, winY(f), 0.95, 1.7, { ac: 0.2 }); facWindow(sideS, u, winY(f), 0.95, 1.7, { ac: 0.2 }); }); }
    facBelts(x0, z0, D, W, [1, 2, 3].map(f => g0 + 0.75 + f * 3.1));
    facPlinth(x0, z0, D, W, g0, 0.75);
    facCornice(x0, z0, D, W, g0 + H, { big: true });
    // fire escape down the back (+x face): a landing per upper floor across the two right hand windows, rails, ladders
    const fe = back; for (let f = 1; f < 4; f++) { const y = winY(f) - 0.95 - 0.08; fe.at(1.2, y, 0.62, 3.9, 0.05, 1.15, 'steel');
      fe.at(1.2, y + 0.95, 1.17, 3.9, 0.04, 0.04, 'steel'); fe.at(1.2, y + 0.5, 1.17, 3.9, 0.03, 0.03, 'steel');
      [-0.75, 3.15].forEach(u => { fe.at(u, y + 0.95 / 2, 0.62, 0.04, 0.04, 1.1, 'steel'); fe.at(u, y + 0.95, 0.62, 0.04, 0.04, 1.1, 'steel'); });
      for (let u = -0.75; u <= 3.16; u += 0.26) fe.at(u, y + 0.48, 1.17, 0.025, 0.95, 0.025, 'steel');
      [-0.6, 3.0].forEach(u => fe.at(u, y - 0.28, 0.62, 0.05, 0.5, 0.05, 'steel'));   // brackets
      if (f < 3) { // ladder up to the next landing, raking across the landing
        const y2 = winY(f + 1) - 1.03, len = Math.hypot(y2 - y, 1.6), ang = Math.atan2(y2 - y, 1.6);
        const steps = 8; for (let s = 1; s < steps; s++) { const t = s / steps; fe.at(0.2 + t * 1.6, y + t * (y2 - y), 0.9, 0.22, 0.03, 0.5, 'steel'); }
        const dir = new THREE.Vector3(0, y2 - y, -1.6).normalize();
        [0.65, 1.15].forEach(w => { const p = new THREE.Mesh(FAC_BOX, FACM.steel); p.scale.set(len, 0.07, 0.035); p.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir); p.position.set(x0 + D / 2 + w, (y + y2) / 2, z0 - 1.0); p.castShadow = true; scene.add(p); });
      } }
    // the drop ladder from the first landing
    fe.at(2.8, winY(1) - 1.03 - 1.1, 1.05, 0.04, 2.2, 0.04, 'steel'); fe.at(3.2, winY(1) - 1.03 - 1.1, 1.05, 0.04, 2.2, 0.04, 'steel');
    for (let s = 0; s < 7; s++) fe.at(3.0, winY(1) - 1.03 - 0.2 - s * 0.3, 1.05, 0.4, 0.03, 0.03, 'steel');
    // rooftop: a chimney stack and a vent
    facPut('stoneD', x0 + 2.2, g0 + H + 0.8, z0 + 2.9, 0.9, 1.6, 0.6); facPut('stone', x0 + 2.2, g0 + H + 1.64, z0 + 2.9, 1.05, 0.1, 0.75);
  }
  // ---- the water tower building (v66): S 7 cube, windows on +z already as planes
  if (window.__WT && WT.top) { const x0 = WT_AT.x, z0 = WT_AT.z, S = 7, g0 = WT.top - 7;
    const st = facFace(x0, z0, 0, 1, S / 2); for (let fl = 0; fl < 2; fl++) for (let k = -1; k <= 1; k++) facWindow(st, -k * 2, g0 + 2 + fl * 3, 1, 1.4, { glass: false, ac: 0.3 });
    [[1, 0], [-1, 0], [0, -1]].forEach(([nx, nz]) => { const F = facFace(x0, z0, nx, nz, S / 2); for (let fl = 0; fl < 2; fl++) for (let k = -1; k <= 1; k++) { if (nx === -1 && fl === 0 && k === 0) continue; facWindow(F, k * 2, g0 + 2 + fl * 3, 1, 1.4, { ac: 0.25 }); } });
    facBelts(x0, z0, S, S, [g0 + 3.55]); facPlinth(x0, z0, S, S, g0, 0.6);
    facRing(x0, z0, S, S, (F, fw) => { for (let u = -fw / 2 + 0.16; u <= fw / 2 - 0.12; u += 0.3) F.at(u, g0 + 6.75, 0.08, 0.14, 0.16, 0.16, 'stone'); F.at(0, g0 + 6.55, 0.04, fw + 0.08, 0.2, 0.08, 'stone'); });
    // the ground floor door on the -x side
    const dF = facFace(x0, z0, -1, 0, S / 2); dF.at(0, g0 + 1.15, 0.02, 1.1, 2.3, 0.04, 'frameK'); dF.at(0, g0 + 2.42, 0.1, 1.5, 0.2, 0.22, 'stone');
  }
  // ---- the low brick shops: cornice and plinth
  try { const bg = ground(17, 66) + 0.02; facCornice(17, 66, 10.4, 14.4, bg + 4.85, { big: false }); facPlinth(17, 66, 10.4, 14.4, bg, 0.45); } catch (e) { }
  if (window.__LAUND && LAUND.g0 != null) { facCornice(-86, -4, 5.2, 8.2, LAUND.g0 + 3.7, { big: false }); }
  if (window.__LINE && LINE.g0 != null) { facCornice(-62, 80, 7, 4, LINE.g0 + 4.45, { big: false }); facPlinth(-62, 80, 7, 4, LINE.g0, 0.4); }
  // ---- the market kiosks (v69): painted tongue and groove boards over the flat back panel
  if (window.__MKT && MKT.k) MKT.k.forEach((k, i) => { const gy = ground(k.x, k.z), W = 3.2, H = 2.5, zb = k.z + 1.1 + 0.045; const base = [0x23392b, 0x2a3f30, 0x203427][i % 3];
    for (let u = -W / 2 + 0.08; u < W / 2; u += 0.16) facPut('board', k.x + u, gy + H / 2, zb, 0.15, H, 0.035, 0, _fcq.set(base).offsetHSL(0, 0, (Math.random() - 0.5) * 0.04).getHex());
    facPut('frameK', k.x, gy + 0.14, zb + 0.03, W + 0.04, 0.28, 0.04); facPut('frameK', k.x, gy + H - 0.06, zb + 0.03, W + 0.04, 0.12, 0.04); });
  facFlush();
  if (typeof weathMat === 'function') [FACM.stone, FACM.stoneD, FACM.board].forEach(m => { try { weathMat(m); } catch (e) { } });
})();
window.__FRAMES.push(dt => { try { if (!FAC_ON) return; FACM.lit.emissiveIntensity = 0.04 + 1.1 * Math.min(1, (L.lamps || 0) * 1.3); } catch (e) { } });
