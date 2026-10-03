"use strict";
/* MOSH LAB engine. WebGL ping pong chain + JS overlays + export + eggs. */

const TAU = Math.PI*2;

/* ---------- utils ---------- */
function strHash(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hexToRgb(h){const n=parseInt(h.slice(1),16);return[((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255];}
function dl(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),8000);}
const $=id=>document.getElementById(id);
function toast(msg, ms){
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>t.classList.remove('show'), ms||2600);
}

/* ---------- brand ---------- */
$('logo').src = BRAND.logo;
(function(){
  const fav = document.createElement('link');
  fav.rel = 'icon'; fav.href = BRAND.eye;
  document.head.append(fav);
})();
const blossomImgs = BRAND.blossoms.map(src=>{ const i=new Image(); i.src=src; return i; });
(function gardenPattern(){
  const i = new Image();
  i.onload = ()=>{
    const c = document.createElement('canvas');
    c.width = c.height = 130;
    const x = c.getContext('2d');
    x.drawImage(i, 15, 15, 100, 100);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = '#2962FF';
    x.fillRect(0,0,130,130);
    const url = 'url('+c.toDataURL()+')';
    document.querySelectorAll('.gardenbg').forEach(el=>el.style.backgroundImage = url);
  };
  i.src = BRAND.blossoms[2];
})();

/* ---------- gl ---------- */
const canvas = $('gl');
const gl = canvas.getContext('webgl2', {preserveDrawingBuffer:true}) || canvas.getContext('webgl', {preserveDrawingBuffer:true});
if(!gl) alert('WebGL is not available');

const VS = `attribute vec2 a_pos; varying vec2 v_uv;
void main(){ v_uv = a_pos*0.5+0.5; gl_Position = vec4(a_pos,0.0,1.0); }`;

function compile(type, src){
  const s = gl.createShader(type);
  gl.shaderSource(s, src); gl.compileShader(s);
  if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
function makeProgram(frag){
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl.VERTEX_SHADER, VS));
  gl.attachShader(p, compile(gl.FRAGMENT_SHADER, PRELUDE+frag));
  gl.linkProgram(p);
  if(!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}
const quad = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, quad);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);

const programs = {};
for(const fx of EFFECTS){
  try{ programs[fx.id] = makeProgram(fx.frag); }
  catch(e){ console.error('shader fail: '+fx.id, e.message); }
}
const copyProg = makeProgram(`void main(){ gl_FragColor = texture2D(u_tex, v_uv); }`);

/* ---------- export watermark ----------
   Every export (GIF, PNG, MP4, WebM, batch) carries the white MLOW wordmark bottom right, with a soft
   dark halo so it reads on bright art too. It is drawn only on the final pass to the canvas while an
   export runs: the live preview stays clean and feedback effects never see the mark. */
const wmProg = makeProgram(`
uniform sampler2D u_wm;
uniform vec4 u_wmRect;
float wmA(vec2 q){ return (q.x<0.0||q.x>1.0||q.y<0.0||q.y>1.0) ? 0.0 : texture2D(u_wm, q).a; }
void main(){
  vec3 c = texture2D(u_tex, v_uv).rgb;
  vec2 q = (v_uv - u_wmRect.xy) / u_wmRect.zw;
  vec2 px = 1.0 / (u_wmRect.zw * u_res);
  float halo = 0.0;
  for(int i=0;i<12;i++){
    float a = float(i)*TAU/12.0;
    halo = max(halo, wmA(q + vec2(cos(a),sin(a))*px*3.0));
    halo = max(halo, wmA(q + vec2(cos(a),sin(a))*px*6.0)*0.5);
  }
  c = mix(c, c*0.35, halo*0.55);
  c = mix(c, vec3(1.0), wmA(q)*0.92);
  gl_FragColor = vec4(c, 1.0);
}`);
let wmTex = null, wmAspect = 3;
let exporting = false;
(function loadWatermark(){
  const img = new Image();
  img.onload = ()=>{
    // trim the transparent margin so the mark sits exactly where the rect says
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    let x0=c.width, y0=c.height, x1=0, y1=0;
    for(let y=0;y<c.height;y++) for(let i=0;i<c.width;i++) if(d[(y*c.width+i)*4+3]>8){ if(i<x0)x0=i; if(i>x1)x1=i; if(y<y0)y0=y; if(y>y1)y1=y; }
    if(x1<=x0 || y1<=y0) return;
    const t = document.createElement('canvas'); t.width = x1-x0+1; t.height = y1-y0+1;
    t.getContext('2d').drawImage(c, x0, y0, t.width, t.height, 0, 0, t.width, t.height);
    wmAspect = t.width / t.height;
    wmTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, wmTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  };
  img.src = BRAND.logoHi || BRAND.logo;
})();
const uniformCache = new Map();
function uloc(prog, name){
  let m = uniformCache.get(prog);
  if(!m){ m = new Map(); uniformCache.set(prog, m); }
  if(!m.has(name)) m.set(name, gl.getUniformLocation(prog, name));
  return m.get(name);
}
function makeTex(w,h){
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  return t;
}
function makeFBO(w,h){
  const tex = makeTex(w,h);
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return {tex, fb, w, h};
}

/* ---------- state ---------- */
let srcTex = null, srcW = 4, srcH = 4;
let renderW = 4, renderH = 4;
let work = [null,null];
let prevA = null, prevB = null;
let images = [];
let curImage = -1;
let srcKind = 'image';              // image | video | cam
let vidEl = null, camStream = null;
let playing = true;
let phase = 0, lastNow = performance.now(), loopCount = 0;
let compareHeld = false;
let autoMosh = false;

const state = {
  seed: 'MLOW-'+Math.floor(Math.random()*9000+1000),
  loopSec: 2.5,
  previewMax: 1024,
  autoLoops: 2,
  garden: false,
  unlocked317: false,
  chain: EFFECTS.map(fx => ({
    id: fx.id, on: false, lock: false,
    params: Object.fromEntries(fx.params.map(p => [p.k, p.def])),
  })),
};
let lastChainSnapshot = null;

function fxDef(id){ return EFFECTS.find(e=>e.id===id); }
function seedFloat(){ return (strHash(state.seed)%10000)/100; }

