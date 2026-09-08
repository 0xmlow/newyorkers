#!/usr/bin/env python3
"""links.html: the tracked link builder. This is the "URL Builder" tool, done properly.

Builds a private (noindex) page that turns any destination on either site into a tracked link with
UTM parameters plus the site's own ?ref= convention, and draws a QR code for it with no library.
Reads the room registry and the article list so every room and every article is a one click destination.
Run after build_learn.py; part of build_all.sh.
"""
import json, os
from page_shell import shell, cfg
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
C = cfg(); URL = C["siteUrl"]

rooms = json.load(open(os.path.join(HERE, "rooms_full.json")))
articles = []
import glob
for f in sorted(glob.glob(os.path.join(HERE, "learn", "articles_*.json"))):
    articles += json.load(open(f, encoding="utf-8"))
shop = {"items": []}
sp = os.path.join(SITE, "assets", "shop.js")
if os.path.exists(sp):
    t = open(sp, encoding="utf-8").read(); shop = json.loads(t[t.index("=") + 1:].rstrip().rstrip(";"))

DESTS = [{"g": "The census", "n": "Home", "u": "/"},
         {"g": "The census", "n": "The census, 3D", "u": "/census.html"},
         {"g": "The census", "n": "The atlas", "u": "/map.html"},
         {"g": "The census", "n": "The museum", "u": "/museum.html"},
         {"g": "The census", "n": "Spin a random room", "u": "/museum.html#room=random"},
         {"g": "The census", "n": "Get counted", "u": "/counted.html"},
         {"g": "The census", "n": "Nominate a New Yorker", "u": "/counted.html#nominate"},
         {"g": "The census", "n": "The count", "u": "/count.html"},
         {"g": "The census", "n": "The reading room", "u": "/learn.html"},
         {"g": "The census", "n": "Prints", "u": "https://mlow.nyc"},
         {"g": "The census", "n": "Press room", "u": "/press.html"},
         {"g": "The census", "n": "Brand", "u": "/brand.html"}]
DESTS += [{"g": "A museum room", "n": r["name"] + " · " + r["area"].title(), "u": f"/museum.html#room={r['id']}"} for r in rooms]
DESTS += [{"g": "An article", "n": a["title"], "u": f"/learn/{a['slug']}.html"} for a in articles]
SHOP_DESTS = [{"g": "A print", "n": i["t"], "u": f"{shop.get('buy','')}/products/{i['h']}", "abs": True} for i in shop.get("items", [])]
SHOP_DESTS = [{"g": "The shop", "n": "The print shop", "u": shop.get("shop") or "https://mlow.xyz/prints", "abs": True}] + SHOP_DESTS

CHANNELS = [("x", "X, a post"), ("instagram", "Instagram, bio or story"), ("tiktok", "TikTok, bio"), ("newsletter", "The Letter, email"),
            ("press", "A press pitch"), ("print", "Something printed, a sticker or a card"), ("qr", "A QR code in the street"),
            ("partner", "A partner or an institution"), ("discord", "Discord or Telegram"), ("reddit", "Reddit"), ("paid", "A paid ad")]

