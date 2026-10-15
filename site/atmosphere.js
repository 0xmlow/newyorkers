import * as T from './vendor/three.module.js';
import {EffectComposer} from './vendor/addons/postprocessing/EffectComposer.js';
import {RenderPass} from './vendor/addons/postprocessing/RenderPass.js';
import {SSAOPass} from './vendor/addons/postprocessing/SSAOPass.js';
import {OutputPass} from './vendor/addons/postprocessing/OutputPass.js';
import {UnrealBloomPass} from './vendor/addons/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from './vendor/addons/postprocessing/ShaderPass.js';
import {RoomEnvironment} from './vendor/addons/environments/RoomEnvironment.js';
export function atmosphere(renderer,scene,camera){
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 const pmrem=new T.PMREMGenerator(renderer),env=new RoomEnvironment();const envRT=pmrem.fromScene(env,.04);scene.environment=envRT.texture;scene.environmentIntensity=.26;env.dispose();pmrem.dispose();
 const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
 const mobile=matchMedia('(pointer:coarse)').matches;const ao=new SSAOPass(scene,camera,innerWidth,innerHeight,mobile?8:16);ao.kernelRadius=.38;ao.minDistance=.002;ao.maxDistance=.18;ao.enabled=!mobile;composer.addPass(ao);
 const bloom=new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.12,.45,1.8);composer.addPass(bloom);
 const grade=new ShaderPass({uniforms:{tDiffuse:{value:null},amount:{value:.1}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform sampler2D tDiffuse;uniform float amount;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);vec2 p=vUv-.5;float vig=1.-amount*dot(p,p)*2.;gl_FragColor=vec4(c.rgb*vig,c.a);}'});composer.addPass(grade);composer.addPass(new OutputPass());
 let enabled=true;return {composer,ao,render(){if(enabled)composer.render();else renderer.render(scene,camera)},resize(){composer.setSize(innerWidth,innerHeight)},quality(high){ao.enabled=high&&!mobile;renderer.setPixelRatio(high?Math.min(devicePixelRatio,1.5):1);composer.setPixelRatio(renderer.getPixelRatio())},dispose(){composer.dispose();envRT.dispose()}};
}
