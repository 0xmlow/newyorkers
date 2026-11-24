/* ================================================================
   v230 THE LOOK: INSIDE SPIN CYCLE 420 (2026-11-23)
   The laundromat had machines and a folding table and a lot of empty floor. Now it has what they all have: a row
   of moulded orange chairs along the window, a TV high on the wall nobody chose the channel for, the change
   machine and the detergent machine, a cork board of notices (ROOM FOR RENT, LOST SOCK, GUITAR LESSONS), laundry
   bags slumped by the table, and the sign over the dryers.
   ?laundin=0 turns it off.
   ================================================================ */
const LIN = { tv: null };
window.__LIN = LIN;
(function laundromatInside() {
  if (!FAC_ON || /laundin=0/.test(location.search) || !window.__LAUND || LAUND.g0 == null) return;
  const x0 = -86, z0 = -4, g0 = LAUND.g0, D = 5, W = 8;
  FACM.chair = FACM.chair || new THREE.MeshStandardMaterial({ color: 0xd8641e, roughness: 0.45 });
  FACM.cork = FACM.cork || new THREE.MeshStandardMaterial({ color: 0xa47c52, roughness: 0.95 });
  FACM.vend = FACM.vend || new THREE.MeshStandardMaterial({ color: 0x2962FF, roughness: 0.5 });
  // ---- chairs along the window, facing in
  LIN.chairs = []; for (let i = 0; i < 3; i++) { const z = z0 - 3.3 + i * 0.52, x = x0 + D / 2 - 0.55; LIN.chairs.push([x, g0, z, -PI / 2]); if (LOOK.on && !/props=0/.test(location.search)) continue;
    facPut('chair', x, g0 + 0.45, z, 0.44, 0.05, 0.44, 0); facPut('chair', x + 0.21, g0 + 0.72, z, 0.04, 0.5, 0.44, 0);
    facPut('steel', x, g0 + 0.22, z, 0.04, 0.44, 0.04, 0); facPut('steel', x, g0 + 0.02, z, 0.4, 0.03, 0.4, 0); }
  facPut('steel', x0 + D / 2 - 0.55, g0 + 0.36, z0 - 2.8, 0.5, 0.04, 1.6, 0);
  // ---- the TV on the side wall, high, with its bracket
  { const z = z0 - W / 2 + 0.3, x = x0 + 0.8; facPut('frameK', x, g0 + 2.75, z + 0.06, 1.1, 0.66, 0.06, 0); facPut('steel', x, g0 + 2.75, z + 0.0, 0.1, 0.1, 0.12, 0);
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 144; const c = cv.getContext('2d'); const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; LIN.cv = cv; LIN.c = c; LIN.t = t;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.56), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); m.position.set(x, g0 + 2.75, z + 0.095); scene.add(m); LIN.tv = m; }
  // ---- the change machine and the detergent machine by the door end
  { const z = z0 + W / 2 - 0.55, x = x0 + 1.2; facPut('ac', x, g0 + 0.85, z, 0.6, 1.7, 0.42, 0); facPut('frameK', x, g0 + 1.25, z - 0.215, 0.4, 0.3, 0.01, 0); facPut('lit', x, g0 + 1.25, z - 0.218, 0.32, 0.16, 0.01, 0);
    facPut('vend', x - 0.7, g0 + 0.8, z, 0.62, 1.6, 0.45, 0); facPut('glass', x - 0.7, g0 + 1.05, z - 0.23, 0.48, 0.8, 0.01, 0);
    for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) facPut('white', x - 0.88 + k * 0.12, g0 + 0.78 + r * 0.25, z - 0.18, 0.08, 0.14, 0.06, 0); }
  // ---- cork board of notices on the side wall
  { const z = z0 + W / 2 - 0.29, x = x0 - 0.6; facPut('cork', x, g0 + 1.7, z, 1.2, 0.8, 0.02, 0);
    const notes = signTex([{ t: 'ROOM FOR RENT · NO JPEG HOARDERS', s: 0.07 }, { t: 'LOST: ONE SOCK (BLUE)', s: 0.07 }, { t: 'GUITAR LESSONS · ASK FOR SAL', s: 0.07 }, { t: 'FOUND: ONE SOCK (BLUE)', s: 0.07 }, { t: 'DOG WALKER · MEMES OK', s: 0.07 }], 512, 340, '#efe8da', '#1b1b1b');
    const n = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.66), new THREE.MeshStandardMaterial({ map: notes, roughness: 0.9 })); n.position.set(x, g0 + 1.7, z - 0.015); n.rotation.y = PI; scene.add(n); }
  // ---- the sign over the dryers
  { const sg = signTex([{ t: 'NO DYEING · NO SNEAKERS IN THE DRYERS', s: 0.12 }, { t: 'ATTENDANT ON DUTY · NOT RESPONSIBLE FOR SOCKS', s: 0.09 }], 1024, 200, '#12302a', '#f2e6c8');
    const s = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.7), new THREE.MeshStandardMaterial({ map: sg, roughness: 0.7 })); s.position.set(x0 - D / 2 + 0.31, g0 + 3.0, z0 - 0.3); s.rotation.y = PI / 2; scene.add(s); }
  // ---- laundry bags slumped by the table
  { const bm = [new THREE.MeshStandardMaterial({ color: 0xe9e4d8, roughness: 0.95 }), new THREE.MeshStandardMaterial({ color: 0x3b5a8a, roughness: 0.9 }), new THREE.MeshStandardMaterial({ color: 0x8a2f3a, roughness: 0.9 })];
    [[x0 + 1.15, z0 - 1.9, 0], [x0 + 1.05, z0 - 1.3, 1], [x0 + 1.3, z0 + 0.6, 2]].forEach(([x, z, k]) => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 9), bm[k]); b.scale.set(1, 1.25, 0.9); b.position.set(x, g0 + 0.3, z); b.castShadow = true; scene.add(b);
      const n = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 8), bm[k]); n.position.set(x, g0 + 0.66, z); scene.add(n); }); }
  facFlush();
  LIN.ok = true;
})();
// the TV: whatever is on, the weather, then the Memes, then a cooking show nobody asked for
window.__FRAMES.push(dt => { try { if (!LIN.tv || !LIN.c || !LIN.c.fillRect) return; if (Math.hypot(P.x + 86, P.z + 4) > 30) return; LIN.tt = (LIN.tt || 0) + dt; if (LIN.tt < 0.25) return; LIN.tt = 0;
  const c = LIN.c, k = Math.floor(LIFE.t / 8) % 3, t = LIFE.t; c.fillStyle = ['#1c3f7a', '#0d0d0d', '#6a3a1c'][k]; c.fillRect(0, 0, 256, 144);
  c.fillStyle = '#ffffff'; c.font = '700 20px Arial,sans-serif'; c.fillText(['N3W 1 WEATHER', 'THE MEMES LIVE', 'COOKING WITH SAL'][k], 12, 28);
  c.fillStyle = ['#f2d230', '#2962FF', '#ff7a1a'][k]; c.fillRect(12 + (t * 40 % 180), 60, 50, 50); c.fillStyle = '#ffffff'; c.fillRect(0, 124, 256, 20); c.fillStyle = '#0d0d0d'; c.font = '400 13px Arial,sans-serif'; c.fillText('GM GM GM · SOCK FOUND ON 4TH ST · ', 6 - (t * 30 % 120), 138);
  LIN.t.needsUpdate = true; } catch (e) { } });
