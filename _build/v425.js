/* ================================================================
   v425 THE N3W BOARDWALK (2026-11-24)
   N3W CUTS, the zoetrope and the five sideshow boards stood on bare sand. They now share a boardwalk, the thing that
   makes a row of shops and tricks on a beach into Coney Island: a 35 degree arc of weathered planks laid across the
   walk, silver grey and brown, with dark gaps, nail heads and the odd replaced board, from the ring road's edge back
   to the shopfronts. ?boardwalk=0 off.
   ================================================================ */
const BWALK = { ok: false };
window.__BWALK = BWALK;
(function boardwalk() {
  if (!LOOK.on || /boardwalk=0/.test(location.search) || !window.__CUTS || !CUTS.ok) return;
  const a0 = 223.5 * PI / 180, a1 = 260.8 * PI / 180, r0 = 104.5, r1 = 110.6, segs = 160;
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512; const c = cv.getContext('2d'); const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = Math.min(ANISO, 4); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (c && c.fillRect && c.beginPath) { let sd = 4207; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647; let x = 0;
    while (x < 1024) { const w = 34 + Math.floor(rnd() * 8), v = rnd(), base = rnd() < 0.08 ? [150, 118, 84] : [112 + v * 36, 101 + v * 30, 88 + v * 24]; c.fillStyle = `rgb(${base.map(Math.round).join(',')})`; c.fillRect(x, 0, w, 512);
      for (let i = 0; i < 26; i++) { c.strokeStyle = `rgba(${rnd() < 0.5 ? '40,32,24' : '200,190,170'},${0.08 + rnd() * 0.12})`; c.lineWidth = 2 + rnd() * 2; c.beginPath(); const gx = x + 2 + rnd() * (w - 4); c.moveTo(gx, 0); c.bezierCurveTo(gx + rnd() * 6 - 3, 170, gx + rnd() * 6 - 3, 340, gx + rnd() * 4 - 2, 512); c.stroke(); }
      c.fillStyle = 'rgba(30,24,18,.6)'; c.fillRect(x + w - 4, 0, 4, 512); const cut = rnd() * 512; c.fillRect(x, cut, w, 2);
      c.fillStyle = 'rgba(30,26,22,.8)'; [64, 192, 320, 448].forEach(y => { c.beginPath(); c.arc(x + 7, y, 2.2, 0, PI * 2); c.arc(x + w - 9, y, 2.2, 0, PI * 2); c.fill(); }); x += w; }
    try { const tmp = document.createElement('canvas'); tmp.width = 1024; tmp.height = 512; const q = tmp.getContext('2d'); q.filter = 'blur(1.2px)'; q.drawImage(cv, 0, 0); c.drawImage(tmp, 0, 0); } catch (e) { }
  const gr = c.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, 'rgba(0,0,0,.10)'); gr.addColorStop(0.5, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.12)'); c.fillStyle = gr; c.fillRect(0, 0, 1024, 512); }
  // an arc strip with uv u along the walk (metres / 4) and v across it (metres / 4), so the planks lie across the walk
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= segs; i++) { const a = a0 + (a1 - a0) * i / segs; [r0, r1].forEach((r, j) => { const x = Math.sin(a) * r, z = Math.cos(a) * r; pos.push(x, Math.max(ground(x, z), 0.5) + 0.045, z); uv.push((a - a0) * 107.5 / 4, j ? (r1 - r0) / 4 : 0); }); if (i) { const b = (i - 1) * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); } }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  if (geo.attributes.normal.array[1] < 0) { idx.reverse(); geo.setIndex(idx); geo.computeVertexNormals(); }
  const mat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.86, metalness: 0, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  
  const deck = new THREE.Mesh(geo, mat); deck.receiveShadow = true; scene.add(deck); BWALK.deck = deck; BWALK.mat = mat;
  // the kerb: a low timber edge along the road side
  const kp = [], ki = []; for (let i = 0; i <= segs; i++) { const a = a0 + (a1 - a0) * i / segs, x = Math.sin(a) * r0, z = Math.cos(a) * r0, y = Math.max(ground(x, z), 0.5); kp.push(x, y - 0.05, z, x, y + 0.08, z); if (i) { const b = (i - 1) * 2; ki.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); } }
  const kg = new THREE.BufferGeometry(); kg.setAttribute('position', new THREE.Float32BufferAttribute(kp, 3)); kg.setIndex(ki); kg.computeVertexNormals();
  const kerb = new THREE.Mesh(kg, new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.9, side: THREE.DoubleSide })); scene.add(kerb);
  BWALK.ok = true; BWALK.a = [a0, a1]; BWALK.r = [r0, r1];
  try { if (window.__SNOWL && SNOWL.add) setTimeout(() => SNOWL.add(mat), 32000); } catch (e) { }
  if (window.__MAP) MAP.places.push(['THE N3W BOARDWALK', Math.sin(240 * PI / 180) * 107, Math.cos(240 * PI / 180) * 107, Math.sin(240 * PI / 180) * 100, Math.cos(240 * PI / 180) * 100]);
})();
