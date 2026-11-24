/* ================================================================
   v254 ILLUSION: THE HOLLOW EYE (2026-11-23)
   Beside the east spoke of the meme river stands an Open Eye Flower on a stone plinth, and its eye is not a ball:
   it is a hollow bowl, painted inside, iris at the bottom. Your brain refuses a concave face and reads it as
   convex, so as you walk along the path the eye seems to turn and follow you, faster than you move (the hollow
   face illusion, the one in the dragon postcards). Nothing in it moves. ?hollow=0 turns it off.
   ================================================================ */
const HOLLOW = {};
window.__HOLLOW = HOLLOW;
(function hollowEye() {
  if (!LOOK.on || /hollow=0/.test(location.search)) return;
  const X = 21, Z = 6.8, g0 = ground(X, Z), G = new THREE.Group(); G.position.set(X, g0, Z); G.rotation.y = PI + 0.25; scene.add(G); HOLLOW.G = G;
  const stone = new THREE.MeshStandardMaterial({ color: 0xcfc6b6, roughness: 0.7 });
  const pl = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.1, 1.0), stone); pl.position.y = 0.55; pl.castShadow = pl.receiveShadow = true; G.add(pl);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 1.2), stone); cap.position.y = 1.16; G.add(cap);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 1.1, 12), new THREE.MeshStandardMaterial({ color: 0x2f5a3a, roughness: 0.6 })); stem.position.y = 1.75; G.add(stem);
  // the petals: a ring of white petals round an open centre, on a shallow back dish
  const pc = document.createElement('canvas'); pc.width = pc.height = 1024; const c = pc.getContext('2d'); const pt = new THREE.CanvasTexture(pc); pt.encoding = THREE.sRGBEncoding;
  if (c && c.ellipse && c.fill) { c.clearRect(0, 0, 1024, 1024); for (let i = 0; i < 14; i++) { const a = i / 14 * PI * 2; c.save(); c.translate(512, 512); c.rotate(a); const gr = c.createLinearGradient(0, -170, 0, -500); gr.addColorStop(0, '#d9dce4'); gr.addColorStop(1, '#ffffff'); c.fillStyle = gr; c.beginPath(); c.ellipse(0, -330, 95, 180, 0, 0, PI * 2); c.fill(); c.strokeStyle = 'rgba(41,98,255,.35)'; c.lineWidth = 4; c.stroke(); c.restore(); }
    c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(512, 512, 150, 0, PI * 2); c.fill(); c.globalCompositeOperation = 'source-over'; c.strokeStyle = '#2962FF'; c.lineWidth = 14; c.beginPath(); c.arc(512, 512, 156, 0, PI * 2); c.stroke(); }
  const petals = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshStandardMaterial({ map: pt, transparent: true, alphaTest: 0.4, roughness: 0.5, side: THREE.DoubleSide })); petals.position.set(0, 2.9, 0.02); petals.castShadow = true; G.add(petals);
  // the hollow: a hemisphere seen from inside, pole pointing back, iris painted at its bottom
  const ec = document.createElement('canvas'); ec.width = 512; ec.height = 512; const e = ec.getContext('2d'); const et = new THREE.CanvasTexture(ec); et.encoding = THREE.sRGBEncoding;
  if (e && e.fillRect && e.createLinearGradient) { const gr = e.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#05070d'); gr.addColorStop(0.1, '#05070d'); gr.addColorStop(0.11, '#08DEFF'); gr.addColorStop(0.2, '#2962FF'); gr.addColorStop(0.31, '#14307a'); gr.addColorStop(0.33, '#f4f1ea'); gr.addColorStop(1, '#ffffff'); e.fillStyle = gr; e.fillRect(0, 0, 512, 512);
    e.strokeStyle = 'rgba(200,40,50,.25)'; e.lineWidth = 2; for (let i = 0; i < 18; i++) { const x = Math.random() * 512; e.beginPath(); e.moveTo(x, 512); e.bezierCurveTo(x + 20, 400, x - 20, 300, x + 10, 190); e.stroke(); }
    e.fillStyle = 'rgba(255,255,255,.85)'; e.fillRect(40, 18, 60, 20); }
  const R = 0.62, bowl = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 24, 0, PI * 2, 0, PI / 2), new THREE.MeshStandardMaterial({ map: et, roughness: 0.25, side: THREE.BackSide }));
  bowl.rotation.x = -PI / 2; bowl.position.set(0, 2.9, 0.0); G.add(bowl);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R + 0.03, 0.04, 10, 48), new THREE.MeshStandardMaterial({ color: 0x8a6a36, roughness: 0.3, metalness: 0.9 })); rim.position.set(0, 2.9, 0.01); G.add(rim);
  const back = new THREE.Mesh(new THREE.CircleGeometry(1.0, 40), stone); back.position.set(0, 2.9, -R - 0.02); back.rotation.y = PI; G.add(back);
  boxWalls(X, Z, 1.4, 1.1, G.rotation.y, -5, g0 + 1.2);
  const lab = signTex([{ t: 'THE HOLLOW EYE', s: 0.3 }, { t: 'WALK PAST IT. IT WATCHES YOU. IT IS A BOWL.', s: 0.12 }], 1024, 256, '#16233f', '#efe8da');
  const lm = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), new THREE.MeshStandardMaterial({ map: lab, roughness: 0.6 })); lm.position.set(0, 0.7, 0.505); G.add(lm);
  HOLLOW.ok = true;
})();
