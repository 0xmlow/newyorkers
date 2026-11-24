/* ================================================================
   v260 FRAME RATE: SMALL THINGS FAR AWAY (2026-11-23)
   The scanned props are a few thousand triangles each, worth it at arm's length, invisible at a hundred metres.
   Every prop mesh from the CC0 library (v238 on) now switches itself off beyond a distance set by its size (about
   55 m for a bin, 90 m for a barrier row), checked a few times a second, and comes back before you could see it
   go. The same for the wheatpaste and the mural uplights. ?propcull=0 turns it off.
   ================================================================ */
const PCULL = { off: 0, t: 0 };
window.__PCULL = PCULL;
window.__FRAMES.push(dt => { try { if (/propcull=0/.test(location.search) || !window.__PH) return; PCULL.t += dt; if (PCULL.t < 0.25) return; PCULL.t = 0; let off = 0; const cp = camera.position;
  PH.ims.forEach(im => { const s = im.geometry.boundingSphere; if (!s) return; const far = 45 + s.radius * 3; const v = s.center.distanceTo(cp) - s.radius < far; if (im.visible !== v) im.visible = v; if (!v) off++; });
  PCULL.off = off; } catch (e) { } });
