/* ================================================================
   systems: state, mom, the CRT, the delights, HUD, picking, pinning, rails, the player, the loop
   ================================================================ */
const state = { mom: 0, seen: new Set(), hung: 0, rats: 0, idle: 0, under: 0, started: false, zone: '', eggs: new Set(), momT: 55, chart: 0, chartT: 0, dryer: 0 };
const $ = id => document.getElementById(id);
let T = 0, last = 0, tilt = 0, locked = false, aimT = 0, zoneName = '', slotTarget = -1;
const keys = {}; const P = { x: 0, y: 0, z: 22, yaw: PI, pitch: -0.04, vy: 0, ground: true, fallFrom: 0 };
function toast(t, cls) { const d = document.createElement('div'); d.className = 'toast' + (cls ? ' ' + cls : ''); d.textContent = t; $('toasts').appendChild(d); setTimeout(() => d.remove(), 5200); while ($('toasts').children.length > 4) $('toasts').firstChild.remove(); }
function flash(c = '#fff') { const f = $('flash'); f.style.background = c; f.style.opacity = 0.7; setTimeout(() => f.style.opacity = 0, 120); }
function hud() { $('sMom').textContent = state.mom; $('sSeen').textContent = state.seen.size + '/' + HUNG.length; $('sHung').textContent = state.hung + '/12'; $('sRats').textContent = state.rats; const m = Math.floor(state.under / 60), s = Math.floor(state.under % 60); $('sTime').textContent = m + ':' + (s < 10 ? '0' : '') + s; }
function dialog(title, html) { $('dlgT').textContent = title; $('dlgBody').innerHTML = html; $('dlg').style.display = 'flex'; try { document.exitPointerLock(); } catch (e) { } }
$('dlgOk').onclick = $('dlgX').onclick = () => $('dlg').style.display = 'none';

/* ---------------- New York time, the only outside ---------------- */
function nyc() { const d = new Date(); const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: 'numeric', hour12: false, weekday: 'short', day: 'numeric', month: 'short' }).formatToParts(d); const g = k => p.find(x => x.type === k).value; return { h: +g('hour') % 24, m: +g('minute'), wd: g('weekday'), d: g('day'), mo: g('month'), date: d }; }
function rentDue() { const t = nyc(); const now = new Date(t.date.toLocaleString('en-US', { timeZone: 'America/New_York' })); const first = new Date(now.getFullYear(), now.getMonth() + 1, 1); const ms = first - now; const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24; return d + 'd ' + h + 'h'; }
function clockHud() { const t = nyc(); const pad = n => (n < 10 ? '0' : '') + n; const day = t.h >= 7 && t.h < 19; $('trayClock').textContent = `NYC ${pad(t.h)}:${pad(t.m)}`; $('trayWx').textContent = day ? 'daylight in the well' : 'dark in the well';
  $('clock').innerHTML = `<b>NEW YORK ${pad(t.h)}:${pad(t.m)}</b> · ${t.wd} ${t.d} ${t.mo}<br>WINDOW WELL: ${day ? 'FEET GOING BY' : 'A STREETLIGHT'}<br>RENT DUE IN ${rentDue()}<br><span class="ev">${t.h >= 16 && t.h < 18 ? 'IT IS 4PM. IT IS ALWAYS 4PM.' : t.h < 5 ? 'MOM IS ASLEEP. POST QUIETLY.' : 'MOM IS HOME.'}</span>`; $('sRent').textContent = rentDue();
  const k = day ? 1 : 0.18; W.wellLight.intensity = 2.5 * k + 0.4; W.well.material.color.setScalar(0.35 + 0.6 * k); }

/* ---------------- mom: text from upstairs ---------------- */
const MOM = { timer: ['ARE YOU STILL DOWN THERE', 'DINNER IS READY. IT HAS BEEN READY.', 'THE INTERNET BILL CAME. IT IS ADDRESSED TO YOU.', 'YOUR COUSIN GOT A JOB. I AM JUST SAYING.', 'I AM NOT YELLING. THIS IS MY VOICE.', 'DID YOU EAT. DO NOT LIE.', 'THERE IS A MAN HERE ABOUT THE BOILER. HE SAYS HE KNOWS YOU FROM ONLINE.', 'THE RATS ARE YOUR RESPONSIBILITY NOW.', 'IS THAT THE DRYER. WHY IS THE DRYER ON.', 'COME UP AND SAY HELLO TO AUNT ROSE. SHE HAS QUESTIONS ABOUT THE JPEGS.', 'I FOUND A BAGEL THE SIZE OF A CAR. WE WILL TALK.'],
  idle: 'MOM (UPSTAIRS): DOES POSTING PAY CON EDISON. ASKING FOR THE BILL.', door: ['MOM: NOT NOW. I AM ON THE PHONE WITH YOUR AUNT.', 'MOM: THE DOOR IS NOT LOCKED. IT IS CLOSED. THERE IS A DIFFERENCE.', 'MOM: WIPE YOUR FEET BEFORE YOU THINK ABOUT IT.', 'MOM: I CAN HEAR THE BAGEL FROM HERE.'], gm: ['MOM: IT IS 4PM.', 'MOM: GOOD MORNING TO WHO.', 'MOM: THE BOILER HEARD YOU. IT KNOCKED BACK.'] };
let momI = 0; function momLine(k) { const a = MOM[k]; return 'MOM (UPSTAIRS): ' + (Array.isArray(a) ? a[(momI++) % a.length] : a).replace(/^MOM: /, ''); }
function momTick(dt) { state.momT -= dt; if (state.momT <= 0) { state.momT = 50 + Math.random() * 40; toast(momLine('timer')); state.mom++; hud(); } }

/* ---------------- the CRT: static, the game, the captions ---------------- */
const CH = ['THE METS', 'CHANNEL 11', 'PUBLIC ACCESS', 'THE GAME (RAIN DELAY)', 'A MAN SELLING KNIVES'];
let chIdx = 0, ccLines = null, ccI = 0;
function drawCRT() { const c = W.crt.cv.getContext('2d'), w = 384, h = 288; if (!c) return; const img = c.getImageData ? null : null; c.fillStyle = '#0a1220'; c.fillRect(0, 0, w, h);
  // static: cheap, 1200 grey specks a frame, a green field for the game
  if (chIdx === 0 || chIdx === 3) { c.fillStyle = '#2f6b2a'; c.fillRect(0, 120, w, 168); c.fillStyle = '#7a5a3a'; c.fillRect(140, 150, 104, 100); c.fillStyle = '#d8e8ff'; c.fillRect(0, 0, w, 120); c.fillStyle = '#1b2b5a'; c.fillRect(8, 8, 120, 22); c.fillStyle = '#ffd400'; c.font = '700 14px monospace'; c.fillText('NYM 2  PHI 2  ' + (chIdx === 3 ? 'RAIN' : 'BOT 9'), 12, 24); }
  else if (chIdx === 2) { c.fillStyle = '#3a2a4a'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8d0a0'; c.fillRect(150, 90, 84, 120); c.fillStyle = '#222'; c.fillRect(160, 110, 64, 10); }
  else if (chIdx === 4) { c.fillStyle = '#8a1b1b'; c.fillRect(0, 0, w, h); c.fillStyle = '#eee'; c.fillRect(100, 60, 184, 160); c.fillStyle = '#888'; c.fillRect(120, 120, 140, 6); }
  c.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < 900; i++) c.fillRect(Math.random() * w, Math.random() * h, 2, 1); c.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = (T * 40) % 6; y < h; y += 6) c.fillRect(0, y, w, 1);
  if (chIdx === 1) { c.fillStyle = '#000'; c.fillRect(0, 0, w, h); c.fillStyle = '#9fb3ff'; c.font = '700 26px monospace'; c.fillText('PLEASE STAND BY', 70, 150); }
  W.crt.t.needsUpdate = true; }
