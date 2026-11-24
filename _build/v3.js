/* ================================================================
   V3  ·  THE BIG UPGRADE (2026-11-24, brief: NEW YORKERS SITE/_build/GALLERY_UPGRADE_2026-11-23.md)
   Sits on top of V1 and V2. Geometry and material first: Poly Haven CC0 scans swapped in as they arrive, real GLBs where a
   visitor walks to something (the poker table, the Rat King, the porcelain sockets, the shop lights, the clock, the camera),
   built architecture (joists, a steel girder on lally columns, crown moulding, door casings, stair stringers), mom's notes
   and the house's signs in the house fonts, and one illusion per room that had none (four anamorphic paintings, each read
   from one pair of orange footprints). The look, desktop only and behind ?look=0: a reflection probe of the room you are
   in, full anisotropy, a calmer grade with warm highlights and cool shadows.
   ================================================================ */
const U3 = { look: new URLSearchParams(location.search).get('look') !== '0' && !isMobile, lazy: [], gc: {}, pending: 0, anam: [], notes: [], probe: { zone: '', t: 0, cache: {}, rt: [] }, t: 0, king: null, fixed: false };
const U3MAXA = (() => { try { return renderer.capabilities.getMaxAnisotropy(); } catch (e) { return ANISO; } })();

/* ---------------- scanned materials: Poly Haven CC0 at 1k, swapped in when all three maps have landed ---------------- */
function u3maps(name, done, rep) { const m = {}; let n = 0; ['c', 'n', 'r'].forEach(s => TL.load(`assets/v3/tex/${name}_${s}.webp`, t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = U3MAXA; if (rep) t.repeat.set(rep, rep); if (s === 'c') t.encoding = THREE.sRGBEncoding; m[s] = t; if (++n === 3) done(m); })); }
/* swap an existing material's maps for a scan; `pre` is the tint it holds until the scan arrives (no white walls, no mirrors) */
function u3swap(mat, name, o = {}) { if (o.pre) mat.color.set(o.pre); u3maps(name, m => { mat.map = m.c; mat.normalMap = m.n; mat.roughnessMap = m.r; mat.roughness = o.rough || 1; mat.color.set(o.color || 0xffffff); if (o.boost) mat.color.multiplyScalar(o.boost); /* scans are darker than the flat paint they replace */ if (o.ns) mat.normalScale.set(o.ns, o.ns); if (o.env !== undefined) mat.envMapIntensity = o.env; mat.needsUpdate = true; }, o.rep); return mat; }
/* a fresh scanned material, tinted until it loads */
function u3scan(name, wuv, o = {}) { const mat = new THREE.MeshStandardMaterial({ color: o.pre || 0x8a847c, roughness: 0.9, metalness: o.metal || 0 }); mat.userData.wuv = wuv; return u3swap(mat, name, o); }
const U3MAT = {
  plank: u3scan('stair_planks', 1.0, { pre: 0x6a4a30, color: 0xd8c8b8 }),
  courtWall: u3scan('worn_plaster_wall', 2.2, { pre: 0xb0aa9e, color: 0xf2ece0, boost: 1.3 }),
  plate: u3scan('metal_plate', 1.0, { pre: 0xa8b0b8, color: 0xffffff, metal: 0.35, rough: 0.8, env: 0.9, boost: 1.6 }),
  stain: new THREE.MeshStandardMaterial({ color: 0x4a3222, roughness: 0.5 }),       // the varnished trim of a 1974 finished basement
  primer: new THREE.MeshStandardMaterial({ color: 0x6a2c20, roughness: 0.62, metalness: 0.4 }), // red oxide on the steel
  lally: new THREE.MeshStandardMaterial({ color: 0x3c3f41, roughness: 0.5, metalness: 0.7 }),
  hazard: null
};
// the shared V1 materials, rescanned: every floor of the mechanical rooms, the brick patches, the plaster of the bagel cavern, the linoleum
u3swap(MAT.conc, 'concrete_floor_worn_001', { pre: 0x8a8680, color: 0xffffff, rough: 0.8, boost: 1.8 });
u3swap(MAT.brick, 'red_brick_plaster_patch_02', { pre: 0x8a5a48, color: 0xe0d6cc, rep: 0.7 });
u3swap(MAT.plaster, 'white_rough_plaster', { pre: 0xc8c2b6, color: 0xffffff, rep: 0.6, ns: 0.8, boost: 1.35 });
u3swap(MAT.vinyl, 'old_linoleum_flooring_01', { pre: 0xa89670, color: 0xffffff, rough: 1, env: 0.5, boost: 1.4 });
// the knotty pine was a traffic cone: pull its orange back towards varnished pine, in every clone of it
(function panelTone() { const nm = MAT.panel.normalMap; const desat = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', 'vec4 texelColor = mapTexelToLinear(texture2D(map, vUv)); float pL = dot(texelColor.rgb, vec3(0.2126, 0.7152, 0.0722)); texelColor.rgb = mix(vec3(pL), texelColor.rgb, 0.5) * vec3(1.0, 0.9, 0.8); diffuseColor *= texelColor;'); };
  scene.traverse(o => { if (!o.isMesh) return; [].concat(o.material).forEach(m => { if (m && (m === MAT.panel || m.normalMap === nm) && !m.userData.u3tone) { m.userData.u3tone = true; m.color.set(0xc4b8ae); m.roughness = 0.48; m.onBeforeCompile = desat; m.needsUpdate = true; } }); }); })();
// the laundry and court ceilings were a lumpy FLORA texture: the subfloor and the new joists are sawn planks now
u3swap(MAT.joist, 'stair_planks', { pre: 0x9a8670, color: 0xf0dcc0, rough: 1, rep: 0.8, boost: 1.6 });
// the hallway's walls have been black since V1: their map was cloned before the pine had loaded, so it never got a picture
U3.hallFix = () => { const src = MAT.panel.map; if (!src || !src.image) return false; let n = 0; scene.traverse(o => { if (!o.isMesh) return; [].concat(o.material).forEach(m => { if (m && m.normalMap === MAT.panel.normalMap && m.map && m.map !== src && !m.map.image) { m.map.image = src.image; m.map.needsUpdate = true; n++; } }); }); return true; };
// the drop ceiling read as glazed tile: mineral fibre is matte
MAT.ceil.roughnessMap = null; MAT.ceil.roughness = 0.95; MAT.ceil.envMapIntensity = 0.15; MAT.ceil.needsUpdate = true;

/* ---------------- GLBs: loaded once each, cloned per placement, streamed by distance ---------------- */
function u3glb(name, cb) {
  const g = U3.gc[name] || (U3.gc[name] = { s: null, q: [], busy: false, err: false }); if (g.err) return; if (g.s) { cb(g.s.clone(true)); return; }
  g.q.push(cb); if (g.busy || !gltfLoader) return; g.busy = true; U3.pending++;
  gltfLoader.load(`assets/v3/glb/${name}.glb`, r => { U3.pending--; g.s = r.scene; const q = g.q; g.q = []; q.forEach(f => { try { f(g.s.clone(true)); } catch (e) { console.warn('V3', name, e); } }); }, undefined, () => { U3.pending--; g.err = true; });
}
/* place a GLB: size in metres of its height (mode h) or largest side (mode m); yaw turns the model before fitting; ry turns it in place */
function u3place(name, x, y, z, ry, size, mode = 'h', yaw = 0, o = {}) {
  const L = { x, z, range: o.range || 34, done: false, fn: () => u3glb(name, obj => { const f = fitGLB(obj, size, mode, yaw); if (o.rx) f.g.rotation.x = o.rx; f.g.rotation.y = ry; f.g.position.set(x, y, z); if (o.env !== undefined) obj.traverse(m => { if (m.isMesh) [].concat(m.material).forEach(mt => { if (mt) mt.envMapIntensity = o.env; }); });
    (o.parent || scene).add(f.g); if (o.then) o.then(f, obj); }) };
  U3.lazy.push(L); return L;
}

