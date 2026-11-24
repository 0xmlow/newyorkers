/* ================================================================
   v309 ILLUSION: THE DOORN TO NOWHERE (2026-11-24)
   A freestanding doorframe stands open by the river's south spoke, nothing behind it but the lawn. Look through it
   from the front and a corridor runs away for ever, its walls hung with 6529 cards, an Open Eye Flower at the end
   that never gets closer. Walk round the back and there is only a door frame on the grass. One shader traces your
   view into a corridor that is not there. ?door=0 off.
   ================================================================ */
const DOORN = {};
window.__DOORN = DOORN;
(function doorToNowhere() {
  if (!LOOK.on || /door=0/.test(location.search)) return;
  const X = -4.6, Z = -44.5, g = ground(X, Z), ry = PI / 2, W = 1.3, H = 2.4;   // faces +x, toward the spoke
  const n = new THREE.Vector3(Math.sin(ry), 0, Math.cos(ry)), u = new THREE.Vector3(Math.cos(ry), 0, -Math.sin(ry));
  const all = CARDS.filter(c => c.uv); const pick = (i) => all[(i * 37 + 11) % all.length];
  const atl = ATL[0]; // cards on atlas 0 only, so one texture serves the whole corridor
  const cards0 = all.filter(c => c.uv[0] === 0); const U4 = []; for (let i = 0; i < 16; i++) { const c = cards0[(i * 13 + 5) % cards0.length]; U4.push(new THREE.Vector4(c.uv[1], 1 - c.uv[4], c.uv[3], 1 - c.uv[2])); }
  const mat = new THREE.ShaderMaterial({ uniforms: { uO: { value: new THREE.Vector3(X, g, Z) }, uN: { value: n }, uU: { value: u }, uW: { value: W }, uH: { value: H }, uAt: { value: atl }, uC: { value: U4 }, uFl: { value: tex('assets/iv_flower.webp') } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform vec3 uO, uN, uU; uniform float uW, uH; uniform sampler2D uAt, uFl; uniform vec4 uC[16]; varying vec3 vW;
      void main(){ vec3 rd = normalize(vW - cameraPosition); float dz = dot(rd, -uN); if (dz <= 0.001) discard;
        vec3 o = vW - uO; float ox = dot(o, uU), oy = o.y, ru = dot(rd, uU), ry2 = rd.y;
        // hit the side walls (|x| = W/2) or floor/ceiling (y = 0 / H), whichever is first
        float tx = ru > 0.0 ? (uW * 0.5 - ox) / ru : (-uW * 0.5 - ox) / min(ru, -1e-5); float ty = ry2 > 0.0 ? (uH - oy) / ry2 : (0.0 - oy) / min(ry2, -1e-5); float t = min(tx, ty); float depth = t * dz;
        vec3 col; float fog = exp(-depth * 0.06);
        if (tx < ty) { float y = oy + ry2 * t; float seg = floor(depth / 2.2); float f = fract(depth / 2.2); int ci = int(mod(seg + (ru > 0.0 ? 7.0 : 0.0), 16.0));
          vec4 cu = uC[0]; for (int i = 0; i < 16; i++) if (i == ci) cu = uC[i];
          vec2 pu = vec2((f - 0.2) / 0.6, (y - 0.7) / 1.1); col = vec3(0.09, 0.12, 0.22);
          if (pu.x > 0.0 && pu.x < 1.0 && pu.y > 0.0 && pu.y < 1.0) col = texture2D(uAt, vec2(mix(cu.x, cu.z, pu.x), mix(cu.y, cu.w, pu.y))).rgb; else if (pu.x > -0.04 && pu.x < 1.04 && pu.y > -0.04 && pu.y < 1.04) col = vec3(0.55, 0.42, 0.2); }
        else { float x = ox + ru * t; col = ty > 0.0 && ry2 < 0.0 ? mix(vec3(0.14, 0.11, 0.09), vec3(0.2, 0.16, 0.12), step(0.5, fract(depth * 0.8 + step(0.0, x) * 0.5))) : vec3(0.06, 0.08, 0.14); if (ry2 > 0.0 && fract(depth / 2.2) < 0.08) col = vec3(1.0, 0.92, 0.75); }
        vec3 end = vec3(0.04, 0.06, 0.14); vec2 ep = vec2(ox + ru * 200.0, oy + ry2 * 200.0); vec4 fl = texture2D(uFl, clamp(vec2(ox / uW + 0.5, oy / uH), 0.0, 1.0));
        col = mix(mix(end, fl.rgb, fl.a * 0.9), col, fog);
        gl_FragColor = vec4(col, 1.0); }` });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat); m.position.set(X, g + H / 2, Z); m.rotation.y = ry; scene.add(m); DOORN.mesh = m;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ color: 0xefe8da, roughness: 0.6, transparent: true, opacity: 0.0 })); back.position.set(X, g + H / 2, Z); back.rotation.y = ry + PI; scene.add(back);
  const fr = (lx, y, w, h) => { facPut('white', X + u.x * lx, g + y, Z + u.z * lx, w, h, 0.18, ry); }; fr(-W / 2 - 0.09, H / 2, 0.18, H + 0.18); fr(W / 2 + 0.09, H / 2, 0.18, H + 0.18); fr(0, H + 0.09, W + 0.36, 0.18);
  facPut('stoneD', X, g + 0.03, Z, 0.5, 0.06, W + 0.5, ry); facFlush(); boxWalls(X, Z, 0.2, W + 0.4, ry, -5, g + 2.6);
  DOORN.ok = true; DOORN.P = [X, g, Z];
})();
