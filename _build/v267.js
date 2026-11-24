/* ================================================================
   v267 EVERY CARD HAS A BACK (2026-11-23)
   Hundreds of 6529 cards hang on the island, framed, on posts, on the freeway's 71 billboards, round the plinths,
   and from behind every one of them showed a plain dark box. Now each one has a designed card back, the way a
   trading card does: MLow's navy field, his contour lines running round an Open Eye Flower, a bronze rule and
   THE MEMES BY 6529 · N3W MEME ISLAND · CC0 along the foot. One texture, one instanced draw for all of them, kept in
   step with the frames (a card that is taken down takes its back with it). ?backs=0 turns it off.
   ================================================================ */
const BACKS = { im: null, n: 0, t: 0 };
window.__BACKS = BACKS;
(function cardBacks() {
  if (!LOOK.on || /backs=0/.test(location.search)) return;
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 640; const c = cv.getContext('2d'); const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO; BACKS.tex = t;
  const draw = img => { if (!c || !c.beginPath || !c.stroke || !c.fillText) return; c.fillStyle = '#0b1430'; c.fillRect(0, 0, 512, 640);
    c.lineWidth = 3; for (let r = 30; r < 420; r += 16) { c.strokeStyle = ['rgba(41,98,255,.6)', 'rgba(8,222,255,.4)', 'rgba(239,232,218,.22)'][(r / 16 | 0) % 3]; c.beginPath();
      for (let a = 0; a <= 72; a++) { const th = a / 72 * PI * 2, rr = r + Math.sin(th * 3 + r * 0.04) * 10 + Math.sin(th * 7 + r * 0.1) * 4; const x = 256 + Math.cos(th) * rr * 0.9, y = 290 + Math.sin(th) * rr * 1.1; a ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    if (img) c.drawImage(img, 151, 185, 210, 210);
    c.strokeStyle = '#b08a3e'; c.lineWidth = 6; c.strokeRect(14, 14, 484, 612); c.fillStyle = '#b08a3e'; c.fillRect(40, 560, 432, 3);
    c.fillStyle = '#efe8da'; c.textAlign = 'center'; c.font = '700 26px "Archivo Black",Impact,sans-serif'; c.fillText('THE MEMES BY 6529', 256, 598); c.font = '500 16px "Archivo",Helvetica,sans-serif'; c.fillStyle = '#9fbcff'; c.fillText('N3W MEME ISLAND · BY MLOW · CC0', 256, 620);
    t.needsUpdate = true; };
  draw(null); const im = new Image(); im.onload = () => { try { draw(im); } catch (e) { } }; im.src = 'assets/iv_flower.webp';
  if (!window.__fontsReady) addEventListener('n3wfonts', () => { try { draw(im.complete ? im : null); } catch (e) { } }, { once: true });
  BACKS.mat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 });
})();
const _bk = { T: new THREE.Matrix4().makeTranslation(0, 0, -0.53).multiply(new THREE.Matrix4().makeRotationY(Math.PI)), m: new THREE.Matrix4() };
function backsSync() { if (!frameMesh || !BACKS.mat) return; const n = frameMesh.count;
  if (!BACKS.im || BACKS.cap < n) { if (BACKS.im) scene.remove(BACKS.im); BACKS.cap = n + 32; BACKS.im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), BACKS.mat, BACKS.cap); BACKS.im.frustumCulled = false; BACKS.im.receiveShadow = true; BACKS.im.userData.__nofreeze = true; scene.add(BACKS.im); }
  for (let i = 0; i < n; i++) { frameMesh.getMatrixAt(i, _bk.m); BACKS.im.setMatrixAt(i, _bk.m.multiply(_bk.T)); } BACKS.im.count = n; BACKS.im.instanceMatrix.needsUpdate = true; BACKS.n = n; }
window.__FRAMES.push(dt => { try { if (!BACKS.mat) return; BACKS.t -= dt; if (BACKS.t > 0) return; BACKS.t = 3; backsSync(); } catch (e) { if (!BACKS.err) { BACKS.err = e; console.warn('v267 backs', e); } } });
