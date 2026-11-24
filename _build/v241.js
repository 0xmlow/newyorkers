/* ================================================================
   v241 THE MEME RIVER (2026-11-23)
   The thing that ties the island together. A river of MLow's liquid contour lines is inlaid down the middle of
   every main walkway: round the promenade ring and in along the four spokes, all of it flowing toward THE FLOOR,
   the grid of 6529 Memes at the centre. Navy ground, contour lines in cobalt, cyan, bone and a little hot pink
   that bend and braid as they flow, and Open Eye Flowers drifting on the current, turning slowly, watching.
   From the ground it is a painted path; from the air it is one drawing that holds every zone in its loop. After
   dusk the lines glow. ?river=0 turns it off.
   ================================================================ */
const RIVER = { mat: null, t: 0 };
window.__RIVER = RIVER;
(function memeRiver() {
  if (!LOOK.on || /river=0/.test(location.search)) return;
  const PY = 0.665 + 0.012, P = [], U = [], I = []; let vi = 0;
  // a strip from a list of centre points: uv.x = metres along (s), uv.y = -1..1 across
  const strip = (pts, w, s0, dir) => { let s = s0; for (let i = 0; i < pts.length; i++) { const [x, z] = pts[i], [x2, z2] = pts[Math.min(pts.length - 1, i + 1)], [x1, z1] = pts[Math.max(0, i - 1)];
      let tx = x2 - x1, tz = z2 - z1; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l; const nx = -tz, nz = tx;
      if (i > 0) s += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]) * dir;
      P.push(x + nx * w / 2, PY, z + nz * w / 2, x - nx * w / 2, PY, z - nz * w / 2); U.push(s, 1, s, -1);
      if (i > 0) I.push(vi - 2, vi - 1, vi, vi - 1, vi + 1, vi); vi += 2; } };
  // the ring, flowing round
  { const pts = []; for (let i = 0; i <= 320; i++) { const a = i / 320 * PI * 2; pts.push([Math.cos(a) * 40, Math.sin(a) * 40]); } strip(pts, 2.4, 0, 1); }
  // the spokes, flowing inward (s decreasing toward the centre so the flow runs in)
  const spoke = (ax, az, bx, bz, w) => { const n = Math.max(2, Math.round(Math.hypot(bx - ax, bz - az) / 1.5)), pts = []; for (let i = 0; i <= n; i++) pts.push([ax + (bx - ax) * i / n, az + (bz - az) * i / n]); strip(pts, w, 0, -1); };
  spoke(0, 96, 0, 42.4, 2.2); spoke(0, 37.6, 0, 16.4, 2.0); spoke(0, -50, 0, -42.4, 2.0); spoke(0, -37.6, 0, -16.4, 2.0);
  spoke(53, 0, 42.4, 0, 2.0); spoke(37.6, 0, 16.4, 0, 2.0); spoke(-55.5, 0, -42.4, 0, 2.0); spoke(-37.6, 0, -16.4, 0, 2.0);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals();
  const flower = tex('assets/iv_flower.webp');
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.0, transparent: true, side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  mat.onBeforeCompile = sh => { sh.uniforms.uT = { value: 0 }; sh.uniforms.uNight = { value: 0 }; sh.uniforms.uFl = { value: flower }; RIVER.sh = sh;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vRv;').replace('#include <uv_vertex>', '#include <uv_vertex>\nvRv = uv;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec2 vRv; uniform float uT, uNight; uniform sampler2D uFl;
      float rh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float rn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(rh(i), rh(i + vec2(1, 0)), f.x), mix(rh(i + vec2(0, 1)), rh(i + vec2(1, 1)), f.x), f.y); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float s = vRv.x, t = vRv.y, fl = s - uT * 0.9;
        // a flow field: the across coordinate bent by slow noise, so the contours braid as they travel
        float bend = (rn(vec2(fl * 0.16, 1.3)) - 0.5) * 3.2 + (rn(vec2(fl * 0.5, 7.1)) - 0.5) * 0.9 + (rn(vec2(fl * 0.3, t * 1.5 + 4.0)) - 0.5) * 1.2;
        float f = t * 2.2 + bend + 0.35 * sin(fl * 0.7 + t * 1.3);
        float k = fract(f * 3.2); float d = min(k, 1.0 - k); float w = fwidth(f * 3.2) * 1.1 + 0.01; float line = 1.0 - smoothstep(0.045, 0.045 + w, d);
        float band = floor(f * 3.2 + 0.5); float pick = rh(vec2(band, 3.0));
        vec3 navy = vec3(0.035, 0.06, 0.16), cob = vec3(0.16, 0.38, 1.0), cy = vec3(0.03, 0.87, 1.0), bone = vec3(0.94, 0.91, 0.85), pink = vec3(1.0, 0.25, 0.64);
        vec3 lc = pick < 0.45 ? cob : pick < 0.75 ? cy : pick < 0.93 ? bone : pink;
        vec3 col = mix(navy, lc, line * 0.95);
        // Open Eye Flowers drifting on the current, one every 13 metres, each turning
        float cell = floor(fl / 13.0); float lx = fract(fl / 13.0) * 13.0 - 6.5; float ly = t * 1.15 - (rh(vec2(cell, 9.0)) - 0.5) * 0.9;
        float ang = uT * 0.35 + cell * 2.1; vec2 q = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * vec2(lx, ly) / 1.35 + 0.5;
        vec4 fc = (q.x > 0.0 && q.x < 1.0 && q.y > 0.0 && q.y < 1.0) ? texture2D(uFl, q) : vec4(0.0);
        col = mix(col, fc.rgb, fc.a);
        float edge = smoothstep(1.0, 0.78, abs(t));
        diffuseColor.rgb = col; diffuseColor.a = edge * 0.92;
        totalEmissiveRadiance += (lc * line * (0.1 + 0.85 * uNight) + fc.rgb * fc.a * 0.6 * uNight) * edge;`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>');
    // totalEmissiveRadiance is declared before color_fragment in r128's standard fragment, so the add above is legal
  };
  mat.customProgramCacheKey = () => 'river241';
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; m.renderOrder = 2; m.frustumCulled = false; m.userData.__nofreeze = true; m.userData.__single = true; scene.add(m); RIVER.mesh = m; RIVER.mat = mat;
})();
window.__FRAMES.push(dt => { try { if (!RIVER.sh) return; RIVER.t += dt; RIVER.sh.uniforms.uT.value = RIVER.t; RIVER.sh.uniforms.uNight.value = Math.min(1, (L.lamps || 0) * 1.3); } catch (e) { } });
