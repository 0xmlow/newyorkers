/* ================================================================
   v60 THE HOLE (2026-11-22), apply-mlow-impermanent-vision, Bloom
   A street chalk anamorphosis at (-41, 0), where the west path meets the ring: stand on the painted footprints and the pavement opens into a shaft
   five metres deep, its walls running with navy paint and liquid contour lines (cyan, every fifth one hot pink),
   bone white drips sliding over the broken edge, a ladder going down, and at the bottom an Open Eye Flower the size
   of a car with one small figure standing beside it, looking up at you. Take one step and it is chalk.
   How: the shaft is a real little scene, rendered once from the footprints into a texture, and that texture is
   projected back onto the flat pavement from the same eye. From the footprints it is exact; from anywhere else it
   smears into a long painted stain, which is how the real ones look too.
   ================================================================ */
const HOLE = { k: 0, chalk: 0 };
window.__HOLE = HOLE;
const HOLE_AT = { x: -41, z: 0 };
(function theHole() {
  const x0 = HOLE_AT.x, z0 = HOLE_AT.z, g0 = ground(x0, z0) + 0.07, ry = Math.atan2(-x0, -z0); HOLE.g0 = g0; HOLE.ry = ry;
  const bx = Math.sin(ry), bz = Math.cos(ry), fx = -bx, fz = -bz, rx = Math.cos(ry), rz = -Math.sin(ry);   // b: toward the viewer, f: away, r: across
  const V = { x: x0 + bx * 6.2, z: z0 + bz * 6.2 }; HOLE.V = V; const ff = floorAt(V.x, V.z, 3); const eye = new THREE.Vector3(V.x, (ff.f === null ? ground(V.x, V.z) : ff.f) + 1.7, V.z); HOLE.eye = eye;
  const S = new THREE.Scene(); HOLE.scene = S;
  const Wd = 3.2, Ln = 4.4, Dp = 4.6;   // across, along, deep
  const at = (u, v, y) => new THREE.Vector3(x0 + rx * u + fx * v, g0 + y, z0 + rz * u + fz * v);
  // the paving with the opening cut out: depth only, so the far walls hide where the ground would cover them
  const sh = new THREE.Shape(); sh.moveTo(-20, -20); sh.lineTo(20, -20); sh.lineTo(20, 20); sh.lineTo(-20, 20); sh.lineTo(-20, -20);
  const hole = new THREE.Path(); hole.moveTo(-Wd / 2, -Ln / 2); hole.lineTo(-Wd / 2, Ln / 2); hole.lineTo(Wd / 2, Ln / 2); hole.lineTo(Wd / 2, -Ln / 2); hole.lineTo(-Wd / 2, -Ln / 2); sh.holes.push(hole);
  const occ = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide })); occ.renderOrder = -1;
  occ.rotation.order = 'YXZ'; occ.rotation.set(-PI / 2, ry, 0); occ.position.set(x0, g0, z0); S.add(occ);
  // the walls: navy paint, strata of contour lines that warp as they go down, a concrete band at the top, drips
  const wallTex = (seed) => { const cv = document.createElement('canvas'); cv.width = 512; cv.height = 1024; const c = cv.getContext('2d');
    if (c && c.createLinearGradient && c.beginPath) { const g = c.createLinearGradient(0, 0, 0, 1024); g.addColorStop(0, '#243670'); g.addColorStop(0.45, '#101a3c'); g.addColorStop(1, '#020309'); c.fillStyle = g; c.fillRect(0, 0, 512, 1024);
      for (let i = 0; i < 46; i++) { const y = 70 + i * 21 + Math.pow(i, 1.25) * 0.6; const fade = Math.max(0, 1 - i / 46); c.beginPath(); for (let x = 0; x <= 512; x += 8) { const w = Math.sin(x * 0.012 + i * 0.5 + seed) * (6 + i * 0.5) + Math.sin(x * 0.031 - i * 0.3 + seed * 2) * 4; x ? c.lineTo(x, y + w) : c.moveTo(x, y + w); }
        c.lineWidth = i % 5 === 4 ? 3.4 : 1.8; c.strokeStyle = i % 5 === 4 ? `rgba(255,63,164,${0.9 * fade})` : `rgba(8,222,255,${0.85 * fade})`; c.stroke(); }
      c.fillStyle = '#8b8780'; c.beginPath(); c.moveTo(0, 0); c.lineTo(512, 0); for (let x = 512; x >= 0; x -= 16) c.lineTo(x, 38 + Math.random() * 16); c.closePath(); c.fill();
      c.fillStyle = 'rgba(60,57,52,.6)'; c.fillRect(0, 0, 512, 6);
      for (let i = 0; i < 7; i++) { const x = 30 + Math.random() * 450, L = 120 + Math.random() * 420, w = 5 + Math.random() * 7; c.fillStyle = 'rgba(239,232,218,.85)'; c.fillRect(x - w / 2, 40, w, L); c.beginPath(); c.arc(x, 40 + L, w * 0.9, 0, PI * 2); c.fill(); } }
    const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO; return t; };
  const wallM = s => new THREE.MeshBasicMaterial({ map: wallTex(s), side: THREE.DoubleSide, toneMapped: false });
  const wall = (w, u, v, rot, s) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, Dp), wallM(s)); const p = at(u, v, -Dp / 2); m.position.copy(p); m.rotation.order = 'YXZ'; m.rotation.set(0, ry + rot, 0); S.add(m); return m; };
  wall(Wd, 0, Ln / 2, 0, 1.1); wall(Wd, 0, -Ln / 2, PI, 2.3); wall(Ln, Wd / 2, 0, -PI / 2, 3.7); wall(Ln, -Wd / 2, 0, PI / 2, 5.2);
  // the floor: a navy void with a cyan glow round the flower
  const fc = document.createElement('canvas'); fc.width = fc.height = 512; const q = fc.getContext('2d');
  if (q && q.createRadialGradient) { const g = q.createRadialGradient(256, 256, 20, 256, 256, 300); g.addColorStop(0, '#0a5d8a'); g.addColorStop(0.35, '#08163a'); g.addColorStop(1, '#010206'); q.fillStyle = g; q.fillRect(0, 0, 512, 512); }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(Wd, Ln), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(fc), toneMapped: false })); floor.rotation.order = 'YXZ'; floor.rotation.set(-PI / 2, ry, 0); floor.position.copy(at(0, 0, -Dp)); S.add(floor);
  const ft = tex('assets/iv_flower.webp'); const fl = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2.3), new THREE.MeshBasicMaterial({ map: ft, transparent: true, alphaTest: 0.4, toneMapped: false })); fl.rotation.order = 'YXZ'; fl.rotation.set(-PI / 2 + 0.5, ry, 0); fl.position.copy(at(0.1, 0.35, -Dp + 0.6)); S.add(fl);
  // one small figure beside it, looking up
  const ink = new THREE.MeshBasicMaterial({ color: 0x050505, toneMapped: false }); const fig = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.62, 10), ink); body.position.y = 0.62; fig.add(body);
  const hd = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), ink); hd.position.set(0, 1.04, -0.03); fig.add(hd);
  [-0.06, 0.06].forEach(x => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.36, 6), ink); l.position.set(x, 0.18, 0); fig.add(l); });
  fig.position.copy(at(-0.85, -0.9, -Dp)); fig.rotation.y = ry; S.add(fig);
  // a ladder down the near side wall
  const rung = new THREE.MeshBasicMaterial({ color: 0x8a8f96, toneMapped: false });
  for (let i = 0; i < 11; i++) { const y = -0.4 - i * 0.37, k = 1 - i / 13; const r = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.035, 0.035), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x8a8f96).multiplyScalar(0.25 + 0.75 * k), toneMapped: false })); r.position.copy(at(-Wd / 2 + 0.08, -0.6, y)); r.rotation.y = ry + PI / 2; S.add(r); }
  [-0.85, -0.35].forEach(v => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.04, Dp, 0.04), rung); s.position.copy(at(-Wd / 2 + 0.08, v, -Dp / 2)); S.add(s); });
  // a chalk rim and broken paving round the edge, drawn at ground level
  const rimM = new THREE.MeshBasicMaterial({ color: 0x8e8a83, toneMapped: false }), lip = new THREE.MeshBasicMaterial({ color: 0x55524d, toneMapped: false });
  [[0, Ln / 2 + 0.06, Wd + 0.24, 0.12], [0, -Ln / 2 - 0.06, Wd + 0.24, 0.12], [Wd / 2 + 0.06, 0, 0.12, Ln], [-Wd / 2 - 0.06, 0, 0.12, Ln]].forEach(([u, v, w, d]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), rimM); m.rotation.order = 'YXZ'; m.rotation.set(-PI / 2, ry, 0); m.position.copy(at(u, v, 0.002)); S.add(m);
    const e = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(w, d) === w ? w : 0.03, Math.max(w, d) === w ? 0.03 : d), lip); e.rotation.order = 'YXZ'; e.rotation.set(-PI / 2, ry, 0); e.position.copy(at(u * 0.985, v * 0.985, 0.003)); S.add(e); });
  // the camera that paints it, standing where the footprints are
  const res = isMobile ? 768 : 1536; const rt = new THREE.WebGLRenderTarget(res, res, { format: THREE.RGBAFormat }); HOLE.rt = rt;
  const pc = new THREE.PerspectiveCamera(72, 1, 0.05, 60); pc.position.copy(eye); pc.lookAt(at(0, 0.2, -1.6)); pc.updateMatrixWorld(); pc.updateProjectionMatrix(); HOLE.pc = pc;
  const pv = new THREE.Matrix4().multiplyMatrices(pc.projectionMatrix, pc.matrixWorldInverse);
  const dm = new THREE.ShaderMaterial({ uniforms: { map: { value: rt.texture }, uPV: { value: pv }, uLight: { value: 1 }, uNight: { value: 0 } }, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4,
    vertexShader: 'uniform mat4 uPV; varying vec4 vP; void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vP = uPV * wp; gl_Position = projectionMatrix * viewMatrix * wp; }',
    fragmentShader: 'uniform sampler2D map; uniform float uLight, uNight; varying vec4 vP; void main(){ if (vP.w <= 0.0) discard; vec2 uv = vP.xy / vP.w * 0.5 + 0.5; if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) discard; vec4 c = texture2D(map, uv); if (c.a < 0.02) discard;' +
      ' float glow = max(c.b - c.r, 0.0); vec3 col = c.rgb * uLight + c.rgb * glow * uNight * 1.4; gl_FragColor = vec4(col, c.a); gl_FragColor = linearToOutputTexel(gl_FragColor); }' });
  const decal = new THREE.Mesh(new THREE.PlaneGeometry(Wd + 1.2, Ln + 2.4, 1, 1), dm); decal.rotation.order = 'YXZ'; decal.rotation.set(-PI / 2, ry, 0); decal.position.copy(at(0, 0.2, 0)); decal.renderOrder = 2; scene.add(decal); HOLE.decal = decal; HOLE.dm = dm;
  // the footprints
  const pcv = document.createElement('canvas'); pcv.width = 512; pcv.height = 512; const p2 = pcv.getContext('2d');
  if (p2 && p2.ellipse && p2.fillText) { p2.fillStyle = 'rgba(239,232,218,.92)'; [[200, 0.08], [312, -0.08]].forEach(([x, a]) => { p2.save(); p2.translate(x, 250); p2.rotate(a); p2.beginPath(); p2.ellipse(0, -40, 38, 70, 0, 0, PI * 2); p2.fill(); p2.beginPath(); p2.ellipse(0, 75, 30, 38, 0, 0, PI * 2); p2.fill(); p2.restore(); });
    p2.font = '700 42px "Archivo Black", Impact, sans-serif'; p2.textAlign = 'center'; p2.fillText('STAND HERE', 256, 430); p2.font = '400 34px "Permanent Marker", "Archivo Black", sans-serif'; p2.fillText('look down', 256, 478); p2.fillText('THE HOLE', 256, 70); }
  const fpt = new THREE.CanvasTexture(pcv); fpt.encoding = THREE.sRGBEncoding;
  const fp = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), new THREE.MeshStandardMaterial({ map: fpt, transparent: true, roughness: 0.95, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 })); fp.rotation.order = 'YXZ'; fp.rotation.set(-PI / 2, ry, 0);
  fp.position.set(V.x, (ff.f === null ? ground(V.x, V.z) : ff.f) + 0.03, V.z); scene.add(fp); HOLE.fp = fp;
  HOLE.Wd = Wd; HOLE.Ln = Ln; HOLE.at = at; HOLE.paint = () => { if (!renderer.getRenderTarget || !renderer.getClearAlpha) return; const r = renderer, old = r.getRenderTarget(), oc = r.getClearColor(new THREE.Color()), oa = r.getClearAlpha(), sm = r.shadowMap.autoUpdate;
    try { r.shadowMap.autoUpdate = false; r.setRenderTarget(rt); r.setClearColor(0x000000, 0); r.clear(true, true, true); r.render(S, pc); } finally { r.setRenderTarget(old); r.setClearColor(oc, oa); r.shadowMap.autoUpdate = sm; } };
  HOLE.paint(); HOLE.last = 0;
  if (window.__MAP) MAP.places.push(['THE HOLE', x0, z0, V.x, V.z]);
})();
const holeSecret = secret('thehole', () => { toast('FROM HERE IT GOES ALL THE WAY DOWN. SOMEONE DOWN THERE IS LOOKING UP. TAKE ONE STEP AND IT IS CHALK.', 'blue'); });
EGGS.hole = EGGS.anamorphic = () => { const V = HOLE.V; teleport(V.x, V.z, HOLE.ry); P.pitch = -0.62; toast('STAND STILL. LOOK DOWN. DO NOT STEP FORWARD (YOU CAN, IT IS CHALK).'); }; EGGS.hole.__s = true;
const _hv = new THREE.Vector3(), _hw = new THREE.Vector3();
function holeFrame(dt) {
  const d = Math.hypot(P.x - HOLE_AT.x, P.z - HOLE_AT.z); HOLE.decal.visible = HOLE.fp.visible = d < 140; if (d > 140) return;
  HOLE.last += dt; if (HOLE.last > 1.5 && d < 70) { HOLE.last = 0; HOLE.paint(); }
  const day = Math.max(0, Math.min(1, ((SKY.el || 0) + 4) / 18)), night = Math.min(1, (L.lamps || 0) * 1.4);
  HOLE.dm.uniforms.uLight.value = 0.16 + 0.84 * day + 0.12 * night; HOLE.dm.uniforms.uNight.value = night;
  // the trick seen: on the footprints, looking into it
  const dv = Math.hypot(P.x - HOLE.V.x, P.z - HOLE.V.z);
  if (dv < 0.75) { camera.getWorldDirection(_hw); _hv.copy(HOLE.at(0, 0, -1)).sub(camera.position).normalize(); if (_hv.dot(_hw) > 0.93) { HOLE.k += dt; if (HOLE.k > 1) holeSecret(); } else HOLE.k = 0; } else HOLE.k = 0;
  // stepping on it
  const lx = P.x - HOLE_AT.x, lz = P.z - HOLE_AT.z, u = lx * Math.cos(HOLE.ry) - lz * Math.sin(HOLE.ry), v = -(lx * Math.sin(HOLE.ry) + lz * Math.cos(HOLE.ry));
  const inside = Math.abs(u) < HOLE.Wd / 2 && Math.abs(v) < HOLE.Ln / 2; if (inside && !HOLE.chalk) { HOLE.chalk = 1; toast('IT IS CHALK. IT WAS ALWAYS CHALK.'); } if (!inside && HOLE.chalk && d > 6) HOLE.chalk = 0;
}
window.__FRAMES.push(dt => { try { holeFrame(dt); } catch (e) { if (!HOLE.err) { HOLE.err = e; console.warn('v60 hole', e); } } });
