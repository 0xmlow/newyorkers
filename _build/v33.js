/* ================================================================
   v33 RADIO, DRUMS AND PICTURES (2026-11-22)
   - N3W RADIO: M (or RADIO) cycles OFF, N3W LOFI 6.29 FM (warm chords, a lazy beat, vinyl crackle), HARBOUR JAZZ
     (walking bass and brushed ride), MEME DISCO (four on the floor). All generated live, under the island's mute.
   - A bucket drummer at the N3W LINE subway entrance, loud up close; E tips him.
   - PHOTO MODE: O hides every window and shows an N3W frame with the place and the New York time; K saves the
     picture as a PNG with the frame burned in. O again to come back.
   ================================================================ */
const RADIO = { st: 0, names: ['OFF', 'N3W LOFI 6.29 FM', 'HARBOUR JAZZ 105.9', 'MEME DISCO 77.7'], next: 0, bar: 0, out: null };
window.__RADIO = RADIO;
function radioOut() { if (RADIO.out || !AC || AC.state !== 'running') return RADIO.out; try { const g = AC.createGain(); g.gain.value = 0.8; const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200; g.connect(lp); lp.connect(AC.destination); RADIO.out = g;
  const len = AC.sampleRate * 2, buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() < 0.0012 ? (Math.random() - 0.5) * 0.6 : (Math.random() - 0.5) * 0.012;
  const s = AC.createBufferSource(); s.buffer = buf; s.loop = true; const cg = AC.createGain(); cg.gain.value = 0; s.connect(cg); cg.connect(g); s.start(); RADIO.crackle = cg; } catch (e) { } return RADIO.out; }
const CH = { lofi: [[220, 262, 330, 392], [175, 220, 262, 330], [196, 247, 294, 349], [165, 196, 247, 294]], jazz: [[147, 175, 220, 262], [196, 247, 294, 349], [131, 165, 196, 247], [220, 277, 330, 392]] };
function radioSchedule() {
  const o = radioOut(); if (!o) return; const now = AC.currentTime; if (RADIO.next < now) RADIO.next = now + 0.1;
  while (RADIO.next < now + 1.2) { const t0 = RADIO.next, st = RADIO.st, b = RADIO.bar++;
    if (st === 1) { const bt = 60 / 76, ch = CH.lofi[b % 4]; ch.forEach((f, i) => sNote(o, f, t0 + i * 0.02, bt * 3.8, 'triangle', 0.035, true)); for (let k = 0; k < 4; k++) { sNote(o, k % 2 ? 140 : 55, t0 + k * bt, 0.18, 'sine', k % 2 ? 0.05 : 0.22, false); sNote(o, 7800, t0 + k * bt + bt / 2, 0.02, 'square', 0.008, false); } sNote(o, ch[0] / 2, t0, bt * 2, 'sine', 0.08, false); RADIO.next = t0 + 4 * bt; }
    else if (st === 2) { const bt = 60 / 132, ch = CH.jazz[b % 4]; for (let k = 0; k < 4; k++) { sNote(o, ch[k % 4] / 2, t0 + k * bt, bt * 0.9, 'triangle', 0.09, false); sNote(o, 9000, t0 + k * bt, 0.05, 'square', 0.006, false); if (k % 2) sNote(o, 9000, t0 + k * bt + bt * 0.66, 0.04, 'square', 0.005, false); }
      if (b % 2 === 0) ch.slice(1).forEach(f => sNote(o, f, t0 + bt * 1.5, bt * 0.5, 'sine', 0.03, false)); RADIO.next = t0 + 4 * bt; }
    else if (st === 3) { const bt = 60 / 122; for (let k = 0; k < 4; k++) { sNote(o, 52, t0 + k * bt, 0.2, 'sine', 0.3, false); sNote(o, 8000, t0 + k * bt + bt / 2, 0.04, 'square', 0.012, false); sNote(o, [110, 110, 131, 98][b % 4] * (k % 2 ? 2 : 1), t0 + k * bt + bt / 2, bt * 0.4, 'sawtooth', 0.04, false); } if (b % 2) sNote(o, 1200, t0 + bt, 0.15, 'square', 0.01, false); RADIO.next = t0 + 4 * bt; }
    else { RADIO.next = t0 + 1; } }
  if (RADIO.crackle) RADIO.crackle.gain.value = RADIO.st === 1 ? 1 : 0; RADIO.out.gain.value = (oceanGain && oceanGain.gain.value > 0) ? 0.8 : 0;
}
function radioNext() { RADIO.st = (RADIO.st + 1) % RADIO.names.length; RADIO.bar = 0; RADIO.next = 0; toast('N3W RADIO: ' + RADIO.names[RADIO.st] + (RADIO.st ? '. M FOR THE NEXT STATION.' : '.'), 'blue'); if (RADIO.st === 1) radioSecret(); }
const radioSecret = secret('radio', () => { });
EGGS.radio = () => radioNext(); EGGS.radio.__s = true;
/* M, O and K act only when they are pressed alone, not inside a typed word like MOON or KITTY: wait 420 ms for a next letter */
let radioKeyT = null;
addEventListener('keydown', e => { if ($('chat').style.display === 'block' || e.repeat) return; const k = e.code;
  if (radioKeyT) { clearTimeout(radioKeyT); radioKeyT = null; if (e.key.length === 1) return; }
  if (k === 'KeyM' || k === 'KeyO' || k === 'KeyK') radioKeyT = setTimeout(() => { radioKeyT = null; if (k === 'KeyM') radioNext(); else if (k === 'KeyO') photoMode(); else if (PHOTO.on) photoSave(); }, 420); });

