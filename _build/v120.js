/* ================================================================
   v120 THE STATEN ISLAND FERRY (2026-11-23)
   A big orange ferry, the kind that has crossed this harbour for a century for free, makes the crossing out past
   the south channel every eight minutes: a long orange hull, three white decks with rows of lit windows, the name
   on the side, a wake behind, a deep two note horn as it passes the island. At night every window is lit.
   ================================================================ */
const FERRY = { t: Math.random() * 480, dur: 480 };
window.__FERRY = FERRY;
(function ferry() {
  const g = new THREE.Group(); scene.add(g); FERRY.g = g; const L = 90, B = 20;
  const orange = new THREE.MeshStandardMaterial({ color: 0xe0601c, roughness: 0.5 }), white = new THREE.MeshStandardMaterial({ color: 0xece8e0, roughness: 0.5 }), dark = new THREE.MeshStandardMaterial({ color: 0x1b1d22, roughness: 0.6 });
  const hull = new THREE.Mesh(new THREE.BoxGeometry(L, 5, B), orange); hull.position.y = 1.5; g.add(hull);
  [0, 1].forEach(s => { const cap = new THREE.Mesh(new THREE.CylinderGeometry(B / 2, B / 2, 5, 20, 1, false, s ? 0 : PI, PI), orange); cap.scale.set(0.5, 1, 1); cap.position.set(s ? L / 2 : -L / 2, 1.5, 0); g.add(cap); });
  const winM = new THREE.MeshStandardMaterial({ color: 0x12161c, roughness: 0.1, metalness: 0.4, emissive: 0xffe2b0, emissiveIntensity: 0 }); FERRY.win = winM;
  [[L - 8, 4.2, 6.3], [L - 22, 3.6, 10.2], [L - 40, 3, 13.6]].forEach(([w, h, y]) => { const d = new THREE.Mesh(new THREE.BoxGeometry(w, h, B - 2), white); d.position.y = y; g.add(d); const wn = new THREE.Mesh(new THREE.BoxGeometry(w - 1, 1.1, B - 1.9), winM); wn.position.y = y + 0.4; g.add(wn); });
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(6, 2.4, 8), white); bridge.position.set(0, 16.2, 0); g.add(bridge); const stack = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 4, 14), dark); stack.position.set(0, 19, 0); g.add(stack);
  const nm = signTex([{ t: 'N3W YORKERS', s: 0.5 }], 2048, 220, null, '#ffffff'); [-1, 1].forEach(s => { const p = new THREE.Mesh(new THREE.PlaneGeometry(30, 3.2), new THREE.MeshBasicMaterial({ map: nm, transparent: true })); p.position.set(0, 2.2, s * (B / 2 + 0.05)); if (s < 0) p.rotation.y = PI; g.add(p); });
  const wk = wakeMesh ? wakeMesh(140, 26) : null; if (wk) { wk.position.set(-L / 2 - 66, -0.5, 0); g.add(wk); }
  g.traverse(o => { if (o.isMesh) o.castShadow = false; });
})();
const ferrySecret = secret('ferry', () => { toast('THE FERRY ANSWERS. IT IS FREE, IT HAS ALWAYS BEEN FREE, AND IT IS STILL THE BEST VIEW IN THE CITY.', 'blue'); }, ['ferry', 'statenisland']);
function ferryFrame(dt) {
  FERRY.t = (FERRY.t + dt) % FERRY.dur; const k = FERRY.t / FERRY.dur, x = 560 - k * 1120, z = 255; FERRY.g.position.set(x, 0.1 + Math.sin(LIFE.t * 0.35) * 0.2, z); FERRY.g.rotation.y = PI; FERRY.g.rotation.z = Math.sin(LIFE.t * 0.27) * 0.006;
  FERRY.win.emissiveIntensity = Math.min(1, (L.lamps || 0) * 1.4) * 1.1;
  const mid = Math.abs(k - 0.5) < 0.01; if (mid && !FERRY.honked) { FERRY.honked = true; try { shipHorn({ g: FERRY.g, horn: [70, 105] }); } catch (e) { } } if (!mid) FERRY.honked = false;
}
window.__FRAMES.push(dt => { try { ferryFrame(dt); } catch (e) { if (!FERRY.err) { FERRY.err = e; console.warn('v120 ferry', e); } } });
