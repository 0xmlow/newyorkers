#!/usr/bin/env node
/* Build a headless job file from one or more image folders.
   Usage: node make-jobs.mjs --out /abs/OUT_DIR --job /abs/job.json <folder> [<folder> ...]
   Filenames are parsed as "<token> <Character Name>.<ext>". Files without a
   leading token number get token = the bare filename. Duplicate "(1)" takes are skipped. */
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
function flag(name, def){ const i = args.indexOf(name); return i>=0 ? args[i+1] : def; }
const outDir = flag('--out');
const jobPath = flag('--job');
const maxDim = +flag('--maxDim', 720);
const folders = args.filter((a,i)=>!a.startsWith('--') && args[i-1]!=='--out' && args[i-1]!=='--job' && args[i-1]!=='--maxDim');
if(!outDir || !jobPath || !folders.length){
  console.error('usage: node make-jobs.mjs --out OUT_DIR --job job.json folder [folder...]');
  process.exit(2);
}

const EXT = new Set(['.jpg','.jpeg','.png','.webp']);
const items = [];
const seen = new Set();
for(const folder of folders){
  const files = fs.readdirSync(folder).filter(f=>EXT.has(path.extname(f).toLowerCase())).sort();
  for(const f of files){
    const stem = f.replace(/\.[^.]+$/,'');
    if(/\(\d+\)$/.test(stem.trim())) continue;          // alt takes
    const m = stem.match(/^(\d+)\s+(.+)$/);
    const token = m ? m[1] : stem;
    const name = m ? m[2].trim() : stem;
    if(seen.has(token)) continue;                        // first occurrence wins
    seen.add(token);
    items.push({ token, name, src: path.join(folder, f) });
  }
}
items.sort((a,b)=> (+a.token||0) - (+b.token||0) || String(a.token).localeCompare(String(b.token)));

fs.mkdirSync(path.dirname(jobPath), {recursive:true});
fs.writeFileSync(jobPath, JSON.stringify({ out: outDir, maxDim, delayCs: 6, items }, null, 1));
console.log(`job written: ${jobPath} · ${items.length} items → ${outDir}`);
