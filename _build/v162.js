/* ================================================================
   v162 POEMS WHILE YOU WAIT (2026-11-23)
   A poet with a manual typewriter at a folding table at (52, 16), the way they set up in Washington Square and
   on the High Line: a sign, a jar, a stack of paper. You hear the keys and the carriage bell from a way off.
   E asks for a poem: he looks at the sky and the time of day and the season and whatever is going on around him,
   and types it for you, letter by letter, on a sheet you can read. Pay what you want.
   ================================================================ */
const POET = { X: 52, Z: 16, busy: 0, n: 0 };
window.__POET = POET;
(function poet() {
  const X = POET.X, Z = POET.Z, g0 = ground(X, Z), ry = Math.atan2(-X, -Z); const g = new THREE.Group(); g.position.set(X, g0, Z); g.rotation.y = ry; scene.add(g); POET.g = g; POET.ry = ry;
  const steel = new THREE.MeshStandardMaterial({ color: 0x8a9096, roughness: 0.4, metalness: 0.7 }), top = new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 0.6 }), tw = new THREE.MeshStandardMaterial({ color: 0x2a3a34, roughness: 0.35, metalness: 0.4 });
  const tbl = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.65), top); tbl.position.set(0, 0.74, 0.35); tbl.castShadow = true; g.add(tbl); [[-0.5, 0.1], [0.5, 0.1], [-0.5, 0.6], [0.5, 0.6]].forEach(([x, z]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.74, 5), steel); l.position.set(x, 0.37, z); g.add(l); });
  const typer = new THREE.Group(); typer.position.set(0, 0.76, 0.32); g.add(typer); const base = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.28), tw); base.position.y = 0.05; typer.add(base); const keys2 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 0.12), new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.6 })); keys2.position.set(0, 0.1, 0.09); keys2.rotation.x = 0.25; typer.add(keys2);
  const carriage = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 10), new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.3 })); carriage.rotation.z = PI / 2; carriage.position.set(0, 0.15, -0.08); typer.add(carriage); POET.carriage = carriage;
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.26), new THREE.MeshStandardMaterial({ color: 0xf4f2ea, roughness: 0.9, side: THREE.DoubleSide })); sheet.position.set(0, 0.28, -0.1); sheet.rotation.x = -0.2; typer.add(sheet); POET.sheet = sheet;
  const p = person(0x3a3a42, 0x2a2a2e, SKIN[6], 'writer'); scene.remove(p.g); p.g.position.set(0, -0.35 - 0.36, -0.15); p.legs.forEach(l => l.rotation.x = -PI / 2); g.add(p.g); POET.p = p;
  const chair = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.4), steel); chair.position.set(0, 0.45, -0.15); g.add(chair);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.42), new THREE.MeshBasicMaterial({ map: signTex([{ t: 'POEMS', s: 0.3, f: 'Courier New, monospace' }, { t: 'ON ANY SUBJECT', s: 0.13, f: 'Courier New, monospace' }, { t: 'PAY WHAT YOU WANT', s: 0.11, f: 'Courier New, monospace' }], 512, 340, '#f4f2ea', '#1a1a1a') })); sign.position.set(0, 0.5, 0.69); g.add(sign);
  const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.16, 12), new THREE.MeshStandardMaterial({ color: 0xcfe0ea, roughness: 0.05, transparent: true, opacity: 0.5 })); jar.position.set(0.42, 0.84, 0.5); g.add(jar);
  boxWalls(X + Math.sin(ry) * 0.35, Z + Math.cos(ry) * 0.35, 1.1, 0.65, ry, -5, g0 + 0.8);
  const div = document.createElement('div'); div.id = 'poemSheet'; div.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-1.2deg);width:min(420px,80vw);padding:34px 38px;background:#f6f3ea;color:#1a1a1a;font:15px/1.75 "Courier New",monospace;white-space:pre-wrap;box-shadow:0 20px 60px rgba(0,0,0,.45);z-index:59;display:none;pointer-events:none'; document.body.appendChild(div); POET.div = div;
  interact(X + Math.sin(ry) * 1.6, Z + Math.cos(ry) * 1.6, 1.6, 'E · ASK FOR A POEM', () => poetAsk());
  if (window.__MAP) MAP.places.push(['THE POET', X, Z, X + Math.sin(ry) * 2, Z + Math.cos(ry) * 2]);
})();
const poetSecret = secret('poem', () => { toast('A STRANGER WROTE YOU A POEM ON A TYPEWRITER IN THE STREET. YOU WILL FIND IT IN A COAT POCKET IN SIX YEARS AND IT WILL WRECK YOU.', 'blue'); });
function poetWrite() {
  const t = nycTime(TIME.utc), W = WX.override || WX.cur, h = t.hours, n = POET.n++;
  const when = h < 5 ? 'in the hour nobody owns' : h < 9 ? 'early, while the island is still rinsing its face' : h < 12 ? 'in the plain light of morning' : h < 16 ? 'at the flat bright middle of the day' : h < 19 ? 'as the light goes gold and sideways' : 'after dark, under the sodium and the neon';
  const sky = W === 'RAIN' ? 'the rain is writing on everything' : W === 'SNOW' ? 'the snow is erasing the street politely' : W === 'HARBOR FOG' ? 'the fog has taken the harbour back' : W === 'SCATTERED' ? 'the clouds are in no hurry' : 'the sky is the colour of a clean screen';
  const season = t.mo === 12 || t.mo <= 2 ? 'winter' : t.mo <= 5 ? 'spring' : t.mo <= 8 ? 'summer' : 'autumn';
  const things = ['a pigeon with one bad foot', 'the ferry going the other way', 'the bell tower clearing its throat', 'a cab with its light on', 'the carousel horses, holding their breath', 'the man with the metal detector', 'a laundromat glowing like an aquarium', 'the ducks, unbothered', 'a payphone that rang for no one', 'the Meme cards turning in the wind'];
  const ends = ['and you, reading this, which is the whole trick.', 'and nobody asked it to be beautiful. it is anyway.', 'keep this. it will be worth nothing, which is the point.', 'everything here is temporary. that is what makes it ours.', 'the island does not know your name. it saves you a spot.', 'gm. that is the poem. the rest was weather.'];
  const thing = things[(n * 7 + t.days) % things.length], end = ends[(n * 5 + t.h) % ends.length];
  return `for someone passing, ${season}\n\n${when},\n${sky}.\nI watched ${thing}\nand thought about how a city\nis just strangers agreeing\nto keep the lights on for each other.\n\n${end}\n\n                         · the poet, ${t.mo}/${t.d}`;
}
function poetAsk() { if (POET.busy > 0) return; const h = nycTime(TIME.utc).hours; if (h < 11 || h >= 20) { toast('THE POET IS NOT HERE YET. ELEVEN TO EIGHT.'); return; } POET.text = poetWrite(); POET.i = 0; POET.busy = 1; POET.div.textContent = ''; POET.div.style.display = 'block'; POET.p0 = [P.x, P.z]; toast('HE LOOKS AT YOU, THEN AT THE SKY, AND STARTS TYPING.'); }
function poetFrame(dt) {
  const h = nycTime(TIME.utc).hours, here = h >= 11 && h < 20; POET.p.g.visible = here; if (!here && POET.busy <= 0) return; const d = Math.hypot(P.x - POET.X, P.z - POET.Z);
  const typing = POET.busy > 0 && POET.i < POET.text.length || (here && d < 40 && Math.sin(LIFE.t * 0.21) > 0.3); const p = POET.p; p.arms[0].rotation.x = typing ? -1.1 + Math.abs(Math.sin(LIFE.t * 23)) * 0.15 : -0.6; p.arms[1].rotation.x = typing ? -1.1 + Math.abs(Math.sin(LIFE.t * 19 + 1)) * 0.15 : -0.6;
  if (typing && d < 25 && AC && AC.state === 'running' && oceanGain && oceanGain.gain.value > 0 && Math.random() < dt * 9) { try { beep(180 + Math.random() * 120, 0.018, 'square', Math.min(0.03, 0.4 / (d + 3))); } catch (e) { } }
  if (POET.busy > 0) { POET.carriage.position.x = 0.12 - (POET.i % 40) / 40 * 0.24; if (POET.i < POET.text.length) { POET.acc = (POET.acc || 0) + dt * 22; while (POET.acc > 1 && POET.i < POET.text.length) { POET.acc -= 1; const ch = POET.text[POET.i++]; if (ch === '\n' && d < 25) { try { beep(2400, 0.15, 'sine', 0.02); } catch (e) { } } } POET.div.textContent = POET.text.slice(0, POET.i); }
    else { POET.busy += dt; if (POET.busy > 3) poetSecret(); } if (Math.hypot(P.x - POET.p0[0], P.z - POET.p0[1]) > 3 || POET.busy > 22) { POET.busy = 0; POET.div.style.display = 'none'; } }
}
window.__FRAMES.push(dt => { try { poetFrame(dt); } catch (e) { if (!POET.err) { POET.err = e; console.warn('v162 poet', e); } } });
