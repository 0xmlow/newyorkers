/* ================================================================
   v362 HOW THE NEWEST TRICKS WORK (2026-11-24)
   Plaques (v282 design) and map entries for the camera obscura, round from here square from there, the moiré fence,
   the shadow checker and which eye is bigger, and the WHAT TO LOOK FOR board learns them (by name on the map).
   ================================================================ */
(function plaques3() {
  const mk = (x, z, ry, title, l1, l2) => { const t = signTex([{ t: title, s: 0.26 }, { t: l1, s: 0.1 }, { t: l2, s: 0.1 }], 1024, 384, '#16233f', '#efe8da'); const g = ground(x, z);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.375), new THREE.MeshStandardMaterial({ map: t, roughness: 0.5, metalness: 0.15 })); m.position.set(x, g + 1.05, z); m.rotation.y = ry; m.rotation.x = -0.35; scene.add(m); facPut('iron', x, g + 0.5, z, 0.06, 1.0, 0.06, ry); post(x, z, 0.12, -5, 1.2); };
  const map = (n, p, dx, dz) => { if (window.__MAP && MAP.places && p) MAP.places.push([n, p[0], p[2], p[0] + dx, p[2] + dz]); };
  try { if (OBS.ok) { const [x, , z] = OBS.P; mk(x + 2.4, z + 1.9, PI / 2, 'CAMERA OBSCURA', 'A PINHOLE IN THE SEA WALL THROWS THE', 'HARBOUR ONTO THE BACK WALL, UPSIDE DOWN.'); map('CAMERA OBSCURA', OBS.P, 4, 0); } } catch (e) { }
  try { if (AMB.ok) { const [x, , z] = AMB.P; mk(x + 1.9, z - 2.2, 0, 'ROUND FROM HERE, SQUARE FROM THERE', 'ONE SHAPE. ITS EDGE IS SOLVED TO LOOK LIKE', 'A CIRCLE FROM ONE SIDE, A SQUARE FROM THE OTHER.'); map('ROUND OR SQUARE', AMB.P, 0, -3); } } catch (e) { }
  try { if (window.__MOIRE) { const [x, z] = __MOIRE.P; mk(x + 1.5, z + 1.8, SK.ry + PI, 'THE MOIRÉ FENCE', 'TWO LAYERS OF FINE SLATS, A HAIR APART IN PITCH.', 'WALK ALONG IT AND THE WAVES RUN.'); map('THE MOIRÉ FENCE', [x, 0, z], 2, 2); } } catch (e) { }
  try { if (window.__ADEL) { const [x, , z] = __ADEL.P; mk(x + 1.9, z - 1.6, PI / 2, 'THE SHADOW CHECKER', 'TILE A AND TILE B ARE THE SAME PAINT.', 'YOUR EYE SUBTRACTS THE SHADOW.'); map('THE SHADOW CHECKER', __ADEL.P, 3, 0); } } catch (e) { }
  try { if (window.__EBB) { const [x, , z] = __EBB.P; mk(x + 1.6, z + 1.9, PI / 2, 'WHICH EYE IS BIGGER', 'BOTH CENTRE EYES ARE THE SAME SIZE.', 'THE COMPANY THEY KEEP CHANGES THEM.'); map('WHICH EYE IS BIGGER', __EBB.P, 3, 0); } } catch (e) { }
  facFlush();
})();
