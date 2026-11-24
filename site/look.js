import * as T from './vendor/three.module.js';
// THE BIG UPGRADE (2026-11-23), the look at engine level, after the museum's look.ts: each room is its own reflection
// probe (a cube capture of the room from its middle at eye height, prefiltered with PMREM), so brass, glass, marble and
// the GLB props reflect the brick and windows they stand among instead of a generic studio. Every texture gets the GPU's
// full anisotropy. Captured once per room, again when a model lands in it. Desktop only; ?look=0 turns it off.
export function createLook({renderer,scene,rooms,hide=()=>[]}){
 const pmrem=new T.PMREMGenerator(renderer),cubeRT=new T.WebGLCubeRenderTarget(256,{type:T.HalfFloatType}),cube=new T.CubeCamera(.1,120,cubeRT);scene.add(cube);
 const probes=new Map(),max=renderer.capabilities.getMaxAnisotropy(),seen=new WeakSet(),stale=new Set();let pending=null;
 const at={loft:[0,2.2,2],sales:[2,2,4],basement:[0,1.8,4],roof:[0,2.2,4]},strength={loft:1,sales:1.1,basement:.85,roof:.7};
 function aniso(root){root.traverse(o=>{const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];for(const m of ms){if(seen.has(m))continue;seen.add(m);for(const k of ['map','normalMap','roughnessMap','metalnessMap','aoMap','emissiveMap'])if(m[k]&&m[k].anisotropy<max){m[k].anisotropy=max;if(m[k].image)m[k].needsUpdate=true}}})}
 function capture(id){const r=rooms[id];if(!r)return;aniso(r.g);const vis=Object.values(rooms).map(x=>[x.g,x.g.visible]);for(const x of Object.values(rooms))x.g.visible=x.id===id;const hidden=hide().filter(o=>o.visible);hidden.forEach(o=>o.visible=false);
  const env=scene.environment,ei=scene.environmentIntensity;cube.position.set(...at[id]);const sm=renderer.shadowMap.autoUpdate;renderer.shadowMap.autoUpdate=false;cube.update(renderer,scene);renderer.shadowMap.autoUpdate=sm;
  vis.forEach(([g,v])=>g.visible=v);hidden.forEach(o=>o.visible=true);probes.get(id)?.dispose();const rt=pmrem.fromCubemap(cubeRT.texture);probes.set(id,rt);scene.environment=env;scene.environmentIntensity=ei}
 function use(id){if(!probes.has(id))capture(id);scene.environment=probes.get(id).texture;scene.environmentIntensity=strength[id]??.7}
 // A model landing in a room asks for a fresh capture; requests within a second are folded into one.
 function dirty(id,current){stale.add(id);clearTimeout(pending);pending=setTimeout(()=>{for(const s of stale){probes.get(s)?.dispose();probes.delete(s)}stale.clear();use(current())},900)}
 return {use,dirty,capture,aniso};
}
