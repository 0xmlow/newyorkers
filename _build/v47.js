/* ================================================================
   v47 THE HANDBALL WALL (2026-11-22)
   A free standing park handball wall at (-78, -21), the kind every New York playground has, already carrying a
   few tags (N3W, an Open Eye Flower, gm, MLOW). E picks up a can: hold the mouse (or a finger) to spray where you
   look, R changes colour (the Impermanent Vision palette: cobalt, cyan, hot pink, bone, copper, ink), E puts the
   can down. Heavy paint runs: drips crawl down the wall under the stroke. Your wall is kept in this browser.
   ================================================================ */
const WALLP = { on: false, col: 0, drips: [], spray: false, cool: 0, dirty: 0, strokes: 0 };
window.__WALLP = WALLP;
const WALL_AT = { x: -78, z: -21 };
WALLP.cols = ['#2962FF', '#08DEFF', '#ff3fa4', '#efe8da', '#c8743a', '#0d0d0d'];
WALLP.names = ['COBALT', 'CYAN', 'HOT PINK', 'BONE', 'COPPER', 'INK'];
(function handballWall() {
  const ry = Math.atan2(-WALL_AT.x, -WALL_AT.z);                  // the painted face looks at the middle of the island
  const W = 7.2, H = 4.4, D = 0.45, g0 = ground(WALL_AT.x, WALL_AT.z);
  const G = new THREE.Group(); G.position.set(WALL_AT.x, g0, WALL_AT.z); G.rotation.y = ry; scene.add(G); WALLP.G = G; WALLP.ry = ry;
  const conc = new THREE.MeshStandardMaterial({ color: 0x9a948a, roughness: 0.92 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), conc); body.position.y = H / 2 - 0.1; body.castShadow = body.receiveShadow = true; G.add(body);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(W + 0.12, 0.12, D + 0.12), new THREE.MeshStandardMaterial({ color: 0x8f8a80, roughness: 0.8 })); cap.position.y = H - 0.04; G.add(cap);
  // the painted face: a canvas the size of the wall
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 626; const c = cv.getContext('2d'); WALLP.cv = cv; WALLP.c = c;
  const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO; WALLP.tex = t;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(W, H - 0.1), new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 })); face.position.set(0, H / 2 - 0.1, D / 2 + 0.006); face.receiveShadow = true; G.add(face); WALLP.face = face;
  // the back gets the old handball line and a faded mural ghost
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W, H - 0.1), new THREE.MeshStandardMaterial({ map: signTex([{ t: 'NO BALL PLAYING AFTER DARK', s: 0.1 }, { t: 'NYC PARKS', s: 0.07 }], 1024, 626, '#a9a398', '#5b564e'), roughness: 0.9 }));
  back.position.set(0, H / 2 - 0.1, -D / 2 - 0.006); back.rotation.y = PI; G.add(back);
  // collision: the wall itself
  const cs = Math.cos(ry), sn = Math.sin(ry); boxWalls(WALL_AT.x, WALL_AT.z, W, D, ry, -5, 6);
  // a drift of cans at the foot
  const canM = WALLP.cols.map(h => new THREE.MeshStandardMaterial({ color: h, roughness: 0.35, metalness: 0.5 }));
  for (let i = 0; i < 6; i++) { const can = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.2, 10), canM[i]); const lx = -1.6 + i * 0.22 + (i > 2 ? 0.6 : 0), lz = D / 2 + 0.25 + (i % 2) * 0.1; can.position.set(lx, 0.1, lz); if (i === 4) { can.rotation.z = PI / 2; can.position.y = 0.04; } G.add(can); }
  WALLP.fx = WALL_AT.x + sn * 2.4; WALLP.fz = WALL_AT.z + cs * 2.4;   // where you stand to paint
  wallBase(); wallLoad();
  // the tags are in Permanent Marker: draw them again once the island's fonts have arrived (unless you have already painted)
  if (!window.__fontsReady) addEventListener('n3wfonts', () => { if (!WALLP.loaded && !WALLP.strokes) { wallBase(); wallLoad(); } }, { once: true });
  interact(WALLP.fx, WALLP.fz, 2.4, 'E · PICK UP A CAN AND TAG THE WALL', () => wallToggle());
  const lab = signTex([{ t: 'THE HANDBALL WALL', s: 0.36 }, { t: 'PICK UP A CAN · E', s: 0.14 }], 1024, 256, '#2f4a3a', '#FFFFFF');
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: lab, toneMapped: false, side: THREE.DoubleSide }));
  sg.position.set(WALL_AT.x + cs * 4.6 + sn * 1.2, g0 + 1.9, WALL_AT.z - sn * 4.6 + cs * 1.2); sg.rotation.y = ry; scene.add(sg);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.9, 6), new THREE.MeshStandardMaterial({ color: 0x1d2b24, metalness: 0.5, roughness: 0.5 })); pole.position.set(sg.position.x, g0 + 0.95, sg.position.z); scene.add(pole);
})();
function wallBase() {
  const c = WALLP.c, W = 1024, H = 626; if (!c || !c.beginPath || !c.createRadialGradient || !c.strokeText) return; c.fillStyle = '#bdb6aa'; c.fillRect(0, 0, W, H);
  // concrete: speckle, board seams, a rain stain from the cap
  for (let i = 0; i < 2400; i++) { const v = 150 + Math.random() * 60 | 0; c.fillStyle = `rgba(${v},${v - 4},${v - 10},${0.15 + Math.random() * 0.2})`; c.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 2, 1 + Math.random() * 2); }
  c.strokeStyle = 'rgba(90,85,78,.25)'; c.lineWidth = 2; for (let x = 128; x < W; x += 128) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
  const st = c.createLinearGradient(0, 0, 0, 160); st.addColorStop(0, 'rgba(60,58,52,.35)'); st.addColorStop(1, 'rgba(60,58,52,0)'); c.fillStyle = st; c.fillRect(0, 0, W, 160);
  // the court line at 0.9 m, in old red paint
  c.fillStyle = 'rgba(176,52,40,.8)'; c.fillRect(0, H - 0.9 / 4.3 * H, W, 5);
  // the tags that were already here
  c.save(); c.translate(150, 360); c.rotate(-0.08); c.font = '400 120px "Permanent Marker",cursive'; c.lineWidth = 10; c.strokeStyle = '#0d0d0d'; c.strokeText('N3W', 0, 0); c.fillStyle = '#2962FF'; c.fillText('N3W', 0, 0); c.restore();
  c.save(); c.translate(760, 170); c.rotate(0.06); c.font = '400 70px "Permanent Marker",cursive'; c.fillStyle = '#ff3fa4'; c.fillText('gm', 0, 0); c.restore();
  c.save(); c.translate(820, 520); c.font = '400 44px "Permanent Marker",cursive'; c.fillStyle = '#0d0d0d'; c.fillText('MLOW', 0, 0); c.restore();
  const img = new Image(); img.onload = () => { if (WALLP.loaded) return; c.globalAlpha = 0.95; c.drawImage(img, 520, 250, 220, 220); c.globalAlpha = 1; wallDrips(560, 470, 6, '#2962FF'); WALLP.tex.needsUpdate = true; }; img.src = 'assets/iv_flower.webp';
  wallDrips(170, 370, 5, '#2962FF'); WALLP.tex.needsUpdate = true;
}
function wallDrips(x, y, n, col) { const c = WALLP.c; c.fillStyle = col; for (let i = 0; i < n; i++) { const dx = x + Math.random() * 180, L = 20 + Math.random() * 70; c.fillRect(dx, y, 3, L); c.beginPath(); c.arc(dx + 1.5, y + L, 3, 0, PI * 2); c.fill(); } }
function wallLoad() { try { const d = localStorage.getItem('meme-island-wall'); if (!d) return; const img = new Image(); img.onload = () => { WALLP.loaded = true; WALLP.c.drawImage(img, 0, 0, 1024, 626); WALLP.tex.needsUpdate = true; }; img.src = d; } catch (e) { } }
function wallSave() { try { const s = document.createElement('canvas'); s.width = 768; s.height = 470; s.getContext('2d').drawImage(WALLP.cv, 0, 0, 768, 470); localStorage.setItem('meme-island-wall', s.toDataURL('image/jpeg', 0.72)); } catch (e) { } }
const wallSecret = secret('tag', () => { toast('YOUR FIRST TAG. THE PARKS DEPARTMENT WILL PAINT OVER IT IN 2031.', 'blue'); });
function wallToggle(force) {
  if (WALLP.cool > 0) return; WALLP.cool = 0.4; WALLP.on = force === undefined ? !WALLP.on : force;
  if (WALLP.on) toast(isMobile ? 'HOLD A FINGER TO SPRAY WHERE YOU LOOK · TAP E TO STOP' : 'HOLD THE MOUSE TO SPRAY WHERE YOU LOOK · R COLOUR · E DONE'), toast('YOU HAVE ' + WALLP.names[WALLP.col] + '.');
  else { WALLP.spray = false; if (WALLP.dirty) { wallSave(); WALLP.dirty = 0; toast('YOU PUT THE CAN DOWN. THE WALL REMEMBERS.'); } }
}
addEventListener('pointerdown', e => { if (WALLP.on && !e.target.closest('button,.win,#chat')) WALLP.spray = true; });
addEventListener('pointerup', () => { WALLP.spray = false; }); addEventListener('pointercancel', () => { WALLP.spray = false; });
addEventListener('keydown', e => { if (!WALLP.on || $('chat').style.display === 'block' || e.repeat) return;
  if (e.code === 'KeyR') { WALLP.col = (WALLP.col + 1) % WALLP.cols.length; toast('YOU HAVE ' + WALLP.names[WALLP.col] + '.'); }
  if (e.code === 'Escape') wallToggle(false); });
