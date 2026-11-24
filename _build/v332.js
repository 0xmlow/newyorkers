/* ================================================================
   v332 WHAT TO LOOK FOR (2026-11-24)
   At the pier landing, beside the credits, a navy enamel board in the island's livery lists what is hidden on the
   island: the meme river and its well, fourteen illusions with a line each on where to stand, the painted walls and
   tanks, and THE CREDITS, so a first visitor knows the island is worth walking. The map has every one of them.
   ================================================================ */
(function lookFor() {
  const rows = ['FOLLOW THE MEME RIVER FROM HERE TO THE FLOOR', 'THE EYE FROM ONE SPOT · STAND ON THE BLUE FOOTPRINTS', 'THE IMPOSSIBLE TRIANGLE · FOOTPRINTS ON THE RING', 'THE HOLLOW EYE · WALK PAST IT', 'THE WELL · LOOK DOWN', 'THE CARD THAT STANDS UP · THE EYE ON THE COURT', 'THE DOOR TO NOWHERE · LOOK THROUGH IT', 'THE LENTICULAR · WALK PAST IT', 'THE AMES WINDOW · WATCH IT TURN', 'THE MIRROR CYLINDER · LOOK INTO THE STEEL', 'THE DISC THAT TURNS · LOOK BESIDE IT', 'THE WALL THAT LEANS · ON THE LAUNDROMAT', 'THE LILAC CHASER · STARE AT THE CROSS', 'SEE THE TRUE COLOURS · STARE, THEN LOOK', 'THE PAINTED WALLS, ROOFS AND TANKS · LOOK UP', 'OPEN THE MAP (M) TO GO STRAIGHT THERE'];
  const t = signTex([{ t: 'WHAT TO LOOK FOR', s: 0.07 }].concat(rows.map(r => ({ t: r, s: 0.026, b: false }))), 1024, 1400, '#16233f', '#efe8da');
  const x = -6.5, z = 109.5, g = ground(x, z), m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.2), new THREE.MeshStandardMaterial({ map: t, roughness: 0.5, metalness: 0.1 })); m.position.set(x, g + 1.55, z); m.rotation.y = PI + 0.35; scene.add(m);
  FACM.iron = FACM.iron || new THREE.MeshStandardMaterial({ color: 0x122039, roughness: 0.55, metalness: 0.5 }); facPut('iron', x - Math.sin(PI + 0.35) * 0.04, g + 1.55, z - Math.cos(PI + 0.35) * 0.04, 1.72, 2.32, 0.05, PI + 0.35); facPut('iron', x, g + 0.25, z + 0.03, 0.1, 0.5, 0.1, 0); facFlush(); post(x, z, 0.3, -5, 3);
  window.__LOOKFOR = { P: [x, g, z] };
})();
