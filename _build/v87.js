/* ================================================================
   v87 THE BUS (2026-11-22)
   The N3W crosstown bus: a long blue and white city bus that laps the ring road and stops at two shelters, one on
   the south east and one on the north. It kneels, the doors open, it waits, it goes. E at a shelter while the
   bus is in rides it to the other one. The sign on the front says N3W NOT IN SERVICE half the time anyway.
   ================================================================ */
const BUS = { a: 0.2, wait: 0, stops: [0.42, 0.42 + PI], next: 0, ride: false };
window.__BUS = BUS;
(function bus() {
  const g = new THREE.Group(); scene.add(g); BUS.g = g;
  const white = new THREE.MeshStandardMaterial({ color: 0xeceae4, roughness: 0.4, metalness: 0.2 }), blue = new THREE.MeshStandardMaterial({ color: 0x2962FF, roughness: 0.4 }), glass = new THREE.MeshStandardMaterial({ color: 0x141a22, roughness: 0.05, metalness: 0.6, emissive: 0xfff2d6, emissiveIntensity: 0 }), tyre = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  BUS.glass = glass; const L = 12, W = 2.55, H = 3.0;
  const body = new THREE.Mesh(new THREE.BoxGeometry(L, H - 0.5, W), white); body.position.y = 0.5 + (H - 0.5) / 2; g.add(body);
  const band = new THREE.Mesh(new THREE.BoxGeometry(L + 0.02, 0.45, W + 0.02), blue); band.position.y = 0.9; g.add(band);
  const win = new THREE.Mesh(new THREE.BoxGeometry(L - 1.2, 1.0, W + 0.03), glass); win.position.set(-0.3, 2.05, 0); g.add(win);
  const ws = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.4, W - 0.2), glass); ws.position.set(L / 2 + 0.01, 1.9, 0); g.add(ws);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.28), new THREE.MeshBasicMaterial({ map: signTex([{ t: 'N3W CROSSTOWN', s: 0.5 }], 1024, 160, '#0D0D0D', '#ffb84a'), toneMapped: false })); sign.position.set(L / 2 + 0.04, 2.75, 0); sign.rotation.y = PI / 2; g.add(sign); BUS.sign = sign;
  BUS.signs = [signTex([{ t: 'N3W CROSSTOWN', s: 0.5 }], 1024, 160, '#0D0D0D', '#ffb84a'), signTex([{ t: 'NOT IN SERVICE', s: 0.5 }], 1024, 160, '#0D0D0D', '#ffb84a')];
  [[-L / 2 + 1.6, 1], [-L / 2 + 1.6, -1], [L / 2 - 2.2, 1], [L / 2 - 2.2, -1]].forEach(([x, s]) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 18), tyre); w.rotation.x = PI / 2; w.position.set(x, 0.5, s * (W / 2 - 0.08)); g.add(w); });
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.0, 0.04), glass); door.position.set(L / 2 - 1.0, 1.5, -W / 2 - 0.02); g.add(door); BUS.door = door;
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  // the shelters, on the inner shoulder at each stop
  BUS.shel = BUS.stops.map(a => { const R = ROAD_R - 5.6, x = Math.sin(a) * R, z = Math.cos(a) * R, gy = ground(x, z), sg = new THREE.Group(); sg.position.set(x, gy, z); sg.rotation.y = a; scene.add(sg);
    const steel = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.4, metalness: 0.7 }), gl = new THREE.MeshStandardMaterial({ color: 0xbcd0d8, roughness: 0.05, transparent: true, opacity: 0.2, depthWrite: false });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.1, 1.6), steel); roof.position.y = 2.5; sg.add(roof);
    const back = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.2, 0.04), gl); back.position.set(0, 1.25, -0.75); sg.add(back);
    [-1.75, 1.75].forEach(px => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.5, 0.08), steel); p.position.set(px, 1.25, -0.75); sg.add(p); });
    const ad = memeMesh(MEME_NS[Math.floor(Math.random() * MEME_NS.length)], 1.6); if (ad) { ad.position.set(1.0, 1.35, -0.72); sg.add(ad); }
    const bench = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.4), steel); bench.position.set(-0.7, 0.5, -0.45); sg.add(bench);
    const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), new THREE.MeshBasicMaterial({ map: signTex([{ t: 'BUS', s: 0.5 }, { t: 'N3W', s: 0.3 }], 256, 256, '#2962FF', '#efe8da'), toneMapped: false, side: THREE.DoubleSide })); mark.position.set(1.95, 2.3, 0.3); sg.add(mark);
    boxWalls(x - Math.sin(a) * 0.75, z - Math.cos(a) * 0.75, 3.6, 0.1, a, -5, gy + 2.5);
    interact(x, z, 2.4, 'E · RIDE THE BUS', () => busRide(a));
    return { a, x, z }; });
  if (window.__MAP) { MAP.places.push(['BUS STOP', BUS.shel[0].x, BUS.shel[0].z, BUS.shel[0].x, BUS.shel[0].z]); }
})();
const busSecret = secret('bus', () => { }, []);
function busRide(fromA) { const here = Math.abs(Math.atan2(Math.sin(BUS.a - fromA), Math.cos(BUS.a - fromA))) < 0.06 && BUS.wait > 0; if (!here) { toast('THE BUS IS NOT HERE. THE SIGN SAYS 2 MIN. THE SIGN HAS SAID 2 MIN FOR A WHILE.'); return; }
  const to = BUS.shel.find(s => s.a !== fromA); busSecret(); flash && flash('#0D0D0D'); teleport(to.x + Math.sin(to.a) * 1.0, to.z + Math.cos(to.a) * 1.0, to.a + PI); BUS.a = to.a + 0.001; BUS.wait = 6; toast('YOU TAP IN, SIT DOWN, LOOK AT YOUR PHONE, AND YOU ARE THERE. THAT IS THE CROSSTOWN.', 'blue'); }
