/* ================================================================
   v359 ILLUSION: THE MOIRÉ FENCE (2026-11-24)
   Along the skate plaza's sea edge, a fence of two layers of fine navy slats thirty centimetres apart. Standing still
   it is a fence. Walk along it and broad dark waves sweep through it faster than you walk, bending as you change
   distance: moiré, the interference of two fine gratings. ?moire=0 off.
   ================================================================ */
(function moire() {
  if (!LOOK.on || /moire=0/.test(location.search) || !window.__SK) return; const L = 9, H = 1.6, n = 150, im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.022, H, 0.012), new THREE.MeshStandardMaterial({ color: 0x16233f, roughness: 0.5, metalness: 0.4 }), n * 2), o = new THREE.Object3D(); let k = 0;
  [[0, 0.06], [0.3, 0.0645]].forEach(([dv, pitch]) => { for (let i = 0; i < n; i++) { const u = -L / 2 + i * pitch * (L / (n * 0.06)) * 0.06 / pitch * pitch / 0.06; const uu = -L / 2 + i * pitch; if (uu > L / 2) continue; const [x, z] = SK.L2W(uu, -6.2 - dv); o.position.set(x, SK.g0 + H / 2 + 0.05, z); o.rotation.set(0, SK.ry, 0); o.updateMatrix(); im.setMatrixAt(k++, o.matrix); } });
  im.count = k; im.castShadow = true; scene.add(im); try { cullBound(im); } catch (e) { }
  const [ax, az] = SK.L2W(-L / 2, -6.35), [bx, bz] = SK.L2W(L / 2, -6.35); wall(ax, az, bx, bz, -5, SK.g0 + H);
  window.__MOIRE = { ok: true, P: SK.L2W(0, -6.35) };
})();
