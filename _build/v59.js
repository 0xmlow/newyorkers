/* ================================================================
   v59 THE GRATE (2026-11-22)
   A subway vent grate in the ring path at (30, -28). Look down through the bars and there is a shaft, and a long way
   down a train goes by about once a minute: the rumble comes up through your shoes, light from the car windows
   strobes up through the slats, and the updraft throws the litter in the air. Stand on it when one passes and it
   lifts you a little and your coat does the famous thing. GRATE calls the next train.
   ================================================================ */
const GR = { t: 0, next: 20 + Math.random() * 30, train: 0, papers: [], k: 0 };
window.__GR = GR;
const GR_AT = { x: 30, z: -28 };
(function grate() {
  const x0 = GR_AT.x, z0 = GR_AT.z, g0 = ground(x0, z0), ry = Math.atan2(-x0, -z0) + PI / 2; GR.g0 = g0; GR.ry = ry;
  const W = 3.2, D = 1.5;
  // the bars: an alpha tested canvas, steel slats across, two bearers
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256; const c = cv.getContext('2d');
  if (c && c.fillRect && c.clearRect) { c.clearRect(0, 0, 512, 256); c.fillStyle = '#fff'; for (let i = 0; i < 512; i += 16) c.fillRect(i, 0, 7, 256); c.fillRect(0, 0, 512, 14); c.fillRect(0, 242, 512, 14); c.fillRect(0, 121, 512, 12); c.fillRect(0, 0, 12, 256); c.fillRect(500, 0, 12, 256); }
  const at = new THREE.CanvasTexture(cv);
  const gm = new THREE.MeshStandardMaterial({ color: 0x3a3936, roughness: 0.45, metalness: 0.75, alphaMap: at, alphaTest: 0.5, side: THREE.DoubleSide });
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(W, D), gm); gr.rotation.set(-PI / 2, 0, ry); gr.position.set(x0, g0 + 0.1, z0); scene.add(gr); GR.mesh = gr;
  // the shaft below: dark walls, a light strip at the bottom that becomes passing windows
  const sh = new THREE.Group(); sh.position.set(x0, g0, z0); sh.rotation.y = ry; scene.add(sh);
  const wall = new THREE.MeshStandardMaterial({ color: 0x14130f, roughness: 1, side: THREE.BackSide });
  const box = new THREE.Mesh(new THREE.BoxGeometry(W - 0.02, 4, D - 0.02), wall); box.position.y = -2.0; sh.add(box);
  // (a depth masked shaft was tried; the path paving draws over it, so the shaft stays hidden)
  box.visible = false; const mask = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.04, D - 0.04), new THREE.MeshBasicMaterial({ colorWrite: false, depthTest: false })); mask.rotation.x = -PI / 2; mask.position.y = 0.085; mask.visible = false; sh.add(mask);
  const wc = document.createElement('canvas'); wc.width = 512; wc.height = 64; const q = wc.getContext('2d');
  if (q && q.fillRect) { q.fillStyle = '#0a0a0a'; q.fillRect(0, 0, 512, 64); for (let i = 0; i < 512; i += 64) { q.fillStyle = '#ffe9b8'; q.fillRect(i + 8, 12, 40, 30); q.fillStyle = '#c33'; q.fillRect(i + 52, 44, 8, 6); } }
  const wt = new THREE.CanvasTexture(wc); wt.wrapS = THREE.RepeatWrapping; wt.repeat.set(1.5, 1); GR.wt = wt;
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.1, D - 0.1), new THREE.MeshBasicMaterial({ map: wt, toneMapped: false, color: 0x000000 })); strip.rotation.x = -PI / 2; strip.position.y = 0.085; sh.add(strip); GR.strip = strip;   // no hole in the paving, so the dark and the passing windows sit just under the bars
  // a shaft of light that stands up out of the grate at night while a train passes
  const sc = document.createElement('canvas'); sc.width = 64; sc.height = 256; const s = sc.getContext('2d');
  if (s && s.createLinearGradient) { const g = s.createLinearGradient(0, 256, 0, 0); g.addColorStop(0, 'rgba(255,230,180,.55)'); g.addColorStop(1, 'rgba(255,230,180,0)'); s.fillStyle = g; s.fillRect(0, 0, 64, 256); }
  const beamM = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false });
  [0, PI / 2].forEach(a => { const b = new THREE.Mesh(new THREE.PlaneGeometry(a ? D : W, 6), beamM); b.position.y = 3; b.rotation.y = a; sh.add(b); }); GR.beam = beamM;
  // litter: a cup lid, receipts, a flyer, a leaf
  const cols = [0xefe8da, 0xf4f1e8, 0xffd84a, 0x8a6a3a, 0xefe8da, 0xff3fa4];
  for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.16 + Math.random() * 0.1, 0.1 + Math.random() * 0.12), new THREE.MeshStandardMaterial({ color: cols[i], roughness: 0.9, side: THREE.DoubleSide }));
    const a = Math.random() * PI * 2, r = 0.3 + Math.random() * 0.9; const hx = x0 + Math.cos(a) * r, hz = z0 + Math.sin(a) * r * 0.5;
    m.position.set(hx, g0 + 0.11, hz); m.rotation.set(-PI / 2, 0, Math.random() * 6); scene.add(m); GR.papers.push({ m, hx, hz, y: 0, vy: 0, vx: 0, vz: 0, sp: (Math.random() - 0.5) * 8 }); }
  if (window.__MAP) MAP.places.push(['THE GRATE', x0, z0, x0 + Math.sin(ry - PI / 2) * 3, z0 + Math.cos(ry - PI / 2) * 3]);
})();
const grSecret = secret('updraft', () => { toast('A TRAIN WENT UNDER YOU AND YOUR COAT DID THE FAMOUS THING. THE CITY APPLAUDS, QUIETLY.', 'blue'); });
EGGS.grate = EGGS.subwaygrate = () => { GR.next = GR.t + 1.5; toast('YOU HEAR IT BEFORE YOU SEE IT. STAND ON THE GRATE.'); }; EGGS.grate.__s = true;
let grRumble = null;
function grOnGrate() { const lx = P.x - GR_AT.x, lz = P.z - GR_AT.z, c = Math.cos(GR.ry), s = Math.sin(GR.ry); const u = lx * c - lz * s, v = lx * s + lz * c; return Math.abs(u) < 1.7 && Math.abs(v) < 0.85 && P.y < GR.g0 + 0.5; }
function grFrame(dt) {
  GR.t += dt; const d = Math.hypot(P.x - GR_AT.x, P.z - GR_AT.z);
  if (GR.train <= 0 && GR.t > GR.next) { GR.train = 6; GR.next = GR.t + 55 + Math.random() * 35; GR.lifted = false;
    if (d < 40 && AC && AC.state === 'running' && oceanGain && oceanGain.gain.value > 0) try { const n = AC.sampleRate * 2, buf = AC.createBuffer(1, n, AC.sampleRate), ch = buf.getChannelData(0); let last = 0; for (let i = 0; i < n; i++) { last = last * 0.985 + (Math.random() * 2 - 1) * 0.015; ch[i] = last * 6 + (Math.random() * 2 - 1) * 0.04; }
      const src = AC.createBufferSource(); src.buffer = buf; src.loop = true; const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260; const g = AC.createGain(); g.gain.value = 0; src.connect(f); f.connect(g); g.connect(AC.destination); src.start(); grRumble = { src, g }; } catch (e) { } }
  const on = GR.train > 0; if (on) GR.train -= dt; const k = on ? Math.sin(Math.min(1, (6 - GR.train) / 6) * PI) : 0;   // 0 -> 1 -> 0 over the pass
  if (grRumble) { grRumble.g.gain.value = Math.max(0, k * 0.16 - d * 0.003); if (!on) { try { grRumble.src.stop(); } catch (e) { } grRumble = null; } }
  // the windows below
  GR.wt.offset.x += dt * (on ? 2.4 : 0); GR.strip.material.color.setScalar(on ? Math.min(1, k * 1.6) * (0.65 + 0.35 * Math.abs(Math.sin(GR.t * 31))) : 0.02);
  const night = Math.min(1, (L.lamps || 0) * 1.4); GR.beam.opacity = on ? k * (0.15 + 0.6 * night) * (0.7 + 0.3 * Math.abs(Math.sin(GR.t * 27))) : 0;
  // the updraft
  GR.papers.forEach(p => { if (on && k > 0.25) { p.vy += (5.5 * k - p.y * 1.4) * dt + (Math.random() - 0.5) * dt * 6; p.vx += (Math.random() - 0.5) * dt * 5; p.vz += (Math.random() - 0.5) * dt * 5; }
    else { p.vy -= 3.2 * dt; p.vx *= 1 - dt; p.vz *= 1 - dt; }
    p.y = Math.max(0, p.y + p.vy * dt); if (p.y === 0) { p.vy = 0; p.vx *= 0.8; p.vz *= 0.8; p.hx += (GR_AT.x - p.hx) * dt * 0.05; p.hz += (GR_AT.z - p.hz) * dt * 0.05; }
    p.hx += p.vx * dt; p.hz += p.vz * dt; p.m.position.set(p.hx, GR.g0 + 0.11 + p.y, p.hz); if (p.y > 0) { p.m.rotation.x += p.sp * dt; p.m.rotation.y += p.sp * 0.7 * dt; } else p.m.rotation.set(-PI / 2, 0, p.m.rotation.z); });
  // standing on it
  if (on && k > 0.6 && grOnGrate()) { GR.k += dt; if (!GR.lifted && P.ground) { GR.lifted = true; P.ground = false; P.fallFrom = P.y; P.vy = 4.2; } if (GR.k > 0.3) grSecret(); }
}
window.__FRAMES.push(dt => { try { grFrame(dt); } catch (e) { if (!GR.err) { GR.err = e; console.warn('v59 grate', e); } } });