function channel() { chIdx = (chIdx + 1) % CH.length; toast('CHANNEL: ' + Q(CH[chIdx]) + '.', 'blue'); chime(440); }
function caption(lines, cls) { ccLines = lines; ccI = 0; W.crt.ccT = 0; const e = $('cc'); e.className = cls || ''; e.style.display = 'block'; e.textContent = lines[0]; }
function ccTick(dt) { if (!ccLines) return; W.crt.ccT += dt; if (W.crt.ccT > 2.6) { W.crt.ccT = 0; ccI++; if (ccI >= ccLines.length) { ccLines = null; $('cc').style.display = 'none'; return; } $('cc').textContent = ccLines[ccI]; } if (Math.hypot(P.x, P.z - 14) > 9) { ccLines = null; $('cc').style.display = 'none'; } }

/* ---------------- the delights ---------------- */
let AC = null, humGain = null;
function audioOn() { if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); const len = AC.sampleRate * 4, buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0); let lastv = 0; for (let i = 0; i < len; i++) { lastv = (lastv + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = lastv * 3.2; } const src = AC.createBufferSource(); src.buffer = buf; src.loop = true; const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180; humGain = AC.createGain(); humGain.gain.value = 0; const o = AC.createOscillator(); o.frequency.value = 60; const og = AC.createGain(); og.gain.value = 0.03; o.connect(og); og.connect(humGain); src.connect(lp); lp.connect(humGain); humGain.connect(AC.destination); src.start(); o.start(); } AC.resume(); humGain.gain.value = 0.16; }
function chime(f = 523) { if (!AC || AC.state !== 'running' || !humGain || humGain.gain.value === 0) return; [1, 1.25, 1.5].forEach((m, i) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = f * m; g.gain.setValueAtTime(0, AC.currentTime + i * 0.07); g.gain.linearRampToValueAtTime(0.08, AC.currentTime + i * 0.07 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + i * 0.07 + 1.0); o.connect(g); g.connect(AC.destination); o.start(AC.currentTime + i * 0.07); o.stop(AC.currentTime + i * 0.07 + 1.1); }); }
function knock(n = 2) { if (!AC || AC.state !== 'running' || !humGain || humGain.gain.value === 0) return; for (let i = 0; i < n; i++) { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(140, AC.currentTime + i * 0.33); o.frequency.exponentialRampToValueAtTime(50, AC.currentTime + i * 0.33 + 0.12); g.gain.setValueAtTime(0.5, AC.currentTime + i * 0.33); g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + i * 0.33 + 0.25); o.connect(g); g.connect(AC.destination); o.start(AC.currentTime + i * 0.33); o.stop(AC.currentTime + i * 0.33 + 0.3); } W.boilerKnock = 0.6; }
const near = (x, z, r) => Math.hypot(P.x - x, P.z - z) < r;
const EGGS = {
  gm: () => { knock(2); toast('THE BOILER KNOCKED TWICE. THE BUILDING HAS ACKNOWLEDGED YOU.', 'blue'); setTimeout(() => { toast(momLine('gm')); state.mom++; hud(); }, 1800); state.eggs.add('gm'); },
  hodl: () => { if (!near(W.dryer.x, W.dryer.z, 3)) { toast('HODL WHAT. YOU ARE NOT NEAR THE DRYER.'); return; } W.dryer.hodl = !W.dryer.hodl; toast(W.dryer.hodl ? 'ONE SOCK IS NOW SUSPENDED WHILE THE DRUM TURNS AROUND IT. DIAMOND SOCK.' : 'THE SOCK HAS RESUMED TUMBLING.', 'blue'); state.eggs.add('hodl'); },
  cope: () => { if (!near(-8.5, 19.6, 3.5)) { toast('COPE IS A CARD ROOM WORD.'); return; } W.table.userData.still = true; W.bill.visible = true; toast('THE WOBBLE HAS STOPPED. A FOLDED CON EDISON BILL IS UNDER THE LEG. IT WAS PAID. IN A SENSE.', 'blue'); state.eggs.add('cope'); },
  greentext: () => { if (!near(0, 14, 7)) { toast('THE CAPTIONS ARE ON THE TV. GO SIT DOWN.'); return; } caption(['>be me', '>basement, queens, 4pm', '>mom yells dinner', '>say five minutes', '>it is 2031', '>bagel the size of a car in the back room', '>rats unionised', '>rent due'], 'green'); state.eggs.add('greentext'); },
  mom: () => { toast(momLine('door')); state.mom++; hud(); knock(1); },
  rent: () => toast('RENT DUE IN ' + rentDue() + '. VERBAL LEASE. MONTH TO MONTH. SHE WOULD NEVER. SHE MIGHT.'),
  'touch grass': () => { teleport(0.6, 22, PI / 2); toast('THERE IS NO GRASS. THERE IS A WINDOW WELL. THOSE ARE FEET.', 'blue'); state.eggs.add('grass'); },
  wagmi: () => { toast('WE ARE ALL GONNA MAKE IT. UPSTAIRS. EVENTUALLY. NOT TODAY.'); knock(1); },
  ngmi: () => toast('MOM SAYS YOU ARE GOING TO MAKE IT. SHE SAID IT TO AUNT ROSE. SHE MEANT IT.'),
  bagel: () => { teleport(-20, -3, 0); toast('BAGEL.', 'blue'); },
  upstairs: () => { toast(momLine('door')); state.mom++; hud(); },
  jpeg: () => toast('YOUR JPEGS ARE SAFE. THEY ARE ON THE CORKBOARD. THE CORKBOARD IS THE CHAIN.'),
  mets: () => { chIdx = 0; toast('THE METS ARE ON. THEY ARE TIED. THEY WILL NOT BE TIED FOR LONG.', 'blue'); },
};
/* the dryer ride: the camera is in the drum, one rotation, then the laundry is folded */
const RIDE = { on: false, t: 0, dur: 7 };
function startDryer() { if (RIDE.on) return; RIDE.on = true; RIDE.t = 0; toast('PLEASE KEEP HANDS INSIDE THE DRUM. ANOTHER CYCLE. SAME BAG.', 'blue'); chime(330); state.eggs.add('dryer'); try { document.exitPointerLock(); } catch (e) { } }
function endDryer() { RIDE.on = false; teleport(W.dryer.x, 13.0, 0); W.dryer.folded.visible = true; state.dryer++; toast('CYCLE COMPLETE. THE LAUNDRY IS FOLDED. THE SOCK IS GONE. CHECK THE MAUSOLEUM.', 'blue'); flash('#fff'); }
/* the 1998 PC: a Win98 mining dialog */
function mining() { const pct = Math.min(99, 3 + Math.floor(state.under / 9)); dialog('MINER98.EXE', `<b>Mining block 0 of 1.</b><div>Hashrate: 1998 H/s · Pool: your mom's basement · Fee: dinner</div><div class="bar"><i style="width:${pct}%"></i></div><div>Estimated completion: after the next rent increase.</div><div class="small">The fan clicked once. It is tired.</div>`); knock(1); state.eggs.add('pc'); }
/* the freezer: the cat says no, twice, then the lid opens onto the cold room */
function openFreezer() { const f = W.freezer; if (f.open) { teleport(24, 22.2, 0); flash('#cfe8ff'); toast('INTO THE SECOND FREEZER. IT IS BIGGER INSIDE. SHE KNOWS.', 'blue'); return; }
  f.tries++; if (f.tries === 1) { toast('ACCESS DENIED. THE CAT.'); W.cat.userData.l.scale.setScalar(0.3); setTimeout(() => W.cat.userData.l.scale.setScalar(1), 400); return; } if (f.tries === 2) { toast('THE CAT HAS CONSIDERED YOUR REQUEST. THE CAT SAYS NO. THE CAT IS LEAVING ANYWAY.'); W.cat.userData.moving = true; return; }
  f.open = true; W.freezerLight.intensity = 3; toast('THE LID IS UP. COLD AIR. ENTENMANN\'S. PRESS E AGAIN TO GO IN.', 'blue'); chime(660); state.eggs.add('freezer'); }
