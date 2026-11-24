/* ================================================================
   v426 THE BOARDWALK: BENCHES, LAMPS AND ITS NAME (2026-11-24)
   Scanned park benches (the island's CC0 seating, v240) along the road edge of the boardwalk facing the shops, three
   of the scanned street lamps in the island's navy with their globes lit after dusk, and at each end a green N3W
   street blade on a post: N3W BOARDWALK, and under it SIDESHOW ROW.
   ================================================================ */
(function boardwalkDress() {
  if (!window.__BWALK || !BWALK.ok || !window.__PH || !PH.on) return;
  const at = (deg, r) => { const a = deg * PI / 180; return [Math.sin(a) * r, Math.cos(a) * r, Math.atan2(Math.sin(a), Math.cos(a))]; };
  const benches = [230.5, 235.5, 245.5, 250.5].map(d => { const [x, z, a] = at(d, 105.3); return [x, ground(x, z) + 0.045, z, a + PI, 1.0]; }); phPlace('isl_seating', benches);
  const lamps = [226, 240.5, 255.5].map(d => { const [x, z, a] = at(d, 104.9); post(x, z, 0.15, -5, 4); return [x, ground(x, z) + 0.045, z, a, 1.0]; }); phPlace('isl_lamp', lamps);
  // the globes after dark
  const glow = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffd9a0, toneMapped: false, transparent: true, opacity: 0 }), lamps.length); BWALK.glow = glow;
  phLoad('isl_lamp').then(A => { const o = new THREE.Object3D(); lamps.forEach((l, i) => { o.position.set(l[0], l[1] + A.size.y * 0.93, l[2]); o.updateMatrix(); glow.setMatrixAt(i, o.matrix); }); glow.instanceMatrix.needsUpdate = true; scene.add(glow); }).catch(() => { });
  // the street blades
  FACM.iron = FACM.iron || new THREE.MeshStandardMaterial({ color: 0x1d2b24, roughness: 0.55, metalness: 0.5 });
  const blade = (deg) => { const [x, z, a] = at(deg, 104.9), g = ground(x, z); facPut('iron', x, g + 1.6, z, 0.07, 3.2, 0.07, 0); post(x, z, 0.12, -5, 3.3);
    [['N3W BOARDWALK', 3.0, 0], ['SIDESHOW ROW', 2.72, PI / 2]].forEach(([txt, y, rot]) => { const t = signTex([{ t: txt, s: 0.5 }], 1024, 160, '#1f6b46', '#ffffff'); const m = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.2), new THREE.MeshStandardMaterial({ map: t, roughness: 0.45, side: THREE.DoubleSide })); m.position.set(x, g + y, z); m.rotation.y = a + PI / 2 + rot; scene.add(m); }); };
  blade(223.8); blade(260.5); facFlush();
})();
window.__FRAMES.push(() => { try { if (!BWALK.glow) return; const k = Math.min(1, (L.lamps || 0) * 1.3); BWALK.glow.material.opacity = k; BWALK.glow.visible = k > 0.02; } catch (e) { } });
