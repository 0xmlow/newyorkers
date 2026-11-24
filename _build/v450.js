/* ================================================================
   v450 THE CUBE THAT FLIPS (2026-11-24)
   A Necker cube in neon: twelve white tubes of light on a post, nothing solid, every edge the same brightness and
   thickness, turning slowly. Which face is in front? Look at it long enough and it turns inside out, and when it
   does it seems to spin the other way. Louis Albert Necker, 1832, who saw it in a drawing of a crystal.
   ?eastbeach=0 off.
   ================================================================ */
(function neckerCube() {
  if (!window.__EASTB || /eastbeach=0/.test(location.search)) return;
  const P = eastAt(89, 121); eastLabel(91.5, 116, 'WHICH FACE IS IN FRONT?', 'STARE AT IT. IT TURNS INSIDE OUT, THEN SPINS THE OTHER WAY.');
  const G = new THREE.Group(), S = 2.1, h = S / 2, neon = new THREE.MeshBasicMaterial({ color: 0xe8f4ff, toneMapped: false });
  const edges = []; [-h, h].forEach(a => [-h, h].forEach(b => { edges.push([[-h, a, b], [h, a, b]], [[a, -h, b], [a, h, b]], [[a, b, -h], [a, b, h]]); }));
  edges.forEach(([p, q]) => { const A = new V3(...p), B = new V3(...q), L2 = A.distanceTo(B), m = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, L2 + 0.08, 8), neon); m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new V3(0, 1, 0), B.clone().sub(A).normalize()); G.add(m); });
  G.position.set(P.x, P.g + 3.4, P.z); G.rotation.x = 0.42; scene.add(G);
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.2, 8), new THREE.MeshStandardMaterial({ color: 0x16233f, roughness: 0.5 })); st.position.set(P.x, P.g + 1.1, P.z); scene.add(st); post(P.x, P.z, 0.4, -5, 4);
  EASTB.cube = G;
})();
window.__FRAMES.push(dt => { try { if (EASTB.cube) EASTB.cube.rotation.y += dt * 0.25; } catch (e) { } });
