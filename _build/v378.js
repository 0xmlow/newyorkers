/* ================================================================
   v378 THE TOUR, SHORTER (2026-11-24)
   The tour had grown to 144 stops, about eighteen minutes. It now plays the highlights: the pier, the meme river,
   one stop per illusion, the painted walls, the block, then the island at night, the credits and the aerial, about
   four minutes. Shift T
   (or ?fulltour) still plays every stop.
   ================================================================ */
(function shortTour() {
  const T = (window.__game && __game.TOUR) || TOUR; window.__TOURFULL = T.slice();
  const keep = /^(arrivals|the meme river|tied together|the eye from one spot|the hollow eye|the impossible triangle|the well|the card that stands up|the disc that turns|the wall that leans|the lenticular|the ames window|the door to nowhere|the mirror cylinder|camera obscura|round or square|the moire fence|the survive mural|the factory mural|the painted court|the rooftop billboard|the sky over the census|the bodega building|the stoop sale|the fruit stand|the speakeasy|the credits again|what to look for|the island tonight|aerial)$/;
  if (/fulltour/.test(location.search)) return; const short = T.filter((r, i) => i === 0 || keep.test(r.name)); if (short.length < 12) return; window.__TOURSHORT = short;
  const last = ['tied together', 'the island tonight', 'the credits again', 'aerial']; short.sort((a, b) => last.indexOf(a.name) - last.indexOf(b.name)); T.length = 0; short.forEach(r => T.push(r));
  addEventListener('keydown', e => { if (e.code === 'KeyT' && e.shiftKey) { T.length = 0; __TOURFULL.forEach(r => T.push(r)); } }, true);
})();
