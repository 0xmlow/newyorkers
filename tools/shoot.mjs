// shoot.mjs <html> <outPrefix> <mode: views|film|perf> [w h] [mobile]
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
const [,, HTML, OUTP, MODE = 'views', W = '1280', H = '720', MOB = ''] = process.argv;
const SCR = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const DBG = 9300 + Math.floor(Math.random() * 500);
const prof = path.join(SCR, 'chrome-prof-' + DBG);
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${DBG}`, `--user-data-dir=${prof}`, `--window-size=${W},${H}`,
  '--no-first-run', '--no-default-browser-check', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=metal', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 80; i++) { try { targets = await (await fetch(`http://127.0.0.1:${DBG}/json`)).json(); if (targets.find((t) => t.type === 'page')) break; } catch { } await sleep(250); }
const page = targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const waits = new Map(); const logs = [];
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && waits.has(m.id)) { waits.get(m.id)(m); waits.delete(m.id); }
  else if (m.method === 'Runtime.consoleAPICalled') logs.push(m.params.type + ': ' + m.params.args.map((a) => a.value ?? a.description).join(' '));
  else if (m.method === 'Runtime.exceptionThrown') logs.push('EXCEPTION: ' + JSON.stringify(m.params.exceptionDetails).slice(0, 500));
  else if (m.method === 'Log.entryAdded') logs.push('log ' + m.params.entry.level + ': ' + m.params.entry.text.slice(0, 300)); });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; waits.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 600)); return r.result.result.value; };
const shot = async (file, q = 82) => { const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: q }); fs.writeFileSync(file, Buffer.from(r.result.data, 'base64')); };
await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: +W, height: +H, deviceScaleFactor: 1, mobile: !!MOB });
if (MOB) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
// seeded Math.random so the original and the upgrade lay out the same garden; manual frame clock
await send('Page.addScriptToEvaluateOnNewDocument', { source: `(function(){let s=4242;Math.random=function(){s=(s*16807)%2147483647;return (s-1)/2147483646;};
  const raf=window.requestAnimationFrame.bind(window); window.__manual=false; window.requestAnimationFrame=function(f){ if(window.__manual) return 0; return raf(f); };})();` });
await send('Page.navigate', { url: 'file://' + HTML });
for (let i = 0; i < 120; i++) { try { if (await ev('typeof animate==="function" && typeof player==="object"')) break; } catch { } await sleep(500); }
// wait for the upgrade (if present) to finish
for (let i = 0; i < 60; i++) { const r = await ev('window.UP ? JSON.stringify(UP.ready) : "none"'); if (r === 'none' || (r.includes('rig') && r.includes('palm') && r.includes('lamps') && r.includes('rocks') && r.includes('aloe') && r.includes('bench')) || r.includes('"rig":"off"')) break; await sleep(500); }
const ready = await ev('window.UP ? JSON.stringify(UP.ready) : "none"');
await ev(`(function(){ overlay.classList.add('hidden'); overlay.style.display='none'; paused=false; window.__manual=true;
  clock.getDelta=function(){ this.elapsedTime=(this.elapsedTime||0)+1/30; return 1/30; };
  window.frame=function(n){ for(let i=0;i<n;i++) animate(); return true; };
  window.pose=function(x,y,z,yaw,pitch){ player.x=x; player.y=y; player.z=z; player.yaw=yaw; player.pitch=pitch; player.vy=0; };
  window.freeze=function(on){ window.__frz=on; };
  return 1; })()`);