EGGS.bus = EGGS.crosstown = () => { const s = BUS.shel[0]; teleport(s.x + Math.sin(s.a) * 1.0, s.z + Math.cos(s.a) * 1.0, s.a + PI); toast('THE BUS STOP. WAIT FOR IT.'); }; EGGS.bus.__s = true;
function busFrame(dt) {
  const R = ROAD_R - 1.7; const toX = Math.atan2(Math.sin(-BUS.a), Math.cos(-BUS.a)); if (BUS.wait > 0) { BUS.wait -= dt; } else if (window.__XWALK_PED && toX > 0.07 && toX < 0.14) { } else { const prev = BUS.a; BUS.a += 9 / R * dt; BUS.stops.forEach(s => { const d0 = Math.atan2(Math.sin(s - prev), Math.cos(s - prev)), d1 = Math.atan2(Math.sin(s - BUS.a), Math.cos(s - BUS.a)); if (d0 > 0 && d1 <= 0) { BUS.a = s; BUS.wait = 10; } }); }
  const a = BUS.a, x = Math.sin(a) * R, z = Math.cos(a) * R, gy = ground(x, z), kneel = BUS.wait > 0 ? 0.12 * Math.min(1, BUS.wait, 10 - BUS.wait) : 0; BUS.g.position.set(x, gy - kneel, z); BUS.g.rotation.y = a;   // tangent of (sin a, cos a) is (cos a, -sin a)
  BUS.door.position.x = 12 / 2 - 1.0 - (BUS.wait > 0 ? Math.min(1, BUS.wait, 10 - BUS.wait) * 1.0 : 0);
  const night = Math.min(1, (L.lamps || 0) * 1.4); BUS.glass.emissiveIntensity = night * 0.5; const s = Math.floor(LIFE.t / 20) % 2; if (BUS.sign.material.map !== BUS.signs[s]) BUS.sign.material.map = BUS.signs[s];
}
window.__FRAMES.push(dt => { try { busFrame(dt); } catch (e) { if (!BUS.err) { BUS.err = e; console.warn('v87 bus', e); } } });
