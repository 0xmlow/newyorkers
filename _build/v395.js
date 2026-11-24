/* ================================================================
   v395 THE MEMES WALK: SEASONS AND THE START (2026-11-24)
   A brass bar cast with SZN 2, SZN 3 and so on sits in the joint before the first card of every season, so the walk
   reads like chapters; and a bronze marker on a post at the pier spoke says where to start and which way to go.
   ================================================================ */
(function memesWalkSeasons() {
  if (!window.__MWALK || !MWALK.ok) return;
  const P = MWALK.pos, brass = new THREE.MeshStandardMaterial({ color: 0xb8913e, roughness: 0.32, metalness: 0.95 });
  for (let i = 0; i < P.length; i++) { const [a, r, cd] = P[i], prev = P[i - 1]; if (i > 0 && prev[2].s === cd.s) continue;
    const am = prev && prev[1] === r && Math.abs(a - prev[0]) < 0.9 / r ? (a + prev[0]) / 2 : a - 0.42 / r;
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 256; const c = cv.getContext('2d'); const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding;
    const draw = () => { if (!c || !c.fillText || !c.rotate) return; c.fillStyle = '#9c7a33'; c.fillRect(0, 0, 64, 256); c.fillStyle = '#2a1e0c'; c.save(); c.translate(32, 128); c.rotate(-PI / 2); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '900 34px "Archivo Black",Impact,sans-serif'; c.fillText('SZN ' + cd.s, 0, 2); c.restore(); t.needsUpdate = true; };
    draw(); addEventListener('n3wfonts', () => { try { draw(); } catch (e) { } }, { once: true });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.62), new THREE.MeshStandardMaterial({ map: t, roughness: 0.35, metalness: 0.85 })); m.geometry.rotateX(-PI / 2);
    m.position.set(Math.sin(am) * r, MWALK.PY + 0.001, Math.cos(am) * r); m.rotation.y = am + PI; m.renderOrder = 3; scene.add(m); }
  // the marker at the pier spoke
  const x = 2.6, z = 43.3, g = ground(x, z), t = signTex([{ t: 'THE MEMES WALK', s: 0.24 }, { t: 'EVERY CARD, IN MINT ORDER. #1 STARTS ON THE OUTER BANK', s: 0.085 }, { t: 'AND RUNS EAST FROM THE PIER; THE INNER BANK PICKS UP AT #' + (MWALK.banks[0].n + 1) + '.', s: 0.085 }, { t: 'STAND ON ONE AND IT TELLS YOU WHOSE IT IS.', s: 0.085 }], 1024, 420, '#16233f', '#efe8da');
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.45), new THREE.MeshStandardMaterial({ map: t, roughness: 0.4, metalness: 0.2 })); m.position.set(x, g + 1.05, z); m.rotation.order = 'YXZ'; m.rotation.set(-0.35, 0, 0); scene.add(m);
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.0, 10), brass); p.position.set(x, g + 0.5, z); scene.add(p); post(x, z, 0.12, -5, 1.2);
  MWALK.sign = [x, g, z];
})();
