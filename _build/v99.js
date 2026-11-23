/* ================================================================
   v99 GONE FISHING (2026-11-22)
   Two old men fish off the end of the pier with long rods, a bucket and a radio, lines out, floats bobbing. Now
   and then one of them reels something in. E at the end of the pier casts your own line: wait for the float to
   dip, and see what the harbour gives you (a striper, a shopping trolley wheel, a boot, a bottle with a JPEG in it,
   and once in a while a Meme card, soaking wet). The first catch counts.
   ================================================================ */
const FISH = { m: [], wait: 0, cast: false };
window.__FISH = FISH;
(function fishing() {
  const deck = 0.55, rodM = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.4, metalness: 0.4 }), lineM = new THREE.LineBasicMaterial({ color: 0xdddddd, transparent: true, opacity: 0.6 });
  [[-2.2, 180.5, 0x3b4a5c], [2.3, 179.5, 0x7a1f2a]].forEach(([x, z, sh], i) => { const p = person(sh, 0x2a2f45, SKIN[(i * 3 + 2) % SKIN.length], i ? 'wiseguy' : 'cabbie'); p.g.position.set(x, deck - 0.35, z); p.g.rotation.y = x < 0 ? -0.5 : 0.5;
    const tip = new THREE.Vector3(x + (x < 0 ? -1.3 : 1.3), deck + 3.0, z + 2.6), base = new THREE.Vector3(x + (x < 0 ? -0.2 : 0.2), deck + 1.1, z + 0.35); const d = new THREE.Vector3().subVectors(tip, base), L = d.length();
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.02, L, 6), rodM); rod.position.copy(base).addScaledVector(d, 0.5); rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); scene.add(rod);
    const floatM = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3020 })); const fp = new THREE.Vector3(tip.x + (x < 0 ? -1.5 : 1.5), 0.1, tip.z + 4); floatM.position.copy(fp); scene.add(floatM);
    const lg = new THREE.BufferGeometry().setFromPoints([tip, fp]); const line = new THREE.Line(lg, lineM); scene.add(line);
    FISH.m.push({ p, floatM, fp, tip, line, next: 20 + Math.random() * 40, reel: 0 }); });
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.3, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0xe9e4da, roughness: 0.7, side: THREE.DoubleSide })); bucket.position.set(-1.4, deck + 0.15, 179.6); scene.add(bucket);
  // your line, hidden until you cast
  const yl = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), lineM); yl.visible = false; scene.add(yl); FISH.yl = yl;
  const yf = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3020 })); yf.visible = false; scene.add(yf); FISH.yf = yf;
  interact(0, 180.5, 1.8, 'E · CAST A LINE', () => fishCast());
  if (window.__MAP) MAP.places.push(['GONE FISHING', 0, 181, null, null]);
})();
const fishSecret = secret('fishing', () => { }, []);
const FISH_CATCH = ['A STRIPED BASS, ABOUT THIS BIG. YOU LET IT GO. IT LOOKS RELIEVED.', 'ONE WHEEL OFF A SHOPPING TROLLEY. THE REST IS DOWN THERE SOMEWHERE.', 'A BOOT. SIZE ELEVEN. LEFT.', 'A BOTTLE WITH A JPEG IN IT. THE JPEG IS A SCREENSHOT. PROVENANCE: UNCLEAR.', 'A BLUE CRAB. IT IS VERY ANGRY. YOU PUT IT BACK FAST.', 'SEAWEED, AND A METROCARD WITH TWO DOLLARS ON IT.', 'NOTHING. THE BAIT IS GONE. THE HARBOUR SAYS THANKS.'];
function fishCast() { if (FISH.cast) { toast('YOUR LINE IS ALREADY OUT. WATCH THE FLOAT.'); return; } FISH.cast = true; FISH.wait = 4 + Math.random() * 7; FISH.bite = 0; const tip = new THREE.Vector3(P.x, 2.6, P.z + 1.2), fp = new THREE.Vector3(P.x + (Math.random() - 0.5) * 3, 0.1, P.z + 7); FISH.ytip = tip; FISH.yfp = fp;
  FISH.yl.geometry.setFromPoints([tip, fp]); FISH.yl.visible = FISH.yf.visible = true; FISH.yf.position.copy(fp); toast('YOU CAST. THE FLOAT LANDS. NOW YOU WAIT, LIKE EVERYONE ELSE ON THIS PIER.'); }
function fishFrame(dt) {
  if (P.z < 120) return;
  FISH.m.forEach(f => { f.next -= dt; const bob = Math.sin(LIFE.t * 1.7 + f.fp.x) * 0.04; let y = 0.1 + bob; if (f.next < 2 && f.next > 0) y -= Math.abs(Math.sin(LIFE.t * 14)) * 0.08; if (f.next <= 0) { f.next = 30 + Math.random() * 60; f.reel = 1.4; if (Math.hypot(P.x - f.fp.x, P.z - f.fp.z) < 25) toast('ONE OF THE OLD MEN REELS SOMETHING IN, LOOKS AT IT, THROWS IT BACK.'); }
    if (f.reel > 0) { f.reel -= dt; y += Math.sin(f.reel * 8) * 0.06; } f.floatM.position.y = y; const a = f.line.geometry.attributes.position; a.setY(1, y); a.needsUpdate = true; });
  if (FISH.cast) { FISH.wait -= dt; let y = 0.1 + Math.sin(LIFE.t * 1.9) * 0.04; if (FISH.wait < 1.5) y -= Math.abs(Math.sin(LIFE.t * 16)) * 0.1; FISH.yf.position.y = y; const a = FISH.yl.geometry.attributes.position; a.setY(1, y); a.needsUpdate = true;
    if (FISH.wait <= 0) { FISH.cast = false; FISH.yl.visible = FISH.yf.visible = false; fishSecret(); if (Math.random() < 0.12) { const n = MEME_NS[Math.floor(Math.random() * MEME_NS.length)], I = byN[n]; toast('A MEME CARD, SOAKING WET: ' + (I && I.t ? I.t.toUpperCase() : 'UNTITLED') + '. YOU HANG IT UP TO DRY.', 'blue'); } else toast(FISH_CATCH[Math.floor(Math.random() * FISH_CATCH.length)]); }
    if (Math.hypot(P.x - FISH.ytip.x, P.z - (FISH.ytip.z - 1.2)) > 4) { FISH.cast = false; FISH.yl.visible = FISH.yf.visible = false; toast('YOU WALKED OFF AND LEFT YOUR LINE. SOMEONE ELSE WILL CATCH YOUR FISH.'); } }
}
window.__FRAMES.push(dt => { try { fishFrame(dt); } catch (e) { if (!FISH.err) { FISH.err = e; console.warn('v99 fishing', e); } } });
