/* ================================================================
   v81 THE CAR ALARM (2026-11-22)
   Two cars parked on the outer shoulder of the ring road, a black sedan and a dented green hatchback. Brush past one
   and its alarm goes off: the full New York cycle (whoop, honk, two tone, chirp), hazards flashing, for twelve
   seconds, and then somebody yells down from somewhere. It stops on its own. Nobody ever comes for the car.
   ================================================================ */
const CARS = { c: [] };
window.__CARS = CARS;
(function parkedCars() {
  [[0.656, 0x141518, 'sedan'], [-2.25, 0x2f4a33, 'hatch']].forEach(([a, col, kind]) => { const R = ROAD_R + 3.0, x = Math.sin(a) * R, z = Math.cos(a) * R, gy = ground(x, z), heading = Math.atan2(Math.sin(a), Math.cos(a)) + PI / 2;
    const g = new THREE.Group(); g.position.set(x, gy, z); g.rotation.y = Math.atan2(-(-Math.sin(a)), Math.cos(a)); scene.add(g);
    const paint = new THREE.MeshStandardMaterial({ color: col, roughness: 0.25, metalness: 0.6 }), glassM = new THREE.MeshStandardMaterial({ color: 0x10151c, roughness: 0.05, metalness: 0.6 }), tyre = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const L = kind === 'sedan' ? 4.6 : 3.8, Wd = 1.8; const body = new THREE.Mesh(new THREE.BoxGeometry(L, 0.75, Wd), paint); body.position.y = 0.65; g.add(body);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(kind === 'sedan' ? 2.3 : 2.4, 0.6, Wd - 0.12), glassM); cab.position.set(kind === 'sedan' ? -0.2 : -0.5, 1.3, 0); g.add(cab);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(kind === 'sedan' ? 2.0 : 2.2, 0.06, Wd - 0.14), paint); roof.position.set(kind === 'sedan' ? -0.2 : -0.5, 1.62, 0); g.add(roof);
    [[L / 2 - 0.8, 1], [L / 2 - 0.8, -1], [-L / 2 + 0.8, 1], [-L / 2 + 0.8, -1]].forEach(([wx, s]) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.25, 16), tyre); w.rotation.x = PI / 2; w.position.set(wx, 0.36, s * (Wd / 2 - 0.05)); g.add(w); });
    const hz = []; [[L / 2 + 0.01, 0.62, 0.65, 0xffa020], [L / 2 + 0.01, 0.62, -0.65, 0xffa020], [-L / 2 - 0.01, 0.65, 0.65, 0xff6010], [-L / 2 - 0.01, 0.65, -0.65, 0xff6010]].forEach(([lx, ly, lz, c]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.3), new THREE.MeshBasicMaterial({ color: 0x331a08, toneMapped: false })); m.position.set(lx, ly, lz); g.add(m); hz.push({ m, c }); });
    if (kind === 'hatch') { const dent = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), new THREE.MeshStandardMaterial({ color: 0x24392a, roughness: 0.5 })); dent.scale.set(1, 0.4, 0.15); dent.position.set(0.6, 0.7, Wd / 2); g.add(dent); }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    boxWalls(x, z, L, Wd, g.rotation.y, -5, gy + 1.5);
    CARS.c.push({ g, x, z, ry: g.rotation.y, L, Wd, hz, on: 0, cool: 0 }); });
})();
const carSecret = secret('caralarm', () => { }, []);
let carOsc = null;
function carAlarmSound(c) { if (!AC || AC.state !== 'running' || !oceanGain || oceanGain.gain.value === 0) return; try { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'square'; o.frequency.value = 800; const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2400; g.gain.value = 0; o.connect(f); f.connect(g); g.connect(AC.destination); o.start(); carOsc = { o, g, c }; } catch (e) { } }
function carsFrame(dt) {
  CARS.c.forEach(c => { c.cool = Math.max(0, c.cool - dt);
    const lx = P.x - c.x, lz = P.z - c.z, cs = Math.cos(c.ry), sn = Math.sin(c.ry), u = lx * cs - lz * sn, v = lx * sn + lz * cs; const touch = Math.abs(u) < c.L / 2 + 0.55 && Math.abs(v) < c.Wd / 2 + 0.55;
    if (touch && c.on <= 0 && c.cool <= 0) { c.on = 12; c.yelled = false; carSecret(); toast('YOU BRUSHED A PARKED CAR. IT HAS OPINIONS.'); if (!carOsc) carAlarmSound(c); }
    if (c.on > 0) { c.on -= dt; const t = 12 - c.on, ph = Math.floor(t / 3) % 4, flash = Math.sin(t * 9) > 0; c.hz.forEach(h => h.m.material.color.setHex(flash ? h.c : 0x331a08));
      if (carOsc && carOsc.c === c) { const d = Math.hypot(P.x - c.x, P.z - c.z), vol = Math.max(0, 0.05 - d * 0.0008); let f = 800;
        if (ph === 0) f = 600 + 500 * ((t * 2) % 1); else if (ph === 1) f = (t * 4) % 1 < 0.5 ? 420 : 0; else if (ph === 2) f = (t * 3) % 1 < 0.5 ? 950 : 700; else f = (t * 10) % 1 < 0.3 ? 1700 : 0;
        carOsc.o.frequency.setTargetAtTime(Math.max(40, f), AC.currentTime, 0.01); carOsc.g.gain.setTargetAtTime(f ? vol : 0, AC.currentTime, 0.01); }
      if (t > 6.5 && !c.yelled) { c.yelled = true; toast(['SOMEBODY UPSTAIRS: WHOSE CAR IS THAT', 'A VOICE FROM A WINDOW: I AM CALLING SOMEBODY', 'SOMEONE ON A FIRE ESCAPE: EVERY NIGHT. EVERY NIGHT.'][Math.floor(Math.random() * 3)]); }
      if (c.on <= 0) { c.cool = 8; c.hz.forEach(h => h.m.material.color.setHex(0x331a08)); if (carOsc && carOsc.c === c) { try { carOsc.o.stop(); } catch (e) { } carOsc = null; } } } });
}
window.__FRAMES.push(dt => { try { carsFrame(dt); } catch (e) { if (!CARS.err) { CARS.err = e; console.warn('v81 cars', e); } } });
