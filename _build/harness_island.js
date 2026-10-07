/* MEME ISLAND headless harness: parse, runtime, movement, eggs, soak.  node harness_island.js ../site/index.html */
const fs = require('fs'), path = require('path');
const NM = path.join(process.env.HOME, 'Documents/Claude/Projects/ARCHITECT/node_modules');
const acorn = require(NM + '/acorn'), { JSDOM } = require(NM + '/jsdom'), THREE = require(NM + '/three');
const html = fs.readFileSync(process.argv[2], 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
scripts.forEach(s => acorn.parse(s, { ecmaVersion: 2022 })); console.log('PASS 1 parse', scripts.length, 'scripts');
const dom = new JSDOM(html.replace(/<script[\s\S]*?<\/script>/g, ''), { pretendToBeVisual: true, runScripts: 'outside-only', url: 'https://local.test/' });
const w = dom.window; global.window = w; global.document = w.document;
w.HTMLCanvasElement.prototype.getContext = function (t) { if (t === '2d') return { fillStyle: '', font: '', textAlign: '', textBaseline: '', fillRect() { }, fillText() { }, drawImage() { }, clearRect() { }, getImageData: () => ({ data: [0, 0, 0, 255] }), measureText: s => ({ width: String(s).length * 10 }) }; return null; };
const R = THREE.WebGLRenderer; let renders = 0;
w.THREE = Object.assign({}, THREE, { WebGLRenderer: function () { return { setPixelRatio() { }, setSize() { }, render() { renders++; }, setClearColor() { }, shadowMap: {}, capabilities: { getMaxAnisotropy: () => 8 }, domElement: w.document.createElement('canvas') }; } });
w.matchMedia = () => ({ matches: false }); w.requestAnimationFrame = () => 0; w.performance = { now: () => 0 };
w.HTMLCanvasElement.prototype.requestPointerLock = () => { };
let errs = 0; w.addEventListener('error', e => { errs++; console.log('ERR', e.message); });
w.eval(scripts[0]); w.eval(scripts[1]);
const G = w.__game; if (!G) throw new Error('no hooks');
console.log('PASS 2 runtime: walls', G.SEGS.length, 'posts', G.CIRCS.length, 'keys', G.KEYS.length, 'residents', G.residents.length, 'cards', G.cardBuf.map(b => b.ids.length).join('+'));
G.start(); const P = G.P, K = G.keys;
function walk(tx, tz, max = 4000, run) {
  for (let i = 0; i < max; i++) {
    const dx = tx - P.x, dz = tz - P.z; if (Math.hypot(dx, dz) < 0.6) return true;
    P.yaw = Math.atan2(-dx, -dz); K.KeyW = true; K.ShiftLeft = !!run; G.step(1 / 60, 1);
  }
  K.KeyW = false; return false;
}
const ok = (c, m) => { if (!c) { console.log('FAIL', m, 'at', P.x.toFixed(2), P.y.toFixed(2), P.z.toFixed(2)); process.exitCode = 1; } else console.log('  ok', m); };
// 3. arrivals: pier, under the billboard, to the floor
G.teleport(0, 176, 0); ok(Math.abs(P.y - 0.55) < 0.05, 'spawn on the pier deck');
ok(walk(0, 110), 'pier to beach, under the billboard');
ok(walk(0, 30), 'beach to the floor, through the toll');
ok(walk(0, 1, 6000), 'climb the floor price mountain to the summit'); console.log('    summit feet y', P.y.toFixed(2));
ok(G.state.keys >= 1, 'summit key collected');
// brain: through the gap to the centre
G.teleport(28, -28, 0); ok(walk(44, -44, 6000), 'into the BRAIN through its gap');
// bunker end to end
G.teleport(18, 44, 0); ok(walk(65, 44, 6000), 'SURVIVE bunker end to end');
// bank private room
G.teleport(-46, 0, 0); ok(walk(-56, 0) && walk(-71, 6.5), 'into the bank and the private viewing room');
// summer
G.teleport(-44, 54, 0); ok(walk(-58.8, 45), 'summer boardwalk to its west end');
// vault blocked before keys
G.teleport(0, -108, 0); walk(0, -125, 1500); ok(P.z > -122.4, 'vault port blocked without six keys (z=' + P.z.toFixed(2) + ')');
// OM portal teleports onto the lighthouse roof, then the fall
G.teleport(30, -72, 0); walk(30, -79.2, 1500); P.yaw = 0; K.KeyW = true; for (let i = 0; i < 30 && P.y < 40; i++) G.step(1 / 60); K.KeyW = false; ok(P.y > 40, 'OM portal drops you on the lighthouse roof (y=' + P.y.toFixed(1) + ')');
K.KeyW = false; for (let i = 0; i < 60; i++) G.step(1 / 60); ok(P.y > 40, 'standing on the roof');
P.yaw = -Math.PI / 2; K.KeyW = true; for (let i = 0; i < 600; i++) G.step(1 / 60); K.KeyW = false; ok(P.y < 3, 'walked off the roof and landed (y=' + P.y.toFixed(2) + ')');
// 2030 stones by jumping
G.teleport(0, 180, Math.PI); P.yaw = Math.PI; let landed = 0;
for (let s = 0; s < 8; s++) { K.KeyW = true; K.ShiftLeft = false; for (let i = 0; i < 400 && P.ground; i++) { G.step(1 / 60); const f = G.floorAt(P.x, P.z + 0.5, P.y); if (f.f === null) break; } P.vy = 7.6; P.ground = false; P.fallFrom = P.y; for (let i = 0; i < 120; i++) { G.step(1 / 60); if (P.ground) break; } if (P.ground && P.z > 182) landed++; console.log('    jump', s, 'z', P.z.toFixed(2), 'y', P.y.toFixed(2), 'ground', P.ground); }
K.KeyW = false; K.ShiftLeft = false; console.log('    furthest z', P.z.toFixed(1), 'landings', landed);
ok(P.z > 210, 'hopped the 2030 stones');
// all keys -> vault
G.KEYS.forEach(k => { G.teleport(k.x + 0.01, k.z, 0); P.y = k.y; G.step(1 / 60, 3); });
ok(G.state.keys === 6 && G.state.vault, 'six keys open the vault');
G.teleport(0, -108, 0); ok(walk(0, -127.5, 2000), 'walk into the vault');
// eggs
Object.keys(G.EGGS).forEach(k => { try { G.EGGS[k](); } catch (e) { console.log('FAIL egg', k, e.message); process.exitCode = 1; } }); console.log('  ok eggs fired:', Object.keys(G.EGGS).join(' '));
['golden', 'day', 'night', 'dawn'].forEach(p => G.setPreset(p, true));
// arrow keys walk and turn
{ G.teleport(0, 60, 0); const z0 = P.z; K.ArrowUp = true; G.step(1/60, 60); K.ArrowUp = false; ok(P.z < z0 - 3, 'arrow up walks forward'); const y0 = P.yaw; K.ArrowLeft = true; G.step(1/60, 30); K.ArrowLeft = false; ok(P.yaw > y0 + 0.5, 'arrow left turns'); }
// delights
G.startRide(); ok(G.RIDE.on, 'wheel ride starts'); G.step(1/30, 26*30+10); ok(!G.RIDE.on, 'wheel ride completes and drops you at the gate');
G.teleport(G.TOUCH.x, G.TOUCH.z, 0); K.KeyW=false; G.step(1/30, 330); ok(G.TOUCH.issued, 'touch grass receipt issued after 10 s still');
G.WHALE.t = 11; G.step(1/30, 120); ok(G.WHALE.count >= 1, 'whale surfaced');
G.DRYER.t = 0; G.teleport(-52, -8.2, 0); G.step(1/60, 2); w.dispatchEvent(new w.KeyboardEvent('keydown', { code: 'KeyE', key: 'e' })); G.step(1/60, 5); ok(G.DRYER.t > 0, 'paper hands dryer fires on E');
try { G.postcard(); console.log('  ok postcard ran'); } catch (e) { console.log('FAIL postcard', e.message); process.exitCode = 1; }
// a browser's first rAF timestamp can predate boot: a negative dt must not throw
try { G.frame(-0.03); G.frame(-0.03); G.frame(0); console.log('  ok negative first frame'); } catch (e) { console.log('FAIL negative first frame', e.message); process.exitCode = 1; }
// sky and calendar
{ const u = G.nycUtc(2026, 6, 21, 13, 0); G.setTime(u); G.step(1/60, 3); const el = G.SKY.el; ok(el > 70 && el < 74, 'solstice 13:00 EDT sun elevation ' + el.toFixed(1));
  ok(G.SKY.t.zone === 'EDT', 'June is EDT'); G.setTime(G.nycUtc(2026, 1, 15, 12, 0)); G.step(1/60, 2); ok(G.SKY.t.zone === 'EST', 'January is EST');
  G.setTime(G.nycUtc(2026, 10, 7, 23, 30)); G.step(1/60, 120); ok(G.SKY.w.w > 0.9, 'night photo dominates at 23:30'); ok(G.CAL.spooky, 'October is SPOOKY SZN'); ok(G.CAL.ev.includes('MINT DAY'), 'Wed 7 Oct is a mint day');
  G.setTime(G.nycUtc(2026, 10, 31, 22, 0)); G.step(1/60, 120); ok(G.CAL.fire, 'Oct 31 fireworks day'); G.step(1/60, 240); ok(G.FW.pts.visible, 'fireworks flying');
  G.setTime(G.nycUtc(2026, 10, 7, 18, 10)); G.step(1/60, 120); console.log('    golden check weights', G.SKY.w.toArray().map(v=>v.toFixed(2)).join(','), 'sun', G.SKY.el.toFixed(1));
  ok(G.SC.length === 66, 'sculptures placed: ' + G.SC.length); }
// soak
G.teleport(0, 60, 0); const t0 = Date.now(); G.step(1 / 60, 900); console.log('PASS soak 900 frames in', Date.now() - t0, 'ms, renders', renders, 'errors', errs);
const stolen = G.agents.filter(a => a.stolen).length; console.log('  agents carrying JPGs after soak:', stolen);
if (errs) process.exitCode = 1;
