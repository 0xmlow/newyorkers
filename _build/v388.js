/* ================================================================
   v388 ILLUSION: THE INFINITE BARBERSHOP (2026-11-24)
   Look in N3W CUTS' window: three cobalt leather chairs face three mirrors, a 6529 card framed over each station,
   white tile, a checker floor, and the side walls are mirrors too, so the shop runs away left and right for ever,
   chair after chair, each reflection a little darker and greener, the cards reading backwards in every other one,
   one customer under a striped cape repeated to the horizon. There is no room behind the glass. One shader
   traces your view into a shop that is not there and folds it between two mirrors that are not there either, so
   the parallax is exact from every step along the boardwalk. The door glass looks into the same shop. The cards
   change on the hour. ?barber=0 off.
   ================================================================ */
(function infiniteBarbershop() {
  if (!window.__CUTS || !CUTS.ok) return;
  const [cx, g, cz] = CUTS.c, [nx, nz] = CUTS.n, [tx, tz] = CUTS.t, hw = CUTS.W / 2;
  const RW = CUTS.W - 0.5, DD = CUTS.D - 0.25, HC = 3.3, DC = DD - 1.35;
  const O = new THREE.Vector3(cx + nx * CUTS.D / 2, g, cz + nz * CUTS.D / 2);
  // the back wall: tile, counters, mirrors, sconces, frames (the cards themselves are drawn by the shader)
  const wv = document.createElement('canvas'); wv.width = 2048; wv.height = 1024; const c = wv.getContext('2d'); const wt = new THREE.CanvasTexture(wv); wt.encoding = THREE.sRGBEncoding; wt.anisotropy = ANISO;
  const PX = 2048 / RW, PY = 1024 / HC, X = u => (u + RW / 2) * PX, Y = y => (HC - y) * PY;
  if (c && c.fillRect && c.createLinearGradient && c.createRadialGradient && c.ellipse && c.strokeRect && c.beginPath) {
    const gr = c.createLinearGradient(0, 0, 0, 1024); gr.addColorStop(0, '#1a2440'); gr.addColorStop(1, '#22305a'); c.fillStyle = gr; c.fillRect(0, 0, 2048, 1024);
    c.strokeStyle = 'rgba(239,232,218,.05)'; c.lineWidth = 2; for (let x = 0; x < 2048; x += 22) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, Y(1.05)); c.stroke(); }
    c.fillStyle = '#e8e2d4'; c.fillRect(0, Y(1.02), 2048, 1024 - Y(1.02)); c.strokeStyle = 'rgba(120,112,100,.55)'; c.lineWidth = 2;
    for (let y = 0; y < 1.02; y += 0.075) { c.beginPath(); c.moveTo(0, Y(y)); c.lineTo(2048, Y(y)); c.stroke(); const row = Math.round(y / 0.075); for (let u = -RW / 2 + (row % 2) * 0.075; u < RW / 2; u += 0.15) { c.beginPath(); c.moveTo(X(u), Y(y)); c.lineTo(X(u), Y(y + 0.075)); c.stroke(); } }
    c.fillStyle = '#121a30'; c.fillRect(0, Y(1.1), 2048, Y(1.02) - Y(1.1)); c.fillStyle = '#0f1526'; c.fillRect(0, Y(HC), 2048, Y(3.15) - Y(HC));
    [-2.2, 0, 2.2].forEach(u => {
      c.fillStyle = '#4a2f1e'; c.fillRect(X(u - 0.78), Y(0.9), 1.56 * PX, 0.9 * PY); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 3; c.strokeRect(X(u - 0.74), Y(0.86), 0.72 * PX, 0.78 * PY); c.strokeRect(X(u + 0.02), Y(0.86), 0.72 * PX, 0.78 * PY);
      const mg = c.createLinearGradient(0, Y(1.0), 0, Y(0.9)); mg.addColorStop(0, '#f4f1ea'); mg.addColorStop(1, '#b9b4aa'); c.fillStyle = mg; c.fillRect(X(u - 0.82), Y(1.0), 1.64 * PX, 0.1 * PY);
      // the mirror: gold frame, a dark glass with a soft warm reflection
      c.fillStyle = '#b8913e'; c.fillRect(X(u - 0.7), Y(2.34), 1.4 * PX, 1.22 * PY); const gl = c.createLinearGradient(X(u - 0.64), Y(2.28), X(u + 0.64), Y(1.18)); gl.addColorStop(0, '#2b3a44'); gl.addColorStop(0.45, '#4a5d63'); gl.addColorStop(0.55, '#5c6f72'); gl.addColorStop(1, '#1e2a31');
      c.fillStyle = gl; c.fillRect(X(u - 0.64), Y(2.28), 1.28 * PX, 1.1 * PY); c.fillStyle = 'rgba(255,214,150,.18)'; c.beginPath(); c.ellipse(X(u), Y(1.9), 0.3 * PX, 0.22 * PY, 0, 0, PI * 2); c.fill();
      // things on the counter: a cobalt jar of combs, a spray bottle, clippers
      c.fillStyle = 'rgba(41,98,255,.85)'; c.fillRect(X(u - 0.55), Y(1.22), 0.12 * PX, 0.22 * PY); c.fillStyle = '#0d0d0d'; for (let i = 0; i < 4; i++) c.fillRect(X(u - 0.53 + i * 0.025), Y(1.3), 6, 0.12 * PY);
      c.fillStyle = '#c94040'; c.fillRect(X(u + 0.42), Y(1.2), 0.06 * PX, 0.2 * PY); c.fillStyle = '#e9e9e9'; c.fillRect(X(u + 0.43), Y(1.27), 0.04 * PX, 0.07 * PY); c.fillStyle = '#222'; c.fillRect(X(u + 0.15), Y(1.04), 0.16 * PX, 0.04 * PY);
      // sconces and the gold frame for the card above
      [-0.86, 0.86].forEach(s => { const sg = c.createRadialGradient(X(u + s), Y(1.95), 2, X(u + s), Y(1.95), 0.22 * PX); sg.addColorStop(0, 'rgba(255,236,200,1)'); sg.addColorStop(0.25, 'rgba(255,210,150,.55)'); sg.addColorStop(1, 'rgba(255,200,140,0)'); c.fillStyle = sg; c.fillRect(X(u + s) - 0.25 * PX, Y(2.2), 0.5 * PX, 0.5 * PY); });
      c.fillStyle = '#b8913e'; c.fillRect(X(u - 0.25), Y(3.06), 0.5 * PX, 0.62 * PY); c.fillStyle = '#0d0d0d'; c.fillRect(X(u - 0.21), Y(3.02), 0.42 * PX, 0.54 * PY);
    });
    c.fillStyle = '#efe8da'; c.textAlign = 'center'; c.font = '900 44px "Archivo Black",Impact,sans-serif'; c.fillText('N3W CUTS', X(-1.1), Y(3.2)); c.fillText('N3W CUTS', X(1.1), Y(3.2));
  }
  // the chairs from behind: an empty one, and one with a customer under a cape
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 500; const k = cv.getContext('2d'); const ctex = new THREE.CanvasTexture(cv); ctex.encoding = THREE.sRGBEncoding;
  const CW = 0.9, CH = 1.75, cX = (o, u) => o + (u / CW + 0.5) * 256, cY = y => (CH - y) / CH * 500;
  const chair = (o, cape) => { if (!k || !k.fillRect || !k.createLinearGradient || !k.ellipse || !k.clip || !k.beginPath) return;
    const chromeG = k.createLinearGradient(cX(o, -0.3), 0, cX(o, 0.3), 0); chromeG.addColorStop(0, '#6d7074'); chromeG.addColorStop(0.4, '#f2f2f2'); chromeG.addColorStop(0.6, '#c9cbce'); chromeG.addColorStop(1, '#55585c');
    k.fillStyle = chromeG; k.beginPath(); k.ellipse(cX(o, 0), cY(0.04), 0.3 * 256 / CW, 0.035 * 500 / CH, 0, 0, PI * 2); k.fill(); k.fillRect(cX(o, -0.06), cY(0.42), 0.12 * 256 / CW, 0.38 * 500 / CH);
    k.fillStyle = '#16181c'; k.fillRect(cX(o, -0.36), cY(0.52), 0.72 * 256 / CW, 0.1 * 500 / CH);
    k.fillStyle = chromeG; k.fillRect(cX(o, -0.42), cY(0.68), 0.84 * 256 / CW, 0.035 * 500 / CH);
    if (!cape) { const lg = k.createLinearGradient(cX(o, -0.28), 0, cX(o, 0.28), 0); lg.addColorStop(0, '#1b3a8a'); lg.addColorStop(0.5, '#2f5fd0'); lg.addColorStop(1, '#183277'); k.fillStyle = lg;
      k.beginPath(); k.roundRect ? k.roundRect(cX(o, -0.28), cY(1.22), 0.56 * 256 / CW, 0.68 * 500 / CH, 18) : k.rect(cX(o, -0.28), cY(1.22), 0.56 * 256 / CW, 0.68 * 500 / CH); k.fill();
      k.strokeStyle = 'rgba(8,16,40,.45)'; k.lineWidth = 2; for (let i = -3; i <= 3; i++) { k.beginPath(); k.moveTo(cX(o, i * 0.09 - 0.2), cY(1.2)); k.lineTo(cX(o, i * 0.09 + 0.2), cY(0.56)); k.stroke(); k.beginPath(); k.moveTo(cX(o, i * 0.09 + 0.2), cY(1.2)); k.lineTo(cX(o, i * 0.09 - 0.2), cY(0.56)); k.stroke(); }
      k.fillStyle = chromeG; k.fillRect(cX(o, -0.02), cY(1.3), 0.04 * 256 / CW, 0.08 * 500 / CH); k.fillStyle = '#2a50b8'; k.fillRect(cX(o, -0.14), cY(1.42), 0.28 * 256 / CW, 0.13 * 500 / CH); }
    else { k.fillStyle = '#efe8da'; k.beginPath(); k.moveTo(cX(o, -0.1), cY(1.36)); k.lineTo(cX(o, 0.1), cY(1.36)); k.lineTo(cX(o, 0.4), cY(0.5)); k.lineTo(cX(o, -0.4), cY(0.5)); k.closePath(); k.fill();
      k.save(); k.clip(); k.fillStyle = '#16233f'; for (let i = -6; i < 7; i++) k.fillRect(cX(o, i * 0.07), 0, 0.03 * 256 / CW, 500); k.restore();
      k.fillStyle = '#6b4a35'; k.fillRect(cX(o, -0.05), cY(1.44), 0.1 * 256 / CW, 0.09 * 500 / CH);
      k.fillStyle = '#7a553c'; k.beginPath(); k.ellipse(cX(o, 0), cY(1.56), 0.1 * 256 / CW, 0.13 * 500 / CH, 0, 0, PI * 2); k.fill();
      k.fillStyle = '#121212'; k.beginPath(); k.ellipse(cX(o, 0), cY(1.62), 0.1 * 256 / CW, 0.09 * 500 / CH, 0, PI, PI * 2); k.fill(); k.fillRect(cX(o, -0.1), cY(1.62), 0.2 * 256 / CW, 0.04 * 500 / CH);
      k.fillStyle = 'rgba(18,18,18,.5)'; k.fillRect(cX(o, -0.098), cY(1.58), 0.196 * 256 / CW, 0.03 * 500 / CH); }
  };
  chair(0, false); chair(256, true);
  const all = CARDS.filter(c => c.uv && c.uv[0] === 0); const U = [0, 1, 2].map(() => new THREE.Vector4());
  const pick = hr => [0, 1, 2].forEach(i => { const cd = all[(hr * 7 + i * 31 + 3) % all.length], u = cd.uv; U[i].set(u[1], 1 - u[4], u[3], 1 - u[2]); }); pick(new Date().getHours());
  const mat = new THREE.ShaderMaterial({ uniforms: { uO: { value: O }, uN: { value: new THREE.Vector3(nx, 0, nz) }, uT: { value: new THREE.Vector3(tx, 0, tz) }, uRW: { value: RW }, uD: { value: DD }, uH: { value: HC }, uDC: { value: DC }, uWall: { value: wt }, uChair: { value: ctex }, uAt: { value: ATL[0] }, uC: { value: U }, uL: { value: 1 } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform vec3 uO, uN, uT; uniform float uRW, uD, uH, uDC, uL; uniform sampler2D uWall, uChair, uAt; uniform vec4 uC[3]; varying vec3 vW;
      float fold(float u){ float m = mod(u + 0.5 * uRW, 2.0 * uRW); return (m < uRW ? m : 2.0 * uRW - m) - 0.5 * uRW; }
      float refl(float u){ return floor((u + 0.5 * uRW) / uRW); }
      void main(){ vec3 rd = normalize(vW - cameraPosition); float rdd = dot(rd, -uN); if (rdd <= 0.001) discard;
        vec3 o = vW - uO; float u0 = dot(o, uT), d0 = dot(o, -uN), y0 = o.y, ru = dot(rd, uT), ry = rd.y;
        float tb = (uD - d0) / rdd; float ty = ry > 0.0 ? (uH - y0) / ry : -y0 / min(ry, -1e-5); float t = min(tb, ty);
        vec3 col = vec3(0.0); float k = 0.0; bool done = false;
        float tc = (uDC - d0) / rdd;
        if (tc < t) { float uc = u0 + ru * tc, yc = y0 + ry * tc; float uf = fold(uc); float idx = floor((uf + 1.1) / 2.2); float lu = uf - idx * 2.2;
          vec2 sp = vec2(lu / 0.9 + 0.5, yc / 1.75);
          if (sp.x > 0.0 && sp.x < 1.0 && sp.y > 0.0 && sp.y < 1.0) { vec4 s = texture2D(uChair, vec2((sp.x + (idx == 0.0 ? 1.0 : 0.0)) * 0.5, sp.y)); if (s.a > 0.5) { col = s.rgb; k = refl(uc); done = true; t = tc; } } }
        if (!done) {
          if (tb < ty) { float uh = u0 + ru * tb, y = y0 + ry * tb; float uf = fold(uh); k = refl(uh); col = texture2D(uWall, vec2(uf / uRW + 0.5, y / uH)).rgb;
            float idx = floor((uf + 1.1) / 2.2); float lu = uf - idx * 2.2; vec2 pc = vec2((lu + 0.19) / 0.38, (y - 2.47) / 0.5);
            if (pc.x > 0.0 && pc.x < 1.0 && pc.y > 0.0 && pc.y < 1.0) { vec4 cu = idx < 0.0 ? uC[0] : idx > 0.0 ? uC[2] : uC[1]; col = texture2D(uAt, vec2(mix(cu.x, cu.z, pc.x), mix(cu.y, cu.w, pc.y))).rgb; } }
          else { float uh = u0 + ru * t, dh = d0 + rdd * t; float uf = fold(uh); k = refl(uh);
            if (ry < 0.0) { float ch = mod(floor((uf + 10.0) / 0.35) + floor(dh / 0.35), 2.0); col = mix(vec3(0.07, 0.07, 0.08), vec3(0.86, 0.84, 0.79), ch); col *= 0.75 + 0.25 * smoothstep(uD, 0.5, dh); }
            else { col = vec3(0.09, 0.1, 0.13); vec2 q = vec2(fract((uf + 10.0) / 2.2) - 0.5, dh - 2.2); float r = length(q * vec2(2.2, 1.0)); col += vec3(1.0, 0.86, 0.62) * smoothstep(0.16, 0.1, r); col += vec3(1.0, 0.8, 0.55) * 0.12 * smoothstep(1.0, 0.0, r); } } }
        float a = abs(k); col *= pow(0.8, a) * (0.85 + 0.15 * exp(-t * 0.1)); col = mix(col, col * vec3(0.82, 0.98, 0.9), min(a, 1.0));
        float fr = pow(1.0 - rdd, 3.0); col = mix(col * uL, vec3(0.55, 0.62, 0.7), fr * 0.5 + 0.04);
        gl_FragColor = vec4(col, 1.0); }` });
  const pane = (u, w, y0, y1) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, y1 - y0), mat); m.position.set(cx + nx * (CUTS.D / 2 + 0.03) + tx * u, g + (y0 + y1) / 2, cz + nz * (CUTS.D / 2 + 0.03) + tz * u); m.rotation.y = CUTS.ry; scene.add(m); return m; };
  CUTS.pane = pane(CUTS.win.u, CUTS.win.w, CUTS.win.y0, CUTS.win.y1); pane(CUTS.door.u, CUTS.door.w, 1.32, CUTS.door.y1); pane(CUTS.door.u, CUTS.door.w, CUTS.door.y0 + 0.12, 1.18);
  CUTS.mat = mat; CUTS.pick = pick; CUTS.hr = new Date().getHours(); CUTS.inf = true;
})();
window.__FRAMES.push(() => { try { if (!CUTS.inf) return; const h = new Date().getHours(); if (h !== CUTS.hr) { CUTS.hr = h; CUTS.pick(h); } CUTS.mat.uniforms.uL.value = 0.82 + 0.25 * Math.min(1, (L.lamps || 0) * 1.3); } catch (e) { } });
