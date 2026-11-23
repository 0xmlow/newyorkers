/* ================================================================
   v98 THE SANDCASTLE (2026-11-22)
   A bucket and a spade on GM BEACH at (44, 122). E builds: a mound, then a keep, then four towers, a wall, a moat,
   and an Open Eye Flower flag on the top, one stage per press. Leave it and the tide takes it overnight; it is
   gone by morning and the bucket is waiting again. Finish all six stages and the island counts it.
   ================================================================ */
const SAND = { stage: 0, parts: [] };
window.__SAND = SAND;
const SAND_AT = { x: 44, z: 122 };
(function sandcastle() {
  const x0 = SAND_AT.x, z0 = SAND_AT.z, g0 = ground(x0, z0); SAND.g0 = g0;
  const sm = new THREE.MeshStandardMaterial({ map: tex('assets/sand_c.webp', [1, 1]), color: 0xd9c49a, roughness: 1 }), wet = new THREE.MeshStandardMaterial({ color: 0x8a7a5a, roughness: 0.4 });
  const add = (mesh, stage) => { mesh.visible = false; mesh.castShadow = true; scene.add(mesh); SAND.parts.push({ mesh, stage }); return mesh; };
  const mound = new THREE.Mesh(new THREE.SphereGeometry(1.0, 20, 10, 0, PI * 2, 0, PI / 2), sm); mound.scale.y = 0.4; mound.position.set(x0, g0, z0); add(mound, 1);
  const keep = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.6, 16), sm); keep.position.set(x0, g0 + 0.6, z0); add(keep, 2);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.12, 16, 1, true), sm); crown.position.set(x0, g0 + 0.96, z0); add(crown, 2);
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.22, 0.55, 12), sm); t.position.set(x0 + sx * 0.85, g0 + 0.27, z0 + sz * 0.85); add(t, 3); const c = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.25, 12), sm); c.position.set(x0 + sx * 0.85, g0 + 0.67, z0 + sz * 0.85); add(c, 3); });
  [[0, 0.85, 1.7, 0.12], [0, -0.85, 1.7, 0.12], [0.85, 0, 0.12, 1.7], [-0.85, 0, 0.12, 1.7]].forEach(([dx, dz, w, d]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, d), sm); m.position.set(x0 + dx, g0 + 0.15, z0 + dz); add(m, 4); });
  const moat = new THREE.Mesh(new THREE.RingGeometry(1.35, 1.7, 32), new THREE.MeshStandardMaterial({ color: 0x3a5a6a, roughness: 0.05, metalness: 0.4, polygonOffset: true, polygonOffsetFactor: -2 })); moat.rotation.x = -PI / 2; moat.position.set(x0, g0 + 0.03, z0); add(moat, 5);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.7, 2.0, 32), new THREE.MeshStandardMaterial({ color: 0xa8946a, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1 })); ring.rotation.x = -PI / 2; ring.position.set(x0, g0 + 0.025, z0); add(ring, 5);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.5, 4), new THREE.MeshStandardMaterial({ color: 0xc9b07a })); pole.position.set(x0, g0 + 1.27, z0); add(pole, 6);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), new THREE.MeshBasicMaterial({ map: tex('assets/iv_flower.webp'), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, toneMapped: false })); fl.position.set(x0 + 0.12, g0 + 1.42, z0); add(fl, 6); SAND.flag = fl;
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.22, 14, 1, true), new THREE.MeshStandardMaterial({ color: 0xff3fa4, roughness: 0.6, side: THREE.DoubleSide })); bucket.position.set(x0 + 2.3, g0 + 0.11, z0 + 0.5); scene.add(bucket);
  const spade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.02), new THREE.MeshStandardMaterial({ color: 0x2962FF })); spade.position.set(x0 + 2.5, g0 + 0.2, z0 + 0.2); spade.rotation.z = 0.5; scene.add(spade);
  interact(x0 + 2.2, z0 + 0.8, 2.6, 'E · BUILD THE SANDCASTLE', () => sandBuild());
  try { const s = JSON.parse(localStorage.getItem('meme-island-sand') || 'null'); if (s && s.day === Math.floor(Date.now() / 86400000)) SAND.stage = s.stage; } catch (e) { }
  SAND.parts.forEach(p => p.mesh.visible = p.stage <= SAND.stage);
  if (window.__MAP) MAP.places.push(['SANDCASTLE', x0, z0, x0 + 2.5, z0 + 1]);
})();
const sandSecret = secret('sandcastle', () => { toast('THE SANDCASTLE IS FINISHED. THE FLOWER FLIES FROM THE KEEP. THE TIDE IS ALREADY THINKING ABOUT IT.', 'blue'); });
const SAND_SAY = ['', 'A MOUND. EVERY EMPIRE STARTS AS A MOUND.', 'THE KEEP. PACK IT WET.', 'FOUR TOWERS. A CHILD NEARBY IS NOW INVOLVED.', 'THE WALL. NOBODY GETS IN WITHOUT TDH.', 'THE MOAT. IT FILLS ITSELF, WHICH IS THE GOOD PART.', 'THE FLAG.'];
function sandBuild() { if (SAND.stage >= 6) { toast('IT IS FINISHED. LEAVE IT FOR THE TIDE.'); return; } SAND.stage++; SAND.parts.forEach(p => p.mesh.visible = p.stage <= SAND.stage); toast(SAND_SAY[SAND.stage]); if (SAND.stage === 6) sandSecret();
  try { localStorage.setItem('meme-island-sand', JSON.stringify({ stage: SAND.stage, day: Math.floor(Date.now() / 86400000) })); } catch (e) { } }
window.__FRAMES.push(dt => { try { const h = SKY.t ? SKY.t.h : 12; if (SAND.stage > 0 && h >= 3 && h < 5) { SAND.stage = 0; SAND.parts.forEach(p => p.mesh.visible = false); } if (SAND.flag.visible) SAND.flag.rotation.y = Math.sin(LIFE.t * 3) * 0.3; } catch (e) { } });
