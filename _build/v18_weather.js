/* ================================================================
   v18 WEATHER WITH A TEMPER (2026-11-21)
   When it rains: lightning over the harbour with a bolt and thunder that arrives late by the distance, puddles
   that fill on the paths and the beach with rings where the drops land, and every resident opens an umbrella.
   When the rain stops in daylight, a rainbow over the harbour. When it snows, a snowman turns up on GM Beach.
   In harbour fog, the lighthouse sounds a foghorn. Words: STORM, RAINBOW, SNOWMAN.
   ================================================================ */
const WXX = { bolt: null, boltT: 0, nextBolt: 6, storm: 0, puddles: [], rings: null, bow: null, bowT: 0, lastWet: 0, horn: 20 };
window.__WXX = WXX;
(function bolt() {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(60 * 3), 3));
  const m = new THREE.LineBasicMaterial({ color: 0xdfe8ff, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false });
  const l = new THREE.LineSegments(g, m); l.frustumCulled = false; l.visible = false; scene.add(l); WXX.bolt = l;
  const glow = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshBasicMaterial({ color: 0xbfd0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }));
  glow.scale.set(140, 60, 140); glow.visible = false; scene.add(glow); WXX.glow = glow;
})();
function strike() {
  const a = Math.random() * PI * 2, r = 180 + Math.random() * 250, x = Math.cos(a) * r, z = Math.sin(a) * r, top = 150 + Math.random() * 60;
  const pos = WXX.bolt.geometry.attributes.position.array; let px = x + (Math.random() - 0.5) * 30, py = top, pz = z + (Math.random() - 0.5) * 30, k = 0;
  const segs = 20; for (let i = 0; i < segs; i++) { const ny = top * (1 - (i + 1) / segs), nx = x + (px - x) * 0.6 + (Math.random() - 0.5) * 16, nz = z + (pz - z) * 0.6 + (Math.random() - 0.5) * 16;
    pos[k++] = px; pos[k++] = py; pos[k++] = pz; pos[k++] = nx; pos[k++] = ny; pos[k++] = nz;
    if (i > 4 && i < 14 && Math.random() < 0.35 && k < pos.length - 6) { pos[k++] = nx; pos[k++] = ny; pos[k++] = nz; pos[k++] = nx + (Math.random() - 0.5) * 30; pos[k++] = ny - 15; pos[k++] = nz + (Math.random() - 0.5) * 30; }
    px = nx; py = ny; pz = nz; }
  for (; k < pos.length; k++) pos[k] = 0;
  WXX.bolt.geometry.attributes.position.needsUpdate = true; WXX.bolt.visible = true; WXX.boltT = 0.28; WXX.glow.position.set(x, top * 0.6, z); WXX.glow.visible = true;
  try { const f = $('flash'); f.style.background = '#e8eeff'; f.style.opacity = 0.35; setTimeout(() => { f.style.opacity = 0.1; }, 60); setTimeout(() => { f.style.opacity = 0.3; }, 110); setTimeout(() => { f.style.opacity = 0; }, 180); } catch (e) { }
  const d = Math.hypot(x - P.x, z - P.z); setTimeout(() => thunder(Math.max(0.15, 1 - d / 600)), Math.min(2500, d / 340 * 1000 * 0.6));
}
function thunder(v) {
  if (!AC || AC.state !== 'running' || !oceanGain || oceanGain.gain.value === 0) return;
  try { const len = AC.sampleRate * 3.5, buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0); let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.04 * w) / 1.04; const env = Math.min(1, i / (AC.sampleRate * 0.05)) * Math.exp(-i / (AC.sampleRate * 0.9)) * (1 + 0.6 * Math.sin(i / AC.sampleRate * 9)); d[i] = last * 5 * env; }
    const s = AC.createBufferSource(); s.buffer = buf; const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260; const g = AC.createGain(); g.gain.value = 0.9 * v; s.connect(lp); lp.connect(g); g.connect(AC.destination); s.start(); } catch (e) { }
}