/* ---------------- canvases: mom's notes in Permanent Marker, the house's signs in Archivo Expanded and JetBrains Mono ---------------- */
const U3F = { marker: '"Permanent Marker","Archivo Narrow",sans-serif', wide: '"Archivo Expanded","Archivo Narrow",sans-serif', mono: '"JetBrains Mono","IBM Plex Mono",monospace' };
function u3fit(c, text, font, size, maxW) { let s = size; c.font = font.replace('$', s); while (c.measureText(text).width > maxW && s > 8) { s *= 0.94; c.font = font.replace('$', s); } return s; }
/* a note taped to the wall: lines [{t, c, s}], paper or index card, two strips of tape, a little tilt */
function u3noteDraw(N) { const { cv, lines, paper } = N, c = cv.getContext('2d'), w = cv.width, h = cv.height; c.clearRect(0, 0, w, h);
  c.fillStyle = paper || '#f3efe4'; c.fillRect(0, 0, w, h); let s2 = 7; for (let i = 0; i < 900; i++) { s2 = (s2 * 16807) % 2147483647; const x = s2 % w; s2 = (s2 * 16807) % 2147483647; const y = s2 % h; c.fillStyle = `rgba(90,70,40,${0.03 + (i % 5) * 0.008})`; c.fillRect(x, y, 2, 2); }
  if (N.ruled) { c.strokeStyle = 'rgba(80,120,200,0.35)'; c.lineWidth = 2; for (let y = h * 0.22; y < h; y += h * 0.11) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } c.strokeStyle = 'rgba(210,60,60,0.45)'; c.beginPath(); c.moveTo(w * 0.1, 0); c.lineTo(w * 0.1, h); c.stroke(); }
  const tot = lines.reduce((a, l) => a + (l.s || 0.2) * h * 1.15, 0); let y = (h - tot) / 2;
  lines.forEach(l => { const sz = u3fit(c, l.t, `400 $px ${l.f || U3F.marker}`, (l.s || 0.2) * h, w * 0.86); c.fillStyle = l.c || '#141414'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.save(); c.translate(w / 2, y + sz * 0.575); c.rotate((l.r || 0) * 0.02); c.fillText(l.t, 0, 0); c.restore(); y += (l.s || 0.2) * h * 1.15; });
  c.fillStyle = 'rgba(226,214,170,0.78)'; c.save(); c.translate(w * 0.12, h * 0.02); c.rotate(-0.5); c.fillRect(-w * 0.1, -h * 0.03, w * 0.2, h * 0.08); c.restore(); c.save(); c.translate(w * 0.88, h * 0.02); c.rotate(0.45); c.fillRect(-w * 0.1, -h * 0.03, w * 0.2, h * 0.08); c.restore();
  N.t.needsUpdate = true; }
function u3note(lines, x, y, z, ry, W = 0.3, H = 0.22, o = {}) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = Math.round(512 * H / W); const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = U3MAXA;
  const N = { cv, t, lines, paper: o.paper, ruled: o.ruled }; U3.notes.push(N); u3noteDraw(N);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: t, roughness: 0.92, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  m.position.set(x + Math.sin(ry) * 0.006, y, z + Math.cos(ry) * 0.006); m.rotation.set(0, ry, o.tilt === undefined ? (rnd() - 0.5) * 0.08 : o.tilt, 'YXZ'); m.receiveShadow = true; scene.add(m); return m;
}
/* a printed sign: a solid plate with type, for the house's own signage (not a brand) */
function u3sign(draw, x, y, z, ry, W, H, o = {}) {
  const cv = document.createElement('canvas'); cv.width = o.px || 1024; cv.height = Math.round(cv.width * H / W); const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = U3MAXA;
  const N = { cv, t, redraw: () => { draw(cv.getContext('2d'), cv.width, cv.height); t.needsUpdate = true; } }; N.redraw(); U3.notes.push(N);
  const mat = o.glow ? new THREE.MeshBasicMaterial({ map: t, toneMapped: false, transparent: !!o.alpha }) : new THREE.MeshStandardMaterial({ map: t, roughness: o.rough || 0.55, metalness: o.metal || 0, transparent: !!o.alpha, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat); m.position.set(x + Math.sin(ry) * (o.off || 0.008), y, z + Math.cos(ry) * (o.off || 0.008)); m.rotation.set(o.rx || 0, ry, o.rz || 0, 'YXZ'); scene.add(m);
  if (o.plate) box(W + 0.02, H + 0.02, 0.012, o.plate, x + Math.sin(ry) * 0.002, y, z + Math.cos(ry) * 0.002, ry, 0, false); return m;
}
const u3text = (c, t, x, y, font, size, maxW, fill, align = 'center') => { u3fit(c, t, font, size, maxW); c.fillStyle = fill; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(t, x, y); };
if (document.fonts && document.fonts.load) Promise.all(['400 40px "Permanent Marker"', '800 40px "Archivo Expanded"', '700 40px "JetBrains Mono"'].map(f => document.fonts.load(f))).then(() => { U3.notes.forEach(N => N.redraw ? N.redraw() : u3noteDraw(N)); U3.anam.forEach(A => A.redraw && A.redraw()); }).catch(() => { });

/* ---------------- anamorphosis: a painting projected from one eye onto several surfaces. From the footprints it stands up; anywhere else it is smeared paint ---------------- */
function u3anam(id, eye, look, fov, aspect, draw, targets, o = {}) {
  const cam = new THREE.PerspectiveCamera(fov, aspect, 0.05, 80); cam.position.set(...eye); cam.lookAt(new V3(...look)); cam.updateMatrixWorld(true); cam.updateProjectionMatrix();
  const M = new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
  const cv = document.createElement('canvas'); cv.width = o.px || 1024; cv.height = Math.round(cv.width / aspect); const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = U3MAXA;
  const A = { id, eye, look, cv, t, redraw: () => { const c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height); draw(c, cv.width, cv.height); t.needsUpdate = true; }, fired: false, dir: new V3(look[0] - eye[0], look[1] - eye[1], look[2] - eye[2]).normalize(), toast: o.toast };
  A.redraw();
  const mat = new THREE.MeshStandardMaterial({ map: t, roughness: o.rough || 0.7, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  mat.onBeforeCompile = sh => { sh.uniforms.uAM = { value: M };
    sh.vertexShader = 'uniform mat4 uAM;\nvarying vec4 vAP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvAP = uAM * modelMatrix * vec4(transformed, 1.0);');
    sh.fragmentShader = 'varying vec4 vAP;\n' + sh.fragmentShader.replace('#include <map_fragment>', 'vec2 aUv = vAP.xy / vAP.w * 0.5 + 0.5; if (vAP.w <= 0.0 || aUv.x < 0.0 || aUv.x > 1.0 || aUv.y < 0.0 || aUv.y > 1.0) discard;\n\tvec4 texelColor = mapTexelToLinear(texture2D(map, aUv)); if (texelColor.a < 0.04) discard; diffuseColor *= texelColor;'); };
  targets.forEach(tg => { tg.updateMatrixWorld(true); const m = new THREE.Mesh(tg.geometry, mat); m.matrixAutoUpdate = false; m.matrix.copy(tg.matrixWorld); m.receiveShadow = true; m.renderOrder = 2; scene.add(m); });
  // the footprints: where to stand, the same orange as the steam staircase's
  [[-0.11, 0.06], [0.11, -0.06]].forEach(([dx, dz]) => { const yaw = Math.atan2(look[0] - eye[0], look[2] - eye[2]); const fx = eye[0] + Math.cos(yaw) * dx - Math.sin(yaw) * 0.1, fz = eye[2] - Math.sin(yaw) * dx - Math.cos(yaw) * 0.1; box(0.11, 0.004, 0.28, MAT.orange, fx, (o.floorY || 0) + 0.003, fz + dz * 0, yaw, 0, false); });
  U3.anam.push(A); return A;
}
/* a flat overlay sheet a few millimetres off a floor or wall, for the projection to land on */
function u3sheet(W, H, x, y, z, ry, rx = 0) { const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H)); m.position.set(x, y, z); m.rotation.set(rx, ry, 0, 'YXZ'); m.updateMatrixWorld(true); return m; }
function u3chip(c, cx, cy, R, label, sub) { // a poker chip seen face on
  c.save(); c.translate(cx, cy); c.fillStyle = '#e8e2d4'; c.beginPath(); c.arc(0, 0, R, 0, PI * 2); c.fill(); c.fillStyle = '#2962FF'; c.beginPath(); c.arc(0, 0, R * 0.97, 0, PI * 2); c.fill();
  for (let i = 0; i < 8; i++) { c.save(); c.rotate(i * PI / 4); c.fillStyle = '#f2efe6'; c.fillRect(-R * 0.09, -R * 0.97, R * 0.18, R * 0.24); c.restore(); }
  c.strokeStyle = '#f2efe6'; c.lineWidth = R * 0.025; c.setLineDash([R * 0.06, R * 0.05]); c.beginPath(); c.arc(0, 0, R * 0.66, 0, PI * 2); c.stroke(); c.setLineDash([]);
  c.fillStyle = '#FF6B00'; c.beginPath(); c.arc(0, 0, R * 0.6, 0, PI * 2); c.fill(); u3text(c, label, 0, -R * 0.08, '900 $px ' + U3F.wide, R * 0.36, R * 1.0, '#0D0D0D'); u3text(c, sub, 0, R * 0.3, '700 $px ' + U3F.mono, R * 0.12, R * 0.95, '#0D0D0D'); c.restore();
}

