#!/usr/bin/env python3
"""honoraries.html: every real person MLow has painted into NEW YORKERS, grouped by what they do.

Reads _build/honoraries/honoraries.json (written by _build/honoraries/sync.py, which also fills
assets/honoraries/). Cards are rendered into the HTML so names and handles are crawlable; the script
only filters, searches and opens the lightbox. Runs in build_all.sh before build_seo.py.
"""
import os, json, html
from page_shell import shell, cfg

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
D = json.load(open(os.path.join(HERE, "honoraries", "honoraries.json")))
CATS, PPL = D["cats"], D["people"]
N = len(PPL)
NW = sum(len(p["works"]) for p in PPL)
CATN = {c["code"]: c["name"] for c in CATS}
CARDS = json.load(open(os.path.join(HERE, "honoraries", "cards.json")))  # build_honor_cards.py
missing = [p["id"] for p in PPL if p["id"] not in CARDS]
assert not missing, f"no card for {missing[:5]}: run build_honor_cards.py"
e = lambda s: html.escape(str(s or ""), quote=True)
ACCS = ["var(--acid)", "var(--pink)", "var(--cyan)", "#FFB020", "#B388FF"]
ACC = {c["code"]: ACCS[i % len(ACCS)] for i, c in enumerate(CATS)}
SHORT = {"Collectors and curators": "Collectors", "Founders and investors": "Founders", "Writers and media": "Media",
         "Film and stage": "Film and stage", "Politics and civic": "Civic"}


def tag(p):
    t = e(CATN[p["cat"]].upper())
    if len(p["works"]) > 1:
        t += f' &middot; {len(p["works"])} PAINTINGS'
    if any(w.get("key") for w in p["works"]):
        t += ' <b class="ks">KEYSTONE</b>'
    return t


def handle(p):
    if p["x"]:
        return f'<a class="hd" href="https://x.com/{e(p["x"])}" target="_blank" rel="noopener">{e(p["handle"])}</a>'
    if p["handle"]:
        return f'<span class="hd">{e(p["handle"])}</span>'
    return f'<span class="hd none">NEW YORKERS NO. {p["works"][0]["num"]:04d}</span>'


def card(i, p):
    q = f'{p["name"]} {p["handle"]}'.lower()
    return (f'<li class="hc" data-i="{i}" data-q="{e(q)}"><button class="ph" type="button" aria-label="Open the portrait of {e(p["name"])}">'
            f'<img src="assets/honoraries/{p["works"][0]["s"]}" alt="{e(p["name"])}, painted by MLow as a New Yorker" loading="lazy" width="400" height="400"></button>'
            f'<div class="bar"></div><h3>{e(p["name"])}</h3>{handle(p)}'
            + (f'<p class="bio">{e(p["bio"])}</p>' if p.get("bio") else "")
            + (f'<a class="iv" href="{e(p["iv"][-1]["url"])}" target="_blank" rel="noopener">{"Watch the interviews" if len(p["iv"]) > 1 else "Watch the interview"}</a>' if p.get("iv") else "")
            + f'<div class="tg">{tag(p)}<i class="eye"></i></div></li>')


sections, tabs = [], [f'<button class="tab on" data-ch="all">EVERYONE <span>{N}</span></button>']
for c in CATS:
    ppl = [(i, p) for i, p in enumerate(PPL) if p["cat"] == c["code"]]
    if not ppl:
        continue
    code, name = c["code"], c["name"]
    tabs.append(f'<button class="tab" data-ch="{code}" style="--a:{ACC[code]}">{e(SHORT.get(name, name).upper())} <span>{len(ppl)}</span></button>')
    sections.append(f'''<section class="chap" data-ch="{code}" style="--a:{ACC[code]}" id="{e(name.lower().replace(" ", "-"))}">
<header><div><h2>{e(name)}</h2><p class="sub"><span>{len(ppl)} {"person" if len(ppl) == 1 else "people"}</span></p></div></header>
<ul class="grid">{"".join(card(i, p) for i, p in ppl)}</ul></section>''')