/* postcard: the frame, a plate and the mark, shown in a dialog to save by hand (downloads are blocked in artifacts) */
function postcard() { renderFrame(); const src = renderer.domElement, cv = document.createElement('canvas'); cv.width = 1200; cv.height = 675; const c = cv.getContext('2d'); const a = src.width / src.height, w = a > 16 / 9 ? 1200 : 675 * a, h = a > 16 / 9 ? 1200 / a : 675; c.fillStyle = '#0d0d0d'; c.fillRect(0, 0, 1200, 675); c.drawImage(src, (1200 - w) / 2, (675 - h) / 2, w, h);
  c.fillStyle = 'rgba(13,13,13,0.85)'; c.fillRect(0, 585, 1200, 90); c.fillStyle = '#fff'; c.font = '700 30px "Archivo Narrow", Arial'; c.fillText('"' + zoneName + '"', 36, 628); c.font = '600 16px "IBM Plex Mono", monospace'; c.fillStyle = '#2962FF'; c.fillText("YOUR MOM'S BASEMENT · NEW YORKERS BY MLOW · n3wyorkers.com", 36, 656);
  const im = $('eyeImg'); if (im) c.drawImage(im, 1120, 603, 44, 44);
  dialog('Postcard - save by hand', '<div style="font-size:11px">Right click the picture, Save Image As. Send it to mom.</div>'); const img = new Image(); img.src = cv.toDataURL('image/jpeg', 0.9); img.style.width = '100%'; $('dlgBody').appendChild(img); }

