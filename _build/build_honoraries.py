#!/usr/bin/env python3
"""honoraries.html: every real person MLow has painted into NEW YORKERS, in the roll call film's seven chapters.

Reads _build/honoraries/honoraries.json (written by _build/honoraries/sync.py, which also fills
assets/honoraries/). Cards are rendered into the HTML so names and handles are crawlable; the script
only filters, searches and opens the lightbox. Runs in build_all.sh before build_seo.py.
"""
import os, json, html
from page_shell import shell, cfg

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
D = json.load(open(os.path.join(HERE, "honoraries", "honoraries.json")))
CH, PPL = D["chapters"], D["people"]
N = len(PPL)
e = lambda s: html.escape(str(s or ""), quote=True)
ACC = {"PINK": "var(--pink)", "ACID": "var(--acid)", "CYAN": "var(--cyan)", "BLUE": "var(--blue)"}


def tag(p):
    if "num" in p:
        no = f" &middot; NO. {p['num']:04d}" if p["handle"] else ""  # without a handle the number is already the second line
        return f"ERA {p['era']}{no}" + (' <b class="ks">KEYSTONE</b>' if p.get("key") else "")
    return "HONORARY NEW YORKER"


def handle(p):
    if p["x"]:
        return f'<a class="hd" href="https://x.com/{e(p["x"])}" target="_blank" rel="noopener">{e(p["handle"])}</a>'
    if p["handle"]:
        return f'<span class="hd">{e(p["handle"])}</span>'
    return f'<span class="hd none">NO. {p["num"]:04d}</span>'


def card(i, p):
    q = f'{p["name"]} {p["handle"]}'.lower()
    return (f'<li class="hc" data-i="{i}" data-q="{e(q)}"><button class="ph" type="button" aria-label="Open the portrait of {e(p["name"])}">'
            f'<img src="assets/honoraries/{p["s"]}" alt="{e(p["name"])}, painted by MLow as a New Yorker" loading="lazy" width="400" height="400"></button>'
            f'<div class="bar"></div><h3>{e(p["name"])}</h3>{handle(p)}<div class="tg">{tag(p)}<i class="eye"></i></div></li>')


sections, tabs = [], [f'<button class="tab on" data-ch="all">ALL <span>{N}</span></button>']
for ci, c in enumerate(CH):
    ppl = [(i, p) for i, p in enumerate(PPL) if p["ch"] == ci]
    tabs.append(f'<button class="tab" data-ch="{ci}" style="--a:{ACC[c["color"]]}">{e(c["name"].replace("THE ", ""))} <span>{len(ppl)}</span></button>')
    label = "paintings in the census" if ci == 0 else "honorary New Yorkers"
    sections.append(f'''<section class="chap" data-ch="{ci}" style="--a:{ACC[c["color"]]}" id="{e(c["name"].lower().replace(" ", "-"))}">
<header><div class="no">{c["num"]}</div><div><p class="k">ROLL CALL {c["num"]}</p><h2>{e(c["name"].title())}</h2><p class="sub">{e(c["sub"][0].upper() + c["sub"][1:])}. <span>{len(ppl)} {label}.</span></p></div></header>
<ul class="grid">{"".join(card(i, p) for i, p in ppl)}</ul></section>''')

