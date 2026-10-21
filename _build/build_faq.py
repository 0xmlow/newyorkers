#!/usr/bin/env python3
"""faq.html: everything people ask about NEW YORKERS, from _build/learn/faq.json.
Carries FAQPage structured data so the answers can win a rich result, and an in page filter."""
import json, os, html
from page_shell import shell, esc, no_dash, cfg
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
C = cfg(); URL = C["siteUrl"]
# Live numbers: faq.json writes {pieces}, {located} and {rooms}, filled here from counts.js so the answers never go stale.
_cj = open(os.path.join(SITE, "assets", "counts.js"), encoding="utf-8").read()
_K = json.loads(_cj[_cj.index("{"):_cj.rindex("}") + 1])
NUMS = {"pieces": f'{_K["counts"]["pieces"]:,}', "located": f'{_K["counts"]["located"]:,}', "rooms": f'{_K["rooms"]:,}'}
_raw = open(os.path.join(HERE, "learn", "faq.json"), encoding="utf-8").read()
for _k, _v in NUMS.items(): _raw = _raw.replace("{" + _k + "}", _v)
FAQ = json.loads(_raw)
items = [(s["section"], it) for s in FAQ for it in s["items"]]
print(f"{len(FAQ)} sections, {len(items)} questions")

nav = "".join(f'<a href="#s{i}">{esc(s["section"])}</a>' for i, s in enumerate(FAQ))
body_parts = []
for i, s in enumerate(FAQ):
    qs = "".join(
        f'<details id="q-{esc(it["q"][:40].lower().replace(" ", "-").replace("?", ""))}"><summary>{esc(it["q"])}</summary><p>{esc(it["a"])}</p></details>'
        for it in s["items"])
    body_parts.append(f'<section class="fs" id="s{i}"><h2>{esc(s["section"])}</h2><div class="faq">{qs}</div></section>')

body = f"""
<section class="wrap" style="padding-top:64px;padding-bottom:20px">
  <div class="kicker">Frequently asked</div>
  <h1 class="h-xl" style="margin-top:14px;max-width:1000px">Everything about NEW YORKERS.</h1>
  <p class="lede" style="margin-top:20px;max-width:820px;color:var(--slate)">The idea, the lore, how the collection is built, what a set is, what the traits do, how the release works, and what you actually own. {len(items)} questions, answered straight.</p>
  <input id="ff" placeholder="Search the questions" autocomplete="off">
  <div class="share" id="share" style="margin-top:18px"></div>
</section>
<section class="wrap" style="padding-bottom:100px">
  <div class="faqwrap">
    <aside class="toc"><div class="kicker" style="font-size:10px;margin-bottom:12px">Contents</div>{nav}</aside>
    <div class="cols">{"".join(body_parts)}
      <p class="body" id="noq" hidden style="margin-top:30px">Nothing matches that. <button class="btn ghost sm" onclick="document.getElementById('ff').value='';document.getElementById('ff').dispatchEvent(new Event('input'))">Clear</button></p>
      <div style="margin-top:56px;border-top:1px solid var(--divider);padding-top:26px">
        <p class="body">Still unanswered? Write to <a href="https://x.com/degens" target="_blank" rel="noopener" style="color:var(--cyan)">@degens on X</a>, or start in <a href="museum.html#room=random" style="color:var(--cyan)">a random room of the museum</a>.</p>
      </div>
    </div>
  </div>
</section>"""
extra_css = """
#ff{margin-top:26px;width:min(560px,100%);background:var(--card);border:1px solid var(--divider);color:var(--cloud);font-family:var(--sans);font-size:15px;padding:14px 16px;border-radius:8px;outline:none}
#ff:focus{border-color:var(--blue)}
.faqwrap{display:grid;grid-template-columns:230px 1fr;gap:52px;align-items:start}
@media (max-width:900px){.faqwrap{grid-template-columns:1fr;gap:24px}.toc{position:static!important;display:flex;flex-wrap:wrap;gap:6px}}
.toc{position:sticky;top:90px}
.toc a{display:block;font-family:var(--sans);font-size:13.5px;line-height:1.4;color:var(--slate);padding:7px 0;border-left:2px solid transparent;padding-left:12px;margin-left:-12px}
.toc a:hover,.toc a.on{color:var(--cloud);border-color:var(--cyan)}
.fs{margin-bottom:52px}
.fs h2{font-size:clamp(24px,2.6vw,34px);font-weight:600;letter-spacing:-.01em;margin-bottom:6px}
.faq details{border-top:1px solid var(--divider);padding:16px 0}
.faq details:last-child{border-bottom:1px solid var(--divider)}
.faq summary{cursor:pointer;font-size:clamp(16.5px,1.5vw,19px);font-weight:600;list-style:none;display:flex;justify-content:space-between;gap:16px;line-height:1.35}
.faq summary::-webkit-details-marker{display:none}
.faq summary::after{content:"+";font-family:var(--mono);color:var(--cyan);flex:none}
.faq details[open] summary::after{content:"–"}
.faq details[open] summary{color:var(--cloud)}
.faq p{font-family:var(--sans);font-size:16px;line-height:1.72;color:#CFD3CC;margin-top:12px;max-width:70ch}
"""
ld = [{"@context": "https://schema.org", "@type": "FAQPage",
       "mainEntity": [{"@type": "Question", "name": it["q"], "acceptedAnswer": {"@type": "Answer", "text": it["a"]}} for _, it in items]}]
kw = sorted({k for _, it in items for k in it.get("keywords", [])})[:24]
script = """
<script>
(function(){
 var ff=document.getElementById('ff'), no=document.getElementById('noq');
 ff.addEventListener('input',function(){
   var v=ff.value.trim().toLowerCase(), hits=0;
   document.querySelectorAll('.fs').forEach(function(sec){
     var any=0;
     sec.querySelectorAll('details').forEach(function(d){
       var m=!v||d.textContent.toLowerCase().indexOf(v)>=0;
       d.hidden=!m; if(m){any++;hits++;} d.open=!!v&&m;
     });
     sec.hidden=!any;
   });
   no.hidden=hits>0;
 });
 var secs=[].slice.call(document.querySelectorAll('.fs')), links=[].slice.call(document.querySelectorAll('.toc a'));
 addEventListener('scroll',function(){
   var y=scrollY+140, cur=0;
   secs.forEach(function(s,i){ if(s.offsetTop<=y) cur=i; });
   links.forEach(function(a,i){ a.classList.toggle('on',i===cur); });
 },{passive:true});
})();
</script>"""
page = shell(title="NEW YORKERS FAQ · the collection, the lore, the release · by MLow",
             description=f"{len(items)} questions answered about NEW YORKERS by MLow: the idea, the lore, the eras and sets, the traits, how the release works, and what you actually own.",
             body=body, path="faq.html", active=None, jsonld=ld, keywords=kw, extra_css=extra_css,
             scripts_after='<script>NY.shareRow(document.getElementById("share"),{title:"NEW YORKERS FAQ",text:"Everything about NEW YORKERS by MLow, answered."});</script>' + script)
open(os.path.join(SITE, "faq.html"), "w", encoding="utf-8").write(page)
t = open(os.path.join(SITE, "faq.html"), encoding="utf-8").read()
assert "—" not in t and "–" not in t, "dash found in faq.html"
print("faq.html written, dash check clean")
