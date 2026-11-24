/* ================================================================
   v348 THE STOOP SALE'S FRAMED CARDS (2026-11-24)
   Leaning against the table legs and the stoop's railing, five old gilt frames, each with a 6529 card in it, the
   kind of thing you find at a stoop sale and cannot believe is free. The cards change every hour.
   ================================================================ */
(function saleFrames() {
  if (!window.__SALE || !SALE.P) return; const [x, g, z] = SALE.P, gold = new THREE.MeshStandardMaterial({ color: 0xa8843e, roughness: 0.35, metalness: 0.85 }); const k = Math.floor(Date.now() / 3600000);
  const pool = CARDS.filter(c => c.uv && c.uv[5] > 0.65 && c.uv[5] < 1.4);
  [[-0.75, -0.6, 0.55], [-0.78, 0.05, 0.42], [-0.76, 0.7, 0.5], [0.0, 1.15, 0.38], [0.6, -1.3, 0.46]].forEach(([dx, dz, h], i) => { const c = pool[(k * 11 + i * 53) % pool.length]; const card = memeMesh(c.n, h); if (!card) return;
    const w = h * c.uv[5], G = new THREE.Group(); G.position.set(x + dx, g + h / 2 + 0.05, z + dz); G.rotation.set(0, -PI / 2 + (i % 2 ? 0.15 : -0.1), -0.18); scene.add(G);
    const fr = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, h + 0.12, 0.04), gold); fr.castShadow = true; G.add(fr); card.position.z = 0.022; G.add(card); });
})();