# two drifting rows of faces for the masthead, one from each end of the list
row = lambda ps: "".join(f'<img src="assets/honoraries/{p["works"][0]["s"]}" alt="" loading="lazy">' for p in ps)
pick = PPL[::max(1, N // 64)][:64]
rowA, rowB = row(pick[:32]), row(pick[32:])

counts = " &middot; ".join(f'{sum(1 for p in PPL if p["cat"] == c["code"])} {e(SHORT.get(c["name"], c["name"]))}' for c in CATS)
DATA = json.dumps([{"id": p["id"], "card": CARDS[p["id"]]["card"], "name": p["name"], "handle": p["handle"], "x": p["x"], "cat": p["cat"], "bio": p.get("bio", ""), "iv": p.get("iv", []),
                    "works": [{k: w.get(k) for k in ("title", "l", "w", "h", "num", "key", "rec")} for w in p["works"]]} for p in PPL],
                  ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")

body = f'''<main class="hon">
<section class="mast">
 <div class="drift" aria-hidden="true"><div class="row a">{rowA}{rowA}</div><div class="row b">{rowB}{rowB}</div></div>
 <div class="mast-in wrap">
  <p class="kicker">NEW YORKERS &middot; THE HONORARIES</p>
  <h1>The Honor&shy;aries.</h1>
  <p class="lede">Every real person MLow has painted into NEW YORKERS, in one room: the artists and collectors of his world,
  the guests of The MLow Show, and the musicians, athletes, chefs, writers and mayors who make New York what it is.
  <b>{N} people, {NW} paintings, and counting.</b></p>
  <p class="counts">{counts}</p>
 </div>
</section>
<div class="tools wrap"><div class="tabs" role="tablist">{"".join(tabs)}</div>
 <label class="find"><span class="sr">Find a name or handle</span><input id="q" type="search" placeholder="Find a name or @handle" autocomplete="off"></label></div>
<p class="none wrap" id="none" hidden>No one by that name yet. <a href="counted.html#nominate">Nominate a New Yorker</a>.</p>
<div class="wrap">{"".join(sections)}</div>
<section class="close wrap"><p class="k">THE COUNT KEEPS GOING</p><h2>Know someone who belongs here?</h2>
 <p>Every New Yorker gets a portrait. Tell MLow who is missing.</p>
 <p class="ctas"><a class="btn" href="counted.html#nominate">Nominate a New Yorker</a><a class="btn ghost" href="census.html">Walk the whole census</a></p>
 <div id="share"></div></section>
</main>
<dialog id="lb" aria-label="Portrait">
 <button class="x" type="button" aria-label="Close">&times;</button>
 <button class="nv pv" type="button" aria-label="Previous">&#8249;</button><button class="nv nx" type="button" aria-label="Next">&#8250;</button>
 <figure><div class="frame"><img id="lbi" alt=""></div><figcaption>
  <p class="k" id="lbk"></p><h2 id="lbn"></h2><p id="lbh"></p><p class="lbio" id="lbb"></p><p class="t" id="lbt"></p><div class="works" id="lbw"></div><p id="lbr"></p><div class="ivs" id="lbv"></div>
  <div class="tcg" id="lbc"><p class="k">THE HONORARY CARD</p><a class="tcg-card" id="lbci" target="_blank" rel="noopener"><img alt="" loading="lazy"></a>
   <div class="tcg-btns"><a class="btn sm" id="lbme" target="_blank" rel="noopener">This is me. Post my card</a><a class="btn sm ghost" id="lbx" target="_blank" rel="noopener">Share on X</a><a class="btn sm ghost" id="lbsv" download>Save the card</a></div></div></figcaption></figure>
</dialog>
<script>window.HON={DATA};window.HON_CAT={json.dumps(CATN)};</script>'''

JS = r'''<script>
(function(){
  var H=window.HON, CATN=window.HON_CAT, cards=[].slice.call(document.querySelectorAll(".hc")), secs=[].slice.call(document.querySelectorAll(".chap"));
  var tabs=[].slice.call(document.querySelectorAll(".tab")), q=document.getElementById("q"), none=document.getElementById("none"), cur="all";
  function apply(){
    var s=(q.value||"").trim().toLowerCase().replace(/^@/,""), shown=0;
    cards.forEach(function(c){ var ok=(cur==="all"||H[+c.dataset.i].cat===cur)&&(!s||c.dataset.q.replace(/@/g,"").indexOf(s)>=0); c.hidden=!ok; if(ok)shown++; });
    secs.forEach(function(x){ x.hidden=!x.querySelector(".hc:not([hidden])"); });
    none.hidden=shown>0;
  }
  tabs.forEach(function(t){ t.onclick=function(){ tabs.forEach(function(u){u.classList.toggle("on",u===t)}); cur=t.dataset.ch; apply();
    if(cur!=="all"){ var el=document.querySelector('.chap[data-ch="'+cur+'"]'); if(el) window.scrollTo({top:el.getBoundingClientRect().top+scrollY-document.querySelector(".tools").offsetHeight-70,behavior:"smooth"}); } }; });
  q.addEventListener("input",apply);
  var lb=document.getElementById("lb"), idx=0, order=[];
  function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;")}
  function show(i,wi){
    idx=i; wi=wi||0; var p=H[i], w=p.works[wi], im=document.getElementById("lbi");
    im.src="assets/honoraries/"+w.l; im.alt=p.name+", painted by MLow"; im.width=w.w; im.height=w.h;
    document.getElementById("lbk").textContent=CATN[p.cat].toUpperCase()+(w.num!=null?" · NEW YORKERS NO. "+String(w.num).padStart(4,"0"):"")+(w.key?" · KEYSTONE":"");
    document.getElementById("lbn").textContent=p.name;
    document.getElementById("lbb").textContent=p.bio||"";
    var MO=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], lv=document.getElementById("lbv");
    lv.innerHTML=p.iv.length?'<p class="k">INTERVIEWS</p>'+p.iv.map(function(v){ var d=v.date.split("-");
      return '<a class="btn sm ghost" href="'+esc(v.url)+'" target="_blank" rel="noopener">'+esc(v.show)+(v.label?", "+esc(v.label):"")+", "+MO[+d[1]-1]+" "+d[0]+'</a>'; }).join(""):"";
    var wb=document.getElementById("lbw"); wb.innerHTML="";
    if(p.works.length>1) p.works.forEach(function(x,j){ var b=document.createElement("button"); b.type="button"; b.className=j===wi?"on":""; b.textContent=j===0?"Portrait":"In the census";
      b.onclick=function(){show(i,j)}; wb.appendChild(b); });
    document.getElementById("lbh").innerHTML=p.x?'<a href="https://x.com/'+esc(p.x)+'" target="_blank" rel="noopener">'+esc(p.handle)+' on X</a>':esc(p.handle||"");
    document.getElementById("lbt").textContent=w.title?"“"+w.title+"”":"";
    card(p);
    if(history.replaceState) history.replaceState(null,"","#"+p.id);
    document.getElementById("lbr").innerHTML=w.rec?'<a class="btn sm" href="n/'+esc(w.rec)+'.html">Open the census record</a>':"";
  }
  /* The card: X's post intent cannot carry a picture, so the link goes to h/<id>, whose og:image is the
     card and unfurls in the timeline. Where the browser can share files (phones), the button hands the
     card itself to the share sheet instead, so it lands in the X app attached. */
  var SITE=(window.NY_CONFIG&&NY_CONFIG.siteUrl||"https://n3wyorkers.com").replace(/\/$/,""), blob=null;
  function intent(t,u){ return "https://x.com/intent/tweet?text="+encodeURIComponent(t)+"&url="+encodeURIComponent(u); }
  function lines(p){ var tag=p.x?"@"+p.x:p.name;
    return {me:"@degens painted me into NEW YORKERS. Honorary New Yorker, counted.",
            them:tag+(p.x?" ("+p.name+")":"")+(/ and /.test(p.name)?" are Honorary New Yorkers":" is an Honorary New Yorker")+", painted by @degens into NEW YORKERS."}; }
  function card(p){
    var u=SITE+"/h/"+p.id, src="assets/cards/"+p.card, L=lines(p), me=document.getElementById("lbme");
    var ci=document.getElementById("lbci"); ci.href="h/"+p.id+".html"; ci.firstChild.src=src; ci.firstChild.alt="The Honorary card for "+p.name;
    me.href=intent(L.me,u); document.getElementById("lbx").href=intent(L.them,u);
    var sv=document.getElementById("lbsv"); sv.href=src; sv.setAttribute("download","honorary-new-yorker-"+p.id+".jpg");
    blob=null; me.onclick=null;
    if(navigator.canShare&&matchMedia("(pointer:coarse)").matches){
      fetch(src).then(function(r){return r.blob()}).then(function(b){ var f=new File([b],"honorary-new-yorker-"+p.id+".jpg",{type:"image/jpeg"});
        if(!navigator.canShare({files:[f]})) return; blob=f;
        me.onclick=function(ev){ if(!blob) return; ev.preventDefault(); navigator.share({files:[blob],text:L.me+" "+u}).catch(function(){}); }; }).catch(function(){});
    }
  }
  function step(d){ var vis=cards.filter(function(c){return !c.hidden}).map(function(c){return +c.dataset.i}); var k=vis.indexOf(idx); if(k<0)return; show(vis[(k+d+vis.length)%vis.length]); }
  cards.forEach(function(c){ c.querySelector(".ph").onclick=function(){ show(+c.dataset.i); if(lb.showModal) lb.showModal(); else lb.setAttribute("open",""); }; });
  lb.querySelector(".x").onclick=function(){lb.close()};
  lb.addEventListener("close",function(){ if(history.replaceState) history.replaceState(null,"",location.pathname+location.search); });
  lb.querySelector(".pv").onclick=function(){step(-1)}; lb.querySelector(".nx").onclick=function(){step(1)};
  lb.addEventListener("click",function(ev){ if(ev.target===lb) lb.close(); });
  document.addEventListener("keydown",function(ev){ if(!lb.open)return; if(ev.key==="ArrowRight")step(1); if(ev.key==="ArrowLeft")step(-1); });
  if(window.NY&&NY.shareRow) NY.shareRow(document.getElementById("share"),{text:"Every real person MLow has painted into NEW YORKERS. The Honoraries."});
  var h=(location.hash||"").slice(1), byId=H.findIndex(function(p){return p.id===h});
  if(byId>=0){ show(byId); if(lb.showModal) lb.showModal(); else lb.setAttribute("open",""); h=""; }
  if(h){ var t=tabs.find(function(x){ var s=document.querySelector('.chap[data-ch="'+x.dataset.ch+'"]'); return s&&s.id===h; }); if(t) t.click(); }
})();
</script>'''

CSS = r'''
.hon{padding-top:64px}
.mast{position:relative;overflow:hidden;min-height:min(78vh,720px);display:flex;align-items:flex-end;border-bottom:1px solid var(--divider)}
.drift{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;gap:18px;opacity:.5;transform:rotate(-6deg) scale(1.15)}
.drift .row{display:flex;gap:18px;width:max-content;animation:hdrift 90s linear infinite}
.drift .row.b{animation-direction:reverse;animation-duration:110s}
.drift img{width:150px;height:150px;border-radius:50%;object-fit:cover;flex:none;box-shadow:0 0 0 3px rgba(240,244,248,.08)}
@keyframes hdrift{to{transform:translateX(-50%)}}
.mast:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(13,13,13,.35) 0%,rgba(13,13,13,.55) 45%,var(--ink) 100%),radial-gradient(ellipse at 20% 80%,rgba(13,13,13,.9),transparent 60%)}
.mast-in{position:relative;z-index:1;padding-bottom:56px;padding-top:120px;max-width:1100px}
.mast h1{font-family:var(--display);font-weight:800;font-size:clamp(64px,13vw,188px);line-height:.88;letter-spacing:-.02em;margin:18px 0 26px;font-variation-settings:"SOFT" 30,"WONK" 1}
.mast .lede{font-family:var(--sans);font-size:clamp(17px,1.6vw,21px);line-height:1.6;color:#C9D2DC;max-width:720px}
.mast .lede b{color:var(--acid);font-weight:600}
.mast .counts{font-family:var(--mono);font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--slate);margin-top:22px;line-height:1.9}
.tools{position:sticky;top:56px;z-index:20;display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between;padding-top:14px;padding-bottom:14px;background:rgba(13,13,13,.9);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid var(--divider)}
.tabs{display:flex;gap:8px;flex-wrap:wrap}
.tab{--a:var(--cloud);font-family:var(--mono);font-size:12px;letter-spacing:.12em;padding:9px 14px;border-radius:999px;border:1px solid var(--divider);background:transparent;color:var(--cloud);transition:all .2s var(--ease)}
.tab span{color:var(--slate);margin-left:4px}
.tab:hover{border-color:var(--a)}
.tab.on{background:var(--a);border-color:var(--a);color:var(--ink)}
.tab.on span{color:rgba(13,13,13,.6)}
.find input{font-family:var(--sans);font-size:15px;width:min(300px,80vw);padding:10px 16px;border-radius:999px;border:1px solid var(--divider);background:var(--card);color:var(--cloud)}
.find input:focus{outline:none;border-color:var(--cyan)}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
p.none{font-family:var(--sans);color:var(--slate);padding-top:48px;font-size:18px}
p.none a{color:var(--cyan)}
.chap{padding:72px 0 8px}
.chap>header{display:flex;gap:28px;align-items:flex-end;margin-bottom:34px;border-bottom:1px solid var(--divider);padding-bottom:26px}
.hc .bio{font-family:var(--sans);font-size:12.5px;line-height:1.45;color:#3A4450;margin-top:8px;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.hc .iv{display:inline-block;margin-top:9px;font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;padding:5px 9px;border-radius:999px;background:var(--ink);color:var(--cloud)}
.hc .iv:before{content:"";display:inline-block;width:0;height:0;border-left:6px solid var(--pink);border-top:4px solid transparent;border-bottom:4px solid transparent;margin-right:6px}
.hc .iv:hover{background:var(--pink);color:var(--ink)}
#lb .lbio{font-family:var(--sans);font-size:17px;line-height:1.55;color:#DDE3EA;margin:14px 0 4px}
#lb .ivs{margin-top:22px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}#lb .ivs .k{width:100%;margin-bottom:2px}
.works{display:flex;gap:8px;margin:-6px 0 20px}.works button{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;padding:8px 12px;border-radius:999px;border:1px solid var(--divider);background:transparent;color:var(--cloud)}.works button.on{background:var(--cloud);color:var(--ink)}
.chap h2:before{content:"";display:inline-block;width:14px;height:14px;border-radius:50%;background:var(--a);margin-right:16px;vertical-align:middle;transform:translateY(-4px)}
.chap .no{font-family:var(--display);font-weight:900;font-size:clamp(84px,11vw,150px);line-height:.8;color:var(--a);opacity:.95}
.chap .k,.close .k,#lb .k{font-family:var(--mono);font-size:12px;letter-spacing:.2em;color:var(--a,var(--cyan))}
.chap h2{font-family:var(--display);font-weight:700;font-size:clamp(36px,5vw,64px);line-height:1;margin:8px 0 10px}
.chap .sub{font-family:var(--sans);color:#AEB8C4;font-size:17px}
.chap .sub span{color:var(--slate)}
.grid{list-style:none;display:grid;grid-template-columns:repeat(auto-fill,minmax(186px,1fr));gap:22px 18px}
.hc{background:var(--paper);color:var(--ink);border-radius:12px;padding:10px 10px 12px;box-shadow:0 10px 30px rgba(0,0,0,.35);transition:transform .35s var(--ease),box-shadow .35s var(--ease);position:relative}
.hc:nth-child(odd):hover{transform:translateY(-6px) rotate(-1.2deg)}
.hc:nth-child(even):hover{transform:translateY(-6px) rotate(1.2deg)}
.hc:hover{box-shadow:0 22px 50px rgba(0,0,0,.55)}
.hc .ph{display:block;width:100%;padding:0;border:0;background:#ddd;border-radius:7px;overflow:hidden;aspect-ratio:1}
.hc .ph img{width:100%;height:100%;object-fit:cover;transition:transform .6s var(--ease)}
.hc:hover .ph img{transform:scale(1.05)}
.hc .bar{height:5px;border-radius:3px;background:var(--a);margin:9px 0 8px}
.hc{display:flex;flex-direction:column}.hc .tg{margin-top:auto;padding-top:10px}
.hc h3{font-family:var(--sans);font-weight:700;font-size:16px;line-height:1.2;letter-spacing:-.01em}
.hc .hd{display:block;font-family:var(--mono);font-size:12.5px;color:var(--blue);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hc a.hd:hover{color:var(--pink)}
.hc .hd.none{color:#7A8794}
.hc .tg{display:flex;justify-content:space-between;align-items:center;gap:6px;margin-top:auto;padding-top:10px;font-family:var(--mono);font-size:9.5px;letter-spacing:.1em;color:#7A8794}
.hc .ks{color:var(--pink);font-weight:600}
.eye{flex:none;width:16px;height:16px;border-radius:50%;background:radial-gradient(circle,#0D0D0D 0 22%,#00E5FF 23% 42%,#F0F4F8 43% 64%,#1A3D99 65%)}
.close{text-align:center;padding:110px 0 90px}
.close h2{font-family:var(--display);font-weight:700;font-size:clamp(36px,5vw,64px);margin:12px 0}
.close p{font-family:var(--sans);color:#AEB8C4;font-size:18px}
.ctas{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin:28px 0}
.btn{display:inline-block;font-family:var(--mono);font-size:13px;letter-spacing:.14em;text-transform:uppercase;padding:14px 22px;border-radius:999px;background:var(--acid);color:var(--ink)}
.btn:hover{color:var(--ink);background:var(--cloud)}
.btn.ghost{background:transparent;color:var(--cloud);border:1px solid var(--divider)}
.btn.ghost:hover{border-color:var(--cyan);color:var(--cyan)}
.btn.sm{padding:10px 16px;font-size:11px}
#share{display:flex;justify-content:center}
#lb .tcg{margin-top:26px;padding-top:20px;border-top:1px solid var(--divider)}
#lb .tcg .k{margin-bottom:12px}
#lb .tcg-card{display:block;width:132px;float:left;margin:0 16px 8px 0}
#lb .tcg-card img{max-height:none;width:100%;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.5);transition:transform .3s var(--ease)}
#lb .tcg-card:hover img{transform:rotate(-2deg) scale(1.04)}
#lb .tcg-btns{display:flex;flex-direction:column;gap:8px;align-items:flex-start}
#lb figcaption{max-height:92vh;overflow:auto}
#lb{border:0;padding:0;background:transparent;max-width:none;max-height:none;width:100vw;height:100vh;color:var(--cloud)}
#lb::backdrop{background:rgba(8,8,10,.92);backdrop-filter:blur(6px)}
#lb[open]{display:flex;align-items:center;justify-content:center}
#lb figure{display:flex;gap:36px;align-items:center;max-width:1400px;width:92vw;margin:auto}
#lb .frame{flex:1 1 auto;min-width:0;display:flex;justify-content:center}
#lb img{max-height:82vh;width:auto;max-width:100%;height:auto;border-radius:10px;box-shadow:var(--shadow)}
#lb figcaption{flex:0 0 300px}
#lb h2{font-family:var(--display);font-weight:800;font-size:44px;line-height:1;margin:12px 0}
#lb #lbh{font-family:var(--mono);font-size:15px}
#lb #lbh a{color:var(--cyan)}
#lb .t{font-family:var(--display);font-style:italic;font-size:20px;color:#C9D2DC;margin:18px 0 22px;line-height:1.35}
#lb .x,#lb .nv{position:fixed;border:1px solid var(--divider);background:rgba(20,24,32,.8);color:var(--cloud);border-radius:50%;width:48px;height:48px;font-size:26px;line-height:1;z-index:2}
#lb .x{top:22px;right:22px}
#lb .pv{left:22px;top:50%}
#lb .nx{right:22px;top:50%}
#lb .x:hover,#lb .nv:hover{border-color:var(--cyan);color:var(--cyan)}
@media (max-width:900px){#lb figure{flex-direction:column;gap:18px;padding:70px 0 30px;overflow:auto;max-height:100vh}#lb figcaption{flex:none;width:100%}#lb img{max-height:60vh}#lb h2{font-size:34px}#lb .pv,#lb .nx{top:auto;bottom:22px}}
@media (max-width:640px){.grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 12px}.hc{padding:8px 8px 10px}.hc{display:flex;flex-direction:column}.hc .tg{margin-top:auto;padding-top:10px}
.hc h3{font-size:14px}.hc .hd{font-size:11px}.hc .tg{font-size:8.5px}
 .chap>header{gap:16px}.tools{top:52px;gap:10px;padding-top:10px;padding-bottom:10px}.find input{width:100%;padding:8px 14px}.find{width:100%}
 .tabs{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;margin:0 calc(-1 * clamp(20px,5vw,72px));padding:0 clamp(20px,5vw,72px);width:calc(100% + 2 * clamp(20px,5vw,72px))}.tabs::-webkit-scrollbar{display:none}.tab{flex:none;padding:8px 12px;font-size:11px}.drift img{width:96px;height:96px}.mast-in{padding-bottom:36px}}
@media (prefers-reduced-motion:reduce){.drift .row{animation:none}.hc,.hc .ph img{transition:none}}
'''

C = cfg()

# One share page per honoree. These exist for X's crawler: og:image is the card on a landscape field,
# so a posted link unfurls as the card. Humans who follow the link land on the card with the same
# buttons and a way back into the page. noindex: 566 near identical pages would only dilute search.
HD = os.path.join(SITE, "h")
os.makedirs(HD, exist_ok=True)
HCSS = r'''
.hp{padding:96px 0 80px}.hp .wrap{display:grid;grid-template-columns:minmax(0,440px) minmax(0,1fr);gap:56px;align-items:center}
.hp .cardimg{width:100%;height:auto;border-radius:22px;box-shadow:0 30px 80px rgba(0,0,0,.6);transform:rotate(-1.5deg)}
.hp .k{font-family:var(--mono);font-size:12px;letter-spacing:.2em;color:var(--a)}
.hp h1{font-family:var(--display);font-weight:800;font-size:clamp(44px,6vw,84px);line-height:.95;margin:14px 0 12px}
.hp .hd{font-family:var(--mono);font-size:16px;color:var(--cyan)}
.hp .bio{font-family:var(--sans);font-size:18px;line-height:1.6;color:#C9D2DC;margin:22px 0;max-width:560px}
.hp .t{font-family:var(--display);font-style:italic;font-size:22px;color:#C9D2DC}
.hp .row{display:flex;flex-wrap:wrap;gap:10px;margin-top:26px}
.hp .btn{display:inline-block;font-family:var(--mono);font-size:12px;letter-spacing:.14em;text-transform:uppercase;padding:13px 20px;border-radius:999px;background:var(--acid);color:var(--ink)}
.hp .btn:hover{background:var(--cloud);color:var(--ink)}
.hp .btn.ghost{background:transparent;color:var(--cloud);border:1px solid var(--divider)}.hp .btn.ghost:hover{border-color:var(--cyan);color:var(--cyan)}
.hp .loop{margin-top:40px;padding-top:24px;border-top:1px solid var(--divider);font-family:var(--sans);color:var(--slate)}
.hp .loop a{color:var(--cyan)}
@media (max-width:820px){.hp .wrap{grid-template-columns:1fr;gap:32px}.hp .cardimg{max-width:420px;margin:0 auto;display:block}}
'''
HJS = r'''<script>
(function(){ var b=document.getElementById("hme"); if(!b||!navigator.canShare||!matchMedia("(pointer:coarse)").matches) return;
  var src=b.dataset.card, f=null;
  fetch(src).then(function(r){return r.blob()}).then(function(x){ var g=new File([x],b.dataset.file,{type:"image/jpeg"}); if(navigator.canShare({files:[g]})) f=g; }).catch(function(){});
  b.addEventListener("click",function(ev){ if(!f) return; ev.preventDefault(); navigator.share({files:[f],text:b.dataset.text}).catch(function(){}); });
})();
</script>'''
from urllib.parse import quote
xi = lambda t, u: "https://x.com/intent/tweet?text=" + quote(t, safe="") + "&url=" + quote(u, safe="")
for f in os.listdir(HD):
    if f.endswith(".html") and f[:-5] not in {p["id"] for p in PPL}:
        os.remove(os.path.join(HD, f))
for p in PPL:
    cd, w0 = CARDS[p["id"]], p["works"][0]
    u = f'{C["siteUrl"]}/h/{p["id"]}'
    me = "@degens painted me into NEW YORKERS. Honorary New Yorker, counted."
    them = (f'@{p["x"]} ({p["name"]})' if p["x"] else p["name"]) + (" are Honorary New Yorkers" if " and " in p["name"] else " is an Honorary New Yorker") + ", painted by @degens into NEW YORKERS."
    hb = f'''<main class="hp" style="--a:{ACC[p["cat"]]}"><div class="wrap">
<div><img class="cardimg" src="../assets/cards/{cd["card"]}" alt="The Honorary card for {e(p["name"])}, painted by MLow" width="1080" height="1512"></div>
<div><p class="k">HONORARY NEW YORKER &middot; {e(CATN[p["cat"]].upper())}</p><h1>{e(p["name"])}</h1>
{f'<a class="hd" href="https://x.com/{e(p["x"])}" target="_blank" rel="noopener">{e(p["handle"])}</a>' if p["x"] else (f'<p class="hd">{e(p["handle"])}</p>' if p["handle"] else "")}
{f'<p class="t">&ldquo;{e(w0["title"])}&rdquo;</p>' if w0.get("title") else ""}
{f'<p class="bio">{e(p["bio"])}</p>' if p.get("bio") else ""}
<div class="row"><a class="btn" id="hme" href="{e(xi(me, u))}" target="_blank" rel="noopener" data-card="../assets/cards/{cd["card"]}" data-file="honorary-new-yorker-{p["id"]}.jpg" data-text="{e(me + " " + u)}">This is me. Post my card</a>
<a class="btn ghost" href="{e(xi(them, u))}" target="_blank" rel="noopener">Share on X</a>
<a class="btn ghost" href="../assets/cards/{cd["card"]}" download="honorary-new-yorker-{p["id"]}.jpg">Save the card</a></div>
<p class="loop">One of {N} Honorary New Yorkers painted by MLow. <a href="../honoraries.html#{p["id"]}">Meet the rest</a>, or <a href="../counted.html#nominate">nominate someone who belongs here</a>.</p>
</div></div></main>'''
    open(os.path.join(HD, p["id"] + ".html"), "w", encoding="utf-8").write(shell(
        title=f'{p["name"]}, Honorary New Yorker · NEW YORKERS by MLow',
        description=(p.get("bio") or f'{p["name"]}, painted by MLow into NEW YORKERS.')[:158],
        body=hb, base="../", path=f'h/{p["id"]}.html', active="HONORARIES", extra_css=HCSS, scripts_after=HJS,
        image=f'{C["siteUrl"]}/assets/cards/{cd["og"]}', noindex=True))

page = shell(title="The Honoraries · NEW YORKERS by MLow",
             description=f"Every real person MLow has painted into NEW YORKERS: {N} people and {NW} paintings, artists, collectors, founders, musicians, athletes, chefs, writers and mayors of New York.",
             body=body, path="honoraries.html", active="HONORARIES", extra_css=CSS, scripts_after=JS,
             keywords=["NEW YORKERS by MLow", "MLow", "honorary New Yorkers", "MLow Show", "NFT artists New York", "painted portraits", "New York crypto art"],
             image=f'{C["siteUrl"]}/assets/honoraries/{PPL[0]["works"][0]["l"]}',
             jsonld={"@context": "https://schema.org", "@type": "CollectionPage", "name": "The Honoraries", "url": f'{C["siteUrl"]}/honoraries.html',
                     "description": f"{N} real people painted by MLow as New Yorkers.", "isPartOf": {"@id": C["siteUrl"] + "/#site"},
                     "about": [{"@type": "Person", "name": p["name"], **({"sameAs": f'https://x.com/{p["x"]}'} if p["x"] else {})} for p in PPL]})
open(os.path.join(SITE, "honoraries.html"), "w", encoding="utf-8").write(page)
print(f"h/: {len(PPL)} share pages")
print(f"honoraries.html: {N} people, {NW} paintings, {len(page) // 1024} KB")
