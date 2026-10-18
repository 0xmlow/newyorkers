(async()=>{
const d=window.department, result=[];
for(let i=0;i<d.ROOMS.length;i++){
 const r=d.ROOMS[i];d.go(r.id);await new Promise(r=>setTimeout(r,900));
 d.advance(16);const stat={...d.renderer.info.render};
 // Drive the shared movement loop through both threshold triggers, from an unobstructed approach.
 d.go(r.id,[0,-12.2,0]);const forward=d.advance(200,'KeyW');
 d.go(r.id,[0,12.2,Math.PI]);const reverse=d.advance(200,'KeyW');
 const ok=forward.room===d.ROOMS[(i+1)%16].id&&reverse.room===d.ROOMS[(i+15)%16].id;
 result.push({room:r.id,forward:forward.room,reverse:reverse.room,ok,drawCalls:stat.calls,triangles:stat.triangles});
}
d.go('intake');d.advance(16);
return JSON.stringify({allDoorsPass:result.every(x=>x.ok),rooms:result,assetErrors:window.assetErrors,programs:d.renderer.info.programs.map(p=>({name:p.name,runnable:p.diagnostics?.runnable})),memory:d.renderer.info.memory});
})()
