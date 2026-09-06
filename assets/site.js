/* NEW YORKERS · shared helpers for the editorial pages. Needs config.js + data.js first. */
(function(){
  "use strict";
  const D = window.NY_DATA, C = D.counts, S = D.story, P = D.pieces, CFG = window.NY_CONFIG || {};
  const byId = new Map(); P.forEach((p,i)=>byId.set(p.id,i));
  function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  const fmt = p => p.n!=null ? "NO. "+String(p.n).padStart(4,"0") : "UNCOUNTED";
  const thumb = (p,k)=>`assets/t/${p.st[k||0]}.jpg`;
  const get = id => { const i = byId.get(String(id)); return i===undefined?null:P[i]; };
  const era = p => S.eras[p.e-1];
  const num = n => Number(n).toLocaleString("en-US");
  function sample(n, filter, seed){
    const r = mulberry32(seed||Date.now());
    const pool = filter ? P.filter(filter) : P.slice();
    const out=[]; const used=new Set();
    while(out.length<n && used.size<pool.length){ const i=Math.floor(r()*pool.length); if(used.has(i))continue; used.add(i); out.push(pool[i]); }
    return out;
  }
  function find(q){ q=q.toLowerCase(); return P.find(p=>p.t.toLowerCase().includes(q)) || null; }
  const recordUrl = p => `census.html#n=${p.id}`;
  const esc = s => String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;");
  function nav(active){
    const links=[["index.html","HOME"],["census.html","THE CENSUS"],["census.html#gallery","THE GALLERY"],["map.html","THE ATLAS"],["museum.html","THE MUSEUM"],["count.html","THE COUNT"],["press.html","PRESS"],["counted.html","GET COUNTED","cta"]];
    const el=document.getElementById("nav"); if(!el)return;
    el.innerHTML=`<a href="index.html"><img src="assets/brand/logo_white.png" alt="MLOW"></a>
      <button class="burger" aria-label="menu">MENU</button>
      <div class="links">${links.map(([h,t,c])=>`<a href="${h}" class="${c||""}${active===t?" on":""}">${t}</a>`).join("")}</div>`;
    el.querySelector(".burger").onclick=()=>el.querySelector(".links").classList.toggle("open");
  }
  function foot(){
    const el=document.getElementById("foot"); if(!el)return;
    el.innerHTML=`<div><img src="assets/brand/logo_white.png" alt="MLOW"><div class="lines">${CFG.domain||"NEWYORKERS.MLOW.XYZ"} · MLOW.XYZ · MLOW.NYC<br>X @DEGENS · IG + TIKTOK @0XMLOW</div></div>
      <div class="right"><div class="lede">The count is coming. Get counted.</div><div class="sm">NEW YORKERS · A CENSUS BY MLOW · NYC · ${num(C.pieces)} CHARACTERS AND COUNTING</div></div>`;
  }
  function toast(msg){let t=document.querySelector(".toast");if(!t){t=document.createElement("div");t.className="toast";document.body.appendChild(t);}t.textContent=msg;t.classList.add("show");clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove("show"),2600);}
  window.NY = {D,C,S,P,CFG,fmt,thumb,get,era,num,sample,find,recordUrl,esc,nav,foot,toast,rnd:mulberry32};
})();
