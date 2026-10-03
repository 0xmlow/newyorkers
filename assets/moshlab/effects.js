"use strict";
/* MOSH LAB effect library. Every effect is one GLSL pass.
   param spec: {k,label,min,max,step,def,int?,r:[randMin,randMax]?}
   type:'color' -> hex string; type:'select' -> options list.
   stage orders the chain when moshing: 1 geometry, 2 break, 3 texture, 4 color, 5 finish.
   ovDraw marks a JS-drawn overlay effect (drawer lives in overlays.js). */

const PRELUDE = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform sampler2D u_prev;
uniform sampler2D u_ov;
uniform vec2 u_res;
uniform float u_t;
uniform float u_seed;
#define TAU 6.283185307179586
float h2(vec2 p){ return fract(sin(dot(p+u_seed, vec2(127.1,311.7)))*43758.5453123); }
float lum(vec3 c){ return dot(c, vec3(0.299,0.587,0.114)); }
vec3 hueShift(vec3 color, float a){
  const vec3 k = vec3(0.57735);
  float c = cos(a), s = sin(a);
  return color*c + cross(k,color)*s + k*dot(k,color)*(1.0-c);
}
float bay2(vec2 a){ a=floor(a); return fract(a.x/2.0 + a.y*a.y*0.75); }
float bay4(vec2 p){ return bay2(0.5*p)*0.25 + bay2(p); }
float bay8(vec2 p){ return bay4(0.5*p)*0.25 + bay2(p); }
vec2 mirr(vec2 uv){ return abs(fract(uv*0.5+0.5)*2.0-1.0); }
`;

const EFFECTS = [

/* ============ GEOMETRY (stage 1) ============ */

{id:'kaleido', name:'KALEIDO 🔮', stage:1, params:[
  {k:'sides',label:'sides',min:2,max:16,step:1,def:6,int:true,r:[3,10]},
  {k:'rot',label:'rotate',min:0,max:1,step:0.01,def:0,r:[0,1]},
  {k:'spin',label:'spin',min:0,max:4,step:1,def:0,int:true,r:[0,1]},
], frag:`
uniform float p_sides, p_rot, p_spin;
void main(){
  float aspect = u_res.x/u_res.y;
  vec2 c = v_uv-0.5;
  c.x *= aspect;
  float r = length(c);
  float a = atan(c.y,c.x) + p_rot*TAU + p_spin*TAU*u_t;
  float seg = TAU/max(2.0, floor(p_sides));
  a = mod(a, seg);
  a = abs(a - seg*0.5);
  vec2 uv = vec2(cos(a),sin(a))*r;
  uv.x /= aspect;
  gl_FragColor = texture2D(u_tex, mirr(uv+0.5));
}`},

{id:'mirror', name:'MIRROR 🪞', stage:1, params:[
  {k:'mode',label:'mode',type:'select',options:['left','right','top','bottom','quad'],def:0},
], frag:`
uniform float p_mode;
void main(){
  vec2 uv = v_uv;
  float m = floor(p_mode+0.5);
  if(m==0.0){ uv.x = uv.x<0.5 ? uv.x : 1.0-uv.x; }
  else if(m==1.0){ uv.x = uv.x>0.5 ? uv.x : 1.0-uv.x; }
  else if(m==2.0){ uv.y = uv.y>0.5 ? uv.y : 1.0-uv.y; }
  else if(m==3.0){ uv.y = uv.y<0.5 ? uv.y : 1.0-uv.y; }
  else { uv = vec2(uv.x<0.5?uv.x:1.0-uv.x, uv.y<0.5?uv.y:1.0-uv.y); }
  gl_FragColor = texture2D(u_tex, uv);
}`},

{id:'bulge', name:'BULGE / PINCH 🫧', stage:1, params:[
  {k:'str',label:'strength',min:-1,max:1,step:0.01,def:0.5,r:[-0.8,0.8]},
  {k:'rad',label:'radius',min:0.1,max:1.5,step:0.01,def:0.7,r:[0.4,1]},
  {k:'cx',label:'center x',min:0,max:1,step:0.01,def:0.5,r:[0.3,0.7]},
  {k:'cy',label:'center y',min:0,max:1,step:0.01,def:0.5,r:[0.3,0.7]},
], frag:`
uniform float p_str, p_rad, p_cx, p_cy;
void main(){
  float aspect = u_res.x/u_res.y;
  vec2 c = v_uv - vec2(p_cx,p_cy);
  c.x *= aspect;
  float d = length(c)/p_rad;
  float f = 1.0 - p_str*exp(-d*d*2.5);
  c *= f;
  c.x /= aspect;
  gl_FragColor = texture2D(u_tex, mirr(c + vec2(p_cx,p_cy)));
}`},

{id:'swirl', name:'SWIRL 🌪️', stage:1, params:[
  {k:'str',label:'strength',min:-1,max:1,step:0.01,def:0.5,r:[-0.9,0.9]},
  {k:'rad',label:'radius',min:0.1,max:1.5,step:0.01,def:0.8,r:[0.4,1.2]},
  {k:'spin',label:'spin',min:0,max:4,step:1,def:0,int:true,r:[0,1]},
], frag:`
uniform float p_str, p_rad, p_spin;
void main(){
  float aspect = u_res.x/u_res.y;
  vec2 c = v_uv - 0.5;
  c.x *= aspect;
  float d = length(c);
  float a = atan(c.y,c.x);
  a += p_str*6.0*(1.0 - smoothstep(0.0, p_rad, d)) + p_spin*TAU*u_t;
  c = vec2(cos(a),sin(a))*d;
  c.x /= aspect;
  gl_FragColor = texture2D(u_tex, mirr(c+0.5));
}`},

{id:'tile', name:'TILE 🧱', stage:1, params:[
  {k:'n',label:'repeat',min:1,max:8,step:0.1,def:2,r:[1.5,4]},
  {k:'mir',label:'mirror',type:'select',options:['wrap','mirror'],def:1},
], frag:`
uniform float p_n, p_mir;
void main(){
  vec2 uv = (v_uv-0.5)*p_n + 0.5;
  if(p_mir > 0.5){ uv = mirr(uv); } else { uv = fract(uv); }
  gl_FragColor = texture2D(u_tex, uv);
}`},

{id:'wave', name:'WAVE WARP 🌊', stage:1, params:[
  {k:'amp',label:'amount',min:0,max:0.2,step:0.002,def:0.03,r:[0.01,0.08]},
  {k:'freq',label:'freq',min:1,max:40,step:0.5,def:6,r:[2,14]},
  {k:'cyc',label:'cycles',min:0,max:8,step:1,def:1,int:true,r:[1,3]},
  {k:'vert',label:'vertical',min:0,max:1,step:0.01,def:0,r:[0,1]},
], frag:`
uniform float p_amp, p_freq, p_cyc, p_vert;
void main(){
  vec2 uv = v_uv;
  float ph = TAU*u_t*p_cyc;
  uv.x += sin(v_uv.y*p_freq*TAU + ph)*p_amp*(1.0-p_vert);
  uv.y += sin(v_uv.x*p_freq*TAU + ph)*p_amp*p_vert;
  gl_FragColor = texture2D(u_tex, fract(uv));
}`},

{id:'ripple', name:'RIPPLE SCAN 🫨', stage:1, params:[
  {k:'amp',label:'amount',min:0,max:0.3,step:0.002,def:0.06,r:[0.02,0.15]},
  {k:'rows',label:'rows',min:10,max:300,step:1,def:90,r:[30,200]},
  {k:'cyc',label:'cycles',min:1,max:8,step:1,def:1,int:true,r:[1,3]},
  {k:'ramp',label:'ramp',min:0,max:1,step:0.01,def:0.5,r:[0,1]},
], frag:`
uniform float p_amp, p_rows, p_cyc, p_ramp;
void main(){
  float row = floor(v_uv.y*p_rows)/p_rows;
  float k = mix(1.0, row, p_ramp);
  vec2 uv = v_uv;
  uv.x += sin(row*11.0 + TAU*u_t*p_cyc)*p_amp*k;
  gl_FragColor = texture2D(u_tex, mirr(uv));
}`},

{id:'wobble', name:'WOBBLE 🍮', stage:1, params:[
  {k:'amp',label:'amount',min:0,max:1,step:0.01,def:0.3,r:[0.1,0.6]},
  {k:'kx',label:'x cycles',min:0,max:8,step:1,def:1,int:true,r:[1,3]},
  {k:'ky',label:'y cycles',min:0,max:8,step:1,def:2,int:true,r:[1,3]},
], frag:`
uniform float p_amp, p_kx, p_ky;
void main(){
  vec2 uv = v_uv + vec2(sin(TAU*u_t*p_kx), cos(TAU*u_t*p_ky))*p_amp*0.02;
  gl_FragColor = texture2D(u_tex, mirr(uv));
}`},

/* ============ BREAK (stage 2) ============ */

{id:'pixelate', name:'PIXELATE 🟦', stage:2, params:[
  {k:'size',label:'cells',min:4,max:512,step:1,def:96,r:[24,160]},
], frag:`
uniform float p_size;
void main(){
  vec2 g = vec2(p_size, p_size*u_res.y/u_res.x);
  gl_FragColor = texture2D(u_tex, (floor(v_uv*g)+0.5)/g);
}`},

{id:'ledwall', name:'LED WALL 🏟️', stage:2, params:[
  {k:'cells',label:'cells',min:20,max:200,step:1,def:70,r:[36,120]},
  {k:'gap',label:'grout',min:0,max:0.6,step:0.01,def:0.25,r:[0.1,0.4]},
  {k:'glow',label:'glow',min:0,max:2,step:0.01,def:1.2,r:[0.8,1.8]},
], frag:`
uniform float p_cells, p_gap, p_glow;
void main(){
  vec2 g = vec2(p_cells, p_cells*u_res.y/u_res.x);
  vec2 cell = floor(v_uv*g);
  vec3 c = texture2D(u_tex, (cell+0.5)/g).rgb;
  vec2 f = fract(v_uv*g);
  float sub = floor(f.x*3.0);
  vec3 mask = vec3(step(sub,0.5), step(0.5,sub)*step(sub,1.5), step(1.5,sub));
  float inx = step(p_gap*0.33, fract(f.x*3.0)) * step(fract(f.x*3.0), 1.0-p_gap*0.33);
  float iny = step(p_gap*0.5, f.y) * step(f.y, 1.0-p_gap*0.5);
  vec3 col = c*mask*3.0*p_glow*inx*iny*0.5;
  gl_FragColor = vec4(col,1.0);
}`},

{id:'slices', name:'SLICES 🔪', stage:2, params:[
  {k:'bands',label:'bands',min:4,max:80,step:1,def:24,int:true,r:[10,48]},
  {k:'prob',label:'chance',min:0,max:1,step:0.01,def:0.3,r:[0.15,0.6]},
  {k:'mag',label:'shift',min:0,max:0.5,step:0.005,def:0.08,r:[0.03,0.2]},
  {k:'spd',label:'speed',min:1,max:30,step:1,def:8,int:true,r:[4,16]},
], frag:`
uniform float p_bands, p_prob, p_mag, p_spd;
void main(){
  float tt = floor(u_t*p_spd);
  float band = floor(v_uv.y * p_bands);
  vec2 uv = v_uv;
  if(h2(vec2(band, tt)) < p_prob){
    uv.x = fract(uv.x + (h2(vec2(band+9.0, tt))-0.5)*2.0*p_mag);
  }
  gl_FragColor = texture2D(u_tex, uv);
}`},

{id:'blocks', name:'GLITCH BLOCKS 🧊', stage:2, params:[
  {k:'cells',label:'cells',min:2,max:64,step:1,def:12,int:true,r:[6,28]},
  {k:'amt',label:'amount',min:0,max:1,step:0.01,def:0.35,r:[0.2,0.7]},
  {k:'split',label:'rgb split',min:0,max:1,step:0.01,def:0.5,r:[0.2,1]},
  {k:'spd',label:'speed',min:1,max:30,step:1,def:10,int:true,r:[6,18]},
  {k:'esc',label:'escalate',min:0,max:1,step:0.01,def:0,r:[0,0.8]},
], frag:`
uniform float p_cells, p_amt, p_split, p_spd, p_esc;
void main(){
  float tt = floor(u_t*p_spd);
  vec2 cells = vec2(p_cells, p_cells*u_res.y/u_res.x);
  vec2 id = floor(v_uv*cells);
  float amt = p_amt * mix(1.0, u_t, p_esc);
  float r = h2(vec2(dot(id, vec2(1.0, 57.0)), tt));
  vec2 uv = v_uv;
  vec3 col;
  if(r < amt){
    vec2 off = (vec2(h2(id+vec2(1.0,tt)), h2(id+vec2(2.0,tt)))-0.5)*0.6*amt;
    uv = fract(uv + off);
    float sp = p_split*0.08*amt;
    col.r = texture2D(u_tex, fract(uv+vec2(sp,0.0))).r;
    col.g = texture2D(u_tex, uv).g;
    col.b = texture2D(u_tex, fract(uv-vec2(sp,0.0))).b;
  } else {
    col = texture2D(u_tex, uv).rgb;
  }
  gl_FragColor = vec4(col,1.0);
}`},

{id:'mosh', name:'DATAMOSH 📼', stage:2, prev:true, params:[
  {k:'amt',label:'amount',min:0,max:1,step:0.01,def:0.4,r:[0.25,0.7]},
  {k:'cells',label:'cells',min:4,max:64,step:1,def:20,int:true,r:[8,40]},
  {k:'drift',label:'drift',min:0,max:1,step:0.01,def:0.4,r:[0.2,0.8]},
  {k:'spd',label:'speed',min:1,max:30,step:1,def:12,int:true,r:[6,20]},
  {k:'esc',label:'escalate',min:0,max:1,step:0.01,def:0,r:[0,0.9]},
], frag:`
uniform float p_amt, p_cells, p_drift, p_spd, p_esc;
void main(){
  float tt = floor(u_t*p_spd);
  vec2 cells = vec2(p_cells, p_cells*u_res.y/u_res.x);
  vec2 id = floor(v_uv*cells);
  float amt = p_amt * mix(1.0, u_t, p_esc);
  float r = h2(vec2(dot(id,vec2(1.0,73.0)), tt));
  if(r < amt){
    vec2 off = (vec2(h2(id+vec2(31.0,tt)), h2(id+vec2(57.0,tt)))-0.5)*p_drift*0.25;
    gl_FragColor = texture2D(u_prev, fract(v_uv+off));
  } else {
    gl_FragColor = texture2D(u_tex, v_uv);
  }
}`},

{id:'smear', name:'MELT 🫠', stage:2, params:[
  {k:'th',label:'threshold',min:0,max:1,step:0.01,def:0.45,r:[0.3,0.6]},
  {k:'len',label:'length',min:0,max:0.6,step:0.005,def:0.25,r:[0.1,0.45]},
  {k:'ang',label:'angle',min:0,max:1,step:0.01,def:0.25,r:[0,1]},
], frag:`
uniform float p_th, p_len, p_ang;
void main(){
  float a = p_ang*TAU;
  vec2 dir = vec2(cos(a),sin(a));
  vec3 col = texture2D(u_tex, v_uv).rgb;
  vec3 acc = col;
  for(int i=1;i<=24;i++){
    float fi = float(i)/24.0;
    vec3 s = texture2D(u_tex, clamp(v_uv - dir*fi*p_len, 0.0, 1.0)).rgb;
    float m = smoothstep(p_th, p_th+0.12, lum(s)) * (1.0-fi*0.85);
    acc = max(acc, s*m);
  }
  gl_FragColor = vec4(acc,1.0);
}`},

{id:'jpeg', name:'JPEG CRUSH 🗜️', stage:2, params:[
  {k:'crush',label:'crush',min:0,max:1,step:0.01,def:0.6,r:[0.4,0.9]},
  {k:'block',label:'block px',min:1,max:4,step:1,def:1,int:true,r:[1,2]},
], frag:`
uniform float p_crush, p_block;
void main(){
  vec2 bs = vec2(8.0*p_block)/u_res;
  vec2 buv = (floor(v_uv/bs)+0.5)*bs;
  vec3 c = texture2D(u_tex, v_uv).rgb;
  vec3 center = texture2D(u_tex, buv).rgb;
  float y = lum(c);
  float lev = mix(40.0, 4.0, p_crush);
  y = floor(y*lev + 0.5)/lev;
  vec3 chroma = center - lum(center);
  vec3 outc = clamp(vec3(y) + chroma*mix(1.0, 1.5, p_crush), 0.0, 1.0);
  float tt = floor(u_t*10.0);
  vec2 id = floor(v_uv/bs);
  float r = h2(vec2(dot(id,vec2(1.0,113.0)), tt));
  if(r > 1.0 - p_crush*0.06){
    outc = texture2D(u_tex, buv + vec2(bs.x*(h2(id+tt)-0.5)*6.0, 0.0)).rgb;
  }
  gl_FragColor = vec4(outc,1.0);
}`},

{id:'crystals', name:'CRYSTALS 💎', stage:2, params:[
  {k:'cells',label:'cells',min:6,max:120,step:1,def:36,r:[14,70]},
  {k:'jit',label:'jitter',min:0,max:1,step:0.01,def:0.8,r:[0.5,1]},
  {k:'edge',label:'edges',min:0,max:1,step:0.01,def:0.2,r:[0,0.6]},
], frag:`
uniform float p_cells, p_jit, p_edge;
void main(){
  vec2 g = vec2(p_cells, p_cells*u_res.y/u_res.x);
  vec2 p = v_uv*g;
  vec2 id = floor(p);
  float bd = 9.0;
  vec2 bp = vec2(0.0);
  for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){
    vec2 n = id + vec2(float(x),float(y));
    vec2 fp = n + 0.5 + (vec2(h2(n), h2(n+7.0))-0.5)*p_jit;
    float d = length(p-fp);
    if(d<bd){ bd=d; bp=fp; }
  }
  vec3 c = texture2D(u_tex, clamp(bp/g, 0.0, 1.0)).rgb;
  c *= 1.0 - p_edge*smoothstep(0.35, 0.5, bd);
  gl_FragColor = vec4(c,1.0);
}`},

{id:'interlace', name:'INTERLACE 📺', stage:2, params:[
  {k:'shift',label:'shift',min:0,max:0.2,step:0.002,def:0.03,r:[0.01,0.08]},
  {k:'rowh',label:'row px',min:1,max:16,step:1,def:2,int:true,r:[1,6]},
  {k:'inv',label:'invert odd',type:'select',options:['off','on'],def:0},
], frag:`
uniform float p_shift, p_rowh, p_inv;
void main(){
  float row = floor(v_uv.y*u_res.y/p_rowh);
  float odd = mod(row, 2.0);
  vec2 uv = v_uv;
  uv.x += (odd*2.0-1.0)*p_shift*(0.5+0.5*sin(TAU*u_t));
  vec3 c = texture2D(u_tex, fract(uv)).rgb;
  if(p_inv>0.5 && odd>0.5) c = 1.0-c;
  gl_FragColor = vec4(c,1.0);
}`},

/* ============ TEXTURE (stage 3) ============ */

{id:'rgbshift', name:'RGB SHIFT 🔴🟢🔵', stage:3, params:[
  {k:'amt',label:'amount',min:0,max:0.05,step:0.0005,def:0.008,r:[0.003,0.02]},
  {k:'ang',label:'angle',min:0,max:1,step:0.01,def:0,r:[0,1]},
  {k:'pulse',label:'pulse',min:0,max:1,step:0.01,def:0.3,r:[0.1,0.9]},
], frag:`
uniform float p_amt, p_ang, p_pulse;
void main(){
  float a = p_ang*TAU;
  float amt = p_amt*(1.0 + p_pulse*sin(TAU*u_t));
  vec2 d = vec2(cos(a),sin(a))*amt;
  gl_FragColor = vec4(
    texture2D(u_tex, v_uv+d).r,
    texture2D(u_tex, v_uv).g,
    texture2D(u_tex, v_uv-d).b, 1.0);
}`},

{id:'badtv', name:'BAD TV 📡', stage:3, params:[
  {k:'warp',label:'warp',min:0,max:1,step:0.01,def:0.25,r:[0.1,0.6]},
  {k:'jit',label:'jitter',min:0,max:1,step:0.01,def:0.3,r:[0.1,0.7]},
  {k:'band',label:'roll band',min:0,max:1,step:0.01,def:0.5,r:[0.2,0.9]},
  {k:'roll',label:'roll spd',min:0,max:6,step:1,def:1,int:true,r:[1,2]},
], frag:`
uniform float p_warp, p_jit, p_band, p_roll;
void main(){
  vec2 uv = v_uv;
  float ph = TAU*u_t*max(p_roll,1.0);
  uv.x += sin(v_uv.y*3.0*TAU + ph)*p_warp*0.02;
  float row = floor(v_uv.y*u_res.y*0.5);
  float tt = floor(u_t*24.0);
  uv.x += (h2(vec2(row, tt))-0.5)*p_jit*0.02*step(0.7, h2(vec2(row+3.0, tt)));
  vec3 col = texture2D(u_tex, fract(uv)).rgb;
  float rollpos = fract(u_t*p_roll);
  float d = abs(v_uv.y - rollpos);
  d = min(d, 1.0-d);
  col *= 1.0 + p_band*0.6*exp(-d*d*220.0);
  gl_FragColor = vec4(col,1.0);
}`},

{id:'vhs', name:'VHS 📼', stage:3, params:[
  {k:'bleed',label:'bleed',min:0,max:1,step:0.01,def:0.5,r:[0.3,0.9]},
  {k:'track',label:'tracking',min:0,max:1,step:0.01,def:0.4,r:[0.2,0.8]},
  {k:'grain',label:'grain',min:0,max:1,step:0.01,def:0.35,r:[0.15,0.6]},
], frag:`
uniform float p_bleed, p_track, p_grain;
void main(){
  vec2 uv = v_uv;
  float tt = floor(u_t*18.0);
  float band = p_track*0.14;
  if(uv.y < band){
    float k = 1.0 - uv.y/max(band,0.0001);
    uv.x += (h2(vec2(floor(uv.y*u_res.y), tt))-0.5)*0.25*k*p_track;
  }
  vec3 c = texture2D(u_tex, fract(uv)).rgb;
  float off = p_bleed*4.0/u_res.x;
  vec3 cl = texture2D(u_tex, fract(uv-vec2(off,0.0))).rgb;
  vec3 cr = texture2D(u_tex, fract(uv+vec2(off,0.0))).rgb;
  float y = lum(c);
  vec3 chroma = (cl+cr)*0.5;
  chroma -= lum(chroma);
  vec3 col = clamp(vec3(y) + chroma*1.15, 0.0, 1.0);
  col = mix(col, vec3(lum(col)), 0.18*p_bleed);
  float row = floor(v_uv.y*u_res.y);
  if(h2(vec2(row, tt+7.0)) > 1.0 - 0.004*p_track){
    float seg = step(h2(vec2(tt, row)), fract(v_uv.x*3.0+h2(vec2(row,1.0))));
    col = mix(col, vec3(1.0), seg*0.8);
  }
  float n = h2(v_uv*u_res + tt);
  col += (n-0.5)*p_grain*0.25;
  gl_FragColor = vec4(col,1.0);
}`},

{id:'noise', name:'NOISE 🌫️', stage:3, params:[
  {k:'amt',label:'amount',min:0,max:1,step:0.01,def:0.25,r:[0.1,0.5]},
  {k:'size',label:'size',min:1,max:8,step:1,def:1,int:true,r:[1,3]},
  {k:'col',label:'color',min:0,max:1,step:0.01,def:0.3,r:[0,1]},
  {k:'spd',label:'speed',min:1,max:30,step:1,def:12,int:true,r:[8,24]},
], frag:`
uniform float p_amt, p_size, p_col, p_spd;
void main(){
  vec3 c = texture2D(u_tex, v_uv).rgb;
  float tt = floor(u_t*p_spd);
  vec2 g = floor(v_uv*u_res/p_size);
  float n = h2(g+tt);
  vec3 nc = vec3(h2(g+tt+11.0), h2(g+tt+23.0), h2(g+tt+37.0));
  vec3 grain = mix(vec3(n), nc, p_col);
  c += (grain-0.5)*p_amt;
  gl_FragColor = vec4(clamp(c,0.0,1.0),1.0);
}`},

{id:'ghost', name:'GHOST TRAILS 👻', stage:3, prev:true, params:[
  {k:'amt',label:'amount',min:0,max:0.97,step:0.01,def:0.55,r:[0.35,0.85]},
  {k:'zoom',label:'zoom',min:-1,max:1,step:0.01,def:0.1,r:[-0.5,0.6]},
  {k:'dx',label:'drift x',min:-1,max:1,step:0.01,def:0,r:[-0.5,0.5]},
  {k:'dy',label:'drift y',min:-1,max:1,step:0.01,def:0,r:[-0.5,0.5]},
], frag:`
uniform float p_amt, p_zoom, p_dx, p_dy;
void main(){
  vec3 cur = texture2D(u_tex, v_uv).rgb;
  vec2 puv = (v_uv-0.5)*(1.0 - p_zoom*0.03) + 0.5 + vec2(p_dx,p_dy)*0.01;
  vec3 pr = texture2D(u_prev, clamp(puv,0.0,1.0)).rgb;
  vec3 col = max(cur, pr*p_amt);
  gl_FragColor = vec4(mix(cur, col, 0.95),1.0);
}`},

{id:'glow', name:'GLOW ✨', stage:3, params:[
  {k:'th',label:'threshold',min:0,max:1,step:0.01,def:0.55,r:[0.4,0.7]},
  {k:'rad',label:'radius',min:1,max:12,step:0.5,def:4,r:[2,8]},
  {k:'amt',label:'intensity',min:0,max:2,step:0.01,def:0.8,r:[0.4,1.4]},
], frag:`
uniform float p_th, p_rad, p_amt;
void main(){
  vec2 px = p_rad/u_res;
  vec3 c = texture2D(u_tex, v_uv).rgb;
  vec3 acc = vec3(0.0);
  float wsum = 0.0;
  for(int y=-2;y<=2;y++) for(int x=-2;x<=2;x++){
    float w = 1.0/(1.0+float(x*x+y*y));
    vec3 s = texture2D(u_tex, clamp(v_uv+px*vec2(float(x),float(y)),0.0,1.0)).rgb;
    acc += max(s-p_th, 0.0)*w;
    wsum += w;
  }
  gl_FragColor = vec4(c + acc/wsum*p_amt*2.5, 1.0);
}`},

{id:'blur', name:'BLUR 🌁', stage:3, params:[
  {k:'rad',label:'radius',min:0,max:16,step:0.5,def:4,r:[2,10]},
], frag:`
uniform float p_rad;
void main(){
  vec2 px = p_rad/u_res;
  vec3 acc = vec3(0.0);
  float wsum = 0.0;
  for(int y=-2;y<=2;y++) for(int x=-2;x<=2;x++){
    float w = exp(-float(x*x+y*y)*0.35);
    acc += texture2D(u_tex, clamp(v_uv+px*vec2(float(x),float(y))*0.5,0.0,1.0)).rgb*w;
    wsum += w;
  }
  gl_FragColor = vec4(acc/wsum, 1.0);
}`},

{id:'sharpen', name:'SHARPEN 🔪✨', stage:3, params:[
  {k:'amt',label:'amount',min:0,max:3,step:0.05,def:1,r:[0.5,2]},
], frag:`
uniform float p_amt;
void main(){
  vec2 px = 1.0/u_res;
  vec3 c = texture2D(u_tex, v_uv).rgb;
  vec3 n = texture2D(u_tex, v_uv+vec2(0.0,px.y)).rgb
         + texture2D(u_tex, v_uv-vec2(0.0,px.y)).rgb
         + texture2D(u_tex, v_uv+vec2(px.x,0.0)).rgb
         + texture2D(u_tex, v_uv-vec2(px.x,0.0)).rgb;
  gl_FragColor = vec4(clamp(c*(1.0+4.0*p_amt*0.25) - n*p_amt*0.25, 0.0, 1.0), 1.0);
}`},

{id:'oil', name:'OIL PAINT 🎨', stage:3, params:[
  {k:'rad',label:'radius',min:1,max:8,step:0.5,def:3,r:[2,6]},
], frag:`
uniform float p_rad;
void main(){
  vec2 px = p_rad/u_res;
  vec3 mean[4]; vec3 sqr[4];
  for(int k=0;k<4;k++){ mean[k]=vec3(0.0); sqr[k]=vec3(0.0); }
  for(int j=0;j<=2;j++) for(int i=0;i<=2;i++){
    vec3 s;
    s = texture2D(u_tex, clamp(v_uv+px*vec2(float(-i),float(-j)),0.0,1.0)).rgb; mean[0]+=s; sqr[0]+=s*s;
    s = texture2D(u_tex, clamp(v_uv+px*vec2(float( i),float(-j)),0.0,1.0)).rgb; mean[1]+=s; sqr[1]+=s*s;
    s = texture2D(u_tex, clamp(v_uv+px*vec2(float(-i),float( j)),0.0,1.0)).rgb; mean[2]+=s; sqr[2]+=s*s;
    s = texture2D(u_tex, clamp(v_uv+px*vec2(float( i),float( j)),0.0,1.0)).rgb; mean[3]+=s; sqr[3]+=s*s;
  }
  float bestVar = 1e9;
  vec3 best = vec3(0.0);
  for(int k=0;k<4;k++){
    vec3 m = mean[k]/9.0;
    vec3 v = sqr[k]/9.0 - m*m;
    float tv = v.r+v.g+v.b;
    if(tv < bestVar){ bestVar = tv; best = m; }
  }
  gl_FragColor = vec4(best,1.0);
}`},

/* ============ COLOR (stage 4) ============ */

{id:'adjust', name:'HUE / LEVELS 🎚️', stage:4, params:[
  {k:'hue',label:'hue',min:0,max:1,step:0.01,def:0,r:[0,1]},
  {k:'spin',label:'hue spin',min:0,max:4,step:1,def:0,int:true,r:[0,1]},
  {k:'sat',label:'sat',min:0,max:3,step:0.01,def:1,r:[0.5,2]},
  {k:'bri',label:'bright',min:0,max:2,step:0.01,def:1,r:[0.8,1.3]},
  {k:'con',label:'contrast',min:0,max:3,step:0.01,def:1,r:[0.9,1.8]},
], frag:`
uniform float p_hue, p_spin, p_sat, p_bri, p_con;
void main(){
  vec3 c = texture2D(u_tex, v_uv).rgb;
  c = hueShift(c, p_hue*TAU + p_spin*TAU*u_t);
  c = mix(vec3(lum(c)), c, p_sat);
  c *= p_bri;
  c = (c-0.5)*p_con + 0.5;
  gl_FragColor = vec4(clamp(c,0.0,1.0),1.0);
}`},

{id:'dither', name:'DITHER LAB 🧮', stage:4, params:[
  {k:'algo',label:'algorithm',type:'select',options:['bayer 2x2','bayer 4x4','bayer 8x8','ign noise','white noise','halftone dot','diag lines','checker'],def:1},
  {k:'pal',label:'palette',type:'select',options:['gray levels','1 bit b/w','game boy','8 bit rgb','blossom','print cmy','original'],def:6},
  {k:'levels',label:'levels',min:2,max:8,step:1,def:3,int:true,r:[2,4]},
  {k:'scale',label:'scale',min:1,max:10,step:1,def:2,int:true,r:[1,5]},
], frag:`
uniform float p_algo, p_pal, p_levels, p_scale;
float thresh(vec2 fc){
  float a = floor(p_algo+0.5);
  vec2 p = fc/p_scale;
  if(a==0.0) return bay2(p);
  if(a==1.0) return bay4(p);
  if(a==2.0) return bay8(p);
  if(a==3.0) return fract(52.9829189*fract(0.06711056*floor(p.x)+0.00583715*floor(p.y)));
  if(a==4.0) return h2(floor(p));
  if(a==5.0){ vec2 g = fract(p/4.0)-0.5; return clamp(length(g)*2.2, 0.0, 1.0); }
  if(a==6.0) return fract((floor(p.x)+floor(p.y))/4.0);
  return mod(floor(p.x)+floor(p.y), 2.0)*0.5+0.25;
}
vec3 quant(vec3 c, float th){
  float L = max(p_levels-1.0, 1.0);
  return floor(c*L + th)/L;
}
void main(){
  vec3 c = texture2D(u_tex, v_uv).rgb;
  float th = thresh(gl_FragCoord.xy);
  float pal = floor(p_pal+0.5);
  float l = lum(c);
  vec3 outc;
  if(pal==0.0){ outc = vec3(floor(l*max(p_levels-1.0,1.0)+th)/max(p_levels-1.0,1.0)); }
  else if(pal==1.0){ outc = vec3(step(th, l)); }
  else if(pal==2.0){
    float q = floor(l*3.0+th)/3.0;
    vec3 g0=vec3(0.06,0.22,0.06), g1=vec3(0.19,0.41,0.31), g2=vec3(0.53,0.75,0.42), g3=vec3(0.88,0.97,0.82);
    outc = q<0.17?g0 : (q<0.5?g1 : (q<0.84?g2:g3));
  }
  else if(pal==3.0){ outc = vec3(step(th,c.r), step(th,c.g), step(th,c.b)); }
  else if(pal==4.0){
    float q = floor(l*3.0+th)/3.0;
    vec3 b0=vec3(0.051,0.051,0.051), b1=vec3(0.161,0.384,1.0), b2=vec3(1.0,0.18,0.388), b3=vec3(0.941,0.957,0.973);
    outc = q<0.17?b0 : (q<0.5?b1 : (q<0.84?b2:b3));
  }
  else if(pal==5.0){ vec3 cmy = 1.0-c; cmy = vec3(step(th,cmy.r),step(th,cmy.g),step(th,cmy.b)); outc = 1.0-cmy; }
  else { outc = quant(c, th); }
  gl_FragColor = vec4(outc,1.0);
}`},

{id:'posterize', name:'POSTERIZE 🖼️', stage:4, params:[
  {k:'levels',label:'levels',min:2,max:16,step:1,def:5,int:true,r:[3,8]},
], frag:`
uniform float p_levels;
void main(){
  vec3 c = texture2D(u_tex, v_uv).rgb;
  float L = p_levels - 1.0;
  gl_FragColor = vec4(floor(c*L + 0.5)/L, 1.0);
}`},

{id:'halftone', name:'HALFTONE 🗞️', stage:4, params:[
  {k:'scale',label:'dots',min:20,max:200,step:1,def:70,r:[40,120]},
  {k:'ang',label:'angle',min:0,max:1,step:0.01,def:0.125,r:[0,1]},
  {k:'ink',label:'keep color',min:0,max:1,step:0.01,def:0.8,r:[0,1]},
  {k:'mix',label:'mix',min:0,max:1,step:0.01,def:1,r:[0.7,1]},
], frag:`
uniform float p_scale, p_ang, p_ink, p_mix;
void main(){
  float a = p_ang*TAU*0.5;
  float ca = cos(a), sa = sin(a);
  mat2 R = mat2(ca,-sa,sa,ca);
  mat2 Ri = mat2(ca,sa,-sa,ca);
  float aspect = u_res.y/u_res.x;
  vec2 p = R*(vec2(v_uv.x, v_uv.y*aspect));
  vec2 cell = floor(p*p_scale);
  vec2 centerP = (cell+0.5)/p_scale;
  vec2 centerUV = Ri*centerP;
  centerUV.y /= aspect;
  vec3 sc = texture2D(u_tex, clamp(centerUV,0.0,1.0)).rgb;
  float l = lum(sc);
  vec2 g = fract(p*p_scale)-0.5;
  float d = length(g);
  float rad = sqrt(1.0-l)*0.68;
  float dotm = 1.0 - smoothstep(rad-0.04, rad+0.04, d);
  vec3 ink = mix(vec3(0.02), sc*0.9, p_ink);
  vec3 ht = mix(vec3(0.96), ink, dotm);
  vec3 orig = texture2D(u_tex, v_uv).rgb;
  gl_FragColor = vec4(mix(orig, ht, p_mix),1.0);
}`},

{id:'edges', name:'EDGES ⚡', stage:4, params:[
  {k:'str',label:'strength',min:0,max:1,step:0.01,def:1,r:[0.5,1]},
  {k:'mix',label:'mix',min:0,max:1,step:0.01,def:1,r:[0.5,1]},
  {k:'tint',label:'tint',type:'color',def:'#00E5FF'},
], frag:`
uniform float p_str, p_mix;
uniform vec3 p_tint;
void main(){
  vec2 px = 1.0/u_res;
  float tl=lum(texture2D(u_tex,v_uv+px*vec2(-1,1)).rgb), t=lum(texture2D(u_tex,v_uv+px*vec2(0,1)).rgb), tr=lum(texture2D(u_tex,v_uv+px*vec2(1,1)).rgb);
  float l =lum(texture2D(u_tex,v_uv+px*vec2(-1,0)).rgb),                                              r =lum(texture2D(u_tex,v_uv+px*vec2(1,0)).rgb);
  float bl=lum(texture2D(u_tex,v_uv+px*vec2(-1,-1)).rgb),b=lum(texture2D(u_tex,v_uv+px*vec2(0,-1)).rgb),br=lum(texture2D(u_tex,v_uv+px*vec2(1,-1)).rgb);
  float gx = -tl-2.0*l-bl+tr+2.0*r+br;
  float gy = -tl-2.0*t-tr+bl+2.0*b+br;
  float mag = clamp(length(vec2(gx,gy))*2.0*p_str, 0.0, 1.0);
  vec3 orig = texture2D(u_tex, v_uv).rgb;
  gl_FragColor = vec4(mix(orig, p_tint*mag, p_mix),1.0);
}`},

{id:'duotone', name:'DUOTONE 🌗', stage:4, params:[
  {k:'a',label:'dark',type:'color',def:'#0D0D0D'},
  {k:'b',label:'light',type:'color',def:'#2962FF'},
  {k:'mix',label:'mix',min:0,max:1,step:0.01,def:1,r:[0.6,1]},
], frag:`
uniform vec3 p_a, p_b;
uniform float p_mix;
void main(){
  vec3 c = texture2D(u_tex, v_uv).rgb;
  vec3 duo = mix(p_a, p_b, smoothstep(0.05, 0.95, lum(c)));
  gl_FragColor = vec4(mix(c, duo, p_mix),1.0);
}`},

{id:'heatmap', name:'HEATMAP 🌡️', stage:4, params:[
  {k:'pal',label:'palette',type:'select',options:['thermal','night vision','rainbow','ice','blossom'],def:0},
  {k:'mix',label:'mix',min:0,max:1,step:0.01,def:1,r:[0.7,1]},
], frag:`
uniform float p_pal, p_mix;
vec3 grade(float l){
  float p = floor(p_pal+0.5);
  if(p==0.0){
    return l<0.25 ? mix(vec3(0.0,0.0,0.1), vec3(0.2,0.0,0.6), l*4.0)
         : l<0.5  ? mix(vec3(0.2,0.0,0.6), vec3(0.9,0.1,0.4), (l-0.25)*4.0)
         : l<0.75 ? mix(vec3(0.9,0.1,0.4), vec3(1.0,0.7,0.1), (l-0.5)*4.0)
                  : mix(vec3(1.0,0.7,0.1), vec3(1.0,1.0,0.9), (l-0.75)*4.0);
  }
  if(p==1.0){ return vec3(0.05, 0.2+l*0.8, 0.08)*mix(0.6,1.4,l); }
  if(p==2.0){ return hueShift(vec3(1.0,0.15,0.15), l*TAU*0.83)*mix(0.4,1.1,l); }
  if(p==3.0){
    return l<0.5 ? mix(vec3(0.02,0.02,0.08), vec3(0.16,0.38,1.0), l*2.0)
                 : mix(vec3(0.16,0.38,1.0), vec3(0.9,0.98,1.0), (l-0.5)*2.0);
  }
  return l<0.33 ? mix(vec3(0.051), vec3(0.161,0.384,1.0), l*3.0)
       : l<0.66 ? mix(vec3(0.161,0.384,1.0), vec3(1.0,0.18,0.388), (l-0.33)*3.0)
                : mix(vec3(1.0,0.18,0.388), vec3(0.941,0.957,0.973), (l-0.66)*3.0);
}
void main(){
  vec3 c = texture2D(u_tex, v_uv).rgb;
  gl_FragColor = vec4(mix(c, grade(lum(c)), p_mix),1.0);
}`},

{id:'prism', name:'PRISM 🌈', stage:4, params:[
  {k:'spread',label:'spread',min:0,max:2,step:0.01,def:0.6,r:[0.3,1.2]},
  {k:'axis',label:'axis',min:0,max:1,step:0.01,def:0,r:[0,1]},
  {k:'cyc',label:'cycles',min:0,max:4,step:1,def:1,int:true,r:[0,2]},
], frag:`
uniform float p_spread, p_axis, p_cyc;
void main(){
  vec3 c = texture2D(u_tex, v_uv).rgb;
  float pos = mix(v_uv.x, v_uv.y, p_axis);
  gl_FragColor = vec4(hueShift(c, pos*TAU*p_spread + p_cyc*TAU*u_t),1.0);
}`},

{id:'invert', name:'INVERT 🔃', stage:4, params:[
  {k:'amt',label:'amount',min:0,max:1,step:0.01,def:1,r:[0.6,1]},
], frag:`
uniform float p_amt;
void main(){
  vec3 c = texture2D(u_tex, v_uv).rgb;
  gl_FragColor = vec4(mix(c, 1.0-c, p_amt),1.0);
}`},

{id:'solarize', name:'SOLARIZE ☀️', stage:4, params:[
  {k:'th',label:'threshold',min:0,max:1,step:0.01,def:0.5,r:[0.3,0.7]},
  {k:'amt',label:'amount',min:0,max:1,step:0.01,def:1,r:[0.6,1]},
], frag:`
uniform float p_th, p_amt;
void main(){
  vec3 c = texture2D(u_tex, v_uv).rgb;
  vec3 s = mix(c, 1.0-c, step(p_th, lum(c)));
  gl_FragColor = vec4(mix(c, s, p_amt),1.0);
}`},

{id:'deepfry', name:'DEEP FRY 🍟', stage:4, params:[
  {k:'amt',label:'fry level',min:0,max:1,step:0.01,def:0.7,r:[0.5,1]},
], frag:`
uniform float p_amt;
void main(){
  vec2 px = 1.0/u_res;
  vec3 c = texture2D(u_tex, v_uv).rgb;
  vec3 n = texture2D(u_tex, v_uv+vec2(0.0,px.y)).rgb
         + texture2D(u_tex, v_uv-vec2(0.0,px.y)).rgb
         + texture2D(u_tex, v_uv+vec2(px.x,0.0)).rgb
         + texture2D(u_tex, v_uv-vec2(px.x,0.0)).rgb;
  c = clamp(c*(1.0+p_amt*1.2) - n*p_amt*0.3, 0.0, 1.0);
  c = mix(vec3(lum(c)), c, 1.0+p_amt*2.2);
  c = (c-0.5)*(1.0+p_amt*1.6)+0.5;
  float lev = mix(24.0, 5.0, p_amt);
  c = floor(c*lev+0.5)/lev;
  c.r = clamp(c.r*(1.0+p_amt*0.25), 0.0, 1.0);
  float nz = h2(floor(v_uv*u_res/2.0)+floor(u_t*8.0));
  c += (nz-0.5)*p_amt*0.15;
  gl_FragColor = vec4(clamp(c,0.0,1.0),1.0);
}`},

{id:'strobe', name:'STROBE 🔦', stage:4, params:[
  {k:'rate',label:'rate',min:1,max:16,step:1,def:4,int:true,r:[2,8]},
  {k:'duty',label:'duty',min:0,max:1,step:0.01,def:0.15,r:[0.05,0.4]},
  {k:'mode',label:'mode',type:'select',options:['invert','white','black','hue snap'],def:0},
], frag:`
uniform float p_rate, p_duty, p_mode;
void main(){
  vec3 c = texture2D(u_tex, v_uv).rgb;
  float on = step(fract(u_t*p_rate), p_duty);
  float m = floor(p_mode+0.5);
  vec3 f = c;
  if(m==0.0) f = 1.0-c;
  else if(m==1.0) f = vec3(1.0);
  else if(m==2.0) f = vec3(0.0);
  else f = hueShift(c, floor(u_t*p_rate)*2.4);
  gl_FragColor = vec4(mix(c, f, on),1.0);
}`},

/* ============ FINISH (stage 5) ============ */

{id:'scan', name:'SCANLINES 📉', stage:5, params:[
  {k:'count',label:'lines',min:50,max:600,step:2,def:220,r:[120,400]},
  {k:'amt',label:'amount',min:0,max:1,step:0.01,def:0.35,r:[0.2,0.6]},
  {k:'spd',label:'drift',min:0,max:10,step:1,def:1,int:true,r:[0,3]},
], frag:`
uniform float p_count, p_amt, p_spd;
void main(){
  vec3 col = texture2D(u_tex, v_uv).rgb;
  float s = sin(v_uv.y*p_count*TAU + TAU*u_t*p_spd);
  col *= 1.0 - p_amt*(0.5+0.5*s)*0.9;
  gl_FragColor = vec4(col,1.0);
}`},

{id:'crt', name:'CRT 🖥️', stage:5, params:[
  {k:'curve',label:'curve',min:0,max:1,step:0.01,def:0.4,r:[0.2,0.7]},
  {k:'mask',label:'phosphor',min:0,max:1,step:0.01,def:0.4,r:[0.2,0.7]},
  {k:'vig',label:'shade',min:0,max:1,step:0.01,def:0.5,r:[0.3,0.8]},
], frag:`
uniform float p_curve, p_mask, p_vig;
void main(){
  vec2 cc = v_uv*2.0-1.0;
  cc *= 1.0 + p_curve*0.22*dot(cc,cc);
  vec2 uv = cc*0.5+0.5;
  if(uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0){ gl_FragColor=vec4(0.0,0.0,0.0,1.0); return; }
  vec3 col = texture2D(u_tex, uv).rgb;
  float m = mod(gl_FragCoord.x, 3.0);
  vec3 ph = vec3(step(m,1.0), step(1.0,m)*step(m,2.0), step(2.0,m));
  col *= mix(vec3(1.0), ph*2.2, p_mask*0.45);
  col *= 1.0 - p_vig*0.55*dot(cc,cc);
  gl_FragColor = vec4(col,1.0);
}`},

{id:'vignette', name:'VIGNETTE 🕳️', stage:5, params:[
  {k:'amt',label:'amount',min:0,max:1,step:0.01,def:0.5,r:[0.3,0.8]},
  {k:'round',label:'size',min:0,max:1,step:0.01,def:0.5,r:[0.3,0.7]},
  {k:'soft',label:'soft',min:0.05,max:1,step:0.01,def:0.5,r:[0.3,0.8]},
], frag:`
uniform float p_amt, p_round, p_soft;
void main(){
  vec3 c = texture2D(u_tex, v_uv).rgb;
  vec2 cc = v_uv*2.0-1.0;
  float d = length(cc)*0.7071;
  float v = smoothstep(p_round, p_round+p_soft, d);
  gl_FragColor = vec4(c*(1.0 - v*p_amt),1.0);
}`},

/* ============ OVERLAYS (JS drawn, stage 5) ============ */

{id:'overlay', name:'CODE OVERLAY 👾', stage:5, ovDraw:'code', params:[
  {k:'dens',label:'density',min:0,max:1,step:0.01,def:0.4,r:[0.2,0.7]},
  {k:'size',label:'size',min:0,max:1,step:0.01,def:0.35,r:[0.2,0.6]},
  {k:'spd',label:'speed',min:1,max:30,step:1,def:8,int:true,r:[4,14]},
  {k:'col',label:'color',type:'select',options:['cyan','white','pink','blue','acid'],def:0},
  {k:'amt',label:'amount',min:0,max:1,step:0.01,def:0.8,r:[0.5,1]},
], frag:`
uniform float p_amt;
void main(){
  vec3 c = texture2D(u_tex, v_uv).rgb;
  vec4 o = texture2D(u_ov, v_uv);
  vec3 scr = 1.0-(1.0-c)*(1.0-o.rgb);
  gl_FragColor = vec4(mix(c, scr, o.a*p_amt),1.0);
}`},

{id:'ascii', name:'ASCII 🔤', stage:5, ovDraw:'ascii', params:[
  {k:'cells',label:'columns',min:24,max:160,step:2,def:80,r:[40,120]},
  {k:'col',label:'color',type:'select',options:['original','cyan','blue','white','mint'],def:0},
  {k:'bg',label:'background',min:0,max:1,step:0.01,def:1,r:[0.7,1]},
  {k:'amt',label:'amount',min:0,max:1,step:0.01,def:1,r:[0.8,1]},
], frag:`
uniform float p_amt;
void main(){
  vec3 c = texture2D(u_tex, v_uv).rgb;
  vec4 o = texture2D(u_ov, v_uv);
  gl_FragColor = vec4(mix(c, o.rgb, o.a*p_amt),1.0);
}`},

{id:'emojimosaic', name:'EMOJI MOSAIC 🧩', stage:5, ovDraw:'emojimosaic', params:[
  {k:'cells',label:'columns',min:10,max:80,step:1,def:36,r:[18,56]},
  {k:'set',label:'set',type:'select',options:['nyc','blossom','eyes','faces','hearts','mix'],def:0},
  {k:'bg',label:'background',min:0,max:1,step:0.01,def:1,r:[0.7,1]},
  {k:'amt',label:'amount',min:0,max:1,step:0.01,def:1,r:[0.8,1]},
], frag:`
uniform float p_amt;
void main(){
  vec3 c = texture2D(u_tex, v_uv).rgb;
  vec4 o = texture2D(u_ov, v_uv);
  gl_FragColor = vec4(mix(c, o.rgb, o.a*p_amt),1.0);
}`},

{id:'emojirain', name:'EMOJI RAIN 🌧️', stage:5, ovDraw:'emojirain', live:true, params:[
  {k:'set',label:'set',type:'select',options:['nyc','blossom','eyes','faces','hearts','mix'],def:0},
  {k:'dens',label:'density',min:0,max:1,step:0.01,def:0.4,r:[0.2,0.7]},
  {k:'size',label:'size',min:0,max:1,step:0.01,def:0.4,r:[0.2,0.7]},
  {k:'fall',label:'fall cycles',min:1,max:4,step:1,def:1,int:true,r:[1,2]},
  {k:'amt',label:'amount',min:0,max:1,step:0.01,def:1,r:[0.7,1]},
], frag:`
uniform float p_amt;
void main(){
  vec3 c = texture2D(u_tex, v_uv).rgb;
  vec4 o = texture2D(u_ov, v_uv);
  gl_FragColor = vec4(mix(c, o.rgb, o.a*p_amt),1.0);
}`},

{id:'petals', name:'PETAL STORM 🌸', stage:5, ovDraw:'petals', live:true, params:[
  {k:'dens',label:'density',min:0,max:1,step:0.01,def:0.5,r:[0.3,0.8]},
  {k:'size',label:'size',min:0,max:1,step:0.01,def:0.4,r:[0.2,0.7]},
  {k:'fall',label:'fall cycles',min:1,max:4,step:1,def:1,int:true,r:[1,2]},
  {k:'amt',label:'amount',min:0,max:1,step:0.01,def:0.9,r:[0.6,1]},
], frag:`
uniform float p_amt;
void main(){
  vec3 c = texture2D(u_tex, v_uv).rgb;
  vec4 o = texture2D(u_ov, v_uv);
  gl_FragColor = vec4(mix(c, o.rgb, o.a*p_amt),1.0);
}`},

{id:'stamp', name:'BLOSSOM STAMP 🏵️', stage:5, ovDraw:'stamp', params:[
  {k:'icon',label:'blossom',min:1,max:7,step:1,def:3,int:true,r:[1,7]},
  {k:'pos',label:'position',type:'select',options:['bottom right','bottom left','top right','top left','center'],def:0},
  {k:'size',label:'size',min:0.04,max:0.6,step:0.01,def:0.12,r:[0.08,0.2]},
  {k:'tint',label:'tint',type:'select',options:['white','black','blue','pink','cloud'],def:0},
  {k:'amt',label:'opacity',min:0,max:1,step:0.01,def:0.85,r:[0.5,1]},
], frag:`
uniform float p_amt;
void main(){
  vec3 c = texture2D(u_tex, v_uv).rgb;
  vec4 o = texture2D(u_ov, v_uv);
  gl_FragColor = vec4(mix(c, o.rgb, o.a*p_amt),1.0);
}`},

{id:'camhud', name:'CAM HUD 📹', stage:5, ovDraw:'camhud', live:true, params:[
  {k:'style',label:'style',type:'select',options:['camcorder','security','dashcam'],def:0},
  {k:'col',label:'color',type:'select',options:['white','mint','cyan'],def:0},
  {k:'amt',label:'amount',min:0,max:1,step:0.01,def:0.95,r:[0.8,1]},
], frag:`
uniform float p_amt;
void main(){
  vec3 c = texture2D(u_tex, v_uv).rgb;
  vec4 o = texture2D(u_ov, v_uv);
  vec3 scr = 1.0-(1.0-c)*(1.0-o.rgb);
  gl_FragColor = vec4(mix(c, scr, o.a*p_amt),1.0);
}`},
];
