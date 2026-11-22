/* ================================================================
   v27 N3W SQUARE (2026-11-22)
   A slim tower in the eastern clearing wrapped in giant screens, after One Times Square: every face cycles The
   Memes cards (a new card every few seconds, a hard cut like the real ones), an LED news ticker wraps the tower
   with live island news (New York time, the weather, your TDH, secrets found, the next mint), and a faceted ball
   sits on the mast. On NEWYEAR, and at 23:59:50 on 31 December New York time, the ball drops on a ten second
   countdown into the finale.
   ================================================================ */
const SQ = { x: 81, z: 10, screens: [], ticker: null, ball: null, drop: -1 };
window.__SQ = SQ;
(function tower() {
  const { x, z } = SQ, g0 = ground(x, z), W = 9, H = 44, stone = new THREE.MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.6, metalness: 0.3 });
  const core = new THREE.Mesh(new THREE.BoxGeometry(W, H, W), stone); core.position.set(x, g0 + H / 2, z); core.castShadow = true; scene.add(core);
  if (typeof CIRCS !== 'undefined') CIRCS.push({ x, z, r: W * 0.72, y0: -5, y1: 60, on: true });
  // screens: four faces, three tiers
  const tiers = [[8, 7.6], [17, 8.4], [27, 9.2]];
  for (let f = 0; f < 4; f++) { const ry = f * PI / 2, nx = Math.sin(ry), nz = Math.cos(ry);
    tiers.forEach(([y, h], k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ toneMapped: false, color: 0xd8d8d8 }));
      m.position.set(x + nx * (W / 2 + 0.12), g0 + y, z + nz * (W / 2 + 0.12)); m.rotation.y = ry; scene.add(m);
      const fr = new THREE.Mesh(new THREE.BoxGeometry(W + 0.4, h + 0.4, 0.2), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 })); fr.position.set(x + nx * (W / 2 + 0.02), g0 + y, z + nz * (W / 2 + 0.02)); fr.rotation.y = ry; scene.add(fr);
      SQ.screens.push({ m, h, w: W - 0.2, t: (f * 3 + k) * 0.9, n: 0 }); }); }
  // the ticker band
  const cv = document.createElement('canvas'); cv.width = 4096; cv.height = 96; SQ.tcv = cv; const t = new THREE.CanvasTexture(cv); t.wrapS = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; SQ.ttex = t;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(W * 0.72, W * 0.72, 1.8, 4, 1, true), new THREE.MeshBasicMaterial({ map: t, toneMapped: false, side: THREE.DoubleSide })); band.rotation.y = PI / 4; band.position.set(x, g0 + 12.4, z); band.scale.set(1, 1, 1); scene.add(band); SQ.band = band;
  const band2 = band.clone(); band2.position.y = g0 + 21.7; scene.add(band2);
  // crown, mast and ball
  const crown = new THREE.Mesh(new THREE.BoxGeometry(W * 0.8, 3, W * 0.8), stone); crown.position.set(x, g0 + H + 1.5, z); scene.add(crown);
  const lab = signTex([{ t: 'N3W SQUARE', s: 0.55 }], 1024, 200, '#0D0D0D', '#FFFFFF'); for (let f = 0; f < 4; f++) { const ry = f * PI / 2; const p = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.78, 1.5), new THREE.MeshBasicMaterial({ map: lab, toneMapped: false })); p.position.set(x + Math.sin(ry) * (W * 0.4 + 0.02), g0 + H + 1.5, z + Math.cos(ry) * (W * 0.4 + 0.02)); p.rotation.y = ry; scene.add(p); }
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 14, 8), new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.9, roughness: 0.3 })); mast.position.set(x, g0 + H + 10, z); scene.add(mast);
  const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 2), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.95, roughness: 0.12, flatShading: true, emissive: 0x2962ff, emissiveIntensity: 0.4 })); ball.position.set(x, g0 + H + 16.5, z); scene.add(ball);
  SQ.ball = ball; SQ.top = g0 + H + 16.5; SQ.bottom = g0 + H + 4.5;
})();
function tickerText() {
  const t = SKY.t || { h: 0, m: 0 }; const items = [`N3W YORK ${pad2(t.h)}:${pad2(t.m)}`, `WEATHER ${(WX.override || WX.cur || '').toUpperCase()}`, `YOUR TDH ${Math.floor(state.tdh)}`, `SECRETS FOUND ${PLAY.found.size} OF ${PLAY.total}`, `GOLDEN SLICES ${HUNT.got.size} OF 9`, `GM SAID TODAY ${state.gm}`,
    'FLOOR UP 3 PERCENT, PROBABLY', 'THE COLOSSUS DECLINES TO COMMENT', 'BODEGA CAT RE-ELECTED UNOPPOSED', 'N3W EL RUNNING ON TIME, SOMEHOW', 'WHALE SPOTTED OFF THE PIER', 'THE CITY IS THE ART'];
  return '   ●   ' + items.join('   ●   ') + '   ●   ';
}
function drawTicker() { const c = SQ.tcv.getContext('2d'); if (!c || !c.fillText) return; c.fillStyle = '#050505'; c.fillRect(0, 0, 4096, 96); c.font = '700 54px "JetBrains Mono",Menlo,monospace'; c.fillStyle = '#ff8a1a'; c.textBaseline = 'middle';
  const s = tickerText(); let x = 10; while (x < 4096) { c.fillText(s, x, 50); x += c.measureText(s).width; } c.fillStyle = 'rgba(0,0,0,0.35)'; for (let y = 0; y < 96; y += 4) c.fillRect(0, y, 4096, 1); SQ.ttex.needsUpdate = true; }
