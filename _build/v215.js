/* ================================================================
   v215 THE LOOK: STREET BANNERS (2026-11-23)
   The vertical banners New York hangs from its lamp posts for a season or a show. Every other lamp on the ring road
   now flies a pair on steel arms: MEME ISLAND on Evil Eye Blue, and THE MEMES BY 6529 on ink, an Open Eye between
   them, lifting and settling in the wind. ?banners=0 off.
   ================================================================ */
const BANNERS2 = { u: { uBT: { value: 0 } } };
window.__BANNERS2 = BANNERS2;
(function banners() {
  if (!LOOK.on || /banners=0/.test(location.search)) return;
  const mk = (bg, fg, top, bot) => { const cv = document.createElement('canvas'); cv.width = 256; cv.height = 640; const c = cv.getContext('2d'); if (c && c.fillRect) { c.fillStyle = bg; c.fillRect(0, 0, 256, 640);
      if (c.arc) { c.fillStyle = '#F0F4F8'; c.beginPath(); c.arc(128, 320, 70, 0, PI * 2); c.fill(); c.fillStyle = '#2962FF'; c.beginPath(); c.arc(128, 320, 40, 0, PI * 2); c.fill(); c.fillStyle = '#0D0D0D'; c.beginPath(); c.arc(128, 320, 18, 0, PI * 2); c.fill(); }
      if (c.fillText) { c.fillStyle = fg; c.textAlign = 'center'; c.font = '400 58px Anton, Impact, sans-serif'; top.forEach((t, i) => c.fillText(t, 128, 90 + i * 62)); c.font = '700 26px "JetBrains Mono", Menlo, monospace'; bot.forEach((t, i) => c.fillText(t, 128, 470 + i * 36)); } }
    const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO; return t; };
  const tA = mk('#2962FF', '#F0F4F8', ['MEME', 'ISLAND'], ['NEW YORK', 'HARBOR']), tB = mk('#0D0D0D', '#F0F4F8', ['THE MEMES', 'BY 6529'], ['577 CARDS', 'ON VIEW']);
  const mat = t => { const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.75, side: THREE.DoubleSide }); m.onBeforeCompile = sh => { Object.assign(sh.uniforms, BANNERS2.u); sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uBT;').replace('#include <begin_vertex>', '#include <begin_vertex>\nfloat bu = clamp(position.x / 0.62, 0.0, 1.0); transformed.z += bu * 0.08 * sin(uBT * 2.2 + position.y * 1.7 + modelMatrix[3].x * 0.3);'); }; m.customProgramCacheKey = () => 'mi-banner-v215'; return m; };
  const mA = mat(tA), mB = mat(tB), arm = FACM.steel || MAT.steel; const geo = new THREE.PlaneGeometry(0.62, 1.55, 6, 6); geo.translate(0.31, 0, 0);
  const lamps = []; for (let i = 0; i < 36; i += 2) lamps.push(i); const iA = new THREE.InstancedMesh(geo, mA, lamps.length), iB = new THREE.InstancedMesh(geo, mB, lamps.length), iR = new THREE.InstancedMesh(new THREE.BoxGeometry(0.72, 0.03, 0.03), arm, lamps.length * 4);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), Y = new V3(0, 1, 0), one = new V3(1, 1, 1); let r = 0;
  lamps.forEach((i, k) => { const a = (i + 0.5) / 36 * 360, [x, z] = P2(a, 94.5), g = ground(x, z), tang = -(a * PI / 180);
    [[iA, tang], [iB, tang + PI]].forEach(([im, ry]) => { q.setFromAxisAngle(Y, ry); m4.compose(new V3(x + Math.cos(ry) * 0.1, g + 4.55, z - Math.sin(ry) * 0.1), q, one); im.setMatrixAt(k, m4);
      [5.3, 3.8].forEach(y => { m4.compose(new V3(x + Math.cos(ry) * 0.42, g + y, z - Math.sin(ry) * 0.42), q, one); iR.setMatrixAt(r++, m4); }); }); });
  [iA, iB, iR].forEach(o => { o.castShadow = o === iR; scene.add(o); });
  mA.onBeforeCompile = mB.onBeforeCompile = sh => { Object.assign(sh.uniforms, BANNERS2.u); sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uBT;').replace('#include <begin_vertex>', '#include <begin_vertex>\nfloat bu = clamp(position.x / 0.62, 0.0, 1.0); float ph = 0.0;\n#ifdef USE_INSTANCING\nph = instanceMatrix[3].x * 0.3 + instanceMatrix[3].z * 0.2;\n#endif\ntransformed.z += bu * 0.08 * sin(uBT * 2.2 + position.y * 1.7 + ph);'); };
})();
window.__FRAMES.push(dt => { try { BANNERS2.u.uBT.value += dt; } catch (e) { } });
