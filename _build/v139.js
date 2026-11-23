/* ================================================================
   v139 DOUBLE DUTCH (2026-11-23)
   On the plaza at (-28, -55), nine to six on dry days: two turners eggbeating two ropes toward each other while
   a third girl jumps in the middle, the ropes slapping the pavement in turn, a hopscotch court chalked beside
   them. Walk into the middle and she steps out for you and the turners slow down: jump (SPACE) every time a rope
   comes under you. Six clean jumps counts. Get caught and you are tangled and have to start again.
   ================================================================ */
const DD = { X: -28, Z: -55, th: 0, w: 0, n: 22, segs: null, count: 0, last: -1, on: 0 };
window.__DD = DD;
(function doubleDutch() {
  const X = DD.X, Z = DD.Z, g0 = ground(X, Z); DD.g0 = g0;
  DD.segs = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 5), new THREE.MeshStandardMaterial({ color: 0xff3fa4, roughness: 0.6 }), DD.n * 2); DD.segs.frustumCulled = false; DD.segs.castShadow = true; scene.add(DD.segs);
  DD.segs.setColorAt(0, new THREE.Color(0xff3fa4)); for (let i = 0; i < DD.n * 2; i++) DD.segs.setColorAt(i, new THREE.Color(i < DD.n ? 0xff3fa4 : 0x2962FF));
  DD.t = [-1, 1].map((s, i) => { const p = person([0x2f4a33, 0xe8c43a][i], 0x2a2a3a, SKIN[[0, 5][i]], ['workgirl', 'actress'][i]); p.g.position.set(X + s * 1.85, g0 - 0.35, Z); p.g.rotation.y = -s * PI / 2; return p; });
  DD.j = person(0xff3fa4, 0x1f2a44, SKIN[6], 'annieh'); DD.j.g.position.set(X, g0 - 0.35, Z); DD.j.g.rotation.y = PI / 2;
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 512; const c = cv.getContext('2d');
  if (c && c.strokeRect) { c.clearRect(0, 0, 128, 512); c.lineWidth = 4; c.strokeStyle = 'rgba(255,255,255,.85)'; c.fillStyle = 'rgba(255,255,255,.85)'; c.font = 'bold 28px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const cells = [[1, 32, 460], [2, 32, 400], [3, 32, 340], [4, 0, 280], [5, 64, 280], [6, 32, 220], [7, 0, 160], [8, 64, 160], [9, 32, 100], [10, 32, 40]];
    cells.forEach(([n, x, y]) => { c.strokeStyle = ['#ffd23f', '#ff8fc8', '#8fd8ff', '#ffffff'][n % 4]; c.strokeRect(x + 2, y - 28, 60, 56); c.fillStyle = c.strokeStyle; c.fillText(String(n), x + 32, y); }); }
  const ht = new THREE.CanvasTexture(cv); ht.encoding = THREE.sRGBEncoding; const hop = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 5.2), new THREE.MeshStandardMaterial({ map: ht, transparent: true, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false })); hop.rotation.x = -PI / 2; hop.position.set(X, g0 + 0.02, Z + 3.6); scene.add(hop);
  if (window.__MAP) MAP.places.push(['DOUBLE DUTCH', X, Z, X, Z + 2.2]);
})();
const ddSecret = secret('doubledutch', () => { toast('SIX CLEAN JUMPS IN DOUBLE DUTCH. THE TURNERS ACTUALLY LOOK IMPRESSED. THE GIRL YOU REPLACED IS NOT.', 'blue'); });
const _dd = new THREE.Object3D(), _da = new V3(), _db = new V3(), _dy = new V3(0, 1, 0);
function ddRope(k, th, base) { const X = DD.X, Z = DD.Z, y = DD.g0 + 1.02; let prev = null; for (let i = 0; i <= DD.n; i++) { const u = i / DD.n, r = Math.sin(PI * u) * 1.06, x = X - 1.52 + 3.04 * u, py = y + Math.cos(th) * r, pz = Z + Math.sin(th) * r; const cur = _db.set(x, Math.max(DD.g0 + 0.015, py), pz);
    if (prev) { _dd.position.copy(prev).add(cur).multiplyScalar(0.5); const dir = _da.copy(cur).sub(prev), len = dir.length(); _dd.quaternion.setFromUnitVectors(_dy, dir.divideScalar(len)); _dd.scale.set(1, len, 1); _dd.updateMatrix(); DD.segs.setMatrixAt(base + i - 1, _dd.matrix); prev.copy(cur); } else prev = cur.clone(); } }
function ddFrame(dt) {
  const t = nycTime(TIME.utc), W = WX.override || WX.cur, want = t.hours >= 9 && t.hours < 18 && W !== 'RAIN' && W !== 'SNOW' ? 1 : 0; DD.on += (want - DD.on) * Math.min(1, dt); const vis = DD.on > 0.5;
  DD.segs.visible = vis; DD.t.forEach(p => p.g.visible = vis); DD.j.g.visible = vis; const d = Math.hypot(P.x - DD.X, P.z - DD.Z); if (!vis || d > 70) return;
  const inMid = Math.abs(P.x - DD.X) < 0.8 && Math.abs(P.z - DD.Z) < 0.8; const wantW = 2 * PI * (inMid ? 0.62 : 1.05); DD.w += (wantW - DD.w) * Math.min(1, dt * 2); const prev = DD.th; DD.th += DD.w * dt;
  ddRope(0, DD.th, 0); ddRope(1, -DD.th + PI, DD.n); DD.segs.instanceMatrix.needsUpdate = true;
  DD.t.forEach((p, i) => { const s = Math.sin(i ? -DD.th : DD.th); p.arms[0].rotation.x = -0.7 + s * 0.45; p.arms[1].rotation.x = -0.7 - s * 0.45; });
  // a rope reaches the bottom every half turn
  const hits = Math.floor((DD.th + PI) / PI) - Math.floor((prev + PI) / PI); const jy = DD.g0 - 0.35;
  if (inMid) { DD.j.g.position.set(DD.X, jy, DD.Z + 1.9); DD.j.arms[0].rotation.x = DD.j.arms[1].rotation.x = -2.4 + Math.sin(LIFE.t * 8) * 0.3; } else { DD.j.g.position.set(DD.X, jy + Math.pow(Math.abs(Math.cos(DD.th)), 0.6) * 0.16, DD.Z); DD.j.arms[0].rotation.x = DD.j.arms[1].rotation.x = -0.4; DD.count = 0; }
  if (hits > 0) { if (d < 25 && AC && AC.state === 'running' && oceanGain && oceanGain.gain.value > 0) { try { beep(1400, 0.025, 'square', Math.min(0.03, 0.5 / (d + 4))); } catch (e) { } }
    if (inMid) { const f = floorAt(P.x, P.z, P.y + 1); const air = P.y > (f.f === null ? 0 : f.f) + 0.06; if (air) { DD.count++; if (DD.count >= 6) ddSecret(); else if (DD.count >= 2) toast(DD.count + ' JUMPS'); } else { if (DD.count > 0 || LIFE.t - (DD.tt || -9) > 5) { DD.tt = LIFE.t; toast('TANGLED. THE ROPE GOT YOU. STEP OUT AND TRY AGAIN.'); } DD.count = 0; } } }
}
window.__FRAMES.push(dt => { try { ddFrame(dt); } catch (e) { if (!DD.err) { DD.err = e; console.warn('v139 double dutch', e); } } });
