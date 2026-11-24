/* ================================================================
   v237 FRAME RATE: THE FACADES CULL (2026-11-23)
   Every instanced facade part since v173 (windows, cornices, fire escapes, signs, benches, kerbs, rooftop gear)
   was drawn every frame and into every shadow map, even behind you, because an InstancedMesh in three r128 culls
   against its one unit box and so had culling switched off. Each of those meshes now gets its own bounding sphere
   round the instances it actually holds and culls like everything else: the parts of the island you are not
   looking at cost nothing, in the main pass and in the shadow pass. facFlush() does it for every flush from here
   on. ?cull=0 turns it off.
   ================================================================ */
const CULL = { n: 0, skipped: 0 };
window.__CULL = CULL;
function cullBound(im) {
  if (!im || !im.isInstancedMesh || im.userData.__culled) return false;
  const g = im.geometry; if (!g.boundingSphere) g.computeBoundingSphere(); const r0 = g.boundingSphere.radius, c0 = g.boundingSphere.center;
  const m4 = new THREE.Matrix4(), p = new THREE.Vector3(), s = new THREE.Vector3(), q = new THREE.Quaternion(), box = new THREE.Box3(); let maxR = 0;
  for (let i = 0; i < im.count; i++) { im.getMatrixAt(i, m4); m4.decompose(p, q, s); const sc = Math.max(s.x, s.y, s.z); if (sc === 0) continue; p.add(c0.clone().multiply(s).applyQuaternion(q)); box.expandByPoint(p); maxR = Math.max(maxR, r0 * sc); }
  if (box.isEmpty()) return false;
  const sph = new THREE.Sphere(); box.getBoundingSphere(sph); sph.radius += maxR;
  if (sph.radius > 140) { CULL.skipped++; return false; }   // island wide: culling buys nothing
  const ng = g.clone(); ng.boundingSphere = sph; ng.boundingBox = null; im.geometry = ng; im.frustumCulled = true; im.userData.__culled = true; CULL.n++; return true;
}
window.cullBound = cullBound;
(function facadesCull() {
  if (/cull=0/.test(location.search) || typeof FACM === 'undefined') return;
  const facMats = new Set(Object.values(FACM));
  scene.traverse(o => { if (o.isInstancedMesh && !o.frustumCulled && (facMats.has(o.material) || o.geometry === FAC_BOX)) cullBound(o); });
  // every later flush: bound the meshes it adds
  const _ff = facFlush; facFlush = function () { const n0 = scene.children.length; _ff(); for (let i = n0; i < scene.children.length; i++) cullBound(scene.children[i]); };
})();
