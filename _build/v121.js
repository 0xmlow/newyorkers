/* ================================================================
   v121 TRAFFIC LIGHTS (2026-11-23)
   Real traffic signals over the ring road at the crosswalk: a pole with a mast arm on each side and a three lamp
   head facing each lane, red, amber, green, in step with the pedestrian signal (the cars get red while it says
   walk, amber for the last four seconds of their green). The lamps glow and throw a little colour on the road at
   night.
   ================================================================ */
const TLIGHT = { heads: [] };
window.__TLIGHT = TLIGHT;
(function trafficLights() {
  const steel = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.4, metalness: 0.7 }), yel = new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.5 });
  [-1, 1].forEach(s => { const x = s * 5.2, z = ROAD_R + s * 5.2, gy = ground(x, z); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 6.2, 10), steel); pole.position.set(x, gy + 3.1, z); scene.add(pole); post(x, z, 0.16, -5, 6.4);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 4.2, 8), steel); arm.rotation.x = PI / 2; arm.position.set(x, gy + 6.0, z - s * 2.1); scene.add(arm);
    const head = new THREE.Group(); head.position.set(x, gy + 5.3, z - s * 3.4); scene.add(head); const box = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.2, 0.36), yel); head.add(box);
    const lamps = [0xff2a1a, 0xffb020, 0x30ff70].map((c, i) => { const m = new THREE.Mesh(new THREE.CircleGeometry(0.13, 16), new THREE.MeshBasicMaterial({ color: 0x111111, toneMapped: false })); m.position.set(s * 0.22, 0.38 - i * 0.38, 0); m.rotation.y = s * PI / 2; head.add(m); return { m, c }; });
    TLIGHT.heads.push(lamps); });
})();
function tlightFrame(dt) {
  if (!window.__XWALK) return; const k = XWALK.t % 50, st = k < 33 ? 'red' : (k > 46 ? 'amber' : 'green');   // the cars: red while people walk or count down
  TLIGHT.heads.forEach(L3 => L3.forEach((l, i) => l.m.material.color.setHex((i === 0 && st === 'red') || (i === 1 && st === 'amber') || (i === 2 && st === 'green') ? l.c : 0x141414)));
}
window.__FRAMES.push(dt => { try { tlightFrame(dt); } catch (e) { if (!TLIGHT.err) { TLIGHT.err = e; console.warn('v121 lights', e); } } });
