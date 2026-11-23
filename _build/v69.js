/* ================================================================
   v69 THE MARKET (2026-11-22)
   A row of five glass kiosks at (52, 24), the kind that go up in a park every winter: dark green steel frames, warm
   light inside, a hand painted sign each. HOT CIDER, EYE BAUBLES (Open Eye Flower ornaments), N3W PRINTS (Meme
   cards on a rail), KNITS and CHURROS, with a vendor in each and a canopy of string lights. E at the cider buys one.
   ================================================================ */
const MKT = { k: [] };
window.__MKT = MKT;
const MKT_AT = { x: 52, z: 24 };
(function market() {
  const x0 = MKT_AT.x, z0 = MKT_AT.z, steel = new THREE.MeshStandardMaterial({ color: 0x1f3326, roughness: 0.5, metalness: 0.4 });
  const glass = new THREE.MeshStandardMaterial({ color: 0xbcd0d8, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.18, depthWrite: false });
  const warm = new THREE.MeshStandardMaterial({ color: 0x2a1d12, roughness: 0.8, emissive: 0xffb764, emissiveIntensity: 0.35 }); MKT.warm = warm;
  const names = [['HOT CIDER', '#7a1f2a'], ['EYE BAUBLES', '#2962FF'], ['N3W PRINTS', '#0D0D0D'], ['KNITS', '#2f4a33'], ['CHURROS', '#b06a1c']];
  names.forEach(([nm, col], i) => { const x = x0 - 8 + i * 4, z = z0, gy = ground(x, z); const g = new THREE.Group(); g.position.set(x, gy, z); g.rotation.y = PI; scene.add(g);
    const W = 3.2, D = 2.2, H = 2.5;
    const back = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.06), warm); back.position.set(0, H / 2, -D / 2); g.add(back);
    [-W / 2, W / 2].forEach(sx => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.06, H, D), glass); s.position.set(sx, H / 2, 0); g.add(s); });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, 0.14, D + 0.4), steel); roof.position.set(0, H + 0.07, 0.1); g.add(roof);
    const gable = new THREE.Mesh(new THREE.CylinderGeometry(0.01, (D + 0.4) / 2 * 1.02, W + 0.3, 3, 1), steel); gable.rotation.z = PI / 2; gable.scale.set(1, 1, 0.45); gable.position.set(0, H + 0.35, 0.1); g.add(gable);
    [[-W / 2, D / 2], [W / 2, D / 2], [-W / 2, -D / 2], [W / 2, -D / 2]].forEach(([px, pz]) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.08, H, 0.08), steel); p.position.set(px, H / 2, pz); g.add(p); });
    const counter = new THREE.Mesh(new THREE.BoxGeometry(W - 0.1, 1.0, 0.5), new THREE.MeshStandardMaterial({ color: 0x5a3f28, roughness: 0.7 })); counter.position.set(0, 0.5, D / 2 - 0.25); g.add(counter);
    const sg = signTex([{ t: nm, s: 0.42 }], 1024, 200, col, '#efe8da'); const sign = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.2, 0.55), new THREE.MeshBasicMaterial({ map: sg, toneMapped: false })); sign.position.set(0, H - 0.15, D / 2 + 0.22); g.add(sign);
    const v = person([0x7a1f2a, 0x2962FF, 0x15161a, 0x2f4a33, 0xb06a1c][i], 0x2a2f45, SKIN[(i * 2 + 1) % SKIN.length]); v.g.position.set(x, gy - 0.35, z + 0.3); v.g.rotation.y = PI; MKT.k.push({ v, x, z });
    boxWalls(x, z, W, D, 0, -5, gy + H);
    // what each sells
    if (i === 0) for (let j = 0; j < 6; j++) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.12, 10), new THREE.MeshStandardMaterial({ color: 0xefe8da, roughness: 0.6 })); cup.position.set(-0.9 + j * 0.32, 1.06, D / 2 - 0.2); g.add(cup); }
    if (i === 1) { const ft = tex('assets/iv_flower.webp'); for (let j = 0; j < 14; j++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), new THREE.MeshStandardMaterial({ color: [0x2962FF, 0x08deff, 0xff3fa4, 0xefe8da][j % 4], roughness: 0.15, metalness: 0.6 })); b.position.set(-1.3 + (j % 7) * 0.43, 1.75 - Math.floor(j / 7) * 0.45, -D / 2 + 0.3); g.add(b); }
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), new THREE.MeshBasicMaterial({ map: ft, transparent: true, alphaTest: 0.4, toneMapped: false })); fl.position.set(0, 1.25, -D / 2 + 0.05); g.add(fl); }
    if (i === 2) for (let j = 0; j < 6; j++) { const m = memeMesh(MEME_NS[(j * 37 + 11) % MEME_NS.length], 0.55); if (m) { m.position.set(-1.2 + j * 0.48, 1.6, -D / 2 + 0.05); g.add(m); } }
    if (i === 3) for (let j = 0; j < 5; j++) { const h = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.3, 12), new THREE.MeshStandardMaterial({ color: [0x7a1f2a, 0x2962FF, 0xefe8da, 0x2f4a33, 0xb06a1c][j], roughness: 1 })); h.position.set(-1 + j * 0.5, 1.75, -D / 2 + 0.2); g.add(h); }
    if (i === 4) for (let j = 0; j < 8; j++) { const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 6), new THREE.MeshStandardMaterial({ color: 0xc98a3a, roughness: 0.8 })); ch.position.set(-0.6 + j * 0.12, 1.15, D / 2 - 0.25); ch.rotation.z = 0.3; g.add(ch); }
  });
  // string lights from roof to roof and out to two poles
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd9a0, toneMapped: false }), 160); const o = new THREE.Object3D(); let k = 0;
  const gy = ground(x0, z0); const pts = [[x0 - 11, z0 - 4], [x0 - 8, z0 - 1.4], [x0 - 4, z0 - 1.4], [x0, z0 - 1.4], [x0 + 4, z0 - 1.4], [x0 + 8, z0 - 1.4], [x0 + 11, z0 - 4]];
  for (let s = 0; s < pts.length - 1; s++) { const [ax, az] = pts[s], [bx, bz] = pts[s + 1]; for (let i = 0; i < 14; i++) { const u = (i + 0.5) / 14; o.position.set(ax + (bx - ax) * u, gy + 3.1 - Math.sin(u * PI) * 0.4, az + (bz - az) * u); o.updateMatrix(); bulbs.setMatrixAt(k++, o.matrix); } }
  [[x0 - 11, z0 - 4], [x0 + 11, z0 - 4]].forEach(([x, z]) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 3.2, 8), steel); p.position.set(x, ground(x, z) + 1.6, z); scene.add(p); post(x, z, 0.1, -5, 4); });
  bulbs.count = k; scene.add(bulbs); MKT.bulbs = bulbs;
  interact(x0 - 8, z0 - 2.2, 1.8, 'E · BUY A HOT CIDER (1 TDH)', () => { state.tdh = Math.max(0, state.tdh - 1); try { hud(); } catch (e) { } ciderSecret(); MKT.cups = (MKT.cups || 0) + 1; toast(['HOT CIDER. CINNAMON STICK INCLUDED. IT IS TOO HOT TO DRINK FOR NINE MINUTES.', 'ANOTHER CIDER. THE VENDOR NODS.', 'THREE CIDERS. YOU ARE A REGULAR NOW.'][Math.min(MKT.cups, 3) - 1]); });
  interact(x0, z0 - 2.2, 1.8, 'E · LOOK AT THE PRINTS', () => { toast('N3W PRINTS: MEMES ON PAPER, SIGNED, ONE OF EACH. THE VENDOR SAYS THE REAL ONES ARE ON CHAIN.'); });
  if (window.__MAP) MAP.places.push(['THE MARKET', x0, z0, x0, z0 - 4]);
})();
const ciderSecret = secret('cider', () => { }, []);
window.__FRAMES.push(dt => { try { const night = Math.min(1, (L.lamps || 0) * 1.4); MKT.warm.emissiveIntensity = 0.3 + 0.9 * night; MKT.bulbs.material.color.setRGB(0.55 + 0.45 * night, (0.55 + 0.45 * night) * 0.85, (0.55 + 0.45 * night) * 0.62); } catch (e) { } });
