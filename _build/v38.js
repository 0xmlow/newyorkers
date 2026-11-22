/* ================================================================
   v38 LIVE MEMES (2026-11-22)
   The island now asks the 6529 API itself, from the visitor's browser (api.6529.io allows any origin, and the card
   images come from the 6529 CDN with CORS), for the newest Memes, every ten minutes:
   - LIVE MINT: a lit vitrine beside the factory press with the newest card on a turntable, its title, artist,
     mint date and edition size, and a red LIVE light.
   - N3W Square gives its top front screen to the newest card.
   - Anything minted after this build (after card 577) joins the ARRIVALS board's first row and gets a toast the
     first time you see it: NEW MEME JUST MINTED. The island keeps up without anyone rebuilding it.
   If the API cannot be reached the vitrine shows the newest card from the build instead.
   ================================================================ */
const LIVE = { latest: null, newer: [], tex: null, ok: false, t: 0 };
window.__LIVE = LIVE;
const LIVE_API = 'https://api.6529.io/api/nfts?contract=0x33FD426905F149f8376e227d0C9D3340AaD17aF1&page_size=12&sort_direction=DESC';
(function vitrine() {
  const x = -3.4, z = -37.5, g0 = ground(x, z), G = new THREE.Group(); G.position.set(x, g0, z); G.rotation.y = 0.5; scene.add(G); LIVE.g = G;
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 1.5), new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.4, metalness: 0.3 })); base.position.y = 0.5; G.add(base);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.0, 1.4), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, metalness: 0, transmission: 0.9, transparent: true, opacity: 0.25, depthWrite: false })); glass.position.y = 2.0; G.add(glass);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 1.5), base.material); cap.position.y = 3.06; G.add(cap);
  const card = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ toneMapped: false, side: THREE.DoubleSide })); card.position.y = 1.95; G.add(card); LIVE.card = card;
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff2020, toneMapped: false })); lamp.position.set(0.55, 3.18, 0.55); G.add(lamp); LIVE.lamp = lamp;
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 320; LIVE.lcv = cv; const lt = new THREE.CanvasTexture(cv); lt.encoding = THREE.sRGBEncoding; LIVE.ltex = lt;
  const label = new THREE.Mesh(new THREE.PlaneGeometry(1.44, 0.45), new THREE.MeshBasicMaterial({ map: lt, toneMapped: false })); label.position.set(0, 0.62, 0.76); G.add(label);
  if (typeof CIRCS !== 'undefined') CIRCS.push({ x, z, r: 1.05, y0: -5, y1: 5, on: true });
  interact(x, z, 2.6, 'E · OPEN THE LIVE MINT', () => { if (LIVE.latest) { if (byN[LIVE.latest.n]) openCard({ kind: 'meme', n: LIVE.latest.n }); else window.open('https://seize.io/the-memes/' + LIVE.latest.n, '_blank', 'noopener'); } });
})();
function liveLabel() { const c = LIVE.lcv.getContext('2d'); if (!c || !c.fillText) return; const L = LIVE.latest; c.fillStyle = '#0D0D0D'; c.fillRect(0, 0, 1024, 320);
  c.fillStyle = '#ff2020'; c.beginPath && (c.beginPath(), c.arc(46, 52, 14, 0, PI * 2), c.fill()); c.font = '800 34px "Archivo Expanded",Arial'; c.fillStyle = '#ffffff'; c.textBaseline = 'middle'; c.fillText(LIVE.ok ? 'LIVE MINT' : 'LATEST MINT', 76, 54);
  if (L) { c.font = '400 70px Anton,Impact,sans-serif'; let t = ('#' + L.n + '  ' + L.t).toUpperCase(); while (c.measureText(t).width > 960 && t.length > 8) t = t.slice(0, -2); c.fillText(t, 40, 150);
    c.font = '600 30px "JetBrains Mono",Menlo,monospace'; c.fillStyle = '#c9ced3'; c.fillText(`BY ${(L.a || '').toUpperCase()} · ${L.mint || ''} · EDITION ${L.sup || '?'}`.slice(0, 58), 40, 236); }
  LIVE.ltex.needsUpdate = true; }
