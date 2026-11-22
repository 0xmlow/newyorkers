/* ================================================================
   v31 FRESH OFF THE PRESS (2026-11-22)
   The Memes kept minting after the island's 527 card snapshot: cards 528 to 577 (to 20 November 2026) come in from
   the 6529 API (fetch_new_memes.py, atlas memes4.jpg in slot 5, data.json 'fresh'). They get their own places:
   - THE PRESS: a printing press in the Meme Factory doorway that prints one of the new cards every few seconds;
     it rolls out between the cylinders, lifts, and flies to its slot on the factory's front wall, where all fifty
     hang in two racks either side of the door, FRESH OFF THE PRESS. Click any of them for its card.
   - ARRIVALS: a split flap board on a gantry over the pier, flipping through the new cards: number, title, artist,
     mint date, with the clatter.
   - N3W Square's screens play the new cards half the time and its ticker reads the latest mint.
   - FRESH (or NEW) takes you to the press and opens the newest card.
   ================================================================ */
const FRESH = (D && D.fresh) || [];
window.__FRESH = FRESH;
FRESH.forEach(c => { byN[c.n] = c; });
if (FRESH.length && ATL.length === 5) { const t = tex('assets/memes4.jpg'); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; ATL.push(t); }
const PRESS = { slots: [], cards: [], next: 2, fly: null };
(function pressAndRacks() {
  if (!FRESH.length) return; const g0 = ground(0, -64) + 0.17;
  // two racks on the factory's front wall, either side of the door (outside face at z = -49.72)
  const sides = [[-13.5, -1], [13.5, 1]], CW = 0.92, CH = 1.38, perSide = Math.ceil(FRESH.length / 2);
  const back = new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.5 });
  FRESH.forEach((c, i) => { const side = i < perSide ? 0 : 1, k = i % perSide, col = k % 5, row = Math.floor(k / 5), [sx] = sides[side];
    const x = sx + (col - 2) * 1.0, y = g0 + 8.2 - row * 1.62, z = -49.66;
    const fr = new THREE.Mesh(new THREE.BoxGeometry(CW + 0.08, CH + 0.08, 0.04), back); fr.position.set(x, y, z - 0.03); scene.add(fr);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ toneMapped: false })); try { setPlaneUV(m, 'meme', c.n); const a = c.uv[5], h = Math.min(CH, CW / a); m.scale.set(h * a, h, 1); } catch (e) { }
    m.position.set(x, y, z); m.userData.card = c.n; scene.add(m); PICK_EXTRA.push(m); PRESS.slots.push({ m, x, y, z, n: c.n }); });
  const plate = signTex([{ t: 'FRESH OFF THE PRESS', s: 0.36 }, { t: `THE MEMES ${FRESH[0].n} TO ${FRESH[FRESH.length - 1].n} · MINTED AFTER THIS ISLAND WAS BUILT`, s: 0.1 }], 1024, 256, '#0D0D0D', '#FFFFFF');
  sides.forEach(([sx]) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 1.2), new THREE.MeshBasicMaterial({ map: plate, toneMapped: false })); p.position.set(sx, g0 + 0.95, -49.64); scene.add(p); });
  // the press, in the doorway
  const steel = new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.45, metalness: 0.8 }), roller = new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.3, metalness: 0.5 }), red = new THREE.MeshStandardMaterial({ color: 0xc8312a, roughness: 0.5, metalness: 0.3 });
  const px = 0, pz = -47.5, G = new THREE.Group(); G.position.set(px, g0, pz); scene.add(G);
  [-1.3, 1.3].forEach(x => { const side = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.2, 1.6), red); side.position.set(x, 1.1, 0); G.add(side); });
  const rg = new THREE.CylinderGeometry(0.28, 0.28, 2.4, 20); rg.rotateZ(PI / 2); PRESS.rollers = [0.75, 1.35].map(y => { const r = new THREE.Mesh(rg, roller); r.position.set(0, y, 0); G.add(r); return r; });
  const bed = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 2.2), steel); bed.position.set(0, 0.42, 0.6); G.add(bed);
  const sign2 = signTex([{ t: 'THE PRESS', s: 0.5 }, { t: 'PRINTS THE NEWEST MEMES, ONE AT A TIME', s: 0.14 }], 512, 192, '#c8312a', '#FFFFFF'); const sp = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.66), new THREE.MeshBasicMaterial({ map: sign2, toneMapped: false })); sp.position.set(0, 2.05, 0.82); G.add(sp);
  if (typeof CIRCS !== 'undefined') CIRCS.push({ x: px, z: pz, r: 1.4, y0: -5, y1: 5, on: true });
  const card = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ toneMapped: false, side: THREE.DoubleSide })); card.visible = false; scene.add(card); PRESS.card = card; PRESS.base = new THREE.Vector3(px, g0 + 1.05, pz);
})();
function pressFrame(dt) {
  if (!PRESS.card) return; PRESS.rollers.forEach((r, i) => r.rotation.x += dt * (i ? -3 : 3));
  if (!PRESS.fly) { PRESS.next -= dt; if (PRESS.next <= 0) { PRESS.next = 5 + Math.random() * 3; const s = PRESS.slots[(Math.random() * PRESS.slots.length) | 0]; try { setPlaneUV(PRESS.card, 'meme', s.n); PRESS.card.scale.set(s.m.scale.x, s.m.scale.y, 1); } catch (e) { } PRESS.fly = { s, t: 0 }; PRESS.card.visible = true; s.m.visible = false;
      if (Math.hypot(P.x, P.z + 48) < 30) [1, 2, 3].forEach(k => beep(140 + k * 40, 0.06, 'square', 0.02, k * 0.08)); } return; }
  const F = PRESS.fly, b = PRESS.base; F.t += dt; const t = F.t;
  if (t < 1.2) { const k = t / 1.2; PRESS.card.position.set(b.x, b.y - 0.1, b.z + 0.1 + k * 0.9); PRESS.card.rotation.set(-PI / 2 + k * 0.2, 0, 0); }
  else if (t < 2.0) { const k = (t - 1.2) / 0.8; PRESS.card.position.set(b.x, b.y + k * 2.2, b.z + 1.0); PRESS.card.rotation.set(-PI / 2 * (1 - k), 0, 0); }
  else if (t < 3.6) { const k = (t - 2.0) / 1.6, e = k * k * (3 - 2 * k), s = F.s; PRESS.card.position.set(b.x + (s.x - b.x) * e, b.y + 2.2 + (s.y - b.y - 2.2) * e + Math.sin(k * PI) * 2, b.z + 1.0 + (s.z - b.z - 1.0) * e); PRESS.card.rotation.set(0, Math.sin(k * PI) * 0.6 * Math.sign(s.x), 0); }
  else { F.s.m.visible = true; PRESS.card.visible = false; PRESS.fly = null; }
}

