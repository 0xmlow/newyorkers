/* ================================================================
   v225 THE LOOK: N3W PARKS SIGNS (2026-11-23)
   Every New York park feature has the same green sign on a post at its gate. The island's get their own version:
   enamel green, a white rule, the Open Eye Flower where the city puts its leaf, N3W PARKS over the name of the
   place. At the handball court, the skate plaza, the rink and the dog run.
   ?parksigns=0 turns it off.
   ================================================================ */
const PKS = { n: 0 };
window.__PKS = PKS;
(function parksSigns() {
  if (!FAC_ON || /parksigns=0/.test(location.search)) return;
  const make = (name, sub) => { const cv = document.createElement('canvas'); cv.width = 768; cv.height = 384; const c = cv.getContext('2d'); const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO;
    if (!c || !c.fillText || !c.strokeRect) return t;
    const draw = img => { c.fillStyle = '#244232'; c.fillRect(0, 0, 768, 384); c.strokeStyle = '#efe8da'; c.lineWidth = 6; c.strokeRect(16, 16, 736, 352);
      if (img) c.drawImage(img, 40, 92, 200, 200); else { c.fillStyle = '#efe8da'; c.beginPath(); c.arc(140, 192, 70, 0, PI * 2); c.fill(); }
      c.fillStyle = '#efe8da'; c.textBaseline = 'middle'; c.font = '700 44px "Archivo Black",Impact,sans-serif'; c.fillText('N3W PARKS', 270, 118);
      c.fillRect(270, 152, 440, 4); c.font = `900 ${name.length > 12 ? 46 : 58}px "Archivo Black",Impact,sans-serif`; c.fillText(name, 270, 214);
      c.font = '400 26px "Archivo",Helvetica,sans-serif'; c.fillText(sub, 270, 280); t.needsUpdate = true; };
    draw(null); const im = new Image(); im.onload = () => { try { draw(im); } catch (e) { } }; im.src = 'assets/iv_flower.webp'; return t; };
  FACM.iron = FACM.iron || new THREE.MeshStandardMaterial({ color: 0x1d2b24, roughness: 0.55, metalness: 0.5 });
  const sign = (x, z, rot, name, sub) => { const gy = ground(x, z), m = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), new THREE.MeshStandardMaterial({ map: make(name, sub), roughness: 0.5, metalness: 0.1 }));
    m.position.set(x + Math.sin(rot) * 0.03, gy + 1.85, z + Math.cos(rot) * 0.03); m.rotation.y = rot; scene.add(m);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), FACM.iron); back.position.set(x - Math.sin(rot) * 0.0, gy + 1.85, z - Math.cos(rot) * 0.0); back.rotation.y = rot + PI; scene.add(back);
    facPut('iron', x - Math.sin(rot) * 0.04, gy + 1.15, z - Math.cos(rot) * 0.04, 0.07, 2.3, 0.07, rot); post(x, z, 0.12, -5, gy + 2.2); PKS.n++; };
  try { if (window.__HB2 && HB2.L2W) { const [x, z] = HB2.L2W(-2.7, 0.225 + 9.4 + 1.2); sign(x, z, WALLP.ry, 'HANDBALL', 'COURTS OPEN DAWN TO DUSK · BRING YOUR OWN BALL'); } } catch (e) { }
  try { if (window.__SK2 && SK2.ok) { const [x, z] = SK.L2W(-9.2, 1.5); sign(x, z, SK.ry - PI / 2, 'SKATE PLAZA', 'HELMETS RECOMMENDED · WAX IS NOT A CRIME'); } } catch (e) { }
  try { if (window.__RB2 && RB2.ok) { const gx = Math.cos(RINK.gapA), gz = Math.sin(RINK.gapA), x = RINK_AT.x + gx * (RINK_AT.a + 3.4) + gz * 1.6, z = RINK_AT.z + gz * (RINK_AT.b + 3.4) - gx * 1.6; sign(x, z, Math.atan2(gx, gz), 'THE RINK', 'SKATE COUNTERCLOCKWISE · NO HOCKEY STICKS'); } } catch (e) { }
  try { if (window.__DR2 && DR2.ok) { const x = DRUN_AT.x + DRUN_AT.w / 2 + 1.4, z = DRUN_AT.z + 1.2; sign(x, z, PI / 2, 'DOG RUN', 'SMALL DOGS WELCOME · BIG DOGS ALSO WELCOME'); } } catch (e) { }
  facFlush();
})();
