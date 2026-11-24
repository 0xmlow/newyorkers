/* ================================================================
   v339 THE ROOFTOP BILLBOARD (2026-11-24)
   The most New York thing a roof can carry: a billboard on a steel frame with a catwalk and gooseneck lamps. The
   bodega tenement's roof (v227) gets one, turned to the plaza, and on it Firefly's piece made for it: the island
   itself, small, a ferris wheel and a lighthouse, under an enormous Open Eye Flower rising out of a sky of contour
   lines, with N3W 6529 MEME ISLAND along the foot. Lit at night. ?wallpaper=0 off.
   ================================================================ */
const RBB = {};
window.__RBB = RBB;
(function roofBillboard() {
  if (!WALLS.on || !window.__BLK || !BLK.bodega) return; const top = BLK.bodega + 0.12, x = 20.2, z = 69.2, W = 8.4, H = 4.7, y0 = top + 2.6, ry = -PI / 2;
  const cv = document.createElement('canvas'); cv.width = 2048; cv.height = 1146; const c = cv.getContext('2d'); const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO;
  const band = () => { if (!c || !c.fillText) return; c.fillStyle = 'rgba(11,20,48,.92)'; c.fillRect(0, 1146 - 150, 2048, 150); c.fillStyle = '#efe8da'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '900 84px "Archivo Black",Impact,sans-serif'; c.fillText('N3W 6529 MEME ISLAND', 1024, 1146 - 88); c.font = '500 30px "Archivo",Helvetica,sans-serif'; c.fillStyle = '#9fbcff'; c.fillText('THE MEMES BY 6529 · BY MLOW · N3WYORKERS.COM/ISLAND', 1024, 1146 - 30); t.needsUpdate = true; };
  const im = new Image(); im.onload = () => { try { c.drawImage(im, 0, 0, 2048, 1146); band(); } catch (e) { } }; im.src = 'assets/wall/billboard.webp'; if (c && c.fillRect) { c.fillStyle = '#16233f'; c.fillRect(0, 0, 2048, 1146); band(); }
  const mat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.0 }); RBB.mat = mat;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat); m.position.set(x - 0.2, y0 + H / 2, z); m.rotation.y = ry; m.castShadow = true; scene.add(m); RBB.mesh = m;
  const V = THREE.Vector3; facPut('steel', x - 0.02, y0 + H / 2, z, 0.12, H + 0.25, W + 0.25, 0);
  [-1, 1].forEach(s => { facBar(FACM.steel, new V(x + 0.4, top, z + s * 3.4), new V(x + 0.1, y0 + H, z + s * 3.4), 0.14, 0.14); facBar(FACM.steel, new V(x + 2.2, top, z + s * 3.4), new V(x + 0.15, y0 + H * 0.6, z + s * 3.4), 0.1, 0.1); });
  facPut('steel', x - 0.75, y0 - 0.12, z, 1.1, 0.06, W + 0.4, 0); facPut('steel', x - 1.28, y0 + 0.35, z, 0.04, 0.04, W + 0.4, 0);
  for (let i = 0; i < 5; i++) { const zz = z - W / 2 + 0.8 + i * (W - 1.6) / 4; facPut('steel', x - 0.9, y0 + H + 0.25, zz, 0.7, 0.05, 0.05, 0); facPut('bulb', x - 1.2, y0 + H + 0.18, zz, 0.3, 0.12, 0.36, 0); }
  facFlush(); WALLS.n++;
})();
window.__FRAMES.push(() => { try { if (RBB.mat) RBB.mat.emissiveIntensity = 0.55 * Math.min(1, (L.lamps || 0) * 1.3); } catch (e) { } });
