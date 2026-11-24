/* ================================================================
   v273 THE CARD BANNERS (2026-11-23)
   At each of the four places where the meme river's spokes cross the promenade ring, two tall banners hang from a
   navy pole either side of the path. Each shows one 6529 card and its artist's name in bone on navy below it, and
   every few minutes they turn over to the next card: eight at a time, working through all 577 cards on the island
   in order, so whoever made a card gets their turn at the crossroads. ?banners2=0 off.
   ================================================================ */
const CBAN = { list: [], k: 0, t: 0 };
window.__CBAN = CBAN;
(function cardBanners() {
  if (!LOOK.on || /banners2=0/.test(location.search)) return;
  const all = CARDS.concat(D.fresh || []).filter(c => c.uv); CBAN.all = all;
  FACM.iron = FACM.iron || new THREE.MeshStandardMaterial({ color: 0x122039, roughness: 0.55, metalness: 0.5 });
  [0, 90, 180, 270].forEach(deg => { const a = deg * PI / 180; [-1, 1].forEach(side => { const tx = -Math.sin(a), tz = Math.cos(a), r = 40 + side * 3.4; const x = Math.cos(a) * r + tx * 2.4, z = Math.sin(a) * r + tz * 2.4, g = 0.665;
    facPut('iron', x, g + 3.0, z, 0.12, 6.0, 0.12, 0); facPut('iron', x - tx * 0.55, g + 5.85, z - tz * 0.55, 1.2, 0.06, 0.06, Math.atan2(-tz, tx)); post(x, z, 0.2, -5, 6);
    const cv = document.createElement('canvas'); cv.width = 320; cv.height = 640; const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.0), new THREE.MeshStandardMaterial({ map: t, roughness: 0.75, side: THREE.DoubleSide })); m.position.set(x - tx * 0.62, g + 4.75, z - tz * 0.62); m.rotation.y = Math.atan2(Math.cos(a), Math.sin(a)) ; scene.add(m);
    CBAN.list.push({ cv, t, m }); }); });
  facFlush();
})();
function cbanDraw() { const n = CBAN.list.length; CBAN.list.forEach((B, i) => { const card = CBAN.all[(CBAN.k * n + i) % CBAN.all.length], c = B.cv.getContext('2d'); if (!c || !c.drawImage || !c.fillText) return;
  c.fillStyle = '#16233f'; c.fillRect(0, 0, 320, 640); const cc = cropCanvas('meme', card.n, 300); if (cc.width < 16) { B.pending = true; return; } B.pending = false;
  const w = 280, h = Math.min(440, w * cc.height / cc.width), ww = h * cc.width / cc.height; c.drawImage(cc, (320 - ww) / 2, 30 + (440 - h) / 2, ww, h);
  c.fillStyle = '#b08a3e'; c.fillRect(20, 490, 280, 3); c.fillStyle = '#efe8da'; c.textAlign = 'center'; c.font = '700 22px "Archivo Black",Impact,sans-serif';
  let a = String(card.art || card.a || '').toUpperCase(); while (c.measureText(a).width > 290 && a.length > 4) a = a.slice(0, -2) + '…'; c.fillText(a, 160, 530);
  c.font = '500 16px "Archivo",Helvetica,sans-serif'; c.fillStyle = '#9fbcff'; let ti = ('CARD ' + card.n + ' · ' + card.t).toUpperCase(); while (c.measureText(ti).width > 290 && ti.length > 6) ti = ti.slice(0, -2) + '…'; c.fillText(ti, 160, 560);
  c.fillStyle = '#efe8da'; c.font = '500 13px "Archivo",Helvetica,sans-serif'; c.fillText('THE MEMES BY 6529 · CC0', 160, 610); B.t.needsUpdate = true; }); }
window.__FRAMES.push(dt => { try { if (!CBAN.list.length) return; CBAN.t -= dt; if (CBAN.t > 0 && !CBAN.list.some(b => b.pending)) return; if (CBAN.t <= 0) { CBAN.k = Math.floor(Date.now() / 180000); CBAN.t = 20; } else CBAN.t = Math.max(CBAN.t, 2); cbanDraw(); } catch (e) { if (!CBAN.err) { CBAN.err = e; console.warn('v273 banners', e); } } });
