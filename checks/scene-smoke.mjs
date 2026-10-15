import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(import.meta.dirname,'..');
const R=await import(pathToFileURL(root+'/dist/vendor/three.module.js'));
const {GLTFLoader}=await import(pathToFileURL(root+'/dist/vendor/loaders/GLTFLoader.js'));
let queued;const cpuGLTF=new GLTFLoader();
// Use the real GLTF parser and original buffers. Texture pixel decoding needs a browser and is explicitly excluded.
cpuGLTF.register(parser=>{const dep=parser.getDependency.bind(parser);parser.getDependency=(type,index)=>type==='texture'?Promise.resolve(new R.Texture()):dep(type,index);return {name:'CPU_TEST_NO_TEXTURE_DECODE'};});
class El{constructor(){this.style={};this.dataset={};this.children=[];this.classList={add(){},remove(){},toggle(){}};this.hidden=false;this.open=false;}addEventListener(){}setAttribute(){}append(...x){this.children.push(...x)}replaceChildren(...x){this.children=x}remove(){}showModal(){this.open=true}close(){this.open=false}getContext(){return new Proxy({}, {get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)})}}
const els=new Map();globalThis.document={createElement:()=>new El(),querySelector:s=>{if(!els.has(s))els.set(s,new El());return els.get(s)},querySelectorAll:()=>[],body:new El()};
globalThis.window=globalThis;globalThis.self=globalThis;globalThis.innerWidth=1440;globalThis.innerHeight=900;globalThis.devicePixelRatio=1;globalThis.matchMedia=()=>({matches:false});globalThis.localStorage={getItem:()=>null,setItem(){}};globalThis.addEventListener=()=>{};globalThis.requestAnimationFrame=f=>{queued=f};globalThis.fetch=async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(root+'/dist/'+String(url).replace(/^\.\//,'')))});
globalThis.Image=class{set src(v){if(!fs.existsSync(root+'/dist/'+v))throw Error('Missing image '+v);this.naturalWidth=1000;this.naturalHeight=563;this.complete=true;}};
class FakeRenderer{constructor(){this.capabilities={getMaxAnisotropy:()=>8}}setPixelRatio(){}setSize(){}render(s,c){s.updateMatrixWorld(true);c.updateMatrixWorld(true)}}
class FakeLoader{load(url){if(!fs.existsSync(root+'/dist/'+url))throw Error('Missing '+url);return new R.Texture()}}
class CpuModelLoader{async loadAsync(url){let b=fs.readFileSync(root+'/dist/'+url);return cpuGLTF.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}}
globalThis.TEST_THREE={...R,WebGLRenderer:FakeRenderer,TextureLoader:FakeLoader};globalThis.TEST_GLTF=CpuModelLoader;
let expansionCode=fs.readFileSync(root+'/dist/expansion.js','utf8').replace("import * as THREE from './vendor/three.module.js';","const THREE=globalThis.TEST_THREE;").replace("import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';","const GLTFLoader=globalThis.TEST_GLTF;");
let code=fs.readFileSync(root+'/dist/app.js','utf8').replace("import * as THREE from './vendor/three.module.js';","const THREE=globalThis.TEST_THREE;").replace("import {expandBodega} from './expansion.js';","const expandBodega=globalThis.TEST_EXPAND;");
try {globalThis.TEST_EXPAND=(await import('data:text/javascript;base64,'+Buffer.from(expansionCode).toString('base64'))).expandBodega;await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));}catch(e){console.error(e.name+': '+e.message);process.exit(1);}
const b=globalThis.__bodega;if(!b.expansion)throw Error('Expansion failed to construct');await b.expansion.allReady;
let nodes=0,instances=0,triangles=0,bad=[];b.scene.traverse(o=>{nodes++;if(o.geometry){let pos=o.geometry.attributes.position;if(pos){for(let i=0;i<pos.count;i++)for(let k=0;k<3;k++)if(!Number.isFinite(pos.getComponent(i,k)))bad.push(o.uuid);triangles+=(o.geometry.index?o.geometry.index.count:pos.count)/3*(o.count||1)}if(o.isInstancedMesh){instances+=o.count;for(let x of o.instanceMatrix.array)if(!Number.isFinite(x))bad.push(o.uuid)}}});
if(bad.length)throw Error('Nonfinite geometry');if(b.artworks.length!==44||b.secrets.length!==40)throw Error('Catalog count mismatch');if(new Set(b.secrets.map(s=>s[0])).size!==40)throw Error('Duplicate secret ID');if(b.expansion.errors.length)throw Error('Asset failures '+b.expansion.errors.join(','));
for(const t of b.targets)if(typeof t.userData.action!=='function')throw Error('Missing interaction');
const ending=b.targets.find(t=>t.userData.title==='Grow the next universe');ending.userData.action();if(b.state.found.includes('first-light'))throw Error('Puzzle bypass');
for(const id of ['laundry-key','mail-key','roof-key'])b.discover(id,false);ending.userData.action();if(!b.state.found.includes('first-light'))throw Error('Puzzle failed to unlock');
for(const s of b.secrets)b.discover(s[0],false);if(b.state.found.length!==40)throw Error('Discovery failure');
const nav=[];for(const id of ['laundry','mail','roof']){b.go(id);const r=b.expansion.rooms[id],x=r.center[0]+r.spawn[0],z=r.center[2]+r.spawn[2];if(!b.valid(x,z))throw Error('Invalid spawn '+id);if(b.valid(x+100,z))throw Error('Bounds failure '+id);if(!r.group.visible||Object.values(b.expansion.rooms).some(v=>v.id!==id&&v.group.visible))throw Error('Room visibility '+id);nav.push({room:id,spawn:true,bounds:true,isolated:true});}
b.go('archive');if(b.state.zone!=='archive')throw Error('Archive transition failed');b.go('walk');if(b.state.zone!=='store')throw Error('Store return failed');
const report={result:'passed',nodes,instances,triangles:Math.round(triangles),artworks:b.artworks.length,secrets:b.secrets.length,interactiveTargets:b.targets.length,modelsLoaded:b.expansion.modelStats.length,uniqueModels:new Set(b.expansion.modelStats.map(m=>m.file)).size,navigation:nav,endingGated:true,finiteGeometry:true,assetFilesPresent:true,note:'Real Three.js geometry and GLTF parsing; texture pixel decoding, browser rendering, GPU performance, and visual UI behavior remain unverified.'};fs.writeFileSync(root+'/checks/report-v2.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
