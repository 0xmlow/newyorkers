/* ================================================================
   v234 THE LOOK: LIFEGUARD STANDS (2026-11-23)
   GM Beach is full of art already, so it gets the one thing every city beach from Coney Island to the Rockaways
   has and nothing else: two tall white wooden lifeguard chairs at its ends, facing the water, a red rescue can on
   the rail, a flag on a pole, and a board that says what it always says in November.
   ?lifeguard=0 turns it off.
   ================================================================ */
const LGD = { flags: [] };
window.__LGD = LGD;
(function lifeguards() {
  if (!FAC_ON || /lifeguard=0/.test(location.search) || typeof shoreZ !== 'function') return;
  FACM.lgWood = FACM.lgWood || new THREE.MeshStandardMaterial({ color: 0xefece4, roughness: 0.75 });
  FACM.lgRed = FACM.lgRed || new THREE.MeshStandardMaterial({ color: 0xc8241e, roughness: 0.5 });
  const board = signTex([{ t: 'NO LIFEGUARD ON DUTY', s: 0.15 }, { t: 'SWIMMING PROHIBITED · SEE YOU IN MAY', s: 0.09 }], 512, 256, '#c8241e', '#ffffff');
  const flagM = new THREE.MeshStandardMaterial({ color: 0xe8b819, roughness: 0.8, side: THREE.DoubleSide });
  [-22, 22].forEach(x => { const zs = shoreZ(x), z = zs - 5.5, g = ground(x, z), ry = 0;   // facing +z, the water
    const V = THREE.Vector3;
    // four raked legs, cross braces, the platform, the seat with back and arms, a ladder
    [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]].forEach(([a, b]) => facBar(FACM.lgWood, new V(x + a * 1.3, g, z + b * 1.3), new V(x + a * 0.8, g + 2.0, z + b * 0.8), 0.14, 0.14));
    [0.6, 1.3].forEach(y => { const k = 1.3 - (1.3 - 0.8) * y / 2.0; facPut('lgWood', x, g + y, z - 0.7 * k, 1.4 * k + 0.1, 0.08, 0.06, 0); facPut('lgWood', x, g + y, z + 0.7 * k, 1.4 * k + 0.1, 0.08, 0.06, 0);
      facPut('lgWood', x - 0.7 * k, g + y, z, 0.06, 0.08, 1.4 * k + 0.1, 0); facPut('lgWood', x + 0.7 * k, g + y, z, 0.06, 0.08, 1.4 * k + 0.1, 0); });
    facPut('lgWood', x, g + 2.05, z, 1.4, 0.08, 1.4, 0);
    facPut('lgWood', x, g + 2.5, z - 0.55, 1.1, 0.07, 0.45, 0); facPut('lgWood', x, g + 2.95, z - 0.78, 1.1, 0.85, 0.07, 0);
    [-0.55, 0.55].forEach(d => { facPut('lgWood', x + d, g + 2.75, z - 0.45, 0.07, 0.07, 0.7, 0); facPut('lgWood', x + d, g + 2.4, z - 0.15, 0.07, 0.7, 0.07, 0); });
    [-0.25, 0.25].forEach(d => facBar(FACM.lgWood, new V(x + d, g, z - 2.0), new V(x + d, g + 2.05, z - 0.75), 0.06, 0.05));
    for (let s = 1; s < 7; s++) { const t = s / 7; facPut('lgWood', x, g + t * 2.05, z - 2.0 + t * 1.25, 0.56, 0.04, 0.12, 0); }
    // the rescue can on the rail, the board on the front legs
    facPut('lgRed', x + 0.45, g + 2.25, z + 0.72, 0.7, 0.18, 0.12, 0);
    const b = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), new THREE.MeshStandardMaterial({ map: board, roughness: 0.6 })); b.position.set(x, g + 1.0, z + 1.02); scene.add(b);
    const b2 = b.clone(); b2.position.z = z - 1.02; b2.rotation.y = PI; scene.add(b2);
    // the flag pole and a yellow flag (caution) that flaps
    facPut('steel', x + 1.0, g + 3.6, z + 0.7, 0.05, 3.2, 0.05, 0);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5, 6, 1), flagM); const piv = new THREE.Group(); piv.position.set(x + 1.0, g + 4.9, z + 0.7); fl.position.x = 0.42; piv.add(fl); scene.add(piv); LGD.flags.push({ piv, fl, base: fl.geometry.attributes.position.array.slice() });
    post(x, z, 1.0, -5, g + 3.2);
  });
  facFlush();
  LGD.ok = true;
})();
window.__FRAMES.push(() => { try { if (!LGD.ok || Math.abs(P.z - 120) > 80) return; LGD.flags.forEach((f, i) => { const a = f.fl.geometry.attributes.position, b = f.base; for (let k = 0; k < a.count; k++) { const x = b[k * 3]; a.array[k * 3 + 2] = Math.sin(LIFE.t * 5 + x * 6 + i) * 0.08 * (x + 0.4); } a.needsUpdate = true; f.piv.rotation.y = 0.6 + Math.sin(LIFE.t * 0.4 + i) * 0.2; }); } catch (e) { } });