/* overlay layers: one canvas+texture per overlay effect */
const ovLayers = {};
function ovLayer(id){
  let L = ovLayers[id];
  if(!L){
    const c = document.createElement('canvas');
    L = ovLayers[id] = {canvas:c, ctx:c.getContext('2d'), tex:makeTex(4,4), step:-9, sig:''};
  }
  return L;
}

/* source sampling for ascii and emoji mosaics */
const sampleCv = document.createElement('canvas');
const sampleCtx = sampleCv.getContext('2d', {willReadFrequently:true});
let sampleData = null, sampleW = 2, sampleH = 2, lastSampleAt = 0;
function refreshSample(force){
  const now = performance.now();
  if(!force && srcKind==='image') return;
  if(!force && now-lastSampleAt < 200) return;
  lastSampleAt = now;
  sampleW = 128;
  sampleH = Math.max(2, Math.round(128*srcH/Math.max(srcW,1)));
  sampleCv.width = sampleW; sampleCv.height = sampleH;
  try{
    const src = srcKind==='image' ? (images[curImage] && images[curImage].img) : vidEl;
    if(src) sampleCtx.drawImage(src, 0, 0, sampleW, sampleH);
    sampleData = sampleCtx.getImageData(0,0,sampleW,sampleH).data;
  }catch(e){ /* tainted or not ready */ }
}
function samplePx(x01, y01){
  if(!sampleData) return [128,128,128];
  const x = Math.max(0, Math.min(sampleW-1, (x01*sampleW)|0));
  const y = Math.max(0, Math.min(sampleH-1, (y01*sampleH)|0));
  const i = (y*sampleW+x)*4;
  return [sampleData[i], sampleData[i+1], sampleData[i+2]];
}

function allocTargets(w,h){
  renderW = w; renderH = h;
  canvas.width = w; canvas.height = h;
  for(const t of work) if(t){ gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fb); }
  if(prevA){ gl.deleteTexture(prevA.tex); gl.deleteFramebuffer(prevA.fb); }
  if(prevB){ gl.deleteTexture(prevB.tex); gl.deleteFramebuffer(prevB.fb); }
  work = [makeFBO(w,h), makeFBO(w,h)];
  prevA = makeFBO(w,h); prevB = makeFBO(w,h);
  for(const id in ovLayers){ ovLayers[id].step = -9; ovLayers[id].sig=''; }
}
function fitSize(maxDim){
  const s = Math.min(1, maxDim/Math.max(srcW, srcH));
  return [Math.max(4, Math.round(srcW*s)), Math.max(4, Math.round(srcH*s))];
}
function resizePreview(){ const [w,h] = fitSize(state.previewMax); allocTargets(w,h); }

function uploadSource(el){
  if(!srcTex) srcTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, srcTex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, el);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

/* ---------- render ---------- */
function drawPass(prog, srcT, target, ovTex){
  gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fb : null);
  gl.viewport(0, 0, target ? target.w : canvas.width, target ? target.h : canvas.height);
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  const loc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, srcT);
  gl.uniform1i(uloc(prog,'u_tex'), 0);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, prevA.tex);
  gl.uniform1i(uloc(prog,'u_prev'), 1);
  gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, ovTex || prevA.tex);
  gl.uniform1i(uloc(prog,'u_ov'), 2);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function updateOverlay(e, def, ph){
  const L = ovLayer(e.id);
  if(L.canvas.width !== renderW || L.canvas.height !== renderH){
    L.canvas.width = renderW; L.canvas.height = renderH;
    gl.bindTexture(gl.TEXTURE_2D, L.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, renderW, renderH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    L.step = -9;
  }
  const spd = e.params.spd || 8;
  const step = def.live ? -1 : Math.floor(ph*spd);
  const sig = JSON.stringify(e.params)+state.seed+srcKind;
  if(!def.live && step === L.step && sig === L.sig) return;
  L.step = step; L.sig = sig;
  const env = {
    rng: (salt)=>mulberry32(strHash(state.seed) ^ ((step<0?0:step)*2654435761) ^ (salt|0)),
    seed: state.seed,
    sample: samplePx,
    phase: ph,
    blossoms: blossomImgs,
  };
  OVERLAY_DRAWERS[def.ovDraw](L.ctx, renderW, renderH, step, e, env);
  gl.bindTexture(gl.TEXTURE_2D, L.tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, L.canvas);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
}

function render(ph, bypass){
  if(!srcTex) return;
  if(srcKind !== 'image' && vidEl && vidEl.readyState >= 2){
    uploadSource(vidEl);
    refreshSample(false);
  }
  let src = srcTex;
  let pp = 0;
  if(!bypass){
    for(const e of state.chain){
      if(!e.on) continue;
      const def = fxDef(e.id);
      const prog = programs[e.id];
      if(!prog) continue;
      let ovTex = null;
      if(def.ovDraw){ updateOverlay(e, def, ph); ovTex = ovLayer(e.id).tex; }
      gl.useProgram(prog);
      gl.uniform2f(uloc(prog,'u_res'), renderW, renderH);
      gl.uniform1f(uloc(prog,'u_t'), ph);
      gl.uniform1f(uloc(prog,'u_seed'), seedFloat());
      for(const p of def.params){
        const v = e.params[p.k];
        if(p.type === 'color'){ const c = hexToRgb(v); gl.uniform3f(uloc(prog,'p_'+p.k), c[0],c[1],c[2]); }
        else gl.uniform1f(uloc(prog,'p_'+p.k), +v);
      }
      const target = work[pp];
      drawPass(prog, src, target, ovTex);
      src = target.tex;
      pp = 1-pp;
    }
  }
  if(exporting && wmTex){
    const W = renderW, H = renderH, m = Math.min(W, H);
    const lw = Math.min(0.26*m, 0.2*W), lh = lw / wmAspect, mg = 0.035*m;
    gl.useProgram(wmProg);
    gl.uniform2f(uloc(wmProg,'u_res'), W, H);
    gl.uniform4f(uloc(wmProg,'u_wmRect'), 1 - (mg+lw)/W, mg/H, lw/W, lh/H);
    gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, wmTex);
    gl.uniform1i(uloc(wmProg,'u_wm'), 3);
    drawPass(wmProg, src, null);
  } else drawPass(copyProg, src, null);
  drawPass(copyProg, src, prevB);
  const t = prevA; prevA = prevB; prevB = t;
}

