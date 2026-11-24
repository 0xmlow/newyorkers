/* ================================================================
   v394 THE MEMES WALK (2026-11-24)
   Every 6529 Memes card on the island, in mint order, set into the promenade ring like stars in a pavement: a brass
   plaque for each, the card in enamel, its number cast below. They line both banks of the meme river, #1 on the
   outer bank at the pier spoke and east round the ring, then on along the inner bank to the newest, so a walk round the
   river twice is a walk through the whole collection, season by season. Stand still on one and it tells you
   whose it is. 577 plaques in six draws (one per card atlas). ?memeswalk=0 off.
   ================================================================ */
const MWALK = { ok: false, list: [], pos: [], wave: { value: -1 } };
window.__MWALK = MWALK;
(function memesWalk() {
  if (!LOOK.on || /memeswalk=0/.test(location.search)) return;
  const seen = new Set(), list = CARDS.concat(D.fresh || []).filter(c => c.uv && !seen.has(c.n) && seen.add(c.n)).sort((a, b) => a.n - b.n); MWALK.list = list;
  const PY = 0.665 + 0.012, banks = [{ r: 41.86 }, { r: 38.14 }], gap = 1.6, PW = 0.48, PL = 0.62;
  // arc left on each bank once the four spoke crossings are skipped, and how many cards each bank takes
  const usable = r => 2 * PI * r - 4 * 2 * gap; const tot = usable(banks[0].r) + usable(banks[1].r); banks[0].n = Math.round(list.length * usable(banks[0].r) / tot); banks[1].n = list.length - banks[0].n;
  const spots = []; banks.forEach((b, bi) => { const seg = (PI / 2) - 2 * gap / b.r, per = b.n / 4; let k = 0;
    for (let q = 0; q < 4; q++) { const n = Math.round(per * (q + 1)) - Math.round(per * q), a0 = q * PI / 2 + gap / b.r; for (let i = 0; i < n; i++) { const a = a0 + (i + 0.5) / n * seg; spots.push({ a, r: b.r, bank: bi }); k++; } } });
  // the digits, cast in brass
  const dg = document.createElement('canvas'); dg.width = 1024; dg.height = 128; const dc = dg.getContext('2d'); const dt = new THREE.CanvasTexture(dg); dt.encoding = THREE.sRGBEncoding; dt.anisotropy = ANISO;
  const drawD = () => { if (!dc || !dc.fillText) return; dc.clearRect(0, 0, 1024, 128); dc.fillStyle = '#fff'; dc.textAlign = 'center'; dc.textBaseline = 'middle'; dc.font = '900 112px "Archivo Black",Impact,sans-serif'; for (let i = 0; i < 10; i++) dc.fillText(String(i), i * 102.4 + 51.2, 68); dt.needsUpdate = true; };
  drawD(); addEventListener('n3wfonts', () => { try { drawD(); } catch (e) { } }, { once: true });
  const byAtl = {}; list.forEach((cd, i) => { const s = spots[i]; if (!s) return; (byAtl[cd.uv[0]] = byAtl[cd.uv[0]] || []).push([cd, s]); MWALK.pos.push([s.a, s.r, cd]); });
  const geo = new THREE.PlaneGeometry(PW, PL); geo.rotateX(-PI / 2);
  const o = new THREE.Object3D();
  Object.keys(byAtl).forEach(ai => { const L = byAtl[ai], n = L.length, aUv = new Float32Array(n * 4), aNum = new Float32Array(n), aAsp = new Float32Array(n);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.5 });
    mat.onBeforeCompile = sh => { sh.uniforms.uAt = { value: ATL[ai] }; sh.uniforms.uDig = { value: dt }; sh.uniforms.uWave = MWALK.wave;
      sh.vertexShader = 'attribute vec4 aUv; attribute float aNum; attribute float aAsp; varying vec4 vUvR; varying float vNum; varying float vAsp; varying vec2 vPl;\n' + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n vUvR = aUv; vNum = aNum; vAsp = aAsp; vPl = uv;');
      sh.fragmentShader = 'uniform float uWave; uniform sampler2D uAt, uDig; varying vec4 vUvR; varying float vNum; varying float vAsp; varying vec2 vPl; float plM = 0.9, plR = 0.32;\n' + sh.fragmentShader
        .replace('#include <map_fragment>', `{ vec2 p = vPl; vec3 brass = vec3(0.62, 0.43, 0.16), enamel = vec3(0.012, 0.02, 0.05); vec3 col = brass;
          float ex = step(0.06, p.x) * step(p.x, 0.94), ey = step(0.045, p.y) * step(p.y, 0.955);
          if (ex * ey > 0.5) { col = enamel; plM = 0.0; plR = 0.18;
            if (p.y > 0.24 && p.y < 0.93 && p.x > 0.1 && p.x < 0.9) { vec2 q = vec2((p.x - 0.1) / 0.8, (p.y - 0.24) / 0.69); float ar = (0.8 * ${PW.toFixed(2)}) / (0.69 * ${PL.toFixed(2)});
              vec2 s = vAsp > ar ? vec2(1.0, ar / vAsp) : vec2(vAsp / ar, 1.0); vec2 c = (q - 0.5) / s + 0.5;
              if (c.x > 0.0 && c.x < 1.0 && c.y > 0.0 && c.y < 1.0) { col = sRGBToLinear(texture2D(uAt, vec2(mix(vUvR.x, vUvR.z, c.x), mix(vUvR.y, vUvR.w, c.y)))).rgb; plR = 0.24; } }
            if (p.y > 0.07 && p.y < 0.21) { float nd = vNum >= 100.0 ? 3.0 : vNum >= 10.0 ? 2.0 : 1.0; float cw = 0.14, x0 = 0.5 - nd * cw * 0.5 - cw * 0.5;
              float slot = floor((p.x - x0) / cw); float fx = fract((p.x - x0) / cw);
              if (slot >= 0.0 && slot <= nd) { float dgt = -1.0; if (slot == 0.0) { col = mix(col, brass, 0.0); } else { float pw = pow(10.0, nd - slot); dgt = mod(floor(vNum / pw), 10.0); }
                float a = 0.0; if (dgt >= 0.0) a = texture2D(uDig, vec2((dgt + fx) / 10.0, (p.y - 0.07) / 0.14)).a; else { vec2 h = vec2(fx, (p.y - 0.07) / 0.14); a = step(abs(h.x - 0.5), 0.32) * (step(abs(h.y - 0.38), 0.05) + step(abs(h.y - 0.62), 0.05)) + step(abs(h.y - 0.5), 0.34) * (step(abs(h.x - 0.4), 0.05) + step(abs(h.x - 0.6), 0.05)); a = clamp(a, 0.0, 1.0); }
                if (a > 0.5) { col = brass; plM = 0.9; plR = 0.3; } } } }
          diffuseColor.rgb = col; }`)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = plR;')
        .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n metalnessFactor = plM;').replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += vec3(1.0, 0.72, 0.36) * (plM > 0.5 ? 1.4 : 0.25) * (1.0 - smoothstep(0.0, 0.012, abs(vNum / 577.0 - uWave)));'); };
    mat.customProgramCacheKey = () => 'mwalk';
    const im = new THREE.InstancedMesh(geo, mat, n);
    L.forEach(([cd, s], i) => { const x = Math.sin(s.a) * s.r, z = Math.cos(s.a) * s.r; o.position.set(x, PY, z); o.rotation.set(0, s.a + PI, 0); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
      const u = cd.uv; aUv.set([u[1], 1 - u[4], u[3], 1 - u[2]], i * 4); aNum[i] = cd.n; aAsp[i] = u[5]; });
    const g2 = geo.clone(); g2.setAttribute('aUv', new THREE.InstancedBufferAttribute(aUv, 4)); g2.setAttribute('aNum', new THREE.InstancedBufferAttribute(aNum, 1)); g2.setAttribute('aAsp', new THREE.InstancedBufferAttribute(aAsp, 1)); im.geometry = g2;
    im.instanceMatrix.needsUpdate = true; im.receiveShadow = true; im.frustumCulled = false; im.renderOrder = 3; scene.add(im); im.userData.ns = L.map(q => q[0].n); (MWALK.ims = MWALK.ims || []).push(im); });
  MWALK.ok = true; MWALK.PY = PY; MWALK.banks = banks;
  if (window.__MAP) MAP.places.push(['THE MEMES WALK', 0, 41.9, 0, 46]);
})();
// stand still on a plaque and it tells you whose card it is
window.__FRAMES.push(dt => { try { if (!MWALK.ok) return; const x = camera.position.x, z = camera.position.z, r = Math.hypot(x, z); if (r < 37 || r > 43) { MWALK.cur = -1; return; }
  const a = (Math.atan2(x, z) + PI * 2) % (PI * 2); let best = -1, bd = 0.36; for (let i = 0; i < MWALK.pos.length; i++) { const p = MWALK.pos[i]; if (Math.abs(p[1] - r) > 0.45) continue; const d = Math.abs(((a - p[0] + PI * 3) % (PI * 2)) - PI) * p[1]; if (d < bd) { bd = d; best = i; } }
  if (best !== MWALK.cur) { MWALK.cur = best; MWALK.t = 0; return; } if (best < 0 || MWALK.told === best) return; MWALK.t += dt; if (MWALK.t < 0.9) return; MWALK.told = best;
  const c = MWALK.pos[best][2]; toast('THE MEMES WALK · #' + c.n + ' ' + String(c.t || '').toUpperCase() + ' · ' + String(c.art || c.a || '').toUpperCase() + ' · SZN ' + c.s); } catch (e) { } });
