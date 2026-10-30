// the headless shooter behind shot.py: serves the site, opens each query in Chromium, screenshots, prints console errors
const { chromium } = require(process.env.NY_PW || 'playwright'); const fs = require('fs'), path = require('path'), http = require('http');
const [SITE, OUT, shotsJ, waitS, evalJS, W, H, MOB] = process.argv.slice(2); const shots = JSON.parse(shotsJ);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.glb': 'model/gltf-binary', '.hdr': 'application/octet-stream', '.wasm': 'application/wasm', '.ttf': 'font/ttf' };
(async () => {
  const srv = http.createServer((q, s) => { const p = decodeURIComponent(q.url.split('?')[0]); const f = path.join(SITE, p === '/' ? 'index.html' : p); fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); s.end(d); }); }).listen(0);
  const port = srv.address().port;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', '--disable-gpu-shader-disk-cache', '--disk-cache-size=1'] });
  const ctx = await b.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: MOB === '1' ? 2 : 1, hasTouch: MOB === '1', isMobile: MOB === '1' });
  const page = await ctx.newPage(); const logs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ' ' + m.text().slice(0, 300)); });
  page.on('response', (r) => { if (r.status() >= 400) logs.push('HTTP ' + r.status() + ' ' + r.url().split('/').slice(-2).join('/')); });
  page.on('pageerror', (e) => logs.push('EXC ' + String(e).slice(0, 400)));
  for (const s of shots) {
    const i = s.indexOf('='), name = s.slice(0, i), q = s.slice(i + 1); logs.length = 0;
    await page.goto(`http://127.0.0.1:${port}/index.html?${q.includes('intro') ? '' : 'auto=1&'}nolock&${q}&v=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
    await page.waitForTimeout(+waitS * 1000);
    if (evalJS) { try { console.log(name, 'eval:', JSON.stringify(await page.evaluate(evalJS))); } catch (e) { console.log(name, 'eval failed', String(e).slice(0, 200)); } }
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, name + '.jpg'), type: 'jpeg', quality: 82, timeout: 180000, animations: 'disabled', caret: 'initial' }); console.log('shot', name);
    for (const l of [...new Set(logs)]) console.log('  ', l);
  }
  await b.close(); srv.close();
})();
