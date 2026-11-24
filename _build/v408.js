/* ================================================================
   v408 THE LOOK: ROOMS BEHIND THE WINDOWS (2026-11-24)
   Every window on the island's buildings was a flat dark pane with a reflection. Now each has a room behind it:
   interior mapping, the trick game engines use for city windows. The shader traces your view through the glass
   into a box three metres deep (back wall, side walls, floor and ceiling) and paints what it meets, so the room
   shifts correctly as you walk past and every window is a different room: its wall colour, its floor, the height
   its blind is drawn to, all from the window's own position. By day the rooms sit dim behind the reflection; at
   night the lit windows (the ones v173 lights) show warm lamplit rooms, and a few glow blue with a television.
   Needs WebGL 2. ?rooms=0 off.
   ================================================================ */
const ROOMS = { n: 0 };
window.__ROOMS = ROOMS;
(function roomsBehindWindows() {
  if (!FAC_ON || /rooms=0/.test(location.search)) return; try { if (!renderer.capabilities.isWebGL2) return; } catch (e) { return; }
  const VS_PARS = 'varying vec3 vRP; varying vec3 vRD; varying vec3 vRS; varying vec3 vRW;';
  const VS = `{ mat4 rIM = mat4(1.0);
    #ifdef USE_INSTANCING
      rIM = instanceMatrix;
    #endif
    mat4 rM = modelMatrix * rIM; vec3 rs = vec3(length(rM[0].xyz), length(rM[1].xyz), length(rM[2].xyz));
    vec3 cl = (inverse(rM) * vec4(cameraPosition, 1.0)).xyz; vRP = position * rs; vRD = vRP - cl * rs; vRS = rs; vRW = rM[3].xyz; }`;
  const FS_PARS = 'varying vec3 vRP; varying vec3 vRD; varying vec3 vRS; varying vec3 vRW; uniform float uRoomNight; float rFront; vec3 rLamp;\n float rH(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }';
  const FS = `{ rFront = step(vRS.z * 0.4, vRP.z) * step(0.25, min(vRS.x, vRS.y)); rLamp = vec3(0.0);
    if (rFront > 0.5) { vec3 d = normalize(vRD); vec3 p = vRP; float s1 = rH(floor(vRW * 2.0)), s2 = rH(floor(vRW * 2.0) + 7.1), s3 = rH(floor(vRW * 2.0) + 3.7);
      float hw = vRS.x * 0.5 + 0.9, fl = -vRS.y * 0.5 - 0.95, ce = vRS.y * 0.5 + 0.55, back = vRP.z - 3.2; d.z = min(d.z, -1e-4);
      float tx = ((d.x > 0.0 ? hw : -hw) - p.x) / (abs(d.x) < 1e-4 ? 1e-4 : d.x); float ty = ((d.y > 0.0 ? ce : fl) - p.y) / (abs(d.y) < 1e-4 ? 1e-4 : d.y); float tz = (back - p.z) / d.z;
      float t = min(tx, min(ty, tz)); vec3 h = p + d * t;
      vec3 wall = mix(mix(vec3(0.62, 0.55, 0.45), vec3(0.32, 0.38, 0.48), step(0.5, s1)), vec3(0.55, 0.3, 0.26), step(0.82, s1));
      vec3 c;
      if (t == tz) { c = wall; float pic = step(abs(h.x - (s2 - 0.5) * hw), 0.35) * step(abs(h.y - 0.35), 0.28); c = mix(c, vec3(0.15, 0.2, 0.4) * (0.6 + s3), pic * step(0.35, s2)); }
      else if (t == tx) c = wall * 0.78;
      else if (d.y < 0.0) { c = mix(vec3(0.33, 0.22, 0.14), vec3(0.42, 0.3, 0.2), step(0.5, fract(h.z * 3.0 + h.x * 0.2))); if (s2 > 0.6) c = mix(c, vec3(0.5, 0.12, 0.12) * 0.8, step(abs(h.x), hw * 0.5) * step(abs(h.z - back - 1.4), 0.8)); }
      else { c = vec3(0.78, 0.76, 0.72); }
      float depthK = clamp(1.0 + (h.z - vRP.z) / 4.0, 0.35, 1.0); c *= depthK;
      float blind = 0.25 + s3 * 0.7; float by = (vRP.y / vRS.y) + 0.5; float isBlind = step(1.0 - blind * step(0.45, s3), by); c = mix(c, vec3(0.86, 0.83, 0.76) * 0.9, isBlind);
      vec2 lp = vec2(h.x, h.z - (back + 1.6)); float lampK = (t == ty && d.y > 0.0) ? smoothstep(0.7, 0.0, length(lp)) : 0.0;
      vec3 warm = vec3(1.0, 0.78, 0.5) * (0.55 + 0.45 * depthK) + vec3(1.0, 0.9, 0.7) * lampK; if (s2 < 0.12) warm = vec3(0.35, 0.5, 1.0) * (0.6 + 0.4 * depthK);
      rLamp = c * warm * mix(1.0, 0.5, isBlind) + vec3(1.0, 0.85, 0.6) * isBlind * 0.35;
      diffuseColor.rgb = c * 0.38; } }`;
  const patch = (m, key) => { if (!m || m.userData.rooms) return; m.userData.rooms = true; const prev = m.onBeforeCompile; const pk = m.customProgramCacheKey ? m.customProgramCacheKey.bind(m) : null;
    m.onBeforeCompile = (sh, r) => { if (prev) prev(sh, r); sh.uniforms.uRoomNight = ROOMS.u;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + VS_PARS).replace('#include <project_vertex>', '#include <project_vertex>\n' + VS);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + FS_PARS).replace('#include <color_fragment>', '#include <color_fragment>\n' + (key === 'brown' ? FS.replace('step(vRS.z * 0.4, vRP.z)', '1.0') : FS))
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n if (rFront > 0.5) totalEmissiveRadiance = rLamp * length(totalEmissiveRadiance) * 0.9;'); };
    m.customProgramCacheKey = () => (pk ? pk() : '') + '|rooms-' + key; m.metalness = Math.min(m.metalness, 0.12); m.roughness = 0.06; m.needsUpdate = true; ROOMS.n++; };
  ROOMS.u = { value: 0 }; ROOMS.patch = patch;
  patch(FACM.glass, 'glass'); patch(FACM.lit, 'lit');
  try { if (window.__BROWN && BROWN.wins) BROWN.wins.forEach(w => w && w.m && patch(w.m, 'brown')); } catch (e) { }
})();
