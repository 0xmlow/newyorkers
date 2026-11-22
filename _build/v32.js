/* ================================================================
   v32 FRESH DROPS (2026-11-22)
   More ways to meet the 50 new Memes:
   - AIRDROPS: every couple of minutes the blimp drops a crate on a parachute somewhere on the island (the beach,
     the clearings, the paths). Walk up, E to open it: one of the new cards rises out of it, spins, and is yours.
     FRESH CARDS COLLECTED n OF 50 is kept; all fifty is a secret. AIRDROP calls one down next to you.
   - THE EL carries the new cards as ads on the sides of every car, changing at each lap.
   - TYPE A NUMBER from 528 to 577 and that card opens.
   ================================================================ */
const DROP = { crates: [], got: new Set(), next: 25 };
window.__DROP = DROP;
try { (JSON.parse(localStorage.getItem('meme-island-fresh-got') || '[]') || []).forEach(n => DROP.got.add(n)); } catch (e) { }
const DROP_SPOTS = [[-14, 112], [14, 128], [-30, 108], [24, 116], [-66, 34], [-72, -26], [-42, -58], [81, 24], [36, 64], [-20, 70], [20, 40], [-50, 10], [60, -40], [-30, -40]];
function crateModel() {
  const g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0x8a6440, roughness: 0.85 }), band = new THREE.MeshStandardMaterial({ color: 0x2962ff, roughness: 0.5 });
  const b = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), wood); b.position.y = 0.55; b.castShadow = true; g.add(b);
  [-0.4, 0.4].forEach(o => { const s = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.12, 1.14), band); s.position.y = 0.55 + o; g.add(s); });
  const lab = signTex([{ t: 'FRESH', s: 0.6 }], 256, 128, '#0D0D0D', '#FFFFFF'); [0, 1, 2, 3].forEach(k => { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.35), new THREE.MeshBasicMaterial({ map: lab, toneMapped: false })); p.position.set(Math.sin(k * PI / 2) * 0.565, 0.55, Math.cos(k * PI / 2) * 0.565); p.rotation.y = k * PI / 2; g.add(p); });
  const chute = new THREE.Group(); const cc = new THREE.Mesh(new THREE.SphereGeometry(2.2, 16, 8, 0, PI * 2, 0, PI * 0.42), new THREE.MeshStandardMaterial({ color: 0xff6b00, roughness: 0.7, side: THREE.DoubleSide })); cc.position.y = 3.2; chute.add(cc);
  for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2; const l = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 3.4, 3), new THREE.MeshBasicMaterial({ color: 0xdddddd })); l.position.set(Math.cos(a) * 0.8, 2.2, Math.sin(a) * 0.8); l.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3); chute.add(l); }
  g.add(chute); scene.add(g); return { g, chute };
}
for (let i = 0; i < 3; i++) { const c = crateModel(); c.g.visible = false; DROP.crates.push(Object.assign(c, { st: 'idle' })); }
const holo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ toneMapped: false, side: THREE.DoubleSide, transparent: true })); holo.visible = false; scene.add(holo);
const allFresh = secret('freshall', () => { toast('ALL 50 FRESH MEMES COLLECTED. THE FACTORY WALL SALUTES YOU.', 'blue'); LIFE.fireworks && LIFE.fireworks(10); });
const firstDrop = secret('airdrop', () => { });
function dropCrate(x, z) {
  if (!FRESH.length) return; const c = DROP.crates.find(q => q.st === 'idle'); if (!c) return; const B = window.__game && __game.BLIMP && __game.BLIMP.g;
  c.x = x; c.z = z; c.gy = Math.max(ground(x, z), (floorAt(x, z, 4).f || 0)); c.y = B ? B.position.y - 4 : 70; c.st = 'fall'; c.g.visible = true; c.chute.visible = true; c.g.position.set(x, c.y, z);
  const notGot = FRESH.filter(f => !DROP.got.has(f.n)); c.card = (notGot.length ? notGot : FRESH)[(Math.random() * (notGot.length || FRESH.length)) | 0].n;
}
secret('airdropcall', () => { const a = Math.random() * PI * 2; dropCrate(P.x + Math.cos(a) * 6, P.z + Math.sin(a) * 6); toast('AIRDROP INCOMING. LOOK UP. THIS ONE IS REAL.'); }, ['airdrop', 'drop', 'crate']);
interact(0, 0, 0, '', () => { }); const dropInter = INTER[INTER.length - 1];
function openCrate(c) {
  c.st = 'open'; c.t = 0; firstDrop(); const card = byN[c.card]; try { setPlaneUV(holo, 'meme', c.card); const a = card.uv[5]; holo.scale.set(1.3 * a, 1.3, 1); } catch (e) { }
  holo.visible = true; holo.position.set(c.x, c.gy + 1.2, c.z); DROP.holo = c; DROP.got.add(c.card); try { localStorage.setItem('meme-island-fresh-got', JSON.stringify([...DROP.got])); } catch (e) { }
  toast(`FRESH MEME ${card.n}: ${card.t.toUpperCase()} BY ${(card.a || '').toUpperCase()}. COLLECTED ${DROP.got.size} OF ${FRESH.length}.`, 'blue'); [523, 784, 1046].forEach((f, k) => beep(f, 0.12, 'triangle', 0.05, k * 0.09));
  if (DROP.got.size >= FRESH.length) allFresh();
}
function dropFrame(dt) {
  if (!FRESH.length) return; DROP.next -= dt; if (DROP.next <= 0) { DROP.next = 110 + Math.random() * 60; const s = DROP_SPOTS[(Math.random() * DROP_SPOTS.length) | 0]; dropCrate(s[0], s[1]); }
  let near = null;
  DROP.crates.forEach(c => { if (c.st === 'idle') return;
    if (c.st === 'fall') { c.y -= dt * 4.2; c.g.position.set(c.x + Math.sin(LIFE.t * 0.7 + c.x) * 0.6, c.y, c.z); c.g.rotation.y += dt * 0.3; c.chute.rotation.z = Math.sin(LIFE.t * 1.3) * 0.08; if (c.y <= c.gy) { c.y = c.gy; c.st = 'landed'; c.chute.visible = false; c.g.position.set(c.x, c.gy, c.z); c.life = 240; } }
    if (c.st === 'landed') { c.life -= dt; if (c.life <= 0) { c.st = 'idle'; c.g.visible = false; } if (Math.hypot(P.x - c.x, P.z - c.z) < 2.4) near = c; }
    if (c.st === 'open') { c.t += dt; c.g.scale.setScalar(Math.max(0.01, 1 - c.t * 0.8)); if (c.t > 1.3) { c.st = 'idle'; c.g.visible = false; c.g.scale.setScalar(1); } } });
  dropInter.label = near ? 'E · OPEN THE FRESH CRATE' : ''; if (near) { dropInter.x = near.x; dropInter.z = near.z; dropInter.r = 2.4; dropInter.fn = () => openCrate(near); }
  if (holo.visible && DROP.holo) { const c = DROP.holo; c.ht = (c.ht || 0) + dt; holo.position.y = c.gy + 1.2 + Math.min(1.6, c.ht * 1.4); holo.rotation.y += dt * 2.4; holo.material.opacity = Math.min(1, 4 - c.ht * 0.8); if (c.ht > 5) { holo.visible = false; c.ht = 0; } }
}

