/* ================================================================
   v95 THE NEWSSTAND (2026-11-22)
   A green newsstand kiosk at (40, 32): magazines clipped up the front (Meme covers), papers in a rack, gum, a
   little TV inside, and a man who has seen everything. E buys a scratch-off for one TDH: scratch it (it takes a
   second) and win nothing, a little, or, very rarely, the big one. Hitting the big one counts.
   ================================================================ */
const NEWS = { n: 0 };
window.__NEWS = NEWS;
const NEWS_AT = { x: 40, z: 32 };
(function newsstand() {
  const x0 = NEWS_AT.x, z0 = NEWS_AT.z, g0 = ground(x0, z0), ry = Math.atan2(-x0, -z0); NEWS.ry = ry;
  const g = new THREE.Group(); g.position.set(x0, g0, z0); g.rotation.y = ry; scene.add(g);
  const green = new THREE.MeshStandardMaterial({ color: 0x1f3a2a, roughness: 0.6, metalness: 0.2 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.6, 2.0), green); body.position.y = 1.3; g.add(body);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 2.6), green); roof.position.set(0, 2.66, 0.25); g.add(roof);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.8), new THREE.MeshStandardMaterial({ color: 0x0c0e11, roughness: 0.1, emissive: 0xffe2b0, emissiveIntensity: 0.3 })); win.position.set(0, 1.55, 1.01); g.add(win); NEWS.win = win;
  const sg = signTex([{ t: 'NEWS · LOTTO · GUM', s: 0.34 }], 1024, 140, '#1f3a2a', '#efe8da'); const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.4), new THREE.MeshBasicMaterial({ map: sg })); sign.position.set(0, 2.4, 1.01); g.add(sign);
  for (let i = 0; i < 10; i++) { const m = memeMesh(MEME_NS[(i * 41 + 3) % MEME_NS.length], 0.36); if (m) { const side = i < 5 ? -1 : 1, k = i % 5; m.position.set(side * (0.95 + (k % 2) * 0.32), 0.6 + Math.floor(k / 2) * 0.42, 1.02); g.add(m); } }
  const rack = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 0.35), new THREE.MeshStandardMaterial({ color: 0xe9e4da, roughness: 0.8 })); rack.position.set(0, 0.55, 1.2); g.add(rack);
  const man = person(0x2a2d33, 0x2a2f45, SKIN[1], 'cabbie'); man.g.position.set(x0 + Math.cos(ry) * 1.9 + Math.sin(ry) * 0.5, g0 - 0.35, z0 - Math.sin(ry) * 1.9 + Math.cos(ry) * 0.5); man.g.rotation.y = ry; man.g.scale.setScalar(0.92);
  boxWalls(x0, z0, 3.0, 2.0, ry, -5, g0 + 2.7);
  interact(x0 + Math.sin(ry) * 1.9, z0 + Math.cos(ry) * 1.9, 1.7, 'E · BUY A SCRATCH-OFF (1 TDH)', () => newsScratch());
  if (window.__MAP) MAP.places.push(['NEWSSTAND', x0, z0, x0 + Math.sin(ry) * 2.6, z0 + Math.cos(ry) * 2.6]);
})();
const newsSecret = secret('jackpot', () => { toast('THREE EYES IN A ROW. JACKPOT: 420 TDH. THE MAN AT THE NEWSSTAND HAS NEVER SEEN THIS AND HE HAS SEEN EVERYTHING.', 'blue'); });
function newsScratch() { if (NEWS.busy) return; NEWS.busy = true; state.tdh = Math.max(0, state.tdh - 1); try { hud(); } catch (e) { } NEWS.n++; toast('YOU SCRATCH WITH A QUARTER...');
  setTimeout(() => { NEWS.busy = false; const r = Math.random(), big = r < 0.02 || NEWS.n === 50; if (big) { state.tdh += 420; newsSecret(); } else if (r < 0.22) { state.tdh += 2; toast('TWO EYES. YOU WIN 2 TDH. YOU ARE UP ONE. DO NOT DO THE MATH ON THE OTHERS.'); } else if (r < 0.3) { state.tdh += 5; toast('FIVE TDH. THE MAN SAYS NICE, LIKE HE MEANS IT.'); } else toast(['NOTHING. THE MAN SAYS NEXT ONE.', 'NOTHING. ONE EYE, ONE SLICE, ONE PIGEON.', 'NOTHING. SO CLOSE. IT IS ALWAYS SO CLOSE.'][NEWS.n % 3]); try { hud(); } catch (e) { } }, 1300); }
window.__FRAMES.push(dt => { try { NEWS.win.material.emissiveIntensity = 0.3 + Math.min(1, (L.lamps || 0) * 1.4) * 0.6 + Math.sin(LIFE.t * 7) * 0.05; } catch (e) { } });
