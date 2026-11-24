/* ================================================================
   v238 REAL PROPS: THE CC0 LIBRARY ON THE ISLAND (2026-11-23)
   The island's street furniture was mostly built in code out of boxes, and it looked it. From here it comes from
   MLow's CC0 library instead: scanned Poly Haven models (the ON LOCATION set), pushed through his wrap tool
   (_build/cc0/island_brand.py, the ON LOCATION brand_pass adapted) to wear the island's own livery: navy enamel,
   bone lettering, cobalt, an Open Eye Flower medallion, and real 6529 Memes cards pressed onto them like stickers.
   The models live in assets/glb/ph and are drawn as instanced meshes, one draw per part however many copies.
   phPlace(name, list) puts a model at [x, y, z, ry, scale] each; phLoad(name) gives its parts and its size.
   Later versions use these to replace the boxy props one kind at a time. ?props=0 turns the library off.
   ================================================================ */
const PH = { cache: {}, base: 'assets/glb/ph/', placed: 0, ims: [], on: LOOK.on && !/props=0/.test(location.search) };
window.__PH = PH;
function phLoad(name) {
  if (PH.cache[name]) return PH.cache[name];
  PH.cache[name] = new Promise((res, rej) => { if (!gltfLoader) return rej(new Error('no loader'));
    gltfLoader.load(PH.base + name + '.glb', g => { const parts = [], box = new THREE.Box3(); g.scene.updateMatrixWorld(true);
      g.scene.traverse(o => { if (!o.isMesh) return; const m = o.material; if (m) { m.envMapIntensity = 1.0; if (m.map) m.map.anisotropy = ANISO; }
        parts.push({ geo: o.geometry, mat: m, m4: o.matrixWorld.clone() }); box.expandByObject(o); });
      res({ parts, size: box.getSize(new THREE.Vector3()), min: box.min.clone() }); }, undefined, rej); });
  return PH.cache[name];
}
// list: [[x, y, z, ry, s], ...]; s a number or [sx, sy, sz]. Returns a promise of the instanced meshes.
function phPlace(name, list, opt) { opt = opt || {};
  if (!PH.on || !list.length) return Promise.resolve([]);
  return phLoad(name).then(M => { const out = [], base = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3();
    M.parts.forEach(pt => { const im = new THREE.InstancedMesh(pt.geo, pt.mat, list.length);
      list.forEach((L, i) => { const s = L[4] == null ? 1 : L[4]; Array.isArray(s) ? s3.set(s[0], s[1], s[2]) : s3.setScalar(s);
        base.compose(p3.set(L[0], L[1], L[2]), q.setFromEuler(e.set(0, L[3] || 0, 0)), s3); im.setMatrixAt(i, new THREE.Matrix4().multiplyMatrices(base, pt.m4)); });
      im.instanceMatrix.needsUpdate = true; im.castShadow = opt.shadow !== false && Math.max(M.size.x, M.size.y, M.size.z) * (Array.isArray(list[0][4]) ? 1 : (list[0][4] || 1)) > 1.15; im.receiveShadow = true; scene.add(im); try { cullBound(im); } catch (e) { } out.push(im); PH.ims.push(im); });
    PH.placed += list.length; return out; }).catch(e => { if (!PH.err) { PH.err = e; console.warn('v238 props', name, e); } return []; });
}
// v327: calls made while the page script runs are queued and placed together, one set of meshes per model per 60 m
// cell, so twenty crates placed by five versions in one block cost one draw per part instead of five.
const _phPlaceNow = phPlace; PH.q = new Map(); PH.qOn = true;
phPlace = function (name, list, opt) { if (!PH.on || !list.length) return Promise.resolve([]); if (!PH.qOn) return _phPlaceNow(name, list, opt);
  const out = []; let res; const pr = new Promise(r => res = r); const byCell = new Map();
  list.forEach(L => { const k = name + '|' + Math.floor(L[0] / 60) + '|' + Math.floor(L[2] / 60) + '|' + (opt && opt.shadow === false ? 0 : 1); if (!byCell.has(k)) byCell.set(k, []); byCell.get(k).push(L); });
  let left = byCell.size; byCell.forEach((L, k) => { if (!PH.q.has(k)) { PH.q.set(k, { name, list: [], opt, cbs: [] }); } const e = PH.q.get(k); e.list.push(...L); e.cbs.push(ims => { out.push(...ims); if (--left === 0) res(out); }); });
  if (!PH.qT) PH.qT = Promise.resolve().then(() => { PH.qOn = false; PH.q.forEach(e => _phPlaceNow(e.name, e.list, e.opt).then(ims => e.cbs.forEach(cb => cb(ims)))); PH.q.clear(); });
  return pr; };
window.phPlace = phPlace; window.phLoad = phLoad;
