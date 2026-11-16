// ---------- v4 (MLow: "4/10, I need 11/10... INSANE, something you could only do online... photo-ops, funny eggs") ----------

// THE WIRE HERALD ANGELS, built: the Tripo angels read as white blobs. These are what the real ones are, wire sculptures:
// a bell robe of ribs and hoops, a torso, two arched wings with inner feathers, an arm and a long raised trumpet, every wire
// a tube, studded with bulbs along its length. One geometry for all twelve.
const WANG = {};
function wireAngel(c) {
  const { THREE } = c;
  if (!WANG.geo) {
    const curves = [], V = (x, y, z) => new THREE.Vector3(x, y, z), cr = (pts, closed = false) => curves.push(new THREE.CatmullRomCurve3(pts, closed));
    const ring = (y, r, n = 18) => cr([...Array(n)].map((_, i) => { const a = i / n * PI * 2; return V(Math.cos(a) * r, y, Math.sin(a) * r * 0.85); }), true);
    for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2, s = Math.sin(a * 3) * 0.04; cr([V(Math.cos(a) * 0.58, 0.04, Math.sin(a) * 0.5), V(Math.cos(a) * (0.44 + s), 0.6, Math.sin(a) * 0.38), V(Math.cos(a) * 0.24, 1.25, Math.sin(a) * 0.2), V(Math.cos(a) * 0.16, 1.5, Math.sin(a) * 0.14)]); }
    [[0.04, 0.58], [0.35, 0.5], [0.72, 0.4], [1.1, 0.28], [1.48, 0.16]].forEach(([y, r]) => ring(y, r));
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; cr([V(Math.cos(a) * 0.16, 1.5, Math.sin(a) * 0.14), V(Math.cos(a) * 0.22, 1.66, Math.sin(a) * 0.16), V(Math.cos(a) * 0.12, 1.86, Math.sin(a) * 0.1)]); }
    ring(1.86, 0.12, 10);
    for (const s of [-1, 1]) {
      cr([V(s * 0.12, 1.78, -0.08), V(s * 0.5, 2.1, -0.28), V(s * 0.95, 2.62, -0.42), V(s * 1.05, 2.4, -0.4), V(s * 0.85, 1.75, -0.34), V(s * 0.55, 1.15, -0.26), V(s * 0.2, 1.4, -0.12)]);
      for (let k = 1; k <= 4; k++) { const t = k / 5; cr([V(s * 0.16, 1.62 - t * 0.2, -0.1), V(s * (0.35 + t * 0.4), 2.05 - t * 0.35, -0.24), V(s * (0.6 + t * 0.32), 2.4 - t * 0.75, -0.36)]); }
    }
    cr([V(0.16, 1.78, 0), V(0.3, 1.86, 0.18), V(0.12, 2.0, 0.34)]); cr([V(-0.16, 1.78, 0), V(-0.24, 1.9, 0.2), V(-0.08, 2.02, 0.34)]);
    const tr = new THREE.CatmullRomCurve3([V(0, 2.02, 0.2), V(0.02, 2.2, 0.55), V(0.04, 2.42, 0.95)]); curves.push(tr);
    const geos = curves.map((cv) => new THREE.TubeGeometry(cv, Math.max(8, Math.round(cv.getLength() * 26)), 0.011, 5, cv.closed));
    const bell = new THREE.TorusGeometry(0.11, 0.012, 6, 18); bell.rotateX(-0.5); bell.translate(0.04, 2.44, 0.97); geos.push(bell);
    const cone = new THREE.ConeGeometry(0.11, 0.2, 14, 1, true); cone.rotateX(-PI / 2 - 0.5); cone.translate(0.04, 2.4, 0.9); geos.push(cone);
    WANG.geo = mergeGeometries(geos.map((g) => g.toNonIndexed()), false);
    WANG.mat = new THREE.MeshStandardMaterial({ color: 0xece6da, metalness: 0.55, roughness: 0.32, emissive: 0x3a3226, side: THREE.DoubleSide });
    const pts = []; curves.forEach((cv) => { const n = Math.max(3, Math.round(cv.getLength() / 0.055)); for (let i = 0; i < n; i++) { const p = cv.getPointAt(i / n); pts.push([p.x, p.y, p.z, Math.random() * 0.5, [1, 0.86, 0.6]]); } });
    WANG.pts = pts;
  }
  const m = new THREE.Mesh(WANG.geo, WANG.mat); return { mesh: m, pts: WANG.pts };
}