function liveShow(L) {
  LIVE.latest = L; liveLabel(); const setScale = (a) => { const h = 1.5, w = Math.min(1.2, h * a); LIVE.card.scale.set(w, w / a, 1); };
  if (byN[L.n] && byN[L.n].uv) { try { setPlaneUV(LIVE.card, 'meme', L.n); setScale(byN[L.n].uv[5]); } catch (e) { } return; }
  if (!L.thumb) return; const ld = new THREE.TextureLoader(); ld.setCrossOrigin('anonymous');
  ld.load(L.thumb, t => { t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO; LIVE.card.material.map = t; LIVE.card.material.needsUpdate = true; const uv = LIVE.card.geometry.attributes.uv; uv.setXY(0, 0, 1); uv.setXY(1, 1, 1); uv.setXY(2, 0, 0); uv.setXY(3, 1, 0); uv.needsUpdate = true; setScale(t.image.width / t.image.height); LIVE.tex = t;
    if (window.__SQ && SQ.screens[1]) { const s = SQ.screens[1]; s.live = true; s.m.material.map = t; s.m.material.needsUpdate = true; const u2 = s.m.geometry.attributes.uv; u2.setXY(0, 0, 1); u2.setXY(1, 1, 1); u2.setXY(2, 0, 0); u2.setXY(3, 1, 0); u2.needsUpdate = true; const a = t.image.width / t.image.height, hh = Math.min(s.h, s.w / a); s.m.scale.set(hh * a, hh, 1); } }, undefined, () => { });
}
async function liveFetch() {
  try { const r = await fetch(LIVE_API, { cache: 'no-store' }); const j = await r.json(); const rows = (j.data || []).map(d => ({ n: d.id, t: d.name || '', a: d.artist_seize_handle || d.artist || '', mint: (d.mint_date || '').slice(0, 10), sup: d.supply, thumb: d.thumbnail || d.scaled || d.image }));
    if (!rows.length) throw 0; LIVE.ok = true; const top = FRESH.length ? FRESH[FRESH.length - 1].n : 527; LIVE.newer = rows.filter(r => r.n > top).sort((a, b) => a.n - b.n); liveShow(rows[0]);
    if (LIVE.newer.length && !LIVE.told) { LIVE.told = true; const L = LIVE.newer[LIVE.newer.length - 1]; setTimeout(() => toast(`NEW MEME JUST MINTED: #${L.n} ${L.t.toUpperCase()} BY ${(L.a || '').toUpperCase()}. IT IS IN THE LIVE MINT VITRINE BY THE FACTORY.`, 'blue'), 6000); }
    if (LIVE.newer.length && typeof FLAP !== 'undefined' && FLAP.cv) { const orig = flapRows; flapRows = () => { const r = orig(); const L = LIVE.newer[LIVE.newer.length - 1]; r[0] = [String(L.n), L.t.toUpperCase().slice(0, 24), (L.a || '').toUpperCase().slice(0, 16), 'LIVE']; return r; }; }
  } catch (e) { LIVE.ok = false; if (!LIVE.latest && FRESH.length) { const f = FRESH[FRESH.length - 1]; liveShow({ n: f.n, t: f.t, a: f.a, mint: f.mint, sup: f.sup }); } }
}
setTimeout(liveFetch, 2500);
window.__FRAMES.push(dt => { try { LIVE.t += dt; if (LIVE.t > 600) { LIVE.t = 0; liveFetch(); } if (LIVE.card) LIVE.card.rotation.y += dt * 0.5; if (LIVE.lamp) LIVE.lamp.visible = LIVE.ok && (LIVE.t % 1.4) < 0.9; } catch (e) { } });
