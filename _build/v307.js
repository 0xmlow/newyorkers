/* ================================================================
   v307 ILLUSION: THE LENTICULAR (2026-11-24)
   A four metre board on the east lawn printed like a lenticular postcard: from the west you see one 6529 card, walk
   east past it and it flips to another, with the thin vertical lenticule lines and the flicker in between. One
   shader picks, per vertical stripe, which of two cards to show from the angle you see that stripe at. The pair
   changes every hour through the collection. ?lenticular=0 off.
   ================================================================ */
const LENT = {};
window.__LENT = LENT;
(function lenticular() {
  if (!LOOK.on || /lenticular=0/.test(location.search)) return;
  const X = 17.5, Z = -9.6, g = ground(X, Z), W = 4.2, H = 3.0;
  const pickPair = () => { const all = CARDS.filter(c => c.uv && c.uv[5] > 1.1 && c.uv[5] < 1.9); const k = Math.floor(Date.now() / 3600000) % Math.max(1, all.length - 1); return [all[k], all[(k * 7 + 13) % all.length]]; };
  const [A, B] = pickPair(); LENT.pair = [A.n, B.n];
  const uvA = new THREE.Vector4(A.uv[1], 1 - A.uv[4], A.uv[3], 1 - A.uv[2]), uvB = new THREE.Vector4(B.uv[1], 1 - B.uv[4], B.uv[3], 1 - B.uv[2]);
  const mat = new THREE.ShaderMaterial({ uniforms: { uA: { value: ATL[A.uv[0]] }, uB: { value: ATL[B.uv[0]] }, uUA: { value: uvA }, uUB: { value: uvB }, uN: { value: new THREE.Vector3(0, 0, 1) }, uT: { value: new THREE.Vector3(1, 0, 0) } },
    vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform sampler2D uA, uB; uniform vec4 uUA, uUB; uniform vec3 uN, uT; varying vec2 vUv; varying vec3 vW;
      void main(){ vec3 v = normalize(cameraPosition - vW); float s = dot(v, uT) / max(0.2, dot(v, uN));
        float lens = fract(vUv.x * 140.0); float k = smoothstep(-0.16, 0.16, s + (lens - 0.5) * 0.18);
        vec3 a = texture2D(uA, vec2(mix(uUA.x, uUA.z, vUv.x), mix(uUA.y, uUA.w, vUv.y))).rgb, b = texture2D(uB, vec2(mix(uUB.x, uUB.z, vUv.x), mix(uUB.y, uUB.w, vUv.y))).rgb;
        vec3 c = mix(a, b, k); float ridge = 0.9 + 0.1 * smoothstep(0.0, 0.5, abs(lens - 0.5)); c *= ridge; c += vec3(0.06) * pow(1.0 - abs(lens - 0.5) * 2.0, 8.0);
        gl_FragColor = vec4(c, 1.0); }` });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat); m.position.set(X, g + 1.1 + H / 2, Z + 0.06); scene.add(m); LENT.mesh = m;
  FACM.iron = FACM.iron || new THREE.MeshStandardMaterial({ color: 0x122039, roughness: 0.55, metalness: 0.5 });
  facPut('iron', X, g + 1.1 + H / 2, Z - 0.02, W + 0.24, H + 0.24, 0.1, 0); [-1, 1].forEach(s => { facPut('iron', X + s * (W / 2 - 0.3), g + 0.6, Z - 0.02, 0.12, 1.2, 0.12, 0); post(X + s * (W / 2 - 0.3), Z, 0.15, -5, 2); }); facFlush();
  LENT.ok = true; LENT.P = [X, g, Z];
})();
