/* ================================================================
   v205 THE LOOK: CALL BOXES AND PARKING SIGNS (2026-11-23)
   The red fire alarm call box on its post, with the glass globe on top that glows at night, at four corners of
   the island; and on every third lamp post of the ring road a NO STANDING ANYTIME plate, red on white, the sign
   no New York driver reads. ?callbox=0 off.
   ================================================================ */
const CALLBOX = { glow: null };
window.__CALLBOX = CALLBOX;
(function callBoxes() {
  if (!LOOK.on || /callbox=0/.test(location.search)) return;
  const red = new THREE.MeshStandardMaterial({ color: 0xb3171f, roughness: 0.45, metalness: 0.4 }), glow = new THREE.MeshStandardMaterial({ color: 0x401010, emissive: 0xff3030, emissiveIntensity: 0, roughness: 0.2 }); CALLBOX.glow = glow;
  [[8.5, 74], [-52.5, 12.5], [44, 33], [-71.5, -45.5]].forEach(([x, z]) => { const g = ground(x, z);
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 1.5, 10), red); p.position.set(x, g + 0.75, z); p.castShadow = true; scene.add(p);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.38, 0.22), red); b.position.set(x, g + 1.5, z); b.castShadow = true; scene.add(b);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.12, 10), red); cap.position.set(x, g + 1.75, z); scene.add(cap);
    const gl = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), glow); gl.position.set(x, g + 1.9, z); scene.add(gl);
    const lb = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.12), new THREE.MeshBasicMaterial({ map: signTex([{ t: 'FIRE', s: 0.5 }], 128, 64, '#b3171f', '#ffffff') })); lb.position.set(x, g + 1.55, z + 0.112); scene.add(lb);
    if (typeof post === 'function') post(x, z, 0.25); });
  const pt = signTex([{ t: 'NO', s: 0.16, c: '#c8102e' }, { t: 'STANDING', s: 0.14, c: '#c8102e' }, { t: 'ANYTIME', s: 0.12, c: '#c8102e' }], 192, 288, '#f7f6f1', '#c8102e');
  const pm = new THREE.MeshStandardMaterial({ map: pt, roughness: 0.5 });
  for (let i = 1; i < 36; i += 3) { const a = (i + 0.5) / 36 * 360, [x, z] = P2(a, 94.5), g = ground(x, z), out = Math.atan2(x, z); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.45), pm); s.position.set(x + Math.sin(out) * 0.13, g + 2.5, z + Math.cos(out) * 0.13); s.rotation.y = out; scene.add(s); }
})();
window.__FRAMES.push(() => { try { if (CALLBOX.glow) CALLBOX.glow.emissiveIntensity = 0.15 + 2.2 * Math.min(1, (L.lamps || 0) * 1.3); } catch (e) { } });
