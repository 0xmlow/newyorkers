/* ================================================================
   v357 ILLUSION: THE CAMERA OBSCURA (2026-11-24)
   A small dark hut west of the handball court, navy enamel, a door on the island side and a pinhole in the wall that
   faces the sea. Step inside and the back wall is a live picture of the harbour outside, upside down and mirrored,
   moving: the boats, the El, the water, the sky. Before photography this was how painters traced the world. The
   pinhole is a camera rendering into a texture a few times a second, only while someone is inside. ?obscura=0 off.
   ================================================================ */
const OBS = { on: false, t: 0 };
window.__OBS = OBS;
(function obscura() {
  if (!LOOK.on || /obscura=0/.test(location.search)) return; const X = -69, Z = -27, g = ground(X, Z), W = 3.2, D = 3.2, H = 2.6; OBS.P = [X, g, Z];
  const navy = new THREE.MeshStandardMaterial({ color: 0x16233f, roughness: 0.6, metalness: 0.2 }), dark = new THREE.MeshStandardMaterial({ color: 0x050608, roughness: 1 });
  const B = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; scene.add(o); return o; };
  // walls: pinhole wall on -x (sea side), door on +x (island side), roof
  B(0.15, H, D, navy, X - W / 2, g + H / 2, Z); B(W, H, 0.15, navy, X, g + H / 2, Z - D / 2); B(W, H, 0.15, navy, X, g + H / 2, Z + D / 2);
  B(0.15, H, (D - 1.1) / 2, navy, X + W / 2, g + H / 2, Z - D / 4 - 0.275); B(0.15, H, (D - 1.1) / 2, navy, X + W / 2, g + H / 2, Z + D / 4 + 0.275); B(0.15, H - 2.1, 1.1, navy, X + W / 2, g + 2.1 + (H - 2.1) / 2, Z);
  B(W + 0.3, 0.14, D + 0.3, navy, X, g + H + 0.07, Z); const fl = B(W, 0.04, D, dark, X, g + 0.02, Z);
  wall(X - W / 2, Z - D / 2, X - W / 2, Z + D / 2, -5, g + H); wall(X - W / 2, Z - D / 2, X + W / 2, Z - D / 2, -5, g + H); wall(X - W / 2, Z + D / 2, X + W / 2, Z + D / 2, -5, g + H);
  wall(X + W / 2, Z - D / 2, X + W / 2, Z - 0.55, -5, g + H); wall(X + W / 2, Z + 0.55, X + W / 2, Z + D / 2, -5, g + H);
  // inside: the screen is the inner face of the door wall's opposite... the image lands on the wall facing the pinhole: the +x wall's inside
  const rt = new THREE.WebGLRenderTarget(320, 240); OBS.rt = rt; const cam = new THREE.PerspectiveCamera(70, 4 / 3, 0.5, 900); cam.position.set(X - W / 2 - 0.1, g + 1.6, Z); cam.lookAt(X - 60, g + 1.0, Z); OBS.cam = cam;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 2.1), new THREE.MeshBasicMaterial({ map: rt.texture, toneMapped: false })); scr.position.set(X - W / 2 + 0.09, g + 1.3, Z); scr.rotation.y = PI / 2; scr.scale.set(-1, -1, 1); scene.add(scr); OBS.scr = scr;
  // the pinhole, seen from outside
  const ph = new THREE.Mesh(new THREE.CircleGeometry(0.03, 12), new THREE.MeshBasicMaterial({ color: 0x000000 })); ph.position.set(X - W / 2 - 0.08, g + 1.6, Z); ph.rotation.y = -PI / 2; scene.add(ph);
  const lab = signTex([{ t: 'CAMERA OBSCURA', s: 0.28 }, { t: 'STEP IN. THE HARBOUR IS ON THE WALL, UPSIDE DOWN.', s: 0.1 }], 1024, 256, '#16233f', '#efe8da'); const l = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.45), new THREE.MeshBasicMaterial({ map: lab })); l.position.set(X + W / 2 + 0.08, g + 2.35, Z); l.rotation.y = PI / 2; scene.add(l);
  OBS.ok = true;
})();
// the screen is drawn from the scene in the room's own frame
window.__FRAMES.push(dt => { try { if (!OBS.ok) return; const d = Math.hypot(camera.position.x - OBS.P[0], camera.position.z - OBS.P[2]); const inside = d < 2.6; if (!inside && OBS.drawn) return; OBS.t -= dt; if (OBS.t > 0) return; OBS.t = inside ? 0.12 : 2;
  const was = renderer.getRenderTarget(); OBS.scr.visible = false; renderer.setRenderTarget(OBS.rt); renderer.render(scene, OBS.cam); renderer.setRenderTarget(was); OBS.scr.visible = true; OBS.drawn = true; } catch (e) { if (!OBS.err) { OBS.err = e; console.warn('v357 obscura', e); } } });
