"use strict";
/* MOSH LAB · the New Yorkers source and THE MOSH MACHINE.
   New Yorkers come from the census at n3wyorkers.com: assets/moshlab/ny.json is the index
   (built by the site's build_moshlab.py), assets/t/<key>.jpg the 1000px paintings, api/c the
   holders. Served from the site, everything is same origin; in the desktop app it is fetched
   from n3wyorkers.com, which answers with Access-Control-Allow-Origin: *.
   The machine spins three reels (WHO, WHAT, SEED), rolls a rarity, and the rarer the roll the
   harder it moshes. Chips are play chips: free, refilled by the house, worth nothing. */
(function(){
const M = window.MOSHLAB;
const $ = id => document.getElementById(id);
const BASE = (()=>{
  const i = location.href.indexOf('/assets/moshlab/');
  return (/^https?:/.test(location.protocol) && i >= 0) ? location.href.slice(0, i+1) : 'https://n3wyorkers.com/';
})();
const SITE = 'https://n3wyorkers.com/';
const store = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} },
};
const pick = a => a[Math.floor(Math.random()*a.length)];
const slug = t => String(t).replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40);

/* ---------- the census ---------- */
let NY = null, byN = new Map(), loadingIdx = null;
function index(quiet){
  if(NY) return Promise.resolve(NY);
  if(loadingIdx) return loadingIdx;
  loadingIdx = fetch(BASE+'assets/moshlab/ny.json').then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); }).then(j=>{
    NY = j.p.map(a=>({n:a[0], t:a[1], k:a[2], era:a[3], fam:a[4], boro:a[5]}));
    NY.forEach(p=>byN.set(p.n, p));
    return NY;
  }).catch(e=>{ loadingIdx = null; if(!quiet) M.toast('the census is offline right now 📡 try again in a sec'); throw e; });
  return loadingIdx;
}
function loadImg(url){
  return new Promise((res, rej)=>{ const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = ()=>res(i); i.onerror = rej; i.src = url; });
}
let now = null;
async function loadPiece(p, url){
  const img = await loadImg(url || (BASE+'assets/t/'+p.k+'.jpg'));
  M.addImageEl('NY'+p.n+'-'+slug(p.t), img, {n:p.n, t:p.t});
  now = p;
  showNow();
  return img;
}
function showNow(){
  const faves = store.get('moshlab_faves', []);
  $('nyfave').classList.toggle('on', !!now && faves.includes(now.n));
  $('nyfave').textContent = now && faves.includes(now.n) ? '❤️' : '♡';
  $('nynow').innerHTML = now
    ? `NO. ${now.n} · ${esc(now.t)}<br><a href="${SITE}n/${now.n}" target="_blank" rel="noopener">see it on n3wyorkers.com</a>`
    : 'pull a New Yorker from the census, or the ones in your wallet, and break it.';
}
function esc(s){ return String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

async function nyRandom(){
  const all = await index();
  const p = pick(all);
  M.toast('🎲 NO. '+p.n+' · '+p.t);
  return loadPiece(p);
}
async function nySearch(q){
  const all = await index();
  q = q.trim();
  const box = $('nyhits'); box.innerHTML = '';
  if(!q) return;
  const num = +q.replace(/^no\.?\s*/i,'');
  if(num && byN.has(num)){ loadPiece(byN.get(num)); return; }
  const ql = q.toLowerCase();
  const hits = all.filter(p=>p.t.toLowerCase().includes(ql)).slice(0, 8);
  if(!hits.length){ box.innerHTML = '<div class="hint">nobody by that name. yet.</div>'; return; }
  for(const p of hits){
    const b = document.createElement('button'); b.className = 'hit';
    b.textContent = p.n+' · '+p.t;
    b.onclick = ()=>{ box.innerHTML = ''; loadPiece(p); };
    box.append(b);
  }
}
async function nyWallet(q){
  q = q.trim().toLowerCase();
  if(!q){ M.toast('paste a wallet or a name.eth'); return; }
  let addr = /^0x[0-9a-f]{40}$/.test(q) ? q : null;
  if(!addr){
    try{
      const ix = await fetch(BASE+'api/c/index.json').then(r=>r.json());
      for(const a in ix) if((ix[a]||'').toLowerCase() === q) addr = a;
    }catch(e){}
  }
  if(!addr){ M.toast('that name is not on the collector list. paste the 0x address'); return; }
  let c;
  try{ const r = await fetch(BASE+'api/c/'+addr+'.json'); if(!r.ok) throw 0; c = await r.json(); }
  catch(e){ M.toast('no New Yorkers in that wallet yet. mint one and it shows up at the next read'); return; }
  const ps = (c.pieces||[]).slice(0, 40);
  M.toast('👛 '+(c.ens||c.nm||'collector')+' · loading '+ps.length+' New Yorkers');
  let ok = 0;
  for(const p of ps){
    try{
      const img = await loadImg(BASE + p.th);
      const ks = p.c === 'keystone';
      M.addImageEl((ks ? 'KEYSTONE' : 'NY')+p.n+'-'+slug(p.t), img, ks ? {t:p.t} : {n:p.n, t:p.t});
      ok++;
    }catch(e){}
  }
  await index().catch(()=>{});
  const last = ps[ps.length-1];
  now = last ? (byN.get(last.n) || {n:last.n, t:last.t}) : null;
  showNow();
  M.toast('👛 '+ok+' of yours in the lab. pick one in the source list, or pull with WHO locked');
}
function toggleFave(){
  if(!now){ M.toast('load a New Yorker first'); return; }
  const f = store.get('moshlab_faves', []);
  const i = f.indexOf(now.n);
  if(i>=0) f.splice(i,1); else f.push(now.n);
  store.set('moshlab_faves', f);
  showNow();
  M.toast(i>=0 ? 'unhearted' : '❤️ NO. '+now.n+' saved to faves');
}
async function loadFaves(){
  const f = store.get('moshlab_faves', []);
  if(!f.length){ M.toast('no faves yet. hit ♡ on one you love'); return; }
  await index();
  for(const n of f){ const p = byN.get(n); if(p){ try{ await loadPiece(p); }catch(e){} } }
  M.toast('❤️ '+f.length+' faves loaded');
}

/* ---------- sound ---------- */
let ac = null, muted = store.get('moshlab_mute', false);
function beep(freq, dur, type, vol){
  if(muted) return;
  try{
    ac = ac || new (window.AudioContext||window.webkitAudioContext)();
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type||'square'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol||0.04, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + dur);
  }catch(e){}
}
const tune = (notes, step) => notes.forEach((f,i)=>setTimeout(()=>beep(f, 0.18, 'triangle', 0.07), i*(step||90)));

