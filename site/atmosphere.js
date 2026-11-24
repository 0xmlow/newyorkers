import * as T from './vendor/three.module.js';
import {EffectComposer} from './vendor/addons/postprocessing/EffectComposer.js';
import {RenderPass} from './vendor/addons/postprocessing/RenderPass.js';
import {SSAOPass} from './vendor/addons/postprocessing/SSAOPass.js';
import {OutputPass} from './vendor/addons/postprocessing/OutputPass.js';
import {UnrealBloomPass} from './vendor/addons/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from './vendor/addons/postprocessing/ShaderPass.js';
import {RoomEnvironment} from './vendor/addons/environments/RoomEnvironment.js';
// The display grade (THE BIG UPGRADE, 2026-11-23), after the museum's look.ts and the Gary tower's real.js: a soft S curve,
// warm highlights and cool shadows, a calm vignette and fine moving grain. Desktop only and behind ?look=0; phones and
// ?look=0 keep the original vignette. With the look on it runs after the OutputPass, on display values.
const GRADE=`uniform sampler2D tDiffuse;uniform float amount;uniform float time;uniform float look;varying vec2 vUv;
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){vec4 c=texture2D(tDiffuse,vUv);vec2 p=vUv-.5;
 if(look<.5){float vig=1.-amount*dot(p,p)*2.;gl_FragColor=vec4(c.rgb*vig,c.a);return;}
 vec3 x=c.rgb;float l=dot(x,vec3(.2126,.7152,.0722));
 vec3 s=x*x*(3.-2.*clamp(x,0.,1.));x=mix(x,s,.22);
 x+=vec3(.022,.010,-.018)*smoothstep(.45,1.,l)+vec3(-.012,.002,.020)*(1.-smoothstep(0.,.42,l));
 x=mix(vec3(l),x,1.04);
 float vig=1.-.32*smoothstep(.18,.85,length(p*vec2(1.15,1.)));x*=vig;
 x+=(h(vUv*vec2(1913.,1171.)+fract(time*7.31))-.5)*.022;
 gl_FragColor=vec4(x,c.a);}`;
export function atmosphere(renderer,scene,camera,{look=false}={}){
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=look?1.13:1.05;
 const pmrem=new T.PMREMGenerator(renderer),env=new RoomEnvironment();const envRT=pmrem.fromScene(env,.04);scene.environment=envRT.texture;scene.environmentIntensity=.26;env.dispose();pmrem.dispose();
 const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
 const mobile=matchMedia('(pointer:coarse)').matches;const ao=new SSAOPass(scene,camera,innerWidth,innerHeight,mobile?8:16);ao.kernelRadius=look?.55:.38;ao.minDistance=.002;ao.maxDistance=look?.12:.18;ao.enabled=!mobile;composer.addPass(ao);
 const bloom=new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),look?.16:.12,.45,look?1.4:1.8);composer.addPass(bloom);
 const grade=new ShaderPass({uniforms:{tDiffuse:{value:null},amount:{value:.1},time:{value:0},look:{value:look?1:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:GRADE});if(look){composer.addPass(new OutputPass());composer.addPass(grade)}else{composer.addPass(grade);composer.addPass(new OutputPass())}
 let enabled=true;return {composer,ao,grade,envRT,render(){grade.uniforms.time.value=performance.now()/1000;if(enabled)composer.render();else renderer.render(scene,camera)},resize(){composer.setSize(innerWidth,innerHeight)},quality(high){ao.enabled=high&&!mobile;renderer.setPixelRatio(high?Math.min(devicePixelRatio,1.5):1);composer.setPixelRatio(renderer.getPixelRatio())},dispose(){composer.dispose();envRT.dispose()}};
}
