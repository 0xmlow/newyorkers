/* ================================================================
   v63 THE BUBBLE MAN (2026-11-22)
   A man with two sticks and a loop of rope at (26, 50) draws giant soap bubbles out of a bucket, the kind that
   wobble and drift off over the crowd. Each one is a thin film: clear in the middle, swirling bands of colour at the
   edges that slide as it turns, a hard highlight from the sun. Walk into one, or look at it and click, and it pops
   into mist. Pop ten and the island counts it. BUBBLES makes him go faster.
   ================================================================ */
const BUB = { b: [], next: 1, pops: 0, rush: 0 };
window.__BUB = BUB;
const BUB_AT = { x: 26, z: 50 };
const BUB_VS = 'uniform float uT, uSeed; varying vec3 vN, vV, vW; void main(){ vec3 p = position; float w = sin(p.y * 3.1 + uT * 2.3 + uSeed) * 0.045 + sin(p.x * 2.7 - uT * 1.7 + uSeed * 2.0) * 0.035; p += normal * w;' +
  ' vec4 wp = modelMatrix * vec4(p, 1.0); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }';
const BUB_FS = 'uniform float uT, uSeed, uA, uLight; uniform vec3 uSun; varying vec3 vN, vV, vW; void main(){ vec3 n = normalize(vN), v = normalize(vV); float c = abs(dot(n, v)), f = 1.0 - c;' +
  ' float th = 0.5 + 0.5 * sin(vW.y * 4.0 + uT * 0.9 + uSeed + sin(vW.x * 3.0 + uT * 0.6) * 1.4); float hue = th * 1.6 + f * 1.3 + uSeed;' +
  ' vec3 film = 0.5 + 0.5 * cos(6.2831 * (hue + vec3(0.0, 0.33, 0.67))); float spec = pow(max(dot(reflect(-v, n), normalize(uSun)), 0.0), 90.0);' +
  ' float a = (0.035 + pow(f, 2.2) * 0.55) * uA; vec3 col = film * (0.35 + 0.65 * uLight) * (0.4 + f) + vec3(spec) * 1.6 * uLight;' +
  ' gl_FragColor = vec4(col, min(1.0, a + spec * 0.8 * uA)); gl_FragColor = linearToOutputTexel(gl_FragColor); }';
