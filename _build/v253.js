/* ================================================================
   v253 ILLUSION: THE EYE FROM ONE SPOT (2026-11-23)
   An anamorphic painting in the manner of Felice Varini, in MLow's language. Cobalt and cyan rings and the outline
   of an Open Eye Flower are painted across everything between the promenade and the bodega block: the brick, the
   cornices, the fire escape, the sign, the pavement, the lamp posts, the people's benches. From anywhere else it is
   a scatter of curved fragments on unrelated things. From one spot on the ring, marked by a pair of painted
   footprints, it closes into a single flat eye floating in the air, looking straight back at you.
   How: a projector camera at that spot. The island is drawn once from it into a depth texture; then every surface
   it can see gets an overlay that looks the projector's image up in its own clip space and keeps a fragment only
   where the projector saw that surface first (so hidden faces stay bare, the way a real projected painting is).
   Meshes and instanced meshes alike, one overlay each. ?anamorph=0 turns it off.
   ================================================================ */
const ANA = { V: new THREE.Vector3(0.7, 0.665 + 1.62, 50.5), T: new THREE.Vector3(16, 3.4, 66), fov: 52, overlays: 0, ready: false, stand: false };
window.__ANA = ANA;
(function anamorph() {
  if (!LOOK.on || /anamorph=0/.test(location.search) || isMobile && /lite/.test(location.search)) return;
  // the painting: rings and an eye flower, flat paint with clean edges
  const cv = document.createElement('canvas'); cv.width = cv.height = 2048; const c = cv.getContext('2d'); if (!c || !c.arc || !c.stroke || !c.ellipse) return;
  c.clearRect(0, 0, 2048, 2048); c.lineCap = 'round';
  const ring = (r, w, col) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.arc(1024, 1024, r, 0, PI * 2); c.stroke(); };
  ring(960, 34, '#2962FF'); ring(860, 22, '#08DEFF'); ring(780, 34, '#2962FF');
  // twelve petals, outlined
  for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; c.save(); c.translate(1024, 1024); c.rotate(a); c.strokeStyle = '#efe8da'; c.lineWidth = 26; c.beginPath(); c.ellipse(0, -470, 120, 250, 0, 0, PI * 2); c.stroke(); c.restore(); }
  // the eye: white almond, cobalt iris, ink pupil
  c.fillStyle = '#efe8da'; c.beginPath(); c.moveTo(1024 - 300, 1024); c.quadraticCurveTo(1024, 1024 - 260, 1024 + 300, 1024); c.quadraticCurveTo(1024, 1024 + 260, 1024 - 300, 1024); c.fill();
  c.fillStyle = '#2962FF'; c.beginPath(); c.arc(1024, 1024, 128, 0, PI * 2); c.fill(); c.fillStyle = '#08DEFF'; c.beginPath(); c.arc(1024, 1024, 74, 0, PI * 2); c.fill();
  c.fillStyle = '#0D0D0D'; c.beginPath(); c.arc(1024, 1024, 46, 0, PI * 2); c.fill(); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(1044, 1000, 14, 0, PI * 2); c.fill();
  const art = new THREE.CanvasTexture(cv); art.encoding = THREE.sRGBEncoding; art.anisotropy = ANISO;
  const cam = new THREE.PerspectiveCamera(ANA.fov, 1, 0.5, 90); cam.position.copy(ANA.V); cam.lookAt(ANA.T); cam.updateMatrixWorld(); cam.updateProjectionMatrix(); ANA.cam = cam;
  const VP = new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
  const rt = new THREE.WebGLRenderTarget(1024, 1024); rt.depthTexture = new THREE.DepthTexture(1024, 1024); rt.depthTexture.type = THREE.UnsignedIntType; ANA.rt = rt;
  const U = { uVP: { value: VP }, uArt: { value: art }, uDepth: { value: rt.depthTexture }, uP: { value: ANA.V.clone() }, uOn: { value: 0 }, uDbg: { value: 0 } };
  const mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6, toneMapped: true });
  mat.onBeforeCompile = sh => { Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform mat4 uVP; varying vec4 vPj; varying vec3 vPw; varying vec3 vNw;')
      .replace('#include <project_vertex>', `#include <project_vertex>
        { vec4 wp = vec4(transformed, 1.0); vec3 wn = normal;
        #ifdef USE_INSTANCING
          wp = instanceMatrix * wp; wn = mat3(instanceMatrix) * wn;
        #endif
          wp = modelMatrix * wp; vPw = wp.xyz; vNw = normalize(mat3(modelMatrix) * wn); vPj = uVP * wp; }`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uArt, uDepth; uniform vec3 uP; uniform float uOn, uDbg; varying vec4 vPj; varying vec3 vPw; varying vec3 vNw;')
      .replace('#include <map_fragment>', `
        if (vPj.w <= 0.0) discard; vec3 nd = vPj.xyz / vPj.w; vec2 puv = nd.xy * 0.5 + 0.5;
        if (puv.x < 0.0 || puv.x > 1.0 || puv.y < 0.0 || puv.y > 1.0) discard;
        float sd = texture2D(uDepth, puv).x; float fd = nd.z * 0.5 + 0.5; if (uDbg < 0.5 && fd > sd + 0.0008) discard; if (uDbg > 1.5) { diffuseColor = vec4(puv, sd, 1.0); } else {
        vec4 a = texture2D(uArt, puv); if (a.a < 0.5) discard;
        float face = dot(normalize(vNw), normalize(uP - vPw)); if (face < 0.03) discard;
        diffuseColor.rgb = a.rgb; diffuseColor.a = uOn; }`);
  };
  mat.customProgramCacheKey = () => 'ana253';
  ANA.mat = mat; ANA.U = U;
  // footprints at the spot
  const fc = document.createElement('canvas'); fc.width = 256; fc.height = 256; const f = fc.getContext('2d');
  if (f && f.ellipse && f.fill) { f.clearRect(0, 0, 256, 256); f.fillStyle = '#2962FF'; [[96, 130, -0.1], [160, 126, 0.1]].forEach(([x, y, r]) => { f.save(); f.translate(x, y); f.rotate(r); f.beginPath(); f.ellipse(0, 0, 26, 52, 0, 0, PI * 2); f.fill(); f.beginPath(); f.ellipse(0, -66, 18, 16, 0, 0, PI * 2); f.fill(); f.restore(); });
    f.fillStyle = '#efe8da'; f.font = '700 22px "Archivo Black",Impact,sans-serif'; f.textAlign = 'center'; f.fillText('STAND HERE', 128, 232); }
  const ft = new THREE.CanvasTexture(fc); ft.encoding = THREE.sRGBEncoding;
  const fp = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshStandardMaterial({ map: ft, transparent: true, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -7, polygonOffsetUnits: -7 }));
  fp.rotation.x = -PI / 2; fp.rotation.z = Math.atan2(ANA.T.x - ANA.V.x, ANA.T.z - ANA.V.z) + PI; fp.position.set(ANA.V.x, 0.665 + 0.03, ANA.V.z); fp.renderOrder = 4; scene.add(fp); ANA.fp = fp;
})();
// after the island has settled: draw its depth from the spot once, then overlay what the projector sees
function anaBuild() {
  const cam = ANA.cam; cam.updateMatrixWorld(); const fr = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
  const wasT = renderer.getRenderTarget(), wasMask = cam.layers.mask; cam.layers.mask = camera.layers.mask | 1; renderer.setRenderTarget(ANA.rt); renderer.clear(); renderer.render(scene, cam); renderer.setRenderTarget(wasT);
  const list = []; const sph = new THREE.Sphere();
  scene.traverse(o => { if (!o.isMesh || o.isSkinnedMesh || !o.visible || o.layers.mask === 0 || !o.geometry || o.userData.__ana || o.material === ANA.mat) return; const m = o.material; if (!m || Array.isArray(m) || m.transparent || m.isShaderMaterial || m.alphaTest > 0) return; const triN = (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; if (o.isInstancedMesh && triN > 1500) return; if (triN * (o.isInstancedMesh ? o.count : 1) > 60000) return;
    if (!o.geometry.attributes.normal) return; if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); if (!o.geometry.boundingSphere) return;
    if (o.isInstancedMesh) { if (o.count > 600) return; let hit = false; const m4 = new THREE.Matrix4(), r0 = o.geometry.boundingSphere.radius; for (let i = 0; i < o.count && !hit; i++) { o.getMatrixAt(i, m4); sph.center.setFromMatrixPosition(m4).applyMatrix4(o.matrixWorld); sph.radius = r0 * Math.max(m4.getMaxScaleOnAxis(), 0.01); if (fr.intersectsSphere(sph) && sph.center.distanceTo(ANA.V) < 85) hit = true; } if (!hit) return; o.userData.__anaD = 0; }
    else { sph.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld); if (!fr.intersectsSphere(sph) || sph.center.distanceTo(ANA.V) > 85) return; o.userData.__anaD = Math.max(0, sph.center.distanceTo(ANA.V) - sph.radius); }
    list.push(o); });
  list.sort((a, b) => a.userData.__anaD - b.userData.__anaD); ANA.cands = list.length;
  list.slice(0, 340).forEach(o => { let ov;
    if (o.isInstancedMesh) { ov = new THREE.InstancedMesh(o.geometry, ANA.mat, o.count); ov.instanceMatrix = o.instanceMatrix; ov.frustumCulled = false; }
    else ov = new THREE.Mesh(o.geometry, ANA.mat);
    ov.matrixAutoUpdate = false; ov.matrix.copy(o.matrixWorld); ov.matrixWorld.copy(o.matrixWorld); ov.userData.__ana = true; ov.userData.__single = true; ov.userData.__nofreeze = true; ov.renderOrder = 3; ov.castShadow = false; ov.receiveShadow = false; scene.add(ov); ANA.overlays++; });
  ANA.ready = true;
}
const anaSecret = secret('anamorph', () => { toast('FROM HERE IT CLOSES. TWENTY PIECES OF PAINT ON TWENTY UNRELATED THINGS, AND FROM ONE SPOT THEY ARE ONE EYE LOOKING BACK AT YOU.', 'blue'); });
window.__FRAMES.push(dt => { try { if (!ANA.mat) return; ANA.t = (ANA.t || 0) + dt;
  if (!ANA.ready && ANA.t > 14 && window.__BATCH && (BATCH.t || 0) > 13) anaBuild();
  if (!ANA.ready) return; ANA.U.uOn.value = Math.min(1, ANA.U.uOn.value + dt * 0.5);
  const d = Math.hypot(P.x - ANA.V.x, P.z - ANA.V.z); const st = d < 0.7; if (st && !ANA.stand) { const f = new THREE.Vector3(); camera.getWorldDirection(f); const to = ANA.T.clone().sub(camera.position).normalize(); if (f.dot(to) > 0.93) { ANA.stand = true; anaSecret(); } } if (d > 2) ANA.stand = false;
} catch (e) { if (!ANA.err) { ANA.err = e; console.warn('v253 anamorph', e); } } });