/* ---------------- picking, the modal, pinning ---------------- */
const ray = new THREE.Raycaster(); ray.far = 30; const ndc = new THREE.Vector2();
function pickAt(cx, cy) {
  ndc.set(cx / innerWidth * 2 - 1, -cy / innerHeight * 2 + 1); ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(cardMeshes.concat(PICK_EXTRA, [frameMesh]), false);
  for (const h of hits) { if (h.object === frameMesh) return null;
    if (h.object.isInstancedMesh) { const id = cardBuf[0].ids[h.instanceId]; if (id) return Object.assign({ d: h.distance }, id); continue; }
    if (h.object.userData.slot !== undefined) return { kind: 'slot', slot: h.object.userData.slot, d: h.distance };
    if (h.object.userData.model !== undefined) return { kind: 'model', i: h.object.userData.model, d: h.distance }; }
  return null;
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const roman = n => ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX'][n] || n;
function openCard(p) {
  if (!p) return; const art = $('mArt'); art.innerHTML = '';
  if (p.kind === 'ny') { const c = nyByN[p.n]; state.seen.add(p.n); hud(); art.appendChild(cropCanvas(p.n, 500)); $('mT').textContent = c.t; $('mMeta').innerHTML = `NEW YORKERS by MLow · No. ${c.n} · ERA ${roman(c.e)}<br>${esc(c.f || '')}${c.nb ? ' · ' + esc(c.nb) : ''}`; $('mD').innerHTML = esc(c.story || '') + `<br><br><a href="https://n3wyorkers.com/n/${c.n}" target="_blank" rel="noopener">n3wyorkers.com/n/${c.n}</a>`; }
  else if (p.kind === 'model') { const m = MODELS[p.i]; $('mT').textContent = (m.label || m.key).replace(/"/g, ''); if (m.kind === 'sculpt') { $('mMeta').innerHTML = 'MEME SCULPTURE BY MLow<br>' + esc(m.sub || 'MEME MUSEUM · CLASSIC'); $('mD').textContent = 'One of twenty classics from the MEME MUSEUM, dusted weekly by mom.'; } else { $('mMeta').innerHTML = 'NEW YORKERS 3D BY MLow<br>' + esc(m.key); $('mD').textContent = m.key === 'crystalrat' ? 'The Rat King. Elected by no one. Serving since the 1904 subway.' : 'One of a thousand New York objects MLow built in 3D, each carrying an Eye Flower. This one lives down here now.'; } }
  else return;
  $('mBar').textContent = $('mT').textContent + ' - Properties'; $('modal').style.display = 'flex'; try { document.exitPointerLock(); } catch (e) { }
}
$('mClose').onclick = () => $('modal').style.display = 'none'; $('mX').onclick = () => $('modal').style.display = 'none'; $('modal').onclick = e => { if (e.target.id === 'modal') $('modal').style.display = 'none'; };
/* pin a JPG on the corkboard, with a posting permit stamped on it */
function hangFile(file, slot) {
  if (!file || !/^image\//.test(file.type)) return;
  if (slot === undefined || slot < 0) slot = W.corkboard.findIndex(s => !s.filled); if (slot < 0) { toast('THE CORKBOARD IS FULL. AIM AT A JPG AND PRESS H TO SWAP.'); return; }
  const fr = new FileReader(); fr.onload = () => { const im = new Image(); im.onload = () => {
    const cv = document.createElement('canvas'); const s = Math.min(1, 768 / Math.max(im.width, im.height)); cv.width = Math.round(im.width * s); cv.height = Math.round(im.height * s); const c = cv.getContext('2d'); c.drawImage(im, 0, 0, cv.width, cv.height);
    c.save(); c.translate(cv.width * 0.72, cv.height * 0.78); c.rotate(-0.28); c.strokeStyle = '#c8102e'; c.lineWidth = Math.max(3, cv.width * 0.008); c.globalAlpha = 0.8; const bw = cv.width * 0.42, bh = cv.height * 0.2; c.strokeRect(-bw / 2, -bh / 2, bw, bh); c.fillStyle = '#c8102e'; c.font = `700 ${Math.round(bh * 0.3)}px "Archivo Narrow", Arial`; c.textAlign = 'center'; c.fillText('POSTING PERMIT', 0, -bh * 0.08); c.font = `600 ${Math.round(bh * 0.17)}px "IBM Plex Mono", monospace`; c.fillText('NYC DEPT OF POSTING · APPROVED', 0, bh * 0.22); c.restore();
    const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; const S = W.corkboard[slot]; S.art.material = new THREE.MeshBasicMaterial({ map: t, toneMapped: false }); const a = cv.width / cv.height; S.art.scale.set(a >= 1.56 ? 1 : a / 1.56, a >= 1.56 ? 1.56 / a : 1, 1);
    if (!S.filled) state.hung++; S.filled = true; S.name = file.name.replace(/\.[^.]+$/, ''); hud(); toast(`PINNED "${S.name.toUpperCase()}". POSTING PERMIT ISSUED. THE CORKBOARD IS NOT THE OWNER.`, 'blue'); chime(700);
  }; im.src = fr.result; }; fr.readAsDataURL(file);
}
$('file').onchange = e => { const fs = [...e.target.files]; if (slotTarget >= 0 && fs.length === 1) hangFile(fs[0], slotTarget); else fs.forEach(f => hangFile(f)); slotTarget = -1; e.target.value = ''; };
$('up').onclick = e => { e.stopPropagation(); slotTarget = -1; $('file').click(); };
addEventListener('dragover', e => { e.preventDefault(); $('drop').style.display = 'flex'; }); addEventListener('dragleave', e => { if (e.target === document.documentElement || !e.relatedTarget) $('drop').style.display = 'none'; });
addEventListener('drop', e => { e.preventDefault(); $('drop').style.display = 'none'; [...e.dataTransfer.files].forEach(f => hangFile(f)); });
$('aud').onclick = e => { e.stopPropagation(); const on = $('aud').classList.toggle('on'); $('aud').textContent = on ? 'Sound: on' : 'Sound: off'; if (on) { audioOn(); chime(); } else if (humGain) humGain.gain.value = 0; };
$('pc').onclick = e => { e.stopPropagation(); postcard(); }; $('tourb').onclick = e => { e.stopPropagation(); if (tourIdx >= 0) stopTour(); else nextTour(); };

/* ---------------- rails: the tour and the film --- cr3 is a Catmull Rom over point lists ---------------- */
function cr3(pts, u) { const n = pts.length - 1; if (n <= 0) return pts[0]; const s = u * n, i = Math.min(n - 1, Math.floor(s)), t = s - i; const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)]; const o = []; for (let k = 0; k < 3; k++) { const a = p0[k], b = p1[k], c = p2[k], d = p3[k]; o.push(0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t)); } return o; }
const RAIL = { on: false, t: 0, dur: 8, pos: null, look: null, fov: null, ease: true, done: null };
function playRail(r) { Object.assign(RAIL, { on: true, t: 0, dur: r.dur || 8, pos: r.pos, look: r.look, fov: r.fov || null, ease: r.ease !== false, done: r.done || null }); }
function applyRail(dt) { if (!RAIL.on) return; RAIL.t += dt; const lin = Math.min(1, RAIL.t / RAIL.dur), u = RAIL.ease ? lin * lin * (3 - 2 * lin) : lin; const p = cr3(RAIL.pos, u), l = cr3(RAIL.look, u); camera.position.set(p[0], p[1], p[2]); camera.up.set(0, 1, 0); camera.lookAt(l[0], l[1], l[2]); if (RAIL.fov) { camera.fov = RAIL.fov[0] + (RAIL.fov[1] - RAIL.fov[0]) * u; camera.updateProjectionMatrix(); } P.x = p[0]; P.z = p[2]; P.y = p[1] - 1.7; if (lin >= 1) { RAIL.on = false; if (RAIL.fov) { camera.fov = 66; camera.updateProjectionMatrix(); } const d = RAIL.done; RAIL.done = null; if (d) d(); } }
const TOUR = [
  { name: 'the stairs', dur: 9, pos: [[0, 4.1, 29.0], [0, 3.0, 26.6], [0, 1.75, 22.6]], look: [[0, 1.2, 23.5], [0, 1.0, 21], [0, 1.6, 16]] },
  { name: 'the window well', dur: 6, pos: [[-0.4, 1.7, 21.3], [0.4, 1.72, 22.0]], look: [[1.4, 1.78, 22], [1.4, 1.78, 22]] },
  { name: 'the tv den', dur: 10, pos: [[-0.5, 1.7, 19.4], [-2.6, 1.7, 17.2], [-3.4, 1.6, 13.6]], look: [[0, 1.0, 12.5], [0, 1.1, 12.0], [2.0, 1.4, 11.3]] },
  { name: 'the wrong room', dur: 7, pos: [[0.4, 1.62, 16.2], [-1.4, 1.58, 15.4], [-2.3, 1.55, 15.1]], look: [[-6.5, 1.3, 15.0], [-7.0, 1.2, 15.2], [-7.6, 1.1, 15.4]] },
  { name: 'the card room', dur: 9, pos: [[-5.4, 1.7, 18.5], [-7.4, 1.7, 19.6], [-9.8, 1.6, 20.9]], look: [[-8.5, 1.2, 19.6], [-8.4, 1.5, 17.0], [-11.9, 1.4, 19.0]] },
  { name: 'boiler and laundry', dur: 9, pos: [[5.6, 1.7, 13.4], [8.5, 1.7, 16.5], [9.6, 1.7, 17.2]], look: [[8.3, 0.6, 11.6], [11.6, 1.0, 13.2], [12.6, 0.4, 15.4]] },
  { name: 'the 1998 pc', dur: 6, pos: [[8.2, 1.5, 16.6], [6.9, 1.2, 17.4]], look: [[5.35, 0.6, 18.4], [5.35, 0.6, 18.4]] },
  { name: 'the infinite hallway', dur: 10, ease: false, pos: [[-2.5, 1.65, 11.5], [-2.5, 1.6, 6.5], [-2.5, 1.55, 2.2]], look: [[-2.5, 1.0, -40], [-2.5, 0.9, -40], [-2.5, 0.8, -40]] },
  { name: 'the everything bagel', dur: 12, pos: [[-4.6, 1.7, 3.0], [-10, 2.4, -2], [-16, 1.7, -4.5], [-20, 1.6, -9]], look: [[-20, 2.0, -9], [-20, 2.0, -9], [-20, 1.8, -9], [-26, 1.6, -14]] },
  { name: 'the great wave', dur: 7, pos: [[-16, 1.8, -2], [-12.5, 1.9, -4.5]], look: [[-10.4, 1.6, -6.0], [-10.4, 1.8, -6.0]] },
  { name: "the rat king's court", dur: 9, pos: [[9, 1.7, 20.0], [8.2, 1.6, 22.5], [7.0, 1.4, 25.4]], look: [[12, 1.2, 24], [9.5, 0.3, 24], [8.6, 0.9, 27.5]] },
  { name: "mom's second freezer", dur: 8, pos: [[24, 1.7, 21.5], [24, 1.8, 24.0], [23, 1.6, 25.6]], look: [[24, 1.2, 23.5], [24, 1.2, 26.5], [21, 1.5, 22]] },
  { name: 'the dryer', dur: 5, pos: [[8.3, 1.4, 14.2], [8.3, 1.0, 12.9]], look: [[8.3, 0.5, 11.6], [8.3, 0.5, 11.6]] },
  { name: 'the pegboard', dur: 6, pos: [[0.6, 1.6, 22.6], [-0.3, 1.5, 21.6]], look: [[-1.3, 1.35, 21.4], [-1.3, 1.35, 21.4]] },
  { name: 'the workbench', dur: 7, pos: [[8.0, 1.6, 14.0], [6.4, 1.5, 15.6]], look: [[4.78, 1.4, 15.6], [4.78, 1.2, 15.8]] },
  { name: 'the court desk', dur: 7, pos: [[9.6, 1.6, 23.4], [10.8, 1.3, 22.0]], look: [[12.0, 0.8, 21.0], [12.0, 0.8, 21.0]] },
  { name: 'the sofa', dur: 7, pos: [[-2.6, 1.5, 19.3], [-1.0, 1.3, 19.2]], look: [[0, 0.6, 17.4], [0.4, 0.6, 17.4]] }
];
let tourIdx = -1;
function nextTour() { tourIdx = (tourIdx + 1) % TOUR.length; const r = TOUR[tourIdx]; if (r.name.includes('freezer') && !W.freezer.open) { W.freezer.open = true; W.freezerLight.intensity = 3; } playRail(Object.assign({}, r, { done: () => { if (tourIdx >= 0) nextTour(); } })); toast('TOUR: ' + Q(r.name.toUpperCase()) + '. ANY MOVE KEY TO GET OFF.', 'blue'); }
function stopTour() { tourIdx = -1; RAIL.on = false; RAIL.done = null; teleport(camera.position.x, camera.position.z, P.yaw); }

/* ---------------- HUD chrome, teleports, start menu ---------------- */
const TP = [['THE STAIRS', 0, 22, PI], ['THE TV DEN', 0, 15.5, 0], ['THE WRONG ROOM (MIRROR)', -3.4, 15, PI / 2], ['THE CARD ROOM', -8.5, 20.8, 0], ['BOILER AND LAUNDRY', 9.6, 17.2, -2.3], ['THE INFINITE HALLWAY', -2.5, 10, 0], ['THE EVERYTHING BAGEL', -20, -1.5, 0], ["THE RAT KING'S COURT", 9, 20.2, 0], ["MOM'S SECOND FREEZER", 24, 21.5, 0]];
TP.forEach(([n, x, z, yaw]) => { const b = document.createElement('button'); b.textContent = n.charAt(0) + n.slice(1).toLowerCase(); b.onclick = e => { e.stopPropagation(); if (n.includes('FREEZER') && !W.freezer.open) { W.freezer.open = true; W.freezerLight.intensity = 3; } teleport(x, z, yaw); startMenu(false); }; $('tp').appendChild(b); });
function showHud(on) { $('hud').style.display = on ? '' : 'none'; $('hudHide').classList.toggle('on', on); }
$('hide').onclick = e => { e.stopPropagation(); showHud(false); }; $('hudX').onclick = e => { e.stopPropagation(); showHud(false); }; $('hudHide').onclick = e => { e.stopPropagation(); showHud($('hud').style.display === 'none'); };
function startMenu(on) { $('startmenu').hidden = !on; $('start').classList.toggle('on', on); }
$('start').onclick = e => { e.stopPropagation(); startMenu($('startmenu').hidden); }; document.addEventListener('pointerdown', e => { if (!e.target.closest('#startmenu') && !e.target.closest('#start')) startMenu(false); });
$('startmenu').querySelectorAll('[data-s]').forEach(b => b.onclick = e => { e.stopPropagation(); const s = b.dataset.s; startMenu(false); if (s === 'tour') { if (tourIdx >= 0) stopTour(); else nextTour(); } if (s === 'sound') $('aud').click(); if (s === 'postcard') postcard(); if (s === 'hang') { slotTarget = -1; $('file').click(); } if (s === 'shutdown') { toast(momLine('door')); state.mom++; hud(); } });
(function () { const h = $('hudTitle'), w = $('hud'); let d = null; h.addEventListener('pointerdown', e => { if (e.target.tagName === 'BUTTON') return; d = { x: e.clientX - w.offsetLeft, y: e.clientY - w.offsetTop }; h.setPointerCapture(e.pointerId); }); h.addEventListener('pointermove', e => { if (!d) return; w.style.left = clamp(e.clientX - d.x, 0, innerWidth - 60) + 'px'; w.style.top = clamp(e.clientY - d.y, 0, innerHeight - 40) + 'px'; }); h.addEventListener('pointerup', () => d = null); })();

/* ---------------- controls ---------------- */
function teleport(x, z, yaw, cy = 3) { P.x = x; P.z = z; const f = floorAt(x, z, cy); P.y = f.f === null ? 0 : f.f; P.vy = 0; P.yaw = yaw || 0; P.pitch = -0.04; P.ground = true; }
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']; let kon = [];
addEventListener('keydown', e => {
  if ($('chat').style.display === 'block') return;
  if (e.key === 'Enter') { $('chat').style.display = 'block'; $('chatIn').focus(); try { document.exitPointerLock(); } catch (er) { } e.preventDefault(); return; }
  if (e.key === 'Escape') { $('modal').style.display = 'none'; $('dlg').style.display = 'none'; }
  kon.push(e.key); kon = kon.slice(-10); if (kon.join() === KONAMI.join()) { tilt = tilt ? 0 : 0.0524; toast(tilt ? 'THE BASEMENT HAS BEEN MODIFIED BY 3 PERCENT.' : 'BACK TO 100 PERCENT.'); }
  keys[e.code] = true; if ((/^Arrow|^Space$|^Page/.test(e.code) && e.target === document.body) || /^Arrow/.test(e.code)) e.preventDefault();
  if (e.code === 'Space' && P.ground && state.started && !RIDE.on) { P.vy = 6.4; P.ground = false; P.fallFrom = P.y; e.preventDefault(); }
  if (e.code === 'KeyE') useNearest(); if (e.code === 'KeyP') postcard(); if (e.code === 'KeyC') { if (tourIdx >= 0) stopTour(); else nextTour(); }
  if (e.code === 'KeyH') { const p = pickAt(innerWidth / 2, innerHeight / 2); if (p && p.kind === 'slot') { slotTarget = p.slot; $('file').click(); } }
});
addEventListener('keyup', e => keys[e.code] = false);
$('chatIn').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') { $('chat').style.display = 'none'; return; } if (e.key !== 'Enter') return; const v = $('chatIn').value.trim(); $('chatIn').value = ''; $('chat').style.display = 'none'; if (!v) return; say(v); });
function say(v) { const w = v.toLowerCase().replace(/[^a-z0-9 ]/g, ''); let hit = false; for (const k in EGGS) if (w === k || w.split(' ').includes(k) || (k.includes(' ') && w.includes(k))) { EGGS[k](); hit = true; break; } if (!hit) { toast('YOU: ' + v); setTimeout(() => toast(momLine('door')), 900); state.mom++; hud(); } }
const cv = renderer.domElement; let drag = null;
cv.addEventListener('pointerdown', e => { if (!state.started) return; drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, id: e.pointerId }; try { cv.setPointerCapture(e.pointerId); } catch (er) { } });
cv.addEventListener('pointermove', e => { if (locked || !drag || drag.id !== e.pointerId) return; P.yaw -= (e.clientX - drag.x) * 0.0042; P.pitch = clamp(P.pitch - (e.clientY - drag.y) * 0.0042, -1.35, 1.35); drag.x = e.clientX; drag.y = e.clientY; });
cv.addEventListener('pointerup', e => { if (!drag) return; const moved = Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy); drag = null; if (moved < 6) { const p = locked ? pickAt(innerWidth / 2, innerHeight / 2) : pickAt(e.clientX, e.clientY); if (p && p.kind === 'slot') { slotTarget = p.slot; $('file').click(); } else if (p) openCard(p); else if (!locked && !isMobile) { try { const r = cv.requestPointerLock(); if (r && r.catch) r.catch(() => { }); } catch (er) { } } } });
cv.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === cv; });
document.addEventListener('mousemove', e => { if (!locked) return; P.yaw -= e.movementX * 0.0022; P.pitch = clamp(P.pitch - e.movementY * 0.0022, -1.35, 1.35); });
const joy = { x: 0, y: 0, id: null }; if (isMobile) { $('joy').style.display = 'block'; $('mbtn').style.display = 'flex'; }
$('joy').addEventListener('pointerdown', e => { joy.id = e.pointerId; $('joy').setPointerCapture(e.pointerId); joyMove(e); }); $('joy').addEventListener('pointermove', e => { if (joy.id === e.pointerId) joyMove(e); }); $('joy').addEventListener('pointerup', () => { joy.id = null; joy.x = joy.y = 0; $('joy').firstElementChild.style.transform = ''; });
function joyMove(e) { const r = $('joy').getBoundingClientRect(); let dx = e.clientX - r.left - 60, dy = e.clientY - r.top - 60; const d = Math.hypot(dx, dy); if (d > 44) { dx *= 44 / d; dy *= 44 / d; } joy.x = dx / 44; joy.y = dy / 44; $('joy').firstElementChild.style.transform = `translate(${dx}px,${dy}px)`; }
$('mJump').onclick = () => { if (P.ground) { P.vy = 6.4; P.ground = false; P.fallFrom = P.y; } }; $('mUse').onclick = () => useNearest();
let nearest = null; function useNearest() { if (nearest && nearest.fn) nearest.fn(); }