/* ---------- the machine ---------- */
const RARITY = [
  {k:'COMMON',    p:55, pay:0,    lines:['mid. spin again ser','touch grass, then spin again','paper hands pixels','it is giving default']},
  {k:'RARE',      p:25, pay:15,   lines:['few understand','probably something','the eye noticed','ok ok we cooking']},
  {k:'EPIC',      p:13, pay:40,   lines:['LFG','this one is a grail ser','certified street glitch','wagmi energy']},
  {k:'LEGENDARY', p:6,  pay:120,  lines:['GIGABRAIN MOSH','the eye blinked first','send it to the museum','screenshot or it did not happen']},
  {k:'MYTHIC',    p:1,  pay:1000, lines:['👁️ THE EYE OPENS · 317']},
];
const COST = 10;
const S = store.get('moshlab_casino', {chips:317, spins:0, best:-1, streak:0, hist:[]});
const locks = [false, false, false];
let spinning = false, degen = null, open = store.get('moshlab_casino_open', true);

function rollRarity(){
  let r = Math.random()*100;
  for(let i=0;i<RARITY.length;i++){ if((r -= RARITY[i].p) < 0) return i; }
  return 0;
}
function presets(){ const a = M.BUILTIN_PRESETS.slice(); if(M.state.unlocked317) a.push(M.SIGNATURE_PRESET); return a; }
function setChips(v, bump){
  S.chips = Math.max(0, Math.round(v));
  $('czchips').textContent = '🪙 '+S.chips.toLocaleString();
  if(bump){ $('czchips').classList.remove('bump'); void $('czchips').offsetWidth; $('czchips').classList.add('bump'); }
}
function renderStats(){
  setChips(S.chips);
  $('czstats').textContent = 'PULLS '+S.spins+(S.best>=0 ? ' · BEST '+RARITY[S.best].k : '');
  $('czstreak').textContent = S.streak >= 2 ? '🔥 x'+S.streak+' HOT STREAK' : '';
  const h = $('czhist'); h.innerHTML = '';
  for(const it of S.hist.slice(-14).reverse()){
    const d = document.createElement('div');
    d.className = 'h r-'+it.r;
    if(it.k) d.style.backgroundImage = `url(${BASE}assets/t/${it.k}.jpg)`;
    d.title = (it.n ? 'NO. '+it.n+' · ' : '')+it.preset+' · '+it.seed+' · '+it.r;
    d.innerHTML = '<b>'+it.r.slice(0,4)+'</b>';
    d.onclick = ()=>replay(it);
    h.append(d);
  }
  store.set('moshlab_casino', S);
}
function setReel(i, text, cls){
  const v = $('r'+i+'v'); v.textContent = text;
  $('r'+i).className = 'reel'+(locks[i]?' locked':'')+(cls?' '+cls:'');
}
function shout(r){
  const el = $('rarity');
  el.className = ''; el.textContent = RARITY[r].k; void el.offsetWidth;
  el.className = 'show r-'+RARITY[r].k;
}
function confetti(n, set){
  const box = $('confetti');
  for(let i=0;i<n;i++){
    const e = document.createElement('i');
    e.textContent = pick(set);
    e.style.left = (Math.random()*100)+'%';
    e.style.fontSize = (16+Math.random()*26)+'px';
    e.style.animationDuration = (1.6+Math.random()*1.8)+'s';
    e.style.animationDelay = (Math.random()*0.5)+'s';
    box.append(e);
    setTimeout(()=>e.remove(), 4200);
  }
}