/* puddles on the paths and the beach, and rings where the drops land */
(function puddles() {
  const spots = [[1.2, 30], [-1, 46], [1.5, 70], [-1.3, 88], [4, 112], [-8, 118], [12, 126], [-20, 128], [0.4, 140], [-2, 58], [20, 112], [-15, 106]];
  const mat = new THREE.MeshStandardMaterial({ color: 0x0a0f16, roughness: 0.04, metalness: 0.55, transparent: true, opacity: 0, depthWrite: false, envMapIntensity: 2.2, polygonOffset: true, polygonOffsetFactor: -2 });
  const meshes = []; scene.traverse(o => { if (o.isMesh && !o.isInstancedMesh && o.geometry && o.geometry.boundingSphere !== undefined) meshes.push(o); });
  const rc = new THREE.Raycaster(); const surf = (x, z) => { try { rc.set(new THREE.Vector3(x, 12, z), new THREE.Vector3(0, -1, 0)); const h = rc.intersectObjects(meshes, false).find(i => i.point.y < 3); if (h) return h.point.y; } catch (e) { } const f = floorAt(x, z, 3); return f.f !== null ? f.f : ground(x, z); };
  spots.forEach(([x, z], i) => { const y = surf(x, z) + 0.02; const s = new THREE.Shape(); const n = 14, r0 = 0.9 + (i % 3) * 0.45;
    for (let k = 0; k <= n; k++) { const a = k / n * PI * 2, r = r0 * (0.75 + 0.25 * Math.sin(a * 3 + i) + 0.1 * Math.cos(a * 5 + i * 2)); k ? s.lineTo(Math.cos(a) * r * 1.4, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r * 1.4, Math.sin(a) * r); }
    const m = new THREE.Mesh(new THREE.ShapeGeometry(s), mat); m.rotation.x = -PI / 2; m.rotation.z = i * 0.7; m.position.set(x, y, z); m.renderOrder = 1; scene.add(m); WXX.puddles.push({ m, x, y, z, r: r0 }); });
  WXX.pmat = mat;
  const ring = new THREE.RingGeometry(0.7, 1, 20); ring.rotateX(-PI / 2);
  const im = new THREE.InstancedMesh(ring, new THREE.MeshBasicMaterial({ color: 0xcfe0f0, transparent: true, opacity: 0.35, depthWrite: false }), 120); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; im.count = 0; scene.add(im);
  WXX.rings = im; WXX.ringData = Array.from({ length: 120 }, () => ({ x: 0, y: -99, z: 0, t: 9 }));
})();

/* umbrellas for the residents */
(function umbrellas() {
  const cols = [0x111111, 0x2962ff, 0xd93a2a, 0xffd400, 0xf0efea, 0x2a6b4a];
  const canopy = new THREE.ConeGeometry(0.75, 0.32, 8, 1, true), stick = new THREE.CylinderGeometry(0.015, 0.015, 0.9, 5);
  WXX.umbs = [];
  try { residents.forEach((r, i) => { const u = new THREE.Group(); const c = new THREE.Mesh(canopy, new THREE.MeshStandardMaterial({ color: cols[i % cols.length], roughness: 0.6, side: THREE.DoubleSide })); c.position.y = 0.45; u.add(c);
    u.add(new THREE.Mesh(stick, new THREE.MeshStandardMaterial({ color: 0x222222 }))); u.position.set(-0.25, 1.95, 0.1); u.visible = false; r.P.g.add(u); WXX.umbs.push(u); }); } catch (e) { }
})();

/* the rainbow */
(function rainbow() {
  const geo = new THREE.TorusGeometry(220, 9, 8, 96, PI);
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { op: { value: 0 } },
    vertexShader: 'varying vec3 vL; void main(){ vL = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float op; varying vec3 vL; vec3 hue(float h){ return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }\n' +
      'void main(){ float r = length(vL.xy); float t = clamp((r - 211.0) / 18.0, 0.0, 1.0); vec3 c = hue(0.78 * (1.0 - t)); float e = smoothstep(0.0, 0.15, t) * smoothstep(1.0, 0.85, t); gl_FragColor = vec4(c * e * op, 1.0); }' });
  const m = new THREE.Mesh(geo, mat); m.position.set(0, -40, 520); m.visible = false; scene.add(m); WXX.bow = m;
})();
const bowGo = secret('rainbow', () => { WXX.bowT = 60; toast('A RAINBOW OVER THE HARBOUR. IT POINTS AT THE COLOSSUS. OBVIOUSLY.'); }, ['rainbow']);
secret('storm', () => { WX.override = 'RAIN'; WXX.storm = 45; WXX.nextBolt = 1; toast('A STORM ROLLS IN OFF THE HARBOUR. THE PIGEONS KNEW.'); }, ['storm', 'thunder', 'lightning']);

/* the snowman */
(function snowman() {
  const g = new THREE.Group(), snow = new THREE.MeshStandardMaterial({ color: 0xf4f7fb, roughness: 0.9 }), coal = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.8 });
  [[0.62, 0.55], [0.45, 1.45], [0.32, 2.12]].forEach(([r, y]) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), snow); s.position.y = y; s.castShadow = true; g.add(s); });
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.32, 8), new THREE.MeshStandardMaterial({ color: 0xff7a1a })); nose.rotation.x = PI / 2; nose.position.set(0, 2.12, 0.42); g.add(nose);
  [-0.11, 0.11].forEach(x => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), coal); e.position.set(x, 2.22, 0.28); g.add(e); });
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.34, 16), coal); hat.position.y = 2.55; g.add(hat); const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.04, 16), coal); brim.position.y = 2.39; g.add(brim);
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.07, 8, 20), new THREE.MeshStandardMaterial({ color: 0x2962ff, roughness: 0.8 })); scarf.rotation.x = PI / 2; scarf.position.y = 1.82; g.add(scarf);
  const eye = new THREE.Mesh(new THREE.CircleGeometry(0.09, 20), new THREE.MeshBasicMaterial({ map: tex('assets/eye.png'), transparent: true })); eye.position.set(0, 1.45, 0.455); g.add(eye);
  const x = 4, z = 118; g.position.set(x, ground(x, z), z); g.rotation.y = PI * 0.1; g.visible = false; scene.add(g); WXX.snowman = g;
  WXX.snowInter = INTER.length; interact(x, z, 2.2, '', () => { });
})();
secret('snowman', () => { WX.override = 'SNOW'; WXX.forceSnowman = 90; toast('A SNOWMAN ON GM BEACH. HIS SCARF IS EVIL EYE BLUE. HE HAS AN EYE FOR A BUTTON.'); }, ['snowman', 'frosty']);

