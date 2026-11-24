/* ================================================================
   v407 THE MEMES WALK: CLICK A PLAQUE (2026-11-24)
   Every plaque on the walk now opens its card the way the cards on THE FLOOR do: click (or tap) one within a few
   metres and the card comes up full size with its artist, season, supply and its seize.io page.
   ================================================================ */
(function walkPick() {
  if (!window.__MWALK || !MWALK.ok || !MWALK.ims || typeof pickAt !== 'function') return;
  const rc = new THREE.Raycaster(), v2 = new THREE.Vector2(), _pick = pickAt;
  pickAt = function (cx, cy) { const r = _pick(cx, cy); try { v2.set(cx / innerWidth * 2 - 1, -cy / innerHeight * 2 + 1); rc.setFromCamera(v2, camera); rc.far = 9;
      const h = rc.intersectObjects(MWALK.ims, false)[0]; if (h && h.instanceId != null && (!r || h.distance < r.d)) { const n = h.object.userData.ns[h.instanceId]; if (n) return { kind: 'meme', n, d: h.distance }; } } catch (e) { }
    return r; };
  MWALK.pick = true;
})();