drawTicker();
const ballSecret = secret('balldrop', () => { if (SQ.drop < 0) { SQ.drop = 0; toast('TEN SECONDS TO MIDNIGHT IN N3W SQUARE. LOOK EAST.'); } }, ['newyear', 'balldrop', 'countdown']);
function squareFrame(dt) {
  SQ.screens.forEach(s => { if (s.live) return; s.t -= dt; if (s.t <= 0) { s.t = 5 + Math.random() * 3; const pool = (window.__FRESH && __FRESH.length && Math.random() < 0.5) ? __FRESH : CARDS, card = pool[(Math.random() * pool.length) | 0]; try { const I = info('meme', card.n), asp = I.uv[5]; setPlaneUV(s.m, 'meme', card.n); const hh = Math.min(s.h, s.w / asp); s.m.scale.set(hh * asp, hh, 1); } catch (e) { } } });
  SQ.ttex.offset.x = (LIFE.t * 0.02) % 1; SQ.tT = (SQ.tT || 0) - dt; if (SQ.tT <= 0) { SQ.tT = 10; drawTicker(); }
  SQ.ball.rotation.y += dt * 0.4; SQ.ball.material.emissive.setHSL((LIFE.t * 0.05) % 1, 0.8, 0.5); SQ.ball.material.emissiveIntensity = 0.25 + 0.6 * Math.min(1, (L.lamps || 0) * 1.3);
  const t = SKY.t; if (t && t.mo === 12 && t.d === 31 && t.h === 23 && t.m === 59 && (t.sec % 60) >= 50 && SQ.drop < 0 && SQ.year !== t.y) { SQ.year = t.y; SQ.drop = 0; }
  if (SQ.drop >= 0) { const prev = SQ.drop; SQ.drop += dt; const k = Math.min(1, SQ.drop / 10); SQ.ball.position.y = SQ.top + (SQ.bottom - SQ.top) * k;
    if (Math.floor(prev) !== Math.floor(SQ.drop) && SQ.drop < 10.5) { const n = 10 - Math.floor(SQ.drop); if (n > 0) { toast(String(n)); beep(n <= 3 ? 880 : 660, 0.12, 'square', 0.05); } }
    if (SQ.drop >= 10 && prev < 10) { toast('HAPPY N3W YEAR', 'blue'); flash('#2962FF'); try { finaleGo('HAPPY N3W YEAR FROM N3W SQUARE.'); } catch (e) { } LIFE.fireworks && LIFE.fireworks(16); }
    if (SQ.drop > 40) { SQ.drop = -1; SQ.ball.position.y = SQ.top; } }
}
window.__FRAMES.push(dt => { try { squareFrame(dt); } catch (e) { if (!SQ.err) { SQ.err = e; console.warn('v27 square', e); } } });