/* ---------------- built architecture helpers ---------------- */
/* merge many boxes into one mesh, each with world UVs in metres (joists, stringers, mouldings: one draw each) */
function u3boxes(list, mat, wuv, shadow = true) {
  const pos = [], nor = [], uv = [], idx = []; let base = 0;
  list.forEach(([w, h, d, x, y, z, ry = 0, rx = 0]) => { const g = new THREE.BoxGeometry(w, h, d); if (rx) g.rotateX(rx); if (ry) g.rotateY(ry); g.translate(x, y, z); worldUV(g, wuv);
    const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv; for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); uv.push(u.getX(i), u.getY(i)); }
    const ix = g.index.array; for (let i = 0; i < ix.length; i++) idx.push(ix[i] + base); base += p.count; g.dispose(); });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const m = new THREE.Mesh(g, mat); m.castShadow = shadow; m.receiveShadow = true; scene.add(m); return m;
}
/* exposed floor joists, 2x10 at 16 inches, across a ceiling; `skip` leaves a bay open (for a fixture or a pipe) */
function u3joists(x0, x1, z0, z1, h, along = 'z') { const L = []; const span = along === 'z' ? [z0, z1] : [x0, x1], a0 = along === 'z' ? x0 : z0, a1 = along === 'z' ? x1 : z1;
  for (let a = a0 + 0.2; a < a1 - 0.1; a += 0.406) along === 'z' ? L.push([0.045, 0.235, z1 - z0, a, h - 0.118, (z0 + z1) / 2]) : L.push([x1 - x0, 0.235, 0.045, (x0 + x1) / 2, h - 0.118, a]);
  // solid blocking at mid span, staggered, the way a framer does it
  for (let a = a0 + 0.2; a < a1 - 0.5; a += 0.406) { const k = Math.round((a - a0) / 0.406) % 2 ? 0.05 : -0.05; along === 'z' ? L.push([0.36, 0.2, 0.045, a + 0.203, h - 0.12, (span[0] + span[1]) / 2 + k]) : L.push([0.045, 0.2, 0.36, (span[0] + span[1]) / 2 + k, h - 0.12, a + 0.203]); }
  return u3boxes(L, MAT.joist, 1.2); }
/* crown moulding: a fascia and a lip where the panelling meets the drop ceiling */
function u3crown(x0, x1, z0, z1, h, skip = []) { const L = [], t = 0.03; const sides = [['x', z0, 1], ['x', z1, -1], ['z', x0, 1], ['z', x1, -1]];
  sides.forEach(([ax, c, s]) => { const a0 = ax === 'x' ? x0 : z0, a1 = ax === 'x' ? x1 : z1, len = a1 - a0, mid = (a0 + a1) / 2; if (skip.some(k => k[0] === ax && Math.abs(k[1] - c) < 0.01)) return;
    if (ax === 'x') { L.push([len, 0.09, t, mid, h - 0.045, c + s * t / 2]); L.push([len, 0.022, 0.06, mid, h - 0.011, c + s * 0.03]); L.push([len, 0.015, t + 0.012, mid, h - 0.098, c + s * (t + 0.012) / 2]); }
    else { L.push([t, 0.09, len, c + s * t / 2, h - 0.045, mid]); L.push([0.06, 0.022, len, c + s * 0.03, h - 0.011, mid]); L.push([t + 0.012, 0.015, len, c + s * (t + 0.012) / 2, h - 0.098, mid]); } });
  return u3boxes(L, U3MAT.stain, 1.0, false); }
/* a door casing on both faces of an opening in a wall at `c` on axis `ax` ('x' walls run along x) */
function u3casing(ax, c, at, w, h, wallT = 0.25, list = []) { const cw = 0.075, pr = 0.018; [-1, 1].forEach(s => { const off = c + s * (wallT / 2 + pr / 2) - (ax === 'x' ? 0 : 0);
    if (ax === 'x') { list.push([cw, h + cw, pr, at - w / 2 - cw / 2, (h + cw) / 2, off]); list.push([cw, h + cw, pr, at + w / 2 + cw / 2, (h + cw) / 2, off]); list.push([w + cw * 2, cw, pr, at, h + cw / 2, off]); }
    else { list.push([pr, h + cw, cw, off, (h + cw) / 2, at - w / 2 - cw / 2]); list.push([pr, h + cw, cw, off, (h + cw) / 2, at + w / 2 + cw / 2]); list.push([pr, cw, w + cw * 2, off, h + cw / 2, at]); } }); return list; }
