/* ================================================================
   v177 SMOOTH (2026-11-23)
   Measured on an M5 Pro at retina size, the island was drawing 26 to 40 million triangles in 6,000 to 11,000 draw
   calls a frame, with every one of its 36 lamp lights computed for every pixel, all day: 13 to 20 frames a second.
   This pass changes nothing you can see and most of what it costs:
   - LIGHT BUDGET: only the eight lamps nearest you are live (always eight, so no shader ever recompiles); the rest
     are off, and their pools of light on the ground (v171) still glow, so you cannot tell from where you stand.
   - STILL THINGS STAY STILL: anything that has not moved for two seconds stops having its matrix rebuilt every
     frame; the scene graph is updated once a frame instead of once per pass. Anything that moves again is caught
     the same frame.
   - DETAIL DISTANCE: small objects that would cover fewer than three pixels are left out of every pass (picture,
     shadows, depth), and come back before they are big enough to notice.
   - SCULPTURE LOD: every sculpture loads its light model first (59k triangles on average instead of 145k), and the
     full detail model is fetched and swapped in only for the ones within thirty metres of you.
   ?smooth=0 turns all of it off.
   ================================================================ */
const SMOOTH = { on: !/smooth=0/.test(location.search), nLights: isMobile ? 4 : 8, t: 0, lt: 0, frozen: [], fset: new WeakSet(), moved: 0, cull: [], cset: new WeakSet(), ci: 0, culled: 0, hi: 0 };
window.__SMOOTH = SMOOTH;
const CULL_LAYER = 3, MAIN_ONLY = 4;   // layer 4: drawn in the picture, left out of shadows and the depth pass
// ---------- light budget
function smoothLights() {
  const cp = camera.position, L0 = practicals.filter(l => l && l.parent); if (L0.length <= SMOOTH.nLights) return;
  const sc = L0.map(l => { l.getWorldPosition(_smv); return [l, _smv.distanceTo(cp) - (l.distance || 30) * 0.6 - (l.intensity > 0 ? 8 : 0)]; }).sort((a, b) => a[1] - b[1]);
  sc.forEach(([l], i) => { l.visible = i < SMOOTH.nLights; });
}
const _smv = new V3();
// ---------- still things: freeze matrices, compare once a frame
function smoothScan() {
  const now = performance.now();
  scene.traverse(o => { if (o === scene || o.isCamera || SMOOTH.fset.has(o) || !o.matrixAutoUpdate) return; const u = o.userData;
    const sig = o.position.x + o.position.y * 3.1 + o.position.z * 7.3 + o.quaternion.x * 11 + o.quaternion.y * 13 + o.quaternion.z * 17 + o.quaternion.w * 19 + o.scale.x * 23 + o.scale.y * 29 + o.scale.z * 31;
    if (u.__sg === sig) { u.__sn = (u.__sn || 0) + 1; if (u.__sn >= 2 && !u.__nofreeze) { SMOOTH.fset.add(o); o.updateMatrix(); o.matrixAutoUpdate = false; SMOOTH.frozen.push(o, o.position.x, o.position.y, o.position.z, o.quaternion.x, o.quaternion.y, o.quaternion.z, o.quaternion.w, o.scale.x, o.scale.y, o.scale.z); } }
    else { u.__sg = sig; u.__sn = 0; } });
}
function smoothCompare() {
  const F = SMOOTH.frozen; let w = 0;
  for (let i = 0; i < F.length; i += 11) { const o = F[i], p = o.position, q = o.quaternion, s = o.scale;
    if (p.x !== F[i + 1] || p.y !== F[i + 2] || p.z !== F[i + 3] || q.x !== F[i + 4] || q.y !== F[i + 5] || q.z !== F[i + 6] || q.w !== F[i + 7] || s.x !== F[i + 8] || s.y !== F[i + 9] || s.z !== F[i + 10]) {
      o.matrixAutoUpdate = true; o.updateMatrix(); o.userData.__nofreeze = true; SMOOTH.moved++; continue; }   // it moves: hand it back for good
    if (!o.parent) continue;
    if (w !== i) for (let k = 0; k < 11; k++) F[w + k] = F[i + k]; w += 11; }
  F.length = w;
}
// ---------- detail distance (layers, so every pass skips them)
function smoothCullScan() {
  scene.traverse(o => { if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || !o.frustumCulled || SMOOTH.cset.has(o) || !o.geometry) return; if (o.layers.mask !== 1) return;
    if (o.castShadow && o.geometry.boundingSphere && o.geometry.boundingSphere.radius * o.matrixWorld.getMaxScaleOnAxis() < 0.18) o.castShadow = false;
    if (!o.geometry.boundingSphere) { try { o.geometry.computeBoundingSphere(); } catch (e) { return; } } if (!o.geometry.boundingSphere || !(o.geometry.boundingSphere.radius > 0)) return;
    SMOOTH.cset.add(o); SMOOTH.cull.push(o); });
}
const _scc = new V3();
function smoothCullStep() {
  const C = SMOOTH.cull, n = C.length; if (!n) return; const cp = camera.position, focal = renderer.domElement.height / 2 / Math.tan(camera.fov * PI / 360), per = Math.min(n, 1800);
  for (let k = 0; k < per; k++) { SMOOTH.ci = (SMOOTH.ci + 1) % n; const o = C[SMOOTH.ci]; if (!o.parent || o.layers.mask === 0) continue; const bs = o.geometry.boundingSphere; if (!bs) continue;
    _scc.copy(bs.center).applyMatrix4(o.matrixWorld); const r = bs.radius * o.matrixWorld.getMaxScaleOnAxis(); if (r > 8) { if (o.layers.mask !== 1) o.layers.mask = 1; continue; }
    const d = _scc.distanceTo(cp), px = r / Math.max(0.1, d) * focal, m = o.layers.mask;   // 1 = everything, 16 = picture only, 8 = nothing
    const want = m === 8 ? (px > 4 || d < 28 ? (px > 13 || d < 26 ? 1 : 16) : 8) : m === 16 ? (px < 3 && d > 30 ? 8 : px > 13 || d < 26 ? 1 : 16) : (px < 3 && d > 30 ? 8 : px < 10 && d > 30 ? 16 : 1);
    if (want !== m) o.layers.mask = want; }
}
// ---------- sculpture LOD
if (SMOOTH.on && typeof SCL !== 'undefined') SCL.dir = 'sculpt';
function smoothHiPlace(s, obj) {
  obj.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(obj), sz = bb.getSize(new V3()), c = bb.getCenter(new V3());
  const target = s.size * s.scale, k = s.mode === 'm' ? target / Math.max(sz.x, sz.y, sz.z) : target / Math.max(0.001, sz.y);
  const inner = new THREE.Group(); inner.add(obj); obj.position.set(-c.x, -bb.min.y, -c.z); inner.scale.setScalar(k); inner.visible = false; s.root.add(inner); s.hiG = inner;
  obj.traverse(o => { if (!o.isMesh) return; o.castShadow = true; o.receiveShadow = true; o.userData.sculpt = s.i; PICK_EXTRA.push(o);
    const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach(mt => { if (mt) { mt.envMapIntensity = 0.75; if (mt.map) mt.map.anisotropy = ANISO; } }); });
}
function smoothHiDrop(s) {
  const g = s.hiG; if (!g) return; s.hiG = null; s.hiState = null; if (g.parent) g.parent.remove(g); SMOOTH.hi--;
  g.traverse(o => { if (!o.isMesh) return; const i = PICK_EXTRA.indexOf(o); if (i >= 0) PICK_EXTRA.splice(i, 1); o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (!m) return; ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap'].forEach(k => m[k] && m[k].dispose()); m.dispose(); }); });
}
function smoothLod() {
  if (!gltfLoader || typeof SC === 'undefined') return; const cp = camera.position;
  SC.forEach(s => { if (!s.root || s.state !== 'ready') return; const d = Math.hypot(cp.x - s.root.position.x, cp.z - s.root.position.z), lo = s.root.children[0];
    if (s.hiG) { const near = s.hiG.visible ? d < 42 : d < 34; s.hiG.visible = near; if (lo && lo !== s.hiG) lo.visible = !near; if (d > 90) { smoothHiDrop(s); if (lo) lo.visible = true; } return; }
    if (d < 30 && !s.hiState && SMOOTH.hiLoading < 2) { s.hiState = 'loading'; SMOOTH.hiLoading++; SMOOTH.hi++;
      gltfLoader.load('assets/sculpt_hi/' + s.key + '.gltf.json', g => { SMOOTH.hiLoading--; if (s.hiState !== 'loading') return; s.hiState = 'ready'; smoothHiPlace(s, g.scene); }, undefined, () => { SMOOTH.hiLoading--; s.hiState = 'error'; SMOOTH.hi--; }); } });
}
SMOOTH.hiLoading = 0;
// ---------- wiring: compare + one scene graph update right before the frame is drawn
if (SMOOTH.on) {
  const _rf = renderFrame;
  renderFrame = function () {
    try { smoothCompare(); scene.updateMatrixWorld(); } catch (e) { if (!SMOOTH.err) { SMOOTH.err = e; console.warn('v177 smooth', e); } }
    const au = scene.autoUpdate, mau = scene.matrixWorldAutoUpdate; scene.autoUpdate = false; if (mau !== undefined) scene.matrixWorldAutoUpdate = false;
    try { _rf(); } finally { scene.autoUpdate = au; if (mau !== undefined) scene.matrixWorldAutoUpdate = mau; }
  };
  try { if (window.__LAWN && LAWN.cam) { LAWN.cam.layers.enable(CULL_LAYER); LAWN.cam.layers.enable(MAIN_ONLY); } } catch (e) { }
  camera.layers.enable(MAIN_ONLY);
  const _ao = renderAO; renderAO = function () { camera.layers.disable(MAIN_ONLY); try { _ao(); } finally { camera.layers.enable(MAIN_ONLY); } };
  window.__FRAMES.push(dt => { try {
    SMOOTH.t += dt; SMOOTH.lt -= dt;
    if (SMOOTH.lt <= 0) { SMOOTH.lt = 0.25; smoothLights(); smoothLod(); }
    if ((SMOOTH.scanT = (SMOOTH.scanT || 0) - dt) <= 0) { SMOOTH.scanT = 1.0; smoothScan(); if ((SMOOTH.cs = (SMOOTH.cs || 0) + 1) % 3 === 1) smoothCullScan(); }
    smoothCullStep();
  } catch (e) { if (!SMOOTH.err2) { SMOOTH.err2 = e; console.warn('v177 smooth', e); } } });
}
// ---------- STATIC BATCHING: still meshes that share a material are merged per 40 m cell into one draw.
// The originals stay in the scene, untouched, on no layer (so nothing draws them); if one moves, is hidden or is
// removed, its cell is rebuilt without it and it goes back to drawing itself.
const BATCH = { cells: new Map(), of: new Map(), t: 0, n: 0, merged: 0, rebuilds: 0, dirty: new Set(), on: SMOOTH.on && !/batch=0/.test(location.search) };
window.__BATCH = BATCH;
function batchEligible(o) {
  if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || o.matrixAutoUpdate || o.userData.__nofreeze || BATCH.of.has(o)) return false;
  const m = o.material, g = o.geometry; if (o.userData.__single || o.renderOrder) return false; if (!m || Array.isArray(m) || m.transparent || !g || !g.isBufferGeometry || g.morphAttributes && Object.keys(g.morphAttributes).length) return false;
  if (!g.attributes.position || g.attributes.position.count > 6000 || g.attributes.tangent || g.isInstancedBufferGeometry) return false;
  if (o.onBeforeRender !== THREE.Object3D.prototype.onBeforeRender || o.userData.sculpt !== undefined || o.userData.slot !== undefined || o.userData.kind || o.userData.n !== undefined) return false;
  if (o.layers.mask !== 1 && o.layers.mask !== 16 && o.layers.mask !== 8) return false; if (PICK_EXTRA.indexOf(o) >= 0) return false;
  for (let p = o; p; p = p.parent) { if (!p.visible) return false; if (p !== o && p.matrixAutoUpdate && p !== scene) return false; if (p.parent === null && p !== scene) return false; }
  for (const k in g.attributes) { const a = g.attributes[k]; if (a.isInterleavedBufferAttribute || !(a.array instanceof Float32Array)) return false; }
  return true;
}
function batchKey(o) { const g = o.geometry, at = Object.keys(g.attributes).sort().map(k => k + g.attributes[k].itemSize).join(','); return o.material.uuid + '|' + at + '|' + (g.index ? 1 : 0) + '|' + (o.castShadow ? 1 : 0) + (o.receiveShadow ? 1 : 0) + '|' + (o.renderOrder || 0); }
const _bn = new THREE.Matrix3(), _bv = new V3();
function batchBuild(cell) {
  if (cell.mesh) { scene.remove(cell.mesh); cell.mesh.geometry.dispose(); cell.mesh = null; }
  const mem = cell.members.filter(o => o.parent); cell.members = mem; if (mem.length < 2) { mem.forEach(o => { o.userData.__single = true; batchRelease(o, null); }); cell.members = []; return; }
  const g0 = mem[0].geometry, keys = Object.keys(g0.attributes), indexed = !!g0.index; let nv = 0, ni = 0;
  mem.forEach(o => { nv += o.geometry.attributes.position.count; if (indexed) ni += o.geometry.index.count; });
  const out = new THREE.BufferGeometry(), arrs = {}; keys.forEach(k => { const a = g0.attributes[k]; arrs[k] = new Float32Array(nv * a.itemSize); });
  const idx = indexed ? (nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni)) : null; let vo = 0, io = 0;
  mem.forEach(o => { const g = o.geometry, mw = o.matrixWorld, nc = g.attributes.position.count; _bn.getNormalMatrix(mw);
    keys.forEach(k => { const a = g.attributes[k], s = a.itemSize, dst = arrs[k];
      for (let i = 0; i < nc; i++) { if (k === 'position') { _bv.fromBufferAttribute(a, i).applyMatrix4(mw); dst[(vo + i) * 3] = _bv.x; dst[(vo + i) * 3 + 1] = _bv.y; dst[(vo + i) * 3 + 2] = _bv.z; }
        else if (k === 'normal') { _bv.fromBufferAttribute(a, i).applyMatrix3(_bn).normalize(); dst[(vo + i) * 3] = _bv.x; dst[(vo + i) * 3 + 1] = _bv.y; dst[(vo + i) * 3 + 2] = _bv.z; }
        else for (let c = 0; c < s; c++) dst[(vo + i) * s + c] = a.getComponent ? a.getComponent(i, c) : a.array[i * s + c]; } });
    if (indexed) { const ia = g.index.array; for (let i = 0; i < ia.length; i++) idx[io + i] = ia[i] + vo; io += ia.length; }
    vo += nc; });
  keys.forEach(k => out.setAttribute(k, new THREE.BufferAttribute(arrs[k], g0.attributes[k].itemSize, g0.attributes[k].normalized))); if (idx) out.setIndex(new THREE.BufferAttribute(idx, 1));
  out.computeBoundingSphere(); out.computeBoundingBox();
  const m = new THREE.Mesh(out, mem[0].material); m.castShadow = mem[0].castShadow; m.receiveShadow = mem[0].receiveShadow; m.renderOrder = mem[0].renderOrder; m.matrixAutoUpdate = false; m.userData.__batch = true; m.userData.__nofreeze = true;
  scene.add(m); cell.mesh = m; mem.forEach(o => { o.userData.__bmask = o.userData.__bmask || o.layers.mask; o.layers.mask = 0; });
}
function batchRelease(o, cell) { BATCH.of.delete(o); if (o.layers.mask === 0) o.layers.mask = 1; delete o.userData.__bmask; if (cell) { const i = cell.members.indexOf(o); if (i >= 0) cell.members.splice(i, 1); BATCH.dirty.add(cell); } }
function batchScan() {
  const add = new Map();
  scene.traverse(o => { if (!batchEligible(o)) return; o.updateMatrixWorld(); const c = _bv.setFromMatrixPosition(o.matrixWorld), key = batchKey(o) + '|' + Math.floor(c.x / 40) + ',' + Math.floor(c.z / 40);
    let cell = BATCH.cells.get(key); if (!cell) { cell = { key, members: [], mesh: null }; BATCH.cells.set(key, cell); } cell.members.push(o); BATCH.of.set(o, cell); add.set(cell, 1); });
  // a cell is worth a draw of its own only if it saves draws
  add.forEach((_, cell) => BATCH.dirty.add(cell));
}
function batchCheck() {
  // anything merged that moved, was hidden, was removed or changed material goes back to drawing itself
  BATCH.of.forEach((cell, o) => { let ok = !!o.parent && !o.matrixAutoUpdate && (!cell.material0 || o.material === cell.material0);
    if (ok) for (let p = o; p; p = p.parent) { if (!p.visible || (p !== scene && p.parent === null)) { ok = false; break; } }
    if (!ok) { batchRelease(o, cell); BATCH.rebuilds++; } });
}
function batchFlush() { if (!BATCH.dirty.size) return; let budget = 12; for (const cell of BATCH.dirty) { if (budget-- <= 0) break; BATCH.dirty.delete(cell); cell.material0 = cell.members[0] && cell.members[0].material; batchBuild(cell); } BATCH.merged = 0; BATCH.n = 0; BATCH.cells.forEach(c => { if (c.mesh) { BATCH.n++; BATCH.merged += c.members.length; } }); }
if (BATCH.on) window.__FRAMES.push(dt => { try {
  BATCH.t += dt; if (BATCH.t < 12) return;
  if ((BATCH.st = (BATCH.st || 0) - dt) <= 0) { BATCH.st = 6; batchScan(); }
  if ((BATCH.ct = (BATCH.ct || 0) - dt) <= 0) { BATCH.ct = 0.2; batchCheck(); }
  batchFlush();
} catch (e) { if (!BATCH.err) { BATCH.err = e; console.warn('v177 batch', e); } } });
window.__BDBG = { elig: batchEligible, pick: o => PICK_EXTRA.indexOf(o) >= 0 };
// ---------- shadows at half rate when frames run late (before the governor has to give up sharpness)
const SHH = { ema: 16.7, last: 0, on: false, f: 0 };
window.__SHH = SHH;
if (SMOOTH.on) window.__FRAMES.push(() => { try {
  const now = performance.now(), gap = SHH.last ? now - SHH.last : 16.7; SHH.last = now; if (gap > 200 || !state.started) return;
  SHH.ema += (gap - SHH.ema) * 0.05; if (window.__GOV && __GOV.tier >= 3) { SHH.on = false; return; }
  if (!SHH.on && SHH.ema > 17.6) SHH.on = true; else if (SHH.on && SHH.ema < 16.4 && (SHH.calm = (SHH.calm || 0) + 1) > 600) { SHH.on = false; SHH.calm = 0; renderer.shadowMap.autoUpdate = true; }
  if (SHH.on) { renderer.shadowMap.autoUpdate = false; if ((SHH.f++ & 1) === 0) renderer.shadowMap.needsUpdate = true; }
} catch (e) { } });
