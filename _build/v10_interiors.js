/* ================================================================
   v10 THE BODEGA  ·  2026-11-21
   The 6529 Bodega was a brick box with a black lid, a plank counter and a white block for a fridge. A New York bodega
   is the most specific room there is: a worn black and white checker floor, a drop ceiling with fluorescent panels,
   a humming glass door cooler full of bottles, a gondola of boxes and cans down the middle, and a counter with the
   register, the lotto ticket rack, a tip jar and the scratch off bin. All of it here, procedural, no new downloads.
   ================================================================ */
const BODEGA = { cooler: null, tubes: null };
(function () {
  const bx = 17, bz = 66, w = 10, d = 14, h = 4.6, g = ground(bx, bz) + 0.02, fy = g + 0.13;
  const cvs = (W, H, f) => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d'); if (c && c.fillRect) f(c); const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO; return t; };
  // the old white block and its floating stock go
  scene.children.forEach(o => { if (!o.isMesh) return;
    if (o.material === MAT.white && Math.abs(o.position.x - (bx + w / 2 - 0.5)) < 0.05 && Math.abs(o.position.z - (bz + 3)) < 0.05) o.visible = false;
    if (o.isInstancedMesh && o.count === 48 && o.geometry.parameters && o.geometry.parameters.width === 0.28) o.visible = false; });

  /* checker linoleum, worn toward the door */
  const chk = cvs(512, 512, c => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { c.fillStyle = (i + j) % 2 ? '#2b2a2a' : '#c9c2b2'; c.fillRect(i * 64, j * 64, 64, 64); }
    for (let k = 0; k < 900; k++) { c.fillStyle = `rgba(${k % 2 ? '120,110,90' : '255,255,255'},${0.04 + v9hash(k, 1, 3) * 0.08})`; c.fillRect(v9hash(k, 2, 3) * 512, v9hash(k, 3, 3) * 512, 2 + v9hash(k, 4, 3) * 18, 1 + v9hash(k, 5, 3) * 3); } });
  chk.wrapS = chk.wrapT = THREE.RepeatWrapping; chk.repeat.set((w - 0.4) / 2.4, (d - 0.4) / 2.4);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.4, d - 0.4), new THREE.MeshStandardMaterial({ map: chk, roughness: 0.6, metalness: 0 })); floor.rotation.x = -PI / 2; floor.position.set(bx, fy, bz); floor.receiveShadow = true; scene.add(floor);

  /* drop ceiling: 2x2 ft tiles in a grid, four fluorescent panels */
  const tile = cvs(256, 256, c => { c.fillStyle = '#efece4'; c.fillRect(0, 0, 256, 256); for (let k = 0; k < 500; k++) { c.fillStyle = 'rgba(150,145,130,0.25)'; c.fillRect(v9hash(k, 6, 3) * 256, v9hash(k, 7, 3) * 256, 2, 2); } c.fillStyle = '#9c9a94'; c.fillRect(0, 0, 256, 6); c.fillRect(0, 0, 6, 256); });
  tile.wrapS = tile.wrapT = THREE.RepeatWrapping; tile.repeat.set((w - 0.4) / 0.61, (d - 0.4) / 0.61);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.4, d - 0.4), new THREE.MeshStandardMaterial({ map: tile, roughness: 0.9 })); ceil.rotation.x = PI / 2; ceil.position.set(bx, g + h - 0.35, bz); scene.add(ceil);
  const tubeM = new THREE.MeshBasicMaterial({ color: 0xf4fbff }); BODEGA.tubes = tubeM;
  [[-2, -3.6], [2, -3.6], [-2, 0.4], [2, 0.4], [-2, 4.4], [2, 4.4]].forEach(([x, z]) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), tubeM); p.rotation.x = PI / 2; p.position.set(bx + x, g + h - 0.36, bz + z); scene.add(p);
    const fr = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.03, 0.66), new THREE.MeshStandardMaterial({ color: 0xd8d6d0, roughness: 0.5 })); fr.position.set(bx + x, g + h - 0.35, bz + z); scene.add(fr); });
  practical(bx, g + h - 0.8, bz + 3, 0xeef6ff, 9, 10).userData.alwaysOn = 0.6;

  /* products: one label atlas, 8 designs */
  const lab = cvs(512, 64, c => { const pal = ['#d22a1e', '#2962ff', '#ffd400', '#1f8f4e', '#f26a1b', '#7b2cbf', '#111111', '#f4f2ee'];
    pal.forEach((col, i) => { c.fillStyle = col; c.fillRect(i * 64, 0, 64, 64); c.fillStyle = i === 7 ? '#d22a1e' : '#ffffff'; c.fillRect(i * 64 + 6, 24, 52, 14); c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(i * 64 + 10, 28, 30, 6); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(i * 64 + 4, 48, 56, 3); }); });
  const prodM = new THREE.MeshStandardMaterial({ map: lab, roughness: 0.55 });
  const pick = (geo, k) => { const g2 = geo.clone(), uv = g2.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, (k + uv.getX(i) * 0.9 + 0.05) / 8); return g2; };
  const boxG = [0, 1, 2, 3, 4, 5, 6, 7].map(k => pick(new THREE.BoxGeometry(0.2, 0.28, 0.14), k)), canG = [0, 1, 2, 3, 4, 5, 6, 7].map(k => pick(new THREE.CylinderGeometry(0.045, 0.045, 0.16, 10), k));
  const slots = { box: [[], [], [], [], [], [], [], []], can: [[], [], [], [], [], [], [], []] };
  const shelfM = new THREE.MeshStandardMaterial({ color: 0xe9e7e2, roughness: 0.45, metalness: 0.4 });
  const sb = (sx, sy, sz, x, y, z, mat) => { const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat || shelfM); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; scene.add(b); return b; };

  /* the gondola: two faced shelving down the middle of the shop */
  const gx = bx - 1.6, gz0 = bz + 0.6, gz1 = bz + 5.6, gL = gz1 - gz0, gzc = (gz0 + gz1) / 2;
  sb(0.08, 1.7, gL, gx, fy + 0.85, gzc); sb(0.95, 0.12, gL, gx, fy + 0.06, gzc, new THREE.MeshStandardMaterial({ color: 0x2b2b2e, roughness: 0.7 }));
  [0.12, 0.55, 0.98, 1.41].forEach((y, lvl) => { sb(0.9, 0.03, gL, gx, fy + y, gzc);
    [-1, 1].forEach(s => { for (let z = gz0 + 0.14; z < gz1 - 0.1; z += 0.22) { const k = Math.floor(v9hash(z * 7, lvl, s) * 8); const p = new V3(gx + s * 0.3, fy + y + 0.015, z);
      if (lvl % 2) { slots.can[k].push([p.x - 0.05, p.y + 0.08, p.z - 0.05, s]); slots.can[k].push([p.x + 0.05 * s, p.y + 0.08, p.z + 0.05, s]); } else slots.box[k].push([p.x, p.y + 0.14, p.z, s]); } }); });
  boxWalls(gx, gzc, 1.0, gL + 0.1, 0, -10, fy + 1.8);

  /* the cooler: three glass doors on the back wall, lit from inside, bottles on five shelves */
  const cx = bx + w / 2 - 0.55, cz = bz + 3.6, cW = 4.8, cH = 2.3;
  const body = sb(0.7, cH + 0.3, cW + 0.2, cx, fy + (cH + 0.3) / 2, cz, new THREE.MeshStandardMaterial({ color: 0x1b1d20, roughness: 0.5, metalness: 0.6 }));
  const glow = new THREE.MeshBasicMaterial({ color: 0xdff2ff }); BODEGA.cooler = glow;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(cW, cH), glow); back.rotation.y = -PI / 2; back.position.set(cx + 0.24, fy + 0.15 + cH / 2, cz); scene.add(back);
  // the cooler body is solid black; open its front by putting the interior in front of it
  body.scale.set(0.15, 1, 1); body.position.x = cx + 0.33;
  [-1, 1].forEach(sd => sb(0.72, cH + 0.3, 0.06, cx, fy + (cH + 0.3) / 2, cz + sd * (cW / 2 + 0.07), new THREE.MeshStandardMaterial({ color: 0x1b1d20, roughness: 0.5, metalness: 0.6 })));
  sb(0.72, 0.1, cW + 0.2, cx, fy + cH + 0.25, cz, new THREE.MeshStandardMaterial({ color: 0x1b1d20, roughness: 0.5, metalness: 0.6 })); boxWalls(cx, cz, 0.75, cW + 0.2, 0, -10, fy + cH + 0.3);
  const btlG = new THREE.CylinderGeometry(0.035, 0.04, 0.24, 8), capG = new THREE.CylinderGeometry(0.015, 0.02, 0.06, 6);
  const bcols = [0x2fb34a, 0xd22a1e, 0xf26a1b, 0x2962ff, 0xf4e04d, 0xe8e8e8, 0x8a4b2a], btl = new THREE.InstancedMesh(btlG, new THREE.MeshStandardMaterial({ roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.92 }), 400);
  let nb = 0; const m4 = new THREE.Matrix4(), col = new THREE.Color();
  for (let lv = 0; lv < 5; lv++) { const y = fy + 0.35 + lv * 0.44; sb(0.55, 0.02, cW, cx, y - 0.01, cz, new THREE.MeshStandardMaterial({ color: 0xcfd6dc, roughness: 0.3, metalness: 0.7 }));
    for (let z = cz - cW / 2 + 0.08; z < cz + cW / 2 - 0.05 && nb < 400; z += 0.09) for (let r = 0; r < 2 && nb < 400; r++) { m4.makeTranslation(cx - 0.12 + r * 0.14, y + 0.12, z); btl.setMatrixAt(nb, m4); btl.setColorAt(nb++, col.setHex(bcols[Math.floor(v9hash(z * 9, lv, r) * bcols.length)])); } }
  btl.count = nb; scene.add(btl);
  const door = new THREE.MeshStandardMaterial({ color: 0xbfd8e6, roughness: 0.02, metalness: 0.9, transparent: true, opacity: 0.18, depthWrite: false });
  const frameM = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.4, metalness: 0.7 });
  for (let i = 0; i < 3; i++) { const z = cz - cW / 2 + (i + 0.5) * cW / 3; const gl = new THREE.Mesh(new THREE.PlaneGeometry(cW / 3 - 0.08, cH - 0.06), door); gl.rotation.y = -PI / 2; gl.position.set(cx - 0.36, fy + 0.15 + cH / 2, z); scene.add(gl);
    sb(0.05, cH, 0.06, cx - 0.37, fy + 0.15 + cH / 2, z - cW / 6, frameM); const hd = sb(0.05, 0.9, 0.04, cx - 0.42, fy + 1.2, z + cW / 6 - 0.14, new THREE.MeshStandardMaterial({ color: 0xc9ccd0, roughness: 0.2, metalness: 1 })); }
  sb(0.05, cH, 0.06, cx - 0.37, fy + 0.15 + cH / 2, cz + cW / 2, frameM); sb(0.06, 0.1, cW + 0.1, cx - 0.37, fy + 0.15 + cH, cz, frameM); sb(0.06, 0.15, cW + 0.1, cx - 0.37, fy + 0.08, cz, frameM);
  const hdr = cvs(512, 64, c => { c.fillStyle = '#d22a1e'; c.fillRect(0, 0, 512, 64); c.fillStyle = '#ffffff'; c.font = '700 40px Helvetica,Arial,sans-serif'; c.textAlign = 'center'; c.fillText && c.fillText('ICE COLD · JPGs · GM', 256, 47); });
  const hp = new THREE.Mesh(new THREE.PlaneGeometry(cW, 0.4), new THREE.MeshStandardMaterial({ map: hdr, emissive: 0xffffff, emissiveMap: hdr, emissiveIntensity: 0.35 })); hp.rotation.y = -PI / 2; hp.position.set(cx - 0.36, fy + cH + 0.5, cz); scene.add(hp);

  /* the counter gets a laminate top, a register, the lotto rack, a tip jar and a scratch off bin */
  const kx = bx + 1.6, kz = bz - 3;
  sb(1.4, 0.06, 5.2, kx, g + 1.13, kz, new THREE.MeshStandardMaterial({ color: 0xcfc6b4, roughness: 0.35 }));
  const reg = sb(0.5, 0.18, 0.4, kx + 0.1, g + 1.25, kz + 1.4, new THREE.MeshStandardMaterial({ color: 0x2b2d31, roughness: 0.4, metalness: 0.5 }));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.24), new THREE.MeshBasicMaterial({ color: 0x7fe0a8 })); scr.position.set(kx - 0.05, g + 1.5, kz + 1.4); scr.rotation.set(0, -PI / 2, 0); scr.rotateX(-0.3); scene.add(scr);
  sb(0.06, 0.28, 0.06, kx + 0.1, g + 1.42, kz + 1.4, new THREE.MeshStandardMaterial({ color: 0x2b2d31 }));
  const lotto = cvs(256, 256, c => { const pal = ['#ffd400', '#2fb34a', '#d22a1e', '#2962ff', '#f26a1b', '#ff5a8a']; for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) { c.fillStyle = pal[(i * 2 + j) % 6]; c.fillRect(j * 42 + 2, i * 64 + 2, 38, 60); c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(j * 42 + 6, i * 64 + 10, 30, 8); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(j * 42 + 8, i * 64 + 30, 26, 20); } });
  const rack = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), new THREE.MeshStandardMaterial({ map: lotto, roughness: 0.4 })); rack.position.set(kx + 0.66, g + 1.75, kz - 0.8); rack.rotation.y = -PI / 2; scene.add(rack);
  sb(0.04, 1.08, 1.08, kx + 0.68, g + 1.75, kz - 0.8, new THREE.MeshStandardMaterial({ color: 0x1b1b1d, roughness: 0.4, metalness: 0.5 }));
  const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.2, 14, 1, true), new THREE.MeshStandardMaterial({ color: 0xdfeef2, transparent: true, opacity: 0.35, roughness: 0.05, side: THREE.DoubleSide })); jar.position.set(kx - 0.35, g + 1.26, kz + 0.6); scene.add(jar);
  const tips = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.07, 10), new THREE.MeshStandardMaterial({ color: 0x6f9f62, roughness: 0.9 })); tips.position.set(kx - 0.35, g + 1.2, kz + 0.6); scene.add(tips);
  [-0.3, 0, 0.3].forEach((dz, i) => { const cand = sb(0.32, 0.12, 0.26, kx - 0.4, g + 1.22, kz - 1.8 + dz, new THREE.MeshStandardMaterial({ map: lab, roughness: 0.6 })); });
  // the shelves behind the counter: smokes, batteries, aspirin, a little of everything
  const wx = bx + w / 2 - 0.45; [1.2, 1.65, 2.1].forEach((y, lvl) => { sb(0.4, 0.03, 3.2, wx, g + y, kz - 0.4);
    for (let z = kz - 1.9; z < kz + 1.1; z += 0.17) { const k = Math.floor(v9hash(z * 5, lvl, 9) * 8); slots.box[k].push([wx - 0.05, g + y + 0.155, z, -1]); } });

  /* instance all products */
  const s1 = new V3(1, 1, 1), q = new THREE.Quaternion();
  ['box', 'can'].forEach(kind => slots[kind].forEach((L, k) => { if (!L.length) return; const im = new THREE.InstancedMesh((kind === 'box' ? boxG : canG)[k], prodM, L.length);
    L.forEach(([x, y, z, s], i) => { q.setFromAxisAngle(new V3(0, 1, 0), s > 0 ? -PI / 2 : PI / 2); m4.compose(new V3(x, y, z), q, s1); im.setMatrixAt(i, m4); }); im.castShadow = im.receiveShadow = true; scene.add(im); }));

  // a rubber mat at the door and an ATM in the corner
  sb(1.4, 0.015, 2.4, bx - w / 2 + 1.0, fy + 0.008, bz, new THREE.MeshStandardMaterial({ color: 0x232325, roughness: 1 }));
  const atm = sb(0.7, 1.6, 0.6, bx - w / 2 + 0.6, fy + 0.8, bz - d / 2 + 0.7, new THREE.MeshStandardMaterial({ color: 0x3a3e45, roughness: 0.4, metalness: 0.6 })); boxWalls(bx - w / 2 + 0.6, bz - d / 2 + 0.7, 0.7, 0.6, 0, -10, fy + 1.6);
  const atmS = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), new THREE.MeshBasicMaterial({ color: 0x5fb0ff })); atmS.position.set(bx - w / 2 + 0.6, fy + 1.25, bz - d / 2 + 1.01); scene.add(atmS);
  BODEGA.atm = atmS;
})();
function bodegaFrame() {
  if (BODEGA.tubes) { const f = 0.93 + 0.07 * Math.sin(T * 120) * (Math.sin(T * 0.7) > 0.96 ? 1 : 0); BODEGA.tubes.color.setRGB(0.96 * f, f, f); }
  if (BODEGA.atm) BODEGA.atm.material.color.setHSL(0.58, 0.9, 0.55 + 0.08 * Math.sin(T * 2));
}
window.__BODEGA = BODEGA;
