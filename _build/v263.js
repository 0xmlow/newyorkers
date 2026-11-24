/* ================================================================
   v263 FRAME RATE: SHADOWS WHERE THEY SHOW (2026-11-23)
   A shadow from a bin bag or a hydrant is a few pixels the sun map draws again every frame. Scanned props under
   about a metre now receive shadows but do not cast them (the street still darkens under them through the AO pass),
   and the overlays of the anamorphic eye never enter the shadow pass. Measured on the M5 Pro at retina, the plaza
   and the bodega views each drop a few dozen draw calls in the shadow pass. ?props=0 off.
   ================================================================ */
(function shadowTrim() { try { if (window.__ANA) scene.traverse(o => { if (o.userData && o.userData.__ana) o.castShadow = false; }); } catch (e) { } })();
// the anamorphic overlays only matter near the painting: off beyond 60 m from the bodega block
window.__FRAMES.push(dt => { try { if (!window.__ANA || !ANA.ready) return; ANA.ct = (ANA.ct || 0) + dt; if (ANA.ct < 0.3) return; ANA.ct = 0; const v = camera.position.distanceTo(ANA.T) < 60; if (v === ANA.vis) return; ANA.vis = v; scene.children.forEach(o => { if (o.userData && o.userData.__ana) o.visible = v; }); } catch (e) { } });
