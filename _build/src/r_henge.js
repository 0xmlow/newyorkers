// MANHATTANHENGE. You stand in the middle of 42nd Street looking west: the plate is the street with the sun going down
// at the end of it, and the room's side walls are the facades of the canyon. As the sun sets, the shadow climbs the
// faces of the buildings, and every picture on them is word A in the sun and word B in the shade: SON in the light,
// SUN in the shadow. After dark it is B all over and the street lamps come on. The clock on the corner switches the
// street to the real New York sun: day or night, right now, near enough.
import { W, D } from './rooms.js';
import { PI, std, basic, box, glowTex } from './kit.js';
import { pairs, wipeMat, openPair, plaque, label } from './pairs.js';

export function henge(c, r, g, X) {
  const { THREE } = c, P = pairs('henge');
  // the facades are the room's own wallpaper (a brick front with fire escapes); the street runs north into the plate
  // the sidewalks and the yellow line down the middle
  for (const x of [1.4, 18.6]) g.add(box(c, 2.8, 0.14, D, std(c, 0x8a8680, { roughness: 0.8 }), x, 0.07, 0));   // the sidewalks under the facades
  for (let z = -7; z < 8; z += 3) g.add(box(c, 0.12, 0.01, 1.6, basic(c, 0xe8c020), W / 2, 0.005, z));   // the double yellow down the middle
  for (let x = 3.4; x < 16.8; x += 0.9) g.add(box(c, 0.5, 0.008, 2.4, basic(c, 0xe8e4d8), x, 0.004, 6.4));   // the crosswalk behind you
  // the sun is in the photograph at the end of the street; its light comes down the street toward you
  const key = new THREE.DirectionalLight(0xffa050, 2.5); key.position.set(W / 2, 8, -60); key.target.position.set(W / 2, 0, 8); g.add(key); g.add(key.target);
  // the crowd in the middle of 42nd Street with their phones up
  const crowd = ['workgirl', 'lensman', 'susan', 'flyer', 'writer'];
  // they stand in the street with their backs to you, phones up at the sun
  crowd.forEach((n, k) => { const x = 6.4 + k * 1.8, z = -3.4 + (k % 3) * 1.3; const m = c.glb(n, { h: 1.7 + (k % 2) * 0.08, x, z, ry: PI + (k - 2) * 0.12, parent: g }); c.post(X(x), z, 0.35);
    if (k === 2) c.clickable(m, () => { c.say(m, 'Twice a year the sun lines up with the street. Everybody stops in traffic. Same difference as a sunset anywhere, they say. They are wrong.', 4200, 2.0); c.egg('henge'); }, 'Somebody filming the sun'); });
  const cab = c.glb('h_taxi', { h: 1.5, x: 14.6, z: 3.6, ry: 0.05, parent: g }); c.post(X(14.6), 3.6, 1.2); c.post(X(14.6), 2.4, 1.0); c.post(X(14.6), 4.8, 1.0);
  // street lamps that come on after the sun
  const lamps = [];
  for (const [x, z] of [[2.6, -5.2], [17.4, -5.2], [2.6, 6.4], [17.4, 6.4]]) { c.glb('lamppost', { h: 4.4, x, z, parent: g }); c.post(X(x), z, 0.2); const l = new THREE.PointLight(0xffc070, 0, 9, 1.6); l.position.set(x, 4.0, z); g.add(l); lamps.push(l); }

  // ---- the pictures on the facades: A in the sun, B in the shadow, the shadow line climbing ----
  const PWd = 2.0, PHt = PWd / 0.74, pics = [];
  // on the facades either side of the street: the west faces catch the sun first, so they turn first
  const spots = [[0.2, -4.6, PI / 2], [0.2, -0.6, PI / 2], [W - 0.42, -4.6, -PI / 2], [W - 0.42, -0.6, -PI / 2]];   // the west face is at 0.12, this room's east face at W - 0.37
  P.slice(0, spots.length).forEach((p, k) => {
    const [x, z, ry] = spots[k], mat = wipeMat(c, p, { dir: 1, soft: 0.03, edge: 1 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(PWd, PHt), mat); m.position.set(x, 2.55, z); m.rotation.y = ry; m.translateZ(0.06); g.add(m);
    const fr = box(c, PWd + 0.18, PHt + 0.18, 0.06, std(c, 0x1a1a1a), x, 2.55, z); fr.rotation.y = ry; g.add(fr);   // behind the picture, never in its plane
    c.clickable(m, () => openPair(c, p, ['shadowline', 'The shadow climbs the building as the sun sets: the top of the picture is still one word while the bottom is already the other.']), label(p));
    const pl = plaque(c, g, p, x, 0.95, z, ry, 1.8); pl.translateZ(0.07);
    pics.push({ mat, phase: k * 0.06 });
  });
  // ---- the clock on the corner: STREET TIME (a sunset every minute) or NEW YORK TIME (the real sun) ----
  let live = false;
  const clk = new THREE.Group(); clk.position.set(2.2, 0, 2.6); clk.rotation.y = PI / 2; g.add(clk);
  clk.add(box(c, 0.16, 3.4, 0.16, std(c, 0x1e3a2a, { metalness: 0.6 }), 0, 1.7, 0)); c.post(X(2.2), 2.6, 0.3);
  const face = c.canvasTex(256, 256, () => {}), fq = face.userData.canvas.getContext('2d');
  const fm = new THREE.Mesh(new THREE.CircleGeometry(0.42, 32), new THREE.MeshBasicMaterial({ map: face, toneMapped: false })); fm.position.set(0, 3.5, 0.1); clk.add(fm);
  const drawFace = (txt, sub) => { fq.fillStyle = '#f4ead2'; fq.fillRect(0, 0, 256, 256); fq.fillStyle = '#1a1a1a'; fq.textAlign = 'center'; fq.font = `800 34px ${c.MONO}`; fq.fillText(txt, 128, 120); fq.font = `600 22px ${c.MONO}`; fq.fillText(sub, 128, 160); face.needsUpdate = true; };
  drawFace('STREET', 'TIME');
  c.clickable(fm, () => { live = !live; c.sound.click(); drawFace(live ? 'NEW YORK' : 'STREET', live ? 'TIME' : 'TIME'); c.toast(live ? 'New York time: the real sun over the city, right now. Day is the first word, night is the second.' : 'Street time: a sunset every minute.', 3600); c.egg('nytime', 'The clock switched the street to the real New York sun. A token could do this with no contract at all: day is one word, night is the other.'); }, 'The street clock');
  // the real sun, near enough: sunrise and sunset by the day of the year in New York
  const realSun = () => {
    const ny = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })), doy = (ny - new Date(ny.getFullYear(), 0, 0)) / 864e5, hr = ny.getHours() + ny.getMinutes() / 60;
    const s = Math.sin(2 * PI * (doy - 80) / 365), rise = 6.4 - 1.5 * s, set = 18.6 + 1.7 * s;
    return hr < rise || hr > set ? -0.2 : Math.sin(PI * (hr - rise) / (set - rise));
  };
  let T = 0;
  c.tick((t, dt, Pl, ri) => {
    if (ri !== r.i) return; T += dt;
    // street time: 46 s of sunset, 12 s of night, then up again
    const cyc = T % 58, h = live ? realSun() : (cyc < 46 ? 1 - cyc / 46 : -0.2);
    const up = Math.max(0, h);
    r.plateMesh && r.plateMesh.material && r.plateMesh.material.color && r.plateMesh.material.color.setScalar(0.35 + up * 0.65);   // the photograph dims with the day
    key.intensity = up * 2.8; key.position.y = 1 + up * 14;
    const night = h <= 0 ? 1 : Math.max(0, 1 - up * 6);
    lamps.forEach((l) => { l.intensity = night * 10; });
    // the shadow line on the pictures: the edge is the height the sun still reaches, a little later the further west
    for (const pc of pics) { pc.mat.uniforms.edge.value = h <= 0 ? -0.1 : Math.min(1.1, up * 1.25 - pc.phase); pc.mat.uniforms.dark.value = 0.55 + up * 0.45 + night * 0.25; }
  });
}
