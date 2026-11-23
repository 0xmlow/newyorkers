/* ================================================================
   v97 THE CROSSWALK (2026-11-22)
   Where the south path crosses the ring road to the beach: zebra stripes, and a pedestrian signal on a pole at
   each side. The white walking figure, then the flashing hand with a countdown from fifteen, then the solid red
   hand, on a fifty second cycle, with the tick tick of the accessible push button. The delivery riders and the
   bus stop for the walk sign. Cross on the walk and you have done the one law abiding thing in this city.
   ================================================================ */
const XWALK = { t: 0 };
window.__XWALK = XWALK;
(function crosswalk() {
  const zc = ROAD_R, g0 = ground(0, zc); XWALK.z = zc;
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256; const c = cv.getContext('2d');
  if (c && c.fillRect && c.clearRect) { c.clearRect(0, 0, 512, 256); c.fillStyle = 'rgba(240,238,230,.92)'; for (let i = 0; i < 9; i++) c.fillRect(i * 58, 0, 34, 256); }
  const st = new THREE.Mesh(new THREE.PlaneGeometry(9, 4), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, roughness: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }));
  st.rotation.x = -PI / 2; st.rotation.z = PI / 2; st.position.set(0, g0 + 0.05, zc); scene.add(st);
  // the signal faces: canvas with the walker, the hand and the count
  XWALK.faces = [-1, 1].map(s => { const cv2 = document.createElement('canvas'); cv2.width = 128; cv2.height = 192; const t = new THREE.CanvasTexture(cv2); t.encoding = THREE.sRGBEncoding;
    const x = 2.6, z = zc + s * 4.6, gy = ground(x, z), pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 3.0, 8), new THREE.MeshStandardMaterial({ color: 0x1b1d20, roughness: 0.5, metalness: 0.5 })); pole.position.set(x, gy + 1.5, z); scene.add(pole); post(x, z, 0.12, -5, 3.2);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.62, 0.22), new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.5 })); box.position.set(x, gy + 2.7, z - s * 0.12); scene.add(box);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.54), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); face.position.set(x, gy + 2.7, z - s * 0.235); face.rotation.y = s > 0 ? PI : 0; scene.add(face);
    const btn = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.2, 0.06), new THREE.MeshStandardMaterial({ color: 0x2b2b2b })); btn.position.set(x, gy + 1.1, z - s * 0.08); scene.add(btn);
    return { cv: cv2, c: cv2.getContext('2d'), t, last: '' }; });
  XWALK.side = 0;
})();
function xwState(t) { const k = t % 50; return k < 18 ? ['walk', 0] : k < 33 ? ['flash', Math.ceil(33 - k)] : ['stop', 0]; }
const xwSecret = secret('crosswalk', () => { toast('YOU CROSSED ON THE WALK SIGNAL. NOBODY SAW. IT STILL COUNTS.', 'blue'); });
function xwDraw(F, st, n) { const c = F.c; if (!c || !c.fillRect || !c.save) return; const key = st + n; if (key === F.last) return; F.last = key; c.fillStyle = '#050505'; c.fillRect(0, 0, 128, 192);
  if (st === 'walk') { c.fillStyle = '#f2f2ea'; c.beginPath && (c.beginPath(), c.arc(64, 40, 12, 0, PI * 2), c.fill()); c.fillRect(56, 54, 16, 50); c.save(); c.translate(60, 104); c.rotate(0.35); c.fillRect(-5, 0, 10, 44); c.restore(); c.save(); c.translate(68, 104); c.rotate(-0.35); c.fillRect(-5, 0, 10, 44); c.restore(); c.save(); c.translate(58, 60); c.rotate(0.5); c.fillRect(-4, 0, 8, 36); c.restore(); c.save(); c.translate(70, 60); c.rotate(-0.5); c.fillRect(-4, 0, 8, 36); c.restore(); }
  else if (st === 'stop' || (st === 'flash' && Math.floor(XWALK.t * 2) % 2 === 0)) { c.fillStyle = '#ff5a1a'; c.fillRect(40, 50, 48, 56); for (let i = 0; i < 4; i++) c.fillRect(40 + i * 12, 22, 9, 30); c.fillRect(24, 70, 18, 10); }
  if (st === 'flash' && c.fillText) { c.fillStyle = '#ff5a1a'; c.font = '700 44px "JetBrains Mono", monospace'; c.textAlign = 'center'; c.fillText(String(n), 64, 176); } F.t.needsUpdate = true; }
function xwFrame(dt) {
  XWALK.t += dt; const [st, n] = xwState(XWALK.t); window.__XWALK_PED = st !== 'stop';
  if (Math.hypot(P.x, P.z - XWALK.z) > 80) return; XWALK.faces.forEach(F => xwDraw(F, st, n + (st === 'flash' && Math.floor(XWALK.t * 2) % 2 ? '' : ' ')));
  if (Math.hypot(P.x, P.z - XWALK.z) < 30 && AC && AC.state === 'running' && oceanGain && oceanGain.gain.value > 0) { const per = st === 'walk' ? 0.25 : 1; XWALK.tick = (XWALK.tick || 0) - dt; if (XWALK.tick <= 0) { XWALK.tick = per; try { beep(st === 'walk' ? 1700 : 880, 0.02, 'square', 0.02); } catch (e) { } } }
  // crossing: from one side of the road to the other while it says walk
  const inX = Math.abs(P.x) < 4.5; const side = P.z < XWALK.z - 4 ? -1 : P.z > XWALK.z + 4 ? 1 : 0;
  if (inX && side !== 0) { if (XWALK.side && side !== XWALK.side && XWALK.ok) xwSecret(); XWALK.side = side; XWALK.ok = true; } else if (inX && side === 0) { if (st === 'stop') XWALK.ok = false; } else { XWALK.side = 0; }
}
window.__FRAMES.push(dt => { try { xwFrame(dt); } catch (e) { if (!XWALK.err) { XWALK.err = e; console.warn('v97 crosswalk', e); } } });
