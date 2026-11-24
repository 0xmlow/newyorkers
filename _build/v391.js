/* ================================================================
   v391 ILLUSION: THE ZOETROPE (2026-11-24)
   Beside N3W CUTS, on a cast iron pedestal, a brass and black drum with twelve slits round its rim and twelve
   pictures inside: an Open Eye Flower breathing and turning. Look down through the slits and the flower moves.
   The drum turns about once a second, stepping exactly one slit for every four frames your screen draws, so
   every slit is always where the last one was and each look through it lands on the next picture:
   the 1834 toy, done with the frame rate instead of your eye's persistence. ?zoetrope=0 off.
   ================================================================ */
const ZOE = { ok: false, f: 0 };
window.__ZOE = ZOE;
(function zoetrope() {
  if (!window.__CUTS || !CUTS.ok || /zoetrope=0/.test(location.search)) return;
  const N = 12, R = 0.42, Hd = 0.34, [x, z] = CUTS.at(CUTS.W / 2 + 2.6, CUTS.D / 2 + 1.8), g = ground(x, z), top = 1.02;
  const iron = new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.45, metalness: 0.6 }), brass = new THREE.MeshStandardMaterial({ color: 0xb8913e, roughness: 0.3, metalness: 0.95 });
  const prof = [[0.0, 0], [0.32, 0], [0.32, 0.05], [0.22, 0.1], [0.12, 0.2], [0.08, 0.5], [0.1, 0.62], [0.07, 0.7], [0.07, 0.92], [0.16, 0.96], [0.2, 1.0], [0.0, 1.0]].map(([a, b]) => new THREE.Vector2(a, b));
  const ped = new THREE.Mesh(new THREE.LatheGeometry(prof, 40), iron); ped.position.set(x, g, z); ped.castShadow = ped.receiveShadow = true; scene.add(ped); post(x, z, 0.4, -5, g + 1.4);
  // the drum's two skins: outside black with the slits, inside the pictures under the slits
  const mk = (pics) => { const cv = document.createElement('canvas'); cv.width = 2048; cv.height = 256; const c = cv.getContext('2d'); const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO;
    const draw = img => { if (!c || !c.fillRect || !c.clearRect || !c.beginPath || !c.strokeRect || !c.save) return; c.clearRect(0, 0, 2048, 256); c.fillStyle = pics ? '#0f1526' : '#111214'; c.fillRect(0, 0, 2048, 256);
      if (!pics) { c.strokeStyle = '#b8913e'; c.lineWidth = 6; c.beginPath(); c.moveTo(0, 250); c.lineTo(2048, 250); c.stroke(); c.beginPath(); c.moveTo(0, 6); c.lineTo(2048, 6); c.stroke(); }
      for (let i = 0; i < N; i++) { const cx = (i + 0.5) * 2048 / N; c.clearRect(cx - 7, 14, 14, 96);   // the slits, upper band
        if (pics) { const k = i / N, s = 110 * (0.72 + 0.28 * Math.sin(k * PI * 2)), rot = k * PI * 2 / 3;
          c.fillStyle = '#efe8da'; c.fillRect(cx - 80, 128, 160, 120); c.save(); c.translate(cx, 188); c.rotate(rot); if (img) c.drawImage(img, -s / 2, -s / 2, s, s); else { c.fillStyle = '#2962FF'; c.beginPath(); c.arc(0, 0, s / 3, 0, PI * 2); c.fill(); } c.restore(); } }
      t.needsUpdate = true; };
    draw(null); if (pics) { const im = new Image(); im.onload = () => { try { draw(im); } catch (e) { } }; im.src = 'assets/iv_flower.webp'; } return t; };
  const D = new THREE.Group(); D.position.set(x, g + top, z); scene.add(D); ZOE.drum = D;
  const out = new THREE.Mesh(new THREE.CylinderGeometry(R, R, Hd, 96, 1, true), new THREE.MeshStandardMaterial({ map: mk(false), roughness: 0.4, metalness: 0.3, alphaTest: 0.5, side: THREE.FrontSide })); out.position.y = Hd / 2; D.add(out);
  const inn = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.004, R - 0.004, Hd, 96, 1, true), new THREE.MeshBasicMaterial({ map: mk(true), alphaTest: 0.5, side: THREE.BackSide })); inn.position.y = Hd / 2; D.add(inn); ZOE.innM = inn.material;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(R, 48), new THREE.MeshStandardMaterial({ color: 0x0f1526, roughness: 0.8 })); floor.rotation.x = -PI / 2; floor.position.y = 0.005; D.add(floor);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.012, 8, 96), brass); rim.rotation.x = PI / 2; rim.position.y = Hd; D.add(rim);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 12), brass); hub.position.y = 0.06; D.add(hub);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), brass); cap.position.y = 0.13; D.add(cap);
  const lab = signTex([{ t: 'THE ZOETROPE', s: 0.26 }, { t: 'LOOK DOWN THROUGH THE SLITS. IT STEPS ONE SLIT FOR EVERY', s: 0.085 }, { t: 'FOUR FRAMES YOUR SCREEN DRAWS, SO THE SLITS NEVER MOVE.', s: 0.085 }], 1024, 256, '#16233f', '#efe8da');
  const lm = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.225), new THREE.MeshStandardMaterial({ map: lab, roughness: 0.5 })); const nx = CUTS.n[0], nz = CUTS.n[1];
  lm.position.set(x + nx * 0.34, g + 0.62, z + nz * 0.34); lm.rotation.y = CUTS.ry; lm.rotation.x = 0; scene.add(lm);
  ZOE.ok = true; ZOE.P = [x, g, z];
  if (window.__MAP) MAP.places.push(['THE ZOETROPE', x, z, x + nx * 2.5, z + nz * 2.5]);
})();
// one slit per drawn frame, held for four frames: at 60 frames a second, fifteen pictures a second
window.__FRAMES.push(() => { try { if (!ZOE.ok) return; const d = Math.hypot(camera.position.x - ZOE.P[0], camera.position.z - ZOE.P[2]); if (d > 40) return; ZOE.f++; if (ZOE.f % 4) return; ZOE.drum.rotation.y += PI * 2 / 12; } catch (e) { } });
