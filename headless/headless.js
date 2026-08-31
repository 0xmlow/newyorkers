"use strict";
/* MOSH LAB headless renderer.
   Same GL pipeline, overlay system and GIF encoder as app/app.js, minus the UI.
   Reads a job file, renders each image through a seeded glitch family chain,
   writes loop perfect GIF + PNG still + one manifest.jsonl line per item. */

const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');

function log(msg){ ipcRenderer.send('log', msg); }
function fatal(msg){ ipcRenderer.send('fatal', msg); }

/* ---------- tiny utils (as in app.js) ---------- */
const TAU = Math.PI*2;   /* overlays.js drawers expect this global from app.js */
function strHash(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hexToRgb(h){const n=parseInt(h.slice(1),16);return[((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255];}

const blossomImgs = BRAND.blossoms.map(src=>{ const i=new Image(); i.src=src; return i; });

/* ---------- gl ---------- */
const canvas = document.getElementById('gl');
const gl = canvas.getContext('webgl2', {preserveDrawingBuffer:true}) || canvas.getContext('webgl', {preserveDrawingBuffer:true});
if(!gl) fatal('WebGL is not available');

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
  catch(e){ log('shader fail: '+fx.id+' '+e.message); }
}
const copyProg = makeProgram(`void main(){ gl_FragColor = texture2D(u_tex, v_uv); }`);
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
let curImg = null;

const state = {
  seed: 'MLOW-HEADLESS',
  loopSec: 2.5,
  chain: EFFECTS.map(fx => ({
    id: fx.id, on: false, lock: false,
    params: Object.fromEntries(fx.params.map(p => [p.k, p.def])),
  })),
};
function fxDef(id){ return EFFECTS.find(e=>e.id===id); }
function seedFloat(){ return (strHash(state.seed)%10000)/100; }

/* overlay layers */
const ovLayers = {};
function ovLayer(id){
  let L = ovLayers[id];
  if(!L){
    const c = document.createElement('canvas');
    L = ovLayers[id] = {canvas:c, ctx:c.getContext('2d'), tex:makeTex(4,4), step:-9, sig:''};
  }
  return L;
}

/* source sampling for overlay drawers */
const sampleCv = document.createElement('canvas');
const sampleCtx = sampleCv.getContext('2d', {willReadFrequently:true});
let sampleData = null, sampleW = 2, sampleH = 2;
function refreshSample(){
  sampleW = 128;
  sampleH = Math.max(2, Math.round(128*srcH/Math.max(srcW,1)));
  sampleCv.width = sampleW; sampleCv.height = sampleH;
  try{
    if(curImg) sampleCtx.drawImage(curImg, 0, 0, sampleW, sampleH);
    sampleData = sampleCtx.getImageData(0,0,sampleW,sampleH).data;
  }catch(e){ sampleData = null; }
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

/* ---------- render (verbatim pipeline from app.js) ---------- */
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
  const sig = JSON.stringify(e.params)+state.seed+'image';
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

function render(ph){
  if(!srcTex) return;
  let src = srcTex;
  let pp = 0;
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
  drawPass(copyProg, src, null);
  drawPass(copyProg, src, prevB);
  const t = prevA; prevA = prevB; prevB = t;
}

/* ---------- gif encode (verbatim from app.js) ---------- */
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
  return new Uint8Array(out);
}
function quantizeFrames(frames, w, h){
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
  }
  return {indexed, palette};
}

function captureLoopFrames(w, h, frames){
  refreshSample();
  for(let k=0; k<frames*2; k++) render(k/frames % 1);
  const out = [];
  const buf = new Uint8Array(w*h*4);
  for(let k=0; k<frames; k++){
    render(k/frames);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    const flip = new Uint8ClampedArray(w*h*4);
    for(let y=0; y<h; y++) flip.set(buf.subarray((h-1-y)*w*4, (h-y)*w*4), y*w*4);
    out.push(flip);
  }
  return out;
}

/* ---------- recipe engine ---------- */
function resetChain(){
  for(const e of state.chain){
    e.on = false; e.lock = false;
    const def = fxDef(e.id);
    for(const p of def.params) e.params[p.k] = p.def;
  }
}
function jitterParam(p, base, rng){
  if(p.type === 'color' || p.type === 'select') return base;
  /* proportional jitter keeps each family near its tuned look */
  let v = (+base) * (1 + (rng()*2 - 1) * JITTER);
  v = Math.max(p.min, Math.min(p.max, v));
  if(p.int || p.step >= 1) v = Math.round(v);
  return +(+v).toFixed(4);
}
function applyRecipe(seed, forceFamily){
  const rng = mulberry32(strHash(seed));
  const family = FAMILIES.find(f=>f.key===forceFamily) || FAMILIES[Math.floor(rng()*FAMILIES.length)];
  resetChain();
  state.seed = seed;
  state.loopSec = family.loop;
  const order = [];
  for(const [id, params] of family.fx){
    const e = state.chain.find(x=>x.id===id);
    if(!e) continue;
    const def = fxDef(id);
    e.on = true;
    for(const p of def.params){
      const base = (params[p.k] !== undefined) ? params[p.k] : p.def;
      e.params[p.k] = (params[p.k] !== undefined) ? jitterParam(p, base, rng) : base;
    }
    order.push(e);
  }
  /* seeded bonus finisher, 30% of tokens get one extra light effect */
  let bonus = null;
  if(rng() < 0.3){
    const usedIds = new Set(order.map(e=>e.id));
    const cands = BONUS_POOL.filter(id=>!usedIds.has(id));
    const id = cands[Math.floor(rng()*cands.length)];
    const e = state.chain.find(x=>x.id===id);
    if(e){
      const def = fxDef(id);
      e.on = true;
      for(const p of def.params){
        if(p.type==='color'||p.type==='select'){ e.params[p.k]=p.def; continue; }
        const r = p.r || [p.min + 0.15*(p.max-p.min), p.min + 0.45*(p.max-p.min)];
        /* keep bonus subtle: sample the lower half of the rand range */
        let v = r[0] + rng()*(r[1]-r[0])*0.5;
        if(p.int || p.step >= 1) v = Math.round(v);
        e.params[p.k] = +(+v).toFixed(4);
      }
      order.push(e);
      bonus = id;
    }
  }
  const rest = state.chain.filter(e => !order.includes(e));
  state.chain = order.concat(rest);
  return {family, bonus};
}

/* ---------- io ---------- */
function loadImage(p){
  return new Promise((res, rej)=>{
    const img = new Image();
    img.onload = ()=>res(img);
    img.onerror = ()=>rej(new Error('image load failed: '+p));
    img.src = 'file://'+encodeURI(p).replace(/#/g,'%23');
  });
}
function stillPNG(w, h, ph){
  render(ph);
  const buf = new Uint8Array(w*h*4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  const id = ctx.createImageData(w, h);
  for(let y=0; y<h; y++) id.data.set(buf.subarray((h-1-y)*w*4, (h-y)*w*4), y*w*4);
  ctx.putImageData(id, 0, 0);
  const b64 = cv.toDataURL('image/png').split(',')[1];
  return Buffer.from(b64, 'base64');
}
const sleep0 = ()=>new Promise(r=>setTimeout(r,0));

/* ---------- main ---------- */
async function main(){
  /* overlay drawers stamp these bitmaps; make sure they are decoded first */
  await Promise.all(blossomImgs.map(i=>i.decode().catch(()=>{})));
  const q = new URLSearchParams(location.search);
  const job = JSON.parse(fs.readFileSync(q.get('job'), 'utf8'));
  const outDir = job.out;
  const gifDir = path.join(outDir, 'gifs');
  const stillDir = path.join(outDir, 'stills');
  fs.mkdirSync(gifDir, {recursive:true});
  fs.mkdirSync(stillDir, {recursive:true});
  const manifestPath = path.join(outDir, 'manifest.jsonl');
  const already = new Set();
  if(fs.existsSync(manifestPath)){
    for(const line of fs.readFileSync(manifestPath,'utf8').split('\n')){
      if(!line.trim()) continue;
      try{ already.add(JSON.parse(line).token); }catch(e){}
    }
  }
  const maxDim = job.maxDim || 720;
  const delayCs = job.delayCs || 6;   /* 6cs = 16.7fps */
  const t0 = Date.now();
  let done = 0, skipped = 0, failed = 0;

  for(const item of job.items){
    if(already.has(item.token)){ skipped++; continue; }
    try{
      const img = await loadImage(item.src);
      curImg = img;
      srcW = img.naturalWidth; srcH = img.naturalHeight;
      const [w, h] = fitSize(maxDim);
      if(w !== renderW || h !== renderH) allocTargets(w, h);
      uploadSource(img);

      const seed = 'MLOW-NY-' + item.token + '-GLITCH-V1';
      const {family, bonus} = applyRecipe(seed, item.family);
      const frames = Math.max(8, Math.round(state.loopSec*100/delayCs));

      const raw = captureLoopFrames(w, h, frames);
      const {indexed, palette} = quantizeFrames(raw, w, h);
      const gifBytes = encodeGIF(w, h, indexed, palette, delayCs);
      const base = item.token + ' ' + item.name;
      fs.writeFileSync(path.join(gifDir, base + '.gif'), Buffer.from(gifBytes));
      fs.writeFileSync(path.join(stillDir, base + '.png'), stillPNG(w, h, 0.37));

      const rec = {
        token: item.token, name: item.name, seed,
        family: family.key, familyName: family.name, tag: family.tag,
        bonus, loopSec: state.loopSec, frames, w, h, delayCs,
        src: item.src,
        gif: 'gifs/' + base + '.gif',
        still: 'stills/' + base + '.png',
        chain: state.chain.filter(e=>e.on).map(e=>({id:e.id, params:e.params})),
      };
      fs.appendFileSync(manifestPath, JSON.stringify(rec) + '\n');
      done++;
      if(done % 5 === 0 || done === 1){
        const rate = (Date.now()-t0)/1000/Math.max(1,done);
        log(`[${done}/${job.items.length-skipped}] ${base} · ${family.key}${bonus?'+'+bonus:''} · ${rate.toFixed(1)}s/item`);
      }
    }catch(e){
      failed++;
      log('FAIL ' + item.token + ' ' + item.name + ' :: ' + (e && e.message));
    }
    await sleep0();
  }
  ipcRenderer.send('done', `rendered=${done} skipped=${skipped} failed=${failed} in ${((Date.now()-t0)/60000).toFixed(1)}min`);
}

window.addEventListener('load', ()=>{ main().catch(e=>fatal(e.stack||String(e))); });