/* the bucket drummer */
const DRUM = { x: 29.5, z: 23.5 };
(function drummer() {
  const { x, z } = DRUM, g0 = ground(x, z); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.42, 16), new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.6 })); b.position.set(x, g0 + 0.21, z); scene.add(b);
  const P0 = person(0x111111, 0x2a2f45, SKIN[0], 'cabbie'); P0.g.position.set(x - 0.5, g0, z); P0.g.rotation.y = PI / 2; DRUM.P = P0;
  [0, 1, 2].forEach(k => { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.38, 14), new THREE.MeshStandardMaterial({ color: [0xff6b00, 0x2962ff, 0xd9d9d4][k], roughness: 0.5 })); d.rotation.x = PI; d.position.set(x + 0.15 + k * 0.42, g0 + 0.19, z + (k - 1) * 0.35); scene.add(d); });
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.4, 5), MAT.wood); st.position.set(x + 0.2, g0 + 0.6, z); st.rotation.z = 0.9; scene.add(st); DRUM.stick = st;
  if (typeof CIRCS !== 'undefined') CIRCS.push({ x: x + 0.3, z, r: 0.9, y0: -5, y1: 3, on: true });
  interact(x + 1, z, 2.6, 'E · TIP THE DRUMMER', secret('drummer', () => { toast('YOU TIPPED THE BUCKET DRUMMER. HE DOES A FILL ABOUT IT.'); DRUM.fill = 2; }));
})();
function drumFrame(dt) {
  const d = Math.hypot(P.x - DRUM.x, P.z - DRUM.z); DRUM.stick.rotation.z = 0.9 + Math.abs(Math.sin(LIFE.t * 9)) * 0.6;
  if (DRUM.fill > 0) DRUM.fill -= dt;
  if (d < 26 && AC && AC.state === 'running' && oceanGain && oceanGain.gain.value > 0) { const now = AC.currentTime; if (!DRUM.next || DRUM.next < now) DRUM.next = now + 0.05; const v = Math.max(0, 1 - d / 26) ** 2;
    while (DRUM.next < now + 0.6) { const t0 = DRUM.next, bt = 60 / 104 / 4, pat = DRUM.fill > 0 ? [1, 1, 1, 1, 1, 1, 1, 1] : [1, 0, 2, 1, 0, 1, 2, 0]; pat.forEach((p, i) => { if (!p) return; sNote(AC.destination, p === 1 ? 160 : 420, t0 + i * bt, 0.08, p === 1 ? 'sine' : 'triangle', (p === 1 ? 0.18 : 0.08) * v, false); }); DRUM.next = t0 + 8 * bt; } }
}

/* photo mode */
const PHOTO = { on: false, el: null };
(function photoOverlay() {
  const el = document.createElement('div'); el.id = 'photoFrame'; el.style.cssText = 'position:fixed;inset:0;z-index:60;pointer-events:none;display:none;border:14px solid #fff;box-shadow:inset 0 0 0 1px rgba(0,0,0,.25)';
  el.innerHTML = '<div style="position:absolute;left:0;right:0;bottom:0;height:64px;background:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 18px;font:400 30px/1 Anton,Impact,sans-serif;letter-spacing:.04em;color:#0D0D0D"><span id="phPlace">MEME ISLAND</span><span id="phTime" style="font:600 13px \'JetBrains Mono\',Menlo,monospace;letter-spacing:.08em">N3W YORKERS by MLow</span></div><div style="position:absolute;top:10px;right:14px;font:700 11px \'JetBrains Mono\',Menlo,monospace;color:#fff;text-shadow:0 1px 2px #000">O BACK · K SAVE</div>';
  document.body.appendChild(el); PHOTO.el = el;
})();
const photoSecret = secret('photo', () => { });
function photoMode() { PHOTO.on = !PHOTO.on; ['hud', 'taskbar', 'toasts', 'prompt', 'aim', 'mbtn', 'joy', 'cross'].forEach(id => { const e = $(id); if (e) e.style.visibility = PHOTO.on ? 'hidden' : ''; }); PHOTO.el.style.display = PHOTO.on ? 'block' : 'none';
  if (PHOTO.on) { photoSecret(); const t = SKY.t || { h: 0, m: 0 }; $('phPlace').textContent = (zoneName || 'MEME ISLAND').replace(/^"|"$/g, ''); $('phTime').textContent = `N3W YORK ${pad2(t.h)}:${pad2(t.m)} · N3W YORKERS by MLow`; } }
function photoSave() {
  try { if (POST && POST.on) POST.comp.render(); else renderer.render(scene, camera); const src = renderer.domElement, W = src.width, H = src.height, b = Math.round(Math.min(W, H) * 0.018), cap = Math.round(H * 0.08);
    const cv = document.createElement('canvas'); cv.width = W + b * 2; cv.height = H + b + cap; const c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, cv.width, cv.height); c.drawImage(src, b, b, W, H);
    c.fillStyle = '#0D0D0D'; c.font = `400 ${Math.round(cap * 0.5)}px Anton,Impact,sans-serif`; c.textBaseline = 'middle'; c.fillText($('phPlace').textContent.toUpperCase(), b * 1.5, H + b + cap / 2);
    c.font = `600 ${Math.round(cap * 0.2)}px "JetBrains Mono",Menlo,monospace`; c.textAlign = 'right'; c.fillText($('phTime').textContent, cv.width - b * 1.5, H + b + cap / 2);
    const a = document.createElement('a'); a.download = 'meme-island-' + Date.now() + '.png'; a.href = cv.toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove(); flash('#ffffff'); } catch (e) { toast('THE CAMERA JAMMED. TRY AGAIN.'); }
}
window.__FRAMES.push(dt => { try { if (RADIO.st) radioSchedule(); drumFrame(dt); } catch (e) { if (!RADIO.err) { RADIO.err = e; console.warn('v33 radio', e); } } });
