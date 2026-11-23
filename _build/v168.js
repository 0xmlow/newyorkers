/* ================================================================
   v168 THE LOOK: REFLECTIONS (2026-11-23)
   The harbour mirrors the island. A screen space reflection pass: for every pixel of open water it reflects the
   view ray off the surface (bent a little by the swell), marches it back across the depth the ambient occlusion
   pass already draws, and where it meets something (the pier, the Ferris wheel, the palms, the bus, the skyline,
   the lights at night) it lays that colour onto the water, strong at grazing angles and faint looking straight
   down (Fresnel), wobbling with the waves, fading where the ray leaves the screen. The sky part of the reflection
   stays the light probe's, so nothing is lost where the ray misses. Desktop only (it needs the depth pass);
   ?ssr=0 turns it off.
   ================================================================ */
const SSR = { pass: null, k: 0 };
window.__SSR = SSR;
function ssrSetup() {
  if (SSR.pass || !POST.comp || !AO.on || !AO.depth || !THREE.ShaderPass || /ssr=0/.test(location.search) || !LOOK.on) return;
  const pass = new THREE.ShaderPass({ uniforms: { tDiffuse: { value: null }, tDepth: { value: AO.depth.depthTexture }, uProj: { value: new THREE.Matrix4() }, uInvProj: { value: new THREE.Matrix4() }, uView: { value: new THREE.Matrix4() }, uInvView: { value: new THREE.Matrix4() }, uK: { value: 1 }, uT: { value: 0 }, uNight: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: [
      'uniform sampler2D tDiffuse, tDepth; uniform mat4 uProj, uInvProj, uView, uInvView; uniform float uK, uT, uNight; varying vec2 vUv;',
      'vec3 vpos(vec2 uv, float d){ vec4 v = uInvProj * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); return v.xyz / v.w; }',
      'float nz(vec2 p){ return sin(p.x * 0.9 + uT * 1.3) * 0.5 + sin(p.y * 1.3 - uT * 1.1) * 0.35 + sin((p.x + p.y) * 2.7 + uT * 2.1) * 0.15; }',
      'void main(){ vec4 c = texture2D(tDiffuse, vUv); if (uK < 0.01) { gl_FragColor = c; return; }',
      '  float d = texture2D(tDepth, vUv).x; vec3 ro = (uInvView * vec4(0.0, 0.0, 0.0, 1.0)).xyz; vec3 rdv = normalize(vpos(vUv, 1.0)); vec3 rd = normalize((uInvView * vec4(rdv, 0.0)).xyz); vec3 P;',
      '  if (d >= 0.99999) { if (rd.y > -0.002) { gl_FragColor = c; return; } float t = (0.0 - ro.y) / rd.y; P = ro + rd * t; }',
      '  else { P = (uInvView * vec4(vpos(vUv, d), 1.0)).xyz; }',
      '  float dist0 = length(P - ro); if (abs(P.y) > 0.025 + dist0 * 0.0004 || length(P.xz) < 96.0) { gl_FragColor = c; return; }',
      '  float dist = length(P - ro); vec2 w = vec2(nz(P.xz * 0.35), nz(P.zx * 0.41 + 3.0)) * 0.045 / (1.0 + dist * 0.004);',
      '  vec3 r = normalize(vec3(rd.x + w.x, -rd.y, rd.z + w.y)); vec3 q = P + r * 0.6; float st = 0.9 + dist * 0.004; vec3 hit = vec3(0.0); float found = 0.0; vec2 huv = vec2(0.0);',
      '  for (int i = 0; i < 56; i++) { q += r * st; st *= 1.075; vec4 cl = uProj * uView * vec4(q, 1.0); if (cl.w <= 0.0) break; vec2 uv = cl.xy / cl.w * 0.5 + 0.5; if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) break;',
      '    float sd = texture2D(tDepth, uv).x; if (sd >= 0.99999) continue; float zs = vpos(uv, sd).z, zr = (uView * vec4(q, 1.0)).z; if (zr < zs && zs - zr < 1.5 + st * 1.8) { found = 1.0; huv = uv; break; } }',
      '  if (found < 0.5) { gl_FragColor = c; return; }',
      '  vec2 e = min(huv, 1.0 - huv); float edge = smoothstep(0.0, 0.08, min(e.x, e.y)); float fres = 0.04 + 0.96 * pow(1.0 - max(0.0, -rd.y), 5.0); float far = 1.0 - smoothstep(380.0, 700.0, dist);',
      '  vec3 refl = texture2D(tDiffuse, huv).rgb; float k = clamp(fres * 1.15, 0.0, 0.92) * edge * far * uK; vec3 tint = mix(vec3(0.78, 0.86, 0.86), vec3(0.85, 0.9, 1.0), uNight);',
      '  gl_FragColor = vec4(mix(c.rgb, refl * tint, k), c.a); }'].join('\n') });
  const bi = POST.comp.passes.indexOf(POST.bloom); POST.comp.passes.splice(bi >= 0 ? bi : 1, 0, pass); SSR.pass = pass;
  const prevG = window.__GRADE; window.__GRADE = g => { if (prevG) prevG(g); try { const u = pass.uniforms; u.uProj.value.copy(camera.projectionMatrix); u.uInvProj.value.copy(camera.projectionMatrixInverse); u.uView.value.copy(camera.matrixWorldInverse); u.uInvView.value.copy(camera.matrixWorld); } catch (e) { } };
}
function ssrFrame(dt) { ssrSetup(); if (!SSR.pass) return; const u = SSR.pass.uniforms; u.uT.value += dt; u.uK.value = 1 - 0.6 * (WX.fog || 0); u.uNight.value = L.lamps || 0; u.tDepth.value = AO.depth.depthTexture; SSR.pass.enabled = AO.on; }
window.__FRAMES.push(dt => { try { ssrFrame(dt); } catch (e) { if (!SSR.err) { SSR.err = e; console.warn('v168 reflections', e); } } });
