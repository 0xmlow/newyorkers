/* ================================================================
   v436 THE BOARDWALK'S CREDIT PLATE (2026-11-24)
   An enamel plate on the boardwalk's first street blade post says where everything here came from, in the spirit of
   the island: ART · MLOW. CARDS · THE MEMES BY 6529, CC0. SCANNED PROPS · POLY HAVEN, CC0 (the barber chair, the
   chalkboard, the condensers, the camera, the duck, the benches, the lamps).
   ================================================================ */
(function creditPlate() { if (!window.__BWALK || !BWALK.ok) return; const a = 223.8 * PI / 180, x = Math.sin(a) * 104.9, z = Math.cos(a) * 104.9, g = ground(x, z);
  const t = signTex([{ t: 'N3W BOARDWALK', s: 0.2 }, { t: 'ART · MLOW', s: 0.09 }, { t: 'CARDS · THE MEMES BY 6529, CC0', s: 0.09 }, { t: 'SCANNED PROPS · POLY HAVEN, CC0', s: 0.09 }], 1024, 512, '#16233f', '#efe8da');
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.35), new THREE.MeshStandardMaterial({ map: t, roughness: 0.4, metalness: 0.2 })); m.position.set(x - Math.sin(a) * 0.05, g + 1.55, z - Math.cos(a) * 0.05); m.rotation.y = a + PI; scene.add(m); })();