(function bubbleMan() {
  const x0 = BUB_AT.x, z0 = BUB_AT.z, g0 = ground(x0, z0); BUB.g0 = g0; BUB.ry = Math.atan2(-x0, -z0);
  const p = person(0xe9e4da, 0x3b4a5c, SKIN[5], 'writer'); p.g.position.set(x0, g0 - 0.35, z0); p.g.rotation.y = BUB.ry; BUB.man = p;
  const wood = new THREE.MeshStandardMaterial({ color: 0x8a6a42, roughness: 0.8 });
  const wand = new THREE.Group(); wand.position.set(x0, g0 + 1.5, z0); wand.rotation.y = BUB.ry; scene.add(wand); BUB.wand = wand;
  [-0.35, 0.35].forEach(s => { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 1.4, 6), wood); st.position.set(s, 0.3, 0.35); st.rotation.x = 0.7; wand.add(st); });
  const rope = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.008, 4, 32), new THREE.MeshStandardMaterial({ color: 0xd9d2c0, roughness: 1 })); rope.position.set(0, 0.62, 0.95); rope.scale.set(0.75, 1, 1); wand.add(rope); BUB.rope = rope;
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.32, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0x2962FF, roughness: 0.5, side: THREE.DoubleSide })); bucket.position.set(x0 + Math.cos(BUB.ry) * 0.7, g0 + 0.16, z0 - Math.sin(BUB.ry) * 0.7); scene.add(bucket);
  const sg = signTex([{ t: 'BUBBLES', s: 0.36 }, { t: 'TIPS FOR SOAP', s: 0.14 }], 512, 256, '#efe8da', '#0D0D0D');
  const card = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), new THREE.MeshBasicMaterial({ map: sg, toneMapped: false, side: THREE.DoubleSide })); card.position.set(bucket.position.x, g0 + 0.36, bucket.position.z); card.rotation.set(-0.35, BUB.ry, 0, 'YXZ'); scene.add(card);
  post(x0, z0, 0.4, -5, 2.2);
  BUB.geo = new THREE.SphereGeometry(1, isMobile ? 24 : 40, isMobile ? 16 : 28);
  // mist for pops
  const mg = new THREE.BufferGeometry(), mp = new Float32Array(240 * 3).fill(-999); mg.setAttribute('position', new THREE.BufferAttribute(mp, 3));
  BUB.mist = new THREE.Points(mg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.8, depthWrite: false })); BUB.mist.frustumCulled = false; scene.add(BUB.mist); BUB.md = []; for (let i = 0; i < 240; i++) BUB.md.push({ t: 9, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 }); BUB.mc = 0;
  interact(x0 + Math.sin(BUB.ry) * 1.6, z0 + Math.cos(BUB.ry) * 1.6, 2.4, 'E · TIP THE BUBBLE MAN', () => { state.tdh = Math.max(0, state.tdh - 1); try { hud(); } catch (e) { } BUB.rush = 25; toast('ONE TDH IN THE BUCKET. HE GOES BIGGER.'); });
  if (window.__MAP) MAP.places.push(['BUBBLES', x0, z0, x0 + Math.sin(BUB.ry) * 4, z0 + Math.cos(BUB.ry) * 4]);
})();
const bubSecret = secret('bubbles', () => { toast('TEN BUBBLES POPPED. A CHILD NEARBY IS FURIOUS WITH YOU.', 'blue'); });
EGGS.bubble = EGGS.bubbleman = () => { BUB.rush = 30; toast('THE BUBBLE MAN HEARD THAT. HE DIPS THE ROPE.'); }; EGGS.bubble.__s = true;
function bubMake() {
  if (BUB.b.length >= (isMobile ? 6 : 12)) return; const s = (0.45 + Math.random() * 0.9) * (BUB.rush > 0 ? 1.4 : 1);
  const m = new THREE.Mesh(BUB.geo, new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uSeed: { value: Math.random() * 6 }, uA: { value: 0 }, uLight: { value: 1 }, uSun: { value: new THREE.Vector3(0.3, 0.8, 0.2) } }, vertexShader: BUB_VS, fragmentShader: BUB_FS, transparent: true, depthWrite: false }));
  m.renderOrder = 5; const w = BUB.wand, fx = Math.sin(BUB.ry), fz = Math.cos(BUB.ry); m.position.set(w.position.x + fx * 1.2, w.position.y + 0.7, w.position.z + fz * 1.2); m.scale.setScalar(0.05); scene.add(m);
  BUB.b.push({ m, s, t: 0, life: 7 + Math.random() * 8, vx: fx * (0.4 + Math.random() * 0.4) + (Math.random() - 0.5) * 0.5, vy: 0.12 + Math.random() * 0.2, vz: fz * (0.4 + Math.random() * 0.4) + (Math.random() - 0.5) * 0.5, sx: 1 + Math.random() * 0.12 });
}
function bubPop(b, byYou) { b.dead = true; scene.remove(b.m); b.m.material.dispose(); const r = b.s * b.m.scale.x / b.s;
  for (let i = 0; i < 20; i++) { const d = BUB.md[BUB.mc]; BUB.mc = (BUB.mc + 1) % BUB.md.length; const a = Math.random() * PI * 2, e = Math.acos(Math.random() * 2 - 1); d.t = 0; d.x = b.m.position.x + Math.sin(e) * Math.cos(a) * b.s; d.y = b.m.position.y + Math.cos(e) * b.s; d.z = b.m.position.z + Math.sin(e) * Math.sin(a) * b.s; d.vx = (d.x - b.m.position.x) * 1.5; d.vy = (d.y - b.m.position.y) * 1.5; d.vz = (d.z - b.m.position.z) * 1.5; }
  if (byYou) { BUB.pops++; if (BUB.pops >= 10) bubSecret(); if (AC && AC.state === 'running' && oceanGain && oceanGain.gain.value > 0) try { beep(1900 + Math.random() * 600, 0.03, 'triangle', 0.04); } catch (e) { } } }
