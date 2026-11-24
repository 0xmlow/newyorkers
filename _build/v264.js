/* ================================================================
   v264 THE COURT, CLEARED (2026-11-23)
   When the handball court went down (v217) it landed over a lawn tree and a scatter of ferns and flowers, which
   grew straight up through the asphalt. A New York court has none of that inside the fence. Anything planted inside
   the court's fence line is lifted out (its collision post too); everything outside is untouched. ?court=0 off.
   ================================================================ */
function instHideIn(cx, cz, r, ya, yb, skip) { let n = 0; const m4 = new THREE.Matrix4(), v = new THREE.Vector3(), zero = new THREE.Matrix4().makeScale(0, 0, 0);
  scene.traverse(o => { if (!o.isInstancedMesh || o.count > 30000 || (skip && skip(o))) return; let hit = 0;
    for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); v.setFromMatrixPosition(m4).applyMatrix4(o.matrixWorld); if (Math.hypot(v.x - cx, v.z - cz) < r && v.y > ya && v.y < yb) { o.setMatrixAt(i, zero); hit++; } }
    if (hit) { o.instanceMatrix.needsUpdate = true; n += hit; } }); return n; }
window.instHideIn = instHideIn;
(function courtCleared() {
  if (!window.__HB2 || !HB2.court) return; const [cx, cz] = HB2.L2W(0, 5.0), g = ground(cx, cz);
  const facMats = new Set(Object.values(FACM)); const keep = o => facMats.has(o.material) || (window.__PH && PH.ims.includes(o)) || o.material === MAT.pave;
  HB2.cleared = instHideIn(cx, cz, 4.4, g - 1, g + 12, keep);
  // the lawn tree is a plain mesh group: lift whole objects whose base stands inside the fence
  const v = new THREE.Vector3(), keepM = new Set([CHAINM, HB2.court && HB2.court.material].filter(Boolean));
  scene.children.slice().forEach(o => { if (o.isInstancedMesh || o.isLight || o.isCamera || o === HB2.court || (window.__STAND && o === STAND.mesh) || (o.userData && (o.userData.__ana || o.userData.__single))) return; if (o.isMesh && (keepM.has(o.material) || o.material && o.material.isShaderMaterial)) return;
    o.getWorldPosition(v); if (Math.hypot(v.x - cx, v.z - cz) < 4.0 && v.y > g - 1 && v.y < g + 1.5) { const b = new THREE.Box3().setFromObject(o); if (b.max.y - b.min.y > 1.2 && b.max.x - b.min.x < 12) { o.visible = false; HB2.cleared++; } } });
  try { if (typeof NAT_PLACE !== 'undefined') for (let i = NAT_PLACE.length - 1; i >= 0; i--) { const q = NAT_PLACE[i]; if (Math.hypot(q.x - cx, q.z - cz) < 4.4) { NAT_PLACE.splice(i, 1); HB2.cleared++; } } } catch (e) { }
  HB2.sweep = () => instHideIn(cx, cz, 4.4, g - 1, g + 12, keep);
  CIRCS.forEach(c => { if (c.on && Math.hypot(c.x - cx, c.z - cz) < 4.2 && c.r < 0.6) c.on = false; });
})();
window.__FRAMES.push(dt => { try { if (!window.__HB2 || !HB2.sweep) return; HB2.st = (HB2.st || 0) + dt; if ((HB2.st > 8 && !HB2.s1) || (HB2.st > 25 && !HB2.s2)) { HB2.cleared += HB2.sweep(); if (HB2.st > 25) HB2.s2 = true; else HB2.s1 = true; } } catch (e) { } });
