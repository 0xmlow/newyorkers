/* ================================================================
   v347 THE STOOP SALE (2026-11-24)
   On the sidewalk beside the walk up's stoop, a Saturday stoop sale: a scanned painted table covered in scanned
   things nobody needs and everybody looks at (a cassette deck, a mantel clock, an oil lamp, binoculars, an old movie
   camera), a set of encyclopedias and a suitcase stack on the ground, an old television, a ukulele, a rocking chair
   for whoever is minding it, and a cardboard sign. Every object is a CC0 scan through the wrap tool. ?props=0 off.
   ================================================================ */
const SALE = {};
window.__SALE = SALE;
(function stoopSale() {
  if (!PH.on || !window.__BROWN) return; const x = BROWN_AT.x - 3.5 - 1.9, z = BROWN_AT.z + 1.9, g = ground(x, z), ty = g + 0.78; SALE.P = [x, g, z];
  phPlace('isl_saletable', [[x, g, z, PI / 2, 1]]);
  phPlace('isl_cassette', [[x + 0.05, ty, z - 0.55, -PI / 2 + 0.2, 1]], { shadow: false }); phPlace('isl_mclock', [[x - 0.05, ty, z - 0.1, -PI / 2, 1]], { shadow: false });
  phPlace('isl_oillamp', [[x + 0.1, ty, z + 0.3, 0, 1]], { shadow: false }); phPlace('isl_binos', [[x - 0.12, ty, z + 0.55, 0.7, 1]], { shadow: false }); phPlace('isl_vcam', [[x + 0.05, ty, z + 0.85, -PI / 2 - 0.3, 1]], { shadow: false });
  phPlace('isl_books', [[x - 0.4, g, z - 1.2, -PI / 2, 1]]); phPlace('isl_suitcase', [[x - 0.2, g, z + 1.45, PI / 2 + 0.1, 1]]); phPlace('isl_tv2', [[x - 0.6, g, z + 0.4, -PI / 2, 1]]);
  phPlace('isl_uke', [[x + 0.42, g + 0.42, z - 0.9, -PI / 2, 1]], { shadow: false }); phPlace('isl_rocker', [[x + 1.3, g, z + 0.6, -PI / 2 - 0.4, 1]]);
  const s = signTex([{ t: 'STOOP SALE', s: 0.28, f: '"Permanent Marker",cursive' }, { t: 'EVERYTHING $5', s: 0.18, f: '"Permanent Marker",cursive' }, { t: 'THE CARDS ARE FREE (CC0)', s: 0.11, f: '"Permanent Marker",cursive' }], 512, 380, '#c9a77a', '#1b1b1b');
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.52), new THREE.MeshStandardMaterial({ map: s, roughness: 0.95, side: THREE.DoubleSide })); m.position.set(x - 0.5, g + 1.02, z - 0.25); m.rotation.set(0, -PI / 2, 0.05); scene.add(m);
  post(x, z, 1.1, -5, 1);
})();
