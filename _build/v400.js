/* ================================================================
   v400 THE MEMES WALK: CARD OF THE HOUR (2026-11-24)
   Every hour one plaque on the walk is lit from inside: a ring of warm light round it that breathes, so there is
   always one card to go and find. The pier marker (v395) names it. It moves on the hour, through all 577 in about
   24 days.
   ================================================================ */
(function cardOfHour() {
  if (!window.__MWALK || !MWALK.ok) return;
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256; const c = cv.getContext('2d');
  if (c && c.createRadialGradient) { const gr = c.createRadialGradient(128, 128, 40, 128, 128, 128); gr.addColorStop(0, 'rgba(255,220,150,0)'); gr.addColorStop(0.55, 'rgba(255,214,140,.9)'); gr.addColorStop(0.75, 'rgba(255,200,120,.35)'); gr.addColorStop(1, 'rgba(255,200,120,0)'); c.fillStyle = gr; c.fillRect(0, 0, 256, 256); }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  m.geometry.rotateX(-PI / 2); m.renderOrder = 4; scene.add(m); MWALK.glow = m;
  const t = signTex([{ t: 'CARD OF THE HOUR', s: 0.3 }, { t: '…', s: 0.16 }], 1024, 256, '#16233f', '#c9a24a'); MWALK.hourT = t;
  try { if (MWALK.sign) { const [x, g, z] = MWALK.sign, p = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.275), new THREE.MeshStandardMaterial({ map: t, roughness: 0.4 })); p.position.set(x, g + 1.42, z + 0.02); scene.add(p); } } catch (e) { }
  MWALK.hourK = -1;
})();
window.__FRAMES.push(() => { try { if (!MWALK.glow) return; const now = Date.now(), k = Math.floor(now / 3600000) % MWALK.pos.length;
  if (k !== MWALK.hourK) { MWALK.hourK = k; const [a, r, cd] = MWALK.pos[k]; MWALK.glow.position.set(Math.sin(a) * r, MWALK.PY + 0.004, Math.cos(a) * r); MWALK.glow.rotation.y = a + PI;
    const s = SIGNS.find(q => q.t === MWALK.hourT); if (s) { s.lines[1].t = '#' + cd.n + '  ' + String(cd.t || '').toUpperCase().slice(0, 30); signCanvas(s.lines, s.w, s.h, s.bg, s.fg, s.cv); s.t.needsUpdate = true; } }
  MWALK.glow.material.opacity = 0.55 + 0.35 * Math.sin(now / 700); } catch (e) { } });
