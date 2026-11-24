import sys
P='site/app.js'; s=open(P).read()
def R(a,b):
    global s
    if s.count(a)!=1: sys.exit(f'miss {s.count(a)}: '+a[:90])
    s=s.replace(a,b)

# partitions grow out of the floor instead of popping in; window vinyl and a cooperative banner for the ending
R("const leasingSign=sign(loft,", """const vinyl=[];for(const z of [-8.25,-2.75,2.75,8.25]){const v=sign(loft,['NOW LEASING','THE FORMER','LOFT RESIDENCES'],[11.66,3.4,z],4.6,2.6,{bg:'#f3f0e8',fg:'#7a6a43',size:44,ry:-Math.PI/2});v.material.transparent=true;v.material.opacity=0;v.visible=false;vinyl.push(v)}
const coopSign=sign(loft,['THIS BUILDING IS A COOPERATIVE','TWELVE ARTISTS. ONE LEASE. NO EXIT.'],[0,4.75,2],10,1.3,{bg:'#3e5a45',fg:'#efe6c8',size:27});coopSign.visible=false;
const leasingSign=sign(loft,""")

OLD_UW=s[s.index("function updateWorld(){"):s.index("$('#hype').onclick=")]
NEW_UW=r"""// The redevelopment is drawn, not switched: `shown` chases `pressure`, and everything below reads `shown`.
let shown=0;const smooth=(a,b,x)=>{x=T.MathUtils.clamp((x-a)/(b-a),0,1);return x*x*(3-2*x)};
const warmSun=new T.Color('#ffddaa'),coldSun=new T.Color('#e9f1ff'),tmpC=new T.Color();
function corridor(it,i,stage){const tw=stage>1?.92:1.5,gap=.1,row=i<10?0:1;return {p:new T.Vector3(-11.72,stage>1?(row?1.66:1.08):(row?2.62:1.62),-10.2+tw/2+(i%10)*(tw+gap)),ry:Math.PI/2,s:tw/it.w}}
function updateWorld(){const loftArt=artMeshes.filter(a=>a.r==='loft');loftArt.forEach((it,i)=>{if(reclaimed||pressure<34)it.to={p:it.base.clone(),ry:it.baseRy,s:1};else it.to=corridor(it,i,pressure<67?1:2)});updateUI()}
function animateWorld(dt){const target=reclaimed?0:pressure,before=shown;shown+=(target-shown)*Math.min(1,dt*1.6);if(Math.abs(target-shown)<.05)shown=target;const moving=Math.abs(shown-before)>.001;
 const wash=smooth(22,70,shown),build=smooth(30,48,shown),full=smooth(62,90,shown);materialLibrary.setWash(wash);
 luxury.visible=build>.01;luxury.scale.set(.6+.4*full,Math.max(.01,build),1);luxury.position.y=0;leasingSign.visible=build>.5;
 vinyl.forEach((v,i)=>{const o=smooth(34+i*6,50+i*6,shown);v.visible=o>.01;v.material.opacity=o*.92});coopSign.visible=reclaimed;
 sunlight.color.copy(tmpC.copy(warmSun).lerp(coldSun,wash));fill.intensity=.4+wash*.9;
 let still=!moving;for(const it of artMeshes){if(it.r!=='loft')continue;const k=Math.min(1,dt*3.2);it.g.position.lerp(it.to.p,k);it.g.rotation.y+=(it.to.ry-it.g.rotation.y)*k;const sc=it.g.scale.x+(it.to.s-it.g.scale.x)*k;it.g.scale.setScalar(sc);if(it.g.position.distanceTo(it.to.p)>.002||Math.abs(sc-it.to.s)>.001)still=false}
 if(!still)projector.dirty=true;projector.amount.value=roomId==='loft'?smooth(36,58,shown):0;return !still}
"""
s=s.replace(OLD_UW,NEW_UW)

# the partitions' collision follows what is actually drawn
R("if(roomId==='loft'&&luxury.visible&&Math.abs(x-2)<(pressure<67?3:5)+.3&&", "if(roomId==='loft'&&luxury.visible&&luxury.scale.y>.5&&Math.abs(x-2)<5*luxury.scale.x+.3&&")

# the rent, as the brochure would put it
R("$('#count').textContent=evidence.size+'/6';", "const rent=reclaimed?14:Math.round(14*Math.exp(pressure*.05));$('#rent').textContent=reclaimed?'$14 a foot, shared':'$'+rent.toLocaleString('en-US')+' a foot';$('#count').textContent=evidence.size+'/6';")
R("pressure=Math.min(100,pressure+17);", "pressure=Math.min(100,pressure+17);if(pressure>99)pressure=100;")

