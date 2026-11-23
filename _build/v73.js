/* ================================================================
   v73 THE N3W ORACLE (2026-11-22), apply-mlow-impermanent-vision, Bloom
   A fortune machine at (-19, 9): a tall dark wood cabinet, brass trim, a marquee, and behind the glass an Open
   Eye Flower in a navy fog of contour lines, asleep. E (1 TDH) and it wakes: the eye opens, the case glows, it
   hums, and a card slides out of the slot with your fortune. Thirty fortunes.
   ================================================================ */
const ORA = { t: 0, on: 0, n: 0 };
window.__ORA = ORA;
const ORA_AT = { x: -19, z: 9 };
const ORA_SAYS = ['YOUR NEXT MINT WILL BE ON TIME. THAT ALONE IS A MIRACLE.', 'A STRANGER WILL SAY GM. SAY IT BACK.', 'THE FLOOR IS LAVA. THE FLOOR IS ALSO A PRICE. BOTH WILL MOVE.', 'YOU WILL FIND A SEAT ON THE TRAIN. DO NOT LOOK AT ANYONE.',
  'SOMETHING YOU SOLD WILL BE WORTH MORE. YOU WILL BE HAPPY FOR THEM.', 'THE BODEGA CAT HAS CHOSEN YOU. ACT NATURAL.', 'A JPEG WILL MAKE YOU CRY THIS WEEK. A GOOD CRY.', 'YOU ARE EARLY. YOU HAVE ALWAYS BEEN EARLY. IT IS EXHAUSTING.',
  'DIAMOND HANDS ARE MOSTLY JUST HANDS THAT FORGOT THE PASSWORD.', 'THE PIZZA RAT RESPECTS YOU.', 'LOOK UP. THE CITY PUT SOMETHING ON A ROOF FOR YOU.', 'YOU WILL WALK PAST THE SAME CORNER FOR TEN YEARS AND THEN NOTICE IT.',
  'WAGMI. NOT EVERYONE. BUT YOU, PROBABLY.', 'THE NEXT TAXI WILL STOP. ENJOY IT. IT WILL NOT HAPPEN AGAIN.', 'THE WATCHERS SAW WHAT YOU DID. THEY THOUGHT IT WAS COOL.', 'YOU WILL BE TAGGED IN SOMETHING YOU DID NOT MAKE. TAKE THE COMPLIMENT.',
  'A FLOWER IS LOOKING AT YOU RIGHT NOW. NOT THIS ONE.', 'YOUR WALLET IS FINE. YOUR SLEEP SCHEDULE IS NOT.', 'THE MEMES ARE THE MEANS. SEIZE THEM GENTLY.', 'DO NOT CHASE THE GREEN CANDLE. WALK. IT WILL WAIT.',
  'SOMEONE WILL ASK WHAT YOU DO. YOU WILL SAY ART. YOU WILL BE RIGHT.', 'A SUBWAY GRATE IS IN YOUR FUTURE. WEAR TROUSERS.', 'YOU WILL DROP A SLICE CHEESE SIDE DOWN AND LEARN NOTHING.', 'THE ISLAND REMEMBERS EVERY PATH YOU WALKED. IT IS FLATTERED.',
  'BUY THE DIP. THE DIP IS A HOT DOG. IT IS ALWAYS A GOOD TIME.', 'PATIENCE. THE HOLE IS ONLY CHALK.', 'GOOD NEWS ARRIVES BY BIKE, IN AN INSULATED BAG.', 'A FOG WILL ROLL IN AND YOU WILL FINALLY SLOW DOWN.', 'YOU ARE THE NEW YORKER NOW. THIS WAS ALWAYS THE PLAN.', 'THE ORACLE IS ALSO JUST A FLOWER IN A BOX. AND YET.'];