function stepPlayer(dt) {
  let fx = 0, fz = 0;
  if (keys.KeyW || keys.ArrowUp) fz -= 1; if (keys.KeyS || keys.ArrowDown) fz += 1; if (keys.KeyA) fx -= 1; if (keys.KeyD) fx += 1; fx += joy.x; fz += joy.y;
  if (keys.ArrowLeft) P.yaw += 2.6 * dt; if (keys.ArrowRight) P.yaw -= 2.6 * dt; if (keys.PageUp) P.pitch = clamp(P.pitch + 1.6 * dt, -1.35, 1.35); if (keys.PageDown) P.pitch = clamp(P.pitch - 1.6 * dt, -1.35, 1.35);
  const len = Math.hypot(fx, fz), moving = len > 0.05; if (moving) { fx /= Math.max(1, len); fz /= Math.max(1, len); }
  const spd = (keys.ShiftLeft || keys.ShiftRight ? 6.2 : 3.4), s = Math.sin(P.yaw), c = Math.cos(P.yaw), dx = (fx * c + fz * s) * spd * dt, dz = (-fx * s + fz * c) * spd * dt;
  const tryMove = (nx, nz) => { const f = floorAt(nx, nz, P.y); if (f.block) return false; if (f.f === null && P.ground) return false; return true; };
  if (tryMove(P.x + dx, P.z + dz)) { P.x += dx; P.z += dz; } else if (tryMove(P.x + dx, P.z)) P.x += dx; else if (tryMove(P.x, P.z + dz)) P.z += dz;
  collide(P, P.y);
  const f = floorAt(P.x, P.z, P.y);
  if (!P.ground || f.f === null || P.y > f.f + 0.05) { if (P.ground) { P.ground = false; P.fallFrom = P.y; } P.vy -= 22 * dt; P.y += P.vy * dt; if (f.f !== null && P.y <= f.f) { P.y = f.f; P.vy = 0; P.ground = true; } if (f.f === null && P.y < -3) { toast('YOU FELL THROUGH THE BASEMENT. THERE IS A SUB BASEMENT. THERE IS ALWAYS A SUB BASEMENT.'); teleport(0, 15.5, 0); } }
  else { P.y += (f.f - P.y) * Math.min(1, dt * 16); P.vy = 0; }
  if (moving) { state.idle = 0; } else { state.idle += dt; if (state.idle > 45 && !state.idleSaid) { state.idleSaid = true; toast(MOM.idle); state.mom++; hud(); } if (state.idle < 1) state.idleSaid = false; }
  if (moving) state.idleSaid = false;
}