# 07 THE REBRAND: the developer's name painted across the loft as one anamorphic image (after Felice Varini).
# A projector camera at the viewing point renders a depth map; every loft surface the projector can see takes the paint,
# so it reads as flat letters from one spot and breaks into shards on columns, beams and floor from everywhere else.
R("const installations=addInstallations(", r"""const projector=(()=>{const cam=new T.PerspectiveCamera(44,2,.4,40);cam.position.set(-7.6,1.68,9.6);cam.lookAt(1.2,2.9,-10.7);cam.updateMatrixWorld();
 const brand=tex(2048,1024,(c,W,H)=>{c.clearRect(0,0,W,H);c.fillStyle='#c4362a';c.textAlign='center';c.textBaseline='middle';c.font='900 330px "Arial Black",Arial';c.fillText('THE FORMER',W/2,H*.43,W*.9);c.font='800 92px Arial';c.fillText('LUXURY LOFT RESIDENCES',W/2,H*.72,W*.8);c.lineWidth=26;c.strokeStyle='#c4362a';c.strokeRect(W*.04,H*.12,W*.92,H*.76)});
 const rt=new T.WebGLRenderTarget(1024,512,{depthTexture:new T.DepthTexture(1024,512)});const u={map:{value:brand},depth:{value:rt.depthTexture},vp:{value:new T.Matrix4().multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse)},amount:{value:0}};
 const patched=new Set();function patch(m){if(patched.has(m)||!(m.isMeshStandardMaterial)||m.transparent)return;patched.add(m);const prev=m.onBeforeCompile,key=m.customProgramCacheKey;
  m.onBeforeCompile=(sh,r)=>{if(prev&&prev!==T.Material.prototype.onBeforeCompile)prev.call(m,sh,r);sh.uniforms.projMap=u.map;sh.uniforms.projDepth=u.depth;sh.uniforms.projVP=u.vp;sh.uniforms.projAmount=u.amount;
   sh.vertexShader='varying vec3 vProjW;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n vec4 projW=vec4(transformed,1.);\n #ifdef USE_INSTANCING\n projW=instanceMatrix*projW;\n #endif\n vProjW=(modelMatrix*projW).xyz;');
   sh.fragmentShader='uniform sampler2D projMap;uniform sampler2D projDepth;uniform mat4 projVP;uniform float projAmount;varying vec3 vProjW;\n'+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n if(projAmount>0.){vec4 pc=projVP*vec4(vProjW,1.);if(pc.w>0.){vec3 nd=pc.xyz/pc.w;vec2 puv=nd.xy*.5+.5;if(puv.x>0.&&puv.x<1.&&puv.y>0.&&puv.y<1.&&nd.z*.5+.5<=texture2D(projDepth,puv).r+.00035){vec4 pm=texture2D(projMap,puv);diffuseColor.rgb=mix(diffuseColor.rgb,pm.rgb,pm.a*projAmount);}}}')};
  m.customProgramCacheKey=()=>(key&&key!==T.Material.prototype.customProgramCacheKey?key.call(m):m.uuid)+'-proj';m.needsUpdate=true}
 return {cam,u,amount:u.amount,dirty:true,patch,render(){if(!this.dirty||u.amount.value<=0)return;this.dirty=false;const was=renderer.shadowMap.autoUpdate;renderer.shadowMap.autoUpdate=false;renderer.setRenderTarget(rt);renderer.render(scene,cam);renderer.setRenderTarget(null);renderer.shadowMap.autoUpdate=was}}})();
const installations=addInstallations(""")
R("let effects;try{", "loft.g.traverse(o=>{if(o.isMesh&&o.material)projector.patch(o.material)});installations.features.push({id:'rebrand',room:'loft',title:'The Rebrand',body:'Once the developers arrive, their name is painted across the working floor: brick, columns, beams, floor and sculpture, in one red stroke. From the gallery entrance it reads as flat letters. One step and it shatters into the building it is painted on. Generate some buzz first; the paint arrives with the partitions.',pos:projector.cam.position.toArray(),aim:[1.2,2.9,-10.7],before(){if(!reclaimed&&pressure<51){pressure=51;updateWorld();toast('The developers have arrived. So has the paint.')}}});\nlet effects;try{")

# the tick: frame budget (the site power policy), the animated redevelopment, the projector's depth map
R("const clock=new T.Clock();let frames=0;function tick(){requestAnimationFrame(tick);const dt=Math.min(clock.getDelta(),.04);",
  "// POWER, as every gallery on the site: at most 60 fps, 30 after twenty idle seconds, about 6 behind another window (HANDOFF_POWER_2026-10-12).\nconst POWER=window.__POWER={last:0,touched:performance.now(),focused:true,busy:false};for(const ev of ['keydown','pointerdown','pointermove','wheel','touchstart'])addEventListener(ev,()=>POWER.touched=performance.now(),{passive:true});addEventListener('blur',()=>POWER.focused=false);addEventListener('focus',()=>POWER.focused=true);\nconst clock=new T.Clock();let frames=0;function tick(now=performance.now()){requestAnimationFrame(tick);const budget=!POWER.focused?166:(!POWER.busy&&!keys.size&&now-POWER.touched>20000)?33:15.5;if(now-POWER.last<budget)return;POWER.last=now;const dt=Math.min(clock.getDelta(),.04);POWER.busy=animateWorld(dt);")
R("installations.update(epoch,motion,roomId);effects.render();frames++}", "installations.update(epoch,motion,roomId);projector.render();effects.render();frames++}")
open(P,'w').write(s);print('ok')
