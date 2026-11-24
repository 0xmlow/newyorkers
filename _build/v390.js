/* ================================================================
   v390 ILLUSION: THE MAGIC EYE WALL (2026-11-24)
   On N3W CUTS' south wall, a poster of confetti in MLow's colours: navy, cobalt, cyan, pink and bone. Relax your eyes
   and look through the wall, as if at something a metre behind it, until the pattern doubles and locks: an Open
   Eye Flower rises out of it, and 6529 under it, deeper. It is an autostereogram (Christopher Tyler, 1979): every
   column repeats the one a fixed step to its left, and where the step shortens the repeat your two eyes fuse it
   nearer. E at the poster shows the hidden picture for anyone who cannot see it. ?magiceye=0 off.
   ================================================================ */
const MEYE = { ok: false };
window.__MEYE = MEYE;
(function magicEye() {
  if (!window.__CUTS || !CUTS.ok || /magiceye=0/.test(location.search)) return;
  const [cx, g, cz] = CUTS.c, [nx, nz] = CUTS.n, [tx, tz] = CUTS.t, hw = CUTS.W / 2;
  const W = 1700, H = 1150, P0 = 170, DS = 26, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO;
  const dv = document.createElement('canvas'); dv.width = W; dv.height = H; const d = dv.getContext('2d'); const dt = new THREE.CanvasTexture(dv); dt.encoding = THREE.sRGBEncoding;
  const build = img => { if (!c || !c.getImageData || !c.createImageData || !d || !d.getImageData || !d.drawImage || !d.fillText) return;
    // the hidden picture as depth: the eye flower near, 6529 a step behind it
    d.fillStyle = '#000'; d.fillRect(0, 0, W, H);
    if (img) { const s = 640, ix = W / 2 - s / 2, iy = 70; const tmp = document.createElement('canvas'); tmp.width = s; tmp.height = s; const q = tmp.getContext('2d'); q.drawImage(img, 0, 0, s, s); q.globalCompositeOperation = 'source-in'; q.fillStyle = '#e6e6e6'; q.fillRect(0, 0, s, s); d.drawImage(tmp, ix, iy); }
    d.fillStyle = '#8a8a8a'; d.textAlign = 'center'; d.textBaseline = 'middle'; d.font = '900 330px "Archivo Black",Impact,sans-serif'; d.fillText('6529', W / 2, 900);
    const dep = d.getImageData(0, 0, W, H).data;
    // the confetti tile, one period wide
    const pt = document.createElement('canvas'); pt.width = P0; pt.height = 256; const p = pt.getContext('2d'); p.fillStyle = '#16233f'; p.fillRect(0, 0, P0, 256);
    const pal = ['#2962FF', '#08DEFF', '#efe8da', '#ff4fa3', '#7f6bff', '#1b2b55', '#c9a24a']; let sd = 6529; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 520; i++) { p.fillStyle = pal[Math.floor(rnd() * pal.length)]; const x = rnd() * P0, y = rnd() * 256, r = 1.5 + rnd() * 6; for (const ox of [0, -P0, P0]) { p.beginPath(); p.arc(x + ox, y, r, 0, PI * 2); p.fill(); } }
    const pat = p.getImageData(0, 0, P0, 256).data, out = c.createImageData(W, H), o = out.data;
    for (let y = 0; y < H; y++) { const row = y * W; for (let x = 0; x < W; x++) { const i = (row + x) * 4, s = P0 - Math.round(dep[i] / 255 * DS);
      if (x < s) { const j = ((y % 256) * P0 + (x % P0)) * 4; o[i] = pat[j]; o[i + 1] = pat[j + 1]; o[i + 2] = pat[j + 2]; } else { const j = i - s * 4; o[i] = o[j]; o[i + 1] = o[j + 1]; o[i + 2] = o[j + 2]; } o[i + 3] = 255; } }
    c.putImageData(out, 0, 0); t.needsUpdate = true;
    d.globalCompositeOperation = 'source-over'; const pic = d.getImageData(0, 0, W, H); for (let i = 0; i < pic.data.length; i += 4) { const v = pic.data[i] / 255; pic.data[i] = 22 + v * 200; pic.data[i + 1] = 35 + v * 190; pic.data[i + 2] = 63 + v * 170; } d.putImageData(pic, 0, 0); dt.needsUpdate = true; };
  const im = new Image(); im.onload = () => { try { build(im); } catch (e) { console.warn('v390', e); } }; im.onerror = () => { try { build(null); } catch (e) { } };
  const go = () => { im.src = 'assets/iv_flower.webp'; }; if (window.__fontsReady) go(); else addEventListener('n3wfonts', go, { once: true });
  const mat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.62 }); MEYE.mat = mat; MEYE.t = t; MEYE.dt = dt;
  const ry = Math.atan2(-tx, -tz), px = cx - tx * (hw + 0.035), pz = cz - tz * (hw + 0.035), PWm = 3.4, PHm = PWm * H / W;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(PWm, PHm), mat); m.position.set(px, g + 1.85, pz); m.rotation.y = ry; scene.add(m); MEYE.mesh = m;
  const Fs0 = facFace(cx, cz, -tx, -tz, hw), Fs = { at: (u, y, w, sx, sy, sz, key) => Fs0.at(u, g + y, w, sx, sy, sz, key) }; Fs.at(0, 1.85 + PHm / 2 + 0.04, 0.03, PWm + 0.16, 0.08, 0.06, 'frameK'); Fs.at(0, 1.85 - PHm / 2 - 0.04, 0.03, PWm + 0.16, 0.08, 0.06, 'frameK'); Fs.at(-PWm / 2 - 0.04, 1.85, 0.03, 0.08, PHm + 0.16, 0.06, 'frameK'); Fs.at(PWm / 2 + 0.04, 1.85, 0.03, 0.08, PHm + 0.16, 0.06, 'frameK');
  const cap = signTex([{ t: 'MAGIC EYE', s: 0.3 }, { t: 'LOOK THROUGH THE WALL, NOT AT IT. LET THE DOTS DOUBLE AND LOCK.', s: 0.075 }, { t: 'AN OPEN EYE FLOWER RISES OUT, AND 6529 BEHIND IT.  E SHOWS YOU.', s: 0.075 }], 1024, 256, '#16233f', '#efe8da');
  const cm = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshStandardMaterial({ map: cap, roughness: 0.5 })); cm.position.set(cx - tx * (hw + 0.04), g + 0.42, cz - tz * (hw + 0.04)); cm.rotation.y = ry; scene.add(cm);
  facFlush();
  interact(cx - tx * (hw + 2.0), cz - tz * (hw + 2.0), 2.4, 'E · SHOW ME THE HIDDEN PICTURE', () => { MEYE.show = 4; });
  MEYE.ok = true; MEYE.P = [px, g, pz]; MEYE.V = [cx - tx * (hw + 3.2), g + 1.7, cz - tz * (hw + 3.2)];
  if (window.__MAP) MAP.places.push(['MAGIC EYE', px, pz, cx - tx * (hw + 3), cz - tz * (hw + 3)]);
})();
window.__FRAMES.push(dt => { try { if (!MEYE.ok) return; if (MEYE.show > 0) { MEYE.show -= dt; if (MEYE.mat.map !== MEYE.dt) { MEYE.mat.map = MEYE.dt; MEYE.mat.needsUpdate = true; } } else if (MEYE.mat.map !== MEYE.t) { MEYE.mat.map = MEYE.t; MEYE.mat.needsUpdate = true; } } catch (e) { } });