/* ---------- main loop ---------- */
function tick(now){
  const dt = (now - lastNow)/1000;
  lastNow = now;
  if(playing){
    const prev = phase;
    phase = (phase + dt/state.loopSec) % 1;
    if(phase < prev){
      loopCount++;
      if(autoMosh && loopCount % state.autoLoops === 0){
        state.seed = 'MLOW-'+Math.floor(Math.random()*90000+10000);
        $('seed').value = state.seed;
        mosh(false);
      }
    }
    $('scrub').value = Math.floor(phase*1000);
  }
  render(phase, compareHeld);
  requestAnimationFrame(tick);
}

/* ---------- UI ---------- */
function buildFxList(){
  const list = $('fxlist');
  list.innerHTML = '';
  for(let i=0;i<state.chain.length;i++){
    const e = state.chain[i];
    const def = fxDef(e.id);
    if(!def) continue;
    const card = document.createElement('div');
    card.className = 'fx'+(e.on?' on':'');
    const head = document.createElement('div');
    head.className = 'fx-head';
    const cb = document.createElement('input');
    cb.type='checkbox'; cb.className='toggle'; cb.checked=e.on;
    cb.onchange = ()=>{ e.on = cb.checked; buildFxList(); saveSoon(); };
    const nm = document.createElement('span');
    nm.className='name'; nm.textContent = def.name;
    nm.onclick = ()=>{ e.on = !e.on; buildFxList(); saveSoon(); };
    const lock = document.createElement('button');
    lock.className = 'mini'+(e.lock?' locked':''); lock.textContent = e.lock?'🔒':'🔓';
    lock.title = 'locked effects survive mosh';
    lock.onclick = ()=>{ e.lock = !e.lock; buildFxList(); saveSoon(); };
    const up = document.createElement('button');
    up.className='mini'; up.textContent='▲';
    up.onclick = ()=>{ if(i>0){ state.chain.splice(i,1); state.chain.splice(i-1,0,e); buildFxList(); saveSoon(); } };
    const dn = document.createElement('button');
    dn.className='mini'; dn.textContent='▼';
    dn.onclick = ()=>{ if(i<state.chain.length-1){ state.chain.splice(i,1); state.chain.splice(i+1,0,e); buildFxList(); saveSoon(); } };
    head.append(cb, nm, lock, up, dn);
    card.append(head);
    const body = document.createElement('div');
    body.className='fx-body';
    for(const p of def.params){
      const row = document.createElement('div');
      row.className='prow';
      const lab = document.createElement('label'); lab.textContent = p.label;
      row.append(lab);
      if(p.type === 'color'){
        const inp = document.createElement('input');
        inp.type='color'; inp.value = e.params[p.k];
        inp.oninput = ()=>{ e.params[p.k] = inp.value; saveSoon(); };
        row.append(inp);
      } else if(p.type === 'select'){
        const sel = document.createElement('select');
        p.options.forEach((o,idx)=>{ const op=document.createElement('option'); op.value=idx; op.textContent=o; sel.append(op); });
        sel.value = e.params[p.k];
        sel.onchange = ()=>{ e.params[p.k] = +sel.value; saveSoon(); };
        sel.style.flex='1';
        row.append(sel);
      } else {
        const inp = document.createElement('input');
        inp.type='range'; inp.min=p.min; inp.max=p.max; inp.step=p.step; inp.value=e.params[p.k];
        const val = document.createElement('span');
        val.className='val'; val.textContent = (+e.params[p.k]).toFixed(p.step>=1?0:2);
        inp.oninput = ()=>{ e.params[p.k] = +inp.value; val.textContent = (+inp.value).toFixed(p.step>=1?0:2); saveSoon(); };
        row.append(inp, val);
      }
      body.append(row);
    }
    card.append(body);
    list.append(card);
  }
}

/* ---------- mosh ---------- */
function snapshotChain(){ return JSON.parse(JSON.stringify({chain:state.chain, loopSec:state.loopSec})); }
function restoreSnapshot(s){ if(!s) return; state.chain = JSON.parse(JSON.stringify(s.chain)); state.loopSec = s.loopSec; $('loopsec').value=state.loopSec; $('loopsecv').textContent=(+state.loopSec).toFixed(1); buildFxList(); saveSoon(); }

function mosh(hyper){
  lastChainSnapshot = snapshotChain();
  const rng = mulberry32(strHash(state.seed) ^ (hyper?0xBEEF:0));
  const pool = state.chain.filter(e => !e.lock);
  for(const e of pool) e.on = false;
  const n = hyper ? 4 + Math.floor(rng()*5) : 2 + Math.floor(rng()*4);
  const shuffled = pool.slice().sort(()=>rng()-0.5);
  const picked = shuffled.slice(0, Math.min(n, shuffled.length));
  for(const e of picked){
    e.on = true;
    const def = fxDef(e.id);
    for(const p of def.params){
      if(p.type === 'color'){
        const c = ()=>Math.floor(rng()*256).toString(16).padStart(2,'0');
        e.params[p.k] = '#'+c()+c()+c();
      } else if(p.type === 'select'){
        e.params[p.k] = Math.floor(rng()*p.options.length);
      } else {
        const r = hyper ? [p.min, p.max]
          : (p.r || [p.min + 0.15*(p.max-p.min), p.min + 0.7*(p.max-p.min)]);
        let v = r[0] + rng()*(r[1]-r[0]);
        if(p.int || p.step >= 1) v = Math.round(v);
        e.params[p.k] = +(+v).toFixed(4);
      }
    }
  }
  const jit = new Map(state.chain.map(e => [e.id, (fxDef(e.id).stage || 3) + rng()*1.4]));
  state.chain.sort((a,b)=>{
    if(a.lock && b.lock) return 0;
    return jit.get(a.id) - jit.get(b.id);
  });
  buildFxList();
  saveSoon();
}

