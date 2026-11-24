import sys
P='site/app.js'; s=open(P).read()
def R(a,b,n=1):
    global s
    c=s.count(a)
    if c!=n: sys.exit(f'count {c} for: {a[:90]}')
    s=s.replace(a,b)

# spawns with a heading; the sales suite opened facing the side of the scale model
R("rooms[id]={id,g,title,sub,w,d,blocks:[],batch:new Map(),spawn:[0,1.68,d/2-2]};return rooms[id]}",
  "rooms[id]={id,g,title,sub,w,d,blocks:[],batch:new Map(),spawn:[0,1.68,d/2-2],yaw:0};return rooms[id]}")
R("shell(loft);shell(sales,", "loft.spawn=[-1.5,1.68,9.4];loft.yaw=-.12;sales.spawn=[7.4,1.68,7.6];sales.yaw=.78;basement.spawn=[1.2,1.68,7.6];basement.yaw=.16;roof.spawn=[-3.2,1.68,8.8];roof.yaw=-.1;\nshell(loft);shell(sales,")
R("if(mode==='walk'){camera.position.set(...rooms[id].spawn);yaw=0;pitch=0}", "if(mode==='walk'){camera.position.set(...rooms[id].spawn);yaw=rooms[id].yaw;pitch=0}")
R("if(m==='walk'){camera.position.set(...rooms[roomId].spawn);yaw=0;pitch=0;", "if(m==='walk'){camera.position.set(...rooms[roomId].spawn);yaw=rooms[roomId].yaw;pitch=0;")

# brick at its real size: the scan holds about eight courses, so a tile is about 0.75 m, not 4 m by 2 m.
# The loft's own brick and floor are separate materials so that only the loft is whitewashed.
R("const back=materialLibrary.pbr('brick',[r.w/4,height/3],.023),side=materialLibrary.pbr('brick',[r.d/4,height/3],.023);",
  "const wash=r.id==='loft'?{wash:'#efece4'}:{},back=materialLibrary.pbr('brick',[r.w/.78,height/.78],.03,wash),side=materialLibrary.pbr('brick',[r.d/.78,height/.78],.03,wash);for(const b of [back,side])b.color.set(r.id==='basement'?'#d99d86':'#eab29c');")
R("shell(loft);shell(sales,materialLibrary.pbr('concrete',[5,4],.005),5.5);",
  "shell(loft,materialLibrary.pbr('wood',[6,5.5],.013,{wash:'#c4c0b6'}));shell(sales,materialLibrary.pbr('concrete',[5,4],.005),5.5);")
# conduits ran 2.5 m up the back wall straight through the hang; they now drop only from the ceiling
R("cyl(r,[x,1.8,-r.d/2+.32],[.025,2.5,.025],metal)}", "cyl(r,[x,height-.55,-r.d/2+.32],[.025,1.1,.025],metal)}")

# clues and notes moved off the new hang
R("[-10.5,2.2,-10.79]);", "[-10.98,2.2,-10.79]);")
R("[-11.79,2.2,4],{ry:Math.PI/2});", "[-11.79,.86,6.3],{ry:Math.PI/2});")
R("[-11.78,1.8,-3],1.5,.8,{ry:Math.PI/2});", "[-11.78,.82,-2.1],1.1,.6,{ry:Math.PI/2,size:26});")
R("[-7,2,-8.77]);", "[-8.86,1.9,-8.77]);")
R("sign(sales,['THE RESIDENCES','AT THE FORMER MUSEUM'],[0,3.9,-8.78],9,1.3,{size:37,",
  "sign(sales,['THE RESIDENCES','AT THE FORMER MUSEUM'],[0,4.78,-8.78],7.2,1.0,{size:37,")
R("[-9.78,2,4],{ry:Math.PI/2});", "[-9.78,2,7.55],{ry:Math.PI/2});")
# basement shelves stood in front of the back wall hang
R("for(let x of [-8,8]){box(basement,[x,.6,-6],[1.5,1.2,1.2],'#786344');for(let y of [.2,.6,1])box(basement,[x,y,-5.39],[1.45,.04,.02],'#c4ad80');block(basement,x,-6,1.5,1.2)}",
  "for(let z of [-6,-3.2]){box(basement,[8.1,.6,z],[1.2,1.2,1.5],'#786344');for(let y of [.2,.6,1])box(basement,[7.49,y,z],[.02,.04,1.45],'#c4ad80');block(basement,8.1,z,1.2,1.5)}")

