/* ================================================================
   v96 THE LIVING STATUE (2026-11-22)
   On the west grass at (-88, 0), a street performer painted head to toe in silver stands on a silver box holding a
   silver torch, perfectly still, a hat at their feet. Stand and look: nothing. Look away and back: they have moved,
   a little. E drops a TDH in the hat and they come alive for a moment, a slow robot bow and a wink.
   ================================================================ */
const LSTAT = { pose: 0, t: 0, bow: 0, looked: false };
window.__LIVE = LSTAT;
const LSTAT_AT = { x: -88, z: 0 };
(function livingStatue() {
  const x0 = LSTAT_AT.x, z0 = LSTAT_AT.z, g0 = ground(x0, z0), ry = Math.atan2(-x0, -z0); LSTAT.ry = ry;
  const silver = new THREE.MeshStandardMaterial({ color: 0xc9ccd0, roughness: 0.28, metalness: 0.95 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.8), silver); box.position.set(x0, g0 + 0.3, z0); scene.add(box); post(x0, z0, 0.55, -5, 2.6);
  const p = person(0xc9ccd0, 0xc9ccd0, 0xc9ccd0, 'editor'); p.g.position.set(x0, g0 + 0.6 - 0.35, z0); p.g.rotation.y = ry; LSTAT.p = p;
  p.g.traverse(o => { if (o.isMesh) o.material = silver; }); LSTAT.silver = silver;
  // repaint the body silver once the cast arrives
  const paint = () => p.g.traverse(o => { if (o.isMesh && o.material !== silver) o.material = silver; }); if (CROWD.loaded) paint(); else CROWD.wait.push(paint); LSTAT.paint = paint;
  const torch = new THREE.Group(); const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.5, 8), silver); torch.add(stick); const fl = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 8), silver); fl.position.y = 0.32; torch.add(fl); torch.position.set(0.32, 2.35, 0.05); p.g.add(torch);
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.1, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.9, side: THREE.DoubleSide })); hat.position.set(x0 + Math.sin(ry) * 0.75, g0 + 0.05, z0 + Math.cos(ry) * 0.75); scene.add(hat);
  interact(x0 + Math.sin(ry) * 1.5, z0 + Math.cos(ry) * 1.5, 1.8, 'E · TIP THE STATUE (1 TDH)', () => { state.tdh = Math.max(0, state.tdh - 1); try { hud(); } catch (e) { } LSTAT.bow = 3; liveSecret(); toast('THE STATUE BOWS, SLOWLY, LIKE A MACHINE THAT LIKES YOU. THEN A WINK. THEN STONE AGAIN.'); });
  if (window.__MAP) MAP.places.push(['LIVING STATUE', x0, z0, x0 + Math.sin(ry) * 2.5, z0 + Math.cos(ry) * 2.5]);
})();
const liveSecret = secret('livingstatue', () => { }, []);
const _lv = new THREE.Vector3(), _lw = new THREE.Vector3();
function liveFrame(dt) {
  const d = Math.hypot(P.x - LSTAT_AT.x, P.z - LSTAT_AT.z); if (d > 60) return; const g = LSTAT.p.g;
  camera.getWorldDirection(_lw); _lv.set(LSTAT_AT.x - camera.position.x, g.position.y + 1.2 - camera.position.y, LSTAT_AT.z - camera.position.z).normalize(); const looking = _lv.dot(_lw) > 0.9;
  if (!looking && LSTAT.looked && d < 25) { LSTAT.pose = (LSTAT.pose + 1) % 4; }   // you looked away: they shift
  LSTAT.looked = looking;
  const poses = [[0, 0, 0], [0.35, 0, 0.05], [-0.3, 0, -0.04], [0.1, 0.12, 0]]; const [yy, xx, zz] = poses[LSTAT.pose];
  if (LSTAT.bow > 0) { LSTAT.bow -= dt; const b = Math.sin((3 - LSTAT.bow) / 3 * PI); g.rotation.set(b * 0.5, LSTAT.ry, 0, 'YXZ'); } else g.rotation.set(xx, LSTAT.ry + yy, zz, 'YXZ');
}
window.__FRAMES.push(dt => { try { liveFrame(dt); } catch (e) { if (!LSTAT.err) { LSTAT.err = e; console.warn('v96 statue', e); } } });
