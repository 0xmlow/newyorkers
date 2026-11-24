/* ================================================================
   v405 THE SIDESHOW AFTER DARK (2026-11-24)
   Marquee bulbs round every sideshow header, warm white, that come on at dusk and chase, one in three lit and
   stepping along like the old Coney Island fronts. The illusion panels are printed, not lit: after dark they drop to
   what the bulbs would light, instead of glowing like screens.
   ================================================================ */
(function sideBulbs() {
  if (!window.__SIDE || !SIDE.list.length) return;
  const pts = []; SIDE.list.forEach(B => { for (let i = 0; i < 14; i++) { const u = -1.12 + i * 2.24 / 13; [3.72, 3.12].forEach(y => { const [x, z] = B.at(u, 0.1); pts.push([x, B.g + y, z]); }); } [3.27, 3.42, 3.57].forEach(y => [-1.22, 1.22].forEach(u => { const [x, z] = B.at(u, 0.1); pts.push([x, B.g + y, z]); })); });
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), pts.length); const o = new THREE.Object3D(), c = new THREE.Color(0x3a3226);
  pts.forEach((p, i) => { o.position.set(p[0], p[1], p[2]); o.updateMatrix(); im.setMatrixAt(i, o.matrix); im.setColorAt(i, c); }); im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; scene.add(im);
  SIDE.bulbs = im; SIDE.bn = pts.length; SIDE.bt = 0; SIDE.step = 0;
  SIDE.panels = [SIDE.dancerB && null, SIDE.spiral, SIDE.trox].filter(Boolean).map(m => m.material); try { scene.children.forEach(m => { if (m.isMesh && m.material && m.material.color && m.material.color.getHex() === 0xf3ead2) SIDE.panels.push(m.material); }); } catch (e) { }
})();
window.__FRAMES.push(dt => { try { if (!SIDE.bulbs) return; const k = Math.min(1, (L.lamps || 0) * 1.3); SIDE.panels.forEach(m => { const v = 1 - 0.55 * k; if (m.userData.base == null) m.userData.base = m.color.getHex(); m.color.setHex(m.userData.base).multiplyScalar(v); });
  SIDE.bt += dt; if (SIDE.bt < 0.18) return; SIDE.bt = 0; SIDE.step = (SIDE.step + 1) % 3; const on = new THREE.Color(1.0, 0.86, 0.6), off = new THREE.Color(0x3a3226), mid = new THREE.Color(0.55, 0.45, 0.32);
  for (let i = 0; i < SIDE.bn; i++) SIDE.bulbs.setColorAt(i, k < 0.05 ? off : ((i + SIDE.step) % 3 === 0 ? on : mid.clone().lerp(off, 1 - k))); SIDE.bulbs.instanceColor.needsUpdate = true; } catch (e) { } });