body = """
<section class="wrap" style="padding-top:64px;padding-bottom:20px">
  <div class="kicker">Internal tool</div>
  <h1 class="h-xl" style="margin-top:14px;font-size:clamp(38px,5.4vw,84px)">The link builder.</h1>
  <p class="lede" style="margin-top:18px;max-width:800px;color:var(--slate)">Every link you hand out should say where it came from. Pick a destination, pick a channel, copy the link. The QR is for anything printed.</p>
  <p class="body" style="margin-top:12px;font-size:13px">This page is not indexed and is not in the menu. It is a tool, not a page.</p>
</section>
<section class="wrap" style="padding-bottom:100px">
  <div class="lb">
    <div class="fields">
      <label>Destination<select id="dest"></select></label>
      <label>Channel<select id="chan"></select></label>
      <label>Campaign<input id="camp" placeholder="launch" value="launch"></label>
      <label>Detail, optional<input id="content" placeholder="post-1, poster-a, the pigeon"></label>
      <div class="row"><label class="chk"><input type="checkbox" id="useUtm" checked> UTM parameters</label><label class="chk"><input type="checkbox" id="useRef" checked> the site's own ?ref=</label></div>
    </div>
    <div class="out">
      <div class="kicker" style="font-size:10px">The link</div>
      <textarea id="url" readonly rows="3"></textarea>
      <div class="acts"><button class="btn sm" id="copy">COPY</button><a class="btn ghost sm" id="open" target="_blank" rel="noopener">OPEN</a><button class="btn ghost sm" id="dl">DOWNLOAD QR</button></div>
      <canvas id="qr" width="360" height="360"></canvas>
    </div>
  </div>
  <div class="note">
    <p class="body"><b style="color:var(--cloud)">Why two systems.</b> UTM parameters are what Google Analytics and Search Console read. The <code>ref</code> parameter is the site's own, it survives into the forms as a hidden field, so a nomination or an allowlist signup can be traced back to the exact post that caused it. Keep both on unless a partner asks for a clean link.</p>
    <p class="body" style="margin-top:12px"><b style="color:var(--cloud)">The query goes before the hash.</b> A fragment never reaches a server log, so <code>?ref=x#room=coney</code> is tracked and <code>#room=coney?ref=x</code> is not. This tool always builds it the right way round.</p>
  </div>
</section>"""
extra_css = """
.lb{display:grid;grid-template-columns:1fr 1fr;gap:36px;align-items:start}
@media (max-width:900px){.lb{grid-template-columns:1fr}}
.fields{display:flex;flex-direction:column;gap:16px}
.fields label{display:flex;flex-direction:column;gap:7px;font-family:var(--mono);font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--slate)}
.fields select,.fields input,.out textarea{background:var(--card);border:1px solid var(--divider);color:var(--cloud);font-family:var(--sans);font-size:15px;padding:13px 14px;border-radius:6px;outline:none;width:100%}
.fields select:focus,.fields input:focus{border-color:var(--blue)}
.fields .row{flex-direction:row;gap:22px;flex-wrap:wrap}
.fields .chk{flex-direction:row;align-items:center;gap:9px;font-size:11px;letter-spacing:.14em;text-transform:none;color:var(--cloud)}
.fields .chk input{width:auto}
.out textarea{font-family:var(--mono);font-size:13px;line-height:1.6;resize:vertical;word-break:break-all}
.out .acts{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
#qr{margin-top:22px;background:#fff;border-radius:10px;padding:10px;width:230px;height:230px;image-rendering:pixelated}
.note{margin-top:44px;border-top:1px solid var(--divider);padding-top:22px;max-width:820px}
.note code{font-family:var(--mono);font-size:13px;color:var(--cyan);background:var(--card);padding:2px 6px;border-radius:4px}
"""
script = """
<script src="assets/qrcode.min.js"></script>
<script>
(function(){
 "use strict";
 var DESTS=__DESTS__, CHANNELS=__CHANNELS__, SITE=__SITE__;
 var $=function(s){return document.querySelector(s)};
 var groups={};
 DESTS.forEach(function(d){(groups[d.g]=groups[d.g]||[]).push(d)});
 $("#dest").innerHTML=Object.keys(groups).map(function(g){
   return '<optgroup label="'+g+'">'+groups[g].map(function(d,i){
     return '<option value="'+encodeURIComponent(d.u)+'" data-abs="'+(d.abs?1:0)+'">'+d.n.replace(/</g,"&lt;")+'</option>'}).join("")+'</optgroup>'}).join("");
 $("#chan").innerHTML=CHANNELS.map(function(c){return '<option value="'+c[0]+'">'+c[1]+'</option>'}).join("");
 function build(){
   var opt=$("#dest").selectedOptions[0];
   var raw=decodeURIComponent($("#dest").value);
   var base=opt.dataset.abs==="1"?raw:SITE+raw;
   var hash="", i=base.indexOf("#");
   if(i>=0){hash=base.slice(i);base=base.slice(0,i);}
   var q=[], ch=$("#chan").value, camp=($("#camp").value||"launch").trim(), det=($("#content").value||"").trim();
   if($("#useUtm").checked){
     q.push("utm_source="+encodeURIComponent(ch));
     q.push("utm_medium="+encodeURIComponent(ch==="paid"?"cpc":ch==="newsletter"?"email":ch==="qr"||ch==="print"?"offline":"social"));
     q.push("utm_campaign="+encodeURIComponent(camp));
     if(det) q.push("utm_content="+encodeURIComponent(det));
   }
   if($("#useRef").checked) q.push("ref="+encodeURIComponent(det?ch+"-"+det:ch));
   var url=base+(q.length?(base.indexOf("?")>=0?"&":"?")+q.join("&"):"")+hash;
   $("#url").value=url; $("#open").href=url; qr(url);
   return url;
 }
 ["#dest","#chan","#camp","#content","#useUtm","#useRef"].forEach(function(s){$(s).addEventListener("input",build);$(s).addEventListener("change",build)});
 $("#copy").onclick=function(){navigator.clipboard.writeText($("#url").value).then(function(){NY.toast("Link copied.")},function(){$("#url").select()})};
 $("#dl").onclick=function(){var a=document.createElement("a");a.href=$("#qr").toDataURL("image/png");a.download="new-yorkers-qr.png";a.click()};

 /* QR rendering uses the vendored qrcode-generator library (Kazuhiko Arase, MIT), self hosted at
    assets/qrcode.min.js so there is no CDN to go down. A hand written encoder was tried and thrown away:
    it disagreed with a reference implementation, and an unscannable code printed on a sticker is worse
    than no code at all. Scan one with a phone before committing to a print run. */
 function qr(text){
   var c=$("#qr"), g=c.getContext("2d");
   g.fillStyle="#fff"; g.fillRect(0,0,c.width,c.height);
   if(typeof qrcode!=="function"){ c.style.display="none"; return; }
   var m;
   try{ m=qrcode(0,"M"); m.addData(text); m.make(); }
   catch(e){ c.style.display="none"; return; }
   c.style.display="";
   var n=m.getModuleCount(), quiet=4, px=Math.floor(c.width/(n+quiet*2));
   var off=Math.floor((c.width-px*n)/2);
   g.fillStyle="#0D0D0D";
   for(var y=0;y<n;y++) for(var x=0;x<n;x++) if(m.isDark(y,x)) g.fillRect(off+x*px, off+y*px, px, px);
 }
 build();
})();
</script>"""
script = (script.replace("__DESTS__", json.dumps(DESTS + SHOP_DESTS, ensure_ascii=False))
                .replace("__CHANNELS__", json.dumps(CHANNELS))
                .replace("__SITE__", json.dumps(URL)))

open(os.path.join(SITE, "links.html"), "w", encoding="utf-8").write(
    shell(title="The link builder · NEW YORKERS", description="Internal tool: build tracked links and QR codes for the census and the print shop.",
          body=body, path="links.html", active=None, noindex=True, extra_css=extra_css, scripts_after=script))
print(f"links.html written: {len(DESTS)+len(SHOP_DESTS)} destinations, {len(CHANNELS)} channels")
