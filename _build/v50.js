/* ================================================================
   v50 THE MAP AND THE PASSPORT (2026-11-22)
   N (pressed alone), MAP, or the MAP button on phones opens a map of the island: a real photograph of it taken
   from straight above by the engine (one frame, an orthographic camera, no fog), with every place named, you as an
   arrow, and the places you have walked to stamped blue. Click a name to go there. The passport counts the places
   you have actually visited, kept in this browser; visit them all and it counts as a secret.
   ================================================================ */
const MAP = { open: false, img: null, span: 215, vis: new Set() };
window.__MAP = MAP;
// [name, label x, label z, land x, land z] (land null: you can see it, not walk to it)
MAP.places = [
  ['THE FLOOR', 0, 0, 0, 24], ['SCULPTURE ROWS', 0, -40, 0, -22], ['THE FACTORY', 0, -64, 0, -48], ['THE BRAIN', 50, -52, 36, -36], ['LIGHTHOUSE', 0, -126, 0, -100],
  ['OPEN METAVERSE', 30, -80, 30, -66], ['WAGMI WHEEL', 62, 0, 50, 10], ['SURVIVE', 44, 44, 18, 44], ['THE BANK', -60, 0, -42, 2], ['SUMMER.JPG', -48, 52, -30, 60],
  ['CENSUS WALK', -12, 66, -2.5, 58], ['THE BODEGA', 20, 66, 8, 68], ['GM BEACH', 0, 112, 0, 118], ['THE PIER', 0, 168, 0, 160], ['N3W SQUARE', 81, 10, 70, 8],
  ['CHESS', 74, -21, 72, -16], ['N3W COURT', -66, 24, -58, 24], ['N3W LINE', 26, 26, 23, 30], ['N3W AIR', -72, -39, -64, -33], ['THE CUT', -42, -69, -36, -61],
  ['HANDBALL WALL', -78, -21, WALLP.fx, WALLP.fz], ['FIND THE EYE', 48, -9, MONTE.ix, MONTE.iz], ['THE HYDRANT', 75, 30, HYD_AT.x + Math.sin(HYD.ry) * -2, HYD_AT.z + Math.cos(HYD.ry) * -2],
  ['THE OBSERVER', 0.5, -137.5, null, null], ['THE WITNESS', 0, -205, null, null], ['THE GREAT WAVE', -30, 156, null, null], ['THE COLOSSUS', 58, 205, null, null]
];
MAP.leftOf = new Set(['CENSUS WALK', 'THE GREAT WAVE', 'THE CUT', 'N3W LINE']);
try { (JSON.parse(localStorage.getItem('meme-island-passport') || '[]') || []).forEach(k => MAP.vis.add(k)); } catch (e) { }
(function mapWindow() {
  const el = document.createElement('div'); el.className = 'win'; el.id = 'mapwin';
  el.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(600px,94vw);z-index:58;display:none;flex-direction:column';
  el.innerHTML = '<div class="title"><img src="assets/eye.png" alt=""><span>MAP.EXE</span><div class="tbtns"><button id="mX" aria-label="Close">&#215;</button></div></div><div class="inner" style="padding:8px"><div id="mTop" class="small" style="display:flex;justify-content:space-between;margin-bottom:6px;font:500 12px/1.2 \'JetBrains Mono\',Menlo,monospace"><span id="mCount"></span><span>CLICK A PLACE TO GO THERE</span></div><canvas id="mapcv" width="1100" height="1100" style="width:100%;aspect-ratio:1/1;display:block;background:#0b1a26;cursor:pointer"></canvas></div>';
  document.body.appendChild(el); MAP.el = el; MAP.cv = el.querySelector('#mapcv') || document.createElement('canvas'); const mx0 = el.querySelector('#mX'); if (mx0) mx0.onclick = () => mapToggle(false);
  MAP.cv.addEventListener('click', e => { const r = MAP.cv.getBoundingClientRect(), mx = (e.clientX - r.left) / r.width * 1100, my = (e.clientY - r.top) / r.height * 1100; let best = null, bd = 34;
    MAP.places.forEach(p => { const [x, y] = mapXY(p[1], p[2]); const d = Math.hypot(x - mx, y - my); if (d < bd) { bd = d; best = p; } }); if (best) mapGo(best); });
  const sm = document.querySelector('#startmenu .items'); if (sm) { const b = document.createElement('button'); b.innerHTML = '<img src="assets/eye.png" alt="" style="width:16px;height:16px"> Map'; b.onclick = () => mapToggle(true); sm.appendChild(b); }
  const box = $('mbtn'); if (box) { const b = document.createElement('button'); b.className = 'b'; b.textContent = 'MAP'; b.style.cssText = 'width:64px;height:40px;font-weight:700;font-size:10px'; b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); mapToggle(); }); box.appendChild(b); }
})();
const mapXY = (x, z) => [(x + MAP.span) / (2 * MAP.span) * 1100, (z + MAP.span) / (2 * MAP.span) * 1100];
function mapShot() {
  // one frame from straight above, into the main canvas, copied out before the next frame replaces it
  const W = renderer.domElement.width, H = renderer.domElement.height, asp = W / H, s = MAP.span;
  const cam = new THREE.OrthographicCamera(-s * asp, s * asp, s, -s, 1, 1200); cam.position.set(0, 600, 0); cam.up.set(0, 0, -1); cam.lookAt(0, 0, 0); cam.updateMatrixWorld();
  const fog = scene.fog, hidden = []; scene.fog = null;
  scene.traverse(o => { if (o.visible && (o.isMesh || o.isPoints) && o.geometry) { if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); const bs = o.geometry.boundingSphere; const ms = Array.isArray(o.material) ? o.material : [o.material]; if (bs && bs.radius * Math.max(o.scale.x, o.scale.y, o.scale.z) > 700 && ms.some(m => m && m.side === THREE.BackSide)) { hidden.push(o); o.visible = false; } } });
  try { renderer.setRenderTarget(null); renderer.render(scene, cam); const c = document.createElement('canvas'); c.width = c.height = 1100; const x = c.getContext('2d'); x.drawImage(renderer.domElement, (W - H) / 2, 0, H, H, 0, 0, 1100, 1100); MAP.img = c; MAP.night = (L.lamps || 0) > 0.5; } catch (e) { console.warn('v50 map shot', e); }
  scene.fog = fog; hidden.forEach(o => o.visible = true);
}
const mapSecret = secret('map', () => { }, ['map', 'whereami']), passSecret = secret('passport', () => { toast('EVERY STAMP IN THE PASSPORT. YOU HAVE SEEN THE WHOLE ISLAND. THE ISLAND HAS SEEN YOU.', 'blue'); });
function mapToggle(on) {
  MAP.open = on === undefined ? !MAP.open : on; MAP.el.style.display = MAP.open ? 'flex' : 'none';
  if (MAP.open) { mapSecret(); if (!MAP.img || MAP.age > 120) { mapShot(); MAP.age = 0; } try { document.exitPointerLock && document.exitPointerLock(); } catch (e) { } mapDraw(); }
}
function mapGo(p) {
  if (p[3] === null) { toast(p[0] + ': YOU CAN SEE IT FROM HERE. WALK OVER.'); return; }
  let x = p[3], z = p[4]; for (let i = 0; i < 12; i++) { const f = floorAt(x, z, 5); if (f.f !== null && !f.block) break; const r = Math.hypot(x, z) || 1; x -= x / r * 3; z -= z / r * 3; }
  const yaw = Math.atan2(-(p[1] - x), -(p[2] - z)); teleport(x, z, yaw, 5); mapToggle(false); toast(p[0] + '.');
}
function mapDraw() {
  const c = MAP.cv.getContext('2d'); if (!c || !c.beginPath || !c.measureText) return; c.fillStyle = '#0b1a26'; c.fillRect(0, 0, 1100, 1100);
  if (MAP.img) { c.save(); c.filter = MAP.night ? 'brightness(1.9) saturate(.8)' : 'saturate(1.05)'; c.drawImage(MAP.img, 0, 0); c.restore(); }
  c.strokeStyle = 'rgba(239,232,218,.12)'; c.lineWidth = 1; for (let i = 0; i <= 1100; i += 110) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, 1100); c.stroke(); c.beginPath(); c.moveTo(0, i); c.lineTo(1100, i); c.stroke(); }
  c.font = '600 19px "JetBrains Mono",Menlo,monospace'; c.textBaseline = 'middle';
  MAP.places.forEach(p => { const [x, y] = mapXY(p[1], p[2]), v = MAP.vis.has(p[0]);
    c.beginPath(); c.arc(x, y, 8, 0, PI * 2); c.fillStyle = v ? '#2962FF' : 'rgba(13,13,13,.75)'; c.fill(); c.lineWidth = 2.5; c.strokeStyle = '#efe8da'; c.stroke();
    const tw = c.measureText(p[0]).width, left = MAP.leftOf.has(p[0]) || x > 820; const tx = left ? x - 14 - tw : x + 14; c.fillStyle = 'rgba(13,13,13,.72)'; c.fillRect(tx - 5, y - 13, tw + 10, 26); c.fillStyle = v ? '#9fc0ff' : '#efe8da'; c.fillText(p[0], tx, y + 1); });
  // you
  const [px, py] = mapXY(P.x, P.z), a = P.yaw; c.save(); c.translate(px, py); c.rotate(-a); c.beginPath(); c.moveTo(0, -22); c.lineTo(13, 14); c.lineTo(0, 7); c.lineTo(-13, 14); c.closePath(); c.fillStyle = '#ff3fa4'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#0d0d0d'; c.stroke(); c.restore();
  c.fillStyle = 'rgba(13,13,13,.72)'; c.fillRect(1040, 14, 46, 54); c.fillStyle = '#efe8da'; c.font = '400 30px Anton,Impact,sans-serif'; c.textAlign = 'center'; c.fillText('N', 1063, 34); c.font = '400 20px Anton,Impact'; c.fillText('↑', 1063, 56); c.textAlign = 'left';
  const walkable = MAP.places.filter(p => p[3] !== null), n = walkable.filter(p => MAP.vis.has(p[0])).length; if ($('mCount')) $('mCount').textContent = 'PASSPORT: ' + n + ' OF ' + walkable.length + ' PLACES VISITED';
}
let mapKeyT = null;
addEventListener('keydown', e => { if ($('chat').style.display === 'block' || e.repeat) return; if (mapKeyT) { clearTimeout(mapKeyT); mapKeyT = null; if (e.key.length === 1) return; }
  if (e.code === 'KeyN') mapKeyT = setTimeout(() => { mapKeyT = null; mapToggle(); }, 420); if (e.code === 'Escape' && MAP.open) mapToggle(false); });
let mapAcc = 0;
function mapFrame(dt) {
  MAP.age = (MAP.age || 0) + dt; mapAcc += dt; if (MAP.open && mapAcc > 0.1) { mapAcc = 0; mapDraw(); }
  if (Math.floor(LIFE.t * 2) !== Math.floor((LIFE.t - dt) * 2)) { const walkable = MAP.places.filter(p => p[3] !== null); let add = false;
    walkable.forEach(p => { if (!MAP.vis.has(p[0]) && (Math.hypot(P.x - p[1], P.z - p[2]) < 11 || Math.hypot(P.x - p[3], P.z - p[4]) < 4)) { MAP.vis.add(p[0]); add = true; if (state.started) toast('PASSPORT STAMPED: ' + p[0], 'blue'); } });
    if (add) { try { localStorage.setItem('meme-island-passport', JSON.stringify([...MAP.vis])); } catch (e) { } if (walkable.every(p => MAP.vis.has(p[0]))) passSecret(); } }
}
window.__FRAMES.push(dt => { try { mapFrame(dt); } catch (e) { if (!MAP.err) { MAP.err = e; console.warn('v50 map', e); } } });
MAP.toggle = mapToggle; MAP.go = mapGo;