/* a suspended ceiling's grid, built: white T-bars on the 61 cm module the tiles are printed on, and a lit 2 x 4 diffuser or two */
U3MAT.tee = new THREE.MeshStandardMaterial({ color: 0xe9e6de, roughness: 0.4, metalness: 0.3 });
U3MAT.lens = new THREE.MeshBasicMaterial({ color: 0xf6f1e4, toneMapped: false });
function u3grid(x0, x1, z0, z1, h, lights = []) { const L = [], M = 0.61; for (let x = Math.ceil(x0 / M) * M; x < x1 - 0.02; x += M) L.push([0.024, 0.014, z1 - z0, x, h - 0.007, (z0 + z1) / 2]); for (let z = Math.ceil(z0 / M) * M; z < z1 - 0.02; z += M) L.push([x1 - x0, 0.014, 0.024, (x0 + x1) / 2, h - 0.006, z]);
  lights.forEach(([x, z]) => { const cx = Math.round(x / M) * M + M / 2, cz = Math.round(z / M) * M; L.push([0.6, 0.03, 0.02, cx, h - 0.015, cz - 0.6], [0.6, 0.03, 0.02, cx, h - 0.015, cz + 0.6], [0.02, 0.03, 1.2, cx - 0.3, h - 0.015, cz], [0.02, 0.03, 1.2, cx + 0.3, h - 0.015, cz]); const p = plane(0.58, 1.18, U3MAT.lens, cx, h - 0.004, cz, 0, PI / 2); p.receiveShadow = false; });
  return u3boxes(L, U3MAT.tee, 1.0, false); }
/* a lally column: a steel pipe with a base plate and a cap plate, and a post for collision */
function u3lally(x, z, top) { cyl(0.055, 0.055, top - 0.02, U3MAT.lally, x, (top - 0.02) / 2 + 0.01, z, 16); box(0.2, 0.012, 0.2, U3MAT.lally, x, 0.006, z, 0, 0, false); box(0.2, 0.012, 0.2, U3MAT.lally, x, top - 0.006, z, 0, 0, false); post(x, z, 0.08, -1, top); }

/* ================= ROOM BY ROOM ================= */

/* --- 1. THE STAIRS: planks you can read, stringers, a hazard header, the porcelain socket, the fire alarm pull, mom's notes, and MOM IS UPSTAIRS painted across the flight --- */
(function u3stairs() {
  u3grid(-1.3, 1.3, 20, 24.2, 2.2); u3crown(-1.3, 1.3, 20, 24.2, 2.2, [['x', 20], ['x', 24.2]]);
  const rise = 2.6, run = 4.6, n = 13, z0 = 24.2, t = run / n, steps = [];
  scene.children.filter(o => o.isMesh && o.material === MAT.wood && Math.abs(o.position.x) < 0.01 && o.position.z > z0 && o.position.z < z0 + run && o.geometry.parameters && Math.abs(o.geometry.parameters.width - 1.2) < 0.01).forEach(o => { worldUV(o.geometry, 1.0); o.material = U3MAT.plank; steps.push(o); });
  // stringers on both sides, under the flight: the sawtooth reads as a staircase someone built
  const sl = Math.hypot(run, rise), ang = Math.atan2(rise, run); [-0.592, 0.592].forEach(x => { const m = box(0.014, 0.24, sl, U3MAT.stain, x, rise / 2 + 0.17, z0 + run / 2, 0, 0, false); m.rotation.x = -ang; }); // the skirt boards up the flight
  // nosing returns: a round lip on every tread
  for (let i = 0; i < n; i++) { const y = rise / n * (i + 1); const m = cyl(0.016, 0.016, 1.18, U3MAT.plank, 0, y - 0.016, z0 + t * i + 0.005, 10, PI / 2); m.rotation.set(0, 0, PI / 2); steps.push(m); }
  // the header over the landing: yellow and black, WATCH YOUR HEAD, in the house type
  u3sign((c, w, h) => { for (let x = -h; x < w + h; x += h * 0.9) { c.fillStyle = (Math.round(x / (h * 0.9)) % 2) ? '#0D0D0D' : '#F2C200'; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + h * 0.45, 0); c.lineTo(x + h * 0.45 - h, h); c.lineTo(x - h, h); c.fill(); }
    c.fillStyle = '#0D0D0D'; c.fillRect(w * 0.22, h * 0.14, w * 0.56, h * 0.72); u3text(c, 'WATCH YOUR HEAD', w / 2, h / 2, '900 $px ' + U3F.wide, h * 0.42, w * 0.52, '#F2C200'); }, 0, 2.08, z0 - 0.04, PI, 1.2, 0.2, { off: 0.003 });
  u3note([{ t: 'WIPE YOUR FEET.', s: 0.3 }, { t: 'I JUST DID', s: 0.22 }, { t: 'THE STAIRS. MOM', s: 0.22 }], 0.3, rise + 1.1, z0 + run + 0.97, PI, 0.3, 0.26, { tilt: 0.04 }); // on the door at the top
  u3note([{ t: 'LIGHTS OFF', s: 0.26 }, { t: 'WHEN YOU LEAVE.', s: 0.2 }, { t: 'THIS MEANS YOU', s: 0.2, c: '#c8102e' }], -1.285, 1.48, 20.32, PI / 2, 0.24, 0.2);
  u3place('fire_alarm', -1.27, 1.3, 22.6, PI / 2, 0.16, 'h', 0); u3sign((c, w, h) => { c.fillStyle = '#c8102e'; c.fillRect(0, 0, w, h); u3text(c, 'IN CASE OF MOM', w / 2, h * 0.36, '900 $px ' + U3F.wide, h * 0.3, w * 0.9, '#FFFFFF'); u3text(c, 'PULL. SHE WILL NOT COME DOWN.', w / 2, h * 0.72, '700 $px ' + U3F.mono, h * 0.17, w * 0.9, '#FFFFFF'); }, -1.29, 1.52, 22.6, PI / 2, 0.24, 0.09, { px: 512 });
  interact(-0.9, 22.6, 0.8, 'PULL THE ALARM', () => { toast('YOU PULLED IT. NOTHING HAPPENED. UPSTAIRS, THE TV GOT LOUDER.', 'blue'); state.eggs.add('alarm'); knock(2); }, 0);
  u3place('mousetrap', 1.1, 0, 23.9, 0.4, 0.1, 'm'); // the trap with the crumb was a box; now a real one
  // THE TRICK: MOM IS UPSTAIRS, painted across the treads and risers, standing up only from the landing
  const sheet = steps.slice(); u3anam('stairs', [0, 1.65, 21.0], [0, 0.55, 27.6], 33, 0.45, (c, w, h) => {
    u3text(c, 'MOM', w / 2, h * 0.13, '900 $px ' + U3F.wide, h * 0.12, w * 0.92, '#2962FF'); u3text(c, 'IS', w / 2, h * 0.27, '900 $px ' + U3F.wide, h * 0.12, w * 0.92, '#FFFFFF'); u3text(c, 'UPSTAIRS', w / 2, h * 0.4, '900 $px ' + U3F.wide, h * 0.1, w * 0.96, '#FF6B00');
    c.fillStyle = '#FFFFFF'; c.fillRect(w * 0.15, h * 0.48, w * 0.7, h * 0.01); u3text(c, 'SHE KNOWS YOU ARE DOWN HERE', w / 2, h * 0.53, '700 $px ' + U3F.mono, h * 0.03, w * 0.86, '#FFFFFF'); }, sheet, { toast: 'MOM IS UPSTAIRS. IT WAS PAINTED ON THE STAIRS THE WHOLE TIME. FROM ANYWHERE ELSE IT IS JUST PAINT.' });
})();