const _wr = new THREE.Raycaster(), _wc = new THREE.Vector2(0, 0);
let wallHiss = null;
function wallFrame(dt) {
  WALLP.cool = Math.max(0, WALLP.cool - dt);
  if (WALLP.on && Math.hypot(P.x - WALLP.fx, P.z - WALLP.fz) > 6) wallToggle(false);
  const spraying = WALLP.on && WALLP.spray;
  if (spraying) { _wr.setFromCamera(_wc, camera); _wr.far = 7; const h = _wr.intersectObject(WALLP.face, false)[0];
    if (h && h.uv) { const c = WALLP.c, x = h.uv.x * 1024, y = (1 - h.uv.y) * 626, d = h.distance, r = 6 + d * 7, col = WALLP.cols[WALLP.col];
      // a soft core and an overspray halo, wider from further away
      const gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(0.55, col); gr.addColorStop(1, col + '00'); c.globalAlpha = 0.55; c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, PI * 2); c.fill();
      c.globalAlpha = 0.5; for (let i = 0; i < 6; i++) { const a = Math.random() * PI * 2, q = r * (1 + Math.random() * 0.8); c.fillRect(x + Math.cos(a) * q, y + Math.sin(a) * q, 1.5, 1.5); } c.globalAlpha = 1;
      WALLP.lastHit = (WALLP.lastHit || 0) + dt; if (WALLP.lastHit > 0.9 && Math.random() < dt * 2.5 && WALLP.drips.length < 40) { WALLP.drips.push({ x: x + (Math.random() - 0.5) * r, y: y + r * 0.6, len: 0, max: 30 + Math.random() * 90, col }); }
      WALLP.dirty = 1; WALLP.tex.needsUpdate = true; WALLP.strokes += dt; if (WALLP.strokes > 1.2) wallSecret();
      if (!wallHiss && AC && AC.state === 'running' && oceanGain && oceanGain.gain.value > 0) try { const n = AC.sampleRate * 0.5, buf = AC.createBuffer(1, n, AC.sampleRate), ch = buf.getChannelData(0); for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
        const s = AC.createBufferSource(); s.buffer = buf; s.loop = true; const f = AC.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3500; const g = AC.createGain(); g.gain.value = 0.05; s.connect(f); f.connect(g); g.connect(AC.destination); s.start(); wallHiss = { s, g }; } catch (e) { }
    } else WALLP.lastHit = 0;
  } else WALLP.lastHit = 0;
  if (wallHiss && !spraying) { try { wallHiss.s.stop(); } catch (e) { } wallHiss = null; }
  // runs crawl down under heavy paint
  if (WALLP.drips.length) { const c = WALLP.c; WALLP.drips = WALLP.drips.filter(d => { const step = Math.min(d.max - d.len, dt * (40 + 30 * Math.random())); c.fillStyle = d.col; c.fillRect(d.x - 1.5, d.y + d.len, 3, step + 1); d.len += step; if (d.len >= d.max) { c.beginPath(); c.arc(d.x, d.y + d.len, 3, 0, PI * 2); c.fill(); return false; } return true; }); WALLP.tex.needsUpdate = true; }
}
window.__FRAMES.push(dt => { try { wallFrame(dt); } catch (e) { if (!WALLP.err) { WALLP.err = e; console.warn('v47 wall', e); } } });
WALLP.toggle = wallToggle;
