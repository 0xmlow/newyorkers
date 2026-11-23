/* ================================================================
   v191 THE LOOK: N3W BIKE (2026-11-23)
   A bike share dock at (9.5, 48.5), just off the promenade: a concrete pad, a kiosk with a map, and eight docks,
   six of them holding a heavy step through bike in Evil Eye Blue with a basket on the front. At night the dock
   lights glow green where a bike is ready. E at the kiosk: TWENTY MINUTES FREE. THE ISLAND IS SIX MINUTES ACROSS.
   ================================================================ */
const BIKES = { at: { x: 9.5, z: 48.5 }, leds: [] };
window.__BIKES = BIKES;
(function bikeDock() {
  if (!LOOK.on || /bikes=0/.test(location.search)) return; const { x: x0, z: z0 } = BIKES.at, g = ground(x0, z0) + 0.02;
  const pad = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.1, 2.6), MAT.conc || new THREE.MeshStandardMaterial({ color: 0x9a968c })); pad.position.set(x0, g + 0.05, z0); pad.receiveShadow = true; scene.add(pad);
  const blue = new THREE.MeshStandardMaterial({ color: 0x2962ff, roughness: 0.45, metalness: 0.3 }), dark = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.6 }), steel = new THREE.MeshStandardMaterial({ color: 0x8a9096, roughness: 0.35, metalness: 0.8 }), led = new THREE.MeshStandardMaterial({ color: 0x0a2a10, emissive: 0x3dff6a, emissiveIntensity: 0.2 });
  BIKES.led = led; const T = (r, t) => new THREE.TorusGeometry(r, t, 8, 28), C = (r, h) => new THREE.CylinderGeometry(r, r, h, 8);
  const bar = (grp, mat, a, b, r) => { const v = new V3().subVectors(b, a), m = new THREE.Mesh(C(r, v.length()), mat); m.quaternion.setFromUnitVectors(new V3(0, 1, 0), v.clone().normalize()); m.position.copy(a).addScaledVector(v, 0.5); m.castShadow = true; grp.add(m); };
  for (let i = 0; i < 8; i++) { const x = x0 - 3.85 + i * 1.1, z = z0 - 0.2;
    const dock = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.85, 0.3), dark); dock.position.set(x, g + 0.52, z + 0.75); dock.castShadow = true; scene.add(dock); const l = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.02), led); l.position.set(x, g + 0.82, z + 0.59); scene.add(l);
    if (i === 2 || i === 6) continue; const b = new THREE.Group(); b.position.set(x, g + 0.1, z); b.rotation.y = PI / 2; scene.add(b);
    [-0.52, 0.52].forEach(zz => { const w = new THREE.Mesh(T(0.33, 0.035), dark); w.position.set(zz, 0.35, 0); b.add(w); const hub = new THREE.Mesh(C(0.05, 0.08), steel); hub.rotation.x = PI / 2; hub.position.set(zz, 0.35, 0); b.add(hub); });
    const P = (x1, y1) => new V3(x1, y1, 0); bar(b, blue, P(-0.52, 0.35), P(0.05, 0.42), 0.045); bar(b, blue, P(0.05, 0.42), P(0.42, 0.95), 0.045); bar(b, blue, P(-0.52, 0.35), P(-0.25, 0.8), 0.04); bar(b, blue, P(-0.25, 0.8), P(0.05, 0.42), 0.045);
    bar(b, steel, P(0.42, 0.95), P(0.52, 0.35), 0.025); bar(b, dark, P(-0.25, 0.8), P(-0.25, 0.95), 0.02); const s = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.14), dark); s.position.set(-0.27, 0.98, 0); b.add(s);
    bar(b, dark, new V3(0.4, 1.0, -0.28), new V3(0.4, 1.0, 0.28), 0.018); const bk = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.36), blue); bk.position.set(0.6, 0.92, 0); b.add(bk);
    const fender = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.02, 4, 16, PI * 0.6), blue); fender.position.set(-0.52, 0.35, 0); fender.rotation.z = PI * 0.25; b.add(fender); }
  const k = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.1, 0.4), blue); k.position.set(x0 + 4.4, g + 1.05, z0 + 0.4); k.castShadow = true; scene.add(k);
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.6), new THREE.MeshBasicMaterial({ map: signTex([{ t: 'N3W BIKE', s: 0.2 }, { t: 'TAP', s: 0.12 }, { t: 'TO RIDE', s: 0.1 }], 256, 360, '#2962FF', '#F0F4F8'), toneMapped: false })); sc.position.set(x0 + 4.4, g + 1.5, z0 + 0.19); sc.rotation.y = PI; scene.add(sc);
  boxWalls(x0, z0 + 0.3, 9.2, 1.6, 0, -5, g + 1.2);
  interact(x0 + 4.4, z0 - 0.6, 1.8, 'E · N3W BIKE', () => toast('TWENTY MINUTES FREE. THE ISLAND IS SIX MINUTES ACROSS. DOCK IT WHERE YOU FOUND IT.'));
  if (window.__MAP) MAP.places.push(['N3W BIKE', x0, z0, x0, z0 - 2.5]);
})();
window.__FRAMES.push(() => { try { if (BIKES.led) BIKES.led.emissiveIntensity = 0.25 + 1.6 * Math.min(1, (L.lamps || 0) * 1.3); } catch (e) { } });
