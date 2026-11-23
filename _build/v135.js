/* ================================================================
   v135 THE KAYAKERS (2026-11-23)
   Four sea kayaks (yellow, red, orange, blue) paddle a slow loop east of the pier on fair days, in a line, one
   guide in front: each paddler works a real double paddle, blade in on one side then the other, the hulls rocking
   with each stroke and riding the swell. Stand on the pier as they come past and the guide waves.
   ================================================================ */
const KAYAK = { k: [], cx: 35, cz: 168, rx: 22, rz: 12, a: 0, vis: 0 };
window.__KAYAK = KAYAK;
(function kayakers() {
  [[0xe8c43a, 0x2962FF], [0xc8202a, 0x1f2a44], [0xff7a1a, 0x2f4a33], [0x2962FF, 0x7a1f2a]].forEach(([hc, jc], i) => {
    const g = new THREE.Group(); scene.add(g);
    const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), new THREE.MeshStandardMaterial({ color: hc, roughness: 0.35, metalness: 0.1 })); hull.scale.set(0.32, 0.17, 2.0); hull.castShadow = true; g.add(hull);
    const coam = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 6, 18), new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.5 })); coam.rotation.x = PI / 2; coam.scale.set(1, 1.5, 1); coam.position.y = 0.14; g.add(coam);
    const p = person(jc, 0x15161a, SKIN[(i * 2 + 1) % SKIN.length], ['writer', 'workgirl', 'editor', 'actress'][i]); scene.remove(p.g); p.legs.forEach(l => l.visible = false); p.g.position.set(0, 0.1 - 0.86 + 0.1, 0); p.g.scale.setScalar(0.92); g.add(p.g);
    const pfd = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.24, 0.35, 10), new THREE.MeshStandardMaterial({ color: i ? 0xd8f02a : 0xff3fa4, roughness: 0.7 })); pfd.position.y = 1.3; p.g.add(pfd);
    const pad = new THREE.Group(); pad.position.set(0, 0.62, 0.3); g.add(pad); const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 2.2, 6), new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4 })); shaft.rotation.z = PI / 2; pad.add(shaft);
    [-1, 1].forEach(s => { const bl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 0.16), new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.5 })); bl.position.x = s * 1.1; bl.rotation.x = s * 0.6; pad.add(bl); });
    KAYAK.k.push({ g, p, pad, ph: i * 0.17, wave: 0 }); });
})();
const kayakSecret = secret('kayak', () => { toast('THE GUIDE LIFTS A PADDLE AND WAVES IT AT YOU. THREE STRANGERS IN KAYAKS WAVE TOO. YOU WAVE BACK FROM THE PIER LIKE A LIGHTHOUSE KEEPER.', 'blue'); });
function kayakFrame(dt) {
  const t = nycTime(TIME.utc), W = WX.override || WX.cur, want = t.hours >= 9 && t.hours < 16.5 && W !== 'RAIN' && W !== 'SNOW' && W !== 'HARBOR FOG' ? 1 : 0;
  KAYAK.vis += (want - KAYAK.vis) * Math.min(1, dt * 0.3); const on = KAYAK.vis > 0.5; KAYAK.k.forEach(k => k.g.visible = on); if (!on) return;
  KAYAK.a -= dt * 1.05 / ((KAYAK.rx + KAYAK.rz) / 2); const onPier = Math.abs(P.x) < 3.5 && P.z > 140;
  KAYAK.k.forEach((k, i) => { const a = KAYAK.a + k.ph, x = KAYAK.cx + Math.cos(a) * KAYAK.rx, z = KAYAK.cz + Math.sin(a) * KAYAK.rz, tx = Math.sin(a) * KAYAK.rx, tz = -Math.cos(a) * KAYAK.rz;
    const st = LIFE.t * 2.4 + i * 0.9, s = Math.sin(st); k.g.position.set(x, 0.02 + Math.sin(LIFE.t * 1.1 + x * 0.2) * 0.05, z); k.g.rotation.set(Math.sin(LIFE.t * 0.9 + i) * 0.03, Math.atan2(tx, tz), s * 0.06);
    const waving = i === 0 && k.wave > 0; k.wave = Math.max(0, k.wave - dt);
    if (waving) { k.pad.rotation.set(0, 0, 1.2); k.p.arms[0].rotation.x = -2.6; k.p.arms[1].rotation.x = -2.6; }
    else { k.pad.rotation.set(0, s * 0.35, s * 0.55); k.p.arms[0].rotation.x = -1.1 - s * 0.45; k.p.arms[1].rotation.x = -1.1 + s * 0.45; }
    if (i === 0 && onPier && Math.hypot(P.x - x, P.z - z) < 18 && !KAYAK.waved) { KAYAK.waved = true; k.wave = 3; kayakSecret(); } });
  if (!onPier) KAYAK.waved = false;
}
window.__FRAMES.push(dt => { try { kayakFrame(dt); } catch (e) { if (!KAYAK.err) { KAYAK.err = e; console.warn('v135 kayaks', e); } } });