(function oracle() {
  const x0 = ORA_AT.x, z0 = ORA_AT.z, g0 = ground(x0, z0), ry = Math.atan2(-x0, -z0); ORA.ry = ry;
  const g = new THREE.Group(); g.position.set(x0, g0, z0); g.rotation.y = ry; scene.add(g); ORA.g = g;
  const wood = new THREE.MeshStandardMaterial({ color: 0x3a2416, roughness: 0.55 }), brass = new THREE.MeshStandardMaterial({ color: 0xb08a3e, roughness: 0.3, metalness: 0.9 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.0, 0.9), wood); base.position.y = 0.5; g.add(base);
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.35, 0.95), wood); top.position.y = 2.45; g.add(top);
  [-0.62, 0.62].forEach(x => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.3, 0.9), wood); p.position.set(x, 1.65, 0); g.add(p); });
  const backP = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.3, 0.05), wood); backP.position.set(0, 1.65, -0.42); g.add(backP);
  // the case: navy contour fog behind the flower
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256; const c = cv.getContext('2d');
  if (c && c.beginPath && c.createRadialGradient) { const gr = c.createRadialGradient(128, 128, 10, 128, 128, 180); gr.addColorStop(0, '#1d2f66'); gr.addColorStop(1, '#050816'); c.fillStyle = gr; c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 16; i++) { c.beginPath(); for (let a = 0; a <= 1.001; a += 1 / 90) { const t = a * PI * 2, r = 14 + i * 9 + Math.sin(t * 3 + i) * 4; const px = 128 + Math.cos(t) * r, py = 128 + Math.sin(t) * r; a ? c.lineTo(px, py) : c.moveTo(px, py); } c.lineWidth = i % 5 === 4 ? 2.4 : 1.2; c.strokeStyle = i % 5 === 4 ? 'rgba(255,63,164,.8)' : 'rgba(8,222,255,.7)'; c.stroke(); } }
  const ct = new THREE.CanvasTexture(cv); ct.encoding = THREE.sRGBEncoding; const caseM = new THREE.MeshStandardMaterial({ map: ct, emissive: 0xffffff, emissiveMap: ct, emissiveIntensity: 0.25, roughness: 0.9 }); ORA.caseM = caseM;
  const inside = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.25), caseM); inside.position.set(0, 1.65, -0.39); g.add(inside);
  const ft = tex('assets/iv_flower.webp'); const fm = new THREE.MeshStandardMaterial({ map: ft, transparent: true, alphaTest: 0.4, emissive: 0xffffff, emissiveMap: ft, emissiveIntensity: 0.1, side: THREE.DoubleSide }); ORA.fm = fm;
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.85), fm); fl.position.set(0, 1.7, -0.1); g.add(fl); ORA.fl = fl;
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.16, 1.3), new THREE.MeshStandardMaterial({ color: 0xcfe0ea, roughness: 0.02, metalness: 0.2, transparent: true, opacity: 0.12, depthWrite: false })); glass.position.set(0, 1.65, 0.44); g.add(glass);
  [[0, 1.0], [0, 2.28]].forEach(([x, y]) => { const t = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.05, 0.05), brass); t.position.set(x, y, 0.46); g.add(t); });
  const mq = signTex([{ t: 'N3W ORACLE', s: 0.4 }, { t: 'ONE TDH · ONE TRUTH', s: 0.14 }], 1024, 256, '#0D0D0D', '#e9c46a'); const marquee = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.31), new THREE.MeshBasicMaterial({ map: mq, toneMapped: false })); marquee.position.set(0, 2.45, 0.48); g.add(marquee);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.02), new THREE.MeshBasicMaterial({ color: 0x050505 })); slot.position.set(0.3, 0.8, 0.455); g.add(slot);
  const card = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.14), new THREE.MeshStandardMaterial({ color: 0xefe8da, roughness: 0.9 })); card.position.set(0.3, 0.8, 0.46); card.rotation.x = -PI / 2; card.scale.set(1, 0.01, 1); g.add(card); ORA.card = card;
  boxWalls(x0, z0, 1.3, 0.95, ry, -5, g0 + 2.6);
  interact(x0 + Math.sin(ry) * 1.3, z0 + Math.cos(ry) * 1.3, 1.6, 'E · ASK THE ORACLE (1 TDH)', () => oraAsk());
  if (window.__MAP) MAP.places.push(['THE ORACLE', x0, z0, x0 + Math.sin(ry) * 2.2, z0 + Math.cos(ry) * 2.2]);
})();
const oraSecret = secret('oracle', () => { }, []);
function oraAsk() { if (ORA.on > 0) return; state.tdh = Math.max(0, state.tdh - 1); try { hud(); } catch (e) { } ORA.on = 3.2; ORA.n++; oraSecret();
  const say = ORA_SAYS[Math.floor(Math.random() * ORA_SAYS.length)]; ORA.say = say; if (AC && AC.state === 'running' && oceanGain && oceanGain.gain.value > 0) try { beep(110, 1.8, 'sine', 0.05); beep(165, 1.8, 'sine', 0.03); beep(1760, 0.08, 'triangle', 0.03, 2.6); } catch (e) { } }
EGGS.oracle = EGGS.fortune = () => { teleport(ORA_AT.x + Math.sin(ORA.ry) * 1.8, ORA_AT.z + Math.cos(ORA.ry) * 1.8, ORA.ry + PI); toast('THE ORACLE HAS BEEN EXPECTING YOU. IT COSTS ONE TDH ANYWAY.'); }; EGGS.oracle.__s = true;
function oraFrame(dt) {
  const d = Math.hypot(P.x - ORA_AT.x, P.z - ORA_AT.z); if (d > 70) return; const night = Math.min(1, (L.lamps || 0) * 1.4);
  if (ORA.on > 0) { ORA.on -= dt; const u = 1 - ORA.on / 3.2; ORA.fl.scale.set(1, 0.3 + 0.7 * Math.min(1, u * 3), 1); ORA.fl.rotation.z = Math.sin(LIFE.t * 3) * 0.05; ORA.caseM.emissiveIntensity = 0.25 + 1.2 * Math.sin(u * PI); ORA.fm.emissiveIntensity = 0.1 + 1.1 * Math.sin(u * PI);
    ORA.card.scale.set(1, Math.min(1, Math.max(0.01, (u - 0.75) * 4)), 1); ORA.card.position.z = 0.46 + Math.max(0, (u - 0.75) * 4) * 0.08; if (ORA.on <= 0) { toast('THE CARD SAYS: ' + ORA.say, 'blue'); } }
  else { ORA.fl.scale.set(1, 0.3 + Math.sin(LIFE.t * 0.4) * 0.03, 1); ORA.caseM.emissiveIntensity = 0.2 + night * 0.5; ORA.fm.emissiveIntensity = 0.08 + night * 0.25; ORA.card.scale.y = Math.max(0.01, ORA.card.scale.y - dt * 0.2); }
}
window.__FRAMES.push(dt => { try { oraFrame(dt); } catch (e) { if (!ORA.err) { ORA.err = e; console.warn('v73 oracle', e); } } });
