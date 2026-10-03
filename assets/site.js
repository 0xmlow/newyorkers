/* NEW YORKERS · shared helpers for the editorial pages.
   Needs config.js first, then either data.js (the full census) or counts.js (the light build for article pages).
   Pages in a subfolder set window.NY_BASE = "../" before this file loads. */
(function(){
  "use strict";
  const BASE = window.NY_BASE || "";
  const CFG = window.NY_CONFIG || {};
  const D = window.NY_DATA || null;
  const K = window.NY_COUNTS || null;
  const C = D ? D.counts : (K ? K.counts : {pieces:0});
  const S = D ? D.story : (K ? {eras:K.eras||[]} : {eras:[]});
  const P = D ? D.pieces : [];
  const byId = new Map(); P.forEach((p,i)=>byId.set(p.id,i));
  function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  const fmt = p => p.n!=null ? "NO. "+String(p.n).padStart(4,"0") : "UNCOUNTED";
  const thumb = (p,k)=>`${BASE}assets/t/${p.st[k||0]}.jpg`;
  const get = id => { const i = byId.get(String(id)); return i===undefined?null:P[i]; };
  const era = p => S.eras[p.e-1];
  /* Family display names. The stored value on a piece stays the stable key (Heroes, Stoop, ...),
     and this maps it to the two word name shown to people. Falls back to the key if unmapped. */
  const FAMN = (S && S.familyNames) || {};
  const famName = f => (FAMN[f] && FAMN[f].name) || f || "";
  const famBlurb = f => (FAMN[f] && FAMN[f].blurb) || "";
  const num = n => Number(n).toLocaleString("en-US");
  function sample(n, filter, seed){
    const r = mulberry32(seed||Date.now());
    const pool = filter ? P.filter(filter) : P.slice();
    const out=[]; const used=new Set();
    while(out.length<n && used.size<pool.length){ const i=Math.floor(r()*pool.length); if(used.has(i))continue; used.add(i); out.push(pool[i]); }
    return out;
  }
  function find(q){ q=q.toLowerCase(); return P.find(p=>p.t.toLowerCase().includes(q)) || null; }
  const recordUrl = p => `${BASE}census.html#n=${p.id}`;
  const esc = s => String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;");
  const NAV = [["census.html","ART"],["museum.html","MUSEUM"],["keystone.html","KEYSTONE"],["honoraries.html","HONORARIES"],["posters.html","POSTERS"],["collectors.html","COLLECTORS"],["learn.html","STORIES"],["bloomrun.html","BLOOM RUN"],["moshlab.html","MOSH LAB"],[(window.NY_CONFIG&&window.NY_CONFIG.printsUrl)||"https://mlow.nyc","PRINTS","ext"]];
  function nav(active){
    const el=document.getElementById("nav"); if(!el)return;
    el.innerHTML=`<a href="${BASE}index.html" aria-label="NEW YORKERS home"><img src="${BASE}assets/brand/logo_white.png" alt="MLOW"></a>
      <button class="burger" aria-label="menu" aria-expanded="false">MENU</button>
      <div class="links">${NAV.map(([h,t,c])=>`<a href="${c==="ext"?h:BASE+h}" class="${c||""}${(active===t || ({"THE CENSUS":"ART","THE MUSEUM":"MUSEUM","READ":"STORIES"})[active]===t)?" on":""}"${c==="spin"?' title="Drop into a random room of the museum"':""}>${c==="spin"?"✦ ":""}${t}</a>`).join("")}</div>`;
    const b=el.querySelector(".burger"); b.onclick=()=>{const open=el.querySelector(".links").classList.toggle("open"); b.setAttribute("aria-expanded",open?"true":"false");};
  }
  /* MLow's N3W YORKERS logos (assets/brand/logos, built by _build/brand_logos.py from logos.json).
     LOCKUPS carry the full "BY MLOW" line; MARKS had a garbled byline cut off. 16 is never shown. */
  const LOCKUPS=[1,2,3,4,5,6,7,8,9,10,14], MARKS=[11,12,13,15,17,18,19,20];
  const logoUrl=(n,small)=>`${BASE}assets/brand/logos/n3w-${String(n).padStart(2,"0")}${small?"-s.jpg":".png"}`;
  // one logo per key, the same every time: a collector's card and their page always carry the same one
  function logoFor(key){let h=0;for(const ch of String(key||""))h=(h*31+ch.charCodeAt(0))>>>0;return LOCKUPS[h%LOCKUPS.length];}
  window.NY_LOGOS={LOCKUPS,MARKS,url:logoUrl,forKey:logoFor};
  function foot(){
    const el=document.getElementById("foot"); if(!el)return;
    const dom=(CFG.domain||"MLOW.NYC");
    el.innerHTML=`<div><img src="${BASE}assets/brand/logo_white.png" alt="MLOW"><div class="lines">${dom} · THE CENSUS<br><a href="${CFG.printsUrl||"https://mlow.nyc"}">THE PRINT SHOP</a> · PRINTS AND ORIGINALS<br><a href="${CFG.artistUrl||"https://mlow.xyz"}">MLOW.XYZ</a> · THE ARTIST<br>X @DEGENS · IG + TIKTOK @0XMLOW</div></div>
      <div class="col"><h5>The census</h5><a href="${BASE}census.html">Every record</a><a href="${BASE}map.html">The atlas</a><a href="${BASE}museum.html">The museum</a><a href="${BASE}museum.html#room=random">Spin a room</a><a href="${BASE}keystone.html">Keystone 111</a><a href="${BASE}honoraries.html">The honoraries</a><a href="${BASE}posters.html">Posters, cards, memes</a><a href="${BASE}collectors.html">Collectors</a><a href="${BASE}my.html">My NEW YORKERS</a><a href="${BASE}bloomrun.html">Bloom Run</a><a href="${BASE}moshlab.html">MOSH LAB</a><a href="${BASE}counted.html">Get counted</a><a href="${BASE}counted.html#nominate">Nominate a New Yorker</a>${(window.NY_CONFIG && window.NY_CONFIG.loginEnabled) ? `<a href="${BASE}profile.html">Your profile</a>` : ""}</div>
      <div class="col"><h5>The record</h5><a href="${BASE}faq.html">The FAQ</a><a href="${BASE}learn.html">The reading room</a><a href="${BASE}press.html">Press room</a><a href="${BASE}brand.html">Brand</a><a href="${BASE}count.html">The count</a><a href="${BASE}agents.html">For bots and AI agents</a><a href="${BASE}llms.txt">llms.txt</a></div>
      <div class="col"><h5>Elsewhere</h5><a href="${CFG.printsUrl||"https://mlow.nyc"}">Prints, at the print shop</a><a href="${CFG.artistUrl||"https://mlow.xyz"}">MLow, the artist</a><a href="https://x.com/degens">X, @degens</a><a href="https://www.instagram.com/0xmlow">Instagram, @0xmlow</a><a href="https://www.tiktok.com/@0xmlow">TikTok, @0xmlow</a></div>
      <div class="logostrip" aria-label="N3W YORKERS logos by MLow">${[...LOCKUPS,...MARKS].sort((a,b)=>a-b).map(n=>`<a href="${BASE}brand.html#logos"><img src="${logoUrl(n,true)}" alt="N3W YORKERS logo ${n}" loading="lazy" decoding="async" width="72" height="72"></a>`).join("")}</div>
      <div class="right"><div class="lede">The count is coming. Get counted.</div><div class="sm">NEW YORKERS · A CENSUS BY MLOW · NYC · ${num(C.pieces)} CHARACTERS AND COUNTING<br><span class="ft" title="Art, not an investment">ART, NOT AN INVESTMENT · <a href="${BASE}pigeon.html" style="opacity:.35" aria-label="the uncounted">·</a></span></div></div>`;
  }
  function toast(msg){let t=document.querySelector(".toast");if(!t){t=document.createElement("div");t.className="toast";document.body.appendChild(t);}t.textContent=msg;t.classList.add("show");clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove("show"),2600);}
  /* share: Web Share where it exists, else copy, plus an X intent. Every share carries ?ref=share so the flywheel can be counted. */
  function shareUrl(url){ try{ const u=new URL(url,location.href); if(!u.searchParams.get("ref")) u.searchParams.set("ref","share"); return u.toString(); }catch(e){ return url; } }
  async function share(o){
    const url=shareUrl(o.url||location.href), text=o.text||document.title;
    if(navigator.share){ try{ await navigator.share({title:o.title||document.title,text,url}); return "shared"; }catch(e){ if(e&&e.name==="AbortError") return "cancelled"; } }
    try{ await navigator.clipboard.writeText(text+" "+url); toast("Link copied. Paste it anywhere."); return "copied"; }catch(e){ toast(url); return "shown"; }
  }
  const xIntent = (text,url)=>`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl(url||location.href))}`;
  function shareRow(el,o){ if(!el)return; el.className="share"; el.innerHTML=`<button type="button" data-a="share">Share</button><button type="button" data-a="copy">Copy link</button><a href="${xIntent(o.text||document.title,o.url)}" target="_blank" rel="noopener">Post on X</a>`;
    el.querySelector('[data-a="share"]').onclick=()=>share(o); el.querySelector('[data-a="copy"]').onclick=async()=>{ try{ await navigator.clipboard.writeText(shareUrl(o.url||location.href)); toast("Link copied."); }catch(e){ toast(shareUrl(o.url||location.href)); } }; }
  /* Records a thing you did against your profile, if you have one. Fire and forget: it never
     blocks the page and it silently does nothing for a logged out visitor. */
  function track(kind, key, payload){
    try{
      fetch((BASE||"/")+"api/event", {method:"POST", credentials:"same-origin",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({kind:kind, key:key, payload:payload||{}})}).catch(function(){});
    }catch(e){}
  }
  /* Remember a referral code for later, so a share that leads to a sign up days afterwards still counts. */
  try{
    var _r=new URLSearchParams(location.search).get("ref");
    if(_r) localStorage.setItem("ny_ref", _r);
  }catch(e){}
  window.NY = {D,C,S,P,CFG,BASE,track,fmt,thumb,get,era,famName,famBlurb,num,sample,find,recordUrl,esc,nav,foot,toast,share,shareUrl,xIntent,shareRow,rnd:mulberry32};
})();