/* ---------- presets ---------- */
function applyPreset(p){
  lastChainSnapshot = snapshotChain();
  for(const e of state.chain){
    e.on = false;
    const def = fxDef(e.id);
    for(const par of def.params) e.params[par.k] = par.def;
  }
  const order = [];
  for(const [id, params] of p.chain){
    const e = state.chain.find(x=>x.id===id);
    if(!e) continue;
    e.on = true;
    Object.assign(e.params, params);
    order.push(e);
  }
  const rest = state.chain.filter(e => !order.includes(e));
  state.chain = order.concat(rest);
  if(p.loop){ state.loopSec = p.loop; $('loopsec').value=p.loop; $('loopsecv').textContent=(+p.loop).toFixed(1); }
  buildFxList();
  saveSoon();
}
function chainToPreset(name){
  return {name, loop: state.loopSec,
    chain: state.chain.filter(e=>e.on).map(e=>[e.id, {...e.params}])};
}
function buildPresetButtons(){
  const holder = $('presets');
  holder.innerHTML='';
  const all = BUILTIN_PRESETS.slice();
  if(state.unlocked317) all.push(SIGNATURE_PRESET);
  for(const p of all){
    const b = document.createElement('button');
    b.className='presetbtn'; b.textContent = p.name;
    b.onclick = ()=>{ applyPreset(p); toast(p.name); };
    holder.append(b);
  }
  const uh = $('userpresets');
  uh.innerHTML='';
  const user = JSON.parse(localStorage.getItem('moshlab_presets')||'[]');
  if(user.length){
    const head = document.createElement('div');
    head.className='colhead'; head.textContent='YOURS';
    uh.append(head);
  }
  user.forEach((p, idx)=>{
    const row = document.createElement('div');
    row.style.display='flex'; row.style.gap='4px'; row.style.marginBottom='4px';
    const b = document.createElement('button');
    b.className='presetbtn'; b.style.flex='1'; b.style.marginBottom='0'; b.textContent=p.name;
    b.onclick = ()=>applyPreset(p);
    const x = document.createElement('button');
    x.textContent='✕';
    x.onclick = ()=>{ user.splice(idx,1); localStorage.setItem('moshlab_presets', JSON.stringify(user)); buildPresetButtons(); };
    row.append(b,x);
    uh.append(row);
  });
}

/* ---------- settings persistence ---------- */
const STORE_KEY = 'moshlab_state_v2';
function serialize(){
  return {
    v:2, seed:state.seed, loopSec:state.loopSec, previewMax:state.previewMax,
    autoLoops:state.autoLoops, garden:state.garden, unlocked317:state.unlocked317,
    chain: state.chain.map(e=>({id:e.id, on:e.on, lock:e.lock, params:e.params})),
    ex: {size:$('exsize').value, fps:$('exfps').value, loops:$('exloops').value},
  };
}
function hydrate(s){
  try{
    if(!s || s.v!==2) return;
    state.seed = s.seed || state.seed;
    state.loopSec = s.loopSec || 2.5;
    state.previewMax = s.previewMax || 1024;
    state.autoLoops = s.autoLoops || 2;
    state.unlocked317 = !!s.unlocked317;
    if(Array.isArray(s.chain)){
      const rebuilt = [];
      for(const se of s.chain){
        const def = fxDef(se.id);
        if(!def) continue;
        const params = Object.fromEntries(def.params.map(p=>[p.k, se.params && se.params[p.k]!==undefined ? se.params[p.k] : p.def]));
        rebuilt.push({id:se.id, on:!!se.on, lock:!!se.lock, params});
      }
      for(const e of state.chain) if(!rebuilt.find(x=>x.id===e.id)) rebuilt.push(e);
      state.chain = rebuilt;
    }
    if(s.ex){
      $('exsize').value = s.ex.size; $('exfps').value = s.ex.fps; $('exloops').value = s.ex.loops;
      $('exfpsv').textContent = s.ex.fps; $('exloopsv').textContent = s.ex.loops;
    }
    if(s.garden) toggleGarden(true, true);
  }catch(e){ console.warn('hydrate failed', e); }
}
let saveTimer = null;
function saveSoon(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(()=>{
    try{ localStorage.setItem(STORE_KEY, JSON.stringify(serialize())); }catch(e){}
  }, 400);
}

/* ---------- garden mode (easter egg + theme) ---------- */
function toggleGarden(on, silent){
  state.garden = on===undefined ? !state.garden : on;
  document.body.classList.toggle('garden', state.garden);
  if(!silent) toast(state.garden ? '🌸 garden mode · the community mark blooms' : '🌑 back to the ink');
  saveSoon();
}

