/* ================================================================
   v262 ILLUSION: THE CARD THAT STANDS UP (2026-11-23)
   3D street art, the chalk-on-the-pavement kind, with a 6529 card. Painted flat on the handball court's asphalt is a
   long distorted smear of NFT ADOPTION PATHWAY 2030 (card 24, by 6529). Stand on the painted eye at the back of the
   court and it rises: the card stands upright on the asphalt in front of you, two metres wide, casting a painted
   shadow. One shader on the court works out, for every point of the asphalt, where the line from your spot through
   that point would cross a card standing in the court, and paints that bit of card there.
   ?standup=0 turns it off.
   ================================================================ */
const STAND = {};
window.__STAND = STAND;
(function standUp() {
  if (!LOOK.on || /standup=0/.test(location.search) || !window.__HB2 || !HB2.court) return;
  const W = HB2.L2W, ry = WALLP.ry, g0 = ground(WALL_AT.x, WALL_AT.z) + 0.045;
  const [vx, vz] = W(0, 0.225 + 8.8), V = new THREE.Vector3(vx, g0 + 1.62, vz); STAND.V = V;
  const [qx, qz] = W(0, 0.225 + 5.7), Q = new THREE.Vector3(qx, g0, qz); STAND.Q = Q;
  const n = new THREE.Vector3(Math.sin(ry), 0, Math.cos(ry)), u = new THREE.Vector3(Math.cos(ry), 0, -Math.sin(ry));
  const I = byN[24] || CARDS[0], A = I.uv[0], h = 1.12, w = h * I.uv[5];
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6,
    uniforms: { uV: { value: V }, uQ: { value: Q }, uN: { value: n }, uU: { value: u }, uW: { value: w }, uH: { value: h }, uAt: { value: ATL[A] }, uUV: { value: new THREE.Vector4(I.uv[1], 1 - I.uv[4], I.uv[3], 1 - I.uv[2]) } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform vec3 uV, uQ, uN, uU; uniform float uW, uH; uniform sampler2D uAt; uniform vec4 uUV; varying vec3 vW;
      void main(){ vec3 d = vW - uV; float den = dot(d, uN); if (abs(den) < 1e-4) discard; float t = dot(uQ - uV, uN) / den; if (t <= 0.0 || t >= 1.0) discard;
        vec3 x = uV + d * t; float s = dot(x - uQ, uU) / uW + 0.5, v = (x.y - uQ.y) / uH;
        if (s < 0.0 || s > 1.0 || v < 0.0 || v > 1.0) { // the painted shadow, cast away from the sun side
          vec3 sh = vW - uQ; float sa = dot(sh, uU) / uW + 0.5, sb = dot(sh, uN) / (uH * 0.55);
          if (sa > 0.05 && sa < 0.95 && sb < -0.05 && sb > -1.0) { gl_FragColor = vec4(0.0, 0.0, 0.0, 0.35 * (1.0 + sb)); return; } discard; }
        vec2 uv = vec2(mix(uUV.x, uUV.z, s), mix(uUV.y, uUV.w, v)); vec4 c = texture2D(uAt, uv);
        float edge = step(0.012, s) * step(s, 0.988) * step(0.008, v) * step(v, 0.992); vec3 col = mix(vec3(0.94, 0.92, 0.86), c.rgb, edge);
        gl_FragColor = vec4(col * 0.92, 1.0); }` });
  // the paint lies on the court and runs past it toward the wall (it has to: the smear is long)
  const pg = new THREE.PlaneGeometry(7.4, 9.2); const m = new THREE.Mesh(pg, mat); m.rotation.order = 'YXZ'; m.rotation.set(-PI / 2, ry, 0); const [cx, cz] = W(0, 0.225 + 4.7); m.position.set(cx, g0 + 0.004, cz); m.renderOrder = 4; m.userData.__single = true; scene.add(m); STAND.mesh = m;
  // the spot: a painted eye at the gate
  const sp = new THREE.Mesh(new THREE.CircleGeometry(0.42, 32), new THREE.MeshBasicMaterial({ map: tex('assets/iv_flower.webp'), transparent: true, alphaTest: 0.4, polygonOffset: true, polygonOffsetFactor: -7, polygonOffsetUnits: -7 })); sp.rotation.x = -PI / 2; sp.position.set(vx, ground(vx, vz) + 0.05, vz); scene.add(sp);
  STAND.ok = true;
})();
const standSecret = secret('standup', () => { toast('FROM HERE THE CARD STANDS UP OUT OF THE COURT. TAKE ONE STEP AND IT FALLS FLAT AGAIN. IT WAS ALWAYS PAINT.', 'blue'); });
window.__FRAMES.push(() => { try { if (!STAND.ok) return; const d = Math.hypot(P.x - STAND.V.x, P.z - STAND.V.z); if (d < 0.6 && !STAND.seen) { STAND.seen = true; standSecret(); } if (d > 2) STAND.seen = false; } catch (e) { } });
