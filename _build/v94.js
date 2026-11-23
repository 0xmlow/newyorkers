/* ================================================================
   v94 THE ROOF AND THE SOPRANO (2026-11-22)
   Two things the brownstone does after dark. On the roof: a party, string lights on bamboo poles, a cooler, five
   people swaying, a speaker leaking bass you can feel from the street. In the third floor window: the neighbour
   who practises opera, a silhouette behind the curtain, singing scales up and down every evening from seven
   until eleven. Stand under the window and listen for a while.
   ================================================================ */
const ROOF = { p: [] };
window.__ROOF = ROOF;
(function roofAndSoprano() {
  const x0 = BROWN_AT.x, z0 = BROWN_AT.z, y = BROWN.g0 + BROWN.H + 0.05; ROOF.y = y; const grp = new THREE.Group(); scene.add(grp); ROOF.grp = grp;
  const poles = [[-3, -3.6], [3, -3.6], [3, 3.6], [-3, 3.6]].map(([dx, dz]) => [x0 + dx, z0 + dz]);
  poles.forEach(([x, z]) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 2.4, 6), new THREE.MeshStandardMaterial({ color: 0xc9b07a, roughness: 0.8 })); p.position.set(x, y + 1.2, z); grp.add(p); });
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd9a0, toneMapped: false }), 80); const o = new THREE.Object3D(); let k = 0;
  for (let s = 0; s < 4; s++) { const [ax, az] = poles[s], [bx, bz] = poles[(s + 1) % 4]; for (let i = 0; i < 20; i++) { const u = (i + 0.5) / 20; o.position.set(ax + (bx - ax) * u, y + 2.35 - Math.sin(u * PI) * 0.5, az + (bz - az) * u); o.updateMatrix(); bulbs.setMatrixAt(k++, o.matrix); } }
  grp.add(bulbs);
  const cooler = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.4), new THREE.MeshStandardMaterial({ color: 0x2962FF, roughness: 0.5 })); cooler.position.set(x0 + 1.5, y + 0.2, z0 + 2); grp.add(cooler);
  const spk = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.7, 0.35), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 })); spk.position.set(x0 + 2.4, y + 0.35, z0 - 2.5); grp.add(spk); ROOF.spk = spk;
  [0x7a1f2a, 0xefe8da, 0x2f4a33, 0xff3fa4, 0x15161a].forEach((sh, i) => { const p = person(sh, 0x2a2f45, SKIN[(i * 3) % SKIN.length], ['actress', 'writer', 'workgirl', 'editor', 'annieh'][i]); const a = i / 5 * PI * 2; p.g.position.set(x0 + Math.cos(a) * 1.8, y - 0.35, z0 + Math.sin(a) * 2.2); p.g.rotation.y = -a - PI / 2; ROOF.p.push({ P: p, ph: i * 1.3, a }); });
  // the soprano: a lit curtain on the third floor, middle bay, with a silhouette
  const fx = BROWN.fx, wy = BROWN.g0 + 1.9 + 2 * 3.1; ROOF.win = { x: fx - 0.5, z: z0, y: wy };
  const cur = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.75), new THREE.MeshBasicMaterial({ color: 0xffd9a0, toneMapped: false, transparent: true, opacity: 0 })); cur.position.set(fx - 0.03, wy, z0); cur.rotation.y = -PI / 2; scene.add(cur); ROOF.cur = cur;
  const sil = new THREE.Group(); const sm = new THREE.MeshBasicMaterial({ color: 0x2a1a10, transparent: true, opacity: 0 }); ROOF.silM = sm;
  const torso = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.75), sm); torso.position.y = -0.25; sil.add(torso); const head = new THREE.Mesh(new THREE.CircleGeometry(0.14, 14), sm); head.position.y = 0.3; sil.add(head);
  const arm = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.5), sm); arm.position.set(0.28, 0.0, 0); arm.rotation.z = -0.9; sil.add(arm); ROOF.arm = arm;
  sil.position.set(fx - 0.04, wy, z0 + 0.1); sil.rotation.y = -PI / 2; scene.add(sil); ROOF.sil = sil;
})();
const sopranoSecret = secret('soprano', () => { toast('THE NEIGHBOUR HITS THE HIGH ONE. SOMEONE ACROSS THE STREET CLAPS. SOMEONE ELSE YELLS AGAIN WITH THE SINGING.', 'blue'); });
let roofBass = null, sopV = null;
function roofFrame(dt) {
  const h = (SKY.t && SKY.t.hours) || 12, night = Math.min(1, (L.lamps || 0) * 1.4), party = night > 0.5, d = Math.hypot(P.x - BROWN_AT.x, P.z - BROWN_AT.z);
  ROOF.grp.visible = party; ROOF.p.forEach(q => q.P.g.visible = party); if (party) ROOF.p.forEach((q, i) => { q.P.g.rotation.z = Math.sin(LIFE.t * 2.1 + q.ph) * 0.08; q.P.g.position.y = ROOF.y - 0.35 + Math.abs(Math.sin(LIFE.t * 4.2 + q.ph)) * 0.04; });
  const audio = AC && AC.state === 'running' && oceanGain && oceanGain.gain.value > 0;
  if (party && audio && d < 45) { if (!roofBass) try { const o = AC.createOscillator(), g = AC.createGain(), f = AC.createBiquadFilter(); o.type = 'sine'; o.frequency.value = 52; f.type = 'lowpass'; f.frequency.value = 120; g.gain.value = 0; o.connect(f); f.connect(g); g.connect(AC.destination); o.start(); roofBass = { o, g }; } catch (e) { }
    if (roofBass) { const beat = (LIFE.t * 2.05) % 1; roofBass.g.gain.setTargetAtTime(Math.max(0, 0.06 - d * 0.0012) * (beat < 0.25 ? 1 : 0.15), AC.currentTime, 0.02); } }
  else if (roofBass) { try { roofBass.o.stop(); } catch (e) { } roofBass = null; }
  // the soprano, seven to eleven
  const sing = h >= 19 && h < 23; ROOF.cur.material.opacity += ((sing ? 0.85 : 0) - ROOF.cur.material.opacity) * Math.min(1, dt * 2); ROOF.silM.opacity = ROOF.cur.material.opacity * 0.9;
  if (sing) { ROOF.sil.position.z = BROWN_AT.z + 0.1 + Math.sin(LIFE.t * 0.4) * 0.12; ROOF.arm.rotation.z = -0.9 + Math.sin(LIFE.t * 1.3) * 0.5; }
  const wd = Math.hypot(P.x - ROOF.win.x, P.z - ROOF.win.z);
  if (sing && audio && wd < 35) { if (!sopV) try { const o = AC.createOscillator(), vib = AC.createOscillator(), vg = AC.createGain(), f1 = AC.createBiquadFilter(), f2 = AC.createBiquadFilter(), g = AC.createGain(); o.type = 'sawtooth'; vib.frequency.value = 5.5; vg.gain.value = 6; vib.connect(vg); vg.connect(o.frequency);
      f1.type = 'bandpass'; f1.frequency.value = 800; f1.Q.value = 6; f2.type = 'bandpass'; f2.frequency.value = 1150; f2.Q.value = 8; o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g); g.gain.value = 0; g.connect(AC.destination); o.start(); vib.start(); sopV = { o, vib, g }; } catch (e) { }
    if (sopV) { const scale = [523, 587, 659, 698, 784, 880, 988, 1047, 988, 880, 784, 698, 659, 587], n = Math.floor(LIFE.t * 1.6) % (scale.length + 4); const f = n < scale.length ? scale[n] : 0; sopV.o.frequency.setTargetAtTime(f || 523, AC.currentTime, 0.04); sopV.g.gain.setTargetAtTime(f ? Math.max(0, 0.05 - wd * 0.0013) : 0, AC.currentTime, 0.05); }
    if (wd < 12) { ROOF.listen = (ROOF.listen || 0) + dt; if (ROOF.listen > 12) sopranoSecret(); } }
  else if (sopV) { try { sopV.o.stop(); sopV.vib.stop(); } catch (e) { } sopV = null; }
}
window.__FRAMES.push(dt => { try { roofFrame(dt); } catch (e) { if (!ROOF.err) { ROOF.err = e; console.warn('v94 roof', e); } } });
