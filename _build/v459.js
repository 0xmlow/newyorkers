/* ================================================================
   v459 THE DRONE SHOW FLIES THE CARD OF THE HOUR (2026-11-24)
   The middle of every show is now a 6529 card, flown as a portrait: the card of the hour (the plaque lit on the
   Memes Walk, v400) is read from the island's card atlas and cut into a grid of six hundred cells in the card's
   own proportions; every drone takes one cell and its colour, so for a few seconds a Meme hangs eighty metres tall
   over the harbour in coloured light, and a toast names it. Rebuilt every show, so it follows the hour.
   ================================================================ */
function droneCardForm() {
  if (!window.__MWALK || !MWALK.pos || !MWALK.pos.length) return null;
  const k = Math.floor(Date.now() / 3600000) % MWALK.pos.length, cd = MWALK.pos[k][2], u = cd.uv, img = atlasImg(u[0]); if (!img || !img.width) return null;
  const N = DRONES.N, asp = u[5] || 0.75, gy = Math.floor(Math.sqrt(N / asp)), gx = Math.floor(gy * asp), cv = document.createElement('canvas'); cv.width = gx; cv.height = gy; const g = cv.getContext('2d'); if (!g || !g.getImageData) return null;
  g.drawImage(img, u[1] * img.width, u[2] * img.height, (u[3] - u[1]) * img.width, (u[4] - u[2]) * img.height, 0, 0, gx, gy); let d; try { d = g.getImageData(0, 0, gx, gy).data; } catch (e) { return null; }
  // the show's frame is 150 x 82 m in normalised units: keep the card's aspect, about the frame's full height
  const hN = 0.98, wN = hN * (82 / 150) * asp, out = [];
  for (let i = 0; i < N; i++) { const j = Math.min(gx * gy - 1, Math.floor(i * gx * gy / N)), x = j % gx, y = Math.floor(j / gx), q = j * 4;
    out.push([((x + 0.5) / gx - 0.5) * wN, (0.5 - (y + 0.5) / gy) * hN, Math.pow(d[q] / 255, 1.8) * 0.7 + 0.02, Math.pow(d[q + 1] / 255, 1.8) * 0.7 + 0.02, Math.pow(d[q + 2] / 255, 1.8) * 0.7 + 0.02]); }
  out.card = cd; return out;
}
window.__FRAMES.push(() => { try { if (!window.__DRONES || !DRONES.forms || DRONES.forms.length < 2) return;
  // at the start of each show, swap in this hour's card after 6529 (or after N3W YORKERS)
  if (DRONES.t >= 0 && DRONES.t < 0.5 && !DRONES.cardIn) { DRONES.cardIn = true; const f = droneCardForm(); if (f) { const old = DRONES.forms.findIndex(q => q.card); if (old >= 0) DRONES.forms.splice(old, 1); DRONES.forms.splice(Math.min(3, DRONES.forms.length - 1), 0, f); DRONES.cardIdx = DRONES.forms.indexOf(f); DRONES.cardToast = false; } }
  if (DRONES.t < 0) DRONES.cardIn = false;
  if (DRONES.t > 0 && DRONES.cardIdx != null && !DRONES.cardToast && Math.floor((DRONES.t - 4) / 9) === DRONES.cardIdx) { DRONES.cardToast = true; const cd = DRONES.forms[DRONES.cardIdx].card; if (cd) toast('IN THE SKY: THE MEMES #' + cd.n + (cd.t ? ' · ' + String(cd.t).toUpperCase().slice(0, 40) : '') + ' · THE CARD OF THE HOUR', 'blue'); } } catch (e) { if (!DRONES.cerr) { DRONES.cerr = e; console.warn('v459', e); } } });