/* --- 2. THE TV DEN: crown moulding and casings in varnished stain, the porcelain socket, the thermostat note, the wall clock stuck at 4:20 --- */
(function u3den() {
  u3grid(-4.5, 4.5, 11, 20, 2.35, [[-2.4, 13.4], [2.4, 18.3]]); u3crown(-4.5, 4.5, 11, 20, 2.35); const cs = []; // casings on both faces of the den's three doors (the walls are 25 cm, centred a half wall outside the line)
  u3casing('z', -4.625, 18.5, 1.2, 2.0, 0.25, cs); u3casing('z', 4.625, 13.2, 1.2, 2.0, 0.25, cs); u3casing('x', 10.875, -2.5, 1.3, 2.1, 0.25, cs); u3boxes(cs, U3MAT.stain, 1.0, false);
  u3note([{ t: 'DO NOT TOUCH', s: 0.24 }, { t: 'THE THERMOSTAT', s: 0.24 }, { t: 'LOVE, MOM', s: 0.2, c: '#c8102e' }], 4.465, 1.17, 12.62, -PI / 2, 0.22, 0.18, { paper: '#fff7a8' });
  u3place('wall_clock', -4.47, 1.95, 16.9, PI / 2, 0.3, 'h');
  u3note([{ t: 'IT IS ALWAYS', s: 0.26 }, { t: '4:20 DOWN HERE', s: 0.26 }], -4.47, 1.66, 16.9, PI / 2, 0.22, 0.12, { paper: '#f6f3ea' });
  u3note([{ t: 'COASTERS.', s: 0.36 }, { t: 'I AM NOT ASKING', s: 0.22 }], 0.22, 0.443, 16.32, 0, 0.16, 0.11, { tilt: 0.2 }).rotation.set(-PI / 2, 0, 0.3);
})();

/* --- 3. THE CARD ROOM: linoleum, the Odd Couple poker table for real, casing, crown, the clock, a note, ALL IN painted into the corner --- */
(function u3card() {
  u3grid(-12, -4.75, 17, 22, 2.15, [[-10.7, 20.7]]); u3crown(-12, -4.75, 17, 22, 2.15); // its door casing is the den's, both faces
  // the table: our own Odd Couple poker table, in the wobbling group, the folding top and legs hidden once it lands
  const old = W.table.children.slice(); u3place('poker_table', 0, 0, 0, 0, 1.0, 'h', 0, { parent: W.table, range: 30, then: (f, obj) => {
    W.table.updateMatrixWorld(true); let big = null, bv = 0; obj.traverse(o => { if (o.isMesh) { const b = new THREE.Box3().setFromObject(o), s = b.getSize(new V3()); if (s.x * s.z > bv) { bv = s.x * s.z; big = b; } } });
    const top = big ? big.max.y - W.table.position.y : 0.76; const k = 0.76 / Math.max(0.2, top); f.g.scale.multiplyScalar(k); old.forEach(o => { o.visible = false; }); U3.table = f.g; } });
  u3place('wall_clock', -4.77, 1.62, 20.4, -PI / 2, 0.28, 'h');
  u3note([{ t: 'NO GAMBLING', s: 0.28 }, { t: 'IN MY HOUSE', s: 0.28 }, { t: 'MOM', s: 0.2, c: '#c8102e' }], -4.765, 1.3, 19.6, -PI / 2, 0.26, 0.2, { ruled: true });
  // THE TRICK: a poker chip the size of a manhole cover, standing in the south east corner. It is paint on the floor and two walls.
  const tg = [u3sheet(2.1, 1.9, -5.8, 0.003, 21.0, 0, -PI / 2), u3sheet(2.4, 0.78, -6.0, 0.39, 21.995, PI), u3sheet(2.2, 0.78, -4.755, 0.39, 20.9, -PI / 2)];
  u3anam('card', [-7.0, 1.62, 17.6], [-5.5, 0.42, 21.45], 26, 1.0, (c, w, h) => { u3chip(c, w / 2, h / 2, w * 0.36, 'ALL IN', 'PROOF OF STAKE . FIVE DOLLAR MINIMUM'); }, tg, { toast: 'A CHIP THE SIZE OF A MANHOLE COVER IS STANDING IN THE CORNER. TAKE ONE STEP AND IT IS PAINT ON THE FLOOR.' });
})();

/* --- 4. BOILER AND LAUNDRY: joists and blocking overhead, a flush girder and a lally column, a shop light, the rack of jugs, the plunger, the cement, the rules --- */
(function u3laundry() {
  u3joists(4.75, 13, 11, 19, 2.05, 'z');
  u3boxes([[8.25, 0.24, 0.12, 8.875, 2.05 - 0.12, 15.0], [8.25, 0.012, 0.2, 8.875, 2.05 - 0.236, 15.0]], U3MAT.primer, 1.0); // a flush steel girder across the joists, red oxide
  u3lally(7.0, 15.0, 1.81);
  // the fluorescent tube becomes a mounted shop light under the joists
  scene.children.filter(o => o.isMesh && o.material === MAT.tube && o.position.x > 4.75 && o.position.x < 13 && o.position.z > 11 && o.position.z < 19).forEach(o => { o.visible = false; scene.children.filter(e => e.isMesh && e.material === MAT.enamel && Math.abs(e.position.x - o.position.x) < 0.01 && Math.abs(e.position.z - o.position.z) < 0.01 && e.position.y > o.position.y).forEach(e => { e.visible = false; }); u3place('mounted_fluorescent_lights', o.position.x, 1.775, o.position.z, PI / 2, 1.3, 'm'); });
  u3place('plastic_bottle_gallon', 10.5, 0.88, 11.42, 0.3, 0.28); u3place('plastic_bottle_gallon', 9.95, 0.88, 11.45, -0.4, 0.28); u3place('plunger', 10.82, 0, 12.0, 0.2, 0.55);
  u3place('cement_bag', 7.2, 0, 18.55, 0.5, 0.6, 'm');
  u3note([{ t: 'NO SNEAKERS', s: 0.24 }, { t: 'IN THE DRYER.', s: 0.24 }, { t: 'I MEAN IT.', s: 0.22, c: '#c8102e' }], 8.66, 1.08, 11.02, 0, 0.26, 0.2);
  u3sign((c, w, h) => { c.fillStyle = '#c8102e'; c.fillRect(0, 0, w, h); c.strokeStyle = '#FFFFFF'; c.lineWidth = h * 0.04; c.strokeRect(h * 0.08, h * 0.08, w - h * 0.16, h * 0.84); u3text(c, 'BOILER ROOM', w / 2, h * 0.4, '900 $px ' + U3F.wide, h * 0.3, w * 0.86, '#FFFFFF'); u3text(c, 'AUTHORIZED PERSONNEL. AND HIM.', w / 2, h * 0.72, '700 $px ' + U3F.mono, h * 0.13, w * 0.86, '#FFFFFF'); }, 11.6, 1.42, 12.46, PI, 0.5, 0.2, { px: 512 }); // stencilled on the boiler's jacket
})();

