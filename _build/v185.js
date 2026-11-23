/* ================================================================
   v185 THE LOOK: ROOFTOPS (2026-11-23)
   From the water tower, the bell tower or the Ferris wheel the roofs were empty slabs. New York roofs are busy:
   condenser units with their fans, vent stacks, a roof hatch, a satellite dish, tar patches, and on the bank a
   glazed skylight over the banking hall. ?roofs=0 off.
   ================================================================ */
(function rooftops() {
  if (!FAC_ON || /roofs=0/.test(location.search)) return;
  FACM.tar = new THREE.MeshStandardMaterial({ color: 0x1d1c1b, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  FACM.sky = new THREE.MeshStandardMaterial({ color: 0x8fa9b4, roughness: 0.1, metalness: 0.5, envMapIntensity: 1.2 });
  const unit = (x, y, z, ry) => { facPut('ac', x, y + 0.42, z, 1.0, 0.84, 0.72, ry); facPut('frameK', x, y + 0.86, z, 0.62, 0.04, 0.62, ry); facPut('steel', x, y + 0.04, z, 1.1, 0.08, 0.8, ry); };
  const vent = (x, y, z, h) => { const v = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, h, 10), FACM.steel); v.position.set(x, y + h / 2, z); v.castShadow = true; scene.add(v); const c = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.16, 10), FACM.steel); c.position.set(x, y + h + 0.1, z); scene.add(c); };
  const tar = (x, y, z, w, d, ry) => facPut('tar', x, y + 0.004, z, w, 0.008, d, ry);
  if (window.__BROWN && BROWN.H) { const x0 = BROWN_AT.x, z0 = BROWN_AT.z, y = BROWN.g0 + BROWN.H + 0.05;
    unit(x0 - 1.8, y, z0 - 2.4, 0.1); unit(x0 + 0.4, y, z0 - 2.6, -0.05); vent(x0 - 2.4, y, z0 + 1.2, 0.9); vent(x0 - 0.6, y, z0 + 2.4, 0.7); facPut('frameK', x0 + 1.2, y + 0.22, z0 + 0.6, 0.95, 0.44, 0.95, 0);
    tar(x0 - 0.5, y, z0 + 0.2, 2.2, 1.4, 0.3); tar(x0 + 1.6, y, z0 - 1.6, 1.4, 0.9, -0.4);
    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 8, 0, PI * 2, 0, PI / 4), FACM.ac); dish.position.set(x0 + 2.6, y + 0.9, z0 - 3.2); dish.rotation.set(-0.9, 0.6, 0); scene.add(dish);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6), FACM.steel); arm.position.set(x0 + 2.6, y + 0.45, z0 - 3.2); scene.add(arm); }
  if (window.__WT && WT.top) { const x0 = WT_AT.x, z0 = WT_AT.z, y = WT.top + 0.31; unit(x0 - 2.5, y, z0 + 2.4, PI / 2); vent(x0 + 2.6, y, z0 + 2.6, 0.8); tar(x0 - 1.8, y, z0 - 2.0, 1.6, 1.2, 0.2); }
  try { const bg = ground(17, 66) + 0.02, y = bg + 4.85; unit(19, y, 62, 0); unit(19, y, 64.2, 0); vent(14, y, 70, 0.8); vent(15.2, y, 70.4, 0.6); tar(16, y, 67, 3, 2, 0.1); } catch (e) { }
  { const g = ground(-66, 0) + 0.02, y = g + 10 + 0.3; facPut('lime', -66, y + 0.25, 0, 6.4, 0.5, 6.4); facPut('sky', -66, y + 0.62, 0, 5.6, 0.25, 5.6);
    for (let i = -2; i <= 2; i++) { facPut('bronze', -66 + i * 1.12, y + 0.76, 0, 0.05, 0.05, 5.6); facPut('bronze', -66, y + 0.76, i * 1.12, 5.6, 0.05, 0.05); } unit(-71, y, -6, 0); unit(-71, y, 6, 0); vent(-60.5, y, -6.8, 1.0); }
  facFlush();
})();
