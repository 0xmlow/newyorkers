import * as T from './vendor/three.module.js';
// Scanned height maps drive relief UV ray marching. Color maps use sRGB;
// height, normals, roughness and occlusion remain linear data.
export function createMaterials(loader,errors){
 const cache=new Map(),materials=[],washed=[],washAmount={value:0};
 function map(name,type,repeat){const baseKey=name+'/'+type,key=baseKey+'/'+repeat.join();if(cache.has(key))return cache.get(key);let base=cache.get(baseKey);if(!base){base=loader.load(`assets/pbr/${name}-${type}.jpg`,undefined,undefined,()=>errors.push(`PBR ${name}/${type}`));base.colorSpace=type==='color'?T.SRGBColorSpace:T.NoColorSpace;base.wrapS=base.wrapT=T.RepeatWrapping;base.anisotropy=8;cache.set(baseKey,base)}const t=base.clone();t.repeat.set(...repeat);cache.set(key,t);return t}
 // opts.wash: this surface is painted over as the building gentrifies (the loft's brick and floor only).
 function pbr(name,repeat=[1,1],depth=.025,opts={}){const m=new T.MeshStandardMaterial({color:0xffffff,map:map(name,'color',repeat),normalMap:map(name,'normal',repeat),normalScale:new T.Vector2(.7,.7),roughnessMap:map(name,'roughness',repeat),roughness:1,aoMap:map(name,'ao',repeat),aoMapIntensity:.7});m.userData.surface=name;m.userData.depthScale=depth;m.userData.heightMap=map(name,'height',repeat);materials.push(m);if(opts.wash){m.userData.washColor=new T.Color(opts.wash);washed.push(m)}
 m.onBeforeCompile=shader=>{shader.uniforms.reliefHeight={value:m.userData.heightMap};shader.uniforms.reliefScale={value:depth};
 shader.fragmentShader=`uniform sampler2D reliefHeight;uniform float reliefScale;
 vec2 reliefUV(vec2 baseUV,vec3 viewPosition,vec3 n){
  if(reliefScale<0.0001)return baseUV;
  vec3 dp1=dFdx(-viewPosition),dp2=dFdy(-viewPosition);vec2 duv1=dFdx(baseUV),duv2=dFdy(baseUV);
  vec3 dp2perp=cross(dp2,n),dp1perp=cross(n,dp1);
  vec3 tangent=dp2perp*duv1.x+dp1perp*duv2.x;vec3 bitangent=dp2perp*duv1.y+dp1perp*duv2.y;
  float inv=inversesqrt(max(max(dot(tangent,tangent),dot(bitangent,bitangent)),0.000001));
  vec3 v=normalize(viewPosition);vec3 tv=vec3(dot(v,tangent*inv),dot(v,bitangent*inv),dot(v,n));
  vec2 delta=tv.xy/max(abs(tv.z),0.22)*reliefScale/20.0;
  vec2 uv=baseUV;float layer=0.0;float h=1.0-texture2D(reliefHeight,uv).r;
  for(int i=0;i<20;i++){if(layer>=h)break;uv-=delta;layer+=0.05;h=1.0-texture2D(reliefHeight,uv).r;}
  vec2 prev=uv+delta;float after=h-layer;float before=1.0-texture2D(reliefHeight,prev).r-layer+0.05;
  float w=clamp(after/(after-before+0.00001),0.0,1.0);return mix(uv,prev,w);
 }
 `+shader.fragmentShader;
 const decl='vec2 surfaceUV = reliefUV(vMapUv,vViewPosition,normalize(vNormal));\n';
 shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',decl+T.ShaderChunk.map_fragment.replaceAll('vMapUv','surfaceUV'));
 for(const [chunk,varying] of [['normal_fragment_maps','vNormalMapUv'],['roughnessmap_fragment','vRoughnessMapUv'],['aomap_fragment','vAoMapUv']])shader.fragmentShader=shader.fragmentShader.replace(`#include <${chunk}>`,T.ShaderChunk[chunk].replaceAll(varying,'surfaceUV'));
 if(opts.wash){shader.uniforms.washColor={value:m.userData.washColor};shader.uniforms.washAmount=washAmount;shader.fragmentShader='uniform vec3 washColor;uniform float washAmount;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n diffuseColor.rgb=mix(diffuseColor.rgb,washColor*(.9+.1*diffuseColor.r),washAmount);')}
 m.userData.shaderPatched=true;m.userData.reliefUniform=shader.uniforms.reliefScale;
 };m.customProgramCacheKey=()=>`mlow-relief-v2-${name}-${depth}-${opts.wash?'wash':''}`;return m}
 let relief=true,wash=0;function apply(){for(const m of materials){const k=washed.includes(m)?1-.85*wash:1;if(m.userData.reliefUniform)m.userData.reliefUniform.value=relief?m.userData.depthScale*k:0;m.normalScale.setScalar(.7*k)}}
 return {pbr,materials,setRelief(enabled){relief=enabled;apply()},setWash(a){if(Math.abs(a-wash)<.002)return;wash=washAmount.value=a;apply()},wood:pbr('wood',[6,5.5],.013),brick:pbr('brick',[5,1.5],.028),concrete:pbr('concrete',[5,5],.012)};
}
