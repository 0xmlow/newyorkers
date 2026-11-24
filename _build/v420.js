/* ================================================================
   v420 SNOW ON THE BOARDWALK (2026-11-24)
   When it snows, the snow layer (v374) now settles on everything built this round too: N3W CUTS' roof, cornice and
   awning, the sideshow boards' headers, the zoetrope's rim, the camera obscura's new cornice.
   ================================================================ */
setTimeout(() => { try { if (!window.__SNOWL || !SNOWL.add) return; const add = SNOWL.add;
  if (window.__CUTS && CUTS.body) { add(CUTS.body.material); scene.traverse(o => { if (o.isMesh && o.material && o.material.map && o.material.side === THREE.DoubleSide && o.position.distanceTo(CUTS.body.position) < 6) add(o.material); }); }
  if (window.__SIDE) scene.traverse(o => { if (o.isMesh && o.geometry && o.geometry.type === 'BoxGeometry' && o.material && o.material.color && o.material.color.getHex() === 0x16233f) add(o.material); });
  if (window.__ZOE && ZOE.drum) ZOE.drum.traverse(o => { if (o.isMesh) add(o.material); }); } catch (e) { } }, 31000);
