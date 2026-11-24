/* ================================================================
   v381 THE CARD BANNERS SHOW WHO (2026-11-24)
   Every card banner at the river crossings (v273) also shows, under the artist's name, the card's season and how many
   copies exist, so you can read a little of the collection's story walking past.
   ================================================================ */
(function bannersMore() { if (!window.__CBAN || !window.cbanDraw) return; const base = cbanDraw; window.cbanDraw = function () { base(); CBAN.list.forEach((B, i) => { const card = CBAN.all[(CBAN.k * CBAN.list.length + i) % CBAN.all.length], c = B.cv.getContext('2d'); if (!c || !c.fillText || B.pending) return;
  c.fillStyle = '#16233f'; c.fillRect(0, 572, 320, 28); c.fillStyle = '#7fb0ff'; c.textAlign = 'center'; c.font = '500 14px "Archivo",Helvetica,sans-serif'; c.fillText(('SEASON ' + (card.s || '?') + (card.sup ? ' · ' + card.sup + ' COPIES' : '')).toUpperCase(), 160, 588); B.t.needsUpdate = true; }); }; })();