/* ---------- gif encode (median cut + floyd steinberg + lzw) ---------- */
function medianCut(samples, maxColors){
  let boxes = [samples];
  function boxRange(box){
    let mn=[255,255,255], mx=[0,0,0];
    for(const p of box){ for(let c=0;c<3;c++){ if(p[c]<mn[c])mn[c]=p[c]; if(p[c]>mx[c])mx[c]=p[c]; } }
    return {mn,mx};
  }
  while(boxes.length < maxColors){
    let bi=-1, bs=-1, bc=0;
    for(let i=0;i<boxes.length;i++){
      if(boxes[i].length<2) continue;
      const {mn,mx} = boxRange(boxes[i]);
      let ch=0, sp=mx[0]-mn[0];
      if(mx[1]-mn[1] > sp){ sp=mx[1]-mn[1]; ch=1; }
      if(mx[2]-mn[2] > sp){ sp=mx[2]-mn[2]; ch=2; }
      const score = sp * Math.sqrt(boxes[i].length);
      if(score > bs){ bs=score; bi=i; bc=ch; }
    }
    if(bi<0) break;
    const box = boxes[bi];
    box.sort((a,b)=>a[bc]-b[bc]);
    const mid = box.length>>1;
    boxes.splice(bi,1, box.slice(0,mid), box.slice(mid));
  }
  return boxes.map(box=>{
    let r=0,g=0,b=0;
    for(const p of box){ r+=p[0]; g+=p[1]; b+=p[2]; }
    const n = Math.max(1, box.length);
    return [Math.round(r/n), Math.round(g/n), Math.round(b/n)];
  });
}
function lzwEncode(minCodeSize, data, out){
  const clearCode = 1<<minCodeSize, eoi = clearCode+1;
  let nextCode = eoi+1, codeSize = minCodeSize+1;
  let cur=0, shift=0;
  const chunk = new Uint8Array(256);
  let chunkLen = 0;
  function flushByte(b){
    chunk[chunkLen++] = b;
    if(chunkLen === 255){ out.push(255); for(let i=0;i<255;i++) out.push(chunk[i]); chunkLen=0; }
  }
  function emit(code){
    cur |= code<<shift; shift += codeSize;
    while(shift >= 8){ flushByte(cur&255); cur>>=8; shift-=8; }
  }
  let table = new Map();
  emit(clearCode);
  let prefix = data[0];
  for(let i=1;i<data.length;i++){
    const k = data[i];
    const key = (prefix<<8)|k;
    const code = table.get(key);
    if(code !== undefined){ prefix = code; }
    else {
      emit(prefix);
      if(nextCode === 4096){
        emit(clearCode);
        table = new Map(); nextCode = eoi+1; codeSize = minCodeSize+1;
      } else {
        if(nextCode >= (1<<codeSize)) codeSize++;
        table.set(key, nextCode++);
      }
      prefix = k;
    }
  }
  emit(prefix); emit(eoi);
  if(shift > 0) flushByte(cur&255);
  if(chunkLen > 0){ out.push(chunkLen); for(let i=0;i<chunkLen;i++) out.push(chunk[i]); }
  out.push(0);
}
function encodeGIF(w, h, indexedFrames, palette, delayCs){
  const out = [];
  const put = (...b)=>out.push(...b);
  const put16 = v=>{ out.push(v&255, (v>>8)&255); };
  'GIF89a'.split('').forEach(c=>put(c.charCodeAt(0)));
  put16(w); put16(h);
  put(0xF7, 0, 0);
  for(let i=0;i<256;i++){
    const c = palette[i] || [0,0,0];
    put(c[0], c[1], c[2]);
  }
  put(0x21, 0xFF, 0x0B);
  'NETSCAPE2.0'.split('').forEach(c=>put(c.charCodeAt(0)));
  put(3, 1, 0, 0, 0);
  for(const idxData of indexedFrames){
    put(0x21, 0xF9, 0x04, 0x04);
    put16(delayCs); put(0, 0);
    put(0x2C); put16(0); put16(0); put16(w); put16(h); put(0);
    put(8);
    lzwEncode(8, idxData, out);
  }
  put(0x3B);
  return new Blob([new Uint8Array(out)], {type:'image/gif'});
}
function quantizeFrames(frames, w, h, onprog){
  const samples = [];
  const stride = Math.max(1, Math.floor((frames.length*w*h)/50000));
  for(let f=0; f<frames.length; f++){
    const d = frames[f];
    for(let i=f%stride; i<w*h; i+=stride) samples.push([d[i*4], d[i*4+1], d[i*4+2]]);
  }
  const palette = medianCut(samples, 255);
  while(palette.length<256) palette.push([0,0,0]);
  const cache = new Map();
  function nearest(r,g,b){
    const key = ((r>>2)<<12)|((g>>2)<<6)|(b>>2);
    let idx = cache.get(key);
    if(idx !== undefined) return idx;
    let bd = 1e9;
    for(let i=0;i<255;i++){
      const p = palette[i];
      const d = (r-p[0])*(r-p[0]) + (g-p[1])*(g-p[1])*1.5 + (b-p[2])*(b-p[2]);
      if(d < bd){ bd=d; idx=i; }
    }
    cache.set(key, idx);
    return idx;
  }
  const indexed = [];
  for(let f=0; f<frames.length; f++){
    const d = frames[f];
    const out = new Uint8Array(w*h);
    const errCur = new Float32Array((w+2)*3);
    const errNext = new Float32Array((w+2)*3);
    for(let y=0; y<h; y++){
      errNext.fill(0);
      for(let x=0; x<w; x++){
        const i = (y*w+x)*4;
        const ei = (x+1)*3;
        let r = d[i]   + errCur[ei];
        let g = d[i+1] + errCur[ei+1];
        let b = d[i+2] + errCur[ei+2];
        r = r<0?0:(r>255?255:r); g = g<0?0:(g>255?255:g); b = b<0?0:(b>255?255:b);
        const idx = nearest(r|0, g|0, b|0);
        out[y*w+x] = idx;
        const p = palette[idx];
        const er=(r-p[0])*0.9, eg=(g-p[1])*0.9, eb=(b-p[2])*0.9;
        errCur[ei+3]  += er*7/16; errCur[ei+4]  += eg*7/16; errCur[ei+5]  += eb*7/16;
        errNext[ei-3] += er*3/16; errNext[ei-2] += eg*3/16; errNext[ei-1] += eb*3/16;
        errNext[ei]   += er*5/16; errNext[ei+1] += eg*5/16; errNext[ei+2] += eb*5/16;
        errNext[ei+3] += er*1/16; errNext[ei+4] += eg*1/16; errNext[ei+5] += eb*1/16;
      }
      errCur.set(errNext);
    }
    indexed.push(out);
    if(onprog) onprog((f+1)/frames.length);
  }
  return {indexed, palette};
}

/* ---------- export ---------- */
const FUN = ['convincing pixels to riot 🧨','feeding the eye 👁️','corrupting responsibly 📼','petals in the datastream 🌸','bribing the scanlines 📉','one perfect loop 🔁'];
function setProgress(v, label){
  $('progress').style.display = v===null ? 'none' : 'block';
  if(v!==null) $('progressbar').style.width = (v*100).toFixed(0)+'%';
  $('status').textContent = label || 'ready';
}
function exportDims(){
  const maxpx = +$('exsize').value;
  if(maxpx === 0) return [srcW, srcH];
  return fitSize(maxpx);
}
function baseName(){
  const n = srcKind==='image' && images[curImage] ? images[curImage].name.replace(/\.[^.]+$/,'') : 'moshlab';
  return n + '_' + state.seed.replace(/[^A-Za-z0-9-]/g,'');
}
async function frameSleep(){ return new Promise(r=>setTimeout(r,0)); }

async function captureLoopFrames(w, h, frames){
  allocTargets(w, h);
  refreshSample(true);
  for(let k=0; k<frames*2; k++) render(k/frames % 1, false);
  const out = [];
  const buf = new Uint8Array(w*h*4);
  for(let k=0; k<frames; k++){
    render(k/frames, false);
    // read the canvas, not the feedback buffer render() bound last: only the canvas carries the watermark
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    const flip = new Uint8ClampedArray(w*h*4);
    for(let y=0; y<h; y++) flip.set(buf.subarray((h-1-y)*w*4, (h-y)*w*4), y*w*4);
    out.push(flip);
    if(k%4===0){ setProgress(k/frames*0.5, FUN[k%FUN.length]+' '+(k+1)+'/'+frames); await frameSleep(); }
  }
  return out;
}

