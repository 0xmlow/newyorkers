/* ================================================================
   v100 THE THRESHOLD (2026-11-22), apply-mlow-impermanent-vision, Melt
   The hundredth upgrade is a door. A tall freestanding doorway across the south path at (0, 52): two thick posts
   and a lintel in navy paint with liquid contour lines running round every face (cyan, every fifth hot pink),
   bone white drips sliding off the lintel, and in the opening a slow shimmer like heat over a road. An Open Eye
   Flower sits on top, watching who comes through. Walk through it and the island lets go for twenty seconds (the
   v52 MELT) with a low chord. At night the paint and the shimmer glow.
   ================================================================ */
const THR = { k: 0, last: 0, side: 0 };
window.__THR = THR;
const THR_AT = { x: 0, z: 52 };
(function threshold() {
  const x0 = THR_AT.x, z0 = THR_AT.z, g0 = ground(x0, z0), W = 3.2, H = 5.2, T = 0.7; THR.g0 = g0;
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 1024; const c = cv.getContext('2d');
  if (c && c.createLinearGradient && c.beginPath) { const g = c.createLinearGradient(0, 0, 0, 1024); g.addColorStop(0, '#1d2f66'); g.addColorStop(1, '#070b1e'); c.fillStyle = g; c.fillRect(0, 0, 512, 1024);
    for (let i = 0; i < 60; i++) { const y = i * 18 + 8; c.beginPath(); for (let x = 0; x <= 512; x += 8) { const w = Math.sin(x * 0.02 + i * 0.6) * 9 + Math.sin(x * 0.051 - i * 0.4) * 4; x ? c.lineTo(x, y + w) : c.moveTo(x, y + w); } c.lineWidth = i % 5 === 4 ? 3.2 : 1.6; c.strokeStyle = i % 5 === 4 ? 'rgba(255,63,164,.9)' : 'rgba(8,222,255,.8)'; c.stroke(); }
    for (let i = 0; i < 9; i++) { const x = 20 + Math.random() * 470, L = 80 + Math.random() * 380, w = 6 + Math.random() * 8; c.fillStyle = 'rgba(239,232,218,.9)'; c.fillRect(x - w / 2, 0, w, L); c.beginPath(); c.arc(x, L, w * 0.9, 0, PI * 2); c.fill(); } }
  const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO;
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.35, metalness: 0.1, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.1 }); THR.m = m;
  [-1, 1].forEach(s => { const p = new THREE.Mesh(new THREE.BoxGeometry(T, H, T), m); p.position.set(x0 + s * (W / 2 + T / 2), g0 + H / 2, z0); p.castShadow = true; scene.add(p); post(x0 + s * (W / 2 + T / 2), z0, T * 0.6, -5, H); });
  const lin = new THREE.Mesh(new THREE.BoxGeometry(W + 2 * T + 0.3, T, T + 0.1), m); lin.position.set(x0, g0 + H + T / 2, z0); lin.castShadow = true; scene.add(lin);
  // the shimmer in the opening
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uK: { value: 0.3 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uT, uK; varying vec2 vUv; void main(){ float b = sin(vUv.y * 40.0 - uT * 2.0 + sin(vUv.x * 6.0 + uT) * 2.0); float l = smoothstep(0.92, 1.0, b); float e = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x) * smoothstep(0.0, 0.05, vUv.y);' +
      ' vec3 c = mix(vec3(0.03, 0.87, 1.0), vec3(1.0, 0.25, 0.64), step(0.8, fract(vUv.y * 8.0 + uT * 0.1))); gl_FragColor = vec4(c, (0.04 + l * 0.35) * uK * e); }' }));
  sh.position.set(x0, g0 + H / 2, z0); scene.add(sh); THR.sh = sh;
  const ft = tex('assets/iv_flower.webp'); const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshStandardMaterial({ map: ft, transparent: true, alphaTest: 0.4, emissive: 0xffffff, emissiveMap: ft, emissiveIntensity: 0.2, side: THREE.DoubleSide })); fl.position.set(x0, g0 + H + T + 0.7, z0); scene.add(fl); THR.fl = fl;
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.28), new THREE.MeshBasicMaterial({ map: signTex([{ t: 'THE THRESHOLD', s: 0.34 }, { t: 'NUMBER ONE HUNDRED', s: 0.13 }], 1024, 200, '#efe8da', '#0D0D0D'), toneMapped: false, side: THREE.DoubleSide })); pl.position.set(x0 + W / 2 + T + 0.9, g0 + 1.2, z0 + 0.4); scene.add(pl);
  const pp = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 6), new THREE.MeshStandardMaterial({ color: 0x15161a })); pp.position.set(x0 + W / 2 + T + 0.9, g0 + 0.6, z0 + 0.4); scene.add(pp);
  if (window.__MAP) MAP.places.push(['THE THRESHOLD', x0, z0, x0, z0 + 4]);
})();
const thrSecret = secret('threshold', () => { toast('YOU WALKED THROUGH THE HUNDREDTH DOOR. THE ISLAND LETS GO OF ITSELF FOR A MOMENT. IT WILL PULL ITSELF TOGETHER. PROBABLY.', 'blue'); });
function thrChord() { if (!AC || AC.state !== 'running' || !oceanGain || oceanGain.gain.value === 0) return; try { const t0 = AC.currentTime, g = AC.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.06, t0 + 1.2); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 9); g.connect(AC.destination);
  [55, 82.4, 110, 164.8, 207.7].forEach(f => { const o = AC.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.connect(g); o.start(t0); o.stop(t0 + 9.2); }); } catch (e) { } }
function thrFrame(dt) {
  const d = Math.hypot(P.x - THR_AT.x, P.z - THR_AT.z); if (d > 120) return; const night = Math.min(1, (L.lamps || 0) * 1.4);
  THR.sh.material.uniforms.uT.value = LIFE.t; THR.sh.material.uniforms.uK.value = 0.35 + 0.65 * night; THR.m.emissiveIntensity = 0.08 + night * 0.55; THR.fl.lookAt(camera.position.x, THR.fl.position.y, camera.position.z); THR.fl.material.emissiveIntensity = 0.15 + night * 0.6;
  // passing through: crossing z0 inside the opening
  const side = P.z < THR_AT.z ? -1 : 1, inside = Math.abs(P.x - THR_AT.x) < 1.6 && P.y < THR.g0 + 4;
  if (THR.side && side !== THR.side && inside && LIFE.t - THR.last > 25) { THR.last = LIFE.t; thrSecret(); thrChord(); try { window.__MELT && __MELT.go(20, true); } catch (e) { } }
  THR.side = side;
}
window.__FRAMES.push(dt => { try { thrFrame(dt); } catch (e) { if (!THR.err) { THR.err = e; console.warn('v100 threshold', e); } } });
