/* ================================================================
   v306 FRAME RATE: ONE MATERIAL PER MURAL (2026-11-24)
   wallMat() made a new material for every wall even when two walls carry the same mural and repeat, which costs a
   program switch each. Same mural, same repeat, same roughness now share one material (and one texture, v247's
   cache already did that).
   ================================================================ */
(function shareWallMats() {
  if (!window.wallMat || window.__wallMatShared) return; window.__wallMatShared = true; const cache = {}, base = window.wallMat;
  window.wallMat = (name, rx, ry, o) => { const k = [name, rx || 1, ry || 1, (o && o.rough) || 0].join('|'); return cache[k] || (cache[k] = base(name, rx, ry, o)); };
})();