/* --- 5. THE INFINITE HALLWAY: an exit sign at every door frame, each one smaller, each one saying the same thing --- */
(function u3hall() {
  for (let z = 7; z > -36; z -= 5.5) { const w = HALL.w(z), h = HALL.h(z), s = w / HALL.w0;
    u3sign((c, W2, H2) => { c.fillStyle = '#0a0a0a'; c.fillRect(0, 0, W2, H2); u3text(c, 'NO EXIT', W2 / 2, H2 * 0.54, '900 $px ' + U3F.wide, H2 * 0.62, W2 * 0.86, '#ff3b2a'); }, HALL.x, h * 0.86 + 0.09 * s, z + 0.04 * s, 0, 0.34 * s, 0.12 * s, { glow: true, px: 256, off: 0.03 * s }); }
  u3note([{ t: 'THE SUPER SAYS', s: 0.22 }, { t: 'IT ENDS.', s: 0.3 }, { t: 'IT DOES NOT.', s: 0.22, c: '#c8102e' }], HALL.x + HALL.w(9.0) / 2 - 0.005, 1.45, 9.0, -PI / 2, 0.24, 0.2);
})();

/* --- 6. THE EVERYTHING BAGEL: a bagel that was baked (lumps, a pale belly, a glazed top, 2,600 real toppings), scanned plaster and brick, the hand truck, and the wet floor sign that is not there --- */
(function u3bagel() {
  const cx = -20, cz = -9, R = 4.2, r = 1.9;
  // bake the ring: knead the surface, flatten the bottom where it sat on the tray, a darker top, a pale belly band, a floury base
  const g = W.bagel.geometry, p = g.attributes.position, nn = g.attributes.normal, col = [];
  for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const nx = nn.getX(i), ny = nn.getY(i), nz = nn.getZ(i);
    const n1 = Math.sin(x * 2.1 + y * 1.3) * Math.cos(y * 1.7 - z * 2.4) * 0.09 + Math.sin(x * 5.3 - z * 4.1 + y * 3.7) * 0.035; x += nx * n1; y += ny * n1; z += nz * n1;
    if (z > r * 0.5) z = r * 0.5 + (z - r * 0.5) * 0.3; // world down is +z here (the ring is turned a quarter about x)
    p.setXYZ(i, x, y, z); const up = clamp(-z / r, -1, 1); // 1 at the crown of the ring, -1 underneath
    const crown = smooth(0.1, 0.9, up), belly = 1 - smooth(0.05, 0.5, Math.abs(up + 0.05)), base = smooth(0.2, 0.6, -up);
    let cr = 0.62 + crown * 0.1 - base * 0.02, cg = 0.43 + crown * 0.02 + belly * 0.12, cb = 0.24 + belly * 0.16 + base * 0.12; cr += belly * 0.22 + base * 0.25; cg += base * 0.3; cb += base * 0.28; const v = 1 + (Math.sin(x * 9.1 + z * 7.3) * 0.04);
    col.push(Math.min(1, cr * v), Math.min(1, cg * v), Math.min(1, cb * v)); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); p.needsUpdate = true;
  const bm = MAT.bagel.clone(); bm.vertexColors = true; bm.color.set(0xffffff); bm.roughness = 0.42; bm.envMapIntensity = 0.7; W.bagel.material = bm;
  // the toppings, sampled from the baked surface itself so nothing floats: sesame, poppy, dried onion, garlic, salt
  W.bagel.updateMatrixWorld(true); const mw = W.bagel.matrixWorld, nm = new THREE.Matrix3().getNormalMatrix(mw); if (W.seeds) W.seeds.visible = false;
  const kinds = [{ n: 1300, geo: (() => { const s = new THREE.SphereGeometry(0.075, 7, 4); s.scale(1, 0.38, 1.75); return s; })(), mat: new THREE.MeshStandardMaterial({ color: 0xf2e2bc, roughness: 0.55 }), s: [0.8, 1.3] },
    { n: 900, geo: new THREE.IcosahedronGeometry(0.03, 0), mat: new THREE.MeshStandardMaterial({ color: 0x1d1d26, roughness: 0.5 }), s: [0.8, 1.4] },
    { n: 260, geo: (() => { const s = new THREE.BoxGeometry(0.16, 0.025, 0.11); return s; })(), mat: new THREE.MeshStandardMaterial({ color: 0x6e3e18, roughness: 0.8 }), s: [0.7, 1.5] },
    { n: 140, geo: new THREE.BoxGeometry(0.05, 0.05, 0.05), mat: new THREE.MeshStandardMaterial({ color: 0xf8f8f4, roughness: 0.25, metalness: 0.05 }), s: [0.8, 1.6] }];
  const ix = g.index, m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new V3(0, 1, 0), wp = new V3(), wn = new V3(), sc = new V3();
  kinds.forEach(K => { const im = new THREE.InstancedMesh(K.geo, K.mat, K.n); let k = 0, guard = 0;
    while (k < K.n && guard++ < K.n * 20) { // a random point on a random triangle, not a vertex: vertices sit on the torus grid and the toppings came out in rows
      const tri = Math.floor(rnd() * (ix.count / 3)) * 3, a = ix.getX(tri), b = ix.getX(tri + 1), cc = ix.getX(tri + 2); let u = rnd(), v = rnd(); if (u + v > 1) { u = 1 - u; v = 1 - v; } const w0 = 1 - u - v;
      wn.set(nn.getX(a) * w0 + nn.getX(b) * u + nn.getX(cc) * v, nn.getY(a) * w0 + nn.getY(b) * u + nn.getY(cc) * v, nn.getZ(a) * w0 + nn.getZ(b) * u + nn.getZ(cc) * v).applyMatrix3(nm).normalize(); if (wn.y < -0.15) continue;
      wp.set(p.getX(a) * w0 + p.getX(b) * u + p.getX(cc) * v, p.getY(a) * w0 + p.getY(b) * u + p.getY(cc) * v, p.getZ(a) * w0 + p.getZ(b) * u + p.getZ(cc) * v).applyMatrix4(mw);
      const e = BITE_E(wp); if (e < 0.4) continue; q.setFromUnitVectors(up, wn); q.multiply(new THREE.Quaternion().setFromAxisAngle(up, rnd() * PI * 2)); const s = K.s[0] + rnd() * (K.s[1] - K.s[0]); m4.compose(wp.addScaledVector(wn, 0.012), q, sc.set(s, s, s)); im.setMatrixAt(k++, m4); }
    im.count = k; im.castShadow = true; im.receiveShadow = true; scene.add(im); });
  function BITE_E(v) { const a = Math.atan2(v.z - cz, v.x - cx); return Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) - 0.31; } // keep the toppings off the bitten face
  // the cavern: the brick patch and plaster are scanned (shared swaps above); the hand truck by the seltzer pallet
  u3place('hand_truck', -9.3, 0, -19.2, 0.6, 1.2, 'h', 0, { range: 40 });
  u3note([{ t: 'WHO TOOK A BITE', s: 0.3 }, { t: 'OUT OF THE BAGEL', s: 0.26 }, { t: 'I AM NOT MAD. MOM', s: 0.2, c: '#c8102e' }], -3.63, 1.6, 4.7, -PI / 2, 0.34, 0.26);
  // THE TRICK: a yellow wet floor sign standing in the doorway. It is paint on the concrete.
  const tg = [u3sheet(6.0, 3.8, -7.0, 0.004, 3.1, 0, -PI / 2)];
  u3anam('bagel', [-4.3, 1.7, 3.0], [-6.8, 0.5, 3.1], 24, 0.75, (c, w, h) => {
    c.save(); c.translate(w / 2, h * 0.5); c.fillStyle = '#F2C200'; c.beginPath(); c.moveTo(-w * 0.28, h * 0.4); c.lineTo(-w * 0.18, -h * 0.4); c.quadraticCurveTo(0, -h * 0.47, w * 0.18, -h * 0.4); c.lineTo(w * 0.28, h * 0.4); c.closePath(); c.fill();
    c.fillStyle = '#0D0D0D'; c.fillRect(-w * 0.2, -h * 0.26, w * 0.4, h * 0.012); u3text(c, 'CAUTION', 0, -h * 0.31, '900 $px ' + U3F.wide, h * 0.07, w * 0.36, '#0D0D0D');
    u3text(c, 'CREAM', 0, -h * 0.12, '900 $px ' + U3F.wide, h * 0.075, w * 0.4, '#0D0D0D'); u3text(c, 'CHEESE', 0, -h * 0.03, '900 $px ' + U3F.wide, h * 0.075, w * 0.42, '#0D0D0D');
    c.strokeStyle = '#0D0D0D'; c.lineWidth = w * 0.012; c.beginPath(); c.arc(0, h * 0.14, w * 0.07, 0, PI * 2); c.stroke(); c.beginPath(); c.moveTo(-w * 0.03, h * 0.11); c.lineTo(w * 0.03, h * 0.19); c.stroke();
    u3text(c, 'WADE RESPONSIBLY', 0, h * 0.3, '700 $px ' + U3F.mono, h * 0.034, w * 0.42, '#0D0D0D'); c.fillStyle = 'rgba(0,0,0,0.28)'; c.fillRect(-w * 0.3, h * 0.4, w * 0.6, h * 0.02); c.restore(); }, tg, { toast: 'A WET FLOOR SIGN IS STANDING IN THE DOORWAY. WALK INTO IT. IT IS PAINT. THE CREAM CHEESE IS REAL.' });
})();

