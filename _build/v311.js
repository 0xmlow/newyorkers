/* ================================================================
   v311 HOW THE NEW TRICKS WORK (2026-11-24)
   Plaques (v282's design) and map entries for the lenticular, the Ames window, the door to nowhere and the mirror
   cylinder.
   ================================================================ */
(function trickPlaques2() {
  const mk = (x, z, ry, title, l1, l2) => { const t = signTex([{ t: title, s: 0.26 }, { t: l1, s: 0.1 }, { t: l2, s: 0.1 }], 1024, 384, '#16233f', '#efe8da'); const g = ground(x, z);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.375), new THREE.MeshStandardMaterial({ map: t, roughness: 0.5, metalness: 0.15 })); m.position.set(x, g + 1.05, z); m.rotation.y = ry; m.rotation.x = -0.35; scene.add(m); facPut('iron', x, g + 0.5, z, 0.06, 1.0, 0.06, ry); post(x, z, 0.12, -5, 1.2); };
  const map = (n, x, z, tx, tz) => { if (window.__MAP && MAP.places) MAP.places.push([n, x, z, tx, tz]); };
  try { if (LENT.ok) { const [x, , z] = LENT.P; mk(x + 2.8, z + 1.2, 0, 'THE LENTICULAR', 'TWO CARDS CUT INTO STRIPS AND INTERLEAVED.', 'YOUR ANGLE PICKS WHICH ONE YOU SEE.'); map('THE LENTICULAR', x, z, x, z + 6); } } catch (e) { }
  try { if (AMES.ok) { const [x, , z] = AMES.P; mk(x + 2.2, z + 1.6, PI * 0.75, 'THE AMES WINDOW', 'IT TURNS ALL THE WAY ROUND. THE TRAPEZOID', 'MAKES YOUR EYE SEE IT SWING BACK AND FORTH.'); map('THE AMES WINDOW', x, z, x + 5, z + 4); } } catch (e) { }
  try { if (DOORN.ok) { const [x, , z] = DOORN.P; mk(x + 1.2, z + 1.6, PI / 2, 'THE DOOR TO NOWHERE', 'A FLAT PANEL. A SHADER TRACES YOUR VIEW', 'DOWN A CORRIDOR THAT IS NOT THERE.'); map('THE DOOR TO NOWHERE', x, z, x + 5, z); } } catch (e) { }
  try { if (CYL.ok) { const [x, , z] = CYL.P; mk(x + 1.1, z - 0.9, POET.ry, 'THE MIRROR CYLINDER', 'THE SMEAR ON THE TABLE IS AN EYE FLOWER', 'WARPED SO THE STEEL CYLINDER UNWARPS IT.'); map('THE MIRROR CYLINDER', x, z, x + 2, z + 2); } } catch (e) { }
  facFlush();
})();