const views = {
  entrance: [0, 1.7, 56, 0, -0.02],
  alley: [1.2, 1.7, 40, 0.35, -0.05],
  pergola: [-4, 1.7, 16, 1.57, -0.05],
  cactus: [-12, 1.7, 8, 2.1, -0.12],
  cactus2: [-30, 1.7, -27, 0.9, -0.1],
  terrace: [20, 1.7, 9, 0, -0.12],
  rocks: [-50, 1.7, 0, 3.6, -0.25],
};
const LA = (cx, cz, tx, tz, pitch) => [cx, 1.7, cz, Math.atan2(-(tx - cx), -(tz - cz)), pitch];
Object.assign(views, {
  euphorbia: LA(-40, 4, -47, -8, -0.1),
  lamp_bench: LA(14, -3, 14.5, -10, -0.12),
  pergola_bench: LA(-21, 16, -14, 18, -0.15),
  pots: LA(4, 0, 10, 5, -0.25),
  rockfield: LA(-24, -27, -30, -40, -0.35),
  euph2: LA(-52, 15, -60, 6, -0.08),
  euph3: LA(4, -4, 12, -14, -0.1),
  rocks2: LA(-40, -14, -52, -20, -0.45),
});
const W_ = +W;
if (MODE === 'views' || MODE === 'perf') {
  const out = {};
  for (const [name, p] of Object.entries(views)) {
    if (MODE === 'perf' && name !== 'cactus' && name !== 'terrace' && name !== 'entrance') continue;
    await ev(`pose(${p.join(',')}); setMode('sunset'); frame(90); true`);
    // keep the pose exact: the step loop applies collisions and gravity; re-pose and render one frame
    await ev(`pose(${p.join(',')}); frame(1); true`);
    const info = await ev(`(function(){ const i=renderer.info.render; const t0=performance.now(); frame(10); const ms=(performance.now()-t0)/10;
      return {calls:i.calls,tris:i.triangles,frameMs:+ms.toFixed(1),mixerMs:window.UP?+(UP.stats.mixerMs).toFixed(2):0}; })()`);
    out[name] = info;
    if (MODE === 'views') await shot(`${OUTP}_${name}.jpg`);
  }
  if (MODE === 'views') {
    await ev(`pose(14,1.7,-3,Math.atan2(-0.5,7),-0.12); setMode('night'); frame(150); pose(14,1.7,-3,Math.atan2(-0.5,7),-0.12); frame(1); true`);
    await shot(`${OUTP}_terrace_night.jpg`);
    await ev(`setMode('day'); frame(150); pose(-12,1.7,8,2.1,-0.12); frame(1); true`);
    await shot(`${OUTP}_cactus_day.jpg`);
    // tourist close up: stand 3 m in front of the nearest tourist mid photo
    await ev(`setMode('sunset'); frame(120); (function(){ const n=npcs[1]; n.state='photo'; n.t=0.5; n.photoDur=99; const p=n.g.position, ry=n.g.rotation.y;
      const cx=p.x+Math.sin(ry)*3.2, cz=p.z+Math.cos(ry)*3.2; pose(cx,1.7,cz,Math.atan2(-(p.x-cx),-(p.z-cz)),-0.12); frame(45); pose(cx,1.7,cz,Math.atan2(-(p.x-cx),-(p.z-cz)),-0.12); frame(1); return 1; })()`);
    await shot(`${OUTP}_tourist.jpg`);
  }
  fs.writeFileSync(`${OUTP}_${MODE}.json`, JSON.stringify({ ready, views: out, logs }, null, 1));
  console.log(JSON.stringify({ ready, views: out }, null, 0));
}
if (MODE === 'props') {
  const jobs = {
    aloe: `(function(){const e=__euph[11].position; return [e.x+6,5.5,e.z+6,e.x,1.8,e.z];})()`,
    pot: `(function(){const e=__pots[0].g.position; return [e.x+2.2,1.7,e.z+2.2,e.x,0.8,e.z];})()`,
    lantern: `(function(){const e=__lamps[8].position; return [e.x+1.6,2.9,e.z+1.6,e.x,2.6,e.z];})()`,
    rock: `(function(){const m=new THREE.Matrix4(),v=new THREE.Vector3(); let best=null,bd=1e9; for(let i=0;i<__rocks.count;i++){__rocks.getMatrixAt(i,m); v.setFromMatrixPosition(m); const d=Math.hypot(v.x+40,v.z+14); if(d<bd){bd=d;best=v.clone();}} return [best.x+2,1.2,best.z+2,best.x,0.1,best.z];})()`,
    palm: `(function(){const e=__palms[9].g.position; return [e.x+9,3,e.z+9,e.x,5,e.z];})()`,
    bench: `[13,1.5,-6.4,13,0.4,-9.2]`,
  };
  await ev(`setMode('sunset'); frame(60); true`);
  const CF = path.join(SCR, 'props_coords.json');
  const coords = fs.existsSync(CF) ? JSON.parse(fs.readFileSync(CF)) : {};
  for (const [k, j] of Object.entries(jobs)) { if (!coords[k]) coords[k] = await ev(j); }
  fs.writeFileSync(CF, JSON.stringify(coords));
  for (const k of Object.keys(jobs)) {
    await ev(`(function(){ const a=${JSON.stringify(coords[k])}; frame(1); camera.position.set(a[0],a[1],a[2]); camera.lookAt(a[3],a[4],a[5]); renderer.render(scene,camera); return 1; })()`);
    await shot(`${OUTP}_prop_${k}.jpg`);
  }
}
if (MODE === 'hang') {
  const r = await ev(`new Promise(function(res){ const c=document.createElement('canvas'); c.width=200; c.height=260; const g=c.getContext('2d'); g.fillStyle='#d42a75'; g.fillRect(0,0,200,260); g.fillStyle='#f6c21b'; g.font='bold 60px Georgia'; g.fillText('MLOW',10,140);
    const img=new Image(); img.onload=function(){ const before=dropIdx; hangArt(img,'hang-test.png'); const m=emptyFrames[0]; frame(5);
      res({frames:emptyFrames.length, before:before, after:dropIdx, title:m.userData.title, pos:[m.position.x,m.position.y,m.position.z]}); }; img.src=c.toDataURL(); })`);
  console.log('HANG', JSON.stringify(r));
  const p = r.pos; const wp = await ev(`(function(){ const m=emptyFrames[0]; const v=new THREE.Vector3(); m.getWorldPosition(v); const n=new THREE.Vector3(0,0,1).applyQuaternion(m.getWorldQuaternion(new THREE.Quaternion())); camera.position.set(v.x+n.x*3,v.y+0.2,v.z+n.z*3); camera.lookAt(v); renderer.render(scene,camera); return [v.x,v.y,v.z]; })()`);
  await shot(`${OUTP}_hang.jpg`);
}
if (MODE === 'film') {
  const dir = OUTP + '_frames'; fs.mkdirSync(dir, { recursive: true });
  // follow one tourist down the east walk, then hold while a second one stops for a photo and looks at the visitor
  await ev(`setMode('sunset'); frame(30); window.__film=npcs[2]; true`);
  const N = 210;
  for (let f = 0; f < N; f++) {
    await ev(`(function(f){ const n=__film; const p=n.g.position;
      if(f===120){ n.state='photo'; n.t=0; n.photoDur=6; }
      const ry=n.g.rotation.y; let cx,cz;
      if(f<120){ const d=4.2, side=1.4; cx=p.x+Math.sin(ry)*d+Math.cos(ry)*side; cz=p.z+Math.cos(ry)*d-Math.sin(ry)*side; }
      else { const a=ry+0.95*Math.min(1,(f-120)/40), d=3.0; cx=p.x+Math.sin(a)*d; cz=p.z+Math.cos(a)*d; }
      pose(cx,1.7,cz,Math.atan2(-(p.x-cx),-(p.z-cz)),-0.18); frame(1); pose(cx,1.7,cz,Math.atan2(-(p.x-cx),-(p.z-cz)),-0.18); renderer.render(scene,camera); return 1; })(${f})`);
    await shot(path.join(dir, String(f).padStart(4, '0') + '.jpg'), 85);
  }
  fs.writeFileSync(`${OUTP}_film.json`, JSON.stringify({ ready, logs }, null, 1));
  console.log('frames', N, ready);
}
chrome.kill(); await sleep(600); fs.rmSync(prof, { recursive: true, force: true });
console.log('LOGS', logs.length, logs.slice(0, 20).join('\n'));
