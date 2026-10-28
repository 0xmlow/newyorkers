// THE TUNNEL BLINK. A 6 train between stations. Every picture in the car is word A, until the lights stutter and go
// out in the tunnel; when they come back, every picture is word B. Next blink, back again. The car rocks, the
// tunnel lights streak past the windows, and the doors in the middle chime and close on a pair of their own.
import { W, D } from './rooms.js';
import { PI, std, basic, box, cyl } from './kit.js';
import { pairs, pairTex, openPair, plaque, label } from './pairs.js';

const ZN = 1.85, ZS = 5.75, CH = 2.45;   // the car's two walls and its ceiling

export function subway(c, r, g, X) {
  const { THREE } = c, P = pairs('subway');
  const car = new THREE.Group(); g.add(car);
  const ss = std(c, 0xc8ccd2, { metalness: 0.85, roughness: 0.32 }), cream = std(c, 0xe8e4d8, { roughness: 0.6 });
  // the car's walls carry the room's wallpaper (stainless, the ad rack, the map strip) when it is there
  if ((window.WALLS || []).includes('subway')) { const t = c.tex.load('assets/walls/subway.jpg'); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.repeat.set(W / (CH * 16 / 9), 1); cream.map = t; cream.color.set(0xffffff); }
  // the shell: the two side walls (stainless outside the window band), the ceiling, the floor
  for (const [z, ry] of [[ZN, 0], [ZS, PI]]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(W, CH), cream); w.position.set(W / 2, CH / 2, z); w.rotation.y = ry; car.add(w);
    c.wall(X(0.2), z + (ry ? -0.1 : 0.1), X(W - 0.2), z + (ry ? -0.1 : 0.1));
  }
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, ZS - ZN), cream); ceil.rotation.x = PI / 2; ceil.position.set(W / 2, CH, (ZN + ZS) / 2); car.add(ceil);
  for (let x = 1; x < W; x += 2.2) { car.add(box(c, 1.6, 0.04, 0.16, basic(c, 0xf4faff), x, CH - 0.03, ZN + 0.9)); car.add(box(c, 1.6, 0.04, 0.16, basic(c, 0xf4faff), x, CH - 0.03, ZS - 0.9)); }
  // the windows: a dark band with the tunnel lights streaking, drawn every frame
  const tun = c.canvasTex(1024, 128, () => {}), tq = tun.userData.canvas.getContext('2d'); tun.wrapS = THREE.RepeatWrapping;
  const drawTun = (off) => { tq.fillStyle = '#05060a'; tq.fillRect(0, 0, 1024, 128); for (let i = 0; i < 8; i++) { const x = ((i * 137 - off) % 1024 + 1024) % 1024; const gr = tq.createLinearGradient(x - 120, 0, x, 0); gr.addColorStop(0, 'rgba(255,220,150,0)'); gr.addColorStop(1, 'rgba(255,220,150,.9)'); tq.fillStyle = gr; tq.fillRect(x - 120, 50, 120, 10); } tun.needsUpdate = true; };
  const winM = new THREE.MeshBasicMaterial({ map: tun, toneMapped: false });
  for (const [z, ry] of [[ZN + 0.01, 0], [ZS - 0.01, PI]]) for (let x = 1.6; x < W; x += 4.5) { const wm = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.72), winM); wm.position.set(x, 1.45, z); wm.rotation.y = ry; car.add(wm); }
  // the benches: the orange and yellow moulded kind, under the windows
  const seatA = std(c, 0xe07a20, { roughness: 0.35 }), seatB = std(c, 0xf0b828, { roughness: 0.35 });
  for (const z of [ZN + 0.25, ZS - 0.25]) for (let x = 0.6; x < W - 0.6; x += 0.55) car.add(box(c, 0.5, 0.06, 0.45, Math.floor(x / 0.55) % 2 ? seatA : seatB, x + 0.25, 0.45, z));
  // the poles down the middle, and the grab bars
  for (let x = 2.5; x < W - 1; x += 3.4) { car.add(cyl(c, 0.022, 0.022, CH, ss, x, CH / 2, (ZN + ZS) / 2, 10)); c.post(X(x), (ZN + ZS) / 2, 0.06); }
  for (const z of [ZN + 0.55, ZS - 0.55]) { const bar = cyl(c, 0.018, 0.018, W - 0.6, ss, W / 2, 2.0, z, 8); bar.rotation.z = PI / 2; car.add(bar); }
  // the line on the end wall: a strip map of the pairs instead of stations
  const strip = c.canvasTex(1024, 128, (q, w, h) => { q.fillStyle = '#f4f0e4'; q.fillRect(0, 0, w, h); q.fillStyle = '#00933c'; q.fillRect(30, 60, w - 60, 10); q.font = `700 20px ${c.MONO}`; q.textAlign = 'center';
    P.forEach((p, i) => { const x = 60 + i * ((w - 120) / Math.max(1, P.length - 1)); q.fillStyle = '#fff'; q.beginPath(); q.arc(x, 65, 12, 0, 7); q.fill(); q.strokeStyle = '#111'; q.lineWidth = 3; q.stroke(); q.fillStyle = '#111'; q.fillText(p.a, x, 40); q.fillText(p.b, x, 106); });
    q.fillStyle = '#00933c'; q.beginPath(); q.arc(w - 26, 26, 20, 0, 7); q.fill(); q.fillStyle = '#fff'; q.font = `900 26px ${c.FONT}`; q.fillText('6', w - 26, 35); });
  const sm = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.55), new THREE.MeshBasicMaterial({ map: strip, toneMapped: false })); sm.position.set(W / 2, 2.15, ZN + 0.02); car.add(sm);
  c.clickable(sm, () => c.egg('stripmap', 'The strip map of a line where every stop is a pair. Pole, Lone, Feat, Patience. Express trains skip the second word.'), 'The strip map');

  // ---- the pictures: four on each wall between the windows ----
  const PWd = 0.98, PHt = PWd / 0.74, pics = [];
  const xs = [3.85, 8.35, 12.85, 17.35];
  const spots = [...xs.map((x) => [x, ZN + 0.02, 0]), ...xs.map((x) => [x, ZS - 0.02, PI])];
  P.slice(0, spots.length).forEach((p, k) => {
    const [x, z, ry] = spots[k];
    const ma = new THREE.MeshBasicMaterial({ map: pairTex(c, p, 'a'), toneMapped: false });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(PWd, PHt), ma); m.position.set(x, 1.38, z + (ry ? -0.03 : 0.03)); m.rotation.y = ry; car.add(m);   // in front of the frame's face, not in it
    const fr = box(c, PWd + 0.08, PHt + 0.08, 0.02, ss, x, 1.38, z); fr.rotation.y = ry; car.add(fr);
    c.clickable(m, () => openPair(c, p, ['blink', 'In the tunnel the lights go, and every picture in the car is the other word when they come back.']), label(p));
    plaque(c, car, p, x, 0.58, z + (ry ? -0.02 : 0.02), ry, 1.0, { bg: '#f4f0e4', fg: '#111', border: '#00933c' });
    pics.push({ p, ma, side: 'a' });
  });
  // riders: one asleep, one hugging the pole, one reading
  const riders = [['hustler', 6.0, ZN + 0.5, 0, 'Do not make eye contact. With either of me.'], ['bookseller', 11.2, ZS - 0.5, PI, 'Every time the lights go out the ads change. I have been riding this train since Tuesday to see them all.'], ['felix', 15.6, (ZN + ZS) / 2 + 0.3, PI / 2, 'This is my pole.']];
  riders.forEach(([n, x, z, ry, line], k) => { const m = c.glb(n, { h: 1.72, x, z, ry, parent: car }); c.post(X(x), z, 0.3); c.clickable(m, () => { c.say(m, line, 3600, 2.0); c.egg('rider'); }, 'A rider'); });

  // ---- the blink ----
  let T = 0, next = 7, blink = -1, swapped = false, off = 0;
  c.tick((t, dt, Pl, ri) => {
    if (ri !== r.i) { return; }
    T += dt; off += dt * 900; drawTun(off);
    car.position.y = Math.sin(T * 9) * 0.004; car.rotation.x = Math.sin(T * 2.3) * 0.002;
    if (blink < 0 && T > next) { blink = 0; swapped = false; c.sound.screech && c.sound.screech(); }
    if (blink >= 0) {
      blink += dt;
      // a stutter, then dark, then the lights back: off for about half a second
      const on = blink < 0.12 || (blink > 0.2 && blink < 0.28) || blink > 0.95;
      FXdim(on ? 1 : 0.05);
      if (!swapped && blink > 0.5) { swapped = true; for (const pc of pics) { pc.side = pc.side === 'a' ? 'b' : 'a'; pc.ma.map = pairTex(c, pc.p, pc.side); pc.ma.needsUpdate = true; } c.egg('tunnelblink', 'The lights went out in the tunnel, and every picture in the car came back as the other word.'); }
      if (blink > 1.1) { blink = -1; next = T + 9 + Math.random() * 5; FXdim(1); }
    }
  });
  // dimming: every basic material in the car, the pictures, the room lights and the sky light, all at once
  const base = [];
  function FXdim(v) {
    if (!base.length) car.traverse((m) => { if (m.material && m.material.isMeshBasicMaterial && m.material.color && m.material.map !== tun && !pics.some((p) => p.ma === m.material)) base.push([m.material, m.material.color.clone()]); });
    for (const [m, col] of base) m.color.copy(col).multiplyScalar(v);
    for (const pc of pics) pc.ma.color.setScalar(0.08 + v * 0.92);
    // the room's own lights (the engine eases them toward userData.i, so set both for a hard cut) and the sky light
    (r.lights || []).forEach((L, k) => { const l = c.lights[k]; if (!l) return; l.userData.i = L[4] * v; l.intensity = L[4] * v; });
    c.hemi.intensity = (r.hemi?.[2] ?? 0.3) * v;
  }
}