// INTO THE TREE (only online): after the lighting, the STAR LIFT flies you across the plaza, into the middle of the 22,000
// lights, and up the trunk to the star, then sets you back down on the plaza
function starLift(c, r, g, X, onTreeLit) {
  const { THREE } = c, sg = c.sign('THE STAR LIFT\nAFTER THE LIGHTING', { w: 1.1, h: 0.42, bg: '#0d1b4a', fg: '#f5c542', font: c.SERIF, weight: 900 });
  sg.position.set(12.6, 1.35, -6.5); g.add(sg); g.add(c.slab(0.08, 1.15, 0.08, std(c, 0x222222), 12.6, 0.57, -6.52));
  c.clickable(sg, () => {
    if (!LT.tree) { c.toast('The lift runs only when the tree is lit. Press the switch first.', 2600); return; }
    const P = c.P, TZ = r.treeZ ?? -16.5, TH = RP.TH, pts = [[P.x, 1.7, P.z], [X(10), 2.6, -7], [X(10), 4.5, TZ + 22], [X(10), 3.4, TZ + 0.2], [X(10), 9, TZ], [X(10), 16, TZ + 0.05], [X(10), TH - 2.5, TZ + 0.1], [X(10), TH - 0.6, TZ - 0.1]].map(([x, y, z]) => new THREE.Vector3(x, y, z));
    snd(c, 'whoosh', 0.6, 3); c.toast('Hold on. Twenty two thousand lights, from the inside.', 3000);
    r.lifting = true;
    c.ride(new THREE.CatmullRomCurve3(pts), 19, () => { r.lifting = false; P.x = X(10); P.z = 2.5; P.yaw = 0; c.egg('inside', 'You went into the tree. Twenty two thousand lights in a spiral, the star at the top, and you in the middle of it. The real one does not take passengers. This one does.'); });
  }, 'The star lift');
  { const bark = std(c, 0x3a2a1c, { roughness: 0.95 }), TZ = r.treeZ ?? -16.5, tr = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.6, RP.TH - 1, 14), bark); tr.position.set(10, (RP.TH - 1) / 2, TZ); tr.userData.keep = true; g.add(tr);
    const N = 420, im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03, 0.09, 1, 6), bark, N), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    for (let i = 0; i < N; i++) { const y = 1.5 + Math.random() * (RP.TH - 3.5), len = (1 - y / RP.TH) * RP.TR * 0.92 * (0.6 + Math.random() * 0.4), a = Math.random() * PI * 2;
      e.set(0, -a, PI / 2 - 0.35); q.setFromEuler(e); m4.compose(new THREE.Vector3(10 + Math.cos(a) * len / 2, y, TZ + Math.sin(a) * len / 2), q, new THREE.Vector3(1, len, 1)); im.setMatrixAt(i, m4); }
    im.userData.keep = true; im.visible = false; g.add(im); r.limbs = im; }
  // inside the tree the needles would hide every bulb: they melt away as you enter, and you rise through the lights alone
  c.tick((t, dt, P, ri) => { const T = r.treeObj; if (!T || ri !== r.i) return; if (T.star && !T.star.k) { T.star.k = 1; [T.star.st, T.star.sm, T.star.glow, T.star.sparks].forEach((o) => o && o.traverse && o.traverse((q) => { q.userData.keep = true; })); } const d = Math.hypot(P.x - X(10), P.z - (r.treeZ ?? -16.5)), inside = r.lifting && d < 7.5; if (r.lifting && d < 3) { P.yaw = 0; P.pitch = 0.75; }
    T.group.traverse((o) => { if (o.isMesh && !o.isPoints && o.material && !o.userData.keep) { if (o.userData.op0 === undefined) { o.userData.op0 = o.material.opacity; o.material.transparent = true; }
      const want = inside ? 0.04 : o.userData.op0; if (r.limbs) r.limbs.visible = r.lifting; o.material.opacity += (want - o.material.opacity) * Math.min(1, dt * 3); o.visible = o.material.opacity > 0.05; } }); });
}

