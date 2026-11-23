/* ================================================================
   v91 DOMINOES (2026-11-22)
   A card table at (-48, 28) with four men on folding chairs playing dominoes the uptown way: tiles slapped down
   hard enough to make the table jump, a radio on the ground, somebody always arguing the count. E pulls up a chair
   and watches a hand; they slam, they shout CAPICUA, and someone wins.
   ================================================================ */
const DOM = { men: [], tiles: [], t: 0, slam: 3, hand: 0, watch: 0 };
window.__DOM = DOM;
const DOM_AT = { x: -48, z: 28 };
(function dominoes() {
  const x0 = DOM_AT.x, z0 = DOM_AT.z, g0 = ground(x0, z0); DOM.g0 = g0;
  const table = new THREE.Group(); table.position.set(x0, g0, z0); scene.add(table); DOM.table = table;
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.04, 0.95), new THREE.MeshStandardMaterial({ color: 0x2f4a33, roughness: 0.9 })); top.position.y = 0.74; table.add(top);
  [[-0.42, -0.42], [0.42, -0.42], [-0.42, 0.42], [0.42, 0.42]].forEach(([x, z]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.74, 6), new THREE.MeshStandardMaterial({ color: 0x8a8f96, metalness: 0.7, roughness: 0.4 })); l.position.set(x, 0.37, z); table.add(l); });
  const tileM = new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.35 }), dotM = new THREE.MeshBasicMaterial({ color: 0x111111 });
  for (let i = 0; i < 14; i++) { const t = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.05), tileM); t.add(b); for (let k = 0; k < 3; k++) { const d = new THREE.Mesh(new THREE.CircleGeometry(0.006, 6), dotM); d.rotation.x = -PI / 2; d.position.set(-0.03 + k * 0.012, 0.011, (k % 2) * 0.012 - 0.006); t.add(d); } t.visible = false; t.position.y = 0.77; table.add(t); DOM.tiles.push(t); }
  [[0, -0.75, 0], [0.75, 0, -PI / 2], [0, 0.75, PI], [-0.75, 0, PI / 2]].forEach(([dx, dz, ry], i) => { const p = person([0xefe8da, 0x2962FF, 0x7a1f2a, 0x15161a][i], 0x2a2f45, SKIN[(i * 2 + 1) % SKIN.length], ['wiseguy', 'cabbie', 'writer', 'editor'][i]);
    p.g.position.set(x0 + dx, g0 - 0.35 - 0.42, z0 + dz); p.g.rotation.y = ry; DOM.men.push(p);
    const ch = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.42), new THREE.MeshStandardMaterial({ color: 0x5a3f28, roughness: 0.8 })); ch.position.set(x0 + dx * 1.05, g0 + 0.45, z0 + dz * 1.05); scene.add(ch); });
  const radio = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.22, 0.14), new THREE.MeshStandardMaterial({ color: 0x8a2b1e, roughness: 0.5 })); radio.position.set(x0 + 1.1, g0 + 0.11, z0 + 0.7); scene.add(radio);
  boxWalls(x0, z0, 1.9, 1.9, 0, -5, g0 + 1.0);
  interact(x0 + 1.6, z0 - 1.2, 1.8, 'E · WATCH A HAND', () => { DOM.watch = 25; DOM.hand = 0; DOM.tiles.forEach(t => t.visible = false); toast('YOU PULL UP A MILK CRATE. NOBODY LOOKS UP. THAT MEANS YOU CAN STAY.'); });
  if (window.__MAP) MAP.places.push(['DOMINOES', x0, z0, x0 + 1.6, z0 - 1.6]);
})();
const domSecret = secret('dominoes', () => { toast('CAPICUA. THE MAN IN WHITE WINS THE HAND AND TELLS EVERYONE ABOUT IT FOR TEN MINUTES.', 'blue'); });
function domFrame(dt) {
  const d = Math.hypot(P.x - DOM_AT.x, P.z - DOM_AT.z); if (d > 80) return; DOM.slam -= dt * (DOM.watch > 0 ? 1.8 : 1);
  DOM.table.position.y = DOM.g0 + Math.max(0, DOM.jump || 0) * 0.02; DOM.jump = (DOM.jump || 0) - dt * 8;
  if (DOM.slam <= 0) { DOM.slam = 2.5 + Math.random() * 3; const k = DOM.hand % 14; const t = DOM.tiles[k]; const along = k - 7; t.visible = true; t.position.set(along * 0.055, 0.77, (k % 2) * 0.03 - 0.015); t.rotation.y = k % 3 ? 0 : PI / 2; DOM.hand++; DOM.jump = 1;
    if (d < 25 && AC && AC.state === 'running' && oceanGain && oceanGain.gain.value > 0) try { const n = Math.floor(AC.sampleRate * 0.05), b = AC.createBuffer(1, n, AC.sampleRate), ch = b.getChannelData(0); for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 5); const s = AC.createBufferSource(); s.buffer = b; const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; const g = AC.createGain(); g.gain.value = Math.min(0.14, 2.5 / (d + 2)); s.connect(f); f.connect(g); g.connect(AC.destination); s.start(); } catch (e) { }
    if (DOM.hand % 14 === 0) { DOM.tiles.forEach(q => q.visible = false); if (DOM.watch > 0) domSecret(); else if (d < 15) toast('SOMEONE AT THE DOMINOES TABLE: CAPICUA!'); } }
  if (DOM.watch > 0) DOM.watch -= dt;
  DOM.men.forEach((m, i) => { m.g.rotation.z = Math.sin(LIFE.t * 0.8 + i) * 0.03 + ((DOM.hand % 4) === i && DOM.jump > 0 ? 0.08 : 0); });
}
window.__FRAMES.push(dt => { try { domFrame(dt); } catch (e) { if (!DOM.err) { DOM.err = e; console.warn('v91 dominoes', e); } } });