/* --- 7. THE RAT KING'S COURT: joists, a girder on two lally columns, scanned plaster, the Rat King himself as a model, the court camera, ALL RISE --- */
(function u3court() {
  u3joists(5, 13, 19.25, 28, 2.7, 'z');
  u3boxes([[8.0, 0.2, 0.1, 9.0, 2.7 - 0.235 - 0.1, 22.6], [8.0, 0.014, 0.2, 9.0, 2.7 - 0.235 - 0.007, 22.6], [8.0, 0.014, 0.2, 9.0, 2.7 - 0.235 - 0.193, 22.6]], U3MAT.primer, 1.0); // an I beam under the joists
  u3lally(7.4, 22.6, 2.7 - 0.235 - 0.2); u3lally(10.6, 22.6, 2.7 - 0.235 - 0.2);
  scene.children.filter(o => o.isMesh && o.material === MAT.plaster && o.position.x >= 4.6 && o.position.x <= 13.4 && o.position.z >= 19 && o.position.z <= 28.4 && o.position.y > 0.2 && o.position.y < 2.6).forEach(o => { o.material = U3MAT.courtWall; });
  // the Rat King: our own king from the sewers (crown, ermine, the plunger sceptre) stands on his throne. The V2 group still nods, reclines and salutes.
  if (V2.rat) { const prims = V2.rat.children.slice(); u3place('rat_king', 0, 0, 0, 0, 1.05, 'h', 0, { parent: V2.rat, range: 26, then: f => { prims.forEach(o => { o.visible = false; }); f.g.position.set(0, -0.06, 0.04); U3.king = f.g; } }); }
  u3place('security_camera_01', 12.85, 2.38, 19.45, -2.4, 0.3, 'm', PI / 2, { rx: 0 });
  u3sign((c, w, h) => { c.fillStyle = '#0D0D0D'; c.fillRect(0, 0, w, h); c.fillStyle = '#ff2a2a'; c.beginPath(); c.arc(h * 0.5, h * 0.5, h * 0.16, 0, PI * 2); c.fill(); u3text(c, 'THIS COURT IS RECORDING', w * 0.56, h * 0.5, '800 $px ' + U3F.wide, h * 0.3, w * 0.8, '#FFFFFF'); }, 12.97, 2.1, 20.2, -PI / 2, 0.6, 0.12, { px: 512 });
  u3note([{ t: 'WHOSE RATS', s: 0.28 }, { t: 'ARE THESE', s: 0.28 }, { t: 'MOM', s: 0.2, c: '#c8102e' }], 5.035, 1.55, 21.2, PI / 2, 0.24, 0.2, { ruled: true });
  // THE TRICK: ALL RISE stands in the air over the runner, from the door. It is paint on the runner, the dais and the back wall.
  const tg = [u3sheet(3.4, 5.6, 9.0, 0.012, 24.0, 0, -PI / 2), u3sheet(3.4, 0.3, 9.0, 0.15, 25.595, 0), u3sheet(3.4, 2.0, 9.0, 0.31, 26.6, 0, -PI / 2), u3sheet(3.6, 2.4, 9.0, 1.2, 27.99, PI)];
  u3anam('court', [9, 1.65, 19.9], [9, 0.55, 23.2], 30, 1.25, (c, w, h) => { c.fillStyle = 'rgba(123,31,42,0.92)'; c.fillRect(w * 0.18, h * 0.34, w * 0.64, h * 0.3); c.strokeStyle = '#c9a227'; c.lineWidth = h * 0.012; c.strokeRect(w * 0.2, h * 0.36, w * 0.6, h * 0.26);
    u3text(c, 'ALL RISE', w / 2, h * 0.455, '900 $px ' + U3F.wide, h * 0.12, w * 0.54, '#F2E6C0'); u3text(c, 'THE RAT KING PRESIDING', w / 2, h * 0.565, '700 $px ' + U3F.mono, h * 0.04, w * 0.5, '#F2E6C0'); }, tg, { toast: 'ALL RISE. THE BANNER HANGS IN THE AIR OVER THE RUNNER. IT IS PAINTED ON THE FLOOR, THE DAIS AND THE WALL.' });
})();

/* --- 8. MOM'S SECOND FREEZER: diamond plate underfoot, the caged shop lights on chains, a note, SHE KNEW painted on the cold --- */
(function u3cold() {
  scene.children.filter(o => o.isMesh && o.material === MAT.enamel && Math.abs(o.position.x - 24) < 0.01 && Math.abs(o.position.z - 24) < 0.01 && o.position.y < 0).forEach(o => { worldUV(o.geometry, 1.0); o.material = U3MAT.plate; });
  scene.children.filter(o => o.isMesh && o.material === MAT.tube && o.position.x > 20 && o.position.x < 28 && o.position.z > 20 && o.position.z < 28).forEach(o => { o.visible = false; scene.children.filter(e => e.isMesh && e.material === MAT.enamel && Math.abs(e.position.x - o.position.x) < 0.01 && Math.abs(e.position.z - o.position.z) < 0.01 && e.position.y > o.position.y).forEach(e => { e.visible = false; }); u3place('caged_hanging_light', o.position.x, 3.6 - 0.78, o.position.z, PI / 2, 1.5, 'm', 0, { range: 30 }); });
  u3note([{ t: 'THIS IS NOT', s: 0.26 }, { t: 'YOUR FOOD', s: 0.3 }, { t: 'EVEN THE SOUP', s: 0.2, c: '#c8102e' }], 20.62, 1.25, 25.7, PI / 2, 0.26, 0.2, { paper: '#e9f1f6' });
  // THE TRICK: SHE KNEW, standing in the middle of the cold room, painted across the floor and the back wall
  const tg = [u3sheet(7.6, 4.6, 24, 0.004, 25.6, 0, -PI / 2), u3sheet(7.6, 3.4, 24, 1.7, 27.99, PI)];
  u3anam('cold', [24, 1.65, 21.0], [24, 0.7, 24.6], 36, 1.3, (c, w, h) => { c.save(); c.globalAlpha = 0.9; u3text(c, 'SHE', w / 2, h * 0.44, '900 $px ' + U3F.wide, h * 0.17, w * 0.5, '#2962FF'); u3text(c, 'KNEW', w / 2, h * 0.62, '900 $px ' + U3F.wide, h * 0.17, w * 0.6, '#2962FF'); c.restore(); }, tg, { toast: 'SHE KNEW. IT IS WRITTEN ACROSS THE FLOOR AND THE WALL, AND IT ONLY STANDS UP FROM THE DOOR.' });
})();

