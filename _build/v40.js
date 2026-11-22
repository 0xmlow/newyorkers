/* ================================================================
   v40 PARK LIFE (2026-11-22)
   THE CHESS TABLES: three stone tables with inlaid boards in the eastern park, two hustlers waiting. E at a table
   plays a game of speed chess: the pieces move, the clock slaps, and you mostly lose (he wants five dollars, he
   accepts TDH). Beat him and it counts. A pigeon lady on the bench beside them throws crumbs every so often and
   the whole flock comes running.
   ================================================================ */
const CHESS = { tables: [], wins: 0, games: 0 };
window.__CHESS = CHESS;
const CHESS_AT = { x: 74, z: -21 };
(function chessTables() {
  const stone = new THREE.MeshStandardMaterial({ color: 0x8e8a82, roughness: 0.8 }), white = new THREE.MeshStandardMaterial({ color: 0xefe9dc, roughness: 0.4 }), black = new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.35 });
  const bcv = document.createElement('canvas'); bcv.width = bcv.height = 256; const c = bcv.getContext('2d'); if (c) for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { c.fillStyle = (i + j) % 2 ? '#2b2a28' : '#d8d0bd'; c.fillRect(i * 32, j * 32, 32, 32); }
  const bt = new THREE.CanvasTexture(bcv); bt.encoding = THREE.sRGBEncoding;
  const pawn = new THREE.CylinderGeometry(0.018, 0.026, 0.06, 8), king = new THREE.CylinderGeometry(0.022, 0.03, 0.1, 8);
  [[-3.2, 0], [0, 0], [3.2, 0]].forEach(([dx, dz], ti) => {
    const x = CHESS_AT.x + dx, z = CHESS_AT.z + dz, g0 = ground(x, z), G = new THREE.Group(); G.position.set(x, g0, z); scene.add(G);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 0.72, 12), stone); ped.position.y = 0.36; G.add(ped);
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.07, 0.9), stone); top.position.y = 0.75; G.add(top);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshStandardMaterial({ map: bt, roughness: 0.5 })); board.rotation.x = -PI / 2; board.position.y = 0.786; G.add(board);
    [-0.85, 0.85].forEach(sz => { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.45, 12), stone); st.position.set(0, 0.225, sz); G.add(st); });
    const pieces = []; for (let side = 0; side < 2; side++) for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(i === 4 ? king : pawn, side ? black : white); const col = i % 8, row = (i < 8 ? 1 : 0); const rr = side ? 7 - row : row;
      m.position.set(-0.2625 + col * 0.075, 0.79 + (i === 4 ? 0.05 : 0.03), -0.2625 + rr * 0.075); G.add(m); pieces.push(m); }
    const clock = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.08), black); clock.position.set(0.36, 0.83, 0); G.add(clock);
    let hustler = null; if (ti !== 1) { hustler = person(ti ? 0x6b5b45 : 0x2a2f45, 0x1d1d22, SKIN[(ti * 3) % SKIN.length], ti ? 'wiseguy' : 'cabbie'); hustler.g.position.set(x, g0 - 0.35, z - 0.85); hustler.g.rotation.y = 0; }
    if (typeof CIRCS !== 'undefined') CIRCS.push({ x, z, r: 0.6, y0: -5, y1: 3, on: true });
    const T = { x, z, G, pieces, clock, hustler, game: 0 }; CHESS.tables.push(T);
    if (hustler) interact(x, z + 1.3, 1.6, 'E · PLAY HIM AT SPEED CHESS', () => playChess(T));
  });
  const lab = signTex([{ t: 'THE CHESS TABLES', s: 0.38 }, { t: 'SPEED CHESS · HE HAS NOT LOST SINCE 2021', s: 0.13 }], 1024, 256, '#2f4a3a', '#FFFFFF');
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.55), new THREE.MeshBasicMaterial({ map: lab, toneMapped: false, side: THREE.DoubleSide })); sg.position.set(CHESS_AT.x, ground(CHESS_AT.x, CHESS_AT.z) + 2.4, CHESS_AT.z - 2.2); scene.add(sg);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6), stone); pole.position.set(CHESS_AT.x, ground(CHESS_AT.x, CHESS_AT.z) + 1.1, CHESS_AT.z - 2.25); scene.add(pole);
})();
const chessWin = secret('chesswin', () => { toast('YOU BEAT HIM. HE SAYS RUN IT BACK. HE SAYS IT EVERY TIME.', 'blue'); });
const chessPlay = secret('chess', () => { });
function playChess(T) {
  if (T.game > 0) return; chessPlay(); T.game = 9; CHESS.games++; toast('HE OPENS WITH E4. HE SLAPS THE CLOCK BEFORE YOU SIT DOWN.');
  const r = Math.random(); T.result = r < 0.2 ? 'win' : r < 0.3 ? 'draw' : 'lose';
}
function chessFrame(dt) {
  CHESS.tables.forEach(T => { if (T.game <= 0) return; const prev = T.game; T.game -= dt;
    if (Math.floor(prev * 2) !== Math.floor(T.game * 2) && T.game > 0.5) { const p = T.pieces[(Math.random() * T.pieces.length) | 0]; if (p.visible) { p.position.x = Math.max(-0.26, Math.min(0.26, p.position.x + (Math.random() - 0.5) * 0.15)); p.position.z = Math.max(-0.26, Math.min(0.26, p.position.z + (Math.random() - 0.5) * 0.15)); if (Math.random() < 0.18) p.visible = false; }
      if (Math.hypot(P.x - T.x, P.z - T.z) < 12) beep(160, 0.05, 'square', 0.04); T.clock.position.y = 0.83 - 0.01; setTimeout(() => T.clock.position.y = 0.83, 80); }
    if (T.hustler) T.hustler.g.rotation.z = Math.sin(LIFE.t * 6) * 0.02;
    if (T.game <= 0) { if (T.result === 'win') { CHESS.wins++; chessWin(); } else if (T.result === 'draw') toast('A DRAW. HE SAYS YOU GOT LUCKY. HE IS TECHNICALLY CORRECT.'); else { toast('CHECKMATE IN NINE. HE WANTS FIVE DOLLARS. HE ACCEPTS TDH.'); state.tdh = Math.max(0, state.tdh - 5); try { hud(); } catch (e) { } }
      T.pieces.forEach((p, i) => { p.visible = true; const col = i % 16 % 8, row = (i % 16) < 8 ? 1 : 0, side = i >= 16 ? 1 : 0, rr = side ? 7 - row : row; p.position.x = -0.2625 + col * 0.075; p.position.z = -0.2625 + rr * 0.075; }); } });
}

