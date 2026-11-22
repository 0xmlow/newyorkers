/* ================================================================
   v53 HARBOUR TRAFFIC (2026-11-22)
   Real working traffic on the horizon, out past the El: a container ship (a hundred and eight boxes in shipping line
   colours, a white bridge, a funnel) that takes about seven minutes to cross the south channel, and a red tug
   pushing a gravel barge up the west channel. Both carry running lights at night (red to port, green to starboard,
   white on the mast) and leave a wake. Each sounds its horn as it passes the island; HORN asks the nearest one.
   ================================================================ */
const SHIPS = { list: [] };
window.__SHIPS = SHIPS;
function shipLights(g, len, beam, h) {
  const mk = (col, x, y, z, s = 0.9) => { const m = new THREE.Mesh(new THREE.SphereGeometry(s, 8, 6), new THREE.MeshBasicMaterial({ color: col, toneMapped: false, transparent: true, opacity: 0 })); m.position.set(x, y, z); g.add(m); return m; };
  return [mk(0xff2a1a, len * 0.1, h, -beam / 2 - 0.3), mk(0x22ff5a, len * 0.1, h, beam / 2 + 0.3), mk(0xffffff, len * 0.3, h + 9, 0, 1.1), mk(0xffffff, -len * 0.45, h + 4, 0)];
}
function wakeMesh(len, wid) {
  // a white V of churned water: opaque at the stern (+x end), fading astern and to both edges
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const c = cv.getContext('2d');
  if (c && c.createLinearGradient) { const g = c.createLinearGradient(256, 0, 0, 0); g.addColorStop(0, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 256, 64); const h = c.createLinearGradient(0, 0, 0, 64); h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(0.5, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,1)'); c.globalCompositeOperation = 'destination-out'; c.fillStyle = h; c.fillRect(0, 0, 256, 64); }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(len, wid), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, opacity: 0.55, depthWrite: false })); m.rotation.x = -PI / 2; return m;
}
(function containerShip() {
  const g = new THREE.Group(), L = 92, B = 14;
  const red = new THREE.MeshStandardMaterial({ color: 0x5a1712, roughness: 0.7 }), black = new THREE.MeshStandardMaterial({ color: 0x15171b, roughness: 0.6 }), white = new THREE.MeshStandardMaterial({ color: 0xd9d6cf, roughness: 0.5 });
  const lower = new THREE.Mesh(new THREE.BoxGeometry(L, 4, B), red); lower.position.y = 0; g.add(lower);
  const upper = new THREE.Mesh(new THREE.BoxGeometry(L, 3.6, B), black); upper.position.y = 3.8; g.add(upper);
  const bow = new THREE.Mesh(new THREE.CylinderGeometry(B / 2, B / 2, 7.6, 3, 1, false, 0, PI), black); bow.scale.set(1.6, 1, 1); bow.position.set(L / 2, 1.9, 0); g.add(bow);
  const bowR = new THREE.Mesh(new THREE.CylinderGeometry(B / 2, B / 2, 4, 3, 1, false, 0, PI), red); bowR.scale.set(1.6, 1, 1); bowR.position.set(L / 2, -0.01, 0); g.add(bowR);
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(9, 13, B - 1), white); bridge.position.set(-L / 2 + 8, 12, 0); g.add(bridge);
  const win = new THREE.Mesh(new THREE.BoxGeometry(9.1, 1.2, B - 0.8), new THREE.MeshBasicMaterial({ color: 0x1b2533 })); win.position.set(-L / 2 + 8, 17, 0); g.add(win); SHIPS.cWin = win;
  const fun = new THREE.Mesh(new THREE.BoxGeometry(4, 6, 4), new THREE.MeshStandardMaterial({ color: 0x2962FF, roughness: 0.5 })); fun.position.set(-L / 2 + 2.5, 20, 0); g.add(fun);
  // the boxes: an InstancedMesh in shipping line colours
  const cols = [0x8a2b1e, 0x1f4f7a, 0x2f6a3a, 0xb06a1c, 0x6d6f73, 0x8e1a3a, 0x214e5e, 0xc9b23a, 0xe0ddd3], n = 9 * 4 * 3;
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(7.4, 2.6, 2.9), new THREE.MeshStandardMaterial({ roughness: 0.75 }), n); const o = new THREE.Object3D(), col = new THREE.Color(); let k = 0;
  for (let bay = 0; bay < 9; bay++) for (let row = 0; row < 4; row++) { const tiers = 2 + ((bay * 7 + row * 3) % 3 ? 1 : 0); for (let t = 0; t < 3; t++) { if (t >= tiers) { o.scale.setScalar(0.0001); } else o.scale.setScalar(1); o.position.set(-L / 2 + 17 + bay * 7.8, 7.0 + t * 2.65, -4.5 + row * 3); o.updateMatrix(); im.setMatrixAt(k, o.matrix); im.setColorAt(k, col.setHex(cols[(bay * 5 + row * 3 + t * 7) % cols.length])); k++; } }
  g.add(im);
  const lights = shipLights(g, L, B, 6); const wake = wakeMesh(120, 18); wake.position.set(-L / 2 - 58, 0.35, 0); g.add(wake);
  g.traverse(m => { if (m.isMesh) m.castShadow = false; }); scene.add(g);
  SHIPS.list.push({ name: 'THE CONTAINER SHIP', g, lights, horn: [55, 82], t: Math.random() * 420, dur: 420, path: t => [-520 + t * 1040, 320], dir: 0, sailed: false });
})();
(function tugAndBarge() {
  const g = new THREE.Group();
  const red = new THREE.MeshStandardMaterial({ color: 0x7a1a12, roughness: 0.6 }), black = new THREE.MeshStandardMaterial({ color: 0x15171b, roughness: 0.6 }), white = new THREE.MeshStandardMaterial({ color: 0xe3dfd6, roughness: 0.5 });
  const hull = new THREE.Mesh(new THREE.BoxGeometry(14, 2.6, 6), black); hull.position.set(-9, 0.4, 0); g.add(hull);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(13.6, 0.8, 5.8), red); deck.position.set(-9, 2.0, 0); g.add(deck);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(5, 3.4, 4.4), white); cab.position.set(-8, 4.1, 0); g.add(cab);
  const top = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.4, 3.6), white); top.position.set(-8, 6.9, 0); g.add(top);
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 3, 10), black); st.position.set(-11, 6, 0); g.add(st);
  const fender = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.4, 6.2), new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.95 })); fender.position.set(-1.6, 0.8, 0); g.add(fender);
  const barge = new THREE.Mesh(new THREE.BoxGeometry(36, 3, 13), new THREE.MeshStandardMaterial({ color: 0x5b4a3b, roughness: 0.9 })); barge.position.set(17, 0.3, 0); g.add(barge);
  const pile = new THREE.Mesh(new THREE.ConeGeometry(6.5, 4.5, 14), new THREE.MeshStandardMaterial({ color: 0x8f877a, roughness: 1 })); pile.scale.set(2.2, 1, 0.85); pile.position.set(17, 3.9, 0); g.add(pile);
  const lights = shipLights(g, 14, 6, 6); lights.forEach(m => m.position.x -= 8); const wake = wakeMesh(60, 14); wake.position.set(-44, 0.35, 0); g.add(wake);
  g.traverse(m => { if (m.isMesh) m.castShadow = false; }); scene.add(g);
  SHIPS.list.push({ name: 'THE TUG', g, lights, horn: [140, 210], t: Math.random() * 300, dur: 300, path: t => [-300, 460 - t * 920], sailed: false });
})();
function shipHorn(s, why) {
  if (!AC || AC.state !== 'running' || !oceanGain || oceanGain.gain.value === 0) return; const d = Math.hypot(s.g.position.x - P.x, s.g.position.z - P.z), vol = Math.max(0.012, Math.min(0.09, 18 / d));
  try { const t0 = AC.currentTime + Math.min(1.5, d / 343), g = AC.createGain(), f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.25); g.gain.setValueAtTime(vol, t0 + 2.6); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.4); f.connect(g); g.connect(AC.destination);
    s.horn.forEach(hz => { const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz; o.connect(f); o.start(t0); o.stop(t0 + 3.5); }); } catch (e) { }
}
secret('horn', () => { let best = null, bd = 1e9; SHIPS.list.forEach(s => { const d = Math.hypot(s.g.position.x - P.x, s.g.position.z - P.z); if (d < bd) { bd = d; best = s; } }); if (best) { shipHorn(best); toast(best.name + ' ANSWERS. YOU FEEL IT IN YOUR TEETH.', 'blue'); } }, ['horn', 'tugboat', 'containership']);
function shipsFrame(dt) {
  const night = Math.min(1, (L.lamps || 0) * 1.4);
  SHIPS.list.forEach(s => { s.t = (s.t + dt) % s.dur; const k = s.t / s.dur, [x, z] = s.path(k), [x2, z2] = s.path(Math.min(1, k + 0.001));
    s.g.position.set(x, 0.2 + Math.sin(LIFE.t * 0.4 + x * 0.01) * 0.25, z); s.g.rotation.y = Math.atan2(-(z2 - z), x2 - x); s.g.rotation.z = Math.sin(LIFE.t * 0.31) * 0.01;
    s.lights.forEach(m => { m.material.opacity = night; m.visible = night > 0.02; });
    // horn once a crossing, as it passes the island
    const mid = Math.abs(k - 0.5) < 0.02; if (mid && !s.sailed) { s.sailed = true; shipHorn(s); } if (!mid) s.sailed = false; });
  if (SHIPS.cWin) SHIPS.cWin.material.color.setHex(night > 0.3 ? 0xffd89a : 0x1b2533);
}
window.__FRAMES.push(dt => { try { shipsFrame(dt); } catch (e) { if (!SHIPS.err) { SHIPS.err = e; console.warn('v53 ships', e); } } });