/* --- Firefly plates (queued in NEW YORKERS SITE/_build/museum/FIREFLY_QUEUE.md): replacing the file in assets/v3/ff/ is all it takes --- */
function u3ff(file, ok) { TL.load('assets/v3/ff/' + file, t => { t.encoding = THREE.sRGBEncoding; t.anisotropy = U3MAXA; ok(t); }, undefined, () => { }); }
// the wrong room's wallpaper: a PIL placeholder sits at the path now
u3ff('ff_wrongroom_wallpaper.webp', t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 }); scene.children.filter(o => o.isMesh && o.material === MAT.peach && o.position.x < -4.7 && o.position.x > -9.4).forEach(o => { worldUV(o.geometry, 0.9); o.material = m; }); });
// the bagel cavern's mural on the brick patch, and the cold room's frost: invisible until the file exists
u3ff('ff_bagel_mural.webp', t => { const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); plane(7.2, 3.6, m, -28, 2.5, -23.84, 0); });
u3ff('ff_frost_wall.webp', t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; scene.children.filter(o => o.isMesh && o.position.x >= 19.7 && o.position.x <= 28.3 && o.position.z >= 19.7 && o.position.z <= 28.3 && o.position.y > 0.3 && o.position.y < 3.0 && o.geometry.parameters && (o.geometry.parameters.width < 0.3 || o.geometry.parameters.depth < 0.3) && o.geometry.parameters.height > 1.0).forEach(o => { const m = o.material.clone(); m.map = t; m.color.set(0xffffff); m.needsUpdate = true; o.material = m; }); });

/* --- every bare bulb gets a porcelain pull chain socket; the hallway's shrink with the corridor --- */
BULBS.forEach(b => { const inHall = b.x > HALL.x - 1 && b.x < HALL.x + 1 && b.z < 11 && b.z > -40; const s = inHall ? HALL.w(b.z + 2.5) / HALL.w0 : 1; if (s < 0.45) return; u3place('pull_chain_light_socket', b.x, b.y + 0.035 * s - 0.11 * s, b.z, 0, 0.165 * s, 'h', 0, { range: 30 }); });

/* ================= the look: the room's own reflection, full anisotropy, the grade ================= */
function u3probe() { if (!U3.look || !ENV.on || !THREE.CubeCamera || !THREE.WebGLCubeRenderTarget) return; const z = ZONES.find(Z => Z.name === zoneName); if (!z) return;
  if (U3.probe.cache[zoneName]) { scene.environment = U3.probe.cache[zoneName]; return; }
  try { const rt = new THREE.WebGLCubeRenderTarget(128, { format: THREE.RGBFormat, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, encoding: THREE.sRGBEncoding }), cc = new THREE.CubeCamera(0.1, 60, rt);
    const x = clamp(P.x, z.x0 + 0.4, z.x1 - 0.4), zz = clamp(P.z, z.z0 + 0.4, z.z1 - 0.4); cc.position.set(x, 1.5, zz); scene.add(cc); const prev = scene.environment; scene.environment = null; cc.update(renderer, scene); scene.remove(cc);
    const pm = new THREE.PMREMGenerator(renderer), env = pm.fromCubemap(rt.texture).texture; pm.dispose(); rt.dispose(); U3.probe.cache[zoneName] = env; scene.environment = env || prev; } catch (e) { console.warn('V3 probe', e); U3.look = false; } }
if (U3.look && POST.grade) { // warm highlights, cool shadows, a soft curve, finer grain. ?look=0 keeps the V1 grade.
  POST.grade.material.fragmentShader = 'uniform sampler2D tDiffuse; uniform float uVig, uSat, uTime, uGrain; varying vec2 vUv;\nfloat h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }\nvoid main(){ vec4 c = texture2D(tDiffuse, vUv); float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722)); c.rgb = mix(vec3(l), c.rgb, uSat * 0.97);\n  float hi = smoothstep(0.08, 0.7, l); c.rgb *= mix(vec3(0.94, 0.985, 1.05), vec3(1.05, 1.0, 0.93), hi);\n  c.rgb = c.rgb * (1.0 + 0.10 * (c.rgb - 0.18) / (c.rgb + 0.35));\n  vec2 d = vUv - 0.5; c.rgb *= 1.0 - uVig * 1.1 * dot(d, d) * 2.4; float g = h(vUv * 997.0 + uTime) + h(vUv * 431.0 - uTime * 0.7) - 1.0; c.rgb += g * uGrain * 0.6 * (0.35 + l); gl_FragColor = c; }';
  POST.grade.material.needsUpdate = true; }

/* ================= the tick ================= */
function v3Tick(dt, t) {
  U3.t -= dt; if (U3.t <= 0) { U3.t = 0.3; U3.lazy.forEach(L => { if (!L.done && Math.hypot(P.x - L.x, P.z - L.z) < L.range) { L.done = true; L.fn(); } }); }
  if (!U3.hallFixed) U3.hallFixed = U3.hallFix();
  if (!U3.fixed && state.started) { U3.fixed = true; if (U3MAXA > ANISO) scene.traverse(o => { if (o.isMesh) [].concat(o.material).forEach(m => { ['map', 'normalMap', 'roughnessMap'].forEach(k => { const tx = m && m[k]; if (tx && tx.anisotropy < U3MAXA) { tx.anisotropy = U3MAXA; tx.needsUpdate = true; } }); }); }); }
  if (zoneName !== U3.probe.zone) { U3.probe.zone = zoneName; U3.probe.t = 0.5; } if (U3.probe.t > 0) { U3.probe.t -= dt; if (U3.probe.t <= 0) u3probe(); }
  if (U3.king && V2.crown) { U3.king.position.y = -0.06 + (V2.crown.position.y - 0.8) * 1.2; if (V2.ratHead) U3.king.rotation.x = V2.ratHead.rotation.x * 0.4; } // the crown and nod eggs move the king himself now
  if (state.started) U3.anam.forEach(A => { if (A.fired) return; if (Math.hypot(P.x - A.eye[0], P.z - A.eye[2]) > 0.45) return; camera.getWorldDirection(V2.lookDir); if (V2.lookDir.dot(A.dir) > 0.97) { A.fired = true; state.eggs.add('anamorph_' + A.id); toast(A.toast, 'blue'); chime(659); } });
}
{ const _v2t = v2Tick; v2Tick = (dt, t) => { _v2t(dt, t); v3Tick(dt, t); }; }
window.__u3 = U3;
