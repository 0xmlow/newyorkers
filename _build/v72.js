/* ================================================================
   v72 THE FLOWER FHUNT (2026-11-22), apply-mlow-impermanent-vision, Whisper
   Twelve Open Eye Flowers painted small on the ground round the island, each in a pool of navy with one contour
   ring: on the water tower roof, under the shed, on the ice, behind the market, on the pier, on the beach, in the
   corners. Walk over one and it is yours (it shuts its eye and stays shut). Find all twelve. FLOWERS tells you how
   many are left and which way the nearest one is.
   ================================================================ */
const FHUNT = { f: [], got: new Set() };
window.__HUNT = FHUNT;
(function flowerHunt() {
  try { (JSON.parse(localStorage.getItem('meme-island-hunt') || '[]') || []).forEach(k => FHUNT.got.add(k)); } catch (e) { }
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d');
  if (c && c.createRadialGradient && c.arc) { const g = c.createRadialGradient(128, 128, 10, 128, 128, 128); g.addColorStop(0, 'rgba(22,34,74,.95)'); g.addColorStop(0.75, 'rgba(11,20,48,.9)'); g.addColorStop(1, 'rgba(11,20,48,0)'); c.fillStyle = g; c.fillRect(0, 0, 256, 256);
    c.strokeStyle = 'rgba(8,222,255,.85)'; c.lineWidth = 3; c.beginPath(); c.arc(128, 128, 100, 0, PI * 2); c.stroke(); c.strokeStyle = 'rgba(255,63,164,.85)'; c.lineWidth = 2; c.beginPath(); c.arc(128, 128, 112, 0, PI * 2); c.stroke(); }
  const pool = new THREE.CanvasTexture(cv); pool.encoding = THREE.sRGBEncoding; const ft = tex('assets/iv_flower.webp');
  const spots = [['the water tower roof', WT_AT.x - 2, WT_AT.z + 2, WT.top + 1], ['under the shed', SHED_AT.x - 5, SHED_AT.z, 3], ['on the ice', RINK_AT.x + 3, RINK_AT.z - 1, 3], ['behind the market', MKT_AT.x + 2, MKT_AT.z + 2.4, 3],
    ['the east shoulder', 86, -12, 3], ['the west grass', -85, -40, 3], ['the north east corner', 58, -80, 3], ['beside the oracle', -22, 6, 3], ['the end of the pier', 1.2, 172, 3], ['GM BEACH', 22, 118, 3], ['past the shed', -30, -78, 3], ['by the sculpture rows', -31, -51, 3]];
  spots.forEach(([name, x, z, cy], i) => { const f = floorAt(x, z, cy); const y = (f.f === null ? ground(x, z) : f.f) + 0.05; const key = 'f' + i;
    const g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: pool, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 })); pm.rotation.x = -PI / 2; g.add(pm);
    const fm = new THREE.MeshStandardMaterial({ map: ft, transparent: true, alphaTest: 0.4, emissive: 0xffffff, emissiveMap: ft, emissiveIntensity: 0.2, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4 });
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), fm); fl.rotation.x = -PI / 2; fl.position.y = 0.01; g.add(fl);
    FHUNT.f.push({ name, x, z, y, g, fl, fm, key, got: FHUNT.got.has(key) }); if (FHUNT.got.has(key)) { fl.scale.set(1, 0.08, 1); fm.color.setScalar(0.5); } });
})();
const huntSecret = secret('flowerhunt', () => { toast('ALL TWELVE. EVERY FLOWER ON THE ISLAND HAS SEEN YOU, AND NOW IT HAS SHUT ITS EYE FOR YOU.', 'blue'); });
EGGS.flowers = EGGS.flowerhunt = () => { const left = FHUNT.f.filter(f => !f.got); if (!left.length) { toast('ALL TWELVE FOUND. THEY ARE RESTING.'); return; } let b = left[0], bd = 1e9; left.forEach(f => { const d = Math.hypot(f.x - P.x, f.z - P.z); if (d < bd) { bd = d; b = f; } });
  const a = Math.atan2(b.x - P.x, -(b.z - P.z)) * 180 / PI, dirs = ['NORTH', 'NORTH EAST', 'EAST', 'SOUTH EAST', 'SOUTH', 'SOUTH WEST', 'WEST', 'NORTH WEST']; toast(left.length + ' FLOWERS LEFT. THE NEAREST IS ' + Math.round(bd) + ' M ' + dirs[((Math.round(a / 45) % 8) + 8) % 8] + '.'); }; EGGS.flowers.__s = true;
function flowerHuntFrame(dt) {
  const night = Math.min(1, (L.lamps || 0) * 1.4);
  FHUNT.f.forEach(f => { if (f.got) return; const d = Math.hypot(P.x - f.x, P.z - f.z); f.fm.emissiveIntensity = 0.15 + night * 0.7 + Math.sin(LIFE.t * 2 + f.x) * 0.08;
    if (d < 1.1 && Math.abs(P.y - f.y) < 1.2) { f.got = true; FHUNT.got.add(f.key); try { localStorage.setItem('meme-island-hunt', JSON.stringify([...FHUNT.got])); } catch (e) { }
      f.fl.scale.set(1, 0.08, 1); f.fm.color.setScalar(0.5); f.fm.emissiveIntensity = 0; try { beep(880, 0.08, 'sine', 0.05); beep(1320, 0.12, 'sine', 0.05, 0.09); } catch (e) { }
      const n = FHUNT.f.filter(q => q.got).length; toast('FLOWER ' + n + ' OF 12: ' + f.name.toUpperCase() + '.', n === 12 ? 'blue' : ''); if (n === 12) huntSecret(); } });
}
window.__FRAMES.push(dt => { try { flowerHuntFrame(dt); } catch (e) { if (!FHUNT.err) { FHUNT.err = e; console.warn('v72 hunt', e); } } });
