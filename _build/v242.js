/* ================================================================
   v242 THE CREDITS (2026-11-23)
   Every artist whose 6529 Memes card is on the island, by name, on the back of the welcome billboard: the side you
   face as you walk back down to the pier, like the end of a film. Navy enamel with MLow's contour field running
   faint behind the type, the Open Eye Flower, and every name in bone, alphabetical, collaborations as signed.
   At dusk the board is lit by its gooseneck lamps (v176) and glows a little on its own. ?credits=0 turns it off.
   ================================================================ */
const CRED = { names: [] };
window.__CRED = CRED;
(function credits() {
  if (!LOOK.on || /credits=0/.test(location.search)) return;
  const set = new Set(); CARDS.concat(D.fresh || []).forEach(c => { const a = (c.art || c.a || '').trim(); if (a) set.add(a); });
  const names = [...set].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })); CRED.names = names;
  const W = 4096, H = 2304, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO; CRED.tex = t;
  const draw = img => { if (!c || !c.fillText || !c.beginPath || !c.stroke) return;
    c.fillStyle = '#0b1430'; c.fillRect(0, 0, W, H);
    // the contour field, faint
    c.lineWidth = 3; for (let i = 0; i < 70; i++) { c.strokeStyle = ['rgba(41,98,255,.22)', 'rgba(8,222,255,.14)', 'rgba(239,232,218,.08)'][i % 3]; c.beginPath();
      for (let x = 0; x <= W; x += 32) { const y = i * 36 - 200 + Math.sin(x * 0.0021 + i * 0.37) * 120 + Math.sin(x * 0.0057 + i) * 40; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    if (img) { c.globalAlpha = 0.95; c.drawImage(img, 90, 60, 230, 230); c.globalAlpha = 1; }
    c.fillStyle = '#efe8da'; c.textBaseline = 'alphabetic'; c.font = '900 120px "Archivo Black",Impact,sans-serif'; c.fillText('THE CREDITS', 360, 190);
    c.font = '500 46px "Archivo",Helvetica,sans-serif'; c.fillStyle = '#7fb0ff'; c.fillText('N3W 6529 MEME ISLAND, BY MLOW · EVERY ARTIST WHOSE THE MEMES BY 6529 CARD LIVES ON THIS ISLAND · ' + names.length + ' ARTISTS · CC0', 364, 262);
    c.fillStyle = '#2962FF'; c.fillRect(90, 318, W - 180, 6);
    // the names: as many columns as it takes at a readable size
    const top = 380, bottom = H - 70, cols = 9, colW = (W - 180) / cols; let fs = 34; const rows = Math.ceil(names.length / cols); const rh = (bottom - top) / rows; fs = Math.min(40, rh * 0.78);
    c.font = `500 ${fs}px "Archivo",Helvetica,sans-serif`; c.fillStyle = '#efe8da';
    names.forEach((n, i) => { const col = Math.floor(i / rows), row = i % rows; let s = n.toUpperCase(); while (c.measureText(s).width > colW - 24 && s.length > 4) s = s.slice(0, -2) + '…'; c.fillText(s, 90 + col * colW, top + (row + 0.8) * rh); });
    t.needsUpdate = true; };
  draw(null); const im = new Image(); im.onload = () => { try { draw(im); } catch (e) { } }; im.src = 'assets/iv_flower.webp';
  if (!window.__fontsReady) addEventListener('n3wfonts', () => { try { draw(im.complete ? im : null); } catch (e) { } }, { once: true });
  const by = ground(0, 117) + 4.4 + 4.5;
  const mat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.55, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.06 }); CRED.mat = mat;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), mat); m.position.set(0, by, 116.62); m.rotation.y = PI; m.receiveShadow = true; scene.add(m); CRED.mesh = m;
})();
window.__FRAMES.push(() => { try { if (!CRED.mat) return; CRED.mat.emissiveIntensity = 0.06 + 0.45 * Math.min(1, (L.lamps || 0) * 1.3); } catch (e) { } });
