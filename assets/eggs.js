/* NEW YORKERS · the easter eggs. Things people were never supposed to find.
   Self contained: no images, no network. Loads on every page after site.js (or alone on the museum).
   Triggers: the Konami code, typed words (rat, bodega, pigeon, showtime, moses, 1977, bagel, fuhgeddaboudit, hotdog, knicks),
   five clicks on the logo, ?egg=<name> in the URL, and the console. Type "help" nowhere; the city does not do help. */
(function(){
  "use strict";
  if (window.__nyEggs) return; window.__nyEggs = true;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const found = new Set(JSON.parse((()=>{try{return localStorage.getItem("ny_eggs")||"[]"}catch(e){return "[]"}})()));
  const css = document.createElement("style");
  css.textContent = `
  .egg-toast{position:fixed;z-index:9999;left:50%;bottom:34px;transform:translateX(-50%) translateY(20px);background:#0D0D0D;color:#F0F4F8;border:1px solid #2A3040;border-left:3px solid #D7FF1F;padding:12px 18px;font:13px/1.5 "Space Grotesk",-apple-system,Arial,sans-serif;max-width:min(560px,92vw);opacity:0;transition:all .4s cubic-bezier(.2,.8,.2,1);pointer-events:none;border-radius:6px}
  .egg-toast.show{opacity:1;transform:translateX(-50%)}
  .egg-toast b{color:#D7FF1F;font-family:"IBM Plex Mono",Menlo,monospace;font-size:10px;letter-spacing:.24em;display:block;margin-bottom:4px}
  .egg-runner{position:fixed;z-index:9998;bottom:8px;left:-160px;font-size:48px;line-height:1;pointer-events:none;filter:drop-shadow(0 4px 8px rgba(0,0,0,.6));will-change:transform}
  @keyframes eggRun{from{transform:translateX(0)}to{transform:translateX(calc(100vw + 320px))}}
  @keyframes eggBob{0%,100%{margin-bottom:0}50%{margin-bottom:6px}}
  .egg-runner.go{animation:eggRun var(--t,6s) linear forwards}
  .egg-runner .b{display:inline-block;animation:eggBob .32s ease-in-out infinite}
  .egg-fall{position:fixed;z-index:9997;top:-10vh;pointer-events:none;font:700 12px/1.2 "IBM Plex Mono",Menlo,monospace;color:#0D0D0D;background:#F0F4F8;padding:6px 8px;border:1px solid #2A3040;white-space:nowrap;box-shadow:0 8px 20px rgba(0,0,0,.4);animation:eggFall var(--t,5s) linear forwards;transform:rotate(var(--r,0deg))}
  @keyframes eggFall{to{top:110vh;transform:rotate(calc(var(--r,0deg) + 360deg))}}
  .egg-tilt{animation:eggTilt 4.2s ease-in-out 1}
  @keyframes eggTilt{0%,100%{transform:none}20%{transform:rotate(-1.2deg)}60%{transform:rotate(1.2deg)}}
  .egg-blackout{position:fixed;inset:0;z-index:9996;background:#000;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;color:#F0F4F8;font-family:"IBM Plex Mono",Menlo,monospace;letter-spacing:.3em;font-size:12px;text-align:center;padding:24px;animation:eggIn .4s}
  .egg-blackout i{width:6px;height:6px;border-radius:50%;background:#D7FF1F;display:block;animation:eggBlink 1.2s infinite}
  @keyframes eggBlink{50%{opacity:.1}}
  @keyframes eggIn{from{opacity:0}}
  .egg-marquee{position:fixed;z-index:9998;left:0;right:0;top:50%;transform:translateY(-50%);overflow:hidden;pointer-events:none;background:rgba(13,13,13,.85);border-top:2px solid #D7FF1F;border-bottom:2px solid #D7FF1F;padding:14px 0}
  .egg-marquee div{display:flex;gap:64px;width:max-content;font:700 40px/1 "Fraunces",Georgia,serif;color:#F0F4F8;animation:eggMarq 6s linear forwards;white-space:nowrap}
  @keyframes eggMarq{from{transform:translateX(100vw)}to{transform:translateX(-100%)}}
  .egg-highway{position:fixed;z-index:9998;left:-10vw;right:-10vw;top:46%;height:9vh;background:repeating-linear-gradient(90deg,#333 0 60px,#333 60px 120px);border-top:8px solid #444;border-bottom:8px solid #444;pointer-events:none;animation:eggRoad 5s ease-in-out forwards;transform:rotate(-3deg)}
  .egg-highway:before{content:"";position:absolute;left:0;right:0;top:50%;height:4px;background:repeating-linear-gradient(90deg,#FFD400 0 40px,transparent 40px 80px);transform:translateY(-50%)}
  .egg-highway span{position:absolute;left:0;top:-38px;font-size:34px;animation:eggRun 5s linear forwards}
  @keyframes eggRoad{0%{opacity:0;transform:translateX(-100vw) rotate(-3deg)}15%{opacity:1;transform:translateX(0) rotate(-3deg)}85%{opacity:1;transform:translateX(0) rotate(-3deg)}100%{opacity:0;transform:translateX(100vw) rotate(-3deg)}}
  .egg-hotdog{position:fixed;z-index:9998;right:24px;bottom:120px;font-size:64px;line-height:1;pointer-events:none;animation:eggPop .6s cubic-bezier(.2,.8,.2,1) both}
  @keyframes eggPop{from{transform:scale(0) rotate(-30deg);opacity:0}to{transform:none;opacity:1}}
  .egg-knicks{position:fixed;inset:0;pointer-events:none;z-index:9995;background:radial-gradient(circle at 50% 120%,rgba(245,132,38,.35),transparent 60%);animation:eggIn .5s}
  @media (prefers-reduced-motion:reduce){.egg-runner.go,.egg-fall,.egg-tilt,.egg-marquee div,.egg-highway,.egg-highway span{animation-duration:.01s!important}}
  `;
  document.head.appendChild(css);

  function toast(title, msg, ms){
    let t=document.querySelector(".egg-toast"); if(!t){t=document.createElement("div");t.className="egg-toast";document.body.appendChild(t);}
    t.innerHTML=`<b>${title}</b>${msg}`; t.classList.add("show"); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove("show"), ms||4200);
  }
  function mark(name, title, msg){
    const first = !found.has(name); found.add(name);
    try{ localStorage.setItem("ny_eggs", JSON.stringify([...found])); }catch(e){}
    toast((first?"EASTER EGG FOUND · ":"AGAIN · ")+title+(first?` · ${found.size} OF ${Object.keys(EGGS).length}`:""), msg);
    try{ document.dispatchEvent(new CustomEvent("ny:egg",{detail:{name,first,count:found.size}})); }catch(e){}
    try{ if(first && window.NY && NY.track) NY.track("egg", name); }catch(e){}
  }
  function runner(emojis, t, rev){
    const el=document.createElement("div"); el.className="egg-runner"; el.style.setProperty("--t",(t||6)+"s");
    el.innerHTML=emojis.map(e=>`<span class="b">${e}</span>`).join("");
    if(rev) el.style.transform="scaleX(-1)";
    document.body.appendChild(el); requestAnimationFrame(()=>el.classList.add("go")); setTimeout(()=>el.remove(),(t||6)*1000+200);
  }
  function rain(texts, n){
    for(let i=0;i<(n||18);i++){ const el=document.createElement("div"); el.className="egg-fall"; el.textContent=texts[i%texts.length]; el.style.left=Math.random()*94+"vw"; el.style.setProperty("--t",(3.5+Math.random()*3)+"s"); el.style.setProperty("--r",(Math.random()*40-20)+"deg"); el.style.animationDelay=(Math.random()*1.4)+"s"; document.body.appendChild(el); setTimeout(()=>el.remove(),8000); }
  }
  const EGGS = {
    rat(){ runner(["🐀","🍕"], 5.5); mark("rat","PIZZA RAT","September 21, 2015. A rat carried a whole slice down the stairs at 1st Avenue. The city watched. Nobody helped. Nobody had to."); },
    bodega(){ runner(["🐈","🧃"], 9); mark("bodega","THE BODEGA CAT","Health code says no. The cat says nothing. The cat has been here longer than the owner. The cat is counted."); },
    pigeon(){ for(let i=0;i<5;i++) setTimeout(()=>runner(["🕊️"], 4+Math.random()*3, Math.random()>.5), i*350); mark("pigeon","THE UNCOUNTED","Number 0000. Rock dove, Columba livia, resident since the 1600s. Never registered, never leaving. See pigeon.html."); },
    showtime(){ document.body.classList.remove("egg-tilt"); void document.body.offsetWidth; document.body.classList.add("egg-tilt"); const m=document.createElement("div"); m.className="egg-marquee"; m.innerHTML=`<div>${"SHOWTIME! · WHAT TIME IS IT? · SHOWTIME! · MIND THE POLE · SHOWTIME! · ".repeat(3)}</div>`; document.body.appendChild(m); setTimeout(()=>m.remove(),6200); mark("showtime","SHOWTIME","It is showtime. Keep your feet on the floor and your head out of the pole line. The dancers are Underground family, and they are counted."); },
    moses(){ const h=document.createElement("div"); h.className="egg-highway"; h.innerHTML=`<span>🚗</span>`; document.body.appendChild(h); setTimeout(()=>h.remove(),5200); mark("moses","THE POWER BROKER","Robert Moses tried to put an expressway through Washington Square, SoHo and Little Italy. Jane Jacobs and the neighborhood said no. This one lasted five seconds."); },
    "1977"(){ const b=document.createElement("div"); b.className="egg-blackout"; b.innerHTML=`<i></i><div>JULY 13, 1977 · 9:34 PM</div><div style="opacity:.6;letter-spacing:.2em;font-size:11px">THE CITY WENT DARK FOR 25 HOURS. THE CENSUS KEPT COUNTING.</div>`; document.body.appendChild(b); setTimeout(()=>b.remove(),3600); mark("1977","THE BLACKOUT","Lightning hit the lines, the grid fell at 9:34 PM, and the lights came back the next night. Read about it in the reading room."); },
    bagel(){ runner(["🥯","🥯","🥯"], 7); mark("bagel","EVERYTHING","It is the water. It is not the water. It is the water. The census records both positions and takes no side."); },
    fuhgeddaboudit(){ rain(["FUHGEDDABOUDIT","LEAVING BROOKLYN","OY VEY!","WELCOME TO THE BRONX","QUEENS: THE WORLD'S BOROUGH","STATEN ISLAND, TOO"], 16); mark("fuhgeddaboudit","LEAVING BROOKLYN","The sign on the BQE said it first. The census says it back."); },
    rent(){ rain(["THE RENT IS TOO DAMN HIGH","NOTICE: RENT DUE","BROKER FEE: ONE MONTH","NO FEE (THERE IS A FEE)","LANDLORD SPECIAL","RENT STABILIZED","KEY MONEY"], 22); mark("rent","THE RENT IS TOO DAMN HIGH","Jimmy McMillan ran for governor in 2010 on one sentence. It is still true. It is the only platform the census endorses."); },
    hotdog(){ const el=document.createElement("div"); el.className="egg-hotdog"; el.textContent="🌭"; document.body.appendChild(el); setTimeout(()=>el.remove(),4000); mark("hotdog","DIRTY WATER DOG","Nathan Handwerker opened his Coney Island stand in 1916 and charged a nickel. The cart on the corner is still cheaper than the subway. Barely."); },
    knicks(){ const k=document.createElement("div"); k.className="egg-knicks"; document.body.appendChild(k); rain(["KNICKS","GO NY GO","MSG","THE GARDEN","BING BONG"], 14); setTimeout(()=>k.remove(),5000); mark("knicks","THE GARDEN","Madison Square Garden has stood on four sites since 1879. The current one opened in 1968 over Penn Station. The premise of this census begins with a parade."); },
    konami(){ rain(["EVERY NEW YORKER GETS A PORTRAIT","EVEN THE VILLAINS","THE CITY IS WATCHING BACK","GET COUNTED","NO. 0000 IS A PIGEON","YOU FOUND THE CODE"], 26); runner(["🗽","🚕","🐀","🍕","🕊️"], 8); mark("konami","THE CODE","Up up down down left right left right B A. Thirty lives. The census only needs one of yours. Type rat, bodega, pigeon, showtime, moses, 1977, bagel, hotdog, knicks, fuhgeddaboudit, or click the eye five times."); },
    vault(){ rain(["$25,000","NOT HERE","COLDER","DECOY","KEEP LOOKING"], 24); mark("vault","A DECOY","This is not the key and it was never going to be. The vault takes four answers, and none of them are typed into a page that already tells you the answer. Read the census."); },
    eye(){ rain(["👁️"], 30); mark("eye","THE EYE","You clicked the eye five times. It blinked. That is the first time it has ever blinked in a still. Do not tell anyone."); }
  };
  window.NY_EGG = (n)=>{ const f=EGGS[n]; if(f) f(); return !!f; };
  window.NY_EGGS_FOUND = ()=>[...found];
  window.NY_EGGS_TOTAL = Object.keys(EGGS).length;
  /* The hunt is only a loop if you can see how far in you are. */
  window.NY_EGGS_NAMES = Object.keys(EGGS);

  /* typed words */
  const WORDS = Object.keys(EGGS).filter(k=>!["konami","eye"].includes(k));
  let buf = "";
  addEventListener("keydown", (e)=>{
    if(e.metaKey||e.ctrlKey||e.altKey) return;
    const t=e.target; if(t && t.closest && t.closest("input,textarea,select,[contenteditable]")) return;
    if(e.key.length!==1) return;
    buf=(buf+e.key.toLowerCase()).slice(-24);
    for(const w of WORDS){ if(buf.endsWith(w)){ buf=""; EGGS[w](); break; } }
  });
  /* the Konami code */
  const KONAMI=["arrowup","arrowup","arrowdown","arrowdown","arrowleft","arrowright","arrowleft","arrowright","b","a"]; let ki=0;
  addEventListener("keydown",(e)=>{ const k=e.key.toLowerCase(); ki = k===KONAMI[ki] ? ki+1 : (k===KONAMI[0]?1:0); if(ki===KONAMI.length){ ki=0; EGGS.konami(); } });
  /* five clicks on any logo or eye */
  let clicks=0, ct=0;
  document.addEventListener("click",(e)=>{
    const img=e.target.closest && e.target.closest('img[src*="brand/logo"],img[src*="eye_truecolor"]');
    if(!img) return;
    const now=Date.now(); clicks = now-ct<900 ? clicks+1 : 1; ct=now;
    if(clicks>=5){ clicks=0; e.preventDefault(); EGGS.eye(); }
  }, true);
  /* url triggers: ?egg=rat, and the hidden bag */
  try{ const q=new URLSearchParams(location.search); const n=q.get("egg"); if(n && EGGS[n]) setTimeout(()=>EGGS[n](), 900); }catch(e){}
  /* the console */
  /* Decoys. None of these open the vault. They are here to be found and to cost time. */
  try{
    const D=["4a7f2c9e","THE-EYE-NEVER-BLINKS","0000-1811-GRID","fragment 3 of 4: BOWERY","vault key part: 2003","KEY=THE-CITY-IS-WATCHING-BACK"];
    console.log("%cTHE VAULT%c  something in here is worth $25,000. Most of what you find is not.\n%c"+D.join("\n"),"font:700 16px monospace;color:#D7FF1F","font:12px monospace;color:#8899AA","font:11px monospace;color:#2A3040");
  }catch(e){}
  try{
    console.log("%cNEW YORKERS%c by MLow\n%cEvery New Yorker gets a portrait. Even the villains.\n%cYou opened the console. That counts. Try NY_EGG('rat'). The bots' door is /agents.html and /llms.txt.","font:700 28px Georgia,serif;color:#F0F4F8;background:#0D0D0D;padding:6px 10px","font:14px Georgia,serif;color:#8899AA","font:italic 14px Georgia,serif;color:#00E5FF","font:12px Menlo,monospace;color:#8899AA");
  }catch(e){}
})();
