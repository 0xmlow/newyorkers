/* ================================================================
   v243 THE MEME RIVER: MEDALLIONS AND THE MOUTH (2026-11-23)
   Where each spoke of the river crosses the promenade ring, a 3.4 metre Open Eye Flower medallion is set into the
   paving, navy enamel in a bronze rim, like the seals in a New York plaza. Where the four spokes pour into THE
   FLOOR, a bronze band runs round the Floor's edge with its lettering inlaid: THE MEMES BY 6529 · N3W MEME
   ISLAND · BY MLOW · ALL CC0, repeating round the circle. ?river=0 turns them off with the river.
   ================================================================ */
(function riverMouth() {
  if (!window.__RIVER || !RIVER.mesh) return; const PY = 0.665 + 0.02;
  const fl = tex('assets/iv_flower.webp');
  const disc = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.1, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 });
  const dc = document.createElement('canvas'); dc.width = dc.height = 512; const c = dc.getContext('2d'); const dt = new THREE.CanvasTexture(dc); dt.encoding = THREE.sRGBEncoding; disc.map = dt;
  const drawDisc = img => { if (!c || !c.arc || !c.fill) return; c.fillStyle = '#0b1430'; c.fillRect(0, 0, 512, 512); c.lineWidth = 3;
    for (let r = 60; r < 250; r += 14) { c.strokeStyle = r % 28 ? 'rgba(41,98,255,.55)' : 'rgba(8,222,255,.45)'; c.beginPath(); for (let a = 0; a <= 64; a++) { const t = a / 64 * PI * 2, rr = r + Math.sin(t * 3 + r * 0.05) * 6; const x = 256 + Math.cos(t) * rr, y = 256 + Math.sin(t) * rr; a ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    if (img) c.drawImage(img, 136, 136, 240, 240); dt.needsUpdate = true; };
  drawDisc(null); const im = new Image(); im.onload = () => { try { drawDisc(im); } catch (e) { } }; im.src = 'assets/iv_flower.webp';
  const bronze = new THREE.MeshStandardMaterial({ color: 0x8a6a36, roughness: 0.32, metalness: 0.92, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5 });
  [0, 90, 180, 270].forEach(deg => { const a = deg * PI / 180, x = Math.cos(a) * 40, z = Math.sin(a) * 40;
    const d = new THREE.Mesh(new THREE.CircleGeometry(1.6, 48), disc); d.rotation.x = -PI / 2; d.rotation.z = -a; d.position.set(x, PY + 0.004, z); d.renderOrder = 3; scene.add(d);
    const r = new THREE.Mesh(new THREE.RingGeometry(1.6, 1.78, 48), bronze); r.rotation.x = -PI / 2; r.position.set(x, PY + 0.005, z); r.renderOrder = 3; scene.add(r); });
  // the bronze band round the Floor with its lettering
  const lc = document.createElement('canvas'); lc.width = 2048; lc.height = 64; const l = lc.getContext('2d'); const lt = new THREE.CanvasTexture(lc); lt.encoding = THREE.sRGBEncoding; lt.wrapS = THREE.RepeatWrapping; lt.repeat.set(4, 1); lt.anisotropy = ANISO;
  const drawBand = () => { if (!l || !l.fillText) return; l.fillStyle = '#6e5228'; l.fillRect(0, 0, 2048, 64); l.fillStyle = '#e9cf8e'; l.textBaseline = 'middle'; l.font = '700 36px "Archivo Black",Impact,sans-serif';
    l.fillText('THE MEMES BY 6529  ·  N3W MEME ISLAND  ·  BY MLOW  ·  ALL CC0  ·  ', 24, 34); l.fillStyle = 'rgba(0,0,0,.35)'; l.fillRect(0, 0, 2048, 3); l.fillRect(0, 61, 2048, 3); lt.needsUpdate = true; };
  drawBand(); if (!window.__fontsReady) addEventListener('n3wfonts', drawBand, { once: true });
  const bm = new THREE.MeshStandardMaterial({ map: lt, roughness: 0.35, metalness: 0.85, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5 });
  const band = new THREE.Mesh(new THREE.RingGeometry(16.5, 17.3, 160, 1), bm); band.rotation.x = -PI / 2; band.position.y = PY + 0.003; band.renderOrder = 3; scene.add(band);
  // RingGeometry's uv is planar: give it uv along the circle so the lettering runs round
  const pos = band.geometry.attributes.position, uv = band.geometry.attributes.uv; for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i); uv.setXY(i, (Math.atan2(y, x) / (PI * 2) + 0.5), Math.hypot(x, y) > 16.9 ? 1 : 0); } uv.needsUpdate = true;
  RIVER.mouth = true;
})();
