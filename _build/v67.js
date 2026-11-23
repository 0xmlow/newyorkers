/* ================================================================
   v67 THE SIDEWALK SHED (2026-11-22)
   New York's most permanent temporary structure: sixteen metres of scaffold shed at (-8, -88) on the north side,
   green plywood deck on galvanised pipe, a bare bulb every bay that is never switched off, and a plywood fence
   pasted three deep with Meme posters and a POST NO BILLS stencil nobody reads. Walk through underneath. E at the
   fence pastes another one.
   ================================================================ */
const SHED = { posters: 0 };
window.__SHED = SHED;
const SHED_AT = { x: -8, z: -88 };
(function sidewalkShed() {
  const x0 = SHED_AT.x, z0 = SHED_AT.z, g0 = ground(x0, z0), L = 16, W = 2.8, H = 3.2;
  const pipe = new THREE.MeshStandardMaterial({ color: 0x9da3a8, roughness: 0.4, metalness: 0.8 }), green = new THREE.MeshStandardMaterial({ color: 0x2f4a33, roughness: 0.85 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(L, 0.25, W + 0.3), green); deck.position.set(x0, g0 + H, z0); deck.castShadow = true; scene.add(deck);
  const lip = new THREE.Mesh(new THREE.BoxGeometry(L, 0.8, 0.06), green); lip.position.set(x0, g0 + H + 0.45, z0 + W / 2 + 0.15); scene.add(lip);
  const bulbs = [];
  for (let i = 0; i <= 8; i++) { const x = x0 - L / 2 + i * L / 8;
    [-1, 1].forEach(s => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, H, 8), pipe); p.position.set(x, g0 + H / 2, z0 + s * W / 2); scene.add(p); post(x, z0 + s * W / 2, 0.08, -5, H); });
    const cross = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, W, 6), pipe); cross.rotation.x = PI / 2; cross.position.set(x, g0 + H - 0.2, z0); scene.add(cross);
    if (i < 8) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd9a0, toneMapped: false })); b.position.set(x + L / 16, g0 + H - 0.3, z0); scene.add(b); bulbs.push(b);
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.18, 4), new THREE.MeshBasicMaterial({ color: 0x111111 })); cord.position.set(x + L / 16, g0 + H - 0.2, z0); scene.add(cord); } }
  SHED.bulbs = bulbs;
  // the fence on the north side, plywood, with posters
  const ply = (() => { const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 256; const c = cv.getContext('2d'); if (c && c.fillRect) { c.fillStyle = '#2f4a33'; c.fillRect(0, 0, 1024, 256); for (let i = 0; i < 8; i++) { c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(i * 128, 0, 2, 256); }
    if (c.fillText) { c.fillStyle = 'rgba(239,232,218,.9)'; c.font = '700 34px "Archivo Black", Impact, sans-serif'; c.fillText('POST NO BILLS', 40, 236); c.fillText('POST NO BILLS', 560, 236); } } const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO; return t; })();
  const fence = new THREE.Mesh(new THREE.BoxGeometry(L, 2.5, 0.05), new THREE.MeshStandardMaterial({ map: ply, roughness: 0.9 })); fence.position.set(x0, g0 + 1.25, z0 - W / 2 - 0.05); scene.add(fence);
  boxWalls(x0, z0 - W / 2 - 0.05, L, 0.12, 0, -5, 2.6 + g0);
  SHED.fz = z0 - W / 2 + 0.0; SHED.g0 = g0; SHED.L = L; SHED.x0 = x0;
  const pick = () => MEME_NS[Math.floor(Math.random() * MEME_NS.length)];
  for (let i = 0; i < 14; i++) shedPaste(pick(), true);
  try { const n = +(localStorage.getItem('meme-island-shed') || 0); for (let i = 0; i < Math.min(n, 30); i++) shedPaste(pick(), true); } catch (e) { }
  interact(x0, z0 - 0.4, 3.2, 'E · PASTE A POSTER', () => { shedPaste(pick()); });
  if (window.__MAP) MAP.places.push(['THE SHED', x0, z0, x0, z0 + 3]);
})();
function shedPaste(n, quiet) {
  const m = memeMesh(n, 0.9 + Math.random() * 0.35, { roughness: 0.95 }); if (!m) return; const k = SHED.posters++;
  const x = SHED.x0 - SHED.L / 2 + 0.7 + Math.random() * (SHED.L - 1.4), y = SHED.g0 + 0.9 + Math.random() * 0.75;
  m.position.set(x, y, SHED.fz - 0.02 + 0.0015 * (k % 40)); m.rotation.z = (Math.random() - 0.5) * 0.06; m.material.polygonOffset = true; m.material.polygonOffsetFactor = -1 - (k % 40); scene.add(m);
  if (!quiet) { shedSecret(); toast('PASTED. IT WILL BE COVERED BY TUESDAY. THAT IS THE POINT.'); try { localStorage.setItem('meme-island-shed', String(Math.max(0, SHED.posters - 14))); } catch (e) { } }
}
const shedSecret = secret('wheatpaste', () => { }, []);
window.__FRAMES.push(dt => { try { const night = Math.min(1, (L.lamps || 0) * 1.4); SHED.bulbs.forEach((b, i) => { const v = 0.55 + 0.45 * night - (i === 5 && Math.sin(LIFE.t * 23) > 0.7 ? 0.4 : 0); b.material.color.setRGB(v, v * 0.85, v * 0.63); }); } catch (e) { } });
