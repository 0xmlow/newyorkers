/* ================================================================
   v233 THE LOOK: THE BLOCK AT STREET LEVEL (2026-11-23)
   The three new buildings (v227 to v229) need a way in for the people who live upstairs. Each gets its
   residential door round the side: a black door under a lit transom with the house number, a stone surround, a
   step, a brass intercom panel, and at the kerb the black bins and tied bags that go out every night.
   ?block=0 turns it off.
   ================================================================ */
(function blockStreet() {
  if (!BLK_ON || !BLK.n) return;
  FACM.bin = FACM.bin || new THREE.MeshStandardMaterial({ color: 0x1a1b1d, roughness: 0.6 });
  FACM.brass = FACM.brass || new THREE.MeshStandardMaterial({ color: 0xb08a3e, roughness: 0.3, metalness: 0.9 });
  const binG = new THREE.CylinderGeometry(0.32, 0.27, 0.95, 14), bagG = new THREE.SphereGeometry(0.28, 10, 8), bagM = new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.25, metalness: 0.1 });
  const door = (cx, cz, nx, nz, hd, u, g, num) => { const F = facFace(cx, cz, nx, nz, hd), tx = nz, tz = -nx;
    F.at(u, g + 1.15, 0.03, 1.0, 2.2, 0.06, 'frameK'); F.at(u, g + 2.5, 0.03, 1.0, 0.36, 0.04, 'lit');
    [-0.62, 0.62].forEach(d => F.at(u + d, g + 1.4, 0.1, 0.24, 2.8, 0.2, 'stone')); F.at(u, g + 2.9, 0.14, 1.6, 0.22, 0.3, 'stone'); F.at(u, g + 3.04, 0.16, 1.7, 0.06, 0.34, 'stoneD');
    F.at(u, g + 0.08, 0.35, 1.5, 0.16, 0.6, 'stoneD'); F.at(u + 0.85, g + 1.35, 0.04, 0.16, 0.32, 0.03, 'brass'); F.at(u + 0.18, g + 1.1, 0.07, 0.04, 0.16, 0.04, 'brass');
    // the house number on the transom
    const t = signTex([{ t: String(num), s: 0.6, f: 'Georgia, serif' }], 256, 96, '#00000000', '#f2e6c8'); const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.19), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false }));
    m.position.set(cx + nx * (hd + 0.065) + tx * u, g + 2.5, cz + nz * (hd + 0.065) + tz * u); m.rotation.y = Math.atan2(nx, nz); scene.add(m);
    // bins and bags at the kerb, a little along the wall
    [[1.6, 0.6], [2.3, 0.6]].forEach(([du, dw]) => { const b = new THREE.Mesh(binG, FACM.bin); (BLK.bins = BLK.bins || []).push(b); b.position.set(cx + nx * (hd + dw) + tx * (u + du), g + 0.48, cz + nz * (hd + dw) + tz * (u + du)); b.castShadow = true; scene.add(b); post(b.position.x, b.position.z, 0.32, -5, g + 1); });
    [[2.9, 0.5, 1], [3.3, 0.7, 0.85], [3.05, 0.95, 0.9]].forEach(([du, dw, s]) => { const b = new THREE.Mesh(bagG, bagM); (BLK.bags = BLK.bags || []).push(b); b.scale.set(s, s * 0.85, s); b.position.set(cx + nx * (hd + dw) + tx * (u + du), g + 0.22 * s, cz + nz * (hd + dw) + tz * (u + du)); b.castShadow = true; scene.add(b); }); };
  try { const g = ground(17, 66) + 0.02; door(17, 66, 0, 1, 7.2, -3.0, g, 420); } catch (e) { }
  try { if (BLK.laund) door(-86, -4, 0, -1, 4, -1.3, LAUND.g0, 69); } catch (e) { }
  try { if (BLK.drop) door(-62, 80, 1, 0, 3.5, 0.7, LINE.g0, 6529); } catch (e) { }
  facFlush();
})();
