import ts from 'typescript';import fs from 'node:fs';
for(const name of ['src/rooms.js','src/catalog.js','src/main.js','checks/validate.mjs']){const url=new URL('../'+name,import.meta.url);const src=ts.createSourceFile(name,fs.readFileSync(url,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);fs.writeFileSync(url,ts.createPrinter({newLine:ts.NewLineKind.LineFeed}).printFile(src));}