/* apply the pull: preset, then mosh harder the rarer the roll. Effects the preset turned on are
   locked while the mosh rolls so the preset survives it; the user's own locks come back after. */
function moshFor(preset, r){
  const st = M.state;
  M.applyPreset(preset);
  if(r === 0) return;
  const mine = new Map(st.chain.map(e=>[e.id, e.lock]));
  for(const e of st.chain) if(e.on) e.lock = true;
  if(r >= 4){ M.applyPreset(M.SIGNATURE_PRESET); for(const e of st.chain) if(e.on) e.lock = true; }
  M.mosh(r >= 2);
  for(const e of st.chain) e.lock = mine.get(e.id) || false;
  M.buildFxList(); M.saveSoon();
}

function animateReel(i, ms, frames){
  return new Promise(res=>{
    if(locks[i]){ res(); return; }
    $('r'+i).classList.add('spinning');
    const t0 = performance.now();
    (function step(){
      const t = performance.now() - t0;
      $('r'+i+'v').textContent = pick(frames());
      if(t < ms){ beep(220 + i*90 + Math.random()*60, 0.03, 'square', 0.02); setTimeout(step, 45 + t/ms*90); }
      else res();
    })();
  });
}

async function pull(){
  if(spinning) return;
  if(S.chips < COST){
    setChips(S.chips + 100, true);
    M.toast('💸 BROKE. the house spots you 100 chips. wagmi', 3000);
  }
  spinning = true; $('czpull').disabled = true;
  setChips(S.chips - COST, true);
  let all = [];
  try{ all = await index(); }catch(e){ spinning = false; $('czpull').disabled = false; setChips(S.chips + COST); return; }

  const cur = M.current();
  const who = locks[0] ? (cur && cur.meta ? (byN.get(cur.meta.n) || null) : null) : pick(all);
  const preset = locks[1] && S.lastPreset ? (presets().find(p=>p.name===S.lastPreset) || pick(presets())) : pick(presets());
  const seed = locks[2] ? M.state.seed : 'NY-'+Math.floor(Math.random()*90000+10000);
  let r = rollRarity();
  // jackpots: the signature number, or a triple in the seed
  const digits = seed.replace(/\D/g,'');
  const jackpot = (who && String(who.n).includes('317')) || /(\d)\1\1/.test(digits) || digits.includes('317');

  // start fetching the painting while the reels spin
  const imgP = who && !locks[0] ? loadImg(BASE+'assets/t/'+who.k+'.jpg').catch(()=>null) : Promise.resolve(null);
  $('r0img').style.display = 'none';
  const names = ()=>all.length ? [pick(all).t, 'NO. '+pick(all).n] : ['?'];
  await Promise.all([
    animateReel(0, 700, names),
    animateReel(1, 1050, ()=>presets().map(p=>p.name)),
    animateReel(2, 1400, ()=>['NY-'+Math.floor(Math.random()*90000+10000)]),
  ]);

  const img = await imgP;
  if(who && img){ M.addImageEl('NY'+who.n+'-'+slug(who.t), img, {n:who.n, t:who.t}); now = who; showNow(); }
  const rk = RARITY[r].k;
  setReel(0, who ? 'NO. '+who.n+' · '+who.t : (cur ? cur.name : 'your image'), 'landed r-'+rk);
  if(who){ $('r0img').src = BASE+'assets/t/'+who.k+'.jpg'; $('r0img').style.display = 'block'; }
  setReel(1, preset.name, 'landed r-'+rk);
  setReel(2, seed, 'landed r-'+rk);
  beep(110, 0.2, 'sawtooth', 0.05);

  M.state.seed = seed; $('seed').value = seed;
  moshFor(preset, r);
  M.state.tag = rk + (jackpot ? '-JACKPOT' : '');
  S.lastPreset = preset.name;

  let pay = RARITY[r].pay * (jackpot ? 3 : 1);
  S.spins++; S.streak = r >= 1 ? S.streak + 1 : 0;
  if(S.streak && S.streak % 5 === 0){ pay += 100; M.toast('🔥 FIVE IN A ROW · +100 house bonus'); }
  if(r > S.best) S.best = r;
  setChips(S.chips + pay, pay > 0);
  S.hist.push({n: who ? who.n : null, k: who ? who.k : null, t: who ? who.t : null, preset: preset.name, seed, r: rk, snap: M.snapshotChain()});
  S.hist = S.hist.slice(-24);
  renderStats();

  shout(r);
  $('czmsg').textContent = (jackpot ? '💰 JACKPOT x3 · ' : '') + pick(RARITY[r].lines) + (pay ? ' · +'+pay+' chips' : '');
  if(r >= 2 || jackpot) tune(r >= 4 ? [523,659,784,1047,1319,1568] : r >= 3 ? [523,659,784,1047] : [523,659,784], r >= 4 ? 120 : 90);
  if(r >= 3 || jackpot) confetti(r >= 4 ? 90 : 40, r >= 4 ? ['👁️','🌸','💸','🪙','✨'] : ['🪙','💸','✨','👁️']);
  // MYTHIC unlocks THE SIGNATURE preset for good, without overwriting the look it just rolled
  if(r === 4 && !M.state.unlocked317){ M.state.unlocked317 = true; M.buildPresetButtons(); M.saveSoon(); M.toast('👁️ THE SIGNATURE 317 is in your presets now', 3500); }
  spinning = false; $('czpull').disabled = false;
}

