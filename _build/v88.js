/* ================================================================
   v88 THE DOORMAN (2026-11-22)
   The water tower building gets a front door: a dark green canvas awning out to the curb on brass poles, the
   address in white script, a strip of carpet, and a doorman in a long coat and cap who touches the brim when you
   come up the carpet and says something different depending on the hour. He never lets you in. Nobody gets in.
   ================================================================ */
const DOOR = { said: 0 };
window.__DOOR = DOOR;
(function doorman() {
  const x0 = WT_AT.x - 1.6, z0 = WT_AT.z + 3.5, g0 = ground(x0, z0); DOOR.x = x0; DOOR.z = z0;
  const green = new THREE.MeshStandardMaterial({ color: 0x1f3326, roughness: 0.85, side: THREE.DoubleSide }), brass = new THREE.MeshStandardMaterial({ color: 0xb08a3e, roughness: 0.3, metalness: 0.9 });
  const aw = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 4.2, 16, 1, true, -PI / 2, PI), green); aw.rotation.x = -PI / 2; aw.position.set(x0, g0 + 2.55, z0 + 2.1); aw.scale.set(1, 1, 0.5); scene.add(aw);
  const cap = new THREE.Mesh(new THREE.CircleGeometry(0.75, 16, 0, PI), green); cap.position.set(x0, g0 + 2.55, z0 + 4.2); cap.scale.set(1, 0.5, 1); scene.add(cap);
  const addr = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.34), new THREE.MeshBasicMaterial({ map: signTex([{ t: 'One N3W Place', s: 0.5, f: '"Permanent Marker", Georgia, serif' }], 512, 128, null, '#efe8da'), transparent: true })); addr.position.set(x0, g0 + 2.75, z0 + 4.21); scene.add(addr);
  [-0.72, 0.72].forEach(dx => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.55, 8), brass); p.position.set(x0 + dx, g0 + 1.27, z0 + 4.15); scene.add(p); post(x0 + dx, z0 + 4.15, 0.06, -5, 3); });
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 4.2), new THREE.MeshStandardMaterial({ color: 0x5a1712, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 })); carpet.rotation.x = -PI / 2; carpet.position.set(x0, g0 + 0.03, z0 + 2.1); scene.add(carpet);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.3), new THREE.MeshStandardMaterial({ color: 0x0d0f12, roughness: 0.1, metalness: 0.6 })); door.position.set(x0, g0 + 1.15, WT_AT.z + 3.51); scene.add(door);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.5, 0.06), brass); frame.position.set(x0, g0 + 1.25, WT_AT.z + 3.49); scene.add(frame);
  const dm = person(0x1f3326, 0x15161a, SKIN[4], 'editor'); dm.g.position.set(x0 + 0.95, g0 - 0.35, z0 + 0.5); dm.g.rotation.y = 0; DOOR.dm = dm;
  const capM = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.08, 14), new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.6 })); capM.position.set(0, 2.24, 0); dm.g.add(capM);
})();
function doorLine() { const h = (SKY.t && SKY.t.h) || 12; return h < 5 ? 'LATE ONE. GET HOME SAFE.' : h < 12 ? 'GOOD MORNING. PACKAGE CAME FOR YOU. NO IT DID NOT, I AM KIDDING.' : h < 17 ? 'AFTERNOON. NICE DAY FOR IT, WHATEVER IT IS.' : h < 21 ? 'GOOD EVENING. THEY ARE EXPECTING YOU. NOT HERE, BUT SOMEWHERE.' : 'EVENING. THE ELEVATOR IS OUT AGAIN. JOKE. THERE IS NO ELEVATOR.'; }
const doorSecret = secret('doorman', () => { }, []);
window.__FRAMES.push(dt => { try { const d = Math.hypot(P.x - DOOR.x, P.z - (DOOR.z + 1.5)); if (d < 2.2 && LIFE.t - DOOR.said > 40) { DOOR.said = LIFE.t; doorSecret(); toast('THE DOORMAN TOUCHES HIS CAP. ' + doorLine()); } } catch (e) { } });
