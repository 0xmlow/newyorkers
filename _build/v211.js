/* ================================================================
   v211 THE LOOK: HONOR BOXES (2026-11-23)
   The row of coin operated newspaper boxes chained together on a New York corner, each a different colour and
   each with its paper in the window: THE MEME TIMES, N3W POST, DAILY GM, THE FLOOR STREET JOURNAL and a free real
   estate weekly. At (-13, 75), by the census walk. ?honor=0 off.
   ================================================================ */
(function honorBoxes() {
  if (!LOOK.on || /honor=0/.test(location.search)) return; const x0 = -13, z0 = 75, g = ground(x0, z0) + 0.02, ry = 0;
  const papers = [['THE MEME TIMES', '#1f4fd8'], ['N3W POST', '#c8102e'], ['DAILY GM', '#f2c200'], ['FLOOR ST JOURNAL', '#2f4a33'], ['FREE: REAL ESTATE', '#e9e4da']];
  const leg = new THREE.MeshStandardMaterial({ color: 0x222426, roughness: 0.5, metalness: 0.6 });
  papers.forEach(([nm, col], i) => { const x = x0 - 1.6 + i * 0.8; const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.85, 0.5), new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, metalness: 0.25 })); body.position.set(x, g + 0.55 + 0.42, z0); body.castShadow = true; scene.add(body);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.06, 0.52), leg); lid.position.set(x, g + 1.42, z0); scene.add(lid);
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.4), leg); st.position.set(x, g + 0.28, z0); scene.add(st);
    const pg = signTex([{ t: nm, s: 0.12, f: 'Georgia, serif' }, { t: 'MEME ISLAND EDITION', s: 0.07 }, { t: '25¢', s: 0.1 }], 256, 200, '#f4f1e8', '#111111');
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.34), new THREE.MeshStandardMaterial({ map: pg, roughness: 0.2, metalness: 0.1 })); win.position.set(x, g + 1.12, z0 - 0.252); win.rotation.y = PI; scene.add(win); });
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 3.9, 4), leg); chain.rotation.z = PI / 2; chain.position.set(x0, g + 0.6, z0 + 0.27); scene.add(chain);
  boxWalls(x0, z0, 4.0, 0.55, 0, -5, g + 1.4);
})();
