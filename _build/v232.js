/* ================================================================
   v232 THE LOOK: THE POET'S CORNER (2026-11-23)
   The poet sat on a floating seat at a bare table in the grass. Now his corner looks like a pitch somebody has
   kept for years: a folding chair with a back and legs, a canvas market umbrella, a worn rug under the table, a
   milk crate of paper and carbon, a little battery lamp that comes on at dusk, and behind him a line strung
   between two poles with finished poems pegged to it, turning in the wind.
   ?poet2=0 turns it off.
   ================================================================ */
const PO2 = { sheets: [], lamp: null };
window.__PO2 = PO2;
(function poetCorner() {
  if (!LOOK.on || /poet2=0/.test(location.search) || !window.__POET || !POET.g) return;
  const g = POET.g, M = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  const steel = new THREE.MeshStandardMaterial({ color: 0x8a9096, roughness: 0.4, metalness: 0.7 }), canvas = new THREE.MeshStandardMaterial({ color: 0xd9cdb2, roughness: 0.9, side: THREE.DoubleSide });
  // the chair's back and legs
  M(new THREE.BoxGeometry(0.42, 0.36, 0.03), steel, 0, 0.66, -0.36); [[-0.19, -0.33], [0.19, -0.33], [-0.19, 0.03], [0.19, 0.03]].forEach(([x, z]) => M(new THREE.BoxGeometry(0.025, 0.45, 0.025), steel, x, 0.225, z));
  // the umbrella
  M(new THREE.CylinderGeometry(0.02, 0.02, 2.3, 8), new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 0.6 }), 0.62, 1.15, 0.2);
  const can = M(new THREE.ConeGeometry(1.25, 0.42, 8, 1, true), canvas, 0.62, 2.18, 0.2); can.castShadow = true;
  M(new THREE.CylinderGeometry(0.035, 0.05, 0.12, 8), steel, 0.62, 0.06, 0.2);
  // the rug
  const rc = document.createElement('canvas'); rc.width = 256; rc.height = 160; const c = rc.getContext('2d');
  if (c && c.fillRect && c.beginPath && c.strokeRect && c.arc) { c.fillStyle = "#7a2a2a"; c.fillRect(0, 0, 256, 160); c.strokeStyle = '#d9b77a'; c.lineWidth = 8; c.strokeRect(14, 14, 228, 132); c.fillStyle = '#1f3a5a'; c.fillRect(40, 40, 176, 80); c.fillStyle = '#d9b77a'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(64 + i * 32, 80, 9, 0, PI * 2); c.fill(); }
    for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(0,0,0,${Math.random() * 0.15})`; c.fillRect(Math.random() * 256, Math.random() * 160, 3, 3); } }
  const rt = new THREE.CanvasTexture(rc); rt.encoding = THREE.sRGBEncoding;
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.3), new THREE.MeshStandardMaterial({ map: rt, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 })); rug.rotation.x = -PI / 2; rug.position.set(0, 0.03, 0.15); rug.receiveShadow = true; g.add(rug);
  // the crate of paper
  M(new THREE.BoxGeometry(0.36, 0.3, 0.3), new THREE.MeshStandardMaterial({ color: 0x2a5a9a, roughness: 0.6 }), -0.72, 0.15, 0.05); M(new THREE.BoxGeometry(0.3, 0.12, 0.24), new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.9 }), -0.72, 0.31, 0.05);
  // the lamp
  M(new THREE.CylinderGeometry(0.04, 0.05, 0.14, 10), steel, -0.42, 0.83, 0.5); PO2.lamp = new THREE.MeshStandardMaterial({ color: 0x302820, emissive: 0xffd9a0, emissiveIntensity: 0 }); M(new THREE.SphereGeometry(0.05, 10, 8), PO2.lamp, -0.42, 0.93, 0.5);
  // the line of finished poems behind him
  [-1.3, 1.3].forEach(x => M(new THREE.CylinderGeometry(0.02, 0.025, 1.9, 6), steel, x, 0.95, -0.9));
  M(new THREE.CylinderGeometry(0.004, 0.004, 2.6, 4), new THREE.MeshBasicMaterial({ color: 0x222222 }), 0, 1.8, -0.9).rotation.z = PI / 2;
  const pt = signTex([{ t: 'the island', s: 0.1, f: 'Courier New, monospace', b: false }, { t: 'keeps its lights', s: 0.08, f: 'Courier New, monospace', b: false }, { t: 'on for nobody', s: 0.08, f: 'Courier New, monospace', b: false }, { t: 'and for you', s: 0.08, f: 'Courier New, monospace', b: false }], 256, 330, '#f4f2ea', '#2a2a2a');
  const pm = new THREE.MeshStandardMaterial({ map: pt, roughness: 0.9, side: THREE.DoubleSide });
  for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.26), pm); const piv = new THREE.Group(); piv.position.set(-1.05 + i * 0.42, 1.79, -0.9); s.position.y = -0.14; piv.add(s); g.add(piv); PO2.sheets.push({ piv, ph: i * 1.3 }); }
  PO2.ok = true;
})();
window.__FRAMES.push(() => { try { if (!PO2.ok) return; if (Math.hypot(P.x - POET.X, P.z - POET.Z) > 40) return; PO2.sheets.forEach(s => { s.piv.rotation.x = Math.sin(LIFE.t * 1.7 + s.ph) * 0.18; s.piv.rotation.y = Math.sin(LIFE.t * 0.9 + s.ph) * 0.25; }); PO2.lamp.emissiveIntensity = 2.0 * Math.min(1, (L.lamps || 0) * 1.3); } catch (e) { } });
