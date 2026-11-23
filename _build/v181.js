/* ================================================================
   v181 THE LOOK: MANHOLES (2026-11-23)
   Cast iron covers in the ring road and the promenade: a rim, a waffle of raised squares worn shiny where the
   tyres go, and N3W YORK SEWER cast round the edge. ?manholes=0 off.
   ================================================================ */
const MANH = { list: [] };
window.__MANH = MANH;
(function manholes() {
  if (!LOOK.on || /manholes=0/.test(location.search)) return;
  const cv = document.createElement('canvas'); cv.width = cv.height = 512; const c = cv.getContext('2d');
  if (c && c.fillRect && c.arc) { c.fillStyle = '#1b1a19'; c.fillRect(0, 0, 512, 512); c.translate(256, 256);
    c.fillStyle = '#2b2927'; c.beginPath(); c.arc(0, 0, 250, 0, PI * 2); c.fill(); c.strokeStyle = '#4a4642'; c.lineWidth = 14; c.beginPath(); c.arc(0, 0, 236, 0, PI * 2); c.stroke();
    c.save(); c.beginPath(); c.arc(0, 0, 160, 0, PI * 2); c.clip(); for (let x = -170; x < 170; x += 26) for (let y = -170; y < 170; y += 26) { const w = Math.hypot(x, y) < 90 ? 0.25 : 0; c.fillStyle = `rgba(${110 + w * 300 | 0},${104 + w * 280 | 0},${96 + w * 260 | 0},1)`; c.fillRect(x + 3, y + 3, 18, 18); } c.restore();
    c.strokeStyle = '#4a4642'; c.lineWidth = 8; c.beginPath(); c.arc(0, 0, 166, 0, PI * 2); c.stroke();
    if (c.fillText) { c.fillStyle = '#6d6862'; c.font = '700 34px "Archivo Black", Impact, sans-serif'; c.textAlign = 'center'; const s = 'N3W YORK SEWER · N3W YORK SEWER · '; for (let i = 0; i < s.length; i++) { const a = i / s.length * PI * 2; c.save(); c.rotate(a); c.fillText(s[i], 0, -192); c.restore(); } } }
  const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO;
  const mat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.55, metalness: 0.55, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const spots = []; for (let k = 0; k < 8; k++) spots.push([P2(12 + k * 45, k % 2 ? 98 : 102), 0.665 + 0.012, 0.42]); for (let k = 0; k < 4; k++) spots.push([P2(30 + k * 90, 40), 0.665 + 0.012, 0.36]);
  spots.forEach(([[x, z], y, r]) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 40), mat); m.rotation.x = -PI / 2; m.rotation.z = Math.random() * PI; m.position.set(x, y, z); m.receiveShadow = true; scene.add(m); MANH.list.push(m); });
})();
