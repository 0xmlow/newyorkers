"use strict";
/* JS drawn overlay layers + preset bank.
   Each drawer paints onto a 2D canvas that gets uploaded as u_ov for its effect pass.
   Drawers receive (ctx, w, h, step, e, env) where env = {rng, seed, sample, phase, blossoms}.
   env.sample(x01, y01) returns [r,g,b] from a small copy of the current source. */

const EMOJI_SETS = {
  nyc:     ['🌃','🚇','🐀','🍕','🚕','🗽'],
  blossom: ['🥀','🌷','🏵️','💮','🌺','🌸'],
  eyes:    ['🕳️','👁️','🧿','👀','👁️','🔵'],
  faces:   ['😶','😐','🙂','😮','😆','🤯'],
  hearts:  ['🖤','💙','💜','💗','🤍','💖'],
  mix:     ['👁️','🌸','🚕','💙','🗽','✨'],
};
const OV_COLORS = {0:'#00E5FF',1:'#FFFFFF',2:'#FF2E63',3:'#2962FF',4:'#D7FF1F'};
const OV_WORDS = ['SIGNAL LOST','NO CARRIER','REC','TRACKING','MLOW','NYC','WATCHING','ERR 0x2F','SYNC','FEED','////','##########','A/V','CH 03','👁','LOOP'];
const STAMP_TINTS = {0:'#FFFFFF',1:'#0D0D0D',2:'#2962FF',3:'#FF2E63',4:'#F0F4F8'};
const ASCII_CHARS = ' .:-=+*#%@';