# two drifting rows of faces for the masthead, one from each end of the list
row = lambda ps: "".join(f'<img src="assets/honoraries/{p["s"]}" alt="" loading="lazy">' for p in ps)
pick = PPL[::max(1, N // 64)][:64]
rowA, rowB = row(pick[:32]), row(pick[32:])

counts = " &middot; ".join(f'{sum(1 for p in PPL if p["ch"] == ci)} {c["name"].replace("THE ", "").title()}' for ci, c in enumerate(CH))
DATA = json.dumps([{k: p.get(k) for k in ("name", "handle", "x", "title", "l", "w", "h", "ch", "num", "era", "key", "rec")} for p in PPL],
                  ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")

body = f'''<main class="hon">
<section class="mast">
 <div class="drift" aria-hidden="true"><div class="row a">{rowA}{rowA}</div><div class="row b">{rowB}{rowB}</div></div>
 <div class="mast-in wrap">
  <p class="kicker">NEW YORKERS &middot; THE HONORARIES</p>
  <h1>The Honor&shy;aries.</h1>
  <p class="lede">Every real person MLow has painted into NEW YORKERS, in one room. The founders and the legends of the first era,
  the guests of The MLow Show painted as themselves, the first gifts, and the artists, builders and culture makers who make
  New York what it is. <b>{N} portraits and counting.</b></p>
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
  <p class="k" id="lbk"></p><h2 id="lbn"></h2><p id="lbh"></p><p class="t" id="lbt"></p><p id="lbr"></p></figcaption></figure>
</dialog>
<script>window.HON={DATA};window.HON_CH={json.dumps([c["name"].title() for c in CH])};</script>'''

JS = r'''<script>
(function(){
  var H=window.HON, CHN=window.HON_CH, cards=[].slice.call(document.querySelectorAll(".hc")), secs=[].slice.call(document.querySelectorAll(".chap"));
  var tabs=[].slice.call(document.querySelectorAll(".tab")), q=document.getElementById("q"), none=document.getElementById("none"), cur="all";
  function apply(){
    var s=(q.value||"").trim().toLowerCase().replace(/^@/,""), shown=0;
    cards.forEach(function(c){ var ok=(cur==="all"||c.parentNode.parentNode.dataset.ch===cur)&&(!s||c.dataset.q.replace(/@/g,"").indexOf(s)>=0); c.hidden=!ok; if(ok)shown++; });
    secs.forEach(function(x){ x.hidden=!x.querySelector(".hc:not([hidden])"); });
    none.hidden=shown>0;
  }
  tabs.forEach(function(t){ t.onclick=function(){ tabs.forEach(function(u){u.classList.toggle("on",u===t)}); cur=t.dataset.ch; apply();
    if(cur!=="all"){ var el=document.querySelector('.chap[data-ch="'+cur+'"]'); if(el) window.scrollTo({top:el.getBoundingClientRect().top+scrollY-90,behavior:"smooth"}); } }; });
  q.addEventListener("input",apply);
  var lb=document.getElementById("lb"), idx=0, order=[];
  function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;")}
  function show(i){
    idx=i; var p=H[i], im=document.getElementById("lbi");
    im.src="assets/honoraries/"+p.l; im.alt=p.name+", painted by MLow"; im.width=p.w; im.height=p.h;
    document.getElementById("lbk").textContent=(p.num!=null?("ERA "+p.era+" · NO. "+String(p.num).padStart(4,"0")+(p.key?" · KEYSTONE":"")):"HONORARY NEW YORKER")+" · "+CHN[p.ch].toUpperCase();
    document.getElementById("lbn").textContent=p.name;
    document.getElementById("lbh").innerHTML=p.x?'<a href="https://x.com/'+esc(p.x)+'" target="_blank" rel="noopener">'+esc(p.handle)+' on X</a>':esc(p.handle||"");
    document.getElementById("lbt").textContent=p.title?"“"+p.title+"”":"";
    document.getElementById("lbr").innerHTML=p.rec?'<a class="btn sm" href="n/'+esc(p.rec)+'.html">Open the census record</a>':"";
  }
  function step(d){ var vis=cards.filter(function(c){return !c.hidden}).map(function(c){return +c.dataset.i}); var k=vis.indexOf(idx); if(k<0)return; show(vis[(k+d+vis.length)%vis.length]); }
  cards.forEach(function(c){ c.querySelector(".ph").onclick=function(){ show(+c.dataset.i); if(lb.showModal) lb.showModal(); else lb.setAttribute("open",""); }; });
  lb.querySelector(".x").onclick=function(){lb.close()};
  lb.querySelector(".pv").onclick=function(){step(-1)}; lb.querySelector(".nx").onclick=function(){step(1)};
  lb.addEventListener("click",function(ev){ if(ev.target===lb) lb.close(); });
  document.addEventListener("keydown",function(ev){ if(!lb.open)return; if(ev.key==="ArrowRight")step(1); if(ev.key==="ArrowLeft")step(-1); });
  if(window.NY&&NY.shareRow) NY.shareRow(document.getElementById("share"),{text:"Every real person MLow has painted into NEW YORKERS. The Honoraries."});
  var h=(location.hash||"").slice(1); if(h){ var t=tabs.find(function(x){ var s=document.querySelector('.chap[data-ch="'+x.dataset.ch+'"]'); return s&&s.id===h; }); if(t) t.click(); }
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
.hc h3{font-family:var(--sans);font-weight:700;font-size:16px;line-height:1.2;letter-spacing:-.01em}
.hc .hd{display:block;font-family:var(--mono);font-size:12.5px;color:var(--blue);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hc a.hd:hover{color:var(--pink)}
.hc .hd.none{color:#7A8794}
.hc .tg{display:flex;justify-content:space-between;align-items:center;gap:6px;margin-top:10px;font-family:var(--mono);font-size:9.5px;letter-spacing:.1em;color:#7A8794}
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
@media (max-width:640px){.grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 12px}.hc{padding:8px 8px 10px}.hc h3{font-size:14px}.hc .hd{font-size:11px}.hc .tg{font-size:8.5px}
 .chap>header{gap:16px}.tools{top:52px;gap:10px;padding-top:10px;padding-bottom:10px}.find input{width:100%;padding:8px 14px}.find{width:100%}
 .tabs{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;margin:0 calc(-1 * clamp(20px,5vw,72px));padding:0 clamp(20px,5vw,72px);width:calc(100% + 2 * clamp(20px,5vw,72px))}.tabs::-webkit-scrollbar{display:none}.tab{flex:none;padding:8px 12px;font-size:11px}.drift img{width:96px;height:96px}.mast-in{padding-bottom:36px}}
@media (prefers-reduced-motion:reduce){.drift .row{animation:none}.hc,.hc .ph img{transition:none}}
'''

C = cfg()
page = shell(title="The Honoraries · NEW YORKERS by MLow",
             description=f"Every real person MLow has painted into NEW YORKERS: {N} portraits, from the founders of Era I to the guests of The MLow Show, the first gifts, and the artists, builders and culture makers of New York.",
             body=body, path="honoraries.html", active="HONORARIES", extra_css=CSS, scripts_after=JS,
             keywords=["NEW YORKERS by MLow", "MLow", "honorary New Yorkers", "MLow Show", "NFT artists New York", "painted portraits", "New York crypto art"],
             image=f'{C["siteUrl"]}/assets/honoraries/{PPL[0]["l"]}',
             jsonld={"@context": "https://schema.org", "@type": "CollectionPage", "name": "The Honoraries", "url": f'{C["siteUrl"]}/honoraries.html',
                     "description": f"{N} real people painted by MLow as New Yorkers.", "isPartOf": {"@id": C["siteUrl"] + "/#site"},
                     "about": [{"@type": "Person", "name": p["name"], **({"sameAs": f'https://x.com/{p["x"]}'} if p["x"] else {})} for p in PPL]})
open(os.path.join(SITE, "honoraries.html"), "w", encoding="utf-8").write(page)
print(f"honoraries.html: {N} portraits, {len(CH)} chapters, {len(page) // 1024} KB")
