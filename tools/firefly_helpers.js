// Paste-free setup for the Firefly page loop (SAME DIFFERENCE). Reinstalled after every page load.
window.__deep=(root,sel,out=[])=>{root.querySelectorAll(sel).forEach(e=>out.push(e));root.querySelectorAll('*').forEach(e=>{if(e.shadowRoot)window.__deep(e.shadowRoot,sel,out)});return out};
window.__log=[];
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
window.__big=()=>__deep(document,'img').filter(i=>Math.max(i.naturalWidth,i.naturalHeight)>=1500).map(i=>i.src);
// only the remove button inside a reference thumbnail; any other "Remove" is Remove background or the edit menu
window.__clearRefs=async()=>{for(let k=0;k<10;k++){const b=__deep(document,'firefly-file-preview').map(p=>p.shadowRoot&&p.shadowRoot.querySelector('button[aria-label^="Remove"]')).filter(Boolean)[0];if(!b)break;b.click();await sleep(700);}};
window.__addRef=async(f)=>{const ins=__deep(document,'#file-input');const inp=ins[ins.length-1];const dt=new DataTransfer();dt.items.add(f);inp.files=dt.files;inp.dispatchEvent(new Event('change',{bubbles:true,composed:true}));};
window.__setPrompt=(t)=>{const pm=__deep(document,'[aria-label=Prompt]')[0];pm.focus();window.getSelection().selectAllChildren(pm);document.execCommand('insertText',false,t);return pm.innerText.length};
window.__job=async(j)=>{if(/view=edit/.test(location.search)||!__deep(document,'#file-input').length){__log.push(j.name+' STOP not on generate');window.__stop=true;return false;}
 await __clearRefs();for(const r of j.refs){if(__files[r]){await __addRef(__files[r]);await sleep(3500);}}
 const n=__setPrompt(j.prompt);await sleep(800);const seen=new Set(__big());__deep(document,'#generate-button')[0].click();
 const t0=Date.now();let src=null;while(Date.now()-t0<240000){await sleep(3000);src=__big().find(s=>!seen.has(s));if(src)break;}
 if(!src){__log.push(j.name+' TIMEOUT');return false;}
 await sleep(1500);const b=await (await fetch(src)).blob();const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='sd_'+j.name+'.png';document.body.appendChild(a);a.click();a.remove();
 __log.push(j.name+' ok '+b.size);return true;};
window.__runQ=async(q)=>{window.__busy=true;window.__stop=false;for(const j of q){if(window.__stop)break;try{await __job(j);}catch(e){__log.push(j.name+' ERR '+e);}await sleep(2000);}window.__busy=false;__log.push('QDONE');};
window.__loadShuttle=async()=>{const fs=[...document.getElementById('claude-shuttle').files];window.__files=Object.assign(window.__files||{},Object.fromEntries(fs.map(f=>[f.name,f])));return Object.keys(__files).length};
if(!document.getElementById('claude-shuttle')){const i=document.createElement('input');i.type='file';i.multiple=true;i.id='claude-shuttle';i.setAttribute('aria-label','claude shuttle file input');i.style.cssText='position:fixed;left:0;top:0;width:40px;height:20px;z-index:99999;opacity:.01';document.body.appendChild(i);}
'helpers ready';
