/* ================================================================
   v231 THE LOOK: REAL CHESS SETS (2026-11-23)
   The chess tables played with little cylinders. Now every board has a real Staunton set, turned on a lathe:
   pawns, rooks with their battlements, bishops with the mitre cut, a knight's head, the queen's coronet, the
   king's cross, in bone and ebony, standing where they should on the back rank. The tables get polished granite
   tops and pedestals, and the two hustlers each tape up a cardboard sign.
   ?chessset=0 turns it off.
   ================================================================ */
const CS2 = {};
window.__CS2 = CS2;
(function chessSets() {
  if (!LOOK.on || /chessset=0/.test(location.search) || !window.__CHESS || !CHESS.tables.length) return;
  const S = 0.075;   // one square
  const lathe = pts => { const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r * S, y * S)), 14); g.computeVertexNormals(); return g; };
  const base = [[0, 0], [0.34, 0], [0.34, 0.06], [0.3, 0.1], [0.22, 0.14]];
  const G = {
    pawn: lathe(base.concat([[0.13, 0.22], [0.1, 0.5], [0.17, 0.54], [0.1, 0.58], [0.13, 0.66], [0.13, 0.76], [0.08, 0.83], [0, 0.85]])),
    rook: lathe(base.concat([[0.17, 0.2], [0.15, 0.7], [0.22, 0.74], [0.22, 0.95], [0.16, 0.95], [0.16, 0.88], [0, 0.88]])),
    bishop: lathe(base.concat([[0.13, 0.22], [0.09, 0.62], [0.18, 0.66], [0.1, 0.7], [0.15, 0.82], [0.14, 0.98], [0.07, 1.08], [0.05, 1.12], [0.06, 1.15], [0, 1.18]])),
    queen: lathe(base.concat([[0.15, 0.24], [0.1, 0.8], [0.2, 0.85], [0.12, 0.9], [0.2, 1.12], [0.24, 1.2], [0.12, 1.2], [0.1, 1.26], [0.06, 1.3], [0, 1.34]])),
    king: lathe(base.concat([[0.15, 0.24], [0.1, 0.84], [0.2, 0.9], [0.12, 0.95], [0.2, 1.18], [0.12, 1.24], [0, 1.26]])),
    knight: lathe(base.concat([[0.2, 0.2], [0.16, 0.36], [0, 0.38]])) };
  const cross = new THREE.BoxGeometry(0.03 * S * 2, 0.22 * S, 0.03 * S * 2), crossH = new THREE.BoxGeometry(0.16 * S, 0.05 * S, 0.06 * S);
  const head = new THREE.BoxGeometry(0.22 * S, 0.5 * S, 0.44 * S);
  const back = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  const granite = new THREE.MeshStandardMaterial({ color: 0x55524e, roughness: 0.3, metalness: 0.05 }); CS2.granite = granite;
  const sign = signTex([{ t: 'CHESS $5', s: 0.36 }, { t: 'SPEED · 5 MIN · I PLAY ANYBODY', s: 0.12 }], 512, 256, '#c9a77a', '#1b1b1b');
  CHESS.tables.forEach((T, ti) => {
    T.G.children.forEach(o => { if (o.isMesh && o.geometry && (o.geometry.type === 'CylinderGeometry' && o.geometry.parameters.height > 0.3 || o.geometry.type === 'BoxGeometry' && o.geometry.parameters.width > 0.8)) o.material = granite; });
    // a bevelled lip round the top and a foot under the pedestal
    const lip = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.03, 0.96), granite); lip.position.y = 0.72; T.G.add(lip);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.4, 0.06, 14), granite); foot.position.y = 0.03; T.G.add(foot);
    T.pieces.forEach((p, i) => { const k = i % 16, col = k % 8, isPawn = k < 8, type = isPawn ? 'pawn' : back[col];
      p.geometry = G[type]; p.position.y = 0.787; p.rotation.set(0, 0, 0); p.castShadow = true;
      if (type === 'knight') { const h = new THREE.Mesh(head, p.material); h.position.set(0, 0.6 * S, 0.06 * S); h.rotation.x = -0.35; p.add(h); const sn = new THREE.Mesh(head, p.material); sn.scale.set(0.9, 0.5, 0.9); sn.position.set(0, 0.78 * S, 0.24 * S); sn.rotation.x = 0.6; p.add(sn);
        if (i >= 16) p.rotation.y = PI; }
      if (type === 'king') { const c1 = new THREE.Mesh(cross, p.material); c1.position.y = 1.36 * S; p.add(c1); const c2 = new THREE.Mesh(crossH, p.material); c2.position.y = 1.38 * S; p.add(c2); } });
    if (T.hustler) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.18), new THREE.MeshStandardMaterial({ map: sign, roughness: 0.95, side: THREE.DoubleSide })); s.position.set(0, 0.68, 0.455); s.rotation.y = 0; T.G.add(s); }
  });
  CS2.ok = true;
})();
