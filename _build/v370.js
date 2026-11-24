/* ================================================================
   v370 REALISM: WORN THRESHOLDS (2026-11-24)
   Where people walk in and out the ground wears: a dark polished patch at the foot of every new tenement door, the
   bodega's door, the laundromat's and the DROP shop's, the obscura's and the hardware store's.
   ================================================================ */
(function thresholds() {
  if (!LOOK.on || !window.__CSH || !CSH.mat) return; const L = [], add = (x, z, w, d, r) => L.push([x, ground(x, z) + 0.015, z, w, d, r || 0]);
  add(14, 73.9, 1.6, 0.9); add(11.2, 66, 1.4, 1.8); try { if (BLK.laund) add(-84.7, -8.6, 1.4, 0.9); } catch (e) { } try { if (BLK.drop) add(-57.9, 80.7, 0.9, 1.4); } catch (e) { }
  add(-84.7, -4, 1.6, 3.8); add(-62, 77.5, 2.4, 1.4); try { if (OBS.P) add(OBS.P[0] + 1.9, OBS.P[2], 1.2, 1.4); } catch (e) { } try { add(WT_AT.x + 3.4, WT_AT.z + 4.6, 2.2, 1.2); } catch (e) { }
  const im = new THREE.InstancedMesh(CSH.geo, CSH.mat, L.length), o = new THREE.Object3D(); L.forEach(([x, y, z, w, d, r], i) => { o.position.set(x, y, z); o.rotation.set(0, r, 0); o.scale.set(w, 1, d); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); im.renderOrder = 3; scene.add(im);
})();
