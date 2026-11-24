/* ================================================================
   v419 THE NEW WALLS ARE SIGNED, AND SIT DOWN (2026-11-24)
   The murals painted on since v330 signed the others (N3W CUTS' sea wall and ghost sign, the camera obscura's boards,
   the sideshow backs) get the same small MLOW 2026 in bone paint, bottom right. And the shop, the five sideshow
   boards and the zoetrope get soft contact shadows where they meet the sand, like the scanned props (v367).
   ================================================================ */
(function signAndSit() {
  try { if (window.__WALLS && WALLS.on) { const t = signTex([{ t: 'MLOW', s: 0.55, f: '"Permanent Marker",cursive' }, { t: '2026', s: 0.22, f: '"Permanent Marker",cursive' }], 256, 160, '#00000000', '#efe8da');
    const mat = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 }); let n = 0;
    scene.traverse(o => { if (!o.isMesh || !o.material || !o.material.userData || !o.material.userData.wall || o.geometry.type !== 'PlaneGeometry' || o.userData.__signed) return; const p = o.geometry.parameters; if (p.height < 2 || Math.abs(o.rotation.x) > 0.1) return; o.userData.__signed = 1; n++;
      const s = Math.min(1.2, p.width * 0.08), m = new THREE.Mesh(new THREE.PlaneGeometry(s, s * 0.625), mat); m.position.copy(o.position); m.quaternion.copy(o.quaternion); m.translateX(p.width / 2 - s * 0.7); m.translateY(-p.height / 2 + s * 0.5); m.translateZ(0.015); m.renderOrder = 6; scene.add(m); });
    WALLS.signed2 = n; } } catch (e) { }
  try { const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; const c = cv.getContext('2d'); if (!c || !c.createRadialGradient) return;
    const gr = c.createRadialGradient(32, 32, 4, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(0.55, 'rgba(0,0,0,.28)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64);
    const mat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5 });
    const put = (x, z, w, d, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.order = 'YXZ'; m.rotation.set(-PI / 2, ry, 0); m.position.set(x, ground(x, z) + 0.015, z); m.renderOrder = 3; scene.add(m); };
    if (window.__CUTS && CUTS.ok) put(CUTS.c[0], CUTS.c[2], CUTS.W + 1.4, CUTS.D + 1.4, CUTS.ry);
    if (window.__SIDE) SIDE.list.forEach(B => put(B.x, B.z, 2.9, 0.9, B.ry));
    if (window.__ZOE && ZOE.ok) put(ZOE.P[0], ZOE.P[2], 1.0, 1.0, 0); } catch (e) { }
})();