const OVERLAY_DRAWERS = {

  code(ctx, w, h, step, e, env){
    ctx.clearRect(0,0,w,h);
    const rng = env.rng(step*2654435761);
    const col = OV_COLORS[Math.round(e.params.col)] || '#00E5FF';
    const count = Math.floor(e.params.dens*46)+2;
    for(let i=0;i<count;i++){
      const big = rng() < 0.12;
      const fs = Math.round((big?0.05:0.016)*(0.6+e.params.size*1.6)*Math.min(w,h)) + 6;
      ctx.font = fs+'px Consolas, Menlo, monospace';
      ctx.globalAlpha = 0.35 + rng()*0.6;
      ctx.fillStyle = col;
      let s;
      const kind = rng();
      if(kind < 0.35){ s = '0x'+Math.floor(rng()*0xffffff).toString(16).toUpperCase().padStart(6,'0'); }
      else if(kind < 0.55){ s = OV_WORDS[Math.floor(rng()*OV_WORDS.length)]; }
      else if(kind < 0.75){ let t=''; const n=3+Math.floor(rng()*14); for(let j=0;j<n;j++) t += '01░▒▓█<>/\\|'[Math.floor(rng()*11)]; s=t; }
      else { let t=''; const n=4+Math.floor(rng()*10); for(let j=0;j<n;j++) t += String.fromCharCode(33+Math.floor(rng()*90)); s=t; }
      ctx.fillText(s, rng()*w, rng()*h);
    }
    ctx.globalAlpha = 1;
  },

  ascii(ctx, w, h, step, e, env){
    const cols = Math.round(e.params.cells);
    const cw = w/cols;
    const rows = Math.ceil(h/cw);
    ctx.clearRect(0,0,w,h);
    ctx.globalAlpha = e.params.bg;
    ctx.fillStyle = '#050507';
    ctx.fillRect(0,0,w,h);
    ctx.globalAlpha = 1;
    ctx.font = 'bold '+(cw*1.05)+'px Consolas, Menlo, monospace';
    ctx.textBaseline = 'top';
    const mode = Math.round(e.params.col);
    const fixed = {1:'#00E5FF',2:'#2962FF',3:'#F0F4F8',4:'#3DFFC0'}[mode];
    for(let y=0;y<rows;y++){
      for(let x=0;x<cols;x++){
        const [r,g,b] = env.sample((x+0.5)/cols, (y+0.5)/rows);
        const l = (0.299*r+0.587*g+0.114*b)/255;
        const ch = ASCII_CHARS[Math.min(ASCII_CHARS.length-1, Math.floor(l*ASCII_CHARS.length))];
        if(ch === ' ') continue;
        ctx.fillStyle = fixed || `rgb(${r},${g},${b})`;
        ctx.fillText(ch, x*cw, y*cw);
      }
    }
  },

  emojimosaic(ctx, w, h, step, e, env){
    const cols = Math.round(e.params.cells);
    const cw = w/cols;
    const rows = Math.ceil(h/cw);
    ctx.clearRect(0,0,w,h);
    ctx.globalAlpha = e.params.bg;
    ctx.fillStyle = '#050507';
    ctx.fillRect(0,0,w,h);
    ctx.globalAlpha = 1;
    const set = EMOJI_SETS[Object.keys(EMOJI_SETS)[Math.round(e.params.set)]] || EMOJI_SETS.nyc;
    ctx.font = (cw*0.92)+'px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.textBaseline = 'top';
    for(let y=0;y<rows;y++){
      for(let x=0;x<cols;x++){
        const [r,g,b] = env.sample((x+0.5)/cols, (y+0.5)/rows);
        const l = (0.299*r+0.587*g+0.114*b)/255;
        const idx = Math.min(set.length-1, Math.floor(l*set.length));
        ctx.fillText(set[idx], x*cw, y*cw + cw*0.05);
      }
    }
  },

  emojirain(ctx, w, h, step, e, env){
    ctx.clearRect(0,0,w,h);
    const set = EMOJI_SETS[Object.keys(EMOJI_SETS)[Math.round(e.params.set)]] || EMOJI_SETS.nyc;
    const n = Math.floor(e.params.dens*90)+8;
    const rng = env.rng(9173);
    const t = env.phase;
    const cyc = Math.max(1, Math.round(e.params.fall));
    for(let i=0;i<n;i++){
      const x0 = rng(), y0 = rng(), spd = 0.6+rng()*0.8, sway = rng();
      const em = set[Math.floor(rng()*set.length)];
      const fs = (0.02+e.params.size*0.06)*(0.6+rng()*0.9)*Math.min(w,h);
      const y = ((y0 + t*cyc*spd) % 1.15) - 0.075;
      const x = x0 + Math.sin(TAU*(t*cyc + sway))*0.02;
      const rot = Math.sin(TAU*(t*cyc*0.5 + sway))*0.5;
      ctx.save();
      ctx.translate(x*w, y*h);
      ctx.rotate(rot);
      ctx.font = fs+'px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
      ctx.globalAlpha = 0.85;
      ctx.fillText(em, -fs/2, fs/2);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  },

  petals(ctx, w, h, step, e, env){
    ctx.clearRect(0,0,w,h);
    const n = Math.floor(e.params.dens*110)+12;
    const rng = env.rng(31731);
    const t = env.phase;
    const cyc = Math.max(1, Math.round(e.params.fall));
    const cols = ['#FF2E63','#FF7AA0','#FFB7CD','#7EB8FF','#F0F4F8'];
    for(let i=0;i<n;i++){
      const x0 = rng(), y0 = rng(), spd = 0.5+rng()*0.9, sway = rng();
      const col = cols[Math.floor(rng()*cols.length)];
      const sz = (0.006+e.params.size*0.02)*(0.5+rng())*Math.min(w,h);
      const y = ((y0 + t*cyc*spd) % 1.12) - 0.06;
      const x = x0 + Math.sin(TAU*(t*cyc*0.7 + sway))*0.035;
      const rot = TAU*(sway + t*cyc*(0.3+sway*0.4));
      ctx.save();
      ctx.translate(x*w, y*h);
      ctx.rotate(rot);
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(0, 0, sz, sz*0.45, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
      if(rng() < 0.06){
        ctx.font = (sz*3)+'px "Apple Color Emoji", sans-serif';
        ctx.globalAlpha = 0.8;
        ctx.fillText('🌸', x*w, y*h);
      }
    }
    ctx.globalAlpha = 1;
  },

  stamp(ctx, w, h, step, e, env){
    ctx.clearRect(0,0,w,h);
    const img = env.blossoms[Math.max(0, Math.min(6, Math.round(e.params.icon)-1))];
    if(!img || !img.complete) return;
    const size = e.params.size*Math.min(w,h);
    const m = size*0.35;
    const pos = Math.round(e.params.pos);
    let x, y;
    if(pos===0){ x=w-size-m; y=h-size-m; }
    else if(pos===1){ x=m; y=h-size-m; }
    else if(pos===2){ x=w-size-m; y=m; }
    else if(pos===3){ x=m; y=m; }
    else { x=(w-size)/2; y=(h-size)/2; }
    const off = document.createElement('canvas');
    off.width = off.height = Math.max(2, Math.ceil(size));
    const ox = off.getContext('2d');
    ox.drawImage(img, 0, 0, off.width, off.height);
    ox.globalCompositeOperation = 'source-in';
    ox.fillStyle = STAMP_TINTS[Math.round(e.params.tint)] || '#FFFFFF';
    ox.fillRect(0,0,off.width,off.height);
    ctx.drawImage(off, x, y);
  },

  camhud(ctx, w, h, step, e, env){
    ctx.clearRect(0,0,w,h);
    const col = {0:'#FFFFFF',1:'#3DFFC0',2:'#00E5FF'}[Math.round(e.params.col)] || '#FFFFFF';
    const style = Math.round(e.params.style);
    const t = env.phase;
    const u = Math.min(w,h)/100;
    const blink = (t*2)%1 < 0.5;
    ctx.strokeStyle = col; ctx.fillStyle = col;
    ctx.lineWidth = Math.max(1, u*0.4);
    ctx.font = 'bold '+(u*3.6)+'px Consolas, Menlo, monospace';
    ctx.textBaseline = 'top';
    const frame = String(Math.floor(t*24*4)%24).padStart(2,'0');
    const secs = String(Math.floor(t*8)%60).padStart(2,'0');
    if(style===0){ // camcorder
      const cl = u*7;
      for(const [cx,cy,dx,dy] of [[u*4,u*4,1,1],[w-u*4,u*4,-1,1],[u*4,h-u*4,1,-1],[w-u*4,h-u*4,-1,-1]]){
        ctx.beginPath();
        ctx.moveTo(cx, cy+dy*cl); ctx.lineTo(cx, cy); ctx.lineTo(cx+dx*cl, cy);
        ctx.stroke();
      }
      if(blink){
        ctx.fillStyle = '#FF2E63';
        ctx.beginPath(); ctx.arc(u*8, u*10, u*1.6, 0, TAU); ctx.fill();
        ctx.fillStyle = col;
      }
      ctx.fillText('REC', u*11, u*8.4);
      ctx.fillText('SP 0:00:'+secs, u*4, h-u*8);
      ctx.textAlign = 'right';
      ctx.fillText('AUG 23 2026', w-u*4, h-u*8);
      ctx.fillText('▶ PLAY', w-u*4, u*8.4);
      ctx.textAlign = 'left';
    } else if(style===1){ // security
      ctx.fillText('CAM 03  BODEGA', u*4, u*4);
      ctx.textAlign = 'right';
      ctx.fillText('03:17:'+secs+':'+frame, w-u*4, u*4);
      ctx.textAlign = 'left';
      ctx.fillText('AUG 23 2026', u*4, h-u*8);
      if(blink) ctx.fillText('● REC', w-u*18, h-u*8);
      ctx.globalAlpha = 0.25;
      for(let y=0;y<h;y+=u*1.4) ctx.fillRect(0,y,w,1);
      ctx.globalAlpha = 1;
    } else { // dashcam
      ctx.fillText('MLOW-DASH  64 MPH', u*4, h-u*8);
      ctx.textAlign = 'right';
      ctx.fillText('NYC GRID '+secs+'.'+frame, w-u*4, h-u*8);
      ctx.textAlign = 'left';
      if(blink){ ctx.fillStyle='#FF2E63'; ctx.fillText('●', u*4, u*4); ctx.fillStyle=col; }
    }
  },
};

/* ---------- preset bank ---------- */
const BUILTIN_PRESETS = [
 {name:'STILL WAITING 📼', loop:2.4, chain:[
   ['adjust',{con:1.15,sat:1.1}], ['blocks',{cells:14,amt:0.55,split:0.8,spd:12,esc:0.85}],
   ['mosh',{amt:0.5,cells:24,drift:0.5,spd:14,esc:0.9}], ['rgbshift',{amt:0.006,pulse:0.6}],
   ['vhs',{bleed:0.4,track:0.5,grain:0.3}], ['scan',{count:260,amt:0.3,spd:1}],
   ['noise',{amt:0.18,spd:16}], ['vignette',{amt:0.45}]]},
 {name:'SUBWAY GHOST 🚇', loop:3.2, chain:[
   ['ghost',{amt:0.8,zoom:0.35,dx:0.1,dy:0}], ['badtv',{warp:0.2,jit:0.25,band:0.5,roll:1}],
   ['duotone',{a:'#0D0D0D',b:'#00E5FF',mix:0.85}], ['scan',{count:200,amt:0.3}],
   ['noise',{amt:0.15,spd:10}], ['vignette',{amt:0.6}]]},
 {name:'VHS MEMORY 📺', loop:2.8, chain:[
   ['vhs',{bleed:0.7,track:0.6,grain:0.45}], ['badtv',{warp:0.3,jit:0.4,band:0.7,roll:1}],
   ['adjust',{sat:1.2,con:1.1,bri:1.05}], ['scan',{count:300,amt:0.4}],
   ['vignette',{amt:0.5}]]},
 {name:'PRINT RIOT 🗞️', loop:2, chain:[
   ['halftone',{scale:80,ang:0.13,ink:0.9,mix:1}], ['rgbshift',{amt:0.012,pulse:0.5}],
   ['slices',{bands:18,prob:0.25,mag:0.06,spd:6}], ['posterize',{levels:6}]]},
 {name:'DATABENT 🗜️', loop:2, chain:[
   ['jpeg',{crush:0.75,block:1}], ['blocks',{cells:10,amt:0.5,split:1,spd:10}],
   ['slices',{bands:30,prob:0.4,mag:0.12,spd:10}], ['smear',{th:0.5,len:0.2,ang:0}],
   ['posterize',{levels:7}]]},
 {name:'CRT CLEAN 🖥️', loop:2, chain:[
   ['rgbshift',{amt:0.003,pulse:0.2}], ['crt',{curve:0.5,mask:0.5,vig:0.6}],
   ['scan',{count:240,amt:0.25,spd:1}], ['noise',{amt:0.08,spd:12}]]},
 {name:'ACID GRID 🔮', loop:4, chain:[
   ['kaleido',{sides:8,spin:1}], ['tile',{n:2,mir:1}], ['wave',{amp:0.04,freq:5,cyc:1}],
   ['rgbshift',{amt:0.01,pulse:0.8}], ['adjust',{spin:1,sat:1.5,con:1.2}]]},
 {name:'MELTDOWN 🫠', loop:3, chain:[
   ['smear',{th:0.4,len:0.35,ang:0.75}], ['wave',{amp:0.05,freq:8,cyc:2,vert:0.5}],
   ['wobble',{amp:0.4,kx:1,ky:2}], ['solarize',{th:0.6,amt:0.6}],
   ['noise',{amt:0.2,col:0.6,spd:14}]]},
 {name:'SIGNAL LOST 👾', loop:2.2, chain:[
   ['badtv',{warp:0.5,jit:0.7,band:0.9,roll:2}], ['vhs',{bleed:0.6,track:0.9,grain:0.6}],
   ['overlay',{dens:0.5,size:0.4,spd:10,col:1,amt:0.9}], ['adjust',{sat:0.4,con:1.25}],
   ['scan',{count:180,amt:0.45}]]},
 {name:'GAME BOY 🎮', loop:2, chain:[
   ['pixelate',{size:120}], ['dither',{algo:1,pal:2,levels:4,scale:2}],
   ['wobble',{amp:0.15,kx:1,ky:1}]]},
 {name:'THERMAL CAM 🌡️', loop:2.5, chain:[
   ['blur',{rad:3}], ['heatmap',{pal:0,mix:1}], ['camhud',{style:1,col:0}],
   ['scan',{count:200,amt:0.25}], ['noise',{amt:0.12,spd:10}]]},
 {name:'NEWSPRINT 📰', loop:2, chain:[
   ['dither',{algo:2,pal:1,levels:2,scale:3}], ['ripple',{amp:0.02,rows:60,cyc:1,ramp:0.3}],
   ['vignette',{amt:0.3}]]},
 {name:'DEEP FRIED 🍟', loop:1.6, chain:[
   ['deepfry',{amt:0.8}], ['jpeg',{crush:0.7,block:1}], ['bulge',{str:0.4,rad:0.8}],
   ['emojirain',{set:3,dens:0.25,size:0.35,fall:1,amt:0.9}]]},
 {name:'EMOJI CITY 🗽', loop:2.5, chain:[
   ['emojimosaic',{cells:40,set:0,bg:1,amt:1}], ['rgbshift',{amt:0.004,pulse:0.4}],
   ['scan',{count:200,amt:0.2}]]},
 {name:'THE GARDEN 🌸', loop:4, chain:[
   ['adjust',{sat:1.15,bri:1.05,con:1.05}], ['glow',{th:0.5,rad:5,amt:0.9}],
   ['petals',{dens:0.6,size:0.45,fall:1,amt:0.95}], ['stamp',{icon:3,pos:0,size:0.12,tint:0,amt:0.8}],
   ['vignette',{amt:0.35,round:0.6}]]},
 {name:'SECURITY FEED 📹', loop:3, chain:[
   ['adjust',{sat:0.25,con:1.2,bri:0.95}], ['heatmap',{pal:1,mix:0.5}],
   ['interlace',{shift:0.01,rowh:2,inv:0}], ['camhud',{style:1,col:1}],
   ['noise',{amt:0.2,spd:14}], ['vignette',{amt:0.5}]]},
 {name:'ACID TRIP 🌀', loop:4, chain:[
   ['swirl',{str:0.6,rad:1,spin:1}], ['prism',{spread:0.8,axis:0,cyc:1}],
   ['ghost',{amt:0.6,zoom:0.4}], ['glow',{th:0.5,rad:6,amt:1}]]},
 {name:'CRYSTAL CITY 💠', loop:2.5, chain:[
   ['crystals',{cells:40,jit:0.9,edge:0.35}], ['prism',{spread:0.4,axis:1,cyc:0}],
   ['sharpen',{amt:1.2}], ['vignette',{amt:0.4}]]},
 /* 2026-10-03: thirty more, using the twelve new effects */
 {name:'TUNNEL VISION 🕳️', loop:3, chain:[
   ['droste',{zoom:2.4,cyc:1,twist:0.2}], ['rgbshift',{amt:0.006,pulse:0.6}],
   ['glow',{th:0.55,rad:5,amt:0.8}], ['vignette',{amt:0.55}]]},
 {name:'PIXEL WATERFALL 🧵', loop:3, chain:[
   ['pixelsort',{th:0.5,len:0.35,dir:0,breath:0.6}], ['glow',{th:0.6,rad:4,amt:0.6}],
   ['scan',{count:260,amt:0.2,spd:1}]]},
 {name:'BROKEN WINDOW 🪟', loop:2.4, chain:[
   ['shatter',{cells:9,amt:0.45,spd:5,esc:0.7}], ['chroma',{amt:0.02,pulse:0.5,barrel:0.1}],
   ['noise',{amt:0.12,spd:12}], ['vignette',{amt:0.4}]]},
 {name:'NEON NOIR 💡', loop:3, chain:[
   ['neon',{str:2.2,cyc:1,bg:0.1}], ['vortex',{amt:0.75,rot:0.2,zoom:0.3,hue:0.3}],
   ['vignette',{amt:0.6}]]},
 {name:'RISO ZINE 🖨️', loop:2, chain:[
   ['adjust',{con:1.3}], ['riso',{a:'#FF2E88',b:'#2962FF',mis:0.008,grain:0.55,spd:4}],
   ['vignette',{amt:0.2,round:0.3}]]},
 {name:'TIMES SQUARE OVERLOAD 🗽', loop:2, chain:[
   ['kaleido',{sides:6,spin:1}], ['strobe',{rate:4,duty:0.2,mode:3}],
   ['glow',{th:0.5,rad:6,amt:1.1}], ['emojirain',{set:0,dens:0.35,size:0.3,fall:2,amt:0.9}]]},
 {name:'HYPERSPACE 🚀', loop:2.5, chain:[
   ['zoomblur',{str:0.3,cx:0.5,cy:0.5,pulse:0.8}], ['chroma',{amt:0.03,pulse:0.8,barrel:0.2}],
   ['vortex',{amt:0.6,rot:0,zoom:0.8,hue:0.2}], ['adjust',{spin:1,sat:1.4,con:1.15}]]},
 {name:'TINY PLANET 🌐', loop:4, chain:[
   ['polar',{mix:1,inv:0,spin:1}], ['glow',{th:0.6,rad:5,amt:0.7}],
   ['adjust',{sat:1.25,con:1.1}], ['vignette',{amt:0.5,round:1}]]},
 {name:'BIT ROT 🧨', loop:2, chain:[
   ['bitrot',{bits:3,rot:0.35,cells:28,spd:12}], ['jpeg',{crush:0.6,block:1}],
   ['slices',{bands:24,prob:0.3,mag:0.08,spd:8}]]},
 {name:'HOLOGRAM CARD 🎞️', loop:3, chain:[
   ['lenticular',{stripes:80,shift:0.015,hue:0.5,cyc:2}], ['prism',{spread:0.6,axis:0.3,cyc:1}],
   ['sharpen',{amt:1}], ['glow',{th:0.6,rad:4,amt:0.5}]]},
 {name:'CHANNEL SURF 📡', loop:2.4, chain:[
   ['chanswap',{mode:4,rate:4,mix:1}], ['badtv',{warp:0.3,jit:0.4,band:0.6,roll:1}],
   ['scan',{count:240,amt:0.35,spd:1}], ['crt',{curve:0.5,mask:0.5,vig:0.6}]]},
 {name:'MIDNIGHT EXPRESS 🚇', loop:2, chain:[
   ['zoomblur',{str:0.18,cx:0.5,cy:0.55,pulse:0.3}], ['duotone',{a:'#050510',b:'#2962FF',mix:0.8}],
   ['interlace',{shift:0.006,rowh:3,inv:0}], ['scan',{count:200,amt:0.3}], ['vignette',{amt:0.6}]]},
 {name:'FACE TIME 🙂', loop:2.5, chain:[
   ['emojimosaic',{cells:34,set:3,bg:1,amt:1}], ['posterize',{levels:6}],
   ['rgbshift',{amt:0.004,pulse:0.5}]]},
 {name:'GREEN CODE 💚', loop:3, chain:[
   ['ascii',{cells:90,col:4,bg:1,amt:1}], ['overlay',{dens:0.4,size:0.35,spd:12,col:4,amt:0.7}],
   ['glow',{th:0.5,rad:4,amt:0.8}], ['crt',{curve:0.4,mask:0.4,vig:0.5}]]},
 {name:'GAME OVER 🕹️', loop:2, chain:[
   ['pixelate',{size:96}], ['dither',{algo:1,pal:2,levels:4,scale:2}],
   ['bitrot',{bits:2,rot:0.15,cells:20,spd:8}], ['shatter',{cells:6,amt:0.2,spd:4,esc:0.9}]]},
 {name:'POP ART 🥫', loop:2, chain:[
   ['posterize',{levels:4}], ['adjust',{sat:2,con:1.3}],
   ['halftone',{scale:70,ang:0.2,ink:0.9,mix:0.6}], ['chanswap',{mode:4,rate:2,mix:1}]]},
 {name:'WARHOL WALL 🧱', loop:2, chain:[
   ['tile',{n:2,mir:0}], ['chanswap',{mode:4,rate:3,mix:1}],
   ['posterize',{levels:5}], ['adjust',{sat:1.8,con:1.25}], ['halftone',{scale:120,ang:0.1,ink:0.8,mix:0.4}]]},
 {name:'ACID RAIN ☔', loop:3, chain:[
   ['ripple',{amp:0.04,rows:120,cyc:2,ramp:0.5}], ['prism',{spread:0.9,axis:0.5,cyc:2}],
   ['noise',{amt:0.15,col:0.8,spd:16}], ['glow',{th:0.5,rad:5,amt:0.7}]]},
 {name:'SOLAR FLARE ☀️', loop:2.5, chain:[
   ['glow',{th:0.35,rad:10,amt:1.6}], ['solarize',{th:0.55,amt:0.7}],
   ['chroma',{amt:0.025,pulse:0.6,barrel:0.15}], ['zoomblur',{str:0.1,pulse:1}]]},
 {name:'X RAY 🩻', loop:2.5, chain:[
   ['invert',{amt:1}], ['edges',{str:0.7,mix:0.5,tint:'#00E5FF'}],
   ['duotone',{a:'#020814',b:'#BFF6FF',mix:0.7}], ['glow',{th:0.5,rad:5,amt:0.9}], ['scan',{count:300,amt:0.2}]]},
 {name:'DASHCAM 🚕', loop:3, chain:[
   ['wobble',{amp:0.2,kx:1,ky:2}], ['vhs',{bleed:0.4,track:0.3,grain:0.35}],
   ['rgbshift',{amt:0.004,pulse:0.4}], ['camhud',{style:2,col:0,amt:1}], ['vignette',{amt:0.45}]]},
 {name:'BLOSSOM RISO 🌸', loop:4, chain:[
   ['riso',{a:'#FF2E88',b:'#00E5FF',mis:0.005,grain:0.45,spd:3}], ['petals',{dens:0.5,size:0.4,fall:1,amt:0.9}],
   ['stamp',{icon:3,pos:0,size:0.12,tint:3,amt:0.8}]]},
 {name:'DATAMOSH DELUXE 📼', loop:2.8, chain:[
   ['mosh',{amt:0.6,cells:24,drift:0.7,spd:14,esc:0.9}], ['blocks',{cells:12,amt:0.5,split:1,spd:12,esc:0.9}],
   ['vortex',{amt:0.55,rot:0.15,zoom:0.2,hue:0.15}], ['rgbshift',{amt:0.01,pulse:0.8}], ['noise',{amt:0.12,spd:14}]]},
 {name:'INFINITE MIRROR 🪞', loop:4, chain:[
   ['mirror',{mode:4}], ['droste',{zoom:2,cyc:1,twist:0}],
   ['vortex',{amt:0.5,rot:0.3,zoom:0.2,hue:0.25}], ['glow',{th:0.6,rad:5,amt:0.6}]]},
 {name:'LIQUID CHROME 🪩', loop:3, chain:[
   ['oil',{rad:4}], ['adjust',{sat:0,con:1.4,bri:1.05}], ['solarize',{th:0.5,amt:0.8}],
   ['chroma',{amt:0.015,pulse:0.5,barrel:0}], ['sharpen',{amt:1.4}], ['glow',{th:0.7,rad:4,amt:0.7}]]},
 {name:'COSMIC SWIRL 🌀', loop:4, chain:[
   ['swirl',{str:0.7,rad:1.1,spin:1}], ['vortex',{amt:0.8,rot:0.5,zoom:0.1,hue:0.4}],
   ['prism',{spread:0.5,axis:0,cyc:1}], ['vignette',{amt:0.4,round:1}]]},
 {name:'CRACKED SCREEN 📱', loop:2, chain:[
   ['shatter',{cells:14,amt:0.25,spd:2,esc:0}], ['interlace',{shift:0.01,rowh:2,inv:1}],
   ['chanswap',{mode:3,rate:8,mix:0.35}], ['crt',{curve:0.3,mask:0.6,vig:0.5}]]},
 {name:'LED BILLBOARD 🏙️', loop:2, chain:[
   ['adjust',{sat:1.5,con:1.2}], ['ledwall',{cells:90,gap:0.3,glow:1.4}],
   ['chroma',{amt:0.012,pulse:0.4,barrel:0.1}], ['glow',{th:0.4,rad:6,amt:0.9}]]},
 {name:'XEROX ZINE 📠', loop:1.8, chain:[
   ['adjust',{con:1.6,sat:0}], ['dither',{algo:4,pal:1,levels:2,scale:2}],
   ['smear',{th:0.6,len:0.08,ang:0.25}], ['jpeg',{crush:0.4,block:2}], ['noise',{amt:0.15,spd:12}]]},
 {name:'THE FLOOD 🌊', loop:4, chain:[
   ['wave',{amp:0.03,freq:6,cyc:1,vert:0}], ['pixelsort',{th:0.45,len:0.3,dir:1,breath:0.7}],
   ['duotone',{a:'#001A33',b:'#00E5FF',mix:0.7}], ['ghost',{amt:0.6,zoom:-0.2,dx:0,dy:0.3}], ['vignette',{amt:0.5}]]},
];

/* unlocked by the 317 egg */
const SIGNATURE_PRESET = {name:'THE SIGNATURE 👁️ 317', loop:3.17, chain:[
  ['adjust',{con:1.2,sat:1.15}],
  ['mosh',{amt:0.45,cells:31,drift:0.7,spd:17,esc:0.7}],
  ['blocks',{cells:17,amt:0.4,split:1,spd:13,esc:0.5}],
  ['rgbshift',{amt:0.01,ang:0.317,pulse:0.7}],
  ['duotone',{a:'#0D0D0D',b:'#2962FF',mix:0.6}],
  ['overlay',{dens:0.317,size:0.4,spd:7,col:3,amt:0.8}],
  ['stamp',{icon:3,pos:0,size:0.1,tint:0,amt:0.7}],
  ['scan',{count:317,amt:0.3,spd:1}],
  ['vignette',{amt:0.5}]]};
