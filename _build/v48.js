/* ================================================================
   v48 THREE CARD MONTE (2026-11-22)
   A hustler at a cardboard box on the corner by (48, -9), a lookout leaning on the lamp post. E to play: he shows
   you the eye (the evil eye card), turns the three cards over and runs them. The shuffle is honest, every swap is
   on screen, so a careful eye can follow it. Look at the card you want and press E (or tap). Win and he pays five
   TDH and speeds up; win three times and the lookout calls it and they pack up and walk off for a minute.
   ================================================================ */
const MONTE = { phase: 'idle', t: 0, wins: 0, streak: 0, pos: [0, 1, 2], eye: 1, swaps: [], gone: 0, hi: -1 };
window.__MONTE = MONTE;
const MONTE_AT = { x: 48, z: -9 };
(function monteTable() {
  const x = MONTE_AT.x, z = MONTE_AT.z, g0 = ground(x, z), ry = Math.atan2(-x, -z);   // he faces the middle of the island
  const G = new THREE.Group(); G.position.set(x, g0, z); G.rotation.y = ry; scene.add(G); MONTE.G = G; MONTE.ry = ry;
  const card = new THREE.MeshStandardMaterial({ color: 0x55391b, roughness: 0.95 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.46), card); box.position.y = 0.31; G.add(box); MONTE.box = box;
  const flap = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.2), card); flap.position.set(0, 0.52, 0.235); flap.rotation.x = 0.35; G.add(flap);
  const scrawl = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.16), new THREE.MeshBasicMaterial({ map: signTex([{ t: 'FIND THE EYE', s: 0.5 }], 512, 160, '#a5875c', '#1b1b1b'), toneMapped: false })); scrawl.position.set(0, 0.34, 0.231); G.add(scrawl);
  // the cards: a navy back with the eye mark, one face is the evil eye
  const bcv = document.createElement('canvas'); bcv.width = 128; bcv.height = 180; let c = bcv.getContext('2d');
  if (c && c.beginPath && c.ellipse && c.fillText) { c.fillStyle = '#efe8da'; c.fillRect(0, 0, 128, 180); c.fillStyle = '#16213f'; c.fillRect(6, 6, 116, 168); c.strokeStyle = '#08DEFF'; c.lineWidth = 2; for (let i = 0; i < 9; i++) { c.beginPath(); c.ellipse(64, 90, 10 + i * 7, 14 + i * 9, 0, 0, PI * 2); c.stroke(); } c.fillStyle = '#efe8da'; c.font = '700 14px "Archivo Expanded",Arial'; c.textAlign = 'center'; c.fillText('N3W', 64, 168); }
  const fcv = document.createElement('canvas'); fcv.width = 128; fcv.height = 180; c = fcv.getContext('2d');
  if (c && c.beginPath && c.ellipse && c.fillText) { c.fillStyle = '#efe8da'; c.fillRect(0, 0, 128, 180); [[38, '#1E77E3'], [24, '#ffffff'], [17, '#08DEFF'], [10, '#111111']].forEach(([r, col]) => { c.fillStyle = col; c.beginPath(); c.arc(64, 86, r, 0, PI * 2); c.fill(); }); c.fillStyle = '#1b1b1b'; c.font = '400 20px Anton,Impact'; c.textAlign = 'center'; c.fillText('THE EYE', 64, 160); }
  const blank = document.createElement('canvas'); blank.width = 128; blank.height = 180; c = blank.getContext('2d');
  const drawBlank = () => { const c = blank.getContext('2d'); if (!c || !c.fillText) return; c.fillStyle = '#efe8da'; c.fillRect(0, 0, 128, 180); c.fillStyle = '#c03a2b'; c.font = '400 54px "Permanent Marker",cursive'; c.textAlign = 'center'; c.fillText('ngmi', 64, 106); if (MONTE.noTex) MONTE.noTex.needsUpdate = true; };
  drawBlank(); if (!window.__fontsReady) addEventListener('n3wfonts', drawBlank, { once: true });
  const mk = cv => { const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; return t; };
  const backM = new THREE.MeshStandardMaterial({ map: mk(bcv), roughness: 0.5 }), eyeM = new THREE.MeshStandardMaterial({ map: mk(fcv), roughness: 0.5 }), noM = new THREE.MeshStandardMaterial({ map: mk(blank), roughness: 0.5 }); MONTE.noTex = noM.map;
  MONTE.hiM = new THREE.MeshStandardMaterial({ map: backM.map, roughness: 0.5, emissive: 0x2962FF, emissiveIntensity: 0.35 }); MONTE.backM = backM;
  MONTE.cards = [0, 1, 2].map(i => { const cg = new THREE.Group(); const geo = new THREE.PlaneGeometry(0.11, 0.155);
    const b = new THREE.Mesh(geo, backM); b.rotation.x = -PI / 2; b.position.y = 0.0012; cg.add(b);
    const f = new THREE.Mesh(geo, i === 1 ? eyeM : noM); f.rotation.x = PI / 2; f.rotation.z = PI; cg.add(f);
    cg.position.set((i - 1) * 0.17, 0.622, 0.02); G.add(cg); return { g: cg, back: b }; });
  // the hustler behind the box and the lookout on the post
  const hx = x - Math.sin(ry) * 0.62, hz = z - Math.cos(ry) * 0.62; const h = person(0x2c2c30, 0x1d1d22, SKIN[0], 'wiseguy'); h.g.position.set(hx, g0 - 0.35, hz); h.g.rotation.y = ry; MONTE.hustler = h;
  const lx = x + Math.cos(ry) * 3.2 - Math.sin(ry) * 0.6, lz = z - Math.sin(ry) * 3.2 - Math.cos(ry) * 0.6; const L = person(0x7b2f2a, 0x22324f, SKIN[5], 'cabbie'); L.g.position.set(lx, g0 - 0.35, lz); L.g.rotation.y = ry + 1.2; MONTE.look = L;
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.2, 8), new THREE.MeshStandardMaterial({ color: 0x1c2a22, metalness: 0.6, roughness: 0.5 })); lamp.position.set(lx + Math.cos(ry + 1.2) * -0.5, g0 + 2.1, lz + Math.sin(ry + 1.2) * 0.5); scene.add(lamp);
  if (typeof CIRCS !== 'undefined') CIRCS.push(MONTE.col = { x, z, r: 0.45, y0: -5, y1: 3, on: true });
  MONTE.ix = x + Math.sin(ry) * 1.1; MONTE.iz = z + Math.cos(ry) * 1.1;
  interact(MONTE.ix, MONTE.iz, 1.6, 'E · FIND THE EYE (FIVE TDH)', () => monteE());
})();
const monteSecret = secret('monte', () => { });
const monteWin = secret('montewin', () => { toast('YOU FOUND THE EYE. HE LOOKS AT YOU LIKE YOU ARE A PROBLEM.', 'blue'); });
const monteCops = secret('montecops', () => { });
function monteE() {
  if (MONTE.gone > 0) return;
  if (MONTE.phase === 'pick') { if (MONTE.hi >= 0) monteResolve(MONTE.hi); else toast('LOOK RIGHT AT THE CARD YOU WANT, THEN E.'); return; }
  if (MONTE.phase !== 'idle') return; monteSecret();
  MONTE.phase = 'show'; MONTE.t = 0; MONTE.applied = 0; MONTE.pos = [0, 1, 2]; MONTE.eye = 1; toast('THERE IS THE EYE. KEEP YOUR EYE ON THE EYE.');
  try { talk('Find the eye, find the eye. Easy money.'); } catch (e) { }
  const n = 5 + MONTE.streak * 3; MONTE.swaps = []; for (let i = 0; i < n; i++) { const a = Math.random() * 3 | 0; let b = Math.random() * 2 | 0; if (b >= a) b++; MONTE.swaps.push([a, b]); }
  MONTE.sw = 0.62 - Math.min(0.32, MONTE.streak * 0.11);   // seconds a swap takes
}
function monteResolve(slot) {
  const card = MONTE.pos.indexOf(slot), right = card === MONTE.eye; MONTE.phase = 'reveal'; MONTE.t = 0; MONTE.pick = slot;
  if (right) { MONTE.streak++; MONTE.wins++; state.tdh = (state.tdh || 0) + 5; monteWin(); if (MONTE.streak >= 3) { MONTE.phase = 'cops'; MONTE.t = 0; toast('THE LOOKOUT: FIVE OH! FIVE OH! THEY FOLD THE BOX AND WALK.'); try { talk('Five oh! Five oh!'); } catch (e) { } monteCops(); MONTE.streak = 0; } }
  else { MONTE.streak = 0; state.tdh = Math.max(0, (state.tdh || 0) - 5); toast(['NGMI. HE TAKES YOUR FIVE TDH WITH GREAT RESPECT.', 'IT WAS NEVER UNDER THAT ONE. IT IS NEVER UNDER THAT ONE.', 'THE LOOKOUT SAYS HE ALMOST HAD IT TOO, ONCE, IN 2019.'][Math.random() * 3 | 0]); }
  try { hud(); } catch (e) { }
}
const _mv = new THREE.Vector3();
function monteFrame(dt) {
  const T = MONTE; T.t += dt; const C = T.cards;
  if (T.gone > 0) { T.gone -= dt; if (T.gone <= 0) { T.G.visible = T.hustler.g.visible = T.look.g.visible = true; T.col.on = true; } return; }
  const slotX = s => (s - 1) * 0.17;
  const flipTo = (cg, up, k) => { k = Math.max(0, Math.min(1, k)); cg.rotation.z = up ? PI * Math.min(1, k) : PI * (1 - Math.min(1, k)); cg.position.y = 0.622 + Math.sin(Math.min(1, k) * PI) * 0.06; };
  if (T.phase === 'idle') { C.forEach((cd, i) => { cd.g.rotation.z = 0; cd.g.position.set(slotX(T.pos[i]), 0.622, 0.02); }); }
  else if (T.phase === 'show') { const k = T.t / 0.3; flipTo(C[T.eye].g, true, k); if (T.t > 1.6) flipTo(C[T.eye].g, false, (T.t - 1.6) / 0.3); if (T.t > 2.1) { C[T.eye].g.rotation.z = 0; C[T.eye].g.position.y = 0.622; T.phase = 'run'; T.t = 0; } }
  else if (T.phase === 'run') { const i = Math.floor(T.t / T.sw), k = (T.t - i * T.sw) / T.sw;
    while ((T.applied || 0) < Math.min(i, T.swaps.length)) { const [a, b] = T.swaps[T.applied]; const ca = T.pos.indexOf(a), cb = T.pos.indexOf(b); T.pos[ca] = b; T.pos[cb] = a; T.applied++; if (Math.hypot(P.x - MONTE_AT.x, P.z - MONTE_AT.z) < 8) beep(900, 0.02, 'square', 0.02); }
    if (i >= T.swaps.length) { T.phase = 'pick'; T.t = 0; T.applied = 0; C.forEach((cd, j) => cd.g.position.set(slotX(T.pos[j]), 0.622, 0.02)); toast('WHERE IS THE EYE? LOOK AT IT AND PRESS E.'); }
    else { const [a, b] = T.swaps[i]; const ca = T.pos.indexOf(a), cb = T.pos.indexOf(b);
      C.forEach((cd, j) => { if (j !== ca && j !== cb) { cd.g.position.set(slotX(T.pos[j]), 0.622, 0.02); } });
      const e = k * k * (3 - 2 * k); const ax = slotX(a), bx = slotX(b);
      C[ca].g.position.set(ax + (bx - ax) * e, 0.622, 0.02 + Math.sin(e * PI) * 0.07); C[cb].g.position.set(bx + (ax - bx) * e, 0.622, 0.02 - Math.sin(e * PI) * 0.07);
      T.hustler.g.rotation.z = Math.sin(T.t * 22) * 0.03; } }
  else if (T.phase === 'pick') {
    // which card is the player looking at
    let best = -1, bd = 0.3; C.forEach((cd, j) => { cd.g.getWorldPosition(_mv); _mv.project(camera); const d = Math.hypot(_mv.x, _mv.y * (innerHeight / innerWidth)); if (_mv.z < 1 && d < bd) { bd = d; best = T.pos[j]; } });
    T.hi = best; C.forEach((cd, j) => { cd.back.material = T.pos[j] === best ? T.hiM : T.backM; });
    if (T.t > 25) { T.phase = 'idle'; T.hi = -1; C.forEach(cd => cd.back.material = T.backM); toast('HE GETS BORED AND RUNS IT FOR SOMEONE ELSE.'); } }
  else if (T.phase === 'reveal' || T.phase === 'cops') { C.forEach(cd => cd.back.material = T.backM); C.forEach((cd, j) => flipTo(cd.g, true, (T.t - (T.pos[j] === T.pick ? 0 : 0.4)) / 0.3));
    if (T.t > 2.6) { if (T.phase === 'cops') { T.G.visible = T.hustler.g.visible = T.look.g.visible = false; T.col.on = false; T.gone = 60; } T.phase = 'idle'; T.hi = -1; } }
}
window.__FRAMES.push(dt => { try { monteFrame(dt); } catch (e) { if (!MONTE.err) { MONTE.err = e; console.warn('v48 monte', e); } } });
MONTE.e = monteE;
