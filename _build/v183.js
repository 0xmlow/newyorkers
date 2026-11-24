/* ================================================================
   v183 THE LOOK: GATES DOWN (2026-11-23)
   When a New York shop closes, the roll down gate comes down, and the good ones are painted. The laundromat
   (closed eleven at night to six) and the N3W DROP shop (closed four in the morning to noon) now pull down
   corrugated steel gates painted by MLow: a navy field of contour lines crowding in toward an Open Eye Flower,
   the witness on duty while the shop sleeps. The gate rolls down and up on the hour, out of a steel housing
   that stays put. The bodega never closes, so it never gets one. ?gates=0 off.
   ================================================================ */
const GATES = { list: [] };
window.__GATES = GATES;
(function gates() {
  if (!LOOK.on || /gates=0/.test(location.search)) return;
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512; const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO; GATES.tex = t;
  const draw = img => { const c = cv.getContext('2d'); if (!c || !c.fillRect) return; c.fillStyle = '#0d1733'; c.fillRect(0, 0, 1024, 512);
    if (c.beginPath && c.ellipse) for (let i = 1; i < 34; i++) { const r = i * 17; c.strokeStyle = i % 5 === 0 ? 'rgba(80,220,255,0.75)' : i % 2 ? 'rgba(41,98,255,0.55)' : 'rgba(150,120,255,0.35)'; c.lineWidth = i % 5 === 0 ? 3 : 2; c.beginPath();
      for (let s = 0; s <= 96; s++) { const a = s / 96 * PI * 2, w = 1 + 0.12 * Math.sin(a * 3 + i * 0.4) + 0.06 * Math.sin(a * 7 - i); const x = 512 + Math.cos(a) * r * 1.5 * w, y = 256 + Math.sin(a) * r * 0.9 * w; s ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    if (img && c.drawImage) { c.drawImage(img, 512 - 190, 256 - 190, 380, 380); }
    c.fillStyle = 'rgba(0,0,0,0.28)'; for (let y = 0; y < 512; y += 14) c.fillRect(0, y, 1024, 3); c.fillStyle = 'rgba(255,255,255,0.06)'; for (let y = 5; y < 512; y += 14) c.fillRect(0, y, 1024, 2);
    if (c.fillText) { c.fillStyle = 'rgba(240,244,248,0.7)'; c.font = '700 22px "JetBrains Mono", Menlo, monospace'; c.textAlign = 'right'; c.fillText('MLOW', 1000, 490); } t.needsUpdate = true; };
  draw(null); const im = new Image(); im.onload = () => draw(im); im.src = 'assets/iv_flower.webp';
  const gm = new THREE.MeshStandardMaterial({ map: t, roughness: 0.5, metalness: 0.45 }); GATES.gm = gm; const _gm0 = 0, hm = new THREE.MeshStandardMaterial({ color: 0x55595e, roughness: 0.4, metalness: 0.7 });
  const add = (x, z, ry, w, top, closed) => { const geo = new THREE.PlaneGeometry(w, top.h); geo.translate(0, -top.h / 2, 0); const g = new THREE.Mesh(geo, gm); g.position.set(x, top.y, z); g.rotation.y = ry; g.scale.y = 0.02; g.receiveShadow = true; scene.add(g);
    const hs = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.32, 0.32), hm); hs.position.set(x - Math.sin(ry) * 0.12, top.y + 0.16, z - Math.cos(ry) * 0.12); hs.rotation.y = ry; hs.castShadow = true; scene.add(hs);
    GATES.list.push({ g, closed, k: 0.02 }); };
  try { if (window.__LAUND && LAUND.g0 != null) add(LAUND.fx + 0.14, LAUND.z0, PI / 2, 7.6, { y: LAUND.g0 + 2.95, h: 2.95 }, h => h >= 23 || h < 6); } catch (e) { }
  try { if (window.__LINE && LINE.g0 != null) add(LINE_AT.x, LINE_AT.z - 2 - 0.12, PI, 6.6, { y: LINE.g0 + 2.75, h: 2.75 }, h => h >= 4 && h < 12); } catch (e) { }
})();
window.__FRAMES.push(dt => { try { if (!GATES.list.length) return; const h = nycTime(TIME.utc).h; GATES.list.forEach(G => { const want = G.closed(h) ? 1 : 0.02; G.k += Math.sign(want - G.k) * Math.min(Math.abs(want - G.k), dt * 0.25); G.g.scale.y = G.k; G.g.visible = G.k > 0.03; }); } catch (e) { } });
