/* ================================================================
   v366 THE PIER BOARD LEARNS THE NEW TRICKS (2026-11-24)
   A second WHAT TO LOOK FOR panel beside v332's lists the round three tricks: the camera obscura, round or square,
   the moiré fence, the shadow checker, which eye is bigger, the stoop sale and the birthday.
   ================================================================ */
(function lookFor2() { if (!window.__LOOKFOR) return; const [x0, g, z0] = __LOOKFOR.P, x = x0 + 1.75, z = z0 + 0.6;
  const rows = ['CAMERA OBSCURA · STEP INSIDE THE NAVY HUT', 'ROUND OR SQUARE · TWO SETS OF FOOTPRINTS', 'THE MOIRÉ FENCE · WALK ALONG IT', 'THE SHADOW CHECKER · TILE A AND TILE B', 'WHICH EYE IS BIGGER · BY THE WEST SPOKE', 'THE STOOP SALE · BY THE WALK UP', 'A BIRTHDAY · ON THE EAST LAWN'];
  const t = signTex([{ t: 'AND ALSO', s: 0.08 }].concat(rows.map(r => ({ t: r, s: 0.035, b: false }))), 1024, 1000, '#16233f', '#efe8da');
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.37), new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 })); m.position.set(x, g + 1.4, z); m.rotation.y = PI + 0.35; scene.add(m);
  facPut('iron', x - Math.sin(PI + 0.35) * 0.04, g + 1.4, z - Math.cos(PI + 0.35) * 0.04, 1.5, 1.47, 0.05, PI + 0.35); facPut('iron', x, g + 0.35, z + 0.03, 0.1, 0.7, 0.1, 0); facFlush(); post(x, z, 0.3, -5, 2.5); })();