async function doExportGIF(){
  if(!srcTex) return;
  const wasPlaying = playing; playing = false;
  exporting = true;
  const [w,h] = exportDims();
  const fps = +$('exfps').value;
  const frames = Math.max(4, Math.round(state.loopSec*fps));
  try{
    const raw = await captureLoopFrames(w, h, frames);
    setProgress(0.5, 'quantizing 🎨');
    await frameSleep();
    const {indexed, palette} = quantizeFrames(raw, w, h, p=>{ setProgress(0.5+p*0.45, 'encoding '+(p*100|0)+'%'); });
    await frameSleep();
    const blob = encodeGIF(w, h, indexed, palette, Math.round(100/fps));
    dl(blob, baseName()+'.gif');
    setProgress(null, 'gif saved 🔁 '+(blob.size/1024/1024).toFixed(1)+' MB');
  } catch(e){
    console.error(e);
    setProgress(null, 'gif export failed');
  }
  exporting = false;
  resizePreview();
  refreshSample(true);
  playing = wasPlaying;
}

async function doExportPNG(){
  if(!srcTex) return;
  const wasPlaying = playing; playing = false;
  exporting = true;
  const [w,h] = exportDims();
  allocTargets(w,h);
  refreshSample(true);
  for(let k=0;k<24;k++) render(((phase*24|0)+k)/24 % 1, false);
  render(phase, false);
  await new Promise(res=>{ canvas.toBlob(b=>{ dl(b, baseName()+'.png'); res(); }, 'image/png'); });
  exporting = false;
  setProgress(null, 'png saved 🖼️');
  resizePreview();
  refreshSample(true);
  playing = wasPlaying;
}

function pickVideoMime(kind){
  const tries = kind==='mp4'
    ? ['video/mp4;codecs=avc1.42E01E', 'video/mp4;codecs=avc1', 'video/mp4']
    : ['video/webm;codecs=vp9', 'video/webm'];
  for(const m of tries) if(window.MediaRecorder && MediaRecorder.isTypeSupported(m)) return m;
  return null;
}

async function doExportVideo(kind){
  if(!srcTex) return;
  let mime = pickVideoMime(kind);
  let ext = kind;
  if(!mime && kind==='mp4'){
    toast('mp4 recorder not supported here, saving webm instead');
    mime = pickVideoMime('webm'); ext = 'webm';
  }
  if(!mime){ toast('video recording is not supported here'); return; }
  const loops = +$('exloops').value;
  const fps = 30;
  const [w,h] = exportDims();
  allocTargets(w,h);
  refreshSample(true);
  exporting = true;
  const stream = canvas.captureStream(fps);
  const rec = new MediaRecorder(stream, {mimeType:mime, videoBitsPerSecond: 14_000_000});
  const chunks = [];
  rec.ondataavailable = e=>chunks.push(e.data);
  const done = new Promise(r=>{ rec.onstop = r; });
  const totalMs = loops*state.loopSec*1000;
  const t0 = performance.now();
  playing = false;
  rec.start();
  setProgress(0, 'recording '+ext+' 🎥');
  function step(){
    const el = performance.now()-t0;
    render((el/1000/state.loopSec)%1, false);
    setProgress(Math.min(1, el/totalMs), 'recording '+ext+' 🎥');
    if(el < totalMs) requestAnimationFrame(step);
    else rec.stop();
  }
  requestAnimationFrame(step);
  await done;
  exporting = false;
  dl(new Blob(chunks, {type: mime.split(';')[0]}), baseName()+'.'+ext);
  setProgress(null, ext+' saved 🎥');
  resizePreview();
  refreshSample(true);
  playing = true;
}

async function doBatchGIF(){
  if(images.length < 2){ setProgress(null, 'load 2 or more images first'); return; }
  if(srcKind !== 'image') switchToImage(Math.max(0, curImage));
  const keep = curImage;
  for(let i=0;i<images.length;i++){
    switchToImage(i);
    setProgress(0, 'batch '+(i+1)+'/'+images.length+' 📦');
    await doExportGIF();
  }
  switchToImage(keep);
  setProgress(null, 'batch done 📦 '+images.length+' gifs');
}

/* ---------- sources ---------- */
function stopDynamicSource(){
  if(camStream){ camStream.getTracks().forEach(t=>t.stop()); camStream=null; }
  if(vidEl){ vidEl.pause(); vidEl = null; }
  $('cambtn').classList.remove('ghost-on');
}
function switchToImage(i){
  if(i<0 || i>=images.length) return;
  stopDynamicSource();
  srcKind = 'image';
  curImage = i;
  $('filelist').value = i;
  const img = images[i].img;
  srcW = img.width; srcH = img.height;
  uploadSource(img);
  resizePreview();
  sampleData = null;
  refreshSampleImage(img);
  setProgress(null, images[i].name+' · '+srcW+'x'+srcH);
}
function refreshSampleImage(img){
  sampleW = 128;
  sampleH = Math.max(2, Math.round(128*srcH/Math.max(srcW,1)));
  sampleCv.width = sampleW; sampleCv.height = sampleH;
  try{
    sampleCtx.drawImage(img, 0, 0, sampleW, sampleH);
    sampleData = sampleCtx.getImageData(0,0,sampleW,sampleH).data;
  }catch(e){}
}
function addImages(files){
  const list = Array.from(files).filter(f=>f.type.startsWith('image/'));
  let firstNew = -1;
  let pending = list.length;
  if(!pending) return;
  for(const f of list){
    const img = new Image();
    img.onload = ()=>{
      images.push({name:f.name, img});
      if(firstNew<0) firstNew = images.length-1;
      if(--pending === 0){ rebuildFileList(); switchToImage(firstNew); }
    };
    img.src = URL.createObjectURL(f);
  }
}
function rebuildFileList(){
  const sel = $('filelist');
  sel.innerHTML='';
  images.forEach((im,i)=>{
    const o = document.createElement('option');
    o.value=i; o.textContent = im.name;
    sel.append(o);
  });
}
function loadVideoFile(f){
  stopDynamicSource();
  const v = document.createElement('video');
  v.muted = true; v.loop = true; v.playsInline = true;
  v.src = URL.createObjectURL(f);
  v.onloadeddata = ()=>{
    vidEl = v; srcKind = 'video';
    srcW = v.videoWidth; srcH = v.videoHeight;
    v.play();
    uploadSource(v);
    resizePreview();
    refreshSample(true);
    setProgress(null, f.name+' 🎬 '+srcW+'x'+srcH);
    toast('video source live 🎬 mp4/webm capture works best here');
  };
}
async function toggleCam(){
  if(srcKind==='cam'){ if(images.length) switchToImage(Math.max(0,curImage)); return; }
  try{
    const stream = await navigator.mediaDevices.getUserMedia({video:{width:1280, height:720}});
    stopDynamicSource();
    camStream = stream;
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true;
    v.srcObject = stream;
    v.onloadeddata = ()=>{
      vidEl = v; srcKind = 'cam';
      srcW = v.videoWidth; srcH = v.videoHeight;
      v.play();
      uploadSource(v);
      resizePreview();
      refreshSample(true);
      $('cambtn').classList.add('ghost-on');
      setProgress(null, 'camera live 📷 '+srcW+'x'+srcH);
      toast('you are the source now 📷');
    };
  }catch(e){
    toast('camera blocked or unavailable 📷');
  }
}

