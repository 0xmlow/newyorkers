/* ================================================================
   v463 THE MEMES IN THE WINDOWS (2026-11-24)
   The rooms behind the island's windows (v408) each had a dark blue rectangle on the back wall, a picture with
   nothing in it. They now have a 6529 card on the wall: two out of three rooms hang one, chosen from the first
   atlas of the collection by the room's own position, in its real proportions, in a thin black frame, lamplit at
   night like everything else in the room. Walk down any street and look in: the island's neighbours collect.
   ?roomcards=0 off.
   ================================================================ */
(function roomCards() {
  if (!window.__ROOMS || !ROOMS.n || /roomcards=0/.test(location.search) || typeof ATL === 'undefined' || !ATL[0]) return;
  const list = CARDS.filter(c => c.uv && c.uv[0] === 0).slice(0, 32); if (list.length < 4) return;
  const uvs = []; for (let i = 0; i < 32; i++) { const u = list[i % list.length].uv; uvs.push(new THREE.Vector4(u[1], 1 - u[4], u[3], 1 - u[2])); }
  const asp = []; for (let i = 0; i < 32; i++) asp.push(list[i % list.length].uv[5] || 0.75);
  const U = { uRoomAtl: { value: ATL[0] }, uRoomUV: { value: uvs }, uRoomAsp: { value: asp } }; ROOMS.cardU = U;
  const OLD = 'float pic = step(abs(h.x - (s2 - 0.5) * hw), 0.35) * step(abs(h.y - 0.35), 0.28); c = mix(c, vec3(0.15, 0.2, 0.4) * (0.6 + s3), pic * step(0.35, s2));';
  const NEW = `{ int ci = int(floor(fract(s2 * 7.31 + s1 * 3.17) * 32.0)); vec4 cr = uRoomUV[ci]; float ca = uRoomAsp[ci]; float ph = 0.66, pw = ph * ca; vec2 pc = vec2((s2 - 0.5) * hw * 0.8, 0.32);
          vec2 q = (h.xy - pc) / vec2(pw, ph) + 0.5; float inP = step(0.0, q.x) * step(q.x, 1.0) * step(0.0, q.y) * step(q.y, 1.0); vec2 qf = (h.xy - pc) / vec2(pw + 0.06, ph + 0.06) + 0.5; float inF = step(0.0, qf.x) * step(qf.x, 1.0) * step(0.0, qf.y) * step(qf.y, 1.0);
          float show = step(0.33, s2); c = mix(c, vec3(0.02), inF * show); vec3 art = pow(texture2D(uRoomAtl, vec2(mix(cr.x, cr.z, q.x), mix(cr.y, cr.w, q.y))).rgb, vec3(2.2)); c = mix(c, art * 1.15, inP * show); }`;
  [FACM.glass, FACM.lit].forEach(m => { if (!m) return; const prev = m.onBeforeCompile, pk = m.customProgramCacheKey ? m.customProgramCacheKey.bind(m) : null;
    m.onBeforeCompile = (sh, r) => { if (prev) prev(sh, r); Object.assign(sh.uniforms, U); if (sh.fragmentShader.indexOf(OLD) < 0) return;
      sh.fragmentShader = sh.fragmentShader.replace('uniform float uRoomNight, uRoomT;', 'uniform float uRoomNight, uRoomT; uniform sampler2D uRoomAtl; uniform vec4 uRoomUV[32]; uniform float uRoomAsp[32];').replace(OLD, NEW); };
    m.customProgramCacheKey = () => (pk ? pk() : '') + '|roomcards463'; m.needsUpdate = true; });
})();
