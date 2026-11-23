/* ================================================================
   v123 WET STREETS (2026-11-23)
   When it rains the island's hard ground gets wet the way a real street does: the asphalt, the paving and the
   concrete darken and go glossy, so the lamps, the neon and the sky shine back out of them, and afterwards they
   dry out slowly over about twenty minutes, the high spots first. (Before, only the sea changed.)
   ================================================================ */
const WETS = { m: [], k: 0 };
window.__WETS = WETS;
(function wetStreets() {
  const seen = new Set(), add = m => { if (!m || seen.has(m) || !m.isMeshStandardMaterial || m.transparent) return; seen.add(m); WETS.m.push({ m, r: m.roughness, c: m.color.clone(), e: m.envMapIntensity === undefined ? 1 : m.envMapIntensity }); };
  [MAT.road, MAT.pave, MAT.conc, MAT.stone, MAT.lime, MAT.brick, MAT.terr].forEach(add);
  setTimeout(() => { try { const bb = new THREE.Box3(), sz = new THREE.Vector3(); scene.traverse(o => { if (!o.isMesh || o.isInstancedMesh || !o.material || Array.isArray(o.material) || o.material.roughness < 0.75) return; bb.setFromObject(o); bb.getSize(sz); if (sz.y < 0.4 && sz.x > 3 && sz.z > 3 && bb.max.y < 3) add(o.material); }); } catch (e) { } }, 5000);
})();
function wetFrame(dt) {
  const want = Math.min(1, (WX.wet || 0) * 1.6); WETS.k += (want - WETS.k) * Math.min(1, dt * (want > WETS.k ? 0.25 : 0.0009 * 60 / 60));
  if (Math.abs(WETS.k - (WETS.last || 0)) < 0.003) return; WETS.last = WETS.k; const k = WETS.k;
  WETS.m.forEach(w => { w.m.roughness = w.r + (0.14 - w.r) * k * 0.9; w.m.color.copy(w.c).multiplyScalar(1 - 0.42 * k); w.m.envMapIntensity = w.e * (1 + 1.6 * k); });
}
window.__FRAMES.push(dt => { try { wetFrame(dt); } catch (e) { if (!WETS.err) { WETS.err = e; console.warn('v123 wet', e); } } });
