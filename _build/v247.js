/* ================================================================
   v247 WALLPAPER: THE FIREFLY MURALS (2026-11-23)
   MLow's wallpapering technique, finally on the island. Seven murals and papers were painted in Adobe Firefly
   (Gemini 3.1 on MLow's Firefly account, his own Impermanent Vision paintings given as the two style references,
   2K, 16:9) and hung where the island had blank walls:
   - the back of the handball wall carries THE WITNESS: an Open Eye Flower radiating liquid contour rivers;
   - both long faces of SURVIVE get the concrete mural, the eye streaming across the board form, painted on the
     wall behind the buttresses so they stand in front of it like a real painted wall;
   - the census walk's long back wall carries the panorama: three eye flowers rising like suns over contour hills.
   The art is in assets/wall. wallTex(name, rx) loads one with repeats. ?wallpaper=0 turns them off.
   ================================================================ */
const WALLS = { on: LOOK.on && !/wallpaper=0/.test(location.search), n: 0, tex: {} };
window.__WALLS = WALLS;
function wallTex(name, rx, ry) { const k = name + (rx || 1) + 'x' + (ry || 1); if (WALLS.tex[k]) return WALLS.tex[k]; const t = tex('assets/wall/' + name + '.webp'); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO;
  if (rx || ry) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx || 1, ry || 1); } return WALLS.tex[k] = t; }
function wallMat(name, rx, ry, o) { o = o || {}; const m = new THREE.MeshStandardMaterial({ map: wallTex(name, rx, ry), roughness: o.rough || 0.82, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); m.userData.wall = name; return m; }
window.wallTex = wallTex; window.wallMat = wallMat;
(function fireflyMurals() {
  if (!WALLS.on) return;
  // the handball wall's back
  try { if (window.__WALLP && WALLP.G) WALLP.G.children.forEach(o => { if (o.isMesh && o.geometry.type === 'PlaneGeometry' && Math.abs(o.rotation.y - PI) < 1e-3) { o.material = wallMat('mural_eye'); WALLS.n++; } }); } catch (e) { }
  // SURVIVE: both long faces, x 22 to 66, from y 0.6 to 7.0, behind the buttresses
  try { [[39.9, -1, 'concrete'], [48.1, 1, 'hoarding']].forEach(([zf, s, nm]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(43.6, 6.2), wallMat(nm, 3, 1)); m.position.set(44, 0.6 + 3.1, zf + s * 0.012); m.rotation.y = s < 0 ? PI : 0; m.receiveShadow = true; scene.add(m); WALLS.n++; }); } catch (e) { }
  // the census walk's back: a strip along the ribbon, on the side away from the portraits
  try { const pts = []; for (let i = 0; i <= 24; i++) { const z = 46 + i * 1.6; pts.push([-11 - 2.2 * Math.sin(i / 24 * PI * 2), z]); }
    const P = [], U = [], I = []; let s = 0;
    for (let i = 0; i < pts.length; i++) { const [x, z] = pts[i], [x2, z2] = pts[Math.min(24, i + 1)], [x1, z1] = pts[Math.max(0, i - 1)]; const dx = x2 - x1, dz = z2 - z1, l = Math.hypot(dx, dz); const nx = -dz / l, nz = dx / l;
      if (i) s += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]); const g = ground(x, z), ox = x + nx * 0.262, oz = z + nz * 0.262;
      P.push(ox, g + 0.2, oz, ox, g + 6.1, oz); U.push(s / 38.4 * 2, 0, s / 38.4 * 2, 1); if (i) I.push(i * 2 - 2, i * 2, i * 2 - 1, i * 2 - 1, i * 2, i * 2 + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals();
    const mt = wallMat('hoarding', 1, 1); mt.side = THREE.DoubleSide; mt.map.wrapS = THREE.RepeatWrapping; const m = new THREE.Mesh(g, mt); m.receiveShadow = true; scene.add(m); WALLS.n++; } catch (e) { }
})();
