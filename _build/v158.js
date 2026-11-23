/* ================================================================
   v158 THE RACCOON (2026-11-23)
   Between eleven at night and four in the morning a raccoon works the garbage bags the sanitation truck has not
   reached yet: it waddles in from the dark, climbs onto a pile, digs with its hands and pulls out something,
   then goes on to the next pile. Come close and it stops dead, sits up and stares at you, eyes shining in your
   light, then decides you are not worth it and goes back to work, or runs if you keep coming.
   ================================================================ */
const COON = { st: 'walk', pile: 0, x: 0, z: 0, yaw: 0, t: 0, stare: 0 };
window.__COON = COON;
(function raccoon() {
  const g = new THREE.Group(); scene.add(g); COON.g = g; g.visible = false; const grey = new THREE.MeshStandardMaterial({ color: 0x6e6a64, roughness: 0.95 }), dark = new THREE.MeshStandardMaterial({ color: 0x1a1918, roughness: 0.9 }), pale = new THREE.MeshStandardMaterial({ color: 0xc8c4bc, roughness: 0.95 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 9), grey); body.scale.set(1, 0.8, 1.45); body.position.y = 0.28; g.add(body); COON.body = body;
  const head = new THREE.Group(); head.position.set(0, 0.34, 0.3); g.add(head); COON.head = head; const hd = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 9), grey); hd.scale.set(1.15, 0.9, 1); head.add(hd);
  const mask = new THREE.Mesh(new THREE.SphereGeometry(0.112, 12, 6, -0.9, 1.8, 1.0, 0.55), dark); mask.rotation.y = 0; head.add(mask);
  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 8), pale); snout.rotation.x = PI / 2; snout.position.set(0, -0.02, 0.12); head.add(snout); const nose = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 4), dark); nose.position.set(0, -0.02, 0.18); head.add(nose);
  [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.06, 5), grey); e.position.set(s * 0.07, 0.09, -0.02); head.add(e); });
  COON.eyes = [-1, 1].map(s => { const m = new THREE.MeshBasicMaterial({ color: 0x0a0a0a, toneMapped: false }); const e = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 4), m); e.position.set(s * 0.045, 0.025, 0.095); head.add(e); return m; });
  const tail = new THREE.Group(); tail.position.set(0, 0.3, -0.27); g.add(tail); COON.tail = tail; for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.055 - i * 0.004, 0.058 - i * 0.004, 0.07, 8), i % 2 ? dark : pale); r.rotation.x = PI / 2 + 0.5; r.position.set(0, -i * 0.035, -i * 0.06); tail.add(r); }
  COON.legs = [[-0.1, 0.18], [0.1, 0.18], [-0.1, -0.18], [0.1, -0.18]].map(([x, z]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.2, 6), dark); l.position.set(x, 0.1, z); g.add(l); return l; });
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
})();
const coonSecret = secret('raccoon', () => { toast('THE RACCOON SITS UP AND LOOKS AT YOU WITH THE CALM OF SOMEONE WHO HAS NEVER PAID RENT IN THIS CITY AND NEVER WILL.', 'blue'); });
function coonFrame(dt) {
  const h = nycTime(TIME.utc).hours, on = (h >= 23 || h < 4) && GARB && GARB.piles.some(p => p.full); COON.g.visible = on; if (!on) { COON.placed = false; return; }
  const piles = GARB.piles.filter(p => p.full); if (!COON.placed) { const p = piles[0]; COON.x = p.x * 1.05; COON.z = p.z * 1.05; COON.pile = 0; COON.placed = true; COON.st = 'walk'; }
  const p = piles[COON.pile % piles.length]; const dP = Math.hypot(P.x - COON.x, P.z - COON.z); if (dP > 120) return; COON.t += dt;
  if (dP < 5 && COON.st !== 'run' && COON.st !== 'stare') { COON.st = 'stare'; COON.t = 0; coonSecret(); }
  let tx = p.x, tz = p.z, sp = 0.6, sit = 0, dig = 0;
  if (COON.st === 'stare') { sp = 0; sit = 1; if (dP < 2.5) { COON.st = 'run'; COON.t = 0; } else if (COON.t > 4) COON.st = dP < 5 ? 'stare' : 'walk'; if (COON.t > 4 && dP >= 5) COON.st = 'walk'; }
  else if (COON.st === 'run') { tx = COON.x + (COON.x - P.x) * 3; tz = COON.z + (COON.z - P.z) * 3; sp = 4; if (COON.t > 4) { COON.pile++; COON.st = 'walk'; } }
  else if (COON.st === 'walk') { if (Math.hypot(tx - COON.x, tz - COON.z) < 0.5) { COON.st = 'dig'; COON.t = 0; } }
  else if (COON.st === 'dig') { sp = 0; dig = 1; if (COON.t > 14) { COON.pile++; COON.st = 'walk'; } }
  const dx = tx - COON.x, dz = tz - COON.z, dd = Math.hypot(dx, dz); if (sp > 0 && dd > 0.05) { const ty = Math.atan2(dx, dz); COON.yaw += Math.atan2(Math.sin(ty - COON.yaw), Math.cos(ty - COON.yaw)) * Math.min(1, dt * 5); const st = Math.min(dd, sp * dt); COON.x += Math.sin(COON.yaw) * st; COON.z += Math.cos(COON.yaw) * st; }
  if (COON.st === 'stare') { const ty = Math.atan2(P.x - COON.x, P.z - COON.z); COON.yaw += Math.atan2(Math.sin(ty - COON.yaw), Math.cos(ty - COON.yaw)) * Math.min(1, dt * 3); }
  const gy = floorAt(COON.x, COON.z, 3).f || ground(COON.x, COON.z); COON.g.position.set(COON.x, gy + (dig ? 0.25 : 0), COON.z); COON.g.rotation.set(-sit * 0.9 + dig * 0.35, COON.yaw, 0);
  const walk = sp > 0 ? Math.sin(LIFE.t * sp * 9) * 0.6 : 0; COON.legs.forEach((l, i) => l.rotation.x = (i === 0 || i === 3 ? walk : -walk) + (dig && i < 2 ? Math.sin(LIFE.t * 14 + i) * 0.8 : 0)); COON.tail.rotation.y = Math.sin(LIFE.t * 1.5) * 0.3;
  const shine = sit && dP < 14 ? 1 : 0; COON.eyes.forEach(m => m.color.setRGB(0.05 + shine * 2.2, 0.05 + shine * 2.0, 0.05 + shine * 1.2));
}
window.__FRAMES.push(dt => { try { coonFrame(dt); } catch (e) { if (!COON.err) { COON.err = e; console.warn('v158 raccoon', e); } } });
