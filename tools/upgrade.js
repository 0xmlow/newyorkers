/* ============================== UPGRADE 2026-10-28: real GLBs + rigged cast ==============================
   Every swap keeps the code-built original as the fallback: it is hidden only after its GLB parsed, so a failed
   load leaves the garden exactly as it was. ?glb=off keeps every primitive, ?rig=off keeps the old tourists.
   Assets ride inside this file (script#jm-assets, base64 GLB): Poly Haven CC0 (quiver_tree_02, namaqualand_boulder_02,
   brass_diya_lantern, painted_wooden_bench), the museum palm kit (tree_palm.glb, CC0 bark + leaves), and six rigged
   NEW YORKERS cast figures from UPGRADE ALL ROOMS 2026-10-28/rig/out (annieh, gown, workgirl, oscar, loretta, cabbie). */
const UP=(function(){
  const qs=location.search;
  return { glb:!/[?&]glb=off/.test(qs), rig:!/[?&]rig=off/.test(qs),
    phone:isTouch||Math.min(innerWidth,innerHeight)<600, ready:{}, stats:{mixerMs:0,skinned:0} };
})();
window.UP=UP;
(function(){
  let A={};
  try{ A=JSON.parse(document.getElementById('jm-assets').textContent); }catch(e){ console.warn('[majorelle] no asset block'); }
  const loader=(THREE.GLTFLoader)?new THREE.GLTFLoader():null;
  function glb(key){
    if(!loader||!A[key]) return Promise.resolve(null);
    return fetch('data:model/gltf-binary;base64,'+A[key]).then(function(r){return r.arrayBuffer();})
      .then(function(buf){ return new Promise(function(res){ loader.parse(buf,'',res,function(e){ console.warn('[majorelle] '+key,e); res(null); }); }); })
      .catch(function(e){ console.warn('[majorelle] '+key,e); return null; });
  }
  // the garden is lit with Lambert and a linear output: give every GLB the same so it sits in the scene's light
  function lambert(src,opt){
    opt=opt||{};
    if(src.map){ src.map.encoding=THREE.LinearEncoding; src.map.needsUpdate=true; }
    const m=new THREE.MeshLambertMaterial({ map:src.map||null, color:src.color?src.color.clone():0xffffff,
      side:opt.side||THREE.FrontSide, skinning:!!opt.skinning });
    if(opt.alphaTest){ m.alphaTest=opt.alphaTest; m.transparent=false; }
    if(opt.tint) m.color.multiply(new THREE.Color(opt.tint));
    return m;
  }
  function meshes(root){ const out=[]; root.updateMatrixWorld(true); root.traverse(function(c){ if(c.isMesh) out.push(c); }); return out; }
  const m4=new THREE.Matrix4(), q=new THREE.Quaternion(), v3=new THREE.Vector3(), s3=new THREE.Vector3(), Y=new THREE.Vector3(0,1,0);
  function instanced(mesh,mat,list,shadow){
    const im=new THREE.InstancedMesh(mesh.geometry,mat,list.length);
    list.forEach(function(M,i){ im.setMatrixAt(i,M); });
    im.instanceMatrix.needsUpdate=true; im.castShadow=shadow!==false; im.receiveShadow=true;
    im.frustumCulled=false;   // instances spread over the whole garden; the base geometry's sphere does not bound them
    scene.add(im); return im;
  }
  function yawMatrix(x,y,z,ry,sx,sy,sz){ q.setFromAxisAngle(Y,ry); return new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),q,new THREE.Vector3(sx,sy==null?sx:sy,sz==null?sx:sz)); }
  // small seeded generator so the upgrade never consumes Math.random (layouts stay as they were)
  let seed=20261028; function R(a,b){ seed=(seed*16807)%2147483647; return a+(seed/2147483647)*(b-a); }

  if(!UP.glb){ UP.ready.glb='off'; }
  else {
  /* ---- 1. palms: the museum palm kit (two variants, alpha tested fronds) replaces 46 lathed trunks + shape fronds ---- */
  glb('palm').then(function(g){
    if(!g||!window.__palms||!__palms.length) return;
    const by={}; meshes(g.scene).forEach(function(m){ by[m.name]=m; });
    const want=['v0_hi_bark','v0_hi_leaf','v1_hi_bark','v1_hi_leaf'];
    if(want.some(function(n){return !by[n];})) { console.warn('[majorelle] palm meshes missing'); return; }
    const lists=[[],[]];
    __palms.forEach(function(p,i){
      const s=p.h/9.9;                                   // trunk top of the kit palm is 9.9 m: crowns land where the monkeys climb
      lists[i%2].push(yawMatrix(p.g.position.x,0,p.g.position.z,p.g.rotation.y,s));
    });
    [0,1].forEach(function(vi){
      const bark=by['v'+vi+'_hi_bark'], leaf=by['v'+vi+'_hi_leaf'];
      instanced(bark,lambert(bark.material),lists[vi]);
      const lm=lambert(leaf.material,{alphaTest:0.45,side:THREE.DoubleSide});
      const li=instanced(leaf,lm,lists[vi]);
      li.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:lm.map,alphaTest:0.45});
    });
    __palms.forEach(function(p){ p.g.visible=false; });
    UP.ready.palm=__palms.length;
  });

  /* ---- 2. aloes: Poly Haven quiver_tree_02 replaces the cylinder euphorbia and the plane leaves in the glazed pots ---- */
  glb('quiver').then(function(g){
    if(!g) return;
    const ms=meshes(g.scene); if(!ms.length) return;
    const list=[];
    (window.__euph||[]).forEach(function(e){
      list.push(yawMatrix(e.position.x,0,e.position.z,e.rotation.y,R(2.6,3.4)));
      e.visible=false;
    });
    (window.__pots||[]).forEach(function(p){
      const s=p.s, top=0.6*s;                            // sits in the soil just under the lip (lip top at 0.7 s)
      list.push(yawMatrix(p.g.position.x,top,p.g.position.z,R(0,6.28),0.62*s));
      p.g.children.forEach(function(c,i){ if(i>=2) c.visible=false; });   // keep the pot and its lip, drop the paper leaves
    });
    ms.forEach(function(m){ const am=lambert(m.material); am.color.multiplyScalar(1.45); instanced(m,am,list); });
    UP.ready.aloe=list.length;
  });

  /* ---- 3. rocks: Poly Haven namaqualand_boulder_02 (160 tris) replaces 240 dodecahedrons, same spots ---- */
  glb('boulder').then(function(g){
    if(!g||!window.__rocks) return;
    const m=meshes(g.scene)[0]; if(!m) return;
    const geo=m.geometry.clone(); geo.computeBoundingBox();
    const bb=geo.boundingBox, k=1/Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z);
    geo.translate(-(bb.min.x+bb.max.x)/2,-bb.min.y,-(bb.min.z+bb.max.z)/2); geo.scale(k,k,k);
    const old=__rocks, n=old.count, list=[];
    for(let i=0;i<n;i++){
      old.getMatrixAt(i,m4); m4.decompose(v3,q,s3);
      const s=s3.x*1.5;
      list.push(yawMatrix(v3.x,-0.04*s,v3.z,R(0,6.28),s,s*R(1.4,2.0),s));
    }
    const rk=lambert(m.material,{tint:0xffcfae}); rk.color.multiplyScalar(1.5);
    instanced({geometry:geo},rk,list);   // warm the karoo stone toward Marrakech ochre
    old.visible=false; UP.ready.rocks=n;
  });

  /* ---- 4. lamps: Poly Haven brass_diya_lantern (pierced brass, glass, flame) on the existing poles ---- */
  glb('lantern').then(function(g){
    if(!g||!window.__lamps) return;
    const ms=meshes(g.scene); if(!ms.length) return;
    const list=__lamps.map(function(l){ return yawMatrix(l.position.x,2.42,l.position.z,R(0,6.28),1.9); });
    const glow=[];
    ms.forEach(function(m){
      const nm=(m.material&&m.material.name)||'';
      let mat;
      if(/glass|flame/.test(nm)){
        mat=new THREE.MeshLambertMaterial({color:/flame/.test(nm)?0xffd08a:0xf6d9a0,transparent:true,opacity:/flame/.test(nm)?0.95:0.55,depthWrite:false});
        glow.push(mat);
      } else mat=lambert(m.material);
      instanced(m,mat,list,!/glass|flame/.test(nm));
    });
    __lamps.forEach(function(l){ for(let i=1;i<l.children.length;i++) l.children[i].visible=false; });
    UP.lanternGlow=glow; UP.ready.lamps=__lamps.length;
  });

  /* ---- 5. benches: Poly Haven painted_wooden_bench, new seats along the bamboo alley, pergola and terrace ---- */
  glb('bench').then(function(g){
    if(!g) return;
    const ms=meshes(g.scene); if(!ms.length) return;
    // [x, z, yaw]: the bench's front is +Z
    const spots=[[2.25,30,-Math.PI/2],[-2.25,40,Math.PI/2],[2.25,47,-Math.PI/2],
      [-30,18.05,Math.PI],[-14,18.05,Math.PI],[-24,13.95,0],[13,-9.2,0],[27,-9.2,0],[46,-3.1,Math.PI]];
    const list=spots.map(function(b){ addBoxCollider(b[0],b[1],Math.abs(Math.sin(b[2]))>0.5?0.6:1.25,Math.abs(Math.sin(b[2]))>0.5?1.25:0.6);
      return yawMatrix(b[0],0,b[1],b[2],1.1); });
    ms.forEach(function(m){ instanced(m,lambert(m.material),list); });
    UP.ready.bench=spots.length;
  });
  }

  /* ---- 6. tourists: whole full length rigged cast replaces the capsule tourists ---- */
  const CAST=['annieh','gown','workgirl','oscar','loretta','cabbie','annieh','gown','workgirl'];
  const WALK={annieh:0.457,gown:0.55,workgirl:0.778,oscar:0.869,loretta:0.457,cabbie:0.711};   // rig_manifest.json walk_speed, m/s at scale 1
  const S=0.93;                                         // 1.88 m to the flower top, a 1.75 m visitor
  const LOOK_R=7, CLAMP=1.05;
  const hq=new THREE.Quaternion(), qy=new THREE.Quaternion(), hax=new THREE.Vector3(), inv=new THREE.Matrix4(), lc=new THREE.Vector3();
  if(!UP.rig||!THREE.SkeletonUtils){ UP.ready.rig='off'; }
  else {
    const names=[...new Set(CAST)];
    Promise.all(names.map(function(n){ return glb('rig_'+n); })).then(function(gs){
      const G={}; names.forEach(function(n,i){ G[n]=gs[i]; });
      if(names.some(function(n){ const g=G[n]; return !g||!g.animations||!g.animations.length; })){ console.warn('[majorelle] rig load failed, tourists kept'); return; }
      const cap=UP.phone?8:20;
      npcs.forEach(function(n,i){
        if(i>=cap) return;
        const name=CAST[i%CAST.length], g=G[name];
        const fig=THREE.SkeletonUtils.clone(g.scene);
        fig.scale.setScalar(S);
        let head=null;
        fig.traverse(function(c){
          if(c.isMesh){ c.castShadow=true; c.receiveShadow=false; c.frustumCulled=false;
            c.material=lambert(c.material,{skinning:!!c.isSkinnedMesh}); }
          if(c.isBone&&c.name==='head') head=c;
        });
        const mixer=new THREE.AnimationMixer(fig);
        const clip=function(k){ return THREE.AnimationClip.findByName(g.animations,k); };
        const walk=mixer.clipAction(clip('walk')), idle=mixer.clipAction(clip('idle'));
        const k=R(1.0,1.3);                              // stride rate; path speed follows it, so the planted foot stays planted
        walk.timeScale=k; walk.play(); idle.play(); idle.weight=0;
        walk.time=R(0,clip('walk').duration); idle.time=R(0,clip('idle').duration);
        mixer.update(0);
        n.g.children.forEach(function(c){ if(c!==n.phone&&c!==n.flash) c.visible=false; });
        n.phone.scale.setScalar(0.001); n.flash.position.set(-0.18,1.22,0.42);   // the flash carries the photo; a floating phone box hid the eye
        n.g.add(fig);
        n.rig={fig:fig,mixer:mixer,walk:walk,idle:idle,head:head,rest:head?head.quaternion.clone():null,yaw:0,w:1,name:name};
        n.rspeed=WALK[name]*S*k;
        UP.stats.skinned++;
      });
      npcs.forEach(function(n,i){ if(i>=cap){ n.g.visible=false; n.hidden=true; } });   // phone: 8 rigged tourists, no capsule left among them
      UP.ready.rig=UP.stats.skinned;
    });
  }
  window.rigNpcStep=function(n,dt,time){
    const p=n.g.position, r=n.rig;
    if(n.state==='walk'){
      const w=n.loop[n.wi];
      const dx=w[0]-p.x,dz=w[1]-p.z,d=Math.hypot(dx,dz);
      if(d<0.5){ n.wi=(n.wi+1)%n.loop.length; }
      else{
        p.x+=dx/d*n.rspeed*dt; p.z+=dz/d*n.rspeed*dt;
        let want=Math.atan2(dx,dz), cur=n.g.rotation.y, dd=want-cur;
        dd=Math.atan2(Math.sin(dd),Math.cos(dd));
        n.g.rotation.y=cur+dd*Math.min(1,dt*6);          // turn the corner, do not snap
      }
      p.y=0;
      n.photoTimer-=dt;
      if(n.photoTimer<=0){ n.state='photo'; n.t=0; n.photoDur=RND(3,4.2);
        let best=1e9,bx=0,bz=0;
        landmarks.forEach(function(lm){const dd=(lm[0]-p.x)*(lm[0]-p.x)+(lm[1]-p.z)*(lm[1]-p.z);
          if(dd<best){best=dd;bx=lm[0];bz=lm[1];}});
        n.g.rotation.y=Math.atan2(bx-p.x,bz-p.z);
      }
    } else {
      n.t+=dt;
      n.phone.visible=true;
      if(n.t>1&&n.t<1.12) n.flash.material.opacity=0.95;
      else if(n.t>2.2&&n.t<2.3) n.flash.material.opacity=0.85;
      else n.flash.material.opacity=Math.max(0,n.flash.material.opacity-dt*6);
      if(n.t>n.photoDur){ n.state='walk'; n.phone.visible=false; n.photoTimer=RND(10,26); }
    }
    const walking=n.state==='walk';
    r.w+=((walking?1:0)-r.w)*Math.min(1,dt*5);         // crossfade walk and idle
    r.walk.weight=r.w; r.idle.weight=1-r.w;
    const t0=performance.now();
    if(r.head&&r.rest) r.head.quaternion.copy(r.rest);
    r.mixer.update(dt);
    if(r.head){
      let want=0;
      if(!walking){
        n.g.updateMatrixWorld(true);
        inv.copy(n.g.matrixWorld).invert();
        lc.copy(camera.position).applyMatrix4(inv);
        if(lc.lengthSq()<LOOK_R*LOOK_R) want=Math.max(-CLAMP,Math.min(CLAMP,Math.atan2(lc.x,lc.z)));
      }
      r.yaw+=(want-r.yaw)*Math.min(1,dt*3);
      if(Math.abs(r.yaw)>1e-3){
        n.g.updateMatrixWorld(true);
        r.head.getWorldQuaternion(hq).invert();
        hax.copy(Y).applyQuaternion(hq).normalize();
        r.head.quaternion.multiply(qy.setFromAxisAngle(hax,r.yaw));
      }
    }
    UP.stats.mixerMs+=performance.now()-t0;
  };
  window.upgradeStep=function(dt){
    if(UP.lanternGlow){ const k=Math.min(1,0.25+env.lamp*0.6);
      UP.lanternGlow.forEach(function(m){ m.emissive.setHex(0xffb45e).multiplyScalar(k); }); }
  };
})();
