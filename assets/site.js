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
  const recordUrl = p => `${BASE}census#n=${p.id}`;
  const esc = s => String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;");
  /* Cloudflare Pages serves every page extensionless and 308s /x.html to /x, so every internal href the
     site emits is extensionless: one hop fewer per click and no redirect for Google to index. */
  const NAV = [["census","ART"],["museum","MUSEUM"],["island","ISLAND"],["basement","BASEMENT"],["map","ATLAS"],["keystone","KEYSTONE"],["honoraries","HONORARIES"],["mosaic","MOSAIC"],["posters","POSTERS"],["collectors","COLLECTORS"],["learn","STORIES"],["arcade","ARCADE"],["bloomrun","BLOOM RUN"],["moshlab","MOSH LAB"],["press","PRESS"],[(window.NY_CONFIG&&window.NY_CONFIG.printsUrl)||"https://mlow.nyc","PRINTS","ext"]];
  function nav(active){
    const el=document.getElementById("nav"); if(!el)return;
    el.innerHTML=`<a href="${BASE||"./"}" aria-label="NEW YORKERS home"><img src="${BASE}assets/brand/logo_white.png" alt="MLOW"></a>
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
  /* THE TRAIL (2026-10-06, retention): where this visitor was last, kept in their own browser and nowhere
     else. The museum writes the last room (ny_trail_room, from its own bundle), piece pages write the last
     New Yorker, and the footer, the home page and the museum entrance offer them back. */
  function trail(){ const t={}; try{ t.room=JSON.parse(localStorage.getItem("ny_trail_room")||"null"); t.piece=JSON.parse(localStorage.getItem("ny_trail_piece")||"null"); }catch(e){} return t; }
  (function(){ const m=location.pathname.match(/\/n\/([^\/.]+)(\.html)?$/); if(!m) return;
    const h=document.querySelector("h1"), im=document.querySelector("main img, img");
    try{ localStorage.setItem("ny_trail_piece", JSON.stringify({id:m[1], t:(h&&h.textContent.trim())||"", img:im?im.getAttribute("src").replace(/^(\.\.\/)+/,""):"", at:Date.now()})); }catch(e){}
  })();
  /* SINCE YOUR LAST VISIT (2026-10-06, collector alerts): rooms opened and honorees painted since this browser
     last opened the page, from api/changes.json; with o.rank, how far this collector moved on the board.
     The visit is stamped per page (o.key), so reading the board does not clear the alert on a collector page. */
  function since(el,o){
    if(!el) return; o=o||{}; const k="ny_seen_"+(o.key||"site"); let prev=null, pr=null;
    try{ prev=localStorage.getItem(k); localStorage.setItem(k,new Date().toISOString().slice(0,10)); }catch(e){ return; }
    if(o.rankKey){ try{ pr=JSON.parse(localStorage.getItem("ny_rank_"+o.rankKey)||"null"); localStorage.setItem("ny_rank_"+o.rankKey,JSON.stringify({r:o.rank,of:o.of})); }catch(e){} }
    if(!prev) return;  /* first visit: nothing to compare yet */
    fetch(BASE+"api/changes.json").then(r=>r.json()).then(c=>{
      const rooms=c.rooms.filter(x=>x.added>prev), hon=c.honorees.filter(x=>x.added>prev), bits=[];
      if(rooms.length) bits.push(`<b>${rooms.length} new room${rooms.length>1?"s":""}</b> ${rooms.slice(-4).reverse().map(x=>`<a href="${BASE}museum#room=${x.id}">${esc(x.name)}</a>`).join(", ")}${rooms.length>4?" and more":""}`);
      if(hon.length) bits.push(`<b>${hon.length} new honoree${hon.length>1?"s":""}</b> <a href="${BASE}honoraries">in the Hall of Fame</a>${hon.length<=3?": "+hon.map(x=>`<a href="${BASE}h/${x.id}">${esc(x.name)}</a>`).join(", "):""}`);
      if(pr&&pr.r&&o.rank&&pr.r!==o.rank) bits.push(o.rank<pr.r?`<b>Up ${pr.r-o.rank}</b> on the board, from No. ${pr.r} to No. ${o.rank}`:`<b>Down ${o.rank-pr.r}</b> on the board, from No. ${pr.r} to No. ${o.rank}. <a href="https://opensea.io/collection/newyorkers/overview" target="_blank" rel="noopener">Take it back</a>`);
      if(!bits.length) return;
      el.className="since"; el.innerHTML=`<small>SINCE YOUR LAST VISIT</small><div>${bits.map(b=>`<p>${b}</p>`).join("")}</div>`; el.hidden=false;
    }).catch(()=>{});
  }
  function foot(){
    const el=document.getElementById("foot"); if(!el)return;
    const dom=(CFG.domain||"MLOW.NYC");
    /* Keep exploring (2026-10-06, retention): every page ends on four doors. The room of the day turns over at
       midnight New York time, so a visitor who comes back tomorrow finds a different one. */
    const R=window.NY_ROOMS, day=Math.floor((Date.now()-4*36e5)/864e5);
    const today=R&&R.length?R[day%R.length]:null;
    const T=trail(), here=location.pathname;
    const doors=[
      T.room&&T.room.id&&!/museum/.test(here)?[`museum#room=${T.room.id}`,"PICK UP WHERE YOU LEFT OFF",T.room.name]:
        today?[`museum#room=${today.id}`,"ROOM OF THE DAY",today.name]:["museum#room=random","SPIN A ROOM","Let the city pick"],
      ["museum#room=honoraries","ROOM 183","The Hall of Fame"],
      T.piece&&T.piece.id&&!here.includes("/n/"+T.piece.id)?[`n/${T.piece.id}`,"YOUR LAST NEW YORKER",T.piece.t]:["counted","SIX QUESTIONS","Which New Yorker are you?"],
      ["collectors","THE BOARD","Who holds the city"]];
    const explore=`<nav class="explore" aria-label="Keep exploring"><h5>Keep exploring</h5><div>${doors.map(d=>`<a href="${BASE}${d[0]}"><small>${d[1]}</small><b>${esc(d[2])}</b><i>↗</i></a>`).join("")}</div></nav>`;
    el.innerHTML=explore+`<div><img src="${BASE}assets/brand/logo_white.png" alt="MLOW"><div class="lines">${dom} · THE CENSUS<br><a href="${CFG.printsUrl||"https://mlow.nyc"}">THE PRINT SHOP</a> · PRINTS AND ORIGINALS<br><a href="${CFG.artistUrl||"https://mlow.xyz"}">MLOW.XYZ</a> · THE ARTIST<br>X @DEGENS · IG + TIKTOK @0XMLOW</div></div>
      <div class="col"><h5>The census</h5><a href="${BASE}census">Every record</a><a href="${BASE}map">The atlas</a><a href="${BASE}museum">The museum</a><a href="${BASE}museum#room=random">Spin a room</a><a href="${BASE}island">MEME ISLAND</a><a href="${BASE}basement">YOUR MOM'S BASEMENT</a><a href="${BASE}keystone">Keystone 111</a><a href="${BASE}honoraries">The honoraries</a><a href="${BASE}posters">Posters, cards, memes</a><a href="${BASE}collectors">Collectors</a><a href="${BASE}mosaic">The mosaic</a><a href="${BASE}stop">Your stop</a><a href="${BASE}states">Friday State</a><a href="${BASE}my">My NEW YORKERS</a><a href="${BASE}arcade">The Arcade</a><a href="${BASE}bloomrun">Bloom Run</a><a href="${BASE}moshlab">MOSH LAB</a><a href="${BASE}markup">Mark up a New Yorker</a><a href="${BASE}counted">Get counted</a><a href="${BASE}counted#nominate">Nominate a New Yorker</a>${(window.NY_CONFIG && window.NY_CONFIG.loginEnabled) ? `<a href="${BASE}profile">Your profile</a>` : ""}</div>
      <div class="col"><h5>The record</h5><a href="${BASE}faq">The FAQ</a><a href="${BASE}learn">The reading room</a><a href="${BASE}press">Press room</a><a href="${BASE}brand">Brand</a><a href="${BASE}count">The count</a><a href="${BASE}agents">For bots and AI agents</a><a href="${BASE}llms.txt">llms.txt</a></div>
      <div class="col"><h5>Elsewhere</h5><a href="${CFG.printsUrl||"https://mlow.nyc"}">Prints, at the print shop</a><a href="${CFG.artistUrl||"https://mlow.xyz"}">MLow, the artist</a><a href="https://x.com/degens">X, @degens</a><a href="https://www.instagram.com/0xmlow">Instagram, @0xmlow</a><a href="https://www.tiktok.com/@0xmlow">TikTok, @0xmlow</a></div>
      <div class="logostrip" aria-label="N3W YORKERS logos by MLow">${[...LOCKUPS,...MARKS].sort((a,b)=>a-b).map(n=>`<a href="${BASE}brand#logos"><img src="${logoUrl(n,true)}" alt="N3W YORKERS logo ${n}" loading="lazy" decoding="async" width="72" height="72"></a>`).join("")}</div>
      <div class="right"><div class="lede"><a href="${BASE}counted">The census is minting now. Get counted.</a></div><div class="sm">NEW YORKERS · A CENSUS BY MLOW · NYC · ${num(C.pieces)} CHARACTERS AND COUNTING<br><span class="ft" title="Art, not an investment">ART, NOT AN INVESTMENT · <a href="${BASE}pigeon" style="opacity:.35" aria-label="the uncounted">·</a></span></div></div>`;
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
  /* FIRST PARTY HITS (2026-10-07). track() above only lands for a signed in profile and login is off, so
     the site had no idea which pages or mint buttons anyone touched. hit() posts an anonymous, cookieless
     row to /api/hit (functions/api/hit.js): kind, key, the page, a ?ref= if one came along, nothing else.
     sendBeacon so a click that leaves the page still lands; never from a local file or localhost, so the
     table only ever holds the live site. */
  const LIVE = /^https?:$/.test(location.protocol) && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  function hit(kind, key){
    if(!LIVE) return;
    try{
      const ref=new URLSearchParams(location.search).get("ref")||"";
      const body=JSON.stringify({kind:String(kind||"").slice(0,24), key:String(key||"").slice(0,120), path:location.pathname.slice(0,160), ref:ref.slice(0,80)});
      const url=(BASE||"/")+"api/hit";
      if(navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body],{type:"application/json"}))) return;
      fetch(url,{method:"POST",headers:{"content-type":"application/json"},body,keepalive:true}).catch(function(){});
    }catch(e){}
  }
  hit("view", location.pathname);
  /* The mint bar (assets/mint.js) is injected after this file runs, so the listener is delegated. Its two cells
     carry ids ny-c (THE CENSUS RELEASE) and ny-k (KEYSTONE); the hit records which one was taken. */
  document.addEventListener("click", function(e){
    const a=e.target.closest && e.target.closest("#ny-mintbar a.drop"); if(!a) return;
    hit("mint_click", a.classList.contains("census") ? "census" : a.classList.contains("key") ? "keystone" : (a.id||"drop"));
  }, true);
  /* Remember a referral code for later, so a share that leads to a sign up days afterwards still counts. */
  try{
    var _r=new URLSearchParams(location.search).get("ref");
    if(_r) localStorage.setItem("ny_ref", _r);
  }catch(e){}
  window.NY = {D,C,S,P,CFG,BASE,track,hit,fmt,thumb,get,era,famName,famBlurb,num,sample,find,recordUrl,esc,nav,foot,toast,share,shareUrl,xIntent,shareRow,trail,since,rnd:mulberry32};
})();
