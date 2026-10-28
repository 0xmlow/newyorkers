import {Reflector} from './vendor/addons/objects/Reflector.js';
import {RoundedBoxGeometry} from './vendor/addons/geometries/RoundedBoxGeometry.js';
export function addInstallations(ctx){
 const {T,rooms,scene,camera,renderer,materialLibrary,mat,metal,gold,concrete,target,modal,toast,lookAt}=ctx;
 const moving=[],mirrors=[],features=[],groups={};const boxGeo=new RoundedBoxGeometry(1,1,1,1,.035),sphereGeo=new T.SphereGeometry(1,20,12);
 for(const r of Object.values(rooms)){let g=new T.Group();g.name='architectural-installations';r.g.add(g);groups[r.id]=g}
 function mesh(r,geo,m,p,scale=[1,1,1],rot=[0,0,0]){const o=new T.Mesh(geo,m);o.position.set(...p);o.scale.set(...scale);o.rotation.set(...rot);o.castShadow=!m.transparent;o.receiveShadow=true;groups[r.id].add(o);return o}
 const box=(r,p,s,m,rot=[0,0,0])=>mesh(r,boxGeo,m,p,s,rot);
 const rod=(r,a,b,radius,m)=>{let A=new T.Vector3(...a),B=new T.Vector3(...b),dir=B.clone().sub(A);let o=mesh(r,new T.CylinderGeometry(radius,radius,dir.length(),12),m,A.clone().add(B).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());return o};
 function plaque(r,title,subtitle,p,w=1.6,ry=0){const o=ctx.sign(r,[title,subtitle],p,w,.34,{bg:'#282d28',fg:'#e2d6b8',size:19,ry});return o}
 function feature(id,r,title,body,pos,aim,anchor){const f={id,room:r.id,title,body,pos,aim};features.push(f);if(anchor)target(r,anchor,title,()=>show(f));return f}
 function show(f){modal(f.title,`<p>${f.body}</p><button class="primary" id="align-illusion">Stand at the viewing point</button>`,'OPTICAL STUDIES / '+String(features.indexOf(f)+1).padStart(2,'0'));document.querySelector('#align-illusion').onclick=()=>{document.querySelector('#modal').close();if(f.before)f.before();lookAt(f.room,f.pos,f.aim);toast('Now move sideways. The building is lying to you.')}}
 const {loft,sales,basement,roof}=rooms;
 // 01: Three disconnected bronze beams share projected endpoints at one viewpoint.
 const eye=new T.Vector3(0,1.68,8),verts=[new T.Vector3(-1.65,1.05,-2),new T.Vector3(1.65,1.05,-2),new T.Vector3(0,3.9,-2)];
 const bronze=new T.MeshPhysicalMaterial({color:'#bc8550',metalness:.82,roughness:.26,clearcoat:.2,clearcoatRoughness:.25});const factors=[.82,1.08,1.27];
 let penrose=[];for(let i=0;i<3;i++){let fac=factors[i],a=verts[i].clone().sub(eye).multiplyScalar(fac).add(eye),b=verts[(i+1)%3].clone().sub(eye).multiplyScalar(fac).add(eye),d=b.clone().sub(a);let bar=mesh(loft,new RoundedBoxGeometry(.3*fac,d.length()+.23*fac,.3*fac,3,.035),bronze,a.clone().add(b).multiplyScalar(.5).toArray());bar.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());penrose.push(bar)}
 box(loft,[0,.12,-3.1],[5,.24,6.1],materialLibrary.pbr('concrete',[1,1],.008));loft.blocks.push([-2.65,2.65,-6.35,.1]);
 const triangleLabel=plaque(loft,'THE IMPOSSIBLE LEASE','IT ONLY MAKES SENSE FROM ONE POSITION.',[0,.55,.12],3);
 feature('penrose',loft,'The Impossible Lease','Three solid bronze beams appear to form a closed triangle. From the marked viewing point their ends line up; step sideways and the separate depths become obvious. A promise that only works from one position.',[0,1.68,8],[0,2.2,-2],triangleLabel);
 penrose.forEach(o=>target(loft,o,'The Impossible Lease',()=>show(features[0])));
 const disk=mesh(loft,new T.RingGeometry(.32,.36,64),new T.MeshBasicMaterial({color:'#c6985e'}),[0,.045,8],[1,1,1],[-Math.PI/2,0,0]);
 // 02: A real floor opening, twenty-eight luminous levels and a planar mirror at its foot.
 const wx=-5.3,wz=0;const dark=mat('#13201e',.55,.2),glow=new T.MeshBasicMaterial({color:new T.Color('#9ce5c4').multiplyScalar(2.3)});
 for(let x of [wx-1.7,wx+1.7])box(sales,[x,-5.8,wz],[.14,11.7,3.4],dark);
 for(let z of [wz-1.7,wz+1.7])box(sales,[wx,-5.8,z],[3.4,11.7,.14],dark);
 for(let j=0;j<28;j++){const y=-.25-j*.4;for(let x of [wx-1.53,wx+1.53])box(sales,[x,y,0],[.027,.025,3.05],glow);for(let z of [-1.53,1.53])box(sales,[wx,y,z],[3.05,.025,.027],glow)}
 for(let x of [wx-1.76,wx+1.76])box(sales,[x,.055,0],[.15,.11,3.65],gold);for(let z of [-1.76,1.76])box(sales,[wx,.055,z],[3.65,.11,.15],gold);
 const safetyGlass=mesh(sales,new T.PlaneGeometry(3.35,3.35),new T.MeshPhysicalMaterial({color:'#a6c6bd',transparent:true,opacity:.13,roughness:.08,metalness:.15,depthWrite:false}),[wx,.045,0],[1,1,1],[-Math.PI/2,0,0]);
 const reflector=new Reflector(new T.PlaneGeometry(3.05,3.05),{textureWidth:512,textureHeight:512,color:0x8daba3,multisample:0,clipBias:.003});reflector.position.set(wx,-11.6,0);reflector.rotation.x=-Math.PI/2;groups.sales.add(reflector);const reflectRender=reflector.onBeforeRender;reflector.onBeforeRender=function(r,s,c){if(s.overrideMaterial)return;reflectRender.call(this,r,s,c)};mirrors.push(reflector);
 const wellLabel=plaque(sales,'BOTTOMLESS VALUE','THE FLOOR IS GLASS. THE UPSIDE IS INFINITE.',[wx,.2,2.2],3.2);wellLabel.rotation.x=-.8;
 feature('well',sales,'Bottomless Value','A glass-covered shaft drops through twenty-eight luminous levels into a real-time mirror. The repeated reflections extend the depth beyond the physical model. Stand over the edge and look down.',[-4.45,1.68,2.25],[wx,-6.5,-.4],wellLabel);target(sales,safetyGlass,'Bottomless Value',()=>show(features[1]));
 // 03: Ames room. The back wall and repeated frames shrink while the painted grid claims equality.
 const ames=new T.Group();ames.position.set(5.8,0,-5);groups.basement.add(ames);const wallMat=mat('#58695e',.7),cream=mat('#d8c7a0',.7);
 function amesh(geo,m,p,rot=[0,0,0]){let o=new T.Mesh(geo,m);o.position.set(...p);o.rotation.set(...rot);o.castShadow=true;o.receiveShadow=true;ames.add(o);return o}
 // Six box frames diminish into a 3.6-meter gallery; their spacing mimics a much longer corridor.
 for(let i=0;i<9;i++){const z=-i*.42,s=Math.pow(.84,i),h=2.8*s,w=3*s,y=1.4;for(let x of [-w/2,w/2])amesh(new T.BoxGeometry(.06,h,.08),i%2?gold:cream,[x,y,z]);for(let yy of [y-h/2,y+h/2])amesh(new T.BoxGeometry(w,.06,.08),i%2?gold:cream,[0,yy,z]);}
 amesh(new T.BoxGeometry(.1,3,3.8),wallMat,[-1.55,1.4,-1.7],[0,-.31,0]);amesh(new T.BoxGeometry(.1,3,3.8),wallMat,[1.55,1.4,-1.7],[0,.31,0]);amesh(new T.BoxGeometry(3.3,.1,3.8),wallMat,[0,-.05,-1.7]);
 const farDoor=amesh(new RoundedBoxGeometry(.62,1.2,.08,2,.025),bronze,[0,1.4,-3.6]);
 const corridorLabel=plaque(basement,'THE LONG WAY HOME','3.6 METERS. AN UNREASONABLE DISTANCE.',[5.8,3.25,-4.9],3.2);
 feature('corridor',basement,'The Long Way Home','The gallery gets smaller faster than it gets farther away. Diminishing frames and compressed spacing manufacture a depth the building does not have. Move off center to see how short the corridor really is.',[5.8,1.4,4],[5.8,1.4,-8],corridorLabel);
 basement.blocks.push([3.9,7.7,-9,-4.7]);
 // 04: Physical layers of fine slats form broad moire bands as the viewpoint moves.
 const mg=new T.Group();mg.position.set(0,2.1,-.6);groups.roof.add(mg);
 const bg=new T.Mesh(new T.PlaneGeometry(4.6,3),new T.MeshBasicMaterial({color:'#e6b853'}));bg.position.z=-.26;mg.add(bg);
 const lineGeo=new T.BoxGeometry(.034,2.8,.018),lineMat=mat('#182c29',.5,.4);const gridA=new T.InstancedMesh(lineGeo,lineMat,62),gridB=new T.InstancedMesh(lineGeo,lineMat,62),dum=new T.Object3D();
 for(let i=0;i<62;i++){dum.position.set(-2.17+i*.071,0,0);dum.updateMatrix();gridA.setMatrixAt(i,dum.matrix);gridB.setMatrixAt(i,dum.matrix)}gridA.position.z=.05;gridB.position.z=.38;gridB.rotation.z=.035;mg.add(gridA,gridB);moving.push({type:'moire',o:gridB});
 for(let x of [-2.37,2.37])box(roof,[x,2.1,-.6],[.08,3.2,.6],metal);for(let y of [.5,3.7])box(roof,[0,y,-.6],[4.8,.08,.6],metal);roof.blocks.push([-2.6,2.6,-1.2,-.1]);
 const moireLabel=plaque(roof,'NEIGHBORHOOD FREQUENCY','TWO GRIDS. A THIRD THING BETWEEN THEM.',[0,.25,.1],3.6);
 feature('moire',roof,'Neighborhood Frequency','Two separated screens of fine metal slats make broad bands that do not exist on either screen. The pattern slides as you move sideways. When motion is enabled, the rear grid slowly turns.',[0,1.68,6],[0,2.1,-.6],moireLabel);target(roof,bg,'Neighborhood Frequency',()=>show(features[3]));
 // 05: A split ring traces a perfect circle only from one camera position.
 const ringEye=new T.Vector3(-7.4,1.68,6.5),ringCenter=new T.Vector3(-7.4,2.5,-3.5),ringMaterial=new T.MeshBasicMaterial({color:new T.Color('#ed6544').multiplyScalar(1.2)});
 for(let i=0;i<12;i++){const fac=.7+(i%4)*.18;let pts=[];for(let k=0;k<=10;k++){const a=(i+k/10)*Math.PI/6;let v=ringCenter.clone().add(new T.Vector3(Math.cos(a)*1.05,Math.sin(a)*1.05,0));v.sub(ringEye).multiplyScalar(fac).add(ringEye);pts.push(v)}const curve=new T.CatmullRomCurve3(pts);mesh(loft,new T.TubeGeometry(curve,14,.028*fac,8,false),ringMaterial,[0,0,0])}
 const ringLabel=plaque(loft,'A WHOLE NEIGHBORHOOD','STAND TOGETHER. SEE THE CIRCLE.',[-7.4,.5,5],2.8);
 feature('ring',loft,'A Whole Neighborhood','Twelve fragments, suspended at different depths, resolve into one unbroken circle from a single place. Move away and the unity becomes a scattering of individual pieces.',ringEye.toArray(),ringCenter.toArray(),ringLabel);
 // 06: Lenticular vanes show different messages from the two sides of the sales suite.
 const signGroup=new T.Group();signGroup.position.set(0,3.4,-7.7);groups.sales.add(signGroup);
 function textMap(word,bg,fg){const c=document.createElement('canvas');c.width=1536;c.height=256;let x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);x.fillStyle=fg;x.textAlign='center';x.textBaseline='middle';x.font='bold 150px Arial';x.fillText(word,768,130,1450);let t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t}
 const messages=[textMap('EVERYBODY WELCOME','#ded2b7','#31483a'),textMap('RESIDENTS ONLY','#2d3932','#e7c285')];
 for(let i=0;i<28;i++)for(let side=0;side<2;side++){let geo=new T.PlaneGeometry(.23,1.15),uv=geo.attributes.uv;for(let k=0;k<uv.count;k++)uv.setX(k,(i+uv.getX(k))/28);let o=new T.Mesh(geo,new T.MeshStandardMaterial({map:messages[side],roughness:.8,side:T.FrontSide}));o.position.set(-3.08+i*.23,0,side===0?.03:0);o.rotation.y=side===0?-Math.PI/4:Math.PI/4;signGroup.add(o)}
 const lenticularLabel=plaque(sales,'THE DOUBLE PROMISE','READ IT FROM BOTH SIDES.',[0,2.58,-7.4],3);
 feature('lenticular',sales,'The Double Promise','The same sign tells two different stories. Its folded faces show “Everybody welcome” from one side and “Residents only” from the other. Walk across the sales suite to watch the promise switch.',[-8.5,1.68,-2.3],[0,3.4,-7.7],lenticularLabel);
 // Place the materials in plausible light: practical downlights with visible reflectors.
 for(const r of [loft,sales,basement]){const height=r===basement?3.7:5.3;for(const x of [-7,0,7]){if(Math.abs(x)>r.w/2-1)continue;for(const z of [-5,4]){const fixture=mesh(r,new T.ConeGeometry(.24,.22,24,1,true),new T.MeshStandardMaterial({color:'#343c33',metalness:.6,roughness:.4,side:T.DoubleSide}),[x,height,z],[1,1,1],[Math.PI,0,0]);mesh(r,new T.CircleGeometry(.19,24),new T.MeshBasicMaterial({color:new T.Color('#ffd2a0').multiplyScalar(3)}),[x,height-.11,z],[1,1,1],[-Math.PI/2,0,0]);const lamp=new T.PointLight('#ffd6a5',r===basement?20:12,8,2);lamp.position.set(x,height-.2,z);groups[r.id].add(lamp)}}}
 // Contact darkening around the sculptures is real shadowing; dust remains subtle and optional.
 const dustGeo=new T.BufferGeometry(),dp=[];for(let i=0;i<150;i++)dp.push(-10+Math.random()*20,.5+Math.random()*5,-9+Math.random()*18);dustGeo.setAttribute('position',new T.Float32BufferAttribute(dp,3));const dust=new T.Points(dustGeo,new T.PointsMaterial({color:'#ffe7b9',size:.012,transparent:true,opacity:.24,depthWrite:false}));groups.loft.add(dust);
 // A quiet long exposure of daylight: local transparent sheets fade at their ends.
 const beamMaterial=new T.ShaderMaterial({uniforms:{color:{value:new T.Color('#ffe1ab')}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 color;varying vec2 vUv;void main(){float a=sin(vUv.x*3.14159)*sin(vUv.y*3.14159)*.025;gl_FragColor=vec4(color,a);}',transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});
 for(let z of [-7,-1,5]){let beam=mesh(loft,new T.PlaneGeometry(3.8,11),beamMaterial,[6,3,z],[1,1,1],[0,0,-.9]);beam.castShadow=false}
 // Shadow-catching beveled architectural details, bolster cushions and profiled column bases.
 for(let x of [-6,6])for(let z of [-6,2]){const profile=[new T.Vector2(.26,0),new T.Vector2(.27,.08),new T.Vector2(.2,.13),new T.Vector2(.18,.3),new T.Vector2(.14,.38)];mesh(loft,new T.LatheGeometry(profile,32),metal,[x,.07,z]);for(let dx of [-.2,.2])for(let dz of [-.2,.2])mesh(loft,new T.CylinderGeometry(.027,.027,.03,6),gold,[x+dx,.09,z+dz])}
 for(let i=0;i<3;i++){box(loft,[5.9+i*1.1,.99,4.9],[1.02,.26,1.12],mat('#596b54',.98)).name='couch-cushion';box(loft,[5.9+i*1.1,1.34,5.43],[1.01,.52,.17],mat('#596b54',.98),[-.12,0,0]).name='couch-cushion'}
 // Hero-specific object interaction menu also provides exact, reproducible viewing points.
 function menu(){modal('The building is lying to you.',`<p>Seven spatial experiments. Choose one to find its viewing point, then move to break the illusion.</p><div class="list">${features.map((f,i)=>`<button data-illusion="${i}"><small>0${i+1} / ${rooms[f.room].title}</small>${f.title}</button>`).join('')}</div>`,'OPTICAL STUDIES');document.querySelectorAll('[data-illusion]').forEach(b=>b.onclick=()=>show(features[+b.dataset.illusion]))}
 return {features,mirrors,penrose,menu,update(t,motion,roomId){for(const m of moving)if(m.type==='moire')m.o.rotation.z=.035+(motion?Math.sin(t*.14)*.019:0);if(motion)dust.position.y=Math.sin(t*.08)*.08;dust.visible=roomId==='loft';for(const mirror of mirrors)mirror.visible=roomId==='sales'},dispose(){for(const m of mirrors)m.dispose()}};
}
