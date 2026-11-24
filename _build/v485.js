/* ================================================================
   v485 THE ILLUSION BEACH'S CREDIT PLATE (2026-11-24)
   An enamel plate on the gate's left post says whose ideas these are: Richard Gregory's hollow mask, the Beuchet
   chair, Kanizsa 1955, Necker 1832, Ponzo 1911, Zöllner 1860, Fraser 1908, Shepard 1964 (at the barber pole), the
   wagon wheel, and the scans: Poly Haven, CC0. ART · MLOW.
   ================================================================ */
(function eastCredit() {
  if (!window.__EASTB) return; const P = eastAt(33, 112.5), x = P.x + P.tx * -2.1 + P.nx * 0.09, z = P.z + P.tz * -2.1 + P.nz * 0.09;
  const t = signTex([{ t: 'N3W ILLUSION BEACH', s: 0.17 }, { t: 'ART · MLOW', s: 0.075 }, { t: 'GREGORY · BEUCHET · KANIZSA 1955 · NECKER 1832', s: 0.06 }, { t: 'PONZO 1911 · ZÖLLNER 1860 · FRASER 1908 · SHEPARD 1964', s: 0.06 }, { t: 'HEAD, CHAIR, LAMPS, BENCHES · POLY HAVEN, CC0', s: 0.06 }], 1024, 512, '#16233f', '#efe8da');
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), new THREE.MeshStandardMaterial({ map: t, roughness: 0.4, metalness: 0.2 })); m.position.set(x, P.g + 1.55, z); m.rotation.y = P.ry; scene.add(m);
})();
