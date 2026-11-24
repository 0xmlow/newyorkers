/* ================================================================
   v368 REALISM: PUDDLES (2026-11-24)
   When it rains (the island's weather, v18) water collects where the paving dips: thirty irregular puddles along the
   promenade, the river's spokes and the plaza, mirror smooth, rippled by the drops, drying out over a few minutes
   after the rain stops. On a dry day they are not there.
   ================================================================ */
const PUD = { w: 0 };
window.__PUD = PUD;
(function puddles() {
  if (!LOOK.on || /puddles=0/.test(location.search)) return;
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d'); if (!c || !c.beginPath) return; c.clearRect(0, 0, 128, 128); c.fillStyle = '#fff'; c.beginPath();
  for (let i = 0; i <= 24; i++) { const a = i / 24 * PI * 2, r = 44 + Math.sin(a * 3) * 10 + Math.sin(a * 5 + 1) * 6; const x = 64 + Math.cos(a) * r, y = 64 + Math.sin(a) * r * 0.7; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.fill();
  const mat = new THREE.MeshStandardMaterial({ color: 0x1a2028, roughness: 0.03, metalness: 0.9, alphaMap: new THREE.CanvasTexture(cv), transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6, envMapIntensity: 1.6 }); PUD.mat = mat;
  const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-PI / 2), mat, 30), o = new THREE.Object3D(); let k = 0;
  for (let i = 0; i < 18; i++) { const a = (i + Math.random() * 0.6) / 18 * PI * 2, r = 38.5 + Math.random() * 3; o.position.set(Math.cos(a) * r, 0.665 + 0.02, Math.sin(a) * r); o.rotation.y = Math.random() * 6; const s = 0.8 + Math.random() * 1.4; o.scale.set(s, 1, s * (0.6 + Math.random() * 0.5)); o.updateMatrix(); im.setMatrixAt(k++, o.matrix); }
  for (let i = 0; i < 12; i++) { const z = 20 + Math.random() * 70, x = (Math.random() < 0.5 ? -1 : 1) * (1.4 + Math.random() * 0.4); o.position.set(x, 0.665 + 0.02, i % 2 ? z : -z * 0.4); o.rotation.y = Math.random() * 6; const s = 0.6 + Math.random() * 0.9; o.scale.set(s, 1, s * 0.7); o.updateMatrix(); im.setMatrixAt(k++, o.matrix); }
  im.count = k; im.renderOrder = 3; scene.add(im); PUD.im = im;
})();
window.__FRAMES.push(dt => { try { if (!PUD.mat || typeof WX === 'undefined') return; const tgt = WX.wet > 0.3 ? 1 : 0; PUD.w += (tgt - PUD.w) * Math.min(1, dt * (tgt ? 0.2 : 0.01)); PUD.mat.opacity = 0.85 * PUD.w; PUD.im.visible = PUD.w > 0.02; } catch (e) { } });