/* ---------------- world updates ---------------- */
let chartCols = null;
function updateWorld(dt, t) {
  // the set, the lava lamp, the table's wobble, the dryer
  if (Math.floor(t * 12) !== updateWorld.f) { updateWorld.f = Math.floor(t * 12); if (near(0, 14, 10)) drawCRT(); } W.crt.light.intensity = 0.9 + Math.random() * 0.5;
  W.lava.blobs.forEach(b => { b.m.position.y = 0.72 + (Math.sin(t * b.sp + b.ph) * 0.5 + 0.5) * 0.26; b.m.scale.setScalar(0.85 + Math.sin(t * 1.3 + b.ph) * 0.2); }); W.lava.light.intensity = 1.4 + Math.sin(t * 2) * 0.3;
  if (!W.table.userData.still) W.table.rotation.z = Math.sin(t * 3.1) * 0.004 + Math.sin(t * 7.3) * 0.002;
  W.dryer.drum.rotation.z += dt * 3.2; if (W.dryer.hodl) { W.dryer.sock.rotation.z = -W.dryer.drum.rotation.z; } else W.dryer.sock.rotation.z = 0;
  // the boiler light breathes, the fluorescent flickers, the bulb hum
  W.boilerLight.intensity = 1.0 + Math.sin(t * 1.7) * 0.3 + (W.boilerKnock > 0 ? 2 : 0); if (W.boilerKnock > 0) W.boilerKnock -= dt;
  practicals.forEach(p => { if (p.userData.flicker) p.intensity = p.userData.base * (Math.random() < 0.03 ? 0.4 : 1); });
  // the bagel breathes; the cream cheese creeps; the seeds ride it
  W.bagel.scale.setScalar(1 + Math.sin(t * 0.5) * 0.006); MAT.cream.map.offset.set(t * 0.002, t * 0.0015); MAT.cream.normalMap.offset.copy(MAT.cream.map.offset);
  // the rats: a loop, or a candlestick chart when you stand still in the court
  const inCourt = P.x > 5 && P.x < 13 && P.z > 19.25 && P.z < 28; if (inCourt && state.idle > 6) { if (!chartCols) { chartCols = W.rats.map((r, i) => ({ x: 6.2 + i * 0.55, z: 23.4, h: 0.3 + Math.abs(Math.sin(i * 1.3)) * 1.1, up: i % 3 !== 1 })); toast('THE RATS ARE SHOWING YOU THE CHART. THE GREEN CANDLE WILL BE EATEN.', 'blue'); state.eggs.add('chart'); state.rats += 12; hud(); } } else if (chartCols && (!inCourt || state.idle < 1)) chartCols = null;
  W.rats.forEach((r, i) => { let tx, tz; if (chartCols) { const c = chartCols[i]; tx = c.x; tz = c.z - (c.up ? c.h * 0.6 : 0); } else { r.a += dt * r.sp * 0.5; tx = 8.6 + Math.cos(r.a) * 2.5; tz = 23.6 + Math.sin(r.a) * 2.2; }
    const dx = tx - r.g.position.x, dz = tz - r.g.position.z, d = Math.hypot(dx, dz); if (d > 0.02) { const st = Math.min(d, dt * 1.6); r.g.position.x += dx / d * st; r.g.position.z += dz / d * st; r.g.rotation.y = Math.atan2(dx, dz); } r.g.position.y = Math.abs(Math.sin(t * 9 + r.bob)) * 0.02; });
  // the cat: breathes, blinks, leaves when told twice
  if (W.cat) { W.cat.scale.y = 1 + Math.sin(t * 2.2) * 0.02; const bl = Math.sin(t * 0.7) > 0.985 ? 0.2 : 1; W.cat.userData.l.scale.y = W.cat.userData.r.scale.y = bl; if (W.cat.userData.moving) { W.cat.position.x += dt * 0.5; W.cat.position.z -= dt * 0.15; W.cat.rotation.y = -PI / 2 + 0.3; if (W.cat.position.x > 10.6) { W.cat.userData.moving = false; W.cat.position.set(10.6, 0.2, 26.4); W.cat.rotation.y = PI; } } }
  if (W.freezer.lid) W.freezer.lid.rotation.x += ((W.freezer.open ? -1.5 : 0) - W.freezer.lid.rotation.x) * Math.min(1, dt * 3);
  if (W.door) W.door.rotation.y = 0.28 + Math.sin(t * 0.4) * 0.01;
  // the key light follows the nearest bulb to the visitor, so one shadow map serves the whole house
  let best = null, bd = 1e9; BULBS.forEach(b => { const d = Math.hypot(P.x - b.x, P.z - b.z); if (d < bd) { bd = d; best = b; } });
  if (best) { KEY.position.set(best.x, best.y - 0.05, best.z); KEY.target.position.set(best.x, 0, best.z); KEY.intensity = 1.5 * LS; KEY.color.set(best.color); best.l.intensity = best.l.userData.base * 0.55; }
}
function updateDelights(dt) { momTick(dt); ccTick(dt); state.under += dt; }

