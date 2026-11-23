/* ================================================================
   v110 HORSES (2026-11-23)
   Two real horses (CC0, rigged). A carriage horse in a red plume pulls a black hansom cab with a driver in a top hat
   slowly round the ring path, the other way from the dog walker; its walk is the real walk, hooves clopping when
   you are close. And a mounted police officer patrols GM BEACH at a walk, turning at each end. E at the carriage
   when it pulls in at the south of the ring takes a lap.
   ================================================================ */
const HORSE = { a: 1.8, R: 42.6, wait: 0, ride: false };
window.__HORSE = HORSE;
(function horses() {
  const g = new THREE.Group(); scene.add(g); HORSE.g = g;
  HORSE.h = CC0.make('horse', { h: 1.7, parent: g, walkSp: 1.4, far: 120 }); HORSE.h.root.position.set(0, 0, 2.6);
  const black = new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.35, metalness: 0.3 }), red = new THREE.MeshStandardMaterial({ color: 0x7a1f2a, roughness: 0.8 }), brass = new THREE.MeshStandardMaterial({ color: 0xb08a3e, roughness: 0.3, metalness: 0.9 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.8, 1.6), black); body.position.set(0, 1.05, -0.6); g.add(body);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 0.7), red); seat.position.set(0, 1.55, -0.8); g.add(seat);
  const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.3, 16, 1, true, -PI / 2, PI * 0.7), black); hood.rotation.z = PI / 2; hood.position.set(0, 1.75, -1.15); g.add(hood);
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.5), black); box.position.set(0, 1.55, 0.35); g.add(box);
  [[-0.78, -0.9, 0.62], [0.78, -0.9, 0.62], [-0.72, 0.5, 0.45], [0.72, 0.5, 0.45]].forEach(([x, z, r]) => { const w = new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, 6, 24), black); w.rotation.y = PI / 2; w.position.set(x, r, z); g.add(w); const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 8), brass); hub.rotation.z = PI / 2; hub.position.set(x, r, z); g.add(hub); (HORSE.wheels = HORSE.wheels || []).push({ w, r }); });
  [-0.45, 0.45].forEach(x => { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.4, 6), black); s.rotation.x = PI / 2 - 0.08; s.position.set(x, 1.0, 1.4); g.add(s); });
  const drv = person(0x15161a, 0x15161a, SKIN[3], 'wiseguy'); scene.remove(drv.g); drv.g.position.set(0, 1.62 - 0.35 - 0.5, 0.35); drv.g.scale.setScalar(0.95); g.add(drv.g);
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.28, 14), black); hat.position.set(0, 2.32, 0); drv.g.add(hat);
  const plume = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.35, 8), new THREE.MeshStandardMaterial({ color: 0xc8202a, roughness: 0.9 })); plume.position.set(0, 1.95, 3.15); g.add(plume); HORSE.plume = plume;
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  interact(0, 42.6, 3, 'E · TAKE A CARRIAGE RIDE', () => horseRide());
  // the mounted officer on the beach
  const mg = new THREE.Group(); scene.add(mg); HORSE.mg = mg; HORSE.m = CC0.make('horse', { h: 1.7, parent: mg, tint: 0x5a3a24, walkSp: 1.3 }); HORSE.mx = -30; HORSE.md = 1;
  const cop = person(0x1f2a44, 0x1f2a44, SKIN[0], 'cabbie'); scene.remove(cop.g); cop.g.position.set(0, -0.12, -0.15); cop.g.scale.setScalar(0.9); mg.add(cop.g);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.14, 0.12, 14), new THREE.MeshStandardMaterial({ color: 0x1f2a44, roughness: 0.6 })); cap.position.set(0, 2.2, 0); cop.g.add(cap);
  if (window.__MAP) MAP.places.push(['CARRIAGE', 0, 42.6, 0, 44.5]);
})();
const horseSecret = secret('carriage', () => { toast('ONE LAP IN A HANSOM CAB. THE DRIVER POINTS AT THINGS AND MAKES UP FACTS ABOUT THEM. ALL OF THEM ARE WRONG. YOU TIP ANYWAY.', 'blue'); });
function horseRide() { if (HORSE.ride) return; const d = Math.hypot(HORSE.g.position.x - P.x, HORSE.g.position.z - P.z); if (d > 6) { toast('THE CARRIAGE IS ON ITS WAY ROUND. IT STOPS AT THE SOUTH OF THE RING.'); return; } HORSE.ride = true; HORSE.rideA = 0; HORSE.wait = 0; toast('YOU CLIMB IN. THE DRIVER CLICKS HIS TONGUE. ANY MOVE KEY TO GET OFF.', 'blue'); }
let clopT = 0;
function horseFrame(dt) {
  const stopB = 0; if (HORSE.wait > 0) HORSE.wait -= dt; else { const prev = HORSE.a; HORSE.a -= 1.5 / HORSE.R * dt; const d0 = Math.atan2(Math.sin(prev - stopB), Math.cos(prev - stopB)), d1 = Math.atan2(Math.sin(HORSE.a - stopB), Math.cos(HORSE.a - stopB)); if (!HORSE.ride && d0 > 0 && d1 <= 0) HORSE.wait = 14; if (HORSE.ride) HORSE.rideA += 1.5 / HORSE.R * dt; }
  const a = HORSE.a, x = Math.sin(a) * HORSE.R, z = Math.cos(a) * HORSE.R; HORSE.g.position.set(x, ground(x, z), z); const tx = -Math.cos(a), tz = Math.sin(a); HORSE.g.rotation.y = Math.atan2(tx, tz);
  const moving = HORSE.wait <= 0; if (moving) HORSE.wheels.forEach(o => o.w.rotation.x -= 1.5 / o.r * dt); HORSE.plume.rotation.z = Math.sin(LIFE.t * 3) * 0.15;
  if (HORSE.ride) { const moveKey = keys.KeyW || keys.KeyS || keys.KeyA || keys.KeyD || joy.x || joy.y; if (moveKey && HORSE.rideA > 0.3) { HORSE.ride = false; toast('YOU HOP OFF. THE HORSE DOES NOT LOOK BACK.'); }
    else { P.x = x - tx * 0.8; P.z = z - tz * 0.8; P.y = ground(x, z) + 1.1; P.vy = 0; P.ground = true; if (HORSE.rideA > PI * 2) { HORSE.ride = false; horseSecret(); } } }
  const d = Math.hypot(P.x - x, P.z - z); clopT -= dt; if (moving && d < 22 && clopT <= 0 && AC && AC.state === 'running' && oceanGain && oceanGain.gain.value > 0) { clopT = 0.36; try { beep(380 + Math.random() * 60, 0.03, 'triangle', Math.min(0.05, 0.8 / (d + 3))); } catch (e) { } }
  // the officer: up and down the beach
  HORSE.mx += HORSE.md * 1.2 * dt; if (HORSE.mx > 34 || HORSE.mx < -34) HORSE.md = -HORSE.md; const mz = 110; HORSE.mg.position.set(HORSE.mx, ground(HORSE.mx, mz), mz); HORSE.mg.rotation.y = HORSE.md > 0 ? PI / 2 : -PI / 2;
}
window.__FRAMES.push(dt => { try { horseFrame(dt); } catch (e) { if (!HORSE.err) { HORSE.err = e; console.warn('v110 horses', e); } } });
