/* ================================================================
   v78 THE MEME CONSTELLATIONS (2026-11-22)
   Four new constellations in the night sky over the island, made of brighter stars than the rest: THE EYE (a ring
   with a pupil, high in the south), THE SLICE (a pizza wedge, east), THE APPLE (with its leaf, north) and THE
   PIGEON (west, mid flight). Look straight at one for a moment and its lines draw themselves in and its name
   appears. Find all four. STARGAZE tells you where to look.
   ================================================================ */
const CONST = { c: [] };
window.__CONST = CONST;
(function constellations() {
  const R = 850, defs = [
    ['THE EYE', 180, 52, [[-1, 0], [-0.7, 0.55], [0, 0.75], [0.7, 0.55], [1, 0], [0.7, -0.55], [0, -0.75], [-0.7, -0.55], [0, 0]], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0]], 'high in the south'],
    ['THE SLICE', 95, 38, [[0, -1], [-0.8, 0.8], [0.8, 0.8], [-0.2, 0.3], [0.3, 0.2], [0, 0.6]], [[0, 1], [1, 2], [2, 0]], 'over the east'],
    ['THE APPLE', 2, 34, [[0, 0.75], [-0.75, 0.45], [-0.9, -0.2], [-0.45, -0.85], [0, -0.7], [0.45, -0.85], [0.9, -0.2], [0.75, 0.45], [0.1, 1.15], [0.45, 1.35]], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0], [0, 8], [8, 9]], 'low in the north'],
    ['THE PIGEON', 275, 30, [[-1, 0], [-0.4, 0.15], [0.3, 0.05], [0.8, 0.25], [1.05, 0.2], [0.2, 0.7], [-0.1, 0.9], [0.1, -0.5], [-0.3, -0.75]], [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [5, 6], [2, 7], [7, 8]], 'in the west, flying']];
  const up = new THREE.Vector3(0, 1, 0);
  defs.forEach(([name, az, el, pts, edges, hint]) => {
    const dir = dirAzEl(az, el), right = new THREE.Vector3().crossVectors(dir, up).normalize(), vup = new THREE.Vector3().crossVectors(right, dir).normalize(), sc = 85;
    const world = pts.map(([u, v]) => dir.clone().multiplyScalar(R).addScaledVector(right, u * sc).addScaledVector(vup, v * sc));
    const sg = new THREE.BufferGeometry().setFromPoints(world); const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xfff6e0, size: 7, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false, toneMapped: false, map: LIFE.soft }));
    stars.frustumCulled = false; stars.renderOrder = -5; scene.add(stars);
    const lp = []; edges.forEach(([a, b]) => { lp.push(world[a], world[b]); }); const lg = new THREE.BufferGeometry().setFromPoints(lp);
    const lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x08deff, transparent: true, opacity: 0, depthWrite: false, fog: false, toneMapped: false })); lines.frustumCulled = false; lines.renderOrder = -5; scene.add(lines);
    const lab = new THREE.Sprite(new THREE.SpriteMaterial({ map: signTex([{ t: name, s: 0.5 }], 1024, 160, null, '#efe8da'), transparent: true, opacity: 0, depthWrite: false, fog: false, toneMapped: false }));
    lab.position.copy(dir).multiplyScalar(R).addScaledVector(vup, -sc * 1.35); lab.scale.set(200, 31, 1); lab.renderOrder = -5; scene.add(lab);
    CONST.c.push({ name, hint, dir, stars, lines, lab, look: 0, found: false, k: 0 }); });
  try { (JSON.parse(localStorage.getItem('meme-island-stars') || '[]') || []).forEach(n => { const c = CONST.c.find(q => q.name === n); if (c) c.found = true; }); } catch (e) { }
})();
const constSecret = secret('constellations', () => { toast('ALL FOUR. THE EYE, THE SLICE, THE APPLE AND THE PIGEON. ASTRONOMERS HAVE NOT BEEN INFORMED.', 'blue'); });
EGGS.stargaze = EGGS.constellations = () => { const left = CONST.c.filter(c => !c.found); toast(left.length ? 'AFTER DARK, LOOK FOR ' + left.map(c => c.name + ' ' + c.hint.toUpperCase()).join(', ') + '.' : 'YOU FOUND ALL FOUR. THEY ARE ALWAYS UP THERE NOW.'); }; EGGS.stargaze.__s = true;
const _cv = new THREE.Vector3();
function constFrame(dt) {
  const night = Math.min(1, Math.max(0, ((L.lamps || 0) - 0.4) * 2.5)) * (1 - Math.min(1, (WX.wet || 0) * 1.5)); camera.getWorldDirection(_cv);
  CONST.c.forEach(c => { const vis = night > 0.02; c.stars.visible = c.lines.visible = c.lab.visible = vis; if (!vis) return;
    c.stars.position.copy(camera.position); c.lines.position.copy(camera.position); c.lab.position.copy(camera.position).addScaledVector(c.dir, 850); c.lab.position.y -= 85 * 1.3;
    const looking = _cv.dot(c.dir) > 0.975; c.look = looking ? c.look + dt : 0;
    if (looking && c.look > 1.2 && !c.found) { c.found = true; try { localStorage.setItem('meme-island-stars', JSON.stringify(CONST.c.filter(q => q.found).map(q => q.name))); } catch (e) { } toast('YOU FOUND ' + c.name + '.', 'blue'); if (CONST.c.every(q => q.found)) constSecret(); }
    const want = c.found ? (looking ? 1 : 0.35) : (looking ? Math.min(1, c.look / 1.2) : 0); c.k += (want - c.k) * Math.min(1, dt * 2.5);
    c.stars.material.opacity = night * (0.75 + 0.25 * Math.sin(LIFE.t * 1.3 + c.dir.x * 9)); c.lines.material.opacity = night * c.k * 0.7; c.lab.material.opacity = night * c.k; });
}
window.__FRAMES.push(dt => { try { constFrame(dt); } catch (e) { if (!CONST.err) { CONST.err = e; console.warn('v78 stars', e); } } });