async function replay(it){
  try{
    if(it.n){ await index(); const p = byN.get(it.n); if(p) await loadPiece(p); }
    M.state.seed = it.seed; $('seed').value = it.seed;
    M.restoreSnapshot(it.snap);
    M.state.tag = it.r;
    M.toast('↩️ back to '+(it.n ? 'NO. '+it.n+' · ' : '')+it.r);
  }catch(e){ M.toast('could not bring that one back'); }
}

function setOpen(v){
  open = v; store.set('moshlab_casino_open', v);
  $('casino').classList.toggle('open', v);
  $('spinbtn').classList.toggle('ghost-on', v);
  setTimeout(()=>window.dispatchEvent(new Event('resize')), 30);
}
function toggleDegen(){
  if(degen){ clearInterval(degen); degen = null; $('czdegen').classList.remove('ghost-on'); M.toast('🤑 degen mode off. hydrate'); return; }
  $('czdegen').classList.add('ghost-on');
  M.toast('🤑 DEGEN MODE · a pull every 5 seconds · export anything you love');
  pull();
  degen = setInterval(()=>{ if(!document.hidden) pull(); }, 5000);
}

/* ---------- wire up ---------- */
$('nygo').onclick = ()=>nySearch($('nyq').value);
$('nyq').addEventListener('keydown', e=>{ if(e.key==='Enter') nySearch($('nyq').value); });
$('nyrand').onclick = ()=>nyRandom().catch(()=>{});
$('nyfave').onclick = toggleFave;
$('nyfaves').onclick = ()=>loadFaves().catch(()=>{});
$('nymine').onclick = ()=>nyWallet($('nywallet').value);
$('nywallet').addEventListener('keydown', e=>{ if(e.key==='Enter') nyWallet($('nywallet').value); });
$('nywallet').value = store.get('moshlab_wallet', '');
$('nywallet').addEventListener('change', ()=>store.set('moshlab_wallet', $('nywallet').value.trim()));
$('spinbtn').onclick = ()=>{ if(!open) setOpen(true); pull(); };
$('czclose').onclick = ()=>setOpen(false);
$('czpull').onclick = pull;
$('czdegen').onclick = toggleDegen;
$('czsound').textContent = muted ? '🔇' : '🔊';
$('czsound').onclick = ()=>{ muted = !muted; store.set('moshlab_mute', muted); $('czsound').textContent = muted ? '🔇' : '🔊'; };
document.querySelectorAll('.rlock').forEach(b=>{
  b.onclick = e=>{
    e.stopPropagation();
    const i = +b.dataset.r; locks[i] = !locks[i];
    b.textContent = locks[i] ? '🔒' : '🔓';
    $('r'+i).classList.toggle('locked', locks[i]);
    M.toast(locks[i] ? ['WHO','WHAT','SEED'][i]+' locked. the other reels keep spinning' : 'unlocked');
  };
});
// a hand on MOSH, HYPER or CLEAN means the look is no longer the machine's roll
['moshbtn','hyperbtn','clearbtn'].forEach(id=>$(id).addEventListener('click', ()=>{ M.state.tag = ''; }));
window.addEventListener('keydown', e=>{
  if(e.target.tagName==='INPUT' || e.target.tagName==='SELECT') return;
  if(e.key==='s' || e.key==='S'){ if(!open) setOpen(true); pull(); }
});
setOpen(open);
renderStats();
index(true).catch(()=>{});
})();
