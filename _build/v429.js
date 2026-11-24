/* ================================================================
   v429 N3W CUTS FLIES A FLAG (2026-11-24)
   A pole on N3W CUTS' roof with a navy flag carrying the Open Eye Flower, snapping in the island's wind: the cloth
   waves in the vertex shader, fastest at the free edge, so it reads from the road and from the water.
   ================================================================ */
(function cutsFlag() {
  if (!window.__CUTS || !CUTS.ok) return; const [x, z] = CUTS.at(CUTS.W / 2 - 0.6, -CUTS.D / 2 + 0.6), y = CUTS.g + CUTS.H;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 3.2, 10), new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.25, metalness: 0.9 })); pole.position.set(x, y + 1.6, z); scene.add(pole);
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 320; const c = cv.getContext('2d'); const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding;
  const draw = img => { if (!c || !c.fillRect) return; c.fillStyle = '#16233f'; c.fillRect(0, 0, 512, 320); c.fillStyle = '#2962FF'; c.fillRect(0, 280, 512, 40); if (img) c.drawImage(img, 156, 40, 200, 200); t.needsUpdate = true; };
  draw(null); const im = new Image(); im.onload = () => { try { draw(im); } catch (e) { } }; im.src = 'assets/iv_flower.webp';
  const geo = new THREE.PlaneGeometry(1.6, 1.0, 24, 12); geo.translate(0.8, 0, 0); const U = { uT: { value: 0 } };
  const mat = new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: 0.8 });
  mat.onBeforeCompile = sh => { sh.uniforms.uT = U.uT; sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = position; float k = position.x / 1.6; transformed.z += sin(position.x * 4.0 - uT * 7.0) * 0.12 * k + sin(position.y * 3.0 + uT * 5.0) * 0.04 * k; transformed.y -= k * k * 0.06;'); };
  mat.customProgramCacheKey = () => 'flag429';
  const f = new THREE.Mesh(geo, mat); f.position.set(x, y + 2.7, z); f.rotation.y = CUTS.ry + PI * 0.6; f.castShadow = true; scene.add(f); CUTS.flag = { f, U };
})();
window.__FRAMES.push(dt => { try { if (CUTS.flag) CUTS.flag.U.uT.value += dt; } catch (e) { } });
