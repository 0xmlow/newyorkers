/* build_variant.mjs <tag>: bundle src/main.ts to assets/museum/museum.<tag>.js and write museum.<tag>.html
   pointing at it, so several people can preview their own rooms against the shared server without
   touching the real bundle or museum.html. Variants are gitignored and never deployed. */
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const tag = process.argv[2]; if (!tag) { console.error('usage: node build_variant.mjs <tag>'); process.exit(1); }
const here = path.dirname(fileURLToPath(import.meta.url)), site = path.resolve(here, '../..');
const out = path.join(site, 'assets', 'museum', `museum.${tag}.js`);
await build({ entryPoints: [path.join(here, 'src/main.ts')], bundle: true, format: 'iife', target: ['es2020'], minify: false, sourcemap: false, outfile: out, logLevel: 'error', legalComments: 'none' });
const html = fs.readFileSync(path.join(site, 'museum.html'), 'utf8').replace(/assets\/museum\/museum\.js(\?b=\d+)?/, `assets/museum/museum.${tag}.js?b=${Date.now()}`);
fs.writeFileSync(path.join(site, `museum.${tag}.html`), html);
console.log(`variant ${tag}: museum.${tag}.html -> assets/museum/museum.${tag}.js`);
