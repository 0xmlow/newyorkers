import * as T from 'three';
import assert from 'node:assert/strict';
import { Kit } from './src/kit';
// no WebGL here: the sky builds a PMREM from the renderer, so it is a no op in this check
(Kit.prototype as any).sky = function () {};
import { ROOMS } from './src/rooms';
import { NEW_WORKING_ROOMS } from './src/rooms/x';
// Canvas shim supports procedural texture data; this remains a geometry check, not a render test.
Object.assign(globalThis,{document:{createElement:()=>({width:0,height:0,getContext:()=>{const px:any=new Proxy({createImageData:(w:number,h:number)=>({data:new Uint8ClampedArray(w*h*4)}),getImageData:(_x:number,_y:number,w:number,h:number)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:()=>{},measureText:()=>({width:100})},{get:(o:any,key)=>key in o?o[key]:(()=>px)});return px;}})}});
assert.equal(ROOMS.length,179); assert.equal(new Set(ROOMS.map(r=>r.id)).size,179);
for(const def of NEW_WORKING_ROOMS){
 const scene=new T.Scene();const k=new Kit(scene,{renderer:{} as T.WebGLRenderer,quality:'low',reduced:true,atlas:async()=>new T.Texture(),atlasGrid:1,perAtlas:1,hour:4,dynamic:false});
 const b=def.build(k,{pieces:[],all:[],thumb:()=>'',reduced:true,quality:'low',wallStart:()=>0});
 assert(b.mounts.length>=12,def.id+' needs at least 12 mounts');
 for(const p of [b.spawn,...b.mounts.map(m=>m.target)]){assert(p.toArray().every(Number.isFinite));assert(!k.blocks.some(b=>p.x>b.x0&&p.x<b.x1&&p.z>b.z0&&p.z<b.z1),def.id+' target inside collision volume');assert(p.x>=b.bounds[0]&&p.x<=b.bounds[1]&&p.z>=b.bounds[2]&&p.z<=b.bounds[3],def.id+' target outside bounds');}
 let triangles=0;scene.updateMatrixWorld(true);scene.traverse(o=>{if(o instanceof T.Mesh){const g=o.geometry;assert(Array.from(g.attributes.position.array).every(Number.isFinite));assert(o.matrixWorld.elements.every(Number.isFinite));triangles+=(g.index?.count??g.attributes.position.count)/3;}});
 assert(triangles<150000,def.id);console.log(def.id,Math.round(triangles),'triangles,',b.mounts.length,'mounts, finite targets inside movement bounds');k.dispose();
}
