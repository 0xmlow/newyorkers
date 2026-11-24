/* ================================================================
   v392 HOW THE BOARDWALK TRICKS WORK (2026-11-24)
   Plaques (the v282 design) for the barber pole and the infinite barbershop at N3W CUTS, and for the floating
   crosswalk at its footprints; the magic eye and the zoetrope carry their own. A third WHAT TO LOOK FOR panel at the
   pier lists all five.
   ================================================================ */
(function plaques4() {
  const mk = (x, z, ry, title, l1, l2) => { const t = signTex([{ t: title, s: 0.26 }, { t: l1, s: 0.1 }, { t: l2, s: 0.1 }], 1024, 384, '#16233f', '#efe8da'); const g = ground(x, z);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.375), new THREE.MeshStandardMaterial({ map: t, roughness: 0.5, metalness: 0.15 })); m.position.set(x, g + 1.05, z); m.rotation.y = ry; m.rotation.x = -0.35; scene.add(m); facPut('iron', x, g + 0.5, z, 0.06, 1.0, 0.06, ry); post(x, z, 0.12, -5, 1.2); };
  FACM.iron = FACM.iron || new THREE.MeshStandardMaterial({ color: 0x1d2b24, roughness: 0.55, metalness: 0.5 });
  try { if (window.__CUTS && CUTS.ok) { const [x, z] = CUTS.at(-CUTS.W / 2 - 0.6, CUTS.D / 2 + 2.4); mk(x, z, CUTS.ry, 'THE INFINITE BARBERSHOP', 'THERE IS NO ROOM BEHIND THE GLASS. A SHADER TRACES', 'YOUR VIEW INTO IT AND FOLDS IT BETWEEN TWO MIRRORS.');
    const [x2, z2] = CUTS.at(-CUTS.W / 2 - 1.8, CUTS.D / 2 + 1.0); mk(x2, z2, CUTS.ry, 'THE BARBER POLE', 'THE STRIPES ONLY GO ROUND. A STRIPE SEEN IN A SLOT', 'CAN ONLY SHOW MOTION ACROSS IT, SO IT CLIMBS.'); } } catch (e) { }
  try { if (window.__XW3 && XW3.ok) { const [x, , z] = XW3.V; mk(x + 1.3, z + 0.3, PI, 'THE FLOATING CROSSWALK', 'STAND ON THE FOOTPRINTS. THE SLABS ARE PAINT, PROJECTED', 'FROM YOUR EYE ONTO THE ROAD. STEP OFF AND THEY MELT.'); } } catch (e) { }
  facFlush();
  try { if (window.__LOOKFOR) { const [x0, g, z0] = __LOOKFOR.P, x = x0 - 1.75, z = z0 + 0.6;
    const rows = ['N3W CUTS · THE WEST BEACH, ACROSS THE ROAD', 'THE INFINITE BARBERSHOP · LOOK IN THE WINDOW', 'THE BARBER POLE · WHICH WAY IS IT GOING', 'MAGIC EYE · THE SHOP\'S SOUTH WALL', 'THE ZOETROPE · BESIDE THE SHOP', 'THE FLOATING CROSSWALK · THE NORTH KERB', 'THE MEMES WALK · BOTH BANKS OF THE RIVER'];
    const t = signTex([{ t: 'AND NOW', s: 0.08 }].concat(rows.map(r => ({ t: r, s: 0.035, b: false }))), 1024, 1000, '#16233f', '#efe8da');
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.37), new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 })); m.position.set(x, g + 1.4, z); m.rotation.y = PI - 0.35; scene.add(m);
    facPut('iron', x - Math.sin(PI - 0.35) * 0.04, g + 1.4, z - Math.cos(PI - 0.35) * 0.04, 1.5, 1.47, 0.05, PI - 0.35); facPut('iron', x, g + 0.35, z + 0.03, 0.1, 0.7, 0.1, 0); facFlush(); post(x, z, 0.3, -5, 2.5); } } catch (e) { }
})();
