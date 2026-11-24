/* ================================================================
   v478 LAMPS ON THE ILLUSION BEACH (2026-11-24)
   Four of the scanned street lamps (Poly Haven, CC0, in the island's navy) stand along the duckboards, their globes
   lit after dusk like the boardwalk's, so the east beach walk has light to walk by.
   ================================================================ */
(function eastLamps() {
  if (!window.__EASTB || !window.__PH || !PH.on || /eastbeach=0/.test(location.search)) return;
  const L4 = [46, 78, 108, 143].map(d => { const P = eastAt(d, 109.6); post(P.x, P.z, 0.15, -5, 4); return [P.x, P.g + 0.02, P.z, P.ry, 1.0]; }); phPlace('isl_lamp', L4);
  const glow = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffd9a0, toneMapped: false, transparent: true, opacity: 0 }), L4.length); EASTB.glow = glow;
  phLoad('isl_lamp').then(A => { const o = new THREE.Object3D(); L4.forEach((l, i) => { o.position.set(l[0], l[1] + A.size.y * 0.93, l[2]); o.updateMatrix(); glow.setMatrixAt(i, o.matrix); }); glow.instanceMatrix.needsUpdate = true; scene.add(glow); }).catch(() => { });
})();
window.__FRAMES.push(() => { try { if (!EASTB.glow) return; const k = Math.min(1, (L.lamps || 0) * 1.3); EASTB.glow.material.opacity = k; EASTB.glow.visible = k > 0.02; } catch (e) { } });