function makeTestPattern(){
  const c = document.createElement('canvas');
  c.width = 900; c.height = 1200;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0,0,900,1200);
  g.addColorStop(0,'#0D0D0D'); g.addColorStop(0.55,'#2962FF'); g.addColorStop(1,'#FF2E63');
  x.fillStyle=g; x.fillRect(0,0,900,1200);
  x.fillStyle='#0D0D0D';
  for(let i=0;i<10;i++) x.fillRect(60+i*85, 140, 40, 920);
  x.fillStyle='#F0F4F8';
  x.beginPath(); x.arc(450, 600, 230, 0, TAU); x.fill();
  x.fillStyle='#0D0D0D';
  x.beginPath(); x.arc(450, 600, 150, 0, TAU); x.fill();
  x.fillStyle='#00E5FF';
  x.beginPath(); x.arc(450, 600, 60, 0, TAU); x.fill();
  x.font='bold 110px Georgia, serif';
  x.fillStyle='#F0F4F8';
  x.fillText('MOSH', 230, 1090);
  x.font='bold 40px Consolas, Menlo, monospace';
  x.fillStyle='#F0F4F8';
  x.fillText('DROP AN IMAGE', 270, 90);
  const img = new Image();
  img.onload = ()=>{
    images.push({name:'test-pattern.png', img});
    rebuildFileList();
    switchToImage(images.length-1);
  };
  img.src = c.toDataURL();
}

/* ---------- easter eggs ---------- */
let keyBuf = '';
let konamiIdx = 0;
const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let logoClicks = 0, logoTimer = null;

function egg317(){
  if(!state.unlocked317){
    state.unlocked317 = true;
    buildPresetButtons();
  }
  state.seed = 'MLOW-317';
  $('seed').value = state.seed;
  applyPreset(SIGNATURE_PRESET);
  toast('👁️ third eye open · THE SIGNATURE is yours · 317');
}
function eggMlow(){
  $('logo').classList.add('spin');
  setTimeout(()=>$('logo').classList.remove('spin'), 700);
  toast('the eye sees you 👁️');
}
function eggChaos(){
  toast('⚡ CHAOS MODE · triple hyper mosh');
  let n = 0;
  const iv = setInterval(()=>{
    state.seed = 'CHAOS-'+Math.floor(Math.random()*90000);
    $('seed').value = state.seed;
    mosh(true);
    if(++n>=3) clearInterval(iv);
  }, 1600);
  mosh(true);
}
window.addEventListener('keydown', e=>{
  if(e.key === KONAMI[konamiIdx]){ konamiIdx++; if(konamiIdx===KONAMI.length){ konamiIdx=0; eggChaos(); } }
  else konamiIdx = e.key===KONAMI[0] ? 1 : 0;
  if(e.target.tagName==='INPUT' || e.target.tagName==='SELECT') return;
  if(e.key && e.key.length===1){
    keyBuf = (keyBuf + e.key.toLowerCase()).slice(-10);
    if(keyBuf.endsWith('317')){ keyBuf=''; egg317(); }
    else if(keyBuf.endsWith('mlow')){ keyBuf=''; eggMlow(); }
    else if(keyBuf.endsWith('garden')){ keyBuf=''; toggleGarden(); }
  }
  if(e.code==='Space'){ e.preventDefault(); $('playbtn').click(); }
  if(e.key==='m'||e.key==='M') $('moshbtn').click();
  if(e.key==='h'||e.key==='H') $('hyperbtn').click();
  if(e.key==='a'||e.key==='A') $('autobtn').click();
  if(e.key==='f'||e.key==='F') $('fsbtn').click();
});
$('logo').onclick = ()=>{
  logoClicks++;
  clearTimeout(logoTimer);
  logoTimer = setTimeout(()=>logoClicks=0, 1800);
  if(logoClicks===3) toast('👁️ · keep going');
  if(logoClicks>=7){ logoClicks=0; toggleGarden(); }
};
$('seed').addEventListener('change', ()=>{
  state.seed = $('seed').value || 'MLOW';
  if(state.seed.toUpperCase()==='BLOSSOM'){
    const st = state.chain.find(e=>e.id==='stamp');
    const pe = state.chain.find(e=>e.id==='petals');
    if(st) st.on = true;
    if(pe) pe.on = true;
    buildFxList();
    toast('🌸 the garden grows');
  }
  if(state.seed==='317' || state.seed==='MLOW-317') egg317();
  saveSoon();
});

