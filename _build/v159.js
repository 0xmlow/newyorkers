/* ================================================================
   v159 THE MAIL CARRIER (2026-11-23)
   Monday to Saturday, ten to four, a letter carrier in blue walks the ring path pushing a mail cart, stopping at
   each of six blue collection boxes: unlocks it, the door drops, she scoops the letters into her bag, locks up
   and walks on. Neither snow nor rain: she works in any weather. E when you catch her: no, there is nothing for
   you.
   ================================================================ */
const MAIL = { a: 0.3, R: 40.2, st: 'walk', t: 0, boxes: [], cur: -1 };
window.__MAIL = MAIL;
(function mailCarrier() {
  const blue = new THREE.MeshStandardMaterial({ color: 0x1f3a7a, roughness: 0.45, metalness: 0.3 }), dark = new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.5 });
  for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2 + 0.55, R = 44.2, x = Math.sin(a) * R, z = Math.cos(a) * R, gy = ground(x, z); const g = new THREE.Group(); g.position.set(x, gy, z); g.rotation.y = a + PI; scene.add(g);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.85, 0.5), blue); body.position.y = 0.65; body.castShadow = true; g.add(body); const top = new THREE.Mesh(new THREE.CylinderGeometry(0.275, 0.275, 0.55, 14, 1, false, 0, PI), blue); top.rotation.z = PI / 2; top.rotation.y = PI / 2; top.position.y = 1.07; g.add(top);
    [-0.22, 0.22].forEach(dx => [-0.18, 0.18].forEach(dz => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.25, 0.05), dark); l.position.set(dx, 0.12, dz); g.add(l); }));
    const door = new THREE.Group(); door.position.set(0, 0.3, 0.255); g.add(door); const dm = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.4), blue); dm.position.y = 0.2; door.add(dm);
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.14), new THREE.MeshBasicMaterial({ map: signTex([{ t: 'MAIL', s: 0.6 }], 256, 100, '#1f3a7a', '#ffffff') })); lab.position.set(0, 0.86, 0.252); g.add(lab);
    post(x, z, 0.3, -5, gy + 1.3); MAIL.boxes.push({ a, g, door }); }
  const p = person(0x7a9ac8, 0x1f2a44, SKIN[0], 'workgirl'); MAIL.p = p; const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.12, 14), new THREE.MeshStandardMaterial({ color: 0x1f2a44, roughness: 0.7 })); hat.position.set(0, 1.98, 0); p.g.add(hat);
  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.4), new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.8 })); bag.position.set(0.26, 1.05, 0); p.g.add(bag);
  const cart = new THREE.Group(); scene.add(cart); MAIL.cart = cart; const cm2 = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.4, metalness: 0.7 }); const bin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.6), new THREE.MeshStandardMaterial({ color: 0x3a4a6a, roughness: 0.7 })); bin.position.y = 0.6; cart.add(bin);
  [-0.22, 0.22].forEach(x => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 10), dark); w.rotation.z = PI / 2; w.position.set(x, 0.1, 0); cart.add(w); const r = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.75), cm2); r.position.set(x, 0.85, -0.4); r.rotation.x = 0.5; cart.add(r); });
})();
const mailSecret = secret('mail', () => { toast('"NOTHING FOR YOU TODAY." THERE IS NEVER ANYTHING FOR YOU. SHE SAYS IT KINDLY. SHE SAYS IT TO EVERYBODY.', 'blue'); });
// a moving interact: patched each frame onto the carrier
const MAIL_INT = { x: 0, z: 0, r: 1.6, label: 'E · ASK THE MAIL CARRIER', fn: () => mailSecret() }; INTER.push(MAIL_INT);
function mailFrame(dt) {
  const t = nycTime(TIME.utc), on = t.wd >= 1 && t.wd <= 6 && t.hours >= 10 && t.hours < 16; MAIL.p.g.visible = MAIL.cart.visible = on; MAIL_INT.label = on ? 'E · ASK THE MAIL CARRIER' : ''; if (!on) return;
  const d = Math.hypot(P.x - MAIL.p.g.position.x, P.z - MAIL.p.g.position.z); MAIL.t += dt; let moving = false;
  if (MAIL.st === 'walk') { MAIL.a += 1.05 / MAIL.R * dt; moving = true; MAIL.boxes.forEach((b, i) => { const da = Math.atan2(Math.sin(b.a - MAIL.a), Math.cos(b.a - MAIL.a)); if (i !== MAIL.cur && da > 0 && da < 0.03) { MAIL.cur = i; MAIL.st = 'box'; MAIL.t = 0; } }); }
  else { const b = MAIL.boxes[MAIL.cur], u = MAIL.t; b.door.rotation.x = u > 1.5 && u < 7 ? Math.min(1.3, (u - 1.5) * 2) : Math.max(0, b.door.rotation.x - dt * 2); MAIL.p.arms[1].rotation.x = u > 2 && u < 6.5 ? -1.2 + Math.sin(u * 5) * 0.3 : 0; if (u > 8.5) MAIL.st = 'walk'; }
  const a = MAIL.a, x = Math.sin(a) * MAIL.R, z = Math.cos(a) * MAIL.R, tx = Math.cos(a), tz = -Math.sin(a), yaw = Math.atan2(tx, tz);
  const facing = MAIL.st === 'box' ? Math.atan2(Math.sin(a), Math.cos(a)) : yaw; MAIL.p.g.position.set(x, ground(x, z) - 0.35, z); MAIL.p.g.rotation.y = facing; animLegs(MAIL.p, LIFE.t, moving); if (moving) MAIL.p.arms[0].rotation.x = -0.6;
  MAIL.cart.position.set(x + tx * 0.9, ground(x + tx * 0.9, z + tz * 0.9), z + tz * 0.9); MAIL.cart.rotation.y = yaw; MAIL.cart.children.forEach(c => { if (c.geometry && c.geometry.type === 'CylinderGeometry' && moving) c.rotation.x += dt * 10; });
  MAIL_INT.x = x; MAIL_INT.z = z;
}
window.__FRAMES.push(dt => { try { mailFrame(dt); } catch (e) { if (!MAIL.err) { MAIL.err = e; console.warn('v159 mail', e); } } });
