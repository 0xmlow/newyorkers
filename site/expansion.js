import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';

export async function expandBodega(ctx){
 const {scene,baseWorld,targets,secrets,discover,showArt,showModal,toast,go,mat,texture,sign:baseSign,target:baseTarget,artworks,loader}=ctx;
 const extra=await fetch('./assets/expanded-art.json').then(r=>{if(!r.ok)throw Error('Expansion catalog missing');return r.json()});
 const artById=new Map(extra.map(a=>[String(a.number),a]));artworks.push(...extra);
 const rooms={},moving=[],pending=[],errors=[],modelStats=[],boxGeo=new THREE.BoxGeometry(1,1,1),cylGeo=new THREE.CylinderGeometry(.5,.5,1,20),ballGeo=new THREE.SphereGeometry(.5,18,12);let sequence=0;
 const getTex=(file,repeat=[1,1])=>{let t=loader.load('assets/'+file,undefined,undefined,()=>{errors.push(file);toast('An expansion texture could not load.');});t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);t.anisotropy=4;return t;};
 const tileMap=getTex('textures/bodega-ceramic-imagegen-v2.png',[2,1]);const brickMap=getTex('textures/brick-imagegen-v2.png',[2,1]);const enamelMap=getTex('textures/enamel-imagegen-v2.png');
 ctx.ceramic.map=tileMap;ctx.ceramic.bumpMap=tileMap;ctx.ceramic.bumpScale=.018;ctx.ceramic.needsUpdate=true;
 const enamel=new THREE.MeshStandardMaterial({map:enamelMap,bumpMap:enamelMap,bumpScale:.012,roughness:.48,metalness:.32});
 const brick=new THREE.MeshStandardMaterial({map:brickMap,bumpMap:brickMap,bumpScale:.035,roughness:.93});
 const ivory=new THREE.MeshStandardMaterial({map:tileMap,bumpMap:tileMap,bumpScale:.018,roughness:.45});
 const metal=mat('#9fada7',.3,.78),copper=mat('#a87542',.44,.68),paper=mat('#e0d6b6'),dark=mat('#132c2c'),soil=mat('#282720');
 const glow=c=>new THREE.MeshBasicMaterial({color:c});const warm=glow('#ffe1a3'),blue=glow('#49d6eb'),pink=glow('#e887a7');
 const gltfLoader=new GLTFLoader(),modelCache=new Map();
 function makeRoom(id,name,subtitle,center,bounds,spawn){let group=new THREE.Group();group.name=id;group.position.set(...center);group.visible=false;scene.add(group);const batches=new Map(),blocks=[];const r={id,name,subtitle,group,center,bounds,spawn,blocks,batches,objects:[]};rooms[id]=r;return r;}
 const store={id:'store',group:baseWorld,center:[0,0,0],batches:new Map(),blocks:[],objects:[]};
 function obj(r,geo,m,p,s=[1,1,1],rot=[0,0,0],batch=true){m=typeof m==='string'?mat(m):m;if(batch){let key=geo.uuid+m.uuid;if(!r.batches.has(key))r.batches.set(key,{geo,m,items:[]});r.batches.get(key).items.push({p,s,rot});return;}const o=new THREE.Mesh(geo,m);o.position.set(...p);o.scale.set(...s);o.rotation.set(...rot);r.group.add(o);return o;}
 const box=(r,p,s,m,rot=[0,0,0],batch=true)=>obj(r,boxGeo,m,p,s,rot,batch);
 const cyl=(r,p,s,m,rot=[0,0,0],batch=true)=>obj(r,cylGeo,m,p,s,rot,batch);
 const ball=(r,p,s,m,rot=[0,0,0],batch=true)=>obj(r,ballGeo,m,p,s,rot,batch);
 function panel(r,text,p,w,h,opts={}){const o=baseSign(text,p,w,h,opts);r.group.add(o);return o;}
 function hit(r,p,s,title,fn){const o=baseTarget(p,s,title,fn);o.userData.room=r.id;r.group.add(o);return o;}
 function egg(r,id,name,body,hint,p,s,extraFn){secrets.push([id,name,body,hint,r.id]);hit(r,p,s,name,()=>{extraFn?.();discover(id)});}
 function roomLight(r,color,power,p){const l=new THREE.PointLight(color,power,22,1.5);l.position.set(...p);r.group.add(l)}
 function art(r,id,p,w,rot=0){const a=artById.get(String(id));if(!a)throw Error('Unknown artwork '+id);const h=w/a.aspect,tx=getTex(a.file),o=obj(r,new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tx,toneMapped:false}),p,[1,1,1],[0,rot,0],false);box(r,[p[0]-Math.sin(rot)*.04,p[1],p[2]-Math.cos(rot)*.04],[w+.14,h+.14,.06],copper,[0,rot,0]);panel(r,a.title,[p[0],p[1]-h/2-.2,p[2]+.02],w,.24,{rotation:rot,bg:'#132927',fg:'#e6dfc3',size:14,border:false});hit(r,p,[rot?.35:w,h,rot?w:.35],a.title,()=>showArt(a));return o;}
 function gate(r,label,p,to,rotation=0){const g=new THREE.Group();g.position.set(...p);g.rotation.y=rotation;r.group.add(g);for(let x of [-.75,.75]){let q=new THREE.Mesh(boxGeo,enamel);q.position.set(x,1.3,0);q.scale.set(.1,2.6,.3);g.add(q)}let top=new THREE.Mesh(boxGeo,enamel);top.position.set(0,2.65,0);top.scale.set(1.6,.1,.3);g.add(top);let plane=new THREE.Mesh(new THREE.PlaneGeometry(1.38,2.5),new THREE.MeshBasicMaterial({color:'#10232a'}));plane.position.y=1.3;g.add(plane);panel(r,label,[p[0],p[1]+2.9,p[2]+.08],2.1,.35,{rotation,bg:'#122d29',fg:'#d8e9b2',size:20});hit(r,[p[0],p[1]+1.3,p[2]],[rotation?.4:1.5,2.6,rotation?1.5:.4],label,()=>go(to));return g;}
 function model(r,file,p,height,rotation=0,title,fn){const task=(async()=>{try{if(!modelCache.has(file))modelCache.set(file,gltfLoader.loadAsync('assets/props/'+file));const gltf=await modelCache.get(file);const o=gltf.scene.clone(true);const bounds=new THREE.Box3().setFromObject(o),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());if(!Number.isFinite(size.y)||size.y<=0)throw Error('Invalid model bounds');const scale=height/size.y;const holder=new THREE.Group();o.position.set(-center.x,-bounds.min.y,-center.z);holder.add(o);holder.scale.setScalar(scale);holder.rotation.y=rotation;holder.position.set(...p);holder.name=file;r.group.add(holder);modelStats.push({room:r.id,file,height,loaded:true});if(title)hit(r,[p[0],p[1]+height/2,p[2]],[Math.max(size.x*scale,.5),height,Math.max(size.z*scale,.5)],title,fn);return holder;}catch(e){errors.push(file);console.error('Model failed:',file,e);toast('A 3D detail could not load; the rooms remain open.');return null;}})();pending.push(task);return task;}
 function finish(r){const d=new THREE.Object3D();for(const {geo,m,items}of r.batches.values()){const o=new THREE.InstancedMesh(geo,m,items.length);items.forEach((a,i)=>{d.position.set(...a.p);d.scale.set(...a.s);d.rotation.set(...a.rot);d.updateMatrix();o.setMatrixAt(i,d.matrix)});o.computeBoundingSphere();r.group.add(o)}r.batches.clear();}
 // Re-skin the store's steel without touching its artworks or original material masters.
 baseWorld.traverse(o=>{if(o.isInstancedMesh&&o.material?.color&&['254c3d','173f31','52624d','253e35','245541','315a40'].includes(o.material.color.getHexString()))o.material=enamel;});
 // Authenticated MLow marks and a dense wall of actual collection imagery.
 for(const [file,x,w]of [['logo_white.png',-1.1,1.3],['blossom_03_white.png',1.1,.55]]){const tx=getTex('brand/'+file);const image=new Image();image.src='assets/brand/'+file;await new Promise(resolve=>{image.onload=resolve;image.onerror=resolve;if(image.complete)resolve()});const ar=(image.naturalWidth||1)/(image.naturalHeight||1);obj(store,new THREE.PlaneGeometry(w,w/ar),new THREE.MeshBasicMaterial({map:tx,transparent:true,toneMapped:false}),[x,4.97,8.47],[1,1,1],[0,0,0],false)}
 // Build 12 genuine collection-product labels: preserve art ratio and draw exact type separately.
 const products=[['1','MATRIARCH','HOUSE COFFEE'],['550','NINE LIVES','CAT TREATS'],['548','PIZZA RAT','MIDNIGHT CRACKERS'],['868','SELTZER MAN','COSMIC FIZZ'],['932','EVERYTHING','BAGEL MIX'],['779','DELI CUP','INSTANT WARMTH'],['767','RAT KING','SEWER SAUCE'],['1117','BODEGA ROSES','PETAL TEA'],['818','SPIN CYCLE','MEMORY SOAP'],['3','SUBWAY SPIRIT','NIGHT TRAIN MINTS'],['780','RAINBOW BAGEL','AFTER HOURS'],['4200','END OF TIME','EMERGENCY BISCUITS']];
 const labels=[];for(const [id,name,kind]of products){const a=artById.get(id);const im=new Image();im.src='assets/'+a.file;await new Promise(resolve=>{im.onload=resolve;im.onerror=()=>{errors.push(a.file);resolve()};if(im.complete)resolve()});const tex=texture(512,768,(c,w,h)=>{c.fillStyle='#e7ddbd';c.fillRect(0,0,w,h);c.fillStyle='#163b32';c.fillRect(0,0,w,125);c.fillStyle='#e7ddbd';c.textAlign='center';c.font='bold 37px Arial';c.fillText(name,256,55,480);c.font='16px Arial';c.fillText('NEW YORKERS // BY MLOW',256,93);let ih=480/a.aspect;if(im.naturalWidth)c.drawImage(im,16,150,480,ih);c.fillStyle='#173b31';c.font='bold 27px Arial';c.fillText(kind,256,650,480);c.font='17px monospace';c.fillText('ARCHIVE '+id+' / KEEP FOREVER',256,690);for(let k=20;k<490;k+=7)c.fillRect(k,715,2,26);});labels.push(new THREE.MeshStandardMaterial({map:tex,roughness:.55}));}
 ctx.solids.push([-5.15,-.25,6.12,6.8]);
 // Replaces anonymous pantry packaging with collection-driven products while retaining batch efficiency.
 let pi=0;baseWorld.traverse(o=>{if(o.isInstancedMesh&&o.material?.map&&o.material.map.image?.width===256){o.material=labels[pi++%labels.length]}});
 for(let row=0;row<3;row++)for(let i=0;i<12;i++){const x=-4.9+i*.36,y=.45+row*.74,z=6.45;obj(store,i%3===0?cylGeo:boxGeo,labels[i],[x,y+.22,z],[.27,.44,.23]);}for(let y of [.4,1.14,1.88])box(store,[-2.9,y,6.45],[4.5,.07,.46],enamel);panel(store,'THE NEIGHBORHOOD, BOTTLED',[-2.9,2.42,6.52],4.5,.35,{size:22,bg:'#143e31',fg:'#e1dec0'});
 products.forEach(([id,name,kind],i)=>hit(store,[-4.9+i*.36,1.4,6.45],[.32,1.6,.4],name+' · '+kind,()=>showArt(artById.get(id))));
 for(let i=0;i<6;i++){const id=[23,64,3881,3581,4200,1][i];art(store,id,[5.8,2.8,-3.8+i*1.5],1.2,-Math.PI/2)}
 model(store,'hydrant.glb',[6.6,-.1,8.8],.95);model(store,'stoop.glb',[0,-.9,10.6],.8,Math.PI);model(store,'lamppost.glb',[-7.1,-.4,9.5],5);model(store,'lantern.glb',[5.8,2.6,8.5],.7);model(store,'blossom_03.glb',[5.9,1.2,7],.65,Math.PI/2);
 gate(store,'MIDNIGHT LAUNDRY',[-5.7,0,-1.8],'laundry',Math.PI/2);gate(store,'LOST LETTER OFFICE',[5.72,0,-3.8],'mail',-Math.PI/2);gate(store,'ROOF / NEXT UNIVERSE',[5.72,0,0],'roof',-Math.PI/2);
 // CC0 food props by Kenney enrich the deli without replacing the collection's identity.
 for(const [file,p,h,rot]of [
 ['bread',[2.9,1.46,2.2],.23,0],['croissant',[3.6,1.46,2.3],.22,.4],['donut',[4.35,1.46,2.4],.18,.2],['pizza',[5,1.46,2.45],.12,0],
 ['cup-coffee',[2.65,1.46,5.4],.3,0],['bottle-ketchup',[4.95,1.46,4.75],.47,0],['honey',[-1.1,2.02,6.45],.42,0],['loaf-baguette',[-4.6,.73,6.05],.35,.4]
 ])model(store,'food-'+file+'.glb',p,h,rot);
 // Room 01: a real row of machines, folded textiles, thread, coins, wiring and windows into the void.
 const laundry=makeRoom('laundry','The Midnight Laundromat','Wash yesterday. Keep the change.',[-34,0,0],[-6.3,6.3,-5.5,5.6],[0,1.72,4.5]);
 box(laundry,[0,-.12,0],[14,.25,12],ivory);box(laundry,[0,2.5,-6],[14,5,.25],ivory);box(laundry,[-7,2.5,0],[.2,5,12],brick);box(laundry,[7,1,0],[.2,2,12],brick);for(const x of [-6.9,6.9])box(laundry,[x,4.9,0],[.2,.15,12],enamel);
 roomLight(laundry,'#b3e9e3',60,[0,4,0]);roomLight(laundry,'#f3b77e',25,[-5,3,3]);panel(laundry,['MIDNIGHT LAUNDRY','OPEN THROUGH ALL POSSIBLE TOMORROWS'],[0,4.3,-5.8],9,1,{bg:'#164641',fg:'#e7e6c6',size:35});
 const drumMat=new THREE.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 v;uniform float time;void main(){vec2 p=v-.5;float r=length(p),a=atan(p.y,p.x);float line=pow(max(0.,sin(r*120.-time*1.5+a*4.)),12.);float star=pow(max(0.,sin(a*23.+r*70.)),40.);vec3 c=vec3(.015,.035,.06)+line*vec3(.08,.42,.5)+star*.2;gl_FragColor=vec4(c,1.);}' });
 const drums=[];for(let i=0;i<6;i++){let x=-5.5+i*2.15;box(laundry,[x,1.2,-4.8],[1.95,2.35,1.4],enamel);box(laundry,[x,2.1,-4.05],[1.78,.38,.05],metal);const rim=obj(laundry,new THREE.TorusGeometry(.67,.075,10,48),metal,[x,1.16,-4.03],[1,1,1],[0,0,0],false);obj(laundry,new THREE.CircleGeometry(.59,48),drumMat,[x,1.16,-4.01],[1,1,1],[0,0,0],false);cyl(laundry,[x+.68,2.12,-3.98],[.14,.06,.14],paper,[Math.PI/2,0,0]);panel(laundry,['0'+(i+1),'∞ MIN'],[x-.35,2.12,-3.98],.62,.23,{size:25,bg:'#102626',fg:'#c1f0ae'});for(let q=0;q<12;q++){let a=q*Math.PI/6;const dot=ball(laundry,[x+Math.sin(a)*.51,1.16+Math.cos(a)*.51,-3.99],[.025,.025,.025],metal)}drums.push(rim);}
 laundry.blocks.push([-6.5,6.5,-5.8,-3.6],[-1.7,1.7,-1.1,1.1]);
 box(laundry,[0,.95,0],[3.4,.15,2],paper);for(let x of [-1.4,1.4])for(let z of [-.7,.7])box(laundry,[x,.45,z],[.08,.9,.08],metal);for(let i=0;i<12;i++)box(laundry,[-1.1+(i%3)*.8,1.08+Math.floor(i/3)*.1,-.2],[.65,.09,.7],i%2?'#9eb6aa':'#dbd0ae');
 // A sock constellation, threaded clothesline and clothespins at eye level.
 const rope=new THREE.CatmullRomCurve3([new THREE.Vector3(-6,3.7,1),new THREE.Vector3(0,3.25,1),new THREE.Vector3(6,3.7,1)]);obj(laundry,new THREE.TubeGeometry(rope,48,.015,6,false),copper,[0,0,0],[1,1,1],[0,0,0],false);for(let i=0;i<9;i++){const x=-4.5+i*1.1,y=3.3+Math.abs(x)*.06;box(laundry,[x,y-.26,1],[.22,.5,.035],i%2?'#97a995':'#d6c9a1',[0,0,(i%3-1)*.1]);box(laundry,[x+.08,y-.48,1],[.35,.14,.035],paper);box(laundry,[x,y+.04,1],[.04,.13,.07],copper)}
 for(let i=0;i<4;i++){box(laundry,[-5.7,.55,2.3+i*.6],[.8,.75,.5],enamel);for(let y=.2;y<.9;y+=.16)box(laundry,[-5.7,y,2.56+i*.6],[.7,.03,.035],paper)}
 box(laundry,[5.4,1.4,3.2],[1.4,2.8,1],enamel);for(let i=0;i<9;i++)obj(laundry,boxGeo,labels[8],[5.05+(i%3)*.34,.8+Math.floor(i/3)*.52,3.75],[.28,.4,.14]);panel(laundry,'PERSONALITY REMOVER',[5.4,2.55,3.76],1.25,.28,{size:17});
 for(const z of [-2,2]){box(laundry,[0,4.65,z],[7,.12,.3],metal);box(laundry,[0,4.55,z],[6.7,.03,.12],warm)}
 art(laundry,4849,[-6.85,2.3,-.7],3.2,Math.PI/2);art(laundry,5021,[6.85,2.7,-.5],3.2,-Math.PI/2);art(laundry,818,[0,2.5,5.86],3,Math.PI);art(laundry,2755,[-3.2,2.5,5.86],2,Math.PI);
 const laundryEggs=[
 ['washer','The load that never ends','Machine 03 is washing one ordinary Tuesday. The blue spiral is the rinse cycle. Every revolution takes it a little further from becoming history.','Inspect machine 03.',[-1.2,1.2,-3.95],[1.8,2,.2]],
 ['sock','The other sock','It was not lost. It left to become a constellation. The laundromat has agreed to keep its job open.','One sock on the line does not match.',[-1.2,3.1,1],[.6,.8,.4]],
 ['quarter','A quarter of infinity','The machine takes quarters. Four quarters make a whole. Nobody has explained how this works with forever.','A coin waits on the folding table.',[1.15,1.1,.5],[.45,.3,.45]],
 ['lint','The lint archive','The filter contains lint from every coat that ever held someone on their way home. Handle with care.','Look beneath the last dryer.',[5.25,.3,-3.9],[.8,.5,.3]],
 ['detergent','Do not wash out the person','This detergent removes embarrassment, regret and identifying features. The last ingredient has been crossed out by hand.','Read the vending machine.',[5.4,1.5,3.8],[1.3,2.4,.3]],
 ['fold','The impossible fold','This towel has been folded 103 times. There should not be enough space in this room to contain it. It looks tired.','Look at the highest folded towel.',[0,1.5,-.2],[.8,.5,.8]],
 ['laundry-key','The first coordinate','A brass token is stamped KEEP. The back says: The garden needs three words. KEEP / A / LIGHT. One of them belongs to this room.','Find the brass token beside machine 01.',[-5.45,2.4,-4.4],[.65,.4,.7]],
 ['laundry-cat','The night shift union','The laundromat cat demanded paid naps and universal access to warm laundry. The vote was unanimous.','Inspect the small cat bowl beside the baskets.',[-4.8,.22,3.5],[.7,.4,.7]]];
 for(const a of laundryEggs)egg(laundry,...a,()=>{if(a[0]==='washer')drumMat.uniforms.time.value+=8});cyl(laundry,[1.15,1.04,.5],[.15,.025,.15],copper);cyl(laundry,[-5.45,2.42,-4.4],[.18,.03,.18],copper);cyl(laundry,[-4.8,.12,3.5],[.5,.17,.5],metal);panel(laundry,'KEEP',[-5.45,2.54,-4.1],.5,.18,{size:28});
 gate(laundry,'BACK TO THE BODEGA',[3.9,0,5.8],'walk',Math.PI);
 // Room 02: a dead-letter office, with pigeon bureaucracy and a corridor that cheats perspective.
 const mail=makeRoom('mail','The Office of Lost Letters','Nothing delivered is ever really lost.',[34,0,0],[-6.4,6.4,-6.4,6.3],[0,1.72,5.3]);
 box(mail,[0,-.12,0],[14,.24,14],'#75624b');box(mail,[0,2.8,-7],[14,5.6,.25],brick);box(mail,[-7,2.8,0],[.25,5.6,14],brick);box(mail,[7,1,0],[.25,2,14],brick);roomLight(mail,'#ffd19a',65,[0,4,0]);panel(mail,['OFFICE OF LOST LETTERS','FORWARDING ADDRESS: UNKNOWN'],[0,4.6,-6.8],9,1,{bg:'#17323b',fg:'#d9c9a2',size:36});
 for(let x=-5.8;x<=5.8;x+=1.15)for(let y=.75;y<=3.5;y+=.7){box(mail,[x,y,-6.35],[1.05,.62,.8],enamel);box(mail,[x,y,-5.93],[.91,.48,.035],'#243334');for(let k=0;k<3;k++)box(mail,[x-.25+k*.24,y-.1,-5.85],[.19,.28,.06],paper,[0,0,(k-1)*.2]);}mail.blocks.push([-6.5,6.5,-6.8,-5.3],[-2.9,2.9,-.9,1.4]);
 box(mail,[0,1.05,.3],[5.8,.2,2.3],copper);for(let x of [-2.6,2.6])box(mail,[x,.5,.3],[.15,1,.15],enamel);for(let i=0;i<35;i++)box(mail,[-2.4+(i%7)*.72,1.18+Math.floor(i/7)*.018,Math.sin(i)*.6],[.55,.012,.35],paper,[0,i*.45,0]);
 box(mail,[1.8,1.32,.2],[1.1,.35,.8],enamel);for(let i=0;i<24;i++)cyl(mail,[1.38+(i%8)*.12,1.51,.38-Math.floor(i/8)*.13],[.07,.035,.07],paper);cyl(mail,[1.8,1.7,-.12],[.13,1.05,.13],metal,[0,0,Math.PI/2]);panel(mail,['DEAR ANYONE,','I AM STILL HERE.'],[1.8,1.9,-.16],.8,.55,{size:26});
 for(let i=0;i<4;i++){let z=-4+i*2.3;cyl(mail,[-.4,5.3,z],[.2,12.4,.2],copper,[0,0,Math.PI/2]);obj(mail,new THREE.TorusGeometry(.45,.1,10,24,Math.PI),copper,[5.8,4.85,z],[1,1,1],[0,0,Math.PI/2],false)}
 for(let i=0;i<6;i++){let z=-2-i*.65,scale=1-i*.085;box(mail,[-4.2,2.2,z],[2.3*scale,.06,.06],warm);for(let dx of [-1.1,1.1])box(mail,[-4.2+dx*scale,1.2,z],[.06,2.1*scale,.06],warm)}
 art(mail,3492,[-6.82,2.5,2.1],3.5,Math.PI/2);art(mail,4986,[6.82,2.5,-2],3.6,-Math.PI/2);art(mail,1367,[6.82,2.7,2.1],2.5,-Math.PI/2);art(mail,3,[-2.4,2.7,6.8],3,Math.PI);
 model(mail,'mailbox.glb',[4.9,0,4.4],1.5,Math.PI);model(mail,'lantern.glb',[-3,1.18,.3],.65);model(mail,'quiet_bench.glb',[-4.9,0,4.7],.8);
 // A pigeon fashioned from the room's postal materials, guarding a letter under its wing.
 ball(mail,[-2.4,1.6,-.3],[.48,.55,.7],'#818c8c');ball(mail,[-2.4,1.94,-.1],[.29,.3,.3],'#587478');obj(mail,new THREE.ConeGeometry(.07,.2,8),copper,[-2.4,1.93,.12],[1,1,1],[Math.PI/2,0,0],false);for(let x of [-2.47,-2.33])cyl(mail,[x,1.27,-.2],[.025,.22,.025],copper);ball(mail,[-2.29,1.98,-.02],[.04,.04,.04],warm);
 panel(mail,'A',[-2.4,1.22,.25],.4,.3,{size:70});
 const mailEggs=[
 ['letter','The letter that arrived before it was written','The envelope is addressed to the person you become when someone believes in you. The postmark is tomorrow.','Look at the envelope beside the typewriter.',[2.55,1.2,.6],[.6,.3,.6]],
 ['stamp','Insufficient postage to the afterlife','This stamp costs one sincere apology. The office has several in stock, but they cannot be used on someone else’s behalf.','A stamp is hiding among the sorting slots.',[4.55,2.15,-5.8],[.8,.55,.3]],
 ['pigeon','Postmaster pigeon','The postmaster remembers every route except the way out. Under its wing is the second word: A.','Ask the pigeon for your mail.',[-2.4,1.65,-.15],[.65,.9,.8]],
 ['mail-key','A forwarding coordinate','The blue mailbox holds a brass token stamped A. KEEP / A / LIGHT. The address is not a place. It is an instruction.','Open the blue mailbox.',[4.9,.8,4.4],[1.1,1.6,1.1]],
 ['typewriter','A reply to the void','The typewriter has only four functioning keys: H, O, M, E. Its owner has still written thousands of letters.','Try the typewriter.',[1.8,1.55,.1],[1.1,.8,.8]],
 ['tube','Pneumatic time travel','These tubes deliver messages to the moment immediately before you needed them. They have never once delivered on a Monday.','Inspect the copper delivery system.',[5.7,4.9,-1.7],[.9,1.2,.8]],
 ['mail-perspective','The long way home','The corridor is only four meters deep. Each doorway is smaller than the last. Your eyes insist that home is much further away.','Look through the diminishing doorway frames.',[-4.2,1.3,-2],[2.2,2.5,.25]],
 ['return','Return to sender: universe unavailable','This parcel was returned seventeen billion times. Nobody has crossed out the word FRAGILE.','A parcel waits under the sorting desk.',[-1.9,.35,.2],[1,.7,1]]];
 for(const a of mailEggs)egg(mail,...a);box(mail,[-1.9,.3,.2],[.9,.6,.8],paper);panel(mail,'FRAGILE',[-1.9,.35,.61],.7,.25,{size:30});panel(mail,'HOME',[1.8,1.6,.7],.8,.18,{size:35});
 gate(mail,'RETURN TO THE BODEGA',[3.4,0,6.8],'walk',Math.PI);
 // Room 03: the roof is a place to nurture a universe, not merely to watch it end.
 const roof=makeRoom('roof','The Garden of the Next Universe','Somebody has to water tomorrow.',[0,0,38],[-8.4,8.4,-7.4,7.4],[0,1.72,6]);
 box(roof,[0,-.15,0],[18,.3,16],'#5a5c55');for(let x of [-8.8,8.8])box(roof,[x,.55,0],[.4,1.1,16],brick);for(let z of [-7.8,7.8])box(roof,[0,.55,z],[18,1.1,.4],brick);
 roomLight(roof,'#b4cce8',35,[0,5,0]);roomLight(roof,'#f2c885',25,[3,2,-1]);
 for(let x of [-4.8,4.8])for(let z of [-2.6,1.4]){box(roof,[x,.45,z],[3.7,.9,2.7],copper);box(roof,[x,.93,z],[3.45,.07,2.45],soil);roof.blocks.push([x-2,x+2,z-1.5,z+1.5]);for(let i=0;i<15;i++){let px=x-1.35+(i%5)*.67,pz=z-.8+Math.floor(i/5)*.75,h=.4+(i%3)*.18;cyl(roof,[px,1+h/2,pz],[.035,h,.035],'#506f45');for(let side of [-1,1])ball(roof,[px+side*.12,1.1+h*.4,pz],[.3,.09,.2],'#7d9a54',[0,0,side*.4]);ball(roof,[px,1+h,pz],[.12,.14,.12],i%5===0?warm:mat('#a7b47b'))}}
 model(roof,'water_tower.glb',[-5.8,0,-5.7],6.1);roof.blocks.push([-7.8,-3.8,-7.4,-4.3]);model(roof,'fire_escape.glb',[8.6,-1,4.6],3.2,Math.PI/2);model(roof,'quiet_bench.glb',[4.7,0,5.2],.85);model(roof,'mlow_eye_monument.glb',[0,.2,-4.5],2.6);model(roof,'blossom_03.glb',[0,.2,-4.5],.7);model(roof,'lamppost.glb',[7.3,0,-6.4],4.5);
 for(const z of [-4,3]){let pts=[];for(let i=0;i<=40;i++){let x=-8+i*.4;pts.push(new THREE.Vector3(x,4.3-.65*(1-(x*x)/64),z))}obj(roof,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),50,.018,5,false),dark,[0,0,0],[1,1,1],[0,0,0],false);for(let x=-7.5;x<8;x+=1.25){let y=4.3-.65*(1-x*x/64);cyl(roof,[x,y-.1,z],[.045,.16,.045],copper);ball(roof,[x,y-.23,z],[.15,.2,.15],warm)}}
 // A rotating armillary inside a terrarium. Finding three tokens changes the sky.
 cyl(roof,[0,.45,-.5],[1.8,.9,1.8],enamel);const seedOrb=ball(roof,[0,1.52,-.5],[.5,.5,.5],new THREE.MeshBasicMaterial({color:'#c0c7a1'}),[0,0,0],false);const terrarium=obj(roof,new THREE.SphereGeometry(.88,32,20),new THREE.MeshPhysicalMaterial({color:'#c1dfd4',transparent:true,opacity:.16,roughness:.1,metalness:.05,depthWrite:false}),[0,1.4,-.5],[1,1,1],[0,0,0],false);
 for(let i=0;i<3;i++){let o=obj(roof,new THREE.TorusGeometry(.65+i*.06,.015,6,64),copper,[0,1.52,-.5],[1,1,1],[i*.7,.5*i,0],false);moving.push({o,type:'orbit',i})}
 let reborn=false;const bloomLight=new THREE.PointLight('#ffd49c',0,45,1.4);bloomLight.position.set(0,4,-.5);roof.group.add(bloomLight);roof.blocks.push([-.95,.95,-1.45,.45]);
 const sunset=new THREE.Mesh(new THREE.SphereGeometry(9,32,24),new THREE.MeshBasicMaterial({color:'#e4a66b',transparent:true,opacity:0,depthWrite:false}));sunset.position.set(0,13,-38);roof.group.add(sunset);
 // Impossible triangle: three unconnected bars align from a single painted footprint.
 const marker=[0,.03,4.3],eye=new THREE.Vector3(0,1.72,4.3);const points=[new THREE.Vector3(-1.6,3.8,-5.7),new THREE.Vector3(1.6,3.8,-5.7),new THREE.Vector3(0,1.1,-5.7)];
 function beam(a,b){const delta=b.clone().sub(a),o=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,delta.length(),8),warm);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());roof.group.add(o)}
 for(let i=0;i<3;i++){const factor=[.8,1.05,1.25][i];beam(points[i].clone().sub(eye).multiplyScalar(factor).add(eye),points[(i+1)%3].clone().sub(eye).multiplyScalar(factor).add(eye))}
 const triangleMark=panel(roof,['STAND HERE','MAKE IT WHOLE'],marker,1.2,.7,{size:22,bg:'#c6a85f'});triangleMark.rotation.x=-Math.PI/2;
 // Rain chain, tiny seed catalog, telescope, apiary, water gauge and the last rose.
 for(let y=.3;y<3.8;y+=.18)obj(roof,new THREE.TorusGeometry(.07,.012,5,12),copper,[7.7,y,1.5],[1,1,1],[0,y*4,0],false);
 for(let k=0;k<3;k++){box(roof,[6.4,.6+k*.38,-5.5],[1.5,.34,1.2],paper);box(roof,[6.4,.6+k*.38,-4.87],[1.3,.025,.03],dark)}roof.blocks.push([5.5,7.2,-6.3,-4.7]);
 cyl(roof,[-3.3,1.25,5.5],[.15,2.1,.15],metal,[.9,0,.4]);for(let dx of [-.5,.5])cyl(roof,[-3.3+dx,.5,5.5],[.035,1.2,.035],metal,[0,0,dx]);
 cyl(roof,[2.4,.35,5.6],[.6,.7,.6],copper);cyl(roof,[2.4,1.05,5.6],[.025,.8,.025],'#607a46');for(let i=0;i<7;i++){let a=i*Math.PI*2/7;ball(roof,[2.4+Math.cos(a)*.12,1.45,5.6+Math.sin(a)*.12],[.25,.1,.18],'#c08b85',[0,a,0])}
 art(roof,2942,[-8.5,2.2,-.5],3.5,Math.PI/2);art(roof,2142,[8.5,2.2,-.5],3.5,-Math.PI/2);art(roof,76,[-2.9,2,7.55],2.6,Math.PI);art(roof,5333,[3.2,2,7.55],2.6,Math.PI);art(roof,79,[5.7,2,-7.55],2.5);
 const roofEggs=[
 ['water','A water tower full of weather','There is no water in the tank. It contains the smell of rain on the first hot sidewalk of summer. The seedlings seem to like it.','Listen to the water tower.',[-5.8,2,-5.7],[3,4,2.5]],
 ['bees','The smallest power grid','These bees pollinate possible futures. Their honey tastes like something working out. Please do not tap the hive.','Ask the rooftop bees what they are making.',[6.4,1.1,-5.5],[1.7,1.5,1.4]],
 ['telescope','A telescope pointed inward','The telescope points at an empty patch of sky. Through it you see the kitchen where someone first made you breakfast.','Look through the telescope.',[-3.3,1.2,5.5],[1,2,1]],
 ['triangle','Three things that only meet in your eyes','The luminous triangle is broken into three pieces at different depths. From the floor marker it is whole. Move sideways and the agreement falls apart.','Stand on the golden rooftop marker.',[0,.2,4.3],[1.3,.4,.8]],
 ['roof-key','The third coordinate','Under the planter is a brass token stamped LIGHT. KEEP / A / LIGHT. Take the three words to the glass terrarium.','A brass token sits on the nearest planter.',[4.7,1,2.5],[.65,.4,.6]],
 ['rose','The last bodega rose','Nobody bought this rose, so the owner planted it. It has been waiting for a first date for fourteen billion years.','Find the single rose in the copper pot.',[2.4,1.2,5.6],[.8,1.6,.8]],
 ['chain','Rain check','The chain is dry. A handwritten note reads: Rain postponed, not cancelled.','Look at the copper rain chain.',[7.7,1.8,1.5],[.4,3.4,.4]]];
 for(const a of roofEggs)egg(roof,...a);cyl(roof,[4.7,1,2.5],[.2,.03,.2],copper);panel(roof,'LIGHT',[4.7,1.15,2.7],.7,.2,{size:30});
 secrets.push(['first-light','The first light of the next universe','You found KEEP, A, and LIGHT. The terrarium opens. Somewhere beyond the edge of the roof, a small sun remembers how to begin. The bodega has a tomorrow again.','Bring all three brass words to the rooftop terrarium.','roof']);
 hit(roof,[0,1.4,-.5],[1.8,2,1.8],'Grow the next universe',()=>{const needed=['laundry-key','mail-key','roof-key'],missing=needed.filter(x=>!ctx.found.has(x));if(missing.length){const f=document.createElement('div');f.innerHTML='<div class="label">THE TERRARIUM IS WAITING</div><h2>Keep a light.</h2><p>Find three brass tokens: one in the laundromat, one in the lost-letter office, one in this garden.</p><p>'+needed.map((id,i)=>ctx.found.has(id)?['KEEP','A','LIGHT'][i]:'???').join(' / ')+'</p>';showModal(f);return;}reborn=true;discover('first-light');seedOrb.material.color.set('#ffdf95');bloomLight.intensity=80;sunset.material.opacity=1;toast('A new sun. The coffee is still a dollar.');});
 if(ctx.found.has('first-light')){reborn=true;seedOrb.material.color.set('#ffdf95');bloomLight.intensity=80;sunset.material.opacity=1;}
 gate(roof,'TAKE THE STAIRS HOME',[0,0,7.55],'walk',Math.PI);
 // Finish each room as independent batches; only the active room is rendered or raycast.
 for(const r of [store,laundry,mail,roof])finish(r);
 function setRoom(id){baseWorld.visible=['store','archive','overview','walk'].includes(id);for(const r of Object.values(rooms))r.group.visible=r.id===id;}
 function tick(t){drumMat.uniforms.time.value=t;for(const a of moving){a.o.rotation.y=t*.17+a.i;a.o.rotation.z=t*.09+a.i*.4}if(reborn)seedOrb.scale.setScalar(1+Math.sin(t*.7)*.05);}
 return {rooms,extra,products,errors,modelStats,pending,setRoom,tick,allReady:Promise.all(pending),materials:{enamel,brick,ivory}};
}
