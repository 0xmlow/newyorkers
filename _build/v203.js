/* ================================================================
   v203 THE LOOK: TAGS (2026-11-23)
   Concrete in New York does not stay clean. The SURVIVE walls and the factory's long sides carry a handful of
   spray painted tags at arm height between the buttresses: bubble letters and fast handstyles, outlined, filled,
   a drip or two, some half buffed out with grey paint that does not match. ?tags=0 off.
   ================================================================ */
const TAGS = { n: 0 };
window.__TAGS = TAGS;
(function tags() {
  if (!LOOK.on || /tags=0/.test(location.search)) return;
  const words = [['N3W', '#ff4fa3', '#111'], ['GM', '#2fd0e8', '#0d0d0d'], ['SZN', '#ffd400', '#1a1a1a'], ['HODL', '#ffffff', '#2962ff'], ['4:20', '#7dff6a', '#111'], ['WAGMI', '#ff6b00', '#0d0d0d'], ['NGMI', '#c9c9c9', '#222'], ['SEIZE', '#ff3b3b', '#111']];
  const mk = (w, fill, line, buff) => { const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256; const c = cv.getContext('2d'); if (!c || !c.fillText || !c.save) return null;
    c.clearRect(0, 0, 512, 256); if (buff) { c.fillStyle = 'rgba(120,118,112,0.85)'; c.fillRect(20, 40, 470, 170); }
    c.save(); c.translate(256, 140); c.rotate(-0.08 + Math.random() * 0.16); c.font = `400 ${w.length > 4 ? 150 : 200}px "Permanent Marker", Anton, Impact, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    c.lineWidth = 26; c.strokeStyle = line; c.strokeText(w, 0, 0); c.fillStyle = fill; c.fillText(w, 0, 0); c.lineWidth = 4; c.strokeStyle = 'rgba(255,255,255,0.7)'; c.strokeText(w, -3, -4);
    c.fillStyle = fill; for (let i = 0; i < 4; i++) { const x = -150 + Math.random() * 300, l = 20 + Math.random() * 60; c.fillRect(x, 30, 4, l); c.beginPath && (c.beginPath(), c.arc(x + 2, 30 + l, 3.5, 0, PI * 2), c.fill()); } c.restore();
    const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO; return t; };
  const put = (x, y, z, ry, i, buff) => { const [w, f, l] = words[i % words.length], t = mk(w, f, l, buff); if (!t) return; const m = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.4), new THREE.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -3 }));
    m.position.set(x, y, z); m.rotation.y = ry; m.renderOrder = 2; scene.add(m); TAGS.n++; };
  const gB = 0.6; put(28, gB + 1.6, 39.86, PI, 0, false); put(40, gB + 1.8, 39.86, PI, 1, false); put(52, gB + 1.5, 39.86, PI, 2, false); put(34, gB + 1.7, 48.14, 0, 3, false); put(46, gB + 1.6, 48.14, 0, 4, false);
  try { const g = ground(0, -64) + 0.02; put(16.3, g + 2.4, -71.6, PI / 2, 5, false); put(16.3, g + 2.6, -62.0, PI / 2, 6, false); put(-16.3, g + 2.5, -58.8, -PI / 2, 7, false); } catch (e) { }
})();
