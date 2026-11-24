/* ================================================================
   v399 N3W CUTS AFTER DARK (2026-11-24)
   At dusk the barbershop's window throws a warm fan of light across the sand in front of it, and an OPEN sign in
   red neon comes on in the door glass, buzzing now and then the way old tubes do. Dawn puts both out.
   ================================================================ */
(function cutsNight() {
  if (!window.__CUTS || !CUTS.ok) return;
  const [cx, g, cz] = CUTS.c, [nx, nz] = CUTS.n, w = CUTS.win;
  const sp = document.createElement('canvas'); sp.width = 256; sp.height = 256; const c = sp.getContext('2d');
  if (c && c.createLinearGradient && c.createRadialGradient) { const gr = c.createRadialGradient(128, 0, 6, 128, 0, 230); gr.addColorStop(0, 'rgba(255,214,150,.9)'); gr.addColorStop(0.35, 'rgba(255,190,120,.35)'); gr.addColorStop(1, 'rgba(255,180,110,0)'); c.fillStyle = gr; c.fillRect(0, 0, 256, 256);
    c.globalCompositeOperation = 'destination-in'; const hz = c.createLinearGradient(0, 0, 256, 0); hz.addColorStop(0, 'rgba(0,0,0,0)'); hz.addColorStop(0.3, 'rgba(0,0,0,1)'); hz.addColorStop(0.7, 'rgba(0,0,0,1)'); hz.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = hz; c.fillRect(0, 0, 256, 256); c.globalCompositeOperation = 'source-over'; }
  const st = new THREE.CanvasTexture(sp); const spill = new THREE.Mesh(new THREE.PlaneGeometry(w.w + 2.5, 4.2), new THREE.MeshBasicMaterial({ map: st, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }));
  const [sx, sz] = CUTS.at(w.u, CUTS.D / 2 + 2.15); spill.position.set(sx, g + 0.04, sz); spill.rotation.order = 'YXZ'; spill.rotation.set(-PI / 2, CUTS.ry, 0); scene.add(spill); CUTS.spill = spill;
  const nv = document.createElement('canvas'); nv.width = 512; nv.height = 192; const n = nv.getContext('2d');
  if (n && n.fillText && n.strokeText) { n.clearRect(0, 0, 512, 192); n.font = '700 120px "Archivo",Helvetica,sans-serif'; n.textAlign = 'center'; n.textBaseline = 'middle'; n.shadowColor = '#ff3030'; n.shadowBlur = 30; n.strokeStyle = '#ff5a4a'; n.lineWidth = 9; n.strokeText('OPEN', 256, 100); n.shadowBlur = 0; n.strokeStyle = '#ffe1d8'; n.lineWidth = 3; n.strokeText('OPEN', 256, 100); }
  const nt = new THREE.CanvasTexture(nv); const neon = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.23), new THREE.MeshBasicMaterial({ map: nt, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  const [ox, oz] = CUTS.at(CUTS.door.u, CUTS.D / 2 + 0.06); neon.position.set(ox, g + 1.72, oz); neon.rotation.y = CUTS.ry; scene.add(neon); CUTS.neon = neon; CUTS.nightOk = true;
})();
window.__FRAMES.push(dt => { try { if (!CUTS.nightOk) return; const k = Math.min(1, (L.lamps || 0) * 1.3); CUTS.spill.material.opacity = 0.4 * k; CUTS.spill.visible = k > 0.01;
  let f = 1; if (Math.random() < 0.012) CUTS.buzz = 0.12; if (CUTS.buzz > 0) { CUTS.buzz -= dt; f = Math.random() < 0.5 ? 0.25 : 1; } CUTS.neon.material.opacity = k * f; CUTS.neon.visible = k > 0.01; } catch (e) { } });