// STEP INSIDE THE SNOW GLOBE (only online): seventy floors up you shrink to one fortieth and stand on the plaza model under
// glass. Its towers become skyscrapers, the tree you lit becomes the real one, and the snow comes down in flakes the size of cars.
function shrinkModel(c, r, g, X) {
  const { THREE } = c, sg = c.sign('STEP INSIDE  >', { w: 0.9, h: 0.2, bg: '#2962ff', fg: '#ffffff', font: c.MONO, weight: 800 });
  sg.position.set(W / 2 + 1.6, 1.06, -1.12); g.add(sg);
  let inside = false, t0 = 0;
  const enter = () => { const P = c.P; if (inside) return; inside = true; t0 = 0; r.shrunk = { x: P.x, z: P.z };
    c.FX.warp = 0.9; snd(c, 'whoosh', 0.2, 2); r.near0 = c.camera.near; c.camera.near = 0.002; c.camera.updateProjectionMatrix(); P.scale = 1 / 40; P.lift = 0.965; P.x = X(W / 2 - 0.25); P.z = -2.05; P.yaw = -0.45; P.pitch = 0.2;   // on the paved plaza, not on the model's mirror rink
    c.toast('You are one fortieth of a New Yorker. Walk the plaza. Click again to come back.', 4200); c.egg('tiny', 'Seventy floors up, standing on the model of the plaza seventy floors down. The towers are skyscrapers again and the snow is the size of cars. Only online.'); };
  const leave = () => { const P = c.P; if (!inside) return; inside = false; c.camera.near = r.near0 || 0.05; c.camera.updateProjectionMatrix(); c.FX.warp = 0.6; P.scale = 1; P.lift = 0; P.x = r.shrunk.x; P.z = r.shrunk.z; snd(c, 'whoosh', 0.8, 1); };
  c.clickable(sg, () => (inside ? leave() : enter()), 'Step inside the model');
  c.tick((t, dt, P, ri) => { if (!inside) return; t0 += dt; c.FX.warp = Math.max(0, c.FX.warp - dt * 0.6);
    if (ri !== r.i || t0 > 90) leave();
    // keep the tiny visitor on the model's table top
    P.lift = 0.965; P.x = Math.max(X(W / 2 - 2.1), Math.min(X(W / 2 + 2.1), P.x)); P.z = Math.max(-3.95, Math.min(-1.25, P.z)); });
  addEventListener('keydown', (e) => { if (inside && (e.code === 'Escape' || e.code === 'KeyQ')) leave(); });
}

