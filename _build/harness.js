/* YOUR MOM'S BASEMENT headless harness: parse, runtime, movement through every door, eggs, soak.  node harness.js ../site/index.html */
const fs = require('fs'), path = require('path');
const NM = path.join(process.env.HOME, 'Documents/Claude/Projects/ARCHITECT/node_modules');
const acorn = require(NM + '/acorn'), { JSDOM } = require(NM + '/jsdom'), THREE = require(NM + '/three');
const html = fs.readFileSync(process.argv[2], 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
scripts.forEach(s => acorn.parse(s, { ecmaVersion: 2022 })); console.log('PASS 1 parse', scripts.length, 'scripts');
const dom = new JSDOM(html.replace(/<script[\s\S]*?<\/script>/g, ''), { pretendToBeVisual: true, runScripts: 'outside-only', url: 'https://local.test/' });
const w = dom.window; global.window = w; global.document = w.document;
w.HTMLCanvasElement.prototype.getContext = function (t) { if (t === '2d') return { fillStyle: '', font: '', textAlign: '', textBaseline: '', globalAlpha: 1, lineWidth: 1, strokeStyle: '', fillRect() { }, strokeRect() { }, fillText() { }, drawImage() { }, clearRect() { }, save() { }, restore() { }, translate() { }, rotate() { }, createLinearGradient: () => ({ addColorStop() { } }), createRadialGradient: () => ({ addColorStop() { } }), getImageData: () => ({ data: [0, 0, 0, 255] }), measureText: s => ({ width: String(s).length * 10 }) }; return null; };
let renders = 0;
w.THREE = Object.assign({}, THREE, { WebGLRenderer: function () { return { setPixelRatio() { }, setSize() { }, render() { renders++; }, setClearColor() { }, getContext: () => null, shadowMap: {}, capabilities: { getMaxAnisotropy: () => 8 }, getSize: v => v.set(1, 1), domElement: w.document.createElement('canvas') }; } });
w.matchMedia = () => ({ matches: false }); w.requestAnimationFrame = () => 0; w.performance = { now: () => 0 }; w.HTMLCanvasElement.prototype.requestPointerLock = () => { };
let errs = 0; w.addEventListener('error', e => { errs++; console.log('ERR', e.message); });
w.eval(scripts[0]); w.eval(scripts[1]);
const G = w.__game; if (!G) throw new Error('no hooks');
console.log('PASS 2 runtime: walls', G.SEGS.length, 'posts', G.CIRCS.length, 'pads', G.PADS.length, 'hung', G.HUNG.length, 'models', G.MODELS.length, 'interactables', G.INTER.length, 'zones', G.ZONES.length);
G.start(); const P = G.P, K = G.keys;
function walk(tx, tz, max = 4000, run) { for (let i = 0; i < max; i++) { const dx = tx - P.x, dz = tz - P.z; if (Math.hypot(dx, dz) < 0.45) { K.KeyW = false; K.ShiftLeft = false; return true; } P.yaw = Math.atan2(-dx, -dz); K.KeyW = true; K.ShiftLeft = !!run; G.step(1 / 60, 1); } K.KeyW = false; K.ShiftLeft = false; return false; }
const ok = (c, m) => { if (!c) { console.log('FAIL', m, 'at', P.x.toFixed(2), P.y.toFixed(2), P.z.toFixed(2)); process.exitCode = 1; } else console.log('  ok', m); };
// 3. the stairs: spawn on the landing, climb to the door, come back down
G.teleport(0, 22.2, Math.PI); ok(Math.abs(P.y) < 0.05, 'spawn on the landing');
ok(walk(0, 28.6, 3000), 'climb the stairs to the door'); ok(P.y > 2.0, 'at the top (y=' + P.y.toFixed(2) + ')'); ok(walk(0, 21, 3000), 'back down');
// den, mirror blocked, card room, laundry, court, freezer
ok(walk(2.6, 18.6) && walk(2.6, 15.5) && walk(0, 14.5), 'into the den, around the couch'); G.teleport(-3.0, 15, Math.PI / 2); walk(-6, 15, 600); ok(P.x > -4.6, 'the mirror is a wall (x=' + P.x.toFixed(2) + ')');
G.teleport(-3.5, 18.5, 0); ok(walk(-5.2, 18.5) && walk(-8.5, 20.8), 'den to the card room');
G.teleport(3.5, 13.2, 0); ok(walk(5.3, 13.2) && walk(6.8, 13.4) && walk(9.6, 17.2), 'den to the laundry, onto the orange footprints');
ok(walk(9, 18.4) && walk(9, 20.5) && walk(7.5, 25.5), 'laundry to the rat court, up to the freezer');
G.teleport(-2.5, 10.5, 0); ok(walk(-2.5, 2.0, 3000), 'down the infinite hallway to the sawhorse'); walk(-2.5, -5, 600); ok(P.z > 0.8, 'the sawhorse holds (z=' + P.z.toFixed(2) + ')');
G.teleport(-2.5, 3.0, 0); ok(walk(-5.5, 3.0) && walk(-13.5, -4), 'through the side door into the bagel chamber');
ok(walk(-13.6, -9, 5000) && walk(-20, -9, 5000), 'through the bite into the hole of the bagel'); console.log('    feet in the schmear y', P.y.toFixed(2)); ok(P.y > 0.2, 'wading in cream cheese');
G.teleport(-20, -2.0, 0); walk(-20, -6, 400); ok(P.z > -3.0, 'the crust blocks the way in from the side (z=' + P.z.toFixed(2) + ')');
G.teleport(24, 21.5, 0); ok(walk(22, 26.2), 'the cold room end to end'); G.teleport(24, 21.2, 0); G.INTER.find(i => i.label === 'GO BACK UP').fn(); ok(Math.abs(P.z - 21.5) < 0.1 && Math.abs(P.x) < 0.1, 'the freezer door returns you to the stairs');
// eggs and delights
Object.keys(G.EGGS).forEach(k => { try { G.EGGS[k](); } catch (e) { console.log('FAIL egg', k, e.message); process.exitCode = 1; } }); console.log('  ok eggs fired:', Object.keys(G.EGGS).join(', '));
G.teleport(8.3, 13, 0); G.startDryer(); ok(G.RIDE.on, 'dryer ride starts'); G.step(1 / 30, 7 * 30 + 5); ok(!G.RIDE.on && G.W.dryer.folded.visible, 'dryer ride completes, laundry folded');
G.teleport(8.6, 26.6, 0); G.openFreezer(); G.openFreezer(); G.openFreezer(); ok(G.W.freezer.open, 'the cat relents on the third try'); G.openFreezer(); ok(P.x > 20, 'E again goes into the cold room');
G.teleport(8.5, 23.5, 0); G.state.idle = 7; G.step(1 / 60, 3); ok(G.state.eggs.has('chart'), 'rats chart when you stand still in the court');
try { G.mining(); G.postcard(); console.log('  ok mining dialog and postcard ran'); } catch (e) { console.log('FAIL dialogs', e.message); process.exitCode = 1; }
['ArrowUp'].forEach(() => { G.teleport(0, 15.5, 0); const z0 = P.z; K.ArrowUp = true; G.step(1 / 60, 60); K.ArrowUp = false; ok(P.z < z0 - 2, 'arrow up walks forward'); const y0 = P.yaw; K.ArrowLeft = true; G.step(1 / 60, 30); K.ArrowLeft = false; ok(P.yaw > y0 + 0.5, 'arrow left turns'); });
try { G.frame(-0.03); G.frame(0); console.log('  ok negative first frame'); } catch (e) { console.log('FAIL negative first frame', e.message); process.exitCode = 1; }
// every tour rail runs
for (let i = 0; i < G.TOUR.length; i++) { G.playRail(Object.assign({}, G.TOUR[i], { done: null })); G.step(0.1, Math.ceil(G.TOUR[i].dur / 0.1) + 5); } ok(!G.RAIL.on, 'all ' + G.TOUR.length + ' tour rails complete');
// every hung work: its viewing spot (1.6 m out along the normal) must be legal floor with no block
let bad = 0; const badList = []; G.HUNG.forEach(h => { if (h.f < 0) return; if (h.pos.x < -1.3 && h.pos.x > -3.7 && h.pos.z < 11.0) return; const n = new THREE.Vector3(0, 0, 1).applyQuaternion(h.quat); const x = h.pos.x + n.x * 1.6, z = h.pos.z + n.z * 1.6; const f = G.floorAt(x, z, 0); const p = { x, z }; G.collide(p, 0); if (f.f === null || f.block || Math.hypot(p.x - x, p.z - z) > 0.3) { bad++; badList.push([h.n, h.pos.x.toFixed(1), h.pos.y.toFixed(1), h.pos.z.toFixed(1), f.f === null ? 'nofloor' : f.block ? 'block' : 'wall']); } });
if (badList.length) console.log('   bad spots', JSON.stringify(badList)); ok(bad === 0, 'every painting has a legal viewing spot (' + bad + ' bad)');
// soak
G.teleport(0, 15.5, 0); const t0 = Date.now(); G.step(1 / 60, 900); console.log('PASS soak 900 frames in', Date.now() - t0, 'ms, renders', renders, 'errors', errs);
if (errs) process.exitCode = 1;
