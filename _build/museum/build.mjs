import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '../../assets/museum/museum.js');
import fs from 'node:fs';
import crypto from 'node:crypto';
const watch = process.argv.includes('--watch');
const opts = {
  entryPoints: [path.join(here, 'src/main.ts')],
  bundle: true,
  format: 'iife',
  target: ['es2020'],
  minify: !watch,
  sourcemap: watch ? 'inline' : false,
  outfile: out,
  logLevel: 'info',
  legalComments: 'none',
};
if (watch) {
  const { context } = await import('esbuild');
  const ctx = await context(opts);
  await ctx.watch();
  console.log('watching');
} else {
  await build(opts);
  /* Stamp the bundle's URL in museum.html so a rebuilt room is never hidden
     behind a cached museum.js. The deploy copies the page as it stands. */
  const page = path.join(here, '..', '..', 'museum.html');
  const html = fs.readFileSync(page, 'utf8');
  let stamped = html.replace(/assets\/museum\/museum\.js(\?b=\d+)?/, 'assets/museum/museum.js?b=' + Date.now());
  /* The stylesheet needs a stamp too. Cloudflare pins any browser max-age under
     four hours up to four hours, so an unversioned museum.css ships stale. Hash
     the file's contents: the URL only changes when the CSS actually changes. */
  const cssPath = path.join(here, '..', '..', 'assets', 'museum', 'museum.css');
  const cssHash = crypto.createHash('sha1').update(fs.readFileSync(cssPath)).digest('hex').slice(0, 10);
  stamped = stamped.replace(/assets\/museum\/museum\.css(\?v=[0-9a-f]+)?/, 'assets/museum/museum.css?v=' + cssHash);
  if (stamped !== html) { fs.writeFileSync(page, stamped); console.log('stamped museum.html (css ' + cssHash + ')'); }
}