# THE HANG. Every work in its room, framed, lit by its own picture light, labelled; clicking opens its story and its census page.
OLD_MOUNT=s[s.index("function mount(r,a,p,w,ry=0){"):s.index("// Repeated architecture and furnishings share GPU batches.")]
NEW_MOUNT=r"""const washTex=tex(256,256,(c,W,H)=>{const g=c.createRadialGradient(W/2,0,0,W/2,0,H*.95);g.addColorStop(0,'rgba(255,226,180,.9)');g.addColorStop(.45,'rgba(255,214,160,.32)');g.addColorStop(1,'rgba(255,210,150,0)');c.fillStyle=g;c.fillRect(0,0,W,H)}),washMat=new T.MeshBasicMaterial({map:washTex,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,opacity:.55,polygonOffset:true,polygonOffsetFactor:-2}),frameMat=mat('#1b1814',.45,.1),filletMat=mat('#b39a63',.35,.75),brassMat=mat('#a88a52',.3,.8),stripMat=lightMat('#fff1d2');
const planeGeo=new T.PlaneGeometry(1,1);
function label(a,w=.92){const t=tex(512,104,(c,W,H)=>{c.fillStyle='#ece6d6';c.fillRect(0,0,W,H);c.fillStyle='#8b7f66';c.font='600 21px Arial';c.fillText(('NEW YORKERS #'+a.number+(a.place?'  ·  '+a.place:'')).toUpperCase(),22,34,W-44);c.fillStyle='#1d2621';c.font='700 34px Arial';c.fillText(a.title,22,78,W-44)});const m=new T.Mesh(planeGeo,new T.MeshBasicMaterial({map:t,toneMapped:false}));m.scale.set(w,w*104/512,1);return m}
function mount(r,a,p,w,ry=0,{lit=true,tag=true,board=null}={}){const g=new T.Group();g.position.set(...p);g.rotation.y=ry;r.g.add(g);let h=w/a.aspect;
 const frame=new T.Mesh(bgeo,frameMat);frame.scale.set(w+.15,h+.15,.075);frame.position.z=.0375;frame.castShadow=true;frame.receiveShadow=true;g.add(frame);
 const fillet=new T.Mesh(planeGeo,filletMat);fillet.scale.set(w+.035,h+.035,1);fillet.position.z=.077;g.add(fillet);
 let map=textures.load('assets/'+a.file,undefined,undefined,()=>errors.push(a.file));map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;let image=new T.Mesh(planeGeo,new T.MeshBasicMaterial({map,color:0xf4f1ea,toneMapped:false}));image.scale.set(w,h,1);image.position.z=.08;g.add(image);
 if(lit){const bar=new T.Mesh(cgeo,brassMat);bar.scale.set(.045,Math.min(1.5,w*.55),.045);bar.rotation.z=Math.PI/2;bar.position.set(0,h/2+.2,.3);g.add(bar);const strip=new T.Mesh(planeGeo,stripMat);strip.scale.set(Math.min(1.5,w*.55),.025,1);strip.rotation.x=Math.PI/2;strip.position.set(0,h/2+.176,.3);g.add(strip);for(const dx of [-.22,.22]){const arm=new T.Mesh(cgeo,brassMat);arm.scale.set(.016,.32,.016);arm.rotation.x=Math.PI/2;arm.position.set(dx,h/2+.2,.15);g.add(arm)}
  const pool=new T.Mesh(planeGeo,washMat);pool.scale.set(w*1.45,h*1.55,1);pool.position.set(0,h*.02,.006);pool.renderOrder=2;g.add(pool)}
 if(tag){const l=label(a,Math.min(.92,w*.42));l.position.set(-w/2+Math.min(.92,w*.42)/2,-h/2-.2,.01);g.add(l);target(r,l,a.title,()=>showArt(a))}
 if(board){const b=new T.Mesh(bgeo,board);b.scale.set(w+.5,h+.75,.12);b.position.set(0,-.1,-.07);b.castShadow=b.receiveShadow=true;g.add(b)}
 target(r,image,a.title,()=>showArt(a));target(r,frame,a.title,()=>showArt(a));const item={g,a,w,base:g.position.clone(),baseRy:ry,r:r.id,to:{p:g.position.clone(),ry,s:1}};artMeshes.push(item);return item}
const hang={loft:[],sales:[],basement:[],roof:[]};art.forEach(a=>(hang[a.room]||hang.loft).push(a));
// the working floor: a two tier loft hang on the back and left walls
hang.loft.forEach((a,i)=>{const k=i%10,up=i>=10,wall=k<5,c=[-8.4,-4.2,0,4.2,8.4][k%5],w=up?2.25:3.2,y=up?4.42:2.2;mount(loft,a,wall?[c,y,-10.74]:[-11.74,y,c],w,wall?0:Math.PI/2,{tag:!up})});
// the sales suite: four on the back wall, two on the side, four on gold easels with their red dots
const easelMat=mat('#b39a63',.32,.72);
hang.sales.forEach((a,i)=>{if(i<4)mount(sales,a,[[-6.5,-2.2,2.2,6.5][i],1.62,-8.75],2.4);else if(i<6)mount(sales,a,[-9.74,1.75,[-6,-3][i-4]],2.4,Math.PI/2);else{const [x,z,ry]=[[-2.7,4.6,0],[2.7,4.6,0],[7.3,-2.4,-Math.PI/2],[7.3,1.4,-Math.PI/2]][i-6];const e=new T.Group();e.position.set(x,0,z);e.rotation.y=ry;sales.g.add(e);for(const dx of [-.55,.55]){const leg=new T.Mesh(cgeo,easelMat);leg.scale.set(.035,2.3,.035);leg.position.set(dx,1.12,.02);leg.rotation.z=dx>0?-.1:.1;leg.castShadow=true;e.add(leg)}const back=new T.Mesh(cgeo,easelMat);back.scale.set(.03,2.1,.03);back.position.set(0,1,-.42);back.rotation.x=-.22;e.add(back);const ledge=new T.Mesh(bgeo,easelMat);ledge.scale.set(1.9,.05,.16);ledge.position.set(0,.98,.1);e.add(ledge);block(sales,x,z,1.6,1.2);
 const it=mount(sales,a,[0,1.52,.06],1.75,0,{lit:false,tag:false});e.add(it.g);it.base.copy(it.g.position);it.to.p.copy(it.g.position);const dot=new T.Mesh(new T.CircleGeometry(.05,24),lightMat('#c8352a'));dot.position.set(.78,1.52-.5-.12,.1);e.add(dot);const card=sign(sales,['INCLUDED WITH','PENTHOUSE '+'ABCD'[i-6]],[0,.62,.12],.62,.2,{size:56,bg:'#f2efe6',fg:'#5e573f'});sales.g.remove(card);e.add(card)}});
// the holdouts: a salon hang, floor to pipes, because this is where everything was sent
hang.basement.forEach((a,i)=>{if(i<14){const c=i%7,up=i>=7;mount(basement,a,[-9.76,up?2.92:1.64,[-7.6,-5.4,-3.2,-1,1.2,3.4,5.6][c]],1.9,Math.PI/2,{tag:!up,lit:!up})}else mount(basement,a,[[-8.2,-6,-3.8,-1.6,.6,2.8][i-14],1.5,-8.75],1.9)});
// common ground: street boards on posts along the parapets
const boardMat=wood;hang.roof.forEach((a,i)=>{if(i<2){mount(roof,a,[i?7:-7,2.45,-10.1],4.2,0,{lit:false,board:boardMat});for(const dx of [-1.6,1.6])box(roof,[(i?7:-7)+dx,1.4,-10.22],[.14,2.8,.14],metal)}else{const k=i-2,side=k<3?-1:1,z=[-5.6,.4,6.4][k%3];mount(roof,a,[side*10.75,2.55,z],3.1,side<0?Math.PI/2:-Math.PI/2,{lit:false,board:boardMat});for(const dz of [-1.2,1.2])box(roof,[side*10.85,1.5,z+dz],[.12,3,.12],metal)}});
"""
s=s.replace(OLD_MOUNT,NEW_MOUNT)

# showArt: the story, then where it lives in the census
R("function showArt(a){modal(a.title,`<img class=\"art\" src=\"assets/${esc(a.file)}\" alt=\"${esc(a.title)}\"><p>${esc(a.story)}</p>`,'NEW YORKERS // BY MLOW · #'+a.number)}",
  "function showArt(a){modal(a.title,`<img class=\"art\" src=\"assets/${esc(a.file)}\" alt=\"${esc(a.title)}\"><p>${esc(a.story)}</p><p><a class=\"primary census\" href=\"/n/${a.number}\" target=\"_top\">See No. ${a.number} in the census</a></p>`,'NEW YORKERS BY MLOW · No. '+a.number+(a.place?' · '+a.place:''))}")
open(P,'w').write(s); print('ok')