/* the pigeon lady */
const LADY = { t: 6 };
(function pigeonLady() {
  const x = CHESS_AT.x - 7, z = CHESS_AT.z + 3, g0 = ground(x, z); const wood = MAT.wood || new THREE.MeshStandardMaterial({ color: 0x6b4a2a }), iron = new THREE.MeshStandardMaterial({ color: 0x1d2b24, metalness: 0.6, roughness: 0.5 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.5), wood); seat.position.set(x, g0 + 0.45, z); scene.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.45, 0.06), wood); back.position.set(x, g0 + 0.75, z - 0.25); scene.add(back);
  [-0.9, 0.9].forEach(o => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.5), iron); l.position.set(x + o, g0 + 0.22, z); scene.add(l); });
  const lady = person(0x7b3f32, 0x2a2f45, SKIN[4], 'rosemary' in (CROWD.parts || {}) ? 'rosemary' : 'actress'); lady.g.position.set(x + 0.3, g0 - 0.35, z - 0.05); LADY.P = lady; LADY.x = x; LADY.z = z;
  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.3, 0.12), new THREE.MeshStandardMaterial({ color: 0xc9b089, roughness: 0.9 })); bag.position.set(x - 0.3, g0 + 0.62, z); scene.add(bag);
  if (typeof CIRCS !== 'undefined') CIRCS.push({ x, z, r: 1.0, y0: -5, y1: 3, on: true });
  interact(x, z + 1.0, 1.8, 'E · SIT WITH THE PIGEON LADY', secret('pigeonlady', () => { toast('SHE SAYS THE PIGEONS WERE HERE FIRST. SHE IS RIGHT.'); LIFE.feed && LIFE.feed(LADY.x, LADY.z + 2.5); }));
})();
function ladyFrame(dt) { LADY.t -= dt; if (LADY.t <= 0) { LADY.t = 22 + Math.random() * 12; if (LIFE.feed && Math.hypot(P.x - LADY.x, P.z - LADY.z) < 60) LIFE.feed(LADY.x, LADY.z + 2.5); } if (LADY.P) LADY.P.g.rotation.y = Math.sin(LIFE.t * 0.4) * 0.3; }
window.__FRAMES.push(dt => { try { chessFrame(dt); ladyFrame(dt); } catch (e) { if (!CHESS.err) { CHESS.err = e; console.warn('v40 park', e); } } });
