/* ================================================================
   v82 ISLANDHENGE (2026-11-22)
   Manhattan has Manhattanhenge, when the setting sun lines up with the street grid. The island has its own: the
   west path runs due west from THE FLOOR, so on the few evenings around each equinox when the real sun sets due
   west over New York, it goes down exactly at the end of the path, and the path fills with gold for a few
   minutes. The sun here is the real one, so it only happens on those real evenings. HENGE jumps the clock to
   the next one.
   ================================================================ */
const HENGE = { k: 0 };
window.__HENGE = HENGE;
(function islandhenge() {
  // a long strip of warm light laid down the west path
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 512; const c = cv.getContext('2d');
  if (c && c.createLinearGradient) { const g = c.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, 'rgba(255,190,90,0)'); g.addColorStop(0.5, 'rgba(255,190,90,.55)'); g.addColorStop(1, 'rgba(255,190,90,.9)'); c.fillStyle = g; c.fillRect(0, 0, 64, 512);
    const h = c.createLinearGradient(0, 0, 64, 0); h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(0.5, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,1)'); c.globalCompositeOperation = 'destination-out'; c.fillStyle = h; c.fillRect(0, 0, 64, 512); }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(4, 88), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -3 }));
  m.rotation.x = -PI / 2; m.rotation.z = -PI / 2; m.position.set(-50, ground(-50, 0) + 0.09, 0); m.visible = false; scene.add(m); HENGE.strip = m;
})();
const hengeSecret = secret('henge', () => { toast('ISLANDHENGE. THE SUN IS SETTING EXACTLY DOWN THE WEST PATH. IT DOES THIS TWICE A YEAR, FOR A FEW MINUTES. YOU ARE HERE FOR IT.', 'blue'); });
// the next evening when the sun sets within a degree of due west, from the real sun
function hengeNext(fromUtc) { const t0 = fromUtc || TIME.utc; for (let dd = 0; dd < 400; dd++) { const day = Math.floor(t0 / 86400) + dd; let lo = day * 86400 + 20 * 3600, hi = day * 86400 + 26 * 3600;   // 15:00 to 21:00 in New York, in UTC seconds
    if (sunPos(lo).el < 0.5 || sunPos(hi).el > 0.5) continue; for (let k = 0; k < 24; k++) { const mid = (lo + hi) / 2; if (sunPos(mid).el > 0.5) lo = mid; else hi = mid; }
    if (Math.abs(sunPos(lo).az - 270) < 1.0 && lo > t0) return lo; } return null; }
EGGS.henge = EGGS.islandhenge = EGGS.manhattanhenge = () => { const t = hengeNext(); if (!t) { toast('NO HENGE THIS YEAR. THE SUN HAS OTHER PLANS.'); return; } TIME.mode = 'fixed'; TIME.utc = t - 360; try { syncTimeButtons(); } catch (e) { }
  teleport(-16, 0, PI / 2); P.pitch = 0.02; const T = nycTime(t); toast('JUMPING TO ' + T.mo + '/' + T.d + '/' + T.y + ', A FEW MINUTES BEFORE SUNSET. LOOK WEST DOWN THE PATH.'); }; EGGS.henge.__s = true;
function hengeFrame(dt) {
  const s = SKY.sun; if (!s) return; const off = Math.abs(((s.az - 270 + 540) % 360) - 180), want = (off < 3 && s.el > -0.6 && s.el < 5) ? Math.min(1, (3 - off) / 0.8) * Math.min(1, (5 - s.el) / 2) : 0;
  HENGE.k += (want - HENGE.k) * Math.min(1, dt * 0.8); HENGE.strip.visible = HENGE.k > 0.01; HENGE.strip.material.opacity = HENGE.k * 0.85;
  if (HENGE.k > 0.5 && Math.abs(P.z) < 4 && P.x < -2 && P.x > -95) hengeSecret();
}
window.__FRAMES.push(dt => { try { hengeFrame(dt); } catch (e) { if (!HENGE.err) { HENGE.err = e; console.warn('v82 henge', e); } } });