/* ---------- wire up ---------- */
$('seed').value = state.seed;
$('reroll').onclick = ()=>{ state.seed = 'MLOW-'+Math.floor(Math.random()*90000+10000); $('seed').value = state.seed; saveSoon(); };
$('moshbtn').onclick = ()=>{ state.seed = 'MLOW-'+Math.floor(Math.random()*90000+10000); $('seed').value = state.seed; mosh(false); };
$('hyperbtn').onclick = ()=>{ state.seed = 'HYPER-'+Math.floor(Math.random()*90000+10000); $('seed').value = state.seed; mosh(true); toast('🌀 hyper mosh'); };
$('autobtn').onclick = ()=>{ autoMosh = !autoMosh; $('autobtn').classList.toggle('ghost-on', autoMosh); toast(autoMosh?'♻️ auto mosh on · every '+state.autoLoops+' loops':'♻️ auto mosh off'); };
$('backbtn').onclick = ()=>restoreSnapshot(lastChainSnapshot);
$('clearbtn').onclick = ()=>{ lastChainSnapshot = snapshotChain(); for(const e of state.chain) e.on=false; buildFxList(); saveSoon(); };
$('playbtn').onclick = ()=>{ playing = !playing; $('playbtn').textContent = playing?'⏸':'▶'; };
$('scrub').oninput = ()=>{ playing = false; $('playbtn').textContent='▶'; phase = +$('scrub').value/1000; };
$('comparebtn').onmousedown = ()=>compareHeld=true;
$('comparebtn').onmouseup = ()=>compareHeld=false;
$('comparebtn').onmouseleave = ()=>compareHeld=false;
$('fsbtn').onclick = ()=>{ if(document.fullscreenElement) document.exitFullscreen(); else canvas.requestFullscreen(); };
$('loopsec').oninput = ()=>{ state.loopSec = +$('loopsec').value; $('loopsecv').textContent = state.loopSec.toFixed(1); saveSoon(); };
$('prevres').oninput = ()=>{ state.previewMax = +$('prevres').value; $('prevresv').textContent = state.previewMax; resizePreview(); saveSoon(); };
$('autoloops').oninput = ()=>{ state.autoLoops = +$('autoloops').value; $('autoloopsv').textContent = state.autoLoops; saveSoon(); };
$('exfps').oninput = ()=>{ $('exfpsv').textContent = $('exfps').value; saveSoon(); };
$('exloops').oninput = ()=>{ $('exloopsv').textContent = $('exloops').value; saveSoon(); };
$('exsize').onchange = saveSoon;
$('loadbtn').onclick = ()=>$('file').click();
$('file').onchange = e=>addImages(e.target.files);
$('vidbtn').onclick = ()=>$('vfile').click();
$('vfile').onchange = e=>{ if(e.target.files[0]) loadVideoFile(e.target.files[0]); };
$('cambtn').onclick = toggleCam;
$('filelist').onchange = ()=>switchToImage(+$('filelist').value);
$('expng').onclick = doExportPNG;
$('exgif').onclick = doExportGIF;
$('exmp4').onclick = ()=>doExportVideo('mp4');
$('exwebm').onclick = ()=>doExportVideo('webm');
$('exbatch').onclick = doBatchGIF;

$('savepreset').onclick = ()=>{
  let name = null;
  try{ name = prompt('preset name'); }catch(e){ name = 'PRESET '+state.seed; }
  if(!name) return;
  const user = JSON.parse(localStorage.getItem('moshlab_presets')||'[]');
  user.push(chainToPreset(name));
  localStorage.setItem('moshlab_presets', JSON.stringify(user));
  buildPresetButtons();
};
$('exportpreset').onclick = ()=>{
  dl(new Blob([JSON.stringify(chainToPreset('export'),null,2)],{type:'application/json'}), 'moshlab-preset.json');
};
$('importpreset').onclick = ()=>$('presetfile').click();
$('presetfile').onchange = e=>{
  const f = e.target.files[0];
  if(!f) return;
  f.text().then(t=>{
    try{ applyPreset(JSON.parse(t)); toast('preset loaded 💾'); }
    catch(err){ toast('bad preset file'); }
  });
};
$('settingsout').onclick = ()=>{
  dl(new Blob([JSON.stringify(serialize(),null,2)],{type:'application/json'}), 'moshlab-settings.json');
  toast('settings saved 📤');
};
$('settingsin').onclick = ()=>$('settingsfile').click();
$('settingsfile').onchange = e=>{
  const f = e.target.files[0];
  if(!f) return;
  f.text().then(t=>{
    try{
      hydrate(JSON.parse(t));
      $('seed').value = state.seed;
      $('loopsec').value = state.loopSec; $('loopsecv').textContent = (+state.loopSec).toFixed(1);
      $('prevres').value = state.previewMax; $('prevresv').textContent = state.previewMax;
      $('autoloops').value = state.autoLoops; $('autoloopsv').textContent = state.autoLoops;
      buildFxList(); buildPresetButtons(); resizePreview();
      toast('settings loaded 📥');
      saveSoon();
    }catch(err){ toast('bad settings file'); }
  });
};
$('settingsreset').onclick = ()=>{
  let ok = true;
  try{ ok = confirm('reset everything to factory state?'); }catch(e){ ok = true; }
  if(!ok) return;
  localStorage.removeItem(STORE_KEY);
  location.reload();
};

const wrap = $('canvaswrap');
['dragenter','dragover'].forEach(ev=>wrap.addEventListener(ev, e=>{ e.preventDefault(); $('drophint').style.display='flex'; }));
['dragleave','drop'].forEach(ev=>wrap.addEventListener(ev, e=>{ e.preventDefault(); $('drophint').style.display='none'; }));
wrap.addEventListener('drop', e=>{
  const vids = Array.from(e.dataTransfer.files).filter(f=>f.type.startsWith('video/'));
  if(vids.length) loadVideoFile(vids[0]);
  else addImages(e.dataTransfer.files);
});
document.body.addEventListener('dragover', e=>e.preventDefault());
document.body.addEventListener('drop', e=>e.preventDefault());

/* ---------- boot ---------- */
try{ hydrate(JSON.parse(localStorage.getItem(STORE_KEY)||'null')); }catch(e){}
$('seed').value = state.seed;
$('loopsec').value = state.loopSec; $('loopsecv').textContent = (+state.loopSec).toFixed(1);
$('prevres').value = state.previewMax; $('prevresv').textContent = state.previewMax;
$('autoloops').value = state.autoLoops; $('autoloopsv').textContent = state.autoLoops;
buildFxList();
buildPresetButtons();
if(!localStorage.getItem(STORE_KEY)){
  for(const id of ['rgbshift','scan','noise','vignette']){
    const e = state.chain.find(x=>x.id===id);
    if(e) e.on = true;
  }
  buildFxList();
}
allocTargets(4,4);
makeTestPattern();
const urlImg = new URLSearchParams(location.search).get('img');
if(urlImg){
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = ()=>{ images.push({name:decodeURIComponent(urlImg.split('/').pop()), img}); rebuildFileList(); switchToImage(images.length-1); };
  img.src = urlImg;
}
requestAnimationFrame(t=>{ lastNow=t; tick(t); });

window.MOSHLAB = {state, mosh, applyPreset, doExportGIF, encodeGIF, quantizeFrames, captureLoopFrames,
  switchToImage, images, BUILTIN_PRESETS, SIGNATURE_PRESET, egg317, toggleGarden, pickVideoMime, serialize, hydrate};
