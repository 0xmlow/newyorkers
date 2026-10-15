import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(import.meta.dirname,'..');
const R=await import(pathToFileURL(root+'/dist/vendor/three.module.js'));
class El{constructor(){this.style={};this.dataset={};this.children=[];this.classList={add(){},remove(){},toggle(){}};this.hidden=false;this.open=false;this.tagName='CANVAS'}addEventListener(){}focus(){}setAttribute(){}remove(){}showModal(){this.open=true}close(){this.open=false}getContext(){return new Proxy({}, {get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)})}}
const els=new Map();globalThis.document={createElement:()=>new El(),querySelector:s=>{if(!els.has(s))els.set(s,new El());return els.get(s)},querySelectorAll:()=>[],body:new El(),addEventListener(){}};
globalThis.window=globalThis;globalThis.self=globalThis;globalThis.innerWidth=1440;globalThis.innerHeight=900;globalThis.devicePixelRatio=1;globalThis.matchMedia=()=>({matches:false});globalThis.localStorage={getItem:()=>null,setItem(){},removeItem(){}};globalThis.addEventListener=()=>{};globalThis.requestAnimationFrame=()=>{};globalThis.fetch=async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(root+'/dist/'+url))});
class FakeRenderer{constructor(){this.shadowMap={};this.capabilities={getMaxAnisotropy:()=>8};this.info={render:{},memory:{}}}setPixelRatio(){}setSize(){}render(s,c){s.updateMatrixWorld(true);c.updateMatrixWorld(true)}}
class FakeLoader{load(url){if(!fs.existsSync(root+'/dist/'+url))throw Error('Missing '+url);return new R.Texture()}}
globalThis.TEST_THREE={...R,WebGLRenderer:FakeRenderer,TextureLoader:FakeLoader};
globalThis.TEST_ATMOSPHERE=()=>({render(){},resize(){},quality(){},ao:{enabled:true}});
let code=fs.readFileSync(root+'/dist/app.js','utf8').replace("import * as T from './vendor/three.module.js';","const T=globalThis.TEST_THREE;");
code=code.replace("import {atmosphere} from './atmosphere.js';","const atmosphere=globalThis.TEST_ATMOSPHERE;");
code=code.replaceAll("from './materials.js'","from '"+pathToFileURL(root+'/dist/materials.js')+"'").replaceAll("from './installations.js'","from '"+pathToFileURL(root+'/dist/installations.js')+"'").replaceAll("from './vendor/addons/geometries/RoundedBoxGeometry.js'","from '"+pathToFileURL(root+'/dist/vendor/addons/geometries/RoundedBoxGeometry.js')+"'");
try{await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))}catch(e){console.error(e.message);process.exit(1)}
const d=globalThis.galleryDebug;let nodes=0,instances=0,triangles=0;
d.scene.traverse(o=>{nodes++;if(o.geometry){const pos=o.geometry.attributes.position;for(const x of pos?.array||[])if(!Number.isFinite(x))throw Error('Nonfinite vertex');triangles+=(o.geometry.index?o.geometry.index.count:pos?.count||0)/3*(o.count||1)}if(o.isInstancedMesh){instances+=o.count;for(const x of o.instanceMatrix.array)if(!Number.isFinite(x))throw Error('Nonfinite matrix')}for(const x of [...o.position,...o.scale])if(!Number.isFinite(x))throw Error('Nonfinite transform')});
if(d.art.length!==24)throw Error('Wrong art count');if(d.errors.length)throw Error(d.errors.join(','));
const end=d.targets.find(t=>t.title==='Reclaim the building');end.fn();if(d.getState().reclaimed)throw Error('Puzzle bypass');
for(let i=0;i<6;i++)els.get('#hype').onclick();if(d.getState().pressure!==100)throw Error('Pressure failure');
const floor=d.rooms.loft.g;const positions=[];floor.traverse(o=>{if(o.isGroup)positions.push([...o.position])});
for(const name of ['The original lease','A photograph without a logo','The unsent letter','The petition','The spare key','The seed envelope']){const t=d.targets.find(t=>t.title===name);if(!t)throw Error('Missing clue');t.fn()}
if(d.getState().evidence.length!==6)throw Error('Clue count');end.fn();if(!d.getState().reclaimed||d.getState().pressure!==0)throw Error('Restoration failed');
for(const id of Object.keys(d.rooms)){d.go(id);d.setMode('walk');const r=d.rooms[id];if(Object.values(d.rooms).filter(r=>r.g.visible).length!==1)throw Error('Room isolation');const [x,y,z]=r.spawn;if(Math.abs(x)>r.w/2||Math.abs(z)>r.d/2||r.blocks.some(b=>x>b[0]&&x<b[1]&&z>b[2]&&z<b[3]))throw Error('Invalid spawn '+id);if(d.camera.position.y!==1.68)throw Error('Eye height')}
if(d.installations.features.length!==6)throw Error('Missing optical studies');
for(const f of d.installations.features){if(f.pos.some(x=>!Number.isFinite(x)))throw Error('Invalid viewing point');const r=d.rooms[f.room];if(r.blocks.some(b=>f.pos[0]>b[0]&&f.pos[0]<b[1]&&f.pos[2]>b[2]&&f.pos[2]<b[3]))throw Error('Obstructed viewing point '+f.id)}
for(const m of d.materialLibrary.materials){let shader={uniforms:{},fragmentShader:R.ShaderLib.standard.fragmentShader};m.onBeforeCompile(shader);if(!shader.fragmentShader.includes('vec2 surfaceUV')||!shader.uniforms.reliefHeight.value)throw Error('Relief shader assembly failed')}
const report={opticalStudies:6,scannedMaterials:3,heightMappedMaterials:d.materialLibrary.materials.length,shaderAssembly:true,passed:true,artworks:d.art.length,interactiveTargets:d.targets.length,rooms:Object.keys(d.rooms),clues:6,pressureStages:true,gatedEnding:true,restoration:true,finiteGeometry:true,spawnClearance:true,nodes,instances,sceneTriangles:Math.round(triangles),browserRendering:'UNVERIFIED: browser control service unavailable',gpuPerformance:'UNVERIFIED',note:'CPU scene construction with real Three.js geometry; renderer and image decoding are mocked.'};fs.writeFileSync(root+'/checks/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
