/* ================================================================
   v103 THE OUTLINE (2026-11-22), apply-mlow-impermanent-vision, Whisper
   An empty lot at (-40, -78): a chain link fence, rubble, a weed tree, a FOR LEASE sign, and on the neighbouring
   wall the ghost of a staircase where a building used to lean. After dark the building comes back as a drawing:
   a five storey tenement in glowing cyan lines standing where it stood, windows, fire escape, cornice, one window
   lit pink, and a plaque: THIS WAS 1904 TO 2019. Walk inside the lines at night and the island counts it.
   ================================================================ */
const GHOST = { k: 0 };
window.__GHOST = GHOST;
const GHOST_AT = { x: -40, z: -78 };
(function outline() {
  const x0 = GHOST_AT.x, z0 = GHOST_AT.z, g0 = ground(x0, z0), W = 10, D = 6, H = 15; GHOST.g0 = g0;
  // the lot
  const dirt = new THREE.Mesh(new THREE.PlaneGeometry(W + 1, D + 1), new THREE.MeshStandardMaterial({ color: 0x5a4c3e, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 })); dirt.rotation.x = -PI / 2; dirt.position.set(x0, g0 + 0.03, z0); scene.add(dirt);
  const rub = new THREE.MeshStandardMaterial({ color: 0x7a6a5a, roughness: 1 }); for (let i = 0; i < 26; i++) { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.15 + Math.random() * 0.35, 0), rub); r.position.set(x0 + (Math.random() - 0.5) * W * 0.9, g0 + 0.05, z0 + (Math.random() - 0.5) * D * 0.9); r.rotation.set(Math.random() * 3, Math.random() * 3, 0); r.scale.y = 0.5; scene.add(r); }
  const fenceTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d'); if (c && c.clearRect && c.beginPath) { c.clearRect(0, 0, 64, 64); c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(64, 64); c.moveTo(64, 0); c.lineTo(0, 64); c.stroke(); } const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(W * 3, 6); return t; })();
  const fm = new THREE.MeshStandardMaterial({ color: 0xaab0b6, metalness: 0.7, roughness: 0.4, alphaMap: fenceTex, alphaTest: 0.5, side: THREE.DoubleSide });
  const fence = new THREE.Mesh(new THREE.PlaneGeometry(W + 1, 2.2), fm); fence.position.set(x0, g0 + 1.1, z0 + D / 2 + 0.5); scene.add(fence);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), new THREE.MeshBasicMaterial({ map: signTex([{ t: 'FOR LEASE', s: 0.36 }, { t: 'AS IS', s: 0.18 }], 512, 256, '#e2581c', '#0D0D0D') })); sign.position.set(x0 + 2.5, g0 + 1.5, z0 + D / 2 + 0.52); scene.add(sign);
  // the gate is open
  const gate = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.2), fm); gate.position.set(x0 - 3.2, g0 + 1.1, z0 + D / 2 + 1.3); gate.rotation.y = 1.1; scene.add(gate);
  wall(x0 - W / 2 - 0.5, z0 + D / 2 + 0.5, x0 - 4.3, z0 + D / 2 + 0.5, -5, g0 + 2.2); wall(x0 - 2.3, z0 + D / 2 + 0.5, x0 + W / 2 + 0.5, z0 + D / 2 + 0.5, -5, g0 + 2.2);
  const tree = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 2.4, 6), new THREE.MeshStandardMaterial({ color: 0x4a3a2a })); tree.position.set(x0 + 3, g0 + 1.2, z0 - 1); tree.rotation.z = 0.2; scene.add(tree);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 6), new THREE.MeshStandardMaterial({ color: 0x3e6a32, roughness: 1 })); crown.position.set(x0 + 3.3, g0 + 2.6, z0 - 1); scene.add(crown);
  // the neighbour wall with the ghost of the stairs
  const nw = new THREE.Mesh(new THREE.BoxGeometry(0.5, 9, D + 1), new THREE.MeshStandardMaterial({ map: tex('assets/brick_c.webp', [2, 3]), color: 0x8a6a5a, roughness: 0.9 })); nw.position.set(x0 - W / 2 - 0.8, g0 + 4.5, z0); scene.add(nw); boxWalls(x0 - W / 2 - 0.8, z0, 0.5, D + 1, 0, -5, g0 + 9);
  const sc = document.createElement('canvas'); sc.width = 256; sc.height = 512; const s2 = sc.getContext('2d'); if (s2 && s2.beginPath) { s2.strokeStyle = 'rgba(40,30,25,.55)'; s2.lineWidth = 6; s2.beginPath(); let x = 20, y = 500; s2.moveTo(x, y); for (let i = 0; i < 9; i++) { x += i % 2 ? -200 : 200; y -= 55; s2.lineTo(x, y); } s2.stroke(); s2.fillStyle = 'rgba(200,190,170,.25)'; for (let i = 0; i < 4; i++) s2.fillRect(30, 380 - i * 110, 196, 60); }
  const ghostStairs = new THREE.Mesh(new THREE.PlaneGeometry(D, 9), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true })); ghostStairs.position.set(x0 - W / 2 - 0.54, g0 + 4.5, z0); ghostStairs.rotation.y = PI / 2; scene.add(ghostStairs);
  // the building, as glowing lines
  const pts = []; const L = (ax, ay, az, bx, by, bz) => pts.push(new THREE.Vector3(x0 + ax, g0 + ay, z0 + az), new THREE.Vector3(x0 + bx, g0 + by, z0 + bz));
  const hx = W / 2, hz = D / 2; [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]].forEach(([a, b], i, arr) => { const [c, d] = arr[(i + 1) % 4]; L(a, 0, b, a, H, b); L(a, H, b, c, H, d); L(a, 0, b, c, 0, d); });
  for (let f = 1; f < 5; f++) L(-hx, f * 3, hz, hx, f * 3, hz);
  for (let f = 0; f < 5; f++) for (let k = 0; k < 4; k++) { const wx = -hx + 1.3 + k * 2.5, wy = f * 3 + 0.9; L(wx, wy, hz, wx + 1.1, wy, hz); L(wx + 1.1, wy, hz, wx + 1.1, wy + 1.6, hz); L(wx + 1.1, wy + 1.6, hz, wx, wy + 1.6, hz); L(wx, wy + 1.6, hz, wx, wy, hz); }
  L(-hx - 0.4, H + 0.6, hz + 0.4, hx + 0.4, H + 0.6, hz + 0.4); L(-hx - 0.4, H, hz + 0.4, -hx - 0.4, H + 0.6, hz + 0.4); L(hx + 0.4, H, hz + 0.4, hx + 0.4, H + 0.6, hz + 0.4);
  for (let f = 1; f < 5; f++) { const y = f * 3 + 0.2; L(0.2, y, hz, 0.2, y, hz + 1.1); L(0.2, y, hz + 1.1, 3.2, y, hz + 1.1); L(3.2, y, hz + 1.1, 3.2, y, hz); if (f < 4) L(0.4, y, hz + 0.8, 3.0, y + 3, hz + 0.8); }
  const lg = new THREE.BufferGeometry().setFromPoints(pts); const lm = new THREE.LineBasicMaterial({ color: 0x08deff, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending });
  const lines = new THREE.LineSegments(lg, lm); lines.visible = false; scene.add(lines); GHOST.lines = lines;
  const pink = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.6), new THREE.MeshBasicMaterial({ color: 0xff3fa4, transparent: true, opacity: 0, toneMapped: false, depthWrite: false })); pink.position.set(x0 - hx + 1.3 + 2 * 2.5 + 0.55, g0 + 2 * 3 + 0.9 + 0.8, z0 + hz + 0.01); scene.add(pink); GHOST.pink = pink;
  const plq = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.45), new THREE.MeshBasicMaterial({ map: signTex([{ t: 'THIS WAS', s: 0.22 }, { t: '1904 TO 2019', s: 0.3 }], 512, 160, null, '#08deff'), transparent: true, opacity: 0, toneMapped: false, depthWrite: false })); plq.position.set(x0 + 1.5, g0 + 2.6, z0 + hz + 0.6); scene.add(plq); GHOST.plq = plq;
  if (window.__MAP) MAP.places.push(['THE OUTLINE', x0, z0, x0 - 3.2, z0 + D / 2 + 2.5]);
})();
const ghostSecret = secret('outline', () => { toast('YOU ARE STANDING IN A BUILDING THAT IS NOT THERE. FOR A HUNDRED AND FIFTEEN YEARS SOMEONE COOKED DINNER RIGHT HERE.', 'blue'); });
function outlineFrame(dt) {
  const night = Math.min(1, Math.max(0, ((L.lamps || 0) - 0.2) * 1.6)); GHOST.k += (night - GHOST.k) * Math.min(1, dt * 0.5); const on = GHOST.k > 0.02; GHOST.lines.visible = on;
  const fl = 0.85 + Math.sin(LIFE.t * 1.3) * 0.1 + (Math.random() < 0.01 ? -0.4 : 0); GHOST.lines.material.opacity = GHOST.k * fl; GHOST.pink.material.opacity = GHOST.k * 0.7; GHOST.plq.material.opacity = GHOST.k;
  if (on && GHOST.k > 0.6 && Math.abs(P.x - GHOST_AT.x) < 5 && Math.abs(P.z - GHOST_AT.z) < 3) ghostSecret();
}
window.__FRAMES.push(dt => { try { outlineFrame(dt); } catch (e) { if (!GHOST.err) { GHOST.err = e; console.warn('v103 outline', e); } } });
