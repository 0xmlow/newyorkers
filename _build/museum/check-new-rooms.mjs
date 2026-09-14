import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const dir=await mkdtemp(join(tmpdir(),'mlow-room-check-'));
try{const out=join(dir,'check.mjs');await build({entryPoints:[fileURLToPath(new URL('./check-new-rooms.ts',import.meta.url))],bundle:true,platform:'node',format:'esm',outfile:out});await import(pathToFileURL(out).href);}finally{await rm(dir,{recursive:true,force:true});}
