/* ================================================================
   v240 REAL PROPS: THE STREET (2026-11-23)
   More of the coded street furniture gives way to the scanned, re-skinned CC0 set:
   - the bins and black bags at the three tenement doors (v233) are a real dented can in the island's navy with a
     N3W SANITATION plate, and real knotted bin bags;
   - the chairs along the laundromat window are moulded monobloc chairs in laundromat orange;
   - planters with an Open Eye Flower on the front flank the laundromat door and the bodega's side door;
   - wooden crates with a 6529 card pasted on stand by the bodega, a utility box with The Institutions Are Coming
     wheatpasted on it by the handball court and the skate plaza;
   - two red navigation buoys mark the channel either side of the pier.
   ?props=0 brings the old ones back.
   ================================================================ */
(function streetCC0() {
  if (!PH.on) return; const R = (a, b) => a + Math.random() * (b - a);
  try { if (BLK.bins && BLK.bins.length) { phPlace('isl_bin', BLK.bins.map(b => [b.position.x, b.position.y - 0.48, b.position.z, R(0, 6.28), 0.95])).then(ims => { if (ims.length) BLK.bins.forEach(b => b.visible = false); }); } } catch (e) { }
  try { if (BLK.bags && BLK.bags.length) { phPlace('isl_trashbag', BLK.bags.map(b => [b.position.x, b.position.y - 0.22 * b.scale.x, b.position.z, R(0, 6.28), 1.2 * b.scale.x])).then(ims => { if (ims.length) BLK.bags.forEach(b => b.visible = false); }); } } catch (e) { }
  try { if (window.__LIN && LIN.chairs) phPlace('isl_monobloc', LIN.chairs.map(c => [c[0], c[1] + 0.02, c[2], c[3] + R(-0.12, 0.12), 0.95])); } catch (e) { }
  const planters = [], crates = [], util = [];
  try { if (window.__LAUND) { const g = LAUND.g0; planters.push([-82.7, g, -7.3, PI / 2], [-82.7, g, -0.7, PI / 2]); } } catch (e) { }
  try { const g = ground(17, 66) + 0.02; planters.push([12.9, g, 73.75, 0]); crates.push([11.0, g, 58.6, -PI / 2 + 0.2], [11.1, g + 0.35, 58.7, -PI / 2 - 0.1], [10.9, g, 59.5, -PI / 2]); } catch (e) { }
  try { if (window.__HB2 && HB2.L2W) { const [x, z] = HB2.L2W(4.9, 10.4); util.push([x, ground(x, z), z, WALLP.ry]); } } catch (e) { }
  try { if (window.__SK) { const [x, z] = SK.L2W(9.4, -4.4); util.push([x, ground(x, z), z, SK.ry - PI / 2]); } } catch (e) { }
  phPlace('isl_planter', planters); phPlace('isl_crate', crates); phPlace('isl_utility', util);
  [[-13, 150], [13, 150]].forEach(([x, z]) => phPlace('isl_buoy', [[x, -0.9, z, R(0, 6.28), 1.1]], { shadow: false }).then(ims => ims.forEach(im => (window.__BUOYS2 = window.__BUOYS2 || []).push(im))));
  // the buoys ride the swell
  window.__FRAMES.push(() => { try { (window.__BUOYS2 || []).forEach((im, i) => { im.position.y = Math.sin(LIFE.t * 0.9 + i) * 0.12; im.rotation.z = Math.sin(LIFE.t * 0.7 + i * 2) * 0.05; }); } catch (e) { } });
})();
