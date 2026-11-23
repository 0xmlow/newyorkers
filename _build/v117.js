/* ================================================================
   v117 CHRISTMAS TREES FOR SALE (2026-11-23)
   From the Friday before Thanksgiving to Christmas Eve, the sidewalk tree sellers arrive, the way they do on every
   avenue: a long row of Fraser firs leaning on a timber rack along the road at (65, 63), a string of bulbs over
   them, a little camper trailer where the sellers sleep, a fire barrel, a hand painted price sign, and the smell
   you can almost see. E buys a tree (it gets tied on top of a passing cab, figuratively). Out of season: a bare lot.
   ================================================================ */
const XMAS = {};
window.__XMAS = XMAS;
(function treeSellers() {
  const b = 0.8, R = 91, x0 = Math.sin(b) * R, z0 = Math.cos(b) * R, g0 = ground(x0, z0), ry = b; XMAS.x = x0; XMAS.z = z0; XMAS.ry = ry;
  const g = new THREE.Group(); g.position.set(x0, g0, z0); g.rotation.y = ry; scene.add(g); XMAS.g = g;
  const wood = new THREE.MeshStandardMaterial({ color: 0x6b5236, roughness: 0.9 }), fir = new THREE.MeshStandardMaterial({ color: 0x1f3a26, roughness: 0.95 }), fir2 = new THREE.MeshStandardMaterial({ color: 0x2a4a2e, roughness: 0.95 });
  const rail = new THREE.Mesh(new THREE.BoxGeometry(14, 0.1, 0.1), wood); rail.position.set(0, 1.6, 0.6); g.add(rail);
  [-7, -3.5, 0, 3.5, 7].forEach(x => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.6, 0.1), wood); p.position.set(x, 1.3, 0.6); g.add(p); });
  for (let i = 0; i < 18; i++) { const x = -6.6 + i * 0.78, h = 1.7 + Math.random() * 0.8; const t = new THREE.Group(); t.position.set(x, 0, 0.1); t.rotation.x = 0.28; g.add(t);
    for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.42 - k * 0.1, h * 0.55, 9), k % 2 ? fir2 : fir); c.position.y = 0.35 + k * h * 0.26 + h * 0.2; c.castShadow = true; t.add(c); }
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.4, 6), wood); tr.position.y = 0.2; t.add(tr); }
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe2a8, toneMapped: false }), 40); const o = new THREE.Object3D();
  for (let i = 0; i < 40; i++) { const u = i / 39; o.position.set(-7 + u * 14, 2.55 - Math.sin((u * 4 % 1) * PI) * 0.35, 0.6); o.updateMatrix(); bulbs.setMatrixAt(i, o.matrix); } g.add(bulbs); XMAS.bulbs = bulbs;
  const trailer = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.0, 1.9), new THREE.MeshStandardMaterial({ color: 0xe9e4da, roughness: 0.6 })); trailer.position.set(9.5, 1.3, -0.4); g.add(trailer);
  const tw = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.5), new THREE.MeshStandardMaterial({ color: 0x15171c, emissive: 0xffc77a, emissiveIntensity: 0.8 })); tw.position.set(9.0, 1.6, -1.36); tw.rotation.y = PI; g.add(tw);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.8, 14, 1, true), new THREE.MeshStandardMaterial({ color: 0x3a3532, roughness: 0.7, metalness: 0.4, side: THREE.DoubleSide })); barrel.position.set(7.6, 0.4, -1.4); g.add(barrel);
  const fire = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 8), new THREE.MeshBasicMaterial({ color: 0xff8a20, transparent: true, opacity: 0.85, toneMapped: false })); fire.position.set(7.6, 0.95, -1.4); g.add(fire); XMAS.fire = fire;
  if (window.__STEAM) STEAM.em.push({ x: x0 + Math.cos(ry) * 7.6 - Math.sin(ry) * 1.4, z: z0 - Math.sin(ry) * 7.6 - Math.cos(ry) * 1.4, y: g0 + 1.1, rate: 4, r: 0.12, v: 0.8, big: 0.4, stack: true });
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), new THREE.MeshBasicMaterial({ map: signTex([{ t: 'XMAS TREES', s: 0.3 }, { t: 'FRASER · BALSAM · FROM VERMONT', s: 0.11 }, { t: 'ASK FOR PRICE', s: 0.14 }], 512, 256, '#efe8da', '#7a1f2a'), side: THREE.DoubleSide })); sg.position.set(-8.2, 1.2, -0.6); sg.rotation.y = PI; g.add(sg);
  const seller = person(0x7a1f2a, 0x2a2f45, SKIN[2], 'cabbie'); scene.remove(seller.g); seller.g.position.set(6.2, -0.35, -1.6); seller.g.rotation.y = PI; g.add(seller.g);
  const hat = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8, 0, PI * 2, 0, PI / 2), new THREE.MeshStandardMaterial({ color: 0xe2581c, roughness: 1 })); hat.position.y = 2.15; seller.g.add(hat);
  boxWalls(x0, z0, 18, 2.2, ry, -5, g0 + 2.6);
  interact(x0 - Math.sin(b) * 2.8, z0 - Math.cos(b) * 2.8, 3.5, 'E · BUY A TREE', () => { xmasSecret(); toast(['A SIX FOOT FRASER. THE SELLER SAYS SEVENTY. YOU SAY FIFTY. YOU PAY SEVENTY. HE THROWS IN THE NETTING.', 'ANOTHER TREE? FOR THE OFFICE? HE LIKES YOU NOW.'][Math.min(1, (XMAS.n = (XMAS.n || 0) + 1) - 1)]); });
  if (window.__MAP) MAP.places.push(['XMAS TREES', x0, z0, x0 - Math.sin(b) * 3.5, z0 - Math.cos(b) * 3.5]);
})();
const xmasSecret = secret('xmastree', () => { }, []);
window.__FRAMES.push(dt => { try { const t = SKY.t; const on = !t || (t.mo === 11 && t.d >= 20) || (t.mo === 12 && t.d <= 24); XMAS.g.visible = on; if (!on) return; const night = Math.min(1, (L.lamps || 0) * 1.4); XMAS.bulbs.material.color.setRGB(0.5 + 0.5 * night, (0.5 + 0.5 * night) * 0.88, (0.5 + 0.5 * night) * 0.66); XMAS.fire.scale.y = 0.8 + Math.random() * 0.4; XMAS.fire.material.opacity = 0.6 + Math.random() * 0.35; } catch (e) { } });