/* ---------------- post: a quiet grade, a vignette, grain, bloom for the lava lamp and the bulbs ---------------- */
const POST = { on: false, comp: null, bloom: null, grade: null };
function setupPost() { if (!THREE.EffectComposer || !THREE.UnrealBloomPass || !THREE.GammaCorrectionShader) return;
  try { const sz = renderer.getSize(new THREE.Vector2()), comp = new THREE.EffectComposer(renderer); comp.addPass(new THREE.RenderPass(scene, camera)); const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(sz.x, sz.y), 0.32, 0.5, 0.92); comp.addPass(bloom);
    const grade = new THREE.ShaderPass({ uniforms: { tDiffuse: { value: null }, uVig: { value: 0.34 }, uSat: { value: 0.96 }, uTime: { value: 0 }, uGrain: { value: 0.03 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform sampler2D tDiffuse; uniform float uVig, uSat, uTime, uGrain; varying vec2 vUv;\nfloat h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }\nvoid main(){ vec4 c = texture2D(tDiffuse, vUv); float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722)); c.rgb = mix(vec3(l), c.rgb, uSat); c.rgb = mix(c.rgb, c.rgb * vec3(1.04, 0.98, 0.9), 0.5); vec2 d = vUv - 0.5; c.rgb *= 1.0 - uVig * dot(d, d) * 2.4; c.rgb += (h(vUv * 997.0 + uTime) - 0.5) * uGrain * (0.4 + l); gl_FragColor = c; }' }); comp.addPass(grade);
    comp.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader)); POST.comp = comp; POST.bloom = bloom; POST.grade = grade; POST.on = true; } catch (e) { POST.on = false; } }
