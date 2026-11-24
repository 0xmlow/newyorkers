/* ================================================================
   v412 THE POND: ONE OF THESE DUCKS IS NOT LIKE THE OTHERS (2026-11-24)
   A yellow rubber duck (Poly Haven's scan, CC0) has joined the real ducks on the pond. It bobs, turns slowly in the
   wind and drifts its own lazy loop, and the real ducks keep their distance.
   ================================================================ */
const RDUCK = {};
window.__RDUCK = RDUCK;
(function rubberDuck() {
  if (!window.__PH || !PH.on || !window.__POND || POND.y == null) return;
  phLoad('isl_duck').then(A => { const G = new THREE.Group(), s = 0.32 / Math.max(A.size.x, A.size.z); A.parts.forEach(pt => { const m = new THREE.Mesh(pt.geo, pt.mat); m.applyMatrix4(pt.m4); m.castShadow = true; G.add(m); }); G.scale.setScalar(s); scene.add(G); RDUCK.G = G; RDUCK.t = 0; }).catch(e => console.warn('v412', e));
})();
window.__FRAMES.push(dt => { try { if (!RDUCK.G) return; RDUCK.t += dt; const t = RDUCK.t * 0.05, x = POND.x + Math.cos(t) * POND.rx * 0.45, z = POND.z + Math.sin(t * 1.3) * POND.rz * 0.4;
  RDUCK.G.position.set(x, POND.y - 0.02 + Math.sin(RDUCK.t * 2.1) * 0.012, z); RDUCK.G.rotation.set(Math.sin(RDUCK.t * 1.7) * 0.06, -t * 2 + Math.sin(RDUCK.t * 0.3) * 0.6, Math.sin(RDUCK.t * 2.3) * 0.05); } catch (e) { } });