const _br = new THREE.Raycaster();
addEventListener('pointerdown', e => { if (e.target.closest && e.target.closest('button,.win,#chat') || !BUB.b.length || (window.__WALLP && __WALLP.on)) return; if (Math.hypot(P.x - BUB_AT.x, P.z - BUB_AT.z) > 60) return;
  const lk = document.pointerLockElement === renderer.domElement; const x = lk ? 0 : (e.clientX / innerWidth) * 2 - 1, y = lk ? 0 : -(e.clientY / innerHeight) * 2 + 1; _br.setFromCamera({ x, y }, camera);
  let best = null, bd = 1e9; BUB.b.forEach(b => { if (b.dead) return; const c = b.m.position, r = b.m.scale.x; const oc = c.clone().sub(_br.ray.origin), tca = oc.dot(_br.ray.direction); if (tca < 0) return; const d2 = oc.lengthSq() - tca * tca; if (d2 < r * r && tca < bd) { bd = tca; best = b; } });
  if (best && bd < 25) bubPop(best, true); });
function bubFrame(dt) {
  const d = Math.hypot(P.x - BUB_AT.x, P.z - BUB_AT.z); if (d > 140) return;
  BUB.rush = Math.max(0, BUB.rush - dt); BUB.next -= dt * (BUB.rush > 0 ? 2.2 : 1); const k = Math.max(0, Math.min(1, 1 - BUB.next / 1.2));
  BUB.wand.rotation.x = -k * 0.5; BUB.rope.scale.set(0.75 + k * 0.4, 1 + k * 0.2, 1);
  if (BUB.next <= 0) { BUB.next = 3.2 + Math.random() * 2.5; bubMake(); }
  const day = Math.max(0, Math.min(1, ((SKY.el || 0) + 4) / 18)), sun = SKY.sunDir || null;
  BUB.b.forEach(b => { b.t += dt; const grow = Math.min(1, b.t / 1.2), fade = Math.min(1, (b.life - b.t) / 0.4); b.vy += (Math.sin(b.t * 0.7 + b.sx * 9) * 0.06 - b.vy * 0.2) * dt;
    b.m.position.x += (b.vx + Math.sin(LIFE.t * 0.2) * 0.15) * dt; b.m.position.y += b.vy * dt; b.m.position.z += b.vz * dt;
    const r = b.s * (0.2 + 0.8 * grow); b.m.scale.set(r * b.sx, r * (2 - b.sx), r); b.m.rotation.y += dt * 0.3;
    const u = b.m.material.uniforms; u.uT.value = LIFE.t; u.uA.value = grow * Math.max(0, fade); u.uLight.value = 0.25 + 0.75 * day; if (sun) u.uSun.value.copy(sun);
    const cd = camera.position.distanceTo(b.m.position); if (cd < r + 0.25) bubPop(b, true);
    else if (b.t > b.life || b.m.position.y < ground(b.m.position.x, b.m.position.z) + r * 0.6) bubPop(b, false); });
  BUB.b = BUB.b.filter(b => !b.dead);
  const mp = BUB.mist.geometry.attributes.position.array; let any = false; BUB.md.forEach((m, i) => { if (m.t > 0.7) { if (mp[i * 3 + 1] !== -999) mp[i * 3 + 1] = -999; return; } any = true; m.t += dt; m.vy -= 4 * dt; m.x += m.vx * dt; m.y += m.vy * dt; m.z += m.vz * dt; mp[i * 3] = m.x; mp[i * 3 + 1] = m.y; mp[i * 3 + 2] = m.z; });
  BUB.mist.geometry.attributes.position.needsUpdate = true; BUB.mist.visible = any;
}
window.__FRAMES.push(dt => { try { bubFrame(dt); } catch (e) { if (!BUB.err) { BUB.err = e; console.warn('v63 bubbles', e); } } });