/* the split flap ARRIVALS board over the pier */
const FLAP = { cv: null, tex: null, page: 0, t: 0, flip: 0, rows: [] };
(function arrivals() {
  if (!FRESH.length) return; const steel = new THREE.MeshStandardMaterial({ color: 0x23272b, roughness: 0.45, metalness: 0.7 }), z = 146, y = 4.6;
  [-2.9, 2.9].forEach(x => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.2, y + 1.6, 0.2), steel); p.position.set(x, 0.6 + (y + 1.6) / 2 - 0.4, z); scene.add(p); });
  const box2 = new THREE.Mesh(new THREE.BoxGeometry(5.9, 2.0, 0.35), steel); box2.position.set(0, y + 0.6, z); scene.add(box2);
  const cv = document.createElement('canvas'); cv.width = 1536; cv.height = 512; FLAP.cv = cv; const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO; FLAP.tex = t;
  [1, -1].forEach(s => { const f = new THREE.Mesh(new THREE.PlaneGeometry(5.7, 1.9), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); f.position.set(0, y + 0.6, z + s * 0.18); if (s < 0) f.rotation.y = PI; scene.add(f); });
  flapPage(true);
})();
function flapRows() { const per = 5, start = (FLAP.page * per) % FRESH.length, out = []; const list = FRESH.slice().reverse(); for (let i = 0; i < per; i++) { const c = list[(start + i) % list.length]; out.push([String(c.n), c.t.toUpperCase().slice(0, 24), (c.a || '').toUpperCase().slice(0, 16), c.mint ? c.mint.slice(5).replace('-', '/') : '']); } return out; }
function flapDraw(scramble) {
  const c = FLAP.cv.getContext('2d'); if (!c || !c.fillText) return; c.fillStyle = '#0b0c0e'; c.fillRect(0, 0, 1536, 512);
  c.font = '800 34px "Archivo Expanded",Arial,sans-serif'; c.fillStyle = '#f2b705'; c.textBaseline = 'middle'; c.fillText('NEW ARRIVALS · THE MEMES BY 6529', 40, 44); c.fillStyle = '#8a9096'; c.font = '700 22px "JetBrains Mono",Menlo,monospace'; c.fillText('CARD   TITLE                      ARTIST             MINTED', 40, 96);
  const cols = [[40, 5], [190, 24], [880, 16], [1340, 5]], chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  FLAP.rows.forEach((r, ri) => { const y = 150 + ri * 72; cols.forEach(([x, n], ci) => { const txt = (r[ci] || '').padEnd(n, ' ').slice(0, n); for (let k = 0; k < n; k++) { const cx = x + k * 27, ch = scramble && Math.random() < scramble && txt[k] !== ' ' ? chars[(Math.random() * chars.length) | 0] : txt[k];
      c.fillStyle = '#16181b'; c.fillRect(cx, y - 28, 25, 56); c.fillStyle = '#0b0c0e'; c.fillRect(cx, y - 1, 25, 2); c.fillStyle = ci === 0 ? '#f2b705' : '#f2f2ee'; c.font = '700 36px "JetBrains Mono",Menlo,monospace'; c.fillText(ch, cx + 3, y + 2); } }); });
  FLAP.tex.needsUpdate = true;
}
function flapPage(first) { FLAP.rows = flapRows(); FLAP.flip = first ? 0 : 1.1; flapDraw(first ? 0 : 1); }
function flapFrame(dt) {
  if (!FLAP.cv) return; FLAP.t += dt; if (FLAP.t > 9) { FLAP.t = 0; FLAP.page++; flapPage(false); }
  if (FLAP.flip > 0) { FLAP.flip -= dt; flapDraw(Math.max(0, FLAP.flip / 1.1)); if (Math.hypot(P.x, P.z - 146) < 25 && Math.random() < 0.6) beep(2400 + Math.random() * 800, 0.01, 'square', 0.012); }
}
/* N3W Square shows the new cards half the time; its ticker gets the latest mint */
if (window.__SQ && FRESH.length) { const last = FRESH[FRESH.length - 1]; const old = tickerText; tickerText = () => old() + `NEW MEME ${last.n} · ${last.t.toUpperCase()} BY ${(last.a || '').toUpperCase()}   ●   ${FRESH.length} NEW CARDS ON THE FACTORY WALL   ●   `; drawTicker(); }
const freshGo = secret('fresh', () => { teleport(0, -40, PI); setTimeout(() => { try { openCard({ kind: 'meme', n: FRESH[FRESH.length - 1].n }); } catch (e) { } }, 400); toast(`THE NEWEST MEME: ${FRESH.length ? FRESH[FRESH.length - 1].t.toUpperCase() : ''}. ${FRESH.length} NEW CARDS ON THE FACTORY WALL.`); }, ['fresh', 'new', 'newmemes', 'latest']);
window.__FRAMES.push(dt => { try { pressFrame(dt); flapFrame(dt);
} catch (e) { if (!PRESS.err) { PRESS.err = e; console.warn('v31 fresh', e); } } });
