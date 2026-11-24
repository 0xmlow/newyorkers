/* ================================================================
   v343 THE NEW MURALS ARE SIGNED (2026-11-24)
   v330's MLOW 2026 signature reaches the murals painted since: the factory, the vault, the lighthouse back, the
   market boards.
   ================================================================ */
(function signAgain() {
  if (!window.__WALLS || !WALLS.on) return; const t = signTex([{ t: 'MLOW', s: 0.55, f: '"Permanent Marker",cursive' }, { t: '2026', s: 0.22, f: '"Permanent Marker",cursive' }], 256, 160, '#00000000', '#efe8da');
  const mat = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 });
  scene.traverse(o => { if (!o.isMesh || !o.material || !o.material.userData || !o.material.userData.wall || o.geometry.type !== 'PlaneGeometry' || o.userData.__signed) return; const p = o.geometry.parameters; if (p.height < 2 || Math.abs(o.rotation.x) > 0.1) return; o.userData.__signed = 1;
    const s = Math.min(1.2, p.width * 0.08), m = new THREE.Mesh(new THREE.PlaneGeometry(s, s * 0.625), mat); m.position.copy(o.position); m.quaternion.copy(o.quaternion); m.translateX(p.width / 2 - s * 0.7); m.translateY(-p.height / 2 + s * 0.5); m.translateZ(0.015); m.renderOrder = 6; scene.add(m); });
})();