// PHOTO SPOTS (only online, and the share loop): a camera on a tripod in every room; click it and you are walked onto the
// spot, framed the way MLow would frame it, and the picture is taken, branded and saved to your computer
const SNAP = { want: null, hooked: false };
function hookSnap(c) {
  if (SNAP.hooked) return; SNAP.hooked = true; const R = c.renderer, orig = R.render.bind(R);
  R.render = (s, cam) => { orig(s, cam); if (SNAP.want && R.getRenderTarget() === null) { const f = SNAP.want; SNAP.want = null; try { f(R.domElement.toDataURL('image/jpeg', 0.93)); } catch (e) {} } };
}
function brandAndSave(c, url, r, line) {
  const img = new Image(); img.onload = () => {
    const w = img.width, h = img.height, band = Math.round(h * 0.11), cv = document.createElement('canvas'); cv.width = w; cv.height = h + band; const q = cv.getContext('2d');
    q.drawImage(img, 0, 0); q.fillStyle = '#05070c'; q.fillRect(0, h, w, band); q.fillStyle = '#c8a040'; q.fillRect(0, h, w, Math.max(2, band * 0.03));
    eyeFlower(q, band * 0.62, h + band / 2, band * 0.36);
    q.fillStyle = '#f2ebdd'; q.font = `700 ${Math.round(band * 0.34)}px Georgia, serif`; q.textBaseline = 'middle'; q.fillText('THE LIGHTINGS', band * 1.2, h + band * 0.36);
    q.fillStyle = '#9aa8c8'; q.font = `${Math.round(band * 0.2)}px Georgia, serif`; q.fillText(`${r.name} · ${line}`, band * 1.2, h + band * 0.7);
    q.fillStyle = '#2962ff'; q.font = `700 ${Math.round(band * 0.24)}px Georgia, serif`; q.textAlign = 'right'; q.fillText('N3WYORKERS.COM', w - band * 0.4, h + band / 2);
    cv.toBlob((b) => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `the-lightings-${r.id}.jpg`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); }, 'image/jpeg', 0.92);
  }; img.src = url;
}
function photoSpot(c, r, g, X, { at, look, cam, line }) {
  const { THREE } = c; hookSnap(c);
  const m = prop(c, r, g, X, 'ph_Camera_01', cam[0], cam[1], { h: 0.3, y: 1.35, ry: cam[2] || 0 });
  for (const a of [0, 2.1, 4.2]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.42, 5), std(c, 0x111111)); leg.position.set(cam[0] + Math.sin(a) * 0.18, 0.68, cam[1] + Math.cos(a) * 0.18); leg.rotation.set(Math.cos(a) * 0.13, 0, -Math.sin(a) * 0.13); g.add(leg); }
  c.post(X(cam[0]), cam[1], 0.3);
  const mark = c.sign('PHOTO SPOT', { w: 0.7, h: 0.18, bg: '#c8a040', fg: '#0a0a0c', font: c.MONO, weight: 800 }); mark.rotation.x = -PI / 2; mark.position.set(at[0], 0.03, at[1]); g.add(mark);
  c.clickable(m, () => { const P = c.P; P.x = X(at[0]); P.z = at[1]; P.yaw = look[0]; P.pitch = look[1]; snd(c, 'click');
    c.toast('Hold still. Three, two, one.', 1600);
    setTimeout(() => { SNAP.want = (url) => { c.flash && c.flash(0.5); snd(c, 'clink', 2800); brandAndSave(c, url, r, line); c.toast('Saved to your downloads. Post it, tag @n3wyorkers.', 3400); c.egg('photo', 'A picture from inside THE LIGHTINGS, branded and saved. The only souvenir shop in New York with no line.'); }; }, 1700); }, 'A photo spot');
}