const snowmanGm = secret('snowmangm', () => { toast('THE SNOWMAN SAYS GM. HE WILL BE HERE UNTIL THE WEATHER CHANGES. THEN HE WILL NOT.'); });
function wxFrame(dt) {
  try {
    const wet = WX.wet || 0, t = LIFE.t;
    // lightning
    if (WXX.storm > 0) WXX.storm -= dt;
    if ((WX.cur === 'RAIN' || WX.override === 'RAIN') && wet > 0.4) { WXX.nextBolt -= dt * (WXX.storm > 0 ? 3 : 1); if (WXX.nextBolt <= 0) { WXX.nextBolt = 7 + Math.random() * 16; strike(); } }
    if (WXX.boltT > 0) { WXX.boltT -= dt; const k = Math.max(0, WXX.boltT / 0.28); WXX.bolt.material.opacity = (k > 0.6 || (k > 0.25 && k < 0.4)) ? 1 : 0.25; WXX.glow.material.opacity = 0.12 * k; if (WXX.boltT <= 0) { WXX.bolt.visible = false; WXX.glow.visible = false; } }
    // puddles and rings
    WXX.pmat.opacity = Math.min(0.92, wet * 1.2); WXX.puddles.forEach(p => p.m.visible = wet > 0.05);
    const raining = (WX.cur === 'RAIN' || WX.override === 'RAIN') && wet > 0.2, R = WXX.ringData, m = new THREE.Matrix4(); let n = 0;
    if (raining) for (let k = 0; k < 4; k++) { const i = (Math.random() * R.length) | 0; if (R[i].t > 0.7) { const p = WXX.puddles[(Math.random() * WXX.puddles.length) | 0], near = Math.random() < 0.5; const a = Math.random() * 6.28, rr = Math.random() * (near ? p.r : 6);
      R[i].x = (near ? p.x : P.x) + Math.cos(a) * rr; R[i].z = (near ? p.z : P.z) + Math.sin(a) * rr; const f = floorAt(R[i].x, R[i].z, P.y + 2); R[i].y = (f.f !== null ? f.f : ground(R[i].x, R[i].z)) + 0.03; R[i].t = 0; } }
    R.forEach(r => { if (r.t > 0.7) return; r.t += dt; const s = 0.05 + r.t * 0.5; m.makeScale(s, 1, s); m.setPosition(r.x, r.y, r.z); WXX.rings.setMatrixAt(n++, m); });
    WXX.rings.count = n; WXX.rings.instanceMatrix.needsUpdate = true;
    // umbrellas
    const umb = wet > 0.3 && (WX.cur === 'RAIN' || WX.override === 'RAIN'); WXX.umbs.forEach(u => u.visible = umb);
    // rainbow after rain in daylight
    if (WXX.lastWet > 0.45 && wet <= 0.45 && SKY.el > 5) WXX.bowT = Math.max(WXX.bowT, 70); WXX.lastWet = wet;
    if (WXX.bowT > 0) { WXX.bowT -= dt; WXX.bow.visible = true; WXX.bow.material.uniforms.op.value = Math.min(1, WXX.bowT / 8, (70 - WXX.bowT + 1) / 6) * 0.6; } else WXX.bow.visible = false;
    // snowman
    if (WXX.forceSnowman > 0) WXX.forceSnowman -= dt; const sm = (WX.snow || 0) > 0.4 || WXX.forceSnowman > 0; WXX.snowman.visible = sm;
    const si = INTER[WXX.snowInter]; if (si) { si.label = sm ? 'E · SAY GM TO THE SNOWMAN' : ''; si.fn = snowmanGm; }
    // foghorn
    if ((WX.fog || 0) > 0.5) { WXX.horn -= dt; if (WXX.horn <= 0) { WXX.horn = 28; if (AC && AC.state === 'running' && oceanGain && oceanGain.gain.value > 0) { const t0 = AC.currentTime; [0, 1.9].forEach(o => { sNote(AC.destination, 82, t0 + o, 1.6, 'sawtooth', 0.05, false); sNote(AC.destination, 110, t0 + o, 1.6, 'sawtooth', 0.03, false); }); } } }
  } catch (e) { if (!WXX.err) { WXX.err = e; console.warn('v18 weather', e); } }
}