function renderFrame() { if (POST.on) { POST.grade.uniforms.uTime.value = (T * 60) % 1000; POST.comp.render(); } else renderer.render(scene, camera); }
/* the reflection probe: one equirect built from the wrong room's photograph, at eye height, for the plastic, the glass, the pipes */
const ENV = { on: false };
function setupEnv() { try { const img = PLATES.room.image; if (!img || !img.width) return; const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#2a1e14'; g.fillRect(0, 0, 512, 256); g.drawImage(img, 0, 48, 256, 160); g.drawImage(img, 256, 48, 256, 160); g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 208, 512, 48);
  const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.encoding = THREE.sRGBEncoding; const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromEquirectangular(t).texture; ENV.on = true; ENV.probe = 3;
  scene.traverse(o => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; ms.forEach(m => { if (m.isMeshStandardMaterial && m.envMapIntensity === undefined) m.envMapIntensity = m.metalness > 0.5 ? 0.9 : 0.35; }); }); } catch (e) { ENV.on = false; } }

/* ---------------- the loop ---------------- */
function frame(dt) {
  dt = dt > 0 ? Math.min(dt, 0.1) : 0; T += dt;
  if (state.started && !RIDE.on && !RAIL.on) stepPlayer(dt);
  if (RAIL.on && tourIdx >= 0 && (keys.KeyW || keys.KeyS || keys.KeyA || keys.KeyD || keys.ArrowUp || keys.ArrowDown || joy.x || joy.y)) stopTour();
  updateModels(dt); updateWorld(dt, T); updateDelights(dt); if (typeof v2Tick === 'function' && typeof V2 !== 'undefined') v2Tick(dt, T); flushCards();
  const bob = state.started && P.ground && (keys.KeyW || keys.KeyS || keys.KeyA || keys.KeyD || joy.x || joy.y) ? Math.sin(T * 9) * 0.03 : 0;
  camera.position.set(P.x, P.y + 1.7 + bob, P.z); camera.rotation.set(P.pitch, P.yaw, tilt);
  if (RIDE.on) { RIDE.t += dt; const a = RIDE.t / RIDE.dur * PI * 2; camera.position.set(W.dryer.x + Math.sin(a) * 0.02, 0.5 + Math.cos(a) * 0.02, W.dryer.z + 0.1); camera.rotation.set(0, 0, a); camera.rotateY(PI); P.x = W.dryer.x; P.z = W.dryer.z + 1.0; if (RIDE.t >= RIDE.dur) endDryer(); }
  applyRail(dt);
  let zn = 'THE BASEMENT'; for (const z of ZONES) if (P.x >= z.x0 && P.x <= z.x1 && P.z >= z.z0 && P.z <= z.z1) { zn = z.name; } if (zn !== zoneName) { zoneName = zn; $('zone').textContent = Q(zn); }
  nearest = null; let nd = 1e9; for (const it of INTER) { if (!it.label) continue; const d = Math.hypot(P.x - it.x, P.z - it.z); if (d < it.r && d < nd) { nd = d; nearest = it; } }
  $('prompt').style.display = nearest && state.started && !RIDE.on ? 'block' : 'none'; if (nearest) $('prompt').textContent = nearest.label;
  aimT -= dt; if (aimT <= 0 && state.started) { aimT = 0.15; const p = pickAt(innerWidth / 2, innerHeight / 2); const a = $('aim');
    if (p && p.d < 14) { a.style.display = 'block'; a.textContent = p.kind === 'ny' ? `NEW YORKERS No. ${p.n} · ${nyByN[p.n].t}` : p.kind === 'model' ? (MODELS[p.i].kind === 'sculpt' ? 'SCULPTURE · ' : 'NEW YORKERS 3D · ') + MODELS[p.i].label : p.kind === 'slot' ? (W.corkboard[p.slot].filled ? Q(W.corkboard[p.slot].name) + ' · H TO SWAP' : 'EMPTY · H TO PIN A JPG') : ''; if (p.kind === 'ny' && !state.seen.has(p.n)) { state.seen.add(p.n); hud(); } } else a.style.display = 'none'; }
  if (Math.floor(T) !== frame.sec) { frame.sec = Math.floor(T); hud(); clockHud(); }
  renderFrame();
  if (ENV.on && ENV.probe > 0 && --ENV.probe === 0) { try { const gl = renderer.getContext(), px = new Uint8Array(4); let dark = 0; [[0.5, 0.3], [0.3, 0.35], [0.7, 0.35], [0.5, 0.5], [0.2, 0.25]].forEach(([x, y]) => { gl.readPixels(Math.floor(gl.drawingBufferWidth * x), Math.floor(gl.drawingBufferHeight * y), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); if (px[0] + px[1] + px[2] < 3) dark++; }); if (dark >= 4) { scene.environment = null; ENV.on = false; console.warn('BASEMENT: reflections disabled, this GPU rendered them black'); } } catch (e) { } }
}
function loop(now) { const dt = clamp((now - last) / 1000, 0, 0.05); last = now; if (!window.__pauseLoop) frame(dt); requestAnimationFrame(loop); }

/* ---------------- boot ---------------- */
buildCards(); teleport(0, 22.2, PI); P.pitch = 0.02;
addEventListener('resize', () => { if (window.__lockSize) return; camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); if (POST.on) POST.comp.setSize(innerWidth, innerHeight); });
setupPost(); hud();
$('go').onclick = () => { $('enter').style.display = 'none'; state.started = true; setupEnv(); toast("WELCOME TO YOUR MOM'S BASEMENT. 120 NEW YORKERS. 20 TROPHIES. ONE BAGEL. SHE IS UPSTAIRS.", 'blue'); setTimeout(() => toast('TRY TYPING gm. PRESS ENTER FIRST.'), 2600); if (!isMobile) { try { const r = cv.requestPointerLock(); if (r && r.catch) r.catch(() => { }); } catch (e) { } } };
requestAnimationFrame(loop);
window.__game = { get V2() { return V2; }, POST, RAIL, TOUR, playRail, renderFrame, SCL, MODELS, W, RIDE, startDryer, openFreezer, mining, postcard, say, EGGS, P, state, scene, camera, renderer, teleport, frame, floorAt, collide, SEGS, CIRCS, PADS, INTER, ZONES, HUNG, pickAt, openCard, cardBuf, keys, setPost: on => { POST.on = on && !!POST.comp; }, start: () => { $('enter').style.display = 'none'; state.started = true; }, step: (dt, n) => { for (let i = 0; i < (n || 1); i++) frame(dt || 1 / 60); } };
