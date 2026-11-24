import sys
P='site/materials.js'; s=open(P).read()
def R(a,b):
    global s
    if s.count(a)!=1: sys.exit('miss: '+a[:80])
    s=s.replace(a,b)
R(" const cache=new Map(),materials=[];", " const cache=new Map(),materials=[],washed=[],washAmount={value:0};")
R(" function pbr(name,repeat=[1,1],depth=.025){", " // opts.wash: this surface is painted over as the building gentrifies (the loft's brick and floor only).\n function pbr(name,repeat=[1,1],depth=.025,opts={}){")
R("materials.push(m);\n", "materials.push(m);if(opts.wash){m.userData.washColor=new T.Color(opts.wash);washed.push(m)}\n")
R(" m.userData.shaderPatched=true;", " if(opts.wash){shader.uniforms.washColor={value:m.userData.washColor};shader.uniforms.washAmount=washAmount;shader.fragmentShader='uniform vec3 washColor;uniform float washAmount;\\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\\n diffuseColor.rgb=mix(diffuseColor.rgb,washColor*(.9+.1*diffuseColor.r),washAmount);')}\n m.userData.shaderPatched=true;")
R("m.customProgramCacheKey=()=>`mlow-relief-v2-${name}-${depth}`;", "m.customProgramCacheKey=()=>`mlow-relief-v2-${name}-${depth}-${opts.wash?'wash':''}`;")
R(" return {pbr,materials,setRelief(enabled){for(const m of materials)if(m.userData.reliefUniform)m.userData.reliefUniform.value=enabled?m.userData.depthScale:0},",
  " let relief=true,wash=0;function apply(){for(const m of materials){const k=washed.includes(m)?1-.85*wash:1;if(m.userData.reliefUniform)m.userData.reliefUniform.value=relief?m.userData.depthScale*k:0;m.normalScale.setScalar(.7*k)}}\n return {pbr,materials,setRelief(enabled){relief=enabled;apply()},setWash(a){if(Math.abs(a-wash)<.002)return;wash=washAmount.value=a;apply()},")
open(P,'w').write(s);print('ok')
