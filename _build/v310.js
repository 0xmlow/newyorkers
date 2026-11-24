/* ================================================================
   v310 ILLUSION: THE MIRROR CYLINDER (2026-11-24)
   On a round table by the poet: a smeared ring of paint that looks like nothing, and standing in its middle a polished
   steel cylinder. Look into the cylinder and the smear is an Open Eye Flower, upright and whole (catoptric
   anamorphosis, the trick of seventeenth century cabinets). The table art is the eye flower warped into a ring by the
   inverse of the cylinder's reflection; the cylinder reflects a snapshot of its own surroundings. ?cylinder=0 off.
   ================================================================ */
const CYL = {};
window.__CYL = CYL;
(function mirrorCylinder() {
  if (!LOOK.on || /cylinder=0/.test(location.search) || !window.__POET) return;
  const X = POET.X + Math.cos(POET.ry) * 2.6, Z = POET.Z - Math.sin(POET.ry) * 2.6, g = ground(X, Z), R0 = 0.16, R1 = 0.62, TY = 0.78;
  // the warped ring: for each pixel of the table, which pixel of the flower would the mirror show there?
  const src = new Image(); const cv = document.createElement('canvas'); cv.width = cv.height = 512; const c = cv.getContext('2d'); const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding;
  src.onload = () => { try { const s = document.createElement('canvas'); s.width = s.height = 256; const sc = s.getContext('2d'); sc.drawImage(src, 0, 0, 256, 256); const sd = sc.getImageData(0, 0, 256, 256).data; const od = c.createImageData(512, 512);
      for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) { const dx = (x - 256) / 256, dy = (y - 256) / 256, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx); const k = (y * 512 + x) * 4;
        if (r < R0 / R1 || r > 1) { od.data[k] = 239; od.data[k + 1] = 232; od.data[k + 2] = 218; od.data[k + 3] = 255; continue; }
        const sx = Math.floor(((a / (PI * 2) + 1.25) % 1) * 255) , sy = Math.floor((1 - (r - R0 / R1) / (1 - R0 / R1)) * 255); const q = (sy * 256 + sx) * 4;
        const al = sd[q + 3] / 255; od.data[k] = sd[q] * al + 22 * (1 - al); od.data[k + 1] = sd[q + 1] * al + 35 * (1 - al); od.data[k + 2] = sd[q + 2] * al + 63 * (1 - al); od.data[k + 3] = 255; }
      c.putImageData(od, 0, 0); t.needsUpdate = true; } catch (e) { } };
  src.src = 'assets/iv_flower.webp';
  const top = new THREE.Mesh(new THREE.CircleGeometry(R1, 64), new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 })); top.rotation.x = -PI / 2; top.position.set(X, g + TY + 0.031, Z); scene.add(top);
  const tab = new THREE.Mesh(new THREE.CylinderGeometry(R1 + 0.03, R1 + 0.03, 0.06, 48), new THREE.MeshStandardMaterial({ color: 0x3b2a1e, roughness: 0.5 })); tab.position.set(X, g + TY, Z); scene.add(tab);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.22, TY, 16), new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.5, metalness: 0.6 })); leg.position.set(X, g + TY / 2, Z); scene.add(leg);
  const rt = new THREE.WebGLCubeRenderTarget(256, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter }); const cc = new THREE.CubeCamera(0.05, 60, rt); cc.position.set(X, g + TY + 0.25, Z); scene.add(cc); CYL.cc = cc;
  // the steel: reflect the view ray off the cylinder and read the table art exactly where it lands (local, not at infinity)
  const mm = new THREE.ShaderMaterial({ uniforms: { uArt: { value: t }, uC: { value: new THREE.Vector3(X, g + TY + 0.031, Z) }, uR1: { value: R1 }, uEnv: { value: rt.texture } },
    vertexShader: 'varying vec3 vW; varying vec3 vN; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform sampler2D uArt; uniform samplerCube uEnv; uniform vec3 uC; uniform float uR1; varying vec3 vW; varying vec3 vN;
      void main(){ vec3 I = normalize(vW - cameraPosition), N = normalize(vec3(vN.x, 0.0, vN.z)); vec3 R = reflect(I, N); vec3 col;
        if (R.y < -0.01) { float tt = (uC.y - vW.y) / R.y; vec3 h = vW + R * tt; vec2 d = (h.xz - uC.xz) / uR1; if (length(d) < 1.0) col = texture2D(uArt, vec2(d.x * 0.5 + 0.5, -d.y * 0.5 + 0.5)).rgb; else col = textureCube(uEnv, R).rgb; }
        else col = textureCube(uEnv, R).rgb;
        float fr = pow(1.0 - max(0.0, dot(-I, N)), 3.0); col = col * 0.92 + 0.08 * fr; gl_FragColor = vec4(col, 1.0); }` });
  const mir = new THREE.Mesh(new THREE.CylinderGeometry(R0, R0, 0.5, 64, 1, true), mm); mir.position.set(X, g + TY + 0.28, Z); scene.add(mir); CYL.mir = mir;
  const cap = new THREE.Mesh(new THREE.CircleGeometry(R0, 32), new THREE.MeshStandardMaterial({ color: 0xc4c8cc, metalness: 1, roughness: 0.2 })); cap.rotation.x = -PI / 2; cap.position.set(X, g + TY + 0.531, Z); scene.add(cap);
  post(X, Z, R1 + 0.1, -5, g + 1); CYL.ok = true; CYL.P = [X, g + TY, Z];
})();
window.__FRAMES.push(dt => { try { if (!CYL.cc || CYL.done) return; CYL.t = (CYL.t || 0) + dt; if (CYL.t < 8) return; CYL.mir.visible = false; CYL.cc.update(renderer, scene); CYL.mir.visible = true; CYL.done = true; } catch (e) { CYL.done = true; } });
