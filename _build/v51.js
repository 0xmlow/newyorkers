/* ================================================================
   v51 THE WATCHERS (2026-11-22), apply-mlow-impermanent-vision, Bloom
   A bed of nineteen of MLow's painted Open Eye Flowers at (-27, -66), near THE CUT, standing in a pool of navy paint
   cut by liquid contour lines (cyan, every fifth one hot pink) that crowd toward the middle. They turn to follow you
   while you are not looking at them, and shut the moment you do. Each one reacts a beat late, so if you turn fast
   enough you can catch one looking. At night the paint and the eyes glow. The flower is the witness, on duty.
   ================================================================ */
const WATCH = { f: [], caught: 0 };
window.__WATCH = WATCH;
const WATCH_AT = { x: -27, z: -66 };
(function watchers() {
  const x0 = WATCH_AT.x, z0 = WATCH_AT.z, g0 = ground(x0, z0);
  // the pool: navy paint with contour lines that bend round the bed (wet topography), a few runs off the rim
  const cv = document.createElement('canvas'); cv.width = cv.height = 1024; const c = cv.getContext('2d');
  if (c && c.beginPath && c.createRadialGradient) {
    const gr = c.createRadialGradient(512, 512, 40, 512, 512, 512); gr.addColorStop(0, '#16224a'); gr.addColorStop(0.8, '#0b1430'); gr.addColorStop(1, 'rgba(11,20,48,0)'); c.fillStyle = gr; c.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 34; i++) { const R = 30 + i * 13.5; c.beginPath(); for (let a = 0; a <= 1.001; a += 1 / 180) { const t = a * PI * 2, w = Math.sin(t * 3 + i * 0.37) * (6 + i * 0.5) + Math.sin(t * 7 - i * 0.21) * 4; const r = R + w; const px = 512 + Math.cos(t) * r, py = 512 + Math.sin(t) * r; a ? c.lineTo(px, py) : c.moveTo(px, py); }
      c.closePath(); c.lineWidth = i % 5 === 4 ? 3.2 : 1.6; c.strokeStyle = i % 5 === 4 ? 'rgba(255,63,164,.85)' : 'rgba(8,222,255,' + (0.75 - i * 0.012) + ')'; c.stroke(); }
    c.fillStyle = '#efe8da'; for (let i = 0; i < 9; i++) { const a = Math.random() * PI * 2, r = 380 + Math.random() * 60, L = 30 + Math.random() * 80; c.save(); c.translate(512 + Math.cos(a) * r, 512 + Math.sin(a) * r); c.rotate(a - PI / 2); c.globalAlpha = 0.5; c.fillRect(-2, 0, 4, L); c.beginPath(); c.arc(0, L, 4, 0, PI * 2); c.fill(); c.restore(); }
  }
  const pt = new THREE.CanvasTexture(cv); pt.encoding = THREE.sRGBEncoding; pt.anisotropy = ANISO;
  const pm = new THREE.MeshStandardMaterial({ map: pt, transparent: true, roughness: 0.25, metalness: 0.1, emissive: 0xffffff, emissiveMap: pt, emissiveIntensity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const pool = new THREE.Mesh(new THREE.CircleGeometry(5.2, 64), pm); pool.rotation.x = -PI / 2; pool.position.set(x0, g0 + 0.04, z0); pool.renderOrder = 1; scene.add(pool); WATCH.pm = pm;
  // the flowers
  const ft = tex('assets/iv_flower.webp'); ft.anisotropy = ANISO; const stemM = new THREE.MeshStandardMaterial({ color: 0x141c18, roughness: 0.7 });
  for (let i = 0; i < 19; i++) { const a = i * 2.39996, r = i ? 0.75 * Math.sqrt(i) : 0, x = x0 + Math.cos(a) * r, z = z0 + Math.sin(a) * r, h = 1.25 + (1 - r / 3.4) * 1.1 + Math.random() * 0.35;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, h, 6), stemM); stem.position.set(x, g0 + h / 2, z); stem.rotation.set((Math.random() - 0.5) * 0.12, 0, (Math.random() - 0.5) * 0.12); scene.add(stem);
    const s = 0.75 + Math.random() * 0.45, m = new THREE.MeshStandardMaterial({ map: ft, transparent: true, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.6, emissive: 0xffffff, emissiveMap: ft, emissiveIntensity: 0 });
    const head = new THREE.Mesh(new THREE.PlaneGeometry(s, s), m); head.position.set(x, g0 + h + s * 0.35, z); scene.add(head);
    WATCH.f.push({ head, m, open: 1, delay: 0.15 + Math.random() * 0.45, seen: 0, yaw: Math.random() * 6, pitch: 0, x, z, y: head.position.y }); }
  post(x0, z0, 3.3, -5, 4);
  const lab = signTex([{ t: 'THE WATCHERS', s: 0.36 }, { t: 'THEY ONLY LOOK WHEN YOU DO NOT', s: 0.13 }], 1024, 256, '#0b1430', '#efe8da');
  const ry = Math.atan2(-x0, -z0), sx = x0 + Math.sin(ry) * 5.8 + Math.cos(ry) * 2.2, sz = z0 + Math.cos(ry) * 5.8 - Math.sin(ry) * 2.2;
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: lab, toneMapped: false, side: THREE.DoubleSide })); sg.position.set(sx, ground(sx, sz) + 1.5, sz); sg.rotation.y = ry; scene.add(sg);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 6), stemM); pole.position.set(sx, ground(sx, sz) + 0.75, sz); scene.add(pole);
  if (window.__MAP) MAP.places.push(['THE WATCHERS', x0, z0, x0 + Math.sin(ry) * 7, z0 + Math.cos(ry) * 7]);
})();
const watchSecret = secret('watchers', () => { toast('YOU CAUGHT ONE LOOKING. IT DOES NOT APOLOGISE.', 'blue'); try { window.__MELT && __MELT.go(6, true); } catch (e) { } });
const _wv = new THREE.Vector3(), _wf = new THREE.Vector3();
function watchFrame(dt) {
  const d0 = Math.hypot(P.x - WATCH_AT.x, P.z - WATCH_AT.z), night = Math.min(1, (L.lamps || 0) * 1.3);
  WATCH.pm.emissiveIntensity = 0.05 + 0.75 * night;
  if (d0 > 70) return; camera.getWorldDirection(_wf); const cp = camera.position;
  WATCH.f.forEach(f => {
    _wv.set(f.x - cp.x, f.y - cp.y, f.z - cp.z); const dist = _wv.length(); _wv.divideScalar(dist || 1);
    const ang = Math.acos(Math.max(-1, Math.min(1, _wv.dot(_wf)))), looked = ang < 0.26 + 1.2 / Math.max(4, dist);
    f.seen = looked ? f.seen + dt : 0;
    // caught: you are looking right at it and it has not shut yet
    if (looked && ang < 0.12 && f.open > 0.85 && f.seen > 0.05 && dist < 25) { WATCH.caught += dt; if (WATCH.caught > 0.12) watchSecret(); }
    const want = looked && f.seen > f.delay ? 0 : 1; f.open += (want - f.open) * Math.min(1, dt * (want ? 2.2 : 14));
    // turn toward you, slowly, only while open
    const ty = Math.atan2(cp.x - f.x, cp.z - f.z); let dy = Math.atan2(Math.sin(ty - f.yaw), Math.cos(ty - f.yaw)); f.yaw += dy * Math.min(1, dt * 1.6 * f.open);
    const tp = Math.atan2(cp.y - f.y, Math.hypot(cp.x - f.x, cp.z - f.z)); f.pitch += (Math.max(-0.5, Math.min(0.6, tp)) - f.pitch) * Math.min(1, dt * 1.6 * f.open);
    f.head.rotation.set(-f.pitch, f.yaw, 0, 'YXZ'); const o = 0.06 + 0.94 * f.open; f.head.scale.set(0.55 + 0.45 * f.open, o, 1);
    f.m.emissiveIntensity = night * 0.55 * f.open; f.m.color.setScalar(0.45 + 0.55 * f.open); });
}
window.__FRAMES.push(dt => { try { watchFrame(dt); } catch (e) { if (!WATCH.err) { WATCH.err = e; console.warn('v51 watchers', e); } } });