// FUNNY THINGS, for the people who look closely
function jokes(c, r, g, X) {
  const { THREE } = c, J = JOKES[r.id] || {};
  if (J.asp) { const s = c.sign('ALTERNATE SIDE PARKING\nSUSPENDED\nCHRISTMAS DAY · NOT THE TREE', { w: 0.62, h: 0.62, bg: '#f4f4f0', fg: '#b4161e', font: c.MONO, weight: 800 }); s.position.set(J.asp[0], 2.3, J.asp[1]); s.rotation.y = J.asp[2] || 0; g.add(s);
    g.add(c.slab(0.05, 2.0, 0.05, std(c, 0x2a5a3a, { metalness: 0.6 }), J.asp[0], 1.0, J.asp[1] - 0.04)); c.clickable(s, () => c.egg('asp', 'Alternate side parking is suspended on Christmas Day, and on so many other holidays that New Yorkers know the calendar better than their own birthdays. The tree does not get a day off from the street sweeper.'), 'A parking sign'); }
  if (J.pigeon) { const p = c.glb('pigeon', { h: 0.3, x: J.pigeon[0], y: J.pigeon[2], z: J.pigeon[1], parent: g, shadow: false });
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 12), std(c, 0xb4161e, { roughness: 0.7 })); hat.position.set(J.pigeon[0] + 0.04, J.pigeon[2] + 0.33, J.pigeon[1]); hat.rotation.z = -0.4; g.add(hat);
    const pom = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), std(c, 0xffffff)); pom.position.set(J.pigeon[0] + 0.08, J.pigeon[2] + 0.38, J.pigeon[1]); g.add(pom);
    c.clickable(p, () => { snd(c, 'coo'); c.egg('pigeon', 'A pigeon in a Santa hat, on the lamp, judging the decorations. He has seen ninety holiday seasons on this block, and he does not tip.'); }, 'A pigeon in a hat'); }
  if (J.rat) { const o = new THREE.Group(); g.add(o); const rt = c.glb('rat', { h: 0.18, parent: o, shadow: true });
    const lk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.03, 18), std(c, 0xb87a30, { roughness: 0.8 })); lk.position.set(0, 0.06, 0.2); o.add(lk);
    c.tick((t, dt, P, ri) => { if (ri !== r.i) return; const u = (t * 0.07) % 1, x = J.rat[0] + (J.rat[2] - J.rat[0]) * u; o.position.set(x, 0.06, J.rat[1]); o.rotation.y = Math.atan2(J.rat[2] - J.rat[0], 0) - PI / 2 + PI; });
    c.clickable(rt, () => c.egg('ratlatke', 'A rat hauling a latke the size of himself across the plaza. In 2015 it was a slice. Traditions evolve.'), 'A rat with a latke'); }
  if (J.feed) { const s = c.sign('PLEASE DO NOT\nFEED THE ANGELS', { w: 0.7, h: 0.32, bg: '#0d3a24', fg: '#f2ebdd', font: c.SERIF, weight: 900 }); s.position.set(J.feed[0], 1.05, J.feed[1]); s.rotation.y = J.feed[2] || 0; g.add(s);
    c.clickable(s, () => c.egg('feed', 'Please do not feed the angels. They are wire, and they are on a strict diet of electricity.'), 'A sign'); }
  if (J.line) { const s = c.sign('LINE STARTS HERE\nEST. WAIT SINCE 1931', { w: 0.8, h: 0.34, bg: '#f5c542', fg: '#0a0a0c', font: c.MONO, weight: 800 }); s.position.set(J.line[0], 1.1, J.line[1]); s.rotation.y = J.line[2] || 0; g.add(s);
    g.add(c.slab(0.04, 0.95, 0.04, std(c, 0x111111), J.line[0], 0.48, J.line[1] - 0.03)); c.clickable(s, () => c.egg('line', 'The line to see the tree starts here, and has since 1931. The record wait is unconfirmed, because everyone who knows is still in it.'), 'A line sign'); }
}
const JOKES = {
  fifth: { asp: [18.4, 3.4, -PI / 2], pigeon: [18.4, -5.6, 3.85] },
  channel: { feed: [6.4, 1.5, 0.35], pigeon: [1.3, 5.2, 4.25] },
  tree: { line: [4.2, 3.0, 0.4], pigeon: [1.3, -0.6, 4.25] },
  menorah: { asp: [18.4, 3.2, -PI / 2], pigeon: [1.4, -4.6, 3.85] },
  brooklyn: { rat: [3.5, 6.2, 16.5], pigeon: [1.3, -4.8, 4.25] },
  dyker: { asp: [1.25, -4.2, PI / 2], rat: [4, 7, 16] },
};
const PHOTO = {
  fifth: { at: [10, 0.3], look: [0, 0.05], cam: [16.0, 1.2, 0.9], line: 'Fifth Avenue, the show across the street' },
  channel: { at: [10, 3.6], look: [0, 0.14], cam: [12.4, 7.2, 0.5], line: 'the Channel Gardens, twelve angels' },
  tree: { at: [10, 3.2], look: [0, 0.28], cam: [3.4, 4.4, -0.9], line: 'the tree, the night it was lit' },
  top: { at: [10, 4.6], look: [0, 0.02], cam: [4.0, 6.0, -0.8], line: 'seventy floors up' },
  menorah: { at: [9, 1.0], look: [-0.15, 0.22], cam: [3.6, 2.8, -0.9], line: 'Fifth and Fifty Ninth' },
  brooklyn: { at: [10, 2.2], look: [0, 0.16], cam: [16.2, 3.0, 0.9], line: 'Grand Army Plaza, Brooklyn' },
  window: { at: [10, -5.9], look: [0, 0.15], cam: [5.0, -4.2, -0.6], line: 'the answering windows' },
  dyker: { at: [10, 4.6], look: [0, 0.08], cam: [16.4, 5.6, 0.9], line: 'Dyker Heights' },
  rink: { at: [10, 5.4], look: [0, 0.05], cam: [3.6, 6.6, -0.8], line: 'the rink' },
};
function v4Room(c, r, g, X) {
  jokes(c, r, g, X);
  if (PHOTO[r.id]) photoSpot(c, r, g, X, PHOTO[r.id]);
  if (r.id === 'tree') starLift(c, r, g, X);
  if (r.id === 'top') shrinkModel(c, r, g, X);
}
