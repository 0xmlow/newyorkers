/* ================================================================
   v151 THE DETECTORIST (2026-11-23)
   A man in a fishing hat and headphones sweeps the west end of GM BEACH with a metal detector, slow arcs, low to
   the sand. Get close and you hear what he hears: the hum, and the chirp rising as the coil passes over
   something. When it sings he kneels, digs with a little scoop, sifts, and holds up whatever it was. Be there
   when he finds something.
   ================================================================ */
const DETEC = { x: -30, dir: 1, st: 'sweep', t: 0, n: 0, finds: ['A BOTTLE CAP FROM 1987', 'A SUBWAY TOKEN', 'A RING. GOLD. HE GOES VERY QUIET', 'A BEER CAN, VINTAGE', 'A NICKEL', 'A KEY TO SOMETHING', 'A HOT WHEELS CAR', 'A MEDAL FROM A 1990S 5K', 'ANOTHER BOTTLE CAP', 'A HAIRPIN', 'A QUARTER FROM 1964, REAL SILVER'] };
window.__DETEC = DETEC;
(function detectorist() {
  const p = person(0x5a6a4a, 0x3a3a32, SKIN[3], 'cabbie'); DETEC.p = p; const g = p.g;
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.12, 14), new THREE.MeshStandardMaterial({ color: 0xc8b88a, roughness: 0.9 })); hat.position.set(0, 1.98, 0); g.add(hat);
  const ph = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.025, 6, 16, PI), new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.5 })); ph.position.set(0, 1.85, 0); ph.rotation.y = PI / 2; g.add(ph);
  const det = new THREE.Group(); det.position.set(0.25, 1.15, 0.15); g.add(det); DETEC.det = det; const black = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5, metalness: 0.4 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.3, 6), black); shaft.position.set(0, -0.45, 0.45); shaft.rotation.x = 0.85; det.add(shaft);
  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 6, 18), new THREE.MeshStandardMaterial({ color: 0xd8c040, roughness: 0.5 })); coil.rotation.x = PI / 2; coil.position.set(0, -0.98, 0.9); det.add(coil); DETEC.coil = coil;
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.14), black); box.position.set(0, -0.08, 0.1); det.add(box);
  const fx = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshStandardMaterial({ color: 0xd8c08a, metalness: 1, roughness: 0.25 })); fx.visible = false; g.add(fx); DETEC.find = fx;
  const pile = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 5, 0, PI * 2, 0, PI / 2), new THREE.MeshStandardMaterial({ color: 0xb8a078, roughness: 1 })); pile.scale.y = 0.35; pile.visible = false; scene.add(pile); DETEC.pile = pile;
})();
const detecSecret = secret('detector', () => { toast('HE HOLDS IT UP TO THE LIGHT FOR YOU. "FORTY YEARS," HE SAYS. "FORTY YEARS AND IT IS STILL THE BEST FEELING IN THE WORLD."', 'blue'); });
let detecHumT = 0;
function detecFrame(dt) {
  const D = DETEC, p = D.p, t = nycTime(TIME.utc), W = WX.override || WX.cur, out = t.hours >= 8 && t.hours < 16.5 && W !== 'RAIN' && W !== 'SNOW'; p.g.visible = out; if (!out) { D.pile.visible = false; return; }
  const z = 113 + Math.sin(D.x * 0.11) * 2.5, dP = Math.hypot(P.x - D.x, P.z - z); if (dP > 90) return; D.t += dt; const gy = floorAt(D.x, z, 3).f || 0.3;
  if (D.st === 'sweep') { D.x += D.dir * 0.35 * dt; if (D.x > -10) D.dir = -1; if (D.x < -52) D.dir = 1; const sw = Math.sin(D.t * 1.6); D.det.rotation.y = sw * 0.6; animLegs(p, D.t * 0.45, true);
    p.g.position.set(D.x, gy - 0.35, z); p.g.rotation.set(0, D.dir > 0 ? PI / 2 : -PI / 2, 0); const sig = D.t % 30 > 26 ? (D.t % 30 - 26) / 4 : 0;
    detecHumT -= dt; if (dP < 10 && detecHumT <= 0 && AC && AC.state === 'running' && oceanGain && oceanGain.gain.value > 0) { detecHumT = 0.22; try { beep(sig > 0 ? 600 + sig * 900 + Math.abs(sw) * 300 : 180, 0.12, sig > 0 ? 'sine' : 'triangle', Math.min(0.02, 0.3 / (dP + 3)) * (sig > 0 ? 1.6 : 0.5)); } catch (e) { } }
    if (D.t % 30 > 29.9) { D.st = 'dig'; D.t = 0; D.pile.position.set(D.x + D.dir * 0.9, gy, z); D.pile.visible = true; } }
  else { animLegs(p, 0, false); p.g.position.y = gy - 0.35 - Math.min(0.45, D.t * 0.6); p.arms[1].rotation.x = -0.8 + (D.t < 6 ? Math.sin(D.t * 6) * 0.4 : -1.6); D.det.rotation.y = 0;
    if (D.t > 6 && !D.shown) { D.shown = true; D.find.visible = true; D.find.position.set(0.25, 2.1, 0.25); const what = D.finds[D.n++ % D.finds.length]; if (dP < 14) { toast('HE FOUND ' + what + '.'); detecSecret(); } }
    if (D.t > 9) { D.st = 'sweep'; D.t = 0; D.shown = false; D.find.visible = false; p.g.position.y = gy - 0.35; } }
}
window.__FRAMES.push(dt => { try { detecFrame(dt); } catch (e) { if (!DETEC.err) { DETEC.err = e; console.warn('v151 detectorist', e); } } });