/* the El carries the new cards as ads */
const ELADS = [];
(function elAds() {
  if (!window.__EL || !FRESH.length) return;
  __EL.cars.forEach((car, ci) => { [-1.375, 1.375].forEach(sx => { [-3.36, 3.36].forEach(z => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ toneMapped: false })); m.position.set(sx * 1.006, 2.0, z); m.rotation.y = sx > 0 ? PI / 2 : -PI / 2; car.add(m); m.userData.card = 0; ELADS.push(m); }); }); });
  elAdsCycle();
})();
function elAdsCycle() { ELADS.forEach((m, i) => { const c = FRESH[(i * 7 + (ELADS.lap || 0) * 3) % FRESH.length]; try { setPlaneUV(m, 'meme', c.n); const a = c.uv[5], h = Math.min(0.9, 1.4 / a); m.scale.set(h * a, h, 1); m.userData.card = c.n; } catch (e) { } }); }
/* type a number 528 to 577 */
FRESH.forEach(c => { const k = String(c.n); if (!EGGS[k]) { EGGS[k] = () => { try { openCard({ kind: 'meme', n: c.n }); } catch (e) { } }; EGGS[k].__s = true; } });
window.__FRAMES.push(dt => { try { dropFrame(dt); if (window.__EL && ELADS.length) { const lap = Math.floor(__EL.a / (PI * 2)); if (lap !== ELADS.lapSeen) { ELADS.lapSeen = lap; ELADS.lap = (ELADS.lap || 0) + 1; elAdsCycle(); } } } catch (e) { if (!DROP.err) { DROP.err = e; console.warn('v32 drops', e); } } });
