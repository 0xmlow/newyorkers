/* ================================================================
   v201 THE LOOK: N3W LINK (2026-11-23)
   The slim street kiosks that replaced New York's payphones, here as N3W LINK: three metre steel slabs on the
   promenade, a screen on each face cycling the island's own feed: New York time and the weather, the next
   Meme card, a GM, and a public service notice. Four of them, at the four quarters. ?link=0 off.
   ================================================================ */
const LINK = { list: [], t: 0, i: 0 };
window.__LINK = LINK;
(function linkKiosks() {
  if (!LOOK.on || /link=0/.test(location.search)) return;
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 512; const tx = new THREE.CanvasTexture(cv); tx.encoding = THREE.sRGBEncoding; LINK.cv = cv; LINK.tex = tx;
  const body = new THREE.MeshStandardMaterial({ color: 0x2c2f33, roughness: 0.35, metalness: 0.7 }), scr = new THREE.MeshBasicMaterial({ map: tx, toneMapped: false });
  [45, 135, 225, 315].forEach(a => { const [x, z] = P2(a + 4, 43.1), g = 0.665, ry = Math.atan2(-x, -z);
    const k = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.9, 0.3), body); k.position.set(x, g + 1.45, z); k.rotation.y = ry; k.castShadow = true; scene.add(k);
    [0, PI].forEach(s => { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 1.2), scr); p.position.set(x + Math.sin(ry + s) * 0.152, g + 1.9, z + Math.cos(ry + s) * 0.152); p.rotation.y = ry + s; scene.add(p); });
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.08, 0.32), new THREE.MeshStandardMaterial({ color: 0x2962ff, roughness: 0.4 })); top.position.set(x, g + 2.92, z); top.rotation.y = ry; scene.add(top);
    if (typeof post === 'function') post(x, z, 0.45); LINK.list.push(k); });
  LINK.draw = () => { const c = cv.getContext('2d'); if (!c || !c.fillRect || !c.fillText) return; const t = nycTime(TIME.utc), W = (WX.override || WX.cur || 'CLEAR'); const pg = LINK.i % 4;
    c.fillStyle = pg === 3 ? '#FF6B00' : '#0D0D0D'; c.fillRect(0, 0, 256, 512); c.fillStyle = '#2962FF'; c.fillRect(0, 0, 256, 40); c.fillStyle = '#F0F4F8'; c.font = '700 22px "JetBrains Mono", Menlo, monospace'; c.textAlign = 'center'; c.fillText('N3W LINK', 128, 28);
    const pad = n => (n < 10 ? '0' : '') + n;
    if (pg === 0) { c.font = '400 92px Anton, Impact, sans-serif'; c.fillText(((t.h + 11) % 12 + 1) + ':' + pad(t.m), 128, 200); c.font = '700 26px "JetBrains Mono", Menlo, monospace'; c.fillText(t.h < 12 ? 'AM' : 'PM', 128, 240); c.fillText(W, 128, 320); c.font = '400 18px "JetBrains Mono", Menlo, monospace'; c.fillText('NEW YORK HARBOR', 128, 360); }
    else if (pg === 1) { c.font = '400 70px Anton, Impact, sans-serif'; c.fillText('GM', 128, 230); c.font = '400 20px "JetBrains Mono", Menlo, monospace'; c.fillText('FREE WIFI. FREE CALLS.', 128, 300); c.fillText('NO SEED PHRASES.', 128, 330); }
    else if (pg === 2) { c.font = '400 44px Anton, Impact, sans-serif'; c.fillText('THE MEMES', 128, 200); c.fillText('BY 6529', 128, 250); c.font = '400 20px "JetBrains Mono", Menlo, monospace'; c.fillText('577 CARDS ON THIS', 128, 320); c.fillText('ISLAND. FIND THEM.', 128, 348); }
    else { c.fillStyle = '#0D0D0D'; c.font = '400 46px Anton, Impact, sans-serif'; c.fillText('IF YOU SEE', 128, 190); c.fillText('SOMETHING', 128, 240); c.fillText('MINT', 128, 290); c.fillText('SOMETHING', 128, 340); }
    tx.needsUpdate = true; };
  LINK.draw();
})();
window.__FRAMES.push(dt => { try { if (!LINK.draw) return; LINK.t += dt; if (LINK.t > 6) { LINK.t = 0; LINK.i++; LINK.draw(); } } catch (e) { } });
