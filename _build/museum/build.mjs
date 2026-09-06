import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '../../assets/museum/museum.js');
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
}
