/* ================================================================
   v410 N3W CUTS: THE SIDEWALK (2026-11-24)
   Real scanned things out front of the barbershop (Poly Haven, CC0, through the wrap tool): a tufted barber chair
   brought out onto the boardwalk for the shave with a view, a chalkboard A frame by the door with today's prices
   in chalk, and a security camera on the corner watching the door. ?props=0 off.
   ================================================================ */
(function cutsSidewalk() {
  if (!window.__CUTS || !CUTS.ok || !window.__PH || !PH.on) return;
  const g = CUTS.g, ry = CUTS.ry, w = CUTS.win, d = CUTS.door, D2 = CUTS.D / 2;
  const [bx, bz] = CUTS.at(w.u - 1.0, D2 + 1.75); phPlace('isl_barberchair', [[bx, g, bz, ry + 0.35, 1.0]]); post(bx, bz, 0.45, -5, g + 1.3);
  const [cx, cz] = CUTS.at(d.u + 0.15, D2 + 1.55); phPlace('isl_chalk', [[cx, g, cz, ry, 1.0]]).then(ims => { try { phLoad('isl_chalk').then(A => {
      const t = signTex([{ t: 'N3W CUTS', s: 0.16, f: '"Permanent Marker", cursive' }, { t: 'FADE  25', s: 0.12, f: '"Permanent Marker", cursive' }, { t: 'SHAVE  20', s: 0.12, f: '"Permanent Marker", cursive' }, { t: 'HOT TOWEL  FREE', s: 0.09, f: '"Permanent Marker", cursive' }, { t: 'THE CARDS CHANGE ON THE HOUR', s: 0.06, f: '"Permanent Marker", cursive' }], 512, 720, '#1d2321', '#eeeae0');
      const h = A.size.y, wd = Math.min(A.size.x, A.size.z) > 0.3 ? A.size.x : A.size.x, pw = wd * 0.74, ph = h * 0.5;
      [1, -1].forEach(sd => { const m = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, transparent: true, opacity: 0.96 })); m.rotation.order = 'YXZ'; m.rotation.set(-Math.atan2(A.size.z * 0.5, h), ry + (sd < 0 ? PI : 0), 0);
        const off = A.size.z * 0.5 * (1 - 0.58) + 0.07; m.position.set(cx + CUTS.n[0] * sd * off, g + h * 0.58, cz + CUTS.n[1] * sd * off); scene.add(m); CUTS['chalk' + sd] = m; }); }); } catch (e) { } });
  post(cx, cz, 0.35, -5, g + 1.2);
  const [kx, kz] = CUTS.at(CUTS.W / 2 - 0.15, D2 + 0.18); phPlace('isl_seccam', [[kx, g + 3.25, kz, ry + PI * 0.75, 1.0]], { shadow: false });
  CUTS.side = true;
})();
