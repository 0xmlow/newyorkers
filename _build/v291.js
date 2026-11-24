/* ================================================================
   v291 REAL PROPS: THE REGISTER AND THE FANS (2026-11-24)
   A scanned brass cash register on the bodega's counter, and slow ceiling fans turning under the laundromat's strip
   lights. ?props=0 off.
   ================================================================ */
(function registerFans() {
  if (!PH.on) return;
  try { const g = ground(17, 66) + 0.02; phPlace('isl_register', [[18.6, g + 1.1, 62.2, -PI / 2, 1]]); } catch (e) { }
  try { if (window.__LAUND) phPlace('isl_fan', [[-86, LAUND.g0 + 3.35, -6.2, 0, 1], [-86, LAUND.g0 + 3.35, -1.8, 0.6, 1]], { shadow: false }).then(ims => { window.__FANS = ims; }); } catch (e) { }
  window.__FRAMES.push(dt => { try { if (!window.__FANS || Math.hypot(P.x + 86, P.z + 4) > 30) return; __FANS.forEach(im => { const m = new THREE.Matrix4(), r = new THREE.Matrix4().makeRotationY(dt * 2.4), p = new THREE.Vector3();
    for (let i = 0; i < im.count; i++) { im.getMatrixAt(i, m); p.setFromMatrixPosition(m); m.setPosition(0, 0, 0); m.premultiply(r); m.setPosition(p); im.setMatrixAt(i, m); } im.instanceMatrix.needsUpdate = true; }); } catch (e) { } });
})();
