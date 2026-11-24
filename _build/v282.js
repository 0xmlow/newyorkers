/* ================================================================
   v282 HOW THE TRICKS WORK (2026-11-23)
   Each illusion gets a small navy enamel plaque in the island's livery, at hand height, saying in two lines what is
   going on, so nobody leaves thinking it was a glitch: the eye from one spot, the hollow eye, the impossible
   triangle, the well, the card that stands up, the disc that turns, the wall that leans.
   ================================================================ */
(function trickPlaques() {
  const mk = (x, z, ry, title, l1, l2) => { const t = signTex([{ t: title, s: 0.26 }, { t: l1, s: 0.1 }, { t: l2, s: 0.1 }], 1024, 384, '#16233f', '#efe8da'); const g = ground(x, z);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.375), new THREE.MeshStandardMaterial({ map: t, roughness: 0.5, metalness: 0.15 })); m.position.set(x, g + 1.05, z); m.rotation.y = ry; m.rotation.x = -0.35; scene.add(m);
    facPut('iron', x - Math.sin(ry) * 0.05, g + 0.5, z - Math.cos(ry) * 0.05, 0.06, 1.0, 0.06, ry); post(x, z, 0.12, -5, 1.2); };
  const face = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
  try { if (window.__ANA && ANA.V) { const x = ANA.V.x - 1.2, z = ANA.V.z - 0.4; mk(x, z, face(x, z, ANA.V.x - 4, ANA.V.z - 4), 'THE EYE FROM ONE SPOT', 'PAINT ON TWENTY THINGS AT TWENTY DISTANCES.', 'FROM THE FOOTPRINTS IT IS ONE FLAT EYE.'); } } catch (e) { }
  try { if (window.__PEN && PEN.V) { const x = PEN.V.x + 1.1, z = PEN.V.z + 0.6; mk(x, z, face(x, z, 0, 0) + PI, 'THE IMPOSSIBLE TRIANGLE', 'THREE BEAMS THAT NEVER TOUCH.', 'FROM THE FOOTPRINTS THE GAP HIDES BEHIND ITSELF.'); } } catch (e) { }
  try { if (window.__WELL && WELL.P) { const [x0, , z0] = WELL.P; mk(x0 + 2.2, z0 + 1.6, face(x0 + 2.2, z0 + 1.6, x0 + 6, z0 + 6), 'THE WELL', 'A FLAT DISC. A SHADER WORKS OUT WHAT', 'A SHAFT BELOW IT WOULD SHOW YOUR EYE.'); } } catch (e) { }
  try { if (window.__STAND && STAND.V) { const V = STAND.V; mk(V.x + 0.9, V.z + 0.2, face(V.x, V.z, STAND.Q.x, STAND.Q.z) + PI, 'THE CARD THAT STANDS UP', 'PAINTED FLAT ON THE ASPHALT, STRETCHED.', 'FROM THE EYE AT YOUR FEET IT STANDS.'); } } catch (e) { }
  try { if (window.__SNAKE && SNAKE.ok) { const [x0, , z0] = SNAKE.P; mk(x0 + 2.6, z0 + 1.4, face(x0, z0, 0, 0) + PI, 'THE DISC THAT TURNS', 'NOTHING MOVES. THE ORDER OF THE COLOURS', 'TELLS THE EDGE OF YOUR EYE THAT IT DOES.'); } } catch (e) { }
  try { if (window.__CAFE) mk(-83.6, 0.9, PI * 0.25, 'THE WALL THAT LEANS', 'EVERY ROW IS LEVEL. THE GREY MORTAR', 'AND THE HALF TILE SHIFT BEND THEM.'); } catch (e) { }
  facFlush();
})();
