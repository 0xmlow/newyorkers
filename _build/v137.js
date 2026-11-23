/* ================================================================
   v137 REAR WINDOW (2026-11-23)
   After dark the walk up's lit windows show the lives behind them: a couple slow dancing, somebody at a desk in
   monitor blue, a TV flickering on two heads over a sofa back, a cook at the stove, a guitarist, someone pacing
   on the phone, a cat in the window, a room of plants and one lamp. Each is a warm room with a figure moving in
   it, behind the curtains, only while that window is lit. Watch them from across the street for a while and
   one of them watches you back.
   ================================================================ */
const REARW = { v: [], watch: 0 };
window.__REARW = REARW;
(function rearWindow() {
  const kinds = ['dance', 'desk', 'tv', 'cook', 'guitar', 'phone', 'cat', 'plants'];
  const room = (kind) => { const cv = document.createElement('canvas'); cv.width = 128; cv.height = 224; const c = cv.getContext('2d'); if (!c || !c.createLinearGradient || !c.arc) return null;
    const warm = kind === 'desk' ? ['#24324a', '#121a2a'] : kind === 'tv' ? ['#1d2a44', '#0e1422'] : ['#f2c98a', '#a86a3a']; const g = c.createLinearGradient(0, 0, 0, 224); g.addColorStop(0, warm[0]); g.addColorStop(1, warm[1]); c.fillStyle = g; c.fillRect(0, 0, 128, 224);
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(0, 150, 128, 74); c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(70, 30, 40, 50);
    if (kind === 'plants') { c.fillStyle = '#1a2a1a'; for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(15 + i * 24, 150, 14, 34, 0, 0, PI * 2); c.fill(); } c.fillStyle = '#fff2c0'; c.beginPath(); c.arc(100, 90, 12, 0, PI * 2); c.fill(); }
    if (kind === 'tv') { c.fillStyle = '#0a0d14'; c.fillRect(0, 160, 128, 64); [40, 84].forEach(x => { c.beginPath(); c.arc(x, 150, 15, 0, PI * 2); c.fill(); }); }
    if (kind === 'desk') { c.fillStyle = '#0a0d14'; c.fillRect(10, 150, 108, 8); c.fillStyle = '#7ad8ff'; c.fillRect(70, 112, 40, 28); }
    if (kind === 'cook') { c.fillStyle = '#3a2a1a'; c.fillRect(0, 160, 128, 64); c.fillStyle = 'rgba(255,255,255,0.25)'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(30 + i * 8, 120 - i * 18, 10, 0, PI * 2); c.fill(); } }
    // curtains at both sides
    c.fillStyle = 'rgba(122,31,42,0.85)'; c.fillRect(0, 0, 18, 224); c.fillRect(110, 0, 18, 224); const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; return t; };
  const sil = (kind) => { const cv = document.createElement('canvas'); cv.width = 128; cv.height = 224; const c = cv.getContext('2d'); if (!c || !c.arc) return null; c.fillStyle = '#0b0908';
    const fig = (x, y, s) => { c.beginPath(); c.arc(x, y, 11 * s, 0, PI * 2); c.fill(); c.beginPath(); c.moveTo(x - 20 * s, y + 70 * s); c.quadraticCurveTo(x - 22 * s, y + 16 * s, x, y + 14 * s); c.quadraticCurveTo(x + 22 * s, y + 16 * s, x + 20 * s, y + 70 * s); c.fill(); c.fillRect(x - 16 * s, y + 68 * s, 32 * s, 90 * s); };
    if (kind === 'dance') { fig(52, 70, 1); fig(76, 64, 1.05); } else if (kind === 'desk' || kind === 'cook' || kind === 'phone') fig(64, 78, 1); else if (kind === 'guitar') { fig(64, 70, 1); c.beginPath(); c.ellipse(72, 160, 18, 13, 0.5, 0, PI * 2); c.fill(); c.fillRect(70, 118, 46, 5); }
    else if (kind === 'cat') { c.beginPath(); c.ellipse(64, 196, 20, 15, 0, 0, PI * 2); c.fill(); c.beginPath(); c.arc(64, 174, 10, 0, PI * 2); c.fill(); c.beginPath(); c.moveTo(56, 168); c.lineTo(58, 156); c.lineTo(63, 166); c.moveTo(65, 166); c.lineTo(70, 156); c.lineTo(72, 168); c.fill(); c.lineWidth = 4; c.strokeStyle = '#0b0908'; c.beginPath(); c.moveTo(82, 200); c.quadraticCurveTo(100, 196, 96, 176); c.stroke(); }
    else return null; if (kind === 'phone') { c.fillRect(74, 82, 8, 14); } const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; return t; };
  const list = BROWN.wins.filter(w => w.f >= 1 && !(w.f === 2 && w.k === 1));
  list.forEach((w, i) => { const kind = kinds[i % kinds.length], rt = room(kind); if (!rt) return; const y = BROWN.g0 + 1.9 + w.f * 3.1, z = BROWN_AT.z - 2.4 + w.k * 2.4, x = BROWN.fx - 0.02;
    const rm = new THREE.Mesh(new THREE.PlaneGeometry(1.06, 1.86), new THREE.MeshBasicMaterial({ map: rt, transparent: true, opacity: 0, depthWrite: false, toneMapped: false })); rm.position.set(x, y, z); rm.rotation.y = -PI / 2; scene.add(rm);
    const st = sil(kind); let s = null; if (st) { s = new THREE.Mesh(new THREE.PlaneGeometry(1.06, 1.86), new THREE.MeshBasicMaterial({ map: st, transparent: true, opacity: 0, depthWrite: false })); s.position.set(x - 0.004, y, z); s.rotation.y = -PI / 2; scene.add(s); }
    REARW.v.push({ w, kind, rm, s, x, y, z, ph: i * 1.3 }); });
})();
const rearSecret = secret('rearwindow', () => { toast('YOU HAVE BEEN WATCHING THE WINDOWS FOR A WHILE NOW. THE GUY ON THE PHONE STOPS PACING AND LOOKS STRAIGHT DOWN AT YOU. YOU LOOK AWAY.', 'blue'); });
function rearFrame(dt) {
  const d = Math.hypot(P.x - (BROWN.fx - 10), P.z - BROWN_AT.z); if (d > 120) return; const night = Math.min(1, (L.lamps || 0) * 1.4);
  REARW.v.forEach(v => { const k = v.w.on ? night : 0; v.rm.material.opacity = k; v.rm.visible = k > 0.01; if (v.s) { v.s.material.opacity = k * 0.92; v.s.visible = k > 0.01; } if (k < 0.01) return; const t = LIFE.t + v.ph;
    if (v.kind === 'tv' || v.kind === 'desk') { const f = 0.75 + 0.25 * Math.abs(Math.sin(t * (v.kind === 'tv' ? 7.3 : 0.8))) * (v.kind === 'tv' ? Math.abs(Math.sin(t * 2.1)) : 1); v.rm.material.color.setScalar(f); }
    if (!v.s) return; const s = v.s; s.position.y = v.y; s.rotation.z = 0;
    if (v.kind === 'dance') { s.rotation.z = Math.sin(t * 0.9) * 0.06; s.position.z = v.z + Math.sin(t * 0.45) * 0.08; }
    else if (v.kind === 'cook') s.position.z = v.z + Math.sin(t * 0.35) * 0.22; else if (v.kind === 'phone') s.position.z = v.z + Math.sin(t * 0.25) * 0.3;
    else if (v.kind === 'guitar') { s.rotation.z = Math.sin(t * 2.2) * 0.03; s.position.y = v.y + Math.abs(Math.sin(t * 2.2)) * 0.015; } else if (v.kind === 'cat') s.position.y = v.y + Math.sin(t * 1.4) * 0.005; else if (v.kind === 'desk') s.position.y = v.y + Math.sin(t * 0.2) * 0.01; });
  const across = P.x < BROWN.fx - 4 && P.x > BROWN.fx - 30 && Math.abs(P.z - BROWN_AT.z) < 14 && night > 0.5;
  if (across) { const f = new V3(0, 0, -1).applyQuaternion(camera.quaternion), to = new V3(BROWN.fx - P.x, BROWN.g0 + 6 - P.y - 1.7, BROWN_AT.z - P.z).normalize(); if (f.dot(to) > 0.85) { REARW.watch += dt; if (REARW.watch > 20) rearSecret(); } }
}
window.__FRAMES.push(dt => { try { rearFrame(dt); } catch (e) { if (!REARW.err) { REARW.err = e; console.warn('v137 rear window', e); } } });
