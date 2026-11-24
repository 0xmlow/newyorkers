/* ================================================================
   v389 ILLUSION: THE FLOATING CROSSWALK (2026-11-24)
   Where the lighthouse path crosses the ring road on the north side, a ladder crosswalk whose bars float: from the
   footprints on the kerb, seven white slabs hang a hand above the asphalt, lit on top, shaded on their faces, their
   shadows on the road beneath them. Step off the footprints and they slide into long painted wedges. It is paint,
   worked out the way the 3D crossings in Iceland and India are: every corner of seven imaginary floating slabs is
   projected from the footprints' eye height down onto the road, and the paint goes where the corners land.
   ?xwalk3d=0 off.
   ================================================================ */
const XW3 = { ok: false };
window.__XW3 = XW3;
(function floatingCrosswalk() {
  if (!LOOK.on || /xwalk3d=0/.test(location.search)) return;
  const z0 = -ROAD_R, gr = Math.max(ground(0, z0), 0.66) + 0.003, V = { x: 0, y: 0, z: -92.6 }; V.y = ground(V.x, V.z) + 1.62 - gr;   // the eye, over the footprints on the kerb path
  const X0 = -4.5, X1 = 4.5, Z0 = -104, Z1 = -96, S = 112, Wc = (X1 - X0) * S, Hc = (Z1 - Z0) * S;
  const cv = document.createElement('canvas'); cv.width = Wc; cv.height = Hc; const c = cv.getContext('2d');
  const toC = (x, z) => [(x - X0) * S, (z - Z0) * S];
  const proj = (x, y, z) => { const k = V.y / (V.y - y); return toC(V.x + (x - V.x) * k, V.z + (z - V.z) * k); };   // the road point behind (x, y, z) from the eye
  const poly = (pts, fill) => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fillStyle = fill; c.fill(); };
  if (c && c.fillRect && c.beginPath) {
    c.clearRect(0, 0, Wc, Hc);
    // the flat ladder rails: the real paint, the reference the slabs float over
    [-3.9, 3.9].forEach(x => poly([toC(x - 0.12, -103.7), toC(x + 0.12, -103.7), toC(x + 0.12, -96.3), toC(x - 0.12, -96.3)], 'rgba(238,236,228,.93)'));
    const bars = [-3, -2, -1, 0, 1, 2, 3].map(x => ({ x0: x - 0.28, x1: x + 0.28, zN: -96.75, zF: -101.6, yb: 0.11, yt: 0.25 }));
    // shadows first, soft, straight under each slab and a little to the east and north (the noon sun from the south west)
    c.save(); c.filter = 'blur(6px)'; bars.forEach(b => poly([toC(b.x0 + 0.09, b.zF - 0.05), toC(b.x1 + 0.09, b.zF - 0.05), toC(b.x1 + 0.09, b.zN - 0.05), toC(b.x0 + 0.09, b.zN - 0.05)], 'rgba(8,9,12,.62)')); c.restore();
    // then each slab, far ones first: its visible side, its near face, its top
    bars.sort((a, b) => Math.abs(b.x0 + b.x1) - Math.abs(a.x0 + a.x1)).forEach(b => {
      if (V.x < b.x0) poly([proj(b.x0, b.yb, b.zN), proj(b.x0, b.yb, b.zF), proj(b.x0, b.yt, b.zF), proj(b.x0, b.yt, b.zN)], 'rgba(150,147,140,.97)');
      if (V.x > b.x1) poly([proj(b.x1, b.yb, b.zN), proj(b.x1, b.yb, b.zF), proj(b.x1, b.yt, b.zF), proj(b.x1, b.yt, b.zN)], 'rgba(150,147,140,.97)');
      poly([proj(b.x0, b.yb, b.zN), proj(b.x1, b.yb, b.zN), proj(b.x1, b.yt, b.zN), proj(b.x0, b.yt, b.zN)], 'rgba(196,193,184,.98)');
      poly([proj(b.x0, b.yt, b.zN), proj(b.x1, b.yt, b.zN), proj(b.x1, b.yt, b.zF), proj(b.x0, b.yt, b.zF)], 'rgba(244,242,235,.98)');
    });
  }
  const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
  m.rotation.x = -PI / 2; m.position.set((X0 + X1) / 2, gr + 0.02, (Z0 + Z1) / 2); m.receiveShadow = true; scene.add(m); XW3.mesh = m;
  // a paved landing on the kerb with the footprints, so there is somewhere to stand
  const gp = ground(V.x, V.z), fp = document.createElement('canvas'); fp.width = 256; fp.height = 256; const f = fp.getContext('2d');
  if (f && f.fillRect && f.ellipse && f.beginPath) { f.fillStyle = '#8e8478'; f.fillRect(0, 0, 256, 256); f.strokeStyle = 'rgba(40,36,32,.5)'; f.lineWidth = 3; for (let i = 0; i <= 4; i++) { f.beginPath(); f.moveTo(i * 64, 0); f.lineTo(i * 64, 256); f.stroke(); f.beginPath(); f.moveTo(0, i * 64); f.lineTo(256, i * 64); f.stroke(); }
    f.fillStyle = '#efe8da'; [[100, 1], [156, -1]].forEach(([x, s]) => { f.beginPath(); f.ellipse(x, 120, 17, 40, s * 0.08, 0, PI * 2); f.fill(); f.beginPath(); f.ellipse(x + s * 2, 178, 14, 18, 0, 0, PI * 2); f.fill(); }); }
  const ft = new THREE.CanvasTexture(fp); ft.encoding = THREE.sRGBEncoding;
  const pad = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 1.6), [0, 0, new THREE.MeshStandardMaterial({ map: ft, roughness: 0.85 }), 0, 0, 0].map(x => x || FACM.stoneD)); pad.position.set(V.x, gp + 0.04, V.z + 0.1); pad.receiveShadow = true; scene.add(pad);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 3.2), FACM.stoneD); strip.position.set(V.x, gp + 0.03, -94.5); strip.receiveShadow = true; scene.add(strip);
  XW3.ok = true; XW3.V = [V.x, gr + V.y, V.z]; XW3.P = [0, gr, z0];
  if (window.__MAP) MAP.places.push(['THE FLOATING CROSSWALK', 0, z0, 0, -92]);
})();
